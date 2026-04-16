const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-BNWh-zwV.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as y}from"./supabase-client-CiYoFhIh.js";/* empty css                    */import{c as be,i as ba,a as _a,l as ha,M as jt,Q as En,b as Cn,d as pn,e as mi,f as ui,g as $a,h as wa}from"./corp-shipping-data-CcJ84lK3.js";import{_ as ka}from"./preload-helper-BXl3LOEh.js";import{e as g}from"./utils-CY90Gazr.js";import{initMessaging as Ea}from"./messaging-BUrQna7p.js";import{c as Ca,a as fn,E as Ft,b as So,d as vi,e as Ta,f as Sa,h as ii}from"./equipment-DsuDdEne.js";import{a as za,E as mo,b as uo,g as Ia}from"./corp-executives-D9q33LB9.js";import"./elections-B2jRdA_W.js";import"./config-fKhFNVuq.js";import"./government-types-CONVKpUN.js";import"./ideology-BIAflN4K.js";import"./stats-tIiBSaQA.js";let we=[],p=null,I=null,z=null,lt=[],kt={},J=[],ee={},mn=-1;const Na={em:"em_systems",glass:"glass_facades",heavy:"heavy_parts"},vo=o=>Na[o]||o;let oe="concrete",W="STD",xe=500,ut=null,re=[],yo={},un=0,Ut=[],Ht=[],vt=0,ke=null,Ce=-1,_e=[],Gt=null,Rt={},go={},Tn=[],xo=null,me="trucks",Ee=0,Te=1,Oe=[],Ye=null,Et=[],vn=null,so=null;function ot(){return ut||I}let yn="ALL",gn="TIMELINE";function j(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Aa(o){if(o>=12){const e=Math.floor(o/12),t=o%12;return t>0?e+"y "+t+"mo":e+"y"}return o+" ticks"}function yi(o){return!o||o.length===0?"":o.map(e=>{const t=yo[e];if(!t)return"";const i=t.reputation_bonus>0?"var(--green)":t.reputation_bonus<0?"var(--red)":"var(--text-dim)",n=t.reputation_bonus>0?"+"+t.reputation_bonus:t.reputation_bonus<0?String(t.reputation_bonus):"";return`<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:3px;font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">${t.icon||"📍"} ${g(t.name)}${n?` <span style="color:${i};font-weight:700;">${n} REP</span>`:""}</span>`}).filter(Boolean).join(" ")}function ue(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(0)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Sn(o){return o==="civil_engineering"?"CIVIL":o==="industrial"?"INDUSTRIAL":o==="mega_project"?"MEGA":o?.toUpperCase()||"—"}function gi(o){return o==="civil_engineering"?"light":o==="industrial"?"heavy":o==="mega_project"?"mega":"light"}function Ma(){so&&clearInterval(so),so=setInterval(()=>{if(!vn)return;const o=vn-Date.now();if(o<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(so);return}const e=Math.floor(o/36e5),t=Math.floor(o%36e5/6e4),i=Math.floor(o%6e4/1e3);document.getElementById("tick-countdown").textContent=e+"h "+t+"m "+i+"s"},1e3)}function Ra(){document.body.classList.toggle("light-mode");const o=document.getElementById("theme-toggle");o.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function La(o,e){o==="type"&&(yn=e),o==="sort"&&(gn=e),document.querySelectorAll(`.filter-pill[data-filter="${o}"]`).forEach(t=>{t.classList.toggle("active",t.dataset.value===e)}),bi()}const ai={"Civil Engineering":"civil_engineering","Industrial Construction":"industrial",Megaprojects:"mega_project"};function xi(o){if(!p)return!1;if(ai[p.corp_subsector]===o.sector)return!0;const t=(Q||[]).filter(i=>i.type==="regional_hq"&&i.is_active&&i.nation_id===o.nation_id);for(const i of t)if(ai[i.subsector]===o.sector)return!0;return!1}function bi(){const o=document.getElementById("oc-list");let e=[...lt];if(yn==="GOVERNMENT"?e=e.filter(n=>n.issuer_type==="GOVERNMENT"):yn==="PRIVATE"&&(e=e.filter(n=>n.issuer_type==="PRIVATE")),gn==="TIMELINE"&&e.sort((n,a)=>(n.timeline_ticks||0)-(a.timeline_ticks||0)),gn==="BUDGET"&&e.sort((n,a)=>(a.budget_ceiling||0)-(n.budget_ceiling||0)),document.getElementById("oc-count").textContent=e.length+" AVAILABLE",e.length===0){o.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const t=z?.current_tick||0;let i="";for(const n of e){const a=n.issuer_type==="GOVERNMENT",s=a?"gov":"private",r=xi(n),l=r?"":" locked",c=gi(n.sector),f=Sn(n.sector),d=(n.timeline_ticks||0)>18?" warn":"",u=n.bidding_ends_tick?Math.max(0,n.bidding_ends_tick-t):"?";i+=`
            <div class="oc-item${l}" data-contract-id="${n.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${g(n.name)}</span>
                    <span class="oc-item__type-badge ${s}">${a?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${s}">${g(n.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${u} tick${u!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${ue(n.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${d}">${Aa(n.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${c}">${f}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${kt[n.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${ue(kt[n.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${r?"yes":"no"}">${r?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${r?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openContractDetail(contracts.find(x=>x.id==='${n.id}'))">VIEW</button>`:""}
                </div>
                ${n.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${g(n.description)}</div>`:""}
                ${n.modifiers&&n.modifiers.length>0?`<div style="display:flex;flex-wrap:wrap;gap:3px;padding:4px 0 0;">${yi(n.modifiers)}</div>`:""}
            </div>`}o.innerHTML=i,o.querySelectorAll(".oc-item:not(.locked)").forEach(n=>{n.addEventListener("click",()=>{const a=n.dataset.contractId,s=lt.find(r=>r.id===a);s&&_i(s)})})}let Qe=null;function _i(o){Qe=o;const e=document.getElementById("cd-overlay"),t=o.issuer_type==="GOVERNMENT",i=t?"gov":"private",n=(I?.name||p.nation||"—").toUpperCase(),a=xi(o);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${g(n)}</span>
        <span class="cd-header__name">${g(o.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${i}">${g(o.issuer_name)}</span>
        <span class="cd-header__type-badge ${i}">${t?"GOV":"PRIVATE"}</span>
    `;const s=document.getElementById("cd-blueprint");o.blueprint_svg?(s.innerHTML=o.blueprint_svg,s.style.display=""):(s.innerHTML=es(o),s.style.display="");const r=o.permits_required||[],l=o.required_equipment||o.equipment_required||{},c=Array.isArray(l)?l.map(B=>({key:B,qty:1})):Object.entries(l).map(([B,D])=>({key:B,qty:D})),f=o.required_materials||o.materials_estimated||{},u={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[o.sector]||o.spec_category||o.sector||"—";let m="var(--teal)";o.sector==="industrial"&&(m="var(--orange)"),o.sector==="mega_project"&&(m="var(--red)");let v=j(o.budget_ceiling||o.budget||0),x=(o.timeline_ticks||o.timeline_months||0)+" Months",b="";b+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${g(o.project_code||o.contract_number||"")}</span>
            </div>
            <div class="cd-issue__tags">
                ${o.project_type?`<span class="cd-tag teal">${g(o.project_type.toUpperCase())}</span>`:""}
                ${o.project_subtype?`<span class="cd-tag gold">${g(o.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,o.description&&(b+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${g(o.description)}</div>
            </div>`);const $=o.modifiers||[];if($.length>0){b+=`<div class="cd-items">
            <div class="cd-section-label">Building Modifiers</div>
            <div style="display:flex;flex-direction:column;gap:6px;">`;for(const B of $){const D=yo[B];if(!D)continue;const L=D.reputation_bonus>0?"var(--green)":D.reputation_bonus<0?"var(--red)":"var(--text-dim)",F=D.cost_multiplier>1?"+"+Math.round((D.cost_multiplier-1)*100)+"% cost":D.cost_multiplier<1?Math.round((1-D.cost_multiplier)*100)+"% cheaper":"",X=D.reputation_bonus!==0?(D.reputation_bonus>0?"+":"")+D.reputation_bonus+" rep":"",H=D.required_permits||[];b+=`<div style="padding:6px 10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:600;font-size:0.78rem;color:var(--text-primary);">${D.icon||"📍"} ${g(D.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;">
                        ${F?`<span style="color:var(--amber);">${F}</span>`:""}
                        ${F&&X?" · ":""}
                        ${X?`<span style="color:${L};font-weight:700;">${X}</span>`:""}
                    </span>
                </div>
                <div style="font-size:0.65rem;color:var(--text-dim);margin-top:2px;">${g(D.description||"")}</div>
                ${H.length>0?`<div style="font-size:0.6rem;color:var(--amber);margin-top:3px;font-family:var(--font-mono);">Requires permits: ${H.map(Re=>g(Re.replace(/_/g," "))).join(", ")}</div>`:""}
            </div>`}b+="</div></div>"}b+='<div class="cd-details">',o.project_type&&(b+=qe("Type",o.project_type)),o.project_subtype&&(b+=qe("Sub-Type",o.project_subtype)),b+=qe("Specialization",u,m),b+=qe("Total Budget",v,"var(--green)"),b+=qe("Timeline",x),b+=qe("Nation",I?.name||p.nation||"—"),o.region&&(b+=qe("Region",o.region)),b+="</div>",r.length>0&&(b+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${r.map(B=>{const D=B.status==="approved"?"approved":"required",L=B.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${D}">
                            <span class="cd-chip__icon">${L}</span>
                            <span class="cd-chip__label">${g(B.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),f.length>0&&(b+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${f.map(B=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${g(B.name)}</span>
                        <span class="cd-mat-row__qty">${g(String(B.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=b;const h=r.filter(B=>B.status==="approved").length,E=r.length-h,T=c.length,S=[];for(const B of c){const L={work_trucks:"trucks",concrete_mixers:"mixers",tower_cranes:"cranes",heavy_haulers:"haulers",pile_drivers:"piledrivers",asphalt_plants:"asphalt"}[B.key]||B.key,F=re.find(X=>X.equipment_key===L||X.equipment_key===B.key);F&&F.owned>=B.qty||S.push(B)}const w=S.length,C=o.required_materials||{},M=typeof C=="object"&&!Array.isArray(C)?Object.entries(C):[],k=[];for(const[B,D]of M){const L=ee[B]||{},F=(L.LOW?.qty||0)+(L.STD?.qty||0)+(L.HIGH?.qty||0);F<D&&k.push({key:B,need:D,have:F})}const N=B=>B.replace(/_/g," ").replace(/\b\w/g,D=>D.toUpperCase());let R="";if(T>0)if(w===0)R+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>';else{const B=S.map(D=>N(D.key)).join(", ");R+=`<span class="cd-footer__badge bad" title="${g(B)}">${w} SHORT: ${g(B)}</span>`}if(M.length>0)if(k.length===0)R+='<span class="cd-footer__badge ok">ALL MATERIALS MET</span>';else{const B=k.map(D=>N(D.key)+" ("+D.have+"/"+D.need+")").join(", ");R+=`<span class="cd-footer__badge bad" title="${g(B)}">${k.length} MAT SHORT: ${g(B)}</span>`}r.length>0&&(E===0?R+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':R+=`<span class="cd-footer__badge warn">${E} PERMITS PENDING</span>`);const P=a,G=o.issuer_faction_id===p?.id,U=o.status==="bidding",ne=kt[o.id];document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${R}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${G?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${U?"":"disabled"} title="${U?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:ne?`<button class="cd-btn primary" onclick="retractBid('${o.id}')" style="background:#c55;border-color:#c55;"
                        title="Retract your bid ($1M penalty)">RETRACT BID</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${P?"":"disabled"}
                        title="${P?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,e.classList.add("open"),document.body.style.overflow="hidden"}function Jt(o){o&&o.target&&o.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",Qe=null)}const je=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],si={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},ri={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let q=null;const qa="get_contract_permit_requirements";async function Oa(o,e){if(!y||!o||!e)return[];try{const{data:t,error:i}=await y.rpc(qa,{p_contract_id:o,p_faction_id:e});return i?(console.warn("[pm permits] failed to load permit requirements:",i.message),[]):Array.isArray(t)?t.filter(n=>n&&n.name).map(n=>({name:String(n.name),has_permit:n.has_permit===!0})):[]}catch(t){return console.warn("[pm permits] unexpected error loading permit requirements:",t),[]}}async function nt(o){const e=J.find(L=>L.id===o);if(!e)return;const t=Array.isArray(e.contract_bids)?e.contract_bids[0]:e.contract_bids,i=z?.current_tick||0,n=e.awarded_at_tick||i,a=e.timeline_ticks||8,s=Math.max(0,i-n),r=Math.min(100,s/a*100);let l=Math.min(je.length-1,Math.floor(r/(100/je.length)));const c=Math.round(r%(100/je.length)/(100/je.length)*100),f=e.required_materials||{},d=t?.material_grades||{};let u=[];try{const{data:L}=await y.from("project_material_allocations").select("material_key, quality_tier, quantity, consumed").eq("contract_id",e.id);u=L||[]}catch{}const m={};for(const L of u)m[L.material_key]||(m[L.material_key]={totalAllocated:0,totalConsumed:0,tiers:{}}),m[L.material_key].totalAllocated+=L.quantity,m[L.material_key].totalConsumed+=L.consumed,m[L.material_key].tiers[L.quality_tier]={qty:L.quantity,consumed:L.consumed};const v=Object.entries(f).map(([L,F])=>{const X=d[L]||"STD",H=m[L]||{totalAllocated:0,totalConsumed:0,tiers:{}};return{key:L,name:L.replace(/_/g," ").replace(/\b\w/g,Re=>Re.toUpperCase()),grade:X,required:Number(F),allocated:H.totalAllocated,consumed:H.totalConsumed,tiers:H.tiers,warehouseStock:ee[L]||{}}}),x=e.required_equipment||{},b=e.equipment_condition||{},$=Array.isArray(x)?x.map(L=>[L,1]):Object.entries(x),h={work_trucks:"trucks",concrete_mixers:"mixers",tower_cranes:"cranes",heavy_haulers:"haulers",pile_drivers:"piledrivers",asphalt_plants:"asphalt"},E=$.map(([L,F])=>{const X=h[L]||L,H=re.find(Z=>Z.equipment_key===X||Z.equipment_key===L),io=(H?.assigned_projects||[]).find(Z=>Z.contract_id===e.id),It=io?io.units:0;return{key:L,name:L.replace(/_/g," ").replace(/\b\w/g,Z=>Z.toUpperCase()),required:Number(F)||1,ownedTotal:H?.owned||0,deployed:H?.deployed||0,available:Math.max(0,(H?.owned||0)-(H?.deployed||0)),assignedToProject:It,condition:b[L]??(H?.condition||100)}}),T=e.budget_ceiling||0,S=t?.estimated_cost||0,w=Math.round(S*Math.min(1,s/a)),C=t?.estimated_quality||65,M=C>=80?"STRONG":C>=60?"PROMISING":C>=40?"FAIR":"UNCERTAIN",k=e.required_workforce||{},N=e.workers_assigned||{},R=(k.general||0)+(k.skilled||0)+(k.innovative||0),P=(N.general||0)+(N.skilled||0)+(N.innovative||0),G=t?.labor_count||R,U=Number(p?.corp_general_workforce??0),ne=Number(p?.corp_skilled_workforce??0),B=Number(p?.corp_innovative_workforce??0),D=await Oa(e.id,p?.id);q={project:e,bid:t,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:i,awardedTick:n,totalTicks:a,ticksElapsed:s,phaseIdx:l,phaseProgress:c,materials:v,equipment:E,permitRequirements:D,budget:T,estCost:S,spent:w,quality:C,qualityLabel:M,laborCount:G,wfNeeded:R,wfAssigned:P,reqWf:k,assignedWf:N,corpGeneral:U,corpSkilled:ne,corpInnovative:B,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",hi(e.id).then(()=>Xe()),Xe()}let Y=!1;async function Ba(o,e,t){if(!(Y||!q||!p)){Y=!0;try{const{data:i,error:n}=await y.rpc("allocate_material_to_project",{p_contract_id:q.project.id,p_faction_id:p.id,p_material_key:o,p_quality_tier:e,p_quantity:t});if(n){alert("Allocation failed: "+n.message);return}if(i&&!i.success){alert(i.error||"Allocation failed");return}await Nn(),await nt(q.project.id)}catch(i){alert("Allocation error: "+i.message)}finally{Y=!1}}}async function Pa(o,e,t){if(!(Y||!q||!p)){Y=!0;try{const{data:i,error:n}=await y.rpc("deallocate_material_from_project",{p_contract_id:q.project.id,p_faction_id:p.id,p_material_key:o,p_quality_tier:e,p_quantity:t});if(n){alert("Return failed: "+n.message);return}if(i&&!i.success){alert(i.error||"Return failed");return}await Nn(),await nt(q.project.id)}catch(i){alert("Return error: "+i.message)}finally{Y=!1}}}async function Da(o,e){if(!(Y||!q||!p)){Y=!0;try{const t=q.project,i=t.workers_assigned||{},n=Number(i[o]||0),a=Number((t.required_workforce||{})[o]||0),s=Number(p?.["corp_"+o+"_workforce"]??0);let r=0;for(const m of J||[])m.id!==t.id&&(r+=Number((m.workers_assigned||{})[o]||0));const l=Math.max(0,s-r-n),c=Math.min(e,a-n,l);if(c<=0){alert(l<=0?"No "+o+" workers available in pool":"Already fully staffed for "+o);return}const f={...i,[o]:n+c},{error:d}=await y.from("construction_contracts").update({workers_assigned:f}).eq("id",t.id);if(d){alert("Assign failed: "+d.message);return}const u=J.find(m=>m.id===t.id);u&&(u.workers_assigned=f),await nt(t.id)}catch(t){alert("Assign error: "+t.message)}finally{Y=!1}}}async function ja(o,e){if(!(Y||!q||!p)){Y=!0;try{const t=q.project,i=t.workers_assigned||{},n=Number(i[o]||0),a=Math.min(e,n);if(a<=0){alert("No "+o+" assigned");return}const s={...i,[o]:n-a},{error:r}=await y.from("construction_contracts").update({workers_assigned:s}).eq("id",t.id);if(r){alert("Unassign failed: "+r.message);return}const l=J.find(c=>c.id===t.id);l&&(l.workers_assigned=s),await nt(t.id)}catch(t){alert("Unassign error: "+t.message)}finally{Y=!1}}}async function Fa(o,e){if(!(Y||!q||!p)){Y=!0;try{const i={work_trucks:"trucks",concrete_mixers:"mixers",tower_cranes:"cranes",heavy_haulers:"haulers",pile_drivers:"piledrivers",asphalt_plants:"asphalt"}[o]||o,n=re.find(f=>f.equipment_key===i||f.equipment_key===o);if(!n){alert("Equipment not found in inventory.");return}const a=Math.max(0,(n.owned||0)-(n.deployed||0));if(a<e){alert("Not enough available "+o+" ("+a+" available).");return}const s=(n.deployed||0)+e,r=[...n.assigned_projects||[]],l=r.find(f=>f.contract_id===q.project.id);l?l.units+=e:r.push({contract_id:q.project.id,contract_name:q.project.name,units:e});const{error:c}=await y.from("corp_equipment").update({deployed:s,assigned_projects:r}).eq("faction_id",p.id).eq("equipment_key",n.equipment_key);if(c){alert("Deploy failed: "+c.message);return}await Fn(),await nt(q.project.id)}catch(t){alert("Deploy error: "+t.message)}finally{Y=!1}}}async function Ua(o){if(!(Y||!q||!p)){Y=!0;try{const t={work_trucks:"trucks",concrete_mixers:"mixers",tower_cranes:"cranes",heavy_haulers:"haulers",pile_drivers:"piledrivers",asphalt_plants:"asphalt"}[o]||o,i=re.find(c=>c.equipment_key===t||c.equipment_key===o);if(!i){alert("Equipment not found.");return}const n=[...i.assigned_projects||[]],a=n.findIndex(c=>c.contract_id===q.project.id);if(a===-1){alert("Equipment not deployed to this project.");return}const s=n[a].units;n.splice(a,1);const r=Math.max(0,(i.deployed||0)-s),{error:l}=await y.from("corp_equipment").update({deployed:r,assigned_projects:n}).eq("faction_id",p.id).eq("equipment_key",i.equipment_key);if(l){alert("Undeploy failed: "+l.message);return}await Fn(),await nt(q.project.id)}catch(e){alert("Undeploy error: "+e.message)}finally{Y=!1}}}function Ha(o){o&&o.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",q=null)}function Ga(o){q&&(q.tab=o,q.expandedEvent=-1,q.selectedResponse=null,Xe())}function Va(o){q&&(q.expandedEvent=q.expandedEvent===o?-1:o,q.selectedResponse=null,Xe())}function Wa(o){q&&(q.selectedResponse=q.selectedResponse===o?null:o,Xe())}function Xe(){if(!q)return;const o=q,e=o.project,t=e.issuer_type==="GOVERNMENT",i=Sn(e.sector),n=p?.nation||"Nation",a=o.awardedTick+o.totalTicks,s=Math.max(0,a-o.currentTick),r=o.currentTick>a,l=o.budget>0?Math.round(o.spent/o.budget*100):0,c=l>85?"var(--red)":l>60?"var(--amber)":"var(--teal)",f=o.budget-o.spent,d=o.events.filter(b=>b.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${g(n.toUpperCase())}</span>
                <span class="pm-hdr__name">${g(e.name)}</span>
                <span style="color:var(--text-dim);font-size:12px">—</span>
                <span class="pm-hdr__issuer">${g(e.issuer_name||"—")}</span>
                <span class="pm-hdr__type">${t?"GOV":"PVT"}</span>
            </div>
            <button class="pm-hdr__close" onclick="closeProjectModal()">×</button>
        </div>
        <div class="pm-hdr__row2">
            <span class="pm-hdr__id">${g(e.template_key||e.id)}</span>
            <span class="pm-hdr__badge pm-hdr__badge--spec">${g(i.toUpperCase())}</span>
            <span class="pm-hdr__badge pm-hdr__badge--sub">${g((e.sector||"").replace(/_/g," ").toUpperCase())}</span>
        </div>
    `;let u='<div class="pm-phase__bar">';for(let b=0;b<je.length;b++){const $=b<o.phaseIdx,h=b===o.phaseIdx;u+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${$?"done":h?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${$?"done":h?"active":""}">${je[b]}</span>
        </div>`}u+="</div>",u+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${je[o.phaseIdx]} — ${o.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${r?"var(--red)":"var(--text-secondary)"}">Tick ${o.ticksElapsed} / ${o.totalTicks}${r?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=u;const m=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:d},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=m.map(b=>`<button class="pm-tab${o.tab===b.id?" active":""}" onclick="pmSetTab('${b.id}')">
            ${b.label}${b.badge>0?`<span class="pm-tab__badge">${b.badge}</span>`:""}
        </button>`).join("");let v="";o.tab==="overview"?v=Ya(o,e,c,l,f,s,r):o.tab==="events"?v=Qa(o):o.tab==="materials"?v=Ka(o):o.tab==="equipment"&&(v=Ja(o)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${v}</div>`;let x="";d>0&&(x+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${d} EVENT${d>1?"S":""} REQUIRES RESPONSE</span>`),x+=`<span class="pm-ftr__badge" style="color:${o.quality>=70?"var(--green)":o.quality>=50?"var(--amber)":"var(--orange)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${o.quality}/100 — ${o.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${x}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function Ya(o,e,t,i,n,a,s){const r=Fe(o.awardedTick+o.totalTicks);Fe(o.awardedTick+o.totalTicks);const l=Fe(o.awardedTick),c=[{label:"Budget",value:ue(o.budget),sub:`${i}% spent`,color:t},{label:"Spent",value:ue(o.spent),color:"var(--red)"},{label:"Remaining",value:ue(n),color:"var(--green)"},{label:"Quality",value:`${o.quality}/100`,sub:o.qualityLabel,color:o.quality>=70?"var(--green)":o.quality>=50?"var(--amber)":"var(--red)"},{label:"Workforce",value:`${o.laborCount}/${o.wfNeeded}`,sub:`Bid: ${o.laborCount}`,color:o.laborCount<o.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${a} ticks`,sub:s?"OVERDUE":`Deadline: ${r}`,color:s?"var(--red)":"var(--text-bright)"}];let f="";f+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${g(e.description||e.name)}</div>
    </div></div>`,f+='<div class="pm-metrics">';for(const b of c)f+=`<div class="pm-metric">
            <div class="pm-metric__label">${b.label}</div>
            <div class="pm-metric__value" style="color:${b.color}">${b.value}</div>
            ${b.sub?`<div class="pm-metric__sub">${g(b.sub)}</div>`:""}
        </div>`;f+="</div>",f+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${l}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${s?"var(--red)":"var(--text-bright)"};font-weight:700">${r}</span></span>
        </div>
    </div></div>`;const d=e.modifiers||[];d.length>0&&(f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Building Modifiers</div>',f+='<div style="display:flex;flex-wrap:wrap;gap:4px;">',f+=yi(d),f+="</div></div></div>");const u=Array.isArray(o.permitRequirements)?o.permitRequirements:[];if(u.length>0){f+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const b of u){const $=b.has_permit===!0,h=$?"HAS PERMIT":"NEEDS TO GET";f+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:${$?"var(--green)":"var(--amber)"}">${$?"✓":"!"}</span>
                    <span class="pm-permit__name">${g(b.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:${$?"var(--green)":"var(--amber)"}">${h}</span>
            </div>`}f+="</div></div>"}f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Workforce Assignment</div>';const m=[{key:"general",label:"General Workers",corpAvail:o.corpGeneral,color:"var(--text-primary)"},{key:"skilled",label:"Skilled Workers",corpAvail:o.corpSkilled,color:"var(--blue)"},{key:"innovative",label:"Innovative Workers",corpAvail:o.corpInnovative,color:"var(--purple)"}];for(const b of m){const $=Number(o.reqWf[b.key]||0);if($===0)continue;const h=Number(o.assignedWf[b.key]||0),T=h>=$?"var(--green)":h>0?"var(--amber)":"var(--red)",S=b.corpAvail>0&&h<$,w=Math.min(b.corpAvail,$-h),C=h>0;f+='<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.72rem;">',f+="<div>",f+=`<span style="color:${b.color};font-weight:600;">${b.label}</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Required: <strong>${$}</strong></span>`,f+=`<span style="color:${T};margin-left:8px;font-weight:700;">${h} assigned</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Pool: ${b.corpAvail}</span>`,f+="</div>",f+='<div style="display:flex;gap:4px;">',S&&(f+=`<button onclick="pmAssignWorkers('${b.key}',${w})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Assign ${w}</button>`),C&&(f+=`<button onclick="pmUnassignWorkers('${b.key}',${h})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Remove ${h}</button>`),f+="</div></div>"}const v=Number(o.reqWf.general||0)+Number(o.reqWf.skilled||0)+Number(o.reqWf.innovative||0),x=Number(o.assignedWf.general||0)+Number(o.assignedWf.skilled||0)+Number(o.assignedWf.innovative||0);return v>0&&x<v&&(f+='<div style="font-size:0.62rem;color:var(--red);margin-top:6px;font-family:var(--font-mono);">⚠ Project will STALL until workforce is fully assigned</div>'),f+="</div></div>",f}function Qa(o){if(o.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let e="";for(let t=0;t<o.events.length;t++){const i=o.events[t],n=o.expandedEvent===t,a=i.status==="ACTIVE",s=si[i.type]||si.WEATHER,r=ri[i.severity]||ri.LOW;if(e+=`<div class="pm-evt ${a?"pm-evt--active":"pm-evt--resolved"}" style="${a?`border-left-color:${s.color}`:""}">`,e+=`<div class="pm-evt__header" onclick="pmToggleEvent(${t})" style="${n?`background:${s.bg}`:""}">`,e+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${s.color};background:${s.bg};border:1px solid ${s.border}">${i.type}</span>
            <span class="pm-evt__sev-badge" style="color:${r}">${i.severity}</span>
            <span class="pm-evt__status" style="color:${a?"var(--red)":"var(--text-dim)"};font-weight:${a?"700":"400"}">${a?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,e+=`<div class="pm-evt__title">${g(i.title)}</div>`,e+=`<div class="pm-evt__meta">Tick ${i.tick} · ${g(i.id||"")}</div>`,n){if(e+='<div class="pm-evt__body">',e+=`<div class="pm-evt__desc">${g(i.desc)}</div>`,i.impact&&(e+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${g(i.impact)}</span>
                </div>`),a&&i.responses&&i.responses.length>0){e+='<div class="pm-evt__resp-title">Response Options</div>';for(let l=0;l<i.responses.length;l++){const c=i.responses[l],f=o.selectedResponse===l,u={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[c.tag]||"var(--text-secondary)";e+=`<div class="pm-resp${f?" selected":""}" style="${f?`border-color:${u}`:""}" onclick="event.stopPropagation();pmSelectResponse(${l})">`,e+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${g(c.label)}</span>
                            <span class="pm-resp__tag" style="color:${u};background:${u}12;border:1px solid ${u}25">${c.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${c.delay>0?"var(--orange)":"var(--green)"}">
                            ${c.delay>0?`+${c.delay} tick${c.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,e+=`<div class="pm-resp__detail">${g(c.detail)}</div>`,e+='<div class="pm-resp__costs">',c.cost&&(e+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${ue(c.cost)}</span>`),c.qualityImpact&&c.qualityImpact!==0&&(e+=`<span class="pm-resp__cost" style="color:${c.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${c.qualityImpact>0?"+":""}${c.qualityImpact}</span>`),!c.cost&&(!c.qualityImpact||c.qualityImpact===0)&&(e+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),e+="</div>",f&&(e+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${u}" onclick="event.stopPropagation();confirmEventResponse('${i.id}','${c.key}')">CONFIRM</button>
                        </div>`),e+="</div>"}}!a&&i.resolution&&(e+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${g(i.resolution)}</div>
                </div>`),e+="</div>"}e+="</div></div>"}return e}function Ka(o){if(o.materials.length===0)return'<div class="pm-evt-empty">No materials required for this project.</div>';let e='<div class="pm-tab-header">Project Materials</div>';for(const t of o.materials){const i=t.required>0?Math.round(t.allocated/t.required*100):0;t.allocated>0&&Math.round(t.consumed/t.allocated*100);const n=t.allocated>=t.required,a=n?"var(--green)":t.allocated>0?"var(--amber)":"var(--red)",s=n?"FULLY ALLOCATED":t.allocated>0?"PARTIAL":"NONE ALLOCATED";e+='<div class="pm-mat" style="margin-bottom:14px;">',e+=`<div class="pm-mat__row1">
            <div class="pm-mat__left">
                <span class="pm-mat__name">${g(t.name)}</span>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:${a};">${t.allocated} / ${t.required} allocated · ${s}</span>
        </div>`,e+=`<div class="pm-mat__bar-row">
            <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${i}%;background:${a};"></div></div>
            <span class="pm-mat__pct">${t.consumed} consumed</span>
        </div>`;const r=["STD","LOW","HIGH"],l=t.required-t.allocated;for(const c of r){const f=t.warehouseStock[c]||{qty:0},d=t.tiers[c]||{qty:0,consumed:0},u=d.qty-d.consumed;if(f.qty===0&&d.qty===0)continue;const m=c==="HIGH"?"var(--green)":c==="LOW"?"var(--orange)":"var(--text-muted)",v=c==="HIGH"?"HIGH":c==="LOW"?"LOW":"STD";if(e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.7rem;">',e+='<div style="display:flex;align-items:center;gap:6px;">',e+=`<span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${m};width:32px;">${v}</span>`,e+=`<span style="color:var(--text-dim);">Warehouse: <strong style="color:var(--text-primary);">${f.qty}</strong></span>`,d.qty>0&&(e+=`<span style="color:var(--text-dim);margin-left:8px;">Allocated: <strong style="color:var(--text-primary);">${d.qty}</strong></span>`),e+="</div>",e+='<div style="display:flex;gap:4px;">',f.qty>0&&l>0){const x=Math.min(f.qty,l);e+=`<button class="pm-alloc-btn" onclick="pmAllocateMaterial('${t.key}','${c}',${x})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Allocate ${x}</button>`}u>0&&(e+=`<button class="pm-alloc-btn" onclick="pmDeallocateMaterial('${t.key}','${c}',${u})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Return ${u}</button>`),e+="</div></div>"}e+="</div>"}return e}function Ja(o){if(o.equipment.length===0)return'<div class="pm-evt-empty">No equipment required for this project.</div>';let e='<div class="pm-tab-header">Project Equipment</div>';for(const t of o.equipment){const i=t.condition>=75?"var(--green)":t.condition>=50?"var(--amber)":t.condition>=25?"var(--orange)":"var(--red)",n=t.assignedToProject>=t.required,a=t.assignedToProject>0&&t.assignedToProject<t.required,s=n?"var(--green)":a||t.ownedTotal>0?"var(--amber)":"var(--red)",r=n?`${t.assignedToProject}/${t.required} DEPLOYED`:a?`${t.assignedToProject}/${t.required} PARTIAL`:t.ownedTotal>0?"NOT DEPLOYED":"NOT OWNED";e+=`<div class="pm-eq" style="margin-bottom:12px;">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${g(t.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${s};margin-left:8px;">${r}</span>
                </div>
            </div>`,t.assignedToProject>0&&(e+=`<div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${t.condition}%;background:${i}"></div></div>
                <span class="pm-eq__cond-val" style="color:${i}">${t.condition}%</span>
            </div>`);const l=Math.min(t.available,t.required-t.assignedToProject);e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:0.7rem;">',e+=`<span style="color:var(--text-dim);">Required: <strong style="color:${n?"var(--green)":"var(--red)"}">${t.required}</strong>`,e+=` · Owned: <strong style="color:var(--text-primary);">${t.ownedTotal}</strong>`,e+=` · Available: <strong style="color:var(--text-primary);">${t.available}</strong></span>`,e+='<div style="display:flex;gap:4px;">',l>0&&(e+=`<button onclick="pmDeployEquipment('${t.key}',${l})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Deploy ${l}</button>`),t.assignedToProject>0&&(e+=`<button onclick="pmUndeployEquipment('${t.key}')" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Undeploy</button>`),e+="</div></div>",e+="</div>"}return e}function Fe(o){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][o%12]}, ${2e3+Math.floor(o/12)}`}async function Xa(o,e){if(!p||!z)return;const t=prompt(`REQUEST CONSTRUCTION INSURANCE
`+"─".repeat(35)+`

Describe what this policy should cover:

e.g., "Full coverage for weather delays, material damage, and labor disputes during construction. Should cover cost overruns up to 20% of budget."

Insurance corps will see this in their Deal Flow.`);if(t===null)return;const i=t.trim()||"Construction Insurance",n=z.current_tick||0,{error:a}=await y.from("finance_loan_requests").insert({requesting_faction_id:p.id,nation_id:p.nation_id,request_type:"insurance",insured_contract_id:o,amount:e,term_months:0,purpose:i,status:"open",created_tick:n,expires_tick:n+12});if(a){a.message.includes("duplicate")||a.message.includes("unique")?alert("Insurance already requested for this project."):alert("Failed to request insurance: "+a.message);return}alert("Insurance request posted to Deal Flow. Insurance corporations can now offer coverage."),await zn()}window.requestInsurance=Xa;window.openProjectModal=nt;window.closeProjectModal=Ha;window.pmSetTab=Ga;window.pmToggleEvent=Va;window.pmSelectResponse=Wa;window.pmAllocateMaterial=Ba;window.pmDeallocateMaterial=Pa;window.pmDeployEquipment=Fa;window.pmUndeployEquipment=Ua;window.pmAssignWorkers=Da;window.pmUnassignWorkers=ja;async function hi(o){if(!q)return;const{data:e,error:t}=await y.from("construction_events").select("*").eq("contract_id",o).order("fired_at_tick",{ascending:!1});t?(console.warn("Failed to load project events:",t.message),q.events=[]):q.events=(e||[]).map(i=>({id:i.id,type:i.type,severity:i.severity,tick:i.fired_at_tick,title:i.title,desc:i.description,impact:i.impact,status:i.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:i.resolution,responses:i.responses||[]})),Xe()}let Ho=!1;async function Za(o,e){if(!(Ho||!q)){Ho=!0;try{const{data:t,error:i}=await y.rpc("resolve_construction_event",{p_event_id:o,p_response_key:e});if(i){console.error("Failed to resolve event:",i.message),alert("Failed to submit response: "+i.message);return}const n=typeof t=="string"?JSON.parse(t):t;if(n?.error){alert("Error: "+n.error);return}await hi(q.project.id),await zn(),n?.quality_applied&&n.quality_applied!==0&&(q.quality=Math.max(0,Math.min(100,q.quality+n.quality_applied)),q.qualityLabel=q.quality>=80?"STRONG":q.quality>=60?"PROMISING":q.quality>=40?"FAIR":"UNCERTAIN"),Xe()}finally{Ho=!1}}}window.confirmEventResponse=Za;function qe(o,e,t){const i=t?` style="color:${t}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${g(o)}</span>
        <span class="cd-detail-row__value"${i}>${g(e)}</span>
    </div>`}function es(o){const e={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},t=o.drawing_number||o.contract_number+"-A1",i=z?.current_date||"",n=i?i.replace(/,\s*/," "):"",a=o.spec_category==="Heavy Infrastructure",s=o.spec_category==="Megaproject";let r=g(o.project_subtype||o.project_type||"STRUCTURE"),l=a?"80.0m":s?"200.0m":"60.0m",c=a?"40.0m":s?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${e.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(f,d)=>`<line x1="${d*20}" y1="0" x2="${d*20}" y2="200" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(f,d)=>`<line x1="0" y1="${d*20}" x2="680" y2="${d*20}" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${e.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${e.accent}" font-family="var(--font-mono)" font-weight="700">${r.toUpperCase()}</text>
        <text x="340" y="100" text-anchor="middle" font-size="6" fill="${e.text}" font-family="var(--font-mono)">${g(o.name)}</text>

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
        <text x="540" y="175" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${g(t)}</text>
        <text x="500" y="185" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">SCALE</text>
        <text x="540" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">1:200</text>
        <text x="610" y="175" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">REV</text>
        <text x="630" y="175" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">01</text>
        <text x="610" y="185" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">DATE</text>
        <text x="630" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${g(n)}</text>

        <!-- North arrow -->
        <g transform="translate(470,172)">
            <line x1="0" y1="12" x2="0" y2="0" stroke="${e.accent}" stroke-width="0.8"/>
            <polygon points="-3,4 0,0 3,4" fill="${e.accent}"/>
            <text x="0" y="-3" text-anchor="middle" font-size="5" fill="${e.text}" font-family="var(--font-mono)">N</text>
        </g>
    </svg>`}async function Ne(){if(!p||!p.nation_id)return;const{data:o,error:e}=await y.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(e)console.warn("Failed to load contracts:",e.message),lt=[];else{const t=Number(p.corp_reputation??0);lt=(o||[]).filter(i=>t>=(i.min_reputation||0))}if(kt={},p&&lt.length>0){const t=lt.map(n=>n.id),{data:i}=await y.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",p.id).in("contract_id",t);for(const n of i||[])kt[n.contract_id]=n}bi()}function ts(){const o=document.getElementById("ap-list"),e=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=J.length+" ACTIVE",J.length===0){o.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,e.style.display="none";return}const t=z?.current_tick||0;let i=0,n=0,a="";for(const s of J){const r=s.issuer_type==="GOVERNMENT",l=r?"gov":"private",c=Array.isArray(s.contract_bids)?s.contract_bids[0]:s.contract_bids,f=c?.bid_price||0,d=c?.estimated_cost||0,u=c?.estimated_quality||0,m=s.budget_ceiling||0,v=s.awarded_at_tick||t,x=s.stalled_ticks||0,b=Math.max(0,t-v),$=Math.max(0,b-x),h=s.timeline_ticks||8,E=Math.max(0,h-$),T=Math.min(100,Math.round($/h*100)),S=$>h,w=x>0;let C="";if(w){const k=s.required_workforce||{},N=s.workers_assigned||{},R=[];(Number(N.general)||0)<(Number(k.general)||0)&&R.push("General: "+(Number(N.general)||0)+"/"+(Number(k.general)||0)),(Number(N.skilled)||0)<(Number(k.skilled)||0)&&R.push("Skilled: "+(Number(N.skilled)||0)+"/"+(Number(k.skilled)||0)),(Number(N.innovative)||0)<(Number(k.innovative)||0)&&R.push("Innovative: "+(Number(N.innovative)||0)+"/"+(Number(k.innovative)||0)),R.length>0?C="Workers needed — "+R.join(", "):C="Materials needed — allocate from warehouse"}gi(s.sector);const M=Sn(s.sector);i+=m,n+=f,a+=`<div class="ap-item" onclick="openProjectModal('${s.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${g(s.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${g(s.issuer_name||"—")} · ${M}</div>
                </div>
                <span class="oc-item__type-badge ${l}">${r?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS${w?' <span style="color:var(--orange);font-weight:700;font-size:7px;">⚠ STALLED ('+x+" ticks) — "+g(C)+"</span>":""}</span>
                    <span class="ap-budget__values" style="color:${S?"var(--red)":w?"var(--orange)":"var(--teal)"}">
                        ${$}/${h} ticks ${S?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${T}%;background:${S?"var(--red)":w?"var(--orange)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${ue(f)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${ue(d)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${u>=70?"var(--green)":u>=40?"var(--teal)":"var(--orange)"}">${u}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${S?"var(--red)":"var(--text-bright)"}">${E} ticks</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">INSURANCE</div>
                    ${s._hasInsurance?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--green);">INSURED</div>':s._insurancePending?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--orange);">PENDING</div>':`<div class="ap-detail-cell__value" style="font-size:8px;cursor:pointer;color:#aa7a5a;font-weight:700;text-decoration:underline;" onclick="event.stopPropagation();requestInsurance('${s.id}',${m})">INSURE</div>`}
                </div>
            </div>
        </div>`}o.innerHTML=a,e.style.display=J.length>0?"":"none",J.length>0&&(document.getElementById("ap-total-crew").textContent=J.length,document.getElementById("ap-total-budget").textContent=ue(i),document.getElementById("ap-total-spent").textContent=ue(n))}async function zn(){if(!p)return;const{data:o,error:e}=await y.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",p.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",p.id).order("awarded_at_tick",{ascending:!0});if(e?(console.warn("Failed to load active projects:",e.message),J=[]):J=o||[],J.length>0){const t=J.map(r=>r.id),{data:i}=await y.from("finance_loan_requests").select("insured_contract_id, status").eq("request_type","insurance").in("insured_contract_id",t),{data:n}=await y.from("finance_active_loans").select("request_id, finance_loan_requests!inner(insured_contract_id)").in("status",["current"]).eq("finance_loan_requests.request_type","insurance"),a=new Set((n||[]).map(r=>r.finance_loan_requests?.insured_contract_id).filter(Boolean)),s=new Set((i||[]).filter(r=>r.status==="open").map(r=>r.insured_contract_id));for(const r of J)r._hasInsurance=a.has(r.id),r._insurancePending=s.has(r.id)}ts()}const zo=3e4;function Io(){let o=0,e=0;for(const t of jt)for(const i of En){const n=ee[t.key]?.[i];n&&(o+=n.qty,e+=n.value)}return{totalUnits:o,totalValue:e}}function In(){const o=document.getElementById("wh-list"),{totalUnits:e,totalValue:t}=Io();document.getElementById("wh-count").textContent=e.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=j(t);const i=Math.round(e/zo*100),n=document.getElementById("wh-capacity");n.textContent=i+"%",n.style.color=i>80?"var(--red)":i>50?"var(--orange)":"var(--green)";let a="";for(let s=0;s<jt.length;s++){const r=jt[s],l=mn===s,c=ee[r.key]?.LOW||{qty:0,value:0},f=ee[r.key]?.STD||{qty:0,value:0},d=ee[r.key]?.HIGH||{qty:0,value:0},u=c.qty+f.qty+d.qty,m=c.value+f.value+d.value,v=u===0,x=be(r.key,"LOW",I),b=be(r.key,"STD",I),$=be(r.key,"HIGH",I),h=c.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",E=f.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",T=$.available?d.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(a+='<div class="wh-row">',a+=`<div class="wh-row__collapsed${l?" expanded":""}" onclick="toggleWhRow(${s})">
            <span class="wh-row__arrow">${l?"▾":"▸"}</span>
            <span class="wh-row__name${v?" empty":""}">${g(r.name)}</span>
            <div class="wh-row__dots">
                <div class="${h}"></div>
                <div class="${E}"></div>
                <div class="${T}"></div>
            </div>
            <span class="wh-row__qty${v?" empty":""}">${u>0?u.toLocaleString():"—"}</span>
            <span class="wh-row__val${v?" empty":""}">${m>0?j(m):"—"}</span>
        </div>`,l){a+='<div class="wh-expand">',a+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const S=[{key:"LOW",label:"Low",data:c,avail:x,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:f,avail:b,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:d,avail:$,color:"var(--green)",dotClass:"wh-dot--high"}];for(const w of S){const C=!w.avail.available,M=w.data.qty>0,k=M?"$"+Math.round(w.data.value/w.data.qty):"—";a+=`<div class="wh-grade${C?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${w.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${C?"var(--red)":w.color}">${w.label}</span>
                        ${C?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${M?"var(--text-bright)":"var(--text-dim)"}">${M?w.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${w.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${w.data.value>0?j(w.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${k}</span>
                </div>`}for(const w of S)!w.avail.available&&w.avail.failedStat&&(a+=`<div class="wh-lock">
                        <span class="wh-lock__text">${w.label.toUpperCase()} GRADE LOCKED — ${g(w.avail.failedStat)} &lt; ${w.avail.failedMin}</span>
                    </div>`);a+="</div>"}a+="</div>"}o.innerHTML=a}function os(o){mn=mn===o?-1:o,In()}async function Nn(){if(!p)return;const{data:o,error:e}=await y.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",p.id);ee={};const t=[];if(e)console.warn("Failed to load warehouse:",e.message);else if(o){for(const i of o){const n=vo(i.material_key);ee[n]||(ee[n]={}),ee[n][i.quality_tier]={qty:i.quantity||0,value:Number(i.total_value)||0},n!==i.material_key&&t.push(i)}if(t.length>0){const i=t.map(n=>({faction_id:p.id,nation_id:p.nation_id,material_key:vo(n.material_key),quality_tier:n.quality_tier,quantity:n.quantity||0,total_value:Number(n.total_value)||0,updated_at:new Date().toISOString()}));await y.from("corp_warehouse").upsert(i,{onConflict:"faction_id,material_key,quality_tier"});for(const n of t)await y.from("corp_warehouse").delete().eq("faction_id",p.id).eq("material_key",n.material_key).eq("quality_tier",n.quality_tier)}}In()}const ns={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function An(){const e=(ot()?.name||I?.name||p?.nation||"—").toUpperCase(),t=!!(ut&&I&&ut.id!==I.id);document.getElementById("pr-nation-badge").textContent=(t?"IMPORT — ":"LOCAL — ")+e;const i=document.getElementById("pr-nation-select");if(i&&i.options.length===0){const l=I?.name||p?.nation||"—";let c=`<option value="">${g(l)} (HQ)</option>`;for(const f of Et)f.id!==I?.id&&(c+=`<option value="${f.id}">${g(f.name)}</option>`);i.innerHTML=c}i&&(i.value=ut?.id||"");const n=Number(p?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=j(n);const{totalUnits:a}=Io(),s=Math.round(a/zo*100),r=document.getElementById("pr-wh-capacity");r.textContent=s+"%",r.style.color=s>80?"var(--red)":s>50?"var(--orange)":"var(--green)",$i(),Mn(),No()}function $i(){const o=ot(),e=document.getElementById("pr-mat-grid");let t="";for(const i of jt){const n=oe===i.key,a=En.every(r=>!be(i.key,r,o).available),s="pr-mat-btn"+(n?" active":"")+(a?" all-locked":"");t+=`<span class="${s}" onclick="setPrMat('${i.key}')">${g(i.name)}</span>`}e.innerHTML=t}function Mn(){const o=ot(),e=document.getElementById("pr-tier-bar");let t='<span class="pr-tier-label">GRADE</span>';for(const i of En){const n=be(oe,i,o),a=W===i,s=n.available?Cn(oe,i,o):null,r=ui[i],l=!n.available,c="pr-tier-btn"+(a?" active":"")+(l?" locked":"");t+=`<div class="${c}" onclick="${l?"":`setPrTier('${i}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${r};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${a?"var(--text-bright)":"var(--text-dim)"}">${pn[i]}</span>
            </div>
            ${s!==null?`<div class="pr-tier-btn__price" style="color:${a?"var(--text-bright)":"var(--text-muted)"}">$${s}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}e.innerHTML=t}function No(){const o=ot(),e=document.getElementById("pr-content"),t=be(oe,W,o),i=jt.find(w=>w.key===oe);if(!i)return;if(!t.available){e.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${g(i.name)} — ${pn[W]} grade
                    is not produced domestically in ${g(o?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${g(t.failedStat||"unknown")} &lt; ${t.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const n=Cn(oe,W,o),a=mi(oe,W,o),s=n*xe,r=a>3e3?"LOW":a>1e3?"MODERATE":"HIGH",l=r==="LOW"?"var(--green)":r==="MODERATE"?"var(--amber)":"var(--red)",c=Number(o?.inflation??50),f=c>55?"up":c<45?"down":"flat",d=f==="up"?"&#9650;":f==="down"?"&#9660;":"&#8212;",u=f==="up"?"var(--red)":f==="down"?"var(--green)":"var(--text-dim)";let m="";m+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${n}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${u}">${d}</span>
                </div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">SUPPLY/TICK</div>
                <div class="pr-market-cell__value" style="font-size:14px;color:var(--text-bright);margin-top:2px;">${a.toLocaleString()}</div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">DEMAND</div>
                <div class="pr-market-cell__value" style="font-size:12px;color:${l};margin-top:2px;">${r}</div>
            </div>
        </div>
    </div>`,m+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${g(o?.name||"—")})</div>`;for(const w of i.priceDrivers){const C=Number(o?.[w]??50),M=C>=50?"var(--green)":C>=30?"var(--amber)":C>=15?"var(--orange)":"var(--red)",k=ns[w]||w;m+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${g(w)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${C}%;background:${M}"></div>
            </div>
            <span class="pr-driver-row__val">${C}</span>
            <span class="pr-driver-row__effect">${g(k)}</span>
        </div>`}m+="</div>";const x=(Number(p?.corp_cash_reserves)||0)>=s,b=xe>a,{totalUnits:$}=Io(),h=zo-$,E=xe>h,T=h<=0,S=ui[W];m+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${g(i.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${S};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${S}">${pn[W]}</span>
                </div>
                <span class="pr-order__mat-price">$${n}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(w=>`<span class="pr-qty-btn${xe===w?" active":""}" onclick="setPrQty(${w})">${w>=1e3?w/1e3+"k":w}</span>`).join("")}
                </div>
            </div>
            ${b?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${a.toLocaleString()} this tick</span>
            </div>`:""}
            ${T?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">WAREHOUSE FULL — no remaining capacity</span>
            </div>`:E?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS WAREHOUSE CAPACITY — ${h.toLocaleString()} units remaining</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${j(s)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${x&&!b&&!E&&!T?"":"disabled"}
                    title="${x?b?"Exceeds supply":T?"Warehouse full":E?"Exceeds warehouse capacity":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,e.innerHTML=m}function is(o){const e=ot();oe=o,W="STD";for(const t of["STD","HIGH","LOW"])if(be(o,t,e).available){W=t;break}$i(),Mn(),No()}function as(o){W=o,Mn(),No()}function ss(o){xe=o,No()}let Go=!1;async function rs(o){if(!o)ut=null;else{let i=Et.find(n=>n.id===o);if(!i)try{const{data:n}=await y.from("nations").select("*").eq("id",o).single();i=n}catch{}ut=i||null}const e=ot();if(!be(oe,W,e).available){W="STD";for(const i of["STD","HIGH","LOW"])if(be(oe,i,e).available){W=i;break}}const t=document.getElementById("pr-nation-select");t&&(t.value=o||""),An()}async function ls(){if(Go||!p||!I)return;const o=ot(),e=Cn(oe,W,o),t=mi(oe,W,o),i=e*xe,n=Number(p.corp_cash_reserves)||0;if(i>n){alert("Insufficient cash reserves.");return}if(xe>t){alert("Exceeds available supply this tick.");return}const{totalUnits:a}=Io(),s=zo-a;if(s<=0){alert("Warehouse is full. Cannot purchase more materials.");return}if(xe>s){alert(`Warehouse can only hold ${s.toLocaleString()} more units. Reduce quantity.`);return}Go=!0;const r=document.querySelector(".pr-purchase-btn");r&&(r.disabled=!0,r.textContent="...");try{const l=n-i,{error:c}=await y.from("factions").update({corp_cash_reserves:l}).eq("id",p.id);if(c)throw c;const f=vo(oe),d=ee[f]?.[W],u=(d?.qty||0)+xe,m=(d?.value||0)+i,{error:v}=await y.from("corp_warehouse").upsert({faction_id:p.id,nation_id:p.nation_id,material_key:f,quality_tier:W,quantity:u,total_value:m,last_purchased_tick:z?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(v){const{error:b}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",p.id);throw b&&console.error("Cash refund failed after warehouse error:",b.message),v}p.corp_cash_reserves=l,ee[f]||(ee[f]={}),ee[f][W]={qty:u,value:m};const x=Math.floor(i/1e6);if(x>=1&&o?.id){const b=x*.01,{data:$,error:h}=await y.from("nations").select("gdp_growth").eq("id",o.id).single();if(!h&&$){const E=Math.min(100,Math.round((Number($.gdp_growth??50)+b)*100)/100);await y.from("nations").update({gdp_growth:E}).eq("id",o.id),I?.id===o.id&&(I.gdp_growth=E)}}In(),An(),r&&(r.textContent="PURCHASED",setTimeout(()=>{r.isConnected&&(r.disabled=!1,r.textContent="PURCHASE")},1500))}catch(l){r&&(r.disabled=!1,r.textContent="PURCHASE"),alert("Purchase failed: "+(l.message||"Unknown error"))}finally{Go=!1}}function wi(o){const e=Ye||I;if(!e)return[];const t=So(o);if(!t)return[];const i=Ta(o,e),n=[],a=Number(e?.inflation??50),s=Number(e?.fuel_prices??50);Number(e?.manufacturing_output??50);const r=Ye&&I&&Ye.id!==I.id;let l=null;if(r&&(l=Sa(e,I)),i.newAvailable>0){const c=ii(o,e),f=t.basePrice,d=Math.round(f*((a-50)/200)),u=Math.round(f*((s-50)/300));let m=c;const v=[{label:"Base price",value:j(f)},d!==0?{label:`Inflation (${a})`,mod:(d>=0?"+":"")+j(Math.abs(d))}:null,u!==0?{label:`Fuel transport (${s})`,mod:(u>=0?"+":"")+j(Math.abs(u))}:null].filter(Boolean),x=c-f-d-u;if(x!==0&&!r&&v.push({label:"Demand/scarcity",mod:(x>=0?"+":"")+j(Math.abs(x))}),r&&l){const b=Math.round(c*l.tariff),$=Math.round(c*l.transport);m=c+b+$,v.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+j(b)}),v.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+j($)})}n.push({seller:r?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:r?l?.deliveryTicks||1:0,condition:100,price:Math.round(m),available:i.newAvailable,delivery:r?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:r?l.deliveryTicks:0,used:!1,priceFactors:v,sourceNationId:e.id})}if(i.usedAvailable>0){const c=i.usedCondition,f=ii(o,e,{used:!0,condition:c});let d=f;const u=[{label:"Base price",value:j(t.basePrice)},{label:`Condition (${c}%)`,mod:"-"+j(Math.max(0,t.basePrice-f))}];if(r&&l){const m=Math.round(f*l.tariff),v=Math.round(f*l.transport);d=f+m+v,u.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+j(m)}),u.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+j(v)})}n.push({seller:r?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:r?l?.deliveryTicks||1:0,condition:c,price:Math.round(d),available:i.usedAvailable,delivery:r?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:r?l.deliveryTicks:0,used:!0,priceFactors:u,sourceNationId:e.id})}return n}function Ao(){const o=Number(p?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=j(o);const e=So(me),t=Ft[e?.tier||1],i=document.getElementById("em-tier-badge");i&&(i.textContent=t.tag,i.style.color=t.color),i.style.background=t.color+"0a",i.style.border="1px solid "+t.color+"33";const n=document.getElementById("em-nation-select");if(n&&n.options.length===0){const r=I?.name||p?.nation||"—";let l=`<option value="">${g(r)} (HQ)</option>`;for(const c of Et)c.id!==I?.id&&(l+=`<option value="${c.id}">${g(c.name)}</option>`);n.innerHTML=l}const a=document.getElementById("em-import-tag"),s=Ye&&I&&Ye.id!==I.id;a&&(a.style.display=s?"":"none"),cs(),Rn()}function cs(){let o="";for(let e=1;e<=3;e++){const t=Ft[e],i=fn(e),n=e===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";o+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${t.color}">${t.tag}</div>
            <div class="${n}">`;for(const a of i){const s=me===a.key,r=wi(a.key).length>0;o+=`<span class="em-selector__btn${s?" active":""}${r?"":" no-listings"}"
                style="${s?"background:"+t.color+";border-color:"+t.color:""}"
                onclick="setEmType('${a.key}')">${g(a.name)}</span>`}o+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${o}</div>`}function Rn(){const o=document.getElementById("em-content");if(Oe=wi(me),Oe.length===0){o.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}Ee>=Oe.length&&(Ee=0);let e="";for(let i=0;i<Oe.length;i++){const n=Oe[i],a=Ee===i,s=n.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",r=vi(n.condition);e+=`<div class="em-listing${a?" selected":""}" style="${a?"border-left-color:"+s:""}" onclick="setEmListing(${i})">`,e+=`<div class="em-listing__row1">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="em-listing__seller">${g(n.seller)}</span>
                <span class="em-badge em-badge--${n.sellerType.toLowerCase()}">${n.sellerType}</span>
                ${n.used?'<span class="em-badge em-badge--used">USED</span>':""}
            </div>
        </div>`,e+=`<div class="em-listing__row2">
            <span class="em-listing__nation">${g((n.nation||"").toUpperCase())}</span>
            ${n.distance>0?`<span class="em-listing__distance">${n.distance} nation${n.distance>1?"s":""} away</span>`:""}
            <span class="em-listing__delivery">Delivery: ${g(n.delivery)}</span>
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
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${j(n.price)}</div>
            </div>
        </div>`,a&&n.priceFactors&&(e+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${n.priceFactors.map(l=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${g(l.label)}</span>
                    <span class="em-breakdown__mod" style="color:${l.mod?l.mod.startsWith("-")?"var(--green)":l.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${l.mod||l.value}</span>
                </div>`).join("")}
            </div>`),e+="</div>"}const t=Oe[Ee];if(t){const i=So(me),n=Ft[i?.tier||1],a=Math.min(t.available,4),s=t.price*Te,r=(Number(p?.corp_cash_reserves)||0)>=s;e+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${g(i?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${g(t.seller)}</span>
                </div>
                <span class="em-purchase__price">${j(t.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:a},(l,c)=>c+1).map(l=>`<span class="em-qty-btn${Te===l?" active":""}" style="${Te===l?"background:"+n.color+";border-color:"+n.color:""}" onclick="setEmQty(${l})">${l}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${t.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${j(s)}</div>
                    ${t.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${g(t.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${n.color}" onclick="purchaseEquipment()"
                    ${r?"":"disabled"}
                    title="${r?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}o.innerHTML=e}async function ds(o){if(!o)Ye=null;else{let t=Et.find(i=>i.id===o);if(!t)try{const{data:i}=await y.from("nations").select("*").eq("id",o).single();t=i}catch{}Ye=t||null}Ee=0,Te=1;const e=document.getElementById("em-nation-select");e&&(e.value=o||""),Ao()}function ps(o){me=o,Ee=0,Te=1,Ao()}function fs(o){Ee=o,Te=1,Rn()}function ms(o){Te=o,Rn()}let Vo=!1;async function us(){if(Vo)return;const o=Oe[Ee];if(!o||!p)return;const e=So(me);if(!e)return;const t=Te,i=o.price*t,n=Number(p.corp_cash_reserves)||0;if(i>n){alert("Insufficient cash reserves.");return}if(t>o.available){alert("Not enough units available.");return}const a=document.querySelector(".em-purchase-btn");a&&(a.disabled=!0,a.textContent="..."),Vo=!0;try{const s=n-i,{error:r}=await y.from("factions").update({corp_cash_reserves:s}).eq("id",p.id);if(r)throw r;const l=!o.deliveryTicks||o.deliveryTicks===0;if(l){const f=re.find(E=>E.equipment_key===me),d=(f?.owned||0)+t,u=f?.purchase_price_avg||0,m=f?.owned||0,v=m>0?Math.round((u*m+o.price*t)/d):o.price,x=e.maintenancePerUnit*d,b=f?.condition||100,$=Math.round((b*m+o.condition*t)/d),{error:h}=await y.from("corp_equipment").upsert({faction_id:p.id,nation_id:p.nation_id,equipment_key:me,tier:e.tier,owned:d,deployed:f?.deployed||0,condition:$,maintenance_per_tick:x,purchase_price_avg:v,last_purchased_tick:z?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(h){const{error:E}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",p.id);throw E&&console.error("Cash refund failed:",E.message),h}f?(f.owned=d,f.condition=$,f.maintenance_per_tick=x):re.push({equipment_key:me,tier:e.tier,owned:d,deployed:0,condition:$,maintenance_per_tick:x,assigned_projects:[]})}else{const f=(z?.current_tick||0)+o.deliveryTicks,{error:d}=await y.from("corp_equipment_deliveries").insert({faction_id:p.id,equipment_key:me,quantity:t,condition:o.condition,delivery_tick:f,source_nation_id:o.sourceNationId||null,seller_name:o.seller,price_paid:i});if(d){const{error:u}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",p.id);throw u&&console.error("Cash refund failed:",u.message),d}}p.corp_cash_reserves=s,jn(),Ao();const c=document.getElementById("pr-cash");c&&(c.textContent=j(s)),a&&(a.textContent=l?"PURCHASED":"ORDERED",setTimeout(()=>{a.isConnected&&(a.disabled=!1,a.textContent="PURCHASE")},1500))}catch(s){a&&(a.disabled=!1,a.textContent="PURCHASE"),alert("Purchase failed: "+(s.message||"Unknown error"))}finally{Vo=!1}}let vs=-1,ct=[],bo=[],xn=[];function Wo(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o.toLocaleString()}function ys(o,e,t){if(t)return"var(--orange)";const i=o/(e||1)*100;return i>50?"var(--green)":i>25?"var(--amber)":"var(--red)"}function li(){const o=document.getElementById("pm-list"),e=ct.length,t=bo.length,i=xn.length,n=ct.filter(l=>l.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${e})`,document.getElementById("pm-pending-count").textContent=`(${t})`,document.getElementById("pm-apply-count").textContent=`(${i})`;const a=document.getElementById("pm-badges");let s="";n>0&&(s+=`<span class="pm-badge pm-badge--expiring">${n} EXPIRING</span>`),t>0&&(s+=`<span class="pm-badge pm-badge--pending">${t} PENDING</span>`),a.innerHTML=s;const r=ct.reduce((l,c)=>l+(c.cost||0),0)+bo.reduce((l,c)=>l+(c.cost||0),0);document.getElementById("pm-total-cost").textContent=Wo(r),document.getElementById("pm-footer-active").textContent=e,document.getElementById("pm-footer-pending").textContent=t;{if(e===0){o.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let l="";ct.forEach((c,f)=>{const d=vs===f,u=ys(c.ticks_left,c.total_ticks,c.expiring_soon),m=Math.min(c.ticks_left/(c.total_ticks||1)*100,100);l+=`<div class="pm-item ${c.expiring_soon?"pm-item--expiring":""} ${d?"expanded":""}" onclick="togglePmExpand(${f})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${g(c.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${g((c.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${u}">Expires: ${g(c.expires||"")}</span>
                        <span class="pm-item__ticks">(${c.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${m}%;background:${u}"></div></div>`,d&&(l+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${g(c.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${g(c.issued||"")}</span>
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
                        <div class="pm-projects__list">${(c.projects||[]).map(v=>`<span class="pm-project-chip">${g(v)}</span>`).join("")}</div>
                    </div>`,c.note&&(l+=`<div class="pm-note"><span class="pm-note__text">${g(c.note)}</span></div>`),c.expiring_soon&&c.renewable&&(l+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew" onclick="event.stopPropagation(); pmApplyForPermit('${c.permit_key}');">RENEW — ${Wo(c.cost||0)}</button></div>`),l+="</div>"),l+="</div></div>"}),o.innerHTML=l;return}}let Yo=!1;async function gs(o){if(!(Yo||!p||!I)){Yo=!0;try{const{data:e}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{data:i,error:n}=await y.rpc("apply_for_permit",{p_faction_id:p.id,p_nation_id:I.id,p_permit_key:o,p_current_tick:t});if(n){alert("Application failed: "+n.message);return}if(i&&!i.success){alert(i.error||"Application failed");return}alert("Permit application submitted! Processing: "+(i.processing_ticks||0)+" ticks."),await ki()}catch(e){alert("Error: "+e.message)}finally{Yo=!1}}}window.pmApplyForPermit=gs;async function ki(){if(!p||!I){ct=[],bo=[],xn=[],li();return}const{data:o}=await y.from("construction_permits").select("*"),e=o||[],t={};for(const d of e)t[d.permit_key]=d;const{data:i}=await y.from("corp_permits").select("*").eq("faction_id",p.id).eq("nation_id",I.id),n=i||[],{data:a}=await y.from("active_laws").select("policy_id, policies(permit_key, policy_name)").eq("nation_id",I.id).not("policies.permit_key","is",null),s=new Set,r={};for(const d of a||[])d.policies?.permit_key&&(s.add(d.policies.permit_key),r[d.policies.permit_key]=d.policies.policy_name);const{data:l}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),c=l?.current_tick||0;ct=n.filter(d=>d.status==="active").map(d=>{const u=t[d.permit_key]||{},m=d.expires_at_tick?Math.max(0,d.expires_at_tick-c):999,v=u.duration_ticks||24;return{name:u.name||d.permit_key,permit_key:d.permit_key,nation:I.name,policy:r[d.permit_key]||"—",issued:d.granted_at_tick!=null?Fe(d.granted_at_tick):"—",expires:d.expires_at_tick?Fe(d.expires_at_tick):"Single-use",cost:d.cost_paid||0,ticks_left:m,total_ticks:v,expiring_soon:m<=3&&m>0,renewable:u.duration_ticks!=null,projects:[]}}),bo=n.filter(d=>d.status==="pending").map(d=>{const u=t[d.permit_key]||{},m=u.processing_ticks||2,v=c-d.applied_at_tick,x=Math.max(0,m-v);return{name:u.name||d.permit_key,permit_key:d.permit_key,nation:I.name,applied:Fe(d.applied_at_tick),status:"PROCESSING",processing_total:m,ticks_remaining:x,est_approval:Fe(d.applied_at_tick+m),cost:d.cost_paid||0,required_by:r[d.permit_key]||"—"}});const f=new Set(n.filter(d=>d.status==="active"||d.status==="pending").map(d=>d.permit_key));xn=[...s].filter(d=>!f.has(d)).map(d=>{const u=t[d]||{};return{name:u.name||d,permit_key:d,nation:I.name,description:u.description||"",policy:r[d]||"—",cost:u.cost_is_percentage?15e4:u.cost||0,processing_time:u.processing_ticks||2,duration:u.duration_ticks?u.duration_ticks+" ticks":"Single-use",category:u.category||"",difficulty:u.difficulty||"EASY"}}),li()}let Ue=[],xs=-1;function $e(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(2)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o.toLocaleString()}function ci(o){return o>=85?"var(--gold)":o>=60?"var(--green)":o>=40?"var(--orange)":"var(--red)"}function bs(o){return"dl-result--"+o.toLowerCase()}function di(){const o=document.getElementById("dl-list"),e=Ue.length;document.getElementById("dl-count").textContent=`${e} COMPLETED`;const t=Ue.reduce((r,l)=>{const c=l.financials||{};return r+((c.payment||0)+(c.bonus||0)-(c.penalty||0)-(c.total_cost||0))},0),i=document.getElementById("dl-lifetime-profit");i.textContent=(t>=0?"+":"")+$e(t),i.style.color=t>=0?"var(--green)":"var(--red)";const n={};Ue.forEach(r=>{n[r.result]=(n[r.result]||0)+1});const a=document.getElementById("dl-footer-results");if(a.innerHTML=Object.entries(n).map(([r,l])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[r]||"var(--text-dim)"}">${g(r)}</div>
            <div class="dl-footer__result-count">${l}</div>
        </div>`).join(""),e===0){o.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let s="";Ue.forEach((r,l)=>{const c=xs===l,f=r.financials||{},d=(f.payment||0)+(f.bonus||0)-(f.penalty||0)-(f.total_cost||0),u=d>=0,m=bs(r.result),x={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[r.result]||"var(--text-dim)",b=r.type==="GOVERNMENT";if(s+=`<div class="dl-item ${c?"expanded":""}" onclick="toggleDlExpand(${l})">
            <div class="dl-item__inner" style="border-left:2px solid ${x}">
                <div class="dl-item__row1">
                    <span class="dl-item__name">${g(r.name)}</span>
                    <span class="dl-result-badge ${m}">${g(r.result)}</span>
                </div>
                <div class="dl-item__row2">
                    <span class="dl-item__id">${g(r.id)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                    <span class="dl-item__issuer" style="color:${b?"var(--green)":"var(--gold)"}">${g(r.issuer)}</span>
                    <span class="dl-item__date">${g(r.delivered)}</span>
                </div>
                <div class="dl-summary-bar">
                    <div class="dl-summary-cell" style="flex:1;">
                        <div class="dl-summary-label">QUALITY</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span class="dl-summary-value" style="color:${ci(r.quality_score)}">${r.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${r.rep_change>0?"var(--green)":r.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${r.rep_change>0?"+":""}${r.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${u?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${u?"var(--green)":"var(--red)"};margin-top:2px;">${u?"+":""}${$e(d)}</div>
                    </div>
                </div>`,c){const $=r.inspection||{};s+='<div style="margin-top:8px;">',s+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(S=>{const w=$[S]||{score:0,issues:[]},C=ci(w.score),M=Math.min(w.score/100*100,100);s+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${g(S.charAt(0).toUpperCase()+S.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${M}%;background:${C}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${C}">${w.score}</span>
                        </div>
                    </div>
                    ${(w.issues||[]).map(k=>`<div class="dl-inspect-issue">${g(k)}</div>`).join("")}
                </div>`});const h=$.permits||{passed:!0,issues:[]};s+=`<div class="dl-permits-row ${h.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${h.passed?"var(--green)":"var(--red)"}">${h.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${(h.issues||[]).map(S=>`<div class="dl-inspect-issue dl-inspect-issue--red">${g(S)}</div>`).join("")}
            </div>`,s+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',s+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(r.materials_used||[]).forEach(S=>{const w=S.grade==="HIGH"?"var(--green)":S.grade==="STANDARD"?"var(--amber)":"var(--orange)",C=S.impact==="positive"?"▲":S.impact==="negative"?"▼":"–",M=S.impact==="positive"?"var(--green)":S.impact==="negative"?"var(--red)":"var(--text-dim)";s+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${g(S.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${w}"></div>
                    <span class="dl-mat-tag__grade" style="color:${w}">${g(S.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${M}">${C}</span>
                </div>`}),s+="</div>",s+='<div class="dl-section-label">Financial Summary</div>',s+='<div class="dl-fin-panel">',s+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${$e(f.contract_value||0)}</span></div>`,(f.bonus||0)>0&&(s+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${$e(f.bonus)}</span></div>`),(f.penalty||0)>0&&(s+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${$e(f.penalty)}</span></div>`);const E=(f.payment||0)+(f.bonus||0)-(f.penalty||0);s+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${$e(E)}</span></div>`,s+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${$e(f.total_cost||0)}</span></div>`,s+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${u?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${u?"var(--green)":"var(--red)"}">${u?"+":""}${$e(d)}</span>
            </div>`,s+="</div>";const T=r.timeline||{};s+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${T.actual||0}/${T.expected||0} ticks</span>`,T.early?s+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(T.expected||0)-(T.actual||0)} TICK${T.expected-T.actual!==1?"S":""} EARLY</span>`:!T.on_time&&T.actual>T.expected&&(s+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(T.actual||0)-(T.expected||0)} TICK${T.actual-T.expected!==1?"S":""} LATE</span>`),s+="</div>",s+="</div>"}s+="</div></div>"}),o.innerHTML=s}let yt=!1,Qo=!1;function Ei(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+Math.round(o/1e3)+"k":"$"+Math.round(o)}async function Ln(){var{data:o,error:e}=await y.from("factions").select("*").eq("id",p.id).single();if(e){console.warn("Faction refresh failed:",e.message);return}o&&(p=o);var t=document.getElementById("topbar-cash");t&&(t.textContent="CASH: "+Ei(Number(p.corp_cash_reserves??0)))}const bn={CRITICAL:"#c55",HIGH:"#5c5",MODERATE:"#ca5",LOW:"#6a6660"};let gt=[],qn=[],Ci="ready",Lt=null,_o="ALL",te=-1;const pi={COASTAL:{color:"#8b9a6b",label:"COASTAL"},INTERNATIONAL:{color:"#5a8aaa",label:"INTL"},GOVERNMENT:{color:"#c8a832",label:"GOV CONTRACT"}};function _s(o){_o=o,te=-1,document.querySelectorAll(".ar-pill").forEach(e=>{const t=e.getAttribute("data-ar-filter");e.className="ar-pill"+(t===o?" active-"+(o==="ALL"?"all":o==="COASTAL"?"coastal":o==="INTERNATIONAL"?"intl":"gov"):"")}),Pn()}function On(){return _o==="ALL"?gt:gt.filter(o=>o.scope===_o)}async function Bn(){if(!p||p.corp_sector!=="Shipping")return;const o=await wa(y,p.id,p.corp_subsector);gt=o.routes,qn=o.applications,Ci=o.state,Lt=o.error,Lt&&console.warn("Failed to load available routes:",Lt.message),te=-1,Pn()}var hs={fuel_energy:[{stat:"industrialization",label:"Industrialization"},{stat:"urbanization",label:"Urbanization"}],minerals:[{stat:"industrialization",label:"Industrialization"},{stat:"manufacturing",label:"Manufacturing"}],grains_staples:[{stat:"population_growth",label:"Population Growth"},{stat:"food_security",label:"Food Security"}],livestock_dairy:[{stat:"standard_of_living",label:"Std of Living"},{stat:"food_security",label:"Food Security"}],cash_crops:[{stat:"trade_balance",label:"Trade Balance"},{stat:"foreign_investment",label:"Foreign Investment"}],manufactured_goods:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],technology:[{stat:"technology",label:"Technology"},{stat:"higher_education",label:"Higher Education"}],fruits_vegetables:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],arms:[{stat:"military_spending",label:"Military Spending"},{stat:"stability",label:"Stability"}]};function $s(o){return hs[o]||[]}function ws(o){var e=Number(o.competition_count||0),t=o.demand_level||"",i=o.scope==="GOVERNMENT";return i?"Fixed payment. No demand risk. Vessel locked for contract duration.":e===0&&t==="CRITICAL"?"Unserved critical corridor. High volume, no competition — claim immediately.":e===0&&t==="HIGH"?"Virgin route with strong demand. First-mover advantage available.":e===0?"No competition on this route. Market share starts at 100%.":t==="CRITICAL"&&e<=2?"Underserved critical route. Demand exceeds current capacity.":t==="LOW"?"Thin route. Revenue may not justify vessel deployment.":e>=3?"Crowded route. Market share will be split "+(e+1)+" ways.":Number(o.tariff_rate||0)>15?"High tariff rate cuts into margins. Watch for trade policy changes.":null}function Pn(){const o=On();document.getElementById("ar-count").textContent=gt.length+" ROUTES";var e={COASTAL:0,INTERNATIONAL:0,GOVERNMENT:0};gt.forEach(function($){e[$.scope]!==void 0&&e[$.scope]++});var t=e.COASTAL,i=e.INTERNATIONAL,n=e.GOVERNMENT;document.getElementById("ar-footer-counts").innerHTML='<div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#8b9a6b"></div><span class="ar-footer__count-label">COASTAL</span><span class="ar-footer__count-num">'+t+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#5a8aaa"></div><span class="ar-footer__count-label">INTL</span><span class="ar-footer__count-num">'+i+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#c8a832"></div><span class="ar-footer__count-label">GOV</span><span class="ar-footer__count-num">'+n+"</span></div>";const a=document.getElementById("ar-claim-btn");a.className="ar-claim-btn"+(te>=0?" active":"");const s=document.getElementById("ar-list");if(Ci==="error"){s.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+g(Lt&&Lt.message||"Shipping routes are temporarily unavailable.")+"</div></div>";return}if(o.length===0){s.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+(gt.length===0?"No routes available.<br>Routes are generated from bilateral<br>trade each tick. Check back after<br>the next corp tick fires.":"No "+_o.toLowerCase()+" routes available.")+"</div></div>";return}let r="";for(let $=0;$<o.length;$++){const h=o[$],E=te===$,T=pi[h.scope]||pi.INTERNATIONAL,S=h.scope==="GOVERNMENT",w=h.demand_level&&bn[h.demand_level]?{color:bn[h.demand_level],label:h.demand_level}:null,C=Number(h.competition_count||0),M=C===0?"#5c5":C<=2?"#ca5":"#c84";r+='<div style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid '+(E?T.color:"transparent")+";background:"+(E?T.color+"08":"transparent")+';" onclick="arSelectRoute('+$+')"><div style="padding:8px 14px;">',r+='<div style="display:flex;align-items:center;gap:0;margin-bottom:4px;"><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+g(h.origin_port||"?")+'</span><div style="flex:1;display:flex;align-items:center;margin:0 8px;"><div style="flex:1;height:1px;background:'+T.color+'44"></div><span style="font-family:var(--font-mono);font-size:7px;color:'+T.color+';padding:0 6px">⚓</span><div style="flex:1;height:1px;background:'+T.color+'44"></div></div><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+g(h.destination_port||"?")+"</span></div>",r+='<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;"><span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+T.color+";background:"+T.color+"12;border:1px solid "+T.color+'25">'+T.label+"</span>",w&&(r+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+w.color+";background:"+w.color+"12;border:1px solid "+w.color+'25">'+w.label+" DEMAND</span>"),S&&h.gov_issuer&&(r+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">'+g(h.gov_issuer)+"</span>"),C===0&&!S&&(r+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15)">NO COMPETITION</span>');var l=qn.find(function(k){return k.route_id===h.id});if(l){var c=l.status==="approved"?"#5c5":"#c8a832",f=l.status==="approved"?"APPROVED":"APPLIED";r+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+c+";background:"+c+"12;border:1px solid "+c+'25">'+f+"</span>"}if(r+='<span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-left:auto">'+(h.transit_ticks||"?")+" tick"+((h.transit_ticks||0)!==1?"s":"")+" · "+g(h.vessel_class||"?")+"</span>",r+="</div>",r+='<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">',S?(r+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(h.gov_contract_duration||h.transit_ticks||"?")+" ticks</div></div>",r+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VESSEL</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+g(h.vessel_class||"?")+"</div></div>",r+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT VALUE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-top:1px">'+j(Number(h.gov_contract_value||h.estimated_revenue||0))+"</div></div>"):(r+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VOLUME</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);margin-top:1px">'+j(Number(h.trade_volume||0))+"</div></div>",r+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">COMP.</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+M+';margin-top:1px">'+C+"</div></div>",r+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">TRANSIT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(h.transit_ticks||"?")+" tick"+((h.transit_ticks||0)!==1?"s":"")+"</div></div>",r+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">EST. REV</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;margin-top:1px">'+j(Number(h.estimated_revenue||0))+"</div></div>"),r+="</div>",E){if(r+='<div style="margin-top:6px;">',S&&h.goods_description&&(r+='<div style="font-size:10px;color:var(--text-muted);line-height:1.5;margin-bottom:6px">'+g(h.goods_description)+"</div>"),h.trade_agreement_name&&(r+='<div style="padding:4px 8px;margin-bottom:5px;background:rgba(90,138,170,0.05);border:1px solid rgba(90,138,170,0.12)"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:var(--font-mono);font-size:7px;color:#5a8aaa;letter-spacing:0.5px">TRADE AGREEMENT</div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:1px">'+g(h.trade_agreement_name)+'</div></div><div style="text-align:right"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">TARIFF</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(Number(h.tariff_rate||0)>10?"#c84":"#5c5")+'">'+Number(h.tariff_rate||0).toFixed(1)+"%</div></div></div></div>"),r+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px">',r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VESSEL CLASS</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+g(h.vessel_class||"?")+"</span></div>",h.vessel_note&&(r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">REQUIREMENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+g(h.vessel_note)+"</span></div>"),r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">PROXIMITY</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+(h.proximity!=null?h.proximity:"?")+" / 100</span></div>",r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CARGO</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+g(h.goods_name||"Unknown")+"</span></div>",h.goods_description&&!S&&(r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CONTENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+g(h.goods_description)+"</span></div>"),r+='<div style="display:flex;justify-content:space-between;padding:2px 0"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VOLUME</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+Number(h.volume_physical||0).toLocaleString()+" "+g(h.volume_unit||"tons")+"</span></div>",r+="</div>",I&&!S){var d=$s(h.trade_sector);if(d.length>0){r+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.8px;margin-bottom:3px">DEMAND DRIVERS</div>';for(var u=0;u<d.length;u++){var m=d[u],v=Number(I[m.stat]??50),x=v>=50?"#5c5":v>=30?"#ca5":"#c84";r+='<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);width:100px">'+g(m.label)+'</span><div style="width:40px;height:2px;background:var(--border-0)"><div style="width:'+v+"%;height:100%;background:"+x+'"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-bright)">'+Math.round(v)+"</span></div>"}r+="</div>"}}var b=ws(h);b&&(r+='<div style="padding:4px 8px;background:'+T.color+"08;border:1px solid "+T.color+'15"><div style="font-size:9px;color:var(--text-muted);line-height:1.5">'+g(b)+"</div></div>"),r+="</div>"}r+="</div></div>"}s.innerHTML=r}function ks(o){te=te===o?-1:o,Pn()}async function Es(){if(!(yt||te<0||!p||!z)){var o=On(),e=o[te];if(e){var t=qn.find(function(v){return v.route_id===e.id});if(t){alert("You have already applied for this route. Status: "+t.status);return}var i={"Bulk Cargo":"bulk_cargo","Container Freight":"container_freight","Specialized Transport":"specialized_transport"},n=i[p.corp_subsector]||"";if(e.shipping_subsector&&n!==e.shipping_subsector){var a=e.shipping_subsector.replace(/_/g," ").replace(/\b\w/g,function(v){return v.toUpperCase()});alert("Your fleet specializes in "+(p.corp_subsector||"?")+" but this route requires "+a+". You cannot service this route.");return}var s=5e4,{data:r}=await y.from("factions").select("corp_cash_reserves").eq("id",p.id).single(),l=Number(r?.corp_cash_reserves??0);if(l<s){alert("Not enough funds. Application fee: $50k. You have $"+Math.round(l/1e3)+"k.");return}yt=!0;var c=document.getElementById("ar-claim-btn");c.textContent="APPLYING...";try{var f=l-s,{error:d}=await y.from("factions").update({corp_cash_reserves:f}).eq("id",p.id);if(d){alert("Failed to deduct fee.");return}var{data:u,error:m}=await y.from("shipping_applications").insert({route_id:e.id,faction_id:p.id,proposed_rate:Number(e.estimated_revenue||0),application_fee:s,status:"pending",applied_at_tick:z.current_tick}).select("*").single();if(m){alert("Application failed: "+m.message),await y.from("factions").update({corp_cash_reserves:l}).eq("id",p.id);return}await y.from("event_log").insert({nation_id:e.origin_nation_id,event_name:p.faction_name+" applied to service "+(e.origin_port||"?")+" → "+(e.destination_port||"?")+" route",category:"corporate",description_chosen:p.faction_name+" has submitted a shipping application for the "+(e.goods_name||"trade")+" route between "+(e.origin_port||"?")+" and "+(e.destination_port||"?")+". Awaiting government approval.",fired_at_tick:z.current_tick}).catch(function(){}),await Ln(),te=-1,await Bn(),alert("Application submitted! The government will review your application.")}catch(v){alert("Application failed: "+(v.message||"Network error"))}finally{yt=!1,c.textContent="APPLY TO SERVICE — $50k",c.className="ar-claim-btn"+(te>=0?" active":"")}}}}async function Cs(){if(!(yt||te<0||!p||!z)){var o=On(),e=o[te];if(e){var t=Number(p.shipping_fleet_capacity??0),i=Number(p.shipping_fleet_deployed??0);if(i>=t){alert("No available vessels. Fleet capacity: "+t+", deployed: "+i+".");return}yt=!0;var n=document.getElementById("ar-claim-btn");n.textContent="CLAIMING...",n.className="ar-claim-btn";try{var{data:a,error:s}=await y.rpc("claim_shipping_route",{p_faction_id:p.id,p_route_id:e.id,p_current_tick:z.current_tick});if(s){alert("Claim failed: "+s.message);return}if(a&&!a.success){alert(a.error||"Claim failed.");return}if(a?.claim_id){var r=(_e||[]).find(function(u){return u.status==="in_port"&&!u.active_claim_id&&u.fuel>=10});if(r){var{error:l}=await y.from("corp_vessels").update({status:"in_transit",active_claim_id:a.claim_id,current_port_nation_id:null}).eq("id",r.id);l&&console.warn("Failed to assign vessel to route:",l.message)}else console.warn("Route claimed but no available vessel with fuel >= 10% to assign.")}try{var c=e.origin_nation?.name||e.origin_nation_id||"Unknown",f=e.destination_nation?.name||e.destination_nation_id||"Unknown",d=e.goods_type||e.cargo_type||"goods";await y.from("event_log").insert({nation_id:p.nation_id,event_name:"Shipping Route Signed",category:"corporate",description_chosen:p.faction_name+" has just signed an agreement to ship "+d+" between "+c+" and "+f+".",fired_at_tick:z.current_tick||0})}catch{}await Ln(),te=-1,await Promise.all([Bn(),Dn(),he()])}catch(u){alert("Claim failed: "+(u.message||"Network error"))}finally{yt=!1,n.textContent="CLAIM ROUTE",n.className="ar-claim-btn"+(te>=0?" active":"")}}}}let Be=[],Ti="ready",qt=null,ho=-1;async function Dn(){if(!p||p.corp_sector!=="Shipping")return;const o=await ha(y,p.id);Be=o.claims,Ti=o.state,qt=o.error,qt&&console.warn("Failed to load active voyages:",qt.message),Si()}function Ts(o){ho=ho===o?-1:o,Si()}async function Ss(o){if(!(Qo||!p||!z)){Qo=!0;try{var{data:e,error:t}=await y.rpc("release_shipping_route",{p_faction_id:p.id,p_claim_id:o,p_current_tick:z.current_tick});if(t){alert("Release failed: "+t.message);return}if(e&&!e.success){alert(e.error||"Release failed.");return}var{error:i}=await y.from("corp_vessels").update({status:"in_port",active_claim_id:null}).eq("active_claim_id",o).eq("faction_id",p.id);i&&console.warn("Failed to free vessel on release:",i.message),ho=-1,await Ln(),await Promise.all([Bn(),Dn(),he()])}catch(n){alert("Release failed: "+(n.message||"Network error"))}finally{Qo=!1}}}function Si(){const o=z?.current_tick||0,e=Number(p?.shipping_fleet_capacity??0),t=Number(p?.shipping_fleet_deployed??0),i=p?.corp_subsector||"--";document.getElementById("av-count").textContent=Be.length+" ACTIVE";const n=Be.reduce((f,d)=>f+Number(d.total_revenue||0),0),a=Be.reduce((f,d)=>f+(d.transits_completed||0),0),s=a>0?Math.round(n/a):0;document.getElementById("av-summary").innerHTML=`
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
            <div class="av-summary__value" style="color:var(--green)">${j(s)}</div>
        </div>`,document.getElementById("av-total-revenue").textContent=j(n),document.getElementById("av-total-revenue").style.color=n>0?"var(--green)":"var(--text-dim)",document.getElementById("av-fleet-status").textContent=t+"/"+e,document.getElementById("av-subsector").textContent=i;const r=document.getElementById("av-list");if(Ti==="error"){r.innerHTML='<div class="av-empty"><div class="av-empty__text">'+g(qt&&qt.message||"Active voyage data is temporarily unavailable.")+"</div></div>";return}if(Be.length===0){r.innerHTML='<div class="av-empty"><div class="av-empty__text">No active voyages.<br>Claim a shipping route to<br>deploy your fleet.</div></div>';return}let l="";for(let f=0;f<Be.length;f++){const d=Be[f],u=d.shipping_routes||{},m=ho===f,v=d.vessel_status||"idle";let x=v.toUpperCase().replace("_"," "),b="av-status--idle",$="";if(v==="loading")b="av-status--loading",x="LOADING";else if(v==="in_transit"){b="av-status--transit";const C=d.transit_started_tick||o,k=(d.transit_arrives_tick||C+(u.transit_ticks||2))-C,N=Math.max(0,Math.min(o-C,k)),R=k>0?Math.round(N/k*100):0;x="IN TRANSIT ("+N+"/"+k+")",$='<div class="av-transit-bar"><div class="av-transit-bar__fill" style="width:'+R+'%"></div></div>'}const h=Number(d.revenue_per_transit||0),E=Number(d.market_share_pct||0),T=d.transits_completed||0,S=Number(d.total_revenue||0),w=bn[u.demand_level]||"#6a6660";if(l+='<div class="av-item" onclick="avToggle('+f+')"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;"><div class="av-item__route">'+g(u.origin_port||"?")+" → "+g(u.destination_port||"?")+'</div><span class="av-status '+b+'">'+x+'</span></div><div class="av-item__cargo">'+g(u.goods_name||"Unknown")+" · "+g(u.vessel_class||"?")+"</div>"+$+'<div class="av-item__stats"><div class="av-stat"><div class="av-stat__label">REV/TRIP</div><div class="av-stat__value" style="color:var(--green)">'+j(h)+'</div></div><div class="av-stat"><div class="av-stat__label">SHARE</div><div class="av-stat__value">'+E.toFixed(1)+'%</div></div><div class="av-stat"><div class="av-stat__label">TRANSITS</div><div class="av-stat__value">'+T+'</div></div><div class="av-stat"><div class="av-stat__label">TOTAL REV</div><div class="av-stat__value" style="color:var(--green)">'+j(S)+"</div></div></div>",m){l+='<div class="av-item__detail"><div class="av-detail-row"><span class="av-detail-label">ORIGIN</span><span class="av-detail-value">'+g(u.origin_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">DESTINATION</span><span class="av-detail-value">'+g(u.destination_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE SECTOR</span><span class="av-detail-value">'+g((u.trade_sector||"").replace(/_/g," ").toUpperCase())+'</span></div><div class="av-detail-row"><span class="av-detail-label">SCOPE</span><span class="av-detail-value">'+g(u.scope||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRANSIT TIME</span><span class="av-detail-value">'+(u.transit_ticks||"?")+' ticks</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE VOLUME</span><span class="av-detail-value">'+j(Number(u.trade_volume||0))+'</span></div><div class="av-detail-row"><span class="av-detail-label">TARIFF</span><span class="av-detail-value">'+Number(u.tariff_rate||0).toFixed(1)+'%</span></div><div class="av-detail-row"><span class="av-detail-label">COMPETITION</span><span class="av-detail-value">'+(u.competition_count??0)+' corps</span></div><div class="av-detail-row"><span class="av-detail-label">DEMAND</span><span class="av-detail-value" style="color:'+w+'">'+(u.demand_level||"?")+"</span></div>"+(u.trade_agreement_name?'<div class="av-detail-row"><span class="av-detail-label">AGREEMENT</span><span class="av-detail-value" style="color:var(--teal)">'+g(u.trade_agreement_name)+"</span></div>":"")+'<div class="av-detail-row"><span class="av-detail-label">CLAIMED</span><span class="av-detail-value">Tick '+(d.claimed_at_tick||"?")+"</span></div>";var c=(_e||[]).find(function(C){return C.active_claim_id===d.id});!c&&v==="loading"?l+=`<div style="padding:6px 8px;margin-top:4px;background:rgba(200,168,50,0.06);border:1px solid rgba(200,168,50,0.15);text-align:center;"><div style="font-family:var(--font-mono);font-size:9px;color:var(--orange);font-weight:700;margin-bottom:4px;">NO VESSEL ASSIGNED</div><button class="av-action-btn" style="background:var(--teal);color:#fff;border-color:var(--teal);width:100%;" onclick="event.stopPropagation();openAssignVesselModal('`+d.id+"','"+(u.vessel_class||"")+`')">ASSIGN VESSEL</button></div>`:c&&(l+='<div style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:var(--bg-card);border:1px solid var(--border-main);"><div><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">ASSIGNED VESSEL</div><div style="font-size:11px;font-weight:700;color:var(--text-bright);">'+g(c.vessel_name||"Unknown")+'</div></div><div style="display:flex;gap:10px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(c.fuel>50?"#5c5":c.fuel>20?"#ca5":"#c55")+'">'+(c.fuel||0)+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(c.condition>50?"#5c5":c.condition>30?"#ca5":"#c55")+'">'+(c.condition||0)+"%</div></div></div></div>"),l+=`<button class="av-action-btn release" onclick="event.stopPropagation();avRelease('`+d.id+`')">RELEASE ROUTE</button></div>`}l+="</div>"}r.innerHTML=l}function zs(o,e){const t=(_e||[]).filter(function(a){return a.status==="in_port"&&!a.active_claim_id&&a.fuel>=15&&a.condition>=20});let i;t.length===0?i='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No available vessels.<br>Ships must be in port with 15%+ fuel and 20%+ condition.</div>':i=t.map(function(a,s){var r=a.fuel>50?"#5c5":a.fuel>20?"#ca5":"#c55",l=a.condition>50?"#5c5":a.condition>30?"#ca5":"#c55";return`<div style="padding:10px 14px;border-bottom:1px solid var(--border-0);cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="assignVesselToRoute('`+o+"','"+a.id+`')"><div><div style="font-size:14px;font-weight:700;color:var(--text-bright);">`+g(a.vessel_name||"Unnamed")+'</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+g(a.vessel_class||"?")+" · "+(a.capacity_dwt||0).toLocaleString()+' DWT</div></div><div style="display:flex;gap:14px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+r+'">'+a.fuel+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+l+'">'+a.condition+'%</div></div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--teal);padding:4px 12px;border:1px solid var(--teal);cursor:pointer;">ASSIGN</div></div></div>'}).join("");var n=document.createElement("div");n.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;",n.onclick=function(a){a.target===n&&n.remove()},n.innerHTML='<div style="width:560px;max-width:95vw;max-height:80vh;background:var(--bg-panel);border:1px solid var(--border-main);display:flex;flex-direction:column;"><div style="padding:12px 16px;border-bottom:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:space-between;align-items:center;"><span style="font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:var(--teal);">ASSIGN VESSEL</span><span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+t.length+' available</span></div><div style="flex:1;overflow-y:auto;">'+i+`</div><div style="padding:10px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);text-align:right;"><button onclick="this.closest('div[style*=fixed]').remove()" style="padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);background:transparent;border:1px solid var(--border-main);cursor:pointer;">CANCEL</button></div></div>`,document.body.appendChild(n)}async function Is(o,e){try{var{error:t}=await y.from("corp_vessels").update({status:"in_port",active_claim_id:o}).eq("id",e).eq("faction_id",p.id);if(t){alert("Assignment failed: "+t.message);return}var i=document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]');i&&i.remove(),await Promise.all([Dn(),he()])}catch(n){alert("Assignment failed: "+(n.message||"Network error"))}}window.openAssignVesselModal=zs;window.assignVesselToRoute=Is;async function Ns(){if(!p){Ue=[],di();return}const{data:o,error:e}=await y.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",p.id).order("delivered_at_tick",{ascending:!1}).limit(20);e?(console.warn("Failed to load deliveries:",e.message),Ue=[]):Ue=(o||[]).map(t=>{const i=t.construction_contracts||{};return{id:t.contract_id,name:i.name||"Project",type:i.issuer_type||"GOVERNMENT",issuer:i.issuer_name||"Government",delivered:"Tick "+(t.delivered_at_tick||0),result:t.result,quality_score:t.quality_score,rep_change:t.rep_change,financials:{contract_value:t.contract_value||0,bonus:t.quality_bonus||0,penalty:t.penalties||0,payment:t.payment_received||0,total_cost:t.total_cost||0},inspection:t.inspection||{},materials_used:t.materials_used||[],timeline:{expected:t.timeline_expected||0,actual:t.timeline_actual||0,on_time:t.on_time,early:t.timeline_actual<t.timeline_expected}}}),di()}function jn(){const o=re.reduce((r,l)=>r+(l.owned||0),0),e=re.reduce((r,l)=>r+(l.deployed||0),0),t=Ca(re),i=o-e;document.getElementById("eq-count").textContent=o+" UNITS",document.getElementById("eq-summary").innerHTML=`
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
                ${j(t)}
            </div>
        </div>`;const n={};for(const r of re)n[r.equipment_key]=r;let a="";for(let r=1;r<=3;r++){const l=Ft[r],c=fn(r),f=un===r,d=c.reduce((m,v)=>m+(n[v.key]?.owned||0),0),u=c.reduce((m,v)=>m+(n[v.key]?.deployed||0),0);if(a+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${r})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${f?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${l.color}">${g(l.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${l.color};border:1px solid ${l.color}33;background:${l.color}0a">${l.tag}</span>
            </div>
            ${d>0?`<span class="eq-tier-hdr__count">${u}/${d}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,f)for(const m of c){const v=n[m.key],x=v?.owned||0,b=v?.deployed||0,$=v?.condition||0,h=m.maintenancePerUnit*x,E=x-b,T=x>0&&E===0,S=x>0&&$<65,w=vi($),C=v?.assigned_projects||[],M=C.length>0?C.map(k=>k.contract_name||"Project").join(", ").slice(0,30):x>0&&b>0?b+" project"+(b>1?"s":""):"—";a+=`<div class="eq-row${x===0?" unowned":""}">`,a+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${x===0?" dim":""}">${g(m.name)}</span>
                        ${S?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${x>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${T?"var(--orange)":"var(--green)"}">${E}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${b}/${x}</span>
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
                            <div class="eq-detail__value" style="color:var(--text-muted)">${g(M)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${j(h)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:a+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',a+="</div>"}}document.getElementById("eq-list").innerHTML=a;const s=[1,2,3].map(r=>{const l=Ft[r],c=fn(r).reduce((f,d)=>f+(n[d.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${c>0?l.color+"33":"var(--border-0)"};background:${c>0?l.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${l.color}">${l.tag}</div>
            <div class="eq-footer__tier-count" style="color:${c>0?"var(--text-bright)":"var(--text-dim)"}">${c}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${j(t)}</div>
        </div>
        <div class="eq-footer__tiers">${s}</div>`}function As(o){un=un===o?-1:o,jn()}async function Fn(){if(!p)return;const{data:o,error:e}=await y.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",p.id);e?(console.warn("Failed to load equipment:",e.message),re=[]):re=o||[],jn()}async function Ms(){const{data:{user:o}}=await y.auth.getUser();if(!o){window.location.href="login.html";return}const{data:e}=await y.from("factions").select("*").or(`id.eq.${o.id},linked_user_id.eq.${o.id}`);we=(e||[]).filter(m=>m.nation_id);const t=sessionStorage.getItem("active_faction_id");if(p=we.find(m=>m.id===t)||we.find(m=>m.faction_type==="corporation")||we[0],!p){await y.auth.signOut(),window.location.href="login.html";return}if(p.faction_type!=="corporation"){window.location.href="dashboard.html";return}const i=new URLSearchParams(window.location.search).get("tab"),n=i==="expansion"||i==="actions";if(p.corp_sector!=="Construction"&&!n){const v={Finance:"corp-operations-finance.html",Shipping:"corp-operations-shipping.html"}[p.corp_sector];if(v){window.location.href=v;return}}const[a,s]=await Promise.all([p.nation_id?y.from("nations").select("*").eq("id",p.nation_id).single():Promise.resolve({data:null}),y.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);a.error&&console.warn("Nation load failed:",a.error.message),a.data&&(I=a.data),s.error&&console.warn("Shard load failed:",s.error.message),z=s.data;let r=0;if(p?.id){const{data:m}=await y.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",p.id).in("status",["open","bidding"]);if(m)for(const v of m)r+=(v.contract_bids||[]).length}const l=document.getElementById("corp-topbar-container");if(l){const{renderCorpTopBar:m}=await ka(async()=>{const{renderCorpTopBar:b}=await import("./corp-topbar-BNWh-zwV.js");return{renderCorpTopBar:b}},__vite__mapDeps([0,1])),v=new URLSearchParams(window.location.search).get("tab")||"operations",x={};r>0&&(x.home={color:"#c8a832",title:r+" pending bid"+(r!==1?"s":"")+" on your projects"}),m(l,{faction:p,shard:z,activeTab:v,allUserFactions:we,badges:x})}if(z){if(document.getElementById("game-date").textContent=z.current_date||"—",document.getElementById("tick-number").textContent=z.current_tick||"—",z.next_tick_at){const v=(Number(z.tick_interval_hours)||8)*36e5,x=new Date(z.next_tick_at).getTime(),$=x-v+v/2;vn=new Date($>Date.now()?$:x+v/2),Ma()}const m=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");m&&(m.textContent="Next Corp Tick")}const c=document.getElementById("topbar-cash");c&&(c.textContent="CASH: "+Ei(Number(p.corp_cash_reserves??0)));const f=document.getElementById("topbar-ap");f&&(f.style.display="none");const d=document.getElementById("nation-pill");d&&(d.textContent=(I?.name||p.nation||"—").toUpperCase());const u=document.getElementById("corp-faction-dropdown");if(u){let m="";for(const v of we){const x=v.id===p.id,b=v.faction_type==="corporation"?"CORP":"PARTY",$=v.faction_type==="corporation"?"var(--teal)":"var(--amber)";m+=`<div class="corp-dd-item${x?" active":""}" onclick="switchToFaction('${v.id}', '${v.faction_type}')">
                <span class="corp-dd-type" style="color:${$}">${b}</span>
                <span class="corp-dd-name">${g(v.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${g(v.abbreviation||"—")}]</span>
            </div>`}u.innerHTML=m}try{const{data:m}=await y.from("building_modifiers").select("*");yo={};for(const v of m||[])yo[v.modifier_key]=v}catch{}await Promise.all([Ne(),zn(),Nn(),Fn(),ki(),Ns(),Zt()]);try{const{data:m}=await y.from("nations").select("*").order("name");Et=m||[]}catch{Et=[]}An(),Ao(),Ea(p,I,z);try{await _a(y,{faction:p,nation:I,shard:z},"auto-services-container")}catch(m){console.error("[CorpOps] Auto-services init failed:",m)}if(document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",i==="expansion"){const m=document.querySelector('[data-tab-action="expansion"]');m&&Ii({preventDefault:()=>{},target:m})}else if(i==="actions"){const m=document.querySelector('[data-tab-action="actions"]');m&&Ai({preventDefault:()=>{},target:m})}}async function Rs(){await y.auth.signOut(),window.location.href="login.html"}function Ls(){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.toggle("open")}function qs(o,e){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.remove("open"),sessionStorage.setItem("active_faction_id",o),e==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",o=>{const e=document.getElementById("faction-switcher"),t=document.getElementById("corp-faction-dropdown");t&&e&&!e.contains(o.target)&&t.classList.remove("open")});document.addEventListener("keydown",o=>{o.key==="Escape"&&Jt()});window.doLogout=Rs;window.toggleTheme=Ra;window.toggleCorpDropdown=Ls;window.switchToFaction=qs;window.setFilter=La;window.arSetFilter=_s;window.arSelectRoute=ks;window.arClaimRoute=Cs;window.arApplyToService=Es;window.avToggle=Ts;window.avRelease=Ss;window.openContractDetail=_i;window.closeContractDetail=Jt;window.toggleWhRow=os;window.toggleEqTier=As;window.switchEmNation=ds;window.setEmType=ps;window.setEmListing=fs;window.setEmQty=ms;window.purchaseEquipment=us;window.switchPrNation=rs;window.setPrMat=is;window.setPrTier=as;window.setPrQty=ss;window.purchaseMaterial=ls;let se={general:0,skilled:0,innovative:0},Ko=!1;const Ke=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function zi(o){const e=Number(I?.minimum_wage??50),t=Number(I?.inflation??50),i=Number(I?.standard_of_living??50),n=e/100*48e3,a=1+(t-50)/100*.5,s=1+(i-50)/100*.5;return Math.round(n*o*a*s)}function _(o){const e=Math.abs(o),t=o<0?"-":"";return e>=1e9?t+"$"+(e/1e9).toFixed(2)+"B":e>=1e6?t+"$"+(e/1e6).toFixed(2)+"M":e>=1e3?t+"$"+(e/1e3).toFixed(1)+"k":t+"$"+e.toLocaleString()}async function Ii(o){o.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("actions-content").style.display="none";const e=document.getElementById("expansion-content");e.style.display="flex",e.style.justifyContent="center",e.style.gap="12px",e.style.alignItems="flex-start",e.style.flexWrap="wrap",document.querySelectorAll(".corp-nav-tab").forEach(t=>t.classList.remove("active")),o.target.classList.add("active"),await Zt(),Ro(),dr(),await Wn(),qo(),await Ar(),await _r(),oo(),to(),await jr(),no(),await Bo(),Po()}function Ni(o){o&&o.preventDefault(),document.getElementById("operations-content").style.display="flex",document.getElementById("expansion-content").style.display="none",document.getElementById("actions-content").style.display="none",document.querySelectorAll(".corp-nav-tab").forEach(e=>e.classList.remove("active")),Os()?.classList.add("active")}async function Ai(o){o.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("expansion-content").style.display="none",document.getElementById("actions-content").style.display="block",document.querySelectorAll(".corp-nav-tab").forEach(e=>e.classList.remove("active")),(o.target||document.querySelector('[data-tab-action="actions"]'))?.classList.add("active"),await Mi(),Tt()}function Os(){return Array.from(document.querySelectorAll(".corp-nav-tab[href]:not([data-tab-action])")).find(o=>{const e=o.getAttribute("href");if(!e)return!1;const t=new URL(e,window.location.href);return t.pathname===window.location.pathname&&!t.searchParams.get("tab")})||null}async function Mi(){if(!p)return;const[o,e]=await Promise.all([y.from("corp_executives").select("*").eq("faction_id",p.id).eq("status","active"),y.from("executive_pool").select("*").eq("nation_id",p.nation_id).eq("status","available").order("skill",{ascending:!1})]);o.error&&console.warn("Failed to load executives:",o.error.message),e.error&&console.warn("Failed to load executive pool:",e.error.message),Ut=o.data||[],Ht=e.data||[];const t=await za({supabase:y,faction:p,currentTick:z?.current_tick||0,poolCandidates:Ht});t?.error&&console.warn("Failed to seed initial executive roster:",t.error.message||t.error),t?.executives&&(Ut=t.executives)}function dt(o){return o>=1e6?"$"+(o/1e6).toFixed(1)+"M":o>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Me(o){return Ut.find(e=>e.role===o)||null}function $o(o,e){return(o||"?")[0]+(e||"?")[0]}function xt(o){return o>=70?"#5cb85c":o>=50?"#ca5":"#c84"}function Tt(){const o=document.getElementById("actions-container");if(!o)return;const e=p?.faction_name||"Corporation",t=(p?.abbreviation||p?.corp_ticker||"??").toUpperCase();let i="";i+=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:0 2px;">
        <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:2px;color:#8b9a6b;text-transform:uppercase;">Actions</span>
            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${g(e)} &middot; ${g(t)}</span>
        </div>
    </div>`,i+='<div style="display:flex;gap:8px;">',i+='<div style="width:262px;display:flex;flex-direction:column;gap:5px;flex-shrink:0;">';for(let n=0;n<mo.length;n++){const a=mo[n],s=uo[a],r=Me(a),l=vt===n,c=s.color,f=!r;if(i+=`<div onclick="actSelectExec(${n})" style="
            padding:10px 12px;
            background:${l?c+"0a":"var(--bg-2,#1a1a17)"};
            border:1px solid ${l?c+"44":"var(--border-0,rgba(255,255,255,0.06))"};
            border-left:3px solid ${l?c:"var(--border-0,rgba(255,255,255,0.06))"};
            cursor:pointer;
        ">`,f&&a!=="CEO")i+=`<div style="display:flex;align-items:center;gap:10px;">
                <div style="width:45px;height:45px;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);flex-shrink:0;">?</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:4px;">
                        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${c};">${g(a)}</span>
                    </div>
                    <div style="font-size:13px;font-weight:600;color:var(--text-dim);margin-top:2px;">VACANT</div>
                    <div style="margin-top:4px;">
                        <span onclick="event.stopPropagation();openExecSearch('${a}')" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:3px 8px;color:#5a8aaa;border:1px solid rgba(90,138,170,0.25);background:rgba(90,138,170,0.06);cursor:pointer;">EXECUTIVE SEARCH</span>
                    </div>
                </div>
            </div>`;else{const d=r?`${r.first_name} ${r.last_name}`:"—",u=r?r.age:0,m=r?r.skill:0,v=r?r.salary_per_year:0,x=r?$o(r.first_name,r.last_name):"—";i+=`<div style="display:flex;align-items:center;gap:10px;">
                <div style="width:45px;height:45px;background:${c}15;border:1px solid ${c}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:14px;font-weight:700;color:${c};flex-shrink:0;">${g(x)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:4px;">
                        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${c};">${g(a)}</span>
                    </div>
                    <div style="font-size:13px;font-weight:600;color:${l?"var(--text-bright,#f0efe6)":"var(--text-muted,#666)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${g(d)}${u?` <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">(${u})</span>`:""}</div>
                    <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:3px;flex:1;">
                            <div style="flex:1;height:3px;background:var(--border-0,rgba(255,255,255,0.06));">
                                <div style="width:${m}%;height:100%;background:${xt(m)};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);width:18px;text-align:right;">${m}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${dt(v)}/yr</span>
                    </div>
                </div>
            </div>`}i+="</div>"}i+="</div>",i+=`<div style="flex:1;display:flex;flex-direction:column;gap:0;">
        <div id="actions-right-panel"></div>
    </div>`,i+="</div>",o.innerHTML=i,Ps()}const Ri={CEO:[{id:"statement",name:"Issue Statement",desc:"Issue a press release to the public events feed. Other players and media corps see it. Cost scales with CEO skill.",cost:"~$20k",costColor:"#5cb85c",tags:["REPUTATION"],cooldown:"once/tick"},{id:"ipo",name:"IPO",desc:"Take the corporation public. Sell ~30% of shares for a massive cash injection. Permanent loss of full control.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["STRUCTURAL"],locked:!0,lockReason:"Coming soon"},{id:"bankruptcy",name:"Declare Bankruptcy",desc:"The CEO officially files for bankruptcy, ceasing all operations. Outstanding loans will be repaid up to 50% of the corporation's market valuation.",descRed:"This will dissolve your corporation. Loans will be paid back, and you will need to found a new corporation. There is a 24 tick cooldown on declaring bankruptcy.",cost:"IRREVERSIBLE",costColor:"#c55",tags:["IRREVERSIBLE"]}],CFO:[{id:"loan",name:"Request Loan",desc:"Submit a loan application to all finance corporations. Set amount, purpose, term, and collateral. Receive competing offers.",cost:"FREE",costColor:"#5cb85c",tags:["FINANCIAL"]}],COO:[{id:"restructure",name:"Restructure Operations",desc:"Lay off 10-20% of workforce, cut ~7% of debt. Reputation hit scales with COO skill — high skill minimizes damage.",cost:"FREE",costColor:"#5cb85c",tags:["OPERATIONAL"],cooldown:"once/tick"}],CTO:[{id:"research",name:"Begin Research",desc:"Start researching a tech tree node. Opens the tech tree interface.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["INNOVATION"],locked:!0,lockReason:"Coming soon"}],CMO:[{id:"rebrand",name:"Rebrand Corporation",desc:"Change name and abbreviation. Cost and reputation hit scale with CMO skill — high skill reduces both.",cost:"~$20M",costColor:"#ca5",tags:["STRUCTURAL"],cooldown:"once/tick"}],CLO:[{id:"sue_corp",name:"Sue Corporation",desc:"File a lawsuit against another corporation for patent infringement, contract breach, or predatory practices.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["LEGAL"],locked:!0,lockReason:"Coming soon"}],Lobbyist:[{id:"donate",name:"Political Donation",desc:"Donate $1M to a political party in the nation where your National HQ is located. The target party receives $100k in party funds. You cannot donate to your own party.",cost:"$1M",costColor:"#ca5",tags:["POLITICAL"],cooldown:"once/tick"}]};function Xt(o){return 1.5-o/100}let Li={};function Bs(o){const e=z?.current_tick||0;return Li[o]===e}function bt(o){const e=z?.current_tick||0;Li[o]=e}function Ps(){const o=document.getElementById("actions-right-panel");if(!o)return;const e=mo[vt],t=uo[e],i=Me(e),n=Ri[e]||[];if(!i){o.innerHTML=`<div style="padding:48px;text-align:center;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));">
            <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${t.color};margin-bottom:6px;">${g(e)}</div>
            <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-bottom:14px;">${g(t.fullTitle)}</div>
            <div style="font-size:16px;color:var(--text-muted);margin-bottom:20px;">This position is vacant. Hire an executive to unlock actions.</div>
            <div onclick="openExecSearch('${e}')" style="display:inline-block;padding:8px 24px;font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">EXECUTIVE SEARCH</div>
        </div>`;return}let a="";a+=`<div style="padding:14px 20px;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-bottom:none;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:56px;height:56px;background:${t.color}15;border:1px solid ${t.color}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:18px;font-weight:700;color:${t.color};">${g($o(i.first_name,i.last_name))}</div>
            <div>
                <div style="display:flex;align-items:baseline;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:22px;font-weight:700;color:${t.color};">${g(e)}</span>
                    <span style="font-size:19px;font-weight:700;color:var(--text-bright,#f0efe6);">${g(i.first_name)} ${g(i.last_name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-top:2px;">${g(t.fullTitle)}</div>
            </div>
        </div>
        <div style="display:flex;gap:16px;align-items:center;">
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SKILL</div>
                <div style="display:flex;align-items:center;gap:5px;margin-top:2px;">
                    <div style="width:50px;height:4px;background:var(--border-0,rgba(255,255,255,0.06));">
                        <div style="width:${i.skill}%;height:100%;background:${xt(i.skill)};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${xt(i.skill)};">${i.skill}</span>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SALARY</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${dt(i.salary_per_year)}/yr</div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">CONTRACT</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${i.contract_years}yr</div>
            </div>
            ${e!=="CEO"?`<div style="text-align:right;">
                <span onclick="event.stopPropagation();confirmFireExec('${i.id}','${g(e)}','${g(i.first_name+" "+i.last_name)}',${i.salary_per_year},${i.contract_end_tick||0})" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:5px 12px;color:#d9534f;border:1px solid rgba(217,83,79,0.25);background:rgba(217,83,79,0.06);cursor:pointer;">FIRE</span>
            </div>`:""}
        </div>
    </div>`,a+='<div style="background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:1px solid var(--border-0,rgba(255,255,255,0.06));flex:1;">';for(let s=0;s<n.length;s++){const r=n[s],l=!!r.locked;a+=`<div onmouseenter="this.dataset.hover='1';this.style.background='${l?"transparent":t.color+"06"}'" onmouseleave="this.dataset.hover='';this.style.background='transparent';var eb=this.querySelector('.act-exec-btn');if(eb)eb.style.display='none'" style="
            padding:16px 20px;
            ${s<n.length-1?"border-bottom:1px solid var(--border-0,rgba(255,255,255,0.06));":""}
            opacity:${l?"0.4":"1"};
            cursor:${l?"not-allowed":"pointer"};
        ">`,a+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;font-weight:700;color:${l?"var(--text-dim)":"var(--text-bright,#f0efe6)"};">${g(r.name)}</span>`;for(const c of r.tags)a+=`<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.3px;padding:2px 6px;line-height:14px;color:${c==="IRREVERSIBLE"?"#c55":c==="OFFENSIVE"?"#c84":c==="STRUCTURAL"?"#ca5":c==="POLITICAL"?"#8a6aaa":"var(--text-dim)"};background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));">${g(c)}</span>`;a+=`</div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${r.costColor};">${g(r.cost)}</span>
            </div>
        </div>`,a+=`<div style="font-size:14px;color:${l?"var(--text-dim)":"var(--text-muted,#666)"};line-height:1.6;">${g(r.desc)}</div>`,r.descRed&&(a+=`<div style="font-size:13px;color:#c55;line-height:1.6;margin-top:4px;">${g(r.descRed)}</div>`),l&&r.lockReason&&(a+=`<div style="margin-top:6px;font-family:var(--font-mono);font-size:11px;color:#c84;display:flex;align-items:center;gap:4px;">
                <span>&#8856;</span><span>${g(r.lockReason)}</span>
            </div>`),l||(a+=`<div class="act-exec-btn" style="display:none;margin-top:10px;text-align:right;">
                <span onclick="event.stopPropagation();actExecute('${r.id}','${e}')" style="display:inline-block;padding:6px 24px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${t.color};cursor:pointer;">EXECUTE</span>
            </div>`),a+="</div>"}a+="</div>",a+=`<div style="padding:8px 20px;background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:none;">
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">
            <span style="color:${t.color};font-weight:700;">${g(e)}</span> skill (${i.skill}/100) affects action outcomes.
            ${i.skill>=70?" High skill increases success probability and reduces costs.":i.skill>=50?" Moderate skill — outcomes are average. Consider recruiting a stronger executive.":" Low skill — actions are less effective and more expensive. Replacement recommended."}
        </div>
    </div>`,o.innerHTML=a,o.querySelectorAll("[onmouseenter]").forEach(s=>{s.addEventListener("mouseenter",function(){const r=this.querySelector(".act-exec-btn");r&&(r.style.display="block")}),s.addEventListener("mouseleave",function(){const r=this.querySelector(".act-exec-btn");r&&(r.style.display="none")})})}function Ds(o,e,t,i,n){const a=z?.current_tick||0,s=Math.max(0,n-a),r=Math.round(i*(s/12)),l=`FIRE ${e}: ${t}

Contract remaining: ${s} ticks
Payout (prorated): $${(r/1e6).toFixed(2)}M

This amount will be deducted from your cash reserves immediately.

Are you sure?`;confirm(l)&&js(o,e,r)}async function js(o,e,t){try{const i=Number(p?.corp_cash_reserves??0);if(i<t){alert(`Insufficient funds. You need $${(t/1e6).toFixed(2)}M but only have $${(i/1e6).toFixed(2)}M.`);return}const n=i-t,{error:a}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",p.id);if(a){alert("Failed to process payout: "+a.message);return}const{error:s}=await y.from("corp_executives").update({status:"fired",updated_at:new Date().toISOString()}).eq("id",o);if(s){await y.from("factions").update({corp_cash_reserves:i}).eq("id",p.id),alert("Failed to fire executive: "+s.message);return}p.corp_cash_reserves=n,Ut=Ut.filter(r=>r.id!==o),Tt()}catch(i){console.error("[CorpOps] Fire executive error:",i),alert("An error occurred.")}}function Fs(o,e){if((Ri[e]||[]).find(i=>i.id===o)?.cooldown==="once/tick"&&Bs(o)){alert("This action can only be used once per tick. Wait for the next tick.");return}switch(o){case"statement":return qi();case"loan":return Pi();case"restructure":return ji();case"rebrand":return Fi();case"donate":return Ui();case"bankruptcy":return Oi()}}let _n=!1;function qi(){if(_n)return;_n=!0;const o=document.createElement("div");o.id="stmt-overlay",o.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",o.onclick=function(l){l.target===o&&Un()};const e=p?.faction_name||"Corporation",t=(p?.abbreviation||p?.corp_ticker||"??").toUpperCase(),i=Number(p?.corp_cash_reserves??0),n=Me("CEO"),a=n?`${n.first_name} ${n.last_name}`:"CEO";o.innerHTML=`<div onclick="event.stopPropagation()" style="width:480px;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">
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
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${g(t)}</span>
                <span style="font-size:10px;color:#e8e4dc;">${g(e)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">&middot; ${g(a)}</span>
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
    </div>`,document.body.appendChild(o);const s=document.getElementById("stmt-text"),r=document.getElementById("stmt-chars");s&&r&&(s.addEventListener("input",function(){r.textContent=this.value.length+"/500"}),s.focus())}function Un(){const o=document.getElementById("stmt-overlay");o&&o.remove(),_n=!1}let Nt=!1;async function Us(){if(!p||!z||Nt)return;const o=document.getElementById("stmt-text"),e=document.getElementById("stmt-error"),t=(o?.value||"").trim();if(!t){e&&(e.textContent="Statement cannot be empty.",e.style.display="block");return}if(t.length>500){e&&(e.textContent="Statement too long (max 500 chars).",e.style.display="block");return}const i=Me("CEO"),n=i?i.skill:50,a=Math.round(2e4*Xt(n)),s=Number(p.corp_cash_reserves??0);if(s<a){e&&(e.textContent="Insufficient cash. Need "+_(a)+".",e.style.display="block");return}Nt=!0;const r=document.getElementById("stmt-submit-btn");r&&(r.style.opacity="0.4",r.style.pointerEvents="none");const l=p.faction_name||"Corporation",c=i?`${i.first_name} ${i.last_name}`:"CEO",f=z.current_tick||0,{error:d}=await y.from("factions").update({corp_cash_reserves:s-a}).eq("id",p.id);if(d){Nt=!1,e&&(e.textContent="Failed to deduct cost: "+d.message,e.style.display="block"),r&&(r.style.opacity="1",r.style.pointerEvents="auto");return}const{error:u}=await y.from("event_log").insert({nation_id:p.nation_id,faction_id:p.id,event_name:l+" — Press Release",description_used:c+", CEO of "+l+': "'+t.replace(/[<>"]/g,"")+'"',category:"business",trigger_key:"ceo_statement",effects_applied:{cost:a,ceo:c,skill:n},fired_at_tick:f});if(u){await y.from("factions").update({corp_cash_reserves:s}).eq("id",p.id),Nt=!1,e&&(e.textContent="Failed to publish: "+u.message,e.style.display="block"),r&&(r.style.opacity="1",r.style.pointerEvents="auto");return}p.corp_cash_reserves=s-a,Nt=!1,bt("statement"),Un()}const fi=24,Hs=.5;async function Gs(o,e){const t=e-fi,{data:i}=await y.from("event_log").select("fired_at_tick, effects_applied").eq("trigger_key","corp_bankruptcy").gte("fired_at_tick",t).order("fired_at_tick",{ascending:!1}).limit(20),n=(i||[]).find(s=>s.effects_applied?.user_id===o),a=n?Math.max(0,n.fired_at_tick+fi-e):0;return{onCooldown:a>0,ticksLeft:a}}let Jo=!1;async function Oi(){if(Jo)return;const{data:{user:o}}=await y.auth.getUser();if(!o){alert("Not logged in.");return}const e=p?.id||sessionStorage.getItem("active_faction_id");if(!e){alert("No active faction selected.");return}const{data:t,error:i}=await y.from("factions").select("*").eq("id",e).eq("faction_type","corporation").is("abandoned_at",null).single();if(i||!t){alert("No active corporation found. It may have already been dissolved.");return}const n=t,a=n.faction_name||"this corporation",{data:s,error:r}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single();if(r||!s){alert("Failed to read game tick. Please try again.");return}const l=s.current_tick||0,{onCooldown:c,ticksLeft:f}=await Gs(o.id,l);if(c){alert("Bankruptcy is on cooldown. You must wait "+f+" more tick"+(f!==1?"s":"")+" before declaring bankruptcy again.");return}if(!confirm("DECLARE BANKRUPTCY — "+a.toUpperCase()+`?

This will permanently:
• Dissolve the corporation
• Delete all properties, equipment, and inventory
• Pay back outstanding loans (up to 50% of market valuation)
• Remove all remaining cash reserves

You will need to found a new corporation.
There is a 24 tick cooldown on declaring bankruptcy.

This action CANNOT be undone.`))return;if(prompt('Type "BANKRUPT" to confirm bankruptcy of '+a+":")!=="BANKRUPT"){alert("Bankruptcy cancelled.");return}Jo=!0;try{async function u(P){const{error:G}=await P;if(G)throw G}const m=Number(n.corp_cash_reserves)||0,{data:v}=await y.from("corp_properties").select("purchase_price, condition").eq("faction_id",e);let x=0;for(const P of v||[])x+=Math.round(Number(P.purchase_price||0)*(Number(P.condition||0)/100));const b=m+x,$=Number(n.corp_loans)||0,h=b-$,E=Math.round(h*1.3),T=Math.max(0,Math.round(E*Hs)),{data:S}=await y.from("finance_active_loans").select("*").eq("borrower_faction_id",e).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!0});let w=0;for(const P of S||[]){const G=P.principal-P.total_paid;if(G<=0)continue;const U=Math.min(G,T-w);if(U<=0)break;const{data:ne}=await y.from("factions").select("corp_cash_reserves").eq("id",P.lender_faction_id).single();ne&&await u(y.from("factions").update({corp_cash_reserves:(Number(ne.corp_cash_reserves)||0)+U}).eq("id",P.lender_faction_id)),await u(y.from("finance_active_loans").update({status:"repaid",total_paid:P.total_paid+U,completed_tick:l}).eq("id",P.id)),w+=U}await u(y.from("contract_bids").delete().eq("faction_id",e)),await u(y.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",e).in("status",["open","bidding"])),await u(y.from("corp_equipment_deliveries").delete().eq("faction_id",e)),await u(y.from("corp_equipment").delete().eq("faction_id",e)),await u(y.from("corp_properties").delete().eq("faction_id",e)),await y.from("corp_material_inventory").delete().eq("faction_id",e),await y.from("corp_warehouse").delete().eq("faction_id",e),await y.from("corp_executives").delete().eq("faction_id",e),await y.from("faction_agitators").delete().eq("faction_id",e),await u(y.from("factions").delete().eq("id",e));const C=w>0?" $"+w.toLocaleString()+" was repaid to creditors.":"";await u(y.from("event_log").insert({nation_id:n.nation_id,faction_id:e,event_name:a+" — Bankruptcy",description_used:a+" has officially filed for bankruptcy. It has laid off its executive staff and ceased operations."+C,category:"business",trigger_key:"corp_bankruptcy",effects_applied:{corp_name:a,sector:n.corp_sector,user_id:o.id,loan_payback:w,valuation:E},fired_at_tick:l})),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:M}=await y.from("factions").select("id, faction_type").or(`id.eq.${o.id},linked_user_id.eq.${o.id}`),k=(M||[]).find(P=>P.faction_type==="party"),N=(M||[]).find(P=>P.faction_type==="corporation"),R=w>0?`
$`+w.toLocaleString()+" repaid to creditors.":"";k?(sessionStorage.setItem("active_faction_id",k.id),alert(a+" has declared bankruptcy."+R+`

Redirecting to your political party.`),window.location.href="dashboard.html"):N?(sessionStorage.setItem("active_faction_id",N.id),alert(a+" has declared bankruptcy."+R+`

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(a+" has declared bankruptcy."+R+`

You have no remaining factions.`),window.location.href="faction-select.html")}catch(u){alert("Bankruptcy failed: "+(u.message||u)+`

Please try again or contact support.`)}finally{Jo=!1}}const Bi=[{id:"equipment",label:"Equipment Acquisition",desc:"Purchase vehicles, cranes, or heavy machinery",icon:"&#9881;"},{id:"working",label:"Working Capital",desc:"Bridge financing for active project costs",icon:"$"},{id:"property",label:"Property Purchase",desc:"Acquire office, warehouse, or HQ building",icon:"&#9632;"},{id:"subsidiary",label:"Subsidiary Expansion",desc:"Fund new subsidiary establishment",icon:"&#9672;"},{id:"materials",label:"Material Procurement",desc:"Bulk material purchase for upcoming projects",icon:"&#9638;"}],Xo=[{id:"none",label:"None",desc:"Unsecured — lenders may charge higher rates",risk:"HIGH",riskColor:"#c84"},{id:"equipment",label:"Equipment",desc:"Financed equipment serves as collateral",risk:"MODERATE",riskColor:"#ca5"},{id:"property",label:"Property",desc:"Corporate property lien",risk:"LOW",riskColor:"#8b9a6b"},{id:"full",label:"Full Assets",desc:"All corporate assets — maximum lender security",risk:"MINIMAL",riskColor:"#5c5"}];let ie=25e7,Vt="equipment",_t=48,fe="equipment",wo="",Mt=[];function Pi(){ie=25e7,Vt="equipment",_t=48,fe="equipment",wo="",document.getElementById("lr-overlay").style.display="flex",Ks(),St()}function Di(){document.getElementById("lr-overlay").style.display="none"}function Vs(o){ie=Math.max(1e6,Math.min(5e9,Number(o)||0)),St()}function Ws(o){Vt=o,St()}function Ys(o){_t=o,St()}function Qs(o){fe=o,St()}async function Ks(){if(!p)return;const{data:o}=await y.from("factions").select("id, faction_name, abbreviation, corp_ticker, corp_company_type").eq("faction_type","corporation").eq("corp_sector","Finance").is("abandoned_at",null).neq("id",p.id);Mt=o||[],St()}function St(){const o=document.getElementById("lr-modal-content");if(!o)return;const e=Number(p?.corp_cash_reserves??0),t=Number(p?.corp_loans??0),i=Number(p?.corp_reputation??50),n=p?.faction_name||"Corporation",a=(p?.abbreviation||p?.corp_ticker||"??").toUpperCase(),s=t+ie,r=s>e*3?"#c55":s>e*1.5?"#c84":s>e?"#ca5":"#5c5",l=s>e*3?"DANGEROUS":s>e*1.5?"HEAVY":s>e?"MODERATE":"HEALTHY",c=fe==="none"?"10-16%":fe==="equipment"?"7-12%":fe==="property"?"5-9%":"4-7%",d=Math.round(ie*(fe==="none"?.13:fe==="equipment"?.095:fe==="property"?.07:.055)/12+ie/_t),u=Xo.find(v=>v.id===fe)||Xo[0];let m="";m+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:#5a8aaa;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Request Loan</span>
            </div>
            <span onclick="lrClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">From:</span>
            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${g(a)}</span>
            <span style="font-size:10px;color:#e8e4dc;">${g(n)}</span>
        </div>
    </div>`,m+='<div style="flex:1;overflow-y:auto;">',m+=`<div style="padding:6px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;">
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
    </div>`,m+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">LOAN AMOUNT</span>
            <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#5a8aaa;">${_(ie)}</span>
        </div>
        <input type="range" min="1000000" max="5000000000" step="10000000" value="${ie}" oninput="lrSetAmount(this.value)" style="width:100%;height:4px;accent-color:#5a8aaa;" />
        <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;"><span>$1M</span><span>$5B</span></div>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">PURPOSE</div>
        <div style="display:flex;flex-direction:column;gap:3px;">`;for(const v of Bi){const x=Vt===v.id;m+=`<div onclick="lrSetPurpose('${v.id}')" style="display:flex;align-items:center;gap:8px;padding:5px 10px;cursor:pointer;background:${x?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${x?"#5a8aaa44":"#2a2a24"};border-left:2px solid ${x?"#5a8aaa":"transparent"};">
            <span style="font-family:var(--font-mono);font-size:10px;color:${x?"#5a8aaa":"#6a6660"};width:14px;text-align:center;">${v.icon}</span>
            <div><div style="font-size:11px;font-weight:600;color:${x?"#e8e4dc":"#9e9a92"};">${v.label}</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${v.desc}</div></div>
        </div>`}m+="</div></div>",m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">PREFERRED TERM</span>
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;">${_t} months</span>
        </div>
        <div style="display:flex;gap:3px;">`;for(const v of[12,24,36,48,60,84,120]){const x=_t===v;m+=`<span onclick="lrSetTerm(${v})" style="flex:1;text-align:center;padding:4px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;color:${x?"#000":"#6a6660"};background:${x?"#5a8aaa":"transparent"};border:1px solid ${x?"#5a8aaa":"#2a2a24"};">${v}</span>`}m+='</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Lenders may offer different terms. This is your preference, not a guarantee.</div></div>',m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">COLLATERAL OFFERED</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">`;for(const v of Xo){const x=fe===v.id;m+=`<div onclick="lrSetCollateral('${v.id}')" style="padding:6px 8px;cursor:pointer;background:${x?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${x?"#5a8aaa44":"#2a2a24"};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${x?"#5a8aaa":"#6a6660"};">${v.label}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:${v.riskColor};">${v.risk} RISK</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${v.desc}</div>
        </div>`}if(m+="</div></div>",m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">NOTE TO LENDERS (OPTIONAL)</div>
        <textarea id="lr-note" rows="2" maxlength="300" onchange="lrNote=this.value"
            placeholder="e.g., Expanding into Heavy Infrastructure. Equipment purchase will generate $12M+ in annual contract revenue."
            style="width:100%;padding:6px 8px;font-family:var(--font-ui);font-size:10px;color:#e8e4dc;background:#1c1c18;border:1px solid #2a2a24;outline:none;resize:none;box-sizing:border-box;line-height:1.5;">${g(wo)}</textarea>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">Debt Impact Preview</div>
        <div style="background:#1c1c18;border:1px solid #2a2a24;padding:6px 10px;">
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CURRENT DEBT</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${_(t)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">+ THIS LOAN</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#5a8aaa;">+${_(ie)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#e8e4dc;">NEW TOTAL DEBT</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${_(s)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEBT HEALTH</span>
                <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${r};background:${r}12;border:1px solid ${r}25;">${l}</span>
            </div>
        </div>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">This request will be sent to</div>`,Mt.length>0){m+='<div style="display:flex;flex-direction:column;gap:3px;">';for(const v of Mt){const x=(v.corp_company_type||"").toLowerCase()==="state"?"#c84":(v.corp_company_type||"").toLowerCase()==="public"?"#5c5":"#c8a832";m+=`<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:#1c1c18;border:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c8a832;">${g((v.abbreviation||v.corp_ticker||"??").toUpperCase())}</span>
                <span style="font-size:10px;color:#e8e4dc;flex:1;">${g(v.faction_name)}</span>
                ${v.corp_company_type?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${x};background:${x}12;border:1px solid ${x}25;">${g(v.corp_company_type.toUpperCase())}</span>`:""}
            </div>`}m+="</div>"}else m+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No finance corporations in this nation yet.</div>';m+='<div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">All finance corporations in your nation will see this request. You choose which offer to accept.</div></div>',m+=`<div style="padding:8px 16px;">
        <div style="padding:6px 10px;background:rgba(90,138,170,0.04);border:1px solid rgba(90,138,170,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#5a8aaa;letter-spacing:0.8px;margin-bottom:4px;">ESTIMATED MARKET TERMS</div>
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. RATE RANGE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#e8e4dc;">${c}</div></div>
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. MONTHLY PAYMENT</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#e8e4dc;">~${_(d)}</div></div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Estimates based on collateral offer and current market rates. Actual terms set by each lender.</div>
        </div>
    </div>`,m+="</div>",m+=`<div style="padding:10px 16px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:12px;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">REQUESTING</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5a8aaa;">${_(ie)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">COLLATERAL</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;">${u.label}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">SENT TO</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#9e9a92;">${Mt.length} lender${Mt.length!==1?"s":""}</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="lrClose()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="lr-submit-btn" onclick="lrSubmit()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">SUBMIT REQUEST</div>
        </div>
    </div>`,m+='<div id="lr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>',o.innerHTML=m}let ro=!1;async function Js(){if(!p||!z||ro)return;const o=document.getElementById("lr-error");if(ie<1e6){o.textContent="Minimum loan amount is $1M.",o.style.display="block";return}if(ie>5e9){o.textContent="Maximum loan amount is $5B.",o.style.display="block";return}const t=((Bi.find(s=>s.id===Vt)||{}).label||Vt)+(wo?" — "+wo:""),i=document.getElementById("lr-submit-btn");ro=!0,i.style.opacity="0.5",i.style.pointerEvents="none";const n=z.current_tick||0,{error:a}=await y.from("finance_loan_requests").insert({requesting_faction_id:p.id,nation_id:p.nation_id,amount:ie,term_months:_t,purpose:t,created_tick:n,expires_tick:n+5});if(i.style.opacity="1",i.style.pointerEvents="auto",a){ro=!1,o.textContent="Failed to submit: "+a.message,o.style.display="block",i.style.opacity="1",i.style.pointerEvents="auto";return}ro=!1,Di()}function ji(){if(!p)return;const o=Number(p.corp_loans??0),e=Number(p.corp_reputation??50),t=Number(p.corp_general_workforce??0),i=Number(p.corp_skilled_workforce??0),n=Number(p.corp_innovative_workforce??0),a=t+i+n;if(a===0){alert("Cannot restructure — no employees to lay off.");return}const s=Me("COO"),r=s?s.skill:50,l=Xt(r),c=10+Math.floor(Math.random()*11),f=Math.round(a*c/100),d=Math.round(o*.07),u=Math.round(d*(2-l)),m=3+Math.floor(Math.random()*10),v=Math.max(1,Math.round(m*l)),x=Math.round(t/a*f),b=Math.round(i/a*f),$=Math.max(0,Math.min(n,f-x-b)),h=document.createElement("div");h.id="restr-overlay",h.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",h.onclick=function(E){E.target===h&&Hn()},h.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">
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
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${f} employees (${c}%)</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">General: ${t} &rarr; ${t-x}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${x}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Skilled: ${i} &rarr; ${i-b}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${b}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Innovative: ${n} &rarr; ${n-$}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${$}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
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
        <div style="padding:8px 16px;border-top:1px solid #2a2a24;display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseRestructure()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="restr-btn" onclick="actSubmitRestructure(${c},${u},${v},${x},${b},${$})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#8b9a6b;cursor:pointer;">RESTRUCTURE</div>
        </div>
        <div id="restr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(h)}function Hn(){const o=document.getElementById("restr-overlay");o&&o.remove()}let lo=!1;async function Xs(o,e,t,i,n,a){if(!p||!z||lo)return;lo=!0;const s=document.getElementById("restr-btn");s&&(s.style.opacity="0.4",s.style.pointerEvents="none");const r=Number(p.corp_general_workforce??0),l=Number(p.corp_skilled_workforce??0),c=Number(p.corp_innovative_workforce??0),f=Number(p.corp_loans??0),d=Number(p.corp_reputation??50),u={corp_general_workforce:Math.max(0,r-i),corp_skilled_workforce:Math.max(0,l-n),corp_innovative_workforce:Math.max(0,c-a),corp_loans:Math.max(0,f-e),corp_reputation:Math.max(0,d-t)},{error:m}=await y.from("factions").update(u).eq("id",p.id);if(m){lo=!1;const b=document.getElementById("restr-error");b&&(b.textContent="Failed: "+m.message,b.style.display="block"),s&&(s.style.opacity="1",s.style.pointerEvents="auto");return}Object.assign(p,u);const v=z.current_tick||0,{error:x}=await y.from("event_log").insert({nation_id:p.nation_id,faction_id:p.id,event_name:(p.faction_name||"Corporation")+" — Restructuring",description_used:(p.faction_name||"A corporation")+" has announced a restructuring, laying off "+o+"% of its workforce.",category:"business",trigger_key:"corp_restructure",effects_applied:{layoff_pct:o,debt_cut:e,rep_loss:t},fired_at_tick:v});x&&console.warn("Failed to log restructure event:",x.message),lo=!1,bt("restructure"),Hn(),Tt()}function Fi(){const o=Me("CMO"),e=o?o.skill:50,t=Xt(e),i=Math.round(2e7*t),n=Math.max(1,Math.round(5*t)),a=Number(p?.corp_cash_reserves??0),s=Number(p?.corp_reputation??50),r=p?.faction_name||"",l=p?.abbreviation||p?.corp_ticker||"",c=document.createElement("div");c.id="rebrand-overlay",c.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",c.onclick=function(f){f.target===c&&Gn()},c.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">
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
            <input id="rebrand-name" type="text" maxlength="40" value="${g(r)}" placeholder="Corporation name"
                style="width:100%;padding:6px 10px;font-family:var(--font-ui);font-size:12px;color:#e8e4dc;background:#1c1c18;border:1px solid #2a2a24;outline:none;box-sizing:border-box;" />
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-top:10px;margin-bottom:6px;">NEW ABBREVIATION / TICKER</div>
            <input id="rebrand-abbr" type="text" maxlength="5" value="${g(l)}" placeholder="e.g. SZC" style="width:100px;padding:6px 10px;font-family:var(--font-mono);font-size:12px;font-weight:700;color:#c8a832;background:#1c1c18;border:1px solid #2a2a24;outline:none;text-transform:uppercase;" />
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
    </div>`,document.body.appendChild(c)}function Gn(){const o=document.getElementById("rebrand-overlay");o&&o.remove()}let co=!1;async function Zs(o,e){if(!p||!z||co)return;const t=o||2e7,i=e||5,n=document.getElementById("rebrand-error"),a=(document.getElementById("rebrand-name")?.value||"").trim().replace(/[<>"]/g,""),s=(document.getElementById("rebrand-abbr")?.value||"").trim().toUpperCase().replace(/[<>"]/g,"");if(!a||a.length<2){n&&(n.textContent="Name must be at least 2 characters.",n.style.display="block");return}if(!s||s.length<2||s.length>5){n&&(n.textContent="Abbreviation must be 2-5 characters.",n.style.display="block");return}const r=Number(p.corp_cash_reserves??0);if(r<t){n&&(n.textContent="Insufficient cash. Need "+_(t)+".",n.style.display="block");return}co=!0;const l=document.getElementById("rebrand-btn");l&&(l.style.opacity="0.4",l.style.pointerEvents="none");const c=Number(p.corp_reputation??50),f=p.faction_name||"Corporation",{error:d}=await y.from("factions").update({faction_name:a,abbreviation:s,corp_ticker:s,corp_cash_reserves:r-t,corp_reputation:Math.max(0,c-i)}).eq("id",p.id);if(d){co=!1,n&&(n.textContent="Failed: "+d.message,n.style.display="block"),l&&(l.style.opacity="1",l.style.pointerEvents="auto");return}p.faction_name=a,p.abbreviation=s,p.corp_ticker=s,p.corp_cash_reserves=r-t,p.corp_reputation=Math.max(0,c-i);const u=z.current_tick||0,{error:m}=await y.from("event_log").insert({nation_id:p.nation_id,faction_id:p.id,event_name:"Corporation Rebranded",description_used:f+" has rebranded to "+a+" ("+s+"). The rebrand costs $20M and reputation takes a temporary hit.",category:"corporate",trigger_key:"corp_rebrand",effects_applied:{old_name:f,new_name:a,new_abbr:s,rep_loss:i,cost:t},fired_at_tick:u});m&&console.warn("Failed to log rebrand event:",m.message),co=!1,bt("rebrand"),Gn(),Tt(),document.getElementById("corp-name-bar").textContent=a;const v=document.getElementById("corp-logo");v&&(v.textContent=s.slice(0,2))}const er={liberty:"#9C27B0",equality:"#E91E63",freedom:"#5b9bd5",security:"#d48a3c",individualism:"#eab308",collectivism:"#ec4899",tradition:"#795548",progress:"#00BCD4",nationalism:"#FF5722",globalism:"#3F51B5"};function at(o){return er[(o||"").toLowerCase()]||"#9C27B0"}let He=[],Se=-1;async function Ui(){Number(p?.corp_cash_reserves??0);const o=[p.nation_id],e=new Set(we.map(n=>n.id)),{data:t}=await y.from("factions").select("id, faction_name, abbreviation, party_color, party_funds, seats, momentum, nation, nation_id, leader_ideology, linked_user_id, ideology_value_1, ideology_value_2").eq("faction_type","party").in("nation_id",o).is("abandoned_at",null).order("seats",{ascending:!1});He=(t||[]).filter(n=>!e.has(n.id)).map(n=>({...n})),Se=-1;const i=document.createElement("div");i.id="donate-overlay",i.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",i.onclick=function(n){n.target===i&&Vn()},document.body.appendChild(i),Hi()}function Vn(){const o=document.getElementById("donate-overlay");o&&o.remove(),He=[],Se=-1}function tr(o){Se=o,Hi()}function Hi(){const o=document.getElementById("donate-overlay");if(!o)return;const e=Me("Lobbyist"),t=e?e.skill:50,i=Math.round(1e6*Xt(t)),n=1e5,a=Number(p?.corp_cash_reserves??0),s=Se>=0?He[Se]:null,r=a>=i;let l='<div onclick="event.stopPropagation()" style="width:540px;max-height:80vh;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">';l+=`<div style="padding:14px 20px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
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
    </div>`,l+='<div style="flex:1;overflow-y:auto;padding:10px 0;">',l+='<div style="padding:0 20px 8px;font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Select a Party</div>',He.length===0&&(l+='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#6a6660;">No eligible parties found.</div>');for(let c=0;c<He.length;c++){const f=He[c],d=Se===c,u=f.party_color||"#8a6aaa",m=(f.momentum||0)>0?"#e8e4dc":"#c55";l+=`<div onclick="donateSelectParty(${c})" style="
            padding:10px 20px;
            border-bottom:1px solid #2a2a24;
            border-left:3px solid ${d?u:"transparent"};
            background:${d?u+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:10px;height:10px;background:${u};flex-shrink:0;"></div>
                    <div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-size:14px;font-weight:600;color:${d?"#e8e4dc":"#9e9a92"};">${g(f.faction_name)}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">${g(f.abbreviation||"??")} &middot; ${g(f.nation||"")} &middot; ${f.seats||0} seats</span>
                            ${f.ideology_value_1?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${at(f.ideology_value_1)};background:${at(f.ideology_value_1)}12;border:1px solid ${at(f.ideology_value_1)}30;">${g(f.ideology_value_1.toUpperCase())}</span>`:""}
                            ${f.ideology_value_2?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${at(f.ideology_value_2)};background:${at(f.ideology_value_2)}12;border:1px solid ${at(f.ideology_value_2)}30;">${g(f.ideology_value_2.toUpperCase())}</span>`:""}
                        </div>
                        <div style="display:flex;gap:12px;margin-top:4px;">
                            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Funds: <span style="color:#c8a832;font-weight:700;">${_(f.party_funds||0)}</span></span>
                            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">Momentum: <span style="color:${m};font-weight:700;">${Number(f.momentum||0).toFixed(1)}</span></span>
                        </div>
                    </div>
                </div>
                ${d?'<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">SELECTED</span>':""}
            </div>
        </div>`}l+="</div>",l+=`<div style="padding:12px 20px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:16px;">
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">COST</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#ca5;">${_(i)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${r?"#e8e4dc":"#c55"};">${_(a)}</div></div>
            ${s?`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">RECIPIENT</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#e8e4dc;">${g(s.abbreviation||s.faction_name)}</div></div>`:""}
        </div>
        <div style="display:flex;gap:8px;">
            <div onclick="actCloseDonation()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="donate-btn" onclick="actSubmitDonation()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${s&&r?"#000":"#6a6660"};background:${s&&r?"#8a6aaa":"#2a2a24"};cursor:${s&&r?"pointer":"not-allowed"};${!s||!r?"opacity:0.4;pointer-events:none;":""}">DONATE</div>
        </div>
    </div>`,l+='<div id="donate-error" style="padding:6px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',l+="</div>",o.innerHTML=l}let st=!1;async function or(){if(!p||!z||Se<0||st)return;const o=He[Se];if(!o)return;const e=Number(z?.current_tick||0);if(new Set(we.map(w=>w.id)).has(o.id)){const w=document.getElementById("donate-error");w&&(w.textContent="You cannot donate to your own party.",w.style.display="block");return}const i=Me("Lobbyist"),n=i?i.skill:50,a=Math.round(1e6*Xt(n)),s=1e5,r=2,{data:l,error:c}=await y.from("factions").select("corp_cash_reserves, last_donation_tick").eq("id",p.id).single();if(c||!l){const w=document.getElementById("donate-error");w&&(w.textContent="Failed to verify cooldown: "+(c?.message||"unknown"),w.style.display="block");return}const f=Number(l.last_donation_tick??0);if(f===e){const w=document.getElementById("donate-error");w&&(w.textContent="Political Donation is on cooldown until next tick.",w.style.display="block"),bt("donate");return}const d=Number(l.corp_cash_reserves??0);if(d<a){const w=document.getElementById("donate-error");w&&(w.textContent="Insufficient cash. Need "+_(a)+", have "+_(d)+".",w.style.display="block");return}st=!0;const u=document.getElementById("donate-btn");u&&(u.style.opacity="0.4",u.style.pointerEvents="none");const m=Number(p.corp_reputation??50),v=Math.max(0,m-r),{data:x,error:b}=await y.from("factions").update({corp_cash_reserves:d-a,corp_reputation:v,last_donation_tick:e}).eq("id",p.id).eq("last_donation_tick",f).select("id");if(b){const w=document.getElementById("donate-error");st=!1,w&&(w.textContent="Failed: "+b.message,w.style.display="block"),u&&(u.style.opacity="1",u.style.pointerEvents="auto");return}if(!x||x.length===0){const w=document.getElementById("donate-error");st=!1,w&&(w.textContent="Political Donation is on cooldown until next tick.",w.style.display="block"),u&&(u.style.opacity="1",u.style.pointerEvents="auto"),bt("donate");return}const{data:$}=await y.from("factions").select("party_funds").eq("id",o.id).single(),h=Number($?.party_funds??0),{error:E}=await y.from("factions").update({party_funds:h+s}).eq("id",o.id);if(E){await y.from("factions").update({corp_cash_reserves:d}).eq("id",p.id);const w=document.getElementById("donate-error");st=!1,w&&(w.textContent="Failed to transfer funds: "+E.message,w.style.display="block"),u&&(u.style.opacity="1",u.style.pointerEvents="auto");return}p.corp_cash_reserves=d-a,p.corp_reputation=v;const T=p.faction_name||"Corporation",{error:S}=await y.from("event_log").insert({nation_id:o.nation_id||p.nation_id,faction_id:p.id,event_name:T+" — Political Donation",description_chosen:T+" has donated "+_(a)+" to "+(o.faction_name||"a political party")+". The party receives "+_(s)+" in campaign funds. Corporate reputation decreases by "+r+".",category:"business",trigger_key:"corp_donation",effects_applied:{cost:a,recipient_faction_id:o.id,recipient_name:o.faction_name,funds_granted:s,reputation_loss:r,skill:n},fired_at_tick:e});S&&console.warn("Failed to log donation event:",S.message),st=!1,bt("donate"),Vn()}function nr(o){vt=o,Tt()}async function ir(o){if(ke=o,Ce=-1,document.getElementById("exec-search-overlay").style.display="flex",Ht.length===0&&p?.nation_id){const{data:e}=await y.from("executive_pool").select("id").eq("nation_id",p.nation_id).limit(1);if(!e||e.length===0){const i=p.nation||"",n=Ia(p.nation_id,i),{error:a}=await y.from("executive_pool").insert(n);a&&console.warn("Failed to generate executive pool:",a.message)}const{data:t}=await y.from("executive_pool").select("*").eq("nation_id",p.nation_id).eq("status","available").order("skill",{ascending:!1});Ht=t||[]}Wi()}function Gi(){document.getElementById("exec-search-overlay").style.display="none",ke=null,Ce=-1}function Vi(o){return Ht.filter(e=>e.status==="available"&&Array.isArray(e.specializations)&&e.specializations.includes(o)).sort((e,t)=>t.skill-e.skill)}function ar(o){Ce=o,Wi()}let po=!1;async function sr(){if(!p||!z||!ke||Ce<0||po)return;const e=Vi(ke)[Ce];if(!e)return;po=!0;const t=z.current_tick||0,i=document.getElementById("es-hire-btn");i&&(i.style.opacity="0.4",i.style.pointerEvents="none");const{error:n}=await y.from("corp_executives").insert({faction_id:p.id,role:ke,first_name:e.first_name,last_name:e.last_name,age:e.age,origin_nation:e.origin_nation,skill:e.skill,salary_per_year:e.required_salary,contract_years:e.required_years,contract_start_tick:t,contract_end_tick:t+e.required_years*12,status:"active"});if(n){po=!1;const s=document.getElementById("es-error");s&&(s.textContent="Failed: "+n.message,s.style.display="block"),i&&(i.style.opacity="1",i.style.pointerEvents="auto");return}const{error:a}=await y.from("executive_pool").update({status:"hired",hired_by_faction_id:p.id}).eq("id",e.id);a&&console.warn("Failed to mark pool candidate as hired:",a.message),po=!1,Gi(),await Mi(),vt=mo.indexOf(ke),vt<0&&(vt=0),Tt()}function Wi(){const o=document.getElementById("exec-search-content");if(!o||!ke)return;const e=ke,t=uo[e],i=Vi(e),n=Ce>=0?i[Ce]:null;let a="";a+=`<div style="padding:12px 20px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:10px;color:${t.color};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Executive Search</span>
            </div>
            <span onclick="closeExecSearch()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:5px;">
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Hiring:</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:${t.color};">${g(e)}</span>
            <span style="font-size:13px;color:var(--text-bright,#f0efe6);">${g(t.fullTitle)}</span>
        </div>
    </div>`,a+='<div style="display:flex;flex:1;min-height:0;overflow:hidden;">',a+='<div style="width:300px;border-right:1px solid #2a2a24;overflow-y:auto;flex-shrink:0;">',i.length===0&&(a+=`<div style="padding:30px 20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No candidates available for this role in your nation.</div>
        </div>`);for(let s=0;s<i.length;s++){const r=i[s],l=Ce===s,c=xt(r.skill);a+=`<div onclick="esSelectCandidate(${s})" style="
            padding:10px 14px;
            border-bottom:1px solid #2a2a24;
            border-left:3px solid ${l?t.color:"transparent"};
            background:${l?t.color+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:${t.color}10;border:1px solid ${t.color}22;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${t.color};flex-shrink:0;">${g($o(r.first_name,r.last_name))}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;color:${l?"var(--text-bright,#f0efe6)":"#9e9a92"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${g(r.first_name)} ${g(r.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:4px;flex:1;">
                            <div style="flex:1;height:3px;background:#2a2a24;">
                                <div style="width:${r.skill}%;height:100%;background:${c};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:${c};width:18px;text-align:right;">${r.skill}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${dt(r.required_salary)}/yr</span>
                    </div>
                </div>
            </div>
        </div>`}if(a+="</div>",a+='<div style="flex:1;overflow-y:auto;">',!n)a+=`<div style="padding:50px 24px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:14px;color:var(--text-dim);margin-bottom:10px;">Select a candidate</div>
            <div style="font-size:12px;color:#6a6660;">${i.length} candidate${i.length!==1?"s":""} available for ${g(e)}</div>
        </div>`;else{const s=n.required_salary*n.required_years,r=xt(n.skill);a+=`<div style="padding:20px;border-bottom:1px solid #2a2a24;">
            <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:64px;height:64px;background:${t.color}12;border:1px solid ${t.color}28;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:20px;font-weight:700;color:${t.color};">${g($o(n.first_name,n.last_name))}</div>
                <div>
                    <div style="font-size:20px;font-weight:700;color:var(--text-bright,#f0efe6);">${g(n.first_name)} ${g(n.last_name)}</div>
                    <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-top:3px;">${g(n.origin_nation)} &middot; Age ${n.age}</div>
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
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${g(n.origin_nation)}</div>
            </div>
        </div>`,a+=`<div style="padding:12px 20px;border-bottom:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Role Specializations</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">`;for(const f of n.specializations||[]){const d=uo[f],u=f===e;a+=`<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:3px 10px;color:${u?"#000":d?.color||"#9e9a92"};background:${u?d?.color||"#5a8aaa":(d?.color||"#5a8aaa")+"10"};border:1px solid ${u?"transparent":(d?.color||"#5a8aaa")+"30"};">${g(f)}</span>`}a+="</div></div>",a+=`<div style="padding:12px 20px;border-bottom:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Contract Terms</div>
            <div style="background:#1c1c18;border:1px solid #2a2a24;padding:10px 14px;">
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">CONTRACT LENGTH</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright,#f0efe6);">${n.required_years} years</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">ANNUAL SALARY</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#c84;">${dt(n.required_salary)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright,#f0efe6);">TOTAL CONTRACT VALUE</span>
                    <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${dt(s)}</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;margin-top:5px;">Salary is deducted from cash reserves each tick as an operating expense.</div>
        </div>`;const l=n.skill>=80?"EXCEPTIONAL":n.skill>=65?"STRONG":n.skill>=50?"COMPETENT":n.skill>=35?"DEVELOPING":"WEAK",c=n.skill>=80?"Elite talent. Actions have high success rate and reduced costs.":n.skill>=65?"Strong performer. Reliable outcomes across most actions.":n.skill>=50?"Adequate for the role. Outcomes are average.":n.skill>=35?"Below average. Actions may fail or cost more. Consider alternatives.":"Poor fit. High failure rates. Replacement recommended.";a+=`<div style="padding:12px 20px;">
            <div style="padding:8px 12px;background:${r}08;border:1px solid ${r}18;">
                <div style="font-family:var(--font-mono);font-size:10px;color:${r};letter-spacing:0.8px;margin-bottom:3px;">${l}</div>
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${c}</div>
            </div>
        </div>`}a+="</div>",a+="</div>",a+=`<div style="padding:12px 20px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:14px;">`,n?a+=`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CANDIDATE</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--text-bright,#f0efe6);">${g(n.first_name)} ${g(n.last_name)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SKILL</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${xt(n.skill)};">${n.skill}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SALARY</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:#c84;">${dt(n.required_salary)}/yr</div></div>`:a+='<div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Select a candidate to hire</div>',a+=`</div>
        <div style="display:flex;gap:8px;">
            <div onclick="closeExecSearch()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="es-hire-btn" onclick="esHireCandidate()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${n?"#000":"#6a6660"};background:${n?t.color:"#2a2a24"};cursor:${n?"pointer":"not-allowed"};${n?"":"opacity:0.4;pointer-events:none;"}">HIRE</div>
        </div>
    </div>`,a+='<div id="es-error" style="padding:5px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',o.innerHTML=a}function Mo(){return Q.reduce((e,t)=>{const i=Number(t.capacity||0),n=Number(t.condition||0)/100;return e+Math.floor(i*n)},0)+500}function rr(o,e){const t=Ke.find(a=>a.id===o),i=Number(p?.[t.factionKey]??0),n=se[o]+e;if(!(i+n<0)){if(e>0){const a=Ke.reduce((r,l)=>{const c=Number(p?.[l.factionKey]??0),f=l.id===o?n:se[l.id];return r+c+f},0),s=Mo();if(a>s)return}se[o]=n,Ro()}}function lr(o){o?se[o]=0:se={general:0,skilled:0,innovative:0},Ro()}async function cr(){if(Ko||!Object.values(se).some(s=>s!==0))return;let e=0;for(const s of Ke){const r=se[s.id];r>0&&(e+=r*zi(s.multiplier)*.1)}const t=Number(p?.corp_cash_reserves??0);if(e>t){alert("Insufficient cash reserves. Hiring cost: "+_(e)+", available: "+_(t));return}const i=Ke.reduce((s,r)=>s+Number(p?.[r.factionKey]??0)+se[r.id],0),n=Mo();if(i>n){alert("Cannot hire beyond property capacity ("+n.toLocaleString()+"). You need more workplaces.");return}const a=e>0?`Confirm workforce changes?

Hiring fee: `+_(e)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(a)){Ko=!0;try{const s={};for(const c of Ke){const f=Number(p?.[c.factionKey]??0);s[c.factionKey]=Math.max(0,f+se[c.id])}e>0&&(s.corp_cash_reserves=Math.max(0,t-Math.round(e)));const{error:r}=await y.from("factions").update(s).eq("id",p.id);if(r)throw r;Object.assign(p,s),se={general:0,skilled:0,innovative:0};const l=document.getElementById("topbar-cash");if(l){const c=Number(p.corp_cash_reserves??0);l.textContent="CASH: "+(c>=1e6?"$"+(c/1e6).toFixed(1)+"M":"$"+Math.round(c/1e3)+"k")}Ro()}catch(s){alert("Error: "+s.message)}finally{Ko=!1}}}function Ro(){const o=document.getElementById("hf-card-container");if(!o)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=Number(I?.minimum_wage??50),n=Number(I?.inflation??50),a=Number(I?.standard_of_living??50),s=i/100*48e3,r=(1+(n-50)/100*.5).toFixed(2),l=(1+(a-50)/100*.5).toFixed(2),c=I?.name||p?.nation||"Nation",f=Object.values(se).some(h=>h!==0),d=Mo();let u=0,m=0,v=0,x=0,b="";for(const h of Ke){const E=Number(p?.[h.factionKey]??0),T=se[h.id],S=E+T,w=zi(h.multiplier),C=T>0,M=E*w,k=S*w,N=k-M;u+=E,m+=S,v+=M,x+=k;const R=T!==0?C?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";b+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${t.border};background:${R};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${h.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${h.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${t.text}">${E.toLocaleString()}</span>
                    ${T!==0?`<span style="font-family:${e};font-size:10px;color:${t.dim}">→</span>
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${C?t.greenBright:t.red}">${S.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${h.multiplier}.0 × ${r} × ${l})</span>
                <span style="font-family:${e};font-size:10px;color:${h.color}">${_(w)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${h.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.red};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-50</div>
                <div onclick="hfSetChange('${h.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.redDim};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${T!==0?t.card:"transparent"};border:1px solid ${T!==0?t.border:"transparent"}">
                    ${T!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${e};font-size:12px;font-weight:700;color:${C?t.greenBright:t.red}">${C?"+":""}${T}</span>
                        <span onclick="hfReset('${h.id}')" style="font-family:${e};font-size:8px;color:${t.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${e};font-size:9px;color:${t.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${h.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+10</div>
                <div onclick="hfSetChange('${h.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+50</div>
            </div>
            ${T!==0?`<div style="margin-top:6px;padding:4px 8px;background:${t.bg};border:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${N>0?t.red:t.greenBright}">${N>0?"+":""}${_(N)}/yr</span>
            </div>`:""}
        </div>`}const $=x-v;o.innerHTML=`
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
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${l}</div>
                    </div>
                </div>
            </div>
            ${b}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;${f?"margin-bottom:6px;":""}">
                <div>
                    <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">WORKFORCE / CAPACITY</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <span style="font-family:${e};font-size:13px;font-weight:700;color:${u>=d?t.red:t.text}">${f?m.toLocaleString():u.toLocaleString()}</span>
                        <span style="font-family:${e};font-size:9px;color:${t.dim}">/ ${d.toLocaleString()}</span>
                    </div>
                    ${u>=d&&!f?`<div style="font-family:${e};font-size:7px;color:${t.red};margin-top:2px;">Need workplaces to hire new employees.</div>`:""}
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${_(v)}</span>
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
    </div>`}function dr(){const o=document.getElementById("wf-summary-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},i=(I?.name||p?.nation||"Nation").toUpperCase(),n=Number(I?.minimum_wage??50),a=Number(I?.inflation??50),s=Number(I?.standard_of_living??50),r=n/100*48e3,l=1+(a-50)/100*.5,c=1+(s-50)/100*.5,f=[{label:"General Workforce",mult:2,color:t.accent,key:"corp_general_workforce",countColor:t.text},{label:"Skilled Workforce",mult:3,color:t.gold,key:"corp_skilled_workforce",countColor:t.blue},{label:"Innovative Workforce",mult:6,color:t.orange,key:"corp_innovative_workforce",countColor:t.gold}];let d=0,u=0,m="";for(const v of f){const x=Number(p?.[v.key]??0),b=Math.round(r*v.mult*l*c),$=x*b;d+=x,u+=$,m+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${v.label}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${i}</span>
                </div>
                <span style="font-family:${e};font-size:16px;font-weight:700;color:${v.countColor}">${x.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${v.mult}.0 × ${l.toFixed(2)} × ${c.toFixed(2)})</span>
                <span style="font-family:${e};font-size:10px;color:${t.muted}">${_(b)}/yr</span>
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
            <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.text}">${d.toLocaleString()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${m}
            <div style="padding:8px 12px;background:${t.card};border-bottom:1px solid ${t.border};">
                <div style="font-family:${e};font-size:8px;letter-spacing:1px;color:${t.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">MINIMUM WAGE (${i})</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">${n}/100 → ${_(r)}/yr</span>
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
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.text}">${d.toLocaleString()}</span>
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
    </div>`}let Q=[];async function Zt(){if(!p?.id)return;const{data:o}=await y.from("corp_properties").select("*").eq("faction_id",p.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});Q=o||[]}function Lo(){const o=document.getElementById("property-card-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=(I?.name||p?.nation||"Nation").toUpperCase(),n=1+(Number(I?.inflation??50)-50)/100*.3;let a="",s=0,r=0;const l=I?.name||p?.nation||"Home Nation",c=5e7,f=1+(Number(I?.inflation??50)-50)/100*.3,d=.8+Number(I?.stability??50)/100*.4,u=Math.round(c*f*d),m=Math.round(u*.005);s+=u,r+=m,a+=`
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
    </div>`;for(const v of Q){const x=ko[v.style]||ko.Basic;s+=Number(v.purchase_price||0),r+=Number(v.monthly_maintenance||0),a+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:${t.text}">${v.name}</span>
                <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${t.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">OWNED</span>
            </div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:4px;">${v.city||i} · ${(v.type||"").replace(/_/g," ")} · <span style="color:${x.color}">${(v.style||"Basic").toUpperCase()}</span></div>
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
                <div onclick="propRefurbish('${v.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.accent};border:1px solid ${t.accent}33;cursor:pointer;">REFURBISH (${_(Math.round((v.purchase_price||0)*.1*n))})</div>
                <div onclick="propSell('${v.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.red};border:1px solid ${t.red}33;cursor:pointer;">SELL</div>
            </div>
        </div>`}o.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Property</span>
            </div>
            <span style="font-family:${e};font-size:10px;color:${t.muted}">${Q.length+1} ASSET${Q.length+1!==1?"S":""}</span>
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
    </div>`}let pt=[],ce=null;const ko={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function Wn(){if(!p?.nation_id)return;const{data:o,error:e}=await y.from("available_properties").select("*").eq("nation_id",p.nation_id).eq("status","available").order("price",{ascending:!0});if(e){console.warn("[Property] Failed to load marketplace:",e.message);return}const t=p?.corp_sector==="Construction";pt=(o||[]).filter(i=>t||i.type!=="warehouse").map(i=>({...i,adjusted_cost:i.price,adjusted_maintenance:i.monthly_maintenance}))}function qo(){const o=document.getElementById("new-property-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"};(I?.name||p?.nation||"Nation").toUpperCase();const i=Number(I?.standard_of_living??50),n=Number(I?.gdp_growth??50),a=Number(I?.inflation??50),s=I?.capital||"Capital",r={capital:s,port:s+" Port",industrial:s+" Industrial Zone",suburban:s+" Suburbs",coastal:s+" Coast"};let l="";if(pt.length===0)l=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let c=0;c<pt.length;c++){const f=pt[c],d=ce===c,u=ko[f.style]||ko.Basic,m=r[f.city_template]||s;l+=`
            <div onclick="npSelect(${c})" style="padding:8px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${d?t.accent:"transparent"};background:${d?"rgba(139,154,107,0.03)":"transparent"};">
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
                ${d?`<div style="margin-top:5px;">
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
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${pt.length} AVAILABLE</span>
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
            ${l}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;gap:6px;justify-content:space-between;">
                <div onclick="npOpenConstructionModal()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${t.gold};border:1px solid ${t.gold}44;cursor:pointer">CONSTRUCTION PROJECT</div>
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${ce!==null?"#000":t.dim};background:${ce!==null?t.accent:"transparent"};border:1px solid ${ce!==null?t.accent:t.border};cursor:${ce!==null?"pointer":"default"};opacity:${ce!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function pr(o){ce=ce===o?null:o,qo()}let Zo=!1;async function fr(){if(ce===null||Zo)return;const o=pt[ce];if(!o)return;const e=Number(p?.corp_cash_reserves??0);if(o.adjusted_cost>e){alert(`Insufficient cash reserves.
Property: `+_(o.adjusted_cost)+`
Cash: `+_(e));return}if(confirm('Buy "'+o.name+'" for '+_(o.adjusted_cost)+`?

Monthly maintenance: `+_(o.adjusted_maintenance)+`/mo
Condition: `+o.condition+`%

This will be deducted from your cash reserves.`)){Zo=!0;try{const{error:t}=await y.from("corp_properties").insert({faction_id:p.id,nation_id:p.nation_id,catalog_id:o.catalog_id||null,name:o.name,type:o.type,style:o.style,capacity:o.capacity,purchase_price:o.adjusted_cost,monthly_maintenance:o.adjusted_maintenance,condition:o.condition,city:o.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(t)throw t;const i=Math.max(0,e-o.adjusted_cost),{error:n}=await y.from("factions").update({corp_cash_reserves:i}).eq("id",p.id);if(n)throw n;p.corp_cash_reserves=i,o.id&&await y.from("available_properties").update({status:"sold",purchased_by:p.id}).eq("id",o.id);const a=document.getElementById("topbar-cash");a&&(a.textContent="CASH: "+(i>=1e6?"$"+(i/1e6).toFixed(1)+"M":"$"+Math.round(i/1e3)+"k")),ce=null,await Wn(),qo(),Lo(),alert("Property purchased: "+o.name+`

Deducted: `+_(o.adjusted_cost))}catch(t){alert("Purchase failed: "+t.message)}finally{Zo=!1}}}const ht={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let Yn=!1,A={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0,nationId:null,nationName:null},en=!1,hn=[];function Yi(){const e=1+(Number(I?.inflation??50)-50)/100*.3,t=ht[A.style]?.costMod||1,i=A.type==="Warehouse"?.75:1,n=Math.round(A.size*1e5*e*t*i),a=Math.round(n*(1+A.budgetMod/100)),s=Math.round(a*.007*(ht[A.style]?.maintMod||1));return{baseBudget:n,adjusted:a,maint:s,inflMod:e,styleMod:t}}async function mr(){Yn=!0,A={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0,nationId:null,nationName:null};try{const{data:o}=await y.from("nations").select("id, name").order("name");hn=(o||[]).filter(e=>e.id!==p?.nation_id)}catch{hn=[]}Qi()}function Qn(){Yn=!1,document.getElementById("cp-modal-overlay")?.remove()}function ur(o,e){A[o]=e,Qi()}async function vr(){if(!(en||!A.name.trim())){if(A.type==="Regional HQ"&&!A.nationId){alert("Select a target nation for the Regional HQ.");return}en=!0;try{const o=Yi(),e=A.type==="Regional HQ"?A.nationId:p.nation_id,t=A.type==="Regional HQ"?A.nationName||"Unknown":I?.name||p?.nation||"Unknown",i=ht[A.style]?.repGain||1,n=await y.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),a=n.data?.current_tick||0,s=(n.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:r}=await y.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",e).eq("issuer_type","PRIVATE"),c=`PVT-C${(r||0)+1}-${s}`,{error:f}=await y.from("construction_contracts").insert({nation_id:e,template_key:"custom_building",sector:"civil_engineering",name:A.name.trim(),project_type:A.type,project_subtype:A.style,description:`${A.type} (${A.style}) — ${A.size.toLocaleString()} employees, commissioned by ${p.faction_name}`,project_code:c,budget_ceiling:o.adjusted,timeline_ticks:A.timeline,required_materials:(()=>{const d=A.size/1e3,u=A.style,m={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[u]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},v=(x,b)=>Math.max(1,Math.ceil(d*x*b));return{concrete:v(8,m.concrete),steel:v(6,m.steel),glass_facades:v(3,m.glass),em_systems:v(4,m.em),lumber:v(1,m.lumber),heavy_parts:v(2,m.heavy),aggregate:v(3,m.agg)}})(),required_equipment:(()=>{const d=A.size,u={trucks:Math.ceil(d/2e3)+1,mixers:Math.ceil(d/3e3)+1};return d>1e3&&(u.excavators=Math.ceil(d/3e3)+1,u.cranes=Math.ceil(d/4e3)+1),d>3e3&&(u.bulldozers=Math.ceil(d/4e3)+1,u.haulers=Math.ceil(d/5e3)+1),d>8e3&&(u.pile_drivers=Math.ceil(d/6e3)+1),u})(),required_workforce:{general:Math.ceil(A.size*.08),skilled:Math.ceil(A.size*.03)},status:"open",generated_at_tick:a,bidding_ends_tick:a+3,issuer_type:"PRIVATE",issuer_name:p.faction_name,issuer_faction_id:p.id});if(f)throw f;Qn(),alert(`Construction project submitted!

Project: `+A.name.trim()+`
Code: `+c+`
Budget: `+_(o.adjusted)+`
Expected Reputation: +`+Math.ceil(o.adjusted/1e8*3)+` (+3 per $100M)

All construction corporations in `+t+" can now bid on this project.")}catch(o){alert("Failed to submit project: "+o.message)}finally{en=!1}}}function Qi(){if(document.getElementById("cp-modal-overlay")?.remove(),!Yn)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=Yi(),i=I?.name||p?.nation||"Nation",n=Math.ceil(t.adjusted/1e8*3),a=n>=4?e.gold:n>=3?e.greenBright:n>=2?e.accent:e.dim,s=Object.entries(ht).map(([c,f])=>{const d=A.style===c;return`<div onclick="cpSetField('style','${c}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${d?f.color+"18":"transparent"};border:1px solid ${d?f.color+"44":e.border};">
            <div style="font-family:${o};font-size:9px;font-weight:700;color:${d?f.color:e.dim}">${c}</div>
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
                    ${["Regional HQ","Office Building",...p?.corp_sector==="Construction"?["Warehouse"]:[],...p?.corp_subsector?.toLowerCase()==="banking"?["Branch Office"]:[],...p?.corp_subsector?.toLowerCase()==="investment"?["Trading Floor"]:[],...p?.corp_subsector?.toLowerCase()==="insurance"?["Claims Office"]:[]].map(c=>{const f=["Branch Office","Trading Floor","Claims Office"].includes(c),u=c==="Warehouse"?e.orange:f?"#8a6aaa":e.accent;return`<span onclick="cpSetField('type','${c}')" style="flex:1;min-width:100px;text-align:center;padding:6px 0;font-family:${o};font-size:12px;font-weight:700;cursor:pointer;color:${A.type===c?"#000":e.dim};background:${A.type===c?u:"transparent"};border:1px solid ${A.type===c?u:e.border}">${c}</span>`}).join("")}
                </div>
                ${A.type==="Regional HQ"?`<div style="margin-top:8px;">
                    <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Target Nation</div>
                    <select id="cp-nation-select" onchange="cpSetField('nationId', this.value); cpSetField('nationName', this.options[this.selectedIndex].text)"
                        style="width:100%;padding:8px 12px;font-family:${o};font-size:12px;color:${e.text};background:${e.card};border:1px solid ${e.border};outline:none;">
                        <option value="">-- Select a nation --</option>
                        ${hn.map(c=>`<option value="${c.id}" ${A.nationId===c.id?"selected":""}>${c.name}</option>`).join("")}
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
                <div style="margin-top:5px;font-family:${o};font-size:10px;color:${ht[A.style].color}">${ht[A.style].desc}</div>
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
    </div>`,document.body.appendChild(r);const l=document.getElementById("cp-name-input");l&&l.addEventListener("input",c=>{A.name=c.target.value}),r.addEventListener("click",c=>{c.target===r&&Qn()})}function yr(){const o=document.getElementById("cp-name-input");if(o&&(A.name=o.value),!A.name.trim()){alert("Please enter a building name.");return}vr()}window.cpClose=Qn;window.cpSetField=ur;window.cpSubmitFromModal=yr;window.npSelect=pr;window.npBuyProperty=fr;window.npOpenConstructionModal=mr;let $t=!1;async function gr(o){if($t)return;const e=Q.find(r=>r.id===o);if(!e)return;const t=1+(Number(I?.inflation??50)-50)/100*.3,i=Math.round((e.purchase_price||0)*.1*t),n=Number(p?.corp_cash_reserves??0);if(i>n){alert("Insufficient cash. Refurbishment costs "+_(i)+" (inflation-adjusted), you have "+_(n));return}if(e.condition>=95){alert("Property is already in excellent condition ("+e.condition+"%).");return}const a=5+Math.floor(Math.random()*21),s=Math.min(100,e.condition+a);if(confirm('Refurbish "'+e.name+`"?

Cost: `+_(i)+`
Expected improvement: +`+a+"% condition ("+e.condition+"% → "+s+"%)")){$t=!0;try{await y.from("corp_properties").update({condition:s}).eq("id",o);const r=Math.max(0,n-i);await y.from("factions").update({corp_cash_reserves:r}).eq("id",p.id),p.corp_cash_reserves=r;const l=document.getElementById("topbar-cash");l&&(l.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")),await Zt(),Lo(),alert("Refurbished! Condition: "+e.condition+"% → "+s+"%")}catch(r){alert("Refurbishment failed: "+r.message)}finally{$t=!1}}}async function xr(o){if($t)return;const e=Q.find(a=>a.id===o);if(!e)return;const t=1+(Number(I?.inflation??50)-50)/100*.3,i=(e.condition||50)/100,n=Math.round((e.purchase_price||0)*.6*i*t);if(confirm('Sell "'+e.name+`"?

Sale value: `+_(n)+" (60% × "+e.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){$t=!0;try{await y.from("corp_properties").update({is_active:!1}).eq("id",o);const s=Number(p?.corp_cash_reserves??0)+n;await y.from("factions").update({corp_cash_reserves:s}).eq("id",p.id),p.corp_cash_reserves=s;const l=(await y.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await y.from("available_properties").insert({nation_id:p.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,price:Math.round(n*1.1),monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,generated_at_tick:l,expires_at_tick:l+6,status:"available"});const c=document.getElementById("topbar-cash");c&&(c.textContent="CASH: "+(s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k")),await Zt(),Lo(),await Wn(),qo(),alert('Sold "'+e.name+'" for '+_(n))}catch(a){alert("Sale failed: "+a.message)}finally{$t=!1}}}window.propRefurbish=gr;window.propSell=xr;const De={SALE:.8,DISSOLVE:.6,REVENUE_BASE:.02,GDP_NEUTRAL:30,DEFAULT_REPUTATION:25};function br(o){if(!o)return 0;const e=o.trim().replace(/[$,]/g,""),t=e.match(/^([\d.]+)\s*[Mm]$/),i=e.match(/^([\d.]+)\s*[Kk]$/);return Math.round(t?parseFloat(t[1])*1e6:i?parseFloat(i[1])*1e3:parseFloat(e))}function Ze(o){const e=document.getElementById("topbar-cash");e&&(e.textContent="CASH: "+(o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k"))}function Ki(o){return zt.find(e=>e.id===o)?.name||"—"}function Oo(o){return Q.filter(e=>e.nation_id===o)}async function eo(){ft=0,await Zt(),Lo(),to(),oo()}let le=!1,ft=0,fo={};async function _r(){if(p?.id)try{const{data:o}=await y.from("construction_contracts").select("nation_id").eq("awarded_to_faction",p.id).in("status",["in_progress","awarded"]);fo={};for(const e of o||[])e.nation_id&&(fo[e.nation_id]=(fo[e.nation_id]||0)+1)}catch{}}function Ji(o){const e=Oo(o.nation_id),t=e.reduce((v,x)=>v+Number(x.purchase_price||0),0),i=e.reduce((v,x)=>v+Number(x.capacity||0),0),n=fo[o.nation_id]||0,a=zt.find(v=>v.id===o.nation_id),s=(o.name||"").trim().split(/\s+/),r=s.length>=2?s.map(v=>v[0]).join("").toUpperCase().slice(0,4):(o.name||"SUB").slice(0,4).toUpperCase(),l=Number(o.sub_cash||0),c=Number(a?.gdp_growth??50),f=l*De.REVENUE_BASE,d=(c-De.GDP_NEUTRAL)/100,u=De.DEFAULT_REPUTATION/100,m=l>0?Math.round(f*(1+d)*u):0;return{id:o.id,name:o.name,abbr:r,nation:a?.name||o.city||"—",nationId:o.nation_id,sector:p?.corp_sector||"General",subsector:o.subsector||p?.corp_subsector||"—",revenue:m,debt:0,cash:l,reputation:De.DEFAULT_REPUTATION,valuation:t,workforce:i,projects:n,established:o.created_at?new Date(o.created_at).getFullYear().toString():"—",trend:c>=40&&l>0?"up":c>=De.GDP_NEUTRAL&&l>0?"flat":"down",profitable:m>0,hqProp:o}}function to(){const o=document.getElementById("manage-subsidiaries-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=Q.filter(f=>f.type==="regional_hq").map(Ji);ft>=n.length&&(ft=0);const a=n[ft]||null;let s="";n.length===0&&(s=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No subsidiaries established.<br>Use Create Subsidiary to expand.</div>`);let r=0,l=0;for(let f=0;f<n.length;f++){const d=n[f],u=f===ft;r+=d.revenue,l+=d.valuation;const m=d.trend==="up"?t.greenBright:d.trend==="down"?t.red:t.dim,v=d.trend==="up"?"▲":d.trend==="down"?"▼":"–";s+=`
        <div onclick="selectSubsidiary(${f})" style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${u?t.accent:"transparent"};background:${u?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:40px;font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${d.abbr}</span>
            <div style="flex:1.5;">
                <div style="font-size:11px;font-weight:600;color:${t.text};line-height:1.2">${d.name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${d.subsector}</div>
            </div>
            <span style="width:65px"><span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${d.nation.toUpperCase().slice(0,8)}</span></span>
            <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${d.profitable?t.greenBright:t.redDim};text-align:right">${_(d.revenue)}</span>
            <span style="width:40px;font-family:${e};font-size:9px;font-weight:700;color:${d.reputation>=40?t.accent:d.reputation>=25?t.yellow:t.orange};text-align:right">${d.reputation}</span>
            <span style="width:55px;font-family:${e};font-size:9px;color:${t.muted};text-align:right">${_(d.valuation)}</span>
            <span style="width:12px;font-family:${e};font-size:8px;color:${m};text-align:right">${v}</span>
        </div>`}let c="";if(a){const f=a.trend==="up"?t.greenBright:a.trend==="down"?t.red:t.dim,d=a.trend==="up"?"▲":a.trend==="down"?"▼":"–",u=a.trend==="up"?"Growing":a.trend==="down"?"Declining":"Stable",m=a.reputation>=40?t.accent:a.reputation>=25?t.yellow:t.orange,v=[{label:"Revenue",value:_(a.revenue),color:a.profitable?t.greenBright:t.redDim},{label:"Cash",value:_(a.cash),color:t.text},{label:"Debt",value:a.debt>0?_(a.debt):"$0",color:a.debt>0?t.orange:t.dim},{label:"Reputation",value:a.reputation+"/100",color:m},{label:"Market Valuation",value:_(a.valuation),color:t.gold},{label:"Workforce",value:a.workforce.toLocaleString(),color:t.text},{label:"Active Projects",value:a.projects.toString(),color:a.projects>0?t.text:t.dim}],x=a.projects===0,b=a.hqProp?.logo_url?`<img src="${g(a.hqProp.logo_url)}" alt="" style="width:32px;height:32px;object-fit:cover;border-radius:4px;">`:`<label style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:${t.card};border:1px dashed ${t.border};border-radius:4px;cursor:pointer;font-size:14px;color:${t.dim};" title="Upload subsidiary logo">+<input type="file" accept="image/*" id="sub-logo-upload" data-prop-id="${a.hqProp?.id||""}" style="display:none;"></label>`;c=`
            <div style="padding:8px 14px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                    ${b}
                    <div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.gold}">${a.abbr}</span>
                            <span style="font-size:12px;font-weight:700;color:${t.text}">${a.name}</span>
                        </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${a.nation.toUpperCase()}</span>
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">Est. ${a.established}</span>
                    <span style="font-family:${e};font-size:8px;color:${f}">${d} ${u}</span>
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
                    <div onclick="${x?"subDissolve('"+a.id+"')":""}" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${x?t.red:t.dim};border:1px solid ${x?t.red:t.border};opacity:${x?1:.3}">DISSOLVE</div>
                </div>
                ${a.projects>0?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${t.dim}">Cannot dissolve with active projects.</div>`:""}
            </div>`}else c=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a subsidiary to manage.</div>`;if(o.innerHTML=`
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
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${_(l)}</span>
                    <span style="width:12px"></span>
                </div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${c}
            </div>
        </div>
    </div>`,document.getElementById("sub-logo-upload")?.addEventListener("change",async f=>{const d=f.target.files?.[0],u=f.target.dataset.propId;if(!(!d||!u)){if(d.size>2*1024*1024){alert("Logo must be under 2MB.");return}try{const m=d.name.split(".").pop()?.toLowerCase()||"png",v=`party-logos/${p.id}/sub_${u}_${Date.now()}.${m}`,{error:x}=await y.storage.from("public-assets").upload(v,d,{contentType:d.type,upsert:!0});if(x)throw x;const{data:b}=y.storage.from("public-assets").getPublicUrl(v),$=b?.publicUrl;if($){await y.from("corp_properties").update({logo_url:$}).eq("id",u);const h=Q.find(E=>E.id===u);h&&(h.logo_url=$),to()}}catch(m){alert("Upload failed: "+(m.message||"Error"))}}}),a&&(a.subsector==="Insurance"||a.subsector==="Banking")){const f="sub-dashboard-"+a.id;setTimeout(()=>{document.getElementById(f)&&ba(y,{faction:p,nation:I,shard:z},f,a.id).catch(d=>console.error("[SubDash] Init failed:",d))},50)}}async function Xi(o,e){if(le)return;const t=Q.find(m=>m.id===o);if(!t)return;const i=e==="sell",n=i?De.SALE:De.DISSOLVE,a=i?"SELL":"DISSOLVE",s=i?"sold":"dissolved",r=i?"80%":"60%",l=Ki(t.nation_id),c=Oo(t.nation_id),f=c.reduce((m,v)=>m+Math.round((v.purchase_price||0)*n*(v.condition||50)/100),0),d=Number(t.sub_cash||0),u=f+d;if(confirm(a+' subsidiary "'+t.name+`"?

`+c.length+" properties at "+r+` × condition:
  Property value: `+_(f)+`
  Subsidiary cash: `+_(d)+`
  ─────────────────
  Total return: `+_(u)+`

All operations in `+l+` cease.
This cannot be undone.`)){le=!0;try{const m=c.map(x=>x.id);if(m.length===1){const{error:x}=await y.from("corp_properties").update({is_active:!1}).eq("id",m[0]);if(x)throw x}else if(m.length>1){const{error:x}=await y.from("corp_properties").update({is_active:!1}).in("id",m);if(x)throw x}await y.from("corp_properties").update({sub_cash:0}).eq("id",o).then(()=>{}).catch(()=>{});const v=Number(p?.corp_cash_reserves??0)+u;await y.from("factions").update({corp_cash_reserves:v}).eq("id",p.id),p.corp_cash_reserves=v,Ze(v),await eo(),alert("Subsidiary "+s+". "+c.length+` properties liquidated.
Total received: `+_(u))}catch(m){alert("Failed: "+m.message)}finally{le=!1}}}function hr(o){Xi(o,"sell")}async function $r(o){if(le)return;const e=Q.find(r=>r.id===o);if(!e)return;const t=Ki(e.nation_id),n=Oo(e.nation_id).reduce((r,l)=>r+Math.round((l.purchase_price||0)*.8*(l.condition||50)/100),0),a=Number(e.sub_cash||0),s=Math.round(a*.05);if(confirm('PUT UP FOR SALE: "'+e.name+`"

Nation: `+t+`
Estimated Valuation: `+_(n)+`
Subsidiary Cash: `+_(a)+`
Subsector: `+(e.subsector||"General")+`

This will list your subsidiary on the marketplace.
Other corporations can place bids (minimum $1M).
You review and accept bids.

Continue?`)){le=!0;try{const r=z?.current_tick||0,{data:l,error:c}=await y.from("subsidiary_sales").insert({subsidiary_id:o,seller_faction_id:p.id,nation_id:e.nation_id,subsidiary_name:e.name,subsector:e.subsector||null,valuation:n,monthly_revenue:s,sub_cash_at_listing:a,employee_count:e.capacity||0,status:"listed",listed_at_tick:r}).select("*").single();if(c){alert("Failed to list: "+c.message);return}alert('"'+e.name+`" is now listed for sale.

Other corporations will see it on the Expansion tab and can place bids.`),await eo()}catch(r){alert("Failed: "+r.message)}finally{le=!1}}}let Eo=[],Zi="ready",Ot=null;async function Bo(){const o=await $a(y);Eo=o.listings,Zi=o.state,Ot=o.error,Ot&&console.error("[SubMarket] Load failed:",Ot.message)}function Po(){let o=document.getElementById("sub-marketplace-card");o||(o=document.createElement("div"),o.id="sub-marketplace-card",document.getElementById("expansion-content")?.appendChild(o));const e=Eo.filter(s=>s.seller_faction_id!==p?.id),t=Eo.filter(s=>s.seller_faction_id===p?.id),i="'JetBrains Mono',monospace",n={surface:"#1a1a17",card:"#1c1c18",border:"rgba(255,255,255,0.06)",dim:"#4a4940",muted:"#666",text:"#c4c2b8",bright:"#f0efe6",orange:"#c84",green:"#5cb85c",red:"#d9534f",gold:"#c8a832"};let a=`<div style="width:760px;background:${n.surface};border:1px solid ${n.border};font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:10px 14px;border-bottom:1px solid ${n.border};display:flex;align-items:center;gap:8px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${n.orange};display:inline-block;"></span>
            <span style="font-family:${i};font-size:11px;font-weight:700;letter-spacing:1.5px;color:${n.orange};text-transform:uppercase;">Subsidiary Marketplace</span>
            <span style="font-family:${i};font-size:9px;color:${n.dim};">${e.length} available</span>
        </div>`;if(t.length>0){a+=`<div style="padding:8px 14px;border-bottom:1px solid ${n.border};background:${n.card};">
            <div style="font-family:${i};font-size:8px;letter-spacing:1px;color:${n.gold};text-transform:uppercase;margin-bottom:6px;">YOUR LISTINGS</div>`;for(const s of t){const l=(s.subsidiary_bids||[]).filter(c=>c.status==="pending");a+=`<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:11px;font-weight:700;color:${n.bright};">${g(s.subsidiary_name)}</span>
                    <span style="font-family:${i};font-size:8px;color:${n.dim};margin-left:6px;">${g(s.subsector||"")}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${i};font-size:9px;color:${l.length>0?n.green:n.dim};">${l.length} bid${l.length!==1?"s":""}</span>
                    ${l.length>0?`<span onclick="subViewBids('${s.id}')" style="font-family:${i};font-size:8px;font-weight:700;padding:3px 8px;color:${n.green};border:1px solid ${n.green}44;cursor:pointer;">VIEW BIDS</span>`:""}
                    <span onclick="subCancelSale('${s.id}')" style="font-family:${i};font-size:8px;font-weight:700;padding:3px 8px;color:${n.red};border:1px solid ${n.red}44;cursor:pointer;">CANCEL</span>
                </div>
            </div>`}a+="</div>"}if(Zi==="error")a+=`<div style="padding:24px 14px;text-align:center;font-family:${i};font-size:10px;color:${n.red};font-style:italic;">${g(Ot&&Ot.message||"Subsidiary marketplace is temporarily unavailable.")}</div>`;else if(e.length===0)a+=`<div style="padding:24px 14px;text-align:center;font-family:${i};font-size:10px;color:${n.dim};font-style:italic;">No subsidiaries for sale right now.</div>`;else for(const s of e){const r=(s.subsidiary_bids||[]).find(f=>f.bidder_faction_id===p?.id&&f.status==="pending"),c=(_allNations||[]).find(f=>f.id===s.nation_id)?.name||"Unknown";a+=`<div style="padding:10px 14px;border-bottom:1px solid ${n.border};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:12px;font-weight:700;color:${n.bright};">${g(s.subsidiary_name)}</span>
                        <span style="font-family:${i};font-size:7px;font-weight:700;padding:1px 5px;color:${n.orange};border:1px solid ${n.orange}44;background:${n.orange}0a;">${g(s.subsector||"General")}</span>
                    </div>
                    <span style="font-family:${i};font-size:8px;color:${n.dim};">${g(c)}</span>
                </div>
                <div style="display:flex;gap:16px;font-family:${i};font-size:8px;color:${n.muted};margin-bottom:8px;">
                    <span>Valuation: <strong style="color:${n.text};">${_(s.valuation)}</strong></span>
                    <span>Revenue: <strong style="color:${n.text};">${_(s.monthly_revenue)}/mo</strong></span>
                    <span>Cash: <strong style="color:${n.text};">${_(s.sub_cash_at_listing)}</strong></span>
                    <span>Staff: <strong style="color:${n.text};">${s.employee_count}</strong></span>
                </div>
                <div style="display:flex;justify-content:flex-end;">
                    ${r?`<span style="font-family:${i};font-size:8px;font-weight:700;color:${n.green};">✓ BID PLACED: ${_(r.bid_amount)}</span>`:`<span onclick="subPlaceBid('${s.id}','${g(s.subsidiary_name)}',${s.valuation})" style="font-family:${i};font-size:8px;font-weight:700;padding:4px 14px;color:#000;background:${n.orange};cursor:pointer;">PLACE BID</span>`}
                </div>
            </div>`}a+="</div>",o.innerHTML=a}async function wr(o,e,t){const i=prompt('Place bid for "'+e+`"

Valuation: `+_(t)+`
Minimum bid: $1M

Enter bid amount ($):`);if(!i)return;const n=Math.round(Number(i));if(isNaN(n)||n<1e6){alert("Minimum bid is $1,000,000.");return}const a=Number(p?.corp_cash_reserves??0);if(n>a){alert("Insufficient funds. You have "+_(a)+".");return}const{error:s}=await y.from("subsidiary_bids").insert({sale_id:o,bidder_faction_id:p.id,bid_amount:n,status:"pending",placed_at_tick:z?.current_tick||0});if(s){s.message.includes("duplicate")||s.message.includes("unique")?alert("You already have a bid on this subsidiary."):alert("Failed to place bid: "+s.message);return}alert("Bid of "+_(n)+' placed on "'+e+`".
The seller will review your bid.`),await Bo(),Po()}async function kr(o){const e=Eo.find(u=>u.id===o);if(!e)return;const t=(e.subsidiary_bids||[]).filter(u=>u.status==="pending");if(t.length===0){alert("No pending bids.");return}const i=t.map(u=>u.bidder_faction_id),{data:n}=await y.from("factions").select("id, faction_name").in("id",i),a={};(n||[]).forEach(u=>{a[u.id]=u.faction_name});let s='Bids for "'+e.subsidiary_name+`":

`;const r=t.sort((u,m)=>m.bid_amount-u.bid_amount);for(let u=0;u<r.length;u++){const m=r[u];s+=u+1+". "+(a[m.bidder_faction_id]||"Unknown")+": "+_(m.bid_amount)+`
`}s+=`
Enter the number of the bid to accept (or cancel):`;const l=prompt(s);if(!l)return;const c=parseInt(l,10)-1;if(isNaN(c)||c<0||c>=r.length){alert("Invalid selection.");return}const f=r[c],d=a[f.bidder_faction_id]||"Unknown";confirm("Accept bid of "+_(f.bid_amount)+" from "+d+`?

This will transfer ownership of "`+e.subsidiary_name+`" to them.
You will receive `+_(f.bid_amount)+` in cash.

This cannot be undone.`)&&await Er(e,f)}let tn=!1;async function Er(o,e){if(!tn){tn=!0;try{const n=z?.current_tick||0,{data:a}=await y.from("factions").select("corp_cash_reserves").eq("id",e.bidder_faction_id).single(),s=Number(a?.corp_cash_reserves??0);if(s<e.bid_amount){alert("Buyer has insufficient funds. Bid cannot be completed."),await y.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:n}).eq("id",e.id);return}var{error:t}=await y.from("factions").update({corp_cash_reserves:s-e.bid_amount}).eq("id",e.bidder_faction_id);if(t){alert("Failed to deduct from buyer: "+t.message);return}const r=Number(p?.corp_cash_reserves??0);var{error:i}=await y.from("factions").update({corp_cash_reserves:r+e.bid_amount}).eq("id",p.id);if(i){await y.from("factions").update({corp_cash_reserves:s}).eq("id",e.bidder_faction_id),alert("Failed to credit seller: "+i.message);return}p.corp_cash_reserves=r+e.bid_amount,await y.from("corp_properties").update({faction_id:e.bidder_faction_id}).eq("id",o.subsidiary_id);const l=Q.filter(c=>c.nation_id===o.nation_id&&c.faction_id===p.id);for(const c of l)await y.from("corp_properties").update({faction_id:e.bidder_faction_id}).eq("id",c.id);await y.from("subsidiary_sales").update({status:"completed",completed_at_tick:n,accepted_bid_id:e.id}).eq("id",o.id),await y.from("subsidiary_bids").update({status:"accepted",resolved_at_tick:n}).eq("id",e.id),await y.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:n}).eq("sale_id",o.id).neq("id",e.id),Ze(p.corp_cash_reserves),alert("Sale complete! Received "+_(e.bid_amount)+`.

"`+o.subsidiary_name+'" has been transferred to the buyer.'),await eo(),await Bo(),Po()}catch(n){console.error("[SubMarket] Accept bid error:",n),alert("Transfer failed: "+n.message)}finally{tn=!1}}}async function Cr(o){if(!confirm("Cancel this listing? The subsidiary will no longer be for sale."))return;const{error:e}=await y.from("subsidiary_sales").update({status:"cancelled"}).eq("id",o);if(e){alert("Failed: "+e.message);return}await Bo(),Po()}function Tr(o){Xi(o,"dissolve")}async function ea(o,e){if(le)return;const t=Q.find(d=>d.id===o);if(!t)return;const i=Number(p?.corp_cash_reserves??0),n=Number(t.sub_cash||0),a=e?"WITHDRAW":"INJECT CAPITAL";if(e&&n<=0){alert("This subsidiary has no cash to withdraw.");return}const s=e?n:i,r=prompt(a+(e?" from ":" into ")+t.name+`

Parent cash: `+_(i)+`
Subsidiary cash: `+_(n)+`

Enter amount (e.g., 5000000 or 5M):`);if(!r)return;const l=br(r);if(!l||l<=0||isNaN(l)){alert("Invalid amount.");return}if(l>s){alert("Insufficient "+(e?"subsidiary":"parent")+" cash. Available: "+_(s));return}const c=e?i+l:i-l,f=e?n-l:n+l;if(confirm(a+" "+_(l)+(e?" from ":" into ")+t.name+`?

Parent: `+_(i)+" → "+_(c)+`
Subsidiary: `+_(n)+" → "+_(f))){le=!0;try{await Promise.all([y.from("factions").update({corp_cash_reserves:c}).eq("id",p.id),y.from("corp_properties").update({sub_cash:f}).eq("id",o)]),p.corp_cash_reserves=c,t.sub_cash=f,Ze(c),to(),alert((e?"Withdrew ":"Injected ")+_(l)+(e?" from ":" into ")+t.name+".")}catch(d){alert("Failed: "+d.message)}finally{le=!1}}}function Sr(o){ea(o,!1)}function zr(o){ea(o,!0)}async function Ir(o){if(le)return;const e=Q.find(x=>x.id===o);if(!e)return;const t=Ji(e);t.nation;const i=Oo(e.nation_id),n=t.valuation,a=t.cash,s=t.reputation,r=t.subsector,l=Math.round(n*2.25),c=Math.round(s*.1),f=Math.round(s*.2),d=Mo(),u=Ke.reduce((x,b)=>x+Number(p?.[b.factionKey]??0),0),m=Math.max(0,d-u),v=Number(p?.corp_cash_reserves??0);if(l>v){alert(`Insufficient cash to acquire subsidiary.

Acquisition cost (2.25× valuation): `+_(l)+`
Available cash: `+_(v));return}if(t.projects>0){alert("Cannot merge — subsidiary has "+t.projects+" active project(s). Complete or abandon them first.");return}if(confirm('MERGE "'+e.name+`" INTO YOUR CORPORATION

Acquisition cost (2.25× valuation): `+_(l)+`
Subsidiary cash absorbed: `+_(a)+`
Net cost: `+_(l-a)+`

• `+i.length+` properties transferred to parent
• Subsidiary subsector "`+r+`" added to portfolio
• Workers hired to max capacity (+`+m.toLocaleString()+`)
• Reputation: +`+c+" or -"+f+" (from sub rep "+s+`)

This cannot be undone.`)){le=!0;try{const x=p.nation_id;if(i.length>0){const C=i.filter(k=>k.id!==e.id).map(k=>k.id);if(C.length===1){const{error:k}=await y.from("corp_properties").update({nation_id:x,type:"office"}).eq("id",C[0]);if(k)throw k}else if(C.length>1){const{error:k}=await y.from("corp_properties").update({nation_id:x,type:"office"}).in("id",C);if(k)throw k}const{error:M}=await y.from("corp_properties").update({nation_id:x,type:"office",sub_cash:0,subsector:null}).eq("id",e.id);if(M)throw M}const b=v-l+a,h=Number(p?.corp_general_workforce??0)+m,E=Math.random()>=.5?c:-f,T=Number(p?.standing??50),S=Math.max(0,Math.min(100,T+E)),{error:w}=await y.from("factions").update({corp_cash_reserves:b,corp_general_workforce:h,standing:S}).eq("id",p.id);if(w)throw w;p.corp_cash_reserves=b,p.corp_general_workforce=h,p.standing=S,Ze(b),await eo(),alert(`Merger complete!

"`+e.name+`" absorbed into your corporation.
Cost: `+_(l)+" | Cash absorbed: "+_(a)+`
Reputation `+(E>=0?"+":"")+E+" (now "+S+`)
Workers hired: +`+m.toLocaleString()+` general workforce
Properties: `+i.length+" transferred to parent")}catch(x){alert("Merge failed: "+x.message)}finally{le=!1}}}window.subDissolve=Tr;window.subInjectCapital=Sr;window.subWithdraw=zr;window.subMerge=Ir;window.subSell=hr;window.subPutForSale=$r;window.subPlaceBid=wr;window.subViewBids=kr;window.subCancelSale=Cr;window.selectSubsidiary=function(o){ft=o,to()};let zt=[],Bt={},ve=null,on=!1,et="",Wt="",tt="",Ae="";const ta={Construction:4,Finance:5,Shipping:4},Nr=["Construction","Shipping","Finance"],oa={Construction:[{id:"civil",name:"Civil Engineering",mod:0},{id:"industrial",name:"Industrial Construction",mod:.25},{id:"mega",name:"Megaprojects",mod:.4}],Shipping:[{id:"bulk_cargo",name:"Bulk Cargo",mod:0},{id:"container_freight",name:"Container Freight",mod:.2},{id:"specialized_transport",name:"Specialized Transport",mod:.35}],Finance:[{id:"banking",name:"Banking",mod:0},{id:"insurance",name:"Insurance",mod:.15},{id:"investment",name:"Investment Management",mod:.3}],Technology:[{id:"software",name:"Software Development",mod:0},{id:"hardware",name:"Hardware Manufacturing",mod:.2},{id:"telecom",name:"Telecommunications",mod:.35}],Energy:[{id:"oil_gas",name:"Oil & Gas",mod:0},{id:"renewables",name:"Renewables",mod:.2},{id:"mining",name:"Mining",mod:.3}],Healthcare:[{id:"pharma",name:"Pharmaceuticals",mod:0},{id:"hospitals",name:"Hospital Systems",mod:.2},{id:"biotech",name:"Biotechnology",mod:.35}]};async function Ar(){const{data:o,error:e}=await y.from("nations").select("*").order("name");e&&console.warn("[Subsidiary] Failed to load nations:",e.message),zt=(o||[]).filter(i=>i.id!==p?.nation_id);const{data:t}=await y.from("factions").select("nation_id").eq("faction_type","corporation").is("abandoned_at",null);Bt={};for(const i of t||[])i.nation_id&&(Bt[i.nation_id]=(Bt[i.nation_id]||0)+1);tt=p?.corp_sector||"",Ae=p?.corp_subsector||""}function na(){const o=tt||p?.corp_sector||"";return oa[o]||[{id:"general",name:o||"General",mod:0}]}function Mr(o){tt=o;const e=oa[o];Ae=e?e[0].name:"",oo()}function ia(){const o=p?.corp_sector||"";return tt===o?1:ta[tt]||4}function Rr(){const e=na().find(t=>t.name===Ae);return e?e.mod:0}function $n(o){const e=Number(o.standard_of_living??50);return Math.max(.5,Math.round(e/50*100)/100)}function aa(o){const t=ia(),i=1+Rr(),n=$n(o);return Math.round(Math.max(1e7,5e7*t*i*n))}function Lr(o){const e=Bt[o]||0;return e<=1?{label:"HIGH",color:"#5c5"}:e<=3?{label:"MODERATE",color:"#ca5"}:{label:"LOW",color:"#c55"}}function qr(o){if(ve=ve===o?null:o,ve){const e=zt.find(t=>t.id===ve);et=(p?.faction_name||"Subsidiary")+" "+(e?.name||"")}else et="";oo()}function Or(o){Ae=o,oo()}function Br(o){et=o}function Pr(o){Wt=o.toUpperCase().slice(0,4)}async function Dr(){if(on||!ve)return;const o=zt.find(s=>s.id===ve);if(!o)return;const e=(et||"").trim(),t=(Wt||"").trim();if(!e){alert("Please enter a corporation name for the subsidiary.");return}if(t.length<2){alert("Please enter an abbreviation (2-4 chars).");return}if(Q.find(s=>s.nation_id===o.id&&s.type==="regional_hq")){alert("You already have a subsidiary in "+o.name);return}const n=aa(o),a=Number(p?.corp_cash_reserves??0);if(n>a){alert("Insufficient cash. Entry cost: "+_(n)+", available: "+_(a));return}if(confirm("Establish subsidiary in "+o.name+`?

Name: `+e+" ("+t+`)
Subsector: `+(Ae||"General")+`
Entry cost: `+_(n)+`
Creates a Regional HQ (500 capacity)
Unlocks `+o.name+` for operations

Deducted from cash reserves.`)){on=!0;try{const r=(await y.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0,l=85+Math.floor(Math.random()*16),c=Math.round(n*.005),{error:f}=await y.from("corp_properties").insert({faction_id:p.id,nation_id:o.id,name:e,type:"regional_hq",style:"Modern",capacity:500,purchase_price:n,monthly_maintenance:c,condition:l,city:o.capital||o.name,purchased_at_tick:r,is_active:!0,subsector:Ae||p?.corp_subsector||null});if(f)throw f;const d=Math.max(0,a-n);await y.from("factions").update({corp_cash_reserves:d}).eq("id",p.id),p.corp_cash_reserves=d,Ze(d);const u=tt||p?.corp_sector||"Unknown";try{await y.from("event_log").insert({nation_id:o.id,event_name:"New Subsidiary Established",category:"corporate",description_chosen:`${p.faction_name} has invested ${_(n)} to establish ${e}, a new ${u} corporation in ${o.name}.`,fired_at_tick:z?.current_tick||0})}catch{}try{const{data:m}=await y.from("nations").select("gdp_growth").eq("id",o.id).single();m&&await y.from("nations").update({gdp_growth:Math.min(100,Number(m.gdp_growth||50)+.2)}).eq("id",o.id)}catch{}ve=null,et="",Wt="",await eo(),alert('Subsidiary "'+e+'" established in '+o.name+`!

Cost: `+_(n)+`
Regional HQ created with `+l+"% condition.")}catch(s){alert("Failed: "+s.message)}finally{on=!1}}}function oo(){const o=document.getElementById("create-subsidiary-container");if(!o)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=p?.corp_sector||"General",n=p?.corp_subsector||"",a=na(),s=a.find(k=>k.name===Ae)||a[0],r=new Set(Q.filter(k=>k.type==="regional_hq").map(k=>k.nation_id)),l=zt.filter(k=>!r.has(k.id)),c=ve?l.find(k=>k.id===ve):null,f=et.trim().length>0&&Wt.trim().length>=2&&c!==null,d=tt||i,u=ia();let m=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Sector</div>
        <div style="display:flex;gap:3px;">
            ${Nr.map(k=>{const N=k===d,R=k===i,P=R?1:ta[k]||4,G=R?t.greenBright:t.orange;return`<div onclick="subSetSector('${k}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${N?t.accent+"18":"transparent"};border:1px solid ${N?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${N?t.accentBright:t.dim}">${k}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${G}">${R?"PARENT · ×1":"×"+P+" COST"}</div>
                </div>`}).join("")}
        </div>
        ${u>1?`<div style="font-family:${e};font-size:7px;color:${t.orange};margin-top:4px;padding:3px 6px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);">Cross-sector subsidiary: base cost ×${u}</div>`:""}
    </div>`,v=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsector</div>
        <div style="display:flex;gap:3px;">
            ${a.map(k=>{const N=k.name===Ae,R=k.name===n;return`<div onclick="subSetSubsector('${k.name.replace(/'/g,"\\'")}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${N?t.accent+"18":"transparent"};border:1px solid ${N?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:8px;font-weight:700;color:${N?t.accentBright:t.dim}">${k.name}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${R?t.greenBright:k.mod>0?t.orange:t.dim}">${R?"SAME — ±0%":k.mod>0?"+"+Math.round(k.mod*100)+"%":"±0%"}</div>
                </div>`}).join("")}
        </div>
    </div>`,x="";if(l.length===0)x=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Subsidiaries in all available nations.</div>`;else for(const k of l){const N=k.id===ve,R=Lr(k.id),P=Bt[k.id]||0,G=Math.round(Number(k.standard_of_living??50)),U=$n(k);x+=`
            <div onclick="subSelectNation('${k.id}')" style="display:flex;align-items:center;padding:4px 8px;margin-bottom:2px;cursor:pointer;background:${N?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${N?t.accent+"44":t.border};border-left:${N?"2px solid "+t.accent:"2px solid transparent"};">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:11px;font-weight:600;color:${N?t.text:t.muted}">${k.name}</span>
                        <span style="font-family:${e};font-size:7px;font-weight:700;padding:0 4px;color:${R.color};background:${R.color}12;border:1px solid ${R.color}25;line-height:12px">${R.label}</span>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:2px;">
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">STD/LIVING: <span style="color:${t.muted}">${G}</span></span>
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">CORPS: <span style="color:${P>=4?t.red:P>=2?t.yellow:t.greenBright}">${P}</span></span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${U>1?t.orange:t.greenBright}">×${U.toFixed(2)}</div>
                </div>
            </div>`}let b=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="margin-bottom:6px;">
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Corporation Name</div>
            <input type="text" value="${(et||"").replace(/"/g,"&quot;")}" oninput="subSetName(this.value)" placeholder="e.g., ${(p?.faction_name||"Corp")+" "+(c?.name||"International")}" style="width:100%;padding:5px 8px;font-family:${e};font-size:10px;color:${t.text};background:${t.card};border:1px solid ${t.border};outline:none;box-sizing:border-box;" />
        </div>
        <div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Abbreviation (2-4 chars)</div>
            <input type="text" value="${(Wt||"").replace(/"/g,"&quot;")}" oninput="subSetAbbr(this.value)" placeholder="${(p?.faction_name||"CORP").slice(0,2).toUpperCase()+(c?.name||"XX").slice(0,2).toUpperCase()}" maxlength="4" style="width:80px;padding:5px 8px;font-family:${e};font-size:12px;font-weight:700;color:${t.gold};background:${t.card};border:1px solid ${t.border};outline:none;text-align:center;letter-spacing:2px;" />
        </div>
    </div>`;const $=[{rule:"Bid on projects in that nation",icon:"✓",color:t.greenBright},{rule:"Hires local workers at nation rates",icon:"✓",color:t.greenBright},{rule:"Must use parent's materials & vehicles",icon:"!",color:t.orange},{rule:"Reputation gain: 75% sub / 25% parent",icon:"◐",color:t.gold},{rule:"Market revenue at 50% parent rate",icon:"◐",color:t.gold},{rule:"Counts as domestic corporation",icon:"✓",color:t.greenBright},{rule:"Starting reputation: 25",icon:"●",color:t.muted}];let h=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsidiary Rules</div>
        <div style="background:${t.card};border:1px solid ${t.border};padding:6px 8px;">
            ${$.map((k,N)=>`<div style="display:flex;align-items:center;gap:6px;padding:2px 0;${N<$.length-1?"border-bottom:1px solid "+t.border:""}">
                <span style="font-family:${e};font-size:9px;color:${k.color};width:12px;text-align:center">${k.icon}</span>
                <span style="font-size:9px;color:${t.muted}">${k.rule}</span>
            </div>`).join("")}
        </div>
    </div>`;const E=5e7,T=s.mod,S=c?$n(c):null,w=c?aa(c):null,C=Math.round(E*u*(1+T));let M=`
    <div style="background:${t.bg};border:1px solid ${t.border};padding:6px 8px;margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">BASE</span>
            <span style="font-family:${e};font-size:9px;color:${t.muted}">${_(E)}</span>
        </div>
        ${u>1?`<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">SECTOR (${d})</span>
            <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.orange}">×${u}</span>
        </div>`:""}
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">SUBSECTOR (${s.name})</span>
            <span style="font-family:${e};font-size:9px;color:${T===0?t.greenBright:t.orange}">${T===0?"±0%":"+"+Math.round(T*100)+"%"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">NATION (${c?c.name:"select below"})</span>
            <span style="font-family:${e};font-size:9px;color:${c?S>1?t.orange:t.greenBright:t.dim}">${c?"×"+S.toFixed(2):"—"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:3px 0;">
            <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.text}">TOTAL COST</span>
            <span style="font-family:${e};font-size:14px;font-weight:700;color:${t.gold}">${c?_(w):"~"+_(C)}</span>
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
                ${x}
            </div>
            ${b}
            ${h}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            ${M}
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
    </div>`}window.subSelectNation=qr;window.subCreate=Dr;window.subSetName=Br;window.subSetAbbr=Pr;window.subSetSector=Mr;window.subSetSubsector=Or;let Pt=[],Ge=0,Co=JSON.parse(localStorage.getItem("nationhood_investigated_corps")||"{}"),ge="ALL",Pe="REPUTATION";async function jr(){const[o,e]=await Promise.all([y.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, corp_reputation, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name"),y.from("corp_properties").select("id, faction_id, name, nation_id, subsector, type, factions(faction_name, corp_sector, corp_ticker, abbreviation, corp_reputation, corp_company_type, linked_user_id)").eq("type","regional_hq").eq("is_active",!0)]),t={};for(const s of o.data||[])t[s.id]=s;const i=(o.data||[]).map(s=>{const r=(s.corp_company_type||"Private").toUpperCase(),l=Number(s.corp_cash_reserves||0);return{...s,abbr:s.corp_ticker||s.abbreviation||s.faction_name?.slice(0,4).toUpperCase()||"???",status:r,isPlayer:!!s.linked_user_id,reputation:Math.round(Number(s.corp_reputation??50)),revenue:Math.round(l*.1),valuation:Math.round(l*3),_isSub:!1}}),{data:n}=await y.from("nations").select("id, name"),a={};(n||[]).forEach(s=>{a[s.id]=s.name});for(const s of e.data||[]){const r=t[s.faction_id];if(!r)continue;const l=(r.corp_company_type||"Private").toUpperCase();i.push({id:s.id,faction_name:s.name||"Subsidiary",abbreviation:r.abbreviation,corp_sector:r.corp_sector,corp_subsector:s.subsector||r.corp_subsector,corp_ticker:r.corp_ticker,nation_id:s.nation_id,nation:a[s.nation_id]||"?",abbr:(r.corp_ticker||r.abbreviation||"??").slice(0,4),status:l,isPlayer:!!r.linked_user_id,reputation:Math.round(Number(r.corp_reputation??50)),revenue:0,valuation:0,_isSub:!0,_parentName:r.faction_name})}Pt=i}function Fr(o){Ge=o,no()}function Ur(o){ge=o,Ge=0,no()}function Hr(o){Pe=o,Ge=0,no()}async function Gr(o){if(!p||!z)return;const e=Number(p.corp_cash_reserves??0);if(e<5e5){alert("Insufficient cash. Need $500k.");return}const{error:t}=await y.from("factions").update({corp_cash_reserves:e-5e5}).eq("id",p.id);if(t){alert("Failed: "+t.message);return}p.corp_cash_reserves=e-5e5,Co[o]=!0,localStorage.setItem("nationhood_investigated_corps",JSON.stringify(Co));const{data:i}=await y.from("factions").select("corp_cash_reserves, corp_loans, corp_reputation, corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce").eq("id",o).single();if(i){const n=Pt.find(a=>a.id===o);if(n){Object.assign(n,i);const a=Number(i.corp_cash_reserves||0);n.reputation=Math.round(Number(i.corp_reputation??50)),n.revenue=Math.round(a*.1),n.valuation=Math.round(a*3)}}no()}function no(){const o=document.getElementById("corporations-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i={PUBLIC:{color:t.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:t.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:t.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},n=[...new Set(Pt.map(m=>m.nation).filter(Boolean))];let a=[...Pt];ge!=="ALL"&&(a=a.filter(m=>m.nation===ge)),Pe==="REPUTATION"?a.sort((m,v)=>(v.reputation||0)-(m.reputation||0)):Pe==="REVENUE"?a.sort((m,v)=>(v.revenue||0)-(m.revenue||0)):Pe==="VALUATION"&&a.sort((m,v)=>(v.valuation||0)-(m.valuation||0)),Ge>=a.length&&(Ge=0);const s=a[Ge]||null;z?.current_tick;const r=s&&!!Co[s.id],l=s&&s.status==="PRIVATE"&&!r,c=s&&s.status==="STATE";let f="";a.length===0&&(f=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No corporations found.</div>`);for(let m=0;m<a.length;m++){const v=a[m],x=m===Ge,b=i[v.status]||i.PRIVATE,$=v.status==="PRIVATE"&&!Co[v.id];f+=`
        <div onclick="corpSelect(${m})" style="display:flex;align-items:center;padding:7px 16px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${x?t.accent:"transparent"};background:${x?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:42px;font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${v.abbr}</span>
            <div style="flex:1.3;">
                <div style="font-size:11px;font-weight:600;color:${t.text};line-height:1.2">${v.faction_name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${v._isSub?'<span style="color:#8a6aaa;">SUB</span> · ':""}${v.corp_subsector||v.corp_sector||"—"}</div>
            </div>
            <span style="width:62px"><span style="font-family:${e};font-size:8px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(v.nation||"—").toUpperCase().slice(0,6)}</span></span>
            <span style="width:56px;font-family:${e};font-size:9px;font-weight:700;color:${$?t.dim:t.muted};text-align:right">${$?"—":_(v.revenue)}</span>
            <span style="width:34px;font-family:${e};font-size:10px;font-weight:700;color:${v.reputation>=70?t.greenBright:v.reputation>=40?t.accent:t.yellow};text-align:right">${v.reputation}</span>
            <span style="width:56px;font-family:${e};font-size:9px;color:${$?t.dim:t.muted};text-align:right">${$?"—":_(v.valuation)}</span>
            <span style="width:48px;text-align:center"><span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${b.color};background:${b.bg};border:1px solid ${b.border}">${v.status}</span></span>
        </div>`}let d="";if(s){const m=i[s.status]||i.PRIVATE,v=[...s._isSub?[{label:"Parent",value:s._parentName||"—",color:"#8a6aaa"}]:[],{label:"Sector",value:s.corp_sector||"—",color:t.text},{label:"Subsector",value:s.corp_subsector||"—",color:t.accent},{label:"Reputation",value:s.reputation+"/100",color:s.reputation>=70?t.greenBright:s.reputation>=40?t.accent:t.yellow},{label:"Revenue",value:l?"UNDISCLOSED":_(s.revenue),color:l?t.dim:t.greenBright},{label:"Cash Reserves",value:l?"UNDISCLOSED":_(s.corp_cash_reserves||0),color:l?t.dim:t.text},{label:"Market Valuation",value:l?"UNDISCLOSED":_(s.valuation),color:l?t.dim:t.gold}];d=`
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
        ${v.map(x=>`<div style="display:flex;justify-content:space-between;padding:5px 16px;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:10px;color:${t.dim};text-transform:uppercase">${x.label}</span>
            <span style="font-family:${e};font-size:11px;font-weight:700;color:${x.value==="UNDISCLOSED"?t.dim:x.color};${x.value==="UNDISCLOSED"?"font-style:italic;":""}">${x.value}</span>
        </div>`).join("")}
        <div style="padding:6px 14px;border-bottom:1px solid ${t.border};flex-shrink:0;">
            <div style="width:100%;height:4px;background:${t.border}"><div style="width:${s.reputation}%;height:100%;background:${s.reputation>=70?t.greenBright:s.reputation>=40?t.accent:t.yellow}"></div></div>
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
                <div onclick="${l?`corpInvestigate('${s.id}')`:""}" style="flex:1;padding:5px 0;text-align:center;cursor:${l?"pointer":"default"};font-family:${e};font-size:8px;font-weight:700;color:${l?t.blue:r?t.greenBright:t.dim};border:1px solid ${l?t.blue+"44":r?t.greenBright+"44":t.border};opacity:${l?1:.3}">${r?"INVESTIGATED ✓":"INVESTIGATE — $500k"}</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;color:${t.accent};border:1px solid ${t.accent}44">PARTNER</div>
            </div>
            <div style="display:flex;gap:4px;">
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${c?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${c?t.dim:t.gold};border:1px solid ${c?t.border:t.gold+"44"};opacity:${c?.3:1}">ACQUIRE</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${c?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${c?t.dim:t.orange};border:1px solid ${c?t.border:t.orange+"44"};opacity:${c?.3:1}">MERGER</div>
            </div>
            ${c?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${t.dim}">State-owned corps cannot be acquired or merged.</div>`:""}
        </div>`}else d=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a corporation to view details.</div>`;const u=`
    <div style="padding:6px 16px;border-bottom:1px solid ${t.border};background:${t.card};display:flex;gap:12px;align-items:center;flex-shrink:0;">
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px;width:40px">NATION</span>
            <span onclick="corpFilterNation('ALL')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${ge==="ALL"?"#000":t.dim};background:${ge==="ALL"?t.accent:"transparent"};border:1px solid ${ge==="ALL"?t.accent:t.border}">ALL</span>
            ${n.map(m=>`<span onclick="corpFilterNation('${m}')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${ge===m?"#000":t.dim};background:${ge===m?t.accent:"transparent"};border:1px solid ${ge===m?t.accent:t.border}">${m}</span>`).join("")}
        </div>
        <div style="flex:1"></div>
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">SORT</span>
            ${["REPUTATION","REVENUE","VALUATION"].map(m=>`<span onclick="corpSort('${m}')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${Pe===m?"#000":t.dim};background:${Pe===m?t.accent:"transparent"};border:1px solid ${Pe===m?t.accent:t.border}">${m}</span>`).join("")}
        </div>
    </div>`;o.innerHTML=`
    <div style="width:760px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Corporations</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${Pt.length} IN DATABASE</span>
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
                ${d}
            </div>
        </div>
    </div>`}window.corpSelect=Fr;window.corpInvestigate=Gr;window.corpFilterNation=Ur;window.corpSort=Hr;let de=null,ze={},K=120,Ie=15,wn={},mt=[],Ve=[],wt={};async function Vr(){if(!Qe)return;if(kt[Qe.id]){alert("You already have a bid on this contract. Retract it first if you want to re-bid.");return}de=Qe,wn={};try{const{data:t}=await y.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",p.id);for(const i of t||[])wn[vo(i.material_key)]=Number(i.quantity||0)}catch{}mt=[];try{const{data:t}=await y.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",de.id).in("status",["pending","won"]);mt=(t||[]).filter(i=>i.faction_id!==p?.id).map(i=>({name:i.factions?.faction_name||"Unknown",ticker:i.factions?.corp_ticker||"???",price:Number(i.bid_price||0),quality:Number(i.estimated_quality||0),status:i.status}))}catch{}Ve=[],wt={};try{const{data:t,error:i}=await y.rpc("get_project_permit_requirements",{p_contract_id:de.id,p_faction_id:p.id,p_nation_id:de.nation_id});if(i)throw i;Ve=Array.isArray(t)?t:[];const n=Ve.map(a=>a.permit_key).filter(Boolean);if(n.length>0){const{data:a,error:s}=await y.from("construction_permits").select("permit_key, cost, processing_ticks").in("permit_key",n);if(s)throw s;for(const r of a||[])wt[r.permit_key]={cost:Number(r.cost||0),ticks:Number(r.processing_ticks||0)}}}catch(t){console.warn("Failed to load project permit requirements",t),Ve=[],wt={}}ze={};const o=de.required_materials||{};for(const t of Object.keys(o))ze[t]="STD";const e=de.required_workforce||{};K=Number(e.general||0)+Number(e.skilled||0)||120,Ie=15,Jt(),Do()}function Kn(){document.getElementById("bid-assembly-overlay")?.remove(),de=null,Ve=[],wt={}}function Wr(o,e){ze[o]=e,Do()}function Yr(o){K=o,Do()}function Qr(o){Ie=o,Do()}function Do(){if(document.getElementById("bid-assembly-overlay")?.remove(),!de)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=de,i=t.issuer_type==="GOVERNMENT",n=I?.name||p?.nation||"—",a=Number(t.budget_ceiling||0),s=Number(t.timeline_ticks||8),r=t.required_materials||{},l=Object.keys(r),c={LOW:.5,STD:1,HIGH:2},f={LOW:e.orange,STD:e.yellow,HIGH:e.greenBright},d={LOW:"Low",STD:"Standard",HIGH:"High"},u={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},m=wn||{};let v=0,x="";for(const O of l){const V=Number(r[O]||0),Zn=ze[O]||"STD",ei=u[O]||3e5,ma=c[Zn],ua=Math.round(ei*ma),ti=V*ua;v+=ti;const va=O.replace(/_/g," ").replace(/\b\w/g,Le=>Le.toUpperCase()),oi=Number(m[O]||0),Fo=Math.max(0,V-oi),ya=Fo===0?e.greenBright:Fo<V?e.yellow:e.red,ga=Fo===0?"✓ IN STOCK":`${oi}/${V}`;x+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${e.text}">${va}</span>
                <div style="font-family:${o};font-size:7px;color:${ya};margin-top:1px">${ga}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${o};font-size:9px;color:${e.muted}">${V.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(Le=>{const Uo=Zn===Le,ni=f[Le],xa=_(Math.round(ei*c[Le]));return`<span onclick="bidSetGrade('${O}','${Le}')" style="padding:2px 6px;font-family:${o};font-size:7px;font-weight:700;cursor:pointer;color:${Uo?"#000":e.dim};background:${Uo?ni:"transparent"};border:1px solid ${Uo?ni:e.border}" title="${xa}/unit">${d[Le]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${o};font-size:10px;color:${e.text}">${_(ti)}</span></div>
        </div>`}const b=t.required_workforce||{},$=Number(b.general||0)+Number(b.skilled||0)||100,h=Math.max(40,Math.round($*.5)),E=$*2,T=[h,Math.round($*.75),$,Math.round($*1.5),E],S=Math.max(0,Math.min(1,(K-h)/(E-h||1))),w=s,C=Math.round(4.5-S*8),M=Math.max(Math.round(w*.6),w+C),k=C>0?`+${C}mo`:C<0?`${C}mo`:"On schedule",N=C>0?e.red:C<0?e.greenBright:e.yellow,R=15200,P=K*R*M,G=(Ve||[]).map(O=>{const V=wt[O.permit_key]||{};return{permit_key:O.permit_key,name:O.permit_name||O.permit_key,requiredByPolicy:O.required_by_policy||"—",hasPermit:!!O.has_permit,statusLabel:O.status_label||(O.has_permit?"HAS_PERMIT":"NEEDS_TO_GET"),cost:Number(V.cost||0),ticks:Number(V.ticks||0)}}),U=G.filter(O=>!O.hasPermit).reduce((O,V)=>O+V.cost,0),ne=4e5,B=v+P+U+ne,D=Math.round(B*(Ie/100)),L=B+D,F=L>a,X=D,H=F?0:Math.max(0,Math.min(100,Math.round(100-L/a*100+30))),Re=H>70?e.greenBright:H>40?e.yellow:H>0?e.orange:e.red,io=F?"OVER CEILING":H>70?"STRONG":H>40?"COMPETITIVE":H>20?"WEAK":"UNLIKELY",It=Object.values(ze),Z=It.length>0?Math.round(It.reduce((O,V)=>O+(V==="HIGH"?85:V==="STD"?65:45),0)/It.length):50,ao=Z>=75?e.greenBright:Z>=55?e.yellow:e.orange,fa=Z>=75?"STRONG":Z>=55?"PROMISING":"UNCERTAIN",it=document.createElement("div");it.id="bid-assembly-overlay",it.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",it.addEventListener("click",O=>{O.target===it&&Kn()}),it.innerHTML=`
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
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(v)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Labor</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim};width:60px">WORKERS</span>
                        <div style="display:flex;gap:3px;">
                            ${T.map(O=>`<span onclick="bidSetWorkers(${O})" style="padding:2px 8px;font-family:${o};font-size:8px;font-weight:700;cursor:pointer;color:${K===O?"#000":e.dim};background:${K===O?e.accent:"transparent"};border:1px solid ${K===O?e.accent:e.border}">${O}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">${K} × $${R.toLocaleString()}/tick × ${M} ticks</span>
                        <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(P)}</span>
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
                        <span style="font-family:${o};font-size:10px;font-weight:700;color:${N}">${M}mo <span style="font-size:8px;opacity:0.7">(${k})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${G.length===0?`<div style="padding:8px 14px;border-bottom:1px solid ${e.border};font-family:${o};font-size:8px;color:${e.dim};">No active permit laws apply to this project.</div>`:""}
                ${G.map(O=>{const V=O.hasPermit;return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
                        <div style="flex:1;display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${o};font-size:8px;font-weight:700;color:${V?e.greenBright:e.orange}">${V?"✓":"○"}</span>
                            <span style="font-size:10px;color:${V?e.muted:e.text}">${O.name}</span>
                        </div>
                        ${V?`<span style="font-family:${o};font-size:8px;color:${e.greenBright}">${O.statusLabel}</span>`:`<div style="text-align:right">
                                <span style="font-family:${o};font-size:9px;color:${e.redDim}">${_(O.cost)}</span>
                                <span style="font-family:${o};font-size:7px;color:${e.dim};margin-left:4px">${O.ticks}t</span>
                            </div>`}
                    </div><div style="padding:0 14px 4px 28px;border-bottom:1px solid ${e.border};font-family:${o};font-size:7px;color:${e.dim};">Required by: ${g(O.requiredByPolicy)}</div>`}).join("")}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${o};font-size:9px;color:${e.muted}">PERMIT COSTS</span>
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(U)}</span>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${o};font-size:9px;color:${e.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(ne)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v},{l:"Labor",v:P},{l:"Permits",v:U},{l:"Overhead",v:ne}].map(O=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-size:10px;color:${e.muted}">${O.l}</span>
                    <span style="font-family:${o};font-size:10px;color:${e.redDim}">${_(O.v)}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:rgba(204,85,85,0.03);">
                    <span style="font-family:${o};font-size:10px;font-weight:700;color:${e.text}">TOTAL EST. COST</span>
                    <span style="font-family:${o};font-size:13px;font-weight:700;color:${e.red}">${_(B)}</span>
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

                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${F?"rgba(204,85,85,0.04)":"rgba(200,168,50,0.03)"};">
                    <div style="font-family:${o};font-size:8px;color:${e.dim};margin-bottom:4px">YOUR BID PRICE</div>
                    <div style="font-family:${o};font-size:22px;font-weight:700;color:${F?e.red:e.gold}">${_(L)}</div>
                    ${F?`<div style="font-family:${o};font-size:8px;font-weight:700;color:${e.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${_(a)})</div>`:""}
                </div>

                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">PROJECTED PROFIT</span>
                        <span style="font-family:${o};font-size:14px;font-weight:700;color:${X>0?e.greenBright:e.dim}">+${_(X)}</span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Bid Assessment</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">COMPETITIVENESS</span>
                        <span style="font-family:${o};font-size:11px;font-weight:700;color:${Re}">${io}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${H}%;height:100%;background:${Re}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${o};font-size:11px;font-weight:700;color:${ao}">${Z}</span>
                            <span style="font-family:${o};font-size:8px;color:${e.dim}">/100</span>
                            <span style="font-family:${o};font-size:8px;font-weight:700;color:${ao}">${fa}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${Z}%;height:100%;background:${ao}"></div></div>
                    <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="font-family:${o};font-size:8px;color:${e.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${mt.length===0?`<div style="font-family:${o};font-size:8px;color:${e.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${mt.map(O=>`<span style="padding:2px 6px;font-family:${o};font-size:7px;color:${e.muted};background:${e.card};border:1px solid ${e.border};">${O.name} <span style="color:${e.dim}">Q:${O.quality}</span></span>`).join("")}
                        </div>
                        <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:3px">${mt.length} competing bid${mt.length!==1?"s":""}. Bid prices are sealed until resolution.</div>`}
                    <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:3px">Higher reputation bidders may win at higher prices.</div>
                </div>
                <div style="flex:1"></div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">YOUR BID</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${F?e.red:e.gold}">${_(L)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">EST. PROFIT</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${e.greenBright}">+${_(X)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${ao}">${Z}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${o};font-size:10px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="${F?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${o};font-size:10px;font-weight:700;letter-spacing:1px;color:${F?e.dim:"#000"};background:${F?e.border:e.gold};cursor:${F?"not-allowed":"pointer"};opacity:${F?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(it)}let nn=!1;async function Kr(){if(nn||!de)return;const o=de,e=o.required_materials||{},t=Object.keys(e),i=Number(o.budget_ceiling||0),n=Number(o.timeline_ticks||8),a={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},s={LOW:.5,STD:1,HIGH:2};let r=0;for(const M of t){const k=Number(e[M]||0),N=ze[M]||"STD",R=a[M]||3e5;r+=k*Math.round(R*s[N])}const l=15200,c=o.required_workforce||{},f=Number(c.general||0)+Number(c.skilled||0)||100,d=Math.max(40,Math.round(f*.5)),u=f*2,m=Math.max(0,Math.min(1,(K-d)/(u-d||1))),v=Math.round(4.5-m*8),x=Math.max(Math.round(n*.6),n+v),b=K*l*x,$=(Ve||[]).filter(M=>!M.has_permit).reduce((M,k)=>M+Number(wt[k.permit_key]?.cost||0),0),E=r+b+$+4e5,T=Math.round(E*(Ie/100)),S=E+T;if(S>i){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const w=Object.values(ze),C=w.length>0?Math.round(w.reduce((M,k)=>M+(k==="HIGH"?85:k==="STD"?65:45),0)/w.length):50;if(confirm('Submit bid for "'+o.name+`"?

Bid Price: `+_(S)+`
Est. Cost: `+_(E)+`
Markup: `+Ie+"% ("+_(T)+`)
Quality: `+C+`/100
Workers: `+K+`

Once submitted, your bid cannot be changed.`)){nn=!0;try{const{data:M}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),k=M?.current_tick||0,N={};for(const P of t)N[P]=ze[P]||"STD";const{error:R}=await y.from("contract_bids").insert({contract_id:o.id,faction_id:p.id,bid_price:S,material_grades:N,labor_count:K,markup_pct:Ie,estimated_cost:E,estimated_quality:C,status:"pending",submitted_at_tick:k});if(R)throw R;o.status==="open"&&await y.from("construction_contracts").update({status:"bidding"}).eq("id",o.id).eq("status","open"),Kn(),alert(`Bid submitted successfully!

Contract: `+o.name+`
Your Bid: `+_(S)+`
Quality: `+C+`/100

Bids will be resolved when the bidding window closes (`+(o.bidding_ends_tick?"tick "+o.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof Ne=="function"&&await Ne()}catch(M){alert("Bid submission failed: "+M.message)}finally{nn=!1}}}window.openBidAssembly=Vr;window.closeBidAssembly=Kn;window.bidSetGrade=Wr;window.bidSetWorkers=Yr;window.bidSetMarkup=Qr;window.submitBidAssembly=Kr;let an=!1;async function Jr(o){if(an)return;const e=1e6,t=Number(p?.corp_cash_reserves??0);if(t<e){alert("Cannot retract — you need at least $1M in cash reserves to cover the retraction penalty.");return}if(confirm(`Retract your bid?

This will cost $1M as a retraction penalty.
This action cannot be undone.`)){an=!0;try{const i=t-e,{error:n}=await y.from("factions").update({corp_cash_reserves:i}).eq("id",p.id);if(n)throw n;const{error:a}=await y.from("contract_bids").delete().eq("contract_id",o).eq("faction_id",p.id);if(a)throw a;p.corp_cash_reserves=i,typeof Ze=="function"&&Ze(i),alert("Bid retracted. $1M penalty applied."),Jt(),await Ne()}catch(i){alert("Failed to retract bid: "+(i.message||"Unknown error"))}finally{an=!1}}}window.retractBid=Jr;let Yt=[],We=0,ye=null,sn=!1,rn=!1,ln=!1;async function Xr(){if(!Qe||rn)return;rn=!0,ye=Qe,We=0;const{data:o,error:e}=await y.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",ye.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(rn=!1,e){alert("Failed to load bids: "+e.message);return}Yt=(o||[]).map(t=>({...t,corp:t.factions?.faction_name||"Unknown",abbr:t.factions?.corp_ticker||"???",subsector:t.factions?.corp_subsector||"—"})),Jt(),sa()}function jo(){document.getElementById("bid-review-overlay")?.remove(),ye=null}function Zr(o){We=o,sa()}async function el(){if(sn||Yt.length===0)return;const o=Yt[We];if(!(!o?.id||!o.faction_id)&&confirm("Accept bid from "+o.corp+`?

Bid Price: `+_(o.bid_price)+`
Quality: `+o.estimated_quality+`/100
Workers: `+o.labor_count+`

This will award the contract. The project begins immediately.`)){sn=!0;try{const{data:e}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{error:i}=await y.from("contract_bids").update({status:"won"}).eq("id",o.id);if(i)throw i;const{error:n}=await y.from("contract_bids").update({status:"lost"}).eq("contract_id",ye.id).neq("id",o.id);if(n)throw n;const{error:a}=await y.from("construction_contracts").update({status:"awarded",awarded_to_faction:o.faction_id,awarded_at_tick:t}).eq("id",ye.id);if(a)throw a;jo(),alert("Contract awarded to "+o.corp+`!

Bid: `+_(o.bid_price)+`
Project begins immediately.`),typeof Ne=="function"&&await Ne()}catch(e){alert("Failed to accept bid: "+(e.message||e))}finally{sn=!1}}}async function tl(){if(!(!ye||ln)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){ln=!0;try{const{error:o}=await y.from("contract_bids").update({status:"lost"}).eq("contract_id",ye.id);if(o)throw o;const{error:e}=await y.from("construction_contracts").update({status:"expired"}).eq("id",ye.id);if(e)throw e;jo(),alert("All bids declined. Contract cancelled."),typeof Ne=="function"&&await Ne()}catch(o){alert("Failed: "+(o.message||o))}finally{ln=!1}}}function sa(){if(document.getElementById("bid-review-overlay")?.remove(),!ye||Yt.length===0)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=ye,i=Yt;We>=i.length&&(We=0);const n=i[We],a=Number(t.budget_ceiling||0),s=Number(t.timeline_ticks||36),r=Math.min(...i.map(m=>m.bid_price)),l=Math.max(...i.map(m=>m.estimated_quality||0));let c="";for(let m=0;m<i.length;m++){const v=i[m],x=m===We,b=v.bid_price===r,$=(v.estimated_quality||0)===l,h=v.bid_price>a;c+=`
        <div onclick="reviewSelectBid(${m})" style="padding:10px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${x?e.accent:"transparent"};background:${x?"rgba(139,154,107,0.03)":"transparent"};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-family:${o};font-size:10px;font-weight:700;color:${e.gold}">${v.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${e.text}">${v.corp}</span>
                ${b?`<span style="font-family:${o};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.greenBright};background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2)">CHEAPEST</span>`:""}
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
        </div>`}const f=n.bid_price>a,d=a>0?Math.round(n.bid_price/a*100):0,u=document.createElement("div");u.id="bid-review-overlay",u.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",u.addEventListener("click",m=>{m.target===u&&jo()}),u.innerHTML=`
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
                    <span style="font-family:${o};font-size:10px;color:${e.muted}">${_(Math.round(m.v))}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:${f?"rgba(204,85,85,0.03)":"rgba(200,168,50,0.03)"};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;color:${e.text}">TOTAL BID</span>
                    <span style="font-family:${o};font-size:14px;font-weight:700;color:${f?e.red:e.gold}">${_(n.bid_price)}</span>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">vs. YOUR BUDGET</span>
                        <span style="font-family:${o};font-size:9px;font-weight:700;color:${f?e.red:e.greenBright}">${f?"OVER":"WITHIN"} — ${d}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${e.border}"><div style="width:${Math.min(100,d)}%;height:100%;background:${f?e.red:e.accent}"></div></div>
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
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">SELECTED BID</div><div style="font-family:${o};font-size:12px;font-weight:700;color:${e.gold}">${_(n.bid_price)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">CORPORATION</div><div style="font-family:${o};font-size:12px;font-weight:700;color:${e.text}">${n.corp}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${o};font-size:12px;font-weight:700;color:${(n.estimated_quality||0)>=75?e.greenBright:e.yellow}">${n.estimated_quality}</div></div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="declineAllBids()" style="padding:6px 16px;font-family:${o};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">DECLINE ALL</div>
                <div onclick="acceptBid()" style="padding:6px 20px;font-family:${o};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${e.accent};cursor:pointer">ACCEPT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(u)}const Ct={Coastal:{color:"#8b9a6b",label:"COASTAL"},Container:{color:"#5a7aaa",label:"CONTAINER"},Bulk:{color:"#c8a832",label:"BULK"},Tanker:{color:"#c86a4a",label:"TANKER"},Reefer:{color:"#6a9a5a",label:"REEFER"},LNG:{color:"#c55",label:"LNG"}},ol={in_port:{color:"#8b9a6b",label:"IN PORT"},in_transit:{color:"#5a8aaa",label:"IN TRANSIT"},dry_dock:{color:"#c84",label:"DRY DOCK"},anchored:{color:"#ca5",label:"ANCHORED"},for_sale:{color:"#9e9a92",label:"FOR SALE"}};function ra(o){return o>=75?"#5c5":o>=50?"#ca5":o>=25?"#c84":"#c55"}function nl(o){return o>=60?"#5c5":o>=30?"#ca5":o>=15?"#c84":"#c55"}async function he(){if(!p||p.corp_sector!=="Shipping")return;const{data:o,error:e}=await y.from("corp_vessels").select("*").eq("faction_id",p.id).order("vessel_class");e&&console.warn("Failed to load fleet:",e.message),_e=o||[],Gt=null,Rt={},go={};try{const t=_e.map(i=>i.id);if(t.length>0){const{data:i}=await y.from("finance_active_loans").select("insured_vessel_id").in("insured_vessel_id",t).in("status",["current"]);for(const a of i||[])a.insured_vessel_id&&(Rt[a.insured_vessel_id]=!0);const{data:n}=await y.from("finance_loan_requests").select("insured_vessel_id").eq("requesting_faction_id",p.id).eq("request_type","insurance").eq("status","open").not("insured_vessel_id","is",null);for(const a of n||[])a.insured_vessel_id&&!Rt[a.insured_vessel_id]&&(go[a.insured_vessel_id]=!0)}}catch(t){console.warn("Failed to load vessel insurance status:",t.message)}la()}function il(o){Gt=Gt===o?null:o,la()}function la(){const o=document.getElementById("fl-count"),e=document.getElementById("fl-summary"),t=document.getElementById("fl-list"),i=document.getElementById("fl-footer");if(!o||!t)return;const n=_e;o.textContent=n.length+" VESSEL"+(n.length!==1?"S":"");const a=n.filter(d=>d.status==="in_transit").length,s=n.filter(d=>d.status==="in_port"||d.status==="anchored").length,r=n.filter(d=>d.status==="dry_dock").length,l=n.reduce((d,u)=>d+(u.base_maintenance||0),0);e.innerHTML=[{label:"TRANSIT",value:a,color:"#5a8aaa"},{label:"IN PORT",value:s,color:"#8b9a6b"},{label:"DRY DOCK",value:r,color:"#c84"},{label:"MAINT/TICK",value:_(l),color:"#a44"}].map((d,u)=>`<div style="flex:1;padding:5px 8px;text-align:center;${u<3?"border-right:1px solid var(--border-0);":""}">
        <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">${d.label}</div>
        <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${d.color};margin-top:1px;">${d.value}</div>
    </div>`).join(""),n.length===0?t.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels in fleet.<br>Purchase ships to begin operations.</div>':t.innerHTML=n.map((d,u)=>{const m=Gt===u,v=Ct[d.vessel_class]||{color:"#666",label:"?"},x=ol[d.status]||{color:"#666",label:"?"},b=ra(d.condition),$=nl(d.fuel),h=d.condition<50||d.fuel<20,E=d.status==="in_transit",T=d.status==="dry_dock",S=z?.current_tick||0,w=Math.max(0,Math.floor((S-(d.built_at_tick||0))/12));let C=`<div onclick="flSelectVessel(${u})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${h?d.condition<50?b:$:"transparent"};background:${m?v.color+"06":"transparent"};">
                <div style="padding:7px 14px;">`;C+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${g(d.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${v.color};background:${v.color}12;border:1px solid ${v.color}25;">${v.label}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${x.color};background:${x.color}12;border:1px solid ${x.color}25;">${x.label}</span>
            </div>`;const M=d.current_port_nation_id?"In port":E?"At sea":"—";if(C+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:5px;">${g(M)}</div>`,C+=`<div style="display:flex;gap:8px;margin-bottom:4px;">
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${b};">${d.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${d.condition}%;height:100%;background:${b};"></div></div>
                </div>
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">FUEL</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${$};">${d.fuel}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${d.fuel}%;height:100%;background:${$};"></div></div>
                </div>
            </div>`,C+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);margin-top:1px;">${(d.capacity_dwt||0).toLocaleString()} ${d.capacity_unit||"DWT"}</div>
                </div>
                <div style="flex:0.7;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">AGE</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${w}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#a44;margin-top:1px;">${_(d.base_maintenance)}</div>
                </div>
            </div>`,T&&d.drydock_until_tick){const k=Math.max(0,d.drydock_until_tick-S);C+=`<div style="margin-top:4px;padding:3px 8px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">DRY DOCK REPAIRS</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c84;">${k} tick${k!==1?"s":""} remaining</span>
                </div>`}if(m){C+=`<div style="margin-top:6px;">
                    <div style="padding:5px 8px;background:var(--bg-0);border:1px solid var(--border-0);margin-bottom:6px;">`;const k=[{label:"VESSEL CLASS",value:d.vessel_class},{label:"BUILT",value:"Tick "+(d.built_at_tick||0)},{label:"FUEL CAPACITY",value:(d.fuel_capacity||0).toLocaleString()+" tons"},{label:"LAST REFURBISH",value:d.last_refurbish_tick?"Tick "+d.last_refurbish_tick:"N/A"}];for(let U=0;U<k.length;U++)C+=`<div style="display:flex;justify-content:space-between;padding:2px 0;${U<3?"border-bottom:1px solid var(--border-0);":""}">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${k[U].label}</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);">${k[U].value}</span>
                    </div>`;C+="</div>";const N=E||T,R=Math.round((d.purchase_price||3e6)*.08*(1+(100-d.condition)/100)),P=Math.round((d.fuel_capacity||1e3)*50*(1-d.fuel/100)),G=Math.round((d.purchase_price||3e6)*(d.condition/100)*.6);if(C+=`<div style="display:flex;gap:4px;">
                    <div onclick="${N?"":"flRefurbish('"+d.id+"',"+R+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${N?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${N?"var(--text-dim)":"#5c5"};border:1px solid ${N?"var(--border-0)":"#2a5a3a"};background:${N?"transparent":"rgba(74,170,136,0.06)"};opacity:${N?.35:1};">REFURBISH<br><span style="font-weight:400;font-size:6px;">${_(R)}</span></div>
                    <div onclick="${E?"":"flRefuel('"+d.id+"',"+P+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${E?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${E?"var(--text-dim)":"#c86a4a"};border:1px solid ${E?"var(--border-0)":"rgba(200,106,74,0.3)"};opacity:${E?.35:1};">REFUEL<br><span style="font-weight:400;font-size:6px;">from ${_(P)}</span></div>
                    <div onclick="${N?"":"flSell('"+d.id+"','"+g(d.vessel_name).replace(/'/g,"")+"',"+G+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${N?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${N?"var(--text-dim)":"#c84"};border:1px solid ${N?"var(--border-0)":"rgba(204,136,68,0.3)"};opacity:${N?.35:1};">LIST<br><span style="font-weight:400;font-size:6px;">${_(G)}</span></div>
                </div>`,!E){const U=Rt&&Rt[d.id],ne=go&&go[d.id];C+='<div style="display:flex;gap:4px;margin-top:4px;">',U?C+=`<div style="flex:1;display:flex;gap:2px;">
                            <div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#5c5;border:1px solid rgba(92,204,92,0.2);background:rgba(92,204,92,0.04);">INSURED ✓</div>
                            <div onclick="event.stopPropagation();flFileClaim('${d.id}','${g(d.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#c55;border:1px solid rgba(204,85,85,0.2);background:rgba(204,85,85,0.04);">FILE CLAIM</div>
                        </div>`:ne?C+='<div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#ca5;border:1px solid rgba(202,165,50,0.2);background:rgba(202,165,50,0.04);">PENDING ⏳</div>':C+=`<div onclick="event.stopPropagation();flRequestInsurance('${d.id}','${g(d.vessel_name).replace(/'/g,"")}',${d.purchase_price||0})" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#aa7a5a;border:1px solid rgba(170,122,90,0.3);background:rgba(170,122,90,0.04);">INSURE</div>`,C+=`<div onclick="flRename('${d.id}','${g(d.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:var(--text-muted);border:1px solid var(--border-0);">RENAME</div>`,C+="</div>"}E&&(C+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel at sea — actions available on arrival</div>'),T&&(C+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel in dry dock — repairs in progress</div>'),C+="</div>"}return C+="</div></div>",C}).join("");const c={};for(const d of n)c[d.vessel_class]=(c[d.vessel_class]||0)+1;let f='<div style="display:flex;gap:6px;">';for(const[d,u]of Object.entries(Ct))c[d]&&(f+=`<div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:${u.color};border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">${u.label}</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${c[d]}</span>
        </div>`);f+="</div>",f+=`<span style="font-family:var(--font-mono);font-size:8px;color:#a44;">${_(l)}/tick</span>`,i.innerHTML=f}let ae=!1;async function al(o,e){if(ae||!p)return;const t=(_e||[]).find(m=>m.id===o);if(!t)return;const i=t.current_port_nation_id||null;let n="state",a=3,s=3,r=null,l="State Dry Dock (3x cost, 3 ticks)";if(i){const{data:m}=await y.from("corp_properties").select("id").eq("faction_id",p.id).eq("nation_id",i).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();if(m)n="own",a=1,s=2,l="Your Dry Dock (base cost, 2 ticks)";else{const{data:v}=await y.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",p.id).eq("nation_id",i).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();v&&(n="other",a=1.2,s=2,r=v.faction_id,l=(v.factions?.faction_name||"Another corp")+"'s Dry Dock (+20%, 2 ticks)")}}else l="State Dry Dock (3x cost, 3 ticks) — no private dock in port";const c=Math.round(e*a),{data:f}=await y.from("factions").select("corp_cash_reserves").eq("id",p.id).single(),d=Number(f?.corp_cash_reserves??0);if(d<c){alert("Insufficient cash. Need "+_(c)+", have "+_(d)+".");return}if(!confirm("Send "+(t.vessel_name||"vessel")+` to dry dock?

Dock: `+l+`
Cost: `+_(c)+`
Duration: `+s+` ticks
Condition restored to 85-100%.`))return;ae=!0;const u=z?.current_tick||0;try{const{error:m}=await y.from("factions").update({corp_cash_reserves:d-c}).eq("id",p.id);if(m){alert("Failed: "+m.message);return}if(n==="other"&&r){const x=c-e,{data:b}=await y.from("factions").select("corp_cash_reserves").eq("id",r).single();b&&await y.from("factions").update({corp_cash_reserves:Number(b.corp_cash_reserves||0)+x}).eq("id",r)}const{error:v}=await y.from("corp_vessels").update({status:"dry_dock",drydock_until_tick:u+s,active_claim_id:null}).eq("id",o);if(v){await y.from("factions").update({corp_cash_reserves:d}).eq("id",p.id),alert("Failed: "+v.message);return}p.corp_cash_reserves=d-c,await he()}catch(m){alert("Dry dock failed: "+(m.message||"Error"))}finally{ae=!1}}async function sl(o,e){if(ae||!p)return;if(e<=0){alert("Fuel tanks are already full.");return}const t=(_e||[]).find(d=>d.id===o);if(!t)return;const i=t.current_port_nation_id||p.nation_id;let n="state",a=3,s=null,r="State Fuel (3x cost) — no private depot in port";if(i){const{data:d}=await y.from("corp_properties").select("id").eq("faction_id",p.id).eq("nation_id",i).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(d)n="own",a=1,r="Your Fuel Depot (base cost)";else{const{data:u}=await y.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",p.id).eq("nation_id",i).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();u&&(n="other",a=1.15,s=u.faction_id,r=(u.factions?.faction_name||"Another corp")+"'s Fuel Depot (+15%)")}}const l=Math.round(e*a),{data:c}=await y.from("factions").select("corp_cash_reserves").eq("id",p.id).single(),f=Number(c?.corp_cash_reserves??0);if(f<l){alert("Insufficient cash. Need "+_(l)+", have "+_(f)+".");return}if(confirm("Refuel "+(t.vessel_name||"vessel")+`?

Source: `+r+`
Cost: `+_(l)+`
Fuel restored to 100%.`)){ae=!0;try{const{error:d}=await y.from("factions").update({corp_cash_reserves:f-l}).eq("id",p.id);if(d){alert("Failed: "+d.message);return}if(n==="other"&&s){const m=l-e,{data:v}=await y.from("factions").select("corp_cash_reserves").eq("id",s).single();v&&await y.from("factions").update({corp_cash_reserves:Number(v.corp_cash_reserves||0)+m}).eq("id",s)}const{error:u}=await y.from("corp_vessels").update({fuel:100}).eq("id",o);if(u){await y.from("factions").update({corp_cash_reserves:f}).eq("id",p.id),alert("Failed: "+u.message);return}p.corp_cash_reserves=f-l,await he()}catch(d){alert("Refuel failed: "+(d.message||"Error"))}finally{ae=!1}}}async function rl(o,e,t){if(ae||!p||!z||!confirm("List "+e+" on the Ship Market for "+_(t)+`?

The vessel will be removed from your fleet and listed for sale. You will receive payment when another corporation purchases it.`))return;ae=!0;const i=z.current_tick||0,n=_e.find(l=>l.id===o);if(!n){ae=!1;return}const a=Math.max(0,i-(n.built_at_tick||0)),{error:s}=await y.from("ship_market_listings").insert({nation_id:p.nation_id,vessel_name:n.vessel_name,vessel_class:n.vessel_class,capacity_dwt:n.capacity_dwt,capacity_unit:n.capacity_unit,condition:n.condition,fuel:n.fuel,age_ticks:a,fuel_capacity:n.fuel_capacity,base_maintenance:n.base_maintenance,asking_price:t,purchase_price_new:n.purchase_price||t,seller_type:"CORP",seller_name:p.faction_name,seller_faction_id:p.id,sale_reason:"Listed for sale by "+(p.faction_name||"corporation"),status:"available",listed_at_tick:i});if(s){alert("Failed to create listing: "+s.message),ae=!1;return}const{error:r}=await y.from("corp_vessels").delete().eq("id",o);if(r){await y.from("ship_market_listings").delete().eq("seller_faction_id",p.id).eq("vessel_name",n.vessel_name).eq("listed_at_tick",i),alert("Failed to remove vessel: "+r.message),ae=!1;return}ae=!1,Gt=null,await Promise.all([he(),ca()])}async function ll(o,e){const t=prompt("Rename vessel:",e);if(!t||t.trim()===e||t.trim().length<2)return;const{error:i}=await y.from("corp_vessels").update({vessel_name:t.trim().slice(0,40)}).eq("id",o);if(i){alert("Failed: "+i.message);return}await he()}async function cl(o,e,t){if(!p||!z||!confirm("Request insurance for "+e+`?

Insurance corporations will see this in their Deal Flow and can offer coverage terms.

Vessel value: `+_(t)))return;const i=z.current_tick||0,{error:n}=await y.from("finance_loan_requests").insert({requesting_faction_id:p.id,nation_id:p.nation_id,request_type:"insurance",insured_vessel_id:o,amount:t,term_months:0,purpose:"Vessel Insurance — "+e,status:"open",created_tick:i,expires_tick:i+12});if(n){n.message.includes("duplicate")||n.message.includes("unique")?alert("Insurance already requested for this vessel."):alert("Failed to request insurance: "+n.message);return}alert(`Insurance request posted to Deal Flow.

Insurance corporations can now offer coverage for `+e+"."),await he()}let cn=!1;async function dl(o,e){if(cn||!p||!z)return;const t=prompt(`Describe the claim reason:

e.g., "Storm damage during transit — hull breach repaired at sea" or "Engine failure requiring emergency dry dock"`);if(!t||t.trim().length<5)return;const i=z.current_tick||0,{data:n}=await y.from("finance_active_loans").select("id, lender_faction_id, principal, deductible_pct").eq("insured_vessel_id",o).eq("status","current").limit(1).maybeSingle();if(!n){alert("No active insurance policy found for this vessel.");return}const a=Number(n.principal||0),s=Number(n.deductible_pct||10),r=Math.round(a*s/100);if(!confirm("File insurance claim for "+e+`?

Coverage: `+_(a)+`
Deductible: `+s+"% ("+_(r)+`)

Reason: `+t.trim()+`

The insurer will review this claim and determine the payout.`))return;cn=!0;const{error:l}=await y.from("event_log").insert({nation_id:p.nation_id,faction_id:p.id,event_name:(p.faction_name||"Corporation")+" — Insurance Claim Filed",description_used:(p.faction_name||"A shipping corporation")+" has filed an insurance claim for vessel "+e+". Reason: "+t.trim().replace(/[<>"]/g,""),category:"business",trigger_key:"vessel_insurance_claim",effects_applied:{vessel_id:o,vessel_name:e,policy_id:n.id,insurer_faction_id:n.lender_faction_id,coverage:a,deductible_pct:s,claim_reason:t.trim()},fired_at_tick:i});l&&console.warn("Failed to log insurance claim event:",l.message);const{error:c}=await y.from("finance_active_loans").update({claims_paid:(n.claims_paid||0)+1}).eq("id",n.id);c&&console.warn("Failed to update claims_paid:",c.message),cn=!1,alert("Insurance claim filed for "+e+`.

The insurer (`+_(a)+" coverage) has been notified. Claim details are visible in the events feed.")}window.flRequestInsurance=cl;window.flFileClaim=dl;const kn={fuel_depot:{label:"FUEL DEPOT",color:"#c86a4a",icon:"⛽",desc:"Bunkering facility — refuel at base cost, earn revenue from visiting fleets."},dry_dock:{label:"DRY DOCK",color:"#c84",icon:"🔧",desc:"Repair & maintenance dock — dock at base cost, earn revenue from visiting fleets."}},pl=[{type:"fuel_depot",name:"Fuel Depot — Standard",cost:105e6,maint:85e3,style:"Basic",desc:"Bulk fuel storage and bunkering facility."},{type:"fuel_depot",name:"Fuel Depot — Advanced",cost:14e7,maint:11e4,style:"Modern",desc:"High-capacity fuel terminal with pipeline infrastructure."},{type:"dry_dock",name:"Dry Dock — Standard",cost:85e6,maint:15e4,style:"Basic",desc:"Ship repair and maintenance facility."},{type:"dry_dock",name:"Dry Dock — Advanced",cost:115e6,maint:2e5,style:"Modern",desc:"Full-service shipyard with drydock and crane facilities."}];let To=[];async function fl(){if(!p||p.corp_sector!=="Shipping")return;const{data:o}=await y.from("corp_properties").select("*").eq("faction_id",p.id).in("type",["fuel_depot","dry_dock"]).eq("is_active",!0).order("created_at",{ascending:!1});To=o||[],ml()}function ml(){const o=document.getElementById("pf-count"),e=document.getElementById("pf-list"),t=document.getElementById("pf-footer");if(!o||!e||!t)return;const i=To;if(o.textContent=i.length+" FACILIT"+(i.length===1?"Y":"IES"),i.length===0)e.innerHTML=`<div style="padding:20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-bottom:6px;">No port facilities built.</div>
            <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Build a <span style="color:#c86a4a;font-weight:700;">Fuel Depot</span> to refuel your fleet at base cost<br>and earn revenue from other corps refueling here.<br>Build a <span style="color:#c84;font-weight:700;">Dry Dock</span> to repair vessels at base cost.</div>
        </div>`;else{let s=0;e.innerHTML=i.map(r=>{const l=kn[r.type]||kn.fuel_depot,c=r.condition>=75?"#5c5":r.condition>=50?"#ca5":"#c84";return s+=Number(r.monthly_maintenance||0),`<div style="padding:8px 12px;border-bottom:1px solid var(--border-0);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${l.icon}</span>
                        <span style="font-size:11px;font-weight:600;color:var(--text-bright);">${g(r.name)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${l.color};background:${l.color}12;border:1px solid ${l.color}25;">${l.label}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:4px;">${r.city||"Port"} · ${(r.style||"Basic").toUpperCase()}</div>
                <div style="display:flex;gap:12px;margin-bottom:4px;">
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${c};">${r.condition}%</span>
                        </div>
                        <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${r.condition}%;height:100%;background:${c};"></div></div>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#a44;">${_(r.monthly_maintenance||0)}</span>
                        </div>
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">VALUE: ${_(r.purchase_price||0)}</div>
                    </div>
                </div>
            </div>`}).join("")}Number(p?.corp_cash_reserves??0);const n=i.some(s=>s.type==="fuel_depot"),a=i.some(s=>s.type==="dry_dock");t.innerHTML=`
        <div onclick="pfOpenBuild('fuel_depot')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c86a4a;border:1px solid rgba(200,106,74,0.3);background:rgba(200,106,74,0.04);">
            ${n?"+ FUEL DEPOT":"BUILD FUEL DEPOT"}
        </div>
        <div onclick="pfOpenBuild('dry_dock')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c84;border:1px solid rgba(204,136,68,0.3);background:rgba(204,136,68,0.04);">
            ${a?"+ DRY DOCK":"BUILD DRY DOCK"}
        </div>`}let dn=!1;async function ul(o){if(dn||!p||!z)return;const e=pl.filter(b=>b.type===o);if(e.length===0)return;const t=kn[o],i=p.nation_id,n=I?.name||p?.nation||"Home Nation",a=I?.capital||"Port City",s=[{id:i,name:n,capital:a,label:"National HQ"}],{data:r}=await y.from("corp_properties").select("nation_id, name, city, nations!nation_id(name, capital)").eq("faction_id",p.id).eq("type","regional_hq").eq("is_active",!0);for(const b of r||[])b.nation_id!==i&&s.push({id:b.nation_id,name:b.nations?.name||b.city||"Unknown",capital:b.nations?.capital||b.city||"Port City",label:b.name||"Subsidiary"});let l=s[0];if(s.length>1){let b=t.label+` — SELECT LOCATION
`+"─".repeat(30)+`
`;b+=`Build in which nation?

`;for(let E=0;E<s.length;E++){const T=s[E],S=To.filter(w=>w.type===o&&w.nation_id===T.id).length;b+=E+1+". "+T.name+"  ("+T.label+")",S>0&&(b+="  ["+S+" existing]"),b+=`
`}b+=`
Enter number (or cancel):`;const $=prompt(b);if(!$)return;const h=parseInt($,10)-1;if(isNaN(h)||h<0||h>=s.length){alert("Invalid selection.");return}l=s[h]}const c=To.filter(b=>b.type===o&&b.nation_id===l.id).length;let f=t.label+" CONSTRUCTION — "+l.name.toUpperCase()+`
`+"─".repeat(30)+`
`;c>0&&(f+="You already have "+c+" "+t.label.toLowerCase()+(c>1?"s":"")+` here.

`),f+=t.desc+`

`;for(let b=0;b<e.length;b++){const $=e[b];f+=b+1+". "+$.name+`
`,f+="   Cost: "+_($.cost)+" · Maint: "+_($.maint)+`/tick
`,f+="   "+$.desc+`

`}f+="Enter 1 or 2 to select (or cancel):";const d=prompt(f);if(!d)return;const u=parseInt(d,10)-1;if(isNaN(u)||u<0||u>=e.length){alert("Invalid selection.");return}const m=e[u];if(!confirm("Commission "+m.name+" in "+l.capital+", "+l.name+`?

Budget: `+_(m.cost)+`

This will create a construction contract that construction corporations can bid on. Payment occurs when the contract is awarded.`))return;dn=!0;const v=z.current_tick||0,x=(z.current_date||"").match(/\d{4}/)?.[0]||"2015";try{const{count:b}=await y.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",l.id).eq("issuer_type","PRIVATE"),h=`PVT-P${(b||0)+1}-${x}`,E=m.style==="Modern",T={concrete:E?6:4,steel:E?5:3,heavy_parts:E?3:2,aggregate:E?3:2},S={trucks:1,mixers:1,excavators:1},w={general:E?12:8,skilled:E?5:3},C=E?6:4,{error:M}=await y.from("construction_contracts").insert({nation_id:l.id,template_key:o,sector:"industrial",name:m.name,project_type:t.label,project_subtype:m.style,description:`${m.name} at ${l.capital} Port — commissioned by ${p.faction_name}. ${m.desc}`,project_code:h,budget_ceiling:m.cost,timeline_ticks:C,required_materials:T,required_equipment:S,required_workforce:w,status:"open",generated_at_tick:v,bidding_ends_tick:v+3,issuer_type:"PRIVATE",issuer_name:p.faction_name,issuer_faction_id:p.id});if(M)throw M;await fl(),alert(`Construction contract posted!

Project: `+m.name+`
Location: `+l.capital+", "+l.name+`
Code: `+h+`
Budget: `+_(m.cost)+`
Timeline: `+C+` ticks

Construction corporations in `+l.name+" can now bid on this project.")}catch(b){alert("Failed to post contract: "+(b.message||"Error"))}finally{dn=!1}}window.pfOpenBuild=ul;const Jn={"Bulk Cargo":["Reefer","Bulk","Coastal"],"Container Freight":["Coastal","Container"],"Specialized Transport":["Tanker","LNG","Bulk"]};async function ca(){if(!p||p.corp_sector!=="Shipping")return;const{data:o,error:e}=await y.from("ship_market_listings").select("*, nation:nation_id(id, name)").eq("status","available").order("asking_price",{ascending:!0});e&&console.warn("Failed to load ship market:",e.message),Tn=o||[],xo=null,da()}function vl(o){xo=xo===o?null:o,da()}function yl(o){return(Jn[p?.corp_subsector]||[]).includes(o)}function da(){const o=document.getElementById("sm-count"),e=document.getElementById("sm-list"),t=document.getElementById("sm-footer");if(!o||!e)return;const i=Tn;o.textContent=i.length+" AVAILABLE",i.length===0?e.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels on the market.<br>Check back next cycle.</div>':e.innerHTML=i.map((s,r)=>{const l=xo===r,c=Ct[s.vessel_class]||{color:"#666",label:"?"},f=s.seller_type==="CORP"?"#5a8aaa":"#8b9a6b",d=ra(s.condition),u=s.nation?.name||"—",m=yl(s.vessel_class);z?.current_tick;const v=s.age_ticks||0,x=Math.max(1,Math.floor(v/12)),b=u!==p?.nation?Number(p?.tariffs||I?.tariffs||0):0,$=Math.round(s.asking_price*b/100),h=s.asking_price+$;let E=`<div onclick="smSelectListing(${r})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${l?c.color:"transparent"};background:${l?c.color+"06":"transparent"};">
                <div style="padding:8px 14px;">`;return E+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${g(s.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${c.color};background:${c.color}12;border:1px solid ${c.color}25;">${c.label}</span>
            </div>`,E+=`<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;">
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${f};background:${f}12;border:1px solid ${f}25;">${s.seller_type}</span>
                <span style="font-size:9px;color:var(--text-muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${g(s.seller_name||"—")}</span>
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;">${u.toUpperCase().slice(0,6)}</span>
                ${b>0?`<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">+${b}%</span>`:""}
            </div>`,E+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-0);">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);margin-top:1px;">${(s.capacity_dwt||0).toLocaleString()} ${s.capacity_unit||"DWT"}</div>
                </div>
                <div style="flex:0.6;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">COND</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${d};margin-top:1px;">${s.condition}%</div>
                </div>
                <div style="flex:0.5;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">AGE</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${x}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">PRICE</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--gold);margin-top:1px;">${_(s.asking_price)}</div>
                </div>
            </div>`,l&&(E+='<div style="margin-top:6px;">',E+=`<div style="padding:4px 8px;margin-bottom:5px;background:var(--bg-0);border:1px solid var(--border-0);">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0);">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CARRIES</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${c.color};">${(Ct[s.vessel_class]||{}).label||"?"} class cargo</span>
                    </div>
                    <div style="padding:3px 0;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:1px;">REASON FOR SALE</div>
                        <div style="font-size:9px;color:var(--text-muted);line-height:1.4;">${g(s.sale_reason||"—")}</div>
                    </div>
                </div>`,E+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                    <div style="width:40px;height:3px;background:var(--border-0);"><div style="width:${s.condition}%;height:100%;background:${d};"></div></div>
                    ${s.condition<60?'<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">May need dry dock</span>':""}
                </div>`,b>0&&(E+=`<div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:8px;margin-bottom:3px;">
                        <span style="color:var(--text-dim);">Import tariff (${b}%)</span>
                        <span style="color:#c84;">+${_($)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;margin-bottom:5px;">
                        <span style="color:var(--text-bright);">TOTAL</span>
                        <span style="color:var(--gold);">${_(h)}</span>
                    </div>`),m?E+=`<div onclick="event.stopPropagation();smPurchase('${s.id}',${h})" style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${c.color};cursor:pointer;">${_(h)} — PURCHASE</div>`:E+=`<div style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:var(--text-dim);border:1px solid var(--border-0);opacity:0.4;">⊘ ${s.vessel_class} not available for ${p?.corp_subsector||"your subsector"}</div>`,E+="</div>"),E+="</div></div>",E}).join("");const n=i.filter(s=>s.seller_type==="CORP").length,a=i.filter(s=>s.seller_type==="LOCAL").length;t.innerHTML=`<div style="display:flex;gap:6px;">
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
    <div onclick="smOpenCommission()" style="padding:4px 14px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--gold);border:1px solid rgba(200,168,50,0.3);cursor:pointer;">COMMISSION VESSEL</div>`}let rt=!1;async function gl(o,e){if(rt||!p||!z)return;const t=Number(p.corp_cash_reserves??0);if(t<e){alert("Insufficient cash. Need "+_(e)+".");return}if(!confirm("Purchase this vessel for "+_(e)+"?"))return;rt=!0;const i=Tn.find(d=>d.id===o);if(!i){rt=!1;return}const n=z.current_tick||0,a={Coastal:{capacity_dwt:14e3,capacity_unit:"DWT",base_maintenance:18e4,fuel_capacity:800,purchase_price:3e6},Container:{capacity_dwt:4800,capacity_unit:"TEU",base_maintenance:29e4,fuel_capacity:2100,purchase_price:65e6},Bulk:{capacity_dwt:28e3,capacity_unit:"DWT",base_maintenance:35e4,fuel_capacity:1800,purchase_price:3e6},Tanker:{capacity_dwt:42e3,capacity_unit:"DWT",base_maintenance:38e4,fuel_capacity:2400,purchase_price:53e6},Reefer:{capacity_dwt:12e3,capacity_unit:"DWT",base_maintenance:28e4,fuel_capacity:1600,purchase_price:6e6},LNG:{capacity_dwt:18e3,capacity_unit:"DWT",base_maintenance:58e4,fuel_capacity:1400,purchase_price:78e6}},s=a[i.vessel_class]||a.Coastal,{error:r}=await y.from("factions").update({corp_cash_reserves:t-e}).eq("id",p.id);if(r){alert("Failed: "+r.message),rt=!1;return}const{error:l}=await y.from("corp_vessels").insert({faction_id:p.id,nation_id:p.nation_id,vessel_name:i.vessel_name,vessel_class:i.vessel_class,condition:i.condition,fuel:i.fuel||50,status:"in_port",capacity_dwt:i.capacity_dwt||s.capacity_dwt,capacity_unit:i.capacity_unit||s.capacity_unit,base_maintenance:i.base_maintenance||s.base_maintenance,fuel_capacity:i.fuel_capacity||s.fuel_capacity,purchase_price:e,built_at_tick:n-(i.age_ticks||0),current_port_nation_id:p.nation_id});if(l){await y.from("factions").update({corp_cash_reserves:t}).eq("id",p.id),alert("Failed to create vessel: "+l.message),rt=!1;return}var{error:c}=await y.from("ship_market_listings").update({status:"sold",purchased_by:p.id,purchased_at_tick:n}).eq("id",o);if(c&&console.warn("Failed to mark listing as sold:",c.message),i.seller_faction_id){const{data:d}=await y.from("factions").select("corp_cash_reserves").eq("id",i.seller_faction_id).single();if(d){var{error:f}=await y.from("factions").update({corp_cash_reserves:Number(d.corp_cash_reserves||0)+i.asking_price}).eq("id",i.seller_faction_id);f&&console.warn("Failed to credit seller:",f.message)}}p.corp_cash_reserves=t-e,rt=!1,await Promise.all([he(),ca()])}const Dt=[{cls:"Coastal",baseCost:12e6,baseBuild:3,cargo:"Bulk, Containers (coastal)"},{cls:"Container",baseCost:65e6,baseBuild:5,cargo:"Manufactured, Tech, General"},{cls:"Bulk",baseCost:38e6,baseBuild:4,cargo:"Minerals, Aggregate, Military"},{cls:"Tanker",baseCost:52e6,baseBuild:5,cargo:"Fuel, Petroleum, Chemicals"},{cls:"Reefer",baseCost:45e6,baseBuild:4,cargo:"Food, Perishables, Agriculture"},{cls:"LNG",baseCost:78e6,baseBuild:6,cargo:"Liquefied Natural Gas only"}];let pe="Coastal",Qt=0,Kt="",Je=[];function xl(){pe=(Jn[p?.corp_subsector]||["Coastal"])[0],Qt=0,Kt="",Je=[],document.getElementById("comm-overlay").style.display="flex",bl()}async function bl(){const{data:o}=await y.from("nations").select("id, name, manufacturing_output, physical_infrastructure, tariffs").order("name");Je=(o||[]).map(e=>{const t=Number(e.manufacturing_output??50),i=Math.round((.75+t/100*.5)*100)/100,n=Math.round((1.5-t/100*.65)*100)/100,a=e.id===p?.nation_id;return{id:e.id,name:e.name,mfg:t,costMod:i,buildMod:n,isHome:a,tariffs:Number(e.tariffs??0)}}),Je.sort((e,t)=>(t.isHome?1:0)-(e.isHome?1:0)),Xn()}function pa(){document.getElementById("comm-overlay").style.display="none"}function _l(o){pe=o,Xn()}function hl(o){Qt=o,Xn()}function $l(o){Kt=o}function Xn(){const o=document.getElementById("comm-content");if(!o)return;const e=z?.current_tick||0,t=Dt.find(v=>v.cls===pe)||Dt[0],i=Je[Qt]||{name:"—",costMod:1,buildMod:1},n=Ct[pe]||{color:"#666"},a=Math.round(t.baseCost*i.costMod),s=Math.max(2,Math.round(t.baseBuild*i.buildMod)),r=Math.round(a*.5),l=a-r,c=e+s,f=Jn[p?.corp_subsector]||[];let d="";d+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:#c8a832;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Commission Vessel</span>
            </div>
            <span onclick="smCloseCommission()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
    </div>`,d+='<div style="flex:1;overflow-y:auto;">',d+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Vessel Type</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">`;for(const v of Dt){const x=Ct[v.cls]||{color:"#666",label:"?"},b=pe===v.cls,$=f.includes(v.cls);d+=`<div onclick="${$?"commSetClass('"+v.cls+"')":""}" style="padding:5px 4px;text-align:center;cursor:${$?"pointer":"not-allowed"};background:${b?x.color+"18":"transparent"};border:1px solid ${b?x.color+"44":"#2a2a24"};opacity:${$?1:.3};">
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${b?x.color:"#6a6660"};">${x.label}</div>
            <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;margin-top:2px;">${_(v.baseCost)} base</div>
        </div>`}d+="</div>",d+=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:${n.color};">${t.cargo}</div>`,d+="</div>",d+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Origin Shipyard</div>`;for(let v=0;v<Je.length;v++){const x=Je[v],b=Qt===v,$=x.costMod>1?"#c84":x.costMod<1?"#5c5":"#6a6660",h=x.buildMod>1?"#c84":x.buildMod<1?"#5c5":"#6a6660";d+=`<div onclick="commSetNation(${v})" style="display:flex;align-items:center;padding:5px 8px;margin-bottom:2px;cursor:pointer;background:${b?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${b?"#8b9a6b44":"#2a2a24"};border-left:2px solid ${b?"#8b9a6b":"transparent"};">
            <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:11px;font-weight:600;color:${b?"#e8e4dc":"#9e9a92"};">${g(x.name)}</span>
                    ${x.isHome?'<span style="font-family:var(--font-mono);font-size:6px;padding:0 3px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2);line-height:11px;">HOME</span>':""}
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${x.isHome?"Home port — no tariff":"Foreign shipyard"}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">MFG</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#9e9a92;">${x.mfg}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">COST</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${$};">×${x.costMod.toFixed(2)}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">SPEED</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${h};">×${x.buildMod.toFixed(2)}</div></div>
            </div>
        </div>`}d+="</div>",d+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Vessel Name</div>
        <input id="comm-name-input" value="${g(Kt)}" oninput="commSetName(this.value)" placeholder="e.g., MV 'Sierra Nevada'" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:11px;color:#e8e4dc;background:#1c1c18;border:1px solid #2a2a24;outline:none;box-sizing:border-box;" />
    </div>`,d+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Build Summary</div>
        <div style="background:#1c1c18;border:1px solid #2a2a24;padding:6px 10px;">`;const u=[{label:"VESSEL CLASS",value:pe,color:n.color},{label:"SHIPYARD",value:i.name,color:"#9e9a92"},{label:"BASE COST",value:_(t.baseCost)+" × "+i.costMod.toFixed(2),color:"#9e9a92"},{label:"BUILD TIME",value:s+" ticks",color:s>t.baseBuild?"#c84":s<t.baseBuild?"#5c5":"#9e9a92"},{label:"COMPLETION",value:"~Tick "+c,color:"#9e9a92"}];for(const v of u)d+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${v.label}</span>
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${v.color};">${v.value}</span>
        </div>`;d+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">TOTAL COST</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c8a832;">${_(a)}</span>
    </div>`,d+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEPOSIT (50% NOW)</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">${_(r)}</span>
    </div>`,d+=`<div style="display:flex;justify-content:space-between;padding:3px 0;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">BALANCE ON COMPLETION</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${_(l)}</span>
    </div>`,d+="</div></div>",d+=`<div style="padding:6px 16px;">
        <div style="padding:5px 8px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#c8a832;margin-bottom:2px;">PAYMENT TERMS</div>
            <div style="font-size:9px;color:#6a6660;line-height:1.5;">50% deposit due immediately. Remaining 50% due on delivery at tick ${c}. Vessel delivered at 100% condition, fully fueled, to your nearest port. Cancellation forfeits deposit.</div>
        </div>
    </div>`,d+="</div>";const m=Kt.trim().length>=2;d+=`<div style="padding:10px 16px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">DEPOSIT DUE NOW</div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${_(r)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="smCloseCommission()" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="comm-order-btn" onclick="${m?"smPlaceOrder()":""}" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:${m?"#000":"#6a6660"};background:${m?"#c8a832":"transparent"};border:1px solid ${m?"#c8a832":"#2a2a24"};cursor:${m?"pointer":"default"};opacity:${m?1:.4};">PLACE ORDER</div>
        </div>
    </div>`,o.innerHTML=d}let At=!1;async function wl(){if(At||!p||!z)return;const o=Kt.trim();if(o.length<2)return;const e=Dt.find(b=>b.cls===pe)||Dt[0],t=Je[Qt];if(!t)return;const i=Math.round(e.baseCost*t.costMod),n=Math.max(2,Math.round(e.baseBuild*t.buildMod)),a=Math.round(i*.5),s=i-a,r=z.current_tick||0,l=Number(p.corp_cash_reserves??0);if(l<a){alert("Insufficient cash for deposit. Need "+_(a)+".");return}if(!confirm("Commission "+pe+" from "+t.name+`?

Deposit: `+_(a)+` (non-refundable)
Balance: `+_(s)+" on delivery at tick "+(r+n)))return;At=!0;const c=document.getElementById("comm-order-btn");c&&(c.style.opacity="0.4",c.style.pointerEvents="none");const{error:f}=await y.from("factions").update({corp_cash_reserves:l-a}).eq("id",p.id);if(f){alert("Failed: "+f.message),At=!1;return}const{data:d}=await y.from("nations").select("budget_reserves").eq("id",t.id).single();if(d){var{error:u}=await y.from("nations").update({budget_reserves:Number(d.budget_reserves||0)+a}).eq("id",t.id);u&&console.warn("Failed to credit shipyard nation budget:",u.message)}const m={Coastal:{dwt:14e3,unit:"DWT",maint:18e4,fuel:800},Container:{dwt:4800,unit:"TEU",maint:29e4,fuel:2100},Bulk:{dwt:28e3,unit:"DWT",maint:35e4,fuel:1800},Tanker:{dwt:42e3,unit:"DWT",maint:38e4,fuel:2400},Reefer:{dwt:12e3,unit:"DWT",maint:28e4,fuel:1600},LNG:{dwt:18e3,unit:"DWT",maint:58e4,fuel:1400}},v=m[pe]||m.Coastal,{error:x}=await y.from("vessel_orders").insert({faction_id:p.id,vessel_name:o,vessel_class:pe,capacity_dwt:v.dwt,capacity_unit:v.unit,base_maintenance:v.maint,fuel_capacity:v.fuel,purchase_price:e.baseCost,shipyard_nation_id:t.id,shipyard_nation:t.name,cost_modifier:t.costMod,build_modifier:t.buildMod,total_cost:i,deposit_paid:a,balance_due:s,ordered_at_tick:r,delivery_tick:r+n,build_ticks:n,status:"building"});if(x){await y.from("factions").update({corp_cash_reserves:l}).eq("id",p.id),alert("Failed to place order: "+x.message),At=!1;return}p.corp_cash_reserves=l-a,At=!1,pa(),alert(o+` commissioned!

Class: `+pe+`
Shipyard: `+t.name+`
Deposit: `+_(a)+`
Delivery: Tick `+(r+n))}window.smSelectListing=vl;window.smPurchase=gl;window.smOpenCommission=xl;window.smCloseCommission=pa;window.commSetClass=_l;window.commSetNation=hl;window.commSetName=$l;window.smPlaceOrder=wl;window.flSelectVessel=il;window.flRefurbish=al;window.flRefuel=sl;window.flSell=rl;window.flRename=ll;window.openBidReview=Xr;window.closeBidReview=jo;window.reviewSelectBid=Zr;window.acceptBid=el;window.declineAllBids=tl;window.switchToActions=Ai;window.actSelectExec=nr;window.actExecute=Fs;window.confirmFireExec=Ds;window.actOpenStatement=qi;window.actCloseStatement=Un;window.actSubmitStatement=Us;window.actDeclareBankruptcy=Oi;window.actOpenRestructure=ji;window.actCloseRestructure=Hn;window.actSubmitRestructure=Xs;window.actOpenRebrand=Fi;window.actCloseRebrand=Gn;window.actSubmitRebrand=Zs;window.actOpenDonation=Ui;window.actCloseDonation=Vn;window.actSubmitDonation=or;window.donateSelectParty=tr;window.lrOpen=Pi;window.lrClose=Di;window.lrSubmit=Js;window.lrSetAmount=Vs;window.lrSetPurpose=Ws;window.lrSetTerm=Ys;window.lrSetCollateral=Qs;window.openExecSearch=ir;window.closeExecSearch=Gi;window.esSelectCandidate=ar;window.esHireCandidate=sr;window.switchToExpansion=Ii;window.switchToOperations=Ni;window.hfSetChange=rr;window.hfReset=lr;window.hfConfirm=cr;document.addEventListener("click",function(o){const e=o.target.closest(".corp-nav-tab[href]:not([data-tab-action])");if(!e)return;const t=e.getAttribute("href");if(!t)return;const i=new URL(t,window.location.href);i.pathname!==window.location.pathname||i.searchParams.get("tab")||e.classList.contains("active")||(o.preventDefault(),Ni(o))});Ms();
