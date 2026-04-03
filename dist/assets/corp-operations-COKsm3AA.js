import{_ as w}from"./supabase-client-BXEzLDpS.js";import{e as f}from"./utils-C2W-HleY.js";import{i as Ot}from"./messaging-5qyQ6ziq.js";import{c as Rt,a as ze,E as ve,b as $e,d as ct,e as Dt,f as zt,h as nt}from"./equipment-DsuDdEne.js";const dt={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},X=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"manufacturing_output",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:50},{stat:"higher_education",min:40}]}},priceDrivers:["manufacturing_output","inflation","fuel_prices","urbanization"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:10}]},STD:{requirements:[{stat:"manufacturing_output",min:35},{stat:"rare_minerals",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:40},{stat:"higher_education",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","inflation","fuel_prices"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"arable_land",min:10}]},STD:{requirements:[{stat:"arable_land",min:30},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"arable_land",min:50},{stat:"manufacturing_output",min:30}]}},priceDrivers:["arable_land","physical_infrastructure","inflation"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"rare_minerals",min:15},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"rare_minerals",min:35},{stat:"manufacturing_output",min:25}]}},priceDrivers:["rare_minerals","physical_infrastructure","inflation"]},{key:"em",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:15}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"digital_infrastructure",min:25}]},HIGH:{requirements:[{stat:"manufacturing_output",min:55},{stat:"digital_infrastructure",min:50},{stat:"energy_generation",min:40}]}},priceDrivers:["manufacturing_output","digital_infrastructure","inflation","energy_generation"]},{key:"glass",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:20}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"digital_infrastructure",min:40},{stat:"higher_education",min:50}]}},priceDrivers:["manufacturing_output","standard_of_living","inflation"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"oil_and_gas",min:10}]},STD:{requirements:[{stat:"oil_and_gas",min:30},{stat:"manufacturing_output",min:25}]},HIGH:{requirements:[{stat:"oil_and_gas",min:45},{stat:"manufacturing_output",min:40},{stat:"physical_infrastructure",min:40}]}},priceDrivers:["oil_and_gas","manufacturing_output","inflation","fuel_prices"]},{key:"heavy",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:40},{stat:"rare_minerals",min:30}]},STD:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:45},{stat:"higher_education",min:40}]},HIGH:{requirements:[{stat:"manufacturing_output",min:75},{stat:"rare_minerals",min:60},{stat:"higher_education",min:55},{stat:"digital_infrastructure",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","higher_education","digital_infrastructure"]}];function ne(e,t,i){const n=X.find(l=>l.key===e);if(!n)return{available:!1,failedStat:"unknown_material"};const a=n.tiers[t];if(!a)return{available:!1,failedStat:"unknown_tier"};for(const l of a.requirements){const r=Number(i?.[l.stat]??0);if(r<l.min)return{available:!1,failedStat:l.stat,failedMin:l.min,nationValue:r}}return{available:!0}}function Ye(e,t,i){const a={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em:{LOW:400,STD:700,HIGH:1200},glass:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy:{LOW:800,STD:1400,HIGH:2400}}[e]?.[t];if(!a)return 0;const l=X.find(s=>s.key===e);if(!l)return a;let r=1;for(const s of l.priceDrivers){const c=Number(i?.[s]??50);s==="inflation"||s==="fuel_prices"?r*=1+(c-50)/200:r*=1-(c-50)/250}return r=Math.max(.4,Math.min(2.5,r)),Math.round(a*r)}function pt(e,t,i){const a={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em:{LOW:1e3,STD:700,HIGH:300},glass:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy:{LOW:400,STD:200,HIGH:80}}[e]?.[t]||0,r=X.find(o=>o.key===e)?.priceDrivers?.[0],c=.3+(r?Number(i?.[r]??50):50)/50*.7;return Math.round(a*c)}const Qe=["LOW","STD","HIGH"],He={LOW:"Low",STD:"Standard",HIGH:"High"};let me=[],m=null,x=null,B=null,ce=[],fe={},W=[],R={},je=-1,P="concrete",O="STD",se=500,V=[],Ge=0,G="trucks",Q=0,J=1,ee=[],oe=null,_e=[],Ue=null,ge=null,Fe="ALL",We="TIMELINE";function L(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function Ht(e){if(e>=12){const t=Math.floor(e/12),i=e%12;return i>0?t+"y "+i+"mo":t+"y"}return e+" ticks"}function U(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(1)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(0)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function he(e){return e==="civil_engineering"?"CIVIL":e==="industrial"?"INDUSTRIAL":e==="mega_project"?"MEGA":e?.toUpperCase()||"—"}function mt(e){return e==="civil_engineering"?"light":e==="industrial"?"heavy":e==="mega_project"?"mega":"light"}function jt(){ge&&clearInterval(ge),ge=setInterval(()=>{if(!Ue)return;const e=Ue-Date.now();if(e<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(ge);return}const t=Math.floor(e/36e5),i=Math.floor(e%36e5/6e4),n=Math.floor(e%6e4/1e3);document.getElementById("tick-countdown").textContent=t+"h "+i+"m "+n+"s"},1e3)}function Gt(){document.body.classList.toggle("light-mode");const e=document.getElementById("theme-toggle");e.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function Ut(e,t){e==="type"&&(Fe=t),e==="sort"&&(We=t),document.querySelectorAll(`.filter-pill[data-filter="${e}"]`).forEach(i=>{i.classList.toggle("active",i.dataset.value===t)}),ft()}function ut(e){return!(!m||e.sector==="mega_project"&&m.corp_subsector!=="Megaprojects"||e.sector==="industrial"&&!["Heavy Infrastructure","Megaprojects"].includes(m.corp_subsector))}function ft(){const e=document.getElementById("oc-list");let t=[...ce];if(Fe==="GOVERNMENT"?t=t.filter(a=>a.issuer_type==="GOVERNMENT"):Fe==="PRIVATE"&&(t=t.filter(a=>a.issuer_type==="PRIVATE")),We==="TIMELINE"&&t.sort((a,l)=>(a.timeline_ticks||0)-(l.timeline_ticks||0)),We==="BUDGET"&&t.sort((a,l)=>(l.budget_ceiling||0)-(a.budget_ceiling||0)),document.getElementById("oc-count").textContent=t.length+" AVAILABLE",t.length===0){e.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const i=B?.current_tick||0;let n="";for(const a of t){const l=a.issuer_type==="GOVERNMENT",r=l?"gov":"private",s=ut(a),c=s?"":" locked",o=mt(a.sector),d=he(a.sector),p=(a.timeline_ticks||0)>18?" warn":"",u=a.bidding_ends_tick?Math.max(0,a.bidding_ends_tick-i):"?";n+=`
            <div class="oc-item${c}" data-contract-id="${a.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${f(a.name)}</span>
                    <span class="oc-item__type-badge ${r}">${l?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${r}">${f(a.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${u} tick${u!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${U(a.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${p}">${Ht(a.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${o}">${d}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${fe[a.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${U(fe[a.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${s?"yes":"no"}">${s?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${s?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openBidModal(contracts.find(x=>x.id==='${a.id}'))">${fe[a.id]?"EDIT":"VIEW"}</button>`:""}
                </div>
                ${a.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${f(a.description)}</div>`:""}
            </div>`}e.innerHTML=n,e.querySelectorAll(".oc-item:not(.locked)").forEach(a=>{a.addEventListener("click",()=>{const l=a.dataset.contractId,r=ce.find(s=>s.id===l);r&&vt(r)})})}let be=null;function vt(e){be=e;const t=document.getElementById("cd-overlay"),i=e.issuer_type==="GOVERNMENT",n=i?"gov":"private",a=(x?.name||m.nation||"—").toUpperCase(),l=ut(e);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${f(a)}</span>
        <span class="cd-header__name">${f(e.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${n}">${f(e.issuer_name)}</span>
        <span class="cd-header__type-badge ${n}">${i?"GOV":"PRIVATE"}</span>
    `;const r=document.getElementById("cd-blueprint");e.blueprint_svg?(r.innerHTML=e.blueprint_svg,r.style.display=""):(r.innerHTML=li(e),r.style.display="");const s=e.permits_required||[],c=e.required_equipment||e.equipment_required||[],o=e.required_materials||e.materials_estimated||{},p={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[e.sector]||e.spec_category||e.sector||"—";let u="var(--teal)";e.sector==="industrial"&&(u="var(--orange)"),e.sector==="mega_project"&&(u="var(--red)");let _=L(e.budget_ceiling||e.budget||0),g=(e.timeline_ticks||e.timeline_months||0)+" Months",v="";v+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${f(e.project_code||e.contract_number||"")}</span>
            </div>
            <div class="cd-issue__tags">
                ${e.project_type?`<span class="cd-tag teal">${f(e.project_type.toUpperCase())}</span>`:""}
                ${e.project_subtype?`<span class="cd-tag gold">${f(e.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,e.description&&(v+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${f(e.description)}</div>
            </div>`),v+='<div class="cd-details">',e.project_type&&(v+=Z("Type",e.project_type)),e.project_subtype&&(v+=Z("Sub-Type",e.project_subtype)),v+=Z("Specialization",p,u),v+=Z("Total Budget",_,"var(--green)"),v+=Z("Timeline",g),v+=Z("Nation",x?.name||m.nation||"—"),e.region&&(v+=Z("Region",e.region)),v+="</div>",s.length>0&&(v+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${s.map(E=>{const T=E.status==="approved"?"approved":"required",I=E.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${T}">
                            <span class="cd-chip__icon">${I}</span>
                            <span class="cd-chip__label">${f(E.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),c.length>0&&(v+=`
            <div class="cd-items">
                <div class="cd-section-label">Required Equipment</div>
                <div class="cd-items__list">
                    ${c.map(E=>{const T=E.owned?"owned":"missing",I=E.owned?"&#10003;":"&#10007;";return`<div class="cd-chip ${T}">
                            <span class="cd-chip__icon">${I}</span>
                            <span class="cd-chip__label">${f(E.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),o.length>0&&(v+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${o.map(E=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${f(E.name)}</span>
                        <span class="cd-mat-row__qty">${f(String(E.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=v;const h=s.filter(E=>E.status==="approved").length,b=s.length-h,$=c.filter(E=>E.owned).length,q=c.length-$;let y="";c.length>0&&(q===0?y+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>':y+=`<span class="cd-footer__badge bad">${q} EQUIPMENT MISSING</span>`),s.length>0&&(b===0?y+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':y+=`<span class="cd-footer__badge warn">${b} PERMITS PENDING</span>`);const M=l,C=(m.action_points??0)>=2;document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${y}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            <button class="cd-btn primary" onclick="placeBid()" ${M&&C?"":"disabled"}
                title="${M?C?"Place a bid (2 AP)":"Need 2 AP to bid":"Not qualified for this contract"}">BID</button>
        </div>
    `,t.classList.add("open"),document.body.style.overflow="hidden"}function yt(e){e&&e.target&&e.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",be=null)}const Ft=[{key:"concrete",name:"Concrete",unit:"units"},{key:"steel",name:"Steel",unit:"units"},{key:"lumber",name:"Lumber",unit:"units"},{key:"aggregate",name:"Aggregate",unit:"units"},{key:"em_systems",name:"E&M Systems",unit:"units"},{key:"glass_facades",name:"Glass & Facades",unit:"units"},{key:"asphalt",name:"Asphalt",unit:"units"},{key:"heavy_parts",name:"Heavy Machinery Parts",unit:"units"}],Wt=[{key:"work_trucks",name:"Work Trucks",tier:1},{key:"excavators",name:"Excavators",tier:1},{key:"bulldozers",name:"Bulldozers",tier:1},{key:"concrete_mixers",name:"Concrete Mixers",tier:1},{key:"tower_cranes",name:"Tower Cranes",tier:2},{key:"heavy_haulers",name:"Heavy Haulers",tier:2},{key:"pile_drivers",name:"Pile Drivers",tier:2},{key:"asphalt_plants",name:"Asphalt Plants",tier:2}],gt={LOW:.7,STANDARD:1,HIGH:1.4},_t={LOW:35,STANDARD:65,HIGH:90},Me=15;let D=null;function Vt(e){if(!e)return;const t=e.required_materials||{},i=e.required_equipment||[],n=e.required_workforce||{},a={concrete:18e4,steel:25e4,lumber:12e4,aggregate:8e4,em_systems:32e4,glass_facades:28e4,asphalt:14e4,heavy_parts:4e5},l=Ft.filter(d=>t[d.key]>0).map(d=>({...d,qty:t[d.key],basePrice:a[d.key]||2e5,grade:d.key==="aggregate"?"LOW":"STANDARD",highDisabled:!1})),r=Wt.filter(d=>i.includes(d.key)).map(d=>({...d,owned:(V||[]).some(p=>p.equipment_key===d.key&&p.quantity>0)})),s=(n.general||100)+(n.skilled||20),c=e.budget_ceiling||1e8,o=Math.round(c*.03);D={contract:e,budgetCeiling:c,materials:l,laborCount:s,laborRate:15200,estimatedTicks:e.timeline_ticks||8,equipment:r,permits:[],overhead:o,markupPct:15,competitors:[],playerRep:m?.standing||50,requiredWorkforce:n},document.getElementById("bid-title").textContent="BID ASSEMBLY",document.getElementById("bid-subtitle").textContent=(e.name||"Contract")+" — "+he(e.sector)+" — "+(e.issuer_name||"Government"),document.getElementById("bid-overlay").classList.add("open"),document.body.style.overflow="hidden",we()}function bt(e){e&&e.target!==document.getElementById("bid-overlay")||(document.getElementById("bid-overlay").classList.remove("open"),document.body.style.overflow="",D=null)}function N(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(2)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function Yt(e,t){if(!D)return;const i=D.materials[e];t==="HIGH"&&i.highDisabled||(i.grade=t,we())}function Qt(e){D&&(D.laborCount=e,we())}function Kt(e){D&&(D.markupPct=Number(e),we())}function we(){if(!D)return;const e=D;let t=0;for(const I of e.materials)I.lineCost=Math.round(I.qty*I.basePrice*gt[I.grade]),t+=I.lineCost;const i=Math.round(e.laborCount*e.laborRate*e.estimatedTicks),n=Math.round(e.equipment.filter(I=>I.owned).length*12e3*e.estimatedTicks);let a=0;const l=e.overhead,r=t+i+n+a+l,s=Math.round(r*e.markupPct/100),c=r+s,o=c>e.budgetCeiling,d=s,p=Math.round(e.materials.reduce((I,z)=>I+_t[z.grade],0)/e.materials.length),u=p>=80?"STRONG":p>=60?"PROMISING":p>=40?"UNCERTAIN":"POOR",_=p>=80?"var(--green)":p>=60?"var(--teal)":p>=40?"var(--orange)":"var(--red)",g=e.budgetCeiling>0?c/e.budgetCeiling:1,v=Math.max(0,Math.min(100,Math.round((1-g)*150))),h=v>=70?"STRONG":v>=40?"COMPETITIVE":v>=15?"WEAK":"UNLIKELY",b=v>=70?"var(--green)":v>=40?"var(--teal)":v>=15?"var(--orange)":"var(--red)",$=Math.round(r*(1-Me/100)),q=Math.round(r*(1+Me/100));let y="";y+='<div class="bid-section"><div class="bid-section__title">Materials</div>',e.materials.forEach((I,z)=>{const F=le=>{const Bt=I.grade===le,Pt=le==="HIGH"&&I.highDisabled;return`<button class="bid-grade-btn ${Bt?le==="LOW"?"active-low":le==="HIGH"?"active-high":"active":""} ${Pt?"disabled":""}" onclick="setBidGrade(${z},'${le}')">${le[0]}</button>`};y+=`<div class="bid-mat-row">
            <span class="bid-mat-row__name">${f(I.name)}</span>
            <span class="bid-mat-row__qty">×${I.qty}</span>
            <div class="bid-grade-btns">${F("LOW")}${F("STANDARD")}${F("HIGH")}</div>
            <span class="bid-mat-row__cost">${N(I.lineCost)}</span>
        </div>`}),y+=`<div class="bid-line-total"><span class="bid-line-total__label">MATERIALS TOTAL</span><span class="bid-line-total__value">${N(t)}</span></div></div>`;const M=(e.requiredWorkforce?.general||80)+(e.requiredWorkforce?.skilled||20),C=[Math.round(M*.8),M,Math.round(M*1.2),Math.round(M*1.4),Math.round(M*1.6)];y+='<div class="bid-section"><div class="bid-section__title">Labor</div>',y+='<div class="bid-labor-presets">',C.forEach(I=>{y+=`<button class="bid-labor-btn ${e.laborCount===I?"active":""}" onclick="setBidLabor(${I})">${I}</button>`}),y+="</div>";const E=e.requiredWorkforce||{};y+=`<div class="bid-labor-formula">Required: ${E.general||"?"} general + ${E.skilled||"?"} skilled<br>`,y+=`${e.laborCount} workers × ${N(e.laborRate)}/tick × ${e.estimatedTicks} ticks = <strong>${N(i)}</strong></div>`,y+=`<div class="bid-line-total"><span class="bid-line-total__label">LABOR TOTAL</span><span class="bid-line-total__value">${N(i)}</span></div></div>`,y+='<div class="bid-section"><div class="bid-section__title">Equipment</div>',e.equipment.forEach(I=>{const z=I.owned?"bid-equip-row__status--owned":"bid-equip-row__status--missing",F=I.owned?"✓ OWNED":"✗ NOT OWNED";y+=`<div class="bid-equip-row"><span class="bid-equip-row__name">${f(I.name)}</span><span class="bid-equip-row__status ${z}">${F}</span></div>`}),y+=`<div class="bid-line-total"><span class="bid-line-total__label">MAINTENANCE (${e.estimatedTicks}t)</span><span class="bid-line-total__value">${N(n)}</span></div></div>`,y+='<div class="bid-section"><div class="bid-section__title">Permits</div>',y+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);padding:8px 0;">No permits required yet.</div>',y+='<div class="bid-line-total"><span class="bid-line-total__label">PERMITS TOTAL</span><span class="bid-line-total__value">$0</span></div></div>',y+='<div class="bid-section"><div class="bid-section__title">Overhead &amp; Contingency</div>',y+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Site management, insurance, admin</div>',y+=`<div class="bid-line-total"><span class="bid-line-total__label">OVERHEAD</span><span class="bid-line-total__value">${N(l)}</span></div></div>`,document.getElementById("bid-left").innerHTML=y;let T="";T+='<div class="bid-section"><div class="bid-section__title">Cost Summary</div>',T+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Materials</span><span class="bid-summary-row__value">${N(t)}</span></div>`,T+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Labor</span><span class="bid-summary-row__value">${N(i)}</span></div>`,T+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Equipment Maint.</span><span class="bid-summary-row__value">${N(n)}</span></div>`,T+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Permits</span><span class="bid-summary-row__value">${N(a)}</span></div>`,T+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Overhead</span><span class="bid-summary-row__value">${N(l)}</span></div>`,T+=`<div class="bid-cost-total"><span class="bid-cost-total__label">ESTIMATED COST</span><span class="bid-cost-total__value">${N(r)}</span></div>`,T+=`<div class="bid-accuracy">⚠ Estimate accuracy: ±${Me}%<br>Actual cost range: ${N($)} — ${N(q)}</div>`,T+="</div>",T+='<div class="bid-section"><div class="bid-section__title">Markup</div>',T+=`<div class="bid-slider-wrap">
        <div class="bid-slider-label"><span class="bid-slider-label__pct">${e.markupPct}%</span><span style="color:var(--text-dim)">${N(s)}</span></div>
        <input type="range" class="bid-slider" min="0" max="40" value="${e.markupPct}" oninput="setBidMarkup(this.value)">
    </div></div>`,T+=`<div class="bid-price-hero ${o?"bid-price-hero--over":""}">
        <div class="bid-price-hero__label">YOUR BID PRICE</div>
        <div class="bid-price-hero__value">${N(c)}</div>
        ${o?'<div class="bid-price-hero__warning">EXCEEDS BUDGET CEILING ('+N(e.budgetCeiling)+")</div>":""}
    </div>`,T+=`<div class="bid-profit"><span class="bid-profit__label">PROJECTED PROFIT</span><span class="bid-profit__value">+${N(d)}</span></div>`,T+=`<div class="bid-compete">
        <div style="display:flex;justify-content:space-between;"><span class="bid-compete__label" style="color:${b}">${h}</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Competitiveness</span></div>
        <div class="bid-compete__bar-wrap"><div class="bid-compete__bar" style="width:${v}%;background:${b}"></div></div>
    </div>`,T+=`<div class="bid-quality">
        <div style="display:flex;justify-content:space-between;"><span class="bid-quality__label" style="color:${_}">${u} (${p}/100)</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Quality Estimate</span></div>
        <div class="bid-quality__bar-wrap"><div class="bid-quality__bar" style="width:${p}%;background:${_}"></div></div>
    </div>`,T+='<div class="bid-section" style="margin-top:8px;"><div class="bid-section__title">Competing Bids</div>',e.competitors.forEach(I=>{T+=`<div class="bid-competitor"><span class="bid-competitor__name">${f(I.name)}</span><span class="bid-competitor__rep">Rep ${I.rep}</span></div>`}),T+=`<div class="bid-competitor" style="color:var(--gold);"><span class="bid-competitor__name">You</span><span class="bid-competitor__rep">Rep ${e.playerRep}</span></div>`,T+="</div>",document.getElementById("bid-right").innerHTML=T,document.getElementById("bid-footer-price").textContent=N(c),document.getElementById("bid-footer-price").style.color=o?"var(--red)":"var(--gold)",document.getElementById("bid-footer-profit").textContent="+"+N(d),document.getElementById("bid-footer-quality").textContent=p+"/100",document.getElementById("bid-footer-quality").style.color=_,document.getElementById("bid-submit-btn").disabled=o}window.openBidModal=Vt;window.closeBidModal=bt;window.setBidGrade=Yt;window.setBidLabor=Qt;window.setBidMarkup=Kt;let Se=!1;async function Jt(){if(!D||!m||Se)return;const e=D,t=e.contract;let i=0;const n={};for(const p of e.materials)i+=Math.round(p.qty*p.basePrice*gt[p.grade]),n[p.key]=p.grade;const a=Math.round(e.laborCount*e.laborRate*e.estimatedTicks),l=Math.round(e.equipment.filter(p=>p.owned).length*12e3*e.estimatedTicks),r=i+a+l+e.overhead,s=Math.round(r*e.markupPct/100),c=r+s,o=Math.round(e.materials.reduce((p,u)=>p+_t[u.grade],0)/(e.materials.length||1));if(c>e.budgetCeiling){alert("Bid exceeds budget ceiling. Lower your costs or markup.");return}const d=document.getElementById("bid-submit-btn");d.disabled=!0,d.textContent="SUBMITTING...",Se=!0;try{const{data:p}=await w.from("shard").select("current_tick").eq("name","Alpha Shard").single(),u=p?.current_tick||0,{data:_}=await w.from("contract_bids").select("id").eq("contract_id",t.id).eq("faction_id",m.id).maybeSingle();if(_){const{error:v}=await w.from("contract_bids").update({bid_price:c,material_grades:n,labor_count:e.laborCount,markup_pct:e.markupPct,estimated_cost:r,estimated_quality:o,submitted_at_tick:u}).eq("id",_.id);if(v)throw v}else{const{error:v}=await w.from("contract_bids").insert({contract_id:t.id,faction_id:m.id,bid_price:c,material_grades:n,labor_count:e.laborCount,markup_pct:e.markupPct,estimated_cost:r,estimated_quality:o,status:"pending",submitted_at_tick:u});if(v)throw v}bt();const g=document.getElementById("oc-count");if(g){const v=g.textContent;g.textContent="✓ BID SUBMITTED",g.style.color="var(--green)",setTimeout(()=>{g.textContent=v,g.style.color=""},2e3)}await $t()}catch(p){console.error("Bid submission failed:",p),alert("Failed to submit bid: "+(p.message||"Unknown error")),d.disabled=!1,d.textContent="SUBMIT BID"}finally{Se=!1}}window.submitBid=Jt;const te=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],st={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},ot={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let A=null;function Xt(e){const t=W.find(E=>E.id===e);if(!t)return;const i=Array.isArray(t.contract_bids)?t.contract_bids[0]:t.contract_bids,n=B?.current_tick||0,a=t.awarded_at_tick||n,l=t.timeline_ticks||8,r=Math.max(0,n-a),s=Math.min(100,r/l*100);let c=Math.min(te.length-1,Math.floor(s/(100/te.length)));const o=Math.round(s%(100/te.length)/(100/te.length)*100),d=t.required_materials||{},p=i?.material_grades||{},u=Object.entries(d).map(([E,T])=>{const I=p[E]||"STANDARD",z=Math.round(T*(s/100)*(.6+Math.random()*.4));return{key:E,name:E.replace(/_/g," ").replace(/\b\w/g,F=>F.toUpperCase()),grade:I,allocated:T,used:Math.min(z,T)}}),g=(t.required_equipment||[]).map(E=>({key:E,name:E.replace(/_/g," ").replace(/\b\w/g,T=>T.toUpperCase()),qty:1+Math.floor(Math.random()*3),condition:55+Math.floor(Math.random()*40)})),v=t.budget_ceiling||0,h=i?.estimated_cost||0,b=Math.round(h*Math.min(1,r/l)),$=i?.estimated_quality||65,q=$>=80?"STRONG":$>=60?"PROMISING":$>=40?"FAIR":"UNCERTAIN",y=t.required_workforce||{},M=(y.general||0)+(y.skilled||0),C=i?.labor_count||M;A={project:t,bid:i,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:n,awardedTick:a,totalTicks:l,ticksElapsed:r,phaseIdx:c,phaseProgress:o,materials:u,equipment:g,budget:v,estCost:h,spent:b,quality:$,qualityLabel:q,laborCount:C,wfNeeded:M,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",xt(t.id).then(()=>re()),re()}function Zt(e){e&&e.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",A=null)}function ei(e){A&&(A.tab=e,A.expandedEvent=-1,A.selectedResponse=null,re())}function ti(e){A&&(A.expandedEvent=A.expandedEvent===e?-1:e,A.selectedResponse=null,re())}function ii(e){A&&(A.selectedResponse=A.selectedResponse===e?null:e,re())}function re(){if(!A)return;const e=A,t=e.project,i=t.issuer_type==="GOVERNMENT",n=he(t.sector),a=m?.nation||"Nation",l=e.awardedTick+e.totalTicks,r=Math.max(0,l-e.currentTick),s=e.currentTick>l,c=e.budget>0?Math.round(e.spent/e.budget*100):0,o=c>85?"var(--red)":c>60?"var(--amber)":"var(--teal)",d=e.budget-e.spent,p=e.events.filter(h=>h.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
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
    `;let u='<div class="pm-phase__bar">';for(let h=0;h<te.length;h++){const b=h<e.phaseIdx,$=h===e.phaseIdx;u+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${b?"done":$?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${b?"done":$?"active":""}">${te[h]}</span>
        </div>`}u+="</div>",u+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${te[e.phaseIdx]} — ${e.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${s?"var(--red)":"var(--text-secondary)"}">Tick ${e.ticksElapsed} / ${e.totalTicks}${s?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=u;const _=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:p},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=_.map(h=>`<button class="pm-tab${e.tab===h.id?" active":""}" onclick="pmSetTab('${h.id}')">
            ${h.label}${h.badge>0?`<span class="pm-tab__badge">${h.badge}</span>`:""}
        </button>`).join("");let g="";e.tab==="overview"?g=ai(e,t,o,c,d,r,s):e.tab==="events"?g=ni(e):e.tab==="materials"?g=si(e):e.tab==="equipment"&&(g=oi(e)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${g}</div>`;let v="";p>0&&(v+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${p} EVENT${p>1?"S":""} REQUIRES RESPONSE</span>`),v+=`<span class="pm-ftr__badge" style="color:${e.quality>=70?"var(--green)":e.quality>=50?"var(--amber)":"var(--orange)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${e.quality}/100 — ${e.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${v}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function ai(e,t,i,n,a,l,r){const s=qe(e.awardedTick+e.totalTicks);qe(e.awardedTick+e.totalTicks);const c=qe(e.awardedTick),o=[{label:"Budget",value:U(e.budget),sub:`${n}% spent`,color:i},{label:"Spent",value:U(e.spent),color:"var(--red)"},{label:"Remaining",value:U(a),color:"var(--green)"},{label:"Quality",value:`${e.quality}/100`,sub:e.qualityLabel,color:e.quality>=70?"var(--green)":e.quality>=50?"var(--amber)":"var(--red)"},{label:"Workforce",value:`${e.laborCount}/${e.wfNeeded}`,sub:`Bid: ${e.laborCount}`,color:e.laborCount<e.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${l} ticks`,sub:r?"OVERDUE":`Deadline: ${s}`,color:r?"var(--red)":"var(--text-bright)"}];let d="";d+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${f(t.description||t.name)}</div>
    </div></div>`,d+='<div class="pm-metrics">';for(const u of o)d+=`<div class="pm-metric">
            <div class="pm-metric__label">${u.label}</div>
            <div class="pm-metric__value" style="color:${u.color}">${u.value}</div>
            ${u.sub?`<div class="pm-metric__sub">${f(u.sub)}</div>`:""}
        </div>`;d+="</div>",d+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${c}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${r?"var(--red)":"var(--text-bright)"};font-weight:700">${s}</span></span>
        </div>
    </div></div>`;const p=[];if((t.sector==="civil_engineering"||t.sector==="industrial"||t.sector==="mega_project")&&(p.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),p.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),t.sector!=="civil_engineering"&&p.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),p.length>0){d+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const u of p)d+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${f(u.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;d+="</div></div>"}return d}function ni(e){if(e.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let t="";for(let i=0;i<e.events.length;i++){const n=e.events[i],a=e.expandedEvent===i,l=n.status==="ACTIVE",r=st[n.type]||st.WEATHER,s=ot[n.severity]||ot.LOW;if(t+=`<div class="pm-evt ${l?"pm-evt--active":"pm-evt--resolved"}" style="${l?`border-left-color:${r.color}`:""}">`,t+=`<div class="pm-evt__header" onclick="pmToggleEvent(${i})" style="${a?`background:${r.bg}`:""}">`,t+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${r.color};background:${r.bg};border:1px solid ${r.border}">${n.type}</span>
            <span class="pm-evt__sev-badge" style="color:${s}">${n.severity}</span>
            <span class="pm-evt__status" style="color:${l?"var(--red)":"var(--text-dim)"};font-weight:${l?"700":"400"}">${l?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,t+=`<div class="pm-evt__title">${f(n.title)}</div>`,t+=`<div class="pm-evt__meta">Tick ${n.tick} · ${f(n.id||"")}</div>`,a){if(t+='<div class="pm-evt__body">',t+=`<div class="pm-evt__desc">${f(n.desc)}</div>`,n.impact&&(t+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${f(n.impact)}</span>
                </div>`),l&&n.responses&&n.responses.length>0){t+='<div class="pm-evt__resp-title">Response Options</div>';for(let c=0;c<n.responses.length;c++){const o=n.responses[c],d=e.selectedResponse===c,u={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[o.tag]||"var(--text-secondary)";t+=`<div class="pm-resp${d?" selected":""}" style="${d?`border-color:${u}`:""}" onclick="event.stopPropagation();pmSelectResponse(${c})">`,t+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${f(o.label)}</span>
                            <span class="pm-resp__tag" style="color:${u};background:${u}12;border:1px solid ${u}25">${o.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${o.delay>0?"var(--orange)":"var(--green)"}">
                            ${o.delay>0?`+${o.delay} tick${o.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,t+=`<div class="pm-resp__detail">${f(o.detail)}</div>`,t+='<div class="pm-resp__costs">',o.cost&&(t+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${U(o.cost)}</span>`),o.qualityImpact&&o.qualityImpact!==0&&(t+=`<span class="pm-resp__cost" style="color:${o.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${o.qualityImpact>0?"+":""}${o.qualityImpact}</span>`),!o.cost&&(!o.qualityImpact||o.qualityImpact===0)&&(t+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),t+="</div>",d&&(t+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${u}" onclick="event.stopPropagation();confirmEventResponse('${n.id}','${o.key}')">CONFIRM</button>
                        </div>`),t+="</div>"}}!l&&n.resolution&&(t+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${f(n.resolution)}</div>
                </div>`),t+="</div>"}t+="</div></div>"}return t}function si(e){if(e.materials.length===0)return'<div class="pm-evt-empty">No materials allocated to this project.</div>';let t='<div class="pm-tab-header">Allocated Materials</div>';for(const i of e.materials){const n=i.allocated>0?Math.round(i.used/i.allocated*100):0,a=i.grade==="HIGH"?"high":i.grade==="LOW"?"low":"std",l=i.grade==="HIGH"?"var(--green)":i.grade==="LOW"?"var(--orange)":"var(--amber)";t+=`<div class="pm-mat">
            <div class="pm-mat__row1">
                <div class="pm-mat__left">
                    <span class="pm-mat__name">${f(i.name)}</span>
                    <div class="pm-mat__grade-dot pm-mat__grade-dot--${a}"></div>
                    <span class="pm-mat__grade" style="color:${l}">${i.grade}</span>
                </div>
                <span class="pm-mat__qty">${i.used.toLocaleString()} / ${i.allocated.toLocaleString()}</span>
            </div>
            <div class="pm-mat__bar-row">
                <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${n}%"></div></div>
                <span class="pm-mat__pct">${n}% consumed</span>
            </div>
        </div>`}return t}function oi(e){if(e.equipment.length===0)return'<div class="pm-evt-empty">No equipment deployed to this project.</div>';let t='<div class="pm-tab-header">Deployed Equipment</div>';for(const i of e.equipment){const n=i.condition>=75?"var(--green)":i.condition>=50?"var(--amber)":i.condition>=25?"var(--orange)":"var(--red)",a=i.condition<60;t+=`<div class="pm-eq">
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
        </div>`}return t}function qe(e){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][e%12]}, ${2e3+Math.floor(e/12)}`}window.openProjectModal=Xt;window.closeProjectModal=Zt;window.pmSetTab=ei;window.pmToggleEvent=ti;window.pmSelectResponse=ii;async function xt(e){if(!A)return;const{data:t,error:i}=await w.from("construction_events").select("*").eq("contract_id",e).order("fired_at_tick",{ascending:!1});i?(console.warn("Failed to load project events:",i.message),A.events=[]):A.events=(t||[]).map(n=>({id:n.id,type:n.type,severity:n.severity,tick:n.fired_at_tick,title:n.title,desc:n.description,impact:n.impact,status:n.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:n.resolution,responses:n.responses||[]})),re()}let Ae=!1;async function ri(e,t){if(!(Ae||!A)){Ae=!0;try{const{data:i,error:n}=await w.rpc("resolve_construction_event",{p_event_id:e,p_response_key:t});if(n){console.error("Failed to resolve event:",n.message),alert("Failed to submit response: "+n.message);return}const a=typeof i=="string"?JSON.parse(i):i;if(a?.error){alert("Error: "+a.error);return}await xt(A.project.id),await ht(),a?.quality_applied&&a.quality_applied!==0&&(A.quality=Math.max(0,Math.min(100,A.quality+a.quality_applied)),A.qualityLabel=A.quality>=80?"STRONG":A.quality>=60?"PROMISING":A.quality>=40?"FAIR":"UNCERTAIN"),re()}finally{Ae=!1}}}window.confirmEventResponse=ri;function Z(e,t,i){const n=i?` style="color:${i}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${f(e)}</span>
        <span class="cd-detail-row__value"${n}>${f(t)}</span>
    </div>`}function li(e){const t={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},i=e.drawing_number||e.contract_number+"-A1",n=B?.current_date||"",a=n?n.replace(/,\s*/," "):"",l=e.spec_category==="Heavy Infrastructure",r=e.spec_category==="Megaproject";let s=f(e.project_subtype||e.project_type||"STRUCTURE"),c=l?"80.0m":r?"200.0m":"60.0m",o=l?"40.0m":r?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${t.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(d,p)=>`<line x1="${p*20}" y1="0" x2="${p*20}" y2="200" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(d,p)=>`<line x1="0" y1="${p*20}" x2="680" y2="${p*20}" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${t.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${t.accent}" font-family="var(--font-mono)" font-weight="700">${s.toUpperCase()}</text>
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
        <text x="340" y="17" text-anchor="middle" font-size="5.5" fill="${t.dim}" font-family="var(--font-mono)">${c}</text>

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
    </svg>`}let Le=!1;async function ci(){if(Le||!be||!m)return;if((m.action_points??0)<2){alert("You need at least 2 AP to place a bid.");return}Le=!0;const e=document.querySelector(".cd-btn.primary");e&&(e.disabled=!0,e.textContent="...");try{const{data:t,error:i}=await w.rpc("deduct_ap",{p_faction_id:m.id,p_cost:2});if(i)throw i;if(t<0){const a=-t-1;m.action_points=a,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+a+" AP</span>",e&&(e.disabled=!1,e.textContent="BID"),alert("Insufficient AP. You have "+a+" AP, need 2.");return}const{error:n}=await w.from("corp_contract_bids").insert({contract_id:be.id,faction_id:m.id,nation_id:m.nation_id,ap_spent:2,created_at_tick:B?.current_tick||null});if(n)throw await w.rpc("deduct_ap",{p_faction_id:m.id,p_cost:-2}),m.action_points=t+2,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+(t+2)+" AP</span>",n;m.action_points=t,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+t+" AP</span>",e&&(e.textContent="BID PLACED")}catch(t){e&&(e.disabled=!1,e.textContent="BID"),t.code==="23505"?alert("You have already placed a bid on this contract."):alert("Failed to place bid: "+(t.message||"Unknown error"))}finally{Le=!1}}async function $t(){if(!m||!m.nation_id)return;const{data:e,error:t}=await w.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(t?(console.warn("Failed to load contracts:",t.message),ce=[]):ce=e||[],fe={},m&&ce.length>0){const i=ce.map(a=>a.id),{data:n}=await w.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",m.id).in("contract_id",i);for(const a of n||[])fe[a.contract_id]=a}ft()}function di(){const e=document.getElementById("ap-list"),t=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=W.length+" ACTIVE",W.length===0){e.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,t.style.display="none";return}const i=B?.current_tick||0;let n=0,a=0,l="";for(const r of W){const s=r.issuer_type==="GOVERNMENT",c=s?"gov":"private",o=Array.isArray(r.contract_bids)?r.contract_bids[0]:r.contract_bids,d=o?.bid_price||0,p=o?.estimated_cost||0,u=o?.estimated_quality||0,_=r.budget_ceiling||0,g=r.awarded_at_tick||i,v=g+(r.timeline_ticks||8),h=Math.max(0,v-i),b=Math.max(0,i-g),$=r.timeline_ticks||8,q=Math.min(100,Math.round(b/$*100)),y=i>v;mt(r.sector);const M=he(r.sector);n+=_,a+=d,l+=`<div class="ap-item" onclick="openProjectModal('${r.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${f(r.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${f(r.issuer_name||"—")} · ${M}</div>
                </div>
                <span class="oc-item__type-badge ${c}">${s?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS</span>
                    <span class="ap-budget__values" style="color:${y?"var(--red)":"var(--teal)"}">
                        ${b}/${$} ticks ${y?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${q}%;background:${y?"var(--red)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${U(d)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${U(p)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${u>=70?"var(--green)":u>=40?"var(--teal)":"var(--orange)"}">${u}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${y?"var(--red)":"var(--text-bright)"}">${h} ticks</div>
                </div>
            </div>
        </div>`}e.innerHTML=l,t.style.display=W.length>0?"":"none",W.length>0&&(document.getElementById("ap-total-crew").textContent=W.length,document.getElementById("ap-total-budget").textContent=U(n),document.getElementById("ap-total-spent").textContent=U(a))}async function ht(){if(!m)return;const{data:e,error:t}=await w.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",m.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",m.id).order("awarded_at_tick",{ascending:!0});t?(console.warn("Failed to load active projects:",t.message),W=[]):W=e||[],di()}const wt=3e4;function kt(){let e=0,t=0;for(const i of X)for(const n of Qe){const a=R[i.key]?.[n];a&&(e+=a.qty,t+=a.value)}return{totalUnits:e,totalValue:t}}function Ke(){const e=document.getElementById("wh-list"),{totalUnits:t,totalValue:i}=kt();document.getElementById("wh-count").textContent=t.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=L(i);const n=Math.round(t/wt*100),a=document.getElementById("wh-capacity");a.textContent=n+"%",a.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)";let l="";for(let r=0;r<X.length;r++){const s=X[r],c=je===r,o=R[s.key]?.LOW||{qty:0,value:0},d=R[s.key]?.STD||{qty:0,value:0},p=R[s.key]?.HIGH||{qty:0,value:0},u=o.qty+d.qty+p.qty,_=o.value+d.value+p.value,g=u===0,v=ne(s.key,"LOW",x),h=ne(s.key,"STD",x),b=ne(s.key,"HIGH",x),$=o.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",q=d.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",y=b.available?p.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(l+='<div class="wh-row">',l+=`<div class="wh-row__collapsed${c?" expanded":""}" onclick="toggleWhRow(${r})">
            <span class="wh-row__arrow">${c?"▾":"▸"}</span>
            <span class="wh-row__name${g?" empty":""}">${f(s.name)}</span>
            <div class="wh-row__dots">
                <div class="${$}"></div>
                <div class="${q}"></div>
                <div class="${y}"></div>
            </div>
            <span class="wh-row__qty${g?" empty":""}">${u>0?u.toLocaleString():"—"}</span>
            <span class="wh-row__val${g?" empty":""}">${_>0?L(_):"—"}</span>
        </div>`,c){l+='<div class="wh-expand">',l+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const M=[{key:"LOW",label:"Low",data:o,avail:v,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:d,avail:h,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:p,avail:b,color:"var(--green)",dotClass:"wh-dot--high"}];for(const C of M){const E=!C.avail.available,T=C.data.qty>0,I=T?"$"+Math.round(C.data.value/C.data.qty):"—";l+=`<div class="wh-grade${E?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${C.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${E?"var(--red)":C.color}">${C.label}</span>
                        ${E?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${T?"var(--text-bright)":"var(--text-dim)"}">${T?C.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${C.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${C.data.value>0?L(C.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${I}</span>
                </div>`}for(const C of M)!C.avail.available&&C.avail.failedStat&&(l+=`<div class="wh-lock">
                        <span class="wh-lock__text">${C.label.toUpperCase()} GRADE LOCKED — ${f(C.avail.failedStat)} &lt; ${C.avail.failedMin}</span>
                    </div>`);l+="</div>"}l+="</div>"}e.innerHTML=l}function pi(e){je=je===e?-1:e,Ke()}async function mi(){if(!m)return;const{data:e,error:t}=await w.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",m.id);if(R={},t)console.warn("Failed to load warehouse:",t.message);else if(e)for(const i of e)R[i.material_key]||(R[i.material_key]={}),R[i.material_key][i.quality_tier]={qty:i.quantity||0,value:Number(i.total_value)||0};Ke()}const ui={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function Et(){const e=(x?.name||m?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+e;const t=Number(m?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=L(t);const{totalUnits:i}=kt(),n=Math.round(i/wt*100),a=document.getElementById("pr-wh-capacity");a.textContent=n+"%",a.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)",Tt(),Je(),ke()}function Tt(){const e=document.getElementById("pr-mat-grid");let t="";for(const i of X){const n=P===i.key,a=Qe.every(r=>!ne(i.key,r,x).available),l="pr-mat-btn"+(n?" active":"")+(a?" all-locked":"");t+=`<span class="${l}" onclick="setPrMat('${i.key}')">${f(i.name)}</span>`}e.innerHTML=t}function Je(){const e=document.getElementById("pr-tier-bar");let t='<span class="pr-tier-label">GRADE</span>';for(const i of Qe){const n=ne(P,i,x),a=O===i,l=n.available?Ye(P,i,x):null,r=dt[i],s=!n.available,c="pr-tier-btn"+(a?" active":"")+(s?" locked":"");t+=`<div class="${c}" onclick="${s?"":`setPrTier('${i}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${r};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${a?"var(--text-bright)":"var(--text-dim)"}">${He[i]}</span>
            </div>
            ${l!==null?`<div class="pr-tier-btn__price" style="color:${a?"var(--text-bright)":"var(--text-muted)"}">$${l}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}e.innerHTML=t}function ke(){const e=document.getElementById("pr-content"),t=ne(P,O,x),i=X.find(b=>b.key===P);if(!i)return;if(!t.available){e.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${f(i.name)} — ${He[O]} grade
                    is not produced domestically in ${f(x?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${f(t.failedStat||"unknown")} &lt; ${t.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const n=Ye(P,O,x),a=pt(P,O,x),l=n*se,r=a>3e3?"LOW":a>1e3?"MODERATE":"HIGH",s=r==="LOW"?"var(--green)":r==="MODERATE"?"var(--amber)":"var(--red)",c=Number(x?.inflation??50),o=c>55?"up":c<45?"down":"flat",d=o==="up"?"&#9650;":o==="down"?"&#9660;":"&#8212;",p=o==="up"?"var(--red)":o==="down"?"var(--green)":"var(--text-dim)";let u="";u+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${n}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${p}">${d}</span>
                </div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">SUPPLY/TICK</div>
                <div class="pr-market-cell__value" style="font-size:14px;color:var(--text-bright);margin-top:2px;">${a.toLocaleString()}</div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">DEMAND</div>
                <div class="pr-market-cell__value" style="font-size:12px;color:${s};margin-top:2px;">${r}</div>
            </div>
        </div>
    </div>`,u+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${f(x?.name||"—")})</div>`;for(const b of i.priceDrivers){const $=Number(x?.[b]??50),q=$>=50?"var(--green)":$>=30?"var(--amber)":$>=15?"var(--orange)":"var(--red)",y=ui[b]||b;u+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${f(b)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${$}%;background:${q}"></div>
            </div>
            <span class="pr-driver-row__val">${$}</span>
            <span class="pr-driver-row__effect">${f(y)}</span>
        </div>`}u+="</div>";const g=(Number(m?.corp_cash_reserves)||0)>=l,v=se>a,h=dt[O];u+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${f(i.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${h};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${h}">${He[O]}</span>
                </div>
                <span class="pr-order__mat-price">$${n}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(b=>`<span class="pr-qty-btn${se===b?" active":""}" onclick="setPrQty(${b})">${b>=1e3?b/1e3+"k":b}</span>`).join("")}
                </div>
            </div>
            ${v?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${a.toLocaleString()} this tick</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${L(l)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${g&&!v?"":"disabled"}
                    title="${g?v?"Exceeds supply":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,e.innerHTML=u}function fi(e){P=e,O="STD";for(const t of["STD","HIGH","LOW"])if(ne(e,t,x).available){O=t;break}Tt(),Je(),ke()}function vi(e){O=e,Je(),ke()}function yi(e){se=e,ke()}let Ne=!1;async function gi(){if(Ne||!m||!x)return;const e=Ye(P,O,x),t=pt(P,O,x),i=e*se,n=Number(m.corp_cash_reserves)||0;if(i>n){alert("Insufficient cash reserves.");return}if(se>t){alert("Exceeds available supply this tick.");return}Ne=!0;const a=document.querySelector(".pr-purchase-btn");a&&(a.disabled=!0,a.textContent="...");try{const l=n-i,{error:r}=await w.from("factions").update({corp_cash_reserves:l}).eq("id",m.id);if(r)throw r;const s=R[P]?.[O],c=(s?.qty||0)+se,o=(s?.value||0)+i,{error:d}=await w.from("corp_warehouse").upsert({faction_id:m.id,nation_id:m.nation_id,material_key:P,quality_tier:O,quantity:c,total_value:o,last_purchased_tick:B?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(d){const{error:p}=await w.from("factions").update({corp_cash_reserves:n}).eq("id",m.id);throw p&&console.error("Cash refund failed after warehouse error:",p.message),d}m.corp_cash_reserves=l,R[P]||(R[P]={}),R[P][O]={qty:c,value:o},Ke(),Et(),a&&(a.textContent="PURCHASED",setTimeout(()=>{a.isConnected&&(a.disabled=!1,a.textContent="PURCHASE")},1500))}catch(l){a&&(a.disabled=!1,a.textContent="PURCHASE"),alert("Purchase failed: "+(l.message||"Unknown error"))}finally{Ne=!1}}function It(e){const t=oe||x;if(!t)return[];const i=$e(e);if(!i)return[];const n=Dt(e,t),a=[],l=Number(t?.inflation??50),r=Number(t?.fuel_prices??50);Number(t?.manufacturing_output??50);const s=oe&&x&&oe.id!==x.id;let c=null;if(s&&(c=zt(t,x)),n.newAvailable>0){const o=nt(e,t),d=i.basePrice,p=Math.round(d*((l-50)/200)),u=Math.round(d*((r-50)/300));let _=o;const g=[{label:"Base price",value:L(d)},p!==0?{label:`Inflation (${l})`,mod:(p>=0?"+":"")+L(Math.abs(p))}:null,u!==0?{label:`Fuel transport (${r})`,mod:(u>=0?"+":"")+L(Math.abs(u))}:null].filter(Boolean),v=o-d-p-u;if(v!==0&&!s&&g.push({label:"Demand/scarcity",mod:(v>=0?"+":"")+L(Math.abs(v))}),s&&c){const h=Math.round(o*c.tariff),b=Math.round(o*c.transport);_=o+h+b,g.push({label:`Import tariff (${Math.round(c.tariff*100)}%)`,mod:"+"+L(h)}),g.push({label:`Transport (${c.deliveryTicks} tick${c.deliveryTicks>1?"s":""})`,mod:"+"+L(b)})}a.push({seller:s?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:s?c?.deliveryTicks||1:0,condition:100,price:Math.round(_),available:n.newAvailable,delivery:s?c.deliveryTicks+" tick"+(c.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:s?c.deliveryTicks:0,used:!1,priceFactors:g,sourceNationId:t.id})}if(n.usedAvailable>0){const o=n.usedCondition,d=nt(e,t,{used:!0,condition:o});let p=d;const u=[{label:"Base price",value:L(i.basePrice)},{label:`Condition (${o}%)`,mod:"-"+L(Math.max(0,i.basePrice-d))}];if(s&&c){const _=Math.round(d*c.tariff),g=Math.round(d*c.transport);p=d+_+g,u.push({label:`Import tariff (${Math.round(c.tariff*100)}%)`,mod:"+"+L(_)}),u.push({label:`Transport (${c.deliveryTicks} tick${c.deliveryTicks>1?"s":""})`,mod:"+"+L(g)})}a.push({seller:s?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:s?c?.deliveryTicks||1:0,condition:o,price:Math.round(p),available:n.usedAvailable,delivery:s?c.deliveryTicks+" tick"+(c.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:s?c.deliveryTicks:0,used:!0,priceFactors:u,sourceNationId:t.id})}return a}function Ee(){const e=Number(m?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=L(e);const t=$e(G),i=ve[t?.tier||1],n=document.getElementById("em-tier-badge");n&&(n.textContent=i.tag,n.style.color=i.color),n.style.background=i.color+"0a",n.style.border="1px solid "+i.color+"33";const a=document.getElementById("em-nation-select");if(a&&a.options.length===0){const s=x?.name||m?.nation||"—";let c=`<option value="">${f(s)} (HQ)</option>`;for(const o of _e)o.id!==x?.id&&(c+=`<option value="${o.id}">${f(o.name)}</option>`);a.innerHTML=c}const l=document.getElementById("em-import-tag"),r=oe&&x&&oe.id!==x.id;l&&(l.style.display=r?"":"none"),_i(),Xe()}function _i(){let e="";for(let t=1;t<=3;t++){const i=ve[t],n=ze(t),a=t===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";e+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${i.color}">${i.tag}</div>
            <div class="${a}">`;for(const l of n){const r=G===l.key,s=It(l.key).length>0;e+=`<span class="em-selector__btn${r?" active":""}${s?"":" no-listings"}"
                style="${r?"background:"+i.color+";border-color:"+i.color:""}"
                onclick="setEmType('${l.key}')">${f(l.name)}</span>`}e+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${e}</div>`}function Xe(){const e=document.getElementById("em-content");if(ee=It(G),ee.length===0){e.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}Q>=ee.length&&(Q=0);let t="";for(let n=0;n<ee.length;n++){const a=ee[n],l=Q===n,r=a.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",s=ct(a.condition);t+=`<div class="em-listing${l?" selected":""}" style="${l?"border-left-color:"+r:""}" onclick="setEmListing(${n})">`,t+=`<div class="em-listing__row1">
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
                    <div class="em-stat-cell__bar-track"><div class="em-stat-cell__bar-fill" style="width:${a.condition}%;background:${s}"></div></div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${s}">${a.condition}%</span>
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
        </div>`,l&&a.priceFactors&&(t+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${a.priceFactors.map(c=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${f(c.label)}</span>
                    <span class="em-breakdown__mod" style="color:${c.mod?c.mod.startsWith("-")?"var(--green)":c.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${c.mod||c.value}</span>
                </div>`).join("")}
            </div>`),t+="</div>"}const i=ee[Q];if(i){const n=$e(G),a=ve[n?.tier||1],l=Math.min(i.available,4),r=i.price*J,s=(Number(m?.corp_cash_reserves)||0)>=r;t+=`<div class="em-purchase"><div class="em-purchase__box">
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
                    ${Array.from({length:l},(c,o)=>o+1).map(c=>`<span class="em-qty-btn${J===c?" active":""}" style="${J===c?"background:"+a.color+";border-color:"+a.color:""}" onclick="setEmQty(${c})">${c}</span>`).join("")}
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
                    ${s?"":"disabled"}
                    title="${s?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}e.innerHTML=t}async function bi(e){if(!e)oe=null;else{let i=_e.find(n=>n.id===e);if(!i)try{const{data:n}=await w.from("nations").select("*").eq("id",e).single();i=n}catch{}oe=i||null}Q=0,J=1;const t=document.getElementById("em-nation-select");t&&(t.value=e||""),Ee()}function xi(e){G=e,Q=0,J=1,Ee()}function $i(e){Q=e,J=1,Xe()}function hi(e){J=e,Xe()}let Be=!1;async function wi(){if(Be)return;const e=ee[Q];if(!e||!m)return;const t=$e(G);if(!t)return;const i=J,n=e.price*i,a=Number(m.corp_cash_reserves)||0;if(n>a){alert("Insufficient cash reserves.");return}if(i>e.available){alert("Not enough units available.");return}const l=document.querySelector(".em-purchase-btn");l&&(l.disabled=!0,l.textContent="..."),Be=!0;try{const r=a-n,{error:s}=await w.from("factions").update({corp_cash_reserves:r}).eq("id",m.id);if(s)throw s;const c=!e.deliveryTicks||e.deliveryTicks===0;if(c){const d=V.find(q=>q.equipment_key===G),p=(d?.owned||0)+i,u=d?.purchase_price_avg||0,_=d?.owned||0,g=_>0?Math.round((u*_+e.price*i)/p):e.price,v=t.maintenancePerUnit*p,h=d?.condition||100,b=Math.round((h*_+e.condition*i)/p),{error:$}=await w.from("corp_equipment").upsert({faction_id:m.id,nation_id:m.nation_id,equipment_key:G,tier:t.tier,owned:p,deployed:d?.deployed||0,condition:b,maintenance_per_tick:v,purchase_price_avg:g,last_purchased_tick:B?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if($){const{error:q}=await w.from("factions").update({corp_cash_reserves:a}).eq("id",m.id);throw q&&console.error("Cash refund failed:",q.message),$}d?(d.owned=p,d.condition=b,d.maintenance_per_tick=v):V.push({equipment_key:G,tier:t.tier,owned:p,deployed:0,condition:b,maintenance_per_tick:v,assigned_projects:[]})}else{const d=(B?.current_tick||0)+e.deliveryTicks,{error:p}=await w.from("corp_equipment_deliveries").insert({faction_id:m.id,equipment_key:G,quantity:i,condition:e.condition,delivery_tick:d,source_nation_id:e.sourceNationId||null,seller_name:e.seller,price_paid:n});if(p){const{error:u}=await w.from("factions").update({corp_cash_reserves:a}).eq("id",m.id);throw u&&console.error("Cash refund failed:",u.message),p}}m.corp_cash_reserves=r,Ze(),Ee();const o=document.getElementById("pr-cash");o&&(o.textContent=L(r)),l&&(l.textContent=c?"PURCHASED":"ORDERED",setTimeout(()=>{l.isConnected&&(l.disabled=!1,l.textContent="PURCHASE")},1500))}catch(r){l&&(l.disabled=!1,l.textContent="PURCHASE"),alert("Purchase failed: "+(r.message||"Unknown error"))}finally{Be=!1}}let ki=-1,ue=[],Ve=[],Ct=[];function Pe(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function Ei(e,t,i){if(i)return"var(--orange)";const n=e/(t||1)*100;return n>50?"var(--green)":n>25?"var(--amber)":"var(--red)"}function Ti(){const e=document.getElementById("pm-list"),t=ue.length,i=Ve.length,n=Ct.length,a=ue.filter(c=>c.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${t})`,document.getElementById("pm-pending-count").textContent=`(${i})`,document.getElementById("pm-apply-count").textContent=`(${n})`;const l=document.getElementById("pm-badges");let r="";a>0&&(r+=`<span class="pm-badge pm-badge--expiring">${a} EXPIRING</span>`),i>0&&(r+=`<span class="pm-badge pm-badge--pending">${i} PENDING</span>`),l.innerHTML=r;const s=ue.reduce((c,o)=>c+(o.cost||0),0)+Ve.reduce((c,o)=>c+(o.cost||0),0);document.getElementById("pm-total-cost").textContent=Pe(s),document.getElementById("pm-footer-active").textContent=t,document.getElementById("pm-footer-pending").textContent=i;{if(t===0){e.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let c="";ue.forEach((o,d)=>{const p=ki===d,u=Ei(o.ticks_left,o.total_ticks,o.expiring_soon),_=Math.min(o.ticks_left/(o.total_ticks||1)*100,100);c+=`<div class="pm-item ${o.expiring_soon?"pm-item--expiring":""} ${p?"expanded":""}" onclick="togglePmExpand(${d})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${f(o.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${f((o.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${u}">Expires: ${f(o.expires||"")}</span>
                        <span class="pm-item__ticks">(${o.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${_}%;background:${u}"></div></div>`,p&&(c+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${f(o.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${f(o.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${Pe(o.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${o.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${o.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(o.projects||[]).map(g=>`<span class="pm-project-chip">${f(g)}</span>`).join("")}</div>
                    </div>`,o.note&&(c+=`<div class="pm-note"><span class="pm-note__text">${f(o.note)}</span></div>`),o.expiring_soon&&o.renewable&&(c+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew">RENEW — ${Pe(o.cost||0)}</button></div>`),c+="</div>"),c+="</div></div>"}),e.innerHTML=c;return}}function Ii(){ue=[],Ve=[],Ct=[],Ti()}let ie=[],Ci=-1;function Y(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function rt(e){return e>=85?"var(--gold)":e>=60?"var(--green)":e>=40?"var(--orange)":"var(--red)"}function Mi(e){return"dl-result--"+e.toLowerCase()}function lt(){const e=document.getElementById("dl-list"),t=ie.length;document.getElementById("dl-count").textContent=`${t} COMPLETED`;const i=ie.reduce((s,c)=>{const o=c.financials||{};return s+((o.payment||0)+(o.bonus||0)-(o.penalty||0)-(o.total_cost||0))},0),n=document.getElementById("dl-lifetime-profit");n.textContent=(i>=0?"+":"")+Y(i),n.style.color=i>=0?"var(--green)":"var(--red)";const a={};ie.forEach(s=>{a[s.result]=(a[s.result]||0)+1});const l=document.getElementById("dl-footer-results");if(l.innerHTML=Object.entries(a).map(([s,c])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[s]||"var(--text-dim)"}">${f(s)}</div>
            <div class="dl-footer__result-count">${c}</div>
        </div>`).join(""),t===0){e.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let r="";ie.forEach((s,c)=>{const o=Ci===c,d=s.financials||{},p=(d.payment||0)+(d.bonus||0)-(d.penalty||0)-(d.total_cost||0),u=p>=0,_=Mi(s.result),v={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[s.result]||"var(--text-dim)",h=s.type==="GOVERNMENT";if(r+=`<div class="dl-item ${o?"expanded":""}" onclick="toggleDlExpand(${c})">
            <div class="dl-item__inner" style="border-left:2px solid ${v}">
                <div class="dl-item__row1">
                    <span class="dl-item__name">${f(s.name)}</span>
                    <span class="dl-result-badge ${_}">${f(s.result)}</span>
                </div>
                <div class="dl-item__row2">
                    <span class="dl-item__id">${f(s.id)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                    <span class="dl-item__issuer" style="color:${h?"var(--green)":"var(--gold)"}">${f(s.issuer)}</span>
                    <span class="dl-item__date">${f(s.delivered)}</span>
                </div>
                <div class="dl-summary-bar">
                    <div class="dl-summary-cell" style="flex:1;">
                        <div class="dl-summary-label">QUALITY</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span class="dl-summary-value" style="color:${rt(s.quality_score)}">${s.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${s.rep_change>0?"var(--green)":s.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${s.rep_change>0?"+":""}${s.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${u?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${u?"var(--green)":"var(--red)"};margin-top:2px;">${u?"+":""}${Y(p)}</div>
                    </div>
                </div>`,o){const b=s.inspection||{};r+='<div style="margin-top:8px;">',r+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(M=>{const C=b[M]||{score:0,issues:[]},E=rt(C.score),T=Math.min(C.score/100*100,100);r+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${f(M.charAt(0).toUpperCase()+M.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${T}%;background:${E}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${E}">${C.score}</span>
                        </div>
                    </div>
                    ${(C.issues||[]).map(I=>`<div class="dl-inspect-issue">${f(I)}</div>`).join("")}
                </div>`});const $=b.permits||{passed:!0,issues:[]};r+=`<div class="dl-permits-row ${$.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${$.passed?"var(--green)":"var(--red)"}">${$.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${($.issues||[]).map(M=>`<div class="dl-inspect-issue dl-inspect-issue--red">${f(M)}</div>`).join("")}
            </div>`,r+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',r+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(s.materials_used||[]).forEach(M=>{const C=M.grade==="HIGH"?"var(--green)":M.grade==="STANDARD"?"var(--amber)":"var(--orange)",E=M.impact==="positive"?"▲":M.impact==="negative"?"▼":"–",T=M.impact==="positive"?"var(--green)":M.impact==="negative"?"var(--red)":"var(--text-dim)";r+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${f(M.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${C}"></div>
                    <span class="dl-mat-tag__grade" style="color:${C}">${f(M.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${T}">${E}</span>
                </div>`}),r+="</div>",r+='<div class="dl-section-label">Financial Summary</div>',r+='<div class="dl-fin-panel">',r+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${Y(d.contract_value||0)}</span></div>`,(d.bonus||0)>0&&(r+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${Y(d.bonus)}</span></div>`),(d.penalty||0)>0&&(r+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${Y(d.penalty)}</span></div>`);const q=(d.payment||0)+(d.bonus||0)-(d.penalty||0);r+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${Y(q)}</span></div>`,r+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${Y(d.total_cost||0)}</span></div>`,r+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${u?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${u?"var(--green)":"var(--red)"}">${u?"+":""}${Y(p)}</span>
            </div>`,r+="</div>";const y=s.timeline||{};r+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${y.actual||0}/${y.expected||0} ticks</span>`,y.early?r+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(y.expected||0)-(y.actual||0)} TICK${y.expected-y.actual!==1?"S":""} EARLY</span>`:!y.on_time&&y.actual>y.expected&&(r+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(y.actual||0)-(y.expected||0)} TICK${y.actual-y.expected!==1?"S":""} LATE</span>`),r+="</div>",r+="</div>"}r+="</div></div>"}),e.innerHTML=r}async function Si(){if(!m){ie=[],lt();return}const{data:e,error:t}=await w.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",m.id).order("delivered_at_tick",{ascending:!1}).limit(20);t?(console.warn("Failed to load deliveries:",t.message),ie=[]):ie=(e||[]).map(i=>{const n=i.construction_contracts||{};return{id:i.contract_id,name:n.name||"Project",type:n.issuer_type||"GOVERNMENT",issuer:n.issuer_name||"Government",delivered:"Tick "+(i.delivered_at_tick||0),result:i.result,quality_score:i.quality_score,rep_change:i.rep_change,financials:{contract_value:i.contract_value||0,bonus:i.quality_bonus||0,penalty:i.penalties||0,payment:i.payment_received||0,total_cost:i.total_cost||0},inspection:i.inspection||{},materials_used:i.materials_used||[],timeline:{expected:i.timeline_expected||0,actual:i.timeline_actual||0,on_time:i.on_time,early:i.timeline_actual<i.timeline_expected}}}),lt()}function Ze(){const e=V.reduce((s,c)=>s+(c.owned||0),0),t=V.reduce((s,c)=>s+(c.deployed||0),0),i=Rt(V),n=e-t;document.getElementById("eq-count").textContent=e+" UNITS",document.getElementById("eq-summary").innerHTML=`
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
        </div>`;const a={};for(const s of V)a[s.equipment_key]=s;let l="";for(let s=1;s<=3;s++){const c=ve[s],o=ze(s),d=Ge===s,p=o.reduce((_,g)=>_+(a[g.key]?.owned||0),0),u=o.reduce((_,g)=>_+(a[g.key]?.deployed||0),0);if(l+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${s})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${d?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${c.color}">${f(c.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${c.color};border:1px solid ${c.color}33;background:${c.color}0a">${c.tag}</span>
            </div>
            ${p>0?`<span class="eq-tier-hdr__count">${u}/${p}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,d)for(const _ of o){const g=a[_.key],v=g?.owned||0,h=g?.deployed||0,b=g?.condition||0,$=_.maintenancePerUnit*v,q=v-h,y=v>0&&q===0,M=v>0&&b<65,C=ct(b),E=g?.assigned_projects||[],T=E.length>0?E.map(I=>I.contract_name||"Project").join(", ").slice(0,30):v>0&&h>0?h+" project"+(h>1?"s":""):"—";l+=`<div class="eq-row${v===0?" unowned":""}">`,l+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${v===0?" dim":""}">${f(_.name)}</span>
                        ${M?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${v>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${y?"var(--orange)":"var(--green)"}">${q}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${h}/${v}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,v>0?l+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${b}%;background:${C}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${C}">${b}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${f(T)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${L($)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:l+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',l+="</div>"}}document.getElementById("eq-list").innerHTML=l;const r=[1,2,3].map(s=>{const c=ve[s],o=ze(s).reduce((d,p)=>d+(a[p.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${o>0?c.color+"33":"var(--border-0)"};background:${o>0?c.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${c.color}">${c.tag}</div>
            <div class="eq-footer__tier-count" style="color:${o>0?"var(--text-bright)":"var(--text-dim)"}">${o}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${L(i)}</div>
        </div>
        <div class="eq-footer__tiers">${r}</div>`}function qi(e){Ge=Ge===e?-1:e,Ze()}async function Ai(){if(!m)return;const{data:e,error:t}=await w.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",m.id);t?(console.warn("Failed to load equipment:",t.message),V=[]):V=e||[],Ze()}async function Li(){const{data:{user:e}}=await w.auth.getUser();if(!e){window.location.href="login.html";return}const{data:t}=await w.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);me=(t||[]).filter(o=>o.nation_id);const i=sessionStorage.getItem("active_faction_id");if(m=me.find(o=>o.id===i)||me.find(o=>o.faction_type==="corporation")||me[0],!m){await w.auth.signOut(),window.location.href="login.html";return}if(m.faction_type!=="corporation"){window.location.href="dashboard.html";return}const[n,a]=await Promise.all([m.nation_id?w.from("nations").select("*").eq("id",m.nation_id).single():Promise.resolve({data:null}),w.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);n.error&&console.warn("Nation load failed:",n.error.message),n.data&&(x=n.data),a.error&&console.warn("Shard load failed:",a.error.message),B=a.data;const l=m.corp_ticker||m.abbreviation||"";if(document.getElementById("corp-logo").textContent=l.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=m.faction_name||"Unnamed Corp",B){if(document.getElementById("game-date").textContent=B.current_date||"—",document.getElementById("tick-number").textContent=B.current_tick||"—",B.next_tick_at){const d=(Number(B.tick_interval_hours)||8)*36e5,p=new Date(B.next_tick_at).getTime(),_=p-d+d/2;Ue=new Date(_>Date.now()?_:p+d/2),jt()}const o=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");o&&(o.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(l?"["+l+"]":m.faction_name||"Corp")+" ▾";const r=document.getElementById("topbar-cash");if(r){const o=Number(m.corp_cash_reserves??0),d=o>=1e9?"$"+(o/1e9).toFixed(1)+"B":o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k";r.textContent="CASH: "+d}const s=m.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+s+" AP</span>",document.getElementById("nation-pill").textContent=(x?.name||m.nation||"—").toUpperCase();const c=document.getElementById("corp-faction-dropdown");if(c){let o="";for(const d of me){const p=d.id===m.id,u=d.faction_type==="corporation"?"CORP":"PARTY",_=d.faction_type==="corporation"?"var(--teal)":"var(--amber)";o+=`<div class="corp-dd-item${p?" active":""}" onclick="switchToFaction('${d.id}', '${d.faction_type}')">
                <span class="corp-dd-type" style="color:${_}">${u}</span>
                <span class="corp-dd-name">${f(d.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${f(d.abbreviation||"—")}]</span>
            </div>`}c.innerHTML=o}await Promise.all([$t(),ht(),mi(),Ai(),Ii(),Si()]);try{const{data:o}=await w.from("nations").select("*").order("name");_e=o||[]}catch{_e=[]}if(Et(),Ee(),Ot(m,x,B),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",new URLSearchParams(window.location.search).get("tab")==="expansion"){const o=document.querySelector('[data-tab="expansion"]');o&&St({preventDefault:()=>{},target:o})}}async function Ni(){await w.auth.signOut(),window.location.href="login.html"}function Bi(){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.toggle("open")}function Pi(e,t){const i=document.getElementById("corp-faction-dropdown");i&&i.classList.remove("open"),sessionStorage.setItem("active_faction_id",e),t==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",e=>{const t=document.getElementById("faction-switcher"),i=document.getElementById("corp-faction-dropdown");i&&t&&!t.contains(e.target)&&i.classList.remove("open")});document.addEventListener("keydown",e=>{e.key==="Escape"&&yt()});window.doLogout=Ni;window.toggleTheme=Gt;window.toggleCorpDropdown=Bi;window.switchToFaction=Pi;window.setFilter=Ut;window.openContractDetail=vt;window.closeContractDetail=yt;window.placeBid=ci;window.toggleWhRow=pi;window.toggleEqTier=qi;window.switchEmNation=bi;window.setEmType=xi;window.setEmListing=$i;window.setEmQty=hi;window.purchaseEquipment=wi;window.setPrMat=fi;window.setPrTier=vi;window.setPrQty=yi;window.purchaseMaterial=gi;let j={general:0,skilled:0,innovative:0},Oe=!1;const ye=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function Mt(e){const t=Number(x?.minimum_wage??50),i=Number(x?.inflation??50),n=Number(x?.standard_of_living??50),a=t/100*48e3,l=1+(i-50)/100*.5,r=1+(n-50)/100*.5;return Math.round(a*e*l*r)}function S(e){const t=Math.abs(e),i=e<0?"-":"";return t>=1e9?i+"$"+(t/1e9).toFixed(2)+"B":t>=1e6?i+"$"+(t/1e6).toFixed(2)+"M":t>=1e3?i+"$"+(t/1e3).toFixed(1)+"k":i+"$"+t.toLocaleString()}async function St(e){e.preventDefault(),document.getElementById("operations-content").style.display="none";const t=document.getElementById("expansion-content");t.style.display="flex",t.style.justifyContent="center",t.style.gap="12px",t.style.alignItems="flex-start",t.style.flexWrap="wrap",document.querySelectorAll(".corp-nav__tab").forEach(i=>i.classList.remove("active")),e.target.classList.add("active"),Te(),zi(),await et(),Ie(),await tt(),Ce()}function qt(e){e&&e.preventDefault(),document.getElementById("operations-content").style.display="",document.getElementById("expansion-content").style.display="none",document.querySelectorAll(".corp-nav__tab").forEach(t=>t.classList.remove("active")),document.querySelector('[data-tab="operations"]')?.classList.add("active")}function At(){return K.reduce((t,i)=>{const n=Number(i.capacity||0),a=Number(i.condition||0)/100;return t+Math.floor(n*a)},0)+500}function Oi(e,t){const i=ye.find(l=>l.id===e),n=Number(m?.[i.factionKey]??0),a=j[e]+t;if(!(n+a<0)){if(t>0){const l=ye.reduce((s,c)=>{const o=Number(m?.[c.factionKey]??0),d=c.id===e?a:j[c.id];return s+o+d},0),r=At();if(l>r)return}j[e]=a,Te()}}function Ri(e){e?j[e]=0:j={general:0,skilled:0,innovative:0},Te()}async function Di(){if(Oe||!Object.values(j).some(a=>a!==0))return;let t=0;for(const a of ye){const l=j[a.id];l>0&&(t+=l*Mt(a.multiplier)*.1)}const i=Number(m?.corp_cash_reserves??0);if(t>i){alert("Insufficient cash reserves. Hiring cost: "+S(t)+", available: "+S(i));return}const n=t>0?`Confirm workforce changes?

Hiring fee: `+S(t)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(n)){Oe=!0;try{const a={};for(const s of ye){const c=Number(m?.[s.factionKey]??0);a[s.factionKey]=Math.max(0,c+j[s.id])}t>0&&(a.corp_cash_reserves=Math.max(0,i-Math.round(t)));const{error:l}=await w.from("factions").update(a).eq("id",m.id);if(l)throw l;Object.assign(m,a),j={general:0,skilled:0,innovative:0};const r=document.getElementById("topbar-cash");if(r){const s=Number(m.corp_cash_reserves??0);r.textContent="CASH: "+(s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k")}Te()}catch(a){alert("Error: "+a.message)}finally{Oe=!1}}}function Te(){const e=document.getElementById("hf-card-container");if(!e)return;const t="'JetBrains Mono', monospace",i={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=Number(x?.minimum_wage??50),a=Number(x?.inflation??50),l=Number(x?.standard_of_living??50),r=n/100*48e3,s=(1+(a-50)/100*.5).toFixed(2),c=(1+(l-50)/100*.5).toFixed(2),o=x?.name||m?.nation||"Nation",d=Object.values(j).some($=>$!==0),p=At();let u=0,_=0,g=0,v=0,h="";for(const $ of ye){const q=Number(m?.[$.factionKey]??0),y=j[$.id],M=q+y,C=Mt($.multiplier),E=y>0,T=q*C,I=M*C,z=I-T;u+=q,_+=M,g+=T,v+=I;const F=y!==0?E?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";h+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${i.border};background:${F};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${$.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${i.text}">${$.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${i.text}">${q.toLocaleString()}</span>
                    ${y!==0?`<span style="font-family:${t};font-size:10px;color:${i.dim}">→</span>
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${E?i.greenBright:i.red}">${M.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${t};font-size:8px;color:${i.dim}">WAGE (MIN × ${$.multiplier}.0 × ${s} × ${c})</span>
                <span style="font-family:${t};font-size:10px;color:${$.color}">${S(C)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${$.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${i.red};border:1px solid ${i.border};cursor:pointer;background:${i.card}">-50</div>
                <div onclick="hfSetChange('${$.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${i.redDim};border:1px solid ${i.border};cursor:pointer;background:${i.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${y!==0?i.card:"transparent"};border:1px solid ${y!==0?i.border:"transparent"}">
                    ${y!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${t};font-size:12px;font-weight:700;color:${E?i.greenBright:i.red}">${E?"+":""}${y}</span>
                        <span onclick="hfReset('${$.id}')" style="font-family:${t};font-size:8px;color:${i.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${t};font-size:9px;color:${i.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${$.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${i.greenBright};border:1px solid ${i.border};cursor:pointer;background:${i.card}">+10</div>
                <div onclick="hfSetChange('${$.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${i.greenBright};border:1px solid ${i.border};cursor:pointer;background:${i.card}">+50</div>
            </div>
            ${y!==0?`<div style="margin-top:6px;padding:4px 8px;background:${i.bg};border:1px solid ${i.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${t};font-size:8px;color:${i.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${z>0?i.red:i.greenBright}">${z>0?"+":""}${S(z)}/yr</span>
            </div>`:""}
        </div>`}const b=v-g;e.innerHTML=`
    <div style="width:380px;height:450px;background:${i.surface};border:1px solid ${i.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${i.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${i.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${i.muted};text-transform:uppercase">Hire / Fire</span>
            </div>
            <span style="font-family:${t};font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;color:${i.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${o.toUpperCase()}</span>
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
                        <div style="font-family:${t};font-size:7px;color:${i.dim}">×${s}</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;">
                        <div style="font-family:${t};font-size:7px;color:${i.dim};letter-spacing:0.5px">STD OF LIVING</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${i.text}">${l}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${i.dim}">×${c}</div>
                    </div>
                </div>
            </div>
            ${h}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${i.border};background:${i.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;${d?"margin-bottom:6px;":""}">
                <div>
                    <div style="font-family:${t};font-size:7px;color:${i.dim};letter-spacing:0.8px">WORKFORCE / CAPACITY</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <span style="font-family:${t};font-size:13px;font-weight:700;color:${_>p?i.red:i.text}">${d?_.toLocaleString():u.toLocaleString()}</span>
                        <span style="font-family:${t};font-size:9px;color:${i.dim}">/ ${p.toLocaleString()}</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${t};font-size:7px;color:${i.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${i.text}">${S(g)}</span>
                        ${d?`<span style="font-family:${t};font-size:9px;color:${i.dim}">→</span>
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${b>0?i.red:i.greenBright}">${S(v)}</span>`:""}
                    </div>
                </div>
            </div>
            ${d?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${i.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${t};font-size:8px;color:${i.dim}">NET CHANGE</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${b>0?i.red:i.greenBright}">${b>0?"+":""}${S(b)}/yr</span>
                    <span style="font-family:${t};font-size:8px;color:${i.dim}">(${b>0?"+":""}${S(Math.round(b/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${t};font-size:8px;font-weight:700;letter-spacing:1px;color:${i.dim};border:1px solid ${i.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${t};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${i.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}function zi(){const e=document.getElementById("wf-summary-container");if(!e)return;const t="'JetBrains Mono', monospace",i={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},n=(x?.name||m?.nation||"Nation").toUpperCase(),a=Number(x?.minimum_wage??50),l=Number(x?.inflation??50),r=Number(x?.standard_of_living??50),s=a/100*48e3,c=1+(l-50)/100*.5,o=1+(r-50)/100*.5,d=[{label:"General Workforce",mult:2,color:i.accent,key:"corp_general_workforce",countColor:i.text},{label:"Skilled Workforce",mult:3,color:i.gold,key:"corp_skilled_workforce",countColor:i.blue},{label:"Innovative Workforce",mult:6,color:i.orange,key:"corp_innovative_workforce",countColor:i.gold}];let p=0,u=0,_="";for(const g of d){const v=Number(m?.[g.key]??0),h=Math.round(s*g.mult*c*o),b=v*h;p+=v,u+=b,_+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${i.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${i.text}">${g.label}</span>
                    <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${i.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${n}</span>
                </div>
                <span style="font-family:${t};font-size:16px;font-weight:700;color:${g.countColor}">${v.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${t};font-size:8px;color:${i.dim}">WAGE (MIN × ${g.mult}.0 × ${c.toFixed(2)} × ${o.toFixed(2)})</span>
                <span style="font-family:${t};font-size:10px;color:${i.muted}">${S(h)}/yr</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1px;">
                <span style="font-family:${t};font-size:8px;color:${i.dim}">TOTAL ANNUAL COST</span>
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${i.text}">${S(b)}</span>
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
            ${_}
            <div style="padding:8px 12px;background:${i.card};border-bottom:1px solid ${i.border};">
                <div style="font-family:${t};font-size:8px;letter-spacing:1px;color:${i.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="font-family:${t};font-size:8px;color:${i.dim}">MINIMUM WAGE (${n})</span>
                    <span style="font-family:${t};font-size:9px;color:${i.text}">${a}/100 → ${S(s)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${t};font-size:8px;color:${i.dim}">INFLATION MODIFIER</span>
                    <span style="font-family:${t};font-size:9px;color:${i.text}">×${c.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${t};font-size:8px;color:${i.dim}">STD OF LIVING MODIFIER</span>
                    <span style="font-family:${t};font-size:9px;color:${i.text}">×${o.toFixed(2)}</span>
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
    </div>`}let K=[];async function et(){if(!m?.id)return;const{data:e}=await w.from("corp_properties").select("*").eq("faction_id",m.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});K=e||[]}function Ie(){const e=document.getElementById("property-card-container");if(!e)return;const t="'JetBrains Mono', monospace",i={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=(x?.name||m?.nation||"Nation").toUpperCase();let a="",l=0,r=0;K.length===0&&(a=`<div style="padding:20px;text-align:center;font-family:${t};font-size:10px;color:${i.dim}">No properties owned.<br>Purchase from the marketplace →</div>`);for(const s of K){const c=xe[s.style]||xe.Basic;l+=Number(s.purchase_price||0),r+=Number(s.monthly_maintenance||0),a+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${i.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:${i.text}">${s.name}</span>
                <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${i.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">OWNED</span>
            </div>
            <div style="font-family:${t};font-size:8px;color:${i.dim};margin-bottom:4px;">${s.city||n} · ${(s.type||"").replace(/_/g," ")} · <span style="color:${c.color}">${(s.style||"Basic").toUpperCase()}</span></div>
            <div style="display:flex;gap:0;background:${i.card};border:1px solid ${i.border}">
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${i.border}">
                    <div style="font-family:${t};font-size:7px;color:${i.dim}">CAPACITY</div>
                    <div style="font-family:${t};font-size:10px;font-weight:700;color:${i.text}">${(s.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${i.border}">
                    <div style="font-family:${t};font-size:7px;color:${i.dim}">PAID</div>
                    <div style="font-family:${t};font-size:10px;font-weight:700;color:${i.gold}">${S(s.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px">
                    <div style="font-family:${t};font-size:7px;color:${i.dim}">MAINT/MO</div>
                    <div style="font-family:${t};font-size:10px;font-weight:700;color:${i.red}">${S(s.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="margin-top:4px;display:flex;justify-content:space-between;">
                <span style="font-family:${t};font-size:7px;color:${i.dim}">CONDITION</span>
                <span style="font-family:${t};font-size:9px;color:${s.condition>=75?"#5c5":s.condition>=50?"#ca5":i.orange}">${s.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:${i.border};margin-top:2px;"><div style="width:${s.condition}%;height:100%;background:${s.condition>=75?"#5c5":s.condition>=50?"#ca5":i.orange}"></div></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <div onclick="propRefurbish('${s.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${t};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${i.accent};border:1px solid ${i.accent}33;cursor:pointer;">REFURBISH (${S(Math.round((s.purchase_price||0)*.1))})</div>
                <div onclick="propSell('${s.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${t};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${i.red};border:1px solid ${i.red}33;cursor:pointer;">SELL</div>
            </div>
        </div>`}e.innerHTML=`
    <div style="width:380px;height:450px;background:${i.surface};border:1px solid ${i.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${i.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${i.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${i.muted};text-transform:uppercase">Property</span>
            </div>
            <span style="font-family:${t};font-size:10px;color:${i.muted}">${K.length} ASSET${K.length!==1?"S":""}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${a}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${i.border};background:${i.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                <span style="font-family:${t};font-size:8px;color:${i.dim};letter-spacing:0.8px">TOTAL VALUE</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${i.green}">${S(l)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${t};font-size:8px;color:${i.dim};letter-spacing:0.8px">TOTAL MAINTENANCE</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${i.red}">${S(r)}/mo</span>
            </div>
        </div>
    </div>`}let de=[],H=null;const xe={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function tt(){if(!m?.nation_id)return;const{data:e,error:t}=await w.from("available_properties").select("*").eq("nation_id",m.nation_id).eq("status","available").order("price",{ascending:!0});if(t){console.warn("[Property] Failed to load marketplace:",t.message);return}de=(e||[]).map(i=>({...i,adjusted_cost:i.price,adjusted_maintenance:i.monthly_maintenance}))}function Ce(){const e=document.getElementById("new-property-container");if(!e)return;const t="'JetBrains Mono', monospace",i={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"};(x?.name||m?.nation||"Nation").toUpperCase();const n=Number(x?.standard_of_living??50),a=Number(x?.gdp_growth??50),l=Number(x?.inflation??50),r=x?.capital||"Capital",s={capital:r,port:r+" Port",industrial:r+" Industrial Zone",suburban:r+" Suburbs",coastal:r+" Coast"};let c="";if(de.length===0)c=`<div style="padding:20px;text-align:center;font-family:${t};font-size:10px;color:${i.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let o=0;o<de.length;o++){const d=de[o],p=H===o,u=xe[d.style]||xe.Basic,_=s[d.city_template]||r;c+=`
            <div onclick="npSelect(${o})" style="padding:8px 14px;border-bottom:1px solid ${i.border};cursor:pointer;border-left:2px solid ${p?i.accent:"transparent"};background:${p?"rgba(139,154,107,0.03)":"transparent"};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <span style="font-size:11px;font-weight:600;color:${i.text}">${d.name}</span>
                    <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${u.color};background:${u.color}12;border:1px solid ${u.color}25">${u.label}</span>
                </div>
                <div style="font-family:${t};font-size:8px;color:${i.dim};margin-bottom:5px;">${_} · ${d.type.replace(/_/g," ")}</div>
                <div style="display:flex;gap:0;background:${i.card};border:1px solid ${i.border}">
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${i.border}">
                        <div style="font-family:${t};font-size:7px;color:${i.dim};letter-spacing:0.5px">CAPACITY</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${i.text};margin-top:1px">${d.capacity.toLocaleString()}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${i.border}">
                        <div style="font-family:${t};font-size:7px;color:${i.dim};letter-spacing:0.5px">PRICE</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${i.gold};margin-top:1px">${S(d.adjusted_cost)}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px">
                        <div style="font-family:${t};font-size:7px;color:${i.dim};letter-spacing:0.5px">MAINT/MO</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${i.redDim};margin-top:1px">${S(d.adjusted_maintenance)}</div>
                    </div>
                </div>
                ${p?`<div style="margin-top:5px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:${t};font-size:7px;color:${i.dim}">CONDITION</span>
                        <span style="font-family:${t};font-size:9px;color:${d.condition>=75?i.greenBright:d.condition>=50?i.yellow:i.orange}">${d.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${i.border}"><div style="width:${d.condition}%;height:100%;background:${d.condition>=75?i.greenBright:d.condition>=50?i.yellow:i.orange}"></div></div>
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
                <span style="font-family:${t};font-size:9px;font-weight:700;color:${l<=50?i.greenBright:i.red}">${Math.round(l)}</span>
            </div>
        </div>
        <div style="flex:1;overflow:auto;">
            ${c}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${i.border};background:${i.card};flex-shrink:0;">
            <div style="display:flex;gap:6px;justify-content:space-between;">
                <div onclick="npOpenConstructionModal()" style="flex:1;padding:6px 0;text-align:center;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${i.gold};border:1px solid ${i.gold}44;cursor:pointer">CONSTRUCTION PROJECT</div>
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${H!==null?"#000":i.dim};background:${H!==null?i.accent:"transparent"};border:1px solid ${H!==null?i.accent:i.border};cursor:${H!==null?"pointer":"default"};opacity:${H!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function Hi(e){H=H===e?null:e,Ce()}let Re=!1;async function ji(){if(H===null||Re)return;const e=de[H];if(!e)return;const t=Number(m?.corp_cash_reserves??0);if(e.adjusted_cost>t){alert(`Insufficient cash reserves.
Property: `+S(e.adjusted_cost)+`
Cash: `+S(t));return}if(confirm('Buy "'+e.name+'" for '+S(e.adjusted_cost)+`?

Monthly maintenance: `+S(e.adjusted_maintenance)+`/mo
Condition: `+e.condition+`%

This will be deducted from your cash reserves.`)){Re=!0;try{const{error:i}=await w.from("corp_properties").insert({faction_id:m.id,nation_id:m.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,purchase_price:e.adjusted_cost,monthly_maintenance:e.adjusted_maintenance,condition:e.condition,city:e.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(i)throw i;const n=Math.max(0,t-e.adjusted_cost),{error:a}=await w.from("factions").update({corp_cash_reserves:n}).eq("id",m.id);if(a)throw a;m.corp_cash_reserves=n,e.id&&await w.from("available_properties").update({status:"sold",purchased_by:m.id}).eq("id",e.id);const l=document.getElementById("topbar-cash");l&&(l.textContent="CASH: "+(n>=1e6?"$"+(n/1e6).toFixed(1)+"M":"$"+Math.round(n/1e3)+"k")),H=null,await tt(),Ce(),Ie(),alert("Property purchased: "+e.name+`

Deducted: `+S(e.adjusted_cost))}catch(i){alert("Purchase failed: "+i.message)}finally{Re=!1}}}const ae={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let it=!1,k={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},De=!1;function Lt(){const t=1+(Number(x?.inflation??50)-50)/100*.3,i=ae[k.style]?.costMod||1,n=Math.round(k.size*1e5*t*i),a=Math.round(n*(1+k.budgetMod/100)),l=Math.round(a*.007*(ae[k.style]?.maintMod||1));return{baseBudget:n,adjusted:a,maint:l,inflMod:t,styleMod:i}}function Gi(){it=!0,k={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},Nt()}function at(){it=!1,document.getElementById("cp-modal-overlay")?.remove()}function Ui(e,t){k[e]=t,Nt()}async function Fi(){if(!(De||!k.name.trim())){De=!0;try{const e=Lt(),t=x?.name||m?.nation||"Unknown",i=ae[k.style]?.repGain||1,n=await w.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),a=n.data?.current_tick||0,l=(n.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:r}=await w.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",m.nation_id).eq("issuer_type","PRIVATE"),c=`PVT-C${(r||0)+1}-${l}`,{error:o}=await w.from("construction_contracts").insert({nation_id:m.nation_id,template_key:"custom_building",sector:"civil_engineering",name:k.name.trim(),description:`${k.type} (${k.style}) — ${k.size.toLocaleString()} employees, commissioned by ${m.faction_name}`,project_code:c,budget_ceiling:e.adjusted,timeline_ticks:k.timeline,required_materials:(()=>{const d=k.size/1e3,p=k.style,u={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[p]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},_=(g,v)=>Math.max(1,Math.ceil(d*g*v));return{concrete:_(8,u.concrete),steel:_(6,u.steel),glass_facades:_(3,u.glass),em_systems:_(4,u.em),lumber:_(1,u.lumber),heavy_parts:_(2,u.heavy),aggregate:_(3,u.agg)}})(),required_equipment:(()=>{const d=["work_trucks","concrete_mixers"];return k.size>1e3&&d.push("excavators","tower_cranes"),k.size>3e3&&d.push("bulldozers","heavy_haulers"),k.size>8e3&&d.push("pile_drivers"),d})(),required_workforce:{general:Math.ceil(k.size*.08),skilled:Math.ceil(k.size*.03)},status:"open",generated_at_tick:a,bidding_ends_tick:a+3,issuer_type:"PRIVATE",issuer_name:m.faction_name,issuer_faction_id:m.id});if(o)throw o;at(),alert(`Construction project submitted!

Project: `+k.name.trim()+`
Code: `+c+`
Budget: `+S(e.adjusted)+`
Expected Reputation: +`+i+`

All construction corporations in `+t+" can now bid on this project.")}catch(e){alert("Failed to submit project: "+e.message)}finally{De=!1}}}function Nt(){if(document.getElementById("cp-modal-overlay")?.remove(),!it)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=Lt(),n=x?.name||m?.nation||"Nation",a=ae[k.style]?.repGain||1,l=a>=4?t.gold:a>=3?t.greenBright:a>=2?t.accent:t.dim,r=Object.entries(ae).map(([o,d])=>{const p=k.style===o;return`<div onclick="cpSetField('style','${o}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${p?d.color+"18":"transparent"};border:1px solid ${p?d.color+"44":t.border};">
            <div style="font-family:${e};font-size:9px;font-weight:700;color:${p?d.color:t.dim}">${o}</div>
            <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">×${d.costMod.toFixed(1)} cost</div>
        </div>`}).join(""),s=document.createElement("div");s.id="cp-modal-overlay",s.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",s.innerHTML=`
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
                <input id="cp-name-input" value="${k.name.replace(/"/g,"&quot;")}" placeholder="e.g., McKenna Tower"
                    style="width:100%;padding:6px 10px;font-family:${e};font-size:11px;color:${t.text};background:${t.card};border:1px solid ${t.border};outline:none;box-sizing:border-box;" />
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Type</div>
                <div style="display:flex;gap:4px;">
                    ${["Regional HQ","Office Building"].map(o=>`<span onclick="cpSetField('type','${o}')" style="flex:1;text-align:center;padding:5px 0;font-family:${e};font-size:9px;font-weight:700;cursor:pointer;color:${k.type===o?"#000":t.dim};background:${k.type===o?t.accent:"transparent"};border:1px solid ${k.type===o?t.accent:t.border}">${o}</span>`).join("")}
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase">Size (Employees)</span>
                    <span style="font-family:${e};font-size:14px;font-weight:700;color:${t.text}">${k.size.toLocaleString()}</span>
                </div>
                <input type="range" min="500" max="18000" step="500" value="${k.size}" oninput="cpSetField('size',+this.value)"
                    style="width:100%;accent-color:${t.accent};height:4px;" />
                <div style="display:flex;justify-content:space-between;font-family:${e};font-size:7px;color:${t.dim};margin-top:2px">
                    <span>500 min</span><span>18,000 max</span>
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Style</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">${r}</div>
                <div style="margin-top:4px;font-family:${e};font-size:8px;color:${ae[k.style].color}">${ae[k.style].desc}</div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase">Timeline</span>
                    <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.text}">${k.timeline} months</span>
                </div>
                <input type="range" min="24" max="60" step="6" value="${k.timeline}" oninput="cpSetField('timeline',+this.value)"
                    style="width:100%;accent-color:${t.gold};height:4px;" />
                <div style="display:flex;justify-content:space-between;font-family:${e};font-size:7px;color:${t.dim};margin-top:2px">
                    <span>24 months</span><span>60 months</span>
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Budget</div>
                <div style="background:${t.card};border:1px solid ${t.border};padding:8px 10px;">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border}">
                        <span style="font-family:${e};font-size:8px;color:${t.dim}">BASE (${k.size.toLocaleString()} × $100k × ${i.inflMod.toFixed(2)} × ${i.styleMod.toFixed(1)})</span>
                        <span style="font-family:${e};font-size:9px;color:${t.muted}">${S(i.baseBudget)}</span>
                    </div>
                    <div style="padding:6px 0">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                            <span style="font-family:${e};font-size:8px;color:${t.dim}">ADJUSTMENT</span>
                            <span style="font-family:${e};font-size:10px;font-weight:700;color:${k.budgetMod>0?t.greenBright:k.budgetMod<0?t.red:t.dim}">${k.budgetMod>0?"+":""}${k.budgetMod}%</span>
                        </div>
                        <input type="range" min="-15" max="15" step="1" value="${k.budgetMod}" oninput="cpSetField('budgetMod',+this.value)"
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
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${l}">+${a}</span>
                </div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:2px">${k.style} style · ${a===5?"Maximum prestige":a>=4?"Impressive presence":a>=3?"Strong statement":a>=2?"Solid investment":"Functional addition"}</div>
            </div>

        </div>
        <div style="padding:10px 16px;border-top:1px solid ${t.border};background:${t.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${e};font-size:7px;color:${t.dim}">TOTAL PROJECT</div>
                <div style="font-family:${e};font-size:14px;font-weight:700;color:${t.gold}">${S(i.adjusted)}</div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="cpClose()" style="padding:5px 16px;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:5px 16px;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${t.gold};cursor:pointer;opacity:${k.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(s);const c=document.getElementById("cp-name-input");c&&c.addEventListener("input",o=>{k.name=o.target.value}),s.addEventListener("click",o=>{o.target===s&&at()})}function Wi(){const e=document.getElementById("cp-name-input");if(e&&(k.name=e.value),!k.name.trim()){alert("Please enter a building name.");return}Fi()}window.cpClose=at;window.cpSetField=Ui;window.cpSubmitFromModal=Wi;window.npSelect=Hi;window.npBuyProperty=ji;window.npOpenConstructionModal=Gi;let pe=!1;async function Vi(e){if(pe)return;const t=K.find(r=>r.id===e);if(!t)return;const i=Math.round((t.purchase_price||0)*.1),n=Number(m?.corp_cash_reserves??0);if(i>n){alert("Insufficient cash. Refurbishment costs "+S(i)+", you have "+S(n));return}if(t.condition>=95){alert("Property is already in excellent condition ("+t.condition+"%).");return}const a=5+Math.floor(Math.random()*21),l=Math.min(100,t.condition+a);if(confirm('Refurbish "'+t.name+`"?

Cost: `+S(i)+`
Expected improvement: +`+a+"% condition ("+t.condition+"% → "+l+"%)")){pe=!0;try{await w.from("corp_properties").update({condition:l}).eq("id",e);const r=Math.max(0,n-i);await w.from("factions").update({corp_cash_reserves:r}).eq("id",m.id),m.corp_cash_reserves=r;const s=document.getElementById("topbar-cash");s&&(s.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")),await et(),Ie(),alert("Refurbished! Condition: "+t.condition+"% → "+l+"%")}catch(r){alert("Refurbishment failed: "+r.message)}finally{pe=!1}}}async function Yi(e){if(pe)return;const t=K.find(a=>a.id===e);if(!t)return;const i=(t.condition||50)/100,n=Math.round((t.purchase_price||0)*.6*i);if(confirm('Sell "'+t.name+`"?

Sale value: `+S(n)+" (60% × "+t.condition+`% condition)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){pe=!0;try{await w.from("corp_properties").update({is_active:!1}).eq("id",e);const l=Number(m?.corp_cash_reserves??0)+n;await w.from("factions").update({corp_cash_reserves:l}).eq("id",m.id),m.corp_cash_reserves=l;const s=(await w.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await w.from("available_properties").insert({nation_id:m.nation_id,catalog_id:t.catalog_id||null,name:t.name,type:t.type,style:t.style,capacity:t.capacity,price:Math.round(n*1.1),monthly_maintenance:t.monthly_maintenance,condition:t.condition,city:t.city,generated_at_tick:s,expires_at_tick:s+6,status:"available"});const c=document.getElementById("topbar-cash");c&&(c.textContent="CASH: "+(l>=1e6?"$"+(l/1e6).toFixed(1)+"M":"$"+Math.round(l/1e3)+"k")),await et(),Ie(),await tt(),Ce(),alert('Sold "'+t.name+'" for '+S(n))}catch(a){alert("Sale failed: "+a.message)}finally{pe=!1}}}window.propRefurbish=Vi;window.propSell=Yi;window.switchToExpansion=St;window.switchToOperations=qt;window.hfSetChange=Oi;window.hfReset=Ri;window.hfConfirm=Di;document.querySelector('[data-tab="operations"]')?.addEventListener("click",function(e){this.classList.contains("active")||(e.preventDefault(),qt(e))});Li();
