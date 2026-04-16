const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-BGmUeelO.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as y}from"./supabase-client-CiYoFhIh.js";/* empty css                    */import{c as He,i as ma,a as ua,l as va,M as Rt,Q as bn,b as _n,d as an,e as oi,f as ni,g as ya,h as ga}from"./corp-shipping-data-CcJ84lK3.js";import{_ as xa}from"./preload-helper-BXl3LOEh.js";import{e as b}from"./utils-CY90Gazr.js";import{initMessaging as ba}from"./messaging-BUrQna7p.js";import{c as _a,a as rn,E as qt,b as xo,d as ii,e as ha,f as $a,h as Qn}from"./equipment-DsuDdEne.js";import{a as wa,E as no,b as io,g as ka}from"./corp-executives-D9q33LB9.js";import"./elections-B2jRdA_W.js";import"./config-fKhFNVuq.js";import"./government-types-CONVKpUN.js";import"./ideology-BIAflN4K.js";import"./stats-tIiBSaQA.js";let he=[],d=null,S=null,T=null,at=[],bt={},K=[],Z={},sn=-1;const Ea={em:"em_systems",glass:"glass_facades",heavy:"heavy_parts"},ao=o=>Ea[o]||o;let de="concrete",J="STD",xe=500,ie=[],ai={},ln=0,Lt=[],Bt=[],pt=0,$e=null,ke=-1,_e=[],Ot=null,St={},ro={},hn=[],so=null,pe="trucks",we=0,Ee=1,qe=[],Ge=null,ri=[],dn=null,Jt=null,cn="ALL",pn="TIMELINE";function D(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Ca(o){if(o>=12){const e=Math.floor(o/12),t=o%12;return t>0?e+"y "+t+"mo":e+"y"}return o+" ticks"}function si(o){return!o||o.length===0?"":o.map(e=>{const t=ai[e];if(!t)return"";const i=t.reputation_bonus>0?"var(--green)":t.reputation_bonus<0?"var(--red)":"var(--text-dim)",n=t.reputation_bonus>0?"+"+t.reputation_bonus:t.reputation_bonus<0?String(t.reputation_bonus):"";return`<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:3px;font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">${t.icon||"📍"} ${b(t.name)}${n?` <span style="color:${i};font-weight:700;">${n} REP</span>`:""}</span>`}).filter(Boolean).join(" ")}function fe(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(0)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function $n(o){return o==="civil_engineering"?"CIVIL":o==="industrial"?"INDUSTRIAL":o==="mega_project"?"MEGA":o?.toUpperCase()||"—"}function li(o){return o==="civil_engineering"?"light":o==="industrial"?"heavy":o==="mega_project"?"mega":"light"}function Sa(){Jt&&clearInterval(Jt),Jt=setInterval(()=>{if(!dn)return;const o=dn-Date.now();if(o<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(Jt);return}const e=Math.floor(o/36e5),t=Math.floor(o%36e5/6e4),i=Math.floor(o%6e4/1e3);document.getElementById("tick-countdown").textContent=e+"h "+t+"m "+i+"s"},1e3)}function Ta(){document.body.classList.toggle("light-mode");const o=document.getElementById("theme-toggle");o.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function za(o,e){o==="type"&&(cn=e),o==="sort"&&(pn=e),document.querySelectorAll(`.filter-pill[data-filter="${o}"]`).forEach(t=>{t.classList.toggle("active",t.dataset.value===e)}),ci()}const Kn={"Civil Engineering":"civil_engineering","Industrial Construction":"industrial",Megaprojects:"mega_project"};function di(o){if(!d)return!1;if(Kn[d.corp_subsector]===o.sector)return!0;const t=(V||[]).filter(i=>i.type==="regional_hq"&&i.is_active&&i.nation_id===o.nation_id);for(const i of t)if(Kn[i.subsector]===o.sector)return!0;return!1}function ci(){const o=document.getElementById("oc-list");let e=[...at];if(cn==="GOVERNMENT"?e=e.filter(n=>n.issuer_type==="GOVERNMENT"):cn==="PRIVATE"&&(e=e.filter(n=>n.issuer_type==="PRIVATE")),pn==="TIMELINE"&&e.sort((n,a)=>(n.timeline_ticks||0)-(a.timeline_ticks||0)),pn==="BUDGET"&&e.sort((n,a)=>(a.budget_ceiling||0)-(n.budget_ceiling||0)),document.getElementById("oc-count").textContent=e.length+" AVAILABLE",e.length===0){o.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const t=T?.current_tick||0;let i="";for(const n of e){const a=n.issuer_type==="GOVERNMENT",r=a?"gov":"private",s=di(n),c=s?"":" locked",p=li(n.sector),f=$n(n.sector),l=(n.timeline_ticks||0)>18?" warn":"",u=n.bidding_ends_tick?Math.max(0,n.bidding_ends_tick-t):"?";i+=`
            <div class="oc-item${c}" data-contract-id="${n.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${b(n.name)}</span>
                    <span class="oc-item__type-badge ${r}">${a?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${r}">${b(n.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${u} tick${u!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${fe(n.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${l}">${Ca(n.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${p}">${f}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${bt[n.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${fe(bt[n.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${s?"yes":"no"}">${s?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${s?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openContractDetail(contracts.find(x=>x.id==='${n.id}'))">VIEW</button>`:""}
                </div>
                ${n.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${b(n.description)}</div>`:""}
                ${n.modifiers&&n.modifiers.length>0?`<div style="display:flex;flex-wrap:wrap;gap:3px;padding:4px 0 0;">${si(n.modifiers)}</div>`:""}
            </div>`}o.innerHTML=i,o.querySelectorAll(".oc-item:not(.locked)").forEach(n=>{n.addEventListener("click",()=>{const a=n.dataset.contractId,r=at.find(s=>s.id===a);r&&pi(r)})})}let Ve=null;function pi(o){Ve=o;const e=document.getElementById("cd-overlay"),t=o.issuer_type==="GOVERNMENT",i=t?"gov":"private",n=(S?.name||d.nation||"—").toUpperCase(),a=di(o);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${b(n)}</span>
        <span class="cd-header__name">${b(o.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${i}">${b(o.issuer_name)}</span>
        <span class="cd-header__type-badge ${i}">${t?"GOV":"PRIVATE"}</span>
    `;const r=document.getElementById("cd-blueprint");o.blueprint_svg?(r.innerHTML=o.blueprint_svg,r.style.display=""):(r.innerHTML=Va(o),r.style.display="");const s=o.permits_required||[],c=o.required_equipment||o.equipment_required||{},p=Array.isArray(c)?c.map(N=>({key:N,qty:1})):Object.entries(c).map(([N,O])=>({key:N,qty:O})),f=o.required_materials||o.materials_estimated||{},u={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[o.sector]||o.spec_category||o.sector||"—";let m="var(--teal)";o.sector==="industrial"&&(m="var(--orange)"),o.sector==="mega_project"&&(m="var(--red)");let v=D(o.budget_ceiling||o.budget||0),g=(o.timeline_ticks||o.timeline_months||0)+" Months",_="";_+=`
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
            <div style="display:flex;flex-direction:column;gap:6px;">`;for(const N of $){const O=ai[N];if(!O)continue;const U=O.reputation_bonus>0?"var(--green)":O.reputation_bonus<0?"var(--red)":"var(--text-dim)",W=O.cost_multiplier>1?"+"+Math.round((O.cost_multiplier-1)*100)+"% cost":O.cost_multiplier<1?Math.round((1-O.cost_multiplier)*100)+"% cheaper":"",re=O.reputation_bonus!==0?(O.reputation_bonus>0?"+":"")+O.reputation_bonus+" rep":"",ye=O.required_permits||[];_+=`<div style="padding:6px 10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:600;font-size:0.78rem;color:var(--text-primary);">${O.icon||"📍"} ${b(O.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;">
                        ${W?`<span style="color:var(--amber);">${W}</span>`:""}
                        ${W&&re?" · ":""}
                        ${re?`<span style="color:${U};font-weight:700;">${re}</span>`:""}
                    </span>
                </div>
                <div style="font-size:0.65rem;color:var(--text-dim);margin-top:2px;">${b(O.description||"")}</div>
                ${ye.length>0?`<div style="font-size:0.6rem;color:var(--amber);margin-top:3px;font-family:var(--font-mono);">Requires permits: ${ye.map(H=>b(H.replace(/_/g," "))).join(", ")}</div>`:""}
            </div>`}_+="</div></div>"}_+='<div class="cd-details">',o.project_type&&(_+=Re("Type",o.project_type)),o.project_subtype&&(_+=Re("Sub-Type",o.project_subtype)),_+=Re("Specialization",u,m),_+=Re("Total Budget",v,"var(--green)"),_+=Re("Timeline",g),_+=Re("Nation",S?.name||d.nation||"—"),o.region&&(_+=Re("Region",o.region)),_+="</div>",s.length>0&&(_+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${s.map(N=>{const O=N.status==="approved"?"approved":"required",U=N.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${O}">
                            <span class="cd-chip__icon">${U}</span>
                            <span class="cd-chip__label">${b(N.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),f.length>0&&(_+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${f.map(N=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${b(N.name)}</span>
                        <span class="cd-mat-row__qty">${b(String(N.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=_;const h=s.filter(N=>N.status==="approved").length,E=s.length-h,z=p.length,I=[];for(const N of p){const O=ie.find(U=>U.equipment_key===N.key);O&&O.owned>=N.qty||I.push(N)}const w=I.length,C=o.required_materials||{},q=typeof C=="object"&&!Array.isArray(C)?Object.entries(C):[],k=[];for(const[N,O]of q){const U=Z[N]||{},W=(U.LOW?.qty||0)+(U.STD?.qty||0)+(U.HIGH?.qty||0);W<O&&k.push({key:N,need:O,have:W})}const R=N=>N.replace(/_/g," ").replace(/\b\w/g,O=>O.toUpperCase());let A="";if(z>0)if(w===0)A+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>';else{const N=I.map(O=>R(O.key)).join(", ");A+=`<span class="cd-footer__badge bad" title="${b(N)}">${w} SHORT: ${b(N)}</span>`}if(q.length>0)if(k.length===0)A+='<span class="cd-footer__badge ok">ALL MATERIALS MET</span>';else{const N=k.map(O=>R(O.key)+" ("+O.have+"/"+O.need+")").join(", ");A+=`<span class="cd-footer__badge bad" title="${b(N)}">${k.length} MAT SHORT: ${b(N)}</span>`}s.length>0&&(E===0?A+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':A+=`<span class="cd-footer__badge warn">${E} PERMITS PENDING</span>`);const B=a,F=o.issuer_faction_id===d?.id,j=o.status==="bidding",X=bt[o.id];document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${A}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${F?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${j?"":"disabled"} title="${j?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:X?`<button class="cd-btn primary" onclick="retractBid('${o.id}')" style="background:#c55;border-color:#c55;"
                        title="Retract your bid ($1M penalty)">RETRACT BID</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${B?"":"disabled"}
                        title="${B?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,e.classList.add("open"),document.body.style.overflow="hidden"}function Ht(o){o&&o.target&&o.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",Ve=null)}const Pe=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],Jn={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},Xn={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let L=null;async function et(o){const e=K.find(N=>N.id===o);if(!e)return;const t=Array.isArray(e.contract_bids)?e.contract_bids[0]:e.contract_bids,i=T?.current_tick||0,n=e.awarded_at_tick||i,a=e.timeline_ticks||8,r=Math.max(0,i-n),s=Math.min(100,r/a*100);let c=Math.min(Pe.length-1,Math.floor(s/(100/Pe.length)));const p=Math.round(s%(100/Pe.length)/(100/Pe.length)*100),f=e.required_materials||{},l=t?.material_grades||{};let u=[];try{const{data:N}=await y.from("project_material_allocations").select("material_key, quality_tier, quantity, consumed").eq("contract_id",e.id);u=N||[]}catch{}const m={};for(const N of u)m[N.material_key]||(m[N.material_key]={totalAllocated:0,totalConsumed:0,tiers:{}}),m[N.material_key].totalAllocated+=N.quantity,m[N.material_key].totalConsumed+=N.consumed,m[N.material_key].tiers[N.quality_tier]={qty:N.quantity,consumed:N.consumed};const v=Object.entries(f).map(([N,O])=>{const U=l[N]||"STD",W=m[N]||{totalAllocated:0,totalConsumed:0,tiers:{}};return{key:N,name:N.replace(/_/g," ").replace(/\b\w/g,re=>re.toUpperCase()),grade:U,required:Number(O),allocated:W.totalAllocated,consumed:W.totalConsumed,tiers:W.tiers,warehouseStock:Z[N]||{}}}),g=e.required_equipment||{},_=e.equipment_condition||{},h=(Array.isArray(g)?g.map(N=>[N,1]):Object.entries(g)).map(([N,O])=>{const U=ie.find(H=>H.equipment_key===N),re=(U?.assigned_projects||[]).find(H=>H.contract_id===e.id),ye=re?re.units:0;return{key:N,name:N.replace(/_/g," ").replace(/\b\w/g,H=>H.toUpperCase()),required:Number(O)||1,ownedTotal:U?.owned||0,deployed:U?.deployed||0,available:Math.max(0,(U?.owned||0)-(U?.deployed||0)),assignedToProject:ye,condition:_[N]??(U?.condition||100)}}),E=e.budget_ceiling||0,z=t?.estimated_cost||0,I=Math.round(z*Math.min(1,r/a)),w=t?.estimated_quality||65,C=w>=80?"STRONG":w>=60?"PROMISING":w>=40?"FAIR":"UNCERTAIN",q=e.required_workforce||{},k=e.workers_assigned||{},R=(q.general||0)+(q.skilled||0)+(q.innovative||0),A=(k.general||0)+(k.skilled||0)+(k.innovative||0),B=t?.labor_count||R,F=Number(d?.corp_general_workforce??0),j=Number(d?.corp_skilled_workforce??0),X=Number(d?.corp_innovative_workforce??0);L={project:e,bid:t,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:i,awardedTick:n,totalTicks:a,ticksElapsed:r,phaseIdx:c,phaseProgress:p,materials:v,equipment:h,budget:E,estCost:z,spent:I,quality:w,qualityLabel:C,laborCount:B,wfNeeded:R,wfAssigned:A,reqWf:q,assignedWf:k,corpGeneral:F,corpSkilled:j,corpInnovative:X,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",fi(e.id).then(()=>Qe()),Qe()}let G=!1;async function Ia(o,e,t){if(!(G||!L||!d)){G=!0;try{const{data:i,error:n}=await y.rpc("allocate_material_to_project",{p_contract_id:L.project.id,p_faction_id:d.id,p_material_key:o,p_quality_tier:e,p_quantity:t});if(n){alert("Allocation failed: "+n.message);return}if(i&&!i.success){alert(i.error||"Allocation failed");return}await ui(),await et(L.project.id)}catch(i){alert("Allocation error: "+i.message)}finally{G=!1}}}async function Na(o,e,t){if(!(G||!L||!d)){G=!0;try{const{data:i,error:n}=await y.rpc("deallocate_material_from_project",{p_contract_id:L.project.id,p_faction_id:d.id,p_material_key:o,p_quality_tier:e,p_quantity:t});if(n){alert("Return failed: "+n.message);return}if(i&&!i.success){alert(i.error||"Return failed");return}await ui(),await et(L.project.id)}catch(i){alert("Return error: "+i.message)}finally{G=!1}}}async function Aa(o,e){if(!(G||!L||!d)){G=!0;try{const t=L.project,i=t.workers_assigned||{},n=Number(i[o]||0),a=Number((t.required_workforce||{})[o]||0),r=Number(d?.["corp_"+o+"_workforce"]??0);let s=0;for(const m of K||[])m.id!==t.id&&(s+=Number((m.workers_assigned||{})[o]||0));const c=Math.max(0,r-s-n),p=Math.min(e,a-n,c);if(p<=0){alert(c<=0?"No "+o+" workers available in pool":"Already fully staffed for "+o);return}const f={...i,[o]:n+p},{error:l}=await y.from("construction_contracts").update({workers_assigned:f}).eq("id",t.id);if(l){alert("Assign failed: "+l.message);return}const u=K.find(m=>m.id===t.id);u&&(u.workers_assigned=f),await et(t.id)}catch(t){alert("Assign error: "+t.message)}finally{G=!1}}}async function Ma(o,e){if(!(G||!L||!d)){G=!0;try{const t=L.project,i=t.workers_assigned||{},n=Number(i[o]||0),a=Math.min(e,n);if(a<=0){alert("No "+o+" assigned");return}const r={...i,[o]:n-a},{error:s}=await y.from("construction_contracts").update({workers_assigned:r}).eq("id",t.id);if(s){alert("Unassign failed: "+s.message);return}const c=K.find(p=>p.id===t.id);c&&(c.workers_assigned=r),await et(t.id)}catch(t){alert("Unassign error: "+t.message)}finally{G=!1}}}async function Ra(o,e){if(!(G||!L||!d)){G=!0;try{const t=ie.find(c=>c.equipment_key===o);if(!t){alert("Equipment not found in inventory.");return}const i=Math.max(0,(t.owned||0)-(t.deployed||0));if(i<e){alert("Not enough available "+o+" ("+i+" available).");return}const n=(t.deployed||0)+e,a=[...t.assigned_projects||[]],r=a.find(c=>c.contract_id===L.project.id);r?r.units+=e:a.push({contract_id:L.project.id,contract_name:L.project.name,units:e});const{error:s}=await y.from("corp_equipment").update({deployed:n,assigned_projects:a}).eq("faction_id",d.id).eq("equipment_key",t.equipment_key);if(s){alert("Deploy failed: "+s.message);return}await hi(),await et(L.project.id)}catch(t){alert("Deploy error: "+t.message)}finally{G=!1}}}async function qa(o){if(!(G||!L||!d)){G=!0;try{const e=ie.find(s=>s.equipment_key===o);if(!e){alert("Equipment not found.");return}const t=[...e.assigned_projects||[]],i=t.findIndex(s=>s.contract_id===L.project.id);if(i===-1){alert("Equipment not deployed to this project.");return}const n=t[i].units;t.splice(i,1);const a=Math.max(0,(e.deployed||0)-n),{error:r}=await y.from("corp_equipment").update({deployed:a,assigned_projects:t}).eq("faction_id",d.id).eq("equipment_key",e.equipment_key);if(r){alert("Undeploy failed: "+r.message);return}await hi(),await et(L.project.id)}catch(e){alert("Undeploy error: "+e.message)}finally{G=!1}}}function La(o){o&&o.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",L=null)}function Ba(o){L&&(L.tab=o,L.expandedEvent=-1,L.selectedResponse=null,Qe())}function Oa(o){L&&(L.expandedEvent=L.expandedEvent===o?-1:o,L.selectedResponse=null,Qe())}function Pa(o){L&&(L.selectedResponse=L.selectedResponse===o?null:o,Qe())}function Qe(){if(!L)return;const o=L,e=o.project,t=e.issuer_type==="GOVERNMENT",i=$n(e.sector),n=d?.nation||"Nation",a=o.awardedTick+o.totalTicks,r=Math.max(0,a-o.currentTick),s=o.currentTick>a,c=o.budget>0?Math.round(o.spent/o.budget*100):0,p=c>85?"var(--red)":c>60?"var(--amber)":"var(--teal)",f=o.budget-o.spent,l=o.events.filter(_=>_.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
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
    `;let u='<div class="pm-phase__bar">';for(let _=0;_<Pe.length;_++){const $=_<o.phaseIdx,h=_===o.phaseIdx;u+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${$?"done":h?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${$?"done":h?"active":""}">${Pe[_]}</span>
        </div>`}u+="</div>",u+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${Pe[o.phaseIdx]} — ${o.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${s?"var(--red)":"var(--text-secondary)"}">Tick ${o.ticksElapsed} / ${o.totalTicks}${s?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=u;const m=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:l},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=m.map(_=>`<button class="pm-tab${o.tab===_.id?" active":""}" onclick="pmSetTab('${_.id}')">
            ${_.label}${_.badge>0?`<span class="pm-tab__badge">${_.badge}</span>`:""}
        </button>`).join("");let v="";o.tab==="overview"?v=Da(o,e,p,c,f,r,s):o.tab==="events"?v=ja(o):o.tab==="materials"?v=Fa(o):o.tab==="equipment"&&(v=Ua(o)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${v}</div>`;let g="";l>0&&(g+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${l} EVENT${l>1?"S":""} REQUIRES RESPONSE</span>`),g+=`<span class="pm-ftr__badge" style="color:${o.quality>=70?"var(--green)":o.quality>=50?"var(--amber)":"var(--orange)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${o.quality}/100 — ${o.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${g}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function Da(o,e,t,i,n,a,r){const s=De(o.awardedTick+o.totalTicks);De(o.awardedTick+o.totalTicks);const c=De(o.awardedTick),p=[{label:"Budget",value:fe(o.budget),sub:`${i}% spent`,color:t},{label:"Spent",value:fe(o.spent),color:"var(--red)"},{label:"Remaining",value:fe(n),color:"var(--green)"},{label:"Quality",value:`${o.quality}/100`,sub:o.qualityLabel,color:o.quality>=70?"var(--green)":o.quality>=50?"var(--amber)":"var(--red)"},{label:"Workforce",value:`${o.laborCount}/${o.wfNeeded}`,sub:`Bid: ${o.laborCount}`,color:o.laborCount<o.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${a} ticks`,sub:r?"OVERDUE":`Deadline: ${s}`,color:r?"var(--red)":"var(--text-bright)"}];let f="";f+=`<div style="padding:0 16px"><div class="pm-section">
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
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${r?"var(--red)":"var(--text-bright)"};font-weight:700">${s}</span></span>
        </div>
    </div></div>`;const l=e.modifiers||[];l.length>0&&(f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Building Modifiers</div>',f+='<div style="display:flex;flex-wrap:wrap;gap:4px;">',f+=si(l),f+="</div></div></div>");const u=[];if((e.sector==="civil_engineering"||e.sector==="industrial"||e.sector==="mega_project")&&(u.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),u.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),e.sector!=="civil_engineering"&&u.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),u.length>0){f+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const _ of u)f+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${b(_.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;f+="</div></div>"}f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Workforce Assignment</div>';const m=[{key:"general",label:"General Workers",corpAvail:o.corpGeneral,color:"var(--text-primary)"},{key:"skilled",label:"Skilled Workers",corpAvail:o.corpSkilled,color:"var(--blue)"},{key:"innovative",label:"Innovative Workers",corpAvail:o.corpInnovative,color:"var(--purple)"}];for(const _ of m){const $=Number(o.reqWf[_.key]||0);if($===0)continue;const h=Number(o.assignedWf[_.key]||0),z=h>=$?"var(--green)":h>0?"var(--amber)":"var(--red)",I=_.corpAvail>0&&h<$,w=Math.min(_.corpAvail,$-h),C=h>0;f+='<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.72rem;">',f+="<div>",f+=`<span style="color:${_.color};font-weight:600;">${_.label}</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Required: <strong>${$}</strong></span>`,f+=`<span style="color:${z};margin-left:8px;font-weight:700;">${h} assigned</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Pool: ${_.corpAvail}</span>`,f+="</div>",f+='<div style="display:flex;gap:4px;">',I&&(f+=`<button onclick="pmAssignWorkers('${_.key}',${w})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Assign ${w}</button>`),C&&(f+=`<button onclick="pmUnassignWorkers('${_.key}',${h})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Remove ${h}</button>`),f+="</div></div>"}const v=Number(o.reqWf.general||0)+Number(o.reqWf.skilled||0)+Number(o.reqWf.innovative||0),g=Number(o.assignedWf.general||0)+Number(o.assignedWf.skilled||0)+Number(o.assignedWf.innovative||0);return v>0&&g<v&&(f+='<div style="font-size:0.62rem;color:var(--red);margin-top:6px;font-family:var(--font-mono);">⚠ Project will STALL until workforce is fully assigned</div>'),f+="</div></div>",f}function ja(o){if(o.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let e="";for(let t=0;t<o.events.length;t++){const i=o.events[t],n=o.expandedEvent===t,a=i.status==="ACTIVE",r=Jn[i.type]||Jn.WEATHER,s=Xn[i.severity]||Xn.LOW;if(e+=`<div class="pm-evt ${a?"pm-evt--active":"pm-evt--resolved"}" style="${a?`border-left-color:${r.color}`:""}">`,e+=`<div class="pm-evt__header" onclick="pmToggleEvent(${t})" style="${n?`background:${r.bg}`:""}">`,e+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${r.color};background:${r.bg};border:1px solid ${r.border}">${i.type}</span>
            <span class="pm-evt__sev-badge" style="color:${s}">${i.severity}</span>
            <span class="pm-evt__status" style="color:${a?"var(--red)":"var(--text-dim)"};font-weight:${a?"700":"400"}">${a?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,e+=`<div class="pm-evt__title">${b(i.title)}</div>`,e+=`<div class="pm-evt__meta">Tick ${i.tick} · ${b(i.id||"")}</div>`,n){if(e+='<div class="pm-evt__body">',e+=`<div class="pm-evt__desc">${b(i.desc)}</div>`,i.impact&&(e+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${b(i.impact)}</span>
                </div>`),a&&i.responses&&i.responses.length>0){e+='<div class="pm-evt__resp-title">Response Options</div>';for(let c=0;c<i.responses.length;c++){const p=i.responses[c],f=o.selectedResponse===c,u={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[p.tag]||"var(--text-secondary)";e+=`<div class="pm-resp${f?" selected":""}" style="${f?`border-color:${u}`:""}" onclick="event.stopPropagation();pmSelectResponse(${c})">`,e+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${b(p.label)}</span>
                            <span class="pm-resp__tag" style="color:${u};background:${u}12;border:1px solid ${u}25">${p.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${p.delay>0?"var(--orange)":"var(--green)"}">
                            ${p.delay>0?`+${p.delay} tick${p.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,e+=`<div class="pm-resp__detail">${b(p.detail)}</div>`,e+='<div class="pm-resp__costs">',p.cost&&(e+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${fe(p.cost)}</span>`),p.qualityImpact&&p.qualityImpact!==0&&(e+=`<span class="pm-resp__cost" style="color:${p.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${p.qualityImpact>0?"+":""}${p.qualityImpact}</span>`),!p.cost&&(!p.qualityImpact||p.qualityImpact===0)&&(e+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),e+="</div>",f&&(e+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${u}" onclick="event.stopPropagation();confirmEventResponse('${i.id}','${p.key}')">CONFIRM</button>
                        </div>`),e+="</div>"}}!a&&i.resolution&&(e+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${b(i.resolution)}</div>
                </div>`),e+="</div>"}e+="</div></div>"}return e}function Fa(o){if(o.materials.length===0)return'<div class="pm-evt-empty">No materials required for this project.</div>';let e='<div class="pm-tab-header">Project Materials</div>';for(const t of o.materials){const i=t.required>0?Math.round(t.allocated/t.required*100):0;t.allocated>0&&Math.round(t.consumed/t.allocated*100);const n=t.allocated>=t.required,a=n?"var(--green)":t.allocated>0?"var(--amber)":"var(--red)",r=n?"FULLY ALLOCATED":t.allocated>0?"PARTIAL":"NONE ALLOCATED";e+='<div class="pm-mat" style="margin-bottom:14px;">',e+=`<div class="pm-mat__row1">
            <div class="pm-mat__left">
                <span class="pm-mat__name">${b(t.name)}</span>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:${a};">${t.allocated} / ${t.required} allocated · ${r}</span>
        </div>`,e+=`<div class="pm-mat__bar-row">
            <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${i}%;background:${a};"></div></div>
            <span class="pm-mat__pct">${t.consumed} consumed</span>
        </div>`;const s=["STD","LOW","HIGH"],c=t.required-t.allocated;for(const p of s){const f=t.warehouseStock[p]||{qty:0},l=t.tiers[p]||{qty:0,consumed:0},u=l.qty-l.consumed;if(f.qty===0&&l.qty===0)continue;const m=p==="HIGH"?"var(--green)":p==="LOW"?"var(--orange)":"var(--text-muted)",v=p==="HIGH"?"HIGH":p==="LOW"?"LOW":"STD";if(e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.7rem;">',e+='<div style="display:flex;align-items:center;gap:6px;">',e+=`<span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${m};width:32px;">${v}</span>`,e+=`<span style="color:var(--text-dim);">Warehouse: <strong style="color:var(--text-primary);">${f.qty}</strong></span>`,l.qty>0&&(e+=`<span style="color:var(--text-dim);margin-left:8px;">Allocated: <strong style="color:var(--text-primary);">${l.qty}</strong></span>`),e+="</div>",e+='<div style="display:flex;gap:4px;">',f.qty>0&&c>0){const g=Math.min(f.qty,c);e+=`<button class="pm-alloc-btn" onclick="pmAllocateMaterial('${t.key}','${p}',${g})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Allocate ${g}</button>`}u>0&&(e+=`<button class="pm-alloc-btn" onclick="pmDeallocateMaterial('${t.key}','${p}',${u})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Return ${u}</button>`),e+="</div></div>"}e+="</div>"}return e}function Ua(o){if(o.equipment.length===0)return'<div class="pm-evt-empty">No equipment required for this project.</div>';let e='<div class="pm-tab-header">Project Equipment</div>';for(const t of o.equipment){const i=t.condition>=75?"var(--green)":t.condition>=50?"var(--amber)":t.condition>=25?"var(--orange)":"var(--red)",n=t.assignedToProject>=t.required,a=t.assignedToProject>0&&t.assignedToProject<t.required,r=n?"var(--green)":a||t.ownedTotal>0?"var(--amber)":"var(--red)",s=n?`${t.assignedToProject}/${t.required} DEPLOYED`:a?`${t.assignedToProject}/${t.required} PARTIAL`:t.ownedTotal>0?"NOT DEPLOYED":"NOT OWNED";e+=`<div class="pm-eq" style="margin-bottom:12px;">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${b(t.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${r};margin-left:8px;">${s}</span>
                </div>
            </div>`,t.assignedToProject>0&&(e+=`<div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${t.condition}%;background:${i}"></div></div>
                <span class="pm-eq__cond-val" style="color:${i}">${t.condition}%</span>
            </div>`);const c=Math.min(t.available,t.required-t.assignedToProject);e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:0.7rem;">',e+=`<span style="color:var(--text-dim);">Required: <strong style="color:${n?"var(--green)":"var(--red)"}">${t.required}</strong>`,e+=` · Owned: <strong style="color:var(--text-primary);">${t.ownedTotal}</strong>`,e+=` · Available: <strong style="color:var(--text-primary);">${t.available}</strong></span>`,e+='<div style="display:flex;gap:4px;">',c>0&&(e+=`<button onclick="pmDeployEquipment('${t.key}',${c})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Deploy ${c}</button>`),t.assignedToProject>0&&(e+=`<button onclick="pmUndeployEquipment('${t.key}')" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Undeploy</button>`),e+="</div></div>",e+="</div>"}return e}function De(o){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][o%12]}, ${2e3+Math.floor(o/12)}`}async function Ha(o,e){if(!d||!T)return;const t=prompt(`REQUEST CONSTRUCTION INSURANCE
`+"─".repeat(35)+`

Describe what this policy should cover:

e.g., "Full coverage for weather delays, material damage, and labor disputes during construction. Should cover cost overruns up to 20% of budget."

Insurance corps will see this in their Deal Flow.`);if(t===null)return;const i=t.trim()||"Construction Insurance",n=T.current_tick||0,{error:a}=await y.from("finance_loan_requests").insert({requesting_faction_id:d.id,nation_id:d.nation_id,request_type:"insurance",insured_contract_id:o,amount:e,term_months:0,purpose:i,status:"open",created_tick:n,expires_tick:n+12});if(a){a.message.includes("duplicate")||a.message.includes("unique")?alert("Insurance already requested for this project."):alert("Failed to request insurance: "+a.message);return}alert("Insurance request posted to Deal Flow. Insurance corporations can now offer coverage."),await mi()}window.requestInsurance=Ha;window.openProjectModal=et;window.closeProjectModal=La;window.pmSetTab=Ba;window.pmToggleEvent=Oa;window.pmSelectResponse=Pa;window.pmAllocateMaterial=Ia;window.pmDeallocateMaterial=Na;window.pmDeployEquipment=Ra;window.pmUndeployEquipment=qa;window.pmAssignWorkers=Aa;window.pmUnassignWorkers=Ma;async function fi(o){if(!L)return;const{data:e,error:t}=await y.from("construction_events").select("*").eq("contract_id",o).order("fired_at_tick",{ascending:!1});t?(console.warn("Failed to load project events:",t.message),L.events=[]):L.events=(e||[]).map(i=>({id:i.id,type:i.type,severity:i.severity,tick:i.fired_at_tick,title:i.title,desc:i.description,impact:i.impact,status:i.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:i.resolution,responses:i.responses||[]})),Qe()}let Oo=!1;async function Ga(o,e){if(!(Oo||!L)){Oo=!0;try{const{data:t,error:i}=await y.rpc("resolve_construction_event",{p_event_id:o,p_response_key:e});if(i){console.error("Failed to resolve event:",i.message),alert("Failed to submit response: "+i.message);return}const n=typeof t=="string"?JSON.parse(t):t;if(n?.error){alert("Error: "+n.error);return}await fi(L.project.id),await mi(),n?.quality_applied&&n.quality_applied!==0&&(L.quality=Math.max(0,Math.min(100,L.quality+n.quality_applied)),L.qualityLabel=L.quality>=80?"STRONG":L.quality>=60?"PROMISING":L.quality>=40?"FAIR":"UNCERTAIN"),Qe()}finally{Oo=!1}}}window.confirmEventResponse=Ga;function Re(o,e,t){const i=t?` style="color:${t}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${b(o)}</span>
        <span class="cd-detail-row__value"${i}>${b(e)}</span>
    </div>`}function Va(o){const e={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},t=o.drawing_number||o.contract_number+"-A1",i=T?.current_date||"",n=i?i.replace(/,\s*/," "):"",a=o.spec_category==="Heavy Infrastructure",r=o.spec_category==="Megaproject";let s=b(o.project_subtype||o.project_type||"STRUCTURE"),c=a?"80.0m":r?"200.0m":"60.0m",p=a?"40.0m":r?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${e.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(f,l)=>`<line x1="${l*20}" y1="0" x2="${l*20}" y2="200" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(f,l)=>`<line x1="0" y1="${l*20}" x2="680" y2="${l*20}" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${e.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${e.accent}" font-family="var(--font-mono)" font-weight="700">${s.toUpperCase()}</text>
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
    </svg>`}async function Ke(){if(!d||!d.nation_id)return;const{data:o,error:e}=await y.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(e)console.warn("Failed to load contracts:",e.message),at=[];else{const t=Number(d.corp_reputation??0);at=(o||[]).filter(i=>t>=(i.min_reputation||0))}if(bt={},d&&at.length>0){const t=at.map(n=>n.id),{data:i}=await y.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",d.id).in("contract_id",t);for(const n of i||[])bt[n.contract_id]=n}ci()}function Wa(){const o=document.getElementById("ap-list"),e=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=K.length+" ACTIVE",K.length===0){o.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,e.style.display="none";return}const t=T?.current_tick||0;let i=0,n=0,a="";for(const r of K){const s=r.issuer_type==="GOVERNMENT",c=s?"gov":"private",p=Array.isArray(r.contract_bids)?r.contract_bids[0]:r.contract_bids,f=p?.bid_price||0,l=p?.estimated_cost||0,u=p?.estimated_quality||0,m=r.budget_ceiling||0,v=r.awarded_at_tick||t,g=r.stalled_ticks||0,_=Math.max(0,t-v),$=Math.max(0,_-g),h=r.timeline_ticks||8,E=Math.max(0,h-$),z=Math.min(100,Math.round($/h*100)),I=$>h,w=g>0;let C="";if(w){const k=r.required_workforce||{},R=r.workers_assigned||{},A=[];(Number(R.general)||0)<(Number(k.general)||0)&&A.push("General: "+(Number(R.general)||0)+"/"+(Number(k.general)||0)),(Number(R.skilled)||0)<(Number(k.skilled)||0)&&A.push("Skilled: "+(Number(R.skilled)||0)+"/"+(Number(k.skilled)||0)),(Number(R.innovative)||0)<(Number(k.innovative)||0)&&A.push("Innovative: "+(Number(R.innovative)||0)+"/"+(Number(k.innovative)||0)),A.length>0?C="Workers needed — "+A.join(", "):C="Materials needed — allocate from warehouse"}li(r.sector);const q=$n(r.sector);i+=m,n+=f,a+=`<div class="ap-item" onclick="openProjectModal('${r.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${b(r.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${b(r.issuer_name||"—")} · ${q}</div>
                </div>
                <span class="oc-item__type-badge ${c}">${s?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS${w?' <span style="color:var(--orange);font-weight:700;font-size:7px;">⚠ STALLED ('+g+" ticks) — "+b(C)+"</span>":""}</span>
                    <span class="ap-budget__values" style="color:${I?"var(--red)":w?"var(--orange)":"var(--teal)"}">
                        ${$}/${h} ticks ${I?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${z}%;background:${I?"var(--red)":w?"var(--orange)":"var(--teal)"}"></div>
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
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${u>=70?"var(--green)":u>=40?"var(--teal)":"var(--orange)"}">${u}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${I?"var(--red)":"var(--text-bright)"}">${E} ticks</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">INSURANCE</div>
                    ${r._hasInsurance?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--green);">INSURED</div>':r._insurancePending?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--orange);">PENDING</div>':`<div class="ap-detail-cell__value" style="font-size:8px;cursor:pointer;color:#aa7a5a;font-weight:700;text-decoration:underline;" onclick="event.stopPropagation();requestInsurance('${r.id}',${m})">INSURE</div>`}
                </div>
            </div>
        </div>`}o.innerHTML=a,e.style.display=K.length>0?"":"none",K.length>0&&(document.getElementById("ap-total-crew").textContent=K.length,document.getElementById("ap-total-budget").textContent=fe(i),document.getElementById("ap-total-spent").textContent=fe(n))}async function mi(){if(!d)return;const{data:o,error:e}=await y.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",d.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",d.id).order("awarded_at_tick",{ascending:!0});if(e?(console.warn("Failed to load active projects:",e.message),K=[]):K=o||[],K.length>0){const t=K.map(s=>s.id),{data:i}=await y.from("finance_loan_requests").select("insured_contract_id, status").eq("request_type","insurance").in("insured_contract_id",t),{data:n}=await y.from("finance_active_loans").select("request_id, finance_loan_requests!inner(insured_contract_id)").in("status",["current"]).eq("finance_loan_requests.request_type","insurance"),a=new Set((n||[]).map(s=>s.finance_loan_requests?.insured_contract_id).filter(Boolean)),r=new Set((i||[]).filter(s=>s.status==="open").map(s=>s.insured_contract_id));for(const s of K)s._hasInsurance=a.has(s.id),s._insurancePending=r.has(s.id)}Wa()}const bo=3e4;function _o(){let o=0,e=0;for(const t of Rt)for(const i of bn){const n=Z[t.key]?.[i];n&&(o+=n.qty,e+=n.value)}return{totalUnits:o,totalValue:e}}function wn(){const o=document.getElementById("wh-list"),{totalUnits:e,totalValue:t}=_o();document.getElementById("wh-count").textContent=e.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=D(t);const i=Math.round(e/bo*100),n=document.getElementById("wh-capacity");n.textContent=i+"%",n.style.color=i>80?"var(--red)":i>50?"var(--orange)":"var(--green)";let a="";for(let r=0;r<Rt.length;r++){const s=Rt[r],c=sn===r,p=Z[s.key]?.LOW||{qty:0,value:0},f=Z[s.key]?.STD||{qty:0,value:0},l=Z[s.key]?.HIGH||{qty:0,value:0},u=p.qty+f.qty+l.qty,m=p.value+f.value+l.value,v=u===0,g=He(s.key,"LOW",S),_=He(s.key,"STD",S),$=He(s.key,"HIGH",S),h=p.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",E=f.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",z=$.available?l.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(a+='<div class="wh-row">',a+=`<div class="wh-row__collapsed${c?" expanded":""}" onclick="toggleWhRow(${r})">
            <span class="wh-row__arrow">${c?"▾":"▸"}</span>
            <span class="wh-row__name${v?" empty":""}">${b(s.name)}</span>
            <div class="wh-row__dots">
                <div class="${h}"></div>
                <div class="${E}"></div>
                <div class="${z}"></div>
            </div>
            <span class="wh-row__qty${v?" empty":""}">${u>0?u.toLocaleString():"—"}</span>
            <span class="wh-row__val${v?" empty":""}">${m>0?D(m):"—"}</span>
        </div>`,c){a+='<div class="wh-expand">',a+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const I=[{key:"LOW",label:"Low",data:p,avail:g,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:f,avail:_,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:l,avail:$,color:"var(--green)",dotClass:"wh-dot--high"}];for(const w of I){const C=!w.avail.available,q=w.data.qty>0,k=q?"$"+Math.round(w.data.value/w.data.qty):"—";a+=`<div class="wh-grade${C?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${w.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${C?"var(--red)":w.color}">${w.label}</span>
                        ${C?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${q?"var(--text-bright)":"var(--text-dim)"}">${q?w.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${w.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${w.data.value>0?D(w.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${k}</span>
                </div>`}for(const w of I)!w.avail.available&&w.avail.failedStat&&(a+=`<div class="wh-lock">
                        <span class="wh-lock__text">${w.label.toUpperCase()} GRADE LOCKED — ${b(w.avail.failedStat)} &lt; ${w.avail.failedMin}</span>
                    </div>`);a+="</div>"}a+="</div>"}o.innerHTML=a}function Ya(o){sn=sn===o?-1:o,wn()}async function ui(){if(!d)return;const{data:o,error:e}=await y.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",d.id);Z={};const t=[];if(e)console.warn("Failed to load warehouse:",e.message);else if(o){for(const i of o){const n=ao(i.material_key);Z[n]||(Z[n]={}),Z[n][i.quality_tier]={qty:i.quantity||0,value:Number(i.total_value)||0},n!==i.material_key&&t.push(i)}if(t.length>0){const i=t.map(n=>({faction_id:d.id,nation_id:d.nation_id,material_key:ao(n.material_key),quality_tier:n.quality_tier,quantity:n.quantity||0,total_value:Number(n.total_value)||0,updated_at:new Date().toISOString()}));await y.from("corp_warehouse").upsert(i,{onConflict:"faction_id,material_key,quality_tier"});for(const n of t)await y.from("corp_warehouse").delete().eq("faction_id",d.id).eq("material_key",n.material_key).eq("quality_tier",n.quality_tier)}}wn()}const Qa={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function Ka(){const o=(S?.name||d?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+o;const e=Number(d?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=D(e);const{totalUnits:t}=_o(),i=Math.round(t/bo*100),n=document.getElementById("pr-wh-capacity");n.textContent=i+"%",n.style.color=i>80?"var(--red)":i>50?"var(--orange)":"var(--green)",vi(),kn(),ho()}function vi(){const o=document.getElementById("pr-mat-grid");let e="";for(const t of Rt){const i=de===t.key,n=bn.every(r=>!He(t.key,r,S).available),a="pr-mat-btn"+(i?" active":"")+(n?" all-locked":"");e+=`<span class="${a}" onclick="setPrMat('${t.key}')">${b(t.name)}</span>`}o.innerHTML=e}function kn(){const o=document.getElementById("pr-tier-bar");let e='<span class="pr-tier-label">GRADE</span>';for(const t of bn){const i=He(de,t,S),n=J===t,a=i.available?_n(de,t,S):null,r=ni[t],s=!i.available,c="pr-tier-btn"+(n?" active":"")+(s?" locked":"");e+=`<div class="${c}" onclick="${s?"":`setPrTier('${t}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${r};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${n?"var(--text-bright)":"var(--text-dim)"}">${an[t]}</span>
            </div>
            ${a!==null?`<div class="pr-tier-btn__price" style="color:${n?"var(--text-bright)":"var(--text-muted)"}">$${a}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}o.innerHTML=e}function ho(){const o=document.getElementById("pr-content"),e=He(de,J,S),t=Rt.find(I=>I.key===de);if(!t)return;if(!e.available){o.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${b(t.name)} — ${an[J]} grade
                    is not produced domestically in ${b(S?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${b(e.failedStat||"unknown")} &lt; ${e.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const i=_n(de,J,S),n=oi(de,J,S),a=i*xe,r=n>3e3?"LOW":n>1e3?"MODERATE":"HIGH",s=r==="LOW"?"var(--green)":r==="MODERATE"?"var(--amber)":"var(--red)",c=Number(S?.inflation??50),p=c>55?"up":c<45?"down":"flat",f=p==="up"?"&#9650;":p==="down"?"&#9660;":"&#8212;",l=p==="up"?"var(--red)":p==="down"?"var(--green)":"var(--text-dim)";let u="";u+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
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
                <div class="pr-market-cell__value" style="font-size:12px;color:${s};margin-top:2px;">${r}</div>
            </div>
        </div>
    </div>`,u+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${b(S?.name||"—")})</div>`;for(const I of t.priceDrivers){const w=Number(S?.[I]??50),C=w>=50?"var(--green)":w>=30?"var(--amber)":w>=15?"var(--orange)":"var(--red)",q=Qa[I]||I;u+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${b(I)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${w}%;background:${C}"></div>
            </div>
            <span class="pr-driver-row__val">${w}</span>
            <span class="pr-driver-row__effect">${b(q)}</span>
        </div>`}u+="</div>";const v=(Number(d?.corp_cash_reserves)||0)>=a,g=xe>n,{totalUnits:_}=_o(),$=bo-_,h=xe>$,E=$<=0,z=ni[J];u+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${b(t.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${z};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${z}">${an[J]}</span>
                </div>
                <span class="pr-order__mat-price">$${i}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(I=>`<span class="pr-qty-btn${xe===I?" active":""}" onclick="setPrQty(${I})">${I>=1e3?I/1e3+"k":I}</span>`).join("")}
                </div>
            </div>
            ${g?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${n.toLocaleString()} this tick</span>
            </div>`:""}
            ${E?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">WAREHOUSE FULL — no remaining capacity</span>
            </div>`:h?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS WAREHOUSE CAPACITY — ${$.toLocaleString()} units remaining</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${D(a)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${v&&!g&&!h&&!E?"":"disabled"}
                    title="${v?g?"Exceeds supply":E?"Warehouse full":h?"Exceeds warehouse capacity":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,o.innerHTML=u}function Ja(o){de=o,J="STD";for(const e of["STD","HIGH","LOW"])if(He(o,e,S).available){J=e;break}vi(),kn(),ho()}function Xa(o){J=o,kn(),ho()}function Za(o){xe=o,ho()}let Po=!1;async function er(){if(Po||!d||!S)return;const o=_n(de,J,S),e=oi(de,J,S),t=o*xe,i=Number(d.corp_cash_reserves)||0;if(t>i){alert("Insufficient cash reserves.");return}if(xe>e){alert("Exceeds available supply this tick.");return}const{totalUnits:n}=_o(),a=bo-n;if(a<=0){alert("Warehouse is full. Cannot purchase more materials.");return}if(xe>a){alert(`Warehouse can only hold ${a.toLocaleString()} more units. Reduce quantity.`);return}Po=!0;const r=document.querySelector(".pr-purchase-btn");r&&(r.disabled=!0,r.textContent="...");try{const s=i-t,{error:c}=await y.from("factions").update({corp_cash_reserves:s}).eq("id",d.id);if(c)throw c;const p=ao(de),f=Z[p]?.[J],l=(f?.qty||0)+xe,u=(f?.value||0)+t,{error:m}=await y.from("corp_warehouse").upsert({faction_id:d.id,nation_id:d.nation_id,material_key:p,quality_tier:J,quantity:l,total_value:u,last_purchased_tick:T?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(m){const{error:v}=await y.from("factions").update({corp_cash_reserves:i}).eq("id",d.id);throw v&&console.error("Cash refund failed after warehouse error:",v.message),m}d.corp_cash_reserves=s,Z[p]||(Z[p]={}),Z[p][J]={qty:l,value:u},wn(),Ka(),r&&(r.textContent="PURCHASED",setTimeout(()=>{r.isConnected&&(r.disabled=!1,r.textContent="PURCHASE")},1500))}catch(s){r&&(r.disabled=!1,r.textContent="PURCHASE"),alert("Purchase failed: "+(s.message||"Unknown error"))}finally{Po=!1}}function yi(o){const e=Ge||S;if(!e)return[];const t=xo(o);if(!t)return[];const i=ha(o,e),n=[],a=Number(e?.inflation??50),r=Number(e?.fuel_prices??50);Number(e?.manufacturing_output??50);const s=Ge&&S&&Ge.id!==S.id;let c=null;if(s&&(c=$a(e,S)),i.newAvailable>0){const p=Qn(o,e),f=t.basePrice,l=Math.round(f*((a-50)/200)),u=Math.round(f*((r-50)/300));let m=p;const v=[{label:"Base price",value:D(f)},l!==0?{label:`Inflation (${a})`,mod:(l>=0?"+":"")+D(Math.abs(l))}:null,u!==0?{label:`Fuel transport (${r})`,mod:(u>=0?"+":"")+D(Math.abs(u))}:null].filter(Boolean),g=p-f-l-u;if(g!==0&&!s&&v.push({label:"Demand/scarcity",mod:(g>=0?"+":"")+D(Math.abs(g))}),s&&c){const _=Math.round(p*c.tariff),$=Math.round(p*c.transport);m=p+_+$,v.push({label:`Import tariff (${Math.round(c.tariff*100)}%)`,mod:"+"+D(_)}),v.push({label:`Transport (${c.deliveryTicks} tick${c.deliveryTicks>1?"s":""})`,mod:"+"+D($)})}n.push({seller:s?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:s?c?.deliveryTicks||1:0,condition:100,price:Math.round(m),available:i.newAvailable,delivery:s?c.deliveryTicks+" tick"+(c.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:s?c.deliveryTicks:0,used:!1,priceFactors:v,sourceNationId:e.id})}if(i.usedAvailable>0){const p=i.usedCondition,f=Qn(o,e,{used:!0,condition:p});let l=f;const u=[{label:"Base price",value:D(t.basePrice)},{label:`Condition (${p}%)`,mod:"-"+D(Math.max(0,t.basePrice-f))}];if(s&&c){const m=Math.round(f*c.tariff),v=Math.round(f*c.transport);l=f+m+v,u.push({label:`Import tariff (${Math.round(c.tariff*100)}%)`,mod:"+"+D(m)}),u.push({label:`Transport (${c.deliveryTicks} tick${c.deliveryTicks>1?"s":""})`,mod:"+"+D(v)})}n.push({seller:s?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:s?c?.deliveryTicks||1:0,condition:p,price:Math.round(l),available:i.usedAvailable,delivery:s?c.deliveryTicks+" tick"+(c.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:s?c.deliveryTicks:0,used:!0,priceFactors:u,sourceNationId:e.id})}return n}function En(){const o=Number(d?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=D(o);const e=xo(pe),t=qt[e?.tier||1],i=document.getElementById("em-tier-badge");i&&(i.textContent=t.tag,i.style.color=t.color),i.style.background=t.color+"0a",i.style.border="1px solid "+t.color+"33";const n=document.getElementById("em-nation-select");if(n&&n.options.length===0){const s=S?.name||d?.nation||"—";let c=`<option value="">${b(s)} (HQ)</option>`;for(const p of ri)p.id!==S?.id&&(c+=`<option value="${p.id}">${b(p.name)}</option>`);n.innerHTML=c}const a=document.getElementById("em-import-tag"),r=Ge&&S&&Ge.id!==S.id;a&&(a.style.display=r?"":"none"),tr(),Cn()}function tr(){let o="";for(let e=1;e<=3;e++){const t=qt[e],i=rn(e),n=e===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";o+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${t.color}">${t.tag}</div>
            <div class="${n}">`;for(const a of i){const r=pe===a.key,s=yi(a.key).length>0;o+=`<span class="em-selector__btn${r?" active":""}${s?"":" no-listings"}"
                style="${r?"background:"+t.color+";border-color:"+t.color:""}"
                onclick="setEmType('${a.key}')">${b(a.name)}</span>`}o+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${o}</div>`}function Cn(){const o=document.getElementById("em-content");if(qe=yi(pe),qe.length===0){o.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}we>=qe.length&&(we=0);let e="";for(let i=0;i<qe.length;i++){const n=qe[i],a=we===i,r=n.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",s=ii(n.condition);e+=`<div class="em-listing${a?" selected":""}" style="${a?"border-left-color:"+r:""}" onclick="setEmListing(${i})">`,e+=`<div class="em-listing__row1">
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
                    <div class="em-stat-cell__bar-track"><div class="em-stat-cell__bar-fill" style="width:${n.condition}%;background:${s}"></div></div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${s}">${n.condition}%</span>
                </div>
            </div>
            <div class="em-stat-cell" style="flex:0.8;text-align:center">
                <div class="em-stat-cell__label">AVAIL.</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${n.available}</div>
            </div>
            <div class="em-stat-cell" style="flex:1.2">
                <div class="em-stat-cell__label">PRICE/UNIT</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${D(n.price)}</div>
            </div>
        </div>`,a&&n.priceFactors&&(e+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${n.priceFactors.map(c=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${b(c.label)}</span>
                    <span class="em-breakdown__mod" style="color:${c.mod?c.mod.startsWith("-")?"var(--green)":c.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${c.mod||c.value}</span>
                </div>`).join("")}
            </div>`),e+="</div>"}const t=qe[we];if(t){const i=xo(pe),n=qt[i?.tier||1],a=Math.min(t.available,4),r=t.price*Ee,s=(Number(d?.corp_cash_reserves)||0)>=r;e+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${b(i?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${b(t.seller)}</span>
                </div>
                <span class="em-purchase__price">${D(t.price)}/unit</span>
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
                    <div class="em-purchase__total-value">${D(r)}</div>
                    ${t.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${b(t.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${n.color}" onclick="purchaseEquipment()"
                    ${s?"":"disabled"}
                    title="${s?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}o.innerHTML=e}async function or(o){if(!o)Ge=null;else{let t=ri.find(i=>i.id===o);if(!t)try{const{data:i}=await y.from("nations").select("*").eq("id",o).single();t=i}catch{}Ge=t||null}we=0,Ee=1;const e=document.getElementById("em-nation-select");e&&(e.value=o||""),En()}function nr(o){pe=o,we=0,Ee=1,En()}function ir(o){we=o,Ee=1,Cn()}function ar(o){Ee=o,Cn()}let Do=!1;async function rr(){if(Do)return;const o=qe[we];if(!o||!d)return;const e=xo(pe);if(!e)return;const t=Ee,i=o.price*t,n=Number(d.corp_cash_reserves)||0;if(i>n){alert("Insufficient cash reserves.");return}if(t>o.available){alert("Not enough units available.");return}const a=document.querySelector(".em-purchase-btn");a&&(a.disabled=!0,a.textContent="..."),Do=!0;try{const r=n-i,{error:s}=await y.from("factions").update({corp_cash_reserves:r}).eq("id",d.id);if(s)throw s;const c=!o.deliveryTicks||o.deliveryTicks===0;if(c){const f=ie.find(E=>E.equipment_key===pe),l=(f?.owned||0)+t,u=f?.purchase_price_avg||0,m=f?.owned||0,v=m>0?Math.round((u*m+o.price*t)/l):o.price,g=e.maintenancePerUnit*l,_=f?.condition||100,$=Math.round((_*m+o.condition*t)/l),{error:h}=await y.from("corp_equipment").upsert({faction_id:d.id,nation_id:d.nation_id,equipment_key:pe,tier:e.tier,owned:l,deployed:f?.deployed||0,condition:$,maintenance_per_tick:g,purchase_price_avg:v,last_purchased_tick:T?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(h){const{error:E}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",d.id);throw E&&console.error("Cash refund failed:",E.message),h}f?(f.owned=l,f.condition=$,f.maintenance_per_tick=g):ie.push({equipment_key:pe,tier:e.tier,owned:l,deployed:0,condition:$,maintenance_per_tick:g,assigned_projects:[]})}else{const f=(T?.current_tick||0)+o.deliveryTicks,{error:l}=await y.from("corp_equipment_deliveries").insert({faction_id:d.id,equipment_key:pe,quantity:t,condition:o.condition,delivery_tick:f,source_nation_id:o.sourceNationId||null,seller_name:o.seller,price_paid:i});if(l){const{error:u}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",d.id);throw u&&console.error("Cash refund failed:",u.message),l}}d.corp_cash_reserves=r,Nn(),En();const p=document.getElementById("pr-cash");p&&(p.textContent=D(r)),a&&(a.textContent=c?"PURCHASED":"ORDERED",setTimeout(()=>{a.isConnected&&(a.disabled=!1,a.textContent="PURCHASE")},1500))}catch(r){a&&(a.disabled=!1,a.textContent="PURCHASE"),alert("Purchase failed: "+(r.message||"Unknown error"))}finally{Do=!1}}let sr=-1,rt=[],lo=[],fn=[];function jo(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o.toLocaleString()}function lr(o,e,t){if(t)return"var(--orange)";const i=o/(e||1)*100;return i>50?"var(--green)":i>25?"var(--amber)":"var(--red)"}function Zn(){const o=document.getElementById("pm-list"),e=rt.length,t=lo.length,i=fn.length,n=rt.filter(c=>c.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${e})`,document.getElementById("pm-pending-count").textContent=`(${t})`,document.getElementById("pm-apply-count").textContent=`(${i})`;const a=document.getElementById("pm-badges");let r="";n>0&&(r+=`<span class="pm-badge pm-badge--expiring">${n} EXPIRING</span>`),t>0&&(r+=`<span class="pm-badge pm-badge--pending">${t} PENDING</span>`),a.innerHTML=r;const s=rt.reduce((c,p)=>c+(p.cost||0),0)+lo.reduce((c,p)=>c+(p.cost||0),0);document.getElementById("pm-total-cost").textContent=jo(s),document.getElementById("pm-footer-active").textContent=e,document.getElementById("pm-footer-pending").textContent=t;{if(e===0){o.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let c="";rt.forEach((p,f)=>{const l=sr===f,u=lr(p.ticks_left,p.total_ticks,p.expiring_soon),m=Math.min(p.ticks_left/(p.total_ticks||1)*100,100);c+=`<div class="pm-item ${p.expiring_soon?"pm-item--expiring":""} ${l?"expanded":""}" onclick="togglePmExpand(${f})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${b(p.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${b((p.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${u}">Expires: ${b(p.expires||"")}</span>
                        <span class="pm-item__ticks">(${p.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${m}%;background:${u}"></div></div>`,l&&(c+=`<div class="pm-detail">
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
                        <div class="pm-projects__list">${(p.projects||[]).map(v=>`<span class="pm-project-chip">${b(v)}</span>`).join("")}</div>
                    </div>`,p.note&&(c+=`<div class="pm-note"><span class="pm-note__text">${b(p.note)}</span></div>`),p.expiring_soon&&p.renewable&&(c+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew" onclick="event.stopPropagation(); pmApplyForPermit('${p.permit_key}');">RENEW — ${jo(p.cost||0)}</button></div>`),c+="</div>"),c+="</div></div>"}),o.innerHTML=c;return}}let Fo=!1;async function dr(o){if(!(Fo||!d||!S)){Fo=!0;try{const{data:e}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{data:i,error:n}=await y.rpc("apply_for_permit",{p_faction_id:d.id,p_nation_id:S.id,p_permit_key:o,p_current_tick:t});if(n){alert("Application failed: "+n.message);return}if(i&&!i.success){alert(i.error||"Application failed");return}alert("Permit application submitted! Processing: "+(i.processing_ticks||0)+" ticks."),await cr()}catch(e){alert("Error: "+e.message)}finally{Fo=!1}}}window.pmApplyForPermit=dr;async function cr(){if(!d||!S){rt=[],lo=[],fn=[],Zn();return}const{data:o}=await y.from("construction_permits").select("*"),e=o||[],t={};for(const l of e)t[l.permit_key]=l;const{data:i}=await y.from("corp_permits").select("*").eq("faction_id",d.id).eq("nation_id",S.id),n=i||[],{data:a}=await y.from("active_laws").select("policy_id, policies(permit_key, policy_name)").eq("nation_id",S.id).not("policies.permit_key","is",null),r=new Set,s={};for(const l of a||[])l.policies?.permit_key&&(r.add(l.policies.permit_key),s[l.policies.permit_key]=l.policies.policy_name);const{data:c}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),p=c?.current_tick||0;rt=n.filter(l=>l.status==="active").map(l=>{const u=t[l.permit_key]||{},m=l.expires_at_tick?Math.max(0,l.expires_at_tick-p):999,v=u.duration_ticks||24;return{name:u.name||l.permit_key,permit_key:l.permit_key,nation:S.name,policy:s[l.permit_key]||"—",issued:l.granted_at_tick!=null?De(l.granted_at_tick):"—",expires:l.expires_at_tick?De(l.expires_at_tick):"Single-use",cost:l.cost_paid||0,ticks_left:m,total_ticks:v,expiring_soon:m<=3&&m>0,renewable:u.duration_ticks!=null,projects:[]}}),lo=n.filter(l=>l.status==="pending").map(l=>{const u=t[l.permit_key]||{},m=u.processing_ticks||2,v=p-l.applied_at_tick,g=Math.max(0,m-v);return{name:u.name||l.permit_key,permit_key:l.permit_key,nation:S.name,applied:De(l.applied_at_tick),status:"PROCESSING",processing_total:m,ticks_remaining:g,est_approval:De(l.applied_at_tick+m),cost:l.cost_paid||0,required_by:s[l.permit_key]||"—"}});const f=new Set(n.filter(l=>l.status==="active"||l.status==="pending").map(l=>l.permit_key));fn=[...r].filter(l=>!f.has(l)).map(l=>{const u=t[l]||{};return{name:u.name||l,permit_key:l,nation:S.name,description:u.description||"",policy:s[l]||"—",cost:u.cost_is_percentage?15e4:u.cost||0,processing_time:u.processing_ticks||2,duration:u.duration_ticks?u.duration_ticks+" ticks":"Single-use",category:u.category||"",difficulty:u.difficulty||"EASY"}}),Zn()}let ft=!1,Uo=!1;function gi(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+Math.round(o/1e3)+"k":"$"+Math.round(o)}async function Sn(){var{data:o,error:e}=await y.from("factions").select("*").eq("id",d.id).single();if(e){console.warn("Faction refresh failed:",e.message);return}o&&(d=o);var t=document.getElementById("topbar-cash");t&&(t.textContent="CASH: "+gi(Number(d.corp_cash_reserves??0)))}const mn={CRITICAL:"#c55",HIGH:"#5c5",MODERATE:"#ca5",LOW:"#6a6660"};let mt=[],Tn=[],xi="ready",Tt=null,co="ALL",ee=-1;const ei={COASTAL:{color:"#8b9a6b",label:"COASTAL"},INTERNATIONAL:{color:"#5a8aaa",label:"INTL"},GOVERNMENT:{color:"#c8a832",label:"GOV CONTRACT"}};function pr(o){co=o,ee=-1,document.querySelectorAll(".ar-pill").forEach(e=>{const t=e.getAttribute("data-ar-filter");e.className="ar-pill"+(t===o?" active-"+(o==="ALL"?"all":o==="COASTAL"?"coastal":o==="INTERNATIONAL"?"intl":"gov"):"")}),In()}function zn(){return co==="ALL"?mt:mt.filter(o=>o.scope===co)}async function $o(){if(!d||d.corp_sector!=="Shipping")return;const o=await ga(y,d.id,d.corp_subsector);mt=o.routes,Tn=o.applications,xi=o.state,Tt=o.error,Tt&&console.warn("Failed to load available routes:",Tt.message),ee=-1,In()}var fr={fuel_energy:[{stat:"industrialization",label:"Industrialization"},{stat:"urbanization",label:"Urbanization"}],minerals:[{stat:"industrialization",label:"Industrialization"},{stat:"manufacturing",label:"Manufacturing"}],grains_staples:[{stat:"population_growth",label:"Population Growth"},{stat:"food_security",label:"Food Security"}],livestock_dairy:[{stat:"standard_of_living",label:"Std of Living"},{stat:"food_security",label:"Food Security"}],cash_crops:[{stat:"trade_balance",label:"Trade Balance"},{stat:"foreign_investment",label:"Foreign Investment"}],manufactured_goods:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],technology:[{stat:"technology",label:"Technology"},{stat:"higher_education",label:"Higher Education"}],fruits_vegetables:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],arms:[{stat:"military_spending",label:"Military Spending"},{stat:"stability",label:"Stability"}]};function mr(o){return fr[o]||[]}function ur(o){var e=Number(o.competition_count||0),t=o.demand_level||"",i=o.scope==="GOVERNMENT";return i?"Fixed payment. No demand risk. Vessel locked for contract duration.":e===0&&t==="CRITICAL"?"Unserved critical corridor. High volume, no competition — claim immediately.":e===0&&t==="HIGH"?"Virgin route with strong demand. First-mover advantage available.":e===0?"No competition on this route. Market share starts at 100%.":t==="CRITICAL"&&e<=2?"Underserved critical route. Demand exceeds current capacity.":t==="LOW"?"Thin route. Revenue may not justify vessel deployment.":e>=3?"Crowded route. Market share will be split "+(e+1)+" ways.":Number(o.tariff_rate||0)>15?"High tariff rate cuts into margins. Watch for trade policy changes.":null}function In(){const o=zn();document.getElementById("ar-count").textContent=mt.length+" ROUTES";var e={COASTAL:0,INTERNATIONAL:0,GOVERNMENT:0};mt.forEach(function($){e[$.scope]!==void 0&&e[$.scope]++});var t=e.COASTAL,i=e.INTERNATIONAL,n=e.GOVERNMENT;document.getElementById("ar-footer-counts").innerHTML='<div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#8b9a6b"></div><span class="ar-footer__count-label">COASTAL</span><span class="ar-footer__count-num">'+t+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#5a8aaa"></div><span class="ar-footer__count-label">INTL</span><span class="ar-footer__count-num">'+i+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#c8a832"></div><span class="ar-footer__count-label">GOV</span><span class="ar-footer__count-num">'+n+"</span></div>";const a=document.getElementById("ar-claim-btn");a.className="ar-claim-btn"+(ee>=0?" active":"");const r=document.getElementById("ar-list");if(xi==="error"){r.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+b(Tt&&Tt.message||"Shipping routes are temporarily unavailable.")+"</div></div>";return}if(o.length===0){r.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+(mt.length===0?"No routes available.<br>Routes are generated from bilateral<br>trade each tick. Check back after<br>the next corp tick fires.":"No "+co.toLowerCase()+" routes available.")+"</div></div>";return}let s="";for(let $=0;$<o.length;$++){const h=o[$],E=ee===$,z=ei[h.scope]||ei.INTERNATIONAL,I=h.scope==="GOVERNMENT",w=h.demand_level&&mn[h.demand_level]?{color:mn[h.demand_level],label:h.demand_level}:null,C=Number(h.competition_count||0),q=C===0?"#5c5":C<=2?"#ca5":"#c84";s+='<div style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid '+(E?z.color:"transparent")+";background:"+(E?z.color+"08":"transparent")+';" onclick="arSelectRoute('+$+')"><div style="padding:8px 14px;">',s+='<div style="display:flex;align-items:center;gap:0;margin-bottom:4px;"><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+b(h.origin_port||"?")+'</span><div style="flex:1;display:flex;align-items:center;margin:0 8px;"><div style="flex:1;height:1px;background:'+z.color+'44"></div><span style="font-family:var(--font-mono);font-size:7px;color:'+z.color+';padding:0 6px">⚓</span><div style="flex:1;height:1px;background:'+z.color+'44"></div></div><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+b(h.destination_port||"?")+"</span></div>",s+='<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;"><span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+z.color+";background:"+z.color+"12;border:1px solid "+z.color+'25">'+z.label+"</span>",w&&(s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+w.color+";background:"+w.color+"12;border:1px solid "+w.color+'25">'+w.label+" DEMAND</span>"),I&&h.gov_issuer&&(s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">'+b(h.gov_issuer)+"</span>"),C===0&&!I&&(s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15)">NO COMPETITION</span>');var c=Tn.find(function(k){return k.route_id===h.id});if(c){var p=c.status==="approved"?"#5c5":"#c8a832",f=c.status==="approved"?"APPROVED":"APPLIED";s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+p+";background:"+p+"12;border:1px solid "+p+'25">'+f+"</span>"}if(s+='<span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-left:auto">'+(h.transit_ticks||"?")+" tick"+((h.transit_ticks||0)!==1?"s":"")+" · "+b(h.vessel_class||"?")+"</span>",s+="</div>",s+='<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">',I?(s+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(h.gov_contract_duration||h.transit_ticks||"?")+" ticks</div></div>",s+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VESSEL</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+b(h.vessel_class||"?")+"</div></div>",s+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT VALUE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-top:1px">'+D(Number(h.gov_contract_value||h.estimated_revenue||0))+"</div></div>"):(s+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VOLUME</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);margin-top:1px">'+D(Number(h.trade_volume||0))+"</div></div>",s+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">COMP.</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+q+';margin-top:1px">'+C+"</div></div>",s+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">TRANSIT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(h.transit_ticks||"?")+" tick"+((h.transit_ticks||0)!==1?"s":"")+"</div></div>",s+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">EST. REV</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;margin-top:1px">'+D(Number(h.estimated_revenue||0))+"</div></div>"),s+="</div>",E){if(s+='<div style="margin-top:6px;">',I&&h.goods_description&&(s+='<div style="font-size:10px;color:var(--text-muted);line-height:1.5;margin-bottom:6px">'+b(h.goods_description)+"</div>"),h.trade_agreement_name&&(s+='<div style="padding:4px 8px;margin-bottom:5px;background:rgba(90,138,170,0.05);border:1px solid rgba(90,138,170,0.12)"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:var(--font-mono);font-size:7px;color:#5a8aaa;letter-spacing:0.5px">TRADE AGREEMENT</div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:1px">'+b(h.trade_agreement_name)+'</div></div><div style="text-align:right"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">TARIFF</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(Number(h.tariff_rate||0)>10?"#c84":"#5c5")+'">'+Number(h.tariff_rate||0).toFixed(1)+"%</div></div></div></div>"),s+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px">',s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VESSEL CLASS</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+b(h.vessel_class||"?")+"</span></div>",h.vessel_note&&(s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">REQUIREMENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+b(h.vessel_note)+"</span></div>"),s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">PROXIMITY</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+(h.proximity!=null?h.proximity:"?")+" / 100</span></div>",s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CARGO</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+b(h.goods_name||"Unknown")+"</span></div>",h.goods_description&&!I&&(s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CONTENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+b(h.goods_description)+"</span></div>"),s+='<div style="display:flex;justify-content:space-between;padding:2px 0"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VOLUME</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+Number(h.volume_physical||0).toLocaleString()+" "+b(h.volume_unit||"tons")+"</span></div>",s+="</div>",S&&!I){var l=mr(h.trade_sector);if(l.length>0){s+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.8px;margin-bottom:3px">DEMAND DRIVERS</div>';for(var u=0;u<l.length;u++){var m=l[u],v=Number(S[m.stat]??50),g=v>=50?"#5c5":v>=30?"#ca5":"#c84";s+='<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);width:100px">'+b(m.label)+'</span><div style="width:40px;height:2px;background:var(--border-0)"><div style="width:'+v+"%;height:100%;background:"+g+'"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-bright)">'+Math.round(v)+"</span></div>"}s+="</div>"}}var _=ur(h);_&&(s+='<div style="padding:4px 8px;background:'+z.color+"08;border:1px solid "+z.color+'15"><div style="font-size:9px;color:var(--text-muted);line-height:1.5">'+b(_)+"</div></div>"),s+="</div>"}s+="</div></div>"}r.innerHTML=s}function vr(o){ee=ee===o?-1:o,In()}async function yr(){if(!(ft||ee<0||!d||!T)){var o=zn(),e=o[ee];if(e){var t=Tn.find(function(v){return v.route_id===e.id});if(t){alert("You have already applied for this route. Status: "+t.status);return}var i={"Bulk Cargo":"bulk_cargo","Container Freight":"container_freight","Specialized Transport":"specialized_transport"},n=i[d.corp_subsector]||"";if(e.shipping_subsector&&n!==e.shipping_subsector){var a=e.shipping_subsector.replace(/_/g," ").replace(/\b\w/g,function(v){return v.toUpperCase()});alert("Your fleet specializes in "+(d.corp_subsector||"?")+" but this route requires "+a+". You cannot service this route.");return}var r=5e4,{data:s}=await y.from("factions").select("corp_cash_reserves").eq("id",d.id).single(),c=Number(s?.corp_cash_reserves??0);if(c<r){alert("Not enough funds. Application fee: $50k. You have $"+Math.round(c/1e3)+"k.");return}ft=!0;var p=document.getElementById("ar-claim-btn");p.textContent="APPLYING...";try{var f=c-r,{error:l}=await y.from("factions").update({corp_cash_reserves:f}).eq("id",d.id);if(l){alert("Failed to deduct fee.");return}var{data:u,error:m}=await y.from("shipping_applications").insert({route_id:e.id,faction_id:d.id,proposed_rate:Number(e.estimated_revenue||0),application_fee:r,status:"pending",applied_at_tick:T.current_tick}).select("*").single();if(m){alert("Application failed: "+m.message),await y.from("factions").update({corp_cash_reserves:c}).eq("id",d.id);return}await y.from("event_log").insert({nation_id:e.origin_nation_id,event_name:d.faction_name+" applied to service "+(e.origin_port||"?")+" → "+(e.destination_port||"?")+" route",category:"corporate",description_chosen:d.faction_name+" has submitted a shipping application for the "+(e.goods_name||"trade")+" route between "+(e.origin_port||"?")+" and "+(e.destination_port||"?")+". Awaiting government approval.",fired_at_tick:T.current_tick}).catch(function(){}),await Sn(),ee=-1,await $o(),alert("Application submitted! The government will review your application.")}catch(v){alert("Application failed: "+(v.message||"Network error"))}finally{ft=!1,p.textContent="APPLY TO SERVICE — $50k",p.className="ar-claim-btn"+(ee>=0?" active":"")}}}}async function gr(){if(!(ft||ee<0||!d||!T)){var o=zn(),e=o[ee];if(e){var t=Number(d.shipping_fleet_capacity??0),i=Number(d.shipping_fleet_deployed??0);if(i>=t){alert("No available vessels. Fleet capacity: "+t+", deployed: "+i+".");return}ft=!0;var n=document.getElementById("ar-claim-btn");n.textContent="CLAIMING...",n.className="ar-claim-btn";try{var{data:a,error:r}=await y.rpc("claim_shipping_route",{p_faction_id:d.id,p_route_id:e.id,p_current_tick:T.current_tick});if(r){alert("Claim failed: "+r.message);return}if(a&&!a.success){alert(a.error||"Claim failed.");return}if(a?.claim_id){var s=(_e||[]).find(function(u){return u.status==="in_port"&&!u.active_claim_id&&u.fuel>=10});if(s){var{error:c}=await y.from("corp_vessels").update({status:"in_transit",active_claim_id:a.claim_id,current_port_nation_id:null}).eq("id",s.id);c&&console.warn("Failed to assign vessel to route:",c.message)}else console.warn("Route claimed but no available vessel with fuel >= 10% to assign.")}try{var p=e.origin_nation?.name||e.origin_nation_id||"Unknown",f=e.destination_nation?.name||e.destination_nation_id||"Unknown",l=e.goods_type||e.cargo_type||"goods";await y.from("event_log").insert({nation_id:d.nation_id,event_name:"Shipping Route Signed",category:"corporate",description_chosen:d.faction_name+" has just signed an agreement to ship "+l+" between "+p+" and "+f+".",fired_at_tick:T.current_tick||0})}catch{}await Sn(),ee=-1,await Promise.all([$o(),wo(),ve()])}catch(u){alert("Claim failed: "+(u.message||"Network error"))}finally{ft=!1,n.textContent="CLAIM ROUTE",n.className="ar-claim-btn"+(ee>=0?" active":"")}}}}let Le=[],bi="ready",zt=null,po=-1;async function wo(){if(!d)return;const o=await va(y,d.id);Le=o.claims,bi=o.state,zt=o.error,zt&&console.warn("Failed to load active voyages:",zt.message),_i()}function xr(o){po=po===o?-1:o,_i()}async function br(o){if(!(Uo||!d||!T)){Uo=!0;try{var{data:e,error:t}=await y.rpc("release_shipping_route",{p_faction_id:d.id,p_claim_id:o,p_current_tick:T.current_tick});if(t){alert("Release failed: "+t.message);return}if(e&&!e.success){alert(e.error||"Release failed.");return}var{error:i}=await y.from("corp_vessels").update({status:"in_port",active_claim_id:null}).eq("active_claim_id",o).eq("faction_id",d.id);i&&console.warn("Failed to free vessel on release:",i.message),po=-1,await Sn(),await Promise.all([$o(),wo(),ve()])}catch(n){alert("Release failed: "+(n.message||"Network error"))}finally{Uo=!1}}}function _i(){const o=T?.current_tick||0,e=Number(d?.shipping_fleet_capacity??0),t=Number(d?.shipping_fleet_deployed??0),i=d?.corp_subsector||"--";document.getElementById("av-count").textContent=Le.length+" ACTIVE";const n=Le.reduce((f,l)=>f+Number(l.total_revenue||0),0),a=Le.reduce((f,l)=>f+(l.transits_completed||0),0),r=a>0?Math.round(n/a):0;document.getElementById("av-summary").innerHTML=`
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
            <div class="av-summary__value" style="color:var(--green)">${D(r)}</div>
        </div>`,document.getElementById("av-total-revenue").textContent=D(n),document.getElementById("av-total-revenue").style.color=n>0?"var(--green)":"var(--text-dim)",document.getElementById("av-fleet-status").textContent=t+"/"+e,document.getElementById("av-subsector").textContent=i;const s=document.getElementById("av-list");if(bi==="error"){s.innerHTML='<div class="av-empty"><div class="av-empty__text">'+b(zt&&zt.message||"Active voyage data is temporarily unavailable.")+"</div></div>";return}if(Le.length===0){s.innerHTML='<div class="av-empty"><div class="av-empty__text">No active voyages.<br>Claim a shipping route to<br>deploy your fleet.</div></div>';return}let c="";for(let f=0;f<Le.length;f++){const l=Le[f],u=l.shipping_routes||{},m=po===f,v=l.vessel_status||"idle";let g=v.toUpperCase().replace("_"," "),_="av-status--idle",$="";if(v==="loading")_="av-status--loading",g="LOADING";else if(v==="in_transit"){_="av-status--transit";const C=l.transit_started_tick||o,k=(l.transit_arrives_tick||C+(u.transit_ticks||2))-C,R=Math.max(0,Math.min(o-C,k)),A=k>0?Math.round(R/k*100):0;g="IN TRANSIT ("+R+"/"+k+")",$='<div class="av-transit-bar"><div class="av-transit-bar__fill" style="width:'+A+'%"></div></div>'}const h=Number(l.revenue_per_transit||0),E=Number(l.market_share_pct||0),z=l.transits_completed||0,I=Number(l.total_revenue||0),w=mn[u.demand_level]||"#6a6660";if(c+='<div class="av-item" onclick="avToggle('+f+')"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;"><div class="av-item__route">'+b(u.origin_port||"?")+" → "+b(u.destination_port||"?")+'</div><span class="av-status '+_+'">'+g+'</span></div><div class="av-item__cargo">'+b(u.goods_name||"Unknown")+" · "+b(u.vessel_class||"?")+"</div>"+$+'<div class="av-item__stats"><div class="av-stat"><div class="av-stat__label">REV/TRIP</div><div class="av-stat__value" style="color:var(--green)">'+D(h)+'</div></div><div class="av-stat"><div class="av-stat__label">SHARE</div><div class="av-stat__value">'+E.toFixed(1)+'%</div></div><div class="av-stat"><div class="av-stat__label">TRANSITS</div><div class="av-stat__value">'+z+'</div></div><div class="av-stat"><div class="av-stat__label">TOTAL REV</div><div class="av-stat__value" style="color:var(--green)">'+D(I)+"</div></div></div>",m){c+='<div class="av-item__detail"><div class="av-detail-row"><span class="av-detail-label">ORIGIN</span><span class="av-detail-value">'+b(u.origin_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">DESTINATION</span><span class="av-detail-value">'+b(u.destination_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE SECTOR</span><span class="av-detail-value">'+b((u.trade_sector||"").replace(/_/g," ").toUpperCase())+'</span></div><div class="av-detail-row"><span class="av-detail-label">SCOPE</span><span class="av-detail-value">'+b(u.scope||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRANSIT TIME</span><span class="av-detail-value">'+(u.transit_ticks||"?")+' ticks</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE VOLUME</span><span class="av-detail-value">'+D(Number(u.trade_volume||0))+'</span></div><div class="av-detail-row"><span class="av-detail-label">TARIFF</span><span class="av-detail-value">'+Number(u.tariff_rate||0).toFixed(1)+'%</span></div><div class="av-detail-row"><span class="av-detail-label">COMPETITION</span><span class="av-detail-value">'+(u.competition_count??0)+' corps</span></div><div class="av-detail-row"><span class="av-detail-label">DEMAND</span><span class="av-detail-value" style="color:'+w+'">'+(u.demand_level||"?")+"</span></div>"+(u.trade_agreement_name?'<div class="av-detail-row"><span class="av-detail-label">AGREEMENT</span><span class="av-detail-value" style="color:var(--teal)">'+b(u.trade_agreement_name)+"</span></div>":"")+'<div class="av-detail-row"><span class="av-detail-label">CLAIMED</span><span class="av-detail-value">Tick '+(l.claimed_at_tick||"?")+"</span></div>";var p=(_e||[]).find(function(C){return C.active_claim_id===l.id});!p&&v==="loading"?c+=`<div style="padding:6px 8px;margin-top:4px;background:rgba(200,168,50,0.06);border:1px solid rgba(200,168,50,0.15);text-align:center;"><div style="font-family:var(--font-mono);font-size:9px;color:var(--orange);font-weight:700;margin-bottom:4px;">NO VESSEL ASSIGNED</div><button class="av-action-btn" style="background:var(--teal);color:#fff;border-color:var(--teal);width:100%;" onclick="event.stopPropagation();openAssignVesselModal('`+l.id+"','"+(u.vessel_class||"")+`')">ASSIGN VESSEL</button></div>`:p&&(c+='<div style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:var(--bg-card);border:1px solid var(--border-main);"><div><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">ASSIGNED VESSEL</div><div style="font-size:11px;font-weight:700;color:var(--text-bright);">'+b(p.vessel_name||"Unknown")+'</div></div><div style="display:flex;gap:10px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(p.fuel>50?"#5c5":p.fuel>20?"#ca5":"#c55")+'">'+(p.fuel||0)+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(p.condition>50?"#5c5":p.condition>30?"#ca5":"#c55")+'">'+(p.condition||0)+"%</div></div></div></div>"),c+=`<button class="av-action-btn release" onclick="event.stopPropagation();avRelease('`+l.id+`')">RELEASE ROUTE</button></div>`}c+="</div>"}s.innerHTML=c}function _r(o,e){const t=(_e||[]).filter(function(a){return a.status==="in_port"&&!a.active_claim_id&&a.fuel>=15&&a.condition>=20});let i;t.length===0?i='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No available vessels.<br>Ships must be in port with 15%+ fuel and 20%+ condition.</div>':i=t.map(function(a,r){var s=a.fuel>50?"#5c5":a.fuel>20?"#ca5":"#c55",c=a.condition>50?"#5c5":a.condition>30?"#ca5":"#c55";return`<div style="padding:10px 14px;border-bottom:1px solid var(--border-0);cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="assignVesselToRoute('`+o+"','"+a.id+`')"><div><div style="font-size:14px;font-weight:700;color:var(--text-bright);">`+b(a.vessel_name||"Unnamed")+'</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+b(a.vessel_class||"?")+" · "+(a.capacity_dwt||0).toLocaleString()+' DWT</div></div><div style="display:flex;gap:14px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+s+'">'+a.fuel+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+c+'">'+a.condition+'%</div></div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--teal);padding:4px 12px;border:1px solid var(--teal);cursor:pointer;">ASSIGN</div></div></div>'}).join("");var n=document.createElement("div");n.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;",n.onclick=function(a){a.target===n&&n.remove()},n.innerHTML='<div style="width:560px;max-width:95vw;max-height:80vh;background:var(--bg-panel);border:1px solid var(--border-main);display:flex;flex-direction:column;"><div style="padding:12px 16px;border-bottom:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:space-between;align-items:center;"><span style="font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:var(--teal);">ASSIGN VESSEL</span><span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+t.length+' available</span></div><div style="flex:1;overflow-y:auto;">'+i+`</div><div style="padding:10px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);text-align:right;"><button onclick="this.closest('div[style*=fixed]').remove()" style="padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);background:transparent;border:1px solid var(--border-main);cursor:pointer;">CANCEL</button></div></div>`,document.body.appendChild(n)}async function hr(o,e){try{var{error:t}=await y.from("corp_vessels").update({status:"in_port",active_claim_id:o}).eq("id",e).eq("faction_id",d.id);if(t){alert("Assignment failed: "+t.message);return}var i=document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]');i&&i.remove(),await Promise.all([wo(),ve()])}catch(n){alert("Assignment failed: "+(n.message||"Network error"))}}window.openAssignVesselModal=_r;window.assignVesselToRoute=hr;function Nn(){const o=ie.reduce((s,c)=>s+(c.owned||0),0),e=ie.reduce((s,c)=>s+(c.deployed||0),0),t=_a(ie),i=o-e;document.getElementById("eq-count").textContent=o+" UNITS",document.getElementById("eq-summary").innerHTML=`
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
                ${D(t)}
            </div>
        </div>`;const n={};for(const s of ie)n[s.equipment_key]=s;let a="";for(let s=1;s<=3;s++){const c=qt[s],p=rn(s),f=ln===s,l=p.reduce((m,v)=>m+(n[v.key]?.owned||0),0),u=p.reduce((m,v)=>m+(n[v.key]?.deployed||0),0);if(a+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${s})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${f?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${c.color}">${b(c.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${c.color};border:1px solid ${c.color}33;background:${c.color}0a">${c.tag}</span>
            </div>
            ${l>0?`<span class="eq-tier-hdr__count">${u}/${l}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,f)for(const m of p){const v=n[m.key],g=v?.owned||0,_=v?.deployed||0,$=v?.condition||0,h=m.maintenancePerUnit*g,E=g-_,z=g>0&&E===0,I=g>0&&$<65,w=ii($),C=v?.assigned_projects||[],q=C.length>0?C.map(k=>k.contract_name||"Project").join(", ").slice(0,30):g>0&&_>0?_+" project"+(_>1?"s":""):"—";a+=`<div class="eq-row${g===0?" unowned":""}">`,a+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${g===0?" dim":""}">${b(m.name)}</span>
                        ${I?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${g>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${z?"var(--orange)":"var(--green)"}">${E}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${_}/${g}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,g>0?a+=`<div class="eq-detail">
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
                            <div class="eq-detail__value" style="color:var(--text-muted)">${b(q)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${D(h)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:a+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',a+="</div>"}}document.getElementById("eq-list").innerHTML=a;const r=[1,2,3].map(s=>{const c=qt[s],p=rn(s).reduce((f,l)=>f+(n[l.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${p>0?c.color+"33":"var(--border-0)"};background:${p>0?c.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${c.color}">${c.tag}</div>
            <div class="eq-footer__tier-count" style="color:${p>0?"var(--text-bright)":"var(--text-dim)"}">${p}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${D(t)}</div>
        </div>
        <div class="eq-footer__tiers">${r}</div>`}function $r(o){ln=ln===o?-1:o,Nn()}async function hi(){if(!d)return;const{data:o,error:e}=await y.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",d.id);e?(console.warn("Failed to load equipment:",e.message),ie=[]):ie=o||[],Nn()}async function wr(){const{data:{user:o}}=await y.auth.getUser();if(!o){window.location.href="login.html";return}const{data:e}=await y.from("factions").select("*").or(`id.eq.${o.id},linked_user_id.eq.${o.id}`);he=(e||[]).filter(m=>m.nation_id);const t=sessionStorage.getItem("active_faction_id");if(d=he.find(m=>m.id===t)||he.find(m=>m.faction_type==="corporation")||he[0],!d){await y.auth.signOut(),window.location.href="login.html";return}if(d.faction_type!=="corporation"){window.location.href="dashboard.html";return}const i=new URLSearchParams(window.location.search).get("tab"),n=i==="expansion"||i==="actions";if(d.corp_sector!=="Shipping"&&!n){const v={Finance:"corp-operations-finance.html",Construction:"corp-operations.html"}[d.corp_sector];if(v){window.location.href=v;return}}const[a,r]=await Promise.all([d.nation_id?y.from("nations").select("*").eq("id",d.nation_id).single():Promise.resolve({data:null}),y.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);a.error&&console.warn("Nation load failed:",a.error.message),a.data&&(S=a.data),r.error&&console.warn("Shard load failed:",r.error.message),T=r.data;let s=0;if(d?.id){const{data:m}=await y.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",d.id).in("status",["open","bidding"]);if(m)for(const v of m)s+=(v.contract_bids||[]).length}const c=document.getElementById("corp-topbar-container");if(c){const{renderCorpTopBar:m}=await xa(async()=>{const{renderCorpTopBar:_}=await import("./corp-topbar-BGmUeelO.js");return{renderCorpTopBar:_}},__vite__mapDeps([0,1])),v=new URLSearchParams(window.location.search).get("tab")||"operations",g={};s>0&&(g.home={color:"#c8a832",title:s+" pending bid"+(s!==1?"s":"")+" on your projects"}),m(c,{faction:d,shard:T,activeTab:v,allUserFactions:he,badges:g})}if(T){if(document.getElementById("game-date").textContent=T.current_date||"—",document.getElementById("tick-number").textContent=T.current_tick||"—",T.next_tick_at){const v=(Number(T.tick_interval_hours)||8)*36e5,g=new Date(T.next_tick_at).getTime(),$=g-v+v/2;dn=new Date($>Date.now()?$:g+v/2),Sa()}const m=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");m&&(m.textContent="Next Corp Tick")}const p=document.getElementById("topbar-cash");p&&(p.textContent="CASH: "+gi(Number(d.corp_cash_reserves??0)));const f=document.getElementById("topbar-ap");f&&(f.style.display="none");const l=document.getElementById("nation-pill");l&&(l.textContent=(S?.name||d.nation||"—").toUpperCase());const u=document.getElementById("corp-faction-dropdown");if(u){let m="";for(const v of he){const g=v.id===d.id,_=v.faction_type==="corporation"?"CORP":"PARTY",$=v.faction_type==="corporation"?"var(--teal)":"var(--amber)";m+=`<div class="corp-dd-item${g?" active":""}" onclick="switchToFaction('${v.id}', '${v.faction_type}')">
                <span class="corp-dd-type" style="color:${$}">${_}</span>
                <span class="corp-dd-name">${b(v.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${b(v.abbreviation||"—")}]</span>
            </div>`}u.innerHTML=m}await Promise.all([$o(),wo(),ve(),jn(),oa()]),ba(d,S,T);try{await ua(y,{faction:d,nation:S,shard:T},"auto-services-container")}catch(m){console.error("[CorpOps] Auto-services init failed:",m)}if(document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",i==="expansion"){const m=document.querySelector('[data-tab-action="expansion"]');m&&wi({preventDefault:()=>{},target:m})}else if(i==="actions"){const m=document.querySelector('[data-tab-action="actions"]');m&&Ei({preventDefault:()=>{},target:m})}}async function kr(){await y.auth.signOut(),window.location.href="login.html"}function Er(){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.toggle("open")}function Cr(o,e){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.remove("open"),sessionStorage.setItem("active_faction_id",o),e==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",o=>{const e=document.getElementById("faction-switcher"),t=document.getElementById("corp-faction-dropdown");t&&e&&!e.contains(o.target)&&t.classList.remove("open")});document.addEventListener("keydown",o=>{o.key==="Escape"&&Ht()});window.doLogout=kr;window.toggleTheme=Ta;window.toggleCorpDropdown=Er;window.switchToFaction=Cr;window.setFilter=za;window.arSetFilter=pr;window.arSelectRoute=vr;window.arClaimRoute=gr;window.arApplyToService=yr;window.avToggle=xr;window.avRelease=br;window.openContractDetail=pi;window.closeContractDetail=Ht;window.toggleWhRow=Ya;window.toggleEqTier=$r;window.switchEmNation=or;window.setEmType=nr;window.setEmListing=ir;window.setEmQty=ar;window.purchaseEquipment=rr;window.setPrMat=Ja;window.setPrTier=Xa;window.setPrQty=Za;window.purchaseMaterial=er;let ne={general:0,skilled:0,innovative:0},Ho=!1;const We=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function $i(o){const e=Number(S?.minimum_wage??50),t=Number(S?.inflation??50),i=Number(S?.standard_of_living??50),n=e/100*48e3,a=1+(t-50)/100*.5,r=1+(i-50)/100*.5;return Math.round(n*o*a*r)}function x(o){const e=Math.abs(o),t=o<0?"-":"";return e>=1e9?t+"$"+(e/1e9).toFixed(2)+"B":e>=1e6?t+"$"+(e/1e6).toFixed(2)+"M":e>=1e3?t+"$"+(e/1e3).toFixed(1)+"k":t+"$"+e.toLocaleString()}async function wi(o){o.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("actions-content").style.display="none";const e=document.getElementById("expansion-content");e.style.display="flex",e.style.justifyContent="center",e.style.gap="12px",e.style.alignItems="flex-start",e.style.flexWrap="wrap",document.querySelectorAll(".corp-nav-tab").forEach(t=>t.classList.remove("active")),o.target.classList.add("active"),await Co(),Eo(),es(),await Ln(),To(),await $s(),await cs(),Yt(),Wt(),await Ns(),Qt(),await Io(),No()}function ki(o){o&&o.preventDefault(),document.getElementById("operations-content").style.display="flex",document.getElementById("expansion-content").style.display="none",document.getElementById("actions-content").style.display="none",document.querySelectorAll(".corp-nav-tab").forEach(e=>e.classList.remove("active")),Sr()?.classList.add("active")}async function Ei(o){o.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("expansion-content").style.display="none",document.getElementById("actions-content").style.display="block",document.querySelectorAll(".corp-nav-tab").forEach(e=>e.classList.remove("active")),(o.target||document.querySelector('[data-tab-action="actions"]'))?.classList.add("active"),await Ci(),ht()}function Sr(){return Array.from(document.querySelectorAll(".corp-nav-tab[href]:not([data-tab-action])")).find(o=>{const e=o.getAttribute("href");if(!e)return!1;const t=new URL(e,window.location.href);return t.pathname===window.location.pathname&&!t.searchParams.get("tab")})||null}async function Ci(){if(!d)return;const[o,e]=await Promise.all([y.from("corp_executives").select("*").eq("faction_id",d.id).eq("status","active"),y.from("executive_pool").select("*").eq("nation_id",d.nation_id).eq("status","available").order("skill",{ascending:!1})]);o.error&&console.warn("Failed to load executives:",o.error.message),e.error&&console.warn("Failed to load executive pool:",e.error.message),Lt=o.data||[],Bt=e.data||[];const t=await wa({supabase:y,faction:d,currentTick:T?.current_tick||0,poolCandidates:Bt});t?.error&&console.warn("Failed to seed initial executive roster:",t.error.message||t.error),t?.executives&&(Lt=t.executives)}function st(o){return o>=1e6?"$"+(o/1e6).toFixed(1)+"M":o>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Ie(o){return Lt.find(e=>e.role===o)||null}function fo(o,e){return(o||"?")[0]+(e||"?")[0]}function ut(o){return o>=70?"#5cb85c":o>=50?"#ca5":"#c84"}function ht(){const o=document.getElementById("actions-container");if(!o)return;const e=d?.faction_name||"Corporation",t=(d?.abbreviation||d?.corp_ticker||"??").toUpperCase();let i="";i+=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:0 2px;">
        <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:2px;color:#8b9a6b;text-transform:uppercase;">Actions</span>
            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${b(e)} &middot; ${b(t)}</span>
        </div>
    </div>`,i+='<div style="display:flex;gap:8px;">',i+='<div style="width:262px;display:flex;flex-direction:column;gap:5px;flex-shrink:0;">';for(let n=0;n<no.length;n++){const a=no[n],r=io[a],s=Ie(a),c=pt===n,p=r.color,f=!s;if(i+=`<div onclick="actSelectExec(${n})" style="
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
            </div>`;else{const l=s?`${s.first_name} ${s.last_name}`:"—",u=s?s.age:0,m=s?s.skill:0,v=s?s.salary_per_year:0,g=s?fo(s.first_name,s.last_name):"—";i+=`<div style="display:flex;align-items:center;gap:10px;">
                <div style="width:45px;height:45px;background:${p}15;border:1px solid ${p}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:14px;font-weight:700;color:${p};flex-shrink:0;">${b(g)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:4px;">
                        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${p};">${b(a)}</span>
                    </div>
                    <div style="font-size:13px;font-weight:600;color:${c?"var(--text-bright,#f0efe6)":"var(--text-muted,#666)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(l)}${u?` <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">(${u})</span>`:""}</div>
                    <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:3px;flex:1;">
                            <div style="flex:1;height:3px;background:var(--border-0,rgba(255,255,255,0.06));">
                                <div style="width:${m}%;height:100%;background:${ut(m)};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);width:18px;text-align:right;">${m}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${st(v)}/yr</span>
                    </div>
                </div>
            </div>`}i+="</div>"}i+="</div>",i+=`<div style="flex:1;display:flex;flex-direction:column;gap:0;">
        <div id="actions-right-panel"></div>
    </div>`,i+="</div>",o.innerHTML=i,zr()}const Si={CEO:[{id:"statement",name:"Issue Statement",desc:"Issue a press release to the public events feed. Other players and media corps see it. Cost scales with CEO skill.",cost:"~$20k",costColor:"#5cb85c",tags:["REPUTATION"],cooldown:"once/tick"},{id:"ipo",name:"IPO",desc:"Take the corporation public. Sell ~30% of shares for a massive cash injection. Permanent loss of full control.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["STRUCTURAL"],locked:!0,lockReason:"Coming soon"},{id:"bankruptcy",name:"Declare Bankruptcy",desc:"The CEO officially files for bankruptcy, ceasing all operations. Outstanding loans will be repaid up to 50% of the corporation's market valuation.",descRed:"This will dissolve your corporation. Loans will be paid back, and you will need to found a new corporation. There is a 24 tick cooldown on declaring bankruptcy.",cost:"IRREVERSIBLE",costColor:"#c55",tags:["IRREVERSIBLE"]}],CFO:[{id:"loan",name:"Request Loan",desc:"Submit a loan application to all finance corporations. Set amount, purpose, term, and collateral. Receive competing offers.",cost:"FREE",costColor:"#5cb85c",tags:["FINANCIAL"]}],COO:[{id:"restructure",name:"Restructure Operations",desc:"Lay off 10-20% of workforce, cut ~7% of debt. Reputation hit scales with COO skill — high skill minimizes damage.",cost:"FREE",costColor:"#5cb85c",tags:["OPERATIONAL"],cooldown:"once/tick"}],CTO:[{id:"research",name:"Begin Research",desc:"Start researching a tech tree node. Opens the tech tree interface.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["INNOVATION"],locked:!0,lockReason:"Coming soon"}],CMO:[{id:"rebrand",name:"Rebrand Corporation",desc:"Change name and abbreviation. Cost and reputation hit scale with CMO skill — high skill reduces both.",cost:"~$20M",costColor:"#ca5",tags:["STRUCTURAL"],cooldown:"once/tick"}],CLO:[{id:"sue_corp",name:"Sue Corporation",desc:"File a lawsuit against another corporation for patent infringement, contract breach, or predatory practices.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["LEGAL"],locked:!0,lockReason:"Coming soon"}],Lobbyist:[{id:"donate",name:"Political Donation",desc:"Donate $1M to a political party in the nation where your National HQ is located. The target party receives $100k in party funds. You cannot donate to your own party.",cost:"$1M",costColor:"#ca5",tags:["POLITICAL"],cooldown:"once/tick"}]};function Gt(o){return 1.5-o/100}let Ti={};function Tr(o){const e=T?.current_tick||0;return Ti[o]===e}function vt(o){const e=T?.current_tick||0;Ti[o]=e}function zr(){const o=document.getElementById("actions-right-panel");if(!o)return;const e=no[pt],t=io[e],i=Ie(e),n=Si[e]||[];if(!i){o.innerHTML=`<div style="padding:48px;text-align:center;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));">
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
                        <div style="width:${i.skill}%;height:100%;background:${ut(i.skill)};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${ut(i.skill)};">${i.skill}</span>
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
    </div>`,a+='<div style="background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:1px solid var(--border-0,rgba(255,255,255,0.06));flex:1;">';for(let r=0;r<n.length;r++){const s=n[r],c=!!s.locked;a+=`<div onmouseenter="this.dataset.hover='1';this.style.background='${c?"transparent":t.color+"06"}'" onmouseleave="this.dataset.hover='';this.style.background='transparent';var eb=this.querySelector('.act-exec-btn');if(eb)eb.style.display='none'" style="
            padding:16px 20px;
            ${r<n.length-1?"border-bottom:1px solid var(--border-0,rgba(255,255,255,0.06));":""}
            opacity:${c?"0.4":"1"};
            cursor:${c?"not-allowed":"pointer"};
        ">`,a+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;font-weight:700;color:${c?"var(--text-dim)":"var(--text-bright,#f0efe6)"};">${b(s.name)}</span>`;for(const p of s.tags)a+=`<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.3px;padding:2px 6px;line-height:14px;color:${p==="IRREVERSIBLE"?"#c55":p==="OFFENSIVE"?"#c84":p==="STRUCTURAL"?"#ca5":p==="POLITICAL"?"#8a6aaa":"var(--text-dim)"};background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));">${b(p)}</span>`;a+=`</div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${s.costColor};">${b(s.cost)}</span>
            </div>
        </div>`,a+=`<div style="font-size:14px;color:${c?"var(--text-dim)":"var(--text-muted,#666)"};line-height:1.6;">${b(s.desc)}</div>`,s.descRed&&(a+=`<div style="font-size:13px;color:#c55;line-height:1.6;margin-top:4px;">${b(s.descRed)}</div>`),c&&s.lockReason&&(a+=`<div style="margin-top:6px;font-family:var(--font-mono);font-size:11px;color:#c84;display:flex;align-items:center;gap:4px;">
                <span>&#8856;</span><span>${b(s.lockReason)}</span>
            </div>`),c||(a+=`<div class="act-exec-btn" style="display:none;margin-top:10px;text-align:right;">
                <span onclick="event.stopPropagation();actExecute('${s.id}','${e}')" style="display:inline-block;padding:6px 24px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${t.color};cursor:pointer;">EXECUTE</span>
            </div>`),a+="</div>"}a+="</div>",a+=`<div style="padding:8px 20px;background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:none;">
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">
            <span style="color:${t.color};font-weight:700;">${b(e)}</span> skill (${i.skill}/100) affects action outcomes.
            ${i.skill>=70?" High skill increases success probability and reduces costs.":i.skill>=50?" Moderate skill — outcomes are average. Consider recruiting a stronger executive.":" Low skill — actions are less effective and more expensive. Replacement recommended."}
        </div>
    </div>`,o.innerHTML=a,o.querySelectorAll("[onmouseenter]").forEach(r=>{r.addEventListener("mouseenter",function(){const s=this.querySelector(".act-exec-btn");s&&(s.style.display="block")}),r.addEventListener("mouseleave",function(){const s=this.querySelector(".act-exec-btn");s&&(s.style.display="none")})})}function Ir(o,e,t,i,n){const a=T?.current_tick||0,r=Math.max(0,n-a),s=Math.round(i*(r/12)),c=`FIRE ${e}: ${t}

Contract remaining: ${r} ticks
Payout (prorated): $${(s/1e6).toFixed(2)}M

This amount will be deducted from your cash reserves immediately.

Are you sure?`;confirm(c)&&Nr(o,e,s)}async function Nr(o,e,t){try{const i=Number(d?.corp_cash_reserves??0);if(i<t){alert(`Insufficient funds. You need $${(t/1e6).toFixed(2)}M but only have $${(i/1e6).toFixed(2)}M.`);return}const n=i-t,{error:a}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",d.id);if(a){alert("Failed to process payout: "+a.message);return}const{error:r}=await y.from("corp_executives").update({status:"fired",updated_at:new Date().toISOString()}).eq("id",o);if(r){await y.from("factions").update({corp_cash_reserves:i}).eq("id",d.id),alert("Failed to fire executive: "+r.message);return}d.corp_cash_reserves=n,Lt=Lt.filter(s=>s.id!==o),ht()}catch(i){console.error("[CorpOps] Fire executive error:",i),alert("An error occurred.")}}function Ar(o,e){if((Si[e]||[]).find(i=>i.id===o)?.cooldown==="once/tick"&&Tr(o)){alert("This action can only be used once per tick. Wait for the next tick.");return}switch(o){case"statement":return zi();case"loan":return Ai();case"restructure":return Ri();case"rebrand":return qi();case"donate":return Li();case"bankruptcy":return Ii()}}let un=!1;function zi(){if(un)return;un=!0;const o=document.createElement("div");o.id="stmt-overlay",o.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",o.onclick=function(c){c.target===o&&An()};const e=d?.faction_name||"Corporation",t=(d?.abbreviation||d?.corp_ticker||"??").toUpperCase(),i=Number(d?.corp_cash_reserves??0),n=Ie("CEO"),a=n?`${n.first_name} ${n.last_name}`:"CEO";o.innerHTML=`<div onclick="event.stopPropagation()" style="width:480px;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">
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
    </div>`,document.body.appendChild(o);const r=document.getElementById("stmt-text"),s=document.getElementById("stmt-chars");r&&s&&(r.addEventListener("input",function(){s.textContent=this.value.length+"/500"}),r.focus())}function An(){const o=document.getElementById("stmt-overlay");o&&o.remove(),un=!1}let kt=!1;async function Mr(){if(!d||!T||kt)return;const o=document.getElementById("stmt-text"),e=document.getElementById("stmt-error"),t=(o?.value||"").trim();if(!t){e&&(e.textContent="Statement cannot be empty.",e.style.display="block");return}if(t.length>500){e&&(e.textContent="Statement too long (max 500 chars).",e.style.display="block");return}const i=Ie("CEO"),n=i?i.skill:50,a=Math.round(2e4*Gt(n)),r=Number(d.corp_cash_reserves??0);if(r<a){e&&(e.textContent="Insufficient cash. Need "+x(a)+".",e.style.display="block");return}kt=!0;const s=document.getElementById("stmt-submit-btn");s&&(s.style.opacity="0.4",s.style.pointerEvents="none");const c=d.faction_name||"Corporation",p=i?`${i.first_name} ${i.last_name}`:"CEO",f=T.current_tick||0,{error:l}=await y.from("factions").update({corp_cash_reserves:r-a}).eq("id",d.id);if(l){kt=!1,e&&(e.textContent="Failed to deduct cost: "+l.message,e.style.display="block"),s&&(s.style.opacity="1",s.style.pointerEvents="auto");return}const{error:u}=await y.from("event_log").insert({nation_id:d.nation_id,faction_id:d.id,event_name:c+" — Press Release",description_used:p+", CEO of "+c+': "'+t.replace(/[<>"]/g,"")+'"',category:"business",trigger_key:"ceo_statement",effects_applied:{cost:a,ceo:p,skill:n},fired_at_tick:f});if(u){await y.from("factions").update({corp_cash_reserves:r}).eq("id",d.id),kt=!1,e&&(e.textContent="Failed to publish: "+u.message,e.style.display="block"),s&&(s.style.opacity="1",s.style.pointerEvents="auto");return}d.corp_cash_reserves=r-a,kt=!1,vt("statement"),An()}const ti=24,Rr=.5;async function qr(o,e){const t=e-ti,{data:i}=await y.from("event_log").select("fired_at_tick, effects_applied").eq("trigger_key","corp_bankruptcy").gte("fired_at_tick",t).order("fired_at_tick",{ascending:!1}).limit(20),n=(i||[]).find(r=>r.effects_applied?.user_id===o),a=n?Math.max(0,n.fired_at_tick+ti-e):0;return{onCooldown:a>0,ticksLeft:a}}let Go=!1;async function Ii(){if(Go)return;const{data:{user:o}}=await y.auth.getUser();if(!o){alert("Not logged in.");return}const e=d?.id||sessionStorage.getItem("active_faction_id");if(!e){alert("No active faction selected.");return}const{data:t,error:i}=await y.from("factions").select("*").eq("id",e).eq("faction_type","corporation").is("abandoned_at",null).single();if(i||!t){alert("No active corporation found. It may have already been dissolved.");return}const n=t,a=n.faction_name||"this corporation",{data:r,error:s}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single();if(s||!r){alert("Failed to read game tick. Please try again.");return}const c=r.current_tick||0,{onCooldown:p,ticksLeft:f}=await qr(o.id,c);if(p){alert("Bankruptcy is on cooldown. You must wait "+f+" more tick"+(f!==1?"s":"")+" before declaring bankruptcy again.");return}if(!confirm("DECLARE BANKRUPTCY — "+a.toUpperCase()+`?

This will permanently:
• Dissolve the corporation
• Delete all properties, equipment, and inventory
• Pay back outstanding loans (up to 50% of market valuation)
• Remove all remaining cash reserves

You will need to found a new corporation.
There is a 24 tick cooldown on declaring bankruptcy.

This action CANNOT be undone.`))return;if(prompt('Type "BANKRUPT" to confirm bankruptcy of '+a+":")!=="BANKRUPT"){alert("Bankruptcy cancelled.");return}Go=!0;try{async function u(B){const{error:F}=await B;if(F)throw F}const m=Number(n.corp_cash_reserves)||0,{data:v}=await y.from("corp_properties").select("purchase_price, condition").eq("faction_id",e);let g=0;for(const B of v||[])g+=Math.round(Number(B.purchase_price||0)*(Number(B.condition||0)/100));const _=m+g,$=Number(n.corp_loans)||0,h=_-$,E=Math.round(h*1.3),z=Math.max(0,Math.round(E*Rr)),{data:I}=await y.from("finance_active_loans").select("*").eq("borrower_faction_id",e).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!0});let w=0;for(const B of I||[]){const F=B.principal-B.total_paid;if(F<=0)continue;const j=Math.min(F,z-w);if(j<=0)break;const{data:X}=await y.from("factions").select("corp_cash_reserves").eq("id",B.lender_faction_id).single();X&&await u(y.from("factions").update({corp_cash_reserves:(Number(X.corp_cash_reserves)||0)+j}).eq("id",B.lender_faction_id)),await u(y.from("finance_active_loans").update({status:"repaid",total_paid:B.total_paid+j,completed_tick:c}).eq("id",B.id)),w+=j}await u(y.from("contract_bids").delete().eq("faction_id",e)),await u(y.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",e).in("status",["open","bidding"])),await u(y.from("corp_equipment_deliveries").delete().eq("faction_id",e)),await u(y.from("corp_equipment").delete().eq("faction_id",e)),await u(y.from("corp_properties").delete().eq("faction_id",e)),await y.from("corp_material_inventory").delete().eq("faction_id",e),await y.from("corp_warehouse").delete().eq("faction_id",e),await y.from("corp_executives").delete().eq("faction_id",e),await y.from("faction_agitators").delete().eq("faction_id",e),await u(y.from("factions").delete().eq("id",e));const C=w>0?" $"+w.toLocaleString()+" was repaid to creditors.":"";await u(y.from("event_log").insert({nation_id:n.nation_id,faction_id:e,event_name:a+" — Bankruptcy",description_used:a+" has officially filed for bankruptcy. It has laid off its executive staff and ceased operations."+C,category:"business",trigger_key:"corp_bankruptcy",effects_applied:{corp_name:a,sector:n.corp_sector,user_id:o.id,loan_payback:w,valuation:E},fired_at_tick:c})),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:q}=await y.from("factions").select("id, faction_type").or(`id.eq.${o.id},linked_user_id.eq.${o.id}`),k=(q||[]).find(B=>B.faction_type==="party"),R=(q||[]).find(B=>B.faction_type==="corporation"),A=w>0?`
$`+w.toLocaleString()+" repaid to creditors.":"";k?(sessionStorage.setItem("active_faction_id",k.id),alert(a+" has declared bankruptcy."+A+`

Redirecting to your political party.`),window.location.href="dashboard.html"):R?(sessionStorage.setItem("active_faction_id",R.id),alert(a+" has declared bankruptcy."+A+`

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(a+" has declared bankruptcy."+A+`

You have no remaining factions.`),window.location.href="faction-select.html")}catch(u){alert("Bankruptcy failed: "+(u.message||u)+`

Please try again or contact support.`)}finally{Go=!1}}const Ni=[{id:"equipment",label:"Equipment Acquisition",desc:"Purchase vehicles, cranes, or heavy machinery",icon:"&#9881;"},{id:"working",label:"Working Capital",desc:"Bridge financing for active project costs",icon:"$"},{id:"property",label:"Property Purchase",desc:"Acquire office, warehouse, or HQ building",icon:"&#9632;"},{id:"subsidiary",label:"Subsidiary Expansion",desc:"Fund new subsidiary establishment",icon:"&#9672;"},{id:"materials",label:"Material Procurement",desc:"Bulk material purchase for upcoming projects",icon:"&#9638;"}],Vo=[{id:"none",label:"None",desc:"Unsecured — lenders may charge higher rates",risk:"HIGH",riskColor:"#c84"},{id:"equipment",label:"Equipment",desc:"Financed equipment serves as collateral",risk:"MODERATE",riskColor:"#ca5"},{id:"property",label:"Property",desc:"Corporate property lien",risk:"LOW",riskColor:"#8b9a6b"},{id:"full",label:"Full Assets",desc:"All corporate assets — maximum lender security",risk:"MINIMAL",riskColor:"#5c5"}];let te=25e7,Pt="equipment",yt=48,ce="equipment",mo="",Ct=[];function Ai(){te=25e7,Pt="equipment",yt=48,ce="equipment",mo="",document.getElementById("lr-overlay").style.display="flex",Dr(),$t()}function Mi(){document.getElementById("lr-overlay").style.display="none"}function Lr(o){te=Math.max(1e6,Math.min(5e9,Number(o)||0)),$t()}function Br(o){Pt=o,$t()}function Or(o){yt=o,$t()}function Pr(o){ce=o,$t()}async function Dr(){if(!d)return;const{data:o}=await y.from("factions").select("id, faction_name, abbreviation, corp_ticker, corp_company_type").eq("faction_type","corporation").eq("corp_sector","Finance").is("abandoned_at",null).neq("id",d.id);Ct=o||[],$t()}function $t(){const o=document.getElementById("lr-modal-content");if(!o)return;const e=Number(d?.corp_cash_reserves??0),t=Number(d?.corp_loans??0),i=Number(d?.corp_reputation??50),n=d?.faction_name||"Corporation",a=(d?.abbreviation||d?.corp_ticker||"??").toUpperCase(),r=t+te,s=r>e*3?"#c55":r>e*1.5?"#c84":r>e?"#ca5":"#5c5",c=r>e*3?"DANGEROUS":r>e*1.5?"HEAVY":r>e?"MODERATE":"HEALTHY",p=ce==="none"?"10-16%":ce==="equipment"?"7-12%":ce==="property"?"5-9%":"4-7%",l=Math.round(te*(ce==="none"?.13:ce==="equipment"?.095:ce==="property"?.07:.055)/12+te/yt),u=Vo.find(v=>v.id===ce)||Vo[0];let m="";m+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
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
            <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#5a8aaa;">${x(te)}</span>
        </div>
        <input type="range" min="1000000" max="5000000000" step="10000000" value="${te}" oninput="lrSetAmount(this.value)" style="width:100%;height:4px;accent-color:#5a8aaa;" />
        <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;"><span>$1M</span><span>$5B</span></div>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">PURPOSE</div>
        <div style="display:flex;flex-direction:column;gap:3px;">`;for(const v of Ni){const g=Pt===v.id;m+=`<div onclick="lrSetPurpose('${v.id}')" style="display:flex;align-items:center;gap:8px;padding:5px 10px;cursor:pointer;background:${g?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${g?"#5a8aaa44":"#2a2a24"};border-left:2px solid ${g?"#5a8aaa":"transparent"};">
            <span style="font-family:var(--font-mono);font-size:10px;color:${g?"#5a8aaa":"#6a6660"};width:14px;text-align:center;">${v.icon}</span>
            <div><div style="font-size:11px;font-weight:600;color:${g?"#e8e4dc":"#9e9a92"};">${v.label}</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${v.desc}</div></div>
        </div>`}m+="</div></div>",m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">PREFERRED TERM</span>
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;">${yt} months</span>
        </div>
        <div style="display:flex;gap:3px;">`;for(const v of[12,24,36,48,60,84,120]){const g=yt===v;m+=`<span onclick="lrSetTerm(${v})" style="flex:1;text-align:center;padding:4px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;color:${g?"#000":"#6a6660"};background:${g?"#5a8aaa":"transparent"};border:1px solid ${g?"#5a8aaa":"#2a2a24"};">${v}</span>`}m+='</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Lenders may offer different terms. This is your preference, not a guarantee.</div></div>',m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">COLLATERAL OFFERED</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">`;for(const v of Vo){const g=ce===v.id;m+=`<div onclick="lrSetCollateral('${v.id}')" style="padding:6px 8px;cursor:pointer;background:${g?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${g?"#5a8aaa44":"#2a2a24"};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${g?"#5a8aaa":"#6a6660"};">${v.label}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:${v.riskColor};">${v.risk} RISK</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${v.desc}</div>
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
                <span style="font-family:var(--font-mono);font-size:9px;color:#5a8aaa;">+${x(te)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#e8e4dc;">NEW TOTAL DEBT</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${x(r)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEBT HEALTH</span>
                <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${s};background:${s}12;border:1px solid ${s}25;">${c}</span>
            </div>
        </div>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">This request will be sent to</div>`,Ct.length>0){m+='<div style="display:flex;flex-direction:column;gap:3px;">';for(const v of Ct){const g=(v.corp_company_type||"").toLowerCase()==="state"?"#c84":(v.corp_company_type||"").toLowerCase()==="public"?"#5c5":"#c8a832";m+=`<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:#1c1c18;border:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c8a832;">${b((v.abbreviation||v.corp_ticker||"??").toUpperCase())}</span>
                <span style="font-size:10px;color:#e8e4dc;flex:1;">${b(v.faction_name)}</span>
                ${v.corp_company_type?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${g};background:${g}12;border:1px solid ${g}25;">${b(v.corp_company_type.toUpperCase())}</span>`:""}
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
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">REQUESTING</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5a8aaa;">${x(te)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">COLLATERAL</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;">${u.label}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">SENT TO</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#9e9a92;">${Ct.length} lender${Ct.length!==1?"s":""}</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="lrClose()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="lr-submit-btn" onclick="lrSubmit()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">SUBMIT REQUEST</div>
        </div>
    </div>`,m+='<div id="lr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>',o.innerHTML=m}let Xt=!1;async function jr(){if(!d||!T||Xt)return;const o=document.getElementById("lr-error");if(te<1e6){o.textContent="Minimum loan amount is $1M.",o.style.display="block";return}if(te>5e9){o.textContent="Maximum loan amount is $5B.",o.style.display="block";return}const t=((Ni.find(r=>r.id===Pt)||{}).label||Pt)+(mo?" — "+mo:""),i=document.getElementById("lr-submit-btn");Xt=!0,i.style.opacity="0.5",i.style.pointerEvents="none";const n=T.current_tick||0,{error:a}=await y.from("finance_loan_requests").insert({requesting_faction_id:d.id,nation_id:d.nation_id,amount:te,term_months:yt,purpose:t,created_tick:n,expires_tick:n+5});if(i.style.opacity="1",i.style.pointerEvents="auto",a){Xt=!1,o.textContent="Failed to submit: "+a.message,o.style.display="block",i.style.opacity="1",i.style.pointerEvents="auto";return}Xt=!1,Mi()}function Ri(){if(!d)return;const o=Number(d.corp_loans??0),e=Number(d.corp_reputation??50),t=Number(d.corp_general_workforce??0),i=Number(d.corp_skilled_workforce??0),n=Number(d.corp_innovative_workforce??0),a=t+i+n;if(a===0){alert("Cannot restructure — no employees to lay off.");return}const r=Ie("COO"),s=r?r.skill:50,c=Gt(s),p=10+Math.floor(Math.random()*11),f=Math.round(a*p/100),l=Math.round(o*.07),u=Math.round(l*(2-c)),m=3+Math.floor(Math.random()*10),v=Math.max(1,Math.round(m*c)),g=Math.round(t/a*f),_=Math.round(i/a*f),$=Math.max(0,Math.min(n,f-g-_)),h=document.createElement("div");h.id="restr-overlay",h.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",h.onclick=function(E){E.target===h&&Mn()},h.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">
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
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">-${x(u)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">REPUTATION HIT</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${v} (${e} &rarr; ${Math.max(0,e-v)})</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#c84;margin-top:6px;">&#9888; This action cannot be undone. Laid-off workers must be re-hired.</div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid #2a2a24;display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseRestructure()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="restr-btn" onclick="actSubmitRestructure(${p},${u},${v},${g},${_},${$})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#8b9a6b;cursor:pointer;">RESTRUCTURE</div>
        </div>
        <div id="restr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(h)}function Mn(){const o=document.getElementById("restr-overlay");o&&o.remove()}let Zt=!1;async function Fr(o,e,t,i,n,a){if(!d||!T||Zt)return;Zt=!0;const r=document.getElementById("restr-btn");r&&(r.style.opacity="0.4",r.style.pointerEvents="none");const s=Number(d.corp_general_workforce??0),c=Number(d.corp_skilled_workforce??0),p=Number(d.corp_innovative_workforce??0),f=Number(d.corp_loans??0),l=Number(d.corp_reputation??50),u={corp_general_workforce:Math.max(0,s-i),corp_skilled_workforce:Math.max(0,c-n),corp_innovative_workforce:Math.max(0,p-a),corp_loans:Math.max(0,f-e),corp_reputation:Math.max(0,l-t)},{error:m}=await y.from("factions").update(u).eq("id",d.id);if(m){Zt=!1;const _=document.getElementById("restr-error");_&&(_.textContent="Failed: "+m.message,_.style.display="block"),r&&(r.style.opacity="1",r.style.pointerEvents="auto");return}Object.assign(d,u);const v=T.current_tick||0,{error:g}=await y.from("event_log").insert({nation_id:d.nation_id,faction_id:d.id,event_name:(d.faction_name||"Corporation")+" — Restructuring",description_used:(d.faction_name||"A corporation")+" has announced a restructuring, laying off "+o+"% of its workforce.",category:"business",trigger_key:"corp_restructure",effects_applied:{layoff_pct:o,debt_cut:e,rep_loss:t},fired_at_tick:v});g&&console.warn("Failed to log restructure event:",g.message),Zt=!1,vt("restructure"),Mn(),ht()}function qi(){const o=Ie("CMO"),e=o?o.skill:50,t=Gt(e),i=Math.round(2e7*t),n=Math.max(1,Math.round(5*t)),a=Number(d?.corp_cash_reserves??0),r=Number(d?.corp_reputation??50),s=d?.faction_name||"",c=d?.abbreviation||d?.corp_ticker||"",p=document.createElement("div");p.id="rebrand-overlay",p.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",p.onclick=function(f){f.target===p&&Rn()},p.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">
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
            <input id="rebrand-name" type="text" maxlength="40" value="${b(s)}" placeholder="Corporation name"
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
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${n} (${r} &rarr; ${Math.max(0,r-n)})</span>
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
    </div>`,document.body.appendChild(p)}function Rn(){const o=document.getElementById("rebrand-overlay");o&&o.remove()}let eo=!1;async function Ur(o,e){if(!d||!T||eo)return;const t=o||2e7,i=e||5,n=document.getElementById("rebrand-error"),a=(document.getElementById("rebrand-name")?.value||"").trim().replace(/[<>"]/g,""),r=(document.getElementById("rebrand-abbr")?.value||"").trim().toUpperCase().replace(/[<>"]/g,"");if(!a||a.length<2){n&&(n.textContent="Name must be at least 2 characters.",n.style.display="block");return}if(!r||r.length<2||r.length>5){n&&(n.textContent="Abbreviation must be 2-5 characters.",n.style.display="block");return}const s=Number(d.corp_cash_reserves??0);if(s<t){n&&(n.textContent="Insufficient cash. Need "+x(t)+".",n.style.display="block");return}eo=!0;const c=document.getElementById("rebrand-btn");c&&(c.style.opacity="0.4",c.style.pointerEvents="none");const p=Number(d.corp_reputation??50),f=d.faction_name||"Corporation",{error:l}=await y.from("factions").update({faction_name:a,abbreviation:r,corp_ticker:r,corp_cash_reserves:s-t,corp_reputation:Math.max(0,p-i)}).eq("id",d.id);if(l){eo=!1,n&&(n.textContent="Failed: "+l.message,n.style.display="block"),c&&(c.style.opacity="1",c.style.pointerEvents="auto");return}d.faction_name=a,d.abbreviation=r,d.corp_ticker=r,d.corp_cash_reserves=s-t,d.corp_reputation=Math.max(0,p-i);const u=T.current_tick||0,{error:m}=await y.from("event_log").insert({nation_id:d.nation_id,faction_id:d.id,event_name:"Corporation Rebranded",description_used:f+" has rebranded to "+a+" ("+r+"). The rebrand costs $20M and reputation takes a temporary hit.",category:"corporate",trigger_key:"corp_rebrand",effects_applied:{old_name:f,new_name:a,new_abbr:r,rep_loss:i,cost:t},fired_at_tick:u});m&&console.warn("Failed to log rebrand event:",m.message),eo=!1,vt("rebrand"),Rn(),ht(),document.getElementById("corp-name-bar").textContent=a;const v=document.getElementById("corp-logo");v&&(v.textContent=r.slice(0,2))}const Hr={liberty:"#9C27B0",equality:"#E91E63",freedom:"#5b9bd5",security:"#d48a3c",individualism:"#eab308",collectivism:"#ec4899",tradition:"#795548",progress:"#00BCD4",nationalism:"#FF5722",globalism:"#3F51B5"};function ot(o){return Hr[(o||"").toLowerCase()]||"#9C27B0"}let je=[],Ce=-1;async function Li(){Number(d?.corp_cash_reserves??0);const o=[d.nation_id],e=new Set(he.map(n=>n.id)),{data:t}=await y.from("factions").select("id, faction_name, abbreviation, party_color, party_funds, seats, momentum, nation, nation_id, leader_ideology, linked_user_id, ideology_value_1, ideology_value_2").eq("faction_type","party").in("nation_id",o).is("abandoned_at",null).order("seats",{ascending:!1});je=(t||[]).filter(n=>!e.has(n.id)).map(n=>({...n})),Ce=-1;const i=document.createElement("div");i.id="donate-overlay",i.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",i.onclick=function(n){n.target===i&&qn()},document.body.appendChild(i),Bi()}function qn(){const o=document.getElementById("donate-overlay");o&&o.remove(),je=[],Ce=-1}function Gr(o){Ce=o,Bi()}function Bi(){const o=document.getElementById("donate-overlay");if(!o)return;const e=Ie("Lobbyist"),t=e?e.skill:50,i=Math.round(1e6*Gt(t)),n=1e5,a=Number(d?.corp_cash_reserves??0),r=Ce>=0?je[Ce]:null,s=a>=i;let c='<div onclick="event.stopPropagation()" style="width:540px;max-height:80vh;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">';c+=`<div style="padding:14px 20px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
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
        <div style="font-family:var(--font-mono);font-size:10px;color:#6a6660;margin-top:4px;">Parties in the nation where your National HQ is located. You cannot donate to your own party.</div>
    </div>`,c+='<div style="flex:1;overflow-y:auto;padding:10px 0;">',c+='<div style="padding:0 20px 8px;font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Select a Party</div>',je.length===0&&(c+='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#6a6660;">No eligible parties found.</div>');for(let p=0;p<je.length;p++){const f=je[p],l=Ce===p,u=f.party_color||"#8a6aaa",m=(f.momentum||0)>0?"#e8e4dc":"#c55";c+=`<div onclick="donateSelectParty(${p})" style="
            padding:10px 20px;
            border-bottom:1px solid #2a2a24;
            border-left:3px solid ${l?u:"transparent"};
            background:${l?u+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:10px;height:10px;background:${u};flex-shrink:0;"></div>
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
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${s?"#e8e4dc":"#c55"};">${x(a)}</div></div>
            ${r?`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">RECIPIENT</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#e8e4dc;">${b(r.abbreviation||r.faction_name)}</div></div>`:""}
        </div>
        <div style="display:flex;gap:8px;">
            <div onclick="actCloseDonation()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="donate-btn" onclick="actSubmitDonation()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${r&&s?"#000":"#6a6660"};background:${r&&s?"#8a6aaa":"#2a2a24"};cursor:${r&&s?"pointer":"not-allowed"};${!r||!s?"opacity:0.4;pointer-events:none;":""}">DONATE</div>
        </div>
    </div>`,c+='<div id="donate-error" style="padding:6px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',c+="</div>",o.innerHTML=c}let nt=!1;async function Vr(){if(!d||!T||Ce<0||nt)return;const o=je[Ce];if(!o)return;const e=Number(T?.current_tick||0);if(new Set(he.map(w=>w.id)).has(o.id)){const w=document.getElementById("donate-error");w&&(w.textContent="You cannot donate to your own party.",w.style.display="block");return}const i=Ie("Lobbyist"),n=i?i.skill:50,a=Math.round(1e6*Gt(n)),r=1e5,s=2,{data:c,error:p}=await y.from("factions").select("corp_cash_reserves, last_donation_tick").eq("id",d.id).single();if(p||!c){const w=document.getElementById("donate-error");w&&(w.textContent="Failed to verify cooldown: "+(p?.message||"unknown"),w.style.display="block");return}const f=Number(c.last_donation_tick??0);if(f===e){const w=document.getElementById("donate-error");w&&(w.textContent="Political Donation is on cooldown until next tick.",w.style.display="block"),vt("donate");return}const l=Number(c.corp_cash_reserves??0);if(l<a){const w=document.getElementById("donate-error");w&&(w.textContent="Insufficient cash. Need "+x(a)+", have "+x(l)+".",w.style.display="block");return}nt=!0;const u=document.getElementById("donate-btn");u&&(u.style.opacity="0.4",u.style.pointerEvents="none");const m=Number(d.corp_reputation??50),v=Math.max(0,m-s),{data:g,error:_}=await y.from("factions").update({corp_cash_reserves:l-a,corp_reputation:v,last_donation_tick:e}).eq("id",d.id).eq("last_donation_tick",f).select("id");if(_){const w=document.getElementById("donate-error");nt=!1,w&&(w.textContent="Failed: "+_.message,w.style.display="block"),u&&(u.style.opacity="1",u.style.pointerEvents="auto");return}if(!g||g.length===0){const w=document.getElementById("donate-error");nt=!1,w&&(w.textContent="Political Donation is on cooldown until next tick.",w.style.display="block"),u&&(u.style.opacity="1",u.style.pointerEvents="auto"),vt("donate");return}const{data:$}=await y.from("factions").select("party_funds").eq("id",o.id).single(),h=Number($?.party_funds??0),{error:E}=await y.from("factions").update({party_funds:h+r}).eq("id",o.id);if(E){await y.from("factions").update({corp_cash_reserves:l}).eq("id",d.id);const w=document.getElementById("donate-error");nt=!1,w&&(w.textContent="Failed to transfer funds: "+E.message,w.style.display="block"),u&&(u.style.opacity="1",u.style.pointerEvents="auto");return}d.corp_cash_reserves=l-a,d.corp_reputation=v;const z=d.faction_name||"Corporation",{error:I}=await y.from("event_log").insert({nation_id:o.nation_id||d.nation_id,faction_id:d.id,event_name:z+" — Political Donation",description_chosen:z+" has donated "+x(a)+" to "+(o.faction_name||"a political party")+". The party receives "+x(r)+" in campaign funds. Corporate reputation decreases by "+s+".",category:"business",trigger_key:"corp_donation",effects_applied:{cost:a,recipient_faction_id:o.id,recipient_name:o.faction_name,funds_granted:r,reputation_loss:s,skill:n},fired_at_tick:e});I&&console.warn("Failed to log donation event:",I.message),nt=!1,vt("donate"),qn()}function Wr(o){pt=o,ht()}async function Yr(o){if($e=o,ke=-1,document.getElementById("exec-search-overlay").style.display="flex",Bt.length===0&&d?.nation_id){const{data:e}=await y.from("executive_pool").select("id").eq("nation_id",d.nation_id).limit(1);if(!e||e.length===0){const i=d.nation||"",n=ka(d.nation_id,i),{error:a}=await y.from("executive_pool").insert(n);a&&console.warn("Failed to generate executive pool:",a.message)}const{data:t}=await y.from("executive_pool").select("*").eq("nation_id",d.nation_id).eq("status","available").order("skill",{ascending:!1});Bt=t||[]}Di()}function Oi(){document.getElementById("exec-search-overlay").style.display="none",$e=null,ke=-1}function Pi(o){return Bt.filter(e=>e.status==="available"&&Array.isArray(e.specializations)&&e.specializations.includes(o)).sort((e,t)=>t.skill-e.skill)}function Qr(o){ke=o,Di()}let to=!1;async function Kr(){if(!d||!T||!$e||ke<0||to)return;const e=Pi($e)[ke];if(!e)return;to=!0;const t=T.current_tick||0,i=document.getElementById("es-hire-btn");i&&(i.style.opacity="0.4",i.style.pointerEvents="none");const{error:n}=await y.from("corp_executives").insert({faction_id:d.id,role:$e,first_name:e.first_name,last_name:e.last_name,age:e.age,origin_nation:e.origin_nation,skill:e.skill,salary_per_year:e.required_salary,contract_years:e.required_years,contract_start_tick:t,contract_end_tick:t+e.required_years*12,status:"active"});if(n){to=!1;const r=document.getElementById("es-error");r&&(r.textContent="Failed: "+n.message,r.style.display="block"),i&&(i.style.opacity="1",i.style.pointerEvents="auto");return}const{error:a}=await y.from("executive_pool").update({status:"hired",hired_by_faction_id:d.id}).eq("id",e.id);a&&console.warn("Failed to mark pool candidate as hired:",a.message),to=!1,Oi(),await Ci(),pt=no.indexOf($e),pt<0&&(pt=0),ht()}function Di(){const o=document.getElementById("exec-search-content");if(!o||!$e)return;const e=$e,t=io[e],i=Pi(e),n=ke>=0?i[ke]:null;let a="";a+=`<div style="padding:12px 20px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
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
        </div>`);for(let r=0;r<i.length;r++){const s=i[r],c=ke===r,p=ut(s.skill);a+=`<div onclick="esSelectCandidate(${r})" style="
            padding:10px 14px;
            border-bottom:1px solid #2a2a24;
            border-left:3px solid ${c?t.color:"transparent"};
            background:${c?t.color+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:${t.color}10;border:1px solid ${t.color}22;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${t.color};flex-shrink:0;">${b(fo(s.first_name,s.last_name))}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;color:${c?"var(--text-bright,#f0efe6)":"#9e9a92"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(s.first_name)} ${b(s.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:4px;flex:1;">
                            <div style="flex:1;height:3px;background:#2a2a24;">
                                <div style="width:${s.skill}%;height:100%;background:${p};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:${p};width:18px;text-align:right;">${s.skill}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${st(s.required_salary)}/yr</span>
                    </div>
                </div>
            </div>
        </div>`}if(a+="</div>",a+='<div style="flex:1;overflow-y:auto;">',!n)a+=`<div style="padding:50px 24px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:14px;color:var(--text-dim);margin-bottom:10px;">Select a candidate</div>
            <div style="font-size:12px;color:#6a6660;">${i.length} candidate${i.length!==1?"s":""} available for ${b(e)}</div>
        </div>`;else{const r=n.required_salary*n.required_years,s=ut(n.skill);a+=`<div style="padding:20px;border-bottom:1px solid #2a2a24;">
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
                        <div style="width:${n.skill}%;height:100%;background:${s};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${s};">${n.skill}</span>
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
            <div style="display:flex;gap:5px;flex-wrap:wrap;">`;for(const f of n.specializations||[]){const l=io[f],u=f===e;a+=`<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:3px 10px;color:${u?"#000":l?.color||"#9e9a92"};background:${u?l?.color||"#5a8aaa":(l?.color||"#5a8aaa")+"10"};border:1px solid ${u?"transparent":(l?.color||"#5a8aaa")+"30"};">${b(f)}</span>`}a+="</div></div>",a+=`<div style="padding:12px 20px;border-bottom:1px solid #2a2a24;">
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
                    <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${st(r)}</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;margin-top:5px;">Salary is deducted from cash reserves each tick as an operating expense.</div>
        </div>`;const c=n.skill>=80?"EXCEPTIONAL":n.skill>=65?"STRONG":n.skill>=50?"COMPETENT":n.skill>=35?"DEVELOPING":"WEAK",p=n.skill>=80?"Elite talent. Actions have high success rate and reduced costs.":n.skill>=65?"Strong performer. Reliable outcomes across most actions.":n.skill>=50?"Adequate for the role. Outcomes are average.":n.skill>=35?"Below average. Actions may fail or cost more. Consider alternatives.":"Poor fit. High failure rates. Replacement recommended.";a+=`<div style="padding:12px 20px;">
            <div style="padding:8px 12px;background:${s}08;border:1px solid ${s}18;">
                <div style="font-family:var(--font-mono);font-size:10px;color:${s};letter-spacing:0.8px;margin-bottom:3px;">${c}</div>
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${p}</div>
            </div>
        </div>`}a+="</div>",a+="</div>",a+=`<div style="padding:12px 20px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:14px;">`,n?a+=`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CANDIDATE</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--text-bright,#f0efe6);">${b(n.first_name)} ${b(n.last_name)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SKILL</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${ut(n.skill)};">${n.skill}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SALARY</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:#c84;">${st(n.required_salary)}/yr</div></div>`:a+='<div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Select a candidate to hire</div>',a+=`</div>
        <div style="display:flex;gap:8px;">
            <div onclick="closeExecSearch()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="es-hire-btn" onclick="esHireCandidate()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${n?"#000":"#6a6660"};background:${n?t.color:"#2a2a24"};cursor:${n?"pointer":"not-allowed"};${n?"":"opacity:0.4;pointer-events:none;"}">HIRE</div>
        </div>
    </div>`,a+='<div id="es-error" style="padding:5px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',o.innerHTML=a}function ko(){return V.reduce((e,t)=>{const i=Number(t.capacity||0),n=Number(t.condition||0)/100;return e+Math.floor(i*n)},0)+500}function Jr(o,e){const t=We.find(a=>a.id===o),i=Number(d?.[t.factionKey]??0),n=ne[o]+e;if(!(i+n<0)){if(e>0){const a=We.reduce((s,c)=>{const p=Number(d?.[c.factionKey]??0),f=c.id===o?n:ne[c.id];return s+p+f},0),r=ko();if(a>r)return}ne[o]=n,Eo()}}function Xr(o){o?ne[o]=0:ne={general:0,skilled:0,innovative:0},Eo()}async function Zr(){if(Ho||!Object.values(ne).some(r=>r!==0))return;let e=0;for(const r of We){const s=ne[r.id];s>0&&(e+=s*$i(r.multiplier)*.1)}const t=Number(d?.corp_cash_reserves??0);if(e>t){alert("Insufficient cash reserves. Hiring cost: "+x(e)+", available: "+x(t));return}const i=We.reduce((r,s)=>r+Number(d?.[s.factionKey]??0)+ne[s.id],0),n=ko();if(i>n){alert("Cannot hire beyond property capacity ("+n.toLocaleString()+"). You need more workplaces.");return}const a=e>0?`Confirm workforce changes?

Hiring fee: `+x(e)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(a)){Ho=!0;try{const r={};for(const p of We){const f=Number(d?.[p.factionKey]??0);r[p.factionKey]=Math.max(0,f+ne[p.id])}e>0&&(r.corp_cash_reserves=Math.max(0,t-Math.round(e)));const{error:s}=await y.from("factions").update(r).eq("id",d.id);if(s)throw s;Object.assign(d,r),ne={general:0,skilled:0,innovative:0};const c=document.getElementById("topbar-cash");if(c){const p=Number(d.corp_cash_reserves??0);c.textContent="CASH: "+(p>=1e6?"$"+(p/1e6).toFixed(1)+"M":"$"+Math.round(p/1e3)+"k")}Eo()}catch(r){alert("Error: "+r.message)}finally{Ho=!1}}}function Eo(){const o=document.getElementById("hf-card-container");if(!o)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=Number(S?.minimum_wage??50),n=Number(S?.inflation??50),a=Number(S?.standard_of_living??50),r=i/100*48e3,s=(1+(n-50)/100*.5).toFixed(2),c=(1+(a-50)/100*.5).toFixed(2),p=S?.name||d?.nation||"Nation",f=Object.values(ne).some(h=>h!==0),l=ko();let u=0,m=0,v=0,g=0,_="";for(const h of We){const E=Number(d?.[h.factionKey]??0),z=ne[h.id],I=E+z,w=$i(h.multiplier),C=z>0,q=E*w,k=I*w,R=k-q;u+=E,m+=I,v+=q,g+=k;const A=z!==0?C?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";_+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${t.border};background:${A};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${h.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${h.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${t.text}">${E.toLocaleString()}</span>
                    ${z!==0?`<span style="font-family:${e};font-size:10px;color:${t.dim}">→</span>
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${C?t.greenBright:t.red}">${I.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${h.multiplier}.0 × ${s} × ${c})</span>
                <span style="font-family:${e};font-size:10px;color:${h.color}">${x(w)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${h.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.red};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-50</div>
                <div onclick="hfSetChange('${h.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.redDim};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${z!==0?t.card:"transparent"};border:1px solid ${z!==0?t.border:"transparent"}">
                    ${z!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${e};font-size:12px;font-weight:700;color:${C?t.greenBright:t.red}">${C?"+":""}${z}</span>
                        <span onclick="hfReset('${h.id}')" style="font-family:${e};font-size:8px;color:${t.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${e};font-size:9px;color:${t.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${h.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+10</div>
                <div onclick="hfSetChange('${h.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+50</div>
            </div>
            ${z!==0?`<div style="margin-top:6px;padding:4px 8px;background:${t.bg};border:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${R>0?t.red:t.greenBright}">${R>0?"+":""}${x(R)}/yr</span>
            </div>`:""}
        </div>`}const $=g-v;o.innerHTML=`
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
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">${x(r)}/yr</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">INFLATION</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${n}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${s}</div>
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
                        <span style="font-family:${e};font-size:13px;font-weight:700;color:${u>=l?t.red:t.text}">${f?m.toLocaleString():u.toLocaleString()}</span>
                        <span style="font-family:${e};font-size:9px;color:${t.dim}">/ ${l.toLocaleString()}</span>
                    </div>
                    ${u>=l&&!f?`<div style="font-family:${e};font-size:7px;color:${t.red};margin-top:2px;">Need workplaces to hire new employees.</div>`:""}
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${x(v)}</span>
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
    </div>`}function es(){const o=document.getElementById("wf-summary-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},i=(S?.name||d?.nation||"Nation").toUpperCase(),n=Number(S?.minimum_wage??50),a=Number(S?.inflation??50),r=Number(S?.standard_of_living??50),s=n/100*48e3,c=1+(a-50)/100*.5,p=1+(r-50)/100*.5,f=[{label:"General Workforce",mult:2,color:t.accent,key:"corp_general_workforce",countColor:t.text},{label:"Skilled Workforce",mult:3,color:t.gold,key:"corp_skilled_workforce",countColor:t.blue},{label:"Innovative Workforce",mult:6,color:t.orange,key:"corp_innovative_workforce",countColor:t.gold}];let l=0,u=0,m="";for(const v of f){const g=Number(d?.[v.key]??0),_=Math.round(s*v.mult*c*p),$=g*_;l+=g,u+=$,m+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${v.label}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${i}</span>
                </div>
                <span style="font-family:${e};font-size:16px;font-weight:700;color:${v.countColor}">${g.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${v.mult}.0 × ${c.toFixed(2)} × ${p.toFixed(2)})</span>
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
                    <span style="font-family:${e};font-size:9px;color:${t.text}">${n}/100 → ${x(s)}/yr</span>
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
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${x(u)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">PER TICK (÷12)</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${x(Math.round(u/12))}</span>
            </div>
        </div>
    </div>`}let V=[];async function Co(){if(!d?.id)return;const{data:o}=await y.from("corp_properties").select("*").eq("faction_id",d.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});V=o||[]}function So(){const o=document.getElementById("property-card-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=(S?.name||d?.nation||"Nation").toUpperCase(),n=1+(Number(S?.inflation??50)-50)/100*.3;let a="",r=0,s=0;const c=S?.name||d?.nation||"Home Nation",p=5e7,f=1+(Number(S?.inflation??50)-50)/100*.3,l=.8+Number(S?.stability??50)/100*.4,u=Math.round(p*f*l),m=Math.round(u*.005);r+=u,s+=m,a+=`
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
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${x(u)}</div>
            </div>
            <div style="flex:1;padding:3px 6px">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${x(m)}</div>
            </div>
        </div>
    </div>`;for(const v of V){const g=uo[v.style]||uo.Basic;r+=Number(v.purchase_price||0),s+=Number(v.monthly_maintenance||0),a+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:${t.text}">${v.name}</span>
                <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${t.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">OWNED</span>
            </div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:4px;">${v.city||i} · ${(v.type||"").replace(/_/g," ")} · <span style="color:${g.color}">${(v.style||"Basic").toUpperCase()}</span></div>
            <div style="display:flex;gap:0;background:${t.card};border:1px solid ${t.border}">
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">CAPACITY</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${(v.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">PAID</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${x(v.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${x(v.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="margin-top:4px;display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">CONDITION</span>
                <span style="font-family:${e};font-size:9px;color:${v.condition>=75?"#5c5":v.condition>=50?"#ca5":t.orange}">${v.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:${t.border};margin-top:2px;"><div style="width:${v.condition}%;height:100%;background:${v.condition>=75?"#5c5":v.condition>=50?"#ca5":t.orange}"></div></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <div onclick="propRefurbish('${v.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.accent};border:1px solid ${t.accent}33;cursor:pointer;">REFURBISH (${x(Math.round((v.purchase_price||0)*.1*n))})</div>
                <div onclick="propSell('${v.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.red};border:1px solid ${t.red}33;cursor:pointer;">SELL</div>
            </div>
        </div>`}o.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Property</span>
            </div>
            <span style="font-family:${e};font-size:10px;color:${t.muted}">${V.length+1} ASSET${V.length+1!==1?"S":""}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${a}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL VALUE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.green}">${x(r)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL MAINTENANCE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${x(s)}/mo</span>
            </div>
        </div>
    </div>`}let lt=[],se=null;const uo={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function Ln(){if(!d?.nation_id)return;const{data:o,error:e}=await y.from("available_properties").select("*").eq("nation_id",d.nation_id).eq("status","available").order("price",{ascending:!0});if(e){console.warn("[Property] Failed to load marketplace:",e.message);return}const t=d?.corp_sector==="Construction";lt=(o||[]).filter(i=>t||i.type!=="warehouse").map(i=>({...i,adjusted_cost:i.price,adjusted_maintenance:i.monthly_maintenance}))}function To(){const o=document.getElementById("new-property-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"};(S?.name||d?.nation||"Nation").toUpperCase();const i=Number(S?.standard_of_living??50),n=Number(S?.gdp_growth??50),a=Number(S?.inflation??50),r=S?.capital||"Capital",s={capital:r,port:r+" Port",industrial:r+" Industrial Zone",suburban:r+" Suburbs",coastal:r+" Coast"};let c="";if(lt.length===0)c=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let p=0;p<lt.length;p++){const f=lt[p],l=se===p,u=uo[f.style]||uo.Basic,m=s[f.city_template]||r;c+=`
            <div onclick="npSelect(${p})" style="padding:8px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${l?t.accent:"transparent"};background:${l?"rgba(139,154,107,0.03)":"transparent"};">
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
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${lt.length} AVAILABLE</span>
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
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${se!==null?"#000":t.dim};background:${se!==null?t.accent:"transparent"};border:1px solid ${se!==null?t.accent:t.border};cursor:${se!==null?"pointer":"default"};opacity:${se!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function ts(o){se=se===o?null:o,To()}let Wo=!1;async function os(){if(se===null||Wo)return;const o=lt[se];if(!o)return;const e=Number(d?.corp_cash_reserves??0);if(o.adjusted_cost>e){alert(`Insufficient cash reserves.
Property: `+x(o.adjusted_cost)+`
Cash: `+x(e));return}if(confirm('Buy "'+o.name+'" for '+x(o.adjusted_cost)+`?

Monthly maintenance: `+x(o.adjusted_maintenance)+`/mo
Condition: `+o.condition+`%

This will be deducted from your cash reserves.`)){Wo=!0;try{const{error:t}=await y.from("corp_properties").insert({faction_id:d.id,nation_id:d.nation_id,catalog_id:o.catalog_id||null,name:o.name,type:o.type,style:o.style,capacity:o.capacity,purchase_price:o.adjusted_cost,monthly_maintenance:o.adjusted_maintenance,condition:o.condition,city:o.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(t)throw t;const i=Math.max(0,e-o.adjusted_cost),{error:n}=await y.from("factions").update({corp_cash_reserves:i}).eq("id",d.id);if(n)throw n;d.corp_cash_reserves=i,o.id&&await y.from("available_properties").update({status:"sold",purchased_by:d.id}).eq("id",o.id);const a=document.getElementById("topbar-cash");a&&(a.textContent="CASH: "+(i>=1e6?"$"+(i/1e6).toFixed(1)+"M":"$"+Math.round(i/1e3)+"k")),se=null,await Ln(),To(),So(),alert("Property purchased: "+o.name+`

Deducted: `+x(o.adjusted_cost))}catch(t){alert("Purchase failed: "+t.message)}finally{Wo=!1}}}const gt={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let Bn=!1,M={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0,nationId:null,nationName:null},Yo=!1,vn=[];function ji(){const e=1+(Number(S?.inflation??50)-50)/100*.3,t=gt[M.style]?.costMod||1,i=M.type==="Warehouse"?.75:1,n=Math.round(M.size*1e5*e*t*i),a=Math.round(n*(1+M.budgetMod/100)),r=Math.round(a*.007*(gt[M.style]?.maintMod||1));return{baseBudget:n,adjusted:a,maint:r,inflMod:e,styleMod:t}}async function ns(){Bn=!0,M={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0,nationId:null,nationName:null};try{const{data:o}=await y.from("nations").select("id, name").order("name");vn=(o||[]).filter(e=>e.id!==d?.nation_id)}catch{vn=[]}Fi()}function On(){Bn=!1,document.getElementById("cp-modal-overlay")?.remove()}function is(o,e){M[o]=e,Fi()}async function as(){if(!(Yo||!M.name.trim())){if(M.type==="Regional HQ"&&!M.nationId){alert("Select a target nation for the Regional HQ.");return}Yo=!0;try{const o=ji(),e=M.type==="Regional HQ"?M.nationId:d.nation_id,t=M.type==="Regional HQ"?M.nationName||"Unknown":S?.name||d?.nation||"Unknown",i=gt[M.style]?.repGain||1,n=await y.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),a=n.data?.current_tick||0,r=(n.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:s}=await y.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",e).eq("issuer_type","PRIVATE"),p=`PVT-C${(s||0)+1}-${r}`,{error:f}=await y.from("construction_contracts").insert({nation_id:e,template_key:"custom_building",sector:"civil_engineering",name:M.name.trim(),project_type:M.type,project_subtype:M.style,description:`${M.type} (${M.style}) — ${M.size.toLocaleString()} employees, commissioned by ${d.faction_name}`,project_code:p,budget_ceiling:o.adjusted,timeline_ticks:M.timeline,required_materials:(()=>{const l=M.size/1e3,u=M.style,m={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[u]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},v=(g,_)=>Math.max(1,Math.ceil(l*g*_));return{concrete:v(8,m.concrete),steel:v(6,m.steel),glass_facades:v(3,m.glass),em_systems:v(4,m.em),lumber:v(1,m.lumber),heavy_parts:v(2,m.heavy),aggregate:v(3,m.agg)}})(),required_equipment:(()=>{const l=M.size,u={trucks:Math.ceil(l/2e3)+1,mixers:Math.ceil(l/3e3)+1};return l>1e3&&(u.excavators=Math.ceil(l/3e3)+1,u.cranes=Math.ceil(l/4e3)+1),l>3e3&&(u.bulldozers=Math.ceil(l/4e3)+1,u.haulers=Math.ceil(l/5e3)+1),l>8e3&&(u.piledrivers=Math.ceil(l/6e3)+1),u})(),required_workforce:{general:Math.ceil(M.size*.08),skilled:Math.ceil(M.size*.03)},status:"open",generated_at_tick:a,bidding_ends_tick:a+3,issuer_type:"PRIVATE",issuer_name:d.faction_name,issuer_faction_id:d.id});if(f)throw f;On(),alert(`Construction project submitted!

Project: `+M.name.trim()+`
Code: `+p+`
Budget: `+x(o.adjusted)+`
Expected Reputation: +`+Math.ceil(o.adjusted/1e8*3)+` (+3 per $100M)

All construction corporations in `+t+" can now bid on this project.")}catch(o){alert("Failed to submit project: "+o.message)}finally{Yo=!1}}}function Fi(){if(document.getElementById("cp-modal-overlay")?.remove(),!Bn)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=ji(),i=S?.name||d?.nation||"Nation",n=Math.ceil(t.adjusted/1e8*3),a=n>=4?e.gold:n>=3?e.greenBright:n>=2?e.accent:e.dim,r=Object.entries(gt).map(([p,f])=>{const l=M.style===p;return`<div onclick="cpSetField('style','${p}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${l?f.color+"18":"transparent"};border:1px solid ${l?f.color+"44":e.border};">
            <div style="font-family:${o};font-size:9px;font-weight:700;color:${l?f.color:e.dim}">${p}</div>
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
                    ${["Regional HQ","Office Building",...d?.corp_sector==="Construction"?["Warehouse"]:[],...d?.corp_subsector?.toLowerCase()==="banking"?["Branch Office"]:[],...d?.corp_subsector?.toLowerCase()==="investment"?["Trading Floor"]:[],...d?.corp_subsector?.toLowerCase()==="insurance"?["Claims Office"]:[]].map(p=>{const f=["Branch Office","Trading Floor","Claims Office"].includes(p),u=p==="Warehouse"?e.orange:f?"#8a6aaa":e.accent;return`<span onclick="cpSetField('type','${p}')" style="flex:1;min-width:100px;text-align:center;padding:6px 0;font-family:${o};font-size:12px;font-weight:700;cursor:pointer;color:${M.type===p?"#000":e.dim};background:${M.type===p?u:"transparent"};border:1px solid ${M.type===p?u:e.border}">${p}</span>`}).join("")}
                </div>
                ${M.type==="Regional HQ"?`<div style="margin-top:8px;">
                    <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Target Nation</div>
                    <select id="cp-nation-select" onchange="cpSetField('nationId', this.value); cpSetField('nationName', this.options[this.selectedIndex].text)"
                        style="width:100%;padding:8px 12px;font-family:${o};font-size:12px;color:${e.text};background:${e.card};border:1px solid ${e.border};outline:none;">
                        <option value="">-- Select a nation --</option>
                        ${vn.map(p=>`<option value="${p.id}" ${M.nationId===p.id?"selected":""}>${p.name}</option>`).join("")}
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
                <div style="margin-top:5px;font-family:${o};font-size:10px;color:${gt[M.style].color}">${gt[M.style].desc}</div>
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
                        <span style="font-family:${o};font-size:12px;color:${e.muted}">${x(t.baseBudget)}</span>
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
                <div style="font-family:${o};font-size:9px;color:${e.dim};margin-top:3px">${M.style} style · ${n===5?"Maximum prestige":n>=4?"Impressive presence":n>=3?"Strong statement":n>=2?"Solid investment":"Functional addition"}</div>
            </div>

        </div>
        <div style="padding:12px 20px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${o};font-size:9px;color:${e.dim}">TOTAL PROJECT</div>
                <div style="font-family:${o};font-size:18px;font-weight:700;color:${e.gold}">${x(t.adjusted)}</div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="cpClose()" style="padding:7px 20px;font-family:${o};font-size:12px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:7px 20px;font-family:${o};font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${e.gold};cursor:pointer;opacity:${M.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(s);const c=document.getElementById("cp-name-input");c&&c.addEventListener("input",p=>{M.name=p.target.value}),s.addEventListener("click",p=>{p.target===s&&On()})}function rs(){const o=document.getElementById("cp-name-input");if(o&&(M.name=o.value),!M.name.trim()){alert("Please enter a building name.");return}as()}window.cpClose=On;window.cpSetField=is;window.cpSubmitFromModal=rs;window.npSelect=ts;window.npBuyProperty=os;window.npOpenConstructionModal=ns;let xt=!1;async function ss(o){if(xt)return;const e=V.find(s=>s.id===o);if(!e)return;const t=1+(Number(S?.inflation??50)-50)/100*.3,i=Math.round((e.purchase_price||0)*.1*t),n=Number(d?.corp_cash_reserves??0);if(i>n){alert("Insufficient cash. Refurbishment costs "+x(i)+" (inflation-adjusted), you have "+x(n));return}if(e.condition>=95){alert("Property is already in excellent condition ("+e.condition+"%).");return}const a=5+Math.floor(Math.random()*21),r=Math.min(100,e.condition+a);if(confirm('Refurbish "'+e.name+`"?

Cost: `+x(i)+`
Expected improvement: +`+a+"% condition ("+e.condition+"% → "+r+"%)")){xt=!0;try{await y.from("corp_properties").update({condition:r}).eq("id",o);const s=Math.max(0,n-i);await y.from("factions").update({corp_cash_reserves:s}).eq("id",d.id),d.corp_cash_reserves=s;const c=document.getElementById("topbar-cash");c&&(c.textContent="CASH: "+(s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k")),await Co(),So(),alert("Refurbished! Condition: "+e.condition+"% → "+r+"%")}catch(s){alert("Refurbishment failed: "+s.message)}finally{xt=!1}}}async function ls(o){if(xt)return;const e=V.find(a=>a.id===o);if(!e)return;const t=1+(Number(S?.inflation??50)-50)/100*.3,i=(e.condition||50)/100,n=Math.round((e.purchase_price||0)*.6*i*t);if(confirm('Sell "'+e.name+`"?

Sale value: `+x(n)+" (60% × "+e.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){xt=!0;try{await y.from("corp_properties").update({is_active:!1}).eq("id",o);const r=Number(d?.corp_cash_reserves??0)+n;await y.from("factions").update({corp_cash_reserves:r}).eq("id",d.id),d.corp_cash_reserves=r;const c=(await y.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await y.from("available_properties").insert({nation_id:d.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,price:Math.round(n*1.1),monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,generated_at_tick:c,expires_at_tick:c+6,status:"available"});const p=document.getElementById("topbar-cash");p&&(p.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")),await Co(),So(),await Ln(),To(),alert('Sold "'+e.name+'" for '+x(n))}catch(a){alert("Sale failed: "+a.message)}finally{xt=!1}}}window.propRefurbish=ss;window.propSell=ls;const Oe={SALE:.8,DISSOLVE:.6,REVENUE_BASE:.02,GDP_NEUTRAL:30,DEFAULT_REPUTATION:25};function ds(o){if(!o)return 0;const e=o.trim().replace(/[$,]/g,""),t=e.match(/^([\d.]+)\s*[Mm]$/),i=e.match(/^([\d.]+)\s*[Kk]$/);return Math.round(t?parseFloat(t[1])*1e6:i?parseFloat(i[1])*1e3:parseFloat(e))}function Je(o){const e=document.getElementById("topbar-cash");e&&(e.textContent="CASH: "+(o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k"))}function Ui(o){return wt.find(e=>e.id===o)?.name||"—"}function zo(o){return V.filter(e=>e.nation_id===o)}async function Vt(){dt=0,await Co(),So(),Wt(),Yt()}let ae=!1,dt=0,oo={};async function cs(){if(d?.id)try{const{data:o}=await y.from("construction_contracts").select("nation_id").eq("awarded_to_faction",d.id).in("status",["in_progress","awarded"]);oo={};for(const e of o||[])e.nation_id&&(oo[e.nation_id]=(oo[e.nation_id]||0)+1)}catch{}}function Hi(o){const e=zo(o.nation_id),t=e.reduce((v,g)=>v+Number(g.purchase_price||0),0),i=e.reduce((v,g)=>v+Number(g.capacity||0),0),n=oo[o.nation_id]||0,a=wt.find(v=>v.id===o.nation_id),r=(o.name||"").trim().split(/\s+/),s=r.length>=2?r.map(v=>v[0]).join("").toUpperCase().slice(0,4):(o.name||"SUB").slice(0,4).toUpperCase(),c=Number(o.sub_cash||0),p=Number(a?.gdp_growth??50),f=c*Oe.REVENUE_BASE,l=(p-Oe.GDP_NEUTRAL)/100,u=Oe.DEFAULT_REPUTATION/100,m=c>0?Math.round(f*(1+l)*u):0;return{id:o.id,name:o.name,abbr:s,nation:a?.name||o.city||"—",nationId:o.nation_id,sector:d?.corp_sector||"General",subsector:o.subsector||d?.corp_subsector||"—",revenue:m,debt:0,cash:c,reputation:Oe.DEFAULT_REPUTATION,valuation:t,workforce:i,projects:n,established:o.created_at?new Date(o.created_at).getFullYear().toString():"—",trend:p>=40&&c>0?"up":p>=Oe.GDP_NEUTRAL&&c>0?"flat":"down",profitable:m>0,hqProp:o}}function Wt(){const o=document.getElementById("manage-subsidiaries-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=V.filter(f=>f.type==="regional_hq").map(Hi);dt>=n.length&&(dt=0);const a=n[dt]||null;let r="";n.length===0&&(r=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No subsidiaries established.<br>Use Create Subsidiary to expand.</div>`);let s=0,c=0;for(let f=0;f<n.length;f++){const l=n[f],u=f===dt;s+=l.revenue,c+=l.valuation;const m=l.trend==="up"?t.greenBright:l.trend==="down"?t.red:t.dim,v=l.trend==="up"?"▲":l.trend==="down"?"▼":"–";r+=`
        <div onclick="selectSubsidiary(${f})" style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${u?t.accent:"transparent"};background:${u?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:40px;font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${l.abbr}</span>
            <div style="flex:1.5;">
                <div style="font-size:11px;font-weight:600;color:${t.text};line-height:1.2">${l.name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${l.subsector}</div>
            </div>
            <span style="width:65px"><span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${l.nation.toUpperCase().slice(0,8)}</span></span>
            <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${l.profitable?t.greenBright:t.redDim};text-align:right">${x(l.revenue)}</span>
            <span style="width:40px;font-family:${e};font-size:9px;font-weight:700;color:${l.reputation>=40?t.accent:l.reputation>=25?t.yellow:t.orange};text-align:right">${l.reputation}</span>
            <span style="width:55px;font-family:${e};font-size:9px;color:${t.muted};text-align:right">${x(l.valuation)}</span>
            <span style="width:12px;font-family:${e};font-size:8px;color:${m};text-align:right">${v}</span>
        </div>`}let p="";if(a){const f=a.trend==="up"?t.greenBright:a.trend==="down"?t.red:t.dim,l=a.trend==="up"?"▲":a.trend==="down"?"▼":"–",u=a.trend==="up"?"Growing":a.trend==="down"?"Declining":"Stable",m=a.reputation>=40?t.accent:a.reputation>=25?t.yellow:t.orange,v=[{label:"Revenue",value:x(a.revenue),color:a.profitable?t.greenBright:t.redDim},{label:"Cash",value:x(a.cash),color:t.text},{label:"Debt",value:a.debt>0?x(a.debt):"$0",color:a.debt>0?t.orange:t.dim},{label:"Reputation",value:a.reputation+"/100",color:m},{label:"Market Valuation",value:x(a.valuation),color:t.gold},{label:"Workforce",value:a.workforce.toLocaleString(),color:t.text},{label:"Active Projects",value:a.projects.toString(),color:a.projects>0?t.text:t.dim}],g=a.projects===0,_=a.hqProp?.logo_url?`<img src="${b(a.hqProp.logo_url)}" alt="" style="width:32px;height:32px;object-fit:cover;border-radius:4px;">`:`<label style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:${t.card};border:1px dashed ${t.border};border-radius:4px;cursor:pointer;font-size:14px;color:${t.dim};" title="Upload subsidiary logo">+<input type="file" accept="image/*" id="sub-logo-upload" data-prop-id="${a.hqProp?.id||""}" style="display:none;"></label>`;p=`
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
                    <span style="font-family:${e};font-size:8px;color:${f}">${l} ${u}</span>
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
                <div style="flex:1;overflow:auto;">${r}</div>
                <div style="padding:6px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;display:flex;align-items:center;">
                    <span style="width:40px"></span>
                    <span style="flex:1.5;font-family:${e};font-size:8px;color:${t.dim}">COMBINED</span>
                    <span style="width:65px"></span>
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${x(s)}</span>
                    <span style="width:40px"></span>
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${x(c)}</span>
                    <span style="width:12px"></span>
                </div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${p}
            </div>
        </div>
    </div>`,document.getElementById("sub-logo-upload")?.addEventListener("change",async f=>{const l=f.target.files?.[0],u=f.target.dataset.propId;if(!(!l||!u)){if(l.size>2*1024*1024){alert("Logo must be under 2MB.");return}try{const m=l.name.split(".").pop()?.toLowerCase()||"png",v=`party-logos/${d.id}/sub_${u}_${Date.now()}.${m}`,{error:g}=await y.storage.from("public-assets").upload(v,l,{contentType:l.type,upsert:!0});if(g)throw g;const{data:_}=y.storage.from("public-assets").getPublicUrl(v),$=_?.publicUrl;if($){await y.from("corp_properties").update({logo_url:$}).eq("id",u);const h=V.find(E=>E.id===u);h&&(h.logo_url=$),Wt()}}catch(m){alert("Upload failed: "+(m.message||"Error"))}}}),a&&(a.subsector==="Insurance"||a.subsector==="Banking")){const f="sub-dashboard-"+a.id;setTimeout(()=>{document.getElementById(f)&&ma(y,{faction:d,nation:S,shard:T},f,a.id).catch(l=>console.error("[SubDash] Init failed:",l))},50)}}async function Gi(o,e){if(ae)return;const t=V.find(m=>m.id===o);if(!t)return;const i=e==="sell",n=i?Oe.SALE:Oe.DISSOLVE,a=i?"SELL":"DISSOLVE",r=i?"sold":"dissolved",s=i?"80%":"60%",c=Ui(t.nation_id),p=zo(t.nation_id),f=p.reduce((m,v)=>m+Math.round((v.purchase_price||0)*n*(v.condition||50)/100),0),l=Number(t.sub_cash||0),u=f+l;if(confirm(a+' subsidiary "'+t.name+`"?

`+p.length+" properties at "+s+` × condition:
  Property value: `+x(f)+`
  Subsidiary cash: `+x(l)+`
  ─────────────────
  Total return: `+x(u)+`

All operations in `+c+` cease.
This cannot be undone.`)){ae=!0;try{const m=p.map(g=>g.id);if(m.length===1){const{error:g}=await y.from("corp_properties").update({is_active:!1}).eq("id",m[0]);if(g)throw g}else if(m.length>1){const{error:g}=await y.from("corp_properties").update({is_active:!1}).in("id",m);if(g)throw g}await y.from("corp_properties").update({sub_cash:0}).eq("id",o).then(()=>{}).catch(()=>{});const v=Number(d?.corp_cash_reserves??0)+u;await y.from("factions").update({corp_cash_reserves:v}).eq("id",d.id),d.corp_cash_reserves=v,Je(v),await Vt(),alert("Subsidiary "+r+". "+p.length+` properties liquidated.
Total received: `+x(u))}catch(m){alert("Failed: "+m.message)}finally{ae=!1}}}function ps(o){Gi(o,"sell")}async function fs(o){if(ae)return;const e=V.find(s=>s.id===o);if(!e)return;const t=Ui(e.nation_id),n=zo(e.nation_id).reduce((s,c)=>s+Math.round((c.purchase_price||0)*.8*(c.condition||50)/100),0),a=Number(e.sub_cash||0),r=Math.round(a*.05);if(confirm('PUT UP FOR SALE: "'+e.name+`"

Nation: `+t+`
Estimated Valuation: `+x(n)+`
Subsidiary Cash: `+x(a)+`
Subsector: `+(e.subsector||"General")+`

This will list your subsidiary on the marketplace.
Other corporations can place bids (minimum $1M).
You review and accept bids.

Continue?`)){ae=!0;try{const s=T?.current_tick||0,{data:c,error:p}=await y.from("subsidiary_sales").insert({subsidiary_id:o,seller_faction_id:d.id,nation_id:e.nation_id,subsidiary_name:e.name,subsector:e.subsector||null,valuation:n,monthly_revenue:r,sub_cash_at_listing:a,employee_count:e.capacity||0,status:"listed",listed_at_tick:s}).select("*").single();if(p){alert("Failed to list: "+p.message);return}alert('"'+e.name+`" is now listed for sale.

Other corporations will see it on the Expansion tab and can place bids.`),await Vt()}catch(s){alert("Failed: "+s.message)}finally{ae=!1}}}let vo=[],Vi="ready",It=null;async function Io(){const o=await ya(y);vo=o.listings,Vi=o.state,It=o.error,It&&console.error("[SubMarket] Load failed:",It.message)}function No(){let o=document.getElementById("sub-marketplace-card");o||(o=document.createElement("div"),o.id="sub-marketplace-card",document.getElementById("expansion-content")?.appendChild(o));const e=vo.filter(r=>r.seller_faction_id!==d?.id),t=vo.filter(r=>r.seller_faction_id===d?.id),i="'JetBrains Mono',monospace",n={surface:"#1a1a17",card:"#1c1c18",border:"rgba(255,255,255,0.06)",dim:"#4a4940",muted:"#666",text:"#c4c2b8",bright:"#f0efe6",orange:"#c84",green:"#5cb85c",red:"#d9534f",gold:"#c8a832"};let a=`<div style="width:760px;background:${n.surface};border:1px solid ${n.border};font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:10px 14px;border-bottom:1px solid ${n.border};display:flex;align-items:center;gap:8px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${n.orange};display:inline-block;"></span>
            <span style="font-family:${i};font-size:11px;font-weight:700;letter-spacing:1.5px;color:${n.orange};text-transform:uppercase;">Subsidiary Marketplace</span>
            <span style="font-family:${i};font-size:9px;color:${n.dim};">${e.length} available</span>
        </div>`;if(t.length>0){a+=`<div style="padding:8px 14px;border-bottom:1px solid ${n.border};background:${n.card};">
            <div style="font-family:${i};font-size:8px;letter-spacing:1px;color:${n.gold};text-transform:uppercase;margin-bottom:6px;">YOUR LISTINGS</div>`;for(const r of t){const c=(r.subsidiary_bids||[]).filter(p=>p.status==="pending");a+=`<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:11px;font-weight:700;color:${n.bright};">${b(r.subsidiary_name)}</span>
                    <span style="font-family:${i};font-size:8px;color:${n.dim};margin-left:6px;">${b(r.subsector||"")}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${i};font-size:9px;color:${c.length>0?n.green:n.dim};">${c.length} bid${c.length!==1?"s":""}</span>
                    ${c.length>0?`<span onclick="subViewBids('${r.id}')" style="font-family:${i};font-size:8px;font-weight:700;padding:3px 8px;color:${n.green};border:1px solid ${n.green}44;cursor:pointer;">VIEW BIDS</span>`:""}
                    <span onclick="subCancelSale('${r.id}')" style="font-family:${i};font-size:8px;font-weight:700;padding:3px 8px;color:${n.red};border:1px solid ${n.red}44;cursor:pointer;">CANCEL</span>
                </div>
            </div>`}a+="</div>"}if(Vi==="error")a+=`<div style="padding:24px 14px;text-align:center;font-family:${i};font-size:10px;color:${n.red};font-style:italic;">${b(It&&It.message||"Subsidiary marketplace is temporarily unavailable.")}</div>`;else if(e.length===0)a+=`<div style="padding:24px 14px;text-align:center;font-family:${i};font-size:10px;color:${n.dim};font-style:italic;">No subsidiaries for sale right now.</div>`;else for(const r of e){const s=(r.subsidiary_bids||[]).find(f=>f.bidder_faction_id===d?.id&&f.status==="pending"),p=(_allNations||[]).find(f=>f.id===r.nation_id)?.name||"Unknown";a+=`<div style="padding:10px 14px;border-bottom:1px solid ${n.border};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:12px;font-weight:700;color:${n.bright};">${b(r.subsidiary_name)}</span>
                        <span style="font-family:${i};font-size:7px;font-weight:700;padding:1px 5px;color:${n.orange};border:1px solid ${n.orange}44;background:${n.orange}0a;">${b(r.subsector||"General")}</span>
                    </div>
                    <span style="font-family:${i};font-size:8px;color:${n.dim};">${b(p)}</span>
                </div>
                <div style="display:flex;gap:16px;font-family:${i};font-size:8px;color:${n.muted};margin-bottom:8px;">
                    <span>Valuation: <strong style="color:${n.text};">${x(r.valuation)}</strong></span>
                    <span>Revenue: <strong style="color:${n.text};">${x(r.monthly_revenue)}/mo</strong></span>
                    <span>Cash: <strong style="color:${n.text};">${x(r.sub_cash_at_listing)}</strong></span>
                    <span>Staff: <strong style="color:${n.text};">${r.employee_count}</strong></span>
                </div>
                <div style="display:flex;justify-content:flex-end;">
                    ${s?`<span style="font-family:${i};font-size:8px;font-weight:700;color:${n.green};">✓ BID PLACED: ${x(s.bid_amount)}</span>`:`<span onclick="subPlaceBid('${r.id}','${b(r.subsidiary_name)}',${r.valuation})" style="font-family:${i};font-size:8px;font-weight:700;padding:4px 14px;color:#000;background:${n.orange};cursor:pointer;">PLACE BID</span>`}
                </div>
            </div>`}a+="</div>",o.innerHTML=a}async function ms(o,e,t){const i=prompt('Place bid for "'+e+`"

Valuation: `+x(t)+`
Minimum bid: $1M

Enter bid amount ($):`);if(!i)return;const n=Math.round(Number(i));if(isNaN(n)||n<1e6){alert("Minimum bid is $1,000,000.");return}const a=Number(d?.corp_cash_reserves??0);if(n>a){alert("Insufficient funds. You have "+x(a)+".");return}const{error:r}=await y.from("subsidiary_bids").insert({sale_id:o,bidder_faction_id:d.id,bid_amount:n,status:"pending",placed_at_tick:T?.current_tick||0});if(r){r.message.includes("duplicate")||r.message.includes("unique")?alert("You already have a bid on this subsidiary."):alert("Failed to place bid: "+r.message);return}alert("Bid of "+x(n)+' placed on "'+e+`".
The seller will review your bid.`),await Io(),No()}async function us(o){const e=vo.find(u=>u.id===o);if(!e)return;const t=(e.subsidiary_bids||[]).filter(u=>u.status==="pending");if(t.length===0){alert("No pending bids.");return}const i=t.map(u=>u.bidder_faction_id),{data:n}=await y.from("factions").select("id, faction_name").in("id",i),a={};(n||[]).forEach(u=>{a[u.id]=u.faction_name});let r='Bids for "'+e.subsidiary_name+`":

`;const s=t.sort((u,m)=>m.bid_amount-u.bid_amount);for(let u=0;u<s.length;u++){const m=s[u];r+=u+1+". "+(a[m.bidder_faction_id]||"Unknown")+": "+x(m.bid_amount)+`
`}r+=`
Enter the number of the bid to accept (or cancel):`;const c=prompt(r);if(!c)return;const p=parseInt(c,10)-1;if(isNaN(p)||p<0||p>=s.length){alert("Invalid selection.");return}const f=s[p],l=a[f.bidder_faction_id]||"Unknown";confirm("Accept bid of "+x(f.bid_amount)+" from "+l+`?

This will transfer ownership of "`+e.subsidiary_name+`" to them.
You will receive `+x(f.bid_amount)+` in cash.

This cannot be undone.`)&&await vs(e,f)}let Qo=!1;async function vs(o,e){if(!Qo){Qo=!0;try{const n=T?.current_tick||0,{data:a}=await y.from("factions").select("corp_cash_reserves").eq("id",e.bidder_faction_id).single(),r=Number(a?.corp_cash_reserves??0);if(r<e.bid_amount){alert("Buyer has insufficient funds. Bid cannot be completed."),await y.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:n}).eq("id",e.id);return}var{error:t}=await y.from("factions").update({corp_cash_reserves:r-e.bid_amount}).eq("id",e.bidder_faction_id);if(t){alert("Failed to deduct from buyer: "+t.message);return}const s=Number(d?.corp_cash_reserves??0);var{error:i}=await y.from("factions").update({corp_cash_reserves:s+e.bid_amount}).eq("id",d.id);if(i){await y.from("factions").update({corp_cash_reserves:r}).eq("id",e.bidder_faction_id),alert("Failed to credit seller: "+i.message);return}d.corp_cash_reserves=s+e.bid_amount,await y.from("corp_properties").update({faction_id:e.bidder_faction_id}).eq("id",o.subsidiary_id);const c=V.filter(p=>p.nation_id===o.nation_id&&p.faction_id===d.id);for(const p of c)await y.from("corp_properties").update({faction_id:e.bidder_faction_id}).eq("id",p.id);await y.from("subsidiary_sales").update({status:"completed",completed_at_tick:n,accepted_bid_id:e.id}).eq("id",o.id),await y.from("subsidiary_bids").update({status:"accepted",resolved_at_tick:n}).eq("id",e.id),await y.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:n}).eq("sale_id",o.id).neq("id",e.id),Je(d.corp_cash_reserves),alert("Sale complete! Received "+x(e.bid_amount)+`.

"`+o.subsidiary_name+'" has been transferred to the buyer.'),await Vt(),await Io(),No()}catch(n){console.error("[SubMarket] Accept bid error:",n),alert("Transfer failed: "+n.message)}finally{Qo=!1}}}async function ys(o){if(!confirm("Cancel this listing? The subsidiary will no longer be for sale."))return;const{error:e}=await y.from("subsidiary_sales").update({status:"cancelled"}).eq("id",o);if(e){alert("Failed: "+e.message);return}await Io(),No()}function gs(o){Gi(o,"dissolve")}async function Wi(o,e){if(ae)return;const t=V.find(l=>l.id===o);if(!t)return;const i=Number(d?.corp_cash_reserves??0),n=Number(t.sub_cash||0),a=e?"WITHDRAW":"INJECT CAPITAL";if(e&&n<=0){alert("This subsidiary has no cash to withdraw.");return}const r=e?n:i,s=prompt(a+(e?" from ":" into ")+t.name+`

Parent cash: `+x(i)+`
Subsidiary cash: `+x(n)+`

Enter amount (e.g., 5000000 or 5M):`);if(!s)return;const c=ds(s);if(!c||c<=0||isNaN(c)){alert("Invalid amount.");return}if(c>r){alert("Insufficient "+(e?"subsidiary":"parent")+" cash. Available: "+x(r));return}const p=e?i+c:i-c,f=e?n-c:n+c;if(confirm(a+" "+x(c)+(e?" from ":" into ")+t.name+`?

Parent: `+x(i)+" → "+x(p)+`
Subsidiary: `+x(n)+" → "+x(f))){ae=!0;try{await Promise.all([y.from("factions").update({corp_cash_reserves:p}).eq("id",d.id),y.from("corp_properties").update({sub_cash:f}).eq("id",o)]),d.corp_cash_reserves=p,t.sub_cash=f,Je(p),Wt(),alert((e?"Withdrew ":"Injected ")+x(c)+(e?" from ":" into ")+t.name+".")}catch(l){alert("Failed: "+l.message)}finally{ae=!1}}}function xs(o){Wi(o,!1)}function bs(o){Wi(o,!0)}async function _s(o){if(ae)return;const e=V.find(g=>g.id===o);if(!e)return;const t=Hi(e);t.nation;const i=zo(e.nation_id),n=t.valuation,a=t.cash,r=t.reputation,s=t.subsector,c=Math.round(n*2.25),p=Math.round(r*.1),f=Math.round(r*.2),l=ko(),u=We.reduce((g,_)=>g+Number(d?.[_.factionKey]??0),0),m=Math.max(0,l-u),v=Number(d?.corp_cash_reserves??0);if(c>v){alert(`Insufficient cash to acquire subsidiary.

Acquisition cost (2.25× valuation): `+x(c)+`
Available cash: `+x(v));return}if(t.projects>0){alert("Cannot merge — subsidiary has "+t.projects+" active project(s). Complete or abandon them first.");return}if(confirm('MERGE "'+e.name+`" INTO YOUR CORPORATION

Acquisition cost (2.25× valuation): `+x(c)+`
Subsidiary cash absorbed: `+x(a)+`
Net cost: `+x(c-a)+`

• `+i.length+` properties transferred to parent
• Subsidiary subsector "`+s+`" added to portfolio
• Workers hired to max capacity (+`+m.toLocaleString()+`)
• Reputation: +`+p+" or -"+f+" (from sub rep "+r+`)

This cannot be undone.`)){ae=!0;try{const g=d.nation_id;if(i.length>0){const C=i.filter(k=>k.id!==e.id).map(k=>k.id);if(C.length===1){const{error:k}=await y.from("corp_properties").update({nation_id:g,type:"office"}).eq("id",C[0]);if(k)throw k}else if(C.length>1){const{error:k}=await y.from("corp_properties").update({nation_id:g,type:"office"}).in("id",C);if(k)throw k}const{error:q}=await y.from("corp_properties").update({nation_id:g,type:"office",sub_cash:0,subsector:null}).eq("id",e.id);if(q)throw q}const _=v-c+a,h=Number(d?.corp_general_workforce??0)+m,E=Math.random()>=.5?p:-f,z=Number(d?.standing??50),I=Math.max(0,Math.min(100,z+E)),{error:w}=await y.from("factions").update({corp_cash_reserves:_,corp_general_workforce:h,standing:I}).eq("id",d.id);if(w)throw w;d.corp_cash_reserves=_,d.corp_general_workforce=h,d.standing=I,Je(_),await Vt(),alert(`Merger complete!

"`+e.name+`" absorbed into your corporation.
Cost: `+x(c)+" | Cash absorbed: "+x(a)+`
Reputation `+(E>=0?"+":"")+E+" (now "+I+`)
Workers hired: +`+m.toLocaleString()+` general workforce
Properties: `+i.length+" transferred to parent")}catch(g){alert("Merge failed: "+g.message)}finally{ae=!1}}}window.subDissolve=gs;window.subInjectCapital=xs;window.subWithdraw=bs;window.subMerge=_s;window.subSell=ps;window.subPutForSale=fs;window.subPlaceBid=ms;window.subViewBids=us;window.subCancelSale=ys;window.selectSubsidiary=function(o){dt=o,Wt()};let wt=[],Nt={},me=null,Ko=!1,Xe="",Dt="",Ze="",ze="";const Yi={Construction:4,Finance:5,Shipping:4},hs=["Construction","Shipping","Finance"],Qi={Construction:[{id:"civil",name:"Civil Engineering",mod:0},{id:"industrial",name:"Industrial Construction",mod:.25},{id:"mega",name:"Megaprojects",mod:.4}],Shipping:[{id:"bulk_cargo",name:"Bulk Cargo",mod:0},{id:"container_freight",name:"Container Freight",mod:.2},{id:"specialized_transport",name:"Specialized Transport",mod:.35}],Finance:[{id:"banking",name:"Banking",mod:0},{id:"insurance",name:"Insurance",mod:.15},{id:"investment",name:"Investment Management",mod:.3}],Technology:[{id:"software",name:"Software Development",mod:0},{id:"hardware",name:"Hardware Manufacturing",mod:.2},{id:"telecom",name:"Telecommunications",mod:.35}],Energy:[{id:"oil_gas",name:"Oil & Gas",mod:0},{id:"renewables",name:"Renewables",mod:.2},{id:"mining",name:"Mining",mod:.3}],Healthcare:[{id:"pharma",name:"Pharmaceuticals",mod:0},{id:"hospitals",name:"Hospital Systems",mod:.2},{id:"biotech",name:"Biotechnology",mod:.35}]};async function $s(){const{data:o,error:e}=await y.from("nations").select("*").order("name");e&&console.warn("[Subsidiary] Failed to load nations:",e.message),wt=(o||[]).filter(i=>i.id!==d?.nation_id);const{data:t}=await y.from("factions").select("nation_id").eq("faction_type","corporation").is("abandoned_at",null);Nt={};for(const i of t||[])i.nation_id&&(Nt[i.nation_id]=(Nt[i.nation_id]||0)+1);Ze=d?.corp_sector||"",ze=d?.corp_subsector||""}function Ki(){const o=Ze||d?.corp_sector||"";return Qi[o]||[{id:"general",name:o||"General",mod:0}]}function ws(o){Ze=o;const e=Qi[o];ze=e?e[0].name:"",Yt()}function Ji(){const o=d?.corp_sector||"";return Ze===o?1:Yi[Ze]||4}function ks(){const e=Ki().find(t=>t.name===ze);return e?e.mod:0}function yn(o){const e=Number(o.standard_of_living??50);return Math.max(.5,Math.round(e/50*100)/100)}function Xi(o){const t=Ji(),i=1+ks(),n=yn(o);return Math.round(Math.max(1e7,5e7*t*i*n))}function Es(o){const e=Nt[o]||0;return e<=1?{label:"HIGH",color:"#5c5"}:e<=3?{label:"MODERATE",color:"#ca5"}:{label:"LOW",color:"#c55"}}function Cs(o){if(me=me===o?null:o,me){const e=wt.find(t=>t.id===me);Xe=(d?.faction_name||"Subsidiary")+" "+(e?.name||"")}else Xe="";Yt()}function Ss(o){ze=o,Yt()}function Ts(o){Xe=o}function zs(o){Dt=o.toUpperCase().slice(0,4)}async function Is(){if(Ko||!me)return;const o=wt.find(r=>r.id===me);if(!o)return;const e=(Xe||"").trim(),t=(Dt||"").trim();if(!e){alert("Please enter a corporation name for the subsidiary.");return}if(t.length<2){alert("Please enter an abbreviation (2-4 chars).");return}if(V.find(r=>r.nation_id===o.id&&r.type==="regional_hq")){alert("You already have a subsidiary in "+o.name);return}const n=Xi(o),a=Number(d?.corp_cash_reserves??0);if(n>a){alert("Insufficient cash. Entry cost: "+x(n)+", available: "+x(a));return}if(confirm("Establish subsidiary in "+o.name+`?

Name: `+e+" ("+t+`)
Subsector: `+(ze||"General")+`
Entry cost: `+x(n)+`
Creates a Regional HQ (500 capacity)
Unlocks `+o.name+` for operations

Deducted from cash reserves.`)){Ko=!0;try{const s=(await y.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0,c=85+Math.floor(Math.random()*16),p=Math.round(n*.005),{error:f}=await y.from("corp_properties").insert({faction_id:d.id,nation_id:o.id,name:e,type:"regional_hq",style:"Modern",capacity:500,purchase_price:n,monthly_maintenance:p,condition:c,city:o.capital||o.name,purchased_at_tick:s,is_active:!0,subsector:ze||d?.corp_subsector||null});if(f)throw f;const l=Math.max(0,a-n);await y.from("factions").update({corp_cash_reserves:l}).eq("id",d.id),d.corp_cash_reserves=l,Je(l);const u=Ze||d?.corp_sector||"Unknown";try{await y.from("event_log").insert({nation_id:o.id,event_name:"New Subsidiary Established",category:"corporate",description_chosen:`${d.faction_name} has invested ${x(n)} to establish ${e}, a new ${u} corporation in ${o.name}.`,fired_at_tick:T?.current_tick||0})}catch{}try{const{data:m}=await y.from("nations").select("gdp_growth").eq("id",o.id).single();m&&await y.from("nations").update({gdp_growth:Math.min(100,Number(m.gdp_growth||50)+.2)}).eq("id",o.id)}catch{}me=null,Xe="",Dt="",await Vt(),alert('Subsidiary "'+e+'" established in '+o.name+`!

Cost: `+x(n)+`
Regional HQ created with `+c+"% condition.")}catch(r){alert("Failed: "+r.message)}finally{Ko=!1}}}function Yt(){const o=document.getElementById("create-subsidiary-container");if(!o)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=d?.corp_sector||"General",n=d?.corp_subsector||"",a=Ki(),r=a.find(k=>k.name===ze)||a[0],s=new Set(V.filter(k=>k.type==="regional_hq").map(k=>k.nation_id)),c=wt.filter(k=>!s.has(k.id)),p=me?c.find(k=>k.id===me):null,f=Xe.trim().length>0&&Dt.trim().length>=2&&p!==null,l=Ze||i,u=Ji();let m=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Sector</div>
        <div style="display:flex;gap:3px;">
            ${hs.map(k=>{const R=k===l,A=k===i,B=A?1:Yi[k]||4,F=A?t.greenBright:t.orange;return`<div onclick="subSetSector('${k}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${R?t.accent+"18":"transparent"};border:1px solid ${R?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${R?t.accentBright:t.dim}">${k}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${F}">${A?"PARENT · ×1":"×"+B+" COST"}</div>
                </div>`}).join("")}
        </div>
        ${u>1?`<div style="font-family:${e};font-size:7px;color:${t.orange};margin-top:4px;padding:3px 6px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);">Cross-sector subsidiary: base cost ×${u}</div>`:""}
    </div>`,v=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsector</div>
        <div style="display:flex;gap:3px;">
            ${a.map(k=>{const R=k.name===ze,A=k.name===n;return`<div onclick="subSetSubsector('${k.name.replace(/'/g,"\\'")}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${R?t.accent+"18":"transparent"};border:1px solid ${R?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:8px;font-weight:700;color:${R?t.accentBright:t.dim}">${k.name}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${A?t.greenBright:k.mod>0?t.orange:t.dim}">${A?"SAME — ±0%":k.mod>0?"+"+Math.round(k.mod*100)+"%":"±0%"}</div>
                </div>`}).join("")}
        </div>
    </div>`,g="";if(c.length===0)g=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Subsidiaries in all available nations.</div>`;else for(const k of c){const R=k.id===me,A=Es(k.id),B=Nt[k.id]||0,F=Math.round(Number(k.standard_of_living??50)),j=yn(k);g+=`
            <div onclick="subSelectNation('${k.id}')" style="display:flex;align-items:center;padding:4px 8px;margin-bottom:2px;cursor:pointer;background:${R?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${R?t.accent+"44":t.border};border-left:${R?"2px solid "+t.accent:"2px solid transparent"};">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:11px;font-weight:600;color:${R?t.text:t.muted}">${k.name}</span>
                        <span style="font-family:${e};font-size:7px;font-weight:700;padding:0 4px;color:${A.color};background:${A.color}12;border:1px solid ${A.color}25;line-height:12px">${A.label}</span>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:2px;">
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">STD/LIVING: <span style="color:${t.muted}">${F}</span></span>
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">CORPS: <span style="color:${B>=4?t.red:B>=2?t.yellow:t.greenBright}">${B}</span></span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${j>1?t.orange:t.greenBright}">×${j.toFixed(2)}</div>
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
            ${$.map((k,R)=>`<div style="display:flex;align-items:center;gap:6px;padding:2px 0;${R<$.length-1?"border-bottom:1px solid "+t.border:""}">
                <span style="font-family:${e};font-size:9px;color:${k.color};width:12px;text-align:center">${k.icon}</span>
                <span style="font-size:9px;color:${t.muted}">${k.rule}</span>
            </div>`).join("")}
        </div>
    </div>`;const E=5e7,z=r.mod,I=p?yn(p):null,w=p?Xi(p):null,C=Math.round(E*u*(1+z));let q=`
    <div style="background:${t.bg};border:1px solid ${t.border};padding:6px 8px;margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">BASE</span>
            <span style="font-family:${e};font-size:9px;color:${t.muted}">${x(E)}</span>
        </div>
        ${u>1?`<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">SECTOR (${l})</span>
            <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.orange}">×${u}</span>
        </div>`:""}
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">SUBSECTOR (${r.name})</span>
            <span style="font-family:${e};font-size:9px;color:${z===0?t.greenBright:t.orange}">${z===0?"±0%":"+"+Math.round(z*100)+"%"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">NATION (${p?p.name:"select below"})</span>
            <span style="font-family:${e};font-size:9px;color:${p?I>1?t.orange:t.greenBright:t.dim}">${p?"×"+I.toFixed(2):"—"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:3px 0;">
            <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.text}">TOTAL COST</span>
            <span style="font-family:${e};font-size:14px;font-weight:700;color:${t.gold}">${p?x(w):"~"+x(C)}</span>
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
    </div>`}window.subSelectNation=Cs;window.subCreate=Is;window.subSetName=Ts;window.subSetAbbr=zs;window.subSetSector=ws;window.subSetSubsector=Ss;let At=[],Fe=0,yo=JSON.parse(localStorage.getItem("nationhood_investigated_corps")||"{}"),ge="ALL",Be="REPUTATION";async function Ns(){const[o,e]=await Promise.all([y.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, corp_reputation, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name"),y.from("corp_properties").select("id, faction_id, name, nation_id, subsector, type, factions(faction_name, corp_sector, corp_ticker, abbreviation, corp_reputation, corp_company_type, linked_user_id)").eq("type","regional_hq").eq("is_active",!0)]),t={};for(const r of o.data||[])t[r.id]=r;const i=(o.data||[]).map(r=>{const s=(r.corp_company_type||"Private").toUpperCase(),c=Number(r.corp_cash_reserves||0);return{...r,abbr:r.corp_ticker||r.abbreviation||r.faction_name?.slice(0,4).toUpperCase()||"???",status:s,isPlayer:!!r.linked_user_id,reputation:Math.round(Number(r.corp_reputation??50)),revenue:Math.round(c*.1),valuation:Math.round(c*3),_isSub:!1}}),{data:n}=await y.from("nations").select("id, name"),a={};(n||[]).forEach(r=>{a[r.id]=r.name});for(const r of e.data||[]){const s=t[r.faction_id];if(!s)continue;const c=(s.corp_company_type||"Private").toUpperCase();i.push({id:r.id,faction_name:r.name||"Subsidiary",abbreviation:s.abbreviation,corp_sector:s.corp_sector,corp_subsector:r.subsector||s.corp_subsector,corp_ticker:s.corp_ticker,nation_id:r.nation_id,nation:a[r.nation_id]||"?",abbr:(s.corp_ticker||s.abbreviation||"??").slice(0,4),status:c,isPlayer:!!s.linked_user_id,reputation:Math.round(Number(s.corp_reputation??50)),revenue:0,valuation:0,_isSub:!0,_parentName:s.faction_name})}At=i}function As(o){Fe=o,Qt()}function Ms(o){ge=o,Fe=0,Qt()}function Rs(o){Be=o,Fe=0,Qt()}async function qs(o){if(!d||!T)return;const e=Number(d.corp_cash_reserves??0);if(e<5e5){alert("Insufficient cash. Need $500k.");return}const{error:t}=await y.from("factions").update({corp_cash_reserves:e-5e5}).eq("id",d.id);if(t){alert("Failed: "+t.message);return}d.corp_cash_reserves=e-5e5,yo[o]=!0,localStorage.setItem("nationhood_investigated_corps",JSON.stringify(yo));const{data:i}=await y.from("factions").select("corp_cash_reserves, corp_loans, corp_reputation, corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce").eq("id",o).single();if(i){const n=At.find(a=>a.id===o);if(n){Object.assign(n,i);const a=Number(i.corp_cash_reserves||0);n.reputation=Math.round(Number(i.corp_reputation??50)),n.revenue=Math.round(a*.1),n.valuation=Math.round(a*3)}}Qt()}function Qt(){const o=document.getElementById("corporations-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i={PUBLIC:{color:t.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:t.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:t.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},n=[...new Set(At.map(m=>m.nation).filter(Boolean))];let a=[...At];ge!=="ALL"&&(a=a.filter(m=>m.nation===ge)),Be==="REPUTATION"?a.sort((m,v)=>(v.reputation||0)-(m.reputation||0)):Be==="REVENUE"?a.sort((m,v)=>(v.revenue||0)-(m.revenue||0)):Be==="VALUATION"&&a.sort((m,v)=>(v.valuation||0)-(m.valuation||0)),Fe>=a.length&&(Fe=0);const r=a[Fe]||null;T?.current_tick;const s=r&&!!yo[r.id],c=r&&r.status==="PRIVATE"&&!s,p=r&&r.status==="STATE";let f="";a.length===0&&(f=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No corporations found.</div>`);for(let m=0;m<a.length;m++){const v=a[m],g=m===Fe,_=i[v.status]||i.PRIVATE,$=v.status==="PRIVATE"&&!yo[v.id];f+=`
        <div onclick="corpSelect(${m})" style="display:flex;align-items:center;padding:7px 16px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${g?t.accent:"transparent"};background:${g?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:42px;font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${v.abbr}</span>
            <div style="flex:1.3;">
                <div style="font-size:11px;font-weight:600;color:${t.text};line-height:1.2">${v.faction_name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${v._isSub?'<span style="color:#8a6aaa;">SUB</span> · ':""}${v.corp_subsector||v.corp_sector||"—"}</div>
            </div>
            <span style="width:62px"><span style="font-family:${e};font-size:8px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(v.nation||"—").toUpperCase().slice(0,6)}</span></span>
            <span style="width:56px;font-family:${e};font-size:9px;font-weight:700;color:${$?t.dim:t.muted};text-align:right">${$?"—":x(v.revenue)}</span>
            <span style="width:34px;font-family:${e};font-size:10px;font-weight:700;color:${v.reputation>=70?t.greenBright:v.reputation>=40?t.accent:t.yellow};text-align:right">${v.reputation}</span>
            <span style="width:56px;font-family:${e};font-size:9px;color:${$?t.dim:t.muted};text-align:right">${$?"—":x(v.valuation)}</span>
            <span style="width:48px;text-align:center"><span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${_.color};background:${_.bg};border:1px solid ${_.border}">${v.status}</span></span>
        </div>`}let l="";if(r){const m=i[r.status]||i.PRIVATE,v=[...r._isSub?[{label:"Parent",value:r._parentName||"—",color:"#8a6aaa"}]:[],{label:"Sector",value:r.corp_sector||"—",color:t.text},{label:"Subsector",value:r.corp_subsector||"—",color:t.accent},{label:"Reputation",value:r.reputation+"/100",color:r.reputation>=70?t.greenBright:r.reputation>=40?t.accent:t.yellow},{label:"Revenue",value:c?"UNDISCLOSED":x(r.revenue),color:c?t.dim:t.greenBright},{label:"Cash Reserves",value:c?"UNDISCLOSED":x(r.corp_cash_reserves||0),color:c?t.dim:t.text},{label:"Market Valuation",value:c?"UNDISCLOSED":x(r.valuation),color:c?t.dim:t.gold}];l=`
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
        ${v.map(g=>`<div style="display:flex;justify-content:space-between;padding:5px 16px;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:10px;color:${t.dim};text-transform:uppercase">${g.label}</span>
            <span style="font-family:${e};font-size:11px;font-weight:700;color:${g.value==="UNDISCLOSED"?t.dim:g.color};${g.value==="UNDISCLOSED"?"font-style:italic;":""}">${g.value}</span>
        </div>`).join("")}
        <div style="padding:6px 14px;border-bottom:1px solid ${t.border};flex-shrink:0;">
            <div style="width:100%;height:4px;background:${t.border}"><div style="width:${r.reputation}%;height:100%;background:${r.reputation>=70?t.greenBright:r.reputation>=40?t.accent:t.yellow}"></div></div>
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
                <div onclick="${c?`corpInvestigate('${r.id}')`:""}" style="flex:1;padding:5px 0;text-align:center;cursor:${c?"pointer":"default"};font-family:${e};font-size:8px;font-weight:700;color:${c?t.blue:s?t.greenBright:t.dim};border:1px solid ${c?t.blue+"44":s?t.greenBright+"44":t.border};opacity:${c?1:.3}">${s?"INVESTIGATED ✓":"INVESTIGATE — $500k"}</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;color:${t.accent};border:1px solid ${t.accent}44">PARTNER</div>
            </div>
            <div style="display:flex;gap:4px;">
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${p?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${p?t.dim:t.gold};border:1px solid ${p?t.border:t.gold+"44"};opacity:${p?.3:1}">ACQUIRE</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${p?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${p?t.dim:t.orange};border:1px solid ${p?t.border:t.orange+"44"};opacity:${p?.3:1}">MERGER</div>
            </div>
            ${p?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${t.dim}">State-owned corps cannot be acquired or merged.</div>`:""}
        </div>`}else l=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a corporation to view details.</div>`;const u=`
    <div style="padding:6px 16px;border-bottom:1px solid ${t.border};background:${t.card};display:flex;gap:12px;align-items:center;flex-shrink:0;">
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px;width:40px">NATION</span>
            <span onclick="corpFilterNation('ALL')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${ge==="ALL"?"#000":t.dim};background:${ge==="ALL"?t.accent:"transparent"};border:1px solid ${ge==="ALL"?t.accent:t.border}">ALL</span>
            ${n.map(m=>`<span onclick="corpFilterNation('${m}')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${ge===m?"#000":t.dim};background:${ge===m?t.accent:"transparent"};border:1px solid ${ge===m?t.accent:t.border}">${m}</span>`).join("")}
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
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${At.length} IN DATABASE</span>
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
                ${l}
            </div>
        </div>
    </div>`}window.corpSelect=As;window.corpInvestigate=qs;window.corpFilterNation=Ms;window.corpSort=Rs;let be=null,Se={},Q=120,Te=15,gn={},ct=[];async function Ls(){if(!Ve)return;if(bt[Ve.id]){alert("You already have a bid on this contract. Retract it first if you want to re-bid.");return}be=Ve,gn={};try{const{data:t}=await y.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",d.id);for(const i of t||[])gn[ao(i.material_key)]=Number(i.quantity||0)}catch{}ct=[];try{const{data:t}=await y.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",be.id).in("status",["pending","won"]);ct=(t||[]).filter(i=>i.faction_id!==d?.id).map(i=>({name:i.factions?.faction_name||"Unknown",ticker:i.factions?.corp_ticker||"???",price:Number(i.bid_price||0),quality:Number(i.estimated_quality||0),status:i.status}))}catch{}Se={};const o=be.required_materials||{};for(const t of Object.keys(o))Se[t]="STD";const e=be.required_workforce||{};Q=Number(e.general||0)+Number(e.skilled||0)||120,Te=15,Ht(),Ao()}function Pn(){document.getElementById("bid-assembly-overlay")?.remove(),be=null}function Bs(o,e){Se[o]=e,Ao()}function Os(o){Q=o,Ao()}function Ps(o){Te=o,Ao()}function Ao(){if(document.getElementById("bid-assembly-overlay")?.remove(),!be)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=be,i=t.issuer_type==="GOVERNMENT",n=S?.name||d?.nation||"—",a=Number(t.budget_ceiling||0),r=Number(t.timeline_ticks||8),s=t.required_materials||{},c=Object.keys(s),p={LOW:.5,STD:1,HIGH:2},f={LOW:e.orange,STD:e.yellow,HIGH:e.greenBright},l={LOW:"Low",STD:"Standard",HIGH:"High"},u={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},m=gn||{};let v=0,g="";for(const P of c){const Y=Number(s[P]||0),Hn=Se[P]||"STD",Gn=u[P]||3e5,sa=p[Hn],la=Math.round(Gn*sa),Vn=Y*la;v+=Vn;const da=P.replace(/_/g," ").replace(/\b\w/g,Me=>Me.toUpperCase()),Wn=Number(m[P]||0),Lo=Math.max(0,Y-Wn),ca=Lo===0?e.greenBright:Lo<Y?e.yellow:e.red,pa=Lo===0?"✓ IN STOCK":`${Wn}/${Y}`;g+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${e.text}">${da}</span>
                <div style="font-family:${o};font-size:7px;color:${ca};margin-top:1px">${pa}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${o};font-size:9px;color:${e.muted}">${Y.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(Me=>{const Bo=Hn===Me,Yn=f[Me],fa=x(Math.round(Gn*p[Me]));return`<span onclick="bidSetGrade('${P}','${Me}')" style="padding:2px 6px;font-family:${o};font-size:7px;font-weight:700;cursor:pointer;color:${Bo?"#000":e.dim};background:${Bo?Yn:"transparent"};border:1px solid ${Bo?Yn:e.border}" title="${fa}/unit">${l[Me]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${o};font-size:10px;color:${e.text}">${x(Vn)}</span></div>
        </div>`}const _=t.required_workforce||{},$=Number(_.general||0)+Number(_.skilled||0)||100,h=Math.max(40,Math.round($*.5)),E=$*2,z=[h,Math.round($*.75),$,Math.round($*1.5),E],I=Math.max(0,Math.min(1,(Q-h)/(E-h||1))),w=r,C=Math.round(4.5-I*8),q=Math.max(Math.round(w*.6),w+C),k=C>0?`+${C}mo`:C<0?`${C}mo`:"On schedule",R=C>0?e.red:C<0?e.greenBright:e.yellow,A=15200,B=Q*A*q,F=a,X=[{name:"Municipal Zoning Approval",cost:18e4,ticks:2,required:!0},{name:"Structural Engineering Cert.",cost:24e4,ticks:3,required:!0},{name:"Environmental Impact Assessment",cost:34e4,ticks:8,required:F>2e7},{name:"Seismic Resilience Compliance",cost:21e4,ticks:4,required:F>5e7},{name:"Heritage Conservation Review",cost:16e4,ticks:6,required:!1},{name:"Fire Safety Certification",cost:12e4,ticks:2,required:F>1e7}].filter(P=>P.required),N=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),O=X.filter(P=>!N.has(P.name)).reduce((P,Y)=>P+Y.cost,0),U=4e5,W=v+B+O+U,re=Math.round(W*(Te/100)),ye=W+re,H=ye>a,Ro=re,Ne=H?0:Math.max(0,Math.min(100,Math.round(100-ye/a*100+30))),Un=Ne>70?e.greenBright:Ne>40?e.yellow:Ne>0?e.orange:e.red,aa=H?"OVER CEILING":Ne>70?"STRONG":Ne>40?"COMPETITIVE":Ne>20?"WEAK":"UNLIKELY",qo=Object.values(Se),Ae=qo.length>0?Math.round(qo.reduce((P,Y)=>P+(Y==="HIGH"?85:Y==="STD"?65:45),0)/qo.length):50,Kt=Ae>=75?e.greenBright:Ae>=55?e.yellow:e.orange,ra=Ae>=75?"STRONG":Ae>=55?"PROMISING":"UNCERTAIN",tt=document.createElement("div");tt.id="bid-assembly-overlay",tt.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",tt.addEventListener("click",P=>{P.target===tt&&Pn()}),tt.innerHTML=`
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
                ${g}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${o};font-size:9px;color:${e.muted}">MATERIALS TOTAL</span>
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${x(v)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Labor</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim};width:60px">WORKERS</span>
                        <div style="display:flex;gap:3px;">
                            ${z.map(P=>`<span onclick="bidSetWorkers(${P})" style="padding:2px 8px;font-family:${o};font-size:8px;font-weight:700;cursor:pointer;color:${Q===P?"#000":e.dim};background:${Q===P?e.accent:"transparent"};border:1px solid ${Q===P?e.accent:e.border}">${P}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">${Q} × $${A.toLocaleString()}/tick × ${q} ticks</span>
                        <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${x(B)}</span>
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
                        <span style="font-family:${o};font-size:10px;font-weight:700;color:${R}">${q}mo <span style="font-size:8px;opacity:0.7">(${k})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${X.map(P=>{const Y=N.has(P.name);return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
                        <div style="flex:1;display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${o};font-size:8px;font-weight:700;color:${Y?e.greenBright:e.orange}">${Y?"✓":"○"}</span>
                            <span style="font-size:10px;color:${Y?e.muted:e.text}">${P.name}</span>
                        </div>
                        ${Y?`<span style="font-family:${o};font-size:8px;color:${e.greenBright}">HELD</span>`:`<div style="text-align:right">
                                <span style="font-family:${o};font-size:9px;color:${e.redDim}">${x(P.cost)}</span>
                                <span style="font-family:${o};font-size:7px;color:${e.dim};margin-left:4px">${P.ticks}t</span>
                            </div>`}
                    </div>`}).join("")}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${o};font-size:9px;color:${e.muted}">PERMIT COSTS</span>
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${x(O)}</span>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${o};font-size:9px;color:${e.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${x(U)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v},{l:"Labor",v:B},{l:"Permits",v:O},{l:"Overhead",v:U}].map(P=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-size:10px;color:${e.muted}">${P.l}</span>
                    <span style="font-family:${o};font-size:10px;color:${e.redDim}">${x(P.v)}</span>
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
                        <span style="font-family:${o};font-size:11px;font-weight:700;color:${Un}">${aa}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${Ne}%;height:100%;background:${Un}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${o};font-size:11px;font-weight:700;color:${Kt}">${Ae}</span>
                            <span style="font-family:${o};font-size:8px;color:${e.dim}">/100</span>
                            <span style="font-family:${o};font-size:8px;font-weight:700;color:${Kt}">${ra}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${Ae}%;height:100%;background:${Kt}"></div></div>
                    <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="font-family:${o};font-size:8px;color:${e.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${ct.length===0?`<div style="font-family:${o};font-size:8px;color:${e.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${ct.map(P=>`<span style="padding:2px 6px;font-family:${o};font-size:7px;color:${e.muted};background:${e.card};border:1px solid ${e.border};">${P.name} <span style="color:${e.dim}">Q:${P.quality}</span></span>`).join("")}
                        </div>
                        <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:3px">${ct.length} competing bid${ct.length!==1?"s":""}. Bid prices are sealed until resolution.</div>`}
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
    </div>`,document.body.appendChild(tt)}let Jo=!1;async function Ds(){if(Jo||!be)return;const o=be,e=o.required_materials||{},t=Object.keys(e),i=Number(o.budget_ceiling||0),n=Number(o.timeline_ticks||8),a={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},r={LOW:.5,STD:1,HIGH:2};let s=0;for(const A of t){const B=Number(e[A]||0),F=Se[A]||"STD",j=a[A]||3e5;s+=B*Math.round(j*r[F])}const c=15200,p=o.required_workforce||{},f=Number(p.general||0)+Number(p.skilled||0)||100,l=Math.max(40,Math.round(f*.5)),u=f*2,m=Math.max(0,Math.min(1,(Q-l)/(u-l||1))),v=Math.round(4.5-m*8),g=Math.max(Math.round(n*.6),n+v),_=Q*c*g,$=i,h=[{name:"Municipal Zoning Approval",cost:18e4,required:!0},{name:"Structural Engineering Cert.",cost:24e4,required:!0},{name:"Environmental Impact Assessment",cost:34e4,required:$>2e7},{name:"Seismic Resilience Compliance",cost:21e4,required:$>5e7},{name:"Fire Safety Certification",cost:12e4,required:$>1e7}],E=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),z=h.filter(A=>A.required&&!E.has(A.name)).reduce((A,B)=>A+B.cost,0),w=s+_+z+4e5,C=Math.round(w*(Te/100)),q=w+C;if(q>i){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const k=Object.values(Se),R=k.length>0?Math.round(k.reduce((A,B)=>A+(B==="HIGH"?85:B==="STD"?65:45),0)/k.length):50;if(confirm('Submit bid for "'+o.name+`"?

Bid Price: `+x(q)+`
Est. Cost: `+x(w)+`
Markup: `+Te+"% ("+x(C)+`)
Quality: `+R+`/100
Workers: `+Q+`

Once submitted, your bid cannot be changed.`)){Jo=!0;try{const{data:A}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),B=A?.current_tick||0,F={};for(const X of t)F[X]=Se[X]||"STD";const{error:j}=await y.from("contract_bids").insert({contract_id:o.id,faction_id:d.id,bid_price:q,material_grades:F,labor_count:Q,markup_pct:Te,estimated_cost:w,estimated_quality:R,status:"pending",submitted_at_tick:B});if(j)throw j;o.status==="open"&&await y.from("construction_contracts").update({status:"bidding"}).eq("id",o.id).eq("status","open"),Pn(),alert(`Bid submitted successfully!

Contract: `+o.name+`
Your Bid: `+x(q)+`
Quality: `+R+`/100

Bids will be resolved when the bidding window closes (`+(o.bidding_ends_tick?"tick "+o.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof Ke=="function"&&await Ke()}catch(A){alert("Bid submission failed: "+A.message)}finally{Jo=!1}}}window.openBidAssembly=Ls;window.closeBidAssembly=Pn;window.bidSetGrade=Bs;window.bidSetWorkers=Os;window.bidSetMarkup=Ps;window.submitBidAssembly=Ds;let Xo=!1;async function js(o){if(Xo)return;const e=1e6,t=Number(d?.corp_cash_reserves??0);if(t<e){alert("Cannot retract — you need at least $1M in cash reserves to cover the retraction penalty.");return}if(confirm(`Retract your bid?

This will cost $1M as a retraction penalty.
This action cannot be undone.`)){Xo=!0;try{const i=t-e,{error:n}=await y.from("factions").update({corp_cash_reserves:i}).eq("id",d.id);if(n)throw n;const{error:a}=await y.from("contract_bids").delete().eq("contract_id",o).eq("faction_id",d.id);if(a)throw a;d.corp_cash_reserves=i,typeof Je=="function"&&Je(i),alert("Bid retracted. $1M penalty applied."),Ht(),await Ke()}catch(i){alert("Failed to retract bid: "+(i.message||"Unknown error"))}finally{Xo=!1}}}window.retractBid=js;let jt=[],Ue=0,ue=null,Zo=!1,en=!1,tn=!1;async function Fs(){if(!Ve||en)return;en=!0,ue=Ve,Ue=0;const{data:o,error:e}=await y.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",ue.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(en=!1,e){alert("Failed to load bids: "+e.message);return}jt=(o||[]).map(t=>({...t,corp:t.factions?.faction_name||"Unknown",abbr:t.factions?.corp_ticker||"???",subsector:t.factions?.corp_subsector||"—"})),Ht(),Zi()}function Mo(){document.getElementById("bid-review-overlay")?.remove(),ue=null}function Us(o){Ue=o,Zi()}async function Hs(){if(Zo||jt.length===0)return;const o=jt[Ue];if(!(!o?.id||!o.faction_id)&&confirm("Accept bid from "+o.corp+`?

Bid Price: `+x(o.bid_price)+`
Quality: `+o.estimated_quality+`/100
Workers: `+o.labor_count+`

This will award the contract. The project begins immediately.`)){Zo=!0;try{const{data:e}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{error:i}=await y.from("contract_bids").update({status:"won"}).eq("id",o.id);if(i)throw i;const{error:n}=await y.from("contract_bids").update({status:"lost"}).eq("contract_id",ue.id).neq("id",o.id);if(n)throw n;const{error:a}=await y.from("construction_contracts").update({status:"awarded",awarded_to_faction:o.faction_id,awarded_at_tick:t}).eq("id",ue.id);if(a)throw a;Mo(),alert("Contract awarded to "+o.corp+`!

Bid: `+x(o.bid_price)+`
Project begins immediately.`),typeof Ke=="function"&&await Ke()}catch(e){alert("Failed to accept bid: "+(e.message||e))}finally{Zo=!1}}}async function Gs(){if(!(!ue||tn)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){tn=!0;try{const{error:o}=await y.from("contract_bids").update({status:"lost"}).eq("contract_id",ue.id);if(o)throw o;const{error:e}=await y.from("construction_contracts").update({status:"expired"}).eq("id",ue.id);if(e)throw e;Mo(),alert("All bids declined. Contract cancelled."),typeof Ke=="function"&&await Ke()}catch(o){alert("Failed: "+(o.message||o))}finally{tn=!1}}}function Zi(){if(document.getElementById("bid-review-overlay")?.remove(),!ue||jt.length===0)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=ue,i=jt;Ue>=i.length&&(Ue=0);const n=i[Ue],a=Number(t.budget_ceiling||0),r=Number(t.timeline_ticks||36),s=Math.min(...i.map(m=>m.bid_price)),c=Math.max(...i.map(m=>m.estimated_quality||0));let p="";for(let m=0;m<i.length;m++){const v=i[m],g=m===Ue,_=v.bid_price===s,$=(v.estimated_quality||0)===c,h=v.bid_price>a;p+=`
        <div onclick="reviewSelectBid(${m})" style="padding:10px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${g?e.accent:"transparent"};background:${g?"rgba(139,154,107,0.03)":"transparent"};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-family:${o};font-size:10px;font-weight:700;color:${e.gold}">${v.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${e.text}">${v.corp}</span>
                ${_?`<span style="font-family:${o};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.greenBright};background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2)">CHEAPEST</span>`:""}
                ${$?`<span style="font-family:${o};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.2)">BEST QUALITY</span>`:""}
            </div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};">
                <div style="flex:1.2;padding:5px 10px;border-right:1px solid ${e.border}">
                    <div style="font-family:${o};font-size:7px;color:${e.dim}">BID PRICE</div>
                    <div style="font-family:${o};font-size:14px;font-weight:700;color:${h?e.red:e.text}">${x(v.bid_price)}</div>
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
        </div>`}const f=n.bid_price>a,l=a>0?Math.round(n.bid_price/a*100):0,u=document.createElement("div");u.id="bid-review-overlay",u.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",u.addEventListener("click",m=>{m.target===u&&Mo()}),u.innerHTML=`
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
                <span>Timeline: <span style="color:${e.text};font-weight:700">${r}mo</span></span>
            </div>
        </div>
        <div style="padding:6px 16px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.gold}">${i.length} BID${i.length!==1?"S":""} RECEIVED</span>
            <div style="display:flex;gap:8px;font-family:${o};font-size:8px;color:${e.dim};">
                <span>Cheapest: <span style="color:${e.greenBright}">${x(s)}</span></span>
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
    </div>`,document.body.appendChild(u)}const _t={Coastal:{color:"#8b9a6b",label:"COASTAL"},Container:{color:"#5a7aaa",label:"CONTAINER"},Bulk:{color:"#c8a832",label:"BULK"},Tanker:{color:"#c86a4a",label:"TANKER"},Reefer:{color:"#6a9a5a",label:"REEFER"},LNG:{color:"#c55",label:"LNG"}},Vs={in_port:{color:"#8b9a6b",label:"IN PORT"},in_transit:{color:"#5a8aaa",label:"IN TRANSIT"},dry_dock:{color:"#c84",label:"DRY DOCK"},anchored:{color:"#ca5",label:"ANCHORED"},for_sale:{color:"#9e9a92",label:"FOR SALE"}};function ea(o){return o>=75?"#5c5":o>=50?"#ca5":o>=25?"#c84":"#c55"}function Ws(o){return o>=60?"#5c5":o>=30?"#ca5":o>=15?"#c84":"#c55"}async function ve(){if(!d)return;const{data:o,error:e}=await y.from("corp_vessels").select("*").eq("faction_id",d.id).order("vessel_class");e&&console.warn("Failed to load fleet:",e.message),_e=o||[],Ot=null,St={},ro={};try{const t=_e.map(i=>i.id);if(t.length>0){const{data:i}=await y.from("finance_active_loans").select("insured_vessel_id").in("insured_vessel_id",t).in("status",["current"]);for(const a of i||[])a.insured_vessel_id&&(St[a.insured_vessel_id]=!0);const{data:n}=await y.from("finance_loan_requests").select("insured_vessel_id").eq("requesting_faction_id",d.id).eq("request_type","insurance").eq("status","open").not("insured_vessel_id","is",null);for(const a of n||[])a.insured_vessel_id&&!St[a.insured_vessel_id]&&(ro[a.insured_vessel_id]=!0)}}catch(t){console.warn("Failed to load vessel insurance status:",t.message)}ta()}function Ys(o){Ot=Ot===o?null:o,ta()}function ta(){const o=document.getElementById("fl-count"),e=document.getElementById("fl-summary"),t=document.getElementById("fl-list"),i=document.getElementById("fl-footer");if(!o||!t)return;const n=_e;o.textContent=n.length+" VESSEL"+(n.length!==1?"S":"");const a=n.filter(l=>l.status==="in_transit").length,r=n.filter(l=>l.status==="in_port"||l.status==="anchored").length,s=n.filter(l=>l.status==="dry_dock").length,c=n.reduce((l,u)=>l+(u.base_maintenance||0),0);e.innerHTML=[{label:"TRANSIT",value:a,color:"#5a8aaa"},{label:"IN PORT",value:r,color:"#8b9a6b"},{label:"DRY DOCK",value:s,color:"#c84"},{label:"MAINT/TICK",value:x(c),color:"#a44"}].map((l,u)=>`<div style="flex:1;padding:5px 8px;text-align:center;${u<3?"border-right:1px solid var(--border-0);":""}">
        <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">${l.label}</div>
        <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${l.color};margin-top:1px;">${l.value}</div>
    </div>`).join(""),n.length===0?t.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels in fleet.<br>Purchase ships to begin operations.</div>':t.innerHTML=n.map((l,u)=>{const m=Ot===u,v=_t[l.vessel_class]||{color:"#666",label:"?"},g=Vs[l.status]||{color:"#666",label:"?"},_=ea(l.condition),$=Ws(l.fuel),h=l.condition<50||l.fuel<20,E=l.status==="in_transit",z=l.status==="dry_dock",I=T?.current_tick||0,w=Math.max(0,Math.floor((I-(l.built_at_tick||0))/12));let C=`<div onclick="flSelectVessel(${u})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${h?l.condition<50?_:$:"transparent"};background:${m?v.color+"06":"transparent"};">
                <div style="padding:7px 14px;">`;C+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(l.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${v.color};background:${v.color}12;border:1px solid ${v.color}25;">${v.label}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${g.color};background:${g.color}12;border:1px solid ${g.color}25;">${g.label}</span>
            </div>`;const q=l.current_port_nation_id?"In port":E?"At sea":"—";if(C+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:5px;">${b(q)}</div>`,C+=`<div style="display:flex;gap:8px;margin-bottom:4px;">
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
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${w}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#a44;margin-top:1px;">${x(l.base_maintenance)}</div>
                </div>
            </div>`,z&&l.drydock_until_tick){const k=Math.max(0,l.drydock_until_tick-I);C+=`<div style="margin-top:4px;padding:3px 8px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">DRY DOCK REPAIRS</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c84;">${k} tick${k!==1?"s":""} remaining</span>
                </div>`}if(m){C+=`<div style="margin-top:6px;">
                    <div style="padding:5px 8px;background:var(--bg-0);border:1px solid var(--border-0);margin-bottom:6px;">`;const k=[{label:"VESSEL CLASS",value:l.vessel_class},{label:"BUILT",value:"Tick "+(l.built_at_tick||0)},{label:"FUEL CAPACITY",value:(l.fuel_capacity||0).toLocaleString()+" tons"},{label:"LAST REFURBISH",value:l.last_refurbish_tick?"Tick "+l.last_refurbish_tick:"N/A"}];for(let j=0;j<k.length;j++)C+=`<div style="display:flex;justify-content:space-between;padding:2px 0;${j<3?"border-bottom:1px solid var(--border-0);":""}">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${k[j].label}</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);">${k[j].value}</span>
                    </div>`;C+="</div>";const R=E||z,A=Math.round((l.purchase_price||3e6)*.08*(1+(100-l.condition)/100)),B=Math.round((l.fuel_capacity||1e3)*50*(1-l.fuel/100)),F=Math.round((l.purchase_price||3e6)*(l.condition/100)*.6);if(C+=`<div style="display:flex;gap:4px;">
                    <div onclick="${R?"":"flRefurbish('"+l.id+"',"+A+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${R?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${R?"var(--text-dim)":"#5c5"};border:1px solid ${R?"var(--border-0)":"#2a5a3a"};background:${R?"transparent":"rgba(74,170,136,0.06)"};opacity:${R?.35:1};">REFURBISH<br><span style="font-weight:400;font-size:6px;">${x(A)}</span></div>
                    <div onclick="${E?"":"flRefuel('"+l.id+"',"+B+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${E?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${E?"var(--text-dim)":"#c86a4a"};border:1px solid ${E?"var(--border-0)":"rgba(200,106,74,0.3)"};opacity:${E?.35:1};">REFUEL<br><span style="font-weight:400;font-size:6px;">from ${x(B)}</span></div>
                    <div onclick="${R?"":"flSell('"+l.id+"','"+b(l.vessel_name).replace(/'/g,"")+"',"+F+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${R?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${R?"var(--text-dim)":"#c84"};border:1px solid ${R?"var(--border-0)":"rgba(204,136,68,0.3)"};opacity:${R?.35:1};">LIST<br><span style="font-weight:400;font-size:6px;">${x(F)}</span></div>
                </div>`,!E){const j=St&&St[l.id],X=ro&&ro[l.id];C+='<div style="display:flex;gap:4px;margin-top:4px;">',j?C+=`<div style="flex:1;display:flex;gap:2px;">
                            <div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#5c5;border:1px solid rgba(92,204,92,0.2);background:rgba(92,204,92,0.04);">INSURED ✓</div>
                            <div onclick="event.stopPropagation();flFileClaim('${l.id}','${b(l.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#c55;border:1px solid rgba(204,85,85,0.2);background:rgba(204,85,85,0.04);">FILE CLAIM</div>
                        </div>`:X?C+='<div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#ca5;border:1px solid rgba(202,165,50,0.2);background:rgba(202,165,50,0.04);">PENDING ⏳</div>':C+=`<div onclick="event.stopPropagation();flRequestInsurance('${l.id}','${b(l.vessel_name).replace(/'/g,"")}',${l.purchase_price||0})" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#aa7a5a;border:1px solid rgba(170,122,90,0.3);background:rgba(170,122,90,0.04);">INSURE</div>`,C+=`<div onclick="flRename('${l.id}','${b(l.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:var(--text-muted);border:1px solid var(--border-0);">RENAME</div>`,C+="</div>"}E&&(C+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel at sea — actions available on arrival</div>'),z&&(C+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel in dry dock — repairs in progress</div>'),C+="</div>"}return C+="</div></div>",C}).join("");const p={};for(const l of n)p[l.vessel_class]=(p[l.vessel_class]||0)+1;let f='<div style="display:flex;gap:6px;">';for(const[l,u]of Object.entries(_t))p[l]&&(f+=`<div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:${u.color};border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">${u.label}</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${p[l]}</span>
        </div>`);f+="</div>",f+=`<span style="font-family:var(--font-mono);font-size:8px;color:#a44;">${x(c)}/tick</span>`,i.innerHTML=f}let oe=!1;async function Qs(o,e){if(oe||!d)return;const t=(_e||[]).find(m=>m.id===o);if(!t)return;const i=t.current_port_nation_id||null;let n="state",a=3,r=3,s=null,c="State Dry Dock (3x cost, 3 ticks)";if(i){const{data:m}=await y.from("corp_properties").select("id").eq("faction_id",d.id).eq("nation_id",i).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();if(m)n="own",a=1,r=2,c="Your Dry Dock (base cost, 2 ticks)";else{const{data:v}=await y.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",d.id).eq("nation_id",i).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();v&&(n="other",a=1.2,r=2,s=v.faction_id,c=(v.factions?.faction_name||"Another corp")+"'s Dry Dock (+20%, 2 ticks)")}}else c="State Dry Dock (3x cost, 3 ticks) — no private dock in port";const p=Math.round(e*a),{data:f}=await y.from("factions").select("corp_cash_reserves").eq("id",d.id).single(),l=Number(f?.corp_cash_reserves??0);if(l<p){alert("Insufficient cash. Need "+x(p)+", have "+x(l)+".");return}if(!confirm("Send "+(t.vessel_name||"vessel")+` to dry dock?

Dock: `+c+`
Cost: `+x(p)+`
Duration: `+r+` ticks
Condition restored to 85-100%.`))return;oe=!0;const u=T?.current_tick||0;try{const{error:m}=await y.from("factions").update({corp_cash_reserves:l-p}).eq("id",d.id);if(m){alert("Failed: "+m.message);return}if(n==="other"&&s){const g=p-e,{data:_}=await y.from("factions").select("corp_cash_reserves").eq("id",s).single();_&&await y.from("factions").update({corp_cash_reserves:Number(_.corp_cash_reserves||0)+g}).eq("id",s)}const{error:v}=await y.from("corp_vessels").update({status:"dry_dock",drydock_until_tick:u+r,active_claim_id:null}).eq("id",o);if(v){await y.from("factions").update({corp_cash_reserves:l}).eq("id",d.id),alert("Failed: "+v.message);return}d.corp_cash_reserves=l-p,await ve()}catch(m){alert("Dry dock failed: "+(m.message||"Error"))}finally{oe=!1}}async function Ks(o,e){if(oe||!d)return;if(e<=0){alert("Fuel tanks are already full.");return}const t=(_e||[]).find(l=>l.id===o);if(!t)return;const i=t.current_port_nation_id||d.nation_id;let n="state",a=3,r=null,s="State Fuel (3x cost) — no private depot in port";if(i){const{data:l}=await y.from("corp_properties").select("id").eq("faction_id",d.id).eq("nation_id",i).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(l)n="own",a=1,s="Your Fuel Depot (base cost)";else{const{data:u}=await y.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",d.id).eq("nation_id",i).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();u&&(n="other",a=1.15,r=u.faction_id,s=(u.factions?.faction_name||"Another corp")+"'s Fuel Depot (+15%)")}}const c=Math.round(e*a),{data:p}=await y.from("factions").select("corp_cash_reserves").eq("id",d.id).single(),f=Number(p?.corp_cash_reserves??0);if(f<c){alert("Insufficient cash. Need "+x(c)+", have "+x(f)+".");return}if(confirm("Refuel "+(t.vessel_name||"vessel")+`?

Source: `+s+`
Cost: `+x(c)+`
Fuel restored to 100%.`)){oe=!0;try{const{error:l}=await y.from("factions").update({corp_cash_reserves:f-c}).eq("id",d.id);if(l){alert("Failed: "+l.message);return}if(n==="other"&&r){const m=c-e,{data:v}=await y.from("factions").select("corp_cash_reserves").eq("id",r).single();v&&await y.from("factions").update({corp_cash_reserves:Number(v.corp_cash_reserves||0)+m}).eq("id",r)}const{error:u}=await y.from("corp_vessels").update({fuel:100}).eq("id",o);if(u){await y.from("factions").update({corp_cash_reserves:f}).eq("id",d.id),alert("Failed: "+u.message);return}d.corp_cash_reserves=f-c,await ve()}catch(l){alert("Refuel failed: "+(l.message||"Error"))}finally{oe=!1}}}async function Js(o,e,t){if(oe||!d||!T||!confirm("List "+e+" on the Ship Market for "+x(t)+`?

The vessel will be removed from your fleet and listed for sale. You will receive payment when another corporation purchases it.`))return;oe=!0;const i=T.current_tick||0,n=_e.find(c=>c.id===o);if(!n){oe=!1;return}const a=Math.max(0,i-(n.built_at_tick||0)),{error:r}=await y.from("ship_market_listings").insert({nation_id:d.nation_id,vessel_name:n.vessel_name,vessel_class:n.vessel_class,capacity_dwt:n.capacity_dwt,capacity_unit:n.capacity_unit,condition:n.condition,fuel:n.fuel,age_ticks:a,fuel_capacity:n.fuel_capacity,base_maintenance:n.base_maintenance,asking_price:t,purchase_price_new:n.purchase_price||t,seller_type:"CORP",seller_name:d.faction_name,seller_faction_id:d.id,sale_reason:"Listed for sale by "+(d.faction_name||"corporation"),status:"available",listed_at_tick:i});if(r){alert("Failed to create listing: "+r.message),oe=!1;return}const{error:s}=await y.from("corp_vessels").delete().eq("id",o);if(s){await y.from("ship_market_listings").delete().eq("seller_faction_id",d.id).eq("vessel_name",n.vessel_name).eq("listed_at_tick",i),alert("Failed to remove vessel: "+s.message),oe=!1;return}oe=!1,Ot=null,await Promise.all([ve(),jn()])}async function Xs(o,e){const t=prompt("Rename vessel:",e);if(!t||t.trim()===e||t.trim().length<2)return;const{error:i}=await y.from("corp_vessels").update({vessel_name:t.trim().slice(0,40)}).eq("id",o);if(i){alert("Failed: "+i.message);return}await ve()}async function Zs(o,e,t){if(!d||!T||!confirm("Request insurance for "+e+`?

Insurance corporations will see this in their Deal Flow and can offer coverage terms.

Vessel value: `+x(t)))return;const i=T.current_tick||0,{error:n}=await y.from("finance_loan_requests").insert({requesting_faction_id:d.id,nation_id:d.nation_id,request_type:"insurance",insured_vessel_id:o,amount:t,term_months:0,purpose:"Vessel Insurance — "+e,status:"open",created_tick:i,expires_tick:i+12});if(n){n.message.includes("duplicate")||n.message.includes("unique")?alert("Insurance already requested for this vessel."):alert("Failed to request insurance: "+n.message);return}alert(`Insurance request posted to Deal Flow.

Insurance corporations can now offer coverage for `+e+"."),await ve()}let on=!1;async function el(o,e){if(on||!d||!T)return;const t=prompt(`Describe the claim reason:

e.g., "Storm damage during transit — hull breach repaired at sea" or "Engine failure requiring emergency dry dock"`);if(!t||t.trim().length<5)return;const i=T.current_tick||0,{data:n}=await y.from("finance_active_loans").select("id, lender_faction_id, principal, deductible_pct").eq("insured_vessel_id",o).eq("status","current").limit(1).maybeSingle();if(!n){alert("No active insurance policy found for this vessel.");return}const a=Number(n.principal||0),r=Number(n.deductible_pct||10),s=Math.round(a*r/100);if(!confirm("File insurance claim for "+e+`?

Coverage: `+x(a)+`
Deductible: `+r+"% ("+x(s)+`)

Reason: `+t.trim()+`

The insurer will review this claim and determine the payout.`))return;on=!0;const{error:c}=await y.from("event_log").insert({nation_id:d.nation_id,faction_id:d.id,event_name:(d.faction_name||"Corporation")+" — Insurance Claim Filed",description_used:(d.faction_name||"A shipping corporation")+" has filed an insurance claim for vessel "+e+". Reason: "+t.trim().replace(/[<>"]/g,""),category:"business",trigger_key:"vessel_insurance_claim",effects_applied:{vessel_id:o,vessel_name:e,policy_id:n.id,insurer_faction_id:n.lender_faction_id,coverage:a,deductible_pct:r,claim_reason:t.trim()},fired_at_tick:i});c&&console.warn("Failed to log insurance claim event:",c.message);const{error:p}=await y.from("finance_active_loans").update({claims_paid:(n.claims_paid||0)+1}).eq("id",n.id);p&&console.warn("Failed to update claims_paid:",p.message),on=!1,alert("Insurance claim filed for "+e+`.

The insurer (`+x(a)+" coverage) has been notified. Claim details are visible in the events feed.")}window.flRequestInsurance=Zs;window.flFileClaim=el;const xn={fuel_depot:{label:"FUEL DEPOT",color:"#c86a4a",icon:"⛽",desc:"Bunkering facility — refuel at base cost, earn revenue from visiting fleets."},dry_dock:{label:"DRY DOCK",color:"#c84",icon:"🔧",desc:"Repair & maintenance dock — dock at base cost, earn revenue from visiting fleets."}},tl=[{type:"fuel_depot",name:"Fuel Depot — Standard",cost:105e6,maint:85e3,style:"Basic",desc:"Bulk fuel storage and bunkering facility."},{type:"fuel_depot",name:"Fuel Depot — Advanced",cost:14e7,maint:11e4,style:"Modern",desc:"High-capacity fuel terminal with pipeline infrastructure."},{type:"dry_dock",name:"Dry Dock — Standard",cost:85e6,maint:15e4,style:"Basic",desc:"Ship repair and maintenance facility."},{type:"dry_dock",name:"Dry Dock — Advanced",cost:115e6,maint:2e5,style:"Modern",desc:"Full-service shipyard with drydock and crane facilities."}];let go=[];async function oa(){if(!d)return;const{data:o}=await y.from("corp_properties").select("*").eq("faction_id",d.id).in("type",["fuel_depot","dry_dock"]).eq("is_active",!0).order("created_at",{ascending:!1});go=o||[],ol()}function ol(){const o=document.getElementById("pf-count"),e=document.getElementById("pf-list"),t=document.getElementById("pf-footer");if(!o||!e||!t)return;const i=go;if(o.textContent=i.length+" FACILIT"+(i.length===1?"Y":"IES"),i.length===0)e.innerHTML=`<div style="padding:20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-bottom:6px;">No port facilities built.</div>
            <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Build a <span style="color:#c86a4a;font-weight:700;">Fuel Depot</span> to refuel your fleet at base cost<br>and earn revenue from other corps refueling here.<br>Build a <span style="color:#c84;font-weight:700;">Dry Dock</span> to repair vessels at base cost.</div>
        </div>`;else{let r=0;e.innerHTML=i.map(s=>{const c=xn[s.type]||xn.fuel_depot,p=s.condition>=75?"#5c5":s.condition>=50?"#ca5":"#c84";return r+=Number(s.monthly_maintenance||0),`<div style="padding:8px 12px;border-bottom:1px solid var(--border-0);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${c.icon}</span>
                        <span style="font-size:11px;font-weight:600;color:var(--text-bright);">${b(s.name)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${c.color};background:${c.color}12;border:1px solid ${c.color}25;">${c.label}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:4px;">${s.city||"Port"} · ${(s.style||"Basic").toUpperCase()}</div>
                <div style="display:flex;gap:12px;margin-bottom:4px;">
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${p};">${s.condition}%</span>
                        </div>
                        <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${s.condition}%;height:100%;background:${p};"></div></div>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#a44;">${x(s.monthly_maintenance||0)}</span>
                        </div>
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">VALUE: ${x(s.purchase_price||0)}</div>
                    </div>
                </div>
            </div>`}).join("")}Number(d?.corp_cash_reserves??0);const n=i.some(r=>r.type==="fuel_depot"),a=i.some(r=>r.type==="dry_dock");t.innerHTML=`
        <div onclick="pfOpenBuild('fuel_depot')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c86a4a;border:1px solid rgba(200,106,74,0.3);background:rgba(200,106,74,0.04);">
            ${n?"+ FUEL DEPOT":"BUILD FUEL DEPOT"}
        </div>
        <div onclick="pfOpenBuild('dry_dock')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c84;border:1px solid rgba(204,136,68,0.3);background:rgba(204,136,68,0.04);">
            ${a?"+ DRY DOCK":"BUILD DRY DOCK"}
        </div>`}let nn=!1;async function nl(o){if(nn||!d||!T)return;const e=tl.filter(_=>_.type===o);if(e.length===0)return;const t=xn[o],i=d.nation_id,n=S?.name||d?.nation||"Home Nation",a=S?.capital||"Port City",r=[{id:i,name:n,capital:a,label:"National HQ"}],{data:s}=await y.from("corp_properties").select("nation_id, name, city, nations!nation_id(name, capital)").eq("faction_id",d.id).eq("type","regional_hq").eq("is_active",!0);for(const _ of s||[])_.nation_id!==i&&r.push({id:_.nation_id,name:_.nations?.name||_.city||"Unknown",capital:_.nations?.capital||_.city||"Port City",label:_.name||"Subsidiary"});let c=r[0];if(r.length>1){let _=t.label+` — SELECT LOCATION
`+"─".repeat(30)+`
`;_+=`Build in which nation?

`;for(let E=0;E<r.length;E++){const z=r[E],I=go.filter(w=>w.type===o&&w.nation_id===z.id).length;_+=E+1+". "+z.name+"  ("+z.label+")",I>0&&(_+="  ["+I+" existing]"),_+=`
`}_+=`
Enter number (or cancel):`;const $=prompt(_);if(!$)return;const h=parseInt($,10)-1;if(isNaN(h)||h<0||h>=r.length){alert("Invalid selection.");return}c=r[h]}const p=go.filter(_=>_.type===o&&_.nation_id===c.id).length;let f=t.label+" CONSTRUCTION — "+c.name.toUpperCase()+`
`+"─".repeat(30)+`
`;p>0&&(f+="You already have "+p+" "+t.label.toLowerCase()+(p>1?"s":"")+` here.

`),f+=t.desc+`

`;for(let _=0;_<e.length;_++){const $=e[_];f+=_+1+". "+$.name+`
`,f+="   Cost: "+x($.cost)+" · Maint: "+x($.maint)+`/tick
`,f+="   "+$.desc+`

`}f+="Enter 1 or 2 to select (or cancel):";const l=prompt(f);if(!l)return;const u=parseInt(l,10)-1;if(isNaN(u)||u<0||u>=e.length){alert("Invalid selection.");return}const m=e[u];if(!confirm("Commission "+m.name+" in "+c.capital+", "+c.name+`?

Budget: `+x(m.cost)+`

This will create a construction contract that construction corporations can bid on. Payment occurs when the contract is awarded.`))return;nn=!0;const v=T.current_tick||0,g=(T.current_date||"").match(/\d{4}/)?.[0]||"2015";try{const{count:_}=await y.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",c.id).eq("issuer_type","PRIVATE"),h=`PVT-P${(_||0)+1}-${g}`,E=m.style==="Modern",z={concrete:E?6:4,steel:E?5:3,heavy_parts:E?3:2,aggregate:E?3:2},I={trucks:1,mixers:1,excavators:1},w={general:E?12:8,skilled:E?5:3},C=E?6:4,{error:q}=await y.from("construction_contracts").insert({nation_id:c.id,template_key:o,sector:"industrial",name:m.name,project_type:t.label,project_subtype:m.style,description:`${m.name} at ${c.capital} Port — commissioned by ${d.faction_name}. ${m.desc}`,project_code:h,budget_ceiling:m.cost,timeline_ticks:C,required_materials:z,required_equipment:I,required_workforce:w,status:"open",generated_at_tick:v,bidding_ends_tick:v+3,issuer_type:"PRIVATE",issuer_name:d.faction_name,issuer_faction_id:d.id});if(q)throw q;await oa(),alert(`Construction contract posted!

Project: `+m.name+`
Location: `+c.capital+", "+c.name+`
Code: `+h+`
Budget: `+x(m.cost)+`
Timeline: `+C+` ticks

Construction corporations in `+c.name+" can now bid on this project.")}catch(_){alert("Failed to post contract: "+(_.message||"Error"))}finally{nn=!1}}window.pfOpenBuild=nl;const Dn={"Bulk Cargo":["Reefer","Bulk","Coastal"],"Container Freight":["Coastal","Container"],"Specialized Transport":["Tanker","LNG","Bulk"]};async function jn(){if(!d)return;const{data:o,error:e}=await y.from("ship_market_listings").select("*, nation:nation_id(id, name)").eq("status","available").order("asking_price",{ascending:!0});e&&console.warn("Failed to load ship market:",e.message),hn=o||[],so=null,na()}function il(o){so=so===o?null:o,na()}function al(o){return(Dn[d?.corp_subsector]||[]).includes(o)}function na(){const o=document.getElementById("sm-count"),e=document.getElementById("sm-list"),t=document.getElementById("sm-footer");if(!o||!e)return;const i=hn;o.textContent=i.length+" AVAILABLE",i.length===0?e.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels on the market.<br>Check back next cycle.</div>':e.innerHTML=i.map((r,s)=>{const c=so===s,p=_t[r.vessel_class]||{color:"#666",label:"?"},f=r.seller_type==="CORP"?"#5a8aaa":"#8b9a6b",l=ea(r.condition),u=r.nation?.name||"—",m=al(r.vessel_class);T?.current_tick;const v=r.age_ticks||0,g=Math.max(1,Math.floor(v/12)),_=u!==d?.nation?Number(d?.tariffs||S?.tariffs||0):0,$=Math.round(r.asking_price*_/100),h=r.asking_price+$;let E=`<div onclick="smSelectListing(${s})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${c?p.color:"transparent"};background:${c?p.color+"06":"transparent"};">
                <div style="padding:8px 14px;">`;return E+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(r.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${p.color};background:${p.color}12;border:1px solid ${p.color}25;">${p.label}</span>
            </div>`,E+=`<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;">
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${f};background:${f}12;border:1px solid ${f}25;">${r.seller_type}</span>
                <span style="font-size:9px;color:var(--text-muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(r.seller_name||"—")}</span>
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;">${u.toUpperCase().slice(0,6)}</span>
                ${_>0?`<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">+${_}%</span>`:""}
            </div>`,E+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-0);">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);margin-top:1px;">${(r.capacity_dwt||0).toLocaleString()} ${r.capacity_unit||"DWT"}</div>
                </div>
                <div style="flex:0.6;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">COND</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${l};margin-top:1px;">${r.condition}%</div>
                </div>
                <div style="flex:0.5;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">AGE</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${g}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">PRICE</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--gold);margin-top:1px;">${x(r.asking_price)}</div>
                </div>
            </div>`,c&&(E+='<div style="margin-top:6px;">',E+=`<div style="padding:4px 8px;margin-bottom:5px;background:var(--bg-0);border:1px solid var(--border-0);">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0);">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CARRIES</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${p.color};">${(_t[r.vessel_class]||{}).label||"?"} class cargo</span>
                    </div>
                    <div style="padding:3px 0;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:1px;">REASON FOR SALE</div>
                        <div style="font-size:9px;color:var(--text-muted);line-height:1.4;">${b(r.sale_reason||"—")}</div>
                    </div>
                </div>`,E+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                    <div style="width:40px;height:3px;background:var(--border-0);"><div style="width:${r.condition}%;height:100%;background:${l};"></div></div>
                    ${r.condition<60?'<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">May need dry dock</span>':""}
                </div>`,_>0&&(E+=`<div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:8px;margin-bottom:3px;">
                        <span style="color:var(--text-dim);">Import tariff (${_}%)</span>
                        <span style="color:#c84;">+${x($)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;margin-bottom:5px;">
                        <span style="color:var(--text-bright);">TOTAL</span>
                        <span style="color:var(--gold);">${x(h)}</span>
                    </div>`),m?E+=`<div onclick="event.stopPropagation();smPurchase('${r.id}',${h})" style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${p.color};cursor:pointer;">${x(h)} — PURCHASE</div>`:E+=`<div style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:var(--text-dim);border:1px solid var(--border-0);opacity:0.4;">⊘ ${r.vessel_class} not available for ${d?.corp_subsector||"your subsector"}</div>`,E+="</div>"),E+="</div></div>",E}).join("");const n=i.filter(r=>r.seller_type==="CORP").length,a=i.filter(r=>r.seller_type==="LOCAL").length;t.innerHTML=`<div style="display:flex;gap:6px;">
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
    <div onclick="smOpenCommission()" style="padding:4px 14px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--gold);border:1px solid rgba(200,168,50,0.3);cursor:pointer;">COMMISSION VESSEL</div>`}let it=!1;async function rl(o,e){if(it||!d||!T)return;const t=Number(d.corp_cash_reserves??0);if(t<e){alert("Insufficient cash. Need "+x(e)+".");return}if(!confirm("Purchase this vessel for "+x(e)+"?"))return;it=!0;const i=hn.find(l=>l.id===o);if(!i){it=!1;return}const n=T.current_tick||0,a={Coastal:{capacity_dwt:14e3,capacity_unit:"DWT",base_maintenance:18e4,fuel_capacity:800,purchase_price:3e6},Container:{capacity_dwt:4800,capacity_unit:"TEU",base_maintenance:29e4,fuel_capacity:2100,purchase_price:65e6},Bulk:{capacity_dwt:28e3,capacity_unit:"DWT",base_maintenance:35e4,fuel_capacity:1800,purchase_price:3e6},Tanker:{capacity_dwt:42e3,capacity_unit:"DWT",base_maintenance:38e4,fuel_capacity:2400,purchase_price:53e6},Reefer:{capacity_dwt:12e3,capacity_unit:"DWT",base_maintenance:28e4,fuel_capacity:1600,purchase_price:6e6},LNG:{capacity_dwt:18e3,capacity_unit:"DWT",base_maintenance:58e4,fuel_capacity:1400,purchase_price:78e6}},r=a[i.vessel_class]||a.Coastal,{error:s}=await y.from("factions").update({corp_cash_reserves:t-e}).eq("id",d.id);if(s){alert("Failed: "+s.message),it=!1;return}const{error:c}=await y.from("corp_vessels").insert({faction_id:d.id,nation_id:d.nation_id,vessel_name:i.vessel_name,vessel_class:i.vessel_class,condition:i.condition,fuel:i.fuel||50,status:"in_port",capacity_dwt:i.capacity_dwt||r.capacity_dwt,capacity_unit:i.capacity_unit||r.capacity_unit,base_maintenance:i.base_maintenance||r.base_maintenance,fuel_capacity:i.fuel_capacity||r.fuel_capacity,purchase_price:e,built_at_tick:n-(i.age_ticks||0),current_port_nation_id:d.nation_id});if(c){await y.from("factions").update({corp_cash_reserves:t}).eq("id",d.id),alert("Failed to create vessel: "+c.message),it=!1;return}var{error:p}=await y.from("ship_market_listings").update({status:"sold",purchased_by:d.id,purchased_at_tick:n}).eq("id",o);if(p&&console.warn("Failed to mark listing as sold:",p.message),i.seller_faction_id){const{data:l}=await y.from("factions").select("corp_cash_reserves").eq("id",i.seller_faction_id).single();if(l){var{error:f}=await y.from("factions").update({corp_cash_reserves:Number(l.corp_cash_reserves||0)+i.asking_price}).eq("id",i.seller_faction_id);f&&console.warn("Failed to credit seller:",f.message)}}d.corp_cash_reserves=t-e,it=!1,await Promise.all([ve(),jn()])}const Mt=[{cls:"Coastal",baseCost:12e6,baseBuild:3,cargo:"Bulk, Containers (coastal)"},{cls:"Container",baseCost:65e6,baseBuild:5,cargo:"Manufactured, Tech, General"},{cls:"Bulk",baseCost:38e6,baseBuild:4,cargo:"Minerals, Aggregate, Military"},{cls:"Tanker",baseCost:52e6,baseBuild:5,cargo:"Fuel, Petroleum, Chemicals"},{cls:"Reefer",baseCost:45e6,baseBuild:4,cargo:"Food, Perishables, Agriculture"},{cls:"LNG",baseCost:78e6,baseBuild:6,cargo:"Liquefied Natural Gas only"}];let le="Coastal",Ft=0,Ut="",Ye=[];function sl(){le=(Dn[d?.corp_subsector]||["Coastal"])[0],Ft=0,Ut="",Ye=[],document.getElementById("comm-overlay").style.display="flex",ll()}async function ll(){const{data:o}=await y.from("nations").select("id, name, manufacturing_output, physical_infrastructure, tariffs").order("name");Ye=(o||[]).map(e=>{const t=Number(e.manufacturing_output??50),i=Math.round((.75+t/100*.5)*100)/100,n=Math.round((1.5-t/100*.65)*100)/100,a=e.id===d?.nation_id;return{id:e.id,name:e.name,mfg:t,costMod:i,buildMod:n,isHome:a,tariffs:Number(e.tariffs??0)}}),Ye.sort((e,t)=>(t.isHome?1:0)-(e.isHome?1:0)),Fn()}function ia(){document.getElementById("comm-overlay").style.display="none"}function dl(o){le=o,Fn()}function cl(o){Ft=o,Fn()}function pl(o){Ut=o}function Fn(){const o=document.getElementById("comm-content");if(!o)return;const e=T?.current_tick||0,t=Mt.find(v=>v.cls===le)||Mt[0],i=Ye[Ft]||{name:"—",costMod:1,buildMod:1},n=_t[le]||{color:"#666"},a=Math.round(t.baseCost*i.costMod),r=Math.max(2,Math.round(t.baseBuild*i.buildMod)),s=Math.round(a*.5),c=a-s,p=e+r,f=Dn[d?.corp_subsector]||[];let l="";l+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:#c8a832;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Commission Vessel</span>
            </div>
            <span onclick="smCloseCommission()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
    </div>`,l+='<div style="flex:1;overflow-y:auto;">',l+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Vessel Type</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">`;for(const v of Mt){const g=_t[v.cls]||{color:"#666",label:"?"},_=le===v.cls,$=f.includes(v.cls);l+=`<div onclick="${$?"commSetClass('"+v.cls+"')":""}" style="padding:5px 4px;text-align:center;cursor:${$?"pointer":"not-allowed"};background:${_?g.color+"18":"transparent"};border:1px solid ${_?g.color+"44":"#2a2a24"};opacity:${$?1:.3};">
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${_?g.color:"#6a6660"};">${g.label}</div>
            <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;margin-top:2px;">${x(v.baseCost)} base</div>
        </div>`}l+="</div>",l+=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:${n.color};">${t.cargo}</div>`,l+="</div>",l+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Origin Shipyard</div>`;for(let v=0;v<Ye.length;v++){const g=Ye[v],_=Ft===v,$=g.costMod>1?"#c84":g.costMod<1?"#5c5":"#6a6660",h=g.buildMod>1?"#c84":g.buildMod<1?"#5c5":"#6a6660";l+=`<div onclick="commSetNation(${v})" style="display:flex;align-items:center;padding:5px 8px;margin-bottom:2px;cursor:pointer;background:${_?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${_?"#8b9a6b44":"#2a2a24"};border-left:2px solid ${_?"#8b9a6b":"transparent"};">
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
        <div style="background:#1c1c18;border:1px solid #2a2a24;padding:6px 10px;">`;const u=[{label:"VESSEL CLASS",value:le,color:n.color},{label:"SHIPYARD",value:i.name,color:"#9e9a92"},{label:"BASE COST",value:x(t.baseCost)+" × "+i.costMod.toFixed(2),color:"#9e9a92"},{label:"BUILD TIME",value:r+" ticks",color:r>t.baseBuild?"#c84":r<t.baseBuild?"#5c5":"#9e9a92"},{label:"COMPLETION",value:"~Tick "+p,color:"#9e9a92"}];for(const v of u)l+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${v.label}</span>
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${v.color};">${v.value}</span>
        </div>`;l+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">TOTAL COST</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c8a832;">${x(a)}</span>
    </div>`,l+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEPOSIT (50% NOW)</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">${x(s)}</span>
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
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${x(s)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="smCloseCommission()" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="comm-order-btn" onclick="${m?"smPlaceOrder()":""}" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:${m?"#000":"#6a6660"};background:${m?"#c8a832":"transparent"};border:1px solid ${m?"#c8a832":"#2a2a24"};cursor:${m?"pointer":"default"};opacity:${m?1:.4};">PLACE ORDER</div>
        </div>
    </div>`,o.innerHTML=l}let Et=!1;async function fl(){if(Et||!d||!T)return;const o=Ut.trim();if(o.length<2)return;const e=Mt.find(_=>_.cls===le)||Mt[0],t=Ye[Ft];if(!t)return;const i=Math.round(e.baseCost*t.costMod),n=Math.max(2,Math.round(e.baseBuild*t.buildMod)),a=Math.round(i*.5),r=i-a,s=T.current_tick||0,c=Number(d.corp_cash_reserves??0);if(c<a){alert("Insufficient cash for deposit. Need "+x(a)+".");return}if(!confirm("Commission "+le+" from "+t.name+`?

Deposit: `+x(a)+` (non-refundable)
Balance: `+x(r)+" on delivery at tick "+(s+n)))return;Et=!0;const p=document.getElementById("comm-order-btn");p&&(p.style.opacity="0.4",p.style.pointerEvents="none");const{error:f}=await y.from("factions").update({corp_cash_reserves:c-a}).eq("id",d.id);if(f){alert("Failed: "+f.message),Et=!1;return}const{data:l}=await y.from("nations").select("budget_reserves").eq("id",t.id).single();if(l){var{error:u}=await y.from("nations").update({budget_reserves:Number(l.budget_reserves||0)+a}).eq("id",t.id);u&&console.warn("Failed to credit shipyard nation budget:",u.message)}const m={Coastal:{dwt:14e3,unit:"DWT",maint:18e4,fuel:800},Container:{dwt:4800,unit:"TEU",maint:29e4,fuel:2100},Bulk:{dwt:28e3,unit:"DWT",maint:35e4,fuel:1800},Tanker:{dwt:42e3,unit:"DWT",maint:38e4,fuel:2400},Reefer:{dwt:12e3,unit:"DWT",maint:28e4,fuel:1600},LNG:{dwt:18e3,unit:"DWT",maint:58e4,fuel:1400}},v=m[le]||m.Coastal,{error:g}=await y.from("vessel_orders").insert({faction_id:d.id,vessel_name:o,vessel_class:le,capacity_dwt:v.dwt,capacity_unit:v.unit,base_maintenance:v.maint,fuel_capacity:v.fuel,purchase_price:e.baseCost,shipyard_nation_id:t.id,shipyard_nation:t.name,cost_modifier:t.costMod,build_modifier:t.buildMod,total_cost:i,deposit_paid:a,balance_due:r,ordered_at_tick:s,delivery_tick:s+n,build_ticks:n,status:"building"});if(g){await y.from("factions").update({corp_cash_reserves:c}).eq("id",d.id),alert("Failed to place order: "+g.message),Et=!1;return}d.corp_cash_reserves=c-a,Et=!1,ia(),alert(o+` commissioned!

Class: `+le+`
Shipyard: `+t.name+`
Deposit: `+x(a)+`
Delivery: Tick `+(s+n))}window.smSelectListing=il;window.smPurchase=rl;window.smOpenCommission=sl;window.smCloseCommission=ia;window.commSetClass=dl;window.commSetNation=cl;window.commSetName=pl;window.smPlaceOrder=fl;window.flSelectVessel=Ys;window.flRefurbish=Qs;window.flRefuel=Ks;window.flSell=Js;window.flRename=Xs;window.openBidReview=Fs;window.closeBidReview=Mo;window.reviewSelectBid=Us;window.acceptBid=Hs;window.declineAllBids=Gs;window.switchToActions=Ei;window.actSelectExec=Wr;window.actExecute=Ar;window.confirmFireExec=Ir;window.actOpenStatement=zi;window.actCloseStatement=An;window.actSubmitStatement=Mr;window.actDeclareBankruptcy=Ii;window.actOpenRestructure=Ri;window.actCloseRestructure=Mn;window.actSubmitRestructure=Fr;window.actOpenRebrand=qi;window.actCloseRebrand=Rn;window.actSubmitRebrand=Ur;window.actOpenDonation=Li;window.actCloseDonation=qn;window.actSubmitDonation=Vr;window.donateSelectParty=Gr;window.lrOpen=Ai;window.lrClose=Mi;window.lrSubmit=jr;window.lrSetAmount=Lr;window.lrSetPurpose=Br;window.lrSetTerm=Or;window.lrSetCollateral=Pr;window.openExecSearch=Yr;window.closeExecSearch=Oi;window.esSelectCandidate=Qr;window.esHireCandidate=Kr;window.switchToExpansion=wi;window.switchToOperations=ki;window.hfSetChange=Jr;window.hfReset=Xr;window.hfConfirm=Zr;document.addEventListener("click",function(o){const e=o.target.closest(".corp-nav-tab[href]:not([data-tab-action])");if(!e)return;const t=e.getAttribute("href");if(!t)return;const i=new URL(t,window.location.href);i.pathname!==window.location.pathname||i.searchParams.get("tab")||e.classList.contains("active")||(o.preventDefault(),ki(o))});wr();
