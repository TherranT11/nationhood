import{_ as C}from"./supabase-client-BXEzLDpS.js";import{e as m}from"./utils-C2W-HleY.js";import{i as bt}from"./messaging-5qyQ6ziq.js";import{c as ht,a as qe,E as ce,b as ve,d as Qe,e as $t,f as xt,h as ze}from"./equipment-DsuDdEne.js";const Ye={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},Q=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"manufacturing_output",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:50},{stat:"higher_education",min:40}]}},priceDrivers:["manufacturing_output","inflation","fuel_prices","urbanization"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:10}]},STD:{requirements:[{stat:"manufacturing_output",min:35},{stat:"rare_minerals",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:40},{stat:"higher_education",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","inflation","fuel_prices"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"arable_land",min:10}]},STD:{requirements:[{stat:"arable_land",min:30},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"arable_land",min:50},{stat:"manufacturing_output",min:30}]}},priceDrivers:["arable_land","physical_infrastructure","inflation"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"rare_minerals",min:15},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"rare_minerals",min:35},{stat:"manufacturing_output",min:25}]}},priceDrivers:["rare_minerals","physical_infrastructure","inflation"]},{key:"em",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:15}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"digital_infrastructure",min:25}]},HIGH:{requirements:[{stat:"manufacturing_output",min:55},{stat:"digital_infrastructure",min:50},{stat:"energy_generation",min:40}]}},priceDrivers:["manufacturing_output","digital_infrastructure","inflation","energy_generation"]},{key:"glass",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:20}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"digital_infrastructure",min:40},{stat:"higher_education",min:50}]}},priceDrivers:["manufacturing_output","standard_of_living","inflation"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"oil_and_gas",min:10}]},STD:{requirements:[{stat:"oil_and_gas",min:30},{stat:"manufacturing_output",min:25}]},HIGH:{requirements:[{stat:"oil_and_gas",min:45},{stat:"manufacturing_output",min:40},{stat:"physical_infrastructure",min:40}]}},priceDrivers:["oil_and_gas","manufacturing_output","inflation","fuel_prices"]},{key:"heavy",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:40},{stat:"rare_minerals",min:30}]},STD:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:45},{stat:"higher_education",min:40}]},HIGH:{requirements:[{stat:"manufacturing_output",min:75},{stat:"rare_minerals",min:60},{stat:"higher_education",min:55},{stat:"digital_infrastructure",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","higher_education","digital_infrastructure"]}];function ee(e,t,a){const i=Q.find(c=>c.key===e);if(!i)return{available:!1,failedStat:"unknown_material"};const s=i.tiers[t];if(!s)return{available:!1,failedStat:"unknown_tier"};for(const c of s.requirements){const o=Number(a?.[c.stat]??0);if(o<c.min)return{available:!1,failedStat:c.stat,failedMin:c.min,nationValue:o}}return{available:!0}}function Ne(e,t,a){const s={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em:{LOW:400,STD:700,HIGH:1200},glass:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy:{LOW:800,STD:1400,HIGH:2400}}[e]?.[t];if(!s)return 0;const c=Q.find(r=>r.key===e);if(!c)return s;let o=1;for(const r of c.priceDrivers){const l=Number(a?.[r]??50);r==="inflation"||r==="fuel_prices"?o*=1+(l-50)/200:o*=1-(l-50)/250}return o=Math.max(.4,Math.min(2.5,o)),Math.round(s*o)}function Ke(e,t,a){const s={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em:{LOW:1e3,STD:700,HIGH:300},glass:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy:{LOW:400,STD:200,HIGH:80}}[e]?.[t]||0,o=Q.find(n=>n.key===e)?.priceDrivers?.[0],l=.3+(o?Number(a?.[o]??50):50)/50*.7;return Math.round(s*l)}const Oe=["LOW","STD","HIGH"],Me={LOW:"Low",STD:"Standard",HIGH:"High"};let oe=[],v=null,T=null,S=null,ne=[],le={},z=[],D={},Le=-1,B="concrete",P="STD",te=500,W=[],Ae=0,R="trucks",F=0,V=1,J=[],ae=null,pe=[],Se=null,de=null,Be="ALL",Pe="TIMELINE";function L(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function wt(e){if(e>=12){const t=Math.floor(e/12),a=e%12;return a>0?t+"y "+a+"mo":t+"y"}return e+" ticks"}function H(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(1)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(0)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function fe(e){return e==="civil_engineering"?"CIVIL":e==="industrial"?"INDUSTRIAL":e==="mega_project"?"MEGA":e?.toUpperCase()||"—"}function Je(e){return e==="civil_engineering"?"light":e==="industrial"?"heavy":e==="mega_project"?"mega":"light"}function Et(){de&&clearInterval(de),de=setInterval(()=>{if(!Se)return;const e=Se-Date.now();if(e<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(de);return}const t=Math.floor(e/36e5),a=Math.floor(e%36e5/6e4),i=Math.floor(e%6e4/1e3);document.getElementById("tick-countdown").textContent=t+"h "+a+"m "+i+"s"},1e3)}function kt(){document.body.classList.toggle("light-mode");const e=document.getElementById("theme-toggle");e.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function Tt(e,t){e==="type"&&(Be=t),e==="sort"&&(Pe=t),document.querySelectorAll(`.filter-pill[data-filter="${e}"]`).forEach(a=>{a.classList.toggle("active",a.dataset.value===t)}),Ze()}function Xe(e){return!(!v||e.sector==="mega_project"&&v.corp_subsector!=="Megaprojects"||e.sector==="industrial"&&!["Heavy Infrastructure","Megaprojects"].includes(v.corp_subsector))}function Ze(){const e=document.getElementById("oc-list");let t=[...ne];if(Be==="GOVERNMENT"?t=t.filter(s=>s.issuer_type==="GOVERNMENT"):Be==="PRIVATE"&&(t=t.filter(s=>s.issuer_type==="PRIVATE")),Pe==="TIMELINE"&&t.sort((s,c)=>(s.timeline_ticks||0)-(c.timeline_ticks||0)),Pe==="BUDGET"&&t.sort((s,c)=>(c.budget_ceiling||0)-(s.budget_ceiling||0)),document.getElementById("oc-count").textContent=t.length+" AVAILABLE",t.length===0){e.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const a=S?.current_tick||0;let i="";for(const s of t){const c=s.issuer_type==="GOVERNMENT",o=c?"gov":"private",r=Xe(s),l=r?"":" locked",n=Je(s.sector),d=fe(s.sector),p=(s.timeline_ticks||0)>18?" warn":"",u=s.bidding_ends_tick?Math.max(0,s.bidding_ends_tick-a):"?";i+=`
            <div class="oc-item${l}" data-contract-id="${s.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${m(s.name)}</span>
                    <span class="oc-item__type-badge ${o}">${c?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${o}">${m(s.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${u} tick${u!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${H(s.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${p}">${wt(s.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${n}">${d}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${le[s.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${H(le[s.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${r?"yes":"no"}">${r?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${r?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openBidModal(contracts.find(x=>x.id==='${s.id}'))">${le[s.id]?"EDIT":"VIEW"}</button>`:""}
                </div>
                ${s.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${m(s.description)}</div>`:""}
            </div>`}e.innerHTML=i,e.querySelectorAll(".oc-item:not(.locked)").forEach(s=>{s.addEventListener("click",()=>{const c=s.dataset.contractId,o=ne.find(r=>r.id===c);o&&et(o)})})}let me=null;function et(e){me=e;const t=document.getElementById("cd-overlay"),a=e.contract_type==="GOVERNMENT",i=a?"gov":"private",s=(T?.name||v.nation||"—").toUpperCase(),c=Xe(e);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${m(s)}</span>
        <span class="cd-header__name">${m(e.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${i}">${m(e.issuer_name)}</span>
        <span class="cd-header__type-badge ${i}">${a?"GOV":"PRIVATE"}</span>
    `;const o=document.getElementById("cd-blueprint");e.blueprint_svg?(o.innerHTML=e.blueprint_svg,o.style.display=""):(o.innerHTML=Wt(e),o.style.display="");const r=e.permits_required||[],l=e.equipment_required||[],n=e.materials_estimated||[];let d="var(--teal)";e.spec_category==="Heavy Infrastructure"&&(d="var(--orange)"),e.spec_category==="Megaproject"&&(d="var(--red)");let p=L(e.budget),u=e.timeline_months+" Months",f="";f+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${m(e.contract_number)}</span>
            </div>
            <div class="cd-issue__tags">
                ${e.project_type?`<span class="cd-tag teal">${m(e.project_type.toUpperCase())}</span>`:""}
                ${e.project_subtype?`<span class="cd-tag gold">${m(e.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,e.description&&(f+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${m(e.description)}</div>
            </div>`),f+='<div class="cd-details">',e.project_type&&(f+=K("Type",e.project_type)),e.project_subtype&&(f+=K("Sub-Type",e.project_subtype)),f+=K("Specialization",e.spec_category,d),f+=K("Total Budget",p,"var(--green)"),f+=K("Timeline",u),f+=K("Nation",T?.name||v.nation||"—"),e.region&&(f+=K("Region",e.region)),f+="</div>",r.length>0&&(f+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${r.map(h=>{const w=h.status==="approved"?"approved":"required",q=h.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${w}">
                            <span class="cd-chip__icon">${q}</span>
                            <span class="cd-chip__label">${m(h.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),l.length>0&&(f+=`
            <div class="cd-items">
                <div class="cd-section-label">Required Equipment</div>
                <div class="cd-items__list">
                    ${l.map(h=>{const w=h.owned?"owned":"missing",q=h.owned?"&#10003;":"&#10007;";return`<div class="cd-chip ${w}">
                            <span class="cd-chip__icon">${q}</span>
                            <span class="cd-chip__label">${m(h.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),n.length>0&&(f+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${n.map(h=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${m(h.name)}</span>
                        <span class="cd-mat-row__qty">${m(String(h.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=f;const b=r.filter(h=>h.status==="approved").length,y=r.length-b,$=l.filter(h=>h.owned).length,_=l.length-$;let x="";l.length>0&&(_===0?x+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>':x+=`<span class="cd-footer__badge bad">${_} EQUIPMENT MISSING</span>`),r.length>0&&(y===0?x+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':x+=`<span class="cd-footer__badge warn">${y} PERMITS PENDING</span>`);const I=c,g=(v.action_points??0)>=2;document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${x}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            <button class="cd-btn primary" onclick="placeBid()" ${I&&g?"":"disabled"}
                title="${I?g?"Place a bid (2 AP)":"Need 2 AP to bid":"Not qualified for this contract"}">BID</button>
        </div>
    `,t.classList.add("open"),document.body.style.overflow="hidden"}function tt(e){e&&e.target&&e.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",me=null)}const It=[{key:"concrete",name:"Concrete",unit:"units"},{key:"steel",name:"Steel",unit:"units"},{key:"lumber",name:"Lumber",unit:"units"},{key:"aggregate",name:"Aggregate",unit:"units"},{key:"em_systems",name:"E&M Systems",unit:"units"},{key:"glass_facades",name:"Glass & Facades",unit:"units"},{key:"asphalt",name:"Asphalt",unit:"units"},{key:"heavy_parts",name:"Heavy Machinery Parts",unit:"units"}],Ct=[{key:"work_trucks",name:"Work Trucks",tier:1},{key:"excavators",name:"Excavators",tier:1},{key:"bulldozers",name:"Bulldozers",tier:1},{key:"concrete_mixers",name:"Concrete Mixers",tier:1},{key:"tower_cranes",name:"Tower Cranes",tier:2},{key:"heavy_haulers",name:"Heavy Haulers",tier:2},{key:"pile_drivers",name:"Pile Drivers",tier:2},{key:"asphalt_plants",name:"Asphalt Plants",tier:2}],at={LOW:.7,STANDARD:1,HIGH:1.4},st={LOW:35,STANDARD:65,HIGH:90},he=15;let N=null;function qt(e){if(!e)return;const t=e.required_materials||{},a=e.required_equipment||[],i=e.required_workforce||{},s={concrete:18e4,steel:25e4,lumber:12e4,aggregate:8e4,em_systems:32e4,glass_facades:28e4,asphalt:14e4,heavy_parts:4e5},c=It.filter(d=>t[d.key]>0).map(d=>({...d,qty:t[d.key],basePrice:s[d.key]||2e5,grade:d.key==="aggregate"?"LOW":"STANDARD",highDisabled:!1})),o=Ct.filter(d=>a.includes(d.key)).map(d=>({...d,owned:(W||[]).some(p=>p.equipment_key===d.key&&p.quantity>0)})),r=(i.general||100)+(i.skilled||20),l=e.budget_ceiling||1e8,n=Math.round(l*.03);N={contract:e,budgetCeiling:l,materials:c,laborCount:r,laborRate:15200,estimatedTicks:e.timeline_ticks||8,equipment:o,permits:[],overhead:n,markupPct:15,competitors:[],playerRep:v?.standing||50,requiredWorkforce:i},document.getElementById("bid-title").textContent="BID ASSEMBLY",document.getElementById("bid-subtitle").textContent=(e.name||"Contract")+" — "+fe(e.sector)+" — "+(e.issuer_name||"Government"),document.getElementById("bid-overlay").classList.add("open"),document.body.style.overflow="hidden",_e()}function it(e){e&&e.target!==document.getElementById("bid-overlay")||(document.getElementById("bid-overlay").classList.remove("open"),document.body.style.overflow="",N=null)}function A(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(2)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function Mt(e,t){if(!N)return;const a=N.materials[e];t==="HIGH"&&a.highDisabled||(a.grade=t,_e())}function Lt(e){N&&(N.laborCount=e,_e())}function At(e){N&&(N.markupPct=Number(e),_e())}function _e(){if(!N)return;const e=N;let t=0;for(const k of e.materials)k.lineCost=Math.round(k.qty*k.basePrice*at[k.grade]),t+=k.lineCost;const a=Math.round(e.laborCount*e.laborRate*e.estimatedTicks),i=Math.round(e.equipment.filter(k=>k.owned).length*12e3*e.estimatedTicks);let s=0;const c=e.overhead,o=t+a+i+s+c,r=Math.round(o*e.markupPct/100),l=o+r,n=l>e.budgetCeiling,d=r,p=Math.round(e.materials.reduce((k,U)=>k+st[U.grade],0)/e.materials.length),u=p>=80?"STRONG":p>=60?"PROMISING":p>=40?"UNCERTAIN":"POOR",f=p>=80?"var(--green)":p>=60?"var(--teal)":p>=40?"var(--orange)":"var(--red)",b=e.budgetCeiling>0?l/e.budgetCeiling:1,y=Math.max(0,Math.min(100,Math.round((1-b)*150))),$=y>=70?"STRONG":y>=40?"COMPETITIVE":y>=15?"WEAK":"UNLIKELY",_=y>=70?"var(--green)":y>=40?"var(--teal)":y>=15?"var(--orange)":"var(--red)",x=Math.round(o*(1-he/100)),I=Math.round(o*(1+he/100));let g="";g+='<div class="bid-section"><div class="bid-section__title">Materials</div>',e.materials.forEach((k,U)=>{const Y=ie=>{const yt=k.grade===ie,gt=ie==="HIGH"&&k.highDisabled;return`<button class="bid-grade-btn ${yt?ie==="LOW"?"active-low":ie==="HIGH"?"active-high":"active":""} ${gt?"disabled":""}" onclick="setBidGrade(${U},'${ie}')">${ie[0]}</button>`};g+=`<div class="bid-mat-row">
            <span class="bid-mat-row__name">${m(k.name)}</span>
            <span class="bid-mat-row__qty">×${k.qty}</span>
            <div class="bid-grade-btns">${Y("LOW")}${Y("STANDARD")}${Y("HIGH")}</div>
            <span class="bid-mat-row__cost">${A(k.lineCost)}</span>
        </div>`}),g+=`<div class="bid-line-total"><span class="bid-line-total__label">MATERIALS TOTAL</span><span class="bid-line-total__value">${A(t)}</span></div></div>`;const h=(e.requiredWorkforce?.general||80)+(e.requiredWorkforce?.skilled||20),w=[Math.round(h*.8),h,Math.round(h*1.2),Math.round(h*1.4),Math.round(h*1.6)];g+='<div class="bid-section"><div class="bid-section__title">Labor</div>',g+='<div class="bid-labor-presets">',w.forEach(k=>{g+=`<button class="bid-labor-btn ${e.laborCount===k?"active":""}" onclick="setBidLabor(${k})">${k}</button>`}),g+="</div>";const q=e.requiredWorkforce||{};g+=`<div class="bid-labor-formula">Required: ${q.general||"?"} general + ${q.skilled||"?"} skilled<br>`,g+=`${e.laborCount} workers × ${A(e.laborRate)}/tick × ${e.estimatedTicks} ticks = <strong>${A(a)}</strong></div>`,g+=`<div class="bid-line-total"><span class="bid-line-total__label">LABOR TOTAL</span><span class="bid-line-total__value">${A(a)}</span></div></div>`,g+='<div class="bid-section"><div class="bid-section__title">Equipment</div>',e.equipment.forEach(k=>{const U=k.owned?"bid-equip-row__status--owned":"bid-equip-row__status--missing",Y=k.owned?"✓ OWNED":"✗ NOT OWNED";g+=`<div class="bid-equip-row"><span class="bid-equip-row__name">${m(k.name)}</span><span class="bid-equip-row__status ${U}">${Y}</span></div>`}),g+=`<div class="bid-line-total"><span class="bid-line-total__label">MAINTENANCE (${e.estimatedTicks}t)</span><span class="bid-line-total__value">${A(i)}</span></div></div>`,g+='<div class="bid-section"><div class="bid-section__title">Permits</div>',g+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);padding:8px 0;">No permits required yet.</div>',g+='<div class="bid-line-total"><span class="bid-line-total__label">PERMITS TOTAL</span><span class="bid-line-total__value">$0</span></div></div>',g+='<div class="bid-section"><div class="bid-section__title">Overhead &amp; Contingency</div>',g+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Site management, insurance, admin</div>',g+=`<div class="bid-line-total"><span class="bid-line-total__label">OVERHEAD</span><span class="bid-line-total__value">${A(c)}</span></div></div>`,document.getElementById("bid-left").innerHTML=g;let E="";E+='<div class="bid-section"><div class="bid-section__title">Cost Summary</div>',E+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Materials</span><span class="bid-summary-row__value">${A(t)}</span></div>`,E+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Labor</span><span class="bid-summary-row__value">${A(a)}</span></div>`,E+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Equipment Maint.</span><span class="bid-summary-row__value">${A(i)}</span></div>`,E+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Permits</span><span class="bid-summary-row__value">${A(s)}</span></div>`,E+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Overhead</span><span class="bid-summary-row__value">${A(c)}</span></div>`,E+=`<div class="bid-cost-total"><span class="bid-cost-total__label">ESTIMATED COST</span><span class="bid-cost-total__value">${A(o)}</span></div>`,E+=`<div class="bid-accuracy">⚠ Estimate accuracy: ±${he}%<br>Actual cost range: ${A(x)} — ${A(I)}</div>`,E+="</div>",E+='<div class="bid-section"><div class="bid-section__title">Markup</div>',E+=`<div class="bid-slider-wrap">
        <div class="bid-slider-label"><span class="bid-slider-label__pct">${e.markupPct}%</span><span style="color:var(--text-dim)">${A(r)}</span></div>
        <input type="range" class="bid-slider" min="0" max="40" value="${e.markupPct}" oninput="setBidMarkup(this.value)">
    </div></div>`,E+=`<div class="bid-price-hero ${n?"bid-price-hero--over":""}">
        <div class="bid-price-hero__label">YOUR BID PRICE</div>
        <div class="bid-price-hero__value">${A(l)}</div>
        ${n?'<div class="bid-price-hero__warning">EXCEEDS BUDGET CEILING ('+A(e.budgetCeiling)+")</div>":""}
    </div>`,E+=`<div class="bid-profit"><span class="bid-profit__label">PROJECTED PROFIT</span><span class="bid-profit__value">+${A(d)}</span></div>`,E+=`<div class="bid-compete">
        <div style="display:flex;justify-content:space-between;"><span class="bid-compete__label" style="color:${_}">${$}</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Competitiveness</span></div>
        <div class="bid-compete__bar-wrap"><div class="bid-compete__bar" style="width:${y}%;background:${_}"></div></div>
    </div>`,E+=`<div class="bid-quality">
        <div style="display:flex;justify-content:space-between;"><span class="bid-quality__label" style="color:${f}">${u} (${p}/100)</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Quality Estimate</span></div>
        <div class="bid-quality__bar-wrap"><div class="bid-quality__bar" style="width:${p}%;background:${f}"></div></div>
    </div>`,E+='<div class="bid-section" style="margin-top:8px;"><div class="bid-section__title">Competing Bids</div>',e.competitors.forEach(k=>{E+=`<div class="bid-competitor"><span class="bid-competitor__name">${m(k.name)}</span><span class="bid-competitor__rep">Rep ${k.rep}</span></div>`}),E+=`<div class="bid-competitor" style="color:var(--gold);"><span class="bid-competitor__name">You</span><span class="bid-competitor__rep">Rep ${e.playerRep}</span></div>`,E+="</div>",document.getElementById("bid-right").innerHTML=E,document.getElementById("bid-footer-price").textContent=A(l),document.getElementById("bid-footer-price").style.color=n?"var(--red)":"var(--gold)",document.getElementById("bid-footer-profit").textContent="+"+A(d),document.getElementById("bid-footer-quality").textContent=p+"/100",document.getElementById("bid-footer-quality").style.color=f,document.getElementById("bid-submit-btn").disabled=n}window.openBidModal=qt;window.closeBidModal=it;window.setBidGrade=Mt;window.setBidLabor=Lt;window.setBidMarkup=At;let $e=!1;async function St(){if(!N||!v||$e)return;const e=N,t=e.contract;let a=0;const i={};for(const p of e.materials)a+=Math.round(p.qty*p.basePrice*at[p.grade]),i[p.key]=p.grade;const s=Math.round(e.laborCount*e.laborRate*e.estimatedTicks),c=Math.round(e.equipment.filter(p=>p.owned).length*12e3*e.estimatedTicks),o=a+s+c+e.overhead,r=Math.round(o*e.markupPct/100),l=o+r,n=Math.round(e.materials.reduce((p,u)=>p+st[u.grade],0)/(e.materials.length||1));if(l>e.budgetCeiling){alert("Bid exceeds budget ceiling. Lower your costs or markup.");return}const d=document.getElementById("bid-submit-btn");d.disabled=!0,d.textContent="SUBMITTING...",$e=!0;try{const{data:p}=await C.from("shard").select("current_tick").eq("name","Alpha Shard").single(),u=p?.current_tick||0,{data:f}=await C.from("contract_bids").select("id").eq("contract_id",t.id).eq("faction_id",v.id).maybeSingle();if(f){const{error:y}=await C.from("contract_bids").update({bid_price:l,material_grades:i,labor_count:e.laborCount,markup_pct:e.markupPct,estimated_cost:o,estimated_quality:n,submitted_at_tick:u}).eq("id",f.id);if(y)throw y}else{const{error:y}=await C.from("contract_bids").insert({contract_id:t.id,faction_id:v.id,bid_price:l,material_grades:i,labor_count:e.laborCount,markup_pct:e.markupPct,estimated_cost:o,estimated_quality:n,status:"pending",submitted_at_tick:u});if(y)throw y}it();const b=document.getElementById("oc-count");if(b){const y=b.textContent;b.textContent="✓ BID SUBMITTED",b.style.color="var(--green)",setTimeout(()=>{b.textContent=y,b.style.color=""},2e3)}await ot()}catch(p){console.error("Bid submission failed:",p),alert("Failed to submit bid: "+(p.message||"Unknown error")),d.disabled=!1,d.textContent="SUBMIT BID"}finally{$e=!1}}window.submitBid=St;const X=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],We={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},je={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let M=null;function Bt(e){const t=z.find(q=>q.id===e);if(!t)return;const a=Array.isArray(t.contract_bids)?t.contract_bids[0]:t.contract_bids,i=S?.current_tick||0,s=t.awarded_at_tick||i,c=t.timeline_ticks||8,o=Math.max(0,i-s),r=Math.min(100,o/c*100);let l=Math.min(X.length-1,Math.floor(r/(100/X.length)));const n=Math.round(r%(100/X.length)/(100/X.length)*100),d=t.required_materials||{},p=a?.material_grades||{},u=Object.entries(d).map(([q,E])=>{const k=p[q]||"STANDARD",U=Math.round(E*(r/100)*(.6+Math.random()*.4));return{key:q,name:q.replace(/_/g," ").replace(/\b\w/g,Y=>Y.toUpperCase()),grade:k,allocated:E,used:Math.min(U,E)}}),b=(t.required_equipment||[]).map(q=>({key:q,name:q.replace(/_/g," ").replace(/\b\w/g,E=>E.toUpperCase()),qty:1+Math.floor(Math.random()*3),condition:55+Math.floor(Math.random()*40)})),y=t.budget_ceiling||0,$=a?.estimated_cost||0,_=Math.round($*Math.min(1,o/c)),x=a?.estimated_quality||65,I=x>=80?"STRONG":x>=60?"PROMISING":x>=40?"FAIR":"UNCERTAIN",g=t.required_workforce||{},h=(g.general||0)+(g.skilled||0),w=a?.labor_count||h;M={project:t,bid:a,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:i,awardedTick:s,totalTicks:c,ticksElapsed:o,phaseIdx:l,phaseProgress:n,materials:u,equipment:b,budget:y,estCost:$,spent:_,quality:x,qualityLabel:I,laborCount:w,wfNeeded:h,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",nt(t.id).then(()=>se()),se()}function Pt(e){e&&e.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",M=null)}function Dt(e){M&&(M.tab=e,M.expandedEvent=-1,M.selectedResponse=null,se())}function Nt(e){M&&(M.expandedEvent=M.expandedEvent===e?-1:e,M.selectedResponse=null,se())}function Ot(e){M&&(M.selectedResponse=M.selectedResponse===e?null:e,se())}function se(){if(!M)return;const e=M,t=e.project,a=t.issuer_type==="GOVERNMENT",i=fe(t.sector),s=v?.nation||"Nation",c=e.awardedTick+e.totalTicks,o=Math.max(0,c-e.currentTick),r=e.currentTick>c,l=e.budget>0?Math.round(e.spent/e.budget*100):0,n=l>85?"var(--red)":l>60?"var(--amber)":"var(--teal)",d=e.budget-e.spent,p=e.events.filter($=>$.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${m(s.toUpperCase())}</span>
                <span class="pm-hdr__name">${m(t.name)}</span>
                <span style="color:var(--text-dim);font-size:12px">—</span>
                <span class="pm-hdr__issuer">${m(t.issuer_name||"—")}</span>
                <span class="pm-hdr__type">${a?"GOV":"PVT"}</span>
            </div>
            <button class="pm-hdr__close" onclick="closeProjectModal()">×</button>
        </div>
        <div class="pm-hdr__row2">
            <span class="pm-hdr__id">${m(t.template_key||t.id)}</span>
            <span class="pm-hdr__badge pm-hdr__badge--spec">${m(i.toUpperCase())}</span>
            <span class="pm-hdr__badge pm-hdr__badge--sub">${m((t.sector||"").replace(/_/g," ").toUpperCase())}</span>
        </div>
    `;let u='<div class="pm-phase__bar">';for(let $=0;$<X.length;$++){const _=$<e.phaseIdx,x=$===e.phaseIdx;u+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${_?"done":x?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${_?"done":x?"active":""}">${X[$]}</span>
        </div>`}u+="</div>",u+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${X[e.phaseIdx]} — ${e.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${r?"var(--red)":"var(--text-secondary)"}">Tick ${e.ticksElapsed} / ${e.totalTicks}${r?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=u;const f=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:p},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=f.map($=>`<button class="pm-tab${e.tab===$.id?" active":""}" onclick="pmSetTab('${$.id}')">
            ${$.label}${$.badge>0?`<span class="pm-tab__badge">${$.badge}</span>`:""}
        </button>`).join("");let b="";e.tab==="overview"?b=Rt(e,t,n,l,d,o,r):e.tab==="events"?b=Ht(e):e.tab==="materials"?b=Gt(e):e.tab==="equipment"&&(b=Ut(e)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${b}</div>`;let y="";p>0&&(y+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${p} EVENT${p>1?"S":""} REQUIRES RESPONSE</span>`),y+=`<span class="pm-ftr__badge" style="color:${e.quality>=70?"var(--green)":e.quality>=50?"var(--amber)":"var(--orange)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${e.quality}/100 — ${e.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${y}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function Rt(e,t,a,i,s,c,o){const r=xe(e.awardedTick+e.totalTicks);xe(e.awardedTick+e.totalTicks);const l=xe(e.awardedTick),n=[{label:"Budget",value:H(e.budget),sub:`${i}% spent`,color:a},{label:"Spent",value:H(e.spent),color:"var(--red)"},{label:"Remaining",value:H(s),color:"var(--green)"},{label:"Quality",value:`${e.quality}/100`,sub:e.qualityLabel,color:e.quality>=70?"var(--green)":e.quality>=50?"var(--amber)":"var(--red)"},{label:"Workforce",value:`${e.laborCount}/${e.wfNeeded}`,sub:`Bid: ${e.laborCount}`,color:e.laborCount<e.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${c} ticks`,sub:o?"OVERDUE":`Deadline: ${r}`,color:o?"var(--red)":"var(--text-bright)"}];let d="";d+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${m(t.description||t.name)}</div>
    </div></div>`,d+='<div class="pm-metrics">';for(const u of n)d+=`<div class="pm-metric">
            <div class="pm-metric__label">${u.label}</div>
            <div class="pm-metric__value" style="color:${u.color}">${u.value}</div>
            ${u.sub?`<div class="pm-metric__sub">${m(u.sub)}</div>`:""}
        </div>`;d+="</div>",d+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${l}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${o?"var(--red)":"var(--text-bright)"};font-weight:700">${r}</span></span>
        </div>
    </div></div>`;const p=[];if((t.sector==="civil_engineering"||t.sector==="industrial"||t.sector==="mega_project")&&(p.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),p.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),t.sector!=="civil_engineering"&&p.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),p.length>0){d+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const u of p)d+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${m(u.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;d+="</div></div>"}return d}function Ht(e){if(e.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let t="";for(let a=0;a<e.events.length;a++){const i=e.events[a],s=e.expandedEvent===a,c=i.status==="ACTIVE",o=We[i.type]||We.WEATHER,r=je[i.severity]||je.LOW;if(t+=`<div class="pm-evt ${c?"pm-evt--active":"pm-evt--resolved"}" style="${c?`border-left-color:${o.color}`:""}">`,t+=`<div class="pm-evt__header" onclick="pmToggleEvent(${a})" style="${s?`background:${o.bg}`:""}">`,t+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${o.color};background:${o.bg};border:1px solid ${o.border}">${i.type}</span>
            <span class="pm-evt__sev-badge" style="color:${r}">${i.severity}</span>
            <span class="pm-evt__status" style="color:${c?"var(--red)":"var(--text-dim)"};font-weight:${c?"700":"400"}">${c?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,t+=`<div class="pm-evt__title">${m(i.title)}</div>`,t+=`<div class="pm-evt__meta">Tick ${i.tick} · ${m(i.id||"")}</div>`,s){if(t+='<div class="pm-evt__body">',t+=`<div class="pm-evt__desc">${m(i.desc)}</div>`,i.impact&&(t+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${m(i.impact)}</span>
                </div>`),c&&i.responses&&i.responses.length>0){t+='<div class="pm-evt__resp-title">Response Options</div>';for(let l=0;l<i.responses.length;l++){const n=i.responses[l],d=e.selectedResponse===l,u={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[n.tag]||"var(--text-secondary)";t+=`<div class="pm-resp${d?" selected":""}" style="${d?`border-color:${u}`:""}" onclick="event.stopPropagation();pmSelectResponse(${l})">`,t+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${m(n.label)}</span>
                            <span class="pm-resp__tag" style="color:${u};background:${u}12;border:1px solid ${u}25">${n.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${n.delay>0?"var(--orange)":"var(--green)"}">
                            ${n.delay>0?`+${n.delay} tick${n.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,t+=`<div class="pm-resp__detail">${m(n.detail)}</div>`,t+='<div class="pm-resp__costs">',n.cost&&(t+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${H(n.cost)}</span>`),n.qualityImpact&&n.qualityImpact!==0&&(t+=`<span class="pm-resp__cost" style="color:${n.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${n.qualityImpact>0?"+":""}${n.qualityImpact}</span>`),!n.cost&&(!n.qualityImpact||n.qualityImpact===0)&&(t+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),t+="</div>",d&&(t+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${u}" onclick="event.stopPropagation();confirmEventResponse('${i.id}','${n.key}')">CONFIRM</button>
                        </div>`),t+="</div>"}}!c&&i.resolution&&(t+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${m(i.resolution)}</div>
                </div>`),t+="</div>"}t+="</div></div>"}return t}function Gt(e){if(e.materials.length===0)return'<div class="pm-evt-empty">No materials allocated to this project.</div>';let t='<div class="pm-tab-header">Allocated Materials</div>';for(const a of e.materials){const i=a.allocated>0?Math.round(a.used/a.allocated*100):0,s=a.grade==="HIGH"?"high":a.grade==="LOW"?"low":"std",c=a.grade==="HIGH"?"var(--green)":a.grade==="LOW"?"var(--orange)":"var(--amber)";t+=`<div class="pm-mat">
            <div class="pm-mat__row1">
                <div class="pm-mat__left">
                    <span class="pm-mat__name">${m(a.name)}</span>
                    <div class="pm-mat__grade-dot pm-mat__grade-dot--${s}"></div>
                    <span class="pm-mat__grade" style="color:${c}">${a.grade}</span>
                </div>
                <span class="pm-mat__qty">${a.used.toLocaleString()} / ${a.allocated.toLocaleString()}</span>
            </div>
            <div class="pm-mat__bar-row">
                <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${i}%"></div></div>
                <span class="pm-mat__pct">${i}% consumed</span>
            </div>
        </div>`}return t}function Ut(e){if(e.equipment.length===0)return'<div class="pm-evt-empty">No equipment deployed to this project.</div>';let t='<div class="pm-tab-header">Deployed Equipment</div>';for(const a of e.equipment){const i=a.condition>=75?"var(--green)":a.condition>=50?"var(--amber)":a.condition>=25?"var(--orange)":"var(--red)",s=a.condition<60;t+=`<div class="pm-eq">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${m(a.name)}</span>
                    <span class="pm-eq__qty">×${a.qty}</span>
                    ${s?'<span class="pm-eq__wear">WEAR</span>':""}
                </div>
            </div>
            <div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${a.condition}%;background:${i}"></div></div>
                <span class="pm-eq__cond-val" style="color:${i}">${a.condition}%</span>
            </div>
        </div>`}return t}function xe(e){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][e%12]}, ${2e3+Math.floor(e/12)}`}window.openProjectModal=Bt;window.closeProjectModal=Pt;window.pmSetTab=Dt;window.pmToggleEvent=Nt;window.pmSelectResponse=Ot;async function nt(e){if(!M)return;const{data:t,error:a}=await C.from("construction_events").select("*").eq("contract_id",e).order("fired_at_tick",{ascending:!1});a?(console.warn("Failed to load project events:",a.message),M.events=[]):M.events=(t||[]).map(i=>({id:i.id,type:i.type,severity:i.severity,tick:i.fired_at_tick,title:i.title,desc:i.description,impact:i.impact,status:i.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:i.resolution,responses:i.responses||[]})),se()}let we=!1;async function zt(e,t){if(!(we||!M)){we=!0;try{const{data:a,error:i}=await C.rpc("resolve_construction_event",{p_event_id:e,p_response_key:t});if(i){console.error("Failed to resolve event:",i.message),alert("Failed to submit response: "+i.message);return}const s=typeof a=="string"?JSON.parse(a):a;if(s?.error){alert("Error: "+s.error);return}await nt(M.project.id),await rt(),s?.quality_applied&&s.quality_applied!==0&&(M.quality=Math.max(0,Math.min(100,M.quality+s.quality_applied)),M.qualityLabel=M.quality>=80?"STRONG":M.quality>=60?"PROMISING":M.quality>=40?"FAIR":"UNCERTAIN"),se()}finally{we=!1}}}window.confirmEventResponse=zt;function K(e,t,a){const i=a?` style="color:${a}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${m(e)}</span>
        <span class="cd-detail-row__value"${i}>${m(t)}</span>
    </div>`}function Wt(e){const t={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},a=e.drawing_number||e.contract_number+"-A1",i=S?.current_date||"",s=i?i.replace(/,\s*/," "):"",c=e.spec_category==="Heavy Infrastructure",o=e.spec_category==="Megaproject";let r=m(e.project_subtype||e.project_type||"STRUCTURE"),l=c?"80.0m":o?"200.0m":"60.0m",n=c?"40.0m":o?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${t.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(d,p)=>`<line x1="${p*20}" y1="0" x2="${p*20}" y2="200" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(d,p)=>`<line x1="0" y1="${p*20}" x2="680" y2="${p*20}" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${t.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${t.accent}" font-family="var(--font-mono)" font-weight="700">${r.toUpperCase()}</text>
        <text x="340" y="100" text-anchor="middle" font-size="6" fill="${t.text}" font-family="var(--font-mono)">${m(e.name)}</text>

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
        <text x="645" y="93" text-anchor="middle" font-size="5.5" fill="${t.dim}" font-family="var(--font-mono)" transform="rotate(90,645,93)">${n}</text>

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
        <text x="540" y="175" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">${m(a)}</text>
        <text x="500" y="185" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">SCALE</text>
        <text x="540" y="185" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">1:200</text>
        <text x="610" y="175" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">REV</text>
        <text x="630" y="175" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">01</text>
        <text x="610" y="185" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">DATE</text>
        <text x="630" y="185" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">${m(s)}</text>

        <!-- North arrow -->
        <g transform="translate(470,172)">
            <line x1="0" y1="12" x2="0" y2="0" stroke="${t.accent}" stroke-width="0.8"/>
            <polygon points="-3,4 0,0 3,4" fill="${t.accent}"/>
            <text x="0" y="-3" text-anchor="middle" font-size="5" fill="${t.text}" font-family="var(--font-mono)">N</text>
        </g>
    </svg>`}let Ee=!1;async function jt(){if(Ee||!me||!v)return;if((v.action_points??0)<2){alert("You need at least 2 AP to place a bid.");return}Ee=!0;const e=document.querySelector(".cd-btn.primary");e&&(e.disabled=!0,e.textContent="...");try{const{data:t,error:a}=await C.rpc("deduct_ap",{p_faction_id:v.id,p_cost:2});if(a)throw a;if(t<0){const s=-t-1;v.action_points=s,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+s+" AP</span>",e&&(e.disabled=!1,e.textContent="BID"),alert("Insufficient AP. You have "+s+" AP, need 2.");return}const{error:i}=await C.from("corp_contract_bids").insert({contract_id:me.id,faction_id:v.id,nation_id:v.nation_id,ap_spent:2,created_at_tick:S?.current_tick||null});if(i)throw await C.rpc("deduct_ap",{p_faction_id:v.id,p_cost:-2}),v.action_points=t+2,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+(t+2)+" AP</span>",i;v.action_points=t,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+t+" AP</span>",e&&(e.textContent="BID PLACED")}catch(t){e&&(e.disabled=!1,e.textContent="BID"),t.code==="23505"?alert("You have already placed a bid on this contract."):alert("Failed to place bid: "+(t.message||"Unknown error"))}finally{Ee=!1}}async function ot(){if(!v||!v.nation_id)return;const{data:e,error:t}=await C.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(t?(console.warn("Failed to load contracts:",t.message),ne=[]):ne=e||[],le={},v&&ne.length>0){const a=ne.map(s=>s.id),{data:i}=await C.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",v.id).in("contract_id",a);for(const s of i||[])le[s.contract_id]=s}Ze()}function Ft(){const e=document.getElementById("ap-list"),t=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=z.length+" ACTIVE",z.length===0){e.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,t.style.display="none";return}const a=S?.current_tick||0;let i=0,s=0,c="";for(const o of z){const r=o.issuer_type==="GOVERNMENT",l=r?"gov":"private",n=Array.isArray(o.contract_bids)?o.contract_bids[0]:o.contract_bids,d=n?.bid_price||0,p=n?.estimated_cost||0,u=n?.estimated_quality||0,f=o.budget_ceiling||0,b=o.awarded_at_tick||a,y=b+(o.timeline_ticks||8),$=Math.max(0,y-a),_=Math.max(0,a-b),x=o.timeline_ticks||8,I=Math.min(100,Math.round(_/x*100)),g=a>y;Je(o.sector);const h=fe(o.sector);i+=f,s+=d,c+=`<div class="ap-item" onclick="openProjectModal('${o.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${m(o.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${m(o.issuer_name||"—")} · ${h}</div>
                </div>
                <span class="oc-item__type-badge ${l}">${r?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS</span>
                    <span class="ap-budget__values" style="color:${g?"var(--red)":"var(--teal)"}">
                        ${_}/${x} ticks ${g?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${I}%;background:${g?"var(--red)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${H(d)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${H(p)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${u>=70?"var(--green)":u>=40?"var(--teal)":"var(--orange)"}">${u}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${g?"var(--red)":"var(--text-bright)"}">${$} ticks</div>
                </div>
            </div>
        </div>`}e.innerHTML=c,t.style.display=z.length>0?"":"none",z.length>0&&(document.getElementById("ap-total-crew").textContent=z.length,document.getElementById("ap-total-budget").textContent=H(i),document.getElementById("ap-total-spent").textContent=H(s))}async function rt(){if(!v)return;const{data:e,error:t}=await C.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",v.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",v.id).order("awarded_at_tick",{ascending:!0});t?(console.warn("Failed to load active projects:",t.message),z=[]):z=e||[],Ft()}const lt=3e4;function ct(){let e=0,t=0;for(const a of Q)for(const i of Oe){const s=D[a.key]?.[i];s&&(e+=s.qty,t+=s.value)}return{totalUnits:e,totalValue:t}}function Re(){const e=document.getElementById("wh-list"),{totalUnits:t,totalValue:a}=ct();document.getElementById("wh-count").textContent=t.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=L(a);const i=Math.round(t/lt*100),s=document.getElementById("wh-capacity");s.textContent=i+"%",s.style.color=i>80?"var(--red)":i>50?"var(--orange)":"var(--green)";let c="";for(let o=0;o<Q.length;o++){const r=Q[o],l=Le===o,n=D[r.key]?.LOW||{qty:0,value:0},d=D[r.key]?.STD||{qty:0,value:0},p=D[r.key]?.HIGH||{qty:0,value:0},u=n.qty+d.qty+p.qty,f=n.value+d.value+p.value,b=u===0,y=ee(r.key,"LOW",T),$=ee(r.key,"STD",T),_=ee(r.key,"HIGH",T),x=n.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",I=d.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",g=_.available?p.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(c+='<div class="wh-row">',c+=`<div class="wh-row__collapsed${l?" expanded":""}" onclick="toggleWhRow(${o})">
            <span class="wh-row__arrow">${l?"▾":"▸"}</span>
            <span class="wh-row__name${b?" empty":""}">${m(r.name)}</span>
            <div class="wh-row__dots">
                <div class="${x}"></div>
                <div class="${I}"></div>
                <div class="${g}"></div>
            </div>
            <span class="wh-row__qty${b?" empty":""}">${u>0?u.toLocaleString():"—"}</span>
            <span class="wh-row__val${b?" empty":""}">${f>0?L(f):"—"}</span>
        </div>`,l){c+='<div class="wh-expand">',c+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const h=[{key:"LOW",label:"Low",data:n,avail:y,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:d,avail:$,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:p,avail:_,color:"var(--green)",dotClass:"wh-dot--high"}];for(const w of h){const q=!w.avail.available,E=w.data.qty>0,k=E?"$"+Math.round(w.data.value/w.data.qty):"—";c+=`<div class="wh-grade${q?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${w.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${q?"var(--red)":w.color}">${w.label}</span>
                        ${q?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${E?"var(--text-bright)":"var(--text-dim)"}">${E?w.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${w.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${w.data.value>0?L(w.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${k}</span>
                </div>`}for(const w of h)!w.avail.available&&w.avail.failedStat&&(c+=`<div class="wh-lock">
                        <span class="wh-lock__text">${w.label.toUpperCase()} GRADE LOCKED — ${m(w.avail.failedStat)} &lt; ${w.avail.failedMin}</span>
                    </div>`);c+="</div>"}c+="</div>"}e.innerHTML=c}function Vt(e){Le=Le===e?-1:e,Re()}async function Qt(){if(!v)return;const{data:e,error:t}=await C.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",v.id);if(D={},t)console.warn("Failed to load warehouse:",t.message);else if(e)for(const a of e)D[a.material_key]||(D[a.material_key]={}),D[a.material_key][a.quality_tier]={qty:a.quantity||0,value:Number(a.total_value)||0};Re()}const Yt={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function dt(){const e=(T?.name||v?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+e;const t=Number(v?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=L(t);const{totalUnits:a}=ct(),i=Math.round(a/lt*100),s=document.getElementById("pr-wh-capacity");s.textContent=i+"%",s.style.color=i>80?"var(--red)":i>50?"var(--orange)":"var(--green)",pt(),He(),ye()}function pt(){const e=document.getElementById("pr-mat-grid");let t="";for(const a of Q){const i=B===a.key,s=Oe.every(o=>!ee(a.key,o,T).available),c="pr-mat-btn"+(i?" active":"")+(s?" all-locked":"");t+=`<span class="${c}" onclick="setPrMat('${a.key}')">${m(a.name)}</span>`}e.innerHTML=t}function He(){const e=document.getElementById("pr-tier-bar");let t='<span class="pr-tier-label">GRADE</span>';for(const a of Oe){const i=ee(B,a,T),s=P===a,c=i.available?Ne(B,a,T):null,o=Ye[a],r=!i.available,l="pr-tier-btn"+(s?" active":"")+(r?" locked":"");t+=`<div class="${l}" onclick="${r?"":`setPrTier('${a}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${o};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${s?"var(--text-bright)":"var(--text-dim)"}">${Me[a]}</span>
            </div>
            ${c!==null?`<div class="pr-tier-btn__price" style="color:${s?"var(--text-bright)":"var(--text-muted)"}">$${c}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}e.innerHTML=t}function ye(){const e=document.getElementById("pr-content"),t=ee(B,P,T),a=Q.find(_=>_.key===B);if(!a)return;if(!t.available){e.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${m(a.name)} — ${Me[P]} grade
                    is not produced domestically in ${m(T?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${m(t.failedStat||"unknown")} &lt; ${t.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const i=Ne(B,P,T),s=Ke(B,P,T),c=i*te,o=s>3e3?"LOW":s>1e3?"MODERATE":"HIGH",r=o==="LOW"?"var(--green)":o==="MODERATE"?"var(--amber)":"var(--red)",l=Number(T?.inflation??50),n=l>55?"up":l<45?"down":"flat",d=n==="up"?"&#9650;":n==="down"?"&#9660;":"&#8212;",p=n==="up"?"var(--red)":n==="down"?"var(--green)":"var(--text-dim)";let u="";u+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${i}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${p}">${d}</span>
                </div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">SUPPLY/TICK</div>
                <div class="pr-market-cell__value" style="font-size:14px;color:var(--text-bright);margin-top:2px;">${s.toLocaleString()}</div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">DEMAND</div>
                <div class="pr-market-cell__value" style="font-size:12px;color:${r};margin-top:2px;">${o}</div>
            </div>
        </div>
    </div>`,u+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${m(T?.name||"—")})</div>`;for(const _ of a.priceDrivers){const x=Number(T?.[_]??50),I=x>=50?"var(--green)":x>=30?"var(--amber)":x>=15?"var(--orange)":"var(--red)",g=Yt[_]||_;u+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${m(_)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${x}%;background:${I}"></div>
            </div>
            <span class="pr-driver-row__val">${x}</span>
            <span class="pr-driver-row__effect">${m(g)}</span>
        </div>`}u+="</div>";const b=(Number(v?.corp_cash_reserves)||0)>=c,y=te>s,$=Ye[P];u+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${m(a.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${$};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${$}">${Me[P]}</span>
                </div>
                <span class="pr-order__mat-price">$${i}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(_=>`<span class="pr-qty-btn${te===_?" active":""}" onclick="setPrQty(${_})">${_>=1e3?_/1e3+"k":_}</span>`).join("")}
                </div>
            </div>
            ${y?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${s.toLocaleString()} this tick</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${L(c)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${b&&!y?"":"disabled"}
                    title="${b?y?"Exceeds supply":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,e.innerHTML=u}function Kt(e){B=e,P="STD";for(const t of["STD","HIGH","LOW"])if(ee(e,t,T).available){P=t;break}pt(),He(),ye()}function Jt(e){P=e,He(),ye()}function Xt(e){te=e,ye()}let ke=!1;async function Zt(){if(ke||!v||!T)return;const e=Ne(B,P,T),t=Ke(B,P,T),a=e*te,i=Number(v.corp_cash_reserves)||0;if(a>i){alert("Insufficient cash reserves.");return}if(te>t){alert("Exceeds available supply this tick.");return}ke=!0;const s=document.querySelector(".pr-purchase-btn");s&&(s.disabled=!0,s.textContent="...");try{const c=i-a,{error:o}=await C.from("factions").update({corp_cash_reserves:c}).eq("id",v.id);if(o)throw o;const r=D[B]?.[P],l=(r?.qty||0)+te,n=(r?.value||0)+a,{error:d}=await C.from("corp_warehouse").upsert({faction_id:v.id,nation_id:v.nation_id,material_key:B,quality_tier:P,quantity:l,total_value:n,last_purchased_tick:S?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(d){const{error:p}=await C.from("factions").update({corp_cash_reserves:i}).eq("id",v.id);throw p&&console.error("Cash refund failed after warehouse error:",p.message),d}v.corp_cash_reserves=c,D[B]||(D[B]={}),D[B][P]={qty:l,value:n},Re(),dt(),s&&(s.textContent="PURCHASED",setTimeout(()=>{s.isConnected&&(s.disabled=!1,s.textContent="PURCHASE")},1500))}catch(c){s&&(s.disabled=!1,s.textContent="PURCHASE"),alert("Purchase failed: "+(c.message||"Unknown error"))}finally{ke=!1}}function mt(e){const t=ae||T;if(!t)return[];const a=ve(e);if(!a)return[];const i=$t(e,t),s=[],c=Number(t?.inflation??50),o=Number(t?.fuel_prices??50);Number(t?.manufacturing_output??50);const r=ae&&T&&ae.id!==T.id;let l=null;if(r&&(l=xt(t,T)),i.newAvailable>0){const n=ze(e,t),d=a.basePrice,p=Math.round(d*((c-50)/200)),u=Math.round(d*((o-50)/300));let f=n;const b=[{label:"Base price",value:L(d)},p!==0?{label:`Inflation (${c})`,mod:(p>=0?"+":"")+L(Math.abs(p))}:null,u!==0?{label:`Fuel transport (${o})`,mod:(u>=0?"+":"")+L(Math.abs(u))}:null].filter(Boolean),y=n-d-p-u;if(y!==0&&!r&&b.push({label:"Demand/scarcity",mod:(y>=0?"+":"")+L(Math.abs(y))}),r&&l){const $=Math.round(n*l.tariff),_=Math.round(n*l.transport);f=n+$+_,b.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+L($)}),b.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+L(_)})}s.push({seller:r?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:r?l?.deliveryTicks||1:0,condition:100,price:Math.round(f),available:i.newAvailable,delivery:r?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:r?l.deliveryTicks:0,used:!1,priceFactors:b,sourceNationId:t.id})}if(i.usedAvailable>0){const n=i.usedCondition,d=ze(e,t,{used:!0,condition:n});let p=d;const u=[{label:"Base price",value:L(a.basePrice)},{label:`Condition (${n}%)`,mod:"-"+L(Math.max(0,a.basePrice-d))}];if(r&&l){const f=Math.round(d*l.tariff),b=Math.round(d*l.transport);p=d+f+b,u.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+L(f)}),u.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+L(b)})}s.push({seller:r?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:r?l?.deliveryTicks||1:0,condition:n,price:Math.round(p),available:i.usedAvailable,delivery:r?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:r?l.deliveryTicks:0,used:!0,priceFactors:u,sourceNationId:t.id})}return s}function ge(){const e=Number(v?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=L(e);const t=ve(R),a=ce[t?.tier||1],i=document.getElementById("em-tier-badge");i&&(i.textContent=a.tag,i.style.color=a.color),i.style.background=a.color+"0a",i.style.border="1px solid "+a.color+"33";const s=document.getElementById("em-nation-select");if(s&&s.options.length===0){const r=T?.name||v?.nation||"—";let l=`<option value="">${m(r)} (HQ)</option>`;for(const n of pe)n.id!==T?.id&&(l+=`<option value="${n.id}">${m(n.name)}</option>`);s.innerHTML=l}const c=document.getElementById("em-import-tag"),o=ae&&T&&ae.id!==T.id;c&&(c.style.display=o?"":"none"),ea(),Ge()}function ea(){let e="";for(let t=1;t<=3;t++){const a=ce[t],i=qe(t),s=t===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";e+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${a.color}">${a.tag}</div>
            <div class="${s}">`;for(const c of i){const o=R===c.key,r=mt(c.key).length>0;e+=`<span class="em-selector__btn${o?" active":""}${r?"":" no-listings"}"
                style="${o?"background:"+a.color+";border-color:"+a.color:""}"
                onclick="setEmType('${c.key}')">${m(c.name)}</span>`}e+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${e}</div>`}function Ge(){const e=document.getElementById("em-content");if(J=mt(R),J.length===0){e.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}F>=J.length&&(F=0);let t="";for(let i=0;i<J.length;i++){const s=J[i],c=F===i,o=s.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",r=Qe(s.condition);t+=`<div class="em-listing${c?" selected":""}" style="${c?"border-left-color:"+o:""}" onclick="setEmListing(${i})">`,t+=`<div class="em-listing__row1">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="em-listing__seller">${m(s.seller)}</span>
                <span class="em-badge em-badge--${s.sellerType.toLowerCase()}">${s.sellerType}</span>
                ${s.used?'<span class="em-badge em-badge--used">USED</span>':""}
            </div>
        </div>`,t+=`<div class="em-listing__row2">
            <span class="em-listing__nation">${m((s.nation||"").toUpperCase())}</span>
            ${s.distance>0?`<span class="em-listing__distance">${s.distance} nation${s.distance>1?"s":""} away</span>`:""}
            <span class="em-listing__delivery">Delivery: ${m(s.delivery)}</span>
        </div>`,t+=`<div class="em-listing__stats">
            <div class="em-stat-cell" style="flex:1">
                <div class="em-stat-cell__label">COND.</div>
                <div class="em-stat-cell__bar">
                    <div class="em-stat-cell__bar-track"><div class="em-stat-cell__bar-fill" style="width:${s.condition}%;background:${r}"></div></div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${r}">${s.condition}%</span>
                </div>
            </div>
            <div class="em-stat-cell" style="flex:0.8;text-align:center">
                <div class="em-stat-cell__label">AVAIL.</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${s.available}</div>
            </div>
            <div class="em-stat-cell" style="flex:1.2">
                <div class="em-stat-cell__label">PRICE/UNIT</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${L(s.price)}</div>
            </div>
        </div>`,c&&s.priceFactors&&(t+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${s.priceFactors.map(l=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${m(l.label)}</span>
                    <span class="em-breakdown__mod" style="color:${l.mod?l.mod.startsWith("-")?"var(--green)":l.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${l.mod||l.value}</span>
                </div>`).join("")}
            </div>`),t+="</div>"}const a=J[F];if(a){const i=ve(R),s=ce[i?.tier||1],c=Math.min(a.available,4),o=a.price*V,r=(Number(v?.corp_cash_reserves)||0)>=o;t+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${m(i?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${m(a.seller)}</span>
                </div>
                <span class="em-purchase__price">${L(a.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:c},(l,n)=>n+1).map(l=>`<span class="em-qty-btn${V===l?" active":""}" style="${V===l?"background:"+s.color+";border-color:"+s.color:""}" onclick="setEmQty(${l})">${l}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${a.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${L(o)}</div>
                    ${a.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${m(a.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${s.color}" onclick="purchaseEquipment()"
                    ${r?"":"disabled"}
                    title="${r?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}e.innerHTML=t}async function ta(e){if(!e)ae=null;else{let a=pe.find(i=>i.id===e);if(!a)try{const{data:i}=await C.from("nations").select("*").eq("id",e).single();a=i}catch{}ae=a||null}F=0,V=1;const t=document.getElementById("em-nation-select");t&&(t.value=e||""),ge()}function aa(e){R=e,F=0,V=1,ge()}function sa(e){F=e,V=1,Ge()}function ia(e){V=e,Ge()}let Te=!1;async function na(){if(Te)return;const e=J[F];if(!e||!v)return;const t=ve(R);if(!t)return;const a=V,i=e.price*a,s=Number(v.corp_cash_reserves)||0;if(i>s){alert("Insufficient cash reserves.");return}if(a>e.available){alert("Not enough units available.");return}const c=document.querySelector(".em-purchase-btn");c&&(c.disabled=!0,c.textContent="..."),Te=!0;try{const o=s-i,{error:r}=await C.from("factions").update({corp_cash_reserves:o}).eq("id",v.id);if(r)throw r;const l=!e.deliveryTicks||e.deliveryTicks===0;if(l){const d=W.find(I=>I.equipment_key===R),p=(d?.owned||0)+a,u=d?.purchase_price_avg||0,f=d?.owned||0,b=f>0?Math.round((u*f+e.price*a)/p):e.price,y=t.maintenancePerUnit*p,$=d?.condition||100,_=Math.round(($*f+e.condition*a)/p),{error:x}=await C.from("corp_equipment").upsert({faction_id:v.id,nation_id:v.nation_id,equipment_key:R,tier:t.tier,owned:p,deployed:d?.deployed||0,condition:_,maintenance_per_tick:y,purchase_price_avg:b,last_purchased_tick:S?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(x){const{error:I}=await C.from("factions").update({corp_cash_reserves:s}).eq("id",v.id);throw I&&console.error("Cash refund failed:",I.message),x}d?(d.owned=p,d.condition=_,d.maintenance_per_tick=y):W.push({equipment_key:R,tier:t.tier,owned:p,deployed:0,condition:_,maintenance_per_tick:y,assigned_projects:[]})}else{const d=(S?.current_tick||0)+e.deliveryTicks,{error:p}=await C.from("corp_equipment_deliveries").insert({faction_id:v.id,equipment_key:R,quantity:a,condition:e.condition,delivery_tick:d,source_nation_id:e.sourceNationId||null,seller_name:e.seller,price_paid:i});if(p){const{error:u}=await C.from("factions").update({corp_cash_reserves:s}).eq("id",v.id);throw u&&console.error("Cash refund failed:",u.message),p}}v.corp_cash_reserves=o,Ue(),ge();const n=document.getElementById("pr-cash");n&&(n.textContent=L(o)),c&&(c.textContent=l?"PURCHASED":"ORDERED",setTimeout(()=>{c.isConnected&&(c.disabled=!1,c.textContent="PURCHASE")},1500))}catch(o){c&&(c.disabled=!1,c.textContent="PURCHASE"),alert("Purchase failed: "+(o.message||"Unknown error"))}finally{Te=!1}}let oa=-1,re=[],De=[],ut=[];function Ie(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function ra(e,t,a){if(a)return"var(--orange)";const i=e/(t||1)*100;return i>50?"var(--green)":i>25?"var(--amber)":"var(--red)"}function la(){const e=document.getElementById("pm-list"),t=re.length,a=De.length,i=ut.length,s=re.filter(l=>l.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${t})`,document.getElementById("pm-pending-count").textContent=`(${a})`,document.getElementById("pm-apply-count").textContent=`(${i})`;const c=document.getElementById("pm-badges");let o="";s>0&&(o+=`<span class="pm-badge pm-badge--expiring">${s} EXPIRING</span>`),a>0&&(o+=`<span class="pm-badge pm-badge--pending">${a} PENDING</span>`),c.innerHTML=o;const r=re.reduce((l,n)=>l+(n.cost||0),0)+De.reduce((l,n)=>l+(n.cost||0),0);document.getElementById("pm-total-cost").textContent=Ie(r),document.getElementById("pm-footer-active").textContent=t,document.getElementById("pm-footer-pending").textContent=a;{if(t===0){e.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let l="";re.forEach((n,d)=>{const p=oa===d,u=ra(n.ticks_left,n.total_ticks,n.expiring_soon),f=Math.min(n.ticks_left/(n.total_ticks||1)*100,100);l+=`<div class="pm-item ${n.expiring_soon?"pm-item--expiring":""} ${p?"expanded":""}" onclick="togglePmExpand(${d})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${m(n.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${m((n.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${u}">Expires: ${m(n.expires||"")}</span>
                        <span class="pm-item__ticks">(${n.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${f}%;background:${u}"></div></div>`,p&&(l+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${m(n.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${m(n.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${Ie(n.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${n.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${n.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(n.projects||[]).map(b=>`<span class="pm-project-chip">${m(b)}</span>`).join("")}</div>
                    </div>`,n.note&&(l+=`<div class="pm-note"><span class="pm-note__text">${m(n.note)}</span></div>`),n.expiring_soon&&n.renewable&&(l+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew">RENEW — ${Ie(n.cost||0)}</button></div>`),l+="</div>"),l+="</div></div>"}),e.innerHTML=l;return}}function ca(){re=[],De=[],ut=[],la()}let Z=[],da=-1;function j(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function Fe(e){return e>=85?"var(--gold)":e>=60?"var(--green)":e>=40?"var(--orange)":"var(--red)"}function pa(e){return"dl-result--"+e.toLowerCase()}function Ve(){const e=document.getElementById("dl-list"),t=Z.length;document.getElementById("dl-count").textContent=`${t} COMPLETED`;const a=Z.reduce((r,l)=>{const n=l.financials||{};return r+((n.payment||0)+(n.bonus||0)-(n.penalty||0)-(n.total_cost||0))},0),i=document.getElementById("dl-lifetime-profit");i.textContent=(a>=0?"+":"")+j(a),i.style.color=a>=0?"var(--green)":"var(--red)";const s={};Z.forEach(r=>{s[r.result]=(s[r.result]||0)+1});const c=document.getElementById("dl-footer-results");if(c.innerHTML=Object.entries(s).map(([r,l])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[r]||"var(--text-dim)"}">${m(r)}</div>
            <div class="dl-footer__result-count">${l}</div>
        </div>`).join(""),t===0){e.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let o="";Z.forEach((r,l)=>{const n=da===l,d=r.financials||{},p=(d.payment||0)+(d.bonus||0)-(d.penalty||0)-(d.total_cost||0),u=p>=0,f=pa(r.result),y={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[r.result]||"var(--text-dim)",$=r.type==="GOVERNMENT";if(o+=`<div class="dl-item ${n?"expanded":""}" onclick="toggleDlExpand(${l})">
            <div class="dl-item__inner" style="border-left:2px solid ${y}">
                <div class="dl-item__row1">
                    <span class="dl-item__name">${m(r.name)}</span>
                    <span class="dl-result-badge ${f}">${m(r.result)}</span>
                </div>
                <div class="dl-item__row2">
                    <span class="dl-item__id">${m(r.id)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                    <span class="dl-item__issuer" style="color:${$?"var(--green)":"var(--gold)"}">${m(r.issuer)}</span>
                    <span class="dl-item__date">${m(r.delivered)}</span>
                </div>
                <div class="dl-summary-bar">
                    <div class="dl-summary-cell" style="flex:1;">
                        <div class="dl-summary-label">QUALITY</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span class="dl-summary-value" style="color:${Fe(r.quality_score)}">${r.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${r.rep_change>0?"var(--green)":r.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${r.rep_change>0?"+":""}${r.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${u?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${u?"var(--green)":"var(--red)"};margin-top:2px;">${u?"+":""}${j(p)}</div>
                    </div>
                </div>`,n){const _=r.inspection||{};o+='<div style="margin-top:8px;">',o+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(h=>{const w=_[h]||{score:0,issues:[]},q=Fe(w.score),E=Math.min(w.score/100*100,100);o+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${m(h.charAt(0).toUpperCase()+h.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${E}%;background:${q}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${q}">${w.score}</span>
                        </div>
                    </div>
                    ${(w.issues||[]).map(k=>`<div class="dl-inspect-issue">${m(k)}</div>`).join("")}
                </div>`});const x=_.permits||{passed:!0,issues:[]};o+=`<div class="dl-permits-row ${x.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${x.passed?"var(--green)":"var(--red)"}">${x.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${(x.issues||[]).map(h=>`<div class="dl-inspect-issue dl-inspect-issue--red">${m(h)}</div>`).join("")}
            </div>`,o+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',o+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(r.materials_used||[]).forEach(h=>{const w=h.grade==="HIGH"?"var(--green)":h.grade==="STANDARD"?"var(--amber)":"var(--orange)",q=h.impact==="positive"?"▲":h.impact==="negative"?"▼":"–",E=h.impact==="positive"?"var(--green)":h.impact==="negative"?"var(--red)":"var(--text-dim)";o+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${m(h.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${w}"></div>
                    <span class="dl-mat-tag__grade" style="color:${w}">${m(h.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${E}">${q}</span>
                </div>`}),o+="</div>",o+='<div class="dl-section-label">Financial Summary</div>',o+='<div class="dl-fin-panel">',o+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${j(d.contract_value||0)}</span></div>`,(d.bonus||0)>0&&(o+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${j(d.bonus)}</span></div>`),(d.penalty||0)>0&&(o+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${j(d.penalty)}</span></div>`);const I=(d.payment||0)+(d.bonus||0)-(d.penalty||0);o+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${j(I)}</span></div>`,o+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${j(d.total_cost||0)}</span></div>`,o+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${u?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${u?"var(--green)":"var(--red)"}">${u?"+":""}${j(p)}</span>
            </div>`,o+="</div>";const g=r.timeline||{};o+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${g.actual||0}/${g.expected||0} ticks</span>`,g.early?o+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(g.expected||0)-(g.actual||0)} TICK${g.expected-g.actual!==1?"S":""} EARLY</span>`:!g.on_time&&g.actual>g.expected&&(o+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(g.actual||0)-(g.expected||0)} TICK${g.actual-g.expected!==1?"S":""} LATE</span>`),o+="</div>",o+="</div>"}o+="</div></div>"}),e.innerHTML=o}async function ma(){if(!v){Z=[],Ve();return}const{data:e,error:t}=await C.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",v.id).order("delivered_at_tick",{ascending:!1}).limit(20);t?(console.warn("Failed to load deliveries:",t.message),Z=[]):Z=(e||[]).map(a=>{const i=a.construction_contracts||{};return{id:a.contract_id,name:i.name||"Project",type:i.issuer_type||"GOVERNMENT",issuer:i.issuer_name||"Government",delivered:"Tick "+(a.delivered_at_tick||0),result:a.result,quality_score:a.quality_score,rep_change:a.rep_change,financials:{contract_value:a.contract_value||0,bonus:a.quality_bonus||0,penalty:a.penalties||0,payment:a.payment_received||0,total_cost:a.total_cost||0},inspection:a.inspection||{},materials_used:a.materials_used||[],timeline:{expected:a.timeline_expected||0,actual:a.timeline_actual||0,on_time:a.on_time,early:a.timeline_actual<a.timeline_expected}}}),Ve()}function Ue(){const e=W.reduce((r,l)=>r+(l.owned||0),0),t=W.reduce((r,l)=>r+(l.deployed||0),0),a=ht(W),i=e-t;document.getElementById("eq-count").textContent=e+" UNITS",document.getElementById("eq-summary").innerHTML=`
        <div class="eq-summary__cell">
            <div class="eq-summary__label">DEPLOYED</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--text-bright)">
                ${t} <span style="font-size:9px;color:var(--text-dim)">/ ${e}</span>
            </div>
        </div>
        <div class="eq-summary__cell">
            <div class="eq-summary__label">AVAILABLE</div>
            <div class="eq-summary__value" style="font-size:14px;color:${i===0?"var(--orange)":"var(--green)"}">
                ${i}
            </div>
        </div>
        <div class="eq-summary__cell">
            <div class="eq-summary__label">MAINT/TICK</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--red)">
                ${L(a)}
            </div>
        </div>`;const s={};for(const r of W)s[r.equipment_key]=r;let c="";for(let r=1;r<=3;r++){const l=ce[r],n=qe(r),d=Ae===r,p=n.reduce((f,b)=>f+(s[b.key]?.owned||0),0),u=n.reduce((f,b)=>f+(s[b.key]?.deployed||0),0);if(c+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${r})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${d?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${l.color}">${m(l.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${l.color};border:1px solid ${l.color}33;background:${l.color}0a">${l.tag}</span>
            </div>
            ${p>0?`<span class="eq-tier-hdr__count">${u}/${p}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,d)for(const f of n){const b=s[f.key],y=b?.owned||0,$=b?.deployed||0,_=b?.condition||0,x=f.maintenancePerUnit*y,I=y-$,g=y>0&&I===0,h=y>0&&_<65,w=Qe(_),q=b?.assigned_projects||[],E=q.length>0?q.map(k=>k.contract_name||"Project").join(", ").slice(0,30):y>0&&$>0?$+" project"+($>1?"s":""):"—";c+=`<div class="eq-row${y===0?" unowned":""}">`,c+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${y===0?" dim":""}">${m(f.name)}</span>
                        ${h?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${y>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${g?"var(--orange)":"var(--green)"}">${I}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${$}/${y}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,y>0?c+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${_}%;background:${w}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${w}">${_}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${m(E)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${L(x)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:c+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',c+="</div>"}}document.getElementById("eq-list").innerHTML=c;const o=[1,2,3].map(r=>{const l=ce[r],n=qe(r).reduce((d,p)=>d+(s[p.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${n>0?l.color+"33":"var(--border-0)"};background:${n>0?l.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${l.color}">${l.tag}</div>
            <div class="eq-footer__tier-count" style="color:${n>0?"var(--text-bright)":"var(--text-dim)"}">${n}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${L(a)}</div>
        </div>
        <div class="eq-footer__tiers">${o}</div>`}function ua(e){Ae=Ae===e?-1:e,Ue()}async function va(){if(!v)return;const{data:e,error:t}=await C.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",v.id);t?(console.warn("Failed to load equipment:",t.message),W=[]):W=e||[],Ue()}async function fa(){const{data:{user:e}}=await C.auth.getUser();if(!e){window.location.href="login.html";return}const{data:t}=await C.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);oe=(t||[]).filter(n=>n.nation_id);const a=sessionStorage.getItem("active_faction_id");if(v=oe.find(n=>n.id===a)||oe.find(n=>n.faction_type==="corporation")||oe[0],!v){await C.auth.signOut(),window.location.href="login.html";return}if(v.faction_type!=="corporation"){window.location.href="dashboard.html";return}const[i,s]=await Promise.all([v.nation_id?C.from("nations").select("*").eq("id",v.nation_id).single():Promise.resolve({data:null}),C.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);i.error&&console.warn("Nation load failed:",i.error.message),i.data&&(T=i.data),s.error&&console.warn("Shard load failed:",s.error.message),S=s.data;const c=v.corp_ticker||v.abbreviation||"";if(document.getElementById("corp-logo").textContent=c.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=v.faction_name||"Unnamed Corp",S){if(document.getElementById("game-date").textContent=S.current_date||"—",document.getElementById("tick-number").textContent=S.current_tick||"—",S.next_tick_at){const d=(Number(S.tick_interval_hours)||8)*36e5,p=new Date(S.next_tick_at).getTime(),f=p-d+d/2;Se=new Date(f>Date.now()?f:p+d/2),Et()}const n=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");n&&(n.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(c?"["+c+"]":v.faction_name||"Corp")+" ▾";const o=document.getElementById("topbar-cash");if(o){const n=Number(v.corp_cash_reserves??0),d=n>=1e9?"$"+(n/1e9).toFixed(1)+"B":n>=1e6?"$"+(n/1e6).toFixed(1)+"M":"$"+Math.round(n/1e3)+"k";o.textContent="CASH: "+d}const r=v.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+r+" AP</span>",document.getElementById("nation-pill").textContent=(T?.name||v.nation||"—").toUpperCase();const l=document.getElementById("corp-faction-dropdown");if(l){let n="";for(const d of oe){const p=d.id===v.id,u=d.faction_type==="corporation"?"CORP":"PARTY",f=d.faction_type==="corporation"?"var(--teal)":"var(--amber)";n+=`<div class="corp-dd-item${p?" active":""}" onclick="switchToFaction('${d.id}', '${d.faction_type}')">
                <span class="corp-dd-type" style="color:${f}">${u}</span>
                <span class="corp-dd-name">${m(d.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${m(d.abbreviation||"—")}]</span>
            </div>`}l.innerHTML=n}await Promise.all([ot(),rt(),Qt(),va(),ca(),ma()]);try{const{data:n}=await C.from("nations").select("*").order("name");pe=n||[]}catch{pe=[]}if(dt(),ge(),bt(v,T,S),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",new URLSearchParams(window.location.search).get("tab")==="expansion"){const n=document.querySelector('[data-tab="expansion"]');n&&ft({preventDefault:()=>{},target:n})}}async function _a(){await C.auth.signOut(),window.location.href="login.html"}function ya(){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.toggle("open")}function ga(e,t){const a=document.getElementById("corp-faction-dropdown");a&&a.classList.remove("open"),sessionStorage.setItem("active_faction_id",e),t==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",e=>{const t=document.getElementById("faction-switcher"),a=document.getElementById("corp-faction-dropdown");a&&t&&!t.contains(e.target)&&a.classList.remove("open")});document.addEventListener("keydown",e=>{e.key==="Escape"&&tt()});window.doLogout=_a;window.toggleTheme=kt;window.toggleCorpDropdown=ya;window.switchToFaction=ga;window.setFilter=Tt;window.openContractDetail=et;window.closeContractDetail=tt;window.placeBid=jt;window.toggleWhRow=Vt;window.toggleEqTier=ua;window.switchEmNation=ta;window.setEmType=aa;window.setEmListing=sa;window.setEmQty=ia;window.purchaseEquipment=na;window.setPrMat=Kt;window.setPrTier=Jt;window.setPrQty=Xt;window.purchaseMaterial=Zt;let G={general:0,skilled:0,innovative:0},Ce=!1;const ue=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function vt(e){const t=Number(T?.minimum_wage??50),a=Number(T?.inflation??50),i=Number(T?.standard_of_living??50),s=t/100*48e3,c=1+(a-50)/100*.5,o=1+(i-50)/100*.5;return Math.round(s*e*c*o)}function O(e){const t=Math.abs(e),a=e<0?"-":"";return t>=1e9?a+"$"+(t/1e9).toFixed(2)+"B":t>=1e6?a+"$"+(t/1e6).toFixed(2)+"M":t>=1e3?a+"$"+(t/1e3).toFixed(1)+"k":a+"$"+t.toLocaleString()}function ft(e){e.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("expansion-content").style.display="",document.querySelectorAll(".corp-nav__tab").forEach(t=>t.classList.remove("active")),e.target.classList.add("active"),be()}function _t(e){e&&e.preventDefault(),document.getElementById("operations-content").style.display="",document.getElementById("expansion-content").style.display="none",document.querySelectorAll(".corp-nav__tab").forEach(t=>t.classList.remove("active")),document.querySelector('[data-tab="operations"]')?.classList.add("active")}function ba(e,t){const a=ue.find(c=>c.id===e),i=Number(v?.[a.factionKey]??0),s=G[e]+t;i+s<0||(G[e]=s,be())}function ha(e){e?G[e]=0:G={general:0,skilled:0,innovative:0},be()}async function $a(){if(Ce||!Object.values(G).some(s=>s!==0))return;let t=0;for(const s of ue){const c=G[s.id];c>0&&(t+=c*vt(s.multiplier)*.1)}const a=Number(v?.corp_cash_reserves??0);if(t>a){alert("Insufficient cash reserves. Hiring cost: "+O(t)+", available: "+O(a));return}const i=t>0?`Confirm workforce changes?

Hiring fee: `+O(t)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(i)){Ce=!0;try{const s={};for(const r of ue){const l=Number(v?.[r.factionKey]??0);s[r.factionKey]=Math.max(0,l+G[r.id])}t>0&&(s.corp_cash_reserves=Math.max(0,a-Math.round(t)));const{error:c}=await C.from("factions").update(s).eq("id",v.id);if(c)throw c;Object.assign(v,s),G={general:0,skilled:0,innovative:0};const o=document.getElementById("topbar-cash");if(o){const r=Number(v.corp_cash_reserves??0);o.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")}be()}catch(s){alert("Error: "+s.message)}finally{Ce=!1}}}function be(){const e=document.getElementById("hf-card-container");if(!e)return;const t="'JetBrains Mono', monospace",a={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=Number(T?.minimum_wage??50),s=Number(T?.inflation??50),c=Number(T?.standard_of_living??50),o=i/100*48e3,r=(1+(s-50)/100*.5).toFixed(2),l=(1+(c-50)/100*.5).toFixed(2),n=T?.name||v?.nation||"Nation",d=Object.values(G).some(_=>_!==0);let p=0,u=0,f=0,b=0,y="";for(const _ of ue){const x=Number(v?.[_.factionKey]??0),I=G[_.id],g=x+I,h=vt(_.multiplier),w=I>0,q=x*h,E=g*h,k=E-q;p+=x,u+=g,f+=q,b+=E;const U=I!==0?w?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";y+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${a.border};background:${U};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${_.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${a.text}">${_.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${a.text}">${x.toLocaleString()}</span>
                    ${I!==0?`<span style="font-family:${t};font-size:10px;color:${a.dim}">→</span>
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${w?a.greenBright:a.red}">${g.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${t};font-size:8px;color:${a.dim}">WAGE (MIN × ${_.multiplier}.0 × ${r} × ${l})</span>
                <span style="font-family:${t};font-size:10px;color:${_.color}">${O(h)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${_.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${a.red};border:1px solid ${a.border};cursor:pointer;background:${a.card}">-50</div>
                <div onclick="hfSetChange('${_.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${a.redDim};border:1px solid ${a.border};cursor:pointer;background:${a.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${I!==0?a.card:"transparent"};border:1px solid ${I!==0?a.border:"transparent"}">
                    ${I!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${t};font-size:12px;font-weight:700;color:${w?a.greenBright:a.red}">${w?"+":""}${I}</span>
                        <span onclick="hfReset('${_.id}')" style="font-family:${t};font-size:8px;color:${a.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${t};font-size:9px;color:${a.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${_.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${a.greenBright};border:1px solid ${a.border};cursor:pointer;background:${a.card}">+10</div>
                <div onclick="hfSetChange('${_.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${a.greenBright};border:1px solid ${a.border};cursor:pointer;background:${a.card}">+50</div>
            </div>
            ${I!==0?`<div style="margin-top:6px;padding:4px 8px;background:${a.bg};border:1px solid ${a.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${t};font-size:8px;color:${a.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${k>0?a.red:a.greenBright}">${k>0?"+":""}${O(k)}/yr</span>
            </div>`:""}
        </div>`}const $=b-f;e.innerHTML=`
    <div style="width:380px;height:450px;background:${a.surface};border:1px solid ${a.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${a.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${a.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${a.muted};text-transform:uppercase">Hire / Fire</span>
            </div>
            <span style="font-family:${t};font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;color:${a.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${n.toUpperCase()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            <div style="padding:6px 14px;border-bottom:1px solid ${a.border};background:${a.card};">
                <div style="font-family:${t};font-size:8px;letter-spacing:1.5px;color:${a.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;gap:0;">
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${a.border}">
                        <div style="font-family:${t};font-size:7px;color:${a.dim};letter-spacing:0.5px">MIN WAGE</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${a.text}">${i}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${a.dim}">${O(o)}/yr</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${a.border}">
                        <div style="font-family:${t};font-size:7px;color:${a.dim};letter-spacing:0.5px">INFLATION</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${a.text}">${s}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${a.dim}">×${r}</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;">
                        <div style="font-family:${t};font-size:7px;color:${a.dim};letter-spacing:0.5px">STD OF LIVING</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${a.text}">${c}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${a.dim}">×${l}</div>
                    </div>
                </div>
            </div>
            ${y}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${a.border};background:${a.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;${d?"margin-bottom:6px;":""}">
                <div>
                    <div style="font-family:${t};font-size:7px;color:${a.dim};letter-spacing:0.8px">TOTAL WORKFORCE</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <span style="font-family:${t};font-size:13px;font-weight:700;color:${a.text}">${p.toLocaleString()}</span>
                        ${d?`<span style="font-family:${t};font-size:9px;color:${a.dim}">→</span>
                        <span style="font-family:${t};font-size:13px;font-weight:700;color:${u>p?a.greenBright:u<p?a.red:a.text}">${u.toLocaleString()}</span>`:""}
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${t};font-size:7px;color:${a.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${a.text}">${O(f)}</span>
                        ${d?`<span style="font-family:${t};font-size:9px;color:${a.dim}">→</span>
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${$>0?a.red:a.greenBright}">${O(b)}</span>`:""}
                    </div>
                </div>
            </div>
            ${d?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${a.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${t};font-size:8px;color:${a.dim}">NET CHANGE</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${$>0?a.red:a.greenBright}">${$>0?"+":""}${O($)}/yr</span>
                    <span style="font-family:${t};font-size:8px;color:${a.dim}">(${$>0?"+":""}${O(Math.round($/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${t};font-size:8px;font-weight:700;letter-spacing:1px;color:${a.dim};border:1px solid ${a.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${t};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${a.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}window.switchToExpansion=ft;window.switchToOperations=_t;window.hfSetChange=ba;window.hfReset=ha;window.hfConfirm=$a;document.querySelector('[data-tab="operations"]')?.addEventListener("click",function(e){this.classList.contains("active")||(e.preventDefault(),_t(e))});fa();
