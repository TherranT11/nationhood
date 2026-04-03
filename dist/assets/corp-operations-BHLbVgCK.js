import{_ as I}from"./supabase-client-BXEzLDpS.js";import{e as m}from"./utils-C2W-HleY.js";import{i as pt}from"./messaging-5qyQ6ziq.js";import{c as mt,a as xe,E as oe,b as pe,d as We,e as ut,f as vt,h as Oe}from"./equipment-DsuDdEne.js";const je={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},V=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"manufacturing_output",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:50},{stat:"higher_education",min:40}]}},priceDrivers:["manufacturing_output","inflation","fuel_prices","urbanization"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:10}]},STD:{requirements:[{stat:"manufacturing_output",min:35},{stat:"rare_minerals",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:40},{stat:"higher_education",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","inflation","fuel_prices"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"arable_land",min:10}]},STD:{requirements:[{stat:"arable_land",min:30},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"arable_land",min:50},{stat:"manufacturing_output",min:30}]}},priceDrivers:["arable_land","physical_infrastructure","inflation"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"rare_minerals",min:15},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"rare_minerals",min:35},{stat:"manufacturing_output",min:25}]}},priceDrivers:["rare_minerals","physical_infrastructure","inflation"]},{key:"em",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:15}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"digital_infrastructure",min:25}]},HIGH:{requirements:[{stat:"manufacturing_output",min:55},{stat:"digital_infrastructure",min:50},{stat:"energy_generation",min:40}]}},priceDrivers:["manufacturing_output","digital_infrastructure","inflation","energy_generation"]},{key:"glass",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:20}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"digital_infrastructure",min:40},{stat:"higher_education",min:50}]}},priceDrivers:["manufacturing_output","standard_of_living","inflation"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"oil_and_gas",min:10}]},STD:{requirements:[{stat:"oil_and_gas",min:30},{stat:"manufacturing_output",min:25}]},HIGH:{requirements:[{stat:"oil_and_gas",min:45},{stat:"manufacturing_output",min:40},{stat:"physical_infrastructure",min:40}]}},priceDrivers:["oil_and_gas","manufacturing_output","inflation","fuel_prices"]},{key:"heavy",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:40},{stat:"rare_minerals",min:30}]},STD:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:45},{stat:"higher_education",min:40}]},HIGH:{requirements:[{stat:"manufacturing_output",min:75},{stat:"rare_minerals",min:60},{stat:"higher_education",min:55},{stat:"digital_infrastructure",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","higher_education","digital_infrastructure"]}];function X(e,t,a){const i=V.find(c=>c.key===e);if(!i)return{available:!1,failedStat:"unknown_material"};const s=i.tiers[t];if(!s)return{available:!1,failedStat:"unknown_tier"};for(const c of s.requirements){const r=Number(a?.[c.stat]??0);if(r<c.min)return{available:!1,failedStat:c.stat,failedMin:c.min,nationValue:r}}return{available:!0}}function Ae(e,t,a){const s={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em:{LOW:400,STD:700,HIGH:1200},glass:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy:{LOW:800,STD:1400,HIGH:2400}}[e]?.[t];if(!s)return 0;const c=V.find(o=>o.key===e);if(!c)return s;let r=1;for(const o of c.priceDrivers){const l=Number(a?.[o]??50);o==="inflation"||o==="fuel_prices"?r*=1+(l-50)/200:r*=1-(l-50)/250}return r=Math.max(.4,Math.min(2.5,r)),Math.round(s*r)}function Ve(e,t,a){const s={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em:{LOW:1e3,STD:700,HIGH:300},glass:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy:{LOW:400,STD:200,HIGH:80}}[e]?.[t]||0,r=V.find(n=>n.key===e)?.priceDrivers?.[0],l=.3+(r?Number(a?.[r]??50):50)/50*.7;return Math.round(s*l)}const Se=["LOW","STD","HIGH"],ke={LOW:"Low",STD:"Standard",HIGH:"High"};let ie=[],v=null,T=null,S=null,se=[],re={},H=[],B={},Te=-1,P="concrete",D="STD",Z=500,U=[],Ie=0,O="trucks",W=0,j=1,Y=[],ee=null,ce=[],Ce=null,le=null,qe="ALL",Me="TIMELINE";function M(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function _t(e){if(e>=12){const t=Math.floor(e/12),a=e%12;return a>0?t+"y "+a+"mo":t+"y"}return e+" ticks"}function N(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(1)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(0)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function me(e){return e==="civil_engineering"?"CIVIL":e==="industrial"?"INDUSTRIAL":e==="mega_project"?"MEGA":e?.toUpperCase()||"—"}function Fe(e){return e==="civil_engineering"?"light":e==="industrial"?"heavy":e==="mega_project"?"mega":"light"}function ft(){le&&clearInterval(le),le=setInterval(()=>{if(!Ce)return;const e=Ce-Date.now();if(e<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(le);return}const t=Math.floor(e/36e5),a=Math.floor(e%36e5/6e4),i=Math.floor(e%6e4/1e3);document.getElementById("tick-countdown").textContent=t+"h "+a+"m "+i+"s"},1e3)}function yt(){document.body.classList.toggle("light-mode");const e=document.getElementById("theme-toggle");e.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function gt(e,t){e==="type"&&(qe=t),e==="sort"&&(Me=t),document.querySelectorAll(`.filter-pill[data-filter="${e}"]`).forEach(a=>{a.classList.toggle("active",a.dataset.value===t)}),Qe()}function ze(e){return!(!v||e.sector==="mega_project"&&v.corp_subsector!=="Megaprojects"||e.sector==="industrial"&&!["Heavy Infrastructure","Megaprojects"].includes(v.corp_subsector))}function Qe(){const e=document.getElementById("oc-list");let t=[...se];if(qe==="GOVERNMENT"?t=t.filter(s=>s.issuer_type==="GOVERNMENT"):qe==="PRIVATE"&&(t=t.filter(s=>s.issuer_type==="PRIVATE")),Me==="TIMELINE"&&t.sort((s,c)=>(s.timeline_ticks||0)-(c.timeline_ticks||0)),Me==="BUDGET"&&t.sort((s,c)=>(c.budget_ceiling||0)-(s.budget_ceiling||0)),document.getElementById("oc-count").textContent=t.length+" AVAILABLE",t.length===0){e.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const a=S?.current_tick||0;let i="";for(const s of t){const c=s.issuer_type==="GOVERNMENT",r=c?"gov":"private",o=ze(s),l=o?"":" locked",n=Fe(s.sector),d=me(s.sector),p=(s.timeline_ticks||0)>18?" warn":"",u=s.bidding_ends_tick?Math.max(0,s.bidding_ends_tick-a):"?";i+=`
            <div class="oc-item${l}" data-contract-id="${s.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${m(s.name)}</span>
                    <span class="oc-item__type-badge ${r}">${c?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${r}">${m(s.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${u} tick${u!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${N(s.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${p}">${_t(s.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${n}">${d}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${re[s.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${N(re[s.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${o?"yes":"no"}">${o?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${o?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openBidModal(contracts.find(x=>x.id==='${s.id}'))">${re[s.id]?"EDIT":"VIEW"}</button>`:""}
                </div>
                ${s.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${m(s.description)}</div>`:""}
            </div>`}e.innerHTML=i,e.querySelectorAll(".oc-item:not(.locked)").forEach(s=>{s.addEventListener("click",()=>{const c=s.dataset.contractId,r=se.find(o=>o.id===c);r&&Ye(r)})})}let de=null;function Ye(e){de=e;const t=document.getElementById("cd-overlay"),a=e.contract_type==="GOVERNMENT",i=a?"gov":"private",s=(T?.name||v.nation||"—").toUpperCase(),c=ze(e);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${m(s)}</span>
        <span class="cd-header__name">${m(e.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${i}">${m(e.issuer_name)}</span>
        <span class="cd-header__type-badge ${i}">${a?"GOV":"PRIVATE"}</span>
    `;const r=document.getElementById("cd-blueprint");e.blueprint_svg?(r.innerHTML=e.blueprint_svg,r.style.display=""):(r.innerHTML=Bt(e),r.style.display="");const o=e.permits_required||[],l=e.equipment_required||[],n=e.materials_estimated||[];let d="var(--teal)";e.spec_category==="Heavy Infrastructure"&&(d="var(--orange)"),e.spec_category==="Megaproject"&&(d="var(--red)");let p=M(e.budget),u=e.timeline_months+" Months",_="";_+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${m(e.contract_number)}</span>
            </div>
            <div class="cd-issue__tags">
                ${e.project_type?`<span class="cd-tag teal">${m(e.project_type.toUpperCase())}</span>`:""}
                ${e.project_subtype?`<span class="cd-tag gold">${m(e.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,e.description&&(_+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${m(e.description)}</div>
            </div>`),_+='<div class="cd-details">',e.project_type&&(_+=Q("Type",e.project_type)),e.project_subtype&&(_+=Q("Sub-Type",e.project_subtype)),_+=Q("Specialization",e.spec_category,d),_+=Q("Total Budget",p,"var(--green)"),_+=Q("Timeline",u),_+=Q("Nation",T?.name||v.nation||"—"),e.region&&(_+=Q("Region",e.region)),_+="</div>",o.length>0&&(_+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${o.map(b=>{const E=b.status==="approved"?"approved":"required",C=b.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${E}">
                            <span class="cd-chip__icon">${C}</span>
                            <span class="cd-chip__label">${m(b.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),l.length>0&&(_+=`
            <div class="cd-items">
                <div class="cd-section-label">Required Equipment</div>
                <div class="cd-items__list">
                    ${l.map(b=>{const E=b.owned?"owned":"missing",C=b.owned?"&#10003;":"&#10007;";return`<div class="cd-chip ${E}">
                            <span class="cd-chip__icon">${C}</span>
                            <span class="cd-chip__label">${m(b.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),n.length>0&&(_+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${n.map(b=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${m(b.name)}</span>
                        <span class="cd-mat-row__qty">${m(String(b.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=_;const g=o.filter(b=>b.status==="approved").length,f=o.length-g,$=l.filter(b=>b.owned).length,h=l.length-$;let w="";l.length>0&&(h===0?w+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>':w+=`<span class="cd-footer__badge bad">${h} EQUIPMENT MISSING</span>`),o.length>0&&(f===0?w+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':w+=`<span class="cd-footer__badge warn">${f} PERMITS PENDING</span>`);const L=c,y=(v.action_points??0)>=2;document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${w}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            <button class="cd-btn primary" onclick="placeBid()" ${L&&y?"":"disabled"}
                title="${L?y?"Place a bid (2 AP)":"Need 2 AP to bid":"Not qualified for this contract"}">BID</button>
        </div>
    `,t.classList.add("open"),document.body.style.overflow="hidden"}function Je(e){e&&e.target&&e.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",de=null)}const bt=[{key:"concrete",name:"Concrete",unit:"units"},{key:"steel",name:"Steel",unit:"units"},{key:"lumber",name:"Lumber",unit:"units"},{key:"aggregate",name:"Aggregate",unit:"units"},{key:"em_systems",name:"E&M Systems",unit:"units"},{key:"glass_facades",name:"Glass & Facades",unit:"units"},{key:"asphalt",name:"Asphalt",unit:"units"},{key:"heavy_parts",name:"Heavy Machinery Parts",unit:"units"}],ht=[{key:"work_trucks",name:"Work Trucks",tier:1},{key:"excavators",name:"Excavators",tier:1},{key:"bulldozers",name:"Bulldozers",tier:1},{key:"concrete_mixers",name:"Concrete Mixers",tier:1},{key:"tower_cranes",name:"Tower Cranes",tier:2},{key:"heavy_haulers",name:"Heavy Haulers",tier:2},{key:"pile_drivers",name:"Pile Drivers",tier:2},{key:"asphalt_plants",name:"Asphalt Plants",tier:2}],Ke={LOW:.7,STANDARD:1,HIGH:1.4},Xe={LOW:35,STANDARD:65,HIGH:90},fe=15;let R=null;function $t(e){if(!e)return;const t=e.required_materials||{},a=e.required_equipment||[],i=e.required_workforce||{},s={concrete:18e4,steel:25e4,lumber:12e4,aggregate:8e4,em_systems:32e4,glass_facades:28e4,asphalt:14e4,heavy_parts:4e5},c=bt.filter(d=>t[d.key]>0).map(d=>({...d,qty:t[d.key],basePrice:s[d.key]||2e5,grade:d.key==="aggregate"?"LOW":"STANDARD",highDisabled:!1})),r=ht.filter(d=>a.includes(d.key)).map(d=>({...d,owned:(U||[]).some(p=>p.equipment_key===d.key&&p.quantity>0)})),o=(i.general||100)+(i.skilled||20),l=e.budget_ceiling||1e8,n=Math.round(l*.03);R={contract:e,budgetCeiling:l,materials:c,laborCount:o,laborRate:15200,estimatedTicks:e.timeline_ticks||8,equipment:r,permits:[],overhead:n,markupPct:15,competitors:[],playerRep:v?.standing||50,requiredWorkforce:i},document.getElementById("bid-title").textContent="BID ASSEMBLY",document.getElementById("bid-subtitle").textContent=(e.name||"Contract")+" — "+me(e.sector)+" — "+(e.issuer_name||"Government"),document.getElementById("bid-overlay").classList.add("open"),document.body.style.overflow="hidden",ue()}function Ze(e){e&&e.target!==document.getElementById("bid-overlay")||(document.getElementById("bid-overlay").classList.remove("open"),document.body.style.overflow="",R=null)}function A(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(2)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function wt(e,t){if(!R)return;const a=R.materials[e];t==="HIGH"&&a.highDisabled||(a.grade=t,ue())}function Et(e){R&&(R.laborCount=e,ue())}function xt(e){R&&(R.markupPct=Number(e),ue())}function ue(){if(!R)return;const e=R;let t=0;for(const k of e.materials)k.lineCost=Math.round(k.qty*k.basePrice*Ke[k.grade]),t+=k.lineCost;const a=Math.round(e.laborCount*e.laborRate*e.estimatedTicks),i=Math.round(e.equipment.filter(k=>k.owned).length*12e3*e.estimatedTicks);let s=0;const c=e.overhead,r=t+a+i+s+c,o=Math.round(r*e.markupPct/100),l=r+o,n=l>e.budgetCeiling,d=o,p=Math.round(e.materials.reduce((k,F)=>k+Xe[F.grade],0)/e.materials.length),u=p>=80?"STRONG":p>=60?"PROMISING":p>=40?"UNCERTAIN":"POOR",_=p>=80?"var(--green)":p>=60?"var(--teal)":p>=40?"var(--orange)":"var(--red)",g=e.budgetCeiling>0?l/e.budgetCeiling:1,f=Math.max(0,Math.min(100,Math.round((1-g)*150))),$=f>=70?"STRONG":f>=40?"COMPETITIVE":f>=15?"WEAK":"UNLIKELY",h=f>=70?"var(--green)":f>=40?"var(--teal)":f>=15?"var(--orange)":"var(--red)",w=Math.round(r*(1-fe/100)),L=Math.round(r*(1+fe/100));let y="";y+='<div class="bid-section"><div class="bid-section__title">Materials</div>',e.materials.forEach((k,F)=>{const z=ae=>{const ct=k.grade===ae,dt=ae==="HIGH"&&k.highDisabled;return`<button class="bid-grade-btn ${ct?ae==="LOW"?"active-low":ae==="HIGH"?"active-high":"active":""} ${dt?"disabled":""}" onclick="setBidGrade(${F},'${ae}')">${ae[0]}</button>`};y+=`<div class="bid-mat-row">
            <span class="bid-mat-row__name">${m(k.name)}</span>
            <span class="bid-mat-row__qty">×${k.qty}</span>
            <div class="bid-grade-btns">${z("LOW")}${z("STANDARD")}${z("HIGH")}</div>
            <span class="bid-mat-row__cost">${A(k.lineCost)}</span>
        </div>`}),y+=`<div class="bid-line-total"><span class="bid-line-total__label">MATERIALS TOTAL</span><span class="bid-line-total__value">${A(t)}</span></div></div>`;const b=(e.requiredWorkforce?.general||80)+(e.requiredWorkforce?.skilled||20),E=[Math.round(b*.8),b,Math.round(b*1.2),Math.round(b*1.4),Math.round(b*1.6)];y+='<div class="bid-section"><div class="bid-section__title">Labor</div>',y+='<div class="bid-labor-presets">',E.forEach(k=>{y+=`<button class="bid-labor-btn ${e.laborCount===k?"active":""}" onclick="setBidLabor(${k})">${k}</button>`}),y+="</div>";const C=e.requiredWorkforce||{};y+=`<div class="bid-labor-formula">Required: ${C.general||"?"} general + ${C.skilled||"?"} skilled<br>`,y+=`${e.laborCount} workers × ${A(e.laborRate)}/tick × ${e.estimatedTicks} ticks = <strong>${A(a)}</strong></div>`,y+=`<div class="bid-line-total"><span class="bid-line-total__label">LABOR TOTAL</span><span class="bid-line-total__value">${A(a)}</span></div></div>`,y+='<div class="bid-section"><div class="bid-section__title">Equipment</div>',e.equipment.forEach(k=>{const F=k.owned?"bid-equip-row__status--owned":"bid-equip-row__status--missing",z=k.owned?"✓ OWNED":"✗ NOT OWNED";y+=`<div class="bid-equip-row"><span class="bid-equip-row__name">${m(k.name)}</span><span class="bid-equip-row__status ${F}">${z}</span></div>`}),y+=`<div class="bid-line-total"><span class="bid-line-total__label">MAINTENANCE (${e.estimatedTicks}t)</span><span class="bid-line-total__value">${A(i)}</span></div></div>`,y+='<div class="bid-section"><div class="bid-section__title">Permits</div>',y+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);padding:8px 0;">No permits required yet.</div>',y+='<div class="bid-line-total"><span class="bid-line-total__label">PERMITS TOTAL</span><span class="bid-line-total__value">$0</span></div></div>',y+='<div class="bid-section"><div class="bid-section__title">Overhead &amp; Contingency</div>',y+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Site management, insurance, admin</div>',y+=`<div class="bid-line-total"><span class="bid-line-total__label">OVERHEAD</span><span class="bid-line-total__value">${A(c)}</span></div></div>`,document.getElementById("bid-left").innerHTML=y;let x="";x+='<div class="bid-section"><div class="bid-section__title">Cost Summary</div>',x+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Materials</span><span class="bid-summary-row__value">${A(t)}</span></div>`,x+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Labor</span><span class="bid-summary-row__value">${A(a)}</span></div>`,x+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Equipment Maint.</span><span class="bid-summary-row__value">${A(i)}</span></div>`,x+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Permits</span><span class="bid-summary-row__value">${A(s)}</span></div>`,x+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Overhead</span><span class="bid-summary-row__value">${A(c)}</span></div>`,x+=`<div class="bid-cost-total"><span class="bid-cost-total__label">ESTIMATED COST</span><span class="bid-cost-total__value">${A(r)}</span></div>`,x+=`<div class="bid-accuracy">⚠ Estimate accuracy: ±${fe}%<br>Actual cost range: ${A(w)} — ${A(L)}</div>`,x+="</div>",x+='<div class="bid-section"><div class="bid-section__title">Markup</div>',x+=`<div class="bid-slider-wrap">
        <div class="bid-slider-label"><span class="bid-slider-label__pct">${e.markupPct}%</span><span style="color:var(--text-dim)">${A(o)}</span></div>
        <input type="range" class="bid-slider" min="0" max="40" value="${e.markupPct}" oninput="setBidMarkup(this.value)">
    </div></div>`,x+=`<div class="bid-price-hero ${n?"bid-price-hero--over":""}">
        <div class="bid-price-hero__label">YOUR BID PRICE</div>
        <div class="bid-price-hero__value">${A(l)}</div>
        ${n?'<div class="bid-price-hero__warning">EXCEEDS BUDGET CEILING ('+A(e.budgetCeiling)+")</div>":""}
    </div>`,x+=`<div class="bid-profit"><span class="bid-profit__label">PROJECTED PROFIT</span><span class="bid-profit__value">+${A(d)}</span></div>`,x+=`<div class="bid-compete">
        <div style="display:flex;justify-content:space-between;"><span class="bid-compete__label" style="color:${h}">${$}</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Competitiveness</span></div>
        <div class="bid-compete__bar-wrap"><div class="bid-compete__bar" style="width:${f}%;background:${h}"></div></div>
    </div>`,x+=`<div class="bid-quality">
        <div style="display:flex;justify-content:space-between;"><span class="bid-quality__label" style="color:${_}">${u} (${p}/100)</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Quality Estimate</span></div>
        <div class="bid-quality__bar-wrap"><div class="bid-quality__bar" style="width:${p}%;background:${_}"></div></div>
    </div>`,x+='<div class="bid-section" style="margin-top:8px;"><div class="bid-section__title">Competing Bids</div>',e.competitors.forEach(k=>{x+=`<div class="bid-competitor"><span class="bid-competitor__name">${m(k.name)}</span><span class="bid-competitor__rep">Rep ${k.rep}</span></div>`}),x+=`<div class="bid-competitor" style="color:var(--gold);"><span class="bid-competitor__name">You</span><span class="bid-competitor__rep">Rep ${e.playerRep}</span></div>`,x+="</div>",document.getElementById("bid-right").innerHTML=x,document.getElementById("bid-footer-price").textContent=A(l),document.getElementById("bid-footer-price").style.color=n?"var(--red)":"var(--gold)",document.getElementById("bid-footer-profit").textContent="+"+A(d),document.getElementById("bid-footer-quality").textContent=p+"/100",document.getElementById("bid-footer-quality").style.color=_,document.getElementById("bid-submit-btn").disabled=n}window.openBidModal=$t;window.closeBidModal=Ze;window.setBidGrade=wt;window.setBidLabor=Et;window.setBidMarkup=xt;let ye=!1;async function kt(){if(!R||!v||ye)return;const e=R,t=e.contract;let a=0;const i={};for(const p of e.materials)a+=Math.round(p.qty*p.basePrice*Ke[p.grade]),i[p.key]=p.grade;const s=Math.round(e.laborCount*e.laborRate*e.estimatedTicks),c=Math.round(e.equipment.filter(p=>p.owned).length*12e3*e.estimatedTicks),r=a+s+c+e.overhead,o=Math.round(r*e.markupPct/100),l=r+o,n=Math.round(e.materials.reduce((p,u)=>p+Xe[u.grade],0)/(e.materials.length||1));if(l>e.budgetCeiling){alert("Bid exceeds budget ceiling. Lower your costs or markup.");return}const d=document.getElementById("bid-submit-btn");d.disabled=!0,d.textContent="SUBMITTING...",ye=!0;try{const{data:p}=await I.from("shard").select("current_tick").eq("name","Alpha Shard").single(),u=p?.current_tick||0,{data:_}=await I.from("contract_bids").select("id").eq("contract_id",t.id).eq("faction_id",v.id).maybeSingle();if(_){const{error:f}=await I.from("contract_bids").update({bid_price:l,material_grades:i,labor_count:e.laborCount,markup_pct:e.markupPct,estimated_cost:r,estimated_quality:n,submitted_at_tick:u}).eq("id",_.id);if(f)throw f}else{const{error:f}=await I.from("contract_bids").insert({contract_id:t.id,faction_id:v.id,bid_price:l,material_grades:i,labor_count:e.laborCount,markup_pct:e.markupPct,estimated_cost:r,estimated_quality:n,status:"pending",submitted_at_tick:u});if(f)throw f}Ze();const g=document.getElementById("oc-count");if(g){const f=g.textContent;g.textContent="✓ BID SUBMITTED",g.style.color="var(--green)",setTimeout(()=>{g.textContent=f,g.style.color=""},2e3)}await tt()}catch(p){console.error("Bid submission failed:",p),alert("Failed to submit bid: "+(p.message||"Unknown error")),d.disabled=!1,d.textContent="SUBMIT BID"}finally{ye=!1}}window.submitBid=kt;const J=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],Ne={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},He={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let q=null;function Tt(e){const t=H.find(C=>C.id===e);if(!t)return;const a=Array.isArray(t.contract_bids)?t.contract_bids[0]:t.contract_bids,i=S?.current_tick||0,s=t.awarded_at_tick||i,c=t.timeline_ticks||8,r=Math.max(0,i-s),o=Math.min(100,r/c*100);let l=Math.min(J.length-1,Math.floor(o/(100/J.length)));const n=Math.round(o%(100/J.length)/(100/J.length)*100),d=t.required_materials||{},p=a?.material_grades||{},u=Object.entries(d).map(([C,x])=>{const k=p[C]||"STANDARD",F=Math.round(x*(o/100)*(.6+Math.random()*.4));return{key:C,name:C.replace(/_/g," ").replace(/\b\w/g,z=>z.toUpperCase()),grade:k,allocated:x,used:Math.min(F,x)}}),g=(t.required_equipment||[]).map(C=>({key:C,name:C.replace(/_/g," ").replace(/\b\w/g,x=>x.toUpperCase()),qty:1+Math.floor(Math.random()*3),condition:55+Math.floor(Math.random()*40)})),f=t.budget_ceiling||0,$=a?.estimated_cost||0,h=Math.round($*Math.min(1,r/c)),w=a?.estimated_quality||65,L=w>=80?"STRONG":w>=60?"PROMISING":w>=40?"FAIR":"UNCERTAIN",y=t.required_workforce||{},b=(y.general||0)+(y.skilled||0),E=a?.labor_count||b;q={project:t,bid:a,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:i,awardedTick:s,totalTicks:c,ticksElapsed:r,phaseIdx:l,phaseProgress:n,materials:u,equipment:g,budget:f,estCost:$,spent:h,quality:w,qualityLabel:L,laborCount:E,wfNeeded:b,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",et(t.id).then(()=>te()),te()}function It(e){e&&e.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",q=null)}function Ct(e){q&&(q.tab=e,q.expandedEvent=-1,q.selectedResponse=null,te())}function qt(e){q&&(q.expandedEvent=q.expandedEvent===e?-1:e,q.selectedResponse=null,te())}function Mt(e){q&&(q.selectedResponse=q.selectedResponse===e?null:e,te())}function te(){if(!q)return;const e=q,t=e.project,a=t.issuer_type==="GOVERNMENT",i=me(t.sector),s=v?.nation||"Nation",c=e.awardedTick+e.totalTicks,r=Math.max(0,c-e.currentTick),o=e.currentTick>c,l=e.budget>0?Math.round(e.spent/e.budget*100):0,n=l>85?"var(--red)":l>60?"var(--amber)":"var(--teal)",d=e.budget-e.spent,p=e.events.filter($=>$.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
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
    `;let u='<div class="pm-phase__bar">';for(let $=0;$<J.length;$++){const h=$<e.phaseIdx,w=$===e.phaseIdx;u+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${h?"done":w?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${h?"done":w?"active":""}">${J[$]}</span>
        </div>`}u+="</div>",u+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${J[e.phaseIdx]} — ${e.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${o?"var(--red)":"var(--text-secondary)"}">Tick ${e.ticksElapsed} / ${e.totalTicks}${o?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=u;const _=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:p},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=_.map($=>`<button class="pm-tab${e.tab===$.id?" active":""}" onclick="pmSetTab('${$.id}')">
            ${$.label}${$.badge>0?`<span class="pm-tab__badge">${$.badge}</span>`:""}
        </button>`).join("");let g="";e.tab==="overview"?g=Lt(e,t,n,l,d,r,o):e.tab==="events"?g=At(e):e.tab==="materials"?g=St(e):e.tab==="equipment"&&(g=Pt(e)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${g}</div>`;let f="";p>0&&(f+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${p} EVENT${p>1?"S":""} REQUIRES RESPONSE</span>`),f+=`<span class="pm-ftr__badge" style="color:${e.quality>=70?"var(--green)":e.quality>=50?"var(--amber)":"var(--orange)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${e.quality}/100 — ${e.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${f}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function Lt(e,t,a,i,s,c,r){const o=ge(e.awardedTick+e.totalTicks);ge(e.awardedTick+e.totalTicks);const l=ge(e.awardedTick),n=[{label:"Budget",value:N(e.budget),sub:`${i}% spent`,color:a},{label:"Spent",value:N(e.spent),color:"var(--red)"},{label:"Remaining",value:N(s),color:"var(--green)"},{label:"Quality",value:`${e.quality}/100`,sub:e.qualityLabel,color:e.quality>=70?"var(--green)":e.quality>=50?"var(--amber)":"var(--red)"},{label:"Workforce",value:`${e.laborCount}/${e.wfNeeded}`,sub:`Bid: ${e.laborCount}`,color:e.laborCount<e.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${c} ticks`,sub:r?"OVERDUE":`Deadline: ${o}`,color:r?"var(--red)":"var(--text-bright)"}];let d="";d+=`<div style="padding:0 16px"><div class="pm-section">
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
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${r?"var(--red)":"var(--text-bright)"};font-weight:700">${o}</span></span>
        </div>
    </div></div>`;const p=[];if((t.sector==="civil_engineering"||t.sector==="industrial"||t.sector==="mega_project")&&(p.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),p.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),t.sector!=="civil_engineering"&&p.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),p.length>0){d+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const u of p)d+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${m(u.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;d+="</div></div>"}return d}function At(e){if(e.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let t="";for(let a=0;a<e.events.length;a++){const i=e.events[a],s=e.expandedEvent===a,c=i.status==="ACTIVE",r=Ne[i.type]||Ne.WEATHER,o=He[i.severity]||He.LOW;if(t+=`<div class="pm-evt ${c?"pm-evt--active":"pm-evt--resolved"}" style="${c?`border-left-color:${r.color}`:""}">`,t+=`<div class="pm-evt__header" onclick="pmToggleEvent(${a})" style="${s?`background:${r.bg}`:""}">`,t+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${r.color};background:${r.bg};border:1px solid ${r.border}">${i.type}</span>
            <span class="pm-evt__sev-badge" style="color:${o}">${i.severity}</span>
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
                    </div>`,t+=`<div class="pm-resp__detail">${m(n.detail)}</div>`,t+='<div class="pm-resp__costs">',n.cost&&(t+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${N(n.cost)}</span>`),n.qualityImpact&&n.qualityImpact!==0&&(t+=`<span class="pm-resp__cost" style="color:${n.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${n.qualityImpact>0?"+":""}${n.qualityImpact}</span>`),!n.cost&&(!n.qualityImpact||n.qualityImpact===0)&&(t+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),t+="</div>",d&&(t+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${u}" onclick="event.stopPropagation();confirmEventResponse('${i.id}','${n.key}')">CONFIRM</button>
                        </div>`),t+="</div>"}}!c&&i.resolution&&(t+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${m(i.resolution)}</div>
                </div>`),t+="</div>"}t+="</div></div>"}return t}function St(e){if(e.materials.length===0)return'<div class="pm-evt-empty">No materials allocated to this project.</div>';let t='<div class="pm-tab-header">Allocated Materials</div>';for(const a of e.materials){const i=a.allocated>0?Math.round(a.used/a.allocated*100):0,s=a.grade==="HIGH"?"high":a.grade==="LOW"?"low":"std",c=a.grade==="HIGH"?"var(--green)":a.grade==="LOW"?"var(--orange)":"var(--amber)";t+=`<div class="pm-mat">
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
        </div>`}return t}function Pt(e){if(e.equipment.length===0)return'<div class="pm-evt-empty">No equipment deployed to this project.</div>';let t='<div class="pm-tab-header">Deployed Equipment</div>';for(const a of e.equipment){const i=a.condition>=75?"var(--green)":a.condition>=50?"var(--amber)":a.condition>=25?"var(--orange)":"var(--red)",s=a.condition<60;t+=`<div class="pm-eq">
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
        </div>`}return t}function ge(e){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][e%12]}, ${2e3+Math.floor(e/12)}`}window.openProjectModal=Tt;window.closeProjectModal=It;window.pmSetTab=Ct;window.pmToggleEvent=qt;window.pmSelectResponse=Mt;async function et(e){if(!q)return;const{data:t,error:a}=await I.from("construction_events").select("*").eq("contract_id",e).order("fired_at_tick",{ascending:!1});a?(console.warn("Failed to load project events:",a.message),q.events=[]):q.events=(t||[]).map(i=>({id:i.id,type:i.type,severity:i.severity,tick:i.fired_at_tick,title:i.title,desc:i.description,impact:i.impact,status:i.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:i.resolution,responses:i.responses||[]})),te()}let be=!1;async function Dt(e,t){if(!(be||!q)){be=!0;try{const{data:a,error:i}=await I.rpc("resolve_construction_event",{p_event_id:e,p_response_key:t});if(i){console.error("Failed to resolve event:",i.message),alert("Failed to submit response: "+i.message);return}const s=typeof a=="string"?JSON.parse(a):a;if(s?.error){alert("Error: "+s.error);return}await et(q.project.id),await at(),s?.quality_applied&&s.quality_applied!==0&&(q.quality=Math.max(0,Math.min(100,q.quality+s.quality_applied)),q.qualityLabel=q.quality>=80?"STRONG":q.quality>=60?"PROMISING":q.quality>=40?"FAIR":"UNCERTAIN"),te()}finally{be=!1}}}window.confirmEventResponse=Dt;function Q(e,t,a){const i=a?` style="color:${a}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${m(e)}</span>
        <span class="cd-detail-row__value"${i}>${m(t)}</span>
    </div>`}function Bt(e){const t={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},a=e.drawing_number||e.contract_number+"-A1",i=S?.current_date||"",s=i?i.replace(/,\s*/," "):"",c=e.spec_category==="Heavy Infrastructure",r=e.spec_category==="Megaproject";let o=m(e.project_subtype||e.project_type||"STRUCTURE"),l=c?"80.0m":r?"200.0m":"60.0m",n=c?"40.0m":r?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${t.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(d,p)=>`<line x1="${p*20}" y1="0" x2="${p*20}" y2="200" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(d,p)=>`<line x1="0" y1="${p*20}" x2="680" y2="${p*20}" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${t.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${t.accent}" font-family="var(--font-mono)" font-weight="700">${o.toUpperCase()}</text>
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
    </svg>`}let he=!1;async function Rt(){if(he||!de||!v)return;if((v.action_points??0)<2){alert("You need at least 2 AP to place a bid.");return}he=!0;const e=document.querySelector(".cd-btn.primary");e&&(e.disabled=!0,e.textContent="...");try{const{data:t,error:a}=await I.rpc("deduct_ap",{p_faction_id:v.id,p_cost:2});if(a)throw a;if(t<0){const s=-t-1;v.action_points=s,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+s+" AP</span>",e&&(e.disabled=!1,e.textContent="BID"),alert("Insufficient AP. You have "+s+" AP, need 2.");return}const{error:i}=await I.from("corp_contract_bids").insert({contract_id:de.id,faction_id:v.id,nation_id:v.nation_id,ap_spent:2,created_at_tick:S?.current_tick||null});if(i)throw await I.rpc("deduct_ap",{p_faction_id:v.id,p_cost:-2}),v.action_points=t+2,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+(t+2)+" AP</span>",i;v.action_points=t,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+t+" AP</span>",e&&(e.textContent="BID PLACED")}catch(t){e&&(e.disabled=!1,e.textContent="BID"),t.code==="23505"?alert("You have already placed a bid on this contract."):alert("Failed to place bid: "+(t.message||"Unknown error"))}finally{he=!1}}async function tt(){if(!v||!v.nation_id)return;const{data:e,error:t}=await I.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(t?(console.warn("Failed to load contracts:",t.message),se=[]):se=e||[],re={},v&&se.length>0){const a=se.map(s=>s.id),{data:i}=await I.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",v.id).in("contract_id",a);for(const s of i||[])re[s.contract_id]=s}Qe()}function Ot(){const e=document.getElementById("ap-list"),t=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=H.length+" ACTIVE",H.length===0){e.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,t.style.display="none";return}const a=S?.current_tick||0;let i=0,s=0,c="";for(const r of H){const o=r.issuer_type==="GOVERNMENT",l=o?"gov":"private",n=Array.isArray(r.contract_bids)?r.contract_bids[0]:r.contract_bids,d=n?.bid_price||0,p=n?.estimated_cost||0,u=n?.estimated_quality||0,_=r.budget_ceiling||0,g=r.awarded_at_tick||a,f=g+(r.timeline_ticks||8),$=Math.max(0,f-a),h=Math.max(0,a-g),w=r.timeline_ticks||8,L=Math.min(100,Math.round(h/w*100)),y=a>f;Fe(r.sector);const b=me(r.sector);i+=_,s+=d,c+=`<div class="ap-item" onclick="openProjectModal('${r.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${m(r.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${m(r.issuer_name||"—")} · ${b}</div>
                </div>
                <span class="oc-item__type-badge ${l}">${o?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS</span>
                    <span class="ap-budget__values" style="color:${y?"var(--red)":"var(--teal)"}">
                        ${h}/${w} ticks ${y?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${L}%;background:${y?"var(--red)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${N(d)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${N(p)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${u>=70?"var(--green)":u>=40?"var(--teal)":"var(--orange)"}">${u}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${y?"var(--red)":"var(--text-bright)"}">${$} ticks</div>
                </div>
            </div>
        </div>`}e.innerHTML=c,t.style.display=H.length>0?"":"none",H.length>0&&(document.getElementById("ap-total-crew").textContent=H.length,document.getElementById("ap-total-budget").textContent=N(i),document.getElementById("ap-total-spent").textContent=N(s))}async function at(){if(!v)return;const{data:e,error:t}=await I.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",v.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",v.id).order("awarded_at_tick",{ascending:!0});t?(console.warn("Failed to load active projects:",t.message),H=[]):H=e||[],Ot()}const st=3e4;function it(){let e=0,t=0;for(const a of V)for(const i of Se){const s=B[a.key]?.[i];s&&(e+=s.qty,t+=s.value)}return{totalUnits:e,totalValue:t}}function Pe(){const e=document.getElementById("wh-list"),{totalUnits:t,totalValue:a}=it();document.getElementById("wh-count").textContent=t.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=M(a);const i=Math.round(t/st*100),s=document.getElementById("wh-capacity");s.textContent=i+"%",s.style.color=i>80?"var(--red)":i>50?"var(--orange)":"var(--green)";let c="";for(let r=0;r<V.length;r++){const o=V[r],l=Te===r,n=B[o.key]?.LOW||{qty:0,value:0},d=B[o.key]?.STD||{qty:0,value:0},p=B[o.key]?.HIGH||{qty:0,value:0},u=n.qty+d.qty+p.qty,_=n.value+d.value+p.value,g=u===0,f=X(o.key,"LOW",T),$=X(o.key,"STD",T),h=X(o.key,"HIGH",T),w=n.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",L=d.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",y=h.available?p.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(c+='<div class="wh-row">',c+=`<div class="wh-row__collapsed${l?" expanded":""}" onclick="toggleWhRow(${r})">
            <span class="wh-row__arrow">${l?"▾":"▸"}</span>
            <span class="wh-row__name${g?" empty":""}">${m(o.name)}</span>
            <div class="wh-row__dots">
                <div class="${w}"></div>
                <div class="${L}"></div>
                <div class="${y}"></div>
            </div>
            <span class="wh-row__qty${g?" empty":""}">${u>0?u.toLocaleString():"—"}</span>
            <span class="wh-row__val${g?" empty":""}">${_>0?M(_):"—"}</span>
        </div>`,l){c+='<div class="wh-expand">',c+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const b=[{key:"LOW",label:"Low",data:n,avail:f,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:d,avail:$,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:p,avail:h,color:"var(--green)",dotClass:"wh-dot--high"}];for(const E of b){const C=!E.avail.available,x=E.data.qty>0,k=x?"$"+Math.round(E.data.value/E.data.qty):"—";c+=`<div class="wh-grade${C?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${E.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${C?"var(--red)":E.color}">${E.label}</span>
                        ${C?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${x?"var(--text-bright)":"var(--text-dim)"}">${x?E.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${E.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${E.data.value>0?M(E.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${k}</span>
                </div>`}for(const E of b)!E.avail.available&&E.avail.failedStat&&(c+=`<div class="wh-lock">
                        <span class="wh-lock__text">${E.label.toUpperCase()} GRADE LOCKED — ${m(E.avail.failedStat)} &lt; ${E.avail.failedMin}</span>
                    </div>`);c+="</div>"}c+="</div>"}e.innerHTML=c}function Nt(e){Te=Te===e?-1:e,Pe()}async function Ht(){if(!v)return;const{data:e,error:t}=await I.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",v.id);if(B={},t)console.warn("Failed to load warehouse:",t.message);else if(e)for(const a of e)B[a.material_key]||(B[a.material_key]={}),B[a.material_key][a.quality_tier]={qty:a.quantity||0,value:Number(a.total_value)||0};Pe()}const Ut={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function nt(){const e=(T?.name||v?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+e;const t=Number(v?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=M(t);const{totalUnits:a}=it(),i=Math.round(a/st*100),s=document.getElementById("pr-wh-capacity");s.textContent=i+"%",s.style.color=i>80?"var(--red)":i>50?"var(--orange)":"var(--green)",rt(),De(),ve()}function rt(){const e=document.getElementById("pr-mat-grid");let t="";for(const a of V){const i=P===a.key,s=Se.every(r=>!X(a.key,r,T).available),c="pr-mat-btn"+(i?" active":"")+(s?" all-locked":"");t+=`<span class="${c}" onclick="setPrMat('${a.key}')">${m(a.name)}</span>`}e.innerHTML=t}function De(){const e=document.getElementById("pr-tier-bar");let t='<span class="pr-tier-label">GRADE</span>';for(const a of Se){const i=X(P,a,T),s=D===a,c=i.available?Ae(P,a,T):null,r=je[a],o=!i.available,l="pr-tier-btn"+(s?" active":"")+(o?" locked":"");t+=`<div class="${l}" onclick="${o?"":`setPrTier('${a}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${r};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${s?"var(--text-bright)":"var(--text-dim)"}">${ke[a]}</span>
            </div>
            ${c!==null?`<div class="pr-tier-btn__price" style="color:${s?"var(--text-bright)":"var(--text-muted)"}">$${c}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}e.innerHTML=t}function ve(){const e=document.getElementById("pr-content"),t=X(P,D,T),a=V.find(h=>h.key===P);if(!a)return;if(!t.available){e.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${m(a.name)} — ${ke[D]} grade
                    is not produced domestically in ${m(T?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${m(t.failedStat||"unknown")} &lt; ${t.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const i=Ae(P,D,T),s=Ve(P,D,T),c=i*Z,r=s>3e3?"LOW":s>1e3?"MODERATE":"HIGH",o=r==="LOW"?"var(--green)":r==="MODERATE"?"var(--amber)":"var(--red)",l=Number(T?.inflation??50),n=l>55?"up":l<45?"down":"flat",d=n==="up"?"&#9650;":n==="down"?"&#9660;":"&#8212;",p=n==="up"?"var(--red)":n==="down"?"var(--green)":"var(--text-dim)";let u="";u+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
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
    </div>`,u+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${m(T?.name||"—")})</div>`;for(const h of a.priceDrivers){const w=Number(T?.[h]??50),L=w>=50?"var(--green)":w>=30?"var(--amber)":w>=15?"var(--orange)":"var(--red)",y=Ut[h]||h;u+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${m(h)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${w}%;background:${L}"></div>
            </div>
            <span class="pr-driver-row__val">${w}</span>
            <span class="pr-driver-row__effect">${m(y)}</span>
        </div>`}u+="</div>";const g=(Number(v?.corp_cash_reserves)||0)>=c,f=Z>s,$=je[D];u+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${m(a.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${$};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${$}">${ke[D]}</span>
                </div>
                <span class="pr-order__mat-price">$${i}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(h=>`<span class="pr-qty-btn${Z===h?" active":""}" onclick="setPrQty(${h})">${h>=1e3?h/1e3+"k":h}</span>`).join("")}
                </div>
            </div>
            ${f?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${s.toLocaleString()} this tick</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${M(c)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${g&&!f?"":"disabled"}
                    title="${g?f?"Exceeds supply":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,e.innerHTML=u}function Gt(e){P=e,D="STD";for(const t of["STD","HIGH","LOW"])if(X(e,t,T).available){D=t;break}rt(),De(),ve()}function Wt(e){D=e,De(),ve()}function jt(e){Z=e,ve()}let $e=!1;async function Vt(){if($e||!v||!T)return;const e=Ae(P,D,T),t=Ve(P,D,T),a=e*Z,i=Number(v.corp_cash_reserves)||0;if(a>i){alert("Insufficient cash reserves.");return}if(Z>t){alert("Exceeds available supply this tick.");return}$e=!0;const s=document.querySelector(".pr-purchase-btn");s&&(s.disabled=!0,s.textContent="...");try{const c=i-a,{error:r}=await I.from("factions").update({corp_cash_reserves:c}).eq("id",v.id);if(r)throw r;const o=B[P]?.[D],l=(o?.qty||0)+Z,n=(o?.value||0)+a,{error:d}=await I.from("corp_warehouse").upsert({faction_id:v.id,nation_id:v.nation_id,material_key:P,quality_tier:D,quantity:l,total_value:n,last_purchased_tick:S?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(d){const{error:p}=await I.from("factions").update({corp_cash_reserves:i}).eq("id",v.id);throw p&&console.error("Cash refund failed after warehouse error:",p.message),d}v.corp_cash_reserves=c,B[P]||(B[P]={}),B[P][D]={qty:l,value:n},Pe(),nt(),s&&(s.textContent="PURCHASED",setTimeout(()=>{s.isConnected&&(s.disabled=!1,s.textContent="PURCHASE")},1500))}catch(c){s&&(s.disabled=!1,s.textContent="PURCHASE"),alert("Purchase failed: "+(c.message||"Unknown error"))}finally{$e=!1}}function ot(e){const t=ee||T;if(!t)return[];const a=pe(e);if(!a)return[];const i=ut(e,t),s=[],c=Number(t?.inflation??50),r=Number(t?.fuel_prices??50);Number(t?.manufacturing_output??50);const o=ee&&T&&ee.id!==T.id;let l=null;if(o&&(l=vt(t,T)),i.newAvailable>0){const n=Oe(e,t),d=a.basePrice,p=Math.round(d*((c-50)/200)),u=Math.round(d*((r-50)/300));let _=n;const g=[{label:"Base price",value:M(d)},p!==0?{label:`Inflation (${c})`,mod:(p>=0?"+":"")+M(Math.abs(p))}:null,u!==0?{label:`Fuel transport (${r})`,mod:(u>=0?"+":"")+M(Math.abs(u))}:null].filter(Boolean),f=n-d-p-u;if(f!==0&&!o&&g.push({label:"Demand/scarcity",mod:(f>=0?"+":"")+M(Math.abs(f))}),o&&l){const $=Math.round(n*l.tariff),h=Math.round(n*l.transport);_=n+$+h,g.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+M($)}),g.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+M(h)})}s.push({seller:o?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:o?l?.deliveryTicks||1:0,condition:100,price:Math.round(_),available:i.newAvailable,delivery:o?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:o?l.deliveryTicks:0,used:!1,priceFactors:g,sourceNationId:t.id})}if(i.usedAvailable>0){const n=i.usedCondition,d=Oe(e,t,{used:!0,condition:n});let p=d;const u=[{label:"Base price",value:M(a.basePrice)},{label:`Condition (${n}%)`,mod:"-"+M(Math.max(0,a.basePrice-d))}];if(o&&l){const _=Math.round(d*l.tariff),g=Math.round(d*l.transport);p=d+_+g,u.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+M(_)}),u.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+M(g)})}s.push({seller:o?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:o?l?.deliveryTicks||1:0,condition:n,price:Math.round(p),available:i.usedAvailable,delivery:o?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:o?l.deliveryTicks:0,used:!0,priceFactors:u,sourceNationId:t.id})}return s}function _e(){const e=Number(v?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=M(e);const t=pe(O),a=oe[t?.tier||1],i=document.getElementById("em-tier-badge");i&&(i.textContent=a.tag,i.style.color=a.color),i.style.background=a.color+"0a",i.style.border="1px solid "+a.color+"33";const s=document.getElementById("em-nation-select");if(s&&s.options.length===0){const o=T?.name||v?.nation||"—";let l=`<option value="">${m(o)} (HQ)</option>`;for(const n of ce)n.id!==T?.id&&(l+=`<option value="${n.id}">${m(n.name)}</option>`);s.innerHTML=l}const c=document.getElementById("em-import-tag"),r=ee&&T&&ee.id!==T.id;c&&(c.style.display=r?"":"none"),Ft(),Be()}function Ft(){let e="";for(let t=1;t<=3;t++){const a=oe[t],i=xe(t),s=t===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";e+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${a.color}">${a.tag}</div>
            <div class="${s}">`;for(const c of i){const r=O===c.key,o=ot(c.key).length>0;e+=`<span class="em-selector__btn${r?" active":""}${o?"":" no-listings"}"
                style="${r?"background:"+a.color+";border-color:"+a.color:""}"
                onclick="setEmType('${c.key}')">${m(c.name)}</span>`}e+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${e}</div>`}function Be(){const e=document.getElementById("em-content");if(Y=ot(O),Y.length===0){e.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}W>=Y.length&&(W=0);let t="";for(let i=0;i<Y.length;i++){const s=Y[i],c=W===i,r=s.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",o=We(s.condition);t+=`<div class="em-listing${c?" selected":""}" style="${c?"border-left-color:"+r:""}" onclick="setEmListing(${i})">`,t+=`<div class="em-listing__row1">
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
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${M(s.price)}</div>
            </div>
        </div>`,c&&s.priceFactors&&(t+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${s.priceFactors.map(l=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${m(l.label)}</span>
                    <span class="em-breakdown__mod" style="color:${l.mod?l.mod.startsWith("-")?"var(--green)":l.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${l.mod||l.value}</span>
                </div>`).join("")}
            </div>`),t+="</div>"}const a=Y[W];if(a){const i=pe(O),s=oe[i?.tier||1],c=Math.min(a.available,4),r=a.price*j,o=(Number(v?.corp_cash_reserves)||0)>=r;t+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${m(i?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${m(a.seller)}</span>
                </div>
                <span class="em-purchase__price">${M(a.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:c},(l,n)=>n+1).map(l=>`<span class="em-qty-btn${j===l?" active":""}" style="${j===l?"background:"+s.color+";border-color:"+s.color:""}" onclick="setEmQty(${l})">${l}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${a.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${M(r)}</div>
                    ${a.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${m(a.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${s.color}" onclick="purchaseEquipment()"
                    ${o?"":"disabled"}
                    title="${o?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}e.innerHTML=t}async function zt(e){if(!e)ee=null;else{let a=ce.find(i=>i.id===e);if(!a)try{const{data:i}=await I.from("nations").select("*").eq("id",e).single();a=i}catch{}ee=a||null}W=0,j=1;const t=document.getElementById("em-nation-select");t&&(t.value=e||""),_e()}function Qt(e){O=e,W=0,j=1,_e()}function Yt(e){W=e,j=1,Be()}function Jt(e){j=e,Be()}let we=!1;async function Kt(){if(we)return;const e=Y[W];if(!e||!v)return;const t=pe(O);if(!t)return;const a=j,i=e.price*a,s=Number(v.corp_cash_reserves)||0;if(i>s){alert("Insufficient cash reserves.");return}if(a>e.available){alert("Not enough units available.");return}const c=document.querySelector(".em-purchase-btn");c&&(c.disabled=!0,c.textContent="..."),we=!0;try{const r=s-i,{error:o}=await I.from("factions").update({corp_cash_reserves:r}).eq("id",v.id);if(o)throw o;const l=!e.deliveryTicks||e.deliveryTicks===0;if(l){const d=U.find(L=>L.equipment_key===O),p=(d?.owned||0)+a,u=d?.purchase_price_avg||0,_=d?.owned||0,g=_>0?Math.round((u*_+e.price*a)/p):e.price,f=t.maintenancePerUnit*p,$=d?.condition||100,h=Math.round(($*_+e.condition*a)/p),{error:w}=await I.from("corp_equipment").upsert({faction_id:v.id,nation_id:v.nation_id,equipment_key:O,tier:t.tier,owned:p,deployed:d?.deployed||0,condition:h,maintenance_per_tick:f,purchase_price_avg:g,last_purchased_tick:S?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(w){const{error:L}=await I.from("factions").update({corp_cash_reserves:s}).eq("id",v.id);throw L&&console.error("Cash refund failed:",L.message),w}d?(d.owned=p,d.condition=h,d.maintenance_per_tick=f):U.push({equipment_key:O,tier:t.tier,owned:p,deployed:0,condition:h,maintenance_per_tick:f,assigned_projects:[]})}else{const d=(S?.current_tick||0)+e.deliveryTicks,{error:p}=await I.from("corp_equipment_deliveries").insert({faction_id:v.id,equipment_key:O,quantity:a,condition:e.condition,delivery_tick:d,source_nation_id:e.sourceNationId||null,seller_name:e.seller,price_paid:i});if(p){const{error:u}=await I.from("factions").update({corp_cash_reserves:s}).eq("id",v.id);throw u&&console.error("Cash refund failed:",u.message),p}}v.corp_cash_reserves=r,Re(),_e();const n=document.getElementById("pr-cash");n&&(n.textContent=M(r)),c&&(c.textContent=l?"PURCHASED":"ORDERED",setTimeout(()=>{c.isConnected&&(c.disabled=!1,c.textContent="PURCHASE")},1500))}catch(r){c&&(c.disabled=!1,c.textContent="PURCHASE"),alert("Purchase failed: "+(r.message||"Unknown error"))}finally{we=!1}}let Xt=-1,ne=[],Le=[],lt=[];function Ee(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function Zt(e,t,a){if(a)return"var(--orange)";const i=e/(t||1)*100;return i>50?"var(--green)":i>25?"var(--amber)":"var(--red)"}function ea(){const e=document.getElementById("pm-list"),t=ne.length,a=Le.length,i=lt.length,s=ne.filter(l=>l.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${t})`,document.getElementById("pm-pending-count").textContent=`(${a})`,document.getElementById("pm-apply-count").textContent=`(${i})`;const c=document.getElementById("pm-badges");let r="";s>0&&(r+=`<span class="pm-badge pm-badge--expiring">${s} EXPIRING</span>`),a>0&&(r+=`<span class="pm-badge pm-badge--pending">${a} PENDING</span>`),c.innerHTML=r;const o=ne.reduce((l,n)=>l+(n.cost||0),0)+Le.reduce((l,n)=>l+(n.cost||0),0);document.getElementById("pm-total-cost").textContent=Ee(o),document.getElementById("pm-footer-active").textContent=t,document.getElementById("pm-footer-pending").textContent=a;{if(t===0){e.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let l="";ne.forEach((n,d)=>{const p=Xt===d,u=Zt(n.ticks_left,n.total_ticks,n.expiring_soon),_=Math.min(n.ticks_left/(n.total_ticks||1)*100,100);l+=`<div class="pm-item ${n.expiring_soon?"pm-item--expiring":""} ${p?"expanded":""}" onclick="togglePmExpand(${d})">
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
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${_}%;background:${u}"></div></div>`,p&&(l+=`<div class="pm-detail">
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
                        <span class="pm-detail__val">${Ee(n.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${n.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${n.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(n.projects||[]).map(g=>`<span class="pm-project-chip">${m(g)}</span>`).join("")}</div>
                    </div>`,n.note&&(l+=`<div class="pm-note"><span class="pm-note__text">${m(n.note)}</span></div>`),n.expiring_soon&&n.renewable&&(l+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew">RENEW — ${Ee(n.cost||0)}</button></div>`),l+="</div>"),l+="</div></div>"}),e.innerHTML=l;return}}function ta(){ne=[],Le=[],lt=[],ea()}let K=[],aa=-1;function G(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function Ue(e){return e>=85?"var(--gold)":e>=60?"var(--green)":e>=40?"var(--orange)":"var(--red)"}function sa(e){return"dl-result--"+e.toLowerCase()}function Ge(){const e=document.getElementById("dl-list"),t=K.length;document.getElementById("dl-count").textContent=`${t} COMPLETED`;const a=K.reduce((o,l)=>{const n=l.financials||{};return o+((n.payment||0)+(n.bonus||0)-(n.penalty||0)-(n.total_cost||0))},0),i=document.getElementById("dl-lifetime-profit");i.textContent=(a>=0?"+":"")+G(a),i.style.color=a>=0?"var(--green)":"var(--red)";const s={};K.forEach(o=>{s[o.result]=(s[o.result]||0)+1});const c=document.getElementById("dl-footer-results");if(c.innerHTML=Object.entries(s).map(([o,l])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[o]||"var(--text-dim)"}">${m(o)}</div>
            <div class="dl-footer__result-count">${l}</div>
        </div>`).join(""),t===0){e.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let r="";K.forEach((o,l)=>{const n=aa===l,d=o.financials||{},p=(d.payment||0)+(d.bonus||0)-(d.penalty||0)-(d.total_cost||0),u=p>=0,_=sa(o.result),f={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[o.result]||"var(--text-dim)",$=o.type==="GOVERNMENT";if(r+=`<div class="dl-item ${n?"expanded":""}" onclick="toggleDlExpand(${l})">
            <div class="dl-item__inner" style="border-left:2px solid ${f}">
                <div class="dl-item__row1">
                    <span class="dl-item__name">${m(o.name)}</span>
                    <span class="dl-result-badge ${_}">${m(o.result)}</span>
                </div>
                <div class="dl-item__row2">
                    <span class="dl-item__id">${m(o.id)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                    <span class="dl-item__issuer" style="color:${$?"var(--green)":"var(--gold)"}">${m(o.issuer)}</span>
                    <span class="dl-item__date">${m(o.delivered)}</span>
                </div>
                <div class="dl-summary-bar">
                    <div class="dl-summary-cell" style="flex:1;">
                        <div class="dl-summary-label">QUALITY</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span class="dl-summary-value" style="color:${Ue(o.quality_score)}">${o.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${o.rep_change>0?"var(--green)":o.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${o.rep_change>0?"+":""}${o.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${u?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${u?"var(--green)":"var(--red)"};margin-top:2px;">${u?"+":""}${G(p)}</div>
                    </div>
                </div>`,n){const h=o.inspection||{};r+='<div style="margin-top:8px;">',r+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(b=>{const E=h[b]||{score:0,issues:[]},C=Ue(E.score),x=Math.min(E.score/100*100,100);r+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${m(b.charAt(0).toUpperCase()+b.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${x}%;background:${C}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${C}">${E.score}</span>
                        </div>
                    </div>
                    ${(E.issues||[]).map(k=>`<div class="dl-inspect-issue">${m(k)}</div>`).join("")}
                </div>`});const w=h.permits||{passed:!0,issues:[]};r+=`<div class="dl-permits-row ${w.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${w.passed?"var(--green)":"var(--red)"}">${w.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${(w.issues||[]).map(b=>`<div class="dl-inspect-issue dl-inspect-issue--red">${m(b)}</div>`).join("")}
            </div>`,r+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',r+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(o.materials_used||[]).forEach(b=>{const E=b.grade==="HIGH"?"var(--green)":b.grade==="STANDARD"?"var(--amber)":"var(--orange)",C=b.impact==="positive"?"▲":b.impact==="negative"?"▼":"–",x=b.impact==="positive"?"var(--green)":b.impact==="negative"?"var(--red)":"var(--text-dim)";r+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${m(b.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${E}"></div>
                    <span class="dl-mat-tag__grade" style="color:${E}">${m(b.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${x}">${C}</span>
                </div>`}),r+="</div>",r+='<div class="dl-section-label">Financial Summary</div>',r+='<div class="dl-fin-panel">',r+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${G(d.contract_value||0)}</span></div>`,(d.bonus||0)>0&&(r+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${G(d.bonus)}</span></div>`),(d.penalty||0)>0&&(r+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${G(d.penalty)}</span></div>`);const L=(d.payment||0)+(d.bonus||0)-(d.penalty||0);r+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${G(L)}</span></div>`,r+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${G(d.total_cost||0)}</span></div>`,r+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${u?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${u?"var(--green)":"var(--red)"}">${u?"+":""}${G(p)}</span>
            </div>`,r+="</div>";const y=o.timeline||{};r+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${y.actual||0}/${y.expected||0} ticks</span>`,y.early?r+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(y.expected||0)-(y.actual||0)} TICK${y.expected-y.actual!==1?"S":""} EARLY</span>`:!y.on_time&&y.actual>y.expected&&(r+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(y.actual||0)-(y.expected||0)} TICK${y.actual-y.expected!==1?"S":""} LATE</span>`),r+="</div>",r+="</div>"}r+="</div></div>"}),e.innerHTML=r}async function ia(){if(!v){K=[],Ge();return}const{data:e,error:t}=await I.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",v.id).order("delivered_at_tick",{ascending:!1}).limit(20);t?(console.warn("Failed to load deliveries:",t.message),K=[]):K=(e||[]).map(a=>{const i=a.construction_contracts||{};return{id:a.contract_id,name:i.name||"Project",type:i.issuer_type||"GOVERNMENT",issuer:i.issuer_name||"Government",delivered:"Tick "+(a.delivered_at_tick||0),result:a.result,quality_score:a.quality_score,rep_change:a.rep_change,financials:{contract_value:a.contract_value||0,bonus:a.quality_bonus||0,penalty:a.penalties||0,payment:a.payment_received||0,total_cost:a.total_cost||0},inspection:a.inspection||{},materials_used:a.materials_used||[],timeline:{expected:a.timeline_expected||0,actual:a.timeline_actual||0,on_time:a.on_time,early:a.timeline_actual<a.timeline_expected}}}),Ge()}function Re(){const e=U.reduce((o,l)=>o+(l.owned||0),0),t=U.reduce((o,l)=>o+(l.deployed||0),0),a=mt(U),i=e-t;document.getElementById("eq-count").textContent=e+" UNITS",document.getElementById("eq-summary").innerHTML=`
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
                ${M(a)}
            </div>
        </div>`;const s={};for(const o of U)s[o.equipment_key]=o;let c="";for(let o=1;o<=3;o++){const l=oe[o],n=xe(o),d=Ie===o,p=n.reduce((_,g)=>_+(s[g.key]?.owned||0),0),u=n.reduce((_,g)=>_+(s[g.key]?.deployed||0),0);if(c+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${o})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${d?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${l.color}">${m(l.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${l.color};border:1px solid ${l.color}33;background:${l.color}0a">${l.tag}</span>
            </div>
            ${p>0?`<span class="eq-tier-hdr__count">${u}/${p}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,d)for(const _ of n){const g=s[_.key],f=g?.owned||0,$=g?.deployed||0,h=g?.condition||0,w=_.maintenancePerUnit*f,L=f-$,y=f>0&&L===0,b=f>0&&h<65,E=We(h),C=g?.assigned_projects||[],x=C.length>0?C.map(k=>k.contract_name||"Project").join(", ").slice(0,30):f>0&&$>0?$+" project"+($>1?"s":""):"—";c+=`<div class="eq-row${f===0?" unowned":""}">`,c+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${f===0?" dim":""}">${m(_.name)}</span>
                        ${b?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${f>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${y?"var(--orange)":"var(--green)"}">${L}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${$}/${f}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,f>0?c+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${h}%;background:${E}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${E}">${h}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${m(x)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${M(w)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:c+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',c+="</div>"}}document.getElementById("eq-list").innerHTML=c;const r=[1,2,3].map(o=>{const l=oe[o],n=xe(o).reduce((d,p)=>d+(s[p.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${n>0?l.color+"33":"var(--border-0)"};background:${n>0?l.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${l.color}">${l.tag}</div>
            <div class="eq-footer__tier-count" style="color:${n>0?"var(--text-bright)":"var(--text-dim)"}">${n}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${M(a)}</div>
        </div>
        <div class="eq-footer__tiers">${r}</div>`}function na(e){Ie=Ie===e?-1:e,Re()}async function ra(){if(!v)return;const{data:e,error:t}=await I.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",v.id);t?(console.warn("Failed to load equipment:",t.message),U=[]):U=e||[],Re()}async function oa(){const{data:{user:e}}=await I.auth.getUser();if(!e){window.location.href="login.html";return}const{data:t}=await I.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);ie=(t||[]).filter(n=>n.nation_id);const a=sessionStorage.getItem("active_faction_id");if(v=ie.find(n=>n.id===a)||ie.find(n=>n.faction_type==="corporation")||ie[0],!v){await I.auth.signOut(),window.location.href="login.html";return}if(v.faction_type!=="corporation"){window.location.href="dashboard.html";return}const[i,s]=await Promise.all([v.nation_id?I.from("nations").select("*").eq("id",v.nation_id).single():Promise.resolve({data:null}),I.from("shard").select("current_tick, current_date, next_tick_at").eq("name","Alpha Shard").single()]);i.error&&console.warn("Nation load failed:",i.error.message),i.data&&(T=i.data),s.error&&console.warn("Shard load failed:",s.error.message),S=s.data;const c=v.corp_ticker||v.abbreviation||"";document.getElementById("corp-logo").textContent=c.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=v.faction_name||"Unnamed Corp",S&&(document.getElementById("game-date").textContent=S.current_date||"—",document.getElementById("tick-number").textContent=S.current_tick||"—",S.next_tick_at&&(Ce=new Date(S.next_tick_at),ft())),document.getElementById("corp-name-badge").textContent=(c?"["+c+"]":v.faction_name||"Corp")+" ▾";const r=document.getElementById("topbar-cash");if(r){const n=Number(v.corp_cash_reserves??0),d=n>=1e9?"$"+(n/1e9).toFixed(1)+"B":n>=1e6?"$"+(n/1e6).toFixed(1)+"M":"$"+Math.round(n/1e3)+"k";r.textContent="CASH: "+d}const o=v.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+o+" AP</span>",document.getElementById("nation-pill").textContent=(T?.name||v.nation||"—").toUpperCase();const l=document.getElementById("corp-faction-dropdown");if(l){let n="";for(const d of ie){const p=d.id===v.id,u=d.faction_type==="corporation"?"CORP":"PARTY",_=d.faction_type==="corporation"?"var(--teal)":"var(--amber)";n+=`<div class="corp-dd-item${p?" active":""}" onclick="switchToFaction('${d.id}', '${d.faction_type}')">
                <span class="corp-dd-type" style="color:${_}">${u}</span>
                <span class="corp-dd-name">${m(d.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${m(d.abbreviation||"—")}]</span>
            </div>`}l.innerHTML=n}await Promise.all([tt(),at(),Ht(),ra(),ta(),ia()]);try{const{data:n}=await I.from("nations").select("*").order("name");ce=n||[]}catch{ce=[]}nt(),_e(),pt(v,T,S),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}async function la(){await I.auth.signOut(),window.location.href="login.html"}function ca(){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.toggle("open")}function da(e,t){const a=document.getElementById("corp-faction-dropdown");a&&a.classList.remove("open"),sessionStorage.setItem("active_faction_id",e),t==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",e=>{const t=document.getElementById("faction-switcher"),a=document.getElementById("corp-faction-dropdown");a&&t&&!t.contains(e.target)&&a.classList.remove("open")});document.addEventListener("keydown",e=>{e.key==="Escape"&&Je()});window.doLogout=la;window.toggleTheme=yt;window.toggleCorpDropdown=ca;window.switchToFaction=da;window.setFilter=gt;window.openContractDetail=Ye;window.closeContractDetail=Je;window.placeBid=Rt;window.toggleWhRow=Nt;window.toggleEqTier=na;window.switchEmNation=zt;window.setEmType=Qt;window.setEmListing=Yt;window.setEmQty=Jt;window.purchaseEquipment=Kt;window.setPrMat=Gt;window.setPrTier=Wt;window.setPrQty=jt;window.purchaseMaterial=Vt;oa();
