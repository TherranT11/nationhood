import{_ as $}from"./supabase-client-BXEzLDpS.js";import{e as u}from"./utils-C2W-HleY.js";import{i as Gt}from"./messaging-5qyQ6ziq.js";import{c as Ft,a as We,E as _e,b as Ce,d as vt,e as Wt,f as Vt,h as ct}from"./equipment-DsuDdEne.js";const yt={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},Z=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"manufacturing_output",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:50},{stat:"higher_education",min:40}]}},priceDrivers:["manufacturing_output","inflation","fuel_prices","urbanization"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:10}]},STD:{requirements:[{stat:"manufacturing_output",min:35},{stat:"rare_minerals",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:40},{stat:"higher_education",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","inflation","fuel_prices"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"arable_land",min:10}]},STD:{requirements:[{stat:"arable_land",min:30},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"arable_land",min:50},{stat:"manufacturing_output",min:30}]}},priceDrivers:["arable_land","physical_infrastructure","inflation"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"rare_minerals",min:15},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"rare_minerals",min:35},{stat:"manufacturing_output",min:25}]}},priceDrivers:["rare_minerals","physical_infrastructure","inflation"]},{key:"em",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:15}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"digital_infrastructure",min:25}]},HIGH:{requirements:[{stat:"manufacturing_output",min:55},{stat:"digital_infrastructure",min:50},{stat:"energy_generation",min:40}]}},priceDrivers:["manufacturing_output","digital_infrastructure","inflation","energy_generation"]},{key:"glass",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:20}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"digital_infrastructure",min:40},{stat:"higher_education",min:50}]}},priceDrivers:["manufacturing_output","standard_of_living","inflation"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"oil_and_gas",min:10}]},STD:{requirements:[{stat:"oil_and_gas",min:30},{stat:"manufacturing_output",min:25}]},HIGH:{requirements:[{stat:"oil_and_gas",min:45},{stat:"manufacturing_output",min:40},{stat:"physical_infrastructure",min:40}]}},priceDrivers:["oil_and_gas","manufacturing_output","inflation","fuel_prices"]},{key:"heavy",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:40},{stat:"rare_minerals",min:30}]},STD:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:45},{stat:"higher_education",min:40}]},HIGH:{requirements:[{stat:"manufacturing_output",min:75},{stat:"rare_minerals",min:60},{stat:"higher_education",min:55},{stat:"digital_infrastructure",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","higher_education","digital_infrastructure"]}];function se(i,t,e){const a=Z.find(d=>d.key===i);if(!a)return{available:!1,failedStat:"unknown_material"};const n=a.tiers[t];if(!n)return{available:!1,failedStat:"unknown_tier"};for(const d of n.requirements){const r=Number(e?.[d.stat]??0);if(r<d.min)return{available:!1,failedStat:d.stat,failedMin:d.min,nationValue:r}}return{available:!0}}function tt(i,t,e){const n={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em:{LOW:400,STD:700,HIGH:1200},glass:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy:{LOW:800,STD:1400,HIGH:2400}}[i]?.[t];if(!n)return 0;const d=Z.find(l=>l.key===i);if(!d)return n;let r=1;for(const l of d.priceDrivers){const o=Number(e?.[l]??50);l==="inflation"||l==="fuel_prices"?r*=1+(o-50)/200:r*=1-(o-50)/250}return r=Math.max(.4,Math.min(2.5,r)),Math.round(n*r)}function gt(i,t,e){const n={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em:{LOW:1e3,STD:700,HIGH:300},glass:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy:{LOW:400,STD:200,HIGH:80}}[i]?.[t]||0,r=Z.find(s=>s.key===i)?.priceDrivers?.[0],o=.3+(r?Number(e?.[r]??50):50)/50*.7;return Math.round(n*o)}const it=["LOW","STD","HIGH"],Ve={LOW:"Low",STD:"Standard",HIGH:"High"};let ue=[],m=null,b=null,B=null,ce=[],ge={},V=[],O={},Ye=-1,z="concrete",P="STD",oe=500,Y=[],Qe=0,G="trucks",K=0,J=1,te=[],re=null,we=[],Ke=null,he=null,Je="ALL",Xe="TIMELINE";function L(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(1)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i}function Yt(i){if(i>=12){const t=Math.floor(i/12),e=i%12;return e>0?t+"y "+e+"mo":t+"y"}return i+" ticks"}function F(i){return Math.abs(i)>=1e9?"$"+(i/1e9).toFixed(1)+"B":Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(0)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i}function Ie(i){return i==="civil_engineering"?"CIVIL":i==="industrial"?"INDUSTRIAL":i==="mega_project"?"MEGA":i?.toUpperCase()||"—"}function _t(i){return i==="civil_engineering"?"light":i==="industrial"?"heavy":i==="mega_project"?"mega":"light"}function Qt(){he&&clearInterval(he),he=setInterval(()=>{if(!Ke)return;const i=Ke-Date.now();if(i<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(he);return}const t=Math.floor(i/36e5),e=Math.floor(i%36e5/6e4),a=Math.floor(i%6e4/1e3);document.getElementById("tick-countdown").textContent=t+"h "+e+"m "+a+"s"},1e3)}function Kt(){document.body.classList.toggle("light-mode");const i=document.getElementById("theme-toggle");i.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function Jt(i,t){i==="type"&&(Je=t),i==="sort"&&(Xe=t),document.querySelectorAll(`.filter-pill[data-filter="${i}"]`).forEach(e=>{e.classList.toggle("active",e.dataset.value===t)}),xt()}function bt(i){return!(!m||i.sector==="mega_project"&&m.corp_subsector!=="Megaprojects"||i.sector==="industrial"&&!["Heavy Infrastructure","Megaprojects"].includes(m.corp_subsector))}function xt(){const i=document.getElementById("oc-list");let t=[...ce];if(Je==="GOVERNMENT"?t=t.filter(n=>n.issuer_type==="GOVERNMENT"):Je==="PRIVATE"&&(t=t.filter(n=>n.issuer_type==="PRIVATE")),Xe==="TIMELINE"&&t.sort((n,d)=>(n.timeline_ticks||0)-(d.timeline_ticks||0)),Xe==="BUDGET"&&t.sort((n,d)=>(d.budget_ceiling||0)-(n.budget_ceiling||0)),document.getElementById("oc-count").textContent=t.length+" AVAILABLE",t.length===0){i.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const e=B?.current_tick||0;let a="";for(const n of t){const d=n.issuer_type==="GOVERNMENT",r=d?"gov":"private",l=bt(n),o=l?"":" locked",s=_t(n.sector),c=Ie(n.sector),p=(n.timeline_ticks||0)>18?" warn":"",f=n.bidding_ends_tick?Math.max(0,n.bidding_ends_tick-e):"?";a+=`
            <div class="oc-item${o}" data-contract-id="${n.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${u(n.name)}</span>
                    <span class="oc-item__type-badge ${r}">${d?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${r}">${u(n.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${f} tick${f!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${F(n.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${p}">${Yt(n.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${s}">${c}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${ge[n.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${F(ge[n.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${l?"yes":"no"}">${l?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${l?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openBidModal(contracts.find(x=>x.id==='${n.id}'))">${ge[n.id]?"EDIT":"VIEW"}</button>`:""}
                </div>
                ${n.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${u(n.description)}</div>`:""}
            </div>`}i.innerHTML=a,i.querySelectorAll(".oc-item:not(.locked)").forEach(n=>{n.addEventListener("click",()=>{const d=n.dataset.contractId,r=ce.find(l=>l.id===d);r&&$t(r)})})}let ke=null;function $t(i){ke=i;const t=document.getElementById("cd-overlay"),e=i.issuer_type==="GOVERNMENT",a=e?"gov":"private",n=(b?.name||m.nation||"—").toUpperCase(),d=bt(i);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${u(n)}</span>
        <span class="cd-header__name">${u(i.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${a}">${u(i.issuer_name)}</span>
        <span class="cd-header__type-badge ${a}">${e?"GOV":"PRIVATE"}</span>
    `;const r=document.getElementById("cd-blueprint");i.blueprint_svg?(r.innerHTML=i.blueprint_svg,r.style.display=""):(r.innerHTML=vi(i),r.style.display="");const l=i.permits_required||[],o=i.required_equipment||i.equipment_required||[],s=i.required_materials||i.materials_estimated||{},p={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[i.sector]||i.spec_category||i.sector||"—";let f="var(--teal)";i.sector==="industrial"&&(f="var(--orange)"),i.sector==="mega_project"&&(f="var(--red)");let g=L(i.budget_ceiling||i.budget||0),v=(i.timeline_ticks||i.timeline_months||0)+" Months",y="";y+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${u(i.project_code||i.contract_number||"")}</span>
            </div>
            <div class="cd-issue__tags">
                ${i.project_type?`<span class="cd-tag teal">${u(i.project_type.toUpperCase())}</span>`:""}
                ${i.project_subtype?`<span class="cd-tag gold">${u(i.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,i.description&&(y+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${u(i.description)}</div>
            </div>`),y+='<div class="cd-details">',i.project_type&&(y+=ee("Type",i.project_type)),i.project_subtype&&(y+=ee("Sub-Type",i.project_subtype)),y+=ee("Specialization",p,f),y+=ee("Total Budget",g,"var(--green)"),y+=ee("Timeline",v),y+=ee("Nation",b?.name||m.nation||"—"),i.region&&(y+=ee("Region",i.region)),y+="</div>",l.length>0&&(y+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${l.map(C=>{const I=C.status==="approved"?"approved":"required",T=C.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${I}">
                            <span class="cd-chip__icon">${T}</span>
                            <span class="cd-chip__label">${u(C.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),o.length>0&&(y+=`
            <div class="cd-items">
                <div class="cd-section-label">Required Equipment</div>
                <div class="cd-items__list">
                    ${o.map(C=>{const I=C.owned?"owned":"missing",T=C.owned?"&#10003;":"&#10007;";return`<div class="cd-chip ${I}">
                            <span class="cd-chip__icon">${T}</span>
                            <span class="cd-chip__label">${u(C.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),s.length>0&&(y+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${s.map(C=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${u(C.name)}</span>
                        <span class="cd-mat-row__qty">${u(String(C.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=y;const k=l.filter(C=>C.status==="approved").length,x=l.length-k,w=o.filter(C=>C.owned).length,A=o.length-w;let _="";o.length>0&&(A===0?_+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>':_+=`<span class="cd-footer__badge bad">${A} EQUIPMENT MISSING</span>`),l.length>0&&(x===0?_+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':_+=`<span class="cd-footer__badge warn">${x} PERMITS PENDING</span>`);const S=d,M=(m.action_points??0)>=2;document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${_}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            <button class="cd-btn primary" onclick="placeBid()" ${S&&M?"":"disabled"}
                title="${S?M?"Place a bid (2 AP)":"Need 2 AP to bid":"Not qualified for this contract"}">BID</button>
        </div>
    `,t.classList.add("open"),document.body.style.overflow="hidden"}function ht(i){i&&i.target&&i.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",ke=null)}const Xt=[{key:"concrete",name:"Concrete",unit:"units"},{key:"steel",name:"Steel",unit:"units"},{key:"lumber",name:"Lumber",unit:"units"},{key:"aggregate",name:"Aggregate",unit:"units"},{key:"em_systems",name:"E&M Systems",unit:"units"},{key:"glass_facades",name:"Glass & Facades",unit:"units"},{key:"asphalt",name:"Asphalt",unit:"units"},{key:"heavy_parts",name:"Heavy Machinery Parts",unit:"units"}],Zt=[{key:"work_trucks",name:"Work Trucks",tier:1},{key:"excavators",name:"Excavators",tier:1},{key:"bulldozers",name:"Bulldozers",tier:1},{key:"concrete_mixers",name:"Concrete Mixers",tier:1},{key:"tower_cranes",name:"Tower Cranes",tier:2},{key:"heavy_haulers",name:"Heavy Haulers",tier:2},{key:"pile_drivers",name:"Pile Drivers",tier:2},{key:"asphalt_plants",name:"Asphalt Plants",tier:2}],wt={LOW:.7,STANDARD:1,HIGH:1.4},kt={LOW:35,STANDARD:65,HIGH:90},Ne=15;let R=null;function ei(i){if(!i)return;const t=i.required_materials||{},e=i.required_equipment||[],a=i.required_workforce||{},n={concrete:18e4,steel:25e4,lumber:12e4,aggregate:8e4,em_systems:32e4,glass_facades:28e4,asphalt:14e4,heavy_parts:4e5},d=Xt.filter(c=>t[c.key]>0).map(c=>({...c,qty:t[c.key],basePrice:n[c.key]||2e5,grade:c.key==="aggregate"?"LOW":"STANDARD",highDisabled:!1})),r=Zt.filter(c=>e.includes(c.key)).map(c=>({...c,owned:(Y||[]).some(p=>p.equipment_key===c.key&&p.quantity>0)})),l=(a.general||100)+(a.skilled||20),o=i.budget_ceiling||1e8,s=Math.round(o*.03);R={contract:i,budgetCeiling:o,materials:d,laborCount:l,laborRate:15200,estimatedTicks:i.timeline_ticks||8,equipment:r,permits:[],overhead:s,markupPct:15,competitors:[],playerRep:m?.standing||50,requiredWorkforce:a},document.getElementById("bid-title").textContent="BID ASSEMBLY",document.getElementById("bid-subtitle").textContent=(i.name||"Contract")+" — "+Ie(i.sector)+" — "+(i.issuer_name||"Government"),document.getElementById("bid-overlay").classList.add("open"),document.body.style.overflow="hidden",Te()}function Et(i){i&&i.target!==document.getElementById("bid-overlay")||(document.getElementById("bid-overlay").classList.remove("open"),document.body.style.overflow="",R=null)}function N(i){return Math.abs(i)>=1e9?"$"+(i/1e9).toFixed(2)+"B":Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(2)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function ti(i,t){if(!R)return;const e=R.materials[i];t==="HIGH"&&e.highDisabled||(e.grade=t,Te())}function ii(i){R&&(R.laborCount=i,Te())}function ni(i){R&&(R.markupPct=Number(i),Te())}function Te(){if(!R)return;const i=R;let t=0;for(const T of i.materials)T.lineCost=Math.round(T.qty*T.basePrice*wt[T.grade]),t+=T.lineCost;const e=Math.round(i.laborCount*i.laborRate*i.estimatedTicks),a=Math.round(i.equipment.filter(T=>T.owned).length*12e3*i.estimatedTicks);let n=0;const d=i.overhead,r=t+e+a+n+d,l=Math.round(r*i.markupPct/100),o=r+l,s=o>i.budgetCeiling,c=l,p=Math.round(i.materials.reduce((T,D)=>T+kt[D.grade],0)/i.materials.length),f=p>=80?"STRONG":p>=60?"PROMISING":p>=40?"UNCERTAIN":"POOR",g=p>=80?"var(--green)":p>=60?"var(--teal)":p>=40?"var(--orange)":"var(--red)",v=i.budgetCeiling>0?o/i.budgetCeiling:1,y=Math.max(0,Math.min(100,Math.round((1-v)*150))),k=y>=70?"STRONG":y>=40?"COMPETITIVE":y>=15?"WEAK":"UNLIKELY",x=y>=70?"var(--green)":y>=40?"var(--teal)":y>=15?"var(--orange)":"var(--red)",w=Math.round(r*(1-Ne/100)),A=Math.round(r*(1+Ne/100));let _="";_+='<div class="bid-section"><div class="bid-section__title">Materials</div>',i.materials.forEach((T,D)=>{const W=de=>{const jt=T.grade===de,Ut=de==="HIGH"&&T.highDisabled;return`<button class="bid-grade-btn ${jt?de==="LOW"?"active-low":de==="HIGH"?"active-high":"active":""} ${Ut?"disabled":""}" onclick="setBidGrade(${D},'${de}')">${de[0]}</button>`};_+=`<div class="bid-mat-row">
            <span class="bid-mat-row__name">${u(T.name)}</span>
            <span class="bid-mat-row__qty">×${T.qty}</span>
            <div class="bid-grade-btns">${W("LOW")}${W("STANDARD")}${W("HIGH")}</div>
            <span class="bid-mat-row__cost">${N(T.lineCost)}</span>
        </div>`}),_+=`<div class="bid-line-total"><span class="bid-line-total__label">MATERIALS TOTAL</span><span class="bid-line-total__value">${N(t)}</span></div></div>`;const S=(i.requiredWorkforce?.general||80)+(i.requiredWorkforce?.skilled||20),M=[Math.round(S*.8),S,Math.round(S*1.2),Math.round(S*1.4),Math.round(S*1.6)];_+='<div class="bid-section"><div class="bid-section__title">Labor</div>',_+='<div class="bid-labor-presets">',M.forEach(T=>{_+=`<button class="bid-labor-btn ${i.laborCount===T?"active":""}" onclick="setBidLabor(${T})">${T}</button>`}),_+="</div>";const C=i.requiredWorkforce||{};_+=`<div class="bid-labor-formula">Required: ${C.general||"?"} general + ${C.skilled||"?"} skilled<br>`,_+=`${i.laborCount} workers × ${N(i.laborRate)}/tick × ${i.estimatedTicks} ticks = <strong>${N(e)}</strong></div>`,_+=`<div class="bid-line-total"><span class="bid-line-total__label">LABOR TOTAL</span><span class="bid-line-total__value">${N(e)}</span></div></div>`,_+='<div class="bid-section"><div class="bid-section__title">Equipment</div>',i.equipment.forEach(T=>{const D=T.owned?"bid-equip-row__status--owned":"bid-equip-row__status--missing",W=T.owned?"✓ OWNED":"✗ NOT OWNED";_+=`<div class="bid-equip-row"><span class="bid-equip-row__name">${u(T.name)}</span><span class="bid-equip-row__status ${D}">${W}</span></div>`}),_+=`<div class="bid-line-total"><span class="bid-line-total__label">MAINTENANCE (${i.estimatedTicks}t)</span><span class="bid-line-total__value">${N(a)}</span></div></div>`,_+='<div class="bid-section"><div class="bid-section__title">Permits</div>',_+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);padding:8px 0;">No permits required yet.</div>',_+='<div class="bid-line-total"><span class="bid-line-total__label">PERMITS TOTAL</span><span class="bid-line-total__value">$0</span></div></div>',_+='<div class="bid-section"><div class="bid-section__title">Overhead &amp; Contingency</div>',_+='<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Site management, insurance, admin</div>',_+=`<div class="bid-line-total"><span class="bid-line-total__label">OVERHEAD</span><span class="bid-line-total__value">${N(d)}</span></div></div>`,document.getElementById("bid-left").innerHTML=_;let I="";I+='<div class="bid-section"><div class="bid-section__title">Cost Summary</div>',I+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Materials</span><span class="bid-summary-row__value">${N(t)}</span></div>`,I+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Labor</span><span class="bid-summary-row__value">${N(e)}</span></div>`,I+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Equipment Maint.</span><span class="bid-summary-row__value">${N(a)}</span></div>`,I+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Permits</span><span class="bid-summary-row__value">${N(n)}</span></div>`,I+=`<div class="bid-summary-row"><span class="bid-summary-row__label">Overhead</span><span class="bid-summary-row__value">${N(d)}</span></div>`,I+=`<div class="bid-cost-total"><span class="bid-cost-total__label">ESTIMATED COST</span><span class="bid-cost-total__value">${N(r)}</span></div>`,I+=`<div class="bid-accuracy">⚠ Estimate accuracy: ±${Ne}%<br>Actual cost range: ${N(w)} — ${N(A)}</div>`,I+="</div>",I+='<div class="bid-section"><div class="bid-section__title">Markup</div>',I+=`<div class="bid-slider-wrap">
        <div class="bid-slider-label"><span class="bid-slider-label__pct">${i.markupPct}%</span><span style="color:var(--text-dim)">${N(l)}</span></div>
        <input type="range" class="bid-slider" min="0" max="40" value="${i.markupPct}" oninput="setBidMarkup(this.value)">
    </div></div>`,I+=`<div class="bid-price-hero ${s?"bid-price-hero--over":""}">
        <div class="bid-price-hero__label">YOUR BID PRICE</div>
        <div class="bid-price-hero__value">${N(o)}</div>
        ${s?'<div class="bid-price-hero__warning">EXCEEDS BUDGET CEILING ('+N(i.budgetCeiling)+")</div>":""}
    </div>`,I+=`<div class="bid-profit"><span class="bid-profit__label">PROJECTED PROFIT</span><span class="bid-profit__value">+${N(c)}</span></div>`,I+=`<div class="bid-compete">
        <div style="display:flex;justify-content:space-between;"><span class="bid-compete__label" style="color:${x}">${k}</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Competitiveness</span></div>
        <div class="bid-compete__bar-wrap"><div class="bid-compete__bar" style="width:${y}%;background:${x}"></div></div>
    </div>`,I+=`<div class="bid-quality">
        <div style="display:flex;justify-content:space-between;"><span class="bid-quality__label" style="color:${g}">${f} (${p}/100)</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Quality Estimate</span></div>
        <div class="bid-quality__bar-wrap"><div class="bid-quality__bar" style="width:${p}%;background:${g}"></div></div>
    </div>`,I+='<div class="bid-section" style="margin-top:8px;"><div class="bid-section__title">Competing Bids</div>',i.competitors.forEach(T=>{I+=`<div class="bid-competitor"><span class="bid-competitor__name">${u(T.name)}</span><span class="bid-competitor__rep">Rep ${T.rep}</span></div>`}),I+=`<div class="bid-competitor" style="color:var(--gold);"><span class="bid-competitor__name">You</span><span class="bid-competitor__rep">Rep ${i.playerRep}</span></div>`,I+="</div>",document.getElementById("bid-right").innerHTML=I,document.getElementById("bid-footer-price").textContent=N(o),document.getElementById("bid-footer-price").style.color=s?"var(--red)":"var(--gold)",document.getElementById("bid-footer-profit").textContent="+"+N(c),document.getElementById("bid-footer-quality").textContent=p+"/100",document.getElementById("bid-footer-quality").style.color=g,document.getElementById("bid-submit-btn").disabled=s}window.openBidModal=ei;window.closeBidModal=Et;window.setBidGrade=ti;window.setBidLabor=ii;window.setBidMarkup=ni;let Be=!1;async function ai(){if(!R||!m||Be)return;const i=R,t=i.contract;let e=0;const a={};for(const p of i.materials)e+=Math.round(p.qty*p.basePrice*wt[p.grade]),a[p.key]=p.grade;const n=Math.round(i.laborCount*i.laborRate*i.estimatedTicks),d=Math.round(i.equipment.filter(p=>p.owned).length*12e3*i.estimatedTicks),r=e+n+d+i.overhead,l=Math.round(r*i.markupPct/100),o=r+l,s=Math.round(i.materials.reduce((p,f)=>p+kt[f.grade],0)/(i.materials.length||1));if(o>i.budgetCeiling){alert("Bid exceeds budget ceiling. Lower your costs or markup.");return}const c=document.getElementById("bid-submit-btn");c.disabled=!0,c.textContent="SUBMITTING...",Be=!0;try{const{data:p}=await $.from("shard").select("current_tick").eq("name","Alpha Shard").single(),f=p?.current_tick||0,{data:g}=await $.from("contract_bids").select("id").eq("contract_id",t.id).eq("faction_id",m.id).maybeSingle();if(g){const{error:y}=await $.from("contract_bids").update({bid_price:o,material_grades:a,labor_count:i.laborCount,markup_pct:i.markupPct,estimated_cost:r,estimated_quality:s,submitted_at_tick:f}).eq("id",g.id);if(y)throw y}else{const{error:y}=await $.from("contract_bids").insert({contract_id:t.id,faction_id:m.id,bid_price:o,material_grades:a,labor_count:i.laborCount,markup_pct:i.markupPct,estimated_cost:r,estimated_quality:s,status:"pending",submitted_at_tick:f});if(y)throw y}Et();const v=document.getElementById("oc-count");if(v){const y=v.textContent;v.textContent="✓ BID SUBMITTED",v.style.color="var(--green)",setTimeout(()=>{v.textContent=y,v.style.color=""},2e3)}await It()}catch(p){console.error("Bid submission failed:",p),alert("Failed to submit bid: "+(p.message||"Unknown error")),c.disabled=!1,c.textContent="SUBMIT BID"}finally{Be=!1}}window.submitBid=ai;const ie=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],pt={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},mt={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let q=null;function si(i){const t=V.find(C=>C.id===i);if(!t)return;const e=Array.isArray(t.contract_bids)?t.contract_bids[0]:t.contract_bids,a=B?.current_tick||0,n=t.awarded_at_tick||a,d=t.timeline_ticks||8,r=Math.max(0,a-n),l=Math.min(100,r/d*100);let o=Math.min(ie.length-1,Math.floor(l/(100/ie.length)));const s=Math.round(l%(100/ie.length)/(100/ie.length)*100),c=t.required_materials||{},p=e?.material_grades||{},f=Object.entries(c).map(([C,I])=>{const T=p[C]||"STANDARD",D=Math.round(I*(l/100)*(.6+Math.random()*.4));return{key:C,name:C.replace(/_/g," ").replace(/\b\w/g,W=>W.toUpperCase()),grade:T,allocated:I,used:Math.min(D,I)}}),v=(t.required_equipment||[]).map(C=>({key:C,name:C.replace(/_/g," ").replace(/\b\w/g,I=>I.toUpperCase()),qty:1+Math.floor(Math.random()*3),condition:55+Math.floor(Math.random()*40)})),y=t.budget_ceiling||0,k=e?.estimated_cost||0,x=Math.round(k*Math.min(1,r/d)),w=e?.estimated_quality||65,A=w>=80?"STRONG":w>=60?"PROMISING":w>=40?"FAIR":"UNCERTAIN",_=t.required_workforce||{},S=(_.general||0)+(_.skilled||0),M=e?.labor_count||S;q={project:t,bid:e,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:a,awardedTick:n,totalTicks:d,ticksElapsed:r,phaseIdx:o,phaseProgress:s,materials:f,equipment:v,budget:y,estCost:k,spent:x,quality:w,qualityLabel:A,laborCount:M,wfNeeded:S,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",Ct(t.id).then(()=>le()),le()}function oi(i){i&&i.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",q=null)}function ri(i){q&&(q.tab=i,q.expandedEvent=-1,q.selectedResponse=null,le())}function li(i){q&&(q.expandedEvent=q.expandedEvent===i?-1:i,q.selectedResponse=null,le())}function di(i){q&&(q.selectedResponse=q.selectedResponse===i?null:i,le())}function le(){if(!q)return;const i=q,t=i.project,e=t.issuer_type==="GOVERNMENT",a=Ie(t.sector),n=m?.nation||"Nation",d=i.awardedTick+i.totalTicks,r=Math.max(0,d-i.currentTick),l=i.currentTick>d,o=i.budget>0?Math.round(i.spent/i.budget*100):0,s=o>85?"var(--red)":o>60?"var(--amber)":"var(--teal)",c=i.budget-i.spent,p=i.events.filter(k=>k.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${u(n.toUpperCase())}</span>
                <span class="pm-hdr__name">${u(t.name)}</span>
                <span style="color:var(--text-dim);font-size:12px">—</span>
                <span class="pm-hdr__issuer">${u(t.issuer_name||"—")}</span>
                <span class="pm-hdr__type">${e?"GOV":"PVT"}</span>
            </div>
            <button class="pm-hdr__close" onclick="closeProjectModal()">×</button>
        </div>
        <div class="pm-hdr__row2">
            <span class="pm-hdr__id">${u(t.template_key||t.id)}</span>
            <span class="pm-hdr__badge pm-hdr__badge--spec">${u(a.toUpperCase())}</span>
            <span class="pm-hdr__badge pm-hdr__badge--sub">${u((t.sector||"").replace(/_/g," ").toUpperCase())}</span>
        </div>
    `;let f='<div class="pm-phase__bar">';for(let k=0;k<ie.length;k++){const x=k<i.phaseIdx,w=k===i.phaseIdx;f+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${x?"done":w?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${x?"done":w?"active":""}">${ie[k]}</span>
        </div>`}f+="</div>",f+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${ie[i.phaseIdx]} — ${i.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${l?"var(--red)":"var(--text-secondary)"}">Tick ${i.ticksElapsed} / ${i.totalTicks}${l?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=f;const g=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:p},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=g.map(k=>`<button class="pm-tab${i.tab===k.id?" active":""}" onclick="pmSetTab('${k.id}')">
            ${k.label}${k.badge>0?`<span class="pm-tab__badge">${k.badge}</span>`:""}
        </button>`).join("");let v="";i.tab==="overview"?v=ci(i,t,s,o,c,r,l):i.tab==="events"?v=pi(i):i.tab==="materials"?v=mi(i):i.tab==="equipment"&&(v=fi(i)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${v}</div>`;let y="";p>0&&(y+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${p} EVENT${p>1?"S":""} REQUIRES RESPONSE</span>`),y+=`<span class="pm-ftr__badge" style="color:${i.quality>=70?"var(--green)":i.quality>=50?"var(--amber)":"var(--orange)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${i.quality}/100 — ${i.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${y}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function ci(i,t,e,a,n,d,r){const l=ze(i.awardedTick+i.totalTicks);ze(i.awardedTick+i.totalTicks);const o=ze(i.awardedTick),s=[{label:"Budget",value:F(i.budget),sub:`${a}% spent`,color:e},{label:"Spent",value:F(i.spent),color:"var(--red)"},{label:"Remaining",value:F(n),color:"var(--green)"},{label:"Quality",value:`${i.quality}/100`,sub:i.qualityLabel,color:i.quality>=70?"var(--green)":i.quality>=50?"var(--amber)":"var(--red)"},{label:"Workforce",value:`${i.laborCount}/${i.wfNeeded}`,sub:`Bid: ${i.laborCount}`,color:i.laborCount<i.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${d} ticks`,sub:r?"OVERDUE":`Deadline: ${l}`,color:r?"var(--red)":"var(--text-bright)"}];let c="";c+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${u(t.description||t.name)}</div>
    </div></div>`,c+='<div class="pm-metrics">';for(const f of s)c+=`<div class="pm-metric">
            <div class="pm-metric__label">${f.label}</div>
            <div class="pm-metric__value" style="color:${f.color}">${f.value}</div>
            ${f.sub?`<div class="pm-metric__sub">${u(f.sub)}</div>`:""}
        </div>`;c+="</div>",c+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${o}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${r?"var(--red)":"var(--text-bright)"};font-weight:700">${l}</span></span>
        </div>
    </div></div>`;const p=[];if((t.sector==="civil_engineering"||t.sector==="industrial"||t.sector==="mega_project")&&(p.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),p.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),t.sector!=="civil_engineering"&&p.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),p.length>0){c+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const f of p)c+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${u(f.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;c+="</div></div>"}return c}function pi(i){if(i.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let t="";for(let e=0;e<i.events.length;e++){const a=i.events[e],n=i.expandedEvent===e,d=a.status==="ACTIVE",r=pt[a.type]||pt.WEATHER,l=mt[a.severity]||mt.LOW;if(t+=`<div class="pm-evt ${d?"pm-evt--active":"pm-evt--resolved"}" style="${d?`border-left-color:${r.color}`:""}">`,t+=`<div class="pm-evt__header" onclick="pmToggleEvent(${e})" style="${n?`background:${r.bg}`:""}">`,t+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${r.color};background:${r.bg};border:1px solid ${r.border}">${a.type}</span>
            <span class="pm-evt__sev-badge" style="color:${l}">${a.severity}</span>
            <span class="pm-evt__status" style="color:${d?"var(--red)":"var(--text-dim)"};font-weight:${d?"700":"400"}">${d?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,t+=`<div class="pm-evt__title">${u(a.title)}</div>`,t+=`<div class="pm-evt__meta">Tick ${a.tick} · ${u(a.id||"")}</div>`,n){if(t+='<div class="pm-evt__body">',t+=`<div class="pm-evt__desc">${u(a.desc)}</div>`,a.impact&&(t+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${u(a.impact)}</span>
                </div>`),d&&a.responses&&a.responses.length>0){t+='<div class="pm-evt__resp-title">Response Options</div>';for(let o=0;o<a.responses.length;o++){const s=a.responses[o],c=i.selectedResponse===o,f={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[s.tag]||"var(--text-secondary)";t+=`<div class="pm-resp${c?" selected":""}" style="${c?`border-color:${f}`:""}" onclick="event.stopPropagation();pmSelectResponse(${o})">`,t+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${u(s.label)}</span>
                            <span class="pm-resp__tag" style="color:${f};background:${f}12;border:1px solid ${f}25">${s.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${s.delay>0?"var(--orange)":"var(--green)"}">
                            ${s.delay>0?`+${s.delay} tick${s.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,t+=`<div class="pm-resp__detail">${u(s.detail)}</div>`,t+='<div class="pm-resp__costs">',s.cost&&(t+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${F(s.cost)}</span>`),s.qualityImpact&&s.qualityImpact!==0&&(t+=`<span class="pm-resp__cost" style="color:${s.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${s.qualityImpact>0?"+":""}${s.qualityImpact}</span>`),!s.cost&&(!s.qualityImpact||s.qualityImpact===0)&&(t+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),t+="</div>",c&&(t+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${f}" onclick="event.stopPropagation();confirmEventResponse('${a.id}','${s.key}')">CONFIRM</button>
                        </div>`),t+="</div>"}}!d&&a.resolution&&(t+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${u(a.resolution)}</div>
                </div>`),t+="</div>"}t+="</div></div>"}return t}function mi(i){if(i.materials.length===0)return'<div class="pm-evt-empty">No materials allocated to this project.</div>';let t='<div class="pm-tab-header">Allocated Materials</div>';for(const e of i.materials){const a=e.allocated>0?Math.round(e.used/e.allocated*100):0,n=e.grade==="HIGH"?"high":e.grade==="LOW"?"low":"std",d=e.grade==="HIGH"?"var(--green)":e.grade==="LOW"?"var(--orange)":"var(--amber)";t+=`<div class="pm-mat">
            <div class="pm-mat__row1">
                <div class="pm-mat__left">
                    <span class="pm-mat__name">${u(e.name)}</span>
                    <div class="pm-mat__grade-dot pm-mat__grade-dot--${n}"></div>
                    <span class="pm-mat__grade" style="color:${d}">${e.grade}</span>
                </div>
                <span class="pm-mat__qty">${e.used.toLocaleString()} / ${e.allocated.toLocaleString()}</span>
            </div>
            <div class="pm-mat__bar-row">
                <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${a}%"></div></div>
                <span class="pm-mat__pct">${a}% consumed</span>
            </div>
        </div>`}return t}function fi(i){if(i.equipment.length===0)return'<div class="pm-evt-empty">No equipment deployed to this project.</div>';let t='<div class="pm-tab-header">Deployed Equipment</div>';for(const e of i.equipment){const a=e.condition>=75?"var(--green)":e.condition>=50?"var(--amber)":e.condition>=25?"var(--orange)":"var(--red)",n=e.condition<60;t+=`<div class="pm-eq">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${u(e.name)}</span>
                    <span class="pm-eq__qty">×${e.qty}</span>
                    ${n?'<span class="pm-eq__wear">WEAR</span>':""}
                </div>
            </div>
            <div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${e.condition}%;background:${a}"></div></div>
                <span class="pm-eq__cond-val" style="color:${a}">${e.condition}%</span>
            </div>
        </div>`}return t}function ze(i){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][i%12]}, ${2e3+Math.floor(i/12)}`}window.openProjectModal=si;window.closeProjectModal=oi;window.pmSetTab=ri;window.pmToggleEvent=li;window.pmSelectResponse=di;async function Ct(i){if(!q)return;const{data:t,error:e}=await $.from("construction_events").select("*").eq("contract_id",i).order("fired_at_tick",{ascending:!1});e?(console.warn("Failed to load project events:",e.message),q.events=[]):q.events=(t||[]).map(a=>({id:a.id,type:a.type,severity:a.severity,tick:a.fired_at_tick,title:a.title,desc:a.description,impact:a.impact,status:a.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:a.resolution,responses:a.responses||[]})),le()}let Pe=!1;async function ui(i,t){if(!(Pe||!q)){Pe=!0;try{const{data:e,error:a}=await $.rpc("resolve_construction_event",{p_event_id:i,p_response_key:t});if(a){console.error("Failed to resolve event:",a.message),alert("Failed to submit response: "+a.message);return}const n=typeof e=="string"?JSON.parse(e):e;if(n?.error){alert("Error: "+n.error);return}await Ct(q.project.id),await Tt(),n?.quality_applied&&n.quality_applied!==0&&(q.quality=Math.max(0,Math.min(100,q.quality+n.quality_applied)),q.qualityLabel=q.quality>=80?"STRONG":q.quality>=60?"PROMISING":q.quality>=40?"FAIR":"UNCERTAIN"),le()}finally{Pe=!1}}}window.confirmEventResponse=ui;function ee(i,t,e){const a=e?` style="color:${e}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${u(i)}</span>
        <span class="cd-detail-row__value"${a}>${u(t)}</span>
    </div>`}function vi(i){const t={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},e=i.drawing_number||i.contract_number+"-A1",a=B?.current_date||"",n=a?a.replace(/,\s*/," "):"",d=i.spec_category==="Heavy Infrastructure",r=i.spec_category==="Megaproject";let l=u(i.project_subtype||i.project_type||"STRUCTURE"),o=d?"80.0m":r?"200.0m":"60.0m",s=d?"40.0m":r?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${t.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(c,p)=>`<line x1="${p*20}" y1="0" x2="${p*20}" y2="200" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(c,p)=>`<line x1="0" y1="${p*20}" x2="680" y2="${p*20}" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${t.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${t.accent}" font-family="var(--font-mono)" font-weight="700">${l.toUpperCase()}</text>
        <text x="340" y="100" text-anchor="middle" font-size="6" fill="${t.text}" font-family="var(--font-mono)">${u(i.name)}</text>

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
        <text x="540" y="175" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">${u(e)}</text>
        <text x="500" y="185" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">SCALE</text>
        <text x="540" y="185" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">1:200</text>
        <text x="610" y="175" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">REV</text>
        <text x="630" y="175" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">01</text>
        <text x="610" y="185" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">DATE</text>
        <text x="630" y="185" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">${u(n)}</text>

        <!-- North arrow -->
        <g transform="translate(470,172)">
            <line x1="0" y1="12" x2="0" y2="0" stroke="${t.accent}" stroke-width="0.8"/>
            <polygon points="-3,4 0,0 3,4" fill="${t.accent}"/>
            <text x="0" y="-3" text-anchor="middle" font-size="5" fill="${t.text}" font-family="var(--font-mono)">N</text>
        </g>
    </svg>`}let Oe=!1;async function yi(){if(Oe||!ke||!m)return;if((m.action_points??0)<2){alert("You need at least 2 AP to place a bid.");return}Oe=!0;const i=document.querySelector(".cd-btn.primary");i&&(i.disabled=!0,i.textContent="...");try{const{data:t,error:e}=await $.rpc("deduct_ap",{p_faction_id:m.id,p_cost:2});if(e)throw e;if(t<0){const n=-t-1;m.action_points=n,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+n+" AP</span>",i&&(i.disabled=!1,i.textContent="BID"),alert("Insufficient AP. You have "+n+" AP, need 2.");return}const{error:a}=await $.from("corp_contract_bids").insert({contract_id:ke.id,faction_id:m.id,nation_id:m.nation_id,ap_spent:2,created_at_tick:B?.current_tick||null});if(a)throw await $.rpc("deduct_ap",{p_faction_id:m.id,p_cost:-2}),m.action_points=t+2,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+(t+2)+" AP</span>",a;m.action_points=t,document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+t+" AP</span>",i&&(i.textContent="BID PLACED")}catch(t){i&&(i.disabled=!1,i.textContent="BID"),t.code==="23505"?alert("You have already placed a bid on this contract."):alert("Failed to place bid: "+(t.message||"Unknown error"))}finally{Oe=!1}}async function It(){if(!m||!m.nation_id)return;const{data:i,error:t}=await $.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(t?(console.warn("Failed to load contracts:",t.message),ce=[]):ce=i||[],ge={},m&&ce.length>0){const e=ce.map(n=>n.id),{data:a}=await $.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",m.id).in("contract_id",e);for(const n of a||[])ge[n.contract_id]=n}xt()}function gi(){const i=document.getElementById("ap-list"),t=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=V.length+" ACTIVE",V.length===0){i.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,t.style.display="none";return}const e=B?.current_tick||0;let a=0,n=0,d="";for(const r of V){const l=r.issuer_type==="GOVERNMENT",o=l?"gov":"private",s=Array.isArray(r.contract_bids)?r.contract_bids[0]:r.contract_bids,c=s?.bid_price||0,p=s?.estimated_cost||0,f=s?.estimated_quality||0,g=r.budget_ceiling||0,v=r.awarded_at_tick||e,y=v+(r.timeline_ticks||8),k=Math.max(0,y-e),x=Math.max(0,e-v),w=r.timeline_ticks||8,A=Math.min(100,Math.round(x/w*100)),_=e>y;_t(r.sector);const S=Ie(r.sector);a+=g,n+=c,d+=`<div class="ap-item" onclick="openProjectModal('${r.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${u(r.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${u(r.issuer_name||"—")} · ${S}</div>
                </div>
                <span class="oc-item__type-badge ${o}">${l?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS</span>
                    <span class="ap-budget__values" style="color:${_?"var(--red)":"var(--teal)"}">
                        ${x}/${w} ticks ${_?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${A}%;background:${_?"var(--red)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${F(c)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${F(p)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${f>=70?"var(--green)":f>=40?"var(--teal)":"var(--orange)"}">${f}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${_?"var(--red)":"var(--text-bright)"}">${k} ticks</div>
                </div>
            </div>
        </div>`}i.innerHTML=d,t.style.display=V.length>0?"":"none",V.length>0&&(document.getElementById("ap-total-crew").textContent=V.length,document.getElementById("ap-total-budget").textContent=F(a),document.getElementById("ap-total-spent").textContent=F(n))}async function Tt(){if(!m)return;const{data:i,error:t}=await $.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",m.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",m.id).order("awarded_at_tick",{ascending:!0});t?(console.warn("Failed to load active projects:",t.message),V=[]):V=i||[],gi()}const Mt=3e4;function St(){let i=0,t=0;for(const e of Z)for(const a of it){const n=O[e.key]?.[a];n&&(i+=n.qty,t+=n.value)}return{totalUnits:i,totalValue:t}}function nt(){const i=document.getElementById("wh-list"),{totalUnits:t,totalValue:e}=St();document.getElementById("wh-count").textContent=t.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=L(e);const a=Math.round(t/Mt*100),n=document.getElementById("wh-capacity");n.textContent=a+"%",n.style.color=a>80?"var(--red)":a>50?"var(--orange)":"var(--green)";let d="";for(let r=0;r<Z.length;r++){const l=Z[r],o=Ye===r,s=O[l.key]?.LOW||{qty:0,value:0},c=O[l.key]?.STD||{qty:0,value:0},p=O[l.key]?.HIGH||{qty:0,value:0},f=s.qty+c.qty+p.qty,g=s.value+c.value+p.value,v=f===0,y=se(l.key,"LOW",b),k=se(l.key,"STD",b),x=se(l.key,"HIGH",b),w=s.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",A=c.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",_=x.available?p.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(d+='<div class="wh-row">',d+=`<div class="wh-row__collapsed${o?" expanded":""}" onclick="toggleWhRow(${r})">
            <span class="wh-row__arrow">${o?"▾":"▸"}</span>
            <span class="wh-row__name${v?" empty":""}">${u(l.name)}</span>
            <div class="wh-row__dots">
                <div class="${w}"></div>
                <div class="${A}"></div>
                <div class="${_}"></div>
            </div>
            <span class="wh-row__qty${v?" empty":""}">${f>0?f.toLocaleString():"—"}</span>
            <span class="wh-row__val${v?" empty":""}">${g>0?L(g):"—"}</span>
        </div>`,o){d+='<div class="wh-expand">',d+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const S=[{key:"LOW",label:"Low",data:s,avail:y,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:c,avail:k,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:p,avail:x,color:"var(--green)",dotClass:"wh-dot--high"}];for(const M of S){const C=!M.avail.available,I=M.data.qty>0,T=I?"$"+Math.round(M.data.value/M.data.qty):"—";d+=`<div class="wh-grade${C?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${M.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${C?"var(--red)":M.color}">${M.label}</span>
                        ${C?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${I?"var(--text-bright)":"var(--text-dim)"}">${I?M.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${M.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${M.data.value>0?L(M.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${T}</span>
                </div>`}for(const M of S)!M.avail.available&&M.avail.failedStat&&(d+=`<div class="wh-lock">
                        <span class="wh-lock__text">${M.label.toUpperCase()} GRADE LOCKED — ${u(M.avail.failedStat)} &lt; ${M.avail.failedMin}</span>
                    </div>`);d+="</div>"}d+="</div>"}i.innerHTML=d}function _i(i){Ye=Ye===i?-1:i,nt()}async function bi(){if(!m)return;const{data:i,error:t}=await $.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",m.id);if(O={},t)console.warn("Failed to load warehouse:",t.message);else if(i)for(const e of i)O[e.material_key]||(O[e.material_key]={}),O[e.material_key][e.quality_tier]={qty:e.quantity||0,value:Number(e.total_value)||0};nt()}const xi={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function At(){const i=(b?.name||m?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+i;const t=Number(m?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=L(t);const{totalUnits:e}=St(),a=Math.round(e/Mt*100),n=document.getElementById("pr-wh-capacity");n.textContent=a+"%",n.style.color=a>80?"var(--red)":a>50?"var(--orange)":"var(--green)",qt(),at(),Me()}function qt(){const i=document.getElementById("pr-mat-grid");let t="";for(const e of Z){const a=z===e.key,n=it.every(r=>!se(e.key,r,b).available),d="pr-mat-btn"+(a?" active":"")+(n?" all-locked":"");t+=`<span class="${d}" onclick="setPrMat('${e.key}')">${u(e.name)}</span>`}i.innerHTML=t}function at(){const i=document.getElementById("pr-tier-bar");let t='<span class="pr-tier-label">GRADE</span>';for(const e of it){const a=se(z,e,b),n=P===e,d=a.available?tt(z,e,b):null,r=yt[e],l=!a.available,o="pr-tier-btn"+(n?" active":"")+(l?" locked":"");t+=`<div class="${o}" onclick="${l?"":`setPrTier('${e}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${r};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${n?"var(--text-bright)":"var(--text-dim)"}">${Ve[e]}</span>
            </div>
            ${d!==null?`<div class="pr-tier-btn__price" style="color:${n?"var(--text-bright)":"var(--text-muted)"}">$${d}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}i.innerHTML=t}function Me(){const i=document.getElementById("pr-content"),t=se(z,P,b),e=Z.find(x=>x.key===z);if(!e)return;if(!t.available){i.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${u(e.name)} — ${Ve[P]} grade
                    is not produced domestically in ${u(b?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${u(t.failedStat||"unknown")} &lt; ${t.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const a=tt(z,P,b),n=gt(z,P,b),d=a*oe,r=n>3e3?"LOW":n>1e3?"MODERATE":"HIGH",l=r==="LOW"?"var(--green)":r==="MODERATE"?"var(--amber)":"var(--red)",o=Number(b?.inflation??50),s=o>55?"up":o<45?"down":"flat",c=s==="up"?"&#9650;":s==="down"?"&#9660;":"&#8212;",p=s==="up"?"var(--red)":s==="down"?"var(--green)":"var(--text-dim)";let f="";f+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${a}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${p}">${c}</span>
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
    </div>`,f+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${u(b?.name||"—")})</div>`;for(const x of e.priceDrivers){const w=Number(b?.[x]??50),A=w>=50?"var(--green)":w>=30?"var(--amber)":w>=15?"var(--orange)":"var(--red)",_=xi[x]||x;f+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${u(x)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${w}%;background:${A}"></div>
            </div>
            <span class="pr-driver-row__val">${w}</span>
            <span class="pr-driver-row__effect">${u(_)}</span>
        </div>`}f+="</div>";const v=(Number(m?.corp_cash_reserves)||0)>=d,y=oe>n,k=yt[P];f+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${u(e.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${k};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${k}">${Ve[P]}</span>
                </div>
                <span class="pr-order__mat-price">$${a}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(x=>`<span class="pr-qty-btn${oe===x?" active":""}" onclick="setPrQty(${x})">${x>=1e3?x/1e3+"k":x}</span>`).join("")}
                </div>
            </div>
            ${y?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${n.toLocaleString()} this tick</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${L(d)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${v&&!y?"":"disabled"}
                    title="${v?y?"Exceeds supply":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,i.innerHTML=f}function $i(i){z=i,P="STD";for(const t of["STD","HIGH","LOW"])if(se(i,t,b).available){P=t;break}qt(),at(),Me()}function hi(i){P=i,at(),Me()}function wi(i){oe=i,Me()}let Re=!1;async function ki(){if(Re||!m||!b)return;const i=tt(z,P,b),t=gt(z,P,b),e=i*oe,a=Number(m.corp_cash_reserves)||0;if(e>a){alert("Insufficient cash reserves.");return}if(oe>t){alert("Exceeds available supply this tick.");return}Re=!0;const n=document.querySelector(".pr-purchase-btn");n&&(n.disabled=!0,n.textContent="...");try{const d=a-e,{error:r}=await $.from("factions").update({corp_cash_reserves:d}).eq("id",m.id);if(r)throw r;const l=O[z]?.[P],o=(l?.qty||0)+oe,s=(l?.value||0)+e,{error:c}=await $.from("corp_warehouse").upsert({faction_id:m.id,nation_id:m.nation_id,material_key:z,quality_tier:P,quantity:o,total_value:s,last_purchased_tick:B?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(c){const{error:p}=await $.from("factions").update({corp_cash_reserves:a}).eq("id",m.id);throw p&&console.error("Cash refund failed after warehouse error:",p.message),c}m.corp_cash_reserves=d,O[z]||(O[z]={}),O[z][P]={qty:o,value:s},nt(),At(),n&&(n.textContent="PURCHASED",setTimeout(()=>{n.isConnected&&(n.disabled=!1,n.textContent="PURCHASE")},1500))}catch(d){n&&(n.disabled=!1,n.textContent="PURCHASE"),alert("Purchase failed: "+(d.message||"Unknown error"))}finally{Re=!1}}function Lt(i){const t=re||b;if(!t)return[];const e=Ce(i);if(!e)return[];const a=Wt(i,t),n=[],d=Number(t?.inflation??50),r=Number(t?.fuel_prices??50);Number(t?.manufacturing_output??50);const l=re&&b&&re.id!==b.id;let o=null;if(l&&(o=Vt(t,b)),a.newAvailable>0){const s=ct(i,t),c=e.basePrice,p=Math.round(c*((d-50)/200)),f=Math.round(c*((r-50)/300));let g=s;const v=[{label:"Base price",value:L(c)},p!==0?{label:`Inflation (${d})`,mod:(p>=0?"+":"")+L(Math.abs(p))}:null,f!==0?{label:`Fuel transport (${r})`,mod:(f>=0?"+":"")+L(Math.abs(f))}:null].filter(Boolean),y=s-c-p-f;if(y!==0&&!l&&v.push({label:"Demand/scarcity",mod:(y>=0?"+":"")+L(Math.abs(y))}),l&&o){const k=Math.round(s*o.tariff),x=Math.round(s*o.transport);g=s+k+x,v.push({label:`Import tariff (${Math.round(o.tariff*100)}%)`,mod:"+"+L(k)}),v.push({label:`Transport (${o.deliveryTicks} tick${o.deliveryTicks>1?"s":""})`,mod:"+"+L(x)})}n.push({seller:l?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:l?o?.deliveryTicks||1:0,condition:100,price:Math.round(g),available:a.newAvailable,delivery:l?o.deliveryTicks+" tick"+(o.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:l?o.deliveryTicks:0,used:!1,priceFactors:v,sourceNationId:t.id})}if(a.usedAvailable>0){const s=a.usedCondition,c=ct(i,t,{used:!0,condition:s});let p=c;const f=[{label:"Base price",value:L(e.basePrice)},{label:`Condition (${s}%)`,mod:"-"+L(Math.max(0,e.basePrice-c))}];if(l&&o){const g=Math.round(c*o.tariff),v=Math.round(c*o.transport);p=c+g+v,f.push({label:`Import tariff (${Math.round(o.tariff*100)}%)`,mod:"+"+L(g)}),f.push({label:`Transport (${o.deliveryTicks} tick${o.deliveryTicks>1?"s":""})`,mod:"+"+L(v)})}n.push({seller:l?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:l?o?.deliveryTicks||1:0,condition:s,price:Math.round(p),available:a.usedAvailable,delivery:l?o.deliveryTicks+" tick"+(o.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:l?o.deliveryTicks:0,used:!0,priceFactors:f,sourceNationId:t.id})}return n}function Se(){const i=Number(m?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=L(i);const t=Ce(G),e=_e[t?.tier||1],a=document.getElementById("em-tier-badge");a&&(a.textContent=e.tag,a.style.color=e.color),a.style.background=e.color+"0a",a.style.border="1px solid "+e.color+"33";const n=document.getElementById("em-nation-select");if(n&&n.options.length===0){const l=b?.name||m?.nation||"—";let o=`<option value="">${u(l)} (HQ)</option>`;for(const s of we)s.id!==b?.id&&(o+=`<option value="${s.id}">${u(s.name)}</option>`);n.innerHTML=o}const d=document.getElementById("em-import-tag"),r=re&&b&&re.id!==b.id;d&&(d.style.display=r?"":"none"),Ei(),st()}function Ei(){let i="";for(let t=1;t<=3;t++){const e=_e[t],a=We(t),n=t===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";i+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${e.color}">${e.tag}</div>
            <div class="${n}">`;for(const d of a){const r=G===d.key,l=Lt(d.key).length>0;i+=`<span class="em-selector__btn${r?" active":""}${l?"":" no-listings"}"
                style="${r?"background:"+e.color+";border-color:"+e.color:""}"
                onclick="setEmType('${d.key}')">${u(d.name)}</span>`}i+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${i}</div>`}function st(){const i=document.getElementById("em-content");if(te=Lt(G),te.length===0){i.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}K>=te.length&&(K=0);let t="";for(let a=0;a<te.length;a++){const n=te[a],d=K===a,r=n.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",l=vt(n.condition);t+=`<div class="em-listing${d?" selected":""}" style="${d?"border-left-color:"+r:""}" onclick="setEmListing(${a})">`,t+=`<div class="em-listing__row1">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="em-listing__seller">${u(n.seller)}</span>
                <span class="em-badge em-badge--${n.sellerType.toLowerCase()}">${n.sellerType}</span>
                ${n.used?'<span class="em-badge em-badge--used">USED</span>':""}
            </div>
        </div>`,t+=`<div class="em-listing__row2">
            <span class="em-listing__nation">${u((n.nation||"").toUpperCase())}</span>
            ${n.distance>0?`<span class="em-listing__distance">${n.distance} nation${n.distance>1?"s":""} away</span>`:""}
            <span class="em-listing__delivery">Delivery: ${u(n.delivery)}</span>
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
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${L(n.price)}</div>
            </div>
        </div>`,d&&n.priceFactors&&(t+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${n.priceFactors.map(o=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${u(o.label)}</span>
                    <span class="em-breakdown__mod" style="color:${o.mod?o.mod.startsWith("-")?"var(--green)":o.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${o.mod||o.value}</span>
                </div>`).join("")}
            </div>`),t+="</div>"}const e=te[K];if(e){const a=Ce(G),n=_e[a?.tier||1],d=Math.min(e.available,4),r=e.price*J,l=(Number(m?.corp_cash_reserves)||0)>=r;t+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${u(a?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${u(e.seller)}</span>
                </div>
                <span class="em-purchase__price">${L(e.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:d},(o,s)=>s+1).map(o=>`<span class="em-qty-btn${J===o?" active":""}" style="${J===o?"background:"+n.color+";border-color:"+n.color:""}" onclick="setEmQty(${o})">${o}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${e.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${L(r)}</div>
                    ${e.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${u(e.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${n.color}" onclick="purchaseEquipment()"
                    ${l?"":"disabled"}
                    title="${l?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}i.innerHTML=t}async function Ci(i){if(!i)re=null;else{let e=we.find(a=>a.id===i);if(!e)try{const{data:a}=await $.from("nations").select("*").eq("id",i).single();e=a}catch{}re=e||null}K=0,J=1;const t=document.getElementById("em-nation-select");t&&(t.value=i||""),Se()}function Ii(i){G=i,K=0,J=1,Se()}function Ti(i){K=i,J=1,st()}function Mi(i){J=i,st()}let De=!1;async function Si(){if(De)return;const i=te[K];if(!i||!m)return;const t=Ce(G);if(!t)return;const e=J,a=i.price*e,n=Number(m.corp_cash_reserves)||0;if(a>n){alert("Insufficient cash reserves.");return}if(e>i.available){alert("Not enough units available.");return}const d=document.querySelector(".em-purchase-btn");d&&(d.disabled=!0,d.textContent="..."),De=!0;try{const r=n-a,{error:l}=await $.from("factions").update({corp_cash_reserves:r}).eq("id",m.id);if(l)throw l;const o=!i.deliveryTicks||i.deliveryTicks===0;if(o){const c=Y.find(A=>A.equipment_key===G),p=(c?.owned||0)+e,f=c?.purchase_price_avg||0,g=c?.owned||0,v=g>0?Math.round((f*g+i.price*e)/p):i.price,y=t.maintenancePerUnit*p,k=c?.condition||100,x=Math.round((k*g+i.condition*e)/p),{error:w}=await $.from("corp_equipment").upsert({faction_id:m.id,nation_id:m.nation_id,equipment_key:G,tier:t.tier,owned:p,deployed:c?.deployed||0,condition:x,maintenance_per_tick:y,purchase_price_avg:v,last_purchased_tick:B?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(w){const{error:A}=await $.from("factions").update({corp_cash_reserves:n}).eq("id",m.id);throw A&&console.error("Cash refund failed:",A.message),w}c?(c.owned=p,c.condition=x,c.maintenance_per_tick=y):Y.push({equipment_key:G,tier:t.tier,owned:p,deployed:0,condition:x,maintenance_per_tick:y,assigned_projects:[]})}else{const c=(B?.current_tick||0)+i.deliveryTicks,{error:p}=await $.from("corp_equipment_deliveries").insert({faction_id:m.id,equipment_key:G,quantity:e,condition:i.condition,delivery_tick:c,source_nation_id:i.sourceNationId||null,seller_name:i.seller,price_paid:a});if(p){const{error:f}=await $.from("factions").update({corp_cash_reserves:n}).eq("id",m.id);throw f&&console.error("Cash refund failed:",f.message),p}}m.corp_cash_reserves=r,ot(),Se();const s=document.getElementById("pr-cash");s&&(s.textContent=L(r)),d&&(d.textContent=o?"PURCHASED":"ORDERED",setTimeout(()=>{d.isConnected&&(d.disabled=!1,d.textContent="PURCHASE")},1500))}catch(r){d&&(d.disabled=!1,d.textContent="PURCHASE"),alert("Purchase failed: "+(r.message||"Unknown error"))}finally{De=!1}}let Ai=-1,ve=[],Ze=[],Nt=[];function He(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(1)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function qi(i,t,e){if(e)return"var(--orange)";const a=i/(t||1)*100;return a>50?"var(--green)":a>25?"var(--amber)":"var(--red)"}function Li(){const i=document.getElementById("pm-list"),t=ve.length,e=Ze.length,a=Nt.length,n=ve.filter(o=>o.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${t})`,document.getElementById("pm-pending-count").textContent=`(${e})`,document.getElementById("pm-apply-count").textContent=`(${a})`;const d=document.getElementById("pm-badges");let r="";n>0&&(r+=`<span class="pm-badge pm-badge--expiring">${n} EXPIRING</span>`),e>0&&(r+=`<span class="pm-badge pm-badge--pending">${e} PENDING</span>`),d.innerHTML=r;const l=ve.reduce((o,s)=>o+(s.cost||0),0)+Ze.reduce((o,s)=>o+(s.cost||0),0);document.getElementById("pm-total-cost").textContent=He(l),document.getElementById("pm-footer-active").textContent=t,document.getElementById("pm-footer-pending").textContent=e;{if(t===0){i.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let o="";ve.forEach((s,c)=>{const p=Ai===c,f=qi(s.ticks_left,s.total_ticks,s.expiring_soon),g=Math.min(s.ticks_left/(s.total_ticks||1)*100,100);o+=`<div class="pm-item ${s.expiring_soon?"pm-item--expiring":""} ${p?"expanded":""}" onclick="togglePmExpand(${c})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${u(s.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${u((s.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${f}">Expires: ${u(s.expires||"")}</span>
                        <span class="pm-item__ticks">(${s.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${g}%;background:${f}"></div></div>`,p&&(o+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${u(s.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${u(s.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${He(s.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${s.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${s.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(s.projects||[]).map(v=>`<span class="pm-project-chip">${u(v)}</span>`).join("")}</div>
                    </div>`,s.note&&(o+=`<div class="pm-note"><span class="pm-note__text">${u(s.note)}</span></div>`),s.expiring_soon&&s.renewable&&(o+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew">RENEW — ${He(s.cost||0)}</button></div>`),o+="</div>"),o+="</div></div>"}),i.innerHTML=o;return}}function Ni(){ve=[],Ze=[],Nt=[],Li()}let ne=[],Bi=-1;function Q(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(2)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function ft(i){return i>=85?"var(--gold)":i>=60?"var(--green)":i>=40?"var(--orange)":"var(--red)"}function zi(i){return"dl-result--"+i.toLowerCase()}function ut(){const i=document.getElementById("dl-list"),t=ne.length;document.getElementById("dl-count").textContent=`${t} COMPLETED`;const e=ne.reduce((l,o)=>{const s=o.financials||{};return l+((s.payment||0)+(s.bonus||0)-(s.penalty||0)-(s.total_cost||0))},0),a=document.getElementById("dl-lifetime-profit");a.textContent=(e>=0?"+":"")+Q(e),a.style.color=e>=0?"var(--green)":"var(--red)";const n={};ne.forEach(l=>{n[l.result]=(n[l.result]||0)+1});const d=document.getElementById("dl-footer-results");if(d.innerHTML=Object.entries(n).map(([l,o])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[l]||"var(--text-dim)"}">${u(l)}</div>
            <div class="dl-footer__result-count">${o}</div>
        </div>`).join(""),t===0){i.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let r="";ne.forEach((l,o)=>{const s=Bi===o,c=l.financials||{},p=(c.payment||0)+(c.bonus||0)-(c.penalty||0)-(c.total_cost||0),f=p>=0,g=zi(l.result),y={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[l.result]||"var(--text-dim)",k=l.type==="GOVERNMENT";if(r+=`<div class="dl-item ${s?"expanded":""}" onclick="toggleDlExpand(${o})">
            <div class="dl-item__inner" style="border-left:2px solid ${y}">
                <div class="dl-item__row1">
                    <span class="dl-item__name">${u(l.name)}</span>
                    <span class="dl-result-badge ${g}">${u(l.result)}</span>
                </div>
                <div class="dl-item__row2">
                    <span class="dl-item__id">${u(l.id)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                    <span class="dl-item__issuer" style="color:${k?"var(--green)":"var(--gold)"}">${u(l.issuer)}</span>
                    <span class="dl-item__date">${u(l.delivered)}</span>
                </div>
                <div class="dl-summary-bar">
                    <div class="dl-summary-cell" style="flex:1;">
                        <div class="dl-summary-label">QUALITY</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span class="dl-summary-value" style="color:${ft(l.quality_score)}">${l.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${l.rep_change>0?"var(--green)":l.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${l.rep_change>0?"+":""}${l.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${f?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${f?"var(--green)":"var(--red)"};margin-top:2px;">${f?"+":""}${Q(p)}</div>
                    </div>
                </div>`,s){const x=l.inspection||{};r+='<div style="margin-top:8px;">',r+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(S=>{const M=x[S]||{score:0,issues:[]},C=ft(M.score),I=Math.min(M.score/100*100,100);r+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${u(S.charAt(0).toUpperCase()+S.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${I}%;background:${C}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${C}">${M.score}</span>
                        </div>
                    </div>
                    ${(M.issues||[]).map(T=>`<div class="dl-inspect-issue">${u(T)}</div>`).join("")}
                </div>`});const w=x.permits||{passed:!0,issues:[]};r+=`<div class="dl-permits-row ${w.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${w.passed?"var(--green)":"var(--red)"}">${w.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${(w.issues||[]).map(S=>`<div class="dl-inspect-issue dl-inspect-issue--red">${u(S)}</div>`).join("")}
            </div>`,r+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',r+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(l.materials_used||[]).forEach(S=>{const M=S.grade==="HIGH"?"var(--green)":S.grade==="STANDARD"?"var(--amber)":"var(--orange)",C=S.impact==="positive"?"▲":S.impact==="negative"?"▼":"–",I=S.impact==="positive"?"var(--green)":S.impact==="negative"?"var(--red)":"var(--text-dim)";r+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${u(S.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${M}"></div>
                    <span class="dl-mat-tag__grade" style="color:${M}">${u(S.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${I}">${C}</span>
                </div>`}),r+="</div>",r+='<div class="dl-section-label">Financial Summary</div>',r+='<div class="dl-fin-panel">',r+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${Q(c.contract_value||0)}</span></div>`,(c.bonus||0)>0&&(r+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${Q(c.bonus)}</span></div>`),(c.penalty||0)>0&&(r+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${Q(c.penalty)}</span></div>`);const A=(c.payment||0)+(c.bonus||0)-(c.penalty||0);r+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${Q(A)}</span></div>`,r+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${Q(c.total_cost||0)}</span></div>`,r+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${f?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${f?"var(--green)":"var(--red)"}">${f?"+":""}${Q(p)}</span>
            </div>`,r+="</div>";const _=l.timeline||{};r+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${_.actual||0}/${_.expected||0} ticks</span>`,_.early?r+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(_.expected||0)-(_.actual||0)} TICK${_.expected-_.actual!==1?"S":""} EARLY</span>`:!_.on_time&&_.actual>_.expected&&(r+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(_.actual||0)-(_.expected||0)} TICK${_.actual-_.expected!==1?"S":""} LATE</span>`),r+="</div>",r+="</div>"}r+="</div></div>"}),i.innerHTML=r}async function Pi(){if(!m){ne=[],ut();return}const{data:i,error:t}=await $.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",m.id).order("delivered_at_tick",{ascending:!1}).limit(20);t?(console.warn("Failed to load deliveries:",t.message),ne=[]):ne=(i||[]).map(e=>{const a=e.construction_contracts||{};return{id:e.contract_id,name:a.name||"Project",type:a.issuer_type||"GOVERNMENT",issuer:a.issuer_name||"Government",delivered:"Tick "+(e.delivered_at_tick||0),result:e.result,quality_score:e.quality_score,rep_change:e.rep_change,financials:{contract_value:e.contract_value||0,bonus:e.quality_bonus||0,penalty:e.penalties||0,payment:e.payment_received||0,total_cost:e.total_cost||0},inspection:e.inspection||{},materials_used:e.materials_used||[],timeline:{expected:e.timeline_expected||0,actual:e.timeline_actual||0,on_time:e.on_time,early:e.timeline_actual<e.timeline_expected}}}),ut()}function ot(){const i=Y.reduce((l,o)=>l+(o.owned||0),0),t=Y.reduce((l,o)=>l+(o.deployed||0),0),e=Ft(Y),a=i-t;document.getElementById("eq-count").textContent=i+" UNITS",document.getElementById("eq-summary").innerHTML=`
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
                ${L(e)}
            </div>
        </div>`;const n={};for(const l of Y)n[l.equipment_key]=l;let d="";for(let l=1;l<=3;l++){const o=_e[l],s=We(l),c=Qe===l,p=s.reduce((g,v)=>g+(n[v.key]?.owned||0),0),f=s.reduce((g,v)=>g+(n[v.key]?.deployed||0),0);if(d+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${l})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${c?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${o.color}">${u(o.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${o.color};border:1px solid ${o.color}33;background:${o.color}0a">${o.tag}</span>
            </div>
            ${p>0?`<span class="eq-tier-hdr__count">${f}/${p}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,c)for(const g of s){const v=n[g.key],y=v?.owned||0,k=v?.deployed||0,x=v?.condition||0,w=g.maintenancePerUnit*y,A=y-k,_=y>0&&A===0,S=y>0&&x<65,M=vt(x),C=v?.assigned_projects||[],I=C.length>0?C.map(T=>T.contract_name||"Project").join(", ").slice(0,30):y>0&&k>0?k+" project"+(k>1?"s":""):"—";d+=`<div class="eq-row${y===0?" unowned":""}">`,d+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${y===0?" dim":""}">${u(g.name)}</span>
                        ${S?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${y>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${_?"var(--orange)":"var(--green)"}">${A}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${k}/${y}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,y>0?d+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${x}%;background:${M}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${M}">${x}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${u(I)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${L(w)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:d+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',d+="</div>"}}document.getElementById("eq-list").innerHTML=d;const r=[1,2,3].map(l=>{const o=_e[l],s=We(l).reduce((c,p)=>c+(n[p.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${s>0?o.color+"33":"var(--border-0)"};background:${s>0?o.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${o.color}">${o.tag}</div>
            <div class="eq-footer__tier-count" style="color:${s>0?"var(--text-bright)":"var(--text-dim)"}">${s}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${L(e)}</div>
        </div>
        <div class="eq-footer__tiers">${r}</div>`}function Oi(i){Qe=Qe===i?-1:i,ot()}async function Ri(){if(!m)return;const{data:i,error:t}=await $.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",m.id);t?(console.warn("Failed to load equipment:",t.message),Y=[]):Y=i||[],ot()}async function Di(){const{data:{user:i}}=await $.auth.getUser();if(!i){window.location.href="login.html";return}const{data:t}=await $.from("factions").select("*").or(`id.eq.${i.id},linked_user_id.eq.${i.id}`);ue=(t||[]).filter(s=>s.nation_id);const e=sessionStorage.getItem("active_faction_id");if(m=ue.find(s=>s.id===e)||ue.find(s=>s.faction_type==="corporation")||ue[0],!m){await $.auth.signOut(),window.location.href="login.html";return}if(m.faction_type!=="corporation"){window.location.href="dashboard.html";return}const[a,n]=await Promise.all([m.nation_id?$.from("nations").select("*").eq("id",m.nation_id).single():Promise.resolve({data:null}),$.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);a.error&&console.warn("Nation load failed:",a.error.message),a.data&&(b=a.data),n.error&&console.warn("Shard load failed:",n.error.message),B=n.data;const d=m.corp_ticker||m.abbreviation||"";if(document.getElementById("corp-logo").textContent=d.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=m.faction_name||"Unnamed Corp",B){if(document.getElementById("game-date").textContent=B.current_date||"—",document.getElementById("tick-number").textContent=B.current_tick||"—",B.next_tick_at){const c=(Number(B.tick_interval_hours)||8)*36e5,p=new Date(B.next_tick_at).getTime(),g=p-c+c/2;Ke=new Date(g>Date.now()?g:p+c/2),Qt()}const s=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");s&&(s.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(d?"["+d+"]":m.faction_name||"Corp")+" ▾";const r=document.getElementById("topbar-cash");if(r){const s=Number(m.corp_cash_reserves??0),c=s>=1e9?"$"+(s/1e9).toFixed(1)+"B":s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k";r.textContent="CASH: "+c}const l=m.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+l+" AP</span>",document.getElementById("nation-pill").textContent=(b?.name||m.nation||"—").toUpperCase();const o=document.getElementById("corp-faction-dropdown");if(o){let s="";for(const c of ue){const p=c.id===m.id,f=c.faction_type==="corporation"?"CORP":"PARTY",g=c.faction_type==="corporation"?"var(--teal)":"var(--amber)";s+=`<div class="corp-dd-item${p?" active":""}" onclick="switchToFaction('${c.id}', '${c.faction_type}')">
                <span class="corp-dd-type" style="color:${g}">${f}</span>
                <span class="corp-dd-name">${u(c.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${u(c.abbreviation||"—")}]</span>
            </div>`}o.innerHTML=s}await Promise.all([It(),Tt(),bi(),Ri(),Ni(),Pi()]);try{const{data:s}=await $.from("nations").select("*").order("name");we=s||[]}catch{we=[]}if(At(),Se(),Gt(m,b,B),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",new URLSearchParams(window.location.search).get("tab")==="expansion"){const s=document.querySelector('[data-tab="expansion"]');s&&zt({preventDefault:()=>{},target:s})}}async function Hi(){await $.auth.signOut(),window.location.href="login.html"}function ji(){const i=document.getElementById("corp-faction-dropdown");i&&i.classList.toggle("open")}function Ui(i,t){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.remove("open"),sessionStorage.setItem("active_faction_id",i),t==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",i=>{const t=document.getElementById("faction-switcher"),e=document.getElementById("corp-faction-dropdown");e&&t&&!t.contains(i.target)&&e.classList.remove("open")});document.addEventListener("keydown",i=>{i.key==="Escape"&&ht()});window.doLogout=Hi;window.toggleTheme=Kt;window.toggleCorpDropdown=ji;window.switchToFaction=Ui;window.setFilter=Jt;window.openContractDetail=$t;window.closeContractDetail=ht;window.placeBid=yi;window.toggleWhRow=_i;window.toggleEqTier=Oi;window.switchEmNation=Ci;window.setEmType=Ii;window.setEmListing=Ti;window.setEmQty=Mi;window.purchaseEquipment=Si;window.setPrMat=$i;window.setPrTier=hi;window.setPrQty=wi;window.purchaseMaterial=ki;let j={general:0,skilled:0,innovative:0},je=!1;const be=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function Bt(i){const t=Number(b?.minimum_wage??50),e=Number(b?.inflation??50),a=Number(b?.standard_of_living??50),n=t/100*48e3,d=1+(e-50)/100*.5,r=1+(a-50)/100*.5;return Math.round(n*i*d*r)}function h(i){const t=Math.abs(i),e=i<0?"-":"";return t>=1e9?e+"$"+(t/1e9).toFixed(2)+"B":t>=1e6?e+"$"+(t/1e6).toFixed(2)+"M":t>=1e3?e+"$"+(t/1e3).toFixed(1)+"k":e+"$"+t.toLocaleString()}async function zt(i){i.preventDefault(),document.getElementById("operations-content").style.display="none";const t=document.getElementById("expansion-content");t.style.display="flex",t.style.justifyContent="center",t.style.gap="12px",t.style.alignItems="flex-start",t.style.flexWrap="wrap",document.querySelectorAll(".corp-nav__tab").forEach(e=>e.classList.remove("active")),i.target.classList.add("active"),Ae(),Vi(),await $e(),fe(),await rt(),qe(),Ht(),await an(),Le()}function Pt(i){i&&i.preventDefault(),document.getElementById("operations-content").style.display="flex",document.getElementById("expansion-content").style.display="none",document.querySelectorAll(".corp-nav__tab").forEach(t=>t.classList.remove("active")),document.querySelector('[data-tab="operations"]')?.classList.add("active")}function Ot(){return U.reduce((t,e)=>{const a=Number(e.capacity||0),n=Number(e.condition||0)/100;return t+Math.floor(a*n)},0)+500}function Gi(i,t){const e=be.find(d=>d.id===i),a=Number(m?.[e.factionKey]??0),n=j[i]+t;if(!(a+n<0)){if(t>0){const d=be.reduce((l,o)=>{const s=Number(m?.[o.factionKey]??0),c=o.id===i?n:j[o.id];return l+s+c},0),r=Ot();if(d>r)return}j[i]=n,Ae()}}function Fi(i){i?j[i]=0:j={general:0,skilled:0,innovative:0},Ae()}async function Wi(){if(je||!Object.values(j).some(n=>n!==0))return;let t=0;for(const n of be){const d=j[n.id];d>0&&(t+=d*Bt(n.multiplier)*.1)}const e=Number(m?.corp_cash_reserves??0);if(t>e){alert("Insufficient cash reserves. Hiring cost: "+h(t)+", available: "+h(e));return}const a=t>0?`Confirm workforce changes?

Hiring fee: `+h(t)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(a)){je=!0;try{const n={};for(const l of be){const o=Number(m?.[l.factionKey]??0);n[l.factionKey]=Math.max(0,o+j[l.id])}t>0&&(n.corp_cash_reserves=Math.max(0,e-Math.round(t)));const{error:d}=await $.from("factions").update(n).eq("id",m.id);if(d)throw d;Object.assign(m,n),j={general:0,skilled:0,innovative:0};const r=document.getElementById("topbar-cash");if(r){const l=Number(m.corp_cash_reserves??0);r.textContent="CASH: "+(l>=1e6?"$"+(l/1e6).toFixed(1)+"M":"$"+Math.round(l/1e3)+"k")}Ae()}catch(n){alert("Error: "+n.message)}finally{je=!1}}}function Ae(){const i=document.getElementById("hf-card-container");if(!i)return;const t="'JetBrains Mono', monospace",e={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a=Number(b?.minimum_wage??50),n=Number(b?.inflation??50),d=Number(b?.standard_of_living??50),r=a/100*48e3,l=(1+(n-50)/100*.5).toFixed(2),o=(1+(d-50)/100*.5).toFixed(2),s=b?.name||m?.nation||"Nation",c=Object.values(j).some(w=>w!==0),p=Ot();let f=0,g=0,v=0,y=0,k="";for(const w of be){const A=Number(m?.[w.factionKey]??0),_=j[w.id],S=A+_,M=Bt(w.multiplier),C=_>0,I=A*M,T=S*M,D=T-I;f+=A,g+=S,v+=I,y+=T;const W=_!==0?C?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";k+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${W};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${w.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${e.text}">${w.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${e.text}">${A.toLocaleString()}</span>
                    ${_!==0?`<span style="font-family:${t};font-size:10px;color:${e.dim}">→</span>
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${C?e.greenBright:e.red}">${S.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">WAGE (MIN × ${w.multiplier}.0 × ${l} × ${o})</span>
                <span style="font-family:${t};font-size:10px;color:${w.color}">${h(M)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${w.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.red};border:1px solid ${e.border};cursor:pointer;background:${e.card}">-50</div>
                <div onclick="hfSetChange('${w.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.redDim};border:1px solid ${e.border};cursor:pointer;background:${e.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${_!==0?e.card:"transparent"};border:1px solid ${_!==0?e.border:"transparent"}">
                    ${_!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${t};font-size:12px;font-weight:700;color:${C?e.greenBright:e.red}">${C?"+":""}${_}</span>
                        <span onclick="hfReset('${w.id}')" style="font-family:${t};font-size:8px;color:${e.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${t};font-size:9px;color:${e.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${w.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.greenBright};border:1px solid ${e.border};cursor:pointer;background:${e.card}">+10</div>
                <div onclick="hfSetChange('${w.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${t};font-size:8px;font-weight:700;color:${e.greenBright};border:1px solid ${e.border};cursor:pointer;background:${e.card}">+50</div>
            </div>
            ${_!==0?`<div style="margin-top:6px;padding:4px 8px;background:${e.bg};border:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${D>0?e.red:e.greenBright}">${D>0?"+":""}${h(D)}/yr</span>
            </div>`:""}
        </div>`}const x=y-v;i.innerHTML=`
    <div style="width:380px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Hire / Fire</span>
            </div>
            <span style="font-family:${t};font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${s.toUpperCase()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                <div style="font-family:${t};font-size:8px;letter-spacing:1.5px;color:${e.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;gap:0;">
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${e.border}">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">MIN WAGE</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${a}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${e.dim}">${h(r)}/yr</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${e.border}">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">INFLATION</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${n}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${e.dim}">×${l}</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">STD OF LIVING</div>
                        <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${d}/100</div>
                        <div style="font-family:${t};font-size:7px;color:${e.dim}">×${o}</div>
                    </div>
                </div>
            </div>
            ${k}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;${c?"margin-bottom:6px;":""}">
                <div>
                    <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.8px">WORKFORCE / CAPACITY</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <span style="font-family:${t};font-size:13px;font-weight:700;color:${g>p?e.red:e.text}">${c?g.toLocaleString():f.toLocaleString()}</span>
                        <span style="font-family:${t};font-size:9px;color:${e.dim}">/ ${p.toLocaleString()}</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${h(v)}</span>
                        ${c?`<span style="font-family:${t};font-size:9px;color:${e.dim}">→</span>
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${x>0?e.red:e.greenBright}">${h(y)}</span>`:""}
                    </div>
                </div>
            </div>
            ${c?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${e.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">NET CHANGE</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${x>0?e.red:e.greenBright}">${x>0?"+":""}${h(x)}/yr</span>
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">(${x>0?"+":""}${h(Math.round(x/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${t};font-size:8px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${t};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${e.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}function Vi(){const i=document.getElementById("wf-summary-container");if(!i)return;const t="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},a=(b?.name||m?.nation||"Nation").toUpperCase(),n=Number(b?.minimum_wage??50),d=Number(b?.inflation??50),r=Number(b?.standard_of_living??50),l=n/100*48e3,o=1+(d-50)/100*.5,s=1+(r-50)/100*.5,c=[{label:"General Workforce",mult:2,color:e.accent,key:"corp_general_workforce",countColor:e.text},{label:"Skilled Workforce",mult:3,color:e.gold,key:"corp_skilled_workforce",countColor:e.blue},{label:"Innovative Workforce",mult:6,color:e.orange,key:"corp_innovative_workforce",countColor:e.gold}];let p=0,f=0,g="";for(const v of c){const y=Number(m?.[v.key]??0),k=Math.round(l*v.mult*o*s),x=y*k;p+=y,f+=x,g+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${e.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${e.text}">${v.label}</span>
                    <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${a}</span>
                </div>
                <span style="font-family:${t};font-size:16px;font-weight:700;color:${v.countColor}">${y.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">WAGE (MIN × ${v.mult}.0 × ${o.toFixed(2)} × ${s.toFixed(2)})</span>
                <span style="font-family:${t};font-size:10px;color:${e.muted}">${h(k)}/yr</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim}">TOTAL ANNUAL COST</span>
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${h(x)}</span>
            </div>
        </div>`}i.innerHTML=`
    <div style="width:380px;height:450px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${e.accent}">●</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Workforce</span>
            </div>
            <span style="font-family:${t};font-size:12px;font-weight:700;color:${e.text}">${p.toLocaleString()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${g}
            <div style="padding:8px 12px;background:${e.card};border-bottom:1px solid ${e.border};">
                <div style="font-family:${t};font-size:8px;letter-spacing:1px;color:${e.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">MINIMUM WAGE (${a})</span>
                    <span style="font-family:${t};font-size:9px;color:${e.text}">${n}/100 → ${h(l)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">INFLATION MODIFIER</span>
                    <span style="font-family:${t};font-size:9px;color:${e.text}">×${o.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">STD OF LIVING MODIFIER</span>
                    <span style="font-family:${t};font-size:9px;color:${e.text}">×${s.toFixed(2)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">TOTAL WORKFORCE</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.text}">${p.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">TOTAL ANNUAL WAGES</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.red}">${h(f)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">PER TICK (÷12)</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.red}">${h(Math.round(f/12))}</span>
            </div>
        </div>
    </div>`}let U=[];async function $e(){if(!m?.id)return;const{data:i}=await $.from("corp_properties").select("*").eq("faction_id",m.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});U=i||[]}function fe(){const i=document.getElementById("property-card-container");if(!i)return;const t="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a=(b?.name||m?.nation||"Nation").toUpperCase(),n=1+(Number(b?.inflation??50)-50)/100*.3;let d="",r=0,l=0;const o=b?.name||m?.nation||"Home Nation",s=5e7,c=1+(Number(b?.inflation??50)-50)/100*.3,p=.8+Number(b?.stability??50)/100*.4,f=Math.round(s*c*p),g=Math.round(f*.005);r+=f,l+=g,d+=`
    <div style="padding:8px 12px;border-bottom:1px solid ${e.border};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span style="font-size:11px;font-weight:600;color:${e.text}">National Headquarters</span>
            <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:#5c5;background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">HQ</span>
        </div>
        <div style="font-family:${t};font-size:8px;color:${e.dim};margin-bottom:4px;">${o} · Headquarters</div>
        <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border}">
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${e.border}">
                <div style="font-family:${t};font-size:7px;color:${e.dim}">CAPACITY</div>
                <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">500</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${e.border}">
                <div style="font-family:${t};font-size:7px;color:${e.dim}">VALUE</div>
                <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.gold}">${h(f)}</div>
            </div>
            <div style="flex:1;padding:3px 6px">
                <div style="font-family:${t};font-size:7px;color:${e.dim}">MAINT/MO</div>
                <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.red}">${h(g)}</div>
            </div>
        </div>
    </div>`;for(const v of U){const y=Ee[v.style]||Ee.Basic;r+=Number(v.purchase_price||0),l+=Number(v.monthly_maintenance||0),d+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${e.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:${e.text}">${v.name}</span>
                <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${e.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">OWNED</span>
            </div>
            <div style="font-family:${t};font-size:8px;color:${e.dim};margin-bottom:4px;">${v.city||a} · ${(v.type||"").replace(/_/g," ")} · <span style="color:${y.color}">${(v.style||"Basic").toUpperCase()}</span></div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border}">
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${e.border}">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">CAPACITY</div>
                    <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">${(v.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${e.border}">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">PAID</div>
                    <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.gold}">${h(v.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">MAINT/MO</div>
                    <div style="font-family:${t};font-size:10px;font-weight:700;color:${e.red}">${h(v.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="margin-top:4px;display:flex;justify-content:space-between;">
                <span style="font-family:${t};font-size:7px;color:${e.dim}">CONDITION</span>
                <span style="font-family:${t};font-size:9px;color:${v.condition>=75?"#5c5":v.condition>=50?"#ca5":e.orange}">${v.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:${e.border};margin-top:2px;"><div style="width:${v.condition}%;height:100%;background:${v.condition>=75?"#5c5":v.condition>=50?"#ca5":e.orange}"></div></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <div onclick="propRefurbish('${v.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${t};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${e.accent};border:1px solid ${e.accent}33;cursor:pointer;">REFURBISH (${h(Math.round((v.purchase_price||0)*.1*n))})</div>
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
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.green}">${h(r)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px">TOTAL MAINTENANCE</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.red}">${h(l)}/mo</span>
            </div>
        </div>
    </div>`}let pe=[],H=null;const Ee={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function rt(){if(!m?.nation_id)return;const{data:i,error:t}=await $.from("available_properties").select("*").eq("nation_id",m.nation_id).eq("status","available").order("price",{ascending:!0});if(t){console.warn("[Property] Failed to load marketplace:",t.message);return}pe=(i||[]).map(e=>({...e,adjusted_cost:e.price,adjusted_maintenance:e.monthly_maintenance}))}function qe(){const i=document.getElementById("new-property-container");if(!i)return;const t="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"};(b?.name||m?.nation||"Nation").toUpperCase();const a=Number(b?.standard_of_living??50),n=Number(b?.gdp_growth??50),d=Number(b?.inflation??50),r=b?.capital||"Capital",l={capital:r,port:r+" Port",industrial:r+" Industrial Zone",suburban:r+" Suburbs",coastal:r+" Coast"};let o="";if(pe.length===0)o=`<div style="padding:20px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let s=0;s<pe.length;s++){const c=pe[s],p=H===s,f=Ee[c.style]||Ee.Basic,g=l[c.city_template]||r;o+=`
            <div onclick="npSelect(${s})" style="padding:8px 14px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${p?e.accent:"transparent"};background:${p?"rgba(139,154,107,0.03)":"transparent"};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <span style="font-size:11px;font-weight:600;color:${e.text}">${c.name}</span>
                    <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${f.color};background:${f.color}12;border:1px solid ${f.color}25">${f.label}</span>
                </div>
                <div style="font-family:${t};font-size:8px;color:${e.dim};margin-bottom:5px;">${g} · ${c.type.replace(/_/g," ")}</div>
                <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border}">
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border}">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">CAPACITY</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${e.text};margin-top:1px">${c.capacity.toLocaleString()}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border}">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">PRICE</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${e.gold};margin-top:1px">${h(c.adjusted_cost)}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px">
                        <div style="font-family:${t};font-size:7px;color:${e.dim};letter-spacing:0.5px">MAINT/MO</div>
                        <div style="font-family:${t};font-size:11px;font-weight:700;color:${e.redDim};margin-top:1px">${h(c.adjusted_maintenance)}</div>
                    </div>
                </div>
                ${p?`<div style="margin-top:5px;">
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
            <span style="font-family:${t};font-size:9px;color:${e.dim}">${pe.length} AVAILABLE</span>
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
            ${o}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;gap:6px;justify-content:space-between;">
                <div onclick="npOpenConstructionModal()" style="flex:1;padding:6px 0;text-align:center;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.gold};border:1px solid ${e.gold}44;cursor:pointer">CONSTRUCTION PROJECT</div>
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${H!==null?"#000":e.dim};background:${H!==null?e.accent:"transparent"};border:1px solid ${H!==null?e.accent:e.border};cursor:${H!==null?"pointer":"default"};opacity:${H!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function Yi(i){H=H===i?null:i,qe()}let Ue=!1;async function Qi(){if(H===null||Ue)return;const i=pe[H];if(!i)return;const t=Number(m?.corp_cash_reserves??0);if(i.adjusted_cost>t){alert(`Insufficient cash reserves.
Property: `+h(i.adjusted_cost)+`
Cash: `+h(t));return}if(confirm('Buy "'+i.name+'" for '+h(i.adjusted_cost)+`?

Monthly maintenance: `+h(i.adjusted_maintenance)+`/mo
Condition: `+i.condition+`%

This will be deducted from your cash reserves.`)){Ue=!0;try{const{error:e}=await $.from("corp_properties").insert({faction_id:m.id,nation_id:m.nation_id,catalog_id:i.catalog_id||null,name:i.name,type:i.type,style:i.style,capacity:i.capacity,purchase_price:i.adjusted_cost,monthly_maintenance:i.adjusted_maintenance,condition:i.condition,city:i.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(e)throw e;const a=Math.max(0,t-i.adjusted_cost),{error:n}=await $.from("factions").update({corp_cash_reserves:a}).eq("id",m.id);if(n)throw n;m.corp_cash_reserves=a,i.id&&await $.from("available_properties").update({status:"sold",purchased_by:m.id}).eq("id",i.id);const d=document.getElementById("topbar-cash");d&&(d.textContent="CASH: "+(a>=1e6?"$"+(a/1e6).toFixed(1)+"M":"$"+Math.round(a/1e3)+"k")),H=null,await rt(),qe(),fe(),alert("Property purchased: "+i.name+`

Deducted: `+h(i.adjusted_cost))}catch(e){alert("Purchase failed: "+e.message)}finally{Ue=!1}}}const ae={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let lt=!1,E={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},Ge=!1;function Rt(){const t=1+(Number(b?.inflation??50)-50)/100*.3,e=ae[E.style]?.costMod||1,a=E.type==="Warehouse"?.75:1,n=Math.round(E.size*1e5*t*e*a),d=Math.round(n*(1+E.budgetMod/100)),r=Math.round(d*.007*(ae[E.style]?.maintMod||1));return{baseBudget:n,adjusted:d,maint:r,inflMod:t,styleMod:e}}function Ki(){lt=!0,E={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},Dt()}function dt(){lt=!1,document.getElementById("cp-modal-overlay")?.remove()}function Ji(i,t){E[i]=t,Dt()}async function Xi(){if(!(Ge||!E.name.trim())){Ge=!0;try{const i=Rt(),t=b?.name||m?.nation||"Unknown",e=ae[E.style]?.repGain||1,a=await $.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),n=a.data?.current_tick||0,d=(a.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:r}=await $.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",m.nation_id).eq("issuer_type","PRIVATE"),o=`PVT-C${(r||0)+1}-${d}`,{error:s}=await $.from("construction_contracts").insert({nation_id:m.nation_id,template_key:"custom_building",sector:"civil_engineering",name:E.name.trim(),description:`${E.type} (${E.style}) — ${E.size.toLocaleString()} employees, commissioned by ${m.faction_name}`,project_code:o,budget_ceiling:i.adjusted,timeline_ticks:E.timeline,required_materials:(()=>{const c=E.size/1e3,p=E.style,f={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[p]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},g=(v,y)=>Math.max(1,Math.ceil(c*v*y));return{concrete:g(8,f.concrete),steel:g(6,f.steel),glass_facades:g(3,f.glass),em_systems:g(4,f.em),lumber:g(1,f.lumber),heavy_parts:g(2,f.heavy),aggregate:g(3,f.agg)}})(),required_equipment:(()=>{const c=["work_trucks","concrete_mixers"];return E.size>1e3&&c.push("excavators","tower_cranes"),E.size>3e3&&c.push("bulldozers","heavy_haulers"),E.size>8e3&&c.push("pile_drivers"),c})(),required_workforce:{general:Math.ceil(E.size*.08),skilled:Math.ceil(E.size*.03)},status:"open",generated_at_tick:n,bidding_ends_tick:n+3,issuer_type:"PRIVATE",issuer_name:m.faction_name,issuer_faction_id:m.id});if(s)throw s;dt(),alert(`Construction project submitted!

Project: `+E.name.trim()+`
Code: `+o+`
Budget: `+h(i.adjusted)+`
Expected Reputation: +`+e+`

All construction corporations in `+t+" can now bid on this project.")}catch(i){alert("Failed to submit project: "+i.message)}finally{Ge=!1}}}function Dt(){if(document.getElementById("cp-modal-overlay")?.remove(),!lt)return;const i="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},e=Rt(),a=b?.name||m?.nation||"Nation",n=ae[E.style]?.repGain||1,d=n>=4?t.gold:n>=3?t.greenBright:n>=2?t.accent:t.dim,r=Object.entries(ae).map(([s,c])=>{const p=E.style===s;return`<div onclick="cpSetField('style','${s}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${p?c.color+"18":"transparent"};border:1px solid ${p?c.color+"44":t.border};">
            <div style="font-family:${i};font-size:9px;font-weight:700;color:${p?c.color:t.dim}">${s}</div>
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
                    ${["Regional HQ","Office Building",...m?.corp_sector==="Construction"?["Warehouse"]:[]].map(s=>`<span onclick="cpSetField('type','${s}')" style="flex:1;text-align:center;padding:5px 0;font-family:${i};font-size:9px;font-weight:700;cursor:pointer;color:${E.type===s?"#000":t.dim};background:${E.type===s?s==="Warehouse"?t.orange:t.accent:"transparent"};border:1px solid ${E.type===s?s==="Warehouse"?t.orange:t.accent:t.border}">${s}</span>`).join("")}
                    ${m?.corp_sector==="Construction"?`<div style="font-family:${i};font-size:7px;color:${t.orange};margin-top:3px;">Construction: Warehouse available (75% cost, stores up to $20M materials)</div>`:""}
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
                <div style="margin-top:4px;font-family:${i};font-size:8px;color:${ae[E.style].color}">${ae[E.style].desc}</div>
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
                        <span style="font-family:${i};font-size:9px;color:${t.muted}">${h(e.baseBudget)}</span>
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
                        <span style="font-family:${i};font-size:14px;font-weight:700;color:${t.gold}">${h(e.adjusted)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0">
                        <span style="font-family:${i};font-size:8px;color:${t.dim}">EST. MONTHLY MAINTENANCE</span>
                        <span style="font-family:${i};font-size:9px;color:${t.redDim}">${h(e.maint)}/mo</span>
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
                <div style="font-family:${i};font-size:14px;font-weight:700;color:${t.gold}">${h(e.adjusted)}</div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="cpClose()" style="padding:5px 16px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:5px 16px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${t.gold};cursor:pointer;opacity:${E.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(l);const o=document.getElementById("cp-name-input");o&&o.addEventListener("input",s=>{E.name=s.target.value}),l.addEventListener("click",s=>{s.target===l&&dt()})}function Zi(){const i=document.getElementById("cp-name-input");if(i&&(E.name=i.value),!E.name.trim()){alert("Please enter a building name.");return}Xi()}window.cpClose=dt;window.cpSetField=Ji;window.cpSubmitFromModal=Zi;window.npSelect=Yi;window.npBuyProperty=Qi;window.npOpenConstructionModal=Ki;let me=!1;async function en(i){if(me)return;const t=U.find(l=>l.id===i);if(!t)return;const e=1+(Number(b?.inflation??50)-50)/100*.3,a=Math.round((t.purchase_price||0)*.1*e),n=Number(m?.corp_cash_reserves??0);if(a>n){alert("Insufficient cash. Refurbishment costs "+h(a)+" (inflation-adjusted), you have "+h(n));return}if(t.condition>=95){alert("Property is already in excellent condition ("+t.condition+"%).");return}const d=5+Math.floor(Math.random()*21),r=Math.min(100,t.condition+d);if(confirm('Refurbish "'+t.name+`"?

Cost: `+h(a)+`
Expected improvement: +`+d+"% condition ("+t.condition+"% → "+r+"%)")){me=!0;try{await $.from("corp_properties").update({condition:r}).eq("id",i);const l=Math.max(0,n-a);await $.from("factions").update({corp_cash_reserves:l}).eq("id",m.id),m.corp_cash_reserves=l;const o=document.getElementById("topbar-cash");o&&(o.textContent="CASH: "+(l>=1e6?"$"+(l/1e6).toFixed(1)+"M":"$"+Math.round(l/1e3)+"k")),await $e(),fe(),alert("Refurbished! Condition: "+t.condition+"% → "+r+"%")}catch(l){alert("Refurbishment failed: "+l.message)}finally{me=!1}}}async function tn(i){if(me)return;const t=U.find(d=>d.id===i);if(!t)return;const e=1+(Number(b?.inflation??50)-50)/100*.3,a=(t.condition||50)/100,n=Math.round((t.purchase_price||0)*.6*a*e);if(confirm('Sell "'+t.name+`"?

Sale value: `+h(n)+" (60% × "+t.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){me=!0;try{await $.from("corp_properties").update({is_active:!1}).eq("id",i);const r=Number(m?.corp_cash_reserves??0)+n;await $.from("factions").update({corp_cash_reserves:r}).eq("id",m.id),m.corp_cash_reserves=r;const o=(await $.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await $.from("available_properties").insert({nation_id:m.nation_id,catalog_id:t.catalog_id||null,name:t.name,type:t.type,style:t.style,capacity:t.capacity,price:Math.round(n*1.1),monthly_maintenance:t.monthly_maintenance,condition:t.condition,city:t.city,generated_at_tick:o,expires_at_tick:o+6,status:"available"});const s=document.getElementById("topbar-cash");s&&(s.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")),await $e(),fe(),await rt(),qe(),alert('Sold "'+t.name+'" for '+h(n))}catch(d){alert("Sale failed: "+d.message)}finally{me=!1}}}window.propRefurbish=en;window.propSell=tn;let ye=0;function Ht(){const i=document.getElementById("manage-subsidiaries-container");if(!i)return;const t="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",blue:"#5a9abf",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a=U.filter(o=>o.type==="regional_hq");ye>=a.length&&(ye=0);const n=a[ye]||null;let d="";a.length===0&&(d=`<div style="padding:30px 14px;text-align:center;font-family:${t};font-size:10px;color:${e.dim}">No subsidiaries established.<br>Use Create Subsidiary to expand.</div>`);let r=0;for(let o=0;o<a.length;o++){const s=a[o],c=o===ye,p=Number(s.purchase_price||0);r+=p;const f=xe.find(g=>g.id===s.nation_id)?.name||s.city||"—";d+=`
        <div onclick="_mSubSelected=${o};renderManageSubsidiariesCard();" style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${c?e.accent:"transparent"};background:${c?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:40px;font-family:${t};font-size:9px;font-weight:700;color:${e.gold}">${(s.name||"").split("—")[0]?.trim().split(" ").map(g=>g[0]).join("").slice(0,4)||"SUB"}</span>
            <div style="flex:1.2;">
                <div style="font-size:10px;font-weight:600;color:${e.text};line-height:1.2">${s.name}</div>
                <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:1px">${s.style||"Modern"}</div>
            </div>
            <span style="width:60px"><span style="font-family:${t};font-size:7px;padding:1px 4px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${f.toUpperCase().slice(0,8)}</span></span>
            <span style="width:50px;font-family:${t};font-size:9px;font-weight:700;color:${e.gold};text-align:right">${h(p)}</span>
            <span style="width:35px;font-family:${t};font-size:9px;font-weight:700;color:${s.condition>=75?e.greenBright:s.condition>=50?e.yellow:e.orange};text-align:right">${s.condition}%</span>
        </div>`}let l="";if(n){const o=xe.find(p=>p.id===n.nation_id)?.name||n.city||"—",s=n.condition>=75?e.greenBright:n.condition>=50?e.yellow:e.orange,c=[{label:"Valuation",value:h(n.purchase_price||0),color:e.gold},{label:"Maintenance/Mo",value:h(n.monthly_maintenance||0),color:e.red},{label:"Capacity",value:(n.capacity||0).toLocaleString(),color:e.text},{label:"Condition",value:n.condition+"%",color:s},{label:"Nation",value:o,color:e.accent},{label:"Style",value:n.style||"Modern",color:e.muted}];l=`
            <div style="padding:8px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                <div style="font-size:12px;font-weight:700;color:${e.text};margin-bottom:2px">${n.name}</div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-family:${t};font-size:7px;padding:1px 5px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${o.toUpperCase()}</span>
                    <span style="font-family:${t};font-size:7px;padding:1px 5px;color:${e.blue};background:rgba(90,154,191,0.08);border:1px solid rgba(90,154,191,0.15)">SUBSIDIARY</span>
                </div>
            </div>
            ${c.map(p=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                <span style="font-family:${t};font-size:9px;color:${e.dim};text-transform:uppercase">${p.label}</span>
                <span style="font-family:${t};font-size:11px;font-weight:700;color:${p.color}">${p.value}</span>
            </div>`).join("")}
            <div style="padding:6px 14px;border-bottom:1px solid ${e.border};flex-shrink:0;">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                    <span style="font-family:${t};font-size:7px;color:${e.dim}">CONDITION</span>
                    <span style="font-family:${t};font-size:8px;color:${s}">${n.condition}%</span>
                </div>
                <div style="width:100%;height:4px;background:${e.border}"><div style="width:${n.condition}%;height:100%;background:${s}"></div></div>
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
                    <span style="width:50px;font-family:${t};font-size:9px;font-weight:700;color:${e.text};text-align:right">${h(r)}</span>
                    <span style="width:35px"></span>
                </div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${l}
            </div>
        </div>
    </div>`}async function nn(i){const t=U.find(a=>a.id===i);if(!t)return;const e=Math.round((t.purchase_price||0)*.6*(t.condition||50)/100);if(confirm('Dissolve subsidiary "'+t.name+`"?

Assets liquidated at 60% × condition: `+h(e)+`
All operations in this nation cease.

This cannot be undone.`))try{await $.from("corp_properties").update({is_active:!1}).eq("id",i);const a=Number(m?.corp_cash_reserves??0)+e;await $.from("factions").update({corp_cash_reserves:a}).eq("id",m.id),m.corp_cash_reserves=a;const n=document.getElementById("topbar-cash");n&&(n.textContent="CASH: "+(a>=1e6?"$"+(a/1e6).toFixed(1)+"M":"$"+Math.round(a/1e3)+"k")),ye=0,await $e(),fe(),Ht(),Le(),alert("Subsidiary dissolved. Received: "+h(e))}catch(a){alert("Failed: "+a.message)}}window.subDissolve=nn;let xe=[],X=null,Fe=!1;async function an(){const{data:i}=await $.from("nations").select("*").order("name");xe=(i||[]).filter(t=>t.id!==m?.nation_id)}function et(i){const e=g=>Number(i[g]??50),a=e("standard_of_living"),n=e("cost_of_living"),d=e("corporate_tax"),r=e("minimum_wage"),l=e("urbanization"),o=e("union_strength"),s=e("corruption"),c=e("unemployment"),p=e("stability"),f=5e7*(1+(a-50)/100*.4)*(1+(n-50)/100*.3)*(1+(d-50)/100*.2)*(1+(r-50)/100*.15)*(1+(l-50)/100*.1)*(1+(o-50)/100*.1)*(1-(s-50)/100*.15)*(1-(c-50)/100*.1)*(1+(50-p)/100*.3);return Math.round(Math.max(1e7,f))}function sn(i){X=X===i?null:i,Le()}async function on(){if(Fe||!X)return;const i=xe.find(n=>n.id===X);if(!i)return;if(U.find(n=>n.nation_id===i.id&&n.type==="regional_hq")){alert("You already have a subsidiary in "+i.name);return}const e=et(i),a=Number(m?.corp_cash_reserves??0);if(e>a){alert("Insufficient cash. Entry cost: "+h(e)+", available: "+h(a));return}if(confirm("Establish subsidiary in "+i.name+`?

Entry cost: `+h(e)+`
Creates a Regional HQ (500 capacity)
Unlocks `+i.name+` for operations

Deducted from cash reserves.`)){Fe=!0;try{const d=(await $.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0,r=85+Math.floor(Math.random()*16),l=Math.round(e*.005),{error:o}=await $.from("corp_properties").insert({faction_id:m.id,nation_id:i.id,name:"Regional Headquarters — "+i.name,type:"regional_hq",style:"Modern",capacity:500,purchase_price:e,monthly_maintenance:l,condition:r,city:i.capital||i.name,purchased_at_tick:d,is_active:!0});if(o)throw o;const s=Math.max(0,a-e);await $.from("factions").update({corp_cash_reserves:s}).eq("id",m.id),m.corp_cash_reserves=s;const c=document.getElementById("topbar-cash");c&&(c.textContent="CASH: "+(s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k")),X=null,await $e(),fe(),renderSubsidiariesCard(),Le(),alert("Subsidiary established in "+i.name+`!

Cost: `+h(e)+`
Regional HQ created with `+r+"% condition.")}catch(n){alert("Failed: "+n.message)}finally{Fe=!1}}}function Le(){const i=document.getElementById("create-subsidiary-container");if(!i)return;const t="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",blue:"#5a9abf",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},a=new Set(U.filter(o=>o.type==="regional_hq").map(o=>o.nation_id)),n=xe.filter(o=>!a.has(o.id)),d=X?n.find(o=>o.id===X):null;let r="";for(const o of n){const s=o.id===X,c=et(o),p=Number(o.standard_of_living??50),f=Number(o.stability??50),g=c>6e7?e.red:c>4e7?e.orange:e.greenBright;r+=`
        <div onclick="subSelectNation('${o.id}')" style="padding:6px 12px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${s?e.blue:"transparent"};background:${s?"rgba(90,154,191,0.03)":"transparent"};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-size:11px;font-weight:600;color:${e.text}">${o.name}</span>
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${g}">${h(c)}</span>
            </div>
            <div style="display:flex;gap:8px;margin-top:2px;">
                <span style="font-family:${t};font-size:7px;color:${e.dim}">SoL <span style="color:${p>=50?e.greenBright:e.orange}">${Math.round(p)}</span></span>
                <span style="font-family:${t};font-size:7px;color:${e.dim}">STAB <span style="color:${f>=50?e.greenBright:e.red}">${Math.round(f)}</span></span>
                <span style="font-family:${t};font-size:7px;color:${e.dim}">GDP <span style="color:${e.muted}">${Math.round(Number(o.gdp_growth??50))}</span></span>
                <span style="font-family:${t};font-size:7px;color:${e.dim}">INFL <span style="color:${Number(o.inflation??50)<=50?e.greenBright:e.red}">${Math.round(Number(o.inflation??50))}</span></span>
            </div>
        </div>`}let l="";if(d){const o=et(d),s=p=>Number(d[p]??50),c=[{label:"STD OF LIVING",val:s("standard_of_living"),weight:"×0.4",inc:!0},{label:"COST OF LIVING",val:s("cost_of_living"),weight:"×0.3",inc:!0},{label:"CORPORATE TAX",val:s("corporate_tax"),weight:"×0.2",inc:!0},{label:"MINIMUM WAGE",val:s("minimum_wage"),weight:"×0.15",inc:!0},{label:"URBANIZATION",val:s("urbanization"),weight:"×0.1",inc:!0},{label:"UNION STRENGTH",val:s("union_strength"),weight:"×0.1",inc:!0},{label:"CORRUPTION",val:s("corruption"),weight:"×0.15",inc:!1},{label:"UNEMPLOYMENT",val:s("unemployment"),weight:"×0.1",inc:!1},{label:"STABILITY",val:s("stability"),weight:"×0.3",inc:!1}];l=`<div style="padding:6px 12px;background:${e.card};border-bottom:1px solid ${e.border};">
            <div style="font-family:${t};font-size:8px;letter-spacing:1px;color:${e.dim};text-transform:uppercase;margin-bottom:4px">COST BREAKDOWN — ${d.name.toUpperCase()}</div>
            ${c.map(p=>{const f=p.inc?p.val-50:50-p.val,g=f>0?p.inc?e.red:e.greenBright:p.inc?e.greenBright:e.red;return`<div style="display:flex;justify-content:space-between;padding:1px 0;">
                    <span style="font-family:${t};font-size:8px;color:${e.dim}">${p.label} (${p.weight})</span>
                    <span style="font-family:${t};font-size:8px;color:${g}">${p.val}/100 ${f>=0?"↑":"↓"} cost</span>
                </div>`}).join("")}
            <div style="display:flex;justify-content:space-between;padding:4px 0;margin-top:4px;border-top:1px solid ${e.border};">
                <span style="font-family:${t};font-size:9px;font-weight:700;color:${e.text}">ENTRY COST</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.gold}">${h(o)}</span>
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
    </div>`}window.subSelectNation=sn;window.subCreate=on;window.switchToExpansion=zt;window.switchToOperations=Pt;window.hfSetChange=Gi;window.hfReset=Fi;window.hfConfirm=Wi;document.querySelector('[data-tab="operations"]')?.addEventListener("click",function(i){this.classList.contains("active")||(i.preventDefault(),Pt(i))});Di();
