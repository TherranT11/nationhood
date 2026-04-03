import{_ as C}from"./supabase-client-BXEzLDpS.js";import{e as u}from"./utils-C2W-HleY.js";import{i as bt}from"./messaging-5qyQ6ziq.js";import{c as $t,a as Me,E as ce,b as ve,d as Qe,e as ht,f as xt,h as je}from"./equipment-DsuDdEne.js";const Ye={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},Q=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"manufacturing_output",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:50},{stat:"higher_education",min:40}]}},priceDrivers:["manufacturing_output","inflation","fuel_prices","urbanization"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:10}]},STD:{requirements:[{stat:"manufacturing_output",min:35},{stat:"rare_minerals",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:40},{stat:"higher_education",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","inflation","fuel_prices"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"arable_land",min:10}]},STD:{requirements:[{stat:"arable_land",min:30},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"arable_land",min:50},{stat:"manufacturing_output",min:30}]}},priceDrivers:["arable_land","physical_infrastructure","inflation"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"rare_minerals",min:15},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"rare_minerals",min:35},{stat:"manufacturing_output",min:25}]}},priceDrivers:["rare_minerals","physical_infrastructure","inflation"]},{key:"em",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:15}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"digital_infrastructure",min:25}]},HIGH:{requirements:[{stat:"manufacturing_output",min:55},{stat:"digital_infrastructure",min:50},{stat:"energy_generation",min:40}]}},priceDrivers:["manufacturing_output","digital_infrastructure","inflation","energy_generation"]},{key:"glass",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:20}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"digital_infrastructure",min:40},{stat:"higher_education",min:50}]}},priceDrivers:["manufacturing_output","standard_of_living","inflation"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"oil_and_gas",min:10}]},STD:{requirements:[{stat:"oil_and_gas",min:30},{stat:"manufacturing_output",min:25}]},HIGH:{requirements:[{stat:"oil_and_gas",min:45},{stat:"manufacturing_output",min:40},{stat:"physical_infrastructure",min:40}]}},priceDrivers:["oil_and_gas","manufacturing_output","inflation","fuel_prices"]},{key:"heavy",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:40},{stat:"rare_minerals",min:30}]},STD:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:45},{stat:"higher_education",min:40}]},HIGH:{requirements:[{stat:"manufacturing_output",min:75},{stat:"rare_minerals",min:60},{stat:"higher_education",min:55},{stat:"digital_infrastructure",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","higher_education","digital_infrastructure"]}];function ee(e,t,a){const i=Q.find(c=>c.key===e);if(!i)return{available:!1,failedStat:"unknown_material"};const s=i.tiers[t];if(!s)return{available:!1,failedStat:"unknown_tier"};for(const c of s.requirements){const r=Number(a?.[c.stat]??0);if(r<c.min)return{available:!1,failedStat:c.stat,failedMin:c.min,nationValue:r}}return{available:!0}}function De(e,t,a){const s={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em:{LOW:400,STD:700,HIGH:1200},glass:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy:{LOW:800,STD:1400,HIGH:2400}}[e]?.[t];if(!s)return 0;const c=Q.find(o=>o.key===e);if(!c)return s;let r=1;for(const o of c.priceDrivers){const l=Number(a?.[o]??50);o==="inflation"||o==="fuel_prices"?r*=1+(l-50)/200:r*=1-(l-50)/250}return r=Math.max(.4,Math.min(2.5,r)),Math.round(s*r)}function Ke(e,t,a){const s={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em:{LOW:1e3,STD:700,HIGH:300},glass:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy:{LOW:400,STD:200,HIGH:80}}[e]?.[t]||0,r=Q.find(n=>n.key===e)?.priceDrivers?.[0],l=.3+(r?Number(a?.[r]??50):50)/50*.7;return Math.round(s*l)}const Oe=["LOW","STD","HIGH"],qe={LOW:"Low",STD:"Standard",HIGH:"High"};let oe=[],v=null,x=null,N=null,ne=[],le={},j=[],D={},Le=-1,B="concrete",P="STD",te=500,G=[],Ae=0,R="trucks",F=0,V=1,J=[],ae=null,pe=[],Se=null,de=null,Ne="ALL",Be="TIMELINE";function L(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function wt(e){if(e>=12){const t=Math.floor(e/12),a=e%12;return a>0?t+"y "+a+"mo":t+"y"}return e+" ticks"}function H(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(1)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(0)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function fe(e){return e==="civil_engineering"?"CIVIL":e==="industrial"?"INDUSTRIAL":e==="mega_project"?"MEGA":e?.toUpperCase()||"—"}function Je(e){return e==="civil_engineering"?"light":e==="industrial"?"heavy":e==="mega_project"?"mega":"light"}function Et(){de&&clearInterval(de),de=setInterval(()=>{if(!Se)return;const e=Se-Date.now();if(e<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(de);return}const t=Math.floor(e/36e5),a=Math.floor(e%36e5/6e4),i=Math.floor(e%6e4/1e3);document.getElementById("tick-countdown").textContent=t+"h "+a+"m "+i+"s"},1e3)}function kt(){document.body.classList.toggle("light-mode");const e=document.getElementById("theme-toggle");e.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function It(e,t){e==="type"&&(Ne=t),e==="sort"&&(Be=t),document.querySelectorAll(`.filter-pill[data-filter="${e}"]`).forEach(a=>{a.classList.toggle("active",a.dataset.value===t)}),Ze()}function Xe(e){return!(!v||e.sector==="mega_project"&&v.corp_subsector!=="Megaprojects"||e.sector==="industrial"&&!["Heavy Infrastructure","Megaprojects"].includes(v.corp_subsector))}function Ze(){const e=document.getElementById("oc-list");let t=[...ne];if(Ne==="GOVERNMENT"?t=t.filter(s=>s.issuer_type==="GOVERNMENT"):Ne==="PRIVATE"&&(t=t.filter(s=>s.issuer_type==="PRIVATE")),Be==="TIMELINE"&&t.sort((s,c)=>(s.timeline_ticks||0)-(c.timeline_ticks||0)),Be==="BUDGET"&&t.sort((s,c)=>(c.budget_ceiling||0)-(s.budget_ceiling||0)),document.getElementById("oc-count").textContent=t.length+" AVAILABLE",t.length===0){e.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const a=N?.current_tick||0;let i="";for(const s of t){const c=s.issuer_type==="GOVERNMENT",r=c?"gov":"private",o=Xe(s),l=o?"":" locked",n=Je(s.sector),d=fe(s.sector),p=(s.timeline_ticks||0)>18?" warn":"",m=s.bidding_ends_tick?Math.max(0,s.bidding_ends_tick-a):"?";i+=`
            <div class="oc-item${l}" data-contract-id="${s.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${u(s.name)}</span>
                    <span class="oc-item__type-badge ${r}">${c?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${r}">${u(s.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${m} tick${m!==1?"s":""} left</span>
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
                        ${le[s.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${H(le[s.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${o?"yes":"no"}">${o?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${o?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openBidModal(contracts.find(x=>x.id==='${s.id}'))">${le[s.id]?"EDIT":"VIEW"}</button>`:""}
                </div>
                ${s.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${u(s.description)}</div>`:""}
            </div>`}e.innerHTML=i,e.querySelectorAll(".oc-item:not(.locked)").forEach(s=>{s.addEventListener("click",()=>{const c=s.dataset.contractId,r=ne.find(o=>o.id===c);r&&et(r)})})}let me=null;function et(e){me=e;const t=document.getElementById("cd-overlay"),a=e.contract_type==="GOVERNMENT",i=a?"gov":"private",s=(x?.name||v.nation||"—").toUpperCase(),c=Xe(e);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${u(s)}</span>
        <span class="cd-header__name">${u(e.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${i}">${u(e.issuer_name)}</span>
        <span class="cd-header__type-badge ${i}">${a?"GOV":"PRIVATE"}</span>
    `;const r=document.getElementById("cd-blueprint");e.blueprint_svg?(r.innerHTML=e.blueprint_svg,r.style.display=""):(r.innerHTML=Gt(e),r.style.display="");const o=e.permits_required||[],l=e.equipment_required||[],n=e.materials_estimated||[];let d="var(--teal)";e.spec_category==="Heavy Infrastructure"&&(d="var(--orange)"),e.spec_category==="Megaproject"&&(d="var(--red)");let p=L(e.budget),m=e.timeline_months+" Months",f="";f+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${u(e.contract_number)}</span>
            </div>
            <div class="cd-issue__tags">
                ${e.project_type?`<span class="cd-tag teal">${u(e.project_type.toUpperCase())}</span>`:""}
                ${e.project_subtype?`<span class="cd-tag gold">${u(e.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,e.description&&(f+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${u(e.description)}</div>
            </div>`),f+='<div class="cd-details">',e.project_type&&(f+=K("Type",e.project_type)),e.project_subtype&&(f+=K("Sub-Type",e.project_subtype)),f+=K("Specialization",e.spec_category,d),f+=K("Total Budget",p,"var(--green)"),f+=K("Timeline",m),f+=K("Nation",x?.name||v.nation||"—"),e.region&&(f+=K("Region",e.region)),f+="</div>",o.length>0&&(f+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${o.map(h=>{const E=h.status==="approved"?"approved":"required",M=h.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${E}">
                            <span class="cd-chip__icon">${M}</span>
                            <span class="cd-chip__label">${u(h.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),l.length>0&&(f+=`
            <div class="cd-items">
                <div class="cd-section-label">Required Equipment</div>
                <div class="cd-items__list">
                    ${l.map(h=>{const E=h.owned?"owned":"missing",M=h.owned?"&#10003;":"&#10007;";return`<div class="cd-chip ${E}">
                            <span class="cd-chip__icon">${M}</span>
                            <span class="cd-chip__label">${u(h.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),n.length>0&&(f+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${n.map(h=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${u(h.name)}</span>
                        <span class="cd-mat-row__qty">${u(String(h.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=f;const y=o.filter(h=>h.status==="approved").length,_=o.length-y,b=l.filter(h=>h.owned).length,g=l.length-b;let w="";l.length>0&&(g===0?w+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>':w+=`<span class="cd-footer__badge bad">${g} EQUIPMENT MISSING</span>`),o.length>0&&(_===0?w+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':w+=`<span class="cd-footer__badge warn">${_} PERMITS PENDING</span>`);const T=c,$=(v.action_points??0)>=2;document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${w}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            <button class="cd-btn primary" onclick="placeBid()" ${T&&$?"":"disabled"}
                title="${T?$?"Place a bid (2 AP)":"Need 2 AP to bid":"Not qualified for this contract"}">BID</button>
        </div>
    `,t.classList.add("open"),document.body.style.overflow="hidden"}function tt(e){e&&e.target&&e.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",me=null)}const Tt=[{key:"concrete",name:"Concrete",unit:"units"},{key:"steel",name:"Steel",unit:"units"},{key:"lumber",name:"Lumber",unit:"units"},{key:"aggregate",name:"Aggregate",unit:"units"},{key:"em_systems",name:"E&M Systems",unit:"units"},{key:"glass_facades",name:"Glass & Facades",unit:"units"},{key:"asphalt",name:"Asphalt",unit:"units"},{key:"heavy_parts",name:"Heavy Machinery Parts",unit:"units"}],Ct=[{key:"work_trucks",name:"Work Trucks",tier:1},{key:"excavators",name:"Excavators",tier:1},{key:"bulldozers",name:"Bulldozers",tier:1},{key:"concrete_mixers",name:"Concrete Mixers",tier:1},{key:"tower_cranes",name:"Tower Cranes",tier:2},{key:"heavy_haulers",name:"Heavy Haulers",tier:2},{key:"pile_drivers",name:"Pile Drivers",tier:2},{key:"asphalt_plants",name:"Asphalt Plants",tier:2}],at={LOW:.7,STANDARD:1,HIGH:1.4},st={LOW:35,STANDARD:65,HIGH:90},$e=15;let O=null;function Mt(e){if(!e)return;const t=e.required_materials||{},a=e.required_equipment||[],i=e.required_workforce||{},s={concrete:18e4,steel:25e4,lumber:12e4,aggregate:8e4,em_systems:32e4,glass_facades:28e4,asphalt:14e4,heavy_parts:4e5},c=Tt.filter(d=>t[d.key]>0).map(d=>({...d,qty:t[d.key],basePrice:s[d.key]||2e5,grade:d.key==="aggregate"?"LOW":"STANDARD",highDisabled:!1})),r=Ct.filter(d=>a.includes(d.key)).map(d=>({...d,owned:(G||[]).some(p=>p.equipment_key===d.key&&p.quantity>0)})),o=(i.general||100)+(i.skilled||20),l=e.budget_ceiling||1e8,n=Math.round(l*.03);O={contract:e,budgetCeiling:l,materials:c,laborCount:o,laborRate:15200,estimatedTicks:e.timeline_ticks||8,equipment:r,permits:[],overhead:n,markupPct:15,competitors:[],playerRep:v?.standing||50,requiredWorkforce:i},document.getElementById("bid-title").textContent="BID ASSEMBLY",document.getElementById("bid-subtitle").textContent=(e.name||"Contract")+" — "+fe(e.sector)+" — "+(e.issuer_name||"Government"),document.getElementById("bid-overlay").classList.add("open"),document.body.style.overflow="hidden",_e()}function it(e){e&&e.target!==document.getElementById("bid-overlay")||(document.getElementById("bid-overlay").classList.remove("open"),document.body.style.overflow="",O=null)}function A(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(2)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function qt(e,t){if(!O)return;const a=O.materials[e];t==="HIGH"&&a.highDisabled||(a.grade=t,_e())}function Lt(e){O&&(O.laborCount=e,_e())}function At(e){O&&(O.markupPct=Number(e),_e())}function _e(){if(!O)return;const e=O;let t=0;for(const I of e.materials)I.lineCost=Math.round(I.qty*I.basePrice*at[I.grade]),t+=I.lineCost;const a=Math.round(e.laborCount*e.laborRate*e.estimatedTicks),i=Math.round(e.equipment.filter(I=>I.owned).length*12e3*e.estimatedTicks);let s=0;const c=e.overhead,r=t+a+i+s+c,o=Math.round(r*e.markupPct/100),l=r+o,n=l>e.budgetCeiling,d=o,p=Math.round(e.materials.reduce((I,U)=>I+st[U.grade],0)/e.materials.length),m=p>=80?"STRONG":p>=60?"PROMISING":p>=40?"UNCERTAIN":"POOR",f=p>=80?"var(--green)":p>=60?"var(--teal)":p>=40?"var(--orange)":"var(--red)",y=e.budgetCeiling>0?l/e.budgetCeiling:1,_=Math.max(0,Math.min(100,Math.round((1-y)*150))),b=_>=70?"STRONG":_>=40?"COMPETITIVE":_>=15?"WEAK":"UNLIKELY",g=_>=70?"var(--green)":_>=40?"var(--teal)":_>=15?"var(--orange)":"var(--red)",w=Math.round(r*(1-$e/100)),T=Math.round(r*(1+$e/100));let $="";$+='<div class="bid-section"><div class="bid-section__title">Materials</div>',e.materials.forEach((I,U)=>{const Y=ie=>{const yt=I.grade===ie,gt=ie==="HIGH"&&I.highDisabled;return`<button class="bid-grade-btn ${yt?ie==="LOW"?"active-low":ie==="HIGH"?"active-high":"active":""} ${gt?"disabled":""}" onclick="setBidGrade(${U},'${ie}')">${ie[0]}</button>`};$+=`<div class="bid-mat-row">
            <span class="bid-mat-row__name">${u(I.name)}</span>
            <span class="bid-mat-row__qty">×${I.qty}</span>
            <div class="bid-grade-btns">${Y("LOW")}${Y("STANDARD")}${Y("HIGH")}</div>
            <span class="bid-mat-row__cost">${A(I.lineCost)}</span>
        </div>`}),$+=`<div class="bid-line-total"><span class="bid-line-total__label">MATERIALS TOTAL</span><span class="bid-line-total__value">${A(t)}</span></div></div>`;const h=(e.requiredWorkforce?.general||80)+(e.requiredWorkforce?.skilled||20),E=[Math.round(h*.8),h,Math.round(h*1.2),Math.round(h*1.4),Math.round(h*1.6)];$+='<div class="bid-section"><div class="bid-section__title">Labor</div>',$+='<div class="bid-labor-presets">',E.forEach(I=>{$+=`<button class="bid-labor-btn ${e.laborCount===I?"active":""}" onclick="setBidLabor(${I})">${I}</button>`}),$+="</div>";const M=e.requiredWorkforce||{};$+=`<div class="bid-labor-formula">Required: ${M.general||"?"} general + ${M.skilled||"?"} skilled<br>`,$+=`${e.laborCount} workers × ${A(e.laborRate)}/tick × ${e.estimatedTicks} ticks = <strong>${A(a)}</strong></div>`,$+=`<div class="bid-line-total"><span class="bid-line-total__label">LABOR TOTAL</span><span class="bid-line-total__value">${A(a)}</span></div></div>`,$+='<div class="bid-section"><div class="bid-section__title">Equipment</div>',e.equipment.forEach(I=>{const U=I.owned?"bid-equip-row__status--owned":"bid-equip-row__status--missing",Y=I.owned?"✓ OWNED":"✗ NOT OWNED";$+=`<div class="bid-equip-row"><span class="bid-equip-row__name">${u(I.name)}</span><span class="bid-equip-row__status ${U}">${Y}</span></div>`}),$+=`<div class="bid-line-total"><span class="bid-line-total__label">MAINTENANCE (${e.estimatedTicks}t)</span><span class="bid-line-total__value">${A(i)}</span></div></div>`,$+='<div class="bid-section"><div class="bid-section__title">Permits</div>',$+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);padding:8px 0;">No permits required yet.</div>',$+='<div class="bid-line-total"><span class="bid-line-total__label">PERMITS TOTAL</span><span class="bid-line-total__value">$0</span></div></div>',$+='<div class="bid-section"><div class="bid-section__title">Overhead &amp; Contingency</div>',$+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Site management, insurance, admin</div>',$+=`<div class="bid-line-total"><span class="bid-line-total__label">OVERHEAD</span><span class="bid-line-total__value">${A(c)}</span></div></div>`,document.getElementById("bid-left").innerHTML=$;let k="";k+='<div class="bid-section"><div class="bid-section__title">Cost Summary</div>',k+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Materials</span><span class="bid-summary-row__value">${A(t)}</span></div>`,k+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Labor</span><span class="bid-summary-row__value">${A(a)}</span></div>`,k+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Equipment Maint.</span><span class="bid-summary-row__value">${A(i)}</span></div>`,k+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Permits</span><span class="bid-summary-row__value">${A(s)}</span></div>`,k+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Overhead</span><span class="bid-summary-row__value">${A(c)}</span></div>`,k+=`<div class="bid-cost-total"><span class="bid-cost-total__label">ESTIMATED COST</span><span class="bid-cost-total__value">${A(r)}</span></div>`,k+=`<div class="bid-accuracy">⚠ Estimate accuracy: ±${$e}%<br>Actual cost range: ${A(w)} — ${A(T)}</div>`,k+="</div>",k+='<div class="bid-section"><div class="bid-section__title">Markup</div>',k+=`<div class="bid-slider-wrap">
        <div class="bid-slider-label"><span class="bid-slider-label__pct">${e.markupPct}%</span><span style="color:var(--text-dim)">${A(o)}</span></div>
        <input type="range" class="bid-slider" min="0" max="40" value="${e.markupPct}" oninput="setBidMarkup(this.value)">
    </div></div>`,k+=`<div class="bid-price-hero ${n?"bid-price-hero--over":""}">
        <div class="bid-price-hero__label">YOUR BID PRICE</div>
        <div class="bid-price-hero__value">${A(l)}</div>
        ${n?'<div class="bid-price-hero__warning">EXCEEDS BUDGET CEILING ('+A(e.budgetCeiling)+")</div>":""}
    </div>`,k+=`<div class="bid-profit"><span class="bid-profit__label">PROJECTED PROFIT</span><span class="bid-profit__value">+${A(d)}</span></div>`,k+=`<div class="bid-compete">
        <div style="display:flex;justify-content:space-between;"><span class="bid-compete__label" style="color:${g}">${b}</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Competitiveness</span></div>
        <div class="bid-compete__bar-wrap"><div class="bid-compete__bar" style="width:${_}%;background:${g}"></div></div>
    </div>`,k+=`<div class="bid-quality">
        <div style="display:flex;justify-content:space-between;"><span class="bid-quality__label" style="color:${f}">${m} (${p}/100)</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Quality Estimate</span></div>
        <div class="bid-quality__bar-wrap"><div class="bid-quality__bar" style="width:${p}%;background:${f}"></div></div>
    </div>`,k+='<div class="bid-section" style="margin-top:8px;"><div class="bid-section__title">Competing Bids</div>',e.competitors.forEach(I=>{k+=`<div class="bid-competitor"><span class="bid-competitor__name">${u(I.name)}</span><span class="bid-competitor__rep">Rep ${I.rep}</span></div>`}),k+=`<div class="bid-competitor" style="color:var(--gold);"><span class="bid-competitor__name">You</span><span class="bid-competitor__rep">Rep ${e.playerRep}</span></div>`,k+="</div>",document.getElementById("bid-right").innerHTML=k,document.getElementById("bid-footer-price").textContent=A(l),document.getElementById("bid-footer-price").style.color=n?"var(--red)":"var(--gold)",document.getElementById("bid-footer-profit").textContent="+"+A(d),document.getElementById("bid-footer-quality").textContent=p+"/100",document.getElementById("bid-footer-quality").style.color=f,document.getElementById("bid-submit-btn").disabled=n}window.openBidModal=Mt;window.closeBidModal=it;window.setBidGrade=qt;window.setBidLabor=Lt;window.setBidMarkup=At;let he=!1;async function St(){if(!O||!v||he)return;const e=O,t=e.contract;let a=0;const i={};for(const p of e.materials)a+=Math.round(p.qty*p.basePrice*at[p.grade]),i[p.key]=p.grade;const s=Math.round(e.laborCount*e.laborRate*e.estimatedTicks),c=Math.round(e.equipment.filter(p=>p.owned).length*12e3*e.estimatedTicks),r=a+s+c+e.overhead,o=Math.round(r*e.markupPct/100),l=r+o,n=Math.round(e.materials.reduce((p,m)=>p+st[m.grade],0)/(e.materials.length||1));if(l>e.budgetCeiling){alert("Bid exceeds budget ceiling. Lower your costs or markup.");return}const d=document.getElementById("bid-submit-btn");d.disabled=!0,d.textContent="SUBMITTING...",he=!0;try{const{data:p}=await C.from("shard").select("current_tick").eq("name","Alpha Shard").single(),m=p?.current_tick||0,{data:f}=await C.from("contract_bids").select("id").eq("contract_id",t.id).eq("faction_id",v.id).maybeSingle();if(f){const{error:_}=await C.from("contract_bids").update({bid_price:l,material_grades:i,labor_count:e.laborCount,markup_pct:e.markupPct,estimated_cost:r,estimated_quality:n,submitted_at_tick:m}).eq("id",f.id);if(_)throw _}else{const{error:_}=await C.from("contract_bids").insert({contract_id:t.id,faction_id:v.id,bid_price:l,material_grades:i,labor_count:e.laborCount,markup_pct:e.markupPct,estimated_cost:r,estimated_quality:n,status:"pending",submitted_at_tick:m});if(_)throw _}it();const y=document.getElementById("oc-count");if(y){const _=y.textContent;y.textContent="✓ BID SUBMITTED",y.style.color="var(--green)",setTimeout(()=>{y.textContent=_,y.style.color=""},2e3)}await ot()}catch(p){console.error("Bid submission failed:",p),alert("Failed to submit bid: "+(p.message||"Unknown error")),d.disabled=!1,d.textContent="SUBMIT BID"}finally{he=!1}}window.submitBid=St;const X=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],Ge={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},We={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let q=null;function Nt(e){const t=j.find(M=>M.id===e);if(!t)return;const a=Array.isArray(t.contract_bids)?t.contract_bids[0]:t.contract_bids,i=N?.current_tick||0,s=t.awarded_at_tick||i,c=t.timeline_ticks||8,r=Math.max(0,i-s),o=Math.min(100,r/c*100);let l=Math.min(X.length-1,Math.floor(o/(100/X.length)));const n=Math.round(o%(100/X.length)/(100/X.length)*100),d=t.required_materials||{},p=a?.material_grades||{},m=Object.entries(d).map(([M,k])=>{const I=p[M]||"STANDARD",U=Math.round(k*(o/100)*(.6+Math.random()*.4));return{key:M,name:M.replace(/_/g," ").replace(/\b\w/g,Y=>Y.toUpperCase()),grade:I,allocated:k,used:Math.min(U,k)}}),y=(t.required_equipment||[]).map(M=>({key:M,name:M.replace(/_/g," ").replace(/\b\w/g,k=>k.toUpperCase()),qty:1+Math.floor(Math.random()*3),condition:55+Math.floor(Math.random()*40)})),_=t.budget_ceiling||0,b=a?.estimated_cost||0,g=Math.round(b*Math.min(1,r/c)),w=a?.estimated_quality||65,T=w>=80?"STRONG":w>=60?"PROMISING":w>=40?"FAIR":"UNCERTAIN",$=t.required_workforce||{},h=($.general||0)+($.skilled||0),E=a?.labor_count||h;q={project:t,bid:a,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:i,awardedTick:s,totalTicks:c,ticksElapsed:r,phaseIdx:l,phaseProgress:n,materials:m,equipment:y,budget:_,estCost:b,spent:g,quality:w,qualityLabel:T,laborCount:E,wfNeeded:h,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",nt(t.id).then(()=>se()),se()}function Bt(e){e&&e.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",q=null)}function Pt(e){q&&(q.tab=e,q.expandedEvent=-1,q.selectedResponse=null,se())}function Dt(e){q&&(q.expandedEvent=q.expandedEvent===e?-1:e,q.selectedResponse=null,se())}function Ot(e){q&&(q.selectedResponse=q.selectedResponse===e?null:e,se())}function se(){if(!q)return;const e=q,t=e.project,a=t.issuer_type==="GOVERNMENT",i=fe(t.sector),s=v?.nation||"Nation",c=e.awardedTick+e.totalTicks,r=Math.max(0,c-e.currentTick),o=e.currentTick>c,l=e.budget>0?Math.round(e.spent/e.budget*100):0,n=l>85?"var(--red)":l>60?"var(--amber)":"var(--teal)",d=e.budget-e.spent,p=e.events.filter(b=>b.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${u(s.toUpperCase())}</span>
                <span class="pm-hdr__name">${u(t.name)}</span>
                <span style="color:var(--text-dim);font-size:12px">—</span>
                <span class="pm-hdr__issuer">${u(t.issuer_name||"—")}</span>
                <span class="pm-hdr__type">${a?"GOV":"PVT"}</span>
            </div>
            <button class="pm-hdr__close" onclick="closeProjectModal()">×</button>
        </div>
        <div class="pm-hdr__row2">
            <span class="pm-hdr__id">${u(t.template_key||t.id)}</span>
            <span class="pm-hdr__badge pm-hdr__badge--spec">${u(i.toUpperCase())}</span>
            <span class="pm-hdr__badge pm-hdr__badge--sub">${u((t.sector||"").replace(/_/g," ").toUpperCase())}</span>
        </div>
    `;let m='<div class="pm-phase__bar">';for(let b=0;b<X.length;b++){const g=b<e.phaseIdx,w=b===e.phaseIdx;m+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${g?"done":w?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${g?"done":w?"active":""}">${X[b]}</span>
        </div>`}m+="</div>",m+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${X[e.phaseIdx]} — ${e.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${o?"var(--red)":"var(--text-secondary)"}">Tick ${e.ticksElapsed} / ${e.totalTicks}${o?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=m;const f=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:p},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=f.map(b=>`<button class="pm-tab${e.tab===b.id?" active":""}" onclick="pmSetTab('${b.id}')">
            ${b.label}${b.badge>0?`<span class="pm-tab__badge">${b.badge}</span>`:""}
        </button>`).join("");let y="";e.tab==="overview"?y=Rt(e,t,n,l,d,r,o):e.tab==="events"?y=Ht(e):e.tab==="materials"?y=zt(e):e.tab==="equipment"&&(y=Ut(e)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${y}</div>`;let _="";p>0&&(_+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${p} EVENT${p>1?"S":""} REQUIRES RESPONSE</span>`),_+=`<span class="pm-ftr__badge" style="color:${e.quality>=70?"var(--green)":e.quality>=50?"var(--amber)":"var(--orange)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${e.quality}/100 — ${e.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${_}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function Rt(e,t,a,i,s,c,r){const o=xe(e.awardedTick+e.totalTicks);xe(e.awardedTick+e.totalTicks);const l=xe(e.awardedTick),n=[{label:"Budget",value:H(e.budget),sub:`${i}% spent`,color:a},{label:"Spent",value:H(e.spent),color:"var(--red)"},{label:"Remaining",value:H(s),color:"var(--green)"},{label:"Quality",value:`${e.quality}/100`,sub:e.qualityLabel,color:e.quality>=70?"var(--green)":e.quality>=50?"var(--amber)":"var(--red)"},{label:"Workforce",value:`${e.laborCount}/${e.wfNeeded}`,sub:`Bid: ${e.laborCount}`,color:e.laborCount<e.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${c} ticks`,sub:r?"OVERDUE":`Deadline: ${o}`,color:r?"var(--red)":"var(--text-bright)"}];let d="";d+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${u(t.description||t.name)}</div>
    </div></div>`,d+='<div class="pm-metrics">';for(const m of n)d+=`<div class="pm-metric">
            <div class="pm-metric__label">${m.label}</div>
            <div class="pm-metric__value" style="color:${m.color}">${m.value}</div>
            ${m.sub?`<div class="pm-metric__sub">${u(m.sub)}</div>`:""}
        </div>`;d+="</div>",d+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${l}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${r?"var(--red)":"var(--text-bright)"};font-weight:700">${o}</span></span>
        </div>
    </div></div>`;const p=[];if((t.sector==="civil_engineering"||t.sector==="industrial"||t.sector==="mega_project")&&(p.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),p.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),t.sector!=="civil_engineering"&&p.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),p.length>0){d+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const m of p)d+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${u(m.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;d+="</div></div>"}return d}function Ht(e){if(e.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let t="";for(let a=0;a<e.events.length;a++){const i=e.events[a],s=e.expandedEvent===a,c=i.status==="ACTIVE",r=Ge[i.type]||Ge.WEATHER,o=We[i.severity]||We.LOW;if(t+=`<div class="pm-evt ${c?"pm-evt--active":"pm-evt--resolved"}" style="${c?`border-left-color:${r.color}`:""}">`,t+=`<div class="pm-evt__header" onclick="pmToggleEvent(${a})" style="${s?`background:${r.bg}`:""}">`,t+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${r.color};background:${r.bg};border:1px solid ${r.border}">${i.type}</span>
            <span class="pm-evt__sev-badge" style="color:${o}">${i.severity}</span>
            <span class="pm-evt__status" style="color:${c?"var(--red)":"var(--text-dim)"};font-weight:${c?"700":"400"}">${c?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,t+=`<div class="pm-evt__title">${u(i.title)}</div>`,t+=`<div class="pm-evt__meta">Tick ${i.tick} · ${u(i.id||"")}</div>`,s){if(t+='<div class="pm-evt__body">',t+=`<div class="pm-evt__desc">${u(i.desc)}</div>`,i.impact&&(t+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${u(i.impact)}</span>
                </div>`),c&&i.responses&&i.responses.length>0){t+='<div class="pm-evt__resp-title">Response Options</div>';for(let l=0;l<i.responses.length;l++){const n=i.responses[l],d=e.selectedResponse===l,m={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[n.tag]||"var(--text-secondary)";t+=`<div class="pm-resp${d?" selected":""}" style="${d?`border-color:${m}`:""}" onclick="event.stopPropagation();pmSelectResponse(${l})">`,t+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${u(n.label)}</span>
                            <span class="pm-resp__tag" style="color:${m};background:${m}12;border:1px solid ${m}25">${n.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${n.delay>0?"var(--orange)":"var(--green)"}">
                            ${n.delay>0?`+${n.delay} tick${n.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,t+=`<div class="pm-resp__detail">${u(n.detail)}</div>`,t+='<div class="pm-resp__costs">',n.cost&&(t+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${H(n.cost)}</span>`),n.qualityImpact&&n.qualityImpact!==0&&(t+=`<span class="pm-resp__cost" style="color:${n.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${n.qualityImpact>0?"+":""}${n.qualityImpact}</span>`),!n.cost&&(!n.qualityImpact||n.qualityImpact===0)&&(t+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),t+="</div>",d&&(t+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${m}" onclick="event.stopPropagation();confirmEventResponse('${i.id}','${n.key}')">CONFIRM</button>
                        </div>`),t+="</div>"}}!c&&i.resolution&&(t+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${u(i.resolution)}</div>
                </div>`),t+="</div>"}t+="</div></div>"}return t}function zt(e){if(e.materials.length===0)return'<div class="pm-evt-empty">No materials allocated to this project.</div>';let t='<div class="pm-tab-header">Allocated Materials</div>';for(const a of e.materials){const i=a.allocated>0?Math.round(a.used/a.allocated*100):0,s=a.grade==="HIGH"?"high":a.grade==="LOW"?"low":"std",c=a.grade==="HIGH"?"var(--green)":a.grade==="LOW"?"var(--orange)":"var(--amber)";t+=`<div class="pm-mat">
            <div class="pm-mat__row1">
                <div class="pm-mat__left">
                    <span class="pm-mat__name">${u(a.name)}</span>
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
                    <span class="pm-eq__name">${u(a.name)}</span>
                    <span class="pm-eq__qty">×${a.qty}</span>
                    ${s?'<span class="pm-eq__wear">WEAR</span>':""}
                </div>
            </div>
            <div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${a.condition}%;background:${i}"></div></div>
                <span class="pm-eq__cond-val" style="color:${i}">${a.condition}%</span>
            </div>
        </div>`}return t}function xe(e){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][e%12]}, ${2e3+Math.floor(e/12)}`}window.openProjectModal=Nt;window.closeProjectModal=Bt;window.pmSetTab=Pt;window.pmToggleEvent=Dt;window.pmSelectResponse=Ot;async function nt(e){if(!q)return;const{data:t,error:a}=await C.from("construction_events").select("*").eq("contract_id",e).order("fired_at_tick",{ascending:!1});a?(console.warn("Failed to load project events:",a.message),q.events=[]):q.events=(t||[]).map(i=>({id:i.id,type:i.type,severity:i.severity,tick:i.fired_at_tick,title:i.title,desc:i.description,impact:i.impact,status:i.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:i.resolution,responses:i.responses||[]})),se()}let we=!1;async function jt(e,t){if(!(we||!q)){we=!0;try{const{data:a,error:i}=await C.rpc("resolve_construction_event",{p_event_id:e,p_response_key:t});if(i){console.error("Failed to resolve event:",i.message),alert("Failed to submit response: "+i.message);return}const s=typeof a=="string"?JSON.parse(a):a;if(s?.error){alert("Error: "+s.error);return}await nt(q.project.id),await rt(),s?.quality_applied&&s.quality_applied!==0&&(q.quality=Math.max(0,Math.min(100,q.quality+s.quality_applied)),q.qualityLabel=q.quality>=80?"STRONG":q.quality>=60?"PROMISING":q.quality>=40?"FAIR":"UNCERTAIN"),se()}finally{we=!1}}}window.confirmEventResponse=jt;function K(e,t,a){const i=a?` style="color:${a}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${u(e)}</span>
        <span class="cd-detail-row__value"${i}>${u(t)}</span>
    </div>`}function Gt(e){const t={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},a=e.drawing_number||e.contract_number+"-A1",i=N?.current_date||"",s=i?i.replace(/,\s*/," "):"",c=e.spec_category==="Heavy Infrastructure",r=e.spec_category==="Megaproject";let o=u(e.project_subtype||e.project_type||"STRUCTURE"),l=c?"80.0m":r?"200.0m":"60.0m",n=c?"40.0m":r?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${t.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(d,p)=>`<line x1="${p*20}" y1="0" x2="${p*20}" y2="200" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(d,p)=>`<line x1="0" y1="${p*20}" x2="680" y2="${p*20}" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${t.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${t.accent}" font-family="var(--font-mono)" font-weight="700">${o.toUpperCase()}</text>
        <text x="340" y="100" text-anchor="middle" font-size="6" fill="${t.text}" font-family="var(--font-mono)">${u(e.name)}</text>

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
        <text x="540" y="175" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">${u(a)}</text>
        <text x="500" y="185" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">SCALE</text>
        <text x="540" y="185" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">1:200</text>
        <text x="610" y="175" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">REV</text>
        <text x="630" y="175" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">01</text>
        <text x="610" y="185" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">DATE</text>
        <text x="630" y="185" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">${u(s)}</text>

        <!-- North arrow -->
        <g transform="translate(470,172)">
            <line x1="0" y1="12" x2="0" y2="0" stroke="${t.accent}" stroke-width="0.8"/>
            <polygon points="-3,4 0,0 3,4" fill="${t.accent}"/>
            <text x="0" y="-3" text-anchor="middle" font-size="5" fill="${t.text}" font-family="var(--font-mono)">N</text>
        </g>
    </svg>`}let Ee=!1;async function Wt(){if(Ee||!me||!v)return;if((v.action_points??0)<2){alert("You need at least 2 AP to place a bid.");return}Ee=!0;const e=document.querySelector(".cd-btn.primary");e&&(e.disabled=!0,e.textContent="...");try{const{data:t,error:a}=await C.rpc("deduct_ap",{p_faction_id:v.id,p_cost:2});if(a)throw a;if(t<0){const s=-t-1;v.action_points=s,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+s+" AP</span>",e&&(e.disabled=!1,e.textContent="BID"),alert("Insufficient AP. You have "+s+" AP, need 2.");return}const{error:i}=await C.from("corp_contract_bids").insert({contract_id:me.id,faction_id:v.id,nation_id:v.nation_id,ap_spent:2,created_at_tick:N?.current_tick||null});if(i)throw await C.rpc("deduct_ap",{p_faction_id:v.id,p_cost:-2}),v.action_points=t+2,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+(t+2)+" AP</span>",i;v.action_points=t,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+t+" AP</span>",e&&(e.textContent="BID PLACED")}catch(t){e&&(e.disabled=!1,e.textContent="BID"),t.code==="23505"?alert("You have already placed a bid on this contract."):alert("Failed to place bid: "+(t.message||"Unknown error"))}finally{Ee=!1}}async function ot(){if(!v||!v.nation_id)return;const{data:e,error:t}=await C.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(t?(console.warn("Failed to load contracts:",t.message),ne=[]):ne=e||[],le={},v&&ne.length>0){const a=ne.map(s=>s.id),{data:i}=await C.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",v.id).in("contract_id",a);for(const s of i||[])le[s.contract_id]=s}Ze()}function Ft(){const e=document.getElementById("ap-list"),t=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=j.length+" ACTIVE",j.length===0){e.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,t.style.display="none";return}const a=N?.current_tick||0;let i=0,s=0,c="";for(const r of j){const o=r.issuer_type==="GOVERNMENT",l=o?"gov":"private",n=Array.isArray(r.contract_bids)?r.contract_bids[0]:r.contract_bids,d=n?.bid_price||0,p=n?.estimated_cost||0,m=n?.estimated_quality||0,f=r.budget_ceiling||0,y=r.awarded_at_tick||a,_=y+(r.timeline_ticks||8),b=Math.max(0,_-a),g=Math.max(0,a-y),w=r.timeline_ticks||8,T=Math.min(100,Math.round(g/w*100)),$=a>_;Je(r.sector);const h=fe(r.sector);i+=f,s+=d,c+=`<div class="ap-item" onclick="openProjectModal('${r.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${u(r.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${u(r.issuer_name||"—")} · ${h}</div>
                </div>
                <span class="oc-item__type-badge ${l}">${o?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS</span>
                    <span class="ap-budget__values" style="color:${$?"var(--red)":"var(--teal)"}">
                        ${g}/${w} ticks ${$?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${T}%;background:${$?"var(--red)":"var(--teal)"}"></div>
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
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${m>=70?"var(--green)":m>=40?"var(--teal)":"var(--orange)"}">${m}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${$?"var(--red)":"var(--text-bright)"}">${b} ticks</div>
                </div>
            </div>
        </div>`}e.innerHTML=c,t.style.display=j.length>0?"":"none",j.length>0&&(document.getElementById("ap-total-crew").textContent=j.length,document.getElementById("ap-total-budget").textContent=H(i),document.getElementById("ap-total-spent").textContent=H(s))}async function rt(){if(!v)return;const{data:e,error:t}=await C.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",v.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",v.id).order("awarded_at_tick",{ascending:!0});t?(console.warn("Failed to load active projects:",t.message),j=[]):j=e||[],Ft()}const lt=3e4;function ct(){let e=0,t=0;for(const a of Q)for(const i of Oe){const s=D[a.key]?.[i];s&&(e+=s.qty,t+=s.value)}return{totalUnits:e,totalValue:t}}function Re(){const e=document.getElementById("wh-list"),{totalUnits:t,totalValue:a}=ct();document.getElementById("wh-count").textContent=t.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=L(a);const i=Math.round(t/lt*100),s=document.getElementById("wh-capacity");s.textContent=i+"%",s.style.color=i>80?"var(--red)":i>50?"var(--orange)":"var(--green)";let c="";for(let r=0;r<Q.length;r++){const o=Q[r],l=Le===r,n=D[o.key]?.LOW||{qty:0,value:0},d=D[o.key]?.STD||{qty:0,value:0},p=D[o.key]?.HIGH||{qty:0,value:0},m=n.qty+d.qty+p.qty,f=n.value+d.value+p.value,y=m===0,_=ee(o.key,"LOW",x),b=ee(o.key,"STD",x),g=ee(o.key,"HIGH",x),w=n.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",T=d.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",$=g.available?p.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(c+='<div class="wh-row">',c+=`<div class="wh-row__collapsed${l?" expanded":""}" onclick="toggleWhRow(${r})">
            <span class="wh-row__arrow">${l?"▾":"▸"}</span>
            <span class="wh-row__name${y?" empty":""}">${u(o.name)}</span>
            <div class="wh-row__dots">
                <div class="${w}"></div>
                <div class="${T}"></div>
                <div class="${$}"></div>
            </div>
            <span class="wh-row__qty${y?" empty":""}">${m>0?m.toLocaleString():"—"}</span>
            <span class="wh-row__val${y?" empty":""}">${f>0?L(f):"—"}</span>
        </div>`,l){c+='<div class="wh-expand">',c+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const h=[{key:"LOW",label:"Low",data:n,avail:_,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:d,avail:b,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:p,avail:g,color:"var(--green)",dotClass:"wh-dot--high"}];for(const E of h){const M=!E.avail.available,k=E.data.qty>0,I=k?"$"+Math.round(E.data.value/E.data.qty):"—";c+=`<div class="wh-grade${M?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${E.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${M?"var(--red)":E.color}">${E.label}</span>
                        ${M?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${k?"var(--text-bright)":"var(--text-dim)"}">${k?E.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${E.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${E.data.value>0?L(E.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${I}</span>
                </div>`}for(const E of h)!E.avail.available&&E.avail.failedStat&&(c+=`<div class="wh-lock">
                        <span class="wh-lock__text">${E.label.toUpperCase()} GRADE LOCKED — ${u(E.avail.failedStat)} &lt; ${E.avail.failedMin}</span>
                    </div>`);c+="</div>"}c+="</div>"}e.innerHTML=c}function Vt(e){Le=Le===e?-1:e,Re()}async function Qt(){if(!v)return;const{data:e,error:t}=await C.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",v.id);if(D={},t)console.warn("Failed to load warehouse:",t.message);else if(e)for(const a of e)D[a.material_key]||(D[a.material_key]={}),D[a.material_key][a.quality_tier]={qty:a.quantity||0,value:Number(a.total_value)||0};Re()}const Yt={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function dt(){const e=(x?.name||v?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+e;const t=Number(v?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=L(t);const{totalUnits:a}=ct(),i=Math.round(a/lt*100),s=document.getElementById("pr-wh-capacity");s.textContent=i+"%",s.style.color=i>80?"var(--red)":i>50?"var(--orange)":"var(--green)",pt(),He(),ye()}function pt(){const e=document.getElementById("pr-mat-grid");let t="";for(const a of Q){const i=B===a.key,s=Oe.every(r=>!ee(a.key,r,x).available),c="pr-mat-btn"+(i?" active":"")+(s?" all-locked":"");t+=`<span class="${c}" onclick="setPrMat('${a.key}')">${u(a.name)}</span>`}e.innerHTML=t}function He(){const e=document.getElementById("pr-tier-bar");let t='<span class="pr-tier-label">GRADE</span>';for(const a of Oe){const i=ee(B,a,x),s=P===a,c=i.available?De(B,a,x):null,r=Ye[a],o=!i.available,l="pr-tier-btn"+(s?" active":"")+(o?" locked":"");t+=`<div class="${l}" onclick="${o?"":`setPrTier('${a}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${r};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${s?"var(--text-bright)":"var(--text-dim)"}">${qe[a]}</span>
            </div>
            ${c!==null?`<div class="pr-tier-btn__price" style="color:${s?"var(--text-bright)":"var(--text-muted)"}">$${c}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}e.innerHTML=t}function ye(){const e=document.getElementById("pr-content"),t=ee(B,P,x),a=Q.find(g=>g.key===B);if(!a)return;if(!t.available){e.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${u(a.name)} — ${qe[P]} grade
                    is not produced domestically in ${u(x?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${u(t.failedStat||"unknown")} &lt; ${t.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const i=De(B,P,x),s=Ke(B,P,x),c=i*te,r=s>3e3?"LOW":s>1e3?"MODERATE":"HIGH",o=r==="LOW"?"var(--green)":r==="MODERATE"?"var(--amber)":"var(--red)",l=Number(x?.inflation??50),n=l>55?"up":l<45?"down":"flat",d=n==="up"?"&#9650;":n==="down"?"&#9660;":"&#8212;",p=n==="up"?"var(--red)":n==="down"?"var(--green)":"var(--text-dim)";let m="";m+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
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
                <div class="pr-market-cell__value" style="font-size:12px;color:${o};margin-top:2px;">${r}</div>
            </div>
        </div>
    </div>`,m+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${u(x?.name||"—")})</div>`;for(const g of a.priceDrivers){const w=Number(x?.[g]??50),T=w>=50?"var(--green)":w>=30?"var(--amber)":w>=15?"var(--orange)":"var(--red)",$=Yt[g]||g;m+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${u(g)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${w}%;background:${T}"></div>
            </div>
            <span class="pr-driver-row__val">${w}</span>
            <span class="pr-driver-row__effect">${u($)}</span>
        </div>`}m+="</div>";const y=(Number(v?.corp_cash_reserves)||0)>=c,_=te>s,b=Ye[P];m+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${u(a.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${b};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${b}">${qe[P]}</span>
                </div>
                <span class="pr-order__mat-price">$${i}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(g=>`<span class="pr-qty-btn${te===g?" active":""}" onclick="setPrQty(${g})">${g>=1e3?g/1e3+"k":g}</span>`).join("")}
                </div>
            </div>
            ${_?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${s.toLocaleString()} this tick</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${L(c)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${y&&!_?"":"disabled"}
                    title="${y?_?"Exceeds supply":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,e.innerHTML=m}function Kt(e){B=e,P="STD";for(const t of["STD","HIGH","LOW"])if(ee(e,t,x).available){P=t;break}pt(),He(),ye()}function Jt(e){P=e,He(),ye()}function Xt(e){te=e,ye()}let ke=!1;async function Zt(){if(ke||!v||!x)return;const e=De(B,P,x),t=Ke(B,P,x),a=e*te,i=Number(v.corp_cash_reserves)||0;if(a>i){alert("Insufficient cash reserves.");return}if(te>t){alert("Exceeds available supply this tick.");return}ke=!0;const s=document.querySelector(".pr-purchase-btn");s&&(s.disabled=!0,s.textContent="...");try{const c=i-a,{error:r}=await C.from("factions").update({corp_cash_reserves:c}).eq("id",v.id);if(r)throw r;const o=D[B]?.[P],l=(o?.qty||0)+te,n=(o?.value||0)+a,{error:d}=await C.from("corp_warehouse").upsert({faction_id:v.id,nation_id:v.nation_id,material_key:B,quality_tier:P,quantity:l,total_value:n,last_purchased_tick:N?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(d){const{error:p}=await C.from("factions").update({corp_cash_reserves:i}).eq("id",v.id);throw p&&console.error("Cash refund failed after warehouse error:",p.message),d}v.corp_cash_reserves=c,D[B]||(D[B]={}),D[B][P]={qty:l,value:n},Re(),dt(),s&&(s.textContent="PURCHASED",setTimeout(()=>{s.isConnected&&(s.disabled=!1,s.textContent="PURCHASE")},1500))}catch(c){s&&(s.disabled=!1,s.textContent="PURCHASE"),alert("Purchase failed: "+(c.message||"Unknown error"))}finally{ke=!1}}function mt(e){const t=ae||x;if(!t)return[];const a=ve(e);if(!a)return[];const i=ht(e,t),s=[],c=Number(t?.inflation??50),r=Number(t?.fuel_prices??50);Number(t?.manufacturing_output??50);const o=ae&&x&&ae.id!==x.id;let l=null;if(o&&(l=xt(t,x)),i.newAvailable>0){const n=je(e,t),d=a.basePrice,p=Math.round(d*((c-50)/200)),m=Math.round(d*((r-50)/300));let f=n;const y=[{label:"Base price",value:L(d)},p!==0?{label:`Inflation (${c})`,mod:(p>=0?"+":"")+L(Math.abs(p))}:null,m!==0?{label:`Fuel transport (${r})`,mod:(m>=0?"+":"")+L(Math.abs(m))}:null].filter(Boolean),_=n-d-p-m;if(_!==0&&!o&&y.push({label:"Demand/scarcity",mod:(_>=0?"+":"")+L(Math.abs(_))}),o&&l){const b=Math.round(n*l.tariff),g=Math.round(n*l.transport);f=n+b+g,y.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+L(b)}),y.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+L(g)})}s.push({seller:o?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:o?l?.deliveryTicks||1:0,condition:100,price:Math.round(f),available:i.newAvailable,delivery:o?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:o?l.deliveryTicks:0,used:!1,priceFactors:y,sourceNationId:t.id})}if(i.usedAvailable>0){const n=i.usedCondition,d=je(e,t,{used:!0,condition:n});let p=d;const m=[{label:"Base price",value:L(a.basePrice)},{label:`Condition (${n}%)`,mod:"-"+L(Math.max(0,a.basePrice-d))}];if(o&&l){const f=Math.round(d*l.tariff),y=Math.round(d*l.transport);p=d+f+y,m.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+L(f)}),m.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+L(y)})}s.push({seller:o?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:o?l?.deliveryTicks||1:0,condition:n,price:Math.round(p),available:i.usedAvailable,delivery:o?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:o?l.deliveryTicks:0,used:!0,priceFactors:m,sourceNationId:t.id})}return s}function ge(){const e=Number(v?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=L(e);const t=ve(R),a=ce[t?.tier||1],i=document.getElementById("em-tier-badge");i&&(i.textContent=a.tag,i.style.color=a.color),i.style.background=a.color+"0a",i.style.border="1px solid "+a.color+"33";const s=document.getElementById("em-nation-select");if(s&&s.options.length===0){const o=x?.name||v?.nation||"—";let l=`<option value="">${u(o)} (HQ)</option>`;for(const n of pe)n.id!==x?.id&&(l+=`<option value="${n.id}">${u(n.name)}</option>`);s.innerHTML=l}const c=document.getElementById("em-import-tag"),r=ae&&x&&ae.id!==x.id;c&&(c.style.display=r?"":"none"),ea(),ze()}function ea(){let e="";for(let t=1;t<=3;t++){const a=ce[t],i=Me(t),s=t===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";e+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${a.color}">${a.tag}</div>
            <div class="${s}">`;for(const c of i){const r=R===c.key,o=mt(c.key).length>0;e+=`<span class="em-selector__btn${r?" active":""}${o?"":" no-listings"}"
                style="${r?"background:"+a.color+";border-color:"+a.color:""}"
                onclick="setEmType('${c.key}')">${u(c.name)}</span>`}e+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${e}</div>`}function ze(){const e=document.getElementById("em-content");if(J=mt(R),J.length===0){e.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}F>=J.length&&(F=0);let t="";for(let i=0;i<J.length;i++){const s=J[i],c=F===i,r=s.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",o=Qe(s.condition);t+=`<div class="em-listing${c?" selected":""}" style="${c?"border-left-color:"+r:""}" onclick="setEmListing(${i})">`,t+=`<div class="em-listing__row1">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="em-listing__seller">${u(s.seller)}</span>
                <span class="em-badge em-badge--${s.sellerType.toLowerCase()}">${s.sellerType}</span>
                ${s.used?'<span class="em-badge em-badge--used">USED</span>':""}
            </div>
        </div>`,t+=`<div class="em-listing__row2">
            <span class="em-listing__nation">${u((s.nation||"").toUpperCase())}</span>
            ${s.distance>0?`<span class="em-listing__distance">${s.distance} nation${s.distance>1?"s":""} away</span>`:""}
            <span class="em-listing__delivery">Delivery: ${u(s.delivery)}</span>
        </div>`,t+=`<div class="em-listing__stats">
            <div class="em-stat-cell" style="flex:1">
                <div class="em-stat-cell__label">COND.</div>
                <div class="em-stat-cell__bar">
                    <div class="em-stat-cell__bar-track"><div class="em-stat-cell__bar-fill" style="width:${s.condition}%;background:${o}"></div></div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${o}">${s.condition}%</span>
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
                    <span class="em-breakdown__label">${u(l.label)}</span>
                    <span class="em-breakdown__mod" style="color:${l.mod?l.mod.startsWith("-")?"var(--green)":l.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${l.mod||l.value}</span>
                </div>`).join("")}
            </div>`),t+="</div>"}const a=J[F];if(a){const i=ve(R),s=ce[i?.tier||1],c=Math.min(a.available,4),r=a.price*V,o=(Number(v?.corp_cash_reserves)||0)>=r;t+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${u(i?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${u(a.seller)}</span>
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
                    <div class="em-purchase__total-value">${L(r)}</div>
                    ${a.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${u(a.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${s.color}" onclick="purchaseEquipment()"
                    ${o?"":"disabled"}
                    title="${o?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}e.innerHTML=t}async function ta(e){if(!e)ae=null;else{let a=pe.find(i=>i.id===e);if(!a)try{const{data:i}=await C.from("nations").select("*").eq("id",e).single();a=i}catch{}ae=a||null}F=0,V=1;const t=document.getElementById("em-nation-select");t&&(t.value=e||""),ge()}function aa(e){R=e,F=0,V=1,ge()}function sa(e){F=e,V=1,ze()}function ia(e){V=e,ze()}let Ie=!1;async function na(){if(Ie)return;const e=J[F];if(!e||!v)return;const t=ve(R);if(!t)return;const a=V,i=e.price*a,s=Number(v.corp_cash_reserves)||0;if(i>s){alert("Insufficient cash reserves.");return}if(a>e.available){alert("Not enough units available.");return}const c=document.querySelector(".em-purchase-btn");c&&(c.disabled=!0,c.textContent="..."),Ie=!0;try{const r=s-i,{error:o}=await C.from("factions").update({corp_cash_reserves:r}).eq("id",v.id);if(o)throw o;const l=!e.deliveryTicks||e.deliveryTicks===0;if(l){const d=G.find(T=>T.equipment_key===R),p=(d?.owned||0)+a,m=d?.purchase_price_avg||0,f=d?.owned||0,y=f>0?Math.round((m*f+e.price*a)/p):e.price,_=t.maintenancePerUnit*p,b=d?.condition||100,g=Math.round((b*f+e.condition*a)/p),{error:w}=await C.from("corp_equipment").upsert({faction_id:v.id,nation_id:v.nation_id,equipment_key:R,tier:t.tier,owned:p,deployed:d?.deployed||0,condition:g,maintenance_per_tick:_,purchase_price_avg:y,last_purchased_tick:N?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(w){const{error:T}=await C.from("factions").update({corp_cash_reserves:s}).eq("id",v.id);throw T&&console.error("Cash refund failed:",T.message),w}d?(d.owned=p,d.condition=g,d.maintenance_per_tick=_):G.push({equipment_key:R,tier:t.tier,owned:p,deployed:0,condition:g,maintenance_per_tick:_,assigned_projects:[]})}else{const d=(N?.current_tick||0)+e.deliveryTicks,{error:p}=await C.from("corp_equipment_deliveries").insert({faction_id:v.id,equipment_key:R,quantity:a,condition:e.condition,delivery_tick:d,source_nation_id:e.sourceNationId||null,seller_name:e.seller,price_paid:i});if(p){const{error:m}=await C.from("factions").update({corp_cash_reserves:s}).eq("id",v.id);throw m&&console.error("Cash refund failed:",m.message),p}}v.corp_cash_reserves=r,Ue(),ge();const n=document.getElementById("pr-cash");n&&(n.textContent=L(r)),c&&(c.textContent=l?"PURCHASED":"ORDERED",setTimeout(()=>{c.isConnected&&(c.disabled=!1,c.textContent="PURCHASE")},1500))}catch(r){c&&(c.disabled=!1,c.textContent="PURCHASE"),alert("Purchase failed: "+(r.message||"Unknown error"))}finally{Ie=!1}}let oa=-1,re=[],Pe=[],ut=[];function Te(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function ra(e,t,a){if(a)return"var(--orange)";const i=e/(t||1)*100;return i>50?"var(--green)":i>25?"var(--amber)":"var(--red)"}function la(){const e=document.getElementById("pm-list"),t=re.length,a=Pe.length,i=ut.length,s=re.filter(l=>l.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${t})`,document.getElementById("pm-pending-count").textContent=`(${a})`,document.getElementById("pm-apply-count").textContent=`(${i})`;const c=document.getElementById("pm-badges");let r="";s>0&&(r+=`<span class="pm-badge pm-badge--expiring">${s} EXPIRING</span>`),a>0&&(r+=`<span class="pm-badge pm-badge--pending">${a} PENDING</span>`),c.innerHTML=r;const o=re.reduce((l,n)=>l+(n.cost||0),0)+Pe.reduce((l,n)=>l+(n.cost||0),0);document.getElementById("pm-total-cost").textContent=Te(o),document.getElementById("pm-footer-active").textContent=t,document.getElementById("pm-footer-pending").textContent=a;{if(t===0){e.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let l="";re.forEach((n,d)=>{const p=oa===d,m=ra(n.ticks_left,n.total_ticks,n.expiring_soon),f=Math.min(n.ticks_left/(n.total_ticks||1)*100,100);l+=`<div class="pm-item ${n.expiring_soon?"pm-item--expiring":""} ${p?"expanded":""}" onclick="togglePmExpand(${d})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${u(n.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${u((n.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${m}">Expires: ${u(n.expires||"")}</span>
                        <span class="pm-item__ticks">(${n.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${f}%;background:${m}"></div></div>`,p&&(l+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${u(n.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${u(n.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${Te(n.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${n.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${n.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(n.projects||[]).map(y=>`<span class="pm-project-chip">${u(y)}</span>`).join("")}</div>
                    </div>`,n.note&&(l+=`<div class="pm-note"><span class="pm-note__text">${u(n.note)}</span></div>`),n.expiring_soon&&n.renewable&&(l+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew">RENEW — ${Te(n.cost||0)}</button></div>`),l+="</div>"),l+="</div></div>"}),e.innerHTML=l;return}}function ca(){re=[],Pe=[],ut=[],la()}let Z=[],da=-1;function W(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function Fe(e){return e>=85?"var(--gold)":e>=60?"var(--green)":e>=40?"var(--orange)":"var(--red)"}function pa(e){return"dl-result--"+e.toLowerCase()}function Ve(){const e=document.getElementById("dl-list"),t=Z.length;document.getElementById("dl-count").textContent=`${t} COMPLETED`;const a=Z.reduce((o,l)=>{const n=l.financials||{};return o+((n.payment||0)+(n.bonus||0)-(n.penalty||0)-(n.total_cost||0))},0),i=document.getElementById("dl-lifetime-profit");i.textContent=(a>=0?"+":"")+W(a),i.style.color=a>=0?"var(--green)":"var(--red)";const s={};Z.forEach(o=>{s[o.result]=(s[o.result]||0)+1});const c=document.getElementById("dl-footer-results");if(c.innerHTML=Object.entries(s).map(([o,l])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[o]||"var(--text-dim)"}">${u(o)}</div>
            <div class="dl-footer__result-count">${l}</div>
        </div>`).join(""),t===0){e.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let r="";Z.forEach((o,l)=>{const n=da===l,d=o.financials||{},p=(d.payment||0)+(d.bonus||0)-(d.penalty||0)-(d.total_cost||0),m=p>=0,f=pa(o.result),_={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[o.result]||"var(--text-dim)",b=o.type==="GOVERNMENT";if(r+=`<div class="dl-item ${n?"expanded":""}" onclick="toggleDlExpand(${l})">
            <div class="dl-item__inner" style="border-left:2px solid ${_}">
                <div class="dl-item__row1">
                    <span class="dl-item__name">${u(o.name)}</span>
                    <span class="dl-result-badge ${f}">${u(o.result)}</span>
                </div>
                <div class="dl-item__row2">
                    <span class="dl-item__id">${u(o.id)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                    <span class="dl-item__issuer" style="color:${b?"var(--green)":"var(--gold)"}">${u(o.issuer)}</span>
                    <span class="dl-item__date">${u(o.delivered)}</span>
                </div>
                <div class="dl-summary-bar">
                    <div class="dl-summary-cell" style="flex:1;">
                        <div class="dl-summary-label">QUALITY</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span class="dl-summary-value" style="color:${Fe(o.quality_score)}">${o.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${o.rep_change>0?"var(--green)":o.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${o.rep_change>0?"+":""}${o.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${m?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${m?"var(--green)":"var(--red)"};margin-top:2px;">${m?"+":""}${W(p)}</div>
                    </div>
                </div>`,n){const g=o.inspection||{};r+='<div style="margin-top:8px;">',r+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(h=>{const E=g[h]||{score:0,issues:[]},M=Fe(E.score),k=Math.min(E.score/100*100,100);r+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${u(h.charAt(0).toUpperCase()+h.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${k}%;background:${M}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${M}">${E.score}</span>
                        </div>
                    </div>
                    ${(E.issues||[]).map(I=>`<div class="dl-inspect-issue">${u(I)}</div>`).join("")}
                </div>`});const w=g.permits||{passed:!0,issues:[]};r+=`<div class="dl-permits-row ${w.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${w.passed?"var(--green)":"var(--red)"}">${w.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${(w.issues||[]).map(h=>`<div class="dl-inspect-issue dl-inspect-issue--red">${u(h)}</div>`).join("")}
            </div>`,r+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',r+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(o.materials_used||[]).forEach(h=>{const E=h.grade==="HIGH"?"var(--green)":h.grade==="STANDARD"?"var(--amber)":"var(--orange)",M=h.impact==="positive"?"▲":h.impact==="negative"?"▼":"–",k=h.impact==="positive"?"var(--green)":h.impact==="negative"?"var(--red)":"var(--text-dim)";r+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${u(h.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${E}"></div>
                    <span class="dl-mat-tag__grade" style="color:${E}">${u(h.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${k}">${M}</span>
                </div>`}),r+="</div>",r+='<div class="dl-section-label">Financial Summary</div>',r+='<div class="dl-fin-panel">',r+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${W(d.contract_value||0)}</span></div>`,(d.bonus||0)>0&&(r+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${W(d.bonus)}</span></div>`),(d.penalty||0)>0&&(r+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${W(d.penalty)}</span></div>`);const T=(d.payment||0)+(d.bonus||0)-(d.penalty||0);r+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${W(T)}</span></div>`,r+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${W(d.total_cost||0)}</span></div>`,r+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${m?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${m?"var(--green)":"var(--red)"}">${m?"+":""}${W(p)}</span>
            </div>`,r+="</div>";const $=o.timeline||{};r+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${$.actual||0}/${$.expected||0} ticks</span>`,$.early?r+=`<span class="dl-timeline__badge dl-timeline__badge--early">${($.expected||0)-($.actual||0)} TICK${$.expected-$.actual!==1?"S":""} EARLY</span>`:!$.on_time&&$.actual>$.expected&&(r+=`<span class="dl-timeline__badge dl-timeline__badge--late">${($.actual||0)-($.expected||0)} TICK${$.actual-$.expected!==1?"S":""} LATE</span>`),r+="</div>",r+="</div>"}r+="</div></div>"}),e.innerHTML=r}async function ma(){if(!v){Z=[],Ve();return}const{data:e,error:t}=await C.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",v.id).order("delivered_at_tick",{ascending:!1}).limit(20);t?(console.warn("Failed to load deliveries:",t.message),Z=[]):Z=(e||[]).map(a=>{const i=a.construction_contracts||{};return{id:a.contract_id,name:i.name||"Project",type:i.issuer_type||"GOVERNMENT",issuer:i.issuer_name||"Government",delivered:"Tick "+(a.delivered_at_tick||0),result:a.result,quality_score:a.quality_score,rep_change:a.rep_change,financials:{contract_value:a.contract_value||0,bonus:a.quality_bonus||0,penalty:a.penalties||0,payment:a.payment_received||0,total_cost:a.total_cost||0},inspection:a.inspection||{},materials_used:a.materials_used||[],timeline:{expected:a.timeline_expected||0,actual:a.timeline_actual||0,on_time:a.on_time,early:a.timeline_actual<a.timeline_expected}}}),Ve()}function Ue(){const e=G.reduce((o,l)=>o+(l.owned||0),0),t=G.reduce((o,l)=>o+(l.deployed||0),0),a=$t(G),i=e-t;document.getElementById("eq-count").textContent=e+" UNITS",document.getElementById("eq-summary").innerHTML=`
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
        </div>`;const s={};for(const o of G)s[o.equipment_key]=o;let c="";for(let o=1;o<=3;o++){const l=ce[o],n=Me(o),d=Ae===o,p=n.reduce((f,y)=>f+(s[y.key]?.owned||0),0),m=n.reduce((f,y)=>f+(s[y.key]?.deployed||0),0);if(c+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${o})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${d?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${l.color}">${u(l.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${l.color};border:1px solid ${l.color}33;background:${l.color}0a">${l.tag}</span>
            </div>
            ${p>0?`<span class="eq-tier-hdr__count">${m}/${p}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,d)for(const f of n){const y=s[f.key],_=y?.owned||0,b=y?.deployed||0,g=y?.condition||0,w=f.maintenancePerUnit*_,T=_-b,$=_>0&&T===0,h=_>0&&g<65,E=Qe(g),M=y?.assigned_projects||[],k=M.length>0?M.map(I=>I.contract_name||"Project").join(", ").slice(0,30):_>0&&b>0?b+" project"+(b>1?"s":""):"—";c+=`<div class="eq-row${_===0?" unowned":""}">`,c+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${_===0?" dim":""}">${u(f.name)}</span>
                        ${h?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${_>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${$?"var(--orange)":"var(--green)"}">${T}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${b}/${_}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,_>0?c+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${g}%;background:${E}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${E}">${g}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${u(k)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${L(w)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:c+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',c+="</div>"}}document.getElementById("eq-list").innerHTML=c;const r=[1,2,3].map(o=>{const l=ce[o],n=Me(o).reduce((d,p)=>d+(s[p.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${n>0?l.color+"33":"var(--border-0)"};background:${n>0?l.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${l.color}">${l.tag}</div>
            <div class="eq-footer__tier-count" style="color:${n>0?"var(--text-bright)":"var(--text-dim)"}">${n}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${L(a)}</div>
        </div>
        <div class="eq-footer__tiers">${r}</div>`}function ua(e){Ae=Ae===e?-1:e,Ue()}async function va(){if(!v)return;const{data:e,error:t}=await C.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",v.id);t?(console.warn("Failed to load equipment:",t.message),G=[]):G=e||[],Ue()}async function fa(){const{data:{user:e}}=await C.auth.getUser();if(!e){window.location.href="login.html";return}const{data:t}=await C.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);oe=(t||[]).filter(n=>n.nation_id);const a=sessionStorage.getItem("active_faction_id");if(v=oe.find(n=>n.id===a)||oe.find(n=>n.faction_type==="corporation")||oe[0],!v){await C.auth.signOut(),window.location.href="login.html";return}if(v.faction_type!=="corporation"){window.location.href="dashboard.html";return}const[i,s]=await Promise.all([v.nation_id?C.from("nations").select("*").eq("id",v.nation_id).single():Promise.resolve({data:null}),C.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);i.error&&console.warn("Nation load failed:",i.error.message),i.data&&(x=i.data),s.error&&console.warn("Shard load failed:",s.error.message),N=s.data;const c=v.corp_ticker||v.abbreviation||"";if(document.getElementById("corp-logo").textContent=c.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=v.faction_name||"Unnamed Corp",N){if(document.getElementById("game-date").textContent=N.current_date||"—",document.getElementById("tick-number").textContent=N.current_tick||"—",N.next_tick_at){const d=(Number(N.tick_interval_hours)||8)*36e5,p=new Date(N.next_tick_at).getTime(),f=p-d+d/2;Se=new Date(f>Date.now()?f:p+d/2),Et()}const n=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");n&&(n.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(c?"["+c+"]":v.faction_name||"Corp")+" ▾";const r=document.getElementById("topbar-cash");if(r){const n=Number(v.corp_cash_reserves??0),d=n>=1e9?"$"+(n/1e9).toFixed(1)+"B":n>=1e6?"$"+(n/1e6).toFixed(1)+"M":"$"+Math.round(n/1e3)+"k";r.textContent="CASH: "+d}const o=v.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+o+" AP</span>",document.getElementById("nation-pill").textContent=(x?.name||v.nation||"—").toUpperCase();const l=document.getElementById("corp-faction-dropdown");if(l){let n="";for(const d of oe){const p=d.id===v.id,m=d.faction_type==="corporation"?"CORP":"PARTY",f=d.faction_type==="corporation"?"var(--teal)":"var(--amber)";n+=`<div class="corp-dd-item${p?" active":""}" onclick="switchToFaction('${d.id}', '${d.faction_type}')">
                <span class="corp-dd-type" style="color:${f}">${m}</span>
                <span class="corp-dd-name">${u(d.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${u(d.abbreviation||"—")}]</span>
            </div>`}l.innerHTML=n}await Promise.all([ot(),rt(),Qt(),va(),ca(),ma()]);try{const{data:n}=await C.from("nations").select("*").order("name");pe=n||[]}catch{pe=[]}if(dt(),ge(),bt(v,x,N),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",new URLSearchParams(window.location.search).get("tab")==="expansion"){const n=document.querySelector('[data-tab="expansion"]');n&&ft({preventDefault:()=>{},target:n})}}async function _a(){await C.auth.signOut(),window.location.href="login.html"}function ya(){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.toggle("open")}function ga(e,t){const a=document.getElementById("corp-faction-dropdown");a&&a.classList.remove("open"),sessionStorage.setItem("active_faction_id",e),t==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",e=>{const t=document.getElementById("faction-switcher"),a=document.getElementById("corp-faction-dropdown");a&&t&&!t.contains(e.target)&&a.classList.remove("open")});document.addEventListener("keydown",e=>{e.key==="Escape"&&tt()});window.doLogout=_a;window.toggleTheme=kt;window.toggleCorpDropdown=ya;window.switchToFaction=ga;window.setFilter=It;window.openContractDetail=et;window.closeContractDetail=tt;window.placeBid=Wt;window.toggleWhRow=Vt;window.toggleEqTier=ua;window.switchEmNation=ta;window.setEmType=aa;window.setEmListing=sa;window.setEmQty=ia;window.purchaseEquipment=na;window.setPrMat=Kt;window.setPrTier=Jt;window.setPrQty=Xt;window.purchaseMaterial=Zt;let z={general:0,skilled:0,innovative:0},Ce=!1;const ue=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function vt(e){const t=Number(x?.minimum_wage??50),a=Number(x?.inflation??50),i=Number(x?.standard_of_living??50),s=t/100*48e3,c=1+(a-50)/100*.5,r=1+(i-50)/100*.5;return Math.round(s*e*c*r)}function S(e){const t=Math.abs(e),a=e<0?"-":"";return t>=1e9?a+"$"+(t/1e9).toFixed(2)+"B":t>=1e6?a+"$"+(t/1e6).toFixed(2)+"M":t>=1e3?a+"$"+(t/1e3).toFixed(1)+"k":a+"$"+t.toLocaleString()}function ft(e){e.preventDefault(),document.getElementById("operations-content").style.display="none";const t=document.getElementById("expansion-content");t.style.display="flex",t.style.justifyContent="center",t.style.gap="12px",t.style.alignItems="flex-start",t.style.flexWrap="wrap",document.querySelectorAll(".corp-nav__tab").forEach(a=>a.classList.remove("active")),e.target.classList.add("active"),be(),xa(),wa()}function _t(e){e&&e.preventDefault(),document.getElementById("operations-content").style.display="",document.getElementById("expansion-content").style.display="none",document.querySelectorAll(".corp-nav__tab").forEach(t=>t.classList.remove("active")),document.querySelector('[data-tab="operations"]')?.classList.add("active")}function ba(e,t){const a=ue.find(c=>c.id===e),i=Number(v?.[a.factionKey]??0),s=z[e]+t;i+s<0||(z[e]=s,be())}function $a(e){e?z[e]=0:z={general:0,skilled:0,innovative:0},be()}async function ha(){if(Ce||!Object.values(z).some(s=>s!==0))return;let t=0;for(const s of ue){const c=z[s.id];c>0&&(t+=c*vt(s.multiplier)*.1)}const a=Number(v?.corp_cash_reserves??0);if(t>a){alert("Insufficient cash reserves. Hiring cost: "+S(t)+", available: "+S(a));return}const i=t>0?`Confirm workforce changes?

Hiring fee: `+S(t)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(i)){Ce=!0;try{const s={};for(const o of ue){const l=Number(v?.[o.factionKey]??0);s[o.factionKey]=Math.max(0,l+z[o.id])}t>0&&(s.corp_cash_reserves=Math.max(0,a-Math.round(t)));const{error:c}=await C.from("factions").update(s).eq("id",v.id);if(c)throw c;Object.assign(v,s),z={general:0,skilled:0,innovative:0};const r=document.getElementById("topbar-cash");if(r){const o=Number(v.corp_cash_reserves??0);r.textContent="CASH: "+(o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k")}be()}catch(s){alert("Error: "+s.message)}finally{Ce=!1}}}function be(){const e=document.getElementById("hf-card-container");if(!e)return;const t="'JetBrains Mono', monospace",a={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=Number(x?.minimum_wage??50),s=Number(x?.inflation??50),c=Number(x?.standard_of_living??50),r=i/100*48e3,o=(1+(s-50)/100*.5).toFixed(2),l=(1+(c-50)/100*.5).toFixed(2),n=x?.name||v?.nation||"Nation",d=Object.values(z).some(g=>g!==0);let p=0,m=0,f=0,y=0,_="";for(const g of ue){const w=Number(v?.[g.factionKey]??0),T=z[g.id],$=w+T,h=vt(g.multiplier),E=T>0,M=w*h,k=$*h,I=k-M;p+=w,m+=$,f+=M,y+=k;const U=T!==0?E?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";_+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${a.border};background:${U};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${g.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${a.text}">${g.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${a.text}">${w.toLocaleString()}</span>
                    ${T!==0?`<span style="font-family:${t};font-size:10px;color:${a.dim}">→</span>
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${E?a.greenBright:a.red}">${$.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${t};font-size:8px;color:${a.dim}">WAGE (MIN × ${g.multiplier}.0 × ${o} × ${l})</span>
                <span style="font-family:${t};font-size:10px;color:${g.color}">${S(h)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${g.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${a.red};border:1px solid ${a.border};cursor:pointer;background:${a.card}">-50</div>
                <div onclick="hfSetChange('${g.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${a.redDim};border:1px solid ${a.border};cursor:pointer;background:${a.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${T!==0?a.card:"transparent"};border:1px solid ${T!==0?a.border:"transparent"}">
                    ${T!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${t};font-size:12px;font-weight:700;color:${E?a.greenBright:a.red}">${E?"+":""}${T}</span>
                        <span onclick="hfReset('${g.id}')" style="font-family:${t};font-size:8px;color:${a.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${t};font-size:9px;color:${a.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${g.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${a.greenBright};border:1px solid ${a.border};cursor:pointer;background:${a.card}">+10</div>
                <div onclick="hfSetChange('${g.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${a.greenBright};border:1px solid ${a.border};cursor:pointer;background:${a.card}">+50</div>
            </div>
            ${T!==0?`<div style="margin-top:6px;padding:4px 8px;background:${a.bg};border:1px solid ${a.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${t};font-size:8px;color:${a.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${I>0?a.red:a.greenBright}">${I>0?"+":""}${S(I)}/yr</span>
            </div>`:""}
        </div>`}const b=y-f;e.innerHTML=`
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
                        <div style="font-family:${t};font-size:7px;color:${a.dim}">${S(r)}/yr</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${a.border}">
                        <div style="font-family:${t};font-size:7px;color:${a.dim};letter-spacing:0.5px">INFLATION</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${a.text}">${s}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${a.dim}">×${o}</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;">
                        <div style="font-family:${t};font-size:7px;color:${a.dim};letter-spacing:0.5px">STD OF LIVING</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${a.text}">${c}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${a.dim}">×${l}</div>
                    </div>
                </div>
            </div>
            ${_}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${a.border};background:${a.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;${d?"margin-bottom:6px;":""}">
                <div>
                    <div style="font-family:${t};font-size:7px;color:${a.dim};letter-spacing:0.8px">TOTAL WORKFORCE</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <span style="font-family:${t};font-size:13px;font-weight:700;color:${a.text}">${p.toLocaleString()}</span>
                        ${d?`<span style="font-family:${t};font-size:9px;color:${a.dim}">→</span>
                        <span style="font-family:${t};font-size:13px;font-weight:700;color:${m>p?a.greenBright:m<p?a.red:a.text}">${m.toLocaleString()}</span>`:""}
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${t};font-size:7px;color:${a.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${a.text}">${S(f)}</span>
                        ${d?`<span style="font-family:${t};font-size:9px;color:${a.dim}">→</span>
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${b>0?a.red:a.greenBright}">${S(y)}</span>`:""}
                    </div>
                </div>
            </div>
            ${d?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${a.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${t};font-size:8px;color:${a.dim}">NET CHANGE</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${b>0?a.red:a.greenBright}">${b>0?"+":""}${S(b)}/yr</span>
                    <span style="font-family:${t};font-size:8px;color:${a.dim}">(${b>0?"+":""}${S(Math.round(b/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${t};font-size:8px;font-weight:700;letter-spacing:1px;color:${a.dim};border:1px solid ${a.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${t};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${a.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}function xa(){const e=document.getElementById("wf-summary-container");if(!e)return;const t="'JetBrains Mono', monospace",a={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},i=(x?.name||v?.nation||"Nation").toUpperCase(),s=Number(x?.minimum_wage??50),c=Number(x?.inflation??50),r=Number(x?.standard_of_living??50),o=s/100*48e3,l=1+(c-50)/100*.5,n=1+(r-50)/100*.5,d=[{label:"General Workforce",mult:2,color:a.accent,key:"corp_general_workforce",countColor:a.text},{label:"Skilled Workforce",mult:3,color:a.gold,key:"corp_skilled_workforce",countColor:a.blue},{label:"Innovative Workforce",mult:6,color:a.orange,key:"corp_innovative_workforce",countColor:a.gold}];let p=0,m=0,f="";for(const y of d){const _=Number(v?.[y.key]??0),b=Math.round(o*y.mult*l*n),g=_*b;p+=_,m+=g,f+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${a.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${a.text}">${y.label}</span>
                    <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${a.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${i}</span>
                </div>
                <span style="font-family:${t};font-size:16px;font-weight:700;color:${y.countColor}">${_.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${t};font-size:8px;color:${a.dim}">WAGE (MIN × ${y.mult}.0 × ${l.toFixed(2)} × ${n.toFixed(2)})</span>
                <span style="font-family:${t};font-size:10px;color:${a.muted}">${S(b)}/yr</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1px;">
                <span style="font-family:${t};font-size:8px;color:${a.dim}">TOTAL ANNUAL COST</span>
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${a.text}">${S(g)}</span>
            </div>
        </div>`}e.innerHTML=`
    <div style="width:380px;height:450px;background:${a.surface};border:1px solid ${a.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${a.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${a.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${a.muted};text-transform:uppercase">Workforce</span>
            </div>
            <span style="font-family:${t};font-size:12px;font-weight:700;color:${a.text}">${p.toLocaleString()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${f}
            <div style="padding:8px 12px;background:${a.card};border-bottom:1px solid ${a.border};">
                <div style="font-family:${t};font-size:8px;letter-spacing:1px;color:${a.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="font-family:${t};font-size:8px;color:${a.dim}">MINIMUM WAGE (${i})</span>
                    <span style="font-family:${t};font-size:9px;color:${a.text}">${s}/100 → ${S(o)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${t};font-size:8px;color:${a.dim}">INFLATION MODIFIER</span>
                    <span style="font-family:${t};font-size:9px;color:${a.text}">×${l.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${t};font-size:8px;color:${a.dim}">STD OF LIVING MODIFIER</span>
                    <span style="font-family:${t};font-size:9px;color:${a.text}">×${n.toFixed(2)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${a.border};background:${a.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${t};font-size:8px;color:${a.dim};letter-spacing:0.8px">TOTAL WORKFORCE</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${a.text}">${p.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${t};font-size:8px;color:${a.dim};letter-spacing:0.8px">TOTAL ANNUAL WAGES</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${a.red}">${S(m)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-family:${t};font-size:8px;color:${a.dim};letter-spacing:0.8px">PER TICK (÷12)</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${a.red}">${S(Math.round(m/12))}</span>
            </div>
        </div>
    </div>`}function wa(){const e=document.getElementById("property-card-container");if(!e)return;const t="'JetBrains Mono', monospace",a={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",green:"#4a8",red:"#c55",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=(x?.name||v?.nation||"Nation").toUpperCase(),s=Number(x?.inflation??50),c=Number(x?.stability??50),r=Number(x?.civil_unrest??20),o=8e6,l=1+(s-50)/100*.08,n=.8+c/100*.4,d=Math.max(.5,1-r/100*.5),p=Math.round(o*l*n*d),m=b=>b>=1?`<span style="color:${a.green}">×${b.toFixed(2)}</span>`:`<span style="color:${a.red}">×${b.toFixed(2)}</span>`,f=[{name:"Corporate Headquarters",owned:!0,baseCost:o,adjustedValue:p}];let y="",_=0;for(const b of f)_+=b.adjustedValue,y+=`
        <div style="padding:10px 12px;border-bottom:1px solid ${a.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                <span style="font-size:13px;font-weight:700;color:${a.text}">${b.name}</span>
                <span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 8px;color:${a.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">${b.owned?"OWNED":"AVAILABLE"}</span>
            </div>
            <div style="margin-bottom:6px;">
                <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${a.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${i}</span>
            </div>
            <div style="padding:6px 8px;background:${a.bg};border:1px solid ${a.border};">
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${a.border};">
                    <span style="font-family:${t};font-size:9px;color:${a.dim}">BASE COST</span>
                    <span style="font-family:${t};font-size:10px;color:${a.text}">${S(b.baseCost)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${a.border};">
                    <span style="font-family:${t};font-size:9px;color:${a.dim}">INFLATION (${i})</span>
                    <span style="font-family:${t};font-size:10px;color:${a.muted}">${s}/100 — ${m(l)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${a.border};">
                    <span style="font-family:${t};font-size:9px;color:${a.dim}">STABILITY (${i})</span>
                    <span style="font-family:${t};font-size:10px;color:${a.muted}">${c}/100 — ${m(n)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${a.border};">
                    <span style="font-family:${t};font-size:9px;color:${a.dim}">CIVIL UNREST (${i})</span>
                    <span style="font-family:${t};font-size:10px;color:${a.muted}">${r}/100 — ${m(d)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:${t};font-size:9px;color:${a.accent}">ADJUSTED VALUE</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${a.green}">${S(b.adjustedValue)}</span>
                </div>
            </div>
        </div>`;e.innerHTML=`
    <div style="width:380px;height:450px;background:${a.surface};border:1px solid ${a.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${a.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${a.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${a.muted};text-transform:uppercase">Property</span>
            </div>
            <span style="font-family:${t};font-size:10px;color:${a.muted}">${f.length} ASSET${f.length!==1?"S":""}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${y}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${a.border};background:${a.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${t};font-size:8px;color:${a.dim};letter-spacing:0.8px">TOTAL PROPERTY VALUE</span>
                <span style="font-family:${t};font-size:14px;font-weight:700;color:${a.green}">${S(_)}</span>
            </div>
        </div>
    </div>`}window.switchToExpansion=ft;window.switchToOperations=_t;window.hfSetChange=ba;window.hfReset=$a;window.hfConfirm=ha;document.querySelector('[data-tab="operations"]')?.addEventListener("click",function(e){this.classList.contains("active")||(e.preventDefault(),_t(e))});fa();
