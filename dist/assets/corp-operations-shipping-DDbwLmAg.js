const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-BGmUeelO.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as v}from"./supabase-client-CiYoFhIh.js";/* empty css                    */import{c as Ge,i as ba,a as _a,l as ha,M as qt,Q as kn,b as En,d as cn,e as li,f as di,g as $a,h as wa}from"./corp-shipping-data-CcJ84lK3.js";import{_ as ka}from"./preload-helper-BXl3LOEh.js";import{e as b}from"./utils-CY90Gazr.js";import{initMessaging as Ea}from"./messaging-BUrQna7p.js";import{c as Ca,a as pn,E as Ot,b as $o,d as ci,e as Sa,f as za,h as oi}from"./equipment-DsuDdEne.js";import{a as Ta,E as so,b as ro,g as Ia}from"./corp-executives-CfLJhDUF.js";import"./elections-5GLDcxFI.js";import"./config-fKhFNVuq.js";import"./government-types-D9n0pQb0.js";import"./ideology-BIAflN4K.js";import"./stats-tIiBSaQA.js";let $e=[],d=null,S=null,z=null,st=[],bt={},K=[],Z={},fn=-1;const Na={em:"em_systems",glass:"glass_facades",heavy:"heavy_parts"},lo=o=>Na[o]||o;let de="concrete",J="STD",_e=500,ie=[],pi={},mn=0,Bt=[],Pt=[],ft=0,we=null,Ee=-1,ce=[],Dt=null,Tt={},co={},Cn=[],po=null,fe="trucks",ke=0,Ce=1,qe=[],Ve=null,fi=[],un=null,Zt=null,yn="ALL",vn="TIMELINE";function B(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Ma(o){if(o>=12){const e=Math.floor(o/12),t=o%12;return t>0?e+"y "+t+"mo":e+"y"}return o+" ticks"}function mi(o){return!o||o.length===0?"":o.map(e=>{const t=pi[e];if(!t)return"";const i=t.reputation_bonus>0?"var(--green)":t.reputation_bonus<0?"var(--red)":"var(--text-dim)",n=t.reputation_bonus>0?"+"+t.reputation_bonus:t.reputation_bonus<0?String(t.reputation_bonus):"";return`<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:3px;font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">${t.icon||"📍"} ${b(t.name)}${n?` <span style="color:${i};font-weight:700;">${n} REP</span>`:""}</span>`}).filter(Boolean).join(" ")}function me(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(0)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Sn(o){return o==="civil_engineering"?"CIVIL":o==="industrial"?"INDUSTRIAL":o==="mega_project"?"MEGA":o?.toUpperCase()||"—"}function ui(o){return o==="civil_engineering"?"light":o==="industrial"?"heavy":o==="mega_project"?"mega":"light"}function Aa(){Zt&&clearInterval(Zt),Zt=setInterval(()=>{if(!un)return;const o=un-Date.now();if(o<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(Zt);return}const e=Math.floor(o/36e5),t=Math.floor(o%36e5/6e4),i=Math.floor(o%6e4/1e3);document.getElementById("tick-countdown").textContent=e+"h "+t+"m "+i+"s"},1e3)}function Ra(){document.body.classList.toggle("light-mode");const o=document.getElementById("theme-toggle");o.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function La(o,e){o==="type"&&(yn=e),o==="sort"&&(vn=e),document.querySelectorAll(`.filter-pill[data-filter="${o}"]`).forEach(t=>{t.classList.toggle("active",t.dataset.value===e)}),vi()}const ni={"Civil Engineering":"civil_engineering","Industrial Construction":"industrial",Megaprojects:"mega_project"};function yi(o){if(!d)return!1;if(ni[d.corp_subsector]===o.sector)return!0;const t=(V||[]).filter(i=>i.type==="regional_hq"&&i.is_active&&i.nation_id===o.nation_id);for(const i of t)if(ni[i.subsector]===o.sector)return!0;return!1}function vi(){const o=document.getElementById("oc-list");let e=[...st];if(yn==="GOVERNMENT"?e=e.filter(n=>n.issuer_type==="GOVERNMENT"):yn==="PRIVATE"&&(e=e.filter(n=>n.issuer_type==="PRIVATE")),vn==="TIMELINE"&&e.sort((n,a)=>(n.timeline_ticks||0)-(a.timeline_ticks||0)),vn==="BUDGET"&&e.sort((n,a)=>(a.budget_ceiling||0)-(n.budget_ceiling||0)),document.getElementById("oc-count").textContent=e.length+" AVAILABLE",e.length===0){o.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const t=z?.current_tick||0;let i="";for(const n of e){const a=n.issuer_type==="GOVERNMENT",s=a?"gov":"private",r=yi(n),c=r?"":" locked",p=ui(n.sector),f=Sn(n.sector),l=(n.timeline_ticks||0)>18?" warn":"",m=n.bidding_ends_tick?Math.max(0,n.bidding_ends_tick-t):"?";i+=`
            <div class="oc-item${c}" data-contract-id="${n.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${b(n.name)}</span>
                    <span class="oc-item__type-badge ${s}">${a?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${s}">${b(n.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${m} tick${m!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${me(n.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${l}">${Ma(n.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${p}">${f}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${bt[n.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${me(bt[n.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${r?"yes":"no"}">${r?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${r?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openContractDetail(contracts.find(x=>x.id==='${n.id}'))">VIEW</button>`:""}
                </div>
                ${n.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${b(n.description)}</div>`:""}
                ${n.modifiers&&n.modifiers.length>0?`<div style="display:flex;flex-wrap:wrap;gap:3px;padding:4px 0 0;">${mi(n.modifiers)}</div>`:""}
            </div>`}o.innerHTML=i,o.querySelectorAll(".oc-item:not(.locked)").forEach(n=>{n.addEventListener("click",()=>{const a=n.dataset.contractId,s=st.find(r=>r.id===a);s&&gi(s)})})}let We=null;function gi(o){We=o;const e=document.getElementById("cd-overlay"),t=o.issuer_type==="GOVERNMENT",i=t?"gov":"private",n=(S?.name||d.nation||"—").toUpperCase(),a=yi(o);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${b(n)}</span>
        <span class="cd-header__name">${b(o.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${i}">${b(o.issuer_name)}</span>
        <span class="cd-header__type-badge ${i}">${t?"GOV":"PRIVATE"}</span>
    `;const s=document.getElementById("cd-blueprint");o.blueprint_svg?(s.innerHTML=o.blueprint_svg,s.style.display=""):(s.innerHTML=Xa(o),s.style.display="");const r=o.permits_required||[],c=o.required_equipment||o.equipment_required||{},p=Array.isArray(c)?c.map(N=>({key:N,qty:1})):Object.entries(c).map(([N,P])=>({key:N,qty:P})),f=o.required_materials||o.materials_estimated||{},m={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[o.sector]||o.spec_category||o.sector||"—";let u="var(--teal)";o.sector==="industrial"&&(u="var(--orange)"),o.sector==="mega_project"&&(u="var(--red)");let y=B(o.budget_ceiling||o.budget||0),x=(o.timeline_ticks||o.timeline_months||0)+" Months",g="";g+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${b(o.project_code||o.contract_number||"")}</span>
            </div>
            <div class="cd-issue__tags">
                ${o.project_type?`<span class="cd-tag teal">${b(o.project_type.toUpperCase())}</span>`:""}
                ${o.project_subtype?`<span class="cd-tag gold">${b(o.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,o.description&&(g+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${b(o.description)}</div>
            </div>`);const $=o.modifiers||[];if($.length>0){g+=`<div class="cd-items">
            <div class="cd-section-label">Building Modifiers</div>
            <div style="display:flex;flex-direction:column;gap:6px;">`;for(const N of $){const P=pi[N];if(!P)continue;const U=P.reputation_bonus>0?"var(--green)":P.reputation_bonus<0?"var(--red)":"var(--text-dim)",W=P.cost_multiplier>1?"+"+Math.round((P.cost_multiplier-1)*100)+"% cost":P.cost_multiplier<1?Math.round((1-P.cost_multiplier)*100)+"% cheaper":"",se=P.reputation_bonus!==0?(P.reputation_bonus>0?"+":"")+P.reputation_bonus+" rep":"",ge=P.required_permits||[];g+=`<div style="padding:6px 10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:600;font-size:0.78rem;color:var(--text-primary);">${P.icon||"📍"} ${b(P.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;">
                        ${W?`<span style="color:var(--amber);">${W}</span>`:""}
                        ${W&&se?" · ":""}
                        ${se?`<span style="color:${U};font-weight:700;">${se}</span>`:""}
                    </span>
                </div>
                <div style="font-size:0.65rem;color:var(--text-dim);margin-top:2px;">${b(P.description||"")}</div>
                ${ge.length>0?`<div style="font-size:0.6rem;color:var(--amber);margin-top:3px;font-family:var(--font-mono);">Requires permits: ${ge.map(H=>b(H.replace(/_/g," "))).join(", ")}</div>`:""}
            </div>`}g+="</div></div>"}g+='<div class="cd-details">',o.project_type&&(g+=Le("Type",o.project_type)),o.project_subtype&&(g+=Le("Sub-Type",o.project_subtype)),g+=Le("Specialization",m,u),g+=Le("Total Budget",y,"var(--green)"),g+=Le("Timeline",x),g+=Le("Nation",S?.name||d.nation||"—"),o.region&&(g+=Le("Region",o.region)),g+="</div>",r.length>0&&(g+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${r.map(N=>{const P=N.status==="approved"?"approved":"required",U=N.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${P}">
                            <span class="cd-chip__icon">${U}</span>
                            <span class="cd-chip__label">${b(N.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),f.length>0&&(g+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${f.map(N=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${b(N.name)}</span>
                        <span class="cd-mat-row__qty">${b(String(N.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=g;const h=r.filter(N=>N.status==="approved").length,k=r.length-h,I=p.length,T=[];for(const N of p){const P=ie.find(U=>U.equipment_key===N.key);P&&P.owned>=N.qty||T.push(N)}const w=T.length,C=o.required_materials||{},L=typeof C=="object"&&!Array.isArray(C)?Object.entries(C):[],E=[];for(const[N,P]of L){const U=Z[N]||{},W=(U.LOW?.qty||0)+(U.STD?.qty||0)+(U.HIGH?.qty||0);W<P&&E.push({key:N,need:P,have:W})}const R=N=>N.replace(/_/g," ").replace(/\b\w/g,P=>P.toUpperCase());let M="";if(I>0)if(w===0)M+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>';else{const N=T.map(P=>R(P.key)).join(", ");M+=`<span class="cd-footer__badge bad" title="${b(N)}">${w} SHORT: ${b(N)}</span>`}if(L.length>0)if(E.length===0)M+='<span class="cd-footer__badge ok">ALL MATERIALS MET</span>';else{const N=E.map(P=>R(P.key)+" ("+P.have+"/"+P.need+")").join(", ");M+=`<span class="cd-footer__badge bad" title="${b(N)}">${E.length} MAT SHORT: ${b(N)}</span>`}r.length>0&&(k===0?M+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':M+=`<span class="cd-footer__badge warn">${k} PERMITS PENDING</span>`);const O=a,F=o.issuer_faction_id===d?.id,j=o.status==="bidding",X=bt[o.id];document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${M}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${F?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${j?"":"disabled"} title="${j?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:X?`<button class="cd-btn primary" onclick="retractBid('${o.id}')" style="background:#c55;border-color:#c55;"
                        title="Retract your bid ($1M penalty)">RETRACT BID</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${O?"":"disabled"}
                        title="${O?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,e.classList.add("open"),document.body.style.overflow="hidden"}function Vt(o){o&&o.target&&o.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",We=null)}const De=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],ii={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},ai={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let q=null;async function tt(o){const e=K.find(N=>N.id===o);if(!e)return;const t=Array.isArray(e.contract_bids)?e.contract_bids[0]:e.contract_bids,i=z?.current_tick||0,n=e.awarded_at_tick||i,a=e.timeline_ticks||8,s=Math.max(0,i-n),r=Math.min(100,s/a*100);let c=Math.min(De.length-1,Math.floor(r/(100/De.length)));const p=Math.round(r%(100/De.length)/(100/De.length)*100),f=e.required_materials||{},l=t?.material_grades||{};let m=[];try{const{data:N}=await v.from("project_material_allocations").select("material_key, quality_tier, quantity, consumed").eq("contract_id",e.id);m=N||[]}catch{}const u={};for(const N of m)u[N.material_key]||(u[N.material_key]={totalAllocated:0,totalConsumed:0,tiers:{}}),u[N.material_key].totalAllocated+=N.quantity,u[N.material_key].totalConsumed+=N.consumed,u[N.material_key].tiers[N.quality_tier]={qty:N.quantity,consumed:N.consumed};const y=Object.entries(f).map(([N,P])=>{const U=l[N]||"STD",W=u[N]||{totalAllocated:0,totalConsumed:0,tiers:{}};return{key:N,name:N.replace(/_/g," ").replace(/\b\w/g,se=>se.toUpperCase()),grade:U,required:Number(P),allocated:W.totalAllocated,consumed:W.totalConsumed,tiers:W.tiers,warehouseStock:Z[N]||{}}}),x=e.required_equipment||{},g=e.equipment_condition||{},h=(Array.isArray(x)?x.map(N=>[N,1]):Object.entries(x)).map(([N,P])=>{const U=ie.find(H=>H.equipment_key===N),se=(U?.assigned_projects||[]).find(H=>H.contract_id===e.id),ge=se?se.units:0;return{key:N,name:N.replace(/_/g," ").replace(/\b\w/g,H=>H.toUpperCase()),required:Number(P)||1,ownedTotal:U?.owned||0,deployed:U?.deployed||0,available:Math.max(0,(U?.owned||0)-(U?.deployed||0)),assignedToProject:ge,condition:g[N]??(U?.condition||100)}}),k=e.budget_ceiling||0,I=t?.estimated_cost||0,T=Math.round(I*Math.min(1,s/a)),w=t?.estimated_quality||65,C=w>=80?"STRONG":w>=60?"PROMISING":w>=40?"FAIR":"UNCERTAIN",L=e.required_workforce||{},E=e.workers_assigned||{},R=(L.general||0)+(L.skilled||0)+(L.innovative||0),M=(E.general||0)+(E.skilled||0)+(E.innovative||0),O=t?.labor_count||R,F=Number(d?.corp_general_workforce??0),j=Number(d?.corp_skilled_workforce??0),X=Number(d?.corp_innovative_workforce??0);q={project:e,bid:t,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:i,awardedTick:n,totalTicks:a,ticksElapsed:s,phaseIdx:c,phaseProgress:p,materials:y,equipment:h,budget:k,estCost:I,spent:T,quality:w,qualityLabel:C,laborCount:O,wfNeeded:R,wfAssigned:M,reqWf:L,assignedWf:E,corpGeneral:F,corpSkilled:j,corpInnovative:X,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",xi(e.id).then(()=>Ke()),Ke()}let G=!1;async function qa(o,e,t){if(!(G||!q||!d)){G=!0;try{const{data:i,error:n}=await v.rpc("allocate_material_to_project",{p_contract_id:q.project.id,p_faction_id:d.id,p_material_key:o,p_quality_tier:e,p_quantity:t});if(n){alert("Allocation failed: "+n.message);return}if(i&&!i.success){alert(i.error||"Allocation failed");return}await _i(),await tt(q.project.id)}catch(i){alert("Allocation error: "+i.message)}finally{G=!1}}}async function Oa(o,e,t){if(!(G||!q||!d)){G=!0;try{const{data:i,error:n}=await v.rpc("deallocate_material_from_project",{p_contract_id:q.project.id,p_faction_id:d.id,p_material_key:o,p_quality_tier:e,p_quantity:t});if(n){alert("Return failed: "+n.message);return}if(i&&!i.success){alert(i.error||"Return failed");return}await _i(),await tt(q.project.id)}catch(i){alert("Return error: "+i.message)}finally{G=!1}}}async function Ba(o,e){if(!(G||!q||!d)){G=!0;try{const t=q.project,i=t.workers_assigned||{},n=Number(i[o]||0),a=Number((t.required_workforce||{})[o]||0),s=Number(d?.["corp_"+o+"_workforce"]??0);let r=0;for(const u of K||[])u.id!==t.id&&(r+=Number((u.workers_assigned||{})[o]||0));const c=Math.max(0,s-r-n),p=Math.min(e,a-n,c);if(p<=0){alert(c<=0?"No "+o+" workers available in pool":"Already fully staffed for "+o);return}const f={...i,[o]:n+p},{error:l}=await v.from("construction_contracts").update({workers_assigned:f}).eq("id",t.id);if(l){alert("Assign failed: "+l.message);return}const m=K.find(u=>u.id===t.id);m&&(m.workers_assigned=f),await tt(t.id)}catch(t){alert("Assign error: "+t.message)}finally{G=!1}}}async function Pa(o,e){if(!(G||!q||!d)){G=!0;try{const t=q.project,i=t.workers_assigned||{},n=Number(i[o]||0),a=Math.min(e,n);if(a<=0){alert("No "+o+" assigned");return}const s={...i,[o]:n-a},{error:r}=await v.from("construction_contracts").update({workers_assigned:s}).eq("id",t.id);if(r){alert("Unassign failed: "+r.message);return}const c=K.find(p=>p.id===t.id);c&&(c.workers_assigned=s),await tt(t.id)}catch(t){alert("Unassign error: "+t.message)}finally{G=!1}}}async function Da(o,e){if(!(G||!q||!d)){G=!0;try{const t=ie.find(c=>c.equipment_key===o);if(!t){alert("Equipment not found in inventory.");return}const i=Math.max(0,(t.owned||0)-(t.deployed||0));if(i<e){alert("Not enough available "+o+" ("+i+" available).");return}const n=(t.deployed||0)+e,a=[...t.assigned_projects||[]],s=a.find(c=>c.contract_id===q.project.id);s?s.units+=e:a.push({contract_id:q.project.id,contract_name:q.project.name,units:e});const{error:r}=await v.from("corp_equipment").update({deployed:n,assigned_projects:a}).eq("faction_id",d.id).eq("equipment_key",t.equipment_key);if(r){alert("Deploy failed: "+r.message);return}await Si(),await tt(q.project.id)}catch(t){alert("Deploy error: "+t.message)}finally{G=!1}}}async function ja(o){if(!(G||!q||!d)){G=!0;try{const e=ie.find(r=>r.equipment_key===o);if(!e){alert("Equipment not found.");return}const t=[...e.assigned_projects||[]],i=t.findIndex(r=>r.contract_id===q.project.id);if(i===-1){alert("Equipment not deployed to this project.");return}const n=t[i].units;t.splice(i,1);const a=Math.max(0,(e.deployed||0)-n),{error:s}=await v.from("corp_equipment").update({deployed:a,assigned_projects:t}).eq("faction_id",d.id).eq("equipment_key",e.equipment_key);if(s){alert("Undeploy failed: "+s.message);return}await Si(),await tt(q.project.id)}catch(e){alert("Undeploy error: "+e.message)}finally{G=!1}}}function Fa(o){o&&o.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",q=null)}function Ua(o){q&&(q.tab=o,q.expandedEvent=-1,q.selectedResponse=null,Ke())}function Ha(o){q&&(q.expandedEvent=q.expandedEvent===o?-1:o,q.selectedResponse=null,Ke())}function Ga(o){q&&(q.selectedResponse=q.selectedResponse===o?null:o,Ke())}function Ke(){if(!q)return;const o=q,e=o.project,t=e.issuer_type==="GOVERNMENT",i=Sn(e.sector),n=d?.nation||"Nation",a=o.awardedTick+o.totalTicks,s=Math.max(0,a-o.currentTick),r=o.currentTick>a,c=o.budget>0?Math.round(o.spent/o.budget*100):0,p=c>85?"var(--red)":c>60?"var(--amber)":"var(--teal)",f=o.budget-o.spent,l=o.events.filter(g=>g.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
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
    `;let m='<div class="pm-phase__bar">';for(let g=0;g<De.length;g++){const $=g<o.phaseIdx,h=g===o.phaseIdx;m+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${$?"done":h?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${$?"done":h?"active":""}">${De[g]}</span>
        </div>`}m+="</div>",m+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${De[o.phaseIdx]} — ${o.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${r?"var(--red)":"var(--text-secondary)"}">Tick ${o.ticksElapsed} / ${o.totalTicks}${r?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=m;const u=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:l},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=u.map(g=>`<button class="pm-tab${o.tab===g.id?" active":""}" onclick="pmSetTab('${g.id}')">
            ${g.label}${g.badge>0?`<span class="pm-tab__badge">${g.badge}</span>`:""}
        </button>`).join("");let y="";o.tab==="overview"?y=Va(o,e,p,c,f,s,r):o.tab==="events"?y=Wa(o):o.tab==="materials"?y=Ya(o):o.tab==="equipment"&&(y=Qa(o)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${y}</div>`;let x="";l>0&&(x+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${l} EVENT${l>1?"S":""} REQUIRES RESPONSE</span>`),x+=`<span class="pm-ftr__badge" style="color:${o.quality>=70?"var(--green)":o.quality>=50?"var(--amber)":"var(--orange)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${o.quality}/100 — ${o.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${x}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function Va(o,e,t,i,n,a,s){const r=je(o.awardedTick+o.totalTicks);je(o.awardedTick+o.totalTicks);const c=je(o.awardedTick),p=[{label:"Budget",value:me(o.budget),sub:`${i}% spent`,color:t},{label:"Spent",value:me(o.spent),color:"var(--red)"},{label:"Remaining",value:me(n),color:"var(--green)"},{label:"Quality",value:`${o.quality}/100`,sub:o.qualityLabel,color:o.quality>=70?"var(--green)":o.quality>=50?"var(--amber)":"var(--red)"},{label:"Workforce",value:`${o.laborCount}/${o.wfNeeded}`,sub:`Bid: ${o.laborCount}`,color:o.laborCount<o.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${a} ticks`,sub:s?"OVERDUE":`Deadline: ${r}`,color:s?"var(--red)":"var(--text-bright)"}];let f="";f+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${b(e.description||e.name)}</div>
    </div></div>`,f+='<div class="pm-metrics">';for(const g of p)f+=`<div class="pm-metric">
            <div class="pm-metric__label">${g.label}</div>
            <div class="pm-metric__value" style="color:${g.color}">${g.value}</div>
            ${g.sub?`<div class="pm-metric__sub">${b(g.sub)}</div>`:""}
        </div>`;f+="</div>",f+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${c}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${s?"var(--red)":"var(--text-bright)"};font-weight:700">${r}</span></span>
        </div>
    </div></div>`;const l=e.modifiers||[];l.length>0&&(f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Building Modifiers</div>',f+='<div style="display:flex;flex-wrap:wrap;gap:4px;">',f+=mi(l),f+="</div></div></div>");const m=[];if((e.sector==="civil_engineering"||e.sector==="industrial"||e.sector==="mega_project")&&(m.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),m.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),e.sector!=="civil_engineering"&&m.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),m.length>0){f+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const g of m)f+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${b(g.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;f+="</div></div>"}f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Workforce Assignment</div>';const u=[{key:"general",label:"General Workers",corpAvail:o.corpGeneral,color:"var(--text-primary)"},{key:"skilled",label:"Skilled Workers",corpAvail:o.corpSkilled,color:"var(--blue)"},{key:"innovative",label:"Innovative Workers",corpAvail:o.corpInnovative,color:"var(--purple)"}];for(const g of u){const $=Number(o.reqWf[g.key]||0);if($===0)continue;const h=Number(o.assignedWf[g.key]||0),I=h>=$?"var(--green)":h>0?"var(--amber)":"var(--red)",T=g.corpAvail>0&&h<$,w=Math.min(g.corpAvail,$-h),C=h>0;f+='<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.72rem;">',f+="<div>",f+=`<span style="color:${g.color};font-weight:600;">${g.label}</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Required: <strong>${$}</strong></span>`,f+=`<span style="color:${I};margin-left:8px;font-weight:700;">${h} assigned</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Pool: ${g.corpAvail}</span>`,f+="</div>",f+='<div style="display:flex;gap:4px;">',T&&(f+=`<button onclick="pmAssignWorkers('${g.key}',${w})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Assign ${w}</button>`),C&&(f+=`<button onclick="pmUnassignWorkers('${g.key}',${h})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Remove ${h}</button>`),f+="</div></div>"}const y=Number(o.reqWf.general||0)+Number(o.reqWf.skilled||0)+Number(o.reqWf.innovative||0),x=Number(o.assignedWf.general||0)+Number(o.assignedWf.skilled||0)+Number(o.assignedWf.innovative||0);return y>0&&x<y&&(f+='<div style="font-size:0.62rem;color:var(--red);margin-top:6px;font-family:var(--font-mono);">⚠ Project will STALL until workforce is fully assigned</div>'),f+="</div></div>",f}function Wa(o){if(o.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let e="";for(let t=0;t<o.events.length;t++){const i=o.events[t],n=o.expandedEvent===t,a=i.status==="ACTIVE",s=ii[i.type]||ii.WEATHER,r=ai[i.severity]||ai.LOW;if(e+=`<div class="pm-evt ${a?"pm-evt--active":"pm-evt--resolved"}" style="${a?`border-left-color:${s.color}`:""}">`,e+=`<div class="pm-evt__header" onclick="pmToggleEvent(${t})" style="${n?`background:${s.bg}`:""}">`,e+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${s.color};background:${s.bg};border:1px solid ${s.border}">${i.type}</span>
            <span class="pm-evt__sev-badge" style="color:${r}">${i.severity}</span>
            <span class="pm-evt__status" style="color:${a?"var(--red)":"var(--text-dim)"};font-weight:${a?"700":"400"}">${a?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,e+=`<div class="pm-evt__title">${b(i.title)}</div>`,e+=`<div class="pm-evt__meta">Tick ${i.tick} · ${b(i.id||"")}</div>`,n){if(e+='<div class="pm-evt__body">',e+=`<div class="pm-evt__desc">${b(i.desc)}</div>`,i.impact&&(e+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${b(i.impact)}</span>
                </div>`),a&&i.responses&&i.responses.length>0){e+='<div class="pm-evt__resp-title">Response Options</div>';for(let c=0;c<i.responses.length;c++){const p=i.responses[c],f=o.selectedResponse===c,m={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[p.tag]||"var(--text-secondary)";e+=`<div class="pm-resp${f?" selected":""}" style="${f?`border-color:${m}`:""}" onclick="event.stopPropagation();pmSelectResponse(${c})">`,e+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${b(p.label)}</span>
                            <span class="pm-resp__tag" style="color:${m};background:${m}12;border:1px solid ${m}25">${p.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${p.delay>0?"var(--orange)":"var(--green)"}">
                            ${p.delay>0?`+${p.delay} tick${p.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,e+=`<div class="pm-resp__detail">${b(p.detail)}</div>`,e+='<div class="pm-resp__costs">',p.cost&&(e+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${me(p.cost)}</span>`),p.qualityImpact&&p.qualityImpact!==0&&(e+=`<span class="pm-resp__cost" style="color:${p.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${p.qualityImpact>0?"+":""}${p.qualityImpact}</span>`),!p.cost&&(!p.qualityImpact||p.qualityImpact===0)&&(e+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),e+="</div>",f&&(e+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${m}" onclick="event.stopPropagation();confirmEventResponse('${i.id}','${p.key}')">CONFIRM</button>
                        </div>`),e+="</div>"}}!a&&i.resolution&&(e+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${b(i.resolution)}</div>
                </div>`),e+="</div>"}e+="</div></div>"}return e}function Ya(o){if(o.materials.length===0)return'<div class="pm-evt-empty">No materials required for this project.</div>';let e='<div class="pm-tab-header">Project Materials</div>';for(const t of o.materials){const i=t.required>0?Math.round(t.allocated/t.required*100):0;t.allocated>0&&Math.round(t.consumed/t.allocated*100);const n=t.allocated>=t.required,a=n?"var(--green)":t.allocated>0?"var(--amber)":"var(--red)",s=n?"FULLY ALLOCATED":t.allocated>0?"PARTIAL":"NONE ALLOCATED";e+='<div class="pm-mat" style="margin-bottom:14px;">',e+=`<div class="pm-mat__row1">
            <div class="pm-mat__left">
                <span class="pm-mat__name">${b(t.name)}</span>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:${a};">${t.allocated} / ${t.required} allocated · ${s}</span>
        </div>`,e+=`<div class="pm-mat__bar-row">
            <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${i}%;background:${a};"></div></div>
            <span class="pm-mat__pct">${t.consumed} consumed</span>
        </div>`;const r=["STD","LOW","HIGH"],c=t.required-t.allocated;for(const p of r){const f=t.warehouseStock[p]||{qty:0},l=t.tiers[p]||{qty:0,consumed:0},m=l.qty-l.consumed;if(f.qty===0&&l.qty===0)continue;const u=p==="HIGH"?"var(--green)":p==="LOW"?"var(--orange)":"var(--text-muted)",y=p==="HIGH"?"HIGH":p==="LOW"?"LOW":"STD";if(e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.7rem;">',e+='<div style="display:flex;align-items:center;gap:6px;">',e+=`<span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${u};width:32px;">${y}</span>`,e+=`<span style="color:var(--text-dim);">Warehouse: <strong style="color:var(--text-primary);">${f.qty}</strong></span>`,l.qty>0&&(e+=`<span style="color:var(--text-dim);margin-left:8px;">Allocated: <strong style="color:var(--text-primary);">${l.qty}</strong></span>`),e+="</div>",e+='<div style="display:flex;gap:4px;">',f.qty>0&&c>0){const x=Math.min(f.qty,c);e+=`<button class="pm-alloc-btn" onclick="pmAllocateMaterial('${t.key}','${p}',${x})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Allocate ${x}</button>`}m>0&&(e+=`<button class="pm-alloc-btn" onclick="pmDeallocateMaterial('${t.key}','${p}',${m})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Return ${m}</button>`),e+="</div></div>"}e+="</div>"}return e}function Qa(o){if(o.equipment.length===0)return'<div class="pm-evt-empty">No equipment required for this project.</div>';let e='<div class="pm-tab-header">Project Equipment</div>';for(const t of o.equipment){const i=t.condition>=75?"var(--green)":t.condition>=50?"var(--amber)":t.condition>=25?"var(--orange)":"var(--red)",n=t.assignedToProject>=t.required,a=t.assignedToProject>0&&t.assignedToProject<t.required,s=n?"var(--green)":a||t.ownedTotal>0?"var(--amber)":"var(--red)",r=n?`${t.assignedToProject}/${t.required} DEPLOYED`:a?`${t.assignedToProject}/${t.required} PARTIAL`:t.ownedTotal>0?"NOT DEPLOYED":"NOT OWNED";e+=`<div class="pm-eq" style="margin-bottom:12px;">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${b(t.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${s};margin-left:8px;">${r}</span>
                </div>
            </div>`,t.assignedToProject>0&&(e+=`<div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${t.condition}%;background:${i}"></div></div>
                <span class="pm-eq__cond-val" style="color:${i}">${t.condition}%</span>
            </div>`);const c=Math.min(t.available,t.required-t.assignedToProject);e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:0.7rem;">',e+=`<span style="color:var(--text-dim);">Required: <strong style="color:${n?"var(--green)":"var(--red)"}">${t.required}</strong>`,e+=` · Owned: <strong style="color:var(--text-primary);">${t.ownedTotal}</strong>`,e+=` · Available: <strong style="color:var(--text-primary);">${t.available}</strong></span>`,e+='<div style="display:flex;gap:4px;">',c>0&&(e+=`<button onclick="pmDeployEquipment('${t.key}',${c})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Deploy ${c}</button>`),t.assignedToProject>0&&(e+=`<button onclick="pmUndeployEquipment('${t.key}')" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Undeploy</button>`),e+="</div></div>",e+="</div>"}return e}function je(o){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][o%12]}, ${2e3+Math.floor(o/12)}`}async function Ka(o,e){if(!d||!z)return;const t=prompt(`REQUEST CONSTRUCTION INSURANCE
`+"─".repeat(35)+`

Describe what this policy should cover:

e.g., "Full coverage for weather delays, material damage, and labor disputes during construction. Should cover cost overruns up to 20% of budget."

Insurance corps will see this in their Deal Flow.`);if(t===null)return;const i=t.trim()||"Construction Insurance",n=z.current_tick||0,{error:a}=await v.from("finance_loan_requests").insert({requesting_faction_id:d.id,nation_id:d.nation_id,request_type:"insurance",insured_contract_id:o,amount:e,term_months:0,purpose:i,status:"open",created_tick:n,expires_tick:n+12});if(a){a.message.includes("duplicate")||a.message.includes("unique")?alert("Insurance already requested for this project."):alert("Failed to request insurance: "+a.message);return}alert("Insurance request posted to Deal Flow. Insurance corporations can now offer coverage."),await bi()}window.requestInsurance=Ka;window.openProjectModal=tt;window.closeProjectModal=Fa;window.pmSetTab=Ua;window.pmToggleEvent=Ha;window.pmSelectResponse=Ga;window.pmAllocateMaterial=qa;window.pmDeallocateMaterial=Oa;window.pmDeployEquipment=Da;window.pmUndeployEquipment=ja;window.pmAssignWorkers=Ba;window.pmUnassignWorkers=Pa;async function xi(o){if(!q)return;const{data:e,error:t}=await v.from("construction_events").select("*").eq("contract_id",o).order("fired_at_tick",{ascending:!1});t?(console.warn("Failed to load project events:",t.message),q.events=[]):q.events=(e||[]).map(i=>({id:i.id,type:i.type,severity:i.severity,tick:i.fired_at_tick,title:i.title,desc:i.description,impact:i.impact,status:i.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:i.resolution,responses:i.responses||[]})),Ke()}let Fo=!1;async function Ja(o,e){if(!(Fo||!q)){Fo=!0;try{const{data:t,error:i}=await v.rpc("resolve_construction_event",{p_event_id:o,p_response_key:e});if(i){console.error("Failed to resolve event:",i.message),alert("Failed to submit response: "+i.message);return}const n=typeof t=="string"?JSON.parse(t):t;if(n?.error){alert("Error: "+n.error);return}await xi(q.project.id),await bi(),n?.quality_applied&&n.quality_applied!==0&&(q.quality=Math.max(0,Math.min(100,q.quality+n.quality_applied)),q.qualityLabel=q.quality>=80?"STRONG":q.quality>=60?"PROMISING":q.quality>=40?"FAIR":"UNCERTAIN"),Ke()}finally{Fo=!1}}}window.confirmEventResponse=Ja;function Le(o,e,t){const i=t?` style="color:${t}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${b(o)}</span>
        <span class="cd-detail-row__value"${i}>${b(e)}</span>
    </div>`}function Xa(o){const e={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},t=o.drawing_number||o.contract_number+"-A1",i=z?.current_date||"",n=i?i.replace(/,\s*/," "):"",a=o.spec_category==="Heavy Infrastructure",s=o.spec_category==="Megaproject";let r=b(o.project_subtype||o.project_type||"STRUCTURE"),c=a?"80.0m":s?"200.0m":"60.0m",p=a?"40.0m":s?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${e.bg}">
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
    </svg>`}async function Je(){if(!d||!d.nation_id)return;const{data:o,error:e}=await v.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(e)console.warn("Failed to load contracts:",e.message),st=[];else{const t=Number(d.corp_reputation??0);st=(o||[]).filter(i=>t>=(i.min_reputation||0))}if(bt={},d&&st.length>0){const t=st.map(n=>n.id),{data:i}=await v.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",d.id).in("contract_id",t);for(const n of i||[])bt[n.contract_id]=n}vi()}function Za(){const o=document.getElementById("ap-list"),e=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=K.length+" ACTIVE",K.length===0){o.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,e.style.display="none";return}const t=z?.current_tick||0;let i=0,n=0,a="";for(const s of K){const r=s.issuer_type==="GOVERNMENT",c=r?"gov":"private",p=Array.isArray(s.contract_bids)?s.contract_bids[0]:s.contract_bids,f=p?.bid_price||0,l=p?.estimated_cost||0,m=p?.estimated_quality||0,u=s.budget_ceiling||0,y=s.awarded_at_tick||t,x=s.stalled_ticks||0,g=Math.max(0,t-y),$=Math.max(0,g-x),h=s.timeline_ticks||8,k=Math.max(0,h-$),I=Math.min(100,Math.round($/h*100)),T=$>h,w=x>0;let C="";if(w){const E=s.required_workforce||{},R=s.workers_assigned||{},M=[];(Number(R.general)||0)<(Number(E.general)||0)&&M.push("General: "+(Number(R.general)||0)+"/"+(Number(E.general)||0)),(Number(R.skilled)||0)<(Number(E.skilled)||0)&&M.push("Skilled: "+(Number(R.skilled)||0)+"/"+(Number(E.skilled)||0)),(Number(R.innovative)||0)<(Number(E.innovative)||0)&&M.push("Innovative: "+(Number(R.innovative)||0)+"/"+(Number(E.innovative)||0)),M.length>0?C="Workers needed — "+M.join(", "):C="Materials needed — allocate from warehouse"}ui(s.sector);const L=Sn(s.sector);i+=u,n+=f,a+=`<div class="ap-item" onclick="openProjectModal('${s.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${b(s.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${b(s.issuer_name||"—")} · ${L}</div>
                </div>
                <span class="oc-item__type-badge ${c}">${r?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS${w?' <span style="color:var(--orange);font-weight:700;font-size:7px;">⚠ STALLED ('+x+" ticks) — "+b(C)+"</span>":""}</span>
                    <span class="ap-budget__values" style="color:${T?"var(--red)":w?"var(--orange)":"var(--teal)"}">
                        ${$}/${h} ticks ${T?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${I}%;background:${T?"var(--red)":w?"var(--orange)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${me(f)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${me(l)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${m>=70?"var(--green)":m>=40?"var(--teal)":"var(--orange)"}">${m}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${T?"var(--red)":"var(--text-bright)"}">${k} ticks</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">INSURANCE</div>
                    ${s._hasInsurance?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--green);">INSURED</div>':s._insurancePending?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--orange);">PENDING</div>':`<div class="ap-detail-cell__value" style="font-size:8px;cursor:pointer;color:#aa7a5a;font-weight:700;text-decoration:underline;" onclick="event.stopPropagation();requestInsurance('${s.id}',${u})">INSURE</div>`}
                </div>
            </div>
        </div>`}o.innerHTML=a,e.style.display=K.length>0?"":"none",K.length>0&&(document.getElementById("ap-total-crew").textContent=K.length,document.getElementById("ap-total-budget").textContent=me(i),document.getElementById("ap-total-spent").textContent=me(n))}async function bi(){if(!d)return;const{data:o,error:e}=await v.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",d.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",d.id).order("awarded_at_tick",{ascending:!0});if(e?(console.warn("Failed to load active projects:",e.message),K=[]):K=o||[],K.length>0){const t=K.map(r=>r.id),{data:i}=await v.from("finance_loan_requests").select("insured_contract_id, status").eq("request_type","insurance").in("insured_contract_id",t),{data:n}=await v.from("finance_active_loans").select("request_id, finance_loan_requests!inner(insured_contract_id)").in("status",["current"]).eq("finance_loan_requests.request_type","insurance"),a=new Set((n||[]).map(r=>r.finance_loan_requests?.insured_contract_id).filter(Boolean)),s=new Set((i||[]).filter(r=>r.status==="open").map(r=>r.insured_contract_id));for(const r of K)r._hasInsurance=a.has(r.id),r._insurancePending=s.has(r.id)}Za()}const wo=3e4;function ko(){let o=0,e=0;for(const t of qt)for(const i of kn){const n=Z[t.key]?.[i];n&&(o+=n.qty,e+=n.value)}return{totalUnits:o,totalValue:e}}function zn(){const o=document.getElementById("wh-list"),{totalUnits:e,totalValue:t}=ko();document.getElementById("wh-count").textContent=e.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=B(t);const i=Math.round(e/wo*100),n=document.getElementById("wh-capacity");n.textContent=i+"%",n.style.color=i>80?"var(--red)":i>50?"var(--orange)":"var(--green)";let a="";for(let s=0;s<qt.length;s++){const r=qt[s],c=fn===s,p=Z[r.key]?.LOW||{qty:0,value:0},f=Z[r.key]?.STD||{qty:0,value:0},l=Z[r.key]?.HIGH||{qty:0,value:0},m=p.qty+f.qty+l.qty,u=p.value+f.value+l.value,y=m===0,x=Ge(r.key,"LOW",S),g=Ge(r.key,"STD",S),$=Ge(r.key,"HIGH",S),h=p.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",k=f.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",I=$.available?l.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(a+='<div class="wh-row">',a+=`<div class="wh-row__collapsed${c?" expanded":""}" onclick="toggleWhRow(${s})">
            <span class="wh-row__arrow">${c?"▾":"▸"}</span>
            <span class="wh-row__name${y?" empty":""}">${b(r.name)}</span>
            <div class="wh-row__dots">
                <div class="${h}"></div>
                <div class="${k}"></div>
                <div class="${I}"></div>
            </div>
            <span class="wh-row__qty${y?" empty":""}">${m>0?m.toLocaleString():"—"}</span>
            <span class="wh-row__val${y?" empty":""}">${u>0?B(u):"—"}</span>
        </div>`,c){a+='<div class="wh-expand">',a+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const T=[{key:"LOW",label:"Low",data:p,avail:x,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:f,avail:g,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:l,avail:$,color:"var(--green)",dotClass:"wh-dot--high"}];for(const w of T){const C=!w.avail.available,L=w.data.qty>0,E=L?"$"+Math.round(w.data.value/w.data.qty):"—";a+=`<div class="wh-grade${C?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${w.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${C?"var(--red)":w.color}">${w.label}</span>
                        ${C?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${L?"var(--text-bright)":"var(--text-dim)"}">${L?w.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${w.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${w.data.value>0?B(w.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${E}</span>
                </div>`}for(const w of T)!w.avail.available&&w.avail.failedStat&&(a+=`<div class="wh-lock">
                        <span class="wh-lock__text">${w.label.toUpperCase()} GRADE LOCKED — ${b(w.avail.failedStat)} &lt; ${w.avail.failedMin}</span>
                    </div>`);a+="</div>"}a+="</div>"}o.innerHTML=a}function es(o){fn=fn===o?-1:o,zn()}async function _i(){if(!d)return;const{data:o,error:e}=await v.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",d.id);Z={};const t=[];if(e)console.warn("Failed to load warehouse:",e.message);else if(o){for(const i of o){const n=lo(i.material_key);Z[n]||(Z[n]={}),Z[n][i.quality_tier]={qty:i.quantity||0,value:Number(i.total_value)||0},n!==i.material_key&&t.push(i)}if(t.length>0){const i=t.map(n=>({faction_id:d.id,nation_id:d.nation_id,material_key:lo(n.material_key),quality_tier:n.quality_tier,quantity:n.quantity||0,total_value:Number(n.total_value)||0,updated_at:new Date().toISOString()}));await v.from("corp_warehouse").upsert(i,{onConflict:"faction_id,material_key,quality_tier"});for(const n of t)await v.from("corp_warehouse").delete().eq("faction_id",d.id).eq("material_key",n.material_key).eq("quality_tier",n.quality_tier)}}zn()}const ts={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function os(){const o=(S?.name||d?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+o;const e=Number(d?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=B(e);const{totalUnits:t}=ko(),i=Math.round(t/wo*100),n=document.getElementById("pr-wh-capacity");n.textContent=i+"%",n.style.color=i>80?"var(--red)":i>50?"var(--orange)":"var(--green)",hi(),Tn(),Eo()}function hi(){const o=document.getElementById("pr-mat-grid");let e="";for(const t of qt){const i=de===t.key,n=kn.every(s=>!Ge(t.key,s,S).available),a="pr-mat-btn"+(i?" active":"")+(n?" all-locked":"");e+=`<span class="${a}" onclick="setPrMat('${t.key}')">${b(t.name)}</span>`}o.innerHTML=e}function Tn(){const o=document.getElementById("pr-tier-bar");let e='<span class="pr-tier-label">GRADE</span>';for(const t of kn){const i=Ge(de,t,S),n=J===t,a=i.available?En(de,t,S):null,s=di[t],r=!i.available,c="pr-tier-btn"+(n?" active":"")+(r?" locked":"");e+=`<div class="${c}" onclick="${r?"":`setPrTier('${t}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${s};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${n?"var(--text-bright)":"var(--text-dim)"}">${cn[t]}</span>
            </div>
            ${a!==null?`<div class="pr-tier-btn__price" style="color:${n?"var(--text-bright)":"var(--text-muted)"}">$${a}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}o.innerHTML=e}function Eo(){const o=document.getElementById("pr-content"),e=Ge(de,J,S),t=qt.find(T=>T.key===de);if(!t)return;if(!e.available){o.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${b(t.name)} — ${cn[J]} grade
                    is not produced domestically in ${b(S?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${b(e.failedStat||"unknown")} &lt; ${e.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const i=En(de,J,S),n=li(de,J,S),a=i*_e,s=n>3e3?"LOW":n>1e3?"MODERATE":"HIGH",r=s==="LOW"?"var(--green)":s==="MODERATE"?"var(--amber)":"var(--red)",c=Number(S?.inflation??50),p=c>55?"up":c<45?"down":"flat",f=p==="up"?"&#9650;":p==="down"?"&#9660;":"&#8212;",l=p==="up"?"var(--red)":p==="down"?"var(--green)":"var(--text-dim)";let m="";m+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
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
    </div>`,m+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${b(S?.name||"—")})</div>`;for(const T of t.priceDrivers){const w=Number(S?.[T]??50),C=w>=50?"var(--green)":w>=30?"var(--amber)":w>=15?"var(--orange)":"var(--red)",L=ts[T]||T;m+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${b(T)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${w}%;background:${C}"></div>
            </div>
            <span class="pr-driver-row__val">${w}</span>
            <span class="pr-driver-row__effect">${b(L)}</span>
        </div>`}m+="</div>";const y=(Number(d?.corp_cash_reserves)||0)>=a,x=_e>n,{totalUnits:g}=ko(),$=wo-g,h=_e>$,k=$<=0,I=di[J];m+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${b(t.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${I};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${I}">${cn[J]}</span>
                </div>
                <span class="pr-order__mat-price">$${i}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(T=>`<span class="pr-qty-btn${_e===T?" active":""}" onclick="setPrQty(${T})">${T>=1e3?T/1e3+"k":T}</span>`).join("")}
                </div>
            </div>
            ${x?`<div class="pr-supply-warn">
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
                    <div class="pr-order__total-value">${B(a)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${y&&!x&&!h&&!k?"":"disabled"}
                    title="${y?x?"Exceeds supply":k?"Warehouse full":h?"Exceeds warehouse capacity":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,o.innerHTML=m}function ns(o){de=o,J="STD";for(const e of["STD","HIGH","LOW"])if(Ge(o,e,S).available){J=e;break}hi(),Tn(),Eo()}function is(o){J=o,Tn(),Eo()}function as(o){_e=o,Eo()}let Uo=!1;async function ss(){if(Uo||!d||!S)return;const o=En(de,J,S),e=li(de,J,S),t=o*_e,i=Number(d.corp_cash_reserves)||0;if(t>i){alert("Insufficient cash reserves.");return}if(_e>e){alert("Exceeds available supply this tick.");return}const{totalUnits:n}=ko(),a=wo-n;if(a<=0){alert("Warehouse is full. Cannot purchase more materials.");return}if(_e>a){alert(`Warehouse can only hold ${a.toLocaleString()} more units. Reduce quantity.`);return}Uo=!0;const s=document.querySelector(".pr-purchase-btn");s&&(s.disabled=!0,s.textContent="...");try{const r=i-t,{error:c}=await v.from("factions").update({corp_cash_reserves:r}).eq("id",d.id);if(c)throw c;const p=lo(de),f=Z[p]?.[J],l=(f?.qty||0)+_e,m=(f?.value||0)+t,{error:u}=await v.from("corp_warehouse").upsert({faction_id:d.id,nation_id:d.nation_id,material_key:p,quality_tier:J,quantity:l,total_value:m,last_purchased_tick:z?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(u){const{error:y}=await v.from("factions").update({corp_cash_reserves:i}).eq("id",d.id);throw y&&console.error("Cash refund failed after warehouse error:",y.message),u}d.corp_cash_reserves=r,Z[p]||(Z[p]={}),Z[p][J]={qty:l,value:m},zn(),os(),s&&(s.textContent="PURCHASED",setTimeout(()=>{s.isConnected&&(s.disabled=!1,s.textContent="PURCHASE")},1500))}catch(r){s&&(s.disabled=!1,s.textContent="PURCHASE"),alert("Purchase failed: "+(r.message||"Unknown error"))}finally{Uo=!1}}function $i(o){const e=Ve||S;if(!e)return[];const t=$o(o);if(!t)return[];const i=Sa(o,e),n=[],a=Number(e?.inflation??50),s=Number(e?.fuel_prices??50);Number(e?.manufacturing_output??50);const r=Ve&&S&&Ve.id!==S.id;let c=null;if(r&&(c=za(e,S)),i.newAvailable>0){const p=oi(o,e),f=t.basePrice,l=Math.round(f*((a-50)/200)),m=Math.round(f*((s-50)/300));let u=p;const y=[{label:"Base price",value:B(f)},l!==0?{label:`Inflation (${a})`,mod:(l>=0?"+":"")+B(Math.abs(l))}:null,m!==0?{label:`Fuel transport (${s})`,mod:(m>=0?"+":"")+B(Math.abs(m))}:null].filter(Boolean),x=p-f-l-m;if(x!==0&&!r&&y.push({label:"Demand/scarcity",mod:(x>=0?"+":"")+B(Math.abs(x))}),r&&c){const g=Math.round(p*c.tariff),$=Math.round(p*c.transport);u=p+g+$,y.push({label:`Import tariff (${Math.round(c.tariff*100)}%)`,mod:"+"+B(g)}),y.push({label:`Transport (${c.deliveryTicks} tick${c.deliveryTicks>1?"s":""})`,mod:"+"+B($)})}n.push({seller:r?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:r?c?.deliveryTicks||1:0,condition:100,price:Math.round(u),available:i.newAvailable,delivery:r?c.deliveryTicks+" tick"+(c.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:r?c.deliveryTicks:0,used:!1,priceFactors:y,sourceNationId:e.id})}if(i.usedAvailable>0){const p=i.usedCondition,f=oi(o,e,{used:!0,condition:p});let l=f;const m=[{label:"Base price",value:B(t.basePrice)},{label:`Condition (${p}%)`,mod:"-"+B(Math.max(0,t.basePrice-f))}];if(r&&c){const u=Math.round(f*c.tariff),y=Math.round(f*c.transport);l=f+u+y,m.push({label:`Import tariff (${Math.round(c.tariff*100)}%)`,mod:"+"+B(u)}),m.push({label:`Transport (${c.deliveryTicks} tick${c.deliveryTicks>1?"s":""})`,mod:"+"+B(y)})}n.push({seller:r?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:r?c?.deliveryTicks||1:0,condition:p,price:Math.round(l),available:i.usedAvailable,delivery:r?c.deliveryTicks+" tick"+(c.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:r?c.deliveryTicks:0,used:!0,priceFactors:m,sourceNationId:e.id})}return n}function In(){const o=Number(d?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=B(o);const e=$o(fe),t=Ot[e?.tier||1],i=document.getElementById("em-tier-badge");i&&(i.textContent=t.tag,i.style.color=t.color),i.style.background=t.color+"0a",i.style.border="1px solid "+t.color+"33";const n=document.getElementById("em-nation-select");if(n&&n.options.length===0){const r=S?.name||d?.nation||"—";let c=`<option value="">${b(r)} (HQ)</option>`;for(const p of fi)p.id!==S?.id&&(c+=`<option value="${p.id}">${b(p.name)}</option>`);n.innerHTML=c}const a=document.getElementById("em-import-tag"),s=Ve&&S&&Ve.id!==S.id;a&&(a.style.display=s?"":"none"),rs(),Nn()}function rs(){let o="";for(let e=1;e<=3;e++){const t=Ot[e],i=pn(e),n=e===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";o+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${t.color}">${t.tag}</div>
            <div class="${n}">`;for(const a of i){const s=fe===a.key,r=$i(a.key).length>0;o+=`<span class="em-selector__btn${s?" active":""}${r?"":" no-listings"}"
                style="${s?"background:"+t.color+";border-color:"+t.color:""}"
                onclick="setEmType('${a.key}')">${b(a.name)}</span>`}o+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${o}</div>`}function Nn(){const o=document.getElementById("em-content");if(qe=$i(fe),qe.length===0){o.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}ke>=qe.length&&(ke=0);let e="";for(let i=0;i<qe.length;i++){const n=qe[i],a=ke===i,s=n.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",r=ci(n.condition);e+=`<div class="em-listing${a?" selected":""}" style="${a?"border-left-color:"+s:""}" onclick="setEmListing(${i})">`,e+=`<div class="em-listing__row1">
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
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${B(n.price)}</div>
            </div>
        </div>`,a&&n.priceFactors&&(e+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${n.priceFactors.map(c=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${b(c.label)}</span>
                    <span class="em-breakdown__mod" style="color:${c.mod?c.mod.startsWith("-")?"var(--green)":c.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${c.mod||c.value}</span>
                </div>`).join("")}
            </div>`),e+="</div>"}const t=qe[ke];if(t){const i=$o(fe),n=Ot[i?.tier||1],a=Math.min(t.available,4),s=t.price*Ce,r=(Number(d?.corp_cash_reserves)||0)>=s;e+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${b(i?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${b(t.seller)}</span>
                </div>
                <span class="em-purchase__price">${B(t.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:a},(c,p)=>p+1).map(c=>`<span class="em-qty-btn${Ce===c?" active":""}" style="${Ce===c?"background:"+n.color+";border-color:"+n.color:""}" onclick="setEmQty(${c})">${c}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${t.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${B(s)}</div>
                    ${t.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${b(t.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${n.color}" onclick="purchaseEquipment()"
                    ${r?"":"disabled"}
                    title="${r?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}o.innerHTML=e}async function ls(o){if(!o)Ve=null;else{let t=fi.find(i=>i.id===o);if(!t)try{const{data:i}=await v.from("nations").select("*").eq("id",o).single();t=i}catch{}Ve=t||null}ke=0,Ce=1;const e=document.getElementById("em-nation-select");e&&(e.value=o||""),In()}function ds(o){fe=o,ke=0,Ce=1,In()}function cs(o){ke=o,Ce=1,Nn()}function ps(o){Ce=o,Nn()}let Ho=!1;async function fs(){if(Ho)return;const o=qe[ke];if(!o||!d)return;const e=$o(fe);if(!e)return;const t=Ce,i=o.price*t,n=Number(d.corp_cash_reserves)||0;if(i>n){alert("Insufficient cash reserves.");return}if(t>o.available){alert("Not enough units available.");return}const a=document.querySelector(".em-purchase-btn");a&&(a.disabled=!0,a.textContent="..."),Ho=!0;try{const s=n-i,{error:r}=await v.from("factions").update({corp_cash_reserves:s}).eq("id",d.id);if(r)throw r;const c=!o.deliveryTicks||o.deliveryTicks===0;if(c){const f=ie.find(k=>k.equipment_key===fe),l=(f?.owned||0)+t,m=f?.purchase_price_avg||0,u=f?.owned||0,y=u>0?Math.round((m*u+o.price*t)/l):o.price,x=e.maintenancePerUnit*l,g=f?.condition||100,$=Math.round((g*u+o.condition*t)/l),{error:h}=await v.from("corp_equipment").upsert({faction_id:d.id,nation_id:d.nation_id,equipment_key:fe,tier:e.tier,owned:l,deployed:f?.deployed||0,condition:$,maintenance_per_tick:x,purchase_price_avg:y,last_purchased_tick:z?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(h){const{error:k}=await v.from("factions").update({corp_cash_reserves:n}).eq("id",d.id);throw k&&console.error("Cash refund failed:",k.message),h}f?(f.owned=l,f.condition=$,f.maintenance_per_tick=x):ie.push({equipment_key:fe,tier:e.tier,owned:l,deployed:0,condition:$,maintenance_per_tick:x,assigned_projects:[]})}else{const f=(z?.current_tick||0)+o.deliveryTicks,{error:l}=await v.from("corp_equipment_deliveries").insert({faction_id:d.id,equipment_key:fe,quantity:t,condition:o.condition,delivery_tick:f,source_nation_id:o.sourceNationId||null,seller_name:o.seller,price_paid:i});if(l){const{error:m}=await v.from("factions").update({corp_cash_reserves:n}).eq("id",d.id);throw m&&console.error("Cash refund failed:",m.message),l}}d.corp_cash_reserves=s,Bn(),In();const p=document.getElementById("pr-cash");p&&(p.textContent=B(s)),a&&(a.textContent=c?"PURCHASED":"ORDERED",setTimeout(()=>{a.isConnected&&(a.disabled=!1,a.textContent="PURCHASE")},1500))}catch(s){a&&(a.disabled=!1,a.textContent="PURCHASE"),alert("Purchase failed: "+(s.message||"Unknown error"))}finally{Ho=!1}}let ms=-1,rt=[],fo=[],gn=[];function Go(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o.toLocaleString()}function us(o,e,t){if(t)return"var(--orange)";const i=o/(e||1)*100;return i>50?"var(--green)":i>25?"var(--amber)":"var(--red)"}function si(){const o=document.getElementById("pm-list"),e=rt.length,t=fo.length,i=gn.length,n=rt.filter(c=>c.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${e})`,document.getElementById("pm-pending-count").textContent=`(${t})`,document.getElementById("pm-apply-count").textContent=`(${i})`;const a=document.getElementById("pm-badges");let s="";n>0&&(s+=`<span class="pm-badge pm-badge--expiring">${n} EXPIRING</span>`),t>0&&(s+=`<span class="pm-badge pm-badge--pending">${t} PENDING</span>`),a.innerHTML=s;const r=rt.reduce((c,p)=>c+(p.cost||0),0)+fo.reduce((c,p)=>c+(p.cost||0),0);document.getElementById("pm-total-cost").textContent=Go(r),document.getElementById("pm-footer-active").textContent=e,document.getElementById("pm-footer-pending").textContent=t;{if(e===0){o.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let c="";rt.forEach((p,f)=>{const l=ms===f,m=us(p.ticks_left,p.total_ticks,p.expiring_soon),u=Math.min(p.ticks_left/(p.total_ticks||1)*100,100);c+=`<div class="pm-item ${p.expiring_soon?"pm-item--expiring":""} ${l?"expanded":""}" onclick="togglePmExpand(${f})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${b(p.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${b((p.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${m}">Expires: ${b(p.expires||"")}</span>
                        <span class="pm-item__ticks">(${p.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${u}%;background:${m}"></div></div>`,l&&(c+=`<div class="pm-detail">
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
                        <span class="pm-detail__val">${Go(p.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${p.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${p.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(p.projects||[]).map(y=>`<span class="pm-project-chip">${b(y)}</span>`).join("")}</div>
                    </div>`,p.note&&(c+=`<div class="pm-note"><span class="pm-note__text">${b(p.note)}</span></div>`),p.expiring_soon&&p.renewable&&(c+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew" onclick="event.stopPropagation(); pmApplyForPermit('${p.permit_key}');">RENEW — ${Go(p.cost||0)}</button></div>`),c+="</div>"),c+="</div></div>"}),o.innerHTML=c;return}}let Vo=!1;async function ys(o){if(!(Vo||!d||!S)){Vo=!0;try{const{data:e}=await v.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{data:i,error:n}=await v.rpc("apply_for_permit",{p_faction_id:d.id,p_nation_id:S.id,p_permit_key:o,p_current_tick:t});if(n){alert("Application failed: "+n.message);return}if(i&&!i.success){alert(i.error||"Application failed");return}alert("Permit application submitted! Processing: "+(i.processing_ticks||0)+" ticks."),await vs()}catch(e){alert("Error: "+e.message)}finally{Vo=!1}}}window.pmApplyForPermit=ys;async function vs(){if(!d||!S){rt=[],fo=[],gn=[],si();return}const{data:o}=await v.from("construction_permits").select("*"),e=o||[],t={};for(const l of e)t[l.permit_key]=l;const{data:i}=await v.from("corp_permits").select("*").eq("faction_id",d.id).eq("nation_id",S.id),n=i||[],{data:a}=await v.from("active_laws").select("policy_id, policies(permit_key, policy_name)").eq("nation_id",S.id).not("policies.permit_key","is",null),s=new Set,r={};for(const l of a||[])l.policies?.permit_key&&(s.add(l.policies.permit_key),r[l.policies.permit_key]=l.policies.policy_name);const{data:c}=await v.from("shard").select("current_tick").eq("name","Alpha Shard").single(),p=c?.current_tick||0;rt=n.filter(l=>l.status==="active").map(l=>{const m=t[l.permit_key]||{},u=l.expires_at_tick?Math.max(0,l.expires_at_tick-p):999,y=m.duration_ticks||24;return{name:m.name||l.permit_key,permit_key:l.permit_key,nation:S.name,policy:r[l.permit_key]||"—",issued:l.granted_at_tick!=null?je(l.granted_at_tick):"—",expires:l.expires_at_tick?je(l.expires_at_tick):"Single-use",cost:l.cost_paid||0,ticks_left:u,total_ticks:y,expiring_soon:u<=3&&u>0,renewable:m.duration_ticks!=null,projects:[]}}),fo=n.filter(l=>l.status==="pending").map(l=>{const m=t[l.permit_key]||{},u=m.processing_ticks||2,y=p-l.applied_at_tick,x=Math.max(0,u-y);return{name:m.name||l.permit_key,permit_key:l.permit_key,nation:S.name,applied:je(l.applied_at_tick),status:"PROCESSING",processing_total:u,ticks_remaining:x,est_approval:je(l.applied_at_tick+u),cost:l.cost_paid||0,required_by:r[l.permit_key]||"—"}});const f=new Set(n.filter(l=>l.status==="active"||l.status==="pending").map(l=>l.permit_key));gn=[...s].filter(l=>!f.has(l)).map(l=>{const m=t[l]||{};return{name:m.name||l,permit_key:l,nation:S.name,description:m.description||"",policy:r[l]||"—",cost:m.cost_is_percentage?15e4:m.cost||0,processing_time:m.processing_ticks||2,duration:m.duration_ticks?m.duration_ticks+" ticks":"Single-use",category:m.category||"",difficulty:m.difficulty||"EASY"}}),si()}let Wo=!1,Yo=!1;function wi(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+Math.round(o/1e3)+"k":"$"+Math.round(o)}async function Mn(){var{data:o,error:e}=await v.from("factions").select("*").eq("id",d.id).single();if(e){console.warn("Faction refresh failed:",e.message);return}o&&(d=o);var t=document.getElementById("topbar-cash");t&&(t.textContent="CASH: "+wi(Number(d.corp_cash_reserves??0)))}const xn={CRITICAL:"#c55",HIGH:"#5c5",MODERATE:"#ca5",LOW:"#6a6660"};let mt=[],An=[],ki="ready",It=null,mo="ALL",ee=-1;const uo={COASTAL:{color:"#8b9a6b",label:"COASTAL"},INTERNATIONAL:{color:"#5a8aaa",label:"INTL"},GOVERNMENT:{color:"#c8a832",label:"GOV CONTRACT"}};function gs(o){mo=o,ee=-1,document.querySelectorAll(".ar-pill").forEach(e=>{const t=e.getAttribute("data-ar-filter");e.className="ar-pill"+(t===o?" active-"+(o==="ALL"?"all":o==="COASTAL"?"coastal":o==="INTERNATIONAL"?"intl":"gov"):"")}),Ln()}function Rn(){return mo==="ALL"?mt:mt.filter(o=>o.scope===mo)}async function Co(){if(!d||d.corp_sector!=="Shipping")return;const o=await wa(v,d.id,d.corp_subsector);mt=o.routes,An=o.applications,ki=o.state,It=o.error,It&&console.warn("Failed to load available routes:",It.message),ee=-1,Ln()}var xs={fuel_energy:[{stat:"industrialization",label:"Industrialization"},{stat:"urbanization",label:"Urbanization"}],minerals:[{stat:"industrialization",label:"Industrialization"},{stat:"manufacturing",label:"Manufacturing"}],grains_staples:[{stat:"population_growth",label:"Population Growth"},{stat:"food_security",label:"Food Security"}],livestock_dairy:[{stat:"standard_of_living",label:"Std of Living"},{stat:"food_security",label:"Food Security"}],cash_crops:[{stat:"trade_balance",label:"Trade Balance"},{stat:"foreign_investment",label:"Foreign Investment"}],manufactured_goods:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],technology:[{stat:"technology",label:"Technology"},{stat:"higher_education",label:"Higher Education"}],fruits_vegetables:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],arms:[{stat:"military_spending",label:"Military Spending"},{stat:"stability",label:"Stability"}]};function bs(o){return xs[o]||[]}function _s(o){var e=Number(o.competition_count||0),t=o.demand_level||"",i=o.scope==="GOVERNMENT";return i?"Fixed payment. No demand risk. Vessel locked for contract duration.":e===0&&t==="CRITICAL"?"Unserved critical corridor. High volume, no competition — claim immediately.":e===0&&t==="HIGH"?"Virgin route with strong demand. First-mover advantage available.":e===0?"No competition on this route. Market share starts at 100%.":t==="CRITICAL"&&e<=2?"Underserved critical route. Demand exceeds current capacity.":t==="LOW"?"Thin route. Revenue may not justify vessel deployment.":e>=3?"Crowded route. Market share will be split "+(e+1)+" ways.":Number(o.tariff_rate||0)>15?"High tariff rate cuts into margins. Watch for trade policy changes.":null}function Ln(){const o=Rn();document.getElementById("ar-count").textContent=mt.length+" ROUTES";var e={COASTAL:0,INTERNATIONAL:0,GOVERNMENT:0};mt.forEach(function($){e[$.scope]!==void 0&&e[$.scope]++});var t=e.COASTAL,i=e.INTERNATIONAL,n=e.GOVERNMENT;document.getElementById("ar-footer-counts").innerHTML='<div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#8b9a6b"></div><span class="ar-footer__count-label">COASTAL</span><span class="ar-footer__count-num">'+t+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#5a8aaa"></div><span class="ar-footer__count-label">INTL</span><span class="ar-footer__count-num">'+i+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#c8a832"></div><span class="ar-footer__count-label">GOV</span><span class="ar-footer__count-num">'+n+"</span></div>";const a=document.getElementById("ar-claim-btn");a.className="ar-claim-btn"+(ee>=0?" active":"");const s=document.getElementById("ar-list");if(ki==="error"){s.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+b(It&&It.message||"Shipping routes are temporarily unavailable.")+"</div></div>";return}if(o.length===0){s.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+(mt.length===0?"No routes available.<br>Routes are generated from bilateral<br>trade each tick. Check back after<br>the next corp tick fires.":"No "+mo.toLowerCase()+" routes available.")+"</div></div>";return}let r="";for(let $=0;$<o.length;$++){const h=o[$],k=ee===$,I=uo[h.scope]||uo.INTERNATIONAL,T=h.scope==="GOVERNMENT",w=h.demand_level&&xn[h.demand_level]?{color:xn[h.demand_level],label:h.demand_level}:null,C=Number(h.competition_count||0),L=C===0?"#5c5":C<=2?"#ca5":"#c84";r+='<div style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid '+(k?I.color:"transparent")+";background:"+(k?I.color+"08":"transparent")+';" onclick="arSelectRoute('+$+')"><div style="padding:8px 14px;">',r+='<div style="display:flex;align-items:center;gap:0;margin-bottom:4px;"><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+b(h.origin_port||"?")+'</span><div style="flex:1;display:flex;align-items:center;margin:0 8px;"><div style="flex:1;height:1px;background:'+I.color+'44"></div><span style="font-family:var(--font-mono);font-size:7px;color:'+I.color+';padding:0 6px">⚓</span><div style="flex:1;height:1px;background:'+I.color+'44"></div></div><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+b(h.destination_port||"?")+"</span></div>",r+='<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;"><span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+I.color+";background:"+I.color+"12;border:1px solid "+I.color+'25">'+I.label+"</span>",w&&(r+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+w.color+";background:"+w.color+"12;border:1px solid "+w.color+'25">'+w.label+" DEMAND</span>"),T&&h.gov_issuer&&(r+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">'+b(h.gov_issuer)+"</span>"),C===0&&!T&&(r+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15)">NO COMPETITION</span>'),!h.trade_agreement_id&&!T&&(r+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#9e9a92;background:rgba(158,154,146,0.06);border:1px solid rgba(158,154,146,0.15)">OPEN MARKET</span>');var c=An.find(function(E){return E.route_id===h.id});if(c){var p=c.status==="approved"?"#5c5":"#c8a832",f=c.status==="approved"?"APPROVED":"APPLIED";r+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+p+";background:"+p+"12;border:1px solid "+p+'25">'+f+"</span>"}if(r+='<span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-left:auto">'+(h.transit_ticks||"?")+" tick"+((h.transit_ticks||0)!==1?"s":"")+" · "+b(h.vessel_class||"?")+"</span>",r+="</div>",r+='<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">',T?(r+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(h.gov_contract_duration||h.transit_ticks||"?")+" ticks</div></div>",r+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VESSEL</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+b(h.vessel_class||"?")+"</div></div>",r+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT VALUE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-top:1px">'+B(Number(h.gov_contract_value||h.estimated_revenue||0))+"</div></div>"):(r+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VOLUME</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);margin-top:1px">'+B(Number(h.trade_volume||0))+"</div></div>",r+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">COMP.</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+L+';margin-top:1px">'+C+"</div></div>",r+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">TRANSIT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(h.transit_ticks||"?")+" tick"+((h.transit_ticks||0)!==1?"s":"")+"</div></div>",r+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">EST. REV</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;margin-top:1px">'+B(Number(h.estimated_revenue||0))+"</div></div>"),r+="</div>",k){if(r+='<div style="margin-top:6px;">',T&&h.goods_description&&(r+='<div style="font-size:10px;color:var(--text-muted);line-height:1.5;margin-bottom:6px">'+b(h.goods_description)+"</div>"),h.trade_agreement_name&&(r+='<div style="padding:4px 8px;margin-bottom:5px;background:rgba(90,138,170,0.05);border:1px solid rgba(90,138,170,0.12)"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:var(--font-mono);font-size:7px;color:#5a8aaa;letter-spacing:0.5px">TRADE AGREEMENT</div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:1px">'+b(h.trade_agreement_name)+'</div></div><div style="text-align:right"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">TARIFF</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(Number(h.tariff_rate||0)>10?"#c84":"#5c5")+'">'+Number(h.tariff_rate||0).toFixed(1)+"%</div></div></div></div>"),r+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px">',r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VESSEL CLASS</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+b(h.vessel_class||"?")+"</span></div>",h.vessel_note&&(r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">REQUIREMENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+b(h.vessel_note)+"</span></div>"),r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">PROXIMITY</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+(h.proximity!=null?h.proximity:"?")+" / 100</span></div>",r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CARGO</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+b(h.goods_name||"Unknown")+"</span></div>",h.goods_description&&!T&&(r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CONTENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+b(h.goods_description)+"</span></div>"),r+='<div style="display:flex;justify-content:space-between;padding:2px 0"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VOLUME</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+Number(h.volume_physical||0).toLocaleString()+" "+b(h.volume_unit||"tons")+"</span></div>",r+="</div>",S&&!T){var l=bs(h.trade_sector);if(l.length>0){r+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.8px;margin-bottom:3px">DEMAND DRIVERS</div>';for(var m=0;m<l.length;m++){var u=l[m],y=Number(S[u.stat]??50),x=y>=50?"#5c5":y>=30?"#ca5":"#c84";r+='<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);width:100px">'+b(u.label)+'</span><div style="width:40px;height:2px;background:var(--border-0)"><div style="width:'+y+"%;height:100%;background:"+x+'"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-bright)">'+Math.round(y)+"</span></div>"}r+="</div>"}}var g=_s(h);g&&(r+='<div style="padding:4px 8px;background:'+I.color+"08;border:1px solid "+I.color+'15"><div style="font-size:9px;color:var(--text-muted);line-height:1.5">'+b(g)+"</div></div>"),r+="</div>"}r+="</div></div>"}s.innerHTML=r}function hs(o){ee=ee===o?-1:o,Ln()}let _t=null,ht=null,be=0,eo=!1;function $s(){if(!(ee<0||!d||!z)){var o=Rn(),e=o[ee];if(e){var t=An.find(function(s){return s.route_id===e.id});if(t){alert("You have already applied for this route. Status: "+t.status);return}var i={"Bulk Cargo":"bulk_cargo","Container Freight":"container_freight","Specialized Transport":"specialized_transport"},n=i[d.corp_subsector]||"";if(e.shipping_subsector&&n!==e.shipping_subsector){var a=e.shipping_subsector.replace(/_/g," ").replace(/\b\w/g,function(s){return s.toUpperCase()});alert("Your fleet specializes in "+(d.corp_subsector||"?")+" but this route requires "+a+".");return}_t=e,be=Number(e.estimated_revenue||0),ht=null,On()}}}function qn(){_t=null,document.getElementById("ra-modal-overlay")?.remove()}function ws(o){ht=o,On()}function ks(o){be=Number(o),On()}function On(){if(document.getElementById("ra-modal-overlay")?.remove(),!_t)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#5a8aaa",green:"#5c5",gold:"#c8a832",orange:"#c84",red:"#c55",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=_t,i=uo[t.scope]||uo.INTERNATIONAL,n=Number(t.estimated_revenue||0),a=Math.round(n*.15),s=Math.round(n*.08),r=be-a-s,c=r>0?e.green:r<0?e.red:e.dim,p=ce.filter(g=>g.status==="in_port"&&!g.active_claim_id&&g.condition>=20),l=!!p.find(g=>g.id===ht)&&be>0;let m=`
    <div style="width:520px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;max-height:90vh;">
        <div style="padding:12px 20px;border-bottom:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:10px;color:${i.color}">●</span>
                <span style="font-family:${o};font-size:13px;font-weight:700;letter-spacing:2px;color:${e.muted};">ROUTE APPLICATION</span>
            </div>
            <span onclick="raClose()" style="font-family:${o};font-size:18px;color:${e.dim};cursor:pointer">×</span>
        </div>
        <div style="padding:14px 20px;overflow:auto;flex:1;">

            <div style="display:flex;align-items:center;gap:0;margin-bottom:12px;">
                <span style="font-size:14px;font-weight:700;color:${e.text}">${b(t.origin_port||"?")}</span>
                <div style="flex:1;display:flex;align-items:center;margin:0 10px;">
                    <div style="flex:1;height:1px;background:${i.color}44"></div>
                    <span style="font-family:${o};font-size:8px;color:${i.color};padding:0 8px">⚓ ${t.transit_ticks||"?"} tick${(t.transit_ticks||0)!==1?"s":""}</span>
                    <div style="flex:1;height:1px;background:${i.color}44"></div>
                </div>
                <span style="font-size:14px;font-weight:700;color:${e.text}">${b(t.destination_port||"?")}</span>
            </div>

            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};margin-bottom:14px;">
                <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border};">
                    <div style="font-family:${o};font-size:6px;color:${e.dim};letter-spacing:0.5px;">CARGO</div>
                    <div style="font-family:${o};font-size:9px;font-weight:700;color:${e.text};margin-top:1px;">${b(t.goods_name||"?")}</div>
                </div>
                <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border};">
                    <div style="font-family:${o};font-size:6px;color:${e.dim};letter-spacing:0.5px;">VESSEL REQ.</div>
                    <div style="font-family:${o};font-size:9px;font-weight:700;color:${e.text};margin-top:1px;">${b(t.vessel_class||"?")}</div>
                </div>
                <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border};">
                    <div style="font-family:${o};font-size:6px;color:${e.dim};letter-spacing:0.5px;">VOLUME</div>
                    <div style="font-family:${o};font-size:9px;font-weight:700;color:${e.text};margin-top:1px;">${B(Number(t.trade_volume||0))}</div>
                </div>
                <div style="flex:1;padding:4px 8px;">
                    <div style="font-family:${o};font-size:6px;color:${e.dim};letter-spacing:0.5px;">COMPETITION</div>
                    <div style="font-family:${o};font-size:9px;font-weight:700;color:${Number(t.competition_count||0)===0?e.green:e.orange};margin-top:1px;">${t.competition_count||0}</div>
                </div>
            </div>

            <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">SELECT VESSEL</div>`;if(p.length===0)m+=`<div style="padding:14px;text-align:center;background:${e.card};border:1px solid ${e.border};margin-bottom:14px;">
            <div style="font-family:${o};font-size:10px;color:${e.red};">No available vessels</div>
            <div style="font-family:${o};font-size:8px;color:${e.dim};margin-top:4px;">You need a vessel in port, not assigned to another route, with condition ≥ 20%.</div>
        </div>`;else{m+='<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:14px;">';for(const g of p){const $=ht===g.id,h=g.condition>=75?e.green:g.condition>=50?e.gold:e.orange,k=g.fuel>=60?e.green:g.fuel>=30?e.gold:e.red;m+=`<div onclick="raSelectVessel('${g.id}')" style="padding:8px 10px;background:${$?e.accent+"12":e.card};border:1px solid ${$?e.accent+"44":e.border};cursor:pointer;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-size:11px;font-weight:600;color:${e.text};">${b(g.vessel_name)}</span>
                    <span style="font-family:${o};font-size:7px;font-weight:700;padding:1px 5px;color:${i.color};background:${i.color}12;border:1px solid ${i.color}25;">${g.vessel_class.toUpperCase()}</span>
                </div>
                <div style="display:flex;gap:12px;font-family:${o};font-size:8px;">
                    <span style="color:${e.dim};">Condition: <span style="color:${h};font-weight:700;">${g.condition}%</span></span>
                    <span style="color:${e.dim};">Fuel: <span style="color:${k};font-weight:700;">${g.fuel}%</span></span>
                    <span style="color:${e.dim};">Capacity: <span style="color:${e.text};font-weight:700;">${(g.capacity_dwt||0).toLocaleString()} ${g.capacity_unit||"DWT"}</span></span>
                </div>
            </div>`}m+="</div>"}const u=Math.round(n*.5),y=Math.round(n*1.5);m+=`
            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <span style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;">PROPOSED SERVICE RATE</span>
                    <span style="font-family:${o};font-size:16px;font-weight:700;color:${e.gold};">${B(be)}/trip</span>
                </div>
                <input type="range" min="${u}" max="${y}" step="${Math.max(1e3,Math.round(n*.02))}" value="${be}"
                    oninput="raSetRate(this.value)"
                    style="width:100%;accent-color:${e.gold};height:5px;" />
                <div style="display:flex;justify-content:space-between;font-family:${o};font-size:8px;color:${e.dim};margin-top:3px;">
                    <span>50% market (${B(u)})</span>
                    <span style="color:${e.muted};">Market: ${B(n)}</span>
                    <span>150% premium (${B(y)})</span>
                </div>
            </div>`,m+=`
            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">ESTIMATED ECONOMICS (PER TRIP)</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:8px 10px;">
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${o};font-size:9px;color:${e.dim};">Revenue</span>
                        <span style="font-family:${o};font-size:10px;font-weight:700;color:${e.green};">${B(be)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;">
                        <span style="font-family:${o};font-size:9px;color:${e.dim};">Est. Fuel Cost (~15%)</span>
                        <span style="font-family:${o};font-size:10px;color:${e.red};">-${B(a)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${o};font-size:9px;color:${e.dim};">Est. Maintenance (~8%)</span>
                        <span style="font-family:${o};font-size:10px;color:${e.red};">-${B(s)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:5px 0;">
                        <span style="font-family:${o};font-size:10px;font-weight:700;color:${e.text};">NET PROFIT</span>
                        <span style="font-family:${o};font-size:14px;font-weight:700;color:${c};">${r>=0?"+":""}${B(r)}</span>
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
                <div onclick="${l?"raSubmitApplication()":""}" style="padding:7px 16px;font-family:${o};font-size:11px;font-weight:700;letter-spacing:1px;color:${l?"#000":e.dim};background:${l?e.accent:"transparent"};border:1px solid ${l?e.accent:e.border};cursor:${l?"pointer":"not-allowed"};opacity:${l?1:.4};">SUBMIT APPLICATION</div>
            </div>
        </div>
    </div>`;const x=document.createElement("div");x.id="ra-modal-overlay",x.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",x.innerHTML=m,x.addEventListener("click",g=>{g.target===x&&qn()}),document.body.appendChild(x)}async function Es(){if(eo||!_t||!ht||!d||!z)return;eo=!0;const o=_t,e=5e4,{data:t}=await v.from("factions").select("corp_cash_reserves").eq("id",d.id).single(),i=Number(t?.corp_cash_reserves??0);if(i<e){alert("Not enough funds. Application fee: $50k. You have $"+Math.round(i/1e3)+"k."),eo=!1;return}try{const n=i-e,{error:a}=await v.from("factions").update({corp_cash_reserves:n}).eq("id",d.id);if(a){alert("Failed to deduct fee.");return}const{error:s}=await v.from("shipping_applications").insert({route_id:o.id,faction_id:d.id,proposed_rate:be,application_fee:e,status:"pending",applied_at_tick:z.current_tick});if(s){await v.from("factions").update({corp_cash_reserves:i}).eq("id",d.id),alert("Application failed: "+s.message);return}await v.from("event_log").insert({nation_id:o.origin_nation_id,event_name:d.faction_name+" applied to service "+(o.origin_port||"?")+" → "+(o.destination_port||"?"),category:"corporate",description_chosen:d.faction_name+" submitted a shipping application for the "+(o.goods_name||"trade")+" route at a proposed rate of "+B(be)+"/trip. Vessel: "+(ce.find(r=>r.id===ht)?.vessel_name||"Unknown"),fired_at_tick:z.current_tick}).catch(function(r){console.warn("[Shipping] Event log failed:",r.message)}),qn(),await Mn(),ee=-1,await Co(),alert("Application submitted! The government will review your application.")}catch(n){alert("Application failed: "+(n.message||"Network error"))}finally{eo=!1}}async function Cs(){if(!(Wo||ee<0||!d||!z)){var o=Rn(),e=o[ee];if(e){var t=Number(d.shipping_fleet_capacity??0),i=Number(d.shipping_fleet_deployed??0);if(i>=t){alert("No available vessels. Fleet capacity: "+t+", deployed: "+i+".");return}Wo=!0;var n=document.getElementById("ar-claim-btn");n.textContent="CLAIMING...",n.className="ar-claim-btn";try{var{data:a,error:s}=await v.rpc("claim_shipping_route",{p_faction_id:d.id,p_route_id:e.id,p_current_tick:z.current_tick});if(s){alert("Claim failed: "+s.message);return}if(a&&!a.success){alert(a.error||"Claim failed.");return}if(a?.claim_id){var r=(ce||[]).find(function(m){return m.status==="in_port"&&!m.active_claim_id&&m.fuel>=10});if(r){var{error:c}=await v.from("corp_vessels").update({status:"in_transit",active_claim_id:a.claim_id,current_port_nation_id:null}).eq("id",r.id);c&&console.warn("Failed to assign vessel to route:",c.message)}else console.warn("Route claimed but no available vessel with fuel >= 10% to assign.")}try{var p=e.origin_nation?.name||e.origin_nation_id||"Unknown",f=e.destination_nation?.name||e.destination_nation_id||"Unknown",l=e.goods_type||e.cargo_type||"goods";await v.from("event_log").insert({nation_id:d.nation_id,event_name:"Shipping Route Signed",category:"corporate",description_chosen:d.faction_name+" has just signed an agreement to ship "+l+" between "+p+" and "+f+".",fired_at_tick:z.current_tick||0})}catch{}await Mn(),ee=-1,await Promise.all([Co(),So(),ve()])}catch(m){alert("Claim failed: "+(m.message||"Network error"))}finally{Wo=!1,n.textContent="CLAIM ROUTE",n.className="ar-claim-btn"+(ee>=0?" active":"")}}}}let Oe=[],Ei="ready",Nt=null,yo=-1;async function So(){if(!d)return;const o=await ha(v,d.id);Oe=o.claims,Ei=o.state,Nt=o.error,Nt&&console.warn("Failed to load active voyages:",Nt.message),Ci()}function Ss(o){yo=yo===o?-1:o,Ci()}async function zs(o){if(!(Yo||!d||!z)){Yo=!0;try{var{data:e,error:t}=await v.rpc("release_shipping_route",{p_faction_id:d.id,p_claim_id:o,p_current_tick:z.current_tick});if(t){alert("Release failed: "+t.message);return}if(e&&!e.success){alert(e.error||"Release failed.");return}var{error:i}=await v.from("corp_vessels").update({status:"in_port",active_claim_id:null}).eq("active_claim_id",o).eq("faction_id",d.id);i&&console.warn("Failed to free vessel on release:",i.message),yo=-1,await Mn(),await Promise.all([Co(),So(),ve()])}catch(n){alert("Release failed: "+(n.message||"Network error"))}finally{Yo=!1}}}function Ci(){const o=z?.current_tick||0,e=Number(d?.shipping_fleet_capacity??0),t=Number(d?.shipping_fleet_deployed??0),i=d?.corp_subsector||"--";document.getElementById("av-count").textContent=Oe.length+" ACTIVE";const n=Oe.reduce((f,l)=>f+Number(l.total_revenue||0),0),a=Oe.reduce((f,l)=>f+(l.transits_completed||0),0),s=a>0?Math.round(n/a):0;document.getElementById("av-summary").innerHTML=`
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
            <div class="av-summary__value" style="color:var(--green)">${B(s)}</div>
        </div>`,document.getElementById("av-total-revenue").textContent=B(n),document.getElementById("av-total-revenue").style.color=n>0?"var(--green)":"var(--text-dim)",document.getElementById("av-fleet-status").textContent=t+"/"+e,document.getElementById("av-subsector").textContent=i;const r=document.getElementById("av-list");if(Ei==="error"){r.innerHTML='<div class="av-empty"><div class="av-empty__text">'+b(Nt&&Nt.message||"Active voyage data is temporarily unavailable.")+"</div></div>";return}if(Oe.length===0){r.innerHTML='<div class="av-empty"><div class="av-empty__text">No active voyages.<br>Claim a shipping route to<br>deploy your fleet.</div></div>';return}let c="";for(let f=0;f<Oe.length;f++){const l=Oe[f],m=l.shipping_routes||{},u=yo===f,y=l.vessel_status||"idle";let x=y.toUpperCase().replace("_"," "),g="av-status--idle",$="";if(y==="loading")g="av-status--loading",x="LOADING";else if(y==="in_transit"){g="av-status--transit";const C=l.transit_started_tick||o,E=(l.transit_arrives_tick||C+(m.transit_ticks||2))-C,R=Math.max(0,Math.min(o-C,E)),M=E>0?Math.round(R/E*100):0;x="IN TRANSIT ("+R+"/"+E+")",$='<div class="av-transit-bar"><div class="av-transit-bar__fill" style="width:'+M+'%"></div></div>'}const h=Number(l.revenue_per_transit||0),k=Number(l.market_share_pct||0),I=l.transits_completed||0,T=Number(l.total_revenue||0),w=xn[m.demand_level]||"#6a6660";if(c+='<div class="av-item" onclick="avToggle('+f+')"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;"><div class="av-item__route">'+b(m.origin_port||"?")+" → "+b(m.destination_port||"?")+'</div><span class="av-status '+g+'">'+x+'</span></div><div class="av-item__cargo">'+b(m.goods_name||"Unknown")+" · "+b(m.vessel_class||"?")+"</div>"+$+'<div class="av-item__stats"><div class="av-stat"><div class="av-stat__label">REV/TRIP</div><div class="av-stat__value" style="color:var(--green)">'+B(h)+'</div></div><div class="av-stat"><div class="av-stat__label">SHARE</div><div class="av-stat__value">'+k.toFixed(1)+'%</div></div><div class="av-stat"><div class="av-stat__label">TRANSITS</div><div class="av-stat__value">'+I+'</div></div><div class="av-stat"><div class="av-stat__label">TOTAL REV</div><div class="av-stat__value" style="color:var(--green)">'+B(T)+"</div></div></div>",u){c+='<div class="av-item__detail"><div class="av-detail-row"><span class="av-detail-label">ORIGIN</span><span class="av-detail-value">'+b(m.origin_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">DESTINATION</span><span class="av-detail-value">'+b(m.destination_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE SECTOR</span><span class="av-detail-value">'+b((m.trade_sector||"").replace(/_/g," ").toUpperCase())+'</span></div><div class="av-detail-row"><span class="av-detail-label">SCOPE</span><span class="av-detail-value">'+b(m.scope||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRANSIT TIME</span><span class="av-detail-value">'+(m.transit_ticks||"?")+' ticks</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE VOLUME</span><span class="av-detail-value">'+B(Number(m.trade_volume||0))+'</span></div><div class="av-detail-row"><span class="av-detail-label">TARIFF</span><span class="av-detail-value">'+Number(m.tariff_rate||0).toFixed(1)+'%</span></div><div class="av-detail-row"><span class="av-detail-label">COMPETITION</span><span class="av-detail-value">'+(m.competition_count??0)+' corps</span></div><div class="av-detail-row"><span class="av-detail-label">DEMAND</span><span class="av-detail-value" style="color:'+w+'">'+(m.demand_level||"?")+"</span></div>"+(m.trade_agreement_name?'<div class="av-detail-row"><span class="av-detail-label">AGREEMENT</span><span class="av-detail-value" style="color:var(--teal)">'+b(m.trade_agreement_name)+"</span></div>":"")+'<div class="av-detail-row"><span class="av-detail-label">CLAIMED</span><span class="av-detail-value">Tick '+(l.claimed_at_tick||"?")+"</span></div>";var p=(ce||[]).find(function(C){return C.active_claim_id===l.id});!p&&y==="loading"?c+=`<div style="padding:6px 8px;margin-top:4px;background:rgba(200,168,50,0.06);border:1px solid rgba(200,168,50,0.15);text-align:center;"><div style="font-family:var(--font-mono);font-size:9px;color:var(--orange);font-weight:700;margin-bottom:4px;">NO VESSEL ASSIGNED</div><button class="av-action-btn" style="background:var(--teal);color:#fff;border-color:var(--teal);width:100%;" onclick="event.stopPropagation();openAssignVesselModal('`+l.id+"','"+(m.vessel_class||"")+`')">ASSIGN VESSEL</button></div>`:p&&(c+='<div style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:var(--bg-card);border:1px solid var(--border-main);"><div><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">ASSIGNED VESSEL</div><div style="font-size:11px;font-weight:700;color:var(--text-bright);">'+b(p.vessel_name||"Unknown")+'</div></div><div style="display:flex;gap:10px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(p.fuel>50?"#5c5":p.fuel>20?"#ca5":"#c55")+'">'+(p.fuel||0)+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(p.condition>50?"#5c5":p.condition>30?"#ca5":"#c55")+'">'+(p.condition||0)+"%</div></div></div></div>"),c+=`<button class="av-action-btn release" onclick="event.stopPropagation();avRelease('`+l.id+`')">RELEASE ROUTE</button></div>`}c+="</div>"}r.innerHTML=c}function Ts(o,e){const t=(ce||[]).filter(function(a){return a.status==="in_port"&&!a.active_claim_id&&a.fuel>=15&&a.condition>=20});let i;t.length===0?i='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No available vessels.<br>Ships must be in port with 15%+ fuel and 20%+ condition.</div>':i=t.map(function(a,s){var r=a.fuel>50?"#5c5":a.fuel>20?"#ca5":"#c55",c=a.condition>50?"#5c5":a.condition>30?"#ca5":"#c55";return`<div style="padding:10px 14px;border-bottom:1px solid var(--border-0);cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="assignVesselToRoute('`+o+"','"+a.id+`')"><div><div style="font-size:14px;font-weight:700;color:var(--text-bright);">`+b(a.vessel_name||"Unnamed")+'</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+b(a.vessel_class||"?")+" · "+(a.capacity_dwt||0).toLocaleString()+' DWT</div></div><div style="display:flex;gap:14px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+r+'">'+a.fuel+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+c+'">'+a.condition+'%</div></div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--teal);padding:4px 12px;border:1px solid var(--teal);cursor:pointer;">ASSIGN</div></div></div>'}).join("");var n=document.createElement("div");n.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;",n.onclick=function(a){a.target===n&&n.remove()},n.innerHTML='<div style="width:560px;max-width:95vw;max-height:80vh;background:var(--bg-panel);border:1px solid var(--border-main);display:flex;flex-direction:column;"><div style="padding:12px 16px;border-bottom:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:space-between;align-items:center;"><span style="font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:var(--teal);">ASSIGN VESSEL</span><span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+t.length+' available</span></div><div style="flex:1;overflow-y:auto;">'+i+`</div><div style="padding:10px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);text-align:right;"><button onclick="this.closest('div[style*=fixed]').remove()" style="padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);background:transparent;border:1px solid var(--border-main);cursor:pointer;">CANCEL</button></div></div>`,document.body.appendChild(n)}async function Is(o,e){try{var{error:t}=await v.from("corp_vessels").update({status:"in_port",active_claim_id:o}).eq("id",e).eq("faction_id",d.id);if(t){alert("Assignment failed: "+t.message);return}var i=document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]');i&&i.remove(),await Promise.all([So(),ve()])}catch(n){alert("Assignment failed: "+(n.message||"Network error"))}}window.openAssignVesselModal=Ts;window.assignVesselToRoute=Is;function Bn(){const o=ie.reduce((r,c)=>r+(c.owned||0),0),e=ie.reduce((r,c)=>r+(c.deployed||0),0),t=Ca(ie),i=o-e;document.getElementById("eq-count").textContent=o+" UNITS",document.getElementById("eq-summary").innerHTML=`
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
                ${B(t)}
            </div>
        </div>`;const n={};for(const r of ie)n[r.equipment_key]=r;let a="";for(let r=1;r<=3;r++){const c=Ot[r],p=pn(r),f=mn===r,l=p.reduce((u,y)=>u+(n[y.key]?.owned||0),0),m=p.reduce((u,y)=>u+(n[y.key]?.deployed||0),0);if(a+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${r})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${f?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${c.color}">${b(c.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${c.color};border:1px solid ${c.color}33;background:${c.color}0a">${c.tag}</span>
            </div>
            ${l>0?`<span class="eq-tier-hdr__count">${m}/${l}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,f)for(const u of p){const y=n[u.key],x=y?.owned||0,g=y?.deployed||0,$=y?.condition||0,h=u.maintenancePerUnit*x,k=x-g,I=x>0&&k===0,T=x>0&&$<65,w=ci($),C=y?.assigned_projects||[],L=C.length>0?C.map(E=>E.contract_name||"Project").join(", ").slice(0,30):x>0&&g>0?g+" project"+(g>1?"s":""):"—";a+=`<div class="eq-row${x===0?" unowned":""}">`,a+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${x===0?" dim":""}">${b(u.name)}</span>
                        ${T?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${x>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${I?"var(--orange)":"var(--green)"}">${k}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${g}/${x}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,x>0?a+=`<div class="eq-detail">
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
                            <div class="eq-detail__value" style="color:var(--text-muted)">${b(L)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${B(h)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:a+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',a+="</div>"}}document.getElementById("eq-list").innerHTML=a;const s=[1,2,3].map(r=>{const c=Ot[r],p=pn(r).reduce((f,l)=>f+(n[l.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${p>0?c.color+"33":"var(--border-0)"};background:${p>0?c.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${c.color}">${c.tag}</div>
            <div class="eq-footer__tier-count" style="color:${p>0?"var(--text-bright)":"var(--text-dim)"}">${p}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${B(t)}</div>
        </div>
        <div class="eq-footer__tiers">${s}</div>`}function Ns(o){mn=mn===o?-1:o,Bn()}async function Si(){if(!d)return;const{data:o,error:e}=await v.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",d.id);e?(console.warn("Failed to load equipment:",e.message),ie=[]):ie=o||[],Bn()}async function Ms(){const{data:{user:o}}=await v.auth.getUser();if(!o){window.location.href="login.html";return}const{data:e}=await v.from("factions").select("*").or(`id.eq.${o.id},linked_user_id.eq.${o.id}`);$e=(e||[]).filter(u=>u.nation_id);const t=sessionStorage.getItem("active_faction_id");if(d=$e.find(u=>u.id===t)||$e.find(u=>u.faction_type==="corporation")||$e[0],!d){await v.auth.signOut(),window.location.href="login.html";return}if(d.faction_type!=="corporation"){window.location.href="dashboard.html";return}const i=new URLSearchParams(window.location.search).get("tab"),n=i==="expansion"||i==="actions";if(d.corp_sector!=="Shipping"&&!n){const y={Finance:"corp-operations-finance.html",Construction:"corp-operations.html"}[d.corp_sector];if(y){window.location.href=y;return}}const[a,s]=await Promise.all([d.nation_id?v.from("nations").select("*").eq("id",d.nation_id).single():Promise.resolve({data:null}),v.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);a.error&&console.warn("Nation load failed:",a.error.message),a.data&&(S=a.data),s.error&&console.warn("Shard load failed:",s.error.message),z=s.data;let r=0;if(d?.id){const{data:u}=await v.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",d.id).in("status",["open","bidding"]);if(u)for(const y of u)r+=(y.contract_bids||[]).length}const c=document.getElementById("corp-topbar-container");if(c){const{renderCorpTopBar:u}=await ka(async()=>{const{renderCorpTopBar:g}=await import("./corp-topbar-BGmUeelO.js");return{renderCorpTopBar:g}},__vite__mapDeps([0,1])),y=new URLSearchParams(window.location.search).get("tab")||"operations",x={};r>0&&(x.home={color:"#c8a832",title:r+" pending bid"+(r!==1?"s":"")+" on your projects"}),u(c,{faction:d,shard:z,activeTab:y,allUserFactions:$e,badges:x})}if(z){if(document.getElementById("game-date").textContent=z.current_date||"—",document.getElementById("tick-number").textContent=z.current_tick||"—",z.next_tick_at){const y=(Number(z.tick_interval_hours)||8)*36e5,x=new Date(z.next_tick_at).getTime(),$=x-y+y/2;un=new Date($>Date.now()?$:x+y/2),Aa()}const u=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");u&&(u.textContent="Next Corp Tick")}const p=document.getElementById("topbar-cash");p&&(p.textContent="CASH: "+wi(Number(d.corp_cash_reserves??0)));const f=document.getElementById("topbar-ap");f&&(f.style.display="none");const l=document.getElementById("nation-pill");l&&(l.textContent=(S?.name||d.nation||"—").toUpperCase());const m=document.getElementById("corp-faction-dropdown");if(m){let u="";for(const y of $e){const x=y.id===d.id,g=y.faction_type==="corporation"?"CORP":"PARTY",$=y.faction_type==="corporation"?"var(--teal)":"var(--amber)";u+=`<div class="corp-dd-item${x?" active":""}" onclick="switchToFaction('${y.id}', '${y.faction_type}')">
                <span class="corp-dd-type" style="color:${$}">${g}</span>
                <span class="corp-dd-name">${b(y.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${b(y.abbreviation||"—")}]</span>
            </div>`}m.innerHTML=u}await Promise.all([Co(),So(),ve(),Yn(),la()]),Ea(d,S,z);try{await _a(v,{faction:d,nation:S,shard:z},"auto-services-container")}catch(u){console.error("[CorpOps] Auto-services init failed:",u)}if(document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",i==="expansion"){const u=document.querySelector('[data-tab-action="expansion"]');u&&Ti({preventDefault:()=>{},target:u})}else if(i==="actions"){const u=document.querySelector('[data-tab-action="actions"]');u&&Ni({preventDefault:()=>{},target:u})}}async function As(){await v.auth.signOut(),window.location.href="login.html"}function Rs(){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.toggle("open")}function Ls(o,e){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.remove("open"),sessionStorage.setItem("active_faction_id",o),e==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",o=>{const e=document.getElementById("faction-switcher"),t=document.getElementById("corp-faction-dropdown");t&&e&&!e.contains(o.target)&&t.classList.remove("open")});document.addEventListener("keydown",o=>{o.key==="Escape"&&Vt()});window.doLogout=As;window.toggleTheme=Ra;window.toggleCorpDropdown=Rs;window.switchToFaction=Ls;window.setFilter=La;window.arSetFilter=gs;window.arSelectRoute=hs;window.arClaimRoute=Cs;window.arApplyToService=$s;window.raClose=qn;window.raSelectVessel=ws;window.raSetRate=ks;window.raSubmitApplication=Es;window.avToggle=Ss;window.avRelease=zs;window.openContractDetail=gi;window.closeContractDetail=Vt;window.toggleWhRow=es;window.toggleEqTier=Ns;window.switchEmNation=ls;window.setEmType=ds;window.setEmListing=cs;window.setEmQty=ps;window.purchaseEquipment=fs;window.setPrMat=ns;window.setPrTier=is;window.setPrQty=as;window.purchaseMaterial=ss;let ne={general:0,skilled:0,innovative:0},Qo=!1;const Ye=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function zi(o){const e=Number(S?.minimum_wage??50),t=Number(S?.inflation??50),i=Number(S?.standard_of_living??50),n=e/100*48e3,a=1+(t-50)/100*.5,s=1+(i-50)/100*.5;return Math.round(n*o*a*s)}function _(o){const e=Math.abs(o),t=o<0?"-":"";return e>=1e9?t+"$"+(e/1e9).toFixed(2)+"B":e>=1e6?t+"$"+(e/1e6).toFixed(2)+"M":e>=1e3?t+"$"+(e/1e3).toFixed(1)+"k":t+"$"+e.toLocaleString()}async function Ti(o){o.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("actions-content").style.display="none";const e=document.getElementById("expansion-content");e.style.display="flex",e.style.justifyContent="center",e.style.gap="12px",e.style.alignItems="flex-start",e.style.flexWrap="wrap",document.querySelectorAll(".corp-nav-tab").forEach(t=>t.classList.remove("active")),o.target.classList.add("active"),await Io(),To(),dr(),await Un(),Mo(),await Nr(),await br(),Kt(),Qt(),await Dr(),Jt(),await Ro(),Lo()}function Ii(o){o&&o.preventDefault(),document.getElementById("operations-content").style.display="flex",document.getElementById("expansion-content").style.display="none",document.getElementById("actions-content").style.display="none",document.querySelectorAll(".corp-nav-tab").forEach(e=>e.classList.remove("active")),qs()?.classList.add("active")}async function Ni(o){o.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("expansion-content").style.display="none",document.getElementById("actions-content").style.display="block",document.querySelectorAll(".corp-nav-tab").forEach(e=>e.classList.remove("active")),(o.target||document.querySelector('[data-tab-action="actions"]'))?.classList.add("active"),await Mi(),wt()}function qs(){return Array.from(document.querySelectorAll(".corp-nav-tab[href]:not([data-tab-action])")).find(o=>{const e=o.getAttribute("href");if(!e)return!1;const t=new URL(e,window.location.href);return t.pathname===window.location.pathname&&!t.searchParams.get("tab")})||null}async function Mi(){if(!d)return;const[o,e]=await Promise.all([v.from("corp_executives").select("*").eq("faction_id",d.id).eq("status","active"),v.from("executive_pool").select("*").eq("nation_id",d.nation_id).eq("status","available").order("skill",{ascending:!1})]);o.error&&console.warn("Failed to load executives:",o.error.message),e.error&&console.warn("Failed to load executive pool:",e.error.message),Bt=o.data||[],Pt=e.data||[];const t=await Ta({supabase:v,faction:d,currentTick:z?.current_tick||0,poolCandidates:Pt});t?.error&&console.warn("Failed to seed initial executive roster:",t.error.message||t.error),t?.executives&&(Bt=t.executives)}function lt(o){return o>=1e6?"$"+(o/1e6).toFixed(1)+"M":o>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Ne(o){return Bt.find(e=>e.role===o)||null}function vo(o,e){return(o||"?")[0]+(e||"?")[0]}function ut(o){return o>=70?"#5cb85c":o>=50?"#ca5":"#c84"}function wt(){const o=document.getElementById("actions-container");if(!o)return;const e=d?.faction_name||"Corporation",t=(d?.abbreviation||d?.corp_ticker||"??").toUpperCase();let i="";i+=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:0 2px;">
        <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:2px;color:#8b9a6b;text-transform:uppercase;">Actions</span>
            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${b(e)} &middot; ${b(t)}</span>
        </div>
    </div>`,i+='<div style="display:flex;gap:8px;">',i+='<div style="width:262px;display:flex;flex-direction:column;gap:5px;flex-shrink:0;">';for(let n=0;n<so.length;n++){const a=so[n],s=ro[a],r=Ne(a),c=ft===n,p=s.color,f=!r;if(i+=`<div onclick="actSelectExec(${n})" style="
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
            </div>`;else{const l=r?`${r.first_name} ${r.last_name}`:"—",m=r?r.age:0,u=r?r.skill:0,y=r?r.salary_per_year:0,x=r?vo(r.first_name,r.last_name):"—";i+=`<div style="display:flex;align-items:center;gap:10px;">
                <div style="width:45px;height:45px;background:${p}15;border:1px solid ${p}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:14px;font-weight:700;color:${p};flex-shrink:0;">${b(x)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:4px;">
                        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${p};">${b(a)}</span>
                    </div>
                    <div style="font-size:13px;font-weight:600;color:${c?"var(--text-bright,#f0efe6)":"var(--text-muted,#666)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(l)}${m?` <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">(${m})</span>`:""}</div>
                    <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:3px;flex:1;">
                            <div style="flex:1;height:3px;background:var(--border-0,rgba(255,255,255,0.06));">
                                <div style="width:${u}%;height:100%;background:${ut(u)};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);width:18px;text-align:right;">${u}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${lt(y)}/yr</span>
                    </div>
                </div>
            </div>`}i+="</div>"}i+="</div>",i+=`<div style="flex:1;display:flex;flex-direction:column;gap:0;">
        <div id="actions-right-panel"></div>
    </div>`,i+="</div>",o.innerHTML=i,Bs()}const Ai={CEO:[{id:"statement",name:"Issue Statement",desc:"Issue a press release to the public events feed. Other players and media corps see it. Cost scales with CEO skill.",cost:"~$20k",costColor:"#5cb85c",tags:["REPUTATION"],cooldown:"once/tick"},{id:"ipo",name:"IPO",desc:"Take the corporation public. Sell ~30% of shares for a massive cash injection. Permanent loss of full control.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["STRUCTURAL"],locked:!0,lockReason:"Coming soon"},{id:"bankruptcy",name:"Declare Bankruptcy",desc:"The CEO officially files for bankruptcy, ceasing all operations. Outstanding loans will be repaid up to 50% of the corporation's market valuation.",descRed:"This will dissolve your corporation. Loans will be paid back, and you will need to found a new corporation. There is a 24 tick cooldown on declaring bankruptcy.",cost:"IRREVERSIBLE",costColor:"#c55",tags:["IRREVERSIBLE"]}],CFO:[{id:"loan",name:"Request Loan",desc:"Submit a loan application to all finance corporations. Set amount, purpose, term, and collateral. Receive competing offers.",cost:"FREE",costColor:"#5cb85c",tags:["FINANCIAL"]}],COO:[{id:"restructure",name:"Restructure Operations",desc:"Lay off 10-20% of workforce, cut ~7% of debt. Reputation hit scales with COO skill — high skill minimizes damage.",cost:"FREE",costColor:"#5cb85c",tags:["OPERATIONAL"],cooldown:"once/tick"}],CTO:[{id:"research",name:"Begin Research",desc:"Start researching a tech tree node. Opens the tech tree interface.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["INNOVATION"],locked:!0,lockReason:"Coming soon"}],CMO:[{id:"rebrand",name:"Rebrand Corporation",desc:"Change name and abbreviation. Cost and reputation hit scale with CMO skill — high skill reduces both.",cost:"~$20M",costColor:"#ca5",tags:["STRUCTURAL"],cooldown:"once/tick"}],CLO:[{id:"sue_corp",name:"Sue Corporation",desc:"File a lawsuit against another corporation for patent infringement, contract breach, or predatory practices.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["LEGAL"],locked:!0,lockReason:"Coming soon"}],Lobbyist:[{id:"donate",name:"Political Donation",desc:"Donate $1M to a political party in the nation where your National HQ is located. The target party receives $100k in party funds. You cannot donate to your own party.",cost:"$1M",costColor:"#ca5",tags:["POLITICAL"],cooldown:"once/tick"}]};function Wt(o){return 1.5-o/100}let Ri={};function Os(o){const e=z?.current_tick||0;return Ri[o]===e}function yt(o){const e=z?.current_tick||0;Ri[o]=e}function Bs(){const o=document.getElementById("actions-right-panel");if(!o)return;const e=so[ft],t=ro[e],i=Ne(e),n=Ai[e]||[];if(!i){o.innerHTML=`<div style="padding:48px;text-align:center;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));">
            <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${t.color};margin-bottom:6px;">${b(e)}</div>
            <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-bottom:14px;">${b(t.fullTitle)}</div>
            <div style="font-size:16px;color:var(--text-muted);margin-bottom:20px;">This position is vacant. Hire an executive to unlock actions.</div>
            <div onclick="openExecSearch('${e}')" style="display:inline-block;padding:8px 24px;font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">EXECUTIVE SEARCH</div>
        </div>`;return}let a="";a+=`<div style="padding:14px 20px;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-bottom:none;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:56px;height:56px;background:${t.color}15;border:1px solid ${t.color}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:18px;font-weight:700;color:${t.color};">${b(vo(i.first_name,i.last_name))}</div>
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
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${lt(i.salary_per_year)}/yr</div>
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
        </div>`,a+=`<div style="font-size:14px;color:${c?"var(--text-dim)":"var(--text-muted,#666)"};line-height:1.6;">${b(r.desc)}</div>`,r.descRed&&(a+=`<div style="font-size:13px;color:#c55;line-height:1.6;margin-top:4px;">${b(r.descRed)}</div>`),c&&r.lockReason&&(a+=`<div style="margin-top:6px;font-family:var(--font-mono);font-size:11px;color:#c84;display:flex;align-items:center;gap:4px;">
                <span>&#8856;</span><span>${b(r.lockReason)}</span>
            </div>`),c||(a+=`<div class="act-exec-btn" style="display:none;margin-top:10px;text-align:right;">
                <span onclick="event.stopPropagation();actExecute('${r.id}','${e}')" style="display:inline-block;padding:6px 24px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${t.color};cursor:pointer;">EXECUTE</span>
            </div>`),a+="</div>"}a+="</div>",a+=`<div style="padding:8px 20px;background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:none;">
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">
            <span style="color:${t.color};font-weight:700;">${b(e)}</span> skill (${i.skill}/100) affects action outcomes.
            ${i.skill>=70?" High skill increases success probability and reduces costs.":i.skill>=50?" Moderate skill — outcomes are average. Consider recruiting a stronger executive.":" Low skill — actions are less effective and more expensive. Replacement recommended."}
        </div>
    </div>`,o.innerHTML=a,o.querySelectorAll("[onmouseenter]").forEach(s=>{s.addEventListener("mouseenter",function(){const r=this.querySelector(".act-exec-btn");r&&(r.style.display="block")}),s.addEventListener("mouseleave",function(){const r=this.querySelector(".act-exec-btn");r&&(r.style.display="none")})})}function Ps(o,e,t,i,n){const a=z?.current_tick||0,s=Math.max(0,n-a),r=Math.round(i*(s/12)),c=`FIRE ${e}: ${t}

Contract remaining: ${s} ticks
Payout (prorated): $${(r/1e6).toFixed(2)}M

This amount will be deducted from your cash reserves immediately.

Are you sure?`;confirm(c)&&Ds(o,e,r)}async function Ds(o,e,t){try{const i=Number(d?.corp_cash_reserves??0);if(i<t){alert(`Insufficient funds. You need $${(t/1e6).toFixed(2)}M but only have $${(i/1e6).toFixed(2)}M.`);return}const n=i-t,{error:a}=await v.from("factions").update({corp_cash_reserves:n}).eq("id",d.id);if(a){alert("Failed to process payout: "+a.message);return}const{error:s}=await v.from("corp_executives").update({status:"fired",updated_at:new Date().toISOString()}).eq("id",o);if(s){await v.from("factions").update({corp_cash_reserves:i}).eq("id",d.id),alert("Failed to fire executive: "+s.message);return}d.corp_cash_reserves=n,Bt=Bt.filter(r=>r.id!==o),wt()}catch(i){console.error("[CorpOps] Fire executive error:",i),alert("An error occurred.")}}function js(o,e){if((Ai[e]||[]).find(i=>i.id===o)?.cooldown==="once/tick"&&Os(o)){alert("This action can only be used once per tick. Wait for the next tick.");return}switch(o){case"statement":return Li();case"loan":return Bi();case"restructure":return Di();case"rebrand":return ji();case"donate":return Fi();case"bankruptcy":return qi()}}let bn=!1;function Li(){if(bn)return;bn=!0;const o=document.createElement("div");o.id="stmt-overlay",o.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",o.onclick=function(c){c.target===o&&Pn()};const e=d?.faction_name||"Corporation",t=(d?.abbreviation||d?.corp_ticker||"??").toUpperCase(),i=Number(d?.corp_cash_reserves??0),n=Ne("CEO"),a=n?`${n.first_name} ${n.last_name}`:"CEO";o.innerHTML=`<div onclick="event.stopPropagation()" style="width:480px;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">
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
                    <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${i<2e4?"#c55":"#e8e4dc"};">${_(i)}</div></div>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="actCloseStatement()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
                    <div id="stmt-submit-btn" onclick="actSubmitStatement()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c8a832;cursor:pointer;">PUBLISH</div>
                </div>
            </div>
            <div id="stmt-error" style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
        </div>
    </div>`,document.body.appendChild(o);const s=document.getElementById("stmt-text"),r=document.getElementById("stmt-chars");s&&r&&(s.addEventListener("input",function(){r.textContent=this.value.length+"/500"}),s.focus())}function Pn(){const o=document.getElementById("stmt-overlay");o&&o.remove(),bn=!1}let Ct=!1;async function Fs(){if(!d||!z||Ct)return;const o=document.getElementById("stmt-text"),e=document.getElementById("stmt-error"),t=(o?.value||"").trim();if(!t){e&&(e.textContent="Statement cannot be empty.",e.style.display="block");return}if(t.length>500){e&&(e.textContent="Statement too long (max 500 chars).",e.style.display="block");return}const i=Ne("CEO"),n=i?i.skill:50,a=Math.round(2e4*Wt(n)),s=Number(d.corp_cash_reserves??0);if(s<a){e&&(e.textContent="Insufficient cash. Need "+_(a)+".",e.style.display="block");return}Ct=!0;const r=document.getElementById("stmt-submit-btn");r&&(r.style.opacity="0.4",r.style.pointerEvents="none");const c=d.faction_name||"Corporation",p=i?`${i.first_name} ${i.last_name}`:"CEO",f=z.current_tick||0,{error:l}=await v.from("factions").update({corp_cash_reserves:s-a}).eq("id",d.id);if(l){Ct=!1,e&&(e.textContent="Failed to deduct cost: "+l.message,e.style.display="block"),r&&(r.style.opacity="1",r.style.pointerEvents="auto");return}const{error:m}=await v.from("event_log").insert({nation_id:d.nation_id,faction_id:d.id,event_name:c+" — Press Release",description_used:p+", CEO of "+c+': "'+t.replace(/[<>"]/g,"")+'"',category:"business",trigger_key:"ceo_statement",effects_applied:{cost:a,ceo:p,skill:n},fired_at_tick:f});if(m){await v.from("factions").update({corp_cash_reserves:s}).eq("id",d.id),Ct=!1,e&&(e.textContent="Failed to publish: "+m.message,e.style.display="block"),r&&(r.style.opacity="1",r.style.pointerEvents="auto");return}d.corp_cash_reserves=s-a,Ct=!1,yt("statement"),Pn()}const ri=24,Us=.5;async function Hs(o,e){const t=e-ri,{data:i}=await v.from("event_log").select("fired_at_tick, effects_applied").eq("trigger_key","corp_bankruptcy").gte("fired_at_tick",t).order("fired_at_tick",{ascending:!1}).limit(20),n=(i||[]).find(s=>s.effects_applied?.user_id===o),a=n?Math.max(0,n.fired_at_tick+ri-e):0;return{onCooldown:a>0,ticksLeft:a}}let Ko=!1;async function qi(){if(Ko)return;const{data:{user:o}}=await v.auth.getUser();if(!o){alert("Not logged in.");return}const e=d?.id||sessionStorage.getItem("active_faction_id");if(!e){alert("No active faction selected.");return}const{data:t,error:i}=await v.from("factions").select("*").eq("id",e).eq("faction_type","corporation").is("abandoned_at",null).single();if(i||!t){alert("No active corporation found. It may have already been dissolved.");return}const n=t,a=n.faction_name||"this corporation",{data:s,error:r}=await v.from("shard").select("current_tick").eq("name","Alpha Shard").single();if(r||!s){alert("Failed to read game tick. Please try again.");return}const c=s.current_tick||0,{onCooldown:p,ticksLeft:f}=await Hs(o.id,c);if(p){alert("Bankruptcy is on cooldown. You must wait "+f+" more tick"+(f!==1?"s":"")+" before declaring bankruptcy again.");return}if(!confirm("DECLARE BANKRUPTCY — "+a.toUpperCase()+`?

This will permanently:
• Dissolve the corporation
• Delete all properties, equipment, and inventory
• Pay back outstanding loans (up to 50% of market valuation)
• Remove all remaining cash reserves

You will need to found a new corporation.
There is a 24 tick cooldown on declaring bankruptcy.

This action CANNOT be undone.`))return;if(prompt('Type "BANKRUPT" to confirm bankruptcy of '+a+":")!=="BANKRUPT"){alert("Bankruptcy cancelled.");return}Ko=!0;try{async function m(O){const{error:F}=await O;if(F)throw F}const u=Number(n.corp_cash_reserves)||0,{data:y}=await v.from("corp_properties").select("purchase_price, condition").eq("faction_id",e);let x=0;for(const O of y||[])x+=Math.round(Number(O.purchase_price||0)*(Number(O.condition||0)/100));const g=u+x,$=Number(n.corp_loans)||0,h=g-$,k=Math.round(h*1.3),I=Math.max(0,Math.round(k*Us)),{data:T}=await v.from("finance_active_loans").select("*").eq("borrower_faction_id",e).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!0});let w=0;for(const O of T||[]){const F=O.principal-O.total_paid;if(F<=0)continue;const j=Math.min(F,I-w);if(j<=0)break;const{data:X}=await v.from("factions").select("corp_cash_reserves").eq("id",O.lender_faction_id).single();X&&await m(v.from("factions").update({corp_cash_reserves:(Number(X.corp_cash_reserves)||0)+j}).eq("id",O.lender_faction_id)),await m(v.from("finance_active_loans").update({status:"repaid",total_paid:O.total_paid+j,completed_tick:c}).eq("id",O.id)),w+=j}await m(v.from("contract_bids").delete().eq("faction_id",e)),await m(v.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",e).in("status",["open","bidding"])),await m(v.from("corp_equipment_deliveries").delete().eq("faction_id",e)),await m(v.from("corp_equipment").delete().eq("faction_id",e)),await m(v.from("corp_properties").delete().eq("faction_id",e)),await v.from("corp_material_inventory").delete().eq("faction_id",e),await v.from("corp_warehouse").delete().eq("faction_id",e),await v.from("corp_executives").delete().eq("faction_id",e),await v.from("faction_agitators").delete().eq("faction_id",e),await m(v.from("factions").delete().eq("id",e));const C=w>0?" $"+w.toLocaleString()+" was repaid to creditors.":"";await m(v.from("event_log").insert({nation_id:n.nation_id,faction_id:e,event_name:a+" — Bankruptcy",description_used:a+" has officially filed for bankruptcy. It has laid off its executive staff and ceased operations."+C,category:"business",trigger_key:"corp_bankruptcy",effects_applied:{corp_name:a,sector:n.corp_sector,user_id:o.id,loan_payback:w,valuation:k},fired_at_tick:c})),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:L}=await v.from("factions").select("id, faction_type").or(`id.eq.${o.id},linked_user_id.eq.${o.id}`),E=(L||[]).find(O=>O.faction_type==="party"),R=(L||[]).find(O=>O.faction_type==="corporation"),M=w>0?`
$`+w.toLocaleString()+" repaid to creditors.":"";E?(sessionStorage.setItem("active_faction_id",E.id),alert(a+" has declared bankruptcy."+M+`

Redirecting to your political party.`),window.location.href="dashboard.html"):R?(sessionStorage.setItem("active_faction_id",R.id),alert(a+" has declared bankruptcy."+M+`

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(a+" has declared bankruptcy."+M+`

You have no remaining factions.`),window.location.href="faction-select.html")}catch(m){alert("Bankruptcy failed: "+(m.message||m)+`

Please try again or contact support.`)}finally{Ko=!1}}const Oi=[{id:"equipment",label:"Equipment Acquisition",desc:"Purchase vehicles, cranes, or heavy machinery",icon:"&#9881;"},{id:"working",label:"Working Capital",desc:"Bridge financing for active project costs",icon:"$"},{id:"property",label:"Property Purchase",desc:"Acquire office, warehouse, or HQ building",icon:"&#9632;"},{id:"subsidiary",label:"Subsidiary Expansion",desc:"Fund new subsidiary establishment",icon:"&#9672;"},{id:"materials",label:"Material Procurement",desc:"Bulk material purchase for upcoming projects",icon:"&#9638;"}],Jo=[{id:"none",label:"None",desc:"Unsecured — lenders may charge higher rates",risk:"HIGH",riskColor:"#c84"},{id:"equipment",label:"Equipment",desc:"Financed equipment serves as collateral",risk:"MODERATE",riskColor:"#ca5"},{id:"property",label:"Property",desc:"Corporate property lien",risk:"LOW",riskColor:"#8b9a6b"},{id:"full",label:"Full Assets",desc:"All corporate assets — maximum lender security",risk:"MINIMAL",riskColor:"#5c5"}];let te=25e7,jt="equipment",vt=48,pe="equipment",go="",zt=[];function Bi(){te=25e7,jt="equipment",vt=48,pe="equipment",go="",document.getElementById("lr-overlay").style.display="flex",Qs(),kt()}function Pi(){document.getElementById("lr-overlay").style.display="none"}function Gs(o){te=Math.max(1e6,Math.min(5e9,Number(o)||0)),kt()}function Vs(o){jt=o,kt()}function Ws(o){vt=o,kt()}function Ys(o){pe=o,kt()}async function Qs(){if(!d)return;const{data:o}=await v.from("factions").select("id, faction_name, abbreviation, corp_ticker, corp_company_type").eq("faction_type","corporation").eq("corp_sector","Finance").is("abandoned_at",null).neq("id",d.id);zt=o||[],kt()}function kt(){const o=document.getElementById("lr-modal-content");if(!o)return;const e=Number(d?.corp_cash_reserves??0),t=Number(d?.corp_loans??0),i=Number(d?.corp_reputation??50),n=d?.faction_name||"Corporation",a=(d?.abbreviation||d?.corp_ticker||"??").toUpperCase(),s=t+te,r=s>e*3?"#c55":s>e*1.5?"#c84":s>e?"#ca5":"#5c5",c=s>e*3?"DANGEROUS":s>e*1.5?"HEAVY":s>e?"MODERATE":"HEALTHY",p=pe==="none"?"10-16%":pe==="equipment"?"7-12%":pe==="property"?"5-9%":"4-7%",l=Math.round(te*(pe==="none"?.13:pe==="equipment"?.095:pe==="property"?.07:.055)/12+te/vt),m=Jo.find(y=>y.id===pe)||Jo[0];let u="";u+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
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
    </div>`,u+='<div style="flex:1;overflow-y:auto;">',u+=`<div style="padding:6px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;">
        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Your Financials (visible to lenders)</span>
    </div>
    <div style="display:flex;gap:0;border-bottom:1px solid #2a2a24;">
        <div style="flex:1;padding:6px 10px;text-align:center;border-right:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">CASH</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;margin-top:1px;">${_(e)}</div>
        </div>
        <div style="flex:1;padding:6px 10px;text-align:center;border-right:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">CURRENT DEBT</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#c84;margin-top:1px;">${_(t)}</div>
        </div>
        <div style="flex:1;padding:6px 10px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">REPUTATION</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#8b9a6b;margin-top:1px;">${i}</div>
        </div>
    </div>`,u+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">LOAN AMOUNT</span>
            <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#5a8aaa;">${_(te)}</span>
        </div>
        <input type="range" min="1000000" max="5000000000" step="10000000" value="${te}" oninput="lrSetAmount(this.value)" style="width:100%;height:4px;accent-color:#5a8aaa;" />
        <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;"><span>$1M</span><span>$5B</span></div>
    </div>`,u+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">PURPOSE</div>
        <div style="display:flex;flex-direction:column;gap:3px;">`;for(const y of Oi){const x=jt===y.id;u+=`<div onclick="lrSetPurpose('${y.id}')" style="display:flex;align-items:center;gap:8px;padding:5px 10px;cursor:pointer;background:${x?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${x?"#5a8aaa44":"#2a2a24"};border-left:2px solid ${x?"#5a8aaa":"transparent"};">
            <span style="font-family:var(--font-mono);font-size:10px;color:${x?"#5a8aaa":"#6a6660"};width:14px;text-align:center;">${y.icon}</span>
            <div><div style="font-size:11px;font-weight:600;color:${x?"#e8e4dc":"#9e9a92"};">${y.label}</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${y.desc}</div></div>
        </div>`}u+="</div></div>",u+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">PREFERRED TERM</span>
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;">${vt} months</span>
        </div>
        <div style="display:flex;gap:3px;">`;for(const y of[12,24,36,48,60,84,120]){const x=vt===y;u+=`<span onclick="lrSetTerm(${y})" style="flex:1;text-align:center;padding:4px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;color:${x?"#000":"#6a6660"};background:${x?"#5a8aaa":"transparent"};border:1px solid ${x?"#5a8aaa":"#2a2a24"};">${y}</span>`}u+='</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Lenders may offer different terms. This is your preference, not a guarantee.</div></div>',u+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">COLLATERAL OFFERED</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">`;for(const y of Jo){const x=pe===y.id;u+=`<div onclick="lrSetCollateral('${y.id}')" style="padding:6px 8px;cursor:pointer;background:${x?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${x?"#5a8aaa44":"#2a2a24"};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${x?"#5a8aaa":"#6a6660"};">${y.label}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:${y.riskColor};">${y.risk} RISK</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${y.desc}</div>
        </div>`}if(u+="</div></div>",u+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">NOTE TO LENDERS (OPTIONAL)</div>
        <textarea id="lr-note" rows="2" maxlength="300" onchange="lrNote=this.value"
            placeholder="e.g., Expanding into Heavy Infrastructure. Equipment purchase will generate $12M+ in annual contract revenue."
            style="width:100%;padding:6px 8px;font-family:var(--font-ui);font-size:10px;color:#e8e4dc;background:#1c1c18;border:1px solid #2a2a24;outline:none;resize:none;box-sizing:border-box;line-height:1.5;">${b(go)}</textarea>
    </div>`,u+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">Debt Impact Preview</div>
        <div style="background:#1c1c18;border:1px solid #2a2a24;padding:6px 10px;">
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CURRENT DEBT</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${_(t)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">+ THIS LOAN</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#5a8aaa;">+${_(te)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#e8e4dc;">NEW TOTAL DEBT</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${_(s)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEBT HEALTH</span>
                <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${r};background:${r}12;border:1px solid ${r}25;">${c}</span>
            </div>
        </div>
    </div>`,u+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">This request will be sent to</div>`,zt.length>0){u+='<div style="display:flex;flex-direction:column;gap:3px;">';for(const y of zt){const x=(y.corp_company_type||"").toLowerCase()==="state"?"#c84":(y.corp_company_type||"").toLowerCase()==="public"?"#5c5":"#c8a832";u+=`<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:#1c1c18;border:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c8a832;">${b((y.abbreviation||y.corp_ticker||"??").toUpperCase())}</span>
                <span style="font-size:10px;color:#e8e4dc;flex:1;">${b(y.faction_name)}</span>
                ${y.corp_company_type?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${x};background:${x}12;border:1px solid ${x}25;">${b(y.corp_company_type.toUpperCase())}</span>`:""}
            </div>`}u+="</div>"}else u+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No finance corporations in this nation yet.</div>';u+='<div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">All finance corporations in your nation will see this request. You choose which offer to accept.</div></div>',u+=`<div style="padding:8px 16px;">
        <div style="padding:6px 10px;background:rgba(90,138,170,0.04);border:1px solid rgba(90,138,170,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#5a8aaa;letter-spacing:0.8px;margin-bottom:4px;">ESTIMATED MARKET TERMS</div>
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. RATE RANGE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#e8e4dc;">${p}</div></div>
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. MONTHLY PAYMENT</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#e8e4dc;">~${_(l)}</div></div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Estimates based on collateral offer and current market rates. Actual terms set by each lender.</div>
        </div>
    </div>`,u+="</div>",u+=`<div style="padding:10px 16px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:12px;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">REQUESTING</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5a8aaa;">${_(te)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">COLLATERAL</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;">${m.label}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">SENT TO</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#9e9a92;">${zt.length} lender${zt.length!==1?"s":""}</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="lrClose()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="lr-submit-btn" onclick="lrSubmit()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">SUBMIT REQUEST</div>
        </div>
    </div>`,u+='<div id="lr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>',o.innerHTML=u}let to=!1;async function Ks(){if(!d||!z||to)return;const o=document.getElementById("lr-error");if(te<1e6){o.textContent="Minimum loan amount is $1M.",o.style.display="block";return}if(te>5e9){o.textContent="Maximum loan amount is $5B.",o.style.display="block";return}const t=((Oi.find(s=>s.id===jt)||{}).label||jt)+(go?" — "+go:""),i=document.getElementById("lr-submit-btn");to=!0,i.style.opacity="0.5",i.style.pointerEvents="none";const n=z.current_tick||0,{error:a}=await v.from("finance_loan_requests").insert({requesting_faction_id:d.id,nation_id:d.nation_id,amount:te,term_months:vt,purpose:t,created_tick:n,expires_tick:n+5});if(i.style.opacity="1",i.style.pointerEvents="auto",a){to=!1,o.textContent="Failed to submit: "+a.message,o.style.display="block",i.style.opacity="1",i.style.pointerEvents="auto";return}to=!1,Pi()}function Di(){if(!d)return;const o=Number(d.corp_loans??0),e=Number(d.corp_reputation??50),t=Number(d.corp_general_workforce??0),i=Number(d.corp_skilled_workforce??0),n=Number(d.corp_innovative_workforce??0),a=t+i+n;if(a===0){alert("Cannot restructure — no employees to lay off.");return}const s=Ne("COO"),r=s?s.skill:50,c=Wt(r),p=10+Math.floor(Math.random()*11),f=Math.round(a*p/100),l=Math.round(o*.07),m=Math.round(l*(2-c)),u=3+Math.floor(Math.random()*10),y=Math.max(1,Math.round(u*c)),x=Math.round(t/a*f),g=Math.round(i/a*f),$=Math.max(0,Math.min(n,f-x-g)),h=document.createElement("div");h.id="restr-overlay",h.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",h.onclick=function(k){k.target===h&&Dn()},h.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">
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
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">General: ${t} &rarr; ${t-x}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${x}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Skilled: ${i} &rarr; ${i-g}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${g}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Innovative: ${n} &rarr; ${n-$}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${$}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEBT REDUCTION (~7%)</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">-${_(m)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">REPUTATION HIT</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${y} (${e} &rarr; ${Math.max(0,e-y)})</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#c84;margin-top:6px;">&#9888; This action cannot be undone. Laid-off workers must be re-hired.</div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid #2a2a24;display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseRestructure()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="restr-btn" onclick="actSubmitRestructure(${p},${m},${y},${x},${g},${$})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#8b9a6b;cursor:pointer;">RESTRUCTURE</div>
        </div>
        <div id="restr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(h)}function Dn(){const o=document.getElementById("restr-overlay");o&&o.remove()}let oo=!1;async function Js(o,e,t,i,n,a){if(!d||!z||oo)return;oo=!0;const s=document.getElementById("restr-btn");s&&(s.style.opacity="0.4",s.style.pointerEvents="none");const r=Number(d.corp_general_workforce??0),c=Number(d.corp_skilled_workforce??0),p=Number(d.corp_innovative_workforce??0),f=Number(d.corp_loans??0),l=Number(d.corp_reputation??50),m={corp_general_workforce:Math.max(0,r-i),corp_skilled_workforce:Math.max(0,c-n),corp_innovative_workforce:Math.max(0,p-a),corp_loans:Math.max(0,f-e),corp_reputation:Math.max(0,l-t)},{error:u}=await v.from("factions").update(m).eq("id",d.id);if(u){oo=!1;const g=document.getElementById("restr-error");g&&(g.textContent="Failed: "+u.message,g.style.display="block"),s&&(s.style.opacity="1",s.style.pointerEvents="auto");return}Object.assign(d,m);const y=z.current_tick||0,{error:x}=await v.from("event_log").insert({nation_id:d.nation_id,faction_id:d.id,event_name:(d.faction_name||"Corporation")+" — Restructuring",description_used:(d.faction_name||"A corporation")+" has announced a restructuring, laying off "+o+"% of its workforce.",category:"business",trigger_key:"corp_restructure",effects_applied:{layoff_pct:o,debt_cut:e,rep_loss:t},fired_at_tick:y});x&&console.warn("Failed to log restructure event:",x.message),oo=!1,yt("restructure"),Dn(),wt()}function ji(){const o=Ne("CMO"),e=o?o.skill:50,t=Wt(e),i=Math.round(2e7*t),n=Math.max(1,Math.round(5*t)),a=Number(d?.corp_cash_reserves??0),s=Number(d?.corp_reputation??50),r=d?.faction_name||"",c=d?.abbreviation||d?.corp_ticker||"",p=document.createElement("div");p.id="rebrand-overlay",p.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",p.onclick=function(f){f.target===p&&jn()},p.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">
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
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${_(i)}</span>
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
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${a<i?"#c55":"#e8e4dc"};">${_(a-i)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid #2a2a24;display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseRebrand()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="rebrand-btn" onclick="actSubmitRebrand(${i},${n})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c84;cursor:${a>=i?"pointer":"not-allowed"};${a<i?"opacity:0.4;pointer-events:none;":""}">REBRAND</div>
        </div>
        <div id="rebrand-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(p)}function jn(){const o=document.getElementById("rebrand-overlay");o&&o.remove()}let no=!1;async function Xs(o,e){if(!d||!z||no)return;const t=o||2e7,i=e||5,n=document.getElementById("rebrand-error"),a=(document.getElementById("rebrand-name")?.value||"").trim().replace(/[<>"]/g,""),s=(document.getElementById("rebrand-abbr")?.value||"").trim().toUpperCase().replace(/[<>"]/g,"");if(!a||a.length<2){n&&(n.textContent="Name must be at least 2 characters.",n.style.display="block");return}if(!s||s.length<2||s.length>5){n&&(n.textContent="Abbreviation must be 2-5 characters.",n.style.display="block");return}const r=Number(d.corp_cash_reserves??0);if(r<t){n&&(n.textContent="Insufficient cash. Need "+_(t)+".",n.style.display="block");return}no=!0;const c=document.getElementById("rebrand-btn");c&&(c.style.opacity="0.4",c.style.pointerEvents="none");const p=Number(d.corp_reputation??50),f=d.faction_name||"Corporation",{error:l}=await v.from("factions").update({faction_name:a,abbreviation:s,corp_ticker:s,corp_cash_reserves:r-t,corp_reputation:Math.max(0,p-i)}).eq("id",d.id);if(l){no=!1,n&&(n.textContent="Failed: "+l.message,n.style.display="block"),c&&(c.style.opacity="1",c.style.pointerEvents="auto");return}d.faction_name=a,d.abbreviation=s,d.corp_ticker=s,d.corp_cash_reserves=r-t,d.corp_reputation=Math.max(0,p-i);const m=z.current_tick||0,{error:u}=await v.from("event_log").insert({nation_id:d.nation_id,faction_id:d.id,event_name:"Corporation Rebranded",description_used:f+" has rebranded to "+a+" ("+s+"). The rebrand costs $20M and reputation takes a temporary hit.",category:"corporate",trigger_key:"corp_rebrand",effects_applied:{old_name:f,new_name:a,new_abbr:s,rep_loss:i,cost:t},fired_at_tick:m});u&&console.warn("Failed to log rebrand event:",u.message),no=!1,yt("rebrand"),jn(),wt(),document.getElementById("corp-name-bar").textContent=a;const y=document.getElementById("corp-logo");y&&(y.textContent=s.slice(0,2))}const Zs={liberty:"#9C27B0",equality:"#E91E63",freedom:"#5b9bd5",security:"#d48a3c",individualism:"#eab308",collectivism:"#ec4899",tradition:"#795548",progress:"#00BCD4",nationalism:"#FF5722",globalism:"#3F51B5"};function nt(o){return Zs[(o||"").toLowerCase()]||"#9C27B0"}let Fe=[],Se=-1;async function Fi(){Number(d?.corp_cash_reserves??0);const o=[d.nation_id],e=new Set($e.map(n=>n.id)),{data:t}=await v.from("factions").select("id, faction_name, abbreviation, party_color, party_funds, seats, momentum, nation, nation_id, leader_ideology, linked_user_id, ideology_value_1, ideology_value_2").eq("faction_type","party").in("nation_id",o).is("abandoned_at",null).order("seats",{ascending:!1});Fe=(t||[]).filter(n=>!e.has(n.id)).map(n=>({...n})),Se=-1;const i=document.createElement("div");i.id="donate-overlay",i.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",i.onclick=function(n){n.target===i&&Fn()},document.body.appendChild(i),Ui()}function Fn(){const o=document.getElementById("donate-overlay");o&&o.remove(),Fe=[],Se=-1}function er(o){Se=o,Ui()}function Ui(){const o=document.getElementById("donate-overlay");if(!o)return;const e=Ne("Lobbyist"),t=e?e.skill:50,i=Math.round(1e6*Wt(t)),n=1e5,a=Number(d?.corp_cash_reserves??0),s=Se>=0?Fe[Se]:null,r=a>=i;let c='<div onclick="event.stopPropagation()" style="width:540px;max-height:80vh;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">';c+=`<div style="padding:14px 20px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:10px;color:#8a6aaa;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Political Donation</span>
            </div>
            <span onclick="actCloseDonation()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:6px;">
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Cost:</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#ca5;">${_(i)}</span>
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">&rarr; Target party receives</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#5cb85c;">+${_(n)}</span>
        </div>
        <div style="font-family:var(--font-mono);font-size:10px;color:#6a6660;margin-top:4px;">Parties in the nation where your National HQ is located. You cannot donate to your own party.</div>
    </div>`,c+='<div style="flex:1;overflow-y:auto;padding:10px 0;">',c+='<div style="padding:0 20px 8px;font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Select a Party</div>',Fe.length===0&&(c+='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#6a6660;">No eligible parties found.</div>');for(let p=0;p<Fe.length;p++){const f=Fe[p],l=Se===p,m=f.party_color||"#8a6aaa",u=(f.momentum||0)>0?"#e8e4dc":"#c55";c+=`<div onclick="donateSelectParty(${p})" style="
            padding:10px 20px;
            border-bottom:1px solid #2a2a24;
            border-left:3px solid ${l?m:"transparent"};
            background:${l?m+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:10px;height:10px;background:${m};flex-shrink:0;"></div>
                    <div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-size:14px;font-weight:600;color:${l?"#e8e4dc":"#9e9a92"};">${b(f.faction_name)}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">${b(f.abbreviation||"??")} &middot; ${b(f.nation||"")} &middot; ${f.seats||0} seats</span>
                            ${f.ideology_value_1?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${nt(f.ideology_value_1)};background:${nt(f.ideology_value_1)}12;border:1px solid ${nt(f.ideology_value_1)}30;">${b(f.ideology_value_1.toUpperCase())}</span>`:""}
                            ${f.ideology_value_2?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${nt(f.ideology_value_2)};background:${nt(f.ideology_value_2)}12;border:1px solid ${nt(f.ideology_value_2)}30;">${b(f.ideology_value_2.toUpperCase())}</span>`:""}
                        </div>
                        <div style="display:flex;gap:12px;margin-top:4px;">
                            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Funds: <span style="color:#c8a832;font-weight:700;">${_(f.party_funds||0)}</span></span>
                            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Momentum: <span style="color:${u};font-weight:700;">${Number(f.momentum||0).toFixed(1)}</span></span>
                        </div>
                    </div>
                </div>
                ${l?'<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">SELECTED</span>':""}
            </div>
        </div>`}c+="</div>",c+=`<div style="padding:12px 20px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:16px;">
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">COST</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#ca5;">${_(i)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${r?"#e8e4dc":"#c55"};">${_(a)}</div></div>
            ${s?`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">RECIPIENT</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#e8e4dc;">${b(s.abbreviation||s.faction_name)}</div></div>`:""}
        </div>
        <div style="display:flex;gap:8px;">
            <div onclick="actCloseDonation()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="donate-btn" onclick="actSubmitDonation()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${s&&r?"#000":"#6a6660"};background:${s&&r?"#8a6aaa":"#2a2a24"};cursor:${s&&r?"pointer":"not-allowed"};${!s||!r?"opacity:0.4;pointer-events:none;":""}">DONATE</div>
        </div>
    </div>`,c+='<div id="donate-error" style="padding:6px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',c+="</div>",o.innerHTML=c}let it=!1;async function tr(){if(!d||!z||Se<0||it)return;const o=Fe[Se];if(!o)return;const e=Number(z?.current_tick||0);if(new Set($e.map(w=>w.id)).has(o.id)){const w=document.getElementById("donate-error");w&&(w.textContent="You cannot donate to your own party.",w.style.display="block");return}const i=Ne("Lobbyist"),n=i?i.skill:50,a=Math.round(1e6*Wt(n)),s=1e5,r=2,{data:c,error:p}=await v.from("factions").select("corp_cash_reserves, last_donation_tick").eq("id",d.id).single();if(p||!c){const w=document.getElementById("donate-error");w&&(w.textContent="Failed to verify cooldown: "+(p?.message||"unknown"),w.style.display="block");return}const f=Number(c.last_donation_tick??0);if(f===e){const w=document.getElementById("donate-error");w&&(w.textContent="Political Donation is on cooldown until next tick.",w.style.display="block"),yt("donate");return}const l=Number(c.corp_cash_reserves??0);if(l<a){const w=document.getElementById("donate-error");w&&(w.textContent="Insufficient cash. Need "+_(a)+", have "+_(l)+".",w.style.display="block");return}it=!0;const m=document.getElementById("donate-btn");m&&(m.style.opacity="0.4",m.style.pointerEvents="none");const u=Number(d.corp_reputation??50),y=Math.max(0,u-r),{data:x,error:g}=await v.from("factions").update({corp_cash_reserves:l-a,corp_reputation:y,last_donation_tick:e}).eq("id",d.id).eq("last_donation_tick",f).select("id");if(g){const w=document.getElementById("donate-error");it=!1,w&&(w.textContent="Failed: "+g.message,w.style.display="block"),m&&(m.style.opacity="1",m.style.pointerEvents="auto");return}if(!x||x.length===0){const w=document.getElementById("donate-error");it=!1,w&&(w.textContent="Political Donation is on cooldown until next tick.",w.style.display="block"),m&&(m.style.opacity="1",m.style.pointerEvents="auto"),yt("donate");return}const{data:$}=await v.from("factions").select("party_funds").eq("id",o.id).single(),h=Number($?.party_funds??0),{error:k}=await v.from("factions").update({party_funds:h+s}).eq("id",o.id);if(k){await v.from("factions").update({corp_cash_reserves:l}).eq("id",d.id);const w=document.getElementById("donate-error");it=!1,w&&(w.textContent="Failed to transfer funds: "+k.message,w.style.display="block"),m&&(m.style.opacity="1",m.style.pointerEvents="auto");return}d.corp_cash_reserves=l-a,d.corp_reputation=y;const I=d.faction_name||"Corporation",{error:T}=await v.from("event_log").insert({nation_id:o.nation_id||d.nation_id,faction_id:d.id,event_name:I+" — Political Donation",description_chosen:I+" has donated "+_(a)+" to "+(o.faction_name||"a political party")+". The party receives "+_(s)+" in campaign funds. Corporate reputation decreases by "+r+".",category:"business",trigger_key:"corp_donation",effects_applied:{cost:a,recipient_faction_id:o.id,recipient_name:o.faction_name,funds_granted:s,reputation_loss:r,skill:n},fired_at_tick:e});T&&console.warn("Failed to log donation event:",T.message),it=!1,yt("donate"),Fn()}function or(o){ft=o,wt()}async function nr(o){if(we=o,Ee=-1,document.getElementById("exec-search-overlay").style.display="flex",Pt.length===0&&d?.nation_id){const{data:e}=await v.from("executive_pool").select("id").eq("nation_id",d.nation_id).limit(1);if(!e||e.length===0){const i=d.nation||"",n=Ia(d.nation_id,i),{error:a}=await v.from("executive_pool").insert(n);a&&console.warn("Failed to generate executive pool:",a.message)}const{data:t}=await v.from("executive_pool").select("*").eq("nation_id",d.nation_id).eq("status","available").order("skill",{ascending:!1});Pt=t||[]}Vi()}function Hi(){document.getElementById("exec-search-overlay").style.display="none",we=null,Ee=-1}function Gi(o){return Pt.filter(e=>e.status==="available"&&Array.isArray(e.specializations)&&e.specializations.includes(o)).sort((e,t)=>t.skill-e.skill)}function ir(o){Ee=o,Vi()}let io=!1;async function ar(){if(!d||!z||!we||Ee<0||io)return;const e=Gi(we)[Ee];if(!e)return;io=!0;const t=z.current_tick||0,i=document.getElementById("es-hire-btn");i&&(i.style.opacity="0.4",i.style.pointerEvents="none");const{error:n}=await v.from("corp_executives").insert({faction_id:d.id,role:we,first_name:e.first_name,last_name:e.last_name,age:e.age,origin_nation:e.origin_nation,skill:e.skill,salary_per_year:e.required_salary,contract_years:e.required_years,contract_start_tick:t,contract_end_tick:t+e.required_years*12,status:"active"});if(n){io=!1;const s=document.getElementById("es-error");s&&(s.textContent="Failed: "+n.message,s.style.display="block"),i&&(i.style.opacity="1",i.style.pointerEvents="auto");return}const{error:a}=await v.from("executive_pool").update({status:"hired",hired_by_faction_id:d.id}).eq("id",e.id);a&&console.warn("Failed to mark pool candidate as hired:",a.message),io=!1,Hi(),await Mi(),ft=so.indexOf(we),ft<0&&(ft=0),wt()}function Vi(){const o=document.getElementById("exec-search-content");if(!o||!we)return;const e=we,t=ro[e],i=Gi(e),n=Ee>=0?i[Ee]:null;let a="";a+=`<div style="padding:12px 20px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
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
        </div>`);for(let s=0;s<i.length;s++){const r=i[s],c=Ee===s,p=ut(r.skill);a+=`<div onclick="esSelectCandidate(${s})" style="
            padding:10px 14px;
            border-bottom:1px solid #2a2a24;
            border-left:3px solid ${c?t.color:"transparent"};
            background:${c?t.color+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:${t.color}10;border:1px solid ${t.color}22;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${t.color};flex-shrink:0;">${b(vo(r.first_name,r.last_name))}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;color:${c?"var(--text-bright,#f0efe6)":"#9e9a92"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(r.first_name)} ${b(r.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:4px;flex:1;">
                            <div style="flex:1;height:3px;background:#2a2a24;">
                                <div style="width:${r.skill}%;height:100%;background:${p};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:${p};width:18px;text-align:right;">${r.skill}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${lt(r.required_salary)}/yr</span>
                    </div>
                </div>
            </div>
        </div>`}if(a+="</div>",a+='<div style="flex:1;overflow-y:auto;">',!n)a+=`<div style="padding:50px 24px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:14px;color:var(--text-dim);margin-bottom:10px;">Select a candidate</div>
            <div style="font-size:12px;color:#6a6660;">${i.length} candidate${i.length!==1?"s":""} available for ${b(e)}</div>
        </div>`;else{const s=n.required_salary*n.required_years,r=ut(n.skill);a+=`<div style="padding:20px;border-bottom:1px solid #2a2a24;">
            <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:64px;height:64px;background:${t.color}12;border:1px solid ${t.color}28;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:20px;font-weight:700;color:${t.color};">${b(vo(n.first_name,n.last_name))}</div>
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
            <div style="display:flex;gap:5px;flex-wrap:wrap;">`;for(const f of n.specializations||[]){const l=ro[f],m=f===e;a+=`<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:3px 10px;color:${m?"#000":l?.color||"#9e9a92"};background:${m?l?.color||"#5a8aaa":(l?.color||"#5a8aaa")+"10"};border:1px solid ${m?"transparent":(l?.color||"#5a8aaa")+"30"};">${b(f)}</span>`}a+="</div></div>",a+=`<div style="padding:12px 20px;border-bottom:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Contract Terms</div>
            <div style="background:#1c1c18;border:1px solid #2a2a24;padding:10px 14px;">
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">CONTRACT LENGTH</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright,#f0efe6);">${n.required_years} years</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">ANNUAL SALARY</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#c84;">${lt(n.required_salary)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright,#f0efe6);">TOTAL CONTRACT VALUE</span>
                    <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${lt(s)}</span>
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
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SKILL</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${ut(n.skill)};">${n.skill}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SALARY</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:#c84;">${lt(n.required_salary)}/yr</div></div>`:a+='<div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Select a candidate to hire</div>',a+=`</div>
        <div style="display:flex;gap:8px;">
            <div onclick="closeExecSearch()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="es-hire-btn" onclick="esHireCandidate()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${n?"#000":"#6a6660"};background:${n?t.color:"#2a2a24"};cursor:${n?"pointer":"not-allowed"};${n?"":"opacity:0.4;pointer-events:none;"}">HIRE</div>
        </div>
    </div>`,a+='<div id="es-error" style="padding:5px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',o.innerHTML=a}function zo(){return V.reduce((e,t)=>{const i=Number(t.capacity||0),n=Number(t.condition||0)/100;return e+Math.floor(i*n)},0)+500}function sr(o,e){const t=Ye.find(a=>a.id===o),i=Number(d?.[t.factionKey]??0),n=ne[o]+e;if(!(i+n<0)){if(e>0){const a=Ye.reduce((r,c)=>{const p=Number(d?.[c.factionKey]??0),f=c.id===o?n:ne[c.id];return r+p+f},0),s=zo();if(a>s)return}ne[o]=n,To()}}function rr(o){o?ne[o]=0:ne={general:0,skilled:0,innovative:0},To()}async function lr(){if(Qo||!Object.values(ne).some(s=>s!==0))return;let e=0;for(const s of Ye){const r=ne[s.id];r>0&&(e+=r*zi(s.multiplier)*.1)}const t=Number(d?.corp_cash_reserves??0);if(e>t){alert("Insufficient cash reserves. Hiring cost: "+_(e)+", available: "+_(t));return}const i=Ye.reduce((s,r)=>s+Number(d?.[r.factionKey]??0)+ne[r.id],0),n=zo();if(i>n){alert("Cannot hire beyond property capacity ("+n.toLocaleString()+"). You need more workplaces.");return}const a=e>0?`Confirm workforce changes?

Hiring fee: `+_(e)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(a)){Qo=!0;try{const s={};for(const p of Ye){const f=Number(d?.[p.factionKey]??0);s[p.factionKey]=Math.max(0,f+ne[p.id])}e>0&&(s.corp_cash_reserves=Math.max(0,t-Math.round(e)));const{error:r}=await v.from("factions").update(s).eq("id",d.id);if(r)throw r;Object.assign(d,s),ne={general:0,skilled:0,innovative:0};const c=document.getElementById("topbar-cash");if(c){const p=Number(d.corp_cash_reserves??0);c.textContent="CASH: "+(p>=1e6?"$"+(p/1e6).toFixed(1)+"M":"$"+Math.round(p/1e3)+"k")}To()}catch(s){alert("Error: "+s.message)}finally{Qo=!1}}}function To(){const o=document.getElementById("hf-card-container");if(!o)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=Number(S?.minimum_wage??50),n=Number(S?.inflation??50),a=Number(S?.standard_of_living??50),s=i/100*48e3,r=(1+(n-50)/100*.5).toFixed(2),c=(1+(a-50)/100*.5).toFixed(2),p=S?.name||d?.nation||"Nation",f=Object.values(ne).some(h=>h!==0),l=zo();let m=0,u=0,y=0,x=0,g="";for(const h of Ye){const k=Number(d?.[h.factionKey]??0),I=ne[h.id],T=k+I,w=zi(h.multiplier),C=I>0,L=k*w,E=T*w,R=E-L;m+=k,u+=T,y+=L,x+=E;const M=I!==0?C?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";g+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${t.border};background:${M};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${h.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${h.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${t.text}">${k.toLocaleString()}</span>
                    ${I!==0?`<span style="font-family:${e};font-size:10px;color:${t.dim}">→</span>
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${C?t.greenBright:t.red}">${T.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${h.multiplier}.0 × ${r} × ${c})</span>
                <span style="font-family:${e};font-size:10px;color:${h.color}">${_(w)}/yr</span>
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
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${R>0?t.red:t.greenBright}">${R>0?"+":""}${_(R)}/yr</span>
            </div>`:""}
        </div>`}const $=x-y;o.innerHTML=`
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
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">${_(s)}/yr</div>
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
            ${g}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;${f?"margin-bottom:6px;":""}">
                <div>
                    <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">WORKFORCE / CAPACITY</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <span style="font-family:${e};font-size:13px;font-weight:700;color:${m>=l?t.red:t.text}">${f?u.toLocaleString():m.toLocaleString()}</span>
                        <span style="font-family:${e};font-size:9px;color:${t.dim}">/ ${l.toLocaleString()}</span>
                    </div>
                    ${m>=l&&!f?`<div style="font-family:${e};font-size:7px;color:${t.red};margin-top:2px;">Need workplaces to hire new employees.</div>`:""}
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${_(y)}</span>
                        ${f?`<span style="font-family:${e};font-size:9px;color:${t.dim}">→</span>
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${$>0?t.red:t.greenBright}">${_(x)}</span>`:""}
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
    </div>`}function dr(){const o=document.getElementById("wf-summary-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},i=(S?.name||d?.nation||"Nation").toUpperCase(),n=Number(S?.minimum_wage??50),a=Number(S?.inflation??50),s=Number(S?.standard_of_living??50),r=n/100*48e3,c=1+(a-50)/100*.5,p=1+(s-50)/100*.5,f=[{label:"General Workforce",mult:2,color:t.accent,key:"corp_general_workforce",countColor:t.text},{label:"Skilled Workforce",mult:3,color:t.gold,key:"corp_skilled_workforce",countColor:t.blue},{label:"Innovative Workforce",mult:6,color:t.orange,key:"corp_innovative_workforce",countColor:t.gold}];let l=0,m=0,u="";for(const y of f){const x=Number(d?.[y.key]??0),g=Math.round(r*y.mult*c*p),$=x*g;l+=x,m+=$,u+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${y.label}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${i}</span>
                </div>
                <span style="font-family:${e};font-size:16px;font-weight:700;color:${y.countColor}">${x.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${y.mult}.0 × ${c.toFixed(2)} × ${p.toFixed(2)})</span>
                <span style="font-family:${e};font-size:10px;color:${t.muted}">${_(g)}/yr</span>
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
            <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.text}">${l.toLocaleString()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${u}
            <div style="padding:8px 12px;background:${t.card};border-bottom:1px solid ${t.border};">
                <div style="font-family:${e};font-size:8px;letter-spacing:1px;color:${t.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">MINIMUM WAGE (${i})</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">${n}/100 → ${_(r)}/yr</span>
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
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${_(m)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">PER TICK (÷12)</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${_(Math.round(m/12))}</span>
            </div>
        </div>
    </div>`}let V=[];async function Io(){if(!d?.id)return;const{data:o}=await v.from("corp_properties").select("*").eq("faction_id",d.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});V=o||[]}function No(){const o=document.getElementById("property-card-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=(S?.name||d?.nation||"Nation").toUpperCase(),n=1+(Number(S?.inflation??50)-50)/100*.3;let a="",s=0,r=0;const c=S?.name||d?.nation||"Home Nation",p=5e7,f=1+(Number(S?.inflation??50)-50)/100*.3,l=.8+Number(S?.stability??50)/100*.4,m=Math.round(p*f*l),u=Math.round(m*.005);s+=m,r+=u,a+=`
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
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${_(m)}</div>
            </div>
            <div style="flex:1;padding:3px 6px">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${_(u)}</div>
            </div>
        </div>
    </div>`;for(const y of V){const x=xo[y.style]||xo.Basic;s+=Number(y.purchase_price||0),r+=Number(y.monthly_maintenance||0),a+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:${t.text}">${y.name}</span>
                <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${t.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">OWNED</span>
            </div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:4px;">${y.city||i} · ${(y.type||"").replace(/_/g," ")} · <span style="color:${x.color}">${(y.style||"Basic").toUpperCase()}</span></div>
            <div style="display:flex;gap:0;background:${t.card};border:1px solid ${t.border}">
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">CAPACITY</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${(y.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">PAID</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${_(y.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${_(y.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="margin-top:4px;display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">CONDITION</span>
                <span style="font-family:${e};font-size:9px;color:${y.condition>=75?"#5c5":y.condition>=50?"#ca5":t.orange}">${y.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:${t.border};margin-top:2px;"><div style="width:${y.condition}%;height:100%;background:${y.condition>=75?"#5c5":y.condition>=50?"#ca5":t.orange}"></div></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <div onclick="propRefurbish('${y.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.accent};border:1px solid ${t.accent}33;cursor:pointer;">REFURBISH (${_(Math.round((y.purchase_price||0)*.1*n))})</div>
                <div onclick="propSell('${y.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.red};border:1px solid ${t.red}33;cursor:pointer;">SELL</div>
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
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.green}">${_(s)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL MAINTENANCE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${_(r)}/mo</span>
            </div>
        </div>
    </div>`}let dt=[],re=null;const xo={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function Un(){if(!d?.nation_id)return;const{data:o,error:e}=await v.from("available_properties").select("*").eq("nation_id",d.nation_id).eq("status","available").order("price",{ascending:!0});if(e){console.warn("[Property] Failed to load marketplace:",e.message);return}const t=d?.corp_sector==="Construction";dt=(o||[]).filter(i=>t||i.type!=="warehouse").map(i=>({...i,adjusted_cost:i.price,adjusted_maintenance:i.monthly_maintenance}))}function Mo(){const o=document.getElementById("new-property-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"};(S?.name||d?.nation||"Nation").toUpperCase();const i=Number(S?.standard_of_living??50),n=Number(S?.gdp_growth??50),a=Number(S?.inflation??50),s=S?.capital||"Capital",r={capital:s,port:s+" Port",industrial:s+" Industrial Zone",suburban:s+" Suburbs",coastal:s+" Coast"};let c="";if(dt.length===0)c=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let p=0;p<dt.length;p++){const f=dt[p],l=re===p,m=xo[f.style]||xo.Basic,u=r[f.city_template]||s;c+=`
            <div onclick="npSelect(${p})" style="padding:8px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${l?t.accent:"transparent"};background:${l?"rgba(139,154,107,0.03)":"transparent"};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <span style="font-size:11px;font-weight:600;color:${t.text}">${f.name}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${m.color};background:${m.color}12;border:1px solid ${m.color}25">${m.label}</span>
                </div>
                <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:5px;">${u} · ${f.type.replace(/_/g," ")}</div>
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
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${dt.length} AVAILABLE</span>
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
    </div>`}function cr(o){re=re===o?null:o,Mo()}let Xo=!1;async function pr(){if(re===null||Xo)return;const o=dt[re];if(!o)return;const e=Number(d?.corp_cash_reserves??0);if(o.adjusted_cost>e){alert(`Insufficient cash reserves.
Property: `+_(o.adjusted_cost)+`
Cash: `+_(e));return}if(confirm('Buy "'+o.name+'" for '+_(o.adjusted_cost)+`?

Monthly maintenance: `+_(o.adjusted_maintenance)+`/mo
Condition: `+o.condition+`%

This will be deducted from your cash reserves.`)){Xo=!0;try{const{error:t}=await v.from("corp_properties").insert({faction_id:d.id,nation_id:d.nation_id,catalog_id:o.catalog_id||null,name:o.name,type:o.type,style:o.style,capacity:o.capacity,purchase_price:o.adjusted_cost,monthly_maintenance:o.adjusted_maintenance,condition:o.condition,city:o.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(t)throw t;const i=Math.max(0,e-o.adjusted_cost),{error:n}=await v.from("factions").update({corp_cash_reserves:i}).eq("id",d.id);if(n)throw n;d.corp_cash_reserves=i,o.id&&await v.from("available_properties").update({status:"sold",purchased_by:d.id}).eq("id",o.id);const a=document.getElementById("topbar-cash");a&&(a.textContent="CASH: "+(i>=1e6?"$"+(i/1e6).toFixed(1)+"M":"$"+Math.round(i/1e3)+"k")),re=null,await Un(),Mo(),No(),alert("Property purchased: "+o.name+`

Deducted: `+_(o.adjusted_cost))}catch(t){alert("Purchase failed: "+t.message)}finally{Xo=!1}}}const gt={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let Hn=!1,A={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0,nationId:null,nationName:null},Zo=!1,_n=[];function Wi(){const e=1+(Number(S?.inflation??50)-50)/100*.3,t=gt[A.style]?.costMod||1,i=A.type==="Warehouse"?.75:1,n=Math.round(A.size*1e5*e*t*i),a=Math.round(n*(1+A.budgetMod/100)),s=Math.round(a*.007*(gt[A.style]?.maintMod||1));return{baseBudget:n,adjusted:a,maint:s,inflMod:e,styleMod:t}}async function fr(){Hn=!0,A={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0,nationId:null,nationName:null};try{const{data:o}=await v.from("nations").select("id, name").order("name");_n=(o||[]).filter(e=>e.id!==d?.nation_id)}catch{_n=[]}Yi()}function Gn(){Hn=!1,document.getElementById("cp-modal-overlay")?.remove()}function mr(o,e){A[o]=e,Yi()}async function ur(){if(!(Zo||!A.name.trim())){if(A.type==="Regional HQ"&&!A.nationId){alert("Select a target nation for the Regional HQ.");return}Zo=!0;try{const o=Wi(),e=A.type==="Regional HQ"?A.nationId:d.nation_id,t=A.type==="Regional HQ"?A.nationName||"Unknown":S?.name||d?.nation||"Unknown",i=gt[A.style]?.repGain||1,n=await v.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),a=n.data?.current_tick||0,s=(n.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:r}=await v.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",e).eq("issuer_type","PRIVATE"),p=`PVT-C${(r||0)+1}-${s}`,{error:f}=await v.from("construction_contracts").insert({nation_id:e,template_key:"custom_building",sector:"civil_engineering",name:A.name.trim(),project_type:A.type,project_subtype:A.style,description:`${A.type} (${A.style}) — ${A.size.toLocaleString()} employees, commissioned by ${d.faction_name}`,project_code:p,budget_ceiling:o.adjusted,timeline_ticks:A.timeline,required_materials:(()=>{const l=A.size/1e3,m=A.style,u={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[m]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},y=(x,g)=>Math.max(1,Math.ceil(l*x*g));return{concrete:y(8,u.concrete),steel:y(6,u.steel),glass_facades:y(3,u.glass),em_systems:y(4,u.em),lumber:y(1,u.lumber),heavy_parts:y(2,u.heavy),aggregate:y(3,u.agg)}})(),required_equipment:(()=>{const l=A.size,m={trucks:Math.ceil(l/2e3)+1,mixers:Math.ceil(l/3e3)+1};return l>1e3&&(m.excavators=Math.ceil(l/3e3)+1,m.cranes=Math.ceil(l/4e3)+1),l>3e3&&(m.bulldozers=Math.ceil(l/4e3)+1,m.haulers=Math.ceil(l/5e3)+1),l>8e3&&(m.piledrivers=Math.ceil(l/6e3)+1),m})(),required_workforce:{general:Math.ceil(A.size*.08),skilled:Math.ceil(A.size*.03)},status:"open",generated_at_tick:a,bidding_ends_tick:a+3,issuer_type:"PRIVATE",issuer_name:d.faction_name,issuer_faction_id:d.id});if(f)throw f;Gn(),alert(`Construction project submitted!

Project: `+A.name.trim()+`
Code: `+p+`
Budget: `+_(o.adjusted)+`
Expected Reputation: +`+Math.ceil(o.adjusted/1e8*3)+` (+3 per $100M)

All construction corporations in `+t+" can now bid on this project.")}catch(o){alert("Failed to submit project: "+o.message)}finally{Zo=!1}}}function Yi(){if(document.getElementById("cp-modal-overlay")?.remove(),!Hn)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=Wi(),i=S?.name||d?.nation||"Nation",n=Math.ceil(t.adjusted/1e8*3),a=n>=4?e.gold:n>=3?e.greenBright:n>=2?e.accent:e.dim,s=Object.entries(gt).map(([p,f])=>{const l=A.style===p;return`<div onclick="cpSetField('style','${p}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${l?f.color+"18":"transparent"};border:1px solid ${l?f.color+"44":e.border};">
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
                    ${["Regional HQ","Office Building",...d?.corp_sector==="Construction"?["Warehouse"]:[],...d?.corp_subsector?.toLowerCase()==="banking"?["Branch Office"]:[],...d?.corp_subsector?.toLowerCase()==="investment"?["Trading Floor"]:[],...d?.corp_subsector?.toLowerCase()==="insurance"?["Claims Office"]:[]].map(p=>{const f=["Branch Office","Trading Floor","Claims Office"].includes(p),m=p==="Warehouse"?e.orange:f?"#8a6aaa":e.accent;return`<span onclick="cpSetField('type','${p}')" style="flex:1;min-width:100px;text-align:center;padding:6px 0;font-family:${o};font-size:12px;font-weight:700;cursor:pointer;color:${A.type===p?"#000":e.dim};background:${A.type===p?m:"transparent"};border:1px solid ${A.type===p?m:e.border}">${p}</span>`}).join("")}
                </div>
                ${A.type==="Regional HQ"?`<div style="margin-top:8px;">
                    <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Target Nation</div>
                    <select id="cp-nation-select" onchange="cpSetField('nationId', this.value); cpSetField('nationName', this.options[this.selectedIndex].text)"
                        style="width:100%;padding:8px 12px;font-family:${o};font-size:12px;color:${e.text};background:${e.card};border:1px solid ${e.border};outline:none;">
                        <option value="">-- Select a nation --</option>
                        ${_n.map(p=>`<option value="${p.id}" ${A.nationId===p.id?"selected":""}>${p.name}</option>`).join("")}
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
                <div style="margin-top:5px;font-family:${o};font-size:10px;color:${gt[A.style].color}">${gt[A.style].desc}</div>
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
                        <span style="font-family:${o};font-size:12px;color:${e.muted}">${_(t.baseBudget)}</span>
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
                <div style="font-family:${o};font-size:18px;font-weight:700;color:${e.gold}">${_(t.adjusted)}</div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="cpClose()" style="padding:7px 20px;font-family:${o};font-size:12px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:7px 20px;font-family:${o};font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${e.gold};cursor:pointer;opacity:${A.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(r);const c=document.getElementById("cp-name-input");c&&c.addEventListener("input",p=>{A.name=p.target.value}),r.addEventListener("click",p=>{p.target===r&&Gn()})}function yr(){const o=document.getElementById("cp-name-input");if(o&&(A.name=o.value),!A.name.trim()){alert("Please enter a building name.");return}ur()}window.cpClose=Gn;window.cpSetField=mr;window.cpSubmitFromModal=yr;window.npSelect=cr;window.npBuyProperty=pr;window.npOpenConstructionModal=fr;let xt=!1;async function vr(o){if(xt)return;const e=V.find(r=>r.id===o);if(!e)return;const t=1+(Number(S?.inflation??50)-50)/100*.3,i=Math.round((e.purchase_price||0)*.1*t),n=Number(d?.corp_cash_reserves??0);if(i>n){alert("Insufficient cash. Refurbishment costs "+_(i)+" (inflation-adjusted), you have "+_(n));return}if(e.condition>=95){alert("Property is already in excellent condition ("+e.condition+"%).");return}const a=5+Math.floor(Math.random()*21),s=Math.min(100,e.condition+a);if(confirm('Refurbish "'+e.name+`"?

Cost: `+_(i)+`
Expected improvement: +`+a+"% condition ("+e.condition+"% → "+s+"%)")){xt=!0;try{await v.from("corp_properties").update({condition:s}).eq("id",o);const r=Math.max(0,n-i);await v.from("factions").update({corp_cash_reserves:r}).eq("id",d.id),d.corp_cash_reserves=r;const c=document.getElementById("topbar-cash");c&&(c.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")),await Io(),No(),alert("Refurbished! Condition: "+e.condition+"% → "+s+"%")}catch(r){alert("Refurbishment failed: "+r.message)}finally{xt=!1}}}async function gr(o){if(xt)return;const e=V.find(a=>a.id===o);if(!e)return;const t=1+(Number(S?.inflation??50)-50)/100*.3,i=(e.condition||50)/100,n=Math.round((e.purchase_price||0)*.6*i*t);if(confirm('Sell "'+e.name+`"?

Sale value: `+_(n)+" (60% × "+e.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){xt=!0;try{await v.from("corp_properties").update({is_active:!1}).eq("id",o);const s=Number(d?.corp_cash_reserves??0)+n;await v.from("factions").update({corp_cash_reserves:s}).eq("id",d.id),d.corp_cash_reserves=s;const c=(await v.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await v.from("available_properties").insert({nation_id:d.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,price:Math.round(n*1.1),monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,generated_at_tick:c,expires_at_tick:c+6,status:"available"});const p=document.getElementById("topbar-cash");p&&(p.textContent="CASH: "+(s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k")),await Io(),No(),await Un(),Mo(),alert('Sold "'+e.name+'" for '+_(n))}catch(a){alert("Sale failed: "+a.message)}finally{xt=!1}}}window.propRefurbish=vr;window.propSell=gr;const Pe={SALE:.8,DISSOLVE:.6,REVENUE_BASE:.02,GDP_NEUTRAL:30,DEFAULT_REPUTATION:25};function xr(o){if(!o)return 0;const e=o.trim().replace(/[$,]/g,""),t=e.match(/^([\d.]+)\s*[Mm]$/),i=e.match(/^([\d.]+)\s*[Kk]$/);return Math.round(t?parseFloat(t[1])*1e6:i?parseFloat(i[1])*1e3:parseFloat(e))}function Xe(o){const e=document.getElementById("topbar-cash");e&&(e.textContent="CASH: "+(o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k"))}function Qi(o){return Et.find(e=>e.id===o)?.name||"—"}function Ao(o){return V.filter(e=>e.nation_id===o)}async function Yt(){ct=0,await Io(),No(),Qt(),Kt()}let ae=!1,ct=0,ao={};async function br(){if(d?.id)try{const{data:o}=await v.from("construction_contracts").select("nation_id").eq("awarded_to_faction",d.id).in("status",["in_progress","awarded"]);ao={};for(const e of o||[])e.nation_id&&(ao[e.nation_id]=(ao[e.nation_id]||0)+1)}catch{}}function Ki(o){const e=Ao(o.nation_id),t=e.reduce((y,x)=>y+Number(x.purchase_price||0),0),i=e.reduce((y,x)=>y+Number(x.capacity||0),0),n=ao[o.nation_id]||0,a=Et.find(y=>y.id===o.nation_id),s=(o.name||"").trim().split(/\s+/),r=s.length>=2?s.map(y=>y[0]).join("").toUpperCase().slice(0,4):(o.name||"SUB").slice(0,4).toUpperCase(),c=Number(o.sub_cash||0),p=Number(a?.gdp_growth??50),f=c*Pe.REVENUE_BASE,l=(p-Pe.GDP_NEUTRAL)/100,m=Pe.DEFAULT_REPUTATION/100,u=c>0?Math.round(f*(1+l)*m):0;return{id:o.id,name:o.name,abbr:r,nation:a?.name||o.city||"—",nationId:o.nation_id,sector:d?.corp_sector||"General",subsector:o.subsector||d?.corp_subsector||"—",revenue:u,debt:0,cash:c,reputation:Pe.DEFAULT_REPUTATION,valuation:t,workforce:i,projects:n,established:o.created_at?new Date(o.created_at).getFullYear().toString():"—",trend:p>=40&&c>0?"up":p>=Pe.GDP_NEUTRAL&&c>0?"flat":"down",profitable:u>0,hqProp:o}}function Qt(){const o=document.getElementById("manage-subsidiaries-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=V.filter(f=>f.type==="regional_hq").map(Ki);ct>=n.length&&(ct=0);const a=n[ct]||null;let s="";n.length===0&&(s=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No subsidiaries established.<br>Use Create Subsidiary to expand.</div>`);let r=0,c=0;for(let f=0;f<n.length;f++){const l=n[f],m=f===ct;r+=l.revenue,c+=l.valuation;const u=l.trend==="up"?t.greenBright:l.trend==="down"?t.red:t.dim,y=l.trend==="up"?"▲":l.trend==="down"?"▼":"–";s+=`
        <div onclick="selectSubsidiary(${f})" style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${m?t.accent:"transparent"};background:${m?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:40px;font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${l.abbr}</span>
            <div style="flex:1.5;">
                <div style="font-size:11px;font-weight:600;color:${t.text};line-height:1.2">${l.name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${l.subsector}</div>
            </div>
            <span style="width:65px"><span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${l.nation.toUpperCase().slice(0,8)}</span></span>
            <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${l.profitable?t.greenBright:t.redDim};text-align:right">${_(l.revenue)}</span>
            <span style="width:40px;font-family:${e};font-size:9px;font-weight:700;color:${l.reputation>=40?t.accent:l.reputation>=25?t.yellow:t.orange};text-align:right">${l.reputation}</span>
            <span style="width:55px;font-family:${e};font-size:9px;color:${t.muted};text-align:right">${_(l.valuation)}</span>
            <span style="width:12px;font-family:${e};font-size:8px;color:${u};text-align:right">${y}</span>
        </div>`}let p="";if(a){const f=a.trend==="up"?t.greenBright:a.trend==="down"?t.red:t.dim,l=a.trend==="up"?"▲":a.trend==="down"?"▼":"–",m=a.trend==="up"?"Growing":a.trend==="down"?"Declining":"Stable",u=a.reputation>=40?t.accent:a.reputation>=25?t.yellow:t.orange,y=[{label:"Revenue",value:_(a.revenue),color:a.profitable?t.greenBright:t.redDim},{label:"Cash",value:_(a.cash),color:t.text},{label:"Debt",value:a.debt>0?_(a.debt):"$0",color:a.debt>0?t.orange:t.dim},{label:"Reputation",value:a.reputation+"/100",color:u},{label:"Market Valuation",value:_(a.valuation),color:t.gold},{label:"Workforce",value:a.workforce.toLocaleString(),color:t.text},{label:"Active Projects",value:a.projects.toString(),color:a.projects>0?t.text:t.dim}],x=a.projects===0,g=a.hqProp?.logo_url?`<img src="${b(a.hqProp.logo_url)}" alt="" style="width:32px;height:32px;object-fit:cover;border-radius:4px;">`:`<label style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:${t.card};border:1px dashed ${t.border};border-radius:4px;cursor:pointer;font-size:14px;color:${t.dim};" title="Upload subsidiary logo">+<input type="file" accept="image/*" id="sub-logo-upload" data-prop-id="${a.hqProp?.id||""}" style="display:none;"></label>`;p=`
            <div style="padding:8px 14px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                    ${g}
                    <div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.gold}">${a.abbr}</span>
                            <span style="font-size:12px;font-weight:700;color:${t.text}">${a.name}</span>
                        </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${a.nation.toUpperCase()}</span>
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">Est. ${a.established}</span>
                    <span style="font-family:${e};font-size:8px;color:${f}">${l} ${m}</span>
                </div>
                    </div>
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
                <div style="width:100%;height:4px;background:${t.border}"><div style="width:${a.reputation}%;height:100%;background:${u}"></div></div>
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
                    <div onclick="${x?"subDissolve('"+a.id+"')":""}" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${x?t.red:t.dim};border:1px solid ${x?t.red:t.border};opacity:${x?1:.3}">DISSOLVE</div>
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
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${_(r)}</span>
                    <span style="width:40px"></span>
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${_(c)}</span>
                    <span style="width:12px"></span>
                </div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${p}
            </div>
        </div>
    </div>`,document.getElementById("sub-logo-upload")?.addEventListener("change",async f=>{const l=f.target.files?.[0],m=f.target.dataset.propId;if(!(!l||!m)){if(l.size>2*1024*1024){alert("Logo must be under 2MB.");return}try{const u=l.name.split(".").pop()?.toLowerCase()||"png",y=`party-logos/${d.id}/sub_${m}_${Date.now()}.${u}`,{error:x}=await v.storage.from("public-assets").upload(y,l,{contentType:l.type,upsert:!0});if(x)throw x;const{data:g}=v.storage.from("public-assets").getPublicUrl(y),$=g?.publicUrl;if($){await v.from("corp_properties").update({logo_url:$}).eq("id",m);const h=V.find(k=>k.id===m);h&&(h.logo_url=$),Qt()}}catch(u){alert("Upload failed: "+(u.message||"Error"))}}}),a&&(a.subsector==="Insurance"||a.subsector==="Banking")){const f="sub-dashboard-"+a.id;setTimeout(()=>{document.getElementById(f)&&ba(v,{faction:d,nation:S,shard:z},f,a.id).catch(l=>console.error("[SubDash] Init failed:",l))},50)}}async function Ji(o,e){if(ae)return;const t=V.find(u=>u.id===o);if(!t)return;const i=e==="sell",n=i?Pe.SALE:Pe.DISSOLVE,a=i?"SELL":"DISSOLVE",s=i?"sold":"dissolved",r=i?"80%":"60%",c=Qi(t.nation_id),p=Ao(t.nation_id),f=p.reduce((u,y)=>u+Math.round((y.purchase_price||0)*n*(y.condition||50)/100),0),l=Number(t.sub_cash||0),m=f+l;if(confirm(a+' subsidiary "'+t.name+`"?

`+p.length+" properties at "+r+` × condition:
  Property value: `+_(f)+`
  Subsidiary cash: `+_(l)+`
  ─────────────────
  Total return: `+_(m)+`

All operations in `+c+` cease.
This cannot be undone.`)){ae=!0;try{const u=p.map(x=>x.id);if(u.length===1){const{error:x}=await v.from("corp_properties").update({is_active:!1}).eq("id",u[0]);if(x)throw x}else if(u.length>1){const{error:x}=await v.from("corp_properties").update({is_active:!1}).in("id",u);if(x)throw x}await v.from("corp_properties").update({sub_cash:0}).eq("id",o).then(()=>{}).catch(()=>{});const y=Number(d?.corp_cash_reserves??0)+m;await v.from("factions").update({corp_cash_reserves:y}).eq("id",d.id),d.corp_cash_reserves=y,Xe(y),await Yt(),alert("Subsidiary "+s+". "+p.length+` properties liquidated.
Total received: `+_(m))}catch(u){alert("Failed: "+u.message)}finally{ae=!1}}}function _r(o){Ji(o,"sell")}async function hr(o){if(ae)return;const e=V.find(r=>r.id===o);if(!e)return;const t=Qi(e.nation_id),n=Ao(e.nation_id).reduce((r,c)=>r+Math.round((c.purchase_price||0)*.8*(c.condition||50)/100),0),a=Number(e.sub_cash||0),s=Math.round(a*.05);if(confirm('PUT UP FOR SALE: "'+e.name+`"

Nation: `+t+`
Estimated Valuation: `+_(n)+`
Subsidiary Cash: `+_(a)+`
Subsector: `+(e.subsector||"General")+`

This will list your subsidiary on the marketplace.
Other corporations can place bids (minimum $1M).
You review and accept bids.

Continue?`)){ae=!0;try{const r=z?.current_tick||0,{data:c,error:p}=await v.from("subsidiary_sales").insert({subsidiary_id:o,seller_faction_id:d.id,nation_id:e.nation_id,subsidiary_name:e.name,subsector:e.subsector||null,valuation:n,monthly_revenue:s,sub_cash_at_listing:a,employee_count:e.capacity||0,status:"listed",listed_at_tick:r}).select("*").single();if(p){alert("Failed to list: "+p.message);return}alert('"'+e.name+`" is now listed for sale.

Other corporations will see it on the Expansion tab and can place bids.`),await Yt()}catch(r){alert("Failed: "+r.message)}finally{ae=!1}}}let bo=[],Xi="ready",Mt=null;async function Ro(){const o=await $a(v);bo=o.listings,Xi=o.state,Mt=o.error,Mt&&console.error("[SubMarket] Load failed:",Mt.message)}function Lo(){let o=document.getElementById("sub-marketplace-card");o||(o=document.createElement("div"),o.id="sub-marketplace-card",document.getElementById("expansion-content")?.appendChild(o));const e=bo.filter(s=>s.seller_faction_id!==d?.id),t=bo.filter(s=>s.seller_faction_id===d?.id),i="'JetBrains Mono',monospace",n={surface:"#1a1a17",card:"#1c1c18",border:"rgba(255,255,255,0.06)",dim:"#4a4940",muted:"#666",text:"#c4c2b8",bright:"#f0efe6",orange:"#c84",green:"#5cb85c",red:"#d9534f",gold:"#c8a832"};let a=`<div style="width:760px;background:${n.surface};border:1px solid ${n.border};font-family:'IBM Plex Sans',sans-serif;">
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
            </div>`}a+="</div>"}if(Xi==="error")a+=`<div style="padding:24px 14px;text-align:center;font-family:${i};font-size:10px;color:${n.red};font-style:italic;">${b(Mt&&Mt.message||"Subsidiary marketplace is temporarily unavailable.")}</div>`;else if(e.length===0)a+=`<div style="padding:24px 14px;text-align:center;font-family:${i};font-size:10px;color:${n.dim};font-style:italic;">No subsidiaries for sale right now.</div>`;else for(const s of e){const r=(s.subsidiary_bids||[]).find(f=>f.bidder_faction_id===d?.id&&f.status==="pending"),p=(_allNations||[]).find(f=>f.id===s.nation_id)?.name||"Unknown";a+=`<div style="padding:10px 14px;border-bottom:1px solid ${n.border};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:12px;font-weight:700;color:${n.bright};">${b(s.subsidiary_name)}</span>
                        <span style="font-family:${i};font-size:7px;font-weight:700;padding:1px 5px;color:${n.orange};border:1px solid ${n.orange}44;background:${n.orange}0a;">${b(s.subsector||"General")}</span>
                    </div>
                    <span style="font-family:${i};font-size:8px;color:${n.dim};">${b(p)}</span>
                </div>
                <div style="display:flex;gap:16px;font-family:${i};font-size:8px;color:${n.muted};margin-bottom:8px;">
                    <span>Valuation: <strong style="color:${n.text};">${_(s.valuation)}</strong></span>
                    <span>Revenue: <strong style="color:${n.text};">${_(s.monthly_revenue)}/mo</strong></span>
                    <span>Cash: <strong style="color:${n.text};">${_(s.sub_cash_at_listing)}</strong></span>
                    <span>Staff: <strong style="color:${n.text};">${s.employee_count}</strong></span>
                </div>
                <div style="display:flex;justify-content:flex-end;">
                    ${r?`<span style="font-family:${i};font-size:8px;font-weight:700;color:${n.green};">✓ BID PLACED: ${_(r.bid_amount)}</span>`:`<span onclick="subPlaceBid('${s.id}','${b(s.subsidiary_name)}',${s.valuation})" style="font-family:${i};font-size:8px;font-weight:700;padding:4px 14px;color:#000;background:${n.orange};cursor:pointer;">PLACE BID</span>`}
                </div>
            </div>`}a+="</div>",o.innerHTML=a}async function $r(o,e,t){const i=prompt('Place bid for "'+e+`"

Valuation: `+_(t)+`
Minimum bid: $1M

Enter bid amount ($):`);if(!i)return;const n=Math.round(Number(i));if(isNaN(n)||n<1e6){alert("Minimum bid is $1,000,000.");return}const a=Number(d?.corp_cash_reserves??0);if(n>a){alert("Insufficient funds. You have "+_(a)+".");return}const{error:s}=await v.from("subsidiary_bids").insert({sale_id:o,bidder_faction_id:d.id,bid_amount:n,status:"pending",placed_at_tick:z?.current_tick||0});if(s){s.message.includes("duplicate")||s.message.includes("unique")?alert("You already have a bid on this subsidiary."):alert("Failed to place bid: "+s.message);return}alert("Bid of "+_(n)+' placed on "'+e+`".
The seller will review your bid.`),await Ro(),Lo()}async function wr(o){const e=bo.find(m=>m.id===o);if(!e)return;const t=(e.subsidiary_bids||[]).filter(m=>m.status==="pending");if(t.length===0){alert("No pending bids.");return}const i=t.map(m=>m.bidder_faction_id),{data:n}=await v.from("factions").select("id, faction_name").in("id",i),a={};(n||[]).forEach(m=>{a[m.id]=m.faction_name});let s='Bids for "'+e.subsidiary_name+`":

`;const r=t.sort((m,u)=>u.bid_amount-m.bid_amount);for(let m=0;m<r.length;m++){const u=r[m];s+=m+1+". "+(a[u.bidder_faction_id]||"Unknown")+": "+_(u.bid_amount)+`
`}s+=`
Enter the number of the bid to accept (or cancel):`;const c=prompt(s);if(!c)return;const p=parseInt(c,10)-1;if(isNaN(p)||p<0||p>=r.length){alert("Invalid selection.");return}const f=r[p],l=a[f.bidder_faction_id]||"Unknown";confirm("Accept bid of "+_(f.bid_amount)+" from "+l+`?

This will transfer ownership of "`+e.subsidiary_name+`" to them.
You will receive `+_(f.bid_amount)+` in cash.

This cannot be undone.`)&&await kr(e,f)}let en=!1;async function kr(o,e){if(!en){en=!0;try{const n=z?.current_tick||0,{data:a}=await v.from("factions").select("corp_cash_reserves").eq("id",e.bidder_faction_id).single(),s=Number(a?.corp_cash_reserves??0);if(s<e.bid_amount){alert("Buyer has insufficient funds. Bid cannot be completed."),await v.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:n}).eq("id",e.id);return}var{error:t}=await v.from("factions").update({corp_cash_reserves:s-e.bid_amount}).eq("id",e.bidder_faction_id);if(t){alert("Failed to deduct from buyer: "+t.message);return}const r=Number(d?.corp_cash_reserves??0);var{error:i}=await v.from("factions").update({corp_cash_reserves:r+e.bid_amount}).eq("id",d.id);if(i){await v.from("factions").update({corp_cash_reserves:s}).eq("id",e.bidder_faction_id),alert("Failed to credit seller: "+i.message);return}d.corp_cash_reserves=r+e.bid_amount,await v.from("corp_properties").update({faction_id:e.bidder_faction_id}).eq("id",o.subsidiary_id);const c=V.filter(p=>p.nation_id===o.nation_id&&p.faction_id===d.id);for(const p of c)await v.from("corp_properties").update({faction_id:e.bidder_faction_id}).eq("id",p.id);await v.from("subsidiary_sales").update({status:"completed",completed_at_tick:n,accepted_bid_id:e.id}).eq("id",o.id),await v.from("subsidiary_bids").update({status:"accepted",resolved_at_tick:n}).eq("id",e.id),await v.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:n}).eq("sale_id",o.id).neq("id",e.id),Xe(d.corp_cash_reserves),alert("Sale complete! Received "+_(e.bid_amount)+`.

"`+o.subsidiary_name+'" has been transferred to the buyer.'),await Yt(),await Ro(),Lo()}catch(n){console.error("[SubMarket] Accept bid error:",n),alert("Transfer failed: "+n.message)}finally{en=!1}}}async function Er(o){if(!confirm("Cancel this listing? The subsidiary will no longer be for sale."))return;const{error:e}=await v.from("subsidiary_sales").update({status:"cancelled"}).eq("id",o);if(e){alert("Failed: "+e.message);return}await Ro(),Lo()}function Cr(o){Ji(o,"dissolve")}async function Zi(o,e){if(ae)return;const t=V.find(l=>l.id===o);if(!t)return;const i=Number(d?.corp_cash_reserves??0),n=Number(t.sub_cash||0),a=e?"WITHDRAW":"INJECT CAPITAL";if(e&&n<=0){alert("This subsidiary has no cash to withdraw.");return}const s=e?n:i,r=prompt(a+(e?" from ":" into ")+t.name+`

Parent cash: `+_(i)+`
Subsidiary cash: `+_(n)+`

Enter amount (e.g., 5000000 or 5M):`);if(!r)return;const c=xr(r);if(!c||c<=0||isNaN(c)){alert("Invalid amount.");return}if(c>s){alert("Insufficient "+(e?"subsidiary":"parent")+" cash. Available: "+_(s));return}const p=e?i+c:i-c,f=e?n-c:n+c;if(confirm(a+" "+_(c)+(e?" from ":" into ")+t.name+`?

Parent: `+_(i)+" → "+_(p)+`
Subsidiary: `+_(n)+" → "+_(f))){ae=!0;try{await Promise.all([v.from("factions").update({corp_cash_reserves:p}).eq("id",d.id),v.from("corp_properties").update({sub_cash:f}).eq("id",o)]),d.corp_cash_reserves=p,t.sub_cash=f,Xe(p),Qt(),alert((e?"Withdrew ":"Injected ")+_(c)+(e?" from ":" into ")+t.name+".")}catch(l){alert("Failed: "+l.message)}finally{ae=!1}}}function Sr(o){Zi(o,!1)}function zr(o){Zi(o,!0)}async function Tr(o){if(ae)return;const e=V.find(x=>x.id===o);if(!e)return;const t=Ki(e);t.nation;const i=Ao(e.nation_id),n=t.valuation,a=t.cash,s=t.reputation,r=t.subsector,c=Math.round(n*2.25),p=Math.round(s*.1),f=Math.round(s*.2),l=zo(),m=Ye.reduce((x,g)=>x+Number(d?.[g.factionKey]??0),0),u=Math.max(0,l-m),y=Number(d?.corp_cash_reserves??0);if(c>y){alert(`Insufficient cash to acquire subsidiary.

Acquisition cost (2.25× valuation): `+_(c)+`
Available cash: `+_(y));return}if(t.projects>0){alert("Cannot merge — subsidiary has "+t.projects+" active project(s). Complete or abandon them first.");return}if(confirm('MERGE "'+e.name+`" INTO YOUR CORPORATION

Acquisition cost (2.25× valuation): `+_(c)+`
Subsidiary cash absorbed: `+_(a)+`
Net cost: `+_(c-a)+`

• `+i.length+` properties transferred to parent
• Subsidiary subsector "`+r+`" added to portfolio
• Workers hired to max capacity (+`+u.toLocaleString()+`)
• Reputation: +`+p+" or -"+f+" (from sub rep "+s+`)

This cannot be undone.`)){ae=!0;try{const x=d.nation_id;if(i.length>0){const C=i.filter(E=>E.id!==e.id).map(E=>E.id);if(C.length===1){const{error:E}=await v.from("corp_properties").update({nation_id:x,type:"office"}).eq("id",C[0]);if(E)throw E}else if(C.length>1){const{error:E}=await v.from("corp_properties").update({nation_id:x,type:"office"}).in("id",C);if(E)throw E}const{error:L}=await v.from("corp_properties").update({nation_id:x,type:"office",sub_cash:0,subsector:null}).eq("id",e.id);if(L)throw L}const g=y-c+a,h=Number(d?.corp_general_workforce??0)+u,k=Math.random()>=.5?p:-f,I=Number(d?.standing??50),T=Math.max(0,Math.min(100,I+k)),{error:w}=await v.from("factions").update({corp_cash_reserves:g,corp_general_workforce:h,standing:T}).eq("id",d.id);if(w)throw w;d.corp_cash_reserves=g,d.corp_general_workforce=h,d.standing=T,Xe(g),await Yt(),alert(`Merger complete!

"`+e.name+`" absorbed into your corporation.
Cost: `+_(c)+" | Cash absorbed: "+_(a)+`
Reputation `+(k>=0?"+":"")+k+" (now "+T+`)
Workers hired: +`+u.toLocaleString()+` general workforce
Properties: `+i.length+" transferred to parent")}catch(x){alert("Merge failed: "+x.message)}finally{ae=!1}}}window.subDissolve=Cr;window.subInjectCapital=Sr;window.subWithdraw=zr;window.subMerge=Tr;window.subSell=_r;window.subPutForSale=hr;window.subPlaceBid=$r;window.subViewBids=wr;window.subCancelSale=Er;window.selectSubsidiary=function(o){ct=o,Qt()};let Et=[],At={},ue=null,tn=!1,Ze="",Ft="",et="",Ie="";const ea={Construction:4,Finance:5,Shipping:4},Ir=["Construction","Shipping","Finance"],ta={Construction:[{id:"civil",name:"Civil Engineering",mod:0},{id:"industrial",name:"Industrial Construction",mod:.25},{id:"mega",name:"Megaprojects",mod:.4}],Shipping:[{id:"bulk_cargo",name:"Bulk Cargo",mod:0},{id:"container_freight",name:"Container Freight",mod:.2},{id:"specialized_transport",name:"Specialized Transport",mod:.35}],Finance:[{id:"banking",name:"Banking",mod:0},{id:"insurance",name:"Insurance",mod:.15},{id:"investment",name:"Investment Management",mod:.3}],Technology:[{id:"software",name:"Software Development",mod:0},{id:"hardware",name:"Hardware Manufacturing",mod:.2},{id:"telecom",name:"Telecommunications",mod:.35}],Energy:[{id:"oil_gas",name:"Oil & Gas",mod:0},{id:"renewables",name:"Renewables",mod:.2},{id:"mining",name:"Mining",mod:.3}],Healthcare:[{id:"pharma",name:"Pharmaceuticals",mod:0},{id:"hospitals",name:"Hospital Systems",mod:.2},{id:"biotech",name:"Biotechnology",mod:.35}]};async function Nr(){const{data:o,error:e}=await v.from("nations").select("*").order("name");e&&console.warn("[Subsidiary] Failed to load nations:",e.message),Et=(o||[]).filter(i=>i.id!==d?.nation_id);const{data:t}=await v.from("factions").select("nation_id").eq("faction_type","corporation").is("abandoned_at",null);At={};for(const i of t||[])i.nation_id&&(At[i.nation_id]=(At[i.nation_id]||0)+1);et=d?.corp_sector||"",Ie=d?.corp_subsector||""}function oa(){const o=et||d?.corp_sector||"";return ta[o]||[{id:"general",name:o||"General",mod:0}]}function Mr(o){et=o;const e=ta[o];Ie=e?e[0].name:"",Kt()}function na(){const o=d?.corp_sector||"";return et===o?1:ea[et]||4}function Ar(){const e=oa().find(t=>t.name===Ie);return e?e.mod:0}function hn(o){const e=Number(o.standard_of_living??50);return Math.max(.5,Math.round(e/50*100)/100)}function ia(o){const t=na(),i=1+Ar(),n=hn(o);return Math.round(Math.max(1e7,5e7*t*i*n))}function Rr(o){const e=At[o]||0;return e<=1?{label:"HIGH",color:"#5c5"}:e<=3?{label:"MODERATE",color:"#ca5"}:{label:"LOW",color:"#c55"}}function Lr(o){if(ue=ue===o?null:o,ue){const e=Et.find(t=>t.id===ue);Ze=(d?.faction_name||"Subsidiary")+" "+(e?.name||"")}else Ze="";Kt()}function qr(o){Ie=o,Kt()}function Or(o){Ze=o}function Br(o){Ft=o.toUpperCase().slice(0,4)}async function Pr(){if(tn||!ue)return;const o=Et.find(s=>s.id===ue);if(!o)return;const e=(Ze||"").trim(),t=(Ft||"").trim();if(!e){alert("Please enter a corporation name for the subsidiary.");return}if(t.length<2){alert("Please enter an abbreviation (2-4 chars).");return}if(V.find(s=>s.nation_id===o.id&&s.type==="regional_hq")){alert("You already have a subsidiary in "+o.name);return}const n=ia(o),a=Number(d?.corp_cash_reserves??0);if(n>a){alert("Insufficient cash. Entry cost: "+_(n)+", available: "+_(a));return}if(confirm("Establish subsidiary in "+o.name+`?

Name: `+e+" ("+t+`)
Subsector: `+(Ie||"General")+`
Entry cost: `+_(n)+`
Creates a Regional HQ (500 capacity)
Unlocks `+o.name+` for operations

Deducted from cash reserves.`)){tn=!0;try{const r=(await v.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0,c=85+Math.floor(Math.random()*16),p=Math.round(n*.005),{error:f}=await v.from("corp_properties").insert({faction_id:d.id,nation_id:o.id,name:e,type:"regional_hq",style:"Modern",capacity:500,purchase_price:n,monthly_maintenance:p,condition:c,city:o.capital||o.name,purchased_at_tick:r,is_active:!0,subsector:Ie||d?.corp_subsector||null});if(f)throw f;const l=Math.max(0,a-n);await v.from("factions").update({corp_cash_reserves:l}).eq("id",d.id),d.corp_cash_reserves=l,Xe(l);const m=et||d?.corp_sector||"Unknown";try{await v.from("event_log").insert({nation_id:o.id,event_name:"New Subsidiary Established",category:"corporate",description_chosen:`${d.faction_name} has invested ${_(n)} to establish ${e}, a new ${m} corporation in ${o.name}.`,fired_at_tick:z?.current_tick||0})}catch{}try{const{data:u}=await v.from("nations").select("gdp_growth").eq("id",o.id).single();u&&await v.from("nations").update({gdp_growth:Math.min(100,Number(u.gdp_growth||50)+.2)}).eq("id",o.id)}catch{}ue=null,Ze="",Ft="",await Yt(),alert('Subsidiary "'+e+'" established in '+o.name+`!

Cost: `+_(n)+`
Regional HQ created with `+c+"% condition.")}catch(s){alert("Failed: "+s.message)}finally{tn=!1}}}function Kt(){const o=document.getElementById("create-subsidiary-container");if(!o)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=d?.corp_sector||"General",n=d?.corp_subsector||"",a=oa(),s=a.find(E=>E.name===Ie)||a[0],r=new Set(V.filter(E=>E.type==="regional_hq").map(E=>E.nation_id)),c=Et.filter(E=>!r.has(E.id)),p=ue?c.find(E=>E.id===ue):null,f=Ze.trim().length>0&&Ft.trim().length>=2&&p!==null,l=et||i,m=na();let u=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Sector</div>
        <div style="display:flex;gap:3px;">
            ${Ir.map(E=>{const R=E===l,M=E===i,O=M?1:ea[E]||4,F=M?t.greenBright:t.orange;return`<div onclick="subSetSector('${E}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${R?t.accent+"18":"transparent"};border:1px solid ${R?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${R?t.accentBright:t.dim}">${E}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${F}">${M?"PARENT · ×1":"×"+O+" COST"}</div>
                </div>`}).join("")}
        </div>
        ${m>1?`<div style="font-family:${e};font-size:7px;color:${t.orange};margin-top:4px;padding:3px 6px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);">Cross-sector subsidiary: base cost ×${m}</div>`:""}
    </div>`,y=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsector</div>
        <div style="display:flex;gap:3px;">
            ${a.map(E=>{const R=E.name===Ie,M=E.name===n;return`<div onclick="subSetSubsector('${E.name.replace(/'/g,"\\'")}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${R?t.accent+"18":"transparent"};border:1px solid ${R?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:8px;font-weight:700;color:${R?t.accentBright:t.dim}">${E.name}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${M?t.greenBright:E.mod>0?t.orange:t.dim}">${M?"SAME — ±0%":E.mod>0?"+"+Math.round(E.mod*100)+"%":"±0%"}</div>
                </div>`}).join("")}
        </div>
    </div>`,x="";if(c.length===0)x=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Subsidiaries in all available nations.</div>`;else for(const E of c){const R=E.id===ue,M=Rr(E.id),O=At[E.id]||0,F=Math.round(Number(E.standard_of_living??50)),j=hn(E);x+=`
            <div onclick="subSelectNation('${E.id}')" style="display:flex;align-items:center;padding:4px 8px;margin-bottom:2px;cursor:pointer;background:${R?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${R?t.accent+"44":t.border};border-left:${R?"2px solid "+t.accent:"2px solid transparent"};">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:11px;font-weight:600;color:${R?t.text:t.muted}">${E.name}</span>
                        <span style="font-family:${e};font-size:7px;font-weight:700;padding:0 4px;color:${M.color};background:${M.color}12;border:1px solid ${M.color}25;line-height:12px">${M.label}</span>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:2px;">
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">STD/LIVING: <span style="color:${t.muted}">${F}</span></span>
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">CORPS: <span style="color:${O>=4?t.red:O>=2?t.yellow:t.greenBright}">${O}</span></span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${j>1?t.orange:t.greenBright}">×${j.toFixed(2)}</div>
                </div>
            </div>`}let g=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="margin-bottom:6px;">
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Corporation Name</div>
            <input type="text" value="${(Ze||"").replace(/"/g,"&quot;")}" oninput="subSetName(this.value)" placeholder="e.g., ${(d?.faction_name||"Corp")+" "+(p?.name||"International")}" style="width:100%;padding:5px 8px;font-family:${e};font-size:10px;color:${t.text};background:${t.card};border:1px solid ${t.border};outline:none;box-sizing:border-box;" />
        </div>
        <div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Abbreviation (2-4 chars)</div>
            <input type="text" value="${(Ft||"").replace(/"/g,"&quot;")}" oninput="subSetAbbr(this.value)" placeholder="${(d?.faction_name||"CORP").slice(0,2).toUpperCase()+(p?.name||"XX").slice(0,2).toUpperCase()}" maxlength="4" style="width:80px;padding:5px 8px;font-family:${e};font-size:12px;font-weight:700;color:${t.gold};background:${t.card};border:1px solid ${t.border};outline:none;text-align:center;letter-spacing:2px;" />
        </div>
    </div>`;const $=[{rule:"Bid on projects in that nation",icon:"✓",color:t.greenBright},{rule:"Hires local workers at nation rates",icon:"✓",color:t.greenBright},{rule:"Must use parent's materials & vehicles",icon:"!",color:t.orange},{rule:"Reputation gain: 75% sub / 25% parent",icon:"◐",color:t.gold},{rule:"Market revenue at 50% parent rate",icon:"◐",color:t.gold},{rule:"Counts as domestic corporation",icon:"✓",color:t.greenBright},{rule:"Starting reputation: 25",icon:"●",color:t.muted}];let h=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsidiary Rules</div>
        <div style="background:${t.card};border:1px solid ${t.border};padding:6px 8px;">
            ${$.map((E,R)=>`<div style="display:flex;align-items:center;gap:6px;padding:2px 0;${R<$.length-1?"border-bottom:1px solid "+t.border:""}">
                <span style="font-family:${e};font-size:9px;color:${E.color};width:12px;text-align:center">${E.icon}</span>
                <span style="font-size:9px;color:${t.muted}">${E.rule}</span>
            </div>`).join("")}
        </div>
    </div>`;const k=5e7,I=s.mod,T=p?hn(p):null,w=p?ia(p):null,C=Math.round(k*m*(1+I));let L=`
    <div style="background:${t.bg};border:1px solid ${t.border};padding:6px 8px;margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">BASE</span>
            <span style="font-family:${e};font-size:9px;color:${t.muted}">${_(k)}</span>
        </div>
        ${m>1?`<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">SECTOR (${l})</span>
            <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.orange}">×${m}</span>
        </div>`:""}
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">SUBSECTOR (${s.name})</span>
            <span style="font-family:${e};font-size:9px;color:${I===0?t.greenBright:t.orange}">${I===0?"±0%":"+"+Math.round(I*100)+"%"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">NATION (${p?p.name:"select below"})</span>
            <span style="font-family:${e};font-size:9px;color:${p?T>1?t.orange:t.greenBright:t.dim}">${p?"×"+T.toFixed(2):"—"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:3px 0;">
            <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.text}">TOTAL COST</span>
            <span style="font-family:${e};font-size:14px;font-weight:700;color:${t.gold}">${p?_(w):"~"+_(C)}</span>
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
            ${u}
            ${y}
            <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
                <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Nation</div>
                ${x}
            </div>
            ${g}
            ${h}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            ${L}
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
    </div>`}window.subSelectNation=Lr;window.subCreate=Pr;window.subSetName=Or;window.subSetAbbr=Br;window.subSetSector=Mr;window.subSetSubsector=qr;let Rt=[],Ue=0,_o=JSON.parse(localStorage.getItem("nationhood_investigated_corps")||"{}"),xe="ALL",Be="REPUTATION";async function Dr(){const[o,e]=await Promise.all([v.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, corp_reputation, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name"),v.from("corp_properties").select("id, faction_id, name, nation_id, subsector, type, factions(faction_name, corp_sector, corp_ticker, abbreviation, corp_reputation, corp_company_type, linked_user_id)").eq("type","regional_hq").eq("is_active",!0)]),t={};for(const s of o.data||[])t[s.id]=s;const i=(o.data||[]).map(s=>{const r=(s.corp_company_type||"Private").toUpperCase(),c=Number(s.corp_cash_reserves||0);return{...s,abbr:s.corp_ticker||s.abbreviation||s.faction_name?.slice(0,4).toUpperCase()||"???",status:r,isPlayer:!!s.linked_user_id,reputation:Math.round(Number(s.corp_reputation??50)),revenue:Math.round(c*.1),valuation:Math.round(c*3),_isSub:!1}}),{data:n}=await v.from("nations").select("id, name"),a={};(n||[]).forEach(s=>{a[s.id]=s.name});for(const s of e.data||[]){const r=t[s.faction_id];if(!r)continue;const c=(r.corp_company_type||"Private").toUpperCase();i.push({id:s.id,faction_name:s.name||"Subsidiary",abbreviation:r.abbreviation,corp_sector:r.corp_sector,corp_subsector:s.subsector||r.corp_subsector,corp_ticker:r.corp_ticker,nation_id:s.nation_id,nation:a[s.nation_id]||"?",abbr:(r.corp_ticker||r.abbreviation||"??").slice(0,4),status:c,isPlayer:!!r.linked_user_id,reputation:Math.round(Number(r.corp_reputation??50)),revenue:0,valuation:0,_isSub:!0,_parentName:r.faction_name})}Rt=i}function jr(o){Ue=o,Jt()}function Fr(o){xe=o,Ue=0,Jt()}function Ur(o){Be=o,Ue=0,Jt()}async function Hr(o){if(!d||!z)return;const e=Number(d.corp_cash_reserves??0);if(e<5e5){alert("Insufficient cash. Need $500k.");return}const{error:t}=await v.from("factions").update({corp_cash_reserves:e-5e5}).eq("id",d.id);if(t){alert("Failed: "+t.message);return}d.corp_cash_reserves=e-5e5,_o[o]=!0,localStorage.setItem("nationhood_investigated_corps",JSON.stringify(_o));const{data:i}=await v.from("factions").select("corp_cash_reserves, corp_loans, corp_reputation, corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce").eq("id",o).single();if(i){const n=Rt.find(a=>a.id===o);if(n){Object.assign(n,i);const a=Number(i.corp_cash_reserves||0);n.reputation=Math.round(Number(i.corp_reputation??50)),n.revenue=Math.round(a*.1),n.valuation=Math.round(a*3)}}Jt()}function Jt(){const o=document.getElementById("corporations-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i={PUBLIC:{color:t.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:t.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:t.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},n=[...new Set(Rt.map(u=>u.nation).filter(Boolean))];let a=[...Rt];xe!=="ALL"&&(a=a.filter(u=>u.nation===xe)),Be==="REPUTATION"?a.sort((u,y)=>(y.reputation||0)-(u.reputation||0)):Be==="REVENUE"?a.sort((u,y)=>(y.revenue||0)-(u.revenue||0)):Be==="VALUATION"&&a.sort((u,y)=>(y.valuation||0)-(u.valuation||0)),Ue>=a.length&&(Ue=0);const s=a[Ue]||null;z?.current_tick;const r=s&&!!_o[s.id],c=s&&s.status==="PRIVATE"&&!r,p=s&&s.status==="STATE";let f="";a.length===0&&(f=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No corporations found.</div>`);for(let u=0;u<a.length;u++){const y=a[u],x=u===Ue,g=i[y.status]||i.PRIVATE,$=y.status==="PRIVATE"&&!_o[y.id];f+=`
        <div onclick="corpSelect(${u})" style="display:flex;align-items:center;padding:7px 16px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${x?t.accent:"transparent"};background:${x?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:42px;font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${y.abbr}</span>
            <div style="flex:1.3;">
                <div style="font-size:11px;font-weight:600;color:${t.text};line-height:1.2">${y.faction_name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${y._isSub?'<span style="color:#8a6aaa;">SUB</span> · ':""}${y.corp_subsector||y.corp_sector||"—"}</div>
            </div>
            <span style="width:62px"><span style="font-family:${e};font-size:8px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(y.nation||"—").toUpperCase().slice(0,6)}</span></span>
            <span style="width:56px;font-family:${e};font-size:9px;font-weight:700;color:${$?t.dim:t.muted};text-align:right">${$?"—":_(y.revenue)}</span>
            <span style="width:34px;font-family:${e};font-size:10px;font-weight:700;color:${y.reputation>=70?t.greenBright:y.reputation>=40?t.accent:t.yellow};text-align:right">${y.reputation}</span>
            <span style="width:56px;font-family:${e};font-size:9px;color:${$?t.dim:t.muted};text-align:right">${$?"—":_(y.valuation)}</span>
            <span style="width:48px;text-align:center"><span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${g.color};background:${g.bg};border:1px solid ${g.border}">${y.status}</span></span>
        </div>`}let l="";if(s){const u=i[s.status]||i.PRIVATE,y=[...s._isSub?[{label:"Parent",value:s._parentName||"—",color:"#8a6aaa"}]:[],{label:"Sector",value:s.corp_sector||"—",color:t.text},{label:"Subsector",value:s.corp_subsector||"—",color:t.accent},{label:"Reputation",value:s.reputation+"/100",color:s.reputation>=70?t.greenBright:s.reputation>=40?t.accent:t.yellow},{label:"Revenue",value:c?"UNDISCLOSED":_(s.revenue),color:c?t.dim:t.greenBright},{label:"Cash Reserves",value:c?"UNDISCLOSED":_(s.corp_cash_reserves||0),color:c?t.dim:t.text},{label:"Market Valuation",value:c?"UNDISCLOSED":_(s.valuation),color:c?t.dim:t.gold}];l=`
        <div style="padding:10px 16px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                <span style="font-family:${e};font-size:14px;font-weight:700;color:${t.gold}">${s.abbr}</span>
                <span style="font-size:14px;font-weight:700;color:${t.text}">${s.faction_name}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
                <span style="font-family:${e};font-size:8px;padding:2px 6px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(s.nation||"—").toUpperCase()}</span>
                <span style="font-family:${e};font-size:8px;font-weight:700;padding:2px 6px;color:${u.color};background:${u.bg};border:1px solid ${u.border}">${s.status}</span>
                ${s._isSub?`<span style="font-family:${e};font-size:8px;font-weight:700;padding:2px 6px;color:#8a6aaa;background:rgba(138,106,170,0.08);border:1px solid rgba(138,106,170,0.2)">SUBSIDIARY</span>`:""}
                ${s.isPlayer?`<span style="font-family:${e};font-size:8px;font-weight:700;padding:2px 6px;color:${t.blue};background:rgba(90,138,170,0.08);border:1px solid rgba(90,138,170,0.2)">PLAYER</span>`:`<span style="font-family:${e};font-size:8px;color:${t.dim}">NPC</span>`}
            </div>
        </div>
        ${y.map(x=>`<div style="display:flex;justify-content:space-between;padding:5px 16px;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:10px;color:${t.dim};text-transform:uppercase">${x.label}</span>
            <span style="font-family:${e};font-size:11px;font-weight:700;color:${x.value==="UNDISCLOSED"?t.dim:x.color};${x.value==="UNDISCLOSED"?"font-style:italic;":""}">${x.value}</span>
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
        </div>`}else l=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a corporation to view details.</div>`;const m=`
    <div style="padding:6px 16px;border-bottom:1px solid ${t.border};background:${t.card};display:flex;gap:12px;align-items:center;flex-shrink:0;">
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px;width:40px">NATION</span>
            <span onclick="corpFilterNation('ALL')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${xe==="ALL"?"#000":t.dim};background:${xe==="ALL"?t.accent:"transparent"};border:1px solid ${xe==="ALL"?t.accent:t.border}">ALL</span>
            ${n.map(u=>`<span onclick="corpFilterNation('${u}')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${xe===u?"#000":t.dim};background:${xe===u?t.accent:"transparent"};border:1px solid ${xe===u?t.accent:t.border}">${u}</span>`).join("")}
        </div>
        <div style="flex:1"></div>
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">SORT</span>
            ${["REPUTATION","REVENUE","VALUATION"].map(u=>`<span onclick="corpSort('${u}')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${Be===u?"#000":t.dim};background:${Be===u?t.accent:"transparent"};border:1px solid ${Be===u?t.accent:t.border}">${u}</span>`).join("")}
        </div>
    </div>`;o.innerHTML=`
    <div style="width:760px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Corporations</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${Rt.length} IN DATABASE</span>
        </div>
        ${m}
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
    </div>`}window.corpSelect=jr;window.corpInvestigate=Hr;window.corpFilterNation=Fr;window.corpSort=Ur;let he=null,ze={},Q=120,Te=15,$n={},pt=[];async function Gr(){if(!We)return;if(bt[We.id]){alert("You already have a bid on this contract. Retract it first if you want to re-bid.");return}he=We,$n={};try{const{data:t}=await v.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",d.id);for(const i of t||[])$n[lo(i.material_key)]=Number(i.quantity||0)}catch{}pt=[];try{const{data:t}=await v.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",he.id).in("status",["pending","won"]);pt=(t||[]).filter(i=>i.faction_id!==d?.id).map(i=>({name:i.factions?.faction_name||"Unknown",ticker:i.factions?.corp_ticker||"???",price:Number(i.bid_price||0),quality:Number(i.estimated_quality||0),status:i.status}))}catch{}ze={};const o=he.required_materials||{};for(const t of Object.keys(o))ze[t]="STD";const e=he.required_workforce||{};Q=Number(e.general||0)+Number(e.skilled||0)||120,Te=15,Vt(),qo()}function Vn(){document.getElementById("bid-assembly-overlay")?.remove(),he=null}function Vr(o,e){ze[o]=e,qo()}function Wr(o){Q=o,qo()}function Yr(o){Te=o,qo()}function qo(){if(document.getElementById("bid-assembly-overlay")?.remove(),!he)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=he,i=t.issuer_type==="GOVERNMENT",n=S?.name||d?.nation||"—",a=Number(t.budget_ceiling||0),s=Number(t.timeline_ticks||8),r=t.required_materials||{},c=Object.keys(r),p={LOW:.5,STD:1,HIGH:2},f={LOW:e.orange,STD:e.yellow,HIGH:e.greenBright},l={LOW:"Low",STD:"Standard",HIGH:"High"},m={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},u=$n||{};let y=0,x="";for(const D of c){const Y=Number(r[D]||0),Jn=ze[D]||"STD",Xn=m[D]||3e5,ma=p[Jn],ua=Math.round(Xn*ma),Zn=Y*ua;y+=Zn;const ya=D.replace(/_/g," ").replace(/\b\w/g,Re=>Re.toUpperCase()),ei=Number(u[D]||0),Do=Math.max(0,Y-ei),va=Do===0?e.greenBright:Do<Y?e.yellow:e.red,ga=Do===0?"✓ IN STOCK":`${ei}/${Y}`;x+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${e.text}">${ya}</span>
                <div style="font-family:${o};font-size:7px;color:${va};margin-top:1px">${ga}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${o};font-size:9px;color:${e.muted}">${Y.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(Re=>{const jo=Jn===Re,ti=f[Re],xa=_(Math.round(Xn*p[Re]));return`<span onclick="bidSetGrade('${D}','${Re}')" style="padding:2px 6px;font-family:${o};font-size:7px;font-weight:700;cursor:pointer;color:${jo?"#000":e.dim};background:${jo?ti:"transparent"};border:1px solid ${jo?ti:e.border}" title="${xa}/unit">${l[Re]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${o};font-size:10px;color:${e.text}">${_(Zn)}</span></div>
        </div>`}const g=t.required_workforce||{},$=Number(g.general||0)+Number(g.skilled||0)||100,h=Math.max(40,Math.round($*.5)),k=$*2,I=[h,Math.round($*.75),$,Math.round($*1.5),k],T=Math.max(0,Math.min(1,(Q-h)/(k-h||1))),w=s,C=Math.round(4.5-T*8),L=Math.max(Math.round(w*.6),w+C),E=C>0?`+${C}mo`:C<0?`${C}mo`:"On schedule",R=C>0?e.red:C<0?e.greenBright:e.yellow,M=15200,O=Q*M*L,F=a,X=[{name:"Municipal Zoning Approval",cost:18e4,ticks:2,required:!0},{name:"Structural Engineering Cert.",cost:24e4,ticks:3,required:!0},{name:"Environmental Impact Assessment",cost:34e4,ticks:8,required:F>2e7},{name:"Seismic Resilience Compliance",cost:21e4,ticks:4,required:F>5e7},{name:"Heritage Conservation Review",cost:16e4,ticks:6,required:!1},{name:"Fire Safety Certification",cost:12e4,ticks:2,required:F>1e7}].filter(D=>D.required),N=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),P=X.filter(D=>!N.has(D.name)).reduce((D,Y)=>D+Y.cost,0),U=4e5,W=y+O+P+U,se=Math.round(W*(Te/100)),ge=W+se,H=ge>a,Bo=se,Me=H?0:Math.max(0,Math.min(100,Math.round(100-ge/a*100+30))),Kn=Me>70?e.greenBright:Me>40?e.yellow:Me>0?e.orange:e.red,pa=H?"OVER CEILING":Me>70?"STRONG":Me>40?"COMPETITIVE":Me>20?"WEAK":"UNLIKELY",Po=Object.values(ze),Ae=Po.length>0?Math.round(Po.reduce((D,Y)=>D+(Y==="HIGH"?85:Y==="STD"?65:45),0)/Po.length):50,Xt=Ae>=75?e.greenBright:Ae>=55?e.yellow:e.orange,fa=Ae>=75?"STRONG":Ae>=55?"PROMISING":"UNCERTAIN",ot=document.createElement("div");ot.id="bid-assembly-overlay",ot.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",ot.addEventListener("click",D=>{D.target===ot&&Vn()}),ot.innerHTML=`
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
                <span style="font-family:${o};font-size:9px;color:${e.muted}">Ceiling: <span style="color:${e.text};font-weight:700">${_(a)}</span></span>
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
                ${x}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${o};font-size:9px;color:${e.muted}">MATERIALS TOTAL</span>
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(y)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Labor</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim};width:60px">WORKERS</span>
                        <div style="display:flex;gap:3px;">
                            ${I.map(D=>`<span onclick="bidSetWorkers(${D})" style="padding:2px 8px;font-family:${o};font-size:8px;font-weight:700;cursor:pointer;color:${Q===D?"#000":e.dim};background:${Q===D?e.accent:"transparent"};border:1px solid ${Q===D?e.accent:e.border}">${D}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">${Q} × $${M.toLocaleString()}/tick × ${L} ticks</span>
                        <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(O)}</span>
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
                        <span style="font-family:${o};font-size:10px;font-weight:700;color:${R}">${L}mo <span style="font-size:8px;opacity:0.7">(${E})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${X.map(D=>{const Y=N.has(D.name);return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
                        <div style="flex:1;display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${o};font-size:8px;font-weight:700;color:${Y?e.greenBright:e.orange}">${Y?"✓":"○"}</span>
                            <span style="font-size:10px;color:${Y?e.muted:e.text}">${D.name}</span>
                        </div>
                        ${Y?`<span style="font-family:${o};font-size:8px;color:${e.greenBright}">HELD</span>`:`<div style="text-align:right">
                                <span style="font-family:${o};font-size:9px;color:${e.redDim}">${_(D.cost)}</span>
                                <span style="font-family:${o};font-size:7px;color:${e.dim};margin-left:4px">${D.ticks}t</span>
                            </div>`}
                    </div>`}).join("")}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${o};font-size:9px;color:${e.muted}">PERMIT COSTS</span>
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(P)}</span>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${o};font-size:9px;color:${e.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(U)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v:y},{l:"Labor",v:O},{l:"Permits",v:P},{l:"Overhead",v:U}].map(D=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-size:10px;color:${e.muted}">${D.l}</span>
                    <span style="font-family:${o};font-size:10px;color:${e.redDim}">${_(D.v)}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:rgba(204,85,85,0.03);">
                    <span style="font-family:${o};font-size:10px;font-weight:700;color:${e.text}">TOTAL EST. COST</span>
                    <span style="font-family:${o};font-size:13px;font-weight:700;color:${e.red}">${_(W)}</span>
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
                    <div style="font-family:${o};font-size:22px;font-weight:700;color:${H?e.red:e.gold}">${_(ge)}</div>
                    ${H?`<div style="font-family:${o};font-size:8px;font-weight:700;color:${e.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${_(a)})</div>`:""}
                </div>

                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">PROJECTED PROFIT</span>
                        <span style="font-family:${o};font-size:14px;font-weight:700;color:${Bo>0?e.greenBright:e.dim}">+${_(Bo)}</span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Bid Assessment</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">COMPETITIVENESS</span>
                        <span style="font-family:${o};font-size:11px;font-weight:700;color:${Kn}">${pa}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${Me}%;height:100%;background:${Kn}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${o};font-size:11px;font-weight:700;color:${Xt}">${Ae}</span>
                            <span style="font-family:${o};font-size:8px;color:${e.dim}">/100</span>
                            <span style="font-family:${o};font-size:8px;font-weight:700;color:${Xt}">${fa}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${Ae}%;height:100%;background:${Xt}"></div></div>
                    <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="font-family:${o};font-size:8px;color:${e.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${pt.length===0?`<div style="font-family:${o};font-size:8px;color:${e.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${pt.map(D=>`<span style="padding:2px 6px;font-family:${o};font-size:7px;color:${e.muted};background:${e.card};border:1px solid ${e.border};">${D.name} <span style="color:${e.dim}">Q:${D.quality}</span></span>`).join("")}
                        </div>
                        <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:3px">${pt.length} competing bid${pt.length!==1?"s":""}. Bid prices are sealed until resolution.</div>`}
                    <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:3px">Higher reputation bidders may win at higher prices.</div>
                </div>
                <div style="flex:1"></div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">YOUR BID</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${H?e.red:e.gold}">${_(ge)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">EST. PROFIT</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${e.greenBright}">+${_(Bo)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${Xt}">${Ae}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${o};font-size:10px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="${H?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${o};font-size:10px;font-weight:700;letter-spacing:1px;color:${H?e.dim:"#000"};background:${H?e.border:e.gold};cursor:${H?"not-allowed":"pointer"};opacity:${H?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(ot)}let on=!1;async function Qr(){if(on||!he)return;const o=he,e=o.required_materials||{},t=Object.keys(e),i=Number(o.budget_ceiling||0),n=Number(o.timeline_ticks||8),a={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},s={LOW:.5,STD:1,HIGH:2};let r=0;for(const M of t){const O=Number(e[M]||0),F=ze[M]||"STD",j=a[M]||3e5;r+=O*Math.round(j*s[F])}const c=15200,p=o.required_workforce||{},f=Number(p.general||0)+Number(p.skilled||0)||100,l=Math.max(40,Math.round(f*.5)),m=f*2,u=Math.max(0,Math.min(1,(Q-l)/(m-l||1))),y=Math.round(4.5-u*8),x=Math.max(Math.round(n*.6),n+y),g=Q*c*x,$=i,h=[{name:"Municipal Zoning Approval",cost:18e4,required:!0},{name:"Structural Engineering Cert.",cost:24e4,required:!0},{name:"Environmental Impact Assessment",cost:34e4,required:$>2e7},{name:"Seismic Resilience Compliance",cost:21e4,required:$>5e7},{name:"Fire Safety Certification",cost:12e4,required:$>1e7}],k=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),I=h.filter(M=>M.required&&!k.has(M.name)).reduce((M,O)=>M+O.cost,0),w=r+g+I+4e5,C=Math.round(w*(Te/100)),L=w+C;if(L>i){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const E=Object.values(ze),R=E.length>0?Math.round(E.reduce((M,O)=>M+(O==="HIGH"?85:O==="STD"?65:45),0)/E.length):50;if(confirm('Submit bid for "'+o.name+`"?

Bid Price: `+_(L)+`
Est. Cost: `+_(w)+`
Markup: `+Te+"% ("+_(C)+`)
Quality: `+R+`/100
Workers: `+Q+`

Once submitted, your bid cannot be changed.`)){on=!0;try{const{data:M}=await v.from("shard").select("current_tick").eq("name","Alpha Shard").single(),O=M?.current_tick||0,F={};for(const X of t)F[X]=ze[X]||"STD";const{error:j}=await v.from("contract_bids").insert({contract_id:o.id,faction_id:d.id,bid_price:L,material_grades:F,labor_count:Q,markup_pct:Te,estimated_cost:w,estimated_quality:R,status:"pending",submitted_at_tick:O});if(j)throw j;o.status==="open"&&await v.from("construction_contracts").update({status:"bidding"}).eq("id",o.id).eq("status","open"),Vn(),alert(`Bid submitted successfully!

Contract: `+o.name+`
Your Bid: `+_(L)+`
Quality: `+R+`/100

Bids will be resolved when the bidding window closes (`+(o.bidding_ends_tick?"tick "+o.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof Je=="function"&&await Je()}catch(M){alert("Bid submission failed: "+M.message)}finally{on=!1}}}window.openBidAssembly=Gr;window.closeBidAssembly=Vn;window.bidSetGrade=Vr;window.bidSetWorkers=Wr;window.bidSetMarkup=Yr;window.submitBidAssembly=Qr;let nn=!1;async function Kr(o){if(nn)return;const e=1e6,t=Number(d?.corp_cash_reserves??0);if(t<e){alert("Cannot retract — you need at least $1M in cash reserves to cover the retraction penalty.");return}if(confirm(`Retract your bid?

This will cost $1M as a retraction penalty.
This action cannot be undone.`)){nn=!0;try{const i=t-e,{error:n}=await v.from("factions").update({corp_cash_reserves:i}).eq("id",d.id);if(n)throw n;const{error:a}=await v.from("contract_bids").delete().eq("contract_id",o).eq("faction_id",d.id);if(a)throw a;d.corp_cash_reserves=i,typeof Xe=="function"&&Xe(i),alert("Bid retracted. $1M penalty applied."),Vt(),await Je()}catch(i){alert("Failed to retract bid: "+(i.message||"Unknown error"))}finally{nn=!1}}}window.retractBid=Kr;let Ut=[],He=0,ye=null,an=!1,sn=!1,rn=!1;async function Jr(){if(!We||sn)return;sn=!0,ye=We,He=0;const{data:o,error:e}=await v.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",ye.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(sn=!1,e){alert("Failed to load bids: "+e.message);return}Ut=(o||[]).map(t=>({...t,corp:t.factions?.faction_name||"Unknown",abbr:t.factions?.corp_ticker||"???",subsector:t.factions?.corp_subsector||"—"})),Vt(),aa()}function Oo(){document.getElementById("bid-review-overlay")?.remove(),ye=null}function Xr(o){He=o,aa()}async function Zr(){if(an||Ut.length===0)return;const o=Ut[He];if(!(!o?.id||!o.faction_id)&&confirm("Accept bid from "+o.corp+`?

Bid Price: `+_(o.bid_price)+`
Quality: `+o.estimated_quality+`/100
Workers: `+o.labor_count+`

This will award the contract. The project begins immediately.`)){an=!0;try{const{data:e}=await v.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{error:i}=await v.from("contract_bids").update({status:"won"}).eq("id",o.id);if(i)throw i;const{error:n}=await v.from("contract_bids").update({status:"lost"}).eq("contract_id",ye.id).neq("id",o.id);if(n)throw n;const{error:a}=await v.from("construction_contracts").update({status:"awarded",awarded_to_faction:o.faction_id,awarded_at_tick:t}).eq("id",ye.id);if(a)throw a;Oo(),alert("Contract awarded to "+o.corp+`!

Bid: `+_(o.bid_price)+`
Project begins immediately.`),typeof Je=="function"&&await Je()}catch(e){alert("Failed to accept bid: "+(e.message||e))}finally{an=!1}}}async function el(){if(!(!ye||rn)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){rn=!0;try{const{error:o}=await v.from("contract_bids").update({status:"lost"}).eq("contract_id",ye.id);if(o)throw o;const{error:e}=await v.from("construction_contracts").update({status:"expired"}).eq("id",ye.id);if(e)throw e;Oo(),alert("All bids declined. Contract cancelled."),typeof Je=="function"&&await Je()}catch(o){alert("Failed: "+(o.message||o))}finally{rn=!1}}}function aa(){if(document.getElementById("bid-review-overlay")?.remove(),!ye||Ut.length===0)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=ye,i=Ut;He>=i.length&&(He=0);const n=i[He],a=Number(t.budget_ceiling||0),s=Number(t.timeline_ticks||36),r=Math.min(...i.map(u=>u.bid_price)),c=Math.max(...i.map(u=>u.estimated_quality||0));let p="";for(let u=0;u<i.length;u++){const y=i[u],x=u===He,g=y.bid_price===r,$=(y.estimated_quality||0)===c,h=y.bid_price>a;p+=`
        <div onclick="reviewSelectBid(${u})" style="padding:10px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${x?e.accent:"transparent"};background:${x?"rgba(139,154,107,0.03)":"transparent"};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-family:${o};font-size:10px;font-weight:700;color:${e.gold}">${y.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${e.text}">${y.corp}</span>
                ${g?`<span style="font-family:${o};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.greenBright};background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2)">CHEAPEST</span>`:""}
                ${$?`<span style="font-family:${o};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.2)">BEST QUALITY</span>`:""}
            </div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};">
                <div style="flex:1.2;padding:5px 10px;border-right:1px solid ${e.border}">
                    <div style="font-family:${o};font-size:7px;color:${e.dim}">BID PRICE</div>
                    <div style="font-family:${o};font-size:14px;font-weight:700;color:${h?e.red:e.text}">${_(y.bid_price)}</div>
                    ${h?`<div style="font-family:${o};font-size:7px;color:${e.red}">OVER BUDGET</div>`:""}
                </div>
                <div style="flex:0.8;padding:5px 10px;border-right:1px solid ${e.border};text-align:center">
                    <div style="font-family:${o};font-size:7px;color:${e.dim}">QUALITY</div>
                    <div style="font-family:${o};font-size:14px;font-weight:700;color:${(y.estimated_quality||0)>=75?e.greenBright:(y.estimated_quality||0)>=55?e.yellow:e.orange}">${y.estimated_quality||0}</div>
                </div>
                <div style="flex:0.8;padding:5px 10px;text-align:center">
                    <div style="font-family:${o};font-size:7px;color:${e.dim}">WORKERS</div>
                    <div style="font-family:${o};font-size:14px;font-weight:700;color:${e.text}">${y.labor_count||0}</div>
                </div>
            </div>
        </div>`}const f=n.bid_price>a,l=a>0?Math.round(n.bid_price/a*100):0,m=document.createElement("div");m.id="bid-review-overlay",m.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",m.addEventListener("click",u=>{u.target===m&&Oo()}),m.innerHTML=`
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
                <span>Timeline: <span style="color:${e.text};font-weight:700">${s}mo</span></span>
            </div>
        </div>
        <div style="padding:6px 16px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.gold}">${i.length} BID${i.length!==1?"S":""} RECEIVED</span>
            <div style="display:flex;gap:8px;font-family:${o};font-size:8px;color:${e.dim};">
                <span>Cheapest: <span style="color:${e.greenBright}">${_(r)}</span></span>
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
                ${[{l:"Materials",v:Number(n.estimated_cost||0)*.45},{l:"Labor",v:Number(n.estimated_cost||0)*.45},{l:"Overhead",v:Number(n.estimated_cost||0)*.1}].map(u=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${o};font-size:9px;color:${e.dim};text-transform:uppercase">${u.l}</span>
                    <span style="font-family:${o};font-size:10px;color:${e.muted}">${_(Math.round(u.v))}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:${f?"rgba(204,85,85,0.03)":"rgba(200,168,50,0.03)"};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;color:${e.text}">TOTAL BID</span>
                    <span style="font-family:${o};font-size:14px;font-weight:700;color:${f?e.red:e.gold}">${_(n.bid_price)}</span>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">vs. YOUR BUDGET</span>
                        <span style="font-family:${o};font-size:9px;font-weight:700;color:${f?e.red:e.greenBright}">${f?"OVER":"WITHIN"} — ${l}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${e.border}"><div style="width:${Math.min(100,l)}%;height:100%;background:${f?e.red:e.accent}"></div></div>
                </div>
                ${[{l:"Quality",v:n.estimated_quality+"/100",c:(n.estimated_quality||0)>=75?e.greenBright:(n.estimated_quality||0)>=55?e.yellow:e.orange},{l:"Markup",v:n.markup_pct+"%",c:e.muted},{l:"Workers",v:n.labor_count+" workers",c:e.text}].map(u=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${o};font-size:9px;color:${e.dim};text-transform:uppercase">${u.l}</span>
                    <span style="font-family:${o};font-size:10px;font-weight:700;color:${u.c}">${u.v}</span>
                </div>`).join("")}
                <div style="flex:1"></div>
            </div>
        </div>
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">SELECTED BID</div><div style="font-family:${o};font-size:12px;font-weight:700;color:${e.gold}">${_(n.bid_price)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">CORPORATION</div><div style="font-family:${o};font-size:12px;font-weight:700;color:${e.text}">${n.corp}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${o};font-size:12px;font-weight:700;color:${(n.estimated_quality||0)>=75?e.greenBright:e.yellow}">${n.estimated_quality}</div></div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="declineAllBids()" style="padding:6px 16px;font-family:${o};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">DECLINE ALL</div>
                <div onclick="acceptBid()" style="padding:6px 20px;font-family:${o};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${e.accent};cursor:pointer">ACCEPT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(m)}const $t={Coastal:{color:"#8b9a6b",label:"COASTAL"},Container:{color:"#5a7aaa",label:"CONTAINER"},Bulk:{color:"#c8a832",label:"BULK"},Tanker:{color:"#c86a4a",label:"TANKER"},Reefer:{color:"#6a9a5a",label:"REEFER"},LNG:{color:"#c55",label:"LNG"}},tl={in_port:{color:"#8b9a6b",label:"IN PORT"},in_transit:{color:"#5a8aaa",label:"IN TRANSIT"},dry_dock:{color:"#c84",label:"DRY DOCK"},anchored:{color:"#ca5",label:"ANCHORED"},for_sale:{color:"#9e9a92",label:"FOR SALE"}};function sa(o){return o>=75?"#5c5":o>=50?"#ca5":o>=25?"#c84":"#c55"}function ol(o){return o>=60?"#5c5":o>=30?"#ca5":o>=15?"#c84":"#c55"}async function ve(){if(!d)return;const{data:o,error:e}=await v.from("corp_vessels").select("*").eq("faction_id",d.id).order("vessel_class");e&&console.warn("Failed to load fleet:",e.message),ce=o||[],Dt=null,Tt={},co={};try{const t=ce.map(i=>i.id);if(t.length>0){const{data:i}=await v.from("finance_active_loans").select("insured_vessel_id").in("insured_vessel_id",t).in("status",["current"]);for(const a of i||[])a.insured_vessel_id&&(Tt[a.insured_vessel_id]=!0);const{data:n}=await v.from("finance_loan_requests").select("insured_vessel_id").eq("requesting_faction_id",d.id).eq("request_type","insurance").eq("status","open").not("insured_vessel_id","is",null);for(const a of n||[])a.insured_vessel_id&&!Tt[a.insured_vessel_id]&&(co[a.insured_vessel_id]=!0)}}catch(t){console.warn("Failed to load vessel insurance status:",t.message)}ra()}function nl(o){Dt=Dt===o?null:o,ra()}function ra(){const o=document.getElementById("fl-count"),e=document.getElementById("fl-summary"),t=document.getElementById("fl-list"),i=document.getElementById("fl-footer");if(!o||!t)return;const n=ce;o.textContent=n.length+" VESSEL"+(n.length!==1?"S":"");const a=n.filter(l=>l.status==="in_transit").length,s=n.filter(l=>l.status==="in_port"||l.status==="anchored").length,r=n.filter(l=>l.status==="dry_dock").length,c=n.reduce((l,m)=>l+(m.base_maintenance||0),0);e.innerHTML=[{label:"TRANSIT",value:a,color:"#5a8aaa"},{label:"IN PORT",value:s,color:"#8b9a6b"},{label:"DRY DOCK",value:r,color:"#c84"},{label:"MAINT/TICK",value:_(c),color:"#a44"}].map((l,m)=>`<div style="flex:1;padding:5px 8px;text-align:center;${m<3?"border-right:1px solid var(--border-0);":""}">
        <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">${l.label}</div>
        <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${l.color};margin-top:1px;">${l.value}</div>
    </div>`).join(""),n.length===0?t.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels in fleet.<br>Purchase ships to begin operations.</div>':t.innerHTML=n.map((l,m)=>{const u=Dt===m,y=$t[l.vessel_class]||{color:"#666",label:"?"},x=tl[l.status]||{color:"#666",label:"?"},g=sa(l.condition),$=ol(l.fuel),h=l.condition<50||l.fuel<20,k=l.status==="in_transit",I=l.status==="dry_dock",T=z?.current_tick||0,w=Math.max(0,Math.floor((T-(l.built_at_tick||0))/12));let C=`<div onclick="flSelectVessel(${m})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${h?l.condition<50?g:$:"transparent"};background:${u?y.color+"06":"transparent"};">
                <div style="padding:7px 14px;">`;C+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(l.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${y.color};background:${y.color}12;border:1px solid ${y.color}25;">${y.label}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${x.color};background:${x.color}12;border:1px solid ${x.color}25;">${x.label}</span>
            </div>`;const L=l.current_port_nation_id?"In port":k?"At sea":"—";if(C+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:5px;">${b(L)}</div>`,C+=`<div style="display:flex;gap:8px;margin-bottom:4px;">
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${g};">${l.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${l.condition}%;height:100%;background:${g};"></div></div>
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
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#a44;margin-top:1px;">${_(l.base_maintenance)}</div>
                </div>
            </div>`,I&&l.drydock_until_tick){const E=Math.max(0,l.drydock_until_tick-T);C+=`<div style="margin-top:4px;padding:3px 8px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">DRY DOCK REPAIRS</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c84;">${E} tick${E!==1?"s":""} remaining</span>
                </div>`}if(u){C+=`<div style="margin-top:6px;">
                    <div style="padding:5px 8px;background:var(--bg-0);border:1px solid var(--border-0);margin-bottom:6px;">`;const E=[{label:"VESSEL CLASS",value:l.vessel_class},{label:"BUILT",value:"Tick "+(l.built_at_tick||0)},{label:"FUEL CAPACITY",value:(l.fuel_capacity||0).toLocaleString()+" tons"},{label:"LAST REFURBISH",value:l.last_refurbish_tick?"Tick "+l.last_refurbish_tick:"N/A"}];for(let j=0;j<E.length;j++)C+=`<div style="display:flex;justify-content:space-between;padding:2px 0;${j<3?"border-bottom:1px solid var(--border-0);":""}">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${E[j].label}</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);">${E[j].value}</span>
                    </div>`;C+="</div>";const R=k||I,M=Math.round((l.purchase_price||3e6)*.08*(1+(100-l.condition)/100)),O=Math.round((l.fuel_capacity||1e3)*50*(1-l.fuel/100)),F=Math.round((l.purchase_price||3e6)*(l.condition/100)*.6);if(C+=`<div style="display:flex;gap:4px;">
                    <div onclick="${R?"":"flRefurbish('"+l.id+"',"+M+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${R?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${R?"var(--text-dim)":"#5c5"};border:1px solid ${R?"var(--border-0)":"#2a5a3a"};background:${R?"transparent":"rgba(74,170,136,0.06)"};opacity:${R?.35:1};">REFURBISH<br><span style="font-weight:400;font-size:6px;">${_(M)}</span></div>
                    <div onclick="${k?"":"flRefuel('"+l.id+"',"+O+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${k?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${k?"var(--text-dim)":"#c86a4a"};border:1px solid ${k?"var(--border-0)":"rgba(200,106,74,0.3)"};opacity:${k?.35:1};">REFUEL<br><span style="font-weight:400;font-size:6px;">from ${_(O)}</span></div>
                    <div onclick="${R?"":"flSell('"+l.id+"','"+b(l.vessel_name).replace(/'/g,"")+"',"+F+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${R?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${R?"var(--text-dim)":"#c84"};border:1px solid ${R?"var(--border-0)":"rgba(204,136,68,0.3)"};opacity:${R?.35:1};">LIST<br><span style="font-weight:400;font-size:6px;">${_(F)}</span></div>
                </div>`,!k){const j=Tt&&Tt[l.id],X=co&&co[l.id];C+='<div style="display:flex;gap:4px;margin-top:4px;">',j?C+=`<div style="flex:1;display:flex;gap:2px;">
                            <div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#5c5;border:1px solid rgba(92,204,92,0.2);background:rgba(92,204,92,0.04);">INSURED ✓</div>
                            <div onclick="event.stopPropagation();flFileClaim('${l.id}','${b(l.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#c55;border:1px solid rgba(204,85,85,0.2);background:rgba(204,85,85,0.04);">FILE CLAIM</div>
                        </div>`:X?C+='<div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#ca5;border:1px solid rgba(202,165,50,0.2);background:rgba(202,165,50,0.04);">PENDING ⏳</div>':C+=`<div onclick="event.stopPropagation();flRequestInsurance('${l.id}','${b(l.vessel_name).replace(/'/g,"")}',${l.purchase_price||0})" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#aa7a5a;border:1px solid rgba(170,122,90,0.3);background:rgba(170,122,90,0.04);">INSURE</div>`,C+=`<div onclick="flRename('${l.id}','${b(l.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:var(--text-muted);border:1px solid var(--border-0);">RENAME</div>`,C+="</div>"}k&&(C+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel at sea — actions available on arrival</div>'),I&&(C+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel in dry dock — repairs in progress</div>'),C+="</div>"}return C+="</div></div>",C}).join("");const p={};for(const l of n)p[l.vessel_class]=(p[l.vessel_class]||0)+1;let f='<div style="display:flex;gap:6px;">';for(const[l,m]of Object.entries($t))p[l]&&(f+=`<div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:${m.color};border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">${m.label}</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${p[l]}</span>
        </div>`);f+="</div>",f+=`<span style="font-family:var(--font-mono);font-size:8px;color:#a44;">${_(c)}/tick</span>`,i.innerHTML=f}let oe=!1;async function il(o,e){if(oe||!d)return;const t=(ce||[]).find(u=>u.id===o);if(!t)return;const i=t.current_port_nation_id||null;let n="state",a=3,s=3,r=null,c="State Dry Dock (3x cost, 3 ticks)";if(i){const{data:u}=await v.from("corp_properties").select("id").eq("faction_id",d.id).eq("nation_id",i).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();if(u)n="own",a=1,s=2,c="Your Dry Dock (base cost, 2 ticks)";else{const{data:y}=await v.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",d.id).eq("nation_id",i).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();y&&(n="other",a=1.2,s=2,r=y.faction_id,c=(y.factions?.faction_name||"Another corp")+"'s Dry Dock (+20%, 2 ticks)")}}else c="State Dry Dock (3x cost, 3 ticks) — no private dock in port";const p=Math.round(e*a),{data:f}=await v.from("factions").select("corp_cash_reserves").eq("id",d.id).single(),l=Number(f?.corp_cash_reserves??0);if(l<p){alert("Insufficient cash. Need "+_(p)+", have "+_(l)+".");return}if(!confirm("Send "+(t.vessel_name||"vessel")+` to dry dock?

Dock: `+c+`
Cost: `+_(p)+`
Duration: `+s+` ticks
Condition restored to 85-100%.`))return;oe=!0;const m=z?.current_tick||0;try{const{error:u}=await v.from("factions").update({corp_cash_reserves:l-p}).eq("id",d.id);if(u){alert("Failed: "+u.message);return}if(n==="other"&&r){const x=p-e,{data:g}=await v.from("factions").select("corp_cash_reserves").eq("id",r).single();g&&await v.from("factions").update({corp_cash_reserves:Number(g.corp_cash_reserves||0)+x}).eq("id",r)}const{error:y}=await v.from("corp_vessels").update({status:"dry_dock",drydock_until_tick:m+s,active_claim_id:null}).eq("id",o);if(y){await v.from("factions").update({corp_cash_reserves:l}).eq("id",d.id),alert("Failed: "+y.message);return}d.corp_cash_reserves=l-p,await ve()}catch(u){alert("Dry dock failed: "+(u.message||"Error"))}finally{oe=!1}}async function al(o,e){if(oe||!d)return;if(e<=0){alert("Fuel tanks are already full.");return}const t=(ce||[]).find(l=>l.id===o);if(!t)return;const i=t.current_port_nation_id||d.nation_id;let n="state",a=3,s=null,r="State Fuel (3x cost) — no private depot in port";if(i){const{data:l}=await v.from("corp_properties").select("id").eq("faction_id",d.id).eq("nation_id",i).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(l)n="own",a=1,r="Your Fuel Depot (base cost)";else{const{data:m}=await v.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",d.id).eq("nation_id",i).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();m&&(n="other",a=1.15,s=m.faction_id,r=(m.factions?.faction_name||"Another corp")+"'s Fuel Depot (+15%)")}}const c=Math.round(e*a),{data:p}=await v.from("factions").select("corp_cash_reserves").eq("id",d.id).single(),f=Number(p?.corp_cash_reserves??0);if(f<c){alert("Insufficient cash. Need "+_(c)+", have "+_(f)+".");return}if(confirm("Refuel "+(t.vessel_name||"vessel")+`?

Source: `+r+`
Cost: `+_(c)+`
Fuel restored to 100%.`)){oe=!0;try{const{error:l}=await v.from("factions").update({corp_cash_reserves:f-c}).eq("id",d.id);if(l){alert("Failed: "+l.message);return}if(n==="other"&&s){const u=c-e,{data:y}=await v.from("factions").select("corp_cash_reserves").eq("id",s).single();y&&await v.from("factions").update({corp_cash_reserves:Number(y.corp_cash_reserves||0)+u}).eq("id",s)}const{error:m}=await v.from("corp_vessels").update({fuel:100}).eq("id",o);if(m){await v.from("factions").update({corp_cash_reserves:f}).eq("id",d.id),alert("Failed: "+m.message);return}d.corp_cash_reserves=f-c,await ve()}catch(l){alert("Refuel failed: "+(l.message||"Error"))}finally{oe=!1}}}async function sl(o,e,t){if(oe||!d||!z||!confirm("List "+e+" on the Ship Market for "+_(t)+`?

The vessel will be removed from your fleet and listed for sale. You will receive payment when another corporation purchases it.`))return;oe=!0;const i=z.current_tick||0,n=ce.find(c=>c.id===o);if(!n){oe=!1;return}const a=Math.max(0,i-(n.built_at_tick||0)),{error:s}=await v.from("ship_market_listings").insert({nation_id:d.nation_id,vessel_name:n.vessel_name,vessel_class:n.vessel_class,capacity_dwt:n.capacity_dwt,capacity_unit:n.capacity_unit,condition:n.condition,fuel:n.fuel,age_ticks:a,fuel_capacity:n.fuel_capacity,base_maintenance:n.base_maintenance,asking_price:t,purchase_price_new:n.purchase_price||t,seller_type:"CORP",seller_name:d.faction_name,seller_faction_id:d.id,sale_reason:"Listed for sale by "+(d.faction_name||"corporation"),status:"available",listed_at_tick:i});if(s){alert("Failed to create listing: "+s.message),oe=!1;return}const{error:r}=await v.from("corp_vessels").delete().eq("id",o);if(r){await v.from("ship_market_listings").delete().eq("seller_faction_id",d.id).eq("vessel_name",n.vessel_name).eq("listed_at_tick",i),alert("Failed to remove vessel: "+r.message),oe=!1;return}oe=!1,Dt=null,await Promise.all([ve(),Yn()])}async function rl(o,e){const t=prompt("Rename vessel:",e);if(!t||t.trim()===e||t.trim().length<2)return;const{error:i}=await v.from("corp_vessels").update({vessel_name:t.trim().slice(0,40)}).eq("id",o);if(i){alert("Failed: "+i.message);return}await ve()}async function ll(o,e,t){if(!d||!z||!confirm("Request insurance for "+e+`?

Insurance corporations will see this in their Deal Flow and can offer coverage terms.

Vessel value: `+_(t)))return;const i=z.current_tick||0,{error:n}=await v.from("finance_loan_requests").insert({requesting_faction_id:d.id,nation_id:d.nation_id,request_type:"insurance",insured_vessel_id:o,amount:t,term_months:0,purpose:"Vessel Insurance — "+e,status:"open",created_tick:i,expires_tick:i+12});if(n){n.message.includes("duplicate")||n.message.includes("unique")?alert("Insurance already requested for this vessel."):alert("Failed to request insurance: "+n.message);return}alert(`Insurance request posted to Deal Flow.

Insurance corporations can now offer coverage for `+e+"."),await ve()}let ln=!1;async function dl(o,e){if(ln||!d||!z)return;const t=prompt(`Describe the claim reason:

e.g., "Storm damage during transit — hull breach repaired at sea" or "Engine failure requiring emergency dry dock"`);if(!t||t.trim().length<5)return;const i=z.current_tick||0,{data:n}=await v.from("finance_active_loans").select("id, lender_faction_id, principal, deductible_pct").eq("insured_vessel_id",o).eq("status","current").limit(1).maybeSingle();if(!n){alert("No active insurance policy found for this vessel.");return}const a=Number(n.principal||0),s=Number(n.deductible_pct||10),r=Math.round(a*s/100);if(!confirm("File insurance claim for "+e+`?

Coverage: `+_(a)+`
Deductible: `+s+"% ("+_(r)+`)

Reason: `+t.trim()+`

The insurer will review this claim and determine the payout.`))return;ln=!0;const{error:c}=await v.from("event_log").insert({nation_id:d.nation_id,faction_id:d.id,event_name:(d.faction_name||"Corporation")+" — Insurance Claim Filed",description_used:(d.faction_name||"A shipping corporation")+" has filed an insurance claim for vessel "+e+". Reason: "+t.trim().replace(/[<>"]/g,""),category:"business",trigger_key:"vessel_insurance_claim",effects_applied:{vessel_id:o,vessel_name:e,policy_id:n.id,insurer_faction_id:n.lender_faction_id,coverage:a,deductible_pct:s,claim_reason:t.trim()},fired_at_tick:i});c&&console.warn("Failed to log insurance claim event:",c.message);const{error:p}=await v.from("finance_active_loans").update({claims_paid:(n.claims_paid||0)+1}).eq("id",n.id);p&&console.warn("Failed to update claims_paid:",p.message),ln=!1,alert("Insurance claim filed for "+e+`.

The insurer (`+_(a)+" coverage) has been notified. Claim details are visible in the events feed.")}window.flRequestInsurance=ll;window.flFileClaim=dl;const wn={fuel_depot:{label:"FUEL DEPOT",color:"#c86a4a",icon:"⛽",desc:"Bunkering facility — refuel at base cost, earn revenue from visiting fleets."},dry_dock:{label:"DRY DOCK",color:"#c84",icon:"🔧",desc:"Repair & maintenance dock — dock at base cost, earn revenue from visiting fleets."}},cl=[{type:"fuel_depot",name:"Fuel Depot — Standard",cost:105e6,maint:85e3,style:"Basic",desc:"Bulk fuel storage and bunkering facility."},{type:"fuel_depot",name:"Fuel Depot — Advanced",cost:14e7,maint:11e4,style:"Modern",desc:"High-capacity fuel terminal with pipeline infrastructure."},{type:"dry_dock",name:"Dry Dock — Standard",cost:85e6,maint:15e4,style:"Basic",desc:"Ship repair and maintenance facility."},{type:"dry_dock",name:"Dry Dock — Advanced",cost:115e6,maint:2e5,style:"Modern",desc:"Full-service shipyard with drydock and crane facilities."}];let ho=[];async function la(){if(!d)return;const{data:o}=await v.from("corp_properties").select("*").eq("faction_id",d.id).in("type",["fuel_depot","dry_dock"]).eq("is_active",!0).order("created_at",{ascending:!1});ho=o||[],pl()}function pl(){const o=document.getElementById("pf-count"),e=document.getElementById("pf-list"),t=document.getElementById("pf-footer");if(!o||!e||!t)return;const i=ho;if(o.textContent=i.length+" FACILIT"+(i.length===1?"Y":"IES"),i.length===0)e.innerHTML=`<div style="padding:20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-bottom:6px;">No port facilities built.</div>
            <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Build a <span style="color:#c86a4a;font-weight:700;">Fuel Depot</span> to refuel your fleet at base cost<br>and earn revenue from other corps refueling here.<br>Build a <span style="color:#c84;font-weight:700;">Dry Dock</span> to repair vessels at base cost.</div>
        </div>`;else{let s=0;e.innerHTML=i.map(r=>{const c=wn[r.type]||wn.fuel_depot,p=r.condition>=75?"#5c5":r.condition>=50?"#ca5":"#c84";return s+=Number(r.monthly_maintenance||0),`<div style="padding:8px 12px;border-bottom:1px solid var(--border-0);">
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
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#a44;">${_(r.monthly_maintenance||0)}</span>
                        </div>
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">VALUE: ${_(r.purchase_price||0)}</div>
                    </div>
                </div>
            </div>`}).join("")}Number(d?.corp_cash_reserves??0);const n=i.some(s=>s.type==="fuel_depot"),a=i.some(s=>s.type==="dry_dock");t.innerHTML=`
        <div onclick="pfOpenBuild('fuel_depot')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c86a4a;border:1px solid rgba(200,106,74,0.3);background:rgba(200,106,74,0.04);">
            ${n?"+ FUEL DEPOT":"BUILD FUEL DEPOT"}
        </div>
        <div onclick="pfOpenBuild('dry_dock')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c84;border:1px solid rgba(204,136,68,0.3);background:rgba(204,136,68,0.04);">
            ${a?"+ DRY DOCK":"BUILD DRY DOCK"}
        </div>`}let dn=!1;async function fl(o){if(dn||!d||!z)return;const e=cl.filter(g=>g.type===o);if(e.length===0)return;const t=wn[o],i=d.nation_id,n=S?.name||d?.nation||"Home Nation",a=S?.capital||"Port City",s=[{id:i,name:n,capital:a,label:"National HQ"}],{data:r}=await v.from("corp_properties").select("nation_id, name, city, nations!nation_id(name, capital)").eq("faction_id",d.id).eq("type","regional_hq").eq("is_active",!0);for(const g of r||[])g.nation_id!==i&&s.push({id:g.nation_id,name:g.nations?.name||g.city||"Unknown",capital:g.nations?.capital||g.city||"Port City",label:g.name||"Subsidiary"});let c=s[0];if(s.length>1){let g=t.label+` — SELECT LOCATION
`+"─".repeat(30)+`
`;g+=`Build in which nation?

`;for(let k=0;k<s.length;k++){const I=s[k],T=ho.filter(w=>w.type===o&&w.nation_id===I.id).length;g+=k+1+". "+I.name+"  ("+I.label+")",T>0&&(g+="  ["+T+" existing]"),g+=`
`}g+=`
Enter number (or cancel):`;const $=prompt(g);if(!$)return;const h=parseInt($,10)-1;if(isNaN(h)||h<0||h>=s.length){alert("Invalid selection.");return}c=s[h]}const p=ho.filter(g=>g.type===o&&g.nation_id===c.id).length;let f=t.label+" CONSTRUCTION — "+c.name.toUpperCase()+`
`+"─".repeat(30)+`
`;p>0&&(f+="You already have "+p+" "+t.label.toLowerCase()+(p>1?"s":"")+` here.

`),f+=t.desc+`

`;for(let g=0;g<e.length;g++){const $=e[g];f+=g+1+". "+$.name+`
`,f+="   Cost: "+_($.cost)+" · Maint: "+_($.maint)+`/tick
`,f+="   "+$.desc+`

`}f+="Enter 1 or 2 to select (or cancel):";const l=prompt(f);if(!l)return;const m=parseInt(l,10)-1;if(isNaN(m)||m<0||m>=e.length){alert("Invalid selection.");return}const u=e[m];if(!confirm("Commission "+u.name+" in "+c.capital+", "+c.name+`?

Budget: `+_(u.cost)+`

This will create a construction contract that construction corporations can bid on. Payment occurs when the contract is awarded.`))return;dn=!0;const y=z.current_tick||0,x=(z.current_date||"").match(/\d{4}/)?.[0]||"2015";try{const{count:g}=await v.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",c.id).eq("issuer_type","PRIVATE"),h=`PVT-P${(g||0)+1}-${x}`,k=u.style==="Modern",I={concrete:k?6:4,steel:k?5:3,heavy_parts:k?3:2,aggregate:k?3:2},T={trucks:1,mixers:1,excavators:1},w={general:k?12:8,skilled:k?5:3},C=k?6:4,{error:L}=await v.from("construction_contracts").insert({nation_id:c.id,template_key:o,sector:"industrial",name:u.name,project_type:t.label,project_subtype:u.style,description:`${u.name} at ${c.capital} Port — commissioned by ${d.faction_name}. ${u.desc}`,project_code:h,budget_ceiling:u.cost,timeline_ticks:C,required_materials:I,required_equipment:T,required_workforce:w,status:"open",generated_at_tick:y,bidding_ends_tick:y+3,issuer_type:"PRIVATE",issuer_name:d.faction_name,issuer_faction_id:d.id});if(L)throw L;await la(),alert(`Construction contract posted!

Project: `+u.name+`
Location: `+c.capital+", "+c.name+`
Code: `+h+`
Budget: `+_(u.cost)+`
Timeline: `+C+` ticks

Construction corporations in `+c.name+" can now bid on this project.")}catch(g){alert("Failed to post contract: "+(g.message||"Error"))}finally{dn=!1}}window.pfOpenBuild=fl;const Wn={"Bulk Cargo":["Reefer","Bulk","Coastal"],"Container Freight":["Coastal","Container"],"Specialized Transport":["Tanker","LNG","Bulk"]};async function Yn(){if(!d)return;const{data:o,error:e}=await v.from("ship_market_listings").select("*, nation:nation_id(id, name)").eq("status","available").order("asking_price",{ascending:!0});e&&console.warn("Failed to load ship market:",e.message),Cn=o||[],po=null,da()}function ml(o){po=po===o?null:o,da()}function ul(o){return(Wn[d?.corp_subsector]||[]).includes(o)}function da(){const o=document.getElementById("sm-count"),e=document.getElementById("sm-list"),t=document.getElementById("sm-footer");if(!o||!e)return;const i=Cn;o.textContent=i.length+" AVAILABLE",i.length===0?e.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels on the market.<br>Check back next cycle.</div>':e.innerHTML=i.map((s,r)=>{const c=po===r,p=$t[s.vessel_class]||{color:"#666",label:"?"},f=s.seller_type==="CORP"?"#5a8aaa":"#8b9a6b",l=sa(s.condition),m=s.nation?.name||"—",u=ul(s.vessel_class);z?.current_tick;const y=s.age_ticks||0,x=Math.max(1,Math.floor(y/12)),g=m!==d?.nation?Number(d?.tariffs||S?.tariffs||0):0,$=Math.round(s.asking_price*g/100),h=s.asking_price+$;let k=`<div onclick="smSelectListing(${r})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${c?p.color:"transparent"};background:${c?p.color+"06":"transparent"};">
                <div style="padding:8px 14px;">`;return k+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(s.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${p.color};background:${p.color}12;border:1px solid ${p.color}25;">${p.label}</span>
            </div>`,k+=`<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;">
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${f};background:${f}12;border:1px solid ${f}25;">${s.seller_type}</span>
                <span style="font-size:9px;color:var(--text-muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(s.seller_name||"—")}</span>
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;">${m.toUpperCase().slice(0,6)}</span>
                ${g>0?`<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">+${g}%</span>`:""}
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
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${x}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">PRICE</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--gold);margin-top:1px;">${_(s.asking_price)}</div>
                </div>
            </div>`,c&&(k+='<div style="margin-top:6px;">',k+=`<div style="padding:4px 8px;margin-bottom:5px;background:var(--bg-0);border:1px solid var(--border-0);">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0);">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CARRIES</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${p.color};">${($t[s.vessel_class]||{}).label||"?"} class cargo</span>
                    </div>
                    <div style="padding:3px 0;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:1px;">REASON FOR SALE</div>
                        <div style="font-size:9px;color:var(--text-muted);line-height:1.4;">${b(s.sale_reason||"—")}</div>
                    </div>
                </div>`,k+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                    <div style="width:40px;height:3px;background:var(--border-0);"><div style="width:${s.condition}%;height:100%;background:${l};"></div></div>
                    ${s.condition<60?'<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">May need dry dock</span>':""}
                </div>`,g>0&&(k+=`<div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:8px;margin-bottom:3px;">
                        <span style="color:var(--text-dim);">Import tariff (${g}%)</span>
                        <span style="color:#c84;">+${_($)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;margin-bottom:5px;">
                        <span style="color:var(--text-bright);">TOTAL</span>
                        <span style="color:var(--gold);">${_(h)}</span>
                    </div>`),u?k+=`<div onclick="event.stopPropagation();smPurchase('${s.id}',${h})" style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${p.color};cursor:pointer;">${_(h)} — PURCHASE</div>`:k+=`<div style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:var(--text-dim);border:1px solid var(--border-0);opacity:0.4;">⊘ ${s.vessel_class} not available for ${d?.corp_subsector||"your subsector"}</div>`,k+="</div>"),k+="</div></div>",k}).join("");const n=i.filter(s=>s.seller_type==="CORP").length,a=i.filter(s=>s.seller_type==="LOCAL").length;t.innerHTML=`<div style="display:flex;gap:6px;">
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
    <div onclick="smOpenCommission()" style="padding:4px 14px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--gold);border:1px solid rgba(200,168,50,0.3);cursor:pointer;">COMMISSION VESSEL</div>`}let at=!1;async function yl(o,e){if(at||!d||!z)return;const t=Number(d.corp_cash_reserves??0);if(t<e){alert("Insufficient cash. Need "+_(e)+".");return}if(!confirm("Purchase this vessel for "+_(e)+"?"))return;at=!0;const i=Cn.find(l=>l.id===o);if(!i){at=!1;return}const n=z.current_tick||0,a={Coastal:{capacity_dwt:14e3,capacity_unit:"DWT",base_maintenance:18e4,fuel_capacity:800,purchase_price:3e6},Container:{capacity_dwt:4800,capacity_unit:"TEU",base_maintenance:29e4,fuel_capacity:2100,purchase_price:65e6},Bulk:{capacity_dwt:28e3,capacity_unit:"DWT",base_maintenance:35e4,fuel_capacity:1800,purchase_price:3e6},Tanker:{capacity_dwt:42e3,capacity_unit:"DWT",base_maintenance:38e4,fuel_capacity:2400,purchase_price:53e6},Reefer:{capacity_dwt:12e3,capacity_unit:"DWT",base_maintenance:28e4,fuel_capacity:1600,purchase_price:6e6},LNG:{capacity_dwt:18e3,capacity_unit:"DWT",base_maintenance:58e4,fuel_capacity:1400,purchase_price:78e6}},s=a[i.vessel_class]||a.Coastal,{error:r}=await v.from("factions").update({corp_cash_reserves:t-e}).eq("id",d.id);if(r){alert("Failed: "+r.message),at=!1;return}const{error:c}=await v.from("corp_vessels").insert({faction_id:d.id,nation_id:d.nation_id,vessel_name:i.vessel_name,vessel_class:i.vessel_class,condition:i.condition,fuel:i.fuel||50,status:"in_port",capacity_dwt:i.capacity_dwt||s.capacity_dwt,capacity_unit:i.capacity_unit||s.capacity_unit,base_maintenance:i.base_maintenance||s.base_maintenance,fuel_capacity:i.fuel_capacity||s.fuel_capacity,purchase_price:e,built_at_tick:n-(i.age_ticks||0),current_port_nation_id:d.nation_id});if(c){await v.from("factions").update({corp_cash_reserves:t}).eq("id",d.id),alert("Failed to create vessel: "+c.message),at=!1;return}var{error:p}=await v.from("ship_market_listings").update({status:"sold",purchased_by:d.id,purchased_at_tick:n}).eq("id",o);if(p&&console.warn("Failed to mark listing as sold:",p.message),i.seller_faction_id){const{data:l}=await v.from("factions").select("corp_cash_reserves").eq("id",i.seller_faction_id).single();if(l){var{error:f}=await v.from("factions").update({corp_cash_reserves:Number(l.corp_cash_reserves||0)+i.asking_price}).eq("id",i.seller_faction_id);f&&console.warn("Failed to credit seller:",f.message)}}d.corp_cash_reserves=t-e,at=!1,await Promise.all([ve(),Yn()])}const Lt=[{cls:"Coastal",baseCost:12e6,baseBuild:3,cargo:"Bulk, Containers (coastal)"},{cls:"Container",baseCost:65e6,baseBuild:5,cargo:"Manufactured, Tech, General"},{cls:"Bulk",baseCost:38e6,baseBuild:4,cargo:"Minerals, Aggregate, Military"},{cls:"Tanker",baseCost:52e6,baseBuild:5,cargo:"Fuel, Petroleum, Chemicals"},{cls:"Reefer",baseCost:45e6,baseBuild:4,cargo:"Food, Perishables, Agriculture"},{cls:"LNG",baseCost:78e6,baseBuild:6,cargo:"Liquefied Natural Gas only"}];let le="Coastal",Ht=0,Gt="",Qe=[];function vl(){le=(Wn[d?.corp_subsector]||["Coastal"])[0],Ht=0,Gt="",Qe=[],document.getElementById("comm-overlay").style.display="flex",gl()}async function gl(){const{data:o}=await v.from("nations").select("id, name, manufacturing_output, physical_infrastructure, tariffs").order("name");Qe=(o||[]).map(e=>{const t=Number(e.manufacturing_output??50),i=Math.round((.75+t/100*.5)*100)/100,n=Math.round((1.5-t/100*.65)*100)/100,a=e.id===d?.nation_id;return{id:e.id,name:e.name,mfg:t,costMod:i,buildMod:n,isHome:a,tariffs:Number(e.tariffs??0)}}),Qe.sort((e,t)=>(t.isHome?1:0)-(e.isHome?1:0)),Qn()}function ca(){document.getElementById("comm-overlay").style.display="none"}function xl(o){le=o,Qn()}function bl(o){Ht=o,Qn()}function _l(o){Gt=o}function Qn(){const o=document.getElementById("comm-content");if(!o)return;const e=z?.current_tick||0,t=Lt.find(y=>y.cls===le)||Lt[0],i=Qe[Ht]||{name:"—",costMod:1,buildMod:1},n=$t[le]||{color:"#666"},a=Math.round(t.baseCost*i.costMod),s=Math.max(2,Math.round(t.baseBuild*i.buildMod)),r=Math.round(a*.5),c=a-r,p=e+s,f=Wn[d?.corp_subsector]||[];let l="";l+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:#c8a832;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Commission Vessel</span>
            </div>
            <span onclick="smCloseCommission()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
    </div>`,l+='<div style="flex:1;overflow-y:auto;">',l+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Vessel Type</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">`;for(const y of Lt){const x=$t[y.cls]||{color:"#666",label:"?"},g=le===y.cls,$=f.includes(y.cls);l+=`<div onclick="${$?"commSetClass('"+y.cls+"')":""}" style="padding:5px 4px;text-align:center;cursor:${$?"pointer":"not-allowed"};background:${g?x.color+"18":"transparent"};border:1px solid ${g?x.color+"44":"#2a2a24"};opacity:${$?1:.3};">
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${g?x.color:"#6a6660"};">${x.label}</div>
            <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;margin-top:2px;">${_(y.baseCost)} base</div>
        </div>`}l+="</div>",l+=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:${n.color};">${t.cargo}</div>`,l+="</div>",l+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Origin Shipyard</div>`;for(let y=0;y<Qe.length;y++){const x=Qe[y],g=Ht===y,$=x.costMod>1?"#c84":x.costMod<1?"#5c5":"#6a6660",h=x.buildMod>1?"#c84":x.buildMod<1?"#5c5":"#6a6660";l+=`<div onclick="commSetNation(${y})" style="display:flex;align-items:center;padding:5px 8px;margin-bottom:2px;cursor:pointer;background:${g?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${g?"#8b9a6b44":"#2a2a24"};border-left:2px solid ${g?"#8b9a6b":"transparent"};">
            <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:11px;font-weight:600;color:${g?"#e8e4dc":"#9e9a92"};">${b(x.name)}</span>
                    ${x.isHome?'<span style="font-family:var(--font-mono);font-size:6px;padding:0 3px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2);line-height:11px;">HOME</span>':""}
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${x.isHome?"Home port — no tariff":"Foreign shipyard"}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">MFG</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#9e9a92;">${x.mfg}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">COST</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${$};">×${x.costMod.toFixed(2)}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">SPEED</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${h};">×${x.buildMod.toFixed(2)}</div></div>
            </div>
        </div>`}l+="</div>",l+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Vessel Name</div>
        <input id="comm-name-input" value="${b(Gt)}" oninput="commSetName(this.value)" placeholder="e.g., MV 'Sierra Nevada'" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:11px;color:#e8e4dc;background:#1c1c18;border:1px solid #2a2a24;outline:none;box-sizing:border-box;" />
    </div>`,l+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Build Summary</div>
        <div style="background:#1c1c18;border:1px solid #2a2a24;padding:6px 10px;">`;const m=[{label:"VESSEL CLASS",value:le,color:n.color},{label:"SHIPYARD",value:i.name,color:"#9e9a92"},{label:"BASE COST",value:_(t.baseCost)+" × "+i.costMod.toFixed(2),color:"#9e9a92"},{label:"BUILD TIME",value:s+" ticks",color:s>t.baseBuild?"#c84":s<t.baseBuild?"#5c5":"#9e9a92"},{label:"COMPLETION",value:"~Tick "+p,color:"#9e9a92"}];for(const y of m)l+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${y.label}</span>
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${y.color};">${y.value}</span>
        </div>`;l+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">TOTAL COST</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c8a832;">${_(a)}</span>
    </div>`,l+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEPOSIT (50% NOW)</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">${_(r)}</span>
    </div>`,l+=`<div style="display:flex;justify-content:space-between;padding:3px 0;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">BALANCE ON COMPLETION</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${_(c)}</span>
    </div>`,l+="</div></div>",l+=`<div style="padding:6px 16px;">
        <div style="padding:5px 8px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#c8a832;margin-bottom:2px;">PAYMENT TERMS</div>
            <div style="font-size:9px;color:#6a6660;line-height:1.5;">50% deposit due immediately. Remaining 50% due on delivery at tick ${p}. Vessel delivered at 100% condition, fully fueled, to your nearest port. Cancellation forfeits deposit.</div>
        </div>
    </div>`,l+="</div>";const u=Gt.trim().length>=2;l+=`<div style="padding:10px 16px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">DEPOSIT DUE NOW</div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${_(r)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="smCloseCommission()" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="comm-order-btn" onclick="${u?"smPlaceOrder()":""}" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:${u?"#000":"#6a6660"};background:${u?"#c8a832":"transparent"};border:1px solid ${u?"#c8a832":"#2a2a24"};cursor:${u?"pointer":"default"};opacity:${u?1:.4};">PLACE ORDER</div>
        </div>
    </div>`,o.innerHTML=l}let St=!1;async function hl(){if(St||!d||!z)return;const o=Gt.trim();if(o.length<2)return;const e=Lt.find(g=>g.cls===le)||Lt[0],t=Qe[Ht];if(!t)return;const i=Math.round(e.baseCost*t.costMod),n=Math.max(2,Math.round(e.baseBuild*t.buildMod)),a=Math.round(i*.5),s=i-a,r=z.current_tick||0,c=Number(d.corp_cash_reserves??0);if(c<a){alert("Insufficient cash for deposit. Need "+_(a)+".");return}if(!confirm("Commission "+le+" from "+t.name+`?

Deposit: `+_(a)+` (non-refundable)
Balance: `+_(s)+" on delivery at tick "+(r+n)))return;St=!0;const p=document.getElementById("comm-order-btn");p&&(p.style.opacity="0.4",p.style.pointerEvents="none");const{error:f}=await v.from("factions").update({corp_cash_reserves:c-a}).eq("id",d.id);if(f){alert("Failed: "+f.message),St=!1;return}const{data:l}=await v.from("nations").select("budget_reserves").eq("id",t.id).single();if(l){var{error:m}=await v.from("nations").update({budget_reserves:Number(l.budget_reserves||0)+a}).eq("id",t.id);m&&console.warn("Failed to credit shipyard nation budget:",m.message)}const u={Coastal:{dwt:14e3,unit:"DWT",maint:18e4,fuel:800},Container:{dwt:4800,unit:"TEU",maint:29e4,fuel:2100},Bulk:{dwt:28e3,unit:"DWT",maint:35e4,fuel:1800},Tanker:{dwt:42e3,unit:"DWT",maint:38e4,fuel:2400},Reefer:{dwt:12e3,unit:"DWT",maint:28e4,fuel:1600},LNG:{dwt:18e3,unit:"DWT",maint:58e4,fuel:1400}},y=u[le]||u.Coastal,{error:x}=await v.from("vessel_orders").insert({faction_id:d.id,vessel_name:o,vessel_class:le,capacity_dwt:y.dwt,capacity_unit:y.unit,base_maintenance:y.maint,fuel_capacity:y.fuel,purchase_price:e.baseCost,shipyard_nation_id:t.id,shipyard_nation:t.name,cost_modifier:t.costMod,build_modifier:t.buildMod,total_cost:i,deposit_paid:a,balance_due:s,ordered_at_tick:r,delivery_tick:r+n,build_ticks:n,status:"building"});if(x){await v.from("factions").update({corp_cash_reserves:c}).eq("id",d.id),alert("Failed to place order: "+x.message),St=!1;return}d.corp_cash_reserves=c-a,St=!1,ca(),alert(o+` commissioned!

Class: `+le+`
Shipyard: `+t.name+`
Deposit: `+_(a)+`
Delivery: Tick `+(r+n))}window.smSelectListing=ml;window.smPurchase=yl;window.smOpenCommission=vl;window.smCloseCommission=ca;window.commSetClass=xl;window.commSetNation=bl;window.commSetName=_l;window.smPlaceOrder=hl;window.flSelectVessel=nl;window.flRefurbish=il;window.flRefuel=al;window.flSell=sl;window.flRename=rl;window.openBidReview=Jr;window.closeBidReview=Oo;window.reviewSelectBid=Xr;window.acceptBid=Zr;window.declineAllBids=el;window.switchToActions=Ni;window.actSelectExec=or;window.actExecute=js;window.confirmFireExec=Ps;window.actOpenStatement=Li;window.actCloseStatement=Pn;window.actSubmitStatement=Fs;window.actDeclareBankruptcy=qi;window.actOpenRestructure=Di;window.actCloseRestructure=Dn;window.actSubmitRestructure=Js;window.actOpenRebrand=ji;window.actCloseRebrand=jn;window.actSubmitRebrand=Xs;window.actOpenDonation=Fi;window.actCloseDonation=Fn;window.actSubmitDonation=tr;window.donateSelectParty=er;window.lrOpen=Bi;window.lrClose=Pi;window.lrSubmit=Ks;window.lrSetAmount=Gs;window.lrSetPurpose=Vs;window.lrSetTerm=Ws;window.lrSetCollateral=Ys;window.openExecSearch=nr;window.closeExecSearch=Hi;window.esSelectCandidate=ir;window.esHireCandidate=ar;window.switchToExpansion=Ti;window.switchToOperations=Ii;window.hfSetChange=sr;window.hfReset=rr;window.hfConfirm=lr;document.addEventListener("click",function(o){const e=o.target.closest(".corp-nav-tab[href]:not([data-tab-action])");if(!e)return;const t=e.getAttribute("href");if(!t)return;const i=new URL(t,window.location.href);i.pathname!==window.location.pathname||i.searchParams.get("tab")||e.classList.contains("active")||(o.preventDefault(),Ii(o))});Ms();
