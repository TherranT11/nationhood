const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-BGmUeelO.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as y}from"./supabase-client-CiYoFhIh.js";/* empty css                    */import{c as _e,i as Ca,a as Ta,l as Sa,M as jt,Q as Ni,b as Ai,d as vi,e as _n,f as hn,g as za,h as Ia}from"./corp-shipping-data-CcJ84lK3.js";import{_ as Na}from"./preload-helper-BXl3LOEh.js";import{e as x}from"./utils-CY90Gazr.js";import{initMessaging as Aa}from"./messaging-BUrQna7p.js";import{c as Ma,a as yi,E as Ft,b as zo,d as $n,e as Ra,f as qa,h as dn}from"./equipment-DsuDdEne.js";import{a as La,E as uo,b as vo,g as Oa}from"./corp-executives-1DOHMXWp.js";import"./elections-Cn1LYWzr.js";import"./config-fKhFNVuq.js";import"./government-types-D9n0pQb0.js";import"./ideology-Ngkkb21f.js";import"./stats-tIiBSaQA.js";let ke=[],c=null,N=null,I=null,je=[];const gi={};let Et={},J=[],X={},xi=-1;const Ba={em:"em_systems",glass:"glass_facades",heavy:"heavy_parts"},yo=o=>Ba[o]||o;let te="concrete",Y="STD",be=500,vt=null,re=[],go={},bi=0,Ut=[],Ht=[],yt=0,Ee=null,Te=-1,he=[],Gt=null,Rt={},xo={},Mi=[],bo=null,me="trucks",Ce=0,Se=1,Be=[],Ke=null,Ct=[],_i=null,ro=null;function nt(){return vt||N}let hi="ALL",$i="TIMELINE";function D(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Pa(o){if(o>=12){const e=Math.floor(o/12),t=o%12;return t>0?e+"y "+t+"mo":e+"y"}return o+" ticks"}function wn(o){return!o||o.length===0?"":o.map(e=>{const t=go[e];if(!t)return"";const i=t.reputation_bonus>0?"var(--green)":t.reputation_bonus<0?"var(--red)":"var(--text-dim)",n=t.reputation_bonus>0?"+"+t.reputation_bonus:t.reputation_bonus<0?String(t.reputation_bonus):"";return`<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:3px;font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">${t.icon||"📍"} ${x(t.name)}${n?` <span style="color:${i};font-weight:700;">${n} REP</span>`:""}</span>`}).filter(Boolean).join(" ")}function ue(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(0)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Ri(o){return o==="civil_engineering"?"CIVIL":o==="industrial"?"INDUSTRIAL":o==="mega_project"?"MEGA":o?.toUpperCase()||"—"}function kn(o){return o==="civil_engineering"?"light":o==="industrial"?"heavy":o==="mega_project"?"mega":"light"}function Da(){ro&&clearInterval(ro),ro=setInterval(()=>{if(!_i)return;const o=_i-Date.now();if(o<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(ro);return}const e=Math.floor(o/36e5),t=Math.floor(o%36e5/6e4),i=Math.floor(o%6e4/1e3);document.getElementById("tick-countdown").textContent=e+"h "+t+"m "+i+"s"},1e3)}function ja(){document.body.classList.toggle("light-mode");const o=document.getElementById("theme-toggle");o.textContent=document.body.classList.contains("light-mode")?"Dark":"Light"}function Fa(o,e){o==="type"&&(hi=e),o==="sort"&&($i=e),document.querySelectorAll(`.filter-pill[data-filter="${o}"]`).forEach(t=>{t.classList.toggle("active",t.dataset.value===e)}),En()}const pn={"Civil Engineering":"civil_engineering","Industrial Construction":"industrial",Megaprojects:"mega_project"};function wi(o){if(!c)return!1;if(pn[c.corp_subsector]===o.sector)return!0;const t=(G||[]).filter(i=>i.type==="regional_hq"&&i.is_active&&i.nation_id===o.nation_id);for(const i of t)if(pn[i.subsector]===o.sector)return!0;return!1}function En(){const o=document.getElementById("oc-list");let e=[...je];hi==="GOVERNMENT"?e=e.filter(s=>s.issuer_type==="GOVERNMENT"):hi==="PRIVATE"&&(e=e.filter(s=>s.issuer_type==="PRIVATE"));const t=new Set;c?.nation_id&&t.add(c.nation_id);for(const s of G||[])s.type==="regional_hq"&&s.is_active&&s.nation_id&&t.add(s.nation_id);const i=s=>t.has(s.nation_id)&&wi(s),n=(s,l)=>$i==="TIMELINE"?(s.timeline_ticks||0)-(l.timeline_ticks||0):$i==="BUDGET"?(l.budget_ceiling||0)-(s.budget_ceiling||0):0;if(e.sort((s,l)=>{const p=i(s)?1:0,f=i(l)?1:0;return p!==f?f-p:n(s,l)}),document.getElementById("oc-count").textContent=e.length+" AVAILABLE",e.length===0){o.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const a=I?.current_tick||0;let r="";for(const s of e){const l=s.issuer_type==="GOVERNMENT",p=l?"gov":"private",f=wi(s),d=f?"":" locked",v=kn(s.sector),m=Ri(s.sector),u=(s.timeline_ticks||0)>18?" warn":"",g=s.bidding_ends_tick?Math.max(0,s.bidding_ends_tick-a):"?",b=gi[s.nation_id]||"—",$=t.has(s.nation_id);r+=`
            <div class="oc-item${d}" data-contract-id="${s.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${x(s.name)}</span>
                    <span class="oc-item__type-badge ${p}">${l?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${p}">${x(s.issuer_name||"—")}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.7px;color:${$?"var(--teal)":"var(--text-dim)"};margin-left:8px;text-transform:uppercase;">${x(b)}${$?" · HQ":""}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${g} tick${g!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${ue(s.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${u}">${Pa(s.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${v}">${m}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${Et[s.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${ue(Et[s.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${f?"yes":"no"}">${f?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${f?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openContractDetail(contracts.find(x=>x.id==='${s.id}'))">VIEW</button>`:""}
                </div>
                ${s.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${x(s.description)}</div>`:""}
                ${s.modifiers&&s.modifiers.length>0?`<div style="display:flex;flex-wrap:wrap;gap:3px;padding:4px 0 0;">${wn(s.modifiers)}</div>`:""}
            </div>`}o.innerHTML=r,o.querySelectorAll(".oc-item:not(.locked)").forEach(s=>{s.addEventListener("click",()=>{const l=s.dataset.contractId,p=je.find(f=>f.id===l);p&&Cn(p)})})}let Je=null;function Cn(o){Je=o;const e=document.getElementById("cd-overlay"),t=o.issuer_type==="GOVERNMENT",i=t?"gov":"private",n=(N?.name||c.nation||"—").toUpperCase(),a=wi(o);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${x(n)}</span>
        <span class="cd-header__name">${x(o.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${i}">${x(o.issuer_name)}</span>
        <span class="cd-header__type-badge ${i}">${t?"GOV":"PRIVATE"}</span>
    `;const r=document.getElementById("cd-blueprint");o.blueprint_svg?(r.innerHTML=o.blueprint_svg,r.style.display=""):(r.innerHTML=cr(o),r.style.display="");const s=o.permits_required||[],l=o.required_equipment||o.equipment_required||{},p=Array.isArray(l)?l.map(B=>({key:B,qty:1})):Object.entries(l).map(([B,A])=>({key:B,qty:A})),f=o.required_materials||o.materials_estimated||{},v={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[o.sector]||o.spec_category||o.sector||"—";let m="var(--teal)";o.sector==="industrial"&&(m="var(--orange)"),o.sector==="mega_project"&&(m="var(--red)");let u=D(o.budget_ceiling||o.budget||0),g=(o.timeline_ticks||o.timeline_months||0)+" Months",b="";b+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${x(o.project_code||o.contract_number||"")}</span>
            </div>
            <div class="cd-issue__tags">
                ${o.project_type?`<span class="cd-tag teal">${x(o.project_type.toUpperCase())}</span>`:""}
                ${o.project_subtype?`<span class="cd-tag gold">${x(o.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,o.description&&(b+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${x(o.description)}</div>
            </div>`);const $=o.modifiers||[];if($.length>0){b+=`<div class="cd-items">
            <div class="cd-section-label">Building Modifiers</div>
            <div style="display:flex;flex-direction:column;gap:6px;">`;for(const B of $){const A=go[B];if(!A)continue;const H=A.reputation_bonus>0?"var(--green)":A.reputation_bonus<0?"var(--red)":"var(--text-dim)",j=A.cost_multiplier>1?"+"+Math.round((A.cost_multiplier-1)*100)+"% cost":A.cost_multiplier<1?Math.round((1-A.cost_multiplier)*100)+"% cheaper":"",V=A.reputation_bonus!==0?(A.reputation_bonus>0?"+":"")+A.reputation_bonus+" rep":"",ee=A.required_permits||[];b+=`<div style="padding:6px 10px;background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:600;font-size:0.78rem;color:var(--text-primary);">${A.icon||"📍"} ${x(A.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;">
                        ${j?`<span style="color:var(--amber);">${j}</span>`:""}
                        ${j&&V?" · ":""}
                        ${V?`<span style="color:${H};font-weight:700;">${V}</span>`:""}
                    </span>
                </div>
                <div style="font-size:0.65rem;color:var(--text-dim);margin-top:2px;">${x(A.description||"")}</div>
                ${ee.length>0?`<div style="font-size:0.6rem;color:var(--amber);margin-top:3px;font-family:var(--font-mono);">Requires permits: ${ee.map(qe=>x(qe.replace(/_/g," "))).join(", ")}</div>`:""}
            </div>`}b+="</div></div>"}b+='<div class="cd-details">',o.project_type&&(b+=Oe("Type",o.project_type)),o.project_subtype&&(b+=Oe("Sub-Type",o.project_subtype)),b+=Oe("Specialization",v,m),b+=Oe("Total Budget",u,"var(--green)"),b+=Oe("Timeline",g),b+=Oe("Nation",N?.name||c.nation||"—"),o.region&&(b+=Oe("Region",o.region)),b+="</div>",s.length>0&&(b+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${s.map(B=>{const A=B.status==="approved"?"approved":"required",H=B.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${A}">
                            <span class="cd-chip__icon">${H}</span>
                            <span class="cd-chip__label">${x(B.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),f.length>0&&(b+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${f.map(B=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${x(B.name)}</span>
                        <span class="cd-mat-row__qty">${x(String(B.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=b;const h=s.filter(B=>B.status==="approved").length,E=s.length-h,T=p.length,S=[];for(const B of p){const A=Io[B.key]||B.key,H=re.find(j=>j.equipment_key===A||j.equipment_key===B.key);H&&H.owned>=B.qty||S.push(B)}const w=S.length,C=o.required_materials||{},M=typeof C=="object"&&!Array.isArray(C)?Object.entries(C):[],k=[];for(const[B,A]of M){const H=X[B]||{},j=(H.LOW?.qty||0)+(H.STD?.qty||0)+(H.HIGH?.qty||0);j<A&&k.push({key:B,need:A,have:j})}const z=B=>B.replace(/_/g," ").replace(/\b\w/g,A=>A.toUpperCase());let q="";if(T>0)if(w===0)q+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>';else{const B=S.map(A=>z(A.key)).join(", ");q+=`<span class="cd-footer__badge bad" title="${x(B)}">${w} SHORT: ${x(B)}</span>`}if(M.length>0)if(k.length===0)q+='<span class="cd-footer__badge ok">ALL MATERIALS MET</span>';else{const B=k.map(A=>z(A.key)+" ("+A.have+"/"+A.need+")").join(", ");q+=`<span class="cd-footer__badge bad" title="${x(B)}">${k.length} MAT SHORT: ${x(B)}</span>`}s.length>0&&(E===0?q+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':q+=`<span class="cd-footer__badge warn">${E} PERMITS PENDING</span>`);const P=a,U=o.issuer_faction_id===c?.id,F=o.status==="bidding",oe=Et[o.id];document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${q}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${U?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${F?"":"disabled"} title="${F?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:oe?`<button class="cd-btn primary" onclick="retractBid('${o.id}')" style="background:#c55;border-color:#c55;"
                        title="Retract your bid ($1M penalty)">RETRACT BID</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${P?"":"disabled"}
                        title="${P?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,e.classList.add("open"),document.body.style.overflow="hidden"}function Xt(o){o&&o.target&&o.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",Je=null)}const Io={work_trucks:"trucks",concrete_mixers:"mixers",tower_cranes:"cranes",heavy_haulers:"haulers",pile_drivers:"piledrivers",asphalt_plants:"asphalt"},Ue=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],fn={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},mn={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let R=null;const Ua="get_contract_permit_requirements";async function Ha(o,e){if(!y||!o||!e)return[];try{const{data:t,error:i}=await y.rpc(Ua,{p_contract_id:o,p_faction_id:e});return i?(console.warn("[pm permits] failed to load permit requirements:",i.message),[]):Array.isArray(t)?t.filter(n=>n&&n.name).map(n=>({name:String(n.name),has_permit:n.has_permit===!0})):[]}catch(t){return console.warn("[pm permits] unexpected error loading permit requirements:",t),[]}}async function at(o){const e=J.find(A=>A.id===o);if(!e)return;const t=Array.isArray(e.contract_bids)?e.contract_bids[0]:e.contract_bids,i=I?.current_tick||0,n=e.awarded_at_tick||i,a=e.timeline_ticks||8,r=Math.max(0,i-n),s=Math.min(100,r/a*100);let l=Math.min(Ue.length-1,Math.floor(s/(100/Ue.length)));const p=Math.round(s%(100/Ue.length)/(100/Ue.length)*100),f=e.required_materials||{},d=t?.material_grades||{};let v=[];try{const{data:A}=await y.from("project_material_allocations").select("material_key, quality_tier, quantity, consumed").eq("contract_id",e.id);v=A||[]}catch{}const m={};for(const A of v)m[A.material_key]||(m[A.material_key]={totalAllocated:0,totalConsumed:0,tiers:{}}),m[A.material_key].totalAllocated+=A.quantity,m[A.material_key].totalConsumed+=A.consumed,m[A.material_key].tiers[A.quality_tier]={qty:A.quantity,consumed:A.consumed};const u=Object.entries(f).map(([A,H])=>{const j=d[A]||"STD",V=m[A]||{totalAllocated:0,totalConsumed:0,tiers:{}};return{key:A,name:A.replace(/_/g," ").replace(/\b\w/g,ee=>ee.toUpperCase()),grade:j,required:Number(H),allocated:V.totalAllocated,consumed:V.totalConsumed,tiers:V.tiers,warehouseStock:X[A]||{}}}),g=e.required_equipment||{},b=e.equipment_condition||{},h=(Array.isArray(g)?g.map(A=>[A,1]):Object.entries(g)).map(([A,H])=>{const j=Io[A]||A,V=re.find(pe=>pe.equipment_key===j||pe.equipment_key===A),qe=(V?.assigned_projects||[]).find(pe=>pe.contract_id===e.id),Ho=qe?qe.units:0;return{key:A,name:A.replace(/_/g," ").replace(/\b\w/g,pe=>pe.toUpperCase()),required:Number(H)||1,ownedTotal:V?.owned||0,deployed:V?.deployed||0,available:Math.max(0,(V?.owned||0)-(V?.deployed||0)),assignedToProject:Ho,condition:b[A]??(V?.condition||100)}}),E=e.budget_ceiling||0,T=t?.estimated_cost||0,S=Math.round(T*Math.min(1,r/a)),w=t?.estimated_quality||65,C=w>=75?"EXCELLENT":w>=50?"FAIR":w>=25?"POOR":"BAD",M=e.required_workforce||{},k=e.workers_assigned||{},z=(M.general||0)+(M.skilled||0)+(M.innovative||0),q=(k.general||0)+(k.skilled||0)+(k.innovative||0),P=t?.labor_count||z,U=Number(c?.corp_general_workforce??0),F=Number(c?.corp_skilled_workforce??0),oe=Number(c?.corp_innovative_workforce??0),B=await Ha(e.id,c?.id);R={project:e,bid:t,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:i,awardedTick:n,totalTicks:a,ticksElapsed:r,phaseIdx:l,phaseProgress:p,materials:u,equipment:h,permitRequirements:B,budget:E,estCost:T,spent:S,quality:w,qualityLabel:C,laborCount:P,wfNeeded:z,wfAssigned:q,reqWf:M,assignedWf:k,corpGeneral:U,corpSkilled:F,corpInnovative:oe,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",Tn(e.id).then(()=>et()),et()}let Q=!1;async function Ga(o,e,t){if(!(Q||!R||!c)){Q=!0;try{const{data:i,error:n}=await y.rpc("allocate_material_to_project",{p_contract_id:R.project.id,p_faction_id:c.id,p_material_key:o,p_quality_tier:e,p_quantity:t});if(n){alert("Allocation failed: "+n.message);return}if(i&&!i.success){alert(i.error||"Allocation failed");return}await Li(),await at(R.project.id)}catch(i){alert("Allocation error: "+i.message)}finally{Q=!1}}}async function Va(o,e,t){if(!(Q||!R||!c)){Q=!0;try{const{data:i,error:n}=await y.rpc("deallocate_material_from_project",{p_contract_id:R.project.id,p_faction_id:c.id,p_material_key:o,p_quality_tier:e,p_quantity:t});if(n){alert("Return failed: "+n.message);return}if(i&&!i.success){alert(i.error||"Return failed");return}await Li(),await at(R.project.id)}catch(i){alert("Return error: "+i.message)}finally{Q=!1}}}async function Wa(o,e){if(!(Q||!R||!c)){Q=!0;try{const t=R.project,i=t.workers_assigned||{},n=Number(i[o]||0),a=Number((t.required_workforce||{})[o]||0),r=Number(c?.["corp_"+o+"_workforce"]??0);let s=0;for(const m of J||[])m.id!==t.id&&(s+=Number((m.workers_assigned||{})[o]||0));const l=Math.max(0,r-s-n),p=Math.min(e,a-n,l);if(p<=0){alert(l<=0?"No "+o+" workers available in pool":"Already fully staffed for "+o);return}const f={...i,[o]:n+p},{error:d}=await y.from("construction_contracts").update({workers_assigned:f}).eq("id",t.id);if(d){alert("Assign failed: "+d.message);return}const v=J.find(m=>m.id===t.id);v&&(v.workers_assigned=f),await at(t.id)}catch(t){alert("Assign error: "+t.message)}finally{Q=!1}}}async function Ya(o,e){if(!(Q||!R||!c)){Q=!0;try{const t=R.project,i=t.workers_assigned||{},n=Number(i[o]||0),a=Math.min(e,n);if(a<=0){alert("No "+o+" assigned");return}const r={...i,[o]:n-a},{error:s}=await y.from("construction_contracts").update({workers_assigned:r}).eq("id",t.id);if(s){alert("Unassign failed: "+s.message);return}const l=J.find(p=>p.id===t.id);l&&(l.workers_assigned=r),await at(t.id)}catch(t){alert("Unassign error: "+t.message)}finally{Q=!1}}}async function Qa(o,e){if(!(Q||!R||!c)){Q=!0;try{const t=Io[o]||o,i=re.find(p=>p.equipment_key===t||p.equipment_key===o);if(!i){alert("Equipment not found in inventory.");return}const n=Math.max(0,(i.owned||0)-(i.deployed||0));if(n<e){alert("Not enough available "+o+" ("+n+" available).");return}const a=(i.deployed||0)+e,r=[...i.assigned_projects||[]],s=r.find(p=>p.contract_id===R.project.id);s?s.units+=e:r.push({contract_id:R.project.id,contract_name:R.project.name,units:e});const{error:l}=await y.from("corp_equipment").update({deployed:a,assigned_projects:r}).eq("faction_id",c.id).eq("equipment_key",i.equipment_key);if(l){alert("Deploy failed: "+l.message);return}await Wi(),await at(R.project.id)}catch(t){alert("Deploy error: "+t.message)}finally{Q=!1}}}async function Ka(o){if(!(Q||!R||!c)){Q=!0;try{const e=Io[o]||o,t=re.find(l=>l.equipment_key===e||l.equipment_key===o);if(!t){alert("Equipment not found.");return}const i=[...t.assigned_projects||[]],n=i.findIndex(l=>l.contract_id===R.project.id);if(n===-1){alert("Equipment not deployed to this project.");return}const a=i[n].units;i.splice(n,1);const r=Math.max(0,(t.deployed||0)-a),{error:s}=await y.from("corp_equipment").update({deployed:r,assigned_projects:i}).eq("faction_id",c.id).eq("equipment_key",t.equipment_key);if(s){alert("Undeploy failed: "+s.message);return}await Wi(),await at(R.project.id)}catch(e){alert("Undeploy error: "+e.message)}finally{Q=!1}}}function Ja(o){o&&o.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",R=null)}function Xa(o){R&&(R.tab=o,R.expandedEvent=-1,R.selectedResponse=null,et())}function Za(o){R&&(R.expandedEvent=R.expandedEvent===o?-1:o,R.selectedResponse=null,et())}function er(o){R&&(R.selectedResponse=R.selectedResponse===o?null:o,et())}function et(){if(!R)return;const o=R,e=o.project,t=e.issuer_type==="GOVERNMENT",i=Ri(e.sector),n=c?.nation||"Nation",a=o.awardedTick+o.totalTicks,r=Math.max(0,a-o.currentTick),s=o.currentTick>a,l=o.budget>0?Math.round(o.spent/o.budget*100):0,p=l>85?"var(--red)":l>60?"var(--amber)":"var(--teal)",f=o.budget-o.spent,d=o.events.filter(b=>b.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${x(n.toUpperCase())}</span>
                <span class="pm-hdr__name">${x(e.name)}</span>
                <span style="color:var(--text-dim);font-size:12px">—</span>
                <span class="pm-hdr__issuer">${x(e.issuer_name||"—")}</span>
                <span class="pm-hdr__type">${t?"GOV":"PVT"}</span>
            </div>
            <button class="pm-hdr__close" onclick="closeProjectModal()">×</button>
        </div>
        <div class="pm-hdr__row2">
            <span class="pm-hdr__id">${x(e.template_key||e.id)}</span>
            <span class="pm-hdr__badge pm-hdr__badge--spec">${x(i.toUpperCase())}</span>
            <span class="pm-hdr__badge pm-hdr__badge--sub">${x((e.sector||"").replace(/_/g," ").toUpperCase())}</span>
        </div>
    `;let v='<div class="pm-phase__bar">';for(let b=0;b<Ue.length;b++){const $=b<o.phaseIdx,h=b===o.phaseIdx;v+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${$?"done":h?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${$?"done":h?"active":""}">${Ue[b]}</span>
        </div>`}v+="</div>",v+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${Ue[o.phaseIdx]} — ${o.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${s?"var(--red)":"var(--text-secondary)"}">Tick ${o.ticksElapsed} / ${o.totalTicks}${s?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=v;const m=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:d},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=m.map(b=>`<button class="pm-tab${o.tab===b.id?" active":""}" onclick="pmSetTab('${b.id}')">
            ${b.label}${b.badge>0?`<span class="pm-tab__badge">${b.badge}</span>`:""}
        </button>`).join("");let u="";o.tab==="overview"?u=tr(o,e,p,l,f,r,s):o.tab==="events"?u=or(o):o.tab==="materials"?u=ir(o):o.tab==="equipment"&&(u=nr(o)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${u}</div>`;let g="";d>0&&(g+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${d} EVENT${d>1?"S":""} REQUIRES RESPONSE</span>`),g+=`<span class="pm-ftr__badge" style="color:${o.quality>=75?"var(--green)":o.quality>=50?"var(--amber)":o.quality>=25?"var(--orange)":"var(--red)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${o.quality}/100 — ${o.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${g}</div>
        <div style="display:flex;gap:8px;">
            ${o.effectiveProgress>=o.totalTicks?`<button data-deliver-id="${R.project.id}" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#000;background:var(--green);border:none;cursor:pointer;" onclick="closeProjectModal();deliverProject('${R.project.id}','${(R.project.name||"").replace(/'/g,"\\'")}',${R.bid?.bid_price||0},${R.bid?.estimated_cost||0},${R.bid?.estimated_quality||65})">DELIVER</button>`:""}
            <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
        </div>
    `}function tr(o,e,t,i,n,a,r){const s=He(o.awardedTick+o.totalTicks);He(o.awardedTick+o.totalTicks);const l=He(o.awardedTick),p=[{label:"Budget",value:ue(o.budget),sub:`${i}% spent`,color:t},{label:"Spent",value:ue(o.spent),color:"var(--red)"},{label:"Remaining",value:ue(n),color:"var(--green)"},{label:"Quality",value:`${o.quality}/100`,sub:o.qualityLabel,color:o.quality>=75?"var(--green)":o.quality>=50?"var(--amber)":o.quality>=25?"var(--orange)":"var(--red)"},{label:"Workforce",value:`${o.laborCount}/${o.wfNeeded}`,sub:`Bid: ${o.laborCount}`,color:o.laborCount<o.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${a} ticks`,sub:r?"OVERDUE":`Deadline: ${s}`,color:r?"var(--red)":"var(--text-bright)"}];let f="";f+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${x(e.description||e.name)}</div>
    </div></div>`,f+='<div class="pm-metrics">';for(const b of p)f+=`<div class="pm-metric">
            <div class="pm-metric__label">${b.label}</div>
            <div class="pm-metric__value" style="color:${b.color}">${b.value}</div>
            ${b.sub?`<div class="pm-metric__sub">${x(b.sub)}</div>`:""}
        </div>`;f+="</div>",f+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${l}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${r?"var(--red)":"var(--text-bright)"};font-weight:700">${s}</span></span>
        </div>
    </div></div>`;const d=e.modifiers||[];d.length>0&&(f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Building Modifiers</div>',f+='<div style="display:flex;flex-wrap:wrap;gap:4px;">',f+=wn(d),f+="</div></div></div>");const v=Array.isArray(o.permitRequirements)?o.permitRequirements:[];if(v.length>0){f+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const b of v){const $=b.has_permit===!0,h=$?"HAS PERMIT":"NEEDS TO GET";f+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:${$?"var(--green)":"var(--amber)"}">${$?"✓":"!"}</span>
                    <span class="pm-permit__name">${x(b.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:${$?"var(--green)":"var(--amber)"}">${h}</span>
            </div>`}f+="</div></div>"}f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Workforce Assignment</div>';const m=[{key:"general",label:"General Workers",corpAvail:o.corpGeneral,color:"var(--text-primary)"},{key:"skilled",label:"Skilled Workers",corpAvail:o.corpSkilled,color:"var(--blue)"},{key:"innovative",label:"Innovative Workers",corpAvail:o.corpInnovative,color:"var(--purple)"}];for(const b of m){const $=Number(o.reqWf[b.key]||0);if($===0)continue;const h=Number(o.assignedWf[b.key]||0),T=h>=$?"var(--green)":h>0?"var(--amber)":"var(--red)",S=b.corpAvail>0&&h<$,w=Math.min(b.corpAvail,$-h),C=h>0;f+='<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.72rem;">',f+="<div>",f+=`<span style="color:${b.color};font-weight:600;">${b.label}</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Required: <strong>${$}</strong></span>`,f+=`<span style="color:${T};margin-left:8px;font-weight:700;">${h} assigned</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Pool: ${b.corpAvail}</span>`,f+="</div>",f+='<div style="display:flex;gap:4px;">',S&&(f+=`<button onclick="pmAssignWorkers('${b.key}',${w})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Assign ${w}</button>`),C&&(f+=`<button onclick="pmUnassignWorkers('${b.key}',${h})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Remove ${h}</button>`),f+="</div></div>"}const u=Number(o.reqWf.general||0)+Number(o.reqWf.skilled||0)+Number(o.reqWf.innovative||0),g=Number(o.assignedWf.general||0)+Number(o.assignedWf.skilled||0)+Number(o.assignedWf.innovative||0);return u>0&&g<u&&(f+='<div style="font-size:0.62rem;color:var(--red);margin-top:6px;font-family:var(--font-mono);">⚠ Project will STALL until workforce is fully assigned</div>'),f+="</div></div>",f}function or(o){if(o.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let e="";for(let t=0;t<o.events.length;t++){const i=o.events[t],n=o.expandedEvent===t,a=i.status==="ACTIVE",r=fn[i.type]||fn.WEATHER,s=mn[i.severity]||mn.LOW;if(e+=`<div class="pm-evt ${a?"pm-evt--active":"pm-evt--resolved"}" style="${a?`border-left-color:${r.color}`:""}">`,e+=`<div class="pm-evt__header" onclick="pmToggleEvent(${t})" style="${n?`background:${r.bg}`:""}">`,e+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${r.color};background:${r.bg};border:1px solid ${r.border}">${i.type}</span>
            <span class="pm-evt__sev-badge" style="color:${s}">${i.severity}</span>
            <span class="pm-evt__status" style="color:${a?"var(--red)":"var(--text-dim)"};font-weight:${a?"700":"400"}">${a?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,e+=`<div class="pm-evt__title">${x(i.title)}</div>`,e+=`<div class="pm-evt__meta">Tick ${i.tick} · ${x(i.id||"")}</div>`,n){if(e+='<div class="pm-evt__body">',e+=`<div class="pm-evt__desc">${x(i.desc)}</div>`,i.impact&&(e+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${x(i.impact)}</span>
                </div>`),a&&i.responses&&i.responses.length>0){e+='<div class="pm-evt__resp-title">Response Options</div>';for(let l=0;l<i.responses.length;l++){const p=i.responses[l],f=o.selectedResponse===l,v={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[p.tag]||"var(--text-secondary)";e+=`<div class="pm-resp${f?" selected":""}" style="${f?`border-color:${v}`:""}" onclick="event.stopPropagation();pmSelectResponse(${l})">`,e+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${x(p.label)}</span>
                            <span class="pm-resp__tag" style="color:${v};background:${v}12;border:1px solid ${v}25">${p.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${p.delay>0?"var(--orange)":"var(--green)"}">
                            ${p.delay>0?`+${p.delay} tick${p.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,e+=`<div class="pm-resp__detail">${x(p.detail)}</div>`,e+='<div class="pm-resp__costs">',p.cost&&(e+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${ue(p.cost)}</span>`),p.qualityImpact&&p.qualityImpact!==0&&(e+=`<span class="pm-resp__cost" style="color:${p.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${p.qualityImpact>0?"+":""}${p.qualityImpact}</span>`),!p.cost&&(!p.qualityImpact||p.qualityImpact===0)&&(e+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),e+="</div>",f&&(e+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${v}" onclick="event.stopPropagation();confirmEventResponse('${i.id}','${p.key}')">CONFIRM</button>
                        </div>`),e+="</div>"}}!a&&i.resolution&&(e+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${x(i.resolution)}</div>
                </div>`),e+="</div>"}e+="</div></div>"}return e}function ir(o){if(o.materials.length===0)return'<div class="pm-evt-empty">No materials required for this project.</div>';let e='<div class="pm-tab-header">Project Materials</div>';for(const t of o.materials){const i=t.required>0?Math.round(t.allocated/t.required*100):0;t.allocated>0&&Math.round(t.consumed/t.allocated*100);const n=t.allocated>=t.required,a=n?"var(--green)":t.allocated>0?"var(--amber)":"var(--red)",r=n?"FULLY ALLOCATED":t.allocated>0?"PARTIAL":"NONE ALLOCATED";e+='<div class="pm-mat" style="margin-bottom:14px;">',e+=`<div class="pm-mat__row1">
            <div class="pm-mat__left">
                <span class="pm-mat__name">${x(t.name)}</span>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:${a};">${t.allocated} / ${t.required} allocated · ${r}</span>
        </div>`,e+=`<div class="pm-mat__bar-row">
            <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${i}%;background:${a};"></div></div>
            <span class="pm-mat__pct">${t.consumed} consumed</span>
        </div>`;const s=["STD","LOW","HIGH"],l=t.required-t.allocated;for(const p of s){const f=t.warehouseStock[p]||{qty:0},d=t.tiers[p]||{qty:0,consumed:0},v=d.qty-d.consumed;if(f.qty===0&&d.qty===0)continue;const m=p==="HIGH"?"var(--green)":p==="LOW"?"var(--orange)":"var(--text-muted)",u=p==="HIGH"?"HIGH":p==="LOW"?"LOW":"STD";if(e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.03);font-size:0.7rem;">',e+='<div style="display:flex;align-items:center;gap:6px;">',e+=`<span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${m};width:32px;">${u}</span>`,e+=`<span style="color:var(--text-dim);">Warehouse: <strong style="color:var(--text-primary);">${f.qty}</strong></span>`,d.qty>0&&(e+=`<span style="color:var(--text-dim);margin-left:8px;">Allocated: <strong style="color:var(--text-primary);">${d.qty}</strong></span>`),e+="</div>",e+='<div style="display:flex;gap:4px;">',f.qty>0&&l>0){const g=Math.min(f.qty,l);e+=`<button class="pm-alloc-btn" onclick="pmAllocateMaterial('${t.key}','${p}',${g})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Allocate ${g}</button>`}v>0&&(e+=`<button class="pm-alloc-btn" onclick="pmDeallocateMaterial('${t.key}','${p}',${v})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Return ${v}</button>`),e+="</div></div>"}e+="</div>"}return e}function nr(o){if(o.equipment.length===0)return'<div class="pm-evt-empty">No equipment required for this project.</div>';let e='<div class="pm-tab-header">Project Equipment</div>';for(const t of o.equipment){const i=t.condition>=75?"var(--green)":t.condition>=50?"var(--amber)":t.condition>=25?"var(--orange)":"var(--red)",n=t.assignedToProject>=t.required,a=t.assignedToProject>0&&t.assignedToProject<t.required,r=n?"var(--green)":a||t.ownedTotal>0?"var(--amber)":"var(--red)",s=n?`${t.assignedToProject}/${t.required} DEPLOYED`:a?`${t.assignedToProject}/${t.required} PARTIAL`:t.ownedTotal>0?"NOT DEPLOYED":"NOT OWNED";e+=`<div class="pm-eq" style="margin-bottom:12px;">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${x(t.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${r};margin-left:8px;">${s}</span>
                </div>
            </div>`,t.assignedToProject>0&&(e+=`<div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${t.condition}%;background:${i}"></div></div>
                <span class="pm-eq__cond-val" style="color:${i}">${t.condition}%</span>
            </div>`);const l=Math.min(t.available,t.required-t.assignedToProject);e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:0.7rem;">',e+=`<span style="color:var(--text-dim);">Required: <strong style="color:${n?"var(--green)":"var(--red)"}">${t.required}</strong>`,e+=` · Owned: <strong style="color:var(--text-primary);">${t.ownedTotal}</strong>`,e+=` · Available: <strong style="color:var(--text-primary);">${t.available}</strong></span>`,e+='<div style="display:flex;gap:4px;">',l>0&&(e+=`<button onclick="pmDeployEquipment('${t.key}',${l})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Deploy ${l}</button>`),t.assignedToProject>0&&(e+=`<button onclick="pmUndeployEquipment('${t.key}')" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Undeploy</button>`),e+="</div></div>",e+="</div>"}return e}function He(o){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][o%12]}, ${2e3+Math.floor(o/12)}`}async function ar(o,e){if(!c||!I)return;const t=prompt(`REQUEST CONSTRUCTION INSURANCE
`+"─".repeat(35)+`

Describe what this policy should cover:

e.g., "Full coverage for weather delays, material damage, and labor disputes during construction. Should cover cost overruns up to 20% of budget."

Insurance corps will see this in their Deal Flow.`);if(t===null)return;const i=t.trim()||"Construction Insurance",n=I.current_tick||0,{error:a}=await y.from("finance_loan_requests").insert({requesting_faction_id:c.id,nation_id:c.nation_id,request_type:"insurance",insured_contract_id:o,amount:e,term_months:0,purpose:i,status:"open",created_tick:n,expires_tick:n+12});if(a){a.message.includes("duplicate")||a.message.includes("unique")?alert("Insurance already requested for this project."):alert("Failed to request insurance: "+a.message);return}alert("Insurance request posted to Deal Flow. Insurance corporations can now offer coverage."),await Vt()}window.requestInsurance=ar;let Wo=!1;const Yo=new Set;function rr(o,e){const t=o?.template_key;if(!t)return null;if(t==="fuel_depot"||t==="dry_dock"){const i=o.project_subtype||"Basic",n=mo.find(a=>a.type===t&&a.name===o.name)||mo.find(a=>a.type===t&&a.style===i)||mo.find(a=>a.type===t);return{type:t,style:i,capacity:i==="Modern"?500:250,maintenance:n?.maint||Math.round(e*.001)}}return t==="custom_building"?{type:"office",style:o.project_subtype||"Basic",capacity:500,maintenance:Math.round(e*.001)}:null}function un(o,e){document.querySelectorAll(`[data-deliver-id="${o}"]`).forEach(t=>{t.disabled=e,t.style.opacity=e?"0.55":"",t.style.cursor=e?"not-allowed":"pointer",e&&(t.textContent="DELIVERING…")})}async function sr(o,e,t,i,n){if(!(Wo||!c||!I)&&!Yo.has(o)&&confirm('Deliver "'+e+`"?

An inspection will be conducted and payment issued based on quality.`)){Wo=!0,un(o,!0);try{const a=I.current_tick||0,r=n||65,s=Math.floor(Math.random()*21)-10,l=Math.max(10,Math.min(100,r+s)),p=l>=80?"DISTINCTION":l>=60?"PASS":l>=40?"CONDITIONAL":"FAIL",f=l>=80?Math.round(t*.1):0,d=p==="FAIL"?Math.round(t*.3):p==="CONDITIONAL"?Math.round(t*.1):0,v=Math.max(0,t+f-d),m=v-i,u=p==="DISTINCTION"?3:p==="PASS"?1:p==="CONDITIONAL"?-1:-3,{data:g}=await y.from("construction_contracts").select("awarded_at_tick, timeline_ticks, stalled_ticks, issuer_faction_id, nation_id, status, name, template_key, project_subtype, issuer_type, issuer_name").eq("id",o).single();if(!g){alert("Contract not found.");return}if(g.status==="completed"||g.status==="delivered"){Yo.add(o),alert("This project has already been delivered."),await Vt();return}const b=g.timeline_ticks||8,$=Math.max(0,a-(g.awarded_at_tick||a)),h=$<=b,{error:E}=await y.from("construction_deliveries").insert({contract_id:o,faction_id:c.id,nation_id:g.nation_id,result:p,quality_score:l,rep_change:u,inspection:{base_quality:r,variance:s,final:l},contract_value:t,quality_bonus:f,penalties:d,payment_received:v,total_cost:i,net_profit:m,timeline_expected:b,timeline_actual:$,on_time:h,delivered_at_tick:a});if(E){alert("Delivery failed: "+E.message);return}const{error:T}=await y.from("construction_contracts").update({status:"completed",completed_at_tick:a}).eq("id",o);if(T){alert("Failed to mark project completed: "+T.message);return}if(v>0){const{data:z}=await y.from("factions").select("corp_cash_reserves").eq("id",c.id).single();z&&await y.from("factions").update({corp_cash_reserves:Number(z.corp_cash_reserves||0)+v}).eq("id",c.id)}if(u!==0){const{data:z}=await y.from("factions").select("corp_reputation").eq("id",c.id).single();z&&await y.from("factions").update({corp_reputation:Math.max(0,Math.min(100,Number(z.corp_reputation||50)+u))}).eq("id",c.id)}if(g.issuer_faction_id)try{const z=rr(g,t);z&&await y.from("corp_properties").insert({faction_id:g.issuer_faction_id,nation_id:g.nation_id,name:g.name||e,type:z.type,style:z.style,capacity:z.capacity,purchase_price:t,monthly_maintenance:z.maintenance,condition:Math.max(25,Math.min(100,l)),purchased_at_tick:a,built_via_contract_id:o,is_active:!0})}catch(z){console.warn("[deliverProject] Failed to register property for issuer:",z?.message||z)}const S=g.issuer_name||"the client",{data:w}=await y.from("nations").select("name").eq("id",g.nation_id).single(),C=w?.name||"Unknown",M=c.faction_name+" has completed the "+e+" project for "+S+" in "+C+".",k=new Set([g.nation_id]);c.nation_id&&c.nation_id!==g.nation_id&&k.add(c.nation_id);try{await y.from("event_log").insert([...k].map(z=>({nation_id:z,event_name:e+" — Project Completed",category:"corporate",description_chosen:M,fired_at_tick:a})))}catch(z){console.warn("[Deliver] Event log failed:",z.message)}alert(`Project delivered!

Result: `+p+`
Quality: `+l+`/100
Payment: `+_(v)+(f>0?" (includes +"+_(f)+" quality bonus)":"")+(d>0?`
Penalties: -`+_(d):"")+`
Reputation: `+(u>0?"+":"")+u+`
Net Profit: `+(m>=0?"+":"")+_(m)),Yo.add(o),await Vt(),await qn()}catch(a){alert("Delivery failed: "+(a.message||a)),un(o,!1)}finally{Wo=!1}}}window.deliverProject=sr;window.openProjectModal=at;window.closeProjectModal=Ja;window.pmSetTab=Xa;window.pmToggleEvent=Za;window.pmSelectResponse=er;window.pmAllocateMaterial=Ga;window.pmDeallocateMaterial=Va;window.pmDeployEquipment=Qa;window.pmUndeployEquipment=Ka;window.pmAssignWorkers=Wa;window.pmUnassignWorkers=Ya;async function Tn(o){if(!R)return;const{data:e,error:t}=await y.from("construction_events").select("*").eq("contract_id",o).order("fired_at_tick",{ascending:!1});t?(console.warn("Failed to load project events:",t.message),R.events=[]):R.events=(e||[]).map(i=>({id:i.id,type:i.type,severity:i.severity,tick:i.fired_at_tick,title:i.title,desc:i.description,impact:i.impact,status:i.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:i.resolution,responses:i.responses||[]})),et()}let Qo=!1;async function lr(o,e){if(!(Qo||!R)){Qo=!0;try{const{data:t,error:i}=await y.rpc("resolve_construction_event",{p_event_id:o,p_response_key:e});if(i){console.error("Failed to resolve event:",i.message),alert("Failed to submit response: "+i.message);return}const n=typeof t=="string"?JSON.parse(t):t;if(n?.error){alert("Error: "+n.error);return}await Tn(R.project.id),await Vt(),n?.quality_applied&&n.quality_applied!==0&&(R.quality=Math.max(0,Math.min(100,R.quality+n.quality_applied)),R.qualityLabel=R.quality>=75?"EXCELLENT":R.quality>=50?"FAIR":R.quality>=25?"POOR":"BAD"),et()}finally{Qo=!1}}}window.confirmEventResponse=lr;function Oe(o,e,t){const i=t?` style="color:${t}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${x(o)}</span>
        <span class="cd-detail-row__value"${i}>${x(e)}</span>
    </div>`}function cr(o){const e={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},t=o.drawing_number||o.contract_number+"-A1",i=I?.current_date||"",n=i?i.replace(/,\s*/," "):"",a=o.spec_category==="Heavy Infrastructure",r=o.spec_category==="Megaproject";let s=x(o.project_subtype||o.project_type||"STRUCTURE"),l=a?"80.0m":r?"200.0m":"60.0m",p=a?"40.0m":r?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${e.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(f,d)=>`<line x1="${d*20}" y1="0" x2="${d*20}" y2="200" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(f,d)=>`<line x1="0" y1="${d*20}" x2="680" y2="${d*20}" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}

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
        <text x="540" y="175" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${x(t)}</text>
        <text x="500" y="185" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">SCALE</text>
        <text x="540" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">1:200</text>
        <text x="610" y="175" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">REV</text>
        <text x="630" y="175" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">01</text>
        <text x="610" y="185" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">DATE</text>
        <text x="630" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${x(n)}</text>

        <!-- North arrow -->
        <g transform="translate(470,172)">
            <line x1="0" y1="12" x2="0" y2="0" stroke="${e.accent}" stroke-width="0.8"/>
            <polygon points="-3,4 0,0 3,4" fill="${e.accent}"/>
            <text x="0" y="-3" text-anchor="middle" font-size="5" fill="${e.text}" font-family="var(--font-mono)">N</text>
        </g>
    </svg>`}async function Ae(){if(!c||!c.nation_id)return;const{data:o,error:e}=await y.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(e)console.warn("Failed to load contracts:",e.message),je=[];else{const n=Number(c.corp_reputation??0);je=(o||[]).filter(a=>n>=(a.min_reputation||0))}const i=[...new Set(je.map(n=>n.nation_id).filter(Boolean))].filter(n=>!gi[n]);if(i.length>0){const{data:n}=await y.from("nations").select("id, name").in("id",i);for(const a of n||[])gi[a.id]=a.name}if(Et={},c&&je.length>0){const n=je.map(r=>r.id),{data:a}=await y.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",c.id).in("contract_id",n);for(const r of a||[])Et[r.contract_id]=r}En()}function dr(){const o=document.getElementById("ap-list"),e=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=J.length+" ACTIVE",J.length===0){o.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,e.style.display="none";return}const t=I?.current_tick||0;let i=0,n=0,a="";for(const r of J){const s=r.issuer_type==="GOVERNMENT",l=s?"gov":"private",p=Array.isArray(r.contract_bids)?r.contract_bids[0]:r.contract_bids,f=p?.bid_price||0,d=p?.estimated_cost||0,v=p?.estimated_quality||0,m=r.budget_ceiling||0,u=r.awarded_at_tick||t,g=r.stalled_ticks||0,b=Math.max(0,t-u),$=Math.max(0,b-g),h=r.timeline_ticks||8,E=Math.max(0,h-$),T=Math.min(100,Math.round($/h*100)),S=$>h,w=g>0;let C="";if(w){const k=r.required_workforce||{},z=r.workers_assigned||{},q=[];(Number(z.general)||0)<(Number(k.general)||0)&&q.push("General: "+(Number(z.general)||0)+"/"+(Number(k.general)||0)),(Number(z.skilled)||0)<(Number(k.skilled)||0)&&q.push("Skilled: "+(Number(z.skilled)||0)+"/"+(Number(k.skilled)||0)),(Number(z.innovative)||0)<(Number(k.innovative)||0)&&q.push("Innovative: "+(Number(z.innovative)||0)+"/"+(Number(k.innovative)||0)),q.length>0?C="Workers needed — "+q.join(", "):C="Materials needed — allocate from warehouse"}kn(r.sector);const M=Ri(r.sector);i+=m,n+=f,a+=`<div class="ap-item" onclick="openProjectModal('${r.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${x(r.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${x(r.issuer_name||"—")} · ${M}</div>
                </div>
                <span class="oc-item__type-badge ${l}">${s?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS${w?' <span style="color:var(--orange);font-weight:700;font-size:7px;">⚠ STALLED ('+g+" ticks) — "+x(C)+"</span>":""}</span>
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
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${v>=70?"var(--green)":v>=40?"var(--teal)":"var(--orange)"}">${v}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${S?"var(--red)":"var(--text-bright)"}">${E} ticks</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">INSURANCE</div>
                    ${r._hasInsurance?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--green);">INSURED</div>':r._insurancePending?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--orange);">PENDING</div>':`<div class="ap-detail-cell__value" style="font-size:8px;cursor:pointer;color:#aa7a5a;font-weight:700;text-decoration:underline;" onclick="event.stopPropagation();requestInsurance('${r.id}',${m})">INSURE</div>`}
                </div>
            </div>
            ${$>=h?`<div style="padding:6px 10px;border-top:1px solid var(--border-0);">
                <button data-deliver-id="${r.id}" onclick="event.stopPropagation();deliverProject('${r.id}','${x(r.name).replace(/'/g,"\\'")}',${f},${d},${v})" style="width:100%;padding:8px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#000;background:var(--green);border:none;cursor:pointer;">DELIVER PROJECT</button>
            </div>`:""}
        </div>`}o.innerHTML=a,e.style.display=J.length>0?"":"none",J.length>0&&(document.getElementById("ap-total-crew").textContent=J.length,document.getElementById("ap-total-budget").textContent=ue(i),document.getElementById("ap-total-spent").textContent=ue(n))}async function Vt(){if(!c)return;const{data:o,error:e}=await y.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",c.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",c.id).order("awarded_at_tick",{ascending:!0});if(e?(console.warn("Failed to load active projects:",e.message),J=[]):J=o||[],J.length>0){const t=J.map(s=>s.id),{data:i}=await y.from("finance_loan_requests").select("insured_contract_id, status").eq("request_type","insurance").in("insured_contract_id",t),{data:n}=await y.from("finance_active_loans").select("request_id, finance_loan_requests!inner(insured_contract_id)").in("status",["current"]).eq("finance_loan_requests.request_type","insurance"),a=new Set((n||[]).map(s=>s.finance_loan_requests?.insured_contract_id).filter(Boolean)),r=new Set((i||[]).filter(s=>s.status==="open").map(s=>s.insured_contract_id));for(const s of J)s._hasInsurance=a.has(s.id),s._insurancePending=r.has(s.id)}dr()}const No=3e4;function Ao(){let o=0,e=0;for(const t of jt)for(const i of Ni){const n=X[t.key]?.[i];n&&(o+=n.qty,e+=n.value)}return{totalUnits:o,totalValue:e}}function qi(){const o=document.getElementById("wh-list"),{totalUnits:e,totalValue:t}=Ao();document.getElementById("wh-count").textContent=e.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=D(t);const i=Math.round(e/No*100),n=document.getElementById("wh-capacity");n.textContent=i+"%",n.style.color=i>80?"var(--red)":i>50?"var(--orange)":"var(--green)";let a="";for(let r=0;r<jt.length;r++){const s=jt[r],l=xi===r,p=X[s.key]?.LOW||{qty:0,value:0},f=X[s.key]?.STD||{qty:0,value:0},d=X[s.key]?.HIGH||{qty:0,value:0},v=p.qty+f.qty+d.qty,m=p.value+f.value+d.value,u=v===0,g=_e(s.key,"LOW",N),b=_e(s.key,"STD",N),$=_e(s.key,"HIGH",N),h=p.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",E=f.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",T=$.available?d.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(a+='<div class="wh-row">',a+=`<div class="wh-row__collapsed${l?" expanded":""}" onclick="toggleWhRow(${r})">
            <span class="wh-row__arrow">${l?"▾":"▸"}</span>
            <span class="wh-row__name${u?" empty":""}">${x(s.name)}</span>
            <div class="wh-row__dots">
                <div class="${h}"></div>
                <div class="${E}"></div>
                <div class="${T}"></div>
            </div>
            <span class="wh-row__qty${u?" empty":""}">${v>0?v.toLocaleString():"—"}</span>
            <span class="wh-row__val${u?" empty":""}">${m>0?D(m):"—"}</span>
        </div>`,l){a+='<div class="wh-expand">',a+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const S=[{key:"LOW",label:"Low",data:p,avail:g,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:f,avail:b,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:d,avail:$,color:"var(--green)",dotClass:"wh-dot--high"}];for(const w of S){const C=!w.avail.available,M=w.data.qty>0,k=M?"$"+Math.round(w.data.value/w.data.qty):"—";a+=`<div class="wh-grade${C?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${w.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${C?"var(--red)":w.color}">${w.label}</span>
                        ${C?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${M?"var(--text-bright)":"var(--text-dim)"}">${M?w.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${w.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${w.data.value>0?D(w.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${k}</span>
                </div>`}for(const w of S)!w.avail.available&&w.avail.failedStat&&(a+=`<div class="wh-lock">
                        <span class="wh-lock__text">${w.label.toUpperCase()} GRADE LOCKED — ${x(w.avail.failedStat)} &lt; ${w.avail.failedMin}</span>
                    </div>`);a+="</div>"}a+="</div>"}o.innerHTML=a}function pr(o){xi=xi===o?-1:o,qi()}async function Li(){if(!c)return;const{data:o,error:e}=await y.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",c.id);X={};const t=[];if(e)console.warn("Failed to load warehouse:",e.message);else if(o){for(const i of o){const n=yo(i.material_key);X[n]||(X[n]={}),X[n][i.quality_tier]={qty:i.quantity||0,value:Number(i.total_value)||0},n!==i.material_key&&t.push(i)}if(t.length>0){const i=t.map(n=>({faction_id:c.id,nation_id:c.nation_id,material_key:yo(n.material_key),quality_tier:n.quality_tier,quantity:n.quantity||0,total_value:Number(n.total_value)||0,updated_at:new Date().toISOString()}));await y.from("corp_warehouse").upsert(i,{onConflict:"faction_id,material_key,quality_tier"});for(const n of t)await y.from("corp_warehouse").delete().eq("faction_id",c.id).eq("material_key",n.material_key).eq("quality_tier",n.quality_tier)}}qi()}const fr={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function Oi(){const e=(nt()?.name||N?.name||c?.nation||"—").toUpperCase(),t=!!(vt&&N&&vt.id!==N.id);document.getElementById("pr-nation-badge").textContent=(t?"IMPORT — ":"LOCAL — ")+e;const i=document.getElementById("pr-nation-select");if(i&&i.options.length===0){const l=N?.name||c?.nation||"—";let p=`<option value="">${x(l)} (HQ)</option>`;for(const f of Ct)f.id!==N?.id&&(p+=`<option value="${f.id}">${x(f.name)}</option>`);i.innerHTML=p}i&&(i.value=vt?.id||"");const n=Number(c?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=D(n);const{totalUnits:a}=Ao(),r=Math.round(a/No*100),s=document.getElementById("pr-wh-capacity");s.textContent=r+"%",s.style.color=r>80?"var(--red)":r>50?"var(--orange)":"var(--green)",Sn(),Bi(),Mo()}function Sn(){const o=nt(),e=document.getElementById("pr-mat-grid");let t="";for(const i of jt){const n=te===i.key,a=Ni.every(s=>!_e(i.key,s,o).available),r="pr-mat-btn"+(n?" active":"")+(a?" all-locked":"");t+=`<span class="${r}" onclick="setPrMat('${i.key}')">${x(i.name)}</span>`}e.innerHTML=t}function Bi(){const o=nt(),e=document.getElementById("pr-tier-bar");let t='<span class="pr-tier-label">GRADE</span>';for(const i of Ni){const n=_e(te,i,o),a=Y===i,r=n.available?Ai(te,i,o):null,s=hn[i],l=!n.available,p="pr-tier-btn"+(a?" active":"")+(l?" locked":"");t+=`<div class="${p}" onclick="${l?"":`setPrTier('${i}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${s};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${a?"var(--text-bright)":"var(--text-dim)"}">${vi[i]}</span>
            </div>
            ${r!==null?`<div class="pr-tier-btn__price" style="color:${a?"var(--text-bright)":"var(--text-muted)"}">$${r}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}e.innerHTML=t}function Mo(){const o=nt(),e=document.getElementById("pr-content"),t=_e(te,Y,o),i=jt.find(w=>w.key===te);if(!i)return;if(!t.available){e.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${x(i.name)} — ${vi[Y]} grade
                    is not produced domestically in ${x(o?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${x(t.failedStat||"unknown")} &lt; ${t.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const n=Ai(te,Y,o),a=_n(te,Y,o),r=n*be,s=a>3e3?"LOW":a>1e3?"MODERATE":"HIGH",l=s==="LOW"?"var(--green)":s==="MODERATE"?"var(--amber)":"var(--red)",p=Number(o?.inflation??50),f=p>55?"up":p<45?"down":"flat",d=f==="up"?"&#9650;":f==="down"?"&#9660;":"&#8212;",v=f==="up"?"var(--red)":f==="down"?"var(--green)":"var(--text-dim)";let m="";m+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${n}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${v}">${d}</span>
                </div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">SUPPLY/TICK</div>
                <div class="pr-market-cell__value" style="font-size:14px;color:var(--text-bright);margin-top:2px;">${a.toLocaleString()}</div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">DEMAND</div>
                <div class="pr-market-cell__value" style="font-size:12px;color:${l};margin-top:2px;">${s}</div>
            </div>
        </div>
    </div>`,m+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${x(o?.name||"—")})</div>`;for(const w of i.priceDrivers){const C=Number(o?.[w]??50),M=C>=50?"var(--green)":C>=30?"var(--amber)":C>=15?"var(--orange)":"var(--red)",k=fr[w]||w;m+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${x(w)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${C}%;background:${M}"></div>
            </div>
            <span class="pr-driver-row__val">${C}</span>
            <span class="pr-driver-row__effect">${x(k)}</span>
        </div>`}m+="</div>";const g=(Number(c?.corp_cash_reserves)||0)>=r,b=be>a,{totalUnits:$}=Ao(),h=No-$,E=be>h,T=h<=0,S=hn[Y];m+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${x(i.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${S};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${S}">${vi[Y]}</span>
                </div>
                <span class="pr-order__mat-price">$${n}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(w=>`<span class="pr-qty-btn${be===w?" active":""}" onclick="setPrQty(${w})">${w>=1e3?w/1e3+"k":w}</span>`).join("")}
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
                    <div class="pr-order__total-value">${D(r)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${g&&!b&&!E&&!T?"":"disabled"}
                    title="${g?b?"Exceeds supply":T?"Warehouse full":E?"Exceeds warehouse capacity":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,e.innerHTML=m}function mr(o){const e=nt();te=o,Y="STD";for(const t of["STD","HIGH","LOW"])if(_e(o,t,e).available){Y=t;break}Sn(),Bi(),Mo()}function ur(o){Y=o,Bi(),Mo()}function vr(o){be=o,Mo()}let Ko=!1;async function yr(o){if(!o)vt=null;else{let i=Ct.find(n=>n.id===o);if(!i)try{const{data:n}=await y.from("nations").select("*").eq("id",o).single();i=n}catch{}vt=i||null}const e=nt();if(!_e(te,Y,e).available){Y="STD";for(const i of["STD","HIGH","LOW"])if(_e(te,i,e).available){Y=i;break}}const t=document.getElementById("pr-nation-select");t&&(t.value=o||""),Oi()}async function gr(){if(Ko||!c||!N)return;const o=nt(),e=Ai(te,Y,o),t=_n(te,Y,o),i=e*be,n=Number(c.corp_cash_reserves)||0;if(i>n){alert("Insufficient cash reserves.");return}if(be>t){alert("Exceeds available supply this tick.");return}const{totalUnits:a}=Ao(),r=No-a;if(r<=0){alert("Warehouse is full. Cannot purchase more materials.");return}if(be>r){alert(`Warehouse can only hold ${r.toLocaleString()} more units. Reduce quantity.`);return}Ko=!0;const s=document.querySelector(".pr-purchase-btn");s&&(s.disabled=!0,s.textContent="...");try{const l=n-i,{error:p}=await y.from("factions").update({corp_cash_reserves:l}).eq("id",c.id);if(p)throw p;const f=yo(te),d=X[f]?.[Y],v=(d?.qty||0)+be,m=(d?.value||0)+i,{error:u}=await y.from("corp_warehouse").upsert({faction_id:c.id,nation_id:c.nation_id,material_key:f,quality_tier:Y,quantity:v,total_value:m,last_purchased_tick:I?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(u){const{error:b}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",c.id);throw b&&console.error("Cash refund failed after warehouse error:",b.message),u}c.corp_cash_reserves=l,X[f]||(X[f]={}),X[f][Y]={qty:v,value:m};const g=Math.floor(i/1e6);if(g>=1&&o?.id){const b=g*.01,{data:$,error:h}=await y.from("nations").select("gdp_growth").eq("id",o.id).single();if(!h&&$){const E=Math.min(100,Math.round((Number($.gdp_growth??50)+b)*100)/100);await y.from("nations").update({gdp_growth:E}).eq("id",o.id),N?.id===o.id&&(N.gdp_growth=E)}}qi(),Oi(),s&&(s.textContent="PURCHASED",setTimeout(()=>{s.isConnected&&(s.disabled=!1,s.textContent="PURCHASE")},1500))}catch(l){s&&(s.disabled=!1,s.textContent="PURCHASE"),alert("Purchase failed: "+(l.message||"Unknown error"))}finally{Ko=!1}}function zn(o){const e=Ke||N;if(!e)return[];const t=zo(o);if(!t)return[];const i=Ra(o,e),n=[],a=Number(e?.inflation??50),r=Number(e?.fuel_prices??50);Number(e?.manufacturing_output??50);const s=Ke&&N&&Ke.id!==N.id;let l=null;if(s&&(l=qa(e,N)),i.newAvailable>0){const p=dn(o,e),f=t.basePrice,d=Math.round(f*((a-50)/200)),v=Math.round(f*((r-50)/300));let m=p;const u=[{label:"Base price",value:D(f)},d!==0?{label:`Inflation (${a})`,mod:(d>=0?"+":"")+D(Math.abs(d))}:null,v!==0?{label:`Fuel transport (${r})`,mod:(v>=0?"+":"")+D(Math.abs(v))}:null].filter(Boolean),g=p-f-d-v;if(g!==0&&!s&&u.push({label:"Demand/scarcity",mod:(g>=0?"+":"")+D(Math.abs(g))}),s&&l){const b=Math.round(p*l.tariff),$=Math.round(p*l.transport);m=p+b+$,u.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+D(b)}),u.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+D($)})}n.push({seller:s?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:s?l?.deliveryTicks||1:0,condition:100,price:Math.round(m),available:i.newAvailable,delivery:s?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:s?l.deliveryTicks:0,used:!1,priceFactors:u,sourceNationId:e.id})}if(i.usedAvailable>0){const p=i.usedCondition,f=dn(o,e,{used:!0,condition:p});let d=f;const v=[{label:"Base price",value:D(t.basePrice)},{label:`Condition (${p}%)`,mod:"-"+D(Math.max(0,t.basePrice-f))}];if(s&&l){const m=Math.round(f*l.tariff),u=Math.round(f*l.transport);d=f+m+u,v.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+D(m)}),v.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+D(u)})}n.push({seller:s?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:s?l?.deliveryTicks||1:0,condition:p,price:Math.round(d),available:i.usedAvailable,delivery:s?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:s?l.deliveryTicks:0,used:!0,priceFactors:v,sourceNationId:e.id})}return n}function Ro(){const o=Number(c?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=D(o);const e=zo(me),t=Ft[e?.tier||1],i=document.getElementById("em-tier-badge");i&&(i.textContent=t.tag,i.style.color=t.color),i.style.background=t.color+"0a",i.style.border="1px solid "+t.color+"33";const n=document.getElementById("em-nation-select");if(n&&n.options.length===0){const s=N?.name||c?.nation||"—";let l=`<option value="">${x(s)} (HQ)</option>`;for(const p of Ct)p.id!==N?.id&&(l+=`<option value="${p.id}">${x(p.name)}</option>`);n.innerHTML=l}const a=document.getElementById("em-import-tag"),r=Ke&&N&&Ke.id!==N.id;a&&(a.style.display=r?"":"none"),xr(),Pi()}function xr(){let o="";for(let e=1;e<=3;e++){const t=Ft[e],i=yi(e),n=e===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";o+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${t.color}">${t.tag}</div>
            <div class="${n}">`;for(const a of i){const r=me===a.key,s=zn(a.key).length>0;o+=`<span class="em-selector__btn${r?" active":""}${s?"":" no-listings"}"
                style="${r?"background:"+t.color+";border-color:"+t.color:""}"
                onclick="setEmType('${a.key}')">${x(a.name)}</span>`}o+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${o}</div>`}function Pi(){const o=document.getElementById("em-content");if(Be=zn(me),Be.length===0){o.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}Ce>=Be.length&&(Ce=0);let e="";for(let i=0;i<Be.length;i++){const n=Be[i],a=Ce===i,r=n.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",s=$n(n.condition);e+=`<div class="em-listing${a?" selected":""}" style="${a?"border-left-color:"+r:""}" onclick="setEmListing(${i})">`,e+=`<div class="em-listing__row1">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="em-listing__seller">${x(n.seller)}</span>
                <span class="em-badge em-badge--${n.sellerType.toLowerCase()}">${n.sellerType}</span>
                ${n.used?'<span class="em-badge em-badge--used">USED</span>':""}
            </div>
        </div>`,e+=`<div class="em-listing__row2">
            <span class="em-listing__nation">${x((n.nation||"").toUpperCase())}</span>
            ${n.distance>0?`<span class="em-listing__distance">${n.distance} nation${n.distance>1?"s":""} away</span>`:""}
            <span class="em-listing__delivery">Delivery: ${x(n.delivery)}</span>
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
                ${n.priceFactors.map(l=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${x(l.label)}</span>
                    <span class="em-breakdown__mod" style="color:${l.mod?l.mod.startsWith("-")?"var(--green)":l.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${l.mod||l.value}</span>
                </div>`).join("")}
            </div>`),e+="</div>"}const t=Be[Ce];if(t){const i=zo(me),n=Ft[i?.tier||1],a=Math.min(t.available,4),r=t.price*Se,s=(Number(c?.corp_cash_reserves)||0)>=r;e+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${x(i?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${x(t.seller)}</span>
                </div>
                <span class="em-purchase__price">${D(t.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:a},(l,p)=>p+1).map(l=>`<span class="em-qty-btn${Se===l?" active":""}" style="${Se===l?"background:"+n.color+";border-color:"+n.color:""}" onclick="setEmQty(${l})">${l}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${t.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${D(r)}</div>
                    ${t.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${x(t.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${n.color}" onclick="purchaseEquipment()"
                    ${s?"":"disabled"}
                    title="${s?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}o.innerHTML=e}async function br(o){if(!o)Ke=null;else{let t=Ct.find(i=>i.id===o);if(!t)try{const{data:i}=await y.from("nations").select("*").eq("id",o).single();t=i}catch{}Ke=t||null}Ce=0,Se=1;const e=document.getElementById("em-nation-select");e&&(e.value=o||""),Ro()}function _r(o){me=o,Ce=0,Se=1,Ro()}function hr(o){Ce=o,Se=1,Pi()}function $r(o){Se=o,Pi()}let Jo=!1;async function wr(){if(Jo)return;const o=Be[Ce];if(!o||!c)return;const e=zo(me);if(!e)return;const t=Se,i=o.price*t,n=Number(c.corp_cash_reserves)||0;if(i>n){alert("Insufficient cash reserves.");return}if(t>o.available){alert("Not enough units available.");return}const a=document.querySelector(".em-purchase-btn");a&&(a.disabled=!0,a.textContent="..."),Jo=!0;try{const r=n-i,{error:s}=await y.from("factions").update({corp_cash_reserves:r}).eq("id",c.id);if(s)throw s;const l=!o.deliveryTicks||o.deliveryTicks===0;if(l){const f=re.find(E=>E.equipment_key===me),d=(f?.owned||0)+t,v=f?.purchase_price_avg||0,m=f?.owned||0,u=m>0?Math.round((v*m+o.price*t)/d):o.price,g=e.maintenancePerUnit*d,b=f?.condition||100,$=Math.round((b*m+o.condition*t)/d),{error:h}=await y.from("corp_equipment").upsert({faction_id:c.id,nation_id:c.nation_id,equipment_key:me,tier:e.tier,owned:d,deployed:f?.deployed||0,condition:$,maintenance_per_tick:g,purchase_price_avg:u,last_purchased_tick:I?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(h){const{error:E}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",c.id);throw E&&console.error("Cash refund failed:",E.message),h}f?(f.owned=d,f.condition=$,f.maintenance_per_tick=g):re.push({equipment_key:me,tier:e.tier,owned:d,deployed:0,condition:$,maintenance_per_tick:g,assigned_projects:[]})}else{const f=(I?.current_tick||0)+o.deliveryTicks,{error:d}=await y.from("corp_equipment_deliveries").insert({faction_id:c.id,equipment_key:me,quantity:t,condition:o.condition,delivery_tick:f,source_nation_id:o.sourceNationId||null,seller_name:o.seller,price_paid:i});if(d){const{error:v}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",c.id);throw v&&console.error("Cash refund failed:",v.message),d}}c.corp_cash_reserves=r,Vi(),Ro();const p=document.getElementById("pr-cash");p&&(p.textContent=D(r)),a&&(a.textContent=l?"PURCHASED":"ORDERED",setTimeout(()=>{a.isConnected&&(a.disabled=!1,a.textContent="PURCHASE")},1500))}catch(r){a&&(a.disabled=!1,a.textContent="PURCHASE"),alert("Purchase failed: "+(r.message||"Unknown error"))}finally{Jo=!1}}let kr=-1,dt=[],_o=[],ki=[];function Xo(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o.toLocaleString()}function Er(o,e,t){if(t)return"var(--orange)";const i=o/(e||1)*100;return i>50?"var(--green)":i>25?"var(--amber)":"var(--red)"}function vn(){const o=document.getElementById("pm-list"),e=dt.length,t=_o.length,i=ki.length,n=dt.filter(l=>l.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${e})`,document.getElementById("pm-pending-count").textContent=`(${t})`,document.getElementById("pm-apply-count").textContent=`(${i})`;const a=document.getElementById("pm-badges");let r="";n>0&&(r+=`<span class="pm-badge pm-badge--expiring">${n} EXPIRING</span>`),t>0&&(r+=`<span class="pm-badge pm-badge--pending">${t} PENDING</span>`),a.innerHTML=r;const s=dt.reduce((l,p)=>l+(p.cost||0),0)+_o.reduce((l,p)=>l+(p.cost||0),0);document.getElementById("pm-total-cost").textContent=Xo(s),document.getElementById("pm-footer-active").textContent=e,document.getElementById("pm-footer-pending").textContent=t;{if(e===0){o.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let l="";dt.forEach((p,f)=>{const d=kr===f,v=Er(p.ticks_left,p.total_ticks,p.expiring_soon),m=Math.min(p.ticks_left/(p.total_ticks||1)*100,100);l+=`<div class="pm-item ${p.expiring_soon?"pm-item--expiring":""} ${d?"expanded":""}" onclick="togglePmExpand(${f})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${x(p.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${x((p.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${v}">Expires: ${x(p.expires||"")}</span>
                        <span class="pm-item__ticks">(${p.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${m}%;background:${v}"></div></div>`,d&&(l+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${x(p.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${x(p.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${Xo(p.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${p.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${p.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(p.projects||[]).map(u=>`<span class="pm-project-chip">${x(u)}</span>`).join("")}</div>
                    </div>`,p.note&&(l+=`<div class="pm-note"><span class="pm-note__text">${x(p.note)}</span></div>`),p.expiring_soon&&p.renewable&&(l+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew" onclick="event.stopPropagation(); pmApplyForPermit('${p.permit_key}');">RENEW — ${Xo(p.cost||0)}</button></div>`),l+="</div>"),l+="</div></div>"}),o.innerHTML=l;return}}let Zo=!1;async function Cr(o){if(!(Zo||!c||!N)){Zo=!0;try{const{data:e}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{data:i,error:n}=await y.rpc("apply_for_permit",{p_faction_id:c.id,p_nation_id:N.id,p_permit_key:o,p_current_tick:t});if(n){alert("Application failed: "+n.message);return}if(i&&!i.success){alert(i.error||"Application failed");return}alert("Permit application submitted! Processing: "+(i.processing_ticks||0)+" ticks."),await In()}catch(e){alert("Error: "+e.message)}finally{Zo=!1}}}window.pmApplyForPermit=Cr;async function In(){if(!c||!N){dt=[],_o=[],ki=[],vn();return}const{data:o}=await y.from("construction_permits").select("*"),e=o||[],t={};for(const d of e)t[d.permit_key]=d;const{data:i}=await y.from("corp_permits").select("*").eq("faction_id",c.id).eq("nation_id",N.id),n=i||[],{data:a}=await y.from("active_laws").select("policy_id, policies(permit_key, policy_name)").eq("nation_id",N.id).not("policies.permit_key","is",null),r=new Set,s={};for(const d of a||[])d.policies?.permit_key&&(r.add(d.policies.permit_key),s[d.policies.permit_key]=d.policies.policy_name);const{data:l}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),p=l?.current_tick||0;dt=n.filter(d=>d.status==="active").map(d=>{const v=t[d.permit_key]||{},m=d.expires_at_tick?Math.max(0,d.expires_at_tick-p):999,u=v.duration_ticks||24;return{name:v.name||d.permit_key,permit_key:d.permit_key,nation:N.name,policy:s[d.permit_key]||"—",issued:d.granted_at_tick!=null?He(d.granted_at_tick):"—",expires:d.expires_at_tick?He(d.expires_at_tick):"Single-use",cost:d.cost_paid||0,ticks_left:m,total_ticks:u,expiring_soon:m<=3&&m>0,renewable:v.duration_ticks!=null,projects:[]}}),_o=n.filter(d=>d.status==="pending").map(d=>{const v=t[d.permit_key]||{},m=v.processing_ticks||2,u=p-d.applied_at_tick,g=Math.max(0,m-u);return{name:v.name||d.permit_key,permit_key:d.permit_key,nation:N.name,applied:He(d.applied_at_tick),status:"PROCESSING",processing_total:m,ticks_remaining:g,est_approval:He(d.applied_at_tick+m),cost:d.cost_paid||0,required_by:s[d.permit_key]||"—"}});const f=new Set(n.filter(d=>d.status==="active"||d.status==="pending").map(d=>d.permit_key));ki=[...r].filter(d=>!f.has(d)).map(d=>{const v=t[d]||{};return{name:v.name||d,permit_key:d,nation:N.name,description:v.description||"",policy:s[d]||"—",cost:v.cost_is_percentage?15e4:v.cost||0,processing_time:v.processing_ticks||2,duration:v.duration_ticks?v.duration_ticks+" ticks":"Single-use",category:v.category||"",difficulty:v.difficulty||"EASY"}}),vn()}let Ge=[],Tr=-1;function we(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(2)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o.toLocaleString()}function yn(o){return o>=85?"var(--gold)":o>=60?"var(--green)":o>=40?"var(--orange)":"var(--red)"}function Sr(o){return"dl-result--"+o.toLowerCase()}function gn(){const o=document.getElementById("dl-list"),e=Ge.length;document.getElementById("dl-count").textContent=`${e} COMPLETED`;const t=Ge.reduce((s,l)=>{const p=l.financials||{};return s+((p.payment||0)+(p.bonus||0)-(p.penalty||0)-(p.total_cost||0))},0),i=document.getElementById("dl-lifetime-profit");i.textContent=(t>=0?"+":"")+we(t),i.style.color=t>=0?"var(--green)":"var(--red)";const n={};Ge.forEach(s=>{n[s.result]=(n[s.result]||0)+1});const a=document.getElementById("dl-footer-results");if(a.innerHTML=Object.entries(n).map(([s,l])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[s]||"var(--text-dim)"}">${x(s)}</div>
            <div class="dl-footer__result-count">${l}</div>
        </div>`).join(""),e===0){o.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let r="";Ge.forEach((s,l)=>{const p=Tr===l,f=s.financials||{},d=(f.payment||0)+(f.bonus||0)-(f.penalty||0)-(f.total_cost||0),v=d>=0,m=Sr(s.result),g={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[s.result]||"var(--text-dim)",b=s.type==="GOVERNMENT";if(r+=`<div class="dl-item ${p?"expanded":""}" onclick="toggleDlExpand(${l})">
            <div class="dl-item__inner" style="border-left:2px solid ${g}">
                <div class="dl-item__row1">
                    <span class="dl-item__name">${x(s.name)}</span>
                    <span class="dl-result-badge ${m}">${x(s.result)}</span>
                </div>
                <div class="dl-item__row2">
                    <span class="dl-item__id">${x(s.id)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                    <span class="dl-item__issuer" style="color:${b?"var(--green)":"var(--gold)"}">${x(s.issuer)}</span>
                    <span class="dl-item__date">${x(s.delivered)}</span>
                </div>
                <div class="dl-summary-bar">
                    <div class="dl-summary-cell" style="flex:1;">
                        <div class="dl-summary-label">QUALITY</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span class="dl-summary-value" style="color:${yn(s.quality_score)}">${s.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${s.rep_change>0?"var(--green)":s.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${s.rep_change>0?"+":""}${s.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${v?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${v?"var(--green)":"var(--red)"};margin-top:2px;">${v?"+":""}${we(d)}</div>
                    </div>
                </div>`,p){const $=s.inspection||{};r+='<div style="margin-top:8px;">',r+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(S=>{const w=$[S]||{score:0,issues:[]},C=yn(w.score),M=Math.min(w.score/100*100,100);r+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${x(S.charAt(0).toUpperCase()+S.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${M}%;background:${C}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${C}">${w.score}</span>
                        </div>
                    </div>
                    ${(w.issues||[]).map(k=>`<div class="dl-inspect-issue">${x(k)}</div>`).join("")}
                </div>`});const h=$.permits||{passed:!0,issues:[]};r+=`<div class="dl-permits-row ${h.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${h.passed?"var(--green)":"var(--red)"}">${h.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${(h.issues||[]).map(S=>`<div class="dl-inspect-issue dl-inspect-issue--red">${x(S)}</div>`).join("")}
            </div>`,r+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',r+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(s.materials_used||[]).forEach(S=>{const w=S.grade==="HIGH"?"var(--green)":S.grade==="STANDARD"?"var(--amber)":"var(--orange)",C=S.impact==="positive"?"▲":S.impact==="negative"?"▼":"–",M=S.impact==="positive"?"var(--green)":S.impact==="negative"?"var(--red)":"var(--text-dim)";r+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${x(S.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${w}"></div>
                    <span class="dl-mat-tag__grade" style="color:${w}">${x(S.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${M}">${C}</span>
                </div>`}),r+="</div>",r+='<div class="dl-section-label">Financial Summary</div>',r+='<div class="dl-fin-panel">',r+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${we(f.contract_value||0)}</span></div>`,(f.bonus||0)>0&&(r+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${we(f.bonus)}</span></div>`),(f.penalty||0)>0&&(r+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${we(f.penalty)}</span></div>`);const E=(f.payment||0)+(f.bonus||0)-(f.penalty||0);r+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${we(E)}</span></div>`,r+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${we(f.total_cost||0)}</span></div>`,r+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${v?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${v?"var(--green)":"var(--red)"}">${v?"+":""}${we(d)}</span>
            </div>`,r+="</div>";const T=s.timeline||{};r+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${T.actual||0}/${T.expected||0} ticks</span>`,T.early?r+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(T.expected||0)-(T.actual||0)} TICK${T.expected-T.actual!==1?"S":""} EARLY</span>`:!T.on_time&&T.actual>T.expected&&(r+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(T.actual||0)-(T.expected||0)} TICK${T.actual-T.expected!==1?"S":""} LATE</span>`),r+="</div>",r+="</div>"}r+="</div></div>"}),o.innerHTML=r}let gt=!1,ei=!1;function Nn(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+Math.round(o/1e3)+"k":"$"+Math.round(o)}async function Di(){var{data:o,error:e}=await y.from("factions").select("*").eq("id",c.id).single();if(e){console.warn("Faction refresh failed:",e.message);return}o&&(c=o);var t=document.getElementById("topbar-cash");t&&(t.textContent="CASH: "+Nn(Number(c.corp_cash_reserves??0)))}const Ei={CRITICAL:"#c55",HIGH:"#5c5",MODERATE:"#ca5",LOW:"#6a6660"};let xt=[],ji=[],An="ready",qt=null,ho="ALL",Z=-1;const xn={COASTAL:{color:"#8b9a6b",label:"COASTAL"},INTERNATIONAL:{color:"#5a8aaa",label:"INTL"},GOVERNMENT:{color:"#c8a832",label:"GOV CONTRACT"}};function zr(o){ho=o,Z=-1,document.querySelectorAll(".ar-pill").forEach(e=>{const t=e.getAttribute("data-ar-filter");e.className="ar-pill"+(t===o?" active-"+(o==="ALL"?"all":o==="COASTAL"?"coastal":o==="INTERNATIONAL"?"intl":"gov"):"")}),Hi()}function Fi(){return ho==="ALL"?xt:xt.filter(o=>o.scope===ho)}async function Ui(){if(!c||c.corp_sector!=="Shipping")return;const o=await Ia(y,c.id,c.corp_subsector);xt=o.routes,ji=o.applications,An=o.state,qt=o.error,qt&&console.warn("Failed to load available routes:",qt.message),Z=-1,Hi()}var Ir={fuel_energy:[{stat:"industrialization",label:"Industrialization"},{stat:"urbanization",label:"Urbanization"}],minerals:[{stat:"industrialization",label:"Industrialization"},{stat:"manufacturing",label:"Manufacturing"}],grains_staples:[{stat:"population_growth",label:"Population Growth"},{stat:"food_security",label:"Food Security"}],livestock_dairy:[{stat:"standard_of_living",label:"Std of Living"},{stat:"food_security",label:"Food Security"}],cash_crops:[{stat:"trade_balance",label:"Trade Balance"},{stat:"foreign_investment",label:"Foreign Investment"}],manufactured_goods:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],technology:[{stat:"technology",label:"Technology"},{stat:"higher_education",label:"Higher Education"}],fruits_vegetables:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],arms:[{stat:"military_spending",label:"Military Spending"},{stat:"stability",label:"Stability"}]};function Nr(o){return Ir[o]||[]}function Ar(o){var e=Number(o.competition_count||0),t=o.demand_level||"",i=o.scope==="GOVERNMENT";return i?"Fixed payment. No demand risk. Vessel locked for contract duration.":e===0&&t==="CRITICAL"?"Unserved critical corridor. High volume, no competition — claim immediately.":e===0&&t==="HIGH"?"Virgin route with strong demand. First-mover advantage available.":e===0?"No competition on this route. Market share starts at 100%.":t==="CRITICAL"&&e<=2?"Underserved critical route. Demand exceeds current capacity.":t==="LOW"?"Thin route. Revenue may not justify vessel deployment.":e>=3?"Crowded route. Market share will be split "+(e+1)+" ways.":Number(o.tariff_rate||0)>15?"High tariff rate cuts into margins. Watch for trade policy changes.":null}function Hi(){const o=Fi();document.getElementById("ar-count").textContent=xt.length+" ROUTES";var e={COASTAL:0,INTERNATIONAL:0,GOVERNMENT:0};xt.forEach(function($){e[$.scope]!==void 0&&e[$.scope]++});var t=e.COASTAL,i=e.INTERNATIONAL,n=e.GOVERNMENT;document.getElementById("ar-footer-counts").innerHTML='<div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#8b9a6b"></div><span class="ar-footer__count-label">COASTAL</span><span class="ar-footer__count-num">'+t+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#5a8aaa"></div><span class="ar-footer__count-label">INTL</span><span class="ar-footer__count-num">'+i+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#c8a832"></div><span class="ar-footer__count-label">GOV</span><span class="ar-footer__count-num">'+n+"</span></div>";const a=document.getElementById("ar-claim-btn");a.className="ar-claim-btn"+(Z>=0?" active":"");const r=document.getElementById("ar-list");if(An==="error"){r.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+x(qt&&qt.message||"Shipping routes are temporarily unavailable.")+"</div></div>";return}if(o.length===0){r.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+(xt.length===0?"No routes available.<br>Routes are generated from bilateral<br>trade each tick. Check back after<br>the next corp tick fires.":"No "+ho.toLowerCase()+" routes available.")+"</div></div>";return}let s="";for(let $=0;$<o.length;$++){const h=o[$],E=Z===$,T=xn[h.scope]||xn.INTERNATIONAL,S=h.scope==="GOVERNMENT",w=h.demand_level&&Ei[h.demand_level]?{color:Ei[h.demand_level],label:h.demand_level}:null,C=Number(h.competition_count||0),M=C===0?"#5c5":C<=2?"#ca5":"#c84";s+='<div style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid '+(E?T.color:"transparent")+";background:"+(E?T.color+"08":"transparent")+';" onclick="arSelectRoute('+$+')"><div style="padding:8px 14px;">',s+='<div style="display:flex;align-items:center;gap:0;margin-bottom:4px;"><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+x(h.origin_port||"?")+'</span><div style="flex:1;display:flex;align-items:center;margin:0 8px;"><div style="flex:1;height:1px;background:'+T.color+'44"></div><span style="font-family:var(--font-mono);font-size:7px;color:'+T.color+';padding:0 6px">⚓</span><div style="flex:1;height:1px;background:'+T.color+'44"></div></div><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+x(h.destination_port||"?")+"</span></div>",s+='<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;"><span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+T.color+";background:"+T.color+"12;border:1px solid "+T.color+'25">'+T.label+"</span>",w&&(s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+w.color+";background:"+w.color+"12;border:1px solid "+w.color+'25">'+w.label+" DEMAND</span>"),S&&h.gov_issuer&&(s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">'+x(h.gov_issuer)+"</span>"),C===0&&!S&&(s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15)">NO COMPETITION</span>');var l=ji.find(function(k){return k.route_id===h.id});if(l){var p=l.status==="approved"?"#5c5":"#c8a832",f=l.status==="approved"?"APPROVED":"APPLIED";s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+p+";background:"+p+"12;border:1px solid "+p+'25">'+f+"</span>"}if(s+='<span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-left:auto">'+(h.transit_ticks||"?")+" tick"+((h.transit_ticks||0)!==1?"s":"")+" · "+x(h.vessel_class||"?")+"</span>",s+="</div>",s+='<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">',S?(s+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(h.gov_contract_duration||h.transit_ticks||"?")+" ticks</div></div>",s+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VESSEL</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+x(h.vessel_class||"?")+"</div></div>",s+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT VALUE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-top:1px">'+D(Number(h.gov_contract_value||h.estimated_revenue||0))+"</div></div>"):(s+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VOLUME</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);margin-top:1px">'+D(Number(h.trade_volume||0))+"</div></div>",s+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">COMP.</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+M+';margin-top:1px">'+C+"</div></div>",s+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">TRANSIT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(h.transit_ticks||"?")+" tick"+((h.transit_ticks||0)!==1?"s":"")+"</div></div>",s+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">EST. REV</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;margin-top:1px">'+D(Number(h.estimated_revenue||0))+"</div></div>"),s+="</div>",E){if(s+='<div style="margin-top:6px;">',S&&h.goods_description&&(s+='<div style="font-size:10px;color:var(--text-muted);line-height:1.5;margin-bottom:6px">'+x(h.goods_description)+"</div>"),h.trade_agreement_name&&(s+='<div style="padding:4px 8px;margin-bottom:5px;background:rgba(90,138,170,0.05);border:1px solid rgba(90,138,170,0.12)"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:var(--font-mono);font-size:7px;color:#5a8aaa;letter-spacing:0.5px">TRADE AGREEMENT</div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:1px">'+x(h.trade_agreement_name)+'</div></div><div style="text-align:right"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">TARIFF</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(Number(h.tariff_rate||0)>10?"#c84":"#5c5")+'">'+Number(h.tariff_rate||0).toFixed(1)+"%</div></div></div></div>"),s+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px">',s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VESSEL CLASS</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+x(h.vessel_class||"?")+"</span></div>",h.vessel_note&&(s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">REQUIREMENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+x(h.vessel_note)+"</span></div>"),s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">PROXIMITY</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+(h.proximity!=null?h.proximity:"?")+" / 100</span></div>",s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CARGO</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+x(h.goods_name||"Unknown")+"</span></div>",h.goods_description&&!S&&(s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CONTENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+x(h.goods_description)+"</span></div>"),s+='<div style="display:flex;justify-content:space-between;padding:2px 0"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VOLUME</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+Number(h.volume_physical||0).toLocaleString()+" "+x(h.volume_unit||"tons")+"</span></div>",s+="</div>",N&&!S){var d=Nr(h.trade_sector);if(d.length>0){s+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.8px;margin-bottom:3px">DEMAND DRIVERS</div>';for(var v=0;v<d.length;v++){var m=d[v],u=Number(N[m.stat]??50),g=u>=50?"#5c5":u>=30?"#ca5":"#c84";s+='<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);width:100px">'+x(m.label)+'</span><div style="width:40px;height:2px;background:var(--border-0)"><div style="width:'+u+"%;height:100%;background:"+g+'"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-bright)">'+Math.round(u)+"</span></div>"}s+="</div>"}}var b=Ar(h);b&&(s+='<div style="padding:4px 8px;background:'+T.color+"08;border:1px solid "+T.color+'15"><div style="font-size:9px;color:var(--text-muted);line-height:1.5">'+x(b)+"</div></div>"),s+="</div>"}s+="</div></div>"}r.innerHTML=s}function Mr(o){Z=Z===o?-1:o,Hi()}async function Rr(){if(!(gt||Z<0||!c||!I)){var o=Fi(),e=o[Z];if(e){var t=ji.find(function(u){return u.route_id===e.id});if(t){alert("You have already applied for this route. Status: "+t.status);return}var i={"Bulk Cargo":"bulk_cargo","Container Freight":"container_freight","Specialized Transport":"specialized_transport"},n=i[c.corp_subsector]||"";if(e.shipping_subsector&&n!==e.shipping_subsector){var a=e.shipping_subsector.replace(/_/g," ").replace(/\b\w/g,function(u){return u.toUpperCase()});alert("Your fleet specializes in "+(c.corp_subsector||"?")+" but this route requires "+a+". You cannot service this route.");return}var r=5e4,{data:s}=await y.from("factions").select("corp_cash_reserves").eq("id",c.id).single(),l=Number(s?.corp_cash_reserves??0);if(l<r){alert("Not enough funds. Application fee: $50k. You have $"+Math.round(l/1e3)+"k.");return}gt=!0;var p=document.getElementById("ar-claim-btn");p.textContent="APPLYING...";try{var f=l-r,{error:d}=await y.from("factions").update({corp_cash_reserves:f}).eq("id",c.id);if(d){alert("Failed to deduct fee.");return}var{data:v,error:m}=await y.from("shipping_applications").insert({route_id:e.id,faction_id:c.id,proposed_rate:Number(e.estimated_revenue||0),application_fee:r,status:"pending",applied_at_tick:I.current_tick}).select("*").single();if(m){await y.from("factions").update({corp_cash_reserves:l}).eq("id",c.id);const u=m.code==="23505"||/duplicate key|idx_shipping_applications_unique/i.test(m.message||"");alert(u?"You already have a pending or approved application on this route. Withdraw it from Route Applications before applying again.":"Application failed: "+m.message);return}try{await y.from("event_log").insert({nation_id:e.origin_nation_id,event_name:c.faction_name+" applied to service "+(e.origin_port||"?")+" → "+(e.destination_port||"?")+" route",category:"corporate",description_chosen:c.faction_name+" has submitted a shipping application for the "+(e.goods_name||"trade")+" route between "+(e.origin_port||"?")+" and "+(e.destination_port||"?")+". Awaiting government approval.",fired_at_tick:I.current_tick})}catch{}await Di(),Z=-1,await Ui(),alert("Application submitted! The government will review your application.")}catch(u){alert("Application failed: "+(u.message||"Network error"))}finally{gt=!1,p.textContent="APPLY TO SERVICE — $50k",p.className="ar-claim-btn"+(Z>=0?" active":"")}}}}async function qr(){if(!(gt||Z<0||!c||!I)){var o=Fi(),e=o[Z];if(e){var t=Number(c.shipping_fleet_capacity??0),i=Number(c.shipping_fleet_deployed??0);if(i>=t){alert("No available vessels. Fleet capacity: "+t+", deployed: "+i+".");return}gt=!0;var n=document.getElementById("ar-claim-btn");n.textContent="CLAIMING...",n.className="ar-claim-btn";try{var{data:a,error:r}=await y.rpc("claim_shipping_route",{p_faction_id:c.id,p_route_id:e.id,p_current_tick:I.current_tick});if(r){alert("Claim failed: "+r.message);return}if(a&&!a.success){alert(a.error||"Claim failed.");return}if(a?.claim_id){var s=(he||[]).find(function(v){return v.status==="in_port"&&!v.active_claim_id&&v.fuel>=10});if(s){var{error:l}=await y.from("corp_vessels").update({status:"in_transit",active_claim_id:a.claim_id,current_port_nation_id:null}).eq("id",s.id);l&&console.warn("Failed to assign vessel to route:",l.message)}else console.warn("Route claimed but no available vessel with fuel >= 10% to assign.")}try{var p=e.origin_nation?.name||e.origin_nation_id||"Unknown",f=e.destination_nation?.name||e.destination_nation_id||"Unknown",d=e.goods_type||e.cargo_type||"goods";await y.from("event_log").insert({nation_id:c.nation_id,event_name:"Shipping Route Signed",category:"corporate",description_chosen:c.faction_name+" has just signed an agreement to ship "+d+" between "+p+" and "+f+".",fired_at_tick:I.current_tick||0})}catch{}await Di(),Z=-1,await Promise.all([Ui(),Gi(),$e()])}catch(v){alert("Claim failed: "+(v.message||"Network error"))}finally{gt=!1,n.textContent="CLAIM ROUTE",n.className="ar-claim-btn"+(Z>=0?" active":"")}}}}let Pe=[],Mn="ready",Lt=null,$o=-1;async function Gi(){if(!c||c.corp_sector!=="Shipping")return;const o=await Sa(y,c.id);Pe=o.claims,Mn=o.state,Lt=o.error,Lt&&console.warn("Failed to load active voyages:",Lt.message),Rn()}function Lr(o){$o=$o===o?-1:o,Rn()}async function Or(o){if(!(ei||!c||!I)){ei=!0;try{var{data:e,error:t}=await y.rpc("release_shipping_route",{p_faction_id:c.id,p_claim_id:o,p_current_tick:I.current_tick});if(t){alert("Release failed: "+t.message);return}if(e&&!e.success){alert(e.error||"Release failed.");return}var{error:i}=await y.from("corp_vessels").update({status:"in_port",active_claim_id:null}).eq("active_claim_id",o).eq("faction_id",c.id);i&&console.warn("Failed to free vessel on release:",i.message),$o=-1,await Di(),await Promise.all([Ui(),Gi(),$e()])}catch(n){alert("Release failed: "+(n.message||"Network error"))}finally{ei=!1}}}function Rn(){const o=I?.current_tick||0,e=Number(c?.shipping_fleet_capacity??0),t=Number(c?.shipping_fleet_deployed??0),i=c?.corp_subsector||"--";document.getElementById("av-count").textContent=Pe.length+" ACTIVE";const n=Pe.reduce((f,d)=>f+Number(d.total_revenue||0),0),a=Pe.reduce((f,d)=>f+(d.transits_completed||0),0),r=a>0?Math.round(n/a):0;document.getElementById("av-summary").innerHTML=`
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
        </div>`,document.getElementById("av-total-revenue").textContent=D(n),document.getElementById("av-total-revenue").style.color=n>0?"var(--green)":"var(--text-dim)",document.getElementById("av-fleet-status").textContent=t+"/"+e,document.getElementById("av-subsector").textContent=i;const s=document.getElementById("av-list");if(Mn==="error"){s.innerHTML='<div class="av-empty"><div class="av-empty__text">'+x(Lt&&Lt.message||"Active voyage data is temporarily unavailable.")+"</div></div>";return}if(Pe.length===0){s.innerHTML='<div class="av-empty"><div class="av-empty__text">No active voyages.<br>Claim a shipping route to<br>deploy your fleet.</div></div>';return}let l="";for(let f=0;f<Pe.length;f++){const d=Pe[f],v=d.shipping_routes||{},m=$o===f,u=d.vessel_status||"idle";let g=u.toUpperCase().replace("_"," "),b="av-status--idle",$="";if(u==="loading")b="av-status--loading",g="LOADING";else if(u==="in_transit"){b="av-status--transit";const C=d.transit_started_tick||o,k=(d.transit_arrives_tick||C+(v.transit_ticks||2))-C,z=Math.max(0,Math.min(o-C,k)),q=k>0?Math.round(z/k*100):0;g="IN TRANSIT ("+z+"/"+k+")",$='<div class="av-transit-bar"><div class="av-transit-bar__fill" style="width:'+q+'%"></div></div>'}const h=Number(d.revenue_per_transit||0),E=Number(d.market_share_pct||0),T=d.transits_completed||0,S=Number(d.total_revenue||0),w=Ei[v.demand_level]||"#6a6660";if(l+='<div class="av-item" onclick="avToggle('+f+')"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;"><div class="av-item__route">'+x(v.origin_port||"?")+" → "+x(v.destination_port||"?")+'</div><span class="av-status '+b+'">'+g+'</span></div><div class="av-item__cargo">'+x(v.goods_name||"Unknown")+" · "+x(v.vessel_class||"?")+"</div>"+$+'<div class="av-item__stats"><div class="av-stat"><div class="av-stat__label">REV/TRIP</div><div class="av-stat__value" style="color:var(--green)">'+D(h)+'</div></div><div class="av-stat"><div class="av-stat__label">SHARE</div><div class="av-stat__value">'+E.toFixed(1)+'%</div></div><div class="av-stat"><div class="av-stat__label">TRANSITS</div><div class="av-stat__value">'+T+'</div></div><div class="av-stat"><div class="av-stat__label">TOTAL REV</div><div class="av-stat__value" style="color:var(--green)">'+D(S)+"</div></div></div>",m){l+='<div class="av-item__detail"><div class="av-detail-row"><span class="av-detail-label">ORIGIN</span><span class="av-detail-value">'+x(v.origin_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">DESTINATION</span><span class="av-detail-value">'+x(v.destination_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE SECTOR</span><span class="av-detail-value">'+x((v.trade_sector||"").replace(/_/g," ").toUpperCase())+'</span></div><div class="av-detail-row"><span class="av-detail-label">SCOPE</span><span class="av-detail-value">'+x(v.scope||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRANSIT TIME</span><span class="av-detail-value">'+(v.transit_ticks||"?")+' ticks</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE VOLUME</span><span class="av-detail-value">'+D(Number(v.trade_volume||0))+'</span></div><div class="av-detail-row"><span class="av-detail-label">TARIFF</span><span class="av-detail-value">'+Number(v.tariff_rate||0).toFixed(1)+'%</span></div><div class="av-detail-row"><span class="av-detail-label">COMPETITION</span><span class="av-detail-value">'+(v.competition_count??0)+' corps</span></div><div class="av-detail-row"><span class="av-detail-label">DEMAND</span><span class="av-detail-value" style="color:'+w+'">'+(v.demand_level||"?")+"</span></div>"+(v.trade_agreement_name?'<div class="av-detail-row"><span class="av-detail-label">AGREEMENT</span><span class="av-detail-value" style="color:var(--teal)">'+x(v.trade_agreement_name)+"</span></div>":"")+'<div class="av-detail-row"><span class="av-detail-label">CLAIMED</span><span class="av-detail-value">Tick '+(d.claimed_at_tick||"?")+"</span></div>";var p=(he||[]).find(function(C){return C.active_claim_id===d.id});!p&&u==="loading"?l+=`<div style="padding:6px 8px;margin-top:4px;background:rgba(200,168,50,0.06);border:1px solid rgba(200,168,50,0.15);text-align:center;"><div style="font-family:var(--font-mono);font-size:9px;color:var(--orange);font-weight:700;margin-bottom:4px;">NO VESSEL ASSIGNED</div><button class="av-action-btn" style="background:var(--teal);color:#fff;border-color:var(--teal);width:100%;" onclick="event.stopPropagation();openAssignVesselModal('`+d.id+"','"+(v.vessel_class||"")+`')">ASSIGN VESSEL</button></div>`:p&&(l+='<div style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:var(--bg-card);border:1px solid var(--border-main);"><div><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">ASSIGNED VESSEL</div><div style="font-size:11px;font-weight:700;color:var(--text-bright);">'+x(p.vessel_name||"Unknown")+'</div></div><div style="display:flex;gap:10px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(p.fuel>50?"#5c5":p.fuel>20?"#ca5":"#c55")+'">'+(p.fuel||0)+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(p.condition>50?"#5c5":p.condition>30?"#ca5":"#c55")+'">'+(p.condition||0)+"%</div></div></div></div>"),l+=`<button class="av-action-btn release" onclick="event.stopPropagation();avRelease('`+d.id+`')">RELEASE ROUTE</button></div>`}l+="</div>"}s.innerHTML=l}function Br(o,e){const t=(he||[]).filter(function(a){return a.status==="in_port"&&!a.active_claim_id&&a.fuel>=15&&a.condition>=20});let i;t.length===0?i='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No available vessels.<br>Ships must be in port with 15%+ fuel and 20%+ condition.</div>':i=t.map(function(a,r){var s=a.fuel>50?"#5c5":a.fuel>20?"#ca5":"#c55",l=a.condition>50?"#5c5":a.condition>30?"#ca5":"#c55";return`<div style="padding:10px 14px;border-bottom:1px solid var(--border-0);cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="assignVesselToRoute('`+o+"','"+a.id+`')"><div><div style="font-size:14px;font-weight:700;color:var(--text-bright);">`+x(a.vessel_name||"Unnamed")+'</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+x(a.vessel_class||"?")+" · "+(a.capacity_dwt||0).toLocaleString()+' DWT</div></div><div style="display:flex;gap:14px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+s+'">'+a.fuel+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+l+'">'+a.condition+'%</div></div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--teal);padding:4px 12px;border:1px solid var(--teal);cursor:pointer;">ASSIGN</div></div></div>'}).join("");var n=document.createElement("div");n.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;",n.onclick=function(a){a.target===n&&n.remove()},n.innerHTML='<div style="width:560px;max-width:95vw;max-height:80vh;background:var(--bg-panel);border:1px solid var(--border-main);display:flex;flex-direction:column;"><div style="padding:12px 16px;border-bottom:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:space-between;align-items:center;"><span style="font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:var(--teal);">ASSIGN VESSEL</span><span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+t.length+' available</span></div><div style="flex:1;overflow-y:auto;">'+i+`</div><div style="padding:10px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);text-align:right;"><button onclick="this.closest('div[style*=fixed]').remove()" style="padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);background:transparent;border:1px solid var(--border-main);cursor:pointer;">CANCEL</button></div></div>`,document.body.appendChild(n)}async function Pr(o,e){try{var{error:t}=await y.from("corp_vessels").update({status:"in_port",active_claim_id:o}).eq("id",e).eq("faction_id",c.id);if(t){alert("Assignment failed: "+t.message);return}var i=document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]');i&&i.remove(),await Promise.all([Gi(),$e()])}catch(n){alert("Assignment failed: "+(n.message||"Network error"))}}window.openAssignVesselModal=Br;window.assignVesselToRoute=Pr;async function qn(){if(!c){Ge=[],gn();return}const{data:o,error:e}=await y.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",c.id).order("delivered_at_tick",{ascending:!1}).limit(20);e?(console.warn("Failed to load deliveries:",e.message),Ge=[]):Ge=(o||[]).map(t=>{const i=t.construction_contracts||{};return{id:t.contract_id,name:i.name||"Project",type:i.issuer_type||"GOVERNMENT",issuer:i.issuer_name||"Government",delivered:"Tick "+(t.delivered_at_tick||0),result:t.result,quality_score:t.quality_score,rep_change:t.rep_change,financials:{contract_value:t.contract_value||0,bonus:t.quality_bonus||0,penalty:t.penalties||0,payment:t.payment_received||0,total_cost:t.total_cost||0},inspection:t.inspection||{},materials_used:t.materials_used||[],timeline:{expected:t.timeline_expected||0,actual:t.timeline_actual||0,on_time:t.on_time,early:t.timeline_actual<t.timeline_expected}}}),gn()}function Vi(){const o=re.reduce((s,l)=>s+(l.owned||0),0),e=re.reduce((s,l)=>s+(l.deployed||0),0),t=Ma(re),i=o-e;document.getElementById("eq-count").textContent=o+" UNITS",document.getElementById("eq-summary").innerHTML=`
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
        </div>`;const n={};for(const s of re)n[s.equipment_key]=s;let a="";for(let s=1;s<=3;s++){const l=Ft[s],p=yi(s),f=bi===s,d=p.reduce((m,u)=>m+(n[u.key]?.owned||0),0),v=p.reduce((m,u)=>m+(n[u.key]?.deployed||0),0);if(a+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${s})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${f?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${l.color}">${x(l.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${l.color};border:1px solid ${l.color}33;background:${l.color}0a">${l.tag}</span>
            </div>
            ${d>0?`<span class="eq-tier-hdr__count">${v}/${d}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,f)for(const m of p){const u=n[m.key],g=u?.owned||0,b=u?.deployed||0,$=u?.condition||0,h=m.maintenancePerUnit*g,E=g-b,T=g>0&&E===0,S=g>0&&$<65,w=$n($),C=u?.assigned_projects||[],M=C.length>0?C.map(k=>k.contract_name||"Project").join(", ").slice(0,30):g>0&&b>0?b+" project"+(b>1?"s":""):"—";a+=`<div class="eq-row${g===0?" unowned":""}">`,a+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${g===0?" dim":""}">${x(m.name)}</span>
                        ${S?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${g>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${T?"var(--orange)":"var(--green)"}">${E}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${b}/${g}</span>
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
                            <div class="eq-detail__value" style="color:var(--text-muted)">${x(M)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${D(h)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:a+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',a+="</div>"}}document.getElementById("eq-list").innerHTML=a;const r=[1,2,3].map(s=>{const l=Ft[s],p=yi(s).reduce((f,d)=>f+(n[d.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${p>0?l.color+"33":"var(--border-0)"};background:${p>0?l.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${l.color}">${l.tag}</div>
            <div class="eq-footer__tier-count" style="color:${p>0?"var(--text-bright)":"var(--text-dim)"}">${p}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${D(t)}</div>
        </div>
        <div class="eq-footer__tiers">${r}</div>`}function Dr(o){bi=bi===o?-1:o,Vi()}async function Wi(){if(!c)return;const{data:o,error:e}=await y.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",c.id);e?(console.warn("Failed to load equipment:",e.message),re=[]):re=o||[],Vi()}async function jr(){const{data:{user:o}}=await y.auth.getUser();if(!o){window.location.href="login.html";return}const{data:e}=await y.from("factions").select("*").or(`id.eq.${o.id},linked_user_id.eq.${o.id}`);ke=(e||[]).filter(m=>m.nation_id);const t=sessionStorage.getItem("active_faction_id");if(c=ke.find(m=>m.id===t)||ke.find(m=>m.faction_type==="corporation")||ke[0],!c){await y.auth.signOut(),window.location.href="login.html";return}if(c.faction_type!=="corporation"){window.location.href="dashboard.html";return}const i=new URLSearchParams(window.location.search).get("tab"),n=i==="expansion"||i==="actions";if(c.corp_sector!=="Construction"&&!n){const u={Finance:"corp-operations-finance.html",Shipping:"corp-operations-shipping.html"}[c.corp_sector];if(u){window.location.href=u;return}}const[a,r]=await Promise.all([c.nation_id?y.from("nations").select("*").eq("id",c.nation_id).single():Promise.resolve({data:null}),y.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);a.error&&console.warn("Nation load failed:",a.error.message),a.data&&(N=a.data),r.error&&console.warn("Shard load failed:",r.error.message),I=r.data;let s=0;if(c?.id){const{data:m}=await y.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",c.id).in("status",["open","bidding"]);if(m)for(const u of m)s+=(u.contract_bids||[]).length}const l=document.getElementById("corp-topbar-container");if(l){const{renderCorpTopBar:m}=await Na(async()=>{const{renderCorpTopBar:b}=await import("./corp-topbar-BGmUeelO.js");return{renderCorpTopBar:b}},__vite__mapDeps([0,1])),u=new URLSearchParams(window.location.search).get("tab")||"operations",g={};s>0&&(g.home={color:"#c8a832",title:s+" pending bid"+(s!==1?"s":"")+" on your projects"}),m(l,{faction:c,shard:I,activeTab:u,allUserFactions:ke,badges:g})}if(I){if(document.getElementById("game-date").textContent=I.current_date||"—",document.getElementById("tick-number").textContent=I.current_tick||"—",I.next_tick_at){const u=(Number(I.tick_interval_hours)||8)*36e5,g=new Date(I.next_tick_at).getTime(),$=g-u+u/2;_i=new Date($>Date.now()?$:g+u/2),Da()}const m=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");m&&(m.textContent="Next Corp Tick")}const p=document.getElementById("topbar-cash");p&&(p.textContent="CASH: "+Nn(Number(c.corp_cash_reserves??0)));const f=document.getElementById("topbar-ap");f&&(f.style.display="none");const d=document.getElementById("nation-pill");d&&(d.textContent=(N?.name||c.nation||"—").toUpperCase());const v=document.getElementById("corp-faction-dropdown");if(v){let m="";for(const u of ke){const g=u.id===c.id,b=u.faction_type==="corporation"?"CORP":"PARTY",$=u.faction_type==="corporation"?"var(--teal)":"var(--amber)";m+=`<div class="corp-dd-item${g?" active":""}" onclick="switchToFaction('${u.id}', '${u.faction_type}')">
                <span class="corp-dd-type" style="color:${$}">${b}</span>
                <span class="corp-dd-name">${x(u.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${x(u.abbreviation||"—")}]</span>
            </div>`}v.innerHTML=m}try{const{data:m}=await y.from("building_modifiers").select("*");go={};for(const u of m||[])go[u.modifier_key]=u}catch{}await Promise.all([Ae(),Vt(),Li(),Wi(),In(),qn(),eo()]);try{const{data:m}=await y.from("nations").select("*").order("name");Ct=m||[]}catch{Ct=[]}Oi(),Ro(),Aa(c,N,I);try{await Ta(y,{faction:c,nation:N,shard:I},"auto-services-container")}catch(m){console.error("[CorpOps] Auto-services init failed:",m)}if(document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",i==="expansion"){const m=document.querySelector('[data-tab-action="expansion"]');m&&On({preventDefault:()=>{},target:m})}else if(i==="actions"){const m=document.querySelector('[data-tab-action="actions"]');m&&Pn({preventDefault:()=>{},target:m})}}async function Fr(){await y.auth.signOut(),window.location.href="login.html"}function Ur(){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.toggle("open")}function Hr(o,e){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.remove("open"),sessionStorage.setItem("active_faction_id",o),e==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",o=>{const e=document.getElementById("faction-switcher"),t=document.getElementById("corp-faction-dropdown");t&&e&&!e.contains(o.target)&&t.classList.remove("open")});document.addEventListener("keydown",o=>{o.key==="Escape"&&Xt()});window.doLogout=Fr;window.toggleTheme=ja;window.toggleCorpDropdown=Ur;window.switchToFaction=Hr;window.setFilter=Fa;window.arSetFilter=zr;window.arSelectRoute=Mr;window.arClaimRoute=qr;window.arApplyToService=Rr;window.avToggle=Lr;window.avRelease=Or;window.openContractDetail=Cn;window.closeContractDetail=Xt;window.toggleWhRow=pr;window.toggleEqTier=Dr;window.switchEmNation=br;window.setEmType=_r;window.setEmListing=hr;window.setEmQty=$r;window.purchaseEquipment=wr;window.switchPrNation=yr;window.setPrMat=mr;window.setPrTier=ur;window.setPrQty=vr;window.purchaseMaterial=gr;let ae={general:0,skilled:0,innovative:0},ti=!1;const Xe=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function Ln(o){const e=Number(N?.minimum_wage??50),t=Number(N?.inflation??50),i=Number(N?.standard_of_living??50),n=e/100*48e3,a=1+(t-50)/100*.5,r=1+(i-50)/100*.5;return Math.round(n*o*a*r)}function _(o){const e=Math.abs(o),t=o<0?"-":"";return e>=1e9?t+"$"+(e/1e9).toFixed(2)+"B":e>=1e6?t+"$"+(e/1e6).toFixed(2)+"M":e>=1e3?t+"$"+(e/1e3).toFixed(1)+"k":t+"$"+e.toLocaleString()}async function On(o){o.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("actions-content").style.display="none";const e=document.getElementById("expansion-content");e.style.display="flex",e.style.justifyContent="center",e.style.gap="12px",e.style.alignItems="flex-start",e.style.flexWrap="wrap",document.querySelectorAll(".corp-nav-tab").forEach(t=>t.classList.remove("active")),o.target.classList.add("active"),await eo(),Lo(),xs(),await Xi(),Bo(),await Ds(),await Ss(),io(),oo(),await Qs(),no(),await Do(),jo()}function Bn(o){o&&o.preventDefault(),document.getElementById("operations-content").style.display="flex",document.getElementById("expansion-content").style.display="none",document.getElementById("actions-content").style.display="none",document.querySelectorAll(".corp-nav-tab").forEach(e=>e.classList.remove("active")),Gr()?.classList.add("active")}async function Pn(o){o.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("expansion-content").style.display="none",document.getElementById("actions-content").style.display="block",document.querySelectorAll(".corp-nav-tab").forEach(e=>e.classList.remove("active")),(o.target||document.querySelector('[data-tab-action="actions"]'))?.classList.add("active"),await Dn(),St()}function Gr(){return Array.from(document.querySelectorAll(".corp-nav-tab[href]:not([data-tab-action])")).find(o=>{const e=o.getAttribute("href");if(!e)return!1;const t=new URL(e,window.location.href);return t.pathname===window.location.pathname&&!t.searchParams.get("tab")})||null}async function Dn(){if(!c)return;const[o,e]=await Promise.all([y.from("corp_executives").select("*").eq("faction_id",c.id).eq("status","active"),y.from("executive_pool").select("*").eq("nation_id",c.nation_id).eq("status","available").order("skill",{ascending:!1})]);o.error&&console.warn("Failed to load executives:",o.error.message),e.error&&console.warn("Failed to load executive pool:",e.error.message),Ut=o.data||[],Ht=e.data||[];const t=await La({supabase:y,faction:c,currentTick:I?.current_tick||0,poolCandidates:Ht});t?.error&&console.warn("Failed to seed initial executive roster:",t.error.message||t.error),t?.executives&&(Ut=t.executives)}function pt(o){return o>=1e6?"$"+(o/1e6).toFixed(1)+"M":o>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Re(o){return Ut.find(e=>e.role===o)||null}function wo(o,e){return(o||"?")[0]+(e||"?")[0]}function bt(o){return o>=70?"#5cb85c":o>=50?"#ca5":"#c84"}function St(){const o=document.getElementById("actions-container");if(!o)return;const e=c?.faction_name||"Corporation",t=(c?.abbreviation||c?.corp_ticker||"??").toUpperCase();let i="";i+=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:0 2px;">
        <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:2px;color:#8b9a6b;text-transform:uppercase;">Actions</span>
            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${x(e)} &middot; ${x(t)}</span>
        </div>
    </div>`,i+='<div style="display:flex;gap:8px;">',i+='<div style="width:262px;display:flex;flex-direction:column;gap:5px;flex-shrink:0;">';for(let n=0;n<uo.length;n++){const a=uo[n],r=vo[a],s=Re(a),l=yt===n,p=r.color,f=!s;if(i+=`<div onclick="actSelectExec(${n})" style="
            padding:10px 12px;
            background:${l?p+"0a":"var(--bg-2,#1a1a17)"};
            border:1px solid ${l?p+"44":"var(--border-0,rgba(255,255,255,0.06))"};
            border-left:3px solid ${l?p:"var(--border-0,rgba(255,255,255,0.06))"};
            cursor:pointer;
        ">`,f&&a!=="CEO")i+=`<div style="display:flex;align-items:center;gap:10px;">
                <div style="width:45px;height:45px;background:rgba(255,255,255,0.02);border:1px dashed rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);flex-shrink:0;">?</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:4px;">
                        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${p};">${x(a)}</span>
                    </div>
                    <div style="font-size:13px;font-weight:600;color:var(--text-dim);margin-top:2px;">VACANT</div>
                    <div style="margin-top:4px;">
                        <span onclick="event.stopPropagation();openExecSearch('${a}')" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:3px 8px;color:#5a8aaa;border:1px solid rgba(90,138,170,0.25);background:rgba(90,138,170,0.06);cursor:pointer;">EXECUTIVE SEARCH</span>
                    </div>
                </div>
            </div>`;else{const d=s?`${s.first_name} ${s.last_name}`:"—",v=s?s.age:0,m=s?s.skill:0,u=s?s.salary_per_year:0,g=s?wo(s.first_name,s.last_name):"—";i+=`<div style="display:flex;align-items:center;gap:10px;">
                <div style="width:45px;height:45px;background:${p}15;border:1px solid ${p}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:14px;font-weight:700;color:${p};flex-shrink:0;">${x(g)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:4px;">
                        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${p};">${x(a)}</span>
                    </div>
                    <div style="font-size:13px;font-weight:600;color:${l?"var(--text-bright,#f0efe6)":"var(--text-muted,#666)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x(d)}${v?` <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">(${v})</span>`:""}</div>
                    <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:3px;flex:1;">
                            <div style="flex:1;height:3px;background:var(--border-0,rgba(255,255,255,0.06));">
                                <div style="width:${m}%;height:100%;background:${bt(m)};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);width:18px;text-align:right;">${m}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${pt(u)}/yr</span>
                    </div>
                </div>
            </div>`}i+="</div>"}i+="</div>",i+=`<div style="flex:1;display:flex;flex-direction:column;gap:0;">
        <div id="actions-right-panel"></div>
    </div>`,i+="</div>",o.innerHTML=i,Wr()}const jn={CEO:[{id:"statement",name:"Issue Statement",desc:"Issue a press release to the public events feed. Other players and media corps see it. Cost scales with CEO skill.",cost:"~$20k",costColor:"#5cb85c",tags:["REPUTATION"],cooldown:"once/tick"},{id:"ipo",name:"IPO",desc:"Take the corporation public. Sell ~30% of shares for a massive cash injection. Permanent loss of full control.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["STRUCTURAL"],locked:!0,lockReason:"Coming soon"},{id:"bankruptcy",name:"Declare Bankruptcy",desc:"The CEO officially files for bankruptcy, ceasing all operations. Outstanding loans will be repaid up to 50% of the corporation's market valuation.",descRed:"This will dissolve your corporation. Loans will be paid back, and you will need to found a new corporation. There is a 24 tick cooldown on declaring bankruptcy.",cost:"IRREVERSIBLE",costColor:"#c55",tags:["IRREVERSIBLE"]}],CFO:[{id:"loan",name:"Request Loan",desc:"Submit a loan application to all finance corporations. Set amount, purpose, term, and collateral. Receive competing offers.",cost:"FREE",costColor:"#5cb85c",tags:["FINANCIAL"]}],COO:[{id:"restructure",name:"Restructure Operations",desc:"Lay off 10-20% of workforce, cut ~7% of debt. Reputation hit scales with COO skill — high skill minimizes damage.",cost:"FREE",costColor:"#5cb85c",tags:["OPERATIONAL"],cooldown:"once/tick"}],CTO:[{id:"research",name:"Begin Research",desc:"Start researching a tech tree node. Opens the tech tree interface.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["INNOVATION"],locked:!0,lockReason:"Coming soon"}],CMO:[{id:"rebrand",name:"Rebrand Corporation",desc:"Change name and abbreviation. Cost and reputation hit scale with CMO skill — high skill reduces both.",cost:"~$20M",costColor:"#ca5",tags:["STRUCTURAL"],cooldown:"once/tick"}],CLO:[{id:"sue_corp",name:"Sue Corporation",desc:"File a lawsuit against another corporation for patent infringement, contract breach, or predatory practices.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["LEGAL"],locked:!0,lockReason:"Coming soon"}],Lobbyist:[{id:"donate",name:"Political Donation",desc:"Donate $1M to a political party in the nation where your National HQ is located. The target party receives $100k in party funds. You cannot donate to your own party.",cost:"$1M",costColor:"#ca5",tags:["POLITICAL"],cooldown:"once/tick"}]};function Zt(o){return 1.5-o/100}let Fn={};function Vr(o){const e=I?.current_tick||0;return Fn[o]===e}function _t(o){const e=I?.current_tick||0;Fn[o]=e}function Wr(){const o=document.getElementById("actions-right-panel");if(!o)return;const e=uo[yt],t=vo[e],i=Re(e),n=jn[e]||[];if(!i){o.innerHTML=`<div style="padding:48px;text-align:center;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));">
            <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${t.color};margin-bottom:6px;">${x(e)}</div>
            <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-bottom:14px;">${x(t.fullTitle)}</div>
            <div style="font-size:16px;color:var(--text-muted);margin-bottom:20px;">This position is vacant. Hire an executive to unlock actions.</div>
            <div onclick="openExecSearch('${e}')" style="display:inline-block;padding:8px 24px;font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">EXECUTIVE SEARCH</div>
        </div>`;return}let a="";a+=`<div style="padding:14px 20px;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-bottom:none;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:56px;height:56px;background:${t.color}15;border:1px solid ${t.color}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:18px;font-weight:700;color:${t.color};">${x(wo(i.first_name,i.last_name))}</div>
            <div>
                <div style="display:flex;align-items:baseline;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:22px;font-weight:700;color:${t.color};">${x(e)}</span>
                    <span style="font-size:19px;font-weight:700;color:var(--text-bright,#f0efe6);">${x(i.first_name)} ${x(i.last_name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-top:2px;">${x(t.fullTitle)}</div>
            </div>
        </div>
        <div style="display:flex;gap:16px;align-items:center;">
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SKILL</div>
                <div style="display:flex;align-items:center;gap:5px;margin-top:2px;">
                    <div style="width:50px;height:4px;background:var(--border-0,rgba(255,255,255,0.06));">
                        <div style="width:${i.skill}%;height:100%;background:${bt(i.skill)};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${bt(i.skill)};">${i.skill}</span>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SALARY</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${pt(i.salary_per_year)}/yr</div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">CONTRACT</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${i.contract_years}yr</div>
            </div>
            ${e!=="CEO"?`<div style="text-align:right;">
                <span onclick="event.stopPropagation();confirmFireExec('${i.id}','${x(e)}','${x(i.first_name+" "+i.last_name)}',${i.salary_per_year},${i.contract_end_tick||0})" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:5px 12px;color:#d9534f;border:1px solid rgba(217,83,79,0.25);background:rgba(217,83,79,0.06);cursor:pointer;">FIRE</span>
            </div>`:""}
        </div>
    </div>`,a+='<div style="background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:1px solid var(--border-0,rgba(255,255,255,0.06));flex:1;">';for(let r=0;r<n.length;r++){const s=n[r],l=!!s.locked;a+=`<div onmouseenter="this.dataset.hover='1';this.style.background='${l?"transparent":t.color+"06"}'" onmouseleave="this.dataset.hover='';this.style.background='transparent';var eb=this.querySelector('.act-exec-btn');if(eb)eb.style.display='none'" style="
            padding:16px 20px;
            ${r<n.length-1?"border-bottom:1px solid var(--border-0,rgba(255,255,255,0.06));":""}
            opacity:${l?"0.4":"1"};
            cursor:${l?"not-allowed":"pointer"};
        ">`,a+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;font-weight:700;color:${l?"var(--text-dim)":"var(--text-bright,#f0efe6)"};">${x(s.name)}</span>`;for(const p of s.tags)a+=`<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.3px;padding:2px 6px;line-height:14px;color:${p==="IRREVERSIBLE"?"#c55":p==="OFFENSIVE"?"#c84":p==="STRUCTURAL"?"#ca5":p==="POLITICAL"?"#8a6aaa":"var(--text-dim)"};background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));">${x(p)}</span>`;a+=`</div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${s.costColor};">${x(s.cost)}</span>
            </div>
        </div>`,a+=`<div style="font-size:14px;color:${l?"var(--text-dim)":"var(--text-muted,#666)"};line-height:1.6;">${x(s.desc)}</div>`,s.descRed&&(a+=`<div style="font-size:13px;color:#c55;line-height:1.6;margin-top:4px;">${x(s.descRed)}</div>`),l&&s.lockReason&&(a+=`<div style="margin-top:6px;font-family:var(--font-mono);font-size:11px;color:#c84;display:flex;align-items:center;gap:4px;">
                <span>&#8856;</span><span>${x(s.lockReason)}</span>
            </div>`),l||(a+=`<div class="act-exec-btn" style="display:none;margin-top:10px;text-align:right;">
                <span onclick="event.stopPropagation();actExecute('${s.id}','${e}')" style="display:inline-block;padding:6px 24px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${t.color};cursor:pointer;">EXECUTE</span>
            </div>`),a+="</div>"}a+="</div>",a+=`<div style="padding:8px 20px;background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:none;">
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">
            <span style="color:${t.color};font-weight:700;">${x(e)}</span> skill (${i.skill}/100) affects action outcomes.
            ${i.skill>=70?" High skill increases success probability and reduces costs.":i.skill>=50?" Moderate skill — outcomes are average. Consider recruiting a stronger executive.":" Low skill — actions are less effective and more expensive. Replacement recommended."}
        </div>
    </div>`,o.innerHTML=a,o.querySelectorAll("[onmouseenter]").forEach(r=>{r.addEventListener("mouseenter",function(){const s=this.querySelector(".act-exec-btn");s&&(s.style.display="block")}),r.addEventListener("mouseleave",function(){const s=this.querySelector(".act-exec-btn");s&&(s.style.display="none")})})}function Yr(o,e,t,i,n){const a=I?.current_tick||0,r=Math.max(0,n-a),s=Math.round(i*(r/12)),l=`FIRE ${e}: ${t}

Contract remaining: ${r} ticks
Payout (prorated): $${(s/1e6).toFixed(2)}M

This amount will be deducted from your cash reserves immediately.

Are you sure?`;confirm(l)&&Qr(o,e,s)}async function Qr(o,e,t){try{const i=Number(c?.corp_cash_reserves??0);if(i<t){alert(`Insufficient funds. You need $${(t/1e6).toFixed(2)}M but only have $${(i/1e6).toFixed(2)}M.`);return}const n=i-t,{error:a}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",c.id);if(a){alert("Failed to process payout: "+a.message);return}const{error:r}=await y.from("corp_executives").update({status:"fired",updated_at:new Date().toISOString()}).eq("id",o);if(r){await y.from("factions").update({corp_cash_reserves:i}).eq("id",c.id),alert("Failed to fire executive: "+r.message);return}c.corp_cash_reserves=n,Ut=Ut.filter(s=>s.id!==o),St()}catch(i){console.error("[CorpOps] Fire executive error:",i),alert("An error occurred.")}}function Kr(o,e){if((jn[e]||[]).find(i=>i.id===o)?.cooldown==="once/tick"&&Vr(o)){alert("This action can only be used once per tick. Wait for the next tick.");return}switch(o){case"statement":return Un();case"loan":return Vn();case"restructure":return Yn();case"rebrand":return Qn();case"donate":return Kn();case"bankruptcy":return Hn()}}let Ci=!1;function Un(){if(Ci)return;Ci=!0;const o=document.createElement("div");o.id="stmt-overlay",o.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",o.onclick=function(l){l.target===o&&Yi()};const e=c?.faction_name||"Corporation",t=(c?.abbreviation||c?.corp_ticker||"??").toUpperCase(),i=Number(c?.corp_cash_reserves??0),n=Re("CEO"),a=n?`${n.first_name} ${n.last_name}`:"CEO";o.innerHTML=`<div onclick="event.stopPropagation()" style="width:480px;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">
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
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${x(t)}</span>
                <span style="font-size:10px;color:#e8e4dc;">${x(e)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">&middot; ${x(a)}</span>
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
    </div>`,document.body.appendChild(o);const r=document.getElementById("stmt-text"),s=document.getElementById("stmt-chars");r&&s&&(r.addEventListener("input",function(){s.textContent=this.value.length+"/500"}),r.focus())}function Yi(){const o=document.getElementById("stmt-overlay");o&&o.remove(),Ci=!1}let Nt=!1;async function Jr(){if(!c||!I||Nt)return;const o=document.getElementById("stmt-text"),e=document.getElementById("stmt-error"),t=(o?.value||"").trim();if(!t){e&&(e.textContent="Statement cannot be empty.",e.style.display="block");return}if(t.length>500){e&&(e.textContent="Statement too long (max 500 chars).",e.style.display="block");return}const i=Re("CEO"),n=i?i.skill:50,a=Math.round(2e4*Zt(n)),r=Number(c.corp_cash_reserves??0);if(r<a){e&&(e.textContent="Insufficient cash. Need "+_(a)+".",e.style.display="block");return}Nt=!0;const s=document.getElementById("stmt-submit-btn");s&&(s.style.opacity="0.4",s.style.pointerEvents="none");const l=c.faction_name||"Corporation",p=i?`${i.first_name} ${i.last_name}`:"CEO",f=I.current_tick||0,{error:d}=await y.from("factions").update({corp_cash_reserves:r-a}).eq("id",c.id);if(d){Nt=!1,e&&(e.textContent="Failed to deduct cost: "+d.message,e.style.display="block"),s&&(s.style.opacity="1",s.style.pointerEvents="auto");return}const{error:v}=await y.from("event_log").insert({nation_id:c.nation_id,faction_id:c.id,event_name:l+" — Press Release",description_used:p+", CEO of "+l+': "'+t.replace(/[<>"]/g,"")+'"',category:"business",trigger_key:"ceo_statement",effects_applied:{cost:a,ceo:p,skill:n},fired_at_tick:f});if(v){await y.from("factions").update({corp_cash_reserves:r}).eq("id",c.id),Nt=!1,e&&(e.textContent="Failed to publish: "+v.message,e.style.display="block"),s&&(s.style.opacity="1",s.style.pointerEvents="auto");return}c.corp_cash_reserves=r-a,Nt=!1,_t("statement"),Yi()}const bn=24,Xr=.5;async function Zr(o,e){const t=e-bn,{data:i}=await y.from("event_log").select("fired_at_tick, effects_applied").eq("trigger_key","corp_bankruptcy").gte("fired_at_tick",t).order("fired_at_tick",{ascending:!1}).limit(20),n=(i||[]).find(r=>r.effects_applied?.user_id===o),a=n?Math.max(0,n.fired_at_tick+bn-e):0;return{onCooldown:a>0,ticksLeft:a}}let oi=!1;async function Hn(){if(oi)return;const{data:{user:o}}=await y.auth.getUser();if(!o){alert("Not logged in.");return}const e=c?.id||sessionStorage.getItem("active_faction_id");if(!e){alert("No active faction selected.");return}const{data:t,error:i}=await y.from("factions").select("*").eq("id",e).eq("faction_type","corporation").is("abandoned_at",null).single();if(i||!t){alert("No active corporation found. It may have already been dissolved.");return}const n=t,a=n.faction_name||"this corporation",{data:r,error:s}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single();if(s||!r){alert("Failed to read game tick. Please try again.");return}const l=r.current_tick||0,{onCooldown:p,ticksLeft:f}=await Zr(o.id,l);if(p){alert("Bankruptcy is on cooldown. You must wait "+f+" more tick"+(f!==1?"s":"")+" before declaring bankruptcy again.");return}if(!confirm("DECLARE BANKRUPTCY — "+a.toUpperCase()+`?

This will permanently:
• Dissolve the corporation
• Delete all properties, equipment, and inventory
• Pay back outstanding loans (up to 50% of market valuation)
• Remove all remaining cash reserves

You will need to found a new corporation.
There is a 24 tick cooldown on declaring bankruptcy.

This action CANNOT be undone.`))return;if(prompt('Type "BANKRUPT" to confirm bankruptcy of '+a+":")!=="BANKRUPT"){alert("Bankruptcy cancelled.");return}oi=!0;try{async function v(P){const{error:U}=await P;if(U)throw U}const m=Number(n.corp_cash_reserves)||0,{data:u}=await y.from("corp_properties").select("purchase_price, condition").eq("faction_id",e);let g=0;for(const P of u||[])g+=Math.round(Number(P.purchase_price||0)*(Number(P.condition||0)/100));const b=m+g,$=Number(n.corp_loans)||0,h=b-$,E=Math.round(h*1.3),T=Math.max(0,Math.round(E*Xr)),{data:S}=await y.from("finance_active_loans").select("*").eq("borrower_faction_id",e).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!0});let w=0;for(const P of S||[]){const U=P.principal-P.total_paid;if(U<=0)continue;const F=Math.min(U,T-w);if(F<=0)break;const{data:oe}=await y.from("factions").select("corp_cash_reserves").eq("id",P.lender_faction_id).single();oe&&await v(y.from("factions").update({corp_cash_reserves:(Number(oe.corp_cash_reserves)||0)+F}).eq("id",P.lender_faction_id)),await v(y.from("finance_active_loans").update({status:"repaid",total_paid:P.total_paid+F,completed_tick:l}).eq("id",P.id)),w+=F}await v(y.from("contract_bids").delete().eq("faction_id",e)),await v(y.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",e).in("status",["open","bidding"])),await v(y.from("corp_equipment_deliveries").delete().eq("faction_id",e)),await v(y.from("corp_equipment").delete().eq("faction_id",e)),await v(y.from("corp_properties").delete().eq("faction_id",e)),await y.from("corp_material_inventory").delete().eq("faction_id",e),await y.from("corp_warehouse").delete().eq("faction_id",e),await y.from("corp_executives").delete().eq("faction_id",e),await y.from("faction_agitators").delete().eq("faction_id",e),await v(y.from("factions").delete().eq("id",e));const C=w>0?" $"+w.toLocaleString()+" was repaid to creditors.":"";await v(y.from("event_log").insert({nation_id:n.nation_id,faction_id:e,event_name:a+" — Bankruptcy",description_used:a+" has officially filed for bankruptcy. It has laid off its executive staff and ceased operations."+C,category:"business",trigger_key:"corp_bankruptcy",effects_applied:{corp_name:a,sector:n.corp_sector,user_id:o.id,loan_payback:w,valuation:E},fired_at_tick:l})),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:M}=await y.from("factions").select("id, faction_type").or(`id.eq.${o.id},linked_user_id.eq.${o.id}`),k=(M||[]).find(P=>P.faction_type==="party"),z=(M||[]).find(P=>P.faction_type==="corporation"),q=w>0?`
$`+w.toLocaleString()+" repaid to creditors.":"";k?(sessionStorage.setItem("active_faction_id",k.id),alert(a+" has declared bankruptcy."+q+`

Redirecting to your political party.`),window.location.href="dashboard.html"):z?(sessionStorage.setItem("active_faction_id",z.id),alert(a+" has declared bankruptcy."+q+`

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(a+" has declared bankruptcy."+q+`

You have no remaining factions.`),window.location.href="faction-select.html")}catch(v){alert("Bankruptcy failed: "+(v.message||v)+`

Please try again or contact support.`)}finally{oi=!1}}const Gn=[{id:"equipment",label:"Equipment Acquisition",desc:"Purchase vehicles, cranes, or heavy machinery",icon:"&#9881;"},{id:"working",label:"Working Capital",desc:"Bridge financing for active project costs",icon:"$"},{id:"property",label:"Property Purchase",desc:"Acquire office, warehouse, or HQ building",icon:"&#9632;"},{id:"subsidiary",label:"Subsidiary Expansion",desc:"Fund new subsidiary establishment",icon:"&#9672;"},{id:"materials",label:"Material Procurement",desc:"Bulk material purchase for upcoming projects",icon:"&#9638;"}],ii=[{id:"none",label:"None",desc:"Unsecured — lenders may charge higher rates",risk:"HIGH",riskColor:"#c84"},{id:"equipment",label:"Equipment",desc:"Financed equipment serves as collateral",risk:"MODERATE",riskColor:"#ca5"},{id:"property",label:"Property",desc:"Corporate property lien",risk:"LOW",riskColor:"#8b9a6b"},{id:"full",label:"Full Assets",desc:"All corporate assets — maximum lender security",risk:"MINIMAL",riskColor:"#5c5"}];let ie=25e7,Wt="equipment",ht=48,fe="equipment",ko="",Mt=[];function Vn(){ie=25e7,Wt="equipment",ht=48,fe="equipment",ko="",document.getElementById("lr-overlay").style.display="flex",ns(),zt()}function Wn(){document.getElementById("lr-overlay").style.display="none"}function es(o){ie=Math.max(1e6,Math.min(5e9,Number(o)||0)),zt()}function ts(o){Wt=o,zt()}function os(o){ht=o,zt()}function is(o){fe=o,zt()}async function ns(){if(!c)return;const{data:o}=await y.from("factions").select("id, faction_name, abbreviation, corp_ticker, corp_company_type").eq("faction_type","corporation").eq("corp_sector","Finance").is("abandoned_at",null).neq("id",c.id);Mt=o||[],zt()}function zt(){const o=document.getElementById("lr-modal-content");if(!o)return;const e=Number(c?.corp_cash_reserves??0),t=Number(c?.corp_loans??0),i=Number(c?.corp_reputation??50),n=c?.faction_name||"Corporation",a=(c?.abbreviation||c?.corp_ticker||"??").toUpperCase(),r=t+ie,s=r>e*3?"#c55":r>e*1.5?"#c84":r>e?"#ca5":"#5c5",l=r>e*3?"DANGEROUS":r>e*1.5?"HEAVY":r>e?"MODERATE":"HEALTHY",p=fe==="none"?"10-16%":fe==="equipment"?"7-12%":fe==="property"?"5-9%":"4-7%",d=Math.round(ie*(fe==="none"?.13:fe==="equipment"?.095:fe==="property"?.07:.055)/12+ie/ht),v=ii.find(u=>u.id===fe)||ii[0];let m="";m+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
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
            <span style="font-size:10px;color:#e8e4dc;">${x(n)}</span>
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
        <div style="display:flex;flex-direction:column;gap:3px;">`;for(const u of Gn){const g=Wt===u.id;m+=`<div onclick="lrSetPurpose('${u.id}')" style="display:flex;align-items:center;gap:8px;padding:5px 10px;cursor:pointer;background:${g?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${g?"#5a8aaa44":"#2a2a24"};border-left:2px solid ${g?"#5a8aaa":"transparent"};">
            <span style="font-family:var(--font-mono);font-size:10px;color:${g?"#5a8aaa":"#6a6660"};width:14px;text-align:center;">${u.icon}</span>
            <div><div style="font-size:11px;font-weight:600;color:${g?"#e8e4dc":"#9e9a92"};">${u.label}</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${u.desc}</div></div>
        </div>`}m+="</div></div>",m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">PREFERRED TERM</span>
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;">${ht} months</span>
        </div>
        <div style="display:flex;gap:3px;">`;for(const u of[12,24,36,48,60,84,120]){const g=ht===u;m+=`<span onclick="lrSetTerm(${u})" style="flex:1;text-align:center;padding:4px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;color:${g?"#000":"#6a6660"};background:${g?"#5a8aaa":"transparent"};border:1px solid ${g?"#5a8aaa":"#2a2a24"};">${u}</span>`}m+='</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Lenders may offer different terms. This is your preference, not a guarantee.</div></div>',m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">COLLATERAL OFFERED</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">`;for(const u of ii){const g=fe===u.id;m+=`<div onclick="lrSetCollateral('${u.id}')" style="padding:6px 8px;cursor:pointer;background:${g?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${g?"#5a8aaa44":"#2a2a24"};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${g?"#5a8aaa":"#6a6660"};">${u.label}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:${u.riskColor};">${u.risk} RISK</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${u.desc}</div>
        </div>`}if(m+="</div></div>",m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">NOTE TO LENDERS (OPTIONAL)</div>
        <textarea id="lr-note" rows="2" maxlength="300" onchange="lrNote=this.value"
            placeholder="e.g., Expanding into Heavy Infrastructure. Equipment purchase will generate $12M+ in annual contract revenue."
            style="width:100%;padding:6px 8px;font-family:var(--font-ui);font-size:10px;color:#e8e4dc;background:#1c1c18;border:1px solid #2a2a24;outline:none;resize:none;box-sizing:border-box;line-height:1.5;">${x(ko)}</textarea>
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
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c55;">${_(r)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:4px 0;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEBT HEALTH</span>
                <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${s};background:${s}12;border:1px solid ${s}25;">${l}</span>
            </div>
        </div>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">This request will be sent to</div>`,Mt.length>0){m+='<div style="display:flex;flex-direction:column;gap:3px;">';for(const u of Mt){const g=(u.corp_company_type||"").toLowerCase()==="state"?"#c84":(u.corp_company_type||"").toLowerCase()==="public"?"#5c5":"#c8a832";m+=`<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:#1c1c18;border:1px solid #2a2a24;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c8a832;">${x((u.abbreviation||u.corp_ticker||"??").toUpperCase())}</span>
                <span style="font-size:10px;color:#e8e4dc;flex:1;">${x(u.faction_name)}</span>
                ${u.corp_company_type?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${g};background:${g}12;border:1px solid ${g}25;">${x(u.corp_company_type.toUpperCase())}</span>`:""}
            </div>`}m+="</div>"}else m+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No finance corporations in this nation yet.</div>';m+='<div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">All finance corporations in your nation will see this request. You choose which offer to accept.</div></div>',m+=`<div style="padding:8px 16px;">
        <div style="padding:6px 10px;background:rgba(90,138,170,0.04);border:1px solid rgba(90,138,170,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#5a8aaa;letter-spacing:0.8px;margin-bottom:4px;">ESTIMATED MARKET TERMS</div>
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. RATE RANGE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#e8e4dc;">${p}</div></div>
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. MONTHLY PAYMENT</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#e8e4dc;">~${_(d)}</div></div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Estimates based on collateral offer and current market rates. Actual terms set by each lender.</div>
        </div>
    </div>`,m+="</div>",m+=`<div style="padding:10px 16px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:12px;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">REQUESTING</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5a8aaa;">${_(ie)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">COLLATERAL</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#e8e4dc;">${v.label}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">SENT TO</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#9e9a92;">${Mt.length} lender${Mt.length!==1?"s":""}</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="lrClose()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="lr-submit-btn" onclick="lrSubmit()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">SUBMIT REQUEST</div>
        </div>
    </div>`,m+='<div id="lr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>',o.innerHTML=m}let so=!1;async function as(){if(!c||!I||so)return;const o=document.getElementById("lr-error");if(ie<1e6){o.textContent="Minimum loan amount is $1M.",o.style.display="block";return}if(ie>5e9){o.textContent="Maximum loan amount is $5B.",o.style.display="block";return}const t=((Gn.find(r=>r.id===Wt)||{}).label||Wt)+(ko?" — "+ko:""),i=document.getElementById("lr-submit-btn");so=!0,i.style.opacity="0.5",i.style.pointerEvents="none";const n=I.current_tick||0,{error:a}=await y.from("finance_loan_requests").insert({requesting_faction_id:c.id,nation_id:c.nation_id,amount:ie,term_months:ht,purpose:t,created_tick:n,expires_tick:n+5});if(i.style.opacity="1",i.style.pointerEvents="auto",a){so=!1,o.textContent="Failed to submit: "+a.message,o.style.display="block",i.style.opacity="1",i.style.pointerEvents="auto";return}so=!1,Wn()}function Yn(){if(!c)return;const o=Number(c.corp_loans??0),e=Number(c.corp_reputation??50),t=Number(c.corp_general_workforce??0),i=Number(c.corp_skilled_workforce??0),n=Number(c.corp_innovative_workforce??0),a=t+i+n;if(a===0){alert("Cannot restructure — no employees to lay off.");return}const r=Re("COO"),s=r?r.skill:50,l=Zt(s),p=10+Math.floor(Math.random()*11),f=Math.round(a*p/100),d=Math.round(o*.07),v=Math.round(d*(2-l)),m=3+Math.floor(Math.random()*10),u=Math.max(1,Math.round(m*l)),g=Math.round(t/a*f),b=Math.round(i/a*f),$=Math.max(0,Math.min(n,f-g-b)),h=document.createElement("div");h.id="restr-overlay",h.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",h.onclick=function(E){E.target===h&&Qi()},h.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">
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
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Skilled: ${i} &rarr; ${i-b}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${b}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Innovative: ${n} &rarr; ${n-$}</span>
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
            <div id="restr-btn" onclick="actSubmitRestructure(${p},${v},${u},${g},${b},${$})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#8b9a6b;cursor:pointer;">RESTRUCTURE</div>
        </div>
        <div id="restr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(h)}function Qi(){const o=document.getElementById("restr-overlay");o&&o.remove()}let lo=!1;async function rs(o,e,t,i,n,a){if(!c||!I||lo)return;lo=!0;const r=document.getElementById("restr-btn");r&&(r.style.opacity="0.4",r.style.pointerEvents="none");const s=Number(c.corp_general_workforce??0),l=Number(c.corp_skilled_workforce??0),p=Number(c.corp_innovative_workforce??0),f=Number(c.corp_loans??0),d=Number(c.corp_reputation??50),v={corp_general_workforce:Math.max(0,s-i),corp_skilled_workforce:Math.max(0,l-n),corp_innovative_workforce:Math.max(0,p-a),corp_loans:Math.max(0,f-e),corp_reputation:Math.max(0,d-t)},{error:m}=await y.from("factions").update(v).eq("id",c.id);if(m){lo=!1;const b=document.getElementById("restr-error");b&&(b.textContent="Failed: "+m.message,b.style.display="block"),r&&(r.style.opacity="1",r.style.pointerEvents="auto");return}Object.assign(c,v);const u=I.current_tick||0,{error:g}=await y.from("event_log").insert({nation_id:c.nation_id,faction_id:c.id,event_name:(c.faction_name||"Corporation")+" — Restructuring",description_used:(c.faction_name||"A corporation")+" has announced a restructuring, laying off "+o+"% of its workforce.",category:"business",trigger_key:"corp_restructure",effects_applied:{layoff_pct:o,debt_cut:e,rep_loss:t},fired_at_tick:u});g&&console.warn("Failed to log restructure event:",g.message),lo=!1,_t("restructure"),Qi(),St()}function Qn(){const o=Re("CMO"),e=o?o.skill:50,t=Zt(e),i=Math.round(2e7*t),n=Math.max(1,Math.round(5*t)),a=Number(c?.corp_cash_reserves??0),r=Number(c?.corp_reputation??50),s=c?.faction_name||"",l=c?.abbreviation||c?.corp_ticker||"",p=document.createElement("div");p.id="rebrand-overlay",p.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",p.onclick=function(f){f.target===p&&Ki()},p.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">
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
            <input id="rebrand-name" type="text" maxlength="40" value="${x(s)}" placeholder="Corporation name"
                style="width:100%;padding:6px 10px;font-family:var(--font-ui);font-size:12px;color:#e8e4dc;background:#1c1c18;border:1px solid #2a2a24;outline:none;box-sizing:border-box;" />
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-top:10px;margin-bottom:6px;">NEW ABBREVIATION / TICKER</div>
            <input id="rebrand-abbr" type="text" maxlength="5" value="${x(l)}" placeholder="e.g. SZC" style="width:100px;padding:6px 10px;font-family:var(--font-mono);font-size:12px;font-weight:700;color:#c8a832;background:#1c1c18;border:1px solid #2a2a24;outline:none;text-transform:uppercase;" />
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
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${n} (${r} &rarr; ${Math.max(0,r-n)})</span>
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
    </div>`,document.body.appendChild(p)}function Ki(){const o=document.getElementById("rebrand-overlay");o&&o.remove()}let co=!1;async function ss(o,e){if(!c||!I||co)return;const t=o||2e7,i=e||5,n=document.getElementById("rebrand-error"),a=(document.getElementById("rebrand-name")?.value||"").trim().replace(/[<>"]/g,""),r=(document.getElementById("rebrand-abbr")?.value||"").trim().toUpperCase().replace(/[<>"]/g,"");if(!a||a.length<2){n&&(n.textContent="Name must be at least 2 characters.",n.style.display="block");return}if(!r||r.length<2||r.length>5){n&&(n.textContent="Abbreviation must be 2-5 characters.",n.style.display="block");return}const s=Number(c.corp_cash_reserves??0);if(s<t){n&&(n.textContent="Insufficient cash. Need "+_(t)+".",n.style.display="block");return}co=!0;const l=document.getElementById("rebrand-btn");l&&(l.style.opacity="0.4",l.style.pointerEvents="none");const p=Number(c.corp_reputation??50),f=c.faction_name||"Corporation",{error:d}=await y.from("factions").update({faction_name:a,abbreviation:r,corp_ticker:r,corp_cash_reserves:s-t,corp_reputation:Math.max(0,p-i)}).eq("id",c.id);if(d){co=!1,n&&(n.textContent="Failed: "+d.message,n.style.display="block"),l&&(l.style.opacity="1",l.style.pointerEvents="auto");return}c.faction_name=a,c.abbreviation=r,c.corp_ticker=r,c.corp_cash_reserves=s-t,c.corp_reputation=Math.max(0,p-i);const v=I.current_tick||0,{error:m}=await y.from("event_log").insert({nation_id:c.nation_id,faction_id:c.id,event_name:"Corporation Rebranded",description_used:f+" has rebranded to "+a+" ("+r+"). The rebrand costs $20M and reputation takes a temporary hit.",category:"corporate",trigger_key:"corp_rebrand",effects_applied:{old_name:f,new_name:a,new_abbr:r,rep_loss:i,cost:t},fired_at_tick:v});m&&console.warn("Failed to log rebrand event:",m.message),co=!1,_t("rebrand"),Ki(),St(),document.getElementById("corp-name-bar").textContent=a;const u=document.getElementById("corp-logo");u&&(u.textContent=r.slice(0,2))}const ls={liberty:"#9C27B0",equality:"#E91E63",freedom:"#5b9bd5",security:"#d48a3c",individualism:"#eab308",collectivism:"#ec4899",tradition:"#795548",progress:"#00BCD4",nationalism:"#FF5722",globalism:"#3F51B5"};function st(o){return ls[(o||"").toLowerCase()]||"#9C27B0"}let Ve=[],ze=-1;async function Kn(){Number(c?.corp_cash_reserves??0);const o=[c.nation_id],e=new Set(ke.map(n=>n.id)),{data:t}=await y.from("factions").select("id, faction_name, abbreviation, party_color, party_funds, seats, momentum, nation, nation_id, leader_ideology, linked_user_id, ideology_value_1, ideology_value_2").eq("faction_type","party").in("nation_id",o).is("abandoned_at",null).order("seats",{ascending:!1});Ve=(t||[]).filter(n=>!e.has(n.id)).map(n=>({...n})),ze=-1;const i=document.createElement("div");i.id="donate-overlay",i.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",i.onclick=function(n){n.target===i&&Ji()},document.body.appendChild(i),Jn()}function Ji(){const o=document.getElementById("donate-overlay");o&&o.remove(),Ve=[],ze=-1}function cs(o){ze=o,Jn()}function Jn(){const o=document.getElementById("donate-overlay");if(!o)return;const e=Re("Lobbyist"),t=e?e.skill:50,i=Math.round(1e6*Zt(t)),n=1e5,a=Number(c?.corp_cash_reserves??0),r=ze>=0?Ve[ze]:null,s=a>=i;let l='<div onclick="event.stopPropagation()" style="width:540px;max-height:80vh;background:#1a1a16;border:1px solid #2a2a24;display:flex;flex-direction:column;overflow:hidden;">';l+=`<div style="padding:14px 20px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
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
    </div>`,l+='<div style="flex:1;overflow-y:auto;padding:10px 0;">',l+='<div style="padding:0 20px 8px;font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Select a Party</div>',Ve.length===0&&(l+='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#6a6660;">No eligible parties found.</div>');for(let p=0;p<Ve.length;p++){const f=Ve[p],d=ze===p,v=f.party_color||"#8a6aaa",m=(f.momentum||0)>0?"#e8e4dc":"#c55";l+=`<div onclick="donateSelectParty(${p})" style="
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
                            <span style="font-size:14px;font-weight:600;color:${d?"#e8e4dc":"#9e9a92"};">${x(f.faction_name)}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">${x(f.abbreviation||"??")} &middot; ${x(f.nation||"")} &middot; ${f.seats||0} seats</span>
                            ${f.ideology_value_1?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${st(f.ideology_value_1)};background:${st(f.ideology_value_1)}12;border:1px solid ${st(f.ideology_value_1)}30;">${x(f.ideology_value_1.toUpperCase())}</span>`:""}
                            ${f.ideology_value_2?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${st(f.ideology_value_2)};background:${st(f.ideology_value_2)}12;border:1px solid ${st(f.ideology_value_2)}30;">${x(f.ideology_value_2.toUpperCase())}</span>`:""}
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
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${s?"#e8e4dc":"#c55"};">${_(a)}</div></div>
            ${r?`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">RECIPIENT</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#e8e4dc;">${x(r.abbreviation||r.faction_name)}</div></div>`:""}
        </div>
        <div style="display:flex;gap:8px;">
            <div onclick="actCloseDonation()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="donate-btn" onclick="actSubmitDonation()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${r&&s?"#000":"#6a6660"};background:${r&&s?"#8a6aaa":"#2a2a24"};cursor:${r&&s?"pointer":"not-allowed"};${!r||!s?"opacity:0.4;pointer-events:none;":""}">DONATE</div>
        </div>
    </div>`,l+='<div id="donate-error" style="padding:6px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',l+="</div>",o.innerHTML=l}let lt=!1;async function ds(){if(!c||!I||ze<0||lt)return;const o=Ve[ze];if(!o)return;const e=Number(I?.current_tick||0);if(new Set(ke.map(w=>w.id)).has(o.id)){const w=document.getElementById("donate-error");w&&(w.textContent="You cannot donate to your own party.",w.style.display="block");return}const i=Re("Lobbyist"),n=i?i.skill:50,a=Math.round(1e6*Zt(n)),r=1e5,s=2,{data:l,error:p}=await y.from("factions").select("corp_cash_reserves, last_donation_tick").eq("id",c.id).single();if(p||!l){const w=document.getElementById("donate-error");w&&(w.textContent="Failed to verify cooldown: "+(p?.message||"unknown"),w.style.display="block");return}const f=Number(l.last_donation_tick??0);if(f===e){const w=document.getElementById("donate-error");w&&(w.textContent="Political Donation is on cooldown until next tick.",w.style.display="block"),_t("donate");return}const d=Number(l.corp_cash_reserves??0);if(d<a){const w=document.getElementById("donate-error");w&&(w.textContent="Insufficient cash. Need "+_(a)+", have "+_(d)+".",w.style.display="block");return}lt=!0;const v=document.getElementById("donate-btn");v&&(v.style.opacity="0.4",v.style.pointerEvents="none");const m=Number(c.corp_reputation??50),u=Math.max(0,m-s),{data:g,error:b}=await y.from("factions").update({corp_cash_reserves:d-a,corp_reputation:u,last_donation_tick:e}).eq("id",c.id).eq("last_donation_tick",f).select("id");if(b){const w=document.getElementById("donate-error");lt=!1,w&&(w.textContent="Failed: "+b.message,w.style.display="block"),v&&(v.style.opacity="1",v.style.pointerEvents="auto");return}if(!g||g.length===0){const w=document.getElementById("donate-error");lt=!1,w&&(w.textContent="Political Donation is on cooldown until next tick.",w.style.display="block"),v&&(v.style.opacity="1",v.style.pointerEvents="auto"),_t("donate");return}const{data:$}=await y.from("factions").select("party_funds").eq("id",o.id).single(),h=Number($?.party_funds??0),{error:E}=await y.from("factions").update({party_funds:h+r}).eq("id",o.id);if(E){await y.from("factions").update({corp_cash_reserves:d}).eq("id",c.id);const w=document.getElementById("donate-error");lt=!1,w&&(w.textContent="Failed to transfer funds: "+E.message,w.style.display="block"),v&&(v.style.opacity="1",v.style.pointerEvents="auto");return}c.corp_cash_reserves=d-a,c.corp_reputation=u;const T=c.faction_name||"Corporation",{error:S}=await y.from("event_log").insert({nation_id:o.nation_id||c.nation_id,faction_id:c.id,event_name:T+" — Political Donation",description_chosen:T+" has donated "+_(a)+" to "+(o.faction_name||"a political party")+". The party receives "+_(r)+" in campaign funds. Corporate reputation decreases by "+s+".",category:"business",trigger_key:"corp_donation",effects_applied:{cost:a,recipient_faction_id:o.id,recipient_name:o.faction_name,funds_granted:r,reputation_loss:s,skill:n},fired_at_tick:e});S&&console.warn("Failed to log donation event:",S.message),lt=!1,_t("donate"),Ji()}function ps(o){yt=o,St()}async function fs(o){if(Ee=o,Te=-1,document.getElementById("exec-search-overlay").style.display="flex",Ht.length===0&&c?.nation_id){const{data:e}=await y.from("executive_pool").select("id").eq("nation_id",c.nation_id).limit(1);if(!e||e.length===0){const i=c.nation||"",n=Oa(c.nation_id,i),{error:a}=await y.from("executive_pool").insert(n);a&&console.warn("Failed to generate executive pool:",a.message)}const{data:t}=await y.from("executive_pool").select("*").eq("nation_id",c.nation_id).eq("status","available").order("skill",{ascending:!1});Ht=t||[]}ea()}function Xn(){document.getElementById("exec-search-overlay").style.display="none",Ee=null,Te=-1}function Zn(o){return Ht.filter(e=>e.status==="available"&&Array.isArray(e.specializations)&&e.specializations.includes(o)).sort((e,t)=>t.skill-e.skill)}function ms(o){Te=o,ea()}let po=!1;async function us(){if(!c||!I||!Ee||Te<0||po)return;const e=Zn(Ee)[Te];if(!e)return;po=!0;const t=I.current_tick||0,i=document.getElementById("es-hire-btn");i&&(i.style.opacity="0.4",i.style.pointerEvents="none");const{error:n}=await y.from("corp_executives").insert({faction_id:c.id,role:Ee,first_name:e.first_name,last_name:e.last_name,age:e.age,origin_nation:e.origin_nation,skill:e.skill,salary_per_year:e.required_salary,contract_years:e.required_years,contract_start_tick:t,contract_end_tick:t+e.required_years*12,status:"active"});if(n){po=!1;const r=document.getElementById("es-error");r&&(r.textContent="Failed: "+n.message,r.style.display="block"),i&&(i.style.opacity="1",i.style.pointerEvents="auto");return}const{error:a}=await y.from("executive_pool").update({status:"hired",hired_by_faction_id:c.id}).eq("id",e.id);a&&console.warn("Failed to mark pool candidate as hired:",a.message),po=!1,Xn(),await Dn(),yt=uo.indexOf(Ee),yt<0&&(yt=0),St()}function ea(){const o=document.getElementById("exec-search-content");if(!o||!Ee)return;const e=Ee,t=vo[e],i=Zn(e),n=Te>=0?i[Te]:null;let a="";a+=`<div style="padding:12px 20px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
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
    </div>`,a+='<div style="display:flex;flex:1;min-height:0;overflow:hidden;">',a+='<div style="width:300px;border-right:1px solid #2a2a24;overflow-y:auto;flex-shrink:0;">',i.length===0&&(a+=`<div style="padding:30px 20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No candidates available for this role in your nation.</div>
        </div>`);for(let r=0;r<i.length;r++){const s=i[r],l=Te===r,p=bt(s.skill);a+=`<div onclick="esSelectCandidate(${r})" style="
            padding:10px 14px;
            border-bottom:1px solid #2a2a24;
            border-left:3px solid ${l?t.color:"transparent"};
            background:${l?t.color+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:${t.color}10;border:1px solid ${t.color}22;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${t.color};flex-shrink:0;">${x(wo(s.first_name,s.last_name))}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;color:${l?"var(--text-bright,#f0efe6)":"#9e9a92"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x(s.first_name)} ${x(s.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:4px;flex:1;">
                            <div style="flex:1;height:3px;background:#2a2a24;">
                                <div style="width:${s.skill}%;height:100%;background:${p};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:${p};width:18px;text-align:right;">${s.skill}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${pt(s.required_salary)}/yr</span>
                    </div>
                </div>
            </div>
        </div>`}if(a+="</div>",a+='<div style="flex:1;overflow-y:auto;">',!n)a+=`<div style="padding:50px 24px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:14px;color:var(--text-dim);margin-bottom:10px;">Select a candidate</div>
            <div style="font-size:12px;color:#6a6660;">${i.length} candidate${i.length!==1?"s":""} available for ${x(e)}</div>
        </div>`;else{const r=n.required_salary*n.required_years,s=bt(n.skill);a+=`<div style="padding:20px;border-bottom:1px solid #2a2a24;">
            <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:64px;height:64px;background:${t.color}12;border:1px solid ${t.color}28;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:20px;font-weight:700;color:${t.color};">${x(wo(n.first_name,n.last_name))}</div>
                <div>
                    <div style="font-size:20px;font-weight:700;color:var(--text-bright,#f0efe6);">${x(n.first_name)} ${x(n.last_name)}</div>
                    <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-top:3px;">${x(n.origin_nation)} &middot; Age ${n.age}</div>
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
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${x(n.origin_nation)}</div>
            </div>
        </div>`,a+=`<div style="padding:12px 20px;border-bottom:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Role Specializations</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">`;for(const f of n.specializations||[]){const d=vo[f],v=f===e;a+=`<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:3px 10px;color:${v?"#000":d?.color||"#9e9a92"};background:${v?d?.color||"#5a8aaa":(d?.color||"#5a8aaa")+"10"};border:1px solid ${v?"transparent":(d?.color||"#5a8aaa")+"30"};">${x(f)}</span>`}a+="</div></div>",a+=`<div style="padding:12px 20px;border-bottom:1px solid #2a2a24;">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Contract Terms</div>
            <div style="background:#1c1c18;border:1px solid #2a2a24;padding:10px 14px;">
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">CONTRACT LENGTH</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright,#f0efe6);">${n.required_years} years</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">ANNUAL SALARY</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#c84;">${pt(n.required_salary)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright,#f0efe6);">TOTAL CONTRACT VALUE</span>
                    <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${pt(r)}</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;margin-top:5px;">Salary is deducted from cash reserves each tick as an operating expense.</div>
        </div>`;const l=n.skill>=80?"EXCEPTIONAL":n.skill>=65?"STRONG":n.skill>=50?"COMPETENT":n.skill>=35?"DEVELOPING":"WEAK",p=n.skill>=80?"Elite talent. Actions have high success rate and reduced costs.":n.skill>=65?"Strong performer. Reliable outcomes across most actions.":n.skill>=50?"Adequate for the role. Outcomes are average.":n.skill>=35?"Below average. Actions may fail or cost more. Consider alternatives.":"Poor fit. High failure rates. Replacement recommended.";a+=`<div style="padding:12px 20px;">
            <div style="padding:8px 12px;background:${s}08;border:1px solid ${s}18;">
                <div style="font-family:var(--font-mono);font-size:10px;color:${s};letter-spacing:0.8px;margin-bottom:3px;">${l}</div>
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${p}</div>
            </div>
        </div>`}a+="</div>",a+="</div>",a+=`<div style="padding:12px 20px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:14px;">`,n?a+=`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CANDIDATE</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--text-bright,#f0efe6);">${x(n.first_name)} ${x(n.last_name)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SKILL</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${bt(n.skill)};">${n.skill}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SALARY</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:#c84;">${pt(n.required_salary)}/yr</div></div>`:a+='<div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Select a candidate to hire</div>',a+=`</div>
        <div style="display:flex;gap:8px;">
            <div onclick="closeExecSearch()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="es-hire-btn" onclick="esHireCandidate()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${n?"#000":"#6a6660"};background:${n?t.color:"#2a2a24"};cursor:${n?"pointer":"not-allowed"};${n?"":"opacity:0.4;pointer-events:none;"}">HIRE</div>
        </div>
    </div>`,a+='<div id="es-error" style="padding:5px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',o.innerHTML=a}function qo(){return G.reduce((e,t)=>{const i=Number(t.capacity||0),n=Number(t.condition||0)/100;return e+Math.floor(i*n)},0)+500}function vs(o,e){const t=Xe.find(a=>a.id===o),i=Number(c?.[t.factionKey]??0),n=ae[o]+e;if(!(i+n<0)){if(e>0){const a=Xe.reduce((s,l)=>{const p=Number(c?.[l.factionKey]??0),f=l.id===o?n:ae[l.id];return s+p+f},0),r=qo();if(a>r)return}ae[o]=n,Lo()}}function ys(o){o?ae[o]=0:ae={general:0,skilled:0,innovative:0},Lo()}async function gs(){if(ti||!Object.values(ae).some(r=>r!==0))return;let e=0;for(const r of Xe){const s=ae[r.id];s>0&&(e+=s*Ln(r.multiplier)*.1)}const t=Number(c?.corp_cash_reserves??0);if(e>t){alert("Insufficient cash reserves. Hiring cost: "+_(e)+", available: "+_(t));return}const i=Xe.reduce((r,s)=>r+Number(c?.[s.factionKey]??0)+ae[s.id],0),n=qo();if(i>n){alert("Cannot hire beyond property capacity ("+n.toLocaleString()+"). You need more workplaces.");return}const a=e>0?`Confirm workforce changes?

Hiring fee: `+_(e)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(a)){ti=!0;try{const r={};for(const p of Xe){const f=Number(c?.[p.factionKey]??0);r[p.factionKey]=Math.max(0,f+ae[p.id])}e>0&&(r.corp_cash_reserves=Math.max(0,t-Math.round(e)));const{error:s}=await y.from("factions").update(r).eq("id",c.id);if(s)throw s;Object.assign(c,r),ae={general:0,skilled:0,innovative:0};const l=document.getElementById("topbar-cash");if(l){const p=Number(c.corp_cash_reserves??0);l.textContent="CASH: "+(p>=1e6?"$"+(p/1e6).toFixed(1)+"M":"$"+Math.round(p/1e3)+"k")}Lo()}catch(r){alert("Error: "+r.message)}finally{ti=!1}}}function Lo(){const o=document.getElementById("hf-card-container");if(!o)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=Number(N?.minimum_wage??50),n=Number(N?.inflation??50),a=Number(N?.standard_of_living??50),r=i/100*48e3,s=(1+(n-50)/100*.5).toFixed(2),l=(1+(a-50)/100*.5).toFixed(2),p=N?.name||c?.nation||"Nation",f=Object.values(ae).some(h=>h!==0),d=qo();let v=0,m=0,u=0,g=0,b="";for(const h of Xe){const E=Number(c?.[h.factionKey]??0),T=ae[h.id],S=E+T,w=Ln(h.multiplier),C=T>0,M=E*w,k=S*w,z=k-M;v+=E,m+=S,u+=M,g+=k;const q=T!==0?C?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";b+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${t.border};background:${q};">
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
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${h.multiplier}.0 × ${s} × ${l})</span>
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
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${z>0?t.red:t.greenBright}">${z>0?"+":""}${_(z)}/yr</span>
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
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">${_(r)}/yr</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${t.border}">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">INFLATION</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${n}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${s}</div>
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
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${$>0?t.red:t.greenBright}">${_(g)}</span>`:""}
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
    </div>`}function xs(){const o=document.getElementById("wf-summary-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},i=(N?.name||c?.nation||"Nation").toUpperCase(),n=Number(N?.minimum_wage??50),a=Number(N?.inflation??50),r=Number(N?.standard_of_living??50),s=n/100*48e3,l=1+(a-50)/100*.5,p=1+(r-50)/100*.5,f=[{label:"General Workforce",mult:2,color:t.accent,key:"corp_general_workforce",countColor:t.text},{label:"Skilled Workforce",mult:3,color:t.gold,key:"corp_skilled_workforce",countColor:t.blue},{label:"Innovative Workforce",mult:6,color:t.orange,key:"corp_innovative_workforce",countColor:t.gold}];let d=0,v=0,m="";for(const u of f){const g=Number(c?.[u.key]??0),b=Math.round(s*u.mult*l*p),$=g*b;d+=g,v+=$,m+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${u.label}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${i}</span>
                </div>
                <span style="font-family:${e};font-size:16px;font-weight:700;color:${u.countColor}">${g.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${u.mult}.0 × ${l.toFixed(2)} × ${p.toFixed(2)})</span>
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
                    <span style="font-family:${e};font-size:9px;color:${t.text}">${n}/100 → ${_(s)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">INFLATION MODIFIER</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">×${l.toFixed(2)}</span>
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
    </div>`}let G=[];async function eo(){if(!c?.id)return;const{data:o}=await y.from("corp_properties").select("*").eq("faction_id",c.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});G=o||[]}function Oo(){const o=document.getElementById("property-card-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=(N?.name||c?.nation||"Nation").toUpperCase(),n=1+(Number(N?.inflation??50)-50)/100*.3;let a="",r=0,s=0;const l=N?.name||c?.nation||"Home Nation",p=5e7,f=1+(Number(N?.inflation??50)-50)/100*.3,d=.8+Number(N?.stability??50)/100*.4,v=Math.round(p*f*d),m=Math.round(v*.005);r+=v,s+=m,a+=`
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
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${_(v)}</div>
            </div>
            <div style="flex:1;padding:3px 6px">
                <div style="font-family:${e};font-size:7px;color:${t.dim}">MAINT/MO</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.red}">${_(m)}</div>
            </div>
        </div>
    </div>`;for(const u of G){const g=Eo[u.style]||Eo.Basic;r+=Number(u.purchase_price||0),s+=Number(u.monthly_maintenance||0),a+=`
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
                <div onclick="propRefurbish('${u.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.accent};border:1px solid ${t.accent}33;cursor:pointer;">REFURBISH (${_(Math.round((u.purchase_price||0)*.1*n))})</div>
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
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.green}">${_(r)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">TOTAL MAINTENANCE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${_(s)}/mo</span>
            </div>
        </div>
    </div>`}let ft=[],le=null;const Eo={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function Xi(){if(!c?.nation_id)return;const{data:o,error:e}=await y.from("available_properties").select("*").eq("nation_id",c.nation_id).eq("status","available").order("price",{ascending:!0});if(e){console.warn("[Property] Failed to load marketplace:",e.message);return}const t=c?.corp_sector==="Construction";ft=(o||[]).filter(i=>t||i.type!=="warehouse").map(i=>({...i,adjusted_cost:i.price,adjusted_maintenance:i.monthly_maintenance}))}function Bo(){const o=document.getElementById("new-property-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"};(N?.name||c?.nation||"Nation").toUpperCase();const i=Number(N?.standard_of_living??50),n=Number(N?.gdp_growth??50),a=Number(N?.inflation??50),r=N?.capital||"Capital",s={capital:r,port:r+" Port",industrial:r+" Industrial Zone",suburban:r+" Suburbs",coastal:r+" Coast"};let l="";if(ft.length===0)l=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let p=0;p<ft.length;p++){const f=ft[p],d=le===p,v=Eo[f.style]||Eo.Basic,m=s[f.city_template]||r;l+=`
            <div onclick="npSelect(${p})" style="padding:8px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${d?t.accent:"transparent"};background:${d?"rgba(139,154,107,0.03)":"transparent"};">
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
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${ft.length} AVAILABLE</span>
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
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${le!==null?"#000":t.dim};background:${le!==null?t.accent:"transparent"};border:1px solid ${le!==null?t.accent:t.border};cursor:${le!==null?"pointer":"default"};opacity:${le!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function bs(o){le=le===o?null:o,Bo()}let ni=!1;async function _s(){if(le===null||ni)return;const o=ft[le];if(!o)return;const e=Number(c?.corp_cash_reserves??0);if(o.adjusted_cost>e){alert(`Insufficient cash reserves.
Property: `+_(o.adjusted_cost)+`
Cash: `+_(e));return}if(confirm('Buy "'+o.name+'" for '+_(o.adjusted_cost)+`?

Monthly maintenance: `+_(o.adjusted_maintenance)+`/mo
Condition: `+o.condition+`%

This will be deducted from your cash reserves.`)){ni=!0;try{const{error:t}=await y.from("corp_properties").insert({faction_id:c.id,nation_id:c.nation_id,catalog_id:o.catalog_id||null,name:o.name,type:o.type,style:o.style,capacity:o.capacity,purchase_price:o.adjusted_cost,monthly_maintenance:o.adjusted_maintenance,condition:o.condition,city:o.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(t)throw t;const i=Math.max(0,e-o.adjusted_cost),{error:n}=await y.from("factions").update({corp_cash_reserves:i}).eq("id",c.id);if(n)throw n;c.corp_cash_reserves=i,o.id&&await y.from("available_properties").update({status:"sold",purchased_by:c.id}).eq("id",o.id);const a=document.getElementById("topbar-cash");a&&(a.textContent="CASH: "+(i>=1e6?"$"+(i/1e6).toFixed(1)+"M":"$"+Math.round(i/1e3)+"k")),le=null,await Xi(),Bo(),Oo(),alert("Property purchased: "+o.name+`

Deducted: `+_(o.adjusted_cost))}catch(t){alert("Purchase failed: "+t.message)}finally{ni=!1}}}const $t={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let Zi=!1,L={name:"",type:"Office Building",size:2e3,style:"Modern",nationId:null,nationName:null},ai=!1,Ti=[];function ta(){const e=1+(Number(N?.inflation??50)-50)/100*.3,t=$t[L.style]?.costMod||1,i=L.type==="Warehouse"?.75:1,n=Math.round(L.size*1e5*e*t*i),a=Math.round(n*.007*($t[L.style]?.maintMod||1));return{total:n,maint:a,inflMod:e,styleMod:t}}async function hs(){Zi=!0;const o=c?.nation_id,e=N?.name||c?.nation||"Home Nation";L={name:"",type:"Office Building",size:2e3,style:"Modern",nationId:o,nationName:e},Ti=[{id:o,name:e,label:"National HQ"}];try{const{data:t}=await y.from("corp_properties").select("nation_id, name, nations!nation_id(name)").eq("faction_id",c.id).eq("type","regional_hq").eq("is_active",!0);for(const i of t||[])i.nation_id!==o&&Ti.push({id:i.nation_id,name:i.nations?.name||"Unknown",label:i.name||"Regional HQ"})}catch{}oa()}function en(){Zi=!1,document.getElementById("cp-modal-overlay")?.remove()}function $s(o,e){L[o]=e,oa()}async function ws(){if(!(ai||!L.name.trim())){if(!L.nationId){alert("Select a location.");return}ai=!0;try{const o=ta(),e=L.nationId,t=L.nationName||"Unknown",i=$t[L.style]?.repGain||1,n=await y.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),a=n.data?.current_tick||0,r=(n.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:s}=await y.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",e).eq("issuer_type","PRIVATE"),p=`PVT-C${(s||0)+1}-${r}`,{error:f}=await y.from("construction_contracts").insert({nation_id:e,template_key:"custom_building",sector:"civil_engineering",name:L.name.trim(),project_type:L.type,project_subtype:L.style,description:`${L.type} (${L.style}) — ${L.size.toLocaleString()} employees, commissioned by ${c.faction_name}`,project_code:p,budget_ceiling:o.total,timeline_ticks:Math.max(4,Math.ceil(L.size/2e3)+2),required_materials:(()=>{const d=L.size/1e3,v=L.style,m={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[v]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},u=(g,b)=>Math.max(1,Math.ceil(d*g*b));return{concrete:u(8,m.concrete),steel:u(6,m.steel),glass_facades:u(3,m.glass),em_systems:u(4,m.em),lumber:u(1,m.lumber),heavy_parts:u(2,m.heavy),aggregate:u(3,m.agg)}})(),required_equipment:(()=>{const d=L.size,v={trucks:Math.ceil(d/2e3)+1,mixers:Math.ceil(d/3e3)+1};return d>1e3&&(v.excavators=Math.ceil(d/3e3)+1,v.cranes=Math.ceil(d/4e3)+1),d>3e3&&(v.bulldozers=Math.ceil(d/4e3)+1,v.haulers=Math.ceil(d/5e3)+1),d>8e3&&(v.pile_drivers=Math.ceil(d/6e3)+1),v})(),required_workforce:{general:Math.ceil(L.size*.08),skilled:Math.ceil(L.size*.03)},status:"open",generated_at_tick:a,bidding_ends_tick:a+3,issuer_type:"PRIVATE",issuer_name:c.faction_name,issuer_faction_id:c.id});if(f)throw f;en(),alert(`Construction project submitted!

Project: `+L.name.trim()+`
Code: `+p+`
Budget: `+_(o.total)+`
Expected Reputation: +`+Math.ceil(o.adjusted/1e8*3)+` (+3 per $100M)

All construction corporations in `+t+" can now bid on this project.")}catch(o){alert("Failed to submit project: "+o.message)}finally{ai=!1}}}function oa(){if(document.getElementById("cp-modal-overlay")?.remove(),!Zi)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",redDim:"#a44",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=ta(),i=Math.ceil(t.total/1e8*3),n=i>=4?e.gold:i>=3?e.greenBright:i>=2?e.accent:e.dim,a=Object.entries($t).map(([l,p])=>{const f=L.style===l;return`<div onclick="cpSetField('style','${l}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${f?p.color+"18":"transparent"};border:1px solid ${f?p.color+"44":e.border};">
            <div style="font-family:${o};font-size:9px;font-weight:700;color:${f?p.color:e.dim}">${l}</div>
            <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:1px">×${p.costMod.toFixed(1)} cost</div>
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
                <input id="cp-name-input" value="${L.name.replace(/"/g,"&quot;")}" placeholder="e.g., McKenna Tower"
                    style="width:100%;padding:8px 12px;font-family:${o};font-size:14px;color:${e.text};background:${e.card};border:1px solid ${e.border};outline:none;box-sizing:border-box;" />
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Type</div>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                    ${["Regional HQ","Office Building",...c?.corp_sector==="Construction"?["Warehouse"]:[],...c?.corp_subsector?.toLowerCase()==="banking"?["Branch Office"]:[],...c?.corp_subsector?.toLowerCase()==="investment"?["Trading Floor"]:[],...c?.corp_subsector?.toLowerCase()==="insurance"?["Claims Office"]:[]].map(l=>{const p=["Branch Office","Trading Floor","Claims Office"].includes(l),d=l==="Warehouse"?e.orange:p?"#8a6aaa":e.accent;return`<span onclick="cpSetField('type','${l}')" style="flex:1;min-width:100px;text-align:center;padding:6px 0;font-family:${o};font-size:12px;font-weight:700;cursor:pointer;color:${L.type===l?"#000":e.dim};background:${L.type===l?d:"transparent"};border:1px solid ${L.type===l?d:e.border}">${l}</span>`}).join("")}
                </div>
                ${L.type==="Warehouse"?`<div style="font-family:${o};font-size:9px;color:${e.orange};margin-top:5px;">Warehouse: 75% construction cost, stores up to $20M in materials</div>`:""}
                ${L.type==="Branch Office"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Branch Office: Increases lending capacity. +1 reputation per 200 employees. Enables cross-nation lending.</div>`:""}
                ${L.type==="Trading Floor"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Trading Floor: Enables secondary bond market. +1 reputation per 200 employees. Portfolio management bonuses.</div>`:""}
                ${L.type==="Claims Office"?`<div style="font-family:${o};font-size:9px;color:#8a6aaa;margin-top:5px;">Claims Office: Faster claim processing. +1 reputation per 200 employees. Local presence reduces premiums.</div>`:""}
                ${L.type==="Regional HQ"?`<div style="font-family:${o};font-size:9px;color:${e.accent};margin-top:5px;">Regional HQ: Establishes corporate presence in another nation.</div>`:""}
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Location</div>
                <select onchange="cpSetField('nationId', this.value); cpSetField('nationName', this.options[this.selectedIndex].text)"
                    style="width:100%;padding:8px 12px;font-family:${o};font-size:12px;color:${e.text};background:${e.card};border:1px solid ${e.border};outline:none;">
                    ${Ti.map(l=>`<option value="${l.id}" ${L.nationId===l.id?"selected":""}>${l.name} (${l.label})</option>`).join("")}
                </select>
            </div>

            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <span style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase">Size (Employees)</span>
                    <span style="font-family:${o};font-size:18px;font-weight:700;color:${e.text}">${L.size.toLocaleString()}</span>
                </div>
                <input type="range" min="500" max="18000" step="500" value="${L.size}" oninput="cpSetField('size',+this.value)"
                    style="width:100%;accent-color:${e.accent};height:5px;" />
                <div style="display:flex;justify-content:space-between;font-family:${o};font-size:9px;color:${e.dim};margin-top:3px">
                    <span>500 min</span><span>18,000 max</span>
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Style</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;">${a}</div>
                <div style="margin-top:5px;font-family:${o};font-size:10px;color:${$t[L.style].color}">${$t[L.style].desc}</div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${o};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Estimated Cost</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:10px 12px;">
                    <div style="display:flex;justify-content:space-between;padding:5px 0;">
                        <span style="font-family:${o};font-size:12px;font-weight:700;color:${e.text}">TOTAL BUDGET</span>
                        <span style="font-family:${o};font-size:18px;font-weight:700;color:${e.gold}">${_(t.total)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-top:1px solid ${e.border}">
                        <span style="font-family:${o};font-size:10px;color:${e.dim}">EST. MONTHLY MAINTENANCE</span>
                        <span style="font-family:${o};font-size:12px;color:${e.redDim}">${_(t.maint)}/mo</span>
                    </div>
                </div>
            </div>

            <div style="padding:8px 10px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);margin-bottom:10px;">
                <div style="font-family:${o};font-size:10px;color:${e.gold};margin-bottom:3px">WHAT HAPPENS NEXT</div>
                <div style="font-size:12px;color:${e.dim};line-height:1.5">
                    This project will appear as a Civil Engineering bid in the Open Contracts pool for all construction corporations with an HQ or Regional HQ in ${L.nationName||"the selected nation"}. The lowest qualified bidder wins the contract and begins construction.
                </div>
            </div>

            <div style="padding:8px 10px;background:rgba(139,154,107,0.04);border:1px solid rgba(139,154,107,0.12);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:${o};font-size:12px;color:${e.accent}">EXPECTED REPUTATION GAIN</span>
                    <span style="font-family:${o};font-size:20px;font-weight:700;color:${n}">+${i}</span>
                </div>
                <div style="font-family:${o};font-size:9px;color:${e.dim};margin-top:3px">${L.style} style · ${i===5?"Maximum prestige":i>=4?"Impressive presence":i>=3?"Strong statement":i>=2?"Solid investment":"Functional addition"}</div>
            </div>

        </div>
        <div style="padding:12px 20px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${o};font-size:9px;color:${e.dim}">TOTAL PROJECT</div>
                <div style="font-family:${o};font-size:18px;font-weight:700;color:${e.gold}">${_(t.total)}</div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="cpClose()" style="padding:7px 20px;font-family:${o};font-size:12px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:7px 20px;font-family:${o};font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${e.gold};cursor:pointer;opacity:${L.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(r);const s=document.getElementById("cp-name-input");s&&s.addEventListener("input",l=>{L.name=l.target.value}),r.addEventListener("click",l=>{l.target===r&&en()})}function ks(){const o=document.getElementById("cp-name-input");if(o&&(L.name=o.value),!L.name.trim()){alert("Please enter a building name.");return}ws()}window.cpClose=en;window.cpSetField=$s;window.cpSubmitFromModal=ks;window.npSelect=bs;window.npBuyProperty=_s;window.npOpenConstructionModal=hs;let wt=!1;async function Es(o){if(wt)return;const e=G.find(s=>s.id===o);if(!e)return;const t=1+(Number(N?.inflation??50)-50)/100*.3,i=Math.round((e.purchase_price||0)*.1*t),n=Number(c?.corp_cash_reserves??0);if(i>n){alert("Insufficient cash. Refurbishment costs "+_(i)+" (inflation-adjusted), you have "+_(n));return}if(e.condition>=95){alert("Property is already in excellent condition ("+e.condition+"%).");return}const a=5+Math.floor(Math.random()*21),r=Math.min(100,e.condition+a);if(confirm('Refurbish "'+e.name+`"?

Cost: `+_(i)+`
Expected improvement: +`+a+"% condition ("+e.condition+"% → "+r+"%)")){wt=!0;try{await y.from("corp_properties").update({condition:r}).eq("id",o);const s=Math.max(0,n-i);await y.from("factions").update({corp_cash_reserves:s}).eq("id",c.id),c.corp_cash_reserves=s;const l=document.getElementById("topbar-cash");l&&(l.textContent="CASH: "+(s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k")),await eo(),Oo(),alert("Refurbished! Condition: "+e.condition+"% → "+r+"%")}catch(s){alert("Refurbishment failed: "+s.message)}finally{wt=!1}}}async function Cs(o){if(wt)return;const e=G.find(a=>a.id===o);if(!e)return;const t=1+(Number(N?.inflation??50)-50)/100*.3,i=(e.condition||50)/100,n=Math.round((e.purchase_price||0)*.6*i*t);if(confirm('Sell "'+e.name+`"?

Sale value: `+_(n)+" (60% × "+e.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){wt=!0;try{await y.from("corp_properties").update({is_active:!1}).eq("id",o);const r=Number(c?.corp_cash_reserves??0)+n;await y.from("factions").update({corp_cash_reserves:r}).eq("id",c.id),c.corp_cash_reserves=r;const l=(await y.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await y.from("available_properties").insert({nation_id:c.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,price:Math.round(n*1.1),monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,generated_at_tick:l,expires_at_tick:l+6,status:"available"});const p=document.getElementById("topbar-cash");p&&(p.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")),await eo(),Oo(),await Xi(),Bo(),alert('Sold "'+e.name+'" for '+_(n))}catch(a){alert("Sale failed: "+a.message)}finally{wt=!1}}}window.propRefurbish=Es;window.propSell=Cs;const Fe={SALE:.8,DISSOLVE:.6,REVENUE_BASE:.02,GDP_NEUTRAL:30,DEFAULT_REPUTATION:25};function Ts(o){if(!o)return 0;const e=o.trim().replace(/[$,]/g,""),t=e.match(/^([\d.]+)\s*[Mm]$/),i=e.match(/^([\d.]+)\s*[Kk]$/);return Math.round(t?parseFloat(t[1])*1e6:i?parseFloat(i[1])*1e3:parseFloat(e))}function tt(o){const e=document.getElementById("topbar-cash");e&&(e.textContent="CASH: "+(o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k"))}function ia(o){return It.find(e=>e.id===o)?.name||"—"}function Po(o){return G.filter(e=>e.nation_id===o)}async function to(){mt=0,await eo(),Oo(),oo(),io()}let se=!1,mt=0,fo={};async function Ss(){if(c?.id)try{const{data:o}=await y.from("construction_contracts").select("nation_id").eq("awarded_to_faction",c.id).in("status",["in_progress","awarded"]);fo={};for(const e of o||[])e.nation_id&&(fo[e.nation_id]=(fo[e.nation_id]||0)+1)}catch{}}function na(o){const e=Po(o.nation_id),t=e.reduce((u,g)=>u+Number(g.purchase_price||0),0),i=e.reduce((u,g)=>u+Number(g.capacity||0),0),n=fo[o.nation_id]||0,a=It.find(u=>u.id===o.nation_id),r=(o.name||"").trim().split(/\s+/),s=r.length>=2?r.map(u=>u[0]).join("").toUpperCase().slice(0,4):(o.name||"SUB").slice(0,4).toUpperCase(),l=Number(o.sub_cash||0),p=Number(a?.gdp_growth??50),f=l*Fe.REVENUE_BASE,d=(p-Fe.GDP_NEUTRAL)/100,v=Fe.DEFAULT_REPUTATION/100,m=l>0?Math.round(f*(1+d)*v):0;return{id:o.id,name:o.name,abbr:s,nation:a?.name||o.city||"—",nationId:o.nation_id,sector:c?.corp_sector||"General",subsector:o.subsector||c?.corp_subsector||"—",revenue:m,debt:0,cash:l,reputation:Fe.DEFAULT_REPUTATION,valuation:t,workforce:i,projects:n,established:o.created_at?new Date(o.created_at).getFullYear().toString():"—",trend:p>=40&&l>0?"up":p>=Fe.GDP_NEUTRAL&&l>0?"flat":"down",profitable:m>0,hqProp:o}}function oo(){const o=document.getElementById("manage-subsidiaries-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},n=G.filter(f=>f.type==="regional_hq").map(na);mt>=n.length&&(mt=0);const a=n[mt]||null;let r="";n.length===0&&(r=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No subsidiaries established.<br>Use Create Subsidiary to expand.</div>`);let s=0,l=0;for(let f=0;f<n.length;f++){const d=n[f],v=f===mt;s+=d.revenue,l+=d.valuation;const m=d.trend==="up"?t.greenBright:d.trend==="down"?t.red:t.dim,u=d.trend==="up"?"▲":d.trend==="down"?"▼":"–";r+=`
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
        </div>`}let p="";if(a){const f=a.trend==="up"?t.greenBright:a.trend==="down"?t.red:t.dim,d=a.trend==="up"?"▲":a.trend==="down"?"▼":"–",v=a.trend==="up"?"Growing":a.trend==="down"?"Declining":"Stable",m=a.reputation>=40?t.accent:a.reputation>=25?t.yellow:t.orange,u=[{label:"Revenue",value:_(a.revenue),color:a.profitable?t.greenBright:t.redDim},{label:"Cash",value:_(a.cash),color:t.text},{label:"Debt",value:a.debt>0?_(a.debt):"$0",color:a.debt>0?t.orange:t.dim},{label:"Reputation",value:a.reputation+"/100",color:m},{label:"Market Valuation",value:_(a.valuation),color:t.gold},{label:"Workforce",value:a.workforce.toLocaleString(),color:t.text},{label:"Active Projects",value:a.projects.toString(),color:a.projects>0?t.text:t.dim}],g=a.projects===0,b=a.hqProp?.logo_url?`<img src="${x(a.hqProp.logo_url)}" alt="" style="width:32px;height:32px;object-fit:cover;border-radius:4px;">`:`<label style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:${t.card};border:1px dashed ${t.border};border-radius:4px;cursor:pointer;font-size:14px;color:${t.dim};" title="Upload subsidiary logo">+<input type="file" accept="image/*" id="sub-logo-upload" data-prop-id="${a.hqProp?.id||""}" style="display:none;"></label>`;p=`
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
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${_(s)}</span>
                    <span style="width:40px"></span>
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${t.text};text-align:right">${_(l)}</span>
                    <span style="width:12px"></span>
                </div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${p}
            </div>
        </div>
    </div>`,document.getElementById("sub-logo-upload")?.addEventListener("change",async f=>{const d=f.target.files?.[0],v=f.target.dataset.propId;if(!(!d||!v)){if(d.size>2*1024*1024){alert("Logo must be under 2MB.");return}try{const m=d.name.split(".").pop()?.toLowerCase()||"png",u=`party-logos/${c.id}/sub_${v}_${Date.now()}.${m}`,{error:g}=await y.storage.from("public-assets").upload(u,d,{contentType:d.type,upsert:!0});if(g)throw g;const{data:b}=y.storage.from("public-assets").getPublicUrl(u),$=b?.publicUrl;if($){await y.from("corp_properties").update({logo_url:$}).eq("id",v);const h=G.find(E=>E.id===v);h&&(h.logo_url=$),oo()}}catch(m){alert("Upload failed: "+(m.message||"Error"))}}}),a&&(a.subsector==="Insurance"||a.subsector==="Banking")){const f="sub-dashboard-"+a.id;setTimeout(()=>{document.getElementById(f)&&Ca(y,{faction:c,nation:N,shard:I},f,a.id).catch(d=>console.error("[SubDash] Init failed:",d))},50)}}async function aa(o,e){if(se)return;const t=G.find(m=>m.id===o);if(!t)return;const i=e==="sell",n=i?Fe.SALE:Fe.DISSOLVE,a=i?"SELL":"DISSOLVE",r=i?"sold":"dissolved",s=i?"80%":"60%",l=ia(t.nation_id),p=Po(t.nation_id),f=p.reduce((m,u)=>m+Math.round((u.purchase_price||0)*n*(u.condition||50)/100),0),d=Number(t.sub_cash||0),v=f+d;if(confirm(a+' subsidiary "'+t.name+`"?

`+p.length+" properties at "+s+` × condition:
  Property value: `+_(f)+`
  Subsidiary cash: `+_(d)+`
  ─────────────────
  Total return: `+_(v)+`

All operations in `+l+` cease.
This cannot be undone.`)){se=!0;try{const m=p.map(g=>g.id);if(m.length===1){const{error:g}=await y.from("corp_properties").update({is_active:!1}).eq("id",m[0]);if(g)throw g}else if(m.length>1){const{error:g}=await y.from("corp_properties").update({is_active:!1}).in("id",m);if(g)throw g}await y.from("corp_properties").update({sub_cash:0}).eq("id",o).then(()=>{}).catch(()=>{});const u=Number(c?.corp_cash_reserves??0)+v;await y.from("factions").update({corp_cash_reserves:u}).eq("id",c.id),c.corp_cash_reserves=u,tt(u),await to(),alert("Subsidiary "+r+". "+p.length+` properties liquidated.
Total received: `+_(v))}catch(m){alert("Failed: "+m.message)}finally{se=!1}}}function zs(o){aa(o,"sell")}async function Is(o){if(se)return;const e=G.find(s=>s.id===o);if(!e)return;const t=ia(e.nation_id),n=Po(e.nation_id).reduce((s,l)=>s+Math.round((l.purchase_price||0)*.8*(l.condition||50)/100),0),a=Number(e.sub_cash||0),r=Math.round(a*.05);if(confirm('PUT UP FOR SALE: "'+e.name+`"

Nation: `+t+`
Estimated Valuation: `+_(n)+`
Subsidiary Cash: `+_(a)+`
Subsector: `+(e.subsector||"General")+`

This will list your subsidiary on the marketplace.
Other corporations can place bids (minimum $1M).
You review and accept bids.

Continue?`)){se=!0;try{const s=I?.current_tick||0,{data:l,error:p}=await y.from("subsidiary_sales").insert({subsidiary_id:o,seller_faction_id:c.id,nation_id:e.nation_id,subsidiary_name:e.name,subsector:e.subsector||null,valuation:n,monthly_revenue:r,sub_cash_at_listing:a,employee_count:e.capacity||0,status:"listed",listed_at_tick:s}).select("*").single();if(p){alert("Failed to list: "+p.message);return}alert('"'+e.name+`" is now listed for sale.

Other corporations will see it on the Expansion tab and can place bids.`),await to()}catch(s){alert("Failed: "+s.message)}finally{se=!1}}}let Co=[],ra="ready",Ot=null;async function Do(){const o=await za(y);Co=o.listings,ra=o.state,Ot=o.error,Ot&&console.error("[SubMarket] Load failed:",Ot.message)}function jo(){let o=document.getElementById("sub-marketplace-card");o||(o=document.createElement("div"),o.id="sub-marketplace-card",document.getElementById("expansion-content")?.appendChild(o));const e=Co.filter(r=>r.seller_faction_id!==c?.id),t=Co.filter(r=>r.seller_faction_id===c?.id),i="'JetBrains Mono',monospace",n={surface:"#1a1a17",card:"#1c1c18",border:"rgba(255,255,255,0.06)",dim:"#4a4940",muted:"#666",text:"#c4c2b8",bright:"#f0efe6",orange:"#c84",green:"#5cb85c",red:"#d9534f",gold:"#c8a832"};let a=`<div style="width:760px;background:${n.surface};border:1px solid ${n.border};font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:10px 14px;border-bottom:1px solid ${n.border};display:flex;align-items:center;gap:8px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${n.orange};display:inline-block;"></span>
            <span style="font-family:${i};font-size:11px;font-weight:700;letter-spacing:1.5px;color:${n.orange};text-transform:uppercase;">Subsidiary Marketplace</span>
            <span style="font-family:${i};font-size:9px;color:${n.dim};">${e.length} available</span>
        </div>`;if(t.length>0){a+=`<div style="padding:8px 14px;border-bottom:1px solid ${n.border};background:${n.card};">
            <div style="font-family:${i};font-size:8px;letter-spacing:1px;color:${n.gold};text-transform:uppercase;margin-bottom:6px;">YOUR LISTINGS</div>`;for(const r of t){const l=(r.subsidiary_bids||[]).filter(p=>p.status==="pending");a+=`<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.03);display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:11px;font-weight:700;color:${n.bright};">${x(r.subsidiary_name)}</span>
                    <span style="font-family:${i};font-size:8px;color:${n.dim};margin-left:6px;">${x(r.subsector||"")}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${i};font-size:9px;color:${l.length>0?n.green:n.dim};">${l.length} bid${l.length!==1?"s":""}</span>
                    ${l.length>0?`<span onclick="subViewBids('${r.id}')" style="font-family:${i};font-size:8px;font-weight:700;padding:3px 8px;color:${n.green};border:1px solid ${n.green}44;cursor:pointer;">VIEW BIDS</span>`:""}
                    <span onclick="subCancelSale('${r.id}')" style="font-family:${i};font-size:8px;font-weight:700;padding:3px 8px;color:${n.red};border:1px solid ${n.red}44;cursor:pointer;">CANCEL</span>
                </div>
            </div>`}a+="</div>"}if(ra==="error")a+=`<div style="padding:24px 14px;text-align:center;font-family:${i};font-size:10px;color:${n.red};font-style:italic;">${x(Ot&&Ot.message||"Subsidiary marketplace is temporarily unavailable.")}</div>`;else if(e.length===0)a+=`<div style="padding:24px 14px;text-align:center;font-family:${i};font-size:10px;color:${n.dim};font-style:italic;">No subsidiaries for sale right now.</div>`;else for(const r of e){const s=(r.subsidiary_bids||[]).find(f=>f.bidder_faction_id===c?.id&&f.status==="pending"),p=(_allNations||[]).find(f=>f.id===r.nation_id)?.name||"Unknown";a+=`<div style="padding:10px 14px;border-bottom:1px solid ${n.border};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:12px;font-weight:700;color:${n.bright};">${x(r.subsidiary_name)}</span>
                        <span style="font-family:${i};font-size:7px;font-weight:700;padding:1px 5px;color:${n.orange};border:1px solid ${n.orange}44;background:${n.orange}0a;">${x(r.subsector||"General")}</span>
                    </div>
                    <span style="font-family:${i};font-size:8px;color:${n.dim};">${x(p)}</span>
                </div>
                <div style="display:flex;gap:16px;font-family:${i};font-size:8px;color:${n.muted};margin-bottom:8px;">
                    <span>Valuation: <strong style="color:${n.text};">${_(r.valuation)}</strong></span>
                    <span>Revenue: <strong style="color:${n.text};">${_(r.monthly_revenue)}/mo</strong></span>
                    <span>Cash: <strong style="color:${n.text};">${_(r.sub_cash_at_listing)}</strong></span>
                    <span>Staff: <strong style="color:${n.text};">${r.employee_count}</strong></span>
                </div>
                <div style="display:flex;justify-content:flex-end;">
                    ${s?`<span style="font-family:${i};font-size:8px;font-weight:700;color:${n.green};">✓ BID PLACED: ${_(s.bid_amount)}</span>`:`<span onclick="subPlaceBid('${r.id}','${x(r.subsidiary_name)}',${r.valuation})" style="font-family:${i};font-size:8px;font-weight:700;padding:4px 14px;color:#000;background:${n.orange};cursor:pointer;">PLACE BID</span>`}
                </div>
            </div>`}a+="</div>",o.innerHTML=a}async function Ns(o,e,t){const i=prompt('Place bid for "'+e+`"

Valuation: `+_(t)+`
Minimum bid: $1M

Enter bid amount ($):`);if(!i)return;const n=Math.round(Number(i));if(isNaN(n)||n<1e6){alert("Minimum bid is $1,000,000.");return}const a=Number(c?.corp_cash_reserves??0);if(n>a){alert("Insufficient funds. You have "+_(a)+".");return}const{error:r}=await y.from("subsidiary_bids").insert({sale_id:o,bidder_faction_id:c.id,bid_amount:n,status:"pending",placed_at_tick:I?.current_tick||0});if(r){r.message.includes("duplicate")||r.message.includes("unique")?alert("You already have a bid on this subsidiary."):alert("Failed to place bid: "+r.message);return}alert("Bid of "+_(n)+' placed on "'+e+`".
The seller will review your bid.`),await Do(),jo()}async function As(o){const e=Co.find(v=>v.id===o);if(!e)return;const t=(e.subsidiary_bids||[]).filter(v=>v.status==="pending");if(t.length===0){alert("No pending bids.");return}const i=t.map(v=>v.bidder_faction_id),{data:n}=await y.from("factions").select("id, faction_name").in("id",i),a={};(n||[]).forEach(v=>{a[v.id]=v.faction_name});let r='Bids for "'+e.subsidiary_name+`":

`;const s=t.sort((v,m)=>m.bid_amount-v.bid_amount);for(let v=0;v<s.length;v++){const m=s[v];r+=v+1+". "+(a[m.bidder_faction_id]||"Unknown")+": "+_(m.bid_amount)+`
`}r+=`
Enter the number of the bid to accept (or cancel):`;const l=prompt(r);if(!l)return;const p=parseInt(l,10)-1;if(isNaN(p)||p<0||p>=s.length){alert("Invalid selection.");return}const f=s[p],d=a[f.bidder_faction_id]||"Unknown";confirm("Accept bid of "+_(f.bid_amount)+" from "+d+`?

This will transfer ownership of "`+e.subsidiary_name+`" to them.
You will receive `+_(f.bid_amount)+` in cash.

This cannot be undone.`)&&await Ms(e,f)}let ri=!1;async function Ms(o,e){if(!ri){ri=!0;try{const n=I?.current_tick||0,{data:a}=await y.from("factions").select("corp_cash_reserves").eq("id",e.bidder_faction_id).single(),r=Number(a?.corp_cash_reserves??0);if(r<e.bid_amount){alert("Buyer has insufficient funds. Bid cannot be completed."),await y.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:n}).eq("id",e.id);return}var{error:t}=await y.from("factions").update({corp_cash_reserves:r-e.bid_amount}).eq("id",e.bidder_faction_id);if(t){alert("Failed to deduct from buyer: "+t.message);return}const s=Number(c?.corp_cash_reserves??0);var{error:i}=await y.from("factions").update({corp_cash_reserves:s+e.bid_amount}).eq("id",c.id);if(i){await y.from("factions").update({corp_cash_reserves:r}).eq("id",e.bidder_faction_id),alert("Failed to credit seller: "+i.message);return}c.corp_cash_reserves=s+e.bid_amount,await y.from("corp_properties").update({faction_id:e.bidder_faction_id}).eq("id",o.subsidiary_id);const l=G.filter(p=>p.nation_id===o.nation_id&&p.faction_id===c.id);for(const p of l)await y.from("corp_properties").update({faction_id:e.bidder_faction_id}).eq("id",p.id);await y.from("subsidiary_sales").update({status:"completed",completed_at_tick:n,accepted_bid_id:e.id}).eq("id",o.id),await y.from("subsidiary_bids").update({status:"accepted",resolved_at_tick:n}).eq("id",e.id),await y.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:n}).eq("sale_id",o.id).neq("id",e.id),tt(c.corp_cash_reserves),alert("Sale complete! Received "+_(e.bid_amount)+`.

"`+o.subsidiary_name+'" has been transferred to the buyer.'),await to(),await Do(),jo()}catch(n){console.error("[SubMarket] Accept bid error:",n),alert("Transfer failed: "+n.message)}finally{ri=!1}}}async function Rs(o){if(!confirm("Cancel this listing? The subsidiary will no longer be for sale."))return;const{error:e}=await y.from("subsidiary_sales").update({status:"cancelled"}).eq("id",o);if(e){alert("Failed: "+e.message);return}await Do(),jo()}function qs(o){aa(o,"dissolve")}async function sa(o,e){if(se)return;const t=G.find(d=>d.id===o);if(!t)return;const i=Number(c?.corp_cash_reserves??0),n=Number(t.sub_cash||0),a=e?"WITHDRAW":"INJECT CAPITAL";if(e&&n<=0){alert("This subsidiary has no cash to withdraw.");return}const r=e?n:i,s=prompt(a+(e?" from ":" into ")+t.name+`

Parent cash: `+_(i)+`
Subsidiary cash: `+_(n)+`

Enter amount (e.g., 5000000 or 5M):`);if(!s)return;const l=Ts(s);if(!l||l<=0||isNaN(l)){alert("Invalid amount.");return}if(l>r){alert("Insufficient "+(e?"subsidiary":"parent")+" cash. Available: "+_(r));return}const p=e?i+l:i-l,f=e?n-l:n+l;if(confirm(a+" "+_(l)+(e?" from ":" into ")+t.name+`?

Parent: `+_(i)+" → "+_(p)+`
Subsidiary: `+_(n)+" → "+_(f))){se=!0;try{await Promise.all([y.from("factions").update({corp_cash_reserves:p}).eq("id",c.id),y.from("corp_properties").update({sub_cash:f}).eq("id",o)]),c.corp_cash_reserves=p,t.sub_cash=f,tt(p),oo(),alert((e?"Withdrew ":"Injected ")+_(l)+(e?" from ":" into ")+t.name+".")}catch(d){alert("Failed: "+d.message)}finally{se=!1}}}function Ls(o){sa(o,!1)}function Os(o){sa(o,!0)}async function Bs(o){if(se)return;const e=G.find(g=>g.id===o);if(!e)return;const t=na(e);t.nation;const i=Po(e.nation_id),n=t.valuation,a=t.cash,r=t.reputation,s=t.subsector,l=Math.round(n*2.25),p=Math.round(r*.1),f=Math.round(r*.2),d=qo(),v=Xe.reduce((g,b)=>g+Number(c?.[b.factionKey]??0),0),m=Math.max(0,d-v),u=Number(c?.corp_cash_reserves??0);if(l>u){alert(`Insufficient cash to acquire subsidiary.

Acquisition cost (2.25× valuation): `+_(l)+`
Available cash: `+_(u));return}if(t.projects>0){alert("Cannot merge — subsidiary has "+t.projects+" active project(s). Complete or abandon them first.");return}if(confirm('MERGE "'+e.name+`" INTO YOUR CORPORATION

Acquisition cost (2.25× valuation): `+_(l)+`
Subsidiary cash absorbed: `+_(a)+`
Net cost: `+_(l-a)+`

• `+i.length+` properties transferred to parent
• Subsidiary subsector "`+s+`" added to portfolio
• Workers hired to max capacity (+`+m.toLocaleString()+`)
• Reputation: +`+p+" or -"+f+" (from sub rep "+r+`)

This cannot be undone.`)){se=!0;try{const g=c.nation_id;if(i.length>0){const C=i.filter(k=>k.id!==e.id).map(k=>k.id);if(C.length===1){const{error:k}=await y.from("corp_properties").update({nation_id:g,type:"office"}).eq("id",C[0]);if(k)throw k}else if(C.length>1){const{error:k}=await y.from("corp_properties").update({nation_id:g,type:"office"}).in("id",C);if(k)throw k}const{error:M}=await y.from("corp_properties").update({nation_id:g,type:"office",sub_cash:0,subsector:null}).eq("id",e.id);if(M)throw M}const b=u-l+a,h=Number(c?.corp_general_workforce??0)+m,E=Math.random()>=.5?p:-f,T=Number(c?.standing??50),S=Math.max(0,Math.min(100,T+E)),{error:w}=await y.from("factions").update({corp_cash_reserves:b,corp_general_workforce:h,standing:S}).eq("id",c.id);if(w)throw w;c.corp_cash_reserves=b,c.corp_general_workforce=h,c.standing=S,tt(b),await to(),alert(`Merger complete!

"`+e.name+`" absorbed into your corporation.
Cost: `+_(l)+" | Cash absorbed: "+_(a)+`
Reputation `+(E>=0?"+":"")+E+" (now "+S+`)
Workers hired: +`+m.toLocaleString()+` general workforce
Properties: `+i.length+" transferred to parent")}catch(g){alert("Merge failed: "+g.message)}finally{se=!1}}}window.subDissolve=qs;window.subInjectCapital=Ls;window.subWithdraw=Os;window.subMerge=Bs;window.subSell=zs;window.subPutForSale=Is;window.subPlaceBid=Ns;window.subViewBids=As;window.subCancelSale=Rs;window.selectSubsidiary=function(o){mt=o,oo()};let It=[],Bt={},ve=null,si=!1,ot="",Yt="",it="",Me="";const la={Construction:4,Finance:5,Shipping:4},Ps=["Construction","Shipping","Finance"],ca={Construction:[{id:"civil",name:"Civil Engineering",mod:0},{id:"industrial",name:"Industrial Construction",mod:.25},{id:"mega",name:"Megaprojects",mod:.4}],Shipping:[{id:"bulk_cargo",name:"Bulk Cargo",mod:0},{id:"container_freight",name:"Container Freight",mod:.2},{id:"specialized_transport",name:"Specialized Transport",mod:.35}],Finance:[{id:"banking",name:"Banking",mod:0},{id:"insurance",name:"Insurance",mod:.15},{id:"investment",name:"Investment Management",mod:.3}],Technology:[{id:"software",name:"Software Development",mod:0},{id:"hardware",name:"Hardware Manufacturing",mod:.2},{id:"telecom",name:"Telecommunications",mod:.35}],Energy:[{id:"oil_gas",name:"Oil & Gas",mod:0},{id:"renewables",name:"Renewables",mod:.2},{id:"mining",name:"Mining",mod:.3}],Healthcare:[{id:"pharma",name:"Pharmaceuticals",mod:0},{id:"hospitals",name:"Hospital Systems",mod:.2},{id:"biotech",name:"Biotechnology",mod:.35}]};async function Ds(){const{data:o,error:e}=await y.from("nations").select("*").order("name");e&&console.warn("[Subsidiary] Failed to load nations:",e.message),It=(o||[]).filter(i=>i.id!==c?.nation_id);const{data:t}=await y.from("factions").select("nation_id").eq("faction_type","corporation").is("abandoned_at",null);Bt={};for(const i of t||[])i.nation_id&&(Bt[i.nation_id]=(Bt[i.nation_id]||0)+1);it=c?.corp_sector||"",Me=c?.corp_subsector||""}function da(){const o=it||c?.corp_sector||"";return ca[o]||[{id:"general",name:o||"General",mod:0}]}function js(o){it=o;const e=ca[o];Me=e?e[0].name:"",io()}function pa(){const o=c?.corp_sector||"";return it===o?1:la[it]||4}function Fs(){const e=da().find(t=>t.name===Me);return e?e.mod:0}function Si(o){const e=Number(o.standard_of_living??50);return Math.max(.5,Math.round(e/50*100)/100)}function fa(o){const t=pa(),i=1+Fs(),n=Si(o);return Math.round(Math.max(1e7,5e7*t*i*n))}function Us(o){const e=Bt[o]||0;return e<=1?{label:"HIGH",color:"#5c5"}:e<=3?{label:"MODERATE",color:"#ca5"}:{label:"LOW",color:"#c55"}}function Hs(o){if(ve=ve===o?null:o,ve){const e=It.find(t=>t.id===ve);ot=(c?.faction_name||"Subsidiary")+" "+(e?.name||"")}else ot="";io()}function Gs(o){Me=o,io()}function Vs(o){ot=o}function Ws(o){Yt=o.toUpperCase().slice(0,4)}async function Ys(){if(si||!ve)return;const o=It.find(r=>r.id===ve);if(!o)return;const e=(ot||"").trim(),t=(Yt||"").trim();if(!e){alert("Please enter a corporation name for the subsidiary.");return}if(t.length<2){alert("Please enter an abbreviation (2-4 chars).");return}if(G.find(r=>r.nation_id===o.id&&r.type==="regional_hq")){alert("You already have a subsidiary in "+o.name);return}const n=fa(o),a=Number(c?.corp_cash_reserves??0);if(n>a){alert("Insufficient cash. Entry cost: "+_(n)+", available: "+_(a));return}if(confirm("Establish subsidiary in "+o.name+`?

Name: `+e+" ("+t+`)
Subsector: `+(Me||"General")+`
Entry cost: `+_(n)+`
Creates a Regional HQ (500 capacity)
Unlocks `+o.name+` for operations

Deducted from cash reserves.`)){si=!0;try{const s=(await y.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0,l=85+Math.floor(Math.random()*16),p=Math.round(n*.005),{error:f}=await y.from("corp_properties").insert({faction_id:c.id,nation_id:o.id,name:e,type:"regional_hq",style:"Modern",capacity:500,purchase_price:n,monthly_maintenance:p,condition:l,city:o.capital||o.name,purchased_at_tick:s,is_active:!0,subsector:Me||c?.corp_subsector||null});if(f)throw f;const d=Math.max(0,a-n);await y.from("factions").update({corp_cash_reserves:d}).eq("id",c.id),c.corp_cash_reserves=d,tt(d);const v=it||c?.corp_sector||"Unknown";try{await y.from("event_log").insert({nation_id:o.id,event_name:"New Subsidiary Established",category:"corporate",description_chosen:`${c.faction_name} has invested ${_(n)} to establish ${e}, a new ${v} corporation in ${o.name}.`,fired_at_tick:I?.current_tick||0})}catch{}try{const{data:m}=await y.from("nations").select("gdp_growth").eq("id",o.id).single();m&&await y.from("nations").update({gdp_growth:Math.min(100,Number(m.gdp_growth||50)+.2)}).eq("id",o.id)}catch{}ve=null,ot="",Yt="",await to(),alert('Subsidiary "'+e+'" established in '+o.name+`!

Cost: `+_(n)+`
Regional HQ created with `+l+"% condition.")}catch(r){alert("Failed: "+r.message)}finally{si=!1}}}function io(){const o=document.getElementById("create-subsidiary-container");if(!o)return;const e="'JetBrains Mono', monospace",t={bg:"#121210",surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i=c?.corp_sector||"General",n=c?.corp_subsector||"",a=da(),r=a.find(k=>k.name===Me)||a[0],s=new Set(G.filter(k=>k.type==="regional_hq").map(k=>k.nation_id)),l=It.filter(k=>!s.has(k.id)),p=ve?l.find(k=>k.id===ve):null,f=ot.trim().length>0&&Yt.trim().length>=2&&p!==null,d=it||i,v=pa();let m=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Sector</div>
        <div style="display:flex;gap:3px;">
            ${Ps.map(k=>{const z=k===d,q=k===i,P=q?1:la[k]||4,U=q?t.greenBright:t.orange;return`<div onclick="subSetSector('${k}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${z?t.accent+"18":"transparent"};border:1px solid ${z?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${z?t.accentBright:t.dim}">${k}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${U}">${q?"PARENT · ×1":"×"+P+" COST"}</div>
                </div>`}).join("")}
        </div>
        ${v>1?`<div style="font-family:${e};font-size:7px;color:${t.orange};margin-top:4px;padding:3px 6px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);">Cross-sector subsidiary: base cost ×${v}</div>`:""}
    </div>`,u=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsector</div>
        <div style="display:flex;gap:3px;">
            ${a.map(k=>{const z=k.name===Me,q=k.name===n;return`<div onclick="subSetSubsector('${k.name.replace(/'/g,"\\'")}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${z?t.accent+"18":"transparent"};border:1px solid ${z?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:8px;font-weight:700;color:${z?t.accentBright:t.dim}">${k.name}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${q?t.greenBright:k.mod>0?t.orange:t.dim}">${q?"SAME — ±0%":k.mod>0?"+"+Math.round(k.mod*100)+"%":"±0%"}</div>
                </div>`}).join("")}
        </div>
    </div>`,g="";if(l.length===0)g=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Subsidiaries in all available nations.</div>`;else for(const k of l){const z=k.id===ve,q=Us(k.id),P=Bt[k.id]||0,U=Math.round(Number(k.standard_of_living??50)),F=Si(k);g+=`
            <div onclick="subSelectNation('${k.id}')" style="display:flex;align-items:center;padding:4px 8px;margin-bottom:2px;cursor:pointer;background:${z?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${z?t.accent+"44":t.border};border-left:${z?"2px solid "+t.accent:"2px solid transparent"};">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:11px;font-weight:600;color:${z?t.text:t.muted}">${k.name}</span>
                        <span style="font-family:${e};font-size:7px;font-weight:700;padding:0 4px;color:${q.color};background:${q.color}12;border:1px solid ${q.color}25;line-height:12px">${q.label}</span>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:2px;">
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">STD/LIVING: <span style="color:${t.muted}">${U}</span></span>
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">CORPS: <span style="color:${P>=4?t.red:P>=2?t.yellow:t.greenBright}">${P}</span></span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${F>1?t.orange:t.greenBright}">×${F.toFixed(2)}</div>
                </div>
            </div>`}let b=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="margin-bottom:6px;">
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Corporation Name</div>
            <input type="text" value="${(ot||"").replace(/"/g,"&quot;")}" oninput="subSetName(this.value)" placeholder="e.g., ${(c?.faction_name||"Corp")+" "+(p?.name||"International")}" style="width:100%;padding:5px 8px;font-family:${e};font-size:10px;color:${t.text};background:${t.card};border:1px solid ${t.border};outline:none;box-sizing:border-box;" />
        </div>
        <div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Abbreviation (2-4 chars)</div>
            <input type="text" value="${(Yt||"").replace(/"/g,"&quot;")}" oninput="subSetAbbr(this.value)" placeholder="${(c?.faction_name||"CORP").slice(0,2).toUpperCase()+(p?.name||"XX").slice(0,2).toUpperCase()}" maxlength="4" style="width:80px;padding:5px 8px;font-family:${e};font-size:12px;font-weight:700;color:${t.gold};background:${t.card};border:1px solid ${t.border};outline:none;text-align:center;letter-spacing:2px;" />
        </div>
    </div>`;const $=[{rule:"Bid on projects in that nation",icon:"✓",color:t.greenBright},{rule:"Hires local workers at nation rates",icon:"✓",color:t.greenBright},{rule:"Must use parent's materials & vehicles",icon:"!",color:t.orange},{rule:"Reputation gain: 75% sub / 25% parent",icon:"◐",color:t.gold},{rule:"Market revenue at 50% parent rate",icon:"◐",color:t.gold},{rule:"Counts as domestic corporation",icon:"✓",color:t.greenBright},{rule:"Starting reputation: 25",icon:"●",color:t.muted}];let h=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsidiary Rules</div>
        <div style="background:${t.card};border:1px solid ${t.border};padding:6px 8px;">
            ${$.map((k,z)=>`<div style="display:flex;align-items:center;gap:6px;padding:2px 0;${z<$.length-1?"border-bottom:1px solid "+t.border:""}">
                <span style="font-family:${e};font-size:9px;color:${k.color};width:12px;text-align:center">${k.icon}</span>
                <span style="font-size:9px;color:${t.muted}">${k.rule}</span>
            </div>`).join("")}
        </div>
    </div>`;const E=5e7,T=r.mod,S=p?Si(p):null,w=p?fa(p):null,C=Math.round(E*v*(1+T));let M=`
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
            <span style="font-family:${e};font-size:8px;color:${t.dim}">SUBSECTOR (${r.name})</span>
            <span style="font-family:${e};font-size:9px;color:${T===0?t.greenBright:t.orange}">${T===0?"±0%":"+"+Math.round(T*100)+"%"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">NATION (${p?p.name:"select below"})</span>
            <span style="font-family:${e};font-size:9px;color:${p?S>1?t.orange:t.greenBright:t.dim}">${p?"×"+S.toFixed(2):"—"}</span>
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
            ${m}
            ${u}
            <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
                <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Nation</div>
                ${g}
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
    </div>`}window.subSelectNation=Hs;window.subCreate=Ys;window.subSetName=Vs;window.subSetAbbr=Ws;window.subSetSector=js;window.subSetSubsector=Gs;let Pt=[],We=0,To=JSON.parse(localStorage.getItem("nationhood_investigated_corps")||"{}"),xe="ALL",De="REPUTATION";async function Qs(){const[o,e]=await Promise.all([y.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, corp_reputation, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name"),y.from("corp_properties").select("id, faction_id, name, nation_id, subsector, type, factions(faction_name, corp_sector, corp_ticker, abbreviation, corp_reputation, corp_company_type, linked_user_id)").eq("type","regional_hq").eq("is_active",!0)]),t={};for(const r of o.data||[])t[r.id]=r;const i=(o.data||[]).map(r=>{const s=(r.corp_company_type||"Private").toUpperCase(),l=Number(r.corp_cash_reserves||0);return{...r,abbr:r.corp_ticker||r.abbreviation||r.faction_name?.slice(0,4).toUpperCase()||"???",status:s,isPlayer:!!r.linked_user_id,reputation:Math.round(Number(r.corp_reputation??50)),revenue:Math.round(l*.1),valuation:Math.round(l*3),_isSub:!1}}),{data:n}=await y.from("nations").select("id, name"),a={};(n||[]).forEach(r=>{a[r.id]=r.name});for(const r of e.data||[]){const s=t[r.faction_id];if(!s)continue;const l=(s.corp_company_type||"Private").toUpperCase();i.push({id:r.id,faction_name:r.name||"Subsidiary",abbreviation:s.abbreviation,corp_sector:s.corp_sector,corp_subsector:r.subsector||s.corp_subsector,corp_ticker:s.corp_ticker,nation_id:r.nation_id,nation:a[r.nation_id]||"?",abbr:(s.corp_ticker||s.abbreviation||"??").slice(0,4),status:l,isPlayer:!!s.linked_user_id,reputation:Math.round(Number(s.corp_reputation??50)),revenue:0,valuation:0,_isSub:!0,_parentName:s.faction_name})}Pt=i}function Ks(o){We=o,no()}function Js(o){xe=o,We=0,no()}function Xs(o){De=o,We=0,no()}async function Zs(o){if(!c||!I)return;const e=Number(c.corp_cash_reserves??0);if(e<5e5){alert("Insufficient cash. Need $500k.");return}const{error:t}=await y.from("factions").update({corp_cash_reserves:e-5e5}).eq("id",c.id);if(t){alert("Failed: "+t.message);return}c.corp_cash_reserves=e-5e5,To[o]=!0,localStorage.setItem("nationhood_investigated_corps",JSON.stringify(To));const{data:i}=await y.from("factions").select("corp_cash_reserves, corp_loans, corp_reputation, corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce").eq("id",o).single();if(i){const n=Pt.find(a=>a.id===o);if(n){Object.assign(n,i);const a=Number(i.corp_cash_reserves||0);n.reputation=Math.round(Number(i.corp_reputation??50)),n.revenue=Math.round(a*.1),n.valuation=Math.round(a*3)}}no()}function no(){const o=document.getElementById("corporations-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},i={PUBLIC:{color:t.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:t.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:t.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},n=[...new Set(Pt.map(m=>m.nation).filter(Boolean))];let a=[...Pt];xe!=="ALL"&&(a=a.filter(m=>m.nation===xe)),De==="REPUTATION"?a.sort((m,u)=>(u.reputation||0)-(m.reputation||0)):De==="REVENUE"?a.sort((m,u)=>(u.revenue||0)-(m.revenue||0)):De==="VALUATION"&&a.sort((m,u)=>(u.valuation||0)-(m.valuation||0)),We>=a.length&&(We=0);const r=a[We]||null;I?.current_tick;const s=r&&!!To[r.id],l=r&&r.status==="PRIVATE"&&!s,p=r&&r.status==="STATE";let f="";a.length===0&&(f=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No corporations found.</div>`);for(let m=0;m<a.length;m++){const u=a[m],g=m===We,b=i[u.status]||i.PRIVATE,$=u.status==="PRIVATE"&&!To[u.id];f+=`
        <div onclick="corpSelect(${m})" style="display:flex;align-items:center;padding:7px 16px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${g?t.accent:"transparent"};background:${g?"rgba(139,154,107,0.03)":"transparent"};">
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
        </div>`}let d="";if(r){const m=i[r.status]||i.PRIVATE,u=[...r._isSub?[{label:"Parent",value:r._parentName||"—",color:"#8a6aaa"}]:[],{label:"Sector",value:r.corp_sector||"—",color:t.text},{label:"Subsector",value:r.corp_subsector||"—",color:t.accent},{label:"Reputation",value:r.reputation+"/100",color:r.reputation>=70?t.greenBright:r.reputation>=40?t.accent:t.yellow},{label:"Revenue",value:l?"UNDISCLOSED":_(r.revenue),color:l?t.dim:t.greenBright},{label:"Cash Reserves",value:l?"UNDISCLOSED":_(r.corp_cash_reserves||0),color:l?t.dim:t.text},{label:"Market Valuation",value:l?"UNDISCLOSED":_(r.valuation),color:l?t.dim:t.gold}];d=`
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
        ${u.map(g=>`<div style="display:flex;justify-content:space-between;padding:5px 16px;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:10px;color:${t.dim};text-transform:uppercase">${g.label}</span>
            <span style="font-family:${e};font-size:11px;font-weight:700;color:${g.value==="UNDISCLOSED"?t.dim:g.color};${g.value==="UNDISCLOSED"?"font-style:italic;":""}">${g.value}</span>
        </div>`).join("")}
        <div style="padding:6px 14px;border-bottom:1px solid ${t.border};flex-shrink:0;">
            <div style="width:100%;height:4px;background:${t.border}"><div style="width:${r.reputation}%;height:100%;background:${r.reputation>=70?t.greenBright:r.reputation>=40?t.accent:t.yellow}"></div></div>
        </div>
        ${l?`<div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:rgba(200,168,50,0.03);">
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
                <div onclick="${l?`corpInvestigate('${r.id}')`:""}" style="flex:1;padding:5px 0;text-align:center;cursor:${l?"pointer":"default"};font-family:${e};font-size:8px;font-weight:700;color:${l?t.blue:s?t.greenBright:t.dim};border:1px solid ${l?t.blue+"44":s?t.greenBright+"44":t.border};opacity:${l?1:.3}">${s?"INVESTIGATED ✓":"INVESTIGATE — $500k"}</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;color:${t.accent};border:1px solid ${t.accent}44">PARTNER</div>
            </div>
            <div style="display:flex;gap:4px;">
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${p?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${p?t.dim:t.gold};border:1px solid ${p?t.border:t.gold+"44"};opacity:${p?.3:1}">ACQUIRE</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${p?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${p?t.dim:t.orange};border:1px solid ${p?t.border:t.orange+"44"};opacity:${p?.3:1}">MERGER</div>
            </div>
            ${p?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${t.dim}">State-owned corps cannot be acquired or merged.</div>`:""}
        </div>`}else d=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a corporation to view details.</div>`;const v=`
    <div style="padding:6px 16px;border-bottom:1px solid ${t.border};background:${t.card};display:flex;gap:12px;align-items:center;flex-shrink:0;">
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px;width:40px">NATION</span>
            <span onclick="corpFilterNation('ALL')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${xe==="ALL"?"#000":t.dim};background:${xe==="ALL"?t.accent:"transparent"};border:1px solid ${xe==="ALL"?t.accent:t.border}">ALL</span>
            ${n.map(m=>`<span onclick="corpFilterNation('${m}')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${xe===m?"#000":t.dim};background:${xe===m?t.accent:"transparent"};border:1px solid ${xe===m?t.accent:t.border}">${m}</span>`).join("")}
        </div>
        <div style="flex:1"></div>
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">SORT</span>
            ${["REPUTATION","REVENUE","VALUATION"].map(m=>`<span onclick="corpSort('${m}')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${De===m?"#000":t.dim};background:${De===m?t.accent:"transparent"};border:1px solid ${De===m?t.accent:t.border}">${m}</span>`).join("")}
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
    </div>`}window.corpSelect=Ks;window.corpInvestigate=Zs;window.corpFilterNation=Js;window.corpSort=Xs;let ce=null,Ie={},K=120,Ne=15,zi={},ut=[],Ye=[],kt={};async function el(){if(!Je)return;if(Et[Je.id]){alert("You already have a bid on this contract. Retract it first if you want to re-bid.");return}ce=Je,zi={};try{const{data:t}=await y.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",c.id);for(const i of t||[])zi[yo(i.material_key)]=Number(i.quantity||0)}catch{}ut=[];try{const{data:t}=await y.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",ce.id).in("status",["pending","won"]);ut=(t||[]).filter(i=>i.faction_id!==c?.id).map(i=>({name:i.factions?.faction_name||"Unknown",ticker:i.factions?.corp_ticker||"???",price:Number(i.bid_price||0),quality:Number(i.estimated_quality||0),status:i.status}))}catch{}Ye=[],kt={};try{const{data:t,error:i}=await y.rpc("get_project_permit_requirements",{p_contract_id:ce.id,p_faction_id:c.id,p_nation_id:ce.nation_id});if(i)throw i;Ye=Array.isArray(t)?t:[];const n=Ye.map(a=>a.permit_key).filter(Boolean);if(n.length>0){const{data:a,error:r}=await y.from("construction_permits").select("permit_key, cost, processing_ticks").in("permit_key",n);if(r)throw r;for(const s of a||[])kt[s.permit_key]={cost:Number(s.cost||0),ticks:Number(s.processing_ticks||0)}}}catch(t){console.warn("Failed to load project permit requirements",t),Ye=[],kt={}}Ie={};const o=ce.required_materials||{};for(const t of Object.keys(o))Ie[t]="STD";const e=ce.required_workforce||{};K=Number(e.general||0)+Number(e.skilled||0)||120,Ne=15,Xt(),Fo()}function tn(){document.getElementById("bid-assembly-overlay")?.remove(),ce=null,Ye=[],kt={}}function tl(o,e){Ie[o]=e,Fo()}function ol(o){K=o,Fo()}function il(o){Ne=o,Fo()}function Fo(){if(document.getElementById("bid-assembly-overlay")?.remove(),!ce)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=ce,i=t.issuer_type==="GOVERNMENT",n=N?.name||c?.nation||"—",a=Number(t.budget_ceiling||0),r=Number(t.timeline_ticks||8),s=t.required_materials||{},l=Object.keys(s),p={LOW:.5,STD:1,HIGH:2},f={LOW:e.orange,STD:e.yellow,HIGH:e.greenBright},d={LOW:"Low",STD:"Standard",HIGH:"High"},v={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},m=zi||{};let u=0,g="";for(const O of l){const W=Number(s[O]||0),an=Ie[O]||"STD",rn=v[O]||3e5,_a=p[an],ha=Math.round(rn*_a),sn=W*ha;u+=sn;const $a=O.replace(/_/g," ").replace(/\b\w/g,Le=>Le.toUpperCase()),ln=Number(m[O]||0),Go=Math.max(0,W-ln),wa=Go===0?e.greenBright:Go<W?e.yellow:e.red,ka=Go===0?"✓ IN STOCK":`${ln}/${W}`;g+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${e.text}">${$a}</span>
                <div style="font-family:${o};font-size:7px;color:${wa};margin-top:1px">${ka}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${o};font-size:9px;color:${e.muted}">${W.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(Le=>{const Vo=an===Le,cn=f[Le],Ea=_(Math.round(rn*p[Le]));return`<span onclick="bidSetGrade('${O}','${Le}')" style="padding:2px 6px;font-family:${o};font-size:7px;font-weight:700;cursor:pointer;color:${Vo?"#000":e.dim};background:${Vo?cn:"transparent"};border:1px solid ${Vo?cn:e.border}" title="${Ea}/unit">${d[Le]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${o};font-size:10px;color:${e.text}">${_(sn)}</span></div>
        </div>`}const b=t.required_workforce||{},$=Number(b.general||0)+Number(b.skilled||0)||100,h=Math.max(40,Math.round($*.5)),E=$*2,T=[h,Math.round($*.75),$,Math.round($*1.5),E],S=Math.max(0,Math.min(1,(K-h)/(E-h||1))),w=r,C=Math.round(4.5-S*8),M=Math.max(Math.round(w*.6),w+C),k=C>0?`+${C}mo`:C<0?`${C}mo`:"On schedule",z=C>0?e.red:C<0?e.greenBright:e.yellow,q=15200,P=K*q*M,U=(Ye||[]).map(O=>{const W=kt[O.permit_key]||{};return{permit_key:O.permit_key,name:O.permit_name||O.permit_key,requiredByPolicy:O.required_by_policy||"—",hasPermit:!!O.has_permit,statusLabel:O.status_label||(O.has_permit?"HAS_PERMIT":"NEEDS_TO_GET"),cost:Number(W.cost||0),ticks:Number(W.ticks||0)}}),F=U.filter(O=>!O.hasPermit).reduce((O,W)=>O+W.cost,0),oe=4e5,B=u+P+F+oe,A=Math.round(B*(Ne/100)),H=B+A,j=H>a,V=A,ee=j?0:Math.max(0,Math.min(100,Math.round(100-H/a*100+30))),qe=ee>70?e.greenBright:ee>40?e.yellow:ee>0?e.orange:e.red,Ho=j?"OVER CEILING":ee>70?"STRONG":ee>40?"COMPETITIVE":ee>20?"WEAK":"UNLIKELY",pe=Object.values(Ie),ge=pe.length>0?Math.round(pe.reduce((O,W)=>O+(W==="HIGH"?85:W==="STD"?65:45),0)/pe.length):50,ao=ge>=75?e.greenBright:ge>=50?e.yellow:ge>=25?e.orange:e.red,ba=ge>=75?"EXCELLENT":ge>=50?"FAIR":ge>=25?"POOR":"BAD",rt=document.createElement("div");rt.id="bid-assembly-overlay",rt.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",rt.addEventListener("click",O=>{O.target===rt&&tn()}),rt.innerHTML=`
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
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(u)}</span>
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
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">${K} × $${q.toLocaleString()}/tick × ${M} ticks</span>
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
                        <span style="font-family:${o};font-size:10px;font-weight:700;color:${z}">${M}mo <span style="font-size:8px;opacity:0.7">(${k})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${U.length===0?`<div style="padding:8px 14px;border-bottom:1px solid ${e.border};font-family:${o};font-size:8px;color:${e.dim};">No active permit laws apply to this project.</div>`:""}
                ${U.map(O=>{const W=O.hasPermit;return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
                        <div style="flex:1;display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${o};font-size:8px;font-weight:700;color:${W?e.greenBright:e.orange}">${W?"✓":"○"}</span>
                            <span style="font-size:10px;color:${W?e.muted:e.text}">${O.name}</span>
                        </div>
                        ${W?`<span style="font-family:${o};font-size:8px;color:${e.greenBright}">${O.statusLabel}</span>`:`<div style="text-align:right">
                                <span style="font-family:${o};font-size:9px;color:${e.redDim}">${_(O.cost)}</span>
                                <span style="font-family:${o};font-size:7px;color:${e.dim};margin-left:4px">${O.ticks}t</span>
                            </div>`}
                    </div><div style="padding:0 14px 4px 28px;border-bottom:1px solid ${e.border};font-family:${o};font-size:7px;color:${e.dim};">Required by: ${x(O.requiredByPolicy)}</div>`}).join("")}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${o};font-size:9px;color:${e.muted}">PERMIT COSTS</span>
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(F)}</span>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${o};font-size:9px;color:${e.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(oe)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v:u},{l:"Labor",v:P},{l:"Permits",v:F},{l:"Overhead",v:oe}].map(O=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
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
                        <span style="font-family:${o};font-size:16px;font-weight:700;color:${e.gold}">${Ne}%</span>
                    </div>
                    <input type="range" min="0" max="40" step="1" value="${Ne}" oninput="bidSetMarkup(+this.value)" style="width:100%;accent-color:${e.gold};height:6px;" />
                    <div style="display:flex;justify-content:space-between;font-family:${o};font-size:7px;color:${e.dim};margin-top:2px;">
                        <span>0% (at cost)</span><span>40% (maximum)</span>
                    </div>
                </div>

                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${j?"rgba(204,85,85,0.04)":"rgba(200,168,50,0.03)"};">
                    <div style="font-family:${o};font-size:8px;color:${e.dim};margin-bottom:4px">YOUR BID PRICE</div>
                    <div style="font-family:${o};font-size:22px;font-weight:700;color:${j?e.red:e.gold}">${_(H)}</div>
                    ${j?`<div style="font-family:${o};font-size:8px;font-weight:700;color:${e.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${_(a)})</div>`:""}
                </div>

                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">PROJECTED PROFIT</span>
                        <span style="font-family:${o};font-size:14px;font-weight:700;color:${V>0?e.greenBright:e.dim}">+${_(V)}</span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Bid Assessment</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">COMPETITIVENESS</span>
                        <span style="font-family:${o};font-size:11px;font-weight:700;color:${qe}">${Ho}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${ee}%;height:100%;background:${qe}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${o};font-size:11px;font-weight:700;color:${ao}">${ge}</span>
                            <span style="font-family:${o};font-size:8px;color:${e.dim}">/100</span>
                            <span style="font-family:${o};font-size:8px;font-weight:700;color:${ao}">${ba}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${ge}%;height:100%;background:${ao}"></div></div>
                    <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="font-family:${o};font-size:8px;color:${e.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${ut.length===0?`<div style="font-family:${o};font-size:8px;color:${e.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${ut.map(O=>`<span style="padding:2px 6px;font-family:${o};font-size:7px;color:${e.muted};background:${e.card};border:1px solid ${e.border};">${O.name} <span style="color:${e.dim}">Q:${O.quality}</span></span>`).join("")}
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
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">YOUR BID</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${j?e.red:e.gold}">${_(H)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">EST. PROFIT</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${e.greenBright}">+${_(V)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${ao}">${ge}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${o};font-size:10px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="${j?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${o};font-size:10px;font-weight:700;letter-spacing:1px;color:${j?e.dim:"#000"};background:${j?e.border:e.gold};cursor:${j?"not-allowed":"pointer"};opacity:${j?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(rt)}let li=!1;async function nl(){if(li||!ce)return;const o=ce,e=o.required_materials||{},t=Object.keys(e),i=Number(o.budget_ceiling||0),n=Number(o.timeline_ticks||8),a={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},r={LOW:.5,STD:1,HIGH:2};let s=0;for(const M of t){const k=Number(e[M]||0),z=Ie[M]||"STD",q=a[M]||3e5;s+=k*Math.round(q*r[z])}const l=15200,p=o.required_workforce||{},f=Number(p.general||0)+Number(p.skilled||0)||100,d=Math.max(40,Math.round(f*.5)),v=f*2,m=Math.max(0,Math.min(1,(K-d)/(v-d||1))),u=Math.round(4.5-m*8),g=Math.max(Math.round(n*.6),n+u),b=K*l*g,$=(Ye||[]).filter(M=>!M.has_permit).reduce((M,k)=>M+Number(kt[k.permit_key]?.cost||0),0),E=s+b+$+4e5,T=Math.round(E*(Ne/100)),S=E+T;if(S>i){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const w=Object.values(Ie),C=w.length>0?Math.round(w.reduce((M,k)=>M+(k==="HIGH"?85:k==="STD"?65:45),0)/w.length):50;if(confirm('Submit bid for "'+o.name+`"?

Bid Price: `+_(S)+`
Est. Cost: `+_(E)+`
Markup: `+Ne+"% ("+_(T)+`)
Quality: `+C+`/100
Workers: `+K+`

Once submitted, your bid cannot be changed.`)){li=!0;try{const{data:M}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),k=M?.current_tick||0,z={};for(const P of t)z[P]=Ie[P]||"STD";const{error:q}=await y.from("contract_bids").insert({contract_id:o.id,faction_id:c.id,bid_price:S,material_grades:z,labor_count:K,markup_pct:Ne,estimated_cost:E,estimated_quality:C,status:"pending",submitted_at_tick:k});if(q)throw q;o.status==="open"&&await y.from("construction_contracts").update({status:"bidding"}).eq("id",o.id).eq("status","open"),tn(),alert(`Bid submitted successfully!

Contract: `+o.name+`
Your Bid: `+_(S)+`
Quality: `+C+`/100

Bids will be resolved when the bidding window closes (`+(o.bidding_ends_tick?"tick "+o.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof Ae=="function"&&await Ae()}catch(M){alert("Bid submission failed: "+M.message)}finally{li=!1}}}window.openBidAssembly=el;window.closeBidAssembly=tn;window.bidSetGrade=tl;window.bidSetWorkers=ol;window.bidSetMarkup=il;window.submitBidAssembly=nl;let ci=!1;async function al(o){if(ci)return;const e=1e6,t=Number(c?.corp_cash_reserves??0);if(t<e){alert("Cannot retract — you need at least $1M in cash reserves to cover the retraction penalty.");return}if(confirm(`Retract your bid?

This will cost $1M as a retraction penalty.
This action cannot be undone.`)){ci=!0;try{const i=t-e,{error:n}=await y.from("factions").update({corp_cash_reserves:i}).eq("id",c.id);if(n)throw n;const{error:a}=await y.from("contract_bids").delete().eq("contract_id",o).eq("faction_id",c.id);if(a)throw a;c.corp_cash_reserves=i,typeof tt=="function"&&tt(i),alert("Bid retracted. $1M penalty applied."),Xt(),await Ae()}catch(i){alert("Failed to retract bid: "+(i.message||"Unknown error"))}finally{ci=!1}}}window.retractBid=al;let Qt=[],Qe=0,ye=null,di=!1,pi=!1,fi=!1;async function rl(){if(!Je||pi)return;pi=!0,ye=Je,Qe=0;const{data:o,error:e}=await y.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",ye.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(pi=!1,e){alert("Failed to load bids: "+e.message);return}Qt=(o||[]).map(t=>({...t,corp:t.factions?.faction_name||"Unknown",abbr:t.factions?.corp_ticker||"???",subsector:t.factions?.corp_subsector||"—"})),Xt(),ma()}function Uo(){document.getElementById("bid-review-overlay")?.remove(),ye=null}function sl(o){Qe=o,ma()}async function ll(){if(di||Qt.length===0)return;const o=Qt[Qe];if(!(!o?.id||!o.faction_id)&&confirm("Accept bid from "+o.corp+`?

Bid Price: `+_(o.bid_price)+`
Quality: `+o.estimated_quality+`/100
Workers: `+o.labor_count+`

This will award the contract. The project begins immediately.`)){di=!0;try{const{data:e}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{error:i}=await y.from("contract_bids").update({status:"won"}).eq("id",o.id);if(i)throw i;const{error:n}=await y.from("contract_bids").update({status:"lost"}).eq("contract_id",ye.id).neq("id",o.id);if(n)throw n;const{error:a}=await y.from("construction_contracts").update({status:"awarded",awarded_to_faction:o.faction_id,awarded_at_tick:t}).eq("id",ye.id);if(a)throw a;Uo(),alert("Contract awarded to "+o.corp+`!

Bid: `+_(o.bid_price)+`
Project begins immediately.`),typeof Ae=="function"&&await Ae()}catch(e){alert("Failed to accept bid: "+(e.message||e))}finally{di=!1}}}async function cl(){if(!(!ye||fi)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){fi=!0;try{const{error:o}=await y.from("contract_bids").update({status:"lost"}).eq("contract_id",ye.id);if(o)throw o;const{error:e}=await y.from("construction_contracts").update({status:"expired"}).eq("id",ye.id);if(e)throw e;Uo(),alert("All bids declined. Contract cancelled."),typeof Ae=="function"&&await Ae()}catch(o){alert("Failed: "+(o.message||o))}finally{fi=!1}}}function ma(){if(document.getElementById("bid-review-overlay")?.remove(),!ye||Qt.length===0)return;const o="'JetBrains Mono', monospace",e={surface:"#1a1a16",card:"#1c1c18",border:"#2a2a24",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"#e8e4dc",muted:"#9e9a92",dim:"#6a6660"},t=ye,i=Qt;Qe>=i.length&&(Qe=0);const n=i[Qe],a=Number(t.budget_ceiling||0),r=Number(t.timeline_ticks||36),s=Math.min(...i.map(m=>m.bid_price)),l=Math.max(...i.map(m=>m.estimated_quality||0));let p="";for(let m=0;m<i.length;m++){const u=i[m],g=m===Qe,b=u.bid_price===s,$=(u.estimated_quality||0)===l,h=u.bid_price>a;p+=`
        <div onclick="reviewSelectBid(${m})" style="padding:10px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${g?e.accent:"transparent"};background:${g?"rgba(139,154,107,0.03)":"transparent"};">
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
        </div>`}const f=n.bid_price>a,d=a>0?Math.round(n.bid_price/a*100):0,v=document.createElement("div");v.id="bid-review-overlay",v.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",v.addEventListener("click",m=>{m.target===v&&Uo()}),v.innerHTML=`
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
            <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.gold}">${i.length} BID${i.length!==1?"S":""} RECEIVED</span>
            <div style="display:flex;gap:8px;font-family:${o};font-size:8px;color:${e.dim};">
                <span>Cheapest: <span style="color:${e.greenBright}">${_(s)}</span></span>
                <span>Best Quality: <span style="color:${e.accent}">${l}</span></span>
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
    </div>`,document.body.appendChild(v)}const Tt={Coastal:{color:"#8b9a6b",label:"COASTAL"},Container:{color:"#5a7aaa",label:"CONTAINER"},Bulk:{color:"#c8a832",label:"BULK"},Tanker:{color:"#c86a4a",label:"TANKER"},Reefer:{color:"#6a9a5a",label:"REEFER"},LNG:{color:"#c55",label:"LNG"}},dl={in_port:{color:"#8b9a6b",label:"IN PORT"},in_transit:{color:"#5a8aaa",label:"IN TRANSIT"},dry_dock:{color:"#c84",label:"DRY DOCK"},anchored:{color:"#ca5",label:"ANCHORED"},for_sale:{color:"#9e9a92",label:"FOR SALE"}};function ua(o){return o>=75?"#5c5":o>=50?"#ca5":o>=25?"#c84":"#c55"}function pl(o){return o>=60?"#5c5":o>=30?"#ca5":o>=15?"#c84":"#c55"}async function $e(){if(!c||c.corp_sector!=="Shipping")return;const{data:o,error:e}=await y.from("corp_vessels").select("*").eq("faction_id",c.id).order("vessel_class");e&&console.warn("Failed to load fleet:",e.message),he=o||[],Gt=null,Rt={},xo={};try{const t=he.map(i=>i.id);if(t.length>0){const{data:i}=await y.from("finance_active_loans").select("insured_vessel_id").in("insured_vessel_id",t).in("status",["current"]);for(const a of i||[])a.insured_vessel_id&&(Rt[a.insured_vessel_id]=!0);const{data:n}=await y.from("finance_loan_requests").select("insured_vessel_id").eq("requesting_faction_id",c.id).eq("request_type","insurance").eq("status","open").not("insured_vessel_id","is",null);for(const a of n||[])a.insured_vessel_id&&!Rt[a.insured_vessel_id]&&(xo[a.insured_vessel_id]=!0)}}catch(t){console.warn("Failed to load vessel insurance status:",t.message)}va()}function fl(o){Gt=Gt===o?null:o,va()}function va(){const o=document.getElementById("fl-count"),e=document.getElementById("fl-summary"),t=document.getElementById("fl-list"),i=document.getElementById("fl-footer");if(!o||!t)return;const n=he;o.textContent=n.length+" VESSEL"+(n.length!==1?"S":"");const a=n.filter(d=>d.status==="in_transit").length,r=n.filter(d=>d.status==="in_port"||d.status==="anchored").length,s=n.filter(d=>d.status==="dry_dock").length,l=n.reduce((d,v)=>d+(v.base_maintenance||0),0);e.innerHTML=[{label:"TRANSIT",value:a,color:"#5a8aaa"},{label:"IN PORT",value:r,color:"#8b9a6b"},{label:"DRY DOCK",value:s,color:"#c84"},{label:"MAINT/TICK",value:_(l),color:"#a44"}].map((d,v)=>`<div style="flex:1;padding:5px 8px;text-align:center;${v<3?"border-right:1px solid var(--border-0);":""}">
        <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">${d.label}</div>
        <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${d.color};margin-top:1px;">${d.value}</div>
    </div>`).join(""),n.length===0?t.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels in fleet.<br>Purchase ships to begin operations.</div>':t.innerHTML=n.map((d,v)=>{const m=Gt===v,u=Tt[d.vessel_class]||{color:"#666",label:"?"},g=dl[d.status]||{color:"#666",label:"?"},b=ua(d.condition),$=pl(d.fuel),h=d.condition<50||d.fuel<20,E=d.status==="in_transit",T=d.status==="dry_dock",S=I?.current_tick||0,w=Math.max(0,Math.floor((S-(d.built_at_tick||0))/12));let C=`<div onclick="flSelectVessel(${v})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${h?d.condition<50?b:$:"transparent"};background:${m?u.color+"06":"transparent"};">
                <div style="padding:7px 14px;">`;C+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x(d.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${u.color};background:${u.color}12;border:1px solid ${u.color}25;">${u.label}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${g.color};background:${g.color}12;border:1px solid ${g.color}25;">${g.label}</span>
            </div>`;const M=d.current_port_nation_id?"In port":E?"At sea":"—";if(C+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:5px;">${x(M)}</div>`,C+=`<div style="display:flex;gap:8px;margin-bottom:4px;">
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
                    <div style="padding:5px 8px;background:var(--bg-0);border:1px solid var(--border-0);margin-bottom:6px;">`;const k=[{label:"VESSEL CLASS",value:d.vessel_class},{label:"BUILT",value:"Tick "+(d.built_at_tick||0)},{label:"FUEL CAPACITY",value:(d.fuel_capacity||0).toLocaleString()+" tons"},{label:"LAST REFURBISH",value:d.last_refurbish_tick?"Tick "+d.last_refurbish_tick:"N/A"}];for(let F=0;F<k.length;F++)C+=`<div style="display:flex;justify-content:space-between;padding:2px 0;${F<3?"border-bottom:1px solid var(--border-0);":""}">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${k[F].label}</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);">${k[F].value}</span>
                    </div>`;C+="</div>";const z=E||T,q=Math.round((d.purchase_price||3e6)*.08*(1+(100-d.condition)/100)),P=Math.round((d.fuel_capacity||1e3)*50*(1-d.fuel/100)),U=Math.round((d.purchase_price||3e6)*(d.condition/100)*.6);if(C+=`<div style="display:flex;gap:4px;">
                    <div onclick="${z?"":"flRefurbish('"+d.id+"',"+q+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${z?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${z?"var(--text-dim)":"#5c5"};border:1px solid ${z?"var(--border-0)":"#2a5a3a"};background:${z?"transparent":"rgba(74,170,136,0.06)"};opacity:${z?.35:1};">REFURBISH<br><span style="font-weight:400;font-size:6px;">${_(q)}</span></div>
                    <div onclick="${E?"":"flRefuel('"+d.id+"',"+P+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${E?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${E?"var(--text-dim)":"#c86a4a"};border:1px solid ${E?"var(--border-0)":"rgba(200,106,74,0.3)"};opacity:${E?.35:1};">REFUEL<br><span style="font-weight:400;font-size:6px;">from ${_(P)}</span></div>
                    <div onclick="${z?"":"flSell('"+d.id+"','"+x(d.vessel_name).replace(/'/g,"")+"',"+U+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${z?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${z?"var(--text-dim)":"#c84"};border:1px solid ${z?"var(--border-0)":"rgba(204,136,68,0.3)"};opacity:${z?.35:1};">LIST<br><span style="font-weight:400;font-size:6px;">${_(U)}</span></div>
                </div>`,!E){const F=Rt&&Rt[d.id],oe=xo&&xo[d.id];C+='<div style="display:flex;gap:4px;margin-top:4px;">',F?C+=`<div style="flex:1;display:flex;gap:2px;">
                            <div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#5c5;border:1px solid rgba(92,204,92,0.2);background:rgba(92,204,92,0.04);">INSURED ✓</div>
                            <div onclick="event.stopPropagation();flFileClaim('${d.id}','${x(d.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#c55;border:1px solid rgba(204,85,85,0.2);background:rgba(204,85,85,0.04);">FILE CLAIM</div>
                        </div>`:oe?C+='<div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#ca5;border:1px solid rgba(202,165,50,0.2);background:rgba(202,165,50,0.04);">PENDING ⏳</div>':C+=`<div onclick="event.stopPropagation();flRequestInsurance('${d.id}','${x(d.vessel_name).replace(/'/g,"")}',${d.purchase_price||0})" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#aa7a5a;border:1px solid rgba(170,122,90,0.3);background:rgba(170,122,90,0.04);">INSURE</div>`,C+=`<div onclick="flRename('${d.id}','${x(d.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:var(--text-muted);border:1px solid var(--border-0);">RENAME</div>`,C+="</div>"}E&&(C+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel at sea — actions available on arrival</div>'),T&&(C+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel in dry dock — repairs in progress</div>'),C+="</div>"}return C+="</div></div>",C}).join("");const p={};for(const d of n)p[d.vessel_class]=(p[d.vessel_class]||0)+1;let f='<div style="display:flex;gap:6px;">';for(const[d,v]of Object.entries(Tt))p[d]&&(f+=`<div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:${v.color};border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">${v.label}</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${p[d]}</span>
        </div>`);f+="</div>",f+=`<span style="font-family:var(--font-mono);font-size:8px;color:#a44;">${_(l)}/tick</span>`,i.innerHTML=f}let ne=!1;async function ml(o,e){if(ne||!c)return;const t=(he||[]).find(m=>m.id===o);if(!t)return;const i=t.current_port_nation_id||null;let n="state",a=3,r=3,s=null,l="State Dry Dock (3x cost, 3 ticks)";if(i){const{data:m}=await y.from("corp_properties").select("id").eq("faction_id",c.id).eq("nation_id",i).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();if(m)n="own",a=1,r=2,l="Your Dry Dock (base cost, 2 ticks)";else{const{data:u}=await y.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",c.id).eq("nation_id",i).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();u&&(n="other",a=1.2,r=2,s=u.faction_id,l=(u.factions?.faction_name||"Another corp")+"'s Dry Dock (+20%, 2 ticks)")}}else l="State Dry Dock (3x cost, 3 ticks) — no private dock in port";const p=Math.round(e*a),{data:f}=await y.from("factions").select("corp_cash_reserves").eq("id",c.id).single(),d=Number(f?.corp_cash_reserves??0);if(d<p){alert("Insufficient cash. Need "+_(p)+", have "+_(d)+".");return}if(!confirm("Send "+(t.vessel_name||"vessel")+` to dry dock?

Dock: `+l+`
Cost: `+_(p)+`
Duration: `+r+` ticks
Condition restored to 85-100%.`))return;ne=!0;const v=I?.current_tick||0;try{const{error:m}=await y.from("factions").update({corp_cash_reserves:d-p}).eq("id",c.id);if(m){alert("Failed: "+m.message);return}if(n==="other"&&s){const g=p-e,{data:b}=await y.from("factions").select("corp_cash_reserves").eq("id",s).single();b&&await y.from("factions").update({corp_cash_reserves:Number(b.corp_cash_reserves||0)+g}).eq("id",s)}const{error:u}=await y.from("corp_vessels").update({status:"dry_dock",drydock_until_tick:v+r,active_claim_id:null}).eq("id",o);if(u){await y.from("factions").update({corp_cash_reserves:d}).eq("id",c.id),alert("Failed: "+u.message);return}c.corp_cash_reserves=d-p,await $e()}catch(m){alert("Dry dock failed: "+(m.message||"Error"))}finally{ne=!1}}async function ul(o,e){if(ne||!c)return;if(e<=0){alert("Fuel tanks are already full.");return}const t=(he||[]).find(d=>d.id===o);if(!t)return;const i=t.current_port_nation_id||c.nation_id;let n="state",a=3,r=null,s="State Fuel (3x cost) — no private depot in port";if(i){const{data:d}=await y.from("corp_properties").select("id").eq("faction_id",c.id).eq("nation_id",i).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(d)n="own",a=1,s="Your Fuel Depot (base cost)";else{const{data:v}=await y.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",c.id).eq("nation_id",i).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();v&&(n="other",a=1.15,r=v.faction_id,s=(v.factions?.faction_name||"Another corp")+"'s Fuel Depot (+15%)")}}const l=Math.round(e*a),{data:p}=await y.from("factions").select("corp_cash_reserves").eq("id",c.id).single(),f=Number(p?.corp_cash_reserves??0);if(f<l){alert("Insufficient cash. Need "+_(l)+", have "+_(f)+".");return}if(confirm("Refuel "+(t.vessel_name||"vessel")+`?

Source: `+s+`
Cost: `+_(l)+`
Fuel restored to 100%.`)){ne=!0;try{const{error:d}=await y.from("factions").update({corp_cash_reserves:f-l}).eq("id",c.id);if(d){alert("Failed: "+d.message);return}if(n==="other"&&r){const m=l-e,{data:u}=await y.from("factions").select("corp_cash_reserves").eq("id",r).single();u&&await y.from("factions").update({corp_cash_reserves:Number(u.corp_cash_reserves||0)+m}).eq("id",r)}const{error:v}=await y.from("corp_vessels").update({fuel:100}).eq("id",o);if(v){await y.from("factions").update({corp_cash_reserves:f}).eq("id",c.id),alert("Failed: "+v.message);return}c.corp_cash_reserves=f-l,await $e()}catch(d){alert("Refuel failed: "+(d.message||"Error"))}finally{ne=!1}}}async function vl(o,e,t){if(ne||!c||!I||!confirm("List "+e+" on the Ship Market for "+_(t)+`?

The vessel will be removed from your fleet and listed for sale. You will receive payment when another corporation purchases it.`))return;ne=!0;const i=I.current_tick||0,n=he.find(l=>l.id===o);if(!n){ne=!1;return}const a=Math.max(0,i-(n.built_at_tick||0)),{error:r}=await y.from("ship_market_listings").insert({nation_id:c.nation_id,vessel_name:n.vessel_name,vessel_class:n.vessel_class,capacity_dwt:n.capacity_dwt,capacity_unit:n.capacity_unit,condition:n.condition,fuel:n.fuel,age_ticks:a,fuel_capacity:n.fuel_capacity,base_maintenance:n.base_maintenance,asking_price:t,purchase_price_new:n.purchase_price||t,seller_type:"CORP",seller_name:c.faction_name,seller_faction_id:c.id,sale_reason:"Listed for sale by "+(c.faction_name||"corporation"),status:"available",listed_at_tick:i});if(r){alert("Failed to create listing: "+r.message),ne=!1;return}const{error:s}=await y.from("corp_vessels").delete().eq("id",o);if(s){await y.from("ship_market_listings").delete().eq("seller_faction_id",c.id).eq("vessel_name",n.vessel_name).eq("listed_at_tick",i),alert("Failed to remove vessel: "+s.message),ne=!1;return}ne=!1,Gt=null,await Promise.all([$e(),ya()])}async function yl(o,e){const t=prompt("Rename vessel:",e);if(!t||t.trim()===e||t.trim().length<2)return;const{error:i}=await y.from("corp_vessels").update({vessel_name:t.trim().slice(0,40)}).eq("id",o);if(i){alert("Failed: "+i.message);return}await $e()}async function gl(o,e,t){if(!c||!I||!confirm("Request insurance for "+e+`?

Insurance corporations will see this in their Deal Flow and can offer coverage terms.

Vessel value: `+_(t)))return;const i=I.current_tick||0,{error:n}=await y.from("finance_loan_requests").insert({requesting_faction_id:c.id,nation_id:c.nation_id,request_type:"insurance",insured_vessel_id:o,amount:t,term_months:0,purpose:"Vessel Insurance — "+e,status:"open",created_tick:i,expires_tick:i+12});if(n){n.message.includes("duplicate")||n.message.includes("unique")?alert("Insurance already requested for this vessel."):alert("Failed to request insurance: "+n.message);return}alert(`Insurance request posted to Deal Flow.

Insurance corporations can now offer coverage for `+e+"."),await $e()}let mi=!1;async function xl(o,e){if(mi||!c||!I)return;const t=prompt(`Describe the claim reason:

e.g., "Storm damage during transit — hull breach repaired at sea" or "Engine failure requiring emergency dry dock"`);if(!t||t.trim().length<5)return;const i=I.current_tick||0,{data:n}=await y.from("finance_active_loans").select("id, lender_faction_id, principal, deductible_pct").eq("insured_vessel_id",o).eq("status","current").limit(1).maybeSingle();if(!n){alert("No active insurance policy found for this vessel.");return}const a=Number(n.principal||0),r=Number(n.deductible_pct||10),s=Math.round(a*r/100);if(!confirm("File insurance claim for "+e+`?

Coverage: `+_(a)+`
Deductible: `+r+"% ("+_(s)+`)

Reason: `+t.trim()+`

The insurer will review this claim and determine the payout.`))return;mi=!0;const{error:l}=await y.from("event_log").insert({nation_id:c.nation_id,faction_id:c.id,event_name:(c.faction_name||"Corporation")+" — Insurance Claim Filed",description_used:(c.faction_name||"A shipping corporation")+" has filed an insurance claim for vessel "+e+". Reason: "+t.trim().replace(/[<>"]/g,""),category:"business",trigger_key:"vessel_insurance_claim",effects_applied:{vessel_id:o,vessel_name:e,policy_id:n.id,insurer_faction_id:n.lender_faction_id,coverage:a,deductible_pct:r,claim_reason:t.trim()},fired_at_tick:i});l&&console.warn("Failed to log insurance claim event:",l.message);const{error:p}=await y.from("finance_active_loans").update({claims_paid:(n.claims_paid||0)+1}).eq("id",n.id);p&&console.warn("Failed to update claims_paid:",p.message),mi=!1,alert("Insurance claim filed for "+e+`.

The insurer (`+_(a)+" coverage) has been notified. Claim details are visible in the events feed.")}window.flRequestInsurance=gl;window.flFileClaim=xl;const Ii={fuel_depot:{label:"FUEL DEPOT",color:"#c86a4a",icon:"⛽",desc:"Bunkering facility — refuel at base cost, earn revenue from visiting fleets."},dry_dock:{label:"DRY DOCK",color:"#c84",icon:"🔧",desc:"Repair & maintenance dock — dock at base cost, earn revenue from visiting fleets."}},mo=[{type:"fuel_depot",name:"Fuel Depot — Standard",cost:105e6,maint:85e3,style:"Basic",desc:"Bulk fuel storage and bunkering facility."},{type:"fuel_depot",name:"Fuel Depot — Advanced",cost:14e7,maint:11e4,style:"Modern",desc:"High-capacity fuel terminal with pipeline infrastructure."},{type:"dry_dock",name:"Dry Dock — Standard",cost:85e6,maint:15e4,style:"Basic",desc:"Ship repair and maintenance facility."},{type:"dry_dock",name:"Dry Dock — Advanced",cost:115e6,maint:2e5,style:"Modern",desc:"Full-service shipyard with drydock and crane facilities."}];let So=[];async function bl(){if(!c||c.corp_sector!=="Shipping")return;const{data:o}=await y.from("corp_properties").select("*").eq("faction_id",c.id).in("type",["fuel_depot","dry_dock"]).eq("is_active",!0).order("created_at",{ascending:!1});So=o||[],_l()}function _l(){const o=document.getElementById("pf-count"),e=document.getElementById("pf-list"),t=document.getElementById("pf-footer");if(!o||!e||!t)return;const i=So;if(o.textContent=i.length+" FACILIT"+(i.length===1?"Y":"IES"),i.length===0)e.innerHTML=`<div style="padding:20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-bottom:6px;">No port facilities built.</div>
            <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Build a <span style="color:#c86a4a;font-weight:700;">Fuel Depot</span> to refuel your fleet at base cost<br>and earn revenue from other corps refueling here.<br>Build a <span style="color:#c84;font-weight:700;">Dry Dock</span> to repair vessels at base cost.</div>
        </div>`;else{let r=0;e.innerHTML=i.map(s=>{const l=Ii[s.type]||Ii.fuel_depot,p=s.condition>=75?"#5c5":s.condition>=50?"#ca5":"#c84";return r+=Number(s.monthly_maintenance||0),`<div style="padding:8px 12px;border-bottom:1px solid var(--border-0);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${l.icon}</span>
                        <span style="font-size:11px;font-weight:600;color:var(--text-bright);">${x(s.name)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${l.color};background:${l.color}12;border:1px solid ${l.color}25;">${l.label}</span>
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
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#a44;">${_(s.monthly_maintenance||0)}</span>
                        </div>
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">VALUE: ${_(s.purchase_price||0)}</div>
                    </div>
                </div>
            </div>`}).join("")}Number(c?.corp_cash_reserves??0);const n=i.some(r=>r.type==="fuel_depot"),a=i.some(r=>r.type==="dry_dock");t.innerHTML=`
        <div onclick="pfOpenBuild('fuel_depot')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c86a4a;border:1px solid rgba(200,106,74,0.3);background:rgba(200,106,74,0.04);">
            ${n?"+ FUEL DEPOT":"BUILD FUEL DEPOT"}
        </div>
        <div onclick="pfOpenBuild('dry_dock')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c84;border:1px solid rgba(204,136,68,0.3);background:rgba(204,136,68,0.04);">
            ${a?"+ DRY DOCK":"BUILD DRY DOCK"}
        </div>`}let ui=!1;async function hl(o){if(ui||!c||!I)return;const e=mo.filter(b=>b.type===o);if(e.length===0)return;const t=Ii[o],i=c.nation_id,n=N?.name||c?.nation||"Home Nation",a=N?.capital||"Port City",r=[{id:i,name:n,capital:a,label:"National HQ"}],{data:s}=await y.from("corp_properties").select("nation_id, name, city, nations!nation_id(name, capital)").eq("faction_id",c.id).eq("type","regional_hq").eq("is_active",!0);for(const b of s||[])b.nation_id!==i&&r.push({id:b.nation_id,name:b.nations?.name||b.city||"Unknown",capital:b.nations?.capital||b.city||"Port City",label:b.name||"Subsidiary"});let l=r[0];if(r.length>1){let b=t.label+` — SELECT LOCATION
`+"─".repeat(30)+`
`;b+=`Build in which nation?

`;for(let E=0;E<r.length;E++){const T=r[E],S=So.filter(w=>w.type===o&&w.nation_id===T.id).length;b+=E+1+". "+T.name+"  ("+T.label+")",S>0&&(b+="  ["+S+" existing]"),b+=`
`}b+=`
Enter number (or cancel):`;const $=prompt(b);if(!$)return;const h=parseInt($,10)-1;if(isNaN(h)||h<0||h>=r.length){alert("Invalid selection.");return}l=r[h]}const p=So.filter(b=>b.type===o&&b.nation_id===l.id).length;let f=t.label+" CONSTRUCTION — "+l.name.toUpperCase()+`
`+"─".repeat(30)+`
`;p>0&&(f+="You already have "+p+" "+t.label.toLowerCase()+(p>1?"s":"")+` here.

`),f+=t.desc+`

`;for(let b=0;b<e.length;b++){const $=e[b];f+=b+1+". "+$.name+`
`,f+="   Cost: "+_($.cost)+" · Maint: "+_($.maint)+`/tick
`,f+="   "+$.desc+`

`}f+="Enter 1 or 2 to select (or cancel):";const d=prompt(f);if(!d)return;const v=parseInt(d,10)-1;if(isNaN(v)||v<0||v>=e.length){alert("Invalid selection.");return}const m=e[v];if(!confirm("Commission "+m.name+" in "+l.capital+", "+l.name+`?

Budget: `+_(m.cost)+`

This will create a construction contract that construction corporations can bid on. Payment occurs when the contract is awarded.`))return;ui=!0;const u=I.current_tick||0,g=(I.current_date||"").match(/\d{4}/)?.[0]||"2015";try{const{count:b}=await y.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",l.id).eq("issuer_type","PRIVATE"),h=`PVT-P${(b||0)+1}-${g}`,E=m.style==="Modern",T={concrete:E?60:40,steel:E?50:30,heavy_parts:E?30:20,aggregate:E?30:20},S={trucks:5,mixers:5,excavators:5},w={general:E?240:160,skilled:E?100:60},C=E?6:4,{error:M}=await y.from("construction_contracts").insert({nation_id:l.id,template_key:o,sector:"industrial",name:m.name,project_type:t.label,project_subtype:m.style,description:`${m.name} at ${l.capital} Port — commissioned by ${c.faction_name}. ${m.desc}`,project_code:h,budget_ceiling:m.cost,timeline_ticks:C,required_materials:T,required_equipment:S,required_workforce:w,status:"open",generated_at_tick:u,bidding_ends_tick:u+3,issuer_type:"PRIVATE",issuer_name:c.faction_name,issuer_faction_id:c.id});if(M)throw M;await bl(),alert(`Construction contract posted!

Project: `+m.name+`
Location: `+l.capital+", "+l.name+`
Code: `+h+`
Budget: `+_(m.cost)+`
Timeline: `+C+` ticks

Construction corporations in `+l.name+" can now bid on this project.")}catch(b){alert("Failed to post contract: "+(b.message||"Error"))}finally{ui=!1}}window.pfOpenBuild=hl;const on={"Bulk Cargo":["Reefer","Bulk","Coastal"],"Container Freight":["Coastal","Container"],"Specialized Transport":["Tanker","LNG","Bulk"]};async function ya(){if(!c||c.corp_sector!=="Shipping")return;const{data:o,error:e}=await y.from("ship_market_listings").select("*, nation:nation_id(id, name)").eq("status","available").order("asking_price",{ascending:!0});e&&console.warn("Failed to load ship market:",e.message),Mi=o||[],bo=null,ga()}function $l(o){bo=bo===o?null:o,ga()}function wl(o){return(on[c?.corp_subsector]||[]).includes(o)}function ga(){const o=document.getElementById("sm-count"),e=document.getElementById("sm-list"),t=document.getElementById("sm-footer");if(!o||!e)return;const i=Mi;o.textContent=i.length+" AVAILABLE",i.length===0?e.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels on the market.<br>Check back next cycle.</div>':e.innerHTML=i.map((r,s)=>{const l=bo===s,p=Tt[r.vessel_class]||{color:"#666",label:"?"},f=r.seller_type==="CORP"?"#5a8aaa":"#8b9a6b",d=ua(r.condition),v=r.nation?.name||"—",m=wl(r.vessel_class);I?.current_tick;const u=r.age_ticks||0,g=Math.max(1,Math.floor(u/12)),b=v!==c?.nation?Number(c?.tariffs||N?.tariffs||0):0,$=Math.round(r.asking_price*b/100),h=r.asking_price+$;let E=`<div onclick="smSelectListing(${s})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${l?p.color:"transparent"};background:${l?p.color+"06":"transparent"};">
                <div style="padding:8px 14px;">`;return E+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x(r.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${p.color};background:${p.color}12;border:1px solid ${p.color}25;">${p.label}</span>
            </div>`,E+=`<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;">
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${f};background:${f}12;border:1px solid ${f}25;">${r.seller_type}</span>
                <span style="font-size:9px;color:var(--text-muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x(r.seller_name||"—")}</span>
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;">${v.toUpperCase().slice(0,6)}</span>
                ${b>0?`<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">+${b}%</span>`:""}
            </div>`,E+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-0);">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);margin-top:1px;">${(r.capacity_dwt||0).toLocaleString()} ${r.capacity_unit||"DWT"}</div>
                </div>
                <div style="flex:0.6;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">COND</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${d};margin-top:1px;">${r.condition}%</div>
                </div>
                <div style="flex:0.5;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">AGE</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${g}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">PRICE</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--gold);margin-top:1px;">${_(r.asking_price)}</div>
                </div>
            </div>`,l&&(E+='<div style="margin-top:6px;">',E+=`<div style="padding:4px 8px;margin-bottom:5px;background:var(--bg-0);border:1px solid var(--border-0);">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0);">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CARRIES</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${p.color};">${(Tt[r.vessel_class]||{}).label||"?"} class cargo</span>
                    </div>
                    <div style="padding:3px 0;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:1px;">REASON FOR SALE</div>
                        <div style="font-size:9px;color:var(--text-muted);line-height:1.4;">${x(r.sale_reason||"—")}</div>
                    </div>
                </div>`,E+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                    <div style="width:40px;height:3px;background:var(--border-0);"><div style="width:${r.condition}%;height:100%;background:${d};"></div></div>
                    ${r.condition<60?'<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">May need dry dock</span>':""}
                </div>`,b>0&&(E+=`<div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:8px;margin-bottom:3px;">
                        <span style="color:var(--text-dim);">Import tariff (${b}%)</span>
                        <span style="color:#c84;">+${_($)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;margin-bottom:5px;">
                        <span style="color:var(--text-bright);">TOTAL</span>
                        <span style="color:var(--gold);">${_(h)}</span>
                    </div>`),m?E+=`<div onclick="event.stopPropagation();smPurchase('${r.id}',${h})" style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${p.color};cursor:pointer;">${_(h)} — PURCHASE</div>`:E+=`<div style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:var(--text-dim);border:1px solid var(--border-0);opacity:0.4;">⊘ ${r.vessel_class} not available for ${c?.corp_subsector||"your subsector"}</div>`,E+="</div>"),E+="</div></div>",E}).join("");const n=i.filter(r=>r.seller_type==="CORP").length,a=i.filter(r=>r.seller_type==="LOCAL").length;t.innerHTML=`<div style="display:flex;gap:6px;">
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
    <div onclick="smOpenCommission()" style="padding:4px 14px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--gold);border:1px solid rgba(200,168,50,0.3);cursor:pointer;">COMMISSION VESSEL</div>`}let ct=!1;async function kl(o,e){if(ct||!c||!I)return;const t=Number(c.corp_cash_reserves??0);if(t<e){alert("Insufficient cash. Need "+_(e)+".");return}if(!confirm("Purchase this vessel for "+_(e)+"?"))return;ct=!0;const i=Mi.find(d=>d.id===o);if(!i){ct=!1;return}const n=I.current_tick||0,a={Coastal:{capacity_dwt:14e3,capacity_unit:"DWT",base_maintenance:18e4,fuel_capacity:800,purchase_price:3e6},Container:{capacity_dwt:4800,capacity_unit:"TEU",base_maintenance:29e4,fuel_capacity:2100,purchase_price:65e6},Bulk:{capacity_dwt:28e3,capacity_unit:"DWT",base_maintenance:35e4,fuel_capacity:1800,purchase_price:3e6},Tanker:{capacity_dwt:42e3,capacity_unit:"DWT",base_maintenance:38e4,fuel_capacity:2400,purchase_price:53e6},Reefer:{capacity_dwt:12e3,capacity_unit:"DWT",base_maintenance:28e4,fuel_capacity:1600,purchase_price:6e6},LNG:{capacity_dwt:18e3,capacity_unit:"DWT",base_maintenance:58e4,fuel_capacity:1400,purchase_price:78e6}},r=a[i.vessel_class]||a.Coastal,{error:s}=await y.from("factions").update({corp_cash_reserves:t-e}).eq("id",c.id);if(s){alert("Failed: "+s.message),ct=!1;return}const{error:l}=await y.from("corp_vessels").insert({faction_id:c.id,nation_id:c.nation_id,vessel_name:i.vessel_name,vessel_class:i.vessel_class,condition:i.condition,fuel:i.fuel||50,status:"in_port",capacity_dwt:i.capacity_dwt||r.capacity_dwt,capacity_unit:i.capacity_unit||r.capacity_unit,base_maintenance:i.base_maintenance||r.base_maintenance,fuel_capacity:i.fuel_capacity||r.fuel_capacity,purchase_price:e,built_at_tick:n-(i.age_ticks||0),current_port_nation_id:c.nation_id});if(l){await y.from("factions").update({corp_cash_reserves:t}).eq("id",c.id),alert("Failed to create vessel: "+l.message),ct=!1;return}var{error:p}=await y.from("ship_market_listings").update({status:"sold",purchased_by:c.id,purchased_at_tick:n}).eq("id",o);if(p&&console.warn("Failed to mark listing as sold:",p.message),i.seller_faction_id){const{data:d}=await y.from("factions").select("corp_cash_reserves").eq("id",i.seller_faction_id).single();if(d){var{error:f}=await y.from("factions").update({corp_cash_reserves:Number(d.corp_cash_reserves||0)+i.asking_price}).eq("id",i.seller_faction_id);f&&console.warn("Failed to credit seller:",f.message)}}c.corp_cash_reserves=t-e,ct=!1,await Promise.all([$e(),ya()])}const Dt=[{cls:"Coastal",baseCost:12e6,baseBuild:3,cargo:"Bulk, Containers (coastal)"},{cls:"Container",baseCost:65e6,baseBuild:5,cargo:"Manufactured, Tech, General"},{cls:"Bulk",baseCost:38e6,baseBuild:4,cargo:"Minerals, Aggregate, Military"},{cls:"Tanker",baseCost:52e6,baseBuild:5,cargo:"Fuel, Petroleum, Chemicals"},{cls:"Reefer",baseCost:45e6,baseBuild:4,cargo:"Food, Perishables, Agriculture"},{cls:"LNG",baseCost:78e6,baseBuild:6,cargo:"Liquefied Natural Gas only"}];let de="Coastal",Kt=0,Jt="",Ze=[];function El(){de=(on[c?.corp_subsector]||["Coastal"])[0],Kt=0,Jt="",Ze=[],document.getElementById("comm-overlay").style.display="flex",Cl()}async function Cl(){const{data:o}=await y.from("nations").select("id, name, manufacturing_output, physical_infrastructure, tariffs").order("name");Ze=(o||[]).map(e=>{const t=Number(e.manufacturing_output??50),i=Math.round((.75+t/100*.5)*100)/100,n=Math.round((1.5-t/100*.65)*100)/100,a=e.id===c?.nation_id;return{id:e.id,name:e.name,mfg:t,costMod:i,buildMod:n,isHome:a,tariffs:Number(e.tariffs??0)}}),Ze.sort((e,t)=>(t.isHome?1:0)-(e.isHome?1:0)),nn()}function xa(){document.getElementById("comm-overlay").style.display="none"}function Tl(o){de=o,nn()}function Sl(o){Kt=o,nn()}function zl(o){Jt=o}function nn(){const o=document.getElementById("comm-content");if(!o)return;const e=I?.current_tick||0,t=Dt.find(u=>u.cls===de)||Dt[0],i=Ze[Kt]||{name:"—",costMod:1,buildMod:1},n=Tt[de]||{color:"#666"},a=Math.round(t.baseCost*i.costMod),r=Math.max(2,Math.round(t.baseBuild*i.buildMod)),s=Math.round(a*.5),l=a-s,p=e+r,f=on[c?.corp_subsector]||[];let d="";d+=`<div style="padding:10px 16px;border-bottom:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:#c8a832;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Commission Vessel</span>
            </div>
            <span onclick="smCloseCommission()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
    </div>`,d+='<div style="flex:1;overflow-y:auto;">',d+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Vessel Type</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">`;for(const u of Dt){const g=Tt[u.cls]||{color:"#666",label:"?"},b=de===u.cls,$=f.includes(u.cls);d+=`<div onclick="${$?"commSetClass('"+u.cls+"')":""}" style="padding:5px 4px;text-align:center;cursor:${$?"pointer":"not-allowed"};background:${b?g.color+"18":"transparent"};border:1px solid ${b?g.color+"44":"#2a2a24"};opacity:${$?1:.3};">
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${b?g.color:"#6a6660"};">${g.label}</div>
            <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;margin-top:2px;">${_(u.baseCost)} base</div>
        </div>`}d+="</div>",d+=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:${n.color};">${t.cargo}</div>`,d+="</div>",d+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Origin Shipyard</div>`;for(let u=0;u<Ze.length;u++){const g=Ze[u],b=Kt===u,$=g.costMod>1?"#c84":g.costMod<1?"#5c5":"#6a6660",h=g.buildMod>1?"#c84":g.buildMod<1?"#5c5":"#6a6660";d+=`<div onclick="commSetNation(${u})" style="display:flex;align-items:center;padding:5px 8px;margin-bottom:2px;cursor:pointer;background:${b?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${b?"#8b9a6b44":"#2a2a24"};border-left:2px solid ${b?"#8b9a6b":"transparent"};">
            <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:11px;font-weight:600;color:${b?"#e8e4dc":"#9e9a92"};">${x(g.name)}</span>
                    ${g.isHome?'<span style="font-family:var(--font-mono);font-size:6px;padding:0 3px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2);line-height:11px;">HOME</span>':""}
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${g.isHome?"Home port — no tariff":"Foreign shipyard"}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">MFG</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#9e9a92;">${g.mfg}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">COST</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${$};">×${g.costMod.toFixed(2)}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">SPEED</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${h};">×${g.buildMod.toFixed(2)}</div></div>
            </div>
        </div>`}d+="</div>",d+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Vessel Name</div>
        <input id="comm-name-input" value="${x(Jt)}" oninput="commSetName(this.value)" placeholder="e.g., MV 'Sierra Nevada'" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:11px;color:#e8e4dc;background:#1c1c18;border:1px solid #2a2a24;outline:none;box-sizing:border-box;" />
    </div>`,d+=`<div style="padding:8px 16px;border-bottom:1px solid #2a2a24;">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Build Summary</div>
        <div style="background:#1c1c18;border:1px solid #2a2a24;padding:6px 10px;">`;const v=[{label:"VESSEL CLASS",value:de,color:n.color},{label:"SHIPYARD",value:i.name,color:"#9e9a92"},{label:"BASE COST",value:_(t.baseCost)+" × "+i.costMod.toFixed(2),color:"#9e9a92"},{label:"BUILD TIME",value:r+" ticks",color:r>t.baseBuild?"#c84":r<t.baseBuild?"#5c5":"#9e9a92"},{label:"COMPLETION",value:"~Tick "+p,color:"#9e9a92"}];for(const u of v)d+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${u.label}</span>
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${u.color};">${u.value}</span>
        </div>`;d+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid #2a2a24;">
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#e8e4dc;">TOTAL COST</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c8a832;">${_(a)}</span>
    </div>`,d+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid #2a2a24;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEPOSIT (50% NOW)</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">${_(s)}</span>
    </div>`,d+=`<div style="display:flex;justify-content:space-between;padding:3px 0;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">BALANCE ON COMPLETION</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${_(l)}</span>
    </div>`,d+="</div></div>",d+=`<div style="padding:6px 16px;">
        <div style="padding:5px 8px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#c8a832;margin-bottom:2px;">PAYMENT TERMS</div>
            <div style="font-size:9px;color:#6a6660;line-height:1.5;">50% deposit due immediately. Remaining 50% due on delivery at tick ${p}. Vessel delivered at 100% condition, fully fueled, to your nearest port. Cancellation forfeits deposit.</div>
        </div>
    </div>`,d+="</div>";const m=Jt.trim().length>=2;d+=`<div style="padding:10px 16px;border-top:1px solid #2a2a24;background:#1c1c18;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">DEPOSIT DUE NOW</div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${_(s)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="smCloseCommission()" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid #2a2a24;cursor:pointer;">CANCEL</div>
            <div id="comm-order-btn" onclick="${m?"smPlaceOrder()":""}" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:${m?"#000":"#6a6660"};background:${m?"#c8a832":"transparent"};border:1px solid ${m?"#c8a832":"#2a2a24"};cursor:${m?"pointer":"default"};opacity:${m?1:.4};">PLACE ORDER</div>
        </div>
    </div>`,o.innerHTML=d}let At=!1;async function Il(){if(At||!c||!I)return;const o=Jt.trim();if(o.length<2)return;const e=Dt.find(b=>b.cls===de)||Dt[0],t=Ze[Kt];if(!t)return;const i=Math.round(e.baseCost*t.costMod),n=Math.max(2,Math.round(e.baseBuild*t.buildMod)),a=Math.round(i*.5),r=i-a,s=I.current_tick||0,l=Number(c.corp_cash_reserves??0);if(l<a){alert("Insufficient cash for deposit. Need "+_(a)+".");return}if(!confirm("Commission "+de+" from "+t.name+`?

Deposit: `+_(a)+` (non-refundable)
Balance: `+_(r)+" on delivery at tick "+(s+n)))return;At=!0;const p=document.getElementById("comm-order-btn");p&&(p.style.opacity="0.4",p.style.pointerEvents="none");const{error:f}=await y.from("factions").update({corp_cash_reserves:l-a}).eq("id",c.id);if(f){alert("Failed: "+f.message),At=!1;return}const{data:d}=await y.from("nations").select("budget_reserves").eq("id",t.id).single();if(d){var{error:v}=await y.from("nations").update({budget_reserves:Number(d.budget_reserves||0)+a}).eq("id",t.id);v&&console.warn("Failed to credit shipyard nation budget:",v.message)}const m={Coastal:{dwt:14e3,unit:"DWT",maint:18e4,fuel:800},Container:{dwt:4800,unit:"TEU",maint:29e4,fuel:2100},Bulk:{dwt:28e3,unit:"DWT",maint:35e4,fuel:1800},Tanker:{dwt:42e3,unit:"DWT",maint:38e4,fuel:2400},Reefer:{dwt:12e3,unit:"DWT",maint:28e4,fuel:1600},LNG:{dwt:18e3,unit:"DWT",maint:58e4,fuel:1400}},u=m[de]||m.Coastal,{error:g}=await y.from("vessel_orders").insert({faction_id:c.id,vessel_name:o,vessel_class:de,capacity_dwt:u.dwt,capacity_unit:u.unit,base_maintenance:u.maint,fuel_capacity:u.fuel,purchase_price:e.baseCost,shipyard_nation_id:t.id,shipyard_nation:t.name,cost_modifier:t.costMod,build_modifier:t.buildMod,total_cost:i,deposit_paid:a,balance_due:r,ordered_at_tick:s,delivery_tick:s+n,build_ticks:n,status:"building"});if(g){await y.from("factions").update({corp_cash_reserves:l}).eq("id",c.id),alert("Failed to place order: "+g.message),At=!1;return}c.corp_cash_reserves=l-a,At=!1,xa(),alert(o+` commissioned!

Class: `+de+`
Shipyard: `+t.name+`
Deposit: `+_(a)+`
Delivery: Tick `+(s+n))}window.smSelectListing=$l;window.smPurchase=kl;window.smOpenCommission=El;window.smCloseCommission=xa;window.commSetClass=Tl;window.commSetNation=Sl;window.commSetName=zl;window.smPlaceOrder=Il;window.flSelectVessel=fl;window.flRefurbish=ml;window.flRefuel=ul;window.flSell=vl;window.flRename=yl;window.openBidReview=rl;window.closeBidReview=Uo;window.reviewSelectBid=sl;window.acceptBid=ll;window.declineAllBids=cl;window.switchToActions=Pn;window.actSelectExec=ps;window.actExecute=Kr;window.confirmFireExec=Yr;window.actOpenStatement=Un;window.actCloseStatement=Yi;window.actSubmitStatement=Jr;window.actDeclareBankruptcy=Hn;window.actOpenRestructure=Yn;window.actCloseRestructure=Qi;window.actSubmitRestructure=rs;window.actOpenRebrand=Qn;window.actCloseRebrand=Ki;window.actSubmitRebrand=ss;window.actOpenDonation=Kn;window.actCloseDonation=Ji;window.actSubmitDonation=ds;window.donateSelectParty=cs;window.lrOpen=Vn;window.lrClose=Wn;window.lrSubmit=as;window.lrSetAmount=es;window.lrSetPurpose=ts;window.lrSetTerm=os;window.lrSetCollateral=is;window.openExecSearch=fs;window.closeExecSearch=Xn;window.esSelectCandidate=ms;window.esHireCandidate=us;window.switchToExpansion=On;window.switchToOperations=Bn;window.hfSetChange=vs;window.hfReset=ys;window.hfConfirm=gs;document.addEventListener("click",function(o){const e=o.target.closest(".corp-nav-tab[href]:not([data-tab-action])");if(!e)return;const t=e.getAttribute("href");if(!t)return;const i=new URL(t,window.location.href);i.pathname!==window.location.pathname||i.searchParams.get("tab")||e.classList.contains("active")||(o.preventDefault(),Bn(o))});jr();
