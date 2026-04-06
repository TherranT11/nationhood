import{_ as $}from"./supabase-client-BXEzLDpS.js";import{e as x}from"./utils-C2W-HleY.js";import{initMessaging as ln}from"./messaging-B5Fng3EZ.js";import{c as dn,a as Gt,E as Ye,b as st,d as Ti,e as cn,f as pn,h as $i}from"./equipment-DsuDdEne.js";const Ci={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},ue=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"manufacturing_output",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:50},{stat:"higher_education",min:40}]}},priceDrivers:["manufacturing_output","inflation","fuel_prices","urbanization"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:10}]},STD:{requirements:[{stat:"manufacturing_output",min:35},{stat:"rare_minerals",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:40},{stat:"higher_education",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","inflation","fuel_prices"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"arable_land",min:10}]},STD:{requirements:[{stat:"arable_land",min:30},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"arable_land",min:50},{stat:"manufacturing_output",min:30}]}},priceDrivers:["arable_land","physical_infrastructure","inflation"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"rare_minerals",min:15},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"rare_minerals",min:35},{stat:"manufacturing_output",min:25}]}},priceDrivers:["rare_minerals","physical_infrastructure","inflation"]},{key:"em",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:15}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"digital_infrastructure",min:25}]},HIGH:{requirements:[{stat:"manufacturing_output",min:55},{stat:"digital_infrastructure",min:50},{stat:"energy_generation",min:40}]}},priceDrivers:["manufacturing_output","digital_infrastructure","inflation","energy_generation"]},{key:"glass",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:20}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"digital_infrastructure",min:40},{stat:"higher_education",min:50}]}},priceDrivers:["manufacturing_output","standard_of_living","inflation"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"oil_and_gas",min:10}]},STD:{requirements:[{stat:"oil_and_gas",min:30},{stat:"manufacturing_output",min:25}]},HIGH:{requirements:[{stat:"oil_and_gas",min:45},{stat:"manufacturing_output",min:40},{stat:"physical_infrastructure",min:40}]}},priceDrivers:["oil_and_gas","manufacturing_output","inflation","fuel_prices"]},{key:"heavy",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:40},{stat:"rare_minerals",min:30}]},STD:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:45},{stat:"higher_education",min:40}]},HIGH:{requirements:[{stat:"manufacturing_output",min:75},{stat:"rare_minerals",min:60},{stat:"higher_education",min:55},{stat:"digital_infrastructure",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","higher_education","digital_infrastructure"]}];function Ie(i,e,t){const n=ue.find(s=>s.key===i);if(!n)return{available:!1,failedStat:"unknown_material"};const o=n.tiers[e];if(!o)return{available:!1,failedStat:"unknown_tier"};for(const s of o.requirements){const a=Number(t?.[s.stat]??0);if(a<s.min)return{available:!1,failedStat:s.stat,failedMin:s.min,nationValue:a}}return{available:!0}}function ei(i,e,t){const o={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em:{LOW:400,STD:700,HIGH:1200},glass:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy:{LOW:800,STD:1400,HIGH:2400}}[i]?.[e];if(!o)return 0;const s=ue.find(d=>d.key===i);if(!s)return o;let a=1;for(const d of s.priceDrivers){const l=Number(t?.[d]??50);d==="inflation"||d==="fuel_prices"?a*=1+(l-50)/200:a*=1-(l-50)/250}return a=Math.max(.4,Math.min(2.5,a)),Math.round(o*a)}function Ii(i,e,t){const o={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em:{LOW:1e3,STD:700,HIGH:300},glass:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy:{LOW:400,STD:200,HIGH:80}}[i]?.[e]||0,a=ue.find(r=>r.key===i)?.priceDrivers?.[0],l=.3+(a?Number(t?.[a]??50):50)/50*.7;return Math.round(o*l)}const ti=["LOW","STD","HIGH"],Wt={LOW:"Low",STD:"Standard",HIGH:"High"};let We=[],m=null,S=null,O=null,qe=[],je={},ie=[],F={},Ft=-1,H="concrete",j="STD",ne=500,oe=[],Vt=0,J="trucks",ce=0,pe=1,$e=[],Se=null,ot=[],Yt=null,tt=null,Qt="ALL",Kt="TIMELINE";function N(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(1)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i}function fn(i){if(i>=12){const e=Math.floor(i/12),t=i%12;return t>0?e+"y "+t+"mo":e+"y"}return i+" ticks"}function X(i){return Math.abs(i)>=1e9?"$"+(i/1e9).toFixed(1)+"B":Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(0)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i}function rt(i){return i==="civil_engineering"?"CIVIL":i==="industrial"?"INDUSTRIAL":i==="mega_project"?"MEGA":i?.toUpperCase()||"—"}function Si(i){return i==="civil_engineering"?"light":i==="industrial"?"heavy":i==="mega_project"?"mega":"light"}function mn(){tt&&clearInterval(tt),tt=setInterval(()=>{if(!Yt)return;const i=Yt-Date.now();if(i<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(tt);return}const e=Math.floor(i/36e5),t=Math.floor(i%36e5/6e4),n=Math.floor(i%6e4/1e3);document.getElementById("tick-countdown").textContent=e+"h "+t+"m "+n+"s"},1e3)}function un(){document.body.classList.toggle("light-mode");const i=document.getElementById("theme-toggle");i.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function yn(i,e){i==="type"&&(Qt=e),i==="sort"&&(Kt=e),document.querySelectorAll(`.filter-pill[data-filter="${i}"]`).forEach(t=>{t.classList.toggle("active",t.dataset.value===e)}),Ai()}const _i={"Civil Engineering":"civil_engineering","Industrial Construction":"industrial",Megaprojects:"mega_project"};function Mi(i){if(!m)return!1;if(_i[m.corp_subsector]===i.sector)return!0;const t=(U||[]).filter(n=>n.type==="regional_hq"&&n.is_active&&n.nation_id===i.nation_id);for(const n of t)if(_i[n.subsector]===i.sector)return!0;return!1}function Ai(){const i=document.getElementById("oc-list");let e=[...qe];if(Qt==="GOVERNMENT"?e=e.filter(o=>o.issuer_type==="GOVERNMENT"):Qt==="PRIVATE"&&(e=e.filter(o=>o.issuer_type==="PRIVATE")),Kt==="TIMELINE"&&e.sort((o,s)=>(o.timeline_ticks||0)-(s.timeline_ticks||0)),Kt==="BUDGET"&&e.sort((o,s)=>(s.budget_ceiling||0)-(o.budget_ceiling||0)),document.getElementById("oc-count").textContent=e.length+" AVAILABLE",e.length===0){i.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const t=O?.current_tick||0;let n="";for(const o of e){const s=o.issuer_type==="GOVERNMENT",a=s?"gov":"private",d=Mi(o),l=d?"":" locked",r=Si(o.sector),c=rt(o.sector),f=(o.timeline_ticks||0)>18?" warn":"",p=o.bidding_ends_tick?Math.max(0,o.bidding_ends_tick-t):"?";n+=`
            <div class="oc-item${l}" data-contract-id="${o.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${x(o.name)}</span>
                    <span class="oc-item__type-badge ${a}">${s?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${a}">${x(o.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${p} tick${p!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${X(o.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${f}">${fn(o.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${r}">${c}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${je[o.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${X(je[o.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${d?"yes":"no"}">${d?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${d?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openContractDetail(contracts.find(x=>x.id==='${o.id}'))">VIEW</button>`:""}
                </div>
                ${o.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${x(o.description)}</div>`:""}
            </div>`}i.innerHTML=n,i.querySelectorAll(".oc-item:not(.locked)").forEach(o=>{o.addEventListener("click",()=>{const s=o.dataset.contractId,a=qe.find(d=>d.id===s);a&&zi(a)})})}let se=null;function zi(i){se=i;const e=document.getElementById("cd-overlay"),t=i.issuer_type==="GOVERNMENT",n=t?"gov":"private",o=(S?.name||m.nation||"—").toUpperCase(),s=Mi(i);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${x(o)}</span>
        <span class="cd-header__name">${x(i.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${n}">${x(i.issuer_name)}</span>
        <span class="cd-header__type-badge ${n}">${t?"GOV":"PRIVATE"}</span>
    `;const a=document.getElementById("cd-blueprint");i.blueprint_svg?(a.innerHTML=i.blueprint_svg,a.style.display=""):(a.innerHTML=Ln(i),a.style.display="");const d=i.permits_required||[],l=i.required_equipment||i.equipment_required||[],r=i.required_materials||i.materials_estimated||{},f={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[i.sector]||i.spec_category||i.sector||"—";let p="var(--teal)";i.sector==="industrial"&&(p="var(--orange)"),i.sector==="mega_project"&&(p="var(--red)");let u=N(i.budget_ceiling||i.budget||0),y=(i.timeline_ticks||i.timeline_months||0)+" Months",v="";v+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${x(i.project_code||i.contract_number||"")}</span>
            </div>
            <div class="cd-issue__tags">
                ${i.project_type?`<span class="cd-tag teal">${x(i.project_type.toUpperCase())}</span>`:""}
                ${i.project_subtype?`<span class="cd-tag gold">${x(i.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,i.description&&(v+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${x(i.description)}</div>
            </div>`),v+='<div class="cd-details">',i.project_type&&(v+=xe("Type",i.project_type)),i.project_subtype&&(v+=xe("Sub-Type",i.project_subtype)),v+=xe("Specialization",f,p),v+=xe("Total Budget",u,"var(--green)"),v+=xe("Timeline",y),v+=xe("Nation",S?.name||m.nation||"—"),i.region&&(v+=xe("Region",i.region)),v+="</div>",d.length>0&&(v+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${d.map(w=>{const q=w.status==="approved"?"approved":"required",L=w.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${q}">
                            <span class="cd-chip__icon">${L}</span>
                            <span class="cd-chip__label">${x(w.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),r.length>0&&(v+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${r.map(w=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${x(w.name)}</span>
                        <span class="cd-mat-row__qty">${x(String(w.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=v;const h=d.filter(w=>w.status==="approved").length,T=d.length-h,E=l.filter(w=>w.owned).length,A=l.length-E;let _="";l.length>0&&(A===0?_+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>':_+=`<span class="cd-footer__badge bad">${A} EQUIPMENT MISSING</span>`),d.length>0&&(T===0?_+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':_+=`<span class="cd-footer__badge warn">${T} PERMITS PENDING</span>`);const I=s;(m.action_points??0)>=2;const b=i.issuer_faction_id===m?.id,C=i.status==="bidding",k=je[i.id];document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${_}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${b?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${C?"":"disabled"} title="${C?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:k?`<button class="cd-btn primary" onclick="retractBid('${i.id}')" style="background:#c55;border-color:#c55;"
                        title="Retract your bid ($1M penalty)">RETRACT BID</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${I?"":"disabled"}
                        title="${I?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,e.classList.add("open"),document.body.style.overflow="hidden"}function Je(i){i&&i.target&&i.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",se=null)}const vn=[{key:"concrete",name:"Concrete",unit:"units"},{key:"steel",name:"Steel",unit:"units"},{key:"lumber",name:"Lumber",unit:"units"},{key:"aggregate",name:"Aggregate",unit:"units"},{key:"em_systems",name:"E&M Systems",unit:"units"},{key:"glass_facades",name:"Glass & Facades",unit:"units"},{key:"asphalt",name:"Asphalt",unit:"units"},{key:"heavy_parts",name:"Heavy Machinery Parts",unit:"units"}],gn=[{key:"work_trucks",name:"Work Trucks",tier:1},{key:"excavators",name:"Excavators",tier:1},{key:"bulldozers",name:"Bulldozers",tier:1},{key:"concrete_mixers",name:"Concrete Mixers",tier:1},{key:"tower_cranes",name:"Tower Cranes",tier:2},{key:"heavy_haulers",name:"Heavy Haulers",tier:2},{key:"pile_drivers",name:"Pile Drivers",tier:2},{key:"asphalt_plants",name:"Asphalt Plants",tier:2}],Li={LOW:.7,STANDARD:1,HIGH:1.4},Bi={LOW:35,STANDARD:65,HIGH:90},St=15;let V=null;function bn(i){if(!i)return;const e=i.required_materials||{},t=i.required_equipment||[],n=i.required_workforce||{},o={concrete:18e4,steel:25e4,lumber:12e4,aggregate:8e4,em_systems:32e4,glass_facades:28e4,asphalt:14e4,heavy_parts:4e5},s=vn.filter(c=>e[c.key]>0).map(c=>({...c,qty:e[c.key],basePrice:o[c.key]||2e5,grade:c.key==="aggregate"?"LOW":"STANDARD",highDisabled:!1})),a=gn.filter(c=>t.includes(c.key)).map(c=>({...c,owned:(oe||[]).some(f=>f.equipment_key===c.key&&f.quantity>0)})),d=(n.general||100)+(n.skilled||20),l=i.budget_ceiling||1e8,r=Math.round(l*.03);V={contract:i,budgetCeiling:l,materials:s,laborCount:d,laborRate:15200,estimatedTicks:i.timeline_ticks||8,equipment:a,permits:[],overhead:r,markupPct:15,competitors:[],playerRep:m?.standing||50,requiredWorkforce:n},document.getElementById("bid-title").textContent="BID ASSEMBLY",document.getElementById("bid-subtitle").textContent=(i.name||"Contract")+" — "+rt(i.sector)+" — "+(i.issuer_name||"Government"),document.getElementById("bid-overlay").classList.add("open"),document.body.style.overflow="hidden",lt()}function Ni(i){i&&i.target!==document.getElementById("bid-overlay")||(document.getElementById("bid-overlay").classList.remove("open"),document.body.style.overflow="",V=null)}function R(i){return Math.abs(i)>=1e9?"$"+(i/1e9).toFixed(2)+"B":Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(2)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function xn(i,e){if(!V)return;const t=V.materials[i];e==="HIGH"&&t.highDisabled||(t.grade=e,lt())}function $n(i){V&&(V.laborCount=i,lt())}function _n(i){V&&(V.markupPct=Number(i),lt())}function lt(){if(!V)return;const i=V;let e=0;for(const w of i.materials)w.lineCost=Math.round(w.qty*w.basePrice*Li[w.grade]),e+=w.lineCost;const t=Math.round(i.laborCount*i.laborRate*i.estimatedTicks),n=Math.round(i.equipment.filter(w=>w.owned).length*12e3*i.estimatedTicks);let o=0;const s=i.overhead,a=e+t+n+o+s,d=Math.round(a*i.markupPct/100),l=a+d,r=l>i.budgetCeiling,c=d,f=Math.round(i.materials.reduce((w,q)=>w+Bi[q.grade],0)/i.materials.length),p=f>=80?"STRONG":f>=60?"PROMISING":f>=40?"UNCERTAIN":"POOR",u=f>=80?"var(--green)":f>=60?"var(--teal)":f>=40?"var(--orange)":"var(--red)",y=i.budgetCeiling>0?l/i.budgetCeiling:1,v=Math.max(0,Math.min(100,Math.round((1-y)*150))),h=v>=70?"STRONG":v>=40?"COMPETITIVE":v>=15?"WEAK":"UNLIKELY",T=v>=70?"var(--green)":v>=40?"var(--teal)":v>=15?"var(--orange)":"var(--red)",E=Math.round(a*(1-St/100)),A=Math.round(a*(1+St/100));let _="";_+='<div class="bid-section"><div class="bid-section__title">Materials</div>',i.materials.forEach((w,q)=>{const L=P=>{const K=w.grade===P,ye=P==="HIGH"&&w.highDisabled;return`<button class="bid-grade-btn ${K?P==="LOW"?"active-low":P==="HIGH"?"active-high":"active":""} ${ye?"disabled":""}" onclick="setBidGrade(${q},'${P}')">${P[0]}</button>`};_+=`<div class="bid-mat-row">
            <span class="bid-mat-row__name">${x(w.name)}</span>
            <span class="bid-mat-row__qty">×${w.qty}</span>
            <div class="bid-grade-btns">${L("LOW")}${L("STANDARD")}${L("HIGH")}</div>
            <span class="bid-mat-row__cost">${R(w.lineCost)}</span>
        </div>`}),_+=`<div class="bid-line-total"><span class="bid-line-total__label">MATERIALS TOTAL</span><span class="bid-line-total__value">${R(e)}</span></div></div>`;const I=(i.requiredWorkforce?.general||80)+(i.requiredWorkforce?.skilled||20),b=[Math.round(I*.8),I,Math.round(I*1.2),Math.round(I*1.4),Math.round(I*1.6)];_+='<div class="bid-section"><div class="bid-section__title">Labor</div>',_+='<div class="bid-labor-presets">',b.forEach(w=>{_+=`<button class="bid-labor-btn ${i.laborCount===w?"active":""}" onclick="setBidLabor(${w})">${w}</button>`}),_+="</div>";const C=i.requiredWorkforce||{};_+=`<div class="bid-labor-formula">Required: ${C.general||"?"} general + ${C.skilled||"?"} skilled<br>`,_+=`${i.laborCount} workers × ${R(i.laborRate)}/tick × ${i.estimatedTicks} ticks = <strong>${R(t)}</strong></div>`,_+=`<div class="bid-line-total"><span class="bid-line-total__label">LABOR TOTAL</span><span class="bid-line-total__value">${R(t)}</span></div></div>`,_+='<div class="bid-section"><div class="bid-section__title">Equipment</div>',i.equipment.forEach(w=>{const q=w.owned?"bid-equip-row__status--owned":"bid-equip-row__status--missing",L=w.owned?"✓ OWNED":"✗ NOT OWNED";_+=`<div class="bid-equip-row"><span class="bid-equip-row__name">${x(w.name)}</span><span class="bid-equip-row__status ${q}">${L}</span></div>`}),_+=`<div class="bid-line-total"><span class="bid-line-total__label">MAINTENANCE (${i.estimatedTicks}t)</span><span class="bid-line-total__value">${R(n)}</span></div></div>`,_+='<div class="bid-section"><div class="bid-section__title">Permits</div>',_+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);padding:8px 0;">No permits required yet.</div>',_+='<div class="bid-line-total"><span class="bid-line-total__label">PERMITS TOTAL</span><span class="bid-line-total__value">$0</span></div></div>',_+='<div class="bid-section"><div class="bid-section__title">Overhead &amp; Contingency</div>',_+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Site management, insurance, admin</div>',_+=`<div class="bid-line-total"><span class="bid-line-total__label">OVERHEAD</span><span class="bid-line-total__value">${R(s)}</span></div></div>`,document.getElementById("bid-left").innerHTML=_;let k="";k+='<div class="bid-section"><div class="bid-section__title">Cost Summary</div>',k+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Materials</span><span class="bid-summary-row__value">${R(e)}</span></div>`,k+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Labor</span><span class="bid-summary-row__value">${R(t)}</span></div>`,k+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Equipment Maint.</span><span class="bid-summary-row__value">${R(n)}</span></div>`,k+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Permits</span><span class="bid-summary-row__value">${R(o)}</span></div>`,k+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Overhead</span><span class="bid-summary-row__value">${R(s)}</span></div>`,k+=`<div class="bid-cost-total"><span class="bid-cost-total__label">ESTIMATED COST</span><span class="bid-cost-total__value">${R(a)}</span></div>`,k+=`<div class="bid-accuracy">⚠ Estimate accuracy: ±${St}%<br>Actual cost range: ${R(E)} — ${R(A)}</div>`,k+="</div>",k+='<div class="bid-section"><div class="bid-section__title">Markup</div>',k+=`<div class="bid-slider-wrap">
        <div class="bid-slider-label"><span class="bid-slider-label__pct">${i.markupPct}%</span><span style="color:var(--text-dim)">${R(d)}</span></div>
        <input type="range" class="bid-slider" min="0" max="40" value="${i.markupPct}" oninput="setBidMarkup(this.value)">
    </div></div>`,k+=`<div class="bid-price-hero ${r?"bid-price-hero--over":""}">
        <div class="bid-price-hero__label">YOUR BID PRICE</div>
        <div class="bid-price-hero__value">${R(l)}</div>
        ${r?'<div class="bid-price-hero__warning">EXCEEDS BUDGET CEILING ('+R(i.budgetCeiling)+")</div>":""}
    </div>`,k+=`<div class="bid-profit"><span class="bid-profit__label">PROJECTED PROFIT</span><span class="bid-profit__value">+${R(c)}</span></div>`,k+=`<div class="bid-compete">
        <div style="display:flex;justify-content:space-between;"><span class="bid-compete__label" style="color:${T}">${h}</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Competitiveness</span></div>
        <div class="bid-compete__bar-wrap"><div class="bid-compete__bar" style="width:${v}%;background:${T}"></div></div>
    </div>`,k+=`<div class="bid-quality">
        <div style="display:flex;justify-content:space-between;"><span class="bid-quality__label" style="color:${u}">${p} (${f}/100)</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Quality Estimate</span></div>
        <div class="bid-quality__bar-wrap"><div class="bid-quality__bar" style="width:${f}%;background:${u}"></div></div>
    </div>`,k+='<div class="bid-section" style="margin-top:8px;"><div class="bid-section__title">Competing Bids</div>',i.competitors.forEach(w=>{k+=`<div class="bid-competitor"><span class="bid-competitor__name">${x(w.name)}</span><span class="bid-competitor__rep">Rep ${w.rep}</span></div>`}),k+=`<div class="bid-competitor" style="color:var(--gold);"><span class="bid-competitor__name">You</span><span class="bid-competitor__rep">Rep ${i.playerRep}</span></div>`,k+="</div>",document.getElementById("bid-right").innerHTML=k,document.getElementById("bid-footer-price").textContent=R(l),document.getElementById("bid-footer-price").style.color=r?"var(--red)":"var(--gold)",document.getElementById("bid-footer-profit").textContent="+"+R(c),document.getElementById("bid-footer-quality").textContent=f+"/100",document.getElementById("bid-footer-quality").style.color=u,document.getElementById("bid-submit-btn").disabled=r}window.openBidModal=bn;window.closeBidModal=Ni;window.setBidGrade=xn;window.setBidLabor=$n;window.setBidMarkup=_n;async function hn(){if(!V||!m||He)return;const i=V,e=i.contract;let t=0;const n={};for(const f of i.materials)t+=Math.round(f.qty*f.basePrice*Li[f.grade]),n[f.key]=f.grade;const o=Math.round(i.laborCount*i.laborRate*i.estimatedTicks),s=Math.round(i.equipment.filter(f=>f.owned).length*12e3*i.estimatedTicks),a=t+o+s+i.overhead,d=Math.round(a*i.markupPct/100),l=a+d,r=Math.round(i.materials.reduce((f,p)=>f+Bi[p.grade],0)/(i.materials.length||1));if(l>i.budgetCeiling){alert("Bid exceeds budget ceiling. Lower your costs or markup.");return}const c=document.getElementById("bid-submit-btn");c.disabled=!0,c.textContent="SUBMITTING...",He=!0;try{const{data:f}=await $.from("shard").select("current_tick").eq("name","Alpha Shard").single(),p=f?.current_tick||0,{data:u}=await $.from("contract_bids").select("id").eq("contract_id",e.id).eq("faction_id",m.id).maybeSingle();if(u){const{error:v}=await $.from("contract_bids").update({bid_price:l,material_grades:n,labor_count:i.laborCount,markup_pct:i.markupPct,estimated_cost:a,estimated_quality:r,submitted_at_tick:p}).eq("id",u.id);if(v)throw v}else{const{error:v}=await $.from("contract_bids").insert({contract_id:e.id,faction_id:m.id,bid_price:l,material_grades:n,labor_count:i.laborCount,markup_pct:i.markupPct,estimated_cost:a,estimated_quality:r,status:"pending",submitted_at_tick:p});if(v)throw v}Ni();const y=document.getElementById("oc-count");if(y){const v=y.textContent;y.textContent="✓ BID SUBMITTED",y.style.color="var(--green)",setTimeout(()=>{y.textContent=v,y.style.color=""},2e3)}await le()}catch(f){console.error("Bid submission failed:",f),alert("Failed to submit bid: "+(f.message||"Unknown error")),c.disabled=!1,c.textContent="SUBMIT BID"}finally{He=!1}}window.submitBid=hn;const we=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],hi={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},wi={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let B=null;function wn(i){const e=ie.find(C=>C.id===i);if(!e)return;const t=Array.isArray(e.contract_bids)?e.contract_bids[0]:e.contract_bids,n=O?.current_tick||0,o=e.awarded_at_tick||n,s=e.timeline_ticks||8,a=Math.max(0,n-o),d=Math.min(100,a/s*100);let l=Math.min(we.length-1,Math.floor(d/(100/we.length)));const r=Math.round(d%(100/we.length)/(100/we.length)*100),c=e.required_materials||{},f=t?.material_grades||{},p=Object.entries(c).map(([C,k])=>{const w=f[C]||"STANDARD",q=Math.round(k*(d/100)*(.6+Math.random()*.4));return{key:C,name:C.replace(/_/g," ").replace(/\b\w/g,L=>L.toUpperCase()),grade:w,allocated:k,used:Math.min(q,k)}}),y=(e.required_equipment||[]).map(C=>({key:C,name:C.replace(/_/g," ").replace(/\b\w/g,k=>k.toUpperCase()),qty:1+Math.floor(Math.random()*3),condition:55+Math.floor(Math.random()*40)})),v=e.budget_ceiling||0,h=t?.estimated_cost||0,T=Math.round(h*Math.min(1,a/s)),E=t?.estimated_quality||65,A=E>=80?"STRONG":E>=60?"PROMISING":E>=40?"FAIR":"UNCERTAIN",_=e.required_workforce||{},I=(_.general||0)+(_.skilled||0),b=t?.labor_count||I;B={project:e,bid:t,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:n,awardedTick:o,totalTicks:s,ticksElapsed:a,phaseIdx:l,phaseProgress:r,materials:p,equipment:y,budget:v,estCost:h,spent:T,quality:E,qualityLabel:A,laborCount:b,wfNeeded:I,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",qi(e.id).then(()=>Ae()),Ae()}function kn(i){i&&i.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",B=null)}function En(i){B&&(B.tab=i,B.expandedEvent=-1,B.selectedResponse=null,Ae())}function Tn(i){B&&(B.expandedEvent=B.expandedEvent===i?-1:i,B.selectedResponse=null,Ae())}function Cn(i){B&&(B.selectedResponse=B.selectedResponse===i?null:i,Ae())}function Ae(){if(!B)return;const i=B,e=i.project,t=e.issuer_type==="GOVERNMENT",n=rt(e.sector),o=m?.nation||"Nation",s=i.awardedTick+i.totalTicks,a=Math.max(0,s-i.currentTick),d=i.currentTick>s,l=i.budget>0?Math.round(i.spent/i.budget*100):0,r=l>85?"var(--red)":l>60?"var(--amber)":"var(--teal)",c=i.budget-i.spent,f=i.events.filter(h=>h.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${x(o.toUpperCase())}</span>
                <span class="pm-hdr__name">${x(e.name)}</span>
                <span style="color:var(--text-dim);font-size:12px">—</span>
                <span class="pm-hdr__issuer">${x(e.issuer_name||"—")}</span>
                <span class="pm-hdr__type">${t?"GOV":"PVT"}</span>
            </div>
            <button class="pm-hdr__close" onclick="closeProjectModal()">×</button>
        </div>
        <div class="pm-hdr__row2">
            <span class="pm-hdr__id">${x(e.template_key||e.id)}</span>
            <span class="pm-hdr__badge pm-hdr__badge--spec">${x(n.toUpperCase())}</span>
            <span class="pm-hdr__badge pm-hdr__badge--sub">${x((e.sector||"").replace(/_/g," ").toUpperCase())}</span>
        </div>
    `;let p='<div class="pm-phase__bar">';for(let h=0;h<we.length;h++){const T=h<i.phaseIdx,E=h===i.phaseIdx;p+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${T?"done":E?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${T?"done":E?"active":""}">${we[h]}</span>
        </div>`}p+="</div>",p+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${we[i.phaseIdx]} — ${i.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${d?"var(--red)":"var(--text-secondary)"}">Tick ${i.ticksElapsed} / ${i.totalTicks}${d?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=p;const u=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:f},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=u.map(h=>`<button class="pm-tab${i.tab===h.id?" active":""}" onclick="pmSetTab('${h.id}')">
            ${h.label}${h.badge>0?`<span class="pm-tab__badge">${h.badge}</span>`:""}
        </button>`).join("");let y="";i.tab==="overview"?y=In(i,e,r,l,c,a,d):i.tab==="events"?y=Sn(i):i.tab==="materials"?y=Mn(i):i.tab==="equipment"&&(y=An(i)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${y}</div>`;let v="";f>0&&(v+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${f} EVENT${f>1?"S":""} REQUIRES RESPONSE</span>`),v+=`<span class="pm-ftr__badge" style="color:${i.quality>=70?"var(--green)":i.quality>=50?"var(--amber)":"var(--orange)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${i.quality}/100 — ${i.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${v}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function In(i,e,t,n,o,s,a){const d=Mt(i.awardedTick+i.totalTicks);Mt(i.awardedTick+i.totalTicks);const l=Mt(i.awardedTick),r=[{label:"Budget",value:X(i.budget),sub:`${n}% spent`,color:t},{label:"Spent",value:X(i.spent),color:"var(--red)"},{label:"Remaining",value:X(o),color:"var(--green)"},{label:"Quality",value:`${i.quality}/100`,sub:i.qualityLabel,color:i.quality>=70?"var(--green)":i.quality>=50?"var(--amber)":"var(--red)"},{label:"Workforce",value:`${i.laborCount}/${i.wfNeeded}`,sub:`Bid: ${i.laborCount}`,color:i.laborCount<i.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${s} ticks`,sub:a?"OVERDUE":`Deadline: ${d}`,color:a?"var(--red)":"var(--text-bright)"}];let c="";c+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${x(e.description||e.name)}</div>
    </div></div>`,c+='<div class="pm-metrics">';for(const p of r)c+=`<div class="pm-metric">
            <div class="pm-metric__label">${p.label}</div>
            <div class="pm-metric__value" style="color:${p.color}">${p.value}</div>
            ${p.sub?`<div class="pm-metric__sub">${x(p.sub)}</div>`:""}
        </div>`;c+="</div>",c+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${l}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${a?"var(--red)":"var(--text-bright)"};font-weight:700">${d}</span></span>
        </div>
    </div></div>`;const f=[];if((e.sector==="civil_engineering"||e.sector==="industrial"||e.sector==="mega_project")&&(f.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),f.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),e.sector!=="civil_engineering"&&f.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),f.length>0){c+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const p of f)c+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${x(p.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;c+="</div></div>"}return c}function Sn(i){if(i.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let e="";for(let t=0;t<i.events.length;t++){const n=i.events[t],o=i.expandedEvent===t,s=n.status==="ACTIVE",a=hi[n.type]||hi.WEATHER,d=wi[n.severity]||wi.LOW;if(e+=`<div class="pm-evt ${s?"pm-evt--active":"pm-evt--resolved"}" style="${s?`border-left-color:${a.color}`:""}">`,e+=`<div class="pm-evt__header" onclick="pmToggleEvent(${t})" style="${o?`background:${a.bg}`:""}">`,e+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${a.color};background:${a.bg};border:1px solid ${a.border}">${n.type}</span>
            <span class="pm-evt__sev-badge" style="color:${d}">${n.severity}</span>
            <span class="pm-evt__status" style="color:${s?"var(--red)":"var(--text-dim)"};font-weight:${s?"700":"400"}">${s?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,e+=`<div class="pm-evt__title">${x(n.title)}</div>`,e+=`<div class="pm-evt__meta">Tick ${n.tick} · ${x(n.id||"")}</div>`,o){if(e+='<div class="pm-evt__body">',e+=`<div class="pm-evt__desc">${x(n.desc)}</div>`,n.impact&&(e+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${x(n.impact)}</span>
                </div>`),s&&n.responses&&n.responses.length>0){e+='<div class="pm-evt__resp-title">Response Options</div>';for(let l=0;l<n.responses.length;l++){const r=n.responses[l],c=i.selectedResponse===l,p={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[r.tag]||"var(--text-secondary)";e+=`<div class="pm-resp${c?" selected":""}" style="${c?`border-color:${p}`:""}" onclick="event.stopPropagation();pmSelectResponse(${l})">`,e+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${x(r.label)}</span>
                            <span class="pm-resp__tag" style="color:${p};background:${p}12;border:1px solid ${p}25">${r.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${r.delay>0?"var(--orange)":"var(--green)"}">
                            ${r.delay>0?`+${r.delay} tick${r.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,e+=`<div class="pm-resp__detail">${x(r.detail)}</div>`,e+='<div class="pm-resp__costs">',r.cost&&(e+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${X(r.cost)}</span>`),r.qualityImpact&&r.qualityImpact!==0&&(e+=`<span class="pm-resp__cost" style="color:${r.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${r.qualityImpact>0?"+":""}${r.qualityImpact}</span>`),!r.cost&&(!r.qualityImpact||r.qualityImpact===0)&&(e+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),e+="</div>",c&&(e+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${p}" onclick="event.stopPropagation();confirmEventResponse('${n.id}','${r.key}')">CONFIRM</button>
                        </div>`),e+="</div>"}}!s&&n.resolution&&(e+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${x(n.resolution)}</div>
                </div>`),e+="</div>"}e+="</div></div>"}return e}function Mn(i){if(i.materials.length===0)return'<div class="pm-evt-empty">No materials allocated to this project.</div>';let e='<div class="pm-tab-header">Allocated Materials</div>';for(const t of i.materials){const n=t.allocated>0?Math.round(t.used/t.allocated*100):0,o=t.grade==="HIGH"?"high":t.grade==="LOW"?"low":"std",s=t.grade==="HIGH"?"var(--green)":t.grade==="LOW"?"var(--orange)":"var(--amber)";e+=`<div class="pm-mat">
            <div class="pm-mat__row1">
                <div class="pm-mat__left">
                    <span class="pm-mat__name">${x(t.name)}</span>
                    <div class="pm-mat__grade-dot pm-mat__grade-dot--${o}"></div>
                    <span class="pm-mat__grade" style="color:${s}">${t.grade}</span>
                </div>
                <span class="pm-mat__qty">${t.used.toLocaleString()} / ${t.allocated.toLocaleString()}</span>
            </div>
            <div class="pm-mat__bar-row">
                <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${n}%"></div></div>
                <span class="pm-mat__pct">${n}% consumed</span>
            </div>
        </div>`}return e}function An(i){if(i.equipment.length===0)return'<div class="pm-evt-empty">No equipment deployed to this project.</div>';let e='<div class="pm-tab-header">Deployed Equipment</div>';for(const t of i.equipment){const n=t.condition>=75?"var(--green)":t.condition>=50?"var(--amber)":t.condition>=25?"var(--orange)":"var(--red)",o=t.condition<60;e+=`<div class="pm-eq">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${x(t.name)}</span>
                    <span class="pm-eq__qty">×${t.qty}</span>
                    ${o?'<span class="pm-eq__wear">WEAR</span>':""}
                </div>
            </div>
            <div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${t.condition}%;background:${n}"></div></div>
                <span class="pm-eq__cond-val" style="color:${n}">${t.condition}%</span>
            </div>
        </div>`}return e}function Mt(i){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][i%12]}, ${2e3+Math.floor(i/12)}`}window.openProjectModal=wn;window.closeProjectModal=kn;window.pmSetTab=En;window.pmToggleEvent=Tn;window.pmSelectResponse=Cn;async function qi(i){if(!B)return;const{data:e,error:t}=await $.from("construction_events").select("*").eq("contract_id",i).order("fired_at_tick",{ascending:!1});t?(console.warn("Failed to load project events:",t.message),B.events=[]):B.events=(e||[]).map(n=>({id:n.id,type:n.type,severity:n.severity,tick:n.fired_at_tick,title:n.title,desc:n.description,impact:n.impact,status:n.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:n.resolution,responses:n.responses||[]})),Ae()}let At=!1;async function zn(i,e){if(!(At||!B)){At=!0;try{const{data:t,error:n}=await $.rpc("resolve_construction_event",{p_event_id:i,p_response_key:e});if(n){console.error("Failed to resolve event:",n.message),alert("Failed to submit response: "+n.message);return}const o=typeof t=="string"?JSON.parse(t):t;if(o?.error){alert("Error: "+o.error);return}await qi(B.project.id),await Ri(),o?.quality_applied&&o.quality_applied!==0&&(B.quality=Math.max(0,Math.min(100,B.quality+o.quality_applied)),B.qualityLabel=B.quality>=80?"STRONG":B.quality>=60?"PROMISING":B.quality>=40?"FAIR":"UNCERTAIN"),Ae()}finally{At=!1}}}window.confirmEventResponse=zn;function xe(i,e,t){const n=t?` style="color:${t}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${x(i)}</span>
        <span class="cd-detail-row__value"${n}>${x(e)}</span>
    </div>`}function Ln(i){const e={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},t=i.drawing_number||i.contract_number+"-A1",n=O?.current_date||"",o=n?n.replace(/,\s*/," "):"",s=i.spec_category==="Heavy Infrastructure",a=i.spec_category==="Megaproject";let d=x(i.project_subtype||i.project_type||"STRUCTURE"),l=s?"80.0m":a?"200.0m":"60.0m",r=s?"40.0m":a?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${e.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(c,f)=>`<line x1="${f*20}" y1="0" x2="${f*20}" y2="200" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(c,f)=>`<line x1="0" y1="${f*20}" x2="680" y2="${f*20}" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${e.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${e.accent}" font-family="var(--font-mono)" font-weight="700">${d.toUpperCase()}</text>
        <text x="340" y="100" text-anchor="middle" font-size="6" fill="${e.text}" font-family="var(--font-mono)">${x(i.name)}</text>

        <!-- Internal divisions -->
        <line x1="200" y1="30" x2="200" y2="150" stroke="${e.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="340" y1="30" x2="340" y2="150" stroke="${e.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="480" y1="30" x2="480" y2="150" stroke="${e.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="60" y1="90" x2="620" y2="90" stroke="${e.line}" stroke-width="0.4" stroke-dasharray="4,2"/>

        <!-- Dimension: top -->
        <line x1="60" y1="20" x2="620" y2="20" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="60" y1="17" x2="60" y2="23" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="620" y1="17" x2="620" y2="23" stroke="${e.dim}" stroke-width="0.5"/>
        <text x="340" y="17" text-anchor="middle" font-size="5.5" fill="${e.dim}" font-family="var(--font-mono)">${l}</text>

        <!-- Dimension: right -->
        <line x1="630" y1="30" x2="630" y2="150" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="627" y1="30" x2="633" y2="30" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="627" y1="150" x2="633" y2="150" stroke="${e.dim}" stroke-width="0.5"/>
        <text x="645" y="93" text-anchor="middle" font-size="5.5" fill="${e.dim}" font-family="var(--font-mono)" transform="rotate(90,645,93)">${r}</text>

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
        <text x="540" y="175" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${x(t)}</text>
        <text x="500" y="185" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">SCALE</text>
        <text x="540" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">1:200</text>
        <text x="610" y="175" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">REV</text>
        <text x="630" y="175" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">01</text>
        <text x="610" y="185" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">DATE</text>
        <text x="630" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${x(o)}</text>

        <!-- North arrow -->
        <g transform="translate(470,172)">
            <line x1="0" y1="12" x2="0" y2="0" stroke="${e.accent}" stroke-width="0.8"/>
            <polygon points="-3,4 0,0 3,4" fill="${e.accent}"/>
            <text x="0" y="-3" text-anchor="middle" font-size="5" fill="${e.text}" font-family="var(--font-mono)">N</text>
        </g>
    </svg>`}let zt=!1;async function Bn(){if(zt||!se||!m)return;if((m.action_points??0)<2){alert("You need at least 2 AP to place a bid.");return}zt=!0;const i=document.querySelector(".cd-btn.primary");i&&(i.disabled=!0,i.textContent="...");try{const{data:e,error:t}=await $.rpc("deduct_ap",{p_faction_id:m.id,p_cost:2});if(t)throw t;if(e<0){const o=-e-1;m.action_points=o,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+o+" AP</span>",i&&(i.disabled=!1,i.textContent="BID"),alert("Insufficient AP. You have "+o+" AP, need 2.");return}const{error:n}=await $.from("corp_contract_bids").insert({contract_id:se.id,faction_id:m.id,nation_id:m.nation_id,ap_spent:2,created_at_tick:O?.current_tick||null});if(n)throw await $.rpc("deduct_ap",{p_faction_id:m.id,p_cost:-2}),m.action_points=e+2,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+(e+2)+" AP</span>",n;m.action_points=e,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+e+" AP</span>",i&&(i.textContent="BID PLACED")}catch(e){i&&(i.disabled=!1,i.textContent="BID"),e.code==="23505"?alert("You have already placed a bid on this contract."):alert("Failed to place bid: "+(e.message||"Unknown error"))}finally{zt=!1}}async function le(){if(!m||!m.nation_id)return;const{data:i,error:e}=await $.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(e?(console.warn("Failed to load contracts:",e.message),qe=[]):qe=i||[],je={},m&&qe.length>0){const t=qe.map(o=>o.id),{data:n}=await $.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",m.id).in("contract_id",t);for(const o of n||[])je[o.contract_id]=o}Ai()}function Nn(){const i=document.getElementById("ap-list"),e=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=ie.length+" ACTIVE",ie.length===0){i.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,e.style.display="none";return}const t=O?.current_tick||0;let n=0,o=0,s="";for(const a of ie){const d=a.issuer_type==="GOVERNMENT",l=d?"gov":"private",r=Array.isArray(a.contract_bids)?a.contract_bids[0]:a.contract_bids,c=r?.bid_price||0,f=r?.estimated_cost||0,p=r?.estimated_quality||0,u=a.budget_ceiling||0,y=a.awarded_at_tick||t,v=y+(a.timeline_ticks||8),h=Math.max(0,v-t),T=Math.max(0,t-y),E=a.timeline_ticks||8,A=Math.min(100,Math.round(T/E*100)),_=t>v;Si(a.sector);const I=rt(a.sector);n+=u,o+=c,s+=`<div class="ap-item" onclick="openProjectModal('${a.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${x(a.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${x(a.issuer_name||"—")} · ${I}</div>
                </div>
                <span class="oc-item__type-badge ${l}">${d?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS</span>
                    <span class="ap-budget__values" style="color:${_?"var(--red)":"var(--teal)"}">
                        ${T}/${E} ticks ${_?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${A}%;background:${_?"var(--red)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${X(c)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${X(f)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${p>=70?"var(--green)":p>=40?"var(--teal)":"var(--orange)"}">${p}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${_?"var(--red)":"var(--text-bright)"}">${h} ticks</div>
                </div>
            </div>
        </div>`}i.innerHTML=s,e.style.display=ie.length>0?"":"none",ie.length>0&&(document.getElementById("ap-total-crew").textContent=ie.length,document.getElementById("ap-total-budget").textContent=X(n),document.getElementById("ap-total-spent").textContent=X(o))}async function Ri(){if(!m)return;const{data:i,error:e}=await $.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",m.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",m.id).order("awarded_at_tick",{ascending:!0});e?(console.warn("Failed to load active projects:",e.message),ie=[]):ie=i||[],Nn()}const dt=3e4;function ct(){let i=0,e=0;for(const t of ue)for(const n of ti){const o=F[t.key]?.[n];o&&(i+=o.qty,e+=o.value)}return{totalUnits:i,totalValue:e}}function ii(){const i=document.getElementById("wh-list"),{totalUnits:e,totalValue:t}=ct();document.getElementById("wh-count").textContent=e.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=N(t);const n=Math.round(e/dt*100),o=document.getElementById("wh-capacity");o.textContent=n+"%",o.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)";let s="";for(let a=0;a<ue.length;a++){const d=ue[a],l=Ft===a,r=F[d.key]?.LOW||{qty:0,value:0},c=F[d.key]?.STD||{qty:0,value:0},f=F[d.key]?.HIGH||{qty:0,value:0},p=r.qty+c.qty+f.qty,u=r.value+c.value+f.value,y=p===0,v=Ie(d.key,"LOW",S),h=Ie(d.key,"STD",S),T=Ie(d.key,"HIGH",S),E=r.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",A=c.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",_=T.available?f.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(s+='<div class="wh-row">',s+=`<div class="wh-row__collapsed${l?" expanded":""}" onclick="toggleWhRow(${a})">
            <span class="wh-row__arrow">${l?"▾":"▸"}</span>
            <span class="wh-row__name${y?" empty":""}">${x(d.name)}</span>
            <div class="wh-row__dots">
                <div class="${E}"></div>
                <div class="${A}"></div>
                <div class="${_}"></div>
            </div>
            <span class="wh-row__qty${y?" empty":""}">${p>0?p.toLocaleString():"—"}</span>
            <span class="wh-row__val${y?" empty":""}">${u>0?N(u):"—"}</span>
        </div>`,l){s+='<div class="wh-expand">',s+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const I=[{key:"LOW",label:"Low",data:r,avail:v,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:c,avail:h,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:f,avail:T,color:"var(--green)",dotClass:"wh-dot--high"}];for(const b of I){const C=!b.avail.available,k=b.data.qty>0,w=k?"$"+Math.round(b.data.value/b.data.qty):"—";s+=`<div class="wh-grade${C?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${b.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${C?"var(--red)":b.color}">${b.label}</span>
                        ${C?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${k?"var(--text-bright)":"var(--text-dim)"}">${k?b.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${b.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${b.data.value>0?N(b.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${w}</span>
                </div>`}for(const b of I)!b.avail.available&&b.avail.failedStat&&(s+=`<div class="wh-lock">
                        <span class="wh-lock__text">${b.label.toUpperCase()} GRADE LOCKED — ${x(b.avail.failedStat)} &lt; ${b.avail.failedMin}</span>
                    </div>`);s+="</div>"}s+="</div>"}i.innerHTML=s}function qn(i){Ft=Ft===i?-1:i,ii()}async function Rn(){if(!m)return;const{data:i,error:e}=await $.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",m.id);if(F={},e)console.warn("Failed to load warehouse:",e.message);else if(i)for(const t of i)F[t.material_key]||(F[t.material_key]={}),F[t.material_key][t.quality_tier]={qty:t.quantity||0,value:Number(t.total_value)||0};ii()}const Pn={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function Pi(){const i=(S?.name||m?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+i;const e=Number(m?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=N(e);const{totalUnits:t}=ct(),n=Math.round(t/dt*100),o=document.getElementById("pr-wh-capacity");o.textContent=n+"%",o.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)",Oi(),ni(),pt()}function Oi(){const i=document.getElementById("pr-mat-grid");let e="";for(const t of ue){const n=H===t.key,o=ti.every(a=>!Ie(t.key,a,S).available),s="pr-mat-btn"+(n?" active":"")+(o?" all-locked":"");e+=`<span class="${s}" onclick="setPrMat('${t.key}')">${x(t.name)}</span>`}i.innerHTML=e}function ni(){const i=document.getElementById("pr-tier-bar");let e='<span class="pr-tier-label">GRADE</span>';for(const t of ti){const n=Ie(H,t,S),o=j===t,s=n.available?ei(H,t,S):null,a=Ci[t],d=!n.available,l="pr-tier-btn"+(o?" active":"")+(d?" locked":"");e+=`<div class="${l}" onclick="${d?"":`setPrTier('${t}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${a};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${o?"var(--text-bright)":"var(--text-dim)"}">${Wt[t]}</span>
            </div>
            ${s!==null?`<div class="pr-tier-btn__price" style="color:${o?"var(--text-bright)":"var(--text-muted)"}">$${s}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}i.innerHTML=e}function pt(){const i=document.getElementById("pr-content"),e=Ie(H,j,S),t=ue.find(I=>I.key===H);if(!t)return;if(!e.available){i.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${x(t.name)} — ${Wt[j]} grade
                    is not produced domestically in ${x(S?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${x(e.failedStat||"unknown")} &lt; ${e.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const n=ei(H,j,S),o=Ii(H,j,S),s=n*ne,a=o>3e3?"LOW":o>1e3?"MODERATE":"HIGH",d=a==="LOW"?"var(--green)":a==="MODERATE"?"var(--amber)":"var(--red)",l=Number(S?.inflation??50),r=l>55?"up":l<45?"down":"flat",c=r==="up"?"&#9650;":r==="down"?"&#9660;":"&#8212;",f=r==="up"?"var(--red)":r==="down"?"var(--green)":"var(--text-dim)";let p="";p+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${n}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${f}">${c}</span>
                </div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">SUPPLY/TICK</div>
                <div class="pr-market-cell__value" style="font-size:14px;color:var(--text-bright);margin-top:2px;">${o.toLocaleString()}</div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">DEMAND</div>
                <div class="pr-market-cell__value" style="font-size:12px;color:${d};margin-top:2px;">${a}</div>
            </div>
        </div>
    </div>`,p+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${x(S?.name||"—")})</div>`;for(const I of t.priceDrivers){const b=Number(S?.[I]??50),C=b>=50?"var(--green)":b>=30?"var(--amber)":b>=15?"var(--orange)":"var(--red)",k=Pn[I]||I;p+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${x(I)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${b}%;background:${C}"></div>
            </div>
            <span class="pr-driver-row__val">${b}</span>
            <span class="pr-driver-row__effect">${x(k)}</span>
        </div>`}p+="</div>";const y=(Number(m?.corp_cash_reserves)||0)>=s,v=ne>o,{totalUnits:h}=ct(),T=dt-h,E=ne>T,A=T<=0,_=Ci[j];p+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${x(t.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${_};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${_}">${Wt[j]}</span>
                </div>
                <span class="pr-order__mat-price">$${n}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(I=>`<span class="pr-qty-btn${ne===I?" active":""}" onclick="setPrQty(${I})">${I>=1e3?I/1e3+"k":I}</span>`).join("")}
                </div>
            </div>
            ${v?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${o.toLocaleString()} this tick</span>
            </div>`:""}
            ${A?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">WAREHOUSE FULL — no remaining capacity</span>
            </div>`:E?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS WAREHOUSE CAPACITY — ${T.toLocaleString()} units remaining</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${N(s)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${y&&!v&&!E&&!A?"":"disabled"}
                    title="${y?v?"Exceeds supply":A?"Warehouse full":E?"Exceeds warehouse capacity":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,i.innerHTML=p}function On(i){H=i,j="STD";for(const e of["STD","HIGH","LOW"])if(Ie(i,e,S).available){j=e;break}Oi(),ni(),pt()}function Dn(i){j=i,ni(),pt()}function Hn(i){ne=i,pt()}let Lt=!1;async function jn(){if(Lt||!m||!S)return;const i=ei(H,j,S),e=Ii(H,j,S),t=i*ne,n=Number(m.corp_cash_reserves)||0;if(t>n){alert("Insufficient cash reserves.");return}if(ne>e){alert("Exceeds available supply this tick.");return}const{totalUnits:o}=ct(),s=dt-o;if(s<=0){alert("Warehouse is full. Cannot purchase more materials.");return}if(ne>s){alert(`Warehouse can only hold ${s.toLocaleString()} more units. Reduce quantity.`);return}Lt=!0;const a=document.querySelector(".pr-purchase-btn");a&&(a.disabled=!0,a.textContent="...");try{const d=n-t,{error:l}=await $.from("factions").update({corp_cash_reserves:d}).eq("id",m.id);if(l)throw l;const r=F[H]?.[j],c=(r?.qty||0)+ne,f=(r?.value||0)+t,{error:p}=await $.from("corp_warehouse").upsert({faction_id:m.id,nation_id:m.nation_id,material_key:H,quality_tier:j,quantity:c,total_value:f,last_purchased_tick:O?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(p){const{error:u}=await $.from("factions").update({corp_cash_reserves:n}).eq("id",m.id);throw u&&console.error("Cash refund failed after warehouse error:",u.message),p}m.corp_cash_reserves=d,F[H]||(F[H]={}),F[H][j]={qty:c,value:f},ii(),Pi(),a&&(a.textContent="PURCHASED",setTimeout(()=>{a.isConnected&&(a.disabled=!1,a.textContent="PURCHASE")},1500))}catch(d){a&&(a.disabled=!1,a.textContent="PURCHASE"),alert("Purchase failed: "+(d.message||"Unknown error"))}finally{Lt=!1}}function Di(i){const e=Se||S;if(!e)return[];const t=st(i);if(!t)return[];const n=cn(i,e),o=[],s=Number(e?.inflation??50),a=Number(e?.fuel_prices??50);Number(e?.manufacturing_output??50);const d=Se&&S&&Se.id!==S.id;let l=null;if(d&&(l=pn(e,S)),n.newAvailable>0){const r=$i(i,e),c=t.basePrice,f=Math.round(c*((s-50)/200)),p=Math.round(c*((a-50)/300));let u=r;const y=[{label:"Base price",value:N(c)},f!==0?{label:`Inflation (${s})`,mod:(f>=0?"+":"")+N(Math.abs(f))}:null,p!==0?{label:`Fuel transport (${a})`,mod:(p>=0?"+":"")+N(Math.abs(p))}:null].filter(Boolean),v=r-c-f-p;if(v!==0&&!d&&y.push({label:"Demand/scarcity",mod:(v>=0?"+":"")+N(Math.abs(v))}),d&&l){const h=Math.round(r*l.tariff),T=Math.round(r*l.transport);u=r+h+T,y.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+N(h)}),y.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+N(T)})}o.push({seller:d?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:d?l?.deliveryTicks||1:0,condition:100,price:Math.round(u),available:n.newAvailable,delivery:d?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:d?l.deliveryTicks:0,used:!1,priceFactors:y,sourceNationId:e.id})}if(n.usedAvailable>0){const r=n.usedCondition,c=$i(i,e,{used:!0,condition:r});let f=c;const p=[{label:"Base price",value:N(t.basePrice)},{label:`Condition (${r}%)`,mod:"-"+N(Math.max(0,t.basePrice-c))}];if(d&&l){const u=Math.round(c*l.tariff),y=Math.round(c*l.transport);f=c+u+y,p.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+N(u)}),p.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+N(y)})}o.push({seller:d?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:d?l?.deliveryTicks||1:0,condition:r,price:Math.round(f),available:n.usedAvailable,delivery:d?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:d?l.deliveryTicks:0,used:!0,priceFactors:p,sourceNationId:e.id})}return o}function ft(){const i=Number(m?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=N(i);const e=st(J),t=Ye[e?.tier||1],n=document.getElementById("em-tier-badge");n&&(n.textContent=t.tag,n.style.color=t.color),n.style.background=t.color+"0a",n.style.border="1px solid "+t.color+"33";const o=document.getElementById("em-nation-select");if(o&&o.options.length===0){const d=S?.name||m?.nation||"—";let l=`<option value="">${x(d)} (HQ)</option>`;for(const r of ot)r.id!==S?.id&&(l+=`<option value="${r.id}">${x(r.name)}</option>`);o.innerHTML=l}const s=document.getElementById("em-import-tag"),a=Se&&S&&Se.id!==S.id;s&&(s.style.display=a?"":"none"),Un(),oi()}function Un(){let i="";for(let e=1;e<=3;e++){const t=Ye[e],n=Gt(e),o=e===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";i+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${t.color}">${t.tag}</div>
            <div class="${o}">`;for(const s of n){const a=J===s.key,d=Di(s.key).length>0;i+=`<span class="em-selector__btn${a?" active":""}${d?"":" no-listings"}"
                style="${a?"background:"+t.color+";border-color:"+t.color:""}"
                onclick="setEmType('${s.key}')">${x(s.name)}</span>`}i+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${i}</div>`}function oi(){const i=document.getElementById("em-content");if($e=Di(J),$e.length===0){i.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}ce>=$e.length&&(ce=0);let e="";for(let n=0;n<$e.length;n++){const o=$e[n],s=ce===n,a=o.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",d=Ti(o.condition);e+=`<div class="em-listing${s?" selected":""}" style="${s?"border-left-color:"+a:""}" onclick="setEmListing(${n})">`,e+=`<div class="em-listing__row1">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="em-listing__seller">${x(o.seller)}</span>
                <span class="em-badge em-badge--${o.sellerType.toLowerCase()}">${o.sellerType}</span>
                ${o.used?'<span class="em-badge em-badge--used">USED</span>':""}
            </div>
        </div>`,e+=`<div class="em-listing__row2">
            <span class="em-listing__nation">${x((o.nation||"").toUpperCase())}</span>
            ${o.distance>0?`<span class="em-listing__distance">${o.distance} nation${o.distance>1?"s":""} away</span>`:""}
            <span class="em-listing__delivery">Delivery: ${x(o.delivery)}</span>
        </div>`,e+=`<div class="em-listing__stats">
            <div class="em-stat-cell" style="flex:1">
                <div class="em-stat-cell__label">COND.</div>
                <div class="em-stat-cell__bar">
                    <div class="em-stat-cell__bar-track"><div class="em-stat-cell__bar-fill" style="width:${o.condition}%;background:${d}"></div></div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${d}">${o.condition}%</span>
                </div>
            </div>
            <div class="em-stat-cell" style="flex:0.8;text-align:center">
                <div class="em-stat-cell__label">AVAIL.</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${o.available}</div>
            </div>
            <div class="em-stat-cell" style="flex:1.2">
                <div class="em-stat-cell__label">PRICE/UNIT</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${N(o.price)}</div>
            </div>
        </div>`,s&&o.priceFactors&&(e+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${o.priceFactors.map(l=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${x(l.label)}</span>
                    <span class="em-breakdown__mod" style="color:${l.mod?l.mod.startsWith("-")?"var(--green)":l.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${l.mod||l.value}</span>
                </div>`).join("")}
            </div>`),e+="</div>"}const t=$e[ce];if(t){const n=st(J),o=Ye[n?.tier||1],s=Math.min(t.available,4),a=t.price*pe,d=(Number(m?.corp_cash_reserves)||0)>=a;e+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${x(n?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${x(t.seller)}</span>
                </div>
                <span class="em-purchase__price">${N(t.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:s},(l,r)=>r+1).map(l=>`<span class="em-qty-btn${pe===l?" active":""}" style="${pe===l?"background:"+o.color+";border-color:"+o.color:""}" onclick="setEmQty(${l})">${l}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${t.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${N(a)}</div>
                    ${t.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${x(t.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${o.color}" onclick="purchaseEquipment()"
                    ${d?"":"disabled"}
                    title="${d?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}i.innerHTML=e}async function Gn(i){if(!i)Se=null;else{let t=ot.find(n=>n.id===i);if(!t)try{const{data:n}=await $.from("nations").select("*").eq("id",i).single();t=n}catch{}Se=t||null}ce=0,pe=1;const e=document.getElementById("em-nation-select");e&&(e.value=i||""),ft()}function Wn(i){J=i,ce=0,pe=1,ft()}function Fn(i){ce=i,pe=1,oi()}function Vn(i){pe=i,oi()}let Bt=!1;async function Yn(){if(Bt)return;const i=$e[ce];if(!i||!m)return;const e=st(J);if(!e)return;const t=pe,n=i.price*t,o=Number(m.corp_cash_reserves)||0;if(n>o){alert("Insufficient cash reserves.");return}if(t>i.available){alert("Not enough units available.");return}const s=document.querySelector(".em-purchase-btn");s&&(s.disabled=!0,s.textContent="..."),Bt=!0;try{const a=o-n,{error:d}=await $.from("factions").update({corp_cash_reserves:a}).eq("id",m.id);if(d)throw d;const l=!i.deliveryTicks||i.deliveryTicks===0;if(l){const c=oe.find(A=>A.equipment_key===J),f=(c?.owned||0)+t,p=c?.purchase_price_avg||0,u=c?.owned||0,y=u>0?Math.round((p*u+i.price*t)/f):i.price,v=e.maintenancePerUnit*f,h=c?.condition||100,T=Math.round((h*u+i.condition*t)/f),{error:E}=await $.from("corp_equipment").upsert({faction_id:m.id,nation_id:m.nation_id,equipment_key:J,tier:e.tier,owned:f,deployed:c?.deployed||0,condition:T,maintenance_per_tick:v,purchase_price_avg:y,last_purchased_tick:O?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(E){const{error:A}=await $.from("factions").update({corp_cash_reserves:o}).eq("id",m.id);throw A&&console.error("Cash refund failed:",A.message),E}c?(c.owned=f,c.condition=T,c.maintenance_per_tick=v):oe.push({equipment_key:J,tier:e.tier,owned:f,deployed:0,condition:T,maintenance_per_tick:v,assigned_projects:[]})}else{const c=(O?.current_tick||0)+i.deliveryTicks,{error:f}=await $.from("corp_equipment_deliveries").insert({faction_id:m.id,equipment_key:J,quantity:t,condition:i.condition,delivery_tick:c,source_nation_id:i.sourceNationId||null,seller_name:i.seller,price_paid:n});if(f){const{error:p}=await $.from("factions").update({corp_cash_reserves:o}).eq("id",m.id);throw p&&console.error("Cash refund failed:",p.message),f}}m.corp_cash_reserves=a,ai(),ft();const r=document.getElementById("pr-cash");r&&(r.textContent=N(a)),s&&(s.textContent=l?"PURCHASED":"ORDERED",setTimeout(()=>{s.isConnected&&(s.disabled=!1,s.textContent="PURCHASE")},1500))}catch(a){s&&(s.disabled=!1,s.textContent="PURCHASE"),alert("Purchase failed: "+(a.message||"Unknown error"))}finally{Bt=!1}}let Qn=-1,Fe=[],Jt=[],Hi=[];function Nt(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(1)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function Kn(i,e,t){if(t)return"var(--orange)";const n=i/(e||1)*100;return n>50?"var(--green)":n>25?"var(--amber)":"var(--red)"}function Jn(){const i=document.getElementById("pm-list"),e=Fe.length,t=Jt.length,n=Hi.length,o=Fe.filter(l=>l.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${e})`,document.getElementById("pm-pending-count").textContent=`(${t})`,document.getElementById("pm-apply-count").textContent=`(${n})`;const s=document.getElementById("pm-badges");let a="";o>0&&(a+=`<span class="pm-badge pm-badge--expiring">${o} EXPIRING</span>`),t>0&&(a+=`<span class="pm-badge pm-badge--pending">${t} PENDING</span>`),s.innerHTML=a;const d=Fe.reduce((l,r)=>l+(r.cost||0),0)+Jt.reduce((l,r)=>l+(r.cost||0),0);document.getElementById("pm-total-cost").textContent=Nt(d),document.getElementById("pm-footer-active").textContent=e,document.getElementById("pm-footer-pending").textContent=t;{if(e===0){i.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let l="";Fe.forEach((r,c)=>{const f=Qn===c,p=Kn(r.ticks_left,r.total_ticks,r.expiring_soon),u=Math.min(r.ticks_left/(r.total_ticks||1)*100,100);l+=`<div class="pm-item ${r.expiring_soon?"pm-item--expiring":""} ${f?"expanded":""}" onclick="togglePmExpand(${c})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${x(r.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${x((r.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${p}">Expires: ${x(r.expires||"")}</span>
                        <span class="pm-item__ticks">(${r.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${u}%;background:${p}"></div></div>`,f&&(l+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${x(r.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${x(r.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${Nt(r.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${r.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${r.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(r.projects||[]).map(y=>`<span class="pm-project-chip">${x(y)}</span>`).join("")}</div>
                    </div>`,r.note&&(l+=`<div class="pm-note"><span class="pm-note__text">${x(r.note)}</span></div>`),r.expiring_soon&&r.renewable&&(l+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew">RENEW — ${Nt(r.cost||0)}</button></div>`),l+="</div>"),l+="</div></div>"}),i.innerHTML=l;return}}function Xn(){Fe=[],Jt=[],Hi=[],Jn()}let ke=[],Zn=-1;function de(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(2)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function ki(i){return i>=85?"var(--gold)":i>=60?"var(--green)":i>=40?"var(--orange)":"var(--red)"}function eo(i){return"dl-result--"+i.toLowerCase()}function Ei(){const i=document.getElementById("dl-list"),e=ke.length;document.getElementById("dl-count").textContent=`${e} COMPLETED`;const t=ke.reduce((d,l)=>{const r=l.financials||{};return d+((r.payment||0)+(r.bonus||0)-(r.penalty||0)-(r.total_cost||0))},0),n=document.getElementById("dl-lifetime-profit");n.textContent=(t>=0?"+":"")+de(t),n.style.color=t>=0?"var(--green)":"var(--red)";const o={};ke.forEach(d=>{o[d.result]=(o[d.result]||0)+1});const s=document.getElementById("dl-footer-results");if(s.innerHTML=Object.entries(o).map(([d,l])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[d]||"var(--text-dim)"}">${x(d)}</div>
            <div class="dl-footer__result-count">${l}</div>
        </div>`).join(""),e===0){i.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let a="";ke.forEach((d,l)=>{const r=Zn===l,c=d.financials||{},f=(c.payment||0)+(c.bonus||0)-(c.penalty||0)-(c.total_cost||0),p=f>=0,u=eo(d.result),v={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[d.result]||"var(--text-dim)",h=d.type==="GOVERNMENT";if(a+=`<div class="dl-item ${r?"expanded":""}" onclick="toggleDlExpand(${l})">
            <div class="dl-item__inner" style="border-left:2px solid ${v}">
                <div class="dl-item__row1">
                    <span class="dl-item__name">${x(d.name)}</span>
                    <span class="dl-result-badge ${u}">${x(d.result)}</span>
                </div>
                <div class="dl-item__row2">
                    <span class="dl-item__id">${x(d.id)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                    <span class="dl-item__issuer" style="color:${h?"var(--green)":"var(--gold)"}">${x(d.issuer)}</span>
                    <span class="dl-item__date">${x(d.delivered)}</span>
                </div>
                <div class="dl-summary-bar">
                    <div class="dl-summary-cell" style="flex:1;">
                        <div class="dl-summary-label">QUALITY</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span class="dl-summary-value" style="color:${ki(d.quality_score)}">${d.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${d.rep_change>0?"var(--green)":d.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${d.rep_change>0?"+":""}${d.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${p?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${p?"var(--green)":"var(--red)"};margin-top:2px;">${p?"+":""}${de(f)}</div>
                    </div>
                </div>`,r){const T=d.inspection||{};a+='<div style="margin-top:8px;">',a+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(I=>{const b=T[I]||{score:0,issues:[]},C=ki(b.score),k=Math.min(b.score/100*100,100);a+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${x(I.charAt(0).toUpperCase()+I.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${k}%;background:${C}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${C}">${b.score}</span>
                        </div>
                    </div>
                    ${(b.issues||[]).map(w=>`<div class="dl-inspect-issue">${x(w)}</div>`).join("")}
                </div>`});const E=T.permits||{passed:!0,issues:[]};a+=`<div class="dl-permits-row ${E.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${E.passed?"var(--green)":"var(--red)"}">${E.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${(E.issues||[]).map(I=>`<div class="dl-inspect-issue dl-inspect-issue--red">${x(I)}</div>`).join("")}
            </div>`,a+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',a+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(d.materials_used||[]).forEach(I=>{const b=I.grade==="HIGH"?"var(--green)":I.grade==="STANDARD"?"var(--amber)":"var(--orange)",C=I.impact==="positive"?"▲":I.impact==="negative"?"▼":"–",k=I.impact==="positive"?"var(--green)":I.impact==="negative"?"var(--red)":"var(--text-dim)";a+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${x(I.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${b}"></div>
                    <span class="dl-mat-tag__grade" style="color:${b}">${x(I.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${k}">${C}</span>
                </div>`}),a+="</div>",a+='<div class="dl-section-label">Financial Summary</div>',a+='<div class="dl-fin-panel">',a+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${de(c.contract_value||0)}</span></div>`,(c.bonus||0)>0&&(a+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${de(c.bonus)}</span></div>`),(c.penalty||0)>0&&(a+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${de(c.penalty)}</span></div>`);const A=(c.payment||0)+(c.bonus||0)-(c.penalty||0);a+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${de(A)}</span></div>`,a+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${de(c.total_cost||0)}</span></div>`,a+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${p?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${p?"var(--green)":"var(--red)"}">${p?"+":""}${de(f)}</span>
            </div>`,a+="</div>";const _=d.timeline||{};a+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${_.actual||0}/${_.expected||0} ticks</span>`,_.early?a+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(_.expected||0)-(_.actual||0)} TICK${_.expected-_.actual!==1?"S":""} EARLY</span>`:!_.on_time&&_.actual>_.expected&&(a+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(_.actual||0)-(_.expected||0)} TICK${_.actual-_.expected!==1?"S":""} LATE</span>`),a+="</div>",a+="</div>"}a+="</div></div>"}),i.innerHTML=a}async function to(){if(!m){ke=[],Ei();return}const{data:i,error:e}=await $.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",m.id).order("delivered_at_tick",{ascending:!1}).limit(20);e?(console.warn("Failed to load deliveries:",e.message),ke=[]):ke=(i||[]).map(t=>{const n=t.construction_contracts||{};return{id:t.contract_id,name:n.name||"Project",type:n.issuer_type||"GOVERNMENT",issuer:n.issuer_name||"Government",delivered:"Tick "+(t.delivered_at_tick||0),result:t.result,quality_score:t.quality_score,rep_change:t.rep_change,financials:{contract_value:t.contract_value||0,bonus:t.quality_bonus||0,penalty:t.penalties||0,payment:t.payment_received||0,total_cost:t.total_cost||0},inspection:t.inspection||{},materials_used:t.materials_used||[],timeline:{expected:t.timeline_expected||0,actual:t.timeline_actual||0,on_time:t.on_time,early:t.timeline_actual<t.timeline_expected}}}),Ei()}function ai(){const i=oe.reduce((d,l)=>d+(l.owned||0),0),e=oe.reduce((d,l)=>d+(l.deployed||0),0),t=dn(oe),n=i-e;document.getElementById("eq-count").textContent=i+" UNITS",document.getElementById("eq-summary").innerHTML=`
        <div class="eq-summary__cell">
            <div class="eq-summary__label">DEPLOYED</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--text-bright)">
                ${e} <span style="font-size:9px;color:var(--text-dim)">/ ${i}</span>
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
                ${N(t)}
            </div>
        </div>`;const o={};for(const d of oe)o[d.equipment_key]=d;let s="";for(let d=1;d<=3;d++){const l=Ye[d],r=Gt(d),c=Vt===d,f=r.reduce((u,y)=>u+(o[y.key]?.owned||0),0),p=r.reduce((u,y)=>u+(o[y.key]?.deployed||0),0);if(s+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${d})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${c?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${l.color}">${x(l.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${l.color};border:1px solid ${l.color}33;background:${l.color}0a">${l.tag}</span>
            </div>
            ${f>0?`<span class="eq-tier-hdr__count">${p}/${f}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,c)for(const u of r){const y=o[u.key],v=y?.owned||0,h=y?.deployed||0,T=y?.condition||0,E=u.maintenancePerUnit*v,A=v-h,_=v>0&&A===0,I=v>0&&T<65,b=Ti(T),C=y?.assigned_projects||[],k=C.length>0?C.map(w=>w.contract_name||"Project").join(", ").slice(0,30):v>0&&h>0?h+" project"+(h>1?"s":""):"—";s+=`<div class="eq-row${v===0?" unowned":""}">`,s+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${v===0?" dim":""}">${x(u.name)}</span>
                        ${I?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${v>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${_?"var(--orange)":"var(--green)"}">${A}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${h}/${v}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,v>0?s+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${T}%;background:${b}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${b}">${T}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${x(k)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${N(E)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:s+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',s+="</div>"}}document.getElementById("eq-list").innerHTML=s;const a=[1,2,3].map(d=>{const l=Ye[d],r=Gt(d).reduce((c,f)=>c+(o[f.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${r>0?l.color+"33":"var(--border-0)"};background:${r>0?l.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${l.color}">${l.tag}</div>
            <div class="eq-footer__tier-count" style="color:${r>0?"var(--text-bright)":"var(--text-dim)"}">${r}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${N(t)}</div>
        </div>
        <div class="eq-footer__tiers">${a}</div>`}function io(i){Vt=Vt===i?-1:i,ai()}async function no(){if(!m)return;const{data:i,error:e}=await $.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",m.id);e?(console.warn("Failed to load equipment:",e.message),oe=[]):oe=i||[],ai()}async function oo(){const{data:{user:i}}=await $.auth.getUser();if(!i){window.location.href="login.html";return}const{data:e}=await $.from("factions").select("*").or(`id.eq.${i.id},linked_user_id.eq.${i.id}`);We=(e||[]).filter(r=>r.nation_id);const t=sessionStorage.getItem("active_faction_id");if(m=We.find(r=>r.id===t)||We.find(r=>r.faction_type==="corporation")||We[0],!m){await $.auth.signOut(),window.location.href="login.html";return}if(m.faction_type!=="corporation"){window.location.href="dashboard.html";return}const[n,o]=await Promise.all([m.nation_id?$.from("nations").select("*").eq("id",m.nation_id).single():Promise.resolve({data:null}),$.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);n.error&&console.warn("Nation load failed:",n.error.message),n.data&&(S=n.data),o.error&&console.warn("Shard load failed:",o.error.message),O=o.data;const s=m.corp_ticker||m.abbreviation||"";if(document.getElementById("corp-logo").textContent=s.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=m.faction_name||"Unnamed Corp",O){if(document.getElementById("game-date").textContent=O.current_date||"—",document.getElementById("tick-number").textContent=O.current_tick||"—",O.next_tick_at){const c=(Number(O.tick_interval_hours)||8)*36e5,f=new Date(O.next_tick_at).getTime(),u=f-c+c/2;Yt=new Date(u>Date.now()?u:f+c/2),mn()}const r=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");r&&(r.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(s?"["+s+"]":m.faction_name||"Corp")+" ▾";const a=document.getElementById("topbar-cash");if(a){const r=Number(m.corp_cash_reserves??0),c=r>=1e9?"$"+(r/1e9).toFixed(1)+"B":r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k";a.textContent="CASH: "+c}const d=m.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+d+" AP</span>",document.getElementById("nation-pill").textContent=(S?.name||m.nation||"—").toUpperCase();const l=document.getElementById("corp-faction-dropdown");if(l){let r="";for(const c of We){const f=c.id===m.id,p=c.faction_type==="corporation"?"CORP":"PARTY",u=c.faction_type==="corporation"?"var(--teal)":"var(--amber)";r+=`<div class="corp-dd-item${f?" active":""}" onclick="switchToFaction('${c.id}', '${c.faction_type}')">
                <span class="corp-dd-type" style="color:${u}">${p}</span>
                <span class="corp-dd-name">${x(c.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${x(c.abbreviation||"—")}]</span>
            </div>`}l.innerHTML=r}await Promise.all([le(),Ri(),Rn(),no(),Xn(),to(),Xe()]);try{const{data:r}=await $.from("nations").select("*").order("name");ot=r||[]}catch{ot=[]}if(Pi(),ft(),ln(m,S,O),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",new URLSearchParams(window.location.search).get("tab")==="expansion"){const r=document.querySelector('[data-tab="expansion"]');r&&Ui({preventDefault:()=>{},target:r})}}async function ao(){await $.auth.signOut(),window.location.href="login.html"}function so(){const i=document.getElementById("corp-faction-dropdown");i&&i.classList.toggle("open")}function ro(i,e){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.remove("open"),sessionStorage.setItem("active_faction_id",i),e==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",i=>{const e=document.getElementById("faction-switcher"),t=document.getElementById("corp-faction-dropdown");t&&e&&!e.contains(i.target)&&t.classList.remove("open")});document.addEventListener("keydown",i=>{i.key==="Escape"&&Je()});window.doLogout=ao;window.toggleTheme=un;window.toggleCorpDropdown=so;window.switchToFaction=ro;window.setFilter=yn;window.openContractDetail=zi;window.closeContractDetail=Je;window.placeBid=Bn;window.toggleWhRow=qn;window.toggleEqTier=io;window.switchEmNation=Gn;window.setEmType=Wn;window.setEmListing=Fn;window.setEmQty=Vn;window.purchaseEquipment=Yn;window.setPrMat=On;window.setPrTier=Dn;window.setPrQty=Hn;window.purchaseMaterial=jn;let W={general:0,skilled:0,innovative:0},qt=!1;const Me=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function ji(i){const e=Number(S?.minimum_wage??50),t=Number(S?.inflation??50),n=Number(S?.standard_of_living??50),o=e/100*48e3,s=1+(t-50)/100*.5,a=1+(n-50)/100*.5;return Math.round(o*i*s*a)}function g(i){const e=Math.abs(i),t=i<0?"-":"";return e>=1e9?t+"$"+(e/1e9).toFixed(2)+"B":e>=1e6?t+"$"+(e/1e6).toFixed(2)+"M":e>=1e3?t+"$"+(e/1e3).toFixed(1)+"k":t+"$"+e.toLocaleString()}async function Ui(i){i.preventDefault(),document.getElementById("operations-content").style.display="none";const e=document.getElementById("expansion-content");e.style.display="flex",e.style.justifyContent="center",e.style.gap="12px",e.style.alignItems="flex-start",e.style.flexWrap="wrap",document.querySelectorAll(".corp-nav__tab").forEach(t=>t.classList.remove("active")),i.target.classList.add("active"),await Xe(),ut(),fo(),await si(),vt(),await Mo(),await wo(),bt(),gt(),await Po(),xt()}function Gi(i){i&&i.preventDefault(),document.getElementById("operations-content").style.display="flex",document.getElementById("expansion-content").style.display="none",document.querySelectorAll(".corp-nav__tab").forEach(e=>e.classList.remove("active")),document.querySelector('[data-tab="operations"]')?.classList.add("active")}function mt(){return U.reduce((e,t)=>{const n=Number(t.capacity||0),o=Number(t.condition||0)/100;return e+Math.floor(n*o)},0)+500}function lo(i,e){const t=Me.find(s=>s.id===i),n=Number(m?.[t.factionKey]??0),o=W[i]+e;if(!(n+o<0)){if(e>0){const s=Me.reduce((d,l)=>{const r=Number(m?.[l.factionKey]??0),c=l.id===i?o:W[l.id];return d+r+c},0),a=mt();if(s>a)return}W[i]=o,ut()}}function co(i){i?W[i]=0:W={general:0,skilled:0,innovative:0},ut()}async function po(){if(qt||!Object.values(W).some(a=>a!==0))return;let e=0;for(const a of Me){const d=W[a.id];d>0&&(e+=d*ji(a.multiplier)*.1)}const t=Number(m?.corp_cash_reserves??0);if(e>t){alert("Insufficient cash reserves. Hiring cost: "+g(e)+", available: "+g(t));return}const n=Me.reduce((a,d)=>a+Number(m?.[d.factionKey]??0)+W[d.id],0),o=mt();if(n>o){alert("Cannot hire beyond property capacity ("+o.toLocaleString()+"). You need more workplaces.");return}const s=e>0?`Confirm workforce changes?

Hiring fee: `+g(e)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(s)){qt=!0;try{const a={};for(const r of Me){const c=Number(m?.[r.factionKey]??0);a[r.factionKey]=Math.max(0,c+W[r.id])}e>0&&(a.corp_cash_reserves=Math.max(0,t-Math.round(e)));const{error:d}=await $.from("factions").update(a).eq("id",m.id);if(d)throw d;Object.assign(m,a),W={general:0,skilled:0,innovative:0};const l=document.getElementById("topbar-cash");if(l){const r=Number(m.corp_cash_reserves??0);l.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")}ut()}catch(a){alert("Error: "+a.message)}finally{qt=!1}}}function ut(){const i=document.getElementById("hf-card-container");if(!i)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=Number(S?.minimum_wage??50),o=Number(S?.inflation??50),s=Number(S?.standard_of_living??50),a=n/100*48e3,d=(1+(o-50)/100*.5).toFixed(2),l=(1+(s-50)/100*.5).toFixed(2),r=S?.name||m?.nation||"Nation",c=Object.values(W).some(E=>E!==0),f=mt();let p=0,u=0,y=0,v=0,h="";for(const E of Me){const A=Number(m?.[E.factionKey]??0),_=W[E.id],I=A+_,b=ji(E.multiplier),C=_>0,k=A*b,w=I*b,q=w-k;p+=A,u+=I,y+=k,v+=w;const L=_!==0?C?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";h+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${t.border};background:${L};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${E.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${E.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${t.text}">${A.toLocaleString()}</span>
                    ${_!==0?`<span style="font-family:${e};font-size:10px;color:${t.dim}">→</span>
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${C?t.greenBright:t.red}">${I.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${E.multiplier}.0 × ${d} × ${l})</span>
                <span style="font-family:${e};font-size:10px;color:${E.color}">${g(b)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${E.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.red};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-50</div>
                <div onclick="hfSetChange('${E.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.redDim};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${_!==0?t.card:"transparent"};border:1px solid ${_!==0?t.border:"transparent"}">
                    ${_!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${e};font-size:12px;font-weight:700;color:${C?t.greenBright:t.red}">${C?"+":""}${_}</span>
                        <span onclick="hfReset('${E.id}')" style="font-family:${e};font-size:8px;color:${t.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${e};font-size:9px;color:${t.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${E.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+10</div>
                <div onclick="hfSetChange('${E.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+50</div>
            </div>
            ${_!==0?`<div style="margin-top:6px;padding:4px 8px;background:${t.bg};border:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${q>0?t.red:t.greenBright}">${q>0?"+":""}${g(q)}/yr</span>
            </div>`:""}
        </div>`}const T=v-y;i.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Hire / Fire</span>
            </div>
            <span style="font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${r.toUpperCase()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            <div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:${t.card};">
                <div style="font-family:${e};font-size:8px;letter-spacing:1.5px;color:${t.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;gap:0;">
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">MIN WAGE</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${n}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">${g(a)}/yr</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">INFLATION</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${o}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${d}</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">STD OF LIVING</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${s}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${l}</div>
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
                        <span style="font-family:${e};font-size:13px;font-weight:700;color:${p>=f?t.red:t.text}">${c?u.toLocaleString():p.toLocaleString()}</span>
                        <span style="font-family:${e};font-size:9px;color:${t.dim}">/ ${f.toLocaleString()}</span>
                    </div>
                    ${p>=f&&!c?`<div style="font-family:${e};font-size:7px;color:${t.red};margin-top:2px;">Need workplaces to hire new employees.</div>`:""}
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${g(y)}</span>
                        ${c?`<span style="font-family:${e};font-size:9px;color:${t.dim}">→</span>
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${T>0?t.red:t.greenBright}">${g(v)}</span>`:""}
                    </div>
                </div>
            </div>
            ${c?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${t.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">NET CHANGE</span>
                    <span style="font-family:${e};font-size:11px;font-weight:700;color:${T>0?t.red:t.greenBright}">${T>0?"+":""}${g(T)}/yr</span>
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">(${T>0?"+":""}${g(Math.round(T/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${t.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}function fo(){const i=document.getElementById("wf-summary-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},n=(S?.name||m?.nation||"Nation").toUpperCase(),o=Number(S?.minimum_wage??50),s=Number(S?.inflation??50),a=Number(S?.standard_of_living??50),d=o/100*48e3,l=1+(s-50)/100*.5,r=1+(a-50)/100*.5,c=[{label:"General Workforce",mult:2,color:t.accent,key:"corp_general_workforce",countColor:t.text},{label:"Skilled Workforce",mult:3,color:t.gold,key:"corp_skilled_workforce",countColor:t.blue},{label:"Innovative Workforce",mult:6,color:t.orange,key:"corp_innovative_workforce",countColor:t.gold}];let f=0,p=0,u="";for(const y of c){const v=Number(m?.[y.key]??0),h=Math.round(d*y.mult*l*r),T=v*h;f+=v,p+=T,u+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${y.label}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${n}</span>
                </div>
                <span style="font-family:${e};font-size:16px;font-weight:700;color:${y.countColor}">${v.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${y.mult}.0 × ${l.toFixed(2)} × ${r.toFixed(2)})</span>
                <span style="font-family:${e};font-size:10px;color:${t.muted}">${g(h)}/yr</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">TOTAL ANNUAL COST</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${g(T)}</span>
            </div>
        </div>`}i.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Workforce</span>
            </div>
            <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.text}">${f.toLocaleString()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${u}
            <div style="padding:8px 12px;background:${t.card};border-bottom:1px solid ${t.border};">
                <div style="font-family:${e};font-size:8px;letter-spacing:1px;color:${t.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">MINIMUM WAGE (${n})</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">${o}/100 → ${g(d)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">INFLATION MODIFIER</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">×${l.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">STD OF LIVING MODIFIER</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">×${r.toFixed(2)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL WORKFORCE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.text}">${f.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL ANNUAL WAGES</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${g(p)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">PER TICK (÷12)</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${g(Math.round(p/12))}</span>
            </div>
        </div>
    </div>`}let U=[];async function Xe(){if(!m?.id)return;const{data:i}=await $.from("corp_properties").select("*").eq("faction_id",m.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});U=i||[]}function yt(){const i=document.getElementById("property-card-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=(S?.name||m?.nation||"Nation").toUpperCase(),o=1+(Number(S?.inflation??50)-50)/100*.3;let s="",a=0,d=0;const l=S?.name||m?.nation||"Home Nation",r=5e7,c=1+(Number(S?.inflation??50)-50)/100*.3,f=.8+Number(S?.stability??50)/100*.4,p=Math.round(r*c*f),u=Math.round(p*.005);a+=p,d+=u,s+=`
    <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span style="font-size:11px;font-weight:600;color:${t.text}">National Headquarters</span>
            <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:#5c5;background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">HQ</span>
        </div>
        <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:4px;">${l} · Headquarters</div>
        <div style="display:flex;gap:0;background:${t.card};border:1px solid ${t.border}">
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">CAPACITY</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">500</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">VALUE</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${g(p)}</div>
            </div>
            <div style="flex:1;padding:3px 6px">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${g(u)}</div>
            </div>
        </div>
    </div>`;for(const y of U){const v=at[y.style]||at.Basic;a+=Number(y.purchase_price||0),d+=Number(y.monthly_maintenance||0),s+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:${t.text}">${y.name}</span>
                <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${t.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">OWNED</span>
            </div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:4px;">${y.city||n} · ${(y.type||"").replace(/_/g," ")} · <span style="color:${v.color}">${(y.style||"Basic").toUpperCase()}</span></div>
            <div style="display:flex;gap:0;background:${t.card};border:1px solid ${t.border}">
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">CAPACITY</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${(y.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">PAID</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${g(y.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${g(y.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="margin-top:4px;display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">CONDITION</span>
                <span style="font-family:${e};font-size:9px;color:${y.condition>=75?"#5c5":y.condition>=50?"#ca5":t.orange}">${y.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:${t.border};margin-top:2px;"><div style="width:${y.condition}%;height:100%;background:${y.condition>=75?"#5c5":y.condition>=50?"#ca5":t.orange}"></div></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <div onclick="propRefurbish('${y.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.accent};border:1px solid ${t.accent}33;cursor:pointer;">REFURBISH (${g(Math.round((y.purchase_price||0)*.1*o))})</div>
                <div onclick="propSell('${y.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.red};border:1px solid ${t.red}33;cursor:pointer;">SELL</div>
            </div>
        </div>`}i.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Property</span>
            </div>
            <span style="font-family:${e};font-size:10px;color:${t.muted}">${U.length+1} ASSET${U.length+1!==1?"S":""}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${s}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL VALUE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.green}">${g(a)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL MAINTENANCE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${g(d)}/mo</span>
            </div>
        </div>
    </div>`}let Re=[],Q=null;const at={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function si(){if(!m?.nation_id)return;const{data:i,error:e}=await $.from("available_properties").select("*").eq("nation_id",m.nation_id).eq("status","available").order("price",{ascending:!0});if(e){console.warn("[Property] Failed to load marketplace:",e.message);return}Re=(i||[]).map(t=>({...t,adjusted_cost:t.price,adjusted_maintenance:t.monthly_maintenance}))}function vt(){const i=document.getElementById("new-property-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"};(S?.name||m?.nation||"Nation").toUpperCase();const n=Number(S?.standard_of_living??50),o=Number(S?.gdp_growth??50),s=Number(S?.inflation??50),a=S?.capital||"Capital",d={capital:a,port:a+" Port",industrial:a+" Industrial Zone",suburban:a+" Suburbs",coastal:a+" Coast"};let l="";if(Re.length===0)l=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let r=0;r<Re.length;r++){const c=Re[r],f=Q===r,p=at[c.style]||at.Basic,u=d[c.city_template]||a;l+=`
            <div onclick="npSelect(${r})" style="padding:8px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${f?t.accent:"transparent"};background:${f?"rgba(139,154,107,0.03)":"transparent"};">
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
                        <div style="font-family:${e};font-size:11px;font-weight:700;color:${t.gold};margin-top:1px">${g(c.adjusted_cost)}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">MAINT/MO</div>
                        <div style="font-family:${e};font-size:11px;font-weight:700;color:${t.redDim};margin-top:1px">${g(c.adjusted_maintenance)}</div>
                    </div>
                </div>
                ${f?`<div style="margin-top:5px;">
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
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${Re.length} AVAILABLE</span>
        </div>
        <div style="padding:4px 14px;border-bottom:1px solid ${t.border};display:flex;gap:12px;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">STD OF LIVING</span>
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${n>=50?t.greenBright:t.yellow}">${Math.round(n)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">GDP GROWTH</span>
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${o>=50?t.greenBright:t.yellow}">${Math.round(o)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">INFLATION</span>
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${s<=50?t.greenBright:t.red}">${Math.round(s)}</span>
            </div>
        </div>
        <div style="flex:1;overflow:auto;">
            ${l}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;gap:6px;justify-content:space-between;">
                <div onclick="npOpenConstructionModal()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${t.gold};border:1px solid ${t.gold}44;cursor:pointer">CONSTRUCTION PROJECT</div>
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${Q!==null?"#000":t.dim};background:${Q!==null?t.accent:"transparent"};border:1px solid ${Q!==null?t.accent:t.border};cursor:${Q!==null?"pointer":"default"};opacity:${Q!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function mo(i){Q=Q===i?null:i,vt()}let Rt=!1;async function uo(){if(Q===null||Rt)return;const i=Re[Q];if(!i)return;const e=Number(m?.corp_cash_reserves??0);if(i.adjusted_cost>e){alert(`Insufficient cash reserves.
Property: `+g(i.adjusted_cost)+`
Cash: `+g(e));return}if(confirm('Buy "'+i.name+'" for '+g(i.adjusted_cost)+`?

Monthly maintenance: `+g(i.adjusted_maintenance)+`/mo
Condition: `+i.condition+`%

This will be deducted from your cash reserves.`)){Rt=!0;try{const{error:t}=await $.from("corp_properties").insert({faction_id:m.id,nation_id:m.nation_id,catalog_id:i.catalog_id||null,name:i.name,type:i.type,style:i.style,capacity:i.capacity,purchase_price:i.adjusted_cost,monthly_maintenance:i.adjusted_maintenance,condition:i.condition,city:i.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(t)throw t;const n=Math.max(0,e-i.adjusted_cost),{error:o}=await $.from("factions").update({corp_cash_reserves:n}).eq("id",m.id);if(o)throw o;m.corp_cash_reserves=n,i.id&&await $.from("available_properties").update({status:"sold",purchased_by:m.id}).eq("id",i.id);const s=document.getElementById("topbar-cash");s&&(s.textContent="CASH: "+(n>=1e6?"$"+(n/1e6).toFixed(1)+"M":"$"+Math.round(n/1e3)+"k")),Q=null,await si(),vt(),yt(),alert("Property purchased: "+i.name+`

Deducted: `+g(i.adjusted_cost))}catch(t){alert("Purchase failed: "+t.message)}finally{Rt=!1}}}const Ee={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let ri=!1,M={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},Pt=!1;function Wi(){const e=1+(Number(S?.inflation??50)-50)/100*.3,t=Ee[M.style]?.costMod||1,n=M.type==="Warehouse"?.75:1,o=Math.round(M.size*1e5*e*t*n),s=Math.round(o*(1+M.budgetMod/100)),a=Math.round(s*.007*(Ee[M.style]?.maintMod||1));return{baseBudget:o,adjusted:s,maint:a,inflMod:e,styleMod:t}}function yo(){ri=!0,M={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},Fi()}function li(){ri=!1,document.getElementById("cp-modal-overlay")?.remove()}function vo(i,e){M[i]=e,Fi()}async function go(){if(!(Pt||!M.name.trim())){Pt=!0;try{const i=Wi(),e=S?.name||m?.nation||"Unknown",t=Ee[M.style]?.repGain||1,n=await $.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),o=n.data?.current_tick||0,s=(n.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:a}=await $.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",m.nation_id).eq("issuer_type","PRIVATE"),l=`PVT-C${(a||0)+1}-${s}`,{error:r}=await $.from("construction_contracts").insert({nation_id:m.nation_id,template_key:"custom_building",sector:"civil_engineering",name:M.name.trim(),description:`${M.type} (${M.style}) — ${M.size.toLocaleString()} employees, commissioned by ${m.faction_name}`,project_code:l,budget_ceiling:i.adjusted,timeline_ticks:M.timeline,required_materials:(()=>{const c=M.size/1e3,f=M.style,p={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[f]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},u=(y,v)=>Math.max(1,Math.ceil(c*y*v));return{concrete:u(8,p.concrete),steel:u(6,p.steel),glass_facades:u(3,p.glass),em_systems:u(4,p.em),lumber:u(1,p.lumber),heavy_parts:u(2,p.heavy),aggregate:u(3,p.agg)}})(),required_equipment:(()=>{const c=["work_trucks","concrete_mixers"];return M.size>1e3&&c.push("excavators","tower_cranes"),M.size>3e3&&c.push("bulldozers","heavy_haulers"),M.size>8e3&&c.push("pile_drivers"),c})(),required_workforce:{general:Math.ceil(M.size*.08),skilled:Math.ceil(M.size*.03)},status:"open",generated_at_tick:o,bidding_ends_tick:o+3,issuer_type:"PRIVATE",issuer_name:m.faction_name,issuer_faction_id:m.id});if(r)throw r;li(),alert(`Construction project submitted!

Project: `+M.name.trim()+`
Code: `+l+`
Budget: `+g(i.adjusted)+`
Expected Reputation: +`+t+`

All construction corporations in `+e+" can now bid on this project.")}catch(i){alert("Failed to submit project: "+i.message)}finally{Pt=!1}}}function Fi(){if(document.getElementById("cp-modal-overlay")?.remove(),!ri)return;const i="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=Wi(),n=S?.name||m?.nation||"Nation",o=Ee[M.style]?.repGain||1,s=o>=4?e.gold:o>=3?e.greenBright:o>=2?e.accent:e.dim,a=Object.entries(Ee).map(([r,c])=>{const f=M.style===r;return`<div onclick="cpSetField('style','${r}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${f?c.color+"18":"transparent"};border:1px solid ${f?c.color+"44":e.border};">
            <div style="font-family:${i};font-size:9px;font-weight:700;color:${f?c.color:e.dim}">${r}</div>
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
                <input id="cp-name-input" value="${M.name.replace(/"/g,"&quot;")}" placeholder="e.g., McKenna Tower"
                    style="width:100%;padding:6px 10px;font-family:${i};font-size:11px;color:${e.text};background:${e.card};border:1px solid ${e.border};outline:none;box-sizing:border-box;" />
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Type</div>
                <div style="display:flex;gap:4px;">
                    ${["Regional HQ","Office Building",...m?.corp_sector==="Construction"?["Warehouse"]:[]].map(r=>`<span onclick="cpSetField('type','${r}')" style="flex:1;text-align:center;padding:5px 0;font-family:${i};font-size:9px;font-weight:700;cursor:pointer;color:${M.type===r?"#000":e.dim};background:${M.type===r?r==="Warehouse"?e.orange:e.accent:"transparent"};border:1px solid ${M.type===r?r==="Warehouse"?e.orange:e.accent:e.border}">${r}</span>`).join("")}
                    ${m?.corp_sector==="Construction"?`<div style="font-family:${i};font-size:7px;color:${e.orange};margin-top:3px;">Construction: Warehouse available (75% cost, stores up to $20M materials)</div>`:""}
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase">Size (Employees)</span>
                    <span style="font-family:${i};font-size:14px;font-weight:700;color:${e.text}">${M.size.toLocaleString()}</span>
                </div>
                <input type="range" min="500" max="18000" step="500" value="${M.size}" oninput="cpSetField('size',+this.value)"
                    style="width:100%;accent-color:${e.accent};height:4px;" />
                <div style="display:flex;justify-content:space-between;font-family:${i};font-size:7px;color:${e.dim};margin-top:2px">
                    <span>500 min</span><span>18,000 max</span>
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Style</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">${a}</div>
                <div style="margin-top:4px;font-family:${i};font-size:8px;color:${Ee[M.style].color}">${Ee[M.style].desc}</div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase">Timeline</span>
                    <span style="font-family:${i};font-size:12px;font-weight:700;color:${e.text}">${M.timeline} months</span>
                </div>
                <input type="range" min="24" max="60" step="6" value="${M.timeline}" oninput="cpSetField('timeline',+this.value)"
                    style="width:100%;accent-color:${e.gold};height:4px;" />
                <div style="display:flex;justify-content:space-between;font-family:${i};font-size:7px;color:${e.dim};margin-top:2px">
                    <span>24 months</span><span>60 months</span>
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Budget</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:8px 10px;">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${e.border}">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">BASE (${M.size.toLocaleString()} × $100k × ${t.inflMod.toFixed(2)} × ${t.styleMod.toFixed(1)})</span>
                        <span style="font-family:${i};font-size:9px;color:${e.muted}">${g(t.baseBudget)}</span>
                    </div>
                    <div style="padding:6px 0">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                            <span style="font-family:${i};font-size:8px;color:${e.dim}">ADJUSTMENT</span>
                            <span style="font-family:${i};font-size:10px;font-weight:700;color:${M.budgetMod>0?e.greenBright:M.budgetMod<0?e.red:e.dim}">${M.budgetMod>0?"+":""}${M.budgetMod}%</span>
                        </div>
                        <input type="range" min="-15" max="15" step="1" value="${M.budgetMod}" oninput="cpSetField('budgetMod',+this.value)"
                            style="width:100%;accent-color:${e.accent};height:4px;" />
                        <div style="display:flex;justify-content:space-between;font-family:${i};font-size:7px;color:${e.dim};margin-top:2px">
                            <span>-15% (budget cut)</span><span>+15% (quality invest)</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px solid ${e.border}">
                        <span style="font-family:${i};font-size:9px;font-weight:700;color:${e.text}">TOTAL BUDGET</span>
                        <span style="font-family:${i};font-size:14px;font-weight:700;color:${e.gold}">${g(t.adjusted)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">EST. MONTHLY MAINTENANCE</span>
                        <span style="font-family:${i};font-size:9px;color:${e.redDim}">${g(t.maint)}/mo</span>
                    </div>
                </div>
            </div>

            <div style="padding:6px 8px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);margin-bottom:8px;">
                <div style="font-family:${i};font-size:8px;color:${e.gold};margin-bottom:2px">WHAT HAPPENS NEXT</div>
                <div style="font-size:9px;color:${e.dim};line-height:1.5">
                    This project will appear as a Civil Engineering bid in the Open Contracts pool for all construction corporations with an HQ or Regional HQ in ${n}. The lowest qualified bidder wins the contract and begins construction.
                </div>
            </div>

            <div style="padding:6px 8px;background:rgba(139,154,107,0.04);border:1px solid rgba(139,154,107,0.12);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:${i};font-size:9px;color:${e.accent}">EXPECTED REPUTATION GAIN</span>
                    <span style="font-family:${i};font-size:16px;font-weight:700;color:${s}">+${o}</span>
                </div>
                <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:2px">${M.style} style · ${o===5?"Maximum prestige":o>=4?"Impressive presence":o>=3?"Strong statement":o>=2?"Solid investment":"Functional addition"}</div>
            </div>

        </div>
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${i};font-size:7px;color:${e.dim}">TOTAL PROJECT</div>
                <div style="font-family:${i};font-size:14px;font-weight:700;color:${e.gold}">${g(t.adjusted)}</div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="cpClose()" style="padding:5px 16px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:5px 16px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${e.gold};cursor:pointer;opacity:${M.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(d);const l=document.getElementById("cp-name-input");l&&l.addEventListener("input",r=>{M.name=r.target.value}),d.addEventListener("click",r=>{r.target===d&&li()})}function bo(){const i=document.getElementById("cp-name-input");if(i&&(M.name=i.value),!M.name.trim()){alert("Please enter a building name.");return}go()}window.cpClose=li;window.cpSetField=vo;window.cpSubmitFromModal=bo;window.npSelect=mo;window.npBuyProperty=uo;window.npOpenConstructionModal=yo;let De=!1;async function xo(i){if(De)return;const e=U.find(d=>d.id===i);if(!e)return;const t=1+(Number(S?.inflation??50)-50)/100*.3,n=Math.round((e.purchase_price||0)*.1*t),o=Number(m?.corp_cash_reserves??0);if(n>o){alert("Insufficient cash. Refurbishment costs "+g(n)+" (inflation-adjusted), you have "+g(o));return}if(e.condition>=95){alert("Property is already in excellent condition ("+e.condition+"%).");return}const s=5+Math.floor(Math.random()*21),a=Math.min(100,e.condition+s);if(confirm('Refurbish "'+e.name+`"?

Cost: `+g(n)+`
Expected improvement: +`+s+"% condition ("+e.condition+"% → "+a+"%)")){De=!0;try{await $.from("corp_properties").update({condition:a}).eq("id",i);const d=Math.max(0,o-n);await $.from("factions").update({corp_cash_reserves:d}).eq("id",m.id),m.corp_cash_reserves=d;const l=document.getElementById("topbar-cash");l&&(l.textContent="CASH: "+(d>=1e6?"$"+(d/1e6).toFixed(1)+"M":"$"+Math.round(d/1e3)+"k")),await Xe(),yt(),alert("Refurbished! Condition: "+e.condition+"% → "+a+"%")}catch(d){alert("Refurbishment failed: "+d.message)}finally{De=!1}}}async function $o(i){if(De)return;const e=U.find(s=>s.id===i);if(!e)return;const t=1+(Number(S?.inflation??50)-50)/100*.3,n=(e.condition||50)/100,o=Math.round((e.purchase_price||0)*.6*n*t);if(confirm('Sell "'+e.name+`"?

Sale value: `+g(o)+" (60% × "+e.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){De=!0;try{await $.from("corp_properties").update({is_active:!1}).eq("id",i);const a=Number(m?.corp_cash_reserves??0)+o;await $.from("factions").update({corp_cash_reserves:a}).eq("id",m.id),m.corp_cash_reserves=a;const l=(await $.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await $.from("available_properties").insert({nation_id:m.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,price:Math.round(o*1.1),monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,generated_at_tick:l,expires_at_tick:l+6,status:"available"});const r=document.getElementById("topbar-cash");r&&(r.textContent="CASH: "+(a>=1e6?"$"+(a/1e6).toFixed(1)+"M":"$"+Math.round(a/1e3)+"k")),await Xe(),yt(),await si(),vt(),alert('Sold "'+e.name+'" for '+g(o))}catch(s){alert("Sale failed: "+s.message)}finally{De=!1}}}window.propRefurbish=xo;window.propSell=$o;const he={SALE:.8,DISSOLVE:.6,REVENUE_BASE:.02,GDP_NEUTRAL:30,DEFAULT_REPUTATION:25};function _o(i){if(!i)return 0;const e=i.trim().replace(/[$,]/g,""),t=e.match(/^([\d.]+)\s*[Mm]$/),n=e.match(/^([\d.]+)\s*[Kk]$/);return Math.round(t?parseFloat(t[1])*1e6:n?parseFloat(n[1])*1e3:parseFloat(e))}function Ue(i){const e=document.getElementById("topbar-cash");e&&(e.textContent="CASH: "+(i>=1e6?"$"+(i/1e6).toFixed(1)+"M":"$"+Math.round(i/1e3)+"k"))}function ho(i){return Ge.find(e=>e.id===i)?.name||"—"}function di(i){return U.filter(e=>e.nation_id===i)}async function ci(){Pe=0,await Xe(),yt(),gt(),bt()}let re=!1,Pe=0,it={};async function wo(){if(m?.id)try{const{data:i}=await $.from("construction_contracts").select("nation_id").eq("awarded_to_faction",m.id).in("status",["in_progress","awarded"]);it={};for(const e of i||[])e.nation_id&&(it[e.nation_id]=(it[e.nation_id]||0)+1)}catch{}}function Vi(i){const e=di(i.nation_id),t=e.reduce((y,v)=>y+Number(v.purchase_price||0),0),n=e.reduce((y,v)=>y+Number(v.capacity||0),0),o=it[i.nation_id]||0,s=Ge.find(y=>y.id===i.nation_id),a=(i.name||"").trim().split(/\s+/),d=a.length>=2?a.map(y=>y[0]).join("").toUpperCase().slice(0,4):(i.name||"SUB").slice(0,4).toUpperCase(),l=Number(i.sub_cash||0),r=Number(s?.gdp_growth??50),c=l*he.REVENUE_BASE,f=(r-he.GDP_NEUTRAL)/100,p=he.DEFAULT_REPUTATION/100,u=l>0?Math.round(c*(1+f)*p):0;return{id:i.id,name:i.name,abbr:d,nation:s?.name||i.city||"—",nationId:i.nation_id,sector:m?.corp_sector||"General",subsector:i.subsector||m?.corp_subsector||"—",revenue:u,debt:0,cash:l,reputation:he.DEFAULT_REPUTATION,valuation:t,workforce:n,projects:o,established:i.created_at?new Date(i.created_at).getFullYear().toString():"—",trend:r>=40&&l>0?"up":r>=he.GDP_NEUTRAL&&l>0?"flat":"down",profitable:u>0}}function gt(){const i=document.getElementById("manage-subsidiaries-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},o=U.filter(c=>c.type==="regional_hq").map(Vi);Pe>=o.length&&(Pe=0);const s=o[Pe]||null;let a="";o.length===0&&(a=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No subsidiaries established.<br>Use Create Subsidiary to expand.</div>`);let d=0,l=0;for(let c=0;c<o.length;c++){const f=o[c],p=c===Pe;d+=f.revenue,l+=f.valuation;const u=f.trend==="up"?t.greenBright:f.trend==="down"?t.red:t.dim,y=f.trend==="up"?"▲":f.trend==="down"?"▼":"–";a+=`
        <div onclick="selectSubsidiary(${c})" style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${p?t.accent:"transparent"};background:${p?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:40px;font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${f.abbr}</span>
            <div style="flex:1.5;">
                <div style="font-size:11px;font-weight:600;color:${t.text};line-height:1.2">${f.name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${f.subsector}</div>
            </div>
            <span style="width:65px"><span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${f.nation.toUpperCase().slice(0,8)}</span></span>
            <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${f.profitable?t.greenBright:t.redDim};text-align:right">${g(f.revenue)}</span>
            <span style="width:40px;font-family:${e};font-size:9px;font-weight:700;color:${f.reputation>=40?t.accent:f.reputation>=25?t.yellow:t.orange};text-align:right">${f.reputation}</span>
            <span style="width:55px;font-family:${e};font-size:9px;color:${t.muted};text-align:right">${g(f.valuation)}</span>
            <span style="width:12px;font-family:${e};font-size:8px;color:${u};text-align:right">${y}</span>
        </div>`}let r="";if(s){const c=s.trend==="up"?t.greenBright:s.trend==="down"?t.red:t.dim,f=s.trend==="up"?"▲":s.trend==="down"?"▼":"–",p=s.trend==="up"?"Growing":s.trend==="down"?"Declining":"Stable",u=s.reputation>=40?t.accent:s.reputation>=25?t.yellow:t.orange,y=[{label:"Revenue",value:g(s.revenue),color:s.profitable?t.greenBright:t.redDim},{label:"Cash",value:g(s.cash),color:t.text},{label:"Debt",value:s.debt>0?g(s.debt):"$0",color:s.debt>0?t.orange:t.dim},{label:"Reputation",value:s.reputation+"/100",color:u},{label:"Market Valuation",value:g(s.valuation),color:t.gold},{label:"Workforce",value:s.workforce.toLocaleString(),color:t.text},{label:"Active Projects",value:s.projects.toString(),color:s.projects>0?t.text:t.dim}],v=s.projects===0;r=`
            <div style="padding:8px 14px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                    <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.gold}">${s.abbr}</span>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${s.name}</span>
                </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${s.nation.toUpperCase()}</span>
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">Est. ${s.established}</span>
                    <span style="font-family:${e};font-size:8px;color:${c}">${f} ${p}</span>
                </div>
            </div>
            ${y.map(h=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 14px;border-bottom:1px solid ${t.border};">
                <span style="font-family:${e};font-size:9px;color:${t.dim};letter-spacing:0.5px;text-transform:uppercase">${h.label}</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;color:${h.color}">${h.value}</span>
            </div>`).join("")}
            <div style="padding:6px 14px;border-bottom:1px solid ${t.border};flex-shrink:0;">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                    <span style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">REPUTATION</span>
                    <span style="font-family:${e};font-size:8px;color:${t.muted}">75% sub / 25% parent</span>
                </div>
                <div style="width:100%;height:4px;background:${t.border}"><div style="width:${s.reputation}%;height:100%;background:${u}"></div></div>
            </div>
            <div style="flex:1"></div>
            <div style="padding:6px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                <div style="font-family:${e};font-size:8px;letter-spacing:1.5px;color:${t.dim};text-transform:uppercase;margin-bottom:6px">Actions</div>
                <div style="display:flex;gap:4px;margin-bottom:4px;">
                    <div onclick="subInjectCapital('${s.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${t.greenBright};border:1px solid ${t.greenDark};background:rgba(74,170,136,0.06)">INJECT CAPITAL</div>
                    <div onclick="subWithdraw('${s.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${s.cash>0?t.gold:t.dim};border:1px solid ${s.cash>0?t.gold+"44":t.border};opacity:${s.cash>0?1:.4}">WITHDRAW</div>
                </div>
                <div style="display:flex;gap:4px;">
                    <div onclick="subMerge('${s.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${t.accent};border:1px solid ${t.accent}">MERGE</div>
                    <div onclick="subSell('${s.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${t.orange};border:1px solid ${t.orange}">SELL</div>
                    <div onclick="${v?"subDissolve('"+s.id+"')":""}" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${v?t.red:t.dim};border:1px solid ${v?t.red:t.border};opacity:${v?1:.3}">DISSOLVE</div>
                </div>
                ${s.projects>0?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${t.dim}">Cannot dissolve with active projects.</div>`:""}
            </div>`}else r=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a subsidiary to manage.</div>`;i.innerHTML=`
    <div style="width:760px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Manage Subsidiaries</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${o.length} ACTIVE</span>
        </div>
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${t.border};display:flex;flex-direction:column;">
                <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                    <span style="width:40px;font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">ABBR</span>
                    <span style="flex:1.5;font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">NAME</span>
                    <span style="width:65px;font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">NATION</span>
                    <span style="width:55px;font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px;text-align:right">REVENUE</span>
                    <span style="width:40px;font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px;text-align:right">REP</span>
                    <span style="width:55px;font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px;text-align:right">VALUE</span>
                    <span style="width:12px"></span>
                </div>
                <div style="flex:1;overflow:auto;">${a}</div>
                <div style="padding:6px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;display:flex;align-items:center;">
                    <span style="width:40px"></span>
                    <span style="flex:1.5;font-family:${e};font-size:8px;color:${t.dim}">COMBINED</span>
                    <span style="width:65px"></span>
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${g(d)}</span>
                    <span style="width:40px"></span>
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${g(l)}</span>
                    <span style="width:12px"></span>
                </div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${r}
            </div>
        </div>
    </div>`}async function Yi(i,e){if(re)return;const t=U.find(u=>u.id===i);if(!t)return;const n=e==="sell",o=n?he.SALE:he.DISSOLVE,s=n?"SELL":"DISSOLVE",a=n?"sold":"dissolved",d=n?"80%":"60%",l=ho(t.nation_id),r=di(t.nation_id),c=r.reduce((u,y)=>u+Math.round((y.purchase_price||0)*o*(y.condition||50)/100),0),f=Number(t.sub_cash||0),p=c+f;if(confirm(s+' subsidiary "'+t.name+`"?

`+r.length+" properties at "+d+` × condition:
  Property value: `+g(c)+`
  Subsidiary cash: `+g(f)+`
  ─────────────────
  Total return: `+g(p)+`

All operations in `+l+` cease.
This cannot be undone.`)){re=!0;try{const u=r.map(v=>v.id);if(u.length===1){const{error:v}=await $.from("corp_properties").update({is_active:!1,sub_cash:0}).eq("id",u[0]);if(v)throw v}else if(u.length>1){const{error:v}=await $.from("corp_properties").update({is_active:!1,sub_cash:0}).in("id",u);if(v)throw v}const y=Number(m?.corp_cash_reserves??0)+p;await $.from("factions").update({corp_cash_reserves:y}).eq("id",m.id),m.corp_cash_reserves=y,Ue(y),await ci(),alert("Subsidiary "+a+". "+r.length+` properties liquidated.
Total received: `+g(p))}catch(u){alert("Failed: "+u.message)}finally{re=!1}}}function ko(i){Yi(i,"sell")}function Eo(i){Yi(i,"dissolve")}async function Qi(i,e){if(re)return;const t=U.find(f=>f.id===i);if(!t)return;const n=Number(m?.corp_cash_reserves??0),o=Number(t.sub_cash||0),s=e?"WITHDRAW":"INJECT CAPITAL";if(e&&o<=0){alert("This subsidiary has no cash to withdraw.");return}const a=e?o:n,d=prompt(s+(e?" from ":" into ")+t.name+`

Parent cash: `+g(n)+`
Subsidiary cash: `+g(o)+`

Enter amount (e.g., 5000000 or 5M):`);if(!d)return;const l=_o(d);if(!l||l<=0||isNaN(l)){alert("Invalid amount.");return}if(l>a){alert("Insufficient "+(e?"subsidiary":"parent")+" cash. Available: "+g(a));return}const r=e?n+l:n-l,c=e?o-l:o+l;if(confirm(s+" "+g(l)+(e?" from ":" into ")+t.name+`?

Parent: `+g(n)+" → "+g(r)+`
Subsidiary: `+g(o)+" → "+g(c))){re=!0;try{await Promise.all([$.from("factions").update({corp_cash_reserves:r}).eq("id",m.id),$.from("corp_properties").update({sub_cash:c}).eq("id",i)]),m.corp_cash_reserves=r,t.sub_cash=c,Ue(r),gt(),alert((e?"Withdrew ":"Injected ")+g(l)+(e?" from ":" into ")+t.name+".")}catch(f){alert("Failed: "+f.message)}finally{re=!1}}}function To(i){Qi(i,!1)}function Co(i){Qi(i,!0)}async function Io(i){if(re)return;const e=U.find(v=>v.id===i);if(!e)return;const t=Vi(e);t.nation;const n=di(e.nation_id),o=t.valuation,s=t.cash,a=t.reputation,d=t.subsector,l=Math.round(o*2.25),r=Math.round(a*.1),c=Math.round(a*.2),f=mt(),p=Me.reduce((v,h)=>v+Number(m?.[h.factionKey]??0),0),u=Math.max(0,f-p),y=Number(m?.corp_cash_reserves??0);if(l>y){alert(`Insufficient cash to acquire subsidiary.

Acquisition cost (2.25× valuation): `+g(l)+`
Available cash: `+g(y));return}if(t.projects>0){alert("Cannot merge — subsidiary has "+t.projects+" active project(s). Complete or abandon them first.");return}if(confirm('MERGE "'+e.name+`" INTO YOUR CORPORATION

Acquisition cost (2.25× valuation): `+g(l)+`
Subsidiary cash absorbed: `+g(s)+`
Net cost: `+g(l-s)+`

• `+n.length+` properties transferred to parent
• Subsidiary subsector "`+d+`" added to portfolio
• Workers hired to max capacity (+`+u.toLocaleString()+`)
• Reputation: +`+r+" or -"+c+" (from sub rep "+a+`)

This cannot be undone.`)){re=!0;try{const v=m.nation_id;if(n.length>0){const C=n.filter(w=>w.id!==e.id).map(w=>w.id);if(C.length===1){const{error:w}=await $.from("corp_properties").update({nation_id:v,type:"office"}).eq("id",C[0]);if(w)throw w}else if(C.length>1){const{error:w}=await $.from("corp_properties").update({nation_id:v,type:"office"}).in("id",C);if(w)throw w}const{error:k}=await $.from("corp_properties").update({nation_id:v,type:"office",sub_cash:0,subsector:null}).eq("id",e.id);if(k)throw k}const h=y-l+s,E=Number(m?.corp_general_workforce??0)+u,A=Math.random()>=.5?r:-c,_=Number(m?.standing??50),I=Math.max(0,Math.min(100,_+A)),{error:b}=await $.from("factions").update({corp_cash_reserves:h,corp_general_workforce:E,standing:I}).eq("id",m.id);if(b)throw b;m.corp_cash_reserves=h,m.corp_general_workforce=E,m.standing=I,Ue(h),await ci(),alert(`Merger complete!

"`+e.name+`" absorbed into your corporation.
Cost: `+g(l)+" | Cash absorbed: "+g(s)+`
Reputation `+(A>=0?"+":"")+A+" (now "+I+`)
Workers hired: +`+u.toLocaleString()+` general workforce
Properties: `+n.length+" transferred to parent")}catch(v){alert("Merge failed: "+v.message)}finally{re=!1}}}window.subDissolve=Eo;window.subInjectCapital=To;window.subWithdraw=Co;window.subMerge=Io;window.subSell=ko;window.selectSubsidiary=function(i){Pe=i,gt()};let Ge=[],Ve={},Z=null,Ot=!1,ze="",Qe="",Le="";const So={Construction:[{id:"civil",name:"Civil Engineering",mod:0},{id:"industrial",name:"Industrial Construction",mod:.25},{id:"mega",name:"Megaprojects",mod:.4}],Finance:[{id:"banking",name:"Banking",mod:0},{id:"insurance",name:"Insurance",mod:.15},{id:"investment",name:"Investment Management",mod:.3}],Technology:[{id:"software",name:"Software Development",mod:0},{id:"hardware",name:"Hardware Manufacturing",mod:.2},{id:"telecom",name:"Telecommunications",mod:.35}],Energy:[{id:"oil_gas",name:"Oil & Gas",mod:0},{id:"renewables",name:"Renewables",mod:.2},{id:"mining",name:"Mining",mod:.3}],Healthcare:[{id:"pharma",name:"Pharmaceuticals",mod:0},{id:"hospitals",name:"Hospital Systems",mod:.2},{id:"biotech",name:"Biotechnology",mod:.35}]};async function Mo(){const{data:i,error:e}=await $.from("nations").select("*").order("name");e&&console.warn("[Subsidiary] Failed to load nations:",e.message),Ge=(i||[]).filter(n=>n.id!==m?.nation_id);const{data:t}=await $.from("factions").select("nation_id").eq("faction_type","corporation").is("abandoned_at",null);Ve={};for(const n of t||[])n.nation_id&&(Ve[n.nation_id]=(Ve[n.nation_id]||0)+1);Le=m?.corp_subsector||""}function Ki(){const i=m?.corp_sector||"";return So[i]||[{id:"general",name:i||"General",mod:0}]}function Ao(){const e=Ki().find(t=>t.name===Le);return e?e.mod:0}function Xt(i){const e=Number(i.standard_of_living??50);return Math.max(.5,Math.round(e/50*100)/100)}function Ji(i){const t=1+Ao(),n=Xt(i);return Math.round(Math.max(1e7,5e7*t*n))}function zo(i){const e=Ve[i]||0;return e<=1?{label:"HIGH",color:"#5c5"}:e<=3?{label:"MODERATE",color:"#ca5"}:{label:"LOW",color:"#c55"}}function Lo(i){if(Z=Z===i?null:i,Z){const e=Ge.find(t=>t.id===Z);ze=(m?.faction_name||"Subsidiary")+" "+(e?.name||"")}else ze="";bt()}function Bo(i){Le=i,bt()}function No(i){ze=i}function qo(i){Qe=i.toUpperCase().slice(0,4)}async function Ro(){if(Ot||!Z)return;const i=Ge.find(a=>a.id===Z);if(!i)return;const e=(ze||"").trim(),t=(Qe||"").trim();if(!e){alert("Please enter a corporation name for the subsidiary.");return}if(t.length<2){alert("Please enter an abbreviation (2-4 chars).");return}if(U.find(a=>a.nation_id===i.id&&a.type==="regional_hq")){alert("You already have a subsidiary in "+i.name);return}const o=Ji(i),s=Number(m?.corp_cash_reserves??0);if(o>s){alert("Insufficient cash. Entry cost: "+g(o)+", available: "+g(s));return}if(confirm("Establish subsidiary in "+i.name+`?

Name: `+e+" ("+t+`)
Subsector: `+(Le||"General")+`
Entry cost: `+g(o)+`
Creates a Regional HQ (500 capacity)
Unlocks `+i.name+` for operations

Deducted from cash reserves.`)){Ot=!0;try{const d=(await $.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0,l=85+Math.floor(Math.random()*16),r=Math.round(o*.005),{error:c}=await $.from("corp_properties").insert({faction_id:m.id,nation_id:i.id,name:e,type:"regional_hq",style:"Modern",capacity:500,purchase_price:o,monthly_maintenance:r,condition:l,city:i.capital||i.name,purchased_at_tick:d,is_active:!0,subsector:Le||m?.corp_subsector||null});if(c)throw c;const f=Math.max(0,s-o);await $.from("factions").update({corp_cash_reserves:f}).eq("id",m.id),m.corp_cash_reserves=f,Ue(f),Z=null,ze="",Qe="",await ci(),alert('Subsidiary "'+e+'" established in '+i.name+`!

Cost: `+g(o)+`
Regional HQ created with `+l+"% condition.")}catch(a){alert("Failed: "+a.message)}finally{Ot=!1}}}function bt(){const i=document.getElementById("create-subsidiary-container");if(!i)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=m?.corp_sector||"General",o=m?.corp_subsector||"",s=Ki(),a=s.find(b=>b.name===Le)||s[0],d=new Set(U.filter(b=>b.type==="regional_hq").map(b=>b.nation_id)),l=Ge.filter(b=>!d.has(b.id)),r=Z?l.find(b=>b.id===Z):null,c=ze.trim().length>0&&Qe.trim().length>=2&&r!==null;let f=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Sector</div>
        <div style="padding:4px 10px;background:${t.card};border:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;">
            <span style="font-family:${e};font-size:10px;font-weight:700;color:${t.accent}">${n}</span>
            <span style="font-family:${e};font-size:8px;color:${t.dim}">LOCKED TO PARENT</span>
        </div>
    </div>`,p=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsector</div>
        <div style="display:flex;gap:3px;">
            ${s.map(b=>{const C=b.name===Le,k=b.name===o;return`<div onclick="subSetSubsector('${b.name.replace(/'/g,"\\'")}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${C?t.accent+"18":"transparent"};border:1px solid ${C?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:8px;font-weight:700;color:${C?t.accentBright:t.dim}">${b.name}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${k?t.greenBright:b.mod>0?t.orange:t.dim}">${k?"SAME — ±0%":b.mod>0?"+"+Math.round(b.mod*100)+"%":"±0%"}</div>
                </div>`}).join("")}
        </div>
    </div>`,u="";if(l.length===0)u=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Subsidiaries in all available nations.</div>`;else for(const b of l){const C=b.id===Z,k=zo(b.id),w=Ve[b.id]||0,q=Math.round(Number(b.standard_of_living??50)),L=Xt(b);u+=`
            <div onclick="subSelectNation('${b.id}')" style="display:flex;align-items:center;padding:4px 8px;margin-bottom:2px;cursor:pointer;background:${C?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${C?t.accent+"44":t.border};border-left:${C?"2px solid "+t.accent:"2px solid transparent"};">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:11px;font-weight:600;color:${C?t.text:t.muted}">${b.name}</span>
                        <span style="font-family:${e};font-size:7px;font-weight:700;padding:0 4px;color:${k.color};background:${k.color}12;border:1px solid ${k.color}25;line-height:12px">${k.label}</span>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:2px;">
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">STD/LIVING: <span style="color:${t.muted}">${q}</span></span>
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">CORPS: <span style="color:${w>=4?t.red:w>=2?t.yellow:t.greenBright}">${w}</span></span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${L>1?t.orange:t.greenBright}">×${L.toFixed(2)}</div>
                </div>
            </div>`}let y=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="margin-bottom:6px;">
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Corporation Name</div>
            <input type="text" value="${(ze||"").replace(/"/g,"&quot;")}" oninput="subSetName(this.value)" placeholder="e.g., ${(m?.faction_name||"Corp")+" "+(r?.name||"International")}" style="width:100%;padding:5px 8px;font-family:${e};font-size:10px;color:${t.text};background:${t.card};border:1px solid ${t.border};outline:none;box-sizing:border-box;" />
        </div>
        <div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Abbreviation (2-4 chars)</div>
            <input type="text" value="${(Qe||"").replace(/"/g,"&quot;")}" oninput="subSetAbbr(this.value)" placeholder="${(m?.faction_name||"CORP").slice(0,2).toUpperCase()+(r?.name||"XX").slice(0,2).toUpperCase()}" maxlength="4" style="width:80px;padding:5px 8px;font-family:${e};font-size:12px;font-weight:700;color:${t.gold};background:${t.card};border:1px solid ${t.border};outline:none;text-align:center;letter-spacing:2px;" />
        </div>
    </div>`;const v=[{rule:"Bid on projects in that nation",icon:"✓",color:t.greenBright},{rule:"Hires local workers at nation rates",icon:"✓",color:t.greenBright},{rule:"Must use parent's materials & vehicles",icon:"!",color:t.orange},{rule:"Reputation gain: 75% sub / 25% parent",icon:"◐",color:t.gold},{rule:"Market revenue at 50% parent rate",icon:"◐",color:t.gold},{rule:"Counts as domestic corporation",icon:"✓",color:t.greenBright},{rule:"Starting reputation: 25",icon:"●",color:t.muted}];let h=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsidiary Rules</div>
        <div style="background:${t.card};border:1px solid ${t.border};padding:6px 8px;">
            ${v.map((b,C)=>`<div style="display:flex;align-items:center;gap:6px;padding:2px 0;${C<v.length-1?"border-bottom:1px solid "+t.border:""}">
                <span style="font-family:${e};font-size:9px;color:${b.color};width:12px;text-align:center">${b.icon}</span>
                <span style="font-size:9px;color:${t.muted}">${b.rule}</span>
            </div>`).join("")}
        </div>
    </div>`;const T=5e7,E=a.mod,A=r?Xt(r):null,_=r?Ji(r):null;let I=`
    <div style="background:${t.bg};border:1px solid ${t.border};padding:6px 8px;margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">BASE</span>
            <span style="font-family:${e};font-size:9px;color:${t.muted}">${g(T)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">SUBSECTOR (${a.name})</span>
            <span style="font-family:${e};font-size:9px;color:${E===0?t.greenBright:t.orange}">${E===0?"±0%":"+"+Math.round(E*100)+"%"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">NATION (${r?r.name:"—"})</span>
            <span style="font-family:${e};font-size:9px;color:${r?A>1?t.orange:t.greenBright:t.dim}">${r?"×"+A.toFixed(2):"—"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:3px 0;">
            <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.text}">TOTAL COST</span>
            <span style="font-family:${e};font-size:14px;font-weight:700;color:${t.gold}">${r?g(_):"—"}</span>
        </div>
    </div>`;i.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.gold}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Create Subsidiary</span>
            </div>
        </div>
        <div style="flex:1;overflow:auto;">
            ${f}
            ${p}
            <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
                <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Nation</div>
                ${u}
            </div>
            ${y}
            ${h}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            ${I}
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">IMMEDIATE PAYMENT</span>
                <div onclick="subCreate()" style="padding:5px 18px;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${c?"#000":t.dim};background:${c?t.gold:"transparent"};border:1px solid ${c?t.gold:t.border};cursor:${c?"pointer":"default"};opacity:${c?1:.4}">CREATE SUBSIDIARY</div>
            </div>
        </div>
    </div>`}window.subSelectNation=Lo;window.subCreate=Ro;window.subSetName=No;window.subSetAbbr=qo;window.subSetSubsector=Bo;let nt=[],Te=0,te="ALL",_e="REPUTATION";async function Po(){const{data:i}=await $.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name");nt=(i||[]).map(e=>({...e,abbr:e.corp_ticker||e.abbreviation||e.faction_name?.slice(0,4).toUpperCase()||"???",status:(e.corp_company_type||"Private").toUpperCase(),isPlayer:!!e.linked_user_id,reputation:50,revenue:e.status==="PUBLIC"?Number(e.corp_cash_reserves||0)*.1:null,valuation:e.status==="PUBLIC"?Number(e.corp_cash_reserves||0)*3:null}))}function Oo(i){Te=i,xt()}function Do(i){te=i,Te=0,xt()}function Ho(i){_e=i,Te=0,xt()}function xt(){const i=document.getElementById("corporations-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n={PUBLIC:{color:t.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:t.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:t.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},o=[...new Set(nt.map(p=>p.nation).filter(Boolean))];let s=[...nt];te!=="ALL"&&(s=s.filter(p=>p.nation===te)),_e==="REPUTATION"?s.sort((p,u)=>(u.reputation||0)-(p.reputation||0)):_e==="REVENUE"?s.sort((p,u)=>(u.revenue||0)-(p.revenue||0)):_e==="VALUATION"&&s.sort((p,u)=>(u.valuation||0)-(p.valuation||0)),Te>=s.length&&(Te=0);const a=s[Te]||null,d=a&&a.status==="PRIVATE",l=a&&a.status==="STATE";let r="";s.length===0&&(r=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No corporations found.</div>`);for(let p=0;p<s.length;p++){const u=s[p],y=p===Te,v=n[u.status]||n.PRIVATE,h=u.status==="PRIVATE";r+=`
        <div onclick="corpSelect(${p})" style="display:flex;align-items:center;padding:6px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${y?t.accent:"transparent"};background:${y?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:36px;font-family:${e};font-size:9px;font-weight:700;color:${t.gold}">${u.abbr}</span>
            <div style="flex:1.3;">
                <div style="font-size:10px;font-weight:600;color:${t.text};line-height:1.2">${u.faction_name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${u.corp_subsector||u.corp_sector||"—"}</div>
            </div>
            <span style="width:55px"><span style="font-family:${e};font-size:7px;padding:1px 4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(u.nation||"—").toUpperCase().slice(0,6)}</span></span>
            <span style="width:50px;font-family:${e};font-size:8px;font-weight:700;color:${h?t.dim:t.muted};text-align:right">${h?"—":g(u.revenue)}</span>
            <span style="width:30px;font-family:${e};font-size:9px;font-weight:700;color:${u.reputation>=70?t.greenBright:u.reputation>=40?t.accent:t.yellow};text-align:right">${u.reputation}</span>
            <span style="width:50px;font-family:${e};font-size:8px;color:${h?t.dim:t.muted};text-align:right">${h?"—":g(u.valuation)}</span>
            <span style="width:42px;text-align:center"><span style="font-family:${e};font-size:6px;font-weight:700;padding:1px 4px;color:${v.color};background:${v.bg};border:1px solid ${v.border}">${u.status}</span></span>
        </div>`}let c="";if(a){const p=n[a.status]||n.PRIVATE,u=[{label:"Sector",value:a.corp_sector||"—",color:t.text},{label:"Subsector",value:a.corp_subsector||"—",color:t.accent},{label:"Reputation",value:a.reputation+"/100",color:a.reputation>=70?t.greenBright:a.reputation>=40?t.accent:t.yellow},{label:"Revenue",value:d?"UNDISCLOSED":g(a.revenue),color:d?t.dim:t.greenBright},{label:"Cash Reserves",value:d?"UNDISCLOSED":g(a.corp_cash_reserves||0),color:d?t.dim:t.text},{label:"Market Valuation",value:d?"UNDISCLOSED":g(a.valuation),color:d?t.dim:t.gold}];c=`
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.gold}">${a.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${t.text}">${a.faction_name}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
                <span style="font-family:${e};font-size:7px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(a.nation||"—").toUpperCase()}</span>
                <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${p.color};background:${p.bg};border:1px solid ${p.border}">${a.status}</span>
                ${a.isPlayer?`<span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${t.blue};background:rgba(90,138,170,0.08);border:1px solid rgba(90,138,170,0.2)">PLAYER</span>`:`<span style="font-family:${e};font-size:7px;color:${t.dim}">NPC</span>`}
            </div>
        </div>
        ${u.map(y=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:9px;color:${t.dim};text-transform:uppercase">${y.label}</span>
            <span style="font-family:${e};font-size:10px;font-weight:700;color:${y.value==="UNDISCLOSED"?t.dim:y.color};${y.value==="UNDISCLOSED"?"font-style:italic;":""}">${y.value}</span>
        </div>`).join("")}
        <div style="padding:6px 14px;border-bottom:1px solid ${t.border};flex-shrink:0;">
            <div style="width:100%;height:4px;background:${t.border}"><div style="width:${a.reputation}%;height:100%;background:${a.reputation>=70?t.greenBright:a.reputation>=40?t.accent:t.yellow}"></div></div>
        </div>
        ${d?`<div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:rgba(200,168,50,0.03);">
            <div style="font-family:${e};font-size:8px;color:${t.gold};margin-bottom:2px">PRIVATE — FINANCIALS UNDISCLOSED</div>
            <div style="font-size:9px;color:${t.dim};line-height:1.4">Use INVESTIGATE to reveal financial data for 12 ticks.</div>
        </div>`:""}
        ${l?`<div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:rgba(204,136,68,0.03);">
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
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${l?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${l?t.dim:t.gold};border:1px solid ${l?t.border:t.gold+"44"};opacity:${l?.3:1}">ACQUIRE</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${l?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${l?t.dim:t.orange};border:1px solid ${l?t.border:t.orange+"44"};opacity:${l?.3:1}">MERGER</div>
            </div>
            ${l?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${t.dim}">State-owned corps cannot be acquired or merged.</div>`:""}
        </div>`}else c=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a corporation to view details.</div>`;const f=`
    <div style="padding:5px 14px;border-bottom:1px solid ${t.border};background:${t.card};display:flex;gap:12px;align-items:center;flex-shrink:0;">
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px;width:32px">NATION</span>
            <span onclick="corpFilterNation('ALL')" style="padding:2px 7px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${te==="ALL"?"#000":t.dim};background:${te==="ALL"?t.accent:"transparent"};border:1px solid ${te==="ALL"?t.accent:t.border}">ALL</span>
            ${o.map(p=>`<span onclick="corpFilterNation('${p}')" style="padding:2px 7px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${te===p?"#000":t.dim};background:${te===p?t.accent:"transparent"};border:1px solid ${te===p?t.accent:t.border}">${p}</span>`).join("")}
        </div>
        <div style="flex:1"></div>
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">SORT</span>
            ${["REPUTATION","REVENUE","VALUATION"].map(p=>`<span onclick="corpSort('${p}')" style="padding:2px 7px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${_e===p?"#000":t.dim};background:${_e===p?t.accent:"transparent"};border:1px solid ${_e===p?t.accent:t.border}">${p}</span>`).join("")}
        </div>
    </div>`;i.innerHTML=`
    <div style="width:760px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Corporations</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${nt.length} IN DATABASE</span>
        </div>
        ${f}
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
                <div style="flex:1;overflow:auto;">${r}</div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${c}
            </div>
        </div>
    </div>`}window.corpSelect=Oo;window.corpFilterNation=Do;window.corpSort=Ho;let ae=null,fe={},G=120,me=15,Zt={},Oe=[];async function jo(){if(!se)return;if(je[se.id]){alert("You already have a bid on this contract. Retract it first if you want to re-bid.");return}ae=se,Zt={};try{const{data:t}=await $.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",m.id);for(const n of t||[])Zt[n.material_key]=Number(n.quantity||0)}catch{}Oe=[];try{const{data:t}=await $.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",ae.id).in("status",["pending","won"]);Oe=(t||[]).filter(n=>n.faction_id!==m?.id).map(n=>({name:n.factions?.faction_name||"Unknown",ticker:n.factions?.corp_ticker||"???",price:Number(n.bid_price||0),quality:Number(n.estimated_quality||0),status:n.status}))}catch{}fe={};const i=ae.required_materials||{};for(const t of Object.keys(i))fe[t]="STD";const e=ae.required_workforce||{};G=Number(e.general||0)+Number(e.skilled||0)||120,me=15,Je(),$t()}function pi(){document.getElementById("bid-assembly-overlay")?.remove(),ae=null}function Uo(i,e){fe[i]=e,$t()}function Go(i){G=i,$t()}function Wo(i){me=i,$t()}function $t(){if(document.getElementById("bid-assembly-overlay")?.remove(),!ae)return;const i="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=ae,n=t.issuer_type==="GOVERNMENT",o=S?.name||m?.nation||"—",s=Number(t.budget_ceiling||0),a=Number(t.timeline_ticks||8),d=t.required_materials||{},l=Object.keys(d),r={LOW:.5,STD:1,HIGH:2},c={LOW:e.orange,STD:e.yellow,HIGH:e.greenBright},f={LOW:"Low",STD:"Standard",HIGH:"High"},p={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},u=Zt||{};let y=0,v="";for(const z of l){const D=Number(d[z]||0),yi=fe[z]||"STD",vi=p[z]||3e5,tn=r[yi],nn=Math.round(vi*tn),gi=D*nn;y+=gi;const on=z.replace(/_/g," ").replace(/\b\w/g,be=>be.toUpperCase()),bi=Number(u[z]||0),Ct=Math.max(0,D-bi),an=Ct===0?e.greenBright:Ct<D?e.yellow:e.red,sn=Ct===0?"✓ IN STOCK":`${bi}/${D}`;v+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${e.text}">${on}</span>
                <div style="font-family:${i};font-size:7px;color:${an};margin-top:1px">${sn}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${i};font-size:9px;color:${e.muted}">${D.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(be=>{const It=yi===be,xi=c[be],rn=g(Math.round(vi*r[be]));return`<span onclick="bidSetGrade('${z}','${be}')" style="padding:2px 6px;font-family:${i};font-size:7px;font-weight:700;cursor:pointer;color:${It?"#000":e.dim};background:${It?xi:"transparent"};border:1px solid ${It?xi:e.border}" title="${rn}/unit">${f[be]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${i};font-size:10px;color:${e.text}">${g(gi)}</span></div>
        </div>`}const h=t.required_workforce||{},T=Number(h.general||0)+Number(h.skilled||0)||100,E=Math.max(40,Math.round(T*.5)),A=T*2,_=[E,Math.round(T*.75),T,Math.round(T*1.5),A],I=Math.max(0,Math.min(1,(G-E)/(A-E||1))),b=a,C=Math.round(4.5-I*8),k=Math.max(Math.round(b*.6),b+C),w=C>0?`+${C}mo`:C<0?`${C}mo`:"On schedule",q=C>0?e.red:C<0?e.greenBright:e.yellow,L=15200,P=G*L*k,K=s,Be=[{name:"Municipal Zoning Approval",cost:18e4,ticks:2,required:!0},{name:"Structural Engineering Cert.",cost:24e4,ticks:3,required:!0},{name:"Environmental Impact Assessment",cost:34e4,ticks:8,required:K>2e7},{name:"Seismic Resilience Compliance",cost:21e4,ticks:4,required:K>5e7},{name:"Heritage Conservation Review",cost:16e4,ticks:6,required:!1},{name:"Fire Safety Certification",cost:12e4,ticks:2,required:K>1e7}].filter(z=>z.required),fi=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),ht=Be.filter(z=>!fi.has(z.name)).reduce((z,D)=>z+D.cost,0),wt=4e5,kt=y+P+ht+wt,mi=Math.round(kt*(me/100)),Ze=kt+mi,Y=Ze>s,Et=mi,ve=Y?0:Math.max(0,Math.min(100,Math.round(100-Ze/s*100+30))),ui=ve>70?e.greenBright:ve>40?e.yellow:ve>0?e.orange:e.red,Zi=Y?"OVER CEILING":ve>70?"STRONG":ve>40?"COMPETITIVE":ve>20?"WEAK":"UNLIKELY",Tt=Object.values(fe),ge=Tt.length>0?Math.round(Tt.reduce((z,D)=>z+(D==="HIGH"?85:D==="STD"?65:45),0)/Tt.length):50,et=ge>=75?e.greenBright:ge>=55?e.yellow:e.orange,en=ge>=75?"STRONG":ge>=55?"PROMISING":"UNCERTAIN",Ne=document.createElement("div");Ne.id="bid-assembly-overlay",Ne.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",Ne.addEventListener("click",z=>{z.target===Ne&&pi()}),Ne.innerHTML=`
    <div style="width:740px;max-height:94vh;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <!-- HEADER -->
        <div style="padding:10px 16px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${i};font-size:8px;font-weight:700;padding:2px 8px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${o.toUpperCase()}</span>
                    <span style="font-size:14px;font-weight:700;color:${e.text}">${t.name}</span>
                    <span style="font-family:${i};font-size:8px;font-weight:700;padding:2px 6px;color:${n?e.accentBright:e.gold};background:${n?"rgba(163,176,126,0.1)":"rgba(200,168,50,0.08)"};border:1px solid ${n?"rgba(163,176,126,0.2)":"rgba(200,168,50,0.2)"}">${n?"GOV":"PRIVATE"}</span>
                </div>
                <span onclick="closeBidAssembly()" style="font-family:${i};font-size:14px;color:${e.dim};cursor:pointer;padding:0 4px">×</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                <span style="font-family:${i};font-size:9px;color:${e.dim}">${t.project_code||"—"}</span>
                <span style="font-family:${i};font-size:9px;color:${e.dim}">·</span>
                <span style="font-size:10px;color:${e.accent}">${t.issuer_name||"—"}</span>
                <span style="font-family:${i};font-size:9px;color:${e.dim}">·</span>
                <span style="font-family:${i};font-size:9px;color:${e.muted}">Ceiling: <span style="color:${e.text};font-weight:700">${g(s)}</span></span>
                <span style="font-family:${i};font-size:9px;color:${e.dim}">·</span>
                <span style="font-family:${i};font-size:9px;color:${e.muted}">Timeline: <span style="color:${e.text};font-weight:700">${a} months</span></span>
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
                    <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${g(y)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Labor</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim};width:60px">WORKERS</span>
                        <div style="display:flex;gap:3px;">
                            ${_.map(z=>`<span onclick="bidSetWorkers(${z})" style="padding:2px 8px;font-family:${i};font-size:8px;font-weight:700;cursor:pointer;color:${G===z?"#000":e.dim};background:${G===z?e.accent:"transparent"};border:1px solid ${G===z?e.accent:e.border}">${z}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">${G} × $${L.toLocaleString()}/tick × ${k} ticks</span>
                        <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${g(P)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">COMPLETION TIMELINE</span>
                        <span style="font-family:${i};font-size:10px;font-weight:700;color:${q}">${k}mo <span style="font-size:8px;opacity:0.7">(${w})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${Be.map(z=>{const D=fi.has(z.name);return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
                        <div style="flex:1;display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${i};font-size:8px;font-weight:700;color:${D?e.greenBright:e.orange}">${D?"✓":"○"}</span>
                            <span style="font-size:10px;color:${D?e.muted:e.text}">${z.name}</span>
                        </div>
                        ${D?`<span style="font-family:${i};font-size:8px;color:${e.greenBright}">HELD</span>`:`<div style="text-align:right">
                                <span style="font-family:${i};font-size:9px;color:${e.redDim}">${g(z.cost)}</span>
                                <span style="font-family:${i};font-size:7px;color:${e.dim};margin-left:4px">${z.ticks}t</span>
                            </div>`}
                    </div>`}).join("")}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${i};font-size:9px;color:${e.muted}">PERMIT COSTS</span>
                    <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${g(ht)}</span>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${i};font-size:9px;color:${e.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${g(wt)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v:y},{l:"Labor",v:P},{l:"Permits",v:ht},{l:"Overhead",v:wt}].map(z=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-size:10px;color:${e.muted}">${z.l}</span>
                    <span style="font-family:${i};font-size:10px;color:${e.redDim}">${g(z.v)}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:rgba(204,85,85,0.03);">
                    <span style="font-family:${i};font-size:10px;font-weight:700;color:${e.text}">TOTAL EST. COST</span>
                    <span style="font-family:${i};font-size:13px;font-weight:700;color:${e.red}">${g(kt)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.gold};text-transform:uppercase">Set Markup</span>
                </div>
                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="font-family:${i};font-size:9px;color:${e.dim}">MARKUP %</span>
                        <span style="font-family:${i};font-size:16px;font-weight:700;color:${e.gold}">${me}%</span>
                    </div>
                    <input type="range" min="0" max="40" step="1" value="${me}" oninput="bidSetMarkup(+this.value)" style="width:100%;accent-color:${e.gold};height:6px;" />
                    <div style="display:flex;justify-content:space-between;font-family:${i};font-size:7px;color:${e.dim};margin-top:2px;">
                        <span>0% (at cost)</span><span>40% (maximum)</span>
                    </div>
                </div>

                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${Y?"rgba(204,85,85,0.04)":"rgba(200,168,50,0.03)"};">
                    <div style="font-family:${i};font-size:8px;color:${e.dim};margin-bottom:4px">YOUR BID PRICE</div>
                    <div style="font-family:${i};font-size:22px;font-weight:700;color:${Y?e.red:e.gold}">${g(Ze)}</div>
                    ${Y?`<div style="font-family:${i};font-size:8px;font-weight:700;color:${e.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${g(s)})</div>`:""}
                </div>

                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">PROJECTED PROFIT</span>
                        <span style="font-family:${i};font-size:14px;font-weight:700;color:${Et>0?e.greenBright:e.dim}">+${g(Et)}</span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Bid Assessment</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">COMPETITIVENESS</span>
                        <span style="font-family:${i};font-size:11px;font-weight:700;color:${ui}">${Zi}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${ve}%;height:100%;background:${ui}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${i};font-size:11px;font-weight:700;color:${et}">${ge}</span>
                            <span style="font-family:${i};font-size:8px;color:${e.dim}">/100</span>
                            <span style="font-family:${i};font-size:8px;font-weight:700;color:${et}">${en}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${ge}%;height:100%;background:${et}"></div></div>
                    <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${Oe.length===0?`<div style="font-family:${i};font-size:8px;color:${e.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${Oe.map(z=>`<span style="padding:2px 6px;font-family:${i};font-size:7px;color:${e.muted};background:${e.card};border:1px solid ${e.border};">${z.name} <span style="color:${e.dim}">Q:${z.quality}</span></span>`).join("")}
                        </div>
                        <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:3px">${Oe.length} competing bid${Oe.length!==1?"s":""}. Bid prices are sealed until resolution.</div>`}
                    <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:3px">Higher reputation bidders may win at higher prices.</div>
                </div>
                <div style="flex:1"></div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">YOUR BID</div><div style="font-family:${i};font-size:14px;font-weight:700;color:${Y?e.red:e.gold}">${g(Ze)}</div></div>
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">EST. PROFIT</div><div style="font-family:${i};font-size:14px;font-weight:700;color:${e.greenBright}">+${g(Et)}</div></div>
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${i};font-size:14px;font-weight:700;color:${et}">${ge}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${i};font-size:10px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="${Y?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${i};font-size:10px;font-weight:700;letter-spacing:1px;color:${Y?e.dim:"#000"};background:${Y?e.border:e.gold};cursor:${Y?"not-allowed":"pointer"};opacity:${Y?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(Ne)}let He=!1;async function Fo(){if(He||!ae)return;const i=ae,e=i.required_materials||{},t=Object.keys(e),n=Number(i.budget_ceiling||0),o=Number(i.timeline_ticks||8),s={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},a={LOW:.5,STD:1,HIGH:2};let d=0;for(const L of t){const P=Number(e[L]||0),K=fe[L]||"STD",ye=s[L]||3e5;d+=P*Math.round(ye*a[K])}const l=15200,r=i.required_workforce||{},c=Number(r.general||0)+Number(r.skilled||0)||100,f=Math.max(40,Math.round(c*.5)),p=c*2,u=Math.max(0,Math.min(1,(G-f)/(p-f||1))),y=Math.round(4.5-u*8),v=Math.max(Math.round(o*.6),o+y),h=G*l*v,T=n,E=[{name:"Municipal Zoning Approval",cost:18e4,required:!0},{name:"Structural Engineering Cert.",cost:24e4,required:!0},{name:"Environmental Impact Assessment",cost:34e4,required:T>2e7},{name:"Seismic Resilience Compliance",cost:21e4,required:T>5e7},{name:"Fire Safety Certification",cost:12e4,required:T>1e7}],A=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),_=E.filter(L=>L.required&&!A.has(L.name)).reduce((L,P)=>L+P.cost,0),b=d+h+_+4e5,C=Math.round(b*(me/100)),k=b+C;if(k>n){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const w=Object.values(fe),q=w.length>0?Math.round(w.reduce((L,P)=>L+(P==="HIGH"?85:P==="STD"?65:45),0)/w.length):50;if(confirm('Submit bid for "'+i.name+`"?

Bid Price: `+g(k)+`
Est. Cost: `+g(b)+`
Markup: `+me+"% ("+g(C)+`)
Quality: `+q+`/100
Workers: `+G+`

Once submitted, your bid cannot be changed.`)){He=!0;try{const{data:L}=await $.from("shard").select("current_tick").eq("name","Alpha Shard").single(),P=L?.current_tick||0,K={};for(const Be of t)K[Be]=fe[Be]||"STD";const{error:ye}=await $.from("contract_bids").insert({contract_id:i.id,faction_id:m.id,bid_price:k,material_grades:K,labor_count:G,markup_pct:me,estimated_cost:b,estimated_quality:q,status:"pending",submitted_at_tick:P});if(ye)throw ye;i.status==="open"&&await $.from("construction_contracts").update({status:"bidding"}).eq("id",i.id).eq("status","open"),pi(),alert(`Bid submitted successfully!

Contract: `+i.name+`
Your Bid: `+g(k)+`
Quality: `+q+`/100

Bids will be resolved when the bidding window closes (`+(i.bidding_ends_tick?"tick "+i.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof le=="function"&&await le()}catch(L){alert("Bid submission failed: "+L.message)}finally{He=!1}}}window.openBidAssembly=jo;window.closeBidAssembly=pi;window.bidSetGrade=Uo;window.bidSetWorkers=Go;window.bidSetMarkup=Wo;window.submitBidAssembly=Fo;let Dt=!1;async function Vo(i){if(Dt)return;const e=1e6,t=Number(m?.corp_cash_reserves??0);if(t<e){alert("Cannot retract — you need at least $1M in cash reserves to cover the retraction penalty.");return}if(confirm(`Retract your bid?

This will cost $1M as a retraction penalty.
This action cannot be undone.`)){Dt=!0;try{const n=t-e,{error:o}=await $.from("factions").update({corp_cash_reserves:n}).eq("id",m.id);if(o)throw o;const{error:s}=await $.from("contract_bids").delete().eq("contract_id",i).eq("faction_id",m.id);if(s)throw s;m.corp_cash_reserves=n,typeof Ue=="function"&&Ue(n),alert("Bid retracted. $1M penalty applied."),Je(),await le()}catch(n){alert("Failed to retract bid: "+(n.message||"Unknown error"))}finally{Dt=!1}}}window.retractBid=Vo;let Ke=[],Ce=0,ee=null,Ht=!1,jt=!1,Ut=!1;async function Yo(){if(!se||jt)return;jt=!0,ee=se,Ce=0;const{data:i,error:e}=await $.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",ee.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(jt=!1,e){alert("Failed to load bids: "+e.message);return}Ke=(i||[]).map(t=>({...t,corp:t.factions?.faction_name||"Unknown",abbr:t.factions?.corp_ticker||"???",subsector:t.factions?.corp_subsector||"—"})),Je(),Xi()}function _t(){document.getElementById("bid-review-overlay")?.remove(),ee=null}function Qo(i){Ce=i,Xi()}async function Ko(){if(Ht||Ke.length===0)return;const i=Ke[Ce];if(!(!i?.id||!i.faction_id)&&confirm("Accept bid from "+i.corp+`?

Bid Price: `+g(i.bid_price)+`
Quality: `+i.estimated_quality+`/100
Workers: `+i.labor_count+`

This will award the contract. The project begins immediately.`)){Ht=!0;try{const{data:e}=await $.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{error:n}=await $.from("contract_bids").update({status:"won"}).eq("id",i.id);if(n)throw n;const{error:o}=await $.from("contract_bids").update({status:"lost"}).eq("contract_id",ee.id).neq("id",i.id);if(o)throw o;const{error:s}=await $.from("construction_contracts").update({status:"awarded",awarded_to_faction:i.faction_id,awarded_at_tick:t}).eq("id",ee.id);if(s)throw s;_t(),alert("Contract awarded to "+i.corp+`!

Bid: `+g(i.bid_price)+`
Project begins immediately.`),typeof le=="function"&&await le()}catch(e){alert("Failed to accept bid: "+(e.message||e))}finally{Ht=!1}}}async function Jo(){if(!(!ee||Ut)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){Ut=!0;try{const{error:i}=await $.from("contract_bids").update({status:"lost"}).eq("contract_id",ee.id);if(i)throw i;const{error:e}=await $.from("construction_contracts").update({status:"expired"}).eq("id",ee.id);if(e)throw e;_t(),alert("All bids declined. Contract cancelled."),typeof le=="function"&&await le()}catch(i){alert("Failed: "+(i.message||i))}finally{Ut=!1}}}function Xi(){if(document.getElementById("bid-review-overlay")?.remove(),!ee||Ke.length===0)return;const i="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=ee,n=Ke;Ce>=n.length&&(Ce=0);const o=n[Ce],s=Number(t.budget_ceiling||0),a=Number(t.timeline_ticks||36),d=Math.min(...n.map(u=>u.bid_price)),l=Math.max(...n.map(u=>u.estimated_quality||0));let r="";for(let u=0;u<n.length;u++){const y=n[u],v=u===Ce,h=y.bid_price===d,T=(y.estimated_quality||0)===l,E=y.bid_price>s;r+=`
        <div onclick="reviewSelectBid(${u})" style="padding:10px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${v?e.accent:"transparent"};background:${v?"rgba(139,154,107,0.03)":"transparent"};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-family:${i};font-size:10px;font-weight:700;color:${e.gold}">${y.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${e.text}">${y.corp}</span>
                ${h?`<span style="font-family:${i};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.greenBright};background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2)">CHEAPEST</span>`:""}
                ${T?`<span style="font-family:${i};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.2)">BEST QUALITY</span>`:""}
            </div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};">
                <div style="flex:1.2;padding:5px 10px;border-right:1px solid ${e.border}">
                    <div style="font-family:${i};font-size:7px;color:${e.dim}">BID PRICE</div>
                    <div style="font-family:${i};font-size:14px;font-weight:700;color:${E?e.red:e.text}">${g(y.bid_price)}</div>
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
        </div>`}const c=o.bid_price>s,f=s>0?Math.round(o.bid_price/s*100):0,p=document.createElement("div");p.id="bid-review-overlay",p.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",p.addEventListener("click",u=>{u.target===p&&_t()}),p.innerHTML=`
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
                <span>Budget: <span style="color:${e.text};font-weight:700">${g(s)}</span></span>
                <span>·</span>
                <span>Timeline: <span style="color:${e.text};font-weight:700">${a}mo</span></span>
            </div>
        </div>
        <div style="padding:6px 16px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.gold}">${n.length} BID${n.length!==1?"S":""} RECEIVED</span>
            <div style="display:flex;gap:8px;font-family:${i};font-size:8px;color:${e.dim};">
                <span>Cheapest: <span style="color:${e.greenBright}">${g(d)}</span></span>
                <span>Best Quality: <span style="color:${e.accent}">${l}</span></span>
            </div>
        </div>
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${e.border};overflow:auto;">
                ${r}
            </div>
            <div style="width:250px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.gold}">${o.abbr}</span>
                        <span style="font-size:12px;font-weight:700;color:${e.text}">${o.corp}</span>
                    </div>
                    <div style="font-family:${i};font-size:8px;color:${e.dim};margin-top:2px">${o.subsector}</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <span style="font-family:${i};font-size:8px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Breakdown</span>
                </div>
                ${[{l:"Materials",v:Number(o.estimated_cost||0)*.45},{l:"Labor",v:Number(o.estimated_cost||0)*.45},{l:"Overhead",v:Number(o.estimated_cost||0)*.1}].map(u=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${i};font-size:9px;color:${e.dim};text-transform:uppercase">${u.l}</span>
                    <span style="font-family:${i};font-size:10px;color:${e.muted}">${g(Math.round(u.v))}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:${c?"rgba(204,85,85,0.03)":"rgba(200,168,50,0.03)"};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;color:${e.text}">TOTAL BID</span>
                    <span style="font-family:${i};font-size:14px;font-weight:700;color:${c?e.red:e.gold}">${g(o.bid_price)}</span>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">vs. YOUR BUDGET</span>
                        <span style="font-family:${i};font-size:9px;font-weight:700;color:${c?e.red:e.greenBright}">${c?"OVER":"WITHIN"} — ${f}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${e.border}"><div style="width:${Math.min(100,f)}%;height:100%;background:${c?e.red:e.accent}"></div></div>
                </div>
                ${[{l:"Quality",v:o.estimated_quality+"/100",c:(o.estimated_quality||0)>=75?e.greenBright:(o.estimated_quality||0)>=55?e.yellow:e.orange},{l:"Markup",v:o.markup_pct+"%",c:e.muted},{l:"Workers",v:o.labor_count+" workers",c:e.text}].map(u=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${i};font-size:9px;color:${e.dim};text-transform:uppercase">${u.l}</span>
                    <span style="font-family:${i};font-size:10px;font-weight:700;color:${u.c}">${u.v}</span>
                </div>`).join("")}
                <div style="flex:1"></div>
            </div>
        </div>
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">SELECTED BID</div><div style="font-family:${i};font-size:12px;font-weight:700;color:${e.gold}">${g(o.bid_price)}</div></div>
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">CORPORATION</div><div style="font-family:${i};font-size:12px;font-weight:700;color:${e.text}">${o.corp}</div></div>
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${i};font-size:12px;font-weight:700;color:${(o.estimated_quality||0)>=75?e.greenBright:e.yellow}">${o.estimated_quality}</div></div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="declineAllBids()" style="padding:6px 16px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">DECLINE ALL</div>
                <div onclick="acceptBid()" style="padding:6px 20px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${e.accent};cursor:pointer">ACCEPT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(p)}window.openBidReview=Yo;window.closeBidReview=_t;window.reviewSelectBid=Qo;window.acceptBid=Ko;window.declineAllBids=Jo;window.switchToExpansion=Ui;window.switchToOperations=Gi;window.hfSetChange=lo;window.hfReset=co;window.hfConfirm=po;document.querySelector('[data-tab="operations"]')?.addEventListener("click",function(i){this.classList.contains("active")||(i.preventDefault(),Gi(i))});oo();
