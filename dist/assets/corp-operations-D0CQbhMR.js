import{_ as w}from"./supabase-client-BXEzLDpS.js";import{e as g}from"./utils-C2W-HleY.js";import{initMessaging as vi}from"./messaging-B5Fng3EZ.js";import{c as yi,a as ct,E as Me,b as De,d as Rt,e as gi,f as xi,h as Lt}from"./equipment-DsuDdEne.js";const Ot={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},ie=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"manufacturing_output",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:50},{stat:"higher_education",min:40}]}},priceDrivers:["manufacturing_output","inflation","fuel_prices","urbanization"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:10}]},STD:{requirements:[{stat:"manufacturing_output",min:35},{stat:"rare_minerals",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:40},{stat:"higher_education",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","inflation","fuel_prices"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"arable_land",min:10}]},STD:{requirements:[{stat:"arable_land",min:30},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"arable_land",min:50},{stat:"manufacturing_output",min:30}]}},priceDrivers:["arable_land","physical_infrastructure","inflation"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"rare_minerals",min:15},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"rare_minerals",min:35},{stat:"manufacturing_output",min:25}]}},priceDrivers:["rare_minerals","physical_infrastructure","inflation"]},{key:"em",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:15}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"digital_infrastructure",min:25}]},HIGH:{requirements:[{stat:"manufacturing_output",min:55},{stat:"digital_infrastructure",min:50},{stat:"energy_generation",min:40}]}},priceDrivers:["manufacturing_output","digital_infrastructure","inflation","energy_generation"]},{key:"glass",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:20}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"digital_infrastructure",min:40},{stat:"higher_education",min:50}]}},priceDrivers:["manufacturing_output","standard_of_living","inflation"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"oil_and_gas",min:10}]},STD:{requirements:[{stat:"oil_and_gas",min:30},{stat:"manufacturing_output",min:25}]},HIGH:{requirements:[{stat:"oil_and_gas",min:45},{stat:"manufacturing_output",min:40},{stat:"physical_infrastructure",min:40}]}},priceDrivers:["oil_and_gas","manufacturing_output","inflation","fuel_prices"]},{key:"heavy",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:40},{stat:"rare_minerals",min:30}]},STD:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:45},{stat:"higher_education",min:40}]},HIGH:{requirements:[{stat:"manufacturing_output",min:75},{stat:"rare_minerals",min:60},{stat:"higher_education",min:55},{stat:"digital_infrastructure",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","higher_education","digital_infrastructure"]}];function pe(i,e,t){const a=ie.find(d=>d.key===i);if(!a)return{available:!1,failedStat:"unknown_material"};const n=a.tiers[e];if(!n)return{available:!1,failedStat:"unknown_tier"};for(const d of n.requirements){const s=Number(t?.[d.stat]??0);if(s<d.min)return{available:!1,failedStat:d.stat,failedMin:d.min,nationValue:s}}return{available:!0}}function bt(i,e,t){const n={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em:{LOW:400,STD:700,HIGH:1200},glass:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy:{LOW:800,STD:1400,HIGH:2400}}[i]?.[e];if(!n)return 0;const d=ie.find(l=>l.key===i);if(!d)return n;let s=1;for(const l of d.priceDrivers){const r=Number(t?.[l]??50);l==="inflation"||l==="fuel_prices"?s*=1+(r-50)/200:s*=1-(r-50)/250}return s=Math.max(.4,Math.min(2.5,s)),Math.round(n*s)}function Pt(i,e,t){const n={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em:{LOW:1e3,STD:700,HIGH:300},glass:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy:{LOW:400,STD:200,HIGH:80}}[i]?.[e]||0,s=ie.find(o=>o.key===i)?.priceDrivers?.[0],r=.3+(s?Number(t?.[s]??50):50)/50*.7;return Math.round(n*r)}const $t=["LOW","STD","HIGH"],pt={LOW:"Low",STD:"Standard",HIGH:"High"};let ke=[],f=null,_=null,R=null,xe=[],Ie={},K=[],H={},mt=-1,P="concrete",D="STD",me=500,J=[],ft=0,V="trucks",Z=0,ee=1,ae=[],fe=null,Oe=[],ut=null,Be=null,vt="ALL",yt="TIMELINE";function z(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(1)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i}function bi(i){if(i>=12){const e=Math.floor(i/12),t=i%12;return t>0?e+"y "+t+"mo":e+"y"}return i+" ticks"}function Y(i){return Math.abs(i)>=1e9?"$"+(i/1e9).toFixed(1)+"B":Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(0)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i}function He(i){return i==="civil_engineering"?"CIVIL":i==="industrial"?"INDUSTRIAL":i==="mega_project"?"MEGA":i?.toUpperCase()||"—"}function Dt(i){return i==="civil_engineering"?"light":i==="industrial"?"heavy":i==="mega_project"?"mega":"light"}function $i(){Be&&clearInterval(Be),Be=setInterval(()=>{if(!ut)return;const i=ut-Date.now();if(i<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(Be);return}const e=Math.floor(i/36e5),t=Math.floor(i%36e5/6e4),a=Math.floor(i%6e4/1e3);document.getElementById("tick-countdown").textContent=e+"h "+t+"m "+a+"s"},1e3)}function _i(){document.body.classList.toggle("light-mode");const i=document.getElementById("theme-toggle");i.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function hi(i,e){i==="type"&&(vt=e),i==="sort"&&(yt=e),document.querySelectorAll(`.filter-pill[data-filter="${i}"]`).forEach(t=>{t.classList.toggle("active",t.dataset.value===e)}),jt()}function Ht(i){return!(!f||i.sector==="mega_project"&&f.corp_subsector!=="Megaprojects"||i.sector==="industrial"&&!["Heavy Infrastructure","Megaprojects"].includes(f.corp_subsector))}function jt(){const i=document.getElementById("oc-list");let e=[...xe];if(vt==="GOVERNMENT"?e=e.filter(n=>n.issuer_type==="GOVERNMENT"):vt==="PRIVATE"&&(e=e.filter(n=>n.issuer_type==="PRIVATE")),yt==="TIMELINE"&&e.sort((n,d)=>(n.timeline_ticks||0)-(d.timeline_ticks||0)),yt==="BUDGET"&&e.sort((n,d)=>(d.budget_ceiling||0)-(n.budget_ceiling||0)),document.getElementById("oc-count").textContent=e.length+" AVAILABLE",e.length===0){i.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const t=R?.current_tick||0;let a="";for(const n of e){const d=n.issuer_type==="GOVERNMENT",s=d?"gov":"private",l=Ht(n),r=l?"":" locked",o=Dt(n.sector),c=He(n.sector),m=(n.timeline_ticks||0)>18?" warn":"",p=n.bidding_ends_tick?Math.max(0,n.bidding_ends_tick-t):"?";a+=`
            <div class="oc-item${r}" data-contract-id="${n.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${g(n.name)}</span>
                    <span class="oc-item__type-badge ${s}">${d?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${s}">${g(n.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${p} tick${p!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${Y(n.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${m}">${bi(n.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${o}">${c}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${Ie[n.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${Y(Ie[n.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${l?"yes":"no"}">${l?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${l?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openBidModal(contracts.find(x=>x.id==='${n.id}'))">${Ie[n.id]?"EDIT":"VIEW"}</button>`:""}
                </div>
                ${n.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${g(n.description)}</div>`:""}
            </div>`}i.innerHTML=a,i.querySelectorAll(".oc-item:not(.locked)").forEach(n=>{n.addEventListener("click",()=>{const d=n.dataset.contractId,s=xe.find(l=>l.id===d);s&&Ut(s)})})}let he=null;function Ut(i){he=i;const e=document.getElementById("cd-overlay"),t=i.issuer_type==="GOVERNMENT",a=t?"gov":"private",n=(_?.name||f.nation||"—").toUpperCase(),d=Ht(i);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${g(n)}</span>
        <span class="cd-header__name">${g(i.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${a}">${g(i.issuer_name)}</span>
        <span class="cd-header__type-badge ${a}">${t?"GOV":"PRIVATE"}</span>
    `;const s=document.getElementById("cd-blueprint");i.blueprint_svg?(s.innerHTML=i.blueprint_svg,s.style.display=""):(s.innerHTML=Di(i),s.style.display="");const l=i.permits_required||[],r=i.required_equipment||i.equipment_required||[],o=i.required_materials||i.materials_estimated||{},m={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[i.sector]||i.spec_category||i.sector||"—";let p="var(--teal)";i.sector==="industrial"&&(p="var(--orange)"),i.sector==="mega_project"&&(p="var(--red)");let u=z(i.budget_ceiling||i.budget||0),v=(i.timeline_ticks||i.timeline_months||0)+" Months",y="";y+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${g(i.project_code||i.contract_number||"")}</span>
            </div>
            <div class="cd-issue__tags">
                ${i.project_type?`<span class="cd-tag teal">${g(i.project_type.toUpperCase())}</span>`:""}
                ${i.project_subtype?`<span class="cd-tag gold">${g(i.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,i.description&&(y+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${g(i.description)}</div>
            </div>`),y+='<div class="cd-details">',i.project_type&&(y+=ne("Type",i.project_type)),i.project_subtype&&(y+=ne("Sub-Type",i.project_subtype)),y+=ne("Specialization",m,p),y+=ne("Total Budget",u,"var(--green)"),y+=ne("Timeline",v),y+=ne("Nation",_?.name||f.nation||"—"),i.region&&(y+=ne("Region",i.region)),y+="</div>",l.length>0&&(y+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${l.map(E=>{const S=E.status==="approved"?"approved":"required",C=E.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${S}">
                            <span class="cd-chip__icon">${C}</span>
                            <span class="cd-chip__label">${g(E.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),o.length>0&&(y+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${o.map(E=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${g(E.name)}</span>
                        <span class="cd-mat-row__qty">${g(String(E.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=y;const h=l.filter(E=>E.status==="approved").length,$=l.length-h,k=r.filter(E=>E.owned).length,A=r.length-k;let x="";r.length>0&&(A===0?x+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>':x+=`<span class="cd-footer__badge bad">${A} EQUIPMENT MISSING</span>`),l.length>0&&($===0?x+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':x+=`<span class="cd-footer__badge warn">${$} PERMITS PENDING</span>`);const T=d;(f.action_points??0)>=2,document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${x}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            <button class="cd-btn primary" onclick="openBidAssembly()" ${T?"":"disabled"}
                title="${T?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>
        </div>
    `,e.classList.add("open"),document.body.style.overflow="hidden"}function _t(i){i&&i.target&&i.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",he=null)}const wi=[{key:"concrete",name:"Concrete",unit:"units"},{key:"steel",name:"Steel",unit:"units"},{key:"lumber",name:"Lumber",unit:"units"},{key:"aggregate",name:"Aggregate",unit:"units"},{key:"em_systems",name:"E&M Systems",unit:"units"},{key:"glass_facades",name:"Glass & Facades",unit:"units"},{key:"asphalt",name:"Asphalt",unit:"units"},{key:"heavy_parts",name:"Heavy Machinery Parts",unit:"units"}],ki=[{key:"work_trucks",name:"Work Trucks",tier:1},{key:"excavators",name:"Excavators",tier:1},{key:"bulldozers",name:"Bulldozers",tier:1},{key:"concrete_mixers",name:"Concrete Mixers",tier:1},{key:"tower_cranes",name:"Tower Cranes",tier:2},{key:"heavy_haulers",name:"Heavy Haulers",tier:2},{key:"pile_drivers",name:"Pile Drivers",tier:2},{key:"asphalt_plants",name:"Asphalt Plants",tier:2}],Gt={LOW:.7,STANDARD:1,HIGH:1.4},Wt={LOW:35,STANDARD:65,HIGH:90},Xe=15;let j=null;function Ei(i){if(!i)return;const e=i.required_materials||{},t=i.required_equipment||[],a=i.required_workforce||{},n={concrete:18e4,steel:25e4,lumber:12e4,aggregate:8e4,em_systems:32e4,glass_facades:28e4,asphalt:14e4,heavy_parts:4e5},d=wi.filter(c=>e[c.key]>0).map(c=>({...c,qty:e[c.key],basePrice:n[c.key]||2e5,grade:c.key==="aggregate"?"LOW":"STANDARD",highDisabled:!1})),s=ki.filter(c=>t.includes(c.key)).map(c=>({...c,owned:(J||[]).some(m=>m.equipment_key===c.key&&m.quantity>0)})),l=(a.general||100)+(a.skilled||20),r=i.budget_ceiling||1e8,o=Math.round(r*.03);j={contract:i,budgetCeiling:r,materials:d,laborCount:l,laborRate:15200,estimatedTicks:i.timeline_ticks||8,equipment:s,permits:[],overhead:o,markupPct:15,competitors:[],playerRep:f?.standing||50,requiredWorkforce:a},document.getElementById("bid-title").textContent="BID ASSEMBLY",document.getElementById("bid-subtitle").textContent=(i.name||"Contract")+" — "+He(i.sector)+" — "+(i.issuer_name||"Government"),document.getElementById("bid-overlay").classList.add("open"),document.body.style.overflow="hidden",je()}function Ft(i){i&&i.target!==document.getElementById("bid-overlay")||(document.getElementById("bid-overlay").classList.remove("open"),document.body.style.overflow="",j=null)}function N(i){return Math.abs(i)>=1e9?"$"+(i/1e9).toFixed(2)+"B":Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(2)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function Ti(i,e){if(!j)return;const t=j.materials[i];e==="HIGH"&&t.highDisabled||(t.grade=e,je())}function Ii(i){j&&(j.laborCount=i,je())}function Ci(i){j&&(j.markupPct=Number(i),je())}function je(){if(!j)return;const i=j;let e=0;for(const M of i.materials)M.lineCost=Math.round(M.qty*M.basePrice*Gt[M.grade]),e+=M.lineCost;const t=Math.round(i.laborCount*i.laborRate*i.estimatedTicks),a=Math.round(i.equipment.filter(M=>M.owned).length*12e3*i.estimatedTicks);let n=0;const d=i.overhead,s=e+t+a+n+d,l=Math.round(s*i.markupPct/100),r=s+l,o=r>i.budgetCeiling,c=l,m=Math.round(i.materials.reduce((M,O)=>M+Wt[O.grade],0)/i.materials.length),p=m>=80?"STRONG":m>=60?"PROMISING":m>=40?"UNCERTAIN":"POOR",u=m>=80?"var(--green)":m>=60?"var(--teal)":m>=40?"var(--orange)":"var(--red)",v=i.budgetCeiling>0?r/i.budgetCeiling:1,y=Math.max(0,Math.min(100,Math.round((1-v)*150))),h=y>=70?"STRONG":y>=40?"COMPETITIVE":y>=15?"WEAK":"UNLIKELY",$=y>=70?"var(--green)":y>=40?"var(--teal)":y>=15?"var(--orange)":"var(--red)",k=Math.round(s*(1-Xe/100)),A=Math.round(s*(1+Xe/100));let x="";x+='<div class="bid-section"><div class="bid-section__title">Materials</div>',i.materials.forEach((M,O)=>{const B=U=>{const Ke=M.grade===U,qe=U==="HIGH"&&M.highDisabled;return`<button class="bid-grade-btn ${Ke?U==="LOW"?"active-low":U==="HIGH"?"active-high":"active":""} ${qe?"disabled":""}" onclick="setBidGrade(${O},'${U}')">${U[0]}</button>`};x+=`<div class="bid-mat-row">
            <span class="bid-mat-row__name">${g(M.name)}</span>
            <span class="bid-mat-row__qty">×${M.qty}</span>
            <div class="bid-grade-btns">${B("LOW")}${B("STANDARD")}${B("HIGH")}</div>
            <span class="bid-mat-row__cost">${N(M.lineCost)}</span>
        </div>`}),x+=`<div class="bid-line-total"><span class="bid-line-total__label">MATERIALS TOTAL</span><span class="bid-line-total__value">${N(e)}</span></div></div>`;const T=(i.requiredWorkforce?.general||80)+(i.requiredWorkforce?.skilled||20),E=[Math.round(T*.8),T,Math.round(T*1.2),Math.round(T*1.4),Math.round(T*1.6)];x+='<div class="bid-section"><div class="bid-section__title">Labor</div>',x+='<div class="bid-labor-presets">',E.forEach(M=>{x+=`<button class="bid-labor-btn ${i.laborCount===M?"active":""}" onclick="setBidLabor(${M})">${M}</button>`}),x+="</div>";const S=i.requiredWorkforce||{};x+=`<div class="bid-labor-formula">Required: ${S.general||"?"} general + ${S.skilled||"?"} skilled<br>`,x+=`${i.laborCount} workers × ${N(i.laborRate)}/tick × ${i.estimatedTicks} ticks = <strong>${N(t)}</strong></div>`,x+=`<div class="bid-line-total"><span class="bid-line-total__label">LABOR TOTAL</span><span class="bid-line-total__value">${N(t)}</span></div></div>`,x+='<div class="bid-section"><div class="bid-section__title">Equipment</div>',i.equipment.forEach(M=>{const O=M.owned?"bid-equip-row__status--owned":"bid-equip-row__status--missing",B=M.owned?"✓ OWNED":"✗ NOT OWNED";x+=`<div class="bid-equip-row"><span class="bid-equip-row__name">${g(M.name)}</span><span class="bid-equip-row__status ${O}">${B}</span></div>`}),x+=`<div class="bid-line-total"><span class="bid-line-total__label">MAINTENANCE (${i.estimatedTicks}t)</span><span class="bid-line-total__value">${N(a)}</span></div></div>`,x+='<div class="bid-section"><div class="bid-section__title">Permits</div>',x+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);padding:8px 0;">No permits required yet.</div>',x+='<div class="bid-line-total"><span class="bid-line-total__label">PERMITS TOTAL</span><span class="bid-line-total__value">$0</span></div></div>',x+='<div class="bid-section"><div class="bid-section__title">Overhead &amp; Contingency</div>',x+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Site management, insurance, admin</div>',x+=`<div class="bid-line-total"><span class="bid-line-total__label">OVERHEAD</span><span class="bid-line-total__value">${N(d)}</span></div></div>`,document.getElementById("bid-left").innerHTML=x;let C="";C+='<div class="bid-section"><div class="bid-section__title">Cost Summary</div>',C+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Materials</span><span class="bid-summary-row__value">${N(e)}</span></div>`,C+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Labor</span><span class="bid-summary-row__value">${N(t)}</span></div>`,C+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Equipment Maint.</span><span class="bid-summary-row__value">${N(a)}</span></div>`,C+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Permits</span><span class="bid-summary-row__value">${N(n)}</span></div>`,C+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Overhead</span><span class="bid-summary-row__value">${N(d)}</span></div>`,C+=`<div class="bid-cost-total"><span class="bid-cost-total__label">ESTIMATED COST</span><span class="bid-cost-total__value">${N(s)}</span></div>`,C+=`<div class="bid-accuracy">⚠ Estimate accuracy: ±${Xe}%<br>Actual cost range: ${N(k)} — ${N(A)}</div>`,C+="</div>",C+='<div class="bid-section"><div class="bid-section__title">Markup</div>',C+=`<div class="bid-slider-wrap">
        <div class="bid-slider-label"><span class="bid-slider-label__pct">${i.markupPct}%</span><span style="color:var(--text-dim)">${N(l)}</span></div>
        <input type="range" class="bid-slider" min="0" max="40" value="${i.markupPct}" oninput="setBidMarkup(this.value)">
    </div></div>`,C+=`<div class="bid-price-hero ${o?"bid-price-hero--over":""}">
        <div class="bid-price-hero__label">YOUR BID PRICE</div>
        <div class="bid-price-hero__value">${N(r)}</div>
        ${o?'<div class="bid-price-hero__warning">EXCEEDS BUDGET CEILING ('+N(i.budgetCeiling)+")</div>":""}
    </div>`,C+=`<div class="bid-profit"><span class="bid-profit__label">PROJECTED PROFIT</span><span class="bid-profit__value">+${N(c)}</span></div>`,C+=`<div class="bid-compete">
        <div style="display:flex;justify-content:space-between;"><span class="bid-compete__label" style="color:${$}">${h}</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Competitiveness</span></div>
        <div class="bid-compete__bar-wrap"><div class="bid-compete__bar" style="width:${y}%;background:${$}"></div></div>
    </div>`,C+=`<div class="bid-quality">
        <div style="display:flex;justify-content:space-between;"><span class="bid-quality__label" style="color:${u}">${p} (${m}/100)</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Quality Estimate</span></div>
        <div class="bid-quality__bar-wrap"><div class="bid-quality__bar" style="width:${m}%;background:${u}"></div></div>
    </div>`,C+='<div class="bid-section" style="margin-top:8px;"><div class="bid-section__title">Competing Bids</div>',i.competitors.forEach(M=>{C+=`<div class="bid-competitor"><span class="bid-competitor__name">${g(M.name)}</span><span class="bid-competitor__rep">Rep ${M.rep}</span></div>`}),C+=`<div class="bid-competitor" style="color:var(--gold);"><span class="bid-competitor__name">You</span><span class="bid-competitor__rep">Rep ${i.playerRep}</span></div>`,C+="</div>",document.getElementById("bid-right").innerHTML=C,document.getElementById("bid-footer-price").textContent=N(r),document.getElementById("bid-footer-price").style.color=o?"var(--red)":"var(--gold)",document.getElementById("bid-footer-profit").textContent="+"+N(c),document.getElementById("bid-footer-quality").textContent=m+"/100",document.getElementById("bid-footer-quality").style.color=u,document.getElementById("bid-submit-btn").disabled=o}window.openBidModal=Ei;window.closeBidModal=Ft;window.setBidGrade=Ti;window.setBidLabor=Ii;window.setBidMarkup=Ci;let Ze=!1;async function Mi(){if(!j||!f||Ze)return;const i=j,e=i.contract;let t=0;const a={};for(const m of i.materials)t+=Math.round(m.qty*m.basePrice*Gt[m.grade]),a[m.key]=m.grade;const n=Math.round(i.laborCount*i.laborRate*i.estimatedTicks),d=Math.round(i.equipment.filter(m=>m.owned).length*12e3*i.estimatedTicks),s=t+n+d+i.overhead,l=Math.round(s*i.markupPct/100),r=s+l,o=Math.round(i.materials.reduce((m,p)=>m+Wt[p.grade],0)/(i.materials.length||1));if(r>i.budgetCeiling){alert("Bid exceeds budget ceiling. Lower your costs or markup.");return}const c=document.getElementById("bid-submit-btn");c.disabled=!0,c.textContent="SUBMITTING...",Ze=!0;try{const{data:m}=await w.from("shard").select("current_tick").eq("name","Alpha Shard").single(),p=m?.current_tick||0,{data:u}=await w.from("contract_bids").select("id").eq("contract_id",e.id).eq("faction_id",f.id).maybeSingle();if(u){const{error:y}=await w.from("contract_bids").update({bid_price:r,material_grades:a,labor_count:i.laborCount,markup_pct:i.markupPct,estimated_cost:s,estimated_quality:o,submitted_at_tick:p}).eq("id",u.id);if(y)throw y}else{const{error:y}=await w.from("contract_bids").insert({contract_id:e.id,faction_id:f.id,bid_price:r,material_grades:a,labor_count:i.laborCount,markup_pct:i.markupPct,estimated_cost:s,estimated_quality:o,status:"pending",submitted_at_tick:p});if(y)throw y}Ft();const v=document.getElementById("oc-count");if(v){const y=v.textContent;v.textContent="✓ BID SUBMITTED",v.style.color="var(--green)",setTimeout(()=>{v.textContent=y,v.style.color=""},2e3)}await Yt()}catch(m){console.error("Bid submission failed:",m),alert("Failed to submit bid: "+(m.message||"Unknown error")),c.disabled=!1,c.textContent="SUBMIT BID"}finally{Ze=!1}}window.submitBid=Mi;const re=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],zt={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},Nt={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let L=null;function Si(i){const e=K.find(S=>S.id===i);if(!e)return;const t=Array.isArray(e.contract_bids)?e.contract_bids[0]:e.contract_bids,a=R?.current_tick||0,n=e.awarded_at_tick||a,d=e.timeline_ticks||8,s=Math.max(0,a-n),l=Math.min(100,s/d*100);let r=Math.min(re.length-1,Math.floor(l/(100/re.length)));const o=Math.round(l%(100/re.length)/(100/re.length)*100),c=e.required_materials||{},m=t?.material_grades||{},p=Object.entries(c).map(([S,C])=>{const M=m[S]||"STANDARD",O=Math.round(C*(l/100)*(.6+Math.random()*.4));return{key:S,name:S.replace(/_/g," ").replace(/\b\w/g,B=>B.toUpperCase()),grade:M,allocated:C,used:Math.min(O,C)}}),v=(e.required_equipment||[]).map(S=>({key:S,name:S.replace(/_/g," ").replace(/\b\w/g,C=>C.toUpperCase()),qty:1+Math.floor(Math.random()*3),condition:55+Math.floor(Math.random()*40)})),y=e.budget_ceiling||0,h=t?.estimated_cost||0,$=Math.round(h*Math.min(1,s/d)),k=t?.estimated_quality||65,A=k>=80?"STRONG":k>=60?"PROMISING":k>=40?"FAIR":"UNCERTAIN",x=e.required_workforce||{},T=(x.general||0)+(x.skilled||0),E=t?.labor_count||T;L={project:e,bid:t,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:a,awardedTick:n,totalTicks:d,ticksElapsed:s,phaseIdx:r,phaseProgress:o,materials:p,equipment:v,budget:y,estCost:h,spent:$,quality:k,qualityLabel:A,laborCount:E,wfNeeded:T,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",Vt(e.id).then(()=>ue()),ue()}function Ai(i){i&&i.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",L=null)}function Li(i){L&&(L.tab=i,L.expandedEvent=-1,L.selectedResponse=null,ue())}function zi(i){L&&(L.expandedEvent=L.expandedEvent===i?-1:i,L.selectedResponse=null,ue())}function Ni(i){L&&(L.selectedResponse=L.selectedResponse===i?null:i,ue())}function ue(){if(!L)return;const i=L,e=i.project,t=e.issuer_type==="GOVERNMENT",a=He(e.sector),n=f?.nation||"Nation",d=i.awardedTick+i.totalTicks,s=Math.max(0,d-i.currentTick),l=i.currentTick>d,r=i.budget>0?Math.round(i.spent/i.budget*100):0,o=r>85?"var(--red)":r>60?"var(--amber)":"var(--teal)",c=i.budget-i.spent,m=i.events.filter(h=>h.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
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
    `;let p='<div class="pm-phase__bar">';for(let h=0;h<re.length;h++){const $=h<i.phaseIdx,k=h===i.phaseIdx;p+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${$?"done":k?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${$?"done":k?"active":""}">${re[h]}</span>
        </div>`}p+="</div>",p+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${re[i.phaseIdx]} — ${i.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${l?"var(--red)":"var(--text-secondary)"}">Tick ${i.ticksElapsed} / ${i.totalTicks}${l?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=p;const u=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:m},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=u.map(h=>`<button class="pm-tab${i.tab===h.id?" active":""}" onclick="pmSetTab('${h.id}')">
            ${h.label}${h.badge>0?`<span class="pm-tab__badge">${h.badge}</span>`:""}
        </button>`).join("");let v="";i.tab==="overview"?v=qi(i,e,o,r,c,s,l):i.tab==="events"?v=Bi(i):i.tab==="materials"?v=Ri(i):i.tab==="equipment"&&(v=Oi(i)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${v}</div>`;let y="";m>0&&(y+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${m} EVENT${m>1?"S":""} REQUIRES RESPONSE</span>`),y+=`<span class="pm-ftr__badge" style="color:${i.quality>=70?"var(--green)":i.quality>=50?"var(--amber)":"var(--orange)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${i.quality}/100 — ${i.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${y}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function qi(i,e,t,a,n,d,s){const l=et(i.awardedTick+i.totalTicks);et(i.awardedTick+i.totalTicks);const r=et(i.awardedTick),o=[{label:"Budget",value:Y(i.budget),sub:`${a}% spent`,color:t},{label:"Spent",value:Y(i.spent),color:"var(--red)"},{label:"Remaining",value:Y(n),color:"var(--green)"},{label:"Quality",value:`${i.quality}/100`,sub:i.qualityLabel,color:i.quality>=70?"var(--green)":i.quality>=50?"var(--amber)":"var(--red)"},{label:"Workforce",value:`${i.laborCount}/${i.wfNeeded}`,sub:`Bid: ${i.laborCount}`,color:i.laborCount<i.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${d} ticks`,sub:s?"OVERDUE":`Deadline: ${l}`,color:s?"var(--red)":"var(--text-bright)"}];let c="";c+=`<div style="padding:0 16px"><div class="pm-section">
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
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${s?"var(--red)":"var(--text-bright)"};font-weight:700">${l}</span></span>
        </div>
    </div></div>`;const m=[];if((e.sector==="civil_engineering"||e.sector==="industrial"||e.sector==="mega_project")&&(m.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),m.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),e.sector!=="civil_engineering"&&m.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),m.length>0){c+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const p of m)c+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${g(p.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;c+="</div></div>"}return c}function Bi(i){if(i.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let e="";for(let t=0;t<i.events.length;t++){const a=i.events[t],n=i.expandedEvent===t,d=a.status==="ACTIVE",s=zt[a.type]||zt.WEATHER,l=Nt[a.severity]||Nt.LOW;if(e+=`<div class="pm-evt ${d?"pm-evt--active":"pm-evt--resolved"}" style="${d?`border-left-color:${s.color}`:""}">`,e+=`<div class="pm-evt__header" onclick="pmToggleEvent(${t})" style="${n?`background:${s.bg}`:""}">`,e+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${s.color};background:${s.bg};border:1px solid ${s.border}">${a.type}</span>
            <span class="pm-evt__sev-badge" style="color:${l}">${a.severity}</span>
            <span class="pm-evt__status" style="color:${d?"var(--red)":"var(--text-dim)"};font-weight:${d?"700":"400"}">${d?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,e+=`<div class="pm-evt__title">${g(a.title)}</div>`,e+=`<div class="pm-evt__meta">Tick ${a.tick} · ${g(a.id||"")}</div>`,n){if(e+='<div class="pm-evt__body">',e+=`<div class="pm-evt__desc">${g(a.desc)}</div>`,a.impact&&(e+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${g(a.impact)}</span>
                </div>`),d&&a.responses&&a.responses.length>0){e+='<div class="pm-evt__resp-title">Response Options</div>';for(let r=0;r<a.responses.length;r++){const o=a.responses[r],c=i.selectedResponse===r,p={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[o.tag]||"var(--text-secondary)";e+=`<div class="pm-resp${c?" selected":""}" style="${c?`border-color:${p}`:""}" onclick="event.stopPropagation();pmSelectResponse(${r})">`,e+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${g(o.label)}</span>
                            <span class="pm-resp__tag" style="color:${p};background:${p}12;border:1px solid ${p}25">${o.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${o.delay>0?"var(--orange)":"var(--green)"}">
                            ${o.delay>0?`+${o.delay} tick${o.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,e+=`<div class="pm-resp__detail">${g(o.detail)}</div>`,e+='<div class="pm-resp__costs">',o.cost&&(e+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${Y(o.cost)}</span>`),o.qualityImpact&&o.qualityImpact!==0&&(e+=`<span class="pm-resp__cost" style="color:${o.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${o.qualityImpact>0?"+":""}${o.qualityImpact}</span>`),!o.cost&&(!o.qualityImpact||o.qualityImpact===0)&&(e+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),e+="</div>",c&&(e+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${p}" onclick="event.stopPropagation();confirmEventResponse('${a.id}','${o.key}')">CONFIRM</button>
                        </div>`),e+="</div>"}}!d&&a.resolution&&(e+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${g(a.resolution)}</div>
                </div>`),e+="</div>"}e+="</div></div>"}return e}function Ri(i){if(i.materials.length===0)return'<div class="pm-evt-empty">No materials allocated to this project.</div>';let e='<div class="pm-tab-header">Allocated Materials</div>';for(const t of i.materials){const a=t.allocated>0?Math.round(t.used/t.allocated*100):0,n=t.grade==="HIGH"?"high":t.grade==="LOW"?"low":"std",d=t.grade==="HIGH"?"var(--green)":t.grade==="LOW"?"var(--orange)":"var(--amber)";e+=`<div class="pm-mat">
            <div class="pm-mat__row1">
                <div class="pm-mat__left">
                    <span class="pm-mat__name">${g(t.name)}</span>
                    <div class="pm-mat__grade-dot pm-mat__grade-dot--${n}"></div>
                    <span class="pm-mat__grade" style="color:${d}">${t.grade}</span>
                </div>
                <span class="pm-mat__qty">${t.used.toLocaleString()} / ${t.allocated.toLocaleString()}</span>
            </div>
            <div class="pm-mat__bar-row">
                <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${a}%"></div></div>
                <span class="pm-mat__pct">${a}% consumed</span>
            </div>
        </div>`}return e}function Oi(i){if(i.equipment.length===0)return'<div class="pm-evt-empty">No equipment deployed to this project.</div>';let e='<div class="pm-tab-header">Deployed Equipment</div>';for(const t of i.equipment){const a=t.condition>=75?"var(--green)":t.condition>=50?"var(--amber)":t.condition>=25?"var(--orange)":"var(--red)",n=t.condition<60;e+=`<div class="pm-eq">
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
        </div>`}return e}function et(i){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][i%12]}, ${2e3+Math.floor(i/12)}`}window.openProjectModal=Si;window.closeProjectModal=Ai;window.pmSetTab=Li;window.pmToggleEvent=zi;window.pmSelectResponse=Ni;async function Vt(i){if(!L)return;const{data:e,error:t}=await w.from("construction_events").select("*").eq("contract_id",i).order("fired_at_tick",{ascending:!1});t?(console.warn("Failed to load project events:",t.message),L.events=[]):L.events=(e||[]).map(a=>({id:a.id,type:a.type,severity:a.severity,tick:a.fired_at_tick,title:a.title,desc:a.description,impact:a.impact,status:a.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:a.resolution,responses:a.responses||[]})),ue()}let tt=!1;async function Pi(i,e){if(!(tt||!L)){tt=!0;try{const{data:t,error:a}=await w.rpc("resolve_construction_event",{p_event_id:i,p_response_key:e});if(a){console.error("Failed to resolve event:",a.message),alert("Failed to submit response: "+a.message);return}const n=typeof t=="string"?JSON.parse(t):t;if(n?.error){alert("Error: "+n.error);return}await Vt(L.project.id),await Qt(),n?.quality_applied&&n.quality_applied!==0&&(L.quality=Math.max(0,Math.min(100,L.quality+n.quality_applied)),L.qualityLabel=L.quality>=80?"STRONG":L.quality>=60?"PROMISING":L.quality>=40?"FAIR":"UNCERTAIN"),ue()}finally{tt=!1}}}window.confirmEventResponse=Pi;function ne(i,e,t){const a=t?` style="color:${t}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${g(i)}</span>
        <span class="cd-detail-row__value"${a}>${g(e)}</span>
    </div>`}function Di(i){const e={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},t=i.drawing_number||i.contract_number+"-A1",a=R?.current_date||"",n=a?a.replace(/,\s*/," "):"",d=i.spec_category==="Heavy Infrastructure",s=i.spec_category==="Megaproject";let l=g(i.project_subtype||i.project_type||"STRUCTURE"),r=d?"80.0m":s?"200.0m":"60.0m",o=d?"40.0m":s?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${e.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(c,m)=>`<line x1="${m*20}" y1="0" x2="${m*20}" y2="200" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(c,m)=>`<line x1="0" y1="${m*20}" x2="680" y2="${m*20}" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${e.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${e.accent}" font-family="var(--font-mono)" font-weight="700">${l.toUpperCase()}</text>
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
    </svg>`}let it=!1;async function Hi(){if(it||!he||!f)return;if((f.action_points??0)<2){alert("You need at least 2 AP to place a bid.");return}it=!0;const i=document.querySelector(".cd-btn.primary");i&&(i.disabled=!0,i.textContent="...");try{const{data:e,error:t}=await w.rpc("deduct_ap",{p_faction_id:f.id,p_cost:2});if(t)throw t;if(e<0){const n=-e-1;f.action_points=n,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+n+" AP</span>",i&&(i.disabled=!1,i.textContent="BID"),alert("Insufficient AP. You have "+n+" AP, need 2.");return}const{error:a}=await w.from("corp_contract_bids").insert({contract_id:he.id,faction_id:f.id,nation_id:f.nation_id,ap_spent:2,created_at_tick:R?.current_tick||null});if(a)throw await w.rpc("deduct_ap",{p_faction_id:f.id,p_cost:-2}),f.action_points=e+2,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+(e+2)+" AP</span>",a;f.action_points=e,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+e+" AP</span>",i&&(i.textContent="BID PLACED")}catch(e){i&&(i.disabled=!1,i.textContent="BID"),e.code==="23505"?alert("You have already placed a bid on this contract."):alert("Failed to place bid: "+(e.message||"Unknown error"))}finally{it=!1}}async function Yt(){if(!f||!f.nation_id)return;const{data:i,error:e}=await w.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(e?(console.warn("Failed to load contracts:",e.message),xe=[]):xe=i||[],Ie={},f&&xe.length>0){const t=xe.map(n=>n.id),{data:a}=await w.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",f.id).in("contract_id",t);for(const n of a||[])Ie[n.contract_id]=n}jt()}function ji(){const i=document.getElementById("ap-list"),e=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=K.length+" ACTIVE",K.length===0){i.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,e.style.display="none";return}const t=R?.current_tick||0;let a=0,n=0,d="";for(const s of K){const l=s.issuer_type==="GOVERNMENT",r=l?"gov":"private",o=Array.isArray(s.contract_bids)?s.contract_bids[0]:s.contract_bids,c=o?.bid_price||0,m=o?.estimated_cost||0,p=o?.estimated_quality||0,u=s.budget_ceiling||0,v=s.awarded_at_tick||t,y=v+(s.timeline_ticks||8),h=Math.max(0,y-t),$=Math.max(0,t-v),k=s.timeline_ticks||8,A=Math.min(100,Math.round($/k*100)),x=t>y;Dt(s.sector);const T=He(s.sector);a+=u,n+=c,d+=`<div class="ap-item" onclick="openProjectModal('${s.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${g(s.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${g(s.issuer_name||"—")} · ${T}</div>
                </div>
                <span class="oc-item__type-badge ${r}">${l?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS</span>
                    <span class="ap-budget__values" style="color:${x?"var(--red)":"var(--teal)"}">
                        ${$}/${k} ticks ${x?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${A}%;background:${x?"var(--red)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${Y(c)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${Y(m)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${p>=70?"var(--green)":p>=40?"var(--teal)":"var(--orange)"}">${p}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${x?"var(--red)":"var(--text-bright)"}">${h} ticks</div>
                </div>
            </div>
        </div>`}i.innerHTML=d,e.style.display=K.length>0?"":"none",K.length>0&&(document.getElementById("ap-total-crew").textContent=K.length,document.getElementById("ap-total-budget").textContent=Y(a),document.getElementById("ap-total-spent").textContent=Y(n))}async function Qt(){if(!f)return;const{data:i,error:e}=await w.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",f.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",f.id).order("awarded_at_tick",{ascending:!0});e?(console.warn("Failed to load active projects:",e.message),K=[]):K=i||[],ji()}const Kt=3e4;function Jt(){let i=0,e=0;for(const t of ie)for(const a of $t){const n=H[t.key]?.[a];n&&(i+=n.qty,e+=n.value)}return{totalUnits:i,totalValue:e}}function ht(){const i=document.getElementById("wh-list"),{totalUnits:e,totalValue:t}=Jt();document.getElementById("wh-count").textContent=e.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=z(t);const a=Math.round(e/Kt*100),n=document.getElementById("wh-capacity");n.textContent=a+"%",n.style.color=a>80?"var(--red)":a>50?"var(--orange)":"var(--green)";let d="";for(let s=0;s<ie.length;s++){const l=ie[s],r=mt===s,o=H[l.key]?.LOW||{qty:0,value:0},c=H[l.key]?.STD||{qty:0,value:0},m=H[l.key]?.HIGH||{qty:0,value:0},p=o.qty+c.qty+m.qty,u=o.value+c.value+m.value,v=p===0,y=pe(l.key,"LOW",_),h=pe(l.key,"STD",_),$=pe(l.key,"HIGH",_),k=o.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",A=c.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",x=$.available?m.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(d+='<div class="wh-row">',d+=`<div class="wh-row__collapsed${r?" expanded":""}" onclick="toggleWhRow(${s})">
            <span class="wh-row__arrow">${r?"▾":"▸"}</span>
            <span class="wh-row__name${v?" empty":""}">${g(l.name)}</span>
            <div class="wh-row__dots">
                <div class="${k}"></div>
                <div class="${A}"></div>
                <div class="${x}"></div>
            </div>
            <span class="wh-row__qty${v?" empty":""}">${p>0?p.toLocaleString():"—"}</span>
            <span class="wh-row__val${v?" empty":""}">${u>0?z(u):"—"}</span>
        </div>`,r){d+='<div class="wh-expand">',d+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const T=[{key:"LOW",label:"Low",data:o,avail:y,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:c,avail:h,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:m,avail:$,color:"var(--green)",dotClass:"wh-dot--high"}];for(const E of T){const S=!E.avail.available,C=E.data.qty>0,M=C?"$"+Math.round(E.data.value/E.data.qty):"—";d+=`<div class="wh-grade${S?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${E.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${S?"var(--red)":E.color}">${E.label}</span>
                        ${S?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${C?"var(--text-bright)":"var(--text-dim)"}">${C?E.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${E.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${E.data.value>0?z(E.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${M}</span>
                </div>`}for(const E of T)!E.avail.available&&E.avail.failedStat&&(d+=`<div class="wh-lock">
                        <span class="wh-lock__text">${E.label.toUpperCase()} GRADE LOCKED — ${g(E.avail.failedStat)} &lt; ${E.avail.failedMin}</span>
                    </div>`);d+="</div>"}d+="</div>"}i.innerHTML=d}function Ui(i){mt=mt===i?-1:i,ht()}async function Gi(){if(!f)return;const{data:i,error:e}=await w.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",f.id);if(H={},e)console.warn("Failed to load warehouse:",e.message);else if(i)for(const t of i)H[t.material_key]||(H[t.material_key]={}),H[t.material_key][t.quality_tier]={qty:t.quantity||0,value:Number(t.total_value)||0};ht()}const Wi={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function Xt(){const i=(_?.name||f?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+i;const e=Number(f?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=z(e);const{totalUnits:t}=Jt(),a=Math.round(t/Kt*100),n=document.getElementById("pr-wh-capacity");n.textContent=a+"%",n.style.color=a>80?"var(--red)":a>50?"var(--orange)":"var(--green)",Zt(),wt(),Ue()}function Zt(){const i=document.getElementById("pr-mat-grid");let e="";for(const t of ie){const a=P===t.key,n=$t.every(s=>!pe(t.key,s,_).available),d="pr-mat-btn"+(a?" active":"")+(n?" all-locked":"");e+=`<span class="${d}" onclick="setPrMat('${t.key}')">${g(t.name)}</span>`}i.innerHTML=e}function wt(){const i=document.getElementById("pr-tier-bar");let e='<span class="pr-tier-label">GRADE</span>';for(const t of $t){const a=pe(P,t,_),n=D===t,d=a.available?bt(P,t,_):null,s=Ot[t],l=!a.available,r="pr-tier-btn"+(n?" active":"")+(l?" locked":"");e+=`<div class="${r}" onclick="${l?"":`setPrTier('${t}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${s};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${n?"var(--text-bright)":"var(--text-dim)"}">${pt[t]}</span>
            </div>
            ${d!==null?`<div class="pr-tier-btn__price" style="color:${n?"var(--text-bright)":"var(--text-muted)"}">$${d}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}i.innerHTML=e}function Ue(){const i=document.getElementById("pr-content"),e=pe(P,D,_),t=ie.find($=>$.key===P);if(!t)return;if(!e.available){i.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${g(t.name)} — ${pt[D]} grade
                    is not produced domestically in ${g(_?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${g(e.failedStat||"unknown")} &lt; ${e.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const a=bt(P,D,_),n=Pt(P,D,_),d=a*me,s=n>3e3?"LOW":n>1e3?"MODERATE":"HIGH",l=s==="LOW"?"var(--green)":s==="MODERATE"?"var(--amber)":"var(--red)",r=Number(_?.inflation??50),o=r>55?"up":r<45?"down":"flat",c=o==="up"?"&#9650;":o==="down"?"&#9660;":"&#8212;",m=o==="up"?"var(--red)":o==="down"?"var(--green)":"var(--text-dim)";let p="";p+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
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
                <div class="pr-market-cell__value" style="font-size:12px;color:${l};margin-top:2px;">${s}</div>
            </div>
        </div>
    </div>`,p+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${g(_?.name||"—")})</div>`;for(const $ of t.priceDrivers){const k=Number(_?.[$]??50),A=k>=50?"var(--green)":k>=30?"var(--amber)":k>=15?"var(--orange)":"var(--red)",x=Wi[$]||$;p+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${g($)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${k}%;background:${A}"></div>
            </div>
            <span class="pr-driver-row__val">${k}</span>
            <span class="pr-driver-row__effect">${g(x)}</span>
        </div>`}p+="</div>";const v=(Number(f?.corp_cash_reserves)||0)>=d,y=me>n,h=Ot[D];p+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${g(t.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${h};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${h}">${pt[D]}</span>
                </div>
                <span class="pr-order__mat-price">$${a}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map($=>`<span class="pr-qty-btn${me===$?" active":""}" onclick="setPrQty(${$})">${$>=1e3?$/1e3+"k":$}</span>`).join("")}
                </div>
            </div>
            ${y?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${n.toLocaleString()} this tick</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${z(d)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${v&&!y?"":"disabled"}
                    title="${v?y?"Exceeds supply":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,i.innerHTML=p}function Fi(i){P=i,D="STD";for(const e of["STD","HIGH","LOW"])if(pe(i,e,_).available){D=e;break}Zt(),wt(),Ue()}function Vi(i){D=i,wt(),Ue()}function Yi(i){me=i,Ue()}let nt=!1;async function Qi(){if(nt||!f||!_)return;const i=bt(P,D,_),e=Pt(P,D,_),t=i*me,a=Number(f.corp_cash_reserves)||0;if(t>a){alert("Insufficient cash reserves.");return}if(me>e){alert("Exceeds available supply this tick.");return}nt=!0;const n=document.querySelector(".pr-purchase-btn");n&&(n.disabled=!0,n.textContent="...");try{const d=a-t,{error:s}=await w.from("factions").update({corp_cash_reserves:d}).eq("id",f.id);if(s)throw s;const l=H[P]?.[D],r=(l?.qty||0)+me,o=(l?.value||0)+t,{error:c}=await w.from("corp_warehouse").upsert({faction_id:f.id,nation_id:f.nation_id,material_key:P,quality_tier:D,quantity:r,total_value:o,last_purchased_tick:R?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(c){const{error:m}=await w.from("factions").update({corp_cash_reserves:a}).eq("id",f.id);throw m&&console.error("Cash refund failed after warehouse error:",m.message),c}f.corp_cash_reserves=d,H[P]||(H[P]={}),H[P][D]={qty:r,value:o},ht(),Xt(),n&&(n.textContent="PURCHASED",setTimeout(()=>{n.isConnected&&(n.disabled=!1,n.textContent="PURCHASE")},1500))}catch(d){n&&(n.disabled=!1,n.textContent="PURCHASE"),alert("Purchase failed: "+(d.message||"Unknown error"))}finally{nt=!1}}function ei(i){const e=fe||_;if(!e)return[];const t=De(i);if(!t)return[];const a=gi(i,e),n=[],d=Number(e?.inflation??50),s=Number(e?.fuel_prices??50);Number(e?.manufacturing_output??50);const l=fe&&_&&fe.id!==_.id;let r=null;if(l&&(r=xi(e,_)),a.newAvailable>0){const o=Lt(i,e),c=t.basePrice,m=Math.round(c*((d-50)/200)),p=Math.round(c*((s-50)/300));let u=o;const v=[{label:"Base price",value:z(c)},m!==0?{label:`Inflation (${d})`,mod:(m>=0?"+":"")+z(Math.abs(m))}:null,p!==0?{label:`Fuel transport (${s})`,mod:(p>=0?"+":"")+z(Math.abs(p))}:null].filter(Boolean),y=o-c-m-p;if(y!==0&&!l&&v.push({label:"Demand/scarcity",mod:(y>=0?"+":"")+z(Math.abs(y))}),l&&r){const h=Math.round(o*r.tariff),$=Math.round(o*r.transport);u=o+h+$,v.push({label:`Import tariff (${Math.round(r.tariff*100)}%)`,mod:"+"+z(h)}),v.push({label:`Transport (${r.deliveryTicks} tick${r.deliveryTicks>1?"s":""})`,mod:"+"+z($)})}n.push({seller:l?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:l?r?.deliveryTicks||1:0,condition:100,price:Math.round(u),available:a.newAvailable,delivery:l?r.deliveryTicks+" tick"+(r.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:l?r.deliveryTicks:0,used:!1,priceFactors:v,sourceNationId:e.id})}if(a.usedAvailable>0){const o=a.usedCondition,c=Lt(i,e,{used:!0,condition:o});let m=c;const p=[{label:"Base price",value:z(t.basePrice)},{label:`Condition (${o}%)`,mod:"-"+z(Math.max(0,t.basePrice-c))}];if(l&&r){const u=Math.round(c*r.tariff),v=Math.round(c*r.transport);m=c+u+v,p.push({label:`Import tariff (${Math.round(r.tariff*100)}%)`,mod:"+"+z(u)}),p.push({label:`Transport (${r.deliveryTicks} tick${r.deliveryTicks>1?"s":""})`,mod:"+"+z(v)})}n.push({seller:l?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:l?r?.deliveryTicks||1:0,condition:o,price:Math.round(m),available:a.usedAvailable,delivery:l?r.deliveryTicks+" tick"+(r.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:l?r.deliveryTicks:0,used:!0,priceFactors:p,sourceNationId:e.id})}return n}function Ge(){const i=Number(f?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=z(i);const e=De(V),t=Me[e?.tier||1],a=document.getElementById("em-tier-badge");a&&(a.textContent=t.tag,a.style.color=t.color),a.style.background=t.color+"0a",a.style.border="1px solid "+t.color+"33";const n=document.getElementById("em-nation-select");if(n&&n.options.length===0){const l=_?.name||f?.nation||"—";let r=`<option value="">${g(l)} (HQ)</option>`;for(const o of Oe)o.id!==_?.id&&(r+=`<option value="${o.id}">${g(o.name)}</option>`);n.innerHTML=r}const d=document.getElementById("em-import-tag"),s=fe&&_&&fe.id!==_.id;d&&(d.style.display=s?"":"none"),Ki(),kt()}function Ki(){let i="";for(let e=1;e<=3;e++){const t=Me[e],a=ct(e),n=e===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";i+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${t.color}">${t.tag}</div>
            <div class="${n}">`;for(const d of a){const s=V===d.key,l=ei(d.key).length>0;i+=`<span class="em-selector__btn${s?" active":""}${l?"":" no-listings"}"
                style="${s?"background:"+t.color+";border-color:"+t.color:""}"
                onclick="setEmType('${d.key}')">${g(d.name)}</span>`}i+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${i}</div>`}function kt(){const i=document.getElementById("em-content");if(ae=ei(V),ae.length===0){i.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}Z>=ae.length&&(Z=0);let e="";for(let a=0;a<ae.length;a++){const n=ae[a],d=Z===a,s=n.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",l=Rt(n.condition);e+=`<div class="em-listing${d?" selected":""}" style="${d?"border-left-color:"+s:""}" onclick="setEmListing(${a})">`,e+=`<div class="em-listing__row1">
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
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${z(n.price)}</div>
            </div>
        </div>`,d&&n.priceFactors&&(e+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${n.priceFactors.map(r=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${g(r.label)}</span>
                    <span class="em-breakdown__mod" style="color:${r.mod?r.mod.startsWith("-")?"var(--green)":r.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${r.mod||r.value}</span>
                </div>`).join("")}
            </div>`),e+="</div>"}const t=ae[Z];if(t){const a=De(V),n=Me[a?.tier||1],d=Math.min(t.available,4),s=t.price*ee,l=(Number(f?.corp_cash_reserves)||0)>=s;e+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${g(a?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${g(t.seller)}</span>
                </div>
                <span class="em-purchase__price">${z(t.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:d},(r,o)=>o+1).map(r=>`<span class="em-qty-btn${ee===r?" active":""}" style="${ee===r?"background:"+n.color+";border-color:"+n.color:""}" onclick="setEmQty(${r})">${r}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${t.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${z(s)}</div>
                    ${t.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${g(t.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${n.color}" onclick="purchaseEquipment()"
                    ${l?"":"disabled"}
                    title="${l?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}i.innerHTML=e}async function Ji(i){if(!i)fe=null;else{let t=Oe.find(a=>a.id===i);if(!t)try{const{data:a}=await w.from("nations").select("*").eq("id",i).single();t=a}catch{}fe=t||null}Z=0,ee=1;const e=document.getElementById("em-nation-select");e&&(e.value=i||""),Ge()}function Xi(i){V=i,Z=0,ee=1,Ge()}function Zi(i){Z=i,ee=1,kt()}function en(i){ee=i,kt()}let at=!1;async function tn(){if(at)return;const i=ae[Z];if(!i||!f)return;const e=De(V);if(!e)return;const t=ee,a=i.price*t,n=Number(f.corp_cash_reserves)||0;if(a>n){alert("Insufficient cash reserves.");return}if(t>i.available){alert("Not enough units available.");return}const d=document.querySelector(".em-purchase-btn");d&&(d.disabled=!0,d.textContent="..."),at=!0;try{const s=n-a,{error:l}=await w.from("factions").update({corp_cash_reserves:s}).eq("id",f.id);if(l)throw l;const r=!i.deliveryTicks||i.deliveryTicks===0;if(r){const c=J.find(A=>A.equipment_key===V),m=(c?.owned||0)+t,p=c?.purchase_price_avg||0,u=c?.owned||0,v=u>0?Math.round((p*u+i.price*t)/m):i.price,y=e.maintenancePerUnit*m,h=c?.condition||100,$=Math.round((h*u+i.condition*t)/m),{error:k}=await w.from("corp_equipment").upsert({faction_id:f.id,nation_id:f.nation_id,equipment_key:V,tier:e.tier,owned:m,deployed:c?.deployed||0,condition:$,maintenance_per_tick:y,purchase_price_avg:v,last_purchased_tick:R?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(k){const{error:A}=await w.from("factions").update({corp_cash_reserves:n}).eq("id",f.id);throw A&&console.error("Cash refund failed:",A.message),k}c?(c.owned=m,c.condition=$,c.maintenance_per_tick=y):J.push({equipment_key:V,tier:e.tier,owned:m,deployed:0,condition:$,maintenance_per_tick:y,assigned_projects:[]})}else{const c=(R?.current_tick||0)+i.deliveryTicks,{error:m}=await w.from("corp_equipment_deliveries").insert({faction_id:f.id,equipment_key:V,quantity:t,condition:i.condition,delivery_tick:c,source_nation_id:i.sourceNationId||null,seller_name:i.seller,price_paid:a});if(m){const{error:p}=await w.from("factions").update({corp_cash_reserves:n}).eq("id",f.id);throw p&&console.error("Cash refund failed:",p.message),m}}f.corp_cash_reserves=s,Et(),Ge();const o=document.getElementById("pr-cash");o&&(o.textContent=z(s)),d&&(d.textContent=r?"PURCHASED":"ORDERED",setTimeout(()=>{d.isConnected&&(d.disabled=!1,d.textContent="PURCHASE")},1500))}catch(s){d&&(d.disabled=!1,d.textContent="PURCHASE"),alert("Purchase failed: "+(s.message||"Unknown error"))}finally{at=!1}}let nn=-1,Ee=[],gt=[],ti=[];function ot(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(1)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function an(i,e,t){if(t)return"var(--orange)";const a=i/(e||1)*100;return a>50?"var(--green)":a>25?"var(--amber)":"var(--red)"}function on(){const i=document.getElementById("pm-list"),e=Ee.length,t=gt.length,a=ti.length,n=Ee.filter(r=>r.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${e})`,document.getElementById("pm-pending-count").textContent=`(${t})`,document.getElementById("pm-apply-count").textContent=`(${a})`;const d=document.getElementById("pm-badges");let s="";n>0&&(s+=`<span class="pm-badge pm-badge--expiring">${n} EXPIRING</span>`),t>0&&(s+=`<span class="pm-badge pm-badge--pending">${t} PENDING</span>`),d.innerHTML=s;const l=Ee.reduce((r,o)=>r+(o.cost||0),0)+gt.reduce((r,o)=>r+(o.cost||0),0);document.getElementById("pm-total-cost").textContent=ot(l),document.getElementById("pm-footer-active").textContent=e,document.getElementById("pm-footer-pending").textContent=t;{if(e===0){i.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let r="";Ee.forEach((o,c)=>{const m=nn===c,p=an(o.ticks_left,o.total_ticks,o.expiring_soon),u=Math.min(o.ticks_left/(o.total_ticks||1)*100,100);r+=`<div class="pm-item ${o.expiring_soon?"pm-item--expiring":""} ${m?"expanded":""}" onclick="togglePmExpand(${c})">
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
                        <span class="pm-detail__val">${ot(o.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${o.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${o.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(o.projects||[]).map(v=>`<span class="pm-project-chip">${g(v)}</span>`).join("")}</div>
                    </div>`,o.note&&(r+=`<div class="pm-note"><span class="pm-note__text">${g(o.note)}</span></div>`),o.expiring_soon&&o.renewable&&(r+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew">RENEW — ${ot(o.cost||0)}</button></div>`),r+="</div>"),r+="</div></div>"}),i.innerHTML=r;return}}function sn(){Ee=[],gt=[],ti=[],on()}let le=[],rn=-1;function X(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(2)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function qt(i){return i>=85?"var(--gold)":i>=60?"var(--green)":i>=40?"var(--orange)":"var(--red)"}function ln(i){return"dl-result--"+i.toLowerCase()}function Bt(){const i=document.getElementById("dl-list"),e=le.length;document.getElementById("dl-count").textContent=`${e} COMPLETED`;const t=le.reduce((l,r)=>{const o=r.financials||{};return l+((o.payment||0)+(o.bonus||0)-(o.penalty||0)-(o.total_cost||0))},0),a=document.getElementById("dl-lifetime-profit");a.textContent=(t>=0?"+":"")+X(t),a.style.color=t>=0?"var(--green)":"var(--red)";const n={};le.forEach(l=>{n[l.result]=(n[l.result]||0)+1});const d=document.getElementById("dl-footer-results");if(d.innerHTML=Object.entries(n).map(([l,r])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[l]||"var(--text-dim)"}">${g(l)}</div>
            <div class="dl-footer__result-count">${r}</div>
        </div>`).join(""),e===0){i.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let s="";le.forEach((l,r)=>{const o=rn===r,c=l.financials||{},m=(c.payment||0)+(c.bonus||0)-(c.penalty||0)-(c.total_cost||0),p=m>=0,u=ln(l.result),y={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[l.result]||"var(--text-dim)",h=l.type==="GOVERNMENT";if(s+=`<div class="dl-item ${o?"expanded":""}" onclick="toggleDlExpand(${r})">
            <div class="dl-item__inner" style="border-left:2px solid ${y}">
                <div class="dl-item__row1">
                    <span class="dl-item__name">${g(l.name)}</span>
                    <span class="dl-result-badge ${u}">${g(l.result)}</span>
                </div>
                <div class="dl-item__row2">
                    <span class="dl-item__id">${g(l.id)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                    <span class="dl-item__issuer" style="color:${h?"var(--green)":"var(--gold)"}">${g(l.issuer)}</span>
                    <span class="dl-item__date">${g(l.delivered)}</span>
                </div>
                <div class="dl-summary-bar">
                    <div class="dl-summary-cell" style="flex:1;">
                        <div class="dl-summary-label">QUALITY</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span class="dl-summary-value" style="color:${qt(l.quality_score)}">${l.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${l.rep_change>0?"var(--green)":l.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${l.rep_change>0?"+":""}${l.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${p?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${p?"var(--green)":"var(--red)"};margin-top:2px;">${p?"+":""}${X(m)}</div>
                    </div>
                </div>`,o){const $=l.inspection||{};s+='<div style="margin-top:8px;">',s+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(T=>{const E=$[T]||{score:0,issues:[]},S=qt(E.score),C=Math.min(E.score/100*100,100);s+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${g(T.charAt(0).toUpperCase()+T.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${C}%;background:${S}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${S}">${E.score}</span>
                        </div>
                    </div>
                    ${(E.issues||[]).map(M=>`<div class="dl-inspect-issue">${g(M)}</div>`).join("")}
                </div>`});const k=$.permits||{passed:!0,issues:[]};s+=`<div class="dl-permits-row ${k.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${k.passed?"var(--green)":"var(--red)"}">${k.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${(k.issues||[]).map(T=>`<div class="dl-inspect-issue dl-inspect-issue--red">${g(T)}</div>`).join("")}
            </div>`,s+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',s+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(l.materials_used||[]).forEach(T=>{const E=T.grade==="HIGH"?"var(--green)":T.grade==="STANDARD"?"var(--amber)":"var(--orange)",S=T.impact==="positive"?"▲":T.impact==="negative"?"▼":"–",C=T.impact==="positive"?"var(--green)":T.impact==="negative"?"var(--red)":"var(--text-dim)";s+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${g(T.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${E}"></div>
                    <span class="dl-mat-tag__grade" style="color:${E}">${g(T.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${C}">${S}</span>
                </div>`}),s+="</div>",s+='<div class="dl-section-label">Financial Summary</div>',s+='<div class="dl-fin-panel">',s+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${X(c.contract_value||0)}</span></div>`,(c.bonus||0)>0&&(s+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${X(c.bonus)}</span></div>`),(c.penalty||0)>0&&(s+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${X(c.penalty)}</span></div>`);const A=(c.payment||0)+(c.bonus||0)-(c.penalty||0);s+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${X(A)}</span></div>`,s+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${X(c.total_cost||0)}</span></div>`,s+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${p?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${p?"var(--green)":"var(--red)"}">${p?"+":""}${X(m)}</span>
            </div>`,s+="</div>";const x=l.timeline||{};s+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${x.actual||0}/${x.expected||0} ticks</span>`,x.early?s+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(x.expected||0)-(x.actual||0)} TICK${x.expected-x.actual!==1?"S":""} EARLY</span>`:!x.on_time&&x.actual>x.expected&&(s+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(x.actual||0)-(x.expected||0)} TICK${x.actual-x.expected!==1?"S":""} LATE</span>`),s+="</div>",s+="</div>"}s+="</div></div>"}),i.innerHTML=s}async function dn(){if(!f){le=[],Bt();return}const{data:i,error:e}=await w.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",f.id).order("delivered_at_tick",{ascending:!1}).limit(20);e?(console.warn("Failed to load deliveries:",e.message),le=[]):le=(i||[]).map(t=>{const a=t.construction_contracts||{};return{id:t.contract_id,name:a.name||"Project",type:a.issuer_type||"GOVERNMENT",issuer:a.issuer_name||"Government",delivered:"Tick "+(t.delivered_at_tick||0),result:t.result,quality_score:t.quality_score,rep_change:t.rep_change,financials:{contract_value:t.contract_value||0,bonus:t.quality_bonus||0,penalty:t.penalties||0,payment:t.payment_received||0,total_cost:t.total_cost||0},inspection:t.inspection||{},materials_used:t.materials_used||[],timeline:{expected:t.timeline_expected||0,actual:t.timeline_actual||0,on_time:t.on_time,early:t.timeline_actual<t.timeline_expected}}}),Bt()}function Et(){const i=J.reduce((l,r)=>l+(r.owned||0),0),e=J.reduce((l,r)=>l+(r.deployed||0),0),t=yi(J),a=i-e;document.getElementById("eq-count").textContent=i+" UNITS",document.getElementById("eq-summary").innerHTML=`
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
                ${z(t)}
            </div>
        </div>`;const n={};for(const l of J)n[l.equipment_key]=l;let d="";for(let l=1;l<=3;l++){const r=Me[l],o=ct(l),c=ft===l,m=o.reduce((u,v)=>u+(n[v.key]?.owned||0),0),p=o.reduce((u,v)=>u+(n[v.key]?.deployed||0),0);if(d+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${l})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${c?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${r.color}">${g(r.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${r.color};border:1px solid ${r.color}33;background:${r.color}0a">${r.tag}</span>
            </div>
            ${m>0?`<span class="eq-tier-hdr__count">${p}/${m}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,c)for(const u of o){const v=n[u.key],y=v?.owned||0,h=v?.deployed||0,$=v?.condition||0,k=u.maintenancePerUnit*y,A=y-h,x=y>0&&A===0,T=y>0&&$<65,E=Rt($),S=v?.assigned_projects||[],C=S.length>0?S.map(M=>M.contract_name||"Project").join(", ").slice(0,30):y>0&&h>0?h+" project"+(h>1?"s":""):"—";d+=`<div class="eq-row${y===0?" unowned":""}">`,d+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${y===0?" dim":""}">${g(u.name)}</span>
                        ${T?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${y>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${x?"var(--orange)":"var(--green)"}">${A}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${h}/${y}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,y>0?d+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${$}%;background:${E}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${E}">${$}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${g(C)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${z(k)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:d+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',d+="</div>"}}document.getElementById("eq-list").innerHTML=d;const s=[1,2,3].map(l=>{const r=Me[l],o=ct(l).reduce((c,m)=>c+(n[m.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${o>0?r.color+"33":"var(--border-0)"};background:${o>0?r.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${r.color}">${r.tag}</div>
            <div class="eq-footer__tier-count" style="color:${o>0?"var(--text-bright)":"var(--text-dim)"}">${o}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${z(t)}</div>
        </div>
        <div class="eq-footer__tiers">${s}</div>`}function cn(i){ft=ft===i?-1:i,Et()}async function pn(){if(!f)return;const{data:i,error:e}=await w.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",f.id);e?(console.warn("Failed to load equipment:",e.message),J=[]):J=i||[],Et()}async function mn(){const{data:{user:i}}=await w.auth.getUser();if(!i){window.location.href="login.html";return}const{data:e}=await w.from("factions").select("*").or(`id.eq.${i.id},linked_user_id.eq.${i.id}`);ke=(e||[]).filter(o=>o.nation_id);const t=sessionStorage.getItem("active_faction_id");if(f=ke.find(o=>o.id===t)||ke.find(o=>o.faction_type==="corporation")||ke[0],!f){await w.auth.signOut(),window.location.href="login.html";return}if(f.faction_type!=="corporation"){window.location.href="dashboard.html";return}const[a,n]=await Promise.all([f.nation_id?w.from("nations").select("*").eq("id",f.nation_id).single():Promise.resolve({data:null}),w.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);a.error&&console.warn("Nation load failed:",a.error.message),a.data&&(_=a.data),n.error&&console.warn("Shard load failed:",n.error.message),R=n.data;const d=f.corp_ticker||f.abbreviation||"";if(document.getElementById("corp-logo").textContent=d.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=f.faction_name||"Unnamed Corp",R){if(document.getElementById("game-date").textContent=R.current_date||"—",document.getElementById("tick-number").textContent=R.current_tick||"—",R.next_tick_at){const c=(Number(R.tick_interval_hours)||8)*36e5,m=new Date(R.next_tick_at).getTime(),u=m-c+c/2;ut=new Date(u>Date.now()?u:m+c/2),$i()}const o=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");o&&(o.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(d?"["+d+"]":f.faction_name||"Corp")+" ▾";const s=document.getElementById("topbar-cash");if(s){const o=Number(f.corp_cash_reserves??0),c=o>=1e9?"$"+(o/1e9).toFixed(1)+"B":o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k";s.textContent="CASH: "+c}const l=f.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+l+" AP</span>",document.getElementById("nation-pill").textContent=(_?.name||f.nation||"—").toUpperCase();const r=document.getElementById("corp-faction-dropdown");if(r){let o="";for(const c of ke){const m=c.id===f.id,p=c.faction_type==="corporation"?"CORP":"PARTY",u=c.faction_type==="corporation"?"var(--teal)":"var(--amber)";o+=`<div class="corp-dd-item${m?" active":""}" onclick="switchToFaction('${c.id}', '${c.faction_type}')">
                <span class="corp-dd-type" style="color:${u}">${p}</span>
                <span class="corp-dd-name">${g(c.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${g(c.abbreviation||"—")}]</span>
            </div>`}r.innerHTML=o}await Promise.all([Yt(),Qt(),Gi(),pn(),sn(),dn()]);try{const{data:o}=await w.from("nations").select("*").order("name");Oe=o||[]}catch{Oe=[]}if(Xt(),Ge(),vi(f,_,R),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",new URLSearchParams(window.location.search).get("tab")==="expansion"){const o=document.querySelector('[data-tab="expansion"]');o&&ni({preventDefault:()=>{},target:o})}}async function fn(){await w.auth.signOut(),window.location.href="login.html"}function un(){const i=document.getElementById("corp-faction-dropdown");i&&i.classList.toggle("open")}function vn(i,e){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.remove("open"),sessionStorage.setItem("active_faction_id",i),e==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",i=>{const e=document.getElementById("faction-switcher"),t=document.getElementById("corp-faction-dropdown");t&&e&&!e.contains(i.target)&&t.classList.remove("open")});document.addEventListener("keydown",i=>{i.key==="Escape"&&_t()});window.doLogout=fn;window.toggleTheme=_i;window.toggleCorpDropdown=un;window.switchToFaction=vn;window.setFilter=hi;window.openContractDetail=Ut;window.closeContractDetail=_t;window.placeBid=Hi;window.toggleWhRow=Ui;window.toggleEqTier=cn;window.switchEmNation=Ji;window.setEmType=Xi;window.setEmListing=Zi;window.setEmQty=en;window.purchaseEquipment=tn;window.setPrMat=Fi;window.setPrTier=Vi;window.setPrQty=Yi;window.purchaseMaterial=Qi;let W={general:0,skilled:0,innovative:0},st=!1;const Se=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function ii(i){const e=Number(_?.minimum_wage??50),t=Number(_?.inflation??50),a=Number(_?.standard_of_living??50),n=e/100*48e3,d=1+(t-50)/100*.5,s=1+(a-50)/100*.5;return Math.round(n*i*d*s)}function b(i){const e=Math.abs(i),t=i<0?"-":"";return e>=1e9?t+"$"+(e/1e9).toFixed(2)+"B":e>=1e6?t+"$"+(e/1e6).toFixed(2)+"M":e>=1e3?t+"$"+(e/1e3).toFixed(1)+"k":t+"$"+e.toLocaleString()}async function ni(i){i.preventDefault(),document.getElementById("operations-content").style.display="none";const e=document.getElementById("expansion-content");e.style.display="flex",e.style.justifyContent="center",e.style.gap="12px",e.style.alignItems="flex-start",e.style.flexWrap="wrap",document.querySelectorAll(".corp-nav__tab").forEach(t=>t.classList.remove("active")),i.target.classList.add("active"),We(),bn(),await ze(),await Tt(),Fe(),await Mn(),Ve(),li(),await Ln(),Ye()}function ai(i){i&&i.preventDefault(),document.getElementById("operations-content").style.display="flex",document.getElementById("expansion-content").style.display="none",document.querySelectorAll(".corp-nav__tab").forEach(e=>e.classList.remove("active")),document.querySelector('[data-tab="operations"]')?.classList.add("active")}function oi(){return F.reduce((e,t)=>{const a=Number(t.capacity||0),n=Number(t.condition||0)/100;return e+Math.floor(a*n)},0)+500}function yn(i,e){const t=Se.find(d=>d.id===i),a=Number(f?.[t.factionKey]??0),n=W[i]+e;if(!(a+n<0)){if(e>0){const d=Se.reduce((l,r)=>{const o=Number(f?.[r.factionKey]??0),c=r.id===i?n:W[r.id];return l+o+c},0),s=oi();if(d>s)return}W[i]=n,We()}}function gn(i){i?W[i]=0:W={general:0,skilled:0,innovative:0},We()}async function xn(){if(st||!Object.values(W).some(n=>n!==0))return;let e=0;for(const n of Se){const d=W[n.id];d>0&&(e+=d*ii(n.multiplier)*.1)}const t=Number(f?.corp_cash_reserves??0);if(e>t){alert("Insufficient cash reserves. Hiring cost: "+b(e)+", available: "+b(t));return}const a=e>0?`Confirm workforce changes?

Hiring fee: `+b(e)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(a)){st=!0;try{const n={};for(const l of Se){const r=Number(f?.[l.factionKey]??0);n[l.factionKey]=Math.max(0,r+W[l.id])}e>0&&(n.corp_cash_reserves=Math.max(0,t-Math.round(e)));const{error:d}=await w.from("factions").update(n).eq("id",f.id);if(d)throw d;Object.assign(f,n),W={general:0,skilled:0,innovative:0};const s=document.getElementById("topbar-cash");if(s){const l=Number(f.corp_cash_reserves??0);s.textContent="CASH: "+(l>=1e6?"$"+(l/1e6).toFixed(1)+"M":"$"+Math.round(l/1e3)+"k")}We()}catch(n){alert("Error: "+n.message)}finally{st=!1}}}function We(){const i=document.getElementById("hf-card-container");if(!i)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a=Number(_?.minimum_wage??50),n=Number(_?.inflation??50),d=Number(_?.standard_of_living??50),s=a/100*48e3,l=(1+(n-50)/100*.5).toFixed(2),r=(1+(d-50)/100*.5).toFixed(2),o=_?.name||f?.nation||"Nation",c=Object.values(W).some(k=>k!==0),m=oi();let p=0,u=0,v=0,y=0,h="";for(const k of Se){const A=Number(f?.[k.factionKey]??0),x=W[k.id],T=A+x,E=ii(k.multiplier),S=x>0,C=A*E,M=T*E,O=M-C;p+=A,u+=T,v+=C,y+=M;const B=x!==0?S?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";h+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${t.border};background:${B};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${k.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${k.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${t.text}">${A.toLocaleString()}</span>
                    ${x!==0?`<span style="font-family:${e};font-size:10px;color:${t.dim}">→</span>
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${S?t.greenBright:t.red}">${T.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${k.multiplier}.0 × ${l} × ${r})</span>
                <span style="font-family:${e};font-size:10px;color:${k.color}">${b(E)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${k.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.red};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-50</div>
                <div onclick="hfSetChange('${k.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.redDim};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${x!==0?t.card:"transparent"};border:1px solid ${x!==0?t.border:"transparent"}">
                    ${x!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${e};font-size:12px;font-weight:700;color:${S?t.greenBright:t.red}">${S?"+":""}${x}</span>
                        <span onclick="hfReset('${k.id}')" style="font-family:${e};font-size:8px;color:${t.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${e};font-size:9px;color:${t.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${k.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+10</div>
                <div onclick="hfSetChange('${k.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+50</div>
            </div>
            ${x!==0?`<div style="margin-top:6px;padding:4px 8px;background:${t.bg};border:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${O>0?t.red:t.greenBright}">${O>0?"+":""}${b(O)}/yr</span>
            </div>`:""}
        </div>`}const $=y-v;i.innerHTML=`
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
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">${b(s)}/yr</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">INFLATION</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${n}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${l}</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">STD OF LIVING</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${d}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${r}</div>
                    </div>
                </div>
            </div>
            ${h}
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
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${b(v)}</span>
                        ${c?`<span style="font-family:${e};font-size:9px;color:${t.dim}">→</span>
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${$>0?t.red:t.greenBright}">${b(y)}</span>`:""}
                    </div>
                </div>
            </div>
            ${c?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${t.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">NET CHANGE</span>
                    <span style="font-family:${e};font-size:11px;font-weight:700;color:${$>0?t.red:t.greenBright}">${$>0?"+":""}${b($)}/yr</span>
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">(${$>0?"+":""}${b(Math.round($/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${t.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}function bn(){const i=document.getElementById("wf-summary-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},a=(_?.name||f?.nation||"Nation").toUpperCase(),n=Number(_?.minimum_wage??50),d=Number(_?.inflation??50),s=Number(_?.standard_of_living??50),l=n/100*48e3,r=1+(d-50)/100*.5,o=1+(s-50)/100*.5,c=[{label:"General Workforce",mult:2,color:t.accent,key:"corp_general_workforce",countColor:t.text},{label:"Skilled Workforce",mult:3,color:t.gold,key:"corp_skilled_workforce",countColor:t.blue},{label:"Innovative Workforce",mult:6,color:t.orange,key:"corp_innovative_workforce",countColor:t.gold}];let m=0,p=0,u="";for(const v of c){const y=Number(f?.[v.key]??0),h=Math.round(l*v.mult*r*o),$=y*h;m+=y,p+=$,u+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${v.label}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${a}</span>
                </div>
                <span style="font-family:${e};font-size:16px;font-weight:700;color:${v.countColor}">${y.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${v.mult}.0 × ${r.toFixed(2)} × ${o.toFixed(2)})</span>
                <span style="font-family:${e};font-size:10px;color:${t.muted}">${b(h)}/yr</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">TOTAL ANNUAL COST</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${b($)}</span>
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
                    <span style="font-family:${e};font-size:9px;color:${t.text}">${n}/100 → ${b(l)}/yr</span>
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
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${b(p)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">PER TICK (÷12)</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${b(Math.round(p/12))}</span>
            </div>
        </div>
    </div>`}let F=[];async function ze(){if(!f?.id)return;const{data:i}=await w.from("corp_properties").select("*").eq("faction_id",f.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});F=i||[]}function Ne(){const i=document.getElementById("property-card-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a=(_?.name||f?.nation||"Nation").toUpperCase(),n=1+(Number(_?.inflation??50)-50)/100*.3;let d="",s=0,l=0;const r=_?.name||f?.nation||"Home Nation",o=5e7,c=1+(Number(_?.inflation??50)-50)/100*.3,m=.8+Number(_?.stability??50)/100*.4,p=Math.round(o*c*m),u=Math.round(p*.005);s+=p,l+=u,d+=`
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
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${b(p)}</div>
            </div>
            <div style="flex:1;padding:3px 6px">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${b(u)}</div>
            </div>
        </div>
    </div>`;for(const v of F){const y=Pe[v.style]||Pe.Basic;s+=Number(v.purchase_price||0),l+=Number(v.monthly_maintenance||0),d+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:${t.text}">${v.name}</span>
                <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${t.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">OWNED</span>
            </div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:4px;">${v.city||a} · ${(v.type||"").replace(/_/g," ")} · <span style="color:${y.color}">${(v.style||"Basic").toUpperCase()}</span></div>
            <div style="display:flex;gap:0;background:${t.card};border:1px solid ${t.border}">
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">CAPACITY</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${(v.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">PAID</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${b(v.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${b(v.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="margin-top:4px;display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">CONDITION</span>
                <span style="font-family:${e};font-size:9px;color:${v.condition>=75?"#5c5":v.condition>=50?"#ca5":t.orange}">${v.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:${t.border};margin-top:2px;"><div style="width:${v.condition}%;height:100%;background:${v.condition>=75?"#5c5":v.condition>=50?"#ca5":t.orange}"></div></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <div onclick="propRefurbish('${v.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.accent};border:1px solid ${t.accent}33;cursor:pointer;">REFURBISH (${b(Math.round((v.purchase_price||0)*.1*n))})</div>
                <div onclick="propSell('${v.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.red};border:1px solid ${t.red}33;cursor:pointer;">SELL</div>
            </div>
        </div>`}i.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Property</span>
            </div>
            <span style="font-family:${e};font-size:10px;color:${t.muted}">${F.length+1} ASSET${F.length+1!==1?"S":""}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${d}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL VALUE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.green}">${b(s)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL MAINTENANCE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${b(l)}/mo</span>
            </div>
        </div>
    </div>`}let be=[],G=null;const Pe={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function Tt(){if(!f?.nation_id)return;const{data:i,error:e}=await w.from("available_properties").select("*").eq("nation_id",f.nation_id).eq("status","available").order("price",{ascending:!0});if(e){console.warn("[Property] Failed to load marketplace:",e.message);return}be=(i||[]).map(t=>({...t,adjusted_cost:t.price,adjusted_maintenance:t.monthly_maintenance}))}function Fe(){const i=document.getElementById("new-property-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"};(_?.name||f?.nation||"Nation").toUpperCase();const a=Number(_?.standard_of_living??50),n=Number(_?.gdp_growth??50),d=Number(_?.inflation??50),s=_?.capital||"Capital",l={capital:s,port:s+" Port",industrial:s+" Industrial Zone",suburban:s+" Suburbs",coastal:s+" Coast"};let r="";if(be.length===0)r=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let o=0;o<be.length;o++){const c=be[o],m=G===o,p=Pe[c.style]||Pe.Basic,u=l[c.city_template]||s;r+=`
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
                        <div style="font-family:${e};font-size:11px;font-weight:700;color:${t.gold};margin-top:1px">${b(c.adjusted_cost)}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">MAINT/MO</div>
                        <div style="font-family:${e};font-size:11px;font-weight:700;color:${t.redDim};margin-top:1px">${b(c.adjusted_maintenance)}</div>
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
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${be.length} AVAILABLE</span>
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
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${d<=50?t.greenBright:t.red}">${Math.round(d)}</span>
            </div>
        </div>
        <div style="flex:1;overflow:auto;">
            ${r}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;gap:6px;justify-content:space-between;">
                <div onclick="npOpenConstructionModal()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${t.gold};border:1px solid ${t.gold}44;cursor:pointer">CONSTRUCTION PROJECT</div>
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${G!==null?"#000":t.dim};background:${G!==null?t.accent:"transparent"};border:1px solid ${G!==null?t.accent:t.border};cursor:${G!==null?"pointer":"default"};opacity:${G!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function $n(i){G=G===i?null:i,Fe()}let rt=!1;async function _n(){if(G===null||rt)return;const i=be[G];if(!i)return;const e=Number(f?.corp_cash_reserves??0);if(i.adjusted_cost>e){alert(`Insufficient cash reserves.
Property: `+b(i.adjusted_cost)+`
Cash: `+b(e));return}if(confirm('Buy "'+i.name+'" for '+b(i.adjusted_cost)+`?

Monthly maintenance: `+b(i.adjusted_maintenance)+`/mo
Condition: `+i.condition+`%

This will be deducted from your cash reserves.`)){rt=!0;try{const{error:t}=await w.from("corp_properties").insert({faction_id:f.id,nation_id:f.nation_id,catalog_id:i.catalog_id||null,name:i.name,type:i.type,style:i.style,capacity:i.capacity,purchase_price:i.adjusted_cost,monthly_maintenance:i.adjusted_maintenance,condition:i.condition,city:i.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(t)throw t;const a=Math.max(0,e-i.adjusted_cost),{error:n}=await w.from("factions").update({corp_cash_reserves:a}).eq("id",f.id);if(n)throw n;f.corp_cash_reserves=a,i.id&&await w.from("available_properties").update({status:"sold",purchased_by:f.id}).eq("id",i.id);const d=document.getElementById("topbar-cash");d&&(d.textContent="CASH: "+(a>=1e6?"$"+(a/1e6).toFixed(1)+"M":"$"+Math.round(a/1e3)+"k")),G=null,await Tt(),Fe(),Ne(),alert("Property purchased: "+i.name+`

Deducted: `+b(i.adjusted_cost))}catch(t){alert("Purchase failed: "+t.message)}finally{rt=!1}}}const de={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let It=!1,I={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},lt=!1;function si(){const e=1+(Number(_?.inflation??50)-50)/100*.3,t=de[I.style]?.costMod||1,a=I.type==="Warehouse"?.75:1,n=Math.round(I.size*1e5*e*t*a),d=Math.round(n*(1+I.budgetMod/100)),s=Math.round(d*.007*(de[I.style]?.maintMod||1));return{baseBudget:n,adjusted:d,maint:s,inflMod:e,styleMod:t}}function hn(){It=!0,I={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},ri()}function Ct(){It=!1,document.getElementById("cp-modal-overlay")?.remove()}function wn(i,e){I[i]=e,ri()}async function kn(){if(!(lt||!I.name.trim())){lt=!0;try{const i=si(),e=_?.name||f?.nation||"Unknown",t=de[I.style]?.repGain||1,a=await w.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),n=a.data?.current_tick||0,d=(a.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:s}=await w.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",f.nation_id).eq("issuer_type","PRIVATE"),r=`PVT-C${(s||0)+1}-${d}`,{error:o}=await w.from("construction_contracts").insert({nation_id:f.nation_id,template_key:"custom_building",sector:"civil_engineering",name:I.name.trim(),description:`${I.type} (${I.style}) — ${I.size.toLocaleString()} employees, commissioned by ${f.faction_name}`,project_code:r,budget_ceiling:i.adjusted,timeline_ticks:I.timeline,required_materials:(()=>{const c=I.size/1e3,m=I.style,p={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[m]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},u=(v,y)=>Math.max(1,Math.ceil(c*v*y));return{concrete:u(8,p.concrete),steel:u(6,p.steel),glass_facades:u(3,p.glass),em_systems:u(4,p.em),lumber:u(1,p.lumber),heavy_parts:u(2,p.heavy),aggregate:u(3,p.agg)}})(),required_equipment:(()=>{const c=["work_trucks","concrete_mixers"];return I.size>1e3&&c.push("excavators","tower_cranes"),I.size>3e3&&c.push("bulldozers","heavy_haulers"),I.size>8e3&&c.push("pile_drivers"),c})(),required_workforce:{general:Math.ceil(I.size*.08),skilled:Math.ceil(I.size*.03)},status:"open",generated_at_tick:n,bidding_ends_tick:n+3,issuer_type:"PRIVATE",issuer_name:f.faction_name,issuer_faction_id:f.id});if(o)throw o;Ct(),alert(`Construction project submitted!

Project: `+I.name.trim()+`
Code: `+r+`
Budget: `+b(i.adjusted)+`
Expected Reputation: +`+t+`

All construction corporations in `+e+" can now bid on this project.")}catch(i){alert("Failed to submit project: "+i.message)}finally{lt=!1}}}function ri(){if(document.getElementById("cp-modal-overlay")?.remove(),!It)return;const i="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=si(),a=_?.name||f?.nation||"Nation",n=de[I.style]?.repGain||1,d=n>=4?e.gold:n>=3?e.greenBright:n>=2?e.accent:e.dim,s=Object.entries(de).map(([o,c])=>{const m=I.style===o;return`<div onclick="cpSetField('style','${o}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${m?c.color+"18":"transparent"};border:1px solid ${m?c.color+"44":e.border};">
            <div style="font-family:${i};font-size:9px;font-weight:700;color:${m?c.color:e.dim}">${o}</div>
            <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:1px">×${c.costMod.toFixed(1)} cost</div>
        </div>`}).join(""),l=document.createElement("div");l.id="cp-modal-overlay",l.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",l.innerHTML=`
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
                <div style="margin-top:4px;font-family:${i};font-size:8px;color:${de[I.style].color}">${de[I.style].desc}</div>
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
                        <span style="font-family:${i};font-size:9px;color:${e.muted}">${b(t.baseBudget)}</span>
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
                        <span style="font-family:${i};font-size:14px;font-weight:700;color:${e.gold}">${b(t.adjusted)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">EST. MONTHLY MAINTENANCE</span>
                        <span style="font-family:${i};font-size:9px;color:${e.redDim}">${b(t.maint)}/mo</span>
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
                    <span style="font-family:${i};font-size:16px;font-weight:700;color:${d}">+${n}</span>
                </div>
                <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:2px">${I.style} style · ${n===5?"Maximum prestige":n>=4?"Impressive presence":n>=3?"Strong statement":n>=2?"Solid investment":"Functional addition"}</div>
            </div>

        </div>
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${i};font-size:7px;color:${e.dim}">TOTAL PROJECT</div>
                <div style="font-family:${i};font-size:14px;font-weight:700;color:${e.gold}">${b(t.adjusted)}</div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="cpClose()" style="padding:5px 16px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:5px 16px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${e.gold};cursor:pointer;opacity:${I.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(l);const r=document.getElementById("cp-name-input");r&&r.addEventListener("input",o=>{I.name=o.target.value}),l.addEventListener("click",o=>{o.target===l&&Ct()})}function En(){const i=document.getElementById("cp-name-input");if(i&&(I.name=i.value),!I.name.trim()){alert("Please enter a building name.");return}kn()}window.cpClose=Ct;window.cpSetField=wn;window.cpSubmitFromModal=En;window.npSelect=$n;window.npBuyProperty=_n;window.npOpenConstructionModal=hn;let $e=!1;async function Tn(i){if($e)return;const e=F.find(l=>l.id===i);if(!e)return;const t=1+(Number(_?.inflation??50)-50)/100*.3,a=Math.round((e.purchase_price||0)*.1*t),n=Number(f?.corp_cash_reserves??0);if(a>n){alert("Insufficient cash. Refurbishment costs "+b(a)+" (inflation-adjusted), you have "+b(n));return}if(e.condition>=95){alert("Property is already in excellent condition ("+e.condition+"%).");return}const d=5+Math.floor(Math.random()*21),s=Math.min(100,e.condition+d);if(confirm('Refurbish "'+e.name+`"?

Cost: `+b(a)+`
Expected improvement: +`+d+"% condition ("+e.condition+"% → "+s+"%)")){$e=!0;try{await w.from("corp_properties").update({condition:s}).eq("id",i);const l=Math.max(0,n-a);await w.from("factions").update({corp_cash_reserves:l}).eq("id",f.id),f.corp_cash_reserves=l;const r=document.getElementById("topbar-cash");r&&(r.textContent="CASH: "+(l>=1e6?"$"+(l/1e6).toFixed(1)+"M":"$"+Math.round(l/1e3)+"k")),await ze(),Ne(),alert("Refurbished! Condition: "+e.condition+"% → "+s+"%")}catch(l){alert("Refurbishment failed: "+l.message)}finally{$e=!1}}}async function In(i){if($e)return;const e=F.find(d=>d.id===i);if(!e)return;const t=1+(Number(_?.inflation??50)-50)/100*.3,a=(e.condition||50)/100,n=Math.round((e.purchase_price||0)*.6*a*t);if(confirm('Sell "'+e.name+`"?

Sale value: `+b(n)+" (60% × "+e.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){$e=!0;try{await w.from("corp_properties").update({is_active:!1}).eq("id",i);const s=Number(f?.corp_cash_reserves??0)+n;await w.from("factions").update({corp_cash_reserves:s}).eq("id",f.id),f.corp_cash_reserves=s;const r=(await w.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await w.from("available_properties").insert({nation_id:f.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,price:Math.round(n*1.1),monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,generated_at_tick:r,expires_at_tick:r+6,status:"available"});const o=document.getElementById("topbar-cash");o&&(o.textContent="CASH: "+(s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k")),await ze(),Ne(),await Tt(),Fe(),alert('Sold "'+e.name+'" for '+b(n))}catch(d){alert("Sale failed: "+d.message)}finally{$e=!1}}}window.propRefurbish=Tn;window.propSell=In;let Te=0;function li(){const i=document.getElementById("manage-subsidiaries-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",blue:"#5a9abf",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a=F.filter(r=>r.type==="regional_hq");Te>=a.length&&(Te=0);const n=a[Te]||null;let d="";a.length===0&&(d=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No subsidiaries established.<br>Use Create Subsidiary to expand.</div>`);let s=0;for(let r=0;r<a.length;r++){const o=a[r],c=r===Te,m=Number(o.purchase_price||0);s+=m;const p=Ae.find(u=>u.id===o.nation_id)?.name||o.city||"—";d+=`
        <div onclick="_mSubSelected=${r};renderManageSubsidiariesCard();" style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${c?t.accent:"transparent"};background:${c?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:40px;font-family:${e};font-size:9px;font-weight:700;color:${t.gold}">${(o.name||"").split("—")[0]?.trim().split(" ").map(u=>u[0]).join("").slice(0,4)||"SUB"}</span>
            <div style="flex:1.2;">
                <div style="font-size:10px;font-weight:600;color:${t.text};line-height:1.2">${o.name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${o.style||"Modern"}</div>
            </div>
            <span style="width:60px"><span style="font-family:${e};font-size:7px;padding:1px 4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${p.toUpperCase().slice(0,8)}</span></span>
            <span style="width:50px;font-family:${e};font-size:9px;font-weight:700;color:${t.gold};text-align:right">${b(m)}</span>
            <span style="width:35px;font-family:${e};font-size:9px;font-weight:700;color:${o.condition>=75?t.greenBright:o.condition>=50?t.yellow:t.orange};text-align:right">${o.condition}%</span>
        </div>`}let l="";if(n){const r=Ae.find(m=>m.id===n.nation_id)?.name||n.city||"—",o=n.condition>=75?t.greenBright:n.condition>=50?t.yellow:t.orange,c=[{label:"Valuation",value:b(n.purchase_price||0),color:t.gold},{label:"Maintenance/Mo",value:b(n.monthly_maintenance||0),color:t.red},{label:"Capacity",value:(n.capacity||0).toLocaleString(),color:t.text},{label:"Condition",value:n.condition+"%",color:o},{label:"Nation",value:r,color:t.accent},{label:"Style",value:n.style||"Modern",color:t.muted}];l=`
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
            </div>`}else l=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a subsidiary to manage.</div>`;i.innerHTML=`
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
                <div style="flex:1;overflow:auto;">${d}</div>
                <div style="padding:6px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;display:flex;">
                    <span style="width:40px"></span>
                    <span style="flex:1.2;font-family:${e};font-size:8px;color:${t.dim}">COMBINED</span>
                    <span style="width:60px"></span>
                    <span style="width:50px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${b(s)}</span>
                    <span style="width:35px"></span>
                </div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${l}
            </div>
        </div>
    </div>`}async function Cn(i){const e=F.find(a=>a.id===i);if(!e)return;const t=Math.round((e.purchase_price||0)*.6*(e.condition||50)/100);if(confirm('Dissolve subsidiary "'+e.name+`"?

Assets liquidated at 60% × condition: `+b(t)+`
All operations in this nation cease.

This cannot be undone.`))try{await w.from("corp_properties").update({is_active:!1}).eq("id",i);const a=Number(f?.corp_cash_reserves??0)+t;await w.from("factions").update({corp_cash_reserves:a}).eq("id",f.id),f.corp_cash_reserves=a;const n=document.getElementById("topbar-cash");n&&(n.textContent="CASH: "+(a>=1e6?"$"+(a/1e6).toFixed(1)+"M":"$"+Math.round(a/1e3)+"k")),Te=0,await ze(),Ne(),li(),Ve(),alert("Subsidiary dissolved. Received: "+b(t))}catch(a){alert("Failed: "+a.message)}}window.subDissolve=Cn;let Ae=[],te=null,dt=!1;async function Mn(){const{data:i}=await w.from("nations").select("*").order("name");Ae=(i||[]).filter(e=>e.id!==f?.nation_id)}function xt(i){const t=u=>Number(i[u]??50),a=t("standard_of_living"),n=t("cost_of_living"),d=t("corporate_tax"),s=t("minimum_wage"),l=t("urbanization"),r=t("union_strength"),o=t("corruption"),c=t("unemployment"),m=t("stability"),p=5e7*(1+(a-50)/100*.4)*(1+(n-50)/100*.3)*(1+(d-50)/100*.2)*(1+(s-50)/100*.15)*(1+(l-50)/100*.1)*(1+(r-50)/100*.1)*(1-(o-50)/100*.15)*(1-(c-50)/100*.1)*(1+(50-m)/100*.3);return Math.round(Math.max(1e7,p))}function Sn(i){te=te===i?null:i,Ve()}async function An(){if(dt||!te)return;const i=Ae.find(n=>n.id===te);if(!i)return;if(F.find(n=>n.nation_id===i.id&&n.type==="regional_hq")){alert("You already have a subsidiary in "+i.name);return}const t=xt(i),a=Number(f?.corp_cash_reserves??0);if(t>a){alert("Insufficient cash. Entry cost: "+b(t)+", available: "+b(a));return}if(confirm("Establish subsidiary in "+i.name+`?

Entry cost: `+b(t)+`
Creates a Regional HQ (500 capacity)
Unlocks `+i.name+` for operations

Deducted from cash reserves.`)){dt=!0;try{const d=(await w.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0,s=85+Math.floor(Math.random()*16),l=Math.round(t*.005),{error:r}=await w.from("corp_properties").insert({faction_id:f.id,nation_id:i.id,name:"Regional Headquarters — "+i.name,type:"regional_hq",style:"Modern",capacity:500,purchase_price:t,monthly_maintenance:l,condition:s,city:i.capital||i.name,purchased_at_tick:d,is_active:!0});if(r)throw r;const o=Math.max(0,a-t);await w.from("factions").update({corp_cash_reserves:o}).eq("id",f.id),f.corp_cash_reserves=o;const c=document.getElementById("topbar-cash");c&&(c.textContent="CASH: "+(o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k")),te=null,await ze(),Ne(),renderSubsidiariesCard(),Ve(),alert("Subsidiary established in "+i.name+`!

Cost: `+b(t)+`
Regional HQ created with `+s+"% condition.")}catch(n){alert("Failed: "+n.message)}finally{dt=!1}}}function Ve(){const i=document.getElementById("create-subsidiary-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",blue:"#5a9abf",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a=new Set(F.filter(r=>r.type==="regional_hq").map(r=>r.nation_id)),n=Ae.filter(r=>!a.has(r.id)),d=te?n.find(r=>r.id===te):null;let s="";for(const r of n){const o=r.id===te,c=xt(r),m=Number(r.standard_of_living??50),p=Number(r.stability??50),u=c>6e7?t.red:c>4e7?t.orange:t.greenBright;s+=`
        <div onclick="subSelectNation('${r.id}')" style="padding:6px 12px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${o?t.blue:"transparent"};background:${o?"rgba(90,154,191,0.03)":"transparent"};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:11px;font-weight:600;color:${t.text}">${r.name}</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${u}">${b(c)}</span>
            </div>
            <div style="display:flex;gap:8px;margin-top:2px;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">SoL <span style="color:${m>=50?t.greenBright:t.orange}">${Math.round(m)}</span></span>
                <span style="font-family:${e};font-size:7px;color:${t.dim}">STAB <span style="color:${p>=50?t.greenBright:t.red}">${Math.round(p)}</span></span>
                <span style="font-family:${e};font-size:7px;color:${t.dim}">GDP <span style="color:${t.muted}">${Math.round(Number(r.gdp_growth??50))}</span></span>
                <span style="font-family:${e};font-size:7px;color:${t.dim}">INFL <span style="color:${Number(r.inflation??50)<=50?t.greenBright:t.red}">${Math.round(Number(r.inflation??50))}</span></span>
            </div>
        </div>`}let l="";if(d){const r=xt(d),o=m=>Number(d[m]??50),c=[{label:"STD OF LIVING",val:o("standard_of_living"),weight:"×0.4",inc:!0},{label:"COST OF LIVING",val:o("cost_of_living"),weight:"×0.3",inc:!0},{label:"CORPORATE TAX",val:o("corporate_tax"),weight:"×0.2",inc:!0},{label:"MINIMUM WAGE",val:o("minimum_wage"),weight:"×0.15",inc:!0},{label:"URBANIZATION",val:o("urbanization"),weight:"×0.1",inc:!0},{label:"UNION STRENGTH",val:o("union_strength"),weight:"×0.1",inc:!0},{label:"CORRUPTION",val:o("corruption"),weight:"×0.15",inc:!1},{label:"UNEMPLOYMENT",val:o("unemployment"),weight:"×0.1",inc:!1},{label:"STABILITY",val:o("stability"),weight:"×0.3",inc:!1}];l=`<div style="padding:6px 12px;background:${t.card};border-bottom:1px solid ${t.border};">
            <div style="font-family:${e};font-size:8px;letter-spacing:1px;color:${t.dim};text-transform:uppercase;margin-bottom:4px">COST BREAKDOWN — ${d.name.toUpperCase()}</div>
            ${c.map(m=>{const p=m.inc?m.val-50:50-m.val,u=p>0?m.inc?t.red:t.greenBright:m.inc?t.greenBright:t.red;return`<div style="display:flex;justify-content:space-between;padding:1px 0;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">${m.label} (${m.weight})</span>
                    <span style="font-family:${e};font-size:8px;color:${u}">${m.val}/100 ${p>=0?"↑":"↓"} cost</span>
                </div>`}).join("")}
            <div style="display:flex;justify-content:space-between;padding:4px 0;margin-top:4px;border-top:1px solid ${t.border};">
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.text}">ENTRY COST</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.gold}">${b(r)}</span>
            </div>
            <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:2px;">Creates Regional HQ (500 capacity) · Unlocks ${d.name} for operations</div>
        </div>`}n.length===0&&(s=`<div style="padding:30px 20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Subsidiaries established in all available nations.</div>`),i.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.blue}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Create Subsidiary</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${n.length} MARKET${n.length!==1?"S":""}</span>
        </div>
        ${l}
        <div style="flex:1;overflow:auto;">
            ${s}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div onclick="subCreate()" style="width:100%;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${d?"#000":t.dim};background:${d?t.blue:"transparent"};border:1px solid ${d?t.blue:t.border};cursor:${d?"pointer":"default"};opacity:${d?1:.4}">ESTABLISH SUBSIDIARY</div>
        </div>
    </div>`}window.subSelectNation=Sn;window.subCreate=An;let Re=[],ce=0,Q="ALL",oe="REPUTATION";async function Ln(){const{data:i}=await w.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name");Re=(i||[]).map(e=>({...e,abbr:e.corp_ticker||e.abbreviation||e.faction_name?.slice(0,4).toUpperCase()||"???",status:(e.corp_company_type||"Private").toUpperCase(),isPlayer:!!e.linked_user_id,reputation:50,revenue:e.status==="PUBLIC"?Number(e.corp_cash_reserves||0)*.1:null,valuation:e.status==="PUBLIC"?Number(e.corp_cash_reserves||0)*3:null}))}function zn(i){ce=i,Ye()}function Nn(i){Q=i,ce=0,Ye()}function qn(i){oe=i,ce=0,Ye()}function Ye(){const i=document.getElementById("corporations-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a={PUBLIC:{color:t.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:t.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:t.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},n=[...new Set(Re.map(p=>p.nation).filter(Boolean))];let d=[...Re];Q!=="ALL"&&(d=d.filter(p=>p.nation===Q)),oe==="REPUTATION"?d.sort((p,u)=>(u.reputation||0)-(p.reputation||0)):oe==="REVENUE"?d.sort((p,u)=>(u.revenue||0)-(p.revenue||0)):oe==="VALUATION"&&d.sort((p,u)=>(u.valuation||0)-(p.valuation||0)),ce>=d.length&&(ce=0);const s=d[ce]||null,l=s&&s.status==="PRIVATE",r=s&&s.status==="STATE";let o="";d.length===0&&(o=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No corporations found.</div>`);for(let p=0;p<d.length;p++){const u=d[p],v=p===ce,y=a[u.status]||a.PRIVATE,h=u.status==="PRIVATE";o+=`
        <div onclick="corpSelect(${p})" style="display:flex;align-items:center;padding:6px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${v?t.accent:"transparent"};background:${v?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:36px;font-family:${e};font-size:9px;font-weight:700;color:${t.gold}">${u.abbr}</span>
            <div style="flex:1.3;">
                <div style="font-size:10px;font-weight:600;color:${t.text};line-height:1.2">${u.faction_name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${u.corp_subsector||u.corp_sector||"—"}</div>
            </div>
            <span style="width:55px"><span style="font-family:${e};font-size:7px;padding:1px 4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(u.nation||"—").toUpperCase().slice(0,6)}</span></span>
            <span style="width:50px;font-family:${e};font-size:8px;font-weight:700;color:${h?t.dim:t.muted};text-align:right">${h?"—":b(u.revenue)}</span>
            <span style="width:30px;font-family:${e};font-size:9px;font-weight:700;color:${u.reputation>=70?t.greenBright:u.reputation>=40?t.accent:t.yellow};text-align:right">${u.reputation}</span>
            <span style="width:50px;font-family:${e};font-size:8px;color:${h?t.dim:t.muted};text-align:right">${h?"—":b(u.valuation)}</span>
            <span style="width:42px;text-align:center"><span style="font-family:${e};font-size:6px;font-weight:700;padding:1px 4px;color:${y.color};background:${y.bg};border:1px solid ${y.border}">${u.status}</span></span>
        </div>`}let c="";if(s){const p=a[s.status]||a.PRIVATE,u=[{label:"Sector",value:s.corp_sector||"—",color:t.text},{label:"Subsector",value:s.corp_subsector||"—",color:t.accent},{label:"Reputation",value:s.reputation+"/100",color:s.reputation>=70?t.greenBright:s.reputation>=40?t.accent:t.yellow},{label:"Revenue",value:l?"UNDISCLOSED":b(s.revenue),color:l?t.dim:t.greenBright},{label:"Cash Reserves",value:l?"UNDISCLOSED":b(s.corp_cash_reserves||0),color:l?t.dim:t.text},{label:"Market Valuation",value:l?"UNDISCLOSED":b(s.valuation),color:l?t.dim:t.gold}];c=`
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
        ${u.map(v=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:9px;color:${t.dim};text-transform:uppercase">${v.label}</span>
            <span style="font-family:${e};font-size:${v.label==="Market Valuation"?12:10}px;font-weight:700;color:${v.color};${v.value==="UNDISCLOSED"?"font-style:italic;":""}">${v.value}</span>
        </div>`).join("")}
        <div style="padding:6px 14px;border-bottom:1px solid ${t.border};flex-shrink:0;">
            <div style="width:100%;height:4px;background:${t.border}"><div style="width:${s.reputation}%;height:100%;background:${s.reputation>=70?t.greenBright:s.reputation>=40?t.accent:t.yellow}"></div></div>
        </div>
        ${l?`<div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:rgba(200,168,50,0.03);">
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
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${l?"pointer":"default"};font-family:${e};font-size:8px;font-weight:700;color:${l?t.blue:t.dim};border:1px solid ${l?t.blue+"44":t.border};opacity:${l?1:.3}">INVESTIGATE — $500k</div>
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
            <span onclick="corpFilterNation('ALL')" style="padding:2px 7px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${Q==="ALL"?"#000":t.dim};background:${Q==="ALL"?t.accent:"transparent"};border:1px solid ${Q==="ALL"?t.accent:t.border}">ALL</span>
            ${n.map(p=>`<span onclick="corpFilterNation('${p}')" style="padding:2px 7px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${Q===p?"#000":t.dim};background:${Q===p?t.accent:"transparent"};border:1px solid ${Q===p?t.accent:t.border}">${p}</span>`).join("")}
        </div>
        <div style="flex:1"></div>
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">SORT</span>
            ${["REPUTATION","REVENUE","VALUATION"].map(p=>`<span onclick="corpSort('${p}')" style="padding:2px 7px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${oe===p?"#000":t.dim};background:${oe===p?t.accent:"transparent"};border:1px solid ${oe===p?t.accent:t.border}">${p}</span>`).join("")}
        </div>
    </div>`;i.innerHTML=`
    <div style="width:760px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Corporations</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${Re.length} IN DATABASE</span>
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
    </div>`}window.corpSelect=zn;window.corpFilterNation=Nn;window.corpSort=qn;let _e=null,Le={},se=120,Ce=15;function Bn(){if(!he)return;_e=he,Le={};const i=_e.required_materials||{};for(const t of Object.keys(i))Le[t]="STD";const e=_e.required_workforce||{};se=Number(e.general||0)+Number(e.skilled||0)||120,Ce=15,_t(),Qe()}function di(){document.getElementById("bid-assembly-overlay")?.remove(),_e=null}function Rn(i,e){Le[i]=e,Qe()}function On(i){se=i,Qe()}function Pn(i){Ce=i,Qe()}function Qe(){if(document.getElementById("bid-assembly-overlay")?.remove(),!_e)return;const i="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=_e,a=t.issuer_type==="GOVERNMENT",n=_?.name||f?.nation||"—",d=Number(t.budget_ceiling||0),s=Number(t.timeline_ticks||8),l=t.required_materials||{},r=Object.keys(l),o={LOW:.6,STD:1,HIGH:1.7},c={LOW:e.orange,STD:e.yellow,HIGH:e.greenBright},m={LOW:"Low",STD:"Standard",HIGH:"High"},p={concrete:250,steel:600,glass_facades:800,em_systems:900,lumber:120,heavy_parts:1200,aggregate:55,asphalt:180};let u=0,v="";for(const q of r){const we=Number(l[q]||0),Mt=Le[q]||"STD",pi=p[q]||300,mi=o[Mt],fi=Math.round(pi*mi),St=we*fi;u+=St;const ui=q.replace(/_/g," ").replace(/\b\w/g,ge=>ge.toUpperCase());v+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};">
            <div style="flex:1.2"><span style="font-size:11px;color:${e.text}">${ui}</span></div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${i};font-size:9px;color:${e.muted}">${we.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(ge=>{const Je=Mt===ge,At=c[ge];return`<span onclick="bidSetGrade('${q}','${ge}')" style="padding:2px 6px;font-family:${i};font-size:7px;font-weight:700;cursor:pointer;color:${Je?"#000":e.dim};background:${Je?At:"transparent"};border:1px solid ${Je?At:e.border}">${m[ge]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${i};font-size:10px;color:${e.text}">${b(St)}</span></div>
        </div>`}const y=15200,h=se*y*s,$=4e5,k=u+h+$,A=Math.round(k*(Ce/100)),x=k+A,T=x>d,E=A,S=T?0:Math.max(0,Math.min(100,Math.round(100-x/d*100+30))),C=S>70?e.greenBright:S>40?e.yellow:S>0?e.orange:e.red,M=T?"OVER CEILING":S>70?"STRONG":S>40?"COMPETITIVE":S>20?"WEAK":"UNLIKELY",O=Object.values(Le),B=O.length>0?Math.round(O.reduce((q,we)=>q+(we==="HIGH"?85:we==="STD"?65:45),0)/O.length):50,U=B>=75?e.greenBright:B>=55?e.yellow:e.orange,Ke=B>=75?"STRONG":B>=55?"PROMISING":"UNCERTAIN",qe=t.required_workforce||{},ve=Number(qe.general||0)+Number(qe.skilled||0)||100,ci=[Math.max(40,Math.round(ve*.7)),Math.max(60,Math.round(ve*.85)),ve,Math.round(ve*1.15),Math.round(ve*1.3)],ye=document.createElement("div");ye.id="bid-assembly-overlay",ye.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",ye.addEventListener("click",q=>{q.target===ye&&di()}),ye.innerHTML=`
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
                <span style="font-family:${i};font-size:9px;color:${e.muted}">Ceiling: <span style="color:${e.text};font-weight:700">${b(d)}</span></span>
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
                    <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${b(u)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Labor</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim};width:60px">WORKERS</span>
                        <div style="display:flex;gap:3px;">
                            ${ci.map(q=>`<span onclick="bidSetWorkers(${q})" style="padding:2px 8px;font-family:${i};font-size:8px;font-weight:700;cursor:pointer;color:${se===q?"#000":e.dim};background:${se===q?e.accent:"transparent"};border:1px solid ${se===q?e.accent:e.border}">${q}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">${se} × $${y.toLocaleString()}/tick × ${s} ticks</span>
                        <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${b(h)}</span>
                    </div>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${i};font-size:9px;color:${e.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${b($)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v:u},{l:"Labor",v:h},{l:"Overhead",v:$}].map(q=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-size:10px;color:${e.muted}">${q.l}</span>
                    <span style="font-family:${i};font-size:10px;color:${e.redDim}">${b(q.v)}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:rgba(204,85,85,0.03);">
                    <span style="font-family:${i};font-size:10px;font-weight:700;color:${e.text}">TOTAL EST. COST</span>
                    <span style="font-family:${i};font-size:13px;font-weight:700;color:${e.red}">${b(k)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.gold};text-transform:uppercase">Set Markup</span>
                </div>
                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="font-family:${i};font-size:9px;color:${e.dim}">MARKUP %</span>
                        <span style="font-family:${i};font-size:16px;font-weight:700;color:${e.gold}">${Ce}%</span>
                    </div>
                    <input type="range" min="0" max="40" step="1" value="${Ce}" oninput="bidSetMarkup(+this.value)" style="width:100%;accent-color:${e.gold};height:6px;" />
                    <div style="display:flex;justify-content:space-between;font-family:${i};font-size:7px;color:${e.dim};margin-top:2px;">
                        <span>0% (at cost)</span><span>40% (maximum)</span>
                    </div>
                </div>

                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${T?"rgba(204,85,85,0.04)":"rgba(200,168,50,0.03)"};">
                    <div style="font-family:${i};font-size:8px;color:${e.dim};margin-bottom:4px">YOUR BID PRICE</div>
                    <div style="font-family:${i};font-size:22px;font-weight:700;color:${T?e.red:e.gold}">${b(x)}</div>
                    ${T?`<div style="font-family:${i};font-size:8px;font-weight:700;color:${e.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${b(d)})</div>`:""}
                </div>

                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">PROJECTED PROFIT</span>
                        <span style="font-family:${i};font-size:14px;font-weight:700;color:${E>0?e.greenBright:e.dim}">+${b(E)}</span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Bid Assessment</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">COMPETITIVENESS</span>
                        <span style="font-family:${i};font-size:11px;font-weight:700;color:${C}">${M}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${S}%;height:100%;background:${C}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${i};font-size:11px;font-weight:700;color:${U}">${B}</span>
                            <span style="font-family:${i};font-size:8px;color:${e.dim}">/100</span>
                            <span style="font-family:${i};font-size:8px;font-weight:700;color:${U}">${Ke}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${B}%;height:100%;background:${U}"></div></div>
                    <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="flex:1"></div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">YOUR BID</div><div style="font-family:${i};font-size:14px;font-weight:700;color:${T?e.red:e.gold}">${b(x)}</div></div>
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">EST. PROFIT</div><div style="font-family:${i};font-size:14px;font-weight:700;color:${e.greenBright}">+${b(E)}</div></div>
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${i};font-size:14px;font-weight:700;color:${U}">${B}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${i};font-size:10px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="${T?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${i};font-size:10px;font-weight:700;letter-spacing:1px;color:${T?e.dim:"#000"};background:${T?e.border:e.gold};cursor:${T?"not-allowed":"pointer"};opacity:${T?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(ye)}function Dn(){alert("Phase 5: SUBMIT BID — coming in next phase.")}window.openBidAssembly=Bn;window.closeBidAssembly=di;window.bidSetGrade=Rn;window.bidSetWorkers=On;window.bidSetMarkup=Pn;window.submitBidAssembly=Dn;window.switchToExpansion=ni;window.switchToOperations=ai;window.hfSetChange=yn;window.hfReset=gn;window.hfConfirm=xn;document.querySelector('[data-tab="operations"]')?.addEventListener("click",function(i){this.classList.contains("active")||(i.preventDefault(),ai(i))});mn();
