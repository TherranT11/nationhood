import{_}from"./supabase-client-BXEzLDpS.js";import{e as b}from"./utils-C2W-HleY.js";import{initMessaging as dn}from"./messaging-B5Fng3EZ.js";import{c as cn,a as Wt,E as Ze,b as mt,d as Ii,e as pn,f as fn,h as hi}from"./equipment-DsuDdEne.js";const Mi={LOW:"#c84",STD:"#ca5",HIGH:"#5c5"},ge=[{key:"concrete",name:"Concrete",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"manufacturing_output",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:50},{stat:"higher_education",min:40}]}},priceDrivers:["manufacturing_output","inflation","fuel_prices","urbanization"]},{key:"steel",name:"Steel",category:"RAW",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:10}]},STD:{requirements:[{stat:"manufacturing_output",min:35},{stat:"rare_minerals",min:20}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:40},{stat:"higher_education",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","inflation","fuel_prices"]},{key:"lumber",name:"Lumber",category:"RAW",tiers:{LOW:{requirements:[{stat:"arable_land",min:10}]},STD:{requirements:[{stat:"arable_land",min:30},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"arable_land",min:50},{stat:"manufacturing_output",min:30}]}},priceDrivers:["arable_land","physical_infrastructure","inflation"]},{key:"aggregate",name:"Aggregate",category:"RAW",tiers:{LOW:{requirements:[]},STD:{requirements:[{stat:"rare_minerals",min:15},{stat:"physical_infrastructure",min:20}]},HIGH:{requirements:[{stat:"rare_minerals",min:35},{stat:"manufacturing_output",min:25}]}},priceDrivers:["rare_minerals","physical_infrastructure","inflation"]},{key:"em",name:"E&M Systems",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:15}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"digital_infrastructure",min:25}]},HIGH:{requirements:[{stat:"manufacturing_output",min:55},{stat:"digital_infrastructure",min:50},{stat:"energy_generation",min:40}]}},priceDrivers:["manufacturing_output","digital_infrastructure","inflation","energy_generation"]},{key:"glass",name:"Glass & Facades",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:20}]},STD:{requirements:[{stat:"manufacturing_output",min:40},{stat:"standard_of_living",min:35}]},HIGH:{requirements:[{stat:"manufacturing_output",min:60},{stat:"digital_infrastructure",min:40},{stat:"higher_education",min:50}]}},priceDrivers:["manufacturing_output","standard_of_living","inflation"]},{key:"asphalt",name:"Asphalt",category:"RAW",tiers:{LOW:{requirements:[{stat:"oil_and_gas",min:10}]},STD:{requirements:[{stat:"oil_and_gas",min:30},{stat:"manufacturing_output",min:25}]},HIGH:{requirements:[{stat:"oil_and_gas",min:45},{stat:"manufacturing_output",min:40},{stat:"physical_infrastructure",min:40}]}},priceDrivers:["oil_and_gas","manufacturing_output","inflation","fuel_prices"]},{key:"heavy",name:"Heavy Machinery Parts",category:"MANUFACTURED",tiers:{LOW:{requirements:[{stat:"manufacturing_output",min:40},{stat:"rare_minerals",min:30}]},STD:{requirements:[{stat:"manufacturing_output",min:60},{stat:"rare_minerals",min:45},{stat:"higher_education",min:40}]},HIGH:{requirements:[{stat:"manufacturing_output",min:75},{stat:"rare_minerals",min:60},{stat:"higher_education",min:55},{stat:"digital_infrastructure",min:45}]}},priceDrivers:["manufacturing_output","rare_minerals","higher_education","digital_infrastructure"]}];function ze(i,e,t){const n=ge.find(s=>s.key===i);if(!n)return{available:!1,failedStat:"unknown_material"};const o=n.tiers[e];if(!o)return{available:!1,failedStat:"unknown_tier"};for(const s of o.requirements){const a=Number(t?.[s.stat]??0);if(a<s.min)return{available:!1,failedStat:s.stat,failedMin:s.min,nationValue:a}}return{available:!0}}function ti(i,e,t){const o={concrete:{LOW:200,STD:300,HIGH:500},steel:{LOW:400,STD:700,HIGH:1200},lumber:{LOW:80,STD:130,HIGH:200},aggregate:{LOW:40,STD:60,HIGH:100},em:{LOW:400,STD:700,HIGH:1200},glass:{LOW:300,STD:500,HIGH:900},asphalt:{LOW:120,STD:200,HIGH:350},heavy:{LOW:800,STD:1400,HIGH:2400}}[i]?.[e];if(!o)return 0;const s=ge.find(l=>l.key===i);if(!s)return o;let a=1;for(const l of s.priceDrivers){const d=Number(t?.[l]??50);l==="inflation"||l==="fuel_prices"?a*=1+(d-50)/200:a*=1-(d-50)/250}return a=Math.max(.4,Math.min(2.5,a)),Math.round(o*a)}function Ai(i,e,t){const o={concrete:{LOW:5e3,STD:3e3,HIGH:1e3},steel:{LOW:2e3,STD:1500,HIGH:500},lumber:{LOW:8e3,STD:4e3,HIGH:1500},aggregate:{LOW:15e3,STD:6e3,HIGH:2e3},em:{LOW:1e3,STD:700,HIGH:300},glass:{LOW:1500,STD:800,HIGH:300},asphalt:{LOW:4e3,STD:2e3,HIGH:800},heavy:{LOW:400,STD:200,HIGH:80}}[i]?.[e]||0,a=ge.find(r=>r.key===i)?.priceDrivers?.[0],d=.3+(a?Number(t?.[a]??50):50)/50*.7;return Math.round(o*d)}const ii=["LOW","STD","HIGH"],Ft={LOW:"Low",STD:"Standard",HIGH:"High"};let Je=[],m=null,w=null,H=null,He=[],Ye={},X=[],Y={},Vt=-1,U="concrete",G="STD",re=500,ee=[],dt={},Yt=0,ie="trucks",fe=0,me=1,we=[],qe=null,ct=[],Qt=null,st=null,Kt="ALL",Jt="TIMELINE";function R(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(1)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i}function mn(i){if(i>=12){const e=Math.floor(i/12),t=i%12;return t>0?e+"y "+t+"mo":e+"y"}return i+" ticks"}function zi(i){return!i||i.length===0?"":i.map(e=>{const t=dt[e];if(!t)return"";const n=t.reputation_bonus>0?"var(--green)":t.reputation_bonus<0?"var(--red)":"var(--text-dim)",o=t.reputation_bonus>0?"+"+t.reputation_bonus:t.reputation_bonus<0?String(t.reputation_bonus):"";return`<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:3px;font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">${t.icon||"📍"} ${b(t.name)}${o?` <span style="color:${n};font-weight:700;">${o} REP</span>`:""}</span>`}).filter(Boolean).join(" ")}function ne(i){return Math.abs(i)>=1e9?"$"+(i/1e9).toFixed(1)+"B":Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(0)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i}function ni(i){return i==="civil_engineering"?"CIVIL":i==="industrial"?"INDUSTRIAL":i==="mega_project"?"MEGA":i?.toUpperCase()||"—"}function qi(i){return i==="civil_engineering"?"light":i==="industrial"?"heavy":i==="mega_project"?"mega":"light"}function un(){st&&clearInterval(st),st=setInterval(()=>{if(!Qt)return;const i=Qt-Date.now();if(i<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(st);return}const e=Math.floor(i/36e5),t=Math.floor(i%36e5/6e4),n=Math.floor(i%6e4/1e3);document.getElementById("tick-countdown").textContent=e+"h "+t+"m "+n+"s"},1e3)}function yn(){document.body.classList.toggle("light-mode");const i=document.getElementById("theme-toggle");i.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function gn(i,e){i==="type"&&(Kt=e),i==="sort"&&(Jt=e),document.querySelectorAll(`.filter-pill[data-filter="${i}"]`).forEach(t=>{t.classList.toggle("active",t.dataset.value===e)}),Li()}const wi={"Civil Engineering":"civil_engineering","Industrial Construction":"industrial",Megaprojects:"mega_project"};function Ni(i){if(!m)return!1;if(wi[m.corp_subsector]===i.sector)return!0;const t=(W||[]).filter(n=>n.type==="regional_hq"&&n.is_active&&n.nation_id===i.nation_id);for(const n of t)if(wi[n.subsector]===i.sector)return!0;return!1}function Li(){const i=document.getElementById("oc-list");let e=[...He];if(Kt==="GOVERNMENT"?e=e.filter(o=>o.issuer_type==="GOVERNMENT"):Kt==="PRIVATE"&&(e=e.filter(o=>o.issuer_type==="PRIVATE")),Jt==="TIMELINE"&&e.sort((o,s)=>(o.timeline_ticks||0)-(s.timeline_ticks||0)),Jt==="BUDGET"&&e.sort((o,s)=>(s.budget_ceiling||0)-(o.budget_ceiling||0)),document.getElementById("oc-count").textContent=e.length+" AVAILABLE",e.length===0){i.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const t=H?.current_tick||0;let n="";for(const o of e){const s=o.issuer_type==="GOVERNMENT",a=s?"gov":"private",l=Ni(o),d=l?"":" locked",r=qi(o.sector),c=ni(o.sector),p=(o.timeline_ticks||0)>18?" warn":"",f=o.bidding_ends_tick?Math.max(0,o.bidding_ends_tick-t):"?";n+=`
            <div class="oc-item${d}" data-contract-id="${o.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${b(o.name)}</span>
                    <span class="oc-item__type-badge ${a}">${s?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${a}">${b(o.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${f} tick${f!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${ne(o.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${p}">${mn(o.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${r}">${c}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${Ye[o.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${ne(Ye[o.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${l?"yes":"no"}">${l?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${l?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openContractDetail(contracts.find(x=>x.id==='${o.id}'))">VIEW</button>`:""}
                </div>
                ${o.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${b(o.description)}</div>`:""}
                ${o.modifiers&&o.modifiers.length>0?`<div style="display:flex;flex-wrap:wrap;gap:3px;padding:4px 0 0;">${zi(o.modifiers)}</div>`:""}
            </div>`}i.innerHTML=n,i.querySelectorAll(".oc-item:not(.locked)").forEach(o=>{o.addEventListener("click",()=>{const s=o.dataset.contractId,a=He.find(l=>l.id===s);a&&Bi(a)})})}let Ne=null;function Bi(i){Ne=i;const e=document.getElementById("cd-overlay"),t=i.issuer_type==="GOVERNMENT",n=t?"gov":"private",o=(w?.name||m.nation||"—").toUpperCase(),s=Ni(i);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${b(o)}</span>
        <span class="cd-header__name">${b(i.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${n}">${b(i.issuer_name)}</span>
        <span class="cd-header__type-badge ${n}">${t?"GOV":"PRIVATE"}</span>
    `;const a=document.getElementById("cd-blueprint");i.blueprint_svg?(a.innerHTML=i.blueprint_svg,a.style.display=""):(a.innerHTML=zn(i),a.style.display="");const l=i.permits_required||[],d=i.required_equipment||i.equipment_required||[],r=i.required_materials||i.materials_estimated||{},p={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[i.sector]||i.spec_category||i.sector||"—";let f="var(--teal)";i.sector==="industrial"&&(f="var(--orange)"),i.sector==="mega_project"&&(f="var(--red)");let u=R(i.budget_ceiling||i.budget||0),y=(i.timeline_ticks||i.timeline_months||0)+" Months",g="";g+=`
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
            </div>`);const $=i.modifiers||[];if($.length>0){g+=`<div class="cd-items">
            <div class="cd-section-label">Building Modifiers</div>
            <div style="display:flex;flex-direction:column;gap:6px;">`;for(const B of $){const z=dt[B];if(!z)continue;const P=z.reputation_bonus>0?"var(--green)":z.reputation_bonus<0?"var(--red)":"var(--text-dim)",F=z.cost_multiplier>1?"+"+Math.round((z.cost_multiplier-1)*100)+"% cost":z.cost_multiplier<1?Math.round((1-z.cost_multiplier)*100)+"% cheaper":"",K=z.reputation_bonus!==0?(z.reputation_bonus>0?"+":"")+z.reputation_bonus+" rep":"",q=z.required_permits||[];g+=`<div style="padding:6px 10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:600;font-size:0.78rem;color:var(--text-primary);">${z.icon||"📍"} ${b(z.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;">
                        ${F?`<span style="color:var(--amber);">${F}</span>`:""}
                        ${F&&K?" · ":""}
                        ${K?`<span style="color:${P};font-weight:700;">${K}</span>`:""}
                    </span>
                </div>
                <div style="font-size:0.65rem;color:var(--text-dim);margin-top:2px;">${b(z.description||"")}</div>
                ${q.length>0?`<div style="font-size:0.6rem;color:var(--amber);margin-top:3px;font-family:var(--font-mono);">Requires permits: ${q.map(V=>b(V.replace(/_/g," "))).join(", ")}</div>`:""}
            </div>`}g+="</div></div>"}g+='<div class="cd-details">',i.project_type&&(g+=he("Type",i.project_type)),i.project_subtype&&(g+=he("Sub-Type",i.project_subtype)),g+=he("Specialization",p,f),g+=he("Total Budget",u,"var(--green)"),g+=he("Timeline",y),g+=he("Nation",w?.name||m.nation||"—"),i.region&&(g+=he("Region",i.region)),g+="</div>",l.length>0&&(g+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${l.map(B=>{const z=B.status==="approved"?"approved":"required",P=B.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${z}">
                            <span class="cd-chip__icon">${P}</span>
                            <span class="cd-chip__label">${b(B.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),r.length>0&&(g+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${r.map(B=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${b(B.name)}</span>
                        <span class="cd-mat-row__qty">${b(String(B.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=g;const k=l.filter(B=>B.status==="approved").length,h=l.length-k,A=d.filter(B=>B.owned).length,C=d.length-A;let E="";d.length>0&&(C===0?E+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>':E+=`<span class="cd-footer__badge bad">${C} EQUIPMENT MISSING</span>`),l.length>0&&(h===0?E+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':E+=`<span class="cd-footer__badge warn">${h} PERMITS PENDING</span>`);const x=s,T=i.issuer_faction_id===m?.id,M=i.status==="bidding",N=Ye[i.id];document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${E}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${T?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${M?"":"disabled"} title="${M?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:N?`<button class="cd-btn primary" onclick="retractBid('${i.id}')" style="background:#c55;border-color:#c55;"
                        title="Retract your bid ($1M penalty)">RETRACT BID</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${x?"":"disabled"}
                        title="${x?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,e.classList.add("open"),document.body.style.overflow="hidden"}function it(i){i&&i.target&&i.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",Ne=null)}const Te=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],ki={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},Ei={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let I=null;async function Oe(i){const e=X.find(q=>q.id===i);if(!e)return;const t=Array.isArray(e.contract_bids)?e.contract_bids[0]:e.contract_bids,n=H?.current_tick||0,o=e.awarded_at_tick||n,s=e.timeline_ticks||8,a=Math.max(0,n-o),l=Math.min(100,a/s*100);let d=Math.min(Te.length-1,Math.floor(l/(100/Te.length)));const r=Math.round(l%(100/Te.length)/(100/Te.length)*100),c=e.required_materials||{},p=t?.material_grades||{};let f=[];try{const{data:q}=await _.from("project_material_allocations").select("material_key, quality_tier, quantity, consumed").eq("contract_id",e.id);f=q||[]}catch{}const u={};for(const q of f)u[q.material_key]||(u[q.material_key]={totalAllocated:0,totalConsumed:0,tiers:{}}),u[q.material_key].totalAllocated+=q.quantity,u[q.material_key].totalConsumed+=q.consumed,u[q.material_key].tiers[q.quality_tier]={qty:q.quantity,consumed:q.consumed};const y=Object.entries(c).map(([q,V])=>{const De=p[q]||"STD",te=u[q]||{totalAllocated:0,totalConsumed:0,tiers:{}};return{key:q,name:q.replace(/_/g," ").replace(/\b\w/g,xe=>xe.toUpperCase()),grade:De,required:Number(V),allocated:te.totalAllocated,consumed:te.totalConsumed,tiers:te.tiers,warehouseStock:Y[q]||{}}}),g=e.required_equipment||[],$=e.equipment_condition||{},k=g.map(q=>{const V=ee.find(ce=>ce.equipment_key===q),te=(V?.assigned_projects||[]).find(ce=>ce.contract_id===e.id),xe=te?te.units:0;return{key:q,name:q.replace(/_/g," ").replace(/\b\w/g,ce=>ce.toUpperCase()),ownedTotal:V?.owned||0,deployed:V?.deployed||0,available:Math.max(0,(V?.owned||0)-(V?.deployed||0)),assignedToProject:xe,condition:$[q]??(V?.condition||100)}}),h=e.budget_ceiling||0,A=t?.estimated_cost||0,C=Math.round(A*Math.min(1,a/s)),E=t?.estimated_quality||65,x=E>=80?"STRONG":E>=60?"PROMISING":E>=40?"FAIR":"UNCERTAIN",T=e.required_workforce||{},M=e.workers_assigned||{},N=(T.general||0)+(T.skilled||0)+(T.innovative||0),B=(M.general||0)+(M.skilled||0)+(M.innovative||0),z=t?.labor_count||N,P=Number(m?.corp_general_workforce??0),F=Number(m?.corp_skilled_workforce??0),K=Number(m?.corp_innovative_workforce??0);I={project:e,bid:t,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:n,awardedTick:o,totalTicks:s,ticksElapsed:a,phaseIdx:d,phaseProgress:r,materials:y,equipment:k,budget:h,estCost:A,spent:C,quality:E,qualityLabel:x,laborCount:z,wfNeeded:N,wfAssigned:B,reqWf:T,assignedWf:M,corpGeneral:P,corpSkilled:F,corpInnovative:K,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",Ri(e.id).then(()=>Be()),Be()}let O=!1;async function vn(i,e,t){if(!(O||!I||!m)){O=!0;try{const{data:n,error:o}=await _.rpc("allocate_material_to_project",{p_contract_id:I.project.id,p_faction_id:m.id,p_material_key:i,p_quality_tier:e,p_quantity:t});if(o){alert("Allocation failed: "+o.message);return}if(n&&!n.success){alert(n.error||"Allocation failed");return}await ai(),await Oe(I.project.id)}catch(n){alert("Allocation error: "+n.message)}finally{O=!1}}}async function xn(i,e,t){if(!(O||!I||!m)){O=!0;try{const{data:n,error:o}=await _.rpc("deallocate_material_from_project",{p_contract_id:I.project.id,p_faction_id:m.id,p_material_key:i,p_quality_tier:e,p_quantity:t});if(o){alert("Return failed: "+o.message);return}if(n&&!n.success){alert(n.error||"Return failed");return}await ai(),await Oe(I.project.id)}catch(n){alert("Return error: "+n.message)}finally{O=!1}}}async function bn(i,e){if(!(O||!I||!m)){O=!0;try{const t=I.project,n=t.workers_assigned||{},o=Number(n[i]||0),s=Number((t.required_workforce||{})[i]||0),a=Math.min(e,s-o);if(a<=0){alert("Already fully staffed for "+i);return}const l={...n,[i]:o+a},{error:d}=await _.from("construction_contracts").update({workers_assigned:l}).eq("id",t.id);if(d){alert("Assign failed: "+d.message);return}const r=X.find(c=>c.id===t.id);r&&(r.workers_assigned=l),await Oe(t.id)}catch(t){alert("Assign error: "+t.message)}finally{O=!1}}}async function $n(i,e){if(!(O||!I||!m)){O=!0;try{const t=I.project,n=t.workers_assigned||{},o=Number(n[i]||0),s=Math.min(e,o);if(s<=0){alert("No "+i+" assigned");return}const a={...n,[i]:o-s},{error:l}=await _.from("construction_contracts").update({workers_assigned:a}).eq("id",t.id);if(l){alert("Unassign failed: "+l.message);return}const d=X.find(r=>r.id===t.id);d&&(d.workers_assigned=a),await Oe(t.id)}catch(t){alert("Unassign error: "+t.message)}finally{O=!1}}}async function _n(i,e){if(!(O||!I||!m)){O=!0;try{const t=ee.find(d=>d.equipment_key===i);if(!t){alert("Equipment not found in inventory.");return}const n=Math.max(0,(t.owned||0)-(t.deployed||0));if(n<e){alert("Not enough available "+i+" ("+n+" available).");return}const o=(t.deployed||0)+e,s=[...t.assigned_projects||[]],a=s.find(d=>d.contract_id===I.project.id);a?a.units+=e:s.push({contract_id:I.project.id,contract_name:I.project.name,units:e});const{error:l}=await _.from("corp_equipment").update({deployed:o,assigned_projects:s}).eq("faction_id",m.id).eq("equipment_key",i);if(l){alert("Deploy failed: "+l.message);return}await di(),await Oe(I.project.id)}catch(t){alert("Deploy error: "+t.message)}finally{O=!1}}}async function hn(i){if(!(O||!I||!m)){O=!0;try{const e=ee.find(l=>l.equipment_key===i);if(!e){alert("Equipment not found.");return}const t=[...e.assigned_projects||[]],n=t.findIndex(l=>l.contract_id===I.project.id);if(n===-1){alert("Equipment not deployed to this project.");return}const o=t[n].units;t.splice(n,1);const s=Math.max(0,(e.deployed||0)-o),{error:a}=await _.from("corp_equipment").update({deployed:s,assigned_projects:t}).eq("faction_id",m.id).eq("equipment_key",i);if(a){alert("Undeploy failed: "+a.message);return}await di(),await Oe(I.project.id)}catch(e){alert("Undeploy error: "+e.message)}finally{O=!1}}}function wn(i){i&&i.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",I=null)}function kn(i){I&&(I.tab=i,I.expandedEvent=-1,I.selectedResponse=null,Be())}function En(i){I&&(I.expandedEvent=I.expandedEvent===i?-1:i,I.selectedResponse=null,Be())}function Tn(i){I&&(I.selectedResponse=I.selectedResponse===i?null:i,Be())}function Be(){if(!I)return;const i=I,e=i.project,t=e.issuer_type==="GOVERNMENT",n=ni(e.sector),o=m?.nation||"Nation",s=i.awardedTick+i.totalTicks,a=Math.max(0,s-i.currentTick),l=i.currentTick>s,d=i.budget>0?Math.round(i.spent/i.budget*100):0,r=d>85?"var(--red)":d>60?"var(--amber)":"var(--teal)",c=i.budget-i.spent,p=i.events.filter($=>$.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
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
    `;let f='<div class="pm-phase__bar">';for(let $=0;$<Te.length;$++){const k=$<i.phaseIdx,h=$===i.phaseIdx;f+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${k?"done":h?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${k?"done":h?"active":""}">${Te[$]}</span>
        </div>`}f+="</div>",f+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${Te[i.phaseIdx]} — ${i.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${l?"var(--red)":"var(--text-secondary)"}">Tick ${i.ticksElapsed} / ${i.totalTicks}${l?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=f;const u=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:p},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=u.map($=>`<button class="pm-tab${i.tab===$.id?" active":""}" onclick="pmSetTab('${$.id}')">
            ${$.label}${$.badge>0?`<span class="pm-tab__badge">${$.badge}</span>`:""}
        </button>`).join("");let y="";i.tab==="overview"?y=Cn(i,e,r,d,c,a,l):i.tab==="events"?y=Sn(i):i.tab==="materials"?y=In(i):i.tab==="equipment"&&(y=Mn(i)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${y}</div>`;let g="";p>0&&(g+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${p} EVENT${p>1?"S":""} REQUIRES RESPONSE</span>`),g+=`<span class="pm-ftr__badge" style="color:${i.quality>=70?"var(--green)":i.quality>=50?"var(--amber)":"var(--orange)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${i.quality}/100 — ${i.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${g}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function Cn(i,e,t,n,o,s,a){const l=Ce(i.awardedTick+i.totalTicks);Ce(i.awardedTick+i.totalTicks);const d=Ce(i.awardedTick),r=[{label:"Budget",value:ne(i.budget),sub:`${n}% spent`,color:t},{label:"Spent",value:ne(i.spent),color:"var(--red)"},{label:"Remaining",value:ne(o),color:"var(--green)"},{label:"Quality",value:`${i.quality}/100`,sub:i.qualityLabel,color:i.quality>=70?"var(--green)":i.quality>=50?"var(--amber)":"var(--red)"},{label:"Workforce",value:`${i.laborCount}/${i.wfNeeded}`,sub:`Bid: ${i.laborCount}`,color:i.laborCount<i.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${s} ticks`,sub:a?"OVERDUE":`Deadline: ${l}`,color:a?"var(--red)":"var(--text-bright)"}];let c="";c+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${b(e.description||e.name)}</div>
    </div></div>`,c+='<div class="pm-metrics">';for(const $ of r)c+=`<div class="pm-metric">
            <div class="pm-metric__label">${$.label}</div>
            <div class="pm-metric__value" style="color:${$.color}">${$.value}</div>
            ${$.sub?`<div class="pm-metric__sub">${b($.sub)}</div>`:""}
        </div>`;c+="</div>",c+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${d}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${a?"var(--red)":"var(--text-bright)"};font-weight:700">${l}</span></span>
        </div>
    </div></div>`;const p=e.modifiers||[];p.length>0&&(c+='<div style="padding:0 16px"><div class="pm-section">',c+='<div class="pm-section__title">Building Modifiers</div>',c+='<div style="display:flex;flex-wrap:wrap;gap:4px;">',c+=zi(p),c+="</div></div></div>");const f=[];if((e.sector==="civil_engineering"||e.sector==="industrial"||e.sector==="mega_project")&&(f.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),f.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),e.sector!=="civil_engineering"&&f.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),f.length>0){c+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const $ of f)c+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${b($.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;c+="</div></div>"}c+='<div style="padding:0 16px"><div class="pm-section">',c+='<div class="pm-section__title">Workforce Assignment</div>';const u=[{key:"general",label:"General Workers",corpAvail:i.corpGeneral,color:"var(--text-primary)"},{key:"skilled",label:"Skilled Workers",corpAvail:i.corpSkilled,color:"var(--blue)"},{key:"innovative",label:"Innovative Workers",corpAvail:i.corpInnovative,color:"var(--purple)"}];for(const $ of u){const k=Number(i.reqWf[$.key]||0);if(k===0)continue;const h=Number(i.assignedWf[$.key]||0),C=h>=k?"var(--green)":h>0?"var(--amber)":"var(--red)",E=$.corpAvail>0&&h<k,x=Math.min($.corpAvail,k-h),T=h>0;c+='<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.72rem;">',c+="<div>",c+=`<span style="color:${$.color};font-weight:600;">${$.label}</span>`,c+=`<span style="color:var(--text-dim);margin-left:8px;">Required: <strong>${k}</strong></span>`,c+=`<span style="color:${C};margin-left:8px;font-weight:700;">${h} assigned</span>`,c+=`<span style="color:var(--text-dim);margin-left:8px;">Pool: ${$.corpAvail}</span>`,c+="</div>",c+='<div style="display:flex;gap:4px;">',E&&(c+=`<button onclick="pmAssignWorkers('${$.key}',${x})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Assign ${x}</button>`),T&&(c+=`<button onclick="pmUnassignWorkers('${$.key}',${h})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Remove ${h}</button>`),c+="</div></div>"}const y=Number(i.reqWf.general||0)+Number(i.reqWf.skilled||0)+Number(i.reqWf.innovative||0),g=Number(i.assignedWf.general||0)+Number(i.assignedWf.skilled||0)+Number(i.assignedWf.innovative||0);return y>0&&g<y&&(c+='<div style="font-size:0.62rem;color:var(--red);margin-top:6px;font-family:var(--font-mono);">⚠ Project will STALL until workforce is fully assigned</div>'),c+="</div></div>",c}function Sn(i){if(i.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let e="";for(let t=0;t<i.events.length;t++){const n=i.events[t],o=i.expandedEvent===t,s=n.status==="ACTIVE",a=ki[n.type]||ki.WEATHER,l=Ei[n.severity]||Ei.LOW;if(e+=`<div class="pm-evt ${s?"pm-evt--active":"pm-evt--resolved"}" style="${s?`border-left-color:${a.color}`:""}">`,e+=`<div class="pm-evt__header" onclick="pmToggleEvent(${t})" style="${o?`background:${a.bg}`:""}">`,e+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${a.color};background:${a.bg};border:1px solid ${a.border}">${n.type}</span>
            <span class="pm-evt__sev-badge" style="color:${l}">${n.severity}</span>
            <span class="pm-evt__status" style="color:${s?"var(--red)":"var(--text-dim)"};font-weight:${s?"700":"400"}">${s?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,e+=`<div class="pm-evt__title">${b(n.title)}</div>`,e+=`<div class="pm-evt__meta">Tick ${n.tick} · ${b(n.id||"")}</div>`,o){if(e+='<div class="pm-evt__body">',e+=`<div class="pm-evt__desc">${b(n.desc)}</div>`,n.impact&&(e+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${b(n.impact)}</span>
                </div>`),s&&n.responses&&n.responses.length>0){e+='<div class="pm-evt__resp-title">Response Options</div>';for(let d=0;d<n.responses.length;d++){const r=n.responses[d],c=i.selectedResponse===d,f={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[r.tag]||"var(--text-secondary)";e+=`<div class="pm-resp${c?" selected":""}" style="${c?`border-color:${f}`:""}" onclick="event.stopPropagation();pmSelectResponse(${d})">`,e+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${b(r.label)}</span>
                            <span class="pm-resp__tag" style="color:${f};background:${f}12;border:1px solid ${f}25">${r.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${r.delay>0?"var(--orange)":"var(--green)"}">
                            ${r.delay>0?`+${r.delay} tick${r.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,e+=`<div class="pm-resp__detail">${b(r.detail)}</div>`,e+='<div class="pm-resp__costs">',r.cost&&(e+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${ne(r.cost)}</span>`),r.qualityImpact&&r.qualityImpact!==0&&(e+=`<span class="pm-resp__cost" style="color:${r.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${r.qualityImpact>0?"+":""}${r.qualityImpact}</span>`),!r.cost&&(!r.qualityImpact||r.qualityImpact===0)&&(e+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),e+="</div>",c&&(e+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${f}" onclick="event.stopPropagation();confirmEventResponse('${n.id}','${r.key}')">CONFIRM</button>
                        </div>`),e+="</div>"}}!s&&n.resolution&&(e+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${b(n.resolution)}</div>
                </div>`),e+="</div>"}e+="</div></div>"}return e}function In(i){if(i.materials.length===0)return'<div class="pm-evt-empty">No materials required for this project.</div>';let e='<div class="pm-tab-header">Project Materials</div>';for(const t of i.materials){const n=t.required>0?Math.round(t.allocated/t.required*100):0;t.allocated>0&&Math.round(t.consumed/t.allocated*100);const o=t.allocated>=t.required,s=o?"var(--green)":t.allocated>0?"var(--amber)":"var(--red)",a=o?"FULLY ALLOCATED":t.allocated>0?"PARTIAL":"NONE ALLOCATED";e+='<div class="pm-mat" style="margin-bottom:14px;">',e+=`<div class="pm-mat__row1">
            <div class="pm-mat__left">
                <span class="pm-mat__name">${b(t.name)}</span>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:${s};">${t.allocated} / ${t.required} allocated · ${a}</span>
        </div>`,e+=`<div class="pm-mat__bar-row">
            <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${n}%;background:${s};"></div></div>
            <span class="pm-mat__pct">${t.consumed} consumed</span>
        </div>`;const l=["STD","LOW","HIGH"],d=t.required-t.allocated;for(const r of l){const c=t.warehouseStock[r]||{qty:0},p=t.tiers[r]||{qty:0,consumed:0},f=p.qty-p.consumed;if(c.qty===0&&p.qty===0)continue;const u=r==="HIGH"?"var(--green)":r==="LOW"?"var(--orange)":"var(--text-muted)",y=r==="HIGH"?"HIGH":r==="LOW"?"LOW":"STD";if(e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.7rem;">',e+='<div style="display:flex;align-items:center;gap:6px;">',e+=`<span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${u};width:32px;">${y}</span>`,e+=`<span style="color:var(--text-dim);">Warehouse: <strong style="color:var(--text-primary);">${c.qty}</strong></span>`,p.qty>0&&(e+=`<span style="color:var(--text-dim);margin-left:8px;">Allocated: <strong style="color:var(--text-primary);">${p.qty}</strong></span>`),e+="</div>",e+='<div style="display:flex;gap:4px;">',c.qty>0&&d>0){const g=Math.min(c.qty,d);e+=`<button class="pm-alloc-btn" onclick="pmAllocateMaterial('${t.key}','${r}',${g})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Allocate ${g}</button>`}f>0&&(e+=`<button class="pm-alloc-btn" onclick="pmDeallocateMaterial('${t.key}','${r}',${f})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Return ${f}</button>`),e+="</div></div>"}e+="</div>"}return e}function Mn(i){if(i.equipment.length===0)return'<div class="pm-evt-empty">No equipment required for this project.</div>';let e='<div class="pm-tab-header">Project Equipment</div>';for(const t of i.equipment){const n=t.condition>=75?"var(--green)":t.condition>=50?"var(--amber)":t.condition>=25?"var(--orange)":"var(--red)",o=t.assignedToProject>0,s=o?"var(--green)":t.ownedTotal>0?"var(--amber)":"var(--red)",a=o?"DEPLOYED":t.ownedTotal>0?"NOT DEPLOYED":"NOT OWNED";e+=`<div class="pm-eq" style="margin-bottom:12px;">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${b(t.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${s};margin-left:8px;">${a}</span>
                </div>
            </div>`,o&&(e+=`<div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${t.condition}%;background:${n}"></div></div>
                <span class="pm-eq__cond-val" style="color:${n}">${t.condition}%</span>
            </div>`),e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:0.7rem;">',e+='<span style="color:var(--text-dim);">Required: <strong style="color:var(--text-primary);">1</strong>',e+=` · Owned: <strong style="color:var(--text-primary);">${t.ownedTotal}</strong>`,e+=` · Deployed: <strong style="color:var(--text-primary);">${t.deployed}</strong>`,e+=` · Available: <strong style="color:var(--text-primary);">${t.available}</strong></span>`,e+='<div style="display:flex;gap:4px;">',!o&&t.available>0&&(e+=`<button onclick="pmDeployEquipment('${t.key}',1)" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Deploy</button>`),o&&(e+=`<button onclick="pmUndeployEquipment('${t.key}')" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Undeploy</button>`),e+="</div></div>",e+="</div>"}return e}function Ce(i){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][i%12]}, ${2e3+Math.floor(i/12)}`}window.openProjectModal=Oe;window.closeProjectModal=wn;window.pmSetTab=kn;window.pmToggleEvent=En;window.pmSelectResponse=Tn;window.pmAllocateMaterial=vn;window.pmDeallocateMaterial=xn;window.pmDeployEquipment=_n;window.pmUndeployEquipment=hn;window.pmAssignWorkers=bn;window.pmUnassignWorkers=$n;async function Ri(i){if(!I)return;const{data:e,error:t}=await _.from("construction_events").select("*").eq("contract_id",i).order("fired_at_tick",{ascending:!1});t?(console.warn("Failed to load project events:",t.message),I.events=[]):I.events=(e||[]).map(n=>({id:n.id,type:n.type,severity:n.severity,tick:n.fired_at_tick,title:n.title,desc:n.description,impact:n.impact,status:n.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:n.resolution,responses:n.responses||[]})),Be()}let At=!1;async function An(i,e){if(!(At||!I)){At=!0;try{const{data:t,error:n}=await _.rpc("resolve_construction_event",{p_event_id:i,p_response_key:e});if(n){console.error("Failed to resolve event:",n.message),alert("Failed to submit response: "+n.message);return}const o=typeof t=="string"?JSON.parse(t):t;if(o?.error){alert("Error: "+o.error);return}await Ri(I.project.id),await Pi(),o?.quality_applied&&o.quality_applied!==0&&(I.quality=Math.max(0,Math.min(100,I.quality+o.quality_applied)),I.qualityLabel=I.quality>=80?"STRONG":I.quality>=60?"PROMISING":I.quality>=40?"FAIR":"UNCERTAIN"),Be()}finally{At=!1}}}window.confirmEventResponse=An;function he(i,e,t){const n=t?` style="color:${t}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${b(i)}</span>
        <span class="cd-detail-row__value"${n}>${b(e)}</span>
    </div>`}function zn(i){const e={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},t=i.drawing_number||i.contract_number+"-A1",n=H?.current_date||"",o=n?n.replace(/,\s*/," "):"",s=i.spec_category==="Heavy Infrastructure",a=i.spec_category==="Megaproject";let l=b(i.project_subtype||i.project_type||"STRUCTURE"),d=s?"80.0m":a?"200.0m":"60.0m",r=s?"40.0m":a?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${e.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(c,p)=>`<line x1="${p*20}" y1="0" x2="${p*20}" y2="200" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(c,p)=>`<line x1="0" y1="${p*20}" x2="680" y2="${p*20}" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}

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
    </svg>`}async function ve(){if(!m||!m.nation_id)return;const{data:i,error:e}=await _.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(e?(console.warn("Failed to load contracts:",e.message),He=[]):He=i||[],Ye={},m&&He.length>0){const t=He.map(o=>o.id),{data:n}=await _.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",m.id).in("contract_id",t);for(const o of n||[])Ye[o.contract_id]=o}Li()}function qn(){const i=document.getElementById("ap-list"),e=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=X.length+" ACTIVE",X.length===0){i.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,e.style.display="none";return}const t=H?.current_tick||0;let n=0,o=0,s="";for(const a of X){const l=a.issuer_type==="GOVERNMENT",d=l?"gov":"private",r=Array.isArray(a.contract_bids)?a.contract_bids[0]:a.contract_bids,c=r?.bid_price||0,p=r?.estimated_cost||0,f=r?.estimated_quality||0,u=a.budget_ceiling||0,y=a.awarded_at_tick||t,g=a.stalled_ticks||0,$=Math.max(0,t-y),k=Math.max(0,$-g),h=a.timeline_ticks||8,A=Math.max(0,h-k),C=Math.min(100,Math.round(k/h*100)),E=k>h,x=g>0;qi(a.sector);const T=ni(a.sector);n+=u,o+=c,s+=`<div class="ap-item" onclick="openProjectModal('${a.id}')">
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
                    <span class="ap-budget__values" style="color:${E?"var(--red)":x?"var(--orange)":"var(--teal)"}">
                        ${k}/${h} ticks ${E?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${C}%;background:${E?"var(--red)":x?"var(--orange)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${ne(c)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${ne(p)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${f>=70?"var(--green)":f>=40?"var(--teal)":"var(--orange)"}">${f}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${E?"var(--red)":"var(--text-bright)"}">${A} ticks</div>
                </div>
            </div>
        </div>`}i.innerHTML=s,e.style.display=X.length>0?"":"none",X.length>0&&(document.getElementById("ap-total-crew").textContent=X.length,document.getElementById("ap-total-budget").textContent=ne(n),document.getElementById("ap-total-spent").textContent=ne(o))}async function Pi(){if(!m)return;const{data:i,error:e}=await _.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",m.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",m.id).order("awarded_at_tick",{ascending:!0});e?(console.warn("Failed to load active projects:",e.message),X=[]):X=i||[],qn()}const ut=3e4;function yt(){let i=0,e=0;for(const t of ge)for(const n of ii){const o=Y[t.key]?.[n];o&&(i+=o.qty,e+=o.value)}return{totalUnits:i,totalValue:e}}function oi(){const i=document.getElementById("wh-list"),{totalUnits:e,totalValue:t}=yt();document.getElementById("wh-count").textContent=e.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=R(t);const n=Math.round(e/ut*100),o=document.getElementById("wh-capacity");o.textContent=n+"%",o.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)";let s="";for(let a=0;a<ge.length;a++){const l=ge[a],d=Vt===a,r=Y[l.key]?.LOW||{qty:0,value:0},c=Y[l.key]?.STD||{qty:0,value:0},p=Y[l.key]?.HIGH||{qty:0,value:0},f=r.qty+c.qty+p.qty,u=r.value+c.value+p.value,y=f===0,g=ze(l.key,"LOW",w),$=ze(l.key,"STD",w),k=ze(l.key,"HIGH",w),h=r.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",A=c.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",C=k.available?p.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(s+='<div class="wh-row">',s+=`<div class="wh-row__collapsed${d?" expanded":""}" onclick="toggleWhRow(${a})">
            <span class="wh-row__arrow">${d?"▾":"▸"}</span>
            <span class="wh-row__name${y?" empty":""}">${b(l.name)}</span>
            <div class="wh-row__dots">
                <div class="${h}"></div>
                <div class="${A}"></div>
                <div class="${C}"></div>
            </div>
            <span class="wh-row__qty${y?" empty":""}">${f>0?f.toLocaleString():"—"}</span>
            <span class="wh-row__val${y?" empty":""}">${u>0?R(u):"—"}</span>
        </div>`,d){s+='<div class="wh-expand">',s+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const E=[{key:"LOW",label:"Low",data:r,avail:g,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:c,avail:$,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:p,avail:k,color:"var(--green)",dotClass:"wh-dot--high"}];for(const x of E){const T=!x.avail.available,M=x.data.qty>0,N=M?"$"+Math.round(x.data.value/x.data.qty):"—";s+=`<div class="wh-grade${T?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${x.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${T?"var(--red)":x.color}">${x.label}</span>
                        ${T?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${M?"var(--text-bright)":"var(--text-dim)"}">${M?x.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${x.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${x.data.value>0?R(x.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${N}</span>
                </div>`}for(const x of E)!x.avail.available&&x.avail.failedStat&&(s+=`<div class="wh-lock">
                        <span class="wh-lock__text">${x.label.toUpperCase()} GRADE LOCKED — ${b(x.avail.failedStat)} &lt; ${x.avail.failedMin}</span>
                    </div>`);s+="</div>"}s+="</div>"}i.innerHTML=s}function Nn(i){Vt=Vt===i?-1:i,oi()}async function ai(){if(!m)return;const{data:i,error:e}=await _.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",m.id);if(Y={},e)console.warn("Failed to load warehouse:",e.message);else if(i)for(const t of i)Y[t.material_key]||(Y[t.material_key]={}),Y[t.material_key][t.quality_tier]={qty:t.quantity||0,value:Number(t.total_value)||0};oi()}const Ln={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function Oi(){const i=(w?.name||m?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+i;const e=Number(m?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=R(e);const{totalUnits:t}=yt(),n=Math.round(t/ut*100),o=document.getElementById("pr-wh-capacity");o.textContent=n+"%",o.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)",Di(),si(),gt()}function Di(){const i=document.getElementById("pr-mat-grid");let e="";for(const t of ge){const n=U===t.key,o=ii.every(a=>!ze(t.key,a,w).available),s="pr-mat-btn"+(n?" active":"")+(o?" all-locked":"");e+=`<span class="${s}" onclick="setPrMat('${t.key}')">${b(t.name)}</span>`}i.innerHTML=e}function si(){const i=document.getElementById("pr-tier-bar");let e='<span class="pr-tier-label">GRADE</span>';for(const t of ii){const n=ze(U,t,w),o=G===t,s=n.available?ti(U,t,w):null,a=Mi[t],l=!n.available,d="pr-tier-btn"+(o?" active":"")+(l?" locked":"");e+=`<div class="${d}" onclick="${l?"":`setPrTier('${t}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${a};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${o?"var(--text-bright)":"var(--text-dim)"}">${Ft[t]}</span>
            </div>
            ${s!==null?`<div class="pr-tier-btn__price" style="color:${o?"var(--text-bright)":"var(--text-muted)"}">$${s}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}i.innerHTML=e}function gt(){const i=document.getElementById("pr-content"),e=ze(U,G,w),t=ge.find(E=>E.key===U);if(!t)return;if(!e.available){i.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${b(t.name)} — ${Ft[G]} grade
                    is not produced domestically in ${b(w?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${b(e.failedStat||"unknown")} &lt; ${e.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const n=ti(U,G,w),o=Ai(U,G,w),s=n*re,a=o>3e3?"LOW":o>1e3?"MODERATE":"HIGH",l=a==="LOW"?"var(--green)":a==="MODERATE"?"var(--amber)":"var(--red)",d=Number(w?.inflation??50),r=d>55?"up":d<45?"down":"flat",c=r==="up"?"&#9650;":r==="down"?"&#9660;":"&#8212;",p=r==="up"?"var(--red)":r==="down"?"var(--green)":"var(--text-dim)";let f="";f+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${n}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${p}">${c}</span>
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
    </div>`,f+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${b(w?.name||"—")})</div>`;for(const E of t.priceDrivers){const x=Number(w?.[E]??50),T=x>=50?"var(--green)":x>=30?"var(--amber)":x>=15?"var(--orange)":"var(--red)",M=Ln[E]||E;f+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${b(E)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${x}%;background:${T}"></div>
            </div>
            <span class="pr-driver-row__val">${x}</span>
            <span class="pr-driver-row__effect">${b(M)}</span>
        </div>`}f+="</div>";const y=(Number(m?.corp_cash_reserves)||0)>=s,g=re>o,{totalUnits:$}=yt(),k=ut-$,h=re>k,A=k<=0,C=Mi[G];f+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${b(t.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${C};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${C}">${Ft[G]}</span>
                </div>
                <span class="pr-order__mat-price">$${n}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(E=>`<span class="pr-qty-btn${re===E?" active":""}" onclick="setPrQty(${E})">${E>=1e3?E/1e3+"k":E}</span>`).join("")}
                </div>
            </div>
            ${g?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${o.toLocaleString()} this tick</span>
            </div>`:""}
            ${A?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">WAREHOUSE FULL — no remaining capacity</span>
            </div>`:h?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS WAREHOUSE CAPACITY — ${k.toLocaleString()} units remaining</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${R(s)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${y&&!g&&!h&&!A?"":"disabled"}
                    title="${y?g?"Exceeds supply":A?"Warehouse full":h?"Exceeds warehouse capacity":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,i.innerHTML=f}function Bn(i){U=i,G="STD";for(const e of["STD","HIGH","LOW"])if(ze(i,e,w).available){G=e;break}Di(),si(),gt()}function Rn(i){G=i,si(),gt()}function Pn(i){re=i,gt()}let zt=!1;async function On(){if(zt||!m||!w)return;const i=ti(U,G,w),e=Ai(U,G,w),t=i*re,n=Number(m.corp_cash_reserves)||0;if(t>n){alert("Insufficient cash reserves.");return}if(re>e){alert("Exceeds available supply this tick.");return}const{totalUnits:o}=yt(),s=ut-o;if(s<=0){alert("Warehouse is full. Cannot purchase more materials.");return}if(re>s){alert(`Warehouse can only hold ${s.toLocaleString()} more units. Reduce quantity.`);return}zt=!0;const a=document.querySelector(".pr-purchase-btn");a&&(a.disabled=!0,a.textContent="...");try{const l=n-t,{error:d}=await _.from("factions").update({corp_cash_reserves:l}).eq("id",m.id);if(d)throw d;const r=Y[U]?.[G],c=(r?.qty||0)+re,p=(r?.value||0)+t,{error:f}=await _.from("corp_warehouse").upsert({faction_id:m.id,nation_id:m.nation_id,material_key:U,quality_tier:G,quantity:c,total_value:p,last_purchased_tick:H?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(f){const{error:u}=await _.from("factions").update({corp_cash_reserves:n}).eq("id",m.id);throw u&&console.error("Cash refund failed after warehouse error:",u.message),f}m.corp_cash_reserves=l,Y[U]||(Y[U]={}),Y[U][G]={qty:c,value:p},oi(),Oi(),a&&(a.textContent="PURCHASED",setTimeout(()=>{a.isConnected&&(a.disabled=!1,a.textContent="PURCHASE")},1500))}catch(l){a&&(a.disabled=!1,a.textContent="PURCHASE"),alert("Purchase failed: "+(l.message||"Unknown error"))}finally{zt=!1}}function ji(i){const e=qe||w;if(!e)return[];const t=mt(i);if(!t)return[];const n=pn(i,e),o=[],s=Number(e?.inflation??50),a=Number(e?.fuel_prices??50);Number(e?.manufacturing_output??50);const l=qe&&w&&qe.id!==w.id;let d=null;if(l&&(d=fn(e,w)),n.newAvailable>0){const r=hi(i,e),c=t.basePrice,p=Math.round(c*((s-50)/200)),f=Math.round(c*((a-50)/300));let u=r;const y=[{label:"Base price",value:R(c)},p!==0?{label:`Inflation (${s})`,mod:(p>=0?"+":"")+R(Math.abs(p))}:null,f!==0?{label:`Fuel transport (${a})`,mod:(f>=0?"+":"")+R(Math.abs(f))}:null].filter(Boolean),g=r-c-p-f;if(g!==0&&!l&&y.push({label:"Demand/scarcity",mod:(g>=0?"+":"")+R(Math.abs(g))}),l&&d){const $=Math.round(r*d.tariff),k=Math.round(r*d.transport);u=r+$+k,y.push({label:`Import tariff (${Math.round(d.tariff*100)}%)`,mod:"+"+R($)}),y.push({label:`Transport (${d.deliveryTicks} tick${d.deliveryTicks>1?"s":""})`,mod:"+"+R(k)})}o.push({seller:l?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:l?d?.deliveryTicks||1:0,condition:100,price:Math.round(u),available:n.newAvailable,delivery:l?d.deliveryTicks+" tick"+(d.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:l?d.deliveryTicks:0,used:!1,priceFactors:y,sourceNationId:e.id})}if(n.usedAvailable>0){const r=n.usedCondition,c=hi(i,e,{used:!0,condition:r});let p=c;const f=[{label:"Base price",value:R(t.basePrice)},{label:`Condition (${r}%)`,mod:"-"+R(Math.max(0,t.basePrice-c))}];if(l&&d){const u=Math.round(c*d.tariff),y=Math.round(c*d.transport);p=c+u+y,f.push({label:`Import tariff (${Math.round(d.tariff*100)}%)`,mod:"+"+R(u)}),f.push({label:`Transport (${d.deliveryTicks} tick${d.deliveryTicks>1?"s":""})`,mod:"+"+R(y)})}o.push({seller:l?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:l?d?.deliveryTicks||1:0,condition:r,price:Math.round(p),available:n.usedAvailable,delivery:l?d.deliveryTicks+" tick"+(d.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:l?d.deliveryTicks:0,used:!0,priceFactors:f,sourceNationId:e.id})}return o}function vt(){const i=Number(m?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=R(i);const e=mt(ie),t=Ze[e?.tier||1],n=document.getElementById("em-tier-badge");n&&(n.textContent=t.tag,n.style.color=t.color),n.style.background=t.color+"0a",n.style.border="1px solid "+t.color+"33";const o=document.getElementById("em-nation-select");if(o&&o.options.length===0){const l=w?.name||m?.nation||"—";let d=`<option value="">${b(l)} (HQ)</option>`;for(const r of ct)r.id!==w?.id&&(d+=`<option value="${r.id}">${b(r.name)}</option>`);o.innerHTML=d}const s=document.getElementById("em-import-tag"),a=qe&&w&&qe.id!==w.id;s&&(s.style.display=a?"":"none"),Dn(),ri()}function Dn(){let i="";for(let e=1;e<=3;e++){const t=Ze[e],n=Wt(e),o=e===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";i+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${t.color}">${t.tag}</div>
            <div class="${o}">`;for(const s of n){const a=ie===s.key,l=ji(s.key).length>0;i+=`<span class="em-selector__btn${a?" active":""}${l?"":" no-listings"}"
                style="${a?"background:"+t.color+";border-color:"+t.color:""}"
                onclick="setEmType('${s.key}')">${b(s.name)}</span>`}i+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${i}</div>`}function ri(){const i=document.getElementById("em-content");if(we=ji(ie),we.length===0){i.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}fe>=we.length&&(fe=0);let e="";for(let n=0;n<we.length;n++){const o=we[n],s=fe===n,a=o.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",l=Ii(o.condition);e+=`<div class="em-listing${s?" selected":""}" style="${s?"border-left-color:"+a:""}" onclick="setEmListing(${n})">`,e+=`<div class="em-listing__row1">
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
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${R(o.price)}</div>
            </div>
        </div>`,s&&o.priceFactors&&(e+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${o.priceFactors.map(d=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${b(d.label)}</span>
                    <span class="em-breakdown__mod" style="color:${d.mod?d.mod.startsWith("-")?"var(--green)":d.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${d.mod||d.value}</span>
                </div>`).join("")}
            </div>`),e+="</div>"}const t=we[fe];if(t){const n=mt(ie),o=Ze[n?.tier||1],s=Math.min(t.available,4),a=t.price*me,l=(Number(m?.corp_cash_reserves)||0)>=a;e+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${b(n?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${b(t.seller)}</span>
                </div>
                <span class="em-purchase__price">${R(t.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:s},(d,r)=>r+1).map(d=>`<span class="em-qty-btn${me===d?" active":""}" style="${me===d?"background:"+o.color+";border-color:"+o.color:""}" onclick="setEmQty(${d})">${d}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${t.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${R(a)}</div>
                    ${t.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${b(t.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${o.color}" onclick="purchaseEquipment()"
                    ${l?"":"disabled"}
                    title="${l?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}i.innerHTML=e}async function jn(i){if(!i)qe=null;else{let t=ct.find(n=>n.id===i);if(!t)try{const{data:n}=await _.from("nations").select("*").eq("id",i).single();t=n}catch{}qe=t||null}fe=0,me=1;const e=document.getElementById("em-nation-select");e&&(e.value=i||""),vt()}function Hn(i){ie=i,fe=0,me=1,vt()}function Un(i){fe=i,me=1,ri()}function Gn(i){me=i,ri()}let qt=!1;async function Wn(){if(qt)return;const i=we[fe];if(!i||!m)return;const e=mt(ie);if(!e)return;const t=me,n=i.price*t,o=Number(m.corp_cash_reserves)||0;if(n>o){alert("Insufficient cash reserves.");return}if(t>i.available){alert("Not enough units available.");return}const s=document.querySelector(".em-purchase-btn");s&&(s.disabled=!0,s.textContent="..."),qt=!0;try{const a=o-n,{error:l}=await _.from("factions").update({corp_cash_reserves:a}).eq("id",m.id);if(l)throw l;const d=!i.deliveryTicks||i.deliveryTicks===0;if(d){const c=ee.find(A=>A.equipment_key===ie),p=(c?.owned||0)+t,f=c?.purchase_price_avg||0,u=c?.owned||0,y=u>0?Math.round((f*u+i.price*t)/p):i.price,g=e.maintenancePerUnit*p,$=c?.condition||100,k=Math.round(($*u+i.condition*t)/p),{error:h}=await _.from("corp_equipment").upsert({faction_id:m.id,nation_id:m.nation_id,equipment_key:ie,tier:e.tier,owned:p,deployed:c?.deployed||0,condition:k,maintenance_per_tick:g,purchase_price_avg:y,last_purchased_tick:H?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(h){const{error:A}=await _.from("factions").update({corp_cash_reserves:o}).eq("id",m.id);throw A&&console.error("Cash refund failed:",A.message),h}c?(c.owned=p,c.condition=k,c.maintenance_per_tick=g):ee.push({equipment_key:ie,tier:e.tier,owned:p,deployed:0,condition:k,maintenance_per_tick:g,assigned_projects:[]})}else{const c=(H?.current_tick||0)+i.deliveryTicks,{error:p}=await _.from("corp_equipment_deliveries").insert({faction_id:m.id,equipment_key:ie,quantity:t,condition:i.condition,delivery_tick:c,source_nation_id:i.sourceNationId||null,seller_name:i.seller,price_paid:n});if(p){const{error:f}=await _.from("factions").update({corp_cash_reserves:o}).eq("id",m.id);throw f&&console.error("Cash refund failed:",f.message),p}}m.corp_cash_reserves=a,li(),vt();const r=document.getElementById("pr-cash");r&&(r.textContent=R(a)),s&&(s.textContent=d?"PURCHASED":"ORDERED",setTimeout(()=>{s.isConnected&&(s.disabled=!1,s.textContent="PURCHASE")},1500))}catch(a){s&&(s.disabled=!1,s.textContent="PURCHASE"),alert("Purchase failed: "+(a.message||"Unknown error"))}finally{qt=!1}}let Fn=-1,Ue=[],pt=[],Xt=[];function Nt(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(1)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function Vn(i,e,t){if(t)return"var(--orange)";const n=i/(e||1)*100;return n>50?"var(--green)":n>25?"var(--amber)":"var(--red)"}function Ti(){const i=document.getElementById("pm-list"),e=Ue.length,t=pt.length,n=Xt.length,o=Ue.filter(d=>d.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${e})`,document.getElementById("pm-pending-count").textContent=`(${t})`,document.getElementById("pm-apply-count").textContent=`(${n})`;const s=document.getElementById("pm-badges");let a="";o>0&&(a+=`<span class="pm-badge pm-badge--expiring">${o} EXPIRING</span>`),t>0&&(a+=`<span class="pm-badge pm-badge--pending">${t} PENDING</span>`),s.innerHTML=a;const l=Ue.reduce((d,r)=>d+(r.cost||0),0)+pt.reduce((d,r)=>d+(r.cost||0),0);document.getElementById("pm-total-cost").textContent=Nt(l),document.getElementById("pm-footer-active").textContent=e,document.getElementById("pm-footer-pending").textContent=t;{if(e===0){i.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let d="";Ue.forEach((r,c)=>{const p=Fn===c,f=Vn(r.ticks_left,r.total_ticks,r.expiring_soon),u=Math.min(r.ticks_left/(r.total_ticks||1)*100,100);d+=`<div class="pm-item ${r.expiring_soon?"pm-item--expiring":""} ${p?"expanded":""}" onclick="togglePmExpand(${c})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${b(r.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${b((r.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${f}">Expires: ${b(r.expires||"")}</span>
                        <span class="pm-item__ticks">(${r.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${u}%;background:${f}"></div></div>`,p&&(d+=`<div class="pm-detail">
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
                        <span class="pm-detail__val">${Nt(r.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${r.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${r.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(r.projects||[]).map(y=>`<span class="pm-project-chip">${b(y)}</span>`).join("")}</div>
                    </div>`,r.note&&(d+=`<div class="pm-note"><span class="pm-note__text">${b(r.note)}</span></div>`),r.expiring_soon&&r.renewable&&(d+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew" onclick="event.stopPropagation(); pmApplyForPermit('${r.permit_key}');">RENEW — ${Nt(r.cost||0)}</button></div>`),d+="</div>"),d+="</div></div>"}),i.innerHTML=d;return}}let Lt=!1;async function Yn(i){if(!(Lt||!m||!w)){Lt=!0;try{const{data:e}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{data:n,error:o}=await _.rpc("apply_for_permit",{p_faction_id:m.id,p_nation_id:w.id,p_permit_key:i,p_current_tick:t});if(o){alert("Application failed: "+o.message);return}if(n&&!n.success){alert(n.error||"Application failed");return}alert("Permit application submitted! Processing: "+(n.processing_ticks||0)+" ticks."),await Hi()}catch(e){alert("Error: "+e.message)}finally{Lt=!1}}}window.pmApplyForPermit=Yn;async function Hi(){if(!m||!w){Ue=[],pt=[],Xt=[],Ti();return}const{data:i}=await _.from("construction_permits").select("*"),e=i||[],t={};for(const p of e)t[p.permit_key]=p;const{data:n}=await _.from("corp_permits").select("*").eq("faction_id",m.id).eq("nation_id",w.id),o=n||[],{data:s}=await _.from("active_laws").select("policy_id, policies(permit_key, policy_name)").eq("nation_id",w.id).not("policies.permit_key","is",null),a=new Set,l={};for(const p of s||[])p.policies?.permit_key&&(a.add(p.policies.permit_key),l[p.policies.permit_key]=p.policies.policy_name);const{data:d}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),r=d?.current_tick||0;Ue=o.filter(p=>p.status==="active").map(p=>{const f=t[p.permit_key]||{},u=p.expires_at_tick?Math.max(0,p.expires_at_tick-r):999,y=f.duration_ticks||24;return{name:f.name||p.permit_key,permit_key:p.permit_key,nation:w.name,policy:l[p.permit_key]||"—",issued:p.granted_at_tick!=null?Ce(p.granted_at_tick):"—",expires:p.expires_at_tick?Ce(p.expires_at_tick):"Single-use",cost:p.cost_paid||0,ticks_left:u,total_ticks:y,expiring_soon:u<=3&&u>0,renewable:f.duration_ticks!=null,projects:[]}}),pt=o.filter(p=>p.status==="pending").map(p=>{const f=t[p.permit_key]||{},u=f.processing_ticks||2,y=r-p.applied_at_tick,g=Math.max(0,u-y);return{name:f.name||p.permit_key,permit_key:p.permit_key,nation:w.name,applied:Ce(p.applied_at_tick),status:"PROCESSING",processing_total:u,ticks_remaining:g,est_approval:Ce(p.applied_at_tick+u),cost:p.cost_paid||0,required_by:l[p.permit_key]||"—"}});const c=new Set(o.filter(p=>p.status==="active"||p.status==="pending").map(p=>p.permit_key));Xt=[...a].filter(p=>!c.has(p)).map(p=>{const f=t[p]||{};return{name:f.name||p,permit_key:p,nation:w.name,description:f.description||"",policy:l[p]||"—",cost:f.cost_is_percentage?15e4:f.cost||0,processing_time:f.processing_ticks||2,duration:f.duration_ticks?f.duration_ticks+" ticks":"Single-use",category:f.category||"",difficulty:f.difficulty||"EASY"}}),Ti()}let Se=[],Qn=-1;function pe(i){return Math.abs(i)>=1e6?"$"+(i/1e6).toFixed(2)+"M":Math.abs(i)>=1e3?"$"+(i/1e3).toFixed(0)+"k":"$"+i.toLocaleString()}function Ci(i){return i>=85?"var(--gold)":i>=60?"var(--green)":i>=40?"var(--orange)":"var(--red)"}function Kn(i){return"dl-result--"+i.toLowerCase()}function Si(){const i=document.getElementById("dl-list"),e=Se.length;document.getElementById("dl-count").textContent=`${e} COMPLETED`;const t=Se.reduce((l,d)=>{const r=d.financials||{};return l+((r.payment||0)+(r.bonus||0)-(r.penalty||0)-(r.total_cost||0))},0),n=document.getElementById("dl-lifetime-profit");n.textContent=(t>=0?"+":"")+pe(t),n.style.color=t>=0?"var(--green)":"var(--red)";const o={};Se.forEach(l=>{o[l.result]=(o[l.result]||0)+1});const s=document.getElementById("dl-footer-results");if(s.innerHTML=Object.entries(o).map(([l,d])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[l]||"var(--text-dim)"}">${b(l)}</div>
            <div class="dl-footer__result-count">${d}</div>
        </div>`).join(""),e===0){i.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let a="";Se.forEach((l,d)=>{const r=Qn===d,c=l.financials||{},p=(c.payment||0)+(c.bonus||0)-(c.penalty||0)-(c.total_cost||0),f=p>=0,u=Kn(l.result),g={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[l.result]||"var(--text-dim)",$=l.type==="GOVERNMENT";if(a+=`<div class="dl-item ${r?"expanded":""}" onclick="toggleDlExpand(${d})">
            <div class="dl-item__inner" style="border-left:2px solid ${g}">
                <div class="dl-item__row1">
                    <span class="dl-item__name">${b(l.name)}</span>
                    <span class="dl-result-badge ${u}">${b(l.result)}</span>
                </div>
                <div class="dl-item__row2">
                    <span class="dl-item__id">${b(l.id)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                    <span class="dl-item__issuer" style="color:${$?"var(--green)":"var(--gold)"}">${b(l.issuer)}</span>
                    <span class="dl-item__date">${b(l.delivered)}</span>
                </div>
                <div class="dl-summary-bar">
                    <div class="dl-summary-cell" style="flex:1;">
                        <div class="dl-summary-label">QUALITY</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span class="dl-summary-value" style="color:${Ci(l.quality_score)}">${l.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${l.rep_change>0?"var(--green)":l.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${l.rep_change>0?"+":""}${l.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${f?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${f?"var(--green)":"var(--red)"};margin-top:2px;">${f?"+":""}${pe(p)}</div>
                    </div>
                </div>`,r){const k=l.inspection||{};a+='<div style="margin-top:8px;">',a+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(E=>{const x=k[E]||{score:0,issues:[]},T=Ci(x.score),M=Math.min(x.score/100*100,100);a+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${b(E.charAt(0).toUpperCase()+E.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${M}%;background:${T}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${T}">${x.score}</span>
                        </div>
                    </div>
                    ${(x.issues||[]).map(N=>`<div class="dl-inspect-issue">${b(N)}</div>`).join("")}
                </div>`});const h=k.permits||{passed:!0,issues:[]};a+=`<div class="dl-permits-row ${h.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${h.passed?"var(--green)":"var(--red)"}">${h.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${(h.issues||[]).map(E=>`<div class="dl-inspect-issue dl-inspect-issue--red">${b(E)}</div>`).join("")}
            </div>`,a+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',a+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(l.materials_used||[]).forEach(E=>{const x=E.grade==="HIGH"?"var(--green)":E.grade==="STANDARD"?"var(--amber)":"var(--orange)",T=E.impact==="positive"?"▲":E.impact==="negative"?"▼":"–",M=E.impact==="positive"?"var(--green)":E.impact==="negative"?"var(--red)":"var(--text-dim)";a+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${b(E.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${x}"></div>
                    <span class="dl-mat-tag__grade" style="color:${x}">${b(E.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${M}">${T}</span>
                </div>`}),a+="</div>",a+='<div class="dl-section-label">Financial Summary</div>',a+='<div class="dl-fin-panel">',a+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${pe(c.contract_value||0)}</span></div>`,(c.bonus||0)>0&&(a+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${pe(c.bonus)}</span></div>`),(c.penalty||0)>0&&(a+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${pe(c.penalty)}</span></div>`);const A=(c.payment||0)+(c.bonus||0)-(c.penalty||0);a+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${pe(A)}</span></div>`,a+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${pe(c.total_cost||0)}</span></div>`,a+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${f?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${f?"var(--green)":"var(--red)"}">${f?"+":""}${pe(p)}</span>
            </div>`,a+="</div>";const C=l.timeline||{};a+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${C.actual||0}/${C.expected||0} ticks</span>`,C.early?a+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(C.expected||0)-(C.actual||0)} TICK${C.expected-C.actual!==1?"S":""} EARLY</span>`:!C.on_time&&C.actual>C.expected&&(a+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(C.actual||0)-(C.expected||0)} TICK${C.actual-C.expected!==1?"S":""} LATE</span>`),a+="</div>",a+="</div>"}a+="</div></div>"}),i.innerHTML=a}async function Jn(){if(!m){Se=[],Si();return}const{data:i,error:e}=await _.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",m.id).order("delivered_at_tick",{ascending:!1}).limit(20);e?(console.warn("Failed to load deliveries:",e.message),Se=[]):Se=(i||[]).map(t=>{const n=t.construction_contracts||{};return{id:t.contract_id,name:n.name||"Project",type:n.issuer_type||"GOVERNMENT",issuer:n.issuer_name||"Government",delivered:"Tick "+(t.delivered_at_tick||0),result:t.result,quality_score:t.quality_score,rep_change:t.rep_change,financials:{contract_value:t.contract_value||0,bonus:t.quality_bonus||0,penalty:t.penalties||0,payment:t.payment_received||0,total_cost:t.total_cost||0},inspection:t.inspection||{},materials_used:t.materials_used||[],timeline:{expected:t.timeline_expected||0,actual:t.timeline_actual||0,on_time:t.on_time,early:t.timeline_actual<t.timeline_expected}}}),Si()}function li(){const i=ee.reduce((l,d)=>l+(d.owned||0),0),e=ee.reduce((l,d)=>l+(d.deployed||0),0),t=cn(ee),n=i-e;document.getElementById("eq-count").textContent=i+" UNITS",document.getElementById("eq-summary").innerHTML=`
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
                ${R(t)}
            </div>
        </div>`;const o={};for(const l of ee)o[l.equipment_key]=l;let s="";for(let l=1;l<=3;l++){const d=Ze[l],r=Wt(l),c=Yt===l,p=r.reduce((u,y)=>u+(o[y.key]?.owned||0),0),f=r.reduce((u,y)=>u+(o[y.key]?.deployed||0),0);if(s+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${l})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${c?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${d.color}">${b(d.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${d.color};border:1px solid ${d.color}33;background:${d.color}0a">${d.tag}</span>
            </div>
            ${p>0?`<span class="eq-tier-hdr__count">${f}/${p}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,c)for(const u of r){const y=o[u.key],g=y?.owned||0,$=y?.deployed||0,k=y?.condition||0,h=u.maintenancePerUnit*g,A=g-$,C=g>0&&A===0,E=g>0&&k<65,x=Ii(k),T=y?.assigned_projects||[],M=T.length>0?T.map(N=>N.contract_name||"Project").join(", ").slice(0,30):g>0&&$>0?$+" project"+($>1?"s":""):"—";s+=`<div class="eq-row${g===0?" unowned":""}">`,s+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${g===0?" dim":""}">${b(u.name)}</span>
                        ${E?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${g>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${C?"var(--orange)":"var(--green)"}">${A}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${$}/${g}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,g>0?s+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${k}%;background:${x}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${x}">${k}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${b(M)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${R(h)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:s+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',s+="</div>"}}document.getElementById("eq-list").innerHTML=s;const a=[1,2,3].map(l=>{const d=Ze[l],r=Wt(l).reduce((c,p)=>c+(o[p.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${r>0?d.color+"33":"var(--border-0)"};background:${r>0?d.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${d.color}">${d.tag}</div>
            <div class="eq-footer__tier-count" style="color:${r>0?"var(--text-bright)":"var(--text-dim)"}">${r}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${R(t)}</div>
        </div>
        <div class="eq-footer__tiers">${a}</div>`}function Xn(i){Yt=Yt===i?-1:i,li()}async function di(){if(!m)return;const{data:i,error:e}=await _.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",m.id);e?(console.warn("Failed to load equipment:",e.message),ee=[]):ee=i||[],li()}async function Zn(){const{data:{user:i}}=await _.auth.getUser();if(!i){window.location.href="login.html";return}const{data:e}=await _.from("factions").select("*").or(`id.eq.${i.id},linked_user_id.eq.${i.id}`);Je=(e||[]).filter(r=>r.nation_id);const t=sessionStorage.getItem("active_faction_id");if(m=Je.find(r=>r.id===t)||Je.find(r=>r.faction_type==="corporation")||Je[0],!m){await _.auth.signOut(),window.location.href="login.html";return}if(m.faction_type!=="corporation"){window.location.href="dashboard.html";return}const[n,o]=await Promise.all([m.nation_id?_.from("nations").select("*").eq("id",m.nation_id).single():Promise.resolve({data:null}),_.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);n.error&&console.warn("Nation load failed:",n.error.message),n.data&&(w=n.data),o.error&&console.warn("Shard load failed:",o.error.message),H=o.data;const s=m.corp_ticker||m.abbreviation||"";if(document.getElementById("corp-logo").textContent=s.slice(0,2)||"—",document.getElementById("corp-name-bar").textContent=m.faction_name||"Unnamed Corp",H){if(document.getElementById("game-date").textContent=H.current_date||"—",document.getElementById("tick-number").textContent=H.current_tick||"—",H.next_tick_at){const c=(Number(H.tick_interval_hours)||8)*36e5,p=new Date(H.next_tick_at).getTime(),u=p-c+c/2;Qt=new Date(u>Date.now()?u:p+c/2),un()}const r=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");r&&(r.textContent="Next Corp Tick")}document.getElementById("corp-name-badge").textContent=(s?"["+s+"]":m.faction_name||"Corp")+" ▾";const a=document.getElementById("topbar-cash");if(a){const r=Number(m.corp_cash_reserves??0),c=r>=1e9?"$"+(r/1e9).toFixed(1)+"B":r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k";a.textContent="CASH: "+c}const l=document.getElementById("topbar-ap");l&&(l.style.display="none"),document.getElementById("nation-pill").textContent=(w?.name||m.nation||"—").toUpperCase();const d=document.getElementById("corp-faction-dropdown");if(d){let r="";for(const c of Je){const p=c.id===m.id,f=c.faction_type==="corporation"?"CORP":"PARTY",u=c.faction_type==="corporation"?"var(--teal)":"var(--amber)";r+=`<div class="corp-dd-item${p?" active":""}" onclick="switchToFaction('${c.id}', '${c.faction_type}')">
                <span class="corp-dd-type" style="color:${u}">${f}</span>
                <span class="corp-dd-name">${b(c.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${b(c.abbreviation||"—")}]</span>
            </div>`}d.innerHTML=r}try{const{data:r}=await _.from("building_modifiers").select("*");dt={};for(const c of r||[])dt[c.modifier_key]=c}catch{}await Promise.all([ve(),Pi(),ai(),di(),Hi(),Jn(),nt()]);try{const{data:r}=await _.from("nations").select("*").order("name");ct=r||[]}catch{ct=[]}if(Oi(),vt(),dn(m,w,H),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",new URLSearchParams(window.location.search).get("tab")==="expansion"){const r=document.querySelector('[data-tab="expansion"]');r&&Gi({preventDefault:()=>{},target:r})}}async function eo(){await _.auth.signOut(),window.location.href="login.html"}function to(){const i=document.getElementById("corp-faction-dropdown");i&&i.classList.toggle("open")}function io(i,e){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.remove("open"),sessionStorage.setItem("active_faction_id",i),e==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",i=>{const e=document.getElementById("faction-switcher"),t=document.getElementById("corp-faction-dropdown");t&&e&&!e.contains(i.target)&&t.classList.remove("open")});document.addEventListener("keydown",i=>{i.key==="Escape"&&it()});window.doLogout=eo;window.toggleTheme=yn;window.toggleCorpDropdown=to;window.switchToFaction=io;window.setFilter=gn;window.openContractDetail=Bi;window.closeContractDetail=it;window.toggleWhRow=Nn;window.toggleEqTier=Xn;window.switchEmNation=jn;window.setEmType=Hn;window.setEmListing=Un;window.setEmQty=Gn;window.purchaseEquipment=Wn;window.setPrMat=Bn;window.setPrTier=Rn;window.setPrQty=Pn;window.purchaseMaterial=On;let Q={general:0,skilled:0,innovative:0},Bt=!1;const Le=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function Ui(i){const e=Number(w?.minimum_wage??50),t=Number(w?.inflation??50),n=Number(w?.standard_of_living??50),o=e/100*48e3,s=1+(t-50)/100*.5,a=1+(n-50)/100*.5;return Math.round(o*i*s*a)}function v(i){const e=Math.abs(i),t=i<0?"-":"";return e>=1e9?t+"$"+(e/1e9).toFixed(2)+"B":e>=1e6?t+"$"+(e/1e6).toFixed(2)+"M":e>=1e3?t+"$"+(e/1e3).toFixed(1)+"k":t+"$"+e.toLocaleString()}async function Gi(i){i.preventDefault(),document.getElementById("operations-content").style.display="none";const e=document.getElementById("expansion-content");e.style.display="flex",e.style.justifyContent="center",e.style.gap="12px",e.style.alignItems="flex-start",e.style.flexWrap="wrap",document.querySelectorAll(".corp-nav__tab").forEach(t=>t.classList.remove("active")),i.target.classList.add("active"),await nt(),bt(),so(),await ci(),_t(),await Eo(),await xo(),wt(),ht(),await qo(),kt()}function Wi(i){i&&i.preventDefault(),document.getElementById("operations-content").style.display="flex",document.getElementById("expansion-content").style.display="none",document.querySelectorAll(".corp-nav__tab").forEach(e=>e.classList.remove("active")),document.querySelector('[data-tab="operations"]')?.classList.add("active")}function xt(){return W.reduce((e,t)=>{const n=Number(t.capacity||0),o=Number(t.condition||0)/100;return e+Math.floor(n*o)},0)+500}function no(i,e){const t=Le.find(s=>s.id===i),n=Number(m?.[t.factionKey]??0),o=Q[i]+e;if(!(n+o<0)){if(e>0){const s=Le.reduce((l,d)=>{const r=Number(m?.[d.factionKey]??0),c=d.id===i?o:Q[d.id];return l+r+c},0),a=xt();if(s>a)return}Q[i]=o,bt()}}function oo(i){i?Q[i]=0:Q={general:0,skilled:0,innovative:0},bt()}async function ao(){if(Bt||!Object.values(Q).some(a=>a!==0))return;let e=0;for(const a of Le){const l=Q[a.id];l>0&&(e+=l*Ui(a.multiplier)*.1)}const t=Number(m?.corp_cash_reserves??0);if(e>t){alert("Insufficient cash reserves. Hiring cost: "+v(e)+", available: "+v(t));return}const n=Le.reduce((a,l)=>a+Number(m?.[l.factionKey]??0)+Q[l.id],0),o=xt();if(n>o){alert("Cannot hire beyond property capacity ("+o.toLocaleString()+"). You need more workplaces.");return}const s=e>0?`Confirm workforce changes?

Hiring fee: `+v(e)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(s)){Bt=!0;try{const a={};for(const r of Le){const c=Number(m?.[r.factionKey]??0);a[r.factionKey]=Math.max(0,c+Q[r.id])}e>0&&(a.corp_cash_reserves=Math.max(0,t-Math.round(e)));const{error:l}=await _.from("factions").update(a).eq("id",m.id);if(l)throw l;Object.assign(m,a),Q={general:0,skilled:0,innovative:0};const d=document.getElementById("topbar-cash");if(d){const r=Number(m.corp_cash_reserves??0);d.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")}bt()}catch(a){alert("Error: "+a.message)}finally{Bt=!1}}}function bt(){const i=document.getElementById("hf-card-container");if(!i)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=Number(w?.minimum_wage??50),o=Number(w?.inflation??50),s=Number(w?.standard_of_living??50),a=n/100*48e3,l=(1+(o-50)/100*.5).toFixed(2),d=(1+(s-50)/100*.5).toFixed(2),r=w?.name||m?.nation||"Nation",c=Object.values(Q).some(h=>h!==0),p=xt();let f=0,u=0,y=0,g=0,$="";for(const h of Le){const A=Number(m?.[h.factionKey]??0),C=Q[h.id],E=A+C,x=Ui(h.multiplier),T=C>0,M=A*x,N=E*x,B=N-M;f+=A,u+=E,y+=M,g+=N;const z=C!==0?T?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";$+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${t.border};background:${z};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${h.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${h.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${t.text}">${A.toLocaleString()}</span>
                    ${C!==0?`<span style="font-family:${e};font-size:10px;color:${t.dim}">→</span>
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${T?t.greenBright:t.red}">${E.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${h.multiplier}.0 × ${l} × ${d})</span>
                <span style="font-family:${e};font-size:10px;color:${h.color}">${v(x)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${h.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.red};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-50</div>
                <div onclick="hfSetChange('${h.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.redDim};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${C!==0?t.card:"transparent"};border:1px solid ${C!==0?t.border:"transparent"}">
                    ${C!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${e};font-size:12px;font-weight:700;color:${T?t.greenBright:t.red}">${T?"+":""}${C}</span>
                        <span onclick="hfReset('${h.id}')" style="font-family:${e};font-size:8px;color:${t.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${e};font-size:9px;color:${t.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${h.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+10</div>
                <div onclick="hfSetChange('${h.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+50</div>
            </div>
            ${C!==0?`<div style="margin-top:6px;padding:4px 8px;background:${t.bg};border:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${B>0?t.red:t.greenBright}">${B>0?"+":""}${v(B)}/yr</span>
            </div>`:""}
        </div>`}const k=g-y;i.innerHTML=`
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
            ${$}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;${c?"margin-bottom:6px;":""}">
                <div>
                    <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">WORKFORCE / CAPACITY</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <span style="font-family:${e};font-size:13px;font-weight:700;color:${f>=p?t.red:t.text}">${c?u.toLocaleString():f.toLocaleString()}</span>
                        <span style="font-family:${e};font-size:9px;color:${t.dim}">/ ${p.toLocaleString()}</span>
                    </div>
                    ${f>=p&&!c?`<div style="font-family:${e};font-size:7px;color:${t.red};margin-top:2px;">Need workplaces to hire new employees.</div>`:""}
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${v(y)}</span>
                        ${c?`<span style="font-family:${e};font-size:9px;color:${t.dim}">→</span>
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${k>0?t.red:t.greenBright}">${v(g)}</span>`:""}
                    </div>
                </div>
            </div>
            ${c?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${t.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">NET CHANGE</span>
                    <span style="font-family:${e};font-size:11px;font-weight:700;color:${k>0?t.red:t.greenBright}">${k>0?"+":""}${v(k)}/yr</span>
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">(${k>0?"+":""}${v(Math.round(k/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${t.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}function so(){const i=document.getElementById("wf-summary-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},n=(w?.name||m?.nation||"Nation").toUpperCase(),o=Number(w?.minimum_wage??50),s=Number(w?.inflation??50),a=Number(w?.standard_of_living??50),l=o/100*48e3,d=1+(s-50)/100*.5,r=1+(a-50)/100*.5,c=[{label:"General Workforce",mult:2,color:t.accent,key:"corp_general_workforce",countColor:t.text},{label:"Skilled Workforce",mult:3,color:t.gold,key:"corp_skilled_workforce",countColor:t.blue},{label:"Innovative Workforce",mult:6,color:t.orange,key:"corp_innovative_workforce",countColor:t.gold}];let p=0,f=0,u="";for(const y of c){const g=Number(m?.[y.key]??0),$=Math.round(l*y.mult*d*r),k=g*$;p+=g,f+=k,u+=`
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
                <span style="font-family:${e};font-size:10px;color:${t.muted}">${v($)}/yr</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">TOTAL ANNUAL COST</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${v(k)}</span>
            </div>
        </div>`}i.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Workforce</span>
            </div>
            <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.text}">${p.toLocaleString()}</span>
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
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.text}">${p.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL ANNUAL WAGES</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${v(f)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">PER TICK (÷12)</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${v(Math.round(f/12))}</span>
            </div>
        </div>
    </div>`}let W=[];async function nt(){if(!m?.id)return;const{data:i}=await _.from("corp_properties").select("*").eq("faction_id",m.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});W=i||[]}function $t(){const i=document.getElementById("property-card-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=(w?.name||m?.nation||"Nation").toUpperCase(),o=1+(Number(w?.inflation??50)-50)/100*.3;let s="",a=0,l=0;const d=w?.name||m?.nation||"Home Nation",r=5e7,c=1+(Number(w?.inflation??50)-50)/100*.3,p=.8+Number(w?.stability??50)/100*.4,f=Math.round(r*c*p),u=Math.round(f*.005);a+=f,l+=u,s+=`
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
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${v(f)}</div>
            </div>
            <div style="flex:1;padding:3px 6px">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${v(u)}</div>
            </div>
        </div>
    </div>`;for(const y of W){const g=ft[y.style]||ft.Basic;a+=Number(y.purchase_price||0),l+=Number(y.monthly_maintenance||0),s+=`
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
            <span style="font-family:${e};font-size:10px;color:${t.muted}">${W.length+1} ASSET${W.length+1!==1?"S":""}</span>
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
    </div>`}let Ge=[],Z=null;const ft={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function ci(){if(!m?.nation_id)return;const{data:i,error:e}=await _.from("available_properties").select("*").eq("nation_id",m.nation_id).eq("status","available").order("price",{ascending:!0});if(e){console.warn("[Property] Failed to load marketplace:",e.message);return}Ge=(i||[]).map(t=>({...t,adjusted_cost:t.price,adjusted_maintenance:t.monthly_maintenance}))}function _t(){const i=document.getElementById("new-property-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"};(w?.name||m?.nation||"Nation").toUpperCase();const n=Number(w?.standard_of_living??50),o=Number(w?.gdp_growth??50),s=Number(w?.inflation??50),a=w?.capital||"Capital",l={capital:a,port:a+" Port",industrial:a+" Industrial Zone",suburban:a+" Suburbs",coastal:a+" Coast"};let d="";if(Ge.length===0)d=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let r=0;r<Ge.length;r++){const c=Ge[r],p=Z===r,f=ft[c.style]||ft.Basic,u=l[c.city_template]||a;d+=`
            <div onclick="npSelect(${r})" style="padding:8px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${p?t.accent:"transparent"};background:${p?"rgba(139,154,107,0.03)":"transparent"};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <span style="font-size:11px;font-weight:600;color:${t.text}">${c.name}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${f.color};background:${f.color}12;border:1px solid ${f.color}25">${f.label}</span>
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
                ${p?`<div style="margin-top:5px;">
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
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${Ge.length} AVAILABLE</span>
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
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${Z!==null?"#000":t.dim};background:${Z!==null?t.accent:"transparent"};border:1px solid ${Z!==null?t.accent:t.border};cursor:${Z!==null?"pointer":"default"};opacity:${Z!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function ro(i){Z=Z===i?null:i,_t()}let Rt=!1;async function lo(){if(Z===null||Rt)return;const i=Ge[Z];if(!i)return;const e=Number(m?.corp_cash_reserves??0);if(i.adjusted_cost>e){alert(`Insufficient cash reserves.
Property: `+v(i.adjusted_cost)+`
Cash: `+v(e));return}if(confirm('Buy "'+i.name+'" for '+v(i.adjusted_cost)+`?

Monthly maintenance: `+v(i.adjusted_maintenance)+`/mo
Condition: `+i.condition+`%

This will be deducted from your cash reserves.`)){Rt=!0;try{const{error:t}=await _.from("corp_properties").insert({faction_id:m.id,nation_id:m.nation_id,catalog_id:i.catalog_id||null,name:i.name,type:i.type,style:i.style,capacity:i.capacity,purchase_price:i.adjusted_cost,monthly_maintenance:i.adjusted_maintenance,condition:i.condition,city:i.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(t)throw t;const n=Math.max(0,e-i.adjusted_cost),{error:o}=await _.from("factions").update({corp_cash_reserves:n}).eq("id",m.id);if(o)throw o;m.corp_cash_reserves=n,i.id&&await _.from("available_properties").update({status:"sold",purchased_by:m.id}).eq("id",i.id);const s=document.getElementById("topbar-cash");s&&(s.textContent="CASH: "+(n>=1e6?"$"+(n/1e6).toFixed(1)+"M":"$"+Math.round(n/1e3)+"k")),Z=null,await ci(),_t(),$t(),alert("Property purchased: "+i.name+`

Deducted: `+v(i.adjusted_cost))}catch(t){alert("Purchase failed: "+t.message)}finally{Rt=!1}}}const Ie={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let pi=!1,S={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},Pt=!1;function Fi(){const e=1+(Number(w?.inflation??50)-50)/100*.3,t=Ie[S.style]?.costMod||1,n=S.type==="Warehouse"?.75:1,o=Math.round(S.size*1e5*e*t*n),s=Math.round(o*(1+S.budgetMod/100)),a=Math.round(s*.007*(Ie[S.style]?.maintMod||1));return{baseBudget:o,adjusted:s,maint:a,inflMod:e,styleMod:t}}function co(){pi=!0,S={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0},Vi()}function fi(){pi=!1,document.getElementById("cp-modal-overlay")?.remove()}function po(i,e){S[i]=e,Vi()}async function fo(){if(!(Pt||!S.name.trim())){Pt=!0;try{const i=Fi(),e=w?.name||m?.nation||"Unknown",t=Ie[S.style]?.repGain||1,n=await _.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),o=n.data?.current_tick||0,s=(n.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:a}=await _.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",m.nation_id).eq("issuer_type","PRIVATE"),d=`PVT-C${(a||0)+1}-${s}`,{error:r}=await _.from("construction_contracts").insert({nation_id:m.nation_id,template_key:"custom_building",sector:"civil_engineering",name:S.name.trim(),description:`${S.type} (${S.style}) — ${S.size.toLocaleString()} employees, commissioned by ${m.faction_name}`,project_code:d,budget_ceiling:i.adjusted,timeline_ticks:S.timeline,required_materials:(()=>{const c=S.size/1e3,p=S.style,f={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[p]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},u=(y,g)=>Math.max(1,Math.ceil(c*y*g));return{concrete:u(8,f.concrete),steel:u(6,f.steel),glass_facades:u(3,f.glass),em_systems:u(4,f.em),lumber:u(1,f.lumber),heavy_parts:u(2,f.heavy),aggregate:u(3,f.agg)}})(),required_equipment:(()=>{const c=["work_trucks","concrete_mixers"];return S.size>1e3&&c.push("excavators","tower_cranes"),S.size>3e3&&c.push("bulldozers","heavy_haulers"),S.size>8e3&&c.push("pile_drivers"),c})(),required_workforce:{general:Math.ceil(S.size*.08),skilled:Math.ceil(S.size*.03)},status:"open",generated_at_tick:o,bidding_ends_tick:o+3,issuer_type:"PRIVATE",issuer_name:m.faction_name,issuer_faction_id:m.id});if(r)throw r;fi(),alert(`Construction project submitted!

Project: `+S.name.trim()+`
Code: `+d+`
Budget: `+v(i.adjusted)+`
Expected Reputation: +`+t+`

All construction corporations in `+e+" can now bid on this project.")}catch(i){alert("Failed to submit project: "+i.message)}finally{Pt=!1}}}function Vi(){if(document.getElementById("cp-modal-overlay")?.remove(),!pi)return;const i="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=Fi(),n=w?.name||m?.nation||"Nation",o=Ie[S.style]?.repGain||1,s=o>=4?e.gold:o>=3?e.greenBright:o>=2?e.accent:e.dim,a=Object.entries(Ie).map(([r,c])=>{const p=S.style===r;return`<div onclick="cpSetField('style','${r}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${p?c.color+"18":"transparent"};border:1px solid ${p?c.color+"44":e.border};">
            <div style="font-family:${i};font-size:9px;font-weight:700;color:${p?c.color:e.dim}">${r}</div>
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
                    ${["Regional HQ","Office Building",...m?.corp_sector==="Construction"?["Warehouse"]:[]].map(r=>`<span onclick="cpSetField('type','${r}')" style="flex:1;text-align:center;padding:5px 0;font-family:${i};font-size:9px;font-weight:700;cursor:pointer;color:${S.type===r?"#000":e.dim};background:${S.type===r?r==="Warehouse"?e.orange:e.accent:"transparent"};border:1px solid ${S.type===r?r==="Warehouse"?e.orange:e.accent:e.border}">${r}</span>`).join("")}
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
                <div style="margin-top:4px;font-family:${i};font-size:8px;color:${Ie[S.style].color}">${Ie[S.style].desc}</div>
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
    </div>`,document.body.appendChild(l);const d=document.getElementById("cp-name-input");d&&d.addEventListener("input",r=>{S.name=r.target.value}),l.addEventListener("click",r=>{r.target===l&&fi()})}function mo(){const i=document.getElementById("cp-name-input");if(i&&(S.name=i.value),!S.name.trim()){alert("Please enter a building name.");return}fo()}window.cpClose=fi;window.cpSetField=po;window.cpSubmitFromModal=mo;window.npSelect=ro;window.npBuyProperty=lo;window.npOpenConstructionModal=co;let Ve=!1;async function uo(i){if(Ve)return;const e=W.find(l=>l.id===i);if(!e)return;const t=1+(Number(w?.inflation??50)-50)/100*.3,n=Math.round((e.purchase_price||0)*.1*t),o=Number(m?.corp_cash_reserves??0);if(n>o){alert("Insufficient cash. Refurbishment costs "+v(n)+" (inflation-adjusted), you have "+v(o));return}if(e.condition>=95){alert("Property is already in excellent condition ("+e.condition+"%).");return}const s=5+Math.floor(Math.random()*21),a=Math.min(100,e.condition+s);if(confirm('Refurbish "'+e.name+`"?

Cost: `+v(n)+`
Expected improvement: +`+s+"% condition ("+e.condition+"% → "+a+"%)")){Ve=!0;try{await _.from("corp_properties").update({condition:a}).eq("id",i);const l=Math.max(0,o-n);await _.from("factions").update({corp_cash_reserves:l}).eq("id",m.id),m.corp_cash_reserves=l;const d=document.getElementById("topbar-cash");d&&(d.textContent="CASH: "+(l>=1e6?"$"+(l/1e6).toFixed(1)+"M":"$"+Math.round(l/1e3)+"k")),await nt(),$t(),alert("Refurbished! Condition: "+e.condition+"% → "+a+"%")}catch(l){alert("Refurbishment failed: "+l.message)}finally{Ve=!1}}}async function yo(i){if(Ve)return;const e=W.find(s=>s.id===i);if(!e)return;const t=1+(Number(w?.inflation??50)-50)/100*.3,n=(e.condition||50)/100,o=Math.round((e.purchase_price||0)*.6*n*t);if(confirm('Sell "'+e.name+`"?

Sale value: `+v(o)+" (60% × "+e.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){Ve=!0;try{await _.from("corp_properties").update({is_active:!1}).eq("id",i);const a=Number(m?.corp_cash_reserves??0)+o;await _.from("factions").update({corp_cash_reserves:a}).eq("id",m.id),m.corp_cash_reserves=a;const d=(await _.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await _.from("available_properties").insert({nation_id:m.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,price:Math.round(o*1.1),monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,generated_at_tick:d,expires_at_tick:d+6,status:"available"});const r=document.getElementById("topbar-cash");r&&(r.textContent="CASH: "+(a>=1e6?"$"+(a/1e6).toFixed(1)+"M":"$"+Math.round(a/1e3)+"k")),await nt(),$t(),await ci(),_t(),alert('Sold "'+e.name+'" for '+v(o))}catch(s){alert("Sale failed: "+s.message)}finally{Ve=!1}}}window.propRefurbish=uo;window.propSell=yo;const Ee={SALE:.8,DISSOLVE:.6,REVENUE_BASE:.02,GDP_NEUTRAL:30,DEFAULT_REPUTATION:25};function go(i){if(!i)return 0;const e=i.trim().replace(/[$,]/g,""),t=e.match(/^([\d.]+)\s*[Mm]$/),n=e.match(/^([\d.]+)\s*[Kk]$/);return Math.round(t?parseFloat(t[1])*1e6:n?parseFloat(n[1])*1e3:parseFloat(e))}function Qe(i){const e=document.getElementById("topbar-cash");e&&(e.textContent="CASH: "+(i>=1e6?"$"+(i/1e6).toFixed(1)+"M":"$"+Math.round(i/1e3)+"k"))}function vo(i){return Ke.find(e=>e.id===i)?.name||"—"}function mi(i){return W.filter(e=>e.nation_id===i)}async function ui(){We=0,await nt(),$t(),ht(),wt()}let de=!1,We=0,rt={};async function xo(){if(m?.id)try{const{data:i}=await _.from("construction_contracts").select("nation_id").eq("awarded_to_faction",m.id).in("status",["in_progress","awarded"]);rt={};for(const e of i||[])e.nation_id&&(rt[e.nation_id]=(rt[e.nation_id]||0)+1)}catch{}}function Yi(i){const e=mi(i.nation_id),t=e.reduce((y,g)=>y+Number(g.purchase_price||0),0),n=e.reduce((y,g)=>y+Number(g.capacity||0),0),o=rt[i.nation_id]||0,s=Ke.find(y=>y.id===i.nation_id),a=(i.name||"").trim().split(/\s+/),l=a.length>=2?a.map(y=>y[0]).join("").toUpperCase().slice(0,4):(i.name||"SUB").slice(0,4).toUpperCase(),d=Number(i.sub_cash||0),r=Number(s?.gdp_growth??50),c=d*Ee.REVENUE_BASE,p=(r-Ee.GDP_NEUTRAL)/100,f=Ee.DEFAULT_REPUTATION/100,u=d>0?Math.round(c*(1+p)*f):0;return{id:i.id,name:i.name,abbr:l,nation:s?.name||i.city||"—",nationId:i.nation_id,sector:m?.corp_sector||"General",subsector:i.subsector||m?.corp_subsector||"—",revenue:u,debt:0,cash:d,reputation:Ee.DEFAULT_REPUTATION,valuation:t,workforce:n,projects:o,established:i.created_at?new Date(i.created_at).getFullYear().toString():"—",trend:r>=40&&d>0?"up":r>=Ee.GDP_NEUTRAL&&d>0?"flat":"down",profitable:u>0}}function ht(){const i=document.getElementById("manage-subsidiaries-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},o=W.filter(c=>c.type==="regional_hq").map(Yi);We>=o.length&&(We=0);const s=o[We]||null;let a="";o.length===0&&(a=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No subsidiaries established.<br>Use Create Subsidiary to expand.</div>`);let l=0,d=0;for(let c=0;c<o.length;c++){const p=o[c],f=c===We;l+=p.revenue,d+=p.valuation;const u=p.trend==="up"?t.greenBright:p.trend==="down"?t.red:t.dim,y=p.trend==="up"?"▲":p.trend==="down"?"▼":"–";a+=`
        <div onclick="selectSubsidiary(${c})" style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${f?t.accent:"transparent"};background:${f?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:40px;font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${p.abbr}</span>
            <div style="flex:1.5;">
                <div style="font-size:11px;font-weight:600;color:${t.text};line-height:1.2">${p.name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${p.subsector}</div>
            </div>
            <span style="width:65px"><span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${p.nation.toUpperCase().slice(0,8)}</span></span>
            <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${p.profitable?t.greenBright:t.redDim};text-align:right">${v(p.revenue)}</span>
            <span style="width:40px;font-family:${e};font-size:9px;font-weight:700;color:${p.reputation>=40?t.accent:p.reputation>=25?t.yellow:t.orange};text-align:right">${p.reputation}</span>
            <span style="width:55px;font-family:${e};font-size:9px;color:${t.muted};text-align:right">${v(p.valuation)}</span>
            <span style="width:12px;font-family:${e};font-size:8px;color:${u};text-align:right">${y}</span>
        </div>`}let r="";if(s){const c=s.trend==="up"?t.greenBright:s.trend==="down"?t.red:t.dim,p=s.trend==="up"?"▲":s.trend==="down"?"▼":"–",f=s.trend==="up"?"Growing":s.trend==="down"?"Declining":"Stable",u=s.reputation>=40?t.accent:s.reputation>=25?t.yellow:t.orange,y=[{label:"Revenue",value:v(s.revenue),color:s.profitable?t.greenBright:t.redDim},{label:"Cash",value:v(s.cash),color:t.text},{label:"Debt",value:s.debt>0?v(s.debt):"$0",color:s.debt>0?t.orange:t.dim},{label:"Reputation",value:s.reputation+"/100",color:u},{label:"Market Valuation",value:v(s.valuation),color:t.gold},{label:"Workforce",value:s.workforce.toLocaleString(),color:t.text},{label:"Active Projects",value:s.projects.toString(),color:s.projects>0?t.text:t.dim}],g=s.projects===0;r=`
            <div style="padding:8px 14px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                    <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.gold}">${s.abbr}</span>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${s.name}</span>
                </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${s.nation.toUpperCase()}</span>
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">Est. ${s.established}</span>
                    <span style="font-family:${e};font-size:8px;color:${c}">${p} ${f}</span>
                </div>
            </div>
            ${y.map($=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 14px;border-bottom:1px solid ${t.border};">
                <span style="font-family:${e};font-size:9px;color:${t.dim};letter-spacing:0.5px;text-transform:uppercase">${$.label}</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;color:${$.color}">${$.value}</span>
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
    </div>`}async function Qi(i,e){if(de)return;const t=W.find(u=>u.id===i);if(!t)return;const n=e==="sell",o=n?Ee.SALE:Ee.DISSOLVE,s=n?"SELL":"DISSOLVE",a=n?"sold":"dissolved",l=n?"80%":"60%",d=vo(t.nation_id),r=mi(t.nation_id),c=r.reduce((u,y)=>u+Math.round((y.purchase_price||0)*o*(y.condition||50)/100),0),p=Number(t.sub_cash||0),f=c+p;if(confirm(s+' subsidiary "'+t.name+`"?

`+r.length+" properties at "+l+` × condition:
  Property value: `+v(c)+`
  Subsidiary cash: `+v(p)+`
  ─────────────────
  Total return: `+v(f)+`

All operations in `+d+` cease.
This cannot be undone.`)){de=!0;try{const u=r.map(g=>g.id);if(u.length===1){const{error:g}=await _.from("corp_properties").update({is_active:!1}).eq("id",u[0]);if(g)throw g}else if(u.length>1){const{error:g}=await _.from("corp_properties").update({is_active:!1}).in("id",u);if(g)throw g}await _.from("corp_properties").update({sub_cash:0}).eq("id",i).then(()=>{}).catch(()=>{});const y=Number(m?.corp_cash_reserves??0)+f;await _.from("factions").update({corp_cash_reserves:y}).eq("id",m.id),m.corp_cash_reserves=y,Qe(y),await ui(),alert("Subsidiary "+a+". "+r.length+` properties liquidated.
Total received: `+v(f))}catch(u){alert("Failed: "+u.message)}finally{de=!1}}}function bo(i){Qi(i,"sell")}function $o(i){Qi(i,"dissolve")}async function Ki(i,e){if(de)return;const t=W.find(p=>p.id===i);if(!t)return;const n=Number(m?.corp_cash_reserves??0),o=Number(t.sub_cash||0),s=e?"WITHDRAW":"INJECT CAPITAL";if(e&&o<=0){alert("This subsidiary has no cash to withdraw.");return}const a=e?o:n,l=prompt(s+(e?" from ":" into ")+t.name+`

Parent cash: `+v(n)+`
Subsidiary cash: `+v(o)+`

Enter amount (e.g., 5000000 or 5M):`);if(!l)return;const d=go(l);if(!d||d<=0||isNaN(d)){alert("Invalid amount.");return}if(d>a){alert("Insufficient "+(e?"subsidiary":"parent")+" cash. Available: "+v(a));return}const r=e?n+d:n-d,c=e?o-d:o+d;if(confirm(s+" "+v(d)+(e?" from ":" into ")+t.name+`?

Parent: `+v(n)+" → "+v(r)+`
Subsidiary: `+v(o)+" → "+v(c))){de=!0;try{await Promise.all([_.from("factions").update({corp_cash_reserves:r}).eq("id",m.id),_.from("corp_properties").update({sub_cash:c}).eq("id",i)]),m.corp_cash_reserves=r,t.sub_cash=c,Qe(r),ht(),alert((e?"Withdrew ":"Injected ")+v(d)+(e?" from ":" into ")+t.name+".")}catch(p){alert("Failed: "+p.message)}finally{de=!1}}}function _o(i){Ki(i,!1)}function ho(i){Ki(i,!0)}async function wo(i){if(de)return;const e=W.find(g=>g.id===i);if(!e)return;const t=Yi(e);t.nation;const n=mi(e.nation_id),o=t.valuation,s=t.cash,a=t.reputation,l=t.subsector,d=Math.round(o*2.25),r=Math.round(a*.1),c=Math.round(a*.2),p=xt(),f=Le.reduce((g,$)=>g+Number(m?.[$.factionKey]??0),0),u=Math.max(0,p-f),y=Number(m?.corp_cash_reserves??0);if(d>y){alert(`Insufficient cash to acquire subsidiary.

Acquisition cost (2.25× valuation): `+v(d)+`
Available cash: `+v(y));return}if(t.projects>0){alert("Cannot merge — subsidiary has "+t.projects+" active project(s). Complete or abandon them first.");return}if(confirm('MERGE "'+e.name+`" INTO YOUR CORPORATION

Acquisition cost (2.25× valuation): `+v(d)+`
Subsidiary cash absorbed: `+v(s)+`
Net cost: `+v(d-s)+`

• `+n.length+` properties transferred to parent
• Subsidiary subsector "`+l+`" added to portfolio
• Workers hired to max capacity (+`+u.toLocaleString()+`)
• Reputation: +`+r+" or -"+c+" (from sub rep "+a+`)

This cannot be undone.`)){de=!0;try{const g=m.nation_id;if(n.length>0){const T=n.filter(N=>N.id!==e.id).map(N=>N.id);if(T.length===1){const{error:N}=await _.from("corp_properties").update({nation_id:g,type:"office"}).eq("id",T[0]);if(N)throw N}else if(T.length>1){const{error:N}=await _.from("corp_properties").update({nation_id:g,type:"office"}).in("id",T);if(N)throw N}const{error:M}=await _.from("corp_properties").update({nation_id:g,type:"office",sub_cash:0,subsector:null}).eq("id",e.id);if(M)throw M}const $=y-d+s,h=Number(m?.corp_general_workforce??0)+u,A=Math.random()>=.5?r:-c,C=Number(m?.standing??50),E=Math.max(0,Math.min(100,C+A)),{error:x}=await _.from("factions").update({corp_cash_reserves:$,corp_general_workforce:h,standing:E}).eq("id",m.id);if(x)throw x;m.corp_cash_reserves=$,m.corp_general_workforce=h,m.standing=E,Qe($),await ui(),alert(`Merger complete!

"`+e.name+`" absorbed into your corporation.
Cost: `+v(d)+" | Cash absorbed: "+v(s)+`
Reputation `+(A>=0?"+":"")+A+" (now "+E+`)
Workers hired: +`+u.toLocaleString()+` general workforce
Properties: `+n.length+" transferred to parent")}catch(g){alert("Merge failed: "+g.message)}finally{de=!1}}}window.subDissolve=$o;window.subInjectCapital=_o;window.subWithdraw=ho;window.subMerge=wo;window.subSell=bo;window.selectSubsidiary=function(i){We=i,ht()};let Ke=[],Xe={},oe=null,Ot=!1,Re="",et="",Pe="";const ko={Construction:[{id:"civil",name:"Civil Engineering",mod:0},{id:"industrial",name:"Industrial Construction",mod:.25},{id:"mega",name:"Megaprojects",mod:.4}],Finance:[{id:"banking",name:"Banking",mod:0},{id:"insurance",name:"Insurance",mod:.15},{id:"investment",name:"Investment Management",mod:.3}],Technology:[{id:"software",name:"Software Development",mod:0},{id:"hardware",name:"Hardware Manufacturing",mod:.2},{id:"telecom",name:"Telecommunications",mod:.35}],Energy:[{id:"oil_gas",name:"Oil & Gas",mod:0},{id:"renewables",name:"Renewables",mod:.2},{id:"mining",name:"Mining",mod:.3}],Healthcare:[{id:"pharma",name:"Pharmaceuticals",mod:0},{id:"hospitals",name:"Hospital Systems",mod:.2},{id:"biotech",name:"Biotechnology",mod:.35}]};async function Eo(){const{data:i,error:e}=await _.from("nations").select("*").order("name");e&&console.warn("[Subsidiary] Failed to load nations:",e.message),Ke=(i||[]).filter(n=>n.id!==m?.nation_id);const{data:t}=await _.from("factions").select("nation_id").eq("faction_type","corporation").is("abandoned_at",null);Xe={};for(const n of t||[])n.nation_id&&(Xe[n.nation_id]=(Xe[n.nation_id]||0)+1);Pe=m?.corp_subsector||""}function Ji(){const i=m?.corp_sector||"";return ko[i]||[{id:"general",name:i||"General",mod:0}]}function To(){const e=Ji().find(t=>t.name===Pe);return e?e.mod:0}function Zt(i){const e=Number(i.standard_of_living??50);return Math.max(.5,Math.round(e/50*100)/100)}function Xi(i){const t=1+To(),n=Zt(i);return Math.round(Math.max(1e7,5e7*t*n))}function Co(i){const e=Xe[i]||0;return e<=1?{label:"HIGH",color:"#5c5"}:e<=3?{label:"MODERATE",color:"#ca5"}:{label:"LOW",color:"#c55"}}function So(i){if(oe=oe===i?null:i,oe){const e=Ke.find(t=>t.id===oe);Re=(m?.faction_name||"Subsidiary")+" "+(e?.name||"")}else Re="";wt()}function Io(i){Pe=i,wt()}function Mo(i){Re=i}function Ao(i){et=i.toUpperCase().slice(0,4)}async function zo(){if(Ot||!oe)return;const i=Ke.find(a=>a.id===oe);if(!i)return;const e=(Re||"").trim(),t=(et||"").trim();if(!e){alert("Please enter a corporation name for the subsidiary.");return}if(t.length<2){alert("Please enter an abbreviation (2-4 chars).");return}if(W.find(a=>a.nation_id===i.id&&a.type==="regional_hq")){alert("You already have a subsidiary in "+i.name);return}const o=Xi(i),s=Number(m?.corp_cash_reserves??0);if(o>s){alert("Insufficient cash. Entry cost: "+v(o)+", available: "+v(s));return}if(confirm("Establish subsidiary in "+i.name+`?

Name: `+e+" ("+t+`)
Subsector: `+(Pe||"General")+`
Entry cost: `+v(o)+`
Creates a Regional HQ (500 capacity)
Unlocks `+i.name+` for operations

Deducted from cash reserves.`)){Ot=!0;try{const l=(await _.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0,d=85+Math.floor(Math.random()*16),r=Math.round(o*.005),{error:c}=await _.from("corp_properties").insert({faction_id:m.id,nation_id:i.id,name:e,type:"regional_hq",style:"Modern",capacity:500,purchase_price:o,monthly_maintenance:r,condition:d,city:i.capital||i.name,purchased_at_tick:l,is_active:!0,subsector:Pe||m?.corp_subsector||null});if(c)throw c;const p=Math.max(0,s-o);await _.from("factions").update({corp_cash_reserves:p}).eq("id",m.id),m.corp_cash_reserves=p,Qe(p),oe=null,Re="",et="",await ui(),alert('Subsidiary "'+e+'" established in '+i.name+`!

Cost: `+v(o)+`
Regional HQ created with `+d+"% condition.")}catch(a){alert("Failed: "+a.message)}finally{Ot=!1}}}function wt(){const i=document.getElementById("create-subsidiary-container");if(!i)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=m?.corp_sector||"General",o=m?.corp_subsector||"",s=Ji(),a=s.find(x=>x.name===Pe)||s[0],l=new Set(W.filter(x=>x.type==="regional_hq").map(x=>x.nation_id)),d=Ke.filter(x=>!l.has(x.id)),r=oe?d.find(x=>x.id===oe):null,c=Re.trim().length>0&&et.trim().length>=2&&r!==null;let p=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Sector</div>
        <div style="padding:4px 10px;background:${t.card};border:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;">
            <span style="font-family:${e};font-size:10px;font-weight:700;color:${t.accent}">${n}</span>
            <span style="font-family:${e};font-size:8px;color:${t.dim}">LOCKED TO PARENT</span>
        </div>
    </div>`,f=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsector</div>
        <div style="display:flex;gap:3px;">
            ${s.map(x=>{const T=x.name===Pe,M=x.name===o;return`<div onclick="subSetSubsector('${x.name.replace(/'/g,"\\'")}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${T?t.accent+"18":"transparent"};border:1px solid ${T?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:8px;font-weight:700;color:${T?t.accentBright:t.dim}">${x.name}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${M?t.greenBright:x.mod>0?t.orange:t.dim}">${M?"SAME — ±0%":x.mod>0?"+"+Math.round(x.mod*100)+"%":"±0%"}</div>
                </div>`}).join("")}
        </div>
    </div>`,u="";if(d.length===0)u=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Subsidiaries in all available nations.</div>`;else for(const x of d){const T=x.id===oe,M=Co(x.id),N=Xe[x.id]||0,B=Math.round(Number(x.standard_of_living??50)),z=Zt(x);u+=`
            <div onclick="subSelectNation('${x.id}')" style="display:flex;align-items:center;padding:4px 8px;margin-bottom:2px;cursor:pointer;background:${T?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${T?t.accent+"44":t.border};border-left:${T?"2px solid "+t.accent:"2px solid transparent"};">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:11px;font-weight:600;color:${T?t.text:t.muted}">${x.name}</span>
                        <span style="font-family:${e};font-size:7px;font-weight:700;padding:0 4px;color:${M.color};background:${M.color}12;border:1px solid ${M.color}25;line-height:12px">${M.label}</span>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:2px;">
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">STD/LIVING: <span style="color:${t.muted}">${B}</span></span>
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">CORPS: <span style="color:${N>=4?t.red:N>=2?t.yellow:t.greenBright}">${N}</span></span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${z>1?t.orange:t.greenBright}">×${z.toFixed(2)}</div>
                </div>
            </div>`}let y=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="margin-bottom:6px;">
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Corporation Name</div>
            <input type="text" value="${(Re||"").replace(/"/g,"&quot;")}" oninput="subSetName(this.value)" placeholder="e.g., ${(m?.faction_name||"Corp")+" "+(r?.name||"International")}" style="width:100%;padding:5px 8px;font-family:${e};font-size:10px;color:${t.text};background:${t.card};border:1px solid ${t.border};outline:none;box-sizing:border-box;" />
        </div>
        <div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Abbreviation (2-4 chars)</div>
            <input type="text" value="${(et||"").replace(/"/g,"&quot;")}" oninput="subSetAbbr(this.value)" placeholder="${(m?.faction_name||"CORP").slice(0,2).toUpperCase()+(r?.name||"XX").slice(0,2).toUpperCase()}" maxlength="4" style="width:80px;padding:5px 8px;font-family:${e};font-size:12px;font-weight:700;color:${t.gold};background:${t.card};border:1px solid ${t.border};outline:none;text-align:center;letter-spacing:2px;" />
        </div>
    </div>`;const g=[{rule:"Bid on projects in that nation",icon:"✓",color:t.greenBright},{rule:"Hires local workers at nation rates",icon:"✓",color:t.greenBright},{rule:"Must use parent's materials & vehicles",icon:"!",color:t.orange},{rule:"Reputation gain: 75% sub / 25% parent",icon:"◐",color:t.gold},{rule:"Market revenue at 50% parent rate",icon:"◐",color:t.gold},{rule:"Counts as domestic corporation",icon:"✓",color:t.greenBright},{rule:"Starting reputation: 25",icon:"●",color:t.muted}];let $=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsidiary Rules</div>
        <div style="background:${t.card};border:1px solid ${t.border};padding:6px 8px;">
            ${g.map((x,T)=>`<div style="display:flex;align-items:center;gap:6px;padding:2px 0;${T<g.length-1?"border-bottom:1px solid "+t.border:""}">
                <span style="font-family:${e};font-size:9px;color:${x.color};width:12px;text-align:center">${x.icon}</span>
                <span style="font-size:9px;color:${t.muted}">${x.rule}</span>
            </div>`).join("")}
        </div>
    </div>`;const k=5e7,h=a.mod,A=r?Zt(r):null,C=r?Xi(r):null;let E=`
    <div style="background:${t.bg};border:1px solid ${t.border};padding:6px 8px;margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">BASE</span>
            <span style="font-family:${e};font-size:9px;color:${t.muted}">${v(k)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">SUBSECTOR (${a.name})</span>
            <span style="font-family:${e};font-size:9px;color:${h===0?t.greenBright:t.orange}">${h===0?"±0%":"+"+Math.round(h*100)+"%"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">NATION (${r?r.name:"—"})</span>
            <span style="font-family:${e};font-size:9px;color:${r?A>1?t.orange:t.greenBright:t.dim}">${r?"×"+A.toFixed(2):"—"}</span>
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
            ${p}
            ${f}
            <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
                <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Nation</div>
                ${u}
            </div>
            ${y}
            ${$}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            ${E}
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
    </div>`}window.subSelectNation=So;window.subCreate=zo;window.subSetName=Mo;window.subSetAbbr=Ao;window.subSetSubsector=Io;let lt=[],Me=0,se="ALL",ke="REPUTATION";async function qo(){const{data:i}=await _.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name");lt=(i||[]).map(e=>({...e,abbr:e.corp_ticker||e.abbreviation||e.faction_name?.slice(0,4).toUpperCase()||"???",status:(e.corp_company_type||"Private").toUpperCase(),isPlayer:!!e.linked_user_id,reputation:50,revenue:e.status==="PUBLIC"?Number(e.corp_cash_reserves||0)*.1:null,valuation:e.status==="PUBLIC"?Number(e.corp_cash_reserves||0)*3:null}))}function No(i){Me=i,kt()}function Lo(i){se=i,Me=0,kt()}function Bo(i){ke=i,Me=0,kt()}function kt(){const i=document.getElementById("corporations-container");if(!i)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n={PUBLIC:{color:t.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:t.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:t.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},o=[...new Set(lt.map(f=>f.nation).filter(Boolean))];let s=[...lt];se!=="ALL"&&(s=s.filter(f=>f.nation===se)),ke==="REPUTATION"?s.sort((f,u)=>(u.reputation||0)-(f.reputation||0)):ke==="REVENUE"?s.sort((f,u)=>(u.revenue||0)-(f.revenue||0)):ke==="VALUATION"&&s.sort((f,u)=>(u.valuation||0)-(f.valuation||0)),Me>=s.length&&(Me=0);const a=s[Me]||null,l=a&&a.status==="PRIVATE",d=a&&a.status==="STATE";let r="";s.length===0&&(r=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No corporations found.</div>`);for(let f=0;f<s.length;f++){const u=s[f],y=f===Me,g=n[u.status]||n.PRIVATE,$=u.status==="PRIVATE";r+=`
        <div onclick="corpSelect(${f})" style="display:flex;align-items:center;padding:6px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${y?t.accent:"transparent"};background:${y?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:36px;font-family:${e};font-size:9px;font-weight:700;color:${t.gold}">${u.abbr}</span>
            <div style="flex:1.3;">
                <div style="font-size:10px;font-weight:600;color:${t.text};line-height:1.2">${u.faction_name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${u.corp_subsector||u.corp_sector||"—"}</div>
            </div>
            <span style="width:55px"><span style="font-family:${e};font-size:7px;padding:1px 4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(u.nation||"—").toUpperCase().slice(0,6)}</span></span>
            <span style="width:50px;font-family:${e};font-size:8px;font-weight:700;color:${$?t.dim:t.muted};text-align:right">${$?"—":v(u.revenue)}</span>
            <span style="width:30px;font-family:${e};font-size:9px;font-weight:700;color:${u.reputation>=70?t.greenBright:u.reputation>=40?t.accent:t.yellow};text-align:right">${u.reputation}</span>
            <span style="width:50px;font-family:${e};font-size:8px;color:${$?t.dim:t.muted};text-align:right">${$?"—":v(u.valuation)}</span>
            <span style="width:42px;text-align:center"><span style="font-family:${e};font-size:6px;font-weight:700;padding:1px 4px;color:${g.color};background:${g.bg};border:1px solid ${g.border}">${u.status}</span></span>
        </div>`}let c="";if(a){const f=n[a.status]||n.PRIVATE,u=[{label:"Sector",value:a.corp_sector||"—",color:t.text},{label:"Subsector",value:a.corp_subsector||"—",color:t.accent},{label:"Reputation",value:a.reputation+"/100",color:a.reputation>=70?t.greenBright:a.reputation>=40?t.accent:t.yellow},{label:"Revenue",value:l?"UNDISCLOSED":v(a.revenue),color:l?t.dim:t.greenBright},{label:"Cash Reserves",value:l?"UNDISCLOSED":v(a.corp_cash_reserves||0),color:l?t.dim:t.text},{label:"Market Valuation",value:l?"UNDISCLOSED":v(a.valuation),color:l?t.dim:t.gold}];c=`
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.gold}">${a.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${t.text}">${a.faction_name}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
                <span style="font-family:${e};font-size:7px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(a.nation||"—").toUpperCase()}</span>
                <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${f.color};background:${f.bg};border:1px solid ${f.border}">${a.status}</span>
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
        </div>`}else c=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a corporation to view details.</div>`;const p=`
    <div style="padding:5px 14px;border-bottom:1px solid ${t.border};background:${t.card};display:flex;gap:12px;align-items:center;flex-shrink:0;">
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px;width:32px">NATION</span>
            <span onclick="corpFilterNation('ALL')" style="padding:2px 7px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${se==="ALL"?"#000":t.dim};background:${se==="ALL"?t.accent:"transparent"};border:1px solid ${se==="ALL"?t.accent:t.border}">ALL</span>
            ${o.map(f=>`<span onclick="corpFilterNation('${f}')" style="padding:2px 7px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${se===f?"#000":t.dim};background:${se===f?t.accent:"transparent"};border:1px solid ${se===f?t.accent:t.border}">${f}</span>`).join("")}
        </div>
        <div style="flex:1"></div>
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">SORT</span>
            ${["REPUTATION","REVENUE","VALUATION"].map(f=>`<span onclick="corpSort('${f}')" style="padding:2px 7px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${ke===f?"#000":t.dim};background:${ke===f?t.accent:"transparent"};border:1px solid ${ke===f?t.accent:t.border}">${f}</span>`).join("")}
        </div>
    </div>`;i.innerHTML=`
    <div style="width:760px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Corporations</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${lt.length} IN DATABASE</span>
        </div>
        ${p}
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
    </div>`}window.corpSelect=No;window.corpFilterNation=Lo;window.corpSort=Bo;let le=null,ue={},j=120,ye=15,ei={},Fe=[];async function Ro(){if(!Ne)return;if(Ye[Ne.id]){alert("You already have a bid on this contract. Retract it first if you want to re-bid.");return}le=Ne,ei={};try{const{data:t}=await _.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",m.id);for(const n of t||[])ei[n.material_key]=Number(n.quantity||0)}catch{}Fe=[];try{const{data:t}=await _.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",le.id).in("status",["pending","won"]);Fe=(t||[]).filter(n=>n.faction_id!==m?.id).map(n=>({name:n.factions?.faction_name||"Unknown",ticker:n.factions?.corp_ticker||"???",price:Number(n.bid_price||0),quality:Number(n.estimated_quality||0),status:n.status}))}catch{}ue={};const i=le.required_materials||{};for(const t of Object.keys(i))ue[t]="STD";const e=le.required_workforce||{};j=Number(e.general||0)+Number(e.skilled||0)||120,ye=15,it(),Et()}function yi(){document.getElementById("bid-assembly-overlay")?.remove(),le=null}function Po(i,e){ue[i]=e,Et()}function Oo(i){j=i,Et()}function Do(i){ye=i,Et()}function Et(){if(document.getElementById("bid-assembly-overlay")?.remove(),!le)return;const i="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=le,n=t.issuer_type==="GOVERNMENT",o=w?.name||m?.nation||"—",s=Number(t.budget_ceiling||0),a=Number(t.timeline_ticks||8),l=t.required_materials||{},d=Object.keys(l),r={LOW:.5,STD:1,HIGH:2},c={LOW:e.orange,STD:e.yellow,HIGH:e.greenBright},p={LOW:"Low",STD:"Standard",HIGH:"High"},f={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},u=ei||{};let y=0,g="";for(const L of d){const D=Number(l[L]||0),vi=ue[L]||"STD",xi=f[L]||3e5,nn=r[vi],on=Math.round(xi*nn),bi=D*on;y+=bi;const an=L.replace(/_/g," ").replace(/\b\w/g,_e=>_e.toUpperCase()),$i=Number(u[L]||0),It=Math.max(0,D-$i),sn=It===0?e.greenBright:It<D?e.yellow:e.red,rn=It===0?"✓ IN STOCK":`${$i}/${D}`;g+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${e.text}">${an}</span>
                <div style="font-family:${i};font-size:7px;color:${sn};margin-top:1px">${rn}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${i};font-size:9px;color:${e.muted}">${D.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(_e=>{const Mt=vi===_e,_i=c[_e],ln=v(Math.round(xi*r[_e]));return`<span onclick="bidSetGrade('${L}','${_e}')" style="padding:2px 6px;font-family:${i};font-size:7px;font-weight:700;cursor:pointer;color:${Mt?"#000":e.dim};background:${Mt?_i:"transparent"};border:1px solid ${Mt?_i:e.border}" title="${ln}/unit">${p[_e]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${i};font-size:10px;color:${e.text}">${v(bi)}</span></div>
        </div>`}const $=t.required_workforce||{},k=Number($.general||0)+Number($.skilled||0)||100,h=Math.max(40,Math.round(k*.5)),A=k*2,C=[h,Math.round(k*.75),k,Math.round(k*1.5),A],E=Math.max(0,Math.min(1,(j-h)/(A-h||1))),x=a,T=Math.round(4.5-E*8),M=Math.max(Math.round(x*.6),x+T),N=T>0?`+${T}mo`:T<0?`${T}mo`:"On schedule",B=T>0?e.red:T<0?e.greenBright:e.yellow,z=15200,P=j*z*M,F=s,q=[{name:"Municipal Zoning Approval",cost:18e4,ticks:2,required:!0},{name:"Structural Engineering Cert.",cost:24e4,ticks:3,required:!0},{name:"Environmental Impact Assessment",cost:34e4,ticks:8,required:F>2e7},{name:"Seismic Resilience Compliance",cost:21e4,ticks:4,required:F>5e7},{name:"Heritage Conservation Review",cost:16e4,ticks:6,required:!1},{name:"Fire Safety Certification",cost:12e4,ticks:2,required:F>1e7}].filter(L=>L.required),V=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),De=q.filter(L=>!V.has(L.name)).reduce((L,D)=>L+D.cost,0),te=4e5,xe=y+P+De+te,ce=Math.round(xe*(ye/100)),ot=xe+ce,J=ot>s,Ct=ce,be=J?0:Math.max(0,Math.min(100,Math.round(100-ot/s*100+30))),gi=be>70?e.greenBright:be>40?e.yellow:be>0?e.orange:e.red,en=J?"OVER CEILING":be>70?"STRONG":be>40?"COMPETITIVE":be>20?"WEAK":"UNLIKELY",St=Object.values(ue),$e=St.length>0?Math.round(St.reduce((L,D)=>L+(D==="HIGH"?85:D==="STD"?65:45),0)/St.length):50,at=$e>=75?e.greenBright:$e>=55?e.yellow:e.orange,tn=$e>=75?"STRONG":$e>=55?"PROMISING":"UNCERTAIN",je=document.createElement("div");je.id="bid-assembly-overlay",je.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",je.addEventListener("click",L=>{L.target===je&&yi()}),je.innerHTML=`
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
                            ${C.map(L=>`<span onclick="bidSetWorkers(${L})" style="padding:2px 8px;font-family:${i};font-size:8px;font-weight:700;cursor:pointer;color:${j===L?"#000":e.dim};background:${j===L?e.accent:"transparent"};border:1px solid ${j===L?e.accent:e.border}">${L}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">${j} × $${z.toLocaleString()}/tick × ${M} ticks</span>
                        <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${v(P)}</span>
                    </div>
                    <div style="margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <span style="font-family:${i};font-size:8px;color:${e.dim}">WORKFORCE REQUIRED</span>
                        </div>
                        <div style="display:flex;gap:12px;">
                            <span style="font-family:${i};font-size:7px;color:#8b9a6b">General: ${Math.ceil(j*.8)}</span>
                            <span style="font-family:${i};font-size:7px;color:#c8a832">Skilled: ${Math.ceil(j*.15)}</span>
                            <span style="font-family:${i};font-size:7px;color:#c84">Innovative: ${Math.ceil(j*.05)}</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">COMPLETION TIMELINE</span>
                        <span style="font-family:${i};font-size:10px;font-weight:700;color:${B}">${M}mo <span style="font-size:8px;opacity:0.7">(${N})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${q.map(L=>{const D=V.has(L.name);return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
                        <div style="flex:1;display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${i};font-size:8px;font-weight:700;color:${D?e.greenBright:e.orange}">${D?"✓":"○"}</span>
                            <span style="font-size:10px;color:${D?e.muted:e.text}">${L.name}</span>
                        </div>
                        ${D?`<span style="font-family:${i};font-size:8px;color:${e.greenBright}">HELD</span>`:`<div style="text-align:right">
                                <span style="font-family:${i};font-size:9px;color:${e.redDim}">${v(L.cost)}</span>
                                <span style="font-family:${i};font-size:7px;color:${e.dim};margin-left:4px">${L.ticks}t</span>
                            </div>`}
                    </div>`}).join("")}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${i};font-size:9px;color:${e.muted}">PERMIT COSTS</span>
                    <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${v(De)}</span>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${i};font-size:9px;color:${e.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${i};font-size:11px;font-weight:700;color:${e.text}">${v(te)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v:y},{l:"Labor",v:P},{l:"Permits",v:De},{l:"Overhead",v:te}].map(L=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-size:10px;color:${e.muted}">${L.l}</span>
                    <span style="font-family:${i};font-size:10px;color:${e.redDim}">${v(L.v)}</span>
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
                        <span style="font-family:${i};font-size:16px;font-weight:700;color:${e.gold}">${ye}%</span>
                    </div>
                    <input type="range" min="0" max="40" step="1" value="${ye}" oninput="bidSetMarkup(+this.value)" style="width:100%;accent-color:${e.gold};height:6px;" />
                    <div style="display:flex;justify-content:space-between;font-family:${i};font-size:7px;color:${e.dim};margin-top:2px;">
                        <span>0% (at cost)</span><span>40% (maximum)</span>
                    </div>
                </div>

                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${J?"rgba(204,85,85,0.04)":"rgba(200,168,50,0.03)"};">
                    <div style="font-family:${i};font-size:8px;color:${e.dim};margin-bottom:4px">YOUR BID PRICE</div>
                    <div style="font-family:${i};font-size:22px;font-weight:700;color:${J?e.red:e.gold}">${v(ot)}</div>
                    ${J?`<div style="font-family:${i};font-size:8px;font-weight:700;color:${e.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${v(s)})</div>`:""}
                </div>

                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">PROJECTED PROFIT</span>
                        <span style="font-family:${i};font-size:14px;font-weight:700;color:${Ct>0?e.greenBright:e.dim}">+${v(Ct)}</span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${i};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Bid Assessment</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">COMPETITIVENESS</span>
                        <span style="font-family:${i};font-size:11px;font-weight:700;color:${gi}">${en}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${be}%;height:100%;background:${gi}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${i};font-size:8px;color:${e.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${i};font-size:11px;font-weight:700;color:${at}">${$e}</span>
                            <span style="font-family:${i};font-size:8px;color:${e.dim}">/100</span>
                            <span style="font-family:${i};font-size:8px;font-weight:700;color:${at}">${tn}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${$e}%;height:100%;background:${at}"></div></div>
                    <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="font-family:${i};font-size:8px;color:${e.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${Fe.length===0?`<div style="font-family:${i};font-size:8px;color:${e.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${Fe.map(L=>`<span style="padding:2px 6px;font-family:${i};font-size:7px;color:${e.muted};background:${e.card};border:1px solid ${e.border};">${L.name} <span style="color:${e.dim}">Q:${L.quality}</span></span>`).join("")}
                        </div>
                        <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:3px">${Fe.length} competing bid${Fe.length!==1?"s":""}. Bid prices are sealed until resolution.</div>`}
                    <div style="font-family:${i};font-size:7px;color:${e.dim};margin-top:3px">Higher reputation bidders may win at higher prices.</div>
                </div>
                <div style="flex:1"></div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">YOUR BID</div><div style="font-family:${i};font-size:14px;font-weight:700;color:${J?e.red:e.gold}">${v(ot)}</div></div>
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">EST. PROFIT</div><div style="font-family:${i};font-size:14px;font-weight:700;color:${e.greenBright}">+${v(Ct)}</div></div>
                <div><div style="font-family:${i};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${i};font-size:14px;font-weight:700;color:${at}">${$e}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${i};font-size:10px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="${J?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${i};font-size:10px;font-weight:700;letter-spacing:1px;color:${J?e.dim:"#000"};background:${J?e.border:e.gold};cursor:${J?"not-allowed":"pointer"};opacity:${J?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(je)}let Dt=!1;async function jo(){if(Dt||!le)return;const i=le,e=i.required_materials||{},t=Object.keys(e),n=Number(i.budget_ceiling||0),o=Number(i.timeline_ticks||8),s={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},a={LOW:.5,STD:1,HIGH:2};let l=0;for(const z of t){const P=Number(e[z]||0),F=ue[z]||"STD",K=s[z]||3e5;l+=P*Math.round(K*a[F])}const d=15200,r=i.required_workforce||{},c=Number(r.general||0)+Number(r.skilled||0)||100,p=Math.max(40,Math.round(c*.5)),f=c*2,u=Math.max(0,Math.min(1,(j-p)/(f-p||1))),y=Math.round(4.5-u*8),g=Math.max(Math.round(o*.6),o+y),$=j*d*g,k=n,h=[{name:"Municipal Zoning Approval",cost:18e4,required:!0},{name:"Structural Engineering Cert.",cost:24e4,required:!0},{name:"Environmental Impact Assessment",cost:34e4,required:k>2e7},{name:"Seismic Resilience Compliance",cost:21e4,required:k>5e7},{name:"Fire Safety Certification",cost:12e4,required:k>1e7}],A=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),C=h.filter(z=>z.required&&!A.has(z.name)).reduce((z,P)=>z+P.cost,0),x=l+$+C+4e5,T=Math.round(x*(ye/100)),M=x+T;if(M>n){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const N=Object.values(ue),B=N.length>0?Math.round(N.reduce((z,P)=>z+(P==="HIGH"?85:P==="STD"?65:45),0)/N.length):50;if(confirm('Submit bid for "'+i.name+`"?

Bid Price: `+v(M)+`
Est. Cost: `+v(x)+`
Markup: `+ye+"% ("+v(T)+`)
Quality: `+B+`/100
Workers: `+j+`

Once submitted, your bid cannot be changed.`)){Dt=!0;try{const{data:z}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),P=z?.current_tick||0,F={};for(const q of t)F[q]=ue[q]||"STD";const{error:K}=await _.from("contract_bids").insert({contract_id:i.id,faction_id:m.id,bid_price:M,material_grades:F,labor_count:j,markup_pct:ye,estimated_cost:x,estimated_quality:B,status:"pending",submitted_at_tick:P});if(K)throw K;i.status==="open"&&await _.from("construction_contracts").update({status:"bidding"}).eq("id",i.id).eq("status","open"),yi(),alert(`Bid submitted successfully!

Contract: `+i.name+`
Your Bid: `+v(M)+`
Quality: `+B+`/100

Bids will be resolved when the bidding window closes (`+(i.bidding_ends_tick?"tick "+i.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof ve=="function"&&await ve()}catch(z){alert("Bid submission failed: "+z.message)}finally{Dt=!1}}}window.openBidAssembly=Ro;window.closeBidAssembly=yi;window.bidSetGrade=Po;window.bidSetWorkers=Oo;window.bidSetMarkup=Do;window.submitBidAssembly=jo;let jt=!1;async function Ho(i){if(jt)return;const e=1e6,t=Number(m?.corp_cash_reserves??0);if(t<e){alert("Cannot retract — you need at least $1M in cash reserves to cover the retraction penalty.");return}if(confirm(`Retract your bid?

This will cost $1M as a retraction penalty.
This action cannot be undone.`)){jt=!0;try{const n=t-e,{error:o}=await _.from("factions").update({corp_cash_reserves:n}).eq("id",m.id);if(o)throw o;const{error:s}=await _.from("contract_bids").delete().eq("contract_id",i).eq("faction_id",m.id);if(s)throw s;m.corp_cash_reserves=n,typeof Qe=="function"&&Qe(n),alert("Bid retracted. $1M penalty applied."),it(),await ve()}catch(n){alert("Failed to retract bid: "+(n.message||"Unknown error"))}finally{jt=!1}}}window.retractBid=Ho;let tt=[],Ae=0,ae=null,Ht=!1,Ut=!1,Gt=!1;async function Uo(){if(!Ne||Ut)return;Ut=!0,ae=Ne,Ae=0;const{data:i,error:e}=await _.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",ae.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(Ut=!1,e){alert("Failed to load bids: "+e.message);return}tt=(i||[]).map(t=>({...t,corp:t.factions?.faction_name||"Unknown",abbr:t.factions?.corp_ticker||"???",subsector:t.factions?.corp_subsector||"—"})),it(),Zi()}function Tt(){document.getElementById("bid-review-overlay")?.remove(),ae=null}function Go(i){Ae=i,Zi()}async function Wo(){if(Ht||tt.length===0)return;const i=tt[Ae];if(!(!i?.id||!i.faction_id)&&confirm("Accept bid from "+i.corp+`?

Bid Price: `+v(i.bid_price)+`
Quality: `+i.estimated_quality+`/100
Workers: `+i.labor_count+`

This will award the contract. The project begins immediately.`)){Ht=!0;try{const{data:e}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{error:n}=await _.from("contract_bids").update({status:"won"}).eq("id",i.id);if(n)throw n;const{error:o}=await _.from("contract_bids").update({status:"lost"}).eq("contract_id",ae.id).neq("id",i.id);if(o)throw o;const{error:s}=await _.from("construction_contracts").update({status:"awarded",awarded_to_faction:i.faction_id,awarded_at_tick:t}).eq("id",ae.id);if(s)throw s;Tt(),alert("Contract awarded to "+i.corp+`!

Bid: `+v(i.bid_price)+`
Project begins immediately.`),typeof ve=="function"&&await ve()}catch(e){alert("Failed to accept bid: "+(e.message||e))}finally{Ht=!1}}}async function Fo(){if(!(!ae||Gt)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){Gt=!0;try{const{error:i}=await _.from("contract_bids").update({status:"lost"}).eq("contract_id",ae.id);if(i)throw i;const{error:e}=await _.from("construction_contracts").update({status:"expired"}).eq("id",ae.id);if(e)throw e;Tt(),alert("All bids declined. Contract cancelled."),typeof ve=="function"&&await ve()}catch(i){alert("Failed: "+(i.message||i))}finally{Gt=!1}}}function Zi(){if(document.getElementById("bid-review-overlay")?.remove(),!ae||tt.length===0)return;const i="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=ae,n=tt;Ae>=n.length&&(Ae=0);const o=n[Ae],s=Number(t.budget_ceiling||0),a=Number(t.timeline_ticks||36),l=Math.min(...n.map(u=>u.bid_price)),d=Math.max(...n.map(u=>u.estimated_quality||0));let r="";for(let u=0;u<n.length;u++){const y=n[u],g=u===Ae,$=y.bid_price===l,k=(y.estimated_quality||0)===d,h=y.bid_price>s;r+=`
        <div onclick="reviewSelectBid(${u})" style="padding:10px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${g?e.accent:"transparent"};background:${g?"rgba(139,154,107,0.03)":"transparent"};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-family:${i};font-size:10px;font-weight:700;color:${e.gold}">${y.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${e.text}">${y.corp}</span>
                ${$?`<span style="font-family:${i};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.greenBright};background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2)">CHEAPEST</span>`:""}
                ${k?`<span style="font-family:${i};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.2)">BEST QUALITY</span>`:""}
            </div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};">
                <div style="flex:1.2;padding:5px 10px;border-right:1px solid ${e.border}">
                    <div style="font-family:${i};font-size:7px;color:${e.dim}">BID PRICE</div>
                    <div style="font-family:${i};font-size:14px;font-weight:700;color:${h?e.red:e.text}">${v(y.bid_price)}</div>
                    ${h?`<div style="font-family:${i};font-size:7px;color:${e.red}">OVER BUDGET</div>`:""}
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
        </div>`}const c=o.bid_price>s,p=s>0?Math.round(o.bid_price/s*100):0,f=document.createElement("div");f.id="bid-review-overlay",f.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",f.addEventListener("click",u=>{u.target===f&&Tt()}),f.innerHTML=`
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
                        <span style="font-family:${i};font-size:9px;font-weight:700;color:${c?e.red:e.greenBright}">${c?"OVER":"WITHIN"} — ${p}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${e.border}"><div style="width:${Math.min(100,p)}%;height:100%;background:${c?e.red:e.accent}"></div></div>
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
    </div>`,document.body.appendChild(f)}window.openBidReview=Uo;window.closeBidReview=Tt;window.reviewSelectBid=Go;window.acceptBid=Wo;window.declineAllBids=Fo;window.switchToExpansion=Gi;window.switchToOperations=Wi;window.hfSetChange=no;window.hfReset=oo;window.hfConfirm=ao;document.querySelector('[data-tab="operations"]')?.addEventListener("click",function(i){this.classList.contains("active")||(i.preventDefault(),Wi(i))});Zn();
