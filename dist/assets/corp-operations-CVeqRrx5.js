const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-kB28qcfr.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as y}from"./supabase-client-CiYoFhIh.js";/* empty css                    */import{c as be,i as ya,a as ga,l as xa,M as Dt,Q as wi,b as ki,d as di,e as pn,f as fn,g as ba,h as _a}from"./corp-shipping-data-CcJ84lK3.js";import{_ as ha}from"./preload-helper-BXl3LOEh.js";import{e as g}from"./utils-CY90Gazr.js";import{initMessaging as $a}from"./messaging-BUrQna7p.js";import{c as wa,a as ci,E as jt,b as So,d as mn,e as ka,f as Ea,h as on}from"./equipment-DsuDdEne.js";import{a as Ca,E as mo,b as uo,g as Ta}from"./corp-executives-BY9FR9ui.js";import"./elections-B2jRdA_W.js";import"./config-fKhFNVuq.js";import"./government-types-CONVKpUN.js";import"./ideology-BIAflN4K.js";import"./stats-tIiBSaQA.js";let we=[],c=null,I=null,z=null,rt=[],$t={},K=[],ee={},pi=-1;const Sa={em:"em_systems",glass:"glass_facades",heavy:"heavy_parts"},vo=o=>Sa[o]||o;let oe="concrete",W="STD",xe=500,mt=null,se=[],yo={},fi=0,Ft=[],Ut=[],ut=0,ke=null,Ce=-1,_e=[],Ht=null,Mt={},go={},Ei=[],xo=null,fe="trucks",Ee=0,Te=1,Oe=[],Ye=null,wt=[],mi=null,so=null;function ot(){return mt||I}let ui="ALL",vi="TIMELINE";function D(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function za(o){if(o>=12){const e=Math.floor(o/12),t=o%12;return t>0?e+"y "+t+"mo":e+"y"}return o+" ticks"}function un(o){return!o||o.length===0?"":o.map(e=>{const t=yo[e];if(!t)return"";const n=t.reputation_bonus>0?"var(--green)":t.reputation_bonus<0?"var(--red)":"var(--text-dim)",i=t.reputation_bonus>0?"+"+t.reputation_bonus:t.reputation_bonus<0?String(t.reputation_bonus):"";return`<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:3px;font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">${t.icon||"📍"} ${g(t.name)}${i?` <span style="color:${n};font-weight:700;">${i} REP</span>`:""}</span>`}).filter(Boolean).join(" ")}function me(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(0)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Ci(o){return o==="civil_engineering"?"CIVIL":o==="industrial"?"INDUSTRIAL":o==="mega_project"?"MEGA":o?.toUpperCase()||"—"}function vn(o){return o==="civil_engineering"?"light":o==="industrial"?"heavy":o==="mega_project"?"mega":"light"}function Ia(){so&&clearInterval(so),so=setInterval(()=>{if(!mi)return;const o=mi-Date.now();if(o<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(so);return}const e=Math.floor(o/36e5),t=Math.floor(o%36e5/6e4),n=Math.floor(o%6e4/1e3);document.getElementById("tick-countdown").textContent=e+"h "+t+"m "+n+"s"},1e3)}function Na(){document.body.classList.toggle("light-mode");const o=document.getElementById("theme-toggle");o.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function Aa(o,e){o==="type"&&(ui=e),o==="sort"&&(vi=e),document.querySelectorAll(`.filter-pill[data-filter="${o}"]`).forEach(t=>{t.classList.toggle("active",t.dataset.value===e)}),gn()}const nn={"Civil Engineering":"civil_engineering","Industrial Construction":"industrial",Megaprojects:"mega_project"};function yn(o){if(!c)return!1;if(nn[c.corp_subsector]===o.sector)return!0;const t=(G||[]).filter(n=>n.type==="regional_hq"&&n.is_active&&n.nation_id===o.nation_id);for(const n of t)if(nn[n.subsector]===o.sector)return!0;return!1}function gn(){const o=document.getElementById("oc-list");let e=[...rt];if(ui==="GOVERNMENT"?e=e.filter(i=>i.issuer_type==="GOVERNMENT"):ui==="PRIVATE"&&(e=e.filter(i=>i.issuer_type==="PRIVATE")),vi==="TIMELINE"&&e.sort((i,a)=>(i.timeline_ticks||0)-(a.timeline_ticks||0)),vi==="BUDGET"&&e.sort((i,a)=>(a.budget_ceiling||0)-(i.budget_ceiling||0)),document.getElementById("oc-count").textContent=e.length+" AVAILABLE",e.length===0){o.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const t=z?.current_tick||0;let n="";for(const i of e){const a=i.issuer_type==="GOVERNMENT",s=a?"gov":"private",r=yn(i),p=r?"":" locked",l=vn(i.sector),f=Ci(i.sector),d=(i.timeline_ticks||0)>18?" warn":"",v=i.bidding_ends_tick?Math.max(0,i.bidding_ends_tick-t):"?";n+=`
            <div class="oc-item${p}" data-contract-id="${i.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${g(i.name)}</span>
                    <span class="oc-item__type-badge ${s}">${a?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${s}">${g(i.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${v} tick${v!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${me(i.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${d}">${za(i.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${l}">${f}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${$t[i.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${me($t[i.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${r?"yes":"no"}">${r?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${r?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openContractDetail(contracts.find(x=>x.id==='${i.id}'))">VIEW</button>`:""}
                </div>
                ${i.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${g(i.description)}</div>`:""}
                ${i.modifiers&&i.modifiers.length>0?`<div style="display:flex;flex-wrap:wrap;gap:3px;padding:4px 0 0;">${un(i.modifiers)}</div>`:""}
            </div>`}o.innerHTML=n,o.querySelectorAll(".oc-item:not(.locked)").forEach(i=>{i.addEventListener("click",()=>{const a=i.dataset.contractId,s=rt.find(r=>r.id===a);s&&xn(s)})})}let Qe=null;function xn(o){Qe=o;const e=document.getElementById("cd-overlay"),t=o.issuer_type==="GOVERNMENT",n=t?"gov":"private",i=(I?.name||c.nation||"—").toUpperCase(),a=yn(o);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${g(i)}</span>
        <span class="cd-header__name">${g(o.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${n}">${g(o.issuer_name)}</span>
        <span class="cd-header__type-badge ${n}">${t?"GOV":"PRIVATE"}</span>
    `;const s=document.getElementById("cd-blueprint");o.blueprint_svg?(s.innerHTML=o.blueprint_svg,s.style.display=""):(s.innerHTML=Ja(o),s.style.display="");const r=o.permits_required||[],p=o.required_equipment||o.equipment_required||{},l=Array.isArray(p)?p.map(B=>({key:B,qty:1})):Object.entries(p).map(([B,P])=>({key:B,qty:P})),f=o.required_materials||o.materials_estimated||{},v={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[o.sector]||o.spec_category||o.sector||"—";let m="var(--teal)";o.sector==="industrial"&&(m="var(--orange)"),o.sector==="mega_project"&&(m="var(--red)");let u=D(o.budget_ceiling||o.budget||0),x=(o.timeline_ticks||o.timeline_months||0)+" Months",b="";b+=`
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
            <div style="display:flex;flex-direction:column;gap:6px;">`;for(const B of $){const P=yo[B];if(!P)continue;const R=P.reputation_bonus>0?"var(--green)":P.reputation_bonus<0?"var(--red)":"var(--text-dim)",j=P.cost_multiplier>1?"+"+Math.round((P.cost_multiplier-1)*100)+"% cost":P.cost_multiplier<1?Math.round((1-P.cost_multiplier)*100)+"% cheaper":"",X=P.reputation_bonus!==0?(P.reputation_bonus>0?"+":"")+P.reputation_bonus+" rep":"",F=P.required_permits||[];b+=`<div style="padding:6px 10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:600;font-size:0.78rem;color:var(--text-primary);">${P.icon||"📍"} ${g(P.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;">
                        ${j?`<span style="color:var(--amber);">${j}</span>`:""}
                        ${j&&X?" · ":""}
                        ${X?`<span style="color:${R};font-weight:700;">${X}</span>`:""}
                    </span>
                </div>
                <div style="font-size:0.65rem;color:var(--text-dim);margin-top:2px;">${g(P.description||"")}</div>
                ${F.length>0?`<div style="font-size:0.6rem;color:var(--amber);margin-top:3px;font-family:var(--font-mono);">Requires permits: ${F.map(Re=>g(Re.replace(/_/g," "))).join(", ")}</div>`:""}
            </div>`}b+="</div></div>"}b+='<div class="cd-details">',o.project_type&&(b+=qe("Type",o.project_type)),o.project_subtype&&(b+=qe("Sub-Type",o.project_subtype)),b+=qe("Specialization",v,m),b+=qe("Total Budget",u,"var(--green)"),b+=qe("Timeline",x),b+=qe("Nation",I?.name||c.nation||"—"),o.region&&(b+=qe("Region",o.region)),b+="</div>",r.length>0&&(b+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${r.map(B=>{const P=B.status==="approved"?"approved":"required",R=B.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${P}">
                            <span class="cd-chip__icon">${R}</span>
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
            </div>`),document.getElementById("cd-content").innerHTML=b;const h=r.filter(B=>B.status==="approved").length,E=r.length-h,S=l.length,k=[];for(const B of l){const R={work_trucks:"trucks",concrete_mixers:"mixers",tower_cranes:"cranes",heavy_haulers:"haulers",pile_drivers:"piledrivers",asphalt_plants:"asphalt"}[B.key]||B.key,j=se.find(X=>X.equipment_key===R||X.equipment_key===B.key);j&&j.owned>=B.qty||k.push(B)}const T=k.length,C=o.required_materials||{},M=typeof C=="object"&&!Array.isArray(C)?Object.entries(C):[],w=[];for(const[B,P]of M){const R=ee[B]||{},j=(R.LOW?.qty||0)+(R.STD?.qty||0)+(R.HIGH?.qty||0);j<P&&w.push({key:B,need:P,have:j})}const A=B=>B.replace(/_/g," ").replace(/\b\w/g,P=>P.toUpperCase());let q="";if(S>0)if(T===0)q+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>';else{const B=k.map(P=>A(P.key)).join(", ");q+=`<span class="cd-footer__badge bad" title="${g(B)}">${T} SHORT: ${g(B)}</span>`}if(M.length>0)if(w.length===0)q+='<span class="cd-footer__badge ok">ALL MATERIALS MET</span>';else{const B=w.map(P=>A(P.key)+" ("+P.have+"/"+P.need+")").join(", ");q+=`<span class="cd-footer__badge bad" title="${g(B)}">${w.length} MAT SHORT: ${g(B)}</span>`}r.length>0&&(E===0?q+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':q+=`<span class="cd-footer__badge warn">${E} PERMITS PENDING</span>`);const U=a,J=o.issuer_faction_id===c?.id,H=o.status==="bidding",ye=$t[o.id];document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${q}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${J?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${H?"":"disabled"} title="${H?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:ye?`<button class="cd-btn primary" onclick="retractBid('${o.id}')" style="background:#c55;border-color:#c55;"
                        title="Retract your bid ($1M penalty)">RETRACT BID</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${U?"":"disabled"}
                        title="${U?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,e.classList.add("open"),document.body.style.overflow="hidden"}function Jt(o){o&&o.target&&o.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",Qe=null)}const je=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],an={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},sn={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let L=null;const Ma="get_contract_permit_requirements";async function Ra(o,e){if(!y||!o||!e)return[];try{const{data:t,error:n}=await y.rpc(Ma,{p_contract_id:o,p_faction_id:e});return n?(console.warn("[pm permits] failed to load permit requirements:",n.message),[]):Array.isArray(t)?t.filter(i=>i&&i.name).map(i=>({name:String(i.name),has_permit:i.has_permit===!0})):[]}catch(t){return console.warn("[pm permits] unexpected error loading permit requirements:",t),[]}}async function it(o){const e=K.find(R=>R.id===o);if(!e)return;const t=Array.isArray(e.contract_bids)?e.contract_bids[0]:e.contract_bids,n=z?.current_tick||0,i=e.awarded_at_tick||n,a=e.timeline_ticks||8,s=Math.max(0,n-i),r=Math.min(100,s/a*100);let p=Math.min(je.length-1,Math.floor(r/(100/je.length)));const l=Math.round(r%(100/je.length)/(100/je.length)*100),f=e.required_materials||{},d=t?.material_grades||{};let v=[];try{const{data:R}=await y.from("project_material_allocations").select("material_key, quality_tier, quantity, consumed").eq("contract_id",e.id);v=R||[]}catch{}const m={};for(const R of v)m[R.material_key]||(m[R.material_key]={totalAllocated:0,totalConsumed:0,tiers:{}}),m[R.material_key].totalAllocated+=R.quantity,m[R.material_key].totalConsumed+=R.consumed,m[R.material_key].tiers[R.quality_tier]={qty:R.quantity,consumed:R.consumed};const u=Object.entries(f).map(([R,j])=>{const X=d[R]||"STD",F=m[R]||{totalAllocated:0,totalConsumed:0,tiers:{}};return{key:R,name:R.replace(/_/g," ").replace(/\b\w/g,Re=>Re.toUpperCase()),grade:X,required:Number(j),allocated:F.totalAllocated,consumed:F.totalConsumed,tiers:F.tiers,warehouseStock:ee[R]||{}}}),x=e.required_equipment||{},b=e.equipment_condition||{},$=Array.isArray(x)?x.map(R=>[R,1]):Object.entries(x),h={work_trucks:"trucks",concrete_mixers:"mixers",tower_cranes:"cranes",heavy_haulers:"haulers",pile_drivers:"piledrivers",asphalt_plants:"asphalt"},E=$.map(([R,j])=>{const X=h[R]||R,F=se.find(Z=>Z.equipment_key===X||Z.equipment_key===R),no=(F?.assigned_projects||[]).find(Z=>Z.contract_id===e.id),St=no?no.units:0;return{key:R,name:R.replace(/_/g," ").replace(/\b\w/g,Z=>Z.toUpperCase()),required:Number(j)||1,ownedTotal:F?.owned||0,deployed:F?.deployed||0,available:Math.max(0,(F?.owned||0)-(F?.deployed||0)),assignedToProject:St,condition:b[R]??(F?.condition||100)}}),S=e.budget_ceiling||0,k=t?.estimated_cost||0,T=Math.round(k*Math.min(1,s/a)),C=t?.estimated_quality||65,M=C>=80?"STRONG":C>=60?"PROMISING":C>=40?"FAIR":"UNCERTAIN",w=e.required_workforce||{},A=e.workers_assigned||{},q=(w.general||0)+(w.skilled||0)+(w.innovative||0),U=(A.general||0)+(A.skilled||0)+(A.innovative||0),J=t?.labor_count||q,H=Number(c?.corp_general_workforce??0),ye=Number(c?.corp_skilled_workforce??0),B=Number(c?.corp_innovative_workforce??0),P=await Ra(e.id,c?.id);L={project:e,bid:t,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:n,awardedTick:i,totalTicks:a,ticksElapsed:s,phaseIdx:p,phaseProgress:l,materials:u,equipment:E,permitRequirements:P,budget:S,estCost:k,spent:T,quality:C,qualityLabel:M,laborCount:J,wfNeeded:q,wfAssigned:U,reqWf:w,assignedWf:A,corpGeneral:H,corpSkilled:ye,corpInnovative:B,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",bn(e.id).then(()=>Xe()),Xe()}let Y=!1;async function La(o,e,t){if(!(Y||!L||!c)){Y=!0;try{const{data:n,error:i}=await y.rpc("allocate_material_to_project",{p_contract_id:L.project.id,p_faction_id:c.id,p_material_key:o,p_quality_tier:e,p_quantity:t});if(i){alert("Allocation failed: "+i.message);return}if(n&&!n.success){alert(n.error||"Allocation failed");return}await zi(),await it(L.project.id)}catch(n){alert("Allocation error: "+n.message)}finally{Y=!1}}}async function qa(o,e,t){if(!(Y||!L||!c)){Y=!0;try{const{data:n,error:i}=await y.rpc("deallocate_material_from_project",{p_contract_id:L.project.id,p_faction_id:c.id,p_material_key:o,p_quality_tier:e,p_quantity:t});if(i){alert("Return failed: "+i.message);return}if(n&&!n.success){alert(n.error||"Return failed");return}await zi(),await it(L.project.id)}catch(n){alert("Return error: "+n.message)}finally{Y=!1}}}async function Oa(o,e){if(!(Y||!L||!c)){Y=!0;try{const t=L.project,n=t.workers_assigned||{},i=Number(n[o]||0),a=Number((t.required_workforce||{})[o]||0),s=Number(c?.["corp_"+o+"_workforce"]??0);let r=0;for(const m of K||[])m.id!==t.id&&(r+=Number((m.workers_assigned||{})[o]||0));const p=Math.max(0,s-r-i),l=Math.min(e,a-i,p);if(l<=0){alert(p<=0?"No "+o+" workers available in pool":"Already fully staffed for "+o);return}const f={...n,[o]:i+l},{error:d}=await y.from("construction_contracts").update({workers_assigned:f}).eq("id",t.id);if(d){alert("Assign failed: "+d.message);return}const v=K.find(m=>m.id===t.id);v&&(v.workers_assigned=f),await it(t.id)}catch(t){alert("Assign error: "+t.message)}finally{Y=!1}}}async function Ba(o,e){if(!(Y||!L||!c)){Y=!0;try{const t=L.project,n=t.workers_assigned||{},i=Number(n[o]||0),a=Math.min(e,i);if(a<=0){alert("No "+o+" assigned");return}const s={...n,[o]:i-a},{error:r}=await y.from("construction_contracts").update({workers_assigned:s}).eq("id",t.id);if(r){alert("Unassign failed: "+r.message);return}const p=K.find(l=>l.id===t.id);p&&(p.workers_assigned=s),await it(t.id)}catch(t){alert("Unassign error: "+t.message)}finally{Y=!1}}}async function Pa(o,e){if(!(Y||!L||!c)){Y=!0;try{const n={work_trucks:"trucks",concrete_mixers:"mixers",tower_cranes:"cranes",heavy_haulers:"haulers",pile_drivers:"piledrivers",asphalt_plants:"asphalt"}[o]||o,i=se.find(f=>f.equipment_key===n||f.equipment_key===o);if(!i){alert("Equipment not found in inventory.");return}const a=Math.max(0,(i.owned||0)-(i.deployed||0));if(a<e){alert("Not enough available "+o+" ("+a+" available).");return}const s=(i.deployed||0)+e,r=[...i.assigned_projects||[]],p=r.find(f=>f.contract_id===L.project.id);p?p.units+=e:r.push({contract_id:L.project.id,contract_name:L.project.name,units:e});const{error:l}=await y.from("corp_equipment").update({deployed:s,assigned_projects:r}).eq("faction_id",c.id).eq("equipment_key",i.equipment_key);if(l){alert("Deploy failed: "+l.message);return}await Di(),await it(L.project.id)}catch(t){alert("Deploy error: "+t.message)}finally{Y=!1}}}async function Da(o){if(!(Y||!L||!c)){Y=!0;try{const t={work_trucks:"trucks",concrete_mixers:"mixers",tower_cranes:"cranes",heavy_haulers:"haulers",pile_drivers:"piledrivers",asphalt_plants:"asphalt"}[o]||o,n=se.find(l=>l.equipment_key===t||l.equipment_key===o);if(!n){alert("Equipment not found.");return}const i=[...n.assigned_projects||[]],a=i.findIndex(l=>l.contract_id===L.project.id);if(a===-1){alert("Equipment not deployed to this project.");return}const s=i[a].units;i.splice(a,1);const r=Math.max(0,(n.deployed||0)-s),{error:p}=await y.from("corp_equipment").update({deployed:r,assigned_projects:i}).eq("faction_id",c.id).eq("equipment_key",n.equipment_key);if(p){alert("Undeploy failed: "+p.message);return}await Di(),await it(L.project.id)}catch(e){alert("Undeploy error: "+e.message)}finally{Y=!1}}}function ja(o){o&&o.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",L=null)}function Fa(o){L&&(L.tab=o,L.expandedEvent=-1,L.selectedResponse=null,Xe())}function Ua(o){L&&(L.expandedEvent=L.expandedEvent===o?-1:o,L.selectedResponse=null,Xe())}function Ha(o){L&&(L.selectedResponse=L.selectedResponse===o?null:o,Xe())}function Xe(){if(!L)return;const o=L,e=o.project,t=e.issuer_type==="GOVERNMENT",n=Ci(e.sector),i=c?.nation||"Nation",a=o.awardedTick+o.totalTicks,s=Math.max(0,a-o.currentTick),r=o.currentTick>a,p=o.budget>0?Math.round(o.spent/o.budget*100):0,l=p>85?"var(--red)":p>60?"var(--amber)":"var(--teal)",f=o.budget-o.spent,d=o.events.filter(b=>b.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${g(i.toUpperCase())}</span>
                <span class="pm-hdr__name">${g(e.name)}</span>
                <span style="color:var(--text-dim);font-size:12px">—</span>
                <span class="pm-hdr__issuer">${g(e.issuer_name||"—")}</span>
                <span class="pm-hdr__type">${t?"GOV":"PVT"}</span>
            </div>
            <button class="pm-hdr__close" onclick="closeProjectModal()">×</button>
        </div>
        <div class="pm-hdr__row2">
            <span class="pm-hdr__id">${g(e.template_key||e.id)}</span>
            <span class="pm-hdr__badge pm-hdr__badge--spec">${g(n.toUpperCase())}</span>
            <span class="pm-hdr__badge pm-hdr__badge--sub">${g((e.sector||"").replace(/_/g," ").toUpperCase())}</span>
        </div>
    `;let v='<div class="pm-phase__bar">';for(let b=0;b<je.length;b++){const $=b<o.phaseIdx,h=b===o.phaseIdx;v+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${$?"done":h?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${$?"done":h?"active":""}">${je[b]}</span>
        </div>`}v+="</div>",v+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${je[o.phaseIdx]} — ${o.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${r?"var(--red)":"var(--text-secondary)"}">Tick ${o.ticksElapsed} / ${o.totalTicks}${r?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=v;const m=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:d},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=m.map(b=>`<button class="pm-tab${o.tab===b.id?" active":""}" onclick="pmSetTab('${b.id}')">
            ${b.label}${b.badge>0?`<span class="pm-tab__badge">${b.badge}</span>`:""}
        </button>`).join("");let u="";o.tab==="overview"?u=Ga(o,e,l,p,f,s,r):o.tab==="events"?u=Va(o):o.tab==="materials"?u=Wa(o):o.tab==="equipment"&&(u=Ya(o)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${u}</div>`;let x="";d>0&&(x+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${d} EVENT${d>1?"S":""} REQUIRES RESPONSE</span>`),x+=`<span class="pm-ftr__badge" style="color:${o.quality>=70?"var(--green)":o.quality>=50?"var(--amber)":"var(--orange)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${o.quality}/100 — ${o.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${x}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function Ga(o,e,t,n,i,a,s){const r=Fe(o.awardedTick+o.totalTicks);Fe(o.awardedTick+o.totalTicks);const p=Fe(o.awardedTick),l=[{label:"Budget",value:me(o.budget),sub:`${n}% spent`,color:t},{label:"Spent",value:me(o.spent),color:"var(--red)"},{label:"Remaining",value:me(i),color:"var(--green)"},{label:"Quality",value:`${o.quality}/100`,sub:o.qualityLabel,color:o.quality>=70?"var(--green)":o.quality>=50?"var(--amber)":"var(--red)"},{label:"Workforce",value:`${o.laborCount}/${o.wfNeeded}`,sub:`Bid: ${o.laborCount}`,color:o.laborCount<o.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${a} ticks`,sub:s?"OVERDUE":`Deadline: ${r}`,color:s?"var(--red)":"var(--text-bright)"}];let f="";f+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${g(e.description||e.name)}</div>
    </div></div>`,f+='<div class="pm-metrics">';for(const b of l)f+=`<div class="pm-metric">
            <div class="pm-metric__label">${b.label}</div>
            <div class="pm-metric__value" style="color:${b.color}">${b.value}</div>
            ${b.sub?`<div class="pm-metric__sub">${g(b.sub)}</div>`:""}
        </div>`;f+="</div>",f+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${p}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${s?"var(--red)":"var(--text-bright)"};font-weight:700">${r}</span></span>
        </div>
    </div></div>`;const d=e.modifiers||[];d.length>0&&(f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Building Modifiers</div>',f+='<div style="display:flex;flex-wrap:wrap;gap:4px;">',f+=un(d),f+="</div></div></div>");const v=Array.isArray(o.permitRequirements)?o.permitRequirements:[];if(v.length>0){f+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const b of v){const $=b.has_permit===!0,h=$?"HAS PERMIT":"NEEDS TO GET";f+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:${$?"var(--green)":"var(--amber)"}">${$?"✓":"!"}</span>
                    <span class="pm-permit__name">${g(b.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:${$?"var(--green)":"var(--amber)"}">${h}</span>
            </div>`}f+="</div></div>"}f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Workforce Assignment</div>';const m=[{key:"general",label:"General Workers",corpAvail:o.corpGeneral,color:"var(--text-primary)"},{key:"skilled",label:"Skilled Workers",corpAvail:o.corpSkilled,color:"var(--blue)"},{key:"innovative",label:"Innovative Workers",corpAvail:o.corpInnovative,color:"var(--purple)"}];for(const b of m){const $=Number(o.reqWf[b.key]||0);if($===0)continue;const h=Number(o.assignedWf[b.key]||0),S=h>=$?"var(--green)":h>0?"var(--amber)":"var(--red)",k=b.corpAvail>0&&h<$,T=Math.min(b.corpAvail,$-h),C=h>0;f+='<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.72rem;">',f+="<div>",f+=`<span style="color:${b.color};font-weight:600;">${b.label}</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Required: <strong>${$}</strong></span>`,f+=`<span style="color:${S};margin-left:8px;font-weight:700;">${h} assigned</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Pool: ${b.corpAvail}</span>`,f+="</div>",f+='<div style="display:flex;gap:4px;">',k&&(f+=`<button onclick="pmAssignWorkers('${b.key}',${T})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Assign ${T}</button>`),C&&(f+=`<button onclick="pmUnassignWorkers('${b.key}',${h})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Remove ${h}</button>`),f+="</div></div>"}const u=Number(o.reqWf.general||0)+Number(o.reqWf.skilled||0)+Number(o.reqWf.innovative||0),x=Number(o.assignedWf.general||0)+Number(o.assignedWf.skilled||0)+Number(o.assignedWf.innovative||0);return u>0&&x<u&&(f+='<div style="font-size:0.62rem;color:var(--red);margin-top:6px;font-family:var(--font-mono);">⚠ Project will STALL until workforce is fully assigned</div>'),f+="</div></div>",f}function Va(o){if(o.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let e="";for(let t=0;t<o.events.length;t++){const n=o.events[t],i=o.expandedEvent===t,a=n.status==="ACTIVE",s=an[n.type]||an.WEATHER,r=sn[n.severity]||sn.LOW;if(e+=`<div class="pm-evt ${a?"pm-evt--active":"pm-evt--resolved"}" style="${a?`border-left-color:${s.color}`:""}">`,e+=`<div class="pm-evt__header" onclick="pmToggleEvent(${t})" style="${i?`background:${s.bg}`:""}">`,e+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${s.color};background:${s.bg};border:1px solid ${s.border}">${n.type}</span>
            <span class="pm-evt__sev-badge" style="color:${r}">${n.severity}</span>
            <span class="pm-evt__status" style="color:${a?"var(--red)":"var(--text-dim)"};font-weight:${a?"700":"400"}">${a?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,e+=`<div class="pm-evt__title">${g(n.title)}</div>`,e+=`<div class="pm-evt__meta">Tick ${n.tick} · ${g(n.id||"")}</div>`,i){if(e+='<div class="pm-evt__body">',e+=`<div class="pm-evt__desc">${g(n.desc)}</div>`,n.impact&&(e+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${g(n.impact)}</span>
                </div>`),a&&n.responses&&n.responses.length>0){e+='<div class="pm-evt__resp-title">Response Options</div>';for(let p=0;p<n.responses.length;p++){const l=n.responses[p],f=o.selectedResponse===p,v={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[l.tag]||"var(--text-secondary)";e+=`<div class="pm-resp${f?" selected":""}" style="${f?`border-color:${v}`:""}" onclick="event.stopPropagation();pmSelectResponse(${p})">`,e+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${g(l.label)}</span>
                            <span class="pm-resp__tag" style="color:${v};background:${v}12;border:1px solid ${v}25">${l.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${l.delay>0?"var(--orange)":"var(--green)"}">
                            ${l.delay>0?`+${l.delay} tick${l.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,e+=`<div class="pm-resp__detail">${g(l.detail)}</div>`,e+='<div class="pm-resp__costs">',l.cost&&(e+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${me(l.cost)}</span>`),l.qualityImpact&&l.qualityImpact!==0&&(e+=`<span class="pm-resp__cost" style="color:${l.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${l.qualityImpact>0?"+":""}${l.qualityImpact}</span>`),!l.cost&&(!l.qualityImpact||l.qualityImpact===0)&&(e+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),e+="</div>",f&&(e+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${v}" onclick="event.stopPropagation();confirmEventResponse('${n.id}','${l.key}')">CONFIRM</button>
                        </div>`),e+="</div>"}}!a&&n.resolution&&(e+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${g(n.resolution)}</div>
                </div>`),e+="</div>"}e+="</div></div>"}return e}function Wa(o){if(o.materials.length===0)return'<div class="pm-evt-empty">No materials required for this project.</div>';let e='<div class="pm-tab-header">Project Materials</div>';for(const t of o.materials){const n=t.required>0?Math.round(t.allocated/t.required*100):0;t.allocated>0&&Math.round(t.consumed/t.allocated*100);const i=t.allocated>=t.required,a=i?"var(--green)":t.allocated>0?"var(--amber)":"var(--red)",s=i?"FULLY ALLOCATED":t.allocated>0?"PARTIAL":"NONE ALLOCATED";e+='<div class="pm-mat" style="margin-bottom:14px;">',e+=`<div class="pm-mat__row1">
            <div class="pm-mat__left">
                <span class="pm-mat__name">${g(t.name)}</span>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:${a};">${t.allocated} / ${t.required} allocated · ${s}</span>
        </div>`,e+=`<div class="pm-mat__bar-row">
            <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${n}%;background:${a};"></div></div>
            <span class="pm-mat__pct">${t.consumed} consumed</span>
        </div>`;const r=["STD","LOW","HIGH"],p=t.required-t.allocated;for(const l of r){const f=t.warehouseStock[l]||{qty:0},d=t.tiers[l]||{qty:0,consumed:0},v=d.qty-d.consumed;if(f.qty===0&&d.qty===0)continue;const m=l==="HIGH"?"var(--green)":l==="LOW"?"var(--orange)":"var(--text-muted)",u=l==="HIGH"?"HIGH":l==="LOW"?"LOW":"STD";if(e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.7rem;">',e+='<div style="display:flex;align-items:center;gap:6px;">',e+=`<span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${m};width:32px;">${u}</span>`,e+=`<span style="color:var(--text-dim);">Warehouse: <strong style="color:var(--text-primary);">${f.qty}</strong></span>`,d.qty>0&&(e+=`<span style="color:var(--text-dim);margin-left:8px;">Allocated: <strong style="color:var(--text-primary);">${d.qty}</strong></span>`),e+="</div>",e+='<div style="display:flex;gap:4px;">',f.qty>0&&p>0){const x=Math.min(f.qty,p);e+=`<button class="pm-alloc-btn" onclick="pmAllocateMaterial('${t.key}','${l}',${x})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Allocate ${x}</button>`}v>0&&(e+=`<button class="pm-alloc-btn" onclick="pmDeallocateMaterial('${t.key}','${l}',${v})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Return ${v}</button>`),e+="</div></div>"}e+="</div>"}return e}function Ya(o){if(o.equipment.length===0)return'<div class="pm-evt-empty">No equipment required for this project.</div>';let e='<div class="pm-tab-header">Project Equipment</div>';for(const t of o.equipment){const n=t.condition>=75?"var(--green)":t.condition>=50?"var(--amber)":t.condition>=25?"var(--orange)":"var(--red)",i=t.assignedToProject>=t.required,a=t.assignedToProject>0&&t.assignedToProject<t.required,s=i?"var(--green)":a||t.ownedTotal>0?"var(--amber)":"var(--red)",r=i?`${t.assignedToProject}/${t.required} DEPLOYED`:a?`${t.assignedToProject}/${t.required} PARTIAL`:t.ownedTotal>0?"NOT DEPLOYED":"NOT OWNED";e+=`<div class="pm-eq" style="margin-bottom:12px;">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${g(t.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${s};margin-left:8px;">${r}</span>
                </div>
            </div>`,t.assignedToProject>0&&(e+=`<div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${t.condition}%;background:${n}"></div></div>
                <span class="pm-eq__cond-val" style="color:${n}">${t.condition}%</span>
            </div>`);const p=Math.min(t.available,t.required-t.assignedToProject);e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:0.7rem;">',e+=`<span style="color:var(--text-dim);">Required: <strong style="color:${i?"var(--green)":"var(--red)"}">${t.required}</strong>`,e+=` · Owned: <strong style="color:var(--text-primary);">${t.ownedTotal}</strong>`,e+=` · Available: <strong style="color:var(--text-primary);">${t.available}</strong></span>`,e+='<div style="display:flex;gap:4px;">',p>0&&(e+=`<button onclick="pmDeployEquipment('${t.key}',${p})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Deploy ${p}</button>`),t.assignedToProject>0&&(e+=`<button onclick="pmUndeployEquipment('${t.key}')" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Undeploy</button>`),e+="</div></div>",e+="</div>"}return e}function Fe(o){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][o%12]}, ${2e3+Math.floor(o/12)}`}async function Qa(o,e){if(!c||!z)return;const t=prompt(`REQUEST CONSTRUCTION INSURANCE
`+"─".repeat(35)+`

Describe what this policy should cover:

e.g., "Full coverage for weather delays, material damage, and labor disputes during construction. Should cover cost overruns up to 20% of budget."

Insurance corps will see this in their Deal Flow.`);if(t===null)return;const n=t.trim()||"Construction Insurance",i=z.current_tick||0,{error:a}=await y.from("finance_loan_requests").insert({requesting_faction_id:c.id,nation_id:c.nation_id,request_type:"insurance",insured_contract_id:o,amount:e,term_months:0,purpose:n,status:"open",created_tick:i,expires_tick:i+12});if(a){a.message.includes("duplicate")||a.message.includes("unique")?alert("Insurance already requested for this project."):alert("Failed to request insurance: "+a.message);return}alert("Insurance request posted to Deal Flow. Insurance corporations can now offer coverage."),await Ti()}window.requestInsurance=Qa;window.openProjectModal=it;window.closeProjectModal=ja;window.pmSetTab=Fa;window.pmToggleEvent=Ua;window.pmSelectResponse=Ha;window.pmAllocateMaterial=La;window.pmDeallocateMaterial=qa;window.pmDeployEquipment=Pa;window.pmUndeployEquipment=Da;window.pmAssignWorkers=Oa;window.pmUnassignWorkers=Ba;async function bn(o){if(!L)return;const{data:e,error:t}=await y.from("construction_events").select("*").eq("contract_id",o).order("fired_at_tick",{ascending:!1});t?(console.warn("Failed to load project events:",t.message),L.events=[]):L.events=(e||[]).map(n=>({id:n.id,type:n.type,severity:n.severity,tick:n.fired_at_tick,title:n.title,desc:n.description,impact:n.impact,status:n.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:n.resolution,responses:n.responses||[]})),Xe()}let Ho=!1;async function Ka(o,e){if(!(Ho||!L)){Ho=!0;try{const{data:t,error:n}=await y.rpc("resolve_construction_event",{p_event_id:o,p_response_key:e});if(n){console.error("Failed to resolve event:",n.message),alert("Failed to submit response: "+n.message);return}const i=typeof t=="string"?JSON.parse(t):t;if(i?.error){alert("Error: "+i.error);return}await bn(L.project.id),await Ti(),i?.quality_applied&&i.quality_applied!==0&&(L.quality=Math.max(0,Math.min(100,L.quality+i.quality_applied)),L.qualityLabel=L.quality>=80?"STRONG":L.quality>=60?"PROMISING":L.quality>=40?"FAIR":"UNCERTAIN"),Xe()}finally{Ho=!1}}}window.confirmEventResponse=Ka;function qe(o,e,t){const n=t?` style="color:${t}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${g(o)}</span>
        <span class="cd-detail-row__value"${n}>${g(e)}</span>
    </div>`}function Ja(o){const e={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},t=o.drawing_number||o.contract_number+"-A1",n=z?.current_date||"",i=n?n.replace(/,\s*/," "):"",a=o.spec_category==="Heavy Infrastructure",s=o.spec_category==="Megaproject";let r=g(o.project_subtype||o.project_type||"STRUCTURE"),p=a?"80.0m":s?"200.0m":"60.0m",l=a?"40.0m":s?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${e.bg}">
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
        <text x="340" y="17" text-anchor="middle" font-size="5.5" fill="${e.dim}" font-family="var(--font-mono)">${p}</text>

        <!-- Dimension: right -->
        <line x1="630" y1="30" x2="630" y2="150" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="627" y1="30" x2="633" y2="30" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="627" y1="150" x2="633" y2="150" stroke="${e.dim}" stroke-width="0.5"/>
        <text x="645" y="93" text-anchor="middle" font-size="5.5" fill="${e.dim}" font-family="var(--font-mono)" transform="rotate(90,645,93)">${l}</text>

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
        <text x="630" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${g(i)}</text>

        <!-- North arrow -->
        <g transform="translate(470,172)">
            <line x1="0" y1="12" x2="0" y2="0" stroke="${e.accent}" stroke-width="0.8"/>
            <polygon points="-3,4 0,0 3,4" fill="${e.accent}"/>
            <text x="0" y="-3" text-anchor="middle" font-size="5" fill="${e.text}" font-family="var(--font-mono)">N</text>
        </g>
    </svg>`}async function Ne(){if(!c||!c.nation_id)return;const{data:o,error:e}=await y.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(e)console.warn("Failed to load contracts:",e.message),rt=[];else{const t=Number(c.corp_reputation??0);rt=(o||[]).filter(n=>t>=(n.min_reputation||0))}if($t={},c&&rt.length>0){const t=rt.map(i=>i.id),{data:n}=await y.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",c.id).in("contract_id",t);for(const i of n||[])$t[i.contract_id]=i}gn()}function Xa(){const o=document.getElementById("ap-list"),e=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=K.length+" ACTIVE",K.length===0){o.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,e.style.display="none";return}const t=z?.current_tick||0;let n=0,i=0,a="";for(const s of K){const r=s.issuer_type==="GOVERNMENT",p=r?"gov":"private",l=Array.isArray(s.contract_bids)?s.contract_bids[0]:s.contract_bids,f=l?.bid_price||0,d=l?.estimated_cost||0,v=l?.estimated_quality||0,m=s.budget_ceiling||0,u=s.awarded_at_tick||t,x=s.stalled_ticks||0,b=Math.max(0,t-u),$=Math.max(0,b-x),h=s.timeline_ticks||8,E=Math.max(0,h-$),S=Math.min(100,Math.round($/h*100)),k=$>h,T=x>0;let C="";if(T){const w=s.required_workforce||{},A=s.workers_assigned||{},q=[];(Number(A.general)||0)<(Number(w.general)||0)&&q.push("General: "+(Number(A.general)||0)+"/"+(Number(w.general)||0)),(Number(A.skilled)||0)<(Number(w.skilled)||0)&&q.push("Skilled: "+(Number(A.skilled)||0)+"/"+(Number(w.skilled)||0)),(Number(A.innovative)||0)<(Number(w.innovative)||0)&&q.push("Innovative: "+(Number(A.innovative)||0)+"/"+(Number(w.innovative)||0)),q.length>0?C="Workers needed — "+q.join(", "):C="Materials needed — allocate from warehouse"}vn(s.sector);const M=Ci(s.sector);n+=m,i+=f,a+=`<div class="ap-item" onclick="openProjectModal('${s.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${g(s.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${g(s.issuer_name||"—")} · ${M}</div>
                </div>
                <span class="oc-item__type-badge ${p}">${r?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS${T?' <span style="color:var(--orange);font-weight:700;font-size:7px;">⚠ STALLED ('+x+" ticks) — "+g(C)+"</span>":""}</span>
                    <span class="ap-budget__values" style="color:${k?"var(--red)":T?"var(--orange)":"var(--teal)"}">
                        ${$}/${h} ticks ${k?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${S}%;background:${k?"var(--red)":T?"var(--orange)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${me(f)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${me(d)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${v>=70?"var(--green)":v>=40?"var(--teal)":"var(--orange)"}">${v}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${k?"var(--red)":"var(--text-bright)"}">${E} ticks</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">INSURANCE</div>
                    ${s._hasInsurance?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--green);">INSURED</div>':s._insurancePending?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--orange);">PENDING</div>':`<div class="ap-detail-cell__value" style="font-size:8px;cursor:pointer;color:#aa7a5a;font-weight:700;text-decoration:underline;" onclick="event.stopPropagation();requestInsurance('${s.id}',${m})">INSURE</div>`}
                </div>
            </div>
        </div>`}o.innerHTML=a,e.style.display=K.length>0?"":"none",K.length>0&&(document.getElementById("ap-total-crew").textContent=K.length,document.getElementById("ap-total-budget").textContent=me(n),document.getElementById("ap-total-spent").textContent=me(i))}async function Ti(){if(!c)return;const{data:o,error:e}=await y.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",c.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",c.id).order("awarded_at_tick",{ascending:!0});if(e?(console.warn("Failed to load active projects:",e.message),K=[]):K=o||[],K.length>0){const t=K.map(r=>r.id),{data:n}=await y.from("finance_loan_requests").select("insured_contract_id, status").eq("request_type","insurance").in("insured_contract_id",t),{data:i}=await y.from("finance_active_loans").select("request_id, finance_loan_requests!inner(insured_contract_id)").in("status",["current"]).eq("finance_loan_requests.request_type","insurance"),a=new Set((i||[]).map(r=>r.finance_loan_requests?.insured_contract_id).filter(Boolean)),s=new Set((n||[]).filter(r=>r.status==="open").map(r=>r.insured_contract_id));for(const r of K)r._hasInsurance=a.has(r.id),r._insurancePending=s.has(r.id)}Xa()}const zo=3e4;function Io(){let o=0,e=0;for(const t of Dt)for(const n of wi){const i=ee[t.key]?.[n];i&&(o+=i.qty,e+=i.value)}return{totalUnits:o,totalValue:e}}function Si(){const o=document.getElementById("wh-list"),{totalUnits:e,totalValue:t}=Io();document.getElementById("wh-count").textContent=e.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=D(t);const n=Math.round(e/zo*100),i=document.getElementById("wh-capacity");i.textContent=n+"%",i.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)";let a="";for(let s=0;s<Dt.length;s++){const r=Dt[s],p=pi===s,l=ee[r.key]?.LOW||{qty:0,value:0},f=ee[r.key]?.STD||{qty:0,value:0},d=ee[r.key]?.HIGH||{qty:0,value:0},v=l.qty+f.qty+d.qty,m=l.value+f.value+d.value,u=v===0,x=be(r.key,"LOW",I),b=be(r.key,"STD",I),$=be(r.key,"HIGH",I),h=l.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",E=f.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",S=$.available?d.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(a+='<div class="wh-row">',a+=`<div class="wh-row__collapsed${p?" expanded":""}" onclick="toggleWhRow(${s})">
            <span class="wh-row__arrow">${p?"▾":"▸"}</span>
            <span class="wh-row__name${u?" empty":""}">${g(r.name)}</span>
            <div class="wh-row__dots">
                <div class="${h}"></div>
                <div class="${E}"></div>
                <div class="${S}"></div>
            </div>
            <span class="wh-row__qty${u?" empty":""}">${v>0?v.toLocaleString():"—"}</span>
            <span class="wh-row__val${u?" empty":""}">${m>0?D(m):"—"}</span>
        </div>`,p){a+='<div class="wh-expand">',a+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const k=[{key:"LOW",label:"Low",data:l,avail:x,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:f,avail:b,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:d,avail:$,color:"var(--green)",dotClass:"wh-dot--high"}];for(const T of k){const C=!T.avail.available,M=T.data.qty>0,w=M?"$"+Math.round(T.data.value/T.data.qty):"—";a+=`<div class="wh-grade${C?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${T.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${C?"var(--red)":T.color}">${T.label}</span>
                        ${C?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${M?"var(--text-bright)":"var(--text-dim)"}">${M?T.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${T.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${T.data.value>0?D(T.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${w}</span>
                </div>`}for(const T of k)!T.avail.available&&T.avail.failedStat&&(a+=`<div class="wh-lock">
                        <span class="wh-lock__text">${T.label.toUpperCase()} GRADE LOCKED — ${g(T.avail.failedStat)} &lt; ${T.avail.failedMin}</span>
                    </div>`);a+="</div>"}a+="</div>"}o.innerHTML=a}function Za(o){pi=pi===o?-1:o,Si()}async function zi(){if(!c)return;const{data:o,error:e}=await y.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",c.id);ee={};const t=[];if(e)console.warn("Failed to load warehouse:",e.message);else if(o){for(const n of o){const i=vo(n.material_key);ee[i]||(ee[i]={}),ee[i][n.quality_tier]={qty:n.quantity||0,value:Number(n.total_value)||0},i!==n.material_key&&t.push(n)}if(t.length>0){const n=t.map(i=>({faction_id:c.id,nation_id:c.nation_id,material_key:vo(i.material_key),quality_tier:i.quality_tier,quantity:i.quantity||0,total_value:Number(i.total_value)||0,updated_at:new Date().toISOString()}));await y.from("corp_warehouse").upsert(n,{onConflict:"faction_id,material_key,quality_tier"});for(const i of t)await y.from("corp_warehouse").delete().eq("faction_id",c.id).eq("material_key",i.material_key).eq("quality_tier",i.quality_tier)}}Si()}const es={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function Ii(){const e=(ot()?.name||I?.name||c?.nation||"—").toUpperCase(),t=!!(mt&&I&&mt.id!==I.id);document.getElementById("pr-nation-badge").textContent=(t?"IMPORT — ":"LOCAL — ")+e;const n=document.getElementById("pr-nation-select");if(n&&n.options.length===0){const p=I?.name||c?.nation||"—";let l=`<option value="">${g(p)} (HQ)</option>`;for(const f of wt)f.id!==I?.id&&(l+=`<option value="${f.id}">${g(f.name)}</option>`);n.innerHTML=l}n&&(n.value=mt?.id||"");const i=Number(c?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=D(i);const{totalUnits:a}=Io(),s=Math.round(a/zo*100),r=document.getElementById("pr-wh-capacity");r.textContent=s+"%",r.style.color=s>80?"var(--red)":s>50?"var(--orange)":"var(--green)",_n(),Ni(),No()}function _n(){const o=ot(),e=document.getElementById("pr-mat-grid");let t="";for(const n of Dt){const i=oe===n.key,a=wi.every(r=>!be(n.key,r,o).available),s="pr-mat-btn"+(i?" active":"")+(a?" all-locked":"");t+=`<span class="${s}" onclick="setPrMat('${n.key}')">${g(n.name)}</span>`}e.innerHTML=t}function Ni(){const o=ot(),e=document.getElementById("pr-tier-bar");let t='<span class="pr-tier-label">GRADE</span>';for(const n of wi){const i=be(oe,n,o),a=W===n,s=i.available?ki(oe,n,o):null,r=fn[n],p=!i.available,l="pr-tier-btn"+(a?" active":"")+(p?" locked":"");t+=`<div class="${l}" onclick="${p?"":`setPrTier('${n}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${r};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${a?"var(--text-bright)":"var(--text-dim)"}">${di[n]}</span>
            </div>
            ${s!==null?`<div class="pr-tier-btn__price" style="color:${a?"var(--text-bright)":"var(--text-muted)"}">$${s}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}e.innerHTML=t}function No(){const o=ot(),e=document.getElementById("pr-content"),t=be(oe,W,o),n=Dt.find(T=>T.key===oe);if(!n)return;if(!t.available){e.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${g(n.name)} — ${di[W]} grade
                    is not produced domestically in ${g(o?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${g(t.failedStat||"unknown")} &lt; ${t.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const i=ki(oe,W,o),a=pn(oe,W,o),s=i*xe,r=a>3e3?"LOW":a>1e3?"MODERATE":"HIGH",p=r==="LOW"?"var(--green)":r==="MODERATE"?"var(--amber)":"var(--red)",l=Number(o?.inflation??50),f=l>55?"up":l<45?"down":"flat",d=f==="up"?"&#9650;":f==="down"?"&#9660;":"&#8212;",v=f==="up"?"var(--red)":f==="down"?"var(--green)":"var(--text-dim)";let m="";m+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${i}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${v}">${d}</span>
                </div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">SUPPLY/TICK</div>
                <div class="pr-market-cell__value" style="font-size:14px;color:var(--text-bright);margin-top:2px;">${a.toLocaleString()}</div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">DEMAND</div>
                <div class="pr-market-cell__value" style="font-size:12px;color:${p};margin-top:2px;">${r}</div>
            </div>
        </div>
    </div>`,m+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${g(o?.name||"—")})</div>`;for(const T of n.priceDrivers){const C=Number(o?.[T]??50),M=C>=50?"var(--green)":C>=30?"var(--amber)":C>=15?"var(--orange)":"var(--red)",w=es[T]||T;m+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${g(T)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${C}%;background:${M}"></div>
            </div>
            <span class="pr-driver-row__val">${C}</span>
            <span class="pr-driver-row__effect">${g(w)}</span>
        </div>`}m+="</div>";const x=(Number(c?.corp_cash_reserves)||0)>=s,b=xe>a,{totalUnits:$}=Io(),h=zo-$,E=xe>h,S=h<=0,k=fn[W];m+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${g(n.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${k};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${k}">${di[W]}</span>
                </div>
                <span class="pr-order__mat-price">$${i}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(T=>`<span class="pr-qty-btn${xe===T?" active":""}" onclick="setPrQty(${T})">${T>=1e3?T/1e3+"k":T}</span>`).join("")}
                </div>
            </div>
            ${b?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${a.toLocaleString()} this tick</span>
            </div>`:""}
            ${S?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">WAREHOUSE FULL — no remaining capacity</span>
            </div>`:E?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS WAREHOUSE CAPACITY — ${h.toLocaleString()} units remaining</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${D(s)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${x&&!b&&!E&&!S?"":"disabled"}
                    title="${x?b?"Exceeds supply":S?"Warehouse full":E?"Exceeds warehouse capacity":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,e.innerHTML=m}function ts(o){const e=ot();oe=o,W="STD";for(const t of["STD","HIGH","LOW"])if(be(o,t,e).available){W=t;break}_n(),Ni(),No()}function os(o){W=o,Ni(),No()}function is(o){xe=o,No()}let Go=!1;async function ns(o){if(!o)mt=null;else{let n=wt.find(i=>i.id===o);if(!n)try{const{data:i}=await y.from("nations").select("*").eq("id",o).single();n=i}catch{}mt=n||null}const e=ot();if(!be(oe,W,e).available){W="STD";for(const n of["STD","HIGH","LOW"])if(be(oe,n,e).available){W=n;break}}const t=document.getElementById("pr-nation-select");t&&(t.value=o||""),Ii()}async function as(){if(Go||!c||!I)return;const o=ot(),e=ki(oe,W,o),t=pn(oe,W,o),n=e*xe,i=Number(c.corp_cash_reserves)||0;if(n>i){alert("Insufficient cash reserves.");return}if(xe>t){alert("Exceeds available supply this tick.");return}const{totalUnits:a}=Io(),s=zo-a;if(s<=0){alert("Warehouse is full. Cannot purchase more materials.");return}if(xe>s){alert(`Warehouse can only hold ${s.toLocaleString()} more units. Reduce quantity.`);return}Go=!0;const r=document.querySelector(".pr-purchase-btn");r&&(r.disabled=!0,r.textContent="...");try{const p=i-n,{error:l}=await y.from("factions").update({corp_cash_reserves:p}).eq("id",c.id);if(l)throw l;const f=vo(oe),d=ee[f]?.[W],v=(d?.qty||0)+xe,m=(d?.value||0)+n,{error:u}=await y.from("corp_warehouse").upsert({faction_id:c.id,nation_id:c.nation_id,material_key:f,quality_tier:W,quantity:v,total_value:m,last_purchased_tick:z?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(u){const{error:b}=await y.from("factions").update({corp_cash_reserves:i}).eq("id",c.id);throw b&&console.error("Cash refund failed after warehouse error:",b.message),u}c.corp_cash_reserves=p,ee[f]||(ee[f]={}),ee[f][W]={qty:v,value:m};const x=Math.floor(n/1e6);if(x>=1&&o?.id){const b=x*.01,{data:$,error:h}=await y.from("nations").select("gdp_growth").eq("id",o.id).single();if(!h&&$){const E=Math.min(100,Math.round((Number($.gdp_growth??50)+b)*100)/100);await y.from("nations").update({gdp_growth:E}).eq("id",o.id),I?.id===o.id&&(I.gdp_growth=E)}}Si(),Ii(),r&&(r.textContent="PURCHASED",setTimeout(()=>{r.isConnected&&(r.disabled=!1,r.textContent="PURCHASE")},1500))}catch(p){r&&(r.disabled=!1,r.textContent="PURCHASE"),alert("Purchase failed: "+(p.message||"Unknown error"))}finally{Go=!1}}function hn(o){const e=Ye||I;if(!e)return[];const t=So(o);if(!t)return[];const n=ka(o,e),i=[],a=Number(e?.inflation??50),s=Number(e?.fuel_prices??50);Number(e?.manufacturing_output??50);const r=Ye&&I&&Ye.id!==I.id;let p=null;if(r&&(p=Ea(e,I)),n.newAvailable>0){const l=on(o,e),f=t.basePrice,d=Math.round(f*((a-50)/200)),v=Math.round(f*((s-50)/300));let m=l;const u=[{label:"Base price",value:D(f)},d!==0?{label:`Inflation (${a})`,mod:(d>=0?"+":"")+D(Math.abs(d))}:null,v!==0?{label:`Fuel transport (${s})`,mod:(v>=0?"+":"")+D(Math.abs(v))}:null].filter(Boolean),x=l-f-d-v;if(x!==0&&!r&&u.push({label:"Demand/scarcity",mod:(x>=0?"+":"")+D(Math.abs(x))}),r&&p){const b=Math.round(l*p.tariff),$=Math.round(l*p.transport);m=l+b+$,u.push({label:`Import tariff (${Math.round(p.tariff*100)}%)`,mod:"+"+D(b)}),u.push({label:`Transport (${p.deliveryTicks} tick${p.deliveryTicks>1?"s":""})`,mod:"+"+D($)})}i.push({seller:r?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:r?p?.deliveryTicks||1:0,condition:100,price:Math.round(m),available:n.newAvailable,delivery:r?p.deliveryTicks+" tick"+(p.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:r?p.deliveryTicks:0,used:!1,priceFactors:u,sourceNationId:e.id})}if(n.usedAvailable>0){const l=n.usedCondition,f=on(o,e,{used:!0,condition:l});let d=f;const v=[{label:"Base price",value:D(t.basePrice)},{label:`Condition (${l}%)`,mod:"-"+D(Math.max(0,t.basePrice-f))}];if(r&&p){const m=Math.round(f*p.tariff),u=Math.round(f*p.transport);d=f+m+u,v.push({label:`Import tariff (${Math.round(p.tariff*100)}%)`,mod:"+"+D(m)}),v.push({label:`Transport (${p.deliveryTicks} tick${p.deliveryTicks>1?"s":""})`,mod:"+"+D(u)})}i.push({seller:r?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:r?p?.deliveryTicks||1:0,condition:l,price:Math.round(d),available:n.usedAvailable,delivery:r?p.deliveryTicks+" tick"+(p.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:r?p.deliveryTicks:0,used:!0,priceFactors:v,sourceNationId:e.id})}return i}function Ao(){const o=Number(c?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=D(o);const e=So(fe),t=jt[e?.tier||1],n=document.getElementById("em-tier-badge");n&&(n.textContent=t.tag,n.style.color=t.color),n.style.background=t.color+"0a",n.style.border="1px solid "+t.color+"33";const i=document.getElementById("em-nation-select");if(i&&i.options.length===0){const r=I?.name||c?.nation||"—";let p=`<option value="">${g(r)} (HQ)</option>`;for(const l of wt)l.id!==I?.id&&(p+=`<option value="${l.id}">${g(l.name)}</option>`);i.innerHTML=p}const a=document.getElementById("em-import-tag"),s=Ye&&I&&Ye.id!==I.id;a&&(a.style.display=s?"":"none"),ss(),Ai()}function ss(){let o="";for(let e=1;e<=3;e++){const t=jt[e],n=ci(e),i=e===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";o+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${t.color}">${t.tag}</div>
            <div class="${i}">`;for(const a of n){const s=fe===a.key,r=hn(a.key).length>0;o+=`<span class="em-selector__btn${s?" active":""}${r?"":" no-listings"}"
                style="${s?"background:"+t.color+";border-color:"+t.color:""}"
                onclick="setEmType('${a.key}')">${g(a.name)}</span>`}o+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${o}</div>`}function Ai(){const o=document.getElementById("em-content");if(Oe=hn(fe),Oe.length===0){o.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}Ee>=Oe.length&&(Ee=0);let e="";for(let n=0;n<Oe.length;n++){const i=Oe[n],a=Ee===n,s=i.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",r=mn(i.condition);e+=`<div class="em-listing${a?" selected":""}" style="${a?"border-left-color:"+s:""}" onclick="setEmListing(${n})">`,e+=`<div class="em-listing__row1">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="em-listing__seller">${g(i.seller)}</span>
                <span class="em-badge em-badge--${i.sellerType.toLowerCase()}">${i.sellerType}</span>
                ${i.used?'<span class="em-badge em-badge--used">USED</span>':""}
            </div>
        </div>`,e+=`<div class="em-listing__row2">
            <span class="em-listing__nation">${g((i.nation||"").toUpperCase())}</span>
            ${i.distance>0?`<span class="em-listing__distance">${i.distance} nation${i.distance>1?"s":""} away</span>`:""}
            <span class="em-listing__delivery">Delivery: ${g(i.delivery)}</span>
        </div>`,e+=`<div class="em-listing__stats">
            <div class="em-stat-cell" style="flex:1">
                <div class="em-stat-cell__label">COND.</div>
                <div class="em-stat-cell__bar">
                    <div class="em-stat-cell__bar-track"><div class="em-stat-cell__bar-fill" style="width:${i.condition}%;background:${r}"></div></div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${r}">${i.condition}%</span>
                </div>
            </div>
            <div class="em-stat-cell" style="flex:0.8;text-align:center">
                <div class="em-stat-cell__label">AVAIL.</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${i.available}</div>
            </div>
            <div class="em-stat-cell" style="flex:1.2">
                <div class="em-stat-cell__label">PRICE/UNIT</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${D(i.price)}</div>
            </div>
        </div>`,a&&i.priceFactors&&(e+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${i.priceFactors.map(p=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${g(p.label)}</span>
                    <span class="em-breakdown__mod" style="color:${p.mod?p.mod.startsWith("-")?"var(--green)":p.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${p.mod||p.value}</span>
                </div>`).join("")}
            </div>`),e+="</div>"}const t=Oe[Ee];if(t){const n=So(fe),i=jt[n?.tier||1],a=Math.min(t.available,4),s=t.price*Te,r=(Number(c?.corp_cash_reserves)||0)>=s;e+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${g(n?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${g(t.seller)}</span>
                </div>
                <span class="em-purchase__price">${D(t.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:a},(p,l)=>l+1).map(p=>`<span class="em-qty-btn${Te===p?" active":""}" style="${Te===p?"background:"+i.color+";border-color:"+i.color:""}" onclick="setEmQty(${p})">${p}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${t.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${D(s)}</div>
                    ${t.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${g(t.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${i.color}" onclick="purchaseEquipment()"
                    ${r?"":"disabled"}
                    title="${r?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}o.innerHTML=e}async function rs(o){if(!o)Ye=null;else{let t=wt.find(n=>n.id===o);if(!t)try{const{data:n}=await y.from("nations").select("*").eq("id",o).single();t=n}catch{}Ye=t||null}Ee=0,Te=1;const e=document.getElementById("em-nation-select");e&&(e.value=o||""),Ao()}function ls(o){fe=o,Ee=0,Te=1,Ao()}function ds(o){Ee=o,Te=1,Ai()}function cs(o){Te=o,Ai()}let Vo=!1;async function ps(){if(Vo)return;const o=Oe[Ee];if(!o||!c)return;const e=So(fe);if(!e)return;const t=Te,n=o.price*t,i=Number(c.corp_cash_reserves)||0;if(n>i){alert("Insufficient cash reserves.");return}if(t>o.available){alert("Not enough units available.");return}const a=document.querySelector(".em-purchase-btn");a&&(a.disabled=!0,a.textContent="..."),Vo=!0;try{const s=i-n,{error:r}=await y.from("factions").update({corp_cash_reserves:s}).eq("id",c.id);if(r)throw r;const p=!o.deliveryTicks||o.deliveryTicks===0;if(p){const f=se.find(E=>E.equipment_key===fe),d=(f?.owned||0)+t,v=f?.purchase_price_avg||0,m=f?.owned||0,u=m>0?Math.round((v*m+o.price*t)/d):o.price,x=e.maintenancePerUnit*d,b=f?.condition||100,$=Math.round((b*m+o.condition*t)/d),{error:h}=await y.from("corp_equipment").upsert({faction_id:c.id,nation_id:c.nation_id,equipment_key:fe,tier:e.tier,owned:d,deployed:f?.deployed||0,condition:$,maintenance_per_tick:x,purchase_price_avg:u,last_purchased_tick:z?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(h){const{error:E}=await y.from("factions").update({corp_cash_reserves:i}).eq("id",c.id);throw E&&console.error("Cash refund failed:",E.message),h}f?(f.owned=d,f.condition=$,f.maintenance_per_tick=x):se.push({equipment_key:fe,tier:e.tier,owned:d,deployed:0,condition:$,maintenance_per_tick:x,assigned_projects:[]})}else{const f=(z?.current_tick||0)+o.deliveryTicks,{error:d}=await y.from("corp_equipment_deliveries").insert({faction_id:c.id,equipment_key:fe,quantity:t,condition:o.condition,delivery_tick:f,source_nation_id:o.sourceNationId||null,seller_name:o.seller,price_paid:n});if(d){const{error:v}=await y.from("factions").update({corp_cash_reserves:i}).eq("id",c.id);throw v&&console.error("Cash refund failed:",v.message),d}}c.corp_cash_reserves=s,Pi(),Ao();const l=document.getElementById("pr-cash");l&&(l.textContent=D(s)),a&&(a.textContent=p?"PURCHASED":"ORDERED",setTimeout(()=>{a.isConnected&&(a.disabled=!1,a.textContent="PURCHASE")},1500))}catch(s){a&&(a.disabled=!1,a.textContent="PURCHASE"),alert("Purchase failed: "+(s.message||"Unknown error"))}finally{Vo=!1}}let fs=-1,lt=[],bo=[],yi=[];function Wo(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o.toLocaleString()}function ms(o,e,t){if(t)return"var(--orange)";const n=o/(e||1)*100;return n>50?"var(--green)":n>25?"var(--amber)":"var(--red)"}function rn(){const o=document.getElementById("pm-list"),e=lt.length,t=bo.length,n=yi.length,i=lt.filter(p=>p.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${e})`,document.getElementById("pm-pending-count").textContent=`(${t})`,document.getElementById("pm-apply-count").textContent=`(${n})`;const a=document.getElementById("pm-badges");let s="";i>0&&(s+=`<span class="pm-badge pm-badge--expiring">${i} EXPIRING</span>`),t>0&&(s+=`<span class="pm-badge pm-badge--pending">${t} PENDING</span>`),a.innerHTML=s;const r=lt.reduce((p,l)=>p+(l.cost||0),0)+bo.reduce((p,l)=>p+(l.cost||0),0);document.getElementById("pm-total-cost").textContent=Wo(r),document.getElementById("pm-footer-active").textContent=e,document.getElementById("pm-footer-pending").textContent=t;{if(e===0){o.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let p="";lt.forEach((l,f)=>{const d=fs===f,v=ms(l.ticks_left,l.total_ticks,l.expiring_soon),m=Math.min(l.ticks_left/(l.total_ticks||1)*100,100);p+=`<div class="pm-item ${l.expiring_soon?"pm-item--expiring":""} ${d?"expanded":""}" onclick="togglePmExpand(${f})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${g(l.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${g((l.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${v}">Expires: ${g(l.expires||"")}</span>
                        <span class="pm-item__ticks">(${l.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${m}%;background:${v}"></div></div>`,d&&(p+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${g(l.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${g(l.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${Wo(l.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${l.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${l.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(l.projects||[]).map(u=>`<span class="pm-project-chip">${g(u)}</span>`).join("")}</div>
                    </div>`,l.note&&(p+=`<div class="pm-note"><span class="pm-note__text">${g(l.note)}</span></div>`),l.expiring_soon&&l.renewable&&(p+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew" onclick="event.stopPropagation(); pmApplyForPermit('${l.permit_key}');">RENEW — ${Wo(l.cost||0)}</button></div>`),p+="</div>"),p+="</div></div>"}),o.innerHTML=p;return}}let Yo=!1;async function us(o){if(!(Yo||!c||!I)){Yo=!0;try{const{data:e}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{data:n,error:i}=await y.rpc("apply_for_permit",{p_faction_id:c.id,p_nation_id:I.id,p_permit_key:o,p_current_tick:t});if(i){alert("Application failed: "+i.message);return}if(n&&!n.success){alert(n.error||"Application failed");return}alert("Permit application submitted! Processing: "+(n.processing_ticks||0)+" ticks."),await $n()}catch(e){alert("Error: "+e.message)}finally{Yo=!1}}}window.pmApplyForPermit=us;async function $n(){if(!c||!I){lt=[],bo=[],yi=[],rn();return}const{data:o}=await y.from("construction_permits").select("*"),e=o||[],t={};for(const d of e)t[d.permit_key]=d;const{data:n}=await y.from("corp_permits").select("*").eq("faction_id",c.id).eq("nation_id",I.id),i=n||[],{data:a}=await y.from("active_laws").select("policy_id, policies(permit_key, policy_name)").eq("nation_id",I.id).not("policies.permit_key","is",null),s=new Set,r={};for(const d of a||[])d.policies?.permit_key&&(s.add(d.policies.permit_key),r[d.policies.permit_key]=d.policies.policy_name);const{data:p}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),l=p?.current_tick||0;lt=i.filter(d=>d.status==="active").map(d=>{const v=t[d.permit_key]||{},m=d.expires_at_tick?Math.max(0,d.expires_at_tick-l):999,u=v.duration_ticks||24;return{name:v.name||d.permit_key,permit_key:d.permit_key,nation:I.name,policy:r[d.permit_key]||"—",issued:d.granted_at_tick!=null?Fe(d.granted_at_tick):"—",expires:d.expires_at_tick?Fe(d.expires_at_tick):"Single-use",cost:d.cost_paid||0,ticks_left:m,total_ticks:u,expiring_soon:m<=3&&m>0,renewable:v.duration_ticks!=null,projects:[]}}),bo=i.filter(d=>d.status==="pending").map(d=>{const v=t[d.permit_key]||{},m=v.processing_ticks||2,u=l-d.applied_at_tick,x=Math.max(0,m-u);return{name:v.name||d.permit_key,permit_key:d.permit_key,nation:I.name,applied:Fe(d.applied_at_tick),status:"PROCESSING",processing_total:m,ticks_remaining:x,est_approval:Fe(d.applied_at_tick+m),cost:d.cost_paid||0,required_by:r[d.permit_key]||"—"}});const f=new Set(i.filter(d=>d.status==="active"||d.status==="pending").map(d=>d.permit_key));yi=[...s].filter(d=>!f.has(d)).map(d=>{const v=t[d]||{};return{name:v.name||d,permit_key:d,nation:I.name,description:v.description||"",policy:r[d]||"—",cost:v.cost_is_percentage?15e4:v.cost||0,processing_time:v.processing_ticks||2,duration:v.duration_ticks?v.duration_ticks+" ticks":"Single-use",category:v.category||"",difficulty:v.difficulty||"EASY"}}),rn()}let Ue=[],vs=-1;function $e(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(2)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o.toLocaleString()}function ln(o){return o>=85?"var(--gold)":o>=60?"var(--green)":o>=40?"var(--orange)":"var(--red)"}function ys(o){return"dl-result--"+o.toLowerCase()}function dn(){const o=document.getElementById("dl-list"),e=Ue.length;document.getElementById("dl-count").textContent=`${e} COMPLETED`;const t=Ue.reduce((r,p)=>{const l=p.financials||{};return r+((l.payment||0)+(l.bonus||0)-(l.penalty||0)-(l.total_cost||0))},0),n=document.getElementById("dl-lifetime-profit");n.textContent=(t>=0?"+":"")+$e(t),n.style.color=t>=0?"var(--green)":"var(--red)";const i={};Ue.forEach(r=>{i[r.result]=(i[r.result]||0)+1});const a=document.getElementById("dl-footer-results");if(a.innerHTML=Object.entries(i).map(([r,p])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[r]||"var(--text-dim)"}">${g(r)}</div>
            <div class="dl-footer__result-count">${p}</div>
        </div>`).join(""),e===0){o.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let s="";Ue.forEach((r,p)=>{const l=vs===p,f=r.financials||{},d=(f.payment||0)+(f.bonus||0)-(f.penalty||0)-(f.total_cost||0),v=d>=0,m=ys(r.result),x={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[r.result]||"var(--text-dim)",b=r.type==="GOVERNMENT";if(s+=`<div class="dl-item ${l?"expanded":""}" onclick="toggleDlExpand(${p})">
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
                            <span class="dl-summary-value" style="color:${ln(r.quality_score)}">${r.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${r.rep_change>0?"var(--green)":r.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${r.rep_change>0?"+":""}${r.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${v?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${v?"var(--green)":"var(--red)"};margin-top:2px;">${v?"+":""}${$e(d)}</div>
                    </div>
                </div>`,l){const $=r.inspection||{};s+='<div style="margin-top:8px;">',s+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(k=>{const T=$[k]||{score:0,issues:[]},C=ln(T.score),M=Math.min(T.score/100*100,100);s+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${g(k.charAt(0).toUpperCase()+k.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${M}%;background:${C}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${C}">${T.score}</span>
                        </div>
                    </div>
                    ${(T.issues||[]).map(w=>`<div class="dl-inspect-issue">${g(w)}</div>`).join("")}
                </div>`});const h=$.permits||{passed:!0,issues:[]};s+=`<div class="dl-permits-row ${h.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${h.passed?"var(--green)":"var(--red)"}">${h.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${(h.issues||[]).map(k=>`<div class="dl-inspect-issue dl-inspect-issue--red">${g(k)}</div>`).join("")}
            </div>`,s+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',s+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(r.materials_used||[]).forEach(k=>{const T=k.grade==="HIGH"?"var(--green)":k.grade==="STANDARD"?"var(--amber)":"var(--orange)",C=k.impact==="positive"?"▲":k.impact==="negative"?"▼":"–",M=k.impact==="positive"?"var(--green)":k.impact==="negative"?"var(--red)":"var(--text-dim)";s+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${g(k.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${T}"></div>
                    <span class="dl-mat-tag__grade" style="color:${T}">${g(k.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${M}">${C}</span>
                </div>`}),s+="</div>",s+='<div class="dl-section-label">Financial Summary</div>',s+='<div class="dl-fin-panel">',s+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${$e(f.contract_value||0)}</span></div>`,(f.bonus||0)>0&&(s+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${$e(f.bonus)}</span></div>`),(f.penalty||0)>0&&(s+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${$e(f.penalty)}</span></div>`);const E=(f.payment||0)+(f.bonus||0)-(f.penalty||0);s+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${$e(E)}</span></div>`,s+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${$e(f.total_cost||0)}</span></div>`,s+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${v?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${v?"var(--green)":"var(--red)"}">${v?"+":""}${$e(d)}</span>
            </div>`,s+="</div>";const S=r.timeline||{};s+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${S.actual||0}/${S.expected||0} ticks</span>`,S.early?s+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(S.expected||0)-(S.actual||0)} TICK${S.expected-S.actual!==1?"S":""} EARLY</span>`:!S.on_time&&S.actual>S.expected&&(s+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(S.actual||0)-(S.expected||0)} TICK${S.actual-S.expected!==1?"S":""} LATE</span>`),s+="</div>",s+="</div>"}s+="</div></div>"}),o.innerHTML=s}let vt=!1,Qo=!1;function wn(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+Math.round(o/1e3)+"k":"$"+Math.round(o)}async function Mi(){var{data:o,error:e}=await y.from("factions").select("*").eq("id",c.id).single();if(e){console.warn("Faction refresh failed:",e.message);return}o&&(c=o);var t=document.getElementById("topbar-cash");t&&(t.textContent="CASH: "+wn(Number(c.corp_cash_reserves??0)))}const gi={CRITICAL:"#c55",HIGH:"#5c5",MODERATE:"#ca5",LOW:"#6a6660"};let yt=[],Ri=[],kn="ready",Rt=null,_o="ALL",te=-1;const cn={COASTAL:{color:"#8b9a6b",label:"COASTAL"},INTERNATIONAL:{color:"#5a8aaa",label:"INTL"},GOVERNMENT:{color:"#c8a832",label:"GOV CONTRACT"}};function gs(o){_o=o,te=-1,document.querySelectorAll(".ar-pill").forEach(e=>{const t=e.getAttribute("data-ar-filter");e.className="ar-pill"+(t===o?" active-"+(o==="ALL"?"all":o==="COASTAL"?"coastal":o==="INTERNATIONAL"?"intl":"gov"):"")}),Oi()}function Li(){return _o==="ALL"?yt:yt.filter(o=>o.scope===_o)}async function qi(){if(!c||c.corp_sector!=="Shipping")return;const o=await _a(y,c.id,c.corp_subsector);yt=o.routes,Ri=o.applications,kn=o.state,Rt=o.error,Rt&&console.warn("Failed to load available routes:",Rt.message),te=-1,Oi()}var xs={fuel_energy:[{stat:"industrialization",label:"Industrialization"},{stat:"urbanization",label:"Urbanization"}],minerals:[{stat:"industrialization",label:"Industrialization"},{stat:"manufacturing",label:"Manufacturing"}],grains_staples:[{stat:"population_growth",label:"Population Growth"},{stat:"food_security",label:"Food Security"}],livestock_dairy:[{stat:"standard_of_living",label:"Std of Living"},{stat:"food_security",label:"Food Security"}],cash_crops:[{stat:"trade_balance",label:"Trade Balance"},{stat:"foreign_investment",label:"Foreign Investment"}],manufactured_goods:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],technology:[{stat:"technology",label:"Technology"},{stat:"higher_education",label:"Higher Education"}],fruits_vegetables:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],arms:[{stat:"military_spending",label:"Military Spending"},{stat:"stability",label:"Stability"}]};function bs(o){return xs[o]||[]}function _s(o){var e=Number(o.competition_count||0),t=o.demand_level||"",n=o.scope==="GOVERNMENT";return n?"Fixed payment. No demand risk. Vessel locked for contract duration.":e===0&&t==="CRITICAL"?"Unserved critical corridor. High volume, no competition — claim immediately.":e===0&&t==="HIGH"?"Virgin route with strong demand. First-mover advantage available.":e===0?"No competition on this route. Market share starts at 100%.":t==="CRITICAL"&&e<=2?"Underserved critical route. Demand exceeds current capacity.":t==="LOW"?"Thin route. Revenue may not justify vessel deployment.":e>=3?"Crowded route. Market share will be split "+(e+1)+" ways.":Number(o.tariff_rate||0)>15?"High tariff rate cuts into margins. Watch for trade policy changes.":null}function Oi(){const o=Li();document.getElementById("ar-count").textContent=yt.length+" ROUTES";var e={COASTAL:0,INTERNATIONAL:0,GOVERNMENT:0};yt.forEach(function($){e[$.scope]!==void 0&&e[$.scope]++});var t=e.COASTAL,n=e.INTERNATIONAL,i=e.GOVERNMENT;document.getElementById("ar-footer-counts").innerHTML='<div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#8b9a6b"></div><span class="ar-footer__count-label">COASTAL</span><span class="ar-footer__count-num">'+t+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#5a8aaa"></div><span class="ar-footer__count-label">INTL</span><span class="ar-footer__count-num">'+n+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#c8a832"></div><span class="ar-footer__count-label">GOV</span><span class="ar-footer__count-num">'+i+"</span></div>";const a=document.getElementById("ar-claim-btn");a.className="ar-claim-btn"+(te>=0?" active":"");const s=document.getElementById("ar-list");if(kn==="error"){s.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+g(Rt&&Rt.message||"Shipping routes are temporarily unavailable.")+"</div></div>";return}if(o.length===0){s.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+(yt.length===0?"No routes available.<br>Routes are generated from bilateral<br>trade each tick. Check back after<br>the next corp tick fires.":"No "+_o.toLowerCase()+" routes available.")+"</div></div>";return}let r="";for(let $=0;$<o.length;$++){const h=o[$],E=te===$,S=cn[h.scope]||cn.INTERNATIONAL,k=h.scope==="GOVERNMENT",T=h.demand_level&&gi[h.demand_level]?{color:gi[h.demand_level],label:h.demand_level}:null,C=Number(h.competition_count||0),M=C===0?"#5c5":C<=2?"#ca5":"#c84";r+='<div style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid '+(E?S.color:"transparent")+";background:"+(E?S.color+"08":"transparent")+';" onclick="arSelectRoute('+$+')"><div style="padding:8px 14px;">',r+='<div style="display:flex;align-items:center;gap:0;margin-bottom:4px;"><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+g(h.origin_port||"?")+'</span><div style="flex:1;display:flex;align-items:center;margin:0 8px;"><div style="flex:1;height:1px;background:'+S.color+'44"></div><span style="font-family:var(--font-mono);font-size:7px;color:'+S.color+';padding:0 6px">⚓</span><div style="flex:1;height:1px;background:'+S.color+'44"></div></div><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+g(h.destination_port||"?")+"</span></div>",r+='<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;"><span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+S.color+";background:"+S.color+"12;border:1px solid "+S.color+'25">'+S.label+"</span>",T&&(r+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+T.color+";background:"+T.color+"12;border:1px solid "+T.color+'25">'+T.label+" DEMAND</span>"),k&&h.gov_issuer&&(r+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">'+g(h.gov_issuer)+"</span>"),C===0&&!k&&(r+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15)">NO COMPETITION</span>');var p=Ri.find(function(w){return w.route_id===h.id});if(p){var l=p.status==="approved"?"#5c5":"#c8a832",f=p.status==="approved"?"APPROVED":"APPLIED";r+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+l+";background:"+l+"12;border:1px solid "+l+'25">'+f+"</span>"}if(r+='<span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-left:auto">'+(h.transit_ticks||"?")+" tick"+((h.transit_ticks||0)!==1?"s":"")+" · "+g(h.vessel_class||"?")+"</span>",r+="</div>",r+='<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">',k?(r+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(h.gov_contract_duration||h.transit_ticks||"?")+" ticks</div></div>",r+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VESSEL</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+g(h.vessel_class||"?")+"</div></div>",r+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT VALUE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-top:1px">'+D(Number(h.gov_contract_value||h.estimated_revenue||0))+"</div></div>"):(r+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VOLUME</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);margin-top:1px">'+D(Number(h.trade_volume||0))+"</div></div>",r+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">COMP.</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+M+';margin-top:1px">'+C+"</div></div>",r+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">TRANSIT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(h.transit_ticks||"?")+" tick"+((h.transit_ticks||0)!==1?"s":"")+"</div></div>",r+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">EST. REV</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;margin-top:1px">'+D(Number(h.estimated_revenue||0))+"</div></div>"),r+="</div>",E){if(r+='<div style="margin-top:6px;">',k&&h.goods_description&&(r+='<div style="font-size:10px;color:var(--text-muted);line-height:1.5;margin-bottom:6px">'+g(h.goods_description)+"</div>"),h.trade_agreement_name&&(r+='<div style="padding:4px 8px;margin-bottom:5px;background:rgba(90,138,170,0.05);border:1px solid rgba(90,138,170,0.12)"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:var(--font-mono);font-size:7px;color:#5a8aaa;letter-spacing:0.5px">TRADE AGREEMENT</div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:1px">'+g(h.trade_agreement_name)+'</div></div><div style="text-align:right"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">TARIFF</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(Number(h.tariff_rate||0)>10?"#c84":"#5c5")+'">'+Number(h.tariff_rate||0).toFixed(1)+"%</div></div></div></div>"),r+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px">',r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VESSEL CLASS</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+g(h.vessel_class||"?")+"</span></div>",h.vessel_note&&(r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">REQUIREMENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+g(h.vessel_note)+"</span></div>"),r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">PROXIMITY</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+(h.proximity!=null?h.proximity:"?")+" / 100</span></div>",r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CARGO</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+g(h.goods_name||"Unknown")+"</span></div>",h.goods_description&&!k&&(r+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CONTENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+g(h.goods_description)+"</span></div>"),r+='<div style="display:flex;justify-content:space-between;padding:2px 0"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VOLUME</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+Number(h.volume_physical||0).toLocaleString()+" "+g(h.volume_unit||"tons")+"</span></div>",r+="</div>",I&&!k){var d=bs(h.trade_sector);if(d.length>0){r+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.8px;margin-bottom:3px">DEMAND DRIVERS</div>';for(var v=0;v<d.length;v++){var m=d[v],u=Number(I[m.stat]??50),x=u>=50?"#5c5":u>=30?"#ca5":"#c84";r+='<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);width:100px">'+g(m.label)+'</span><div style="width:40px;height:2px;background:var(--border-0)"><div style="width:'+u+"%;height:100%;background:"+x+'"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-bright)">'+Math.round(u)+"</span></div>"}r+="</div>"}}var b=_s(h);b&&(r+='<div style="padding:4px 8px;background:'+S.color+"08;border:1px solid "+S.color+'15"><div style="font-size:9px;color:var(--text-muted);line-height:1.5">'+g(b)+"</div></div>"),r+="</div>"}r+="</div></div>"}s.innerHTML=r}function hs(o){te=te===o?-1:o,Oi()}async function $s(){if(!(vt||te<0||!c||!z)){var o=Li(),e=o[te];if(e){var t=Ri.find(function(u){return u.route_id===e.id});if(t){alert("You have already applied for this route. Status: "+t.status);return}var n={"Bulk Cargo":"bulk_cargo","Container Freight":"container_freight","Specialized Transport":"specialized_transport"},i=n[c.corp_subsector]||"";if(e.shipping_subsector&&i!==e.shipping_subsector){var a=e.shipping_subsector.replace(/_/g," ").replace(/\b\w/g,function(u){return u.toUpperCase()});alert("Your fleet specializes in "+(c.corp_subsector||"?")+" but this route requires "+a+". You cannot service this route.");return}var s=5e4,{data:r}=await y.from("factions").select("corp_cash_reserves").eq("id",c.id).single(),p=Number(r?.corp_cash_reserves??0);if(p<s){alert("Not enough funds. Application fee: $50k. You have $"+Math.round(p/1e3)+"k.");return}vt=!0;var l=document.getElementById("ar-claim-btn");l.textContent="APPLYING...";try{var f=p-s,{error:d}=await y.from("factions").update({corp_cash_reserves:f}).eq("id",c.id);if(d){alert("Failed to deduct fee.");return}var{data:v,error:m}=await y.from("shipping_applications").insert({route_id:e.id,faction_id:c.id,proposed_rate:Number(e.estimated_revenue||0),application_fee:s,status:"pending",applied_at_tick:z.current_tick}).select("*").single();if(m){alert("Application failed: "+m.message),await y.from("factions").update({corp_cash_reserves:p}).eq("id",c.id);return}await y.from("event_log").insert({nation_id:e.origin_nation_id,event_name:c.faction_name+" applied to service "+(e.origin_port||"?")+" → "+(e.destination_port||"?")+" route",category:"corporate",description_chosen:c.faction_name+" has submitted a shipping application for the "+(e.goods_name||"trade")+" route between "+(e.origin_port||"?")+" and "+(e.destination_port||"?")+". Awaiting government approval.",fired_at_tick:z.current_tick}).catch(function(){}),await Mi(),te=-1,await qi(),alert("Application submitted! The government will review your application.")}catch(u){alert("Application failed: "+(u.message||"Network error"))}finally{vt=!1,l.textContent="APPLY TO SERVICE — $50k",l.className="ar-claim-btn"+(te>=0?" active":"")}}}}async function ws(){if(!(vt||te<0||!c||!z)){var o=Li(),e=o[te];if(e){var t=Number(c.shipping_fleet_capacity??0),n=Number(c.shipping_fleet_deployed??0);if(n>=t){alert("No available vessels. Fleet capacity: "+t+", deployed: "+n+".");return}vt=!0;var i=document.getElementById("ar-claim-btn");i.textContent="CLAIMING...",i.className="ar-claim-btn";try{var{data:a,error:s}=await y.rpc("claim_shipping_route",{p_faction_id:c.id,p_route_id:e.id,p_current_tick:z.current_tick});if(s){alert("Claim failed: "+s.message);return}if(a&&!a.success){alert(a.error||"Claim failed.");return}if(a?.claim_id){var r=(_e||[]).find(function(v){return v.status==="in_port"&&!v.active_claim_id&&v.fuel>=10});if(r){var{error:p}=await y.from("corp_vessels").update({status:"in_transit",active_claim_id:a.claim_id,current_port_nation_id:null}).eq("id",r.id);p&&console.warn("Failed to assign vessel to route:",p.message)}else console.warn("Route claimed but no available vessel with fuel >= 10% to assign.")}try{var l=e.origin_nation?.name||e.origin_nation_id||"Unknown",f=e.destination_nation?.name||e.destination_nation_id||"Unknown",d=e.goods_type||e.cargo_type||"goods";await y.from("event_log").insert({nation_id:c.nation_id,event_name:"Shipping Route Signed",category:"corporate",description_chosen:c.faction_name+" has just signed an agreement to ship "+d+" between "+l+" and "+f+".",fired_at_tick:z.current_tick||0})}catch{}await Mi(),te=-1,await Promise.all([qi(),Bi(),he()])}catch(v){alert("Claim failed: "+(v.message||"Network error"))}finally{vt=!1,i.textContent="CLAIM ROUTE",i.className="ar-claim-btn"+(te>=0?" active":"")}}}}let Be=[],En="ready",Lt=null,ho=-1;async function Bi(){if(!c||c.corp_sector!=="Shipping")return;const o=await xa(y,c.id);Be=o.claims,En=o.state,Lt=o.error,Lt&&console.warn("Failed to load active voyages:",Lt.message),Cn()}function ks(o){ho=ho===o?-1:o,Cn()}async function Es(o){if(!(Qo||!c||!z)){Qo=!0;try{var{data:e,error:t}=await y.rpc("release_shipping_route",{p_faction_id:c.id,p_claim_id:o,p_current_tick:z.current_tick});if(t){alert("Release failed: "+t.message);return}if(e&&!e.success){alert(e.error||"Release failed.");return}var{error:n}=await y.from("corp_vessels").update({status:"in_port",active_claim_id:null}).eq("active_claim_id",o).eq("faction_id",c.id);n&&console.warn("Failed to free vessel on release:",n.message),ho=-1,await Mi(),await Promise.all([qi(),Bi(),he()])}catch(i){alert("Release failed: "+(i.message||"Network error"))}finally{Qo=!1}}}function Cn(){const o=z?.current_tick||0,e=Number(c?.shipping_fleet_capacity??0),t=Number(c?.shipping_fleet_deployed??0),n=c?.corp_subsector||"--";document.getElementById("av-count").textContent=Be.length+" ACTIVE";const i=Be.reduce((f,d)=>f+Number(d.total_revenue||0),0),a=Be.reduce((f,d)=>f+(d.transits_completed||0),0),s=a>0?Math.round(i/a):0;document.getElementById("av-summary").innerHTML=`
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
            <div class="av-summary__value" style="color:var(--green)">${D(s)}</div>
        </div>`,document.getElementById("av-total-revenue").textContent=D(i),document.getElementById("av-total-revenue").style.color=i>0?"var(--green)":"var(--text-dim)",document.getElementById("av-fleet-status").textContent=t+"/"+e,document.getElementById("av-subsector").textContent=n;const r=document.getElementById("av-list");if(En==="error"){r.innerHTML='<div class="av-empty"><div class="av-empty__text">'+g(Lt&&Lt.message||"Active voyage data is temporarily unavailable.")+"</div></div>";return}if(Be.length===0){r.innerHTML='<div class="av-empty"><div class="av-empty__text">No active voyages.<br>Claim a shipping route to<br>deploy your fleet.</div></div>';return}let p="";for(let f=0;f<Be.length;f++){const d=Be[f],v=d.shipping_routes||{},m=ho===f,u=d.vessel_status||"idle";let x=u.toUpperCase().replace("_"," "),b="av-status--idle",$="";if(u==="loading")b="av-status--loading",x="LOADING";else if(u==="in_transit"){b="av-status--transit";const C=d.transit_started_tick||o,w=(d.transit_arrives_tick||C+(v.transit_ticks||2))-C,A=Math.max(0,Math.min(o-C,w)),q=w>0?Math.round(A/w*100):0;x="IN TRANSIT ("+A+"/"+w+")",$='<div class="av-transit-bar"><div class="av-transit-bar__fill" style="width:'+q+'%"></div></div>'}const h=Number(d.revenue_per_transit||0),E=Number(d.market_share_pct||0),S=d.transits_completed||0,k=Number(d.total_revenue||0),T=gi[v.demand_level]||"#6a6660";if(p+='<div class="av-item" onclick="avToggle('+f+')"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;"><div class="av-item__route">'+g(v.origin_port||"?")+" → "+g(v.destination_port||"?")+'</div><span class="av-status '+b+'">'+x+'</span></div><div class="av-item__cargo">'+g(v.goods_name||"Unknown")+" · "+g(v.vessel_class||"?")+"</div>"+$+'<div class="av-item__stats"><div class="av-stat"><div class="av-stat__label">REV/TRIP</div><div class="av-stat__value" style="color:var(--green)">'+D(h)+'</div></div><div class="av-stat"><div class="av-stat__label">SHARE</div><div class="av-stat__value">'+E.toFixed(1)+'%</div></div><div class="av-stat"><div class="av-stat__label">TRANSITS</div><div class="av-stat__value">'+S+'</div></div><div class="av-stat"><div class="av-stat__label">TOTAL REV</div><div class="av-stat__value" style="color:var(--green)">'+D(k)+"</div></div></div>",m){p+='<div class="av-item__detail"><div class="av-detail-row"><span class="av-detail-label">ORIGIN</span><span class="av-detail-value">'+g(v.origin_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">DESTINATION</span><span class="av-detail-value">'+g(v.destination_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE SECTOR</span><span class="av-detail-value">'+g((v.trade_sector||"").replace(/_/g," ").toUpperCase())+'</span></div><div class="av-detail-row"><span class="av-detail-label">SCOPE</span><span class="av-detail-value">'+g(v.scope||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRANSIT TIME</span><span class="av-detail-value">'+(v.transit_ticks||"?")+' ticks</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE VOLUME</span><span class="av-detail-value">'+D(Number(v.trade_volume||0))+'</span></div><div class="av-detail-row"><span class="av-detail-label">TARIFF</span><span class="av-detail-value">'+Number(v.tariff_rate||0).toFixed(1)+'%</span></div><div class="av-detail-row"><span class="av-detail-label">COMPETITION</span><span class="av-detail-value">'+(v.competition_count??0)+' corps</span></div><div class="av-detail-row"><span class="av-detail-label">DEMAND</span><span class="av-detail-value" style="color:'+T+'">'+(v.demand_level||"?")+"</span></div>"+(v.trade_agreement_name?'<div class="av-detail-row"><span class="av-detail-label">AGREEMENT</span><span class="av-detail-value" style="color:var(--teal)">'+g(v.trade_agreement_name)+"</span></div>":"")+'<div class="av-detail-row"><span class="av-detail-label">CLAIMED</span><span class="av-detail-value">Tick '+(d.claimed_at_tick||"?")+"</span></div>";var l=(_e||[]).find(function(C){return C.active_claim_id===d.id});!l&&u==="loading"?p+=`<div style="padding:6px 8px;margin-top:4px;background:rgba(200,168,50,0.06);border:1px solid rgba(200,168,50,0.15);text-align:center;"><div style="font-family:var(--font-mono);font-size:9px;color:var(--orange);font-weight:700;margin-bottom:4px;">NO VESSEL ASSIGNED</div><button class="av-action-btn" style="background:var(--teal);color:#fff;border-color:var(--teal);width:100%;" onclick="event.stopPropagation();openAssignVesselModal('`+d.id+"','"+(v.vessel_class||"")+`')">ASSIGN VESSEL</button></div>`:l&&(p+='<div style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:var(--bg-card);border:1px solid var(--border-main);"><div><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">ASSIGNED VESSEL</div><div style="font-size:11px;font-weight:700;color:var(--text-bright);">'+g(l.vessel_name||"Unknown")+'</div></div><div style="display:flex;gap:10px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(l.fuel>50?"#5c5":l.fuel>20?"#ca5":"#c55")+'">'+(l.fuel||0)+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(l.condition>50?"#5c5":l.condition>30?"#ca5":"#c55")+'">'+(l.condition||0)+"%</div></div></div></div>"),p+=`<button class="av-action-btn release" onclick="event.stopPropagation();avRelease('`+d.id+`')">RELEASE ROUTE</button></div>`}p+="</div>"}r.innerHTML=p}function Cs(o,e){const t=(_e||[]).filter(function(a){return a.status==="in_port"&&!a.active_claim_id&&a.fuel>=15&&a.condition>=20});let n;t.length===0?n='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No available vessels.<br>Ships must be in port with 15%+ fuel and 20%+ condition.</div>':n=t.map(function(a,s){var r=a.fuel>50?"#5c5":a.fuel>20?"#ca5":"#c55",p=a.condition>50?"#5c5":a.condition>30?"#ca5":"#c55";return`<div style="padding:10px 14px;border-bottom:1px solid var(--border-0);cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="assignVesselToRoute('`+o+"','"+a.id+`')"><div><div style="font-size:14px;font-weight:700;color:var(--text-bright);">`+g(a.vessel_name||"Unnamed")+'</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+g(a.vessel_class||"?")+" · "+(a.capacity_dwt||0).toLocaleString()+' DWT</div></div><div style="display:flex;gap:14px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+r+'">'+a.fuel+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+p+'">'+a.condition+'%</div></div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--teal);padding:4px 12px;border:1px solid var(--teal);cursor:pointer;">ASSIGN</div></div></div>'}).join("");var i=document.createElement("div");i.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;",i.onclick=function(a){a.target===i&&i.remove()},i.innerHTML='<div style="width:560px;max-width:95vw;max-height:80vh;background:var(--bg-panel);border:1px solid var(--border-main);display:flex;flex-direction:column;"><div style="padding:12px 16px;border-bottom:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:space-between;align-items:center;"><span style="font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:var(--teal);">ASSIGN VESSEL</span><span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+t.length+' available</span></div><div style="flex:1;overflow-y:auto;">'+n+`</div><div style="padding:10px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);text-align:right;"><button onclick="this.closest('div[style*=fixed]').remove()" style="padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);background:transparent;border:1px solid var(--border-main);cursor:pointer;">CANCEL</button></div></div>`,document.body.appendChild(i)}async function Ts(o,e){try{var{error:t}=await y.from("corp_vessels").update({status:"in_port",active_claim_id:o}).eq("id",e).eq("faction_id",c.id);if(t){alert("Assignment failed: "+t.message);return}var n=document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]');n&&n.remove(),await Promise.all([Bi(),he()])}catch(i){alert("Assignment failed: "+(i.message||"Network error"))}}window.openAssignVesselModal=Cs;window.assignVesselToRoute=Ts;async function Ss(){if(!c){Ue=[],dn();return}const{data:o,error:e}=await y.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",c.id).order("delivered_at_tick",{ascending:!1}).limit(20);e?(console.warn("Failed to load deliveries:",e.message),Ue=[]):Ue=(o||[]).map(t=>{const n=t.construction_contracts||{};return{id:t.contract_id,name:n.name||"Project",type:n.issuer_type||"GOVERNMENT",issuer:n.issuer_name||"Government",delivered:"Tick "+(t.delivered_at_tick||0),result:t.result,quality_score:t.quality_score,rep_change:t.rep_change,financials:{contract_value:t.contract_value||0,bonus:t.quality_bonus||0,penalty:t.penalties||0,payment:t.payment_received||0,total_cost:t.total_cost||0},inspection:t.inspection||{},materials_used:t.materials_used||[],timeline:{expected:t.timeline_expected||0,actual:t.timeline_actual||0,on_time:t.on_time,early:t.timeline_actual<t.timeline_expected}}}),dn()}function Pi(){const o=se.reduce((r,p)=>r+(p.owned||0),0),e=se.reduce((r,p)=>r+(p.deployed||0),0),t=wa(se),n=o-e;document.getElementById("eq-count").textContent=o+" UNITS",document.getElementById("eq-summary").innerHTML=`
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
                ${D(t)}
            </div>
        </div>`;const i={};for(const r of se)i[r.equipment_key]=r;let a="";for(let r=1;r<=3;r++){const p=jt[r],l=ci(r),f=fi===r,d=l.reduce((m,u)=>m+(i[u.key]?.owned||0),0),v=l.reduce((m,u)=>m+(i[u.key]?.deployed||0),0);if(a+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${r})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${f?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${p.color}">${g(p.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${p.color};border:1px solid ${p.color}33;background:${p.color}0a">${p.tag}</span>
            </div>
            ${d>0?`<span class="eq-tier-hdr__count">${v}/${d}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,f)for(const m of l){const u=i[m.key],x=u?.owned||0,b=u?.deployed||0,$=u?.condition||0,h=m.maintenancePerUnit*x,E=x-b,S=x>0&&E===0,k=x>0&&$<65,T=mn($),C=u?.assigned_projects||[],M=C.length>0?C.map(w=>w.contract_name||"Project").join(", ").slice(0,30):x>0&&b>0?b+" project"+(b>1?"s":""):"—";a+=`<div class="eq-row${x===0?" unowned":""}">`,a+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${x===0?" dim":""}">${g(m.name)}</span>
                        ${k?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${x>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${S?"var(--orange)":"var(--green)"}">${E}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${b}/${x}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,x>0?a+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${$}%;background:${T}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${T}">${$}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${g(M)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${D(h)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:a+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',a+="</div>"}}document.getElementById("eq-list").innerHTML=a;const s=[1,2,3].map(r=>{const p=jt[r],l=ci(r).reduce((f,d)=>f+(i[d.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${l>0?p.color+"33":"var(--border-0)"};background:${l>0?p.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${p.color}">${p.tag}</div>
            <div class="eq-footer__tier-count" style="color:${l>0?"var(--text-bright)":"var(--text-dim)"}">${l}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${D(t)}</div>
        </div>
        <div class="eq-footer__tiers">${s}</div>`}function zs(o){fi=fi===o?-1:o,Pi()}async function Di(){if(!c)return;const{data:o,error:e}=await y.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",c.id);e?(console.warn("Failed to load equipment:",e.message),se=[]):se=o||[],Pi()}async function Is(){const{data:{user:o}}=await y.auth.getUser();if(!o){window.location.href="login.html";return}const{data:e}=await y.from("factions").select("*").or(`id.eq.${o.id},linked_user_id.eq.${o.id}`);we=(e||[]).filter(m=>m.nation_id);const t=sessionStorage.getItem("active_faction_id");if(c=we.find(m=>m.id===t)||we.find(m=>m.faction_type==="corporation")||we[0],!c){await y.auth.signOut(),window.location.href="login.html";return}if(c.faction_type!=="corporation"){window.location.href="dashboard.html";return}const n=new URLSearchParams(window.location.search).get("tab"),i=n==="expansion"||n==="actions";if(c.corp_sector!=="Construction"&&!i){const u={Finance:"corp-operations-finance.html",Shipping:"corp-operations-shipping.html"}[c.corp_sector];if(u){window.location.href=u;return}}const[a,s]=await Promise.all([c.nation_id?y.from("nations").select("*").eq("id",c.nation_id).single():Promise.resolve({data:null}),y.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);a.error&&console.warn("Nation load failed:",a.error.message),a.data&&(I=a.data),s.error&&console.warn("Shard load failed:",s.error.message),z=s.data;let r=0;if(c?.id){const{data:m}=await y.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",c.id).in("status",["open","bidding"]);if(m)for(const u of m)r+=(u.contract_bids||[]).length}const p=document.getElementById("corp-topbar-container");if(p){const{renderCorpTopBar:m}=await ha(async()=>{const{renderCorpTopBar:b}=await import("./corp-topbar-kB28qcfr.js");return{renderCorpTopBar:b}},__vite__mapDeps([0,1])),u=new URLSearchParams(window.location.search).get("tab")||"operations",x={};r>0&&(x.home={color:"#c8a832",title:r+" pending bid"+(r!==1?"s":"")+" on your projects"}),m(p,{faction:c,shard:z,activeTab:u,allUserFactions:we,badges:x})}if(z){if(document.getElementById("game-date").textContent=z.current_date||"—",document.getElementById("tick-number").textContent=z.current_tick||"—",z.next_tick_at){const u=(Number(z.tick_interval_hours)||8)*36e5,x=new Date(z.next_tick_at).getTime(),$=x-u+u/2;mi=new Date($>Date.now()?$:x+u/2),Ia()}const m=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");m&&(m.textContent="Next Corp Tick")}const l=document.getElementById("topbar-cash");l&&(l.textContent="CASH: "+wn(Number(c.corp_cash_reserves??0)));const f=document.getElementById("topbar-ap");f&&(f.style.display="none");const d=document.getElementById("nation-pill");d&&(d.textContent=(I?.name||c.nation||"—").toUpperCase());const v=document.getElementById("corp-faction-dropdown");if(v){let m="";for(const u of we){const x=u.id===c.id,b=u.faction_type==="corporation"?"CORP":"PARTY",$=u.faction_type==="corporation"?"var(--teal)":"var(--amber)";m+=`<div class="corp-dd-item${x?" active":""}" onclick="switchToFaction('${u.id}', '${u.faction_type}')">
                <span class="corp-dd-type" style="color:${$}">${b}</span>
                <span class="corp-dd-name">${g(u.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${g(u.abbreviation||"—")}]</span>
            </div>`}v.innerHTML=m}try{const{data:m}=await y.from("building_modifiers").select("*");yo={};for(const u of m||[])yo[u.modifier_key]=u}catch{}await Promise.all([Ne(),Ti(),zi(),Di(),$n(),Ss(),Zt()]);try{const{data:m}=await y.from("nations").select("*").order("name");wt=m||[]}catch{wt=[]}Ii(),Ao(),$a(c,I,z);try{await ga(y,{faction:c,nation:I,shard:z},"auto-services-container")}catch(m){console.error("[CorpOps] Auto-services init failed:",m)}if(document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",n==="expansion"){const m=document.querySelector('[data-tab-action="expansion"]');m&&Sn({preventDefault:()=>{},target:m})}else if(n==="actions"){const m=document.querySelector('[data-tab-action="actions"]');m&&In({preventDefault:()=>{},target:m})}}async function Ns(){await y.auth.signOut(),window.location.href="login.html"}function As(){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.toggle("open")}function Ms(o,e){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.remove("open"),sessionStorage.setItem("active_faction_id",o),e==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",o=>{const e=document.getElementById("faction-switcher"),t=document.getElementById("corp-faction-dropdown");t&&e&&!e.contains(o.target)&&t.classList.remove("open")});document.addEventListener("keydown",o=>{o.key==="Escape"&&Jt()});window.doLogout=Ns;window.toggleTheme=Na;window.toggleCorpDropdown=As;window.switchToFaction=Ms;window.setFilter=Aa;window.arSetFilter=gs;window.arSelectRoute=hs;window.arClaimRoute=ws;window.arApplyToService=$s;window.avToggle=ks;window.avRelease=Es;window.openContractDetail=xn;window.closeContractDetail=Jt;window.toggleWhRow=Za;window.toggleEqTier=zs;window.switchEmNation=rs;window.setEmType=ls;window.setEmListing=ds;window.setEmQty=cs;window.purchaseEquipment=ps;window.switchPrNation=ns;window.setPrMat=ts;window.setPrTier=os;window.setPrQty=is;window.purchaseMaterial=as;let ae={general:0,skilled:0,innovative:0},Ko=!1;const Ke=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function Tn(o){const e=Number(I?.minimum_wage??50),t=Number(I?.inflation??50),n=Number(I?.standard_of_living??50),i=e/100*48e3,a=1+(t-50)/100*.5,s=1+(n-50)/100*.5;return Math.round(i*o*a*s)}function _(o){const e=Math.abs(o),t=o<0?"-":"";return e>=1e9?t+"$"+(e/1e9).toFixed(2)+"B":e>=1e6?t+"$"+(e/1e6).toFixed(2)+"M":e>=1e3?t+"$"+(e/1e3).toFixed(1)+"k":t+"$"+e.toLocaleString()}async function Sn(o){o.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("actions-content").style.display="none";const e=document.getElementById("expansion-content");e.style.display="flex",e.style.justifyContent="center",e.style.gap="12px",e.style.alignItems="flex-start",e.style.flexWrap="wrap",document.querySelectorAll(".corp-nav-tab").forEach(t=>t.classList.remove("active")),o.target.classList.add("active"),await Zt(),Ro(),ar(),await Gi(),qo(),await Tr(),await vr(),oo(),to(),await qr(),io(),await Bo(),Po()}function zn(o){o&&o.preventDefault(),document.getElementById("operations-content").style.display="flex",document.getElementById("expansion-content").style.display="none",document.getElementById("actions-content").style.display="none",document.querySelectorAll(".corp-nav-tab").forEach(e=>e.classList.remove("active")),Rs()?.classList.add("active")}async function In(o){o.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("expansion-content").style.display="none",document.getElementById("actions-content").style.display="block",document.querySelectorAll(".corp-nav-tab").forEach(e=>e.classList.remove("active")),(o.target||document.querySelector('[data-tab-action="actions"]'))?.classList.add("active"),await Nn(),Et()}function Rs(){return Array.from(document.querySelectorAll(".corp-nav-tab[href]:not([data-tab-action])")).find(o=>{const e=o.getAttribute("href");if(!e)return!1;const t=new URL(e,window.location.href);return t.pathname===window.location.pathname&&!t.searchParams.get("tab")})||null}async function Nn(){if(!c)return;const[o,e]=await Promise.all([y.from("corp_executives").select("*").eq("faction_id",c.id).eq("status","active"),y.from("executive_pool").select("*").eq("nation_id",c.nation_id).eq("status","available").order("skill",{ascending:!1})]);o.error&&console.warn("Failed to load executives:",o.error.message),e.error&&console.warn("Failed to load executive pool:",e.error.message),Ft=o.data||[],Ut=e.data||[];const t=await Ca({supabase:y,faction:c,currentTick:z?.current_tick||0,poolCandidates:Ut});t?.error&&console.warn("Failed to seed initial executive roster:",t.error.message||t.error),t?.executives&&(Ft=t.executives)}function dt(o){return o>=1e6?"$"+(o/1e6).toFixed(1)+"M":o>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Me(o){return Ft.find(e=>e.role===o)||null}function $o(o,e){return(o||"?")[0]+(e||"?")[0]}function gt(o){return o>=70?"#5cb85c":o>=50?"#ca5":"#c84"}function Et(){const o=document.getElementById("actions-container");if(!o)return;const e=c?.faction_name||"Corporation",t=(c?.abbreviation||c?.corp_ticker||"??").toUpperCase();let n="";n+=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:0 2px;">
        <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:2px;color:#8b9a6b;text-transform:uppercase;">Actions</span>
            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${g(e)} &middot; ${g(t)}</span>
        </div>
    </div>`,n+='<div style="display:flex;gap:8px;">',n+='<div style="width:262px;display:flex;flex-direction:column;gap:5px;flex-shrink:0;">';for(let i=0;i<mo.length;i++){const a=mo[i],s=uo[a],r=Me(a),p=ut===i,l=s.color,f=!r;if(n+=`<div onclick="actSelectExec(${i})" style="
            padding:10px 12px;
            background:${p?l+"0a":"var(--bg-2,#1a1a17)"};
            border:1px solid ${p?l+"44":"var(--border-0,rgba(255,255,255,0.06))"};
            border-left:3px solid ${p?l:"var(--border-0,rgba(255,255,255,0.06))"};
            cursor:pointer;
        ">`,f&&a!=="CEO")n+=`<div style="display:flex;align-items:center;gap:10px;">
                <div style="width:45px;height:45px;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);flex-shrink:0;">?</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:4px;">
                        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${l};">${g(a)}</span>
                    </div>
                    <div style="font-size:13px;font-weight:600;color:var(--text-dim);margin-top:2px;">VACANT</div>
                    <div style="margin-top:4px;">
                        <span onclick="event.stopPropagation();openExecSearch('${a}')" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:3px 8px;color:#5a8aaa;border:1px solid rgba(90,138,170,0.25);background:rgba(90,138,170,0.06);cursor:pointer;">EXECUTIVE SEARCH</span>
                    </div>
                </div>
            </div>`;else{const d=r?`${r.first_name} ${r.last_name}`:"—",v=r?r.age:0,m=r?r.skill:0,u=r?r.salary_per_year:0,x=r?$o(r.first_name,r.last_name):"—";n+=`<div style="display:flex;align-items:center;gap:10px;">
                <div style="width:45px;height:45px;background:${l}15;border:1px solid ${l}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:14px;font-weight:700;color:${l};flex-shrink:0;">${g(x)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:4px;">
                        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${l};">${g(a)}</span>
                    </div>
                    <div style="font-size:13px;font-weight:600;color:${p?"var(--text-bright,#f0efe6)":"var(--text-muted,#666)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${g(d)}${v?` <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">(${v})</span>`:""}</div>
                    <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:3px;flex:1;">
                            <div style="flex:1;height:3px;background:var(--border-0,rgba(255,255,255,0.06));">
                                <div style="width:${m}%;height:100%;background:${gt(m)};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);width:18px;text-align:right;">${m}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${dt(u)}/yr</span>
                    </div>
                </div>
            </div>`}n+="</div>"}n+="</div>",n+=`<div style="flex:1;display:flex;flex-direction:column;gap:0;">
        <div id="actions-right-panel"></div>
    </div>`,n+="</div>",o.innerHTML=n,qs()}const An={CEO:[{id:"statement",name:"Issue Statement",desc:"Issue a press release to the public events feed. Other players and media corps see it. Cost scales with CEO skill.",cost:"~$20k",costColor:"#5cb85c",tags:["REPUTATION"],cooldown:"once/tick"},{id:"ipo",name:"IPO",desc:"Take the corporation public. Sell ~30% of shares for a massive cash injection. Permanent loss of full control.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["STRUCTURAL"],locked:!0,lockReason:"Coming soon"}],CFO:[{id:"loan",name:"Request Loan",desc:"Submit a loan application to all finance corporations. Set amount, purpose, term, and collateral. Receive competing offers.",cost:"FREE",costColor:"#5cb85c",tags:["FINANCIAL"]}],COO:[{id:"restructure",name:"Restructure Operations",desc:"Lay off 10-20% of workforce, cut ~7% of debt. Reputation hit scales with COO skill — high skill minimizes damage.",cost:"FREE",costColor:"#5cb85c",tags:["OPERATIONAL"],cooldown:"once/tick"}],CTO:[{id:"research",name:"Begin Research",desc:"Start researching a tech tree node. Opens the tech tree interface.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["INNOVATION"],locked:!0,lockReason:"Coming soon"}],CMO:[{id:"rebrand",name:"Rebrand Corporation",desc:"Change name and abbreviation. Cost and reputation hit scale with CMO skill — high skill reduces both.",cost:"~$20M",costColor:"#ca5",tags:["STRUCTURAL"],cooldown:"once/tick"}],CLO:[{id:"sue_corp",name:"Sue Corporation",desc:"File a lawsuit against another corporation for patent infringement, contract breach, or predatory practices.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["LEGAL"],locked:!0,lockReason:"Coming soon"}],Lobbyist:[{id:"donate",name:"Political Donation",desc:"Donate $1M to a political party in any nation where you have a presence. The target party receives $100k in party funds. You cannot donate to your own party.",cost:"$1M",costColor:"#ca5",tags:["POLITICAL"],cooldown:"once/tick"}]};function Xt(o){return 1.5-o/100}let Mn={};function Ls(o){const e=z?.current_tick||0;return Mn[o]===e}function Gt(o){const e=z?.current_tick||0;Mn[o]=e}function qs(){const o=document.getElementById("actions-right-panel");if(!o)return;const e=mo[ut],t=uo[e],n=Me(e),i=An[e]||[];if(!n){o.innerHTML=`<div style="padding:48px;text-align:center;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));">
            <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${t.color};margin-bottom:6px;">${g(e)}</div>
            <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-bottom:14px;">${g(t.fullTitle)}</div>
            <div style="font-size:16px;color:var(--text-muted);margin-bottom:20px;">This position is vacant. Hire an executive to unlock actions.</div>
            <div onclick="openExecSearch('${e}')" style="display:inline-block;padding:8px 24px;font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">EXECUTIVE SEARCH</div>
        </div>`;return}let a="";a+=`<div style="padding:14px 20px;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-bottom:none;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:56px;height:56px;background:${t.color}15;border:1px solid ${t.color}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:18px;font-weight:700;color:${t.color};">${g($o(n.first_name,n.last_name))}</div>
            <div>
                <div style="display:flex;align-items:baseline;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:22px;font-weight:700;color:${t.color};">${g(e)}</span>
                    <span style="font-size:19px;font-weight:700;color:var(--text-bright,#f0efe6);">${g(n.first_name)} ${g(n.last_name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-top:2px;">${g(t.fullTitle)}</div>
            </div>
        </div>
        <div style="display:flex;gap:16px;align-items:center;">
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SKILL</div>
                <div style="display:flex;align-items:center;gap:5px;margin-top:2px;">
                    <div style="width:50px;height:4px;background:var(--border-0,rgba(255,255,255,0.06));">
                        <div style="width:${n.skill}%;height:100%;background:${gt(n.skill)};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${gt(n.skill)};">${n.skill}</span>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SALARY</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${dt(n.salary_per_year)}/yr</div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">CONTRACT</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${n.contract_years}yr</div>
            </div>
            ${e!=="CEO"?`<div style="text-align:right;">
                <span onclick="event.stopPropagation();confirmFireExec('${n.id}','${g(e)}','${g(n.first_name+" "+n.last_name)}',${n.salary_per_year},${n.contract_end_tick||0})" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:5px 12px;color:#d9534f;border:1px solid rgba(217,83,79,0.25);background:rgba(217,83,79,0.06);cursor:pointer;">FIRE</span>
            </div>`:""}
        </div>
    </div>`,a+='<div style="background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:1px solid var(--border-0,rgba(255,255,255,0.06));flex:1;">';for(let s=0;s<i.length;s++){const r=i[s],p=!!r.locked;a+=`<div onmouseenter="this.dataset.hover='1';this.style.background='${p?"transparent":t.color+"06"}'" onmouseleave="this.dataset.hover='';this.style.background='transparent';var eb=this.querySelector('.act-exec-btn');if(eb)eb.style.display='none'" style="
            padding:16px 20px;
            ${s<i.length-1?"border-bottom:1px solid var(--border-0,rgba(255,255,255,0.06));":""}
            opacity:${p?"0.4":"1"};
            cursor:${p?"not-allowed":"pointer"};
        ">`,a+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;font-weight:700;color:${p?"var(--text-dim)":"var(--text-bright,#f0efe6)"};">${g(r.name)}</span>`;for(const l of r.tags)a+=`<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.3px;padding:2px 6px;line-height:14px;color:${l==="IRREVERSIBLE"?"#c55":l==="OFFENSIVE"?"#c84":l==="STRUCTURAL"?"#ca5":l==="POLITICAL"?"#8a6aaa":"var(--text-dim)"};background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));">${g(l)}</span>`;a+=`</div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${r.costColor};">${g(r.cost)}</span>
            </div>
        </div>`,a+=`<div style="font-size:14px;color:${p?"var(--text-dim)":"var(--text-muted,#666)"};line-height:1.6;">${g(r.desc)}</div>`,p&&r.lockReason&&(a+=`<div style="margin-top:6px;font-family:var(--font-mono);font-size:11px;color:#c84;display:flex;align-items:center;gap:4px;">
                <span>&#8856;</span><span>${g(r.lockReason)}</span>
            </div>`),p||(a+=`<div class="act-exec-btn" style="display:none;margin-top:10px;text-align:right;">
                <span onclick="event.stopPropagation();actExecute('${r.id}','${e}')" style="display:inline-block;padding:6px 24px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${t.color};cursor:pointer;">EXECUTE</span>
            </div>`),a+="</div>"}a+="</div>",a+=`<div style="padding:8px 20px;background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:none;">
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">
            <span style="color:${t.color};font-weight:700;">${g(e)}</span> skill (${n.skill}/100) affects action outcomes.
            ${n.skill>=70?" High skill increases success probability and reduces costs.":n.skill>=50?" Moderate skill — outcomes are average. Consider recruiting a stronger executive.":" Low skill — actions are less effective and more expensive. Replacement recommended."}
        </div>
    </div>`,o.innerHTML=a,o.querySelectorAll("[onmouseenter]").forEach(s=>{s.addEventListener("mouseenter",function(){const r=this.querySelector(".act-exec-btn");r&&(r.style.display="block")}),s.addEventListener("mouseleave",function(){const r=this.querySelector(".act-exec-btn");r&&(r.style.display="none")})})}function Os(o,e,t,n,i){const a=z?.current_tick||0,s=Math.max(0,i-a),r=Math.round(n*(s/12)),p=`FIRE ${e}: ${t}

Contract remaining: ${s} ticks
Payout (prorated): $${(r/1e6).toFixed(2)}M

This amount will be deducted from your cash reserves immediately.

Are you sure?`;confirm(p)&&Bs(o,e,r)}async function Bs(o,e,t){try{const n=Number(c?.corp_cash_reserves??0);if(n<t){alert(`Insufficient funds. You need $${(t/1e6).toFixed(2)}M but only have $${(n/1e6).toFixed(2)}M.`);return}const i=n-t,{error:a}=await y.from("factions").update({corp_cash_reserves:i}).eq("id",c.id);if(a){alert("Failed to process payout: "+a.message);return}const{error:s}=await y.from("corp_executives").update({status:"fired",updated_at:new Date().toISOString()}).eq("id",o);if(s){await y.from("factions").update({corp_cash_reserves:n}).eq("id",c.id),alert("Failed to fire executive: "+s.message);return}c.corp_cash_reserves=i,Ft=Ft.filter(r=>r.id!==o),Et()}catch(n){console.error("[CorpOps] Fire executive error:",n),alert("An error occurred.")}}function Ps(o,e){if((An[e]||[]).find(n=>n.id===o)?.cooldown==="once/tick"&&Ls(o)){alert("This action can only be used once per tick. Wait for the next tick.");return}switch(o){case"statement":return Rn();case"loan":return qn();case"restructure":return Bn();case"rebrand":return Pn();case"donate":return Dn()}}let xi=!1;function Rn(){if(xi)return;xi=!0;const o=document.createElement("div");o.id="stmt-overlay",o.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",o.onclick=function(p){p.target===o&&ji()};const e=c?.faction_name||"Corporation",t=(c?.abbreviation||c?.corp_ticker||"??").toUpperCase(),n=Number(c?.corp_cash_reserves??0),i=Me("CEO"),a=i?`${i.first_name} ${i.last_name}`:"CEO";o.innerHTML=`<div onclick="event.stopPropagation()" style="width:480px;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">
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
                    <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${n<2e4?"#c55":"#e8e4dc"};">${_(n)}</div></div>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="actCloseStatement()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
                    <div id="stmt-submit-btn" onclick="actSubmitStatement()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c8a832;cursor:pointer;">PUBLISH</div>
                </div>
            </div>
            <div id="stmt-error" style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
        </div>
    </div>`,document.body.appendChild(o);const s=document.getElementById("stmt-text"),r=document.getElementById("stmt-chars");s&&r&&(s.addEventListener("input",function(){r.textContent=this.value.length+"/500"}),s.focus())}function ji(){const o=document.getElementById("stmt-overlay");o&&o.remove(),xi=!1}let zt=!1;async function Ds(){if(!c||!z||zt)return;const o=document.getElementById("stmt-text"),e=document.getElementById("stmt-error"),t=(o?.value||"").trim();if(!t){e&&(e.textContent="Statement cannot be empty.",e.style.display="block");return}if(t.length>500){e&&(e.textContent="Statement too long (max 500 chars).",e.style.display="block");return}const n=Me("CEO"),i=n?n.skill:50,a=Math.round(2e4*Xt(i)),s=Number(c.corp_cash_reserves??0);if(s<a){e&&(e.textContent="Insufficient cash. Need "+_(a)+".",e.style.display="block");return}zt=!0;const r=document.getElementById("stmt-submit-btn");r&&(r.style.opacity="0.4",r.style.pointerEvents="none");const p=c.faction_name||"Corporation",l=n?`${n.first_name} ${n.last_name}`:"CEO",f=z.current_tick||0,{error:d}=await y.from("factions").update({corp_cash_reserves:s-a}).eq("id",c.id);if(d){zt=!1,e&&(e.textContent="Failed to deduct cost: "+d.message,e.style.display="block"),r&&(r.style.opacity="1",r.style.pointerEvents="auto");return}const{error:v}=await y.from("event_log").insert({nation_id:c.nation_id,faction_id:c.id,event_name:p+" — Press Release",description_used:l+", CEO of "+p+': "'+t.replace(/[<>"]/g,"")+'"',category:"business",trigger_key:"ceo_statement",effects_applied:{cost:a,ceo:l,skill:i},fired_at_tick:f});if(v){await y.from("factions").update({corp_cash_reserves:s}).eq("id",c.id),zt=!1,e&&(e.textContent="Failed to publish: "+v.message,e.style.display="block"),r&&(r.style.opacity="1",r.style.pointerEvents="auto");return}c.corp_cash_reserves=s-a,zt=!1,Gt("statement"),ji()}const Ln=[{id:"equipment",label:"Equipment Acquisition",desc:"Purchase vehicles, cranes, or heavy machinery",icon:"&#9881;"},{id:"working",label:"Working Capital",desc:"Bridge financing for active project costs",icon:"$"},{id:"property",label:"Property Purchase",desc:"Acquire office, warehouse, or HQ building",icon:"&#9632;"},{id:"subsidiary",label:"Subsidiary Expansion",desc:"Fund new subsidiary establishment",icon:"&#9672;"},{id:"materials",label:"Material Procurement",desc:"Bulk material purchase for upcoming projects",icon:"&#9638;"}],Jo=[{id:"none",label:"None",desc:"Unsecured — lenders may charge higher rates",risk:"HIGH",riskColor:"#c84"},{id:"equipment",label:"Equipment",desc:"Financed equipment serves as collateral",risk:"MODERATE",riskColor:"#ca5"},{id:"property",label:"Property",desc:"Corporate property lien",risk:"LOW",riskColor:"#8b9a6b"},{id:"full",label:"Full Assets",desc:"All corporate assets — maximum lender security",risk:"MINIMAL",riskColor:"#5c5"}];let ie=25e7,Vt="equipment",xt=48,pe="equipment",wo="",At=[];function qn(){ie=25e7,Vt="equipment",xt=48,pe="equipment",wo="",document.getElementById("lr-overlay").style.display="flex",Gs(),Ct()}function On(){document.getElementById("lr-overlay").style.display="none"}function js(o){ie=Math.max(1e6,Math.min(5e9,Number(o)||0)),Ct()}function Fs(o){Vt=o,Ct()}function Us(o){xt=o,Ct()}function Hs(o){pe=o,Ct()}async function Gs(){if(!c)return;const{data:o}=await y.from("factions").select("id, faction_name, abbreviation, corp_ticker, corp_company_type").eq("faction_type","corporation").eq("corp_sector","Finance").is("abandoned_at",null).neq("id",c.id);At=o||[],Ct()}function Ct(){const o=document.getElementById("lr-modal-content");if(!o)return;const e=Number(c?.corp_cash_reserves??0),t=Number(c?.corp_loans??0),n=Number(c?.corp_reputation??50),i=c?.faction_name||"Corporation",a=(c?.abbreviation||c?.corp_ticker||"??").toUpperCase(),s=t+ie,r=s>e*3?"#c55":s>e*1.5?"#c84":s>e?"#ca5":"#5c5",p=s>e*3?"DANGEROUS":s>e*1.5?"HEAVY":s>e?"MODERATE":"HEALTHY",l=pe==="none"?"10-16%":pe==="equipment"?"7-12%":pe==="property"?"5-9%":"4-7%",d=Math.round(ie*(pe==="none"?.13:pe==="equipment"?.095:pe==="property"?.07:.055)/12+ie/xt),v=Jo.find(u=>u.id===pe)||Jo[0];let m="";m+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
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
            <span style="font-size:10px;color:#e8e4dc;">${g(i)}</span>
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
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#8b9a6b;margin-top:1px;">${n}</div>
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
        <div style="display:flex;flex-direction:column;gap:3px;">`;for(const u of Ln){const x=Vt===u.id;m+=`<div onclick="lrSetPurpose('${u.id}')" style="display:flex;align-items:center;gap:8px;padding:5px 10px;cursor:pointer;background:${x?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${x?"#5a8aaa44":"#2a2a24"};border-left:2px solid ${x?"#5a8aaa":"transparent"};">
            <span style="font-family:var(--font-mono);font-size:10px;color:${x?"#5a8aaa":"#6a6660"};width:14px;text-align:center;">${u.icon}</span>
            <div><div style="font-size:11px;font-weight:600;color:${x?"#e8e4dc":"#9e9a92"};">${u.label}</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${u.desc}</div></div>
        </div>`}m+="</div></div>",m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">PREFERRED TERM</span>
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;">${xt} months</span>
        </div>
        <div style="display:flex;gap:3px;">`;for(const u of[12,24,36,48,60,84,120]){const x=xt===u;m+=`<span onclick="lrSetTerm(${u})" style="flex:1;text-align:center;padding:4px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;color:${x?"#000":"#6a6660"};background:${x?"#5a8aaa":"transparent"};border:1px solid ${x?"#5a8aaa":"#2a2a24"};">${u}</span>`}m+='</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Lenders may offer different terms. This is your preference, not a guarantee.</div></div>',m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">COLLATERAL OFFERED</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">`;for(const u of Jo){const x=pe===u.id;m+=`<div onclick="lrSetCollateral('${u.id}')" style="padding:6px 8px;cursor:pointer;background:${x?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${x?"#5a8aaa44":"#2a2a24"};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${x?"#5a8aaa":"#6a6660"};">${u.label}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:${u.riskColor};">${u.risk} RISK</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${u.desc}</div>
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
                <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${r};background:${r}12;border:1px solid ${r}25;">${p}</span>
            </div>
        </div>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">This request will be sent to</div>`,At.length>0){m+='<div style="display:flex;flex-direction:column;gap:3px;">';for(const u of At){const x=(u.corp_company_type||"").toLowerCase()==="state"?"#c84":(u.corp_company_type||"").toLowerCase()==="public"?"#5c5":"#c8a832";m+=`<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:#1c1c18;border:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c8a832;">${g((u.abbreviation||u.corp_ticker||"??").toUpperCase())}</span>
                <span style="font-size:10px;color:#e8e4dc;flex:1;">${g(u.faction_name)}</span>
                ${u.corp_company_type?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${x};background:${x}12;border:1px solid ${x}25;">${g(u.corp_company_type.toUpperCase())}</span>`:""}
            </div>`}m+="</div>"}else m+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No finance corporations in this nation yet.</div>';m+='<div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">All finance corporations in your nation will see this request. You choose which offer to accept.</div></div>',m+=`<div style="padding:8px 16px;">
        <div style="padding:6px 10px;background:rgba(90,138,170,0.04);border:1px solid rgba(90,138,170,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#5a8aaa;letter-spacing:0.8px;margin-bottom:4px;">ESTIMATED MARKET TERMS</div>
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. RATE RANGE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#e8e4dc;">${l}</div></div>
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. MONTHLY PAYMENT</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#e8e4dc;">~${_(d)}</div></div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Estimates based on collateral offer and current market rates. Actual terms set by each lender.</div>
        </div>
    </div>`,m+="</div>",m+=`<div style="padding:10px 16px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:12px;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">REQUESTING</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5a8aaa;">${_(ie)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">COLLATERAL</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;">${v.label}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">SENT TO</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#9e9a92;">${At.length} lender${At.length!==1?"s":""}</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="lrClose()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="lr-submit-btn" onclick="lrSubmit()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">SUBMIT REQUEST</div>
        </div>
    </div>`,m+='<div id="lr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>',o.innerHTML=m}let ro=!1;async function Vs(){if(!c||!z||ro)return;const o=document.getElementById("lr-error");if(ie<1e6){o.textContent="Minimum loan amount is $1M.",o.style.display="block";return}if(ie>5e9){o.textContent="Maximum loan amount is $5B.",o.style.display="block";return}const t=((Ln.find(s=>s.id===Vt)||{}).label||Vt)+(wo?" — "+wo:""),n=document.getElementById("lr-submit-btn");ro=!0,n.style.opacity="0.5",n.style.pointerEvents="none";const i=z.current_tick||0,{error:a}=await y.from("finance_loan_requests").insert({requesting_faction_id:c.id,nation_id:c.nation_id,amount:ie,term_months:xt,purpose:t,created_tick:i,expires_tick:i+5});if(n.style.opacity="1",n.style.pointerEvents="auto",a){ro=!1,o.textContent="Failed to submit: "+a.message,o.style.display="block",n.style.opacity="1",n.style.pointerEvents="auto";return}ro=!1,On()}function Bn(){if(!c)return;const o=Number(c.corp_loans??0),e=Number(c.corp_reputation??50),t=Number(c.corp_general_workforce??0),n=Number(c.corp_skilled_workforce??0),i=Number(c.corp_innovative_workforce??0),a=t+n+i;if(a===0){alert("Cannot restructure — no employees to lay off.");return}const s=Me("COO"),r=s?s.skill:50,p=Xt(r),l=10+Math.floor(Math.random()*11),f=Math.round(a*l/100),d=Math.round(o*.07),v=Math.round(d*(2-p)),m=3+Math.floor(Math.random()*10),u=Math.max(1,Math.round(m*p)),x=Math.round(t/a*f),b=Math.round(n/a*f),$=Math.max(0,Math.min(i,f-x-b)),h=document.createElement("div");h.id="restr-overlay",h.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",h.onclick=function(E){E.target===h&&Fi()},h.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">
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
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${f} employees (${l}%)</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">General: ${t} &rarr; ${t-x}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${x}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Skilled: ${n} &rarr; ${n-b}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${b}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Innovative: ${i} &rarr; ${i-$}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${$}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEBT REDUCTION (~7%)</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#5cb85c;">-${_(v)}</span>
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
            <div id="restr-btn" onclick="actSubmitRestructure(${l},${v},${u},${x},${b},${$})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#8b9a6b;cursor:pointer;">RESTRUCTURE</div>
        </div>
        <div id="restr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(h)}function Fi(){const o=document.getElementById("restr-overlay");o&&o.remove()}let lo=!1;async function Ws(o,e,t,n,i,a){if(!c||!z||lo)return;lo=!0;const s=document.getElementById("restr-btn");s&&(s.style.opacity="0.4",s.style.pointerEvents="none");const r=Number(c.corp_general_workforce??0),p=Number(c.corp_skilled_workforce??0),l=Number(c.corp_innovative_workforce??0),f=Number(c.corp_loans??0),d=Number(c.corp_reputation??50),v={corp_general_workforce:Math.max(0,r-n),corp_skilled_workforce:Math.max(0,p-i),corp_innovative_workforce:Math.max(0,l-a),corp_loans:Math.max(0,f-e),corp_reputation:Math.max(0,d-t)},{error:m}=await y.from("factions").update(v).eq("id",c.id);if(m){lo=!1;const b=document.getElementById("restr-error");b&&(b.textContent="Failed: "+m.message,b.style.display="block"),s&&(s.style.opacity="1",s.style.pointerEvents="auto");return}Object.assign(c,v);const u=z.current_tick||0,{error:x}=await y.from("event_log").insert({nation_id:c.nation_id,faction_id:c.id,event_name:(c.faction_name||"Corporation")+" — Restructuring",description_used:(c.faction_name||"A corporation")+" has announced a restructuring, laying off "+o+"% of its workforce.",category:"business",trigger_key:"corp_restructure",effects_applied:{layoff_pct:o,debt_cut:e,rep_loss:t},fired_at_tick:u});x&&console.warn("Failed to log restructure event:",x.message),lo=!1,Gt("restructure"),Fi(),Et()}function Pn(){const o=Me("CMO"),e=o?o.skill:50,t=Xt(e),n=Math.round(2e7*t),i=Math.max(1,Math.round(5*t)),a=Number(c?.corp_cash_reserves??0),s=Number(c?.corp_reputation??50),r=c?.faction_name||"",p=c?.abbreviation||c?.corp_ticker||"",l=document.createElement("div");l.id="rebrand-overlay",l.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",l.onclick=function(f){f.target===l&&Ui()},l.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">
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
            <input id="rebrand-abbr" type="text" maxlength="5" value="${g(p)}" placeholder="e.g. SZC" style="width:100px;padding:6px 10px;font-family:var(--font-mono);font-size:12px;font-weight:700;color:#c8a832;background:#1c1c18;border:1px solid #2a2a24;outline:none;text-transform:uppercase;" />
        </div>
        <div style="padding:8px 16px;border-top:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">Impact</div>
            <div style="background:#1c1c18;border:1px solid #2a2a24;padding:6px 10px;">
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">COST</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${_(n)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">REPUTATION</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${i} (${s} &rarr; ${Math.max(0,s-i)})</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">SKILL MODIFIER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${t<=1?"#5cb85c":"#c84"};">&times;${t.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CASH AFTER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${a<n?"#c55":"#e8e4dc"};">${_(a-n)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid #2a2a24;display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseRebrand()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="rebrand-btn" onclick="actSubmitRebrand(${n},${i})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c84;cursor:${a>=n?"pointer":"not-allowed"};${a<n?"opacity:0.4;pointer-events:none;":""}">REBRAND</div>
        </div>
        <div id="rebrand-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(l)}function Ui(){const o=document.getElementById("rebrand-overlay");o&&o.remove()}let co=!1;async function Ys(o,e){if(!c||!z||co)return;const t=o||2e7,n=e||5,i=document.getElementById("rebrand-error"),a=(document.getElementById("rebrand-name")?.value||"").trim().replace(/[<>"]/g,""),s=(document.getElementById("rebrand-abbr")?.value||"").trim().toUpperCase().replace(/[<>"]/g,"");if(!a||a.length<2){i&&(i.textContent="Name must be at least 2 characters.",i.style.display="block");return}if(!s||s.length<2||s.length>5){i&&(i.textContent="Abbreviation must be 2-5 characters.",i.style.display="block");return}const r=Number(c.corp_cash_reserves??0);if(r<t){i&&(i.textContent="Insufficient cash. Need "+_(t)+".",i.style.display="block");return}co=!0;const p=document.getElementById("rebrand-btn");p&&(p.style.opacity="0.4",p.style.pointerEvents="none");const l=Number(c.corp_reputation??50),f=c.faction_name||"Corporation",{error:d}=await y.from("factions").update({faction_name:a,abbreviation:s,corp_ticker:s,corp_cash_reserves:r-t,corp_reputation:Math.max(0,l-n)}).eq("id",c.id);if(d){co=!1,i&&(i.textContent="Failed: "+d.message,i.style.display="block"),p&&(p.style.opacity="1",p.style.pointerEvents="auto");return}c.faction_name=a,c.abbreviation=s,c.corp_ticker=s,c.corp_cash_reserves=r-t,c.corp_reputation=Math.max(0,l-n);const v=z.current_tick||0,{error:m}=await y.from("event_log").insert({nation_id:c.nation_id,faction_id:c.id,event_name:"Corporation Rebranded",description_used:f+" has rebranded to "+a+" ("+s+"). The rebrand costs $20M and reputation takes a temporary hit.",category:"corporate",trigger_key:"corp_rebrand",effects_applied:{old_name:f,new_name:a,new_abbr:s,rep_loss:n,cost:t},fired_at_tick:v});m&&console.warn("Failed to log rebrand event:",m.message),co=!1,Gt("rebrand"),Ui(),Et(),document.getElementById("corp-name-bar").textContent=a;const u=document.getElementById("corp-logo");u&&(u.textContent=s.slice(0,2))}const Qs={liberty:"#9C27B0",equality:"#E91E63",freedom:"#5b9bd5",security:"#d48a3c",individualism:"#eab308",collectivism:"#ec4899",tradition:"#795548",progress:"#00BCD4",nationalism:"#FF5722",globalism:"#3F51B5"};function at(o){return Qs[(o||"").toLowerCase()]||"#9C27B0"}let He=[],Se=-1;async function Dn(){Number(c?.corp_cash_reserves??0);const o=new Set([c.nation_id]);for(const a of G||[])a.is_active&&a.nation_id&&o.add(a.nation_id);const e=[...o],t=new Set(we.map(a=>a.id)),{data:n}=await y.from("factions").select("id, faction_name, abbreviation, party_color, party_funds, seats, momentum, nation, nation_id, leader_ideology, linked_user_id, ideology_value_1, ideology_value_2").eq("faction_type","party").in("nation_id",e).is("abandoned_at",null).order("seats",{ascending:!1});He=(n||[]).filter(a=>!t.has(a.id)).map(a=>({...a})),Se=-1;const i=document.createElement("div");i.id="donate-overlay",i.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",i.onclick=function(a){a.target===i&&Hi()},document.body.appendChild(i),jn()}function Hi(){const o=document.getElementById("donate-overlay");o&&o.remove(),He=[],Se=-1}function Ks(o){Se=o,jn()}function jn(){const o=document.getElementById("donate-overlay");if(!o)return;const e=Me("Lobbyist"),t=e?e.skill:50,n=Math.round(1e6*Xt(t)),i=1e5,a=Number(c?.corp_cash_reserves??0),s=Se>=0?He[Se]:null,r=a>=n;let p='<div onclick="event.stopPropagation()" style="width:540px;max-height:80vh;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">';p+=`<div style="padding:14px 20px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
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
        <div style="font-family:var(--font-mono);font-size:10px;color:#6a6660;margin-top:4px;">Parties in all nations where you have a presence. You cannot donate to your own party.</div>
    </div>`,p+='<div style="flex:1;overflow-y:auto;padding:10px 0;">',p+='<div style="padding:0 20px 8px;font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Select a Party</div>',He.length===0&&(p+='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#6a6660;">No eligible parties found.</div>');for(let l=0;l<He.length;l++){const f=He[l],d=Se===l,v=f.party_color||"#8a6aaa",m=(f.momentum||0)>0?"#e8e4dc":"#c55";p+=`<div onclick="donateSelectParty(${l})" style="
            padding:10px 20px;
            border-bottom:1px solid #2a2a24;
            border-left:3px solid ${d?v:"transparent"};
            background:${d?v+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:10px;height:10px;background:${v};flex-shrink:0;"></div>
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
        </div>`}p+="</div>",p+=`<div style="padding:12px 20px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:16px;">
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">COST</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#ca5;">${_(n)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${r?"#e8e4dc":"#c55"};">${_(a)}</div></div>
            ${s?`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">RECIPIENT</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#e8e4dc;">${g(s.abbreviation||s.faction_name)}</div></div>`:""}
        </div>
        <div style="display:flex;gap:8px;">
            <div onclick="actCloseDonation()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="donate-btn" onclick="actSubmitDonation()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${s&&r?"#000":"#6a6660"};background:${s&&r?"#8a6aaa":"#2a2a24"};cursor:${s&&r?"pointer":"not-allowed"};${!s||!r?"opacity:0.4;pointer-events:none;":""}">DONATE</div>
        </div>
    </div>`,p+='<div id="donate-error" style="padding:6px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',p+="</div>",o.innerHTML=p}let It=!1;async function Js(){if(!c||!z||Se<0||It)return;const o=He[Se];if(!o)return;const e=Number(z?.current_tick||0);if(new Set(we.map(k=>k.id)).has(o.id)){const k=document.getElementById("donate-error");k&&(k.textContent="You cannot donate to your own party.",k.style.display="block");return}const n=Me("Lobbyist"),i=n?n.skill:50,a=Math.round(1e6*Xt(i)),s=1e5,r=2,{data:p,error:l}=await y.from("event_log").select("id").eq("faction_id",c.id).eq("trigger_key","corp_donation").eq("fired_at_tick",e).limit(1);if(l){const k=document.getElementById("donate-error");k&&(k.textContent="Failed to verify cooldown: "+l.message,k.style.display="block");return}if((p||[]).length>0){const k=document.getElementById("donate-error");k&&(k.textContent="Political Donation is on cooldown until next tick.",k.style.display="block"),Gt("donate");return}const{data:f}=await y.from("factions").select("corp_cash_reserves").eq("id",c.id).single(),d=Number(f?.corp_cash_reserves??0);if(d<a){const k=document.getElementById("donate-error");k&&(k.textContent="Insufficient cash. Need "+_(a)+", have "+_(d)+".",k.style.display="block");return}It=!0;const v=document.getElementById("donate-btn");v&&(v.style.opacity="0.4",v.style.pointerEvents="none");const m=Number(c.corp_reputation??50),u=Math.max(0,m-r),{error:x}=await y.from("factions").update({corp_cash_reserves:d-a,corp_reputation:u}).eq("id",c.id);if(x){const k=document.getElementById("donate-error");It=!1,k&&(k.textContent="Failed: "+x.message,k.style.display="block"),v&&(v.style.opacity="1",v.style.pointerEvents="auto");return}const{data:b}=await y.from("factions").select("party_funds").eq("id",o.id).single(),$=Number(b?.party_funds??0),{error:h}=await y.from("factions").update({party_funds:$+s}).eq("id",o.id);if(h){await y.from("factions").update({corp_cash_reserves:d}).eq("id",c.id);const k=document.getElementById("donate-error");It=!1,k&&(k.textContent="Failed to transfer funds: "+h.message,k.style.display="block"),v&&(v.style.opacity="1",v.style.pointerEvents="auto");return}c.corp_cash_reserves=d-a,c.corp_reputation=u;const E=c.faction_name||"Corporation",{error:S}=await y.from("event_log").insert({nation_id:o.nation_id||c.nation_id,faction_id:c.id,event_name:E+" — Political Donation",description_chosen:E+" has donated "+_(a)+" to "+(o.faction_name||"a political party")+". The party receives "+_(s)+" in campaign funds. Corporate reputation decreases by "+r+".",category:"business",trigger_key:"corp_donation",effects_applied:{cost:a,recipient_faction_id:o.id,recipient_name:o.faction_name,funds_granted:s,reputation_loss:r,skill:i},fired_at_tick:e});S&&console.warn("Failed to log donation event:",S.message),It=!1,Gt("donate"),Hi()}function Xs(o){ut=o,Et()}async function Zs(o){if(ke=o,Ce=-1,document.getElementById("exec-search-overlay").style.display="flex",Ut.length===0&&c?.nation_id){const{data:e}=await y.from("executive_pool").select("id").eq("nation_id",c.nation_id).limit(1);if(!e||e.length===0){const n=c.nation||"",i=Ta(c.nation_id,n),{error:a}=await y.from("executive_pool").insert(i);a&&console.warn("Failed to generate executive pool:",a.message)}const{data:t}=await y.from("executive_pool").select("*").eq("nation_id",c.nation_id).eq("status","available").order("skill",{ascending:!1});Ut=t||[]}Hn()}function Fn(){document.getElementById("exec-search-overlay").style.display="none",ke=null,Ce=-1}function Un(o){return Ut.filter(e=>e.status==="available"&&Array.isArray(e.specializations)&&e.specializations.includes(o)).sort((e,t)=>t.skill-e.skill)}function er(o){Ce=o,Hn()}let po=!1;async function tr(){if(!c||!z||!ke||Ce<0||po)return;const e=Un(ke)[Ce];if(!e)return;po=!0;const t=z.current_tick||0,n=document.getElementById("es-hire-btn");n&&(n.style.opacity="0.4",n.style.pointerEvents="none");const{error:i}=await y.from("corp_executives").insert({faction_id:c.id,role:ke,first_name:e.first_name,last_name:e.last_name,age:e.age,origin_nation:e.origin_nation,skill:e.skill,salary_per_year:e.required_salary,contract_years:e.required_years,contract_start_tick:t,contract_end_tick:t+e.required_years*12,status:"active"});if(i){po=!1;const s=document.getElementById("es-error");s&&(s.textContent="Failed: "+i.message,s.style.display="block"),n&&(n.style.opacity="1",n.style.pointerEvents="auto");return}const{error:a}=await y.from("executive_pool").update({status:"hired",hired_by_faction_id:c.id}).eq("id",e.id);a&&console.warn("Failed to mark pool candidate as hired:",a.message),po=!1,Fn(),await Nn(),ut=mo.indexOf(ke),ut<0&&(ut=0),Et()}function Hn(){const o=document.getElementById("exec-search-content");if(!o||!ke)return;const e=ke,t=uo[e],n=Un(e),i=Ce>=0?n[Ce]:null;let a="";a+=`<div style="padding:12px 20px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
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
    </div>`,a+='<div style="display:flex;flex:1;min-height:0;overflow:hidden;">',a+='<div style="width:300px;border-right:1px solid #2a2a24;overflow-y:auto;flex-shrink:0;">',n.length===0&&(a+=`<div style="padding:30px 20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No candidates available for this role in your nation.</div>
        </div>`);for(let s=0;s<n.length;s++){const r=n[s],p=Ce===s,l=gt(r.skill);a+=`<div onclick="esSelectCandidate(${s})" style="
            padding:10px 14px;
            border-bottom:1px solid #2a2a24;
            border-left:3px solid ${p?t.color:"transparent"};
            background:${p?t.color+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:${t.color}10;border:1px solid ${t.color}22;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${t.color};flex-shrink:0;">${g($o(r.first_name,r.last_name))}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;color:${p?"var(--text-bright,#f0efe6)":"#9e9a92"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${g(r.first_name)} ${g(r.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:4px;flex:1;">
                            <div style="flex:1;height:3px;background:#2a2a24;">
                                <div style="width:${r.skill}%;height:100%;background:${l};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:${l};width:18px;text-align:right;">${r.skill}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${dt(r.required_salary)}/yr</span>
                    </div>
                </div>
            </div>
        </div>`}if(a+="</div>",a+='<div style="flex:1;overflow-y:auto;">',!i)a+=`<div style="padding:50px 24px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:14px;color:var(--text-dim);margin-bottom:10px;">Select a candidate</div>
            <div style="font-size:12px;color:#6a6660;">${n.length} candidate${n.length!==1?"s":""} available for ${g(e)}</div>
        </div>`;else{const s=i.required_salary*i.required_years,r=gt(i.skill);a+=`<div style="padding:20px;border-bottom:1px solid #2a2a24;">
            <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:64px;height:64px;background:${t.color}12;border:1px solid ${t.color}28;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:20px;font-weight:700;color:${t.color};">${g($o(i.first_name,i.last_name))}</div>
                <div>
                    <div style="font-size:20px;font-weight:700;color:var(--text-bright,#f0efe6);">${g(i.first_name)} ${g(i.last_name)}</div>
                    <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-top:3px;">${g(i.origin_nation)} &middot; Age ${i.age}</div>
                </div>
            </div>
        </div>`,a+=`<div style="display:flex;gap:0;border-bottom:1px solid #2a2a24;">
            <div style="flex:1;padding:12px 14px;text-align:center;border-right:1px solid #2a2a24;">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">SKILL</div>
                <div style="display:flex;align-items:center;justify-content:center;gap:5px;margin-top:5px;">
                    <div style="width:60px;height:4px;background:#2a2a24;">
                        <div style="width:${i.skill}%;height:100%;background:${r};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${r};">${i.skill}</span>
                </div>
            </div>
            <div style="flex:1;padding:12px 14px;text-align:center;border-right:1px solid #2a2a24;">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">AGE</div>
                <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${i.age}</div>
            </div>
            <div style="flex:1;padding:12px 14px;text-align:center;">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">ORIGIN</div>
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${g(i.origin_nation)}</div>
            </div>
        </div>`,a+=`<div style="padding:12px 20px;border-bottom:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Role Specializations</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">`;for(const f of i.specializations||[]){const d=uo[f],v=f===e;a+=`<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:3px 10px;color:${v?"#000":d?.color||"#9e9a92"};background:${v?d?.color||"#5a8aaa":(d?.color||"#5a8aaa")+"10"};border:1px solid ${v?"transparent":(d?.color||"#5a8aaa")+"30"};">${g(f)}</span>`}a+="</div></div>",a+=`<div style="padding:12px 20px;border-bottom:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Contract Terms</div>
            <div style="background:#1c1c18;border:1px solid #2a2a24;padding:10px 14px;">
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">CONTRACT LENGTH</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright,#f0efe6);">${i.required_years} years</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">ANNUAL SALARY</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#c84;">${dt(i.required_salary)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright,#f0efe6);">TOTAL CONTRACT VALUE</span>
                    <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${dt(s)}</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;margin-top:5px;">Salary is deducted from cash reserves each tick as an operating expense.</div>
        </div>`;const p=i.skill>=80?"EXCEPTIONAL":i.skill>=65?"STRONG":i.skill>=50?"COMPETENT":i.skill>=35?"DEVELOPING":"WEAK",l=i.skill>=80?"Elite talent. Actions have high success rate and reduced costs.":i.skill>=65?"Strong performer. Reliable outcomes across most actions.":i.skill>=50?"Adequate for the role. Outcomes are average.":i.skill>=35?"Below average. Actions may fail or cost more. Consider alternatives.":"Poor fit. High failure rates. Replacement recommended.";a+=`<div style="padding:12px 20px;">
            <div style="padding:8px 12px;background:${r}08;border:1px solid ${r}18;">
                <div style="font-family:var(--font-mono);font-size:10px;color:${r};letter-spacing:0.8px;margin-bottom:3px;">${p}</div>
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${l}</div>
            </div>
        </div>`}a+="</div>",a+="</div>",a+=`<div style="padding:12px 20px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:14px;">`,i?a+=`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CANDIDATE</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--text-bright,#f0efe6);">${g(i.first_name)} ${g(i.last_name)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SKILL</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${gt(i.skill)};">${i.skill}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SALARY</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:#c84;">${dt(i.required_salary)}/yr</div></div>`:a+='<div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Select a candidate to hire</div>',a+=`</div>
        <div style="display:flex;gap:8px;">
            <div onclick="closeExecSearch()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="es-hire-btn" onclick="esHireCandidate()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${i?"#000":"#6a6660"};background:${i?t.color:"#2a2a24"};cursor:${i?"pointer":"not-allowed"};${i?"":"opacity:0.4;pointer-events:none;"}">HIRE</div>
        </div>
    </div>`,a+='<div id="es-error" style="padding:5px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',o.innerHTML=a}function Mo(){return G.reduce((e,t)=>{const n=Number(t.capacity||0),i=Number(t.condition||0)/100;return e+Math.floor(n*i)},0)+500}function or(o,e){const t=Ke.find(a=>a.id===o),n=Number(c?.[t.factionKey]??0),i=ae[o]+e;if(!(n+i<0)){if(e>0){const a=Ke.reduce((r,p)=>{const l=Number(c?.[p.factionKey]??0),f=p.id===o?i:ae[p.id];return r+l+f},0),s=Mo();if(a>s)return}ae[o]=i,Ro()}}function ir(o){o?ae[o]=0:ae={general:0,skilled:0,innovative:0},Ro()}async function nr(){if(Ko||!Object.values(ae).some(s=>s!==0))return;let e=0;for(const s of Ke){const r=ae[s.id];r>0&&(e+=r*Tn(s.multiplier)*.1)}const t=Number(c?.corp_cash_reserves??0);if(e>t){alert("Insufficient cash reserves. Hiring cost: "+_(e)+", available: "+_(t));return}const n=Ke.reduce((s,r)=>s+Number(c?.[r.factionKey]??0)+ae[r.id],0),i=Mo();if(n>i){alert("Cannot hire beyond property capacity ("+i.toLocaleString()+"). You need more workplaces.");return}const a=e>0?`Confirm workforce changes?

Hiring fee: `+_(e)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(a)){Ko=!0;try{const s={};for(const l of Ke){const f=Number(c?.[l.factionKey]??0);s[l.factionKey]=Math.max(0,f+ae[l.id])}e>0&&(s.corp_cash_reserves=Math.max(0,t-Math.round(e)));const{error:r}=await y.from("factions").update(s).eq("id",c.id);if(r)throw r;Object.assign(c,s),ae={general:0,skilled:0,innovative:0};const p=document.getElementById("topbar-cash");if(p){const l=Number(c.corp_cash_reserves??0);p.textContent="CASH: "+(l>=1e6?"$"+(l/1e6).toFixed(1)+"M":"$"+Math.round(l/1e3)+"k")}Ro()}catch(s){alert("Error: "+s.message)}finally{Ko=!1}}}function Ro(){const o=document.getElementById("hf-card-container");if(!o)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=Number(I?.minimum_wage??50),i=Number(I?.inflation??50),a=Number(I?.standard_of_living??50),s=n/100*48e3,r=(1+(i-50)/100*.5).toFixed(2),p=(1+(a-50)/100*.5).toFixed(2),l=I?.name||c?.nation||"Nation",f=Object.values(ae).some(h=>h!==0),d=Mo();let v=0,m=0,u=0,x=0,b="";for(const h of Ke){const E=Number(c?.[h.factionKey]??0),S=ae[h.id],k=E+S,T=Tn(h.multiplier),C=S>0,M=E*T,w=k*T,A=w-M;v+=E,m+=k,u+=M,x+=w;const q=S!==0?C?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";b+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${t.border};background:${q};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${h.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${h.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${t.text}">${E.toLocaleString()}</span>
                    ${S!==0?`<span style="font-family:${e};font-size:10px;color:${t.dim}">→</span>
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${C?t.greenBright:t.red}">${k.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${h.multiplier}.0 × ${r} × ${p})</span>
                <span style="font-family:${e};font-size:10px;color:${h.color}">${_(T)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${h.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.red};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-50</div>
                <div onclick="hfSetChange('${h.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.redDim};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${S!==0?t.card:"transparent"};border:1px solid ${S!==0?t.border:"transparent"}">
                    ${S!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${e};font-size:12px;font-weight:700;color:${C?t.greenBright:t.red}">${C?"+":""}${S}</span>
                        <span onclick="hfReset('${h.id}')" style="font-family:${e};font-size:8px;color:${t.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${e};font-size:9px;color:${t.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${h.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+10</div>
                <div onclick="hfSetChange('${h.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+50</div>
            </div>
            ${S!==0?`<div style="margin-top:6px;padding:4px 8px;background:${t.bg};border:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${A>0?t.red:t.greenBright}">${A>0?"+":""}${_(A)}/yr</span>
            </div>`:""}
        </div>`}const $=x-u;o.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Hire / Fire</span>
            </div>
            <span style="font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${l.toUpperCase()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            <div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:${t.card};">
                <div style="font-family:${e};font-size:8px;letter-spacing:1.5px;color:${t.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;gap:0;">
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">MIN WAGE</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${n}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">${_(s)}/yr</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">INFLATION</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${i}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${r}</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">STD OF LIVING</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${a}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${p}</div>
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
                        <span style="font-family:${e};font-size:13px;font-weight:700;color:${v>=d?t.red:t.text}">${f?m.toLocaleString():v.toLocaleString()}</span>
                        <span style="font-family:${e};font-size:9px;color:${t.dim}">/ ${d.toLocaleString()}</span>
                    </div>
                    ${v>=d&&!f?`<div style="font-family:${e};font-size:7px;color:${t.red};margin-top:2px;">Need workplaces to hire new employees.</div>`:""}
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${_(u)}</span>
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
    </div>`}function ar(){const o=document.getElementById("wf-summary-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},n=(I?.name||c?.nation||"Nation").toUpperCase(),i=Number(I?.minimum_wage??50),a=Number(I?.inflation??50),s=Number(I?.standard_of_living??50),r=i/100*48e3,p=1+(a-50)/100*.5,l=1+(s-50)/100*.5,f=[{label:"General Workforce",mult:2,color:t.accent,key:"corp_general_workforce",countColor:t.text},{label:"Skilled Workforce",mult:3,color:t.gold,key:"corp_skilled_workforce",countColor:t.blue},{label:"Innovative Workforce",mult:6,color:t.orange,key:"corp_innovative_workforce",countColor:t.gold}];let d=0,v=0,m="";for(const u of f){const x=Number(c?.[u.key]??0),b=Math.round(r*u.mult*p*l),$=x*b;d+=x,v+=$,m+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${u.label}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${n}</span>
                </div>
                <span style="font-family:${e};font-size:16px;font-weight:700;color:${u.countColor}">${x.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${u.mult}.0 × ${p.toFixed(2)} × ${l.toFixed(2)})</span>
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
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">MINIMUM WAGE (${n})</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">${i}/100 → ${_(r)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">INFLATION MODIFIER</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">×${p.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">STD OF LIVING MODIFIER</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">×${l.toFixed(2)}</span>
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
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${_(v)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">PER TICK (÷12)</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${_(Math.round(v/12))}</span>
            </div>
        </div>
    </div>`}let G=[];async function Zt(){if(!c?.id)return;const{data:o}=await y.from("corp_properties").select("*").eq("faction_id",c.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});G=o||[]}function Lo(){const o=document.getElementById("property-card-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=(I?.name||c?.nation||"Nation").toUpperCase(),i=1+(Number(I?.inflation??50)-50)/100*.3;let a="",s=0,r=0;const p=I?.name||c?.nation||"Home Nation",l=5e7,f=1+(Number(I?.inflation??50)-50)/100*.3,d=.8+Number(I?.stability??50)/100*.4,v=Math.round(l*f*d),m=Math.round(v*.005);s+=v,r+=m,a+=`
    <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span style="font-size:11px;font-weight:600;color:${t.text}">National Headquarters</span>
            <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:#5c5;background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">HQ</span>
        </div>
        <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:4px;">${p} · Headquarters</div>
        <div style="display:flex;gap:0;background:${t.card};border:1px solid ${t.border}">
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">CAPACITY</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">500</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">VALUE</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${_(v)}</div>
            </div>
            <div style="flex:1;padding:3px 6px">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${_(m)}</div>
            </div>
        </div>
    </div>`;for(const u of G){const x=ko[u.style]||ko.Basic;s+=Number(u.purchase_price||0),r+=Number(u.monthly_maintenance||0),a+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:${t.text}">${u.name}</span>
                <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${t.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">OWNED</span>
            </div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:4px;">${u.city||n} · ${(u.type||"").replace(/_/g," ")} · <span style="color:${x.color}">${(u.style||"Basic").toUpperCase()}</span></div>
            <div style="display:flex;gap:0;background:${t.card};border:1px solid ${t.border}">
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">CAPACITY</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${(u.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">PAID</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${_(u.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${_(u.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="margin-top:4px;display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">CONDITION</span>
                <span style="font-family:${e};font-size:9px;color:${u.condition>=75?"#5c5":u.condition>=50?"#ca5":t.orange}">${u.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:${t.border};margin-top:2px;"><div style="width:${u.condition}%;height:100%;background:${u.condition>=75?"#5c5":u.condition>=50?"#ca5":t.orange}"></div></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <div onclick="propRefurbish('${u.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.accent};border:1px solid ${t.accent}33;cursor:pointer;">REFURBISH (${_(Math.round((u.purchase_price||0)*.1*i))})</div>
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
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.green}">${_(s)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL MAINTENANCE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${_(r)}/mo</span>
            </div>
        </div>
    </div>`}let ct=[],le=null;const ko={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function Gi(){if(!c?.nation_id)return;const{data:o,error:e}=await y.from("available_properties").select("*").eq("nation_id",c.nation_id).eq("status","available").order("price",{ascending:!0});if(e){console.warn("[Property] Failed to load marketplace:",e.message);return}const t=c?.corp_sector==="Construction";ct=(o||[]).filter(n=>t||n.type!=="warehouse").map(n=>({...n,adjusted_cost:n.price,adjusted_maintenance:n.monthly_maintenance}))}function qo(){const o=document.getElementById("new-property-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"};(I?.name||c?.nation||"Nation").toUpperCase();const n=Number(I?.standard_of_living??50),i=Number(I?.gdp_growth??50),a=Number(I?.inflation??50),s=I?.capital||"Capital",r={capital:s,port:s+" Port",industrial:s+" Industrial Zone",suburban:s+" Suburbs",coastal:s+" Coast"};let p="";if(ct.length===0)p=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let l=0;l<ct.length;l++){const f=ct[l],d=le===l,v=ko[f.style]||ko.Basic,m=r[f.city_template]||s;p+=`
            <div onclick="npSelect(${l})" style="padding:8px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${d?t.accent:"transparent"};background:${d?"rgba(139,154,107,0.03)":"transparent"};">
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
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${ct.length} AVAILABLE</span>
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
            ${p}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;gap:6px;justify-content:space-between;">
                <div onclick="npOpenConstructionModal()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${t.gold};border:1px solid ${t.gold}44;cursor:pointer">CONSTRUCTION PROJECT</div>
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${le!==null?"#000":t.dim};background:${le!==null?t.accent:"transparent"};border:1px solid ${le!==null?t.accent:t.border};cursor:${le!==null?"pointer":"default"};opacity:${le!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function sr(o){le=le===o?null:o,qo()}let Xo=!1;async function rr(){if(le===null||Xo)return;const o=ct[le];if(!o)return;const e=Number(c?.corp_cash_reserves??0);if(o.adjusted_cost>e){alert(`Insufficient cash reserves.
Property: `+_(o.adjusted_cost)+`
Cash: `+_(e));return}if(confirm('Buy "'+o.name+'" for '+_(o.adjusted_cost)+`?

Monthly maintenance: `+_(o.adjusted_maintenance)+`/mo
Condition: `+o.condition+`%

This will be deducted from your cash reserves.`)){Xo=!0;try{const{error:t}=await y.from("corp_properties").insert({faction_id:c.id,nation_id:c.nation_id,catalog_id:o.catalog_id||null,name:o.name,type:o.type,style:o.style,capacity:o.capacity,purchase_price:o.adjusted_cost,monthly_maintenance:o.adjusted_maintenance,condition:o.condition,city:o.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(t)throw t;const n=Math.max(0,e-o.adjusted_cost),{error:i}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",c.id);if(i)throw i;c.corp_cash_reserves=n,o.id&&await y.from("available_properties").update({status:"sold",purchased_by:c.id}).eq("id",o.id);const a=document.getElementById("topbar-cash");a&&(a.textContent="CASH: "+(n>=1e6?"$"+(n/1e6).toFixed(1)+"M":"$"+Math.round(n/1e3)+"k")),le=null,await Gi(),qo(),Lo(),alert("Property purchased: "+o.name+`

Deducted: `+_(o.adjusted_cost))}catch(t){alert("Purchase failed: "+t.message)}finally{Xo=!1}}}const bt={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let Vi=!1,N={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0,nationId:null,nationName:null},Zo=!1,bi=[];function Gn(){const e=1+(Number(I?.inflation??50)-50)/100*.3,t=bt[N.style]?.costMod||1,n=N.type==="Warehouse"?.75:1,i=Math.round(N.size*1e5*e*t*n),a=Math.round(i*(1+N.budgetMod/100)),s=Math.round(a*.007*(bt[N.style]?.maintMod||1));return{baseBudget:i,adjusted:a,maint:s,inflMod:e,styleMod:t}}async function lr(){Vi=!0,N={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0,nationId:null,nationName:null};try{const{data:o}=await y.from("nations").select("id, name").order("name");bi=(o||[]).filter(e=>e.id!==c?.nation_id)}catch{bi=[]}Vn()}function Wi(){Vi=!1,document.getElementById("cp-modal-overlay")?.remove()}function dr(o,e){N[o]=e,Vn()}async function cr(){if(!(Zo||!N.name.trim())){if(N.type==="Regional HQ"&&!N.nationId){alert("Select a target nation for the Regional HQ.");return}Zo=!0;try{const o=Gn(),e=N.type==="Regional HQ"?N.nationId:c.nation_id,t=N.type==="Regional HQ"?N.nationName||"Unknown":I?.name||c?.nation||"Unknown",n=bt[N.style]?.repGain||1,i=await y.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),a=i.data?.current_tick||0,s=(i.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:r}=await y.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",e).eq("issuer_type","PRIVATE"),l=`PVT-C${(r||0)+1}-${s}`,{error:f}=await y.from("construction_contracts").insert({nation_id:e,template_key:"custom_building",sector:"civil_engineering",name:N.name.trim(),project_type:N.type,project_subtype:N.style,description:`${N.type} (${N.style}) — ${N.size.toLocaleString()} employees, commissioned by ${c.faction_name}`,project_code:l,budget_ceiling:o.adjusted,timeline_ticks:N.timeline,required_materials:(()=>{const d=N.size/1e3,v=N.style,m={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[v]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},u=(x,b)=>Math.max(1,Math.ceil(d*x*b));return{concrete:u(8,m.concrete),steel:u(6,m.steel),glass_facades:u(3,m.glass),em_systems:u(4,m.em),lumber:u(1,m.lumber),heavy_parts:u(2,m.heavy),aggregate:u(3,m.agg)}})(),required_equipment:(()=>{const d=N.size,v={trucks:Math.ceil(d/2e3)+1,mixers:Math.ceil(d/3e3)+1};return d>1e3&&(v.excavators=Math.ceil(d/3e3)+1,v.cranes=Math.ceil(d/4e3)+1),d>3e3&&(v.bulldozers=Math.ceil(d/4e3)+1,v.haulers=Math.ceil(d/5e3)+1),d>8e3&&(v.pile_drivers=Math.ceil(d/6e3)+1),v})(),required_workforce:{general:Math.ceil(N.size*.08),skilled:Math.ceil(N.size*.03)},status:"open",generated_at_tick:a,bidding_ends_tick:a+3,issuer_type:"PRIVATE",issuer_name:c.faction_name,issuer_faction_id:c.id});if(f)throw f;Wi(),alert(`Construction project submitted!

Project: `+N.name.trim()+`
Code: `+l+`
Budget: `+_(o.adjusted)+`
Expected Reputation: +`+Math.ceil(o.adjusted/1e8*3)+` (+3 per $100M)

All construction corporations in `+t+" can now bid on this project.")}catch(o){alert("Failed to submit project: "+o.message)}finally{Zo=!1}}}function Vn(){if(document.getElementById("cp-modal-overlay")?.remove(),!Vi)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=Gn(),n=I?.name||c?.nation||"Nation",i=Math.ceil(t.adjusted/1e8*3),a=i>=4?e.gold:i>=3?e.greenBright:i>=2?e.accent:e.dim,s=Object.entries(bt).map(([l,f])=>{const d=N.style===l;return`<div onclick="cpSetField('style','${l}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${d?f.color+"18":"transparent"};border:1px solid ${d?f.color+"44":e.border};">
            <div style="font-family:${o};font-size:9px;font-weight:700;color:${d?f.color:e.dim}">${l}</div>
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
                <input id="cp-name-input" value="${N.name.replace(/"/g,"&quot;")}" placeholder="e.g., McKenna Tower"
                    style="width:100%;padding:8px 12px;font-family:${o};font-size:14px;color:${e.text};background:${e.card};border:1px solid ${e.border};outline:none;box-sizing:border-box;" />
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Type</div>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                    ${["Regional HQ","Office Building",...c?.corp_sector==="Construction"?["Warehouse"]:[],...c?.corp_subsector?.toLowerCase()==="banking"?["Branch Office"]:[],...c?.corp_subsector?.toLowerCase()==="investment"?["Trading Floor"]:[],...c?.corp_subsector?.toLowerCase()==="insurance"?["Claims Office"]:[]].map(l=>{const f=["Branch Office","Trading Floor","Claims Office"].includes(l),v=l==="Warehouse"?e.orange:f?"#8a6aaa":e.accent;return`<span onclick="cpSetField('type','${l}')" style="flex:1;min-width:100px;text-align:center;padding:6px 0;font-family:${o};font-size:12px;font-weight:700;cursor:pointer;color:${N.type===l?"#000":e.dim};background:${N.type===l?v:"transparent"};border:1px solid ${N.type===l?v:e.border}">${l}</span>`}).join("")}
                </div>
                ${N.type==="Regional HQ"?`<div style="margin-top:8px;">
                    <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Target Nation</div>
                    <select id="cp-nation-select" onchange="cpSetField('nationId', this.value); cpSetField('nationName', this.options[this.selectedIndex].text)"
                        style="width:100%;padding:8px 12px;font-family:${o};font-size:12px;color:${e.text};background:${e.card};border:1px solid ${e.border};outline:none;">
                        <option value="">-- Select a nation --</option>
                        ${bi.map(l=>`<option value="${l.id}" ${N.nationId===l.id?"selected":""}>${l.name}</option>`).join("")}
                    </select>
                    <div style="font-family:${o};font-size:9px;color:${e.accent};margin-top:5px;">Regional HQ: Establishes corporate presence in another nation. Construction corps in that nation will bid on building it.</div>
                </div>`:""}
                ${N.type==="Warehouse"?`<div style="font-family:${o};font-size:9px;color:${e.orange};margin-top:5px;">Warehouse: 75% construction cost, stores up to $20M in materials</div>`:""}
                ${N.type==="Branch Office"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Branch Office: Increases lending capacity. +1 reputation per 200 employees. Enables cross-nation lending.</div>`:""}
                ${N.type==="Trading Floor"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Trading Floor: Enables secondary bond market. +1 reputation per 200 employees. Portfolio management bonuses.</div>`:""}
                ${N.type==="Claims Office"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Claims Office: Faster claim processing. +1 reputation per 200 employees. Local presence reduces premiums.</div>`:""}
            </div>

            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <span style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase">Size (Employees)</span>
                    <span style="font-family:${o};font-size:18px;font-weight:700;color:${e.text}">${N.size.toLocaleString()}</span>
                </div>
                <input type="range" min="500" max="18000" step="500" value="${N.size}" oninput="cpSetField('size',+this.value)"
                    style="width:100%;accent-color:${e.accent};height:5px;" />
                <div style="display:flex;justify-content:space-between;font-family:${o};font-size:9px;color:${e.dim};margin-top:3px">
                    <span>500 min</span><span>18,000 max</span>
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Style</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;">${s}</div>
                <div style="margin-top:5px;font-family:${o};font-size:10px;color:${bt[N.style].color}">${bt[N.style].desc}</div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <span style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase">Timeline</span>
                    <span style="font-family:${o};font-size:16px;font-weight:700;color:${e.text}">${N.timeline} months</span>
                </div>
                <input type="range" min="24" max="60" step="6" value="${N.timeline}" oninput="cpSetField('timeline',+this.value)"
                    style="width:100%;accent-color:${e.gold};height:5px;" />
                <div style="display:flex;justify-content:space-between;font-family:${o};font-size:9px;color:${e.dim};margin-top:3px">
                    <span>24 months</span><span>60 months</span>
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Budget</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:10px 12px;">
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border}">
                        <span style="font-family:${o};font-size:10px;color:${e.dim}">BASE (${N.size.toLocaleString()} × $100k × ${t.inflMod.toFixed(2)} × ${t.styleMod.toFixed(1)})</span>
                        <span style="font-family:${o};font-size:12px;color:${e.muted}">${_(t.baseBudget)}</span>
                    </div>
                    <div style="padding:8px 0">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                            <span style="font-family:${o};font-size:10px;color:${e.dim}">ADJUSTMENT</span>
                            <span style="font-family:${o};font-size:13px;font-weight:700;color:${N.budgetMod>0?e.greenBright:N.budgetMod<0?e.red:e.dim}">${N.budgetMod>0?"+":""}${N.budgetMod}%</span>
                        </div>
                        <input type="range" min="-15" max="15" step="1" value="${N.budgetMod}" oninput="cpSetField('budgetMod',+this.value)"
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
                <div style="font-family:${o};font-size:9px;color:${e.dim};margin-top:3px">${N.style} style · ${i===5?"Maximum prestige":i>=4?"Impressive presence":i>=3?"Strong statement":i>=2?"Solid investment":"Functional addition"}</div>
            </div>

        </div>
        <div style="padding:12px 20px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${o};font-size:9px;color:${e.dim}">TOTAL PROJECT</div>
                <div style="font-family:${o};font-size:18px;font-weight:700;color:${e.gold}">${_(t.adjusted)}</div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="cpClose()" style="padding:7px 20px;font-family:${o};font-size:12px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:7px 20px;font-family:${o};font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${e.gold};cursor:pointer;opacity:${N.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(r);const p=document.getElementById("cp-name-input");p&&p.addEventListener("input",l=>{N.name=l.target.value}),r.addEventListener("click",l=>{l.target===r&&Wi()})}function pr(){const o=document.getElementById("cp-name-input");if(o&&(N.name=o.value),!N.name.trim()){alert("Please enter a building name.");return}cr()}window.cpClose=Wi;window.cpSetField=dr;window.cpSubmitFromModal=pr;window.npSelect=sr;window.npBuyProperty=rr;window.npOpenConstructionModal=lr;let _t=!1;async function fr(o){if(_t)return;const e=G.find(r=>r.id===o);if(!e)return;const t=1+(Number(I?.inflation??50)-50)/100*.3,n=Math.round((e.purchase_price||0)*.1*t),i=Number(c?.corp_cash_reserves??0);if(n>i){alert("Insufficient cash. Refurbishment costs "+_(n)+" (inflation-adjusted), you have "+_(i));return}if(e.condition>=95){alert("Property is already in excellent condition ("+e.condition+"%).");return}const a=5+Math.floor(Math.random()*21),s=Math.min(100,e.condition+a);if(confirm('Refurbish "'+e.name+`"?

Cost: `+_(n)+`
Expected improvement: +`+a+"% condition ("+e.condition+"% → "+s+"%)")){_t=!0;try{await y.from("corp_properties").update({condition:s}).eq("id",o);const r=Math.max(0,i-n);await y.from("factions").update({corp_cash_reserves:r}).eq("id",c.id),c.corp_cash_reserves=r;const p=document.getElementById("topbar-cash");p&&(p.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")),await Zt(),Lo(),alert("Refurbished! Condition: "+e.condition+"% → "+s+"%")}catch(r){alert("Refurbishment failed: "+r.message)}finally{_t=!1}}}async function mr(o){if(_t)return;const e=G.find(a=>a.id===o);if(!e)return;const t=1+(Number(I?.inflation??50)-50)/100*.3,n=(e.condition||50)/100,i=Math.round((e.purchase_price||0)*.6*n*t);if(confirm('Sell "'+e.name+`"?

Sale value: `+_(i)+" (60% × "+e.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){_t=!0;try{await y.from("corp_properties").update({is_active:!1}).eq("id",o);const s=Number(c?.corp_cash_reserves??0)+i;await y.from("factions").update({corp_cash_reserves:s}).eq("id",c.id),c.corp_cash_reserves=s;const p=(await y.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await y.from("available_properties").insert({nation_id:c.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,price:Math.round(i*1.1),monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,generated_at_tick:p,expires_at_tick:p+6,status:"available"});const l=document.getElementById("topbar-cash");l&&(l.textContent="CASH: "+(s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k")),await Zt(),Lo(),await Gi(),qo(),alert('Sold "'+e.name+'" for '+_(i))}catch(a){alert("Sale failed: "+a.message)}finally{_t=!1}}}window.propRefurbish=fr;window.propSell=mr;const De={SALE:.8,DISSOLVE:.6,REVENUE_BASE:.02,GDP_NEUTRAL:30,DEFAULT_REPUTATION:25};function ur(o){if(!o)return 0;const e=o.trim().replace(/[$,]/g,""),t=e.match(/^([\d.]+)\s*[Mm]$/),n=e.match(/^([\d.]+)\s*[Kk]$/);return Math.round(t?parseFloat(t[1])*1e6:n?parseFloat(n[1])*1e3:parseFloat(e))}function Ze(o){const e=document.getElementById("topbar-cash");e&&(e.textContent="CASH: "+(o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k"))}function Wn(o){return Tt.find(e=>e.id===o)?.name||"—"}function Oo(o){return G.filter(e=>e.nation_id===o)}async function eo(){pt=0,await Zt(),Lo(),to(),oo()}let re=!1,pt=0,fo={};async function vr(){if(c?.id)try{const{data:o}=await y.from("construction_contracts").select("nation_id").eq("awarded_to_faction",c.id).in("status",["in_progress","awarded"]);fo={};for(const e of o||[])e.nation_id&&(fo[e.nation_id]=(fo[e.nation_id]||0)+1)}catch{}}function Yn(o){const e=Oo(o.nation_id),t=e.reduce((u,x)=>u+Number(x.purchase_price||0),0),n=e.reduce((u,x)=>u+Number(x.capacity||0),0),i=fo[o.nation_id]||0,a=Tt.find(u=>u.id===o.nation_id),s=(o.name||"").trim().split(/\s+/),r=s.length>=2?s.map(u=>u[0]).join("").toUpperCase().slice(0,4):(o.name||"SUB").slice(0,4).toUpperCase(),p=Number(o.sub_cash||0),l=Number(a?.gdp_growth??50),f=p*De.REVENUE_BASE,d=(l-De.GDP_NEUTRAL)/100,v=De.DEFAULT_REPUTATION/100,m=p>0?Math.round(f*(1+d)*v):0;return{id:o.id,name:o.name,abbr:r,nation:a?.name||o.city||"—",nationId:o.nation_id,sector:c?.corp_sector||"General",subsector:o.subsector||c?.corp_subsector||"—",revenue:m,debt:0,cash:p,reputation:De.DEFAULT_REPUTATION,valuation:t,workforce:n,projects:i,established:o.created_at?new Date(o.created_at).getFullYear().toString():"—",trend:l>=40&&p>0?"up":l>=De.GDP_NEUTRAL&&p>0?"flat":"down",profitable:m>0,hqProp:o}}function to(){const o=document.getElementById("manage-subsidiaries-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=G.filter(f=>f.type==="regional_hq").map(Yn);pt>=i.length&&(pt=0);const a=i[pt]||null;let s="";i.length===0&&(s=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No subsidiaries established.<br>Use Create Subsidiary to expand.</div>`);let r=0,p=0;for(let f=0;f<i.length;f++){const d=i[f],v=f===pt;r+=d.revenue,p+=d.valuation;const m=d.trend==="up"?t.greenBright:d.trend==="down"?t.red:t.dim,u=d.trend==="up"?"▲":d.trend==="down"?"▼":"–";s+=`
        <div onclick="selectSubsidiary(${f})" style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${v?t.accent:"transparent"};background:${v?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:40px;font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${d.abbr}</span>
            <div style="flex:1.5;">
                <div style="font-size:11px;font-weight:600;color:${t.text};line-height:1.2">${d.name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${d.subsector}</div>
            </div>
            <span style="width:65px"><span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${d.nation.toUpperCase().slice(0,8)}</span></span>
            <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${d.profitable?t.greenBright:t.redDim};text-align:right">${_(d.revenue)}</span>
            <span style="width:40px;font-family:${e};font-size:9px;font-weight:700;color:${d.reputation>=40?t.accent:d.reputation>=25?t.yellow:t.orange};text-align:right">${d.reputation}</span>
            <span style="width:55px;font-family:${e};font-size:9px;color:${t.muted};text-align:right">${_(d.valuation)}</span>
            <span style="width:12px;font-family:${e};font-size:8px;color:${m};text-align:right">${u}</span>
        </div>`}let l="";if(a){const f=a.trend==="up"?t.greenBright:a.trend==="down"?t.red:t.dim,d=a.trend==="up"?"▲":a.trend==="down"?"▼":"–",v=a.trend==="up"?"Growing":a.trend==="down"?"Declining":"Stable",m=a.reputation>=40?t.accent:a.reputation>=25?t.yellow:t.orange,u=[{label:"Revenue",value:_(a.revenue),color:a.profitable?t.greenBright:t.redDim},{label:"Cash",value:_(a.cash),color:t.text},{label:"Debt",value:a.debt>0?_(a.debt):"$0",color:a.debt>0?t.orange:t.dim},{label:"Reputation",value:a.reputation+"/100",color:m},{label:"Market Valuation",value:_(a.valuation),color:t.gold},{label:"Workforce",value:a.workforce.toLocaleString(),color:t.text},{label:"Active Projects",value:a.projects.toString(),color:a.projects>0?t.text:t.dim}],x=a.projects===0,b=a.hqProp?.logo_url?`<img src="${g(a.hqProp.logo_url)}" alt="" style="width:32px;height:32px;object-fit:cover;border-radius:4px;">`:`<label style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:${t.card};border:1px dashed ${t.border};border-radius:4px;cursor:pointer;font-size:14px;color:${t.dim};" title="Upload subsidiary logo">+<input type="file" accept="image/*" id="sub-logo-upload" data-prop-id="${a.hqProp?.id||""}" style="display:none;"></label>`;l=`
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
                    <span style="font-family:${e};font-size:8px;color:${f}">${d} ${v}</span>
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
                    <div onclick="${x?"subDissolve('"+a.id+"')":""}" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${x?t.red:t.dim};border:1px solid ${x?t.red:t.border};opacity:${x?1:.3}">DISSOLVE</div>
                </div>
                ${a.projects>0?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${t.dim}">Cannot dissolve with active projects.</div>`:""}
            </div>`}else l=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a subsidiary to manage.</div>`;if(o.innerHTML=`
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
                <div style="flex:1;overflow:auto;">${s}</div>
                <div style="padding:6px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;display:flex;align-items:center;">
                    <span style="width:40px"></span>
                    <span style="flex:1.5;font-family:${e};font-size:8px;color:${t.dim}">COMBINED</span>
                    <span style="width:65px"></span>
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${_(r)}</span>
                    <span style="width:40px"></span>
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${_(p)}</span>
                    <span style="width:12px"></span>
                </div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${l}
            </div>
        </div>
    </div>`,document.getElementById("sub-logo-upload")?.addEventListener("change",async f=>{const d=f.target.files?.[0],v=f.target.dataset.propId;if(!(!d||!v)){if(d.size>2*1024*1024){alert("Logo must be under 2MB.");return}try{const m=d.name.split(".").pop()?.toLowerCase()||"png",u=`party-logos/${c.id}/sub_${v}_${Date.now()}.${m}`,{error:x}=await y.storage.from("public-assets").upload(u,d,{contentType:d.type,upsert:!0});if(x)throw x;const{data:b}=y.storage.from("public-assets").getPublicUrl(u),$=b?.publicUrl;if($){await y.from("corp_properties").update({logo_url:$}).eq("id",v);const h=G.find(E=>E.id===v);h&&(h.logo_url=$),to()}}catch(m){alert("Upload failed: "+(m.message||"Error"))}}}),a&&(a.subsector==="Insurance"||a.subsector==="Banking")){const f="sub-dashboard-"+a.id;setTimeout(()=>{document.getElementById(f)&&ya(y,{faction:c,nation:I,shard:z},f,a.id).catch(d=>console.error("[SubDash] Init failed:",d))},50)}}async function Qn(o,e){if(re)return;const t=G.find(m=>m.id===o);if(!t)return;const n=e==="sell",i=n?De.SALE:De.DISSOLVE,a=n?"SELL":"DISSOLVE",s=n?"sold":"dissolved",r=n?"80%":"60%",p=Wn(t.nation_id),l=Oo(t.nation_id),f=l.reduce((m,u)=>m+Math.round((u.purchase_price||0)*i*(u.condition||50)/100),0),d=Number(t.sub_cash||0),v=f+d;if(confirm(a+' subsidiary "'+t.name+`"?

`+l.length+" properties at "+r+` × condition:
  Property value: `+_(f)+`
  Subsidiary cash: `+_(d)+`
  ─────────────────
  Total return: `+_(v)+`

All operations in `+p+` cease.
This cannot be undone.`)){re=!0;try{const m=l.map(x=>x.id);if(m.length===1){const{error:x}=await y.from("corp_properties").update({is_active:!1}).eq("id",m[0]);if(x)throw x}else if(m.length>1){const{error:x}=await y.from("corp_properties").update({is_active:!1}).in("id",m);if(x)throw x}await y.from("corp_properties").update({sub_cash:0}).eq("id",o).then(()=>{}).catch(()=>{});const u=Number(c?.corp_cash_reserves??0)+v;await y.from("factions").update({corp_cash_reserves:u}).eq("id",c.id),c.corp_cash_reserves=u,Ze(u),await eo(),alert("Subsidiary "+s+". "+l.length+` properties liquidated.
Total received: `+_(v))}catch(m){alert("Failed: "+m.message)}finally{re=!1}}}function yr(o){Qn(o,"sell")}async function gr(o){if(re)return;const e=G.find(r=>r.id===o);if(!e)return;const t=Wn(e.nation_id),i=Oo(e.nation_id).reduce((r,p)=>r+Math.round((p.purchase_price||0)*.8*(p.condition||50)/100),0),a=Number(e.sub_cash||0),s=Math.round(a*.05);if(confirm('PUT UP FOR SALE: "'+e.name+`"

Nation: `+t+`
Estimated Valuation: `+_(i)+`
Subsidiary Cash: `+_(a)+`
Subsector: `+(e.subsector||"General")+`

This will list your subsidiary on the marketplace.
Other corporations can place bids (minimum $1M).
You review and accept bids.

Continue?`)){re=!0;try{const r=z?.current_tick||0,{data:p,error:l}=await y.from("subsidiary_sales").insert({subsidiary_id:o,seller_faction_id:c.id,nation_id:e.nation_id,subsidiary_name:e.name,subsector:e.subsector||null,valuation:i,monthly_revenue:s,sub_cash_at_listing:a,employee_count:e.capacity||0,status:"listed",listed_at_tick:r}).select("*").single();if(l){alert("Failed to list: "+l.message);return}alert('"'+e.name+`" is now listed for sale.

Other corporations will see it on the Expansion tab and can place bids.`),await eo()}catch(r){alert("Failed: "+r.message)}finally{re=!1}}}let Eo=[],Kn="ready",qt=null;async function Bo(){const o=await ba(y);Eo=o.listings,Kn=o.state,qt=o.error,qt&&console.error("[SubMarket] Load failed:",qt.message)}function Po(){let o=document.getElementById("sub-marketplace-card");o||(o=document.createElement("div"),o.id="sub-marketplace-card",document.getElementById("expansion-content")?.appendChild(o));const e=Eo.filter(s=>s.seller_faction_id!==c?.id),t=Eo.filter(s=>s.seller_faction_id===c?.id),n="'JetBrains Mono',monospace",i={surface:"#1a1a17",card:"#1c1c18",border:"rgba(255,255,255,0.06)",dim:"#4a4940",muted:"#666",text:"#c4c2b8",bright:"#f0efe6",orange:"#c84",green:"#5cb85c",red:"#d9534f",gold:"#c8a832"};let a=`<div style="width:760px;background:${i.surface};border:1px solid ${i.border};font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:10px 14px;border-bottom:1px solid ${i.border};display:flex;align-items:center;gap:8px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${i.orange};display:inline-block;"></span>
            <span style="font-family:${n};font-size:11px;font-weight:700;letter-spacing:1.5px;color:${i.orange};text-transform:uppercase;">Subsidiary Marketplace</span>
            <span style="font-family:${n};font-size:9px;color:${i.dim};">${e.length} available</span>
        </div>`;if(t.length>0){a+=`<div style="padding:8px 14px;border-bottom:1px solid ${i.border};background:${i.card};">
            <div style="font-family:${n};font-size:8px;letter-spacing:1px;color:${i.gold};text-transform:uppercase;margin-bottom:6px;">YOUR LISTINGS</div>`;for(const s of t){const p=(s.subsidiary_bids||[]).filter(l=>l.status==="pending");a+=`<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:11px;font-weight:700;color:${i.bright};">${g(s.subsidiary_name)}</span>
                    <span style="font-family:${n};font-size:8px;color:${i.dim};margin-left:6px;">${g(s.subsector||"")}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${n};font-size:9px;color:${p.length>0?i.green:i.dim};">${p.length} bid${p.length!==1?"s":""}</span>
                    ${p.length>0?`<span onclick="subViewBids('${s.id}')" style="font-family:${n};font-size:8px;font-weight:700;padding:3px 8px;color:${i.green};border:1px solid ${i.green}44;cursor:pointer;">VIEW BIDS</span>`:""}
                    <span onclick="subCancelSale('${s.id}')" style="font-family:${n};font-size:8px;font-weight:700;padding:3px 8px;color:${i.red};border:1px solid ${i.red}44;cursor:pointer;">CANCEL</span>
                </div>
            </div>`}a+="</div>"}if(Kn==="error")a+=`<div style="padding:24px 14px;text-align:center;font-family:${n};font-size:10px;color:${i.red};font-style:italic;">${g(qt&&qt.message||"Subsidiary marketplace is temporarily unavailable.")}</div>`;else if(e.length===0)a+=`<div style="padding:24px 14px;text-align:center;font-family:${n};font-size:10px;color:${i.dim};font-style:italic;">No subsidiaries for sale right now.</div>`;else for(const s of e){const r=(s.subsidiary_bids||[]).find(f=>f.bidder_faction_id===c?.id&&f.status==="pending"),l=(_allNations||[]).find(f=>f.id===s.nation_id)?.name||"Unknown";a+=`<div style="padding:10px 14px;border-bottom:1px solid ${i.border};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:12px;font-weight:700;color:${i.bright};">${g(s.subsidiary_name)}</span>
                        <span style="font-family:${n};font-size:7px;font-weight:700;padding:1px 5px;color:${i.orange};border:1px solid ${i.orange}44;background:${i.orange}0a;">${g(s.subsector||"General")}</span>
                    </div>
                    <span style="font-family:${n};font-size:8px;color:${i.dim};">${g(l)}</span>
                </div>
                <div style="display:flex;gap:16px;font-family:${n};font-size:8px;color:${i.muted};margin-bottom:8px;">
                    <span>Valuation: <strong style="color:${i.text};">${_(s.valuation)}</strong></span>
                    <span>Revenue: <strong style="color:${i.text};">${_(s.monthly_revenue)}/mo</strong></span>
                    <span>Cash: <strong style="color:${i.text};">${_(s.sub_cash_at_listing)}</strong></span>
                    <span>Staff: <strong style="color:${i.text};">${s.employee_count}</strong></span>
                </div>
                <div style="display:flex;justify-content:flex-end;">
                    ${r?`<span style="font-family:${n};font-size:8px;font-weight:700;color:${i.green};">✓ BID PLACED: ${_(r.bid_amount)}</span>`:`<span onclick="subPlaceBid('${s.id}','${g(s.subsidiary_name)}',${s.valuation})" style="font-family:${n};font-size:8px;font-weight:700;padding:4px 14px;color:#000;background:${i.orange};cursor:pointer;">PLACE BID</span>`}
                </div>
            </div>`}a+="</div>",o.innerHTML=a}async function xr(o,e,t){const n=prompt('Place bid for "'+e+`"

Valuation: `+_(t)+`
Minimum bid: $1M

Enter bid amount ($):`);if(!n)return;const i=Math.round(Number(n));if(isNaN(i)||i<1e6){alert("Minimum bid is $1,000,000.");return}const a=Number(c?.corp_cash_reserves??0);if(i>a){alert("Insufficient funds. You have "+_(a)+".");return}const{error:s}=await y.from("subsidiary_bids").insert({sale_id:o,bidder_faction_id:c.id,bid_amount:i,status:"pending",placed_at_tick:z?.current_tick||0});if(s){s.message.includes("duplicate")||s.message.includes("unique")?alert("You already have a bid on this subsidiary."):alert("Failed to place bid: "+s.message);return}alert("Bid of "+_(i)+' placed on "'+e+`".
The seller will review your bid.`),await Bo(),Po()}async function br(o){const e=Eo.find(v=>v.id===o);if(!e)return;const t=(e.subsidiary_bids||[]).filter(v=>v.status==="pending");if(t.length===0){alert("No pending bids.");return}const n=t.map(v=>v.bidder_faction_id),{data:i}=await y.from("factions").select("id, faction_name").in("id",n),a={};(i||[]).forEach(v=>{a[v.id]=v.faction_name});let s='Bids for "'+e.subsidiary_name+`":

`;const r=t.sort((v,m)=>m.bid_amount-v.bid_amount);for(let v=0;v<r.length;v++){const m=r[v];s+=v+1+". "+(a[m.bidder_faction_id]||"Unknown")+": "+_(m.bid_amount)+`
`}s+=`
Enter the number of the bid to accept (or cancel):`;const p=prompt(s);if(!p)return;const l=parseInt(p,10)-1;if(isNaN(l)||l<0||l>=r.length){alert("Invalid selection.");return}const f=r[l],d=a[f.bidder_faction_id]||"Unknown";confirm("Accept bid of "+_(f.bid_amount)+" from "+d+`?

This will transfer ownership of "`+e.subsidiary_name+`" to them.
You will receive `+_(f.bid_amount)+` in cash.

This cannot be undone.`)&&await _r(e,f)}let ei=!1;async function _r(o,e){if(!ei){ei=!0;try{const i=z?.current_tick||0,{data:a}=await y.from("factions").select("corp_cash_reserves").eq("id",e.bidder_faction_id).single(),s=Number(a?.corp_cash_reserves??0);if(s<e.bid_amount){alert("Buyer has insufficient funds. Bid cannot be completed."),await y.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:i}).eq("id",e.id);return}var{error:t}=await y.from("factions").update({corp_cash_reserves:s-e.bid_amount}).eq("id",e.bidder_faction_id);if(t){alert("Failed to deduct from buyer: "+t.message);return}const r=Number(c?.corp_cash_reserves??0);var{error:n}=await y.from("factions").update({corp_cash_reserves:r+e.bid_amount}).eq("id",c.id);if(n){await y.from("factions").update({corp_cash_reserves:s}).eq("id",e.bidder_faction_id),alert("Failed to credit seller: "+n.message);return}c.corp_cash_reserves=r+e.bid_amount,await y.from("corp_properties").update({faction_id:e.bidder_faction_id}).eq("id",o.subsidiary_id);const p=G.filter(l=>l.nation_id===o.nation_id&&l.faction_id===c.id);for(const l of p)await y.from("corp_properties").update({faction_id:e.bidder_faction_id}).eq("id",l.id);await y.from("subsidiary_sales").update({status:"completed",completed_at_tick:i,accepted_bid_id:e.id}).eq("id",o.id),await y.from("subsidiary_bids").update({status:"accepted",resolved_at_tick:i}).eq("id",e.id),await y.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:i}).eq("sale_id",o.id).neq("id",e.id),Ze(c.corp_cash_reserves),alert("Sale complete! Received "+_(e.bid_amount)+`.

"`+o.subsidiary_name+'" has been transferred to the buyer.'),await eo(),await Bo(),Po()}catch(i){console.error("[SubMarket] Accept bid error:",i),alert("Transfer failed: "+i.message)}finally{ei=!1}}}async function hr(o){if(!confirm("Cancel this listing? The subsidiary will no longer be for sale."))return;const{error:e}=await y.from("subsidiary_sales").update({status:"cancelled"}).eq("id",o);if(e){alert("Failed: "+e.message);return}await Bo(),Po()}function $r(o){Qn(o,"dissolve")}async function Jn(o,e){if(re)return;const t=G.find(d=>d.id===o);if(!t)return;const n=Number(c?.corp_cash_reserves??0),i=Number(t.sub_cash||0),a=e?"WITHDRAW":"INJECT CAPITAL";if(e&&i<=0){alert("This subsidiary has no cash to withdraw.");return}const s=e?i:n,r=prompt(a+(e?" from ":" into ")+t.name+`

Parent cash: `+_(n)+`
Subsidiary cash: `+_(i)+`

Enter amount (e.g., 5000000 or 5M):`);if(!r)return;const p=ur(r);if(!p||p<=0||isNaN(p)){alert("Invalid amount.");return}if(p>s){alert("Insufficient "+(e?"subsidiary":"parent")+" cash. Available: "+_(s));return}const l=e?n+p:n-p,f=e?i-p:i+p;if(confirm(a+" "+_(p)+(e?" from ":" into ")+t.name+`?

Parent: `+_(n)+" → "+_(l)+`
Subsidiary: `+_(i)+" → "+_(f))){re=!0;try{await Promise.all([y.from("factions").update({corp_cash_reserves:l}).eq("id",c.id),y.from("corp_properties").update({sub_cash:f}).eq("id",o)]),c.corp_cash_reserves=l,t.sub_cash=f,Ze(l),to(),alert((e?"Withdrew ":"Injected ")+_(p)+(e?" from ":" into ")+t.name+".")}catch(d){alert("Failed: "+d.message)}finally{re=!1}}}function wr(o){Jn(o,!1)}function kr(o){Jn(o,!0)}async function Er(o){if(re)return;const e=G.find(x=>x.id===o);if(!e)return;const t=Yn(e);t.nation;const n=Oo(e.nation_id),i=t.valuation,a=t.cash,s=t.reputation,r=t.subsector,p=Math.round(i*2.25),l=Math.round(s*.1),f=Math.round(s*.2),d=Mo(),v=Ke.reduce((x,b)=>x+Number(c?.[b.factionKey]??0),0),m=Math.max(0,d-v),u=Number(c?.corp_cash_reserves??0);if(p>u){alert(`Insufficient cash to acquire subsidiary.

Acquisition cost (2.25× valuation): `+_(p)+`
Available cash: `+_(u));return}if(t.projects>0){alert("Cannot merge — subsidiary has "+t.projects+" active project(s). Complete or abandon them first.");return}if(confirm('MERGE "'+e.name+`" INTO YOUR CORPORATION

Acquisition cost (2.25× valuation): `+_(p)+`
Subsidiary cash absorbed: `+_(a)+`
Net cost: `+_(p-a)+`

• `+n.length+` properties transferred to parent
• Subsidiary subsector "`+r+`" added to portfolio
• Workers hired to max capacity (+`+m.toLocaleString()+`)
• Reputation: +`+l+" or -"+f+" (from sub rep "+s+`)

This cannot be undone.`)){re=!0;try{const x=c.nation_id;if(n.length>0){const C=n.filter(w=>w.id!==e.id).map(w=>w.id);if(C.length===1){const{error:w}=await y.from("corp_properties").update({nation_id:x,type:"office"}).eq("id",C[0]);if(w)throw w}else if(C.length>1){const{error:w}=await y.from("corp_properties").update({nation_id:x,type:"office"}).in("id",C);if(w)throw w}const{error:M}=await y.from("corp_properties").update({nation_id:x,type:"office",sub_cash:0,subsector:null}).eq("id",e.id);if(M)throw M}const b=u-p+a,h=Number(c?.corp_general_workforce??0)+m,E=Math.random()>=.5?l:-f,S=Number(c?.standing??50),k=Math.max(0,Math.min(100,S+E)),{error:T}=await y.from("factions").update({corp_cash_reserves:b,corp_general_workforce:h,standing:k}).eq("id",c.id);if(T)throw T;c.corp_cash_reserves=b,c.corp_general_workforce=h,c.standing=k,Ze(b),await eo(),alert(`Merger complete!

"`+e.name+`" absorbed into your corporation.
Cost: `+_(p)+" | Cash absorbed: "+_(a)+`
Reputation `+(E>=0?"+":"")+E+" (now "+k+`)
Workers hired: +`+m.toLocaleString()+` general workforce
Properties: `+n.length+" transferred to parent")}catch(x){alert("Merge failed: "+x.message)}finally{re=!1}}}window.subDissolve=$r;window.subInjectCapital=wr;window.subWithdraw=kr;window.subMerge=Er;window.subSell=yr;window.subPutForSale=gr;window.subPlaceBid=xr;window.subViewBids=br;window.subCancelSale=hr;window.selectSubsidiary=function(o){pt=o,to()};let Tt=[],Ot={},ue=null,ti=!1,et="",Wt="",tt="",Ae="";const Xn={Construction:4,Finance:5,Shipping:4},Cr=["Construction","Shipping","Finance"],Zn={Construction:[{id:"civil",name:"Civil Engineering",mod:0},{id:"industrial",name:"Industrial Construction",mod:.25},{id:"mega",name:"Megaprojects",mod:.4}],Shipping:[{id:"bulk_cargo",name:"Bulk Cargo",mod:0},{id:"container_freight",name:"Container Freight",mod:.2},{id:"specialized_transport",name:"Specialized Transport",mod:.35}],Finance:[{id:"banking",name:"Banking",mod:0},{id:"insurance",name:"Insurance",mod:.15},{id:"investment",name:"Investment Management",mod:.3}],Technology:[{id:"software",name:"Software Development",mod:0},{id:"hardware",name:"Hardware Manufacturing",mod:.2},{id:"telecom",name:"Telecommunications",mod:.35}],Energy:[{id:"oil_gas",name:"Oil & Gas",mod:0},{id:"renewables",name:"Renewables",mod:.2},{id:"mining",name:"Mining",mod:.3}],Healthcare:[{id:"pharma",name:"Pharmaceuticals",mod:0},{id:"hospitals",name:"Hospital Systems",mod:.2},{id:"biotech",name:"Biotechnology",mod:.35}]};async function Tr(){const{data:o,error:e}=await y.from("nations").select("*").order("name");e&&console.warn("[Subsidiary] Failed to load nations:",e.message),Tt=(o||[]).filter(n=>n.id!==c?.nation_id);const{data:t}=await y.from("factions").select("nation_id").eq("faction_type","corporation").is("abandoned_at",null);Ot={};for(const n of t||[])n.nation_id&&(Ot[n.nation_id]=(Ot[n.nation_id]||0)+1);tt=c?.corp_sector||"",Ae=c?.corp_subsector||""}function ea(){const o=tt||c?.corp_sector||"";return Zn[o]||[{id:"general",name:o||"General",mod:0}]}function Sr(o){tt=o;const e=Zn[o];Ae=e?e[0].name:"",oo()}function ta(){const o=c?.corp_sector||"";return tt===o?1:Xn[tt]||4}function zr(){const e=ea().find(t=>t.name===Ae);return e?e.mod:0}function _i(o){const e=Number(o.standard_of_living??50);return Math.max(.5,Math.round(e/50*100)/100)}function oa(o){const t=ta(),n=1+zr(),i=_i(o);return Math.round(Math.max(1e7,5e7*t*n*i))}function Ir(o){const e=Ot[o]||0;return e<=1?{label:"HIGH",color:"#5c5"}:e<=3?{label:"MODERATE",color:"#ca5"}:{label:"LOW",color:"#c55"}}function Nr(o){if(ue=ue===o?null:o,ue){const e=Tt.find(t=>t.id===ue);et=(c?.faction_name||"Subsidiary")+" "+(e?.name||"")}else et="";oo()}function Ar(o){Ae=o,oo()}function Mr(o){et=o}function Rr(o){Wt=o.toUpperCase().slice(0,4)}async function Lr(){if(ti||!ue)return;const o=Tt.find(s=>s.id===ue);if(!o)return;const e=(et||"").trim(),t=(Wt||"").trim();if(!e){alert("Please enter a corporation name for the subsidiary.");return}if(t.length<2){alert("Please enter an abbreviation (2-4 chars).");return}if(G.find(s=>s.nation_id===o.id&&s.type==="regional_hq")){alert("You already have a subsidiary in "+o.name);return}const i=oa(o),a=Number(c?.corp_cash_reserves??0);if(i>a){alert("Insufficient cash. Entry cost: "+_(i)+", available: "+_(a));return}if(confirm("Establish subsidiary in "+o.name+`?

Name: `+e+" ("+t+`)
Subsector: `+(Ae||"General")+`
Entry cost: `+_(i)+`
Creates a Regional HQ (500 capacity)
Unlocks `+o.name+` for operations

Deducted from cash reserves.`)){ti=!0;try{const r=(await y.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0,p=85+Math.floor(Math.random()*16),l=Math.round(i*.005),{error:f}=await y.from("corp_properties").insert({faction_id:c.id,nation_id:o.id,name:e,type:"regional_hq",style:"Modern",capacity:500,purchase_price:i,monthly_maintenance:l,condition:p,city:o.capital||o.name,purchased_at_tick:r,is_active:!0,subsector:Ae||c?.corp_subsector||null});if(f)throw f;const d=Math.max(0,a-i);await y.from("factions").update({corp_cash_reserves:d}).eq("id",c.id),c.corp_cash_reserves=d,Ze(d);const v=tt||c?.corp_sector||"Unknown";try{await y.from("event_log").insert({nation_id:o.id,event_name:"New Subsidiary Established",category:"corporate",description_chosen:`${c.faction_name} has invested ${_(i)} to establish ${e}, a new ${v} corporation in ${o.name}.`,fired_at_tick:z?.current_tick||0})}catch{}try{const{data:m}=await y.from("nations").select("gdp_growth").eq("id",o.id).single();m&&await y.from("nations").update({gdp_growth:Math.min(100,Number(m.gdp_growth||50)+.2)}).eq("id",o.id)}catch{}ue=null,et="",Wt="",await eo(),alert('Subsidiary "'+e+'" established in '+o.name+`!

Cost: `+_(i)+`
Regional HQ created with `+p+"% condition.")}catch(s){alert("Failed: "+s.message)}finally{ti=!1}}}function oo(){const o=document.getElementById("create-subsidiary-container");if(!o)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=c?.corp_sector||"General",i=c?.corp_subsector||"",a=ea(),s=a.find(w=>w.name===Ae)||a[0],r=new Set(G.filter(w=>w.type==="regional_hq").map(w=>w.nation_id)),p=Tt.filter(w=>!r.has(w.id)),l=ue?p.find(w=>w.id===ue):null,f=et.trim().length>0&&Wt.trim().length>=2&&l!==null,d=tt||n,v=ta();let m=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Sector</div>
        <div style="display:flex;gap:3px;">
            ${Cr.map(w=>{const A=w===d,q=w===n,U=q?1:Xn[w]||4,J=q?t.greenBright:t.orange;return`<div onclick="subSetSector('${w}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${A?t.accent+"18":"transparent"};border:1px solid ${A?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${A?t.accentBright:t.dim}">${w}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${J}">${q?"PARENT · ×1":"×"+U+" COST"}</div>
                </div>`}).join("")}
        </div>
        ${v>1?`<div style="font-family:${e};font-size:7px;color:${t.orange};margin-top:4px;padding:3px 6px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);">Cross-sector subsidiary: base cost ×${v}</div>`:""}
    </div>`,u=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsector</div>
        <div style="display:flex;gap:3px;">
            ${a.map(w=>{const A=w.name===Ae,q=w.name===i;return`<div onclick="subSetSubsector('${w.name.replace(/'/g,"\\'")}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${A?t.accent+"18":"transparent"};border:1px solid ${A?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:8px;font-weight:700;color:${A?t.accentBright:t.dim}">${w.name}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${q?t.greenBright:w.mod>0?t.orange:t.dim}">${q?"SAME — ±0%":w.mod>0?"+"+Math.round(w.mod*100)+"%":"±0%"}</div>
                </div>`}).join("")}
        </div>
    </div>`,x="";if(p.length===0)x=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Subsidiaries in all available nations.</div>`;else for(const w of p){const A=w.id===ue,q=Ir(w.id),U=Ot[w.id]||0,J=Math.round(Number(w.standard_of_living??50)),H=_i(w);x+=`
            <div onclick="subSelectNation('${w.id}')" style="display:flex;align-items:center;padding:4px 8px;margin-bottom:2px;cursor:pointer;background:${A?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${A?t.accent+"44":t.border};border-left:${A?"2px solid "+t.accent:"2px solid transparent"};">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:11px;font-weight:600;color:${A?t.text:t.muted}">${w.name}</span>
                        <span style="font-family:${e};font-size:7px;font-weight:700;padding:0 4px;color:${q.color};background:${q.color}12;border:1px solid ${q.color}25;line-height:12px">${q.label}</span>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:2px;">
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">STD/LIVING: <span style="color:${t.muted}">${J}</span></span>
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">CORPS: <span style="color:${U>=4?t.red:U>=2?t.yellow:t.greenBright}">${U}</span></span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${H>1?t.orange:t.greenBright}">×${H.toFixed(2)}</div>
                </div>
            </div>`}let b=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="margin-bottom:6px;">
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Corporation Name</div>
            <input type="text" value="${(et||"").replace(/"/g,"&quot;")}" oninput="subSetName(this.value)" placeholder="e.g., ${(c?.faction_name||"Corp")+" "+(l?.name||"International")}" style="width:100%;padding:5px 8px;font-family:${e};font-size:10px;color:${t.text};background:${t.card};border:1px solid ${t.border};outline:none;box-sizing:border-box;" />
        </div>
        <div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Abbreviation (2-4 chars)</div>
            <input type="text" value="${(Wt||"").replace(/"/g,"&quot;")}" oninput="subSetAbbr(this.value)" placeholder="${(c?.faction_name||"CORP").slice(0,2).toUpperCase()+(l?.name||"XX").slice(0,2).toUpperCase()}" maxlength="4" style="width:80px;padding:5px 8px;font-family:${e};font-size:12px;font-weight:700;color:${t.gold};background:${t.card};border:1px solid ${t.border};outline:none;text-align:center;letter-spacing:2px;" />
        </div>
    </div>`;const $=[{rule:"Bid on projects in that nation",icon:"✓",color:t.greenBright},{rule:"Hires local workers at nation rates",icon:"✓",color:t.greenBright},{rule:"Must use parent's materials & vehicles",icon:"!",color:t.orange},{rule:"Reputation gain: 75% sub / 25% parent",icon:"◐",color:t.gold},{rule:"Market revenue at 50% parent rate",icon:"◐",color:t.gold},{rule:"Counts as domestic corporation",icon:"✓",color:t.greenBright},{rule:"Starting reputation: 25",icon:"●",color:t.muted}];let h=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsidiary Rules</div>
        <div style="background:${t.card};border:1px solid ${t.border};padding:6px 8px;">
            ${$.map((w,A)=>`<div style="display:flex;align-items:center;gap:6px;padding:2px 0;${A<$.length-1?"border-bottom:1px solid "+t.border:""}">
                <span style="font-family:${e};font-size:9px;color:${w.color};width:12px;text-align:center">${w.icon}</span>
                <span style="font-size:9px;color:${t.muted}">${w.rule}</span>
            </div>`).join("")}
        </div>
    </div>`;const E=5e7,S=s.mod,k=l?_i(l):null,T=l?oa(l):null,C=Math.round(E*v*(1+S));let M=`
    <div style="background:${t.bg};border:1px solid ${t.border};padding:6px 8px;margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">BASE</span>
            <span style="font-family:${e};font-size:9px;color:${t.muted}">${_(E)}</span>
        </div>
        ${v>1?`<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">SECTOR (${d})</span>
            <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.orange}">×${v}</span>
        </div>`:""}
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">SUBSECTOR (${s.name})</span>
            <span style="font-family:${e};font-size:9px;color:${S===0?t.greenBright:t.orange}">${S===0?"±0%":"+"+Math.round(S*100)+"%"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">NATION (${l?l.name:"select below"})</span>
            <span style="font-family:${e};font-size:9px;color:${l?k>1?t.orange:t.greenBright:t.dim}">${l?"×"+k.toFixed(2):"—"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:3px 0;">
            <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.text}">TOTAL COST</span>
            <span style="font-family:${e};font-size:14px;font-weight:700;color:${t.gold}">${l?_(T):"~"+_(C)}</span>
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
    </div>`}window.subSelectNation=Nr;window.subCreate=Lr;window.subSetName=Mr;window.subSetAbbr=Rr;window.subSetSector=Sr;window.subSetSubsector=Ar;let Bt=[],Ge=0,Co=JSON.parse(localStorage.getItem("nationhood_investigated_corps")||"{}"),ge="ALL",Pe="REPUTATION";async function qr(){const[o,e]=await Promise.all([y.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, corp_reputation, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name"),y.from("corp_properties").select("id, faction_id, name, nation_id, subsector, type, factions(faction_name, corp_sector, corp_ticker, abbreviation, corp_reputation, corp_company_type, linked_user_id)").eq("type","regional_hq").eq("is_active",!0)]),t={};for(const s of o.data||[])t[s.id]=s;const n=(o.data||[]).map(s=>{const r=(s.corp_company_type||"Private").toUpperCase(),p=Number(s.corp_cash_reserves||0);return{...s,abbr:s.corp_ticker||s.abbreviation||s.faction_name?.slice(0,4).toUpperCase()||"???",status:r,isPlayer:!!s.linked_user_id,reputation:Math.round(Number(s.corp_reputation??50)),revenue:Math.round(p*.1),valuation:Math.round(p*3),_isSub:!1}}),{data:i}=await y.from("nations").select("id, name"),a={};(i||[]).forEach(s=>{a[s.id]=s.name});for(const s of e.data||[]){const r=t[s.faction_id];if(!r)continue;const p=(r.corp_company_type||"Private").toUpperCase();n.push({id:s.id,faction_name:s.name||"Subsidiary",abbreviation:r.abbreviation,corp_sector:r.corp_sector,corp_subsector:s.subsector||r.corp_subsector,corp_ticker:r.corp_ticker,nation_id:s.nation_id,nation:a[s.nation_id]||"?",abbr:(r.corp_ticker||r.abbreviation||"??").slice(0,4),status:p,isPlayer:!!r.linked_user_id,reputation:Math.round(Number(r.corp_reputation??50)),revenue:0,valuation:0,_isSub:!0,_parentName:r.faction_name})}Bt=n}function Or(o){Ge=o,io()}function Br(o){ge=o,Ge=0,io()}function Pr(o){Pe=o,Ge=0,io()}async function Dr(o){if(!c||!z)return;const e=Number(c.corp_cash_reserves??0);if(e<5e5){alert("Insufficient cash. Need $500k.");return}const{error:t}=await y.from("factions").update({corp_cash_reserves:e-5e5}).eq("id",c.id);if(t){alert("Failed: "+t.message);return}c.corp_cash_reserves=e-5e5,Co[o]=!0,localStorage.setItem("nationhood_investigated_corps",JSON.stringify(Co));const{data:n}=await y.from("factions").select("corp_cash_reserves, corp_loans, corp_reputation, corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce").eq("id",o).single();if(n){const i=Bt.find(a=>a.id===o);if(i){Object.assign(i,n);const a=Number(n.corp_cash_reserves||0);i.reputation=Math.round(Number(n.corp_reputation??50)),i.revenue=Math.round(a*.1),i.valuation=Math.round(a*3)}}io()}function io(){const o=document.getElementById("corporations-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n={PUBLIC:{color:t.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:t.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:t.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},i=[...new Set(Bt.map(m=>m.nation).filter(Boolean))];let a=[...Bt];ge!=="ALL"&&(a=a.filter(m=>m.nation===ge)),Pe==="REPUTATION"?a.sort((m,u)=>(u.reputation||0)-(m.reputation||0)):Pe==="REVENUE"?a.sort((m,u)=>(u.revenue||0)-(m.revenue||0)):Pe==="VALUATION"&&a.sort((m,u)=>(u.valuation||0)-(m.valuation||0)),Ge>=a.length&&(Ge=0);const s=a[Ge]||null;z?.current_tick;const r=s&&!!Co[s.id],p=s&&s.status==="PRIVATE"&&!r,l=s&&s.status==="STATE";let f="";a.length===0&&(f=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No corporations found.</div>`);for(let m=0;m<a.length;m++){const u=a[m],x=m===Ge,b=n[u.status]||n.PRIVATE,$=u.status==="PRIVATE"&&!Co[u.id];f+=`
        <div onclick="corpSelect(${m})" style="display:flex;align-items:center;padding:7px 16px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${x?t.accent:"transparent"};background:${x?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:42px;font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${u.abbr}</span>
            <div style="flex:1.3;">
                <div style="font-size:11px;font-weight:600;color:${t.text};line-height:1.2">${u.faction_name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${u._isSub?'<span style="color:#8a6aaa;">SUB</span> · ':""}${u.corp_subsector||u.corp_sector||"—"}</div>
            </div>
            <span style="width:62px"><span style="font-family:${e};font-size:8px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(u.nation||"—").toUpperCase().slice(0,6)}</span></span>
            <span style="width:56px;font-family:${e};font-size:9px;font-weight:700;color:${$?t.dim:t.muted};text-align:right">${$?"—":_(u.revenue)}</span>
            <span style="width:34px;font-family:${e};font-size:10px;font-weight:700;color:${u.reputation>=70?t.greenBright:u.reputation>=40?t.accent:t.yellow};text-align:right">${u.reputation}</span>
            <span style="width:56px;font-family:${e};font-size:9px;color:${$?t.dim:t.muted};text-align:right">${$?"—":_(u.valuation)}</span>
            <span style="width:48px;text-align:center"><span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${b.color};background:${b.bg};border:1px solid ${b.border}">${u.status}</span></span>
        </div>`}let d="";if(s){const m=n[s.status]||n.PRIVATE,u=[...s._isSub?[{label:"Parent",value:s._parentName||"—",color:"#8a6aaa"}]:[],{label:"Sector",value:s.corp_sector||"—",color:t.text},{label:"Subsector",value:s.corp_subsector||"—",color:t.accent},{label:"Reputation",value:s.reputation+"/100",color:s.reputation>=70?t.greenBright:s.reputation>=40?t.accent:t.yellow},{label:"Revenue",value:p?"UNDISCLOSED":_(s.revenue),color:p?t.dim:t.greenBright},{label:"Cash Reserves",value:p?"UNDISCLOSED":_(s.corp_cash_reserves||0),color:p?t.dim:t.text},{label:"Market Valuation",value:p?"UNDISCLOSED":_(s.valuation),color:p?t.dim:t.gold}];d=`
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
        ${u.map(x=>`<div style="display:flex;justify-content:space-between;padding:5px 16px;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:10px;color:${t.dim};text-transform:uppercase">${x.label}</span>
            <span style="font-family:${e};font-size:11px;font-weight:700;color:${x.value==="UNDISCLOSED"?t.dim:x.color};${x.value==="UNDISCLOSED"?"font-style:italic;":""}">${x.value}</span>
        </div>`).join("")}
        <div style="padding:6px 14px;border-bottom:1px solid ${t.border};flex-shrink:0;">
            <div style="width:100%;height:4px;background:${t.border}"><div style="width:${s.reputation}%;height:100%;background:${s.reputation>=70?t.greenBright:s.reputation>=40?t.accent:t.yellow}"></div></div>
        </div>
        ${p?`<div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:rgba(200,168,50,0.03);">
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
                <div onclick="${p?`corpInvestigate('${s.id}')`:""}" style="flex:1;padding:5px 0;text-align:center;cursor:${p?"pointer":"default"};font-family:${e};font-size:8px;font-weight:700;color:${p?t.blue:r?t.greenBright:t.dim};border:1px solid ${p?t.blue+"44":r?t.greenBright+"44":t.border};opacity:${p?1:.3}">${r?"INVESTIGATED ✓":"INVESTIGATE — $500k"}</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;color:${t.accent};border:1px solid ${t.accent}44">PARTNER</div>
            </div>
            <div style="display:flex;gap:4px;">
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${l?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${l?t.dim:t.gold};border:1px solid ${l?t.border:t.gold+"44"};opacity:${l?.3:1}">ACQUIRE</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${l?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${l?t.dim:t.orange};border:1px solid ${l?t.border:t.orange+"44"};opacity:${l?.3:1}">MERGER</div>
            </div>
            ${l?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${t.dim}">State-owned corps cannot be acquired or merged.</div>`:""}
        </div>`}else d=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a corporation to view details.</div>`;const v=`
    <div style="padding:6px 16px;border-bottom:1px solid ${t.border};background:${t.card};display:flex;gap:12px;align-items:center;flex-shrink:0;">
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px;width:40px">NATION</span>
            <span onclick="corpFilterNation('ALL')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${ge==="ALL"?"#000":t.dim};background:${ge==="ALL"?t.accent:"transparent"};border:1px solid ${ge==="ALL"?t.accent:t.border}">ALL</span>
            ${i.map(m=>`<span onclick="corpFilterNation('${m}')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${ge===m?"#000":t.dim};background:${ge===m?t.accent:"transparent"};border:1px solid ${ge===m?t.accent:t.border}">${m}</span>`).join("")}
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
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${Bt.length} IN DATABASE</span>
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
                ${d}
            </div>
        </div>
    </div>`}window.corpSelect=Or;window.corpInvestigate=Dr;window.corpFilterNation=Br;window.corpSort=Pr;let de=null,ze={},Q=120,Ie=15,hi={},ft=[],Ve=[],ht={};async function jr(){if(!Qe)return;if($t[Qe.id]){alert("You already have a bid on this contract. Retract it first if you want to re-bid.");return}de=Qe,hi={};try{const{data:t}=await y.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",c.id);for(const n of t||[])hi[vo(n.material_key)]=Number(n.quantity||0)}catch{}ft=[];try{const{data:t}=await y.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",de.id).in("status",["pending","won"]);ft=(t||[]).filter(n=>n.faction_id!==c?.id).map(n=>({name:n.factions?.faction_name||"Unknown",ticker:n.factions?.corp_ticker||"???",price:Number(n.bid_price||0),quality:Number(n.estimated_quality||0),status:n.status}))}catch{}Ve=[],ht={};try{const{data:t,error:n}=await y.rpc("get_project_permit_requirements",{p_contract_id:de.id,p_faction_id:c.id,p_nation_id:de.nation_id});if(n)throw n;Ve=Array.isArray(t)?t:[];const i=Ve.map(a=>a.permit_key).filter(Boolean);if(i.length>0){const{data:a,error:s}=await y.from("construction_permits").select("permit_key, cost, processing_ticks").in("permit_key",i);if(s)throw s;for(const r of a||[])ht[r.permit_key]={cost:Number(r.cost||0),ticks:Number(r.processing_ticks||0)}}}catch(t){console.warn("Failed to load project permit requirements",t),Ve=[],ht={}}ze={};const o=de.required_materials||{};for(const t of Object.keys(o))ze[t]="STD";const e=de.required_workforce||{};Q=Number(e.general||0)+Number(e.skilled||0)||120,Ie=15,Jt(),Do()}function Yi(){document.getElementById("bid-assembly-overlay")?.remove(),de=null,Ve=[],ht={}}function Fr(o,e){ze[o]=e,Do()}function Ur(o){Q=o,Do()}function Hr(o){Ie=o,Do()}function Do(){if(document.getElementById("bid-assembly-overlay")?.remove(),!de)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=de,n=t.issuer_type==="GOVERNMENT",i=I?.name||c?.nation||"—",a=Number(t.budget_ceiling||0),s=Number(t.timeline_ticks||8),r=t.required_materials||{},p=Object.keys(r),l={LOW:.5,STD:1,HIGH:2},f={LOW:e.orange,STD:e.yellow,HIGH:e.greenBright},d={LOW:"Low",STD:"Standard",HIGH:"High"},v={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},m=hi||{};let u=0,x="";for(const O of p){const V=Number(r[O]||0),Ji=ze[O]||"STD",Xi=v[O]||3e5,ca=l[Ji],pa=Math.round(Xi*ca),Zi=V*pa;u+=Zi;const fa=O.replace(/_/g," ").replace(/\b\w/g,Le=>Le.toUpperCase()),en=Number(m[O]||0),Fo=Math.max(0,V-en),ma=Fo===0?e.greenBright:Fo<V?e.yellow:e.red,ua=Fo===0?"✓ IN STOCK":`${en}/${V}`;x+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${e.text}">${fa}</span>
                <div style="font-family:${o};font-size:7px;color:${ma};margin-top:1px">${ua}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${o};font-size:9px;color:${e.muted}">${V.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(Le=>{const Uo=Ji===Le,tn=f[Le],va=_(Math.round(Xi*l[Le]));return`<span onclick="bidSetGrade('${O}','${Le}')" style="padding:2px 6px;font-family:${o};font-size:7px;font-weight:700;cursor:pointer;color:${Uo?"#000":e.dim};background:${Uo?tn:"transparent"};border:1px solid ${Uo?tn:e.border}" title="${va}/unit">${d[Le]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${o};font-size:10px;color:${e.text}">${_(Zi)}</span></div>
        </div>`}const b=t.required_workforce||{},$=Number(b.general||0)+Number(b.skilled||0)||100,h=Math.max(40,Math.round($*.5)),E=$*2,S=[h,Math.round($*.75),$,Math.round($*1.5),E],k=Math.max(0,Math.min(1,(Q-h)/(E-h||1))),T=s,C=Math.round(4.5-k*8),M=Math.max(Math.round(T*.6),T+C),w=C>0?`+${C}mo`:C<0?`${C}mo`:"On schedule",A=C>0?e.red:C<0?e.greenBright:e.yellow,q=15200,U=Q*q*M,J=(Ve||[]).map(O=>{const V=ht[O.permit_key]||{};return{permit_key:O.permit_key,name:O.permit_name||O.permit_key,requiredByPolicy:O.required_by_policy||"—",hasPermit:!!O.has_permit,statusLabel:O.status_label||(O.has_permit?"HAS_PERMIT":"NEEDS_TO_GET"),cost:Number(V.cost||0),ticks:Number(V.ticks||0)}}),H=J.filter(O=>!O.hasPermit).reduce((O,V)=>O+V.cost,0),ye=4e5,B=u+U+H+ye,P=Math.round(B*(Ie/100)),R=B+P,j=R>a,X=P,F=j?0:Math.max(0,Math.min(100,Math.round(100-R/a*100+30))),Re=F>70?e.greenBright:F>40?e.yellow:F>0?e.orange:e.red,no=j?"OVER CEILING":F>70?"STRONG":F>40?"COMPETITIVE":F>20?"WEAK":"UNLIKELY",St=Object.values(ze),Z=St.length>0?Math.round(St.reduce((O,V)=>O+(V==="HIGH"?85:V==="STD"?65:45),0)/St.length):50,ao=Z>=75?e.greenBright:Z>=55?e.yellow:e.orange,da=Z>=75?"STRONG":Z>=55?"PROMISING":"UNCERTAIN",nt=document.createElement("div");nt.id="bid-assembly-overlay",nt.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",nt.addEventListener("click",O=>{O.target===nt&&Yi()}),nt.innerHTML=`
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
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(u)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Labor</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim};width:60px">WORKERS</span>
                        <div style="display:flex;gap:3px;">
                            ${S.map(O=>`<span onclick="bidSetWorkers(${O})" style="padding:2px 8px;font-family:${o};font-size:8px;font-weight:700;cursor:pointer;color:${Q===O?"#000":e.dim};background:${Q===O?e.accent:"transparent"};border:1px solid ${Q===O?e.accent:e.border}">${O}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">${Q} × $${q.toLocaleString()}/tick × ${M} ticks</span>
                        <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(U)}</span>
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
                        <span style="font-family:${o};font-size:10px;font-weight:700;color:${A}">${M}mo <span style="font-size:8px;opacity:0.7">(${w})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${J.length===0?`<div style="padding:8px 14px;border-bottom:1px solid ${e.border};font-family:${o};font-size:8px;color:${e.dim};">No active permit laws apply to this project.</div>`:""}
                ${J.map(O=>{const V=O.hasPermit;return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
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
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(H)}</span>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${o};font-size:9px;color:${e.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(ye)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v:u},{l:"Labor",v:U},{l:"Permits",v:H},{l:"Overhead",v:ye}].map(O=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
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

                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${j?"rgba(204,85,85,0.04)":"rgba(200,168,50,0.03)"};">
                    <div style="font-family:${o};font-size:8px;color:${e.dim};margin-bottom:4px">YOUR BID PRICE</div>
                    <div style="font-family:${o};font-size:22px;font-weight:700;color:${j?e.red:e.gold}">${_(R)}</div>
                    ${j?`<div style="font-family:${o};font-size:8px;font-weight:700;color:${e.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${_(a)})</div>`:""}
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
                        <span style="font-family:${o};font-size:11px;font-weight:700;color:${Re}">${no}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${F}%;height:100%;background:${Re}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${o};font-size:11px;font-weight:700;color:${ao}">${Z}</span>
                            <span style="font-family:${o};font-size:8px;color:${e.dim}">/100</span>
                            <span style="font-family:${o};font-size:8px;font-weight:700;color:${ao}">${da}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${Z}%;height:100%;background:${ao}"></div></div>
                    <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="font-family:${o};font-size:8px;color:${e.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${ft.length===0?`<div style="font-family:${o};font-size:8px;color:${e.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${ft.map(O=>`<span style="padding:2px 6px;font-family:${o};font-size:7px;color:${e.muted};background:${e.card};border:1px solid ${e.border};">${O.name} <span style="color:${e.dim}">Q:${O.quality}</span></span>`).join("")}
                        </div>
                        <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:3px">${ft.length} competing bid${ft.length!==1?"s":""}. Bid prices are sealed until resolution.</div>`}
                    <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:3px">Higher reputation bidders may win at higher prices.</div>
                </div>
                <div style="flex:1"></div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">YOUR BID</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${j?e.red:e.gold}">${_(R)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">EST. PROFIT</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${e.greenBright}">+${_(X)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${ao}">${Z}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${o};font-size:10px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="${j?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${o};font-size:10px;font-weight:700;letter-spacing:1px;color:${j?e.dim:"#000"};background:${j?e.border:e.gold};cursor:${j?"not-allowed":"pointer"};opacity:${j?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(nt)}let oi=!1;async function Gr(){if(oi||!de)return;const o=de,e=o.required_materials||{},t=Object.keys(e),n=Number(o.budget_ceiling||0),i=Number(o.timeline_ticks||8),a={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},s={LOW:.5,STD:1,HIGH:2};let r=0;for(const M of t){const w=Number(e[M]||0),A=ze[M]||"STD",q=a[M]||3e5;r+=w*Math.round(q*s[A])}const p=15200,l=o.required_workforce||{},f=Number(l.general||0)+Number(l.skilled||0)||100,d=Math.max(40,Math.round(f*.5)),v=f*2,m=Math.max(0,Math.min(1,(Q-d)/(v-d||1))),u=Math.round(4.5-m*8),x=Math.max(Math.round(i*.6),i+u),b=Q*p*x,$=(Ve||[]).filter(M=>!M.has_permit).reduce((M,w)=>M+Number(ht[w.permit_key]?.cost||0),0),E=r+b+$+4e5,S=Math.round(E*(Ie/100)),k=E+S;if(k>n){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const T=Object.values(ze),C=T.length>0?Math.round(T.reduce((M,w)=>M+(w==="HIGH"?85:w==="STD"?65:45),0)/T.length):50;if(confirm('Submit bid for "'+o.name+`"?

Bid Price: `+_(k)+`
Est. Cost: `+_(E)+`
Markup: `+Ie+"% ("+_(S)+`)
Quality: `+C+`/100
Workers: `+Q+`

Once submitted, your bid cannot be changed.`)){oi=!0;try{const{data:M}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),w=M?.current_tick||0,A={};for(const U of t)A[U]=ze[U]||"STD";const{error:q}=await y.from("contract_bids").insert({contract_id:o.id,faction_id:c.id,bid_price:k,material_grades:A,labor_count:Q,markup_pct:Ie,estimated_cost:E,estimated_quality:C,status:"pending",submitted_at_tick:w});if(q)throw q;o.status==="open"&&await y.from("construction_contracts").update({status:"bidding"}).eq("id",o.id).eq("status","open"),Yi(),alert(`Bid submitted successfully!

Contract: `+o.name+`
Your Bid: `+_(k)+`
Quality: `+C+`/100

Bids will be resolved when the bidding window closes (`+(o.bidding_ends_tick?"tick "+o.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof Ne=="function"&&await Ne()}catch(M){alert("Bid submission failed: "+M.message)}finally{oi=!1}}}window.openBidAssembly=jr;window.closeBidAssembly=Yi;window.bidSetGrade=Fr;window.bidSetWorkers=Ur;window.bidSetMarkup=Hr;window.submitBidAssembly=Gr;let ii=!1;async function Vr(o){if(ii)return;const e=1e6,t=Number(c?.corp_cash_reserves??0);if(t<e){alert("Cannot retract — you need at least $1M in cash reserves to cover the retraction penalty.");return}if(confirm(`Retract your bid?

This will cost $1M as a retraction penalty.
This action cannot be undone.`)){ii=!0;try{const n=t-e,{error:i}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",c.id);if(i)throw i;const{error:a}=await y.from("contract_bids").delete().eq("contract_id",o).eq("faction_id",c.id);if(a)throw a;c.corp_cash_reserves=n,typeof Ze=="function"&&Ze(n),alert("Bid retracted. $1M penalty applied."),Jt(),await Ne()}catch(n){alert("Failed to retract bid: "+(n.message||"Unknown error"))}finally{ii=!1}}}window.retractBid=Vr;let Yt=[],We=0,ve=null,ni=!1,ai=!1,si=!1;async function Wr(){if(!Qe||ai)return;ai=!0,ve=Qe,We=0;const{data:o,error:e}=await y.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",ve.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(ai=!1,e){alert("Failed to load bids: "+e.message);return}Yt=(o||[]).map(t=>({...t,corp:t.factions?.faction_name||"Unknown",abbr:t.factions?.corp_ticker||"???",subsector:t.factions?.corp_subsector||"—"})),Jt(),ia()}function jo(){document.getElementById("bid-review-overlay")?.remove(),ve=null}function Yr(o){We=o,ia()}async function Qr(){if(ni||Yt.length===0)return;const o=Yt[We];if(!(!o?.id||!o.faction_id)&&confirm("Accept bid from "+o.corp+`?

Bid Price: `+_(o.bid_price)+`
Quality: `+o.estimated_quality+`/100
Workers: `+o.labor_count+`

This will award the contract. The project begins immediately.`)){ni=!0;try{const{data:e}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{error:n}=await y.from("contract_bids").update({status:"won"}).eq("id",o.id);if(n)throw n;const{error:i}=await y.from("contract_bids").update({status:"lost"}).eq("contract_id",ve.id).neq("id",o.id);if(i)throw i;const{error:a}=await y.from("construction_contracts").update({status:"awarded",awarded_to_faction:o.faction_id,awarded_at_tick:t}).eq("id",ve.id);if(a)throw a;jo(),alert("Contract awarded to "+o.corp+`!

Bid: `+_(o.bid_price)+`
Project begins immediately.`),typeof Ne=="function"&&await Ne()}catch(e){alert("Failed to accept bid: "+(e.message||e))}finally{ni=!1}}}async function Kr(){if(!(!ve||si)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){si=!0;try{const{error:o}=await y.from("contract_bids").update({status:"lost"}).eq("contract_id",ve.id);if(o)throw o;const{error:e}=await y.from("construction_contracts").update({status:"expired"}).eq("id",ve.id);if(e)throw e;jo(),alert("All bids declined. Contract cancelled."),typeof Ne=="function"&&await Ne()}catch(o){alert("Failed: "+(o.message||o))}finally{si=!1}}}function ia(){if(document.getElementById("bid-review-overlay")?.remove(),!ve||Yt.length===0)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=ve,n=Yt;We>=n.length&&(We=0);const i=n[We],a=Number(t.budget_ceiling||0),s=Number(t.timeline_ticks||36),r=Math.min(...n.map(m=>m.bid_price)),p=Math.max(...n.map(m=>m.estimated_quality||0));let l="";for(let m=0;m<n.length;m++){const u=n[m],x=m===We,b=u.bid_price===r,$=(u.estimated_quality||0)===p,h=u.bid_price>a;l+=`
        <div onclick="reviewSelectBid(${m})" style="padding:10px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${x?e.accent:"transparent"};background:${x?"rgba(139,154,107,0.03)":"transparent"};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-family:${o};font-size:10px;font-weight:700;color:${e.gold}">${u.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${e.text}">${u.corp}</span>
                ${b?`<span style="font-family:${o};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.greenBright};background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2)">CHEAPEST</span>`:""}
                ${$?`<span style="font-family:${o};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.2)">BEST QUALITY</span>`:""}
            </div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};">
                <div style="flex:1.2;padding:5px 10px;border-right:1px solid ${e.border}">
                    <div style="font-family:${o};font-size:7px;color:${e.dim}">BID PRICE</div>
                    <div style="font-family:${o};font-size:14px;font-weight:700;color:${h?e.red:e.text}">${_(u.bid_price)}</div>
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
        </div>`}const f=i.bid_price>a,d=a>0?Math.round(i.bid_price/a*100):0,v=document.createElement("div");v.id="bid-review-overlay",v.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",v.addEventListener("click",m=>{m.target===v&&jo()}),v.innerHTML=`
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
            <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.gold}">${n.length} BID${n.length!==1?"S":""} RECEIVED</span>
            <div style="display:flex;gap:8px;font-family:${o};font-size:8px;color:${e.dim};">
                <span>Cheapest: <span style="color:${e.greenBright}">${_(r)}</span></span>
                <span>Best Quality: <span style="color:${e.accent}">${p}</span></span>
            </div>
        </div>
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${e.border};overflow:auto;">
                ${l}
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
                        <span style="font-family:${o};font-size:9px;font-weight:700;color:${f?e.red:e.greenBright}">${f?"OVER":"WITHIN"} — ${d}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${e.border}"><div style="width:${Math.min(100,d)}%;height:100%;background:${f?e.red:e.accent}"></div></div>
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
    </div>`,document.body.appendChild(v)}const kt={Coastal:{color:"#8b9a6b",label:"COASTAL"},Container:{color:"#5a7aaa",label:"CONTAINER"},Bulk:{color:"#c8a832",label:"BULK"},Tanker:{color:"#c86a4a",label:"TANKER"},Reefer:{color:"#6a9a5a",label:"REEFER"},LNG:{color:"#c55",label:"LNG"}},Jr={in_port:{color:"#8b9a6b",label:"IN PORT"},in_transit:{color:"#5a8aaa",label:"IN TRANSIT"},dry_dock:{color:"#c84",label:"DRY DOCK"},anchored:{color:"#ca5",label:"ANCHORED"},for_sale:{color:"#9e9a92",label:"FOR SALE"}};function na(o){return o>=75?"#5c5":o>=50?"#ca5":o>=25?"#c84":"#c55"}function Xr(o){return o>=60?"#5c5":o>=30?"#ca5":o>=15?"#c84":"#c55"}async function he(){if(!c||c.corp_sector!=="Shipping")return;const{data:o,error:e}=await y.from("corp_vessels").select("*").eq("faction_id",c.id).order("vessel_class");e&&console.warn("Failed to load fleet:",e.message),_e=o||[],Ht=null,Mt={},go={};try{const t=_e.map(n=>n.id);if(t.length>0){const{data:n}=await y.from("finance_active_loans").select("insured_vessel_id").in("insured_vessel_id",t).in("status",["current"]);for(const a of n||[])a.insured_vessel_id&&(Mt[a.insured_vessel_id]=!0);const{data:i}=await y.from("finance_loan_requests").select("insured_vessel_id").eq("requesting_faction_id",c.id).eq("request_type","insurance").eq("status","open").not("insured_vessel_id","is",null);for(const a of i||[])a.insured_vessel_id&&!Mt[a.insured_vessel_id]&&(go[a.insured_vessel_id]=!0)}}catch(t){console.warn("Failed to load vessel insurance status:",t.message)}aa()}function Zr(o){Ht=Ht===o?null:o,aa()}function aa(){const o=document.getElementById("fl-count"),e=document.getElementById("fl-summary"),t=document.getElementById("fl-list"),n=document.getElementById("fl-footer");if(!o||!t)return;const i=_e;o.textContent=i.length+" VESSEL"+(i.length!==1?"S":"");const a=i.filter(d=>d.status==="in_transit").length,s=i.filter(d=>d.status==="in_port"||d.status==="anchored").length,r=i.filter(d=>d.status==="dry_dock").length,p=i.reduce((d,v)=>d+(v.base_maintenance||0),0);e.innerHTML=[{label:"TRANSIT",value:a,color:"#5a8aaa"},{label:"IN PORT",value:s,color:"#8b9a6b"},{label:"DRY DOCK",value:r,color:"#c84"},{label:"MAINT/TICK",value:_(p),color:"#a44"}].map((d,v)=>`<div style="flex:1;padding:5px 8px;text-align:center;${v<3?"border-right:1px solid var(--border-0);":""}">
        <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">${d.label}</div>
        <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${d.color};margin-top:1px;">${d.value}</div>
    </div>`).join(""),i.length===0?t.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels in fleet.<br>Purchase ships to begin operations.</div>':t.innerHTML=i.map((d,v)=>{const m=Ht===v,u=kt[d.vessel_class]||{color:"#666",label:"?"},x=Jr[d.status]||{color:"#666",label:"?"},b=na(d.condition),$=Xr(d.fuel),h=d.condition<50||d.fuel<20,E=d.status==="in_transit",S=d.status==="dry_dock",k=z?.current_tick||0,T=Math.max(0,Math.floor((k-(d.built_at_tick||0))/12));let C=`<div onclick="flSelectVessel(${v})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${h?d.condition<50?b:$:"transparent"};background:${m?u.color+"06":"transparent"};">
                <div style="padding:7px 14px;">`;C+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${g(d.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${u.color};background:${u.color}12;border:1px solid ${u.color}25;">${u.label}</span>
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
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${T}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#a44;margin-top:1px;">${_(d.base_maintenance)}</div>
                </div>
            </div>`,S&&d.drydock_until_tick){const w=Math.max(0,d.drydock_until_tick-k);C+=`<div style="margin-top:4px;padding:3px 8px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">DRY DOCK REPAIRS</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c84;">${w} tick${w!==1?"s":""} remaining</span>
                </div>`}if(m){C+=`<div style="margin-top:6px;">
                    <div style="padding:5px 8px;background:var(--bg-0);border:1px solid var(--border-0);margin-bottom:6px;">`;const w=[{label:"VESSEL CLASS",value:d.vessel_class},{label:"BUILT",value:"Tick "+(d.built_at_tick||0)},{label:"FUEL CAPACITY",value:(d.fuel_capacity||0).toLocaleString()+" tons"},{label:"LAST REFURBISH",value:d.last_refurbish_tick?"Tick "+d.last_refurbish_tick:"N/A"}];for(let H=0;H<w.length;H++)C+=`<div style="display:flex;justify-content:space-between;padding:2px 0;${H<3?"border-bottom:1px solid var(--border-0);":""}">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${w[H].label}</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);">${w[H].value}</span>
                    </div>`;C+="</div>";const A=E||S,q=Math.round((d.purchase_price||3e6)*.08*(1+(100-d.condition)/100)),U=Math.round((d.fuel_capacity||1e3)*50*(1-d.fuel/100)),J=Math.round((d.purchase_price||3e6)*(d.condition/100)*.6);if(C+=`<div style="display:flex;gap:4px;">
                    <div onclick="${A?"":"flRefurbish('"+d.id+"',"+q+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${A?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${A?"var(--text-dim)":"#5c5"};border:1px solid ${A?"var(--border-0)":"#2a5a3a"};background:${A?"transparent":"rgba(74,170,136,0.06)"};opacity:${A?.35:1};">REFURBISH<br><span style="font-weight:400;font-size:6px;">${_(q)}</span></div>
                    <div onclick="${E?"":"flRefuel('"+d.id+"',"+U+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${E?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${E?"var(--text-dim)":"#c86a4a"};border:1px solid ${E?"var(--border-0)":"rgba(200,106,74,0.3)"};opacity:${E?.35:1};">REFUEL<br><span style="font-weight:400;font-size:6px;">from ${_(U)}</span></div>
                    <div onclick="${A?"":"flSell('"+d.id+"','"+g(d.vessel_name).replace(/'/g,"")+"',"+J+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${A?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${A?"var(--text-dim)":"#c84"};border:1px solid ${A?"var(--border-0)":"rgba(204,136,68,0.3)"};opacity:${A?.35:1};">LIST<br><span style="font-weight:400;font-size:6px;">${_(J)}</span></div>
                </div>`,!E){const H=Mt&&Mt[d.id],ye=go&&go[d.id];C+='<div style="display:flex;gap:4px;margin-top:4px;">',H?C+=`<div style="flex:1;display:flex;gap:2px;">
                            <div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#5c5;border:1px solid rgba(92,204,92,0.2);background:rgba(92,204,92,0.04);">INSURED ✓</div>
                            <div onclick="event.stopPropagation();flFileClaim('${d.id}','${g(d.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#c55;border:1px solid rgba(204,85,85,0.2);background:rgba(204,85,85,0.04);">FILE CLAIM</div>
                        </div>`:ye?C+='<div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#ca5;border:1px solid rgba(202,165,50,0.2);background:rgba(202,165,50,0.04);">PENDING ⏳</div>':C+=`<div onclick="event.stopPropagation();flRequestInsurance('${d.id}','${g(d.vessel_name).replace(/'/g,"")}',${d.purchase_price||0})" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#aa7a5a;border:1px solid rgba(170,122,90,0.3);background:rgba(170,122,90,0.04);">INSURE</div>`,C+=`<div onclick="flRename('${d.id}','${g(d.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:var(--text-muted);border:1px solid var(--border-0);">RENAME</div>`,C+="</div>"}E&&(C+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel at sea — actions available on arrival</div>'),S&&(C+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel in dry dock — repairs in progress</div>'),C+="</div>"}return C+="</div></div>",C}).join("");const l={};for(const d of i)l[d.vessel_class]=(l[d.vessel_class]||0)+1;let f='<div style="display:flex;gap:6px;">';for(const[d,v]of Object.entries(kt))l[d]&&(f+=`<div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:${v.color};border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">${v.label}</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${l[d]}</span>
        </div>`);f+="</div>",f+=`<span style="font-family:var(--font-mono);font-size:8px;color:#a44;">${_(p)}/tick</span>`,n.innerHTML=f}let ne=!1;async function el(o,e){if(ne||!c)return;const t=(_e||[]).find(m=>m.id===o);if(!t)return;const n=t.current_port_nation_id||null;let i="state",a=3,s=3,r=null,p="State Dry Dock (3x cost, 3 ticks)";if(n){const{data:m}=await y.from("corp_properties").select("id").eq("faction_id",c.id).eq("nation_id",n).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();if(m)i="own",a=1,s=2,p="Your Dry Dock (base cost, 2 ticks)";else{const{data:u}=await y.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",c.id).eq("nation_id",n).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();u&&(i="other",a=1.2,s=2,r=u.faction_id,p=(u.factions?.faction_name||"Another corp")+"'s Dry Dock (+20%, 2 ticks)")}}else p="State Dry Dock (3x cost, 3 ticks) — no private dock in port";const l=Math.round(e*a),{data:f}=await y.from("factions").select("corp_cash_reserves").eq("id",c.id).single(),d=Number(f?.corp_cash_reserves??0);if(d<l){alert("Insufficient cash. Need "+_(l)+", have "+_(d)+".");return}if(!confirm("Send "+(t.vessel_name||"vessel")+` to dry dock?

Dock: `+p+`
Cost: `+_(l)+`
Duration: `+s+` ticks
Condition restored to 85-100%.`))return;ne=!0;const v=z?.current_tick||0;try{const{error:m}=await y.from("factions").update({corp_cash_reserves:d-l}).eq("id",c.id);if(m){alert("Failed: "+m.message);return}if(i==="other"&&r){const x=l-e,{data:b}=await y.from("factions").select("corp_cash_reserves").eq("id",r).single();b&&await y.from("factions").update({corp_cash_reserves:Number(b.corp_cash_reserves||0)+x}).eq("id",r)}const{error:u}=await y.from("corp_vessels").update({status:"dry_dock",drydock_until_tick:v+s,active_claim_id:null}).eq("id",o);if(u){await y.from("factions").update({corp_cash_reserves:d}).eq("id",c.id),alert("Failed: "+u.message);return}c.corp_cash_reserves=d-l,await he()}catch(m){alert("Dry dock failed: "+(m.message||"Error"))}finally{ne=!1}}async function tl(o,e){if(ne||!c)return;if(e<=0){alert("Fuel tanks are already full.");return}const t=(_e||[]).find(d=>d.id===o);if(!t)return;const n=t.current_port_nation_id||c.nation_id;let i="state",a=3,s=null,r="State Fuel (3x cost) — no private depot in port";if(n){const{data:d}=await y.from("corp_properties").select("id").eq("faction_id",c.id).eq("nation_id",n).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(d)i="own",a=1,r="Your Fuel Depot (base cost)";else{const{data:v}=await y.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",c.id).eq("nation_id",n).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();v&&(i="other",a=1.15,s=v.faction_id,r=(v.factions?.faction_name||"Another corp")+"'s Fuel Depot (+15%)")}}const p=Math.round(e*a),{data:l}=await y.from("factions").select("corp_cash_reserves").eq("id",c.id).single(),f=Number(l?.corp_cash_reserves??0);if(f<p){alert("Insufficient cash. Need "+_(p)+", have "+_(f)+".");return}if(confirm("Refuel "+(t.vessel_name||"vessel")+`?

Source: `+r+`
Cost: `+_(p)+`
Fuel restored to 100%.`)){ne=!0;try{const{error:d}=await y.from("factions").update({corp_cash_reserves:f-p}).eq("id",c.id);if(d){alert("Failed: "+d.message);return}if(i==="other"&&s){const m=p-e,{data:u}=await y.from("factions").select("corp_cash_reserves").eq("id",s).single();u&&await y.from("factions").update({corp_cash_reserves:Number(u.corp_cash_reserves||0)+m}).eq("id",s)}const{error:v}=await y.from("corp_vessels").update({fuel:100}).eq("id",o);if(v){await y.from("factions").update({corp_cash_reserves:f}).eq("id",c.id),alert("Failed: "+v.message);return}c.corp_cash_reserves=f-p,await he()}catch(d){alert("Refuel failed: "+(d.message||"Error"))}finally{ne=!1}}}async function ol(o,e,t){if(ne||!c||!z||!confirm("List "+e+" on the Ship Market for "+_(t)+`?

The vessel will be removed from your fleet and listed for sale. You will receive payment when another corporation purchases it.`))return;ne=!0;const n=z.current_tick||0,i=_e.find(p=>p.id===o);if(!i){ne=!1;return}const a=Math.max(0,n-(i.built_at_tick||0)),{error:s}=await y.from("ship_market_listings").insert({nation_id:c.nation_id,vessel_name:i.vessel_name,vessel_class:i.vessel_class,capacity_dwt:i.capacity_dwt,capacity_unit:i.capacity_unit,condition:i.condition,fuel:i.fuel,age_ticks:a,fuel_capacity:i.fuel_capacity,base_maintenance:i.base_maintenance,asking_price:t,purchase_price_new:i.purchase_price||t,seller_type:"CORP",seller_name:c.faction_name,seller_faction_id:c.id,sale_reason:"Listed for sale by "+(c.faction_name||"corporation"),status:"available",listed_at_tick:n});if(s){alert("Failed to create listing: "+s.message),ne=!1;return}const{error:r}=await y.from("corp_vessels").delete().eq("id",o);if(r){await y.from("ship_market_listings").delete().eq("seller_faction_id",c.id).eq("vessel_name",i.vessel_name).eq("listed_at_tick",n),alert("Failed to remove vessel: "+r.message),ne=!1;return}ne=!1,Ht=null,await Promise.all([he(),sa()])}async function il(o,e){const t=prompt("Rename vessel:",e);if(!t||t.trim()===e||t.trim().length<2)return;const{error:n}=await y.from("corp_vessels").update({vessel_name:t.trim().slice(0,40)}).eq("id",o);if(n){alert("Failed: "+n.message);return}await he()}async function nl(o,e,t){if(!c||!z||!confirm("Request insurance for "+e+`?

Insurance corporations will see this in their Deal Flow and can offer coverage terms.

Vessel value: `+_(t)))return;const n=z.current_tick||0,{error:i}=await y.from("finance_loan_requests").insert({requesting_faction_id:c.id,nation_id:c.nation_id,request_type:"insurance",insured_vessel_id:o,amount:t,term_months:0,purpose:"Vessel Insurance — "+e,status:"open",created_tick:n,expires_tick:n+12});if(i){i.message.includes("duplicate")||i.message.includes("unique")?alert("Insurance already requested for this vessel."):alert("Failed to request insurance: "+i.message);return}alert(`Insurance request posted to Deal Flow.

Insurance corporations can now offer coverage for `+e+"."),await he()}let ri=!1;async function al(o,e){if(ri||!c||!z)return;const t=prompt(`Describe the claim reason:

e.g., "Storm damage during transit — hull breach repaired at sea" or "Engine failure requiring emergency dry dock"`);if(!t||t.trim().length<5)return;const n=z.current_tick||0,{data:i}=await y.from("finance_active_loans").select("id, lender_faction_id, principal, deductible_pct").eq("insured_vessel_id",o).eq("status","current").limit(1).maybeSingle();if(!i){alert("No active insurance policy found for this vessel.");return}const a=Number(i.principal||0),s=Number(i.deductible_pct||10),r=Math.round(a*s/100);if(!confirm("File insurance claim for "+e+`?

Coverage: `+_(a)+`
Deductible: `+s+"% ("+_(r)+`)

Reason: `+t.trim()+`

The insurer will review this claim and determine the payout.`))return;ri=!0;const{error:p}=await y.from("event_log").insert({nation_id:c.nation_id,faction_id:c.id,event_name:(c.faction_name||"Corporation")+" — Insurance Claim Filed",description_used:(c.faction_name||"A shipping corporation")+" has filed an insurance claim for vessel "+e+". Reason: "+t.trim().replace(/[<>"]/g,""),category:"business",trigger_key:"vessel_insurance_claim",effects_applied:{vessel_id:o,vessel_name:e,policy_id:i.id,insurer_faction_id:i.lender_faction_id,coverage:a,deductible_pct:s,claim_reason:t.trim()},fired_at_tick:n});p&&console.warn("Failed to log insurance claim event:",p.message);const{error:l}=await y.from("finance_active_loans").update({claims_paid:(i.claims_paid||0)+1}).eq("id",i.id);l&&console.warn("Failed to update claims_paid:",l.message),ri=!1,alert("Insurance claim filed for "+e+`.

The insurer (`+_(a)+" coverage) has been notified. Claim details are visible in the events feed.")}window.flRequestInsurance=nl;window.flFileClaim=al;const $i={fuel_depot:{label:"FUEL DEPOT",color:"#c86a4a",icon:"⛽",desc:"Bunkering facility — refuel at base cost, earn revenue from visiting fleets."},dry_dock:{label:"DRY DOCK",color:"#c84",icon:"🔧",desc:"Repair & maintenance dock — dock at base cost, earn revenue from visiting fleets."}},sl=[{type:"fuel_depot",name:"Fuel Depot — Standard",cost:105e6,maint:85e3,style:"Basic",desc:"Bulk fuel storage and bunkering facility."},{type:"fuel_depot",name:"Fuel Depot — Advanced",cost:14e7,maint:11e4,style:"Modern",desc:"High-capacity fuel terminal with pipeline infrastructure."},{type:"dry_dock",name:"Dry Dock — Standard",cost:85e6,maint:15e4,style:"Basic",desc:"Ship repair and maintenance facility."},{type:"dry_dock",name:"Dry Dock — Advanced",cost:115e6,maint:2e5,style:"Modern",desc:"Full-service shipyard with drydock and crane facilities."}];let To=[];async function rl(){if(!c||c.corp_sector!=="Shipping")return;const{data:o}=await y.from("corp_properties").select("*").eq("faction_id",c.id).in("type",["fuel_depot","dry_dock"]).eq("is_active",!0).order("created_at",{ascending:!1});To=o||[],ll()}function ll(){const o=document.getElementById("pf-count"),e=document.getElementById("pf-list"),t=document.getElementById("pf-footer");if(!o||!e||!t)return;const n=To;if(o.textContent=n.length+" FACILIT"+(n.length===1?"Y":"IES"),n.length===0)e.innerHTML=`<div style="padding:20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-bottom:6px;">No port facilities built.</div>
            <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Build a <span style="color:#c86a4a;font-weight:700;">Fuel Depot</span> to refuel your fleet at base cost<br>and earn revenue from other corps refueling here.<br>Build a <span style="color:#c84;font-weight:700;">Dry Dock</span> to repair vessels at base cost.</div>
        </div>`;else{let s=0;e.innerHTML=n.map(r=>{const p=$i[r.type]||$i.fuel_depot,l=r.condition>=75?"#5c5":r.condition>=50?"#ca5":"#c84";return s+=Number(r.monthly_maintenance||0),`<div style="padding:8px 12px;border-bottom:1px solid var(--border-0);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${p.icon}</span>
                        <span style="font-size:11px;font-weight:600;color:var(--text-bright);">${g(r.name)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${p.color};background:${p.color}12;border:1px solid ${p.color}25;">${p.label}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:4px;">${r.city||"Port"} · ${(r.style||"Basic").toUpperCase()}</div>
                <div style="display:flex;gap:12px;margin-bottom:4px;">
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${l};">${r.condition}%</span>
                        </div>
                        <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${r.condition}%;height:100%;background:${l};"></div></div>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#a44;">${_(r.monthly_maintenance||0)}</span>
                        </div>
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">VALUE: ${_(r.purchase_price||0)}</div>
                    </div>
                </div>
            </div>`}).join("")}Number(c?.corp_cash_reserves??0);const i=n.some(s=>s.type==="fuel_depot"),a=n.some(s=>s.type==="dry_dock");t.innerHTML=`
        <div onclick="pfOpenBuild('fuel_depot')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c86a4a;border:1px solid rgba(200,106,74,0.3);background:rgba(200,106,74,0.04);">
            ${i?"+ FUEL DEPOT":"BUILD FUEL DEPOT"}
        </div>
        <div onclick="pfOpenBuild('dry_dock')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c84;border:1px solid rgba(204,136,68,0.3);background:rgba(204,136,68,0.04);">
            ${a?"+ DRY DOCK":"BUILD DRY DOCK"}
        </div>`}let li=!1;async function dl(o){if(li||!c||!z)return;const e=sl.filter(b=>b.type===o);if(e.length===0)return;const t=$i[o],n=c.nation_id,i=I?.name||c?.nation||"Home Nation",a=I?.capital||"Port City",s=[{id:n,name:i,capital:a,label:"National HQ"}],{data:r}=await y.from("corp_properties").select("nation_id, name, city, nations!nation_id(name, capital)").eq("faction_id",c.id).eq("type","regional_hq").eq("is_active",!0);for(const b of r||[])b.nation_id!==n&&s.push({id:b.nation_id,name:b.nations?.name||b.city||"Unknown",capital:b.nations?.capital||b.city||"Port City",label:b.name||"Subsidiary"});let p=s[0];if(s.length>1){let b=t.label+` — SELECT LOCATION
`+"─".repeat(30)+`
`;b+=`Build in which nation?

`;for(let E=0;E<s.length;E++){const S=s[E],k=To.filter(T=>T.type===o&&T.nation_id===S.id).length;b+=E+1+". "+S.name+"  ("+S.label+")",k>0&&(b+="  ["+k+" existing]"),b+=`
`}b+=`
Enter number (or cancel):`;const $=prompt(b);if(!$)return;const h=parseInt($,10)-1;if(isNaN(h)||h<0||h>=s.length){alert("Invalid selection.");return}p=s[h]}const l=To.filter(b=>b.type===o&&b.nation_id===p.id).length;let f=t.label+" CONSTRUCTION — "+p.name.toUpperCase()+`
`+"─".repeat(30)+`
`;l>0&&(f+="You already have "+l+" "+t.label.toLowerCase()+(l>1?"s":"")+` here.

`),f+=t.desc+`

`;for(let b=0;b<e.length;b++){const $=e[b];f+=b+1+". "+$.name+`
`,f+="   Cost: "+_($.cost)+" · Maint: "+_($.maint)+`/tick
`,f+="   "+$.desc+`

`}f+="Enter 1 or 2 to select (or cancel):";const d=prompt(f);if(!d)return;const v=parseInt(d,10)-1;if(isNaN(v)||v<0||v>=e.length){alert("Invalid selection.");return}const m=e[v];if(!confirm("Commission "+m.name+" in "+p.capital+", "+p.name+`?

Budget: `+_(m.cost)+`

This will create a construction contract that construction corporations can bid on. Payment occurs when the contract is awarded.`))return;li=!0;const u=z.current_tick||0,x=(z.current_date||"").match(/\d{4}/)?.[0]||"2015";try{const{count:b}=await y.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",p.id).eq("issuer_type","PRIVATE"),h=`PVT-P${(b||0)+1}-${x}`,E=m.style==="Modern",S={concrete:E?6:4,steel:E?5:3,heavy_parts:E?3:2,aggregate:E?3:2},k={trucks:1,mixers:1,excavators:1},T={general:E?12:8,skilled:E?5:3},C=E?6:4,{error:M}=await y.from("construction_contracts").insert({nation_id:p.id,template_key:o,sector:"industrial",name:m.name,project_type:t.label,project_subtype:m.style,description:`${m.name} at ${p.capital} Port — commissioned by ${c.faction_name}. ${m.desc}`,project_code:h,budget_ceiling:m.cost,timeline_ticks:C,required_materials:S,required_equipment:k,required_workforce:T,status:"open",generated_at_tick:u,bidding_ends_tick:u+3,issuer_type:"PRIVATE",issuer_name:c.faction_name,issuer_faction_id:c.id});if(M)throw M;await rl(),alert(`Construction contract posted!

Project: `+m.name+`
Location: `+p.capital+", "+p.name+`
Code: `+h+`
Budget: `+_(m.cost)+`
Timeline: `+C+` ticks

Construction corporations in `+p.name+" can now bid on this project.")}catch(b){alert("Failed to post contract: "+(b.message||"Error"))}finally{li=!1}}window.pfOpenBuild=dl;const Qi={"Bulk Cargo":["Reefer","Bulk","Coastal"],"Container Freight":["Coastal","Container"],"Specialized Transport":["Tanker","LNG","Bulk"]};async function sa(){if(!c||c.corp_sector!=="Shipping")return;const{data:o,error:e}=await y.from("ship_market_listings").select("*, nation:nation_id(id, name)").eq("status","available").order("asking_price",{ascending:!0});e&&console.warn("Failed to load ship market:",e.message),Ei=o||[],xo=null,ra()}function cl(o){xo=xo===o?null:o,ra()}function pl(o){return(Qi[c?.corp_subsector]||[]).includes(o)}function ra(){const o=document.getElementById("sm-count"),e=document.getElementById("sm-list"),t=document.getElementById("sm-footer");if(!o||!e)return;const n=Ei;o.textContent=n.length+" AVAILABLE",n.length===0?e.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels on the market.<br>Check back next cycle.</div>':e.innerHTML=n.map((s,r)=>{const p=xo===r,l=kt[s.vessel_class]||{color:"#666",label:"?"},f=s.seller_type==="CORP"?"#5a8aaa":"#8b9a6b",d=na(s.condition),v=s.nation?.name||"—",m=pl(s.vessel_class);z?.current_tick;const u=s.age_ticks||0,x=Math.max(1,Math.floor(u/12)),b=v!==c?.nation?Number(c?.tariffs||I?.tariffs||0):0,$=Math.round(s.asking_price*b/100),h=s.asking_price+$;let E=`<div onclick="smSelectListing(${r})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${p?l.color:"transparent"};background:${p?l.color+"06":"transparent"};">
                <div style="padding:8px 14px;">`;return E+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${g(s.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${l.color};background:${l.color}12;border:1px solid ${l.color}25;">${l.label}</span>
            </div>`,E+=`<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;">
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${f};background:${f}12;border:1px solid ${f}25;">${s.seller_type}</span>
                <span style="font-size:9px;color:var(--text-muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${g(s.seller_name||"—")}</span>
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;">${v.toUpperCase().slice(0,6)}</span>
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
            </div>`,p&&(E+='<div style="margin-top:6px;">',E+=`<div style="padding:4px 8px;margin-bottom:5px;background:var(--bg-0);border:1px solid var(--border-0);">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0);">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CARRIES</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${l.color};">${(kt[s.vessel_class]||{}).label||"?"} class cargo</span>
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
                    </div>`),m?E+=`<div onclick="event.stopPropagation();smPurchase('${s.id}',${h})" style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${l.color};cursor:pointer;">${_(h)} — PURCHASE</div>`:E+=`<div style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:var(--text-dim);border:1px solid var(--border-0);opacity:0.4;">⊘ ${s.vessel_class} not available for ${c?.corp_subsector||"your subsector"}</div>`,E+="</div>"),E+="</div></div>",E}).join("");const i=n.filter(s=>s.seller_type==="CORP").length,a=n.filter(s=>s.seller_type==="LOCAL").length;t.innerHTML=`<div style="display:flex;gap:6px;">
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
    <div onclick="smOpenCommission()" style="padding:4px 14px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--gold);border:1px solid rgba(200,168,50,0.3);cursor:pointer;">COMMISSION VESSEL</div>`}let st=!1;async function fl(o,e){if(st||!c||!z)return;const t=Number(c.corp_cash_reserves??0);if(t<e){alert("Insufficient cash. Need "+_(e)+".");return}if(!confirm("Purchase this vessel for "+_(e)+"?"))return;st=!0;const n=Ei.find(d=>d.id===o);if(!n){st=!1;return}const i=z.current_tick||0,a={Coastal:{capacity_dwt:14e3,capacity_unit:"DWT",base_maintenance:18e4,fuel_capacity:800,purchase_price:3e6},Container:{capacity_dwt:4800,capacity_unit:"TEU",base_maintenance:29e4,fuel_capacity:2100,purchase_price:65e6},Bulk:{capacity_dwt:28e3,capacity_unit:"DWT",base_maintenance:35e4,fuel_capacity:1800,purchase_price:3e6},Tanker:{capacity_dwt:42e3,capacity_unit:"DWT",base_maintenance:38e4,fuel_capacity:2400,purchase_price:53e6},Reefer:{capacity_dwt:12e3,capacity_unit:"DWT",base_maintenance:28e4,fuel_capacity:1600,purchase_price:6e6},LNG:{capacity_dwt:18e3,capacity_unit:"DWT",base_maintenance:58e4,fuel_capacity:1400,purchase_price:78e6}},s=a[n.vessel_class]||a.Coastal,{error:r}=await y.from("factions").update({corp_cash_reserves:t-e}).eq("id",c.id);if(r){alert("Failed: "+r.message),st=!1;return}const{error:p}=await y.from("corp_vessels").insert({faction_id:c.id,nation_id:c.nation_id,vessel_name:n.vessel_name,vessel_class:n.vessel_class,condition:n.condition,fuel:n.fuel||50,status:"in_port",capacity_dwt:n.capacity_dwt||s.capacity_dwt,capacity_unit:n.capacity_unit||s.capacity_unit,base_maintenance:n.base_maintenance||s.base_maintenance,fuel_capacity:n.fuel_capacity||s.fuel_capacity,purchase_price:e,built_at_tick:i-(n.age_ticks||0),current_port_nation_id:c.nation_id});if(p){await y.from("factions").update({corp_cash_reserves:t}).eq("id",c.id),alert("Failed to create vessel: "+p.message),st=!1;return}var{error:l}=await y.from("ship_market_listings").update({status:"sold",purchased_by:c.id,purchased_at_tick:i}).eq("id",o);if(l&&console.warn("Failed to mark listing as sold:",l.message),n.seller_faction_id){const{data:d}=await y.from("factions").select("corp_cash_reserves").eq("id",n.seller_faction_id).single();if(d){var{error:f}=await y.from("factions").update({corp_cash_reserves:Number(d.corp_cash_reserves||0)+n.asking_price}).eq("id",n.seller_faction_id);f&&console.warn("Failed to credit seller:",f.message)}}c.corp_cash_reserves=t-e,st=!1,await Promise.all([he(),sa()])}const Pt=[{cls:"Coastal",baseCost:12e6,baseBuild:3,cargo:"Bulk, Containers (coastal)"},{cls:"Container",baseCost:65e6,baseBuild:5,cargo:"Manufactured, Tech, General"},{cls:"Bulk",baseCost:38e6,baseBuild:4,cargo:"Minerals, Aggregate, Military"},{cls:"Tanker",baseCost:52e6,baseBuild:5,cargo:"Fuel, Petroleum, Chemicals"},{cls:"Reefer",baseCost:45e6,baseBuild:4,cargo:"Food, Perishables, Agriculture"},{cls:"LNG",baseCost:78e6,baseBuild:6,cargo:"Liquefied Natural Gas only"}];let ce="Coastal",Qt=0,Kt="",Je=[];function ml(){ce=(Qi[c?.corp_subsector]||["Coastal"])[0],Qt=0,Kt="",Je=[],document.getElementById("comm-overlay").style.display="flex",ul()}async function ul(){const{data:o}=await y.from("nations").select("id, name, manufacturing_output, physical_infrastructure, tariffs").order("name");Je=(o||[]).map(e=>{const t=Number(e.manufacturing_output??50),n=Math.round((.75+t/100*.5)*100)/100,i=Math.round((1.5-t/100*.65)*100)/100,a=e.id===c?.nation_id;return{id:e.id,name:e.name,mfg:t,costMod:n,buildMod:i,isHome:a,tariffs:Number(e.tariffs??0)}}),Je.sort((e,t)=>(t.isHome?1:0)-(e.isHome?1:0)),Ki()}function la(){document.getElementById("comm-overlay").style.display="none"}function vl(o){ce=o,Ki()}function yl(o){Qt=o,Ki()}function gl(o){Kt=o}function Ki(){const o=document.getElementById("comm-content");if(!o)return;const e=z?.current_tick||0,t=Pt.find(u=>u.cls===ce)||Pt[0],n=Je[Qt]||{name:"—",costMod:1,buildMod:1},i=kt[ce]||{color:"#666"},a=Math.round(t.baseCost*n.costMod),s=Math.max(2,Math.round(t.baseBuild*n.buildMod)),r=Math.round(a*.5),p=a-r,l=e+s,f=Qi[c?.corp_subsector]||[];let d="";d+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:#c8a832;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Commission Vessel</span>
            </div>
            <span onclick="smCloseCommission()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
    </div>`,d+='<div style="flex:1;overflow-y:auto;">',d+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Vessel Type</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">`;for(const u of Pt){const x=kt[u.cls]||{color:"#666",label:"?"},b=ce===u.cls,$=f.includes(u.cls);d+=`<div onclick="${$?"commSetClass('"+u.cls+"')":""}" style="padding:5px 4px;text-align:center;cursor:${$?"pointer":"not-allowed"};background:${b?x.color+"18":"transparent"};border:1px solid ${b?x.color+"44":"#2a2a24"};opacity:${$?1:.3};">
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${b?x.color:"#6a6660"};">${x.label}</div>
            <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;margin-top:2px;">${_(u.baseCost)} base</div>
        </div>`}d+="</div>",d+=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:${i.color};">${t.cargo}</div>`,d+="</div>",d+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Origin Shipyard</div>`;for(let u=0;u<Je.length;u++){const x=Je[u],b=Qt===u,$=x.costMod>1?"#c84":x.costMod<1?"#5c5":"#6a6660",h=x.buildMod>1?"#c84":x.buildMod<1?"#5c5":"#6a6660";d+=`<div onclick="commSetNation(${u})" style="display:flex;align-items:center;padding:5px 8px;margin-bottom:2px;cursor:pointer;background:${b?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${b?"#8b9a6b44":"#2a2a24"};border-left:2px solid ${b?"#8b9a6b":"transparent"};">
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
        <div style="background:#1c1c18;border:1px solid #2a2a24;padding:6px 10px;">`;const v=[{label:"VESSEL CLASS",value:ce,color:i.color},{label:"SHIPYARD",value:n.name,color:"#9e9a92"},{label:"BASE COST",value:_(t.baseCost)+" × "+n.costMod.toFixed(2),color:"#9e9a92"},{label:"BUILD TIME",value:s+" ticks",color:s>t.baseBuild?"#c84":s<t.baseBuild?"#5c5":"#9e9a92"},{label:"COMPLETION",value:"~Tick "+l,color:"#9e9a92"}];for(const u of v)d+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${u.label}</span>
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${u.color};">${u.value}</span>
        </div>`;d+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">TOTAL COST</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c8a832;">${_(a)}</span>
    </div>`,d+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEPOSIT (50% NOW)</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">${_(r)}</span>
    </div>`,d+=`<div style="display:flex;justify-content:space-between;padding:3px 0;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">BALANCE ON COMPLETION</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${_(p)}</span>
    </div>`,d+="</div></div>",d+=`<div style="padding:6px 16px;">
        <div style="padding:5px 8px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#c8a832;margin-bottom:2px;">PAYMENT TERMS</div>
            <div style="font-size:9px;color:#6a6660;line-height:1.5;">50% deposit due immediately. Remaining 50% due on delivery at tick ${l}. Vessel delivered at 100% condition, fully fueled, to your nearest port. Cancellation forfeits deposit.</div>
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
    </div>`,o.innerHTML=d}let Nt=!1;async function xl(){if(Nt||!c||!z)return;const o=Kt.trim();if(o.length<2)return;const e=Pt.find(b=>b.cls===ce)||Pt[0],t=Je[Qt];if(!t)return;const n=Math.round(e.baseCost*t.costMod),i=Math.max(2,Math.round(e.baseBuild*t.buildMod)),a=Math.round(n*.5),s=n-a,r=z.current_tick||0,p=Number(c.corp_cash_reserves??0);if(p<a){alert("Insufficient cash for deposit. Need "+_(a)+".");return}if(!confirm("Commission "+ce+" from "+t.name+`?

Deposit: `+_(a)+` (non-refundable)
Balance: `+_(s)+" on delivery at tick "+(r+i)))return;Nt=!0;const l=document.getElementById("comm-order-btn");l&&(l.style.opacity="0.4",l.style.pointerEvents="none");const{error:f}=await y.from("factions").update({corp_cash_reserves:p-a}).eq("id",c.id);if(f){alert("Failed: "+f.message),Nt=!1;return}const{data:d}=await y.from("nations").select("budget_reserves").eq("id",t.id).single();if(d){var{error:v}=await y.from("nations").update({budget_reserves:Number(d.budget_reserves||0)+a}).eq("id",t.id);v&&console.warn("Failed to credit shipyard nation budget:",v.message)}const m={Coastal:{dwt:14e3,unit:"DWT",maint:18e4,fuel:800},Container:{dwt:4800,unit:"TEU",maint:29e4,fuel:2100},Bulk:{dwt:28e3,unit:"DWT",maint:35e4,fuel:1800},Tanker:{dwt:42e3,unit:"DWT",maint:38e4,fuel:2400},Reefer:{dwt:12e3,unit:"DWT",maint:28e4,fuel:1600},LNG:{dwt:18e3,unit:"DWT",maint:58e4,fuel:1400}},u=m[ce]||m.Coastal,{error:x}=await y.from("vessel_orders").insert({faction_id:c.id,vessel_name:o,vessel_class:ce,capacity_dwt:u.dwt,capacity_unit:u.unit,base_maintenance:u.maint,fuel_capacity:u.fuel,purchase_price:e.baseCost,shipyard_nation_id:t.id,shipyard_nation:t.name,cost_modifier:t.costMod,build_modifier:t.buildMod,total_cost:n,deposit_paid:a,balance_due:s,ordered_at_tick:r,delivery_tick:r+i,build_ticks:i,status:"building"});if(x){await y.from("factions").update({corp_cash_reserves:p}).eq("id",c.id),alert("Failed to place order: "+x.message),Nt=!1;return}c.corp_cash_reserves=p-a,Nt=!1,la(),alert(o+` commissioned!

Class: `+ce+`
Shipyard: `+t.name+`
Deposit: `+_(a)+`
Delivery: Tick `+(r+i))}window.smSelectListing=cl;window.smPurchase=fl;window.smOpenCommission=ml;window.smCloseCommission=la;window.commSetClass=vl;window.commSetNation=yl;window.commSetName=gl;window.smPlaceOrder=xl;window.flSelectVessel=Zr;window.flRefurbish=el;window.flRefuel=tl;window.flSell=ol;window.flRename=il;window.openBidReview=Wr;window.closeBidReview=jo;window.reviewSelectBid=Yr;window.acceptBid=Qr;window.declineAllBids=Kr;window.switchToActions=In;window.actSelectExec=Xs;window.actExecute=Ps;window.confirmFireExec=Os;window.actOpenStatement=Rn;window.actCloseStatement=ji;window.actSubmitStatement=Ds;window.actOpenRestructure=Bn;window.actCloseRestructure=Fi;window.actSubmitRestructure=Ws;window.actOpenRebrand=Pn;window.actCloseRebrand=Ui;window.actSubmitRebrand=Ys;window.actOpenDonation=Dn;window.actCloseDonation=Hi;window.actSubmitDonation=Js;window.donateSelectParty=Ks;window.lrOpen=qn;window.lrClose=On;window.lrSubmit=Vs;window.lrSetAmount=js;window.lrSetPurpose=Fs;window.lrSetTerm=Us;window.lrSetCollateral=Hs;window.openExecSearch=Zs;window.closeExecSearch=Fn;window.esSelectCandidate=er;window.esHireCandidate=tr;window.switchToExpansion=Sn;window.switchToOperations=zn;window.hfSetChange=or;window.hfReset=ir;window.hfConfirm=nr;document.addEventListener("click",function(o){const e=o.target.closest(".corp-nav-tab[href]:not([data-tab-action])");if(!e)return;const t=e.getAttribute("href");if(!t)return;const n=new URL(t,window.location.href);n.pathname!==window.location.pathname||n.searchParams.get("tab")||e.classList.contains("active")||(o.preventDefault(),zn(o))});Is();
