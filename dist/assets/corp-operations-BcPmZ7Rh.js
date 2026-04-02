import{_ as k}from"./supabase-client-BXEzLDpS.js";import{e as u}from"./utils-C2W-HleY.js";import{i as at}from"./messaging-5qyQ6ziq.js";import{c as st,a as ge,E as ie,b as le,d as Pe,e as it,f as nt,h as Se}from"./equipment-DsuDdEne.js";const He={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},W=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"manufacturing_output",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:50},{stat:"higher_education",min:40}]}},priceDrivers:["manufacturing_output","inflation","fuel_prices","urbanization"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:10}]},STD:{requirements:[{stat:"manufacturing_output",min:35},{stat:"rare_minerals",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:40},{stat:"higher_education",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","inflation","fuel_prices"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"arable_land",min:10}]},STD:{requirements:[{stat:"arable_land",min:30},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"arable_land",min:50},{stat:"manufacturing_output",min:30}]}},priceDrivers:["arable_land","physical_infrastructure","inflation"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"rare_minerals",min:15},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"rare_minerals",min:35},{stat:"manufacturing_output",min:25}]}},priceDrivers:["rare_minerals","physical_infrastructure","inflation"]},{key:"em",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:15}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"digital_infrastructure",min:25}]},HIGH:{requirements:[{stat:"manufacturing_output",min:55},{stat:"digital_infrastructure",min:50},{stat:"energy_generation",min:40}]}},priceDrivers:["manufacturing_output","digital_infrastructure","inflation","energy_generation"]},{key:"glass",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:20}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"digital_infrastructure",min:40},{stat:"higher_education",min:50}]}},priceDrivers:["manufacturing_output","standard_of_living","inflation"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"oil_and_gas",min:10}]},STD:{requirements:[{stat:"oil_and_gas",min:30},{stat:"manufacturing_output",min:25}]},HIGH:{requirements:[{stat:"oil_and_gas",min:45},{stat:"manufacturing_output",min:40},{stat:"physical_infrastructure",min:40}]}},priceDrivers:["oil_and_gas","manufacturing_output","inflation","fuel_prices"]},{key:"heavy",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:40},{stat:"rare_minerals",min:30}]},STD:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:45},{stat:"higher_education",min:40}]},HIGH:{requirements:[{stat:"manufacturing_output",min:75},{stat:"rare_minerals",min:60},{stat:"higher_education",min:55},{stat:"digital_infrastructure",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","higher_education","digital_infrastructure"]}];function V(e,t,a){const l=W.find(c=>c.key===e);if(!l)return{available:!1,failedStat:"unknown_material"};const s=l.tiers[t];if(!s)return{available:!1,failedStat:"unknown_tier"};for(const c of s.requirements){const i=Number(a?.[c.stat]??0);if(i<c.min)return{available:!1,failedStat:c.stat,failedMin:c.min,nationValue:i}}return{available:!0}}function Ie(e,t,a){const s={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em:{LOW:400,STD:700,HIGH:1200},glass:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy:{LOW:800,STD:1400,HIGH:2400}}[e]?.[t];if(!s)return 0;const c=W.find(n=>n.key===e);if(!c)return s;let i=1;for(const n of c.priceDrivers){const o=Number(a?.[n]??50);n==="inflation"||n==="fuel_prices"?i*=1+(o-50)/200:i*=1-(o-50)/250}return i=Math.max(.4,Math.min(2.5,i)),Math.round(s*i)}function Oe(e,t,a){const s={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em:{LOW:1e3,STD:700,HIGH:300},glass:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy:{LOW:400,STD:200,HIGH:80}}[e]?.[t]||0,i=W.find(r=>r.key===e)?.priceDrivers?.[0],o=.3+(i?Number(a?.[i]??50):50)/50*.7;return Math.round(s*o)}const Te=["LOW","STD","HIGH"],be={LOW:"Low",STD:"Standard",HIGH:"High"};let te=[],m=null,x=null,B=null,X=[],se={},R=[],D={},he=-1,A="concrete",S="STD",Q=500,O=[],$e=0,H="trucks",G=0,U=1,z=[],Y=null,oe=[],we=null,ne=null,xe="ALL",Ee="TIMELINE";function T(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function ot(e){if(e>=12){const t=Math.floor(e/12),a=e%12;return a>0?t+"y "+a+"mo":t+"y"}return e+" ticks"}function J(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(1)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(0)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function Ce(e){return e==="civil_engineering"?"CIVIL":e==="industrial"?"INDUSTRIAL":e==="mega_project"?"MEGA":e?.toUpperCase()||"—"}function Ne(e){return e==="civil_engineering"?"light":e==="industrial"?"heavy":e==="mega_project"?"mega":"light"}function rt(){ne&&clearInterval(ne),ne=setInterval(()=>{if(!we)return;const e=we-Date.now();if(e<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(ne);return}const t=Math.floor(e/36e5),a=Math.floor(e%36e5/6e4),l=Math.floor(e%6e4/1e3);document.getElementById("tick-countdown").textContent=t+"h "+a+"m "+l+"s"},1e3)}function lt(){document.body.classList.toggle("light-mode");const e=document.getElementById("theme-toggle");e.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function ct(e,t){e==="type"&&(xe=t),e==="sort"&&(Ee=t),document.querySelectorAll(`.filter-pill[data-filter="${e}"]`).forEach(a=>{a.classList.toggle("active",a.dataset.value===t)}),Ge()}function Re(e){return!(!m||e.sector==="mega_project"&&m.corp_subsector!=="Megaprojects"||e.sector==="industrial"&&!["Heavy Infrastructure","Megaprojects"].includes(m.corp_subsector))}function Ge(){const e=document.getElementById("oc-list");let t=[...X];if(xe==="GOVERNMENT"?t=t.filter(s=>s.issuer_type==="GOVERNMENT"):xe==="PRIVATE"&&(t=t.filter(s=>s.issuer_type==="PRIVATE")),Ee==="TIMELINE"&&t.sort((s,c)=>(s.timeline_ticks||0)-(c.timeline_ticks||0)),Ee==="BUDGET"&&t.sort((s,c)=>(c.budget_ceiling||0)-(s.budget_ceiling||0)),document.getElementById("oc-count").textContent=t.length+" AVAILABLE",t.length===0){e.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const a=B?.current_tick||0;let l="";for(const s of t){const c=s.issuer_type==="GOVERNMENT",i=c?"gov":"private",n=Re(s),o=n?"":" locked",r=Ne(s.sector),d=Ce(s.sector),p=(s.timeline_ticks||0)>18?" warn":"",v=s.bidding_ends_tick?Math.max(0,s.bidding_ends_tick-a):"?";l+=`
            <div class="oc-item${o}" data-contract-id="${s.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${u(s.name)}</span>
                    <span class="oc-item__type-badge ${i}">${c?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${i}">${u(s.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${v} tick${v!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${J(s.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${p}">${ot(s.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${r}">${d}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${se[s.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${J(se[s.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${n?"yes":"no"}">${n?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${n?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openBidModal(contracts.find(x=>x.id==='${s.id}'))">${se[s.id]?"EDIT":"VIEW"}</button>`:""}
                </div>
                ${s.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${u(s.description)}</div>`:""}
            </div>`}e.innerHTML=l,e.querySelectorAll(".oc-item:not(.locked)").forEach(s=>{s.addEventListener("click",()=>{const c=s.dataset.contractId,i=X.find(n=>n.id===c);i&&Ue(i)})})}let re=null;function Ue(e){re=e;const t=document.getElementById("cd-overlay"),a=e.contract_type==="GOVERNMENT",l=a?"gov":"private",s=(x?.name||m.nation||"—").toUpperCase(),c=Re(e);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${u(s)}</span>
        <span class="cd-header__name">${u(e.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${l}">${u(e.issuer_name)}</span>
        <span class="cd-header__type-badge ${l}">${a?"GOV":"PRIVATE"}</span>
    `;const i=document.getElementById("cd-blueprint");e.blueprint_svg?(i.innerHTML=e.blueprint_svg,i.style.display=""):(i.innerHTML=yt(e),i.style.display="");const n=e.permits_required||[],o=e.equipment_required||[],r=e.materials_estimated||[];let d="var(--teal)";e.spec_category==="Heavy Infrastructure"&&(d="var(--orange)"),e.spec_category==="Megaproject"&&(d="var(--red)");let p=T(e.budget),v=e.timeline_months+" Months",_="";_+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${u(e.contract_number)}</span>
            </div>
            <div class="cd-issue__tags">
                ${e.project_type?`<span class="cd-tag teal">${u(e.project_type.toUpperCase())}</span>`:""}
                ${e.project_subtype?`<span class="cd-tag gold">${u(e.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,e.description&&(_+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${u(e.description)}</div>
            </div>`),_+='<div class="cd-details">',e.project_type&&(_+=j("Type",e.project_type)),e.project_subtype&&(_+=j("Sub-Type",e.project_subtype)),_+=j("Specialization",e.spec_category,d),_+=j("Total Budget",p,"var(--green)"),_+=j("Timeline",v),_+=j("Nation",x?.name||m.nation||"—"),e.region&&(_+=j("Region",e.region)),_+="</div>",n.length>0&&(_+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${n.map(b=>{const $=b.status==="approved"?"approved":"required",M=b.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${$}">
                            <span class="cd-chip__icon">${M}</span>
                            <span class="cd-chip__label">${u(b.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),o.length>0&&(_+=`
            <div class="cd-items">
                <div class="cd-section-label">Required Equipment</div>
                <div class="cd-items__list">
                    ${o.map(b=>{const $=b.owned?"owned":"missing",M=b.owned?"&#10003;":"&#10007;";return`<div class="cd-chip ${$}">
                            <span class="cd-chip__icon">${M}</span>
                            <span class="cd-chip__label">${u(b.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),r.length>0&&(_+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${r.map(b=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${u(b.name)}</span>
                        <span class="cd-mat-row__qty">${u(String(b.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=_;const g=n.filter(b=>b.status==="approved").length,y=n.length-g,C=o.filter(b=>b.owned).length,h=o.length-C;let I="";o.length>0&&(h===0?I+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>':I+=`<span class="cd-footer__badge bad">${h} EQUIPMENT MISSING</span>`),n.length>0&&(y===0?I+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':I+=`<span class="cd-footer__badge warn">${y} PERMITS PENDING</span>`);const L=c,f=(m.action_points??0)>=2;document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${I}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            <button class="cd-btn primary" onclick="placeBid()" ${L&&f?"":"disabled"}
                title="${L?f?"Place a bid (2 AP)":"Need 2 AP to bid":"Not qualified for this contract"}">BID</button>
        </div>
    `,t.classList.add("open"),document.body.style.overflow="hidden"}function We(e){e&&e.target&&e.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",re=null)}const dt=[{key:"concrete",name:"Concrete",unit:"units"},{key:"steel",name:"Steel",unit:"units"},{key:"lumber",name:"Lumber",unit:"units"},{key:"aggregate",name:"Aggregate",unit:"units"},{key:"em_systems",name:"E&M Systems",unit:"units"},{key:"glass_facades",name:"Glass & Facades",unit:"units"},{key:"asphalt",name:"Asphalt",unit:"units"},{key:"heavy_parts",name:"Heavy Machinery Parts",unit:"units"}],pt=[{key:"work_trucks",name:"Work Trucks",tier:1},{key:"excavators",name:"Excavators",tier:1},{key:"bulldozers",name:"Bulldozers",tier:1},{key:"concrete_mixers",name:"Concrete Mixers",tier:1},{key:"tower_cranes",name:"Tower Cranes",tier:2},{key:"heavy_haulers",name:"Heavy Haulers",tier:2},{key:"pile_drivers",name:"Pile Drivers",tier:2},{key:"asphalt_plants",name:"Asphalt Plants",tier:2}],je={LOW:.7,STANDARD:1,HIGH:1.4},ze={LOW:35,STANDARD:65,HIGH:90},me=15;let P=null;function mt(e){if(!e)return;const t=e.required_materials||{},a=e.required_equipment||[],l=e.required_workforce||{},s={concrete:18e4,steel:25e4,lumber:12e4,aggregate:8e4,em_systems:32e4,glass_facades:28e4,asphalt:14e4,heavy_parts:4e5},c=dt.filter(d=>t[d.key]>0).map(d=>({...d,qty:t[d.key],basePrice:s[d.key]||2e5,grade:d.key==="aggregate"?"LOW":"STANDARD",highDisabled:!1})),i=pt.filter(d=>a.includes(d.key)).map(d=>({...d,owned:(O||[]).some(p=>p.equipment_key===d.key&&p.quantity>0)})),n=(l.general||100)+(l.skilled||20),o=e.budget_ceiling||1e8,r=Math.round(o*.03);P={contract:e,budgetCeiling:o,materials:c,laborCount:n,laborRate:15200,estimatedTicks:e.timeline_ticks||8,equipment:i,permits:[],overhead:r,markupPct:15,competitors:[],playerRep:m?.standing||50,requiredWorkforce:l},document.getElementById("bid-title").textContent="BID ASSEMBLY",document.getElementById("bid-subtitle").textContent=(e.name||"Contract")+" — "+Ce(e.sector)+" — "+(e.issuer_name||"Government"),document.getElementById("bid-overlay").classList.add("open"),document.body.style.overflow="hidden",ce()}function Fe(e){e&&e.target!==document.getElementById("bid-overlay")||(document.getElementById("bid-overlay").classList.remove("open"),document.body.style.overflow="",P=null)}function q(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(2)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function ut(e,t){if(!P)return;const a=P.materials[e];t==="HIGH"&&a.highDisabled||(a.grade=t,ce())}function vt(e){P&&(P.laborCount=e,ce())}function _t(e){P&&(P.markupPct=Number(e),ce())}function ce(){if(!P)return;const e=P;let t=0;for(const w of e.materials)w.lineCost=Math.round(w.qty*w.basePrice*je[w.grade]),t+=w.lineCost;const a=Math.round(e.laborCount*e.laborRate*e.estimatedTicks),l=Math.round(e.equipment.filter(w=>w.owned).length*12e3*e.estimatedTicks);let s=0;const c=e.overhead,i=t+a+l+s+c,n=Math.round(i*e.markupPct/100),o=i+n,r=o>e.budgetCeiling,d=n,p=Math.round(e.materials.reduce((w,Z)=>w+ze[Z.grade],0)/e.materials.length),v=p>=80?"STRONG":p>=60?"PROMISING":p>=40?"UNCERTAIN":"POOR",_=p>=80?"var(--green)":p>=60?"var(--teal)":p>=40?"var(--orange)":"var(--red)",g=e.budgetCeiling>0?o/e.budgetCeiling:1,y=Math.max(0,Math.min(100,Math.round((1-g)*150))),C=y>=70?"STRONG":y>=40?"COMPETITIVE":y>=15?"WEAK":"UNLIKELY",h=y>=70?"var(--green)":y>=40?"var(--teal)":y>=15?"var(--orange)":"var(--red)",I=Math.round(i*(1-me/100)),L=Math.round(i*(1+me/100));let f="";f+='<div class="bid-section"><div class="bid-section__title">Materials</div>',e.materials.forEach((w,Z)=>{const ee=K=>{const et=w.grade===K,tt=K==="HIGH"&&w.highDisabled;return`<button class="bid-grade-btn ${et?K==="LOW"?"active-low":K==="HIGH"?"active-high":"active":""} ${tt?"disabled":""}" onclick="setBidGrade(${Z},'${K}')">${K[0]}</button>`};f+=`<div class="bid-mat-row">
            <span class="bid-mat-row__name">${u(w.name)}</span>
            <span class="bid-mat-row__qty">×${w.qty}</span>
            <div class="bid-grade-btns">${ee("LOW")}${ee("STANDARD")}${ee("HIGH")}</div>
            <span class="bid-mat-row__cost">${q(w.lineCost)}</span>
        </div>`}),f+=`<div class="bid-line-total"><span class="bid-line-total__label">MATERIALS TOTAL</span><span class="bid-line-total__value">${q(t)}</span></div></div>`;const b=(e.requiredWorkforce?.general||80)+(e.requiredWorkforce?.skilled||20),$=[Math.round(b*.8),b,Math.round(b*1.2),Math.round(b*1.4),Math.round(b*1.6)];f+='<div class="bid-section"><div class="bid-section__title">Labor</div>',f+='<div class="bid-labor-presets">',$.forEach(w=>{f+=`<button class="bid-labor-btn ${e.laborCount===w?"active":""}" onclick="setBidLabor(${w})">${w}</button>`}),f+="</div>";const M=e.requiredWorkforce||{};f+=`<div class="bid-labor-formula">Required: ${M.general||"?"} general + ${M.skilled||"?"} skilled<br>`,f+=`${e.laborCount} workers × ${q(e.laborRate)}/tick × ${e.estimatedTicks} ticks = <strong>${q(a)}</strong></div>`,f+=`<div class="bid-line-total"><span class="bid-line-total__label">LABOR TOTAL</span><span class="bid-line-total__value">${q(a)}</span></div></div>`,f+='<div class="bid-section"><div class="bid-section__title">Equipment</div>',e.equipment.forEach(w=>{const Z=w.owned?"bid-equip-row__status--owned":"bid-equip-row__status--missing",ee=w.owned?"✓ OWNED":"✗ NOT OWNED";f+=`<div class="bid-equip-row"><span class="bid-equip-row__name">${u(w.name)}</span><span class="bid-equip-row__status ${Z}">${ee}</span></div>`}),f+=`<div class="bid-line-total"><span class="bid-line-total__label">MAINTENANCE (${e.estimatedTicks}t)</span><span class="bid-line-total__value">${q(l)}</span></div></div>`,f+='<div class="bid-section"><div class="bid-section__title">Permits</div>',f+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);padding:8px 0;">No permits required yet.</div>',f+='<div class="bid-line-total"><span class="bid-line-total__label">PERMITS TOTAL</span><span class="bid-line-total__value">$0</span></div></div>',f+='<div class="bid-section"><div class="bid-section__title">Overhead &amp; Contingency</div>',f+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Site management, insurance, admin</div>',f+=`<div class="bid-line-total"><span class="bid-line-total__label">OVERHEAD</span><span class="bid-line-total__value">${q(c)}</span></div></div>`,document.getElementById("bid-left").innerHTML=f;let E="";E+='<div class="bid-section"><div class="bid-section__title">Cost Summary</div>',E+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Materials</span><span class="bid-summary-row__value">${q(t)}</span></div>`,E+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Labor</span><span class="bid-summary-row__value">${q(a)}</span></div>`,E+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Equipment Maint.</span><span class="bid-summary-row__value">${q(l)}</span></div>`,E+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Permits</span><span class="bid-summary-row__value">${q(s)}</span></div>`,E+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Overhead</span><span class="bid-summary-row__value">${q(c)}</span></div>`,E+=`<div class="bid-cost-total"><span class="bid-cost-total__label">ESTIMATED COST</span><span class="bid-cost-total__value">${q(i)}</span></div>`,E+=`<div class="bid-accuracy">⚠ Estimate accuracy: ±${me}%<br>Actual cost range: ${q(I)} — ${q(L)}</div>`,E+="</div>",E+='<div class="bid-section"><div class="bid-section__title">Markup</div>',E+=`<div class="bid-slider-wrap">
        <div class="bid-slider-label"><span class="bid-slider-label__pct">${e.markupPct}%</span><span style="color:var(--text-dim)">${q(n)}</span></div>
        <input type="range" class="bid-slider" min="0" max="40" value="${e.markupPct}" oninput="setBidMarkup(this.value)">
    </div></div>`,E+=`<div class="bid-price-hero ${r?"bid-price-hero--over":""}">
        <div class="bid-price-hero__label">YOUR BID PRICE</div>
        <div class="bid-price-hero__value">${q(o)}</div>
        ${r?'<div class="bid-price-hero__warning">EXCEEDS BUDGET CEILING ('+q(e.budgetCeiling)+")</div>":""}
    </div>`,E+=`<div class="bid-profit"><span class="bid-profit__label">PROJECTED PROFIT</span><span class="bid-profit__value">+${q(d)}</span></div>`,E+=`<div class="bid-compete">
        <div style="display:flex;justify-content:space-between;"><span class="bid-compete__label" style="color:${h}">${C}</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Competitiveness</span></div>
        <div class="bid-compete__bar-wrap"><div class="bid-compete__bar" style="width:${y}%;background:${h}"></div></div>
    </div>`,E+=`<div class="bid-quality">
        <div style="display:flex;justify-content:space-between;"><span class="bid-quality__label" style="color:${_}">${v} (${p}/100)</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Quality Estimate</span></div>
        <div class="bid-quality__bar-wrap"><div class="bid-quality__bar" style="width:${p}%;background:${_}"></div></div>
    </div>`,E+='<div class="bid-section" style="margin-top:8px;"><div class="bid-section__title">Competing Bids</div>',e.competitors.forEach(w=>{E+=`<div class="bid-competitor"><span class="bid-competitor__name">${u(w.name)}</span><span class="bid-competitor__rep">Rep ${w.rep}</span></div>`}),E+=`<div class="bid-competitor" style="color:var(--gold);"><span class="bid-competitor__name">You</span><span class="bid-competitor__rep">Rep ${e.playerRep}</span></div>`,E+="</div>",document.getElementById("bid-right").innerHTML=E,document.getElementById("bid-footer-price").textContent=q(o),document.getElementById("bid-footer-price").style.color=r?"var(--red)":"var(--gold)",document.getElementById("bid-footer-profit").textContent="+"+q(d),document.getElementById("bid-footer-quality").textContent=p+"/100",document.getElementById("bid-footer-quality").style.color=_,document.getElementById("bid-submit-btn").disabled=r}window.openBidModal=mt;window.closeBidModal=Fe;window.setBidGrade=ut;window.setBidLabor=vt;window.setBidMarkup=_t;let ue=!1;async function ft(){if(!P||!m||ue)return;const e=P,t=e.contract;let a=0;const l={};for(const p of e.materials)a+=Math.round(p.qty*p.basePrice*je[p.grade]),l[p.key]=p.grade;const s=Math.round(e.laborCount*e.laborRate*e.estimatedTicks),c=Math.round(e.equipment.filter(p=>p.owned).length*12e3*e.estimatedTicks),i=a+s+c+e.overhead,n=Math.round(i*e.markupPct/100),o=i+n,r=Math.round(e.materials.reduce((p,v)=>p+ze[v.grade],0)/(e.materials.length||1));if(o>e.budgetCeiling){alert("Bid exceeds budget ceiling. Lower your costs or markup.");return}const d=document.getElementById("bid-submit-btn");d.disabled=!0,d.textContent="SUBMITTING...",ue=!0;try{const{data:p}=await k.from("shard").select("current_tick").eq("name","Alpha Shard").single(),v=p?.current_tick||0,{data:_}=await k.from("contract_bids").select("id").eq("contract_id",t.id).eq("faction_id",m.id).maybeSingle();if(_){const{error:y}=await k.from("contract_bids").update({bid_price:o,material_grades:l,labor_count:e.laborCount,markup_pct:e.markupPct,estimated_cost:i,estimated_quality:r,submitted_at_tick:v}).eq("id",_.id);if(y)throw y}else{const{error:y}=await k.from("contract_bids").insert({contract_id:t.id,faction_id:m.id,bid_price:o,material_grades:l,labor_count:e.laborCount,markup_pct:e.markupPct,estimated_cost:i,estimated_quality:r,status:"pending",submitted_at_tick:v});if(y)throw y}Fe();const g=document.getElementById("oc-count");if(g){const y=g.textContent;g.textContent="✓ BID SUBMITTED",g.style.color="var(--green)",setTimeout(()=>{g.textContent=y,g.style.color=""},2e3)}await Ve()}catch(p){console.error("Bid submission failed:",p),alert("Failed to submit bid: "+(p.message||"Unknown error")),d.disabled=!1,d.textContent="SUBMIT BID"}finally{ue=!1}}window.submitBid=ft;function j(e,t,a){const l=a?` style="color:${a}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${u(e)}</span>
        <span class="cd-detail-row__value"${l}>${u(t)}</span>
    </div>`}function yt(e){const t={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},a=e.drawing_number||e.contract_number+"-A1",l=B?.current_date||"",s=l?l.replace(/,\s*/," "):"",c=e.spec_category==="Heavy Infrastructure",i=e.spec_category==="Megaproject";let n=u(e.project_subtype||e.project_type||"STRUCTURE"),o=c?"80.0m":i?"200.0m":"60.0m",r=c?"40.0m":i?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${t.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(d,p)=>`<line x1="${p*20}" y1="0" x2="${p*20}" y2="200" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(d,p)=>`<line x1="0" y1="${p*20}" x2="680" y2="${p*20}" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${t.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${t.accent}" font-family="var(--font-mono)" font-weight="700">${n.toUpperCase()}</text>
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
        <text x="340" y="17" text-anchor="middle" font-size="5.5" fill="${t.dim}" font-family="var(--font-mono)">${o}</text>

        <!-- Dimension: right -->
        <line x1="630" y1="30" x2="630" y2="150" stroke="${t.dim}" stroke-width="0.5"/>
        <line x1="627" y1="30" x2="633" y2="30" stroke="${t.dim}" stroke-width="0.5"/>
        <line x1="627" y1="150" x2="633" y2="150" stroke="${t.dim}" stroke-width="0.5"/>
        <text x="645" y="93" text-anchor="middle" font-size="5.5" fill="${t.dim}" font-family="var(--font-mono)" transform="rotate(90,645,93)">${r}</text>

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
    </svg>`}let ve=!1;async function gt(){if(ve||!re||!m)return;if((m.action_points??0)<2){alert("You need at least 2 AP to place a bid.");return}ve=!0;const e=document.querySelector(".cd-btn.primary");e&&(e.disabled=!0,e.textContent="...");try{const{data:t,error:a}=await k.rpc("deduct_ap",{p_faction_id:m.id,p_cost:2});if(a)throw a;if(t<0){const s=-t-1;m.action_points=s,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+s+" AP</span>",e&&(e.disabled=!1,e.textContent="BID"),alert("Insufficient AP. You have "+s+" AP, need 2.");return}const{error:l}=await k.from("corp_contract_bids").insert({contract_id:re.id,faction_id:m.id,nation_id:m.nation_id,ap_spent:2,created_at_tick:B?.current_tick||null});if(l)throw await k.rpc("deduct_ap",{p_faction_id:m.id,p_cost:-2}),m.action_points=t+2,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+(t+2)+" AP</span>",l;m.action_points=t,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+t+" AP</span>",e&&(e.textContent="BID PLACED")}catch(t){e&&(e.disabled=!1,e.textContent="BID"),t.code==="23505"?alert("You have already placed a bid on this contract."):alert("Failed to place bid: "+(t.message||"Unknown error"))}finally{ve=!1}}async function Ve(){if(!m||!m.nation_id)return;const{data:e,error:t}=await k.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(t?(console.warn("Failed to load contracts:",t.message),X=[]):X=e||[],se={},m&&X.length>0){const a=X.map(s=>s.id),{data:l}=await k.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",m.id).in("contract_id",a);for(const s of l||[])se[s.contract_id]=s}Ge()}function bt(){const e=document.getElementById("ap-list"),t=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=R.length+" ACTIVE",R.length===0){e.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,t.style.display="none";return}const a=B?.current_tick||0;let l=0,s=0,c="";for(const i of R){const n=i.issuer_type==="GOVERNMENT",o=n?"gov":"private",r=Array.isArray(i.contract_bids)?i.contract_bids[0]:i.contract_bids,d=r?.bid_price||0,p=r?.estimated_cost||0,v=r?.estimated_quality||0,_=i.budget_ceiling||0,g=i.awarded_at_tick||a,y=g+(i.timeline_ticks||8),C=Math.max(0,y-a),h=Math.max(0,a-g),I=i.timeline_ticks||8,L=Math.min(100,Math.round(h/I*100)),f=a>y;Ne(i.sector);const b=Ce(i.sector);l+=_,s+=d,c+=`<div class="ap-item">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${u(i.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${u(i.issuer_name||"—")} · ${b}</div>
                </div>
                <span class="oc-item__type-badge ${o}">${n?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS</span>
                    <span class="ap-budget__values" style="color:${f?"var(--red)":"var(--teal)"}">
                        ${h}/${I} ticks ${f?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${L}%;background:${f?"var(--red)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${J(d)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${J(p)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${v>=70?"var(--green)":v>=40?"var(--teal)":"var(--orange)"}">${v}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${f?"var(--red)":"var(--text-bright)"}">${C} ticks</div>
                </div>
            </div>
        </div>`}e.innerHTML=c,t.style.display=R.length>0?"":"none",R.length>0&&(document.getElementById("ap-total-crew").textContent=R.length,document.getElementById("ap-total-budget").textContent=J(l),document.getElementById("ap-total-spent").textContent=J(s))}async function ht(){if(!m)return;const{data:e,error:t}=await k.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",m.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",m.id).order("awarded_at_tick",{ascending:!0});t?(console.warn("Failed to load active projects:",t.message),R=[]):R=e||[],bt()}const Qe=3e4;function Ye(){let e=0,t=0;for(const a of W)for(const l of Te){const s=D[a.key]?.[l];s&&(e+=s.qty,t+=s.value)}return{totalUnits:e,totalValue:t}}function qe(){const e=document.getElementById("wh-list"),{totalUnits:t,totalValue:a}=Ye();document.getElementById("wh-count").textContent=t.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=T(a);const l=Math.round(t/Qe*100),s=document.getElementById("wh-capacity");s.textContent=l+"%",s.style.color=l>80?"var(--red)":l>50?"var(--orange)":"var(--green)";let c="";for(let i=0;i<W.length;i++){const n=W[i],o=he===i,r=D[n.key]?.LOW||{qty:0,value:0},d=D[n.key]?.STD||{qty:0,value:0},p=D[n.key]?.HIGH||{qty:0,value:0},v=r.qty+d.qty+p.qty,_=r.value+d.value+p.value,g=v===0,y=V(n.key,"LOW",x),C=V(n.key,"STD",x),h=V(n.key,"HIGH",x),I=r.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",L=d.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",f=h.available?p.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(c+='<div class="wh-row">',c+=`<div class="wh-row__collapsed${o?" expanded":""}" onclick="toggleWhRow(${i})">
            <span class="wh-row__arrow">${o?"▾":"▸"}</span>
            <span class="wh-row__name${g?" empty":""}">${u(n.name)}</span>
            <div class="wh-row__dots">
                <div class="${I}"></div>
                <div class="${L}"></div>
                <div class="${f}"></div>
            </div>
            <span class="wh-row__qty${g?" empty":""}">${v>0?v.toLocaleString():"—"}</span>
            <span class="wh-row__val${g?" empty":""}">${_>0?T(_):"—"}</span>
        </div>`,o){c+='<div class="wh-expand">',c+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const b=[{key:"LOW",label:"Low",data:r,avail:y,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:d,avail:C,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:p,avail:h,color:"var(--green)",dotClass:"wh-dot--high"}];for(const $ of b){const M=!$.avail.available,E=$.data.qty>0,w=E?"$"+Math.round($.data.value/$.data.qty):"—";c+=`<div class="wh-grade${M?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${$.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${M?"var(--red)":$.color}">${$.label}</span>
                        ${M?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${E?"var(--text-bright)":"var(--text-dim)"}">${E?$.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${$.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${$.data.value>0?T($.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${w}</span>
                </div>`}for(const $ of b)!$.avail.available&&$.avail.failedStat&&(c+=`<div class="wh-lock">
                        <span class="wh-lock__text">${$.label.toUpperCase()} GRADE LOCKED — ${u($.avail.failedStat)} &lt; ${$.avail.failedMin}</span>
                    </div>`);c+="</div>"}c+="</div>"}e.innerHTML=c}function $t(e){he=he===e?-1:e,qe()}async function wt(){if(!m)return;const{data:e,error:t}=await k.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",m.id);if(D={},t)console.warn("Failed to load warehouse:",t.message);else if(e)for(const a of e)D[a.material_key]||(D[a.material_key]={}),D[a.material_key][a.quality_tier]={qty:a.quantity||0,value:Number(a.total_value)||0};qe()}const xt={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function Ke(){const e=(x?.name||m?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+e;const t=Number(m?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=T(t);const{totalUnits:a}=Ye(),l=Math.round(a/Qe*100),s=document.getElementById("pr-wh-capacity");s.textContent=l+"%",s.style.color=l>80?"var(--red)":l>50?"var(--orange)":"var(--green)",Xe(),Le(),de()}function Xe(){const e=document.getElementById("pr-mat-grid");let t="";for(const a of W){const l=A===a.key,s=Te.every(i=>!V(a.key,i,x).available),c="pr-mat-btn"+(l?" active":"")+(s?" all-locked":"");t+=`<span class="${c}" onclick="setPrMat('${a.key}')">${u(a.name)}</span>`}e.innerHTML=t}function Le(){const e=document.getElementById("pr-tier-bar");let t='<span class="pr-tier-label">GRADE</span>';for(const a of Te){const l=V(A,a,x),s=S===a,c=l.available?Ie(A,a,x):null,i=He[a],n=!l.available,o="pr-tier-btn"+(s?" active":"")+(n?" locked":"");t+=`<div class="${o}" onclick="${n?"":`setPrTier('${a}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${i};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${s?"var(--text-bright)":"var(--text-dim)"}">${be[a]}</span>
            </div>
            ${c!==null?`<div class="pr-tier-btn__price" style="color:${s?"var(--text-bright)":"var(--text-muted)"}">$${c}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}e.innerHTML=t}function de(){const e=document.getElementById("pr-content"),t=V(A,S,x),a=W.find(h=>h.key===A);if(!a)return;if(!t.available){e.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${u(a.name)} — ${be[S]} grade
                    is not produced domestically in ${u(x?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${u(t.failedStat||"unknown")} &lt; ${t.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const l=Ie(A,S,x),s=Oe(A,S,x),c=l*Q,i=s>3e3?"LOW":s>1e3?"MODERATE":"HIGH",n=i==="LOW"?"var(--green)":i==="MODERATE"?"var(--amber)":"var(--red)",o=Number(x?.inflation??50),r=o>55?"up":o<45?"down":"flat",d=r==="up"?"&#9650;":r==="down"?"&#9660;":"&#8212;",p=r==="up"?"var(--red)":r==="down"?"var(--green)":"var(--text-dim)";let v="";v+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${l}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${p}">${d}</span>
                </div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">SUPPLY/TICK</div>
                <div class="pr-market-cell__value" style="font-size:14px;color:var(--text-bright);margin-top:2px;">${s.toLocaleString()}</div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">DEMAND</div>
                <div class="pr-market-cell__value" style="font-size:12px;color:${n};margin-top:2px;">${i}</div>
            </div>
        </div>
    </div>`,v+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${u(x?.name||"—")})</div>`;for(const h of a.priceDrivers){const I=Number(x?.[h]??50),L=I>=50?"var(--green)":I>=30?"var(--amber)":I>=15?"var(--orange)":"var(--red)",f=xt[h]||h;v+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${u(h)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${I}%;background:${L}"></div>
            </div>
            <span class="pr-driver-row__val">${I}</span>
            <span class="pr-driver-row__effect">${u(f)}</span>
        </div>`}v+="</div>";const g=(Number(m?.corp_cash_reserves)||0)>=c,y=Q>s,C=He[S];v+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${u(a.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${C};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${C}">${be[S]}</span>
                </div>
                <span class="pr-order__mat-price">$${l}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(h=>`<span class="pr-qty-btn${Q===h?" active":""}" onclick="setPrQty(${h})">${h>=1e3?h/1e3+"k":h}</span>`).join("")}
                </div>
            </div>
            ${y?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${s.toLocaleString()} this tick</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${T(c)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${g&&!y?"":"disabled"}
                    title="${g?y?"Exceeds supply":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,e.innerHTML=v}function Et(e){A=e,S="STD";for(const t of["STD","HIGH","LOW"])if(V(e,t,x).available){S=t;break}Xe(),Le(),de()}function kt(e){S=e,Le(),de()}function It(e){Q=e,de()}let _e=!1;async function Tt(){if(_e||!m||!x)return;const e=Ie(A,S,x),t=Oe(A,S,x),a=e*Q,l=Number(m.corp_cash_reserves)||0;if(a>l){alert("Insufficient cash reserves.");return}if(Q>t){alert("Exceeds available supply this tick.");return}_e=!0;const s=document.querySelector(".pr-purchase-btn");s&&(s.disabled=!0,s.textContent="...");try{const c=l-a,{error:i}=await k.from("factions").update({corp_cash_reserves:c}).eq("id",m.id);if(i)throw i;const n=D[A]?.[S],o=(n?.qty||0)+Q,r=(n?.value||0)+a,{error:d}=await k.from("corp_warehouse").upsert({faction_id:m.id,nation_id:m.nation_id,material_key:A,quality_tier:S,quantity:o,total_value:r,last_purchased_tick:B?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(d){const{error:p}=await k.from("factions").update({corp_cash_reserves:l}).eq("id",m.id);throw p&&console.error("Cash refund failed after warehouse error:",p.message),d}m.corp_cash_reserves=c,D[A]||(D[A]={}),D[A][S]={qty:o,value:r},qe(),Ke(),s&&(s.textContent="PURCHASED",setTimeout(()=>{s.isConnected&&(s.disabled=!1,s.textContent="PURCHASE")},1500))}catch(c){s&&(s.disabled=!1,s.textContent="PURCHASE"),alert("Purchase failed: "+(c.message||"Unknown error"))}finally{_e=!1}}function Je(e){const t=Y||x;if(!t)return[];const a=le(e);if(!a)return[];const l=it(e,t),s=[],c=Number(t?.inflation??50),i=Number(t?.fuel_prices??50);Number(t?.manufacturing_output??50);const n=Y&&x&&Y.id!==x.id;let o=null;if(n&&(o=nt(t,x)),l.newAvailable>0){const r=Se(e,t),d=a.basePrice,p=Math.round(d*((c-50)/200)),v=Math.round(d*((i-50)/300));let _=r;const g=[{label:"Base price",value:T(d)},p!==0?{label:`Inflation (${c})`,mod:(p>=0?"+":"")+T(Math.abs(p))}:null,v!==0?{label:`Fuel transport (${i})`,mod:(v>=0?"+":"")+T(Math.abs(v))}:null].filter(Boolean),y=r-d-p-v;if(y!==0&&!n&&g.push({label:"Demand/scarcity",mod:(y>=0?"+":"")+T(Math.abs(y))}),n&&o){const C=Math.round(r*o.tariff),h=Math.round(r*o.transport);_=r+C+h,g.push({label:`Import tariff (${Math.round(o.tariff*100)}%)`,mod:"+"+T(C)}),g.push({label:`Transport (${o.deliveryTicks} tick${o.deliveryTicks>1?"s":""})`,mod:"+"+T(h)})}s.push({seller:n?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:n?o?.deliveryTicks||1:0,condition:100,price:Math.round(_),available:l.newAvailable,delivery:n?o.deliveryTicks+" tick"+(o.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:n?o.deliveryTicks:0,used:!1,priceFactors:g,sourceNationId:t.id})}if(l.usedAvailable>0){const r=l.usedCondition,d=Se(e,t,{used:!0,condition:r});let p=d;const v=[{label:"Base price",value:T(a.basePrice)},{label:`Condition (${r}%)`,mod:"-"+T(Math.max(0,a.basePrice-d))}];if(n&&o){const _=Math.round(d*o.tariff),g=Math.round(d*o.transport);p=d+_+g,v.push({label:`Import tariff (${Math.round(o.tariff*100)}%)`,mod:"+"+T(_)}),v.push({label:`Transport (${o.deliveryTicks} tick${o.deliveryTicks>1?"s":""})`,mod:"+"+T(g)})}s.push({seller:n?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:n?o?.deliveryTicks||1:0,condition:r,price:Math.round(p),available:l.usedAvailable,delivery:n?o.deliveryTicks+" tick"+(o.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:n?o.deliveryTicks:0,used:!0,priceFactors:v,sourceNationId:t.id})}return s}function pe(){const e=Number(m?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=T(e);const t=le(H),a=ie[t?.tier||1],l=document.getElementById("em-tier-badge");l&&(l.textContent=a.tag,l.style.color=a.color),l.style.background=a.color+"0a",l.style.border="1px solid "+a.color+"33";const s=document.getElementById("em-nation-select");if(s&&s.options.length===0){const n=x?.name||m?.nation||"—";let o=`<option value="">${u(n)} (HQ)</option>`;for(const r of oe)r.id!==x?.id&&(o+=`<option value="${r.id}">${u(r.name)}</option>`);s.innerHTML=o}const c=document.getElementById("em-import-tag"),i=Y&&x&&Y.id!==x.id;c&&(c.style.display=i?"":"none"),Ct(),Me()}function Ct(){let e="";for(let t=1;t<=3;t++){const a=ie[t],l=ge(t),s=t===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";e+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${a.color}">${a.tag}</div>
            <div class="${s}">`;for(const c of l){const i=H===c.key,n=Je(c.key).length>0;e+=`<span class="em-selector__btn${i?" active":""}${n?"":" no-listings"}"
                style="${i?"background:"+a.color+";border-color:"+a.color:""}"
                onclick="setEmType('${c.key}')">${u(c.name)}</span>`}e+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${e}</div>`}function Me(){const e=document.getElementById("em-content");if(z=Je(H),z.length===0){e.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}G>=z.length&&(G=0);let t="";for(let l=0;l<z.length;l++){const s=z[l],c=G===l,i=s.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",n=Pe(s.condition);t+=`<div class="em-listing${c?" selected":""}" style="${c?"border-left-color:"+i:""}" onclick="setEmListing(${l})">`,t+=`<div class="em-listing__row1">
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
                    <div class="em-stat-cell__bar-track"><div class="em-stat-cell__bar-fill" style="width:${s.condition}%;background:${n}"></div></div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${n}">${s.condition}%</span>
                </div>
            </div>
            <div class="em-stat-cell" style="flex:0.8;text-align:center">
                <div class="em-stat-cell__label">AVAIL.</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${s.available}</div>
            </div>
            <div class="em-stat-cell" style="flex:1.2">
                <div class="em-stat-cell__label">PRICE/UNIT</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${T(s.price)}</div>
            </div>
        </div>`,c&&s.priceFactors&&(t+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${s.priceFactors.map(o=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${u(o.label)}</span>
                    <span class="em-breakdown__mod" style="color:${o.mod?o.mod.startsWith("-")?"var(--green)":o.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${o.mod||o.value}</span>
                </div>`).join("")}
            </div>`),t+="</div>"}const a=z[G];if(a){const l=le(H),s=ie[l?.tier||1],c=Math.min(a.available,4),i=a.price*U,n=(Number(m?.corp_cash_reserves)||0)>=i;t+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${u(l?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${u(a.seller)}</span>
                </div>
                <span class="em-purchase__price">${T(a.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:c},(o,r)=>r+1).map(o=>`<span class="em-qty-btn${U===o?" active":""}" style="${U===o?"background:"+s.color+";border-color:"+s.color:""}" onclick="setEmQty(${o})">${o}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${a.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${T(i)}</div>
                    ${a.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${u(a.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${s.color}" onclick="purchaseEquipment()"
                    ${n?"":"disabled"}
                    title="${n?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}e.innerHTML=t}async function qt(e){if(!e)Y=null;else{let a=oe.find(l=>l.id===e);if(!a)try{const{data:l}=await k.from("nations").select("*").eq("id",e).single();a=l}catch{}Y=a||null}G=0,U=1;const t=document.getElementById("em-nation-select");t&&(t.value=e||""),pe()}function Lt(e){H=e,G=0,U=1,pe()}function Mt(e){G=e,U=1,Me()}function At(e){U=e,Me()}let fe=!1;async function St(){if(fe)return;const e=z[G];if(!e||!m)return;const t=le(H);if(!t)return;const a=U,l=e.price*a,s=Number(m.corp_cash_reserves)||0;if(l>s){alert("Insufficient cash reserves.");return}if(a>e.available){alert("Not enough units available.");return}const c=document.querySelector(".em-purchase-btn");c&&(c.disabled=!0,c.textContent="..."),fe=!0;try{const i=s-l,{error:n}=await k.from("factions").update({corp_cash_reserves:i}).eq("id",m.id);if(n)throw n;const o=!e.deliveryTicks||e.deliveryTicks===0;if(o){const d=O.find(L=>L.equipment_key===H),p=(d?.owned||0)+a,v=d?.purchase_price_avg||0,_=d?.owned||0,g=_>0?Math.round((v*_+e.price*a)/p):e.price,y=t.maintenancePerUnit*p,C=d?.condition||100,h=Math.round((C*_+e.condition*a)/p),{error:I}=await k.from("corp_equipment").upsert({faction_id:m.id,nation_id:m.nation_id,equipment_key:H,tier:t.tier,owned:p,deployed:d?.deployed||0,condition:h,maintenance_per_tick:y,purchase_price_avg:g,last_purchased_tick:B?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(I){const{error:L}=await k.from("factions").update({corp_cash_reserves:s}).eq("id",m.id);throw L&&console.error("Cash refund failed:",L.message),I}d?(d.owned=p,d.condition=h,d.maintenance_per_tick=y):O.push({equipment_key:H,tier:t.tier,owned:p,deployed:0,condition:h,maintenance_per_tick:y,assigned_projects:[]})}else{const d=(B?.current_tick||0)+e.deliveryTicks,{error:p}=await k.from("corp_equipment_deliveries").insert({faction_id:m.id,equipment_key:H,quantity:a,condition:e.condition,delivery_tick:d,source_nation_id:e.sourceNationId||null,seller_name:e.seller,price_paid:l});if(p){const{error:v}=await k.from("factions").update({corp_cash_reserves:s}).eq("id",m.id);throw v&&console.error("Cash refund failed:",v.message),p}}m.corp_cash_reserves=i,Ae(),pe();const r=document.getElementById("pr-cash");r&&(r.textContent=T(i)),c&&(c.textContent=o?"PURCHASED":"ORDERED",setTimeout(()=>{c.isConnected&&(c.disabled=!1,c.textContent="PURCHASE")},1500))}catch(i){c&&(c.disabled=!1,c.textContent="PURCHASE"),alert("Purchase failed: "+(i.message||"Unknown error"))}finally{fe=!1}}let Bt=-1,ae=[],ke=[],Ze=[];function ye(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function Dt(e,t,a){if(a)return"var(--orange)";const l=e/(t||1)*100;return l>50?"var(--green)":l>25?"var(--amber)":"var(--red)"}function Pt(){const e=document.getElementById("pm-list"),t=ae.length,a=ke.length,l=Ze.length,s=ae.filter(o=>o.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${t})`,document.getElementById("pm-pending-count").textContent=`(${a})`,document.getElementById("pm-apply-count").textContent=`(${l})`;const c=document.getElementById("pm-badges");let i="";s>0&&(i+=`<span class="pm-badge pm-badge--expiring">${s} EXPIRING</span>`),a>0&&(i+=`<span class="pm-badge pm-badge--pending">${a} PENDING</span>`),c.innerHTML=i;const n=ae.reduce((o,r)=>o+(r.cost||0),0)+ke.reduce((o,r)=>o+(r.cost||0),0);document.getElementById("pm-total-cost").textContent=ye(n),document.getElementById("pm-footer-active").textContent=t,document.getElementById("pm-footer-pending").textContent=a;{if(t===0){e.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let o="";ae.forEach((r,d)=>{const p=Bt===d,v=Dt(r.ticks_left,r.total_ticks,r.expiring_soon),_=Math.min(r.ticks_left/(r.total_ticks||1)*100,100);o+=`<div class="pm-item ${r.expiring_soon?"pm-item--expiring":""} ${p?"expanded":""}" onclick="togglePmExpand(${d})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${u(r.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${u((r.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${v}">Expires: ${u(r.expires||"")}</span>
                        <span class="pm-item__ticks">(${r.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${_}%;background:${v}"></div></div>`,p&&(o+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${u(r.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${u(r.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${ye(r.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${r.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${r.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(r.projects||[]).map(g=>`<span class="pm-project-chip">${u(g)}</span>`).join("")}</div>
                    </div>`,r.note&&(o+=`<div class="pm-note"><span class="pm-note__text">${u(r.note)}</span></div>`),r.expiring_soon&&r.renewable&&(o+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew">RENEW — ${ye(r.cost||0)}</button></div>`),o+="</div>"),o+="</div></div>"}),e.innerHTML=o;return}}function Ht(){ae=[],ke=[],Ze=[],Pt()}let F=[],Ot=-1;function N(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function Be(e){return e>=85?"var(--gold)":e>=60?"var(--green)":e>=40?"var(--orange)":"var(--red)"}function Nt(e){return"dl-result--"+e.toLowerCase()}function De(){const e=document.getElementById("dl-list"),t=F.length;document.getElementById("dl-count").textContent=`${t} COMPLETED`;const a=F.reduce((n,o)=>{const r=o.financials||{};return n+((r.payment||0)+(r.bonus||0)-(r.penalty||0)-(r.total_cost||0))},0),l=document.getElementById("dl-lifetime-profit");l.textContent=(a>=0?"+":"")+N(a),l.style.color=a>=0?"var(--green)":"var(--red)";const s={};F.forEach(n=>{s[n.result]=(s[n.result]||0)+1});const c=document.getElementById("dl-footer-results");if(c.innerHTML=Object.entries(s).map(([n,o])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[n]||"var(--text-dim)"}">${u(n)}</div>
            <div class="dl-footer__result-count">${o}</div>
        </div>`).join(""),t===0){e.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let i="";F.forEach((n,o)=>{const r=Ot===o,d=n.financials||{},p=(d.payment||0)+(d.bonus||0)-(d.penalty||0)-(d.total_cost||0),v=p>=0,_=Nt(n.result),y={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[n.result]||"var(--text-dim)",C=n.type==="GOVERNMENT";if(i+=`<div class="dl-item ${r?"expanded":""}" onclick="toggleDlExpand(${o})">
            <div class="dl-item__inner" style="border-left:2px solid ${y}">
                <div class="dl-item__row1">
                    <span class="dl-item__name">${u(n.name)}</span>
                    <span class="dl-result-badge ${_}">${u(n.result)}</span>
                </div>
                <div class="dl-item__row2">
                    <span class="dl-item__id">${u(n.id)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                    <span class="dl-item__issuer" style="color:${C?"var(--green)":"var(--gold)"}">${u(n.issuer)}</span>
                    <span class="dl-item__date">${u(n.delivered)}</span>
                </div>
                <div class="dl-summary-bar">
                    <div class="dl-summary-cell" style="flex:1;">
                        <div class="dl-summary-label">QUALITY</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span class="dl-summary-value" style="color:${Be(n.quality_score)}">${n.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${n.rep_change>0?"var(--green)":n.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${n.rep_change>0?"+":""}${n.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${v?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${v?"var(--green)":"var(--red)"};margin-top:2px;">${v?"+":""}${N(p)}</div>
                    </div>
                </div>`,r){const h=n.inspection||{};i+='<div style="margin-top:8px;">',i+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(b=>{const $=h[b]||{score:0,issues:[]},M=Be($.score),E=Math.min($.score/100*100,100);i+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${u(b.charAt(0).toUpperCase()+b.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${E}%;background:${M}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${M}">${$.score}</span>
                        </div>
                    </div>
                    ${($.issues||[]).map(w=>`<div class="dl-inspect-issue">${u(w)}</div>`).join("")}
                </div>`});const I=h.permits||{passed:!0,issues:[]};i+=`<div class="dl-permits-row ${I.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${I.passed?"var(--green)":"var(--red)"}">${I.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${(I.issues||[]).map(b=>`<div class="dl-inspect-issue dl-inspect-issue--red">${u(b)}</div>`).join("")}
            </div>`,i+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',i+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(n.materials_used||[]).forEach(b=>{const $=b.grade==="HIGH"?"var(--green)":b.grade==="STANDARD"?"var(--amber)":"var(--orange)",M=b.impact==="positive"?"▲":b.impact==="negative"?"▼":"–",E=b.impact==="positive"?"var(--green)":b.impact==="negative"?"var(--red)":"var(--text-dim)";i+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${u(b.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${$}"></div>
                    <span class="dl-mat-tag__grade" style="color:${$}">${u(b.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${E}">${M}</span>
                </div>`}),i+="</div>",i+='<div class="dl-section-label">Financial Summary</div>',i+='<div class="dl-fin-panel">',i+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${N(d.contract_value||0)}</span></div>`,(d.bonus||0)>0&&(i+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${N(d.bonus)}</span></div>`),(d.penalty||0)>0&&(i+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${N(d.penalty)}</span></div>`);const L=(d.payment||0)+(d.bonus||0)-(d.penalty||0);i+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${N(L)}</span></div>`,i+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${N(d.total_cost||0)}</span></div>`,i+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${v?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${v?"var(--green)":"var(--red)"}">${v?"+":""}${N(p)}</span>
            </div>`,i+="</div>";const f=n.timeline||{};i+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${f.actual||0}/${f.expected||0} ticks</span>`,f.early?i+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(f.expected||0)-(f.actual||0)} TICK${f.expected-f.actual!==1?"S":""} EARLY</span>`:!f.on_time&&f.actual>f.expected&&(i+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(f.actual||0)-(f.expected||0)} TICK${f.actual-f.expected!==1?"S":""} LATE</span>`),i+="</div>",i+="</div>"}i+="</div></div>"}),e.innerHTML=i}async function Rt(){if(!m){F=[],De();return}const{data:e,error:t}=await k.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",m.id).order("delivered_at_tick",{ascending:!1}).limit(20);t?(console.warn("Failed to load deliveries:",t.message),F=[]):F=(e||[]).map(a=>{const l=a.construction_contracts||{};return{id:a.contract_id,name:l.name||"Project",type:l.issuer_type||"GOVERNMENT",issuer:l.issuer_name||"Government",delivered:"Tick "+(a.delivered_at_tick||0),result:a.result,quality_score:a.quality_score,rep_change:a.rep_change,financials:{contract_value:a.contract_value||0,bonus:a.quality_bonus||0,penalty:a.penalties||0,payment:a.payment_received||0,total_cost:a.total_cost||0},inspection:a.inspection||{},materials_used:a.materials_used||[],timeline:{expected:a.timeline_expected||0,actual:a.timeline_actual||0,on_time:a.on_time,early:a.timeline_actual<a.timeline_expected}}}),De()}function Ae(){const e=O.reduce((n,o)=>n+(o.owned||0),0),t=O.reduce((n,o)=>n+(o.deployed||0),0),a=st(O),l=e-t;document.getElementById("eq-count").textContent=e+" UNITS",document.getElementById("eq-summary").innerHTML=`
        <div class="eq-summary__cell">
            <div class="eq-summary__label">DEPLOYED</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--text-bright)">
                ${t} <span style="font-size:9px;color:var(--text-dim)">/ ${e}</span>
            </div>
        </div>
        <div class="eq-summary__cell">
            <div class="eq-summary__label">AVAILABLE</div>
            <div class="eq-summary__value" style="font-size:14px;color:${l===0?"var(--orange)":"var(--green)"}">
                ${l}
            </div>
        </div>
        <div class="eq-summary__cell">
            <div class="eq-summary__label">MAINT/TICK</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--red)">
                ${T(a)}
            </div>
        </div>`;const s={};for(const n of O)s[n.equipment_key]=n;let c="";for(let n=1;n<=3;n++){const o=ie[n],r=ge(n),d=$e===n,p=r.reduce((_,g)=>_+(s[g.key]?.owned||0),0),v=r.reduce((_,g)=>_+(s[g.key]?.deployed||0),0);if(c+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${n})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${d?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${o.color}">${u(o.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${o.color};border:1px solid ${o.color}33;background:${o.color}0a">${o.tag}</span>
            </div>
            ${p>0?`<span class="eq-tier-hdr__count">${v}/${p}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,d)for(const _ of r){const g=s[_.key],y=g?.owned||0,C=g?.deployed||0,h=g?.condition||0,I=_.maintenancePerUnit*y,L=y-C,f=y>0&&L===0,b=y>0&&h<65,$=Pe(h),M=g?.assigned_projects||[],E=M.length>0?M.map(w=>w.contract_name||"Project").join(", ").slice(0,30):y>0&&C>0?C+" project"+(C>1?"s":""):"—";c+=`<div class="eq-row${y===0?" unowned":""}">`,c+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${y===0?" dim":""}">${u(_.name)}</span>
                        ${b?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${y>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${f?"var(--orange)":"var(--green)"}">${L}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${C}/${y}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,y>0?c+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${h}%;background:${$}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${$}">${h}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${u(E)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${T(I)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:c+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',c+="</div>"}}document.getElementById("eq-list").innerHTML=c;const i=[1,2,3].map(n=>{const o=ie[n],r=ge(n).reduce((d,p)=>d+(s[p.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${r>0?o.color+"33":"var(--border-0)"};background:${r>0?o.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${o.color}">${o.tag}</div>
            <div class="eq-footer__tier-count" style="color:${r>0?"var(--text-bright)":"var(--text-dim)"}">${r}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${T(a)}</div>
        </div>
        <div class="eq-footer__tiers">${i}</div>`}function Gt(e){$e=$e===e?-1:e,Ae()}async function Ut(){if(!m)return;const{data:e,error:t}=await k.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",m.id);t?(console.warn("Failed to load equipment:",t.message),O=[]):O=e||[],Ae()}async function Wt(){const{data:{user:e}}=await k.auth.getUser();if(!e){window.location.href="login.html";return}const{data:t}=await k.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);te=(t||[]).filter(r=>r.nation_id);const a=sessionStorage.getItem("active_faction_id");if(m=te.find(r=>r.id===a)||te.find(r=>r.faction_type==="corporation")||te[0],!m){await k.auth.signOut(),window.location.href="login.html";return}if(m.faction_type!=="corporation"){window.location.href="dashboard.html";return}const[l,s]=await Promise.all([m.nation_id?k.from("nations").select("*").eq("id",m.nation_id).single():Promise.resolve({data:null}),k.from("shard").select("current_tick, current_date, next_tick_at").eq("name","Alpha Shard").single()]);l.error&&console.warn("Nation load failed:",l.error.message),l.data&&(x=l.data),s.error&&console.warn("Shard load failed:",s.error.message),B=s.data;const c=m.corp_ticker||m.abbreviation||"";document.getElementById("corp-logo").textContent=c.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=m.faction_name||"Unnamed Corp",B&&(document.getElementById("game-date").textContent=B.current_date||"—",document.getElementById("tick-number").textContent=B.current_tick||"—",B.next_tick_at&&(we=new Date(B.next_tick_at),rt())),document.getElementById("corp-name-badge").textContent=(c?"["+c+"]":m.faction_name||"Corp")+" ▾";const i=document.getElementById("topbar-cash");if(i){const r=Number(m.corp_cash_reserves??0),d=r>=1e9?"$"+(r/1e9).toFixed(1)+"B":r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k";i.textContent="CASH: "+d}const n=m.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+n+" AP</span>",document.getElementById("nation-pill").textContent=(x?.name||m.nation||"—").toUpperCase();const o=document.getElementById("corp-faction-dropdown");if(o){let r="";for(const d of te){const p=d.id===m.id,v=d.faction_type==="corporation"?"CORP":"PARTY",_=d.faction_type==="corporation"?"var(--teal)":"var(--amber)";r+=`<div class="corp-dd-item${p?" active":""}" onclick="switchToFaction('${d.id}', '${d.faction_type}')">
                <span class="corp-dd-type" style="color:${_}">${v}</span>
                <span class="corp-dd-name">${u(d.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${u(d.abbreviation||"—")}]</span>
            </div>`}o.innerHTML=r}await Promise.all([Ve(),ht(),wt(),Ut(),Ht(),Rt()]);try{const{data:r}=await k.from("nations").select("*").order("name");oe=r||[]}catch{oe=[]}Ke(),pe(),at(m,x,B),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}async function jt(){await k.auth.signOut(),window.location.href="login.html"}function zt(){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.toggle("open")}function Ft(e,t){const a=document.getElementById("corp-faction-dropdown");a&&a.classList.remove("open"),sessionStorage.setItem("active_faction_id",e),t==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",e=>{const t=document.getElementById("faction-switcher"),a=document.getElementById("corp-faction-dropdown");a&&t&&!t.contains(e.target)&&a.classList.remove("open")});document.addEventListener("keydown",e=>{e.key==="Escape"&&We()});window.doLogout=jt;window.toggleTheme=lt;window.toggleCorpDropdown=zt;window.switchToFaction=Ft;window.setFilter=ct;window.openContractDetail=Ue;window.closeContractDetail=We;window.placeBid=gt;window.toggleWhRow=$t;window.toggleEqTier=Gt;window.switchEmNation=qt;window.setEmType=Lt;window.setEmListing=Mt;window.setEmQty=At;window.purchaseEquipment=St;window.setPrMat=Et;window.setPrTier=kt;window.setPrQty=It;window.purchaseMaterial=Tt;Wt();
