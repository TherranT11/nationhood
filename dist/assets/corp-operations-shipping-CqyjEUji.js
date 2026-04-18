const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-BsVGcrAN.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as g}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{c as Ge,i as ka,a as Ea,l as Ca,M as Bt,Q as Cn,b as Tn,d as fn,e as fi,f as mi,g as Ta,h as Sa}from"./corp-shipping-data-CcJ84lK3.js";import{_ as za}from"./preload-helper-BXl3LOEh.js";import{e as x}from"./utils-CY90Gazr.js";import{initMessaging as Ia}from"./messaging-BUrQna7p.js";import{c as Na,a as mn,E as Pt,b as ko,d as ui,e as Aa,f as Ma,h as ai}from"./equipment-DsuDdEne.js";import{a as Ra,E as lo,b as co,g as La}from"./corp-executives-BOrCkuAI.js";import"./political-actions-BF080n5r.js";import"./config-CRvw5bg0.js";import"./government-types-D9n0pQb0.js";import"./ideology-BqLjustE.js";import"./stats-tIiBSaQA.js";let we=[],d=null,z=null,S=null,dt=[],wt={},J=[],Z={},un=-1;const qa={em:"em_systems",glass:"glass_facades",heavy:"heavy_parts"},po=o=>qa[o]||o;let de="concrete",X="STD",he=500,ae=[],vi={},vn=0,Dt=[],jt=[],vt=0,ke=null,Ce=-1,ce=[],yi=[],Ft=null,It={},fo={},Sn=[],mo=null,fe="trucks",Ee=0,Te=1,qe=[],Ve=null,gi=[],yn=null,to=null,gn="ALL",xn="TIMELINE";function P(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Oa(o){if(o>=12){const e=Math.floor(o/12),t=o%12;return t>0?e+"y "+t+"mo":e+"y"}return o+" ticks"}function xi(o){return!o||o.length===0?"":o.map(e=>{const t=vi[e];if(!t)return"";const n=t.reputation_bonus>0?"var(--green)":t.reputation_bonus<0?"var(--red)":"var(--text-dim)",i=t.reputation_bonus>0?"+"+t.reputation_bonus:t.reputation_bonus<0?String(t.reputation_bonus):"";return`<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background: var(--border-hair);border:1px solid var(--border-0);border-radius:3px;font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">${t.icon||"📍"} ${x(t.name)}${i?` <span style="color:${n};font-weight:700;">${i} REP</span>`:""}</span>`}).filter(Boolean).join(" ")}function me(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(0)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function zn(o){return o==="civil_engineering"?"CIVIL":o==="industrial"?"INDUSTRIAL":o==="mega_project"?"MEGA":o?.toUpperCase()||"—"}function bi(o){return o==="civil_engineering"?"light":o==="industrial"?"heavy":o==="mega_project"?"mega":"light"}function Ba(){to&&clearInterval(to),to=setInterval(()=>{if(!yn)return;const o=yn-Date.now();if(o<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(to);return}const e=Math.floor(o/36e5),t=Math.floor(o%36e5/6e4),n=Math.floor(o%6e4/1e3);document.getElementById("tick-countdown").textContent=e+"h "+t+"m "+n+"s"},1e3)}function Pa(o,e){o==="type"&&(gn=e),o==="sort"&&(xn=e),document.querySelectorAll(`.filter-pill[data-filter="${o}"]`).forEach(t=>{t.classList.toggle("active",t.dataset.value===e)}),hi()}const ri={"Civil Engineering":"civil_engineering","Industrial Construction":"industrial",Megaprojects:"mega_project"};function _i(o){if(!d)return!1;if(ri[d.corp_subsector]===o.sector)return!0;const t=(Y||[]).filter(n=>n.type==="regional_hq"&&n.is_active&&n.nation_id===o.nation_id);for(const n of t)if(ri[n.subsector]===o.sector)return!0;return!1}function hi(){const o=document.getElementById("oc-list");let e=[...dt];if(gn==="GOVERNMENT"?e=e.filter(i=>i.issuer_type==="GOVERNMENT"):gn==="PRIVATE"&&(e=e.filter(i=>i.issuer_type==="PRIVATE")),xn==="TIMELINE"&&e.sort((i,a)=>(i.timeline_ticks||0)-(a.timeline_ticks||0)),xn==="BUDGET"&&e.sort((i,a)=>(a.budget_ceiling||0)-(i.budget_ceiling||0)),document.getElementById("oc-count").textContent=e.length+" AVAILABLE",e.length===0){o.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const t=S?.current_tick||0;let n="";for(const i of e){const a=i.issuer_type==="GOVERNMENT",r=a?"gov":"private",s=_i(i),l=s?"":" locked",c=bi(i.sector),f=zn(i.sector),p=(i.timeline_ticks||0)>18?" warn":"",u=i.bidding_ends_tick?Math.max(0,i.bidding_ends_tick-t):"?";n+=`
            <div class="oc-item${l}" data-contract-id="${i.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${x(i.name)}</span>
                    <span class="oc-item__type-badge ${r}">${a?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${r}">${x(i.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${u} tick${u!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${me(i.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${p}">${Oa(i.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${c}">${f}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${wt[i.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${me(wt[i.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${s?"yes":"no"}">${s?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${s?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openContractDetail(contracts.find(x=>x.id==='${i.id}'))">VIEW</button>`:""}
                </div>
                ${i.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${x(i.description)}</div>`:""}
                ${i.modifiers&&i.modifiers.length>0?`<div style="display:flex;flex-wrap:wrap;gap:3px;padding:4px 0 0;">${xi(i.modifiers)}</div>`:""}
            </div>`}o.innerHTML=n,o.querySelectorAll(".oc-item:not(.locked)").forEach(i=>{i.addEventListener("click",()=>{const a=i.dataset.contractId,r=dt.find(s=>s.id===a);r&&$i(r)})})}let We=null;function $i(o){We=o;const e=document.getElementById("cd-overlay"),t=o.issuer_type==="GOVERNMENT",n=t?"gov":"private",i=(z?.name||d.nation||"—").toUpperCase(),a=_i(o);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${x(i)}</span>
        <span class="cd-header__name">${x(o.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${n}">${x(o.issuer_name)}</span>
        <span class="cd-header__type-badge ${n}">${t?"GOV":"PRIVATE"}</span>
    `;const r=document.getElementById("cd-blueprint");o.blueprint_svg?(r.innerHTML=o.blueprint_svg,r.style.display=""):(r.innerHTML=or(o),r.style.display="");const s=o.permits_required||[],l=o.required_equipment||o.equipment_required||{},c=Array.isArray(l)?l.map(N=>({key:N,qty:1})):Object.entries(l).map(([N,B])=>({key:N,qty:B})),f=o.required_materials||o.materials_estimated||{},u={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[o.sector]||o.spec_category||o.sector||"—";let m="var(--teal)";o.sector==="industrial"&&(m="var(--orange)"),o.sector==="mega_project"&&(m="var(--red)");let v=P(o.budget_ceiling||o.budget||0),b=(o.timeline_ticks||o.timeline_months||0)+" Months",y="";y+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${x(o.project_code||o.contract_number||"")}</span>
            </div>
            <div class="cd-issue__tags">
                ${o.project_type?`<span class="cd-tag teal">${x(o.project_type.toUpperCase())}</span>`:""}
                ${o.project_subtype?`<span class="cd-tag gold">${x(o.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,o.description&&(y+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${x(o.description)}</div>
            </div>`);const $=o.modifiers||[];if($.length>0){y+=`<div class="cd-items">
            <div class="cd-section-label">Building Modifiers</div>
            <div style="display:flex;flex-direction:column;gap:6px;">`;for(const N of $){const B=vi[N];if(!B)continue;const F=B.reputation_bonus>0?"var(--green)":B.reputation_bonus<0?"var(--red)":"var(--text-dim)",G=B.cost_multiplier>1?"+"+Math.round((B.cost_multiplier-1)*100)+"% cost":B.cost_multiplier<1?Math.round((1-B.cost_multiplier)*100)+"% cheaper":"",ee=B.reputation_bonus!==0?(B.reputation_bonus>0?"+":"")+B.reputation_bonus+" rep":"",ge=B.required_permits||[];y+=`<div style="padding:6px 10px;background: var(--border-hair);border:1px solid var(--border-hair);border-radius:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:600;font-size:0.78rem;color:var(--text-primary);">${B.icon||"📍"} ${x(B.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;">
                        ${G?`<span style="color:var(--amber);">${G}</span>`:""}
                        ${G&&ee?" · ":""}
                        ${ee?`<span style="color:${F};font-weight:700;">${ee}</span>`:""}
                    </span>
                </div>
                <div style="font-size:0.65rem;color:var(--text-dim);margin-top:2px;">${x(B.description||"")}</div>
                ${ge.length>0?`<div style="font-size:0.6rem;color:var(--amber);margin-top:3px;font-family:var(--font-mono);">Requires permits: ${ge.map(V=>x(V.replace(/_/g," "))).join(", ")}</div>`:""}
            </div>`}y+="</div></div>"}y+='<div class="cd-details">',o.project_type&&(y+=Le("Type",o.project_type)),o.project_subtype&&(y+=Le("Sub-Type",o.project_subtype)),y+=Le("Specialization",u,m),y+=Le("Total Budget",v,"var(--green)"),y+=Le("Timeline",b),y+=Le("Nation",z?.name||d.nation||"—"),o.region&&(y+=Le("Region",o.region)),y+="</div>",s.length>0&&(y+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${s.map(N=>{const B=N.status==="approved"?"approved":"required",F=N.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${B}">
                            <span class="cd-chip__icon">${F}</span>
                            <span class="cd-chip__label">${x(N.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),f.length>0&&(y+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${f.map(N=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${x(N.name)}</span>
                        <span class="cd-mat-row__qty">${x(String(N.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=y;const h=s.filter(N=>N.status==="approved").length,k=s.length-h,T=c.length,C=[];for(const N of c){const B=ae.find(F=>F.equipment_key===N.key);B&&B.owned>=N.qty||C.push(N)}const w=C.length,I=o.required_materials||{},R=typeof I=="object"&&!Array.isArray(I)?Object.entries(I):[],E=[];for(const[N,B]of R){const F=Z[N]||{},G=(F.LOW?.qty||0)+(F.STD?.qty||0)+(F.HIGH?.qty||0);G<B&&E.push({key:N,need:B,have:G})}const q=N=>N.replace(/_/g," ").replace(/\b\w/g,B=>B.toUpperCase());let L="";if(T>0)if(w===0)L+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>';else{const N=C.map(B=>q(B.key)).join(", ");L+=`<span class="cd-footer__badge bad" title="${x(N)}">${w} SHORT: ${x(N)}</span>`}if(R.length>0)if(E.length===0)L+='<span class="cd-footer__badge ok">ALL MATERIALS MET</span>';else{const N=E.map(B=>q(B.key)+" ("+B.have+"/"+B.need+")").join(", ");L+=`<span class="cd-footer__badge bad" title="${x(N)}">${E.length} MAT SHORT: ${x(N)}</span>`}s.length>0&&(k===0?L+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':L+=`<span class="cd-footer__badge warn">${k} PERMITS PENDING</span>`);const A=a,U=o.issuer_faction_id===d?.id,j=o.status==="bidding",H=wt[o.id];document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${L}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${U?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${j?"":"disabled"} title="${j?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:H?`<button class="cd-btn primary" onclick="retractBid('${o.id}')" style="background:#c55;border-color:#c55;"
                        title="Retract your bid ($1M penalty)">RETRACT BID</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${A?"":"disabled"}
                        title="${A?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,e.classList.add("open"),document.body.style.overflow="hidden"}function Yt(o){o&&o.target&&o.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",We=null)}const De=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],si={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},li={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let O=null;async function it(o){const e=J.find(N=>N.id===o);if(!e)return;const t=Array.isArray(e.contract_bids)?e.contract_bids[0]:e.contract_bids,n=S?.current_tick||0,i=e.awarded_at_tick||n,a=e.timeline_ticks||8,r=Math.max(0,n-i),s=Math.min(100,r/a*100);let l=Math.min(De.length-1,Math.floor(s/(100/De.length)));const c=Math.round(s%(100/De.length)/(100/De.length)*100),f=e.required_materials||{},p=t?.material_grades||{};let u=[];try{const{data:N}=await g.from("project_material_allocations").select("material_key, quality_tier, quantity, consumed").eq("contract_id",e.id);u=N||[]}catch{}const m={};for(const N of u)m[N.material_key]||(m[N.material_key]={totalAllocated:0,totalConsumed:0,tiers:{}}),m[N.material_key].totalAllocated+=N.quantity,m[N.material_key].totalConsumed+=N.consumed,m[N.material_key].tiers[N.quality_tier]={qty:N.quantity,consumed:N.consumed};const v=Object.entries(f).map(([N,B])=>{const F=p[N]||"STD",G=m[N]||{totalAllocated:0,totalConsumed:0,tiers:{}};return{key:N,name:N.replace(/_/g," ").replace(/\b\w/g,ee=>ee.toUpperCase()),grade:F,required:Number(B),allocated:G.totalAllocated,consumed:G.totalConsumed,tiers:G.tiers,warehouseStock:Z[N]||{}}}),b=e.required_equipment||{},y=e.equipment_condition||{},h=(Array.isArray(b)?b.map(N=>[N,1]):Object.entries(b)).map(([N,B])=>{const F=ae.find(V=>V.equipment_key===N),ee=(F?.assigned_projects||[]).find(V=>V.contract_id===e.id),ge=ee?ee.units:0;return{key:N,name:N.replace(/_/g," ").replace(/\b\w/g,V=>V.toUpperCase()),required:Number(B)||1,ownedTotal:F?.owned||0,deployed:F?.deployed||0,available:Math.max(0,(F?.owned||0)-(F?.deployed||0)),assignedToProject:ge,condition:y[N]??(F?.condition||100)}}),k=e.budget_ceiling||0,T=t?.estimated_cost||0,C=Math.round(T*Math.min(1,r/a)),w=t?.estimated_quality||65,I=w>=75?"EXCELLENT":w>=50?"FAIR":w>=25?"POOR":"BAD",R=e.required_workforce||{},E=e.workers_assigned||{},q=(R.general||0)+(R.skilled||0)+(R.innovative||0),L=(E.general||0)+(E.skilled||0)+(E.innovative||0),A=t?.labor_count||q,U=Number(d?.corp_general_workforce??0),j=Number(d?.corp_skilled_workforce??0),H=Number(d?.corp_innovative_workforce??0);O={project:e,bid:t,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:n,awardedTick:i,totalTicks:a,ticksElapsed:r,phaseIdx:l,phaseProgress:c,materials:v,equipment:h,budget:k,estCost:T,spent:C,quality:w,qualityLabel:I,laborCount:A,wfNeeded:q,wfAssigned:L,reqWf:R,assignedWf:E,corpGeneral:U,corpSkilled:j,corpInnovative:H,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",wi(e.id).then(()=>Xe()),Xe()}let W=!1;async function Da(o,e,t){if(!(W||!O||!d)){W=!0;try{const{data:n,error:i}=await g.rpc("allocate_material_to_project",{p_contract_id:O.project.id,p_faction_id:d.id,p_material_key:o,p_quality_tier:e,p_quantity:t});if(i){alert("Allocation failed: "+i.message);return}if(n&&!n.success){alert(n.error||"Allocation failed");return}await Ei(),await it(O.project.id)}catch(n){alert("Allocation error: "+n.message)}finally{W=!1}}}async function ja(o,e,t){if(!(W||!O||!d)){W=!0;try{const{data:n,error:i}=await g.rpc("deallocate_material_from_project",{p_contract_id:O.project.id,p_faction_id:d.id,p_material_key:o,p_quality_tier:e,p_quantity:t});if(i){alert("Return failed: "+i.message);return}if(n&&!n.success){alert(n.error||"Return failed");return}await Ei(),await it(O.project.id)}catch(n){alert("Return error: "+n.message)}finally{W=!1}}}async function Fa(o,e){if(!(W||!O||!d)){W=!0;try{const t=O.project,n=t.workers_assigned||{},i=Number(n[o]||0),a=Number((t.required_workforce||{})[o]||0),r=Number(d?.["corp_"+o+"_workforce"]??0);let s=0;for(const m of J||[])m.id!==t.id&&(s+=Number((m.workers_assigned||{})[o]||0));const l=Math.max(0,r-s-i),c=Math.min(e,a-i,l);if(c<=0){alert(l<=0?"No "+o+" workers available in pool":"Already fully staffed for "+o);return}const f={...n,[o]:i+c},{error:p}=await g.from("construction_contracts").update({workers_assigned:f}).eq("id",t.id);if(p){alert("Assign failed: "+p.message);return}const u=J.find(m=>m.id===t.id);u&&(u.workers_assigned=f),await it(t.id)}catch(t){alert("Assign error: "+t.message)}finally{W=!1}}}async function Ua(o,e){if(!(W||!O||!d)){W=!0;try{const t=O.project,n=t.workers_assigned||{},i=Number(n[o]||0),a=Math.min(e,i);if(a<=0){alert("No "+o+" assigned");return}const r={...n,[o]:i-a},{error:s}=await g.from("construction_contracts").update({workers_assigned:r}).eq("id",t.id);if(s){alert("Unassign failed: "+s.message);return}const l=J.find(c=>c.id===t.id);l&&(l.workers_assigned=r),await it(t.id)}catch(t){alert("Unassign error: "+t.message)}finally{W=!1}}}async function Ha(o,e){if(!(W||!O||!d)){W=!0;try{const t=ae.find(l=>l.equipment_key===o);if(!t){alert("Equipment not found in inventory.");return}const n=Math.max(0,(t.owned||0)-(t.deployed||0));if(n<e){alert("Not enough available "+o+" ("+n+" available).");return}const i=(t.deployed||0)+e,a=[...t.assigned_projects||[]],r=a.find(l=>l.contract_id===O.project.id);r?r.units+=e:a.push({contract_id:O.project.id,contract_name:O.project.name,units:e});const{error:s}=await g.from("corp_equipment").update({deployed:i,assigned_projects:a}).eq("faction_id",d.id).eq("equipment_key",t.equipment_key);if(s){alert("Deploy failed: "+s.message);return}await Ai(),await it(O.project.id)}catch(t){alert("Deploy error: "+t.message)}finally{W=!1}}}async function Ga(o){if(!(W||!O||!d)){W=!0;try{const e=ae.find(s=>s.equipment_key===o);if(!e){alert("Equipment not found.");return}const t=[...e.assigned_projects||[]],n=t.findIndex(s=>s.contract_id===O.project.id);if(n===-1){alert("Equipment not deployed to this project.");return}const i=t[n].units;t.splice(n,1);const a=Math.max(0,(e.deployed||0)-i),{error:r}=await g.from("corp_equipment").update({deployed:a,assigned_projects:t}).eq("faction_id",d.id).eq("equipment_key",e.equipment_key);if(r){alert("Undeploy failed: "+r.message);return}await Ai(),await it(O.project.id)}catch(e){alert("Undeploy error: "+e.message)}finally{W=!1}}}function Va(o){o&&o.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",O=null)}function Wa(o){O&&(O.tab=o,O.expandedEvent=-1,O.selectedResponse=null,Xe())}function Ya(o){O&&(O.expandedEvent=O.expandedEvent===o?-1:o,O.selectedResponse=null,Xe())}function Qa(o){O&&(O.selectedResponse=O.selectedResponse===o?null:o,Xe())}function Xe(){if(!O)return;const o=O,e=o.project,t=e.issuer_type==="GOVERNMENT",n=zn(e.sector),i=d?.nation||"Nation",a=o.awardedTick+o.totalTicks,r=Math.max(0,a-o.currentTick),s=o.currentTick>a,l=o.budget>0?Math.round(o.spent/o.budget*100):0,c=l>85?"var(--red)":l>60?"var(--amber)":"var(--teal)",f=o.budget-o.spent,p=o.events.filter(y=>y.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${x(i.toUpperCase())}</span>
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
    `;let u='<div class="pm-phase__bar">';for(let y=0;y<De.length;y++){const $=y<o.phaseIdx,h=y===o.phaseIdx;u+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${$?"done":h?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${$?"done":h?"active":""}">${De[y]}</span>
        </div>`}u+="</div>",u+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${De[o.phaseIdx]} — ${o.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${s?"var(--red)":"var(--text-secondary)"}">Tick ${o.ticksElapsed} / ${o.totalTicks}${s?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=u;const m=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:p},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=m.map(y=>`<button class="pm-tab${o.tab===y.id?" active":""}" onclick="pmSetTab('${y.id}')">
            ${y.label}${y.badge>0?`<span class="pm-tab__badge">${y.badge}</span>`:""}
        </button>`).join("");let v="";o.tab==="overview"?v=Ka(o,e,c,l,f,r,s):o.tab==="events"?v=Ja(o):o.tab==="materials"?v=Xa(o):o.tab==="equipment"&&(v=Za(o)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${v}</div>`;let b="";p>0&&(b+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${p} EVENT${p>1?"S":""} REQUIRES RESPONSE</span>`),b+=`<span class="pm-ftr__badge" style="color:${o.quality>=75?"var(--green)":o.quality>=50?"var(--amber)":o.quality>=25?"var(--orange)":"var(--red)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${o.quality}/100 — ${o.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${b}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function Ka(o,e,t,n,i,a,r){const s=je(o.awardedTick+o.totalTicks);je(o.awardedTick+o.totalTicks);const l=je(o.awardedTick),c=[{label:"Budget",value:me(o.budget),sub:`${n}% spent`,color:t},{label:"Spent",value:me(o.spent),color:"var(--red)"},{label:"Remaining",value:me(i),color:"var(--green)"},{label:"Quality",value:`${o.quality}/100`,sub:o.qualityLabel,color:o.quality>=75?"var(--green)":o.quality>=50?"var(--amber)":o.quality>=25?"var(--orange)":"var(--red)"},{label:"Workforce",value:`${o.laborCount}/${o.wfNeeded}`,sub:`Bid: ${o.laborCount}`,color:o.laborCount<o.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${a} ticks`,sub:r?"OVERDUE":`Deadline: ${s}`,color:r?"var(--red)":"var(--text-bright)"}];let f="";f+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${x(e.description||e.name)}</div>
    </div></div>`,f+='<div class="pm-metrics">';for(const y of c)f+=`<div class="pm-metric">
            <div class="pm-metric__label">${y.label}</div>
            <div class="pm-metric__value" style="color:${y.color}">${y.value}</div>
            ${y.sub?`<div class="pm-metric__sub">${x(y.sub)}</div>`:""}
        </div>`;f+="</div>",f+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${l}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${r?"var(--red)":"var(--text-bright)"};font-weight:700">${s}</span></span>
        </div>
    </div></div>`;const p=e.modifiers||[];p.length>0&&(f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Building Modifiers</div>',f+='<div style="display:flex;flex-wrap:wrap;gap:4px;">',f+=xi(p),f+="</div></div></div>");const u=[];if((e.sector==="civil_engineering"||e.sector==="industrial"||e.sector==="mega_project")&&(u.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),u.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),e.sector!=="civil_engineering"&&u.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),u.length>0){f+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const y of u)f+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${x(y.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;f+="</div></div>"}f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Workforce Assignment</div>';const m=[{key:"general",label:"General Workers",corpAvail:o.corpGeneral,color:"var(--text-primary)"},{key:"skilled",label:"Skilled Workers",corpAvail:o.corpSkilled,color:"var(--blue)"},{key:"innovative",label:"Innovative Workers",corpAvail:o.corpInnovative,color:"var(--purple)"}];for(const y of m){const $=Number(o.reqWf[y.key]||0);if($===0)continue;const h=Number(o.assignedWf[y.key]||0),T=h>=$?"var(--green)":h>0?"var(--amber)":"var(--red)",C=y.corpAvail>0&&h<$,w=Math.min(y.corpAvail,$-h),I=h>0;f+='<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-hair);font-size:0.72rem;">',f+="<div>",f+=`<span style="color:${y.color};font-weight:600;">${y.label}</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Required: <strong>${$}</strong></span>`,f+=`<span style="color:${T};margin-left:8px;font-weight:700;">${h} assigned</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Pool: ${y.corpAvail}</span>`,f+="</div>",f+='<div style="display:flex;gap:4px;">',C&&(f+=`<button onclick="pmAssignWorkers('${y.key}',${w})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Assign ${w}</button>`),I&&(f+=`<button onclick="pmUnassignWorkers('${y.key}',${h})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Remove ${h}</button>`),f+="</div></div>"}const v=Number(o.reqWf.general||0)+Number(o.reqWf.skilled||0)+Number(o.reqWf.innovative||0),b=Number(o.assignedWf.general||0)+Number(o.assignedWf.skilled||0)+Number(o.assignedWf.innovative||0);return v>0&&b<v&&(f+='<div style="font-size:0.62rem;color:var(--red);margin-top:6px;font-family:var(--font-mono);">⚠ Project will STALL until workforce is fully assigned</div>'),f+="</div></div>",f}function Ja(o){if(o.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let e="";for(let t=0;t<o.events.length;t++){const n=o.events[t],i=o.expandedEvent===t,a=n.status==="ACTIVE",r=si[n.type]||si.WEATHER,s=li[n.severity]||li.LOW;if(e+=`<div class="pm-evt ${a?"pm-evt--active":"pm-evt--resolved"}" style="${a?`border-left-color:${r.color}`:""}">`,e+=`<div class="pm-evt__header" onclick="pmToggleEvent(${t})" style="${i?`background:${r.bg}`:""}">`,e+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${r.color};background:${r.bg};border:1px solid ${r.border}">${n.type}</span>
            <span class="pm-evt__sev-badge" style="color:${s}">${n.severity}</span>
            <span class="pm-evt__status" style="color:${a?"var(--red)":"var(--text-dim)"};font-weight:${a?"700":"400"}">${a?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,e+=`<div class="pm-evt__title">${x(n.title)}</div>`,e+=`<div class="pm-evt__meta">Tick ${n.tick} · ${x(n.id||"")}</div>`,i){if(e+='<div class="pm-evt__body">',e+=`<div class="pm-evt__desc">${x(n.desc)}</div>`,n.impact&&(e+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${x(n.impact)}</span>
                </div>`),a&&n.responses&&n.responses.length>0){e+='<div class="pm-evt__resp-title">Response Options</div>';for(let l=0;l<n.responses.length;l++){const c=n.responses[l],f=o.selectedResponse===l,u={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[c.tag]||"var(--text-secondary)";e+=`<div class="pm-resp${f?" selected":""}" style="${f?`border-color:${u}`:""}" onclick="event.stopPropagation();pmSelectResponse(${l})">`,e+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${x(c.label)}</span>
                            <span class="pm-resp__tag" style="color:${u};background:${u}12;border:1px solid ${u}25">${c.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${c.delay>0?"var(--orange)":"var(--green)"}">
                            ${c.delay>0?`+${c.delay} tick${c.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,e+=`<div class="pm-resp__detail">${x(c.detail)}</div>`,e+='<div class="pm-resp__costs">',c.cost&&(e+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${me(c.cost)}</span>`),c.qualityImpact&&c.qualityImpact!==0&&(e+=`<span class="pm-resp__cost" style="color:${c.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${c.qualityImpact>0?"+":""}${c.qualityImpact}</span>`),!c.cost&&(!c.qualityImpact||c.qualityImpact===0)&&(e+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),e+="</div>",f&&(e+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${u}" onclick="event.stopPropagation();confirmEventResponse('${n.id}','${c.key}')">CONFIRM</button>
                        </div>`),e+="</div>"}}!a&&n.resolution&&(e+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${x(n.resolution)}</div>
                </div>`),e+="</div>"}e+="</div></div>"}return e}function Xa(o){if(o.materials.length===0)return'<div class="pm-evt-empty">No materials required for this project.</div>';let e='<div class="pm-tab-header">Project Materials</div>';for(const t of o.materials){const n=t.required>0?Math.round(t.allocated/t.required*100):0;t.allocated>0&&Math.round(t.consumed/t.allocated*100);const i=t.allocated>=t.required,a=i?"var(--green)":t.allocated>0?"var(--amber)":"var(--red)",r=i?"FULLY ALLOCATED":t.allocated>0?"PARTIAL":"NONE ALLOCATED";e+='<div class="pm-mat" style="margin-bottom:14px;">',e+=`<div class="pm-mat__row1">
            <div class="pm-mat__left">
                <span class="pm-mat__name">${x(t.name)}</span>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:${a};">${t.allocated} / ${t.required} allocated · ${r}</span>
        </div>`,e+=`<div class="pm-mat__bar-row">
            <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${n}%;background:${a};"></div></div>
            <span class="pm-mat__pct">${t.consumed} consumed</span>
        </div>`;const s=["STD","LOW","HIGH"],l=t.required-t.allocated;for(const c of s){const f=t.warehouseStock[c]||{qty:0},p=t.tiers[c]||{qty:0,consumed:0},u=p.qty-p.consumed;if(f.qty===0&&p.qty===0)continue;const m=c==="HIGH"?"var(--green)":c==="LOW"?"var(--orange)":"var(--text-muted)",v=c==="HIGH"?"HIGH":c==="LOW"?"LOW":"STD";if(e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border-hair);font-size:0.7rem;">',e+='<div style="display:flex;align-items:center;gap:6px;">',e+=`<span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${m};width:32px;">${v}</span>`,e+=`<span style="color:var(--text-dim);">Warehouse: <strong style="color:var(--text-primary);">${f.qty}</strong></span>`,p.qty>0&&(e+=`<span style="color:var(--text-dim);margin-left:8px;">Allocated: <strong style="color:var(--text-primary);">${p.qty}</strong></span>`),e+="</div>",e+='<div style="display:flex;gap:4px;">',f.qty>0&&l>0){const b=Math.min(f.qty,l);e+=`<button class="pm-alloc-btn" onclick="pmAllocateMaterial('${t.key}','${c}',${b})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Allocate ${b}</button>`}u>0&&(e+=`<button class="pm-alloc-btn" onclick="pmDeallocateMaterial('${t.key}','${c}',${u})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Return ${u}</button>`),e+="</div></div>"}e+="</div>"}return e}function Za(o){if(o.equipment.length===0)return'<div class="pm-evt-empty">No equipment required for this project.</div>';let e='<div class="pm-tab-header">Project Equipment</div>';for(const t of o.equipment){const n=t.condition>=75?"var(--green)":t.condition>=50?"var(--amber)":t.condition>=25?"var(--orange)":"var(--red)",i=t.assignedToProject>=t.required,a=t.assignedToProject>0&&t.assignedToProject<t.required,r=i?"var(--green)":a||t.ownedTotal>0?"var(--amber)":"var(--red)",s=i?`${t.assignedToProject}/${t.required} DEPLOYED`:a?`${t.assignedToProject}/${t.required} PARTIAL`:t.ownedTotal>0?"NOT DEPLOYED":"NOT OWNED";e+=`<div class="pm-eq" style="margin-bottom:12px;">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${x(t.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${r};margin-left:8px;">${s}</span>
                </div>
            </div>`,t.assignedToProject>0&&(e+=`<div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${t.condition}%;background:${n}"></div></div>
                <span class="pm-eq__cond-val" style="color:${n}">${t.condition}%</span>
            </div>`);const l=Math.min(t.available,t.required-t.assignedToProject);e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:0.7rem;">',e+=`<span style="color:var(--text-dim);">Required: <strong style="color:${i?"var(--green)":"var(--red)"}">${t.required}</strong>`,e+=` · Owned: <strong style="color:var(--text-primary);">${t.ownedTotal}</strong>`,e+=` · Available: <strong style="color:var(--text-primary);">${t.available}</strong></span>`,e+='<div style="display:flex;gap:4px;">',l>0&&(e+=`<button onclick="pmDeployEquipment('${t.key}',${l})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Deploy ${l}</button>`),t.assignedToProject>0&&(e+=`<button onclick="pmUndeployEquipment('${t.key}')" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Undeploy</button>`),e+="</div></div>",e+="</div>"}return e}function je(o){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][o%12]}, ${2e3+Math.floor(o/12)}`}async function er(o,e){if(!d||!S)return;const t=prompt(`REQUEST CONSTRUCTION INSURANCE
`+"─".repeat(35)+`

Describe what this policy should cover:

e.g., "Full coverage for weather delays, material damage, and labor disputes during construction. Should cover cost overruns up to 20% of budget."

Insurance corps will see this in their Deal Flow.`);if(t===null)return;const n=t.trim()||"Construction Insurance",i=S.current_tick||0,{error:a}=await g.from("finance_loan_requests").insert({requesting_faction_id:d.id,nation_id:d.nation_id,request_type:"insurance",insured_contract_id:o,amount:e,term_months:0,purpose:n,status:"open",created_tick:i,expires_tick:i+12});if(a){a.message.includes("duplicate")||a.message.includes("unique")?alert("Insurance already requested for this project."):alert("Failed to request insurance: "+a.message);return}alert("Insurance request posted to Deal Flow. Insurance corporations can now offer coverage."),await ki()}window.requestInsurance=er;window.openProjectModal=it;window.closeProjectModal=Va;window.pmSetTab=Wa;window.pmToggleEvent=Ya;window.pmSelectResponse=Qa;window.pmAllocateMaterial=Da;window.pmDeallocateMaterial=ja;window.pmDeployEquipment=Ha;window.pmUndeployEquipment=Ga;window.pmAssignWorkers=Fa;window.pmUnassignWorkers=Ua;async function wi(o){if(!O)return;const{data:e,error:t}=await g.from("construction_events").select("*").eq("contract_id",o).order("fired_at_tick",{ascending:!1});t?(console.warn("Failed to load project events:",t.message),O.events=[]):O.events=(e||[]).map(n=>({id:n.id,type:n.type,severity:n.severity,tick:n.fired_at_tick,title:n.title,desc:n.description,impact:n.impact,status:n.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:n.resolution,responses:n.responses||[]})),Xe()}let Ho=!1;async function tr(o,e){if(!(Ho||!O)){Ho=!0;try{const{data:t,error:n}=await g.rpc("resolve_construction_event",{p_event_id:o,p_response_key:e});if(n){console.error("Failed to resolve event:",n.message),alert("Failed to submit response: "+n.message);return}const i=typeof t=="string"?JSON.parse(t):t;if(i?.error){alert("Error: "+i.error);return}await wi(O.project.id),await ki(),i?.quality_applied&&i.quality_applied!==0&&(O.quality=Math.max(0,Math.min(100,O.quality+i.quality_applied)),O.qualityLabel=O.quality>=75?"EXCELLENT":O.quality>=50?"FAIR":O.quality>=25?"POOR":"BAD"),Xe()}finally{Ho=!1}}}window.confirmEventResponse=tr;function Le(o,e,t){const n=t?` style="color:${t}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${x(o)}</span>
        <span class="cd-detail-row__value"${n}>${x(e)}</span>
    </div>`}function or(o){const e={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},t=o.drawing_number||o.contract_number+"-A1",n=S?.current_date||"",i=n?n.replace(/,\s*/," "):"",a=o.spec_category==="Heavy Infrastructure",r=o.spec_category==="Megaproject";let s=x(o.project_subtype||o.project_type||"STRUCTURE"),l=a?"80.0m":r?"200.0m":"60.0m",c=a?"40.0m":r?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${e.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(f,p)=>`<line x1="${p*20}" y1="0" x2="${p*20}" y2="200" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(f,p)=>`<line x1="0" y1="${p*20}" x2="680" y2="${p*20}" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${e.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${e.accent}" font-family="var(--font-mono)" font-weight="700">${s.toUpperCase()}</text>
        <text x="340" y="100" text-anchor="middle" font-size="6" fill="${e.text}" font-family="var(--font-mono)">${x(o.name)}</text>

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
        <text x="645" y="93" text-anchor="middle" font-size="5.5" fill="${e.dim}" font-family="var(--font-mono)" transform="rotate(90,645,93)">${c}</text>

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
        <text x="630" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${x(i)}</text>

        <!-- North arrow -->
        <g transform="translate(470,172)">
            <line x1="0" y1="12" x2="0" y2="0" stroke="${e.accent}" stroke-width="0.8"/>
            <polygon points="-3,4 0,0 3,4" fill="${e.accent}"/>
            <text x="0" y="-3" text-anchor="middle" font-size="5" fill="${e.text}" font-family="var(--font-mono)">N</text>
        </g>
    </svg>`}async function Ze(){if(!d||!d.nation_id)return;const{data:o,error:e}=await g.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(e)console.warn("Failed to load contracts:",e.message),dt=[];else{const t=Number(d.corp_reputation??0);dt=(o||[]).filter(n=>t>=(n.min_reputation||0))}if(wt={},d&&dt.length>0){const t=dt.map(i=>i.id),{data:n}=await g.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",d.id).in("contract_id",t);for(const i of n||[])wt[i.contract_id]=i}hi()}function nr(){const o=document.getElementById("ap-list"),e=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=J.length+" ACTIVE",J.length===0){o.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,e.style.display="none";return}const t=S?.current_tick||0;let n=0,i=0,a="";for(const r of J){const s=r.issuer_type==="GOVERNMENT",l=s?"gov":"private",c=Array.isArray(r.contract_bids)?r.contract_bids[0]:r.contract_bids,f=c?.bid_price||0,p=c?.estimated_cost||0,u=c?.estimated_quality||0,m=r.budget_ceiling||0,v=r.awarded_at_tick||t,b=r.stalled_ticks||0,y=Math.max(0,t-v),$=Math.max(0,y-b),h=r.timeline_ticks||8,k=Math.max(0,h-$),T=Math.min(100,Math.round($/h*100)),C=$>h,w=b>0;let I="";if(w){const E=r.required_workforce||{},q=r.workers_assigned||{},L=[];(Number(q.general)||0)<(Number(E.general)||0)&&L.push("General: "+(Number(q.general)||0)+"/"+(Number(E.general)||0)),(Number(q.skilled)||0)<(Number(E.skilled)||0)&&L.push("Skilled: "+(Number(q.skilled)||0)+"/"+(Number(E.skilled)||0)),(Number(q.innovative)||0)<(Number(E.innovative)||0)&&L.push("Innovative: "+(Number(q.innovative)||0)+"/"+(Number(E.innovative)||0)),L.length>0?I="Workers needed — "+L.join(", "):I="Materials needed — allocate from warehouse"}bi(r.sector);const R=zn(r.sector);n+=m,i+=f,a+=`<div class="ap-item" onclick="openProjectModal('${r.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${x(r.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${x(r.issuer_name||"—")} · ${R}</div>
                </div>
                <span class="oc-item__type-badge ${l}">${s?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS${w?' <span style="color:var(--orange);font-weight:700;font-size:7px;">⚠ STALLED ('+b+" ticks) — "+x(I)+"</span>":""}</span>
                    <span class="ap-budget__values" style="color:${C?"var(--red)":w?"var(--orange)":"var(--teal)"}">
                        ${$}/${h} ticks ${C?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${T}%;background:${C?"var(--red)":w?"var(--orange)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${me(f)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${me(p)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${u>=70?"var(--green)":u>=40?"var(--teal)":"var(--orange)"}">${u}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${C?"var(--red)":"var(--text-bright)"}">${k} ticks</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">INSURANCE</div>
                    ${r._hasInsurance?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--green);">INSURED</div>':r._insurancePending?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--orange);">PENDING</div>':`<div class="ap-detail-cell__value" style="font-size:8px;cursor:pointer;color:#aa7a5a;font-weight:700;text-decoration:underline;" onclick="event.stopPropagation();requestInsurance('${r.id}',${m})">INSURE</div>`}
                </div>
            </div>
        </div>`}o.innerHTML=a,e.style.display=J.length>0?"":"none",J.length>0&&(document.getElementById("ap-total-crew").textContent=J.length,document.getElementById("ap-total-budget").textContent=me(n),document.getElementById("ap-total-spent").textContent=me(i))}async function ki(){if(!d)return;const{data:o,error:e}=await g.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",d.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",d.id).order("awarded_at_tick",{ascending:!0});if(e?(console.warn("Failed to load active projects:",e.message),J=[]):J=o||[],J.length>0){const t=J.map(s=>s.id),{data:n}=await g.from("finance_loan_requests").select("insured_contract_id, status").eq("request_type","insurance").in("insured_contract_id",t),{data:i}=await g.from("finance_active_loans").select("request_id, finance_loan_requests!inner(insured_contract_id)").in("status",["current"]).eq("finance_loan_requests.request_type","insurance"),a=new Set((i||[]).map(s=>s.finance_loan_requests?.insured_contract_id).filter(Boolean)),r=new Set((n||[]).filter(s=>s.status==="open").map(s=>s.insured_contract_id));for(const s of J)s._hasInsurance=a.has(s.id),s._insurancePending=r.has(s.id)}nr()}const Eo=3e4;function Co(){let o=0,e=0;for(const t of Bt)for(const n of Cn){const i=Z[t.key]?.[n];i&&(o+=i.qty,e+=i.value)}return{totalUnits:o,totalValue:e}}function In(){const o=document.getElementById("wh-list"),{totalUnits:e,totalValue:t}=Co();document.getElementById("wh-count").textContent=e.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=P(t);const n=Math.round(e/Eo*100),i=document.getElementById("wh-capacity");i.textContent=n+"%",i.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)";let a="";for(let r=0;r<Bt.length;r++){const s=Bt[r],l=un===r,c=Z[s.key]?.LOW||{qty:0,value:0},f=Z[s.key]?.STD||{qty:0,value:0},p=Z[s.key]?.HIGH||{qty:0,value:0},u=c.qty+f.qty+p.qty,m=c.value+f.value+p.value,v=u===0,b=Ge(s.key,"LOW",z),y=Ge(s.key,"STD",z),$=Ge(s.key,"HIGH",z),h=c.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",k=f.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",T=$.available?p.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(a+='<div class="wh-row">',a+=`<div class="wh-row__collapsed${l?" expanded":""}" onclick="toggleWhRow(${r})">
            <span class="wh-row__arrow">${l?"▾":"▸"}</span>
            <span class="wh-row__name${v?" empty":""}">${x(s.name)}</span>
            <div class="wh-row__dots">
                <div class="${h}"></div>
                <div class="${k}"></div>
                <div class="${T}"></div>
            </div>
            <span class="wh-row__qty${v?" empty":""}">${u>0?u.toLocaleString():"—"}</span>
            <span class="wh-row__val${v?" empty":""}">${m>0?P(m):"—"}</span>
        </div>`,l){a+='<div class="wh-expand">',a+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const C=[{key:"LOW",label:"Low",data:c,avail:b,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:f,avail:y,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:p,avail:$,color:"var(--green)",dotClass:"wh-dot--high"}];for(const w of C){const I=!w.avail.available,R=w.data.qty>0,E=R?"$"+Math.round(w.data.value/w.data.qty):"—";a+=`<div class="wh-grade${I?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${w.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${I?"var(--red)":w.color}">${w.label}</span>
                        ${I?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${R?"var(--text-bright)":"var(--text-dim)"}">${R?w.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${w.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${w.data.value>0?P(w.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${E}</span>
                </div>`}for(const w of C)!w.avail.available&&w.avail.failedStat&&(a+=`<div class="wh-lock">
                        <span class="wh-lock__text">${w.label.toUpperCase()} GRADE LOCKED — ${x(w.avail.failedStat)} &lt; ${w.avail.failedMin}</span>
                    </div>`);a+="</div>"}a+="</div>"}o.innerHTML=a}function ir(o){un=un===o?-1:o,In()}async function Ei(){if(!d)return;const{data:o,error:e}=await g.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",d.id);Z={};const t=[];if(e)console.warn("Failed to load warehouse:",e.message);else if(o){for(const n of o){const i=po(n.material_key);Z[i]||(Z[i]={}),Z[i][n.quality_tier]={qty:n.quantity||0,value:Number(n.total_value)||0},i!==n.material_key&&t.push(n)}if(t.length>0){const n=t.map(i=>({faction_id:d.id,nation_id:d.nation_id,material_key:po(i.material_key),quality_tier:i.quality_tier,quantity:i.quantity||0,total_value:Number(i.total_value)||0,updated_at:new Date().toISOString()}));await g.from("corp_warehouse").upsert(n,{onConflict:"faction_id,material_key,quality_tier"});for(const i of t)await g.from("corp_warehouse").delete().eq("faction_id",d.id).eq("material_key",i.material_key).eq("quality_tier",i.quality_tier)}}In()}const ar={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function rr(){const o=(z?.name||d?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+o;const e=Number(d?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=P(e);const{totalUnits:t}=Co(),n=Math.round(t/Eo*100),i=document.getElementById("pr-wh-capacity");i.textContent=n+"%",i.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)",Ci(),Nn(),To()}function Ci(){const o=document.getElementById("pr-mat-grid");let e="";for(const t of Bt){const n=de===t.key,i=Cn.every(r=>!Ge(t.key,r,z).available),a="pr-mat-btn"+(n?" active":"")+(i?" all-locked":"");e+=`<span class="${a}" onclick="setPrMat('${t.key}')">${x(t.name)}</span>`}o.innerHTML=e}function Nn(){const o=document.getElementById("pr-tier-bar");let e='<span class="pr-tier-label">GRADE</span>';for(const t of Cn){const n=Ge(de,t,z),i=X===t,a=n.available?Tn(de,t,z):null,r=mi[t],s=!n.available,l="pr-tier-btn"+(i?" active":"")+(s?" locked":"");e+=`<div class="${l}" onclick="${s?"":`setPrTier('${t}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${r};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${i?"var(--text-bright)":"var(--text-dim)"}">${fn[t]}</span>
            </div>
            ${a!==null?`<div class="pr-tier-btn__price" style="color:${i?"var(--text-bright)":"var(--text-muted)"}">$${a}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}o.innerHTML=e}function To(){const o=document.getElementById("pr-content"),e=Ge(de,X,z),t=Bt.find(C=>C.key===de);if(!t)return;if(!e.available){o.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${x(t.name)} — ${fn[X]} grade
                    is not produced domestically in ${x(z?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${x(e.failedStat||"unknown")} &lt; ${e.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const n=Tn(de,X,z),i=fi(de,X,z),a=n*he,r=i>3e3?"LOW":i>1e3?"MODERATE":"HIGH",s=r==="LOW"?"var(--green)":r==="MODERATE"?"var(--amber)":"var(--red)",l=Number(z?.inflation??50),c=l>55?"up":l<45?"down":"flat",f=c==="up"?"&#9650;":c==="down"?"&#9660;":"&#8212;",p=c==="up"?"var(--red)":c==="down"?"var(--green)":"var(--text-dim)";let u="";u+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${n}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${p}">${f}</span>
                </div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">SUPPLY/TICK</div>
                <div class="pr-market-cell__value" style="font-size:14px;color:var(--text-bright);margin-top:2px;">${i.toLocaleString()}</div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">DEMAND</div>
                <div class="pr-market-cell__value" style="font-size:12px;color:${s};margin-top:2px;">${r}</div>
            </div>
        </div>
    </div>`,u+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${x(z?.name||"—")})</div>`;for(const C of t.priceDrivers){const w=Number(z?.[C]??50),I=w>=50?"var(--green)":w>=30?"var(--amber)":w>=15?"var(--orange)":"var(--red)",R=ar[C]||C;u+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${x(C)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${w}%;background:${I}"></div>
            </div>
            <span class="pr-driver-row__val">${w}</span>
            <span class="pr-driver-row__effect">${x(R)}</span>
        </div>`}u+="</div>";const v=(Number(d?.corp_cash_reserves)||0)>=a,b=he>i,{totalUnits:y}=Co(),$=Eo-y,h=he>$,k=$<=0,T=mi[X];u+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${x(t.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${T};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${T}">${fn[X]}</span>
                </div>
                <span class="pr-order__mat-price">$${n}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(C=>`<span class="pr-qty-btn${he===C?" active":""}" onclick="setPrQty(${C})">${C>=1e3?C/1e3+"k":C}</span>`).join("")}
                </div>
            </div>
            ${b?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${i.toLocaleString()} this tick</span>
            </div>`:""}
            ${k?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">WAREHOUSE FULL — no remaining capacity</span>
            </div>`:h?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS WAREHOUSE CAPACITY — ${$.toLocaleString()} units remaining</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${P(a)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${v&&!b&&!h&&!k?"":"disabled"}
                    title="${v?b?"Exceeds supply":k?"Warehouse full":h?"Exceeds warehouse capacity":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,o.innerHTML=u}function sr(o){de=o,X="STD";for(const e of["STD","HIGH","LOW"])if(Ge(o,e,z).available){X=e;break}Ci(),Nn(),To()}function lr(o){X=o,Nn(),To()}function dr(o){he=o,To()}let Go=!1;async function cr(){if(Go||!d||!z)return;const o=Tn(de,X,z),e=fi(de,X,z),t=o*he,n=Number(d.corp_cash_reserves)||0;if(t>n){alert("Insufficient cash reserves.");return}if(he>e){alert("Exceeds available supply this tick.");return}const{totalUnits:i}=Co(),a=Eo-i;if(a<=0){alert("Warehouse is full. Cannot purchase more materials.");return}if(he>a){alert(`Warehouse can only hold ${a.toLocaleString()} more units. Reduce quantity.`);return}Go=!0;const r=document.querySelector(".pr-purchase-btn");r&&(r.disabled=!0,r.textContent="...");try{const s=n-t,{error:l}=await g.from("factions").update({corp_cash_reserves:s}).eq("id",d.id);if(l)throw l;const c=po(de),f=Z[c]?.[X],p=(f?.qty||0)+he,u=(f?.value||0)+t,{error:m}=await g.from("corp_warehouse").upsert({faction_id:d.id,nation_id:d.nation_id,material_key:c,quality_tier:X,quantity:p,total_value:u,last_purchased_tick:S?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(m){const{error:v}=await g.from("factions").update({corp_cash_reserves:n}).eq("id",d.id);throw v&&console.error("Cash refund failed after warehouse error:",v.message),m}d.corp_cash_reserves=s,Z[c]||(Z[c]={}),Z[c][X]={qty:p,value:u},In(),rr(),r&&(r.textContent="PURCHASED",setTimeout(()=>{r.isConnected&&(r.disabled=!1,r.textContent="PURCHASE")},1500))}catch(s){r&&(r.disabled=!1,r.textContent="PURCHASE"),alert("Purchase failed: "+(s.message||"Unknown error"))}finally{Go=!1}}function Ti(o){const e=Ve||z;if(!e)return[];const t=ko(o);if(!t)return[];const n=Aa(o,e),i=[],a=Number(e?.inflation??50),r=Number(e?.fuel_prices??50);Number(e?.manufacturing_output??50);const s=Ve&&z&&Ve.id!==z.id;let l=null;if(s&&(l=Ma(e,z)),n.newAvailable>0){const c=ai(o,e),f=t.basePrice,p=Math.round(f*((a-50)/200)),u=Math.round(f*((r-50)/300));let m=c;const v=[{label:"Base price",value:P(f)},p!==0?{label:`Inflation (${a})`,mod:(p>=0?"+":"")+P(Math.abs(p))}:null,u!==0?{label:`Fuel transport (${r})`,mod:(u>=0?"+":"")+P(Math.abs(u))}:null].filter(Boolean),b=c-f-p-u;if(b!==0&&!s&&v.push({label:"Demand/scarcity",mod:(b>=0?"+":"")+P(Math.abs(b))}),s&&l){const y=Math.round(c*l.tariff),$=Math.round(c*l.transport);m=c+y+$,v.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+P(y)}),v.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+P($)})}i.push({seller:s?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:s?l?.deliveryTicks||1:0,condition:100,price:Math.round(m),available:n.newAvailable,delivery:s?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:s?l.deliveryTicks:0,used:!1,priceFactors:v,sourceNationId:e.id})}if(n.usedAvailable>0){const c=n.usedCondition,f=ai(o,e,{used:!0,condition:c});let p=f;const u=[{label:"Base price",value:P(t.basePrice)},{label:`Condition (${c}%)`,mod:"-"+P(Math.max(0,t.basePrice-f))}];if(s&&l){const m=Math.round(f*l.tariff),v=Math.round(f*l.transport);p=f+m+v,u.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+P(m)}),u.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+P(v)})}i.push({seller:s?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:s?l?.deliveryTicks||1:0,condition:c,price:Math.round(p),available:n.usedAvailable,delivery:s?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:s?l.deliveryTicks:0,used:!0,priceFactors:u,sourceNationId:e.id})}return i}function An(){const o=Number(d?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=P(o);const e=ko(fe),t=Pt[e?.tier||1],n=document.getElementById("em-tier-badge");n&&(n.textContent=t.tag,n.style.color=t.color),n.style.background=t.color+"0a",n.style.border="1px solid "+t.color+"33";const i=document.getElementById("em-nation-select");if(i&&i.options.length===0){const s=z?.name||d?.nation||"—";let l=`<option value="">${x(s)} (HQ)</option>`;for(const c of gi)c.id!==z?.id&&(l+=`<option value="${c.id}">${x(c.name)}</option>`);i.innerHTML=l}const a=document.getElementById("em-import-tag"),r=Ve&&z&&Ve.id!==z.id;a&&(a.style.display=r?"":"none"),pr(),Mn()}function pr(){let o="";for(let e=1;e<=3;e++){const t=Pt[e],n=mn(e),i=e===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";o+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${t.color}">${t.tag}</div>
            <div class="${i}">`;for(const a of n){const r=fe===a.key,s=Ti(a.key).length>0;o+=`<span class="em-selector__btn${r?" active":""}${s?"":" no-listings"}"
                style="${r?"background:"+t.color+";border-color:"+t.color:""}"
                onclick="setEmType('${a.key}')">${x(a.name)}</span>`}o+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${o}</div>`}function Mn(){const o=document.getElementById("em-content");if(qe=Ti(fe),qe.length===0){o.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}Ee>=qe.length&&(Ee=0);let e="";for(let n=0;n<qe.length;n++){const i=qe[n],a=Ee===n,r=i.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",s=ui(i.condition);e+=`<div class="em-listing${a?" selected":""}" style="${a?"border-left-color:"+r:""}" onclick="setEmListing(${n})">`,e+=`<div class="em-listing__row1">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="em-listing__seller">${x(i.seller)}</span>
                <span class="em-badge em-badge--${i.sellerType.toLowerCase()}">${i.sellerType}</span>
                ${i.used?'<span class="em-badge em-badge--used">USED</span>':""}
            </div>
        </div>`,e+=`<div class="em-listing__row2">
            <span class="em-listing__nation">${x((i.nation||"").toUpperCase())}</span>
            ${i.distance>0?`<span class="em-listing__distance">${i.distance} nation${i.distance>1?"s":""} away</span>`:""}
            <span class="em-listing__delivery">Delivery: ${x(i.delivery)}</span>
        </div>`,e+=`<div class="em-listing__stats">
            <div class="em-stat-cell" style="flex:1">
                <div class="em-stat-cell__label">COND.</div>
                <div class="em-stat-cell__bar">
                    <div class="em-stat-cell__bar-track"><div class="em-stat-cell__bar-fill" style="width:${i.condition}%;background:${s}"></div></div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${s}">${i.condition}%</span>
                </div>
            </div>
            <div class="em-stat-cell" style="flex:0.8;text-align:center">
                <div class="em-stat-cell__label">AVAIL.</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${i.available}</div>
            </div>
            <div class="em-stat-cell" style="flex:1.2">
                <div class="em-stat-cell__label">PRICE/UNIT</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${P(i.price)}</div>
            </div>
        </div>`,a&&i.priceFactors&&(e+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${i.priceFactors.map(l=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${x(l.label)}</span>
                    <span class="em-breakdown__mod" style="color:${l.mod?l.mod.startsWith("-")?"var(--green)":l.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${l.mod||l.value}</span>
                </div>`).join("")}
            </div>`),e+="</div>"}const t=qe[Ee];if(t){const n=ko(fe),i=Pt[n?.tier||1],a=Math.min(t.available,4),r=t.price*Te,s=(Number(d?.corp_cash_reserves)||0)>=r;e+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${x(n?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${x(t.seller)}</span>
                </div>
                <span class="em-purchase__price">${P(t.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:a},(l,c)=>c+1).map(l=>`<span class="em-qty-btn${Te===l?" active":""}" style="${Te===l?"background:"+i.color+";border-color:"+i.color:""}" onclick="setEmQty(${l})">${l}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${t.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${P(r)}</div>
                    ${t.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${x(t.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${i.color}" onclick="purchaseEquipment()"
                    ${s?"":"disabled"}
                    title="${s?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}o.innerHTML=e}async function fr(o){if(!o)Ve=null;else{let t=gi.find(n=>n.id===o);if(!t)try{const{data:n}=await g.from("nations").select("*").eq("id",o).single();t=n}catch{}Ve=t||null}Ee=0,Te=1;const e=document.getElementById("em-nation-select");e&&(e.value=o||""),An()}function mr(o){fe=o,Ee=0,Te=1,An()}function ur(o){Ee=o,Te=1,Mn()}function vr(o){Te=o,Mn()}let Vo=!1;async function yr(){if(Vo)return;const o=qe[Ee];if(!o||!d)return;const e=ko(fe);if(!e)return;const t=Te,n=o.price*t,i=Number(d.corp_cash_reserves)||0;if(n>i){alert("Insufficient cash reserves.");return}if(t>o.available){alert("Not enough units available.");return}const a=document.querySelector(".em-purchase-btn");a&&(a.disabled=!0,a.textContent="..."),Vo=!0;try{const r=i-n,{error:s}=await g.from("factions").update({corp_cash_reserves:r}).eq("id",d.id);if(s)throw s;const l=!o.deliveryTicks||o.deliveryTicks===0;if(l){const f=ae.find(k=>k.equipment_key===fe),p=(f?.owned||0)+t,u=f?.purchase_price_avg||0,m=f?.owned||0,v=m>0?Math.round((u*m+o.price*t)/p):o.price,b=e.maintenancePerUnit*p,y=f?.condition||100,$=Math.round((y*m+o.condition*t)/p),{error:h}=await g.from("corp_equipment").upsert({faction_id:d.id,nation_id:d.nation_id,equipment_key:fe,tier:e.tier,owned:p,deployed:f?.deployed||0,condition:$,maintenance_per_tick:b,purchase_price_avg:v,last_purchased_tick:S?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(h){const{error:k}=await g.from("factions").update({corp_cash_reserves:i}).eq("id",d.id);throw k&&console.error("Cash refund failed:",k.message),h}f?(f.owned=p,f.condition=$,f.maintenance_per_tick=b):ae.push({equipment_key:fe,tier:e.tier,owned:p,deployed:0,condition:$,maintenance_per_tick:b,assigned_projects:[]})}else{const f=(S?.current_tick||0)+o.deliveryTicks,{error:p}=await g.from("corp_equipment_deliveries").insert({faction_id:d.id,equipment_key:fe,quantity:t,condition:o.condition,delivery_tick:f,source_nation_id:o.sourceNationId||null,seller_name:o.seller,price_paid:n});if(p){const{error:u}=await g.from("factions").update({corp_cash_reserves:i}).eq("id",d.id);throw u&&console.error("Cash refund failed:",u.message),p}}d.corp_cash_reserves=r,jn(),An();const c=document.getElementById("pr-cash");c&&(c.textContent=P(r)),a&&(a.textContent=l?"PURCHASED":"ORDERED",setTimeout(()=>{a.isConnected&&(a.disabled=!1,a.textContent="PURCHASE")},1500))}catch(r){a&&(a.disabled=!1,a.textContent="PURCHASE"),alert("Purchase failed: "+(r.message||"Unknown error"))}finally{Vo=!1}}let gr=-1,ct=[],uo=[],bn=[];function Wo(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o.toLocaleString()}function xr(o,e,t){if(t)return"var(--orange)";const n=o/(e||1)*100;return n>50?"var(--green)":n>25?"var(--amber)":"var(--red)"}function di(){const o=document.getElementById("pm-list"),e=ct.length,t=uo.length,n=bn.length,i=ct.filter(l=>l.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${e})`,document.getElementById("pm-pending-count").textContent=`(${t})`,document.getElementById("pm-apply-count").textContent=`(${n})`;const a=document.getElementById("pm-badges");let r="";i>0&&(r+=`<span class="pm-badge pm-badge--expiring">${i} EXPIRING</span>`),t>0&&(r+=`<span class="pm-badge pm-badge--pending">${t} PENDING</span>`),a.innerHTML=r;const s=ct.reduce((l,c)=>l+(c.cost||0),0)+uo.reduce((l,c)=>l+(c.cost||0),0);document.getElementById("pm-total-cost").textContent=Wo(s),document.getElementById("pm-footer-active").textContent=e,document.getElementById("pm-footer-pending").textContent=t;{if(e===0){o.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let l="";ct.forEach((c,f)=>{const p=gr===f,u=xr(c.ticks_left,c.total_ticks,c.expiring_soon),m=Math.min(c.ticks_left/(c.total_ticks||1)*100,100);l+=`<div class="pm-item ${c.expiring_soon?"pm-item--expiring":""} ${p?"expanded":""}" onclick="togglePmExpand(${f})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${x(c.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${x((c.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${u}">Expires: ${x(c.expires||"")}</span>
                        <span class="pm-item__ticks">(${c.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${m}%;background:${u}"></div></div>`,p&&(l+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${x(c.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${x(c.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${Wo(c.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${c.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${c.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(c.projects||[]).map(v=>`<span class="pm-project-chip">${x(v)}</span>`).join("")}</div>
                    </div>`,c.note&&(l+=`<div class="pm-note"><span class="pm-note__text">${x(c.note)}</span></div>`),c.expiring_soon&&c.renewable&&(l+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew" onclick="event.stopPropagation(); pmApplyForPermit('${c.permit_key}');">RENEW — ${Wo(c.cost||0)}</button></div>`),l+="</div>"),l+="</div></div>"}),o.innerHTML=l;return}}let Yo=!1;async function br(o){if(!(Yo||!d||!z)){Yo=!0;try{const{data:e}=await g.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{data:n,error:i}=await g.rpc("apply_for_permit",{p_faction_id:d.id,p_nation_id:z.id,p_permit_key:o,p_current_tick:t});if(i){alert("Application failed: "+i.message);return}if(n&&!n.success){alert(n.error||"Application failed");return}alert("Permit application submitted! Processing: "+(n.processing_ticks||0)+" ticks."),await _r()}catch(e){alert("Error: "+e.message)}finally{Yo=!1}}}window.pmApplyForPermit=br;async function _r(){if(!d||!z){ct=[],uo=[],bn=[],di();return}const{data:o}=await g.from("construction_permits").select("*"),e=o||[],t={};for(const p of e)t[p.permit_key]=p;const{data:n}=await g.from("corp_permits").select("*").eq("faction_id",d.id).eq("nation_id",z.id),i=n||[],{data:a}=await g.from("active_laws").select("policy_id, policies(permit_key, policy_name)").eq("nation_id",z.id).not("policies.permit_key","is",null),r=new Set,s={};for(const p of a||[])p.policies?.permit_key&&(r.add(p.policies.permit_key),s[p.policies.permit_key]=p.policies.policy_name);const{data:l}=await g.from("shard").select("current_tick").eq("name","Alpha Shard").single(),c=l?.current_tick||0;ct=i.filter(p=>p.status==="active").map(p=>{const u=t[p.permit_key]||{},m=p.expires_at_tick?Math.max(0,p.expires_at_tick-c):999,v=u.duration_ticks||24;return{name:u.name||p.permit_key,permit_key:p.permit_key,nation:z.name,policy:s[p.permit_key]||"—",issued:p.granted_at_tick!=null?je(p.granted_at_tick):"—",expires:p.expires_at_tick?je(p.expires_at_tick):"Single-use",cost:p.cost_paid||0,ticks_left:m,total_ticks:v,expiring_soon:m<=3&&m>0,renewable:u.duration_ticks!=null,projects:[]}}),uo=i.filter(p=>p.status==="pending").map(p=>{const u=t[p.permit_key]||{},m=u.processing_ticks||2,v=c-p.applied_at_tick,b=Math.max(0,m-v);return{name:u.name||p.permit_key,permit_key:p.permit_key,nation:z.name,applied:je(p.applied_at_tick),status:"PROCESSING",processing_total:m,ticks_remaining:b,est_approval:je(p.applied_at_tick+m),cost:p.cost_paid||0,required_by:s[p.permit_key]||"—"}});const f=new Set(i.filter(p=>p.status==="active"||p.status==="pending").map(p=>p.permit_key));bn=[...r].filter(p=>!f.has(p)).map(p=>{const u=t[p]||{};return{name:u.name||p,permit_key:p,nation:z.name,description:u.description||"",policy:s[p]||"—",cost:u.cost_is_percentage?15e4:u.cost||0,processing_time:u.processing_ticks||2,duration:u.duration_ticks?u.duration_ticks+" ticks":"Single-use",category:u.category||"",difficulty:u.difficulty||"EASY"}}),di()}let Qo=!1,Ko=!1;function Si(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+Math.round(o/1e3)+"k":"$"+Math.round(o)}async function Rn(){var{data:o,error:e}=await g.from("factions").select("*").eq("id",d.id).single();if(e){console.warn("Faction refresh failed:",e.message);return}o&&(d=o);var t=document.getElementById("topbar-cash");t&&(t.textContent="CASH: "+Si(Number(d.corp_cash_reserves??0)))}const _n={CRITICAL:"#c55",HIGH:"#5c5",MODERATE:"#ca5",LOW:"#6a6660"};let yt=[],Ln=[],zi="ready",Nt=null,vo="ALL",te=-1;const yo={COASTAL:{color:"#8b9a6b",label:"COASTAL"},INTERNATIONAL:{color:"#5a8aaa",label:"INTL"},GOVERNMENT:{color:"#c8a832",label:"GOV CONTRACT"}};function hr(o){vo=o,te=-1,document.querySelectorAll(".ar-pill").forEach(e=>{const t=e.getAttribute("data-ar-filter");e.className="ar-pill"+(t===o?" active-"+(o==="ALL"?"all":o==="COASTAL"?"coastal":o==="INTERNATIONAL"?"intl":"gov"):"")}),On()}const $r=1.2,wr=.7;function kr(o){return o&&o.trade_agreement_id?$r:wr}function Er(o){return Math.round(Number(o?.estimated_revenue||0)*kr(o))}function qn(){return(vo==="ALL"?yt:yt.filter(e=>e.scope===vo)).slice().sort((e,t)=>{const n=e.trade_agreement_id?0:1,i=t.trade_agreement_id?0:1;return n-i})}async function So(){if(!d||d.corp_sector!=="Shipping")return;const o=await Sa(g,d.id,d.corp_subsector);yt=o.routes,Ln=o.applications,zi=o.state,Nt=o.error,Nt&&console.warn("Failed to load available routes:",Nt.message),te=-1,On()}var Cr={fuel_energy:[{stat:"industrialization",label:"Industrialization"},{stat:"urbanization",label:"Urbanization"}],minerals:[{stat:"industrialization",label:"Industrialization"},{stat:"manufacturing",label:"Manufacturing"}],grains_staples:[{stat:"population_growth",label:"Population Growth"},{stat:"food_security",label:"Food Security"}],livestock_dairy:[{stat:"standard_of_living",label:"Std of Living"},{stat:"food_security",label:"Food Security"}],cash_crops:[{stat:"trade_balance",label:"Trade Balance"},{stat:"foreign_investment",label:"Foreign Investment"}],manufactured_goods:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],technology:[{stat:"technology",label:"Technology"},{stat:"higher_education",label:"Higher Education"}],fruits_vegetables:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],arms:[{stat:"military_spending",label:"Military Spending"},{stat:"stability",label:"Stability"}]};function Tr(o){return Cr[o]||[]}function Sr(o){var e=Number(o.competition_count||0),t=o.demand_level||"",n=o.scope==="GOVERNMENT";return n?"Fixed payment. No demand risk. Vessel locked for contract duration.":e===0&&t==="CRITICAL"?"Unserved critical corridor. High volume, no competition — claim immediately.":e===0&&t==="HIGH"?"Virgin route with strong demand. First-mover advantage available.":e===0?"No competition on this route. Market share starts at 100%.":t==="CRITICAL"&&e<=2?"Underserved critical route. Demand exceeds current capacity.":t==="LOW"?"Thin route. Revenue may not justify vessel deployment.":e>=3?"Crowded route. Market share will be split "+(e+1)+" ways.":Number(o.tariff_rate||0)>15?"High tariff rate cuts into margins. Watch for trade policy changes.":null}function On(){const o=qn();document.getElementById("ar-count").textContent=yt.length+" ROUTES";var e={COASTAL:0,INTERNATIONAL:0,GOVERNMENT:0};yt.forEach(function($){e[$.scope]!==void 0&&e[$.scope]++});var t=e.COASTAL,n=e.INTERNATIONAL,i=e.GOVERNMENT;document.getElementById("ar-footer-counts").innerHTML='<div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#8b9a6b"></div><span class="ar-footer__count-label">COASTAL</span><span class="ar-footer__count-num">'+t+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#5a8aaa"></div><span class="ar-footer__count-label">INTL</span><span class="ar-footer__count-num">'+n+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#c8a832"></div><span class="ar-footer__count-label">GOV</span><span class="ar-footer__count-num">'+i+"</span></div>";const a=document.getElementById("ar-claim-btn");a.className="ar-claim-btn"+(te>=0?" active":"");const r=document.getElementById("ar-list");if(zi==="error"){r.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+x(Nt&&Nt.message||"Shipping routes are temporarily unavailable.")+"</div></div>";return}if(o.length===0){r.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+(yt.length===0?"No routes available.<br>Routes are generated from bilateral<br>trade each tick. Check back after<br>the next corp tick fires.":"No "+vo.toLowerCase()+" routes available.")+"</div></div>";return}let s="";for(let $=0;$<o.length;$++){const h=o[$],k=te===$,T=yo[h.scope]||yo.INTERNATIONAL,C=h.scope==="GOVERNMENT",w=h.demand_level&&_n[h.demand_level]?{color:_n[h.demand_level],label:h.demand_level}:null,I=Number(h.competition_count||0),R=I===0?"#5c5":I<=2?"#ca5":"#c84";if(s+='<div style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid '+(k?T.color:"transparent")+";background:"+(k?T.color+"08":"transparent")+';" onclick="arSelectRoute('+$+')"><div style="padding:8px 14px;">',s+='<div style="display:flex;align-items:center;gap:0;margin-bottom:4px;"><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+x(h.origin_port||"?")+'</span><div style="flex:1;display:flex;align-items:center;margin:0 8px;"><div style="flex:1;height:1px;background:'+T.color+'44"></div><span style="font-family:var(--font-mono);font-size:7px;color:'+T.color+';padding:0 6px">⚓</span><div style="flex:1;height:1px;background:'+T.color+'44"></div></div><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+x(h.destination_port||"?")+"</span></div>",s+='<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;"><span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+T.color+";background:"+T.color+"12;border:1px solid "+T.color+'25">'+T.label+"</span>",w&&(s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+w.color+";background:"+w.color+"12;border:1px solid "+w.color+'25">'+w.label+" DEMAND</span>"),C&&h.gov_issuer&&(s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">'+x(h.gov_issuer)+"</span>"),I===0&&!C&&(s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15)">NO COMPETITION</span>'),h.trade_agreement_id&&!C){const E=h.trade_agreement_name?" · "+x(String(h.trade_agreement_name).slice(0,28)):"";s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.1);border:1px solid rgba(92,204,92,0.3)">ACTIVE AGREEMENT ×1.2'+E+"</span>"}else!h.trade_agreement_id&&!C&&(s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#9e9a92;background:rgba(158,154,146,0.06);border:1px solid rgba(158,154,146,0.15)">OPEN MARKET ×0.7</span>');var l=Ln.find(function(E){return E.route_id===h.id});if(l){var c=l.status==="approved"?"#5c5":"#c8a832",f=l.status==="approved"?"APPROVED":"APPLIED";s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+c+";background:"+c+"12;border:1px solid "+c+'25">'+f+"</span>"}if(s+='<span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-left:auto">'+(h.transit_ticks||"?")+" tick"+((h.transit_ticks||0)!==1?"s":"")+" · "+x(h.vessel_class||"?")+"</span>",s+="</div>",s+='<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">',C?(s+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(h.gov_contract_duration||h.transit_ticks||"?")+" ticks</div></div>",s+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VESSEL</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+x(h.vessel_class||"?")+"</div></div>",s+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT VALUE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-top:1px">'+P(Number(h.gov_contract_value||h.estimated_revenue||0))+"</div></div>"):(s+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VOLUME</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);margin-top:1px">'+P(Number(h.trade_volume||0))+"</div></div>",s+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">COMP.</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+R+';margin-top:1px">'+I+"</div></div>",s+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">TRANSIT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(h.transit_ticks||"?")+" tick"+((h.transit_ticks||0)!==1?"s":"")+"</div></div>",s+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">EST. REV</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+(h.trade_agreement_id?"#5c5":"#b0aa9a")+';margin-top:1px">'+P(Er(h))+"</div></div>"),s+="</div>",k){if(s+='<div style="margin-top:6px;">',C&&h.goods_description&&(s+='<div style="font-size:10px;color:var(--text-muted);line-height:1.5;margin-bottom:6px">'+x(h.goods_description)+"</div>"),h.trade_agreement_name&&(s+='<div style="padding:4px 8px;margin-bottom:5px;background:rgba(90,138,170,0.05);border:1px solid rgba(90,138,170,0.12)"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:var(--font-mono);font-size:7px;color:#5a8aaa;letter-spacing:0.5px">TRADE AGREEMENT</div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:1px">'+x(h.trade_agreement_name)+'</div></div><div style="text-align:right"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">TARIFF</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(Number(h.tariff_rate||0)>10?"#c84":"#5c5")+'">'+Number(h.tariff_rate||0).toFixed(1)+"%</div></div></div></div>"),s+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px">',s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VESSEL CLASS</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+x(h.vessel_class||"?")+"</span></div>",h.vessel_note&&(s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">REQUIREMENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+x(h.vessel_note)+"</span></div>"),s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">PROXIMITY</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+(h.proximity!=null?h.proximity:"?")+" / 100</span></div>",s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CARGO</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+x(h.goods_name||"Unknown")+"</span></div>",h.goods_description&&!C&&(s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CONTENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+x(h.goods_description)+"</span></div>"),s+='<div style="display:flex;justify-content:space-between;padding:2px 0"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VOLUME</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+Number(h.volume_physical||0).toLocaleString()+" "+x(h.volume_unit||"tons")+"</span></div>",s+="</div>",z&&!C){var p=Tr(h.trade_sector);if(p.length>0){s+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.8px;margin-bottom:3px">DEMAND DRIVERS</div>';for(var u=0;u<p.length;u++){var m=p[u],v=Number(z[m.stat]??50),b=v>=50?"#5c5":v>=30?"#ca5":"#c84";s+='<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);width:100px">'+x(m.label)+'</span><div style="width:40px;height:2px;background:var(--border-0)"><div style="width:'+v+"%;height:100%;background:"+b+'"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-bright)">'+Math.round(v)+"</span></div>"}s+="</div>"}}var y=Sr(h);y&&(s+='<div style="padding:4px 8px;background:'+T.color+"08;border:1px solid "+T.color+'15"><div style="font-size:9px;color:var(--text-muted);line-height:1.5">'+x(y)+"</div></div>"),s+="</div>"}s+="</div></div>"}r.innerHTML=s}function zr(o){te=te===o?-1:o,On()}let et=null,Ye=null,_e=0,oo=!1;async function Ir(o){const t=Math.round(57499.99999999999),n=5e4;if(!o)return{tier:"state",cost:15e4,ownerFactionId:null,ownerName:null};try{const{data:i}=await g.from("corp_properties").select("id, faction_id").eq("nation_id",o).eq("faction_id",d.id).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(i)return{tier:"own",cost:n,ownerFactionId:d.id,ownerName:d.faction_name};const{data:a}=await g.from("corp_properties").select("id, faction_id, factions!faction_id(faction_name)").eq("nation_id",o).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(a)return{tier:"other",cost:t,ownerFactionId:a.faction_id,ownerName:a.factions?.faction_name||"another corporation"}}catch(i){console.warn("[Depot lookup] failed:",i?.message||i)}return{tier:"state",cost:15e4,ownerFactionId:null,ownerName:null}}async function Nr(){if(!(te<0||!d||!S)){var o=qn(),e=o[te];if(e){var t=Ln.find(function(r){return r.route_id===e.id});if(t){alert("You have already applied for this route. Status: "+t.status);return}var n={"Bulk Cargo":"bulk_cargo","Container Freight":"container_freight","Specialized Transport":"specialized_transport"},i=n[d.corp_subsector]||"";if(e.shipping_subsector&&i!==e.shipping_subsector){var a=e.shipping_subsector.replace(/_/g," ").replace(/\b\w/g,function(r){return r.toUpperCase()});alert("Your fleet specializes in "+(d.corp_subsector||"?")+" but this route requires "+a+".");return}et=e,et.destDepot=await Ir(e.destination_nation_id),_e=Math.min(75e4,Math.max(25e4,Number(e.estimated_revenue)||5e5)),Ye=null,Pn()}}}function Bn(){et=null,document.getElementById("ra-modal-overlay")?.remove()}function Ar(o){Ye=o,Pn()}function Mr(o){_e=Number(o),Pn()}function Pn(){if(document.getElementById("ra-modal-overlay")?.remove(),!et)return;const o="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#5a8aaa",green:"#5c5",gold:"#c8a832",orange:"#c84",red:"#c55",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},t=et,n=yo[t.scope]||yo.INTERNATIONAL,i=Number(t.estimated_revenue||0),a=Math.round(i*.15),r=Math.round(i*.08),s=t.trade_agreement_id?1.2:.7,l=Math.round(_e*s),c=l-a-r,f=c>0?e.green:c<0?e.red:e.dim,p=ce.filter(h=>h.status==="in_port"&&!h.active_claim_id&&h.condition>=20),m=!!p.find(h=>h.id===Ye)&&_e>0;let v=`
    <div style="width:520px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;max-height:90vh;">
        <div style="padding:12px 20px;border-bottom:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:10px;color:${n.color}">●</span>
                <span style="font-family:${o};font-size:13px;font-weight:700;letter-spacing:2px;color:${e.muted};">ROUTE APPLICATION</span>
            </div>
            <span onclick="raClose()" style="font-family:${o};font-size:18px;color:${e.dim};cursor:pointer">×</span>
        </div>
        <div style="padding:14px 20px;overflow:auto;flex:1;">

            <div style="display:flex;align-items:center;gap:0;margin-bottom:12px;">
                <span style="font-size:14px;font-weight:700;color:${e.text}">${x(t.origin_port||"?")}</span>
                <div style="flex:1;display:flex;align-items:center;margin:0 10px;">
                    <div style="flex:1;height:1px;background:${n.color}44"></div>
                    <span style="font-family:${o};font-size:8px;color:${n.color};padding:0 8px">⚓ ${t.transit_ticks||"?"} tick${(t.transit_ticks||0)!==1?"s":""}</span>
                    <div style="flex:1;height:1px;background:${n.color}44"></div>
                </div>
                <span style="font-size:14px;font-weight:700;color:${e.text}">${x(t.destination_port||"?")}</span>
            </div>

            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};margin-bottom:14px;">
                <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border};">
                    <div style="font-family:${o};font-size:6px;color:${e.dim};letter-spacing:0.5px;">CARGO</div>
                    <div style="font-family:${o};font-size:9px;font-weight:700;color:${e.text};margin-top:1px;">${x(t.goods_name||"?")}</div>
                </div>
                <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border};">
                    <div style="font-family:${o};font-size:6px;color:${e.dim};letter-spacing:0.5px;">VESSEL REQ.</div>
                    <div style="font-family:${o};font-size:9px;font-weight:700;color:${e.text};margin-top:1px;">${x(t.vessel_class||"?")}</div>
                </div>
                <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border};">
                    <div style="font-family:${o};font-size:6px;color:${e.dim};letter-spacing:0.5px;">VOLUME</div>
                    <div style="font-family:${o};font-size:9px;font-weight:700;color:${e.text};margin-top:1px;">${P(Number(t.trade_volume||0))}</div>
                </div>
                <div style="flex:1;padding:4px 8px;">
                    <div style="font-family:${o};font-size:6px;color:${e.dim};letter-spacing:0.5px;">COMPETITION</div>
                    <div style="font-family:${o};font-size:9px;font-weight:700;color:${Number(t.competition_count||0)===0?e.green:e.orange};margin-top:1px;">${t.competition_count||0}</div>
                </div>
            </div>

            ${(()=>{const h=t.destDepot;if(!h)return"";const k=t.destination_port||"this port",T="$"+Math.round(h.cost).toLocaleString()+" / refuel";let C,w;return h.tier==="own"?(C=`${k} has your Fuel Depot (${x(h.ownerName||d.faction_name||"your corp")}) — ${T}.`,w=e.green):h.tier==="other"?(C=`${k} has a Fuel Depot (${x(h.ownerName||"another corp")}) — ${T}.`,w=e.gold):(C=`${k} has no fuel depot — paying ${T} to the government-owned depot.`,w=e.orange),`<div style="padding:7px 10px;margin-bottom:14px;background:${e.card};border:1px solid ${e.border};border-left:2px solid ${w};font-family:${o};font-size:9px;color:${e.text};line-height:1.5;">
                    <span style="color:${e.dim};font-size:7px;font-weight:700;letter-spacing:0.5px;">FUEL AT DESTINATION</span><br>
                    ${C}
                </div>`})()}

            ${(()=>{const h=!!t.trade_agreement_id,k=h?1.2:.7,T=h?e.green:e.dim,C=h?`ACTIVE TRADE AGREEMENT${t.trade_agreement_name?" · "+x(t.trade_agreement_name):""}`:"OPEN-MARKET ROUTE",w=h?`Revenue = your bid × ${k.toFixed(1)} (agreement bonus).`:`Revenue = your bid × ${k.toFixed(1)} (organic route penalty). Agreement-backed lanes pay more.`;return`<div style="padding:7px 10px;margin-bottom:14px;background:${e.card};border:1px solid ${e.border};border-left:2px solid ${T};font-family:${o};font-size:9px;color:${e.text};line-height:1.5;">
                    <span style="color:${e.dim};font-size:7px;font-weight:700;letter-spacing:0.5px;">${C}</span><br>
                    ${w}
                </div>`})()}

            <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">SELECT VESSEL</div>`;if(p.length===0)v+=`<div style="padding:14px;text-align:center;background:${e.card};border:1px solid ${e.border};margin-bottom:14px;">
            <div style="font-family:${o};font-size:10px;color:${e.red};">No available vessels</div>
            <div style="font-family:${o};font-size:8px;color:${e.dim};margin-top:4px;">You need a vessel in port, not assigned to another route, with condition ≥ 20%.</div>
        </div>`;else{v+='<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:14px;">';for(const h of p){const k=Ye===h.id,T=h.condition>=75?e.green:h.condition>=50?e.gold:e.orange,C=h.fuel>=60?e.green:h.fuel>=30?e.gold:e.red;v+=`<div onclick="raSelectVessel('${h.id}')" style="padding:8px 10px;background:${k?e.accent+"12":e.card};border:1px solid ${k?e.accent+"44":e.border};cursor:pointer;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-size:11px;font-weight:600;color:${e.text};">${x(h.vessel_name)}</span>
                    <span style="font-family:${o};font-size:7px;font-weight:700;padding:1px 5px;color:${n.color};background:${n.color}12;border:1px solid ${n.color}25;">${h.vessel_class.toUpperCase()}</span>
                </div>
                <div style="display:flex;gap:12px;font-family:${o};font-size:8px;">
                    <span style="color:${e.dim};">Condition: <span style="color:${T};font-weight:700;">${h.condition}%</span></span>
                    <span style="color:${e.dim};">Fuel: <span style="color:${C};font-weight:700;">${h.fuel}%</span></span>
                    <span style="color:${e.dim};">Capacity: <span style="color:${e.text};font-weight:700;">${(h.capacity_dwt||0).toLocaleString()} ${h.capacity_unit||"DWT"}</span></span>
                </div>
            </div>`}v+="</div>"}const b=25e4,y=75e4;v+=`
            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <span style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;">PROPOSED SERVICE RATE</span>
                    <span style="font-family:${o};font-size:16px;font-weight:700;color:${e.gold};">${P(_e)}/trip</span>
                </div>
                <input type="range" min="${b}" max="${y}" step="5000" value="${_e}"
                    oninput="raSetRate(this.value)"
                    style="width:100%;accent-color:${e.gold};height:5px;" />
                <div style="display:flex;justify-content:space-between;font-family:${o};font-size:8px;color:${e.dim};margin-top:3px;">
                    <span>Floor (${P(b)})</span>
                    <span style="color:${e.muted};">Mid-market (${P(5e5)})</span>
                    <span>Ceiling (${P(y)})</span>
                </div>
            </div>`,v+=`
            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">ESTIMATED ECONOMICS (PER TRIP)</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:8px 10px;">
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${o};font-size:9px;color:${e.dim};">Bid</span>
                        <span style="font-family:${o};font-size:10px;color:${e.text};">${P(_e)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${o};font-size:9px;color:${e.dim};">Revenue ${t.trade_agreement_id?`×${s} (agreement)`:`×${s} (organic)`}</span>
                        <span style="font-family:${o};font-size:10px;font-weight:700;color:${e.green};">${P(l)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;">
                        <span style="font-family:${o};font-size:9px;color:${e.dim};">Est. Fuel Cost (~15%)</span>
                        <span style="font-family:${o};font-size:10px;color:${e.red};">-${P(a)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${o};font-size:9px;color:${e.dim};">Est. Maintenance (~8%)</span>
                        <span style="font-family:${o};font-size:10px;color:${e.red};">-${P(r)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:5px 0;">
                        <span style="font-family:${o};font-size:10px;font-weight:700;color:${e.text};">NET PROFIT</span>
                        <span style="font-family:${o};font-size:14px;font-weight:700;color:${f};">${c>=0?"+":""}${P(c)}</span>
                    </div>
                </div>
            </div>

            <div style="padding:6px 10px;background:rgba(90,138,170,0.04);border:1px solid rgba(90,138,170,0.12);font-family:${o};font-size:8px;color:${e.dim};line-height:1.5;">
                Application fee: <span style="color:${e.gold};">$50k</span> (non-refundable). The government reviews applications and may approve or reject based on your rate, fleet readiness, and competition.
            </div>

        </div>
        <div style="padding:12px 20px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${o};font-size:8px;color:${e.dim};">APPLICATION FEE</div>
                <div style="font-family:${o};font-size:14px;font-weight:700;color:${e.gold};">$50k</div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="raClose()" style="padding:7px 16px;font-family:${o};font-size:11px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer;">CANCEL</div>
                <div onclick="${m?"raSubmitApplication()":""}" style="padding:7px 16px;font-family:${o};font-size:11px;font-weight:700;letter-spacing:1px;color:${m?"#000":e.dim};background:${m?e.accent:"transparent"};border:1px solid ${m?e.accent:e.border};cursor:${m?"pointer":"not-allowed"};opacity:${m?1:.4};">SUBMIT APPLICATION</div>
            </div>
        </div>
    </div>`;const $=document.createElement("div");$.id="ra-modal-overlay",$.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",$.innerHTML=v,$.addEventListener("click",h=>{h.target===$&&Bn()}),document.body.appendChild($)}async function Rr(){if(oo||!et||!Ye||!d||!S)return;oo=!0;const o=et,e=5e4,{data:t}=await g.from("factions").select("corp_cash_reserves").eq("id",d.id).single(),n=Number(t?.corp_cash_reserves??0);if(n<e){alert("Not enough funds. Application fee: $50k. You have $"+Math.round(n/1e3)+"k."),oo=!1;return}try{const i=n-e,{error:a}=await g.from("factions").update({corp_cash_reserves:i}).eq("id",d.id);if(a){alert("Failed to deduct fee.");return}const r={route_id:o.id,faction_id:d.id,vessel_id:Ye,proposed_rate:_e,application_fee:e,status:"pending",applied_at_tick:S.current_tick};let{error:s}=await g.from("shipping_applications").insert(r);if(s&&/vessel_id/i.test(s.message||"")){const{vessel_id:l,...c}=r;s=(await g.from("shipping_applications").insert(c)).error}if(s){await g.from("factions").update({corp_cash_reserves:n}).eq("id",d.id);const l=s.code==="23505"||/duplicate key|idx_shipping_applications_unique/i.test(s.message||"");alert(l?"You already have a pending or approved application on this route. Withdraw it from Route Applications before applying again.":"Application failed: "+s.message);return}try{await g.from("event_log").insert({nation_id:o.origin_nation_id,event_name:d.faction_name+" applied to service "+(o.origin_port||"?")+" → "+(o.destination_port||"?"),category:"corporate",description_chosen:d.faction_name+" submitted a shipping application for the "+(o.goods_name||"trade")+" route at a proposed rate of "+P(_e)+"/trip. Vessel: "+(ce.find(l=>l.id===Ye)?.vessel_name||"Unknown"),fired_at_tick:S.current_tick})}catch(l){console.warn("[Shipping] Event log failed:",l?.message||l)}Bn(),await Rn(),te=-1,await So(),alert("Application submitted! The government will review your application.")}catch(i){alert("Application failed: "+(i.message||"Network error"))}finally{oo=!1}}async function Lr(){if(!(Qo||te<0||!d||!S)){var o=qn(),e=o[te];if(e){var t=Number(d.shipping_fleet_capacity??0),n=Number(d.shipping_fleet_deployed??0);if(n>=t){alert("No available vessels. Fleet capacity: "+t+", deployed: "+n+".");return}Qo=!0;var i=document.getElementById("ar-claim-btn");i.textContent="CLAIMING...",i.className="ar-claim-btn";try{var{data:a,error:r}=await g.rpc("claim_shipping_route",{p_faction_id:d.id,p_route_id:e.id,p_current_tick:S.current_tick});if(r){alert("Claim failed: "+r.message);return}if(a&&!a.success){alert(a.error||"Claim failed.");return}if(a?.claim_id){var s=(ce||[]).find(function(u){return u.status==="in_port"&&!u.active_claim_id&&u.fuel>=10});if(s){var{error:l}=await g.from("corp_vessels").update({status:"in_transit",active_claim_id:a.claim_id,current_port_nation_id:null}).eq("id",s.id);l&&console.warn("Failed to assign vessel to route:",l.message)}else console.warn("Route claimed but no available vessel with fuel >= 10% to assign.")}try{var c=e.origin_nation?.name||e.origin_nation_id||"Unknown",f=e.destination_nation?.name||e.destination_nation_id||"Unknown",p=e.goods_type||e.cargo_type||"goods";await g.from("event_log").insert({nation_id:d.nation_id,event_name:"Shipping Route Signed",category:"corporate",description_chosen:d.faction_name+" has just signed an agreement to ship "+p+" between "+c+" and "+f+".",fired_at_tick:S.current_tick||0})}catch{}await Rn(),te=-1,await Promise.all([So(),zo(),ye()])}catch(u){alert("Claim failed: "+(u.message||"Network error"))}finally{Qo=!1,i.textContent="CLAIM ROUTE",i.className="ar-claim-btn"+(te>=0?" active":"")}}}}let Oe=[],Ii="ready",At=null,go=-1;async function zo(){if(!d)return;const o=await Ca(g,d.id);Oe=o.claims,Ii=o.state,At=o.error,At&&console.warn("Failed to load active voyages:",At.message),Ni()}function qr(o){go=go===o?-1:o,Ni()}async function Or(o){if(!(Ko||!d||!S)){Ko=!0;try{var{data:e,error:t}=await g.rpc("release_shipping_route",{p_faction_id:d.id,p_claim_id:o,p_current_tick:S.current_tick});if(t){alert("Release failed: "+t.message);return}if(e&&!e.success){alert(e.error||"Release failed.");return}var{error:n}=await g.from("corp_vessels").update({status:"in_port",active_claim_id:null}).eq("active_claim_id",o).eq("faction_id",d.id);n&&console.warn("Failed to free vessel on release:",n.message),go=-1,await Rn(),await Promise.all([So(),zo(),ye()])}catch(i){alert("Release failed: "+(i.message||"Network error"))}finally{Ko=!1}}}function Ni(){const o=S?.current_tick||0,e=Number(d?.shipping_fleet_capacity??0),t=Number(d?.shipping_fleet_deployed??0),n=d?.corp_subsector||"--";document.getElementById("av-count").textContent=Oe.length+" ACTIVE";const i=Oe.reduce((f,p)=>f+Number(p.total_revenue||0),0),a=Oe.reduce((f,p)=>f+(p.transits_completed||0),0),r=a>0?Math.round(i/a):0;document.getElementById("av-summary").innerHTML=`
        <div class="av-summary__cell">
            <div class="av-summary__label">FLEET</div>
            <div class="av-summary__value" style="color:${t>=e?"var(--orange)":"var(--text-bright)"}">
                ${t} <span style="font-size:9px;color:var(--text-dim)">/ ${e}</span>
            </div>
        </div>
        <div class="av-summary__cell">
            <div class="av-summary__label">TRANSITS</div>
            <div class="av-summary__value" style="color:var(--text-bright)">${a}</div>
        </div>
        <div class="av-summary__cell">
            <div class="av-summary__label">AVG REV/TRIP</div>
            <div class="av-summary__value" style="color:var(--green)">${P(r)}</div>
        </div>`,document.getElementById("av-total-revenue").textContent=P(i),document.getElementById("av-total-revenue").style.color=i>0?"var(--green)":"var(--text-dim)",document.getElementById("av-fleet-status").textContent=t+"/"+e,document.getElementById("av-subsector").textContent=n;const s=document.getElementById("av-list");if(Ii==="error"){s.innerHTML='<div class="av-empty"><div class="av-empty__text">'+x(At&&At.message||"Active voyage data is temporarily unavailable.")+"</div></div>";return}if(Oe.length===0){s.innerHTML='<div class="av-empty"><div class="av-empty__text">No active voyages.<br>Claim a shipping route to<br>deploy your fleet.</div></div>';return}let l="";for(let f=0;f<Oe.length;f++){const p=Oe[f],u=p.shipping_routes||{},m=go===f,v=p.vessel_status||"idle";let b=v.toUpperCase().replace("_"," "),y="av-status--idle",$="";if(v==="loading")y="av-status--loading",b="LOADING";else if(v==="in_transit"){y="av-status--transit";const I=p.transit_started_tick||o,E=(p.transit_arrives_tick||I+(u.transit_ticks||2))-I,q=Math.max(0,Math.min(o-I,E)),L=E>0?Math.round(q/E*100):0;b="IN TRANSIT ("+q+"/"+E+")",$='<div class="av-transit-bar"><div class="av-transit-bar__fill" style="width:'+L+'%"></div></div>'}const h=Number(p.revenue_per_transit||0),k=Number(p.market_share_pct||0),T=p.transits_completed||0,C=Number(p.total_revenue||0),w=_n[u.demand_level]||"#6a6660";if(l+='<div class="av-item" onclick="avToggle('+f+')"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;"><div class="av-item__route">'+x(u.origin_port||"?")+" → "+x(u.destination_port||"?")+'</div><span class="av-status '+y+'">'+b+'</span></div><div class="av-item__cargo">'+x(u.goods_name||"Unknown")+" · "+x(u.vessel_class||"?")+"</div>"+$+'<div class="av-item__stats"><div class="av-stat"><div class="av-stat__label">REV/TRIP</div><div class="av-stat__value" style="color:var(--green)">'+P(h)+'</div></div><div class="av-stat"><div class="av-stat__label">SHARE</div><div class="av-stat__value">'+k.toFixed(1)+'%</div></div><div class="av-stat"><div class="av-stat__label">TRANSITS</div><div class="av-stat__value">'+T+'</div></div><div class="av-stat"><div class="av-stat__label">TOTAL REV</div><div class="av-stat__value" style="color:var(--green)">'+P(C)+"</div></div></div>",m){l+='<div class="av-item__detail"><div class="av-detail-row"><span class="av-detail-label">ORIGIN</span><span class="av-detail-value">'+x(u.origin_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">DESTINATION</span><span class="av-detail-value">'+x(u.destination_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE SECTOR</span><span class="av-detail-value">'+x((u.trade_sector||"").replace(/_/g," ").toUpperCase())+'</span></div><div class="av-detail-row"><span class="av-detail-label">SCOPE</span><span class="av-detail-value">'+x(u.scope||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRANSIT TIME</span><span class="av-detail-value">'+(u.transit_ticks||"?")+' ticks</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE VOLUME</span><span class="av-detail-value">'+P(Number(u.trade_volume||0))+'</span></div><div class="av-detail-row"><span class="av-detail-label">TARIFF</span><span class="av-detail-value">'+Number(u.tariff_rate||0).toFixed(1)+'%</span></div><div class="av-detail-row"><span class="av-detail-label">COMPETITION</span><span class="av-detail-value">'+(u.competition_count??0)+' corps</span></div><div class="av-detail-row"><span class="av-detail-label">DEMAND</span><span class="av-detail-value" style="color:'+w+'">'+(u.demand_level||"?")+"</span></div>"+(u.trade_agreement_name?'<div class="av-detail-row"><span class="av-detail-label">AGREEMENT</span><span class="av-detail-value" style="color:var(--teal)">'+x(u.trade_agreement_name)+"</span></div>":"")+'<div class="av-detail-row"><span class="av-detail-label">CLAIMED</span><span class="av-detail-value">Tick '+(p.claimed_at_tick||"?")+"</span></div>";var c=(ce||[]).find(function(I){return I.active_claim_id===p.id});!c&&v==="loading"?l+=`<div style="padding:6px 8px;margin-top:4px;background:rgba(200,168,50,0.06);border:1px solid rgba(200,168,50,0.15);text-align:center;"><div style="font-family:var(--font-mono);font-size:9px;color:var(--orange);font-weight:700;margin-bottom:4px;">NO VESSEL ASSIGNED</div><button class="av-action-btn" style="background:var(--teal);color:#fff;border-color:var(--teal);width:100%;" onclick="event.stopPropagation();openAssignVesselModal('`+p.id+"','"+(u.vessel_class||"")+`')">ASSIGN VESSEL</button></div>`:c&&(l+='<div style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:var(--bg-card);border:1px solid var(--border-main);"><div><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">ASSIGNED VESSEL</div><div style="font-size:11px;font-weight:700;color:var(--text-bright);">'+x(c.vessel_name||"Unknown")+'</div></div><div style="display:flex;gap:10px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(c.fuel>50?"#5c5":c.fuel>20?"#ca5":"#c55")+'">'+(c.fuel||0)+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(c.condition>50?"#5c5":c.condition>30?"#ca5":"#c55")+'">'+(c.condition||0)+"%</div></div></div></div>"),l+=`<button class="av-action-btn release" onclick="event.stopPropagation();avRelease('`+p.id+`')">RELEASE ROUTE</button></div>`}l+="</div>"}s.innerHTML=l}let Mt=[];const Br={stranded:{label:"STRANDED"},mechanical_failure:{label:"MECHANICAL"},collision:{label:"COLLISION"},fire:{label:"FIRE"},piracy:{label:"PIRACY"},storm_damage:{label:"STORM"}};async function Dn(){if(!d){Mt=[],ci();return}const{data:o,error:e}=await g.from("vessel_incidents").select("id, vessel_id, nation_id, incident_type, incident_tick, description, severity, status, corp_vessels!vessel_id(id, vessel_name, vessel_class)").eq("faction_id",d.id).eq("status","pending").order("incident_tick",{ascending:!1});e?(console.warn("[VesselIncidents] load failed:",e.message),Mt=[]):Mt=o||[],ci()}function ci(){const o=document.getElementById("vi-count"),e=document.getElementById("vi-list");if(!o||!e)return;const t=Mt||[];if(o.textContent=t.length+" PENDING",t.length===0){e.innerHTML=`<div class="vi-empty">
            <div class="vi-empty__text">No pending incidents.<br>Claim-eligible events on your fleet appear here.</div>
        </div>`;return}e.innerHTML=t.map(n=>{const i=Br[n.incident_type]||{label:(n.incident_type||"INCIDENT").toUpperCase()},a=n.corp_vessels?.vessel_name||"Unknown Vessel",r=n.severity==="total",s=n.severity?`<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;margin-left:4px;color:${r?"#000":"var(--amber)"};background:${r?"var(--red)":"var(--amber-faint)"};border:1px solid ${r?"var(--red)":"var(--amber-border)"};">${r?"TOTAL LOSS":"PARTIAL"}</span>`:"";return`<div class="vi-item" data-incident-id="${n.id}">
            <div class="vi-item__head">
                <span class="vi-item__vessel">${x(a)}</span>
                <span class="vi-item__tick">Tick ${n.incident_tick}</span>
            </div>
            <div style="display:flex;align-items:center;gap:0;margin-bottom:6px;flex-wrap:wrap;">
                <span class="vi-item__type" style="margin-bottom:0;">${x(i.label)}</span>
                ${s}
            </div>
            <div class="vi-item__desc">${x(n.description||"")}</div>
            <div class="vi-item__actions">
                <button class="vi-action-btn vi-action-btn--dismiss" onclick="viDismissIncident('${n.id}')">DISMISS</button>
                <button class="vi-action-btn vi-action-btn--file" onclick="viFileClaim('${n.id}')">FILE CLAIM</button>
            </div>
        </div>`}).join("")}let gt=!1;async function Pr(o){if(gt)return;const e=Mt.find(t=>t.id===o);if(e){gt=!0;try{const{data:t}=await g.from("subsidiary_auto_policies").select("id, principal, deductible_pct, lender_faction_id, policy_terms").eq("insured_vessel_id",e.vessel_id).eq("status","active").limit(1).maybeSingle(),{data:n}=t?{data:null}:await g.from("finance_active_loans").select("id, principal, deductible_pct, lender_faction_id").eq("insured_vessel_id",e.vessel_id).eq("status","current").limit(1).maybeSingle(),i=t||n;if(!i){alert("No active insurance policy covers this vessel. Consider purchasing coverage before the next incident.");return}const a=e.corp_vessels?.vessel_name||"vessel",r=Number(i.principal)||0,s=e.severity==="total"||e.incident_type==="stranded"||!e.severity,l=Math.round(s?r:r*.35),c=`File claim on ${a}?

Severity:    ${s?"Total loss":"Partial loss"}
Claim:       $${l.toLocaleString()}
Deductible:  ${i.deductible_pct||10}%`;if(!confirm(c))return;const f=t?"auto":"deal",p=S?.current_tick||0,{data:u,error:m}=await g.from("insurance_claims").insert({policy_id:i.id,policy_source:f,claimant_faction_id:d.id,insurer_faction_id:i.lender_faction_id,insured_vessel_id:e.vessel_id,claim_amount:l,claim_reason:e.description||`${a} — incident ${e.incident_type}`,policy_terms:i.policy_terms||null,deductible_pct:Number(i.deductible_pct)||10,status:"filed",filed_at_tick:p}).select("id").single();if(m){alert("Failed to file claim: "+m.message);return}const{error:v}=await g.from("vessel_incidents").update({status:"filed",filed_at_tick:p,filed_claim_id:u?.id||null}).eq("id",e.id);v&&console.warn("[VesselIncidents] incident update after file failed:",v.message);try{await g.from("event_log").insert({nation_id:e.nation_id||d.nation_id,faction_id:d.id,event_name:`${d.faction_name||"A corporation"} filed an insurance claim`,category:"corporate",description_chosen:`${d.faction_name||"Corporation"} filed a claim on ${a} for $${Math.round(l).toLocaleString()}.`,fired_at_tick:p})}catch{}await Dn()}catch(t){console.error("[VesselIncidents] fileClaim error:",t),alert("File claim failed: "+(t?.message||"unknown error"))}finally{gt=!1}}}window.viFileClaim=Pr;async function Dr(o){if(!gt&&confirm("Dismiss this incident without filing a claim? The vessel remains in whatever state the tick processor left it.")){gt=!0;try{const{error:e}=await g.from("vessel_incidents").update({status:"dismissed",filed_at_tick:S?.current_tick||0}).eq("id",o);if(e){alert("Dismiss failed: "+e.message);return}await Dn()}finally{gt=!1}}}window.viDismissIncident=Dr;function jr(o,e){const t=(ce||[]).filter(function(a){return a.status==="in_port"&&!a.active_claim_id&&a.fuel>=15&&a.condition>=20});let n;t.length===0?n='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No available vessels.<br>Ships must be in port with 15%+ fuel and 20%+ condition.</div>':n=t.map(function(a,r){var s=a.fuel>50?"#5c5":a.fuel>20?"#ca5":"#c55",l=a.condition>50?"#5c5":a.condition>30?"#ca5":"#c55";return`<div style="padding:10px 14px;border-bottom:1px solid var(--border-0);cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="assignVesselToRoute('`+o+"','"+a.id+`')"><div><div style="font-size:14px;font-weight:700;color:var(--text-bright);">`+x(a.vessel_name||"Unnamed")+'</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+x(a.vessel_class||"?")+" · "+(a.capacity_dwt||0).toLocaleString()+' DWT</div></div><div style="display:flex;gap:14px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+s+'">'+a.fuel+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+l+'">'+a.condition+'%</div></div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--teal);padding:4px 12px;border:1px solid var(--teal);cursor:pointer;">ASSIGN</div></div></div>'}).join("");var i=document.createElement("div");i.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;",i.onclick=function(a){a.target===i&&i.remove()},i.innerHTML='<div style="width:560px;max-width:95vw;max-height:80vh;background:var(--bg-panel);border:1px solid var(--border-main);display:flex;flex-direction:column;"><div style="padding:12px 16px;border-bottom:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:space-between;align-items:center;"><span style="font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:var(--teal);">ASSIGN VESSEL</span><span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+t.length+' available</span></div><div style="flex:1;overflow-y:auto;">'+n+`</div><div style="padding:10px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);text-align:right;"><button onclick="this.closest('div[style*=fixed]').remove()" style="padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);background:transparent;border:1px solid var(--border-main);cursor:pointer;">CANCEL</button></div></div>`,document.body.appendChild(i)}async function Fr(o,e){try{var{error:t}=await g.from("corp_vessels").update({status:"in_port",active_claim_id:o}).eq("id",e).eq("faction_id",d.id);if(t){alert("Assignment failed: "+t.message);return}var n=document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]');n&&n.remove(),await Promise.all([zo(),ye()])}catch(i){alert("Assignment failed: "+(i.message||"Network error"))}}window.openAssignVesselModal=jr;window.assignVesselToRoute=Fr;function jn(){const o=ae.reduce((s,l)=>s+(l.owned||0),0),e=ae.reduce((s,l)=>s+(l.deployed||0),0),t=Na(ae),n=o-e;document.getElementById("eq-count").textContent=o+" UNITS",document.getElementById("eq-summary").innerHTML=`
        <div class="eq-summary__cell">
            <div class="eq-summary__label">DEPLOYED</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--text-bright)">
                ${e} <span style="font-size:9px;color:var(--text-dim)">/ ${o}</span>
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
                ${P(t)}
            </div>
        </div>`;const i={};for(const s of ae)i[s.equipment_key]=s;let a="";for(let s=1;s<=3;s++){const l=Pt[s],c=mn(s),f=vn===s,p=c.reduce((m,v)=>m+(i[v.key]?.owned||0),0),u=c.reduce((m,v)=>m+(i[v.key]?.deployed||0),0);if(a+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${s})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${f?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${l.color}">${x(l.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${l.color};border:1px solid ${l.color}33;background:${l.color}0a">${l.tag}</span>
            </div>
            ${p>0?`<span class="eq-tier-hdr__count">${u}/${p}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,f)for(const m of c){const v=i[m.key],b=v?.owned||0,y=v?.deployed||0,$=v?.condition||0,h=m.maintenancePerUnit*b,k=b-y,T=b>0&&k===0,C=b>0&&$<65,w=ui($),I=v?.assigned_projects||[],R=I.length>0?I.map(E=>E.contract_name||"Project").join(", ").slice(0,30):b>0&&y>0?y+" project"+(y>1?"s":""):"—";a+=`<div class="eq-row${b===0?" unowned":""}">`,a+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${b===0?" dim":""}">${x(m.name)}</span>
                        ${C?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${b>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${T?"var(--orange)":"var(--green)"}">${k}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${y}/${b}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,b>0?a+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${$}%;background:${w}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${w}">${$}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${x(R)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${P(h)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:a+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',a+="</div>"}}document.getElementById("eq-list").innerHTML=a;const r=[1,2,3].map(s=>{const l=Pt[s],c=mn(s).reduce((f,p)=>f+(i[p.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${c>0?l.color+"33":"var(--border-0)"};background:${c>0?l.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${l.color}">${l.tag}</div>
            <div class="eq-footer__tier-count" style="color:${c>0?"var(--text-bright)":"var(--text-dim)"}">${c}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${P(t)}</div>
        </div>
        <div class="eq-footer__tiers">${r}</div>`}function Ur(o){vn=vn===o?-1:o,jn()}async function Ai(){if(!d)return;const{data:o,error:e}=await g.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",d.id);e?(console.warn("Failed to load equipment:",e.message),ae=[]):ae=o||[],jn()}async function Hr(){const{data:{user:o}}=await g.auth.getUser();if(!o){window.location.href="login.html";return}const{data:e}=await g.from("factions").select("*").or(`id.eq.${o.id},linked_user_id.eq.${o.id}`);we=(e||[]).filter(m=>m.nation_id);const t=sessionStorage.getItem("active_faction_id");if(d=we.find(m=>m.id===t)||we.find(m=>m.faction_type==="corporation")||we[0],!d){await g.auth.signOut(),window.location.href="login.html";return}if(d.faction_type!=="corporation"){window.location.href="dashboard.html";return}const n=new URLSearchParams(window.location.search).get("tab"),i=n==="expansion"||n==="actions";if(d.corp_sector!=="Shipping"&&!i){const v={Finance:"corp-operations-finance.html",Construction:"corp-operations.html"}[d.corp_sector];if(v){window.location.href=v;return}}const[a,r]=await Promise.all([d.nation_id?g.from("nations").select("*").eq("id",d.nation_id).single():Promise.resolve({data:null}),g.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);a.error&&console.warn("Nation load failed:",a.error.message),a.data&&(z=a.data),r.error&&console.warn("Shard load failed:",r.error.message),S=r.data;let s=0;if(d?.id){const{data:m}=await g.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",d.id).in("status",["open","bidding"]);if(m)for(const v of m)s+=(v.contract_bids||[]).length}const l=document.getElementById("corp-topbar-container");if(l){const{renderCorpTopBar:m}=await za(async()=>{const{renderCorpTopBar:y}=await import("./corp-topbar-BsVGcrAN.js");return{renderCorpTopBar:y}},__vite__mapDeps([0,1])),v=new URLSearchParams(window.location.search).get("tab")||"operations",b={};s>0&&(b.home={color:"#c8a832",title:s+" pending bid"+(s!==1?"s":"")+" on your projects"}),m(l,{faction:d,shard:S,activeTab:v,allUserFactions:we,badges:b})}if(S){if(document.getElementById("game-date").textContent=S.current_date||"—",document.getElementById("tick-number").textContent=S.current_tick||"—",S.next_tick_at){const v=(Number(S.tick_interval_hours)||8)*36e5,b=new Date(S.next_tick_at).getTime(),$=b-v+v/2;yn=new Date($>Date.now()?$:b+v/2),Ba()}const m=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");m&&(m.textContent="Next Corp Tick")}const c=document.getElementById("topbar-cash");c&&(c.textContent="CASH: "+Si(Number(d.corp_cash_reserves??0)));const f=document.getElementById("topbar-ap");f&&(f.style.display="none");const p=document.getElementById("nation-pill");p&&(p.textContent=(z?.name||d.nation||"—").toUpperCase());const u=document.getElementById("corp-faction-dropdown");if(u){let m="";for(const v of we){const b=v.id===d.id,y=v.faction_type==="corporation"?"CORP":"PARTY",$=v.faction_type==="corporation"?"var(--teal)":"var(--amber)";m+=`<div class="corp-dd-item${b?" active":""}" onclick="switchToFaction('${v.id}', '${v.faction_type}')">
                <span class="corp-dd-type" style="color:${$}">${y}</span>
                <span class="corp-dd-name">${x(v.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${x(v.abbreviation||"—")}]</span>
            </div>`}u.innerHTML=m}await Promise.all([So(),zo(),ye(),Jn(),ma(),Dn()]),Ia(d,z,S);try{await Ea(g,{faction:d,nation:z,shard:S},"auto-services-container")}catch(m){console.error("[CorpOps] Auto-services init failed:",m)}if(document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",n==="expansion"){const m=document.querySelector('[data-tab-action="expansion"]');m&&Ri({preventDefault:()=>{},target:m})}else if(n==="actions"){const m=document.querySelector('[data-tab-action="actions"]');m&&qi({preventDefault:()=>{},target:m})}}async function Gr(){await g.auth.signOut(),window.location.href="login.html"}function Vr(){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.toggle("open")}function Wr(o,e){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.remove("open"),sessionStorage.setItem("active_faction_id",o),e==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",o=>{const e=document.getElementById("faction-switcher"),t=document.getElementById("corp-faction-dropdown");t&&e&&!e.contains(o.target)&&t.classList.remove("open")});document.addEventListener("keydown",o=>{o.key==="Escape"&&Yt()});window.doLogout=Gr;window.toggleCorpDropdown=Vr;window.switchToFaction=Wr;window.setFilter=Pa;window.arSetFilter=hr;window.arSelectRoute=zr;window.arClaimRoute=Lr;window.arApplyToService=Nr;window.raClose=Bn;window.raSelectVessel=Ar;window.raSetRate=Mr;window.raSubmitApplication=Rr;window.avToggle=qr;window.avRelease=Or;window.openContractDetail=$i;window.closeContractDetail=Yt;window.toggleWhRow=ir;window.toggleEqTier=Ur;window.switchEmNation=fr;window.setEmType=mr;window.setEmListing=ur;window.setEmQty=vr;window.purchaseEquipment=yr;window.setPrMat=sr;window.setPrTier=lr;window.setPrQty=dr;window.purchaseMaterial=cr;let ie={general:0,skilled:0,innovative:0},Jo=!1;const Qe=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function Mi(o){const e=Number(z?.minimum_wage??50),t=Number(z?.inflation??50),n=Number(z?.standard_of_living??50),i=e/100*48e3,a=1+(t-50)/100*.5,r=1+(n-50)/100*.5;return Math.round(i*o*a*r)}function _(o){const e=Math.abs(o),t=o<0?"-":"";return e>=1e9?t+"$"+(e/1e9).toFixed(2)+"B":e>=1e6?t+"$"+(e/1e6).toFixed(2)+"M":e>=1e3?t+"$"+(e/1e3).toFixed(1)+"k":t+"$"+e.toLocaleString()}async function Ri(o){o.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("actions-content").style.display="none";const e=document.getElementById("expansion-content");e.style.display="flex",e.style.justifyContent="center",e.style.gap="12px",e.style.alignItems="flex-start",e.style.flexWrap="wrap",document.querySelectorAll(".corp-nav-tab").forEach(t=>t.classList.remove("active")),o.target.classList.add("active"),await Ao(),No(),hs(),await Vn(),Ro(),await Us(),await Ns(),Xt(),Jt(),await Xs(),Zt(),await qo(),Oo()}function Li(o){o&&o.preventDefault(),document.getElementById("operations-content").style.display="flex",document.getElementById("expansion-content").style.display="none",document.getElementById("actions-content").style.display="none",document.querySelectorAll(".corp-nav-tab").forEach(e=>e.classList.remove("active")),Yr()?.classList.add("active")}async function qi(o){o.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("expansion-content").style.display="none",document.getElementById("actions-content").style.display="block",document.querySelectorAll(".corp-nav-tab").forEach(e=>e.classList.remove("active")),(o.target||document.querySelector('[data-tab-action="actions"]'))?.classList.add("active"),await Oi(),kt()}function Yr(){return Array.from(document.querySelectorAll(".corp-nav-tab[href]:not([data-tab-action])")).find(o=>{const e=o.getAttribute("href");if(!e)return!1;const t=new URL(e,window.location.href);return t.pathname===window.location.pathname&&!t.searchParams.get("tab")})||null}async function Oi(){if(!d)return;const[o,e]=await Promise.all([g.from("corp_executives").select("*").eq("faction_id",d.id).eq("status","active"),g.from("executive_pool").select("*").eq("nation_id",d.nation_id).eq("status","available").order("skill",{ascending:!1})]);o.error&&console.warn("Failed to load executives:",o.error.message),e.error&&console.warn("Failed to load executive pool:",e.error.message),Dt=o.data||[],jt=e.data||[];const t=await Ra({supabase:g,faction:d,currentTick:S?.current_tick||0,poolCandidates:jt});t?.error&&console.warn("Failed to seed initial executive roster:",t.error.message||t.error),t?.executives&&(Dt=t.executives)}function pt(o){return o>=1e6?"$"+(o/1e6).toFixed(1)+"M":o>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Ae(o){return Dt.find(e=>e.role===o)||null}function xo(o,e){return(o||"?")[0]+(e||"?")[0]}function xt(o){return o>=70?"#5cb85c":o>=50?"#ca5":"#c84"}function kt(){const o=document.getElementById("actions-container");if(!o)return;const e=d?.faction_name||"Corporation",t=(d?.abbreviation||d?.corp_ticker||"??").toUpperCase();let n="";n+=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:0 2px;">
        <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:2px;color:#8b9a6b;text-transform:uppercase;">Actions</span>
            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${x(e)} &middot; ${x(t)}</span>
        </div>
    </div>`,n+='<div style="display:flex;gap:8px;">',n+='<div style="width:262px;display:flex;flex-direction:column;gap:5px;flex-shrink:0;">';for(let i=0;i<lo.length;i++){const a=lo[i],r=co[a],s=Ae(a),l=vt===i,c=r.color,f=!s;if(n+=`<div onclick="actSelectExec(${i})" style="
            padding:10px 12px;
            background:${l?c+"0a":"var(--bg-2,#1a1a17)"};
            border:1px solid ${l?c+"44":"var(--border-0,rgba(255,255,255,0.06))"};
            border-left:3px solid ${l?c:"var(--border-0,rgba(255,255,255,0.06))"};
            cursor:pointer;
        ">`,f&&a!=="CEO")n+=`<div style="display:flex;align-items:center;gap:10px;">
                <div style="width:45px;height:45px;background: var(--border-hair);border:1px dashed var(--border-1);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);flex-shrink:0;">?</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:4px;">
                        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${c};">${x(a)}</span>
                    </div>
                    <div style="font-size:13px;font-weight:600;color:var(--text-dim);margin-top:2px;">VACANT</div>
                    <div style="margin-top:4px;">
                        <span onclick="event.stopPropagation();openExecSearch('${a}')" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:3px 8px;color:#5a8aaa;border:1px solid rgba(90,138,170,0.25);background:rgba(90,138,170,0.06);cursor:pointer;">EXECUTIVE SEARCH</span>
                    </div>
                </div>
            </div>`;else{const p=s?`${s.first_name} ${s.last_name}`:"—",u=s?s.age:0,m=s?s.skill:0,v=s?s.salary_per_year:0,b=s?xo(s.first_name,s.last_name):"—";n+=`<div style="display:flex;align-items:center;gap:10px;">
                <div style="width:45px;height:45px;background:${c}15;border:1px solid ${c}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:14px;font-weight:700;color:${c};flex-shrink:0;">${x(b)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:4px;">
                        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${c};">${x(a)}</span>
                    </div>
                    <div style="font-size:13px;font-weight:600;color:${l?"var(--text-bright,#f0efe6)":"var(--text-muted,#666)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x(p)}${u?` <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">(${u})</span>`:""}</div>
                    <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:3px;flex:1;">
                            <div style="flex:1;height:3px;background:var(--border-0,rgba(255,255,255,0.06));">
                                <div style="width:${m}%;height:100%;background:${xt(m)};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);width:18px;text-align:right;">${m}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${pt(v)}/yr</span>
                    </div>
                </div>
            </div>`}n+="</div>"}n+="</div>",n+=`<div style="flex:1;display:flex;flex-direction:column;gap:0;">
        <div id="actions-right-panel"></div>
    </div>`,n+="</div>",o.innerHTML=n,Kr()}const Bi={CEO:[{id:"statement",name:"Issue Statement",desc:"Issue a press release to the public events feed. Other players and media corps see it. Cost scales with CEO skill.",cost:"~$20k",costColor:"#5cb85c",tags:["REPUTATION"],cooldown:"once/tick"},{id:"ipo",name:"IPO",desc:"Take the corporation public. Sell ~30% of shares for a massive cash injection. Permanent loss of full control.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["STRUCTURAL"],locked:!0,lockReason:"Coming soon"},{id:"bankruptcy",name:"Declare Bankruptcy",desc:"The CEO officially files for bankruptcy, ceasing all operations. Outstanding loans will be repaid up to 50% of the corporation's market valuation.",descRed:"This will dissolve your corporation. Loans will be paid back, and you will need to found a new corporation. There is a 24 tick cooldown on declaring bankruptcy.",cost:"IRREVERSIBLE",costColor:"#c55",tags:["IRREVERSIBLE"]}],CFO:[{id:"loan",name:"Request Loan",desc:"Submit a loan application to all finance corporations. Set amount, purpose, term, and collateral. Receive competing offers.",cost:"FREE",costColor:"#5cb85c",tags:["FINANCIAL"]}],COO:[{id:"restructure",name:"Restructure Operations",desc:"Lay off 10-20% of workforce, cut ~7% of debt. Reputation hit scales with COO skill — high skill minimizes damage.",cost:"FREE",costColor:"#5cb85c",tags:["OPERATIONAL"],cooldown:"once/tick"}],CTO:[{id:"research",name:"Begin Research",desc:"Start researching a tech tree node. Opens the tech tree interface.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["INNOVATION"],locked:!0,lockReason:"Coming soon"}],CMO:[{id:"rebrand",name:"Rebrand Corporation",desc:"Change name and abbreviation. Cost and reputation hit scale with CMO skill — high skill reduces both.",cost:"~$20M",costColor:"#ca5",tags:["STRUCTURAL"],cooldown:"once/tick"}],CLO:[{id:"sue_corp",name:"Sue Corporation",desc:"File a lawsuit against another corporation for patent infringement, contract breach, or predatory practices.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["LEGAL"],locked:!0,lockReason:"Coming soon"}],Lobbyist:[{id:"donate",name:"Political Donation",desc:"Donate $1M to a political party in the nation where your National HQ is located. The target party receives $100k in party funds. You cannot donate to your own party.",cost:"$1M",costColor:"#ca5",tags:["POLITICAL"],cooldown:"once/tick"}]};function Qt(o){return 1.5-o/100}let Pi={};function Qr(o){const e=S?.current_tick||0;return Pi[o]===e}function bt(o){const e=S?.current_tick||0;Pi[o]=e}function Kr(){const o=document.getElementById("actions-right-panel");if(!o)return;const e=lo[vt],t=co[e],n=Ae(e),i=Bi[e]||[];if(!n){o.innerHTML=`<div style="padding:48px;text-align:center;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));">
            <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${t.color};margin-bottom:6px;">${x(e)}</div>
            <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-bottom:14px;">${x(t.fullTitle)}</div>
            <div style="font-size:16px;color:var(--text-muted);margin-bottom:20px;">This position is vacant. Hire an executive to unlock actions.</div>
            <div onclick="openExecSearch('${e}')" style="display:inline-block;padding:8px 24px;font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">EXECUTIVE SEARCH</div>
        </div>`;return}let a="";a+=`<div style="padding:14px 20px;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-bottom:none;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:56px;height:56px;background:${t.color}15;border:1px solid ${t.color}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:18px;font-weight:700;color:${t.color};">${x(xo(n.first_name,n.last_name))}</div>
            <div>
                <div style="display:flex;align-items:baseline;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:22px;font-weight:700;color:${t.color};">${x(e)}</span>
                    <span style="font-size:19px;font-weight:700;color:var(--text-bright,#f0efe6);">${x(n.first_name)} ${x(n.last_name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-top:2px;">${x(t.fullTitle)}</div>
            </div>
        </div>
        <div style="display:flex;gap:16px;align-items:center;">
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SKILL</div>
                <div style="display:flex;align-items:center;gap:5px;margin-top:2px;">
                    <div style="width:50px;height:4px;background:var(--border-0,rgba(255,255,255,0.06));">
                        <div style="width:${n.skill}%;height:100%;background:${xt(n.skill)};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${xt(n.skill)};">${n.skill}</span>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SALARY</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${pt(n.salary_per_year)}/yr</div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">CONTRACT</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${n.contract_years}yr</div>
            </div>
            ${e!=="CEO"?`<div style="text-align:right;">
                <span onclick="event.stopPropagation();confirmFireExec('${n.id}','${x(e)}','${x(n.first_name+" "+n.last_name)}',${n.salary_per_year},${n.contract_end_tick||0})" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:5px 12px;color:#d9534f;border:1px solid rgba(217,83,79,0.25);background:rgba(217,83,79,0.06);cursor:pointer;">FIRE</span>
            </div>`:""}
        </div>
    </div>`,a+='<div style="background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:1px solid var(--border-0,rgba(255,255,255,0.06));flex:1;">';for(let r=0;r<i.length;r++){const s=i[r],l=!!s.locked;a+=`<div onmouseenter="this.dataset.hover='1';this.style.background='${l?"transparent":t.color+"06"}'" onmouseleave="this.dataset.hover='';this.style.background='transparent';var eb=this.querySelector('.act-exec-btn');if(eb)eb.style.display='none'" style="
            padding:16px 20px;
            ${r<i.length-1?"border-bottom:1px solid var(--border-0,rgba(255,255,255,0.06));":""}
            opacity:${l?"0.4":"1"};
            cursor:${l?"not-allowed":"pointer"};
        ">`,a+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;font-weight:700;color:${l?"var(--text-dim)":"var(--text-bright,#f0efe6)"};">${x(s.name)}</span>`;for(const c of s.tags)a+=`<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.3px;padding:2px 6px;line-height:14px;color:${c==="IRREVERSIBLE"?"#c55":c==="OFFENSIVE"?"#c84":c==="STRUCTURAL"?"#ca5":c==="POLITICAL"?"#8a6aaa":"var(--text-dim)"};background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));">${x(c)}</span>`;a+=`</div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${s.costColor};">${x(s.cost)}</span>
            </div>
        </div>`,a+=`<div style="font-size:14px;color:${l?"var(--text-dim)":"var(--text-muted,#666)"};line-height:1.6;">${x(s.desc)}</div>`,s.descRed&&(a+=`<div style="font-size:13px;color:#c55;line-height:1.6;margin-top:4px;">${x(s.descRed)}</div>`),l&&s.lockReason&&(a+=`<div style="margin-top:6px;font-family:var(--font-mono);font-size:11px;color:#c84;display:flex;align-items:center;gap:4px;">
                <span>&#8856;</span><span>${x(s.lockReason)}</span>
            </div>`),l||(a+=`<div class="act-exec-btn" style="display:none;margin-top:10px;text-align:right;">
                <span onclick="event.stopPropagation();actExecute('${s.id}','${e}')" style="display:inline-block;padding:6px 24px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${t.color};cursor:pointer;">EXECUTE</span>
            </div>`),a+="</div>"}a+="</div>",a+=`<div style="padding:8px 20px;background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:none;">
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">
            <span style="color:${t.color};font-weight:700;">${x(e)}</span> skill (${n.skill}/100) affects action outcomes.
            ${n.skill>=70?" High skill increases success probability and reduces costs.":n.skill>=50?" Moderate skill — outcomes are average. Consider recruiting a stronger executive.":" Low skill — actions are less effective and more expensive. Replacement recommended."}
        </div>
    </div>`,o.innerHTML=a,o.querySelectorAll("[onmouseenter]").forEach(r=>{r.addEventListener("mouseenter",function(){const s=this.querySelector(".act-exec-btn");s&&(s.style.display="block")}),r.addEventListener("mouseleave",function(){const s=this.querySelector(".act-exec-btn");s&&(s.style.display="none")})})}function Jr(o,e,t,n,i){const a=S?.current_tick||0,r=Math.max(0,i-a),s=Math.round(n*(r/12)),l=`FIRE ${e}: ${t}

Contract remaining: ${r} ticks
Payout (prorated): $${(s/1e6).toFixed(2)}M

This amount will be deducted from your cash reserves immediately.

Are you sure?`;confirm(l)&&Xr(o,e,s)}async function Xr(o,e,t){try{const n=Number(d?.corp_cash_reserves??0);if(n<t){alert(`Insufficient funds. You need $${(t/1e6).toFixed(2)}M but only have $${(n/1e6).toFixed(2)}M.`);return}const i=n-t,{error:a}=await g.from("factions").update({corp_cash_reserves:i}).eq("id",d.id);if(a){alert("Failed to process payout: "+a.message);return}const{error:r}=await g.from("corp_executives").update({status:"fired",updated_at:new Date().toISOString()}).eq("id",o);if(r){await g.from("factions").update({corp_cash_reserves:n}).eq("id",d.id),alert("Failed to fire executive: "+r.message);return}d.corp_cash_reserves=i,Dt=Dt.filter(s=>s.id!==o),kt()}catch(n){console.error("[CorpOps] Fire executive error:",n),alert("An error occurred.")}}function Zr(o,e){if((Bi[e]||[]).find(n=>n.id===o)?.cooldown==="once/tick"&&Qr(o)){alert("This action can only be used once per tick. Wait for the next tick.");return}switch(o){case"statement":return Di();case"loan":return Ui();case"restructure":return Gi();case"rebrand":return Vi();case"donate":return Wi();case"bankruptcy":return ji()}}let hn=!1;function Di(){if(hn)return;hn=!0;const o=document.createElement("div");o.id="stmt-overlay",o.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",o.onclick=function(l){l.target===o&&Fn()};const e=d?.faction_name||"Corporation",t=(d?.abbreviation||d?.corp_ticker||"??").toUpperCase(),n=Number(d?.corp_cash_reserves??0),i=Ae("CEO"),a=i?`${i.first_name} ${i.last_name}`:"CEO";o.innerHTML=`<div onclick="event.stopPropagation()" style="width:480px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
        <div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:8px;color:#c8a832;">&#9679;</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Issue Statement</span>
                </div>
                <span onclick="actCloseStatement()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">From:</span>
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${x(t)}</span>
                <span style="font-size:10px;color:var(--panel-text);">${x(e)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">&middot; ${x(a)}</span>
            </div>
        </div>
        <div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">PRESS RELEASE</div>
            <textarea id="stmt-text" rows="4" maxlength="500" placeholder="Type your public statement here. All players will see this in the events feed."
                style="width:100%;padding:8px 10px;font-family:var(--font-ui);font-size:11px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;resize:none;box-sizing:border-box;line-height:1.5;"></textarea>
            <div style="display:flex;justify-content:space-between;margin-top:4px;">
                <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">Visible to all players in all nations</span>
                <span id="stmt-chars" style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">0/500</span>
            </div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;gap:12px;">
                    <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">COST</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#5cb85c;">$20k</div></div>
                    <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${n<2e4?"#c55":"var(--panel-text)"};">${_(n)}</div></div>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="actCloseStatement()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
                    <div id="stmt-submit-btn" onclick="actSubmitStatement()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c8a832;cursor:pointer;">PUBLISH</div>
                </div>
            </div>
            <div id="stmt-error" style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
        </div>
    </div>`,document.body.appendChild(o);const r=document.getElementById("stmt-text"),s=document.getElementById("stmt-chars");r&&s&&(r.addEventListener("input",function(){s.textContent=this.value.length+"/500"}),r.focus())}function Fn(){const o=document.getElementById("stmt-overlay");o&&o.remove(),hn=!1}let Tt=!1;async function es(){if(!d||!S||Tt)return;const o=document.getElementById("stmt-text"),e=document.getElementById("stmt-error"),t=(o?.value||"").trim();if(!t){e&&(e.textContent="Statement cannot be empty.",e.style.display="block");return}if(t.length>500){e&&(e.textContent="Statement too long (max 500 chars).",e.style.display="block");return}const n=Ae("CEO"),i=n?n.skill:50,a=Math.round(2e4*Qt(i)),r=Number(d.corp_cash_reserves??0);if(r<a){e&&(e.textContent="Insufficient cash. Need "+_(a)+".",e.style.display="block");return}Tt=!0;const s=document.getElementById("stmt-submit-btn");s&&(s.style.opacity="0.4",s.style.pointerEvents="none");const l=d.faction_name||"Corporation",c=n?`${n.first_name} ${n.last_name}`:"CEO",f=S.current_tick||0,{error:p}=await g.from("factions").update({corp_cash_reserves:r-a}).eq("id",d.id);if(p){Tt=!1,e&&(e.textContent="Failed to deduct cost: "+p.message,e.style.display="block"),s&&(s.style.opacity="1",s.style.pointerEvents="auto");return}const{error:u}=await g.from("event_log").insert({nation_id:d.nation_id,faction_id:d.id,event_name:l+" — Press Release",description_used:c+", CEO of "+l+': "'+t.replace(/[<>"]/g,"")+'"',category:"business",trigger_key:"ceo_statement",effects_applied:{cost:a,ceo:c,skill:i},fired_at_tick:f});if(u){await g.from("factions").update({corp_cash_reserves:r}).eq("id",d.id),Tt=!1,e&&(e.textContent="Failed to publish: "+u.message,e.style.display="block"),s&&(s.style.opacity="1",s.style.pointerEvents="auto");return}d.corp_cash_reserves=r-a,Tt=!1,bt("statement"),Fn()}const pi=24,ts=.5;async function os(o,e){const t=e-pi,{data:n}=await g.from("event_log").select("fired_at_tick, effects_applied").eq("trigger_key","corp_bankruptcy").gte("fired_at_tick",t).order("fired_at_tick",{ascending:!1}).limit(20),i=(n||[]).find(r=>r.effects_applied?.user_id===o),a=i?Math.max(0,i.fired_at_tick+pi-e):0;return{onCooldown:a>0,ticksLeft:a}}let Xo=!1;async function ji(){if(Xo)return;const{data:{user:o}}=await g.auth.getUser();if(!o){alert("Not logged in.");return}const e=d?.id||sessionStorage.getItem("active_faction_id");if(!e){alert("No active faction selected.");return}const{data:t,error:n}=await g.from("factions").select("*").eq("id",e).eq("faction_type","corporation").is("abandoned_at",null).single();if(n||!t){alert("No active corporation found. It may have already been dissolved.");return}const i=t,a=i.faction_name||"this corporation",{data:r,error:s}=await g.from("shard").select("current_tick").eq("name","Alpha Shard").single();if(s||!r){alert("Failed to read game tick. Please try again.");return}const l=r.current_tick||0,{onCooldown:c,ticksLeft:f}=await os(o.id,l);if(c){alert("Bankruptcy is on cooldown. You must wait "+f+" more tick"+(f!==1?"s":"")+" before declaring bankruptcy again.");return}if(!confirm("DECLARE BANKRUPTCY — "+a.toUpperCase()+`?

This will permanently:
• Dissolve the corporation
• Delete all properties, equipment, and inventory
• Pay back outstanding loans (up to 50% of market valuation)
• Remove all remaining cash reserves

You will need to found a new corporation.
There is a 24 tick cooldown on declaring bankruptcy.

This action CANNOT be undone.`))return;if(prompt('Type "BANKRUPT" to confirm bankruptcy of '+a+":")!=="BANKRUPT"){alert("Bankruptcy cancelled.");return}Xo=!0;try{async function u(A){const{error:U}=await A;if(U)throw U}const m=Number(i.corp_cash_reserves)||0,{data:v}=await g.from("corp_properties").select("purchase_price, condition").eq("faction_id",e);let b=0;for(const A of v||[])b+=Math.round(Number(A.purchase_price||0)*(Number(A.condition||0)/100));const y=m+b,$=Number(i.corp_loans)||0,h=y-$,k=Math.round(h*1.3),T=Math.max(0,Math.round(k*ts)),{data:C}=await g.from("finance_active_loans").select("*").eq("borrower_faction_id",e).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!0});let w=0;for(const A of C||[]){const U=A.principal-A.total_paid;if(U<=0)continue;const j=Math.min(U,T-w);if(j<=0)break;const{data:H}=await g.from("factions").select("corp_cash_reserves").eq("id",A.lender_faction_id).single();H&&await u(g.from("factions").update({corp_cash_reserves:(Number(H.corp_cash_reserves)||0)+j}).eq("id",A.lender_faction_id)),await u(g.from("finance_active_loans").update({status:"repaid",total_paid:A.total_paid+j,completed_tick:l}).eq("id",A.id)),w+=j}await u(g.from("contract_bids").delete().eq("faction_id",e)),await u(g.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",e).in("status",["open","bidding"])),await u(g.from("corp_equipment_deliveries").delete().eq("faction_id",e)),await u(g.from("corp_equipment").delete().eq("faction_id",e)),await u(g.from("corp_properties").delete().eq("faction_id",e)),await g.from("corp_material_inventory").delete().eq("faction_id",e),await g.from("corp_warehouse").delete().eq("faction_id",e),await g.from("corp_executives").delete().eq("faction_id",e),await g.from("faction_agitators").delete().eq("faction_id",e),await u(g.from("factions").delete().eq("id",e));const I=w>0?" $"+w.toLocaleString()+" was repaid to creditors.":"";await u(g.from("event_log").insert({nation_id:i.nation_id,faction_id:e,event_name:a+" — Bankruptcy",description_used:a+" has officially filed for bankruptcy. It has laid off its executive staff and ceased operations."+I,category:"business",trigger_key:"corp_bankruptcy",effects_applied:{corp_name:a,sector:i.corp_sector,user_id:o.id,loan_payback:w,valuation:k},fired_at_tick:l})),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:R}=await g.from("factions").select("id, faction_type").or(`id.eq.${o.id},linked_user_id.eq.${o.id}`),E=(R||[]).find(A=>A.faction_type==="party"),q=(R||[]).find(A=>A.faction_type==="corporation"),L=w>0?`
$`+w.toLocaleString()+" repaid to creditors.":"";E?(sessionStorage.setItem("active_faction_id",E.id),alert(a+" has declared bankruptcy."+L+`

Redirecting to your political party.`),window.location.href="dashboard.html"):q?(sessionStorage.setItem("active_faction_id",q.id),alert(a+" has declared bankruptcy."+L+`

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(a+" has declared bankruptcy."+L+`

You have no remaining factions.`),window.location.href="faction-select.html")}catch(u){alert("Bankruptcy failed: "+(u.message||u)+`

Please try again or contact support.`)}finally{Xo=!1}}const Fi=[{id:"equipment",label:"Equipment Acquisition",desc:"Purchase vehicles, cranes, or heavy machinery",icon:"&#9881;"},{id:"working",label:"Working Capital",desc:"Bridge financing for active project costs",icon:"$"},{id:"property",label:"Property Purchase",desc:"Acquire office, warehouse, or HQ building",icon:"&#9632;"},{id:"subsidiary",label:"Subsidiary Expansion",desc:"Fund new subsidiary establishment",icon:"&#9672;"},{id:"materials",label:"Material Procurement",desc:"Bulk material purchase for upcoming projects",icon:"&#9638;"}],Zo=[{id:"none",label:"None",desc:"Unsecured — lenders may charge higher rates",risk:"HIGH",riskColor:"#c84"},{id:"equipment",label:"Equipment",desc:"Financed equipment serves as collateral",risk:"MODERATE",riskColor:"#ca5"},{id:"property",label:"Property",desc:"Corporate property lien",risk:"LOW",riskColor:"#8b9a6b"},{id:"full",label:"Full Assets",desc:"All corporate assets — maximum lender security",risk:"MINIMAL",riskColor:"#5c5"}];let oe=25e7,Ut="equipment",_t=48,pe="equipment",bo="",zt=[];function Ui(){oe=25e7,Ut="equipment",_t=48,pe="equipment",bo="",document.getElementById("lr-overlay").style.display="flex",ss(),Et()}function Hi(){document.getElementById("lr-overlay").style.display="none"}function ns(o){oe=Math.max(1e6,Math.min(5e9,Number(o)||0)),Et()}function is(o){Ut=o,Et()}function as(o){_t=o,Et()}function rs(o){pe=o,Et()}async function ss(){if(!d)return;const{data:o}=await g.from("factions").select("id, faction_name, abbreviation, corp_ticker, corp_company_type").eq("faction_type","corporation").eq("corp_sector","Finance").is("abandoned_at",null).neq("id",d.id);zt=o||[],Et()}function Et(){const o=document.getElementById("lr-modal-content");if(!o)return;const e=Number(d?.corp_cash_reserves??0),t=Number(d?.corp_loans??0),n=Number(d?.corp_reputation??50),i=d?.faction_name||"Corporation",a=(d?.abbreviation||d?.corp_ticker||"??").toUpperCase(),r=t+oe,s=r>e*3?"#c55":r>e*1.5?"#c84":r>e?"#ca5":"#5c5",l=r>e*3?"DANGEROUS":r>e*1.5?"HEAVY":r>e?"MODERATE":"HEALTHY",c=pe==="none"?"10-16%":pe==="equipment"?"7-12%":pe==="property"?"5-9%":"4-7%",p=Math.round(oe*(pe==="none"?.13:pe==="equipment"?.095:pe==="property"?.07:.055)/12+oe/_t),u=Zo.find(v=>v.id===pe)||Zo[0];let m="";m+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:#5a8aaa;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Request Loan</span>
            </div>
            <span onclick="lrClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">From:</span>
            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${x(a)}</span>
            <span style="font-size:10px;color:var(--panel-text);">${x(i)}</span>
        </div>
    </div>`,m+='<div style="flex:1;overflow-y:auto;">',m+=`<div style="padding:6px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);">
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Your Financials (visible to lenders)</span>
    </div>
    <div style="display:flex;gap:0;border-bottom:1px solid var(--panel-border);">
        <div style="flex:1;padding:6px 10px;text-align:center;border-right:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">CASH</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--panel-text);margin-top:1px;">${_(e)}</div>
        </div>
        <div style="flex:1;padding:6px 10px;text-align:center;border-right:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">CURRENT DEBT</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#c84;margin-top:1px;">${_(t)}</div>
        </div>
        <div style="flex:1;padding:6px 10px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">REPUTATION</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#8b9a6b;margin-top:1px;">${n}</div>
        </div>
    </div>`,m+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">LOAN AMOUNT</span>
            <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#5a8aaa;">${_(oe)}</span>
        </div>
        <input type="range" min="1000000" max="5000000000" step="10000000" value="${oe}" oninput="lrSetAmount(this.value)" style="width:100%;height:4px;accent-color:#5a8aaa;" />
        <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;"><span>$1M</span><span>$5B</span></div>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">PURPOSE</div>
        <div style="display:flex;flex-direction:column;gap:3px;">`;for(const v of Fi){const b=Ut===v.id;m+=`<div onclick="lrSetPurpose('${v.id}')" style="display:flex;align-items:center;gap:8px;padding:5px 10px;cursor:pointer;background:${b?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${b?"#5a8aaa44":"var(--panel-border)"};border-left:2px solid ${b?"#5a8aaa":"transparent"};">
            <span style="font-family:var(--font-mono);font-size:10px;color:${b?"#5a8aaa":"#6a6660"};width:14px;text-align:center;">${v.icon}</span>
            <div><div style="font-size:11px;font-weight:600;color:${b?"var(--panel-text)":"#9e9a92"};">${v.label}</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${v.desc}</div></div>
        </div>`}m+="</div></div>",m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">PREFERRED TERM</span>
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--panel-text);">${_t} months</span>
        </div>
        <div style="display:flex;gap:3px;">`;for(const v of[12,24,36,48,60,84,120]){const b=_t===v;m+=`<span onclick="lrSetTerm(${v})" style="flex:1;text-align:center;padding:4px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;color:${b?"#000":"#6a6660"};background:${b?"#5a8aaa":"transparent"};border:1px solid ${b?"#5a8aaa":"var(--panel-border)"};">${v}</span>`}m+='</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Lenders may offer different terms. This is your preference, not a guarantee.</div></div>',m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">COLLATERAL OFFERED</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">`;for(const v of Zo){const b=pe===v.id;m+=`<div onclick="lrSetCollateral('${v.id}')" style="padding:6px 8px;cursor:pointer;background:${b?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${b?"#5a8aaa44":"var(--panel-border)"};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${b?"#5a8aaa":"#6a6660"};">${v.label}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:${v.riskColor};">${v.risk} RISK</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${v.desc}</div>
        </div>`}if(m+="</div></div>",m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">NOTE TO LENDERS (OPTIONAL)</div>
        <textarea id="lr-note" rows="2" maxlength="300" onchange="lrNote=this.value"
            placeholder="e.g., Expanding into Heavy Infrastructure. Equipment purchase will generate $12M+ in annual contract revenue."
            style="width:100%;padding:6px 8px;font-family:var(--font-ui);font-size:10px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;resize:none;box-sizing:border-box;line-height:1.5;">${x(bo)}</textarea>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">Debt Impact Preview</div>
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:6px 10px;">
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CURRENT DEBT</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${_(t)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">+ THIS LOAN</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#5a8aaa;">+${_(oe)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--panel-text);">NEW TOTAL DEBT</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${_(r)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEBT HEALTH</span>
                <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${s};background:${s}12;border:1px solid ${s}25;">${l}</span>
            </div>
        </div>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">This request will be sent to</div>`,zt.length>0){m+='<div style="display:flex;flex-direction:column;gap:3px;">';for(const v of zt){const b=(v.corp_company_type||"").toLowerCase()==="state"?"#c84":(v.corp_company_type||"").toLowerCase()==="public"?"#5c5":"#c8a832";m+=`<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:var(--bg-panel);border:1px solid var(--panel-border);">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c8a832;">${x((v.abbreviation||v.corp_ticker||"??").toUpperCase())}</span>
                <span style="font-size:10px;color:var(--panel-text);flex:1;">${x(v.faction_name)}</span>
                ${v.corp_company_type?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${b};background:${b}12;border:1px solid ${b}25;">${x(v.corp_company_type.toUpperCase())}</span>`:""}
            </div>`}m+="</div>"}else m+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No finance corporations in this nation yet.</div>';m+='<div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">All finance corporations in your nation will see this request. You choose which offer to accept.</div></div>',m+=`<div style="padding:8px 16px;">
        <div style="padding:6px 10px;background:rgba(90,138,170,0.04);border:1px solid rgba(90,138,170,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#5a8aaa;letter-spacing:0.8px;margin-bottom:4px;">ESTIMATED MARKET TERMS</div>
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. RATE RANGE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--panel-text);">${c}</div></div>
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. MONTHLY PAYMENT</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--panel-text);">~${_(p)}</div></div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Estimates based on collateral offer and current market rates. Actual terms set by each lender.</div>
        </div>
    </div>`,m+="</div>",m+=`<div style="padding:10px 16px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:12px;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">REQUESTING</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5a8aaa;">${_(oe)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">COLLATERAL</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--panel-text);">${u.label}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">SENT TO</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#9e9a92;">${zt.length} lender${zt.length!==1?"s":""}</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="lrClose()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="lr-submit-btn" onclick="lrSubmit()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">SUBMIT REQUEST</div>
        </div>
    </div>`,m+='<div id="lr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>',o.innerHTML=m}let no=!1;async function ls(){if(!d||!S||no)return;const o=document.getElementById("lr-error");if(oe<1e6){o.textContent="Minimum loan amount is $1M.",o.style.display="block";return}if(oe>5e9){o.textContent="Maximum loan amount is $5B.",o.style.display="block";return}const t=((Fi.find(r=>r.id===Ut)||{}).label||Ut)+(bo?" — "+bo:""),n=document.getElementById("lr-submit-btn");no=!0,n.style.opacity="0.5",n.style.pointerEvents="none";const i=S.current_tick||0,{error:a}=await g.from("finance_loan_requests").insert({requesting_faction_id:d.id,nation_id:d.nation_id,amount:oe,term_months:_t,purpose:t,created_tick:i,expires_tick:i+5});if(n.style.opacity="1",n.style.pointerEvents="auto",a){no=!1,o.textContent="Failed to submit: "+a.message,o.style.display="block",n.style.opacity="1",n.style.pointerEvents="auto";return}no=!1,Hi()}function Gi(){if(!d)return;const o=Number(d.corp_loans??0),e=Number(d.corp_reputation??50),t=Number(d.corp_general_workforce??0),n=Number(d.corp_skilled_workforce??0),i=Number(d.corp_innovative_workforce??0),a=t+n+i;if(a===0){alert("Cannot restructure — no employees to lay off.");return}const r=Ae("COO"),s=r?r.skill:50,l=Qt(s),c=10+Math.floor(Math.random()*11),f=Math.round(a*c/100),p=Math.round(o*.07),u=Math.round(p*(2-l)),m=3+Math.floor(Math.random()*10),v=Math.max(1,Math.round(m*l)),b=Math.round(t/a*f),y=Math.round(n/a*f),$=Math.max(0,Math.min(i,f-b-y)),h=document.createElement("div");h.id="restr-overlay",h.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",h.onclick=function(k){k.target===h&&Un()},h.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
        <div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:8px;color:#8b9a6b;">&#9679;</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Restructure Operations</span>
                </div>
                <span onclick="actCloseRestructure()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
            </div>
        </div>
        <div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Impact Preview</div>
            <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:8px 12px;">
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">WORKFORCE REDUCTION</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${f} employees (${c}%)</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">General: ${t} &rarr; ${t-b}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${b}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Skilled: ${n} &rarr; ${n-y}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${y}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Innovative: ${i} &rarr; ${i-$}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${$}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEBT REDUCTION (~7%)</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">-${_(u)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">REPUTATION HIT</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${v} (${e} &rarr; ${Math.max(0,e-v)})</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#c84;margin-top:6px;">&#9888; This action cannot be undone. Laid-off workers must be re-hired.</div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseRestructure()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="restr-btn" onclick="actSubmitRestructure(${c},${u},${v},${b},${y},${$})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#8b9a6b;cursor:pointer;">RESTRUCTURE</div>
        </div>
        <div id="restr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(h)}function Un(){const o=document.getElementById("restr-overlay");o&&o.remove()}let io=!1;async function ds(o,e,t,n,i,a){if(!d||!S||io)return;io=!0;const r=document.getElementById("restr-btn");r&&(r.style.opacity="0.4",r.style.pointerEvents="none");const s=Number(d.corp_general_workforce??0),l=Number(d.corp_skilled_workforce??0),c=Number(d.corp_innovative_workforce??0),f=Number(d.corp_loans??0),p=Number(d.corp_reputation??50),u={corp_general_workforce:Math.max(0,s-n),corp_skilled_workforce:Math.max(0,l-i),corp_innovative_workforce:Math.max(0,c-a),corp_loans:Math.max(0,f-e),corp_reputation:Math.max(0,p-t)},{error:m}=await g.from("factions").update(u).eq("id",d.id);if(m){io=!1;const y=document.getElementById("restr-error");y&&(y.textContent="Failed: "+m.message,y.style.display="block"),r&&(r.style.opacity="1",r.style.pointerEvents="auto");return}Object.assign(d,u);const v=S.current_tick||0,{error:b}=await g.from("event_log").insert({nation_id:d.nation_id,faction_id:d.id,event_name:(d.faction_name||"Corporation")+" — Restructuring",description_used:(d.faction_name||"A corporation")+" has announced a restructuring, laying off "+o+"% of its workforce.",category:"business",trigger_key:"corp_restructure",effects_applied:{layoff_pct:o,debt_cut:e,rep_loss:t},fired_at_tick:v});b&&console.warn("Failed to log restructure event:",b.message),io=!1,bt("restructure"),Un(),kt()}function Vi(){const o=Ae("CMO"),e=o?o.skill:50,t=Qt(e),n=Math.round(2e7*t),i=Math.max(1,Math.round(5*t)),a=Number(d?.corp_cash_reserves??0),r=Number(d?.corp_reputation??50),s=d?.faction_name||"",l=d?.abbreviation||d?.corp_ticker||"",c=document.createElement("div");c.id="rebrand-overlay",c.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",c.onclick=function(f){f.target===c&&Hn()},c.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
        <div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:8px;color:#c84;">&#9679;</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Rebrand Corporation</span>
                </div>
                <span onclick="actCloseRebrand()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
            </div>
        </div>
        <div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">NEW CORPORATION NAME</div>
            <input id="rebrand-name" type="text" maxlength="40" value="${x(s)}" placeholder="Corporation name"
                style="width:100%;padding:6px 10px;font-family:var(--font-ui);font-size:12px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;box-sizing:border-box;" />
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-top:10px;margin-bottom:6px;">NEW ABBREVIATION / TICKER</div>
            <input id="rebrand-abbr" type="text" maxlength="5" value="${x(l)}" placeholder="e.g. SZC" style="width:100px;padding:6px 10px;font-family:var(--font-mono);font-size:12px;font-weight:700;color:#c8a832;background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;text-transform:uppercase;" />
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">Impact</div>
            <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:6px 10px;">
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">COST</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${_(n)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">REPUTATION</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${i} (${r} &rarr; ${Math.max(0,r-i)})</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">SKILL MODIFIER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${t<=1?"#5cb85c":"#c84"};">&times;${t.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CASH AFTER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${a<n?"#c55":"var(--panel-text)"};">${_(a-n)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseRebrand()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="rebrand-btn" onclick="actSubmitRebrand(${n},${i})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c84;cursor:${a>=n?"pointer":"not-allowed"};${a<n?"opacity:0.4;pointer-events:none;":""}">REBRAND</div>
        </div>
        <div id="rebrand-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(c)}function Hn(){const o=document.getElementById("rebrand-overlay");o&&o.remove()}let ao=!1;async function cs(o,e){if(!d||!S||ao)return;const t=o||2e7,n=e||5,i=document.getElementById("rebrand-error"),a=(document.getElementById("rebrand-name")?.value||"").trim().replace(/[<>"]/g,""),r=(document.getElementById("rebrand-abbr")?.value||"").trim().toUpperCase().replace(/[<>"]/g,"");if(!a||a.length<2){i&&(i.textContent="Name must be at least 2 characters.",i.style.display="block");return}if(!r||r.length<2||r.length>5){i&&(i.textContent="Abbreviation must be 2-5 characters.",i.style.display="block");return}const s=Number(d.corp_cash_reserves??0);if(s<t){i&&(i.textContent="Insufficient cash. Need "+_(t)+".",i.style.display="block");return}ao=!0;const l=document.getElementById("rebrand-btn");l&&(l.style.opacity="0.4",l.style.pointerEvents="none");const c=Number(d.corp_reputation??50),f=d.faction_name||"Corporation",{error:p}=await g.from("factions").update({faction_name:a,abbreviation:r,corp_ticker:r,corp_cash_reserves:s-t,corp_reputation:Math.max(0,c-n)}).eq("id",d.id);if(p){ao=!1,i&&(i.textContent="Failed: "+p.message,i.style.display="block"),l&&(l.style.opacity="1",l.style.pointerEvents="auto");return}d.faction_name=a,d.abbreviation=r,d.corp_ticker=r,d.corp_cash_reserves=s-t,d.corp_reputation=Math.max(0,c-n);const u=S.current_tick||0,{error:m}=await g.from("event_log").insert({nation_id:d.nation_id,faction_id:d.id,event_name:"Corporation Rebranded",description_used:f+" has rebranded to "+a+" ("+r+"). The rebrand costs $20M and reputation takes a temporary hit.",category:"corporate",trigger_key:"corp_rebrand",effects_applied:{old_name:f,new_name:a,new_abbr:r,rep_loss:n,cost:t},fired_at_tick:u});m&&console.warn("Failed to log rebrand event:",m.message),ao=!1,bt("rebrand"),Hn(),kt(),document.getElementById("corp-name-bar").textContent=a;const v=document.getElementById("corp-logo");v&&(v.textContent=r.slice(0,2))}const ps={liberty:"#9C27B0",equality:"#E91E63",freedom:"#5b9bd5",security:"#d48a3c",individualism:"#eab308",collectivism:"#ec4899",tradition:"#795548",progress:"#00BCD4",nationalism:"#FF5722",globalism:"#3F51B5"};function rt(o){return ps[(o||"").toLowerCase()]||"#9C27B0"}let Fe=[],Se=-1;async function Wi(){Number(d?.corp_cash_reserves??0);const o=[d.nation_id],e=new Set(we.map(i=>i.id)),{data:t}=await g.from("factions").select("id, faction_name, abbreviation, party_color, party_funds, seats, momentum, nation, nation_id, leader_ideology, linked_user_id, ideology_value_1, ideology_value_2").eq("faction_type","party").in("nation_id",o).is("abandoned_at",null).order("seats",{ascending:!1});Fe=(t||[]).filter(i=>!e.has(i.id)).map(i=>({...i})),Se=-1;const n=document.createElement("div");n.id="donate-overlay",n.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",n.onclick=function(i){i.target===n&&Gn()},document.body.appendChild(n),Yi()}function Gn(){const o=document.getElementById("donate-overlay");o&&o.remove(),Fe=[],Se=-1}function fs(o){Se=o,Yi()}function Yi(){const o=document.getElementById("donate-overlay");if(!o)return;const e=Ae("Lobbyist"),t=e?e.skill:50,n=Math.round(1e6*Qt(t)),i=1e5,a=Number(d?.corp_cash_reserves??0),r=Se>=0?Fe[Se]:null,s=a>=n;let l='<div onclick="event.stopPropagation()" style="width:540px;max-height:80vh;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">';l+=`<div style="padding:14px 20px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:10px;color:#8a6aaa;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Political Donation</span>
            </div>
            <span onclick="actCloseDonation()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Cost:</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#ca5;">${_(n)}</span>
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">&rarr; Target party receives</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#5cb85c;">+${_(i)}</span>
        </div>
        <div style="font-family:var(--font-mono);font-size:10px;color:#6a6660;margin-top:4px;">Parties in the nation where your National HQ is located. You cannot donate to your own party.</div>
    </div>`,l+='<div style="flex:1;overflow-y:auto;padding:10px 0;">',l+='<div style="padding:0 20px 8px;font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Select a Party</div>',Fe.length===0&&(l+='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#6a6660;">No eligible parties found.</div>');for(let c=0;c<Fe.length;c++){const f=Fe[c],p=Se===c,u=f.party_color||"#8a6aaa",m=(f.momentum||0)>0?"var(--panel-text)":"#c55";l+=`<div onclick="donateSelectParty(${c})" style="
            padding:10px 20px;
            border-bottom:1px solid var(--panel-border);
            border-left:3px solid ${p?u:"transparent"};
            background:${p?u+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:10px;height:10px;background:${u};flex-shrink:0;"></div>
                    <div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-size:14px;font-weight:600;color:${p?"var(--panel-text)":"#9e9a92"};">${x(f.faction_name)}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">${x(f.abbreviation||"??")} &middot; ${x(f.nation||"")} &middot; ${f.seats||0} seats</span>
                            ${f.ideology_value_1?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${rt(f.ideology_value_1)};background:${rt(f.ideology_value_1)}12;border:1px solid ${rt(f.ideology_value_1)}30;">${x(f.ideology_value_1.toUpperCase())}</span>`:""}
                            ${f.ideology_value_2?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${rt(f.ideology_value_2)};background:${rt(f.ideology_value_2)}12;border:1px solid ${rt(f.ideology_value_2)}30;">${x(f.ideology_value_2.toUpperCase())}</span>`:""}
                        </div>
                        <div style="display:flex;gap:12px;margin-top:4px;">
                            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Funds: <span style="color:#c8a832;font-weight:700;">${_(f.party_funds||0)}</span></span>
                            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Momentum: <span style="color:${m};font-weight:700;">${Number(f.momentum||0).toFixed(1)}</span></span>
                        </div>
                    </div>
                </div>
                ${p?'<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">SELECTED</span>':""}
            </div>
        </div>`}l+="</div>",l+=`<div style="padding:12px 20px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:16px;">
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">COST</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#ca5;">${_(n)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${s?"var(--panel-text)":"#c55"};">${_(a)}</div></div>
            ${r?`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">RECIPIENT</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--panel-text);">${x(r.abbreviation||r.faction_name)}</div></div>`:""}
        </div>
        <div style="display:flex;gap:8px;">
            <div onclick="actCloseDonation()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="donate-btn" onclick="actSubmitDonation()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${r&&s?"#000":"#6a6660"};background:${r&&s?"#8a6aaa":"var(--panel-border)"};cursor:${r&&s?"pointer":"not-allowed"};${!r||!s?"opacity:0.4;pointer-events:none;":""}">DONATE</div>
        </div>
    </div>`,l+='<div id="donate-error" style="padding:6px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',l+="</div>",o.innerHTML=l}let st=!1;async function ms(){if(!d||!S||Se<0||st)return;const o=Fe[Se];if(!o)return;const e=Number(S?.current_tick||0);if(new Set(we.map(w=>w.id)).has(o.id)){const w=document.getElementById("donate-error");w&&(w.textContent="You cannot donate to your own party.",w.style.display="block");return}const n=Ae("Lobbyist"),i=n?n.skill:50,a=Math.round(1e6*Qt(i)),r=1e5,s=2,{data:l,error:c}=await g.from("factions").select("corp_cash_reserves, last_donation_tick").eq("id",d.id).single();if(c||!l){const w=document.getElementById("donate-error");w&&(w.textContent="Failed to verify cooldown: "+(c?.message||"unknown"),w.style.display="block");return}const f=Number(l.last_donation_tick??0);if(f===e){const w=document.getElementById("donate-error");w&&(w.textContent="Political Donation is on cooldown until next tick.",w.style.display="block"),bt("donate");return}const p=Number(l.corp_cash_reserves??0);if(p<a){const w=document.getElementById("donate-error");w&&(w.textContent="Insufficient cash. Need "+_(a)+", have "+_(p)+".",w.style.display="block");return}st=!0;const u=document.getElementById("donate-btn");u&&(u.style.opacity="0.4",u.style.pointerEvents="none");const m=Number(d.corp_reputation??50),v=Math.max(0,m-s),{data:b,error:y}=await g.from("factions").update({corp_cash_reserves:p-a,corp_reputation:v,last_donation_tick:e}).eq("id",d.id).eq("last_donation_tick",f).select("id");if(y){const w=document.getElementById("donate-error");st=!1,w&&(w.textContent="Failed: "+y.message,w.style.display="block"),u&&(u.style.opacity="1",u.style.pointerEvents="auto");return}if(!b||b.length===0){const w=document.getElementById("donate-error");st=!1,w&&(w.textContent="Political Donation is on cooldown until next tick.",w.style.display="block"),u&&(u.style.opacity="1",u.style.pointerEvents="auto"),bt("donate");return}const{data:$}=await g.from("factions").select("party_funds").eq("id",o.id).single(),h=Number($?.party_funds??0),{error:k}=await g.from("factions").update({party_funds:h+r}).eq("id",o.id);if(k){await g.from("factions").update({corp_cash_reserves:p}).eq("id",d.id);const w=document.getElementById("donate-error");st=!1,w&&(w.textContent="Failed to transfer funds: "+k.message,w.style.display="block"),u&&(u.style.opacity="1",u.style.pointerEvents="auto");return}d.corp_cash_reserves=p-a,d.corp_reputation=v;const T=d.faction_name||"Corporation",{error:C}=await g.from("event_log").insert({nation_id:o.nation_id||d.nation_id,faction_id:d.id,event_name:T+" — Political Donation",description_chosen:T+" has donated "+_(a)+" to "+(o.faction_name||"a political party")+". The party receives "+_(r)+" in campaign funds. Corporate reputation decreases by "+s+".",category:"business",trigger_key:"corp_donation",effects_applied:{cost:a,recipient_faction_id:o.id,recipient_name:o.faction_name,funds_granted:r,reputation_loss:s,skill:i},fired_at_tick:e});C&&console.warn("Failed to log donation event:",C.message),st=!1,bt("donate"),Gn()}function us(o){vt=o,kt()}async function vs(o){if(ke=o,Ce=-1,document.getElementById("exec-search-overlay").style.display="flex",jt.length===0&&d?.nation_id){const{data:e}=await g.from("executive_pool").select("id").eq("nation_id",d.nation_id).limit(1);if(!e||e.length===0){const n=d.nation||"",i=La(d.nation_id,n),{error:a}=await g.from("executive_pool").insert(i);a&&console.warn("Failed to generate executive pool:",a.message)}const{data:t}=await g.from("executive_pool").select("*").eq("nation_id",d.nation_id).eq("status","available").order("skill",{ascending:!1});jt=t||[]}Ji()}function Qi(){document.getElementById("exec-search-overlay").style.display="none",ke=null,Ce=-1}function Ki(o){return jt.filter(e=>e.status==="available"&&Array.isArray(e.specializations)&&e.specializations.includes(o)).sort((e,t)=>t.skill-e.skill)}function ys(o){Ce=o,Ji()}let ro=!1;async function gs(){if(!d||!S||!ke||Ce<0||ro)return;const e=Ki(ke)[Ce];if(!e)return;ro=!0;const t=S.current_tick||0,n=document.getElementById("es-hire-btn");n&&(n.style.opacity="0.4",n.style.pointerEvents="none");const{error:i}=await g.from("corp_executives").insert({faction_id:d.id,role:ke,first_name:e.first_name,last_name:e.last_name,age:e.age,origin_nation:e.origin_nation,skill:e.skill,salary_per_year:e.required_salary,contract_years:e.required_years,contract_start_tick:t,contract_end_tick:t+e.required_years*12,status:"active"});if(i){ro=!1;const r=document.getElementById("es-error");r&&(r.textContent="Failed: "+i.message,r.style.display="block"),n&&(n.style.opacity="1",n.style.pointerEvents="auto");return}const{error:a}=await g.from("executive_pool").update({status:"hired",hired_by_faction_id:d.id}).eq("id",e.id);a&&console.warn("Failed to mark pool candidate as hired:",a.message),ro=!1,Qi(),await Oi(),vt=lo.indexOf(ke),vt<0&&(vt=0),kt()}function Ji(){const o=document.getElementById("exec-search-content");if(!o||!ke)return;const e=ke,t=co[e],n=Ki(e),i=Ce>=0?n[Ce]:null;let a="";a+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:10px;color:${t.color};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Executive Search</span>
            </div>
            <span onclick="closeExecSearch()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:5px;">
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Hiring:</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:${t.color};">${x(e)}</span>
            <span style="font-size:13px;color:var(--text-bright,#f0efe6);">${x(t.fullTitle)}</span>
        </div>
    </div>`,a+='<div style="display:flex;flex:1;min-height:0;overflow:hidden;">',a+='<div style="width:300px;border-right:1px solid var(--panel-border);overflow-y:auto;flex-shrink:0;">',n.length===0&&(a+=`<div style="padding:30px 20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No candidates available for this role in your nation.</div>
        </div>`);for(let r=0;r<n.length;r++){const s=n[r],l=Ce===r,c=xt(s.skill);a+=`<div onclick="esSelectCandidate(${r})" style="
            padding:10px 14px;
            border-bottom:1px solid var(--panel-border);
            border-left:3px solid ${l?t.color:"transparent"};
            background:${l?t.color+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:${t.color}10;border:1px solid ${t.color}22;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${t.color};flex-shrink:0;">${x(xo(s.first_name,s.last_name))}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;color:${l?"var(--text-bright,#f0efe6)":"#9e9a92"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x(s.first_name)} ${x(s.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:4px;flex:1;">
                            <div style="flex:1;height:3px;background:var(--panel-border);">
                                <div style="width:${s.skill}%;height:100%;background:${c};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:${c};width:18px;text-align:right;">${s.skill}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${pt(s.required_salary)}/yr</span>
                    </div>
                </div>
            </div>
        </div>`}if(a+="</div>",a+='<div style="flex:1;overflow-y:auto;">',!i)a+=`<div style="padding:50px 24px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:14px;color:var(--text-dim);margin-bottom:10px;">Select a candidate</div>
            <div style="font-size:12px;color:#6a6660;">${n.length} candidate${n.length!==1?"s":""} available for ${x(e)}</div>
        </div>`;else{const r=i.required_salary*i.required_years,s=xt(i.skill);a+=`<div style="padding:20px;border-bottom:1px solid var(--panel-border);">
            <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:64px;height:64px;background:${t.color}12;border:1px solid ${t.color}28;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:20px;font-weight:700;color:${t.color};">${x(xo(i.first_name,i.last_name))}</div>
                <div>
                    <div style="font-size:20px;font-weight:700;color:var(--text-bright,#f0efe6);">${x(i.first_name)} ${x(i.last_name)}</div>
                    <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-top:3px;">${x(i.origin_nation)} &middot; Age ${i.age}</div>
                </div>
            </div>
        </div>`,a+=`<div style="display:flex;gap:0;border-bottom:1px solid var(--panel-border);">
            <div style="flex:1;padding:12px 14px;text-align:center;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">SKILL</div>
                <div style="display:flex;align-items:center;justify-content:center;gap:5px;margin-top:5px;">
                    <div style="width:60px;height:4px;background:var(--panel-border);">
                        <div style="width:${i.skill}%;height:100%;background:${s};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${s};">${i.skill}</span>
                </div>
            </div>
            <div style="flex:1;padding:12px 14px;text-align:center;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">AGE</div>
                <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${i.age}</div>
            </div>
            <div style="flex:1;padding:12px 14px;text-align:center;">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">ORIGIN</div>
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${x(i.origin_nation)}</div>
            </div>
        </div>`,a+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Role Specializations</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">`;for(const f of i.specializations||[]){const p=co[f],u=f===e;a+=`<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:3px 10px;color:${u?"#000":p?.color||"#9e9a92"};background:${u?p?.color||"#5a8aaa":(p?.color||"#5a8aaa")+"10"};border:1px solid ${u?"transparent":(p?.color||"#5a8aaa")+"30"};">${x(f)}</span>`}a+="</div></div>",a+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Contract Terms</div>
            <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:10px 14px;">
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">CONTRACT LENGTH</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright,#f0efe6);">${i.required_years} years</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">ANNUAL SALARY</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#c84;">${pt(i.required_salary)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright,#f0efe6);">TOTAL CONTRACT VALUE</span>
                    <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${pt(r)}</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;margin-top:5px;">Salary is deducted from cash reserves each tick as an operating expense.</div>
        </div>`;const l=i.skill>=80?"EXCEPTIONAL":i.skill>=65?"STRONG":i.skill>=50?"COMPETENT":i.skill>=35?"DEVELOPING":"WEAK",c=i.skill>=80?"Elite talent. Actions have high success rate and reduced costs.":i.skill>=65?"Strong performer. Reliable outcomes across most actions.":i.skill>=50?"Adequate for the role. Outcomes are average.":i.skill>=35?"Below average. Actions may fail or cost more. Consider alternatives.":"Poor fit. High failure rates. Replacement recommended.";a+=`<div style="padding:12px 20px;">
            <div style="padding:8px 12px;background:${s}08;border:1px solid ${s}18;">
                <div style="font-family:var(--font-mono);font-size:10px;color:${s};letter-spacing:0.8px;margin-bottom:3px;">${l}</div>
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${c}</div>
            </div>
        </div>`}a+="</div>",a+="</div>",a+=`<div style="padding:12px 20px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:14px;">`,i?a+=`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CANDIDATE</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--text-bright,#f0efe6);">${x(i.first_name)} ${x(i.last_name)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SKILL</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${xt(i.skill)};">${i.skill}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SALARY</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:#c84;">${pt(i.required_salary)}/yr</div></div>`:a+='<div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Select a candidate to hire</div>',a+=`</div>
        <div style="display:flex;gap:8px;">
            <div onclick="closeExecSearch()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="es-hire-btn" onclick="esHireCandidate()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${i?"#000":"#6a6660"};background:${i?t.color:"var(--panel-border)"};cursor:${i?"pointer":"not-allowed"};${i?"":"opacity:0.4;pointer-events:none;"}">HIRE</div>
        </div>
    </div>`,a+='<div id="es-error" style="padding:5px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',o.innerHTML=a}function Io(){return Y.reduce((e,t)=>{const n=Number(t.capacity||0),i=Number(t.condition||0)/100;return e+Math.floor(n*i)},0)+500}function xs(o,e){const t=Qe.find(a=>a.id===o),n=Number(d?.[t.factionKey]??0),i=ie[o]+e;if(!(n+i<0)){if(e>0){const a=Qe.reduce((s,l)=>{const c=Number(d?.[l.factionKey]??0),f=l.id===o?i:ie[l.id];return s+c+f},0),r=Io();if(a>r)return}ie[o]=i,No()}}function bs(o){o?ie[o]=0:ie={general:0,skilled:0,innovative:0},No()}async function _s(){if(Jo||!Object.values(ie).some(r=>r!==0))return;let e=0;for(const r of Qe){const s=ie[r.id];s>0&&(e+=s*Mi(r.multiplier)*.1)}const t=Number(d?.corp_cash_reserves??0);if(e>t){alert("Insufficient cash reserves. Hiring cost: "+_(e)+", available: "+_(t));return}const n=Qe.reduce((r,s)=>r+Number(d?.[s.factionKey]??0)+ie[s.id],0),i=Io();if(n>i){alert("Cannot hire beyond property capacity ("+i.toLocaleString()+"). You need more workplaces.");return}const a=e>0?`Confirm workforce changes?

Hiring fee: `+_(e)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(a)){Jo=!0;try{const r={};for(const c of Qe){const f=Number(d?.[c.factionKey]??0);r[c.factionKey]=Math.max(0,f+ie[c.id])}e>0&&(r.corp_cash_reserves=Math.max(0,t-Math.round(e)));const{error:s}=await g.from("factions").update(r).eq("id",d.id);if(s)throw s;Object.assign(d,r),ie={general:0,skilled:0,innovative:0};const l=document.getElementById("topbar-cash");if(l){const c=Number(d.corp_cash_reserves??0);l.textContent="CASH: "+(c>=1e6?"$"+(c/1e6).toFixed(1)+"M":"$"+Math.round(c/1e3)+"k")}No()}catch(r){alert("Error: "+r.message)}finally{Jo=!1}}}function No(){const o=document.getElementById("hf-card-container");if(!o)return;const e="'JetBrains Mono', monospace",t={bg:"var(--bg-card)",surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},n=Number(z?.minimum_wage??50),i=Number(z?.inflation??50),a=Number(z?.standard_of_living??50),r=n/100*48e3,s=(1+(i-50)/100*.5).toFixed(2),l=(1+(a-50)/100*.5).toFixed(2),c=z?.name||d?.nation||"Nation",f=Object.values(ie).some(h=>h!==0),p=Io();let u=0,m=0,v=0,b=0,y="";for(const h of Qe){const k=Number(d?.[h.factionKey]??0),T=ie[h.id],C=k+T,w=Mi(h.multiplier),I=T>0,R=k*w,E=C*w,q=E-R;u+=k,m+=C,v+=R,b+=E;const L=T!==0?I?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";y+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${t.border};background:${L};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${h.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${h.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${t.text}">${k.toLocaleString()}</span>
                    ${T!==0?`<span style="font-family:${e};font-size:10px;color:${t.dim}">→</span>
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${I?t.greenBright:t.red}">${C.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${h.multiplier}.0 × ${s} × ${l})</span>
                <span style="font-family:${e};font-size:10px;color:${h.color}">${_(w)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${h.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.red};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-50</div>
                <div onclick="hfSetChange('${h.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.redDim};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${T!==0?t.card:"transparent"};border:1px solid ${T!==0?t.border:"transparent"}">
                    ${T!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${e};font-size:12px;font-weight:700;color:${I?t.greenBright:t.red}">${I?"+":""}${T}</span>
                        <span onclick="hfReset('${h.id}')" style="font-family:${e};font-size:8px;color:${t.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${e};font-size:9px;color:${t.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${h.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+10</div>
                <div onclick="hfSetChange('${h.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+50</div>
            </div>
            ${T!==0?`<div style="margin-top:6px;padding:4px 8px;background:${t.bg};border:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${q>0?t.red:t.greenBright}">${q>0?"+":""}${_(q)}/yr</span>
            </div>`:""}
        </div>`}const $=b-v;o.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Hire / Fire</span>
            </div>
            <span style="font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${c.toUpperCase()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            <div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:${t.card};">
                <div style="font-family:${e};font-size:8px;letter-spacing:1.5px;color:${t.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;gap:0;">
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">MIN WAGE</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${n}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">${_(r)}/yr</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">INFLATION</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${i}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${s}</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">STD OF LIVING</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${a}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${l}</div>
                    </div>
                </div>
            </div>
            ${y}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;${f?"margin-bottom:6px;":""}">
                <div>
                    <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">WORKFORCE / CAPACITY</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <span style="font-family:${e};font-size:13px;font-weight:700;color:${u>=p?t.red:t.text}">${f?m.toLocaleString():u.toLocaleString()}</span>
                        <span style="font-family:${e};font-size:9px;color:${t.dim}">/ ${p.toLocaleString()}</span>
                    </div>
                    ${u>=p&&!f?`<div style="font-family:${e};font-size:7px;color:${t.red};margin-top:2px;">Need workplaces to hire new employees.</div>`:""}
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${_(v)}</span>
                        ${f?`<span style="font-family:${e};font-size:9px;color:${t.dim}">→</span>
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${$>0?t.red:t.greenBright}">${_(b)}</span>`:""}
                    </div>
                </div>
            </div>
            ${f?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${t.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">NET CHANGE</span>
                    <span style="font-family:${e};font-size:11px;font-weight:700;color:${$>0?t.red:t.greenBright}">${$>0?"+":""}${_($)}/yr</span>
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">(${$>0?"+":""}${_(Math.round($/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${t.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}function hs(){const o=document.getElementById("wf-summary-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},n=(z?.name||d?.nation||"Nation").toUpperCase(),i=Number(z?.minimum_wage??50),a=Number(z?.inflation??50),r=Number(z?.standard_of_living??50),s=i/100*48e3,l=1+(a-50)/100*.5,c=1+(r-50)/100*.5,f=[{label:"General Workforce",mult:2,color:t.accent,key:"corp_general_workforce",countColor:t.text},{label:"Skilled Workforce",mult:3,color:t.gold,key:"corp_skilled_workforce",countColor:t.blue},{label:"Innovative Workforce",mult:6,color:t.orange,key:"corp_innovative_workforce",countColor:t.gold}];let p=0,u=0,m="";for(const v of f){const b=Number(d?.[v.key]??0),y=Math.round(s*v.mult*l*c),$=b*y;p+=b,u+=$,m+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${v.label}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${n}</span>
                </div>
                <span style="font-family:${e};font-size:16px;font-weight:700;color:${v.countColor}">${b.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${v.mult}.0 × ${l.toFixed(2)} × ${c.toFixed(2)})</span>
                <span style="font-family:${e};font-size:10px;color:${t.muted}">${_(y)}/yr</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">TOTAL ANNUAL COST</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${_($)}</span>
            </div>
        </div>`}o.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Workforce</span>
            </div>
            <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.text}">${p.toLocaleString()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${m}
            <div style="padding:8px 12px;background:${t.card};border-bottom:1px solid ${t.border};">
                <div style="font-family:${e};font-size:8px;letter-spacing:1px;color:${t.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">MINIMUM WAGE (${n})</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">${i}/100 → ${_(s)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">INFLATION MODIFIER</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">×${l.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">STD OF LIVING MODIFIER</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">×${c.toFixed(2)}</span>
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
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${_(u)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">PER TICK (÷12)</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${_(Math.round(u/12))}</span>
            </div>
        </div>
    </div>`}let Y=[];async function Ao(){if(!d?.id)return;const{data:o}=await g.from("corp_properties").select("*").eq("faction_id",d.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});Y=o||[]}function Mo(){const o=document.getElementById("property-card-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},n=(z?.name||d?.nation||"Nation").toUpperCase(),i=1+(Number(z?.inflation??50)-50)/100*.3;let a="",r=0,s=0;const l=z?.name||d?.nation||"Home Nation",c=5e7,f=1+(Number(z?.inflation??50)-50)/100*.3,p=.8+Number(z?.stability??50)/100*.4,u=Math.round(c*f*p),m=Math.round(u*.005);r+=u,s+=m,a+=`
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
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${_(u)}</div>
            </div>
            <div style="flex:1;padding:3px 6px">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${_(m)}</div>
            </div>
        </div>
    </div>`;for(const v of Y){const b=_o[v.style]||_o.Basic;r+=Number(v.purchase_price||0),s+=Number(v.monthly_maintenance||0),a+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:${t.text}">${v.name}</span>
                <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${t.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">OWNED</span>
            </div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:4px;">${v.city||n} · ${(v.type||"").replace(/_/g," ")} · <span style="color:${b.color}">${(v.style||"Basic").toUpperCase()}</span></div>
            <div style="display:flex;gap:0;background:${t.card};border:1px solid ${t.border}">
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">CAPACITY</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${(v.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">PAID</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${_(v.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${_(v.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="margin-top:4px;display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">CONDITION</span>
                <span style="font-family:${e};font-size:9px;color:${v.condition>=75?"#5c5":v.condition>=50?"#ca5":t.orange}">${v.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:${t.border};margin-top:2px;"><div style="width:${v.condition}%;height:100%;background:${v.condition>=75?"#5c5":v.condition>=50?"#ca5":t.orange}"></div></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <div onclick="propRefurbish('${v.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.accent};border:1px solid ${t.accent}33;cursor:pointer;">REFURBISH (${_(Math.round((v.purchase_price||0)*.1*i))})</div>
                <div onclick="propSell('${v.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.red};border:1px solid ${t.red}33;cursor:pointer;">SELL</div>
            </div>
        </div>`}o.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Property</span>
            </div>
            <span style="font-family:${e};font-size:10px;color:${t.muted}">${Y.length+1} ASSET${Y.length+1!==1?"S":""}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${a}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL VALUE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.green}">${_(r)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL MAINTENANCE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${_(s)}/mo</span>
            </div>
        </div>
    </div>`}let ft=[],se=null;const _o={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function Vn(){if(!d?.nation_id)return;const{data:o,error:e}=await g.from("available_properties").select("*").eq("nation_id",d.nation_id).eq("status","available").order("price",{ascending:!0});if(e){console.warn("[Property] Failed to load marketplace:",e.message);return}const t=d?.corp_sector==="Construction";ft=(o||[]).filter(n=>t||n.type!=="warehouse").map(n=>({...n,adjusted_cost:n.price,adjusted_maintenance:n.monthly_maintenance}))}function Ro(){const o=document.getElementById("new-property-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"};(z?.name||d?.nation||"Nation").toUpperCase();const n=Number(z?.standard_of_living??50),i=Number(z?.gdp_growth??50),a=Number(z?.inflation??50),r=z?.capital||"Capital",s={capital:r,port:r+" Port",industrial:r+" Industrial Zone",suburban:r+" Suburbs",coastal:r+" Coast"};let l="";if(ft.length===0)l=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let c=0;c<ft.length;c++){const f=ft[c],p=se===c,u=_o[f.style]||_o.Basic,m=s[f.city_template]||r;l+=`
            <div onclick="npSelect(${c})" style="padding:8px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${p?t.accent:"transparent"};background:${p?"rgba(139,154,107,0.03)":"transparent"};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <span style="font-size:11px;font-weight:600;color:${t.text}">${f.name}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${u.color};background:${u.color}12;border:1px solid ${u.color}25">${u.label}</span>
                </div>
                <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:5px;">${m} · ${f.type.replace(/_/g," ")}</div>
                <div style="display:flex;gap:0;background:${t.card};border:1px solid ${t.border}">
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">CAPACITY</div>
                        <div style="font-family:${e};font-size:11px;font-weight:700;color:${t.text};margin-top:1px">${f.capacity.toLocaleString()}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">PRICE</div>
                        <div style="font-family:${e};font-size:11px;font-weight:700;color:${t.gold};margin-top:1px">${_(f.adjusted_cost)}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">MAINT/MO</div>
                        <div style="font-family:${e};font-size:11px;font-weight:700;color:${t.redDim};margin-top:1px">${_(f.adjusted_maintenance)}</div>
                    </div>
                </div>
                ${p?`<div style="margin-top:5px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">CONDITION</span>
                        <span style="font-family:${e};font-size:9px;color:${f.condition>=75?t.greenBright:f.condition>=50?t.yellow:t.orange}">${f.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${t.border}"><div style="width:${f.condition}%;height:100%;background:${f.condition>=75?t.greenBright:f.condition>=50?t.yellow:t.orange}"></div></div>
                </div>`:""}
            </div>`}o.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">New Property</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${ft.length} AVAILABLE</span>
        </div>
        <div style="padding:4px 14px;border-bottom:1px solid ${t.border};display:flex;gap:12px;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">STD OF LIVING</span>
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${n>=50?t.greenBright:t.yellow}">${Math.round(n)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">GDP GROWTH</span>
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${i>=50?t.greenBright:t.yellow}">${Math.round(i)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">INFLATION</span>
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${a<=50?t.greenBright:t.red}">${Math.round(a)}</span>
            </div>
        </div>
        <div style="flex:1;overflow:auto;">
            ${l}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;gap:6px;justify-content:space-between;">
                <div onclick="npOpenConstructionModal()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${t.gold};border:1px solid ${t.gold}44;cursor:pointer">CONSTRUCTION PROJECT</div>
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${se!==null?"#000":t.dim};background:${se!==null?t.accent:"transparent"};border:1px solid ${se!==null?t.accent:t.border};cursor:${se!==null?"pointer":"default"};opacity:${se!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function $s(o){se=se===o?null:o,Ro()}let en=!1;async function ws(){if(se===null||en)return;const o=ft[se];if(!o)return;const e=Number(d?.corp_cash_reserves??0);if(o.adjusted_cost>e){alert(`Insufficient cash reserves.
Property: `+_(o.adjusted_cost)+`
Cash: `+_(e));return}if(confirm('Buy "'+o.name+'" for '+_(o.adjusted_cost)+`?

Monthly maintenance: `+_(o.adjusted_maintenance)+`/mo
Condition: `+o.condition+`%

This will be deducted from your cash reserves.`)){en=!0;try{const{error:t}=await g.from("corp_properties").insert({faction_id:d.id,nation_id:d.nation_id,catalog_id:o.catalog_id||null,name:o.name,type:o.type,style:o.style,capacity:o.capacity,purchase_price:o.adjusted_cost,monthly_maintenance:o.adjusted_maintenance,condition:o.condition,city:o.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(t)throw t;const n=Math.max(0,e-o.adjusted_cost),{error:i}=await g.from("factions").update({corp_cash_reserves:n}).eq("id",d.id);if(i)throw i;d.corp_cash_reserves=n,o.id&&await g.from("available_properties").update({status:"sold",purchased_by:d.id}).eq("id",o.id);const a=document.getElementById("topbar-cash");a&&(a.textContent="CASH: "+(n>=1e6?"$"+(n/1e6).toFixed(1)+"M":"$"+Math.round(n/1e3)+"k")),se=null,await Vn(),Ro(),Mo(),alert("Property purchased: "+o.name+`

Deducted: `+_(o.adjusted_cost))}catch(t){alert("Purchase failed: "+t.message)}finally{en=!1}}}const ht={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let Wn=!1,M={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0,nationId:null,nationName:null},tn=!1,$n=[];function Xi(){const e=1+(Number(z?.inflation??50)-50)/100*.3,t=ht[M.style]?.costMod||1,n=M.type==="Warehouse"?.75:1,i=Math.round(M.size*1e5*e*t*n),a=Math.round(i*(1+M.budgetMod/100)),r=Math.round(a*.007*(ht[M.style]?.maintMod||1));return{baseBudget:i,adjusted:a,maint:r,inflMod:e,styleMod:t}}async function ks(){Wn=!0,M={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0,nationId:null,nationName:null};try{const{data:o}=await g.from("nations").select("id, name").order("name");$n=(o||[]).filter(e=>e.id!==d?.nation_id)}catch{$n=[]}Zi()}function Yn(){Wn=!1,document.getElementById("cp-modal-overlay")?.remove()}function Es(o,e){M[o]=e,Zi()}async function Cs(){if(!(tn||!M.name.trim())){if(M.type==="Regional HQ"&&!M.nationId){alert("Select a target nation for the Regional HQ.");return}tn=!0;try{const o=Xi(),e=M.type==="Regional HQ"?M.nationId:d.nation_id,t=M.type==="Regional HQ"?M.nationName||"Unknown":z?.name||d?.nation||"Unknown",n=ht[M.style]?.repGain||1,i=await g.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),a=i.data?.current_tick||0,r=(i.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:s}=await g.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",e).eq("issuer_type","PRIVATE"),c=`PVT-C${(s||0)+1}-${r}`,{error:f}=await g.from("construction_contracts").insert({nation_id:e,template_key:"custom_building",sector:"civil_engineering",name:M.name.trim(),project_type:M.type,project_subtype:M.style,description:`${M.type} (${M.style}) — ${M.size.toLocaleString()} employees, commissioned by ${d.faction_name}`,project_code:c,budget_ceiling:o.adjusted,timeline_ticks:M.timeline,required_materials:(()=>{const p=M.size/1e3,u=M.style,m={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[u]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},v=(b,y)=>Math.max(1,Math.ceil(p*b*y));return{concrete:v(8,m.concrete),steel:v(6,m.steel),glass_facades:v(3,m.glass),em_systems:v(4,m.em),lumber:v(1,m.lumber),heavy_parts:v(2,m.heavy),aggregate:v(3,m.agg)}})(),required_equipment:(()=>{const p=M.size,u={trucks:Math.ceil(p/2e3)+1,mixers:Math.ceil(p/3e3)+1};return p>1e3&&(u.excavators=Math.ceil(p/3e3)+1,u.cranes=Math.ceil(p/4e3)+1),p>3e3&&(u.bulldozers=Math.ceil(p/4e3)+1,u.haulers=Math.ceil(p/5e3)+1),p>8e3&&(u.piledrivers=Math.ceil(p/6e3)+1),u})(),required_workforce:{general:Math.ceil(M.size*.08),skilled:Math.ceil(M.size*.03)},status:"open",generated_at_tick:a,bidding_ends_tick:a+3,issuer_type:"PRIVATE",issuer_name:d.faction_name,issuer_faction_id:d.id});if(f)throw f;Yn(),alert(`Construction project submitted!

Project: `+M.name.trim()+`
Code: `+c+`
Budget: `+_(o.adjusted)+`
Expected Reputation: +`+Math.ceil(o.adjusted/1e8*3)+` (+3 per $100M)

All construction corporations in `+t+" can now bid on this project.")}catch(o){alert("Failed to submit project: "+o.message)}finally{tn=!1}}}function Zi(){if(document.getElementById("cp-modal-overlay")?.remove(),!Wn)return;const o="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},t=Xi(),n=z?.name||d?.nation||"Nation",i=Math.ceil(t.adjusted/1e8*3),a=i>=4?e.gold:i>=3?e.greenBright:i>=2?e.accent:e.dim,r=Object.entries(ht).map(([c,f])=>{const p=M.style===c;return`<div onclick="cpSetField('style','${c}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${p?f.color+"18":"transparent"};border:1px solid ${p?f.color+"44":e.border};">
            <div style="font-family:${o};font-size:9px;font-weight:700;color:${p?f.color:e.dim}">${c}</div>
            <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:1px">×${f.costMod.toFixed(1)} cost</div>
        </div>`}).join(""),s=document.createElement("div");s.id="cp-modal-overlay",s.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",s.innerHTML=`
    <div style="width:570px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;max-height:90vh;">
        <div style="padding:12px 20px;border-bottom:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:10px;color:${e.gold}">●</span>
                <span style="font-family:${o};font-size:14px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Construction Project</span>
            </div>
            <span onclick="cpClose()" style="font-family:${o};font-size:18px;color:${e.dim};cursor:pointer">×</span>
        </div>
        <div style="padding:14px 20px;overflow:auto;flex:1;">

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Building Name</div>
                <input id="cp-name-input" value="${M.name.replace(/"/g,"&quot;")}" placeholder="e.g., McKenna Tower"
                    style="width:100%;padding:8px 12px;font-family:${o};font-size:14px;color:${e.text};background:${e.card};border:1px solid ${e.border};outline:none;box-sizing:border-box;" />
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Type</div>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                    ${["Regional HQ","Office Building",...d?.corp_sector==="Construction"?["Warehouse"]:[],...d?.corp_subsector?.toLowerCase()==="banking"?["Branch Office"]:[],...d?.corp_subsector?.toLowerCase()==="investment"?["Trading Floor"]:[],...d?.corp_subsector?.toLowerCase()==="insurance"?["Claims Office"]:[]].map(c=>{const f=["Branch Office","Trading Floor","Claims Office"].includes(c),u=c==="Warehouse"?e.orange:f?"#8a6aaa":e.accent;return`<span onclick="cpSetField('type','${c}')" style="flex:1;min-width:100px;text-align:center;padding:6px 0;font-family:${o};font-size:12px;font-weight:700;cursor:pointer;color:${M.type===c?"#000":e.dim};background:${M.type===c?u:"transparent"};border:1px solid ${M.type===c?u:e.border}">${c}</span>`}).join("")}
                </div>
                ${M.type==="Regional HQ"?`<div style="margin-top:8px;">
                    <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Target Nation</div>
                    <select id="cp-nation-select" onchange="cpSetField('nationId', this.value); cpSetField('nationName', this.options[this.selectedIndex].text)"
                        style="width:100%;padding:8px 12px;font-family:${o};font-size:12px;color:${e.text};background:${e.card};border:1px solid ${e.border};outline:none;">
                        <option value="">-- Select a nation --</option>
                        ${$n.map(c=>`<option value="${c.id}" ${M.nationId===c.id?"selected":""}>${c.name}</option>`).join("")}
                    </select>
                    <div style="font-family:${o};font-size:9px;color:${e.accent};margin-top:5px;">Regional HQ: Establishes corporate presence in another nation. Construction corps in that nation will bid on building it.</div>
                </div>`:""}
                ${M.type==="Warehouse"?`<div style="font-family:${o};font-size:9px;color:${e.orange};margin-top:5px;">Warehouse: 75% construction cost, stores up to $20M in materials</div>`:""}
                ${M.type==="Branch Office"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Branch Office: Increases lending capacity. +1 reputation per 200 employees. Enables cross-nation lending.</div>`:""}
                ${M.type==="Trading Floor"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Trading Floor: Enables secondary bond market. +1 reputation per 200 employees. Portfolio management bonuses.</div>`:""}
                ${M.type==="Claims Office"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Claims Office: Faster claim processing. +1 reputation per 200 employees. Local presence reduces premiums.</div>`:""}
            </div>

            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <span style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase">Size (Employees)</span>
                    <span style="font-family:${o};font-size:18px;font-weight:700;color:${e.text}">${M.size.toLocaleString()}</span>
                </div>
                <input type="range" min="500" max="18000" step="500" value="${M.size}" oninput="cpSetField('size',+this.value)"
                    style="width:100%;accent-color:${e.accent};height:5px;" />
                <div style="display:flex;justify-content:space-between;font-family:${o};font-size:9px;color:${e.dim};margin-top:3px">
                    <span>500 min</span><span>18,000 max</span>
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Style</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;">${r}</div>
                <div style="margin-top:5px;font-family:${o};font-size:10px;color:${ht[M.style].color}">${ht[M.style].desc}</div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <span style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase">Timeline</span>
                    <span style="font-family:${o};font-size:16px;font-weight:700;color:${e.text}">${M.timeline} months</span>
                </div>
                <input type="range" min="24" max="60" step="6" value="${M.timeline}" oninput="cpSetField('timeline',+this.value)"
                    style="width:100%;accent-color:${e.gold};height:5px;" />
                <div style="display:flex;justify-content:space-between;font-family:${o};font-size:9px;color:${e.dim};margin-top:3px">
                    <span>24 months</span><span>60 months</span>
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Budget</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:10px 12px;">
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border}">
                        <span style="font-family:${o};font-size:10px;color:${e.dim}">BASE (${M.size.toLocaleString()} × $100k × ${t.inflMod.toFixed(2)} × ${t.styleMod.toFixed(1)})</span>
                        <span style="font-family:${o};font-size:12px;color:${e.muted}">${_(t.baseBudget)}</span>
                    </div>
                    <div style="padding:8px 0">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                            <span style="font-family:${o};font-size:10px;color:${e.dim}">ADJUSTMENT</span>
                            <span style="font-family:${o};font-size:13px;font-weight:700;color:${M.budgetMod>0?e.greenBright:M.budgetMod<0?e.red:e.dim}">${M.budgetMod>0?"+":""}${M.budgetMod}%</span>
                        </div>
                        <input type="range" min="-15" max="15" step="1" value="${M.budgetMod}" oninput="cpSetField('budgetMod',+this.value)"
                            style="width:100%;accent-color:${e.accent};height:5px;" />
                        <div style="display:flex;justify-content:space-between;font-family:${o};font-size:9px;color:${e.dim};margin-top:3px">
                            <span>-15% (budget cut)</span><span>+15% (quality invest)</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:5px 0;border-top:1px solid ${e.border}">
                        <span style="font-family:${o};font-size:12px;font-weight:700;color:${e.text}">TOTAL BUDGET</span>
                        <span style="font-family:${o};font-size:18px;font-weight:700;color:${e.gold}">${_(t.adjusted)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0">
                        <span style="font-family:${o};font-size:10px;color:${e.dim}">EST. MONTHLY MAINTENANCE</span>
                        <span style="font-family:${o};font-size:12px;color:${e.redDim}">${_(t.maint)}/mo</span>
                    </div>
                </div>
            </div>

            <div style="padding:8px 10px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);margin-bottom:10px;">
                <div style="font-family:${o};font-size:10px;color:${e.gold};margin-bottom:3px">WHAT HAPPENS NEXT</div>
                <div style="font-size:12px;color:${e.dim};line-height:1.5">
                    This project will appear as a Civil Engineering bid in the Open Contracts pool for all construction corporations with an HQ or Regional HQ in ${n}. The lowest qualified bidder wins the contract and begins construction.
                </div>
            </div>

            <div style="padding:8px 10px;background:rgba(139,154,107,0.04);border:1px solid rgba(139,154,107,0.12);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:${o};font-size:12px;color:${e.accent}">EXPECTED REPUTATION GAIN</span>
                    <span style="font-family:${o};font-size:20px;font-weight:700;color:${a}">+${i}</span>
                </div>
                <div style="font-family:${o};font-size:9px;color:${e.dim};margin-top:3px">${M.style} style · ${i===5?"Maximum prestige":i>=4?"Impressive presence":i>=3?"Strong statement":i>=2?"Solid investment":"Functional addition"}</div>
            </div>

        </div>
        <div style="padding:12px 20px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${o};font-size:9px;color:${e.dim}">TOTAL PROJECT</div>
                <div style="font-family:${o};font-size:18px;font-weight:700;color:${e.gold}">${_(t.adjusted)}</div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="cpClose()" style="padding:7px 20px;font-family:${o};font-size:12px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:7px 20px;font-family:${o};font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${e.gold};cursor:pointer;opacity:${M.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(s);const l=document.getElementById("cp-name-input");l&&l.addEventListener("input",c=>{M.name=c.target.value}),s.addEventListener("click",c=>{c.target===s&&Yn()})}function Ts(){const o=document.getElementById("cp-name-input");if(o&&(M.name=o.value),!M.name.trim()){alert("Please enter a building name.");return}Cs()}window.cpClose=Yn;window.cpSetField=Es;window.cpSubmitFromModal=Ts;window.npSelect=$s;window.npBuyProperty=ws;window.npOpenConstructionModal=ks;let $t=!1;async function Ss(o){if($t)return;const e=Y.find(s=>s.id===o);if(!e)return;const t=1+(Number(z?.inflation??50)-50)/100*.3,n=Math.round((e.purchase_price||0)*.1*t),i=Number(d?.corp_cash_reserves??0);if(n>i){alert("Insufficient cash. Refurbishment costs "+_(n)+" (inflation-adjusted), you have "+_(i));return}if(e.condition>=95){alert("Property is already in excellent condition ("+e.condition+"%).");return}const a=5+Math.floor(Math.random()*21),r=Math.min(100,e.condition+a);if(confirm('Refurbish "'+e.name+`"?

Cost: `+_(n)+`
Expected improvement: +`+a+"% condition ("+e.condition+"% → "+r+"%)")){$t=!0;try{await g.from("corp_properties").update({condition:r}).eq("id",o);const s=Math.max(0,i-n);await g.from("factions").update({corp_cash_reserves:s}).eq("id",d.id),d.corp_cash_reserves=s;const l=document.getElementById("topbar-cash");l&&(l.textContent="CASH: "+(s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k")),await Ao(),Mo(),alert("Refurbished! Condition: "+e.condition+"% → "+r+"%")}catch(s){alert("Refurbishment failed: "+s.message)}finally{$t=!1}}}async function zs(o){if($t)return;const e=Y.find(a=>a.id===o);if(!e)return;const t=1+(Number(z?.inflation??50)-50)/100*.3,n=(e.condition||50)/100,i=Math.round((e.purchase_price||0)*.6*n*t);if(confirm('Sell "'+e.name+`"?

Sale value: `+_(i)+" (60% × "+e.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){$t=!0;try{await g.from("corp_properties").update({is_active:!1}).eq("id",o);const r=Number(d?.corp_cash_reserves??0)+i;await g.from("factions").update({corp_cash_reserves:r}).eq("id",d.id),d.corp_cash_reserves=r;const l=(await g.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await g.from("available_properties").insert({nation_id:d.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,price:Math.round(i*1.1),monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,generated_at_tick:l,expires_at_tick:l+6,status:"available"});const c=document.getElementById("topbar-cash");c&&(c.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")),await Ao(),Mo(),await Vn(),Ro(),alert('Sold "'+e.name+'" for '+_(i))}catch(a){alert("Sale failed: "+a.message)}finally{$t=!1}}}window.propRefurbish=Ss;window.propSell=zs;const Pe={SALE:.8,DISSOLVE:.6,REVENUE_BASE:.02,GDP_NEUTRAL:30,DEFAULT_REPUTATION:25};function Is(o){if(!o)return 0;const e=o.trim().replace(/[$,]/g,""),t=e.match(/^([\d.]+)\s*[Mm]$/),n=e.match(/^([\d.]+)\s*[Kk]$/);return Math.round(t?parseFloat(t[1])*1e6:n?parseFloat(n[1])*1e3:parseFloat(e))}function tt(o){const e=document.getElementById("topbar-cash");e&&(e.textContent="CASH: "+(o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k"))}function ea(o){return Ct.find(e=>e.id===o)?.name||"—"}function Lo(o){return Y.filter(e=>e.nation_id===o)}async function Kt(){mt=0,await Ao(),Mo(),Jt(),Xt()}let re=!1,mt=0,so={};async function Ns(){if(d?.id)try{const{data:o}=await g.from("construction_contracts").select("nation_id").eq("awarded_to_faction",d.id).in("status",["in_progress","awarded"]);so={};for(const e of o||[])e.nation_id&&(so[e.nation_id]=(so[e.nation_id]||0)+1)}catch{}}function ta(o){const e=Lo(o.nation_id),t=e.reduce((v,b)=>v+Number(b.purchase_price||0),0),n=e.reduce((v,b)=>v+Number(b.capacity||0),0),i=so[o.nation_id]||0,a=Ct.find(v=>v.id===o.nation_id),r=(o.name||"").trim().split(/\s+/),s=r.length>=2?r.map(v=>v[0]).join("").toUpperCase().slice(0,4):(o.name||"SUB").slice(0,4).toUpperCase(),l=Number(o.sub_cash||0),c=Number(a?.gdp_growth??50),f=l*Pe.REVENUE_BASE,p=(c-Pe.GDP_NEUTRAL)/100,u=Pe.DEFAULT_REPUTATION/100,m=l>0?Math.round(f*(1+p)*u):0;return{id:o.id,name:o.name,abbr:s,nation:a?.name||o.city||"—",nationId:o.nation_id,sector:d?.corp_sector||"General",subsector:o.subsector||d?.corp_subsector||"—",revenue:m,debt:0,cash:l,reputation:Pe.DEFAULT_REPUTATION,valuation:t,workforce:n,projects:i,established:o.created_at?new Date(o.created_at).getFullYear().toString():"—",trend:c>=40&&l>0?"up":c>=Pe.GDP_NEUTRAL&&l>0?"flat":"down",profitable:m>0,hqProp:o}}function Jt(){const o=document.getElementById("manage-subsidiaries-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},i=Y.filter(f=>f.type==="regional_hq").map(ta);mt>=i.length&&(mt=0);const a=i[mt]||null;let r="";i.length===0&&(r=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No subsidiaries established.<br>Use Create Subsidiary to expand.</div>`);let s=0,l=0;for(let f=0;f<i.length;f++){const p=i[f],u=f===mt;s+=p.revenue,l+=p.valuation;const m=p.trend==="up"?t.greenBright:p.trend==="down"?t.red:t.dim,v=p.trend==="up"?"▲":p.trend==="down"?"▼":"–";r+=`
        <div onclick="selectSubsidiary(${f})" style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${u?t.accent:"transparent"};background:${u?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:40px;font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${p.abbr}</span>
            <div style="flex:1.5;">
                <div style="font-size:11px;font-weight:600;color:${t.text};line-height:1.2">${p.name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${p.subsector}</div>
            </div>
            <span style="width:65px"><span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${p.nation.toUpperCase().slice(0,8)}</span></span>
            <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${p.profitable?t.greenBright:t.redDim};text-align:right">${_(p.revenue)}</span>
            <span style="width:40px;font-family:${e};font-size:9px;font-weight:700;color:${p.reputation>=40?t.accent:p.reputation>=25?t.yellow:t.orange};text-align:right">${p.reputation}</span>
            <span style="width:55px;font-family:${e};font-size:9px;color:${t.muted};text-align:right">${_(p.valuation)}</span>
            <span style="width:12px;font-family:${e};font-size:8px;color:${m};text-align:right">${v}</span>
        </div>`}let c="";if(a){const f=a.trend==="up"?t.greenBright:a.trend==="down"?t.red:t.dim,p=a.trend==="up"?"▲":a.trend==="down"?"▼":"–",u=a.trend==="up"?"Growing":a.trend==="down"?"Declining":"Stable",m=a.reputation>=40?t.accent:a.reputation>=25?t.yellow:t.orange,v=[{label:"Revenue",value:_(a.revenue),color:a.profitable?t.greenBright:t.redDim},{label:"Cash",value:_(a.cash),color:t.text},{label:"Debt",value:a.debt>0?_(a.debt):"$0",color:a.debt>0?t.orange:t.dim},{label:"Reputation",value:a.reputation+"/100",color:m},{label:"Market Valuation",value:_(a.valuation),color:t.gold},{label:"Workforce",value:a.workforce.toLocaleString(),color:t.text},{label:"Active Projects",value:a.projects.toString(),color:a.projects>0?t.text:t.dim}],b=a.projects===0,y=a.hqProp?.logo_url?`<img src="${x(a.hqProp.logo_url)}" alt="" style="width:32px;height:32px;object-fit:cover;border-radius:4px;">`:`<label style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:${t.card};border:1px dashed ${t.border};border-radius:4px;cursor:pointer;font-size:14px;color:${t.dim};" title="Upload subsidiary logo">+<input type="file" accept="image/*" id="sub-logo-upload" data-prop-id="${a.hqProp?.id||""}" style="display:none;"></label>`;c=`
            <div style="padding:8px 14px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                    ${y}
                    <div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.gold}">${a.abbr}</span>
                            <span style="font-size:12px;font-weight:700;color:${t.text}">${a.name}</span>
                        </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${a.nation.toUpperCase()}</span>
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">Est. ${a.established}</span>
                    <span style="font-family:${e};font-size:8px;color:${f}">${p} ${u}</span>
                </div>
                    </div>
                </div>
            </div>
            ${v.map($=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 14px;border-bottom:1px solid ${t.border};">
                <span style="font-family:${e};font-size:9px;color:${t.dim};letter-spacing:0.5px;text-transform:uppercase">${$.label}</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;color:${$.color}">${$.value}</span>
            </div>`).join("")}
            <div style="padding:6px 14px;border-bottom:1px solid ${t.border};flex-shrink:0;">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                    <span style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">REPUTATION</span>
                    <span style="font-family:${e};font-size:8px;color:${t.muted}">75% sub / 25% parent</span>
                </div>
                <div style="width:100%;height:4px;background:${t.border}"><div style="width:${a.reputation}%;height:100%;background:${m}"></div></div>
            </div>
            ${a.subsector==="Insurance"||a.subsector==="Banking"?`<div id="sub-dashboard-${a.id}" style="flex:1;overflow-y:auto;"></div>`:'<div style="flex:1"></div>'}
            <div style="padding:6px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                <div style="font-family:${e};font-size:8px;letter-spacing:1.5px;color:${t.dim};text-transform:uppercase;margin-bottom:6px">Actions</div>
                <div style="display:flex;gap:4px;margin-bottom:4px;">
                    <div onclick="subInjectCapital('${a.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${t.greenBright};border:1px solid ${t.greenDark};background:rgba(74,170,136,0.06)">INJECT CAPITAL</div>
                    <div onclick="subWithdraw('${a.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${a.cash>0?t.gold:t.dim};border:1px solid ${a.cash>0?t.gold+"44":t.border};opacity:${a.cash>0?1:.4}">WITHDRAW</div>
                </div>
                <div style="display:flex;gap:4px;">
                    <div onclick="subMerge('${a.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${t.accent};border:1px solid ${t.accent}">MERGE</div>
                    <div onclick="subPutForSale('${a.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${t.orange};border:1px solid ${t.orange}">PUT UP FOR SALE</div>
                    <div onclick="${b?"subDissolve('"+a.id+"')":""}" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${b?t.red:t.dim};border:1px solid ${b?t.red:t.border};opacity:${b?1:.3}">DISSOLVE</div>
                </div>
                ${a.projects>0?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${t.dim}">Cannot dissolve with active projects.</div>`:""}
            </div>`}else c=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a subsidiary to manage.</div>`;if(o.innerHTML=`
    <div style="width:760px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Manage Subsidiaries</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${i.length} ACTIVE</span>
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
                <div style="flex:1;overflow:auto;">${r}</div>
                <div style="padding:6px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;display:flex;align-items:center;">
                    <span style="width:40px"></span>
                    <span style="flex:1.5;font-family:${e};font-size:8px;color:${t.dim}">COMBINED</span>
                    <span style="width:65px"></span>
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${_(s)}</span>
                    <span style="width:40px"></span>
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${_(l)}</span>
                    <span style="width:12px"></span>
                </div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${c}
            </div>
        </div>
    </div>`,document.getElementById("sub-logo-upload")?.addEventListener("change",async f=>{const p=f.target.files?.[0],u=f.target.dataset.propId;if(!(!p||!u)){if(p.size>2*1024*1024){alert("Logo must be under 2MB.");return}try{const m=p.name.split(".").pop()?.toLowerCase()||"png",v=`party-logos/${d.id}/sub_${u}_${Date.now()}.${m}`,{error:b}=await g.storage.from("public-assets").upload(v,p,{contentType:p.type,upsert:!0});if(b)throw b;const{data:y}=g.storage.from("public-assets").getPublicUrl(v),$=y?.publicUrl;if($){await g.from("corp_properties").update({logo_url:$}).eq("id",u);const h=Y.find(k=>k.id===u);h&&(h.logo_url=$),Jt()}}catch(m){alert("Upload failed: "+(m.message||"Error"))}}}),a&&(a.subsector==="Insurance"||a.subsector==="Banking")){const f="sub-dashboard-"+a.id;setTimeout(()=>{document.getElementById(f)&&ka(g,{faction:d,nation:z,shard:S},f,a.id).catch(p=>console.error("[SubDash] Init failed:",p))},50)}}async function oa(o,e){if(re)return;const t=Y.find(m=>m.id===o);if(!t)return;const n=e==="sell",i=n?Pe.SALE:Pe.DISSOLVE,a=n?"SELL":"DISSOLVE",r=n?"sold":"dissolved",s=n?"80%":"60%",l=ea(t.nation_id),c=Lo(t.nation_id),f=c.reduce((m,v)=>m+Math.round((v.purchase_price||0)*i*(v.condition||50)/100),0),p=Number(t.sub_cash||0),u=f+p;if(confirm(a+' subsidiary "'+t.name+`"?

`+c.length+" properties at "+s+` × condition:
  Property value: `+_(f)+`
  Subsidiary cash: `+_(p)+`
  ─────────────────
  Total return: `+_(u)+`

All operations in `+l+` cease.
This cannot be undone.`)){re=!0;try{const m=c.map(b=>b.id);if(m.length===1){const{error:b}=await g.from("corp_properties").update({is_active:!1}).eq("id",m[0]);if(b)throw b}else if(m.length>1){const{error:b}=await g.from("corp_properties").update({is_active:!1}).in("id",m);if(b)throw b}await g.from("corp_properties").update({sub_cash:0}).eq("id",o).then(()=>{}).catch(()=>{});const v=Number(d?.corp_cash_reserves??0)+u;await g.from("factions").update({corp_cash_reserves:v}).eq("id",d.id),d.corp_cash_reserves=v,tt(v),await Kt(),alert("Subsidiary "+r+". "+c.length+` properties liquidated.
Total received: `+_(u))}catch(m){alert("Failed: "+m.message)}finally{re=!1}}}function As(o){oa(o,"sell")}async function Ms(o){if(re)return;const e=Y.find(s=>s.id===o);if(!e)return;const t=ea(e.nation_id),i=Lo(e.nation_id).reduce((s,l)=>s+Math.round((l.purchase_price||0)*.8*(l.condition||50)/100),0),a=Number(e.sub_cash||0),r=Math.round(a*.05);if(confirm('PUT UP FOR SALE: "'+e.name+`"

Nation: `+t+`
Estimated Valuation: `+_(i)+`
Subsidiary Cash: `+_(a)+`
Subsector: `+(e.subsector||"General")+`

This will list your subsidiary on the marketplace.
Other corporations can place bids (minimum $1M).
You review and accept bids.

Continue?`)){re=!0;try{const s=S?.current_tick||0,{data:l,error:c}=await g.from("subsidiary_sales").insert({subsidiary_id:o,seller_faction_id:d.id,nation_id:e.nation_id,subsidiary_name:e.name,subsector:e.subsector||null,valuation:i,monthly_revenue:r,sub_cash_at_listing:a,employee_count:e.capacity||0,status:"listed",listed_at_tick:s}).select("*").single();if(c){alert("Failed to list: "+c.message);return}alert('"'+e.name+`" is now listed for sale.

Other corporations will see it on the Expansion tab and can place bids.`),await Kt()}catch(s){alert("Failed: "+s.message)}finally{re=!1}}}let ho=[],na="ready",Rt=null;async function qo(){const o=await Ta(g);ho=o.listings,na=o.state,Rt=o.error,Rt&&console.error("[SubMarket] Load failed:",Rt.message)}function Oo(){let o=document.getElementById("sub-marketplace-card");o||(o=document.createElement("div"),o.id="sub-marketplace-card",document.getElementById("expansion-content")?.appendChild(o));const e=ho.filter(l=>l.seller_faction_id!==d?.id),t=ho.filter(l=>l.seller_faction_id===d?.id),n="'JetBrains Mono',monospace",i=getComputedStyle(document.body),a=(l,c)=>i.getPropertyValue(l).trim()||c,r={surface:a("--bg-2","var(--bg-card)"),card:a("--bg-3","#f0efeb"),border:a("--border-0","rgba(0,0,0,0.08)"),dim:a("--text-dim","#aaa"),muted:a("--text-muted","#888"),text:a("--text-primary","#333"),bright:a("--text-bright","#1a1a17"),orange:a("--orange","#d35400"),green:a("--green","#2d8a2d"),blue:a("--blue","#2874a6"),red:a("--red","#c0392b"),gold:a("--gold","#a88520")};let s=`<div style="width:760px;background:${r.surface};border:1px solid ${r.border};font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:10px 14px;border-bottom:1px solid ${r.border};display:flex;align-items:center;gap:8px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${r.orange};display:inline-block;"></span>
            <span style="font-family:${n};font-size:11px;font-weight:700;letter-spacing:1.5px;color:${r.orange};text-transform:uppercase;">Subsidiary Marketplace</span>
            <span style="font-family:${n};font-size:9px;color:${r.dim};">${e.length} available</span>
        </div>`;if(t.length>0){s+=`<div style="padding:8px 14px;border-bottom:1px solid ${r.border};background:${r.card};">
            <div style="font-family:${n};font-size:8px;letter-spacing:1px;color:${r.gold};text-transform:uppercase;margin-bottom:6px;">YOUR LISTINGS</div>`;for(const l of t){const f=(l.subsidiary_bids||[]).filter(p=>p.status==="pending");s+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:11px;font-weight:700;color:${r.bright};">${x(l.subsidiary_name)}</span>
                    <span style="font-family:${n};font-size:8px;color:${r.dim};margin-left:6px;">${x(l.subsector||"")}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${n};font-size:9px;color:${f.length>0?r.green:r.dim};">${f.length} bid${f.length!==1?"s":""}</span>
                    ${f.length>0?`<span onclick="subViewBids('${l.id}')" style="font-family:${n};font-size:8px;font-weight:700;padding:3px 8px;color:${r.green};border:1px solid ${r.green}44;cursor:pointer;">VIEW BIDS</span>`:""}
                    <span onclick="subCancelSale('${l.id}')" style="font-family:${n};font-size:8px;font-weight:700;padding:3px 8px;color:${r.red};border:1px solid ${r.red}44;cursor:pointer;">CANCEL</span>
                </div>
            </div>`}s+="</div>"}if(na==="error")s+=`<div style="padding:24px 14px;text-align:center;font-family:${n};font-size:10px;color:${r.red};font-style:italic;">${x(Rt&&Rt.message||"Subsidiary marketplace is temporarily unavailable.")}</div>`;else if(e.length===0)s+=`<div style="padding:24px 14px;text-align:center;font-family:${n};font-size:10px;color:${r.dim};font-style:italic;">No subsidiaries for sale right now.</div>`;else for(const l of e){const c=(l.subsidiary_bids||[]).find(u=>u.bidder_faction_id===d?.id&&u.status==="pending"),p=(_allNations||[]).find(u=>u.id===l.nation_id)?.name||"Unknown";s+=`<div style="padding:10px 14px;border-bottom:1px solid ${r.border};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:12px;font-weight:700;color:${r.bright};">${x(l.subsidiary_name)}</span>
                        <span style="font-family:${n};font-size:7px;font-weight:700;padding:1px 5px;color:${r.orange};border:1px solid ${r.orange}44;background:${r.orange}0a;">${x(l.subsector||"General")}</span>
                    </div>
                    <span style="font-family:${n};font-size:8px;color:${r.dim};">${x(p)}</span>
                </div>
                <div style="display:flex;gap:16px;font-family:${n};font-size:8px;color:${r.muted};margin-bottom:8px;">
                    <span>Valuation: <strong style="color:${r.text};">${_(l.valuation)}</strong></span>
                    <span>Revenue: <strong style="color:${r.text};">${_(l.monthly_revenue)}/mo</strong></span>
                    <span>Cash: <strong style="color:${r.text};">${_(l.sub_cash_at_listing)}</strong></span>
                    <span>Staff: <strong style="color:${r.text};">${l.employee_count}</strong></span>
                </div>
                <div style="display:flex;justify-content:flex-end;">
                    ${c?`<span style="font-family:${n};font-size:8px;font-weight:700;color:${r.green};">✓ BID PLACED: ${_(c.bid_amount)}</span>`:`<span onclick="subPlaceBid('${l.id}','${x(l.subsidiary_name)}',${l.valuation})" style="font-family:${n};font-size:8px;font-weight:700;padding:4px 14px;color:#000;background:${r.orange};cursor:pointer;">PLACE BID</span>`}
                </div>
            </div>`}s+="</div>",o.innerHTML=s}async function Rs(o,e,t){const n=prompt('Place bid for "'+e+`"

Valuation: `+_(t)+`
Minimum bid: $1M

Enter bid amount ($):`);if(!n)return;const i=Math.round(Number(n));if(isNaN(i)||i<1e6){alert("Minimum bid is $1,000,000.");return}const a=Number(d?.corp_cash_reserves??0);if(i>a){alert("Insufficient funds. You have "+_(a)+".");return}const{error:r}=await g.from("subsidiary_bids").insert({sale_id:o,bidder_faction_id:d.id,bid_amount:i,status:"pending",placed_at_tick:S?.current_tick||0});if(r){r.message.includes("duplicate")||r.message.includes("unique")?alert("You already have a bid on this subsidiary."):alert("Failed to place bid: "+r.message);return}alert("Bid of "+_(i)+' placed on "'+e+`".
The seller will review your bid.`),await qo(),Oo()}async function Ls(o){const e=ho.find(u=>u.id===o);if(!e)return;const t=(e.subsidiary_bids||[]).filter(u=>u.status==="pending");if(t.length===0){alert("No pending bids.");return}const n=t.map(u=>u.bidder_faction_id),{data:i}=await g.from("factions").select("id, faction_name").in("id",n),a={};(i||[]).forEach(u=>{a[u.id]=u.faction_name});let r='Bids for "'+e.subsidiary_name+`":

`;const s=t.sort((u,m)=>m.bid_amount-u.bid_amount);for(let u=0;u<s.length;u++){const m=s[u];r+=u+1+". "+(a[m.bidder_faction_id]||"Unknown")+": "+_(m.bid_amount)+`
`}r+=`
Enter the number of the bid to accept (or cancel):`;const l=prompt(r);if(!l)return;const c=parseInt(l,10)-1;if(isNaN(c)||c<0||c>=s.length){alert("Invalid selection.");return}const f=s[c],p=a[f.bidder_faction_id]||"Unknown";confirm("Accept bid of "+_(f.bid_amount)+" from "+p+`?

This will transfer ownership of "`+e.subsidiary_name+`" to them.
You will receive `+_(f.bid_amount)+` in cash.

This cannot be undone.`)&&await qs(e,f)}let on=!1;async function qs(o,e){if(!on){on=!0;try{const i=S?.current_tick||0,{data:a}=await g.from("factions").select("corp_cash_reserves").eq("id",e.bidder_faction_id).single(),r=Number(a?.corp_cash_reserves??0);if(r<e.bid_amount){alert("Buyer has insufficient funds. Bid cannot be completed."),await g.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:i}).eq("id",e.id);return}var{error:t}=await g.from("factions").update({corp_cash_reserves:r-e.bid_amount}).eq("id",e.bidder_faction_id);if(t){alert("Failed to deduct from buyer: "+t.message);return}const s=Number(d?.corp_cash_reserves??0);var{error:n}=await g.from("factions").update({corp_cash_reserves:s+e.bid_amount}).eq("id",d.id);if(n){await g.from("factions").update({corp_cash_reserves:r}).eq("id",e.bidder_faction_id),alert("Failed to credit seller: "+n.message);return}d.corp_cash_reserves=s+e.bid_amount,await g.from("corp_properties").update({faction_id:e.bidder_faction_id}).eq("id",o.subsidiary_id);const l=Y.filter(c=>c.nation_id===o.nation_id&&c.faction_id===d.id);for(const c of l)await g.from("corp_properties").update({faction_id:e.bidder_faction_id}).eq("id",c.id);await g.from("subsidiary_sales").update({status:"completed",completed_at_tick:i,accepted_bid_id:e.id}).eq("id",o.id),await g.from("subsidiary_bids").update({status:"accepted",resolved_at_tick:i}).eq("id",e.id),await g.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:i}).eq("sale_id",o.id).neq("id",e.id),tt(d.corp_cash_reserves),alert("Sale complete! Received "+_(e.bid_amount)+`.

"`+o.subsidiary_name+'" has been transferred to the buyer.'),await Kt(),await qo(),Oo()}catch(i){console.error("[SubMarket] Accept bid error:",i),alert("Transfer failed: "+i.message)}finally{on=!1}}}async function Os(o){if(!confirm("Cancel this listing? The subsidiary will no longer be for sale."))return;const{error:e}=await g.from("subsidiary_sales").update({status:"cancelled"}).eq("id",o);if(e){alert("Failed: "+e.message);return}await qo(),Oo()}function Bs(o){oa(o,"dissolve")}async function ia(o,e){if(re)return;const t=Y.find(p=>p.id===o);if(!t)return;const n=Number(d?.corp_cash_reserves??0),i=Number(t.sub_cash||0),a=e?"WITHDRAW":"INJECT CAPITAL";if(e&&i<=0){alert("This subsidiary has no cash to withdraw.");return}const r=e?i:n,s=prompt(a+(e?" from ":" into ")+t.name+`

Parent cash: `+_(n)+`
Subsidiary cash: `+_(i)+`

Enter amount (e.g., 5000000 or 5M):`);if(!s)return;const l=Is(s);if(!l||l<=0||isNaN(l)){alert("Invalid amount.");return}if(l>r){alert("Insufficient "+(e?"subsidiary":"parent")+" cash. Available: "+_(r));return}const c=e?n+l:n-l,f=e?i-l:i+l;if(confirm(a+" "+_(l)+(e?" from ":" into ")+t.name+`?

Parent: `+_(n)+" → "+_(c)+`
Subsidiary: `+_(i)+" → "+_(f))){re=!0;try{await Promise.all([g.from("factions").update({corp_cash_reserves:c}).eq("id",d.id),g.from("corp_properties").update({sub_cash:f}).eq("id",o)]),d.corp_cash_reserves=c,t.sub_cash=f,tt(c),Jt(),alert((e?"Withdrew ":"Injected ")+_(l)+(e?" from ":" into ")+t.name+".")}catch(p){alert("Failed: "+p.message)}finally{re=!1}}}function Ps(o){ia(o,!1)}function Ds(o){ia(o,!0)}async function js(o){if(re)return;const e=Y.find(b=>b.id===o);if(!e)return;const t=ta(e);t.nation;const n=Lo(e.nation_id),i=t.valuation,a=t.cash,r=t.reputation,s=t.subsector,l=Math.round(i*2.25),c=Math.round(r*.1),f=Math.round(r*.2),p=Io(),u=Qe.reduce((b,y)=>b+Number(d?.[y.factionKey]??0),0),m=Math.max(0,p-u),v=Number(d?.corp_cash_reserves??0);if(l>v){alert(`Insufficient cash to acquire subsidiary.

Acquisition cost (2.25× valuation): `+_(l)+`
Available cash: `+_(v));return}if(t.projects>0){alert("Cannot merge — subsidiary has "+t.projects+" active project(s). Complete or abandon them first.");return}if(confirm('MERGE "'+e.name+`" INTO YOUR CORPORATION

Acquisition cost (2.25× valuation): `+_(l)+`
Subsidiary cash absorbed: `+_(a)+`
Net cost: `+_(l-a)+`

• `+n.length+` properties transferred to parent
• Subsidiary subsector "`+s+`" added to portfolio
• Workers hired to max capacity (+`+m.toLocaleString()+`)
• Reputation: +`+c+" or -"+f+" (from sub rep "+r+`)

This cannot be undone.`)){re=!0;try{const b=d.nation_id;if(n.length>0){const I=n.filter(E=>E.id!==e.id).map(E=>E.id);if(I.length===1){const{error:E}=await g.from("corp_properties").update({nation_id:b,type:"office"}).eq("id",I[0]);if(E)throw E}else if(I.length>1){const{error:E}=await g.from("corp_properties").update({nation_id:b,type:"office"}).in("id",I);if(E)throw E}const{error:R}=await g.from("corp_properties").update({nation_id:b,type:"office",sub_cash:0,subsector:null}).eq("id",e.id);if(R)throw R}const y=v-l+a,h=Number(d?.corp_general_workforce??0)+m,k=Math.random()>=.5?c:-f,T=Number(d?.standing??50),C=Math.max(0,Math.min(100,T+k)),{error:w}=await g.from("factions").update({corp_cash_reserves:y,corp_general_workforce:h,standing:C}).eq("id",d.id);if(w)throw w;d.corp_cash_reserves=y,d.corp_general_workforce=h,d.standing=C,tt(y),await Kt(),alert(`Merger complete!

"`+e.name+`" absorbed into your corporation.
Cost: `+_(l)+" | Cash absorbed: "+_(a)+`
Reputation `+(k>=0?"+":"")+k+" (now "+C+`)
Workers hired: +`+m.toLocaleString()+` general workforce
Properties: `+n.length+" transferred to parent")}catch(b){alert("Merge failed: "+b.message)}finally{re=!1}}}window.subDissolve=Bs;window.subInjectCapital=Ps;window.subWithdraw=Ds;window.subMerge=js;window.subSell=As;window.subPutForSale=Ms;window.subPlaceBid=Rs;window.subViewBids=Ls;window.subCancelSale=Os;window.selectSubsidiary=function(o){mt=o,Jt()};let Ct=[],Lt={},ue=null,nn=!1,ot="",Ht="",nt="",Ne="";const aa={Construction:4,Finance:5,Shipping:4},Fs=["Construction","Shipping","Finance"],ra={Construction:[{id:"civil",name:"Civil Engineering",mod:0},{id:"industrial",name:"Industrial Construction",mod:.25},{id:"mega",name:"Megaprojects",mod:.4}],Shipping:[{id:"bulk_cargo",name:"Bulk Cargo",mod:0},{id:"container_freight",name:"Container Freight",mod:.2},{id:"specialized_transport",name:"Specialized Transport",mod:.35}],Finance:[{id:"banking",name:"Banking",mod:0},{id:"insurance",name:"Insurance",mod:.15},{id:"investment",name:"Investment Management",mod:.3}],Technology:[{id:"software",name:"Software Development",mod:0},{id:"hardware",name:"Hardware Manufacturing",mod:.2},{id:"telecom",name:"Telecommunications",mod:.35}],Energy:[{id:"oil_gas",name:"Oil & Gas",mod:0},{id:"renewables",name:"Renewables",mod:.2},{id:"mining",name:"Mining",mod:.3}],Healthcare:[{id:"pharma",name:"Pharmaceuticals",mod:0},{id:"hospitals",name:"Hospital Systems",mod:.2},{id:"biotech",name:"Biotechnology",mod:.35}]};async function Us(){const{data:o,error:e}=await g.from("nations").select("*").order("name");e&&console.warn("[Subsidiary] Failed to load nations:",e.message),Ct=(o||[]).filter(n=>n.id!==d?.nation_id);const{data:t}=await g.from("factions").select("nation_id").eq("faction_type","corporation").is("abandoned_at",null);Lt={};for(const n of t||[])n.nation_id&&(Lt[n.nation_id]=(Lt[n.nation_id]||0)+1);nt=d?.corp_sector||"",Ne=d?.corp_subsector||""}function sa(){const o=nt||d?.corp_sector||"";return ra[o]||[{id:"general",name:o||"General",mod:0}]}function Hs(o){nt=o;const e=ra[o];Ne=e?e[0].name:"",Xt()}function la(){const o=d?.corp_sector||"";return nt===o?1:aa[nt]||4}function Gs(){const e=sa().find(t=>t.name===Ne);return e?e.mod:0}function wn(o){const e=Number(o.standard_of_living??50);return Math.max(.5,Math.round(e/50*100)/100)}function da(o){const t=la(),n=1+Gs(),i=wn(o);return Math.round(Math.max(1e7,5e7*t*n*i))}function Vs(o){const e=Lt[o]||0;return e<=1?{label:"HIGH",color:"#5c5"}:e<=3?{label:"MODERATE",color:"#ca5"}:{label:"LOW",color:"#c55"}}function Ws(o){if(ue=ue===o?null:o,ue){const e=Ct.find(t=>t.id===ue);ot=(d?.faction_name||"Subsidiary")+" "+(e?.name||"")}else ot="";Xt()}function Ys(o){Ne=o,Xt()}function Qs(o){ot=o}function Ks(o){Ht=o.toUpperCase().slice(0,4)}async function Js(){if(nn||!ue)return;const o=Ct.find(r=>r.id===ue);if(!o)return;const e=(ot||"").trim(),t=(Ht||"").trim();if(!e){alert("Please enter a corporation name for the subsidiary.");return}if(t.length<2){alert("Please enter an abbreviation (2-4 chars).");return}if(Y.find(r=>r.nation_id===o.id&&r.type==="regional_hq")){alert("You already have a subsidiary in "+o.name);return}const i=da(o),a=Number(d?.corp_cash_reserves??0);if(i>a){alert("Insufficient cash. Entry cost: "+_(i)+", available: "+_(a));return}if(confirm("Establish subsidiary in "+o.name+`?

Name: `+e+" ("+t+`)
Subsector: `+(Ne||"General")+`
Entry cost: `+_(i)+`
Creates a Regional HQ (500 capacity)
Unlocks `+o.name+` for operations

Deducted from cash reserves.`)){nn=!0;try{const s=(await g.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0,l=85+Math.floor(Math.random()*16),c=Math.round(i*.005),{error:f}=await g.from("corp_properties").insert({faction_id:d.id,nation_id:o.id,name:e,type:"regional_hq",style:"Modern",capacity:500,purchase_price:i,monthly_maintenance:c,condition:l,city:o.capital||o.name,purchased_at_tick:s,is_active:!0,subsector:Ne||d?.corp_subsector||null});if(f)throw f;const p=Math.max(0,a-i);await g.from("factions").update({corp_cash_reserves:p}).eq("id",d.id),d.corp_cash_reserves=p,tt(p);const u=nt||d?.corp_sector||"Unknown";try{await g.from("event_log").insert({nation_id:o.id,event_name:"New Subsidiary Established",category:"corporate",description_chosen:`${d.faction_name} has invested ${_(i)} to establish ${e}, a new ${u} corporation in ${o.name}.`,fired_at_tick:S?.current_tick||0})}catch{}try{const{data:m}=await g.from("nations").select("gdp_growth").eq("id",o.id).single();m&&await g.from("nations").update({gdp_growth:Math.min(100,Number(m.gdp_growth||50)+.2)}).eq("id",o.id)}catch{}ue=null,ot="",Ht="",await Kt(),alert('Subsidiary "'+e+'" established in '+o.name+`!

Cost: `+_(i)+`
Regional HQ created with `+l+"% condition.")}catch(r){alert("Failed: "+r.message)}finally{nn=!1}}}function Xt(){const o=document.getElementById("create-subsidiary-container");if(!o)return;const e="'JetBrains Mono', monospace",t={bg:"var(--bg-card)",surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},n=d?.corp_sector||"General",i=d?.corp_subsector||"",a=sa(),r=a.find(E=>E.name===Ne)||a[0],s=new Set(Y.filter(E=>E.type==="regional_hq").map(E=>E.nation_id)),l=Ct.filter(E=>!s.has(E.id)),c=ue?l.find(E=>E.id===ue):null,f=ot.trim().length>0&&Ht.trim().length>=2&&c!==null,p=nt||n,u=la();let m=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Sector</div>
        <div style="display:flex;gap:3px;">
            ${Fs.map(E=>{const q=E===p,L=E===n,A=L?1:aa[E]||4,U=L?t.greenBright:t.orange;return`<div onclick="subSetSector('${E}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${q?t.accent+"18":"transparent"};border:1px solid ${q?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${q?t.accentBright:t.dim}">${E}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${U}">${L?"PARENT · ×1":"×"+A+" COST"}</div>
                </div>`}).join("")}
        </div>
        ${u>1?`<div style="font-family:${e};font-size:7px;color:${t.orange};margin-top:4px;padding:3px 6px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);">Cross-sector subsidiary: base cost ×${u}</div>`:""}
    </div>`,v=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsector</div>
        <div style="display:flex;gap:3px;">
            ${a.map(E=>{const q=E.name===Ne,L=E.name===i;return`<div onclick="subSetSubsector('${E.name.replace(/'/g,"\\'")}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${q?t.accent+"18":"transparent"};border:1px solid ${q?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:8px;font-weight:700;color:${q?t.accentBright:t.dim}">${E.name}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${L?t.greenBright:E.mod>0?t.orange:t.dim}">${L?"SAME — ±0%":E.mod>0?"+"+Math.round(E.mod*100)+"%":"±0%"}</div>
                </div>`}).join("")}
        </div>
    </div>`,b="";if(l.length===0)b=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Subsidiaries in all available nations.</div>`;else for(const E of l){const q=E.id===ue,L=Vs(E.id),A=Lt[E.id]||0,U=Math.round(Number(E.standard_of_living??50)),j=wn(E);b+=`
            <div onclick="subSelectNation('${E.id}')" style="display:flex;align-items:center;padding:4px 8px;margin-bottom:2px;cursor:pointer;background:${q?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${q?t.accent+"44":t.border};border-left:${q?"2px solid "+t.accent:"2px solid transparent"};">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:11px;font-weight:600;color:${q?t.text:t.muted}">${E.name}</span>
                        <span style="font-family:${e};font-size:7px;font-weight:700;padding:0 4px;color:${L.color};background:${L.color}12;border:1px solid ${L.color}25;line-height:12px">${L.label}</span>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:2px;">
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">STD/LIVING: <span style="color:${t.muted}">${U}</span></span>
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">CORPS: <span style="color:${A>=4?t.red:A>=2?t.yellow:t.greenBright}">${A}</span></span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${j>1?t.orange:t.greenBright}">×${j.toFixed(2)}</div>
                </div>
            </div>`}let y=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="margin-bottom:6px;">
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Corporation Name</div>
            <input type="text" value="${(ot||"").replace(/"/g,"&quot;")}" oninput="subSetName(this.value)" placeholder="e.g., ${(d?.faction_name||"Corp")+" "+(c?.name||"International")}" style="width:100%;padding:5px 8px;font-family:${e};font-size:10px;color:${t.text};background:${t.card};border:1px solid ${t.border};outline:none;box-sizing:border-box;" />
        </div>
        <div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Abbreviation (2-4 chars)</div>
            <input type="text" value="${(Ht||"").replace(/"/g,"&quot;")}" oninput="subSetAbbr(this.value)" placeholder="${(d?.faction_name||"CORP").slice(0,2).toUpperCase()+(c?.name||"XX").slice(0,2).toUpperCase()}" maxlength="4" style="width:80px;padding:5px 8px;font-family:${e};font-size:12px;font-weight:700;color:${t.gold};background:${t.card};border:1px solid ${t.border};outline:none;text-align:center;letter-spacing:2px;" />
        </div>
    </div>`;const $=[{rule:"Bid on projects in that nation",icon:"✓",color:t.greenBright},{rule:"Hires local workers at nation rates",icon:"✓",color:t.greenBright},{rule:"Must use parent's materials & vehicles",icon:"!",color:t.orange},{rule:"Reputation gain: 75% sub / 25% parent",icon:"◐",color:t.gold},{rule:"Market revenue at 50% parent rate",icon:"◐",color:t.gold},{rule:"Counts as domestic corporation",icon:"✓",color:t.greenBright},{rule:"Starting reputation: 25",icon:"●",color:t.muted}];let h=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsidiary Rules</div>
        <div style="background:${t.card};border:1px solid ${t.border};padding:6px 8px;">
            ${$.map((E,q)=>`<div style="display:flex;align-items:center;gap:6px;padding:2px 0;${q<$.length-1?"border-bottom:1px solid "+t.border:""}">
                <span style="font-family:${e};font-size:9px;color:${E.color};width:12px;text-align:center">${E.icon}</span>
                <span style="font-size:9px;color:${t.muted}">${E.rule}</span>
            </div>`).join("")}
        </div>
    </div>`;const k=5e7,T=r.mod,C=c?wn(c):null,w=c?da(c):null,I=Math.round(k*u*(1+T));let R=`
    <div style="background:${t.bg};border:1px solid ${t.border};padding:6px 8px;margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">BASE</span>
            <span style="font-family:${e};font-size:9px;color:${t.muted}">${_(k)}</span>
        </div>
        ${u>1?`<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">SECTOR (${p})</span>
            <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.orange}">×${u}</span>
        </div>`:""}
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">SUBSECTOR (${r.name})</span>
            <span style="font-family:${e};font-size:9px;color:${T===0?t.greenBright:t.orange}">${T===0?"±0%":"+"+Math.round(T*100)+"%"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">NATION (${c?c.name:"select below"})</span>
            <span style="font-family:${e};font-size:9px;color:${c?C>1?t.orange:t.greenBright:t.dim}">${c?"×"+C.toFixed(2):"—"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:3px 0;">
            <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.text}">TOTAL COST</span>
            <span style="font-family:${e};font-size:14px;font-weight:700;color:${t.gold}">${c?_(w):"~"+_(I)}</span>
        </div>
    </div>`;o.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.gold}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Create Subsidiary</span>
            </div>
        </div>
        <div style="flex:1;overflow:auto;">
            ${m}
            ${v}
            <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
                <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Nation</div>
                ${b}
            </div>
            ${y}
            ${h}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            ${R}
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">IMMEDIATE PAYMENT</span>
                <div onclick="subCreate()"
                    onmouseover="this.style.filter='brightness(1.2)';this.style.transform='scale(1.02)'"
                    onmouseout="this.style.filter='';this.style.transform=''"
                    onmousedown="this.style.transform='scale(0.97)'"
                    onmouseup="this.style.transform='scale(1.02)'"
                    style="padding:6px 22px;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${f?"#000":"#c8a832"};background:${f?t.gold:"rgba(200,168,50,0.08)"};border:1px solid ${f?t.gold:"rgba(200,168,50,0.3)"};cursor:pointer;opacity:${f?1:.7};transition:all 0.1s ease;user-select:none">CREATE SUBSIDIARY</div>
            </div>
        </div>
    </div>`}window.subSelectNation=Ws;window.subCreate=Js;window.subSetName=Qs;window.subSetAbbr=Ks;window.subSetSector=Hs;window.subSetSubsector=Ys;let qt=[],Ue=0,$o=JSON.parse(localStorage.getItem("nationhood_investigated_corps")||"{}"),be="ALL",Be="REPUTATION";async function Xs(){const[o,e]=await Promise.all([g.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, corp_reputation, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name"),g.from("corp_properties").select("id, faction_id, name, nation_id, subsector, type, factions(faction_name, corp_sector, corp_ticker, abbreviation, corp_reputation, corp_company_type, linked_user_id)").eq("type","regional_hq").eq("is_active",!0)]),t={};for(const r of o.data||[])t[r.id]=r;const n=(o.data||[]).map(r=>{const s=(r.corp_company_type||"Private").toUpperCase(),l=Number(r.corp_cash_reserves||0);return{...r,abbr:r.corp_ticker||r.abbreviation||r.faction_name?.slice(0,4).toUpperCase()||"???",status:s,isPlayer:!!r.linked_user_id,reputation:Math.round(Number(r.corp_reputation??50)),revenue:Math.round(l*.1),valuation:Math.round(l*3),_isSub:!1}}),{data:i}=await g.from("nations").select("id, name"),a={};(i||[]).forEach(r=>{a[r.id]=r.name});for(const r of e.data||[]){const s=t[r.faction_id];if(!s)continue;const l=(s.corp_company_type||"Private").toUpperCase();n.push({id:r.id,faction_name:r.name||"Subsidiary",abbreviation:s.abbreviation,corp_sector:s.corp_sector,corp_subsector:r.subsector||s.corp_subsector,corp_ticker:s.corp_ticker,nation_id:r.nation_id,nation:a[r.nation_id]||"?",abbr:(s.corp_ticker||s.abbreviation||"??").slice(0,4),status:l,isPlayer:!!s.linked_user_id,reputation:Math.round(Number(s.corp_reputation??50)),revenue:0,valuation:0,_isSub:!0,_parentName:s.faction_name})}qt=n}function Zs(o){Ue=o,Zt()}function el(o){be=o,Ue=0,Zt()}function tl(o){Be=o,Ue=0,Zt()}async function ol(o){if(!d||!S)return;const e=Number(d.corp_cash_reserves??0);if(e<5e5){alert("Insufficient cash. Need $500k.");return}const{error:t}=await g.from("factions").update({corp_cash_reserves:e-5e5}).eq("id",d.id);if(t){alert("Failed: "+t.message);return}d.corp_cash_reserves=e-5e5,$o[o]=!0,localStorage.setItem("nationhood_investigated_corps",JSON.stringify($o));const{data:n}=await g.from("factions").select("corp_cash_reserves, corp_loans, corp_reputation, corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce").eq("id",o).single();if(n){const i=qt.find(a=>a.id===o);if(i){Object.assign(i,n);const a=Number(n.corp_cash_reserves||0);i.reputation=Math.round(Number(n.corp_reputation??50)),i.revenue=Math.round(a*.1),i.valuation=Math.round(a*3)}}Zt()}function Zt(){const o=document.getElementById("corporations-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},n={PUBLIC:{color:t.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:t.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:t.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},i=[...new Set(qt.map(m=>m.nation).filter(Boolean))];let a=[...qt];be!=="ALL"&&(a=a.filter(m=>m.nation===be)),Be==="REPUTATION"?a.sort((m,v)=>(v.reputation||0)-(m.reputation||0)):Be==="REVENUE"?a.sort((m,v)=>(v.revenue||0)-(m.revenue||0)):Be==="VALUATION"&&a.sort((m,v)=>(v.valuation||0)-(m.valuation||0)),Ue>=a.length&&(Ue=0);const r=a[Ue]||null;S?.current_tick;const s=r&&!!$o[r.id],l=r&&r.status==="PRIVATE"&&!s,c=r&&r.status==="STATE";let f="";a.length===0&&(f=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No corporations found.</div>`);for(let m=0;m<a.length;m++){const v=a[m],b=m===Ue,y=n[v.status]||n.PRIVATE,$=v.status==="PRIVATE"&&!$o[v.id];f+=`
        <div onclick="corpSelect(${m})" style="display:flex;align-items:center;padding:7px 16px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${b?t.accent:"transparent"};background:${b?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:42px;font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${v.abbr}</span>
            <div style="flex:1.3;">
                <div style="font-size:11px;font-weight:600;color:${t.text};line-height:1.2">${v.faction_name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${v._isSub?'<span style="color:#8a6aaa;">SUB</span> · ':""}${v.corp_subsector||v.corp_sector||"—"}</div>
            </div>
            <span style="width:62px"><span style="font-family:${e};font-size:8px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(v.nation||"—").toUpperCase().slice(0,6)}</span></span>
            <span style="width:56px;font-family:${e};font-size:9px;font-weight:700;color:${$?t.dim:t.muted};text-align:right">${$?"—":_(v.revenue)}</span>
            <span style="width:34px;font-family:${e};font-size:10px;font-weight:700;color:${v.reputation>=70?t.greenBright:v.reputation>=40?t.accent:t.yellow};text-align:right">${v.reputation}</span>
            <span style="width:56px;font-family:${e};font-size:9px;color:${$?t.dim:t.muted};text-align:right">${$?"—":_(v.valuation)}</span>
            <span style="width:48px;text-align:center"><span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${y.color};background:${y.bg};border:1px solid ${y.border}">${v.status}</span></span>
        </div>`}let p="";if(r){const m=n[r.status]||n.PRIVATE,v=[...r._isSub?[{label:"Parent",value:r._parentName||"—",color:"#8a6aaa"}]:[],{label:"Sector",value:r.corp_sector||"—",color:t.text},{label:"Subsector",value:r.corp_subsector||"—",color:t.accent},{label:"Reputation",value:r.reputation+"/100",color:r.reputation>=70?t.greenBright:r.reputation>=40?t.accent:t.yellow},{label:"Revenue",value:l?"UNDISCLOSED":_(r.revenue),color:l?t.dim:t.greenBright},{label:"Cash Reserves",value:l?"UNDISCLOSED":_(r.corp_cash_reserves||0),color:l?t.dim:t.text},{label:"Market Valuation",value:l?"UNDISCLOSED":_(r.valuation),color:l?t.dim:t.gold}];p=`
        <div style="padding:10px 16px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                <span style="font-family:${e};font-size:14px;font-weight:700;color:${t.gold}">${r.abbr}</span>
                <span style="font-size:14px;font-weight:700;color:${t.text}">${r.faction_name}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
                <span style="font-family:${e};font-size:8px;padding:2px 6px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(r.nation||"—").toUpperCase()}</span>
                <span style="font-family:${e};font-size:8px;font-weight:700;padding:2px 6px;color:${m.color};background:${m.bg};border:1px solid ${m.border}">${r.status}</span>
                ${r._isSub?`<span style="font-family:${e};font-size:8px;font-weight:700;padding:2px 6px;color:#8a6aaa;background:rgba(138,106,170,0.08);border:1px solid rgba(138,106,170,0.2)">SUBSIDIARY</span>`:""}
                ${r.isPlayer?`<span style="font-family:${e};font-size:8px;font-weight:700;padding:2px 6px;color:${t.blue};background:rgba(90,138,170,0.08);border:1px solid rgba(90,138,170,0.2)">PLAYER</span>`:`<span style="font-family:${e};font-size:8px;color:${t.dim}">NPC</span>`}
            </div>
        </div>
        ${v.map(b=>`<div style="display:flex;justify-content:space-between;padding:5px 16px;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:10px;color:${t.dim};text-transform:uppercase">${b.label}</span>
            <span style="font-family:${e};font-size:11px;font-weight:700;color:${b.value==="UNDISCLOSED"?t.dim:b.color};${b.value==="UNDISCLOSED"?"font-style:italic;":""}">${b.value}</span>
        </div>`).join("")}
        <div style="padding:6px 14px;border-bottom:1px solid ${t.border};flex-shrink:0;">
            <div style="width:100%;height:4px;background:${t.border}"><div style="width:${r.reputation}%;height:100%;background:${r.reputation>=70?t.greenBright:r.reputation>=40?t.accent:t.yellow}"></div></div>
        </div>
        ${l?`<div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:rgba(200,168,50,0.03);">
            <div style="font-family:${e};font-size:8px;color:${t.gold};margin-bottom:2px">PRIVATE — FINANCIALS UNDISCLOSED</div>
            <div style="font-size:9px;color:${t.dim};line-height:1.4">Use INVESTIGATE to reveal financial data for 12 ticks.</div>
        </div>`:""}
        ${c?`<div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:rgba(204,136,68,0.03);">
            <div style="font-family:${e};font-size:8px;color:${t.orange};margin-bottom:2px">STATE-OWNED ENTERPRISE</div>
            <div style="font-size:9px;color:${t.dim};line-height:1.4">Government-controlled. Cannot be acquired directly. May be privatized by parliamentary vote.</div>
        </div>`:""}
        <div style="flex:1"></div>
        <div style="padding:6px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="font-family:${e};font-size:8px;letter-spacing:1.5px;color:${t.dim};text-transform:uppercase;margin-bottom:6px">Actions</div>
            <div style="display:flex;gap:4px;margin-bottom:4px;">
                <div onclick="${l?`corpInvestigate('${r.id}')`:""}" style="flex:1;padding:5px 0;text-align:center;cursor:${l?"pointer":"default"};font-family:${e};font-size:8px;font-weight:700;color:${l?t.blue:s?t.greenBright:t.dim};border:1px solid ${l?t.blue+"44":s?t.greenBright+"44":t.border};opacity:${l?1:.3}">${s?"INVESTIGATED ✓":"INVESTIGATE — $500k"}</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;color:${t.accent};border:1px solid ${t.accent}44">PARTNER</div>
            </div>
            <div style="display:flex;gap:4px;">
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${c?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${c?t.dim:t.gold};border:1px solid ${c?t.border:t.gold+"44"};opacity:${c?.3:1}">ACQUIRE</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${c?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${c?t.dim:t.orange};border:1px solid ${c?t.border:t.orange+"44"};opacity:${c?.3:1}">MERGER</div>
            </div>
            ${c?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${t.dim}">State-owned corps cannot be acquired or merged.</div>`:""}
        </div>`}else p=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a corporation to view details.</div>`;const u=`
    <div style="padding:6px 16px;border-bottom:1px solid ${t.border};background:${t.card};display:flex;gap:12px;align-items:center;flex-shrink:0;">
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px;width:40px">NATION</span>
            <span onclick="corpFilterNation('ALL')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${be==="ALL"?"#000":t.dim};background:${be==="ALL"?t.accent:"transparent"};border:1px solid ${be==="ALL"?t.accent:t.border}">ALL</span>
            ${i.map(m=>`<span onclick="corpFilterNation('${m}')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${be===m?"#000":t.dim};background:${be===m?t.accent:"transparent"};border:1px solid ${be===m?t.accent:t.border}">${m}</span>`).join("")}
        </div>
        <div style="flex:1"></div>
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">SORT</span>
            ${["REPUTATION","REVENUE","VALUATION"].map(m=>`<span onclick="corpSort('${m}')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${Be===m?"#000":t.dim};background:${Be===m?t.accent:"transparent"};border:1px solid ${Be===m?t.accent:t.border}">${m}</span>`).join("")}
        </div>
    </div>`;o.innerHTML=`
    <div style="width:760px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Corporations</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${qt.length} IN DATABASE</span>
        </div>
        ${u}
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${t.border};display:flex;flex-direction:column;">
                <div style="display:flex;padding:5px 16px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                    <span style="width:42px;font-family:${e};font-size:8px;color:${t.dim}">ABBR</span>
                    <span style="flex:1.3;font-family:${e};font-size:8px;color:${t.dim}">CORPORATION</span>
                    <span style="width:62px;font-family:${e};font-size:8px;color:${t.dim}">NATION</span>
                    <span style="width:56px;font-family:${e};font-size:8px;color:${t.dim};text-align:right">REV</span>
                    <span style="width:34px;font-family:${e};font-size:8px;color:${t.dim};text-align:right">REP</span>
                    <span style="width:56px;font-family:${e};font-size:8px;color:${t.dim};text-align:right">VALUE</span>
                    <span style="width:48px;font-family:${e};font-size:8px;color:${t.dim};text-align:center">STATUS</span>
                </div>
                <div style="flex:1;overflow:auto;">${f}</div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${p}
            </div>
        </div>
    </div>`}window.corpSelect=Zs;window.corpInvestigate=ol;window.corpFilterNation=el;window.corpSort=tl;let $e=null,ze={},K=120,Ie=15,kn={},ut=[];async function nl(){if(!We)return;if(wt[We.id]){alert("You already have a bid on this contract. Retract it first if you want to re-bid.");return}$e=We,kn={};try{const{data:t}=await g.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",d.id);for(const n of t||[])kn[po(n.material_key)]=Number(n.quantity||0)}catch{}ut=[];try{const{data:t}=await g.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",$e.id).in("status",["pending","won"]);ut=(t||[]).filter(n=>n.faction_id!==d?.id).map(n=>({name:n.factions?.faction_name||"Unknown",ticker:n.factions?.corp_ticker||"???",price:Number(n.bid_price||0),quality:Number(n.estimated_quality||0),status:n.status}))}catch{}ze={};const o=$e.required_materials||{};for(const t of Object.keys(o))ze[t]="STD";const e=$e.required_workforce||{};K=Number(e.general||0)+Number(e.skilled||0)||120,Ie=15,Yt(),Bo()}function Qn(){document.getElementById("bid-assembly-overlay")?.remove(),$e=null}function il(o,e){ze[o]=e,Bo()}function al(o){K=o,Bo()}function rl(o){Ie=o,Bo()}function Bo(){if(document.getElementById("bid-assembly-overlay")?.remove(),!$e)return;const o="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},t=$e,n=t.issuer_type==="GOVERNMENT",i=z?.name||d?.nation||"—",a=Number(t.budget_ceiling||0),r=Number(t.timeline_ticks||8),s=t.required_materials||{},l=Object.keys(s),c={LOW:.5,STD:1,HIGH:2},f={LOW:e.orange,STD:e.yellow,HIGH:e.greenBright},p={LOW:"Low",STD:"Standard",HIGH:"High"},u={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},m=kn||{};let v=0,b="";for(const D of l){const Q=Number(s[D]||0),ei=ze[D]||"STD",ti=u[D]||3e5,xa=c[ei],ba=Math.round(ti*xa),oi=Q*ba;v+=oi;const _a=D.replace(/_/g," ").replace(/\b\w/g,Re=>Re.toUpperCase()),ni=Number(m[D]||0),Fo=Math.max(0,Q-ni),ha=Fo===0?e.greenBright:Fo<Q?e.yellow:e.red,$a=Fo===0?"✓ IN STOCK":`${ni}/${Q}`;b+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${e.text}">${_a}</span>
                <div style="font-family:${o};font-size:7px;color:${ha};margin-top:1px">${$a}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${o};font-size:9px;color:${e.muted}">${Q.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(Re=>{const Uo=ei===Re,ii=f[Re],wa=_(Math.round(ti*c[Re]));return`<span onclick="bidSetGrade('${D}','${Re}')" style="padding:2px 6px;font-family:${o};font-size:7px;font-weight:700;cursor:pointer;color:${Uo?"#000":e.dim};background:${Uo?ii:"transparent"};border:1px solid ${Uo?ii:e.border}" title="${wa}/unit">${p[Re]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${o};font-size:10px;color:${e.text}">${_(oi)}</span></div>
        </div>`}const y=t.required_workforce||{},$=Number(y.general||0)+Number(y.skilled||0)||100,h=Math.max(40,Math.round($*.5)),k=$*2,T=[h,Math.round($*.75),$,Math.round($*1.5),k],C=Math.max(0,Math.min(1,(K-h)/(k-h||1))),w=r,I=Math.round(4.5-C*8),R=Math.max(Math.round(w*.6),w+I),E=I>0?`+${I}mo`:I<0?`${I}mo`:"On schedule",q=I>0?e.red:I<0?e.greenBright:e.yellow,L=15200,A=K*L*R,U=a,H=[{name:"Municipal Zoning Approval",cost:18e4,ticks:2,required:!0},{name:"Structural Engineering Cert.",cost:24e4,ticks:3,required:!0},{name:"Environmental Impact Assessment",cost:34e4,ticks:8,required:U>2e7},{name:"Seismic Resilience Compliance",cost:21e4,ticks:4,required:U>5e7},{name:"Heritage Conservation Review",cost:16e4,ticks:6,required:!1},{name:"Fire Safety Certification",cost:12e4,ticks:2,required:U>1e7}].filter(D=>D.required),N=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),B=H.filter(D=>!N.has(D.name)).reduce((D,Q)=>D+Q.cost,0),F=4e5,G=v+A+B+F,ee=Math.round(G*(Ie/100)),ge=G+ee,V=ge>a,Do=ee,Me=V?0:Math.max(0,Math.min(100,Math.round(100-ge/a*100+30))),Zn=Me>70?e.greenBright:Me>40?e.yellow:Me>0?e.orange:e.red,ya=V?"OVER CEILING":Me>70?"STRONG":Me>40?"COMPETITIVE":Me>20?"WEAK":"UNLIKELY",jo=Object.values(ze),xe=jo.length>0?Math.round(jo.reduce((D,Q)=>D+(Q==="HIGH"?85:Q==="STD"?65:45),0)/jo.length):50,eo=xe>=75?e.greenBright:xe>=50?e.yellow:xe>=25?e.orange:e.red,ga=xe>=75?"EXCELLENT":xe>=50?"FAIR":xe>=25?"POOR":"BAD",at=document.createElement("div");at.id="bid-assembly-overlay",at.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",at.addEventListener("click",D=>{D.target===at&&Qn()}),at.innerHTML=`
    <div style="width:740px;max-height:94vh;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <!-- HEADER -->
        <div style="padding:10px 16px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${o};font-size:8px;font-weight:700;padding:2px 8px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${i.toUpperCase()}</span>
                    <span style="font-size:14px;font-weight:700;color:${e.text}">${t.name}</span>
                    <span style="font-family:${o};font-size:8px;font-weight:700;padding:2px 6px;color:${n?e.accentBright:e.gold};background:${n?"rgba(163,176,126,0.1)":"rgba(200,168,50,0.08)"};border:1px solid ${n?"rgba(163,176,126,0.2)":"rgba(200,168,50,0.2)"}">${n?"GOV":"PRIVATE"}</span>
                </div>
                <span onclick="closeBidAssembly()" style="font-family:${o};font-size:14px;color:${e.dim};cursor:pointer;padding:0 4px">×</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                <span style="font-family:${o};font-size:9px;color:${e.dim}">${t.project_code||"—"}</span>
                <span style="font-family:${o};font-size:9px;color:${e.dim}">·</span>
                <span style="font-size:10px;color:${e.accent}">${t.issuer_name||"—"}</span>
                <span style="font-family:${o};font-size:9px;color:${e.dim}">·</span>
                <span style="font-family:${o};font-size:9px;color:${e.muted}">Ceiling: <span style="color:${e.text};font-weight:700">${_(a)}</span></span>
                <span style="font-family:${o};font-size:9px;color:${e.dim}">·</span>
                <span style="font-family:${o};font-size:9px;color:${e.muted}">Timeline: <span style="color:${e.text};font-weight:700">${r} months</span></span>
            </div>
        </div>

        <!-- CONTENT — two columns -->
        <div style="flex:1;display:flex;overflow:hidden;">

            <!-- LEFT: Cost Assembly -->
            <div style="flex:1;border-right:1px solid ${e.border};overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Materials</span>
                </div>
                <div style="display:flex;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="flex:1.2;font-family:${o};font-size:7px;color:${e.dim}">MATERIAL</span>
                    <span style="flex:0.5;font-family:${o};font-size:7px;color:${e.dim};text-align:center">QTY</span>
                    <span style="flex:1.2;font-family:${o};font-size:7px;color:${e.dim};text-align:center">GRADE</span>
                    <span style="flex:0.8;font-family:${o};font-size:7px;color:${e.dim};text-align:right">COST</span>
                </div>
                ${b}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${o};font-size:9px;color:${e.muted}">MATERIALS TOTAL</span>
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(v)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Labor</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim};width:60px">WORKERS</span>
                        <div style="display:flex;gap:3px;">
                            ${T.map(D=>`<span onclick="bidSetWorkers(${D})" style="padding:2px 8px;font-family:${o};font-size:8px;font-weight:700;cursor:pointer;color:${K===D?"#000":e.dim};background:${K===D?e.accent:"transparent"};border:1px solid ${K===D?e.accent:e.border}">${D}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">${K} × $${L.toLocaleString()}/tick × ${R} ticks</span>
                        <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(A)}</span>
                    </div>
                    <div style="margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <span style="font-family:${o};font-size:8px;color:${e.dim}">WORKFORCE REQUIRED</span>
                        </div>
                        <div style="display:flex;gap:12px;">
                            <span style="font-family:${o};font-size:7px;color:#8b9a6b">General: ${Math.ceil(K*.8)}</span>
                            <span style="font-family:${o};font-size:7px;color:#c8a832">Skilled: ${Math.ceil(K*.15)}</span>
                            <span style="font-family:${o};font-size:7px;color:#c84">Innovative: ${Math.ceil(K*.05)}</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">COMPLETION TIMELINE</span>
                        <span style="font-family:${o};font-size:10px;font-weight:700;color:${q}">${R}mo <span style="font-size:8px;opacity:0.7">(${E})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${H.map(D=>{const Q=N.has(D.name);return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
                        <div style="flex:1;display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${o};font-size:8px;font-weight:700;color:${Q?e.greenBright:e.orange}">${Q?"✓":"○"}</span>
                            <span style="font-size:10px;color:${Q?e.muted:e.text}">${D.name}</span>
                        </div>
                        ${Q?`<span style="font-family:${o};font-size:8px;color:${e.greenBright}">HELD</span>`:`<div style="text-align:right">
                                <span style="font-family:${o};font-size:9px;color:${e.redDim}">${_(D.cost)}</span>
                                <span style="font-family:${o};font-size:7px;color:${e.dim};margin-left:4px">${D.ticks}t</span>
                            </div>`}
                    </div>`}).join("")}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${o};font-size:9px;color:${e.muted}">PERMIT COSTS</span>
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(B)}</span>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${o};font-size:9px;color:${e.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(F)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v},{l:"Labor",v:A},{l:"Permits",v:B},{l:"Overhead",v:F}].map(D=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-size:10px;color:${e.muted}">${D.l}</span>
                    <span style="font-family:${o};font-size:10px;color:${e.redDim}">${_(D.v)}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:rgba(204,85,85,0.03);">
                    <span style="font-family:${o};font-size:10px;font-weight:700;color:${e.text}">TOTAL EST. COST</span>
                    <span style="font-family:${o};font-size:13px;font-weight:700;color:${e.red}">${_(G)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.gold};text-transform:uppercase">Set Markup</span>
                </div>
                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="font-family:${o};font-size:9px;color:${e.dim}">MARKUP %</span>
                        <span style="font-family:${o};font-size:16px;font-weight:700;color:${e.gold}">${Ie}%</span>
                    </div>
                    <input type="range" min="0" max="40" step="1" value="${Ie}" oninput="bidSetMarkup(+this.value)" style="width:100%;accent-color:${e.gold};height:6px;" />
                    <div style="display:flex;justify-content:space-between;font-family:${o};font-size:7px;color:${e.dim};margin-top:2px;">
                        <span>0% (at cost)</span><span>40% (maximum)</span>
                    </div>
                </div>

                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${V?"rgba(204,85,85,0.04)":"rgba(200,168,50,0.03)"};">
                    <div style="font-family:${o};font-size:8px;color:${e.dim};margin-bottom:4px">YOUR BID PRICE</div>
                    <div style="font-family:${o};font-size:22px;font-weight:700;color:${V?e.red:e.gold}">${_(ge)}</div>
                    ${V?`<div style="font-family:${o};font-size:8px;font-weight:700;color:${e.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${_(a)})</div>`:""}
                </div>

                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">PROJECTED PROFIT</span>
                        <span style="font-family:${o};font-size:14px;font-weight:700;color:${Do>0?e.greenBright:e.dim}">+${_(Do)}</span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Bid Assessment</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">COMPETITIVENESS</span>
                        <span style="font-family:${o};font-size:11px;font-weight:700;color:${Zn}">${ya}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${Me}%;height:100%;background:${Zn}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${o};font-size:11px;font-weight:700;color:${eo}">${xe}</span>
                            <span style="font-family:${o};font-size:8px;color:${e.dim}">/100</span>
                            <span style="font-family:${o};font-size:8px;font-weight:700;color:${eo}">${ga}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${xe}%;height:100%;background:${eo}"></div></div>
                    <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="font-family:${o};font-size:8px;color:${e.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${ut.length===0?`<div style="font-family:${o};font-size:8px;color:${e.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${ut.map(D=>`<span style="padding:2px 6px;font-family:${o};font-size:7px;color:${e.muted};background:${e.card};border:1px solid ${e.border};">${D.name} <span style="color:${e.dim}">Q:${D.quality}</span></span>`).join("")}
                        </div>
                        <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:3px">${ut.length} competing bid${ut.length!==1?"s":""}. Bid prices are sealed until resolution.</div>`}
                    <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:3px">Higher reputation bidders may win at higher prices.</div>
                </div>
                <div style="flex:1"></div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">YOUR BID</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${V?e.red:e.gold}">${_(ge)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">EST. PROFIT</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${e.greenBright}">+${_(Do)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${eo}">${xe}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${o};font-size:10px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="${V?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${o};font-size:10px;font-weight:700;letter-spacing:1px;color:${V?e.dim:"#000"};background:${V?e.border:e.gold};cursor:${V?"not-allowed":"pointer"};opacity:${V?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(at)}let an=!1;async function sl(){if(an||!$e)return;const o=$e,e=o.required_materials||{},t=Object.keys(e),n=Number(o.budget_ceiling||0),i=Number(o.timeline_ticks||8),a={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},r={LOW:.5,STD:1,HIGH:2};let s=0;for(const L of t){const A=Number(e[L]||0),U=ze[L]||"STD",j=a[L]||3e5;s+=A*Math.round(j*r[U])}const l=15200,c=o.required_workforce||{},f=Number(c.general||0)+Number(c.skilled||0)||100,p=Math.max(40,Math.round(f*.5)),u=f*2,m=Math.max(0,Math.min(1,(K-p)/(u-p||1))),v=Math.round(4.5-m*8),b=Math.max(Math.round(i*.6),i+v),y=K*l*b,$=n,h=[{name:"Municipal Zoning Approval",cost:18e4,required:!0},{name:"Structural Engineering Cert.",cost:24e4,required:!0},{name:"Environmental Impact Assessment",cost:34e4,required:$>2e7},{name:"Seismic Resilience Compliance",cost:21e4,required:$>5e7},{name:"Fire Safety Certification",cost:12e4,required:$>1e7}],k=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),T=h.filter(L=>L.required&&!k.has(L.name)).reduce((L,A)=>L+A.cost,0),w=s+y+T+4e5,I=Math.round(w*(Ie/100)),R=w+I;if(R>n){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const E=Object.values(ze),q=E.length>0?Math.round(E.reduce((L,A)=>L+(A==="HIGH"?85:A==="STD"?65:45),0)/E.length):50;if(confirm('Submit bid for "'+o.name+`"?

Bid Price: `+_(R)+`
Est. Cost: `+_(w)+`
Markup: `+Ie+"% ("+_(I)+`)
Quality: `+q+`/100
Workers: `+K+`

Once submitted, your bid cannot be changed.`)){an=!0;try{const{data:L}=await g.from("shard").select("current_tick").eq("name","Alpha Shard").single(),A=L?.current_tick||0,U={};for(const H of t)U[H]=ze[H]||"STD";const{error:j}=await g.from("contract_bids").insert({contract_id:o.id,faction_id:d.id,bid_price:R,material_grades:U,labor_count:K,markup_pct:Ie,estimated_cost:w,estimated_quality:q,status:"pending",submitted_at_tick:A});if(j)throw j;o.status==="open"&&await g.from("construction_contracts").update({status:"bidding"}).eq("id",o.id).eq("status","open"),Qn(),alert(`Bid submitted successfully!

Contract: `+o.name+`
Your Bid: `+_(R)+`
Quality: `+q+`/100

Bids will be resolved when the bidding window closes (`+(o.bidding_ends_tick?"tick "+o.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof Ze=="function"&&await Ze()}catch(L){alert("Bid submission failed: "+L.message)}finally{an=!1}}}window.openBidAssembly=nl;window.closeBidAssembly=Qn;window.bidSetGrade=il;window.bidSetWorkers=al;window.bidSetMarkup=rl;window.submitBidAssembly=sl;let rn=!1;async function ll(o){if(rn)return;const e=1e6,t=Number(d?.corp_cash_reserves??0);if(t<e){alert("Cannot retract — you need at least $1M in cash reserves to cover the retraction penalty.");return}if(confirm(`Retract your bid?

This will cost $1M as a retraction penalty.
This action cannot be undone.`)){rn=!0;try{const n=t-e,{error:i}=await g.from("factions").update({corp_cash_reserves:n}).eq("id",d.id);if(i)throw i;const{error:a}=await g.from("contract_bids").delete().eq("contract_id",o).eq("faction_id",d.id);if(a)throw a;d.corp_cash_reserves=n,typeof tt=="function"&&tt(n),alert("Bid retracted. $1M penalty applied."),Yt(),await Ze()}catch(n){alert("Failed to retract bid: "+(n.message||"Unknown error"))}finally{rn=!1}}}window.retractBid=ll;let Gt=[],He=0,ve=null,sn=!1,ln=!1,dn=!1;async function dl(){if(!We||ln)return;ln=!0,ve=We,He=0;const{data:o,error:e}=await g.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",ve.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(ln=!1,e){alert("Failed to load bids: "+e.message);return}Gt=(o||[]).map(t=>({...t,corp:t.factions?.faction_name||"Unknown",abbr:t.factions?.corp_ticker||"???",subsector:t.factions?.corp_subsector||"—"})),Yt(),ca()}function Po(){document.getElementById("bid-review-overlay")?.remove(),ve=null}function cl(o){He=o,ca()}async function pl(){if(sn||Gt.length===0)return;const o=Gt[He];if(!(!o?.id||!o.faction_id)&&confirm("Accept bid from "+o.corp+`?

Bid Price: `+_(o.bid_price)+`
Quality: `+o.estimated_quality+`/100
Workers: `+o.labor_count+`

This will award the contract. The project begins immediately.`)){sn=!0;try{const{data:e}=await g.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{error:n}=await g.from("contract_bids").update({status:"won"}).eq("id",o.id);if(n)throw n;const{error:i}=await g.from("contract_bids").update({status:"lost"}).eq("contract_id",ve.id).neq("id",o.id);if(i)throw i;const{error:a}=await g.from("construction_contracts").update({status:"awarded",awarded_to_faction:o.faction_id,awarded_at_tick:t}).eq("id",ve.id);if(a)throw a;Po(),alert("Contract awarded to "+o.corp+`!

Bid: `+_(o.bid_price)+`
Project begins immediately.`),typeof Ze=="function"&&await Ze()}catch(e){alert("Failed to accept bid: "+(e.message||e))}finally{sn=!1}}}async function fl(){if(!(!ve||dn)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){dn=!0;try{const{error:o}=await g.from("contract_bids").update({status:"lost"}).eq("contract_id",ve.id);if(o)throw o;const{error:e}=await g.from("construction_contracts").update({status:"expired"}).eq("id",ve.id);if(e)throw e;Po(),alert("All bids declined. Contract cancelled."),typeof Ze=="function"&&await Ze()}catch(o){alert("Failed: "+(o.message||o))}finally{dn=!1}}}function ca(){if(document.getElementById("bid-review-overlay")?.remove(),!ve||Gt.length===0)return;const o="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},t=ve,n=Gt;He>=n.length&&(He=0);const i=n[He],a=Number(t.budget_ceiling||0),r=Number(t.timeline_ticks||36),s=Math.min(...n.map(m=>m.bid_price)),l=Math.max(...n.map(m=>m.estimated_quality||0));let c="";for(let m=0;m<n.length;m++){const v=n[m],b=m===He,y=v.bid_price===s,$=(v.estimated_quality||0)===l,h=v.bid_price>a;c+=`
        <div onclick="reviewSelectBid(${m})" style="padding:10px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${b?e.accent:"transparent"};background:${b?"rgba(139,154,107,0.03)":"transparent"};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-family:${o};font-size:10px;font-weight:700;color:${e.gold}">${v.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${e.text}">${v.corp}</span>
                ${y?`<span style="font-family:${o};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.greenBright};background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2)">CHEAPEST</span>`:""}
                ${$?`<span style="font-family:${o};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.2)">BEST QUALITY</span>`:""}
            </div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};">
                <div style="flex:1.2;padding:5px 10px;border-right:1px solid ${e.border}">
                    <div style="font-family:${o};font-size:7px;color:${e.dim}">BID PRICE</div>
                    <div style="font-family:${o};font-size:14px;font-weight:700;color:${h?e.red:e.text}">${_(v.bid_price)}</div>
                    ${h?`<div style="font-family:${o};font-size:7px;color:${e.red}">OVER BUDGET</div>`:""}
                </div>
                <div style="flex:0.8;padding:5px 10px;border-right:1px solid ${e.border};text-align:center">
                    <div style="font-family:${o};font-size:7px;color:${e.dim}">QUALITY</div>
                    <div style="font-family:${o};font-size:14px;font-weight:700;color:${(v.estimated_quality||0)>=75?e.greenBright:(v.estimated_quality||0)>=55?e.yellow:e.orange}">${v.estimated_quality||0}</div>
                </div>
                <div style="flex:0.8;padding:5px 10px;text-align:center">
                    <div style="font-family:${o};font-size:7px;color:${e.dim}">WORKERS</div>
                    <div style="font-family:${o};font-size:14px;font-weight:700;color:${e.text}">${v.labor_count||0}</div>
                </div>
            </div>
        </div>`}const f=i.bid_price>a,p=a>0?Math.round(i.bid_price/a*100):0,u=document.createElement("div");u.id="bid-review-overlay",u.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",u.addEventListener("click",m=>{m.target===u&&Po()}),u.innerHTML=`
    <div style="width:640px;max-height:92vh;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:10px 16px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:14px;font-weight:700;color:${e.text}">${t.name}</span>
                    <span style="font-family:${o};font-size:8px;font-weight:700;padding:2px 6px;color:${e.gold};background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">YOUR PROJECT</span>
                </div>
                <span onclick="closeBidReview()" style="font-family:${o};font-size:14px;color:${e.dim};cursor:pointer">×</span>
            </div>
            <div style="display:flex;gap:8px;margin-top:4px;font-family:${o};font-size:9px;color:${e.dim};">
                <span>${t.project_code||"—"}</span>
                <span>·</span>
                <span>Budget: <span style="color:${e.text};font-weight:700">${_(a)}</span></span>
                <span>·</span>
                <span>Timeline: <span style="color:${e.text};font-weight:700">${r}mo</span></span>
            </div>
        </div>
        <div style="padding:6px 16px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.gold}">${n.length} BID${n.length!==1?"S":""} RECEIVED</span>
            <div style="display:flex;gap:8px;font-family:${o};font-size:8px;color:${e.dim};">
                <span>Cheapest: <span style="color:${e.greenBright}">${_(s)}</span></span>
                <span>Best Quality: <span style="color:${e.accent}">${l}</span></span>
            </div>
        </div>
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${e.border};overflow:auto;">
                ${c}
            </div>
            <div style="width:250px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.gold}">${i.abbr}</span>
                        <span style="font-size:12px;font-weight:700;color:${e.text}">${i.corp}</span>
                    </div>
                    <div style="font-family:${o};font-size:8px;color:${e.dim};margin-top:2px">${i.subsector}</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <span style="font-family:${o};font-size:8px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Breakdown</span>
                </div>
                ${[{l:"Materials",v:Number(i.estimated_cost||0)*.45},{l:"Labor",v:Number(i.estimated_cost||0)*.45},{l:"Overhead",v:Number(i.estimated_cost||0)*.1}].map(m=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${o};font-size:9px;color:${e.dim};text-transform:uppercase">${m.l}</span>
                    <span style="font-family:${o};font-size:10px;color:${e.muted}">${_(Math.round(m.v))}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:${f?"rgba(204,85,85,0.03)":"rgba(200,168,50,0.03)"};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;color:${e.text}">TOTAL BID</span>
                    <span style="font-family:${o};font-size:14px;font-weight:700;color:${f?e.red:e.gold}">${_(i.bid_price)}</span>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">vs. YOUR BUDGET</span>
                        <span style="font-family:${o};font-size:9px;font-weight:700;color:${f?e.red:e.greenBright}">${f?"OVER":"WITHIN"} — ${p}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${e.border}"><div style="width:${Math.min(100,p)}%;height:100%;background:${f?e.red:e.accent}"></div></div>
                </div>
                ${[{l:"Quality",v:i.estimated_quality+"/100",c:(i.estimated_quality||0)>=75?e.greenBright:(i.estimated_quality||0)>=55?e.yellow:e.orange},{l:"Markup",v:i.markup_pct+"%",c:e.muted},{l:"Workers",v:i.labor_count+" workers",c:e.text}].map(m=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${o};font-size:9px;color:${e.dim};text-transform:uppercase">${m.l}</span>
                    <span style="font-family:${o};font-size:10px;font-weight:700;color:${m.c}">${m.v}</span>
                </div>`).join("")}
                <div style="flex:1"></div>
            </div>
        </div>
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">SELECTED BID</div><div style="font-family:${o};font-size:12px;font-weight:700;color:${e.gold}">${_(i.bid_price)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">CORPORATION</div><div style="font-family:${o};font-size:12px;font-weight:700;color:${e.text}">${i.corp}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${o};font-size:12px;font-weight:700;color:${(i.estimated_quality||0)>=75?e.greenBright:e.yellow}">${i.estimated_quality}</div></div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="declineAllBids()" style="padding:6px 16px;font-family:${o};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">DECLINE ALL</div>
                <div onclick="acceptBid()" style="padding:6px 20px;font-family:${o};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${e.accent};cursor:pointer">ACCEPT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(u)}const Ke={Coastal:{color:"#8b9a6b",label:"COASTAL"},Container:{color:"#5a7aaa",label:"CONTAINER"},Bulk:{color:"#c8a832",label:"BULK"},Tanker:{color:"#c86a4a",label:"TANKER"},Reefer:{color:"#6a9a5a",label:"REEFER"},LNG:{color:"#c55",label:"LNG"}},ml={in_port:{color:"#8b9a6b",label:"IN PORT"},in_transit:{color:"#5a8aaa",label:"IN TRANSIT"},dry_dock:{color:"#c84",label:"DRY DOCK"},anchored:{color:"#ca5",label:"ANCHORED"},for_sale:{color:"#9e9a92",label:"FOR SALE"}};function pa(o){return o>=75?"#5c5":o>=50?"#ca5":o>=25?"#c84":"#c55"}function ul(o){return o>=60?"#5c5":o>=30?"#ca5":o>=15?"#c84":"#c55"}async function ye(){if(!d)return;const{data:o,error:e}=await g.from("corp_vessels").select("*").eq("faction_id",d.id).order("vessel_class");e&&console.warn("Failed to load fleet:",e.message),ce=o||[],Ft=null;const{data:t,error:n}=await g.from("vessel_orders").select("id, vessel_name, vessel_class, shipyard_nation, ordered_at_tick, delivery_tick, build_ticks, balance_due").eq("faction_id",d.id).eq("status","building").order("delivery_tick",{ascending:!0});n&&console.warn("Failed to load vessel orders:",n.message),yi=t||[],It={},fo={};try{const i=ce.map(a=>a.id);if(i.length>0){const{data:a}=await g.from("finance_active_loans").select("insured_vessel_id").in("insured_vessel_id",i).in("status",["current"]);for(const s of a||[])s.insured_vessel_id&&(It[s.insured_vessel_id]=!0);const{data:r}=await g.from("finance_loan_requests").select("insured_vessel_id").eq("requesting_faction_id",d.id).eq("request_type","insurance").eq("status","open").not("insured_vessel_id","is",null);for(const s of r||[])s.insured_vessel_id&&!It[s.insured_vessel_id]&&(fo[s.insured_vessel_id]=!0)}}catch(i){console.warn("Failed to load vessel insurance status:",i.message)}fa()}function vl(o){Ft=Ft===o?null:o,fa()}function fa(){const o=document.getElementById("fl-count"),e=document.getElementById("fl-summary"),t=document.getElementById("fl-list"),n=document.getElementById("fl-footer");if(!o||!t)return;const i=ce,a=yi||[],r=a.length;o.textContent=i.length+" VESSEL"+(i.length!==1?"S":"")+(r>0?" · "+r+" BUILDING":"");const s=i.filter(y=>y.status==="in_transit").length,l=i.filter(y=>y.status==="in_port"||y.status==="anchored").length,c=i.filter(y=>y.status==="dry_dock").length,f=i.reduce((y,$)=>y+($.base_maintenance||0),0),p=r>0?[{label:"TRANSIT",value:s,color:"#5a8aaa"},{label:"IN PORT",value:l,color:"#8b9a6b"},{label:"BUILDING",value:r,color:"var(--amber)"},{label:"DRY DOCK",value:c,color:"#c84"},{label:"MAINT/TICK",value:_(f),color:"#a44"}]:[{label:"TRANSIT",value:s,color:"#5a8aaa"},{label:"IN PORT",value:l,color:"#8b9a6b"},{label:"DRY DOCK",value:c,color:"#c84"},{label:"MAINT/TICK",value:_(f),color:"#a44"}];e.innerHTML=p.map((y,$)=>`<div style="flex:1;padding:5px 8px;text-align:center;${$<p.length-1?"border-right:1px solid var(--border-0);":""}">
        <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">${y.label}</div>
        <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${y.color};margin-top:1px;">${y.value}</div>
    </div>`).join("");const u=S?.current_tick||0;let m="";for(const y of a){const $=Math.max(1,Number(y.build_ticks)||1),h=Number(y.delivery_tick)||0,k=Number(y.ordered_at_tick)||0,T=Math.max(0,h-u),C=Math.max(0,Math.min($,u-k)),w=Math.max(0,Math.min(100,Math.round(C/$*100))),I=Ke[y.vessel_class]||{color:"#9e9a92",label:(y.vessel_class||"?").toUpperCase()},R=T===0?"Delivering this tick":`Delivery in ${T} tick${T!==1?"s":""}`;m+=`<div style="border-bottom:1px solid var(--border-0);border-left:2px solid var(--amber);">
            <div style="padding:7px 14px;">
                <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                    <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x(y.vessel_name||"Unnamed Vessel")}</span>
                    <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${I.color};background:${I.color}12;border:1px solid ${I.color}25;">${I.label}</span>
                    <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:var(--amber);background:var(--amber-faint);border:1px solid var(--amber-border);">BUILDING</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:5px;">
                    Shipyard: ${x(y.shipyard_nation||"—")} · ${x(R)} · Balance $${Math.round(Number(y.balance_due)||0).toLocaleString()} due on delivery
                </div>
                <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:2px;">
                    <span>BUILD PROGRESS</span>
                    <span style="color:var(--amber);font-weight:700;">${w}%</span>
                </div>
                <div style="height:5px;background:var(--bg-3);border:1px solid var(--border-0);">
                    <div style="width:${w}%;height:100%;background:var(--amber);transition:width 0.3s;"></div>
                </div>
            </div>
        </div>`}i.length===0&&a.length===0?t.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels in fleet.<br>Purchase ships to begin operations.</div>':i.length===0?t.innerHTML=m:t.innerHTML=m+i.map((y,$)=>{const h=Ft===$,k=Ke[y.vessel_class]||{color:"#666",label:"?"},T=ml[y.status]||{color:"#666",label:"?"},C=pa(y.condition),w=ul(y.fuel),I=y.condition<50||y.fuel<20,R=y.status==="in_transit",E=y.status==="dry_dock",q=S?.current_tick||0,L=Math.max(0,Math.floor((q-(y.built_at_tick||0))/12));let A=`<div onclick="flSelectVessel(${$})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${I?y.condition<50?C:w:"transparent"};background:${h?k.color+"06":"transparent"};">
                <div style="padding:7px 14px;">`;A+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x(y.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${k.color};background:${k.color}12;border:1px solid ${k.color}25;">${k.label}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${T.color};background:${T.color}12;border:1px solid ${T.color}25;">${T.label}</span>
            </div>`;const U=y.current_port_nation_id?"In port":R?"At sea":"—";if(A+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:5px;">${x(U)}</div>`,A+=`<div style="display:flex;gap:8px;margin-bottom:4px;">
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${C};">${y.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${y.condition}%;height:100%;background:${C};"></div></div>
                </div>
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">FUEL</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${w};">${y.fuel}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${y.fuel}%;height:100%;background:${w};"></div></div>
                </div>
            </div>`,A+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);margin-top:1px;">${(y.capacity_dwt||0).toLocaleString()} ${y.capacity_unit||"DWT"}</div>
                </div>
                <div style="flex:0.7;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">AGE</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${L}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#a44;margin-top:1px;">${_(y.base_maintenance)}</div>
                </div>
            </div>`,E&&y.drydock_until_tick){const j=Math.max(0,y.drydock_until_tick-q);A+=`<div style="margin-top:4px;padding:3px 8px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">DRY DOCK REPAIRS</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c84;">${j} tick${j!==1?"s":""} remaining</span>
                </div>`}if(h){A+=`<div style="margin-top:6px;">
                    <div style="padding:5px 8px;background:var(--bg-0);border:1px solid var(--border-0);margin-bottom:6px;">`;const j=[{label:"VESSEL CLASS",value:y.vessel_class},{label:"BUILT",value:"Tick "+(y.built_at_tick||0)},{label:"FUEL CAPACITY",value:(y.fuel_capacity||0).toLocaleString()+" tons"},{label:"LAST REFURBISH",value:y.last_refurbish_tick?"Tick "+y.last_refurbish_tick:"N/A"}];for(let G=0;G<j.length;G++)A+=`<div style="display:flex;justify-content:space-between;padding:2px 0;${G<3?"border-bottom:1px solid var(--border-0);":""}">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${j[G].label}</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);">${j[G].value}</span>
                    </div>`;A+="</div>";const H=R||E,N=Math.round((y.purchase_price||3e6)*.08*(1+(100-y.condition)/100)),B=Math.round((y.fuel_capacity||1e3)*50*(1-y.fuel/100)),F=Math.round((y.purchase_price||3e6)*(y.condition/100)*.6);if(A+=`<div style="display:flex;gap:4px;">
                    <div onclick="${H?"":"flRefurbish('"+y.id+"',"+N+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${H?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${H?"var(--text-dim)":"#5c5"};border:1px solid ${H?"var(--border-0)":"#2a5a3a"};background:${H?"transparent":"rgba(74,170,136,0.06)"};opacity:${H?.35:1};">REFURBISH<br><span style="font-weight:400;font-size:6px;">${_(N)}</span></div>
                    <div onclick="${R?"":"flRefuel('"+y.id+"',"+B+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${R?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${R?"var(--text-dim)":"#c86a4a"};border:1px solid ${R?"var(--border-0)":"rgba(200,106,74,0.3)"};opacity:${R?.35:1};">REFUEL<br><span style="font-weight:400;font-size:6px;">from ${_(B)}</span></div>
                    <div onclick="${H?"":"flSell('"+y.id+"','"+x(y.vessel_name).replace(/'/g,"")+"',"+F+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${H?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${H?"var(--text-dim)":"#c84"};border:1px solid ${H?"var(--border-0)":"rgba(204,136,68,0.3)"};opacity:${H?.35:1};">LIST<br><span style="font-weight:400;font-size:6px;">${_(F)}</span></div>
                </div>`,!R){const G=It&&It[y.id],ee=fo&&fo[y.id];A+='<div style="display:flex;gap:4px;margin-top:4px;">',G?A+=`<div style="flex:1;display:flex;gap:2px;">
                            <div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#5c5;border:1px solid rgba(92,204,92,0.2);background:rgba(92,204,92,0.04);">INSURED ✓</div>
                            <div onclick="event.stopPropagation();flFileClaim('${y.id}','${x(y.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#c55;border:1px solid rgba(204,85,85,0.2);background:rgba(204,85,85,0.04);">FILE CLAIM</div>
                        </div>`:ee?A+='<div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#ca5;border:1px solid rgba(202,165,50,0.2);background:rgba(202,165,50,0.04);">PENDING ⏳</div>':A+=`<div onclick="event.stopPropagation();flRequestInsurance('${y.id}','${x(y.vessel_name).replace(/'/g,"")}',${y.purchase_price||0})" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#aa7a5a;border:1px solid rgba(170,122,90,0.3);background:rgba(170,122,90,0.04);">INSURE</div>`,A+=`<div onclick="flRename('${y.id}','${x(y.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:var(--text-muted);border:1px solid var(--border-0);">RENAME</div>`,A+="</div>"}R&&(A+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel at sea — actions available on arrival</div>'),E&&(A+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel in dry dock — repairs in progress</div>'),A+="</div>"}return A+="</div></div>",A}).join("");const v={};for(const y of i)v[y.vessel_class]=(v[y.vessel_class]||0)+1;let b='<div style="display:flex;gap:6px;">';for(const[y,$]of Object.entries(Ke))v[y]&&(b+=`<div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:${$.color};border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">${$.label}</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${v[y]}</span>
        </div>`);b+="</div>",b+=`<span style="font-family:var(--font-mono);font-size:8px;color:#a44;">${_(f)}/tick</span>`,n.innerHTML=b}let ne=!1;async function yl(o,e){if(ne||!d)return;const t=(ce||[]).find(m=>m.id===o);if(!t)return;const n=t.current_port_nation_id||null;let i="state",a=3,r=3,s=null,l="State Dry Dock (3x cost, 3 ticks)";if(n){const{data:m}=await g.from("corp_properties").select("id").eq("faction_id",d.id).eq("nation_id",n).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();if(m)i="own",a=1,r=2,l="Your Dry Dock (base cost, 2 ticks)";else{const{data:v}=await g.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",d.id).eq("nation_id",n).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();v&&(i="other",a=1.2,r=2,s=v.faction_id,l=(v.factions?.faction_name||"Another corp")+"'s Dry Dock (+20%, 2 ticks)")}}else l="State Dry Dock (3x cost, 3 ticks) — no private dock in port";const c=Math.round(e*a),{data:f}=await g.from("factions").select("corp_cash_reserves").eq("id",d.id).single(),p=Number(f?.corp_cash_reserves??0);if(p<c){alert("Insufficient cash. Need "+_(c)+", have "+_(p)+".");return}if(!confirm("Send "+(t.vessel_name||"vessel")+` to dry dock?

Dock: `+l+`
Cost: `+_(c)+`
Duration: `+r+` ticks
Condition restored to 85-100%.`))return;ne=!0;const u=S?.current_tick||0;try{const{error:m}=await g.from("factions").update({corp_cash_reserves:p-c}).eq("id",d.id);if(m){alert("Failed: "+m.message);return}if(i==="other"&&s){const b=c-e,{data:y}=await g.from("factions").select("corp_cash_reserves").eq("id",s).single();y&&await g.from("factions").update({corp_cash_reserves:Number(y.corp_cash_reserves||0)+b}).eq("id",s)}const{error:v}=await g.from("corp_vessels").update({status:"dry_dock",drydock_until_tick:u+r,active_claim_id:null}).eq("id",o);if(v){await g.from("factions").update({corp_cash_reserves:p}).eq("id",d.id),alert("Failed: "+v.message);return}d.corp_cash_reserves=p-c,await ye()}catch(m){alert("Dry dock failed: "+(m.message||"Error"))}finally{ne=!1}}async function gl(o,e){if(ne||!d)return;if(e<=0){alert("Fuel tanks are already full.");return}const t=(ce||[]).find(p=>p.id===o);if(!t)return;const n=t.current_port_nation_id||d.nation_id;let i="state",a=3,r=null,s="State Fuel (3x cost) — no private depot in port";if(n){const{data:p}=await g.from("corp_properties").select("id").eq("faction_id",d.id).eq("nation_id",n).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(p)i="own",a=1,s="Your Fuel Depot (base cost)";else{const{data:u}=await g.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",d.id).eq("nation_id",n).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();u&&(i="other",a=1.15,r=u.faction_id,s=(u.factions?.faction_name||"Another corp")+"'s Fuel Depot (+15%)")}}const l=Math.round(e*a),{data:c}=await g.from("factions").select("corp_cash_reserves").eq("id",d.id).single(),f=Number(c?.corp_cash_reserves??0);if(f<l){alert("Insufficient cash. Need "+_(l)+", have "+_(f)+".");return}if(confirm("Refuel "+(t.vessel_name||"vessel")+`?

Source: `+s+`
Cost: `+_(l)+`
Fuel restored to 100%.`)){ne=!0;try{const{error:p}=await g.from("factions").update({corp_cash_reserves:f-l}).eq("id",d.id);if(p){alert("Failed: "+p.message);return}if(i==="other"&&r){const m=l-e,{data:v}=await g.from("factions").select("corp_cash_reserves").eq("id",r).single();v&&await g.from("factions").update({corp_cash_reserves:Number(v.corp_cash_reserves||0)+m}).eq("id",r)}const{error:u}=await g.from("corp_vessels").update({fuel:100}).eq("id",o);if(u){await g.from("factions").update({corp_cash_reserves:f}).eq("id",d.id),alert("Failed: "+u.message);return}d.corp_cash_reserves=f-l,await ye()}catch(p){alert("Refuel failed: "+(p.message||"Error"))}finally{ne=!1}}}async function xl(o,e,t){if(ne||!d||!S||!confirm("List "+e+" on the Ship Market for "+_(t)+`?

The vessel will be removed from your fleet and listed for sale. You will receive payment when another corporation purchases it.`))return;ne=!0;const n=S.current_tick||0,i=ce.find(l=>l.id===o);if(!i){ne=!1;return}const a=Math.max(0,n-(i.built_at_tick||0)),{error:r}=await g.from("ship_market_listings").insert({nation_id:d.nation_id,vessel_name:i.vessel_name,vessel_class:i.vessel_class,capacity_dwt:i.capacity_dwt,capacity_unit:i.capacity_unit,condition:i.condition,fuel:i.fuel,age_ticks:a,fuel_capacity:i.fuel_capacity,base_maintenance:i.base_maintenance,asking_price:t,purchase_price_new:i.purchase_price||t,seller_type:"CORP",seller_name:d.faction_name,seller_faction_id:d.id,sale_reason:"Listed for sale by "+(d.faction_name||"corporation"),status:"available",listed_at_tick:n});if(r){alert("Failed to create listing: "+r.message),ne=!1;return}const{error:s}=await g.from("corp_vessels").delete().eq("id",o);if(s){await g.from("ship_market_listings").delete().eq("seller_faction_id",d.id).eq("vessel_name",i.vessel_name).eq("listed_at_tick",n),alert("Failed to remove vessel: "+s.message),ne=!1;return}ne=!1,Ft=null,await Promise.all([ye(),Jn()])}async function bl(o,e){const t=prompt("Rename vessel:",e);if(!t||t.trim()===e||t.trim().length<2)return;const{error:n}=await g.from("corp_vessels").update({vessel_name:t.trim().slice(0,40)}).eq("id",o);if(n){alert("Failed: "+n.message);return}await ye()}async function _l(o,e,t){if(!d||!S||!confirm("Request insurance for "+e+`?

Insurance corporations will see this in their Deal Flow and can offer coverage terms.

Vessel value: `+_(t)))return;const n=S.current_tick||0,{error:i}=await g.from("finance_loan_requests").insert({requesting_faction_id:d.id,nation_id:d.nation_id,request_type:"insurance",insured_vessel_id:o,amount:t,term_months:0,purpose:"Vessel Insurance — "+e,status:"open",created_tick:n,expires_tick:n+12});if(i){i.message.includes("duplicate")||i.message.includes("unique")?alert("Insurance already requested for this vessel."):alert("Failed to request insurance: "+i.message);return}alert(`Insurance request posted to Deal Flow.

Insurance corporations can now offer coverage for `+e+"."),await ye()}let cn=!1;async function hl(o,e){if(cn||!d||!S)return;const t=prompt(`Describe the claim reason:

e.g., "Storm damage during transit — hull breach repaired at sea" or "Engine failure requiring emergency dry dock"`);if(!t||t.trim().length<5)return;const n=S.current_tick||0,{data:i}=await g.from("finance_active_loans").select("id, lender_faction_id, principal, deductible_pct").eq("insured_vessel_id",o).eq("status","current").limit(1).maybeSingle();if(!i){alert("No active insurance policy found for this vessel.");return}const a=Number(i.principal||0),r=Number(i.deductible_pct||10),s=Math.round(a*r/100);if(!confirm("File insurance claim for "+e+`?

Coverage: `+_(a)+`
Deductible: `+r+"% ("+_(s)+`)

Reason: `+t.trim()+`

The insurer will review this claim and determine the payout.`))return;cn=!0;const{error:l}=await g.from("event_log").insert({nation_id:d.nation_id,faction_id:d.id,event_name:(d.faction_name||"Corporation")+" — Insurance Claim Filed",description_used:(d.faction_name||"A shipping corporation")+" has filed an insurance claim for vessel "+e+". Reason: "+t.trim().replace(/[<>"]/g,""),category:"business",trigger_key:"vessel_insurance_claim",effects_applied:{vessel_id:o,vessel_name:e,policy_id:i.id,insurer_faction_id:i.lender_faction_id,coverage:a,deductible_pct:r,claim_reason:t.trim()},fired_at_tick:n});l&&console.warn("Failed to log insurance claim event:",l.message);const{error:c}=await g.from("finance_active_loans").update({claims_paid:(i.claims_paid||0)+1}).eq("id",i.id);c&&console.warn("Failed to update claims_paid:",c.message),cn=!1,alert("Insurance claim filed for "+e+`.

The insurer (`+_(a)+" coverage) has been notified. Claim details are visible in the events feed.")}window.flRequestInsurance=_l;window.flFileClaim=hl;const En={fuel_depot:{label:"FUEL DEPOT",color:"#c86a4a",icon:"⛽",desc:"Bunkering facility — refuel at base cost, earn revenue from visiting fleets."},dry_dock:{label:"DRY DOCK",color:"#c84",icon:"🔧",desc:"Repair & maintenance dock — dock at base cost, earn revenue from visiting fleets."}},$l=[{type:"fuel_depot",name:"Fuel Depot — Standard",cost:105e6,maint:85e3,style:"Basic",desc:"Bulk fuel storage and bunkering facility."},{type:"fuel_depot",name:"Fuel Depot — Advanced",cost:14e7,maint:11e4,style:"Modern",desc:"High-capacity fuel terminal with pipeline infrastructure."},{type:"dry_dock",name:"Dry Dock — Standard",cost:85e6,maint:15e4,style:"Basic",desc:"Ship repair and maintenance facility."},{type:"dry_dock",name:"Dry Dock — Advanced",cost:115e6,maint:2e5,style:"Modern",desc:"Full-service shipyard with drydock and crane facilities."}];let wo=[];async function ma(){if(!d)return;const{data:o}=await g.from("corp_properties").select("*, nations!nation_id(name)").eq("faction_id",d.id).in("type",["fuel_depot","dry_dock"]).eq("is_active",!0).order("created_at",{ascending:!1});wo=o||[],wl()}function wl(){const o=document.getElementById("pf-count"),e=document.getElementById("pf-list"),t=document.getElementById("pf-footer");if(!o||!e||!t)return;const n=wo;if(o.textContent=n.length+" FACILIT"+(n.length===1?"Y":"IES"),n.length===0)e.innerHTML=`<div style="padding:20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-bottom:6px;">No port facilities built.</div>
            <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Build a <span style="color:#c86a4a;font-weight:700;">Fuel Depot</span> to refuel your fleet at base cost<br>and earn revenue from other corps refueling here.<br>Build a <span style="color:#c84;font-weight:700;">Dry Dock</span> to repair vessels at base cost.</div>
        </div>`;else{let r=0;e.innerHTML=n.map(s=>{const l=En[s.type]||En.fuel_depot,c=s.condition>=75?"#5c5":s.condition>=50?"#ca5":"#c84";return r+=Number(s.monthly_maintenance||0),`<div style="padding:8px 12px;border-bottom:1px solid var(--border-0);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${l.icon}</span>
                        <span style="font-size:11px;font-weight:600;color:var(--text-bright);">${x(s.name)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${l.color};background:${l.color}12;border:1px solid ${l.color}25;">${l.label}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:4px;">${x(s.nations?.name||"Unknown Nation")} · ${x(s.city||"Port")} · ${(s.style||"Basic").toUpperCase()}</div>
                <div style="display:flex;gap:12px;margin-bottom:4px;">
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${c};">${s.condition}%</span>
                        </div>
                        <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${s.condition}%;height:100%;background:${c};"></div></div>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#a44;">${_(s.monthly_maintenance||0)}</span>
                        </div>
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">VALUE: ${_(s.purchase_price||0)}</div>
                    </div>
                </div>
            </div>`}).join("")}Number(d?.corp_cash_reserves??0);const i=n.some(r=>r.type==="fuel_depot"),a=n.some(r=>r.type==="dry_dock");t.innerHTML=`
        <div onclick="pfOpenBuild('fuel_depot')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c86a4a;border:1px solid rgba(200,106,74,0.3);background:rgba(200,106,74,0.04);">
            ${i?"+ FUEL DEPOT":"BUILD FUEL DEPOT"}
        </div>
        <div onclick="pfOpenBuild('dry_dock')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c84;border:1px solid rgba(204,136,68,0.3);background:rgba(204,136,68,0.04);">
            ${a?"+ DRY DOCK":"BUILD DRY DOCK"}
        </div>`}let pn=!1;async function kl(o){if(pn||!d||!S)return;const e=$l.filter(y=>y.type===o);if(e.length===0)return;const t=En[o],n=d.nation_id,i=z?.name||d?.nation||"Home Nation",a=z?.capital||"Port City",r=[{id:n,name:i,capital:a,label:"National HQ"}],{data:s}=await g.from("corp_properties").select("nation_id, name, city, nations!nation_id(name, capital)").eq("faction_id",d.id).eq("type","regional_hq").eq("is_active",!0);for(const y of s||[])y.nation_id!==n&&r.push({id:y.nation_id,name:y.nations?.name||y.city||"Unknown",capital:y.nations?.capital||y.city||"Port City",label:y.name||"Subsidiary"});let l=r[0];if(r.length>1){let y=t.label+` — SELECT LOCATION
`+"─".repeat(30)+`
`;y+=`Build in which nation?

`;for(let k=0;k<r.length;k++){const T=r[k],C=wo.filter(w=>w.type===o&&w.nation_id===T.id).length;y+=k+1+". "+T.name+"  ("+T.label+")",C>0&&(y+="  ["+C+" existing]"),y+=`
`}y+=`
Enter number (or cancel):`;const $=prompt(y);if(!$)return;const h=parseInt($,10)-1;if(isNaN(h)||h<0||h>=r.length){alert("Invalid selection.");return}l=r[h]}const c=wo.filter(y=>y.type===o&&y.nation_id===l.id).length;let f=t.label+" CONSTRUCTION — "+l.name.toUpperCase()+`
`+"─".repeat(30)+`
`;c>0&&(f+="You already have "+c+" "+t.label.toLowerCase()+(c>1?"s":"")+` here.

`),f+=t.desc+`

`;for(let y=0;y<e.length;y++){const $=e[y];f+=y+1+". "+$.name+`
`,f+="   Cost: "+_($.cost)+" · Maint: "+_($.maint)+`/tick
`,f+="   "+$.desc+`

`}f+="Enter 1 or 2 to select (or cancel):";const p=prompt(f);if(!p)return;const u=parseInt(p,10)-1;if(isNaN(u)||u<0||u>=e.length){alert("Invalid selection.");return}const m=e[u];if(!confirm("Commission "+m.name+" in "+l.capital+", "+l.name+`?

Budget: `+_(m.cost)+`

This will create a construction contract that construction corporations can bid on. Payment occurs when the contract is awarded.`))return;pn=!0;const v=S.current_tick||0,b=(S.current_date||"").match(/\d{4}/)?.[0]||"2015";try{const{count:y}=await g.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",l.id).eq("issuer_type","PRIVATE"),h=`PVT-P${(y||0)+1}-${b}`,k=m.style==="Modern",T={concrete:k?60:40,steel:k?50:30,heavy_parts:k?30:20,aggregate:k?30:20},C={trucks:5,mixers:5,excavators:5},w={general:k?240:160,skilled:k?100:60},I=k?6:4,{error:R}=await g.from("construction_contracts").insert({nation_id:l.id,template_key:o,sector:"industrial",name:m.name,project_type:t.label,project_subtype:m.style,description:`${m.name} at ${l.capital} Port — commissioned by ${d.faction_name}. ${m.desc}`,project_code:h,budget_ceiling:m.cost,timeline_ticks:I,required_materials:T,required_equipment:C,required_workforce:w,status:"open",generated_at_tick:v,bidding_ends_tick:v+3,issuer_type:"PRIVATE",issuer_name:d.faction_name,issuer_faction_id:d.id});if(R)throw R;await ma(),alert(`Construction contract posted!

Project: `+m.name+`
Location: `+l.capital+", "+l.name+`
Code: `+h+`
Budget: `+_(m.cost)+`
Timeline: `+I+` ticks

Construction corporations in `+l.name+" can now bid on this project.")}catch(y){alert("Failed to post contract: "+(y.message||"Error"))}finally{pn=!1}}window.pfOpenBuild=kl;const Kn={"Bulk Cargo":["Reefer","Bulk","Coastal"],"Container Freight":["Coastal","Container"],"Specialized Transport":["Tanker","LNG","Bulk"]};async function Jn(){if(!d)return;const{data:o,error:e}=await g.from("ship_market_listings").select("*, nation:nation_id(id, name)").eq("status","available").order("asking_price",{ascending:!0});e&&console.warn("Failed to load ship market:",e.message),Sn=o||[],mo=null,ua()}function El(o){mo=mo===o?null:o,ua()}function Cl(o){return(Kn[d?.corp_subsector]||[]).includes(o)}function ua(){const o=document.getElementById("sm-count"),e=document.getElementById("sm-list"),t=document.getElementById("sm-footer");if(!o||!e)return;const n=Sn;o.textContent=n.length+" AVAILABLE",n.length===0?e.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels on the market.<br>Check back next cycle.</div>':e.innerHTML=n.map((r,s)=>{const l=mo===s,c=Ke[r.vessel_class]||{color:"#666",label:"?"},f=r.seller_type==="CORP"?"#5a8aaa":"#8b9a6b",p=pa(r.condition),u=r.nation?.name||"—",m=Cl(r.vessel_class);S?.current_tick;const v=r.age_ticks||0,b=Math.max(1,Math.floor(v/12)),y=u!==d?.nation?Number(d?.tariffs||z?.tariffs||0):0,$=Math.round(r.asking_price*y/100),h=r.asking_price+$;let k=`<div onclick="smSelectListing(${s})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${l?c.color:"transparent"};background:${l?c.color+"06":"transparent"};">
                <div style="padding:8px 14px;">`;return k+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x(r.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${c.color};background:${c.color}12;border:1px solid ${c.color}25;">${c.label}</span>
            </div>`,k+=`<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;">
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${f};background:${f}12;border:1px solid ${f}25;">${r.seller_type}</span>
                <span style="font-size:9px;color:var(--text-muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x(r.seller_name||"—")}</span>
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;">${u.toUpperCase().slice(0,6)}</span>
                ${y>0?`<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">+${y}%</span>`:""}
            </div>`,k+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-0);">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);margin-top:1px;">${(r.capacity_dwt||0).toLocaleString()} ${r.capacity_unit||"DWT"}</div>
                </div>
                <div style="flex:0.6;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">COND</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${p};margin-top:1px;">${r.condition}%</div>
                </div>
                <div style="flex:0.5;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">AGE</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${b}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">PRICE</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--gold);margin-top:1px;">${_(r.asking_price)}</div>
                </div>
            </div>`,l&&(k+='<div style="margin-top:6px;">',k+=`<div style="padding:4px 8px;margin-bottom:5px;background:var(--bg-0);border:1px solid var(--border-0);">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0);">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CARRIES</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${c.color};">${(Ke[r.vessel_class]||{}).label||"?"} class cargo</span>
                    </div>
                    <div style="padding:3px 0;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:1px;">REASON FOR SALE</div>
                        <div style="font-size:9px;color:var(--text-muted);line-height:1.4;">${x(r.sale_reason||"—")}</div>
                    </div>
                </div>`,k+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                    <div style="width:40px;height:3px;background:var(--border-0);"><div style="width:${r.condition}%;height:100%;background:${p};"></div></div>
                    ${r.condition<60?'<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">May need dry dock</span>':""}
                </div>`,y>0&&(k+=`<div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:8px;margin-bottom:3px;">
                        <span style="color:var(--text-dim);">Import tariff (${y}%)</span>
                        <span style="color:#c84;">+${_($)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;margin-bottom:5px;">
                        <span style="color:var(--text-bright);">TOTAL</span>
                        <span style="color:var(--gold);">${_(h)}</span>
                    </div>`),m?k+=`<div onclick="event.stopPropagation();smPurchase('${r.id}',${h})" style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${c.color};cursor:pointer;">${_(h)} — PURCHASE</div>`:k+=`<div style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:var(--text-dim);border:1px solid var(--border-0);opacity:0.4;">⊘ ${r.vessel_class} not available for ${d?.corp_subsector||"your subsector"}</div>`,k+="</div>"),k+="</div></div>",k}).join("");const i=n.filter(r=>r.seller_type==="CORP").length,a=n.filter(r=>r.seller_type==="LOCAL").length;t.innerHTML=`<div style="display:flex;gap:6px;">
        <div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:#5a8aaa;border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CORP</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${i}</span>
        </div>
        <div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:#8b9a6b;border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">LOCAL</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${a}</span>
        </div>
    </div>
    <div onclick="smOpenCommission()" style="padding:4px 14px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--gold);border:1px solid rgba(200,168,50,0.3);cursor:pointer;">COMMISSION VESSEL</div>`}let lt=!1;async function Tl(o,e){if(lt||!d||!S)return;const t=Number(d.corp_cash_reserves??0);if(t<e){alert("Insufficient cash. Need "+_(e)+".");return}if(!confirm("Purchase this vessel for "+_(e)+"?"))return;lt=!0;const n=Sn.find(p=>p.id===o);if(!n){lt=!1;return}const i=S.current_tick||0,a={Coastal:{capacity_dwt:14e3,capacity_unit:"DWT",base_maintenance:18e4,fuel_capacity:800,purchase_price:3e6},Container:{capacity_dwt:4800,capacity_unit:"TEU",base_maintenance:29e4,fuel_capacity:2100,purchase_price:65e6},Bulk:{capacity_dwt:28e3,capacity_unit:"DWT",base_maintenance:35e4,fuel_capacity:1800,purchase_price:3e6},Tanker:{capacity_dwt:42e3,capacity_unit:"DWT",base_maintenance:38e4,fuel_capacity:2400,purchase_price:53e6},Reefer:{capacity_dwt:12e3,capacity_unit:"DWT",base_maintenance:28e4,fuel_capacity:1600,purchase_price:6e6},LNG:{capacity_dwt:18e3,capacity_unit:"DWT",base_maintenance:58e4,fuel_capacity:1400,purchase_price:78e6}},r=a[n.vessel_class]||a.Coastal,{error:s}=await g.from("factions").update({corp_cash_reserves:t-e}).eq("id",d.id);if(s){alert("Failed: "+s.message),lt=!1;return}const{error:l}=await g.from("corp_vessels").insert({faction_id:d.id,nation_id:d.nation_id,vessel_name:n.vessel_name,vessel_class:n.vessel_class,condition:n.condition,fuel:n.fuel||50,status:"in_port",capacity_dwt:n.capacity_dwt||r.capacity_dwt,capacity_unit:n.capacity_unit||r.capacity_unit,base_maintenance:n.base_maintenance||r.base_maintenance,fuel_capacity:n.fuel_capacity||r.fuel_capacity,purchase_price:e,built_at_tick:i-(n.age_ticks||0),current_port_nation_id:d.nation_id});if(l){await g.from("factions").update({corp_cash_reserves:t}).eq("id",d.id),alert("Failed to create vessel: "+l.message),lt=!1;return}var{error:c}=await g.from("ship_market_listings").update({status:"sold",purchased_by:d.id,purchased_at_tick:i}).eq("id",o);if(c&&console.warn("Failed to mark listing as sold:",c.message),n.seller_faction_id){const{data:p}=await g.from("factions").select("corp_cash_reserves").eq("id",n.seller_faction_id).single();if(p){var{error:f}=await g.from("factions").update({corp_cash_reserves:Number(p.corp_cash_reserves||0)+n.asking_price}).eq("id",n.seller_faction_id);f&&console.warn("Failed to credit seller:",f.message)}}d.corp_cash_reserves=t-e,lt=!1,await Promise.all([ye(),Jn()])}const Ot=[{cls:"Coastal",baseCost:12e6,baseBuild:3,cargo:"Bulk, Containers (coastal)"},{cls:"Container",baseCost:65e6,baseBuild:5,cargo:"Manufactured, Tech, General"},{cls:"Bulk",baseCost:38e6,baseBuild:4,cargo:"Minerals, Aggregate, Military"},{cls:"Tanker",baseCost:52e6,baseBuild:5,cargo:"Fuel, Petroleum, Chemicals"},{cls:"Reefer",baseCost:45e6,baseBuild:4,cargo:"Food, Perishables, Agriculture"},{cls:"LNG",baseCost:78e6,baseBuild:6,cargo:"Liquefied Natural Gas only"}];let le="Coastal",Vt=0,Wt="",Je=[];function Sl(){le=(Kn[d?.corp_subsector]||["Coastal"])[0],Vt=0,Wt="",Je=[],document.getElementById("comm-overlay").style.display="flex",zl()}async function zl(){const{data:o}=await g.from("nations").select("id, name, manufacturing_output, physical_infrastructure, tariffs").order("name");Je=(o||[]).map(e=>{const t=Number(e.manufacturing_output??50),n=Math.round((.75+t/100*.5)*100)/100,i=Math.round((1.5-t/100*.65)*100)/100,a=e.id===d?.nation_id;return{id:e.id,name:e.name,mfg:t,costMod:n,buildMod:i,isHome:a,tariffs:Number(e.tariffs??0)}}),Je.sort((e,t)=>(t.isHome?1:0)-(e.isHome?1:0)),Xn()}function va(){document.getElementById("comm-overlay").style.display="none"}function Il(o){le=o,Xn()}function Nl(o){Vt=o,Xn()}function Al(o){Wt=o}function Xn(){const o=document.getElementById("comm-content");if(!o)return;const e=S?.current_tick||0,t=Ot.find(v=>v.cls===le)||Ot[0],n=Je[Vt]||{name:"—",costMod:1,buildMod:1},i=Ke[le]||{color:"#666"},a=Math.round(t.baseCost*n.costMod),r=Math.max(2,Math.round(t.baseBuild*n.buildMod)),s=Math.round(a*.5),l=a-s,c=e+r,f=Kn[d?.corp_subsector]||[];let p="";p+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:#c8a832;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Commission Vessel</span>
            </div>
            <span onclick="smCloseCommission()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
    </div>`,p+='<div style="flex:1;overflow-y:auto;">',p+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Vessel Type</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">`;for(const v of Ot){const b=Ke[v.cls]||{color:"#666",label:"?"},y=le===v.cls,$=f.includes(v.cls);p+=`<div onclick="${$?"commSetClass('"+v.cls+"')":""}" style="padding:5px 4px;text-align:center;cursor:${$?"pointer":"not-allowed"};background:${y?b.color+"18":"transparent"};border:1px solid ${y?b.color+"44":"var(--panel-border)"};opacity:${$?1:.3};">
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${y?b.color:"#6a6660"};">${b.label}</div>
            <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;margin-top:2px;">${_(v.baseCost)} base</div>
        </div>`}p+="</div>",p+=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:${i.color};">${t.cargo}</div>`,p+="</div>",p+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Origin Shipyard</div>`;for(let v=0;v<Je.length;v++){const b=Je[v],y=Vt===v,$=b.costMod>1?"#c84":b.costMod<1?"#5c5":"#6a6660",h=b.buildMod>1?"#c84":b.buildMod<1?"#5c5":"#6a6660";p+=`<div onclick="commSetNation(${v})" style="display:flex;align-items:center;padding:5px 8px;margin-bottom:2px;cursor:pointer;background:${y?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${y?"#8b9a6b44":"var(--panel-border)"};border-left:2px solid ${y?"#8b9a6b":"transparent"};">
            <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:11px;font-weight:600;color:${y?"var(--panel-text)":"#9e9a92"};">${x(b.name)}</span>
                    ${b.isHome?'<span style="font-family:var(--font-mono);font-size:6px;padding:0 3px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2);line-height:11px;">HOME</span>':""}
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${b.isHome?"Home port — no tariff":"Foreign shipyard"}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">MFG</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#9e9a92;">${b.mfg}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">COST</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${$};">×${b.costMod.toFixed(2)}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">SPEED</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${h};">×${b.buildMod.toFixed(2)}</div></div>
            </div>
        </div>`}p+="</div>",p+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Vessel Name</div>
        <input id="comm-name-input" value="${x(Wt)}" oninput="commSetName(this.value)" placeholder="e.g., MV 'Sierra Nevada'" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:11px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;box-sizing:border-box;" />
    </div>`,p+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Build Summary</div>
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:6px 10px;">`;const u=[{label:"VESSEL CLASS",value:le,color:i.color},{label:"SHIPYARD",value:n.name,color:"#9e9a92"},{label:"BASE COST",value:_(t.baseCost)+" × "+n.costMod.toFixed(2),color:"#9e9a92"},{label:"BUILD TIME",value:r+" ticks",color:r>t.baseBuild?"#c84":r<t.baseBuild?"#5c5":"#9e9a92"},{label:"COMPLETION",value:"~Tick "+c,color:"#9e9a92"}];for(const v of u)p+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${v.label}</span>
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${v.color};">${v.value}</span>
        </div>`;p+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">TOTAL COST</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c8a832;">${_(a)}</span>
    </div>`,p+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEPOSIT (50% NOW)</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">${_(s)}</span>
    </div>`,p+=`<div style="display:flex;justify-content:space-between;padding:3px 0;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">BALANCE ON COMPLETION</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${_(l)}</span>
    </div>`,p+="</div></div>",p+=`<div style="padding:6px 16px;">
        <div style="padding:5px 8px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#c8a832;margin-bottom:2px;">PAYMENT TERMS</div>
            <div style="font-size:9px;color:#6a6660;line-height:1.5;">50% deposit due immediately. Remaining 50% due on delivery at tick ${c}. Vessel delivered at 100% condition, fully fueled, to your nearest port. Cancellation forfeits deposit.</div>
        </div>
    </div>`,p+="</div>";const m=Wt.trim().length>=2;p+=`<div style="padding:10px 16px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">DEPOSIT DUE NOW</div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${_(s)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="smCloseCommission()" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="comm-order-btn" onclick="${m?"smPlaceOrder()":""}" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:${m?"#000":"#6a6660"};background:${m?"#c8a832":"transparent"};border:1px solid ${m?"#c8a832":"var(--panel-border)"};cursor:${m?"pointer":"default"};opacity:${m?1:.4};">PLACE ORDER</div>
        </div>
    </div>`,o.innerHTML=p}let St=!1;async function Ml(){if(St||!d||!S)return;const o=Wt.trim();if(o.length<2)return;const e=Ot.find(y=>y.cls===le)||Ot[0],t=Je[Vt];if(!t)return;const n=Math.round(e.baseCost*t.costMod),i=Math.max(2,Math.round(e.baseBuild*t.buildMod)),a=Math.round(n*.5),r=n-a,s=S.current_tick||0,l=Number(d.corp_cash_reserves??0);if(l<a){alert("Insufficient cash for deposit. Need "+_(a)+".");return}if(!confirm("Commission "+le+" from "+t.name+`?

Deposit: `+_(a)+` (non-refundable)
Balance: `+_(r)+" on delivery at tick "+(s+i)))return;St=!0;const c=document.getElementById("comm-order-btn");c&&(c.style.opacity="0.4",c.style.pointerEvents="none");const{error:f}=await g.from("factions").update({corp_cash_reserves:l-a}).eq("id",d.id);if(f){alert("Failed: "+f.message),St=!1;return}const{data:p}=await g.from("nations").select("budget_reserves").eq("id",t.id).single();if(p){var{error:u}=await g.from("nations").update({budget_reserves:Number(p.budget_reserves||0)+a}).eq("id",t.id);u&&console.warn("Failed to credit shipyard nation budget:",u.message)}const m={Coastal:{dwt:14e3,unit:"DWT",maint:18e4,fuel:800},Container:{dwt:4800,unit:"TEU",maint:29e4,fuel:2100},Bulk:{dwt:28e3,unit:"DWT",maint:35e4,fuel:1800},Tanker:{dwt:42e3,unit:"DWT",maint:38e4,fuel:2400},Reefer:{dwt:12e3,unit:"DWT",maint:28e4,fuel:1600},LNG:{dwt:18e3,unit:"DWT",maint:58e4,fuel:1400}},v=m[le]||m.Coastal,{error:b}=await g.from("vessel_orders").insert({faction_id:d.id,vessel_name:o,vessel_class:le,capacity_dwt:v.dwt,capacity_unit:v.unit,base_maintenance:v.maint,fuel_capacity:v.fuel,purchase_price:e.baseCost,shipyard_nation_id:t.id,shipyard_nation:t.name,cost_modifier:t.costMod,build_modifier:t.buildMod,total_cost:n,deposit_paid:a,balance_due:r,ordered_at_tick:s,delivery_tick:s+i,build_ticks:i,status:"building"});if(b){await g.from("factions").update({corp_cash_reserves:l}).eq("id",d.id),alert("Failed to place order: "+b.message),St=!1;return}d.corp_cash_reserves=l-a,St=!1,va(),alert(o+` commissioned!

Class: `+le+`
Shipyard: `+t.name+`
Deposit: `+_(a)+`
Delivery: Tick `+(s+i))}window.smSelectListing=El;window.smPurchase=Tl;window.smOpenCommission=Sl;window.smCloseCommission=va;window.commSetClass=Il;window.commSetNation=Nl;window.commSetName=Al;window.smPlaceOrder=Ml;window.flSelectVessel=vl;window.flRefurbish=yl;window.flRefuel=gl;window.flSell=xl;window.flRename=bl;window.openBidReview=dl;window.closeBidReview=Po;window.reviewSelectBid=cl;window.acceptBid=pl;window.declineAllBids=fl;window.switchToActions=qi;window.actSelectExec=us;window.actExecute=Zr;window.confirmFireExec=Jr;window.actOpenStatement=Di;window.actCloseStatement=Fn;window.actSubmitStatement=es;window.actDeclareBankruptcy=ji;window.actOpenRestructure=Gi;window.actCloseRestructure=Un;window.actSubmitRestructure=ds;window.actOpenRebrand=Vi;window.actCloseRebrand=Hn;window.actSubmitRebrand=cs;window.actOpenDonation=Wi;window.actCloseDonation=Gn;window.actSubmitDonation=ms;window.donateSelectParty=fs;window.lrOpen=Ui;window.lrClose=Hi;window.lrSubmit=ls;window.lrSetAmount=ns;window.lrSetPurpose=is;window.lrSetTerm=as;window.lrSetCollateral=rs;window.openExecSearch=vs;window.closeExecSearch=Qi;window.esSelectCandidate=ys;window.esHireCandidate=gs;window.switchToExpansion=Ri;window.switchToOperations=Li;window.hfSetChange=xs;window.hfReset=bs;window.hfConfirm=_s;document.addEventListener("click",function(o){const e=o.target.closest(".corp-nav-tab[href]:not([data-tab-action])");if(!e)return;const t=e.getAttribute("href");if(!t)return;const n=new URL(t,window.location.href);n.pathname!==window.location.pathname||n.searchParams.get("tab")||e.classList.contains("active")||(o.preventDefault(),Li(o))});Hr();
