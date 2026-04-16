const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-kB28qcfr.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as y}from"./supabase-client-CiYoFhIh.js";/* empty css                    */import{c as He,i as ca,a as pa,l as fa,M as Nt,Q as xn,b as bn,d as nn,e as ei,f as ti,g as ma,h as ua}from"./corp-shipping-data-CcJ84lK3.js";import{_ as va}from"./preload-helper-BXl3LOEh.js";import{e as b}from"./utils-CY90Gazr.js";import{initMessaging as ya}from"./messaging-BUrQna7p.js";import{c as ga,a as an,E as Rt,b as xo,d as oi,e as xa,f as ba,h as Yn}from"./equipment-DsuDdEne.js";import{a as _a,E as no,b as io,g as ha}from"./corp-executives-BY9FR9ui.js";import"./elections-B2jRdA_W.js";import"./config-fKhFNVuq.js";import"./government-types-CONVKpUN.js";import"./ideology-BIAflN4K.js";import"./stats-tIiBSaQA.js";let he=[],d=null,T=null,z=null,it=[],gt={},K=[],X={},sn=-1;const $a={em:"em_systems",glass:"glass_facades",heavy:"heavy_parts"},ao=o=>$a[o]||o;let de="concrete",J="STD",xe=500,ne=[],ni={},rn=0,Lt=[],qt=[],ct=0,$e=null,ke=-1,_e=[],Ot=null,Ct={},so={},_n=[],ro=null,pe="trucks",we=0,Ee=1,Le=[],Ge=null,ii=[],ln=null,Jt=null,dn="ALL",cn="TIMELINE";function P(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function wa(o){if(o>=12){const e=Math.floor(o/12),t=o%12;return t>0?e+"y "+t+"mo":e+"y"}return o+" ticks"}function ai(o){return!o||o.length===0?"":o.map(e=>{const t=ni[e];if(!t)return"";const i=t.reputation_bonus>0?"var(--green)":t.reputation_bonus<0?"var(--red)":"var(--text-dim)",n=t.reputation_bonus>0?"+"+t.reputation_bonus:t.reputation_bonus<0?String(t.reputation_bonus):"";return`<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:3px;font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">${t.icon||"📍"} ${b(t.name)}${n?` <span style="color:${i};font-weight:700;">${n} REP</span>`:""}</span>`}).filter(Boolean).join(" ")}function fe(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(0)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function hn(o){return o==="civil_engineering"?"CIVIL":o==="industrial"?"INDUSTRIAL":o==="mega_project"?"MEGA":o?.toUpperCase()||"—"}function si(o){return o==="civil_engineering"?"light":o==="industrial"?"heavy":o==="mega_project"?"mega":"light"}function ka(){Jt&&clearInterval(Jt),Jt=setInterval(()=>{if(!ln)return;const o=ln-Date.now();if(o<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(Jt);return}const e=Math.floor(o/36e5),t=Math.floor(o%36e5/6e4),i=Math.floor(o%6e4/1e3);document.getElementById("tick-countdown").textContent=e+"h "+t+"m "+i+"s"},1e3)}function Ea(){document.body.classList.toggle("light-mode");const o=document.getElementById("theme-toggle");o.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function Ca(o,e){o==="type"&&(dn=e),o==="sort"&&(cn=e),document.querySelectorAll(`.filter-pill[data-filter="${o}"]`).forEach(t=>{t.classList.toggle("active",t.dataset.value===e)}),li()}const Qn={"Civil Engineering":"civil_engineering","Industrial Construction":"industrial",Megaprojects:"mega_project"};function ri(o){if(!d)return!1;if(Qn[d.corp_subsector]===o.sector)return!0;const t=(G||[]).filter(i=>i.type==="regional_hq"&&i.is_active&&i.nation_id===o.nation_id);for(const i of t)if(Qn[i.subsector]===o.sector)return!0;return!1}function li(){const o=document.getElementById("oc-list");let e=[...it];if(dn==="GOVERNMENT"?e=e.filter(n=>n.issuer_type==="GOVERNMENT"):dn==="PRIVATE"&&(e=e.filter(n=>n.issuer_type==="PRIVATE")),cn==="TIMELINE"&&e.sort((n,a)=>(n.timeline_ticks||0)-(a.timeline_ticks||0)),cn==="BUDGET"&&e.sort((n,a)=>(a.budget_ceiling||0)-(n.budget_ceiling||0)),document.getElementById("oc-count").textContent=e.length+" AVAILABLE",e.length===0){o.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const t=z?.current_tick||0;let i="";for(const n of e){const a=n.issuer_type==="GOVERNMENT",s=a?"gov":"private",r=ri(n),c=r?"":" locked",p=si(n.sector),f=hn(n.sector),l=(n.timeline_ticks||0)>18?" warn":"",v=n.bidding_ends_tick?Math.max(0,n.bidding_ends_tick-t):"?";i+=`
            <div class="oc-item${c}" data-contract-id="${n.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${b(n.name)}</span>
                    <span class="oc-item__type-badge ${s}">${a?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${s}">${b(n.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${v} tick${v!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${fe(n.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${l}">${wa(n.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${p}">${f}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${gt[n.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${fe(gt[n.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${r?"yes":"no"}">${r?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${r?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openContractDetail(contracts.find(x=>x.id==='${n.id}'))">VIEW</button>`:""}
                </div>
                ${n.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${b(n.description)}</div>`:""}
                ${n.modifiers&&n.modifiers.length>0?`<div style="display:flex;flex-wrap:wrap;gap:3px;padding:4px 0 0;">${ai(n.modifiers)}</div>`:""}
            </div>`}o.innerHTML=i,o.querySelectorAll(".oc-item:not(.locked)").forEach(n=>{n.addEventListener("click",()=>{const a=n.dataset.contractId,s=it.find(r=>r.id===a);s&&di(s)})})}let Ve=null;function di(o){Ve=o;const e=document.getElementById("cd-overlay"),t=o.issuer_type==="GOVERNMENT",i=t?"gov":"private",n=(T?.name||d.nation||"—").toUpperCase(),a=ri(o);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${b(n)}</span>
        <span class="cd-header__name">${b(o.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${i}">${b(o.issuer_name)}</span>
        <span class="cd-header__type-badge ${i}">${t?"GOV":"PRIVATE"}</span>
    `;const s=document.getElementById("cd-blueprint");o.blueprint_svg?(s.innerHTML=o.blueprint_svg,s.style.display=""):(s.innerHTML=Ua(o),s.style.display="");const r=o.permits_required||[],c=o.required_equipment||o.equipment_required||{},p=Array.isArray(c)?c.map(M=>({key:M,qty:1})):Object.entries(c).map(([M,O])=>({key:M,qty:O})),f=o.required_materials||o.materials_estimated||{},v={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[o.sector]||o.spec_category||o.sector||"—";let m="var(--teal)";o.sector==="industrial"&&(m="var(--orange)"),o.sector==="mega_project"&&(m="var(--red)");let u=P(o.budget_ceiling||o.budget||0),g=(o.timeline_ticks||o.timeline_months||0)+" Months",_="";_+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${b(o.project_code||o.contract_number||"")}</span>
            </div>
            <div class="cd-issue__tags">
                ${o.project_type?`<span class="cd-tag teal">${b(o.project_type.toUpperCase())}</span>`:""}
                ${o.project_subtype?`<span class="cd-tag gold">${b(o.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,o.description&&(_+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${b(o.description)}</div>
            </div>`);const $=o.modifiers||[];if($.length>0){_+=`<div class="cd-items">
            <div class="cd-section-label">Building Modifiers</div>
            <div style="display:flex;flex-direction:column;gap:6px;">`;for(const M of $){const O=ni[M];if(!O)continue;const j=O.reputation_bonus>0?"var(--green)":O.reputation_bonus<0?"var(--red)":"var(--text-dim)",W=O.cost_multiplier>1?"+"+Math.round((O.cost_multiplier-1)*100)+"% cost":O.cost_multiplier<1?Math.round((1-O.cost_multiplier)*100)+"% cheaper":"",se=O.reputation_bonus!==0?(O.reputation_bonus>0?"+":"")+O.reputation_bonus+" rep":"",ye=O.required_permits||[];_+=`<div style="padding:6px 10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:600;font-size:0.78rem;color:var(--text-primary);">${O.icon||"📍"} ${b(O.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;">
                        ${W?`<span style="color:var(--amber);">${W}</span>`:""}
                        ${W&&se?" · ":""}
                        ${se?`<span style="color:${j};font-weight:700;">${se}</span>`:""}
                    </span>
                </div>
                <div style="font-size:0.65rem;color:var(--text-dim);margin-top:2px;">${b(O.description||"")}</div>
                ${ye.length>0?`<div style="font-size:0.6rem;color:var(--amber);margin-top:3px;font-family:var(--font-mono);">Requires permits: ${ye.map(H=>b(H.replace(/_/g," "))).join(", ")}</div>`:""}
            </div>`}_+="</div></div>"}_+='<div class="cd-details">',o.project_type&&(_+=Re("Type",o.project_type)),o.project_subtype&&(_+=Re("Sub-Type",o.project_subtype)),_+=Re("Specialization",v,m),_+=Re("Total Budget",u,"var(--green)"),_+=Re("Timeline",g),_+=Re("Nation",T?.name||d.nation||"—"),o.region&&(_+=Re("Region",o.region)),_+="</div>",r.length>0&&(_+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${r.map(M=>{const O=M.status==="approved"?"approved":"required",j=M.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${O}">
                            <span class="cd-chip__icon">${j}</span>
                            <span class="cd-chip__label">${b(M.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),f.length>0&&(_+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${f.map(M=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${b(M.name)}</span>
                        <span class="cd-mat-row__qty">${b(String(M.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=_;const h=r.filter(M=>M.status==="approved").length,k=r.length-h,I=p.length,E=[];for(const M of p){const O=ne.find(j=>j.equipment_key===M.key);O&&O.owned>=M.qty||E.push(M)}const S=E.length,C=o.required_materials||{},q=typeof C=="object"&&!Array.isArray(C)?Object.entries(C):[],w=[];for(const[M,O]of q){const j=X[M]||{},W=(j.LOW?.qty||0)+(j.STD?.qty||0)+(j.HIGH?.qty||0);W<O&&w.push({key:M,need:O,have:W})}const N=M=>M.replace(/_/g," ").replace(/\b\w/g,O=>O.toUpperCase());let R="";if(I>0)if(S===0)R+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>';else{const M=E.map(O=>N(O.key)).join(", ");R+=`<span class="cd-footer__badge bad" title="${b(M)}">${S} SHORT: ${b(M)}</span>`}if(q.length>0)if(w.length===0)R+='<span class="cd-footer__badge ok">ALL MATERIALS MET</span>';else{const M=w.map(O=>N(O.key)+" ("+O.have+"/"+O.need+")").join(", ");R+=`<span class="cd-footer__badge bad" title="${b(M)}">${w.length} MAT SHORT: ${b(M)}</span>`}r.length>0&&(k===0?R+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':R+=`<span class="cd-footer__badge warn">${k} PERMITS PENDING</span>`);const D=a,U=o.issuer_faction_id===d?.id,F=o.status==="bidding",ae=gt[o.id];document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${R}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${U?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${F?"":"disabled"} title="${F?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:ae?`<button class="cd-btn primary" onclick="retractBid('${o.id}')" style="background:#c55;border-color:#c55;"
                        title="Retract your bid ($1M penalty)">RETRACT BID</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${D?"":"disabled"}
                        title="${D?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,e.classList.add("open"),document.body.style.overflow="hidden"}function Ht(o){o&&o.target&&o.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",Ve=null)}const Pe=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],Kn={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},Jn={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let L=null;async function et(o){const e=K.find(M=>M.id===o);if(!e)return;const t=Array.isArray(e.contract_bids)?e.contract_bids[0]:e.contract_bids,i=z?.current_tick||0,n=e.awarded_at_tick||i,a=e.timeline_ticks||8,s=Math.max(0,i-n),r=Math.min(100,s/a*100);let c=Math.min(Pe.length-1,Math.floor(r/(100/Pe.length)));const p=Math.round(r%(100/Pe.length)/(100/Pe.length)*100),f=e.required_materials||{},l=t?.material_grades||{};let v=[];try{const{data:M}=await y.from("project_material_allocations").select("material_key, quality_tier, quantity, consumed").eq("contract_id",e.id);v=M||[]}catch{}const m={};for(const M of v)m[M.material_key]||(m[M.material_key]={totalAllocated:0,totalConsumed:0,tiers:{}}),m[M.material_key].totalAllocated+=M.quantity,m[M.material_key].totalConsumed+=M.consumed,m[M.material_key].tiers[M.quality_tier]={qty:M.quantity,consumed:M.consumed};const u=Object.entries(f).map(([M,O])=>{const j=l[M]||"STD",W=m[M]||{totalAllocated:0,totalConsumed:0,tiers:{}};return{key:M,name:M.replace(/_/g," ").replace(/\b\w/g,se=>se.toUpperCase()),grade:j,required:Number(O),allocated:W.totalAllocated,consumed:W.totalConsumed,tiers:W.tiers,warehouseStock:X[M]||{}}}),g=e.required_equipment||{},_=e.equipment_condition||{},h=(Array.isArray(g)?g.map(M=>[M,1]):Object.entries(g)).map(([M,O])=>{const j=ne.find(H=>H.equipment_key===M),se=(j?.assigned_projects||[]).find(H=>H.contract_id===e.id),ye=se?se.units:0;return{key:M,name:M.replace(/_/g," ").replace(/\b\w/g,H=>H.toUpperCase()),required:Number(O)||1,ownedTotal:j?.owned||0,deployed:j?.deployed||0,available:Math.max(0,(j?.owned||0)-(j?.deployed||0)),assignedToProject:ye,condition:_[M]??(j?.condition||100)}}),k=e.budget_ceiling||0,I=t?.estimated_cost||0,E=Math.round(I*Math.min(1,s/a)),S=t?.estimated_quality||65,C=S>=80?"STRONG":S>=60?"PROMISING":S>=40?"FAIR":"UNCERTAIN",q=e.required_workforce||{},w=e.workers_assigned||{},N=(q.general||0)+(q.skilled||0)+(q.innovative||0),R=(w.general||0)+(w.skilled||0)+(w.innovative||0),D=t?.labor_count||N,U=Number(d?.corp_general_workforce??0),F=Number(d?.corp_skilled_workforce??0),ae=Number(d?.corp_innovative_workforce??0);L={project:e,bid:t,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:i,awardedTick:n,totalTicks:a,ticksElapsed:s,phaseIdx:c,phaseProgress:p,materials:u,equipment:h,budget:k,estCost:I,spent:E,quality:S,qualityLabel:C,laborCount:D,wfNeeded:N,wfAssigned:R,reqWf:q,assignedWf:w,corpGeneral:U,corpSkilled:F,corpInnovative:ae,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",ci(e.id).then(()=>Qe()),Qe()}let V=!1;async function Sa(o,e,t){if(!(V||!L||!d)){V=!0;try{const{data:i,error:n}=await y.rpc("allocate_material_to_project",{p_contract_id:L.project.id,p_faction_id:d.id,p_material_key:o,p_quality_tier:e,p_quantity:t});if(n){alert("Allocation failed: "+n.message);return}if(i&&!i.success){alert(i.error||"Allocation failed");return}await fi(),await et(L.project.id)}catch(i){alert("Allocation error: "+i.message)}finally{V=!1}}}async function Ta(o,e,t){if(!(V||!L||!d)){V=!0;try{const{data:i,error:n}=await y.rpc("deallocate_material_from_project",{p_contract_id:L.project.id,p_faction_id:d.id,p_material_key:o,p_quality_tier:e,p_quantity:t});if(n){alert("Return failed: "+n.message);return}if(i&&!i.success){alert(i.error||"Return failed");return}await fi(),await et(L.project.id)}catch(i){alert("Return error: "+i.message)}finally{V=!1}}}async function za(o,e){if(!(V||!L||!d)){V=!0;try{const t=L.project,i=t.workers_assigned||{},n=Number(i[o]||0),a=Number((t.required_workforce||{})[o]||0),s=Number(d?.["corp_"+o+"_workforce"]??0);let r=0;for(const m of K||[])m.id!==t.id&&(r+=Number((m.workers_assigned||{})[o]||0));const c=Math.max(0,s-r-n),p=Math.min(e,a-n,c);if(p<=0){alert(c<=0?"No "+o+" workers available in pool":"Already fully staffed for "+o);return}const f={...i,[o]:n+p},{error:l}=await y.from("construction_contracts").update({workers_assigned:f}).eq("id",t.id);if(l){alert("Assign failed: "+l.message);return}const v=K.find(m=>m.id===t.id);v&&(v.workers_assigned=f),await et(t.id)}catch(t){alert("Assign error: "+t.message)}finally{V=!1}}}async function Ia(o,e){if(!(V||!L||!d)){V=!0;try{const t=L.project,i=t.workers_assigned||{},n=Number(i[o]||0),a=Math.min(e,n);if(a<=0){alert("No "+o+" assigned");return}const s={...i,[o]:n-a},{error:r}=await y.from("construction_contracts").update({workers_assigned:s}).eq("id",t.id);if(r){alert("Unassign failed: "+r.message);return}const c=K.find(p=>p.id===t.id);c&&(c.workers_assigned=s),await et(t.id)}catch(t){alert("Unassign error: "+t.message)}finally{V=!1}}}async function Ma(o,e){if(!(V||!L||!d)){V=!0;try{const t=ne.find(c=>c.equipment_key===o);if(!t){alert("Equipment not found in inventory.");return}const i=Math.max(0,(t.owned||0)-(t.deployed||0));if(i<e){alert("Not enough available "+o+" ("+i+" available).");return}const n=(t.deployed||0)+e,a=[...t.assigned_projects||[]],s=a.find(c=>c.contract_id===L.project.id);s?s.units+=e:a.push({contract_id:L.project.id,contract_name:L.project.name,units:e});const{error:r}=await y.from("corp_equipment").update({deployed:n,assigned_projects:a}).eq("faction_id",d.id).eq("equipment_key",t.equipment_key);if(r){alert("Deploy failed: "+r.message);return}await bi(),await et(L.project.id)}catch(t){alert("Deploy error: "+t.message)}finally{V=!1}}}async function Aa(o){if(!(V||!L||!d)){V=!0;try{const e=ne.find(r=>r.equipment_key===o);if(!e){alert("Equipment not found.");return}const t=[...e.assigned_projects||[]],i=t.findIndex(r=>r.contract_id===L.project.id);if(i===-1){alert("Equipment not deployed to this project.");return}const n=t[i].units;t.splice(i,1);const a=Math.max(0,(e.deployed||0)-n),{error:s}=await y.from("corp_equipment").update({deployed:a,assigned_projects:t}).eq("faction_id",d.id).eq("equipment_key",e.equipment_key);if(s){alert("Undeploy failed: "+s.message);return}await bi(),await et(L.project.id)}catch(e){alert("Undeploy error: "+e.message)}finally{V=!1}}}function Na(o){o&&o.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",L=null)}function Ra(o){L&&(L.tab=o,L.expandedEvent=-1,L.selectedResponse=null,Qe())}function La(o){L&&(L.expandedEvent=L.expandedEvent===o?-1:o,L.selectedResponse=null,Qe())}function qa(o){L&&(L.selectedResponse=L.selectedResponse===o?null:o,Qe())}function Qe(){if(!L)return;const o=L,e=o.project,t=e.issuer_type==="GOVERNMENT",i=hn(e.sector),n=d?.nation||"Nation",a=o.awardedTick+o.totalTicks,s=Math.max(0,a-o.currentTick),r=o.currentTick>a,c=o.budget>0?Math.round(o.spent/o.budget*100):0,p=c>85?"var(--red)":c>60?"var(--amber)":"var(--teal)",f=o.budget-o.spent,l=o.events.filter(_=>_.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${b(n.toUpperCase())}</span>
                <span class="pm-hdr__name">${b(e.name)}</span>
                <span style="color:var(--text-dim);font-size:12px">—</span>
                <span class="pm-hdr__issuer">${b(e.issuer_name||"—")}</span>
                <span class="pm-hdr__type">${t?"GOV":"PVT"}</span>
            </div>
            <button class="pm-hdr__close" onclick="closeProjectModal()">×</button>
        </div>
        <div class="pm-hdr__row2">
            <span class="pm-hdr__id">${b(e.template_key||e.id)}</span>
            <span class="pm-hdr__badge pm-hdr__badge--spec">${b(i.toUpperCase())}</span>
            <span class="pm-hdr__badge pm-hdr__badge--sub">${b((e.sector||"").replace(/_/g," ").toUpperCase())}</span>
        </div>
    `;let v='<div class="pm-phase__bar">';for(let _=0;_<Pe.length;_++){const $=_<o.phaseIdx,h=_===o.phaseIdx;v+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${$?"done":h?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${$?"done":h?"active":""}">${Pe[_]}</span>
        </div>`}v+="</div>",v+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${Pe[o.phaseIdx]} — ${o.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${r?"var(--red)":"var(--text-secondary)"}">Tick ${o.ticksElapsed} / ${o.totalTicks}${r?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=v;const m=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:l},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=m.map(_=>`<button class="pm-tab${o.tab===_.id?" active":""}" onclick="pmSetTab('${_.id}')">
            ${_.label}${_.badge>0?`<span class="pm-tab__badge">${_.badge}</span>`:""}
        </button>`).join("");let u="";o.tab==="overview"?u=Oa(o,e,p,c,f,s,r):o.tab==="events"?u=Ba(o):o.tab==="materials"?u=Pa(o):o.tab==="equipment"&&(u=Da(o)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${u}</div>`;let g="";l>0&&(g+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${l} EVENT${l>1?"S":""} REQUIRES RESPONSE</span>`),g+=`<span class="pm-ftr__badge" style="color:${o.quality>=70?"var(--green)":o.quality>=50?"var(--amber)":"var(--orange)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${o.quality}/100 — ${o.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${g}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function Oa(o,e,t,i,n,a,s){const r=De(o.awardedTick+o.totalTicks);De(o.awardedTick+o.totalTicks);const c=De(o.awardedTick),p=[{label:"Budget",value:fe(o.budget),sub:`${i}% spent`,color:t},{label:"Spent",value:fe(o.spent),color:"var(--red)"},{label:"Remaining",value:fe(n),color:"var(--green)"},{label:"Quality",value:`${o.quality}/100`,sub:o.qualityLabel,color:o.quality>=70?"var(--green)":o.quality>=50?"var(--amber)":"var(--red)"},{label:"Workforce",value:`${o.laborCount}/${o.wfNeeded}`,sub:`Bid: ${o.laborCount}`,color:o.laborCount<o.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${a} ticks`,sub:s?"OVERDUE":`Deadline: ${r}`,color:s?"var(--red)":"var(--text-bright)"}];let f="";f+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${b(e.description||e.name)}</div>
    </div></div>`,f+='<div class="pm-metrics">';for(const _ of p)f+=`<div class="pm-metric">
            <div class="pm-metric__label">${_.label}</div>
            <div class="pm-metric__value" style="color:${_.color}">${_.value}</div>
            ${_.sub?`<div class="pm-metric__sub">${b(_.sub)}</div>`:""}
        </div>`;f+="</div>",f+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${c}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${s?"var(--red)":"var(--text-bright)"};font-weight:700">${r}</span></span>
        </div>
    </div></div>`;const l=e.modifiers||[];l.length>0&&(f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Building Modifiers</div>',f+='<div style="display:flex;flex-wrap:wrap;gap:4px;">',f+=ai(l),f+="</div></div></div>");const v=[];if((e.sector==="civil_engineering"||e.sector==="industrial"||e.sector==="mega_project")&&(v.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),v.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),e.sector!=="civil_engineering"&&v.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),v.length>0){f+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const _ of v)f+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${b(_.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;f+="</div></div>"}f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Workforce Assignment</div>';const m=[{key:"general",label:"General Workers",corpAvail:o.corpGeneral,color:"var(--text-primary)"},{key:"skilled",label:"Skilled Workers",corpAvail:o.corpSkilled,color:"var(--blue)"},{key:"innovative",label:"Innovative Workers",corpAvail:o.corpInnovative,color:"var(--purple)"}];for(const _ of m){const $=Number(o.reqWf[_.key]||0);if($===0)continue;const h=Number(o.assignedWf[_.key]||0),I=h>=$?"var(--green)":h>0?"var(--amber)":"var(--red)",E=_.corpAvail>0&&h<$,S=Math.min(_.corpAvail,$-h),C=h>0;f+='<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.72rem;">',f+="<div>",f+=`<span style="color:${_.color};font-weight:600;">${_.label}</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Required: <strong>${$}</strong></span>`,f+=`<span style="color:${I};margin-left:8px;font-weight:700;">${h} assigned</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Pool: ${_.corpAvail}</span>`,f+="</div>",f+='<div style="display:flex;gap:4px;">',E&&(f+=`<button onclick="pmAssignWorkers('${_.key}',${S})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Assign ${S}</button>`),C&&(f+=`<button onclick="pmUnassignWorkers('${_.key}',${h})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Remove ${h}</button>`),f+="</div></div>"}const u=Number(o.reqWf.general||0)+Number(o.reqWf.skilled||0)+Number(o.reqWf.innovative||0),g=Number(o.assignedWf.general||0)+Number(o.assignedWf.skilled||0)+Number(o.assignedWf.innovative||0);return u>0&&g<u&&(f+='<div style="font-size:0.62rem;color:var(--red);margin-top:6px;font-family:var(--font-mono);">⚠ Project will STALL until workforce is fully assigned</div>'),f+="</div></div>",f}function Ba(o){if(o.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let e="";for(let t=0;t<o.events.length;t++){const i=o.events[t],n=o.expandedEvent===t,a=i.status==="ACTIVE",s=Kn[i.type]||Kn.WEATHER,r=Jn[i.severity]||Jn.LOW;if(e+=`<div class="pm-evt ${a?"pm-evt--active":"pm-evt--resolved"}" style="${a?`border-left-color:${s.color}`:""}">`,e+=`<div class="pm-evt__header" onclick="pmToggleEvent(${t})" style="${n?`background:${s.bg}`:""}">`,e+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${s.color};background:${s.bg};border:1px solid ${s.border}">${i.type}</span>
            <span class="pm-evt__sev-badge" style="color:${r}">${i.severity}</span>
            <span class="pm-evt__status" style="color:${a?"var(--red)":"var(--text-dim)"};font-weight:${a?"700":"400"}">${a?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,e+=`<div class="pm-evt__title">${b(i.title)}</div>`,e+=`<div class="pm-evt__meta">Tick ${i.tick} · ${b(i.id||"")}</div>`,n){if(e+='<div class="pm-evt__body">',e+=`<div class="pm-evt__desc">${b(i.desc)}</div>`,i.impact&&(e+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${b(i.impact)}</span>
                </div>`),a&&i.responses&&i.responses.length>0){e+='<div class="pm-evt__resp-title">Response Options</div>';for(let c=0;c<i.responses.length;c++){const p=i.responses[c],f=o.selectedResponse===c,v={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[p.tag]||"var(--text-secondary)";e+=`<div class="pm-resp${f?" selected":""}" style="${f?`border-color:${v}`:""}" onclick="event.stopPropagation();pmSelectResponse(${c})">`,e+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${b(p.label)}</span>
                            <span class="pm-resp__tag" style="color:${v};background:${v}12;border:1px solid ${v}25">${p.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${p.delay>0?"var(--orange)":"var(--green)"}">
                            ${p.delay>0?`+${p.delay} tick${p.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,e+=`<div class="pm-resp__detail">${b(p.detail)}</div>`,e+='<div class="pm-resp__costs">',p.cost&&(e+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${fe(p.cost)}</span>`),p.qualityImpact&&p.qualityImpact!==0&&(e+=`<span class="pm-resp__cost" style="color:${p.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${p.qualityImpact>0?"+":""}${p.qualityImpact}</span>`),!p.cost&&(!p.qualityImpact||p.qualityImpact===0)&&(e+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),e+="</div>",f&&(e+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${v}" onclick="event.stopPropagation();confirmEventResponse('${i.id}','${p.key}')">CONFIRM</button>
                        </div>`),e+="</div>"}}!a&&i.resolution&&(e+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${b(i.resolution)}</div>
                </div>`),e+="</div>"}e+="</div></div>"}return e}function Pa(o){if(o.materials.length===0)return'<div class="pm-evt-empty">No materials required for this project.</div>';let e='<div class="pm-tab-header">Project Materials</div>';for(const t of o.materials){const i=t.required>0?Math.round(t.allocated/t.required*100):0;t.allocated>0&&Math.round(t.consumed/t.allocated*100);const n=t.allocated>=t.required,a=n?"var(--green)":t.allocated>0?"var(--amber)":"var(--red)",s=n?"FULLY ALLOCATED":t.allocated>0?"PARTIAL":"NONE ALLOCATED";e+='<div class="pm-mat" style="margin-bottom:14px;">',e+=`<div class="pm-mat__row1">
            <div class="pm-mat__left">
                <span class="pm-mat__name">${b(t.name)}</span>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:${a};">${t.allocated} / ${t.required} allocated · ${s}</span>
        </div>`,e+=`<div class="pm-mat__bar-row">
            <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${i}%;background:${a};"></div></div>
            <span class="pm-mat__pct">${t.consumed} consumed</span>
        </div>`;const r=["STD","LOW","HIGH"],c=t.required-t.allocated;for(const p of r){const f=t.warehouseStock[p]||{qty:0},l=t.tiers[p]||{qty:0,consumed:0},v=l.qty-l.consumed;if(f.qty===0&&l.qty===0)continue;const m=p==="HIGH"?"var(--green)":p==="LOW"?"var(--orange)":"var(--text-muted)",u=p==="HIGH"?"HIGH":p==="LOW"?"LOW":"STD";if(e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.7rem;">',e+='<div style="display:flex;align-items:center;gap:6px;">',e+=`<span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${m};width:32px;">${u}</span>`,e+=`<span style="color:var(--text-dim);">Warehouse: <strong style="color:var(--text-primary);">${f.qty}</strong></span>`,l.qty>0&&(e+=`<span style="color:var(--text-dim);margin-left:8px;">Allocated: <strong style="color:var(--text-primary);">${l.qty}</strong></span>`),e+="</div>",e+='<div style="display:flex;gap:4px;">',f.qty>0&&c>0){const g=Math.min(f.qty,c);e+=`<button class="pm-alloc-btn" onclick="pmAllocateMaterial('${t.key}','${p}',${g})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Allocate ${g}</button>`}v>0&&(e+=`<button class="pm-alloc-btn" onclick="pmDeallocateMaterial('${t.key}','${p}',${v})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Return ${v}</button>`),e+="</div></div>"}e+="</div>"}return e}function Da(o){if(o.equipment.length===0)return'<div class="pm-evt-empty">No equipment required for this project.</div>';let e='<div class="pm-tab-header">Project Equipment</div>';for(const t of o.equipment){const i=t.condition>=75?"var(--green)":t.condition>=50?"var(--amber)":t.condition>=25?"var(--orange)":"var(--red)",n=t.assignedToProject>=t.required,a=t.assignedToProject>0&&t.assignedToProject<t.required,s=n?"var(--green)":a||t.ownedTotal>0?"var(--amber)":"var(--red)",r=n?`${t.assignedToProject}/${t.required} DEPLOYED`:a?`${t.assignedToProject}/${t.required} PARTIAL`:t.ownedTotal>0?"NOT DEPLOYED":"NOT OWNED";e+=`<div class="pm-eq" style="margin-bottom:12px;">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${b(t.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${s};margin-left:8px;">${r}</span>
                </div>
            </div>`,t.assignedToProject>0&&(e+=`<div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${t.condition}%;background:${i}"></div></div>
                <span class="pm-eq__cond-val" style="color:${i}">${t.condition}%</span>
            </div>`);const c=Math.min(t.available,t.required-t.assignedToProject);e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:0.7rem;">',e+=`<span style="color:var(--text-dim);">Required: <strong style="color:${n?"var(--green)":"var(--red)"}">${t.required}</strong>`,e+=` · Owned: <strong style="color:var(--text-primary);">${t.ownedTotal}</strong>`,e+=` · Available: <strong style="color:var(--text-primary);">${t.available}</strong></span>`,e+='<div style="display:flex;gap:4px;">',c>0&&(e+=`<button onclick="pmDeployEquipment('${t.key}',${c})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Deploy ${c}</button>`),t.assignedToProject>0&&(e+=`<button onclick="pmUndeployEquipment('${t.key}')" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Undeploy</button>`),e+="</div></div>",e+="</div>"}return e}function De(o){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][o%12]}, ${2e3+Math.floor(o/12)}`}async function ja(o,e){if(!d||!z)return;const t=prompt(`REQUEST CONSTRUCTION INSURANCE
`+"─".repeat(35)+`

Describe what this policy should cover:

e.g., "Full coverage for weather delays, material damage, and labor disputes during construction. Should cover cost overruns up to 20% of budget."

Insurance corps will see this in their Deal Flow.`);if(t===null)return;const i=t.trim()||"Construction Insurance",n=z.current_tick||0,{error:a}=await y.from("finance_loan_requests").insert({requesting_faction_id:d.id,nation_id:d.nation_id,request_type:"insurance",insured_contract_id:o,amount:e,term_months:0,purpose:i,status:"open",created_tick:n,expires_tick:n+12});if(a){a.message.includes("duplicate")||a.message.includes("unique")?alert("Insurance already requested for this project."):alert("Failed to request insurance: "+a.message);return}alert("Insurance request posted to Deal Flow. Insurance corporations can now offer coverage."),await pi()}window.requestInsurance=ja;window.openProjectModal=et;window.closeProjectModal=Na;window.pmSetTab=Ra;window.pmToggleEvent=La;window.pmSelectResponse=qa;window.pmAllocateMaterial=Sa;window.pmDeallocateMaterial=Ta;window.pmDeployEquipment=Ma;window.pmUndeployEquipment=Aa;window.pmAssignWorkers=za;window.pmUnassignWorkers=Ia;async function ci(o){if(!L)return;const{data:e,error:t}=await y.from("construction_events").select("*").eq("contract_id",o).order("fired_at_tick",{ascending:!1});t?(console.warn("Failed to load project events:",t.message),L.events=[]):L.events=(e||[]).map(i=>({id:i.id,type:i.type,severity:i.severity,tick:i.fired_at_tick,title:i.title,desc:i.description,impact:i.impact,status:i.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:i.resolution,responses:i.responses||[]})),Qe()}let Bo=!1;async function Fa(o,e){if(!(Bo||!L)){Bo=!0;try{const{data:t,error:i}=await y.rpc("resolve_construction_event",{p_event_id:o,p_response_key:e});if(i){console.error("Failed to resolve event:",i.message),alert("Failed to submit response: "+i.message);return}const n=typeof t=="string"?JSON.parse(t):t;if(n?.error){alert("Error: "+n.error);return}await ci(L.project.id),await pi(),n?.quality_applied&&n.quality_applied!==0&&(L.quality=Math.max(0,Math.min(100,L.quality+n.quality_applied)),L.qualityLabel=L.quality>=80?"STRONG":L.quality>=60?"PROMISING":L.quality>=40?"FAIR":"UNCERTAIN"),Qe()}finally{Bo=!1}}}window.confirmEventResponse=Fa;function Re(o,e,t){const i=t?` style="color:${t}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${b(o)}</span>
        <span class="cd-detail-row__value"${i}>${b(e)}</span>
    </div>`}function Ua(o){const e={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},t=o.drawing_number||o.contract_number+"-A1",i=z?.current_date||"",n=i?i.replace(/,\s*/," "):"",a=o.spec_category==="Heavy Infrastructure",s=o.spec_category==="Megaproject";let r=b(o.project_subtype||o.project_type||"STRUCTURE"),c=a?"80.0m":s?"200.0m":"60.0m",p=a?"40.0m":s?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${e.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(f,l)=>`<line x1="${l*20}" y1="0" x2="${l*20}" y2="200" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(f,l)=>`<line x1="0" y1="${l*20}" x2="680" y2="${l*20}" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${e.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${e.accent}" font-family="var(--font-mono)" font-weight="700">${r.toUpperCase()}</text>
        <text x="340" y="100" text-anchor="middle" font-size="6" fill="${e.text}" font-family="var(--font-mono)">${b(o.name)}</text>

        <!-- Internal divisions -->
        <line x1="200" y1="30" x2="200" y2="150" stroke="${e.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="340" y1="30" x2="340" y2="150" stroke="${e.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="480" y1="30" x2="480" y2="150" stroke="${e.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="60" y1="90" x2="620" y2="90" stroke="${e.line}" stroke-width="0.4" stroke-dasharray="4,2"/>

        <!-- Dimension: top -->
        <line x1="60" y1="20" x2="620" y2="20" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="60" y1="17" x2="60" y2="23" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="620" y1="17" x2="620" y2="23" stroke="${e.dim}" stroke-width="0.5"/>
        <text x="340" y="17" text-anchor="middle" font-size="5.5" fill="${e.dim}" font-family="var(--font-mono)">${c}</text>

        <!-- Dimension: right -->
        <line x1="630" y1="30" x2="630" y2="150" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="627" y1="30" x2="633" y2="30" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="627" y1="150" x2="633" y2="150" stroke="${e.dim}" stroke-width="0.5"/>
        <text x="645" y="93" text-anchor="middle" font-size="5.5" fill="${e.dim}" font-family="var(--font-mono)" transform="rotate(90,645,93)">${p}</text>

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
        <text x="630" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${b(n)}</text>

        <!-- North arrow -->
        <g transform="translate(470,172)">
            <line x1="0" y1="12" x2="0" y2="0" stroke="${e.accent}" stroke-width="0.8"/>
            <polygon points="-3,4 0,0 3,4" fill="${e.accent}"/>
            <text x="0" y="-3" text-anchor="middle" font-size="5" fill="${e.text}" font-family="var(--font-mono)">N</text>
        </g>
    </svg>`}async function Ke(){if(!d||!d.nation_id)return;const{data:o,error:e}=await y.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(e)console.warn("Failed to load contracts:",e.message),it=[];else{const t=Number(d.corp_reputation??0);it=(o||[]).filter(i=>t>=(i.min_reputation||0))}if(gt={},d&&it.length>0){const t=it.map(n=>n.id),{data:i}=await y.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",d.id).in("contract_id",t);for(const n of i||[])gt[n.contract_id]=n}li()}function Ha(){const o=document.getElementById("ap-list"),e=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=K.length+" ACTIVE",K.length===0){o.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,e.style.display="none";return}const t=z?.current_tick||0;let i=0,n=0,a="";for(const s of K){const r=s.issuer_type==="GOVERNMENT",c=r?"gov":"private",p=Array.isArray(s.contract_bids)?s.contract_bids[0]:s.contract_bids,f=p?.bid_price||0,l=p?.estimated_cost||0,v=p?.estimated_quality||0,m=s.budget_ceiling||0,u=s.awarded_at_tick||t,g=s.stalled_ticks||0,_=Math.max(0,t-u),$=Math.max(0,_-g),h=s.timeline_ticks||8,k=Math.max(0,h-$),I=Math.min(100,Math.round($/h*100)),E=$>h,S=g>0;let C="";if(S){const w=s.required_workforce||{},N=s.workers_assigned||{},R=[];(Number(N.general)||0)<(Number(w.general)||0)&&R.push("General: "+(Number(N.general)||0)+"/"+(Number(w.general)||0)),(Number(N.skilled)||0)<(Number(w.skilled)||0)&&R.push("Skilled: "+(Number(N.skilled)||0)+"/"+(Number(w.skilled)||0)),(Number(N.innovative)||0)<(Number(w.innovative)||0)&&R.push("Innovative: "+(Number(N.innovative)||0)+"/"+(Number(w.innovative)||0)),R.length>0?C="Workers needed — "+R.join(", "):C="Materials needed — allocate from warehouse"}si(s.sector);const q=hn(s.sector);i+=m,n+=f,a+=`<div class="ap-item" onclick="openProjectModal('${s.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${b(s.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${b(s.issuer_name||"—")} · ${q}</div>
                </div>
                <span class="oc-item__type-badge ${c}">${r?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS${S?' <span style="color:var(--orange);font-weight:700;font-size:7px;">⚠ STALLED ('+g+" ticks) — "+b(C)+"</span>":""}</span>
                    <span class="ap-budget__values" style="color:${E?"var(--red)":S?"var(--orange)":"var(--teal)"}">
                        ${$}/${h} ticks ${E?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${I}%;background:${E?"var(--red)":S?"var(--orange)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${fe(f)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${fe(l)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${v>=70?"var(--green)":v>=40?"var(--teal)":"var(--orange)"}">${v}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${E?"var(--red)":"var(--text-bright)"}">${k} ticks</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">INSURANCE</div>
                    ${s._hasInsurance?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--green);">INSURED</div>':s._insurancePending?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--orange);">PENDING</div>':`<div class="ap-detail-cell__value" style="font-size:8px;cursor:pointer;color:#aa7a5a;font-weight:700;text-decoration:underline;" onclick="event.stopPropagation();requestInsurance('${s.id}',${m})">INSURE</div>`}
                </div>
            </div>
        </div>`}o.innerHTML=a,e.style.display=K.length>0?"":"none",K.length>0&&(document.getElementById("ap-total-crew").textContent=K.length,document.getElementById("ap-total-budget").textContent=fe(i),document.getElementById("ap-total-spent").textContent=fe(n))}async function pi(){if(!d)return;const{data:o,error:e}=await y.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",d.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",d.id).order("awarded_at_tick",{ascending:!0});if(e?(console.warn("Failed to load active projects:",e.message),K=[]):K=o||[],K.length>0){const t=K.map(r=>r.id),{data:i}=await y.from("finance_loan_requests").select("insured_contract_id, status").eq("request_type","insurance").in("insured_contract_id",t),{data:n}=await y.from("finance_active_loans").select("request_id, finance_loan_requests!inner(insured_contract_id)").in("status",["current"]).eq("finance_loan_requests.request_type","insurance"),a=new Set((n||[]).map(r=>r.finance_loan_requests?.insured_contract_id).filter(Boolean)),s=new Set((i||[]).filter(r=>r.status==="open").map(r=>r.insured_contract_id));for(const r of K)r._hasInsurance=a.has(r.id),r._insurancePending=s.has(r.id)}Ha()}const bo=3e4;function _o(){let o=0,e=0;for(const t of Nt)for(const i of xn){const n=X[t.key]?.[i];n&&(o+=n.qty,e+=n.value)}return{totalUnits:o,totalValue:e}}function $n(){const o=document.getElementById("wh-list"),{totalUnits:e,totalValue:t}=_o();document.getElementById("wh-count").textContent=e.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=P(t);const i=Math.round(e/bo*100),n=document.getElementById("wh-capacity");n.textContent=i+"%",n.style.color=i>80?"var(--red)":i>50?"var(--orange)":"var(--green)";let a="";for(let s=0;s<Nt.length;s++){const r=Nt[s],c=sn===s,p=X[r.key]?.LOW||{qty:0,value:0},f=X[r.key]?.STD||{qty:0,value:0},l=X[r.key]?.HIGH||{qty:0,value:0},v=p.qty+f.qty+l.qty,m=p.value+f.value+l.value,u=v===0,g=He(r.key,"LOW",T),_=He(r.key,"STD",T),$=He(r.key,"HIGH",T),h=p.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",k=f.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",I=$.available?l.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(a+='<div class="wh-row">',a+=`<div class="wh-row__collapsed${c?" expanded":""}" onclick="toggleWhRow(${s})">
            <span class="wh-row__arrow">${c?"▾":"▸"}</span>
            <span class="wh-row__name${u?" empty":""}">${b(r.name)}</span>
            <div class="wh-row__dots">
                <div class="${h}"></div>
                <div class="${k}"></div>
                <div class="${I}"></div>
            </div>
            <span class="wh-row__qty${u?" empty":""}">${v>0?v.toLocaleString():"—"}</span>
            <span class="wh-row__val${u?" empty":""}">${m>0?P(m):"—"}</span>
        </div>`,c){a+='<div class="wh-expand">',a+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const E=[{key:"LOW",label:"Low",data:p,avail:g,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:f,avail:_,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:l,avail:$,color:"var(--green)",dotClass:"wh-dot--high"}];for(const S of E){const C=!S.avail.available,q=S.data.qty>0,w=q?"$"+Math.round(S.data.value/S.data.qty):"—";a+=`<div class="wh-grade${C?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${S.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${C?"var(--red)":S.color}">${S.label}</span>
                        ${C?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${q?"var(--text-bright)":"var(--text-dim)"}">${q?S.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${S.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${S.data.value>0?P(S.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${w}</span>
                </div>`}for(const S of E)!S.avail.available&&S.avail.failedStat&&(a+=`<div class="wh-lock">
                        <span class="wh-lock__text">${S.label.toUpperCase()} GRADE LOCKED — ${b(S.avail.failedStat)} &lt; ${S.avail.failedMin}</span>
                    </div>`);a+="</div>"}a+="</div>"}o.innerHTML=a}function Ga(o){sn=sn===o?-1:o,$n()}async function fi(){if(!d)return;const{data:o,error:e}=await y.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",d.id);X={};const t=[];if(e)console.warn("Failed to load warehouse:",e.message);else if(o){for(const i of o){const n=ao(i.material_key);X[n]||(X[n]={}),X[n][i.quality_tier]={qty:i.quantity||0,value:Number(i.total_value)||0},n!==i.material_key&&t.push(i)}if(t.length>0){const i=t.map(n=>({faction_id:d.id,nation_id:d.nation_id,material_key:ao(n.material_key),quality_tier:n.quality_tier,quantity:n.quantity||0,total_value:Number(n.total_value)||0,updated_at:new Date().toISOString()}));await y.from("corp_warehouse").upsert(i,{onConflict:"faction_id,material_key,quality_tier"});for(const n of t)await y.from("corp_warehouse").delete().eq("faction_id",d.id).eq("material_key",n.material_key).eq("quality_tier",n.quality_tier)}}$n()}const Va={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function Wa(){const o=(T?.name||d?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+o;const e=Number(d?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=P(e);const{totalUnits:t}=_o(),i=Math.round(t/bo*100),n=document.getElementById("pr-wh-capacity");n.textContent=i+"%",n.style.color=i>80?"var(--red)":i>50?"var(--orange)":"var(--green)",mi(),wn(),ho()}function mi(){const o=document.getElementById("pr-mat-grid");let e="";for(const t of Nt){const i=de===t.key,n=xn.every(s=>!He(t.key,s,T).available),a="pr-mat-btn"+(i?" active":"")+(n?" all-locked":"");e+=`<span class="${a}" onclick="setPrMat('${t.key}')">${b(t.name)}</span>`}o.innerHTML=e}function wn(){const o=document.getElementById("pr-tier-bar");let e='<span class="pr-tier-label">GRADE</span>';for(const t of xn){const i=He(de,t,T),n=J===t,a=i.available?bn(de,t,T):null,s=ti[t],r=!i.available,c="pr-tier-btn"+(n?" active":"")+(r?" locked":"");e+=`<div class="${c}" onclick="${r?"":`setPrTier('${t}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${s};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${n?"var(--text-bright)":"var(--text-dim)"}">${nn[t]}</span>
            </div>
            ${a!==null?`<div class="pr-tier-btn__price" style="color:${n?"var(--text-bright)":"var(--text-muted)"}">$${a}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}o.innerHTML=e}function ho(){const o=document.getElementById("pr-content"),e=He(de,J,T),t=Nt.find(E=>E.key===de);if(!t)return;if(!e.available){o.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${b(t.name)} — ${nn[J]} grade
                    is not produced domestically in ${b(T?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${b(e.failedStat||"unknown")} &lt; ${e.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const i=bn(de,J,T),n=ei(de,J,T),a=i*xe,s=n>3e3?"LOW":n>1e3?"MODERATE":"HIGH",r=s==="LOW"?"var(--green)":s==="MODERATE"?"var(--amber)":"var(--red)",c=Number(T?.inflation??50),p=c>55?"up":c<45?"down":"flat",f=p==="up"?"&#9650;":p==="down"?"&#9660;":"&#8212;",l=p==="up"?"var(--red)":p==="down"?"var(--green)":"var(--text-dim)";let v="";v+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${i}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${l}">${f}</span>
                </div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">SUPPLY/TICK</div>
                <div class="pr-market-cell__value" style="font-size:14px;color:var(--text-bright);margin-top:2px;">${n.toLocaleString()}</div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">DEMAND</div>
                <div class="pr-market-cell__value" style="font-size:12px;color:${r};margin-top:2px;">${s}</div>
            </div>
        </div>
    </div>`,v+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${b(T?.name||"—")})</div>`;for(const E of t.priceDrivers){const S=Number(T?.[E]??50),C=S>=50?"var(--green)":S>=30?"var(--amber)":S>=15?"var(--orange)":"var(--red)",q=Va[E]||E;v+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${b(E)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${S}%;background:${C}"></div>
            </div>
            <span class="pr-driver-row__val">${S}</span>
            <span class="pr-driver-row__effect">${b(q)}</span>
        </div>`}v+="</div>";const u=(Number(d?.corp_cash_reserves)||0)>=a,g=xe>n,{totalUnits:_}=_o(),$=bo-_,h=xe>$,k=$<=0,I=ti[J];v+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${b(t.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${I};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${I}">${nn[J]}</span>
                </div>
                <span class="pr-order__mat-price">$${i}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(E=>`<span class="pr-qty-btn${xe===E?" active":""}" onclick="setPrQty(${E})">${E>=1e3?E/1e3+"k":E}</span>`).join("")}
                </div>
            </div>
            ${g?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${n.toLocaleString()} this tick</span>
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
                    ${u&&!g&&!h&&!k?"":"disabled"}
                    title="${u?g?"Exceeds supply":k?"Warehouse full":h?"Exceeds warehouse capacity":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,o.innerHTML=v}function Ya(o){de=o,J="STD";for(const e of["STD","HIGH","LOW"])if(He(o,e,T).available){J=e;break}mi(),wn(),ho()}function Qa(o){J=o,wn(),ho()}function Ka(o){xe=o,ho()}let Po=!1;async function Ja(){if(Po||!d||!T)return;const o=bn(de,J,T),e=ei(de,J,T),t=o*xe,i=Number(d.corp_cash_reserves)||0;if(t>i){alert("Insufficient cash reserves.");return}if(xe>e){alert("Exceeds available supply this tick.");return}const{totalUnits:n}=_o(),a=bo-n;if(a<=0){alert("Warehouse is full. Cannot purchase more materials.");return}if(xe>a){alert(`Warehouse can only hold ${a.toLocaleString()} more units. Reduce quantity.`);return}Po=!0;const s=document.querySelector(".pr-purchase-btn");s&&(s.disabled=!0,s.textContent="...");try{const r=i-t,{error:c}=await y.from("factions").update({corp_cash_reserves:r}).eq("id",d.id);if(c)throw c;const p=ao(de),f=X[p]?.[J],l=(f?.qty||0)+xe,v=(f?.value||0)+t,{error:m}=await y.from("corp_warehouse").upsert({faction_id:d.id,nation_id:d.nation_id,material_key:p,quality_tier:J,quantity:l,total_value:v,last_purchased_tick:z?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(m){const{error:u}=await y.from("factions").update({corp_cash_reserves:i}).eq("id",d.id);throw u&&console.error("Cash refund failed after warehouse error:",u.message),m}d.corp_cash_reserves=r,X[p]||(X[p]={}),X[p][J]={qty:l,value:v},$n(),Wa(),s&&(s.textContent="PURCHASED",setTimeout(()=>{s.isConnected&&(s.disabled=!1,s.textContent="PURCHASE")},1500))}catch(r){s&&(s.disabled=!1,s.textContent="PURCHASE"),alert("Purchase failed: "+(r.message||"Unknown error"))}finally{Po=!1}}function ui(o){const e=Ge||T;if(!e)return[];const t=xo(o);if(!t)return[];const i=xa(o,e),n=[],a=Number(e?.inflation??50),s=Number(e?.fuel_prices??50);Number(e?.manufacturing_output??50);const r=Ge&&T&&Ge.id!==T.id;let c=null;if(r&&(c=ba(e,T)),i.newAvailable>0){const p=Yn(o,e),f=t.basePrice,l=Math.round(f*((a-50)/200)),v=Math.round(f*((s-50)/300));let m=p;const u=[{label:"Base price",value:P(f)},l!==0?{label:`Inflation (${a})`,mod:(l>=0?"+":"")+P(Math.abs(l))}:null,v!==0?{label:`Fuel transport (${s})`,mod:(v>=0?"+":"")+P(Math.abs(v))}:null].filter(Boolean),g=p-f-l-v;if(g!==0&&!r&&u.push({label:"Demand/scarcity",mod:(g>=0?"+":"")+P(Math.abs(g))}),r&&c){const _=Math.round(p*c.tariff),$=Math.round(p*c.transport);m=p+_+$,u.push({label:`Import tariff (${Math.round(c.tariff*100)}%)`,mod:"+"+P(_)}),u.push({label:`Transport (${c.deliveryTicks} tick${c.deliveryTicks>1?"s":""})`,mod:"+"+P($)})}n.push({seller:r?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:r?c?.deliveryTicks||1:0,condition:100,price:Math.round(m),available:i.newAvailable,delivery:r?c.deliveryTicks+" tick"+(c.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:r?c.deliveryTicks:0,used:!1,priceFactors:u,sourceNationId:e.id})}if(i.usedAvailable>0){const p=i.usedCondition,f=Yn(o,e,{used:!0,condition:p});let l=f;const v=[{label:"Base price",value:P(t.basePrice)},{label:`Condition (${p}%)`,mod:"-"+P(Math.max(0,t.basePrice-f))}];if(r&&c){const m=Math.round(f*c.tariff),u=Math.round(f*c.transport);l=f+m+u,v.push({label:`Import tariff (${Math.round(c.tariff*100)}%)`,mod:"+"+P(m)}),v.push({label:`Transport (${c.deliveryTicks} tick${c.deliveryTicks>1?"s":""})`,mod:"+"+P(u)})}n.push({seller:r?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:r?c?.deliveryTicks||1:0,condition:p,price:Math.round(l),available:i.usedAvailable,delivery:r?c.deliveryTicks+" tick"+(c.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:r?c.deliveryTicks:0,used:!0,priceFactors:v,sourceNationId:e.id})}return n}function kn(){const o=Number(d?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=P(o);const e=xo(pe),t=Rt[e?.tier||1],i=document.getElementById("em-tier-badge");i&&(i.textContent=t.tag,i.style.color=t.color),i.style.background=t.color+"0a",i.style.border="1px solid "+t.color+"33";const n=document.getElementById("em-nation-select");if(n&&n.options.length===0){const r=T?.name||d?.nation||"—";let c=`<option value="">${b(r)} (HQ)</option>`;for(const p of ii)p.id!==T?.id&&(c+=`<option value="${p.id}">${b(p.name)}</option>`);n.innerHTML=c}const a=document.getElementById("em-import-tag"),s=Ge&&T&&Ge.id!==T.id;a&&(a.style.display=s?"":"none"),Xa(),En()}function Xa(){let o="";for(let e=1;e<=3;e++){const t=Rt[e],i=an(e),n=e===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";o+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${t.color}">${t.tag}</div>
            <div class="${n}">`;for(const a of i){const s=pe===a.key,r=ui(a.key).length>0;o+=`<span class="em-selector__btn${s?" active":""}${r?"":" no-listings"}"
                style="${s?"background:"+t.color+";border-color:"+t.color:""}"
                onclick="setEmType('${a.key}')">${b(a.name)}</span>`}o+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${o}</div>`}function En(){const o=document.getElementById("em-content");if(Le=ui(pe),Le.length===0){o.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}we>=Le.length&&(we=0);let e="";for(let i=0;i<Le.length;i++){const n=Le[i],a=we===i,s=n.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",r=oi(n.condition);e+=`<div class="em-listing${a?" selected":""}" style="${a?"border-left-color:"+s:""}" onclick="setEmListing(${i})">`,e+=`<div class="em-listing__row1">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="em-listing__seller">${b(n.seller)}</span>
                <span class="em-badge em-badge--${n.sellerType.toLowerCase()}">${n.sellerType}</span>
                ${n.used?'<span class="em-badge em-badge--used">USED</span>':""}
            </div>
        </div>`,e+=`<div class="em-listing__row2">
            <span class="em-listing__nation">${b((n.nation||"").toUpperCase())}</span>
            ${n.distance>0?`<span class="em-listing__distance">${n.distance} nation${n.distance>1?"s":""} away</span>`:""}
            <span class="em-listing__delivery">Delivery: ${b(n.delivery)}</span>
        </div>`,e+=`<div class="em-listing__stats">
            <div class="em-stat-cell" style="flex:1">
                <div class="em-stat-cell__label">COND.</div>
                <div class="em-stat-cell__bar">
                    <div class="em-stat-cell__bar-track"><div class="em-stat-cell__bar-fill" style="width:${n.condition}%;background:${r}"></div></div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${r}">${n.condition}%</span>
                </div>
            </div>
            <div class="em-stat-cell" style="flex:0.8;text-align:center">
                <div class="em-stat-cell__label">AVAIL.</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${n.available}</div>
            </div>
            <div class="em-stat-cell" style="flex:1.2">
                <div class="em-stat-cell__label">PRICE/UNIT</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${P(n.price)}</div>
            </div>
        </div>`,a&&n.priceFactors&&(e+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${n.priceFactors.map(c=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${b(c.label)}</span>
                    <span class="em-breakdown__mod" style="color:${c.mod?c.mod.startsWith("-")?"var(--green)":c.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${c.mod||c.value}</span>
                </div>`).join("")}
            </div>`),e+="</div>"}const t=Le[we];if(t){const i=xo(pe),n=Rt[i?.tier||1],a=Math.min(t.available,4),s=t.price*Ee,r=(Number(d?.corp_cash_reserves)||0)>=s;e+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${b(i?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${b(t.seller)}</span>
                </div>
                <span class="em-purchase__price">${P(t.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:a},(c,p)=>p+1).map(c=>`<span class="em-qty-btn${Ee===c?" active":""}" style="${Ee===c?"background:"+n.color+";border-color:"+n.color:""}" onclick="setEmQty(${c})">${c}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${t.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${P(s)}</div>
                    ${t.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${b(t.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${n.color}" onclick="purchaseEquipment()"
                    ${r?"":"disabled"}
                    title="${r?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}o.innerHTML=e}async function Za(o){if(!o)Ge=null;else{let t=ii.find(i=>i.id===o);if(!t)try{const{data:i}=await y.from("nations").select("*").eq("id",o).single();t=i}catch{}Ge=t||null}we=0,Ee=1;const e=document.getElementById("em-nation-select");e&&(e.value=o||""),kn()}function es(o){pe=o,we=0,Ee=1,kn()}function ts(o){we=o,Ee=1,En()}function os(o){Ee=o,En()}let Do=!1;async function ns(){if(Do)return;const o=Le[we];if(!o||!d)return;const e=xo(pe);if(!e)return;const t=Ee,i=o.price*t,n=Number(d.corp_cash_reserves)||0;if(i>n){alert("Insufficient cash reserves.");return}if(t>o.available){alert("Not enough units available.");return}const a=document.querySelector(".em-purchase-btn");a&&(a.disabled=!0,a.textContent="..."),Do=!0;try{const s=n-i,{error:r}=await y.from("factions").update({corp_cash_reserves:s}).eq("id",d.id);if(r)throw r;const c=!o.deliveryTicks||o.deliveryTicks===0;if(c){const f=ne.find(k=>k.equipment_key===pe),l=(f?.owned||0)+t,v=f?.purchase_price_avg||0,m=f?.owned||0,u=m>0?Math.round((v*m+o.price*t)/l):o.price,g=e.maintenancePerUnit*l,_=f?.condition||100,$=Math.round((_*m+o.condition*t)/l),{error:h}=await y.from("corp_equipment").upsert({faction_id:d.id,nation_id:d.nation_id,equipment_key:pe,tier:e.tier,owned:l,deployed:f?.deployed||0,condition:$,maintenance_per_tick:g,purchase_price_avg:u,last_purchased_tick:z?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(h){const{error:k}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",d.id);throw k&&console.error("Cash refund failed:",k.message),h}f?(f.owned=l,f.condition=$,f.maintenance_per_tick=g):ne.push({equipment_key:pe,tier:e.tier,owned:l,deployed:0,condition:$,maintenance_per_tick:g,assigned_projects:[]})}else{const f=(z?.current_tick||0)+o.deliveryTicks,{error:l}=await y.from("corp_equipment_deliveries").insert({faction_id:d.id,equipment_key:pe,quantity:t,condition:o.condition,delivery_tick:f,source_nation_id:o.sourceNationId||null,seller_name:o.seller,price_paid:i});if(l){const{error:v}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",d.id);throw v&&console.error("Cash refund failed:",v.message),l}}d.corp_cash_reserves=s,In(),kn();const p=document.getElementById("pr-cash");p&&(p.textContent=P(s)),a&&(a.textContent=c?"PURCHASED":"ORDERED",setTimeout(()=>{a.isConnected&&(a.disabled=!1,a.textContent="PURCHASE")},1500))}catch(s){a&&(a.disabled=!1,a.textContent="PURCHASE"),alert("Purchase failed: "+(s.message||"Unknown error"))}finally{Do=!1}}let is=-1,at=[],lo=[],pn=[];function jo(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o.toLocaleString()}function as(o,e,t){if(t)return"var(--orange)";const i=o/(e||1)*100;return i>50?"var(--green)":i>25?"var(--amber)":"var(--red)"}function Xn(){const o=document.getElementById("pm-list"),e=at.length,t=lo.length,i=pn.length,n=at.filter(c=>c.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${e})`,document.getElementById("pm-pending-count").textContent=`(${t})`,document.getElementById("pm-apply-count").textContent=`(${i})`;const a=document.getElementById("pm-badges");let s="";n>0&&(s+=`<span class="pm-badge pm-badge--expiring">${n} EXPIRING</span>`),t>0&&(s+=`<span class="pm-badge pm-badge--pending">${t} PENDING</span>`),a.innerHTML=s;const r=at.reduce((c,p)=>c+(p.cost||0),0)+lo.reduce((c,p)=>c+(p.cost||0),0);document.getElementById("pm-total-cost").textContent=jo(r),document.getElementById("pm-footer-active").textContent=e,document.getElementById("pm-footer-pending").textContent=t;{if(e===0){o.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let c="";at.forEach((p,f)=>{const l=is===f,v=as(p.ticks_left,p.total_ticks,p.expiring_soon),m=Math.min(p.ticks_left/(p.total_ticks||1)*100,100);c+=`<div class="pm-item ${p.expiring_soon?"pm-item--expiring":""} ${l?"expanded":""}" onclick="togglePmExpand(${f})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${b(p.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${b((p.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${v}">Expires: ${b(p.expires||"")}</span>
                        <span class="pm-item__ticks">(${p.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${m}%;background:${v}"></div></div>`,l&&(c+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${b(p.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${b(p.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${jo(p.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${p.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${p.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(p.projects||[]).map(u=>`<span class="pm-project-chip">${b(u)}</span>`).join("")}</div>
                    </div>`,p.note&&(c+=`<div class="pm-note"><span class="pm-note__text">${b(p.note)}</span></div>`),p.expiring_soon&&p.renewable&&(c+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew" onclick="event.stopPropagation(); pmApplyForPermit('${p.permit_key}');">RENEW — ${jo(p.cost||0)}</button></div>`),c+="</div>"),c+="</div></div>"}),o.innerHTML=c;return}}let Fo=!1;async function ss(o){if(!(Fo||!d||!T)){Fo=!0;try{const{data:e}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{data:i,error:n}=await y.rpc("apply_for_permit",{p_faction_id:d.id,p_nation_id:T.id,p_permit_key:o,p_current_tick:t});if(n){alert("Application failed: "+n.message);return}if(i&&!i.success){alert(i.error||"Application failed");return}alert("Permit application submitted! Processing: "+(i.processing_ticks||0)+" ticks."),await rs()}catch(e){alert("Error: "+e.message)}finally{Fo=!1}}}window.pmApplyForPermit=ss;async function rs(){if(!d||!T){at=[],lo=[],pn=[],Xn();return}const{data:o}=await y.from("construction_permits").select("*"),e=o||[],t={};for(const l of e)t[l.permit_key]=l;const{data:i}=await y.from("corp_permits").select("*").eq("faction_id",d.id).eq("nation_id",T.id),n=i||[],{data:a}=await y.from("active_laws").select("policy_id, policies(permit_key, policy_name)").eq("nation_id",T.id).not("policies.permit_key","is",null),s=new Set,r={};for(const l of a||[])l.policies?.permit_key&&(s.add(l.policies.permit_key),r[l.policies.permit_key]=l.policies.policy_name);const{data:c}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),p=c?.current_tick||0;at=n.filter(l=>l.status==="active").map(l=>{const v=t[l.permit_key]||{},m=l.expires_at_tick?Math.max(0,l.expires_at_tick-p):999,u=v.duration_ticks||24;return{name:v.name||l.permit_key,permit_key:l.permit_key,nation:T.name,policy:r[l.permit_key]||"—",issued:l.granted_at_tick!=null?De(l.granted_at_tick):"—",expires:l.expires_at_tick?De(l.expires_at_tick):"Single-use",cost:l.cost_paid||0,ticks_left:m,total_ticks:u,expiring_soon:m<=3&&m>0,renewable:v.duration_ticks!=null,projects:[]}}),lo=n.filter(l=>l.status==="pending").map(l=>{const v=t[l.permit_key]||{},m=v.processing_ticks||2,u=p-l.applied_at_tick,g=Math.max(0,m-u);return{name:v.name||l.permit_key,permit_key:l.permit_key,nation:T.name,applied:De(l.applied_at_tick),status:"PROCESSING",processing_total:m,ticks_remaining:g,est_approval:De(l.applied_at_tick+m),cost:l.cost_paid||0,required_by:r[l.permit_key]||"—"}});const f=new Set(n.filter(l=>l.status==="active"||l.status==="pending").map(l=>l.permit_key));pn=[...s].filter(l=>!f.has(l)).map(l=>{const v=t[l]||{};return{name:v.name||l,permit_key:l,nation:T.name,description:v.description||"",policy:r[l]||"—",cost:v.cost_is_percentage?15e4:v.cost||0,processing_time:v.processing_ticks||2,duration:v.duration_ticks?v.duration_ticks+" ticks":"Single-use",category:v.category||"",difficulty:v.difficulty||"EASY"}}),Xn()}let pt=!1,Uo=!1;function vi(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+Math.round(o/1e3)+"k":"$"+Math.round(o)}async function Cn(){var{data:o,error:e}=await y.from("factions").select("*").eq("id",d.id).single();if(e){console.warn("Faction refresh failed:",e.message);return}o&&(d=o);var t=document.getElementById("topbar-cash");t&&(t.textContent="CASH: "+vi(Number(d.corp_cash_reserves??0)))}const fn={CRITICAL:"#c55",HIGH:"#5c5",MODERATE:"#ca5",LOW:"#6a6660"};let ft=[],Sn=[],yi="ready",St=null,co="ALL",Z=-1;const Zn={COASTAL:{color:"#8b9a6b",label:"COASTAL"},INTERNATIONAL:{color:"#5a8aaa",label:"INTL"},GOVERNMENT:{color:"#c8a832",label:"GOV CONTRACT"}};function ls(o){co=o,Z=-1,document.querySelectorAll(".ar-pill").forEach(e=>{const t=e.getAttribute("data-ar-filter");e.className="ar-pill"+(t===o?" active-"+(o==="ALL"?"all":o==="COASTAL"?"coastal":o==="INTERNATIONAL"?"intl":"gov"):"")}),zn()}function Tn(){return co==="ALL"?ft:ft.filter(o=>o.scope===co)}async function $o(){if(!d||d.corp_sector!=="Shipping")return;const o=await ua(y,d.id,d.corp_subsector);ft=o.routes,Sn=o.applications,yi=o.state,St=o.error,St&&console.warn("Failed to load available routes:",St.message),Z=-1,zn()}var ds={fuel_energy:[{stat:"industrialization",label:"Industrialization"},{stat:"urbanization",label:"Urbanization"}],minerals:[{stat:"industrialization",label:"Industrialization"},{stat:"manufacturing",label:"Manufacturing"}],grains_staples:[{stat:"population_growth",label:"Population Growth"},{stat:"food_security",label:"Food Security"}],livestock_dairy:[{stat:"standard_of_living",label:"Std of Living"},{stat:"food_security",label:"Food Security"}],cash_crops:[{stat:"trade_balance",label:"Trade Balance"},{stat:"foreign_investment",label:"Foreign Investment"}],manufactured_goods:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],technology:[{stat:"technology",label:"Technology"},{stat:"higher_education",label:"Higher Education"}],fruits_vegetables:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],arms:[{stat:"military_spending",label:"Military Spending"},{stat:"stability",label:"Stability"}]};function cs(o){return ds[o]||[]}function ps(o){var e=Number(o.competition_count||0),t=o.demand_level||"",i=o.scope==="GOVERNMENT";return i?"Fixed payment. No demand risk. Vessel locked for contract duration.":e===0&&t==="CRITICAL"?"Unserved critical corridor. High volume, no competition — claim immediately.":e===0&&t==="HIGH"?"Virgin route with strong demand. First-mover advantage available.":e===0?"No competition on this route. Market share starts at 100%.":t==="CRITICAL"&&e<=2?"Underserved critical route. Demand exceeds current capacity.":t==="LOW"?"Thin route. Revenue may not justify vessel deployment.":e>=3?"Crowded route. Market share will be split "+(e+1)+" ways.":Number(o.tariff_rate||0)>15?"High tariff rate cuts into margins. Watch for trade policy changes.":null}function zn(){const o=Tn();document.getElementById("ar-count").textContent=ft.length+" ROUTES";var e={COASTAL:0,INTERNATIONAL:0,GOVERNMENT:0};ft.forEach(function($){e[$.scope]!==void 0&&e[$.scope]++});var t=e.COASTAL,i=e.INTERNATIONAL,n=e.GOVERNMENT;document.getElementById("ar-footer-counts").innerHTML='<div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#8b9a6b"></div><span class="ar-footer__count-label">COASTAL</span><span class="ar-footer__count-num">'+t+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#5a8aaa"></div><span class="ar-footer__count-label">INTL</span><span class="ar-footer__count-num">'+i+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#c8a832"></div><span class="ar-footer__count-label">GOV</span><span class="ar-footer__count-num">'+n+"</span></div>";const a=document.getElementById("ar-claim-btn");a.className="ar-claim-btn"+(Z>=0?" active":"");const s=document.getElementById("ar-list");if(yi==="error"){s.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+b(St&&St.message||"Shipping routes are temporarily unavailable.")+"</div></div>";return}if(o.length===0){s.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+(ft.length===0?"No routes available.<br>Routes are generated from bilateral<br>trade each tick. Check back after<br>the next corp tick fires.":"No "+co.toLowerCase()+" routes available.")+"</div></div>";return}let r="";for(let $=0;$<o.length;$++){const h=o[$],k=Z===$,I=Zn[h.scope]||Zn.INTERNATIONAL,E=h.scope==="GOVERNMENT",S=h.demand_level&&fn[h.demand_level]?{color:fn[h.demand_level],label:h.demand_level}:null,C=Number(h.competition_count||0),q=C===0?"#5c5":C<=2?"#ca5":"#c84";r+='<div style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid '+(k?I.color:"transparent")+";background:"+(k?I.color+"08":"transparent")+';" onclick="arSelectRoute('+$+')"><div style="padding:8px 14px;">',r+='<div style="display:flex;align-items:center;gap:0;margin-bottom:4px;"><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+b(h.origin_port||"?")+'</span><div style="flex:1;display:flex;align-items:center;margin:0 8px;"><div style="flex:1;height:1px;background:'+I.color+'44"></div><span style="font-family:var(--font-mono);font-size:7px;color:'+I.color+';padding:0 6px">⚓</span><div style="flex:1;height:1px;background:'+I.color+'44"></div></div><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+b(h.destination_port||"?")+"</span></div>",r+='<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;"><span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+I.color+";background:"+I.color+"12;border:1px solid "+I.color+'25">'+I.label+"</span>",S&&(r+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+S.color+";background:"+S.color+"12;border:1px solid "+S.color+'25">'+S.label+" DEMAND</span>"),E&&h.gov_issuer&&(r+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">'+b(h.gov_issuer)+"</span>"),C===0&&!E&&(r+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15)">NO COMPETITION</span>');var c=Sn.find(function(w){return w.route_id===h.id});if(c){var p=c.status==="approved"?"#5c5":"#c8a832",f=c.status==="approved"?"APPROVED":"APPLIED";r+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+p+";background:"+p+"12;border:1px solid "+p+'25">'+f+"</span>"}if(r+='<span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-left:auto">'+(h.transit_ticks||"?")+" tick"+((h.transit_ticks||0)!==1?"s":"")+" · "+b(h.vessel_class||"?")+"</span>",r+="</div>",r+='<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">',E?(r+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(h.gov_contract_duration||h.transit_ticks||"?")+" ticks</div></div>",r+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VESSEL</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+b(h.vessel_class||"?")+"</div></div>",r+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT VALUE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-top:1px">'+P(Number(h.gov_contract_value||h.estimated_revenue||0))+"</div></div>"):(r+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VOLUME</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);margin-top:1px">'+P(Number(h.trade_volume||0))+"</div></div>",r+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">COMP.</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+q+';margin-top:1px">'+C+"</div></div>",r+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">TRANSIT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(h.transit_ticks||"?")+" tick"+((h.transit_ticks||0)!==1?"s":"")+"</div></div>",r+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">EST. REV</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;margin-top:1px">'+P(Number(h.estimated_revenue||0))+"</div></div>"),r+="</div>",k){if(r+='<div style="margin-top:6px;">',E&&h.goods_description&&(r+='<div style="font-size:10px;color:var(--text-muted);line-height:1.5;margin-bottom:6px">'+b(h.goods_description)+"</div>"),h.trade_agreement_name&&(r+='<div style="padding:4px 8px;margin-bottom:5px;background:rgba(90,138,170,0.05);border:1px solid rgba(90,138,170,0.12)"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:var(--font-mono);font-size:7px;color:#5a8aaa;letter-spacing:0.5px">TRADE AGREEMENT</div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:1px">'+b(h.trade_agreement_name)+'</div></div><div style="text-align:right"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">TARIFF</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(Number(h.tariff_rate||0)>10?"#c84":"#5c5")+'">'+Number(h.tariff_rate||0).toFixed(1)+"%</div></div></div></div>"),r+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px">',r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VESSEL CLASS</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+b(h.vessel_class||"?")+"</span></div>",h.vessel_note&&(r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">REQUIREMENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+b(h.vessel_note)+"</span></div>"),r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">PROXIMITY</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+(h.proximity!=null?h.proximity:"?")+" / 100</span></div>",r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CARGO</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+b(h.goods_name||"Unknown")+"</span></div>",h.goods_description&&!E&&(r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CONTENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+b(h.goods_description)+"</span></div>"),r+='<div style="display:flex;justify-content:space-between;padding:2px 0"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VOLUME</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+Number(h.volume_physical||0).toLocaleString()+" "+b(h.volume_unit||"tons")+"</span></div>",r+="</div>",T&&!E){var l=cs(h.trade_sector);if(l.length>0){r+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.8px;margin-bottom:3px">DEMAND DRIVERS</div>';for(var v=0;v<l.length;v++){var m=l[v],u=Number(T[m.stat]??50),g=u>=50?"#5c5":u>=30?"#ca5":"#c84";r+='<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);width:100px">'+b(m.label)+'</span><div style="width:40px;height:2px;background:var(--border-0)"><div style="width:'+u+"%;height:100%;background:"+g+'"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-bright)">'+Math.round(u)+"</span></div>"}r+="</div>"}}var _=ps(h);_&&(r+='<div style="padding:4px 8px;background:'+I.color+"08;border:1px solid "+I.color+'15"><div style="font-size:9px;color:var(--text-muted);line-height:1.5">'+b(_)+"</div></div>"),r+="</div>"}r+="</div></div>"}s.innerHTML=r}function fs(o){Z=Z===o?-1:o,zn()}async function ms(){if(!(pt||Z<0||!d||!z)){var o=Tn(),e=o[Z];if(e){var t=Sn.find(function(u){return u.route_id===e.id});if(t){alert("You have already applied for this route. Status: "+t.status);return}var i={"Bulk Cargo":"bulk_cargo","Container Freight":"container_freight","Specialized Transport":"specialized_transport"},n=i[d.corp_subsector]||"";if(e.shipping_subsector&&n!==e.shipping_subsector){var a=e.shipping_subsector.replace(/_/g," ").replace(/\b\w/g,function(u){return u.toUpperCase()});alert("Your fleet specializes in "+(d.corp_subsector||"?")+" but this route requires "+a+". You cannot service this route.");return}var s=5e4,{data:r}=await y.from("factions").select("corp_cash_reserves").eq("id",d.id).single(),c=Number(r?.corp_cash_reserves??0);if(c<s){alert("Not enough funds. Application fee: $50k. You have $"+Math.round(c/1e3)+"k.");return}pt=!0;var p=document.getElementById("ar-claim-btn");p.textContent="APPLYING...";try{var f=c-s,{error:l}=await y.from("factions").update({corp_cash_reserves:f}).eq("id",d.id);if(l){alert("Failed to deduct fee.");return}var{data:v,error:m}=await y.from("shipping_applications").insert({route_id:e.id,faction_id:d.id,proposed_rate:Number(e.estimated_revenue||0),application_fee:s,status:"pending",applied_at_tick:z.current_tick}).select("*").single();if(m){alert("Application failed: "+m.message),await y.from("factions").update({corp_cash_reserves:c}).eq("id",d.id);return}await y.from("event_log").insert({nation_id:e.origin_nation_id,event_name:d.faction_name+" applied to service "+(e.origin_port||"?")+" → "+(e.destination_port||"?")+" route",category:"corporate",description_chosen:d.faction_name+" has submitted a shipping application for the "+(e.goods_name||"trade")+" route between "+(e.origin_port||"?")+" and "+(e.destination_port||"?")+". Awaiting government approval.",fired_at_tick:z.current_tick}).catch(function(){}),await Cn(),Z=-1,await $o(),alert("Application submitted! The government will review your application.")}catch(u){alert("Application failed: "+(u.message||"Network error"))}finally{pt=!1,p.textContent="APPLY TO SERVICE — $50k",p.className="ar-claim-btn"+(Z>=0?" active":"")}}}}async function us(){if(!(pt||Z<0||!d||!z)){var o=Tn(),e=o[Z];if(e){var t=Number(d.shipping_fleet_capacity??0),i=Number(d.shipping_fleet_deployed??0);if(i>=t){alert("No available vessels. Fleet capacity: "+t+", deployed: "+i+".");return}pt=!0;var n=document.getElementById("ar-claim-btn");n.textContent="CLAIMING...",n.className="ar-claim-btn";try{var{data:a,error:s}=await y.rpc("claim_shipping_route",{p_faction_id:d.id,p_route_id:e.id,p_current_tick:z.current_tick});if(s){alert("Claim failed: "+s.message);return}if(a&&!a.success){alert(a.error||"Claim failed.");return}if(a?.claim_id){var r=(_e||[]).find(function(v){return v.status==="in_port"&&!v.active_claim_id&&v.fuel>=10});if(r){var{error:c}=await y.from("corp_vessels").update({status:"in_transit",active_claim_id:a.claim_id,current_port_nation_id:null}).eq("id",r.id);c&&console.warn("Failed to assign vessel to route:",c.message)}else console.warn("Route claimed but no available vessel with fuel >= 10% to assign.")}try{var p=e.origin_nation?.name||e.origin_nation_id||"Unknown",f=e.destination_nation?.name||e.destination_nation_id||"Unknown",l=e.goods_type||e.cargo_type||"goods";await y.from("event_log").insert({nation_id:d.nation_id,event_name:"Shipping Route Signed",category:"corporate",description_chosen:d.faction_name+" has just signed an agreement to ship "+l+" between "+p+" and "+f+".",fired_at_tick:z.current_tick||0})}catch{}await Cn(),Z=-1,await Promise.all([$o(),wo(),ve()])}catch(v){alert("Claim failed: "+(v.message||"Network error"))}finally{pt=!1,n.textContent="CLAIM ROUTE",n.className="ar-claim-btn"+(Z>=0?" active":"")}}}}let qe=[],gi="ready",Tt=null,po=-1;async function wo(){if(!d)return;const o=await fa(y,d.id);qe=o.claims,gi=o.state,Tt=o.error,Tt&&console.warn("Failed to load active voyages:",Tt.message),xi()}function vs(o){po=po===o?-1:o,xi()}async function ys(o){if(!(Uo||!d||!z)){Uo=!0;try{var{data:e,error:t}=await y.rpc("release_shipping_route",{p_faction_id:d.id,p_claim_id:o,p_current_tick:z.current_tick});if(t){alert("Release failed: "+t.message);return}if(e&&!e.success){alert(e.error||"Release failed.");return}var{error:i}=await y.from("corp_vessels").update({status:"in_port",active_claim_id:null}).eq("active_claim_id",o).eq("faction_id",d.id);i&&console.warn("Failed to free vessel on release:",i.message),po=-1,await Cn(),await Promise.all([$o(),wo(),ve()])}catch(n){alert("Release failed: "+(n.message||"Network error"))}finally{Uo=!1}}}function xi(){const o=z?.current_tick||0,e=Number(d?.shipping_fleet_capacity??0),t=Number(d?.shipping_fleet_deployed??0),i=d?.corp_subsector||"--";document.getElementById("av-count").textContent=qe.length+" ACTIVE";const n=qe.reduce((f,l)=>f+Number(l.total_revenue||0),0),a=qe.reduce((f,l)=>f+(l.transits_completed||0),0),s=a>0?Math.round(n/a):0;document.getElementById("av-summary").innerHTML=`
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
            <div class="av-summary__value" style="color:var(--green)">${P(s)}</div>
        </div>`,document.getElementById("av-total-revenue").textContent=P(n),document.getElementById("av-total-revenue").style.color=n>0?"var(--green)":"var(--text-dim)",document.getElementById("av-fleet-status").textContent=t+"/"+e,document.getElementById("av-subsector").textContent=i;const r=document.getElementById("av-list");if(gi==="error"){r.innerHTML='<div class="av-empty"><div class="av-empty__text">'+b(Tt&&Tt.message||"Active voyage data is temporarily unavailable.")+"</div></div>";return}if(qe.length===0){r.innerHTML='<div class="av-empty"><div class="av-empty__text">No active voyages.<br>Claim a shipping route to<br>deploy your fleet.</div></div>';return}let c="";for(let f=0;f<qe.length;f++){const l=qe[f],v=l.shipping_routes||{},m=po===f,u=l.vessel_status||"idle";let g=u.toUpperCase().replace("_"," "),_="av-status--idle",$="";if(u==="loading")_="av-status--loading",g="LOADING";else if(u==="in_transit"){_="av-status--transit";const C=l.transit_started_tick||o,w=(l.transit_arrives_tick||C+(v.transit_ticks||2))-C,N=Math.max(0,Math.min(o-C,w)),R=w>0?Math.round(N/w*100):0;g="IN TRANSIT ("+N+"/"+w+")",$='<div class="av-transit-bar"><div class="av-transit-bar__fill" style="width:'+R+'%"></div></div>'}const h=Number(l.revenue_per_transit||0),k=Number(l.market_share_pct||0),I=l.transits_completed||0,E=Number(l.total_revenue||0),S=fn[v.demand_level]||"#6a6660";if(c+='<div class="av-item" onclick="avToggle('+f+')"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;"><div class="av-item__route">'+b(v.origin_port||"?")+" → "+b(v.destination_port||"?")+'</div><span class="av-status '+_+'">'+g+'</span></div><div class="av-item__cargo">'+b(v.goods_name||"Unknown")+" · "+b(v.vessel_class||"?")+"</div>"+$+'<div class="av-item__stats"><div class="av-stat"><div class="av-stat__label">REV/TRIP</div><div class="av-stat__value" style="color:var(--green)">'+P(h)+'</div></div><div class="av-stat"><div class="av-stat__label">SHARE</div><div class="av-stat__value">'+k.toFixed(1)+'%</div></div><div class="av-stat"><div class="av-stat__label">TRANSITS</div><div class="av-stat__value">'+I+'</div></div><div class="av-stat"><div class="av-stat__label">TOTAL REV</div><div class="av-stat__value" style="color:var(--green)">'+P(E)+"</div></div></div>",m){c+='<div class="av-item__detail"><div class="av-detail-row"><span class="av-detail-label">ORIGIN</span><span class="av-detail-value">'+b(v.origin_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">DESTINATION</span><span class="av-detail-value">'+b(v.destination_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE SECTOR</span><span class="av-detail-value">'+b((v.trade_sector||"").replace(/_/g," ").toUpperCase())+'</span></div><div class="av-detail-row"><span class="av-detail-label">SCOPE</span><span class="av-detail-value">'+b(v.scope||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRANSIT TIME</span><span class="av-detail-value">'+(v.transit_ticks||"?")+' ticks</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE VOLUME</span><span class="av-detail-value">'+P(Number(v.trade_volume||0))+'</span></div><div class="av-detail-row"><span class="av-detail-label">TARIFF</span><span class="av-detail-value">'+Number(v.tariff_rate||0).toFixed(1)+'%</span></div><div class="av-detail-row"><span class="av-detail-label">COMPETITION</span><span class="av-detail-value">'+(v.competition_count??0)+' corps</span></div><div class="av-detail-row"><span class="av-detail-label">DEMAND</span><span class="av-detail-value" style="color:'+S+'">'+(v.demand_level||"?")+"</span></div>"+(v.trade_agreement_name?'<div class="av-detail-row"><span class="av-detail-label">AGREEMENT</span><span class="av-detail-value" style="color:var(--teal)">'+b(v.trade_agreement_name)+"</span></div>":"")+'<div class="av-detail-row"><span class="av-detail-label">CLAIMED</span><span class="av-detail-value">Tick '+(l.claimed_at_tick||"?")+"</span></div>";var p=(_e||[]).find(function(C){return C.active_claim_id===l.id});!p&&u==="loading"?c+=`<div style="padding:6px 8px;margin-top:4px;background:rgba(200,168,50,0.06);border:1px solid rgba(200,168,50,0.15);text-align:center;"><div style="font-family:var(--font-mono);font-size:9px;color:var(--orange);font-weight:700;margin-bottom:4px;">NO VESSEL ASSIGNED</div><button class="av-action-btn" style="background:var(--teal);color:#fff;border-color:var(--teal);width:100%;" onclick="event.stopPropagation();openAssignVesselModal('`+l.id+"','"+(v.vessel_class||"")+`')">ASSIGN VESSEL</button></div>`:p&&(c+='<div style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:var(--bg-card);border:1px solid var(--border-main);"><div><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">ASSIGNED VESSEL</div><div style="font-size:11px;font-weight:700;color:var(--text-bright);">'+b(p.vessel_name||"Unknown")+'</div></div><div style="display:flex;gap:10px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(p.fuel>50?"#5c5":p.fuel>20?"#ca5":"#c55")+'">'+(p.fuel||0)+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(p.condition>50?"#5c5":p.condition>30?"#ca5":"#c55")+'">'+(p.condition||0)+"%</div></div></div></div>"),c+=`<button class="av-action-btn release" onclick="event.stopPropagation();avRelease('`+l.id+`')">RELEASE ROUTE</button></div>`}c+="</div>"}r.innerHTML=c}function gs(o,e){const t=(_e||[]).filter(function(a){return a.status==="in_port"&&!a.active_claim_id&&a.fuel>=15&&a.condition>=20});let i;t.length===0?i='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No available vessels.<br>Ships must be in port with 15%+ fuel and 20%+ condition.</div>':i=t.map(function(a,s){var r=a.fuel>50?"#5c5":a.fuel>20?"#ca5":"#c55",c=a.condition>50?"#5c5":a.condition>30?"#ca5":"#c55";return`<div style="padding:10px 14px;border-bottom:1px solid var(--border-0);cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="assignVesselToRoute('`+o+"','"+a.id+`')"><div><div style="font-size:14px;font-weight:700;color:var(--text-bright);">`+b(a.vessel_name||"Unnamed")+'</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+b(a.vessel_class||"?")+" · "+(a.capacity_dwt||0).toLocaleString()+' DWT</div></div><div style="display:flex;gap:14px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+r+'">'+a.fuel+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+c+'">'+a.condition+'%</div></div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--teal);padding:4px 12px;border:1px solid var(--teal);cursor:pointer;">ASSIGN</div></div></div>'}).join("");var n=document.createElement("div");n.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;",n.onclick=function(a){a.target===n&&n.remove()},n.innerHTML='<div style="width:560px;max-width:95vw;max-height:80vh;background:var(--bg-panel);border:1px solid var(--border-main);display:flex;flex-direction:column;"><div style="padding:12px 16px;border-bottom:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:space-between;align-items:center;"><span style="font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:var(--teal);">ASSIGN VESSEL</span><span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+t.length+' available</span></div><div style="flex:1;overflow-y:auto;">'+i+`</div><div style="padding:10px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);text-align:right;"><button onclick="this.closest('div[style*=fixed]').remove()" style="padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);background:transparent;border:1px solid var(--border-main);cursor:pointer;">CANCEL</button></div></div>`,document.body.appendChild(n)}async function xs(o,e){try{var{error:t}=await y.from("corp_vessels").update({status:"in_port",active_claim_id:o}).eq("id",e).eq("faction_id",d.id);if(t){alert("Assignment failed: "+t.message);return}var i=document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]');i&&i.remove(),await Promise.all([wo(),ve()])}catch(n){alert("Assignment failed: "+(n.message||"Network error"))}}window.openAssignVesselModal=gs;window.assignVesselToRoute=xs;function In(){const o=ne.reduce((r,c)=>r+(c.owned||0),0),e=ne.reduce((r,c)=>r+(c.deployed||0),0),t=ga(ne),i=o-e;document.getElementById("eq-count").textContent=o+" UNITS",document.getElementById("eq-summary").innerHTML=`
        <div class="eq-summary__cell">
            <div class="eq-summary__label">DEPLOYED</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--text-bright)">
                ${e} <span style="font-size:9px;color:var(--text-dim)">/ ${o}</span>
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
                ${P(t)}
            </div>
        </div>`;const n={};for(const r of ne)n[r.equipment_key]=r;let a="";for(let r=1;r<=3;r++){const c=Rt[r],p=an(r),f=rn===r,l=p.reduce((m,u)=>m+(n[u.key]?.owned||0),0),v=p.reduce((m,u)=>m+(n[u.key]?.deployed||0),0);if(a+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${r})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${f?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${c.color}">${b(c.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${c.color};border:1px solid ${c.color}33;background:${c.color}0a">${c.tag}</span>
            </div>
            ${l>0?`<span class="eq-tier-hdr__count">${v}/${l}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,f)for(const m of p){const u=n[m.key],g=u?.owned||0,_=u?.deployed||0,$=u?.condition||0,h=m.maintenancePerUnit*g,k=g-_,I=g>0&&k===0,E=g>0&&$<65,S=oi($),C=u?.assigned_projects||[],q=C.length>0?C.map(w=>w.contract_name||"Project").join(", ").slice(0,30):g>0&&_>0?_+" project"+(_>1?"s":""):"—";a+=`<div class="eq-row${g===0?" unowned":""}">`,a+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${g===0?" dim":""}">${b(m.name)}</span>
                        ${E?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${g>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${I?"var(--orange)":"var(--green)"}">${k}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${_}/${g}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,g>0?a+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${$}%;background:${S}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${S}">${$}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${b(q)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${P(h)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:a+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',a+="</div>"}}document.getElementById("eq-list").innerHTML=a;const s=[1,2,3].map(r=>{const c=Rt[r],p=an(r).reduce((f,l)=>f+(n[l.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${p>0?c.color+"33":"var(--border-0)"};background:${p>0?c.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${c.color}">${c.tag}</div>
            <div class="eq-footer__tier-count" style="color:${p>0?"var(--text-bright)":"var(--text-dim)"}">${p}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${P(t)}</div>
        </div>
        <div class="eq-footer__tiers">${s}</div>`}function bs(o){rn=rn===o?-1:o,In()}async function bi(){if(!d)return;const{data:o,error:e}=await y.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",d.id);e?(console.warn("Failed to load equipment:",e.message),ne=[]):ne=o||[],In()}async function _s(){const{data:{user:o}}=await y.auth.getUser();if(!o){window.location.href="login.html";return}const{data:e}=await y.from("factions").select("*").or(`id.eq.${o.id},linked_user_id.eq.${o.id}`);he=(e||[]).filter(m=>m.nation_id);const t=sessionStorage.getItem("active_faction_id");if(d=he.find(m=>m.id===t)||he.find(m=>m.faction_type==="corporation")||he[0],!d){await y.auth.signOut(),window.location.href="login.html";return}if(d.faction_type!=="corporation"){window.location.href="dashboard.html";return}const i=new URLSearchParams(window.location.search).get("tab"),n=i==="expansion"||i==="actions";if(d.corp_sector!=="Shipping"&&!n){const u={Finance:"corp-operations-finance.html",Construction:"corp-operations.html"}[d.corp_sector];if(u){window.location.href=u;return}}const[a,s]=await Promise.all([d.nation_id?y.from("nations").select("*").eq("id",d.nation_id).single():Promise.resolve({data:null}),y.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);a.error&&console.warn("Nation load failed:",a.error.message),a.data&&(T=a.data),s.error&&console.warn("Shard load failed:",s.error.message),z=s.data;let r=0;if(d?.id){const{data:m}=await y.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",d.id).in("status",["open","bidding"]);if(m)for(const u of m)r+=(u.contract_bids||[]).length}const c=document.getElementById("corp-topbar-container");if(c){const{renderCorpTopBar:m}=await va(async()=>{const{renderCorpTopBar:_}=await import("./corp-topbar-kB28qcfr.js");return{renderCorpTopBar:_}},__vite__mapDeps([0,1])),u=new URLSearchParams(window.location.search).get("tab")||"operations",g={};r>0&&(g.home={color:"#c8a832",title:r+" pending bid"+(r!==1?"s":"")+" on your projects"}),m(c,{faction:d,shard:z,activeTab:u,allUserFactions:he,badges:g})}if(z){if(document.getElementById("game-date").textContent=z.current_date||"—",document.getElementById("tick-number").textContent=z.current_tick||"—",z.next_tick_at){const u=(Number(z.tick_interval_hours)||8)*36e5,g=new Date(z.next_tick_at).getTime(),$=g-u+u/2;ln=new Date($>Date.now()?$:g+u/2),ka()}const m=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");m&&(m.textContent="Next Corp Tick")}const p=document.getElementById("topbar-cash");p&&(p.textContent="CASH: "+vi(Number(d.corp_cash_reserves??0)));const f=document.getElementById("topbar-ap");f&&(f.style.display="none");const l=document.getElementById("nation-pill");l&&(l.textContent=(T?.name||d.nation||"—").toUpperCase());const v=document.getElementById("corp-faction-dropdown");if(v){let m="";for(const u of he){const g=u.id===d.id,_=u.faction_type==="corporation"?"CORP":"PARTY",$=u.faction_type==="corporation"?"var(--teal)":"var(--amber)";m+=`<div class="corp-dd-item${g?" active":""}" onclick="switchToFaction('${u.id}', '${u.faction_type}')">
                <span class="corp-dd-type" style="color:${$}">${_}</span>
                <span class="corp-dd-name">${b(u.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${b(u.abbreviation||"—")}]</span>
            </div>`}v.innerHTML=m}await Promise.all([$o(),wo(),ve(),Dn(),Zi()]),ya(d,T,z);try{await pa(y,{faction:d,nation:T,shard:z},"auto-services-container")}catch(m){console.error("[CorpOps] Auto-services init failed:",m)}if(document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",i==="expansion"){const m=document.querySelector('[data-tab-action="expansion"]');m&&hi({preventDefault:()=>{},target:m})}else if(i==="actions"){const m=document.querySelector('[data-tab-action="actions"]');m&&wi({preventDefault:()=>{},target:m})}}async function hs(){await y.auth.signOut(),window.location.href="login.html"}function $s(){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.toggle("open")}function ws(o,e){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.remove("open"),sessionStorage.setItem("active_faction_id",o),e==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",o=>{const e=document.getElementById("faction-switcher"),t=document.getElementById("corp-faction-dropdown");t&&e&&!e.contains(o.target)&&t.classList.remove("open")});document.addEventListener("keydown",o=>{o.key==="Escape"&&Ht()});window.doLogout=hs;window.toggleTheme=Ea;window.toggleCorpDropdown=$s;window.switchToFaction=ws;window.setFilter=Ca;window.arSetFilter=ls;window.arSelectRoute=fs;window.arClaimRoute=us;window.arApplyToService=ms;window.avToggle=vs;window.avRelease=ys;window.openContractDetail=di;window.closeContractDetail=Ht;window.toggleWhRow=Ga;window.toggleEqTier=bs;window.switchEmNation=Za;window.setEmType=es;window.setEmListing=ts;window.setEmQty=os;window.purchaseEquipment=ns;window.setPrMat=Ya;window.setPrTier=Qa;window.setPrQty=Ka;window.purchaseMaterial=Ja;let oe={general:0,skilled:0,innovative:0},Ho=!1;const We=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function _i(o){const e=Number(T?.minimum_wage??50),t=Number(T?.inflation??50),i=Number(T?.standard_of_living??50),n=e/100*48e3,a=1+(t-50)/100*.5,s=1+(i-50)/100*.5;return Math.round(n*o*a*s)}function x(o){const e=Math.abs(o),t=o<0?"-":"";return e>=1e9?t+"$"+(e/1e9).toFixed(2)+"B":e>=1e6?t+"$"+(e/1e6).toFixed(2)+"M":e>=1e3?t+"$"+(e/1e3).toFixed(1)+"k":t+"$"+e.toLocaleString()}async function hi(o){o.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("actions-content").style.display="none";const e=document.getElementById("expansion-content");e.style.display="flex",e.style.justifyContent="center",e.style.gap="12px",e.style.alignItems="flex-start",e.style.flexWrap="wrap",document.querySelectorAll(".corp-nav-tab").forEach(t=>t.classList.remove("active")),o.target.classList.add("active"),await Co(),Eo(),Qs(),await Ln(),To(),await gr(),await ar(),Yt(),Wt(),await Cr(),Qt(),await Io(),Mo()}function $i(o){o&&o.preventDefault(),document.getElementById("operations-content").style.display="flex",document.getElementById("expansion-content").style.display="none",document.getElementById("actions-content").style.display="none",document.querySelectorAll(".corp-nav-tab").forEach(e=>e.classList.remove("active")),ks()?.classList.add("active")}async function wi(o){o.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("expansion-content").style.display="none",document.getElementById("actions-content").style.display="block",document.querySelectorAll(".corp-nav-tab").forEach(e=>e.classList.remove("active")),(o.target||document.querySelector('[data-tab-action="actions"]'))?.classList.add("active"),await ki(),bt()}function ks(){return Array.from(document.querySelectorAll(".corp-nav-tab[href]:not([data-tab-action])")).find(o=>{const e=o.getAttribute("href");if(!e)return!1;const t=new URL(e,window.location.href);return t.pathname===window.location.pathname&&!t.searchParams.get("tab")})||null}async function ki(){if(!d)return;const[o,e]=await Promise.all([y.from("corp_executives").select("*").eq("faction_id",d.id).eq("status","active"),y.from("executive_pool").select("*").eq("nation_id",d.nation_id).eq("status","available").order("skill",{ascending:!1})]);o.error&&console.warn("Failed to load executives:",o.error.message),e.error&&console.warn("Failed to load executive pool:",e.error.message),Lt=o.data||[],qt=e.data||[];const t=await _a({supabase:y,faction:d,currentTick:z?.current_tick||0,poolCandidates:qt});t?.error&&console.warn("Failed to seed initial executive roster:",t.error.message||t.error),t?.executives&&(Lt=t.executives)}function st(o){return o>=1e6?"$"+(o/1e6).toFixed(1)+"M":o>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Ie(o){return Lt.find(e=>e.role===o)||null}function fo(o,e){return(o||"?")[0]+(e||"?")[0]}function mt(o){return o>=70?"#5cb85c":o>=50?"#ca5":"#c84"}function bt(){const o=document.getElementById("actions-container");if(!o)return;const e=d?.faction_name||"Corporation",t=(d?.abbreviation||d?.corp_ticker||"??").toUpperCase();let i="";i+=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:0 2px;">
        <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:2px;color:#8b9a6b;text-transform:uppercase;">Actions</span>
            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${b(e)} &middot; ${b(t)}</span>
        </div>
    </div>`,i+='<div style="display:flex;gap:8px;">',i+='<div style="width:262px;display:flex;flex-direction:column;gap:5px;flex-shrink:0;">';for(let n=0;n<no.length;n++){const a=no[n],s=io[a],r=Ie(a),c=ct===n,p=s.color,f=!r;if(i+=`<div onclick="actSelectExec(${n})" style="
            padding:10px 12px;
            background:${c?p+"0a":"var(--bg-2,#1a1a17)"};
            border:1px solid ${c?p+"44":"var(--border-0,rgba(255,255,255,0.06))"};
            border-left:3px solid ${c?p:"var(--border-0,rgba(255,255,255,0.06))"};
            cursor:pointer;
        ">`,f&&a!=="CEO")i+=`<div style="display:flex;align-items:center;gap:10px;">
                <div style="width:45px;height:45px;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);flex-shrink:0;">?</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:4px;">
                        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${p};">${b(a)}</span>
                    </div>
                    <div style="font-size:13px;font-weight:600;color:var(--text-dim);margin-top:2px;">VACANT</div>
                    <div style="margin-top:4px;">
                        <span onclick="event.stopPropagation();openExecSearch('${a}')" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:3px 8px;color:#5a8aaa;border:1px solid rgba(90,138,170,0.25);background:rgba(90,138,170,0.06);cursor:pointer;">EXECUTIVE SEARCH</span>
                    </div>
                </div>
            </div>`;else{const l=r?`${r.first_name} ${r.last_name}`:"—",v=r?r.age:0,m=r?r.skill:0,u=r?r.salary_per_year:0,g=r?fo(r.first_name,r.last_name):"—";i+=`<div style="display:flex;align-items:center;gap:10px;">
                <div style="width:45px;height:45px;background:${p}15;border:1px solid ${p}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:14px;font-weight:700;color:${p};flex-shrink:0;">${b(g)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:4px;">
                        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${p};">${b(a)}</span>
                    </div>
                    <div style="font-size:13px;font-weight:600;color:${c?"var(--text-bright,#f0efe6)":"var(--text-muted,#666)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(l)}${v?` <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">(${v})</span>`:""}</div>
                    <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:3px;flex:1;">
                            <div style="flex:1;height:3px;background:var(--border-0,rgba(255,255,255,0.06));">
                                <div style="width:${m}%;height:100%;background:${mt(m)};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);width:18px;text-align:right;">${m}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${st(u)}/yr</span>
                    </div>
                </div>
            </div>`}i+="</div>"}i+="</div>",i+=`<div style="flex:1;display:flex;flex-direction:column;gap:0;">
        <div id="actions-right-panel"></div>
    </div>`,i+="</div>",o.innerHTML=i,Cs()}const Ei={CEO:[{id:"statement",name:"Issue Statement",desc:"Issue a press release to the public events feed. Other players and media corps see it. Cost scales with CEO skill.",cost:"~$20k",costColor:"#5cb85c",tags:["REPUTATION"],cooldown:"once/tick"},{id:"ipo",name:"IPO",desc:"Take the corporation public. Sell ~30% of shares for a massive cash injection. Permanent loss of full control.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["STRUCTURAL"],locked:!0,lockReason:"Coming soon"}],CFO:[{id:"loan",name:"Request Loan",desc:"Submit a loan application to all finance corporations. Set amount, purpose, term, and collateral. Receive competing offers.",cost:"FREE",costColor:"#5cb85c",tags:["FINANCIAL"]}],COO:[{id:"restructure",name:"Restructure Operations",desc:"Lay off 10-20% of workforce, cut ~7% of debt. Reputation hit scales with COO skill — high skill minimizes damage.",cost:"FREE",costColor:"#5cb85c",tags:["OPERATIONAL"],cooldown:"once/tick"}],CTO:[{id:"research",name:"Begin Research",desc:"Start researching a tech tree node. Opens the tech tree interface.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["INNOVATION"],locked:!0,lockReason:"Coming soon"}],CMO:[{id:"rebrand",name:"Rebrand Corporation",desc:"Change name and abbreviation. Cost and reputation hit scale with CMO skill — high skill reduces both.",cost:"~$20M",costColor:"#ca5",tags:["STRUCTURAL"],cooldown:"once/tick"}],CLO:[{id:"sue_corp",name:"Sue Corporation",desc:"File a lawsuit against another corporation for patent infringement, contract breach, or predatory practices.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["LEGAL"],locked:!0,lockReason:"Coming soon"}],Lobbyist:[{id:"donate",name:"Political Donation",desc:"Donate $1M to a political party in any nation where you have a presence. The target party receives $100k in party funds. You cannot donate to your own party.",cost:"$1M",costColor:"#ca5",tags:["POLITICAL"],cooldown:"once/tick"}]};function Gt(o){return 1.5-o/100}let Ci={};function Es(o){const e=z?.current_tick||0;return Ci[o]===e}function Bt(o){const e=z?.current_tick||0;Ci[o]=e}function Cs(){const o=document.getElementById("actions-right-panel");if(!o)return;const e=no[ct],t=io[e],i=Ie(e),n=Ei[e]||[];if(!i){o.innerHTML=`<div style="padding:48px;text-align:center;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));">
            <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${t.color};margin-bottom:6px;">${b(e)}</div>
            <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-bottom:14px;">${b(t.fullTitle)}</div>
            <div style="font-size:16px;color:var(--text-muted);margin-bottom:20px;">This position is vacant. Hire an executive to unlock actions.</div>
            <div onclick="openExecSearch('${e}')" style="display:inline-block;padding:8px 24px;font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">EXECUTIVE SEARCH</div>
        </div>`;return}let a="";a+=`<div style="padding:14px 20px;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-bottom:none;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:56px;height:56px;background:${t.color}15;border:1px solid ${t.color}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:18px;font-weight:700;color:${t.color};">${b(fo(i.first_name,i.last_name))}</div>
            <div>
                <div style="display:flex;align-items:baseline;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:22px;font-weight:700;color:${t.color};">${b(e)}</span>
                    <span style="font-size:19px;font-weight:700;color:var(--text-bright,#f0efe6);">${b(i.first_name)} ${b(i.last_name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-top:2px;">${b(t.fullTitle)}</div>
            </div>
        </div>
        <div style="display:flex;gap:16px;align-items:center;">
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SKILL</div>
                <div style="display:flex;align-items:center;gap:5px;margin-top:2px;">
                    <div style="width:50px;height:4px;background:var(--border-0,rgba(255,255,255,0.06));">
                        <div style="width:${i.skill}%;height:100%;background:${mt(i.skill)};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${mt(i.skill)};">${i.skill}</span>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SALARY</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${st(i.salary_per_year)}/yr</div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">CONTRACT</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${i.contract_years}yr</div>
            </div>
            ${e!=="CEO"?`<div style="text-align:right;">
                <span onclick="event.stopPropagation();confirmFireExec('${i.id}','${b(e)}','${b(i.first_name+" "+i.last_name)}',${i.salary_per_year},${i.contract_end_tick||0})" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:5px 12px;color:#d9534f;border:1px solid rgba(217,83,79,0.25);background:rgba(217,83,79,0.06);cursor:pointer;">FIRE</span>
            </div>`:""}
        </div>
    </div>`,a+='<div style="background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:1px solid var(--border-0,rgba(255,255,255,0.06));flex:1;">';for(let s=0;s<n.length;s++){const r=n[s],c=!!r.locked;a+=`<div onmouseenter="this.dataset.hover='1';this.style.background='${c?"transparent":t.color+"06"}'" onmouseleave="this.dataset.hover='';this.style.background='transparent';var eb=this.querySelector('.act-exec-btn');if(eb)eb.style.display='none'" style="
            padding:16px 20px;
            ${s<n.length-1?"border-bottom:1px solid var(--border-0,rgba(255,255,255,0.06));":""}
            opacity:${c?"0.4":"1"};
            cursor:${c?"not-allowed":"pointer"};
        ">`,a+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;font-weight:700;color:${c?"var(--text-dim)":"var(--text-bright,#f0efe6)"};">${b(r.name)}</span>`;for(const p of r.tags)a+=`<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.3px;padding:2px 6px;line-height:14px;color:${p==="IRREVERSIBLE"?"#c55":p==="OFFENSIVE"?"#c84":p==="STRUCTURAL"?"#ca5":p==="POLITICAL"?"#8a6aaa":"var(--text-dim)"};background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));">${b(p)}</span>`;a+=`</div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${r.costColor};">${b(r.cost)}</span>
            </div>
        </div>`,a+=`<div style="font-size:14px;color:${c?"var(--text-dim)":"var(--text-muted,#666)"};line-height:1.6;">${b(r.desc)}</div>`,c&&r.lockReason&&(a+=`<div style="margin-top:6px;font-family:var(--font-mono);font-size:11px;color:#c84;display:flex;align-items:center;gap:4px;">
                <span>&#8856;</span><span>${b(r.lockReason)}</span>
            </div>`),c||(a+=`<div class="act-exec-btn" style="display:none;margin-top:10px;text-align:right;">
                <span onclick="event.stopPropagation();actExecute('${r.id}','${e}')" style="display:inline-block;padding:6px 24px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${t.color};cursor:pointer;">EXECUTE</span>
            </div>`),a+="</div>"}a+="</div>",a+=`<div style="padding:8px 20px;background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:none;">
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">
            <span style="color:${t.color};font-weight:700;">${b(e)}</span> skill (${i.skill}/100) affects action outcomes.
            ${i.skill>=70?" High skill increases success probability and reduces costs.":i.skill>=50?" Moderate skill — outcomes are average. Consider recruiting a stronger executive.":" Low skill — actions are less effective and more expensive. Replacement recommended."}
        </div>
    </div>`,o.innerHTML=a,o.querySelectorAll("[onmouseenter]").forEach(s=>{s.addEventListener("mouseenter",function(){const r=this.querySelector(".act-exec-btn");r&&(r.style.display="block")}),s.addEventListener("mouseleave",function(){const r=this.querySelector(".act-exec-btn");r&&(r.style.display="none")})})}function Ss(o,e,t,i,n){const a=z?.current_tick||0,s=Math.max(0,n-a),r=Math.round(i*(s/12)),c=`FIRE ${e}: ${t}

Contract remaining: ${s} ticks
Payout (prorated): $${(r/1e6).toFixed(2)}M

This amount will be deducted from your cash reserves immediately.

Are you sure?`;confirm(c)&&Ts(o,e,r)}async function Ts(o,e,t){try{const i=Number(d?.corp_cash_reserves??0);if(i<t){alert(`Insufficient funds. You need $${(t/1e6).toFixed(2)}M but only have $${(i/1e6).toFixed(2)}M.`);return}const n=i-t,{error:a}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",d.id);if(a){alert("Failed to process payout: "+a.message);return}const{error:s}=await y.from("corp_executives").update({status:"fired",updated_at:new Date().toISOString()}).eq("id",o);if(s){await y.from("factions").update({corp_cash_reserves:i}).eq("id",d.id),alert("Failed to fire executive: "+s.message);return}d.corp_cash_reserves=n,Lt=Lt.filter(r=>r.id!==o),bt()}catch(i){console.error("[CorpOps] Fire executive error:",i),alert("An error occurred.")}}function zs(o,e){if((Ei[e]||[]).find(i=>i.id===o)?.cooldown==="once/tick"&&Es(o)){alert("This action can only be used once per tick. Wait for the next tick.");return}switch(o){case"statement":return Si();case"loan":return zi();case"restructure":return Mi();case"rebrand":return Ai();case"donate":return Ni()}}let mn=!1;function Si(){if(mn)return;mn=!0;const o=document.createElement("div");o.id="stmt-overlay",o.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",o.onclick=function(c){c.target===o&&Mn()};const e=d?.faction_name||"Corporation",t=(d?.abbreviation||d?.corp_ticker||"??").toUpperCase(),i=Number(d?.corp_cash_reserves??0),n=Ie("CEO"),a=n?`${n.first_name} ${n.last_name}`:"CEO";o.innerHTML=`<div onclick="event.stopPropagation()" style="width:480px;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">
        <div style="padding:10px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:8px;color:#c8a832;">&#9679;</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Issue Statement</span>
                </div>
                <span onclick="actCloseStatement()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">From:</span>
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${b(t)}</span>
                <span style="font-size:10px;color:#e8e4dc;">${b(e)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">&middot; ${b(a)}</span>
            </div>
        </div>
        <div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">PRESS RELEASE</div>
            <textarea id="stmt-text" rows="4" maxlength="500" placeholder="Type your public statement here. All players will see this in the events feed."
                style="width:100%;padding:8px 10px;font-family:var(--font-ui);font-size:11px;color:#e8e4dc;background:#1c1c18;border:1px solid #2a2a24;outline:none;resize:none;box-sizing:border-box;line-height:1.5;"></textarea>
            <div style="display:flex;justify-content:space-between;margin-top:4px;">
                <span style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">Visible to all players in all nations</span>
                <span id="stmt-chars" style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">0/500</span>
            </div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid #2a2a24;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;gap:12px;">
                    <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">COST</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#5cb85c;">$20k</div></div>
                    <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${i<2e4?"#c55":"#e8e4dc"};">${x(i)}</div></div>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="actCloseStatement()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
                    <div id="stmt-submit-btn" onclick="actSubmitStatement()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c8a832;cursor:pointer;">PUBLISH</div>
                </div>
            </div>
            <div id="stmt-error" style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
        </div>
    </div>`,document.body.appendChild(o);const s=document.getElementById("stmt-text"),r=document.getElementById("stmt-chars");s&&r&&(s.addEventListener("input",function(){r.textContent=this.value.length+"/500"}),s.focus())}function Mn(){const o=document.getElementById("stmt-overlay");o&&o.remove(),mn=!1}let $t=!1;async function Is(){if(!d||!z||$t)return;const o=document.getElementById("stmt-text"),e=document.getElementById("stmt-error"),t=(o?.value||"").trim();if(!t){e&&(e.textContent="Statement cannot be empty.",e.style.display="block");return}if(t.length>500){e&&(e.textContent="Statement too long (max 500 chars).",e.style.display="block");return}const i=Ie("CEO"),n=i?i.skill:50,a=Math.round(2e4*Gt(n)),s=Number(d.corp_cash_reserves??0);if(s<a){e&&(e.textContent="Insufficient cash. Need "+x(a)+".",e.style.display="block");return}$t=!0;const r=document.getElementById("stmt-submit-btn");r&&(r.style.opacity="0.4",r.style.pointerEvents="none");const c=d.faction_name||"Corporation",p=i?`${i.first_name} ${i.last_name}`:"CEO",f=z.current_tick||0,{error:l}=await y.from("factions").update({corp_cash_reserves:s-a}).eq("id",d.id);if(l){$t=!1,e&&(e.textContent="Failed to deduct cost: "+l.message,e.style.display="block"),r&&(r.style.opacity="1",r.style.pointerEvents="auto");return}const{error:v}=await y.from("event_log").insert({nation_id:d.nation_id,faction_id:d.id,event_name:c+" — Press Release",description_used:p+", CEO of "+c+': "'+t.replace(/[<>"]/g,"")+'"',category:"business",trigger_key:"ceo_statement",effects_applied:{cost:a,ceo:p,skill:n},fired_at_tick:f});if(v){await y.from("factions").update({corp_cash_reserves:s}).eq("id",d.id),$t=!1,e&&(e.textContent="Failed to publish: "+v.message,e.style.display="block"),r&&(r.style.opacity="1",r.style.pointerEvents="auto");return}d.corp_cash_reserves=s-a,$t=!1,Bt("statement"),Mn()}const Ti=[{id:"equipment",label:"Equipment Acquisition",desc:"Purchase vehicles, cranes, or heavy machinery",icon:"&#9881;"},{id:"working",label:"Working Capital",desc:"Bridge financing for active project costs",icon:"$"},{id:"property",label:"Property Purchase",desc:"Acquire office, warehouse, or HQ building",icon:"&#9632;"},{id:"subsidiary",label:"Subsidiary Expansion",desc:"Fund new subsidiary establishment",icon:"&#9672;"},{id:"materials",label:"Material Procurement",desc:"Bulk material purchase for upcoming projects",icon:"&#9638;"}],Go=[{id:"none",label:"None",desc:"Unsecured — lenders may charge higher rates",risk:"HIGH",riskColor:"#c84"},{id:"equipment",label:"Equipment",desc:"Financed equipment serves as collateral",risk:"MODERATE",riskColor:"#ca5"},{id:"property",label:"Property",desc:"Corporate property lien",risk:"LOW",riskColor:"#8b9a6b"},{id:"full",label:"Full Assets",desc:"All corporate assets — maximum lender security",risk:"MINIMAL",riskColor:"#5c5"}];let ee=25e7,Pt="equipment",ut=48,ce="equipment",mo="",Et=[];function zi(){ee=25e7,Pt="equipment",ut=48,ce="equipment",mo="",document.getElementById("lr-overlay").style.display="flex",Ls(),_t()}function Ii(){document.getElementById("lr-overlay").style.display="none"}function Ms(o){ee=Math.max(1e6,Math.min(5e9,Number(o)||0)),_t()}function As(o){Pt=o,_t()}function Ns(o){ut=o,_t()}function Rs(o){ce=o,_t()}async function Ls(){if(!d)return;const{data:o}=await y.from("factions").select("id, faction_name, abbreviation, corp_ticker, corp_company_type").eq("faction_type","corporation").eq("corp_sector","Finance").is("abandoned_at",null).neq("id",d.id);Et=o||[],_t()}function _t(){const o=document.getElementById("lr-modal-content");if(!o)return;const e=Number(d?.corp_cash_reserves??0),t=Number(d?.corp_loans??0),i=Number(d?.corp_reputation??50),n=d?.faction_name||"Corporation",a=(d?.abbreviation||d?.corp_ticker||"??").toUpperCase(),s=t+ee,r=s>e*3?"#c55":s>e*1.5?"#c84":s>e?"#ca5":"#5c5",c=s>e*3?"DANGEROUS":s>e*1.5?"HEAVY":s>e?"MODERATE":"HEALTHY",p=ce==="none"?"10-16%":ce==="equipment"?"7-12%":ce==="property"?"5-9%":"4-7%",l=Math.round(ee*(ce==="none"?.13:ce==="equipment"?.095:ce==="property"?.07:.055)/12+ee/ut),v=Go.find(u=>u.id===ce)||Go[0];let m="";m+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:#5a8aaa;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Request Loan</span>
            </div>
            <span onclick="lrClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">From:</span>
            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${b(a)}</span>
            <span style="font-size:10px;color:#e8e4dc;">${b(n)}</span>
        </div>
    </div>`,m+='<div style="flex:1;overflow-y:auto;">',m+=`<div style="padding:6px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;">
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Your Financials (visible to lenders)</span>
    </div>
    <div style="display:flex;gap:0;border-bottom:1px solid #2a2a24;">
        <div style="flex:1;padding:6px 10px;text-align:center;border-right:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">CASH</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;margin-top:1px;">${x(e)}</div>
        </div>
        <div style="flex:1;padding:6px 10px;text-align:center;border-right:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">CURRENT DEBT</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#c84;margin-top:1px;">${x(t)}</div>
        </div>
        <div style="flex:1;padding:6px 10px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">REPUTATION</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#8b9a6b;margin-top:1px;">${i}</div>
        </div>
    </div>`,m+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">LOAN AMOUNT</span>
            <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#5a8aaa;">${x(ee)}</span>
        </div>
        <input type="range" min="1000000" max="5000000000" step="10000000" value="${ee}" oninput="lrSetAmount(this.value)" style="width:100%;height:4px;accent-color:#5a8aaa;" />
        <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;"><span>$1M</span><span>$5B</span></div>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">PURPOSE</div>
        <div style="display:flex;flex-direction:column;gap:3px;">`;for(const u of Ti){const g=Pt===u.id;m+=`<div onclick="lrSetPurpose('${u.id}')" style="display:flex;align-items:center;gap:8px;padding:5px 10px;cursor:pointer;background:${g?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${g?"#5a8aaa44":"#2a2a24"};border-left:2px solid ${g?"#5a8aaa":"transparent"};">
            <span style="font-family:var(--font-mono);font-size:10px;color:${g?"#5a8aaa":"#6a6660"};width:14px;text-align:center;">${u.icon}</span>
            <div><div style="font-size:11px;font-weight:600;color:${g?"#e8e4dc":"#9e9a92"};">${u.label}</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${u.desc}</div></div>
        </div>`}m+="</div></div>",m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">PREFERRED TERM</span>
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;">${ut} months</span>
        </div>
        <div style="display:flex;gap:3px;">`;for(const u of[12,24,36,48,60,84,120]){const g=ut===u;m+=`<span onclick="lrSetTerm(${u})" style="flex:1;text-align:center;padding:4px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;color:${g?"#000":"#6a6660"};background:${g?"#5a8aaa":"transparent"};border:1px solid ${g?"#5a8aaa":"#2a2a24"};">${u}</span>`}m+='</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Lenders may offer different terms. This is your preference, not a guarantee.</div></div>',m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">COLLATERAL OFFERED</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">`;for(const u of Go){const g=ce===u.id;m+=`<div onclick="lrSetCollateral('${u.id}')" style="padding:6px 8px;cursor:pointer;background:${g?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${g?"#5a8aaa44":"#2a2a24"};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${g?"#5a8aaa":"#6a6660"};">${u.label}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:${u.riskColor};">${u.risk} RISK</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${u.desc}</div>
        </div>`}if(m+="</div></div>",m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">NOTE TO LENDERS (OPTIONAL)</div>
        <textarea id="lr-note" rows="2" maxlength="300" onchange="lrNote=this.value"
            placeholder="e.g., Expanding into Heavy Infrastructure. Equipment purchase will generate $12M+ in annual contract revenue."
            style="width:100%;padding:6px 8px;font-family:var(--font-ui);font-size:10px;color:#e8e4dc;background:#1c1c18;border:1px solid #2a2a24;outline:none;resize:none;box-sizing:border-box;line-height:1.5;">${b(mo)}</textarea>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">Debt Impact Preview</div>
        <div style="background:#1c1c18;border:1px solid #2a2a24;padding:6px 10px;">
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CURRENT DEBT</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${x(t)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">+ THIS LOAN</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#5a8aaa;">+${x(ee)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#e8e4dc;">NEW TOTAL DEBT</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${x(s)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEBT HEALTH</span>
                <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${r};background:${r}12;border:1px solid ${r}25;">${c}</span>
            </div>
        </div>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">This request will be sent to</div>`,Et.length>0){m+='<div style="display:flex;flex-direction:column;gap:3px;">';for(const u of Et){const g=(u.corp_company_type||"").toLowerCase()==="state"?"#c84":(u.corp_company_type||"").toLowerCase()==="public"?"#5c5":"#c8a832";m+=`<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:#1c1c18;border:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c8a832;">${b((u.abbreviation||u.corp_ticker||"??").toUpperCase())}</span>
                <span style="font-size:10px;color:#e8e4dc;flex:1;">${b(u.faction_name)}</span>
                ${u.corp_company_type?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${g};background:${g}12;border:1px solid ${g}25;">${b(u.corp_company_type.toUpperCase())}</span>`:""}
            </div>`}m+="</div>"}else m+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No finance corporations in this nation yet.</div>';m+='<div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">All finance corporations in your nation will see this request. You choose which offer to accept.</div></div>',m+=`<div style="padding:8px 16px;">
        <div style="padding:6px 10px;background:rgba(90,138,170,0.04);border:1px solid rgba(90,138,170,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#5a8aaa;letter-spacing:0.8px;margin-bottom:4px;">ESTIMATED MARKET TERMS</div>
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. RATE RANGE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#e8e4dc;">${p}</div></div>
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. MONTHLY PAYMENT</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#e8e4dc;">~${x(l)}</div></div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Estimates based on collateral offer and current market rates. Actual terms set by each lender.</div>
        </div>
    </div>`,m+="</div>",m+=`<div style="padding:10px 16px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:12px;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">REQUESTING</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5a8aaa;">${x(ee)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">COLLATERAL</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;">${v.label}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">SENT TO</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#9e9a92;">${Et.length} lender${Et.length!==1?"s":""}</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="lrClose()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="lr-submit-btn" onclick="lrSubmit()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">SUBMIT REQUEST</div>
        </div>
    </div>`,m+='<div id="lr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>',o.innerHTML=m}let Xt=!1;async function qs(){if(!d||!z||Xt)return;const o=document.getElementById("lr-error");if(ee<1e6){o.textContent="Minimum loan amount is $1M.",o.style.display="block";return}if(ee>5e9){o.textContent="Maximum loan amount is $5B.",o.style.display="block";return}const t=((Ti.find(s=>s.id===Pt)||{}).label||Pt)+(mo?" — "+mo:""),i=document.getElementById("lr-submit-btn");Xt=!0,i.style.opacity="0.5",i.style.pointerEvents="none";const n=z.current_tick||0,{error:a}=await y.from("finance_loan_requests").insert({requesting_faction_id:d.id,nation_id:d.nation_id,amount:ee,term_months:ut,purpose:t,created_tick:n,expires_tick:n+5});if(i.style.opacity="1",i.style.pointerEvents="auto",a){Xt=!1,o.textContent="Failed to submit: "+a.message,o.style.display="block",i.style.opacity="1",i.style.pointerEvents="auto";return}Xt=!1,Ii()}function Mi(){if(!d)return;const o=Number(d.corp_loans??0),e=Number(d.corp_reputation??50),t=Number(d.corp_general_workforce??0),i=Number(d.corp_skilled_workforce??0),n=Number(d.corp_innovative_workforce??0),a=t+i+n;if(a===0){alert("Cannot restructure — no employees to lay off.");return}const s=Ie("COO"),r=s?s.skill:50,c=Gt(r),p=10+Math.floor(Math.random()*11),f=Math.round(a*p/100),l=Math.round(o*.07),v=Math.round(l*(2-c)),m=3+Math.floor(Math.random()*10),u=Math.max(1,Math.round(m*c)),g=Math.round(t/a*f),_=Math.round(i/a*f),$=Math.max(0,Math.min(n,f-g-_)),h=document.createElement("div");h.id="restr-overlay",h.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",h.onclick=function(k){k.target===h&&An()},h.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">
        <div style="padding:10px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;">
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
            <div style="background:#1c1c18;border:1px solid #2a2a24;padding:8px 12px;">
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">WORKFORCE REDUCTION</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${f} employees (${p}%)</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">General: ${t} &rarr; ${t-g}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${g}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Skilled: ${i} &rarr; ${i-_}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${_}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Innovative: ${n} &rarr; ${n-$}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${$}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEBT REDUCTION (~7%)</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">-${x(v)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">REPUTATION HIT</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${u} (${e} &rarr; ${Math.max(0,e-u)})</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#c84;margin-top:6px;">&#9888; This action cannot be undone. Laid-off workers must be re-hired.</div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid #2a2a24;display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseRestructure()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="restr-btn" onclick="actSubmitRestructure(${p},${v},${u},${g},${_},${$})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#8b9a6b;cursor:pointer;">RESTRUCTURE</div>
        </div>
        <div id="restr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(h)}function An(){const o=document.getElementById("restr-overlay");o&&o.remove()}let Zt=!1;async function Os(o,e,t,i,n,a){if(!d||!z||Zt)return;Zt=!0;const s=document.getElementById("restr-btn");s&&(s.style.opacity="0.4",s.style.pointerEvents="none");const r=Number(d.corp_general_workforce??0),c=Number(d.corp_skilled_workforce??0),p=Number(d.corp_innovative_workforce??0),f=Number(d.corp_loans??0),l=Number(d.corp_reputation??50),v={corp_general_workforce:Math.max(0,r-i),corp_skilled_workforce:Math.max(0,c-n),corp_innovative_workforce:Math.max(0,p-a),corp_loans:Math.max(0,f-e),corp_reputation:Math.max(0,l-t)},{error:m}=await y.from("factions").update(v).eq("id",d.id);if(m){Zt=!1;const _=document.getElementById("restr-error");_&&(_.textContent="Failed: "+m.message,_.style.display="block"),s&&(s.style.opacity="1",s.style.pointerEvents="auto");return}Object.assign(d,v);const u=z.current_tick||0,{error:g}=await y.from("event_log").insert({nation_id:d.nation_id,faction_id:d.id,event_name:(d.faction_name||"Corporation")+" — Restructuring",description_used:(d.faction_name||"A corporation")+" has announced a restructuring, laying off "+o+"% of its workforce.",category:"business",trigger_key:"corp_restructure",effects_applied:{layoff_pct:o,debt_cut:e,rep_loss:t},fired_at_tick:u});g&&console.warn("Failed to log restructure event:",g.message),Zt=!1,Bt("restructure"),An(),bt()}function Ai(){const o=Ie("CMO"),e=o?o.skill:50,t=Gt(e),i=Math.round(2e7*t),n=Math.max(1,Math.round(5*t)),a=Number(d?.corp_cash_reserves??0),s=Number(d?.corp_reputation??50),r=d?.faction_name||"",c=d?.abbreviation||d?.corp_ticker||"",p=document.createElement("div");p.id="rebrand-overlay",p.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",p.onclick=function(f){f.target===p&&Nn()},p.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">
        <div style="padding:10px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;">
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
            <input id="rebrand-name" type="text" maxlength="40" value="${b(r)}" placeholder="Corporation name"
                style="width:100%;padding:6px 10px;font-family:var(--font-ui);font-size:12px;color:#e8e4dc;background:#1c1c18;border:1px solid #2a2a24;outline:none;box-sizing:border-box;" />
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-top:10px;margin-bottom:6px;">NEW ABBREVIATION / TICKER</div>
            <input id="rebrand-abbr" type="text" maxlength="5" value="${b(c)}" placeholder="e.g. SZC" style="width:100px;padding:6px 10px;font-family:var(--font-mono);font-size:12px;font-weight:700;color:#c8a832;background:#1c1c18;border:1px solid #2a2a24;outline:none;text-transform:uppercase;" />
        </div>
        <div style="padding:8px 16px;border-top:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">Impact</div>
            <div style="background:#1c1c18;border:1px solid #2a2a24;padding:6px 10px;">
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">COST</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${x(i)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">REPUTATION</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${n} (${s} &rarr; ${Math.max(0,s-n)})</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">SKILL MODIFIER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${t<=1?"#5cb85c":"#c84"};">&times;${t.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CASH AFTER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${a<i?"#c55":"#e8e4dc"};">${x(a-i)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid #2a2a24;display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseRebrand()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="rebrand-btn" onclick="actSubmitRebrand(${i},${n})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c84;cursor:${a>=i?"pointer":"not-allowed"};${a<i?"opacity:0.4;pointer-events:none;":""}">REBRAND</div>
        </div>
        <div id="rebrand-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(p)}function Nn(){const o=document.getElementById("rebrand-overlay");o&&o.remove()}let eo=!1;async function Bs(o,e){if(!d||!z||eo)return;const t=o||2e7,i=e||5,n=document.getElementById("rebrand-error"),a=(document.getElementById("rebrand-name")?.value||"").trim().replace(/[<>"]/g,""),s=(document.getElementById("rebrand-abbr")?.value||"").trim().toUpperCase().replace(/[<>"]/g,"");if(!a||a.length<2){n&&(n.textContent="Name must be at least 2 characters.",n.style.display="block");return}if(!s||s.length<2||s.length>5){n&&(n.textContent="Abbreviation must be 2-5 characters.",n.style.display="block");return}const r=Number(d.corp_cash_reserves??0);if(r<t){n&&(n.textContent="Insufficient cash. Need "+x(t)+".",n.style.display="block");return}eo=!0;const c=document.getElementById("rebrand-btn");c&&(c.style.opacity="0.4",c.style.pointerEvents="none");const p=Number(d.corp_reputation??50),f=d.faction_name||"Corporation",{error:l}=await y.from("factions").update({faction_name:a,abbreviation:s,corp_ticker:s,corp_cash_reserves:r-t,corp_reputation:Math.max(0,p-i)}).eq("id",d.id);if(l){eo=!1,n&&(n.textContent="Failed: "+l.message,n.style.display="block"),c&&(c.style.opacity="1",c.style.pointerEvents="auto");return}d.faction_name=a,d.abbreviation=s,d.corp_ticker=s,d.corp_cash_reserves=r-t,d.corp_reputation=Math.max(0,p-i);const v=z.current_tick||0,{error:m}=await y.from("event_log").insert({nation_id:d.nation_id,faction_id:d.id,event_name:"Corporation Rebranded",description_used:f+" has rebranded to "+a+" ("+s+"). The rebrand costs $20M and reputation takes a temporary hit.",category:"corporate",trigger_key:"corp_rebrand",effects_applied:{old_name:f,new_name:a,new_abbr:s,rep_loss:i,cost:t},fired_at_tick:v});m&&console.warn("Failed to log rebrand event:",m.message),eo=!1,Bt("rebrand"),Nn(),bt(),document.getElementById("corp-name-bar").textContent=a;const u=document.getElementById("corp-logo");u&&(u.textContent=s.slice(0,2))}const Ps={liberty:"#9C27B0",equality:"#E91E63",freedom:"#5b9bd5",security:"#d48a3c",individualism:"#eab308",collectivism:"#ec4899",tradition:"#795548",progress:"#00BCD4",nationalism:"#FF5722",globalism:"#3F51B5"};function ot(o){return Ps[(o||"").toLowerCase()]||"#9C27B0"}let je=[],Ce=-1;async function Ni(){Number(d?.corp_cash_reserves??0);const o=new Set([d.nation_id]);for(const a of G||[])a.is_active&&a.nation_id&&o.add(a.nation_id);const e=[...o],t=new Set(he.map(a=>a.id)),{data:i}=await y.from("factions").select("id, faction_name, abbreviation, party_color, party_funds, seats, momentum, nation, nation_id, leader_ideology, linked_user_id, ideology_value_1, ideology_value_2").eq("faction_type","party").in("nation_id",e).is("abandoned_at",null).order("seats",{ascending:!1});je=(i||[]).filter(a=>!t.has(a.id)).map(a=>({...a})),Ce=-1;const n=document.createElement("div");n.id="donate-overlay",n.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",n.onclick=function(a){a.target===n&&Rn()},document.body.appendChild(n),Ri()}function Rn(){const o=document.getElementById("donate-overlay");o&&o.remove(),je=[],Ce=-1}function Ds(o){Ce=o,Ri()}function Ri(){const o=document.getElementById("donate-overlay");if(!o)return;const e=Ie("Lobbyist"),t=e?e.skill:50,i=Math.round(1e6*Gt(t)),n=1e5,a=Number(d?.corp_cash_reserves??0),s=Ce>=0?je[Ce]:null,r=a>=i;let c='<div onclick="event.stopPropagation()" style="width:540px;max-height:80vh;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">';c+=`<div style="padding:14px 20px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:10px;color:#8a6aaa;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Political Donation</span>
            </div>
            <span onclick="actCloseDonation()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Cost:</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#ca5;">${x(i)}</span>
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">&rarr; Target party receives</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#5cb85c;">+${x(n)}</span>
        </div>
        <div style="font-family:var(--font-mono);font-size:10px;color:#6a6660;margin-top:4px;">Parties in all nations where you have a presence. You cannot donate to your own party.</div>
    </div>`,c+='<div style="flex:1;overflow-y:auto;padding:10px 0;">',c+='<div style="padding:0 20px 8px;font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Select a Party</div>',je.length===0&&(c+='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#6a6660;">No eligible parties found.</div>');for(let p=0;p<je.length;p++){const f=je[p],l=Ce===p,v=f.party_color||"#8a6aaa",m=(f.momentum||0)>0?"#e8e4dc":"#c55";c+=`<div onclick="donateSelectParty(${p})" style="
            padding:10px 20px;
            border-bottom:1px solid #2a2a24;
            border-left:3px solid ${l?v:"transparent"};
            background:${l?v+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:10px;height:10px;background:${v};flex-shrink:0;"></div>
                    <div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-size:14px;font-weight:600;color:${l?"#e8e4dc":"#9e9a92"};">${b(f.faction_name)}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">${b(f.abbreviation||"??")} &middot; ${b(f.nation||"")} &middot; ${f.seats||0} seats</span>
                            ${f.ideology_value_1?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${ot(f.ideology_value_1)};background:${ot(f.ideology_value_1)}12;border:1px solid ${ot(f.ideology_value_1)}30;">${b(f.ideology_value_1.toUpperCase())}</span>`:""}
                            ${f.ideology_value_2?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${ot(f.ideology_value_2)};background:${ot(f.ideology_value_2)}12;border:1px solid ${ot(f.ideology_value_2)}30;">${b(f.ideology_value_2.toUpperCase())}</span>`:""}
                        </div>
                        <div style="display:flex;gap:12px;margin-top:4px;">
                            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Funds: <span style="color:#c8a832;font-weight:700;">${x(f.party_funds||0)}</span></span>
                            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Momentum: <span style="color:${m};font-weight:700;">${Number(f.momentum||0).toFixed(1)}</span></span>
                        </div>
                    </div>
                </div>
                ${l?'<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">SELECTED</span>':""}
            </div>
        </div>`}c+="</div>",c+=`<div style="padding:12px 20px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:16px;">
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">COST</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#ca5;">${x(i)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${r?"#e8e4dc":"#c55"};">${x(a)}</div></div>
            ${s?`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">RECIPIENT</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#e8e4dc;">${b(s.abbreviation||s.faction_name)}</div></div>`:""}
        </div>
        <div style="display:flex;gap:8px;">
            <div onclick="actCloseDonation()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="donate-btn" onclick="actSubmitDonation()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${s&&r?"#000":"#6a6660"};background:${s&&r?"#8a6aaa":"#2a2a24"};cursor:${s&&r?"pointer":"not-allowed"};${!s||!r?"opacity:0.4;pointer-events:none;":""}">DONATE</div>
        </div>
    </div>`,c+='<div id="donate-error" style="padding:6px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',c+="</div>",o.innerHTML=c}let wt=!1;async function js(){if(!d||!z||Ce<0||wt)return;const o=je[Ce];if(!o)return;const e=Number(z?.current_tick||0);if(new Set(he.map(E=>E.id)).has(o.id)){const E=document.getElementById("donate-error");E&&(E.textContent="You cannot donate to your own party.",E.style.display="block");return}const i=Ie("Lobbyist"),n=i?i.skill:50,a=Math.round(1e6*Gt(n)),s=1e5,r=2,{data:c,error:p}=await y.from("event_log").select("id").eq("faction_id",d.id).eq("trigger_key","corp_donation").eq("fired_at_tick",e).limit(1);if(p){const E=document.getElementById("donate-error");E&&(E.textContent="Failed to verify cooldown: "+p.message,E.style.display="block");return}if((c||[]).length>0){const E=document.getElementById("donate-error");E&&(E.textContent="Political Donation is on cooldown until next tick.",E.style.display="block"),Bt("donate");return}const{data:f}=await y.from("factions").select("corp_cash_reserves").eq("id",d.id).single(),l=Number(f?.corp_cash_reserves??0);if(l<a){const E=document.getElementById("donate-error");E&&(E.textContent="Insufficient cash. Need "+x(a)+", have "+x(l)+".",E.style.display="block");return}wt=!0;const v=document.getElementById("donate-btn");v&&(v.style.opacity="0.4",v.style.pointerEvents="none");const m=Number(d.corp_reputation??50),u=Math.max(0,m-r),{error:g}=await y.from("factions").update({corp_cash_reserves:l-a,corp_reputation:u}).eq("id",d.id);if(g){const E=document.getElementById("donate-error");wt=!1,E&&(E.textContent="Failed: "+g.message,E.style.display="block"),v&&(v.style.opacity="1",v.style.pointerEvents="auto");return}const{data:_}=await y.from("factions").select("party_funds").eq("id",o.id).single(),$=Number(_?.party_funds??0),{error:h}=await y.from("factions").update({party_funds:$+s}).eq("id",o.id);if(h){await y.from("factions").update({corp_cash_reserves:l}).eq("id",d.id);const E=document.getElementById("donate-error");wt=!1,E&&(E.textContent="Failed to transfer funds: "+h.message,E.style.display="block"),v&&(v.style.opacity="1",v.style.pointerEvents="auto");return}d.corp_cash_reserves=l-a,d.corp_reputation=u;const k=d.faction_name||"Corporation",{error:I}=await y.from("event_log").insert({nation_id:o.nation_id||d.nation_id,faction_id:d.id,event_name:k+" — Political Donation",description_chosen:k+" has donated "+x(a)+" to "+(o.faction_name||"a political party")+". The party receives "+x(s)+" in campaign funds. Corporate reputation decreases by "+r+".",category:"business",trigger_key:"corp_donation",effects_applied:{cost:a,recipient_faction_id:o.id,recipient_name:o.faction_name,funds_granted:s,reputation_loss:r,skill:n},fired_at_tick:e});I&&console.warn("Failed to log donation event:",I.message),wt=!1,Bt("donate"),Rn()}function Fs(o){ct=o,bt()}async function Us(o){if($e=o,ke=-1,document.getElementById("exec-search-overlay").style.display="flex",qt.length===0&&d?.nation_id){const{data:e}=await y.from("executive_pool").select("id").eq("nation_id",d.nation_id).limit(1);if(!e||e.length===0){const i=d.nation||"",n=ha(d.nation_id,i),{error:a}=await y.from("executive_pool").insert(n);a&&console.warn("Failed to generate executive pool:",a.message)}const{data:t}=await y.from("executive_pool").select("*").eq("nation_id",d.nation_id).eq("status","available").order("skill",{ascending:!1});qt=t||[]}Oi()}function Li(){document.getElementById("exec-search-overlay").style.display="none",$e=null,ke=-1}function qi(o){return qt.filter(e=>e.status==="available"&&Array.isArray(e.specializations)&&e.specializations.includes(o)).sort((e,t)=>t.skill-e.skill)}function Hs(o){ke=o,Oi()}let to=!1;async function Gs(){if(!d||!z||!$e||ke<0||to)return;const e=qi($e)[ke];if(!e)return;to=!0;const t=z.current_tick||0,i=document.getElementById("es-hire-btn");i&&(i.style.opacity="0.4",i.style.pointerEvents="none");const{error:n}=await y.from("corp_executives").insert({faction_id:d.id,role:$e,first_name:e.first_name,last_name:e.last_name,age:e.age,origin_nation:e.origin_nation,skill:e.skill,salary_per_year:e.required_salary,contract_years:e.required_years,contract_start_tick:t,contract_end_tick:t+e.required_years*12,status:"active"});if(n){to=!1;const s=document.getElementById("es-error");s&&(s.textContent="Failed: "+n.message,s.style.display="block"),i&&(i.style.opacity="1",i.style.pointerEvents="auto");return}const{error:a}=await y.from("executive_pool").update({status:"hired",hired_by_faction_id:d.id}).eq("id",e.id);a&&console.warn("Failed to mark pool candidate as hired:",a.message),to=!1,Li(),await ki(),ct=no.indexOf($e),ct<0&&(ct=0),bt()}function Oi(){const o=document.getElementById("exec-search-content");if(!o||!$e)return;const e=$e,t=io[e],i=qi(e),n=ke>=0?i[ke]:null;let a="";a+=`<div style="padding:12px 20px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:10px;color:${t.color};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Executive Search</span>
            </div>
            <span onclick="closeExecSearch()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:5px;">
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Hiring:</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:${t.color};">${b(e)}</span>
            <span style="font-size:13px;color:var(--text-bright,#f0efe6);">${b(t.fullTitle)}</span>
        </div>
    </div>`,a+='<div style="display:flex;flex:1;min-height:0;overflow:hidden;">',a+='<div style="width:300px;border-right:1px solid #2a2a24;overflow-y:auto;flex-shrink:0;">',i.length===0&&(a+=`<div style="padding:30px 20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No candidates available for this role in your nation.</div>
        </div>`);for(let s=0;s<i.length;s++){const r=i[s],c=ke===s,p=mt(r.skill);a+=`<div onclick="esSelectCandidate(${s})" style="
            padding:10px 14px;
            border-bottom:1px solid #2a2a24;
            border-left:3px solid ${c?t.color:"transparent"};
            background:${c?t.color+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:${t.color}10;border:1px solid ${t.color}22;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${t.color};flex-shrink:0;">${b(fo(r.first_name,r.last_name))}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;color:${c?"var(--text-bright,#f0efe6)":"#9e9a92"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(r.first_name)} ${b(r.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:4px;flex:1;">
                            <div style="flex:1;height:3px;background:#2a2a24;">
                                <div style="width:${r.skill}%;height:100%;background:${p};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:${p};width:18px;text-align:right;">${r.skill}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${st(r.required_salary)}/yr</span>
                    </div>
                </div>
            </div>
        </div>`}if(a+="</div>",a+='<div style="flex:1;overflow-y:auto;">',!n)a+=`<div style="padding:50px 24px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:14px;color:var(--text-dim);margin-bottom:10px;">Select a candidate</div>
            <div style="font-size:12px;color:#6a6660;">${i.length} candidate${i.length!==1?"s":""} available for ${b(e)}</div>
        </div>`;else{const s=n.required_salary*n.required_years,r=mt(n.skill);a+=`<div style="padding:20px;border-bottom:1px solid #2a2a24;">
            <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:64px;height:64px;background:${t.color}12;border:1px solid ${t.color}28;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:20px;font-weight:700;color:${t.color};">${b(fo(n.first_name,n.last_name))}</div>
                <div>
                    <div style="font-size:20px;font-weight:700;color:var(--text-bright,#f0efe6);">${b(n.first_name)} ${b(n.last_name)}</div>
                    <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-top:3px;">${b(n.origin_nation)} &middot; Age ${n.age}</div>
                </div>
            </div>
        </div>`,a+=`<div style="display:flex;gap:0;border-bottom:1px solid #2a2a24;">
            <div style="flex:1;padding:12px 14px;text-align:center;border-right:1px solid #2a2a24;">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">SKILL</div>
                <div style="display:flex;align-items:center;justify-content:center;gap:5px;margin-top:5px;">
                    <div style="width:60px;height:4px;background:#2a2a24;">
                        <div style="width:${n.skill}%;height:100%;background:${r};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${r};">${n.skill}</span>
                </div>
            </div>
            <div style="flex:1;padding:12px 14px;text-align:center;border-right:1px solid #2a2a24;">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">AGE</div>
                <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${n.age}</div>
            </div>
            <div style="flex:1;padding:12px 14px;text-align:center;">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">ORIGIN</div>
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${b(n.origin_nation)}</div>
            </div>
        </div>`,a+=`<div style="padding:12px 20px;border-bottom:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Role Specializations</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">`;for(const f of n.specializations||[]){const l=io[f],v=f===e;a+=`<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:3px 10px;color:${v?"#000":l?.color||"#9e9a92"};background:${v?l?.color||"#5a8aaa":(l?.color||"#5a8aaa")+"10"};border:1px solid ${v?"transparent":(l?.color||"#5a8aaa")+"30"};">${b(f)}</span>`}a+="</div></div>",a+=`<div style="padding:12px 20px;border-bottom:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Contract Terms</div>
            <div style="background:#1c1c18;border:1px solid #2a2a24;padding:10px 14px;">
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">CONTRACT LENGTH</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright,#f0efe6);">${n.required_years} years</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">ANNUAL SALARY</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#c84;">${st(n.required_salary)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright,#f0efe6);">TOTAL CONTRACT VALUE</span>
                    <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${st(s)}</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;margin-top:5px;">Salary is deducted from cash reserves each tick as an operating expense.</div>
        </div>`;const c=n.skill>=80?"EXCEPTIONAL":n.skill>=65?"STRONG":n.skill>=50?"COMPETENT":n.skill>=35?"DEVELOPING":"WEAK",p=n.skill>=80?"Elite talent. Actions have high success rate and reduced costs.":n.skill>=65?"Strong performer. Reliable outcomes across most actions.":n.skill>=50?"Adequate for the role. Outcomes are average.":n.skill>=35?"Below average. Actions may fail or cost more. Consider alternatives.":"Poor fit. High failure rates. Replacement recommended.";a+=`<div style="padding:12px 20px;">
            <div style="padding:8px 12px;background:${r}08;border:1px solid ${r}18;">
                <div style="font-family:var(--font-mono);font-size:10px;color:${r};letter-spacing:0.8px;margin-bottom:3px;">${c}</div>
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${p}</div>
            </div>
        </div>`}a+="</div>",a+="</div>",a+=`<div style="padding:12px 20px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:14px;">`,n?a+=`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CANDIDATE</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--text-bright,#f0efe6);">${b(n.first_name)} ${b(n.last_name)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SKILL</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${mt(n.skill)};">${n.skill}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SALARY</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:#c84;">${st(n.required_salary)}/yr</div></div>`:a+='<div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Select a candidate to hire</div>',a+=`</div>
        <div style="display:flex;gap:8px;">
            <div onclick="closeExecSearch()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="es-hire-btn" onclick="esHireCandidate()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${n?"#000":"#6a6660"};background:${n?t.color:"#2a2a24"};cursor:${n?"pointer":"not-allowed"};${n?"":"opacity:0.4;pointer-events:none;"}">HIRE</div>
        </div>
    </div>`,a+='<div id="es-error" style="padding:5px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',o.innerHTML=a}function ko(){return G.reduce((e,t)=>{const i=Number(t.capacity||0),n=Number(t.condition||0)/100;return e+Math.floor(i*n)},0)+500}function Vs(o,e){const t=We.find(a=>a.id===o),i=Number(d?.[t.factionKey]??0),n=oe[o]+e;if(!(i+n<0)){if(e>0){const a=We.reduce((r,c)=>{const p=Number(d?.[c.factionKey]??0),f=c.id===o?n:oe[c.id];return r+p+f},0),s=ko();if(a>s)return}oe[o]=n,Eo()}}function Ws(o){o?oe[o]=0:oe={general:0,skilled:0,innovative:0},Eo()}async function Ys(){if(Ho||!Object.values(oe).some(s=>s!==0))return;let e=0;for(const s of We){const r=oe[s.id];r>0&&(e+=r*_i(s.multiplier)*.1)}const t=Number(d?.corp_cash_reserves??0);if(e>t){alert("Insufficient cash reserves. Hiring cost: "+x(e)+", available: "+x(t));return}const i=We.reduce((s,r)=>s+Number(d?.[r.factionKey]??0)+oe[r.id],0),n=ko();if(i>n){alert("Cannot hire beyond property capacity ("+n.toLocaleString()+"). You need more workplaces.");return}const a=e>0?`Confirm workforce changes?

Hiring fee: `+x(e)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(a)){Ho=!0;try{const s={};for(const p of We){const f=Number(d?.[p.factionKey]??0);s[p.factionKey]=Math.max(0,f+oe[p.id])}e>0&&(s.corp_cash_reserves=Math.max(0,t-Math.round(e)));const{error:r}=await y.from("factions").update(s).eq("id",d.id);if(r)throw r;Object.assign(d,s),oe={general:0,skilled:0,innovative:0};const c=document.getElementById("topbar-cash");if(c){const p=Number(d.corp_cash_reserves??0);c.textContent="CASH: "+(p>=1e6?"$"+(p/1e6).toFixed(1)+"M":"$"+Math.round(p/1e3)+"k")}Eo()}catch(s){alert("Error: "+s.message)}finally{Ho=!1}}}function Eo(){const o=document.getElementById("hf-card-container");if(!o)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=Number(T?.minimum_wage??50),n=Number(T?.inflation??50),a=Number(T?.standard_of_living??50),s=i/100*48e3,r=(1+(n-50)/100*.5).toFixed(2),c=(1+(a-50)/100*.5).toFixed(2),p=T?.name||d?.nation||"Nation",f=Object.values(oe).some(h=>h!==0),l=ko();let v=0,m=0,u=0,g=0,_="";for(const h of We){const k=Number(d?.[h.factionKey]??0),I=oe[h.id],E=k+I,S=_i(h.multiplier),C=I>0,q=k*S,w=E*S,N=w-q;v+=k,m+=E,u+=q,g+=w;const R=I!==0?C?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";_+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${t.border};background:${R};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${h.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${h.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${t.text}">${k.toLocaleString()}</span>
                    ${I!==0?`<span style="font-family:${e};font-size:10px;color:${t.dim}">→</span>
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${C?t.greenBright:t.red}">${E.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${h.multiplier}.0 × ${r} × ${c})</span>
                <span style="font-family:${e};font-size:10px;color:${h.color}">${x(S)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${h.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.red};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-50</div>
                <div onclick="hfSetChange('${h.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.redDim};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${I!==0?t.card:"transparent"};border:1px solid ${I!==0?t.border:"transparent"}">
                    ${I!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${e};font-size:12px;font-weight:700;color:${C?t.greenBright:t.red}">${C?"+":""}${I}</span>
                        <span onclick="hfReset('${h.id}')" style="font-family:${e};font-size:8px;color:${t.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${e};font-size:9px;color:${t.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${h.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+10</div>
                <div onclick="hfSetChange('${h.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+50</div>
            </div>
            ${I!==0?`<div style="margin-top:6px;padding:4px 8px;background:${t.bg};border:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${N>0?t.red:t.greenBright}">${N>0?"+":""}${x(N)}/yr</span>
            </div>`:""}
        </div>`}const $=g-u;o.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Hire / Fire</span>
            </div>
            <span style="font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${p.toUpperCase()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            <div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:${t.card};">
                <div style="font-family:${e};font-size:8px;letter-spacing:1.5px;color:${t.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;gap:0;">
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">MIN WAGE</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${i}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">${x(s)}/yr</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">INFLATION</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${n}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${r}</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">STD OF LIVING</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${a}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${c}</div>
                    </div>
                </div>
            </div>
            ${_}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;${f?"margin-bottom:6px;":""}">
                <div>
                    <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">WORKFORCE / CAPACITY</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <span style="font-family:${e};font-size:13px;font-weight:700;color:${v>=l?t.red:t.text}">${f?m.toLocaleString():v.toLocaleString()}</span>
                        <span style="font-family:${e};font-size:9px;color:${t.dim}">/ ${l.toLocaleString()}</span>
                    </div>
                    ${v>=l&&!f?`<div style="font-family:${e};font-size:7px;color:${t.red};margin-top:2px;">Need workplaces to hire new employees.</div>`:""}
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${x(u)}</span>
                        ${f?`<span style="font-family:${e};font-size:9px;color:${t.dim}">→</span>
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${$>0?t.red:t.greenBright}">${x(g)}</span>`:""}
                    </div>
                </div>
            </div>
            ${f?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${t.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">NET CHANGE</span>
                    <span style="font-family:${e};font-size:11px;font-weight:700;color:${$>0?t.red:t.greenBright}">${$>0?"+":""}${x($)}/yr</span>
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">(${$>0?"+":""}${x(Math.round($/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${t.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}function Qs(){const o=document.getElementById("wf-summary-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},i=(T?.name||d?.nation||"Nation").toUpperCase(),n=Number(T?.minimum_wage??50),a=Number(T?.inflation??50),s=Number(T?.standard_of_living??50),r=n/100*48e3,c=1+(a-50)/100*.5,p=1+(s-50)/100*.5,f=[{label:"General Workforce",mult:2,color:t.accent,key:"corp_general_workforce",countColor:t.text},{label:"Skilled Workforce",mult:3,color:t.gold,key:"corp_skilled_workforce",countColor:t.blue},{label:"Innovative Workforce",mult:6,color:t.orange,key:"corp_innovative_workforce",countColor:t.gold}];let l=0,v=0,m="";for(const u of f){const g=Number(d?.[u.key]??0),_=Math.round(r*u.mult*c*p),$=g*_;l+=g,v+=$,m+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${u.label}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${i}</span>
                </div>
                <span style="font-family:${e};font-size:16px;font-weight:700;color:${u.countColor}">${g.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${u.mult}.0 × ${c.toFixed(2)} × ${p.toFixed(2)})</span>
                <span style="font-family:${e};font-size:10px;color:${t.muted}">${x(_)}/yr</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">TOTAL ANNUAL COST</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${x($)}</span>
            </div>
        </div>`}o.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Workforce</span>
            </div>
            <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.text}">${l.toLocaleString()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${m}
            <div style="padding:8px 12px;background:${t.card};border-bottom:1px solid ${t.border};">
                <div style="font-family:${e};font-size:8px;letter-spacing:1px;color:${t.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">MINIMUM WAGE (${i})</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">${n}/100 → ${x(r)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">INFLATION MODIFIER</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">×${c.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">STD OF LIVING MODIFIER</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">×${p.toFixed(2)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL WORKFORCE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.text}">${l.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL ANNUAL WAGES</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${x(v)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">PER TICK (÷12)</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${x(Math.round(v/12))}</span>
            </div>
        </div>
    </div>`}let G=[];async function Co(){if(!d?.id)return;const{data:o}=await y.from("corp_properties").select("*").eq("faction_id",d.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});G=o||[]}function So(){const o=document.getElementById("property-card-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=(T?.name||d?.nation||"Nation").toUpperCase(),n=1+(Number(T?.inflation??50)-50)/100*.3;let a="",s=0,r=0;const c=T?.name||d?.nation||"Home Nation",p=5e7,f=1+(Number(T?.inflation??50)-50)/100*.3,l=.8+Number(T?.stability??50)/100*.4,v=Math.round(p*f*l),m=Math.round(v*.005);s+=v,r+=m,a+=`
    <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span style="font-size:11px;font-weight:600;color:${t.text}">National Headquarters</span>
            <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:#5c5;background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">HQ</span>
        </div>
        <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:4px;">${c} · Headquarters</div>
        <div style="display:flex;gap:0;background:${t.card};border:1px solid ${t.border}">
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">CAPACITY</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">500</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">VALUE</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${x(v)}</div>
            </div>
            <div style="flex:1;padding:3px 6px">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${x(m)}</div>
            </div>
        </div>
    </div>`;for(const u of G){const g=uo[u.style]||uo.Basic;s+=Number(u.purchase_price||0),r+=Number(u.monthly_maintenance||0),a+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:${t.text}">${u.name}</span>
                <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${t.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">OWNED</span>
            </div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:4px;">${u.city||i} · ${(u.type||"").replace(/_/g," ")} · <span style="color:${g.color}">${(u.style||"Basic").toUpperCase()}</span></div>
            <div style="display:flex;gap:0;background:${t.card};border:1px solid ${t.border}">
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">CAPACITY</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${(u.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">PAID</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${x(u.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${x(u.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="margin-top:4px;display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">CONDITION</span>
                <span style="font-family:${e};font-size:9px;color:${u.condition>=75?"#5c5":u.condition>=50?"#ca5":t.orange}">${u.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:${t.border};margin-top:2px;"><div style="width:${u.condition}%;height:100%;background:${u.condition>=75?"#5c5":u.condition>=50?"#ca5":t.orange}"></div></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <div onclick="propRefurbish('${u.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.accent};border:1px solid ${t.accent}33;cursor:pointer;">REFURBISH (${x(Math.round((u.purchase_price||0)*.1*n))})</div>
                <div onclick="propSell('${u.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.red};border:1px solid ${t.red}33;cursor:pointer;">SELL</div>
            </div>
        </div>`}o.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Property</span>
            </div>
            <span style="font-family:${e};font-size:10px;color:${t.muted}">${G.length+1} ASSET${G.length+1!==1?"S":""}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${a}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL VALUE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.green}">${x(s)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL MAINTENANCE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${x(r)}/mo</span>
            </div>
        </div>
    </div>`}let rt=[],re=null;const uo={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function Ln(){if(!d?.nation_id)return;const{data:o,error:e}=await y.from("available_properties").select("*").eq("nation_id",d.nation_id).eq("status","available").order("price",{ascending:!0});if(e){console.warn("[Property] Failed to load marketplace:",e.message);return}const t=d?.corp_sector==="Construction";rt=(o||[]).filter(i=>t||i.type!=="warehouse").map(i=>({...i,adjusted_cost:i.price,adjusted_maintenance:i.monthly_maintenance}))}function To(){const o=document.getElementById("new-property-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"};(T?.name||d?.nation||"Nation").toUpperCase();const i=Number(T?.standard_of_living??50),n=Number(T?.gdp_growth??50),a=Number(T?.inflation??50),s=T?.capital||"Capital",r={capital:s,port:s+" Port",industrial:s+" Industrial Zone",suburban:s+" Suburbs",coastal:s+" Coast"};let c="";if(rt.length===0)c=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let p=0;p<rt.length;p++){const f=rt[p],l=re===p,v=uo[f.style]||uo.Basic,m=r[f.city_template]||s;c+=`
            <div onclick="npSelect(${p})" style="padding:8px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${l?t.accent:"transparent"};background:${l?"rgba(139,154,107,0.03)":"transparent"};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <span style="font-size:11px;font-weight:600;color:${t.text}">${f.name}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${v.color};background:${v.color}12;border:1px solid ${v.color}25">${v.label}</span>
                </div>
                <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:5px;">${m} · ${f.type.replace(/_/g," ")}</div>
                <div style="display:flex;gap:0;background:${t.card};border:1px solid ${t.border}">
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">CAPACITY</div>
                        <div style="font-family:${e};font-size:11px;font-weight:700;color:${t.text};margin-top:1px">${f.capacity.toLocaleString()}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">PRICE</div>
                        <div style="font-family:${e};font-size:11px;font-weight:700;color:${t.gold};margin-top:1px">${x(f.adjusted_cost)}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">MAINT/MO</div>
                        <div style="font-family:${e};font-size:11px;font-weight:700;color:${t.redDim};margin-top:1px">${x(f.adjusted_maintenance)}</div>
                    </div>
                </div>
                ${l?`<div style="margin-top:5px;">
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
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${rt.length} AVAILABLE</span>
        </div>
        <div style="padding:4px 14px;border-bottom:1px solid ${t.border};display:flex;gap:12px;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">STD OF LIVING</span>
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${i>=50?t.greenBright:t.yellow}">${Math.round(i)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">GDP GROWTH</span>
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${n>=50?t.greenBright:t.yellow}">${Math.round(n)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">INFLATION</span>
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${a<=50?t.greenBright:t.red}">${Math.round(a)}</span>
            </div>
        </div>
        <div style="flex:1;overflow:auto;">
            ${c}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;gap:6px;justify-content:space-between;">
                <div onclick="npOpenConstructionModal()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${t.gold};border:1px solid ${t.gold}44;cursor:pointer">CONSTRUCTION PROJECT</div>
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${re!==null?"#000":t.dim};background:${re!==null?t.accent:"transparent"};border:1px solid ${re!==null?t.accent:t.border};cursor:${re!==null?"pointer":"default"};opacity:${re!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function Ks(o){re=re===o?null:o,To()}let Vo=!1;async function Js(){if(re===null||Vo)return;const o=rt[re];if(!o)return;const e=Number(d?.corp_cash_reserves??0);if(o.adjusted_cost>e){alert(`Insufficient cash reserves.
Property: `+x(o.adjusted_cost)+`
Cash: `+x(e));return}if(confirm('Buy "'+o.name+'" for '+x(o.adjusted_cost)+`?

Monthly maintenance: `+x(o.adjusted_maintenance)+`/mo
Condition: `+o.condition+`%

This will be deducted from your cash reserves.`)){Vo=!0;try{const{error:t}=await y.from("corp_properties").insert({faction_id:d.id,nation_id:d.nation_id,catalog_id:o.catalog_id||null,name:o.name,type:o.type,style:o.style,capacity:o.capacity,purchase_price:o.adjusted_cost,monthly_maintenance:o.adjusted_maintenance,condition:o.condition,city:o.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(t)throw t;const i=Math.max(0,e-o.adjusted_cost),{error:n}=await y.from("factions").update({corp_cash_reserves:i}).eq("id",d.id);if(n)throw n;d.corp_cash_reserves=i,o.id&&await y.from("available_properties").update({status:"sold",purchased_by:d.id}).eq("id",o.id);const a=document.getElementById("topbar-cash");a&&(a.textContent="CASH: "+(i>=1e6?"$"+(i/1e6).toFixed(1)+"M":"$"+Math.round(i/1e3)+"k")),re=null,await Ln(),To(),So(),alert("Property purchased: "+o.name+`

Deducted: `+x(o.adjusted_cost))}catch(t){alert("Purchase failed: "+t.message)}finally{Vo=!1}}}const vt={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let qn=!1,A={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0,nationId:null,nationName:null},Wo=!1,un=[];function Bi(){const e=1+(Number(T?.inflation??50)-50)/100*.3,t=vt[A.style]?.costMod||1,i=A.type==="Warehouse"?.75:1,n=Math.round(A.size*1e5*e*t*i),a=Math.round(n*(1+A.budgetMod/100)),s=Math.round(a*.007*(vt[A.style]?.maintMod||1));return{baseBudget:n,adjusted:a,maint:s,inflMod:e,styleMod:t}}async function Xs(){qn=!0,A={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0,nationId:null,nationName:null};try{const{data:o}=await y.from("nations").select("id, name").order("name");un=(o||[]).filter(e=>e.id!==d?.nation_id)}catch{un=[]}Pi()}function On(){qn=!1,document.getElementById("cp-modal-overlay")?.remove()}function Zs(o,e){A[o]=e,Pi()}async function er(){if(!(Wo||!A.name.trim())){if(A.type==="Regional HQ"&&!A.nationId){alert("Select a target nation for the Regional HQ.");return}Wo=!0;try{const o=Bi(),e=A.type==="Regional HQ"?A.nationId:d.nation_id,t=A.type==="Regional HQ"?A.nationName||"Unknown":T?.name||d?.nation||"Unknown",i=vt[A.style]?.repGain||1,n=await y.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),a=n.data?.current_tick||0,s=(n.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:r}=await y.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",e).eq("issuer_type","PRIVATE"),p=`PVT-C${(r||0)+1}-${s}`,{error:f}=await y.from("construction_contracts").insert({nation_id:e,template_key:"custom_building",sector:"civil_engineering",name:A.name.trim(),project_type:A.type,project_subtype:A.style,description:`${A.type} (${A.style}) — ${A.size.toLocaleString()} employees, commissioned by ${d.faction_name}`,project_code:p,budget_ceiling:o.adjusted,timeline_ticks:A.timeline,required_materials:(()=>{const l=A.size/1e3,v=A.style,m={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[v]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},u=(g,_)=>Math.max(1,Math.ceil(l*g*_));return{concrete:u(8,m.concrete),steel:u(6,m.steel),glass_facades:u(3,m.glass),em_systems:u(4,m.em),lumber:u(1,m.lumber),heavy_parts:u(2,m.heavy),aggregate:u(3,m.agg)}})(),required_equipment:(()=>{const l=A.size,v={trucks:Math.ceil(l/2e3)+1,mixers:Math.ceil(l/3e3)+1};return l>1e3&&(v.excavators=Math.ceil(l/3e3)+1,v.cranes=Math.ceil(l/4e3)+1),l>3e3&&(v.bulldozers=Math.ceil(l/4e3)+1,v.haulers=Math.ceil(l/5e3)+1),l>8e3&&(v.piledrivers=Math.ceil(l/6e3)+1),v})(),required_workforce:{general:Math.ceil(A.size*.08),skilled:Math.ceil(A.size*.03)},status:"open",generated_at_tick:a,bidding_ends_tick:a+3,issuer_type:"PRIVATE",issuer_name:d.faction_name,issuer_faction_id:d.id});if(f)throw f;On(),alert(`Construction project submitted!

Project: `+A.name.trim()+`
Code: `+p+`
Budget: `+x(o.adjusted)+`
Expected Reputation: +`+Math.ceil(o.adjusted/1e8*3)+` (+3 per $100M)

All construction corporations in `+t+" can now bid on this project.")}catch(o){alert("Failed to submit project: "+o.message)}finally{Wo=!1}}}function Pi(){if(document.getElementById("cp-modal-overlay")?.remove(),!qn)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=Bi(),i=T?.name||d?.nation||"Nation",n=Math.ceil(t.adjusted/1e8*3),a=n>=4?e.gold:n>=3?e.greenBright:n>=2?e.accent:e.dim,s=Object.entries(vt).map(([p,f])=>{const l=A.style===p;return`<div onclick="cpSetField('style','${p}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${l?f.color+"18":"transparent"};border:1px solid ${l?f.color+"44":e.border};">
            <div style="font-family:${o};font-size:9px;font-weight:700;color:${l?f.color:e.dim}">${p}</div>
            <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:1px">×${f.costMod.toFixed(1)} cost</div>
        </div>`}).join(""),r=document.createElement("div");r.id="cp-modal-overlay",r.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",r.innerHTML=`
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
                <input id="cp-name-input" value="${A.name.replace(/"/g,"&quot;")}" placeholder="e.g., McKenna Tower"
                    style="width:100%;padding:8px 12px;font-family:${o};font-size:14px;color:${e.text};background:${e.card};border:1px solid ${e.border};outline:none;box-sizing:border-box;" />
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Type</div>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                    ${["Regional HQ","Office Building",...d?.corp_sector==="Construction"?["Warehouse"]:[],...d?.corp_subsector?.toLowerCase()==="banking"?["Branch Office"]:[],...d?.corp_subsector?.toLowerCase()==="investment"?["Trading Floor"]:[],...d?.corp_subsector?.toLowerCase()==="insurance"?["Claims Office"]:[]].map(p=>{const f=["Branch Office","Trading Floor","Claims Office"].includes(p),v=p==="Warehouse"?e.orange:f?"#8a6aaa":e.accent;return`<span onclick="cpSetField('type','${p}')" style="flex:1;min-width:100px;text-align:center;padding:6px 0;font-family:${o};font-size:12px;font-weight:700;cursor:pointer;color:${A.type===p?"#000":e.dim};background:${A.type===p?v:"transparent"};border:1px solid ${A.type===p?v:e.border}">${p}</span>`}).join("")}
                </div>
                ${A.type==="Regional HQ"?`<div style="margin-top:8px;">
                    <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Target Nation</div>
                    <select id="cp-nation-select" onchange="cpSetField('nationId', this.value); cpSetField('nationName', this.options[this.selectedIndex].text)"
                        style="width:100%;padding:8px 12px;font-family:${o};font-size:12px;color:${e.text};background:${e.card};border:1px solid ${e.border};outline:none;">
                        <option value="">-- Select a nation --</option>
                        ${un.map(p=>`<option value="${p.id}" ${A.nationId===p.id?"selected":""}>${p.name}</option>`).join("")}
                    </select>
                    <div style="font-family:${o};font-size:9px;color:${e.accent};margin-top:5px;">Regional HQ: Establishes corporate presence in another nation. Construction corps in that nation will bid on building it.</div>
                </div>`:""}
                ${A.type==="Warehouse"?`<div style="font-family:${o};font-size:9px;color:${e.orange};margin-top:5px;">Warehouse: 75% construction cost, stores up to $20M in materials</div>`:""}
                ${A.type==="Branch Office"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Branch Office: Increases lending capacity. +1 reputation per 200 employees. Enables cross-nation lending.</div>`:""}
                ${A.type==="Trading Floor"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Trading Floor: Enables secondary bond market. +1 reputation per 200 employees. Portfolio management bonuses.</div>`:""}
                ${A.type==="Claims Office"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Claims Office: Faster claim processing. +1 reputation per 200 employees. Local presence reduces premiums.</div>`:""}
            </div>

            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <span style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase">Size (Employees)</span>
                    <span style="font-family:${o};font-size:18px;font-weight:700;color:${e.text}">${A.size.toLocaleString()}</span>
                </div>
                <input type="range" min="500" max="18000" step="500" value="${A.size}" oninput="cpSetField('size',+this.value)"
                    style="width:100%;accent-color:${e.accent};height:5px;" />
                <div style="display:flex;justify-content:space-between;font-family:${o};font-size:9px;color:${e.dim};margin-top:3px">
                    <span>500 min</span><span>18,000 max</span>
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Style</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;">${s}</div>
                <div style="margin-top:5px;font-family:${o};font-size:10px;color:${vt[A.style].color}">${vt[A.style].desc}</div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <span style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase">Timeline</span>
                    <span style="font-family:${o};font-size:16px;font-weight:700;color:${e.text}">${A.timeline} months</span>
                </div>
                <input type="range" min="24" max="60" step="6" value="${A.timeline}" oninput="cpSetField('timeline',+this.value)"
                    style="width:100%;accent-color:${e.gold};height:5px;" />
                <div style="display:flex;justify-content:space-between;font-family:${o};font-size:9px;color:${e.dim};margin-top:3px">
                    <span>24 months</span><span>60 months</span>
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Budget</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:10px 12px;">
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border}">
                        <span style="font-family:${o};font-size:10px;color:${e.dim}">BASE (${A.size.toLocaleString()} × $100k × ${t.inflMod.toFixed(2)} × ${t.styleMod.toFixed(1)})</span>
                        <span style="font-family:${o};font-size:12px;color:${e.muted}">${x(t.baseBudget)}</span>
                    </div>
                    <div style="padding:8px 0">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                            <span style="font-family:${o};font-size:10px;color:${e.dim}">ADJUSTMENT</span>
                            <span style="font-family:${o};font-size:13px;font-weight:700;color:${A.budgetMod>0?e.greenBright:A.budgetMod<0?e.red:e.dim}">${A.budgetMod>0?"+":""}${A.budgetMod}%</span>
                        </div>
                        <input type="range" min="-15" max="15" step="1" value="${A.budgetMod}" oninput="cpSetField('budgetMod',+this.value)"
                            style="width:100%;accent-color:${e.accent};height:5px;" />
                        <div style="display:flex;justify-content:space-between;font-family:${o};font-size:9px;color:${e.dim};margin-top:3px">
                            <span>-15% (budget cut)</span><span>+15% (quality invest)</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:5px 0;border-top:1px solid ${e.border}">
                        <span style="font-family:${o};font-size:12px;font-weight:700;color:${e.text}">TOTAL BUDGET</span>
                        <span style="font-family:${o};font-size:18px;font-weight:700;color:${e.gold}">${x(t.adjusted)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0">
                        <span style="font-family:${o};font-size:10px;color:${e.dim}">EST. MONTHLY MAINTENANCE</span>
                        <span style="font-family:${o};font-size:12px;color:${e.redDim}">${x(t.maint)}/mo</span>
                    </div>
                </div>
            </div>

            <div style="padding:8px 10px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);margin-bottom:10px;">
                <div style="font-family:${o};font-size:10px;color:${e.gold};margin-bottom:3px">WHAT HAPPENS NEXT</div>
                <div style="font-size:12px;color:${e.dim};line-height:1.5">
                    This project will appear as a Civil Engineering bid in the Open Contracts pool for all construction corporations with an HQ or Regional HQ in ${i}. The lowest qualified bidder wins the contract and begins construction.
                </div>
            </div>

            <div style="padding:8px 10px;background:rgba(139,154,107,0.04);border:1px solid rgba(139,154,107,0.12);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:${o};font-size:12px;color:${e.accent}">EXPECTED REPUTATION GAIN</span>
                    <span style="font-family:${o};font-size:20px;font-weight:700;color:${a}">+${n}</span>
                </div>
                <div style="font-family:${o};font-size:9px;color:${e.dim};margin-top:3px">${A.style} style · ${n===5?"Maximum prestige":n>=4?"Impressive presence":n>=3?"Strong statement":n>=2?"Solid investment":"Functional addition"}</div>
            </div>

        </div>
        <div style="padding:12px 20px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${o};font-size:9px;color:${e.dim}">TOTAL PROJECT</div>
                <div style="font-family:${o};font-size:18px;font-weight:700;color:${e.gold}">${x(t.adjusted)}</div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="cpClose()" style="padding:7px 20px;font-family:${o};font-size:12px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:7px 20px;font-family:${o};font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${e.gold};cursor:pointer;opacity:${A.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(r);const c=document.getElementById("cp-name-input");c&&c.addEventListener("input",p=>{A.name=p.target.value}),r.addEventListener("click",p=>{p.target===r&&On()})}function tr(){const o=document.getElementById("cp-name-input");if(o&&(A.name=o.value),!A.name.trim()){alert("Please enter a building name.");return}er()}window.cpClose=On;window.cpSetField=Zs;window.cpSubmitFromModal=tr;window.npSelect=Ks;window.npBuyProperty=Js;window.npOpenConstructionModal=Xs;let yt=!1;async function or(o){if(yt)return;const e=G.find(r=>r.id===o);if(!e)return;const t=1+(Number(T?.inflation??50)-50)/100*.3,i=Math.round((e.purchase_price||0)*.1*t),n=Number(d?.corp_cash_reserves??0);if(i>n){alert("Insufficient cash. Refurbishment costs "+x(i)+" (inflation-adjusted), you have "+x(n));return}if(e.condition>=95){alert("Property is already in excellent condition ("+e.condition+"%).");return}const a=5+Math.floor(Math.random()*21),s=Math.min(100,e.condition+a);if(confirm('Refurbish "'+e.name+`"?

Cost: `+x(i)+`
Expected improvement: +`+a+"% condition ("+e.condition+"% → "+s+"%)")){yt=!0;try{await y.from("corp_properties").update({condition:s}).eq("id",o);const r=Math.max(0,n-i);await y.from("factions").update({corp_cash_reserves:r}).eq("id",d.id),d.corp_cash_reserves=r;const c=document.getElementById("topbar-cash");c&&(c.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")),await Co(),So(),alert("Refurbished! Condition: "+e.condition+"% → "+s+"%")}catch(r){alert("Refurbishment failed: "+r.message)}finally{yt=!1}}}async function nr(o){if(yt)return;const e=G.find(a=>a.id===o);if(!e)return;const t=1+(Number(T?.inflation??50)-50)/100*.3,i=(e.condition||50)/100,n=Math.round((e.purchase_price||0)*.6*i*t);if(confirm('Sell "'+e.name+`"?

Sale value: `+x(n)+" (60% × "+e.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){yt=!0;try{await y.from("corp_properties").update({is_active:!1}).eq("id",o);const s=Number(d?.corp_cash_reserves??0)+n;await y.from("factions").update({corp_cash_reserves:s}).eq("id",d.id),d.corp_cash_reserves=s;const c=(await y.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await y.from("available_properties").insert({nation_id:d.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,price:Math.round(n*1.1),monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,generated_at_tick:c,expires_at_tick:c+6,status:"available"});const p=document.getElementById("topbar-cash");p&&(p.textContent="CASH: "+(s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k")),await Co(),So(),await Ln(),To(),alert('Sold "'+e.name+'" for '+x(n))}catch(a){alert("Sale failed: "+a.message)}finally{yt=!1}}}window.propRefurbish=or;window.propSell=nr;const Be={SALE:.8,DISSOLVE:.6,REVENUE_BASE:.02,GDP_NEUTRAL:30,DEFAULT_REPUTATION:25};function ir(o){if(!o)return 0;const e=o.trim().replace(/[$,]/g,""),t=e.match(/^([\d.]+)\s*[Mm]$/),i=e.match(/^([\d.]+)\s*[Kk]$/);return Math.round(t?parseFloat(t[1])*1e6:i?parseFloat(i[1])*1e3:parseFloat(e))}function Je(o){const e=document.getElementById("topbar-cash");e&&(e.textContent="CASH: "+(o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k"))}function Di(o){return ht.find(e=>e.id===o)?.name||"—"}function zo(o){return G.filter(e=>e.nation_id===o)}async function Vt(){lt=0,await Co(),So(),Wt(),Yt()}let ie=!1,lt=0,oo={};async function ar(){if(d?.id)try{const{data:o}=await y.from("construction_contracts").select("nation_id").eq("awarded_to_faction",d.id).in("status",["in_progress","awarded"]);oo={};for(const e of o||[])e.nation_id&&(oo[e.nation_id]=(oo[e.nation_id]||0)+1)}catch{}}function ji(o){const e=zo(o.nation_id),t=e.reduce((u,g)=>u+Number(g.purchase_price||0),0),i=e.reduce((u,g)=>u+Number(g.capacity||0),0),n=oo[o.nation_id]||0,a=ht.find(u=>u.id===o.nation_id),s=(o.name||"").trim().split(/\s+/),r=s.length>=2?s.map(u=>u[0]).join("").toUpperCase().slice(0,4):(o.name||"SUB").slice(0,4).toUpperCase(),c=Number(o.sub_cash||0),p=Number(a?.gdp_growth??50),f=c*Be.REVENUE_BASE,l=(p-Be.GDP_NEUTRAL)/100,v=Be.DEFAULT_REPUTATION/100,m=c>0?Math.round(f*(1+l)*v):0;return{id:o.id,name:o.name,abbr:r,nation:a?.name||o.city||"—",nationId:o.nation_id,sector:d?.corp_sector||"General",subsector:o.subsector||d?.corp_subsector||"—",revenue:m,debt:0,cash:c,reputation:Be.DEFAULT_REPUTATION,valuation:t,workforce:i,projects:n,established:o.created_at?new Date(o.created_at).getFullYear().toString():"—",trend:p>=40&&c>0?"up":p>=Be.GDP_NEUTRAL&&c>0?"flat":"down",profitable:m>0,hqProp:o}}function Wt(){const o=document.getElementById("manage-subsidiaries-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=G.filter(f=>f.type==="regional_hq").map(ji);lt>=n.length&&(lt=0);const a=n[lt]||null;let s="";n.length===0&&(s=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No subsidiaries established.<br>Use Create Subsidiary to expand.</div>`);let r=0,c=0;for(let f=0;f<n.length;f++){const l=n[f],v=f===lt;r+=l.revenue,c+=l.valuation;const m=l.trend==="up"?t.greenBright:l.trend==="down"?t.red:t.dim,u=l.trend==="up"?"▲":l.trend==="down"?"▼":"–";s+=`
        <div onclick="selectSubsidiary(${f})" style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${v?t.accent:"transparent"};background:${v?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:40px;font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${l.abbr}</span>
            <div style="flex:1.5;">
                <div style="font-size:11px;font-weight:600;color:${t.text};line-height:1.2">${l.name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${l.subsector}</div>
            </div>
            <span style="width:65px"><span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${l.nation.toUpperCase().slice(0,8)}</span></span>
            <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${l.profitable?t.greenBright:t.redDim};text-align:right">${x(l.revenue)}</span>
            <span style="width:40px;font-family:${e};font-size:9px;font-weight:700;color:${l.reputation>=40?t.accent:l.reputation>=25?t.yellow:t.orange};text-align:right">${l.reputation}</span>
            <span style="width:55px;font-family:${e};font-size:9px;color:${t.muted};text-align:right">${x(l.valuation)}</span>
            <span style="width:12px;font-family:${e};font-size:8px;color:${m};text-align:right">${u}</span>
        </div>`}let p="";if(a){const f=a.trend==="up"?t.greenBright:a.trend==="down"?t.red:t.dim,l=a.trend==="up"?"▲":a.trend==="down"?"▼":"–",v=a.trend==="up"?"Growing":a.trend==="down"?"Declining":"Stable",m=a.reputation>=40?t.accent:a.reputation>=25?t.yellow:t.orange,u=[{label:"Revenue",value:x(a.revenue),color:a.profitable?t.greenBright:t.redDim},{label:"Cash",value:x(a.cash),color:t.text},{label:"Debt",value:a.debt>0?x(a.debt):"$0",color:a.debt>0?t.orange:t.dim},{label:"Reputation",value:a.reputation+"/100",color:m},{label:"Market Valuation",value:x(a.valuation),color:t.gold},{label:"Workforce",value:a.workforce.toLocaleString(),color:t.text},{label:"Active Projects",value:a.projects.toString(),color:a.projects>0?t.text:t.dim}],g=a.projects===0,_=a.hqProp?.logo_url?`<img src="${b(a.hqProp.logo_url)}" alt="" style="width:32px;height:32px;object-fit:cover;border-radius:4px;">`:`<label style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:${t.card};border:1px dashed ${t.border};border-radius:4px;cursor:pointer;font-size:14px;color:${t.dim};" title="Upload subsidiary logo">+<input type="file" accept="image/*" id="sub-logo-upload" data-prop-id="${a.hqProp?.id||""}" style="display:none;"></label>`;p=`
            <div style="padding:8px 14px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                    ${_}
                    <div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.gold}">${a.abbr}</span>
                            <span style="font-size:12px;font-weight:700;color:${t.text}">${a.name}</span>
                        </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${a.nation.toUpperCase()}</span>
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">Est. ${a.established}</span>
                    <span style="font-family:${e};font-size:8px;color:${f}">${l} ${v}</span>
                </div>
                    </div>
                </div>
            </div>
            ${u.map($=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 14px;border-bottom:1px solid ${t.border};">
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
                    <div onclick="${g?"subDissolve('"+a.id+"')":""}" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${g?t.red:t.dim};border:1px solid ${g?t.red:t.border};opacity:${g?1:.3}">DISSOLVE</div>
                </div>
                ${a.projects>0?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${t.dim}">Cannot dissolve with active projects.</div>`:""}
            </div>`}else p=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a subsidiary to manage.</div>`;if(o.innerHTML=`
    <div style="width:760px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Manage Subsidiaries</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${n.length} ACTIVE</span>
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
                <div style="flex:1;overflow:auto;">${s}</div>
                <div style="padding:6px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;display:flex;align-items:center;">
                    <span style="width:40px"></span>
                    <span style="flex:1.5;font-family:${e};font-size:8px;color:${t.dim}">COMBINED</span>
                    <span style="width:65px"></span>
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${x(r)}</span>
                    <span style="width:40px"></span>
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${x(c)}</span>
                    <span style="width:12px"></span>
                </div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${p}
            </div>
        </div>
    </div>`,document.getElementById("sub-logo-upload")?.addEventListener("change",async f=>{const l=f.target.files?.[0],v=f.target.dataset.propId;if(!(!l||!v)){if(l.size>2*1024*1024){alert("Logo must be under 2MB.");return}try{const m=l.name.split(".").pop()?.toLowerCase()||"png",u=`party-logos/${d.id}/sub_${v}_${Date.now()}.${m}`,{error:g}=await y.storage.from("public-assets").upload(u,l,{contentType:l.type,upsert:!0});if(g)throw g;const{data:_}=y.storage.from("public-assets").getPublicUrl(u),$=_?.publicUrl;if($){await y.from("corp_properties").update({logo_url:$}).eq("id",v);const h=G.find(k=>k.id===v);h&&(h.logo_url=$),Wt()}}catch(m){alert("Upload failed: "+(m.message||"Error"))}}}),a&&(a.subsector==="Insurance"||a.subsector==="Banking")){const f="sub-dashboard-"+a.id;setTimeout(()=>{document.getElementById(f)&&ca(y,{faction:d,nation:T,shard:z},f,a.id).catch(l=>console.error("[SubDash] Init failed:",l))},50)}}async function Fi(o,e){if(ie)return;const t=G.find(m=>m.id===o);if(!t)return;const i=e==="sell",n=i?Be.SALE:Be.DISSOLVE,a=i?"SELL":"DISSOLVE",s=i?"sold":"dissolved",r=i?"80%":"60%",c=Di(t.nation_id),p=zo(t.nation_id),f=p.reduce((m,u)=>m+Math.round((u.purchase_price||0)*n*(u.condition||50)/100),0),l=Number(t.sub_cash||0),v=f+l;if(confirm(a+' subsidiary "'+t.name+`"?

`+p.length+" properties at "+r+` × condition:
  Property value: `+x(f)+`
  Subsidiary cash: `+x(l)+`
  ─────────────────
  Total return: `+x(v)+`

All operations in `+c+` cease.
This cannot be undone.`)){ie=!0;try{const m=p.map(g=>g.id);if(m.length===1){const{error:g}=await y.from("corp_properties").update({is_active:!1}).eq("id",m[0]);if(g)throw g}else if(m.length>1){const{error:g}=await y.from("corp_properties").update({is_active:!1}).in("id",m);if(g)throw g}await y.from("corp_properties").update({sub_cash:0}).eq("id",o).then(()=>{}).catch(()=>{});const u=Number(d?.corp_cash_reserves??0)+v;await y.from("factions").update({corp_cash_reserves:u}).eq("id",d.id),d.corp_cash_reserves=u,Je(u),await Vt(),alert("Subsidiary "+s+". "+p.length+` properties liquidated.
Total received: `+x(v))}catch(m){alert("Failed: "+m.message)}finally{ie=!1}}}function sr(o){Fi(o,"sell")}async function rr(o){if(ie)return;const e=G.find(r=>r.id===o);if(!e)return;const t=Di(e.nation_id),n=zo(e.nation_id).reduce((r,c)=>r+Math.round((c.purchase_price||0)*.8*(c.condition||50)/100),0),a=Number(e.sub_cash||0),s=Math.round(a*.05);if(confirm('PUT UP FOR SALE: "'+e.name+`"

Nation: `+t+`
Estimated Valuation: `+x(n)+`
Subsidiary Cash: `+x(a)+`
Subsector: `+(e.subsector||"General")+`

This will list your subsidiary on the marketplace.
Other corporations can place bids (minimum $1M).
You review and accept bids.

Continue?`)){ie=!0;try{const r=z?.current_tick||0,{data:c,error:p}=await y.from("subsidiary_sales").insert({subsidiary_id:o,seller_faction_id:d.id,nation_id:e.nation_id,subsidiary_name:e.name,subsector:e.subsector||null,valuation:n,monthly_revenue:s,sub_cash_at_listing:a,employee_count:e.capacity||0,status:"listed",listed_at_tick:r}).select("*").single();if(p){alert("Failed to list: "+p.message);return}alert('"'+e.name+`" is now listed for sale.

Other corporations will see it on the Expansion tab and can place bids.`),await Vt()}catch(r){alert("Failed: "+r.message)}finally{ie=!1}}}let vo=[],Ui="ready",zt=null;async function Io(){const o=await ma(y);vo=o.listings,Ui=o.state,zt=o.error,zt&&console.error("[SubMarket] Load failed:",zt.message)}function Mo(){let o=document.getElementById("sub-marketplace-card");o||(o=document.createElement("div"),o.id="sub-marketplace-card",document.getElementById("expansion-content")?.appendChild(o));const e=vo.filter(s=>s.seller_faction_id!==d?.id),t=vo.filter(s=>s.seller_faction_id===d?.id),i="'JetBrains Mono',monospace",n={surface:"#1a1a17",card:"#1c1c18",border:"rgba(255,255,255,0.06)",dim:"#4a4940",muted:"#666",text:"#c4c2b8",bright:"#f0efe6",orange:"#c84",green:"#5cb85c",red:"#d9534f",gold:"#c8a832"};let a=`<div style="width:760px;background:${n.surface};border:1px solid ${n.border};font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:10px 14px;border-bottom:1px solid ${n.border};display:flex;align-items:center;gap:8px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${n.orange};display:inline-block;"></span>
            <span style="font-family:${i};font-size:11px;font-weight:700;letter-spacing:1.5px;color:${n.orange};text-transform:uppercase;">Subsidiary Marketplace</span>
            <span style="font-family:${i};font-size:9px;color:${n.dim};">${e.length} available</span>
        </div>`;if(t.length>0){a+=`<div style="padding:8px 14px;border-bottom:1px solid ${n.border};background:${n.card};">
            <div style="font-family:${i};font-size:8px;letter-spacing:1px;color:${n.gold};text-transform:uppercase;margin-bottom:6px;">YOUR LISTINGS</div>`;for(const s of t){const c=(s.subsidiary_bids||[]).filter(p=>p.status==="pending");a+=`<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:11px;font-weight:700;color:${n.bright};">${b(s.subsidiary_name)}</span>
                    <span style="font-family:${i};font-size:8px;color:${n.dim};margin-left:6px;">${b(s.subsector||"")}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${i};font-size:9px;color:${c.length>0?n.green:n.dim};">${c.length} bid${c.length!==1?"s":""}</span>
                    ${c.length>0?`<span onclick="subViewBids('${s.id}')" style="font-family:${i};font-size:8px;font-weight:700;padding:3px 8px;color:${n.green};border:1px solid ${n.green}44;cursor:pointer;">VIEW BIDS</span>`:""}
                    <span onclick="subCancelSale('${s.id}')" style="font-family:${i};font-size:8px;font-weight:700;padding:3px 8px;color:${n.red};border:1px solid ${n.red}44;cursor:pointer;">CANCEL</span>
                </div>
            </div>`}a+="</div>"}if(Ui==="error")a+=`<div style="padding:24px 14px;text-align:center;font-family:${i};font-size:10px;color:${n.red};font-style:italic;">${b(zt&&zt.message||"Subsidiary marketplace is temporarily unavailable.")}</div>`;else if(e.length===0)a+=`<div style="padding:24px 14px;text-align:center;font-family:${i};font-size:10px;color:${n.dim};font-style:italic;">No subsidiaries for sale right now.</div>`;else for(const s of e){const r=(s.subsidiary_bids||[]).find(f=>f.bidder_faction_id===d?.id&&f.status==="pending"),p=(_allNations||[]).find(f=>f.id===s.nation_id)?.name||"Unknown";a+=`<div style="padding:10px 14px;border-bottom:1px solid ${n.border};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:12px;font-weight:700;color:${n.bright};">${b(s.subsidiary_name)}</span>
                        <span style="font-family:${i};font-size:7px;font-weight:700;padding:1px 5px;color:${n.orange};border:1px solid ${n.orange}44;background:${n.orange}0a;">${b(s.subsector||"General")}</span>
                    </div>
                    <span style="font-family:${i};font-size:8px;color:${n.dim};">${b(p)}</span>
                </div>
                <div style="display:flex;gap:16px;font-family:${i};font-size:8px;color:${n.muted};margin-bottom:8px;">
                    <span>Valuation: <strong style="color:${n.text};">${x(s.valuation)}</strong></span>
                    <span>Revenue: <strong style="color:${n.text};">${x(s.monthly_revenue)}/mo</strong></span>
                    <span>Cash: <strong style="color:${n.text};">${x(s.sub_cash_at_listing)}</strong></span>
                    <span>Staff: <strong style="color:${n.text};">${s.employee_count}</strong></span>
                </div>
                <div style="display:flex;justify-content:flex-end;">
                    ${r?`<span style="font-family:${i};font-size:8px;font-weight:700;color:${n.green};">✓ BID PLACED: ${x(r.bid_amount)}</span>`:`<span onclick="subPlaceBid('${s.id}','${b(s.subsidiary_name)}',${s.valuation})" style="font-family:${i};font-size:8px;font-weight:700;padding:4px 14px;color:#000;background:${n.orange};cursor:pointer;">PLACE BID</span>`}
                </div>
            </div>`}a+="</div>",o.innerHTML=a}async function lr(o,e,t){const i=prompt('Place bid for "'+e+`"

Valuation: `+x(t)+`
Minimum bid: $1M

Enter bid amount ($):`);if(!i)return;const n=Math.round(Number(i));if(isNaN(n)||n<1e6){alert("Minimum bid is $1,000,000.");return}const a=Number(d?.corp_cash_reserves??0);if(n>a){alert("Insufficient funds. You have "+x(a)+".");return}const{error:s}=await y.from("subsidiary_bids").insert({sale_id:o,bidder_faction_id:d.id,bid_amount:n,status:"pending",placed_at_tick:z?.current_tick||0});if(s){s.message.includes("duplicate")||s.message.includes("unique")?alert("You already have a bid on this subsidiary."):alert("Failed to place bid: "+s.message);return}alert("Bid of "+x(n)+' placed on "'+e+`".
The seller will review your bid.`),await Io(),Mo()}async function dr(o){const e=vo.find(v=>v.id===o);if(!e)return;const t=(e.subsidiary_bids||[]).filter(v=>v.status==="pending");if(t.length===0){alert("No pending bids.");return}const i=t.map(v=>v.bidder_faction_id),{data:n}=await y.from("factions").select("id, faction_name").in("id",i),a={};(n||[]).forEach(v=>{a[v.id]=v.faction_name});let s='Bids for "'+e.subsidiary_name+`":

`;const r=t.sort((v,m)=>m.bid_amount-v.bid_amount);for(let v=0;v<r.length;v++){const m=r[v];s+=v+1+". "+(a[m.bidder_faction_id]||"Unknown")+": "+x(m.bid_amount)+`
`}s+=`
Enter the number of the bid to accept (or cancel):`;const c=prompt(s);if(!c)return;const p=parseInt(c,10)-1;if(isNaN(p)||p<0||p>=r.length){alert("Invalid selection.");return}const f=r[p],l=a[f.bidder_faction_id]||"Unknown";confirm("Accept bid of "+x(f.bid_amount)+" from "+l+`?

This will transfer ownership of "`+e.subsidiary_name+`" to them.
You will receive `+x(f.bid_amount)+` in cash.

This cannot be undone.`)&&await cr(e,f)}let Yo=!1;async function cr(o,e){if(!Yo){Yo=!0;try{const n=z?.current_tick||0,{data:a}=await y.from("factions").select("corp_cash_reserves").eq("id",e.bidder_faction_id).single(),s=Number(a?.corp_cash_reserves??0);if(s<e.bid_amount){alert("Buyer has insufficient funds. Bid cannot be completed."),await y.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:n}).eq("id",e.id);return}var{error:t}=await y.from("factions").update({corp_cash_reserves:s-e.bid_amount}).eq("id",e.bidder_faction_id);if(t){alert("Failed to deduct from buyer: "+t.message);return}const r=Number(d?.corp_cash_reserves??0);var{error:i}=await y.from("factions").update({corp_cash_reserves:r+e.bid_amount}).eq("id",d.id);if(i){await y.from("factions").update({corp_cash_reserves:s}).eq("id",e.bidder_faction_id),alert("Failed to credit seller: "+i.message);return}d.corp_cash_reserves=r+e.bid_amount,await y.from("corp_properties").update({faction_id:e.bidder_faction_id}).eq("id",o.subsidiary_id);const c=G.filter(p=>p.nation_id===o.nation_id&&p.faction_id===d.id);for(const p of c)await y.from("corp_properties").update({faction_id:e.bidder_faction_id}).eq("id",p.id);await y.from("subsidiary_sales").update({status:"completed",completed_at_tick:n,accepted_bid_id:e.id}).eq("id",o.id),await y.from("subsidiary_bids").update({status:"accepted",resolved_at_tick:n}).eq("id",e.id),await y.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:n}).eq("sale_id",o.id).neq("id",e.id),Je(d.corp_cash_reserves),alert("Sale complete! Received "+x(e.bid_amount)+`.

"`+o.subsidiary_name+'" has been transferred to the buyer.'),await Vt(),await Io(),Mo()}catch(n){console.error("[SubMarket] Accept bid error:",n),alert("Transfer failed: "+n.message)}finally{Yo=!1}}}async function pr(o){if(!confirm("Cancel this listing? The subsidiary will no longer be for sale."))return;const{error:e}=await y.from("subsidiary_sales").update({status:"cancelled"}).eq("id",o);if(e){alert("Failed: "+e.message);return}await Io(),Mo()}function fr(o){Fi(o,"dissolve")}async function Hi(o,e){if(ie)return;const t=G.find(l=>l.id===o);if(!t)return;const i=Number(d?.corp_cash_reserves??0),n=Number(t.sub_cash||0),a=e?"WITHDRAW":"INJECT CAPITAL";if(e&&n<=0){alert("This subsidiary has no cash to withdraw.");return}const s=e?n:i,r=prompt(a+(e?" from ":" into ")+t.name+`

Parent cash: `+x(i)+`
Subsidiary cash: `+x(n)+`

Enter amount (e.g., 5000000 or 5M):`);if(!r)return;const c=ir(r);if(!c||c<=0||isNaN(c)){alert("Invalid amount.");return}if(c>s){alert("Insufficient "+(e?"subsidiary":"parent")+" cash. Available: "+x(s));return}const p=e?i+c:i-c,f=e?n-c:n+c;if(confirm(a+" "+x(c)+(e?" from ":" into ")+t.name+`?

Parent: `+x(i)+" → "+x(p)+`
Subsidiary: `+x(n)+" → "+x(f))){ie=!0;try{await Promise.all([y.from("factions").update({corp_cash_reserves:p}).eq("id",d.id),y.from("corp_properties").update({sub_cash:f}).eq("id",o)]),d.corp_cash_reserves=p,t.sub_cash=f,Je(p),Wt(),alert((e?"Withdrew ":"Injected ")+x(c)+(e?" from ":" into ")+t.name+".")}catch(l){alert("Failed: "+l.message)}finally{ie=!1}}}function mr(o){Hi(o,!1)}function ur(o){Hi(o,!0)}async function vr(o){if(ie)return;const e=G.find(g=>g.id===o);if(!e)return;const t=ji(e);t.nation;const i=zo(e.nation_id),n=t.valuation,a=t.cash,s=t.reputation,r=t.subsector,c=Math.round(n*2.25),p=Math.round(s*.1),f=Math.round(s*.2),l=ko(),v=We.reduce((g,_)=>g+Number(d?.[_.factionKey]??0),0),m=Math.max(0,l-v),u=Number(d?.corp_cash_reserves??0);if(c>u){alert(`Insufficient cash to acquire subsidiary.

Acquisition cost (2.25× valuation): `+x(c)+`
Available cash: `+x(u));return}if(t.projects>0){alert("Cannot merge — subsidiary has "+t.projects+" active project(s). Complete or abandon them first.");return}if(confirm('MERGE "'+e.name+`" INTO YOUR CORPORATION

Acquisition cost (2.25× valuation): `+x(c)+`
Subsidiary cash absorbed: `+x(a)+`
Net cost: `+x(c-a)+`

• `+i.length+` properties transferred to parent
• Subsidiary subsector "`+r+`" added to portfolio
• Workers hired to max capacity (+`+m.toLocaleString()+`)
• Reputation: +`+p+" or -"+f+" (from sub rep "+s+`)

This cannot be undone.`)){ie=!0;try{const g=d.nation_id;if(i.length>0){const C=i.filter(w=>w.id!==e.id).map(w=>w.id);if(C.length===1){const{error:w}=await y.from("corp_properties").update({nation_id:g,type:"office"}).eq("id",C[0]);if(w)throw w}else if(C.length>1){const{error:w}=await y.from("corp_properties").update({nation_id:g,type:"office"}).in("id",C);if(w)throw w}const{error:q}=await y.from("corp_properties").update({nation_id:g,type:"office",sub_cash:0,subsector:null}).eq("id",e.id);if(q)throw q}const _=u-c+a,h=Number(d?.corp_general_workforce??0)+m,k=Math.random()>=.5?p:-f,I=Number(d?.standing??50),E=Math.max(0,Math.min(100,I+k)),{error:S}=await y.from("factions").update({corp_cash_reserves:_,corp_general_workforce:h,standing:E}).eq("id",d.id);if(S)throw S;d.corp_cash_reserves=_,d.corp_general_workforce=h,d.standing=E,Je(_),await Vt(),alert(`Merger complete!

"`+e.name+`" absorbed into your corporation.
Cost: `+x(c)+" | Cash absorbed: "+x(a)+`
Reputation `+(k>=0?"+":"")+k+" (now "+E+`)
Workers hired: +`+m.toLocaleString()+` general workforce
Properties: `+i.length+" transferred to parent")}catch(g){alert("Merge failed: "+g.message)}finally{ie=!1}}}window.subDissolve=fr;window.subInjectCapital=mr;window.subWithdraw=ur;window.subMerge=vr;window.subSell=sr;window.subPutForSale=rr;window.subPlaceBid=lr;window.subViewBids=dr;window.subCancelSale=pr;window.selectSubsidiary=function(o){lt=o,Wt()};let ht=[],It={},me=null,Qo=!1,Xe="",Dt="",Ze="",ze="";const Gi={Construction:4,Finance:5,Shipping:4},yr=["Construction","Shipping","Finance"],Vi={Construction:[{id:"civil",name:"Civil Engineering",mod:0},{id:"industrial",name:"Industrial Construction",mod:.25},{id:"mega",name:"Megaprojects",mod:.4}],Shipping:[{id:"bulk_cargo",name:"Bulk Cargo",mod:0},{id:"container_freight",name:"Container Freight",mod:.2},{id:"specialized_transport",name:"Specialized Transport",mod:.35}],Finance:[{id:"banking",name:"Banking",mod:0},{id:"insurance",name:"Insurance",mod:.15},{id:"investment",name:"Investment Management",mod:.3}],Technology:[{id:"software",name:"Software Development",mod:0},{id:"hardware",name:"Hardware Manufacturing",mod:.2},{id:"telecom",name:"Telecommunications",mod:.35}],Energy:[{id:"oil_gas",name:"Oil & Gas",mod:0},{id:"renewables",name:"Renewables",mod:.2},{id:"mining",name:"Mining",mod:.3}],Healthcare:[{id:"pharma",name:"Pharmaceuticals",mod:0},{id:"hospitals",name:"Hospital Systems",mod:.2},{id:"biotech",name:"Biotechnology",mod:.35}]};async function gr(){const{data:o,error:e}=await y.from("nations").select("*").order("name");e&&console.warn("[Subsidiary] Failed to load nations:",e.message),ht=(o||[]).filter(i=>i.id!==d?.nation_id);const{data:t}=await y.from("factions").select("nation_id").eq("faction_type","corporation").is("abandoned_at",null);It={};for(const i of t||[])i.nation_id&&(It[i.nation_id]=(It[i.nation_id]||0)+1);Ze=d?.corp_sector||"",ze=d?.corp_subsector||""}function Wi(){const o=Ze||d?.corp_sector||"";return Vi[o]||[{id:"general",name:o||"General",mod:0}]}function xr(o){Ze=o;const e=Vi[o];ze=e?e[0].name:"",Yt()}function Yi(){const o=d?.corp_sector||"";return Ze===o?1:Gi[Ze]||4}function br(){const e=Wi().find(t=>t.name===ze);return e?e.mod:0}function vn(o){const e=Number(o.standard_of_living??50);return Math.max(.5,Math.round(e/50*100)/100)}function Qi(o){const t=Yi(),i=1+br(),n=vn(o);return Math.round(Math.max(1e7,5e7*t*i*n))}function _r(o){const e=It[o]||0;return e<=1?{label:"HIGH",color:"#5c5"}:e<=3?{label:"MODERATE",color:"#ca5"}:{label:"LOW",color:"#c55"}}function hr(o){if(me=me===o?null:o,me){const e=ht.find(t=>t.id===me);Xe=(d?.faction_name||"Subsidiary")+" "+(e?.name||"")}else Xe="";Yt()}function $r(o){ze=o,Yt()}function wr(o){Xe=o}function kr(o){Dt=o.toUpperCase().slice(0,4)}async function Er(){if(Qo||!me)return;const o=ht.find(s=>s.id===me);if(!o)return;const e=(Xe||"").trim(),t=(Dt||"").trim();if(!e){alert("Please enter a corporation name for the subsidiary.");return}if(t.length<2){alert("Please enter an abbreviation (2-4 chars).");return}if(G.find(s=>s.nation_id===o.id&&s.type==="regional_hq")){alert("You already have a subsidiary in "+o.name);return}const n=Qi(o),a=Number(d?.corp_cash_reserves??0);if(n>a){alert("Insufficient cash. Entry cost: "+x(n)+", available: "+x(a));return}if(confirm("Establish subsidiary in "+o.name+`?

Name: `+e+" ("+t+`)
Subsector: `+(ze||"General")+`
Entry cost: `+x(n)+`
Creates a Regional HQ (500 capacity)
Unlocks `+o.name+` for operations

Deducted from cash reserves.`)){Qo=!0;try{const r=(await y.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0,c=85+Math.floor(Math.random()*16),p=Math.round(n*.005),{error:f}=await y.from("corp_properties").insert({faction_id:d.id,nation_id:o.id,name:e,type:"regional_hq",style:"Modern",capacity:500,purchase_price:n,monthly_maintenance:p,condition:c,city:o.capital||o.name,purchased_at_tick:r,is_active:!0,subsector:ze||d?.corp_subsector||null});if(f)throw f;const l=Math.max(0,a-n);await y.from("factions").update({corp_cash_reserves:l}).eq("id",d.id),d.corp_cash_reserves=l,Je(l);const v=Ze||d?.corp_sector||"Unknown";try{await y.from("event_log").insert({nation_id:o.id,event_name:"New Subsidiary Established",category:"corporate",description_chosen:`${d.faction_name} has invested ${x(n)} to establish ${e}, a new ${v} corporation in ${o.name}.`,fired_at_tick:z?.current_tick||0})}catch{}try{const{data:m}=await y.from("nations").select("gdp_growth").eq("id",o.id).single();m&&await y.from("nations").update({gdp_growth:Math.min(100,Number(m.gdp_growth||50)+.2)}).eq("id",o.id)}catch{}me=null,Xe="",Dt="",await Vt(),alert('Subsidiary "'+e+'" established in '+o.name+`!

Cost: `+x(n)+`
Regional HQ created with `+c+"% condition.")}catch(s){alert("Failed: "+s.message)}finally{Qo=!1}}}function Yt(){const o=document.getElementById("create-subsidiary-container");if(!o)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=d?.corp_sector||"General",n=d?.corp_subsector||"",a=Wi(),s=a.find(w=>w.name===ze)||a[0],r=new Set(G.filter(w=>w.type==="regional_hq").map(w=>w.nation_id)),c=ht.filter(w=>!r.has(w.id)),p=me?c.find(w=>w.id===me):null,f=Xe.trim().length>0&&Dt.trim().length>=2&&p!==null,l=Ze||i,v=Yi();let m=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Sector</div>
        <div style="display:flex;gap:3px;">
            ${yr.map(w=>{const N=w===l,R=w===i,D=R?1:Gi[w]||4,U=R?t.greenBright:t.orange;return`<div onclick="subSetSector('${w}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${N?t.accent+"18":"transparent"};border:1px solid ${N?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${N?t.accentBright:t.dim}">${w}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${U}">${R?"PARENT · ×1":"×"+D+" COST"}</div>
                </div>`}).join("")}
        </div>
        ${v>1?`<div style="font-family:${e};font-size:7px;color:${t.orange};margin-top:4px;padding:3px 6px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);">Cross-sector subsidiary: base cost ×${v}</div>`:""}
    </div>`,u=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsector</div>
        <div style="display:flex;gap:3px;">
            ${a.map(w=>{const N=w.name===ze,R=w.name===n;return`<div onclick="subSetSubsector('${w.name.replace(/'/g,"\\'")}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${N?t.accent+"18":"transparent"};border:1px solid ${N?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:8px;font-weight:700;color:${N?t.accentBright:t.dim}">${w.name}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${R?t.greenBright:w.mod>0?t.orange:t.dim}">${R?"SAME — ±0%":w.mod>0?"+"+Math.round(w.mod*100)+"%":"±0%"}</div>
                </div>`}).join("")}
        </div>
    </div>`,g="";if(c.length===0)g=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Subsidiaries in all available nations.</div>`;else for(const w of c){const N=w.id===me,R=_r(w.id),D=It[w.id]||0,U=Math.round(Number(w.standard_of_living??50)),F=vn(w);g+=`
            <div onclick="subSelectNation('${w.id}')" style="display:flex;align-items:center;padding:4px 8px;margin-bottom:2px;cursor:pointer;background:${N?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${N?t.accent+"44":t.border};border-left:${N?"2px solid "+t.accent:"2px solid transparent"};">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:11px;font-weight:600;color:${N?t.text:t.muted}">${w.name}</span>
                        <span style="font-family:${e};font-size:7px;font-weight:700;padding:0 4px;color:${R.color};background:${R.color}12;border:1px solid ${R.color}25;line-height:12px">${R.label}</span>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:2px;">
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">STD/LIVING: <span style="color:${t.muted}">${U}</span></span>
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">CORPS: <span style="color:${D>=4?t.red:D>=2?t.yellow:t.greenBright}">${D}</span></span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${F>1?t.orange:t.greenBright}">×${F.toFixed(2)}</div>
                </div>
            </div>`}let _=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="margin-bottom:6px;">
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Corporation Name</div>
            <input type="text" value="${(Xe||"").replace(/"/g,"&quot;")}" oninput="subSetName(this.value)" placeholder="e.g., ${(d?.faction_name||"Corp")+" "+(p?.name||"International")}" style="width:100%;padding:5px 8px;font-family:${e};font-size:10px;color:${t.text};background:${t.card};border:1px solid ${t.border};outline:none;box-sizing:border-box;" />
        </div>
        <div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Abbreviation (2-4 chars)</div>
            <input type="text" value="${(Dt||"").replace(/"/g,"&quot;")}" oninput="subSetAbbr(this.value)" placeholder="${(d?.faction_name||"CORP").slice(0,2).toUpperCase()+(p?.name||"XX").slice(0,2).toUpperCase()}" maxlength="4" style="width:80px;padding:5px 8px;font-family:${e};font-size:12px;font-weight:700;color:${t.gold};background:${t.card};border:1px solid ${t.border};outline:none;text-align:center;letter-spacing:2px;" />
        </div>
    </div>`;const $=[{rule:"Bid on projects in that nation",icon:"✓",color:t.greenBright},{rule:"Hires local workers at nation rates",icon:"✓",color:t.greenBright},{rule:"Must use parent's materials & vehicles",icon:"!",color:t.orange},{rule:"Reputation gain: 75% sub / 25% parent",icon:"◐",color:t.gold},{rule:"Market revenue at 50% parent rate",icon:"◐",color:t.gold},{rule:"Counts as domestic corporation",icon:"✓",color:t.greenBright},{rule:"Starting reputation: 25",icon:"●",color:t.muted}];let h=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsidiary Rules</div>
        <div style="background:${t.card};border:1px solid ${t.border};padding:6px 8px;">
            ${$.map((w,N)=>`<div style="display:flex;align-items:center;gap:6px;padding:2px 0;${N<$.length-1?"border-bottom:1px solid "+t.border:""}">
                <span style="font-family:${e};font-size:9px;color:${w.color};width:12px;text-align:center">${w.icon}</span>
                <span style="font-size:9px;color:${t.muted}">${w.rule}</span>
            </div>`).join("")}
        </div>
    </div>`;const k=5e7,I=s.mod,E=p?vn(p):null,S=p?Qi(p):null,C=Math.round(k*v*(1+I));let q=`
    <div style="background:${t.bg};border:1px solid ${t.border};padding:6px 8px;margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">BASE</span>
            <span style="font-family:${e};font-size:9px;color:${t.muted}">${x(k)}</span>
        </div>
        ${v>1?`<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">SECTOR (${l})</span>
            <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.orange}">×${v}</span>
        </div>`:""}
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">SUBSECTOR (${s.name})</span>
            <span style="font-family:${e};font-size:9px;color:${I===0?t.greenBright:t.orange}">${I===0?"±0%":"+"+Math.round(I*100)+"%"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">NATION (${p?p.name:"select below"})</span>
            <span style="font-family:${e};font-size:9px;color:${p?E>1?t.orange:t.greenBright:t.dim}">${p?"×"+E.toFixed(2):"—"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:3px 0;">
            <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.text}">TOTAL COST</span>
            <span style="font-family:${e};font-size:14px;font-weight:700;color:${t.gold}">${p?x(S):"~"+x(C)}</span>
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
            ${u}
            <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
                <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Nation</div>
                ${g}
            </div>
            ${_}
            ${h}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            ${q}
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
    </div>`}window.subSelectNation=hr;window.subCreate=Er;window.subSetName=wr;window.subSetAbbr=kr;window.subSetSector=xr;window.subSetSubsector=$r;let Mt=[],Fe=0,yo=JSON.parse(localStorage.getItem("nationhood_investigated_corps")||"{}"),ge="ALL",Oe="REPUTATION";async function Cr(){const[o,e]=await Promise.all([y.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, corp_reputation, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name"),y.from("corp_properties").select("id, faction_id, name, nation_id, subsector, type, factions(faction_name, corp_sector, corp_ticker, abbreviation, corp_reputation, corp_company_type, linked_user_id)").eq("type","regional_hq").eq("is_active",!0)]),t={};for(const s of o.data||[])t[s.id]=s;const i=(o.data||[]).map(s=>{const r=(s.corp_company_type||"Private").toUpperCase(),c=Number(s.corp_cash_reserves||0);return{...s,abbr:s.corp_ticker||s.abbreviation||s.faction_name?.slice(0,4).toUpperCase()||"???",status:r,isPlayer:!!s.linked_user_id,reputation:Math.round(Number(s.corp_reputation??50)),revenue:Math.round(c*.1),valuation:Math.round(c*3),_isSub:!1}}),{data:n}=await y.from("nations").select("id, name"),a={};(n||[]).forEach(s=>{a[s.id]=s.name});for(const s of e.data||[]){const r=t[s.faction_id];if(!r)continue;const c=(r.corp_company_type||"Private").toUpperCase();i.push({id:s.id,faction_name:s.name||"Subsidiary",abbreviation:r.abbreviation,corp_sector:r.corp_sector,corp_subsector:s.subsector||r.corp_subsector,corp_ticker:r.corp_ticker,nation_id:s.nation_id,nation:a[s.nation_id]||"?",abbr:(r.corp_ticker||r.abbreviation||"??").slice(0,4),status:c,isPlayer:!!r.linked_user_id,reputation:Math.round(Number(r.corp_reputation??50)),revenue:0,valuation:0,_isSub:!0,_parentName:r.faction_name})}Mt=i}function Sr(o){Fe=o,Qt()}function Tr(o){ge=o,Fe=0,Qt()}function zr(o){Oe=o,Fe=0,Qt()}async function Ir(o){if(!d||!z)return;const e=Number(d.corp_cash_reserves??0);if(e<5e5){alert("Insufficient cash. Need $500k.");return}const{error:t}=await y.from("factions").update({corp_cash_reserves:e-5e5}).eq("id",d.id);if(t){alert("Failed: "+t.message);return}d.corp_cash_reserves=e-5e5,yo[o]=!0,localStorage.setItem("nationhood_investigated_corps",JSON.stringify(yo));const{data:i}=await y.from("factions").select("corp_cash_reserves, corp_loans, corp_reputation, corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce").eq("id",o).single();if(i){const n=Mt.find(a=>a.id===o);if(n){Object.assign(n,i);const a=Number(i.corp_cash_reserves||0);n.reputation=Math.round(Number(i.corp_reputation??50)),n.revenue=Math.round(a*.1),n.valuation=Math.round(a*3)}}Qt()}function Qt(){const o=document.getElementById("corporations-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i={PUBLIC:{color:t.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:t.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:t.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},n=[...new Set(Mt.map(m=>m.nation).filter(Boolean))];let a=[...Mt];ge!=="ALL"&&(a=a.filter(m=>m.nation===ge)),Oe==="REPUTATION"?a.sort((m,u)=>(u.reputation||0)-(m.reputation||0)):Oe==="REVENUE"?a.sort((m,u)=>(u.revenue||0)-(m.revenue||0)):Oe==="VALUATION"&&a.sort((m,u)=>(u.valuation||0)-(m.valuation||0)),Fe>=a.length&&(Fe=0);const s=a[Fe]||null;z?.current_tick;const r=s&&!!yo[s.id],c=s&&s.status==="PRIVATE"&&!r,p=s&&s.status==="STATE";let f="";a.length===0&&(f=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No corporations found.</div>`);for(let m=0;m<a.length;m++){const u=a[m],g=m===Fe,_=i[u.status]||i.PRIVATE,$=u.status==="PRIVATE"&&!yo[u.id];f+=`
        <div onclick="corpSelect(${m})" style="display:flex;align-items:center;padding:7px 16px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${g?t.accent:"transparent"};background:${g?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:42px;font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${u.abbr}</span>
            <div style="flex:1.3;">
                <div style="font-size:11px;font-weight:600;color:${t.text};line-height:1.2">${u.faction_name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${u._isSub?'<span style="color:#8a6aaa;">SUB</span> · ':""}${u.corp_subsector||u.corp_sector||"—"}</div>
            </div>
            <span style="width:62px"><span style="font-family:${e};font-size:8px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(u.nation||"—").toUpperCase().slice(0,6)}</span></span>
            <span style="width:56px;font-family:${e};font-size:9px;font-weight:700;color:${$?t.dim:t.muted};text-align:right">${$?"—":x(u.revenue)}</span>
            <span style="width:34px;font-family:${e};font-size:10px;font-weight:700;color:${u.reputation>=70?t.greenBright:u.reputation>=40?t.accent:t.yellow};text-align:right">${u.reputation}</span>
            <span style="width:56px;font-family:${e};font-size:9px;color:${$?t.dim:t.muted};text-align:right">${$?"—":x(u.valuation)}</span>
            <span style="width:48px;text-align:center"><span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${_.color};background:${_.bg};border:1px solid ${_.border}">${u.status}</span></span>
        </div>`}let l="";if(s){const m=i[s.status]||i.PRIVATE,u=[...s._isSub?[{label:"Parent",value:s._parentName||"—",color:"#8a6aaa"}]:[],{label:"Sector",value:s.corp_sector||"—",color:t.text},{label:"Subsector",value:s.corp_subsector||"—",color:t.accent},{label:"Reputation",value:s.reputation+"/100",color:s.reputation>=70?t.greenBright:s.reputation>=40?t.accent:t.yellow},{label:"Revenue",value:c?"UNDISCLOSED":x(s.revenue),color:c?t.dim:t.greenBright},{label:"Cash Reserves",value:c?"UNDISCLOSED":x(s.corp_cash_reserves||0),color:c?t.dim:t.text},{label:"Market Valuation",value:c?"UNDISCLOSED":x(s.valuation),color:c?t.dim:t.gold}];l=`
        <div style="padding:10px 16px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                <span style="font-family:${e};font-size:14px;font-weight:700;color:${t.gold}">${s.abbr}</span>
                <span style="font-size:14px;font-weight:700;color:${t.text}">${s.faction_name}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
                <span style="font-family:${e};font-size:8px;padding:2px 6px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(s.nation||"—").toUpperCase()}</span>
                <span style="font-family:${e};font-size:8px;font-weight:700;padding:2px 6px;color:${m.color};background:${m.bg};border:1px solid ${m.border}">${s.status}</span>
                ${s._isSub?`<span style="font-family:${e};font-size:8px;font-weight:700;padding:2px 6px;color:#8a6aaa;background:rgba(138,106,170,0.08);border:1px solid rgba(138,106,170,0.2)">SUBSIDIARY</span>`:""}
                ${s.isPlayer?`<span style="font-family:${e};font-size:8px;font-weight:700;padding:2px 6px;color:${t.blue};background:rgba(90,138,170,0.08);border:1px solid rgba(90,138,170,0.2)">PLAYER</span>`:`<span style="font-family:${e};font-size:8px;color:${t.dim}">NPC</span>`}
            </div>
        </div>
        ${u.map(g=>`<div style="display:flex;justify-content:space-between;padding:5px 16px;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:10px;color:${t.dim};text-transform:uppercase">${g.label}</span>
            <span style="font-family:${e};font-size:11px;font-weight:700;color:${g.value==="UNDISCLOSED"?t.dim:g.color};${g.value==="UNDISCLOSED"?"font-style:italic;":""}">${g.value}</span>
        </div>`).join("")}
        <div style="padding:6px 14px;border-bottom:1px solid ${t.border};flex-shrink:0;">
            <div style="width:100%;height:4px;background:${t.border}"><div style="width:${s.reputation}%;height:100%;background:${s.reputation>=70?t.greenBright:s.reputation>=40?t.accent:t.yellow}"></div></div>
        </div>
        ${c?`<div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:rgba(200,168,50,0.03);">
            <div style="font-family:${e};font-size:8px;color:${t.gold};margin-bottom:2px">PRIVATE — FINANCIALS UNDISCLOSED</div>
            <div style="font-size:9px;color:${t.dim};line-height:1.4">Use INVESTIGATE to reveal financial data for 12 ticks.</div>
        </div>`:""}
        ${p?`<div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:rgba(204,136,68,0.03);">
            <div style="font-family:${e};font-size:8px;color:${t.orange};margin-bottom:2px">STATE-OWNED ENTERPRISE</div>
            <div style="font-size:9px;color:${t.dim};line-height:1.4">Government-controlled. Cannot be acquired directly. May be privatized by parliamentary vote.</div>
        </div>`:""}
        <div style="flex:1"></div>
        <div style="padding:6px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="font-family:${e};font-size:8px;letter-spacing:1.5px;color:${t.dim};text-transform:uppercase;margin-bottom:6px">Actions</div>
            <div style="display:flex;gap:4px;margin-bottom:4px;">
                <div onclick="${c?`corpInvestigate('${s.id}')`:""}" style="flex:1;padding:5px 0;text-align:center;cursor:${c?"pointer":"default"};font-family:${e};font-size:8px;font-weight:700;color:${c?t.blue:r?t.greenBright:t.dim};border:1px solid ${c?t.blue+"44":r?t.greenBright+"44":t.border};opacity:${c?1:.3}">${r?"INVESTIGATED ✓":"INVESTIGATE — $500k"}</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;color:${t.accent};border:1px solid ${t.accent}44">PARTNER</div>
            </div>
            <div style="display:flex;gap:4px;">
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${p?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${p?t.dim:t.gold};border:1px solid ${p?t.border:t.gold+"44"};opacity:${p?.3:1}">ACQUIRE</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${p?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${p?t.dim:t.orange};border:1px solid ${p?t.border:t.orange+"44"};opacity:${p?.3:1}">MERGER</div>
            </div>
            ${p?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${t.dim}">State-owned corps cannot be acquired or merged.</div>`:""}
        </div>`}else l=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a corporation to view details.</div>`;const v=`
    <div style="padding:6px 16px;border-bottom:1px solid ${t.border};background:${t.card};display:flex;gap:12px;align-items:center;flex-shrink:0;">
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px;width:40px">NATION</span>
            <span onclick="corpFilterNation('ALL')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${ge==="ALL"?"#000":t.dim};background:${ge==="ALL"?t.accent:"transparent"};border:1px solid ${ge==="ALL"?t.accent:t.border}">ALL</span>
            ${n.map(m=>`<span onclick="corpFilterNation('${m}')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${ge===m?"#000":t.dim};background:${ge===m?t.accent:"transparent"};border:1px solid ${ge===m?t.accent:t.border}">${m}</span>`).join("")}
        </div>
        <div style="flex:1"></div>
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">SORT</span>
            ${["REPUTATION","REVENUE","VALUATION"].map(m=>`<span onclick="corpSort('${m}')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${Oe===m?"#000":t.dim};background:${Oe===m?t.accent:"transparent"};border:1px solid ${Oe===m?t.accent:t.border}">${m}</span>`).join("")}
        </div>
    </div>`;o.innerHTML=`
    <div style="width:760px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Corporations</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${Mt.length} IN DATABASE</span>
        </div>
        ${v}
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
                ${l}
            </div>
        </div>
    </div>`}window.corpSelect=Sr;window.corpInvestigate=Ir;window.corpFilterNation=Tr;window.corpSort=zr;let be=null,Se={},Q=120,Te=15,yn={},dt=[];async function Mr(){if(!Ve)return;if(gt[Ve.id]){alert("You already have a bid on this contract. Retract it first if you want to re-bid.");return}be=Ve,yn={};try{const{data:t}=await y.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",d.id);for(const i of t||[])yn[ao(i.material_key)]=Number(i.quantity||0)}catch{}dt=[];try{const{data:t}=await y.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",be.id).in("status",["pending","won"]);dt=(t||[]).filter(i=>i.faction_id!==d?.id).map(i=>({name:i.factions?.faction_name||"Unknown",ticker:i.factions?.corp_ticker||"???",price:Number(i.bid_price||0),quality:Number(i.estimated_quality||0),status:i.status}))}catch{}Se={};const o=be.required_materials||{};for(const t of Object.keys(o))Se[t]="STD";const e=be.required_workforce||{};Q=Number(e.general||0)+Number(e.skilled||0)||120,Te=15,Ht(),Ao()}function Bn(){document.getElementById("bid-assembly-overlay")?.remove(),be=null}function Ar(o,e){Se[o]=e,Ao()}function Nr(o){Q=o,Ao()}function Rr(o){Te=o,Ao()}function Ao(){if(document.getElementById("bid-assembly-overlay")?.remove(),!be)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=be,i=t.issuer_type==="GOVERNMENT",n=T?.name||d?.nation||"—",a=Number(t.budget_ceiling||0),s=Number(t.timeline_ticks||8),r=t.required_materials||{},c=Object.keys(r),p={LOW:.5,STD:1,HIGH:2},f={LOW:e.orange,STD:e.yellow,HIGH:e.greenBright},l={LOW:"Low",STD:"Standard",HIGH:"High"},v={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},m=yn||{};let u=0,g="";for(const B of c){const Y=Number(r[B]||0),Un=Se[B]||"STD",Hn=v[B]||3e5,ia=p[Un],aa=Math.round(Hn*ia),Gn=Y*aa;u+=Gn;const sa=B.replace(/_/g," ").replace(/\b\w/g,Ne=>Ne.toUpperCase()),Vn=Number(m[B]||0),qo=Math.max(0,Y-Vn),ra=qo===0?e.greenBright:qo<Y?e.yellow:e.red,la=qo===0?"✓ IN STOCK":`${Vn}/${Y}`;g+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${e.text}">${sa}</span>
                <div style="font-family:${o};font-size:7px;color:${ra};margin-top:1px">${la}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${o};font-size:9px;color:${e.muted}">${Y.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(Ne=>{const Oo=Un===Ne,Wn=f[Ne],da=x(Math.round(Hn*p[Ne]));return`<span onclick="bidSetGrade('${B}','${Ne}')" style="padding:2px 6px;font-family:${o};font-size:7px;font-weight:700;cursor:pointer;color:${Oo?"#000":e.dim};background:${Oo?Wn:"transparent"};border:1px solid ${Oo?Wn:e.border}" title="${da}/unit">${l[Ne]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${o};font-size:10px;color:${e.text}">${x(Gn)}</span></div>
        </div>`}const _=t.required_workforce||{},$=Number(_.general||0)+Number(_.skilled||0)||100,h=Math.max(40,Math.round($*.5)),k=$*2,I=[h,Math.round($*.75),$,Math.round($*1.5),k],E=Math.max(0,Math.min(1,(Q-h)/(k-h||1))),S=s,C=Math.round(4.5-E*8),q=Math.max(Math.round(S*.6),S+C),w=C>0?`+${C}mo`:C<0?`${C}mo`:"On schedule",N=C>0?e.red:C<0?e.greenBright:e.yellow,R=15200,D=Q*R*q,U=a,ae=[{name:"Municipal Zoning Approval",cost:18e4,ticks:2,required:!0},{name:"Structural Engineering Cert.",cost:24e4,ticks:3,required:!0},{name:"Environmental Impact Assessment",cost:34e4,ticks:8,required:U>2e7},{name:"Seismic Resilience Compliance",cost:21e4,ticks:4,required:U>5e7},{name:"Heritage Conservation Review",cost:16e4,ticks:6,required:!1},{name:"Fire Safety Certification",cost:12e4,ticks:2,required:U>1e7}].filter(B=>B.required),M=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),O=ae.filter(B=>!M.has(B.name)).reduce((B,Y)=>B+Y.cost,0),j=4e5,W=u+D+O+j,se=Math.round(W*(Te/100)),ye=W+se,H=ye>a,Ro=se,Me=H?0:Math.max(0,Math.min(100,Math.round(100-ye/a*100+30))),Fn=Me>70?e.greenBright:Me>40?e.yellow:Me>0?e.orange:e.red,oa=H?"OVER CEILING":Me>70?"STRONG":Me>40?"COMPETITIVE":Me>20?"WEAK":"UNLIKELY",Lo=Object.values(Se),Ae=Lo.length>0?Math.round(Lo.reduce((B,Y)=>B+(Y==="HIGH"?85:Y==="STD"?65:45),0)/Lo.length):50,Kt=Ae>=75?e.greenBright:Ae>=55?e.yellow:e.orange,na=Ae>=75?"STRONG":Ae>=55?"PROMISING":"UNCERTAIN",tt=document.createElement("div");tt.id="bid-assembly-overlay",tt.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",tt.addEventListener("click",B=>{B.target===tt&&Bn()}),tt.innerHTML=`
    <div style="width:740px;max-height:94vh;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <!-- HEADER -->
        <div style="padding:10px 16px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${o};font-size:8px;font-weight:700;padding:2px 8px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${n.toUpperCase()}</span>
                    <span style="font-size:14px;font-weight:700;color:${e.text}">${t.name}</span>
                    <span style="font-family:${o};font-size:8px;font-weight:700;padding:2px 6px;color:${i?e.accentBright:e.gold};background:${i?"rgba(163,176,126,0.1)":"rgba(200,168,50,0.08)"};border:1px solid ${i?"rgba(163,176,126,0.2)":"rgba(200,168,50,0.2)"}">${i?"GOV":"PRIVATE"}</span>
                </div>
                <span onclick="closeBidAssembly()" style="font-family:${o};font-size:14px;color:${e.dim};cursor:pointer;padding:0 4px">×</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                <span style="font-family:${o};font-size:9px;color:${e.dim}">${t.project_code||"—"}</span>
                <span style="font-family:${o};font-size:9px;color:${e.dim}">·</span>
                <span style="font-size:10px;color:${e.accent}">${t.issuer_name||"—"}</span>
                <span style="font-family:${o};font-size:9px;color:${e.dim}">·</span>
                <span style="font-family:${o};font-size:9px;color:${e.muted}">Ceiling: <span style="color:${e.text};font-weight:700">${x(a)}</span></span>
                <span style="font-family:${o};font-size:9px;color:${e.dim}">·</span>
                <span style="font-family:${o};font-size:9px;color:${e.muted}">Timeline: <span style="color:${e.text};font-weight:700">${s} months</span></span>
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
                ${g}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${o};font-size:9px;color:${e.muted}">MATERIALS TOTAL</span>
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${x(u)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Labor</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim};width:60px">WORKERS</span>
                        <div style="display:flex;gap:3px;">
                            ${I.map(B=>`<span onclick="bidSetWorkers(${B})" style="padding:2px 8px;font-family:${o};font-size:8px;font-weight:700;cursor:pointer;color:${Q===B?"#000":e.dim};background:${Q===B?e.accent:"transparent"};border:1px solid ${Q===B?e.accent:e.border}">${B}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">${Q} × $${R.toLocaleString()}/tick × ${q} ticks</span>
                        <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${x(D)}</span>
                    </div>
                    <div style="margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <span style="font-family:${o};font-size:8px;color:${e.dim}">WORKFORCE REQUIRED</span>
                        </div>
                        <div style="display:flex;gap:12px;">
                            <span style="font-family:${o};font-size:7px;color:#8b9a6b">General: ${Math.ceil(Q*.8)}</span>
                            <span style="font-family:${o};font-size:7px;color:#c8a832">Skilled: ${Math.ceil(Q*.15)}</span>
                            <span style="font-family:${o};font-size:7px;color:#c84">Innovative: ${Math.ceil(Q*.05)}</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">COMPLETION TIMELINE</span>
                        <span style="font-family:${o};font-size:10px;font-weight:700;color:${N}">${q}mo <span style="font-size:8px;opacity:0.7">(${w})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${ae.map(B=>{const Y=M.has(B.name);return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
                        <div style="flex:1;display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${o};font-size:8px;font-weight:700;color:${Y?e.greenBright:e.orange}">${Y?"✓":"○"}</span>
                            <span style="font-size:10px;color:${Y?e.muted:e.text}">${B.name}</span>
                        </div>
                        ${Y?`<span style="font-family:${o};font-size:8px;color:${e.greenBright}">HELD</span>`:`<div style="text-align:right">
                                <span style="font-family:${o};font-size:9px;color:${e.redDim}">${x(B.cost)}</span>
                                <span style="font-family:${o};font-size:7px;color:${e.dim};margin-left:4px">${B.ticks}t</span>
                            </div>`}
                    </div>`}).join("")}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${o};font-size:9px;color:${e.muted}">PERMIT COSTS</span>
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${x(O)}</span>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${o};font-size:9px;color:${e.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${x(j)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v:u},{l:"Labor",v:D},{l:"Permits",v:O},{l:"Overhead",v:j}].map(B=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-size:10px;color:${e.muted}">${B.l}</span>
                    <span style="font-family:${o};font-size:10px;color:${e.redDim}">${x(B.v)}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:rgba(204,85,85,0.03);">
                    <span style="font-family:${o};font-size:10px;font-weight:700;color:${e.text}">TOTAL EST. COST</span>
                    <span style="font-family:${o};font-size:13px;font-weight:700;color:${e.red}">${x(W)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.gold};text-transform:uppercase">Set Markup</span>
                </div>
                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="font-family:${o};font-size:9px;color:${e.dim}">MARKUP %</span>
                        <span style="font-family:${o};font-size:16px;font-weight:700;color:${e.gold}">${Te}%</span>
                    </div>
                    <input type="range" min="0" max="40" step="1" value="${Te}" oninput="bidSetMarkup(+this.value)" style="width:100%;accent-color:${e.gold};height:6px;" />
                    <div style="display:flex;justify-content:space-between;font-family:${o};font-size:7px;color:${e.dim};margin-top:2px;">
                        <span>0% (at cost)</span><span>40% (maximum)</span>
                    </div>
                </div>

                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${H?"rgba(204,85,85,0.04)":"rgba(200,168,50,0.03)"};">
                    <div style="font-family:${o};font-size:8px;color:${e.dim};margin-bottom:4px">YOUR BID PRICE</div>
                    <div style="font-family:${o};font-size:22px;font-weight:700;color:${H?e.red:e.gold}">${x(ye)}</div>
                    ${H?`<div style="font-family:${o};font-size:8px;font-weight:700;color:${e.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${x(a)})</div>`:""}
                </div>

                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">PROJECTED PROFIT</span>
                        <span style="font-family:${o};font-size:14px;font-weight:700;color:${Ro>0?e.greenBright:e.dim}">+${x(Ro)}</span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Bid Assessment</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">COMPETITIVENESS</span>
                        <span style="font-family:${o};font-size:11px;font-weight:700;color:${Fn}">${oa}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${Me}%;height:100%;background:${Fn}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${o};font-size:11px;font-weight:700;color:${Kt}">${Ae}</span>
                            <span style="font-family:${o};font-size:8px;color:${e.dim}">/100</span>
                            <span style="font-family:${o};font-size:8px;font-weight:700;color:${Kt}">${na}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${Ae}%;height:100%;background:${Kt}"></div></div>
                    <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="font-family:${o};font-size:8px;color:${e.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${dt.length===0?`<div style="font-family:${o};font-size:8px;color:${e.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${dt.map(B=>`<span style="padding:2px 6px;font-family:${o};font-size:7px;color:${e.muted};background:${e.card};border:1px solid ${e.border};">${B.name} <span style="color:${e.dim}">Q:${B.quality}</span></span>`).join("")}
                        </div>
                        <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:3px">${dt.length} competing bid${dt.length!==1?"s":""}. Bid prices are sealed until resolution.</div>`}
                    <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:3px">Higher reputation bidders may win at higher prices.</div>
                </div>
                <div style="flex:1"></div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">YOUR BID</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${H?e.red:e.gold}">${x(ye)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">EST. PROFIT</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${e.greenBright}">+${x(Ro)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${Kt}">${Ae}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${o};font-size:10px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="${H?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${o};font-size:10px;font-weight:700;letter-spacing:1px;color:${H?e.dim:"#000"};background:${H?e.border:e.gold};cursor:${H?"not-allowed":"pointer"};opacity:${H?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(tt)}let Ko=!1;async function Lr(){if(Ko||!be)return;const o=be,e=o.required_materials||{},t=Object.keys(e),i=Number(o.budget_ceiling||0),n=Number(o.timeline_ticks||8),a={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},s={LOW:.5,STD:1,HIGH:2};let r=0;for(const R of t){const D=Number(e[R]||0),U=Se[R]||"STD",F=a[R]||3e5;r+=D*Math.round(F*s[U])}const c=15200,p=o.required_workforce||{},f=Number(p.general||0)+Number(p.skilled||0)||100,l=Math.max(40,Math.round(f*.5)),v=f*2,m=Math.max(0,Math.min(1,(Q-l)/(v-l||1))),u=Math.round(4.5-m*8),g=Math.max(Math.round(n*.6),n+u),_=Q*c*g,$=i,h=[{name:"Municipal Zoning Approval",cost:18e4,required:!0},{name:"Structural Engineering Cert.",cost:24e4,required:!0},{name:"Environmental Impact Assessment",cost:34e4,required:$>2e7},{name:"Seismic Resilience Compliance",cost:21e4,required:$>5e7},{name:"Fire Safety Certification",cost:12e4,required:$>1e7}],k=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),I=h.filter(R=>R.required&&!k.has(R.name)).reduce((R,D)=>R+D.cost,0),S=r+_+I+4e5,C=Math.round(S*(Te/100)),q=S+C;if(q>i){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const w=Object.values(Se),N=w.length>0?Math.round(w.reduce((R,D)=>R+(D==="HIGH"?85:D==="STD"?65:45),0)/w.length):50;if(confirm('Submit bid for "'+o.name+`"?

Bid Price: `+x(q)+`
Est. Cost: `+x(S)+`
Markup: `+Te+"% ("+x(C)+`)
Quality: `+N+`/100
Workers: `+Q+`

Once submitted, your bid cannot be changed.`)){Ko=!0;try{const{data:R}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),D=R?.current_tick||0,U={};for(const ae of t)U[ae]=Se[ae]||"STD";const{error:F}=await y.from("contract_bids").insert({contract_id:o.id,faction_id:d.id,bid_price:q,material_grades:U,labor_count:Q,markup_pct:Te,estimated_cost:S,estimated_quality:N,status:"pending",submitted_at_tick:D});if(F)throw F;o.status==="open"&&await y.from("construction_contracts").update({status:"bidding"}).eq("id",o.id).eq("status","open"),Bn(),alert(`Bid submitted successfully!

Contract: `+o.name+`
Your Bid: `+x(q)+`
Quality: `+N+`/100

Bids will be resolved when the bidding window closes (`+(o.bidding_ends_tick?"tick "+o.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof Ke=="function"&&await Ke()}catch(R){alert("Bid submission failed: "+R.message)}finally{Ko=!1}}}window.openBidAssembly=Mr;window.closeBidAssembly=Bn;window.bidSetGrade=Ar;window.bidSetWorkers=Nr;window.bidSetMarkup=Rr;window.submitBidAssembly=Lr;let Jo=!1;async function qr(o){if(Jo)return;const e=1e6,t=Number(d?.corp_cash_reserves??0);if(t<e){alert("Cannot retract — you need at least $1M in cash reserves to cover the retraction penalty.");return}if(confirm(`Retract your bid?

This will cost $1M as a retraction penalty.
This action cannot be undone.`)){Jo=!0;try{const i=t-e,{error:n}=await y.from("factions").update({corp_cash_reserves:i}).eq("id",d.id);if(n)throw n;const{error:a}=await y.from("contract_bids").delete().eq("contract_id",o).eq("faction_id",d.id);if(a)throw a;d.corp_cash_reserves=i,typeof Je=="function"&&Je(i),alert("Bid retracted. $1M penalty applied."),Ht(),await Ke()}catch(i){alert("Failed to retract bid: "+(i.message||"Unknown error"))}finally{Jo=!1}}}window.retractBid=qr;let jt=[],Ue=0,ue=null,Xo=!1,Zo=!1,en=!1;async function Or(){if(!Ve||Zo)return;Zo=!0,ue=Ve,Ue=0;const{data:o,error:e}=await y.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",ue.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(Zo=!1,e){alert("Failed to load bids: "+e.message);return}jt=(o||[]).map(t=>({...t,corp:t.factions?.faction_name||"Unknown",abbr:t.factions?.corp_ticker||"???",subsector:t.factions?.corp_subsector||"—"})),Ht(),Ki()}function No(){document.getElementById("bid-review-overlay")?.remove(),ue=null}function Br(o){Ue=o,Ki()}async function Pr(){if(Xo||jt.length===0)return;const o=jt[Ue];if(!(!o?.id||!o.faction_id)&&confirm("Accept bid from "+o.corp+`?

Bid Price: `+x(o.bid_price)+`
Quality: `+o.estimated_quality+`/100
Workers: `+o.labor_count+`

This will award the contract. The project begins immediately.`)){Xo=!0;try{const{data:e}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{error:i}=await y.from("contract_bids").update({status:"won"}).eq("id",o.id);if(i)throw i;const{error:n}=await y.from("contract_bids").update({status:"lost"}).eq("contract_id",ue.id).neq("id",o.id);if(n)throw n;const{error:a}=await y.from("construction_contracts").update({status:"awarded",awarded_to_faction:o.faction_id,awarded_at_tick:t}).eq("id",ue.id);if(a)throw a;No(),alert("Contract awarded to "+o.corp+`!

Bid: `+x(o.bid_price)+`
Project begins immediately.`),typeof Ke=="function"&&await Ke()}catch(e){alert("Failed to accept bid: "+(e.message||e))}finally{Xo=!1}}}async function Dr(){if(!(!ue||en)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){en=!0;try{const{error:o}=await y.from("contract_bids").update({status:"lost"}).eq("contract_id",ue.id);if(o)throw o;const{error:e}=await y.from("construction_contracts").update({status:"expired"}).eq("id",ue.id);if(e)throw e;No(),alert("All bids declined. Contract cancelled."),typeof Ke=="function"&&await Ke()}catch(o){alert("Failed: "+(o.message||o))}finally{en=!1}}}function Ki(){if(document.getElementById("bid-review-overlay")?.remove(),!ue||jt.length===0)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=ue,i=jt;Ue>=i.length&&(Ue=0);const n=i[Ue],a=Number(t.budget_ceiling||0),s=Number(t.timeline_ticks||36),r=Math.min(...i.map(m=>m.bid_price)),c=Math.max(...i.map(m=>m.estimated_quality||0));let p="";for(let m=0;m<i.length;m++){const u=i[m],g=m===Ue,_=u.bid_price===r,$=(u.estimated_quality||0)===c,h=u.bid_price>a;p+=`
        <div onclick="reviewSelectBid(${m})" style="padding:10px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${g?e.accent:"transparent"};background:${g?"rgba(139,154,107,0.03)":"transparent"};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-family:${o};font-size:10px;font-weight:700;color:${e.gold}">${u.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${e.text}">${u.corp}</span>
                ${_?`<span style="font-family:${o};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.greenBright};background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2)">CHEAPEST</span>`:""}
                ${$?`<span style="font-family:${o};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.2)">BEST QUALITY</span>`:""}
            </div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};">
                <div style="flex:1.2;padding:5px 10px;border-right:1px solid ${e.border}">
                    <div style="font-family:${o};font-size:7px;color:${e.dim}">BID PRICE</div>
                    <div style="font-family:${o};font-size:14px;font-weight:700;color:${h?e.red:e.text}">${x(u.bid_price)}</div>
                    ${h?`<div style="font-family:${o};font-size:7px;color:${e.red}">OVER BUDGET</div>`:""}
                </div>
                <div style="flex:0.8;padding:5px 10px;border-right:1px solid ${e.border};text-align:center">
                    <div style="font-family:${o};font-size:7px;color:${e.dim}">QUALITY</div>
                    <div style="font-family:${o};font-size:14px;font-weight:700;color:${(u.estimated_quality||0)>=75?e.greenBright:(u.estimated_quality||0)>=55?e.yellow:e.orange}">${u.estimated_quality||0}</div>
                </div>
                <div style="flex:0.8;padding:5px 10px;text-align:center">
                    <div style="font-family:${o};font-size:7px;color:${e.dim}">WORKERS</div>
                    <div style="font-family:${o};font-size:14px;font-weight:700;color:${e.text}">${u.labor_count||0}</div>
                </div>
            </div>
        </div>`}const f=n.bid_price>a,l=a>0?Math.round(n.bid_price/a*100):0,v=document.createElement("div");v.id="bid-review-overlay",v.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",v.addEventListener("click",m=>{m.target===v&&No()}),v.innerHTML=`
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
                <span>Budget: <span style="color:${e.text};font-weight:700">${x(a)}</span></span>
                <span>·</span>
                <span>Timeline: <span style="color:${e.text};font-weight:700">${s}mo</span></span>
            </div>
        </div>
        <div style="padding:6px 16px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.gold}">${i.length} BID${i.length!==1?"S":""} RECEIVED</span>
            <div style="display:flex;gap:8px;font-family:${o};font-size:8px;color:${e.dim};">
                <span>Cheapest: <span style="color:${e.greenBright}">${x(r)}</span></span>
                <span>Best Quality: <span style="color:${e.accent}">${c}</span></span>
            </div>
        </div>
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${e.border};overflow:auto;">
                ${p}
            </div>
            <div style="width:250px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.gold}">${n.abbr}</span>
                        <span style="font-size:12px;font-weight:700;color:${e.text}">${n.corp}</span>
                    </div>
                    <div style="font-family:${o};font-size:8px;color:${e.dim};margin-top:2px">${n.subsector}</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <span style="font-family:${o};font-size:8px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Breakdown</span>
                </div>
                ${[{l:"Materials",v:Number(n.estimated_cost||0)*.45},{l:"Labor",v:Number(n.estimated_cost||0)*.45},{l:"Overhead",v:Number(n.estimated_cost||0)*.1}].map(m=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${o};font-size:9px;color:${e.dim};text-transform:uppercase">${m.l}</span>
                    <span style="font-family:${o};font-size:10px;color:${e.muted}">${x(Math.round(m.v))}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:${f?"rgba(204,85,85,0.03)":"rgba(200,168,50,0.03)"};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;color:${e.text}">TOTAL BID</span>
                    <span style="font-family:${o};font-size:14px;font-weight:700;color:${f?e.red:e.gold}">${x(n.bid_price)}</span>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">vs. YOUR BUDGET</span>
                        <span style="font-family:${o};font-size:9px;font-weight:700;color:${f?e.red:e.greenBright}">${f?"OVER":"WITHIN"} — ${l}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${e.border}"><div style="width:${Math.min(100,l)}%;height:100%;background:${f?e.red:e.accent}"></div></div>
                </div>
                ${[{l:"Quality",v:n.estimated_quality+"/100",c:(n.estimated_quality||0)>=75?e.greenBright:(n.estimated_quality||0)>=55?e.yellow:e.orange},{l:"Markup",v:n.markup_pct+"%",c:e.muted},{l:"Workers",v:n.labor_count+" workers",c:e.text}].map(m=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${o};font-size:9px;color:${e.dim};text-transform:uppercase">${m.l}</span>
                    <span style="font-family:${o};font-size:10px;font-weight:700;color:${m.c}">${m.v}</span>
                </div>`).join("")}
                <div style="flex:1"></div>
            </div>
        </div>
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">SELECTED BID</div><div style="font-family:${o};font-size:12px;font-weight:700;color:${e.gold}">${x(n.bid_price)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">CORPORATION</div><div style="font-family:${o};font-size:12px;font-weight:700;color:${e.text}">${n.corp}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${o};font-size:12px;font-weight:700;color:${(n.estimated_quality||0)>=75?e.greenBright:e.yellow}">${n.estimated_quality}</div></div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="declineAllBids()" style="padding:6px 16px;font-family:${o};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">DECLINE ALL</div>
                <div onclick="acceptBid()" style="padding:6px 20px;font-family:${o};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${e.accent};cursor:pointer">ACCEPT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(v)}const xt={Coastal:{color:"#8b9a6b",label:"COASTAL"},Container:{color:"#5a7aaa",label:"CONTAINER"},Bulk:{color:"#c8a832",label:"BULK"},Tanker:{color:"#c86a4a",label:"TANKER"},Reefer:{color:"#6a9a5a",label:"REEFER"},LNG:{color:"#c55",label:"LNG"}},jr={in_port:{color:"#8b9a6b",label:"IN PORT"},in_transit:{color:"#5a8aaa",label:"IN TRANSIT"},dry_dock:{color:"#c84",label:"DRY DOCK"},anchored:{color:"#ca5",label:"ANCHORED"},for_sale:{color:"#9e9a92",label:"FOR SALE"}};function Ji(o){return o>=75?"#5c5":o>=50?"#ca5":o>=25?"#c84":"#c55"}function Fr(o){return o>=60?"#5c5":o>=30?"#ca5":o>=15?"#c84":"#c55"}async function ve(){if(!d)return;const{data:o,error:e}=await y.from("corp_vessels").select("*").eq("faction_id",d.id).order("vessel_class");e&&console.warn("Failed to load fleet:",e.message),_e=o||[],Ot=null,Ct={},so={};try{const t=_e.map(i=>i.id);if(t.length>0){const{data:i}=await y.from("finance_active_loans").select("insured_vessel_id").in("insured_vessel_id",t).in("status",["current"]);for(const a of i||[])a.insured_vessel_id&&(Ct[a.insured_vessel_id]=!0);const{data:n}=await y.from("finance_loan_requests").select("insured_vessel_id").eq("requesting_faction_id",d.id).eq("request_type","insurance").eq("status","open").not("insured_vessel_id","is",null);for(const a of n||[])a.insured_vessel_id&&!Ct[a.insured_vessel_id]&&(so[a.insured_vessel_id]=!0)}}catch(t){console.warn("Failed to load vessel insurance status:",t.message)}Xi()}function Ur(o){Ot=Ot===o?null:o,Xi()}function Xi(){const o=document.getElementById("fl-count"),e=document.getElementById("fl-summary"),t=document.getElementById("fl-list"),i=document.getElementById("fl-footer");if(!o||!t)return;const n=_e;o.textContent=n.length+" VESSEL"+(n.length!==1?"S":"");const a=n.filter(l=>l.status==="in_transit").length,s=n.filter(l=>l.status==="in_port"||l.status==="anchored").length,r=n.filter(l=>l.status==="dry_dock").length,c=n.reduce((l,v)=>l+(v.base_maintenance||0),0);e.innerHTML=[{label:"TRANSIT",value:a,color:"#5a8aaa"},{label:"IN PORT",value:s,color:"#8b9a6b"},{label:"DRY DOCK",value:r,color:"#c84"},{label:"MAINT/TICK",value:x(c),color:"#a44"}].map((l,v)=>`<div style="flex:1;padding:5px 8px;text-align:center;${v<3?"border-right:1px solid var(--border-0);":""}">
        <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">${l.label}</div>
        <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${l.color};margin-top:1px;">${l.value}</div>
    </div>`).join(""),n.length===0?t.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels in fleet.<br>Purchase ships to begin operations.</div>':t.innerHTML=n.map((l,v)=>{const m=Ot===v,u=xt[l.vessel_class]||{color:"#666",label:"?"},g=jr[l.status]||{color:"#666",label:"?"},_=Ji(l.condition),$=Fr(l.fuel),h=l.condition<50||l.fuel<20,k=l.status==="in_transit",I=l.status==="dry_dock",E=z?.current_tick||0,S=Math.max(0,Math.floor((E-(l.built_at_tick||0))/12));let C=`<div onclick="flSelectVessel(${v})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${h?l.condition<50?_:$:"transparent"};background:${m?u.color+"06":"transparent"};">
                <div style="padding:7px 14px;">`;C+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(l.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${u.color};background:${u.color}12;border:1px solid ${u.color}25;">${u.label}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${g.color};background:${g.color}12;border:1px solid ${g.color}25;">${g.label}</span>
            </div>`;const q=l.current_port_nation_id?"In port":k?"At sea":"—";if(C+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:5px;">${b(q)}</div>`,C+=`<div style="display:flex;gap:8px;margin-bottom:4px;">
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${_};">${l.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${l.condition}%;height:100%;background:${_};"></div></div>
                </div>
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">FUEL</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${$};">${l.fuel}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${l.fuel}%;height:100%;background:${$};"></div></div>
                </div>
            </div>`,C+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);margin-top:1px;">${(l.capacity_dwt||0).toLocaleString()} ${l.capacity_unit||"DWT"}</div>
                </div>
                <div style="flex:0.7;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">AGE</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${S}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#a44;margin-top:1px;">${x(l.base_maintenance)}</div>
                </div>
            </div>`,I&&l.drydock_until_tick){const w=Math.max(0,l.drydock_until_tick-E);C+=`<div style="margin-top:4px;padding:3px 8px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">DRY DOCK REPAIRS</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c84;">${w} tick${w!==1?"s":""} remaining</span>
                </div>`}if(m){C+=`<div style="margin-top:6px;">
                    <div style="padding:5px 8px;background:var(--bg-0);border:1px solid var(--border-0);margin-bottom:6px;">`;const w=[{label:"VESSEL CLASS",value:l.vessel_class},{label:"BUILT",value:"Tick "+(l.built_at_tick||0)},{label:"FUEL CAPACITY",value:(l.fuel_capacity||0).toLocaleString()+" tons"},{label:"LAST REFURBISH",value:l.last_refurbish_tick?"Tick "+l.last_refurbish_tick:"N/A"}];for(let F=0;F<w.length;F++)C+=`<div style="display:flex;justify-content:space-between;padding:2px 0;${F<3?"border-bottom:1px solid var(--border-0);":""}">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${w[F].label}</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);">${w[F].value}</span>
                    </div>`;C+="</div>";const N=k||I,R=Math.round((l.purchase_price||3e6)*.08*(1+(100-l.condition)/100)),D=Math.round((l.fuel_capacity||1e3)*50*(1-l.fuel/100)),U=Math.round((l.purchase_price||3e6)*(l.condition/100)*.6);if(C+=`<div style="display:flex;gap:4px;">
                    <div onclick="${N?"":"flRefurbish('"+l.id+"',"+R+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${N?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${N?"var(--text-dim)":"#5c5"};border:1px solid ${N?"var(--border-0)":"#2a5a3a"};background:${N?"transparent":"rgba(74,170,136,0.06)"};opacity:${N?.35:1};">REFURBISH<br><span style="font-weight:400;font-size:6px;">${x(R)}</span></div>
                    <div onclick="${k?"":"flRefuel('"+l.id+"',"+D+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${k?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${k?"var(--text-dim)":"#c86a4a"};border:1px solid ${k?"var(--border-0)":"rgba(200,106,74,0.3)"};opacity:${k?.35:1};">REFUEL<br><span style="font-weight:400;font-size:6px;">from ${x(D)}</span></div>
                    <div onclick="${N?"":"flSell('"+l.id+"','"+b(l.vessel_name).replace(/'/g,"")+"',"+U+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${N?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${N?"var(--text-dim)":"#c84"};border:1px solid ${N?"var(--border-0)":"rgba(204,136,68,0.3)"};opacity:${N?.35:1};">LIST<br><span style="font-weight:400;font-size:6px;">${x(U)}</span></div>
                </div>`,!k){const F=Ct&&Ct[l.id],ae=so&&so[l.id];C+='<div style="display:flex;gap:4px;margin-top:4px;">',F?C+=`<div style="flex:1;display:flex;gap:2px;">
                            <div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#5c5;border:1px solid rgba(92,204,92,0.2);background:rgba(92,204,92,0.04);">INSURED ✓</div>
                            <div onclick="event.stopPropagation();flFileClaim('${l.id}','${b(l.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#c55;border:1px solid rgba(204,85,85,0.2);background:rgba(204,85,85,0.04);">FILE CLAIM</div>
                        </div>`:ae?C+='<div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#ca5;border:1px solid rgba(202,165,50,0.2);background:rgba(202,165,50,0.04);">PENDING ⏳</div>':C+=`<div onclick="event.stopPropagation();flRequestInsurance('${l.id}','${b(l.vessel_name).replace(/'/g,"")}',${l.purchase_price||0})" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#aa7a5a;border:1px solid rgba(170,122,90,0.3);background:rgba(170,122,90,0.04);">INSURE</div>`,C+=`<div onclick="flRename('${l.id}','${b(l.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:var(--text-muted);border:1px solid var(--border-0);">RENAME</div>`,C+="</div>"}k&&(C+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel at sea — actions available on arrival</div>'),I&&(C+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel in dry dock — repairs in progress</div>'),C+="</div>"}return C+="</div></div>",C}).join("");const p={};for(const l of n)p[l.vessel_class]=(p[l.vessel_class]||0)+1;let f='<div style="display:flex;gap:6px;">';for(const[l,v]of Object.entries(xt))p[l]&&(f+=`<div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:${v.color};border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">${v.label}</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${p[l]}</span>
        </div>`);f+="</div>",f+=`<span style="font-family:var(--font-mono);font-size:8px;color:#a44;">${x(c)}/tick</span>`,i.innerHTML=f}let te=!1;async function Hr(o,e){if(te||!d)return;const t=(_e||[]).find(m=>m.id===o);if(!t)return;const i=t.current_port_nation_id||null;let n="state",a=3,s=3,r=null,c="State Dry Dock (3x cost, 3 ticks)";if(i){const{data:m}=await y.from("corp_properties").select("id").eq("faction_id",d.id).eq("nation_id",i).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();if(m)n="own",a=1,s=2,c="Your Dry Dock (base cost, 2 ticks)";else{const{data:u}=await y.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",d.id).eq("nation_id",i).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();u&&(n="other",a=1.2,s=2,r=u.faction_id,c=(u.factions?.faction_name||"Another corp")+"'s Dry Dock (+20%, 2 ticks)")}}else c="State Dry Dock (3x cost, 3 ticks) — no private dock in port";const p=Math.round(e*a),{data:f}=await y.from("factions").select("corp_cash_reserves").eq("id",d.id).single(),l=Number(f?.corp_cash_reserves??0);if(l<p){alert("Insufficient cash. Need "+x(p)+", have "+x(l)+".");return}if(!confirm("Send "+(t.vessel_name||"vessel")+` to dry dock?

Dock: `+c+`
Cost: `+x(p)+`
Duration: `+s+` ticks
Condition restored to 85-100%.`))return;te=!0;const v=z?.current_tick||0;try{const{error:m}=await y.from("factions").update({corp_cash_reserves:l-p}).eq("id",d.id);if(m){alert("Failed: "+m.message);return}if(n==="other"&&r){const g=p-e,{data:_}=await y.from("factions").select("corp_cash_reserves").eq("id",r).single();_&&await y.from("factions").update({corp_cash_reserves:Number(_.corp_cash_reserves||0)+g}).eq("id",r)}const{error:u}=await y.from("corp_vessels").update({status:"dry_dock",drydock_until_tick:v+s,active_claim_id:null}).eq("id",o);if(u){await y.from("factions").update({corp_cash_reserves:l}).eq("id",d.id),alert("Failed: "+u.message);return}d.corp_cash_reserves=l-p,await ve()}catch(m){alert("Dry dock failed: "+(m.message||"Error"))}finally{te=!1}}async function Gr(o,e){if(te||!d)return;if(e<=0){alert("Fuel tanks are already full.");return}const t=(_e||[]).find(l=>l.id===o);if(!t)return;const i=t.current_port_nation_id||d.nation_id;let n="state",a=3,s=null,r="State Fuel (3x cost) — no private depot in port";if(i){const{data:l}=await y.from("corp_properties").select("id").eq("faction_id",d.id).eq("nation_id",i).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(l)n="own",a=1,r="Your Fuel Depot (base cost)";else{const{data:v}=await y.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",d.id).eq("nation_id",i).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();v&&(n="other",a=1.15,s=v.faction_id,r=(v.factions?.faction_name||"Another corp")+"'s Fuel Depot (+15%)")}}const c=Math.round(e*a),{data:p}=await y.from("factions").select("corp_cash_reserves").eq("id",d.id).single(),f=Number(p?.corp_cash_reserves??0);if(f<c){alert("Insufficient cash. Need "+x(c)+", have "+x(f)+".");return}if(confirm("Refuel "+(t.vessel_name||"vessel")+`?

Source: `+r+`
Cost: `+x(c)+`
Fuel restored to 100%.`)){te=!0;try{const{error:l}=await y.from("factions").update({corp_cash_reserves:f-c}).eq("id",d.id);if(l){alert("Failed: "+l.message);return}if(n==="other"&&s){const m=c-e,{data:u}=await y.from("factions").select("corp_cash_reserves").eq("id",s).single();u&&await y.from("factions").update({corp_cash_reserves:Number(u.corp_cash_reserves||0)+m}).eq("id",s)}const{error:v}=await y.from("corp_vessels").update({fuel:100}).eq("id",o);if(v){await y.from("factions").update({corp_cash_reserves:f}).eq("id",d.id),alert("Failed: "+v.message);return}d.corp_cash_reserves=f-c,await ve()}catch(l){alert("Refuel failed: "+(l.message||"Error"))}finally{te=!1}}}async function Vr(o,e,t){if(te||!d||!z||!confirm("List "+e+" on the Ship Market for "+x(t)+`?

The vessel will be removed from your fleet and listed for sale. You will receive payment when another corporation purchases it.`))return;te=!0;const i=z.current_tick||0,n=_e.find(c=>c.id===o);if(!n){te=!1;return}const a=Math.max(0,i-(n.built_at_tick||0)),{error:s}=await y.from("ship_market_listings").insert({nation_id:d.nation_id,vessel_name:n.vessel_name,vessel_class:n.vessel_class,capacity_dwt:n.capacity_dwt,capacity_unit:n.capacity_unit,condition:n.condition,fuel:n.fuel,age_ticks:a,fuel_capacity:n.fuel_capacity,base_maintenance:n.base_maintenance,asking_price:t,purchase_price_new:n.purchase_price||t,seller_type:"CORP",seller_name:d.faction_name,seller_faction_id:d.id,sale_reason:"Listed for sale by "+(d.faction_name||"corporation"),status:"available",listed_at_tick:i});if(s){alert("Failed to create listing: "+s.message),te=!1;return}const{error:r}=await y.from("corp_vessels").delete().eq("id",o);if(r){await y.from("ship_market_listings").delete().eq("seller_faction_id",d.id).eq("vessel_name",n.vessel_name).eq("listed_at_tick",i),alert("Failed to remove vessel: "+r.message),te=!1;return}te=!1,Ot=null,await Promise.all([ve(),Dn()])}async function Wr(o,e){const t=prompt("Rename vessel:",e);if(!t||t.trim()===e||t.trim().length<2)return;const{error:i}=await y.from("corp_vessels").update({vessel_name:t.trim().slice(0,40)}).eq("id",o);if(i){alert("Failed: "+i.message);return}await ve()}async function Yr(o,e,t){if(!d||!z||!confirm("Request insurance for "+e+`?

Insurance corporations will see this in their Deal Flow and can offer coverage terms.

Vessel value: `+x(t)))return;const i=z.current_tick||0,{error:n}=await y.from("finance_loan_requests").insert({requesting_faction_id:d.id,nation_id:d.nation_id,request_type:"insurance",insured_vessel_id:o,amount:t,term_months:0,purpose:"Vessel Insurance — "+e,status:"open",created_tick:i,expires_tick:i+12});if(n){n.message.includes("duplicate")||n.message.includes("unique")?alert("Insurance already requested for this vessel."):alert("Failed to request insurance: "+n.message);return}alert(`Insurance request posted to Deal Flow.

Insurance corporations can now offer coverage for `+e+"."),await ve()}let tn=!1;async function Qr(o,e){if(tn||!d||!z)return;const t=prompt(`Describe the claim reason:

e.g., "Storm damage during transit — hull breach repaired at sea" or "Engine failure requiring emergency dry dock"`);if(!t||t.trim().length<5)return;const i=z.current_tick||0,{data:n}=await y.from("finance_active_loans").select("id, lender_faction_id, principal, deductible_pct").eq("insured_vessel_id",o).eq("status","current").limit(1).maybeSingle();if(!n){alert("No active insurance policy found for this vessel.");return}const a=Number(n.principal||0),s=Number(n.deductible_pct||10),r=Math.round(a*s/100);if(!confirm("File insurance claim for "+e+`?

Coverage: `+x(a)+`
Deductible: `+s+"% ("+x(r)+`)

Reason: `+t.trim()+`

The insurer will review this claim and determine the payout.`))return;tn=!0;const{error:c}=await y.from("event_log").insert({nation_id:d.nation_id,faction_id:d.id,event_name:(d.faction_name||"Corporation")+" — Insurance Claim Filed",description_used:(d.faction_name||"A shipping corporation")+" has filed an insurance claim for vessel "+e+". Reason: "+t.trim().replace(/[<>"]/g,""),category:"business",trigger_key:"vessel_insurance_claim",effects_applied:{vessel_id:o,vessel_name:e,policy_id:n.id,insurer_faction_id:n.lender_faction_id,coverage:a,deductible_pct:s,claim_reason:t.trim()},fired_at_tick:i});c&&console.warn("Failed to log insurance claim event:",c.message);const{error:p}=await y.from("finance_active_loans").update({claims_paid:(n.claims_paid||0)+1}).eq("id",n.id);p&&console.warn("Failed to update claims_paid:",p.message),tn=!1,alert("Insurance claim filed for "+e+`.

The insurer (`+x(a)+" coverage) has been notified. Claim details are visible in the events feed.")}window.flRequestInsurance=Yr;window.flFileClaim=Qr;const gn={fuel_depot:{label:"FUEL DEPOT",color:"#c86a4a",icon:"⛽",desc:"Bunkering facility — refuel at base cost, earn revenue from visiting fleets."},dry_dock:{label:"DRY DOCK",color:"#c84",icon:"🔧",desc:"Repair & maintenance dock — dock at base cost, earn revenue from visiting fleets."}},Kr=[{type:"fuel_depot",name:"Fuel Depot — Standard",cost:105e6,maint:85e3,style:"Basic",desc:"Bulk fuel storage and bunkering facility."},{type:"fuel_depot",name:"Fuel Depot — Advanced",cost:14e7,maint:11e4,style:"Modern",desc:"High-capacity fuel terminal with pipeline infrastructure."},{type:"dry_dock",name:"Dry Dock — Standard",cost:85e6,maint:15e4,style:"Basic",desc:"Ship repair and maintenance facility."},{type:"dry_dock",name:"Dry Dock — Advanced",cost:115e6,maint:2e5,style:"Modern",desc:"Full-service shipyard with drydock and crane facilities."}];let go=[];async function Zi(){if(!d)return;const{data:o}=await y.from("corp_properties").select("*").eq("faction_id",d.id).in("type",["fuel_depot","dry_dock"]).eq("is_active",!0).order("created_at",{ascending:!1});go=o||[],Jr()}function Jr(){const o=document.getElementById("pf-count"),e=document.getElementById("pf-list"),t=document.getElementById("pf-footer");if(!o||!e||!t)return;const i=go;if(o.textContent=i.length+" FACILIT"+(i.length===1?"Y":"IES"),i.length===0)e.innerHTML=`<div style="padding:20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-bottom:6px;">No port facilities built.</div>
            <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Build a <span style="color:#c86a4a;font-weight:700;">Fuel Depot</span> to refuel your fleet at base cost<br>and earn revenue from other corps refueling here.<br>Build a <span style="color:#c84;font-weight:700;">Dry Dock</span> to repair vessels at base cost.</div>
        </div>`;else{let s=0;e.innerHTML=i.map(r=>{const c=gn[r.type]||gn.fuel_depot,p=r.condition>=75?"#5c5":r.condition>=50?"#ca5":"#c84";return s+=Number(r.monthly_maintenance||0),`<div style="padding:8px 12px;border-bottom:1px solid var(--border-0);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${c.icon}</span>
                        <span style="font-size:11px;font-weight:600;color:var(--text-bright);">${b(r.name)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${c.color};background:${c.color}12;border:1px solid ${c.color}25;">${c.label}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:4px;">${r.city||"Port"} · ${(r.style||"Basic").toUpperCase()}</div>
                <div style="display:flex;gap:12px;margin-bottom:4px;">
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${p};">${r.condition}%</span>
                        </div>
                        <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${r.condition}%;height:100%;background:${p};"></div></div>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#a44;">${x(r.monthly_maintenance||0)}</span>
                        </div>
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">VALUE: ${x(r.purchase_price||0)}</div>
                    </div>
                </div>
            </div>`}).join("")}Number(d?.corp_cash_reserves??0);const n=i.some(s=>s.type==="fuel_depot"),a=i.some(s=>s.type==="dry_dock");t.innerHTML=`
        <div onclick="pfOpenBuild('fuel_depot')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c86a4a;border:1px solid rgba(200,106,74,0.3);background:rgba(200,106,74,0.04);">
            ${n?"+ FUEL DEPOT":"BUILD FUEL DEPOT"}
        </div>
        <div onclick="pfOpenBuild('dry_dock')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c84;border:1px solid rgba(204,136,68,0.3);background:rgba(204,136,68,0.04);">
            ${a?"+ DRY DOCK":"BUILD DRY DOCK"}
        </div>`}let on=!1;async function Xr(o){if(on||!d||!z)return;const e=Kr.filter(_=>_.type===o);if(e.length===0)return;const t=gn[o],i=d.nation_id,n=T?.name||d?.nation||"Home Nation",a=T?.capital||"Port City",s=[{id:i,name:n,capital:a,label:"National HQ"}],{data:r}=await y.from("corp_properties").select("nation_id, name, city, nations!nation_id(name, capital)").eq("faction_id",d.id).eq("type","regional_hq").eq("is_active",!0);for(const _ of r||[])_.nation_id!==i&&s.push({id:_.nation_id,name:_.nations?.name||_.city||"Unknown",capital:_.nations?.capital||_.city||"Port City",label:_.name||"Subsidiary"});let c=s[0];if(s.length>1){let _=t.label+` — SELECT LOCATION
`+"─".repeat(30)+`
`;_+=`Build in which nation?

`;for(let k=0;k<s.length;k++){const I=s[k],E=go.filter(S=>S.type===o&&S.nation_id===I.id).length;_+=k+1+". "+I.name+"  ("+I.label+")",E>0&&(_+="  ["+E+" existing]"),_+=`
`}_+=`
Enter number (or cancel):`;const $=prompt(_);if(!$)return;const h=parseInt($,10)-1;if(isNaN(h)||h<0||h>=s.length){alert("Invalid selection.");return}c=s[h]}const p=go.filter(_=>_.type===o&&_.nation_id===c.id).length;let f=t.label+" CONSTRUCTION — "+c.name.toUpperCase()+`
`+"─".repeat(30)+`
`;p>0&&(f+="You already have "+p+" "+t.label.toLowerCase()+(p>1?"s":"")+` here.

`),f+=t.desc+`

`;for(let _=0;_<e.length;_++){const $=e[_];f+=_+1+". "+$.name+`
`,f+="   Cost: "+x($.cost)+" · Maint: "+x($.maint)+`/tick
`,f+="   "+$.desc+`

`}f+="Enter 1 or 2 to select (or cancel):";const l=prompt(f);if(!l)return;const v=parseInt(l,10)-1;if(isNaN(v)||v<0||v>=e.length){alert("Invalid selection.");return}const m=e[v];if(!confirm("Commission "+m.name+" in "+c.capital+", "+c.name+`?

Budget: `+x(m.cost)+`

This will create a construction contract that construction corporations can bid on. Payment occurs when the contract is awarded.`))return;on=!0;const u=z.current_tick||0,g=(z.current_date||"").match(/\d{4}/)?.[0]||"2015";try{const{count:_}=await y.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",c.id).eq("issuer_type","PRIVATE"),h=`PVT-P${(_||0)+1}-${g}`,k=m.style==="Modern",I={concrete:k?6:4,steel:k?5:3,heavy_parts:k?3:2,aggregate:k?3:2},E={trucks:1,mixers:1,excavators:1},S={general:k?12:8,skilled:k?5:3},C=k?6:4,{error:q}=await y.from("construction_contracts").insert({nation_id:c.id,template_key:o,sector:"industrial",name:m.name,project_type:t.label,project_subtype:m.style,description:`${m.name} at ${c.capital} Port — commissioned by ${d.faction_name}. ${m.desc}`,project_code:h,budget_ceiling:m.cost,timeline_ticks:C,required_materials:I,required_equipment:E,required_workforce:S,status:"open",generated_at_tick:u,bidding_ends_tick:u+3,issuer_type:"PRIVATE",issuer_name:d.faction_name,issuer_faction_id:d.id});if(q)throw q;await Zi(),alert(`Construction contract posted!

Project: `+m.name+`
Location: `+c.capital+", "+c.name+`
Code: `+h+`
Budget: `+x(m.cost)+`
Timeline: `+C+` ticks

Construction corporations in `+c.name+" can now bid on this project.")}catch(_){alert("Failed to post contract: "+(_.message||"Error"))}finally{on=!1}}window.pfOpenBuild=Xr;const Pn={"Bulk Cargo":["Reefer","Bulk","Coastal"],"Container Freight":["Coastal","Container"],"Specialized Transport":["Tanker","LNG","Bulk"]};async function Dn(){if(!d)return;const{data:o,error:e}=await y.from("ship_market_listings").select("*, nation:nation_id(id, name)").eq("status","available").order("asking_price",{ascending:!0});e&&console.warn("Failed to load ship market:",e.message),_n=o||[],ro=null,ea()}function Zr(o){ro=ro===o?null:o,ea()}function el(o){return(Pn[d?.corp_subsector]||[]).includes(o)}function ea(){const o=document.getElementById("sm-count"),e=document.getElementById("sm-list"),t=document.getElementById("sm-footer");if(!o||!e)return;const i=_n;o.textContent=i.length+" AVAILABLE",i.length===0?e.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels on the market.<br>Check back next cycle.</div>':e.innerHTML=i.map((s,r)=>{const c=ro===r,p=xt[s.vessel_class]||{color:"#666",label:"?"},f=s.seller_type==="CORP"?"#5a8aaa":"#8b9a6b",l=Ji(s.condition),v=s.nation?.name||"—",m=el(s.vessel_class);z?.current_tick;const u=s.age_ticks||0,g=Math.max(1,Math.floor(u/12)),_=v!==d?.nation?Number(d?.tariffs||T?.tariffs||0):0,$=Math.round(s.asking_price*_/100),h=s.asking_price+$;let k=`<div onclick="smSelectListing(${r})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${c?p.color:"transparent"};background:${c?p.color+"06":"transparent"};">
                <div style="padding:8px 14px;">`;return k+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(s.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${p.color};background:${p.color}12;border:1px solid ${p.color}25;">${p.label}</span>
            </div>`,k+=`<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;">
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${f};background:${f}12;border:1px solid ${f}25;">${s.seller_type}</span>
                <span style="font-size:9px;color:var(--text-muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(s.seller_name||"—")}</span>
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;">${v.toUpperCase().slice(0,6)}</span>
                ${_>0?`<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">+${_}%</span>`:""}
            </div>`,k+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-0);">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);margin-top:1px;">${(s.capacity_dwt||0).toLocaleString()} ${s.capacity_unit||"DWT"}</div>
                </div>
                <div style="flex:0.6;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">COND</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${l};margin-top:1px;">${s.condition}%</div>
                </div>
                <div style="flex:0.5;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">AGE</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${g}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">PRICE</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--gold);margin-top:1px;">${x(s.asking_price)}</div>
                </div>
            </div>`,c&&(k+='<div style="margin-top:6px;">',k+=`<div style="padding:4px 8px;margin-bottom:5px;background:var(--bg-0);border:1px solid var(--border-0);">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0);">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CARRIES</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${p.color};">${(xt[s.vessel_class]||{}).label||"?"} class cargo</span>
                    </div>
                    <div style="padding:3px 0;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:1px;">REASON FOR SALE</div>
                        <div style="font-size:9px;color:var(--text-muted);line-height:1.4;">${b(s.sale_reason||"—")}</div>
                    </div>
                </div>`,k+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                    <div style="width:40px;height:3px;background:var(--border-0);"><div style="width:${s.condition}%;height:100%;background:${l};"></div></div>
                    ${s.condition<60?'<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">May need dry dock</span>':""}
                </div>`,_>0&&(k+=`<div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:8px;margin-bottom:3px;">
                        <span style="color:var(--text-dim);">Import tariff (${_}%)</span>
                        <span style="color:#c84;">+${x($)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;margin-bottom:5px;">
                        <span style="color:var(--text-bright);">TOTAL</span>
                        <span style="color:var(--gold);">${x(h)}</span>
                    </div>`),m?k+=`<div onclick="event.stopPropagation();smPurchase('${s.id}',${h})" style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${p.color};cursor:pointer;">${x(h)} — PURCHASE</div>`:k+=`<div style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:var(--text-dim);border:1px solid var(--border-0);opacity:0.4;">⊘ ${s.vessel_class} not available for ${d?.corp_subsector||"your subsector"}</div>`,k+="</div>"),k+="</div></div>",k}).join("");const n=i.filter(s=>s.seller_type==="CORP").length,a=i.filter(s=>s.seller_type==="LOCAL").length;t.innerHTML=`<div style="display:flex;gap:6px;">
        <div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:#5a8aaa;border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CORP</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${n}</span>
        </div>
        <div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:#8b9a6b;border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">LOCAL</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${a}</span>
        </div>
    </div>
    <div onclick="smOpenCommission()" style="padding:4px 14px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--gold);border:1px solid rgba(200,168,50,0.3);cursor:pointer;">COMMISSION VESSEL</div>`}let nt=!1;async function tl(o,e){if(nt||!d||!z)return;const t=Number(d.corp_cash_reserves??0);if(t<e){alert("Insufficient cash. Need "+x(e)+".");return}if(!confirm("Purchase this vessel for "+x(e)+"?"))return;nt=!0;const i=_n.find(l=>l.id===o);if(!i){nt=!1;return}const n=z.current_tick||0,a={Coastal:{capacity_dwt:14e3,capacity_unit:"DWT",base_maintenance:18e4,fuel_capacity:800,purchase_price:3e6},Container:{capacity_dwt:4800,capacity_unit:"TEU",base_maintenance:29e4,fuel_capacity:2100,purchase_price:65e6},Bulk:{capacity_dwt:28e3,capacity_unit:"DWT",base_maintenance:35e4,fuel_capacity:1800,purchase_price:3e6},Tanker:{capacity_dwt:42e3,capacity_unit:"DWT",base_maintenance:38e4,fuel_capacity:2400,purchase_price:53e6},Reefer:{capacity_dwt:12e3,capacity_unit:"DWT",base_maintenance:28e4,fuel_capacity:1600,purchase_price:6e6},LNG:{capacity_dwt:18e3,capacity_unit:"DWT",base_maintenance:58e4,fuel_capacity:1400,purchase_price:78e6}},s=a[i.vessel_class]||a.Coastal,{error:r}=await y.from("factions").update({corp_cash_reserves:t-e}).eq("id",d.id);if(r){alert("Failed: "+r.message),nt=!1;return}const{error:c}=await y.from("corp_vessels").insert({faction_id:d.id,nation_id:d.nation_id,vessel_name:i.vessel_name,vessel_class:i.vessel_class,condition:i.condition,fuel:i.fuel||50,status:"in_port",capacity_dwt:i.capacity_dwt||s.capacity_dwt,capacity_unit:i.capacity_unit||s.capacity_unit,base_maintenance:i.base_maintenance||s.base_maintenance,fuel_capacity:i.fuel_capacity||s.fuel_capacity,purchase_price:e,built_at_tick:n-(i.age_ticks||0),current_port_nation_id:d.nation_id});if(c){await y.from("factions").update({corp_cash_reserves:t}).eq("id",d.id),alert("Failed to create vessel: "+c.message),nt=!1;return}var{error:p}=await y.from("ship_market_listings").update({status:"sold",purchased_by:d.id,purchased_at_tick:n}).eq("id",o);if(p&&console.warn("Failed to mark listing as sold:",p.message),i.seller_faction_id){const{data:l}=await y.from("factions").select("corp_cash_reserves").eq("id",i.seller_faction_id).single();if(l){var{error:f}=await y.from("factions").update({corp_cash_reserves:Number(l.corp_cash_reserves||0)+i.asking_price}).eq("id",i.seller_faction_id);f&&console.warn("Failed to credit seller:",f.message)}}d.corp_cash_reserves=t-e,nt=!1,await Promise.all([ve(),Dn()])}const At=[{cls:"Coastal",baseCost:12e6,baseBuild:3,cargo:"Bulk, Containers (coastal)"},{cls:"Container",baseCost:65e6,baseBuild:5,cargo:"Manufactured, Tech, General"},{cls:"Bulk",baseCost:38e6,baseBuild:4,cargo:"Minerals, Aggregate, Military"},{cls:"Tanker",baseCost:52e6,baseBuild:5,cargo:"Fuel, Petroleum, Chemicals"},{cls:"Reefer",baseCost:45e6,baseBuild:4,cargo:"Food, Perishables, Agriculture"},{cls:"LNG",baseCost:78e6,baseBuild:6,cargo:"Liquefied Natural Gas only"}];let le="Coastal",Ft=0,Ut="",Ye=[];function ol(){le=(Pn[d?.corp_subsector]||["Coastal"])[0],Ft=0,Ut="",Ye=[],document.getElementById("comm-overlay").style.display="flex",nl()}async function nl(){const{data:o}=await y.from("nations").select("id, name, manufacturing_output, physical_infrastructure, tariffs").order("name");Ye=(o||[]).map(e=>{const t=Number(e.manufacturing_output??50),i=Math.round((.75+t/100*.5)*100)/100,n=Math.round((1.5-t/100*.65)*100)/100,a=e.id===d?.nation_id;return{id:e.id,name:e.name,mfg:t,costMod:i,buildMod:n,isHome:a,tariffs:Number(e.tariffs??0)}}),Ye.sort((e,t)=>(t.isHome?1:0)-(e.isHome?1:0)),jn()}function ta(){document.getElementById("comm-overlay").style.display="none"}function il(o){le=o,jn()}function al(o){Ft=o,jn()}function sl(o){Ut=o}function jn(){const o=document.getElementById("comm-content");if(!o)return;const e=z?.current_tick||0,t=At.find(u=>u.cls===le)||At[0],i=Ye[Ft]||{name:"—",costMod:1,buildMod:1},n=xt[le]||{color:"#666"},a=Math.round(t.baseCost*i.costMod),s=Math.max(2,Math.round(t.baseBuild*i.buildMod)),r=Math.round(a*.5),c=a-r,p=e+s,f=Pn[d?.corp_subsector]||[];let l="";l+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:#c8a832;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Commission Vessel</span>
            </div>
            <span onclick="smCloseCommission()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
    </div>`,l+='<div style="flex:1;overflow-y:auto;">',l+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Vessel Type</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">`;for(const u of At){const g=xt[u.cls]||{color:"#666",label:"?"},_=le===u.cls,$=f.includes(u.cls);l+=`<div onclick="${$?"commSetClass('"+u.cls+"')":""}" style="padding:5px 4px;text-align:center;cursor:${$?"pointer":"not-allowed"};background:${_?g.color+"18":"transparent"};border:1px solid ${_?g.color+"44":"#2a2a24"};opacity:${$?1:.3};">
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${_?g.color:"#6a6660"};">${g.label}</div>
            <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;margin-top:2px;">${x(u.baseCost)} base</div>
        </div>`}l+="</div>",l+=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:${n.color};">${t.cargo}</div>`,l+="</div>",l+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Origin Shipyard</div>`;for(let u=0;u<Ye.length;u++){const g=Ye[u],_=Ft===u,$=g.costMod>1?"#c84":g.costMod<1?"#5c5":"#6a6660",h=g.buildMod>1?"#c84":g.buildMod<1?"#5c5":"#6a6660";l+=`<div onclick="commSetNation(${u})" style="display:flex;align-items:center;padding:5px 8px;margin-bottom:2px;cursor:pointer;background:${_?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${_?"#8b9a6b44":"#2a2a24"};border-left:2px solid ${_?"#8b9a6b":"transparent"};">
            <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:11px;font-weight:600;color:${_?"#e8e4dc":"#9e9a92"};">${b(g.name)}</span>
                    ${g.isHome?'<span style="font-family:var(--font-mono);font-size:6px;padding:0 3px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2);line-height:11px;">HOME</span>':""}
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${g.isHome?"Home port — no tariff":"Foreign shipyard"}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">MFG</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#9e9a92;">${g.mfg}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">COST</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${$};">×${g.costMod.toFixed(2)}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">SPEED</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${h};">×${g.buildMod.toFixed(2)}</div></div>
            </div>
        </div>`}l+="</div>",l+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Vessel Name</div>
        <input id="comm-name-input" value="${b(Ut)}" oninput="commSetName(this.value)" placeholder="e.g., MV 'Sierra Nevada'" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:11px;color:#e8e4dc;background:#1c1c18;border:1px solid #2a2a24;outline:none;box-sizing:border-box;" />
    </div>`,l+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Build Summary</div>
        <div style="background:#1c1c18;border:1px solid #2a2a24;padding:6px 10px;">`;const v=[{label:"VESSEL CLASS",value:le,color:n.color},{label:"SHIPYARD",value:i.name,color:"#9e9a92"},{label:"BASE COST",value:x(t.baseCost)+" × "+i.costMod.toFixed(2),color:"#9e9a92"},{label:"BUILD TIME",value:s+" ticks",color:s>t.baseBuild?"#c84":s<t.baseBuild?"#5c5":"#9e9a92"},{label:"COMPLETION",value:"~Tick "+p,color:"#9e9a92"}];for(const u of v)l+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${u.label}</span>
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${u.color};">${u.value}</span>
        </div>`;l+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">TOTAL COST</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c8a832;">${x(a)}</span>
    </div>`,l+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEPOSIT (50% NOW)</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">${x(r)}</span>
    </div>`,l+=`<div style="display:flex;justify-content:space-between;padding:3px 0;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">BALANCE ON COMPLETION</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${x(c)}</span>
    </div>`,l+="</div></div>",l+=`<div style="padding:6px 16px;">
        <div style="padding:5px 8px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#c8a832;margin-bottom:2px;">PAYMENT TERMS</div>
            <div style="font-size:9px;color:#6a6660;line-height:1.5;">50% deposit due immediately. Remaining 50% due on delivery at tick ${p}. Vessel delivered at 100% condition, fully fueled, to your nearest port. Cancellation forfeits deposit.</div>
        </div>
    </div>`,l+="</div>";const m=Ut.trim().length>=2;l+=`<div style="padding:10px 16px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">DEPOSIT DUE NOW</div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${x(r)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="smCloseCommission()" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="comm-order-btn" onclick="${m?"smPlaceOrder()":""}" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:${m?"#000":"#6a6660"};background:${m?"#c8a832":"transparent"};border:1px solid ${m?"#c8a832":"#2a2a24"};cursor:${m?"pointer":"default"};opacity:${m?1:.4};">PLACE ORDER</div>
        </div>
    </div>`,o.innerHTML=l}let kt=!1;async function rl(){if(kt||!d||!z)return;const o=Ut.trim();if(o.length<2)return;const e=At.find(_=>_.cls===le)||At[0],t=Ye[Ft];if(!t)return;const i=Math.round(e.baseCost*t.costMod),n=Math.max(2,Math.round(e.baseBuild*t.buildMod)),a=Math.round(i*.5),s=i-a,r=z.current_tick||0,c=Number(d.corp_cash_reserves??0);if(c<a){alert("Insufficient cash for deposit. Need "+x(a)+".");return}if(!confirm("Commission "+le+" from "+t.name+`?

Deposit: `+x(a)+` (non-refundable)
Balance: `+x(s)+" on delivery at tick "+(r+n)))return;kt=!0;const p=document.getElementById("comm-order-btn");p&&(p.style.opacity="0.4",p.style.pointerEvents="none");const{error:f}=await y.from("factions").update({corp_cash_reserves:c-a}).eq("id",d.id);if(f){alert("Failed: "+f.message),kt=!1;return}const{data:l}=await y.from("nations").select("budget_reserves").eq("id",t.id).single();if(l){var{error:v}=await y.from("nations").update({budget_reserves:Number(l.budget_reserves||0)+a}).eq("id",t.id);v&&console.warn("Failed to credit shipyard nation budget:",v.message)}const m={Coastal:{dwt:14e3,unit:"DWT",maint:18e4,fuel:800},Container:{dwt:4800,unit:"TEU",maint:29e4,fuel:2100},Bulk:{dwt:28e3,unit:"DWT",maint:35e4,fuel:1800},Tanker:{dwt:42e3,unit:"DWT",maint:38e4,fuel:2400},Reefer:{dwt:12e3,unit:"DWT",maint:28e4,fuel:1600},LNG:{dwt:18e3,unit:"DWT",maint:58e4,fuel:1400}},u=m[le]||m.Coastal,{error:g}=await y.from("vessel_orders").insert({faction_id:d.id,vessel_name:o,vessel_class:le,capacity_dwt:u.dwt,capacity_unit:u.unit,base_maintenance:u.maint,fuel_capacity:u.fuel,purchase_price:e.baseCost,shipyard_nation_id:t.id,shipyard_nation:t.name,cost_modifier:t.costMod,build_modifier:t.buildMod,total_cost:i,deposit_paid:a,balance_due:s,ordered_at_tick:r,delivery_tick:r+n,build_ticks:n,status:"building"});if(g){await y.from("factions").update({corp_cash_reserves:c}).eq("id",d.id),alert("Failed to place order: "+g.message),kt=!1;return}d.corp_cash_reserves=c-a,kt=!1,ta(),alert(o+` commissioned!

Class: `+le+`
Shipyard: `+t.name+`
Deposit: `+x(a)+`
Delivery: Tick `+(r+n))}window.smSelectListing=Zr;window.smPurchase=tl;window.smOpenCommission=ol;window.smCloseCommission=ta;window.commSetClass=il;window.commSetNation=al;window.commSetName=sl;window.smPlaceOrder=rl;window.flSelectVessel=Ur;window.flRefurbish=Hr;window.flRefuel=Gr;window.flSell=Vr;window.flRename=Wr;window.openBidReview=Or;window.closeBidReview=No;window.reviewSelectBid=Br;window.acceptBid=Pr;window.declineAllBids=Dr;window.switchToActions=wi;window.actSelectExec=Fs;window.actExecute=zs;window.confirmFireExec=Ss;window.actOpenStatement=Si;window.actCloseStatement=Mn;window.actSubmitStatement=Is;window.actOpenRestructure=Mi;window.actCloseRestructure=An;window.actSubmitRestructure=Os;window.actOpenRebrand=Ai;window.actCloseRebrand=Nn;window.actSubmitRebrand=Bs;window.actOpenDonation=Ni;window.actCloseDonation=Rn;window.actSubmitDonation=js;window.donateSelectParty=Ds;window.lrOpen=zi;window.lrClose=Ii;window.lrSubmit=qs;window.lrSetAmount=Ms;window.lrSetPurpose=As;window.lrSetTerm=Ns;window.lrSetCollateral=Rs;window.openExecSearch=Us;window.closeExecSearch=Li;window.esSelectCandidate=Hs;window.esHireCandidate=Gs;window.switchToExpansion=hi;window.switchToOperations=$i;window.hfSetChange=Vs;window.hfReset=Ws;window.hfConfirm=Ys;document.addEventListener("click",function(o){const e=o.target.closest(".corp-nav-tab[href]:not([data-tab-action])");if(!e)return;const t=e.getAttribute("href");if(!t)return;const i=new URL(t,window.location.href);i.pathname!==window.location.pathname||i.searchParams.get("tab")||e.classList.contains("active")||(o.preventDefault(),$i(o))});_s();
