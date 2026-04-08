import{_ as $}from"./supabase-client-BXEzLDpS.js";import{e as b}from"./utils-C2W-HleY.js";import{initMessaging as nn}from"./messaging-B5Fng3EZ.js";import{c as on,a as Pt,E as We,b as ot,d as ki,e as an,f as sn,h as xi}from"./equipment-DsuDdEne.js";const Ei={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},ce=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"manufacturing_output",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:50},{stat:"higher_education",min:40}]}},priceDrivers:["manufacturing_output","inflation","fuel_prices","urbanization"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:10}]},STD:{requirements:[{stat:"manufacturing_output",min:35},{stat:"rare_minerals",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:40},{stat:"higher_education",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","inflation","fuel_prices"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"arable_land",min:10}]},STD:{requirements:[{stat:"arable_land",min:30},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"arable_land",min:50},{stat:"manufacturing_output",min:30}]}},priceDrivers:["arable_land","physical_infrastructure","inflation"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"rare_minerals",min:15},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"rare_minerals",min:35},{stat:"manufacturing_output",min:25}]}},priceDrivers:["rare_minerals","physical_infrastructure","inflation"]},{key:"em",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:15}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"digital_infrastructure",min:25}]},HIGH:{requirements:[{stat:"manufacturing_output",min:55},{stat:"digital_infrastructure",min:50},{stat:"energy_generation",min:40}]}},priceDrivers:["manufacturing_output","digital_infrastructure","inflation","energy_generation"]},{key:"glass",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:20}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"digital_infrastructure",min:40},{stat:"higher_education",min:50}]}},priceDrivers:["manufacturing_output","standard_of_living","inflation"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"oil_and_gas",min:10}]},STD:{requirements:[{stat:"oil_and_gas",min:30},{stat:"manufacturing_output",min:25}]},HIGH:{requirements:[{stat:"oil_and_gas",min:45},{stat:"manufacturing_output",min:40},{stat:"physical_infrastructure",min:40}]}},priceDrivers:["oil_and_gas","manufacturing_output","inflation","fuel_prices"]},{key:"heavy",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:40},{stat:"rare_minerals",min:30}]},STD:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:45},{stat:"higher_education",min:40}]},HIGH:{requirements:[{stat:"manufacturing_output",min:75},{stat:"rare_minerals",min:60},{stat:"higher_education",min:55},{stat:"digital_infrastructure",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","higher_education","digital_infrastructure"]}];function ke(i,e,t){const n=ce.find(r=>r.key===i);if(!n)return{available:!1,failedStat:"unknown_material"};const o=n.tiers[e];if(!o)return{available:!1,failedStat:"unknown_tier"};for(const r of o.requirements){const a=Number(t?.[r.stat]??0);if(a<r.min)return{available:!1,failedStat:r.stat,failedMin:r.min,nationValue:a}}return{available:!0}}function Qt(i,e,t){const o={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em:{LOW:400,STD:700,HIGH:1200},glass:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy:{LOW:800,STD:1400,HIGH:2400}}[i]?.[e];if(!o)return 0;const r=ce.find(d=>d.key===i);if(!r)return o;let a=1;for(const d of r.priceDrivers){const l=Number(t?.[d]??50);d==="inflation"||d==="fuel_prices"?a*=1+(l-50)/200:a*=1-(l-50)/250}return a=Math.max(.4,Math.min(2.5,a)),Math.round(o*a)}function Ti(i,e,t){const o={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em:{LOW:1e3,STD:700,HIGH:300},glass:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy:{LOW:400,STD:200,HIGH:80}}[i]?.[e]||0,a=ce.find(s=>s.key===i)?.priceDrivers?.[0],l=.3+(a?Number(t?.[a]??50):50)/50*.7;return Math.round(o*l)}const Kt=["LOW","STD","HIGH"],Dt={LOW:"Low",STD:"Standard",HIGH:"High"};let Ue=[],m=null,E=null,D=null,ze=[],Oe={},ee=[],G={},jt=-1,j="concrete",H="STD",te=500,ae=[],Ht=0,Q="trucks",se=0,re=1,ve=[],Ee=null,it=[],Ut=null,Ze=null,Gt="ALL",Ft="TIMELINE";function q(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(1)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i}function rn(i){if(i>=12){const e=Math.floor(i/12),t=i%12;return t>0?e+"y "+t+"mo":e+"y"}return i+" ticks"}function K(i){return Math.abs(i)>=1e9?"$"+(i/1e9).toFixed(1)+"B":Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(0)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i}function Jt(i){return i==="civil_engineering"?"CIVIL":i==="industrial"?"INDUSTRIAL":i==="mega_project"?"MEGA":i?.toUpperCase()||"—"}function Ci(i){return i==="civil_engineering"?"light":i==="industrial"?"heavy":i==="mega_project"?"mega":"light"}function ln(){Ze&&clearInterval(Ze),Ze=setInterval(()=>{if(!Ut)return;const i=Ut-Date.now();if(i<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(Ze);return}const e=Math.floor(i/36e5),t=Math.floor(i%36e5/6e4),n=Math.floor(i%6e4/1e3);document.getElementById("tick-countdown").textContent=e+"h "+t+"m "+n+"s"},1e3)}function dn(){document.body.classList.toggle("light-mode");const i=document.getElementById("theme-toggle");i.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function cn(i,e){i==="type"&&(Gt=e),i==="sort"&&(Ft=e),document.querySelectorAll(`.filter-pill[data-filter="${i}"]`).forEach(t=>{t.classList.toggle("active",t.dataset.value===e)}),Ii()}const bi={"Civil Engineering":"civil_engineering","Industrial Construction":"industrial",Megaprojects:"mega_project"};function Si(i){if(!m)return!1;if(bi[m.corp_subsector]===i.sector)return!0;const t=(U||[]).filter(n=>n.type==="regional_hq"&&n.is_active&&n.nation_id===i.nation_id);for(const n of t)if(bi[n.subsector]===i.sector)return!0;return!1}function Ii(){const i=document.getElementById("oc-list");let e=[...ze];if(Gt==="GOVERNMENT"?e=e.filter(o=>o.issuer_type==="GOVERNMENT"):Gt==="PRIVATE"&&(e=e.filter(o=>o.issuer_type==="PRIVATE")),Ft==="TIMELINE"&&e.sort((o,r)=>(o.timeline_ticks||0)-(r.timeline_ticks||0)),Ft==="BUDGET"&&e.sort((o,r)=>(r.budget_ceiling||0)-(o.budget_ceiling||0)),document.getElementById("oc-count").textContent=e.length+" AVAILABLE",e.length===0){i.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const t=D?.current_tick||0;let n="";for(const o of e){const r=o.issuer_type==="GOVERNMENT",a=r?"gov":"private",d=Si(o),l=d?"":" locked",s=Ci(o.sector),c=Jt(o.sector),f=(o.timeline_ticks||0)>18?" warn":"",p=o.bidding_ends_tick?Math.max(0,o.bidding_ends_tick-t):"?";n+=`
            <div class="oc-item${l}" data-contract-id="${o.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${b(o.name)}</span>
                    <span class="oc-item__type-badge ${a}">${r?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${a}">${b(o.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${p} tick${p!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${K(o.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${f}">${rn(o.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${s}">${c}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${Oe[o.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${K(Oe[o.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${d?"yes":"no"}">${d?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${d?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openContractDetail(contracts.find(x=>x.id==='${o.id}'))">VIEW</button>`:""}
                </div>
                ${o.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${b(o.description)}</div>`:""}
            </div>`}i.innerHTML=n,i.querySelectorAll(".oc-item:not(.locked)").forEach(o=>{o.addEventListener("click",()=>{const r=o.dataset.contractId,a=ze.find(d=>d.id===r);a&&Mi(a)})})}let Te=null;function Mi(i){Te=i;const e=document.getElementById("cd-overlay"),t=i.issuer_type==="GOVERNMENT",n=t?"gov":"private",o=(E?.name||m.nation||"—").toUpperCase(),r=Si(i);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${b(o)}</span>
        <span class="cd-header__name">${b(i.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${n}">${b(i.issuer_name)}</span>
        <span class="cd-header__type-badge ${n}">${t?"GOV":"PRIVATE"}</span>
    `;const a=document.getElementById("cd-blueprint");i.blueprint_svg?(a.innerHTML=i.blueprint_svg,a.style.display=""):(a.innerHTML=hn(i),a.style.display="");const d=i.permits_required||[],l=i.required_equipment||i.equipment_required||[],s=i.required_materials||i.materials_estimated||{},f={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[i.sector]||i.spec_category||i.sector||"—";let p="var(--teal)";i.sector==="industrial"&&(p="var(--orange)"),i.sector==="mega_project"&&(p="var(--red)");let u=q(i.budget_ceiling||i.budget||0),y=(i.timeline_ticks||i.timeline_months||0)+" Months",v="";v+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${b(i.project_code||i.contract_number||"")}</span>
            </div>
            <div class="cd-issue__tags">
                ${i.project_type?`<span class="cd-tag teal">${b(i.project_type.toUpperCase())}</span>`:""}
                ${i.project_subtype?`<span class="cd-tag gold">${b(i.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,i.description&&(v+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${b(i.description)}</div>
            </div>`),v+='<div class="cd-details">',i.project_type&&(v+=ye("Type",i.project_type)),i.project_subtype&&(v+=ye("Sub-Type",i.project_subtype)),v+=ye("Specialization",f,p),v+=ye("Total Budget",u,"var(--green)"),v+=ye("Timeline",y),v+=ye("Nation",E?.name||m.nation||"—"),i.region&&(v+=ye("Region",i.region)),v+="</div>",d.length>0&&(v+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${d.map(h=>{const B=h.status==="approved"?"approved":"required",N=h.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${B}">
                            <span class="cd-chip__icon">${N}</span>
                            <span class="cd-chip__label">${b(h.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),s.length>0&&(v+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${s.map(h=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${b(h.name)}</span>
                        <span class="cd-mat-row__qty">${b(String(h.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=v;const _=d.filter(h=>h.status==="approved").length,w=d.length-_,k=l.filter(h=>h.owned).length,M=l.length-k;let C="";l.length>0&&(M===0?C+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>':C+=`<span class="cd-footer__badge bad">${M} EQUIPMENT MISSING</span>`),d.length>0&&(w===0?C+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':C+=`<span class="cd-footer__badge warn">${w} PERMITS PENDING</span>`);const T=r;(m.action_points??0)>=2;const x=i.issuer_faction_id===m?.id,S=i.status==="bidding",A=Oe[i.id];document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${C}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${x?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${S?"":"disabled"} title="${S?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:A?`<button class="cd-btn primary" onclick="retractBid('${i.id}')" style="background:#c55;border-color:#c55;"
                        title="Retract your bid ($1M penalty)">RETRACT BID</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${T?"":"disabled"}
                        title="${T?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,e.classList.add("open"),document.body.style.overflow="hidden"}function Qe(i){i&&i.target&&i.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",Te=null)}const be=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],$i={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},_i={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let L=null;async function Xt(i){const e=ee.find(h=>h.id===i);if(!e)return;const t=Array.isArray(e.contract_bids)?e.contract_bids[0]:e.contract_bids,n=D?.current_tick||0,o=e.awarded_at_tick||n,r=e.timeline_ticks||8,a=Math.max(0,n-o),d=Math.min(100,a/r*100);let l=Math.min(be.length-1,Math.floor(d/(100/be.length)));const s=Math.round(d%(100/be.length)/(100/be.length)*100),c=e.required_materials||{},f=t?.material_grades||{};let p=[];try{const{data:h}=await $.from("project_material_allocations").select("material_key, quality_tier, quantity, consumed").eq("contract_id",e.id);p=h||[]}catch{}const u={};for(const h of p)u[h.material_key]||(u[h.material_key]={totalAllocated:0,totalConsumed:0,tiers:{}}),u[h.material_key].totalAllocated+=h.quantity,u[h.material_key].totalConsumed+=h.consumed,u[h.material_key].tiers[h.quality_tier]={qty:h.quantity,consumed:h.consumed};const y=Object.entries(c).map(([h,B])=>{const N=f[h]||"STD",R=u[h]||{totalAllocated:0,totalConsumed:0,tiers:{}};return{key:h,name:h.replace(/_/g," ").replace(/\b\w/g,Y=>Y.toUpperCase()),grade:N,required:Number(B),allocated:R.totalAllocated,consumed:R.totalConsumed,tiers:R.tiers,warehouseStock:G[h]||{}}}),_=(e.required_equipment||[]).map(h=>({key:h,name:h.replace(/_/g," ").replace(/\b\w/g,B=>B.toUpperCase()),qty:1+Math.floor(Math.random()*3),condition:55+Math.floor(Math.random()*40)})),w=e.budget_ceiling||0,k=t?.estimated_cost||0,M=Math.round(k*Math.min(1,a/r)),C=t?.estimated_quality||65,T=C>=80?"STRONG":C>=60?"PROMISING":C>=40?"FAIR":"UNCERTAIN",x=e.required_workforce||{},S=(x.general||0)+(x.skilled||0),A=t?.labor_count||S;L={project:e,bid:t,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:n,awardedTick:o,totalTicks:r,ticksElapsed:a,phaseIdx:l,phaseProgress:s,materials:y,equipment:_,budget:w,estCost:k,spent:M,quality:C,qualityLabel:T,laborCount:A,wfNeeded:S,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",Ai(e.id).then(()=>Se()),Se()}let Be=!1;async function pn(i,e,t){if(!(Be||!L||!m)){Be=!0;try{const{data:n,error:o}=await $.rpc("allocate_material_to_project",{p_contract_id:L.project.id,p_faction_id:m.id,p_material_key:i,p_quality_tier:e,p_quantity:t});if(o){alert("Allocation failed: "+o.message);return}if(n&&!n.success){alert(n.error||"Allocation failed");return}await ei(),await Xt(L.project.id)}catch(n){alert("Allocation error: "+n.message)}finally{Be=!1}}}async function fn(i,e,t){if(!(Be||!L||!m)){Be=!0;try{const{data:n,error:o}=await $.rpc("deallocate_material_from_project",{p_contract_id:L.project.id,p_faction_id:m.id,p_material_key:i,p_quality_tier:e,p_quantity:t});if(o){alert("Return failed: "+o.message);return}if(n&&!n.success){alert(n.error||"Return failed");return}await ei(),await Xt(L.project.id)}catch(n){alert("Return error: "+n.message)}finally{Be=!1}}}function mn(i){i&&i.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",L=null)}function un(i){L&&(L.tab=i,L.expandedEvent=-1,L.selectedResponse=null,Se())}function yn(i){L&&(L.expandedEvent=L.expandedEvent===i?-1:i,L.selectedResponse=null,Se())}function vn(i){L&&(L.selectedResponse=L.selectedResponse===i?null:i,Se())}function Se(){if(!L)return;const i=L,e=i.project,t=e.issuer_type==="GOVERNMENT",n=Jt(e.sector),o=m?.nation||"Nation",r=i.awardedTick+i.totalTicks,a=Math.max(0,r-i.currentTick),d=i.currentTick>r,l=i.budget>0?Math.round(i.spent/i.budget*100):0,s=l>85?"var(--red)":l>60?"var(--amber)":"var(--teal)",c=i.budget-i.spent,f=i.events.filter(_=>_.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${b(o.toUpperCase())}</span>
                <span class="pm-hdr__name">${b(e.name)}</span>
                <span style="color:var(--text-dim);font-size:12px">—</span>
                <span class="pm-hdr__issuer">${b(e.issuer_name||"—")}</span>
                <span class="pm-hdr__type">${t?"GOV":"PVT"}</span>
            </div>
            <button class="pm-hdr__close" onclick="closeProjectModal()">×</button>
        </div>
        <div class="pm-hdr__row2">
            <span class="pm-hdr__id">${b(e.template_key||e.id)}</span>
            <span class="pm-hdr__badge pm-hdr__badge--spec">${b(n.toUpperCase())}</span>
            <span class="pm-hdr__badge pm-hdr__badge--sub">${b((e.sector||"").replace(/_/g," ").toUpperCase())}</span>
        </div>
    `;let p='<div class="pm-phase__bar">';for(let _=0;_<be.length;_++){const w=_<i.phaseIdx,k=_===i.phaseIdx;p+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${w?"done":k?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${w?"done":k?"active":""}">${be[_]}</span>
        </div>`}p+="</div>",p+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${be[i.phaseIdx]} — ${i.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${d?"var(--red)":"var(--text-secondary)"}">Tick ${i.ticksElapsed} / ${i.totalTicks}${d?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=p;const u=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:f},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=u.map(_=>`<button class="pm-tab${i.tab===_.id?" active":""}" onclick="pmSetTab('${_.id}')">
            ${_.label}${_.badge>0?`<span class="pm-tab__badge">${_.badge}</span>`:""}
        </button>`).join("");let y="";i.tab==="overview"?y=gn(i,e,s,l,c,a,d):i.tab==="events"?y=xn(i):i.tab==="materials"?y=bn(i):i.tab==="equipment"&&(y=$n(i)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${y}</div>`;let v="";f>0&&(v+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${f} EVENT${f>1?"S":""} REQUIRES RESPONSE</span>`),v+=`<span class="pm-ftr__badge" style="color:${i.quality>=70?"var(--green)":i.quality>=50?"var(--amber)":"var(--orange)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${i.quality}/100 — ${i.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${v}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function gn(i,e,t,n,o,r,a){const d=Et(i.awardedTick+i.totalTicks);Et(i.awardedTick+i.totalTicks);const l=Et(i.awardedTick),s=[{label:"Budget",value:K(i.budget),sub:`${n}% spent`,color:t},{label:"Spent",value:K(i.spent),color:"var(--red)"},{label:"Remaining",value:K(o),color:"var(--green)"},{label:"Quality",value:`${i.quality}/100`,sub:i.qualityLabel,color:i.quality>=70?"var(--green)":i.quality>=50?"var(--amber)":"var(--red)"},{label:"Workforce",value:`${i.laborCount}/${i.wfNeeded}`,sub:`Bid: ${i.laborCount}`,color:i.laborCount<i.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${r} ticks`,sub:a?"OVERDUE":`Deadline: ${d}`,color:a?"var(--red)":"var(--text-bright)"}];let c="";c+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${b(e.description||e.name)}</div>
    </div></div>`,c+='<div class="pm-metrics">';for(const p of s)c+=`<div class="pm-metric">
            <div class="pm-metric__label">${p.label}</div>
            <div class="pm-metric__value" style="color:${p.color}">${p.value}</div>
            ${p.sub?`<div class="pm-metric__sub">${b(p.sub)}</div>`:""}
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
                    <span class="pm-permit__name">${b(p.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;c+="</div></div>"}return c}function xn(i){if(i.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let e="";for(let t=0;t<i.events.length;t++){const n=i.events[t],o=i.expandedEvent===t,r=n.status==="ACTIVE",a=$i[n.type]||$i.WEATHER,d=_i[n.severity]||_i.LOW;if(e+=`<div class="pm-evt ${r?"pm-evt--active":"pm-evt--resolved"}" style="${r?`border-left-color:${a.color}`:""}">`,e+=`<div class="pm-evt__header" onclick="pmToggleEvent(${t})" style="${o?`background:${a.bg}`:""}">`,e+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${a.color};background:${a.bg};border:1px solid ${a.border}">${n.type}</span>
            <span class="pm-evt__sev-badge" style="color:${d}">${n.severity}</span>
            <span class="pm-evt__status" style="color:${r?"var(--red)":"var(--text-dim)"};font-weight:${r?"700":"400"}">${r?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,e+=`<div class="pm-evt__title">${b(n.title)}</div>`,e+=`<div class="pm-evt__meta">Tick ${n.tick} · ${b(n.id||"")}</div>`,o){if(e+='<div class="pm-evt__body">',e+=`<div class="pm-evt__desc">${b(n.desc)}</div>`,n.impact&&(e+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${b(n.impact)}</span>
                </div>`),r&&n.responses&&n.responses.length>0){e+='<div class="pm-evt__resp-title">Response Options</div>';for(let l=0;l<n.responses.length;l++){const s=n.responses[l],c=i.selectedResponse===l,p={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[s.tag]||"var(--text-secondary)";e+=`<div class="pm-resp${c?" selected":""}" style="${c?`border-color:${p}`:""}" onclick="event.stopPropagation();pmSelectResponse(${l})">`,e+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${b(s.label)}</span>
                            <span class="pm-resp__tag" style="color:${p};background:${p}12;border:1px solid ${p}25">${s.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${s.delay>0?"var(--orange)":"var(--green)"}">
                            ${s.delay>0?`+${s.delay} tick${s.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,e+=`<div class="pm-resp__detail">${b(s.detail)}</div>`,e+='<div class="pm-resp__costs">',s.cost&&(e+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${K(s.cost)}</span>`),s.qualityImpact&&s.qualityImpact!==0&&(e+=`<span class="pm-resp__cost" style="color:${s.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${s.qualityImpact>0?"+":""}${s.qualityImpact}</span>`),!s.cost&&(!s.qualityImpact||s.qualityImpact===0)&&(e+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),e+="</div>",c&&(e+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${p}" onclick="event.stopPropagation();confirmEventResponse('${n.id}','${s.key}')">CONFIRM</button>
                        </div>`),e+="</div>"}}!r&&n.resolution&&(e+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${b(n.resolution)}</div>
                </div>`),e+="</div>"}e+="</div></div>"}return e}function bn(i){if(i.materials.length===0)return'<div class="pm-evt-empty">No materials required for this project.</div>';let e='<div class="pm-tab-header">Project Materials</div>';for(const t of i.materials){const n=t.required>0?Math.round(t.allocated/t.required*100):0;t.allocated>0&&Math.round(t.consumed/t.allocated*100);const o=t.allocated>=t.required,r=o?"var(--green)":t.allocated>0?"var(--amber)":"var(--red)",a=o?"FULLY ALLOCATED":t.allocated>0?"PARTIAL":"NONE ALLOCATED";e+='<div class="pm-mat" style="margin-bottom:14px;">',e+=`<div class="pm-mat__row1">
            <div class="pm-mat__left">
                <span class="pm-mat__name">${b(t.name)}</span>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:${r};">${t.allocated} / ${t.required} allocated · ${a}</span>
        </div>`,e+=`<div class="pm-mat__bar-row">
            <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${n}%;background:${r};"></div></div>
            <span class="pm-mat__pct">${t.consumed} consumed</span>
        </div>`;const d=["STD","LOW","HIGH"],l=t.required-t.allocated;for(const s of d){const c=t.warehouseStock[s]||{qty:0},f=t.tiers[s]||{qty:0,consumed:0},p=f.qty-f.consumed;if(c.qty===0&&f.qty===0)continue;const u=s==="HIGH"?"var(--green)":s==="LOW"?"var(--orange)":"var(--text-muted)",y=s==="HIGH"?"HIGH":s==="LOW"?"LOW":"STD";if(e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.7rem;">',e+='<div style="display:flex;align-items:center;gap:6px;">',e+=`<span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${u};width:32px;">${y}</span>`,e+=`<span style="color:var(--text-dim);">Warehouse: <strong style="color:var(--text-primary);">${c.qty}</strong></span>`,f.qty>0&&(e+=`<span style="color:var(--text-dim);margin-left:8px;">Allocated: <strong style="color:var(--text-primary);">${f.qty}</strong></span>`),e+="</div>",e+='<div style="display:flex;gap:4px;">',c.qty>0&&l>0){const v=Math.min(c.qty,l);e+=`<button class="pm-alloc-btn" onclick="pmAllocateMaterial('${t.key}','${s}',${v})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Allocate ${v}</button>`}p>0&&(e+=`<button class="pm-alloc-btn" onclick="pmDeallocateMaterial('${t.key}','${s}',${p})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Return ${p}</button>`),e+="</div></div>"}e+="</div>"}return e}function $n(i){if(i.equipment.length===0)return'<div class="pm-evt-empty">No equipment deployed to this project.</div>';let e='<div class="pm-tab-header">Deployed Equipment</div>';for(const t of i.equipment){const n=t.condition>=75?"var(--green)":t.condition>=50?"var(--amber)":t.condition>=25?"var(--orange)":"var(--red)",o=t.condition<60;e+=`<div class="pm-eq">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${b(t.name)}</span>
                    <span class="pm-eq__qty">×${t.qty}</span>
                    ${o?'<span class="pm-eq__wear">WEAR</span>':""}
                </div>
            </div>
            <div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${t.condition}%;background:${n}"></div></div>
                <span class="pm-eq__cond-val" style="color:${n}">${t.condition}%</span>
            </div>
        </div>`}return e}function Et(i){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][i%12]}, ${2e3+Math.floor(i/12)}`}window.openProjectModal=Xt;window.closeProjectModal=mn;window.pmSetTab=un;window.pmToggleEvent=yn;window.pmSelectResponse=vn;window.pmAllocateMaterial=pn;window.pmDeallocateMaterial=fn;async function Ai(i){if(!L)return;const{data:e,error:t}=await $.from("construction_events").select("*").eq("contract_id",i).order("fired_at_tick",{ascending:!1});t?(console.warn("Failed to load project events:",t.message),L.events=[]):L.events=(e||[]).map(n=>({id:n.id,type:n.type,severity:n.severity,tick:n.fired_at_tick,title:n.title,desc:n.description,impact:n.impact,status:n.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:n.resolution,responses:n.responses||[]})),Se()}let Tt=!1;async function _n(i,e){if(!(Tt||!L)){Tt=!0;try{const{data:t,error:n}=await $.rpc("resolve_construction_event",{p_event_id:i,p_response_key:e});if(n){console.error("Failed to resolve event:",n.message),alert("Failed to submit response: "+n.message);return}const o=typeof t=="string"?JSON.parse(t):t;if(o?.error){alert("Error: "+o.error);return}await Ai(L.project.id),await zi(),o?.quality_applied&&o.quality_applied!==0&&(L.quality=Math.max(0,Math.min(100,L.quality+o.quality_applied)),L.qualityLabel=L.quality>=80?"STRONG":L.quality>=60?"PROMISING":L.quality>=40?"FAIR":"UNCERTAIN"),Se()}finally{Tt=!1}}}window.confirmEventResponse=_n;function ye(i,e,t){const n=t?` style="color:${t}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${b(i)}</span>
        <span class="cd-detail-row__value"${n}>${b(e)}</span>
    </div>`}function hn(i){const e={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},t=i.drawing_number||i.contract_number+"-A1",n=D?.current_date||"",o=n?n.replace(/,\s*/," "):"",r=i.spec_category==="Heavy Infrastructure",a=i.spec_category==="Megaproject";let d=b(i.project_subtype||i.project_type||"STRUCTURE"),l=r?"80.0m":a?"200.0m":"60.0m",s=r?"40.0m":a?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${e.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(c,f)=>`<line x1="${f*20}" y1="0" x2="${f*20}" y2="200" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(c,f)=>`<line x1="0" y1="${f*20}" x2="680" y2="${f*20}" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${e.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${e.accent}" font-family="var(--font-mono)" font-weight="700">${d.toUpperCase()}</text>
        <text x="340" y="100" text-anchor="middle" font-size="6" fill="${e.text}" font-family="var(--font-mono)">${b(i.name)}</text>

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
        <text x="645" y="93" text-anchor="middle" font-size="5.5" fill="${e.dim}" font-family="var(--font-mono)" transform="rotate(90,645,93)">${s}</text>

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
        <text x="540" y="175" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${b(t)}</text>
        <text x="500" y="185" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">SCALE</text>
        <text x="540" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">1:200</text>
        <text x="610" y="175" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">REV</text>
        <text x="630" y="175" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">01</text>
        <text x="610" y="185" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">DATE</text>
        <text x="630" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${b(o)}</text>

        <!-- North arrow -->
        <g transform="translate(470,172)">
            <line x1="0" y1="12" x2="0" y2="0" stroke="${e.accent}" stroke-width="0.8"/>
            <polygon points="-3,4 0,0 3,4" fill="${e.accent}"/>
            <text x="0" y="-3" text-anchor="middle" font-size="5" fill="${e.text}" font-family="var(--font-mono)">N</text>
        </g>
    </svg>`}async function pe(){if(!m||!m.nation_id)return;const{data:i,error:e}=await $.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(e?(console.warn("Failed to load contracts:",e.message),ze=[]):ze=i||[],Oe={},m&&ze.length>0){const t=ze.map(o=>o.id),{data:n}=await $.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",m.id).in("contract_id",t);for(const o of n||[])Oe[o.contract_id]=o}Ii()}function wn(){const i=document.getElementById("ap-list"),e=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=ee.length+" ACTIVE",ee.length===0){i.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,e.style.display="none";return}const t=D?.current_tick||0;let n=0,o=0,r="";for(const a of ee){const d=a.issuer_type==="GOVERNMENT",l=d?"gov":"private",s=Array.isArray(a.contract_bids)?a.contract_bids[0]:a.contract_bids,c=s?.bid_price||0,f=s?.estimated_cost||0,p=s?.estimated_quality||0,u=a.budget_ceiling||0,y=a.awarded_at_tick||t,v=a.stalled_ticks||0,_=Math.max(0,t-y),w=Math.max(0,_-v),k=a.timeline_ticks||8,M=Math.max(0,k-w),C=Math.min(100,Math.round(w/k*100)),T=w>k,x=v>0;Ci(a.sector);const S=Jt(a.sector);n+=u,o+=c,r+=`<div class="ap-item" onclick="openProjectModal('${a.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${b(a.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${b(a.issuer_name||"—")} · ${S}</div>
                </div>
                <span class="oc-item__type-badge ${l}">${d?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS${x?' <span style="color:var(--orange);font-weight:700;font-size:7px;">⚠ STALLED ('+v+" ticks — hire more workers)</span>":""}</span>
                    <span class="ap-budget__values" style="color:${T?"var(--red)":x?"var(--orange)":"var(--teal)"}">
                        ${w}/${k} ticks ${T?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${C}%;background:${T?"var(--red)":x?"var(--orange)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${K(c)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${K(f)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${p>=70?"var(--green)":p>=40?"var(--teal)":"var(--orange)"}">${p}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${T?"var(--red)":"var(--text-bright)"}">${M} ticks</div>
                </div>
            </div>
        </div>`}i.innerHTML=r,e.style.display=ee.length>0?"":"none",ee.length>0&&(document.getElementById("ap-total-crew").textContent=ee.length,document.getElementById("ap-total-budget").textContent=K(n),document.getElementById("ap-total-spent").textContent=K(o))}async function zi(){if(!m)return;const{data:i,error:e}=await $.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",m.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",m.id).order("awarded_at_tick",{ascending:!0});e?(console.warn("Failed to load active projects:",e.message),ee=[]):ee=i||[],wn()}const at=3e4;function st(){let i=0,e=0;for(const t of ce)for(const n of Kt){const o=G[t.key]?.[n];o&&(i+=o.qty,e+=o.value)}return{totalUnits:i,totalValue:e}}function Zt(){const i=document.getElementById("wh-list"),{totalUnits:e,totalValue:t}=st();document.getElementById("wh-count").textContent=e.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=q(t);const n=Math.round(e/at*100),o=document.getElementById("wh-capacity");o.textContent=n+"%",o.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)";let r="";for(let a=0;a<ce.length;a++){const d=ce[a],l=jt===a,s=G[d.key]?.LOW||{qty:0,value:0},c=G[d.key]?.STD||{qty:0,value:0},f=G[d.key]?.HIGH||{qty:0,value:0},p=s.qty+c.qty+f.qty,u=s.value+c.value+f.value,y=p===0,v=ke(d.key,"LOW",E),_=ke(d.key,"STD",E),w=ke(d.key,"HIGH",E),k=s.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",M=c.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",C=w.available?f.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(r+='<div class="wh-row">',r+=`<div class="wh-row__collapsed${l?" expanded":""}" onclick="toggleWhRow(${a})">
            <span class="wh-row__arrow">${l?"▾":"▸"}</span>
            <span class="wh-row__name${y?" empty":""}">${b(d.name)}</span>
            <div class="wh-row__dots">
                <div class="${k}"></div>
                <div class="${M}"></div>
                <div class="${C}"></div>
            </div>
            <span class="wh-row__qty${y?" empty":""}">${p>0?p.toLocaleString():"—"}</span>
            <span class="wh-row__val${y?" empty":""}">${u>0?q(u):"—"}</span>
        </div>`,l){r+='<div class="wh-expand">',r+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const T=[{key:"LOW",label:"Low",data:s,avail:v,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:c,avail:_,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:f,avail:w,color:"var(--green)",dotClass:"wh-dot--high"}];for(const x of T){const S=!x.avail.available,A=x.data.qty>0,h=A?"$"+Math.round(x.data.value/x.data.qty):"—";r+=`<div class="wh-grade${S?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${x.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${S?"var(--red)":x.color}">${x.label}</span>
                        ${S?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${A?"var(--text-bright)":"var(--text-dim)"}">${A?x.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${x.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${x.data.value>0?q(x.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${h}</span>
                </div>`}for(const x of T)!x.avail.available&&x.avail.failedStat&&(r+=`<div class="wh-lock">
                        <span class="wh-lock__text">${x.label.toUpperCase()} GRADE LOCKED — ${b(x.avail.failedStat)} &lt; ${x.avail.failedMin}</span>
                    </div>`);r+="</div>"}r+="</div>"}i.innerHTML=r}function kn(i){jt=jt===i?-1:i,Zt()}async function ei(){if(!m)return;const{data:i,error:e}=await $.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",m.id);if(G={},e)console.warn("Failed to load warehouse:",e.message);else if(i)for(const t of i)G[t.material_key]||(G[t.material_key]={}),G[t.material_key][t.quality_tier]={qty:t.quantity||0,value:Number(t.total_value)||0};Zt()}const En={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function Li(){const i=(E?.name||m?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+i;const e=Number(m?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=q(e);const{totalUnits:t}=st(),n=Math.round(t/at*100),o=document.getElementById("pr-wh-capacity");o.textContent=n+"%",o.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)",Ni(),ti(),rt()}function Ni(){const i=document.getElementById("pr-mat-grid");let e="";for(const t of ce){const n=j===t.key,o=Kt.every(a=>!ke(t.key,a,E).available),r="pr-mat-btn"+(n?" active":"")+(o?" all-locked":"");e+=`<span class="${r}" onclick="setPrMat('${t.key}')">${b(t.name)}</span>`}i.innerHTML=e}function ti(){const i=document.getElementById("pr-tier-bar");let e='<span class="pr-tier-label">GRADE</span>';for(const t of Kt){const n=ke(j,t,E),o=H===t,r=n.available?Qt(j,t,E):null,a=Ei[t],d=!n.available,l="pr-tier-btn"+(o?" active":"")+(d?" locked":"");e+=`<div class="${l}" onclick="${d?"":`setPrTier('${t}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${a};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${o?"var(--text-bright)":"var(--text-dim)"}">${Dt[t]}</span>
            </div>
            ${r!==null?`<div class="pr-tier-btn__price" style="color:${o?"var(--text-bright)":"var(--text-muted)"}">$${r}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}i.innerHTML=e}function rt(){const i=document.getElementById("pr-content"),e=ke(j,H,E),t=ce.find(T=>T.key===j);if(!t)return;if(!e.available){i.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${b(t.name)} — ${Dt[H]} grade
                    is not produced domestically in ${b(E?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${b(e.failedStat||"unknown")} &lt; ${e.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const n=Qt(j,H,E),o=Ti(j,H,E),r=n*te,a=o>3e3?"LOW":o>1e3?"MODERATE":"HIGH",d=a==="LOW"?"var(--green)":a==="MODERATE"?"var(--amber)":"var(--red)",l=Number(E?.inflation??50),s=l>55?"up":l<45?"down":"flat",c=s==="up"?"&#9650;":s==="down"?"&#9660;":"&#8212;",f=s==="up"?"var(--red)":s==="down"?"var(--green)":"var(--text-dim)";let p="";p+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
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
        <div class="pr-drivers__title">Price Drivers (${b(E?.name||"—")})</div>`;for(const T of t.priceDrivers){const x=Number(E?.[T]??50),S=x>=50?"var(--green)":x>=30?"var(--amber)":x>=15?"var(--orange)":"var(--red)",A=En[T]||T;p+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${b(T)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${x}%;background:${S}"></div>
            </div>
            <span class="pr-driver-row__val">${x}</span>
            <span class="pr-driver-row__effect">${b(A)}</span>
        </div>`}p+="</div>";const y=(Number(m?.corp_cash_reserves)||0)>=r,v=te>o,{totalUnits:_}=st(),w=at-_,k=te>w,M=w<=0,C=Ei[H];p+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${b(t.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${C};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${C}">${Dt[H]}</span>
                </div>
                <span class="pr-order__mat-price">$${n}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(T=>`<span class="pr-qty-btn${te===T?" active":""}" onclick="setPrQty(${T})">${T>=1e3?T/1e3+"k":T}</span>`).join("")}
                </div>
            </div>
            ${v?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${o.toLocaleString()} this tick</span>
            </div>`:""}
            ${M?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">WAREHOUSE FULL — no remaining capacity</span>
            </div>`:k?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS WAREHOUSE CAPACITY — ${w.toLocaleString()} units remaining</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${q(r)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${y&&!v&&!k&&!M?"":"disabled"}
                    title="${y?v?"Exceeds supply":M?"Warehouse full":k?"Exceeds warehouse capacity":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,i.innerHTML=p}function Tn(i){j=i,H="STD";for(const e of["STD","HIGH","LOW"])if(ke(i,e,E).available){H=e;break}Ni(),ti(),rt()}function Cn(i){H=i,ti(),rt()}function Sn(i){te=i,rt()}let Ct=!1;async function In(){if(Ct||!m||!E)return;const i=Qt(j,H,E),e=Ti(j,H,E),t=i*te,n=Number(m.corp_cash_reserves)||0;if(t>n){alert("Insufficient cash reserves.");return}if(te>e){alert("Exceeds available supply this tick.");return}const{totalUnits:o}=st(),r=at-o;if(r<=0){alert("Warehouse is full. Cannot purchase more materials.");return}if(te>r){alert(`Warehouse can only hold ${r.toLocaleString()} more units. Reduce quantity.`);return}Ct=!0;const a=document.querySelector(".pr-purchase-btn");a&&(a.disabled=!0,a.textContent="...");try{const d=n-t,{error:l}=await $.from("factions").update({corp_cash_reserves:d}).eq("id",m.id);if(l)throw l;const s=G[j]?.[H],c=(s?.qty||0)+te,f=(s?.value||0)+t,{error:p}=await $.from("corp_warehouse").upsert({faction_id:m.id,nation_id:m.nation_id,material_key:j,quality_tier:H,quantity:c,total_value:f,last_purchased_tick:D?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(p){const{error:u}=await $.from("factions").update({corp_cash_reserves:n}).eq("id",m.id);throw u&&console.error("Cash refund failed after warehouse error:",u.message),p}m.corp_cash_reserves=d,G[j]||(G[j]={}),G[j][H]={qty:c,value:f},Zt(),Li(),a&&(a.textContent="PURCHASED",setTimeout(()=>{a.isConnected&&(a.disabled=!1,a.textContent="PURCHASE")},1500))}catch(d){a&&(a.disabled=!1,a.textContent="PURCHASE"),alert("Purchase failed: "+(d.message||"Unknown error"))}finally{Ct=!1}}function qi(i){const e=Ee||E;if(!e)return[];const t=ot(i);if(!t)return[];const n=an(i,e),o=[],r=Number(e?.inflation??50),a=Number(e?.fuel_prices??50);Number(e?.manufacturing_output??50);const d=Ee&&E&&Ee.id!==E.id;let l=null;if(d&&(l=sn(e,E)),n.newAvailable>0){const s=xi(i,e),c=t.basePrice,f=Math.round(c*((r-50)/200)),p=Math.round(c*((a-50)/300));let u=s;const y=[{label:"Base price",value:q(c)},f!==0?{label:`Inflation (${r})`,mod:(f>=0?"+":"")+q(Math.abs(f))}:null,p!==0?{label:`Fuel transport (${a})`,mod:(p>=0?"+":"")+q(Math.abs(p))}:null].filter(Boolean),v=s-c-f-p;if(v!==0&&!d&&y.push({label:"Demand/scarcity",mod:(v>=0?"+":"")+q(Math.abs(v))}),d&&l){const _=Math.round(s*l.tariff),w=Math.round(s*l.transport);u=s+_+w,y.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+q(_)}),y.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+q(w)})}o.push({seller:d?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:d?l?.deliveryTicks||1:0,condition:100,price:Math.round(u),available:n.newAvailable,delivery:d?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:d?l.deliveryTicks:0,used:!1,priceFactors:y,sourceNationId:e.id})}if(n.usedAvailable>0){const s=n.usedCondition,c=xi(i,e,{used:!0,condition:s});let f=c;const p=[{label:"Base price",value:q(t.basePrice)},{label:`Condition (${s}%)`,mod:"-"+q(Math.max(0,t.basePrice-c))}];if(d&&l){const u=Math.round(c*l.tariff),y=Math.round(c*l.transport);f=c+u+y,p.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+q(u)}),p.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+q(y)})}o.push({seller:d?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:d?l?.deliveryTicks||1:0,condition:s,price:Math.round(f),available:n.usedAvailable,delivery:d?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:d?l.deliveryTicks:0,used:!0,priceFactors:p,sourceNationId:e.id})}return o}function lt(){const i=Number(m?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=q(i);const e=ot(Q),t=We[e?.tier||1],n=document.getElementById("em-tier-badge");n&&(n.textContent=t.tag,n.style.color=t.color),n.style.background=t.color+"0a",n.style.border="1px solid "+t.color+"33";const o=document.getElementById("em-nation-select");if(o&&o.options.length===0){const d=E?.name||m?.nation||"—";let l=`<option value="">${b(d)} (HQ)</option>`;for(const s of it)s.id!==E?.id&&(l+=`<option value="${s.id}">${b(s.name)}</option>`);o.innerHTML=l}const r=document.getElementById("em-import-tag"),a=Ee&&E&&Ee.id!==E.id;r&&(r.style.display=a?"":"none"),Mn(),ii()}function Mn(){let i="";for(let e=1;e<=3;e++){const t=We[e],n=Pt(e),o=e===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";i+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${t.color}">${t.tag}</div>
            <div class="${o}">`;for(const r of n){const a=Q===r.key,d=qi(r.key).length>0;i+=`<span class="em-selector__btn${a?" active":""}${d?"":" no-listings"}"
                style="${a?"background:"+t.color+";border-color:"+t.color:""}"
                onclick="setEmType('${r.key}')">${b(r.name)}</span>`}i+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${i}</div>`}function ii(){const i=document.getElementById("em-content");if(ve=qi(Q),ve.length===0){i.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}se>=ve.length&&(se=0);let e="";for(let n=0;n<ve.length;n++){const o=ve[n],r=se===n,a=o.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",d=ki(o.condition);e+=`<div class="em-listing${r?" selected":""}" style="${r?"border-left-color:"+a:""}" onclick="setEmListing(${n})">`,e+=`<div class="em-listing__row1">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="em-listing__seller">${b(o.seller)}</span>
                <span class="em-badge em-badge--${o.sellerType.toLowerCase()}">${o.sellerType}</span>
                ${o.used?'<span class="em-badge em-badge--used">USED</span>':""}
            </div>
        </div>`,e+=`<div class="em-listing__row2">
            <span class="em-listing__nation">${b((o.nation||"").toUpperCase())}</span>
            ${o.distance>0?`<span class="em-listing__distance">${o.distance} nation${o.distance>1?"s":""} away</span>`:""}
            <span class="em-listing__delivery">Delivery: ${b(o.delivery)}</span>
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
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${q(o.price)}</div>
            </div>
        </div>`,r&&o.priceFactors&&(e+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${o.priceFactors.map(l=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${b(l.label)}</span>
                    <span class="em-breakdown__mod" style="color:${l.mod?l.mod.startsWith("-")?"var(--green)":l.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${l.mod||l.value}</span>
                </div>`).join("")}
            </div>`),e+="</div>"}const t=ve[se];if(t){const n=ot(Q),o=We[n?.tier||1],r=Math.min(t.available,4),a=t.price*re,d=(Number(m?.corp_cash_reserves)||0)>=a;e+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${b(n?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${b(t.seller)}</span>
                </div>
                <span class="em-purchase__price">${q(t.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:r},(l,s)=>s+1).map(l=>`<span class="em-qty-btn${re===l?" active":""}" style="${re===l?"background:"+o.color+";border-color:"+o.color:""}" onclick="setEmQty(${l})">${l}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${t.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${q(a)}</div>
                    ${t.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${b(t.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${o.color}" onclick="purchaseEquipment()"
                    ${d?"":"disabled"}
                    title="${d?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}i.innerHTML=e}async function An(i){if(!i)Ee=null;else{let t=it.find(n=>n.id===i);if(!t)try{const{data:n}=await $.from("nations").select("*").eq("id",i).single();t=n}catch{}Ee=t||null}se=0,re=1;const e=document.getElementById("em-nation-select");e&&(e.value=i||""),lt()}function zn(i){Q=i,se=0,re=1,lt()}function Ln(i){se=i,re=1,ii()}function Nn(i){re=i,ii()}let St=!1;async function qn(){if(St)return;const i=ve[se];if(!i||!m)return;const e=ot(Q);if(!e)return;const t=re,n=i.price*t,o=Number(m.corp_cash_reserves)||0;if(n>o){alert("Insufficient cash reserves.");return}if(t>i.available){alert("Not enough units available.");return}const r=document.querySelector(".em-purchase-btn");r&&(r.disabled=!0,r.textContent="..."),St=!0;try{const a=o-n,{error:d}=await $.from("factions").update({corp_cash_reserves:a}).eq("id",m.id);if(d)throw d;const l=!i.deliveryTicks||i.deliveryTicks===0;if(l){const c=ae.find(M=>M.equipment_key===Q),f=(c?.owned||0)+t,p=c?.purchase_price_avg||0,u=c?.owned||0,y=u>0?Math.round((p*u+i.price*t)/f):i.price,v=e.maintenancePerUnit*f,_=c?.condition||100,w=Math.round((_*u+i.condition*t)/f),{error:k}=await $.from("corp_equipment").upsert({faction_id:m.id,nation_id:m.nation_id,equipment_key:Q,tier:e.tier,owned:f,deployed:c?.deployed||0,condition:w,maintenance_per_tick:v,purchase_price_avg:y,last_purchased_tick:D?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(k){const{error:M}=await $.from("factions").update({corp_cash_reserves:o}).eq("id",m.id);throw M&&console.error("Cash refund failed:",M.message),k}c?(c.owned=f,c.condition=w,c.maintenance_per_tick=v):ae.push({equipment_key:Q,tier:e.tier,owned:f,deployed:0,condition:w,maintenance_per_tick:v,assigned_projects:[]})}else{const c=(D?.current_tick||0)+i.deliveryTicks,{error:f}=await $.from("corp_equipment_deliveries").insert({faction_id:m.id,equipment_key:Q,quantity:t,condition:i.condition,delivery_tick:c,source_nation_id:i.sourceNationId||null,seller_name:i.seller,price_paid:n});if(f){const{error:p}=await $.from("factions").update({corp_cash_reserves:o}).eq("id",m.id);throw p&&console.error("Cash refund failed:",p.message),f}}m.corp_cash_reserves=a,ni(),lt();const s=document.getElementById("pr-cash");s&&(s.textContent=q(a)),r&&(r.textContent=l?"PURCHASED":"ORDERED",setTimeout(()=>{r.isConnected&&(r.disabled=!1,r.textContent="PURCHASE")},1500))}catch(a){r&&(r.disabled=!1,r.textContent="PURCHASE"),alert("Purchase failed: "+(a.message||"Unknown error"))}finally{St=!1}}let Bn=-1,Ge=[],Wt=[],Bi=[];function It(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(1)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function Rn(i,e,t){if(t)return"var(--orange)";const n=i/(e||1)*100;return n>50?"var(--green)":n>25?"var(--amber)":"var(--red)"}function On(){const i=document.getElementById("pm-list"),e=Ge.length,t=Wt.length,n=Bi.length,o=Ge.filter(l=>l.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${e})`,document.getElementById("pm-pending-count").textContent=`(${t})`,document.getElementById("pm-apply-count").textContent=`(${n})`;const r=document.getElementById("pm-badges");let a="";o>0&&(a+=`<span class="pm-badge pm-badge--expiring">${o} EXPIRING</span>`),t>0&&(a+=`<span class="pm-badge pm-badge--pending">${t} PENDING</span>`),r.innerHTML=a;const d=Ge.reduce((l,s)=>l+(s.cost||0),0)+Wt.reduce((l,s)=>l+(s.cost||0),0);document.getElementById("pm-total-cost").textContent=It(d),document.getElementById("pm-footer-active").textContent=e,document.getElementById("pm-footer-pending").textContent=t;{if(e===0){i.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let l="";Ge.forEach((s,c)=>{const f=Bn===c,p=Rn(s.ticks_left,s.total_ticks,s.expiring_soon),u=Math.min(s.ticks_left/(s.total_ticks||1)*100,100);l+=`<div class="pm-item ${s.expiring_soon?"pm-item--expiring":""} ${f?"expanded":""}" onclick="togglePmExpand(${c})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${b(s.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${b((s.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${p}">Expires: ${b(s.expires||"")}</span>
                        <span class="pm-item__ticks">(${s.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${u}%;background:${p}"></div></div>`,f&&(l+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${b(s.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${b(s.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${It(s.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${s.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${s.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(s.projects||[]).map(y=>`<span class="pm-project-chip">${b(y)}</span>`).join("")}</div>
                    </div>`,s.note&&(l+=`<div class="pm-note"><span class="pm-note__text">${b(s.note)}</span></div>`),s.expiring_soon&&s.renewable&&(l+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew">RENEW — ${It(s.cost||0)}</button></div>`),l+="</div>"),l+="</div></div>"}),i.innerHTML=l;return}}function Pn(){Ge=[],Wt=[],Bi=[],On()}let $e=[],Dn=-1;function oe(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(2)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function hi(i){return i>=85?"var(--gold)":i>=60?"var(--green)":i>=40?"var(--orange)":"var(--red)"}function jn(i){return"dl-result--"+i.toLowerCase()}function wi(){const i=document.getElementById("dl-list"),e=$e.length;document.getElementById("dl-count").textContent=`${e} COMPLETED`;const t=$e.reduce((d,l)=>{const s=l.financials||{};return d+((s.payment||0)+(s.bonus||0)-(s.penalty||0)-(s.total_cost||0))},0),n=document.getElementById("dl-lifetime-profit");n.textContent=(t>=0?"+":"")+oe(t),n.style.color=t>=0?"var(--green)":"var(--red)";const o={};$e.forEach(d=>{o[d.result]=(o[d.result]||0)+1});const r=document.getElementById("dl-footer-results");if(r.innerHTML=Object.entries(o).map(([d,l])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[d]||"var(--text-dim)"}">${b(d)}</div>
            <div class="dl-footer__result-count">${l}</div>
        </div>`).join(""),e===0){i.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let a="";$e.forEach((d,l)=>{const s=Dn===l,c=d.financials||{},f=(c.payment||0)+(c.bonus||0)-(c.penalty||0)-(c.total_cost||0),p=f>=0,u=jn(d.result),v={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[d.result]||"var(--text-dim)",_=d.type==="GOVERNMENT";if(a+=`<div class="dl-item ${s?"expanded":""}" onclick="toggleDlExpand(${l})">
            <div class="dl-item__inner" style="border-left:2px solid ${v}">
                <div class="dl-item__row1">
                    <span class="dl-item__name">${b(d.name)}</span>
                    <span class="dl-result-badge ${u}">${b(d.result)}</span>
                </div>
                <div class="dl-item__row2">
                    <span class="dl-item__id">${b(d.id)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                    <span class="dl-item__issuer" style="color:${_?"var(--green)":"var(--gold)"}">${b(d.issuer)}</span>
                    <span class="dl-item__date">${b(d.delivered)}</span>
                </div>
                <div class="dl-summary-bar">
                    <div class="dl-summary-cell" style="flex:1;">
                        <div class="dl-summary-label">QUALITY</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span class="dl-summary-value" style="color:${hi(d.quality_score)}">${d.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${d.rep_change>0?"var(--green)":d.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${d.rep_change>0?"+":""}${d.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${p?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${p?"var(--green)":"var(--red)"};margin-top:2px;">${p?"+":""}${oe(f)}</div>
                    </div>
                </div>`,s){const w=d.inspection||{};a+='<div style="margin-top:8px;">',a+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(T=>{const x=w[T]||{score:0,issues:[]},S=hi(x.score),A=Math.min(x.score/100*100,100);a+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${b(T.charAt(0).toUpperCase()+T.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${A}%;background:${S}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${S}">${x.score}</span>
                        </div>
                    </div>
                    ${(x.issues||[]).map(h=>`<div class="dl-inspect-issue">${b(h)}</div>`).join("")}
                </div>`});const k=w.permits||{passed:!0,issues:[]};a+=`<div class="dl-permits-row ${k.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${k.passed?"var(--green)":"var(--red)"}">${k.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${(k.issues||[]).map(T=>`<div class="dl-inspect-issue dl-inspect-issue--red">${b(T)}</div>`).join("")}
            </div>`,a+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',a+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(d.materials_used||[]).forEach(T=>{const x=T.grade==="HIGH"?"var(--green)":T.grade==="STANDARD"?"var(--amber)":"var(--orange)",S=T.impact==="positive"?"▲":T.impact==="negative"?"▼":"–",A=T.impact==="positive"?"var(--green)":T.impact==="negative"?"var(--red)":"var(--text-dim)";a+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${b(T.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${x}"></div>
                    <span class="dl-mat-tag__grade" style="color:${x}">${b(T.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${A}">${S}</span>
                </div>`}),a+="</div>",a+='<div class="dl-section-label">Financial Summary</div>',a+='<div class="dl-fin-panel">',a+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${oe(c.contract_value||0)}</span></div>`,(c.bonus||0)>0&&(a+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${oe(c.bonus)}</span></div>`),(c.penalty||0)>0&&(a+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${oe(c.penalty)}</span></div>`);const M=(c.payment||0)+(c.bonus||0)-(c.penalty||0);a+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${oe(M)}</span></div>`,a+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${oe(c.total_cost||0)}</span></div>`,a+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${p?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${p?"var(--green)":"var(--red)"}">${p?"+":""}${oe(f)}</span>
            </div>`,a+="</div>";const C=d.timeline||{};a+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${C.actual||0}/${C.expected||0} ticks</span>`,C.early?a+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(C.expected||0)-(C.actual||0)} TICK${C.expected-C.actual!==1?"S":""} EARLY</span>`:!C.on_time&&C.actual>C.expected&&(a+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(C.actual||0)-(C.expected||0)} TICK${C.actual-C.expected!==1?"S":""} LATE</span>`),a+="</div>",a+="</div>"}a+="</div></div>"}),i.innerHTML=a}async function Hn(){if(!m){$e=[],wi();return}const{data:i,error:e}=await $.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",m.id).order("delivered_at_tick",{ascending:!1}).limit(20);e?(console.warn("Failed to load deliveries:",e.message),$e=[]):$e=(i||[]).map(t=>{const n=t.construction_contracts||{};return{id:t.contract_id,name:n.name||"Project",type:n.issuer_type||"GOVERNMENT",issuer:n.issuer_name||"Government",delivered:"Tick "+(t.delivered_at_tick||0),result:t.result,quality_score:t.quality_score,rep_change:t.rep_change,financials:{contract_value:t.contract_value||0,bonus:t.quality_bonus||0,penalty:t.penalties||0,payment:t.payment_received||0,total_cost:t.total_cost||0},inspection:t.inspection||{},materials_used:t.materials_used||[],timeline:{expected:t.timeline_expected||0,actual:t.timeline_actual||0,on_time:t.on_time,early:t.timeline_actual<t.timeline_expected}}}),wi()}function ni(){const i=ae.reduce((d,l)=>d+(l.owned||0),0),e=ae.reduce((d,l)=>d+(l.deployed||0),0),t=on(ae),n=i-e;document.getElementById("eq-count").textContent=i+" UNITS",document.getElementById("eq-summary").innerHTML=`
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
                ${q(t)}
            </div>
        </div>`;const o={};for(const d of ae)o[d.equipment_key]=d;let r="";for(let d=1;d<=3;d++){const l=We[d],s=Pt(d),c=Ht===d,f=s.reduce((u,y)=>u+(o[y.key]?.owned||0),0),p=s.reduce((u,y)=>u+(o[y.key]?.deployed||0),0);if(r+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${d})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${c?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${l.color}">${b(l.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${l.color};border:1px solid ${l.color}33;background:${l.color}0a">${l.tag}</span>
            </div>
            ${f>0?`<span class="eq-tier-hdr__count">${p}/${f}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,c)for(const u of s){const y=o[u.key],v=y?.owned||0,_=y?.deployed||0,w=y?.condition||0,k=u.maintenancePerUnit*v,M=v-_,C=v>0&&M===0,T=v>0&&w<65,x=ki(w),S=y?.assigned_projects||[],A=S.length>0?S.map(h=>h.contract_name||"Project").join(", ").slice(0,30):v>0&&_>0?_+" project"+(_>1?"s":""):"—";r+=`<div class="eq-row${v===0?" unowned":""}">`,r+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${v===0?" dim":""}">${b(u.name)}</span>
                        ${T?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${v>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${C?"var(--orange)":"var(--green)"}">${M}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${_}/${v}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,v>0?r+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${w}%;background:${x}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${x}">${w}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${b(A)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${q(k)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:r+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',r+="</div>"}}document.getElementById("eq-list").innerHTML=r;const a=[1,2,3].map(d=>{const l=We[d],s=Pt(d).reduce((c,f)=>c+(o[f.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${s>0?l.color+"33":"var(--border-0)"};background:${s>0?l.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${l.color}">${l.tag}</div>
            <div class="eq-footer__tier-count" style="color:${s>0?"var(--text-bright)":"var(--text-dim)"}">${s}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${q(t)}</div>
        </div>
        <div class="eq-footer__tiers">${a}</div>`}function Un(i){Ht=Ht===i?-1:i,ni()}async function Gn(){if(!m)return;const{data:i,error:e}=await $.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",m.id);e?(console.warn("Failed to load equipment:",e.message),ae=[]):ae=i||[],ni()}async function Fn(){const{data:{user:i}}=await $.auth.getUser();if(!i){window.location.href="login.html";return}const{data:e}=await $.from("factions").select("*").or(`id.eq.${i.id},linked_user_id.eq.${i.id}`);Ue=(e||[]).filter(s=>s.nation_id);const t=sessionStorage.getItem("active_faction_id");if(m=Ue.find(s=>s.id===t)||Ue.find(s=>s.faction_type==="corporation")||Ue[0],!m){await $.auth.signOut(),window.location.href="login.html";return}if(m.faction_type!=="corporation"){window.location.href="dashboard.html";return}const[n,o]=await Promise.all([m.nation_id?$.from("nations").select("*").eq("id",m.nation_id).single():Promise.resolve({data:null}),$.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);n.error&&console.warn("Nation load failed:",n.error.message),n.data&&(E=n.data),o.error&&console.warn("Shard load failed:",o.error.message),D=o.data;const r=m.corp_ticker||m.abbreviation||"";if(document.getElementById("corp-logo").textContent=r.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=m.faction_name||"Unnamed Corp",D){if(document.getElementById("game-date").textContent=D.current_date||"—",document.getElementById("tick-number").textContent=D.current_tick||"—",D.next_tick_at){const c=(Number(D.tick_interval_hours)||8)*36e5,f=new Date(D.next_tick_at).getTime(),u=f-c+c/2;Ut=new Date(u>Date.now()?u:f+c/2),ln()}const s=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");s&&(s.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(r?"["+r+"]":m.faction_name||"Corp")+" ▾";const a=document.getElementById("topbar-cash");if(a){const s=Number(m.corp_cash_reserves??0),c=s>=1e9?"$"+(s/1e9).toFixed(1)+"B":s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k";a.textContent="CASH: "+c}const d=m.action_points??0;document.getElementById("topbar-ap").innerHTML='<span class="topbar-ap__count">'+d+" AP</span>",document.getElementById("nation-pill").textContent=(E?.name||m.nation||"—").toUpperCase();const l=document.getElementById("corp-faction-dropdown");if(l){let s="";for(const c of Ue){const f=c.id===m.id,p=c.faction_type==="corporation"?"CORP":"PARTY",u=c.faction_type==="corporation"?"var(--teal)":"var(--amber)";s+=`<div class="corp-dd-item${f?" active":""}" onclick="switchToFaction('${c.id}', '${c.faction_type}')">
                <span class="corp-dd-type" style="color:${u}">${p}</span>
                <span class="corp-dd-name">${b(c.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${b(c.abbreviation||"—")}]</span>
            </div>`}l.innerHTML=s}await Promise.all([pe(),zi(),ei(),Gn(),Pn(),Hn(),Ke()]);try{const{data:s}=await $.from("nations").select("*").order("name");it=s||[]}catch{it=[]}if(Li(),lt(),nn(m,E,D),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",new URLSearchParams(window.location.search).get("tab")==="expansion"){const s=document.querySelector('[data-tab="expansion"]');s&&Oi({preventDefault:()=>{},target:s})}}async function Wn(){await $.auth.signOut(),window.location.href="login.html"}function Vn(){const i=document.getElementById("corp-faction-dropdown");i&&i.classList.toggle("open")}function Yn(i,e){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.remove("open"),sessionStorage.setItem("active_faction_id",i),e==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",i=>{const e=document.getElementById("faction-switcher"),t=document.getElementById("corp-faction-dropdown");t&&e&&!e.contains(i.target)&&t.classList.remove("open")});document.addEventListener("keydown",i=>{i.key==="Escape"&&Qe()});window.doLogout=Wn;window.toggleTheme=dn;window.toggleCorpDropdown=Vn;window.switchToFaction=Yn;window.setFilter=cn;window.openContractDetail=Mi;window.closeContractDetail=Qe;window.toggleWhRow=kn;window.toggleEqTier=Un;window.switchEmNation=An;window.setEmType=zn;window.setEmListing=Ln;window.setEmQty=Nn;window.purchaseEquipment=qn;window.setPrMat=Tn;window.setPrTier=Cn;window.setPrQty=Sn;window.purchaseMaterial=In;let F={general:0,skilled:0,innovative:0},Mt=!1;const Ce=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function Ri(i){const e=Number(E?.minimum_wage??50),t=Number(E?.inflation??50),n=Number(E?.standard_of_living??50),o=e/100*48e3,r=1+(t-50)/100*.5,a=1+(n-50)/100*.5;return Math.round(o*i*r*a)}function g(i){const e=Math.abs(i),t=i<0?"-":"";return e>=1e9?t+"$"+(e/1e9).toFixed(2)+"B":e>=1e6?t+"$"+(e/1e6).toFixed(2)+"M":e>=1e3?t+"$"+(e/1e3).toFixed(1)+"k":t+"$"+e.toLocaleString()}async function Oi(i){i.preventDefault(),document.getElementById("operations-content").style.display="none";const e=document.getElementById("expansion-content");e.style.display="flex",e.style.justifyContent="center",e.style.gap="12px",e.style.alignItems="flex-start",e.style.flexWrap="wrap",document.querySelectorAll(".corp-nav__tab").forEach(t=>t.classList.remove("active")),i.target.classList.add("active"),await Ke(),ct(),Xn(),await oi(),ft(),await go(),await co(),ut(),mt(),await Eo(),yt()}function Pi(i){i&&i.preventDefault(),document.getElementById("operations-content").style.display="flex",document.getElementById("expansion-content").style.display="none",document.querySelectorAll(".corp-nav__tab").forEach(e=>e.classList.remove("active")),document.querySelector('[data-tab="operations"]')?.classList.add("active")}function dt(){return U.reduce((e,t)=>{const n=Number(t.capacity||0),o=Number(t.condition||0)/100;return e+Math.floor(n*o)},0)+500}function Qn(i,e){const t=Ce.find(r=>r.id===i),n=Number(m?.[t.factionKey]??0),o=F[i]+e;if(!(n+o<0)){if(e>0){const r=Ce.reduce((d,l)=>{const s=Number(m?.[l.factionKey]??0),c=l.id===i?o:F[l.id];return d+s+c},0),a=dt();if(r>a)return}F[i]=o,ct()}}function Kn(i){i?F[i]=0:F={general:0,skilled:0,innovative:0},ct()}async function Jn(){if(Mt||!Object.values(F).some(a=>a!==0))return;let e=0;for(const a of Ce){const d=F[a.id];d>0&&(e+=d*Ri(a.multiplier)*.1)}const t=Number(m?.corp_cash_reserves??0);if(e>t){alert("Insufficient cash reserves. Hiring cost: "+g(e)+", available: "+g(t));return}const n=Ce.reduce((a,d)=>a+Number(m?.[d.factionKey]??0)+F[d.id],0),o=dt();if(n>o){alert("Cannot hire beyond property capacity ("+o.toLocaleString()+"). You need more workplaces.");return}const r=e>0?`Confirm workforce changes?

Hiring fee: `+g(e)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(r)){Mt=!0;try{const a={};for(const s of Ce){const c=Number(m?.[s.factionKey]??0);a[s.factionKey]=Math.max(0,c+F[s.id])}e>0&&(a.corp_cash_reserves=Math.max(0,t-Math.round(e)));const{error:d}=await $.from("factions").update(a).eq("id",m.id);if(d)throw d;Object.assign(m,a),F={general:0,skilled:0,innovative:0};const l=document.getElementById("topbar-cash");if(l){const s=Number(m.corp_cash_reserves??0);l.textContent="CASH: "+(s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k")}ct()}catch(a){alert("Error: "+a.message)}finally{Mt=!1}}}function ct(){const i=document.getElementById("hf-card-container");if(!i)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=Number(E?.minimum_wage??50),o=Number(E?.inflation??50),r=Number(E?.standard_of_living??50),a=n/100*48e3,d=(1+(o-50)/100*.5).toFixed(2),l=(1+(r-50)/100*.5).toFixed(2),s=E?.name||m?.nation||"Nation",c=Object.values(F).some(k=>k!==0),f=dt();let p=0,u=0,y=0,v=0,_="";for(const k of Ce){const M=Number(m?.[k.factionKey]??0),C=F[k.id],T=M+C,x=Ri(k.multiplier),S=C>0,A=M*x,h=T*x,B=h-A;p+=M,u+=T,y+=A,v+=h;const N=C!==0?S?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";_+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${t.border};background:${N};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${k.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${k.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${t.text}">${M.toLocaleString()}</span>
                    ${C!==0?`<span style="font-family:${e};font-size:10px;color:${t.dim}">→</span>
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${S?t.greenBright:t.red}">${T.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${k.multiplier}.0 × ${d} × ${l})</span>
                <span style="font-family:${e};font-size:10px;color:${k.color}">${g(x)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${k.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.red};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-50</div>
                <div onclick="hfSetChange('${k.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.redDim};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${C!==0?t.card:"transparent"};border:1px solid ${C!==0?t.border:"transparent"}">
                    ${C!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${e};font-size:12px;font-weight:700;color:${S?t.greenBright:t.red}">${S?"+":""}${C}</span>
                        <span onclick="hfReset('${k.id}')" style="font-family:${e};font-size:8px;color:${t.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${e};font-size:9px;color:${t.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${k.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+10</div>
                <div onclick="hfSetChange('${k.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+50</div>
            </div>
            ${C!==0?`<div style="margin-top:6px;padding:4px 8px;background:${t.bg};border:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${B>0?t.red:t.greenBright}">${B>0?"+":""}${g(B)}/yr</span>
            </div>`:""}
        </div>`}const w=v-y;i.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Hire / Fire</span>
            </div>
            <span style="font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${s.toUpperCase()}</span>
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
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${r}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${l}</div>
                    </div>
                </div>
            </div>
            ${_}
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
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${w>0?t.red:t.greenBright}">${g(v)}</span>`:""}
                    </div>
                </div>
            </div>
            ${c?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${t.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">NET CHANGE</span>
                    <span style="font-family:${e};font-size:11px;font-weight:700;color:${w>0?t.red:t.greenBright}">${w>0?"+":""}${g(w)}/yr</span>
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">(${w>0?"+":""}${g(Math.round(w/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${t.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}function Xn(){const i=document.getElementById("wf-summary-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},n=(E?.name||m?.nation||"Nation").toUpperCase(),o=Number(E?.minimum_wage??50),r=Number(E?.inflation??50),a=Number(E?.standard_of_living??50),d=o/100*48e3,l=1+(r-50)/100*.5,s=1+(a-50)/100*.5,c=[{label:"General Workforce",mult:2,color:t.accent,key:"corp_general_workforce",countColor:t.text},{label:"Skilled Workforce",mult:3,color:t.gold,key:"corp_skilled_workforce",countColor:t.blue},{label:"Innovative Workforce",mult:6,color:t.orange,key:"corp_innovative_workforce",countColor:t.gold}];let f=0,p=0,u="";for(const y of c){const v=Number(m?.[y.key]??0),_=Math.round(d*y.mult*l*s),w=v*_;f+=v,p+=w,u+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${y.label}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${n}</span>
                </div>
                <span style="font-family:${e};font-size:16px;font-weight:700;color:${y.countColor}">${v.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${y.mult}.0 × ${l.toFixed(2)} × ${s.toFixed(2)})</span>
                <span style="font-family:${e};font-size:10px;color:${t.muted}">${g(_)}/yr</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">TOTAL ANNUAL COST</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${g(w)}</span>
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
                    <span style="font-family:${e};font-size:9px;color:${t.text}">×${s.toFixed(2)}</span>
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
    </div>`}let U=[];async function Ke(){if(!m?.id)return;const{data:i}=await $.from("corp_properties").select("*").eq("faction_id",m.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});U=i||[]}function pt(){const i=document.getElementById("property-card-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=(E?.name||m?.nation||"Nation").toUpperCase(),o=1+(Number(E?.inflation??50)-50)/100*.3;let r="",a=0,d=0;const l=E?.name||m?.nation||"Home Nation",s=5e7,c=1+(Number(E?.inflation??50)-50)/100*.3,f=.8+Number(E?.stability??50)/100*.4,p=Math.round(s*c*f),u=Math.round(p*.005);a+=p,d+=u,r+=`
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
    </div>`;for(const y of U){const v=nt[y.style]||nt.Basic;a+=Number(y.purchase_price||0),d+=Number(y.monthly_maintenance||0),r+=`
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
            ${r}
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
    </div>`}let Le=[],V=null;const nt={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function oi(){if(!m?.nation_id)return;const{data:i,error:e}=await $.from("available_properties").select("*").eq("nation_id",m.nation_id).eq("status","available").order("price",{ascending:!0});if(e){console.warn("[Property] Failed to load marketplace:",e.message);return}Le=(i||[]).map(t=>({...t,adjusted_cost:t.price,adjusted_maintenance:t.monthly_maintenance}))}function ft(){const i=document.getElementById("new-property-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"};(E?.name||m?.nation||"Nation").toUpperCase();const n=Number(E?.standard_of_living??50),o=Number(E?.gdp_growth??50),r=Number(E?.inflation??50),a=E?.capital||"Capital",d={capital:a,port:a+" Port",industrial:a+" Industrial Zone",suburban:a+" Suburbs",coastal:a+" Coast"};let l="";if(Le.length===0)l=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let s=0;s<Le.length;s++){const c=Le[s],f=V===s,p=nt[c.style]||nt.Basic,u=d[c.city_template]||a;l+=`
            <div onclick="npSelect(${s})" style="padding:8px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${f?t.accent:"transparent"};background:${f?"rgba(139,154,107,0.03)":"transparent"};">
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
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${Le.length} AVAILABLE</span>
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
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${r<=50?t.greenBright:t.red}">${Math.round(r)}</span>
            </div>
        </div>
        <div style="flex:1;overflow:auto;">
            ${l}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;gap:6px;justify-content:space-between;">
                <div onclick="npOpenConstructionModal()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${t.gold};border:1px solid ${t.gold}44;cursor:pointer">CONSTRUCTION PROJECT</div>
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${V!==null?"#000":t.dim};background:${V!==null?t.accent:"transparent"};border:1px solid ${V!==null?t.accent:t.border};cursor:${V!==null?"pointer":"default"};opacity:${V!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function Zn(i){V=V===i?null:i,ft()}let At=!1;async function eo(){if(V===null||At)return;const i=Le[V];if(!i)return;const e=Number(m?.corp_cash_reserves??0);if(i.adjusted_cost>e){alert(`Insufficient cash reserves.
Property: `+g(i.adjusted_cost)+`
Cash: `+g(e));return}if(confirm('Buy "'+i.name+'" for '+g(i.adjusted_cost)+`?

Monthly maintenance: `+g(i.adjusted_maintenance)+`/mo
Condition: `+i.condition+`%

This will be deducted from your cash reserves.`)){At=!0;try{const{error:t}=await $.from("corp_properties").insert({faction_id:m.id,nation_id:m.nation_id,catalog_id:i.catalog_id||null,name:i.name,type:i.type,style:i.style,capacity:i.capacity,purchase_price:i.adjusted_cost,monthly_maintenance:i.adjusted_maintenance,condition:i.condition,city:i.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(t)throw t;const n=Math.max(0,e-i.adjusted_cost),{error:o}=await $.from("factions").update({corp_cash_reserves:n}).eq("id",m.id);if(o)throw o;m.corp_cash_reserves=n,i.id&&await $.from("available_properties").update({status:"sold",purchased_by:m.id}).eq("id",i.id);const r=document.getElementById("topbar-cash");r&&(r.textContent="CASH: "+(n>=1e6?"$"+(n/1e6).toFixed(1)+"M":"$"+Math.round(n/1e3)+"k")),V=null,await oi(),ft(),pt(),alert("Property purchased: "+i.name+`

Deducted: `+g(i.adjusted_cost))}catch(t){alert("Purchase failed: "+t.message)}finally{At=!1}}}const _e={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let ai=!1,I={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},zt=!1;function Di(){const e=1+(Number(E?.inflation??50)-50)/100*.3,t=_e[I.style]?.costMod||1,n=I.type==="Warehouse"?.75:1,o=Math.round(I.size*1e5*e*t*n),r=Math.round(o*(1+I.budgetMod/100)),a=Math.round(r*.007*(_e[I.style]?.maintMod||1));return{baseBudget:o,adjusted:r,maint:a,inflMod:e,styleMod:t}}function to(){ai=!0,I={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},ji()}function si(){ai=!1,document.getElementById("cp-modal-overlay")?.remove()}function io(i,e){I[i]=e,ji()}async function no(){if(!(zt||!I.name.trim())){zt=!0;try{const i=Di(),e=E?.name||m?.nation||"Unknown",t=_e[I.style]?.repGain||1,n=await $.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),o=n.data?.current_tick||0,r=(n.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:a}=await $.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",m.nation_id).eq("issuer_type","PRIVATE"),l=`PVT-C${(a||0)+1}-${r}`,{error:s}=await $.from("construction_contracts").insert({nation_id:m.nation_id,template_key:"custom_building",sector:"civil_engineering",name:I.name.trim(),description:`${I.type} (${I.style}) — ${I.size.toLocaleString()} employees, commissioned by ${m.faction_name}`,project_code:l,budget_ceiling:i.adjusted,timeline_ticks:I.timeline,required_materials:(()=>{const c=I.size/1e3,f=I.style,p={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[f]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},u=(y,v)=>Math.max(1,Math.ceil(c*y*v));return{concrete:u(8,p.concrete),steel:u(6,p.steel),glass_facades:u(3,p.glass),em_systems:u(4,p.em),lumber:u(1,p.lumber),heavy_parts:u(2,p.heavy),aggregate:u(3,p.agg)}})(),required_equipment:(()=>{const c=["work_trucks","concrete_mixers"];return I.size>1e3&&c.push("excavators","tower_cranes"),I.size>3e3&&c.push("bulldozers","heavy_haulers"),I.size>8e3&&c.push("pile_drivers"),c})(),required_workforce:{general:Math.ceil(I.size*.08),skilled:Math.ceil(I.size*.03)},status:"open",generated_at_tick:o,bidding_ends_tick:o+3,issuer_type:"PRIVATE",issuer_name:m.faction_name,issuer_faction_id:m.id});if(s)throw s;si(),alert(`Construction project submitted!

Project: `+I.name.trim()+`
Code: `+l+`
Budget: `+g(i.adjusted)+`
Expected Reputation: +`+t+`

All construction corporations in `+e+" can now bid on this project.")}catch(i){alert("Failed to submit project: "+i.message)}finally{zt=!1}}}function ji(){if(document.getElementById("cp-modal-overlay")?.remove(),!ai)return;const i="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=Di(),n=E?.name||m?.nation||"Nation",o=_e[I.style]?.repGain||1,r=o>=4?e.gold:o>=3?e.greenBright:o>=2?e.accent:e.dim,a=Object.entries(_e).map(([s,c])=>{const f=I.style===s;return`<div onclick="cpSetField('style','${s}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${f?c.color+"18":"transparent"};border:1px solid ${f?c.color+"44":e.border};">
            <div style="font-family:${i};font-size:9px;font-weight:700;color:${f?c.color:e.dim}">${s}</div>
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
                <input id="cp-name-input" value="${I.name.replace(/"/g,"&quot;")}" placeholder="e.g., McKenna Tower"
                    style="width:100%;padding:6px 10px;font-family:${i};font-size:11px;color:${e.text};background:${e.card};border:1px solid ${e.border};outline:none;box-sizing:border-box;" />
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Type</div>
                <div style="display:flex;gap:4px;">
                    ${["Regional HQ","Office Building",...m?.corp_sector==="Construction"?["Warehouse"]:[]].map(s=>`<span onclick="cpSetField('type','${s}')" style="flex:1;text-align:center;padding:5px 0;font-family:${i};font-size:9px;font-weight:700;cursor:pointer;color:${I.type===s?"#000":e.dim};background:${I.type===s?s==="Warehouse"?e.orange:e.accent:"transparent"};border:1px solid ${I.type===s?s==="Warehouse"?e.orange:e.accent:e.border}">${s}</span>`).join("")}
                </div>
                ${I.type==="Warehouse"?`<div style="font-family:${i};font-size:7px;color:${e.orange};margin-top:4px;">Warehouse: 75% construction cost, stores up to $20M in materials</div>`:""}
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
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">${a}</div>
                <div style="margin-top:4px;font-family:${i};font-size:8px;color:${_e[I.style].color}">${_e[I.style].desc}</div>
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
                        <span style="font-family:${i};font-size:9px;color:${e.muted}">${g(t.baseBudget)}</span>
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
                    <span style="font-family:${i};font-size:16px;font-weight:700;color:${r}">+${o}</span>
                </div>
                <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:2px">${I.style} style · ${o===5?"Maximum prestige":o>=4?"Impressive presence":o>=3?"Strong statement":o>=2?"Solid investment":"Functional addition"}</div>
            </div>

        </div>
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${i};font-size:7px;color:${e.dim}">TOTAL PROJECT</div>
                <div style="font-family:${i};font-size:14px;font-weight:700;color:${e.gold}">${g(t.adjusted)}</div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="cpClose()" style="padding:5px 16px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:5px 16px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${e.gold};cursor:pointer;opacity:${I.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(d);const l=document.getElementById("cp-name-input");l&&l.addEventListener("input",s=>{I.name=s.target.value}),d.addEventListener("click",s=>{s.target===d&&si()})}function oo(){const i=document.getElementById("cp-name-input");if(i&&(I.name=i.value),!I.name.trim()){alert("Please enter a building name.");return}no()}window.cpClose=si;window.cpSetField=io;window.cpSubmitFromModal=oo;window.npSelect=Zn;window.npBuyProperty=eo;window.npOpenConstructionModal=to;let Re=!1;async function ao(i){if(Re)return;const e=U.find(d=>d.id===i);if(!e)return;const t=1+(Number(E?.inflation??50)-50)/100*.3,n=Math.round((e.purchase_price||0)*.1*t),o=Number(m?.corp_cash_reserves??0);if(n>o){alert("Insufficient cash. Refurbishment costs "+g(n)+" (inflation-adjusted), you have "+g(o));return}if(e.condition>=95){alert("Property is already in excellent condition ("+e.condition+"%).");return}const r=5+Math.floor(Math.random()*21),a=Math.min(100,e.condition+r);if(confirm('Refurbish "'+e.name+`"?

Cost: `+g(n)+`
Expected improvement: +`+r+"% condition ("+e.condition+"% → "+a+"%)")){Re=!0;try{await $.from("corp_properties").update({condition:a}).eq("id",i);const d=Math.max(0,o-n);await $.from("factions").update({corp_cash_reserves:d}).eq("id",m.id),m.corp_cash_reserves=d;const l=document.getElementById("topbar-cash");l&&(l.textContent="CASH: "+(d>=1e6?"$"+(d/1e6).toFixed(1)+"M":"$"+Math.round(d/1e3)+"k")),await Ke(),pt(),alert("Refurbished! Condition: "+e.condition+"% → "+a+"%")}catch(d){alert("Refurbishment failed: "+d.message)}finally{Re=!1}}}async function so(i){if(Re)return;const e=U.find(r=>r.id===i);if(!e)return;const t=1+(Number(E?.inflation??50)-50)/100*.3,n=(e.condition||50)/100,o=Math.round((e.purchase_price||0)*.6*n*t);if(confirm('Sell "'+e.name+`"?

Sale value: `+g(o)+" (60% × "+e.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){Re=!0;try{await $.from("corp_properties").update({is_active:!1}).eq("id",i);const a=Number(m?.corp_cash_reserves??0)+o;await $.from("factions").update({corp_cash_reserves:a}).eq("id",m.id),m.corp_cash_reserves=a;const l=(await $.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await $.from("available_properties").insert({nation_id:m.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,price:Math.round(o*1.1),monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,generated_at_tick:l,expires_at_tick:l+6,status:"available"});const s=document.getElementById("topbar-cash");s&&(s.textContent="CASH: "+(a>=1e6?"$"+(a/1e6).toFixed(1)+"M":"$"+Math.round(a/1e3)+"k")),await Ke(),pt(),await oi(),ft(),alert('Sold "'+e.name+'" for '+g(o))}catch(r){alert("Sale failed: "+r.message)}finally{Re=!1}}}window.propRefurbish=ao;window.propSell=so;const xe={SALE:.8,DISSOLVE:.6,REVENUE_BASE:.02,GDP_NEUTRAL:30,DEFAULT_REPUTATION:25};function ro(i){if(!i)return 0;const e=i.trim().replace(/[$,]/g,""),t=e.match(/^([\d.]+)\s*[Mm]$/),n=e.match(/^([\d.]+)\s*[Kk]$/);return Math.round(t?parseFloat(t[1])*1e6:n?parseFloat(n[1])*1e3:parseFloat(e))}function Pe(i){const e=document.getElementById("topbar-cash");e&&(e.textContent="CASH: "+(i>=1e6?"$"+(i/1e6).toFixed(1)+"M":"$"+Math.round(i/1e3)+"k"))}function lo(i){return De.find(e=>e.id===i)?.name||"—"}function ri(i){return U.filter(e=>e.nation_id===i)}async function li(){Ne=0,await Ke(),pt(),mt(),ut()}let ne=!1,Ne=0,et={};async function co(){if(m?.id)try{const{data:i}=await $.from("construction_contracts").select("nation_id").eq("awarded_to_faction",m.id).in("status",["in_progress","awarded"]);et={};for(const e of i||[])e.nation_id&&(et[e.nation_id]=(et[e.nation_id]||0)+1)}catch{}}function Hi(i){const e=ri(i.nation_id),t=e.reduce((y,v)=>y+Number(v.purchase_price||0),0),n=e.reduce((y,v)=>y+Number(v.capacity||0),0),o=et[i.nation_id]||0,r=De.find(y=>y.id===i.nation_id),a=(i.name||"").trim().split(/\s+/),d=a.length>=2?a.map(y=>y[0]).join("").toUpperCase().slice(0,4):(i.name||"SUB").slice(0,4).toUpperCase(),l=Number(i.sub_cash||0),s=Number(r?.gdp_growth??50),c=l*xe.REVENUE_BASE,f=(s-xe.GDP_NEUTRAL)/100,p=xe.DEFAULT_REPUTATION/100,u=l>0?Math.round(c*(1+f)*p):0;return{id:i.id,name:i.name,abbr:d,nation:r?.name||i.city||"—",nationId:i.nation_id,sector:m?.corp_sector||"General",subsector:i.subsector||m?.corp_subsector||"—",revenue:u,debt:0,cash:l,reputation:xe.DEFAULT_REPUTATION,valuation:t,workforce:n,projects:o,established:i.created_at?new Date(i.created_at).getFullYear().toString():"—",trend:s>=40&&l>0?"up":s>=xe.GDP_NEUTRAL&&l>0?"flat":"down",profitable:u>0}}function mt(){const i=document.getElementById("manage-subsidiaries-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},o=U.filter(c=>c.type==="regional_hq").map(Hi);Ne>=o.length&&(Ne=0);const r=o[Ne]||null;let a="";o.length===0&&(a=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No subsidiaries established.<br>Use Create Subsidiary to expand.</div>`);let d=0,l=0;for(let c=0;c<o.length;c++){const f=o[c],p=c===Ne;d+=f.revenue,l+=f.valuation;const u=f.trend==="up"?t.greenBright:f.trend==="down"?t.red:t.dim,y=f.trend==="up"?"▲":f.trend==="down"?"▼":"–";a+=`
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
        </div>`}let s="";if(r){const c=r.trend==="up"?t.greenBright:r.trend==="down"?t.red:t.dim,f=r.trend==="up"?"▲":r.trend==="down"?"▼":"–",p=r.trend==="up"?"Growing":r.trend==="down"?"Declining":"Stable",u=r.reputation>=40?t.accent:r.reputation>=25?t.yellow:t.orange,y=[{label:"Revenue",value:g(r.revenue),color:r.profitable?t.greenBright:t.redDim},{label:"Cash",value:g(r.cash),color:t.text},{label:"Debt",value:r.debt>0?g(r.debt):"$0",color:r.debt>0?t.orange:t.dim},{label:"Reputation",value:r.reputation+"/100",color:u},{label:"Market Valuation",value:g(r.valuation),color:t.gold},{label:"Workforce",value:r.workforce.toLocaleString(),color:t.text},{label:"Active Projects",value:r.projects.toString(),color:r.projects>0?t.text:t.dim}],v=r.projects===0;s=`
            <div style="padding:8px 14px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                    <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.gold}">${r.abbr}</span>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${r.name}</span>
                </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${r.nation.toUpperCase()}</span>
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">Est. ${r.established}</span>
                    <span style="font-family:${e};font-size:8px;color:${c}">${f} ${p}</span>
                </div>
            </div>
            ${y.map(_=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 14px;border-bottom:1px solid ${t.border};">
                <span style="font-family:${e};font-size:9px;color:${t.dim};letter-spacing:0.5px;text-transform:uppercase">${_.label}</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;color:${_.color}">${_.value}</span>
            </div>`).join("")}
            <div style="padding:6px 14px;border-bottom:1px solid ${t.border};flex-shrink:0;">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                    <span style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">REPUTATION</span>
                    <span style="font-family:${e};font-size:8px;color:${t.muted}">75% sub / 25% parent</span>
                </div>
                <div style="width:100%;height:4px;background:${t.border}"><div style="width:${r.reputation}%;height:100%;background:${u}"></div></div>
            </div>
            <div style="flex:1"></div>
            <div style="padding:6px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                <div style="font-family:${e};font-size:8px;letter-spacing:1.5px;color:${t.dim};text-transform:uppercase;margin-bottom:6px">Actions</div>
                <div style="display:flex;gap:4px;margin-bottom:4px;">
                    <div onclick="subInjectCapital('${r.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${t.greenBright};border:1px solid ${t.greenDark};background:rgba(74,170,136,0.06)">INJECT CAPITAL</div>
                    <div onclick="subWithdraw('${r.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${r.cash>0?t.gold:t.dim};border:1px solid ${r.cash>0?t.gold+"44":t.border};opacity:${r.cash>0?1:.4}">WITHDRAW</div>
                </div>
                <div style="display:flex;gap:4px;">
                    <div onclick="subMerge('${r.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${t.accent};border:1px solid ${t.accent}">MERGE</div>
                    <div onclick="subSell('${r.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${t.orange};border:1px solid ${t.orange}">SELL</div>
                    <div onclick="${v?"subDissolve('"+r.id+"')":""}" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${v?t.red:t.dim};border:1px solid ${v?t.red:t.border};opacity:${v?1:.3}">DISSOLVE</div>
                </div>
                ${r.projects>0?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${t.dim}">Cannot dissolve with active projects.</div>`:""}
            </div>`}else s=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a subsidiary to manage.</div>`;i.innerHTML=`
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
                ${s}
            </div>
        </div>
    </div>`}async function Ui(i,e){if(ne)return;const t=U.find(u=>u.id===i);if(!t)return;const n=e==="sell",o=n?xe.SALE:xe.DISSOLVE,r=n?"SELL":"DISSOLVE",a=n?"sold":"dissolved",d=n?"80%":"60%",l=lo(t.nation_id),s=ri(t.nation_id),c=s.reduce((u,y)=>u+Math.round((y.purchase_price||0)*o*(y.condition||50)/100),0),f=Number(t.sub_cash||0),p=c+f;if(confirm(r+' subsidiary "'+t.name+`"?

`+s.length+" properties at "+d+` × condition:
  Property value: `+g(c)+`
  Subsidiary cash: `+g(f)+`
  ─────────────────
  Total return: `+g(p)+`

All operations in `+l+` cease.
This cannot be undone.`)){ne=!0;try{const u=s.map(v=>v.id);if(u.length===1){const{error:v}=await $.from("corp_properties").update({is_active:!1}).eq("id",u[0]);if(v)throw v}else if(u.length>1){const{error:v}=await $.from("corp_properties").update({is_active:!1}).in("id",u);if(v)throw v}await $.from("corp_properties").update({sub_cash:0}).eq("id",i).then(()=>{}).catch(()=>{});const y=Number(m?.corp_cash_reserves??0)+p;await $.from("factions").update({corp_cash_reserves:y}).eq("id",m.id),m.corp_cash_reserves=y,Pe(y),await li(),alert("Subsidiary "+a+". "+s.length+` properties liquidated.
Total received: `+g(p))}catch(u){alert("Failed: "+u.message)}finally{ne=!1}}}function po(i){Ui(i,"sell")}function fo(i){Ui(i,"dissolve")}async function Gi(i,e){if(ne)return;const t=U.find(f=>f.id===i);if(!t)return;const n=Number(m?.corp_cash_reserves??0),o=Number(t.sub_cash||0),r=e?"WITHDRAW":"INJECT CAPITAL";if(e&&o<=0){alert("This subsidiary has no cash to withdraw.");return}const a=e?o:n,d=prompt(r+(e?" from ":" into ")+t.name+`

Parent cash: `+g(n)+`
Subsidiary cash: `+g(o)+`

Enter amount (e.g., 5000000 or 5M):`);if(!d)return;const l=ro(d);if(!l||l<=0||isNaN(l)){alert("Invalid amount.");return}if(l>a){alert("Insufficient "+(e?"subsidiary":"parent")+" cash. Available: "+g(a));return}const s=e?n+l:n-l,c=e?o-l:o+l;if(confirm(r+" "+g(l)+(e?" from ":" into ")+t.name+`?

Parent: `+g(n)+" → "+g(s)+`
Subsidiary: `+g(o)+" → "+g(c))){ne=!0;try{await Promise.all([$.from("factions").update({corp_cash_reserves:s}).eq("id",m.id),$.from("corp_properties").update({sub_cash:c}).eq("id",i)]),m.corp_cash_reserves=s,t.sub_cash=c,Pe(s),mt(),alert((e?"Withdrew ":"Injected ")+g(l)+(e?" from ":" into ")+t.name+".")}catch(f){alert("Failed: "+f.message)}finally{ne=!1}}}function mo(i){Gi(i,!1)}function uo(i){Gi(i,!0)}async function yo(i){if(ne)return;const e=U.find(v=>v.id===i);if(!e)return;const t=Hi(e);t.nation;const n=ri(e.nation_id),o=t.valuation,r=t.cash,a=t.reputation,d=t.subsector,l=Math.round(o*2.25),s=Math.round(a*.1),c=Math.round(a*.2),f=dt(),p=Ce.reduce((v,_)=>v+Number(m?.[_.factionKey]??0),0),u=Math.max(0,f-p),y=Number(m?.corp_cash_reserves??0);if(l>y){alert(`Insufficient cash to acquire subsidiary.

Acquisition cost (2.25× valuation): `+g(l)+`
Available cash: `+g(y));return}if(t.projects>0){alert("Cannot merge — subsidiary has "+t.projects+" active project(s). Complete or abandon them first.");return}if(confirm('MERGE "'+e.name+`" INTO YOUR CORPORATION

Acquisition cost (2.25× valuation): `+g(l)+`
Subsidiary cash absorbed: `+g(r)+`
Net cost: `+g(l-r)+`

• `+n.length+` properties transferred to parent
• Subsidiary subsector "`+d+`" added to portfolio
• Workers hired to max capacity (+`+u.toLocaleString()+`)
• Reputation: +`+s+" or -"+c+" (from sub rep "+a+`)

This cannot be undone.`)){ne=!0;try{const v=m.nation_id;if(n.length>0){const S=n.filter(h=>h.id!==e.id).map(h=>h.id);if(S.length===1){const{error:h}=await $.from("corp_properties").update({nation_id:v,type:"office"}).eq("id",S[0]);if(h)throw h}else if(S.length>1){const{error:h}=await $.from("corp_properties").update({nation_id:v,type:"office"}).in("id",S);if(h)throw h}const{error:A}=await $.from("corp_properties").update({nation_id:v,type:"office",sub_cash:0,subsector:null}).eq("id",e.id);if(A)throw A}const _=y-l+r,k=Number(m?.corp_general_workforce??0)+u,M=Math.random()>=.5?s:-c,C=Number(m?.standing??50),T=Math.max(0,Math.min(100,C+M)),{error:x}=await $.from("factions").update({corp_cash_reserves:_,corp_general_workforce:k,standing:T}).eq("id",m.id);if(x)throw x;m.corp_cash_reserves=_,m.corp_general_workforce=k,m.standing=T,Pe(_),await li(),alert(`Merger complete!

"`+e.name+`" absorbed into your corporation.
Cost: `+g(l)+" | Cash absorbed: "+g(r)+`
Reputation `+(M>=0?"+":"")+M+" (now "+T+`)
Workers hired: +`+u.toLocaleString()+` general workforce
Properties: `+n.length+" transferred to parent")}catch(v){alert("Merge failed: "+v.message)}finally{ne=!1}}}window.subDissolve=fo;window.subInjectCapital=mo;window.subWithdraw=uo;window.subMerge=yo;window.subSell=po;window.selectSubsidiary=function(i){Ne=i,mt()};let De=[],Fe={},J=null,Lt=!1,Ie="",Ve="",Me="";const vo={Construction:[{id:"civil",name:"Civil Engineering",mod:0},{id:"industrial",name:"Industrial Construction",mod:.25},{id:"mega",name:"Megaprojects",mod:.4}],Finance:[{id:"banking",name:"Banking",mod:0},{id:"insurance",name:"Insurance",mod:.15},{id:"investment",name:"Investment Management",mod:.3}],Technology:[{id:"software",name:"Software Development",mod:0},{id:"hardware",name:"Hardware Manufacturing",mod:.2},{id:"telecom",name:"Telecommunications",mod:.35}],Energy:[{id:"oil_gas",name:"Oil & Gas",mod:0},{id:"renewables",name:"Renewables",mod:.2},{id:"mining",name:"Mining",mod:.3}],Healthcare:[{id:"pharma",name:"Pharmaceuticals",mod:0},{id:"hospitals",name:"Hospital Systems",mod:.2},{id:"biotech",name:"Biotechnology",mod:.35}]};async function go(){const{data:i,error:e}=await $.from("nations").select("*").order("name");e&&console.warn("[Subsidiary] Failed to load nations:",e.message),De=(i||[]).filter(n=>n.id!==m?.nation_id);const{data:t}=await $.from("factions").select("nation_id").eq("faction_type","corporation").is("abandoned_at",null);Fe={};for(const n of t||[])n.nation_id&&(Fe[n.nation_id]=(Fe[n.nation_id]||0)+1);Me=m?.corp_subsector||""}function Fi(){const i=m?.corp_sector||"";return vo[i]||[{id:"general",name:i||"General",mod:0}]}function xo(){const e=Fi().find(t=>t.name===Me);return e?e.mod:0}function Vt(i){const e=Number(i.standard_of_living??50);return Math.max(.5,Math.round(e/50*100)/100)}function Wi(i){const t=1+xo(),n=Vt(i);return Math.round(Math.max(1e7,5e7*t*n))}function bo(i){const e=Fe[i]||0;return e<=1?{label:"HIGH",color:"#5c5"}:e<=3?{label:"MODERATE",color:"#ca5"}:{label:"LOW",color:"#c55"}}function $o(i){if(J=J===i?null:i,J){const e=De.find(t=>t.id===J);Ie=(m?.faction_name||"Subsidiary")+" "+(e?.name||"")}else Ie="";ut()}function _o(i){Me=i,ut()}function ho(i){Ie=i}function wo(i){Ve=i.toUpperCase().slice(0,4)}async function ko(){if(Lt||!J)return;const i=De.find(a=>a.id===J);if(!i)return;const e=(Ie||"").trim(),t=(Ve||"").trim();if(!e){alert("Please enter a corporation name for the subsidiary.");return}if(t.length<2){alert("Please enter an abbreviation (2-4 chars).");return}if(U.find(a=>a.nation_id===i.id&&a.type==="regional_hq")){alert("You already have a subsidiary in "+i.name);return}const o=Wi(i),r=Number(m?.corp_cash_reserves??0);if(o>r){alert("Insufficient cash. Entry cost: "+g(o)+", available: "+g(r));return}if(confirm("Establish subsidiary in "+i.name+`?

Name: `+e+" ("+t+`)
Subsector: `+(Me||"General")+`
Entry cost: `+g(o)+`
Creates a Regional HQ (500 capacity)
Unlocks `+i.name+` for operations

Deducted from cash reserves.`)){Lt=!0;try{const d=(await $.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0,l=85+Math.floor(Math.random()*16),s=Math.round(o*.005),{error:c}=await $.from("corp_properties").insert({faction_id:m.id,nation_id:i.id,name:e,type:"regional_hq",style:"Modern",capacity:500,purchase_price:o,monthly_maintenance:s,condition:l,city:i.capital||i.name,purchased_at_tick:d,is_active:!0,subsector:Me||m?.corp_subsector||null});if(c)throw c;const f=Math.max(0,r-o);await $.from("factions").update({corp_cash_reserves:f}).eq("id",m.id),m.corp_cash_reserves=f,Pe(f),J=null,Ie="",Ve="",await li(),alert('Subsidiary "'+e+'" established in '+i.name+`!

Cost: `+g(o)+`
Regional HQ created with `+l+"% condition.")}catch(a){alert("Failed: "+a.message)}finally{Lt=!1}}}function ut(){const i=document.getElementById("create-subsidiary-container");if(!i)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=m?.corp_sector||"General",o=m?.corp_subsector||"",r=Fi(),a=r.find(x=>x.name===Me)||r[0],d=new Set(U.filter(x=>x.type==="regional_hq").map(x=>x.nation_id)),l=De.filter(x=>!d.has(x.id)),s=J?l.find(x=>x.id===J):null,c=Ie.trim().length>0&&Ve.trim().length>=2&&s!==null;let f=`
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
            ${r.map(x=>{const S=x.name===Me,A=x.name===o;return`<div onclick="subSetSubsector('${x.name.replace(/'/g,"\\'")}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${S?t.accent+"18":"transparent"};border:1px solid ${S?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:8px;font-weight:700;color:${S?t.accentBright:t.dim}">${x.name}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${A?t.greenBright:x.mod>0?t.orange:t.dim}">${A?"SAME — ±0%":x.mod>0?"+"+Math.round(x.mod*100)+"%":"±0%"}</div>
                </div>`}).join("")}
        </div>
    </div>`,u="";if(l.length===0)u=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Subsidiaries in all available nations.</div>`;else for(const x of l){const S=x.id===J,A=bo(x.id),h=Fe[x.id]||0,B=Math.round(Number(x.standard_of_living??50)),N=Vt(x);u+=`
            <div onclick="subSelectNation('${x.id}')" style="display:flex;align-items:center;padding:4px 8px;margin-bottom:2px;cursor:pointer;background:${S?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${S?t.accent+"44":t.border};border-left:${S?"2px solid "+t.accent:"2px solid transparent"};">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:11px;font-weight:600;color:${S?t.text:t.muted}">${x.name}</span>
                        <span style="font-family:${e};font-size:7px;font-weight:700;padding:0 4px;color:${A.color};background:${A.color}12;border:1px solid ${A.color}25;line-height:12px">${A.label}</span>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:2px;">
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">STD/LIVING: <span style="color:${t.muted}">${B}</span></span>
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">CORPS: <span style="color:${h>=4?t.red:h>=2?t.yellow:t.greenBright}">${h}</span></span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${N>1?t.orange:t.greenBright}">×${N.toFixed(2)}</div>
                </div>
            </div>`}let y=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="margin-bottom:6px;">
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Corporation Name</div>
            <input type="text" value="${(Ie||"").replace(/"/g,"&quot;")}" oninput="subSetName(this.value)" placeholder="e.g., ${(m?.faction_name||"Corp")+" "+(s?.name||"International")}" style="width:100%;padding:5px 8px;font-family:${e};font-size:10px;color:${t.text};background:${t.card};border:1px solid ${t.border};outline:none;box-sizing:border-box;" />
        </div>
        <div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Abbreviation (2-4 chars)</div>
            <input type="text" value="${(Ve||"").replace(/"/g,"&quot;")}" oninput="subSetAbbr(this.value)" placeholder="${(m?.faction_name||"CORP").slice(0,2).toUpperCase()+(s?.name||"XX").slice(0,2).toUpperCase()}" maxlength="4" style="width:80px;padding:5px 8px;font-family:${e};font-size:12px;font-weight:700;color:${t.gold};background:${t.card};border:1px solid ${t.border};outline:none;text-align:center;letter-spacing:2px;" />
        </div>
    </div>`;const v=[{rule:"Bid on projects in that nation",icon:"✓",color:t.greenBright},{rule:"Hires local workers at nation rates",icon:"✓",color:t.greenBright},{rule:"Must use parent's materials & vehicles",icon:"!",color:t.orange},{rule:"Reputation gain: 75% sub / 25% parent",icon:"◐",color:t.gold},{rule:"Market revenue at 50% parent rate",icon:"◐",color:t.gold},{rule:"Counts as domestic corporation",icon:"✓",color:t.greenBright},{rule:"Starting reputation: 25",icon:"●",color:t.muted}];let _=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsidiary Rules</div>
        <div style="background:${t.card};border:1px solid ${t.border};padding:6px 8px;">
            ${v.map((x,S)=>`<div style="display:flex;align-items:center;gap:6px;padding:2px 0;${S<v.length-1?"border-bottom:1px solid "+t.border:""}">
                <span style="font-family:${e};font-size:9px;color:${x.color};width:12px;text-align:center">${x.icon}</span>
                <span style="font-size:9px;color:${t.muted}">${x.rule}</span>
            </div>`).join("")}
        </div>
    </div>`;const w=5e7,k=a.mod,M=s?Vt(s):null,C=s?Wi(s):null;let T=`
    <div style="background:${t.bg};border:1px solid ${t.border};padding:6px 8px;margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">BASE</span>
            <span style="font-family:${e};font-size:9px;color:${t.muted}">${g(w)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">SUBSECTOR (${a.name})</span>
            <span style="font-family:${e};font-size:9px;color:${k===0?t.greenBright:t.orange}">${k===0?"±0%":"+"+Math.round(k*100)+"%"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">NATION (${s?s.name:"—"})</span>
            <span style="font-family:${e};font-size:9px;color:${s?M>1?t.orange:t.greenBright:t.dim}">${s?"×"+M.toFixed(2):"—"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:3px 0;">
            <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.text}">TOTAL COST</span>
            <span style="font-family:${e};font-size:14px;font-weight:700;color:${t.gold}">${s?g(C):"—"}</span>
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
            ${_}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            ${T}
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">IMMEDIATE PAYMENT</span>
                <div onclick="subCreate()"
                    onmouseover="this.style.filter='brightness(1.2)';this.style.transform='scale(1.02)'"
                    onmouseout="this.style.filter='';this.style.transform=''"
                    onmousedown="this.style.transform='scale(0.97)'"
                    onmouseup="this.style.transform='scale(1.02)'"
                    style="padding:6px 22px;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${c?"#000":t.dim};background:${c?t.gold:t.surface};border:1px solid ${c?t.gold:t.border};cursor:pointer;opacity:${c?1:.5};transition:all 0.1s ease;user-select:none">CREATE SUBSIDIARY</div>
            </div>
        </div>
    </div>`}window.subSelectNation=$o;window.subCreate=ko;window.subSetName=ho;window.subSetAbbr=wo;window.subSetSubsector=_o;let tt=[],he=0,Z="ALL",ge="REPUTATION";async function Eo(){const{data:i}=await $.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name");tt=(i||[]).map(e=>({...e,abbr:e.corp_ticker||e.abbreviation||e.faction_name?.slice(0,4).toUpperCase()||"???",status:(e.corp_company_type||"Private").toUpperCase(),isPlayer:!!e.linked_user_id,reputation:50,revenue:e.status==="PUBLIC"?Number(e.corp_cash_reserves||0)*.1:null,valuation:e.status==="PUBLIC"?Number(e.corp_cash_reserves||0)*3:null}))}function To(i){he=i,yt()}function Co(i){Z=i,he=0,yt()}function So(i){ge=i,he=0,yt()}function yt(){const i=document.getElementById("corporations-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n={PUBLIC:{color:t.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:t.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:t.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},o=[...new Set(tt.map(p=>p.nation).filter(Boolean))];let r=[...tt];Z!=="ALL"&&(r=r.filter(p=>p.nation===Z)),ge==="REPUTATION"?r.sort((p,u)=>(u.reputation||0)-(p.reputation||0)):ge==="REVENUE"?r.sort((p,u)=>(u.revenue||0)-(p.revenue||0)):ge==="VALUATION"&&r.sort((p,u)=>(u.valuation||0)-(p.valuation||0)),he>=r.length&&(he=0);const a=r[he]||null,d=a&&a.status==="PRIVATE",l=a&&a.status==="STATE";let s="";r.length===0&&(s=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No corporations found.</div>`);for(let p=0;p<r.length;p++){const u=r[p],y=p===he,v=n[u.status]||n.PRIVATE,_=u.status==="PRIVATE";s+=`
        <div onclick="corpSelect(${p})" style="display:flex;align-items:center;padding:6px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${y?t.accent:"transparent"};background:${y?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:36px;font-family:${e};font-size:9px;font-weight:700;color:${t.gold}">${u.abbr}</span>
            <div style="flex:1.3;">
                <div style="font-size:10px;font-weight:600;color:${t.text};line-height:1.2">${u.faction_name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${u.corp_subsector||u.corp_sector||"—"}</div>
            </div>
            <span style="width:55px"><span style="font-family:${e};font-size:7px;padding:1px 4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(u.nation||"—").toUpperCase().slice(0,6)}</span></span>
            <span style="width:50px;font-family:${e};font-size:8px;font-weight:700;color:${_?t.dim:t.muted};text-align:right">${_?"—":g(u.revenue)}</span>
            <span style="width:30px;font-family:${e};font-size:9px;font-weight:700;color:${u.reputation>=70?t.greenBright:u.reputation>=40?t.accent:t.yellow};text-align:right">${u.reputation}</span>
            <span style="width:50px;font-family:${e};font-size:8px;color:${_?t.dim:t.muted};text-align:right">${_?"—":g(u.valuation)}</span>
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
            <span onclick="corpFilterNation('ALL')" style="padding:2px 7px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${Z==="ALL"?"#000":t.dim};background:${Z==="ALL"?t.accent:"transparent"};border:1px solid ${Z==="ALL"?t.accent:t.border}">ALL</span>
            ${o.map(p=>`<span onclick="corpFilterNation('${p}')" style="padding:2px 7px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${Z===p?"#000":t.dim};background:${Z===p?t.accent:"transparent"};border:1px solid ${Z===p?t.accent:t.border}">${p}</span>`).join("")}
        </div>
        <div style="flex:1"></div>
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">SORT</span>
            ${["REPUTATION","REVENUE","VALUATION"].map(p=>`<span onclick="corpSort('${p}')" style="padding:2px 7px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${ge===p?"#000":t.dim};background:${ge===p?t.accent:"transparent"};border:1px solid ${ge===p?t.accent:t.border}">${p}</span>`).join("")}
        </div>
    </div>`;i.innerHTML=`
    <div style="width:760px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Corporations</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${tt.length} IN DATABASE</span>
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
                <div style="flex:1;overflow:auto;">${s}</div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${c}
            </div>
        </div>
    </div>`}window.corpSelect=To;window.corpFilterNation=Co;window.corpSort=So;let ie=null,le={},P=120,de=15,Yt={},qe=[];async function Io(){if(!Te)return;if(Oe[Te.id]){alert("You already have a bid on this contract. Retract it first if you want to re-bid.");return}ie=Te,Yt={};try{const{data:t}=await $.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",m.id);for(const n of t||[])Yt[n.material_key]=Number(n.quantity||0)}catch{}qe=[];try{const{data:t}=await $.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",ie.id).in("status",["pending","won"]);qe=(t||[]).filter(n=>n.faction_id!==m?.id).map(n=>({name:n.factions?.faction_name||"Unknown",ticker:n.factions?.corp_ticker||"???",price:Number(n.bid_price||0),quality:Number(n.estimated_quality||0),status:n.status}))}catch{}le={};const i=ie.required_materials||{};for(const t of Object.keys(i))le[t]="STD";const e=ie.required_workforce||{};P=Number(e.general||0)+Number(e.skilled||0)||120,de=15,Qe(),vt()}function di(){document.getElementById("bid-assembly-overlay")?.remove(),ie=null}function Mo(i,e){le[i]=e,vt()}function Ao(i){P=i,vt()}function zo(i){de=i,vt()}function vt(){if(document.getElementById("bid-assembly-overlay")?.remove(),!ie)return;const i="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=ie,n=t.issuer_type==="GOVERNMENT",o=E?.name||m?.nation||"—",r=Number(t.budget_ceiling||0),a=Number(t.timeline_ticks||8),d=t.required_materials||{},l=Object.keys(d),s={LOW:.5,STD:1,HIGH:2},c={LOW:e.orange,STD:e.yellow,HIGH:e.greenBright},f={LOW:"Low",STD:"Standard",HIGH:"High"},p={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},u=Yt||{};let y=0,v="";for(const z of l){const O=Number(d[z]||0),mi=le[z]||"STD",ui=p[z]||3e5,Ki=s[mi],Ji=Math.round(ui*Ki),yi=O*Ji;y+=yi;const Xi=z.replace(/_/g," ").replace(/\b\w/g,ue=>ue.toUpperCase()),vi=Number(u[z]||0),wt=Math.max(0,O-vi),Zi=wt===0?e.greenBright:wt<O?e.yellow:e.red,en=wt===0?"✓ IN STOCK":`${vi}/${O}`;v+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${e.text}">${Xi}</span>
                <div style="font-family:${i};font-size:7px;color:${Zi};margin-top:1px">${en}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${i};font-size:9px;color:${e.muted}">${O.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(ue=>{const kt=mi===ue,gi=c[ue],tn=g(Math.round(ui*s[ue]));return`<span onclick="bidSetGrade('${z}','${ue}')" style="padding:2px 6px;font-family:${i};font-size:7px;font-weight:700;cursor:pointer;color:${kt?"#000":e.dim};background:${kt?gi:"transparent"};border:1px solid ${kt?gi:e.border}" title="${tn}/unit">${f[ue]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${i};font-size:10px;color:${e.text}">${g(yi)}</span></div>
        </div>`}const _=t.required_workforce||{},w=Number(_.general||0)+Number(_.skilled||0)||100,k=Math.max(40,Math.round(w*.5)),M=w*2,C=[k,Math.round(w*.75),w,Math.round(w*1.5),M],T=Math.max(0,Math.min(1,(P-k)/(M-k||1))),x=a,S=Math.round(4.5-T*8),A=Math.max(Math.round(x*.6),x+S),h=S>0?`+${S}mo`:S<0?`${S}mo`:"On schedule",B=S>0?e.red:S<0?e.greenBright:e.yellow,N=15200,R=P*N*A,Y=r,He=[{name:"Municipal Zoning Approval",cost:18e4,ticks:2,required:!0},{name:"Structural Engineering Cert.",cost:24e4,ticks:3,required:!0},{name:"Environmental Impact Assessment",cost:34e4,ticks:8,required:Y>2e7},{name:"Seismic Resilience Compliance",cost:21e4,ticks:4,required:Y>5e7},{name:"Heritage Conservation Review",cost:16e4,ticks:6,required:!1},{name:"Fire Safety Certification",cost:12e4,ticks:2,required:Y>1e7}].filter(z=>z.required),ci=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),xt=He.filter(z=>!ci.has(z.name)).reduce((z,O)=>z+O.cost,0),bt=4e5,$t=y+R+xt+bt,pi=Math.round($t*(de/100)),Je=$t+pi,W=Je>r,_t=pi,fe=W?0:Math.max(0,Math.min(100,Math.round(100-Je/r*100+30))),fi=fe>70?e.greenBright:fe>40?e.yellow:fe>0?e.orange:e.red,Yi=W?"OVER CEILING":fe>70?"STRONG":fe>40?"COMPETITIVE":fe>20?"WEAK":"UNLIKELY",ht=Object.values(le),me=ht.length>0?Math.round(ht.reduce((z,O)=>z+(O==="HIGH"?85:O==="STD"?65:45),0)/ht.length):50,Xe=me>=75?e.greenBright:me>=55?e.yellow:e.orange,Qi=me>=75?"STRONG":me>=55?"PROMISING":"UNCERTAIN",Ae=document.createElement("div");Ae.id="bid-assembly-overlay",Ae.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",Ae.addEventListener("click",z=>{z.target===Ae&&di()}),Ae.innerHTML=`
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
                <span style="font-family:${i};font-size:9px;color:${e.muted}">Ceiling: <span style="color:${e.text};font-weight:700">${g(r)}</span></span>
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
                            ${C.map(z=>`<span onclick="bidSetWorkers(${z})" style="padding:2px 8px;font-family:${i};font-size:8px;font-weight:700;cursor:pointer;color:${P===z?"#000":e.dim};background:${P===z?e.accent:"transparent"};border:1px solid ${P===z?e.accent:e.border}">${z}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">${P} × $${N.toLocaleString()}/tick × ${A} ticks</span>
                        <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${g(R)}</span>
                    </div>
                    <div style="margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <span style="font-family:${i};font-size:8px;color:${e.dim}">WORKFORCE REQUIRED</span>
                        </div>
                        <div style="display:flex;gap:12px;">
                            <span style="font-family:${i};font-size:7px;color:#8b9a6b">General: ${Math.ceil(P*.8)}</span>
                            <span style="font-family:${i};font-size:7px;color:#c8a832">Skilled: ${Math.ceil(P*.15)}</span>
                            <span style="font-family:${i};font-size:7px;color:#c84">Innovative: ${Math.ceil(P*.05)}</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">COMPLETION TIMELINE</span>
                        <span style="font-family:${i};font-size:10px;font-weight:700;color:${B}">${A}mo <span style="font-size:8px;opacity:0.7">(${h})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${He.map(z=>{const O=ci.has(z.name);return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
                        <div style="flex:1;display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${i};font-size:8px;font-weight:700;color:${O?e.greenBright:e.orange}">${O?"✓":"○"}</span>
                            <span style="font-size:10px;color:${O?e.muted:e.text}">${z.name}</span>
                        </div>
                        ${O?`<span style="font-family:${i};font-size:8px;color:${e.greenBright}">HELD</span>`:`<div style="text-align:right">
                                <span style="font-family:${i};font-size:9px;color:${e.redDim}">${g(z.cost)}</span>
                                <span style="font-family:${i};font-size:7px;color:${e.dim};margin-left:4px">${z.ticks}t</span>
                            </div>`}
                    </div>`}).join("")}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${i};font-size:9px;color:${e.muted}">PERMIT COSTS</span>
                    <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${g(xt)}</span>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${i};font-size:9px;color:${e.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${g(bt)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v:y},{l:"Labor",v:R},{l:"Permits",v:xt},{l:"Overhead",v:bt}].map(z=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-size:10px;color:${e.muted}">${z.l}</span>
                    <span style="font-family:${i};font-size:10px;color:${e.redDim}">${g(z.v)}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:rgba(204,85,85,0.03);">
                    <span style="font-family:${i};font-size:10px;font-weight:700;color:${e.text}">TOTAL EST. COST</span>
                    <span style="font-family:${i};font-size:13px;font-weight:700;color:${e.red}">${g($t)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.gold};text-transform:uppercase">Set Markup</span>
                </div>
                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="font-family:${i};font-size:9px;color:${e.dim}">MARKUP %</span>
                        <span style="font-family:${i};font-size:16px;font-weight:700;color:${e.gold}">${de}%</span>
                    </div>
                    <input type="range" min="0" max="40" step="1" value="${de}" oninput="bidSetMarkup(+this.value)" style="width:100%;accent-color:${e.gold};height:6px;" />
                    <div style="display:flex;justify-content:space-between;font-family:${i};font-size:7px;color:${e.dim};margin-top:2px;">
                        <span>0% (at cost)</span><span>40% (maximum)</span>
                    </div>
                </div>

                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${W?"rgba(204,85,85,0.04)":"rgba(200,168,50,0.03)"};">
                    <div style="font-family:${i};font-size:8px;color:${e.dim};margin-bottom:4px">YOUR BID PRICE</div>
                    <div style="font-family:${i};font-size:22px;font-weight:700;color:${W?e.red:e.gold}">${g(Je)}</div>
                    ${W?`<div style="font-family:${i};font-size:8px;font-weight:700;color:${e.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${g(r)})</div>`:""}
                </div>

                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">PROJECTED PROFIT</span>
                        <span style="font-family:${i};font-size:14px;font-weight:700;color:${_t>0?e.greenBright:e.dim}">+${g(_t)}</span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Bid Assessment</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">COMPETITIVENESS</span>
                        <span style="font-family:${i};font-size:11px;font-weight:700;color:${fi}">${Yi}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${fe}%;height:100%;background:${fi}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${i};font-size:11px;font-weight:700;color:${Xe}">${me}</span>
                            <span style="font-family:${i};font-size:8px;color:${e.dim}">/100</span>
                            <span style="font-family:${i};font-size:8px;font-weight:700;color:${Xe}">${Qi}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${me}%;height:100%;background:${Xe}"></div></div>
                    <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${qe.length===0?`<div style="font-family:${i};font-size:8px;color:${e.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${qe.map(z=>`<span style="padding:2px 6px;font-family:${i};font-size:7px;color:${e.muted};background:${e.card};border:1px solid ${e.border};">${z.name} <span style="color:${e.dim}">Q:${z.quality}</span></span>`).join("")}
                        </div>
                        <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:3px">${qe.length} competing bid${qe.length!==1?"s":""}. Bid prices are sealed until resolution.</div>`}
                    <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:3px">Higher reputation bidders may win at higher prices.</div>
                </div>
                <div style="flex:1"></div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">YOUR BID</div><div style="font-family:${i};font-size:14px;font-weight:700;color:${W?e.red:e.gold}">${g(Je)}</div></div>
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">EST. PROFIT</div><div style="font-family:${i};font-size:14px;font-weight:700;color:${e.greenBright}">+${g(_t)}</div></div>
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${i};font-size:14px;font-weight:700;color:${Xe}">${me}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${i};font-size:10px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="${W?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${i};font-size:10px;font-weight:700;letter-spacing:1px;color:${W?e.dim:"#000"};background:${W?e.border:e.gold};cursor:${W?"not-allowed":"pointer"};opacity:${W?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(Ae)}let Nt=!1;async function Lo(){if(Nt||!ie)return;const i=ie,e=i.required_materials||{},t=Object.keys(e),n=Number(i.budget_ceiling||0),o=Number(i.timeline_ticks||8),r={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},a={LOW:.5,STD:1,HIGH:2};let d=0;for(const N of t){const R=Number(e[N]||0),Y=le[N]||"STD",je=r[N]||3e5;d+=R*Math.round(je*a[Y])}const l=15200,s=i.required_workforce||{},c=Number(s.general||0)+Number(s.skilled||0)||100,f=Math.max(40,Math.round(c*.5)),p=c*2,u=Math.max(0,Math.min(1,(P-f)/(p-f||1))),y=Math.round(4.5-u*8),v=Math.max(Math.round(o*.6),o+y),_=P*l*v,w=n,k=[{name:"Municipal Zoning Approval",cost:18e4,required:!0},{name:"Structural Engineering Cert.",cost:24e4,required:!0},{name:"Environmental Impact Assessment",cost:34e4,required:w>2e7},{name:"Seismic Resilience Compliance",cost:21e4,required:w>5e7},{name:"Fire Safety Certification",cost:12e4,required:w>1e7}],M=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),C=k.filter(N=>N.required&&!M.has(N.name)).reduce((N,R)=>N+R.cost,0),x=d+_+C+4e5,S=Math.round(x*(de/100)),A=x+S;if(A>n){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const h=Object.values(le),B=h.length>0?Math.round(h.reduce((N,R)=>N+(R==="HIGH"?85:R==="STD"?65:45),0)/h.length):50;if(confirm('Submit bid for "'+i.name+`"?

Bid Price: `+g(A)+`
Est. Cost: `+g(x)+`
Markup: `+de+"% ("+g(S)+`)
Quality: `+B+`/100
Workers: `+P+`

Once submitted, your bid cannot be changed.`)){Nt=!0;try{const{data:N}=await $.from("shard").select("current_tick").eq("name","Alpha Shard").single(),R=N?.current_tick||0,Y={};for(const He of t)Y[He]=le[He]||"STD";const{error:je}=await $.from("contract_bids").insert({contract_id:i.id,faction_id:m.id,bid_price:A,material_grades:Y,labor_count:P,markup_pct:de,estimated_cost:x,estimated_quality:B,status:"pending",submitted_at_tick:R});if(je)throw je;i.status==="open"&&await $.from("construction_contracts").update({status:"bidding"}).eq("id",i.id).eq("status","open"),di(),alert(`Bid submitted successfully!

Contract: `+i.name+`
Your Bid: `+g(A)+`
Quality: `+B+`/100

Bids will be resolved when the bidding window closes (`+(i.bidding_ends_tick?"tick "+i.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof pe=="function"&&await pe()}catch(N){alert("Bid submission failed: "+N.message)}finally{Nt=!1}}}window.openBidAssembly=Io;window.closeBidAssembly=di;window.bidSetGrade=Mo;window.bidSetWorkers=Ao;window.bidSetMarkup=zo;window.submitBidAssembly=Lo;let qt=!1;async function No(i){if(qt)return;const e=1e6,t=Number(m?.corp_cash_reserves??0);if(t<e){alert("Cannot retract — you need at least $1M in cash reserves to cover the retraction penalty.");return}if(confirm(`Retract your bid?

This will cost $1M as a retraction penalty.
This action cannot be undone.`)){qt=!0;try{const n=t-e,{error:o}=await $.from("factions").update({corp_cash_reserves:n}).eq("id",m.id);if(o)throw o;const{error:r}=await $.from("contract_bids").delete().eq("contract_id",i).eq("faction_id",m.id);if(r)throw r;m.corp_cash_reserves=n,typeof Pe=="function"&&Pe(n),alert("Bid retracted. $1M penalty applied."),Qe(),await pe()}catch(n){alert("Failed to retract bid: "+(n.message||"Unknown error"))}finally{qt=!1}}}window.retractBid=No;let Ye=[],we=0,X=null,Bt=!1,Rt=!1,Ot=!1;async function qo(){if(!Te||Rt)return;Rt=!0,X=Te,we=0;const{data:i,error:e}=await $.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",X.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(Rt=!1,e){alert("Failed to load bids: "+e.message);return}Ye=(i||[]).map(t=>({...t,corp:t.factions?.faction_name||"Unknown",abbr:t.factions?.corp_ticker||"???",subsector:t.factions?.corp_subsector||"—"})),Qe(),Vi()}function gt(){document.getElementById("bid-review-overlay")?.remove(),X=null}function Bo(i){we=i,Vi()}async function Ro(){if(Bt||Ye.length===0)return;const i=Ye[we];if(!(!i?.id||!i.faction_id)&&confirm("Accept bid from "+i.corp+`?

Bid Price: `+g(i.bid_price)+`
Quality: `+i.estimated_quality+`/100
Workers: `+i.labor_count+`

This will award the contract. The project begins immediately.`)){Bt=!0;try{const{data:e}=await $.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{error:n}=await $.from("contract_bids").update({status:"won"}).eq("id",i.id);if(n)throw n;const{error:o}=await $.from("contract_bids").update({status:"lost"}).eq("contract_id",X.id).neq("id",i.id);if(o)throw o;const{error:r}=await $.from("construction_contracts").update({status:"awarded",awarded_to_faction:i.faction_id,awarded_at_tick:t}).eq("id",X.id);if(r)throw r;gt(),alert("Contract awarded to "+i.corp+`!

Bid: `+g(i.bid_price)+`
Project begins immediately.`),typeof pe=="function"&&await pe()}catch(e){alert("Failed to accept bid: "+(e.message||e))}finally{Bt=!1}}}async function Oo(){if(!(!X||Ot)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){Ot=!0;try{const{error:i}=await $.from("contract_bids").update({status:"lost"}).eq("contract_id",X.id);if(i)throw i;const{error:e}=await $.from("construction_contracts").update({status:"expired"}).eq("id",X.id);if(e)throw e;gt(),alert("All bids declined. Contract cancelled."),typeof pe=="function"&&await pe()}catch(i){alert("Failed: "+(i.message||i))}finally{Ot=!1}}}function Vi(){if(document.getElementById("bid-review-overlay")?.remove(),!X||Ye.length===0)return;const i="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=X,n=Ye;we>=n.length&&(we=0);const o=n[we],r=Number(t.budget_ceiling||0),a=Number(t.timeline_ticks||36),d=Math.min(...n.map(u=>u.bid_price)),l=Math.max(...n.map(u=>u.estimated_quality||0));let s="";for(let u=0;u<n.length;u++){const y=n[u],v=u===we,_=y.bid_price===d,w=(y.estimated_quality||0)===l,k=y.bid_price>r;s+=`
        <div onclick="reviewSelectBid(${u})" style="padding:10px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${v?e.accent:"transparent"};background:${v?"rgba(139,154,107,0.03)":"transparent"};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-family:${i};font-size:10px;font-weight:700;color:${e.gold}">${y.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${e.text}">${y.corp}</span>
                ${_?`<span style="font-family:${i};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.greenBright};background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2)">CHEAPEST</span>`:""}
                ${w?`<span style="font-family:${i};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.2)">BEST QUALITY</span>`:""}
            </div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};">
                <div style="flex:1.2;padding:5px 10px;border-right:1px solid ${e.border}">
                    <div style="font-family:${i};font-size:7px;color:${e.dim}">BID PRICE</div>
                    <div style="font-family:${i};font-size:14px;font-weight:700;color:${k?e.red:e.text}">${g(y.bid_price)}</div>
                    ${k?`<div style="font-family:${i};font-size:7px;color:${e.red}">OVER BUDGET</div>`:""}
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
        </div>`}const c=o.bid_price>r,f=r>0?Math.round(o.bid_price/r*100):0,p=document.createElement("div");p.id="bid-review-overlay",p.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",p.addEventListener("click",u=>{u.target===p&&gt()}),p.innerHTML=`
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
                <span>Budget: <span style="color:${e.text};font-weight:700">${g(r)}</span></span>
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
                ${s}
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
    </div>`,document.body.appendChild(p)}window.openBidReview=qo;window.closeBidReview=gt;window.reviewSelectBid=Bo;window.acceptBid=Ro;window.declineAllBids=Oo;window.switchToExpansion=Oi;window.switchToOperations=Pi;window.hfSetChange=Qn;window.hfReset=Kn;window.hfConfirm=Jn;document.querySelector('[data-tab="operations"]')?.addEventListener("click",function(i){this.classList.contains("active")||(i.preventDefault(),Pi(i))});Fn();
