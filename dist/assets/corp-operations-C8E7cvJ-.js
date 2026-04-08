import{_ as $}from"./supabase-client-BXEzLDpS.js";import{e as b}from"./utils-C2W-HleY.js";import{initMessaging as on}from"./messaging-B5Fng3EZ.js";import{c as an,a as Ht,E as Xe,b as ct,d as Ei,e as sn,f as rn,h as bi}from"./equipment-DsuDdEne.js";const Ti={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},ye=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"manufacturing_output",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:50},{stat:"higher_education",min:40}]}},priceDrivers:["manufacturing_output","inflation","fuel_prices","urbanization"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:10}]},STD:{requirements:[{stat:"manufacturing_output",min:35},{stat:"rare_minerals",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:40},{stat:"higher_education",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","inflation","fuel_prices"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"arable_land",min:10}]},STD:{requirements:[{stat:"arable_land",min:30},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"arable_land",min:50},{stat:"manufacturing_output",min:30}]}},priceDrivers:["arable_land","physical_infrastructure","inflation"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"rare_minerals",min:15},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"rare_minerals",min:35},{stat:"manufacturing_output",min:25}]}},priceDrivers:["rare_minerals","physical_infrastructure","inflation"]},{key:"em",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:15}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"digital_infrastructure",min:25}]},HIGH:{requirements:[{stat:"manufacturing_output",min:55},{stat:"digital_infrastructure",min:50},{stat:"energy_generation",min:40}]}},priceDrivers:["manufacturing_output","digital_infrastructure","inflation","energy_generation"]},{key:"glass",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:20}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"digital_infrastructure",min:40},{stat:"higher_education",min:50}]}},priceDrivers:["manufacturing_output","standard_of_living","inflation"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"oil_and_gas",min:10}]},STD:{requirements:[{stat:"oil_and_gas",min:30},{stat:"manufacturing_output",min:25}]},HIGH:{requirements:[{stat:"oil_and_gas",min:45},{stat:"manufacturing_output",min:40},{stat:"physical_infrastructure",min:40}]}},priceDrivers:["oil_and_gas","manufacturing_output","inflation","fuel_prices"]},{key:"heavy",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:40},{stat:"rare_minerals",min:30}]},STD:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:45},{stat:"higher_education",min:40}]},HIGH:{requirements:[{stat:"manufacturing_output",min:75},{stat:"rare_minerals",min:60},{stat:"higher_education",min:55},{stat:"digital_infrastructure",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","higher_education","digital_infrastructure"]}];function Ae(i,e,t){const n=ye.find(s=>s.key===i);if(!n)return{available:!1,failedStat:"unknown_material"};const o=n.tiers[e];if(!o)return{available:!1,failedStat:"unknown_tier"};for(const s of o.requirements){const a=Number(t?.[s.stat]??0);if(a<s.min)return{available:!1,failedStat:s.stat,failedMin:s.min,nationValue:a}}return{available:!0}}function Xt(i,e,t){const o={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em:{LOW:400,STD:700,HIGH:1200},glass:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy:{LOW:800,STD:1400,HIGH:2400}}[i]?.[e];if(!o)return 0;const s=ye.find(l=>l.key===i);if(!s)return o;let a=1;for(const l of s.priceDrivers){const d=Number(t?.[l]??50);l==="inflation"||l==="fuel_prices"?a*=1+(d-50)/200:a*=1-(d-50)/250}return a=Math.max(.4,Math.min(2.5,a)),Math.round(o*a)}function Ci(i,e,t){const o={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em:{LOW:1e3,STD:700,HIGH:300},glass:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy:{LOW:400,STD:200,HIGH:80}}[i]?.[e]||0,a=ye.find(r=>r.key===i)?.priceDrivers?.[0],d=.3+(a?Number(t?.[a]??50):50)/50*.7;return Math.round(o*d)}const Zt=["LOW","STD","HIGH"],Ut={LOW:"Low",STD:"Standard",HIGH:"High"};let Qe=[],f=null,E=null,j=null,je=[],Fe={},ae=[],F={},Gt=-1,H="concrete",U="STD",se=500,J=[],Wt=0,ee="trucks",pe=0,fe=1,we=[],ze=null,lt=[],Ft=null,at=null,Vt="ALL",Yt="TIMELINE";function B(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(1)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i}function ln(i){if(i>=12){const e=Math.floor(i/12),t=i%12;return t>0?e+"y "+t+"mo":e+"y"}return i+" ticks"}function te(i){return Math.abs(i)>=1e9?"$"+(i/1e9).toFixed(1)+"B":Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(0)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i}function ei(i){return i==="civil_engineering"?"CIVIL":i==="industrial"?"INDUSTRIAL":i==="mega_project"?"MEGA":i?.toUpperCase()||"—"}function Si(i){return i==="civil_engineering"?"light":i==="industrial"?"heavy":i==="mega_project"?"mega":"light"}function dn(){at&&clearInterval(at),at=setInterval(()=>{if(!Ft)return;const i=Ft-Date.now();if(i<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(at);return}const e=Math.floor(i/36e5),t=Math.floor(i%36e5/6e4),n=Math.floor(i%6e4/1e3);document.getElementById("tick-countdown").textContent=e+"h "+t+"m "+n+"s"},1e3)}function cn(){document.body.classList.toggle("light-mode");const i=document.getElementById("theme-toggle");i.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function pn(i,e){i==="type"&&(Vt=e),i==="sort"&&(Yt=e),document.querySelectorAll(`.filter-pill[data-filter="${i}"]`).forEach(t=>{t.classList.toggle("active",t.dataset.value===e)}),Mi()}const $i={"Civil Engineering":"civil_engineering","Industrial Construction":"industrial",Megaprojects:"mega_project"};function Ii(i){if(!f)return!1;if($i[f.corp_subsector]===i.sector)return!0;const t=(G||[]).filter(n=>n.type==="regional_hq"&&n.is_active&&n.nation_id===i.nation_id);for(const n of t)if($i[n.subsector]===i.sector)return!0;return!1}function Mi(){const i=document.getElementById("oc-list");let e=[...je];if(Vt==="GOVERNMENT"?e=e.filter(o=>o.issuer_type==="GOVERNMENT"):Vt==="PRIVATE"&&(e=e.filter(o=>o.issuer_type==="PRIVATE")),Yt==="TIMELINE"&&e.sort((o,s)=>(o.timeline_ticks||0)-(s.timeline_ticks||0)),Yt==="BUDGET"&&e.sort((o,s)=>(s.budget_ceiling||0)-(o.budget_ceiling||0)),document.getElementById("oc-count").textContent=e.length+" AVAILABLE",e.length===0){i.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const t=j?.current_tick||0;let n="";for(const o of e){const s=o.issuer_type==="GOVERNMENT",a=s?"gov":"private",l=Ii(o),d=l?"":" locked",r=Si(o.sector),c=ei(o.sector),m=(o.timeline_ticks||0)>18?" warn":"",p=o.bidding_ends_tick?Math.max(0,o.bidding_ends_tick-t):"?";n+=`
            <div class="oc-item${d}" data-contract-id="${o.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${b(o.name)}</span>
                    <span class="oc-item__type-badge ${a}">${s?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${a}">${b(o.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${p} tick${p!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${te(o.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${m}">${ln(o.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${r}">${c}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${Fe[o.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${te(Fe[o.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${l?"yes":"no"}">${l?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${l?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openContractDetail(contracts.find(x=>x.id==='${o.id}'))">VIEW</button>`:""}
                </div>
                ${o.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${b(o.description)}</div>`:""}
            </div>`}i.innerHTML=n,i.querySelectorAll(".oc-item:not(.locked)").forEach(o=>{o.addEventListener("click",()=>{const s=o.dataset.contractId,a=je.find(l=>l.id===s);a&&Ai(a)})})}let Ne=null;function Ai(i){Ne=i;const e=document.getElementById("cd-overlay"),t=i.issuer_type==="GOVERNMENT",n=t?"gov":"private",o=(E?.name||f.nation||"—").toUpperCase(),s=Ii(i);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${b(o)}</span>
        <span class="cd-header__name">${b(i.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${n}">${b(i.issuer_name)}</span>
        <span class="cd-header__type-badge ${n}">${t?"GOV":"PRIVATE"}</span>
    `;const a=document.getElementById("cd-blueprint");i.blueprint_svg?(a.innerHTML=i.blueprint_svg,a.style.display=""):(a.innerHTML=Cn(i),a.style.display="");const l=i.permits_required||[],d=i.required_equipment||i.equipment_required||[],r=i.required_materials||i.materials_estimated||{},m={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[i.sector]||i.spec_category||i.sector||"—";let p="var(--teal)";i.sector==="industrial"&&(p="var(--orange)"),i.sector==="mega_project"&&(p="var(--red)");let u=B(i.budget_ceiling||i.budget||0),y=(i.timeline_ticks||i.timeline_months||0)+" Months",g="";g+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${b(i.project_code||i.contract_number||"")}</span>
            </div>
            <div class="cd-issue__tags">
                ${i.project_type?`<span class="cd-tag teal">${b(i.project_type.toUpperCase())}</span>`:""}
                ${i.project_subtype?`<span class="cd-tag gold">${b(i.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,i.description&&(g+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${b(i.description)}</div>
            </div>`),g+='<div class="cd-details">',i.project_type&&(g+=he("Type",i.project_type)),i.project_subtype&&(g+=he("Sub-Type",i.project_subtype)),g+=he("Specialization",m,p),g+=he("Total Budget",u,"var(--green)"),g+=he("Timeline",y),g+=he("Nation",E?.name||f.nation||"—"),i.region&&(g+=he("Region",i.region)),g+="</div>",l.length>0&&(g+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${l.map(A=>{const O=A.status==="approved"?"approved":"required",L=A.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${O}">
                            <span class="cd-chip__icon">${L}</span>
                            <span class="cd-chip__label">${b(A.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),r.length>0&&(g+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${r.map(A=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${b(A.name)}</span>
                        <span class="cd-mat-row__qty">${b(String(A.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=g;const _=l.filter(A=>A.status==="approved").length,h=l.length-_,k=d.filter(A=>A.owned).length,M=d.length-k;let C="";d.length>0&&(M===0?C+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>':C+=`<span class="cd-footer__badge bad">${M} EQUIPMENT MISSING</span>`),l.length>0&&(h===0?C+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':C+=`<span class="cd-footer__badge warn">${h} PERMITS PENDING</span>`);const w=s,x=i.issuer_faction_id===f?.id,T=i.status==="bidding",z=Fe[i.id];document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${C}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${x?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${T?"":"disabled"} title="${T?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:z?`<button class="cd-btn primary" onclick="retractBid('${i.id}')" style="background:#c55;border-color:#c55;"
                        title="Retract your bid ($1M penalty)">RETRACT BID</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${w?"":"disabled"}
                        title="${w?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,e.classList.add("open"),document.body.style.overflow="hidden"}function tt(i){i&&i.target&&i.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",Ne=null)}const Te=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],_i={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},hi={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let I=null;async function Oe(i){const e=ae.find(q=>q.id===i);if(!e)return;const t=Array.isArray(e.contract_bids)?e.contract_bids[0]:e.contract_bids,n=j?.current_tick||0,o=e.awarded_at_tick||n,s=e.timeline_ticks||8,a=Math.max(0,n-o),l=Math.min(100,a/s*100);let d=Math.min(Te.length-1,Math.floor(l/(100/Te.length)));const r=Math.round(l%(100/Te.length)/(100/Te.length)*100),c=e.required_materials||{},m=t?.material_grades||{};let p=[];try{const{data:q}=await $.from("project_material_allocations").select("material_key, quality_tier, quantity, consumed").eq("contract_id",e.id);p=q||[]}catch{}const u={};for(const q of p)u[q.material_key]||(u[q.material_key]={totalAllocated:0,totalConsumed:0,tiers:{}}),u[q.material_key].totalAllocated+=q.quantity,u[q.material_key].totalConsumed+=q.consumed,u[q.material_key].tiers[q.quality_tier]={qty:q.quantity,consumed:q.consumed};const y=Object.entries(c).map(([q,Y])=>{const Pe=m[q]||"STD",Z=u[q]||{totalAllocated:0,totalConsumed:0,tiers:{}};return{key:q,name:q.replace(/_/g," ").replace(/\b\w/g,xe=>xe.toUpperCase()),grade:Pe,required:Number(Y),allocated:Z.totalAllocated,consumed:Z.totalConsumed,tiers:Z.tiers,warehouseStock:F[q]||{}}}),g=e.required_equipment||[],_=e.equipment_condition||{},h=g.map(q=>{const Y=J.find(de=>de.equipment_key===q),Z=(Y?.assigned_projects||[]).find(de=>de.contract_id===e.id),xe=Z?Z.units:0;return{key:q,name:q.replace(/_/g," ").replace(/\b\w/g,de=>de.toUpperCase()),ownedTotal:Y?.owned||0,deployed:Y?.deployed||0,available:Math.max(0,(Y?.owned||0)-(Y?.deployed||0)),assignedToProject:xe,condition:_[q]??(Y?.condition||100)}}),k=e.budget_ceiling||0,M=t?.estimated_cost||0,C=Math.round(M*Math.min(1,a/s)),w=t?.estimated_quality||65,x=w>=80?"STRONG":w>=60?"PROMISING":w>=40?"FAIR":"UNCERTAIN",T=e.required_workforce||{},z=e.workers_assigned||{},A=(T.general||0)+(T.skilled||0)+(T.innovative||0),O=(z.general||0)+(z.skilled||0)+(z.innovative||0),L=t?.labor_count||A,W=Number(f?.corp_general_workforce??0),X=Number(f?.corp_skilled_workforce??0),ve=Number(f?.corp_innovative_workforce??0);I={project:e,bid:t,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:n,awardedTick:o,totalTicks:s,ticksElapsed:a,phaseIdx:d,phaseProgress:r,materials:y,equipment:h,budget:k,estCost:M,spent:C,quality:w,qualityLabel:x,laborCount:L,wfNeeded:A,wfAssigned:O,reqWf:T,assignedWf:z,corpGeneral:W,corpSkilled:X,corpInnovative:ve,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",zi(e.id).then(()=>Le()),Le()}let R=!1;async function fn(i,e,t){if(!(R||!I||!f)){R=!0;try{const{data:n,error:o}=await $.rpc("allocate_material_to_project",{p_contract_id:I.project.id,p_faction_id:f.id,p_material_key:i,p_quality_tier:e,p_quantity:t});if(o){alert("Allocation failed: "+o.message);return}if(n&&!n.success){alert(n.error||"Allocation failed");return}await ii(),await Oe(I.project.id)}catch(n){alert("Allocation error: "+n.message)}finally{R=!1}}}async function mn(i,e,t){if(!(R||!I||!f)){R=!0;try{const{data:n,error:o}=await $.rpc("deallocate_material_from_project",{p_contract_id:I.project.id,p_faction_id:f.id,p_material_key:i,p_quality_tier:e,p_quantity:t});if(o){alert("Return failed: "+o.message);return}if(n&&!n.success){alert(n.error||"Return failed");return}await ii(),await Oe(I.project.id)}catch(n){alert("Return error: "+n.message)}finally{R=!1}}}async function un(i,e){if(!(R||!I||!f)){R=!0;try{const t=I.project,n=t.workers_assigned||{},o=Number(n[i]||0),s=Number((t.required_workforce||{})[i]||0),a=Math.min(e,s-o);if(a<=0){alert("Already fully staffed for "+i);return}const l={...n,[i]:o+a},{error:d}=await $.from("construction_contracts").update({workers_assigned:l}).eq("id",t.id);if(d){alert("Assign failed: "+d.message);return}await Oe(t.id)}catch(t){alert("Assign error: "+t.message)}finally{R=!1}}}async function yn(i,e){if(!(R||!I||!f)){R=!0;try{const t=I.project,n=t.workers_assigned||{},o=Number(n[i]||0),s=Math.min(e,o);if(s<=0){alert("No "+i+" assigned");return}const a={...n,[i]:o-s},{error:l}=await $.from("construction_contracts").update({workers_assigned:a}).eq("id",t.id);if(l){alert("Unassign failed: "+l.message);return}await Oe(t.id)}catch(t){alert("Unassign error: "+t.message)}finally{R=!1}}}async function gn(i,e){if(!(R||!I||!f)){R=!0;try{const t=J.find(d=>d.equipment_key===i);if(!t){alert("Equipment not found in inventory.");return}const n=Math.max(0,(t.owned||0)-(t.deployed||0));if(n<e){alert("Not enough available "+i+" ("+n+" available).");return}const o=(t.deployed||0)+e,s=[...t.assigned_projects||[]],a=s.find(d=>d.contract_id===I.project.id);a?a.units+=e:s.push({contract_id:I.project.id,contract_name:I.project.name,units:e});const{error:l}=await $.from("corp_equipment").update({deployed:o,assigned_projects:s}).eq("faction_id",f.id).eq("equipment_key",i);if(l){alert("Deploy failed: "+l.message);return}await si(),await Oe(I.project.id)}catch(t){alert("Deploy error: "+t.message)}finally{R=!1}}}async function vn(i){if(!(R||!I||!f)){R=!0;try{const e=J.find(l=>l.equipment_key===i);if(!e){alert("Equipment not found.");return}const t=[...e.assigned_projects||[]],n=t.findIndex(l=>l.contract_id===I.project.id);if(n===-1){alert("Equipment not deployed to this project.");return}const o=t[n].units;t.splice(n,1);const s=Math.max(0,(e.deployed||0)-o),{error:a}=await $.from("corp_equipment").update({deployed:s,assigned_projects:t}).eq("faction_id",f.id).eq("equipment_key",i);if(a){alert("Undeploy failed: "+a.message);return}await si(),await Oe(I.project.id)}catch(e){alert("Undeploy error: "+e.message)}finally{R=!1}}}function xn(i){i&&i.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",I=null)}function bn(i){I&&(I.tab=i,I.expandedEvent=-1,I.selectedResponse=null,Le())}function $n(i){I&&(I.expandedEvent=I.expandedEvent===i?-1:i,I.selectedResponse=null,Le())}function _n(i){I&&(I.selectedResponse=I.selectedResponse===i?null:i,Le())}function Le(){if(!I)return;const i=I,e=i.project,t=e.issuer_type==="GOVERNMENT",n=ei(e.sector),o=f?.nation||"Nation",s=i.awardedTick+i.totalTicks,a=Math.max(0,s-i.currentTick),l=i.currentTick>s,d=i.budget>0?Math.round(i.spent/i.budget*100):0,r=d>85?"var(--red)":d>60?"var(--amber)":"var(--teal)",c=i.budget-i.spent,m=i.events.filter(_=>_.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
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
    `;let p='<div class="pm-phase__bar">';for(let _=0;_<Te.length;_++){const h=_<i.phaseIdx,k=_===i.phaseIdx;p+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${h?"done":k?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${h?"done":k?"active":""}">${Te[_]}</span>
        </div>`}p+="</div>",p+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${Te[i.phaseIdx]} — ${i.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${l?"var(--red)":"var(--text-secondary)"}">Tick ${i.ticksElapsed} / ${i.totalTicks}${l?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=p;const u=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:m},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=u.map(_=>`<button class="pm-tab${i.tab===_.id?" active":""}" onclick="pmSetTab('${_.id}')">
            ${_.label}${_.badge>0?`<span class="pm-tab__badge">${_.badge}</span>`:""}
        </button>`).join("");let y="";i.tab==="overview"?y=hn(i,e,r,d,c,a,l):i.tab==="events"?y=wn(i):i.tab==="materials"?y=kn(i):i.tab==="equipment"&&(y=En(i)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${y}</div>`;let g="";m>0&&(g+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${m} EVENT${m>1?"S":""} REQUIRES RESPONSE</span>`),g+=`<span class="pm-ftr__badge" style="color:${i.quality>=70?"var(--green)":i.quality>=50?"var(--amber)":"var(--orange)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${i.quality}/100 — ${i.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${g}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function hn(i,e,t,n,o,s,a){const l=St(i.awardedTick+i.totalTicks);St(i.awardedTick+i.totalTicks);const d=St(i.awardedTick),r=[{label:"Budget",value:te(i.budget),sub:`${n}% spent`,color:t},{label:"Spent",value:te(i.spent),color:"var(--red)"},{label:"Remaining",value:te(o),color:"var(--green)"},{label:"Quality",value:`${i.quality}/100`,sub:i.qualityLabel,color:i.quality>=70?"var(--green)":i.quality>=50?"var(--amber)":"var(--red)"},{label:"Workforce",value:`${i.laborCount}/${i.wfNeeded}`,sub:`Bid: ${i.laborCount}`,color:i.laborCount<i.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${s} ticks`,sub:a?"OVERDUE":`Deadline: ${l}`,color:a?"var(--red)":"var(--text-bright)"}];let c="";c+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${b(e.description||e.name)}</div>
    </div></div>`,c+='<div class="pm-metrics">';for(const g of r)c+=`<div class="pm-metric">
            <div class="pm-metric__label">${g.label}</div>
            <div class="pm-metric__value" style="color:${g.color}">${g.value}</div>
            ${g.sub?`<div class="pm-metric__sub">${b(g.sub)}</div>`:""}
        </div>`;c+="</div>",c+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${d}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${a?"var(--red)":"var(--text-bright)"};font-weight:700">${l}</span></span>
        </div>
    </div></div>`;const m=[];if((e.sector==="civil_engineering"||e.sector==="industrial"||e.sector==="mega_project")&&(m.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),m.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),e.sector!=="civil_engineering"&&m.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),m.length>0){c+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const g of m)c+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${b(g.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;c+="</div></div>"}c+='<div style="padding:0 16px"><div class="pm-section">',c+='<div class="pm-section__title">Workforce Assignment</div>';const p=[{key:"general",label:"General Workers",corpAvail:i.corpGeneral,color:"var(--text-primary)"},{key:"skilled",label:"Skilled Workers",corpAvail:i.corpSkilled,color:"var(--blue)"},{key:"innovative",label:"Innovative Workers",corpAvail:i.corpInnovative,color:"var(--purple)"}];for(const g of p){const _=Number(i.reqWf[g.key]||0);if(_===0)continue;const h=Number(i.assignedWf[g.key]||0),M=h>=_?"var(--green)":h>0?"var(--amber)":"var(--red)",C=g.corpAvail>0&&h<_,w=Math.min(g.corpAvail,_-h),x=h>0;c+='<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.72rem;">',c+="<div>",c+=`<span style="color:${g.color};font-weight:600;">${g.label}</span>`,c+=`<span style="color:var(--text-dim);margin-left:8px;">Required: <strong>${_}</strong></span>`,c+=`<span style="color:${M};margin-left:8px;font-weight:700;">${h} assigned</span>`,c+=`<span style="color:var(--text-dim);margin-left:8px;">Pool: ${g.corpAvail}</span>`,c+="</div>",c+='<div style="display:flex;gap:4px;">',C&&(c+=`<button onclick="pmAssignWorkers('${g.key}',${w})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Assign ${w}</button>`),x&&(c+=`<button onclick="pmUnassignWorkers('${g.key}',${h})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Remove ${h}</button>`),c+="</div></div>"}const u=Number(i.reqWf.general||0)+Number(i.reqWf.skilled||0)+Number(i.reqWf.innovative||0),y=Number(i.assignedWf.general||0)+Number(i.assignedWf.skilled||0)+Number(i.assignedWf.innovative||0);return u>0&&y<u&&(c+='<div style="font-size:0.62rem;color:var(--red);margin-top:6px;font-family:var(--font-mono);">⚠ Project will STALL until workforce is fully assigned</div>'),c+="</div></div>",c}function wn(i){if(i.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let e="";for(let t=0;t<i.events.length;t++){const n=i.events[t],o=i.expandedEvent===t,s=n.status==="ACTIVE",a=_i[n.type]||_i.WEATHER,l=hi[n.severity]||hi.LOW;if(e+=`<div class="pm-evt ${s?"pm-evt--active":"pm-evt--resolved"}" style="${s?`border-left-color:${a.color}`:""}">`,e+=`<div class="pm-evt__header" onclick="pmToggleEvent(${t})" style="${o?`background:${a.bg}`:""}">`,e+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${a.color};background:${a.bg};border:1px solid ${a.border}">${n.type}</span>
            <span class="pm-evt__sev-badge" style="color:${l}">${n.severity}</span>
            <span class="pm-evt__status" style="color:${s?"var(--red)":"var(--text-dim)"};font-weight:${s?"700":"400"}">${s?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,e+=`<div class="pm-evt__title">${b(n.title)}</div>`,e+=`<div class="pm-evt__meta">Tick ${n.tick} · ${b(n.id||"")}</div>`,o){if(e+='<div class="pm-evt__body">',e+=`<div class="pm-evt__desc">${b(n.desc)}</div>`,n.impact&&(e+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${b(n.impact)}</span>
                </div>`),s&&n.responses&&n.responses.length>0){e+='<div class="pm-evt__resp-title">Response Options</div>';for(let d=0;d<n.responses.length;d++){const r=n.responses[d],c=i.selectedResponse===d,p={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[r.tag]||"var(--text-secondary)";e+=`<div class="pm-resp${c?" selected":""}" style="${c?`border-color:${p}`:""}" onclick="event.stopPropagation();pmSelectResponse(${d})">`,e+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${b(r.label)}</span>
                            <span class="pm-resp__tag" style="color:${p};background:${p}12;border:1px solid ${p}25">${r.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${r.delay>0?"var(--orange)":"var(--green)"}">
                            ${r.delay>0?`+${r.delay} tick${r.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,e+=`<div class="pm-resp__detail">${b(r.detail)}</div>`,e+='<div class="pm-resp__costs">',r.cost&&(e+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${te(r.cost)}</span>`),r.qualityImpact&&r.qualityImpact!==0&&(e+=`<span class="pm-resp__cost" style="color:${r.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${r.qualityImpact>0?"+":""}${r.qualityImpact}</span>`),!r.cost&&(!r.qualityImpact||r.qualityImpact===0)&&(e+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),e+="</div>",c&&(e+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${p}" onclick="event.stopPropagation();confirmEventResponse('${n.id}','${r.key}')">CONFIRM</button>
                        </div>`),e+="</div>"}}!s&&n.resolution&&(e+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${b(n.resolution)}</div>
                </div>`),e+="</div>"}e+="</div></div>"}return e}function kn(i){if(i.materials.length===0)return'<div class="pm-evt-empty">No materials required for this project.</div>';let e='<div class="pm-tab-header">Project Materials</div>';for(const t of i.materials){const n=t.required>0?Math.round(t.allocated/t.required*100):0;t.allocated>0&&Math.round(t.consumed/t.allocated*100);const o=t.allocated>=t.required,s=o?"var(--green)":t.allocated>0?"var(--amber)":"var(--red)",a=o?"FULLY ALLOCATED":t.allocated>0?"PARTIAL":"NONE ALLOCATED";e+='<div class="pm-mat" style="margin-bottom:14px;">',e+=`<div class="pm-mat__row1">
            <div class="pm-mat__left">
                <span class="pm-mat__name">${b(t.name)}</span>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:${s};">${t.allocated} / ${t.required} allocated · ${a}</span>
        </div>`,e+=`<div class="pm-mat__bar-row">
            <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${n}%;background:${s};"></div></div>
            <span class="pm-mat__pct">${t.consumed} consumed</span>
        </div>`;const l=["STD","LOW","HIGH"],d=t.required-t.allocated;for(const r of l){const c=t.warehouseStock[r]||{qty:0},m=t.tiers[r]||{qty:0,consumed:0},p=m.qty-m.consumed;if(c.qty===0&&m.qty===0)continue;const u=r==="HIGH"?"var(--green)":r==="LOW"?"var(--orange)":"var(--text-muted)",y=r==="HIGH"?"HIGH":r==="LOW"?"LOW":"STD";if(e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.7rem;">',e+='<div style="display:flex;align-items:center;gap:6px;">',e+=`<span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${u};width:32px;">${y}</span>`,e+=`<span style="color:var(--text-dim);">Warehouse: <strong style="color:var(--text-primary);">${c.qty}</strong></span>`,m.qty>0&&(e+=`<span style="color:var(--text-dim);margin-left:8px;">Allocated: <strong style="color:var(--text-primary);">${m.qty}</strong></span>`),e+="</div>",e+='<div style="display:flex;gap:4px;">',c.qty>0&&d>0){const g=Math.min(c.qty,d);e+=`<button class="pm-alloc-btn" onclick="pmAllocateMaterial('${t.key}','${r}',${g})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Allocate ${g}</button>`}p>0&&(e+=`<button class="pm-alloc-btn" onclick="pmDeallocateMaterial('${t.key}','${r}',${p})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Return ${p}</button>`),e+="</div></div>"}e+="</div>"}return e}function En(i){if(i.equipment.length===0)return'<div class="pm-evt-empty">No equipment required for this project.</div>';let e='<div class="pm-tab-header">Project Equipment</div>';for(const t of i.equipment){const n=t.condition>=75?"var(--green)":t.condition>=50?"var(--amber)":t.condition>=25?"var(--orange)":"var(--red)",o=t.assignedToProject>0,s=o?"var(--green)":t.ownedTotal>0?"var(--amber)":"var(--red)",a=o?"DEPLOYED":t.ownedTotal>0?"NOT DEPLOYED":"NOT OWNED";e+=`<div class="pm-eq" style="margin-bottom:12px;">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${b(t.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${s};margin-left:8px;">${a}</span>
                </div>
            </div>`,o&&(e+=`<div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${t.condition}%;background:${n}"></div></div>
                <span class="pm-eq__cond-val" style="color:${n}">${t.condition}%</span>
            </div>`),e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:0.7rem;">',e+=`<span style="color:var(--text-dim);">Owned: <strong style="color:var(--text-primary);">${t.ownedTotal}</strong>`,e+=` · Deployed: <strong style="color:var(--text-primary);">${t.deployed}</strong>`,e+=` · Available: <strong style="color:var(--text-primary);">${t.available}</strong></span>`,e+='<div style="display:flex;gap:4px;">',!o&&t.available>0&&(e+=`<button onclick="pmDeployEquipment('${t.key}',1)" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Deploy</button>`),o&&(e+=`<button onclick="pmUndeployEquipment('${t.key}')" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Undeploy</button>`),e+="</div></div>",e+="</div>"}return e}function St(i){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][i%12]}, ${2e3+Math.floor(i/12)}`}window.openProjectModal=Oe;window.closeProjectModal=xn;window.pmSetTab=bn;window.pmToggleEvent=$n;window.pmSelectResponse=_n;window.pmAllocateMaterial=fn;window.pmDeallocateMaterial=mn;window.pmDeployEquipment=gn;window.pmUndeployEquipment=vn;window.pmAssignWorkers=un;window.pmUnassignWorkers=yn;async function zi(i){if(!I)return;const{data:e,error:t}=await $.from("construction_events").select("*").eq("contract_id",i).order("fired_at_tick",{ascending:!1});t?(console.warn("Failed to load project events:",t.message),I.events=[]):I.events=(e||[]).map(n=>({id:n.id,type:n.type,severity:n.severity,tick:n.fired_at_tick,title:n.title,desc:n.description,impact:n.impact,status:n.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:n.resolution,responses:n.responses||[]})),Le()}let It=!1;async function Tn(i,e){if(!(It||!I)){It=!0;try{const{data:t,error:n}=await $.rpc("resolve_construction_event",{p_event_id:i,p_response_key:e});if(n){console.error("Failed to resolve event:",n.message),alert("Failed to submit response: "+n.message);return}const o=typeof t=="string"?JSON.parse(t):t;if(o?.error){alert("Error: "+o.error);return}await zi(I.project.id),await Ni(),o?.quality_applied&&o.quality_applied!==0&&(I.quality=Math.max(0,Math.min(100,I.quality+o.quality_applied)),I.qualityLabel=I.quality>=80?"STRONG":I.quality>=60?"PROMISING":I.quality>=40?"FAIR":"UNCERTAIN"),Le()}finally{It=!1}}}window.confirmEventResponse=Tn;function he(i,e,t){const n=t?` style="color:${t}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${b(i)}</span>
        <span class="cd-detail-row__value"${n}>${b(e)}</span>
    </div>`}function Cn(i){const e={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},t=i.drawing_number||i.contract_number+"-A1",n=j?.current_date||"",o=n?n.replace(/,\s*/," "):"",s=i.spec_category==="Heavy Infrastructure",a=i.spec_category==="Megaproject";let l=b(i.project_subtype||i.project_type||"STRUCTURE"),d=s?"80.0m":a?"200.0m":"60.0m",r=s?"40.0m":a?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${e.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(c,m)=>`<line x1="${m*20}" y1="0" x2="${m*20}" y2="200" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(c,m)=>`<line x1="0" y1="${m*20}" x2="680" y2="${m*20}" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${e.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${e.accent}" font-family="var(--font-mono)" font-weight="700">${l.toUpperCase()}</text>
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
        <text x="340" y="17" text-anchor="middle" font-size="5.5" fill="${e.dim}" font-family="var(--font-mono)">${d}</text>

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
    </svg>`}async function ge(){if(!f||!f.nation_id)return;const{data:i,error:e}=await $.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(e?(console.warn("Failed to load contracts:",e.message),je=[]):je=i||[],Fe={},f&&je.length>0){const t=je.map(o=>o.id),{data:n}=await $.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",f.id).in("contract_id",t);for(const o of n||[])Fe[o.contract_id]=o}Mi()}function Sn(){const i=document.getElementById("ap-list"),e=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=ae.length+" ACTIVE",ae.length===0){i.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,e.style.display="none";return}const t=j?.current_tick||0;let n=0,o=0,s="";for(const a of ae){const l=a.issuer_type==="GOVERNMENT",d=l?"gov":"private",r=Array.isArray(a.contract_bids)?a.contract_bids[0]:a.contract_bids,c=r?.bid_price||0,m=r?.estimated_cost||0,p=r?.estimated_quality||0,u=a.budget_ceiling||0,y=a.awarded_at_tick||t,g=a.stalled_ticks||0,_=Math.max(0,t-y),h=Math.max(0,_-g),k=a.timeline_ticks||8,M=Math.max(0,k-h),C=Math.min(100,Math.round(h/k*100)),w=h>k,x=g>0;Si(a.sector);const T=ei(a.sector);n+=u,o+=c,s+=`<div class="ap-item" onclick="openProjectModal('${a.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${b(a.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${b(a.issuer_name||"—")} · ${T}</div>
                </div>
                <span class="oc-item__type-badge ${d}">${l?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS${x?' <span style="color:var(--orange);font-weight:700;font-size:7px;">⚠ STALLED ('+g+" ticks — hire more workers)</span>":""}</span>
                    <span class="ap-budget__values" style="color:${w?"var(--red)":x?"var(--orange)":"var(--teal)"}">
                        ${h}/${k} ticks ${w?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${C}%;background:${w?"var(--red)":x?"var(--orange)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${te(c)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${te(m)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${p>=70?"var(--green)":p>=40?"var(--teal)":"var(--orange)"}">${p}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${w?"var(--red)":"var(--text-bright)"}">${M} ticks</div>
                </div>
            </div>
        </div>`}i.innerHTML=s,e.style.display=ae.length>0?"":"none",ae.length>0&&(document.getElementById("ap-total-crew").textContent=ae.length,document.getElementById("ap-total-budget").textContent=te(n),document.getElementById("ap-total-spent").textContent=te(o))}async function Ni(){if(!f)return;const{data:i,error:e}=await $.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",f.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",f.id).order("awarded_at_tick",{ascending:!0});e?(console.warn("Failed to load active projects:",e.message),ae=[]):ae=i||[],Sn()}const pt=3e4;function ft(){let i=0,e=0;for(const t of ye)for(const n of Zt){const o=F[t.key]?.[n];o&&(i+=o.qty,e+=o.value)}return{totalUnits:i,totalValue:e}}function ti(){const i=document.getElementById("wh-list"),{totalUnits:e,totalValue:t}=ft();document.getElementById("wh-count").textContent=e.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=B(t);const n=Math.round(e/pt*100),o=document.getElementById("wh-capacity");o.textContent=n+"%",o.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)";let s="";for(let a=0;a<ye.length;a++){const l=ye[a],d=Gt===a,r=F[l.key]?.LOW||{qty:0,value:0},c=F[l.key]?.STD||{qty:0,value:0},m=F[l.key]?.HIGH||{qty:0,value:0},p=r.qty+c.qty+m.qty,u=r.value+c.value+m.value,y=p===0,g=Ae(l.key,"LOW",E),_=Ae(l.key,"STD",E),h=Ae(l.key,"HIGH",E),k=r.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",M=c.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",C=h.available?m.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(s+='<div class="wh-row">',s+=`<div class="wh-row__collapsed${d?" expanded":""}" onclick="toggleWhRow(${a})">
            <span class="wh-row__arrow">${d?"▾":"▸"}</span>
            <span class="wh-row__name${y?" empty":""}">${b(l.name)}</span>
            <div class="wh-row__dots">
                <div class="${k}"></div>
                <div class="${M}"></div>
                <div class="${C}"></div>
            </div>
            <span class="wh-row__qty${y?" empty":""}">${p>0?p.toLocaleString():"—"}</span>
            <span class="wh-row__val${y?" empty":""}">${u>0?B(u):"—"}</span>
        </div>`,d){s+='<div class="wh-expand">',s+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const w=[{key:"LOW",label:"Low",data:r,avail:g,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:c,avail:_,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:m,avail:h,color:"var(--green)",dotClass:"wh-dot--high"}];for(const x of w){const T=!x.avail.available,z=x.data.qty>0,A=z?"$"+Math.round(x.data.value/x.data.qty):"—";s+=`<div class="wh-grade${T?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${x.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${T?"var(--red)":x.color}">${x.label}</span>
                        ${T?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${z?"var(--text-bright)":"var(--text-dim)"}">${z?x.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${x.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${x.data.value>0?B(x.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${A}</span>
                </div>`}for(const x of w)!x.avail.available&&x.avail.failedStat&&(s+=`<div class="wh-lock">
                        <span class="wh-lock__text">${x.label.toUpperCase()} GRADE LOCKED — ${b(x.avail.failedStat)} &lt; ${x.avail.failedMin}</span>
                    </div>`);s+="</div>"}s+="</div>"}i.innerHTML=s}function In(i){Gt=Gt===i?-1:i,ti()}async function ii(){if(!f)return;const{data:i,error:e}=await $.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",f.id);if(F={},e)console.warn("Failed to load warehouse:",e.message);else if(i)for(const t of i)F[t.material_key]||(F[t.material_key]={}),F[t.material_key][t.quality_tier]={qty:t.quantity||0,value:Number(t.total_value)||0};ti()}const Mn={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function qi(){const i=(E?.name||f?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+i;const e=Number(f?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=B(e);const{totalUnits:t}=ft(),n=Math.round(t/pt*100),o=document.getElementById("pr-wh-capacity");o.textContent=n+"%",o.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)",Li(),ni(),mt()}function Li(){const i=document.getElementById("pr-mat-grid");let e="";for(const t of ye){const n=H===t.key,o=Zt.every(a=>!Ae(t.key,a,E).available),s="pr-mat-btn"+(n?" active":"")+(o?" all-locked":"");e+=`<span class="${s}" onclick="setPrMat('${t.key}')">${b(t.name)}</span>`}i.innerHTML=e}function ni(){const i=document.getElementById("pr-tier-bar");let e='<span class="pr-tier-label">GRADE</span>';for(const t of Zt){const n=Ae(H,t,E),o=U===t,s=n.available?Xt(H,t,E):null,a=Ti[t],l=!n.available,d="pr-tier-btn"+(o?" active":"")+(l?" locked":"");e+=`<div class="${d}" onclick="${l?"":`setPrTier('${t}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${a};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${o?"var(--text-bright)":"var(--text-dim)"}">${Ut[t]}</span>
            </div>
            ${s!==null?`<div class="pr-tier-btn__price" style="color:${o?"var(--text-bright)":"var(--text-muted)"}">$${s}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}i.innerHTML=e}function mt(){const i=document.getElementById("pr-content"),e=Ae(H,U,E),t=ye.find(w=>w.key===H);if(!t)return;if(!e.available){i.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${b(t.name)} — ${Ut[U]} grade
                    is not produced domestically in ${b(E?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${b(e.failedStat||"unknown")} &lt; ${e.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const n=Xt(H,U,E),o=Ci(H,U,E),s=n*se,a=o>3e3?"LOW":o>1e3?"MODERATE":"HIGH",l=a==="LOW"?"var(--green)":a==="MODERATE"?"var(--amber)":"var(--red)",d=Number(E?.inflation??50),r=d>55?"up":d<45?"down":"flat",c=r==="up"?"&#9650;":r==="down"?"&#9660;":"&#8212;",m=r==="up"?"var(--red)":r==="down"?"var(--green)":"var(--text-dim)";let p="";p+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${n}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${m}">${c}</span>
                </div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">SUPPLY/TICK</div>
                <div class="pr-market-cell__value" style="font-size:14px;color:var(--text-bright);margin-top:2px;">${o.toLocaleString()}</div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">DEMAND</div>
                <div class="pr-market-cell__value" style="font-size:12px;color:${l};margin-top:2px;">${a}</div>
            </div>
        </div>
    </div>`,p+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${b(E?.name||"—")})</div>`;for(const w of t.priceDrivers){const x=Number(E?.[w]??50),T=x>=50?"var(--green)":x>=30?"var(--amber)":x>=15?"var(--orange)":"var(--red)",z=Mn[w]||w;p+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${b(w)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${x}%;background:${T}"></div>
            </div>
            <span class="pr-driver-row__val">${x}</span>
            <span class="pr-driver-row__effect">${b(z)}</span>
        </div>`}p+="</div>";const y=(Number(f?.corp_cash_reserves)||0)>=s,g=se>o,{totalUnits:_}=ft(),h=pt-_,k=se>h,M=h<=0,C=Ti[U];p+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${b(t.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${C};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${C}">${Ut[U]}</span>
                </div>
                <span class="pr-order__mat-price">$${n}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(w=>`<span class="pr-qty-btn${se===w?" active":""}" onclick="setPrQty(${w})">${w>=1e3?w/1e3+"k":w}</span>`).join("")}
                </div>
            </div>
            ${g?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${o.toLocaleString()} this tick</span>
            </div>`:""}
            ${M?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">WAREHOUSE FULL — no remaining capacity</span>
            </div>`:k?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS WAREHOUSE CAPACITY — ${h.toLocaleString()} units remaining</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${B(s)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${y&&!g&&!k&&!M?"":"disabled"}
                    title="${y?g?"Exceeds supply":M?"Warehouse full":k?"Exceeds warehouse capacity":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,i.innerHTML=p}function An(i){H=i,U="STD";for(const e of["STD","HIGH","LOW"])if(Ae(i,e,E).available){U=e;break}Li(),ni(),mt()}function zn(i){U=i,ni(),mt()}function Nn(i){se=i,mt()}let Mt=!1;async function qn(){if(Mt||!f||!E)return;const i=Xt(H,U,E),e=Ci(H,U,E),t=i*se,n=Number(f.corp_cash_reserves)||0;if(t>n){alert("Insufficient cash reserves.");return}if(se>e){alert("Exceeds available supply this tick.");return}const{totalUnits:o}=ft(),s=pt-o;if(s<=0){alert("Warehouse is full. Cannot purchase more materials.");return}if(se>s){alert(`Warehouse can only hold ${s.toLocaleString()} more units. Reduce quantity.`);return}Mt=!0;const a=document.querySelector(".pr-purchase-btn");a&&(a.disabled=!0,a.textContent="...");try{const l=n-t,{error:d}=await $.from("factions").update({corp_cash_reserves:l}).eq("id",f.id);if(d)throw d;const r=F[H]?.[U],c=(r?.qty||0)+se,m=(r?.value||0)+t,{error:p}=await $.from("corp_warehouse").upsert({faction_id:f.id,nation_id:f.nation_id,material_key:H,quality_tier:U,quantity:c,total_value:m,last_purchased_tick:j?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(p){const{error:u}=await $.from("factions").update({corp_cash_reserves:n}).eq("id",f.id);throw u&&console.error("Cash refund failed after warehouse error:",u.message),p}f.corp_cash_reserves=l,F[H]||(F[H]={}),F[H][U]={qty:c,value:m},ti(),qi(),a&&(a.textContent="PURCHASED",setTimeout(()=>{a.isConnected&&(a.disabled=!1,a.textContent="PURCHASE")},1500))}catch(l){a&&(a.disabled=!1,a.textContent="PURCHASE"),alert("Purchase failed: "+(l.message||"Unknown error"))}finally{Mt=!1}}function Bi(i){const e=ze||E;if(!e)return[];const t=ct(i);if(!t)return[];const n=sn(i,e),o=[],s=Number(e?.inflation??50),a=Number(e?.fuel_prices??50);Number(e?.manufacturing_output??50);const l=ze&&E&&ze.id!==E.id;let d=null;if(l&&(d=rn(e,E)),n.newAvailable>0){const r=bi(i,e),c=t.basePrice,m=Math.round(c*((s-50)/200)),p=Math.round(c*((a-50)/300));let u=r;const y=[{label:"Base price",value:B(c)},m!==0?{label:`Inflation (${s})`,mod:(m>=0?"+":"")+B(Math.abs(m))}:null,p!==0?{label:`Fuel transport (${a})`,mod:(p>=0?"+":"")+B(Math.abs(p))}:null].filter(Boolean),g=r-c-m-p;if(g!==0&&!l&&y.push({label:"Demand/scarcity",mod:(g>=0?"+":"")+B(Math.abs(g))}),l&&d){const _=Math.round(r*d.tariff),h=Math.round(r*d.transport);u=r+_+h,y.push({label:`Import tariff (${Math.round(d.tariff*100)}%)`,mod:"+"+B(_)}),y.push({label:`Transport (${d.deliveryTicks} tick${d.deliveryTicks>1?"s":""})`,mod:"+"+B(h)})}o.push({seller:l?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:l?d?.deliveryTicks||1:0,condition:100,price:Math.round(u),available:n.newAvailable,delivery:l?d.deliveryTicks+" tick"+(d.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:l?d.deliveryTicks:0,used:!1,priceFactors:y,sourceNationId:e.id})}if(n.usedAvailable>0){const r=n.usedCondition,c=bi(i,e,{used:!0,condition:r});let m=c;const p=[{label:"Base price",value:B(t.basePrice)},{label:`Condition (${r}%)`,mod:"-"+B(Math.max(0,t.basePrice-c))}];if(l&&d){const u=Math.round(c*d.tariff),y=Math.round(c*d.transport);m=c+u+y,p.push({label:`Import tariff (${Math.round(d.tariff*100)}%)`,mod:"+"+B(u)}),p.push({label:`Transport (${d.deliveryTicks} tick${d.deliveryTicks>1?"s":""})`,mod:"+"+B(y)})}o.push({seller:l?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:l?d?.deliveryTicks||1:0,condition:r,price:Math.round(m),available:n.usedAvailable,delivery:l?d.deliveryTicks+" tick"+(d.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:l?d.deliveryTicks:0,used:!0,priceFactors:p,sourceNationId:e.id})}return o}function ut(){const i=Number(f?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=B(i);const e=ct(ee),t=Xe[e?.tier||1],n=document.getElementById("em-tier-badge");n&&(n.textContent=t.tag,n.style.color=t.color),n.style.background=t.color+"0a",n.style.border="1px solid "+t.color+"33";const o=document.getElementById("em-nation-select");if(o&&o.options.length===0){const l=E?.name||f?.nation||"—";let d=`<option value="">${b(l)} (HQ)</option>`;for(const r of lt)r.id!==E?.id&&(d+=`<option value="${r.id}">${b(r.name)}</option>`);o.innerHTML=d}const s=document.getElementById("em-import-tag"),a=ze&&E&&ze.id!==E.id;s&&(s.style.display=a?"":"none"),Ln(),oi()}function Ln(){let i="";for(let e=1;e<=3;e++){const t=Xe[e],n=Ht(e),o=e===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";i+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${t.color}">${t.tag}</div>
            <div class="${o}">`;for(const s of n){const a=ee===s.key,l=Bi(s.key).length>0;i+=`<span class="em-selector__btn${a?" active":""}${l?"":" no-listings"}"
                style="${a?"background:"+t.color+";border-color:"+t.color:""}"
                onclick="setEmType('${s.key}')">${b(s.name)}</span>`}i+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${i}</div>`}function oi(){const i=document.getElementById("em-content");if(we=Bi(ee),we.length===0){i.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}pe>=we.length&&(pe=0);let e="";for(let n=0;n<we.length;n++){const o=we[n],s=pe===n,a=o.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",l=Ei(o.condition);e+=`<div class="em-listing${s?" selected":""}" style="${s?"border-left-color:"+a:""}" onclick="setEmListing(${n})">`,e+=`<div class="em-listing__row1">
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
                    <div class="em-stat-cell__bar-track"><div class="em-stat-cell__bar-fill" style="width:${o.condition}%;background:${l}"></div></div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${l}">${o.condition}%</span>
                </div>
            </div>
            <div class="em-stat-cell" style="flex:0.8;text-align:center">
                <div class="em-stat-cell__label">AVAIL.</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${o.available}</div>
            </div>
            <div class="em-stat-cell" style="flex:1.2">
                <div class="em-stat-cell__label">PRICE/UNIT</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${B(o.price)}</div>
            </div>
        </div>`,s&&o.priceFactors&&(e+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${o.priceFactors.map(d=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${b(d.label)}</span>
                    <span class="em-breakdown__mod" style="color:${d.mod?d.mod.startsWith("-")?"var(--green)":d.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${d.mod||d.value}</span>
                </div>`).join("")}
            </div>`),e+="</div>"}const t=we[pe];if(t){const n=ct(ee),o=Xe[n?.tier||1],s=Math.min(t.available,4),a=t.price*fe,l=(Number(f?.corp_cash_reserves)||0)>=a;e+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${b(n?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${b(t.seller)}</span>
                </div>
                <span class="em-purchase__price">${B(t.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:s},(d,r)=>r+1).map(d=>`<span class="em-qty-btn${fe===d?" active":""}" style="${fe===d?"background:"+o.color+";border-color:"+o.color:""}" onclick="setEmQty(${d})">${d}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${t.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${B(a)}</div>
                    ${t.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${b(t.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${o.color}" onclick="purchaseEquipment()"
                    ${l?"":"disabled"}
                    title="${l?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}i.innerHTML=e}async function Bn(i){if(!i)ze=null;else{let t=lt.find(n=>n.id===i);if(!t)try{const{data:n}=await $.from("nations").select("*").eq("id",i).single();t=n}catch{}ze=t||null}pe=0,fe=1;const e=document.getElementById("em-nation-select");e&&(e.value=i||""),ut()}function Rn(i){ee=i,pe=0,fe=1,ut()}function On(i){pe=i,fe=1,oi()}function Pn(i){fe=i,oi()}let At=!1;async function Dn(){if(At)return;const i=we[pe];if(!i||!f)return;const e=ct(ee);if(!e)return;const t=fe,n=i.price*t,o=Number(f.corp_cash_reserves)||0;if(n>o){alert("Insufficient cash reserves.");return}if(t>i.available){alert("Not enough units available.");return}const s=document.querySelector(".em-purchase-btn");s&&(s.disabled=!0,s.textContent="..."),At=!0;try{const a=o-n,{error:l}=await $.from("factions").update({corp_cash_reserves:a}).eq("id",f.id);if(l)throw l;const d=!i.deliveryTicks||i.deliveryTicks===0;if(d){const c=J.find(M=>M.equipment_key===ee),m=(c?.owned||0)+t,p=c?.purchase_price_avg||0,u=c?.owned||0,y=u>0?Math.round((p*u+i.price*t)/m):i.price,g=e.maintenancePerUnit*m,_=c?.condition||100,h=Math.round((_*u+i.condition*t)/m),{error:k}=await $.from("corp_equipment").upsert({faction_id:f.id,nation_id:f.nation_id,equipment_key:ee,tier:e.tier,owned:m,deployed:c?.deployed||0,condition:h,maintenance_per_tick:g,purchase_price_avg:y,last_purchased_tick:j?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(k){const{error:M}=await $.from("factions").update({corp_cash_reserves:o}).eq("id",f.id);throw M&&console.error("Cash refund failed:",M.message),k}c?(c.owned=m,c.condition=h,c.maintenance_per_tick=g):J.push({equipment_key:ee,tier:e.tier,owned:m,deployed:0,condition:h,maintenance_per_tick:g,assigned_projects:[]})}else{const c=(j?.current_tick||0)+i.deliveryTicks,{error:m}=await $.from("corp_equipment_deliveries").insert({faction_id:f.id,equipment_key:ee,quantity:t,condition:i.condition,delivery_tick:c,source_nation_id:i.sourceNationId||null,seller_name:i.seller,price_paid:n});if(m){const{error:p}=await $.from("factions").update({corp_cash_reserves:o}).eq("id",f.id);throw p&&console.error("Cash refund failed:",p.message),m}}f.corp_cash_reserves=a,ai(),ut();const r=document.getElementById("pr-cash");r&&(r.textContent=B(a)),s&&(s.textContent=d?"PURCHASED":"ORDERED",setTimeout(()=>{s.isConnected&&(s.disabled=!1,s.textContent="PURCHASE")},1500))}catch(a){s&&(s.disabled=!1,s.textContent="PURCHASE"),alert("Purchase failed: "+(a.message||"Unknown error"))}finally{At=!1}}let jn=-1,Ke=[],Qt=[],Ri=[];function zt(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(1)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function Hn(i,e,t){if(t)return"var(--orange)";const n=i/(e||1)*100;return n>50?"var(--green)":n>25?"var(--amber)":"var(--red)"}function Un(){const i=document.getElementById("pm-list"),e=Ke.length,t=Qt.length,n=Ri.length,o=Ke.filter(d=>d.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${e})`,document.getElementById("pm-pending-count").textContent=`(${t})`,document.getElementById("pm-apply-count").textContent=`(${n})`;const s=document.getElementById("pm-badges");let a="";o>0&&(a+=`<span class="pm-badge pm-badge--expiring">${o} EXPIRING</span>`),t>0&&(a+=`<span class="pm-badge pm-badge--pending">${t} PENDING</span>`),s.innerHTML=a;const l=Ke.reduce((d,r)=>d+(r.cost||0),0)+Qt.reduce((d,r)=>d+(r.cost||0),0);document.getElementById("pm-total-cost").textContent=zt(l),document.getElementById("pm-footer-active").textContent=e,document.getElementById("pm-footer-pending").textContent=t;{if(e===0){i.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let d="";Ke.forEach((r,c)=>{const m=jn===c,p=Hn(r.ticks_left,r.total_ticks,r.expiring_soon),u=Math.min(r.ticks_left/(r.total_ticks||1)*100,100);d+=`<div class="pm-item ${r.expiring_soon?"pm-item--expiring":""} ${m?"expanded":""}" onclick="togglePmExpand(${c})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${b(r.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${b((r.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${p}">Expires: ${b(r.expires||"")}</span>
                        <span class="pm-item__ticks">(${r.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${u}%;background:${p}"></div></div>`,m&&(d+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${b(r.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${b(r.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${zt(r.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${r.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${r.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(r.projects||[]).map(y=>`<span class="pm-project-chip">${b(y)}</span>`).join("")}</div>
                    </div>`,r.note&&(d+=`<div class="pm-note"><span class="pm-note__text">${b(r.note)}</span></div>`),r.expiring_soon&&r.renewable&&(d+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew">RENEW — ${zt(r.cost||0)}</button></div>`),d+="</div>"),d+="</div></div>"}),i.innerHTML=d;return}}function Gn(){Ke=[],Qt=[],Ri=[],Un()}let Ce=[],Wn=-1;function ce(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(2)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function wi(i){return i>=85?"var(--gold)":i>=60?"var(--green)":i>=40?"var(--orange)":"var(--red)"}function Fn(i){return"dl-result--"+i.toLowerCase()}function ki(){const i=document.getElementById("dl-list"),e=Ce.length;document.getElementById("dl-count").textContent=`${e} COMPLETED`;const t=Ce.reduce((l,d)=>{const r=d.financials||{};return l+((r.payment||0)+(r.bonus||0)-(r.penalty||0)-(r.total_cost||0))},0),n=document.getElementById("dl-lifetime-profit");n.textContent=(t>=0?"+":"")+ce(t),n.style.color=t>=0?"var(--green)":"var(--red)";const o={};Ce.forEach(l=>{o[l.result]=(o[l.result]||0)+1});const s=document.getElementById("dl-footer-results");if(s.innerHTML=Object.entries(o).map(([l,d])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[l]||"var(--text-dim)"}">${b(l)}</div>
            <div class="dl-footer__result-count">${d}</div>
        </div>`).join(""),e===0){i.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let a="";Ce.forEach((l,d)=>{const r=Wn===d,c=l.financials||{},m=(c.payment||0)+(c.bonus||0)-(c.penalty||0)-(c.total_cost||0),p=m>=0,u=Fn(l.result),g={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[l.result]||"var(--text-dim)",_=l.type==="GOVERNMENT";if(a+=`<div class="dl-item ${r?"expanded":""}" onclick="toggleDlExpand(${d})">
            <div class="dl-item__inner" style="border-left:2px solid ${g}">
                <div class="dl-item__row1">
                    <span class="dl-item__name">${b(l.name)}</span>
                    <span class="dl-result-badge ${u}">${b(l.result)}</span>
                </div>
                <div class="dl-item__row2">
                    <span class="dl-item__id">${b(l.id)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                    <span class="dl-item__issuer" style="color:${_?"var(--green)":"var(--gold)"}">${b(l.issuer)}</span>
                    <span class="dl-item__date">${b(l.delivered)}</span>
                </div>
                <div class="dl-summary-bar">
                    <div class="dl-summary-cell" style="flex:1;">
                        <div class="dl-summary-label">QUALITY</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span class="dl-summary-value" style="color:${wi(l.quality_score)}">${l.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${l.rep_change>0?"var(--green)":l.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${l.rep_change>0?"+":""}${l.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${p?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${p?"var(--green)":"var(--red)"};margin-top:2px;">${p?"+":""}${ce(m)}</div>
                    </div>
                </div>`,r){const h=l.inspection||{};a+='<div style="margin-top:8px;">',a+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(w=>{const x=h[w]||{score:0,issues:[]},T=wi(x.score),z=Math.min(x.score/100*100,100);a+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${b(w.charAt(0).toUpperCase()+w.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${z}%;background:${T}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${T}">${x.score}</span>
                        </div>
                    </div>
                    ${(x.issues||[]).map(A=>`<div class="dl-inspect-issue">${b(A)}</div>`).join("")}
                </div>`});const k=h.permits||{passed:!0,issues:[]};a+=`<div class="dl-permits-row ${k.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${k.passed?"var(--green)":"var(--red)"}">${k.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${(k.issues||[]).map(w=>`<div class="dl-inspect-issue dl-inspect-issue--red">${b(w)}</div>`).join("")}
            </div>`,a+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',a+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(l.materials_used||[]).forEach(w=>{const x=w.grade==="HIGH"?"var(--green)":w.grade==="STANDARD"?"var(--amber)":"var(--orange)",T=w.impact==="positive"?"▲":w.impact==="negative"?"▼":"–",z=w.impact==="positive"?"var(--green)":w.impact==="negative"?"var(--red)":"var(--text-dim)";a+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${b(w.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${x}"></div>
                    <span class="dl-mat-tag__grade" style="color:${x}">${b(w.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${z}">${T}</span>
                </div>`}),a+="</div>",a+='<div class="dl-section-label">Financial Summary</div>',a+='<div class="dl-fin-panel">',a+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${ce(c.contract_value||0)}</span></div>`,(c.bonus||0)>0&&(a+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${ce(c.bonus)}</span></div>`),(c.penalty||0)>0&&(a+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${ce(c.penalty)}</span></div>`);const M=(c.payment||0)+(c.bonus||0)-(c.penalty||0);a+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${ce(M)}</span></div>`,a+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${ce(c.total_cost||0)}</span></div>`,a+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${p?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${p?"var(--green)":"var(--red)"}">${p?"+":""}${ce(m)}</span>
            </div>`,a+="</div>";const C=l.timeline||{};a+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${C.actual||0}/${C.expected||0} ticks</span>`,C.early?a+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(C.expected||0)-(C.actual||0)} TICK${C.expected-C.actual!==1?"S":""} EARLY</span>`:!C.on_time&&C.actual>C.expected&&(a+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(C.actual||0)-(C.expected||0)} TICK${C.actual-C.expected!==1?"S":""} LATE</span>`),a+="</div>",a+="</div>"}a+="</div></div>"}),i.innerHTML=a}async function Vn(){if(!f){Ce=[],ki();return}const{data:i,error:e}=await $.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",f.id).order("delivered_at_tick",{ascending:!1}).limit(20);e?(console.warn("Failed to load deliveries:",e.message),Ce=[]):Ce=(i||[]).map(t=>{const n=t.construction_contracts||{};return{id:t.contract_id,name:n.name||"Project",type:n.issuer_type||"GOVERNMENT",issuer:n.issuer_name||"Government",delivered:"Tick "+(t.delivered_at_tick||0),result:t.result,quality_score:t.quality_score,rep_change:t.rep_change,financials:{contract_value:t.contract_value||0,bonus:t.quality_bonus||0,penalty:t.penalties||0,payment:t.payment_received||0,total_cost:t.total_cost||0},inspection:t.inspection||{},materials_used:t.materials_used||[],timeline:{expected:t.timeline_expected||0,actual:t.timeline_actual||0,on_time:t.on_time,early:t.timeline_actual<t.timeline_expected}}}),ki()}function ai(){const i=J.reduce((l,d)=>l+(d.owned||0),0),e=J.reduce((l,d)=>l+(d.deployed||0),0),t=an(J),n=i-e;document.getElementById("eq-count").textContent=i+" UNITS",document.getElementById("eq-summary").innerHTML=`
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
                ${B(t)}
            </div>
        </div>`;const o={};for(const l of J)o[l.equipment_key]=l;let s="";for(let l=1;l<=3;l++){const d=Xe[l],r=Ht(l),c=Wt===l,m=r.reduce((u,y)=>u+(o[y.key]?.owned||0),0),p=r.reduce((u,y)=>u+(o[y.key]?.deployed||0),0);if(s+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${l})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${c?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${d.color}">${b(d.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${d.color};border:1px solid ${d.color}33;background:${d.color}0a">${d.tag}</span>
            </div>
            ${m>0?`<span class="eq-tier-hdr__count">${p}/${m}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,c)for(const u of r){const y=o[u.key],g=y?.owned||0,_=y?.deployed||0,h=y?.condition||0,k=u.maintenancePerUnit*g,M=g-_,C=g>0&&M===0,w=g>0&&h<65,x=Ei(h),T=y?.assigned_projects||[],z=T.length>0?T.map(A=>A.contract_name||"Project").join(", ").slice(0,30):g>0&&_>0?_+" project"+(_>1?"s":""):"—";s+=`<div class="eq-row${g===0?" unowned":""}">`,s+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${g===0?" dim":""}">${b(u.name)}</span>
                        ${w?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${g>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${C?"var(--orange)":"var(--green)"}">${M}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${_}/${g}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,g>0?s+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${h}%;background:${x}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${x}">${h}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${b(z)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${B(k)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:s+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',s+="</div>"}}document.getElementById("eq-list").innerHTML=s;const a=[1,2,3].map(l=>{const d=Xe[l],r=Ht(l).reduce((c,m)=>c+(o[m.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${r>0?d.color+"33":"var(--border-0)"};background:${r>0?d.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${d.color}">${d.tag}</div>
            <div class="eq-footer__tier-count" style="color:${r>0?"var(--text-bright)":"var(--text-dim)"}">${r}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${B(t)}</div>
        </div>
        <div class="eq-footer__tiers">${a}</div>`}function Yn(i){Wt=Wt===i?-1:i,ai()}async function si(){if(!f)return;const{data:i,error:e}=await $.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",f.id);e?(console.warn("Failed to load equipment:",e.message),J=[]):J=i||[],ai()}async function Qn(){const{data:{user:i}}=await $.auth.getUser();if(!i){window.location.href="login.html";return}const{data:e}=await $.from("factions").select("*").or(`id.eq.${i.id},linked_user_id.eq.${i.id}`);Qe=(e||[]).filter(r=>r.nation_id);const t=sessionStorage.getItem("active_faction_id");if(f=Qe.find(r=>r.id===t)||Qe.find(r=>r.faction_type==="corporation")||Qe[0],!f){await $.auth.signOut(),window.location.href="login.html";return}if(f.faction_type!=="corporation"){window.location.href="dashboard.html";return}const[n,o]=await Promise.all([f.nation_id?$.from("nations").select("*").eq("id",f.nation_id).single():Promise.resolve({data:null}),$.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);n.error&&console.warn("Nation load failed:",n.error.message),n.data&&(E=n.data),o.error&&console.warn("Shard load failed:",o.error.message),j=o.data;const s=f.corp_ticker||f.abbreviation||"";if(document.getElementById("corp-logo").textContent=s.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=f.faction_name||"Unnamed Corp",j){if(document.getElementById("game-date").textContent=j.current_date||"—",document.getElementById("tick-number").textContent=j.current_tick||"—",j.next_tick_at){const c=(Number(j.tick_interval_hours)||8)*36e5,m=new Date(j.next_tick_at).getTime(),u=m-c+c/2;Ft=new Date(u>Date.now()?u:m+c/2),dn()}const r=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");r&&(r.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(s?"["+s+"]":f.faction_name||"Corp")+" ▾";const a=document.getElementById("topbar-cash");if(a){const r=Number(f.corp_cash_reserves??0),c=r>=1e9?"$"+(r/1e9).toFixed(1)+"B":r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k";a.textContent="CASH: "+c}const l=document.getElementById("topbar-ap");l&&(l.style.display="none"),document.getElementById("nation-pill").textContent=(E?.name||f.nation||"—").toUpperCase();const d=document.getElementById("corp-faction-dropdown");if(d){let r="";for(const c of Qe){const m=c.id===f.id,p=c.faction_type==="corporation"?"CORP":"PARTY",u=c.faction_type==="corporation"?"var(--teal)":"var(--amber)";r+=`<div class="corp-dd-item${m?" active":""}" onclick="switchToFaction('${c.id}', '${c.faction_type}')">
                <span class="corp-dd-type" style="color:${u}">${p}</span>
                <span class="corp-dd-name">${b(c.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${b(c.abbreviation||"—")}]</span>
            </div>`}d.innerHTML=r}await Promise.all([ge(),Ni(),ii(),si(),Gn(),Vn(),it()]);try{const{data:r}=await $.from("nations").select("*").order("name");lt=r||[]}catch{lt=[]}if(qi(),ut(),on(f,E,j),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",new URLSearchParams(window.location.search).get("tab")==="expansion"){const r=document.querySelector('[data-tab="expansion"]');r&&Pi({preventDefault:()=>{},target:r})}}async function Kn(){await $.auth.signOut(),window.location.href="login.html"}function Jn(){const i=document.getElementById("corp-faction-dropdown");i&&i.classList.toggle("open")}function Xn(i,e){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.remove("open"),sessionStorage.setItem("active_faction_id",i),e==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",i=>{const e=document.getElementById("faction-switcher"),t=document.getElementById("corp-faction-dropdown");t&&e&&!e.contains(i.target)&&t.classList.remove("open")});document.addEventListener("keydown",i=>{i.key==="Escape"&&tt()});window.doLogout=Kn;window.toggleTheme=cn;window.toggleCorpDropdown=Jn;window.switchToFaction=Xn;window.setFilter=pn;window.openContractDetail=Ai;window.closeContractDetail=tt;window.toggleWhRow=In;window.toggleEqTier=Yn;window.switchEmNation=Bn;window.setEmType=Rn;window.setEmListing=On;window.setEmQty=Pn;window.purchaseEquipment=Dn;window.setPrMat=An;window.setPrTier=zn;window.setPrQty=Nn;window.purchaseMaterial=qn;let V={general:0,skilled:0,innovative:0},Nt=!1;const qe=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function Oi(i){const e=Number(E?.minimum_wage??50),t=Number(E?.inflation??50),n=Number(E?.standard_of_living??50),o=e/100*48e3,s=1+(t-50)/100*.5,a=1+(n-50)/100*.5;return Math.round(o*i*s*a)}function v(i){const e=Math.abs(i),t=i<0?"-":"";return e>=1e9?t+"$"+(e/1e9).toFixed(2)+"B":e>=1e6?t+"$"+(e/1e6).toFixed(2)+"M":e>=1e3?t+"$"+(e/1e3).toFixed(1)+"k":t+"$"+e.toLocaleString()}async function Pi(i){i.preventDefault(),document.getElementById("operations-content").style.display="none";const e=document.getElementById("expansion-content");e.style.display="flex",e.style.justifyContent="center",e.style.gap="12px",e.style.alignItems="flex-start",e.style.flexWrap="wrap",document.querySelectorAll(".corp-nav__tab").forEach(t=>t.classList.remove("active")),i.target.classList.add("active"),await it(),gt(),io(),await ri(),xt(),await _o(),await uo(),$t(),bt(),await Io(),_t()}function Di(i){i&&i.preventDefault(),document.getElementById("operations-content").style.display="flex",document.getElementById("expansion-content").style.display="none",document.querySelectorAll(".corp-nav__tab").forEach(e=>e.classList.remove("active")),document.querySelector('[data-tab="operations"]')?.classList.add("active")}function yt(){return G.reduce((e,t)=>{const n=Number(t.capacity||0),o=Number(t.condition||0)/100;return e+Math.floor(n*o)},0)+500}function Zn(i,e){const t=qe.find(s=>s.id===i),n=Number(f?.[t.factionKey]??0),o=V[i]+e;if(!(n+o<0)){if(e>0){const s=qe.reduce((l,d)=>{const r=Number(f?.[d.factionKey]??0),c=d.id===i?o:V[d.id];return l+r+c},0),a=yt();if(s>a)return}V[i]=o,gt()}}function eo(i){i?V[i]=0:V={general:0,skilled:0,innovative:0},gt()}async function to(){if(Nt||!Object.values(V).some(a=>a!==0))return;let e=0;for(const a of qe){const l=V[a.id];l>0&&(e+=l*Oi(a.multiplier)*.1)}const t=Number(f?.corp_cash_reserves??0);if(e>t){alert("Insufficient cash reserves. Hiring cost: "+v(e)+", available: "+v(t));return}const n=qe.reduce((a,l)=>a+Number(f?.[l.factionKey]??0)+V[l.id],0),o=yt();if(n>o){alert("Cannot hire beyond property capacity ("+o.toLocaleString()+"). You need more workplaces.");return}const s=e>0?`Confirm workforce changes?

Hiring fee: `+v(e)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(s)){Nt=!0;try{const a={};for(const r of qe){const c=Number(f?.[r.factionKey]??0);a[r.factionKey]=Math.max(0,c+V[r.id])}e>0&&(a.corp_cash_reserves=Math.max(0,t-Math.round(e)));const{error:l}=await $.from("factions").update(a).eq("id",f.id);if(l)throw l;Object.assign(f,a),V={general:0,skilled:0,innovative:0};const d=document.getElementById("topbar-cash");if(d){const r=Number(f.corp_cash_reserves??0);d.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")}gt()}catch(a){alert("Error: "+a.message)}finally{Nt=!1}}}function gt(){const i=document.getElementById("hf-card-container");if(!i)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=Number(E?.minimum_wage??50),o=Number(E?.inflation??50),s=Number(E?.standard_of_living??50),a=n/100*48e3,l=(1+(o-50)/100*.5).toFixed(2),d=(1+(s-50)/100*.5).toFixed(2),r=E?.name||f?.nation||"Nation",c=Object.values(V).some(k=>k!==0),m=yt();let p=0,u=0,y=0,g=0,_="";for(const k of qe){const M=Number(f?.[k.factionKey]??0),C=V[k.id],w=M+C,x=Oi(k.multiplier),T=C>0,z=M*x,A=w*x,O=A-z;p+=M,u+=w,y+=z,g+=A;const L=C!==0?T?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";_+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${t.border};background:${L};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${k.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${k.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${t.text}">${M.toLocaleString()}</span>
                    ${C!==0?`<span style="font-family:${e};font-size:10px;color:${t.dim}">→</span>
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${T?t.greenBright:t.red}">${w.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${k.multiplier}.0 × ${l} × ${d})</span>
                <span style="font-family:${e};font-size:10px;color:${k.color}">${v(x)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${k.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.red};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-50</div>
                <div onclick="hfSetChange('${k.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.redDim};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${C!==0?t.card:"transparent"};border:1px solid ${C!==0?t.border:"transparent"}">
                    ${C!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${e};font-size:12px;font-weight:700;color:${T?t.greenBright:t.red}">${T?"+":""}${C}</span>
                        <span onclick="hfReset('${k.id}')" style="font-family:${e};font-size:8px;color:${t.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${e};font-size:9px;color:${t.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${k.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+10</div>
                <div onclick="hfSetChange('${k.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+50</div>
            </div>
            ${C!==0?`<div style="margin-top:6px;padding:4px 8px;background:${t.bg};border:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${O>0?t.red:t.greenBright}">${O>0?"+":""}${v(O)}/yr</span>
            </div>`:""}
        </div>`}const h=g-y;i.innerHTML=`
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
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">${v(a)}/yr</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">INFLATION</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${o}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${l}</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">STD OF LIVING</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${s}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${d}</div>
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
                        <span style="font-family:${e};font-size:13px;font-weight:700;color:${p>=m?t.red:t.text}">${c?u.toLocaleString():p.toLocaleString()}</span>
                        <span style="font-family:${e};font-size:9px;color:${t.dim}">/ ${m.toLocaleString()}</span>
                    </div>
                    ${p>=m&&!c?`<div style="font-family:${e};font-size:7px;color:${t.red};margin-top:2px;">Need workplaces to hire new employees.</div>`:""}
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${v(y)}</span>
                        ${c?`<span style="font-family:${e};font-size:9px;color:${t.dim}">→</span>
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${h>0?t.red:t.greenBright}">${v(g)}</span>`:""}
                    </div>
                </div>
            </div>
            ${c?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${t.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">NET CHANGE</span>
                    <span style="font-family:${e};font-size:11px;font-weight:700;color:${h>0?t.red:t.greenBright}">${h>0?"+":""}${v(h)}/yr</span>
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">(${h>0?"+":""}${v(Math.round(h/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${t.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}function io(){const i=document.getElementById("wf-summary-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},n=(E?.name||f?.nation||"Nation").toUpperCase(),o=Number(E?.minimum_wage??50),s=Number(E?.inflation??50),a=Number(E?.standard_of_living??50),l=o/100*48e3,d=1+(s-50)/100*.5,r=1+(a-50)/100*.5,c=[{label:"General Workforce",mult:2,color:t.accent,key:"corp_general_workforce",countColor:t.text},{label:"Skilled Workforce",mult:3,color:t.gold,key:"corp_skilled_workforce",countColor:t.blue},{label:"Innovative Workforce",mult:6,color:t.orange,key:"corp_innovative_workforce",countColor:t.gold}];let m=0,p=0,u="";for(const y of c){const g=Number(f?.[y.key]??0),_=Math.round(l*y.mult*d*r),h=g*_;m+=g,p+=h,u+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${y.label}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${n}</span>
                </div>
                <span style="font-family:${e};font-size:16px;font-weight:700;color:${y.countColor}">${g.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${y.mult}.0 × ${d.toFixed(2)} × ${r.toFixed(2)})</span>
                <span style="font-family:${e};font-size:10px;color:${t.muted}">${v(_)}/yr</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">TOTAL ANNUAL COST</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${v(h)}</span>
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
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">MINIMUM WAGE (${n})</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">${o}/100 → ${v(l)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">INFLATION MODIFIER</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">×${d.toFixed(2)}</span>
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
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.text}">${m.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL ANNUAL WAGES</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${v(p)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">PER TICK (÷12)</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${v(Math.round(p/12))}</span>
            </div>
        </div>
    </div>`}let G=[];async function it(){if(!f?.id)return;const{data:i}=await $.from("corp_properties").select("*").eq("faction_id",f.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});G=i||[]}function vt(){const i=document.getElementById("property-card-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=(E?.name||f?.nation||"Nation").toUpperCase(),o=1+(Number(E?.inflation??50)-50)/100*.3;let s="",a=0,l=0;const d=E?.name||f?.nation||"Home Nation",r=5e7,c=1+(Number(E?.inflation??50)-50)/100*.3,m=.8+Number(E?.stability??50)/100*.4,p=Math.round(r*c*m),u=Math.round(p*.005);a+=p,l+=u,s+=`
    <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span style="font-size:11px;font-weight:600;color:${t.text}">National Headquarters</span>
            <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:#5c5;background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">HQ</span>
        </div>
        <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:4px;">${d} · Headquarters</div>
        <div style="display:flex;gap:0;background:${t.card};border:1px solid ${t.border}">
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">CAPACITY</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">500</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">VALUE</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${v(p)}</div>
            </div>
            <div style="flex:1;padding:3px 6px">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${v(u)}</div>
            </div>
        </div>
    </div>`;for(const y of G){const g=dt[y.style]||dt.Basic;a+=Number(y.purchase_price||0),l+=Number(y.monthly_maintenance||0),s+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:${t.text}">${y.name}</span>
                <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${t.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">OWNED</span>
            </div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:4px;">${y.city||n} · ${(y.type||"").replace(/_/g," ")} · <span style="color:${g.color}">${(y.style||"Basic").toUpperCase()}</span></div>
            <div style="display:flex;gap:0;background:${t.card};border:1px solid ${t.border}">
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">CAPACITY</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${(y.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">PAID</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${v(y.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${v(y.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="margin-top:4px;display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">CONDITION</span>
                <span style="font-family:${e};font-size:9px;color:${y.condition>=75?"#5c5":y.condition>=50?"#ca5":t.orange}">${y.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:${t.border};margin-top:2px;"><div style="width:${y.condition}%;height:100%;background:${y.condition>=75?"#5c5":y.condition>=50?"#ca5":t.orange}"></div></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <div onclick="propRefurbish('${y.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.accent};border:1px solid ${t.accent}33;cursor:pointer;">REFURBISH (${v(Math.round((y.purchase_price||0)*.1*o))})</div>
                <div onclick="propSell('${y.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.red};border:1px solid ${t.red}33;cursor:pointer;">SELL</div>
            </div>
        </div>`}i.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Property</span>
            </div>
            <span style="font-family:${e};font-size:10px;color:${t.muted}">${G.length+1} ASSET${G.length+1!==1?"S":""}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${s}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL VALUE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.green}">${v(a)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL MAINTENANCE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${v(l)}/mo</span>
            </div>
        </div>
    </div>`}let He=[],K=null;const dt={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function ri(){if(!f?.nation_id)return;const{data:i,error:e}=await $.from("available_properties").select("*").eq("nation_id",f.nation_id).eq("status","available").order("price",{ascending:!0});if(e){console.warn("[Property] Failed to load marketplace:",e.message);return}He=(i||[]).map(t=>({...t,adjusted_cost:t.price,adjusted_maintenance:t.monthly_maintenance}))}function xt(){const i=document.getElementById("new-property-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"};(E?.name||f?.nation||"Nation").toUpperCase();const n=Number(E?.standard_of_living??50),o=Number(E?.gdp_growth??50),s=Number(E?.inflation??50),a=E?.capital||"Capital",l={capital:a,port:a+" Port",industrial:a+" Industrial Zone",suburban:a+" Suburbs",coastal:a+" Coast"};let d="";if(He.length===0)d=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let r=0;r<He.length;r++){const c=He[r],m=K===r,p=dt[c.style]||dt.Basic,u=l[c.city_template]||a;d+=`
            <div onclick="npSelect(${r})" style="padding:8px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${m?t.accent:"transparent"};background:${m?"rgba(139,154,107,0.03)":"transparent"};">
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
                        <div style="font-family:${e};font-size:11px;font-weight:700;color:${t.gold};margin-top:1px">${v(c.adjusted_cost)}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">MAINT/MO</div>
                        <div style="font-family:${e};font-size:11px;font-weight:700;color:${t.redDim};margin-top:1px">${v(c.adjusted_maintenance)}</div>
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
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${He.length} AVAILABLE</span>
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
            ${d}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;gap:6px;justify-content:space-between;">
                <div onclick="npOpenConstructionModal()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${t.gold};border:1px solid ${t.gold}44;cursor:pointer">CONSTRUCTION PROJECT</div>
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${K!==null?"#000":t.dim};background:${K!==null?t.accent:"transparent"};border:1px solid ${K!==null?t.accent:t.border};cursor:${K!==null?"pointer":"default"};opacity:${K!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function no(i){K=K===i?null:i,xt()}let qt=!1;async function oo(){if(K===null||qt)return;const i=He[K];if(!i)return;const e=Number(f?.corp_cash_reserves??0);if(i.adjusted_cost>e){alert(`Insufficient cash reserves.
Property: `+v(i.adjusted_cost)+`
Cash: `+v(e));return}if(confirm('Buy "'+i.name+'" for '+v(i.adjusted_cost)+`?

Monthly maintenance: `+v(i.adjusted_maintenance)+`/mo
Condition: `+i.condition+`%

This will be deducted from your cash reserves.`)){qt=!0;try{const{error:t}=await $.from("corp_properties").insert({faction_id:f.id,nation_id:f.nation_id,catalog_id:i.catalog_id||null,name:i.name,type:i.type,style:i.style,capacity:i.capacity,purchase_price:i.adjusted_cost,monthly_maintenance:i.adjusted_maintenance,condition:i.condition,city:i.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(t)throw t;const n=Math.max(0,e-i.adjusted_cost),{error:o}=await $.from("factions").update({corp_cash_reserves:n}).eq("id",f.id);if(o)throw o;f.corp_cash_reserves=n,i.id&&await $.from("available_properties").update({status:"sold",purchased_by:f.id}).eq("id",i.id);const s=document.getElementById("topbar-cash");s&&(s.textContent="CASH: "+(n>=1e6?"$"+(n/1e6).toFixed(1)+"M":"$"+Math.round(n/1e3)+"k")),K=null,await ri(),xt(),vt(),alert("Property purchased: "+i.name+`

Deducted: `+v(i.adjusted_cost))}catch(t){alert("Purchase failed: "+t.message)}finally{qt=!1}}}const Se={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let li=!1,S={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},Lt=!1;function ji(){const e=1+(Number(E?.inflation??50)-50)/100*.3,t=Se[S.style]?.costMod||1,n=S.type==="Warehouse"?.75:1,o=Math.round(S.size*1e5*e*t*n),s=Math.round(o*(1+S.budgetMod/100)),a=Math.round(s*.007*(Se[S.style]?.maintMod||1));return{baseBudget:o,adjusted:s,maint:a,inflMod:e,styleMod:t}}function ao(){li=!0,S={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},Hi()}function di(){li=!1,document.getElementById("cp-modal-overlay")?.remove()}function so(i,e){S[i]=e,Hi()}async function ro(){if(!(Lt||!S.name.trim())){Lt=!0;try{const i=ji(),e=E?.name||f?.nation||"Unknown",t=Se[S.style]?.repGain||1,n=await $.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),o=n.data?.current_tick||0,s=(n.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:a}=await $.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",f.nation_id).eq("issuer_type","PRIVATE"),d=`PVT-C${(a||0)+1}-${s}`,{error:r}=await $.from("construction_contracts").insert({nation_id:f.nation_id,template_key:"custom_building",sector:"civil_engineering",name:S.name.trim(),description:`${S.type} (${S.style}) — ${S.size.toLocaleString()} employees, commissioned by ${f.faction_name}`,project_code:d,budget_ceiling:i.adjusted,timeline_ticks:S.timeline,required_materials:(()=>{const c=S.size/1e3,m=S.style,p={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[m]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},u=(y,g)=>Math.max(1,Math.ceil(c*y*g));return{concrete:u(8,p.concrete),steel:u(6,p.steel),glass_facades:u(3,p.glass),em_systems:u(4,p.em),lumber:u(1,p.lumber),heavy_parts:u(2,p.heavy),aggregate:u(3,p.agg)}})(),required_equipment:(()=>{const c=["work_trucks","concrete_mixers"];return S.size>1e3&&c.push("excavators","tower_cranes"),S.size>3e3&&c.push("bulldozers","heavy_haulers"),S.size>8e3&&c.push("pile_drivers"),c})(),required_workforce:{general:Math.ceil(S.size*.08),skilled:Math.ceil(S.size*.03)},status:"open",generated_at_tick:o,bidding_ends_tick:o+3,issuer_type:"PRIVATE",issuer_name:f.faction_name,issuer_faction_id:f.id});if(r)throw r;di(),alert(`Construction project submitted!

Project: `+S.name.trim()+`
Code: `+d+`
Budget: `+v(i.adjusted)+`
Expected Reputation: +`+t+`

All construction corporations in `+e+" can now bid on this project.")}catch(i){alert("Failed to submit project: "+i.message)}finally{Lt=!1}}}function Hi(){if(document.getElementById("cp-modal-overlay")?.remove(),!li)return;const i="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=ji(),n=E?.name||f?.nation||"Nation",o=Se[S.style]?.repGain||1,s=o>=4?e.gold:o>=3?e.greenBright:o>=2?e.accent:e.dim,a=Object.entries(Se).map(([r,c])=>{const m=S.style===r;return`<div onclick="cpSetField('style','${r}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${m?c.color+"18":"transparent"};border:1px solid ${m?c.color+"44":e.border};">
            <div style="font-family:${i};font-size:9px;font-weight:700;color:${m?c.color:e.dim}">${r}</div>
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
                <input id="cp-name-input" value="${S.name.replace(/"/g,"&quot;")}" placeholder="e.g., McKenna Tower"
                    style="width:100%;padding:6px 10px;font-family:${i};font-size:11px;color:${e.text};background:${e.card};border:1px solid ${e.border};outline:none;box-sizing:border-box;" />
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Type</div>
                <div style="display:flex;gap:4px;">
                    ${["Regional HQ","Office Building",...f?.corp_sector==="Construction"?["Warehouse"]:[]].map(r=>`<span onclick="cpSetField('type','${r}')" style="flex:1;text-align:center;padding:5px 0;font-family:${i};font-size:9px;font-weight:700;cursor:pointer;color:${S.type===r?"#000":e.dim};background:${S.type===r?r==="Warehouse"?e.orange:e.accent:"transparent"};border:1px solid ${S.type===r?r==="Warehouse"?e.orange:e.accent:e.border}">${r}</span>`).join("")}
                </div>
                ${S.type==="Warehouse"?`<div style="font-family:${i};font-size:7px;color:${e.orange};margin-top:4px;">Warehouse: 75% construction cost, stores up to $20M in materials</div>`:""}
            </div>

            <div style="margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase">Size (Employees)</span>
                    <span style="font-family:${i};font-size:14px;font-weight:700;color:${e.text}">${S.size.toLocaleString()}</span>
                </div>
                <input type="range" min="500" max="18000" step="500" value="${S.size}" oninput="cpSetField('size',+this.value)"
                    style="width:100%;accent-color:${e.accent};height:4px;" />
                <div style="display:flex;justify-content:space-between;font-family:${i};font-size:7px;color:${e.dim};margin-top:2px">
                    <span>500 min</span><span>18,000 max</span>
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Style</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">${a}</div>
                <div style="margin-top:4px;font-family:${i};font-size:8px;color:${Se[S.style].color}">${Se[S.style].desc}</div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase">Timeline</span>
                    <span style="font-family:${i};font-size:12px;font-weight:700;color:${e.text}">${S.timeline} months</span>
                </div>
                <input type="range" min="24" max="60" step="6" value="${S.timeline}" oninput="cpSetField('timeline',+this.value)"
                    style="width:100%;accent-color:${e.gold};height:4px;" />
                <div style="display:flex;justify-content:space-between;font-family:${i};font-size:7px;color:${e.dim};margin-top:2px">
                    <span>24 months</span><span>60 months</span>
                </div>
            </div>

            <div style="margin-bottom:12px;">
                <div style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:6px">Budget</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:8px 10px;">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${e.border}">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">BASE (${S.size.toLocaleString()} × $100k × ${t.inflMod.toFixed(2)} × ${t.styleMod.toFixed(1)})</span>
                        <span style="font-family:${i};font-size:9px;color:${e.muted}">${v(t.baseBudget)}</span>
                    </div>
                    <div style="padding:6px 0">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px">
                            <span style="font-family:${i};font-size:8px;color:${e.dim}">ADJUSTMENT</span>
                            <span style="font-family:${i};font-size:10px;font-weight:700;color:${S.budgetMod>0?e.greenBright:S.budgetMod<0?e.red:e.dim}">${S.budgetMod>0?"+":""}${S.budgetMod}%</span>
                        </div>
                        <input type="range" min="-15" max="15" step="1" value="${S.budgetMod}" oninput="cpSetField('budgetMod',+this.value)"
                            style="width:100%;accent-color:${e.accent};height:4px;" />
                        <div style="display:flex;justify-content:space-between;font-family:${i};font-size:7px;color:${e.dim};margin-top:2px">
                            <span>-15% (budget cut)</span><span>+15% (quality invest)</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:4px 0;border-top:1px solid ${e.border}">
                        <span style="font-family:${i};font-size:9px;font-weight:700;color:${e.text}">TOTAL BUDGET</span>
                        <span style="font-family:${i};font-size:14px;font-weight:700;color:${e.gold}">${v(t.adjusted)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">EST. MONTHLY MAINTENANCE</span>
                        <span style="font-family:${i};font-size:9px;color:${e.redDim}">${v(t.maint)}/mo</span>
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
                <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:2px">${S.style} style · ${o===5?"Maximum prestige":o>=4?"Impressive presence":o>=3?"Strong statement":o>=2?"Solid investment":"Functional addition"}</div>
            </div>

        </div>
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${i};font-size:7px;color:${e.dim}">TOTAL PROJECT</div>
                <div style="font-family:${i};font-size:14px;font-weight:700;color:${e.gold}">${v(t.adjusted)}</div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="cpClose()" style="padding:5px 16px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:5px 16px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${e.gold};cursor:pointer;opacity:${S.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(l);const d=document.getElementById("cp-name-input");d&&d.addEventListener("input",r=>{S.name=r.target.value}),l.addEventListener("click",r=>{r.target===l&&di()})}function lo(){const i=document.getElementById("cp-name-input");if(i&&(S.name=i.value),!S.name.trim()){alert("Please enter a building name.");return}ro()}window.cpClose=di;window.cpSetField=so;window.cpSubmitFromModal=lo;window.npSelect=no;window.npBuyProperty=oo;window.npOpenConstructionModal=ao;let We=!1;async function co(i){if(We)return;const e=G.find(l=>l.id===i);if(!e)return;const t=1+(Number(E?.inflation??50)-50)/100*.3,n=Math.round((e.purchase_price||0)*.1*t),o=Number(f?.corp_cash_reserves??0);if(n>o){alert("Insufficient cash. Refurbishment costs "+v(n)+" (inflation-adjusted), you have "+v(o));return}if(e.condition>=95){alert("Property is already in excellent condition ("+e.condition+"%).");return}const s=5+Math.floor(Math.random()*21),a=Math.min(100,e.condition+s);if(confirm('Refurbish "'+e.name+`"?

Cost: `+v(n)+`
Expected improvement: +`+s+"% condition ("+e.condition+"% → "+a+"%)")){We=!0;try{await $.from("corp_properties").update({condition:a}).eq("id",i);const l=Math.max(0,o-n);await $.from("factions").update({corp_cash_reserves:l}).eq("id",f.id),f.corp_cash_reserves=l;const d=document.getElementById("topbar-cash");d&&(d.textContent="CASH: "+(l>=1e6?"$"+(l/1e6).toFixed(1)+"M":"$"+Math.round(l/1e3)+"k")),await it(),vt(),alert("Refurbished! Condition: "+e.condition+"% → "+a+"%")}catch(l){alert("Refurbishment failed: "+l.message)}finally{We=!1}}}async function po(i){if(We)return;const e=G.find(s=>s.id===i);if(!e)return;const t=1+(Number(E?.inflation??50)-50)/100*.3,n=(e.condition||50)/100,o=Math.round((e.purchase_price||0)*.6*n*t);if(confirm('Sell "'+e.name+`"?

Sale value: `+v(o)+" (60% × "+e.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){We=!0;try{await $.from("corp_properties").update({is_active:!1}).eq("id",i);const a=Number(f?.corp_cash_reserves??0)+o;await $.from("factions").update({corp_cash_reserves:a}).eq("id",f.id),f.corp_cash_reserves=a;const d=(await $.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await $.from("available_properties").insert({nation_id:f.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,price:Math.round(o*1.1),monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,generated_at_tick:d,expires_at_tick:d+6,status:"available"});const r=document.getElementById("topbar-cash");r&&(r.textContent="CASH: "+(a>=1e6?"$"+(a/1e6).toFixed(1)+"M":"$"+Math.round(a/1e3)+"k")),await it(),vt(),await ri(),xt(),alert('Sold "'+e.name+'" for '+v(o))}catch(s){alert("Sale failed: "+s.message)}finally{We=!1}}}window.propRefurbish=co;window.propSell=po;const Ee={SALE:.8,DISSOLVE:.6,REVENUE_BASE:.02,GDP_NEUTRAL:30,DEFAULT_REPUTATION:25};function fo(i){if(!i)return 0;const e=i.trim().replace(/[$,]/g,""),t=e.match(/^([\d.]+)\s*[Mm]$/),n=e.match(/^([\d.]+)\s*[Kk]$/);return Math.round(t?parseFloat(t[1])*1e6:n?parseFloat(n[1])*1e3:parseFloat(e))}function Ve(i){const e=document.getElementById("topbar-cash");e&&(e.textContent="CASH: "+(i>=1e6?"$"+(i/1e6).toFixed(1)+"M":"$"+Math.round(i/1e3)+"k"))}function mo(i){return Ye.find(e=>e.id===i)?.name||"—"}function ci(i){return G.filter(e=>e.nation_id===i)}async function pi(){Ue=0,await it(),vt(),bt(),$t()}let le=!1,Ue=0,st={};async function uo(){if(f?.id)try{const{data:i}=await $.from("construction_contracts").select("nation_id").eq("awarded_to_faction",f.id).in("status",["in_progress","awarded"]);st={};for(const e of i||[])e.nation_id&&(st[e.nation_id]=(st[e.nation_id]||0)+1)}catch{}}function Ui(i){const e=ci(i.nation_id),t=e.reduce((y,g)=>y+Number(g.purchase_price||0),0),n=e.reduce((y,g)=>y+Number(g.capacity||0),0),o=st[i.nation_id]||0,s=Ye.find(y=>y.id===i.nation_id),a=(i.name||"").trim().split(/\s+/),l=a.length>=2?a.map(y=>y[0]).join("").toUpperCase().slice(0,4):(i.name||"SUB").slice(0,4).toUpperCase(),d=Number(i.sub_cash||0),r=Number(s?.gdp_growth??50),c=d*Ee.REVENUE_BASE,m=(r-Ee.GDP_NEUTRAL)/100,p=Ee.DEFAULT_REPUTATION/100,u=d>0?Math.round(c*(1+m)*p):0;return{id:i.id,name:i.name,abbr:l,nation:s?.name||i.city||"—",nationId:i.nation_id,sector:f?.corp_sector||"General",subsector:i.subsector||f?.corp_subsector||"—",revenue:u,debt:0,cash:d,reputation:Ee.DEFAULT_REPUTATION,valuation:t,workforce:n,projects:o,established:i.created_at?new Date(i.created_at).getFullYear().toString():"—",trend:r>=40&&d>0?"up":r>=Ee.GDP_NEUTRAL&&d>0?"flat":"down",profitable:u>0}}function bt(){const i=document.getElementById("manage-subsidiaries-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},o=G.filter(c=>c.type==="regional_hq").map(Ui);Ue>=o.length&&(Ue=0);const s=o[Ue]||null;let a="";o.length===0&&(a=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No subsidiaries established.<br>Use Create Subsidiary to expand.</div>`);let l=0,d=0;for(let c=0;c<o.length;c++){const m=o[c],p=c===Ue;l+=m.revenue,d+=m.valuation;const u=m.trend==="up"?t.greenBright:m.trend==="down"?t.red:t.dim,y=m.trend==="up"?"▲":m.trend==="down"?"▼":"–";a+=`
        <div onclick="selectSubsidiary(${c})" style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${p?t.accent:"transparent"};background:${p?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:40px;font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${m.abbr}</span>
            <div style="flex:1.5;">
                <div style="font-size:11px;font-weight:600;color:${t.text};line-height:1.2">${m.name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${m.subsector}</div>
            </div>
            <span style="width:65px"><span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${m.nation.toUpperCase().slice(0,8)}</span></span>
            <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${m.profitable?t.greenBright:t.redDim};text-align:right">${v(m.revenue)}</span>
            <span style="width:40px;font-family:${e};font-size:9px;font-weight:700;color:${m.reputation>=40?t.accent:m.reputation>=25?t.yellow:t.orange};text-align:right">${m.reputation}</span>
            <span style="width:55px;font-family:${e};font-size:9px;color:${t.muted};text-align:right">${v(m.valuation)}</span>
            <span style="width:12px;font-family:${e};font-size:8px;color:${u};text-align:right">${y}</span>
        </div>`}let r="";if(s){const c=s.trend==="up"?t.greenBright:s.trend==="down"?t.red:t.dim,m=s.trend==="up"?"▲":s.trend==="down"?"▼":"–",p=s.trend==="up"?"Growing":s.trend==="down"?"Declining":"Stable",u=s.reputation>=40?t.accent:s.reputation>=25?t.yellow:t.orange,y=[{label:"Revenue",value:v(s.revenue),color:s.profitable?t.greenBright:t.redDim},{label:"Cash",value:v(s.cash),color:t.text},{label:"Debt",value:s.debt>0?v(s.debt):"$0",color:s.debt>0?t.orange:t.dim},{label:"Reputation",value:s.reputation+"/100",color:u},{label:"Market Valuation",value:v(s.valuation),color:t.gold},{label:"Workforce",value:s.workforce.toLocaleString(),color:t.text},{label:"Active Projects",value:s.projects.toString(),color:s.projects>0?t.text:t.dim}],g=s.projects===0;r=`
            <div style="padding:8px 14px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                    <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.gold}">${s.abbr}</span>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${s.name}</span>
                </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${s.nation.toUpperCase()}</span>
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">Est. ${s.established}</span>
                    <span style="font-family:${e};font-size:8px;color:${c}">${m} ${p}</span>
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
                    <div onclick="${g?"subDissolve('"+s.id+"')":""}" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${g?t.red:t.dim};border:1px solid ${g?t.red:t.border};opacity:${g?1:.3}">DISSOLVE</div>
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
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${v(l)}</span>
                    <span style="width:40px"></span>
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${v(d)}</span>
                    <span style="width:12px"></span>
                </div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${r}
            </div>
        </div>
    </div>`}async function Gi(i,e){if(le)return;const t=G.find(u=>u.id===i);if(!t)return;const n=e==="sell",o=n?Ee.SALE:Ee.DISSOLVE,s=n?"SELL":"DISSOLVE",a=n?"sold":"dissolved",l=n?"80%":"60%",d=mo(t.nation_id),r=ci(t.nation_id),c=r.reduce((u,y)=>u+Math.round((y.purchase_price||0)*o*(y.condition||50)/100),0),m=Number(t.sub_cash||0),p=c+m;if(confirm(s+' subsidiary "'+t.name+`"?

`+r.length+" properties at "+l+` × condition:
  Property value: `+v(c)+`
  Subsidiary cash: `+v(m)+`
  ─────────────────
  Total return: `+v(p)+`

All operations in `+d+` cease.
This cannot be undone.`)){le=!0;try{const u=r.map(g=>g.id);if(u.length===1){const{error:g}=await $.from("corp_properties").update({is_active:!1}).eq("id",u[0]);if(g)throw g}else if(u.length>1){const{error:g}=await $.from("corp_properties").update({is_active:!1}).in("id",u);if(g)throw g}await $.from("corp_properties").update({sub_cash:0}).eq("id",i).then(()=>{}).catch(()=>{});const y=Number(f?.corp_cash_reserves??0)+p;await $.from("factions").update({corp_cash_reserves:y}).eq("id",f.id),f.corp_cash_reserves=y,Ve(y),await pi(),alert("Subsidiary "+a+". "+r.length+` properties liquidated.
Total received: `+v(p))}catch(u){alert("Failed: "+u.message)}finally{le=!1}}}function yo(i){Gi(i,"sell")}function go(i){Gi(i,"dissolve")}async function Wi(i,e){if(le)return;const t=G.find(m=>m.id===i);if(!t)return;const n=Number(f?.corp_cash_reserves??0),o=Number(t.sub_cash||0),s=e?"WITHDRAW":"INJECT CAPITAL";if(e&&o<=0){alert("This subsidiary has no cash to withdraw.");return}const a=e?o:n,l=prompt(s+(e?" from ":" into ")+t.name+`

Parent cash: `+v(n)+`
Subsidiary cash: `+v(o)+`

Enter amount (e.g., 5000000 or 5M):`);if(!l)return;const d=fo(l);if(!d||d<=0||isNaN(d)){alert("Invalid amount.");return}if(d>a){alert("Insufficient "+(e?"subsidiary":"parent")+" cash. Available: "+v(a));return}const r=e?n+d:n-d,c=e?o-d:o+d;if(confirm(s+" "+v(d)+(e?" from ":" into ")+t.name+`?

Parent: `+v(n)+" → "+v(r)+`
Subsidiary: `+v(o)+" → "+v(c))){le=!0;try{await Promise.all([$.from("factions").update({corp_cash_reserves:r}).eq("id",f.id),$.from("corp_properties").update({sub_cash:c}).eq("id",i)]),f.corp_cash_reserves=r,t.sub_cash=c,Ve(r),bt(),alert((e?"Withdrew ":"Injected ")+v(d)+(e?" from ":" into ")+t.name+".")}catch(m){alert("Failed: "+m.message)}finally{le=!1}}}function vo(i){Wi(i,!1)}function xo(i){Wi(i,!0)}async function bo(i){if(le)return;const e=G.find(g=>g.id===i);if(!e)return;const t=Ui(e);t.nation;const n=ci(e.nation_id),o=t.valuation,s=t.cash,a=t.reputation,l=t.subsector,d=Math.round(o*2.25),r=Math.round(a*.1),c=Math.round(a*.2),m=yt(),p=qe.reduce((g,_)=>g+Number(f?.[_.factionKey]??0),0),u=Math.max(0,m-p),y=Number(f?.corp_cash_reserves??0);if(d>y){alert(`Insufficient cash to acquire subsidiary.

Acquisition cost (2.25× valuation): `+v(d)+`
Available cash: `+v(y));return}if(t.projects>0){alert("Cannot merge — subsidiary has "+t.projects+" active project(s). Complete or abandon them first.");return}if(confirm('MERGE "'+e.name+`" INTO YOUR CORPORATION

Acquisition cost (2.25× valuation): `+v(d)+`
Subsidiary cash absorbed: `+v(s)+`
Net cost: `+v(d-s)+`

• `+n.length+` properties transferred to parent
• Subsidiary subsector "`+l+`" added to portfolio
• Workers hired to max capacity (+`+u.toLocaleString()+`)
• Reputation: +`+r+" or -"+c+" (from sub rep "+a+`)

This cannot be undone.`)){le=!0;try{const g=f.nation_id;if(n.length>0){const T=n.filter(A=>A.id!==e.id).map(A=>A.id);if(T.length===1){const{error:A}=await $.from("corp_properties").update({nation_id:g,type:"office"}).eq("id",T[0]);if(A)throw A}else if(T.length>1){const{error:A}=await $.from("corp_properties").update({nation_id:g,type:"office"}).in("id",T);if(A)throw A}const{error:z}=await $.from("corp_properties").update({nation_id:g,type:"office",sub_cash:0,subsector:null}).eq("id",e.id);if(z)throw z}const _=y-d+s,k=Number(f?.corp_general_workforce??0)+u,M=Math.random()>=.5?r:-c,C=Number(f?.standing??50),w=Math.max(0,Math.min(100,C+M)),{error:x}=await $.from("factions").update({corp_cash_reserves:_,corp_general_workforce:k,standing:w}).eq("id",f.id);if(x)throw x;f.corp_cash_reserves=_,f.corp_general_workforce=k,f.standing=w,Ve(_),await pi(),alert(`Merger complete!

"`+e.name+`" absorbed into your corporation.
Cost: `+v(d)+" | Cash absorbed: "+v(s)+`
Reputation `+(M>=0?"+":"")+M+" (now "+w+`)
Workers hired: +`+u.toLocaleString()+` general workforce
Properties: `+n.length+" transferred to parent")}catch(g){alert("Merge failed: "+g.message)}finally{le=!1}}}window.subDissolve=go;window.subInjectCapital=vo;window.subWithdraw=xo;window.subMerge=bo;window.subSell=yo;window.selectSubsidiary=function(i){Ue=i,bt()};let Ye=[],Je={},ie=null,Bt=!1,Be="",Ze="",Re="";const $o={Construction:[{id:"civil",name:"Civil Engineering",mod:0},{id:"industrial",name:"Industrial Construction",mod:.25},{id:"mega",name:"Megaprojects",mod:.4}],Finance:[{id:"banking",name:"Banking",mod:0},{id:"insurance",name:"Insurance",mod:.15},{id:"investment",name:"Investment Management",mod:.3}],Technology:[{id:"software",name:"Software Development",mod:0},{id:"hardware",name:"Hardware Manufacturing",mod:.2},{id:"telecom",name:"Telecommunications",mod:.35}],Energy:[{id:"oil_gas",name:"Oil & Gas",mod:0},{id:"renewables",name:"Renewables",mod:.2},{id:"mining",name:"Mining",mod:.3}],Healthcare:[{id:"pharma",name:"Pharmaceuticals",mod:0},{id:"hospitals",name:"Hospital Systems",mod:.2},{id:"biotech",name:"Biotechnology",mod:.35}]};async function _o(){const{data:i,error:e}=await $.from("nations").select("*").order("name");e&&console.warn("[Subsidiary] Failed to load nations:",e.message),Ye=(i||[]).filter(n=>n.id!==f?.nation_id);const{data:t}=await $.from("factions").select("nation_id").eq("faction_type","corporation").is("abandoned_at",null);Je={};for(const n of t||[])n.nation_id&&(Je[n.nation_id]=(Je[n.nation_id]||0)+1);Re=f?.corp_subsector||""}function Fi(){const i=f?.corp_sector||"";return $o[i]||[{id:"general",name:i||"General",mod:0}]}function ho(){const e=Fi().find(t=>t.name===Re);return e?e.mod:0}function Kt(i){const e=Number(i.standard_of_living??50);return Math.max(.5,Math.round(e/50*100)/100)}function Vi(i){const t=1+ho(),n=Kt(i);return Math.round(Math.max(1e7,5e7*t*n))}function wo(i){const e=Je[i]||0;return e<=1?{label:"HIGH",color:"#5c5"}:e<=3?{label:"MODERATE",color:"#ca5"}:{label:"LOW",color:"#c55"}}function ko(i){if(ie=ie===i?null:i,ie){const e=Ye.find(t=>t.id===ie);Be=(f?.faction_name||"Subsidiary")+" "+(e?.name||"")}else Be="";$t()}function Eo(i){Re=i,$t()}function To(i){Be=i}function Co(i){Ze=i.toUpperCase().slice(0,4)}async function So(){if(Bt||!ie)return;const i=Ye.find(a=>a.id===ie);if(!i)return;const e=(Be||"").trim(),t=(Ze||"").trim();if(!e){alert("Please enter a corporation name for the subsidiary.");return}if(t.length<2){alert("Please enter an abbreviation (2-4 chars).");return}if(G.find(a=>a.nation_id===i.id&&a.type==="regional_hq")){alert("You already have a subsidiary in "+i.name);return}const o=Vi(i),s=Number(f?.corp_cash_reserves??0);if(o>s){alert("Insufficient cash. Entry cost: "+v(o)+", available: "+v(s));return}if(confirm("Establish subsidiary in "+i.name+`?

Name: `+e+" ("+t+`)
Subsector: `+(Re||"General")+`
Entry cost: `+v(o)+`
Creates a Regional HQ (500 capacity)
Unlocks `+i.name+` for operations

Deducted from cash reserves.`)){Bt=!0;try{const l=(await $.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0,d=85+Math.floor(Math.random()*16),r=Math.round(o*.005),{error:c}=await $.from("corp_properties").insert({faction_id:f.id,nation_id:i.id,name:e,type:"regional_hq",style:"Modern",capacity:500,purchase_price:o,monthly_maintenance:r,condition:d,city:i.capital||i.name,purchased_at_tick:l,is_active:!0,subsector:Re||f?.corp_subsector||null});if(c)throw c;const m=Math.max(0,s-o);await $.from("factions").update({corp_cash_reserves:m}).eq("id",f.id),f.corp_cash_reserves=m,Ve(m),ie=null,Be="",Ze="",await pi(),alert('Subsidiary "'+e+'" established in '+i.name+`!

Cost: `+v(o)+`
Regional HQ created with `+d+"% condition.")}catch(a){alert("Failed: "+a.message)}finally{Bt=!1}}}function $t(){const i=document.getElementById("create-subsidiary-container");if(!i)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=f?.corp_sector||"General",o=f?.corp_subsector||"",s=Fi(),a=s.find(x=>x.name===Re)||s[0],l=new Set(G.filter(x=>x.type==="regional_hq").map(x=>x.nation_id)),d=Ye.filter(x=>!l.has(x.id)),r=ie?d.find(x=>x.id===ie):null,c=Be.trim().length>0&&Ze.trim().length>=2&&r!==null;let m=`
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
            ${s.map(x=>{const T=x.name===Re,z=x.name===o;return`<div onclick="subSetSubsector('${x.name.replace(/'/g,"\\'")}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${T?t.accent+"18":"transparent"};border:1px solid ${T?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:8px;font-weight:700;color:${T?t.accentBright:t.dim}">${x.name}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${z?t.greenBright:x.mod>0?t.orange:t.dim}">${z?"SAME — ±0%":x.mod>0?"+"+Math.round(x.mod*100)+"%":"±0%"}</div>
                </div>`}).join("")}
        </div>
    </div>`,u="";if(d.length===0)u=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Subsidiaries in all available nations.</div>`;else for(const x of d){const T=x.id===ie,z=wo(x.id),A=Je[x.id]||0,O=Math.round(Number(x.standard_of_living??50)),L=Kt(x);u+=`
            <div onclick="subSelectNation('${x.id}')" style="display:flex;align-items:center;padding:4px 8px;margin-bottom:2px;cursor:pointer;background:${T?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${T?t.accent+"44":t.border};border-left:${T?"2px solid "+t.accent:"2px solid transparent"};">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:11px;font-weight:600;color:${T?t.text:t.muted}">${x.name}</span>
                        <span style="font-family:${e};font-size:7px;font-weight:700;padding:0 4px;color:${z.color};background:${z.color}12;border:1px solid ${z.color}25;line-height:12px">${z.label}</span>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:2px;">
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">STD/LIVING: <span style="color:${t.muted}">${O}</span></span>
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">CORPS: <span style="color:${A>=4?t.red:A>=2?t.yellow:t.greenBright}">${A}</span></span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${L>1?t.orange:t.greenBright}">×${L.toFixed(2)}</div>
                </div>
            </div>`}let y=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="margin-bottom:6px;">
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Corporation Name</div>
            <input type="text" value="${(Be||"").replace(/"/g,"&quot;")}" oninput="subSetName(this.value)" placeholder="e.g., ${(f?.faction_name||"Corp")+" "+(r?.name||"International")}" style="width:100%;padding:5px 8px;font-family:${e};font-size:10px;color:${t.text};background:${t.card};border:1px solid ${t.border};outline:none;box-sizing:border-box;" />
        </div>
        <div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Abbreviation (2-4 chars)</div>
            <input type="text" value="${(Ze||"").replace(/"/g,"&quot;")}" oninput="subSetAbbr(this.value)" placeholder="${(f?.faction_name||"CORP").slice(0,2).toUpperCase()+(r?.name||"XX").slice(0,2).toUpperCase()}" maxlength="4" style="width:80px;padding:5px 8px;font-family:${e};font-size:12px;font-weight:700;color:${t.gold};background:${t.card};border:1px solid ${t.border};outline:none;text-align:center;letter-spacing:2px;" />
        </div>
    </div>`;const g=[{rule:"Bid on projects in that nation",icon:"✓",color:t.greenBright},{rule:"Hires local workers at nation rates",icon:"✓",color:t.greenBright},{rule:"Must use parent's materials & vehicles",icon:"!",color:t.orange},{rule:"Reputation gain: 75% sub / 25% parent",icon:"◐",color:t.gold},{rule:"Market revenue at 50% parent rate",icon:"◐",color:t.gold},{rule:"Counts as domestic corporation",icon:"✓",color:t.greenBright},{rule:"Starting reputation: 25",icon:"●",color:t.muted}];let _=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsidiary Rules</div>
        <div style="background:${t.card};border:1px solid ${t.border};padding:6px 8px;">
            ${g.map((x,T)=>`<div style="display:flex;align-items:center;gap:6px;padding:2px 0;${T<g.length-1?"border-bottom:1px solid "+t.border:""}">
                <span style="font-family:${e};font-size:9px;color:${x.color};width:12px;text-align:center">${x.icon}</span>
                <span style="font-size:9px;color:${t.muted}">${x.rule}</span>
            </div>`).join("")}
        </div>
    </div>`;const h=5e7,k=a.mod,M=r?Kt(r):null,C=r?Vi(r):null;let w=`
    <div style="background:${t.bg};border:1px solid ${t.border};padding:6px 8px;margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">BASE</span>
            <span style="font-family:${e};font-size:9px;color:${t.muted}">${v(h)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">SUBSECTOR (${a.name})</span>
            <span style="font-family:${e};font-size:9px;color:${k===0?t.greenBright:t.orange}">${k===0?"±0%":"+"+Math.round(k*100)+"%"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">NATION (${r?r.name:"—"})</span>
            <span style="font-family:${e};font-size:9px;color:${r?M>1?t.orange:t.greenBright:t.dim}">${r?"×"+M.toFixed(2):"—"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:3px 0;">
            <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.text}">TOTAL COST</span>
            <span style="font-family:${e};font-size:14px;font-weight:700;color:${t.gold}">${r?v(C):"—"}</span>
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
            ${m}
            ${p}
            <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
                <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Nation</div>
                ${u}
            </div>
            ${y}
            ${_}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            ${w}
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
    </div>`}window.subSelectNation=ko;window.subCreate=So;window.subSetName=To;window.subSetAbbr=Co;window.subSetSubsector=Eo;let rt=[],Ie=0,oe="ALL",ke="REPUTATION";async function Io(){const{data:i}=await $.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name");rt=(i||[]).map(e=>({...e,abbr:e.corp_ticker||e.abbreviation||e.faction_name?.slice(0,4).toUpperCase()||"???",status:(e.corp_company_type||"Private").toUpperCase(),isPlayer:!!e.linked_user_id,reputation:50,revenue:e.status==="PUBLIC"?Number(e.corp_cash_reserves||0)*.1:null,valuation:e.status==="PUBLIC"?Number(e.corp_cash_reserves||0)*3:null}))}function Mo(i){Ie=i,_t()}function Ao(i){oe=i,Ie=0,_t()}function zo(i){ke=i,Ie=0,_t()}function _t(){const i=document.getElementById("corporations-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n={PUBLIC:{color:t.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:t.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:t.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},o=[...new Set(rt.map(p=>p.nation).filter(Boolean))];let s=[...rt];oe!=="ALL"&&(s=s.filter(p=>p.nation===oe)),ke==="REPUTATION"?s.sort((p,u)=>(u.reputation||0)-(p.reputation||0)):ke==="REVENUE"?s.sort((p,u)=>(u.revenue||0)-(p.revenue||0)):ke==="VALUATION"&&s.sort((p,u)=>(u.valuation||0)-(p.valuation||0)),Ie>=s.length&&(Ie=0);const a=s[Ie]||null,l=a&&a.status==="PRIVATE",d=a&&a.status==="STATE";let r="";s.length===0&&(r=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No corporations found.</div>`);for(let p=0;p<s.length;p++){const u=s[p],y=p===Ie,g=n[u.status]||n.PRIVATE,_=u.status==="PRIVATE";r+=`
        <div onclick="corpSelect(${p})" style="display:flex;align-items:center;padding:6px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${y?t.accent:"transparent"};background:${y?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:36px;font-family:${e};font-size:9px;font-weight:700;color:${t.gold}">${u.abbr}</span>
            <div style="flex:1.3;">
                <div style="font-size:10px;font-weight:600;color:${t.text};line-height:1.2">${u.faction_name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${u.corp_subsector||u.corp_sector||"—"}</div>
            </div>
            <span style="width:55px"><span style="font-family:${e};font-size:7px;padding:1px 4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(u.nation||"—").toUpperCase().slice(0,6)}</span></span>
            <span style="width:50px;font-family:${e};font-size:8px;font-weight:700;color:${_?t.dim:t.muted};text-align:right">${_?"—":v(u.revenue)}</span>
            <span style="width:30px;font-family:${e};font-size:9px;font-weight:700;color:${u.reputation>=70?t.greenBright:u.reputation>=40?t.accent:t.yellow};text-align:right">${u.reputation}</span>
            <span style="width:50px;font-family:${e};font-size:8px;color:${_?t.dim:t.muted};text-align:right">${_?"—":v(u.valuation)}</span>
            <span style="width:42px;text-align:center"><span style="font-family:${e};font-size:6px;font-weight:700;padding:1px 4px;color:${g.color};background:${g.bg};border:1px solid ${g.border}">${u.status}</span></span>
        </div>`}let c="";if(a){const p=n[a.status]||n.PRIVATE,u=[{label:"Sector",value:a.corp_sector||"—",color:t.text},{label:"Subsector",value:a.corp_subsector||"—",color:t.accent},{label:"Reputation",value:a.reputation+"/100",color:a.reputation>=70?t.greenBright:a.reputation>=40?t.accent:t.yellow},{label:"Revenue",value:l?"UNDISCLOSED":v(a.revenue),color:l?t.dim:t.greenBright},{label:"Cash Reserves",value:l?"UNDISCLOSED":v(a.corp_cash_reserves||0),color:l?t.dim:t.text},{label:"Market Valuation",value:l?"UNDISCLOSED":v(a.valuation),color:l?t.dim:t.gold}];c=`
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
        ${l?`<div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:rgba(200,168,50,0.03);">
            <div style="font-family:${e};font-size:8px;color:${t.gold};margin-bottom:2px">PRIVATE — FINANCIALS UNDISCLOSED</div>
            <div style="font-size:9px;color:${t.dim};line-height:1.4">Use INVESTIGATE to reveal financial data for 12 ticks.</div>
        </div>`:""}
        ${d?`<div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:rgba(204,136,68,0.03);">
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
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${d?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${d?t.dim:t.gold};border:1px solid ${d?t.border:t.gold+"44"};opacity:${d?.3:1}">ACQUIRE</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${d?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${d?t.dim:t.orange};border:1px solid ${d?t.border:t.orange+"44"};opacity:${d?.3:1}">MERGER</div>
            </div>
            ${d?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${t.dim}">State-owned corps cannot be acquired or merged.</div>`:""}
        </div>`}else c=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a corporation to view details.</div>`;const m=`
    <div style="padding:5px 14px;border-bottom:1px solid ${t.border};background:${t.card};display:flex;gap:12px;align-items:center;flex-shrink:0;">
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px;width:32px">NATION</span>
            <span onclick="corpFilterNation('ALL')" style="padding:2px 7px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${oe==="ALL"?"#000":t.dim};background:${oe==="ALL"?t.accent:"transparent"};border:1px solid ${oe==="ALL"?t.accent:t.border}">ALL</span>
            ${o.map(p=>`<span onclick="corpFilterNation('${p}')" style="padding:2px 7px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${oe===p?"#000":t.dim};background:${oe===p?t.accent:"transparent"};border:1px solid ${oe===p?t.accent:t.border}">${p}</span>`).join("")}
        </div>
        <div style="flex:1"></div>
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">SORT</span>
            ${["REPUTATION","REVENUE","VALUATION"].map(p=>`<span onclick="corpSort('${p}')" style="padding:2px 7px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${ke===p?"#000":t.dim};background:${ke===p?t.accent:"transparent"};border:1px solid ${ke===p?t.accent:t.border}">${p}</span>`).join("")}
        </div>
    </div>`;i.innerHTML=`
    <div style="width:760px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Corporations</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${rt.length} IN DATABASE</span>
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
                <div style="flex:1;overflow:auto;">${r}</div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${c}
            </div>
        </div>
    </div>`}window.corpSelect=Mo;window.corpFilterNation=Ao;window.corpSort=zo;let re=null,me={},D=120,ue=15,Jt={},Ge=[];async function No(){if(!Ne)return;if(Fe[Ne.id]){alert("You already have a bid on this contract. Retract it first if you want to re-bid.");return}re=Ne,Jt={};try{const{data:t}=await $.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",f.id);for(const n of t||[])Jt[n.material_key]=Number(n.quantity||0)}catch{}Ge=[];try{const{data:t}=await $.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",re.id).in("status",["pending","won"]);Ge=(t||[]).filter(n=>n.faction_id!==f?.id).map(n=>({name:n.factions?.faction_name||"Unknown",ticker:n.factions?.corp_ticker||"???",price:Number(n.bid_price||0),quality:Number(n.estimated_quality||0),status:n.status}))}catch{}me={};const i=re.required_materials||{};for(const t of Object.keys(i))me[t]="STD";const e=re.required_workforce||{};D=Number(e.general||0)+Number(e.skilled||0)||120,ue=15,tt(),ht()}function fi(){document.getElementById("bid-assembly-overlay")?.remove(),re=null}function qo(i,e){me[i]=e,ht()}function Lo(i){D=i,ht()}function Bo(i){ue=i,ht()}function ht(){if(document.getElementById("bid-assembly-overlay")?.remove(),!re)return;const i="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=re,n=t.issuer_type==="GOVERNMENT",o=E?.name||f?.nation||"—",s=Number(t.budget_ceiling||0),a=Number(t.timeline_ticks||8),l=t.required_materials||{},d=Object.keys(l),r={LOW:.5,STD:1,HIGH:2},c={LOW:e.orange,STD:e.yellow,HIGH:e.greenBright},m={LOW:"Low",STD:"Standard",HIGH:"High"},p={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},u=Jt||{};let y=0,g="";for(const N of d){const P=Number(l[N]||0),ui=me[N]||"STD",yi=p[N]||3e5,Ji=r[ui],Xi=Math.round(yi*Ji),gi=P*Xi;y+=gi;const Zi=N.replace(/_/g," ").replace(/\b\w/g,_e=>_e.toUpperCase()),vi=Number(u[N]||0),Tt=Math.max(0,P-vi),en=Tt===0?e.greenBright:Tt<P?e.yellow:e.red,tn=Tt===0?"✓ IN STOCK":`${vi}/${P}`;g+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${e.text}">${Zi}</span>
                <div style="font-family:${i};font-size:7px;color:${en};margin-top:1px">${tn}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${i};font-size:9px;color:${e.muted}">${P.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(_e=>{const Ct=ui===_e,xi=c[_e],nn=v(Math.round(yi*r[_e]));return`<span onclick="bidSetGrade('${N}','${_e}')" style="padding:2px 6px;font-family:${i};font-size:7px;font-weight:700;cursor:pointer;color:${Ct?"#000":e.dim};background:${Ct?xi:"transparent"};border:1px solid ${Ct?xi:e.border}" title="${nn}/unit">${m[_e]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${i};font-size:10px;color:${e.text}">${v(gi)}</span></div>
        </div>`}const _=t.required_workforce||{},h=Number(_.general||0)+Number(_.skilled||0)||100,k=Math.max(40,Math.round(h*.5)),M=h*2,C=[k,Math.round(h*.75),h,Math.round(h*1.5),M],w=Math.max(0,Math.min(1,(D-k)/(M-k||1))),x=a,T=Math.round(4.5-w*8),z=Math.max(Math.round(x*.6),x+T),A=T>0?`+${T}mo`:T<0?`${T}mo`:"On schedule",O=T>0?e.red:T<0?e.greenBright:e.yellow,L=15200,W=D*L*z,X=s,q=[{name:"Municipal Zoning Approval",cost:18e4,ticks:2,required:!0},{name:"Structural Engineering Cert.",cost:24e4,ticks:3,required:!0},{name:"Environmental Impact Assessment",cost:34e4,ticks:8,required:X>2e7},{name:"Seismic Resilience Compliance",cost:21e4,ticks:4,required:X>5e7},{name:"Heritage Conservation Review",cost:16e4,ticks:6,required:!1},{name:"Fire Safety Certification",cost:12e4,ticks:2,required:X>1e7}].filter(N=>N.required),Y=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),Pe=q.filter(N=>!Y.has(N.name)).reduce((N,P)=>N+P.cost,0),Z=4e5,xe=y+W+Pe+Z,de=Math.round(xe*(ue/100)),nt=xe+de,Q=nt>s,kt=de,be=Q?0:Math.max(0,Math.min(100,Math.round(100-nt/s*100+30))),mi=be>70?e.greenBright:be>40?e.yellow:be>0?e.orange:e.red,Qi=Q?"OVER CEILING":be>70?"STRONG":be>40?"COMPETITIVE":be>20?"WEAK":"UNLIKELY",Et=Object.values(me),$e=Et.length>0?Math.round(Et.reduce((N,P)=>N+(P==="HIGH"?85:P==="STD"?65:45),0)/Et.length):50,ot=$e>=75?e.greenBright:$e>=55?e.yellow:e.orange,Ki=$e>=75?"STRONG":$e>=55?"PROMISING":"UNCERTAIN",De=document.createElement("div");De.id="bid-assembly-overlay",De.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",De.addEventListener("click",N=>{N.target===De&&fi()}),De.innerHTML=`
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
                <span style="font-family:${i};font-size:9px;color:${e.muted}">Ceiling: <span style="color:${e.text};font-weight:700">${v(s)}</span></span>
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
                ${g}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${i};font-size:9px;color:${e.muted}">MATERIALS TOTAL</span>
                    <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${v(y)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Labor</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim};width:60px">WORKERS</span>
                        <div style="display:flex;gap:3px;">
                            ${C.map(N=>`<span onclick="bidSetWorkers(${N})" style="padding:2px 8px;font-family:${i};font-size:8px;font-weight:700;cursor:pointer;color:${D===N?"#000":e.dim};background:${D===N?e.accent:"transparent"};border:1px solid ${D===N?e.accent:e.border}">${N}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">${D} × $${L.toLocaleString()}/tick × ${z} ticks</span>
                        <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${v(W)}</span>
                    </div>
                    <div style="margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <span style="font-family:${i};font-size:8px;color:${e.dim}">WORKFORCE REQUIRED</span>
                        </div>
                        <div style="display:flex;gap:12px;">
                            <span style="font-family:${i};font-size:7px;color:#8b9a6b">General: ${Math.ceil(D*.8)}</span>
                            <span style="font-family:${i};font-size:7px;color:#c8a832">Skilled: ${Math.ceil(D*.15)}</span>
                            <span style="font-family:${i};font-size:7px;color:#c84">Innovative: ${Math.ceil(D*.05)}</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">COMPLETION TIMELINE</span>
                        <span style="font-family:${i};font-size:10px;font-weight:700;color:${O}">${z}mo <span style="font-size:8px;opacity:0.7">(${A})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${q.map(N=>{const P=Y.has(N.name);return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
                        <div style="flex:1;display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${i};font-size:8px;font-weight:700;color:${P?e.greenBright:e.orange}">${P?"✓":"○"}</span>
                            <span style="font-size:10px;color:${P?e.muted:e.text}">${N.name}</span>
                        </div>
                        ${P?`<span style="font-family:${i};font-size:8px;color:${e.greenBright}">HELD</span>`:`<div style="text-align:right">
                                <span style="font-family:${i};font-size:9px;color:${e.redDim}">${v(N.cost)}</span>
                                <span style="font-family:${i};font-size:7px;color:${e.dim};margin-left:4px">${N.ticks}t</span>
                            </div>`}
                    </div>`}).join("")}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${i};font-size:9px;color:${e.muted}">PERMIT COSTS</span>
                    <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${v(Pe)}</span>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${i};font-size:9px;color:${e.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${v(Z)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v:y},{l:"Labor",v:W},{l:"Permits",v:Pe},{l:"Overhead",v:Z}].map(N=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-size:10px;color:${e.muted}">${N.l}</span>
                    <span style="font-family:${i};font-size:10px;color:${e.redDim}">${v(N.v)}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:rgba(204,85,85,0.03);">
                    <span style="font-family:${i};font-size:10px;font-weight:700;color:${e.text}">TOTAL EST. COST</span>
                    <span style="font-family:${i};font-size:13px;font-weight:700;color:${e.red}">${v(xe)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.gold};text-transform:uppercase">Set Markup</span>
                </div>
                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="font-family:${i};font-size:9px;color:${e.dim}">MARKUP %</span>
                        <span style="font-family:${i};font-size:16px;font-weight:700;color:${e.gold}">${ue}%</span>
                    </div>
                    <input type="range" min="0" max="40" step="1" value="${ue}" oninput="bidSetMarkup(+this.value)" style="width:100%;accent-color:${e.gold};height:6px;" />
                    <div style="display:flex;justify-content:space-between;font-family:${i};font-size:7px;color:${e.dim};margin-top:2px;">
                        <span>0% (at cost)</span><span>40% (maximum)</span>
                    </div>
                </div>

                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${Q?"rgba(204,85,85,0.04)":"rgba(200,168,50,0.03)"};">
                    <div style="font-family:${i};font-size:8px;color:${e.dim};margin-bottom:4px">YOUR BID PRICE</div>
                    <div style="font-family:${i};font-size:22px;font-weight:700;color:${Q?e.red:e.gold}">${v(nt)}</div>
                    ${Q?`<div style="font-family:${i};font-size:8px;font-weight:700;color:${e.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${v(s)})</div>`:""}
                </div>

                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">PROJECTED PROFIT</span>
                        <span style="font-family:${i};font-size:14px;font-weight:700;color:${kt>0?e.greenBright:e.dim}">+${v(kt)}</span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Bid Assessment</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">COMPETITIVENESS</span>
                        <span style="font-family:${i};font-size:11px;font-weight:700;color:${mi}">${Qi}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${be}%;height:100%;background:${mi}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${i};font-size:11px;font-weight:700;color:${ot}">${$e}</span>
                            <span style="font-family:${i};font-size:8px;color:${e.dim}">/100</span>
                            <span style="font-family:${i};font-size:8px;font-weight:700;color:${ot}">${Ki}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${$e}%;height:100%;background:${ot}"></div></div>
                    <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${Ge.length===0?`<div style="font-family:${i};font-size:8px;color:${e.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${Ge.map(N=>`<span style="padding:2px 6px;font-family:${i};font-size:7px;color:${e.muted};background:${e.card};border:1px solid ${e.border};">${N.name} <span style="color:${e.dim}">Q:${N.quality}</span></span>`).join("")}
                        </div>
                        <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:3px">${Ge.length} competing bid${Ge.length!==1?"s":""}. Bid prices are sealed until resolution.</div>`}
                    <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:3px">Higher reputation bidders may win at higher prices.</div>
                </div>
                <div style="flex:1"></div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">YOUR BID</div><div style="font-family:${i};font-size:14px;font-weight:700;color:${Q?e.red:e.gold}">${v(nt)}</div></div>
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">EST. PROFIT</div><div style="font-family:${i};font-size:14px;font-weight:700;color:${e.greenBright}">+${v(kt)}</div></div>
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${i};font-size:14px;font-weight:700;color:${ot}">${$e}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${i};font-size:10px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="${Q?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${i};font-size:10px;font-weight:700;letter-spacing:1px;color:${Q?e.dim:"#000"};background:${Q?e.border:e.gold};cursor:${Q?"not-allowed":"pointer"};opacity:${Q?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(De)}let Rt=!1;async function Ro(){if(Rt||!re)return;const i=re,e=i.required_materials||{},t=Object.keys(e),n=Number(i.budget_ceiling||0),o=Number(i.timeline_ticks||8),s={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},a={LOW:.5,STD:1,HIGH:2};let l=0;for(const L of t){const W=Number(e[L]||0),X=me[L]||"STD",ve=s[L]||3e5;l+=W*Math.round(ve*a[X])}const d=15200,r=i.required_workforce||{},c=Number(r.general||0)+Number(r.skilled||0)||100,m=Math.max(40,Math.round(c*.5)),p=c*2,u=Math.max(0,Math.min(1,(D-m)/(p-m||1))),y=Math.round(4.5-u*8),g=Math.max(Math.round(o*.6),o+y),_=D*d*g,h=n,k=[{name:"Municipal Zoning Approval",cost:18e4,required:!0},{name:"Structural Engineering Cert.",cost:24e4,required:!0},{name:"Environmental Impact Assessment",cost:34e4,required:h>2e7},{name:"Seismic Resilience Compliance",cost:21e4,required:h>5e7},{name:"Fire Safety Certification",cost:12e4,required:h>1e7}],M=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),C=k.filter(L=>L.required&&!M.has(L.name)).reduce((L,W)=>L+W.cost,0),x=l+_+C+4e5,T=Math.round(x*(ue/100)),z=x+T;if(z>n){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const A=Object.values(me),O=A.length>0?Math.round(A.reduce((L,W)=>L+(W==="HIGH"?85:W==="STD"?65:45),0)/A.length):50;if(confirm('Submit bid for "'+i.name+`"?

Bid Price: `+v(z)+`
Est. Cost: `+v(x)+`
Markup: `+ue+"% ("+v(T)+`)
Quality: `+O+`/100
Workers: `+D+`

Once submitted, your bid cannot be changed.`)){Rt=!0;try{const{data:L}=await $.from("shard").select("current_tick").eq("name","Alpha Shard").single(),W=L?.current_tick||0,X={};for(const q of t)X[q]=me[q]||"STD";const{error:ve}=await $.from("contract_bids").insert({contract_id:i.id,faction_id:f.id,bid_price:z,material_grades:X,labor_count:D,markup_pct:ue,estimated_cost:x,estimated_quality:O,status:"pending",submitted_at_tick:W});if(ve)throw ve;i.status==="open"&&await $.from("construction_contracts").update({status:"bidding"}).eq("id",i.id).eq("status","open"),fi(),alert(`Bid submitted successfully!

Contract: `+i.name+`
Your Bid: `+v(z)+`
Quality: `+O+`/100

Bids will be resolved when the bidding window closes (`+(i.bidding_ends_tick?"tick "+i.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof ge=="function"&&await ge()}catch(L){alert("Bid submission failed: "+L.message)}finally{Rt=!1}}}window.openBidAssembly=No;window.closeBidAssembly=fi;window.bidSetGrade=qo;window.bidSetWorkers=Lo;window.bidSetMarkup=Bo;window.submitBidAssembly=Ro;let Ot=!1;async function Oo(i){if(Ot)return;const e=1e6,t=Number(f?.corp_cash_reserves??0);if(t<e){alert("Cannot retract — you need at least $1M in cash reserves to cover the retraction penalty.");return}if(confirm(`Retract your bid?

This will cost $1M as a retraction penalty.
This action cannot be undone.`)){Ot=!0;try{const n=t-e,{error:o}=await $.from("factions").update({corp_cash_reserves:n}).eq("id",f.id);if(o)throw o;const{error:s}=await $.from("contract_bids").delete().eq("contract_id",i).eq("faction_id",f.id);if(s)throw s;f.corp_cash_reserves=n,typeof Ve=="function"&&Ve(n),alert("Bid retracted. $1M penalty applied."),tt(),await ge()}catch(n){alert("Failed to retract bid: "+(n.message||"Unknown error"))}finally{Ot=!1}}}window.retractBid=Oo;let et=[],Me=0,ne=null,Pt=!1,Dt=!1,jt=!1;async function Po(){if(!Ne||Dt)return;Dt=!0,ne=Ne,Me=0;const{data:i,error:e}=await $.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",ne.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(Dt=!1,e){alert("Failed to load bids: "+e.message);return}et=(i||[]).map(t=>({...t,corp:t.factions?.faction_name||"Unknown",abbr:t.factions?.corp_ticker||"???",subsector:t.factions?.corp_subsector||"—"})),tt(),Yi()}function wt(){document.getElementById("bid-review-overlay")?.remove(),ne=null}function Do(i){Me=i,Yi()}async function jo(){if(Pt||et.length===0)return;const i=et[Me];if(!(!i?.id||!i.faction_id)&&confirm("Accept bid from "+i.corp+`?

Bid Price: `+v(i.bid_price)+`
Quality: `+i.estimated_quality+`/100
Workers: `+i.labor_count+`

This will award the contract. The project begins immediately.`)){Pt=!0;try{const{data:e}=await $.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{error:n}=await $.from("contract_bids").update({status:"won"}).eq("id",i.id);if(n)throw n;const{error:o}=await $.from("contract_bids").update({status:"lost"}).eq("contract_id",ne.id).neq("id",i.id);if(o)throw o;const{error:s}=await $.from("construction_contracts").update({status:"awarded",awarded_to_faction:i.faction_id,awarded_at_tick:t}).eq("id",ne.id);if(s)throw s;wt(),alert("Contract awarded to "+i.corp+`!

Bid: `+v(i.bid_price)+`
Project begins immediately.`),typeof ge=="function"&&await ge()}catch(e){alert("Failed to accept bid: "+(e.message||e))}finally{Pt=!1}}}async function Ho(){if(!(!ne||jt)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){jt=!0;try{const{error:i}=await $.from("contract_bids").update({status:"lost"}).eq("contract_id",ne.id);if(i)throw i;const{error:e}=await $.from("construction_contracts").update({status:"expired"}).eq("id",ne.id);if(e)throw e;wt(),alert("All bids declined. Contract cancelled."),typeof ge=="function"&&await ge()}catch(i){alert("Failed: "+(i.message||i))}finally{jt=!1}}}function Yi(){if(document.getElementById("bid-review-overlay")?.remove(),!ne||et.length===0)return;const i="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=ne,n=et;Me>=n.length&&(Me=0);const o=n[Me],s=Number(t.budget_ceiling||0),a=Number(t.timeline_ticks||36),l=Math.min(...n.map(u=>u.bid_price)),d=Math.max(...n.map(u=>u.estimated_quality||0));let r="";for(let u=0;u<n.length;u++){const y=n[u],g=u===Me,_=y.bid_price===l,h=(y.estimated_quality||0)===d,k=y.bid_price>s;r+=`
        <div onclick="reviewSelectBid(${u})" style="padding:10px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${g?e.accent:"transparent"};background:${g?"rgba(139,154,107,0.03)":"transparent"};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-family:${i};font-size:10px;font-weight:700;color:${e.gold}">${y.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${e.text}">${y.corp}</span>
                ${_?`<span style="font-family:${i};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.greenBright};background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2)">CHEAPEST</span>`:""}
                ${h?`<span style="font-family:${i};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.2)">BEST QUALITY</span>`:""}
            </div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};">
                <div style="flex:1.2;padding:5px 10px;border-right:1px solid ${e.border}">
                    <div style="font-family:${i};font-size:7px;color:${e.dim}">BID PRICE</div>
                    <div style="font-family:${i};font-size:14px;font-weight:700;color:${k?e.red:e.text}">${v(y.bid_price)}</div>
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
        </div>`}const c=o.bid_price>s,m=s>0?Math.round(o.bid_price/s*100):0,p=document.createElement("div");p.id="bid-review-overlay",p.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",p.addEventListener("click",u=>{u.target===p&&wt()}),p.innerHTML=`
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
                <span>Budget: <span style="color:${e.text};font-weight:700">${v(s)}</span></span>
                <span>·</span>
                <span>Timeline: <span style="color:${e.text};font-weight:700">${a}mo</span></span>
            </div>
        </div>
        <div style="padding:6px 16px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.gold}">${n.length} BID${n.length!==1?"S":""} RECEIVED</span>
            <div style="display:flex;gap:8px;font-family:${i};font-size:8px;color:${e.dim};">
                <span>Cheapest: <span style="color:${e.greenBright}">${v(l)}</span></span>
                <span>Best Quality: <span style="color:${e.accent}">${d}</span></span>
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
                    <span style="font-family:${i};font-size:10px;color:${e.muted}">${v(Math.round(u.v))}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:${c?"rgba(204,85,85,0.03)":"rgba(200,168,50,0.03)"};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;color:${e.text}">TOTAL BID</span>
                    <span style="font-family:${i};font-size:14px;font-weight:700;color:${c?e.red:e.gold}">${v(o.bid_price)}</span>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">vs. YOUR BUDGET</span>
                        <span style="font-family:${i};font-size:9px;font-weight:700;color:${c?e.red:e.greenBright}">${c?"OVER":"WITHIN"} — ${m}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${e.border}"><div style="width:${Math.min(100,m)}%;height:100%;background:${c?e.red:e.accent}"></div></div>
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
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">SELECTED BID</div><div style="font-family:${i};font-size:12px;font-weight:700;color:${e.gold}">${v(o.bid_price)}</div></div>
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">CORPORATION</div><div style="font-family:${i};font-size:12px;font-weight:700;color:${e.text}">${o.corp}</div></div>
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${i};font-size:12px;font-weight:700;color:${(o.estimated_quality||0)>=75?e.greenBright:e.yellow}">${o.estimated_quality}</div></div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="declineAllBids()" style="padding:6px 16px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">DECLINE ALL</div>
                <div onclick="acceptBid()" style="padding:6px 20px;font-family:${i};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${e.accent};cursor:pointer">ACCEPT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(p)}window.openBidReview=Po;window.closeBidReview=wt;window.reviewSelectBid=Do;window.acceptBid=jo;window.declineAllBids=Ho;window.switchToExpansion=Pi;window.switchToOperations=Di;window.hfSetChange=Zn;window.hfReset=eo;window.hfConfirm=to;document.querySelector('[data-tab="operations"]')?.addEventListener("click",function(i){this.classList.contains("active")||(i.preventDefault(),Di(i))});Qn();
