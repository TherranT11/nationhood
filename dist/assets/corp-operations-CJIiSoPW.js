const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-5lTmaM1a.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as y}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{c as _e,i as Na,a as Ia,l as Ma,M as Ft,Q as An,b as Rn,d as gn,e as $i,f as wi,g as Aa,h as Ra}from"./corp-shipping-data-CSOoWV-H.js";import{_ as qa}from"./preload-helper-BXl3LOEh.js";import{e as b}from"./utils-CY90Gazr.js";import{initMessaging as La}from"./messaging-BUrQna7p.js";import{d as Oa,e as qn,a as ki}from"./corp-valuation-CgQIQIJ1.js";import{c as Ba,a as xn,E as Ut,b as No,d as Ei,e as Pa,f as Da,h as fi}from"./equipment-DsuDdEne.js";import{a as ja,E as vo,b as yo,g as Fa,V as go}from"./vessels-hRwLZomr.js";import"./political-actions-F3n029Um.js";import"./config-CTuAIx_5.js";import"./government-types-CPvqgHog.js";import"./ideology-BqLjustE.js";import"./stats-tIiBSaQA.js";let ke=[],c=null,M=null,I=null,Ue=[];const bn={};let Ct={},X=[],Z={},_n=-1;const Ua={em:"em_systems",glass:"glass_facades",heavy:"heavy_parts"},xo=o=>Ua[o]||o;let te="concrete",W="STD",be=500,gt=null,re=[],bo={},hn=0,Ht=[],Gt=[],xt=0,Ee=null,ze=-1,he=[],Vt=null,qt={},_o={},Ln=[],ho=null,me="trucks",Ce=0,Ne=1,De=[],Xe=null,Tt=[],$n=null,so=null;function rt(){return gt||M}let wn="ALL",kn="TIMELINE";function D(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Ha(o){if(o>=12){const e=Math.floor(o/12),t=o%12;return t>0?e+"y "+t+"mo":e+"y"}return o+" ticks"}function Ci(o){return!o||o.length===0?"":o.map(e=>{const t=bo[e];if(!t)return"";const n=t.reputation_bonus>0?"var(--green)":t.reputation_bonus<0?"var(--red)":"var(--text-dim)",a=t.reputation_bonus>0?"+"+t.reputation_bonus:t.reputation_bonus<0?String(t.reputation_bonus):"";return`<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background: var(--border-hair);border:1px solid var(--border-0);border-radius:3px;font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">${t.icon||"📍"} ${b(t.name)}${a?` <span style="color:${n};font-weight:700;">${a} REP</span>`:""}</span>`}).filter(Boolean).join(" ")}function ue(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(0)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function On(o){return o==="civil_engineering"?"CIVIL":o==="industrial"?"INDUSTRIAL":o==="mega_project"?"MEGA":o?.toUpperCase()||"—"}function Ti(o){return o==="civil_engineering"?"light":o==="industrial"?"heavy":o==="mega_project"?"mega":"light"}function Ga(){so&&clearInterval(so),so=setInterval(()=>{if(!$n)return;const o=$n-Date.now();if(o<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(so);return}const e=Math.floor(o/36e5),t=Math.floor(o%36e5/6e4),n=Math.floor(o%6e4/1e3);document.getElementById("tick-countdown").textContent=e+"h "+t+"m "+n+"s"},1e3)}function Va(o,e){o==="type"&&(wn=e),o==="sort"&&(kn=e),document.querySelectorAll(`.filter-pill[data-filter="${o}"]`).forEach(t=>{t.classList.toggle("active",t.dataset.value===e)}),Si()}const mi={"Civil Engineering":"civil_engineering","Industrial Construction":"industrial",Megaprojects:"mega_project"};function En(o){if(!c)return!1;if(mi[c.corp_subsector]===o.sector)return!0;const t=(G||[]).filter(n=>n.type==="regional_hq"&&n.is_active&&n.nation_id===o.nation_id);for(const n of t)if(mi[n.subsector]===o.sector)return!0;return!1}function Si(){const o=document.getElementById("oc-list");let e=[...Ue];wn==="GOVERNMENT"?e=e.filter(s=>s.issuer_type==="GOVERNMENT"):wn==="PRIVATE"&&(e=e.filter(s=>s.issuer_type==="PRIVATE"));const t=new Set;c?.nation_id&&t.add(c.nation_id);for(const s of G||[])s.type==="regional_hq"&&s.is_active&&s.nation_id&&t.add(s.nation_id);const n=s=>t.has(s.nation_id)&&En(s),a=(s,l)=>kn==="TIMELINE"?(s.timeline_ticks||0)-(l.timeline_ticks||0):kn==="BUDGET"?(l.budget_ceiling||0)-(s.budget_ceiling||0):0;if(e.sort((s,l)=>{const d=n(s)?1:0,f=n(l)?1:0;return d!==f?f-d:a(s,l)}),document.getElementById("oc-count").textContent=e.length+" AVAILABLE",e.length===0){o.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const i=I?.current_tick||0;let r="";for(const s of e){const l=s.issuer_type==="GOVERNMENT",d=l?"gov":"private",f=En(s),p=f?"":" locked",u=Ti(s.sector),m=On(s.sector),v=(s.timeline_ticks||0)>18?" warn":"",x=s.bidding_ends_tick?Math.max(0,s.bidding_ends_tick-i):"?",g=bn[s.nation_id]||"—",h=t.has(s.nation_id);r+=`
            <div class="oc-item${p}" data-contract-id="${s.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${b(s.name)}</span>
                    <span class="oc-item__type-badge ${d}">${l?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${d}">${b(s.issuer_name||"—")}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.7px;color:${h?"var(--teal)":"var(--text-dim)"};margin-left:8px;text-transform:uppercase;">${b(g)}${h?" · HQ":""}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${x} tick${x!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${ue(s.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${v}">${Ha(s.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${u}">${m}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${Ct[s.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${ue(Ct[s.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${f?"yes":"no"}">${f?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${f?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openContractDetail(contracts.find(x=>x.id==='${s.id}'))">VIEW</button>`:""}
                </div>
                ${s.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${b(s.description)}</div>`:""}
                ${s.modifiers&&s.modifiers.length>0?`<div style="display:flex;flex-wrap:wrap;gap:3px;padding:4px 0 0;">${Ci(s.modifiers)}</div>`:""}
            </div>`}o.innerHTML=r,o.querySelectorAll(".oc-item:not(.locked)").forEach(s=>{s.addEventListener("click",()=>{const l=s.dataset.contractId,d=Ue.find(f=>f.id===l);d&&zi(d)})})}let Ze=null;function zi(o){Ze=o;const e=document.getElementById("cd-overlay"),t=o.issuer_type==="GOVERNMENT",n=t?"gov":"private",a=(M?.name||c.nation||"—").toUpperCase(),i=En(o);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${b(a)}</span>
        <span class="cd-header__name">${b(o.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${n}">${b(o.issuer_name)}</span>
        <span class="cd-header__type-badge ${n}">${t?"GOV":"PRIVATE"}</span>
    `;const r=document.getElementById("cd-blueprint");o.blueprint_svg?(r.innerHTML=o.blueprint_svg,r.style.display=""):(r.innerHTML=mr(o),r.style.display="");const s=o.permits_required||[],l=o.required_equipment||o.equipment_required||{},d=Array.isArray(l)?l.map(B=>({key:B,qty:1})):Object.entries(l).map(([B,T])=>({key:B,qty:T})),f=o.required_materials||o.materials_estimated||{},u={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[o.sector]||o.spec_category||o.sector||"—";let m="var(--teal)";o.sector==="industrial"&&(m="var(--orange)"),o.sector==="mega_project"&&(m="var(--red)");let v=D(o.budget_ceiling||o.budget||0),x=(o.timeline_ticks||o.timeline_months||0)+" Months",g="";g+=`
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
            </div>`);const h=o.modifiers||[];if(h.length>0){g+=`<div class="cd-items">
            <div class="cd-section-label">Building Modifiers</div>
            <div style="display:flex;flex-direction:column;gap:6px;">`;for(const B of h){const T=bo[B];if(!T)continue;const j=T.reputation_bonus>0?"var(--green)":T.reputation_bonus<0?"var(--red)":"var(--text-dim)",P=T.cost_multiplier>1?"+"+Math.round((T.cost_multiplier-1)*100)+"% cost":T.cost_multiplier<1?Math.round((1-T.cost_multiplier)*100)+"% cheaper":"",F=T.reputation_bonus!==0?(T.reputation_bonus>0?"+":"")+T.reputation_bonus+" rep":"",K=T.required_permits||[];g+=`<div style="padding:6px 10px;background: var(--border-hair);border:1px solid var(--border-hair);border-radius:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:600;font-size:0.78rem;color:var(--text-primary);">${T.icon||"📍"} ${b(T.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;">
                        ${P?`<span style="color:var(--amber);">${P}</span>`:""}
                        ${P&&F?" · ":""}
                        ${F?`<span style="color:${j};font-weight:700;">${F}</span>`:""}
                    </span>
                </div>
                <div style="font-size:0.65rem;color:var(--text-dim);margin-top:2px;">${b(T.description||"")}</div>
                ${K.length>0?`<div style="font-size:0.6rem;color:var(--amber);margin-top:3px;font-family:var(--font-mono);">Requires permits: ${K.map(Oe=>b(Oe.replace(/_/g," "))).join(", ")}</div>`:""}
            </div>`}g+="</div></div>"}g+='<div class="cd-details">',o.project_type&&(g+=Pe("Type",o.project_type)),o.project_subtype&&(g+=Pe("Sub-Type",o.project_subtype)),g+=Pe("Specialization",u,m),g+=Pe("Total Budget",v,"var(--green)"),g+=Pe("Timeline",x),g+=Pe("Nation",M?.name||c.nation||"—"),o.region&&(g+=Pe("Region",o.region)),g+="</div>",s.length>0&&(g+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${s.map(B=>{const T=B.status==="approved"?"approved":"required",j=B.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${T}">
                            <span class="cd-chip__icon">${j}</span>
                            <span class="cd-chip__label">${b(B.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),f.length>0&&(g+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${f.map(B=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${b(B.name)}</span>
                        <span class="cd-mat-row__qty">${b(String(B.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=g;const w=s.filter(B=>B.status==="approved").length,k=s.length-w,S=d.length,z=[];for(const B of d){const T=Io[B.key]||B.key,j=re.find(P=>P.equipment_key===T||P.equipment_key===B.key);j&&j.owned>=B.qty||z.push(B)}const $=z.length,C=o.required_materials||{},A=typeof C=="object"&&!Array.isArray(C)?Object.entries(C):[],E=[];for(const[B,T]of A){const j=Z[B]||{},P=(j.LOW?.qty||0)+(j.STD?.qty||0)+(j.HIGH?.qty||0);P<T&&E.push({key:B,need:T,have:P})}const N=B=>B.replace(/_/g," ").replace(/\b\w/g,T=>T.toUpperCase());let q="";if(S>0)if($===0)q+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>';else{const B=z.map(T=>N(T.key)).join(", ");q+=`<span class="cd-footer__badge bad" title="${b(B)}">${$} SHORT: ${b(B)}</span>`}if(A.length>0)if(E.length===0)q+='<span class="cd-footer__badge ok">ALL MATERIALS MET</span>';else{const B=E.map(T=>N(T.key)+" ("+T.have+"/"+T.need+")").join(", ");q+=`<span class="cd-footer__badge bad" title="${b(B)}">${E.length} MAT SHORT: ${b(B)}</span>`}s.length>0&&(k===0?q+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':q+=`<span class="cd-footer__badge warn">${k} PERMITS PENDING</span>`);const U=i,Q=o.issuer_faction_id===c?.id,H=o.status==="bidding",oe=Ct[o.id];document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${q}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${Q?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${H?"":"disabled"} title="${H?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:oe?`<button class="cd-btn primary" onclick="retractBid('${o.id}')" style="background:#c55;border-color:#c55;"
                        title="Retract your bid ($1M penalty)">RETRACT BID</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${U?"":"disabled"}
                        title="${U?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,e.classList.add("open"),document.body.style.overflow="hidden"}function Zt(o){o&&o.target&&o.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",Ze=null)}const Io={work_trucks:"trucks",concrete_mixers:"mixers",tower_cranes:"cranes",heavy_haulers:"haulers",pile_drivers:"piledrivers",asphalt_plants:"asphalt"},Ge=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],ui={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},vi={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let R=null;const Wa="get_contract_permit_requirements";async function Ya(o,e){if(!y||!o||!e)return[];try{const{data:t,error:n}=await y.rpc(Wa,{p_contract_id:o,p_faction_id:e});return n?(console.warn("[pm permits] failed to load permit requirements:",n.message),[]):Array.isArray(t)?t.filter(a=>a&&a.name).map(a=>({name:String(a.name),has_permit:a.has_permit===!0})):[]}catch(t){return console.warn("[pm permits] unexpected error loading permit requirements:",t),[]}}async function st(o){const e=X.find(T=>T.id===o);if(!e)return;const t=Array.isArray(e.contract_bids)?e.contract_bids[0]:e.contract_bids,n=I?.current_tick||0,a=e.awarded_at_tick||n,i=e.timeline_ticks||8,r=Math.max(0,n-a),s=Math.min(100,r/i*100);let l=Math.min(Ge.length-1,Math.floor(s/(100/Ge.length)));const d=Math.round(s%(100/Ge.length)/(100/Ge.length)*100),f=e.required_materials||{},p=t?.material_grades||{};let u=[];try{const{data:T}=await y.from("project_material_allocations").select("material_key, quality_tier, quantity, consumed").eq("contract_id",e.id);u=T||[]}catch{}const m={};for(const T of u)m[T.material_key]||(m[T.material_key]={totalAllocated:0,totalConsumed:0,tiers:{}}),m[T.material_key].totalAllocated+=T.quantity,m[T.material_key].totalConsumed+=T.consumed,m[T.material_key].tiers[T.quality_tier]={qty:T.quantity,consumed:T.consumed};const v=Object.entries(f).map(([T,j])=>{const P=p[T]||"STD",F=m[T]||{totalAllocated:0,totalConsumed:0,tiers:{}};return{key:T,name:T.replace(/_/g," ").replace(/\b\w/g,K=>K.toUpperCase()),grade:P,required:Number(j),allocated:F.totalAllocated,consumed:F.totalConsumed,tiers:F.tiers,warehouseStock:Z[T]||{}}}),x=e.required_equipment||{},g=e.equipment_condition||{},w=(Array.isArray(x)?x.map(T=>[T,1]):Object.entries(x)).map(([T,j])=>{const P=Io[T]||T,F=re.find(pe=>pe.equipment_key===P||pe.equipment_key===T),Oe=(F?.assigned_projects||[]).find(pe=>pe.contract_id===e.id),Go=Oe?Oe.units:0;return{key:T,name:T.replace(/_/g," ").replace(/\b\w/g,pe=>pe.toUpperCase()),required:Number(j)||1,ownedTotal:F?.owned||0,deployed:F?.deployed||0,available:Math.max(0,(F?.owned||0)-(F?.deployed||0)),assignedToProject:Go,condition:g[T]??(F?.condition||100)}}),k=e.budget_ceiling||0,S=t?.estimated_cost||0,z=Math.round(S*Math.min(1,r/i)),$=t?.estimated_quality||65,C=$>=75?"EXCELLENT":$>=50?"FAIR":$>=25?"POOR":"BAD",A=e.required_workforce||{},E=e.workers_assigned||{},N=(A.general||0)+(A.skilled||0)+(A.innovative||0),q=(E.general||0)+(E.skilled||0)+(E.innovative||0),U=t?.labor_count||N,Q=Number(c?.corp_general_workforce??0),H=Number(c?.corp_skilled_workforce??0),oe=Number(c?.corp_innovative_workforce??0),B=await Ya(e.id,c?.id);R={project:e,bid:t,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:n,awardedTick:a,totalTicks:i,ticksElapsed:r,phaseIdx:l,phaseProgress:d,materials:v,equipment:w,permitRequirements:B,budget:k,estCost:S,spent:z,quality:$,qualityLabel:C,laborCount:U,wfNeeded:N,wfAssigned:q,reqWf:A,assignedWf:E,corpGeneral:Q,corpSkilled:H,corpInnovative:oe,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",Ni(e.id).then(()=>ot()),ot()}let Y=!1;async function Qa(o,e,t){if(!(Y||!R||!c)){Y=!0;try{const{data:n,error:a}=await y.rpc("allocate_material_to_project",{p_contract_id:R.project.id,p_faction_id:c.id,p_material_key:o,p_quality_tier:e,p_quantity:t});if(a){alert("Allocation failed: "+a.message);return}if(n&&!n.success){alert(n.error||"Allocation failed");return}await Pn(),await st(R.project.id)}catch(n){alert("Allocation error: "+n.message)}finally{Y=!1}}}async function Ka(o,e,t){if(!(Y||!R||!c)){Y=!0;try{const{data:n,error:a}=await y.rpc("deallocate_material_from_project",{p_contract_id:R.project.id,p_faction_id:c.id,p_material_key:o,p_quality_tier:e,p_quantity:t});if(a){alert("Return failed: "+a.message);return}if(n&&!n.success){alert(n.error||"Return failed");return}await Pn(),await st(R.project.id)}catch(n){alert("Return error: "+n.message)}finally{Y=!1}}}async function Ja(o,e){if(!(Y||!R||!c)){Y=!0;try{const t=R.project,n=t.workers_assigned||{},a=Number(n[o]||0),i=Number((t.required_workforce||{})[o]||0),r=Number(c?.["corp_"+o+"_workforce"]??0);let s=0;for(const m of X||[])m.id!==t.id&&(s+=Number((m.workers_assigned||{})[o]||0));const l=Math.max(0,r-s-a),d=Math.min(e,i-a,l);if(d<=0){alert(l<=0?"No "+o+" workers available in pool":"Already fully staffed for "+o);return}const f={...n,[o]:a+d},{error:p}=await y.from("construction_contracts").update({workers_assigned:f}).eq("id",t.id);if(p){alert("Assign failed: "+p.message);return}const u=X.find(m=>m.id===t.id);u&&(u.workers_assigned=f),await st(t.id)}catch(t){alert("Assign error: "+t.message)}finally{Y=!1}}}async function Xa(o,e){if(!(Y||!R||!c)){Y=!0;try{const t=R.project,n=t.workers_assigned||{},a=Number(n[o]||0),i=Math.min(e,a);if(i<=0){alert("No "+o+" assigned");return}const r={...n,[o]:a-i},{error:s}=await y.from("construction_contracts").update({workers_assigned:r}).eq("id",t.id);if(s){alert("Unassign failed: "+s.message);return}const l=X.find(d=>d.id===t.id);l&&(l.workers_assigned=r),await st(t.id)}catch(t){alert("Unassign error: "+t.message)}finally{Y=!1}}}async function Za(o,e){if(!(Y||!R||!c)){Y=!0;try{const t=Io[o]||o,n=re.find(d=>d.equipment_key===t||d.equipment_key===o);if(!n){alert("Equipment not found in inventory.");return}const a=Math.max(0,(n.owned||0)-(n.deployed||0));if(a<e){alert("Not enough available "+o+" ("+a+" available).");return}const i=(n.deployed||0)+e,r=[...n.assigned_projects||[]],s=r.find(d=>d.contract_id===R.project.id);s?s.units+=e:r.push({contract_id:R.project.id,contract_name:R.project.name,units:e});const{error:l}=await y.from("corp_equipment").update({deployed:i,assigned_projects:r}).eq("faction_id",c.id).eq("equipment_key",n.equipment_key);if(l){alert("Deploy failed: "+l.message);return}await Kn(),await st(R.project.id)}catch(t){alert("Deploy error: "+t.message)}finally{Y=!1}}}async function er(o){if(!(Y||!R||!c)){Y=!0;try{const e=Io[o]||o,t=re.find(l=>l.equipment_key===e||l.equipment_key===o);if(!t){alert("Equipment not found.");return}const n=[...t.assigned_projects||[]],a=n.findIndex(l=>l.contract_id===R.project.id);if(a===-1){alert("Equipment not deployed to this project.");return}const i=n[a].units;n.splice(a,1);const r=Math.max(0,(t.deployed||0)-i),{error:s}=await y.from("corp_equipment").update({deployed:r,assigned_projects:n}).eq("faction_id",c.id).eq("equipment_key",t.equipment_key);if(s){alert("Undeploy failed: "+s.message);return}await Kn(),await st(R.project.id)}catch(e){alert("Undeploy error: "+e.message)}finally{Y=!1}}}function tr(o){o&&o.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",R=null)}function or(o){R&&(R.tab=o,R.expandedEvent=-1,R.selectedResponse=null,ot())}function nr(o){R&&(R.expandedEvent=R.expandedEvent===o?-1:o,R.selectedResponse=null,ot())}function ir(o){R&&(R.selectedResponse=R.selectedResponse===o?null:o,ot())}function ot(){if(!R)return;const o=R,e=o.project,t=e.issuer_type==="GOVERNMENT",n=On(e.sector),a=c?.nation||"Nation",i=o.awardedTick+o.totalTicks,r=Math.max(0,i-o.currentTick),s=o.currentTick>i,l=o.budget>0?Math.round(o.spent/o.budget*100):0,d=l>85?"var(--red)":l>60?"var(--amber)":"var(--teal)",f=o.budget-o.spent,p=o.events.filter(g=>g.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${b(a.toUpperCase())}</span>
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
    `;let u='<div class="pm-phase__bar">';for(let g=0;g<Ge.length;g++){const h=g<o.phaseIdx,w=g===o.phaseIdx;u+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${h?"done":w?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${h?"done":w?"active":""}">${Ge[g]}</span>
        </div>`}u+="</div>",u+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${Ge[o.phaseIdx]} — ${o.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${s?"var(--red)":"var(--text-secondary)"}">Tick ${o.ticksElapsed} / ${o.totalTicks}${s?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=u;const m=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:p},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=m.map(g=>`<button class="pm-tab${o.tab===g.id?" active":""}" onclick="pmSetTab('${g.id}')">
            ${g.label}${g.badge>0?`<span class="pm-tab__badge">${g.badge}</span>`:""}
        </button>`).join("");let v="";o.tab==="overview"?v=ar(o,e,d,l,f,r,s):o.tab==="events"?v=rr(o):o.tab==="materials"?v=sr(o):o.tab==="equipment"&&(v=lr(o)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${v}</div>`;let x="";p>0&&(x+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${p} EVENT${p>1?"S":""} REQUIRES RESPONSE</span>`),x+=`<span class="pm-ftr__badge" style="color:${o.quality>=75?"var(--green)":o.quality>=50?"var(--amber)":o.quality>=25?"var(--orange)":"var(--red)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${o.quality}/100 — ${o.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${x}</div>
        <div style="display:flex;gap:8px;">
            ${o.effectiveProgress>=o.totalTicks?`<button data-deliver-id="${R.project.id}" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#000;background:var(--green);border:none;cursor:pointer;" onclick="closeProjectModal();deliverProject('${R.project.id}','${(R.project.name||"").replace(/'/g,"\\'")}',${R.bid?.bid_price||0},${R.bid?.estimated_cost||0},${R.bid?.estimated_quality||65})">DELIVER</button>`:""}
            <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
        </div>
    `}function ar(o,e,t,n,a,i,r){const s=Ve(o.awardedTick+o.totalTicks);Ve(o.awardedTick+o.totalTicks);const l=Ve(o.awardedTick),d=[{label:"Budget",value:ue(o.budget),sub:`${n}% spent`,color:t},{label:"Spent",value:ue(o.spent),color:"var(--red)"},{label:"Remaining",value:ue(a),color:"var(--green)"},{label:"Quality",value:`${o.quality}/100`,sub:o.qualityLabel,color:o.quality>=75?"var(--green)":o.quality>=50?"var(--amber)":o.quality>=25?"var(--orange)":"var(--red)"},{label:"Workforce",value:`${o.laborCount}/${o.wfNeeded}`,sub:`Bid: ${o.laborCount}`,color:o.laborCount<o.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${i} ticks`,sub:r?"OVERDUE":`Deadline: ${s}`,color:r?"var(--red)":"var(--text-bright)"}];let f="";f+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${b(e.description||e.name)}</div>
    </div></div>`,f+='<div class="pm-metrics">';for(const g of d)f+=`<div class="pm-metric">
            <div class="pm-metric__label">${g.label}</div>
            <div class="pm-metric__value" style="color:${g.color}">${g.value}</div>
            ${g.sub?`<div class="pm-metric__sub">${b(g.sub)}</div>`:""}
        </div>`;f+="</div>",f+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${l}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${r?"var(--red)":"var(--text-bright)"};font-weight:700">${s}</span></span>
        </div>
    </div></div>`;const p=e.modifiers||[];p.length>0&&(f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Building Modifiers</div>',f+='<div style="display:flex;flex-wrap:wrap;gap:4px;">',f+=Ci(p),f+="</div></div></div>");const u=Array.isArray(o.permitRequirements)?o.permitRequirements:[];if(u.length>0){f+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const g of u){const h=g.has_permit===!0,w=h?"HAS PERMIT":"NEEDS TO GET";f+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:${h?"var(--green)":"var(--amber)"}">${h?"✓":"!"}</span>
                    <span class="pm-permit__name">${b(g.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:${h?"var(--green)":"var(--amber)"}">${w}</span>
            </div>`}f+="</div></div>"}f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Workforce Assignment</div>';const m=[{key:"general",label:"General Workers",corpAvail:o.corpGeneral,color:"var(--text-primary)"},{key:"skilled",label:"Skilled Workers",corpAvail:o.corpSkilled,color:"var(--blue)"},{key:"innovative",label:"Innovative Workers",corpAvail:o.corpInnovative,color:"var(--purple)"}];for(const g of m){const h=Number(o.reqWf[g.key]||0);if(h===0)continue;const w=Number(o.assignedWf[g.key]||0),S=w>=h?"var(--green)":w>0?"var(--amber)":"var(--red)",z=g.corpAvail>0&&w<h,$=Math.min(g.corpAvail,h-w),C=w>0;f+='<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-hair);font-size:0.72rem;">',f+="<div>",f+=`<span style="color:${g.color};font-weight:600;">${g.label}</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Required: <strong>${h}</strong></span>`,f+=`<span style="color:${S};margin-left:8px;font-weight:700;">${w} assigned</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Pool: ${g.corpAvail}</span>`,f+="</div>",f+='<div style="display:flex;gap:4px;">',z&&(f+=`<button onclick="pmAssignWorkers('${g.key}',${$})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Assign ${$}</button>`),C&&(f+=`<button onclick="pmUnassignWorkers('${g.key}',${w})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Remove ${w}</button>`),f+="</div></div>"}const v=Number(o.reqWf.general||0)+Number(o.reqWf.skilled||0)+Number(o.reqWf.innovative||0),x=Number(o.assignedWf.general||0)+Number(o.assignedWf.skilled||0)+Number(o.assignedWf.innovative||0);return v>0&&x<v&&(f+='<div style="font-size:0.62rem;color:var(--red);margin-top:6px;font-family:var(--font-mono);">⚠ Project will STALL until workforce is fully assigned</div>'),f+="</div></div>",f}function rr(o){if(o.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let e="";for(let t=0;t<o.events.length;t++){const n=o.events[t],a=o.expandedEvent===t,i=n.status==="ACTIVE",r=ui[n.type]||ui.WEATHER,s=vi[n.severity]||vi.LOW;if(e+=`<div class="pm-evt ${i?"pm-evt--active":"pm-evt--resolved"}" style="${i?`border-left-color:${r.color}`:""}">`,e+=`<div class="pm-evt__header" onclick="pmToggleEvent(${t})" style="${a?`background:${r.bg}`:""}">`,e+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${r.color};background:${r.bg};border:1px solid ${r.border}">${n.type}</span>
            <span class="pm-evt__sev-badge" style="color:${s}">${n.severity}</span>
            <span class="pm-evt__status" style="color:${i?"var(--red)":"var(--text-dim)"};font-weight:${i?"700":"400"}">${i?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,e+=`<div class="pm-evt__title">${b(n.title)}</div>`,e+=`<div class="pm-evt__meta">Tick ${n.tick} · ${b(n.id||"")}</div>`,a){if(e+='<div class="pm-evt__body">',e+=`<div class="pm-evt__desc">${b(n.desc)}</div>`,n.impact&&(e+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${b(n.impact)}</span>
                </div>`),i&&n.responses&&n.responses.length>0){e+='<div class="pm-evt__resp-title">Response Options</div>';for(let l=0;l<n.responses.length;l++){const d=n.responses[l],f=o.selectedResponse===l,u={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[d.tag]||"var(--text-secondary)";e+=`<div class="pm-resp${f?" selected":""}" style="${f?`border-color:${u}`:""}" onclick="event.stopPropagation();pmSelectResponse(${l})">`,e+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${b(d.label)}</span>
                            <span class="pm-resp__tag" style="color:${u};background:${u}12;border:1px solid ${u}25">${d.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${d.delay>0?"var(--orange)":"var(--green)"}">
                            ${d.delay>0?`+${d.delay} tick${d.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,e+=`<div class="pm-resp__detail">${b(d.detail)}</div>`,e+='<div class="pm-resp__costs">',d.cost&&(e+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${ue(d.cost)}</span>`),d.qualityImpact&&d.qualityImpact!==0&&(e+=`<span class="pm-resp__cost" style="color:${d.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${d.qualityImpact>0?"+":""}${d.qualityImpact}</span>`),!d.cost&&(!d.qualityImpact||d.qualityImpact===0)&&(e+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),e+="</div>",f&&(e+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${u}" onclick="event.stopPropagation();confirmEventResponse('${n.id}','${d.key}')">CONFIRM</button>
                        </div>`),e+="</div>"}}!i&&n.resolution&&(e+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${b(n.resolution)}</div>
                </div>`),e+="</div>"}e+="</div></div>"}return e}function sr(o){if(o.materials.length===0)return'<div class="pm-evt-empty">No materials required for this project.</div>';let e='<div class="pm-tab-header">Project Materials</div>';for(const t of o.materials){const n=t.required>0?Math.round(t.allocated/t.required*100):0;t.allocated>0&&Math.round(t.consumed/t.allocated*100);const a=t.allocated>=t.required,i=a?"var(--green)":t.allocated>0?"var(--amber)":"var(--red)",r=a?"FULLY ALLOCATED":t.allocated>0?"PARTIAL":"NONE ALLOCATED";e+='<div class="pm-mat" style="margin-bottom:14px;">',e+=`<div class="pm-mat__row1">
            <div class="pm-mat__left">
                <span class="pm-mat__name">${b(t.name)}</span>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:${i};">${t.allocated} / ${t.required} allocated · ${r}</span>
        </div>`,e+=`<div class="pm-mat__bar-row">
            <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${n}%;background:${i};"></div></div>
            <span class="pm-mat__pct">${t.consumed} consumed</span>
        </div>`;const s=["STD","LOW","HIGH"],l=t.required-t.allocated;for(const d of s){const f=t.warehouseStock[d]||{qty:0},p=t.tiers[d]||{qty:0,consumed:0},u=p.qty-p.consumed;if(f.qty===0&&p.qty===0)continue;const m=d==="HIGH"?"var(--green)":d==="LOW"?"var(--orange)":"var(--text-muted)",v=d==="HIGH"?"HIGH":d==="LOW"?"LOW":"STD";if(e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border-hair);font-size:0.7rem;">',e+='<div style="display:flex;align-items:center;gap:6px;">',e+=`<span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${m};width:32px;">${v}</span>`,e+=`<span style="color:var(--text-dim);">Warehouse: <strong style="color:var(--text-primary);">${f.qty}</strong></span>`,p.qty>0&&(e+=`<span style="color:var(--text-dim);margin-left:8px;">Allocated: <strong style="color:var(--text-primary);">${p.qty}</strong></span>`),e+="</div>",e+='<div style="display:flex;gap:4px;">',f.qty>0&&l>0){const x=Math.min(f.qty,l);e+=`<button class="pm-alloc-btn" onclick="pmAllocateMaterial('${t.key}','${d}',${x})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Allocate ${x}</button>`}u>0&&(e+=`<button class="pm-alloc-btn" onclick="pmDeallocateMaterial('${t.key}','${d}',${u})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Return ${u}</button>`),e+="</div></div>"}e+="</div>"}return e}function lr(o){if(o.equipment.length===0)return'<div class="pm-evt-empty">No equipment required for this project.</div>';let e='<div class="pm-tab-header">Project Equipment</div>';for(const t of o.equipment){const n=t.condition>=75?"var(--green)":t.condition>=50?"var(--amber)":t.condition>=25?"var(--orange)":"var(--red)",a=t.assignedToProject>=t.required,i=t.assignedToProject>0&&t.assignedToProject<t.required,r=a?"var(--green)":i||t.ownedTotal>0?"var(--amber)":"var(--red)",s=a?`${t.assignedToProject}/${t.required} DEPLOYED`:i?`${t.assignedToProject}/${t.required} PARTIAL`:t.ownedTotal>0?"NOT DEPLOYED":"NOT OWNED";e+=`<div class="pm-eq" style="margin-bottom:12px;">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${b(t.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${r};margin-left:8px;">${s}</span>
                </div>
            </div>`,t.assignedToProject>0&&(e+=`<div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${t.condition}%;background:${n}"></div></div>
                <span class="pm-eq__cond-val" style="color:${n}">${t.condition}%</span>
            </div>`);const l=Math.min(t.available,t.required-t.assignedToProject);e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:0.7rem;">',e+=`<span style="color:var(--text-dim);">Required: <strong style="color:${a?"var(--green)":"var(--red)"}">${t.required}</strong>`,e+=` · Owned: <strong style="color:var(--text-primary);">${t.ownedTotal}</strong>`,e+=` · Available: <strong style="color:var(--text-primary);">${t.available}</strong></span>`,e+='<div style="display:flex;gap:4px;">',l>0&&(e+=`<button onclick="pmDeployEquipment('${t.key}',${l})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Deploy ${l}</button>`),t.assignedToProject>0&&(e+=`<button onclick="pmUndeployEquipment('${t.key}')" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Undeploy</button>`),e+="</div></div>",e+="</div>"}return e}function Ve(o){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][o%12]}, ${2e3+Math.floor(o/12)}`}async function dr(o,e){if(!c||!I)return;const t=prompt(`REQUEST CONSTRUCTION INSURANCE
`+"─".repeat(35)+`

Describe what this policy should cover:

e.g., "Full coverage for weather delays, material damage, and labor disputes during construction. Should cover cost overruns up to 20% of budget."

Insurance corps will see this in their Deal Flow.`);if(t===null)return;const n=t.trim()||"Construction Insurance",a=I.current_tick||0,{error:i}=await y.from("finance_loan_requests").insert({requesting_faction_id:c.id,nation_id:c.nation_id,request_type:"insurance",insured_contract_id:o,amount:e,term_months:0,purpose:n,status:"open",created_tick:a,expires_tick:a+12});if(i){i.message.includes("duplicate")||i.message.includes("unique")?alert("Insurance already requested for this project."):alert("Failed to request insurance: "+i.message);return}alert("Insurance request posted to Deal Flow. Insurance corporations can now offer coverage."),await Wt()}window.requestInsurance=dr;let Yo=!1;const Qo=new Set;function cr(o,e){const t=o?.template_key;if(!t)return null;if(t==="fuel_depot"||t==="dry_dock"){const n=o.project_subtype||"Basic",a=uo.find(i=>i.type===t&&i.name===o.name)||uo.find(i=>i.type===t&&i.style===n)||uo.find(i=>i.type===t);return{type:t,style:n,capacity:n==="Modern"?500:250,maintenance:a?.maint||Math.round(e*.001)}}return t==="custom_building"?{type:"office",style:o.project_subtype||"Basic",capacity:500,maintenance:Math.round(e*.001)}:null}function yi(o,e){document.querySelectorAll(`[data-deliver-id="${o}"]`).forEach(t=>{t.disabled=e,t.style.opacity=e?"0.55":"",t.style.cursor=e?"not-allowed":"pointer",e&&(t.textContent="DELIVERING…")})}async function pr(o,e,t,n,a){if(!(Yo||!c||!I)&&!Qo.has(o)&&confirm('Deliver "'+e+`"?

An inspection will be conducted and payment issued based on quality.`)){Yo=!0,yi(o,!0);try{const i=I.current_tick||0,r=a||65,s=Math.floor(Math.random()*21)-10,l=Math.max(10,Math.min(100,r+s)),d=l>=80?"DISTINCTION":l>=60?"PASS":l>=40?"CONDITIONAL":"FAIL",f=l>=80?Math.round(t*.1):0,p=d==="FAIL"?Math.round(t*.3):d==="CONDITIONAL"?Math.round(t*.1):0,u=Math.max(0,t+f-p),m=u-n,v=d==="DISTINCTION"?3:d==="PASS"?1:d==="CONDITIONAL"?-1:-3,{data:x}=await y.from("construction_contracts").select("awarded_at_tick, timeline_ticks, stalled_ticks, issuer_faction_id, nation_id, status, name, template_key, project_subtype, issuer_type, issuer_name").eq("id",o).single();if(!x){alert("Contract not found.");return}if(x.status==="completed"||x.status==="delivered"){Qo.add(o),alert("This project has already been delivered."),await Wt();return}const g=x.timeline_ticks||8,h=Math.max(0,i-(x.awarded_at_tick||i)),w=h<=g,{error:k}=await y.from("construction_deliveries").insert({contract_id:o,faction_id:c.id,nation_id:x.nation_id,result:d,quality_score:l,rep_change:v,inspection:{base_quality:r,variance:s,final:l},contract_value:t,quality_bonus:f,penalties:p,payment_received:u,total_cost:n,net_profit:m,timeline_expected:g,timeline_actual:h,on_time:w,delivered_at_tick:i});if(k){alert("Delivery failed: "+k.message);return}const{error:S}=await y.from("construction_contracts").update({status:"completed",completed_at_tick:i}).eq("id",o);if(S){alert("Failed to mark project completed: "+S.message);return}if(u>0){const{data:N}=await y.from("factions").select("corp_cash_reserves").eq("id",c.id).single();N&&await y.from("factions").update({corp_cash_reserves:Number(N.corp_cash_reserves||0)+u}).eq("id",c.id)}if(v!==0){const{data:N}=await y.from("factions").select("corp_reputation").eq("id",c.id).single();N&&await y.from("factions").update({corp_reputation:Math.max(0,Math.min(100,Number(N.corp_reputation||50)+v))}).eq("id",c.id)}if(x.issuer_faction_id)try{const N=cr(x,t);N&&await y.from("corp_properties").insert({faction_id:x.issuer_faction_id,nation_id:x.nation_id,name:x.name||e,type:N.type,style:N.style,capacity:N.capacity,purchase_price:t,monthly_maintenance:N.maintenance,condition:Math.max(25,Math.min(100,l)),purchased_at_tick:i,built_via_contract_id:o,is_active:!0})}catch(N){console.warn("[deliverProject] Failed to register property for issuer:",N?.message||N)}const z=x.issuer_name||"the client",{data:$}=await y.from("nations").select("name").eq("id",x.nation_id).single(),C=$?.name||"Unknown",A=c.faction_name+" has completed the "+e+" project for "+z+" in "+C+".",E=new Set([x.nation_id]);c.nation_id&&c.nation_id!==x.nation_id&&E.add(c.nation_id);try{await y.from("event_log").insert([...E].map(N=>({nation_id:N,event_name:e+" — Project Completed",category:"corporate",description_chosen:A,fired_at_tick:i})))}catch(N){console.warn("[Deliver] Event log failed:",N.message)}alert(`Project delivered!

Result: `+d+`
Quality: `+l+`/100
Payment: `+_(u)+(f>0?" (includes +"+_(f)+" quality bonus)":"")+(p>0?`
Penalties: -`+_(p):"")+`
Reputation: `+(v>0?"+":"")+v+`
Net Profit: `+(m>=0?"+":"")+_(m)),Qo.add(o),await Wt(),await Pi()}catch(i){alert("Delivery failed: "+(i.message||i)),yi(o,!1)}finally{Yo=!1}}}window.deliverProject=pr;window.openProjectModal=st;window.closeProjectModal=tr;window.pmSetTab=or;window.pmToggleEvent=nr;window.pmSelectResponse=ir;window.pmAllocateMaterial=Qa;window.pmDeallocateMaterial=Ka;window.pmDeployEquipment=Za;window.pmUndeployEquipment=er;window.pmAssignWorkers=Ja;window.pmUnassignWorkers=Xa;async function Ni(o){if(!R)return;const{data:e,error:t}=await y.from("construction_events").select("*").eq("contract_id",o).order("fired_at_tick",{ascending:!1});t?(console.warn("Failed to load project events:",t.message),R.events=[]):R.events=(e||[]).map(n=>({id:n.id,type:n.type,severity:n.severity,tick:n.fired_at_tick,title:n.title,desc:n.description,impact:n.impact,status:n.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:n.resolution,responses:n.responses||[]})),ot()}let Ko=!1;async function fr(o,e){if(!(Ko||!R)){Ko=!0;try{const{data:t,error:n}=await y.rpc("resolve_construction_event",{p_event_id:o,p_response_key:e});if(n){console.error("Failed to resolve event:",n.message),alert("Failed to submit response: "+n.message);return}const a=typeof t=="string"?JSON.parse(t):t;if(a?.error){alert("Error: "+a.error);return}await Ni(R.project.id),await Wt(),a?.quality_applied&&a.quality_applied!==0&&(R.quality=Math.max(0,Math.min(100,R.quality+a.quality_applied)),R.qualityLabel=R.quality>=75?"EXCELLENT":R.quality>=50?"FAIR":R.quality>=25?"POOR":"BAD"),ot()}finally{Ko=!1}}}window.confirmEventResponse=fr;function Pe(o,e,t){const n=t?` style="color:${t}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${b(o)}</span>
        <span class="cd-detail-row__value"${n}>${b(e)}</span>
    </div>`}function mr(o){const e={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},t=o.drawing_number||o.contract_number+"-A1",n=I?.current_date||"",a=n?n.replace(/,\s*/," "):"",i=o.spec_category==="Heavy Infrastructure",r=o.spec_category==="Megaproject";let s=b(o.project_subtype||o.project_type||"STRUCTURE"),l=i?"80.0m":r?"200.0m":"60.0m",d=i?"40.0m":r?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${e.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(f,p)=>`<line x1="${p*20}" y1="0" x2="${p*20}" y2="200" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(f,p)=>`<line x1="0" y1="${p*20}" x2="680" y2="${p*20}" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}

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
        <text x="340" y="17" text-anchor="middle" font-size="5.5" fill="${e.dim}" font-family="var(--font-mono)">${l}</text>

        <!-- Dimension: right -->
        <line x1="630" y1="30" x2="630" y2="150" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="627" y1="30" x2="633" y2="30" stroke="${e.dim}" stroke-width="0.5"/>
        <line x1="627" y1="150" x2="633" y2="150" stroke="${e.dim}" stroke-width="0.5"/>
        <text x="645" y="93" text-anchor="middle" font-size="5.5" fill="${e.dim}" font-family="var(--font-mono)" transform="rotate(90,645,93)">${d}</text>

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
        <text x="630" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${b(a)}</text>

        <!-- North arrow -->
        <g transform="translate(470,172)">
            <line x1="0" y1="12" x2="0" y2="0" stroke="${e.accent}" stroke-width="0.8"/>
            <polygon points="-3,4 0,0 3,4" fill="${e.accent}"/>
            <text x="0" y="-3" text-anchor="middle" font-size="5" fill="${e.text}" font-family="var(--font-mono)">N</text>
        </g>
    </svg>`}async function Re(){if(!c||!c.nation_id)return;const{data:o,error:e}=await y.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(e)console.warn("Failed to load contracts:",e.message),Ue=[];else{const a=Number(c.corp_reputation??0);Ue=(o||[]).filter(i=>a>=(i.min_reputation||0))}const n=[...new Set(Ue.map(a=>a.nation_id).filter(Boolean))].filter(a=>!bn[a]);if(n.length>0){const{data:a}=await y.from("nations").select("id, name").in("id",n);for(const i of a||[])bn[i.id]=i.name}if(Ct={},c&&Ue.length>0){const a=Ue.map(r=>r.id),{data:i}=await y.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",c.id).in("contract_id",a);for(const r of i||[])Ct[r.contract_id]=r}Si()}function ur(){const o=document.getElementById("ap-list"),e=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=X.length+" ACTIVE",X.length===0){o.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,e.style.display="none";return}const t=I?.current_tick||0;let n=0,a=0,i="";for(const r of X){const s=r.issuer_type==="GOVERNMENT",l=s?"gov":"private",d=Array.isArray(r.contract_bids)?r.contract_bids[0]:r.contract_bids,f=d?.bid_price||0,p=d?.estimated_cost||0,u=d?.estimated_quality||0,m=r.budget_ceiling||0,v=r.awarded_at_tick||t,x=r.stalled_ticks||0,g=Math.max(0,t-v),h=Math.max(0,g-x),w=r.timeline_ticks||8,k=Math.max(0,w-h),S=Math.min(100,Math.round(h/w*100)),z=h>w,$=x>0;let C="";if($){const E=r.required_workforce||{},N=r.workers_assigned||{},q=[];(Number(N.general)||0)<(Number(E.general)||0)&&q.push("General: "+(Number(N.general)||0)+"/"+(Number(E.general)||0)),(Number(N.skilled)||0)<(Number(E.skilled)||0)&&q.push("Skilled: "+(Number(N.skilled)||0)+"/"+(Number(E.skilled)||0)),(Number(N.innovative)||0)<(Number(E.innovative)||0)&&q.push("Innovative: "+(Number(N.innovative)||0)+"/"+(Number(E.innovative)||0)),q.length>0?C="Workers needed — "+q.join(", "):C="Materials needed — allocate from warehouse"}Ti(r.sector);const A=On(r.sector);n+=m,a+=f,i+=`<div class="ap-item" onclick="openProjectModal('${r.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${b(r.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${b(r.issuer_name||"—")} · ${A}</div>
                </div>
                <span class="oc-item__type-badge ${l}">${s?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS${$?' <span style="color:var(--orange);font-weight:700;font-size:7px;">⚠ STALLED ('+x+" ticks) — "+b(C)+"</span>":""}</span>
                    <span class="ap-budget__values" style="color:${z?"var(--red)":$?"var(--orange)":"var(--teal)"}">
                        ${h}/${w} ticks ${z?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${S}%;background:${z?"var(--red)":$?"var(--orange)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${ue(f)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${ue(p)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${u>=70?"var(--green)":u>=40?"var(--teal)":"var(--orange)"}">${u}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${z?"var(--red)":"var(--text-bright)"}">${k} ticks</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">INSURANCE</div>
                    ${r._hasInsurance?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--green);">INSURED</div>':r._insurancePending?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--orange);">PENDING</div>':`<div class="ap-detail-cell__value" style="font-size:8px;cursor:pointer;color:#aa7a5a;font-weight:700;text-decoration:underline;" onclick="event.stopPropagation();requestInsurance('${r.id}',${m})">INSURE</div>`}
                </div>
            </div>
            ${h>=w?`<div style="padding:6px 10px;border-top:1px solid var(--border-0);">
                <button data-deliver-id="${r.id}" onclick="event.stopPropagation();deliverProject('${r.id}','${b(r.name).replace(/'/g,"\\'")}',${f},${p},${u})" style="width:100%;padding:8px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#000;background:var(--green);border:none;cursor:pointer;">DELIVER PROJECT</button>
            </div>`:""}
        </div>`}o.innerHTML=i,e.style.display=X.length>0?"":"none",X.length>0&&(document.getElementById("ap-total-crew").textContent=X.length,document.getElementById("ap-total-budget").textContent=ue(n),document.getElementById("ap-total-spent").textContent=ue(a))}async function Wt(){if(!c)return;const{data:o,error:e}=await y.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",c.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",c.id).order("awarded_at_tick",{ascending:!0});if(e?(console.warn("Failed to load active projects:",e.message),X=[]):X=o||[],X.length>0){const t=X.map(s=>s.id),{data:n}=await y.from("finance_loan_requests").select("insured_contract_id, status").eq("request_type","insurance").in("insured_contract_id",t),{data:a}=await y.from("finance_active_loans").select("request_id, finance_loan_requests!inner(insured_contract_id)").in("status",["current"]).eq("finance_loan_requests.request_type","insurance"),i=new Set((a||[]).map(s=>s.finance_loan_requests?.insured_contract_id).filter(Boolean)),r=new Set((n||[]).filter(s=>s.status==="open").map(s=>s.insured_contract_id));for(const s of X)s._hasInsurance=i.has(s.id),s._insurancePending=r.has(s.id)}ur()}const Mo=3e4;function Ao(){let o=0,e=0;for(const t of Ft)for(const n of An){const a=Z[t.key]?.[n];a&&(o+=a.qty,e+=a.value)}return{totalUnits:o,totalValue:e}}function Bn(){const o=document.getElementById("wh-list"),{totalUnits:e,totalValue:t}=Ao();document.getElementById("wh-count").textContent=e.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=D(t);const n=Math.round(e/Mo*100),a=document.getElementById("wh-capacity");a.textContent=n+"%",a.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)";let i="";for(let r=0;r<Ft.length;r++){const s=Ft[r],l=_n===r,d=Z[s.key]?.LOW||{qty:0,value:0},f=Z[s.key]?.STD||{qty:0,value:0},p=Z[s.key]?.HIGH||{qty:0,value:0},u=d.qty+f.qty+p.qty,m=d.value+f.value+p.value,v=u===0,x=_e(s.key,"LOW",M),g=_e(s.key,"STD",M),h=_e(s.key,"HIGH",M),w=d.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",k=f.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",S=h.available?p.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(i+='<div class="wh-row">',i+=`<div class="wh-row__collapsed${l?" expanded":""}" onclick="toggleWhRow(${r})">
            <span class="wh-row__arrow">${l?"▾":"▸"}</span>
            <span class="wh-row__name${v?" empty":""}">${b(s.name)}</span>
            <div class="wh-row__dots">
                <div class="${w}"></div>
                <div class="${k}"></div>
                <div class="${S}"></div>
            </div>
            <span class="wh-row__qty${v?" empty":""}">${u>0?u.toLocaleString():"—"}</span>
            <span class="wh-row__val${v?" empty":""}">${m>0?D(m):"—"}</span>
        </div>`,l){i+='<div class="wh-expand">',i+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const z=[{key:"LOW",label:"Low",data:d,avail:x,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:f,avail:g,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:p,avail:h,color:"var(--green)",dotClass:"wh-dot--high"}];for(const $ of z){const C=!$.avail.available,A=$.data.qty>0,E=A?"$"+Math.round($.data.value/$.data.qty):"—";i+=`<div class="wh-grade${C?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${$.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${C?"var(--red)":$.color}">${$.label}</span>
                        ${C?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${A?"var(--text-bright)":"var(--text-dim)"}">${A?$.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${$.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${$.data.value>0?D($.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${E}</span>
                </div>`}for(const $ of z)!$.avail.available&&$.avail.failedStat&&(i+=`<div class="wh-lock">
                        <span class="wh-lock__text">${$.label.toUpperCase()} GRADE LOCKED — ${b($.avail.failedStat)} &lt; ${$.avail.failedMin}</span>
                    </div>`);i+="</div>"}i+="</div>"}o.innerHTML=i}function vr(o){_n=_n===o?-1:o,Bn()}async function Pn(){if(!c)return;const{data:o,error:e}=await y.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",c.id);Z={};const t=[];if(e)console.warn("Failed to load warehouse:",e.message);else if(o){for(const n of o){const a=xo(n.material_key);Z[a]||(Z[a]={}),Z[a][n.quality_tier]={qty:n.quantity||0,value:Number(n.total_value)||0},a!==n.material_key&&t.push(n)}if(t.length>0){const n=t.map(a=>({faction_id:c.id,nation_id:c.nation_id,material_key:xo(a.material_key),quality_tier:a.quality_tier,quantity:a.quantity||0,total_value:Number(a.total_value)||0,updated_at:new Date().toISOString()}));await y.from("corp_warehouse").upsert(n,{onConflict:"faction_id,material_key,quality_tier"});for(const a of t)await y.from("corp_warehouse").delete().eq("faction_id",c.id).eq("material_key",a.material_key).eq("quality_tier",a.quality_tier)}}Bn()}const yr={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function Dn(){const e=(rt()?.name||M?.name||c?.nation||"—").toUpperCase(),t=!!(gt&&M&&gt.id!==M.id);document.getElementById("pr-nation-badge").textContent=(t?"IMPORT — ":"LOCAL — ")+e;const n=document.getElementById("pr-nation-select");if(n&&n.options.length===0){const l=M?.name||c?.nation||"—";let d=`<option value="">${b(l)} (HQ)</option>`;for(const f of Tt)f.id!==M?.id&&(d+=`<option value="${f.id}">${b(f.name)}</option>`);n.innerHTML=d}n&&(n.value=gt?.id||"");const a=Number(c?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=D(a);const{totalUnits:i}=Ao(),r=Math.round(i/Mo*100),s=document.getElementById("pr-wh-capacity");s.textContent=r+"%",s.style.color=r>80?"var(--red)":r>50?"var(--orange)":"var(--green)",Ii(),jn(),Ro()}function Ii(){const o=rt(),e=document.getElementById("pr-mat-grid");let t="";for(const n of Ft){const a=te===n.key,i=An.every(s=>!_e(n.key,s,o).available),r="pr-mat-btn"+(a?" active":"")+(i?" all-locked":"");t+=`<span class="${r}" onclick="setPrMat('${n.key}')">${b(n.name)}</span>`}e.innerHTML=t}function jn(){const o=rt(),e=document.getElementById("pr-tier-bar");let t='<span class="pr-tier-label">GRADE</span>';for(const n of An){const a=_e(te,n,o),i=W===n,r=a.available?Rn(te,n,o):null,s=wi[n],l=!a.available,d="pr-tier-btn"+(i?" active":"")+(l?" locked":"");t+=`<div class="${d}" onclick="${l?"":`setPrTier('${n}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${s};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${i?"var(--text-bright)":"var(--text-dim)"}">${gn[n]}</span>
            </div>
            ${r!==null?`<div class="pr-tier-btn__price" style="color:${i?"var(--text-bright)":"var(--text-muted)"}">$${r}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}e.innerHTML=t}function Ro(){const o=rt(),e=document.getElementById("pr-content"),t=_e(te,W,o),n=Ft.find($=>$.key===te);if(!n)return;if(!t.available){e.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${b(n.name)} — ${gn[W]} grade
                    is not produced domestically in ${b(o?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${b(t.failedStat||"unknown")} &lt; ${t.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const a=Rn(te,W,o),i=$i(te,W,o),r=a*be,s=i>3e3?"LOW":i>1e3?"MODERATE":"HIGH",l=s==="LOW"?"var(--green)":s==="MODERATE"?"var(--amber)":"var(--red)",d=Number(o?.inflation??50),f=d>55?"up":d<45?"down":"flat",p=f==="up"?"&#9650;":f==="down"?"&#9660;":"&#8212;",u=f==="up"?"var(--red)":f==="down"?"var(--green)":"var(--text-dim)";let m="";m+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${a}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${u}">${p}</span>
                </div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">SUPPLY/TICK</div>
                <div class="pr-market-cell__value" style="font-size:14px;color:var(--text-bright);margin-top:2px;">${i.toLocaleString()}</div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">DEMAND</div>
                <div class="pr-market-cell__value" style="font-size:12px;color:${l};margin-top:2px;">${s}</div>
            </div>
        </div>
    </div>`,m+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${b(o?.name||"—")})</div>`;for(const $ of n.priceDrivers){const C=Number(o?.[$]??50),A=C>=50?"var(--green)":C>=30?"var(--amber)":C>=15?"var(--orange)":"var(--red)",E=yr[$]||$;m+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${b($)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${C}%;background:${A}"></div>
            </div>
            <span class="pr-driver-row__val">${C}</span>
            <span class="pr-driver-row__effect">${b(E)}</span>
        </div>`}m+="</div>";const x=(Number(c?.corp_cash_reserves)||0)>=r,g=be>i,{totalUnits:h}=Ao(),w=Mo-h,k=be>w,S=w<=0,z=wi[W];m+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${b(n.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${z};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${z}">${gn[W]}</span>
                </div>
                <span class="pr-order__mat-price">$${a}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map($=>`<span class="pr-qty-btn${be===$?" active":""}" onclick="setPrQty(${$})">${$>=1e3?$/1e3+"k":$}</span>`).join("")}
                </div>
            </div>
            ${g?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${i.toLocaleString()} this tick</span>
            </div>`:""}
            ${S?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">WAREHOUSE FULL — no remaining capacity</span>
            </div>`:k?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS WAREHOUSE CAPACITY — ${w.toLocaleString()} units remaining</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${D(r)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${x&&!g&&!k&&!S?"":"disabled"}
                    title="${x?g?"Exceeds supply":S?"Warehouse full":k?"Exceeds warehouse capacity":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,e.innerHTML=m}function gr(o){const e=rt();te=o,W="STD";for(const t of["STD","HIGH","LOW"])if(_e(o,t,e).available){W=t;break}Ii(),jn(),Ro()}function xr(o){W=o,jn(),Ro()}function br(o){be=o,Ro()}let Jo=!1;async function _r(o){if(!o)gt=null;else{let n=Tt.find(a=>a.id===o);if(!n)try{const{data:a}=await y.from("nations").select("*").eq("id",o).single();n=a}catch{}gt=n||null}const e=rt();if(!_e(te,W,e).available){W="STD";for(const n of["STD","HIGH","LOW"])if(_e(te,n,e).available){W=n;break}}const t=document.getElementById("pr-nation-select");t&&(t.value=o||""),Dn()}async function hr(){if(Jo||!c||!M)return;const o=rt(),e=Rn(te,W,o),t=$i(te,W,o),n=e*be,a=Number(c.corp_cash_reserves)||0;if(n>a){alert("Insufficient cash reserves.");return}if(be>t){alert("Exceeds available supply this tick.");return}const{totalUnits:i}=Ao(),r=Mo-i;if(r<=0){alert("Warehouse is full. Cannot purchase more materials.");return}if(be>r){alert(`Warehouse can only hold ${r.toLocaleString()} more units. Reduce quantity.`);return}Jo=!0;const s=document.querySelector(".pr-purchase-btn");s&&(s.disabled=!0,s.textContent="...");try{const l=a-n,{error:d}=await y.from("factions").update({corp_cash_reserves:l}).eq("id",c.id);if(d)throw d;const f=xo(te),p=Z[f]?.[W],u=(p?.qty||0)+be,m=(p?.value||0)+n,{error:v}=await y.from("corp_warehouse").upsert({faction_id:c.id,nation_id:c.nation_id,material_key:f,quality_tier:W,quantity:u,total_value:m,last_purchased_tick:I?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(v){const{error:g}=await y.from("factions").update({corp_cash_reserves:a}).eq("id",c.id);throw g&&console.error("Cash refund failed after warehouse error:",g.message),v}c.corp_cash_reserves=l,Z[f]||(Z[f]={}),Z[f][W]={qty:u,value:m};const x=Math.floor(n/1e6);if(x>=1&&o?.id){const g=x*.01,{data:h,error:w}=await y.from("nations").select("gdp_growth").eq("id",o.id).single();if(!w&&h){const k=Math.min(100,Math.round((Number(h.gdp_growth??50)+g)*100)/100);await y.from("nations").update({gdp_growth:k}).eq("id",o.id),M?.id===o.id&&(M.gdp_growth=k)}}Bn(),Dn(),s&&(s.textContent="PURCHASED",setTimeout(()=>{s.isConnected&&(s.disabled=!1,s.textContent="PURCHASE")},1500))}catch(l){s&&(s.disabled=!1,s.textContent="PURCHASE"),alert("Purchase failed: "+(l.message||"Unknown error"))}finally{Jo=!1}}function Mi(o){const e=Xe||M;if(!e)return[];const t=No(o);if(!t)return[];const n=Pa(o,e),a=[],i=Number(e?.inflation??50),r=Number(e?.fuel_prices??50);Number(e?.manufacturing_output??50);const s=Xe&&M&&Xe.id!==M.id;let l=null;if(s&&(l=Da(e,M)),n.newAvailable>0){const d=fi(o,e),f=t.basePrice,p=Math.round(f*((i-50)/200)),u=Math.round(f*((r-50)/300));let m=d;const v=[{label:"Base price",value:D(f)},p!==0?{label:`Inflation (${i})`,mod:(p>=0?"+":"")+D(Math.abs(p))}:null,u!==0?{label:`Fuel transport (${r})`,mod:(u>=0?"+":"")+D(Math.abs(u))}:null].filter(Boolean),x=d-f-p-u;if(x!==0&&!s&&v.push({label:"Demand/scarcity",mod:(x>=0?"+":"")+D(Math.abs(x))}),s&&l){const g=Math.round(d*l.tariff),h=Math.round(d*l.transport);m=d+g+h,v.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+D(g)}),v.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+D(h)})}a.push({seller:s?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:s?l?.deliveryTicks||1:0,condition:100,price:Math.round(m),available:n.newAvailable,delivery:s?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:s?l.deliveryTicks:0,used:!1,priceFactors:v,sourceNationId:e.id})}if(n.usedAvailable>0){const d=n.usedCondition,f=fi(o,e,{used:!0,condition:d});let p=f;const u=[{label:"Base price",value:D(t.basePrice)},{label:`Condition (${d}%)`,mod:"-"+D(Math.max(0,t.basePrice-f))}];if(s&&l){const m=Math.round(f*l.tariff),v=Math.round(f*l.transport);p=f+m+v,u.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+D(m)}),u.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+D(v)})}a.push({seller:s?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:s?l?.deliveryTicks||1:0,condition:d,price:Math.round(p),available:n.usedAvailable,delivery:s?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:s?l.deliveryTicks:0,used:!0,priceFactors:u,sourceNationId:e.id})}return a}function qo(){const o=Number(c?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=D(o);const e=No(me),t=Ut[e?.tier||1],n=document.getElementById("em-tier-badge");n&&(n.textContent=t.tag,n.style.color=t.color),n.style.background=t.color+"0a",n.style.border="1px solid "+t.color+"33";const a=document.getElementById("em-nation-select");if(a&&a.options.length===0){const s=M?.name||c?.nation||"—";let l=`<option value="">${b(s)} (HQ)</option>`;for(const d of Tt)d.id!==M?.id&&(l+=`<option value="${d.id}">${b(d.name)}</option>`);a.innerHTML=l}const i=document.getElementById("em-import-tag"),r=Xe&&M&&Xe.id!==M.id;i&&(i.style.display=r?"":"none"),$r(),Fn()}function $r(){let o="";for(let e=1;e<=3;e++){const t=Ut[e],n=xn(e),a=e===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";o+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${t.color}">${t.tag}</div>
            <div class="${a}">`;for(const i of n){const r=me===i.key,s=Mi(i.key).length>0;o+=`<span class="em-selector__btn${r?" active":""}${s?"":" no-listings"}"
                style="${r?"background:"+t.color+";border-color:"+t.color:""}"
                onclick="setEmType('${i.key}')">${b(i.name)}</span>`}o+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${o}</div>`}function Fn(){const o=document.getElementById("em-content");if(De=Mi(me),De.length===0){o.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}Ce>=De.length&&(Ce=0);let e="";for(let n=0;n<De.length;n++){const a=De[n],i=Ce===n,r=a.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",s=Ei(a.condition);e+=`<div class="em-listing${i?" selected":""}" style="${i?"border-left-color:"+r:""}" onclick="setEmListing(${n})">`,e+=`<div class="em-listing__row1">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="em-listing__seller">${b(a.seller)}</span>
                <span class="em-badge em-badge--${a.sellerType.toLowerCase()}">${a.sellerType}</span>
                ${a.used?'<span class="em-badge em-badge--used">USED</span>':""}
            </div>
        </div>`,e+=`<div class="em-listing__row2">
            <span class="em-listing__nation">${b((a.nation||"").toUpperCase())}</span>
            ${a.distance>0?`<span class="em-listing__distance">${a.distance} nation${a.distance>1?"s":""} away</span>`:""}
            <span class="em-listing__delivery">Delivery: ${b(a.delivery)}</span>
        </div>`,e+=`<div class="em-listing__stats">
            <div class="em-stat-cell" style="flex:1">
                <div class="em-stat-cell__label">COND.</div>
                <div class="em-stat-cell__bar">
                    <div class="em-stat-cell__bar-track"><div class="em-stat-cell__bar-fill" style="width:${a.condition}%;background:${s}"></div></div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${s}">${a.condition}%</span>
                </div>
            </div>
            <div class="em-stat-cell" style="flex:0.8;text-align:center">
                <div class="em-stat-cell__label">AVAIL.</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${a.available}</div>
            </div>
            <div class="em-stat-cell" style="flex:1.2">
                <div class="em-stat-cell__label">PRICE/UNIT</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${D(a.price)}</div>
            </div>
        </div>`,i&&a.priceFactors&&(e+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${a.priceFactors.map(l=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${b(l.label)}</span>
                    <span class="em-breakdown__mod" style="color:${l.mod?l.mod.startsWith("-")?"var(--green)":l.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${l.mod||l.value}</span>
                </div>`).join("")}
            </div>`),e+="</div>"}const t=De[Ce];if(t){const n=No(me),a=Ut[n?.tier||1],i=Math.min(t.available,4),r=t.price*Ne,s=(Number(c?.corp_cash_reserves)||0)>=r;e+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${b(n?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${b(t.seller)}</span>
                </div>
                <span class="em-purchase__price">${D(t.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:i},(l,d)=>d+1).map(l=>`<span class="em-qty-btn${Ne===l?" active":""}" style="${Ne===l?"background:"+a.color+";border-color:"+a.color:""}" onclick="setEmQty(${l})">${l}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${t.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${D(r)}</div>
                    ${t.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${b(t.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${a.color}" onclick="purchaseEquipment()"
                    ${s?"":"disabled"}
                    title="${s?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}o.innerHTML=e}async function wr(o){if(!o)Xe=null;else{let t=Tt.find(n=>n.id===o);if(!t)try{const{data:n}=await y.from("nations").select("*").eq("id",o).single();t=n}catch{}Xe=t||null}Ce=0,Ne=1;const e=document.getElementById("em-nation-select");e&&(e.value=o||""),qo()}function kr(o){me=o,Ce=0,Ne=1,qo()}function Er(o){Ce=o,Ne=1,Fn()}function Cr(o){Ne=o,Fn()}let Xo=!1;async function Tr(){if(Xo)return;const o=De[Ce];if(!o||!c)return;const e=No(me);if(!e)return;const t=Ne,n=o.price*t,a=Number(c.corp_cash_reserves)||0;if(n>a){alert("Insufficient cash reserves.");return}if(t>o.available){alert("Not enough units available.");return}const i=document.querySelector(".em-purchase-btn");i&&(i.disabled=!0,i.textContent="..."),Xo=!0;try{const r=a-n,{error:s}=await y.from("factions").update({corp_cash_reserves:r}).eq("id",c.id);if(s)throw s;const l=!o.deliveryTicks||o.deliveryTicks===0;if(l){const f=re.find(k=>k.equipment_key===me),p=(f?.owned||0)+t,u=f?.purchase_price_avg||0,m=f?.owned||0,v=m>0?Math.round((u*m+o.price*t)/p):o.price,x=e.maintenancePerUnit*p,g=f?.condition||100,h=Math.round((g*m+o.condition*t)/p),{error:w}=await y.from("corp_equipment").upsert({faction_id:c.id,nation_id:c.nation_id,equipment_key:me,tier:e.tier,owned:p,deployed:f?.deployed||0,condition:h,maintenance_per_tick:x,purchase_price_avg:v,last_purchased_tick:I?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(w){const{error:k}=await y.from("factions").update({corp_cash_reserves:a}).eq("id",c.id);throw k&&console.error("Cash refund failed:",k.message),w}f?(f.owned=p,f.condition=h,f.maintenance_per_tick=x):re.push({equipment_key:me,tier:e.tier,owned:p,deployed:0,condition:h,maintenance_per_tick:x,assigned_projects:[]})}else{const f=(I?.current_tick||0)+o.deliveryTicks,{error:p}=await y.from("corp_equipment_deliveries").insert({faction_id:c.id,equipment_key:me,quantity:t,condition:o.condition,delivery_tick:f,source_nation_id:o.sourceNationId||null,seller_name:o.seller,price_paid:n});if(p){const{error:u}=await y.from("factions").update({corp_cash_reserves:a}).eq("id",c.id);throw u&&console.error("Cash refund failed:",u.message),p}}c.corp_cash_reserves=r,Qn(),qo();const d=document.getElementById("pr-cash");d&&(d.textContent=D(r)),i&&(i.textContent=l?"PURCHASED":"ORDERED",setTimeout(()=>{i.isConnected&&(i.disabled=!1,i.textContent="PURCHASE")},1500))}catch(r){i&&(i.disabled=!1,i.textContent="PURCHASE"),alert("Purchase failed: "+(r.message||"Unknown error"))}finally{Xo=!1}}let Sr=-1,ft=[],$o=[],Cn=[];function Zo(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o.toLocaleString()}function zr(o,e,t){if(t)return"var(--orange)";const n=o/(e||1)*100;return n>50?"var(--green)":n>25?"var(--amber)":"var(--red)"}function gi(){const o=document.getElementById("pm-list"),e=ft.length,t=$o.length,n=Cn.length,a=ft.filter(l=>l.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${e})`,document.getElementById("pm-pending-count").textContent=`(${t})`,document.getElementById("pm-apply-count").textContent=`(${n})`;const i=document.getElementById("pm-badges");let r="";a>0&&(r+=`<span class="pm-badge pm-badge--expiring">${a} EXPIRING</span>`),t>0&&(r+=`<span class="pm-badge pm-badge--pending">${t} PENDING</span>`),i.innerHTML=r;const s=ft.reduce((l,d)=>l+(d.cost||0),0)+$o.reduce((l,d)=>l+(d.cost||0),0);document.getElementById("pm-total-cost").textContent=Zo(s),document.getElementById("pm-footer-active").textContent=e,document.getElementById("pm-footer-pending").textContent=t;{if(e===0){o.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let l="";ft.forEach((d,f)=>{const p=Sr===f,u=zr(d.ticks_left,d.total_ticks,d.expiring_soon),m=Math.min(d.ticks_left/(d.total_ticks||1)*100,100);l+=`<div class="pm-item ${d.expiring_soon?"pm-item--expiring":""} ${p?"expanded":""}" onclick="togglePmExpand(${f})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${b(d.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${b((d.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${u}">Expires: ${b(d.expires||"")}</span>
                        <span class="pm-item__ticks">(${d.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${m}%;background:${u}"></div></div>`,p&&(l+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${b(d.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${b(d.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${Zo(d.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${d.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${d.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(d.projects||[]).map(v=>`<span class="pm-project-chip">${b(v)}</span>`).join("")}</div>
                    </div>`,d.note&&(l+=`<div class="pm-note"><span class="pm-note__text">${b(d.note)}</span></div>`),d.expiring_soon&&d.renewable&&(l+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew" onclick="event.stopPropagation(); pmApplyForPermit('${d.permit_key}');">RENEW — ${Zo(d.cost||0)}</button></div>`),l+="</div>"),l+="</div></div>"}),o.innerHTML=l;return}}let en=!1;async function Nr(o){if(!(en||!c||!M)){en=!0;try{const{data:e}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{data:n,error:a}=await y.rpc("apply_for_permit",{p_faction_id:c.id,p_nation_id:M.id,p_permit_key:o,p_current_tick:t});if(a){alert("Application failed: "+a.message);return}if(n&&!n.success){alert(n.error||"Application failed");return}alert("Permit application submitted! Processing: "+(n.processing_ticks||0)+" ticks."),await Ai()}catch(e){alert("Error: "+e.message)}finally{en=!1}}}window.pmApplyForPermit=Nr;async function Ai(){if(!c||!M){ft=[],$o=[],Cn=[],gi();return}const{data:o}=await y.from("construction_permits").select("*"),e=o||[],t={};for(const p of e)t[p.permit_key]=p;const{data:n}=await y.from("corp_permits").select("*").eq("faction_id",c.id).eq("nation_id",M.id),a=n||[],{data:i}=await y.from("active_laws").select("policy_id, policies(permit_key, policy_name)").eq("nation_id",M.id).not("policies.permit_key","is",null),r=new Set,s={};for(const p of i||[])p.policies?.permit_key&&(r.add(p.policies.permit_key),s[p.policies.permit_key]=p.policies.policy_name);const{data:l}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),d=l?.current_tick||0;ft=a.filter(p=>p.status==="active").map(p=>{const u=t[p.permit_key]||{},m=p.expires_at_tick?Math.max(0,p.expires_at_tick-d):999,v=u.duration_ticks||24;return{name:u.name||p.permit_key,permit_key:p.permit_key,nation:M.name,policy:s[p.permit_key]||"—",issued:p.granted_at_tick!=null?Ve(p.granted_at_tick):"—",expires:p.expires_at_tick?Ve(p.expires_at_tick):"Single-use",cost:p.cost_paid||0,ticks_left:m,total_ticks:v,expiring_soon:m<=3&&m>0,renewable:u.duration_ticks!=null,projects:[]}}),$o=a.filter(p=>p.status==="pending").map(p=>{const u=t[p.permit_key]||{},m=u.processing_ticks||2,v=d-p.applied_at_tick,x=Math.max(0,m-v);return{name:u.name||p.permit_key,permit_key:p.permit_key,nation:M.name,applied:Ve(p.applied_at_tick),status:"PROCESSING",processing_total:m,ticks_remaining:x,est_approval:Ve(p.applied_at_tick+m),cost:p.cost_paid||0,required_by:s[p.permit_key]||"—"}});const f=new Set(a.filter(p=>p.status==="active"||p.status==="pending").map(p=>p.permit_key));Cn=[...r].filter(p=>!f.has(p)).map(p=>{const u=t[p]||{};return{name:u.name||p,permit_key:p,nation:M.name,description:u.description||"",policy:s[p]||"—",cost:u.cost_is_percentage?15e4:u.cost||0,processing_time:u.processing_ticks||2,duration:u.duration_ticks?u.duration_ticks+" ticks":"Single-use",category:u.category||"",difficulty:u.difficulty||"EASY"}}),gi()}let We=[],Ir=-1;function we(o){return Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(2)+"M":Math.abs(o)>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o.toLocaleString()}function xi(o){return o>=85?"var(--gold)":o>=60?"var(--green)":o>=40?"var(--orange)":"var(--red)"}function Mr(o){return"dl-result--"+o.toLowerCase()}function bi(){const o=document.getElementById("dl-list"),e=We.length;document.getElementById("dl-count").textContent=`${e} COMPLETED`;const t=We.reduce((s,l)=>{const d=l.financials||{};return s+((d.payment||0)+(d.bonus||0)-(d.penalty||0)-(d.total_cost||0))},0),n=document.getElementById("dl-lifetime-profit");n.textContent=(t>=0?"+":"")+we(t),n.style.color=t>=0?"var(--green)":"var(--red)";const a={};We.forEach(s=>{a[s.result]=(a[s.result]||0)+1});const i=document.getElementById("dl-footer-results");if(i.innerHTML=Object.entries(a).map(([s,l])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[s]||"var(--text-dim)"}">${b(s)}</div>
            <div class="dl-footer__result-count">${l}</div>
        </div>`).join(""),e===0){o.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let r="";We.forEach((s,l)=>{const d=Ir===l,f=s.financials||{},p=(f.payment||0)+(f.bonus||0)-(f.penalty||0)-(f.total_cost||0),u=p>=0,m=Mr(s.result),x={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[s.result]||"var(--text-dim)",g=s.type==="GOVERNMENT";if(r+=`<div class="dl-item ${d?"expanded":""}" onclick="toggleDlExpand(${l})">
            <div class="dl-item__inner" style="border-left:2px solid ${x}">
                <div class="dl-item__row1">
                    <span class="dl-item__name">${b(s.name)}</span>
                    <span class="dl-result-badge ${m}">${b(s.result)}</span>
                </div>
                <div class="dl-item__row2">
                    <span class="dl-item__id">${b(s.id)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                    <span class="dl-item__issuer" style="color:${g?"var(--green)":"var(--gold)"}">${b(s.issuer)}</span>
                    <span class="dl-item__date">${b(s.delivered)}</span>
                </div>
                <div class="dl-summary-bar">
                    <div class="dl-summary-cell" style="flex:1;">
                        <div class="dl-summary-label">QUALITY</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span class="dl-summary-value" style="color:${xi(s.quality_score)}">${s.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${s.rep_change>0?"var(--green)":s.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${s.rep_change>0?"+":""}${s.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${u?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${u?"var(--green)":"var(--red)"};margin-top:2px;">${u?"+":""}${we(p)}</div>
                    </div>
                </div>`,d){const h=s.inspection||{};r+='<div style="margin-top:8px;">',r+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(z=>{const $=h[z]||{score:0,issues:[]},C=xi($.score),A=Math.min($.score/100*100,100);r+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${b(z.charAt(0).toUpperCase()+z.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${A}%;background:${C}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${C}">${$.score}</span>
                        </div>
                    </div>
                    ${($.issues||[]).map(E=>`<div class="dl-inspect-issue">${b(E)}</div>`).join("")}
                </div>`});const w=h.permits||{passed:!0,issues:[]};r+=`<div class="dl-permits-row ${w.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${w.passed?"var(--green)":"var(--red)"}">${w.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${(w.issues||[]).map(z=>`<div class="dl-inspect-issue dl-inspect-issue--red">${b(z)}</div>`).join("")}
            </div>`,r+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',r+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(s.materials_used||[]).forEach(z=>{const $=z.grade==="HIGH"?"var(--green)":z.grade==="STANDARD"?"var(--amber)":"var(--orange)",C=z.impact==="positive"?"▲":z.impact==="negative"?"▼":"–",A=z.impact==="positive"?"var(--green)":z.impact==="negative"?"var(--red)":"var(--text-dim)";r+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${b(z.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${$}"></div>
                    <span class="dl-mat-tag__grade" style="color:${$}">${b(z.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${A}">${C}</span>
                </div>`}),r+="</div>",r+='<div class="dl-section-label">Financial Summary</div>',r+='<div class="dl-fin-panel">',r+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${we(f.contract_value||0)}</span></div>`,(f.bonus||0)>0&&(r+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${we(f.bonus)}</span></div>`),(f.penalty||0)>0&&(r+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${we(f.penalty)}</span></div>`);const k=(f.payment||0)+(f.bonus||0)-(f.penalty||0);r+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${we(k)}</span></div>`,r+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${we(f.total_cost||0)}</span></div>`,r+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${u?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${u?"var(--green)":"var(--red)"}">${u?"+":""}${we(p)}</span>
            </div>`,r+="</div>";const S=s.timeline||{};r+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${S.actual||0}/${S.expected||0} ticks</span>`,S.early?r+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(S.expected||0)-(S.actual||0)} TICK${S.expected-S.actual!==1?"S":""} EARLY</span>`:!S.on_time&&S.actual>S.expected&&(r+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(S.actual||0)-(S.expected||0)} TICK${S.actual-S.expected!==1?"S":""} LATE</span>`),r+="</div>",r+="</div>"}r+="</div></div>"}),o.innerHTML=r}let bt=!1,tn=!1;function Ri(o){return Math.abs(o)>=1e9?"$"+(o/1e9).toFixed(1)+"B":Math.abs(o)>=1e6?"$"+(o/1e6).toFixed(1)+"M":Math.abs(o)>=1e3?"$"+Math.round(o/1e3)+"k":"$"+Math.round(o)}async function Un(){var{data:o,error:e}=await y.from("factions").select("*").eq("id",c.id).single();if(e){console.warn("Faction refresh failed:",e.message);return}o&&(c=o);var t=document.getElementById("topbar-cash");t&&(t.textContent="CASH: "+Ri(Number(c.corp_cash_reserves??0)))}const Tn={CRITICAL:"#c55",HIGH:"#5c5",MODERATE:"#ca5",LOW:"#6a6660"};let Te=[],Hn=[],qi="ready",Lt=null,Se="ORGANIC",ee=-1;const _i={COASTAL:{color:"#8b9a6b",label:"COASTAL"},INTERNATIONAL:{color:"#5a8aaa",label:"INTL"},GOVERNMENT:{color:"#c8a832",label:"GOV CONTRACT"}};function Li(o){const e=o==="COASTAL"?"ORGANIC":o==="INTERNATIONAL"?"AGREEMENT":o;Se=e,ee=-1,document.querySelectorAll(".ar-pill").forEach(t=>{const n=t.getAttribute("data-ar-filter"),a=n==="COASTAL"?"ORGANIC":n==="INTERNATIONAL"?"AGREEMENT":n;t.className="ar-pill"+(a===e?" active-"+(e==="ORGANIC"?"coastal":e==="AGREEMENT"?"intl":e==="GOVERNMENT"?"gov":"all"):"")}),Wn()}function Gn(){return Se==="GOVERNMENT"?Te.filter(o=>o.scope==="GOVERNMENT"):Se==="AGREEMENT"?Te.filter(o=>o.scope!=="GOVERNMENT"&&!!o.trade_agreement_id):Se==="ORGANIC"?Te.filter(o=>o.scope!=="GOVERNMENT"&&!o.trade_agreement_id):Te}function Ar(){const o=String(c?.shipping_route_focus||c?.shipping_focus||c?.corp_strategy||"").toLowerCase();return o.includes("agreement")?"AGREEMENT":o.includes("government")||o.includes("gov")?"GOVERNMENT":"ORGANIC"}async function Vn(){if(!c||c.corp_sector!=="Shipping")return;const o=await Ra(y,c.id,c.corp_subsector);Te=o.routes,Hn=o.applications,qi=o.state,Lt=o.error,Lt&&console.warn("Failed to load available routes:",Lt.message),Li(Ar()),ee=-1,Wn()}var Rr={fuel_energy:[{stat:"industrialization",label:"Industrialization"},{stat:"urbanization",label:"Urbanization"}],minerals:[{stat:"industrialization",label:"Industrialization"},{stat:"manufacturing",label:"Manufacturing"}],grains_staples:[{stat:"population_growth",label:"Population Growth"},{stat:"food_security",label:"Food Security"}],livestock_dairy:[{stat:"standard_of_living",label:"Std of Living"},{stat:"food_security",label:"Food Security"}],cash_crops:[{stat:"trade_balance",label:"Trade Balance"},{stat:"foreign_investment",label:"Foreign Investment"}],manufactured_goods:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],technology:[{stat:"technology",label:"Technology"},{stat:"higher_education",label:"Higher Education"}],fruits_vegetables:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],arms:[{stat:"military_spending",label:"Military Spending"},{stat:"stability",label:"Stability"}]};function qr(o){return Rr[o]||[]}function Lr(o){var e=Number(o.competition_count||0),t=o.demand_level||"",n=o.scope==="GOVERNMENT";return n?"Fixed payment. No demand risk. Vessel locked for contract duration.":e===0&&t==="CRITICAL"?"Unserved critical corridor. High volume, no competition — claim immediately.":e===0&&t==="HIGH"?"Virgin route with strong demand. First-mover advantage available.":e===0?"No competition on this route. Market share starts at 100%.":t==="CRITICAL"&&e<=2?"Underserved critical route. Demand exceeds current capacity.":t==="LOW"?"Thin route. Revenue may not justify vessel deployment.":e>=3?"Crowded route. Market share will be split "+(e+1)+" ways.":Number(o.tariff_rate||0)>15?"High tariff rate cuts into margins. Watch for trade policy changes.":null}function Wn(){const o=Gn();document.getElementById("ar-count").textContent=Te.length+" ROUTES";var e={ORGANIC:0,AGREEMENT:0,GOVERNMENT:0};Te.forEach(function(x){x.scope==="GOVERNMENT"?e.GOVERNMENT++:x.trade_agreement_id?e.AGREEMENT++:e.ORGANIC++}),document.getElementById("ar-footer-counts").innerHTML='<div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#8b9a6b"></div><span class="ar-footer__count-label">ORGANIC</span><span class="ar-footer__count-num">'+e.ORGANIC+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#5a8aaa"></div><span class="ar-footer__count-label">AGREEMENT</span><span class="ar-footer__count-num">'+e.AGREEMENT+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#c8a832"></div><span class="ar-footer__count-label">GOV</span><span class="ar-footer__count-num">'+e.GOVERNMENT+"</span></div>";const t=document.getElementById("ar-claim-btn");t.className="ar-claim-btn"+(ee>=0?" active":"");const n=document.getElementById("ar-list");if(qi==="error"){n.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+b(Lt&&Lt.message||"Shipping routes are temporarily unavailable.")+"</div></div>";return}var a=Se==="ORGANIC"?"organic":Se==="AGREEMENT"?"agreement-backed":Se==="GOVERNMENT"?"government":Se.toLowerCase();if(o.length===0){n.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+(Te.length===0?"No routes available.<br>Routes are generated from bilateral<br>trade each tick. Check back after<br>the next corp tick fires.":"No "+a+" routes available.")+"</div></div>";return}let i="";for(let x=0;x<o.length;x++){const g=o[x],h=ee===x,w=_i[g.scope]||_i.INTERNATIONAL,k=g.scope==="GOVERNMENT",S=g.demand_level&&Tn[g.demand_level]?{color:Tn[g.demand_level],label:g.demand_level}:null,z=Number(g.competition_count||0),$=z===0?"#5c5":z<=2?"#ca5":"#c84";i+='<div style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid '+(h?w.color:"transparent")+";background:"+(h?w.color+"08":"transparent")+';" onclick="arSelectRoute('+x+')"><div style="padding:8px 14px;">',i+='<div style="display:flex;align-items:center;gap:0;margin-bottom:4px;"><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+b(g.origin_port||"?")+'</span><div style="flex:1;display:flex;align-items:center;margin:0 8px;"><div style="flex:1;height:1px;background:'+w.color+'44"></div><span style="font-family:var(--font-mono);font-size:7px;color:'+w.color+';padding:0 6px">⚓</span><div style="flex:1;height:1px;background:'+w.color+'44"></div></div><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+b(g.destination_port||"?")+"</span></div>",i+='<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;"><span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+w.color+";background:"+w.color+"12;border:1px solid "+w.color+'25">'+w.label+"</span>",S&&(i+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+S.color+";background:"+S.color+"12;border:1px solid "+S.color+'25">'+S.label+" DEMAND</span>"),k&&g.gov_issuer&&(i+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">'+b(g.gov_issuer)+"</span>"),z===0&&!k&&(i+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15)">NO COMPETITION</span>');var r=Hn.find(function(C){return C.route_id===g.id});if(r){var s=r.status==="approved"?"#5c5":"#c8a832",l=r.status==="approved"?"APPROVED":"APPLIED";i+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+s+";background:"+s+"12;border:1px solid "+s+'25">'+l+"</span>"}if(i+='<span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-left:auto">'+(g.transit_ticks||"?")+" tick"+((g.transit_ticks||0)!==1?"s":"")+" · "+b(g.vessel_class||"?")+"</span>",i+="</div>",i+='<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">',k?(i+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(g.gov_contract_duration||g.transit_ticks||"?")+" ticks</div></div>",i+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VESSEL</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+b(g.vessel_class||"?")+"</div></div>",i+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT VALUE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-top:1px">'+D(Number(g.display_contract_value||g.gov_contract_value||g.estimated_revenue||0))+"</div></div>"):(i+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VOLUME</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);margin-top:1px">'+D(Number(g.trade_volume||0))+"</div></div>",i+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">COMP.</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+$+';margin-top:1px">'+z+"</div></div>",i+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">TRANSIT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(g.transit_ticks||"?")+" tick"+((g.transit_ticks||0)!==1?"s":"")+"</div></div>",i+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">EST. REV</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;margin-top:1px">'+D(Number(g.estimated_revenue||0))+"</div></div>"),i+="</div>",h){if(i+='<div style="margin-top:6px;">',k&&g.goods_description&&(i+='<div style="font-size:10px;color:var(--text-muted);line-height:1.5;margin-bottom:6px">'+b(g.goods_description)+"</div>"),g.trade_agreement_name&&(i+='<div style="padding:4px 8px;margin-bottom:5px;background:rgba(90,138,170,0.05);border:1px solid rgba(90,138,170,0.12)"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:var(--font-mono);font-size:7px;color:#5a8aaa;letter-spacing:0.5px">TRADE AGREEMENT</div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:1px">'+b(g.trade_agreement_name)+'</div></div><div style="text-align:right"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">TARIFF</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(Number(g.tariff_rate||0)>10?"#c84":"#5c5")+'">'+Number(g.tariff_rate||0).toFixed(1)+"%</div></div></div></div>"),i+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px">',i+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VESSEL CLASS</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+b(g.vessel_class||"?")+"</span></div>",g.vessel_note&&(i+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">REQUIREMENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+b(g.vessel_note)+"</span></div>"),i+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">PROXIMITY</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+(g.proximity!=null?g.proximity:"?")+" / 100</span></div>",i+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CARGO</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+b(g.goods_name||"Unknown")+"</span></div>",g.goods_description&&!k&&(i+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CONTENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+b(g.goods_description)+"</span></div>"),i+='<div style="display:flex;justify-content:space-between;padding:2px 0"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VOLUME</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+Number(g.volume_physical||0).toLocaleString()+" "+b(g.volume_unit||"tons")+"</span></div>",i+="</div>",M&&!k){var d=qr(g.trade_sector);if(d.length>0){i+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.8px;margin-bottom:3px">DEMAND DRIVERS</div>';for(var f=0;f<d.length;f++){var p=d[f],u=Number(M[p.stat]??50),m=u>=50?"#5c5":u>=30?"#ca5":"#c84";i+='<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);width:100px">'+b(p.label)+'</span><div style="width:40px;height:2px;background:var(--border-0)"><div style="width:'+u+"%;height:100%;background:"+m+'"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-bright)">'+Math.round(u)+"</span></div>"}i+="</div>"}}var v=Lr(g);v&&(i+='<div style="padding:4px 8px;background:'+w.color+"08;border:1px solid "+w.color+'15"><div style="font-size:9px;color:var(--text-muted);line-height:1.5">'+b(v)+"</div></div>"),i+="</div>"}i+="</div></div>"}n.innerHTML=i}function Or(o){ee=ee===o?-1:o,Wn()}async function Br(){if(!(bt||ee<0||!c||!I)){var o=Gn(),e=o[ee];if(e){var t=Hn.find(function(v){return v.route_id===e.id});if(t){alert("You have already applied for this route. Status: "+t.status);return}var n={"Bulk Cargo":"bulk_cargo","Container Freight":"container_freight","Specialized Transport":"specialized_transport"},a=n[c.corp_subsector]||"";if(e.shipping_subsector&&a!==e.shipping_subsector){var i=e.shipping_subsector.replace(/_/g," ").replace(/\b\w/g,function(v){return v.toUpperCase()});alert("Your fleet specializes in "+(c.corp_subsector||"?")+" but this route requires "+i+". You cannot service this route.");return}var r=5e4,{data:s}=await y.from("factions").select("corp_cash_reserves").eq("id",c.id).single(),l=Number(s?.corp_cash_reserves??0);if(l<r){alert("Not enough funds. Application fee: $50k. You have $"+Math.round(l/1e3)+"k.");return}bt=!0;var d=document.getElementById("ar-claim-btn");d.textContent="APPLYING...";try{var f=l-r,{error:p}=await y.from("factions").update({corp_cash_reserves:f}).eq("id",c.id);if(p){alert("Failed to deduct fee.");return}var{data:u,error:m}=await y.from("shipping_applications").insert({route_id:e.id,faction_id:c.id,proposed_rate:Number(e.estimated_revenue||0),application_fee:r,status:"pending",applied_at_tick:I.current_tick}).select("*").single();if(m){await y.from("factions").update({corp_cash_reserves:l}).eq("id",c.id);const v=m.code==="23505"||/duplicate key|idx_shipping_applications_unique/i.test(m.message||"");alert(v?"You already have a pending or approved application on this route. Withdraw it from Route Applications before applying again.":"Application failed: "+m.message);return}try{await y.from("event_log").insert({nation_id:e.origin_nation_id,event_name:c.faction_name+" applied to service "+(e.origin_port||"?")+" → "+(e.destination_port||"?")+" route",category:"corporate",description_chosen:c.faction_name+" has submitted a shipping application for the "+(e.goods_name||"trade")+" route between "+(e.origin_port||"?")+" and "+(e.destination_port||"?")+". Awaiting government approval.",fired_at_tick:I.current_tick})}catch{}await Un(),ee=-1,await Vn(),alert("Application submitted! The government will review your application.")}catch(v){alert("Application failed: "+(v.message||"Network error"))}finally{bt=!1,d.textContent="APPLY TO SERVICE — $50k",d.className="ar-claim-btn"+(ee>=0?" active":"")}}}}async function Pr(){if(!(bt||ee<0||!c||!I)){var o=Gn(),e=o[ee];if(e){var t=Number(c.shipping_fleet_capacity??0),n=Number(c.shipping_fleet_deployed??0);if(n>=t){alert("No available vessels. Fleet capacity: "+t+", deployed: "+n+".");return}bt=!0;var a=document.getElementById("ar-claim-btn");a.textContent="CLAIMING...",a.className="ar-claim-btn";try{var{data:i,error:r}=await y.rpc("claim_shipping_route",{p_faction_id:c.id,p_route_id:e.id,p_current_tick:I.current_tick});if(r){alert("Claim failed: "+r.message);return}if(i&&!i.success){alert(i.error||"Claim failed.");return}if(i?.claim_id){var s=(he||[]).find(function(u){return u.status==="in_port"&&!u.active_claim_id&&u.fuel>=10});if(s){var{error:l}=await y.from("corp_vessels").update({status:"in_transit",active_claim_id:i.claim_id,current_port_nation_id:null}).eq("id",s.id);l&&console.warn("Failed to assign vessel to route:",l.message)}else console.warn("Route claimed but no available vessel with fuel >= 10% to assign.")}try{var d=e.origin_nation?.name||e.origin_nation_id||"Unknown",f=e.destination_nation?.name||e.destination_nation_id||"Unknown",p=e.goods_type||e.cargo_type||"goods";await y.from("event_log").insert({nation_id:c.nation_id,event_name:"Shipping Route Signed",category:"corporate",description_chosen:c.faction_name+" has just signed an agreement to ship "+p+" between "+d+" and "+f+".",fired_at_tick:I.current_tick||0})}catch{}await Un(),ee=-1,await Promise.all([Vn(),Yn(),$e()])}catch(u){alert("Claim failed: "+(u.message||"Network error"))}finally{bt=!1,a.textContent="CLAIM ROUTE",a.className="ar-claim-btn"+(ee>=0?" active":"")}}}}let je=[],Oi="ready",Ot=null,wo=-1;async function Yn(){if(!c||c.corp_sector!=="Shipping")return;const o=await Ma(y,c.id);je=o.claims,Oi=o.state,Ot=o.error,Ot&&console.warn("Failed to load active voyages:",Ot.message),Bi()}function Dr(o){wo=wo===o?-1:o,Bi()}async function jr(o){if(!(tn||!c||!I)){tn=!0;try{var{data:e,error:t}=await y.rpc("release_shipping_route",{p_faction_id:c.id,p_claim_id:o,p_current_tick:I.current_tick});if(t){alert("Release failed: "+t.message);return}if(e&&!e.success){alert(e.error||"Release failed.");return}var{error:n}=await y.from("corp_vessels").update({status:"in_port",active_claim_id:null}).eq("active_claim_id",o).eq("faction_id",c.id);n&&console.warn("Failed to free vessel on release:",n.message),wo=-1,await Un(),await Promise.all([Vn(),Yn(),$e()])}catch(a){alert("Release failed: "+(a.message||"Network error"))}finally{tn=!1}}}function Bi(){const o=I?.current_tick||0,e=Number(c?.shipping_fleet_capacity??0),t=Number(c?.shipping_fleet_deployed??0),n=c?.corp_subsector||"--";document.getElementById("av-count").textContent=je.length+" ACTIVE";const a=je.reduce((f,p)=>f+Number(p.total_revenue||0),0),i=je.reduce((f,p)=>f+(p.transits_completed||0),0),r=i>0?Math.round(a/i):0;document.getElementById("av-summary").innerHTML=`
        <div class="av-summary__cell">
            <div class="av-summary__label">FLEET</div>
            <div class="av-summary__value" style="color:${t>=e?"var(--orange)":"var(--text-bright)"}">
                ${t} <span style="font-size:9px;color:var(--text-dim)">/ ${e}</span>
            </div>
        </div>
        <div class="av-summary__cell">
            <div class="av-summary__label">TRANSITS</div>
            <div class="av-summary__value" style="color:var(--text-bright)">${i}</div>
        </div>
        <div class="av-summary__cell">
            <div class="av-summary__label">AVG REV/TRIP</div>
            <div class="av-summary__value" style="color:var(--green)">${D(r)}</div>
        </div>`,document.getElementById("av-total-revenue").textContent=D(a),document.getElementById("av-total-revenue").style.color=a>0?"var(--green)":"var(--text-dim)",document.getElementById("av-fleet-status").textContent=t+"/"+e,document.getElementById("av-subsector").textContent=n;const s=document.getElementById("av-list");if(Oi==="error"){s.innerHTML='<div class="av-empty"><div class="av-empty__text">'+b(Ot&&Ot.message||"Active voyage data is temporarily unavailable.")+"</div></div>";return}if(je.length===0){s.innerHTML='<div class="av-empty"><div class="av-empty__text">No active voyages.<br>Claim a shipping route to<br>deploy your fleet.</div></div>';return}let l="";for(let f=0;f<je.length;f++){const p=je[f],u=p.shipping_routes||{},m=wo===f,v=p.vessel_status||"idle";let x=v.toUpperCase().replace("_"," "),g="av-status--idle",h="";if(v==="loading")g="av-status--loading",x="LOADING";else if(v==="in_transit"){g="av-status--transit";const C=p.transit_started_tick||o,E=(p.transit_arrives_tick||C+(u.transit_ticks||2))-C,N=Math.max(0,Math.min(o-C,E)),q=E>0?Math.round(N/E*100):0;x="IN TRANSIT ("+N+"/"+E+")",h='<div class="av-transit-bar"><div class="av-transit-bar__fill" style="width:'+q+'%"></div></div>'}const w=Number(p.revenue_per_transit||0),k=Number(p.market_share_pct||0),S=p.transits_completed||0,z=Number(p.total_revenue||0),$=Tn[u.demand_level]||"#6a6660";if(l+='<div class="av-item" onclick="avToggle('+f+')"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;"><div class="av-item__route">'+b(u.origin_port||"?")+" → "+b(u.destination_port||"?")+'</div><span class="av-status '+g+'">'+x+'</span></div><div class="av-item__cargo">'+b(u.goods_name||"Unknown")+" · "+b(u.vessel_class||"?")+"</div>"+h+'<div class="av-item__stats"><div class="av-stat"><div class="av-stat__label">REV/TRIP</div><div class="av-stat__value" style="color:var(--green)">'+D(w)+'</div></div><div class="av-stat"><div class="av-stat__label">SHARE</div><div class="av-stat__value">'+k.toFixed(1)+'%</div></div><div class="av-stat"><div class="av-stat__label">TRANSITS</div><div class="av-stat__value">'+S+'</div></div><div class="av-stat"><div class="av-stat__label">TOTAL REV</div><div class="av-stat__value" style="color:var(--green)">'+D(z)+"</div></div></div>",m){l+='<div class="av-item__detail"><div class="av-detail-row"><span class="av-detail-label">ORIGIN</span><span class="av-detail-value">'+b(u.origin_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">DESTINATION</span><span class="av-detail-value">'+b(u.destination_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE SECTOR</span><span class="av-detail-value">'+b((u.trade_sector||"").replace(/_/g," ").toUpperCase())+'</span></div><div class="av-detail-row"><span class="av-detail-label">SCOPE</span><span class="av-detail-value">'+b(u.scope||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRANSIT TIME</span><span class="av-detail-value">'+(u.transit_ticks||"?")+' ticks</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE VOLUME</span><span class="av-detail-value">'+D(Number(u.trade_volume||0))+'</span></div><div class="av-detail-row"><span class="av-detail-label">TARIFF</span><span class="av-detail-value">'+Number(u.tariff_rate||0).toFixed(1)+'%</span></div><div class="av-detail-row"><span class="av-detail-label">COMPETITION</span><span class="av-detail-value">'+(u.competition_count??0)+' corps</span></div><div class="av-detail-row"><span class="av-detail-label">DEMAND</span><span class="av-detail-value" style="color:'+$+'">'+(u.demand_level||"?")+"</span></div>"+(u.trade_agreement_name?'<div class="av-detail-row"><span class="av-detail-label">AGREEMENT</span><span class="av-detail-value" style="color:var(--teal)">'+b(u.trade_agreement_name)+"</span></div>":"")+'<div class="av-detail-row"><span class="av-detail-label">CLAIMED</span><span class="av-detail-value">Tick '+(p.claimed_at_tick||"?")+"</span></div>";var d=(he||[]).find(function(C){return C.active_claim_id===p.id});!d&&v==="loading"?l+=`<div style="padding:6px 8px;margin-top:4px;background:rgba(200,168,50,0.06);border:1px solid rgba(200,168,50,0.15);text-align:center;"><div style="font-family:var(--font-mono);font-size:9px;color:var(--orange);font-weight:700;margin-bottom:4px;">NO VESSEL ASSIGNED</div><button class="av-action-btn" style="background:var(--teal);color:#fff;border-color:var(--teal);width:100%;" onclick="event.stopPropagation();openAssignVesselModal('`+p.id+"','"+(u.vessel_class||"")+`')">ASSIGN VESSEL</button></div>`:d&&(l+='<div style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:var(--bg-card);border:1px solid var(--border-main);"><div><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">ASSIGNED VESSEL</div><div style="font-size:11px;font-weight:700;color:var(--text-bright);">'+b(d.vessel_name||"Unknown")+'</div></div><div style="display:flex;gap:10px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(d.fuel>50?"#5c5":d.fuel>20?"#ca5":"#c55")+'">'+(d.fuel||0)+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(d.condition>50?"#5c5":d.condition>30?"#ca5":"#c55")+'">'+(d.condition||0)+"%</div></div></div></div>"),l+=`<button class="av-action-btn release" onclick="event.stopPropagation();avRelease('`+p.id+`')">RELEASE ROUTE</button></div>`}l+="</div>"}s.innerHTML=l}function Fr(o,e){const t=(he||[]).filter(function(i){return i.status==="in_port"&&!i.active_claim_id&&i.fuel>=15&&i.condition>=20});let n;t.length===0?n='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No available vessels.<br>Ships must be in port with 15%+ fuel and 20%+ condition.</div>':n=t.map(function(i,r){var s=i.fuel>50?"#5c5":i.fuel>20?"#ca5":"#c55",l=i.condition>50?"#5c5":i.condition>30?"#ca5":"#c55";return`<div style="padding:10px 14px;border-bottom:1px solid var(--border-0);cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="assignVesselToRoute('`+o+"','"+i.id+`')"><div><div style="font-size:14px;font-weight:700;color:var(--text-bright);">`+b(i.vessel_name||"Unnamed")+'</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+b(i.vessel_class||"?")+" · "+(i.capacity_dwt||0).toLocaleString()+' DWT</div></div><div style="display:flex;gap:14px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+s+'">'+i.fuel+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+l+'">'+i.condition+'%</div></div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--teal);padding:4px 12px;border:1px solid var(--teal);cursor:pointer;">ASSIGN</div></div></div>'}).join("");var a=document.createElement("div");a.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;",a.onclick=function(i){i.target===a&&a.remove()},a.innerHTML='<div style="width:560px;max-width:95vw;max-height:80vh;background:var(--bg-panel);border:1px solid var(--border-main);display:flex;flex-direction:column;"><div style="padding:12px 16px;border-bottom:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:space-between;align-items:center;"><span style="font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:var(--teal);">ASSIGN VESSEL</span><span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+t.length+' available</span></div><div style="flex:1;overflow-y:auto;">'+n+`</div><div style="padding:10px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);text-align:right;"><button onclick="this.closest('div[style*=fixed]').remove()" style="padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);background:transparent;border:1px solid var(--border-main);cursor:pointer;">CANCEL</button></div></div>`,document.body.appendChild(a)}async function Ur(o,e){try{var{error:t}=await y.from("corp_vessels").update({status:"in_port",active_claim_id:o}).eq("id",e).eq("faction_id",c.id);if(t){alert("Assignment failed: "+t.message);return}var n=document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]');n&&n.remove(),await Promise.all([Yn(),$e()])}catch(a){alert("Assignment failed: "+(a.message||"Network error"))}}window.openAssignVesselModal=Fr;window.assignVesselToRoute=Ur;async function Pi(){if(!c){We=[],bi();return}const{data:o,error:e}=await y.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",c.id).order("delivered_at_tick",{ascending:!1}).limit(20);e?(console.warn("Failed to load deliveries:",e.message),We=[]):We=(o||[]).map(t=>{const n=t.construction_contracts||{};return{id:t.contract_id,name:n.name||"Project",type:n.issuer_type||"GOVERNMENT",issuer:n.issuer_name||"Government",delivered:"Tick "+(t.delivered_at_tick||0),result:t.result,quality_score:t.quality_score,rep_change:t.rep_change,financials:{contract_value:t.contract_value||0,bonus:t.quality_bonus||0,penalty:t.penalties||0,payment:t.payment_received||0,total_cost:t.total_cost||0},inspection:t.inspection||{},materials_used:t.materials_used||[],timeline:{expected:t.timeline_expected||0,actual:t.timeline_actual||0,on_time:t.on_time,early:t.timeline_actual<t.timeline_expected}}}),bi()}function Qn(){const o=re.reduce((s,l)=>s+(l.owned||0),0),e=re.reduce((s,l)=>s+(l.deployed||0),0),t=Ba(re),n=o-e;document.getElementById("eq-count").textContent=o+" UNITS",document.getElementById("eq-summary").innerHTML=`
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
        </div>`;const a={};for(const s of re)a[s.equipment_key]=s;let i="";for(let s=1;s<=3;s++){const l=Ut[s],d=xn(s),f=hn===s,p=d.reduce((m,v)=>m+(a[v.key]?.owned||0),0),u=d.reduce((m,v)=>m+(a[v.key]?.deployed||0),0);if(i+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${s})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${f?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${l.color}">${b(l.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${l.color};border:1px solid ${l.color}33;background:${l.color}0a">${l.tag}</span>
            </div>
            ${p>0?`<span class="eq-tier-hdr__count">${u}/${p}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,f)for(const m of d){const v=a[m.key],x=v?.owned||0,g=v?.deployed||0,h=v?.condition||0,w=m.maintenancePerUnit*x,k=x-g,S=x>0&&k===0,z=x>0&&h<65,$=Ei(h),C=v?.assigned_projects||[],A=C.length>0?C.map(E=>E.contract_name||"Project").join(", ").slice(0,30):x>0&&g>0?g+" project"+(g>1?"s":""):"—";i+=`<div class="eq-row${x===0?" unowned":""}">`,i+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${x===0?" dim":""}">${b(m.name)}</span>
                        ${z?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${x>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${S?"var(--orange)":"var(--green)"}">${k}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${g}/${x}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,x>0?i+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${h}%;background:${$}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${$}">${h}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${b(A)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${D(w)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:i+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',i+="</div>"}}document.getElementById("eq-list").innerHTML=i;const r=[1,2,3].map(s=>{const l=Ut[s],d=xn(s).reduce((f,p)=>f+(a[p.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${d>0?l.color+"33":"var(--border-0)"};background:${d>0?l.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${l.color}">${l.tag}</div>
            <div class="eq-footer__tier-count" style="color:${d>0?"var(--text-bright)":"var(--text-dim)"}">${d}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${D(t)}</div>
        </div>
        <div class="eq-footer__tiers">${r}</div>`}function Hr(o){hn=hn===o?-1:o,Qn()}async function Kn(){if(!c)return;const{data:o,error:e}=await y.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",c.id);e?(console.warn("Failed to load equipment:",e.message),re=[]):re=o||[],Qn()}async function Gr(){const{data:{user:o}}=await y.auth.getUser();if(!o){window.location.href="login.html";return}const{data:e}=await y.from("factions").select("*").or(`id.eq.${o.id},linked_user_id.eq.${o.id}`);ke=(e||[]).filter(m=>m.nation_id);const t=sessionStorage.getItem("active_faction_id");if(c=ke.find(m=>m.id===t)||ke.find(m=>m.faction_type==="corporation")||ke[0],!c){await y.auth.signOut(),window.location.href="login.html";return}if(c.faction_type!=="corporation"){window.location.href="dashboard.html";return}const n=new URLSearchParams(window.location.search).get("tab"),a=n==="expansion"||n==="actions";if(c.corp_sector!=="Construction"&&!a){const v={Finance:"corp-operations-finance.html",Shipping:"corp-operations-shipping.html"}[c.corp_sector];if(v){window.location.href=v;return}}const[i,r]=await Promise.all([c.nation_id?y.from("nations").select("*").eq("id",c.nation_id).single():Promise.resolve({data:null}),y.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);i.error&&console.warn("Nation load failed:",i.error.message),i.data&&(M=i.data),r.error&&console.warn("Shard load failed:",r.error.message),I=r.data;let s=0;if(c?.id){const{data:m}=await y.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",c.id).in("status",["open","bidding"]);if(m)for(const v of m)s+=(v.contract_bids||[]).length}const l=document.getElementById("corp-topbar-container");if(l){const{renderCorpTopBar:m}=await qa(async()=>{const{renderCorpTopBar:g}=await import("./corp-topbar-5lTmaM1a.js");return{renderCorpTopBar:g}},__vite__mapDeps([0,1])),v=new URLSearchParams(window.location.search).get("tab")||"operations",x={};s>0&&(x.home={color:"#c8a832",title:s+" pending bid"+(s!==1?"s":"")+" on your projects"}),m(l,{faction:c,shard:I,activeTab:v,allUserFactions:ke,badges:x})}if(I){if(document.getElementById("game-date").textContent=I.current_date||"—",document.getElementById("tick-number").textContent=I.current_tick||"—",I.next_tick_at){const v=(Number(I.tick_interval_hours)||8)*36e5,x=new Date(I.next_tick_at).getTime(),h=x-v+v/2;$n=new Date(h>Date.now()?h:x+v/2),Ga()}const m=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");m&&(m.textContent="Next Corp Tick")}const d=document.getElementById("topbar-cash");d&&(d.textContent="CASH: "+Ri(Number(c.corp_cash_reserves??0)));const f=document.getElementById("topbar-ap");f&&(f.style.display="none");const p=document.getElementById("nation-pill");p&&(p.textContent=(M?.name||c.nation||"—").toUpperCase());const u=document.getElementById("corp-faction-dropdown");if(u){let m="";for(const v of ke){const x=v.id===c.id,g=v.faction_type==="corporation"?"CORP":"PARTY",h=v.faction_type==="corporation"?"var(--teal)":"var(--amber)";m+=`<div class="corp-dd-item${x?" active":""}" onclick="switchToFaction('${v.id}', '${v.faction_type}')">
                <span class="corp-dd-type" style="color:${h}">${g}</span>
                <span class="corp-dd-name">${b(v.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${b(v.abbreviation||"—")}]</span>
            </div>`}u.innerHTML=m}try{const{data:m}=await y.from("building_modifiers").select("*");bo={};for(const v of m||[])bo[v.modifier_key]=v}catch{}await Promise.all([Re(),Wt(),Pn(),Kn(),Ai(),Pi(),to()]);try{const{data:m}=await y.from("nations").select("*").order("name");Tt=m||[]}catch{Tt=[]}Dn(),qo(),La(c,M,I);try{await Ia(y,{faction:c,nation:M,shard:I},"auto-services-container")}catch(m){console.error("[CorpOps] Auto-services init failed:",m)}if(document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",n==="expansion"){const m=document.querySelector('[data-tab-action="expansion"]');m&&ji({preventDefault:()=>{},target:m})}else if(n==="actions"){const m=document.querySelector('[data-tab-action="actions"]');m&&Ui({preventDefault:()=>{},target:m})}}async function Vr(){await y.auth.signOut(),window.location.href="login.html"}function Wr(){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.toggle("open")}function Yr(o,e){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.remove("open"),sessionStorage.setItem("active_faction_id",o),e==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",o=>{const e=document.getElementById("faction-switcher"),t=document.getElementById("corp-faction-dropdown");t&&e&&!e.contains(o.target)&&t.classList.remove("open")});document.addEventListener("keydown",o=>{o.key==="Escape"&&Zt()});window.doLogout=Vr;window.toggleCorpDropdown=Wr;window.switchToFaction=Yr;window.setFilter=Va;window.arSetFilter=Li;window.arSelectRoute=Or;window.arClaimRoute=Pr;window.arApplyToService=Br;window.avToggle=Dr;window.avRelease=jr;window.openContractDetail=zi;window.closeContractDetail=Zt;window.toggleWhRow=vr;window.toggleEqTier=Hr;window.switchEmNation=wr;window.setEmType=kr;window.setEmListing=Er;window.setEmQty=Cr;window.purchaseEquipment=Tr;window.switchPrNation=_r;window.setPrMat=gr;window.setPrTier=xr;window.setPrQty=br;window.purchaseMaterial=hr;let ae={general:0,skilled:0,innovative:0},on=!1;const et=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function Di(o){const e=Number(M?.minimum_wage??50),t=Number(M?.inflation??50),n=Number(M?.standard_of_living??50),a=e/100*48e3,i=1+(t-50)/100*.5,r=1+(n-50)/100*.5;return Math.round(a*o*i*r)}function _(o){const e=Math.abs(o),t=o<0?"-":"";return e>=1e9?t+"$"+(e/1e9).toFixed(2)+"B":e>=1e6?t+"$"+(e/1e6).toFixed(2)+"M":e>=1e3?t+"$"+(e/1e3).toFixed(1)+"k":t+"$"+e.toLocaleString()}async function ji(o){o.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("actions-content").style.display="none";const e=document.getElementById("expansion-content");e.style.display="flex",e.style.justifyContent="center",e.style.gap="12px",e.style.alignItems="flex-start",e.style.flexWrap="wrap",document.querySelectorAll(".corp-nav-tab").forEach(t=>t.classList.remove("active")),o.target.classList.add("active"),await to(),Oo(),$s(),await ti(),Po(),await Hs(),await Ms(),io(),no(),await Zs(),ao(),await jo(),Fo()}function Fi(o){o&&o.preventDefault(),document.getElementById("operations-content").style.display="flex",document.getElementById("expansion-content").style.display="none",document.getElementById("actions-content").style.display="none",document.querySelectorAll(".corp-nav-tab").forEach(e=>e.classList.remove("active")),Qr()?.classList.add("active")}async function Ui(o){o.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("expansion-content").style.display="none",document.getElementById("actions-content").style.display="block",document.querySelectorAll(".corp-nav-tab").forEach(e=>e.classList.remove("active")),(o.target||document.querySelector('[data-tab-action="actions"]'))?.classList.add("active"),await Hi(),zt()}function Qr(){return Array.from(document.querySelectorAll(".corp-nav-tab[href]:not([data-tab-action])")).find(o=>{const e=o.getAttribute("href");if(!e)return!1;const t=new URL(e,window.location.href);return t.pathname===window.location.pathname&&!t.searchParams.get("tab")})||null}async function Hi(){if(!c)return;const[o,e]=await Promise.all([y.from("corp_executives").select("*").eq("faction_id",c.id).eq("status","active"),y.from("executive_pool").select("*").eq("nation_id",c.nation_id).eq("status","available").order("skill",{ascending:!1})]);o.error&&console.warn("Failed to load executives:",o.error.message),e.error&&console.warn("Failed to load executive pool:",e.error.message),Ht=o.data||[],Gt=e.data||[];const t=await ja({supabase:y,faction:c,currentTick:I?.current_tick||0,poolCandidates:Gt});t?.error&&console.warn("Failed to seed initial executive roster:",t.error.message||t.error),t?.executives&&(Ht=t.executives)}function mt(o){return o>=1e6?"$"+(o/1e6).toFixed(1)+"M":o>=1e3?"$"+(o/1e3).toFixed(0)+"k":"$"+o}function Le(o){return Ht.find(e=>e.role===o)||null}function ko(o,e){return(o||"?")[0]+(e||"?")[0]}function _t(o){return o>=70?"#5cb85c":o>=50?"#ca5":"#c84"}function zt(){const o=document.getElementById("actions-container");if(!o)return;const e=c?.faction_name||"Corporation",t=(c?.abbreviation||c?.corp_ticker||"??").toUpperCase();let n="";n+=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:0 2px;">
        <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:2px;color:#8b9a6b;text-transform:uppercase;">Actions</span>
            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${b(e)} &middot; ${b(t)}</span>
        </div>
    </div>`,n+='<div style="display:flex;gap:8px;">',n+='<div style="width:262px;display:flex;flex-direction:column;gap:5px;flex-shrink:0;">';for(let a=0;a<vo.length;a++){const i=vo[a],r=yo[i],s=Le(i),l=xt===a,d=r.color,f=!s;if(n+=`<div onclick="actSelectExec(${a})" style="
            padding:10px 12px;
            background:${l?d+"0a":"var(--bg-2,#1a1a17)"};
            border:1px solid ${l?d+"44":"var(--border-0,rgba(255,255,255,0.06))"};
            border-left:3px solid ${l?d:"var(--border-0,rgba(255,255,255,0.06))"};
            cursor:pointer;
        ">`,f&&i!=="CEO")n+=`<div style="display:flex;align-items:center;gap:10px;">
                <div style="width:45px;height:45px;background: var(--border-hair);border:1px dashed var(--border-1);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);flex-shrink:0;">?</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:4px;">
                        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${d};">${b(i)}</span>
                    </div>
                    <div style="font-size:13px;font-weight:600;color:var(--text-dim);margin-top:2px;">VACANT</div>
                    <div style="margin-top:4px;">
                        <span onclick="event.stopPropagation();openExecSearch('${i}')" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:3px 8px;color:#5a8aaa;border:1px solid rgba(90,138,170,0.25);background:rgba(90,138,170,0.06);cursor:pointer;">EXECUTIVE SEARCH</span>
                    </div>
                </div>
            </div>`;else{const p=s?`${s.first_name} ${s.last_name}`:"—",u=s?s.age:0,m=s?s.skill:0,v=s?s.salary_per_year:0,x=s?ko(s.first_name,s.last_name):"—";n+=`<div style="display:flex;align-items:center;gap:10px;">
                <div style="width:45px;height:45px;background:${d}15;border:1px solid ${d}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:14px;font-weight:700;color:${d};flex-shrink:0;">${b(x)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:4px;">
                        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${d};">${b(i)}</span>
                    </div>
                    <div style="font-size:13px;font-weight:600;color:${l?"var(--text-bright,#f0efe6)":"var(--text-muted,#666)"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(p)}${u?` <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">(${u})</span>`:""}</div>
                    <div style="display:flex;align-items:center;gap:6px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:3px;flex:1;">
                            <div style="flex:1;height:3px;background:var(--border-0,rgba(255,255,255,0.06));">
                                <div style="width:${m}%;height:100%;background:${_t(m)};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-muted);width:18px;text-align:right;">${m}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${mt(v)}/yr</span>
                    </div>
                </div>
            </div>`}n+="</div>"}n+="</div>",n+=`<div style="flex:1;display:flex;flex-direction:column;gap:0;">
        <div id="actions-right-panel"></div>
    </div>`,n+="</div>",o.innerHTML=n,Jr()}const Gi={CEO:[{id:"statement",name:"Issue Statement",desc:"Issue a press release to the public events feed. Other players and media corps see it. Cost scales with CEO skill.",cost:"~$20k",costColor:"#5cb85c",tags:["REPUTATION"],cooldown:"once/tick"},{id:"ipo",name:"IPO",desc:"Take the corporation public. Sell ~30% of shares for a massive cash injection. Permanent loss of full control.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["STRUCTURAL"],locked:!0,lockReason:"Coming soon"},{id:"bankruptcy",name:"Declare Bankruptcy",desc:"The CEO officially files for bankruptcy, ceasing all operations. Outstanding loans will be repaid up to 50% of the corporation's market valuation.",descRed:"This will dissolve your corporation. Loans will be paid back, and you will need to found a new corporation. There is a 24 tick cooldown on declaring bankruptcy.",cost:"IRREVERSIBLE",costColor:"#c55",tags:["IRREVERSIBLE"]}],CFO:[{id:"loan",name:"Request Loan",desc:"Submit a loan application to all finance corporations. Set amount, purpose, term, and collateral. Receive competing offers.",cost:"FREE",costColor:"#5cb85c",tags:["FINANCIAL"]}],COO:[{id:"restructure",name:"Restructure Operations",desc:"Lay off 10-20% of workforce, cut ~7% of debt. Reputation hit scales with COO skill — high skill minimizes damage.",cost:"FREE",costColor:"#5cb85c",tags:["OPERATIONAL"],cooldown:"once/tick"}],CTO:[{id:"research",name:"Begin Research",desc:"Start researching a tech tree node. Opens the tech tree interface.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["INNOVATION"],locked:!0,lockReason:"Coming soon"}],CMO:[{id:"rebrand",name:"Rebrand Corporation",desc:"Change name and abbreviation. Cost and reputation hit scale with CMO skill — high skill reduces both.",cost:"~$20M",costColor:"#ca5",tags:["STRUCTURAL"],cooldown:"once/tick"}],CLO:[{id:"sue_corp",name:"Sue Corporation",desc:"File a lawsuit against another corporation for patent infringement, contract breach, or predatory practices.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["LEGAL"],locked:!0,lockReason:"Coming soon"}],Lobbyist:[{id:"donate",name:"Political Donation",desc:"Donate $1M to a political party in the nation where your National HQ is located. The target party receives $100k in party funds. You cannot donate to your own party.",cost:"$1M",costColor:"#ca5",tags:["POLITICAL"],cooldown:"once/tick"}]};function eo(o){return 1.5-o/100}let Vi={};function Kr(o){const e=I?.current_tick||0;return Vi[o]===e}function ht(o){const e=I?.current_tick||0;Vi[o]=e}function Jr(){const o=document.getElementById("actions-right-panel");if(!o)return;const e=vo[xt],t=yo[e],n=Le(e),a=Gi[e]||[];if(!n){o.innerHTML=`<div style="padding:48px;text-align:center;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));">
            <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${t.color};margin-bottom:6px;">${b(e)}</div>
            <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-bottom:14px;">${b(t.fullTitle)}</div>
            <div style="font-size:16px;color:var(--text-muted);margin-bottom:20px;">This position is vacant. Hire an executive to unlock actions.</div>
            <div onclick="openExecSearch('${e}')" style="display:inline-block;padding:8px 24px;font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">EXECUTIVE SEARCH</div>
        </div>`;return}let i="";i+=`<div style="padding:14px 20px;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-bottom:none;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:56px;height:56px;background:${t.color}15;border:1px solid ${t.color}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:18px;font-weight:700;color:${t.color};">${b(ko(n.first_name,n.last_name))}</div>
            <div>
                <div style="display:flex;align-items:baseline;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:22px;font-weight:700;color:${t.color};">${b(e)}</span>
                    <span style="font-size:19px;font-weight:700;color:var(--text-bright,#f0efe6);">${b(n.first_name)} ${b(n.last_name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-top:2px;">${b(t.fullTitle)}</div>
            </div>
        </div>
        <div style="display:flex;gap:16px;align-items:center;">
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SKILL</div>
                <div style="display:flex;align-items:center;gap:5px;margin-top:2px;">
                    <div style="width:50px;height:4px;background:var(--border-0,rgba(255,255,255,0.06));">
                        <div style="width:${n.skill}%;height:100%;background:${_t(n.skill)};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${_t(n.skill)};">${n.skill}</span>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">SALARY</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${mt(n.salary_per_year)}/yr</div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.8px;">CONTRACT</div>
                <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-muted);margin-top:2px;">${n.contract_years}yr</div>
            </div>
            ${e!=="CEO"?`<div style="text-align:right;">
                <span onclick="event.stopPropagation();confirmFireExec('${n.id}','${b(e)}','${b(n.first_name+" "+n.last_name)}',${n.salary_per_year},${n.contract_end_tick||0})" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:5px 12px;color:#d9534f;border:1px solid rgba(217,83,79,0.25);background:rgba(217,83,79,0.06);cursor:pointer;">FIRE</span>
            </div>`:""}
        </div>
    </div>`,i+='<div style="background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:1px solid var(--border-0,rgba(255,255,255,0.06));flex:1;">';for(let r=0;r<a.length;r++){const s=a[r],l=!!s.locked;i+=`<div onmouseenter="this.dataset.hover='1';this.style.background='${l?"transparent":t.color+"06"}'" onmouseleave="this.dataset.hover='';this.style.background='transparent';var eb=this.querySelector('.act-exec-btn');if(eb)eb.style.display='none'" style="
            padding:16px 20px;
            ${r<a.length-1?"border-bottom:1px solid var(--border-0,rgba(255,255,255,0.06));":""}
            opacity:${l?"0.4":"1"};
            cursor:${l?"not-allowed":"pointer"};
        ">`,i+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;font-weight:700;color:${l?"var(--text-dim)":"var(--text-bright,#f0efe6)"};">${b(s.name)}</span>`;for(const d of s.tags)i+=`<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.3px;padding:2px 6px;line-height:14px;color:${d==="IRREVERSIBLE"?"#c55":d==="OFFENSIVE"?"#c84":d==="STRUCTURAL"?"#ca5":d==="POLITICAL"?"#8a6aaa":"var(--text-dim)"};background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));">${b(d)}</span>`;i+=`</div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${s.costColor};">${b(s.cost)}</span>
            </div>
        </div>`,i+=`<div style="font-size:14px;color:${l?"var(--text-dim)":"var(--text-muted,#666)"};line-height:1.6;">${b(s.desc)}</div>`,s.descRed&&(i+=`<div style="font-size:13px;color:#c55;line-height:1.6;margin-top:4px;">${b(s.descRed)}</div>`),l&&s.lockReason&&(i+=`<div style="margin-top:6px;font-family:var(--font-mono);font-size:11px;color:#c84;display:flex;align-items:center;gap:4px;">
                <span>&#8856;</span><span>${b(s.lockReason)}</span>
            </div>`),l||(i+=`<div class="act-exec-btn" style="display:none;margin-top:10px;text-align:right;">
                <span onclick="event.stopPropagation();actExecute('${s.id}','${e}')" style="display:inline-block;padding:6px 24px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${t.color};cursor:pointer;">EXECUTE</span>
            </div>`),i+="</div>"}i+="</div>",i+=`<div style="padding:8px 20px;background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:none;">
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">
            <span style="color:${t.color};font-weight:700;">${b(e)}</span> skill (${n.skill}/100) affects action outcomes.
            ${n.skill>=70?" High skill increases success probability and reduces costs.":n.skill>=50?" Moderate skill — outcomes are average. Consider recruiting a stronger executive.":" Low skill — actions are less effective and more expensive. Replacement recommended."}
        </div>
    </div>`,o.innerHTML=i,o.querySelectorAll("[onmouseenter]").forEach(r=>{r.addEventListener("mouseenter",function(){const s=this.querySelector(".act-exec-btn");s&&(s.style.display="block")}),r.addEventListener("mouseleave",function(){const s=this.querySelector(".act-exec-btn");s&&(s.style.display="none")})})}function Xr(o,e,t,n,a){const i=I?.current_tick||0,r=Math.max(0,a-i),s=Math.round(n*(r/12)),l=`FIRE ${e}: ${t}

Contract remaining: ${r} ticks
Payout (prorated): $${(s/1e6).toFixed(2)}M

This amount will be deducted from your cash reserves immediately.

Are you sure?`;confirm(l)&&Zr(o,e,s)}async function Zr(o,e,t){try{const n=Number(c?.corp_cash_reserves??0);if(n<t){alert(`Insufficient funds. You need $${(t/1e6).toFixed(2)}M but only have $${(n/1e6).toFixed(2)}M.`);return}const a=n-t,{error:i}=await y.from("factions").update({corp_cash_reserves:a}).eq("id",c.id);if(i){alert("Failed to process payout: "+i.message);return}const{error:r}=await y.from("corp_executives").update({status:"fired",updated_at:new Date().toISOString()}).eq("id",o);if(r){await y.from("factions").update({corp_cash_reserves:n}).eq("id",c.id),alert("Failed to fire executive: "+r.message);return}c.corp_cash_reserves=a,Ht=Ht.filter(s=>s.id!==o),zt()}catch(n){console.error("[CorpOps] Fire executive error:",n),alert("An error occurred.")}}function es(o,e){if((Gi[e]||[]).find(n=>n.id===o)?.cooldown==="once/tick"&&Kr(o)){alert("This action can only be used once per tick. Wait for the next tick.");return}switch(o){case"statement":return Wi();case"loan":return Ki();case"restructure":return Xi();case"rebrand":return Zi();case"donate":return ea();case"bankruptcy":return Yi()}}let Sn=!1;function Wi(){if(Sn)return;Sn=!0;const o=document.createElement("div");o.id="stmt-overlay",o.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",o.onclick=function(l){l.target===o&&Jn()};const e=c?.faction_name||"Corporation",t=(c?.abbreviation||c?.corp_ticker||"??").toUpperCase(),n=Number(c?.corp_cash_reserves??0),a=Le("CEO"),i=a?`${a.first_name} ${a.last_name}`:"CEO";o.innerHTML=`<div onclick="event.stopPropagation()" style="width:480px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${b(t)}</span>
                <span style="font-size:10px;color:var(--panel-text);">${b(e)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">&middot; ${b(i)}</span>
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
    </div>`,document.body.appendChild(o);const r=document.getElementById("stmt-text"),s=document.getElementById("stmt-chars");r&&s&&(r.addEventListener("input",function(){s.textContent=this.value.length+"/500"}),r.focus())}function Jn(){const o=document.getElementById("stmt-overlay");o&&o.remove(),Sn=!1}let Mt=!1;async function ts(){if(!c||!I||Mt)return;const o=document.getElementById("stmt-text"),e=document.getElementById("stmt-error"),t=(o?.value||"").trim();if(!t){e&&(e.textContent="Statement cannot be empty.",e.style.display="block");return}if(t.length>500){e&&(e.textContent="Statement too long (max 500 chars).",e.style.display="block");return}const n=Le("CEO"),a=n?n.skill:50,i=Math.round(2e4*eo(a)),r=Number(c.corp_cash_reserves??0);if(r<i){e&&(e.textContent="Insufficient cash. Need "+_(i)+".",e.style.display="block");return}Mt=!0;const s=document.getElementById("stmt-submit-btn");s&&(s.style.opacity="0.4",s.style.pointerEvents="none");const l=c.faction_name||"Corporation",d=n?`${n.first_name} ${n.last_name}`:"CEO",f=I.current_tick||0,{error:p}=await y.from("factions").update({corp_cash_reserves:r-i}).eq("id",c.id);if(p){Mt=!1,e&&(e.textContent="Failed to deduct cost: "+p.message,e.style.display="block"),s&&(s.style.opacity="1",s.style.pointerEvents="auto");return}const{error:u}=await y.from("event_log").insert({nation_id:c.nation_id,faction_id:c.id,event_name:l+" — Press Release",description_used:d+", CEO of "+l+': "'+t.replace(/[<>"]/g,"")+'"',category:"business",trigger_key:"ceo_statement",effects_applied:{cost:i,ceo:d,skill:a},fired_at_tick:f});if(u){await y.from("factions").update({corp_cash_reserves:r}).eq("id",c.id),Mt=!1,e&&(e.textContent="Failed to publish: "+u.message,e.style.display="block"),s&&(s.style.opacity="1",s.style.pointerEvents="auto");return}c.corp_cash_reserves=r-i,Mt=!1,ht("statement"),Jn()}const hi=24,os=.5;async function ns(o,e){const t=e-hi,{data:n}=await y.from("event_log").select("fired_at_tick, effects_applied").eq("trigger_key","corp_bankruptcy").gte("fired_at_tick",t).order("fired_at_tick",{ascending:!1}).limit(20),a=(n||[]).find(r=>r.effects_applied?.user_id===o),i=a?Math.max(0,a.fired_at_tick+hi-e):0;return{onCooldown:i>0,ticksLeft:i}}let nn=!1;async function Yi(){if(nn)return;const{data:{user:o}}=await y.auth.getUser();if(!o){alert("Not logged in.");return}const e=c?.id||sessionStorage.getItem("active_faction_id");if(!e){alert("No active faction selected.");return}const{data:t,error:n}=await y.from("factions").select("*").eq("id",e).eq("faction_type","corporation").is("abandoned_at",null).single();if(n||!t){alert("No active corporation found. It may have already been dissolved.");return}const a=t,i=a.faction_name||"this corporation",{data:r,error:s}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single();if(s||!r){alert("Failed to read game tick. Please try again.");return}const l=r.current_tick||0,{onCooldown:d,ticksLeft:f}=await ns(o.id,l);if(d){alert("Bankruptcy is on cooldown. You must wait "+f+" more tick"+(f!==1?"s":"")+" before declaring bankruptcy again.");return}if(!confirm("DECLARE BANKRUPTCY — "+i.toUpperCase()+`?

This will permanently:
• Dissolve the corporation
• Delete all properties, equipment, and inventory
• Pay back outstanding loans (up to 50% of market valuation)
• Remove all remaining cash reserves

You will need to found a new corporation.
There is a 24 tick cooldown on declaring bankruptcy.

This action CANNOT be undone.`))return;if(prompt('Type "BANKRUPT" to confirm bankruptcy of '+i+":")!=="BANKRUPT"){alert("Bankruptcy cancelled.");return}nn=!0;try{async function u(T){const{error:j}=await T;if(j)throw j}const m=Number(a.corp_cash_reserves)||0,{data:v}=await y.from("corp_properties").select("purchase_price, condition, nation_id, type").eq("faction_id",e),x=Oa(v),{data:g}=await y.from("corp_vessels").select("purchase_price, condition, built_at_tick, status").eq("faction_id",e),{data:h}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),w=h?.current_tick||0,k=Number(a.corp_loans)||0,S=qn({cash:m,propertyValue:x,loans:k,vessels:g,currentTick:w}),z=Math.max(0,Math.round(S*os)),{data:$}=await y.from("finance_active_loans").select("*").eq("borrower_faction_id",e).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!0});let C=0;for(const T of $||[]){const j=T.principal-T.total_paid;if(j<=0)continue;const P=Math.min(j,z-C);if(P<=0)break;const{data:F}=await y.from("factions").select("corp_cash_reserves").eq("id",T.lender_faction_id).single();F&&await u(y.from("factions").update({corp_cash_reserves:(Number(F.corp_cash_reserves)||0)+P}).eq("id",T.lender_faction_id)),await u(y.from("finance_active_loans").update({status:"repaid",total_paid:T.total_paid+P,completed_tick:l}).eq("id",T.id)),C+=P}const A=a.nation_id||null,E=[...new Set((v||[]).filter(T=>T.type==="regional_hq").map(T=>T.nation_id).filter(T=>T&&T!==A))],N=[];async function q(T,j){const{data:P}=await y.from("nations").select("gdp_growth").eq("id",T).single();if(!P)return;const F=Number(P.gdp_growth??50),K=Math.round(Math.max(0,Math.min(100,F+j))*10)/10;await u(y.from("nations").update({gdp_growth:K}).eq("id",T)),N.push({nation_id:T,delta:j,before:F,after:K})}A&&await q(A,-.2);for(const T of E)await q(T,-.1);await u(y.from("contract_bids").delete().eq("faction_id",e)),await u(y.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",e).in("status",["open","bidding"])),await u(y.from("corp_equipment_deliveries").delete().eq("faction_id",e)),await u(y.from("corp_equipment").delete().eq("faction_id",e)),await u(y.from("corp_properties").delete().eq("faction_id",e)),await y.from("corp_material_inventory").delete().eq("faction_id",e),await y.from("corp_warehouse").delete().eq("faction_id",e),await y.from("corp_executives").delete().eq("faction_id",e),await y.from("faction_agitators").delete().eq("faction_id",e),await u(y.from("factions").delete().eq("id",e));const U=C>0?" $"+C.toLocaleString()+" was repaid to creditors.":"";await u(y.from("event_log").insert({nation_id:a.nation_id,faction_id:e,event_name:i+" — Bankruptcy",description_used:i+" has officially filed for bankruptcy. It has laid off its executive staff and ceased operations."+U,category:"business",trigger_key:"corp_bankruptcy",effects_applied:{corp_name:i,sector:a.corp_sector,user_id:o.id,loan_payback:C,valuation:S,gdp_penalties:N},fired_at_tick:l})),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:Q}=await y.from("factions").select("id, faction_type").or(`id.eq.${o.id},linked_user_id.eq.${o.id}`),H=(Q||[]).find(T=>T.faction_type==="party"),oe=(Q||[]).find(T=>T.faction_type==="corporation"),B=C>0?`
$`+C.toLocaleString()+" repaid to creditors.":"";H?(sessionStorage.setItem("active_faction_id",H.id),alert(i+" has declared bankruptcy."+B+`

Redirecting to your political party.`),window.location.href="dashboard.html"):oe?(sessionStorage.setItem("active_faction_id",oe.id),alert(i+" has declared bankruptcy."+B+`

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(i+" has declared bankruptcy."+B+`

You have no remaining factions.`),window.location.href="faction-select.html")}catch(u){alert("Bankruptcy failed: "+(u.message||u)+`

Please try again or contact support.`)}finally{nn=!1}}const Qi=[{id:"equipment",label:"Equipment Acquisition",desc:"Purchase vehicles, cranes, or heavy machinery",icon:"&#9881;"},{id:"working",label:"Working Capital",desc:"Bridge financing for active project costs",icon:"$"},{id:"property",label:"Property Purchase",desc:"Acquire office, warehouse, or HQ building",icon:"&#9632;"},{id:"subsidiary",label:"Subsidiary Expansion",desc:"Fund new subsidiary establishment",icon:"&#9672;"},{id:"materials",label:"Material Procurement",desc:"Bulk material purchase for upcoming projects",icon:"&#9638;"}],an=[{id:"none",label:"None",desc:"Unsecured — lenders may charge higher rates",risk:"HIGH",riskColor:"#c84"},{id:"equipment",label:"Equipment",desc:"Financed equipment serves as collateral",risk:"MODERATE",riskColor:"#ca5"},{id:"property",label:"Property",desc:"Corporate property lien",risk:"LOW",riskColor:"#8b9a6b"},{id:"full",label:"Full Assets",desc:"All corporate assets — maximum lender security",risk:"MINIMAL",riskColor:"#5c5"}];let ne=25e7,Yt="equipment",$t=48,fe="equipment",Eo="",Rt=[];function Ki(){ne=25e7,Yt="equipment",$t=48,fe="equipment",Eo="",document.getElementById("lr-overlay").style.display="flex",ls(),Nt()}function Ji(){document.getElementById("lr-overlay").style.display="none"}function is(o){ne=Math.max(1e6,Math.min(5e9,Number(o)||0)),Nt()}function as(o){Yt=o,Nt()}function rs(o){$t=o,Nt()}function ss(o){fe=o,Nt()}async function ls(){if(!c)return;const{data:o}=await y.from("factions").select("id, faction_name, abbreviation, corp_ticker, corp_company_type").eq("faction_type","corporation").eq("corp_sector","Finance").is("abandoned_at",null).neq("id",c.id);Rt=o||[],Nt()}function Nt(){const o=document.getElementById("lr-modal-content");if(!o)return;const e=Number(c?.corp_cash_reserves??0),t=Number(c?.corp_loans??0),n=Number(c?.corp_reputation??50),a=c?.faction_name||"Corporation",i=(c?.abbreviation||c?.corp_ticker||"??").toUpperCase(),r=t+ne,s=r>e*3?"#c55":r>e*1.5?"#c84":r>e?"#ca5":"#5c5",l=r>e*3?"DANGEROUS":r>e*1.5?"HEAVY":r>e?"MODERATE":"HEALTHY",d=fe==="none"?"10-16%":fe==="equipment"?"7-12%":fe==="property"?"5-9%":"4-7%",p=Math.round(ne*(fe==="none"?.13:fe==="equipment"?.095:fe==="property"?.07:.055)/12+ne/$t),u=an.find(v=>v.id===fe)||an[0];let m="";m+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:8px;color:#5a8aaa;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Request Loan</span>
            </div>
            <span onclick="lrClose()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">From:</span>
            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${b(i)}</span>
            <span style="font-size:10px;color:var(--panel-text);">${b(a)}</span>
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
            <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#5a8aaa;">${_(ne)}</span>
        </div>
        <input type="range" min="1000000" max="5000000000" step="10000000" value="${ne}" oninput="lrSetAmount(this.value)" style="width:100%;height:4px;accent-color:#5a8aaa;" />
        <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;"><span>$1M</span><span>$5B</span></div>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">PURPOSE</div>
        <div style="display:flex;flex-direction:column;gap:3px;">`;for(const v of Qi){const x=Yt===v.id;m+=`<div onclick="lrSetPurpose('${v.id}')" style="display:flex;align-items:center;gap:8px;padding:5px 10px;cursor:pointer;background:${x?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${x?"#5a8aaa44":"var(--panel-border)"};border-left:2px solid ${x?"#5a8aaa":"transparent"};">
            <span style="font-family:var(--font-mono);font-size:10px;color:${x?"#5a8aaa":"#6a6660"};width:14px;text-align:center;">${v.icon}</span>
            <div><div style="font-size:11px;font-weight:600;color:${x?"var(--panel-text)":"#9e9a92"};">${v.label}</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${v.desc}</div></div>
        </div>`}m+="</div></div>",m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">PREFERRED TERM</span>
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--panel-text);">${$t} months</span>
        </div>
        <div style="display:flex;gap:3px;">`;for(const v of[12,24,36,48,60,84,120]){const x=$t===v;m+=`<span onclick="lrSetTerm(${v})" style="flex:1;text-align:center;padding:4px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;color:${x?"#000":"#6a6660"};background:${x?"#5a8aaa":"transparent"};border:1px solid ${x?"#5a8aaa":"var(--panel-border)"};">${v}</span>`}m+='</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Lenders may offer different terms. This is your preference, not a guarantee.</div></div>',m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">COLLATERAL OFFERED</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">`;for(const v of an){const x=fe===v.id;m+=`<div onclick="lrSetCollateral('${v.id}')" style="padding:6px 8px;cursor:pointer;background:${x?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${x?"#5a8aaa44":"var(--panel-border)"};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${x?"#5a8aaa":"#6a6660"};">${v.label}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:${v.riskColor};">${v.risk} RISK</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${v.desc}</div>
        </div>`}if(m+="</div></div>",m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">NOTE TO LENDERS (OPTIONAL)</div>
        <textarea id="lr-note" rows="2" maxlength="300" onchange="lrNote=this.value"
            placeholder="e.g., Expanding into Heavy Infrastructure. Equipment purchase will generate $12M+ in annual contract revenue."
            style="width:100%;padding:6px 8px;font-family:var(--font-ui);font-size:10px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;resize:none;box-sizing:border-box;line-height:1.5;">${b(Eo)}</textarea>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">Debt Impact Preview</div>
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:6px 10px;">
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CURRENT DEBT</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${_(t)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">+ THIS LOAN</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#5a8aaa;">+${_(ne)}</span>
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
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">This request will be sent to</div>`,Rt.length>0){m+='<div style="display:flex;flex-direction:column;gap:3px;">';for(const v of Rt){const x=(v.corp_company_type||"").toLowerCase()==="state"?"#c84":(v.corp_company_type||"").toLowerCase()==="public"?"#5c5":"#c8a832";m+=`<div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:var(--bg-panel);border:1px solid var(--panel-border);">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c8a832;">${b((v.abbreviation||v.corp_ticker||"??").toUpperCase())}</span>
                <span style="font-size:10px;color:var(--panel-text);flex:1;">${b(v.faction_name)}</span>
                ${v.corp_company_type?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:0 4px;line-height:12px;color:${x};background:${x}12;border:1px solid ${x}25;">${b(v.corp_company_type.toUpperCase())}</span>`:""}
            </div>`}m+="</div>"}else m+='<div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;text-align:center;padding:8px 0;">No finance corporations in this nation yet.</div>';m+='<div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">All finance corporations in your nation will see this request. You choose which offer to accept.</div></div>',m+=`<div style="padding:8px 16px;">
        <div style="padding:6px 10px;background:rgba(90,138,170,0.04);border:1px solid rgba(90,138,170,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#5a8aaa;letter-spacing:0.8px;margin-bottom:4px;">ESTIMATED MARKET TERMS</div>
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. RATE RANGE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--panel-text);">${d}</div></div>
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. MONTHLY PAYMENT</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--panel-text);">~${_(p)}</div></div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Estimates based on collateral offer and current market rates. Actual terms set by each lender.</div>
        </div>
    </div>`,m+="</div>",m+=`<div style="padding:10px 16px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:12px;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">REQUESTING</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5a8aaa;">${_(ne)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">COLLATERAL</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--panel-text);">${u.label}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">SENT TO</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#9e9a92;">${Rt.length} lender${Rt.length!==1?"s":""}</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="lrClose()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="lr-submit-btn" onclick="lrSubmit()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">SUBMIT REQUEST</div>
        </div>
    </div>`,m+='<div id="lr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>',o.innerHTML=m}let lo=!1;async function ds(){if(!c||!I||lo)return;const o=document.getElementById("lr-error");if(ne<1e6){o.textContent="Minimum loan amount is $1M.",o.style.display="block";return}if(ne>5e9){o.textContent="Maximum loan amount is $5B.",o.style.display="block";return}const t=((Qi.find(r=>r.id===Yt)||{}).label||Yt)+(Eo?" — "+Eo:""),n=document.getElementById("lr-submit-btn");lo=!0,n.style.opacity="0.5",n.style.pointerEvents="none";const a=I.current_tick||0,{error:i}=await y.from("finance_loan_requests").insert({requesting_faction_id:c.id,nation_id:c.nation_id,amount:ne,term_months:$t,purpose:t,created_tick:a,expires_tick:a+5});if(n.style.opacity="1",n.style.pointerEvents="auto",i){lo=!1,o.textContent="Failed to submit: "+i.message,o.style.display="block",n.style.opacity="1",n.style.pointerEvents="auto";return}lo=!1,Ji()}function Xi(){if(!c)return;const o=Number(c.corp_loans??0),e=Number(c.corp_reputation??50),t=Number(c.corp_general_workforce??0),n=Number(c.corp_skilled_workforce??0),a=Number(c.corp_innovative_workforce??0),i=t+n+a;if(i===0){alert("Cannot restructure — no employees to lay off.");return}const r=Le("COO"),s=r?r.skill:50,l=eo(s),d=10+Math.floor(Math.random()*11),f=Math.round(i*d/100),p=Math.round(o*.07),u=Math.round(p*(2-l)),m=3+Math.floor(Math.random()*10),v=Math.max(1,Math.round(m*l)),x=Math.round(t/i*f),g=Math.round(n/i*f),h=Math.max(0,Math.min(a,f-x-g)),w=document.createElement("div");w.id="restr-overlay",w.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",w.onclick=function(k){k.target===w&&Xn()},w.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${f} employees (${d}%)</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">General: ${t} &rarr; ${t-x}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${x}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Skilled: ${n} &rarr; ${n-g}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${g}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">Innovative: ${a} &rarr; ${a-h}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">-${h}</span>
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
            <div id="restr-btn" onclick="actSubmitRestructure(${d},${u},${v},${x},${g},${h})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#8b9a6b;cursor:pointer;">RESTRUCTURE</div>
        </div>
        <div id="restr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(w)}function Xn(){const o=document.getElementById("restr-overlay");o&&o.remove()}let co=!1;async function cs(o,e,t,n,a,i){if(!c||!I||co)return;co=!0;const r=document.getElementById("restr-btn");r&&(r.style.opacity="0.4",r.style.pointerEvents="none");const s=Number(c.corp_general_workforce??0),l=Number(c.corp_skilled_workforce??0),d=Number(c.corp_innovative_workforce??0),f=Number(c.corp_loans??0),p=Number(c.corp_reputation??50),u={corp_general_workforce:Math.max(0,s-n),corp_skilled_workforce:Math.max(0,l-a),corp_innovative_workforce:Math.max(0,d-i),corp_loans:Math.max(0,f-e),corp_reputation:Math.max(0,p-t)},{error:m}=await y.from("factions").update(u).eq("id",c.id);if(m){co=!1;const g=document.getElementById("restr-error");g&&(g.textContent="Failed: "+m.message,g.style.display="block"),r&&(r.style.opacity="1",r.style.pointerEvents="auto");return}Object.assign(c,u);const v=I.current_tick||0,{error:x}=await y.from("event_log").insert({nation_id:c.nation_id,faction_id:c.id,event_name:(c.faction_name||"Corporation")+" — Restructuring",description_used:(c.faction_name||"A corporation")+" has announced a restructuring, laying off "+o+"% of its workforce.",category:"business",trigger_key:"corp_restructure",effects_applied:{layoff_pct:o,debt_cut:e,rep_loss:t},fired_at_tick:v});x&&console.warn("Failed to log restructure event:",x.message),co=!1,ht("restructure"),Xn(),zt()}function Zi(){const o=Le("CMO"),e=o?o.skill:50,t=eo(e),n=Math.round(2e7*t),a=Math.max(1,Math.round(5*t)),i=Number(c?.corp_cash_reserves??0),r=Number(c?.corp_reputation??50),s=c?.faction_name||"",l=c?.abbreviation||c?.corp_ticker||"",d=document.createElement("div");d.id="rebrand-overlay",d.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",d.onclick=function(f){f.target===d&&Zn()},d.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
            <input id="rebrand-name" type="text" maxlength="40" value="${b(s)}" placeholder="Corporation name"
                style="width:100%;padding:6px 10px;font-family:var(--font-ui);font-size:12px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;box-sizing:border-box;" />
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-top:10px;margin-bottom:6px;">NEW ABBREVIATION / TICKER</div>
            <input id="rebrand-abbr" type="text" maxlength="5" value="${b(l)}" placeholder="e.g. SZC" style="width:100px;padding:6px 10px;font-family:var(--font-mono);font-size:12px;font-weight:700;color:#c8a832;background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;text-transform:uppercase;" />
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
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">-${a} (${r} &rarr; ${Math.max(0,r-a)})</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">SKILL MODIFIER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${t<=1?"#5cb85c":"#c84"};">&times;${t.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:3px 0;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CASH AFTER</span>
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${i<n?"#c55":"var(--panel-text)"};">${_(i-n)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 16px;border-top:1px solid var(--panel-border);display:flex;justify-content:flex-end;gap:6px;">
            <div onclick="actCloseRebrand()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="rebrand-btn" onclick="actSubmitRebrand(${n},${a})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#c84;cursor:${i>=n?"pointer":"not-allowed"};${i<n?"opacity:0.4;pointer-events:none;":""}">REBRAND</div>
        </div>
        <div id="rebrand-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(d)}function Zn(){const o=document.getElementById("rebrand-overlay");o&&o.remove()}let po=!1;async function ps(o,e){if(!c||!I||po)return;const t=o||2e7,n=e||5,a=document.getElementById("rebrand-error"),i=(document.getElementById("rebrand-name")?.value||"").trim().replace(/[<>"]/g,""),r=(document.getElementById("rebrand-abbr")?.value||"").trim().toUpperCase().replace(/[<>"]/g,"");if(!i||i.length<2){a&&(a.textContent="Name must be at least 2 characters.",a.style.display="block");return}if(!r||r.length<2||r.length>5){a&&(a.textContent="Abbreviation must be 2-5 characters.",a.style.display="block");return}const s=Number(c.corp_cash_reserves??0);if(s<t){a&&(a.textContent="Insufficient cash. Need "+_(t)+".",a.style.display="block");return}po=!0;const l=document.getElementById("rebrand-btn");l&&(l.style.opacity="0.4",l.style.pointerEvents="none");const d=Number(c.corp_reputation??50),f=c.faction_name||"Corporation",{error:p}=await y.from("factions").update({faction_name:i,abbreviation:r,corp_ticker:r,corp_cash_reserves:s-t,corp_reputation:Math.max(0,d-n)}).eq("id",c.id);if(p){po=!1,a&&(a.textContent="Failed: "+p.message,a.style.display="block"),l&&(l.style.opacity="1",l.style.pointerEvents="auto");return}c.faction_name=i,c.abbreviation=r,c.corp_ticker=r,c.corp_cash_reserves=s-t,c.corp_reputation=Math.max(0,d-n);const u=I.current_tick||0,{error:m}=await y.from("event_log").insert({nation_id:c.nation_id,faction_id:c.id,event_name:"Corporation Rebranded",description_used:f+" has rebranded to "+i+" ("+r+"). The rebrand costs $20M and reputation takes a temporary hit.",category:"corporate",trigger_key:"corp_rebrand",effects_applied:{old_name:f,new_name:i,new_abbr:r,rep_loss:n,cost:t},fired_at_tick:u});m&&console.warn("Failed to log rebrand event:",m.message),po=!1,ht("rebrand"),Zn(),zt(),document.getElementById("corp-name-bar").textContent=i;const v=document.getElementById("corp-logo");v&&(v.textContent=r.slice(0,2))}const fs={liberty:"#9C27B0",equality:"#E91E63",freedom:"#5b9bd5",security:"#d48a3c",individualism:"#eab308",collectivism:"#ec4899",tradition:"#795548",progress:"#00BCD4",nationalism:"#FF5722",globalism:"#3F51B5"};function dt(o){return fs[(o||"").toLowerCase()]||"#9C27B0"}let Ye=[],Ie=-1;async function ea(){Number(c?.corp_cash_reserves??0);const o=[c.nation_id],e=new Set(ke.map(a=>a.id)),{data:t}=await y.from("factions").select("id, faction_name, abbreviation, party_color, party_funds, seats, momentum, nation, nation_id, leader_ideology, linked_user_id, ideology_value_1, ideology_value_2").eq("faction_type","party").in("nation_id",o).is("abandoned_at",null).order("seats",{ascending:!1});Ye=(t||[]).filter(a=>!e.has(a.id)).map(a=>({...a})),Ie=-1;const n=document.createElement("div");n.id="donate-overlay",n.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",n.onclick=function(a){a.target===n&&ei()},document.body.appendChild(n),ta()}function ei(){const o=document.getElementById("donate-overlay");o&&o.remove(),Ye=[],Ie=-1}function ms(o){Ie=o,ta()}function ta(){const o=document.getElementById("donate-overlay");if(!o)return;const e=Le("Lobbyist"),t=e?e.skill:50,n=Math.round(1e6*eo(t)),a=1e5,i=Number(c?.corp_cash_reserves??0),r=Ie>=0?Ye[Ie]:null,s=i>=n;let l='<div onclick="event.stopPropagation()" style="width:540px;max-height:80vh;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">';l+=`<div style="padding:14px 20px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
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
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#5cb85c;">+${_(a)}</span>
        </div>
        <div style="font-family:var(--font-mono);font-size:10px;color:#6a6660;margin-top:4px;">Parties in the nation where your National HQ is located. You cannot donate to your own party.</div>
    </div>`,l+='<div style="flex:1;overflow-y:auto;padding:10px 0;">',l+='<div style="padding:0 20px 8px;font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Select a Party</div>',Ye.length===0&&(l+='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#6a6660;">No eligible parties found.</div>');for(let d=0;d<Ye.length;d++){const f=Ye[d],p=Ie===d,u=f.party_color||"#8a6aaa",m=(f.momentum||0)>0?"var(--panel-text)":"#c55";l+=`<div onclick="donateSelectParty(${d})" style="
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
                            <span style="font-size:14px;font-weight:600;color:${p?"var(--panel-text)":"#9e9a92"};">${b(f.faction_name)}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">${b(f.abbreviation||"??")} &middot; ${b(f.nation||"")} &middot; ${f.seats||0} seats</span>
                            ${f.ideology_value_1?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${dt(f.ideology_value_1)};background:${dt(f.ideology_value_1)}12;border:1px solid ${dt(f.ideology_value_1)}30;">${b(f.ideology_value_1.toUpperCase())}</span>`:""}
                            ${f.ideology_value_2?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${dt(f.ideology_value_2)};background:${dt(f.ideology_value_2)}12;border:1px solid ${dt(f.ideology_value_2)}30;">${b(f.ideology_value_2.toUpperCase())}</span>`:""}
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
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CASH</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${s?"var(--panel-text)":"#c55"};">${_(i)}</div></div>
            ${r?`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">RECIPIENT</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--panel-text);">${b(r.abbreviation||r.faction_name)}</div></div>`:""}
        </div>
        <div style="display:flex;gap:8px;">
            <div onclick="actCloseDonation()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="donate-btn" onclick="actSubmitDonation()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${r&&s?"#000":"#6a6660"};background:${r&&s?"#8a6aaa":"var(--panel-border)"};cursor:${r&&s?"pointer":"not-allowed"};${!r||!s?"opacity:0.4;pointer-events:none;":""}">DONATE</div>
        </div>
    </div>`,l+='<div id="donate-error" style="padding:6px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',l+="</div>",o.innerHTML=l}let ct=!1;async function us(){if(!c||!I||Ie<0||ct)return;const o=Ye[Ie];if(!o)return;const e=Number(I?.current_tick||0);if(new Set(ke.map($=>$.id)).has(o.id)){const $=document.getElementById("donate-error");$&&($.textContent="You cannot donate to your own party.",$.style.display="block");return}const n=Le("Lobbyist"),a=n?n.skill:50,i=Math.round(1e6*eo(a)),r=1e5,s=2,{data:l,error:d}=await y.from("factions").select("corp_cash_reserves, last_donation_tick").eq("id",c.id).single();if(d||!l){const $=document.getElementById("donate-error");$&&($.textContent="Failed to verify cooldown: "+(d?.message||"unknown"),$.style.display="block");return}const f=Number(l.last_donation_tick??0);if(f===e){const $=document.getElementById("donate-error");$&&($.textContent="Political Donation is on cooldown until next tick.",$.style.display="block"),ht("donate");return}const p=Number(l.corp_cash_reserves??0);if(p<i){const $=document.getElementById("donate-error");$&&($.textContent="Insufficient cash. Need "+_(i)+", have "+_(p)+".",$.style.display="block");return}ct=!0;const u=document.getElementById("donate-btn");u&&(u.style.opacity="0.4",u.style.pointerEvents="none");const m=Number(c.corp_reputation??50),v=Math.max(0,m-s),{data:x,error:g}=await y.from("factions").update({corp_cash_reserves:p-i,corp_reputation:v,last_donation_tick:e}).eq("id",c.id).eq("last_donation_tick",f).select("id");if(g){const $=document.getElementById("donate-error");ct=!1,$&&($.textContent="Failed: "+g.message,$.style.display="block"),u&&(u.style.opacity="1",u.style.pointerEvents="auto");return}if(!x||x.length===0){const $=document.getElementById("donate-error");ct=!1,$&&($.textContent="Political Donation is on cooldown until next tick.",$.style.display="block"),u&&(u.style.opacity="1",u.style.pointerEvents="auto"),ht("donate");return}const{data:h}=await y.from("factions").select("party_funds").eq("id",o.id).single(),w=Number(h?.party_funds??0),{error:k}=await y.from("factions").update({party_funds:w+r}).eq("id",o.id);if(k){await y.from("factions").update({corp_cash_reserves:p}).eq("id",c.id);const $=document.getElementById("donate-error");ct=!1,$&&($.textContent="Failed to transfer funds: "+k.message,$.style.display="block"),u&&(u.style.opacity="1",u.style.pointerEvents="auto");return}c.corp_cash_reserves=p-i,c.corp_reputation=v;const S=c.faction_name||"Corporation",{error:z}=await y.from("event_log").insert({nation_id:o.nation_id||c.nation_id,faction_id:c.id,event_name:S+" — Political Donation",description_chosen:S+" has donated "+_(i)+" to "+(o.faction_name||"a political party")+". The party receives "+_(r)+" in campaign funds. Corporate reputation decreases by "+s+".",category:"business",trigger_key:"corp_donation",effects_applied:{cost:i,recipient_faction_id:o.id,recipient_name:o.faction_name,funds_granted:r,reputation_loss:s,skill:a},fired_at_tick:e});z&&console.warn("Failed to log donation event:",z.message),ct=!1,ht("donate"),ei()}function vs(o){xt=o,zt()}async function ys(o){if(Ee=o,ze=-1,document.getElementById("exec-search-overlay").style.display="flex",Gt.length===0&&c?.nation_id){const{data:e}=await y.from("executive_pool").select("id").eq("nation_id",c.nation_id).limit(1);if(!e||e.length===0){const n=c.nation||"",a=Fa(c.nation_id,n),{error:i}=await y.from("executive_pool").insert(a);i&&console.warn("Failed to generate executive pool:",i.message)}const{data:t}=await y.from("executive_pool").select("*").eq("nation_id",c.nation_id).eq("status","available").order("skill",{ascending:!1});Gt=t||[]}ia()}function oa(){document.getElementById("exec-search-overlay").style.display="none",Ee=null,ze=-1}function na(o){return Gt.filter(e=>e.status==="available"&&Array.isArray(e.specializations)&&e.specializations.includes(o)).sort((e,t)=>t.skill-e.skill)}function gs(o){ze=o,ia()}let fo=!1;async function xs(){if(!c||!I||!Ee||ze<0||fo)return;const e=na(Ee)[ze];if(!e)return;fo=!0;const t=I.current_tick||0,n=document.getElementById("es-hire-btn");n&&(n.style.opacity="0.4",n.style.pointerEvents="none");const{error:a}=await y.from("corp_executives").insert({faction_id:c.id,role:Ee,first_name:e.first_name,last_name:e.last_name,age:e.age,origin_nation:e.origin_nation,skill:e.skill,salary_per_year:e.required_salary,contract_years:e.required_years,contract_start_tick:t,contract_end_tick:t+e.required_years*12,status:"active"});if(a){fo=!1;const r=document.getElementById("es-error");r&&(r.textContent="Failed: "+a.message,r.style.display="block"),n&&(n.style.opacity="1",n.style.pointerEvents="auto");return}const{error:i}=await y.from("executive_pool").update({status:"hired",hired_by_faction_id:c.id}).eq("id",e.id);i&&console.warn("Failed to mark pool candidate as hired:",i.message),fo=!1,oa(),await Hi(),xt=vo.indexOf(Ee),xt<0&&(xt=0),zt()}function ia(){const o=document.getElementById("exec-search-content");if(!o||!Ee)return;const e=Ee,t=yo[e],n=na(e),a=ze>=0?n[ze]:null;let i="";i+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
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
    </div>`,i+='<div style="display:flex;flex:1;min-height:0;overflow:hidden;">',i+='<div style="width:300px;border-right:1px solid var(--panel-border);overflow-y:auto;flex-shrink:0;">',n.length===0&&(i+=`<div style="padding:30px 20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No candidates available for this role in your nation.</div>
        </div>`);for(let r=0;r<n.length;r++){const s=n[r],l=ze===r,d=_t(s.skill);i+=`<div onclick="esSelectCandidate(${r})" style="
            padding:10px 14px;
            border-bottom:1px solid var(--panel-border);
            border-left:3px solid ${l?t.color:"transparent"};
            background:${l?t.color+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:${t.color}10;border:1px solid ${t.color}22;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${t.color};flex-shrink:0;">${b(ko(s.first_name,s.last_name))}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;color:${l?"var(--text-bright,#f0efe6)":"#9e9a92"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(s.first_name)} ${b(s.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:4px;flex:1;">
                            <div style="flex:1;height:3px;background:var(--panel-border);">
                                <div style="width:${s.skill}%;height:100%;background:${d};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:${d};width:18px;text-align:right;">${s.skill}</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${mt(s.required_salary)}/yr</span>
                    </div>
                </div>
            </div>
        </div>`}if(i+="</div>",i+='<div style="flex:1;overflow-y:auto;">',!a)i+=`<div style="padding:50px 24px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:14px;color:var(--text-dim);margin-bottom:10px;">Select a candidate</div>
            <div style="font-size:12px;color:#6a6660;">${n.length} candidate${n.length!==1?"s":""} available for ${b(e)}</div>
        </div>`;else{const r=a.required_salary*a.required_years,s=_t(a.skill);i+=`<div style="padding:20px;border-bottom:1px solid var(--panel-border);">
            <div style="display:flex;align-items:center;gap:14px;">
                <div style="width:64px;height:64px;background:${t.color}12;border:1px solid ${t.color}28;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:20px;font-weight:700;color:${t.color};">${b(ko(a.first_name,a.last_name))}</div>
                <div>
                    <div style="font-size:20px;font-weight:700;color:var(--text-bright,#f0efe6);">${b(a.first_name)} ${b(a.last_name)}</div>
                    <div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;margin-top:3px;">${b(a.origin_nation)} &middot; Age ${a.age}</div>
                </div>
            </div>
        </div>`,i+=`<div style="display:flex;gap:0;border-bottom:1px solid var(--panel-border);">
            <div style="flex:1;padding:12px 14px;text-align:center;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">SKILL</div>
                <div style="display:flex;align-items:center;justify-content:center;gap:5px;margin-top:5px;">
                    <div style="width:60px;height:4px;background:var(--panel-border);">
                        <div style="width:${a.skill}%;height:100%;background:${s};"></div>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${s};">${a.skill}</span>
                </div>
            </div>
            <div style="flex:1;padding:12px 14px;text-align:center;border-right:1px solid var(--panel-border);">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">AGE</div>
                <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${a.age}</div>
            </div>
            <div style="flex:1;padding:12px 14px;text-align:center;">
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.5px;">ORIGIN</div>
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--text-bright,#f0efe6);margin-top:5px;">${b(a.origin_nation)}</div>
            </div>
        </div>`,i+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Role Specializations</div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">`;for(const f of a.specializations||[]){const p=yo[f],u=f===e;i+=`<span style="font-family:var(--font-mono);font-size:10px;font-weight:700;padding:3px 10px;color:${u?"#000":p?.color||"#9e9a92"};background:${u?p?.color||"#5a8aaa":(p?.color||"#5a8aaa")+"10"};border:1px solid ${u?"transparent":(p?.color||"#5a8aaa")+"30"};">${b(f)}</span>`}i+="</div></div>",i+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);">
            <div style="font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:8px;">Contract Terms</div>
            <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:10px 14px;">
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">CONTRACT LENGTH</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright,#f0efe6);">${a.required_years} years</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
                    <span style="font-family:var(--font-mono);font-size:10px;color:#6a6660;">ANNUAL SALARY</span>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:#c84;">${mt(a.required_salary)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;padding:4px 0;">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright,#f0efe6);">TOTAL CONTRACT VALUE</span>
                    <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${mt(r)}</span>
                </div>
            </div>
            <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;margin-top:5px;">Salary is deducted from cash reserves each tick as an operating expense.</div>
        </div>`;const l=a.skill>=80?"EXCEPTIONAL":a.skill>=65?"STRONG":a.skill>=50?"COMPETENT":a.skill>=35?"DEVELOPING":"WEAK",d=a.skill>=80?"Elite talent. Actions have high success rate and reduced costs.":a.skill>=65?"Strong performer. Reliable outcomes across most actions.":a.skill>=50?"Adequate for the role. Outcomes are average.":a.skill>=35?"Below average. Actions may fail or cost more. Consider alternatives.":"Poor fit. High failure rates. Replacement recommended.";i+=`<div style="padding:12px 20px;">
            <div style="padding:8px 12px;background:${s}08;border:1px solid ${s}18;">
                <div style="font-family:var(--font-mono);font-size:10px;color:${s};letter-spacing:0.8px;margin-bottom:3px;">${l}</div>
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${d}</div>
            </div>
        </div>`}i+="</div>",i+="</div>",i+=`<div style="padding:12px 20px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:14px;">`,a?i+=`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CANDIDATE</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--text-bright,#f0efe6);">${b(a.first_name)} ${b(a.last_name)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SKILL</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${_t(a.skill)};">${a.skill}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SALARY</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:#c84;">${mt(a.required_salary)}/yr</div></div>`:i+='<div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Select a candidate to hire</div>',i+=`</div>
        <div style="display:flex;gap:8px;">
            <div onclick="closeExecSearch()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="es-hire-btn" onclick="esHireCandidate()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${a?"#000":"#6a6660"};background:${a?t.color:"var(--panel-border)"};cursor:${a?"pointer":"not-allowed"};${a?"":"opacity:0.4;pointer-events:none;"}">HIRE</div>
        </div>
    </div>`,i+='<div id="es-error" style="padding:5px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',o.innerHTML=i}function Lo(){return G.reduce((e,t)=>{const n=Number(t.capacity||0),a=Number(t.condition||0)/100;return e+Math.floor(n*a)},0)+500}function bs(o,e){const t=et.find(i=>i.id===o),n=Number(c?.[t.factionKey]??0),a=ae[o]+e;if(!(n+a<0)){if(e>0){const i=et.reduce((s,l)=>{const d=Number(c?.[l.factionKey]??0),f=l.id===o?a:ae[l.id];return s+d+f},0),r=Lo();if(i>r)return}ae[o]=a,Oo()}}function _s(o){o?ae[o]=0:ae={general:0,skilled:0,innovative:0},Oo()}async function hs(){if(on||!Object.values(ae).some(r=>r!==0))return;let e=0;for(const r of et){const s=ae[r.id];s>0&&(e+=s*Di(r.multiplier)*.1)}const t=Number(c?.corp_cash_reserves??0);if(e>t){alert("Insufficient cash reserves. Hiring cost: "+_(e)+", available: "+_(t));return}const n=et.reduce((r,s)=>r+Number(c?.[s.factionKey]??0)+ae[s.id],0),a=Lo();if(n>a){alert("Cannot hire beyond property capacity ("+a.toLocaleString()+"). You need more workplaces.");return}const i=e>0?`Confirm workforce changes?

Hiring fee: `+_(e)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(i)){on=!0;try{const r={};for(const d of et){const f=Number(c?.[d.factionKey]??0);r[d.factionKey]=Math.max(0,f+ae[d.id])}e>0&&(r.corp_cash_reserves=Math.max(0,t-Math.round(e)));const{error:s}=await y.from("factions").update(r).eq("id",c.id);if(s)throw s;Object.assign(c,r),ae={general:0,skilled:0,innovative:0};const l=document.getElementById("topbar-cash");if(l){const d=Number(c.corp_cash_reserves??0);l.textContent="CASH: "+(d>=1e6?"$"+(d/1e6).toFixed(1)+"M":"$"+Math.round(d/1e3)+"k")}Oo()}catch(r){alert("Error: "+r.message)}finally{on=!1}}}function Oo(){const o=document.getElementById("hf-card-container");if(!o)return;const e="'JetBrains Mono', monospace",t={bg:"var(--bg-card)",surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},n=Number(M?.minimum_wage??50),a=Number(M?.inflation??50),i=Number(M?.standard_of_living??50),r=n/100*48e3,s=(1+(a-50)/100*.5).toFixed(2),l=(1+(i-50)/100*.5).toFixed(2),d=M?.name||c?.nation||"Nation",f=Object.values(ae).some(w=>w!==0),p=Lo();let u=0,m=0,v=0,x=0,g="";for(const w of et){const k=Number(c?.[w.factionKey]??0),S=ae[w.id],z=k+S,$=Di(w.multiplier),C=S>0,A=k*$,E=z*$,N=E-A;u+=k,m+=z,v+=A,x+=E;const q=S!==0?C?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";g+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${t.border};background:${q};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${w.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${w.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${t.text}">${k.toLocaleString()}</span>
                    ${S!==0?`<span style="font-family:${e};font-size:10px;color:${t.dim}">→</span>
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${C?t.greenBright:t.red}">${z.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${w.multiplier}.0 × ${s} × ${l})</span>
                <span style="font-family:${e};font-size:10px;color:${w.color}">${_($)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${w.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.red};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-50</div>
                <div onclick="hfSetChange('${w.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.redDim};border:1px solid ${t.border};cursor:pointer;background:${t.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${S!==0?t.card:"transparent"};border:1px solid ${S!==0?t.border:"transparent"}">
                    ${S!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${e};font-size:12px;font-weight:700;color:${C?t.greenBright:t.red}">${C?"+":""}${S}</span>
                        <span onclick="hfReset('${w.id}')" style="font-family:${e};font-size:8px;color:${t.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${e};font-size:9px;color:${t.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${w.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+10</div>
                <div onclick="hfSetChange('${w.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${t.greenBright};border:1px solid ${t.border};cursor:pointer;background:${t.card}">+50</div>
            </div>
            ${S!==0?`<div style="margin-top:6px;padding:4px 8px;background:${t.bg};border:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${N>0?t.red:t.greenBright}">${N>0?"+":""}${_(N)}/yr</span>
            </div>`:""}
        </div>`}const h=x-v;o.innerHTML=`
    <div style="width:380px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Hire / Fire</span>
            </div>
            <span style="font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${d.toUpperCase()}</span>
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
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${a}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${s}</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;">
                        <div style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.5px">STD OF LIVING</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${i}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim}">×${l}</div>
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
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${h>0?t.red:t.greenBright}">${_(x)}</span>`:""}
                    </div>
                </div>
            </div>
            ${f?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${t.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">NET CHANGE</span>
                    <span style="font-family:${e};font-size:11px;font-weight:700;color:${h>0?t.red:t.greenBright}">${h>0?"+":""}${_(h)}/yr</span>
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">(${h>0?"+":""}${_(Math.round(h/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${t.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}function $s(){const o=document.getElementById("wf-summary-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},n=(M?.name||c?.nation||"Nation").toUpperCase(),a=Number(M?.minimum_wage??50),i=Number(M?.inflation??50),r=Number(M?.standard_of_living??50),s=a/100*48e3,l=1+(i-50)/100*.5,d=1+(r-50)/100*.5,f=[{label:"General Workforce",mult:2,color:t.accent,key:"corp_general_workforce",countColor:t.text},{label:"Skilled Workforce",mult:3,color:t.gold,key:"corp_skilled_workforce",countColor:t.blue},{label:"Innovative Workforce",mult:6,color:t.orange,key:"corp_innovative_workforce",countColor:t.gold}];let p=0,u=0,m="";for(const v of f){const x=Number(c?.[v.key]??0),g=Math.round(s*v.mult*l*d),h=x*g;p+=x,u+=h,m+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${t.text}">${v.label}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${n}</span>
                </div>
                <span style="font-family:${e};font-size:16px;font-weight:700;color:${v.countColor}">${x.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">WAGE (MIN × ${v.mult}.0 × ${l.toFixed(2)} × ${d.toFixed(2)})</span>
                <span style="font-family:${e};font-size:10px;color:${t.muted}">${_(g)}/yr</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1px;">
                <span style="font-family:${e};font-size:8px;color:${t.dim}">TOTAL ANNUAL COST</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">${_(h)}</span>
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
                    <span style="font-family:${e};font-size:9px;color:${t.text}">${a}/100 → ${_(s)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">INFLATION MODIFIER</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">×${l.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">STD OF LIVING MODIFIER</span>
                    <span style="font-family:${e};font-size:9px;color:${t.text}">×${d.toFixed(2)}</span>
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
    </div>`}let G=[];async function to(){if(!c?.id)return;const{data:o}=await y.from("corp_properties").select("*").eq("faction_id",c.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});G=o||[]}function Bo(){const o=document.getElementById("property-card-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},n=(M?.name||c?.nation||"Nation").toUpperCase(),a=1+(Number(M?.inflation??50)-50)/100*.3;let i="",r=0,s=0;const l=M?.name||c?.nation||"Home Nation",d=5e7,f=1+(Number(M?.inflation??50)-50)/100*.3,p=.8+Number(M?.stability??50)/100*.4,u=Math.round(d*f*p),m=Math.round(u*.005);r+=u,s+=m,i+=`
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
    </div>`;for(const v of G){const x=Co[v.style]||Co.Basic;r+=Number(v.purchase_price||0),s+=Number(v.monthly_maintenance||0),i+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${t.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:${t.text}">${v.name}</span>
                <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${t.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">OWNED</span>
            </div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:4px;">${v.city||n} · ${(v.type||"").replace(/_/g," ")} · <span style="color:${x.color}">${(v.style||"Basic").toUpperCase()}</span></div>
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
                <div onclick="propRefurbish('${v.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.accent};border:1px solid ${t.accent}33;cursor:pointer;">REFURBISH (${_(Math.round((v.purchase_price||0)*.1*a))})</div>
                <div onclick="propSell('${v.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${t.red};border:1px solid ${t.red}33;cursor:pointer;">SELL</div>
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
            ${i}
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
    </div>`}let ut=[],le=null;const Co={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function ti(){if(!c?.nation_id)return;const{data:o,error:e}=await y.from("available_properties").select("*").eq("nation_id",c.nation_id).eq("status","available").order("price",{ascending:!0});if(e){console.warn("[Property] Failed to load marketplace:",e.message);return}const t=c?.corp_sector==="Construction";ut=(o||[]).filter(n=>t||n.type!=="warehouse").map(n=>({...n,adjusted_cost:n.price,adjusted_maintenance:n.monthly_maintenance}))}function Po(){const o=document.getElementById("new-property-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"};(M?.name||c?.nation||"Nation").toUpperCase();const n=Number(M?.standard_of_living??50),a=Number(M?.gdp_growth??50),i=Number(M?.inflation??50),r=M?.capital||"Capital",s={capital:r,port:r+" Port",industrial:r+" Industrial Zone",suburban:r+" Suburbs",coastal:r+" Coast"};let l="";if(ut.length===0)l=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let d=0;d<ut.length;d++){const f=ut[d],p=le===d,u=Co[f.style]||Co.Basic,m=s[f.city_template]||r;l+=`
            <div onclick="npSelect(${d})" style="padding:8px 14px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${p?t.accent:"transparent"};background:${p?"rgba(139,154,107,0.03)":"transparent"};">
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
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${ut.length} AVAILABLE</span>
        </div>
        <div style="padding:4px 14px;border-bottom:1px solid ${t.border};display:flex;gap:12px;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">STD OF LIVING</span>
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${n>=50?t.greenBright:t.yellow}">${Math.round(n)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">GDP GROWTH</span>
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${a>=50?t.greenBright:t.yellow}">${Math.round(a)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${e};font-size:7px;color:${t.dim}">INFLATION</span>
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${i<=50?t.greenBright:t.red}">${Math.round(i)}</span>
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
    </div>`}function ws(o){le=le===o?null:o,Po()}let rn=!1;async function ks(){if(le===null||rn)return;const o=ut[le];if(!o)return;const e=Number(c?.corp_cash_reserves??0);if(o.adjusted_cost>e){alert(`Insufficient cash reserves.
Property: `+_(o.adjusted_cost)+`
Cash: `+_(e));return}if(confirm('Buy "'+o.name+'" for '+_(o.adjusted_cost)+`?

Monthly maintenance: `+_(o.adjusted_maintenance)+`/mo
Condition: `+o.condition+`%

This will be deducted from your cash reserves.`)){rn=!0;try{const{error:t}=await y.from("corp_properties").insert({faction_id:c.id,nation_id:c.nation_id,catalog_id:o.catalog_id||null,name:o.name,type:o.type,style:o.style,capacity:o.capacity,purchase_price:o.adjusted_cost,monthly_maintenance:o.adjusted_maintenance,condition:o.condition,city:o.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(t)throw t;const n=Math.max(0,e-o.adjusted_cost),{error:a}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",c.id);if(a)throw a;c.corp_cash_reserves=n,o.id&&await y.from("available_properties").update({status:"sold",purchased_by:c.id}).eq("id",o.id);const i=document.getElementById("topbar-cash");i&&(i.textContent="CASH: "+(n>=1e6?"$"+(n/1e6).toFixed(1)+"M":"$"+Math.round(n/1e3)+"k")),le=null,await ti(),Po(),Bo(),alert("Property purchased: "+o.name+`

Deducted: `+_(o.adjusted_cost))}catch(t){alert("Purchase failed: "+t.message)}finally{rn=!1}}}const wt={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let oi=!1,L={name:"",type:"Office Building",size:2e3,style:"Modern",nationId:null,nationName:null},sn=!1,zn=[];function aa(){const e=1+(Number(M?.inflation??50)-50)/100*.3,t=wt[L.style]?.costMod||1,n=L.type==="Warehouse"?.75:1,a=Math.round(L.size*1e5*e*t*n),i=Math.round(a*.007*(wt[L.style]?.maintMod||1));return{total:a,maint:i,inflMod:e,styleMod:t}}async function Es(){oi=!0;const o=c?.nation_id,e=M?.name||c?.nation||"Home Nation";L={name:"",type:"Office Building",size:2e3,style:"Modern",nationId:o,nationName:e},zn=[{id:o,name:e,label:"National HQ"}];try{const{data:t}=await y.from("corp_properties").select("nation_id, name, nations!nation_id(name)").eq("faction_id",c.id).eq("type","regional_hq").eq("is_active",!0);for(const n of t||[])n.nation_id!==o&&zn.push({id:n.nation_id,name:n.nations?.name||"Unknown",label:n.name||"Regional HQ"})}catch{}ra()}function ni(){oi=!1,document.getElementById("cp-modal-overlay")?.remove()}function Cs(o,e){L[o]=e,ra()}async function Ts(){if(!(sn||!L.name.trim())){if(!L.nationId){alert("Select a location.");return}sn=!0;try{const o=aa(),e=L.nationId,t=L.nationName||"Unknown",n=wt[L.style]?.repGain||1,a=await y.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),i=a.data?.current_tick||0,r=(a.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:s}=await y.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",e).eq("issuer_type","PRIVATE"),d=`PVT-C${(s||0)+1}-${r}`,{error:f}=await y.from("construction_contracts").insert({nation_id:e,template_key:"custom_building",sector:"civil_engineering",name:L.name.trim(),project_type:L.type,project_subtype:L.style,description:`${L.type} (${L.style}) — ${L.size.toLocaleString()} employees, commissioned by ${c.faction_name}`,project_code:d,budget_ceiling:o.total,timeline_ticks:Math.max(4,Math.ceil(L.size/2e3)+2),required_materials:(()=>{const p=L.size/1e3,u=L.style,m={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[u]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},v=(x,g)=>Math.max(1,Math.ceil(p*x*g));return{concrete:v(8,m.concrete),steel:v(6,m.steel),glass_facades:v(3,m.glass),em_systems:v(4,m.em),lumber:v(1,m.lumber),heavy_parts:v(2,m.heavy),aggregate:v(3,m.agg)}})(),required_equipment:(()=>{const p=L.size,u={trucks:Math.ceil(p/2e3)+1,mixers:Math.ceil(p/3e3)+1};return p>1e3&&(u.excavators=Math.ceil(p/3e3)+1,u.cranes=Math.ceil(p/4e3)+1),p>3e3&&(u.bulldozers=Math.ceil(p/4e3)+1,u.haulers=Math.ceil(p/5e3)+1),p>8e3&&(u.pile_drivers=Math.ceil(p/6e3)+1),u})(),required_workforce:{general:Math.ceil(L.size*.08),skilled:Math.ceil(L.size*.03)},status:"open",generated_at_tick:i,bidding_ends_tick:i+3,issuer_type:"PRIVATE",issuer_name:c.faction_name,issuer_faction_id:c.id});if(f)throw f;ni(),alert(`Construction project submitted!

Project: `+L.name.trim()+`
Code: `+d+`
Budget: `+_(o.total)+`
Expected Reputation: +`+Math.ceil(o.adjusted/1e8*3)+` (+3 per $100M)

All construction corporations in `+t+" can now bid on this project.")}catch(o){alert("Failed to submit project: "+o.message)}finally{sn=!1}}}function ra(){if(document.getElementById("cp-modal-overlay")?.remove(),!oi)return;const o="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",redDim:"#a44",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},t=aa(),n=Math.ceil(t.total/1e8*3),a=n>=4?e.gold:n>=3?e.greenBright:n>=2?e.accent:e.dim,i=Object.entries(wt).map(([l,d])=>{const f=L.style===l;return`<div onclick="cpSetField('style','${l}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${f?d.color+"18":"transparent"};border:1px solid ${f?d.color+"44":e.border};">
            <div style="font-family:${o};font-size:9px;font-weight:700;color:${f?d.color:e.dim}">${l}</div>
            <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:1px">×${d.costMod.toFixed(1)} cost</div>
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
                    ${["Regional HQ","Office Building",...c?.corp_sector==="Construction"?["Warehouse"]:[],...c?.corp_subsector?.toLowerCase()==="banking"?["Branch Office"]:[],...c?.corp_subsector?.toLowerCase()==="investment"?["Trading Floor"]:[],...c?.corp_subsector?.toLowerCase()==="insurance"?["Claims Office"]:[]].map(l=>{const d=["Branch Office","Trading Floor","Claims Office"].includes(l),p=l==="Warehouse"?e.orange:d?"#8a6aaa":e.accent;return`<span onclick="cpSetField('type','${l}')" style="flex:1;min-width:100px;text-align:center;padding:6px 0;font-family:${o};font-size:12px;font-weight:700;cursor:pointer;color:${L.type===l?"#000":e.dim};background:${L.type===l?p:"transparent"};border:1px solid ${L.type===l?p:e.border}">${l}</span>`}).join("")}
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
                    ${zn.map(l=>`<option value="${l.id}" ${L.nationId===l.id?"selected":""}>${l.name} (${l.label})</option>`).join("")}
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
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;">${i}</div>
                <div style="margin-top:5px;font-family:${o};font-size:10px;color:${wt[L.style].color}">${wt[L.style].desc}</div>
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
                    <span style="font-family:${o};font-size:20px;font-weight:700;color:${a}">+${n}</span>
                </div>
                <div style="font-family:${o};font-size:9px;color:${e.dim};margin-top:3px">${L.style} style · ${n===5?"Maximum prestige":n>=4?"Impressive presence":n>=3?"Strong statement":n>=2?"Solid investment":"Functional addition"}</div>
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
    </div>`,document.body.appendChild(r);const s=document.getElementById("cp-name-input");s&&s.addEventListener("input",l=>{L.name=l.target.value}),r.addEventListener("click",l=>{l.target===r&&ni()})}function Ss(){const o=document.getElementById("cp-name-input");if(o&&(L.name=o.value),!L.name.trim()){alert("Please enter a building name.");return}Ts()}window.cpClose=ni;window.cpSetField=Cs;window.cpSubmitFromModal=Ss;window.npSelect=ws;window.npBuyProperty=ks;window.npOpenConstructionModal=Es;let kt=!1;async function zs(o){if(kt)return;const e=G.find(s=>s.id===o);if(!e)return;const t=1+(Number(M?.inflation??50)-50)/100*.3,n=Math.round((e.purchase_price||0)*.1*t),a=Number(c?.corp_cash_reserves??0);if(n>a){alert("Insufficient cash. Refurbishment costs "+_(n)+" (inflation-adjusted), you have "+_(a));return}if(e.condition>=95){alert("Property is already in excellent condition ("+e.condition+"%).");return}const i=5+Math.floor(Math.random()*21),r=Math.min(100,e.condition+i);if(confirm('Refurbish "'+e.name+`"?

Cost: `+_(n)+`
Expected improvement: +`+i+"% condition ("+e.condition+"% → "+r+"%)")){kt=!0;try{await y.from("corp_properties").update({condition:r}).eq("id",o);const s=Math.max(0,a-n);await y.from("factions").update({corp_cash_reserves:s}).eq("id",c.id),c.corp_cash_reserves=s;const l=document.getElementById("topbar-cash");l&&(l.textContent="CASH: "+(s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k")),await to(),Bo(),alert("Refurbished! Condition: "+e.condition+"% → "+r+"%")}catch(s){alert("Refurbishment failed: "+s.message)}finally{kt=!1}}}async function Ns(o){if(kt)return;const e=G.find(i=>i.id===o);if(!e)return;const t=1+(Number(M?.inflation??50)-50)/100*.3,n=(e.condition||50)/100,a=Math.round((e.purchase_price||0)*.6*n*t);if(confirm('Sell "'+e.name+`"?

Sale value: `+_(a)+" (60% × "+e.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){kt=!0;try{await y.from("corp_properties").update({is_active:!1}).eq("id",o);const r=Number(c?.corp_cash_reserves??0)+a;await y.from("factions").update({corp_cash_reserves:r}).eq("id",c.id),c.corp_cash_reserves=r;const l=(await y.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await y.from("available_properties").insert({nation_id:c.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,price:Math.round(a*1.1),monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,generated_at_tick:l,expires_at_tick:l+6,status:"available"});const d=document.getElementById("topbar-cash");d&&(d.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")),await to(),Bo(),await ti(),Po(),alert('Sold "'+e.name+'" for '+_(a))}catch(i){alert("Sale failed: "+i.message)}finally{kt=!1}}}window.propRefurbish=zs;window.propSell=Ns;const He={SALE:.8,DISSOLVE:.6,REVENUE_BASE:.02,GDP_NEUTRAL:30,DEFAULT_REPUTATION:25};function Is(o){if(!o)return 0;const e=o.trim().replace(/[$,]/g,""),t=e.match(/^([\d.]+)\s*[Mm]$/),n=e.match(/^([\d.]+)\s*[Kk]$/);return Math.round(t?parseFloat(t[1])*1e6:n?parseFloat(n[1])*1e3:parseFloat(e))}function nt(o){const e=document.getElementById("topbar-cash");e&&(e.textContent="CASH: "+(o>=1e6?"$"+(o/1e6).toFixed(1)+"M":"$"+Math.round(o/1e3)+"k"))}function sa(o){return It.find(e=>e.id===o)?.name||"—"}function Do(o){return G.filter(e=>e.nation_id===o)}async function oo(){vt=0,await to(),Bo(),no(),io()}let se=!1,vt=0,mo={};async function Ms(){if(c?.id)try{const{data:o}=await y.from("construction_contracts").select("nation_id").eq("awarded_to_faction",c.id).in("status",["in_progress","awarded"]);mo={};for(const e of o||[])e.nation_id&&(mo[e.nation_id]=(mo[e.nation_id]||0)+1)}catch{}}function la(o){const e=Do(o.nation_id),t=e.reduce((v,x)=>v+Number(x.purchase_price||0),0),n=e.reduce((v,x)=>v+Number(x.capacity||0),0),a=mo[o.nation_id]||0,i=It.find(v=>v.id===o.nation_id),r=(o.name||"").trim().split(/\s+/),s=r.length>=2?r.map(v=>v[0]).join("").toUpperCase().slice(0,4):(o.name||"SUB").slice(0,4).toUpperCase(),l=Number(o.sub_cash||0),d=Number(i?.gdp_growth??50),f=l*He.REVENUE_BASE,p=(d-He.GDP_NEUTRAL)/100,u=He.DEFAULT_REPUTATION/100,m=l>0?Math.round(f*(1+p)*u):0;return{id:o.id,name:o.name,abbr:s,nation:i?.name||o.city||"—",nationId:o.nation_id,sector:c?.corp_sector||"General",subsector:o.subsector||c?.corp_subsector||"—",revenue:m,debt:0,cash:l,reputation:He.DEFAULT_REPUTATION,valuation:t,workforce:n,projects:a,established:o.created_at?new Date(o.created_at).getFullYear().toString():"—",trend:d>=40&&l>0?"up":d>=He.GDP_NEUTRAL&&l>0?"flat":"down",profitable:m>0,hqProp:o}}function no(){const o=document.getElementById("manage-subsidiaries-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},a=G.filter(f=>f.type==="regional_hq").map(la);vt>=a.length&&(vt=0);const i=a[vt]||null;let r="";a.length===0&&(r=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No subsidiaries established.<br>Use Create Subsidiary to expand.</div>`);let s=0,l=0;for(let f=0;f<a.length;f++){const p=a[f],u=f===vt;s+=p.revenue,l+=p.valuation;const m=p.trend==="up"?t.greenBright:p.trend==="down"?t.red:t.dim,v=p.trend==="up"?"▲":p.trend==="down"?"▼":"–";r+=`
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
        </div>`}let d="";if(i){const f=i.trend==="up"?t.greenBright:i.trend==="down"?t.red:t.dim,p=i.trend==="up"?"▲":i.trend==="down"?"▼":"–",u=i.trend==="up"?"Growing":i.trend==="down"?"Declining":"Stable",m=i.reputation>=40?t.accent:i.reputation>=25?t.yellow:t.orange,v=[{label:"Revenue",value:_(i.revenue),color:i.profitable?t.greenBright:t.redDim},{label:"Cash",value:_(i.cash),color:t.text},{label:"Debt",value:i.debt>0?_(i.debt):"$0",color:i.debt>0?t.orange:t.dim},{label:"Reputation",value:i.reputation+"/100",color:m},{label:"Market Valuation",value:_(i.valuation),color:t.gold},{label:"Workforce",value:i.workforce.toLocaleString(),color:t.text},{label:"Active Projects",value:i.projects.toString(),color:i.projects>0?t.text:t.dim}],x=i.projects===0,g=i.hqProp?.logo_url?`<img src="${b(i.hqProp.logo_url)}" alt="" style="width:32px;height:32px;object-fit:cover;border-radius:4px;">`:`<label style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:${t.card};border:1px dashed ${t.border};border-radius:4px;cursor:pointer;font-size:14px;color:${t.dim};" title="Upload subsidiary logo">+<input type="file" accept="image/*" id="sub-logo-upload" data-prop-id="${i.hqProp?.id||""}" style="display:none;"></label>`;d=`
            <div style="padding:8px 14px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                    ${g}
                    <div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${e};font-size:12px;font-weight:700;color:${t.gold}">${i.abbr}</span>
                            <span style="font-size:12px;font-weight:700;color:${t.text}">${i.name}</span>
                        </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${i.nation.toUpperCase()}</span>
                    <span style="font-family:${e};font-size:8px;color:${t.dim}">Est. ${i.established}</span>
                    <span style="font-family:${e};font-size:8px;color:${f}">${p} ${u}</span>
                </div>
                    </div>
                </div>
            </div>
            ${v.map(h=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 14px;border-bottom:1px solid ${t.border};">
                <span style="font-family:${e};font-size:9px;color:${t.dim};letter-spacing:0.5px;text-transform:uppercase">${h.label}</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;color:${h.color}">${h.value}</span>
            </div>`).join("")}
            <div style="padding:6px 14px;border-bottom:1px solid ${t.border};flex-shrink:0;">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                    <span style="font-family:${e};font-size:7px;color:${t.dim};letter-spacing:0.8px">REPUTATION</span>
                    <span style="font-family:${e};font-size:8px;color:${t.muted}">75% sub / 25% parent</span>
                </div>
                <div style="width:100%;height:4px;background:${t.border}"><div style="width:${i.reputation}%;height:100%;background:${m}"></div></div>
            </div>
            ${i.subsector==="Insurance"||i.subsector==="Banking"?`<div id="sub-dashboard-${i.id}" style="flex:1;overflow-y:auto;"></div>`:'<div style="flex:1"></div>'}
            <div style="padding:6px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                <div style="font-family:${e};font-size:8px;letter-spacing:1.5px;color:${t.dim};text-transform:uppercase;margin-bottom:6px">Actions</div>
                <div style="display:flex;gap:4px;margin-bottom:4px;">
                    <div onclick="subInjectCapital('${i.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${t.greenBright};border:1px solid ${t.greenDark};background:rgba(74,170,136,0.06)">INJECT CAPITAL</div>
                    <div onclick="subWithdraw('${i.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${i.cash>0?t.gold:t.dim};border:1px solid ${i.cash>0?t.gold+"44":t.border};opacity:${i.cash>0?1:.4}">WITHDRAW</div>
                </div>
                <div style="display:flex;gap:4px;">
                    <div onclick="subMerge('${i.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${t.accent};border:1px solid ${t.accent}">MERGE</div>
                    <div onclick="subPutForSale('${i.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${t.orange};border:1px solid ${t.orange}">PUT UP FOR SALE</div>
                    <div onclick="${x?"subDissolve('"+i.id+"')":""}" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${x?t.red:t.dim};border:1px solid ${x?t.red:t.border};opacity:${x?1:.3}">DISSOLVE</div>
                </div>
                ${i.projects>0?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${t.dim}">Cannot dissolve with active projects.</div>`:""}
            </div>`}else d=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a subsidiary to manage.</div>`;if(o.innerHTML=`
    <div style="width:760px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Manage Subsidiaries</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${a.length} ACTIVE</span>
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
                ${d}
            </div>
        </div>
    </div>`,document.getElementById("sub-logo-upload")?.addEventListener("change",async f=>{const p=f.target.files?.[0],u=f.target.dataset.propId;if(!(!p||!u)){if(p.size>2*1024*1024){alert("Logo must be under 2MB.");return}try{const m=p.name.split(".").pop()?.toLowerCase()||"png",v=`party-logos/${c.id}/sub_${u}_${Date.now()}.${m}`,{error:x}=await y.storage.from("public-assets").upload(v,p,{contentType:p.type,upsert:!0});if(x)throw x;const{data:g}=y.storage.from("public-assets").getPublicUrl(v),h=g?.publicUrl;if(h){await y.from("corp_properties").update({logo_url:h}).eq("id",u);const w=G.find(k=>k.id===u);w&&(w.logo_url=h),no()}}catch(m){alert("Upload failed: "+(m.message||"Error"))}}}),i&&(i.subsector==="Insurance"||i.subsector==="Banking")){const f="sub-dashboard-"+i.id;setTimeout(()=>{document.getElementById(f)&&Na(y,{faction:c,nation:M,shard:I},f,i.id).catch(p=>console.error("[SubDash] Init failed:",p))},50)}}async function da(o,e){if(se)return;const t=G.find(m=>m.id===o);if(!t)return;const n=e==="sell",a=n?He.SALE:He.DISSOLVE,i=n?"SELL":"DISSOLVE",r=n?"sold":"dissolved",s=n?"80%":"60%",l=sa(t.nation_id),d=Do(t.nation_id),f=d.reduce((m,v)=>m+Math.round((v.purchase_price||0)*a*(v.condition||50)/100),0),p=Number(t.sub_cash||0),u=f+p;if(confirm(i+' subsidiary "'+t.name+`"?

`+d.length+" properties at "+s+` × condition:
  Property value: `+_(f)+`
  Subsidiary cash: `+_(p)+`
  ─────────────────
  Total return: `+_(u)+`

All operations in `+l+` cease.
This cannot be undone.`)){se=!0;try{const m=d.map(x=>x.id);if(m.length===1){const{error:x}=await y.from("corp_properties").update({is_active:!1}).eq("id",m[0]);if(x)throw x}else if(m.length>1){const{error:x}=await y.from("corp_properties").update({is_active:!1}).in("id",m);if(x)throw x}await y.from("corp_properties").update({sub_cash:0}).eq("id",o).then(()=>{}).catch(()=>{});const v=Number(c?.corp_cash_reserves??0)+u;await y.from("factions").update({corp_cash_reserves:v}).eq("id",c.id),c.corp_cash_reserves=v,nt(v),await oo(),alert("Subsidiary "+r+". "+d.length+` properties liquidated.
Total received: `+_(u))}catch(m){alert("Failed: "+m.message)}finally{se=!1}}}function As(o){da(o,"sell")}async function Rs(o){if(se)return;const e=G.find(s=>s.id===o);if(!e)return;const t=sa(e.nation_id),a=Do(e.nation_id).reduce((s,l)=>s+Math.round((l.purchase_price||0)*.8*(l.condition||50)/100),0),i=Number(e.sub_cash||0),r=Math.round(i*.05);if(confirm('PUT UP FOR SALE: "'+e.name+`"

Nation: `+t+`
Estimated Valuation: `+_(a)+`
Subsidiary Cash: `+_(i)+`
Subsector: `+(e.subsector||"General")+`

This will list your subsidiary on the marketplace.
Other corporations can place bids (minimum $1M).
You review and accept bids.

Continue?`)){se=!0;try{const s=I?.current_tick||0,{data:l,error:d}=await y.from("subsidiary_sales").insert({subsidiary_id:o,seller_faction_id:c.id,nation_id:e.nation_id,subsidiary_name:e.name,subsector:e.subsector||null,valuation:a,monthly_revenue:r,sub_cash_at_listing:i,employee_count:e.capacity||0,status:"listed",listed_at_tick:s}).select("*").single();if(d){alert("Failed to list: "+d.message);return}alert('"'+e.name+`" is now listed for sale.

Other corporations will see it on the Expansion tab and can place bids.`),await oo()}catch(s){alert("Failed: "+s.message)}finally{se=!1}}}let To=[],ca="ready",Bt=null;async function jo(){const o=await Aa(y);To=o.listings,ca=o.state,Bt=o.error,Bt&&console.error("[SubMarket] Load failed:",Bt.message)}function Fo(){let o=document.getElementById("sub-marketplace-card");o||(o=document.createElement("div"),o.id="sub-marketplace-card",document.getElementById("expansion-content")?.appendChild(o));const e=To.filter(l=>l.seller_faction_id!==c?.id),t=To.filter(l=>l.seller_faction_id===c?.id),n="'JetBrains Mono',monospace",a=getComputedStyle(document.body),i=(l,d)=>a.getPropertyValue(l).trim()||d,r={surface:i("--bg-2","var(--bg-card)"),card:i("--bg-3","#f0efeb"),border:i("--border-0","rgba(0,0,0,0.08)"),dim:i("--text-dim","#aaa"),muted:i("--text-muted","#888"),text:i("--text-primary","#333"),bright:i("--text-bright","#1a1a17"),orange:i("--orange","#d35400"),green:i("--green","#2d8a2d"),blue:i("--blue","#2874a6"),red:i("--red","#c0392b"),gold:i("--gold","#a88520")};let s=`<div style="width:760px;background:${r.surface};border:1px solid ${r.border};font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:10px 14px;border-bottom:1px solid ${r.border};display:flex;align-items:center;gap:8px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${r.orange};display:inline-block;"></span>
            <span style="font-family:${n};font-size:11px;font-weight:700;letter-spacing:1.5px;color:${r.orange};text-transform:uppercase;">Subsidiary Marketplace</span>
            <span style="font-family:${n};font-size:9px;color:${r.dim};">${e.length} available</span>
        </div>`;if(t.length>0){s+=`<div style="padding:8px 14px;border-bottom:1px solid ${r.border};background:${r.card};">
            <div style="font-family:${n};font-size:8px;letter-spacing:1px;color:${r.gold};text-transform:uppercase;margin-bottom:6px;">YOUR LISTINGS</div>`;for(const l of t){const f=(l.subsidiary_bids||[]).filter(p=>p.status==="pending");s+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:11px;font-weight:700;color:${r.bright};">${b(l.subsidiary_name)}</span>
                    <span style="font-family:${n};font-size:8px;color:${r.dim};margin-left:6px;">${b(l.subsector||"")}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${n};font-size:9px;color:${f.length>0?r.green:r.dim};">${f.length} bid${f.length!==1?"s":""}</span>
                    ${f.length>0?`<span onclick="subViewBids('${l.id}')" style="font-family:${n};font-size:8px;font-weight:700;padding:3px 8px;color:${r.green};border:1px solid ${r.green}44;cursor:pointer;">VIEW BIDS</span>`:""}
                    <span onclick="subCancelSale('${l.id}')" style="font-family:${n};font-size:8px;font-weight:700;padding:3px 8px;color:${r.red};border:1px solid ${r.red}44;cursor:pointer;">CANCEL</span>
                </div>
            </div>`}s+="</div>"}if(ca==="error")s+=`<div style="padding:24px 14px;text-align:center;font-family:${n};font-size:10px;color:${r.red};font-style:italic;">${b(Bt&&Bt.message||"Subsidiary marketplace is temporarily unavailable.")}</div>`;else if(e.length===0)s+=`<div style="padding:24px 14px;text-align:center;font-family:${n};font-size:10px;color:${r.dim};font-style:italic;">No subsidiaries for sale right now.</div>`;else for(const l of e){const d=(l.subsidiary_bids||[]).find(u=>u.bidder_faction_id===c?.id&&u.status==="pending"),p=(_allNations||[]).find(u=>u.id===l.nation_id)?.name||"Unknown";s+=`<div style="padding:10px 14px;border-bottom:1px solid ${r.border};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span style="font-size:12px;font-weight:700;color:${r.bright};">${b(l.subsidiary_name)}</span>
                        <span style="font-family:${n};font-size:7px;font-weight:700;padding:1px 5px;color:${r.orange};border:1px solid ${r.orange}44;background:${r.orange}0a;">${b(l.subsector||"General")}</span>
                    </div>
                    <span style="font-family:${n};font-size:8px;color:${r.dim};">${b(p)}</span>
                </div>
                <div style="display:flex;gap:16px;font-family:${n};font-size:8px;color:${r.muted};margin-bottom:8px;">
                    <span>Valuation: <strong style="color:${r.text};">${_(l.valuation)}</strong></span>
                    <span>Revenue: <strong style="color:${r.text};">${_(l.monthly_revenue)}/mo</strong></span>
                    <span>Cash: <strong style="color:${r.text};">${_(l.sub_cash_at_listing)}</strong></span>
                    <span>Staff: <strong style="color:${r.text};">${l.employee_count}</strong></span>
                </div>
                <div style="display:flex;justify-content:flex-end;">
                    ${d?`<span style="font-family:${n};font-size:8px;font-weight:700;color:${r.green};">✓ BID PLACED: ${_(d.bid_amount)}</span>`:`<span onclick="subPlaceBid('${l.id}','${b(l.subsidiary_name)}',${l.valuation})" style="font-family:${n};font-size:8px;font-weight:700;padding:4px 14px;color:#000;background:${r.orange};cursor:pointer;">PLACE BID</span>`}
                </div>
            </div>`}s+="</div>",o.innerHTML=s}async function qs(o,e,t){const n=prompt('Place bid for "'+e+`"

Valuation: `+_(t)+`
Minimum bid: $1M

Enter bid amount ($):`);if(!n)return;const a=Math.round(Number(n));if(isNaN(a)||a<1e6){alert("Minimum bid is $1,000,000.");return}const i=Number(c?.corp_cash_reserves??0);if(a>i){alert("Insufficient funds. You have "+_(i)+".");return}const{error:r}=await y.from("subsidiary_bids").insert({sale_id:o,bidder_faction_id:c.id,bid_amount:a,status:"pending",placed_at_tick:I?.current_tick||0});if(r){r.message.includes("duplicate")||r.message.includes("unique")?alert("You already have a bid on this subsidiary."):alert("Failed to place bid: "+r.message);return}alert("Bid of "+_(a)+' placed on "'+e+`".
The seller will review your bid.`),await jo(),Fo()}async function Ls(o){const e=To.find(u=>u.id===o);if(!e)return;const t=(e.subsidiary_bids||[]).filter(u=>u.status==="pending");if(t.length===0){alert("No pending bids.");return}const n=t.map(u=>u.bidder_faction_id),{data:a}=await y.from("factions").select("id, faction_name").in("id",n),i={};(a||[]).forEach(u=>{i[u.id]=u.faction_name});let r='Bids for "'+e.subsidiary_name+`":

`;const s=t.sort((u,m)=>m.bid_amount-u.bid_amount);for(let u=0;u<s.length;u++){const m=s[u];r+=u+1+". "+(i[m.bidder_faction_id]||"Unknown")+": "+_(m.bid_amount)+`
`}r+=`
Enter the number of the bid to accept (or cancel):`;const l=prompt(r);if(!l)return;const d=parseInt(l,10)-1;if(isNaN(d)||d<0||d>=s.length){alert("Invalid selection.");return}const f=s[d],p=i[f.bidder_faction_id]||"Unknown";confirm("Accept bid of "+_(f.bid_amount)+" from "+p+`?

This will transfer ownership of "`+e.subsidiary_name+`" to them.
You will receive `+_(f.bid_amount)+` in cash.

This cannot be undone.`)&&await Os(e,f)}let ln=!1;async function Os(o,e){if(!ln){ln=!0;try{const a=I?.current_tick||0,{data:i}=await y.from("factions").select("corp_cash_reserves").eq("id",e.bidder_faction_id).single(),r=Number(i?.corp_cash_reserves??0);if(r<e.bid_amount){alert("Buyer has insufficient funds. Bid cannot be completed."),await y.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:a}).eq("id",e.id);return}var{error:t}=await y.from("factions").update({corp_cash_reserves:r-e.bid_amount}).eq("id",e.bidder_faction_id);if(t){alert("Failed to deduct from buyer: "+t.message);return}const s=Number(c?.corp_cash_reserves??0);var{error:n}=await y.from("factions").update({corp_cash_reserves:s+e.bid_amount}).eq("id",c.id);if(n){await y.from("factions").update({corp_cash_reserves:r}).eq("id",e.bidder_faction_id),alert("Failed to credit seller: "+n.message);return}c.corp_cash_reserves=s+e.bid_amount,await y.from("corp_properties").update({faction_id:e.bidder_faction_id}).eq("id",o.subsidiary_id);const l=G.filter(d=>d.nation_id===o.nation_id&&d.faction_id===c.id);for(const d of l)await y.from("corp_properties").update({faction_id:e.bidder_faction_id}).eq("id",d.id);await y.from("subsidiary_sales").update({status:"completed",completed_at_tick:a,accepted_bid_id:e.id}).eq("id",o.id),await y.from("subsidiary_bids").update({status:"accepted",resolved_at_tick:a}).eq("id",e.id),await y.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:a}).eq("sale_id",o.id).neq("id",e.id),nt(c.corp_cash_reserves),alert("Sale complete! Received "+_(e.bid_amount)+`.

"`+o.subsidiary_name+'" has been transferred to the buyer.'),await oo(),await jo(),Fo()}catch(a){console.error("[SubMarket] Accept bid error:",a),alert("Transfer failed: "+a.message)}finally{ln=!1}}}async function Bs(o){if(!confirm("Cancel this listing? The subsidiary will no longer be for sale."))return;const{error:e}=await y.from("subsidiary_sales").update({status:"cancelled"}).eq("id",o);if(e){alert("Failed: "+e.message);return}await jo(),Fo()}function Ps(o){da(o,"dissolve")}async function pa(o,e){if(se)return;const t=G.find(p=>p.id===o);if(!t)return;const n=Number(c?.corp_cash_reserves??0),a=Number(t.sub_cash||0),i=e?"WITHDRAW":"INJECT CAPITAL";if(e&&a<=0){alert("This subsidiary has no cash to withdraw.");return}const r=e?a:n,s=prompt(i+(e?" from ":" into ")+t.name+`

Parent cash: `+_(n)+`
Subsidiary cash: `+_(a)+`

Enter amount (e.g., 5000000 or 5M):`);if(!s)return;const l=Is(s);if(!l||l<=0||isNaN(l)){alert("Invalid amount.");return}if(l>r){alert("Insufficient "+(e?"subsidiary":"parent")+" cash. Available: "+_(r));return}const d=e?n+l:n-l,f=e?a-l:a+l;if(confirm(i+" "+_(l)+(e?" from ":" into ")+t.name+`?

Parent: `+_(n)+" → "+_(d)+`
Subsidiary: `+_(a)+" → "+_(f))){se=!0;try{await Promise.all([y.from("factions").update({corp_cash_reserves:d}).eq("id",c.id),y.from("corp_properties").update({sub_cash:f}).eq("id",o)]),c.corp_cash_reserves=d,t.sub_cash=f,nt(d),no(),alert((e?"Withdrew ":"Injected ")+_(l)+(e?" from ":" into ")+t.name+".")}catch(p){alert("Failed: "+p.message)}finally{se=!1}}}function Ds(o){pa(o,!1)}function js(o){pa(o,!0)}async function Fs(o){if(se)return;const e=G.find(x=>x.id===o);if(!e)return;const t=la(e);t.nation;const n=Do(e.nation_id),a=t.valuation,i=t.cash,r=t.reputation,s=t.subsector,l=Math.round(a*2.25),d=Math.round(r*.1),f=Math.round(r*.2),p=Lo(),u=et.reduce((x,g)=>x+Number(c?.[g.factionKey]??0),0),m=Math.max(0,p-u),v=Number(c?.corp_cash_reserves??0);if(l>v){alert(`Insufficient cash to acquire subsidiary.

Acquisition cost (2.25× valuation): `+_(l)+`
Available cash: `+_(v));return}if(t.projects>0){alert("Cannot merge — subsidiary has "+t.projects+" active project(s). Complete or abandon them first.");return}if(confirm('MERGE "'+e.name+`" INTO YOUR CORPORATION

Acquisition cost (2.25× valuation): `+_(l)+`
Subsidiary cash absorbed: `+_(i)+`
Net cost: `+_(l-i)+`

• `+n.length+` properties transferred to parent
• Subsidiary subsector "`+s+`" added to portfolio
• Workers hired to max capacity (+`+m.toLocaleString()+`)
• Reputation: +`+d+" or -"+f+" (from sub rep "+r+`)

This cannot be undone.`)){se=!0;try{const x=c.nation_id;if(n.length>0){const C=n.filter(E=>E.id!==e.id).map(E=>E.id);if(C.length===1){const{error:E}=await y.from("corp_properties").update({nation_id:x,type:"office"}).eq("id",C[0]);if(E)throw E}else if(C.length>1){const{error:E}=await y.from("corp_properties").update({nation_id:x,type:"office"}).in("id",C);if(E)throw E}const{error:A}=await y.from("corp_properties").update({nation_id:x,type:"office",sub_cash:0,subsector:null}).eq("id",e.id);if(A)throw A}const g=v-l+i,w=Number(c?.corp_general_workforce??0)+m,k=Math.random()>=.5?d:-f,S=Number(c?.standing??50),z=Math.max(0,Math.min(100,S+k)),{error:$}=await y.from("factions").update({corp_cash_reserves:g,corp_general_workforce:w,standing:z}).eq("id",c.id);if($)throw $;c.corp_cash_reserves=g,c.corp_general_workforce=w,c.standing=z,nt(g),await oo(),alert(`Merger complete!

"`+e.name+`" absorbed into your corporation.
Cost: `+_(l)+" | Cash absorbed: "+_(i)+`
Reputation `+(k>=0?"+":"")+k+" (now "+z+`)
Workers hired: +`+m.toLocaleString()+` general workforce
Properties: `+n.length+" transferred to parent")}catch(x){alert("Merge failed: "+x.message)}finally{se=!1}}}window.subDissolve=Ps;window.subInjectCapital=Ds;window.subWithdraw=js;window.subMerge=Fs;window.subSell=As;window.subPutForSale=Rs;window.subPlaceBid=qs;window.subViewBids=Ls;window.subCancelSale=Bs;window.selectSubsidiary=function(o){vt=o,no()};let It=[],Pt={},ve=null,dn=!1,it="",Qt="",at="",qe="";const fa={Construction:4,Finance:5,Shipping:4},Us=["Construction","Shipping","Finance"],ma={Construction:[{id:"civil",name:"Civil Engineering",mod:0},{id:"industrial",name:"Industrial Construction",mod:.25},{id:"mega",name:"Megaprojects",mod:.4}],Shipping:[{id:"bulk_cargo",name:"Bulk Cargo",mod:0},{id:"container_freight",name:"Container Freight",mod:.2},{id:"specialized_transport",name:"Specialized Transport",mod:.35}],Finance:[{id:"banking",name:"Banking",mod:0},{id:"insurance",name:"Insurance",mod:.15},{id:"investment",name:"Investment Management",mod:.3}],Technology:[{id:"software",name:"Software Development",mod:0},{id:"hardware",name:"Hardware Manufacturing",mod:.2},{id:"telecom",name:"Telecommunications",mod:.35}],Energy:[{id:"oil_gas",name:"Oil & Gas",mod:0},{id:"renewables",name:"Renewables",mod:.2},{id:"mining",name:"Mining",mod:.3}],Healthcare:[{id:"pharma",name:"Pharmaceuticals",mod:0},{id:"hospitals",name:"Hospital Systems",mod:.2},{id:"biotech",name:"Biotechnology",mod:.35}]};async function Hs(){const{data:o,error:e}=await y.from("nations").select("*").order("name");e&&console.warn("[Subsidiary] Failed to load nations:",e.message),It=(o||[]).filter(n=>n.id!==c?.nation_id);const{data:t}=await y.from("factions").select("nation_id").eq("faction_type","corporation").is("abandoned_at",null);Pt={};for(const n of t||[])n.nation_id&&(Pt[n.nation_id]=(Pt[n.nation_id]||0)+1);at=c?.corp_sector||"",qe=c?.corp_subsector||""}function ua(){const o=at||c?.corp_sector||"";return ma[o]||[{id:"general",name:o||"General",mod:0}]}function Gs(o){at=o;const e=ma[o];qe=e?e[0].name:"",io()}function va(){const o=c?.corp_sector||"";return at===o?1:fa[at]||4}function Vs(){const e=ua().find(t=>t.name===qe);return e?e.mod:0}function Nn(o){const e=Number(o.standard_of_living??50);return Math.max(.5,Math.round(e/50*100)/100)}function ya(o){const t=va(),n=1+Vs(),a=Nn(o);return Math.round(Math.max(1e7,5e7*t*n*a))}function Ws(o){const e=Pt[o]||0;return e<=1?{label:"HIGH",color:"#5c5"}:e<=3?{label:"MODERATE",color:"#ca5"}:{label:"LOW",color:"#c55"}}function Ys(o){if(ve=ve===o?null:o,ve){const e=It.find(t=>t.id===ve);it=(c?.faction_name||"Subsidiary")+" "+(e?.name||"")}else it="";io()}function Qs(o){qe=o,io()}function Ks(o){it=o}function Js(o){Qt=o.toUpperCase().slice(0,4)}async function Xs(){if(dn||!ve)return;const o=It.find(r=>r.id===ve);if(!o)return;const e=(it||"").trim(),t=(Qt||"").trim();if(!e){alert("Please enter a corporation name for the subsidiary.");return}if(t.length<2){alert("Please enter an abbreviation (2-4 chars).");return}if(G.find(r=>r.nation_id===o.id&&r.type==="regional_hq")){alert("You already have a subsidiary in "+o.name);return}const a=ya(o),i=Number(c?.corp_cash_reserves??0);if(a>i){alert("Insufficient cash. Entry cost: "+_(a)+", available: "+_(i));return}if(confirm("Establish subsidiary in "+o.name+`?

Name: `+e+" ("+t+`)
Subsector: `+(qe||"General")+`
Entry cost: `+_(a)+`
Creates a Regional HQ (500 capacity)
Unlocks `+o.name+` for operations

Deducted from cash reserves.`)){dn=!0;try{const s=(await y.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0,l=85+Math.floor(Math.random()*16),d=Math.round(a*.005),{error:f}=await y.from("corp_properties").insert({faction_id:c.id,nation_id:o.id,name:e,type:"regional_hq",style:"Modern",capacity:500,purchase_price:a,monthly_maintenance:d,condition:l,city:o.capital||o.name,purchased_at_tick:s,is_active:!0,subsector:qe||c?.corp_subsector||null});if(f)throw f;const p=Math.max(0,i-a);await y.from("factions").update({corp_cash_reserves:p}).eq("id",c.id),c.corp_cash_reserves=p,nt(p);const u=at||c?.corp_sector||"Unknown";try{await y.from("event_log").insert({nation_id:o.id,event_name:"New Subsidiary Established",category:"corporate",description_chosen:`${c.faction_name} has invested ${_(a)} to establish ${e}, a new ${u} corporation in ${o.name}.`,fired_at_tick:I?.current_tick||0})}catch{}try{const{data:m}=await y.from("nations").select("gdp_growth").eq("id",o.id).single();m&&await y.from("nations").update({gdp_growth:Math.min(100,Number(m.gdp_growth||50)+.2)}).eq("id",o.id)}catch{}ve=null,it="",Qt="",await oo(),alert('Subsidiary "'+e+'" established in '+o.name+`!

Cost: `+_(a)+`
Regional HQ created with `+l+"% condition.")}catch(r){alert("Failed: "+r.message)}finally{dn=!1}}}function io(){const o=document.getElementById("create-subsidiary-container");if(!o)return;const e="'JetBrains Mono', monospace",t={bg:"var(--bg-card)",surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},n=c?.corp_sector||"General",a=c?.corp_subsector||"",i=ua(),r=i.find(E=>E.name===qe)||i[0],s=new Set(G.filter(E=>E.type==="regional_hq").map(E=>E.nation_id)),l=It.filter(E=>!s.has(E.id)),d=ve?l.find(E=>E.id===ve):null,f=it.trim().length>0&&Qt.trim().length>=2&&d!==null,p=at||n,u=va();let m=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Sector</div>
        <div style="display:flex;gap:3px;">
            ${Us.map(E=>{const N=E===p,q=E===n,U=q?1:fa[E]||4,Q=q?t.greenBright:t.orange;return`<div onclick="subSetSector('${E}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${N?t.accent+"18":"transparent"};border:1px solid ${N?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${N?t.accentBright:t.dim}">${E}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${Q}">${q?"PARENT · ×1":"×"+U+" COST"}</div>
                </div>`}).join("")}
        </div>
        ${u>1?`<div style="font-family:${e};font-size:7px;color:${t.orange};margin-top:4px;padding:3px 6px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);">Cross-sector subsidiary: base cost ×${u}</div>`:""}
    </div>`,v=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsector</div>
        <div style="display:flex;gap:3px;">
            ${i.map(E=>{const N=E.name===qe,q=E.name===a;return`<div onclick="subSetSubsector('${E.name.replace(/'/g,"\\'")}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${N?t.accent+"18":"transparent"};border:1px solid ${N?t.accent+"44":t.border};">
                    <div style="font-family:${e};font-size:8px;font-weight:700;color:${N?t.accentBright:t.dim}">${E.name}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${q?t.greenBright:E.mod>0?t.orange:t.dim}">${q?"SAME — ±0%":E.mod>0?"+"+Math.round(E.mod*100)+"%":"±0%"}</div>
                </div>`}).join("")}
        </div>
    </div>`,x="";if(l.length===0)x=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Subsidiaries in all available nations.</div>`;else for(const E of l){const N=E.id===ve,q=Ws(E.id),U=Pt[E.id]||0,Q=Math.round(Number(E.standard_of_living??50)),H=Nn(E);x+=`
            <div onclick="subSelectNation('${E.id}')" style="display:flex;align-items:center;padding:4px 8px;margin-bottom:2px;cursor:pointer;background:${N?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${N?t.accent+"44":t.border};border-left:${N?"2px solid "+t.accent:"2px solid transparent"};">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:11px;font-weight:600;color:${N?t.text:t.muted}">${E.name}</span>
                        <span style="font-family:${e};font-size:7px;font-weight:700;padding:0 4px;color:${q.color};background:${q.color}12;border:1px solid ${q.color}25;line-height:12px">${q.label}</span>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:2px;">
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">STD/LIVING: <span style="color:${t.muted}">${Q}</span></span>
                        <span style="font-family:${e};font-size:7px;color:${t.dim}">CORPS: <span style="color:${U>=4?t.red:U>=2?t.yellow:t.greenBright}">${U}</span></span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${H>1?t.orange:t.greenBright}">×${H.toFixed(2)}</div>
                </div>
            </div>`}let g=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="margin-bottom:6px;">
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Corporation Name</div>
            <input type="text" value="${(it||"").replace(/"/g,"&quot;")}" oninput="subSetName(this.value)" placeholder="e.g., ${(c?.faction_name||"Corp")+" "+(d?.name||"International")}" style="width:100%;padding:5px 8px;font-family:${e};font-size:10px;color:${t.text};background:${t.card};border:1px solid ${t.border};outline:none;box-sizing:border-box;" />
        </div>
        <div>
            <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Abbreviation (2-4 chars)</div>
            <input type="text" value="${(Qt||"").replace(/"/g,"&quot;")}" oninput="subSetAbbr(this.value)" placeholder="${(c?.faction_name||"CORP").slice(0,2).toUpperCase()+(d?.name||"XX").slice(0,2).toUpperCase()}" maxlength="4" style="width:80px;padding:5px 8px;font-family:${e};font-size:12px;font-weight:700;color:${t.gold};background:${t.card};border:1px solid ${t.border};outline:none;text-align:center;letter-spacing:2px;" />
        </div>
    </div>`;const h=[{rule:"Bid on projects in that nation",icon:"✓",color:t.greenBright},{rule:"Hires local workers at nation rates",icon:"✓",color:t.greenBright},{rule:"Must use parent's materials & vehicles",icon:"!",color:t.orange},{rule:"Reputation gain: 75% sub / 25% parent",icon:"◐",color:t.gold},{rule:"Market revenue at 50% parent rate",icon:"◐",color:t.gold},{rule:"Counts as domestic corporation",icon:"✓",color:t.greenBright},{rule:"Starting reputation: 25",icon:"●",color:t.muted}];let w=`
    <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
        <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsidiary Rules</div>
        <div style="background:${t.card};border:1px solid ${t.border};padding:6px 8px;">
            ${h.map((E,N)=>`<div style="display:flex;align-items:center;gap:6px;padding:2px 0;${N<h.length-1?"border-bottom:1px solid "+t.border:""}">
                <span style="font-family:${e};font-size:9px;color:${E.color};width:12px;text-align:center">${E.icon}</span>
                <span style="font-size:9px;color:${t.muted}">${E.rule}</span>
            </div>`).join("")}
        </div>
    </div>`;const k=5e7,S=r.mod,z=d?Nn(d):null,$=d?ya(d):null,C=Math.round(k*u*(1+S));let A=`
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
            <span style="font-family:${e};font-size:9px;color:${S===0?t.greenBright:t.orange}">${S===0?"±0%":"+"+Math.round(S*100)+"%"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:8px;color:${t.dim}">NATION (${d?d.name:"select below"})</span>
            <span style="font-family:${e};font-size:9px;color:${d?z>1?t.orange:t.greenBright:t.dim}">${d?"×"+z.toFixed(2):"—"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:3px 0;">
            <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.text}">TOTAL COST</span>
            <span style="font-family:${e};font-size:14px;font-weight:700;color:${t.gold}">${d?_($):"~"+_(C)}</span>
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
            ${g}
            ${w}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            ${A}
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
    </div>`}window.subSelectNation=Ys;window.subCreate=Xs;window.subSetName=Ks;window.subSetAbbr=Js;window.subSetSector=Gs;window.subSetSubsector=Qs;let Dt=[],Qe=0,So=JSON.parse(localStorage.getItem("nationhood_investigated_corps")||"{}"),xe="ALL",Fe="REPUTATION";async function Zs(){const[o,e]=await Promise.all([y.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, corp_loans, corp_reputation, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name"),y.from("corp_properties").select("id, faction_id, name, nation_id, subsector, type, factions(faction_name, corp_sector, corp_ticker, abbreviation, corp_reputation, corp_company_type, linked_user_id)").eq("type","regional_hq").eq("is_active",!0)]),t={};for(const l of o.data||[])t[l.id]=l;const n=(o.data||[]).map(l=>l.id).filter(Boolean),a={};if(n.length){const{data:l}=await y.from("finance_active_loans").select("lender_faction_id, principal, remaining_principal, finance_loan_requests!inner(request_type)").in("lender_faction_id",n).in("status",["current","late","delinquent"]);for(const d of l||[]){const f=d.lender_faction_id;a[f]||(a[f]=[]),a[f].push(d)}}const i=(o.data||[]).map(l=>{const d=(l.corp_company_type||"Private").toUpperCase(),f=Number(l.corp_cash_reserves||0),p=Number(l.corp_loans||0),u=ki(a[l.id]||[]).total;return{...l,abbr:l.corp_ticker||l.abbreviation||l.faction_name?.slice(0,4).toUpperCase()||"???",status:d,isPlayer:!!l.linked_user_id,reputation:Math.round(Number(l.corp_reputation??50)),revenue:Math.round(f*.1),valuation:qn({cash:f,loans:p,financeReceivables:u}),_isSub:!1}}),{data:r}=await y.from("nations").select("id, name"),s={};(r||[]).forEach(l=>{s[l.id]=l.name});for(const l of e.data||[]){const d=t[l.faction_id];if(!d)continue;const f=(d.corp_company_type||"Private").toUpperCase();i.push({id:l.id,faction_name:l.name||"Subsidiary",abbreviation:d.abbreviation,corp_sector:d.corp_sector,corp_subsector:l.subsector||d.corp_subsector,corp_ticker:d.corp_ticker,nation_id:l.nation_id,nation:s[l.nation_id]||"?",abbr:(d.corp_ticker||d.abbreviation||"??").slice(0,4),status:f,isPlayer:!!d.linked_user_id,reputation:Math.round(Number(d.corp_reputation??50)),revenue:0,valuation:0,_isSub:!0,_parentName:d.faction_name})}Dt=i}function el(o){Qe=o,ao()}function tl(o){xe=o,Qe=0,ao()}function ol(o){Fe=o,Qe=0,ao()}async function nl(o){if(!c||!I)return;const e=Number(c.corp_cash_reserves??0);if(e<5e5){alert("Insufficient cash. Need $500k.");return}const{error:t}=await y.from("factions").update({corp_cash_reserves:e-5e5}).eq("id",c.id);if(t){alert("Failed: "+t.message);return}c.corp_cash_reserves=e-5e5,So[o]=!0,localStorage.setItem("nationhood_investigated_corps",JSON.stringify(So));const{data:n}=await y.from("factions").select("corp_cash_reserves, corp_loans, corp_reputation, corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce").eq("id",o).single();if(n){const a=Dt.find(i=>i.id===o);if(a){Object.assign(a,n);const i=Number(n.corp_cash_reserves||0),r=Number(n.corp_loans||0);let s=0;try{const{data:l}=await y.from("finance_active_loans").select("principal, remaining_principal, finance_loan_requests!inner(request_type)").eq("lender_faction_id",o).in("status",["current","late","delinquent"]);s=ki(l||[]).total}catch(l){console.warn("[corpInvestigate] receivable lookup failed:",l)}a.reputation=Math.round(Number(n.corp_reputation??50)),a.revenue=Math.round(i*.1),a.valuation=qn({cash:i,loans:r,financeReceivables:s})}}ao()}function ao(){const o=document.getElementById("corporations-container");if(!o)return;const e="'JetBrains Mono', monospace",t={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},n={PUBLIC:{color:t.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:t.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:t.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},a=[...new Set(Dt.map(m=>m.nation).filter(Boolean))];let i=[...Dt];xe!=="ALL"&&(i=i.filter(m=>m.nation===xe)),Fe==="REPUTATION"?i.sort((m,v)=>(v.reputation||0)-(m.reputation||0)):Fe==="REVENUE"?i.sort((m,v)=>(v.revenue||0)-(m.revenue||0)):Fe==="VALUATION"&&i.sort((m,v)=>(v.valuation||0)-(m.valuation||0)),Qe>=i.length&&(Qe=0);const r=i[Qe]||null;I?.current_tick;const s=r&&!!So[r.id],l=r&&r.status==="PRIVATE"&&!s,d=r&&r.status==="STATE";let f="";i.length===0&&(f=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">No corporations found.</div>`);for(let m=0;m<i.length;m++){const v=i[m],x=m===Qe,g=n[v.status]||n.PRIVATE,h=v.status==="PRIVATE"&&!So[v.id];f+=`
        <div onclick="corpSelect(${m})" style="display:flex;align-items:center;padding:7px 16px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${x?t.accent:"transparent"};background:${x?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:42px;font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${v.abbr}</span>
            <div style="flex:1.3;">
                <div style="font-size:11px;font-weight:600;color:${t.text};line-height:1.2">${v.faction_name}</div>
                <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:1px">${v._isSub?'<span style="color:#8a6aaa;">SUB</span> · ':""}${v.corp_subsector||v.corp_sector||"—"}</div>
            </div>
            <span style="width:62px"><span style="font-family:${e};font-size:8px;padding:1px 5px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(v.nation||"—").toUpperCase().slice(0,6)}</span></span>
            <span style="width:56px;font-family:${e};font-size:9px;font-weight:700;color:${h?t.dim:t.muted};text-align:right">${h?"—":_(v.revenue)}</span>
            <span style="width:34px;font-family:${e};font-size:10px;font-weight:700;color:${v.reputation>=70?t.greenBright:v.reputation>=40?t.accent:t.yellow};text-align:right">${v.reputation}</span>
            <span style="width:56px;font-family:${e};font-size:9px;color:${h?t.dim:t.muted};text-align:right">${h?"—":_(v.valuation)}</span>
            <span style="width:48px;text-align:center"><span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${g.color};background:${g.bg};border:1px solid ${g.border}">${v.status}</span></span>
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
        ${v.map(x=>`<div style="display:flex;justify-content:space-between;padding:5px 16px;border-bottom:1px solid ${t.border};">
            <span style="font-family:${e};font-size:10px;color:${t.dim};text-transform:uppercase">${x.label}</span>
            <span style="font-family:${e};font-size:11px;font-weight:700;color:${x.value==="UNDISCLOSED"?t.dim:x.color};${x.value==="UNDISCLOSED"?"font-style:italic;":""}">${x.value}</span>
        </div>`).join("")}
        <div style="padding:6px 14px;border-bottom:1px solid ${t.border};flex-shrink:0;">
            <div style="width:100%;height:4px;background:${t.border}"><div style="width:${r.reputation}%;height:100%;background:${r.reputation>=70?t.greenBright:r.reputation>=40?t.accent:t.yellow}"></div></div>
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
                <div onclick="${l?`corpInvestigate('${r.id}')`:""}" style="flex:1;padding:5px 0;text-align:center;cursor:${l?"pointer":"default"};font-family:${e};font-size:8px;font-weight:700;color:${l?t.blue:s?t.greenBright:t.dim};border:1px solid ${l?t.blue+"44":s?t.greenBright+"44":t.border};opacity:${l?1:.3}">${s?"INVESTIGATED ✓":"INVESTIGATE — $500k"}</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;color:${t.accent};border:1px solid ${t.accent}44">PARTNER</div>
            </div>
            <div style="display:flex;gap:4px;">
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${d?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${d?t.dim:t.gold};border:1px solid ${d?t.border:t.gold+"44"};opacity:${d?.3:1}">ACQUIRE</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${d?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${d?t.dim:t.orange};border:1px solid ${d?t.border:t.orange+"44"};opacity:${d?.3:1}">MERGER</div>
            </div>
            ${d?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${t.dim}">State-owned corps cannot be acquired or merged.</div>`:""}
        </div>`}else p=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${t.dim}">Select a corporation to view details.</div>`;const u=`
    <div style="padding:6px 16px;border-bottom:1px solid ${t.border};background:${t.card};display:flex;gap:12px;align-items:center;flex-shrink:0;">
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px;width:40px">NATION</span>
            <span onclick="corpFilterNation('ALL')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${xe==="ALL"?"#000":t.dim};background:${xe==="ALL"?t.accent:"transparent"};border:1px solid ${xe==="ALL"?t.accent:t.border}">ALL</span>
            ${a.map(m=>`<span onclick="corpFilterNation('${m}')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${xe===m?"#000":t.dim};background:${xe===m?t.accent:"transparent"};border:1px solid ${xe===m?t.accent:t.border}">${m}</span>`).join("")}
        </div>
        <div style="flex:1"></div>
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px">SORT</span>
            ${["REPUTATION","REVENUE","VALUATION"].map(m=>`<span onclick="corpSort('${m}')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${Fe===m?"#000":t.dim};background:${Fe===m?t.accent:"transparent"};border:1px solid ${Fe===m?t.accent:t.border}">${m}</span>`).join("")}
        </div>
    </div>`;o.innerHTML=`
    <div style="width:760px;height:450px;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${t.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${t.muted};text-transform:uppercase">Corporations</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${t.dim}">${Dt.length} IN DATABASE</span>
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
    </div>`}window.corpSelect=el;window.corpInvestigate=nl;window.corpFilterNation=tl;window.corpSort=ol;let de=null,Me={},J=120,Ae=15,In={},yt=[],Ke=[],Et={};async function il(){if(!Ze)return;if(Ct[Ze.id]){alert("You already have a bid on this contract. Retract it first if you want to re-bid.");return}de=Ze,In={};try{const{data:t}=await y.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",c.id);for(const n of t||[])In[xo(n.material_key)]=Number(n.quantity||0)}catch{}yt=[];try{const{data:t}=await y.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",de.id).in("status",["pending","won"]);yt=(t||[]).filter(n=>n.faction_id!==c?.id).map(n=>({name:n.factions?.faction_name||"Unknown",ticker:n.factions?.corp_ticker||"???",price:Number(n.bid_price||0),quality:Number(n.estimated_quality||0),status:n.status}))}catch{}Ke=[],Et={};try{const{data:t,error:n}=await y.rpc("get_project_permit_requirements",{p_contract_id:de.id,p_faction_id:c.id,p_nation_id:de.nation_id});if(n)throw n;Ke=Array.isArray(t)?t:[];const a=Ke.map(i=>i.permit_key).filter(Boolean);if(a.length>0){const{data:i,error:r}=await y.from("construction_permits").select("permit_key, cost, processing_ticks").in("permit_key",a);if(r)throw r;for(const s of i||[])Et[s.permit_key]={cost:Number(s.cost||0),ticks:Number(s.processing_ticks||0)}}}catch(t){console.warn("Failed to load project permit requirements",t),Ke=[],Et={}}Me={};const o=de.required_materials||{};for(const t of Object.keys(o))Me[t]="STD";const e=de.required_workforce||{};J=Number(e.general||0)+Number(e.skilled||0)||120,Ae=15,Zt(),Uo()}function ii(){document.getElementById("bid-assembly-overlay")?.remove(),de=null,Ke=[],Et={}}function al(o,e){Me[o]=e,Uo()}function rl(o){J=o,Uo()}function sl(o){Ae=o,Uo()}function Uo(){if(document.getElementById("bid-assembly-overlay")?.remove(),!de)return;const o="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},t=de,n=t.issuer_type==="GOVERNMENT",a=M?.name||c?.nation||"—",i=Number(t.budget_ceiling||0),r=Number(t.timeline_ticks||8),s=t.required_materials||{},l=Object.keys(s),d={LOW:.5,STD:1,HIGH:2},f={LOW:e.orange,STD:e.yellow,HIGH:e.greenBright},p={LOW:"Low",STD:"Standard",HIGH:"High"},u={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},m=In||{};let v=0,x="";for(const O of l){const V=Number(s[O]||0),si=Me[O]||"STD",li=u[O]||3e5,ka=d[si],Ea=Math.round(li*ka),di=V*Ea;v+=di;const Ca=O.replace(/_/g," ").replace(/\b\w/g,Be=>Be.toUpperCase()),ci=Number(m[O]||0),Vo=Math.max(0,V-ci),Ta=Vo===0?e.greenBright:Vo<V?e.yellow:e.red,Sa=Vo===0?"✓ IN STOCK":`${ci}/${V}`;x+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${e.text}">${Ca}</span>
                <div style="font-family:${o};font-size:7px;color:${Ta};margin-top:1px">${Sa}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${o};font-size:9px;color:${e.muted}">${V.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(Be=>{const Wo=si===Be,pi=f[Be],za=_(Math.round(li*d[Be]));return`<span onclick="bidSetGrade('${O}','${Be}')" style="padding:2px 6px;font-family:${o};font-size:7px;font-weight:700;cursor:pointer;color:${Wo?"#000":e.dim};background:${Wo?pi:"transparent"};border:1px solid ${Wo?pi:e.border}" title="${za}/unit">${p[Be]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${o};font-size:10px;color:${e.text}">${_(di)}</span></div>
        </div>`}const g=t.required_workforce||{},h=Number(g.general||0)+Number(g.skilled||0)||100,w=Math.max(40,Math.round(h*.5)),k=h*2,S=[w,Math.round(h*.75),h,Math.round(h*1.5),k],z=Math.max(0,Math.min(1,(J-w)/(k-w||1))),$=r,C=Math.round(4.5-z*8),A=Math.max(Math.round($*.6),$+C),E=C>0?`+${C}mo`:C<0?`${C}mo`:"On schedule",N=C>0?e.red:C<0?e.greenBright:e.yellow,q=15200,U=J*q*A,Q=(Ke||[]).map(O=>{const V=Et[O.permit_key]||{};return{permit_key:O.permit_key,name:O.permit_name||O.permit_key,requiredByPolicy:O.required_by_policy||"—",hasPermit:!!O.has_permit,statusLabel:O.status_label||(O.has_permit?"HAS_PERMIT":"NEEDS_TO_GET"),cost:Number(V.cost||0),ticks:Number(V.ticks||0)}}),H=Q.filter(O=>!O.hasPermit).reduce((O,V)=>O+V.cost,0),oe=4e5,B=v+U+H+oe,T=Math.round(B*(Ae/100)),j=B+T,P=j>i,F=T,K=P?0:Math.max(0,Math.min(100,Math.round(100-j/i*100+30))),Oe=K>70?e.greenBright:K>40?e.yellow:K>0?e.orange:e.red,Go=P?"OVER CEILING":K>70?"STRONG":K>40?"COMPETITIVE":K>20?"WEAK":"UNLIKELY",pe=Object.values(Me),ge=pe.length>0?Math.round(pe.reduce((O,V)=>O+(V==="HIGH"?85:V==="STD"?65:45),0)/pe.length):50,ro=ge>=75?e.greenBright:ge>=50?e.yellow:ge>=25?e.orange:e.red,wa=ge>=75?"EXCELLENT":ge>=50?"FAIR":ge>=25?"POOR":"BAD",lt=document.createElement("div");lt.id="bid-assembly-overlay",lt.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",lt.addEventListener("click",O=>{O.target===lt&&ii()}),lt.innerHTML=`
    <div style="width:740px;max-height:94vh;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <!-- HEADER -->
        <div style="padding:10px 16px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${o};font-size:8px;font-weight:700;padding:2px 8px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${a.toUpperCase()}</span>
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
                <span style="font-family:${o};font-size:9px;color:${e.muted}">Ceiling: <span style="color:${e.text};font-weight:700">${_(i)}</span></span>
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
                            ${S.map(O=>`<span onclick="bidSetWorkers(${O})" style="padding:2px 8px;font-family:${o};font-size:8px;font-weight:700;cursor:pointer;color:${J===O?"#000":e.dim};background:${J===O?e.accent:"transparent"};border:1px solid ${J===O?e.accent:e.border}">${O}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">${J} × $${q.toLocaleString()}/tick × ${A} ticks</span>
                        <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(U)}</span>
                    </div>
                    <div style="margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <span style="font-family:${o};font-size:8px;color:${e.dim}">WORKFORCE REQUIRED</span>
                        </div>
                        <div style="display:flex;gap:12px;">
                            <span style="font-family:${o};font-size:7px;color:#8b9a6b">General: ${Math.ceil(J*.8)}</span>
                            <span style="font-family:${o};font-size:7px;color:#c8a832">Skilled: ${Math.ceil(J*.15)}</span>
                            <span style="font-family:${o};font-size:7px;color:#c84">Innovative: ${Math.ceil(J*.05)}</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">COMPLETION TIMELINE</span>
                        <span style="font-family:${o};font-size:10px;font-weight:700;color:${N}">${A}mo <span style="font-size:8px;opacity:0.7">(${E})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${Q.length===0?`<div style="padding:8px 14px;border-bottom:1px solid ${e.border};font-family:${o};font-size:8px;color:${e.dim};">No active permit laws apply to this project.</div>`:""}
                ${Q.map(O=>{const V=O.hasPermit;return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
                        <div style="flex:1;display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${o};font-size:8px;font-weight:700;color:${V?e.greenBright:e.orange}">${V?"✓":"○"}</span>
                            <span style="font-size:10px;color:${V?e.muted:e.text}">${O.name}</span>
                        </div>
                        ${V?`<span style="font-family:${o};font-size:8px;color:${e.greenBright}">${O.statusLabel}</span>`:`<div style="text-align:right">
                                <span style="font-family:${o};font-size:9px;color:${e.redDim}">${_(O.cost)}</span>
                                <span style="font-family:${o};font-size:7px;color:${e.dim};margin-left:4px">${O.ticks}t</span>
                            </div>`}
                    </div><div style="padding:0 14px 4px 28px;border-bottom:1px solid ${e.border};font-family:${o};font-size:7px;color:${e.dim};">Required by: ${b(O.requiredByPolicy)}</div>`}).join("")}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${o};font-size:9px;color:${e.muted}">PERMIT COSTS</span>
                    <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.text}">${_(H)}</span>
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
                ${[{l:"Materials",v},{l:"Labor",v:U},{l:"Permits",v:H},{l:"Overhead",v:oe}].map(O=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
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
                        <span style="font-family:${o};font-size:16px;font-weight:700;color:${e.gold}">${Ae}%</span>
                    </div>
                    <input type="range" min="0" max="40" step="1" value="${Ae}" oninput="bidSetMarkup(+this.value)" style="width:100%;accent-color:${e.gold};height:6px;" />
                    <div style="display:flex;justify-content:space-between;font-family:${o};font-size:7px;color:${e.dim};margin-top:2px;">
                        <span>0% (at cost)</span><span>40% (maximum)</span>
                    </div>
                </div>

                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${P?"rgba(204,85,85,0.04)":"rgba(200,168,50,0.03)"};">
                    <div style="font-family:${o};font-size:8px;color:${e.dim};margin-bottom:4px">YOUR BID PRICE</div>
                    <div style="font-family:${o};font-size:22px;font-weight:700;color:${P?e.red:e.gold}">${_(j)}</div>
                    ${P?`<div style="font-family:${o};font-size:8px;font-weight:700;color:${e.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${_(i)})</div>`:""}
                </div>

                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">PROJECTED PROFIT</span>
                        <span style="font-family:${o};font-size:14px;font-weight:700;color:${F>0?e.greenBright:e.dim}">+${_(F)}</span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Bid Assessment</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">COMPETITIVENESS</span>
                        <span style="font-family:${o};font-size:11px;font-weight:700;color:${Oe}">${Go}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${K}%;height:100%;background:${Oe}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${o};font-size:11px;font-weight:700;color:${ro}">${ge}</span>
                            <span style="font-family:${o};font-size:8px;color:${e.dim}">/100</span>
                            <span style="font-family:${o};font-size:8px;font-weight:700;color:${ro}">${wa}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${ge}%;height:100%;background:${ro}"></div></div>
                    <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="font-family:${o};font-size:8px;color:${e.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${yt.length===0?`<div style="font-family:${o};font-size:8px;color:${e.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${yt.map(O=>`<span style="padding:2px 6px;font-family:${o};font-size:7px;color:${e.muted};background:${e.card};border:1px solid ${e.border};">${O.name} <span style="color:${e.dim}">Q:${O.quality}</span></span>`).join("")}
                        </div>
                        <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:3px">${yt.length} competing bid${yt.length!==1?"s":""}. Bid prices are sealed until resolution.</div>`}
                    <div style="font-family:${o};font-size:7px;color:${e.dim};margin-top:3px">Higher reputation bidders may win at higher prices.</div>
                </div>
                <div style="flex:1"></div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">YOUR BID</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${P?e.red:e.gold}">${_(j)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">EST. PROFIT</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${e.greenBright}">+${_(F)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${o};font-size:14px;font-weight:700;color:${ro}">${ge}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${o};font-size:10px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="${P?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${o};font-size:10px;font-weight:700;letter-spacing:1px;color:${P?e.dim:"#000"};background:${P?e.border:e.gold};cursor:${P?"not-allowed":"pointer"};opacity:${P?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(lt)}let cn=!1;async function ll(){if(cn||!de)return;const o=de,e=o.required_materials||{},t=Object.keys(e),n=Number(o.budget_ceiling||0),a=Number(o.timeline_ticks||8),i={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},r={LOW:.5,STD:1,HIGH:2};let s=0;for(const A of t){const E=Number(e[A]||0),N=Me[A]||"STD",q=i[A]||3e5;s+=E*Math.round(q*r[N])}const l=15200,d=o.required_workforce||{},f=Number(d.general||0)+Number(d.skilled||0)||100,p=Math.max(40,Math.round(f*.5)),u=f*2,m=Math.max(0,Math.min(1,(J-p)/(u-p||1))),v=Math.round(4.5-m*8),x=Math.max(Math.round(a*.6),a+v),g=J*l*x,h=(Ke||[]).filter(A=>!A.has_permit).reduce((A,E)=>A+Number(Et[E.permit_key]?.cost||0),0),k=s+g+h+4e5,S=Math.round(k*(Ae/100)),z=k+S;if(z>n){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const $=Object.values(Me),C=$.length>0?Math.round($.reduce((A,E)=>A+(E==="HIGH"?85:E==="STD"?65:45),0)/$.length):50;if(confirm('Submit bid for "'+o.name+`"?

Bid Price: `+_(z)+`
Est. Cost: `+_(k)+`
Markup: `+Ae+"% ("+_(S)+`)
Quality: `+C+`/100
Workers: `+J+`

Once submitted, your bid cannot be changed.`)){cn=!0;try{const{data:A}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),E=A?.current_tick||0,N={};for(const U of t)N[U]=Me[U]||"STD";const{error:q}=await y.from("contract_bids").insert({contract_id:o.id,faction_id:c.id,bid_price:z,material_grades:N,labor_count:J,markup_pct:Ae,estimated_cost:k,estimated_quality:C,status:"pending",submitted_at_tick:E});if(q)throw q;o.status==="open"&&await y.from("construction_contracts").update({status:"bidding"}).eq("id",o.id).eq("status","open"),ii(),alert(`Bid submitted successfully!

Contract: `+o.name+`
Your Bid: `+_(z)+`
Quality: `+C+`/100

Bids will be resolved when the bidding window closes (`+(o.bidding_ends_tick?"tick "+o.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof Re=="function"&&await Re()}catch(A){alert("Bid submission failed: "+A.message)}finally{cn=!1}}}window.openBidAssembly=il;window.closeBidAssembly=ii;window.bidSetGrade=al;window.bidSetWorkers=rl;window.bidSetMarkup=sl;window.submitBidAssembly=ll;let pn=!1;async function dl(o){if(pn)return;const e=1e6,t=Number(c?.corp_cash_reserves??0);if(t<e){alert("Cannot retract — you need at least $1M in cash reserves to cover the retraction penalty.");return}if(confirm(`Retract your bid?

This will cost $1M as a retraction penalty.
This action cannot be undone.`)){pn=!0;try{const n=t-e,{error:a}=await y.from("factions").update({corp_cash_reserves:n}).eq("id",c.id);if(a)throw a;const{error:i}=await y.from("contract_bids").delete().eq("contract_id",o).eq("faction_id",c.id);if(i)throw i;c.corp_cash_reserves=n,typeof nt=="function"&&nt(n),alert("Bid retracted. $1M penalty applied."),Zt(),await Re()}catch(n){alert("Failed to retract bid: "+(n.message||"Unknown error"))}finally{pn=!1}}}window.retractBid=dl;let Kt=[],Je=0,ye=null,fn=!1,mn=!1,un=!1;async function cl(){if(!Ze||mn)return;mn=!0,ye=Ze,Je=0;const{data:o,error:e}=await y.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",ye.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(mn=!1,e){alert("Failed to load bids: "+e.message);return}Kt=(o||[]).map(t=>({...t,corp:t.factions?.faction_name||"Unknown",abbr:t.factions?.corp_ticker||"???",subsector:t.factions?.corp_subsector||"—"})),Zt(),ga()}function Ho(){document.getElementById("bid-review-overlay")?.remove(),ye=null}function pl(o){Je=o,ga()}async function fl(){if(fn||Kt.length===0)return;const o=Kt[Je];if(!(!o?.id||!o.faction_id)&&confirm("Accept bid from "+o.corp+`?

Bid Price: `+_(o.bid_price)+`
Quality: `+o.estimated_quality+`/100
Workers: `+o.labor_count+`

This will award the contract. The project begins immediately.`)){fn=!0;try{const{data:e}=await y.from("shard").select("current_tick").eq("name","Alpha Shard").single(),t=e?.current_tick||0,{error:n}=await y.from("contract_bids").update({status:"won"}).eq("id",o.id);if(n)throw n;const{error:a}=await y.from("contract_bids").update({status:"lost"}).eq("contract_id",ye.id).neq("id",o.id);if(a)throw a;const{error:i}=await y.from("construction_contracts").update({status:"awarded",awarded_to_faction:o.faction_id,awarded_at_tick:t}).eq("id",ye.id);if(i)throw i;Ho(),alert("Contract awarded to "+o.corp+`!

Bid: `+_(o.bid_price)+`
Project begins immediately.`),typeof Re=="function"&&await Re()}catch(e){alert("Failed to accept bid: "+(e.message||e))}finally{fn=!1}}}async function ml(){if(!(!ye||un)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){un=!0;try{const{error:o}=await y.from("contract_bids").update({status:"lost"}).eq("contract_id",ye.id);if(o)throw o;const{error:e}=await y.from("construction_contracts").update({status:"expired"}).eq("id",ye.id);if(e)throw e;Ho(),alert("All bids declined. Contract cancelled."),typeof Re=="function"&&await Re()}catch(o){alert("Failed: "+(o.message||o))}finally{un=!1}}}function ga(){if(document.getElementById("bid-review-overlay")?.remove(),!ye||Kt.length===0)return;const o="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},t=ye,n=Kt;Je>=n.length&&(Je=0);const a=n[Je],i=Number(t.budget_ceiling||0),r=Number(t.timeline_ticks||36),s=Math.min(...n.map(m=>m.bid_price)),l=Math.max(...n.map(m=>m.estimated_quality||0));let d="";for(let m=0;m<n.length;m++){const v=n[m],x=m===Je,g=v.bid_price===s,h=(v.estimated_quality||0)===l,w=v.bid_price>i;d+=`
        <div onclick="reviewSelectBid(${m})" style="padding:10px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${x?e.accent:"transparent"};background:${x?"rgba(139,154,107,0.03)":"transparent"};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-family:${o};font-size:10px;font-weight:700;color:${e.gold}">${v.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${e.text}">${v.corp}</span>
                ${g?`<span style="font-family:${o};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.greenBright};background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2)">CHEAPEST</span>`:""}
                ${h?`<span style="font-family:${o};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.2)">BEST QUALITY</span>`:""}
            </div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};">
                <div style="flex:1.2;padding:5px 10px;border-right:1px solid ${e.border}">
                    <div style="font-family:${o};font-size:7px;color:${e.dim}">BID PRICE</div>
                    <div style="font-family:${o};font-size:14px;font-weight:700;color:${w?e.red:e.text}">${_(v.bid_price)}</div>
                    ${w?`<div style="font-family:${o};font-size:7px;color:${e.red}">OVER BUDGET</div>`:""}
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
        </div>`}const f=a.bid_price>i,p=i>0?Math.round(a.bid_price/i*100):0,u=document.createElement("div");u.id="bid-review-overlay",u.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",u.addEventListener("click",m=>{m.target===u&&Ho()}),u.innerHTML=`
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
                <span>Budget: <span style="color:${e.text};font-weight:700">${_(i)}</span></span>
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
                ${d}
            </div>
            <div style="width:250px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-family:${o};font-size:11px;font-weight:700;color:${e.gold}">${a.abbr}</span>
                        <span style="font-size:12px;font-weight:700;color:${e.text}">${a.corp}</span>
                    </div>
                    <div style="font-family:${o};font-size:8px;color:${e.dim};margin-top:2px">${a.subsector}</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <span style="font-family:${o};font-size:8px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Breakdown</span>
                </div>
                ${[{l:"Materials",v:Number(a.estimated_cost||0)*.45},{l:"Labor",v:Number(a.estimated_cost||0)*.45},{l:"Overhead",v:Number(a.estimated_cost||0)*.1}].map(m=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${o};font-size:9px;color:${e.dim};text-transform:uppercase">${m.l}</span>
                    <span style="font-family:${o};font-size:10px;color:${e.muted}">${_(Math.round(m.v))}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:${f?"rgba(204,85,85,0.03)":"rgba(200,168,50,0.03)"};">
                    <span style="font-family:${o};font-size:9px;font-weight:700;color:${e.text}">TOTAL BID</span>
                    <span style="font-family:${o};font-size:14px;font-weight:700;color:${f?e.red:e.gold}">${_(a.bid_price)}</span>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:${o};font-size:8px;color:${e.dim}">vs. YOUR BUDGET</span>
                        <span style="font-family:${o};font-size:9px;font-weight:700;color:${f?e.red:e.greenBright}">${f?"OVER":"WITHIN"} — ${p}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${e.border}"><div style="width:${Math.min(100,p)}%;height:100%;background:${f?e.red:e.accent}"></div></div>
                </div>
                ${[{l:"Quality",v:a.estimated_quality+"/100",c:(a.estimated_quality||0)>=75?e.greenBright:(a.estimated_quality||0)>=55?e.yellow:e.orange},{l:"Markup",v:a.markup_pct+"%",c:e.muted},{l:"Workers",v:a.labor_count+" workers",c:e.text}].map(m=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${o};font-size:9px;color:${e.dim};text-transform:uppercase">${m.l}</span>
                    <span style="font-family:${o};font-size:10px;font-weight:700;color:${m.c}">${m.v}</span>
                </div>`).join("")}
                <div style="flex:1"></div>
            </div>
        </div>
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">SELECTED BID</div><div style="font-family:${o};font-size:12px;font-weight:700;color:${e.gold}">${_(a.bid_price)}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">CORPORATION</div><div style="font-family:${o};font-size:12px;font-weight:700;color:${e.text}">${a.corp}</div></div>
                <div><div style="font-family:${o};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${o};font-size:12px;font-weight:700;color:${(a.estimated_quality||0)>=75?e.greenBright:e.yellow}">${a.estimated_quality}</div></div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="declineAllBids()" style="padding:6px 16px;font-family:${o};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">DECLINE ALL</div>
                <div onclick="acceptBid()" style="padding:6px 20px;font-family:${o};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${e.accent};cursor:pointer">ACCEPT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(u)}const St={Coastal:{color:"#8b9a6b",label:"COASTAL"},Container:{color:"#5a7aaa",label:"CONTAINER"},Bulk:{color:"#c8a832",label:"BULK"},Tanker:{color:"#c86a4a",label:"TANKER"},Reefer:{color:"#6a9a5a",label:"REEFER"},LNG:{color:"#c55",label:"LNG"}},ul={in_port:{color:"#8b9a6b",label:"IN PORT"},in_transit:{color:"#5a8aaa",label:"IN TRANSIT"},dry_dock:{color:"#c84",label:"DRY DOCK"},anchored:{color:"#ca5",label:"ANCHORED"},for_sale:{color:"#9e9a92",label:"FOR SALE"}};function xa(o){return o>=75?"#5c5":o>=50?"#ca5":o>=25?"#c84":"#c55"}function vl(o){return o>=60?"#5c5":o>=30?"#ca5":o>=15?"#c84":"#c55"}async function $e(){if(!c||c.corp_sector!=="Shipping")return;const{data:o,error:e}=await y.from("corp_vessels").select("*").eq("faction_id",c.id).order("vessel_class");e&&console.warn("Failed to load fleet:",e.message),he=o||[],Vt=null,qt={},_o={};try{const t=he.map(n=>n.id);if(t.length>0){const{data:n}=await y.from("finance_active_loans").select("insured_vessel_id").in("insured_vessel_id",t).in("status",["current"]);for(const i of n||[])i.insured_vessel_id&&(qt[i.insured_vessel_id]=!0);const{data:a}=await y.from("finance_loan_requests").select("insured_vessel_id").eq("requesting_faction_id",c.id).eq("request_type","insurance").eq("status","open").not("insured_vessel_id","is",null);for(const i of a||[])i.insured_vessel_id&&!qt[i.insured_vessel_id]&&(_o[i.insured_vessel_id]=!0)}}catch(t){console.warn("Failed to load vessel insurance status:",t.message)}ba()}function yl(o){Vt=Vt===o?null:o,ba()}function ba(){const o=document.getElementById("fl-count"),e=document.getElementById("fl-summary"),t=document.getElementById("fl-list"),n=document.getElementById("fl-footer");if(!o||!t)return;const a=he;o.textContent=a.length+" VESSEL"+(a.length!==1?"S":"");const i=a.filter(p=>p.status==="in_transit").length,r=a.filter(p=>p.status==="in_port"||p.status==="anchored").length,s=a.filter(p=>p.status==="dry_dock").length,l=a.reduce((p,u)=>p+(u.base_maintenance||0),0);e.innerHTML=[{label:"TRANSIT",value:i,color:"#5a8aaa"},{label:"IN PORT",value:r,color:"#8b9a6b"},{label:"DRY DOCK",value:s,color:"#c84"},{label:"MAINT/TICK",value:_(l),color:"#a44"}].map((p,u)=>`<div style="flex:1;padding:5px 8px;text-align:center;${u<3?"border-right:1px solid var(--border-0);":""}">
        <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">${p.label}</div>
        <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${p.color};margin-top:1px;">${p.value}</div>
    </div>`).join(""),a.length===0?t.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels in fleet.<br>Purchase ships to begin operations.</div>':t.innerHTML=a.map((p,u)=>{const m=Vt===u,v=St[p.vessel_class]||{color:"#666",label:"?"},x=ul[p.status]||{color:"#666",label:"?"},g=xa(p.condition),h=vl(p.fuel),w=p.condition<50||p.fuel<20,k=p.status==="in_transit",S=p.status==="dry_dock",z=I?.current_tick||0,$=Math.max(0,Math.floor((z-(p.built_at_tick||0))/12));let C=`<div onclick="flSelectVessel(${u})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${w?p.condition<50?g:h:"transparent"};background:${m?v.color+"06":"transparent"};">
                <div style="padding:7px 14px;">`;C+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(p.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${v.color};background:${v.color}12;border:1px solid ${v.color}25;">${v.label}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${x.color};background:${x.color}12;border:1px solid ${x.color}25;">${x.label}</span>
            </div>`;const A=p.current_port_nation_id?"In port":k?"At sea":"—";if(C+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:5px;">${b(A)}</div>`,C+=`<div style="display:flex;gap:8px;margin-bottom:4px;">
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${g};">${p.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${p.condition}%;height:100%;background:${g};"></div></div>
                </div>
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">FUEL</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${h};">${p.fuel}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${p.fuel}%;height:100%;background:${h};"></div></div>
                </div>
            </div>`,C+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);margin-top:1px;">${(p.capacity_dwt||0).toLocaleString()} ${p.capacity_unit||"DWT"}</div>
                </div>
                <div style="flex:0.7;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">AGE</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${$}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#a44;margin-top:1px;">${_(p.base_maintenance)}</div>
                </div>
            </div>`,S&&p.drydock_until_tick){const E=Math.max(0,p.drydock_until_tick-z);C+=`<div style="margin-top:4px;padding:3px 8px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">DRY DOCK REPAIRS</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c84;">${E} tick${E!==1?"s":""} remaining</span>
                </div>`}if(m){C+=`<div style="margin-top:6px;">
                    <div style="padding:5px 8px;background:var(--bg-0);border:1px solid var(--border-0);margin-bottom:6px;">`;const E=[{label:"VESSEL CLASS",value:p.vessel_class},{label:"BUILT",value:"Tick "+(p.built_at_tick||0)},{label:"FUEL CAPACITY",value:(p.fuel_capacity||0).toLocaleString()+" tons"},{label:"LAST REFURBISH",value:p.last_refurbish_tick?"Tick "+p.last_refurbish_tick:"N/A"}];for(let H=0;H<E.length;H++)C+=`<div style="display:flex;justify-content:space-between;padding:2px 0;${H<3?"border-bottom:1px solid var(--border-0);":""}">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${E[H].label}</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);">${E[H].value}</span>
                    </div>`;C+="</div>";const N=k||S,q=Math.round((p.purchase_price||3e6)*.08*(1+(100-p.condition)/100)),U=Math.round((p.fuel_capacity||1e3)*50*(1-p.fuel/100)),Q=Math.round((p.purchase_price||3e6)*(p.condition/100)*.6);if(C+=`<div style="display:flex;gap:4px;">
                    <div onclick="${N?"":"flRefurbish('"+p.id+"',"+q+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${N?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${N?"var(--text-dim)":"#5c5"};border:1px solid ${N?"var(--border-0)":"#2a5a3a"};background:${N?"transparent":"rgba(74,170,136,0.06)"};opacity:${N?.35:1};">REFURBISH<br><span style="font-weight:400;font-size:6px;">${_(q)}</span></div>
                    <div onclick="${k?"":"flRefuel('"+p.id+"',"+U+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${k?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${k?"var(--text-dim)":"#c86a4a"};border:1px solid ${k?"var(--border-0)":"rgba(200,106,74,0.3)"};opacity:${k?.35:1};">REFUEL<br><span style="font-weight:400;font-size:6px;">from ${_(U)}</span></div>
                    <div onclick="${N?"":"flSell('"+p.id+"','"+b(p.vessel_name).replace(/'/g,"")+"',"+Q+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${N?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${N?"var(--text-dim)":"#c84"};border:1px solid ${N?"var(--border-0)":"rgba(204,136,68,0.3)"};opacity:${N?.35:1};">LIST<br><span style="font-weight:400;font-size:6px;">${_(Q)}</span></div>
                </div>`,!k){const H=qt&&qt[p.id],oe=_o&&_o[p.id];C+='<div style="display:flex;gap:4px;margin-top:4px;">',H?C+=`<div style="flex:1;display:flex;gap:2px;">
                            <div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#5c5;border:1px solid rgba(92,204,92,0.2);background:rgba(92,204,92,0.04);">INSURED ✓</div>
                            <div onclick="event.stopPropagation();flFileClaim('${p.id}','${b(p.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#c55;border:1px solid rgba(204,85,85,0.2);background:rgba(204,85,85,0.04);">FILE CLAIM</div>
                        </div>`:oe?C+='<div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#ca5;border:1px solid rgba(202,165,50,0.2);background:rgba(202,165,50,0.04);">PENDING ⏳</div>':C+=`<div onclick="event.stopPropagation();flRequestInsurance('${p.id}','${b(p.vessel_name).replace(/'/g,"")}',${p.purchase_price||0})" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#aa7a5a;border:1px solid rgba(170,122,90,0.3);background:rgba(170,122,90,0.04);">INSURE</div>`,C+=`<div onclick="flRename('${p.id}','${b(p.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:var(--text-muted);border:1px solid var(--border-0);">RENAME</div>`,C+="</div>"}k&&(C+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel at sea — actions available on arrival</div>'),S&&(C+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel in dry dock — repairs in progress</div>'),C+="</div>"}return C+="</div></div>",C}).join("");const d={};for(const p of a)d[p.vessel_class]=(d[p.vessel_class]||0)+1;let f='<div style="display:flex;gap:6px;">';for(const[p,u]of Object.entries(St))d[p]&&(f+=`<div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:${u.color};border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">${u.label}</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${d[p]}</span>
        </div>`);f+="</div>",f+=`<span style="font-family:var(--font-mono);font-size:8px;color:#a44;">${_(l)}/tick</span>`,n.innerHTML=f}let ie=!1;async function gl(o,e){if(ie||!c)return;const t=(he||[]).find(m=>m.id===o);if(!t)return;const n=t.current_port_nation_id||null;let a="state",i=3,r=3,s=null,l="State Dry Dock (3x cost, 3 ticks)";if(n){const{data:m}=await y.from("corp_properties").select("id").eq("faction_id",c.id).eq("nation_id",n).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();if(m)a="own",i=1,r=2,l="Your Dry Dock (base cost, 2 ticks)";else{const{data:v}=await y.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",c.id).eq("nation_id",n).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();v&&(a="other",i=1.2,r=2,s=v.faction_id,l=(v.factions?.faction_name||"Another corp")+"'s Dry Dock (+20%, 2 ticks)")}}else l="State Dry Dock (3x cost, 3 ticks) — no private dock in port";const d=Math.round(e*i),{data:f}=await y.from("factions").select("corp_cash_reserves").eq("id",c.id).single(),p=Number(f?.corp_cash_reserves??0);if(p<d){alert("Insufficient cash. Need "+_(d)+", have "+_(p)+".");return}if(!confirm("Send "+(t.vessel_name||"vessel")+` to dry dock?

Dock: `+l+`
Cost: `+_(d)+`
Duration: `+r+` ticks
Condition restored to 85-100%.`))return;ie=!0;const u=I?.current_tick||0;try{const{error:m}=await y.from("factions").update({corp_cash_reserves:p-d}).eq("id",c.id);if(m){alert("Failed: "+m.message);return}if(a==="other"&&s){const x=d-e,{data:g}=await y.from("factions").select("corp_cash_reserves").eq("id",s).single();g&&await y.from("factions").update({corp_cash_reserves:Number(g.corp_cash_reserves||0)+x}).eq("id",s)}const{error:v}=await y.from("corp_vessels").update({status:"dry_dock",drydock_until_tick:u+r,active_claim_id:null}).eq("id",o);if(v){await y.from("factions").update({corp_cash_reserves:p}).eq("id",c.id),alert("Failed: "+v.message);return}c.corp_cash_reserves=p-d,await $e()}catch(m){alert("Dry dock failed: "+(m.message||"Error"))}finally{ie=!1}}async function xl(o,e){if(ie||!c)return;if(e<=0){alert("Fuel tanks are already full.");return}const t=(he||[]).find(p=>p.id===o);if(!t)return;const n=t.current_port_nation_id||c.nation_id;let a="state",i=3,r=null,s="State Fuel (3x cost) — no private depot in port";if(n){const{data:p}=await y.from("corp_properties").select("id").eq("faction_id",c.id).eq("nation_id",n).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(p)a="own",i=1,s="Your Fuel Depot (base cost)";else{const{data:u}=await y.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",c.id).eq("nation_id",n).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();u&&(a="other",i=1.15,r=u.faction_id,s=(u.factions?.faction_name||"Another corp")+"'s Fuel Depot (+15%)")}}const l=Math.round(e*i),{data:d}=await y.from("factions").select("corp_cash_reserves").eq("id",c.id).single(),f=Number(d?.corp_cash_reserves??0);if(f<l){alert("Insufficient cash. Need "+_(l)+", have "+_(f)+".");return}if(confirm("Refuel "+(t.vessel_name||"vessel")+`?

Source: `+s+`
Cost: `+_(l)+`
Fuel restored to 100%.`)){ie=!0;try{const{error:p}=await y.from("factions").update({corp_cash_reserves:f-l}).eq("id",c.id);if(p){alert("Failed: "+p.message);return}if(a==="other"&&r){const m=l-e,{data:v}=await y.from("factions").select("corp_cash_reserves").eq("id",r).single();v&&await y.from("factions").update({corp_cash_reserves:Number(v.corp_cash_reserves||0)+m}).eq("id",r)}const{error:u}=await y.from("corp_vessels").update({fuel:100}).eq("id",o);if(u){await y.from("factions").update({corp_cash_reserves:f}).eq("id",c.id),alert("Failed: "+u.message);return}c.corp_cash_reserves=f-l,await $e()}catch(p){alert("Refuel failed: "+(p.message||"Error"))}finally{ie=!1}}}async function bl(o,e,t){if(ie||!c||!I||!confirm("List "+e+" on the Ship Market for "+_(t)+`?

The vessel will be removed from your fleet and listed for sale. You will receive payment when another corporation purchases it.`))return;ie=!0;const n=I.current_tick||0,a=he.find(l=>l.id===o);if(!a){ie=!1;return}const i=Math.max(0,n-(a.built_at_tick||0)),{error:r}=await y.from("ship_market_listings").insert({nation_id:c.nation_id,vessel_name:a.vessel_name,vessel_class:a.vessel_class,capacity_dwt:a.capacity_dwt,capacity_unit:a.capacity_unit,condition:a.condition,fuel:a.fuel,age_ticks:i,fuel_capacity:a.fuel_capacity,base_maintenance:a.base_maintenance,asking_price:t,purchase_price_new:a.purchase_price||t,seller_type:"CORP",seller_name:c.faction_name,seller_faction_id:c.id,sale_reason:"Listed for sale by "+(c.faction_name||"corporation"),status:"available",listed_at_tick:n});if(r){alert("Failed to create listing: "+r.message),ie=!1;return}const{error:s}=await y.from("corp_vessels").delete().eq("id",o);if(s){await y.from("ship_market_listings").delete().eq("seller_faction_id",c.id).eq("vessel_name",a.vessel_name).eq("listed_at_tick",n),alert("Failed to remove vessel: "+s.message),ie=!1;return}ie=!1,Vt=null,await Promise.all([$e(),_a()])}async function _l(o,e){const t=prompt("Rename vessel:",e);if(!t||t.trim()===e||t.trim().length<2)return;const{error:n}=await y.from("corp_vessels").update({vessel_name:t.trim().slice(0,40)}).eq("id",o);if(n){alert("Failed: "+n.message);return}await $e()}async function hl(o,e,t){if(!c||!I||!confirm("Request insurance for "+e+`?

Insurance corporations will see this in their Deal Flow and can offer coverage terms.

Vessel value: `+_(t)))return;const n=I.current_tick||0,{error:a}=await y.from("finance_loan_requests").insert({requesting_faction_id:c.id,nation_id:c.nation_id,request_type:"insurance",insured_vessel_id:o,amount:t,term_months:0,purpose:"Vessel Insurance — "+e,status:"open",created_tick:n,expires_tick:n+12});if(a){a.message.includes("duplicate")||a.message.includes("unique")?alert("Insurance already requested for this vessel."):alert("Failed to request insurance: "+a.message);return}alert(`Insurance request posted to Deal Flow.

Insurance corporations can now offer coverage for `+e+"."),await $e()}let vn=!1;async function $l(o,e){if(vn||!c||!I)return;const t=prompt(`Describe the claim reason:

e.g., "Storm damage during transit — hull breach repaired at sea" or "Engine failure requiring emergency dry dock"`);if(!t||t.trim().length<5)return;const n=I.current_tick||0,{data:a}=await y.from("finance_active_loans").select("id, lender_faction_id, principal, deductible_pct").eq("insured_vessel_id",o).eq("status","current").limit(1).maybeSingle();if(!a){alert("No active insurance policy found for this vessel.");return}const i=Number(a.principal||0),r=Number(a.deductible_pct||10),s=Math.round(i*r/100);if(!confirm("File insurance claim for "+e+`?

Coverage: `+_(i)+`
Deductible: `+r+"% ("+_(s)+`)

Reason: `+t.trim()+`

The insurer will review this claim and determine the payout.`))return;vn=!0;const{error:l}=await y.from("event_log").insert({nation_id:c.nation_id,faction_id:c.id,event_name:(c.faction_name||"Corporation")+" — Insurance Claim Filed",description_used:(c.faction_name||"A shipping corporation")+" has filed an insurance claim for vessel "+e+". Reason: "+t.trim().replace(/[<>"]/g,""),category:"business",trigger_key:"vessel_insurance_claim",effects_applied:{vessel_id:o,vessel_name:e,policy_id:a.id,insurer_faction_id:a.lender_faction_id,coverage:i,deductible_pct:r,claim_reason:t.trim()},fired_at_tick:n});l&&console.warn("Failed to log insurance claim event:",l.message);const{error:d}=await y.from("finance_active_loans").update({claims_paid:(a.claims_paid||0)+1}).eq("id",a.id);d&&console.warn("Failed to update claims_paid:",d.message),vn=!1,alert("Insurance claim filed for "+e+`.

The insurer (`+_(i)+" coverage) has been notified. Claim details are visible in the events feed.")}window.flRequestInsurance=hl;window.flFileClaim=$l;const Mn={fuel_depot:{label:"FUEL DEPOT",color:"#c86a4a",icon:"⛽",desc:"Bunkering facility — refuel at base cost, earn revenue from visiting fleets."},dry_dock:{label:"DRY DOCK",color:"#c84",icon:"🔧",desc:"Repair & maintenance dock — dock at base cost, earn revenue from visiting fleets."}},uo=[{type:"fuel_depot",name:"Fuel Depot — Standard",cost:105e6,maint:85e3,style:"Basic",desc:"Bulk fuel storage and bunkering facility."},{type:"fuel_depot",name:"Fuel Depot — Advanced",cost:14e7,maint:11e4,style:"Modern",desc:"High-capacity fuel terminal with pipeline infrastructure."},{type:"dry_dock",name:"Dry Dock — Standard",cost:85e6,maint:15e4,style:"Basic",desc:"Ship repair and maintenance facility."},{type:"dry_dock",name:"Dry Dock — Advanced",cost:115e6,maint:2e5,style:"Modern",desc:"Full-service shipyard with drydock and crane facilities."}];let zo=[];async function wl(){if(!c||c.corp_sector!=="Shipping")return;const{data:o}=await y.from("corp_properties").select("*, nations!nation_id(name)").eq("faction_id",c.id).in("type",["fuel_depot","dry_dock"]).eq("is_active",!0).order("created_at",{ascending:!1});zo=o||[],kl()}function kl(){const o=document.getElementById("pf-count"),e=document.getElementById("pf-list"),t=document.getElementById("pf-footer");if(!o||!e||!t)return;const n=zo;if(o.textContent=n.length+" FACILIT"+(n.length===1?"Y":"IES"),n.length===0)e.innerHTML=`<div style="padding:20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-bottom:6px;">No port facilities built.</div>
            <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Build a <span style="color:#c86a4a;font-weight:700;">Fuel Depot</span> to refuel your fleet at base cost<br>and earn revenue from other corps refueling here.<br>Build a <span style="color:#c84;font-weight:700;">Dry Dock</span> to repair vessels at base cost.</div>
        </div>`;else{let r=0;e.innerHTML=n.map(s=>{const l=Mn[s.type]||Mn.fuel_depot,d=s.condition>=75?"#5c5":s.condition>=50?"#ca5":"#c84";return r+=Number(s.monthly_maintenance||0),`<div style="padding:8px 12px;border-bottom:1px solid var(--border-0);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${l.icon}</span>
                        <span style="font-size:11px;font-weight:600;color:var(--text-bright);">${b(s.name)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${l.color};background:${l.color}12;border:1px solid ${l.color}25;">${l.label}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:4px;">${b(s.nations?.name||"Unknown Nation")} · ${b(s.city||"Port")} · ${(s.style||"Basic").toUpperCase()}</div>
                <div style="display:flex;gap:12px;margin-bottom:4px;">
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${d};">${s.condition}%</span>
                        </div>
                        <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${s.condition}%;height:100%;background:${d};"></div></div>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#a44;">${_(s.monthly_maintenance||0)}</span>
                        </div>
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">VALUE: ${_(s.purchase_price||0)}</div>
                    </div>
                </div>
            </div>`}).join("")}Number(c?.corp_cash_reserves??0);const a=n.some(r=>r.type==="fuel_depot"),i=n.some(r=>r.type==="dry_dock");t.innerHTML=`
        <div onclick="pfOpenBuild('fuel_depot')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c86a4a;border:1px solid rgba(200,106,74,0.3);background:rgba(200,106,74,0.04);">
            ${a?"+ FUEL DEPOT":"BUILD FUEL DEPOT"}
        </div>
        <div onclick="pfOpenBuild('dry_dock')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c84;border:1px solid rgba(204,136,68,0.3);background:rgba(204,136,68,0.04);">
            ${i?"+ DRY DOCK":"BUILD DRY DOCK"}
        </div>`}let yn=!1;async function El(o){if(yn||!c||!I)return;const e=uo.filter(g=>g.type===o);if(e.length===0)return;const t=Mn[o],n=c.nation_id,a=M?.name||c?.nation||"Home Nation",i=M?.capital||"Port City",r=[{id:n,name:a,capital:i,label:"National HQ"}],{data:s}=await y.from("corp_properties").select("nation_id, name, city, nations!nation_id(name, capital)").eq("faction_id",c.id).eq("type","regional_hq").eq("is_active",!0);for(const g of s||[])g.nation_id!==n&&r.push({id:g.nation_id,name:g.nations?.name||g.city||"Unknown",capital:g.nations?.capital||g.city||"Port City",label:g.name||"Subsidiary"});let l=r[0];if(r.length>1){let g=t.label+` — SELECT LOCATION
`+"─".repeat(30)+`
`;g+=`Build in which nation?

`;for(let k=0;k<r.length;k++){const S=r[k],z=zo.filter($=>$.type===o&&$.nation_id===S.id).length;g+=k+1+". "+S.name+"  ("+S.label+")",z>0&&(g+="  ["+z+" existing]"),g+=`
`}g+=`
Enter number (or cancel):`;const h=prompt(g);if(!h)return;const w=parseInt(h,10)-1;if(isNaN(w)||w<0||w>=r.length){alert("Invalid selection.");return}l=r[w]}const d=zo.filter(g=>g.type===o&&g.nation_id===l.id).length;let f=t.label+" CONSTRUCTION — "+l.name.toUpperCase()+`
`+"─".repeat(30)+`
`;d>0&&(f+="You already have "+d+" "+t.label.toLowerCase()+(d>1?"s":"")+` here.

`),f+=t.desc+`

`;for(let g=0;g<e.length;g++){const h=e[g];f+=g+1+". "+h.name+`
`,f+="   Cost: "+_(h.cost)+" · Maint: "+_(h.maint)+`/tick
`,f+="   "+h.desc+`

`}f+="Enter 1 or 2 to select (or cancel):";const p=prompt(f);if(!p)return;const u=parseInt(p,10)-1;if(isNaN(u)||u<0||u>=e.length){alert("Invalid selection.");return}const m=e[u];if(!confirm("Commission "+m.name+" in "+l.capital+", "+l.name+`?

Budget: `+_(m.cost)+`

This will create a construction contract that construction corporations can bid on. Payment occurs when the contract is awarded.`))return;yn=!0;const v=I.current_tick||0,x=(I.current_date||"").match(/\d{4}/)?.[0]||"2015";try{const{count:g}=await y.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",l.id).eq("issuer_type","PRIVATE"),w=`PVT-P${(g||0)+1}-${x}`,k=m.style==="Modern",S={concrete:k?60:40,steel:k?50:30,heavy_parts:k?30:20,aggregate:k?30:20},z={trucks:5,mixers:5,excavators:5},$={general:k?240:160,skilled:k?100:60},C=k?6:4,{error:A}=await y.from("construction_contracts").insert({nation_id:l.id,template_key:o,sector:"industrial",name:m.name,project_type:t.label,project_subtype:m.style,description:`${m.name} at ${l.capital} Port — commissioned by ${c.faction_name}. ${m.desc}`,project_code:w,budget_ceiling:m.cost,timeline_ticks:C,required_materials:S,required_equipment:z,required_workforce:$,status:"open",generated_at_tick:v,bidding_ends_tick:v+3,issuer_type:"PRIVATE",issuer_name:c.faction_name,issuer_faction_id:c.id});if(A)throw A;await wl(),alert(`Construction contract posted!

Project: `+m.name+`
Location: `+l.capital+", "+l.name+`
Code: `+w+`
Budget: `+_(m.cost)+`
Timeline: `+C+` ticks

Construction corporations in `+l.name+" can now bid on this project.")}catch(g){alert("Failed to post contract: "+(g.message||"Error"))}finally{yn=!1}}window.pfOpenBuild=El;const ai={"Bulk Cargo":["Reefer","Bulk","Coastal"],"Container Freight":["Coastal","Container"],"Specialized Transport":["Tanker","LNG","Bulk"]};async function _a(){if(!c||c.corp_sector!=="Shipping")return;const{data:o,error:e}=await y.from("ship_market_listings").select("*, nation:nation_id(id, name)").eq("status","available").order("asking_price",{ascending:!0});e&&console.warn("Failed to load ship market:",e.message),Ln=o||[],ho=null,ha()}function Cl(o){ho=ho===o?null:o,ha()}function Tl(o){return(ai[c?.corp_subsector]||[]).includes(o)}function ha(){const o=document.getElementById("sm-count"),e=document.getElementById("sm-list"),t=document.getElementById("sm-footer");if(!o||!e)return;const n=Ln;o.textContent=n.length+" AVAILABLE",n.length===0?e.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels on the market.<br>Check back next cycle.</div>':e.innerHTML=n.map((r,s)=>{const l=ho===s,d=St[r.vessel_class]||{color:"#666",label:"?"},f=r.seller_type==="CORP"?"#5a8aaa":"#8b9a6b",p=xa(r.condition),u=r.nation?.name||"—",m=Tl(r.vessel_class);I?.current_tick;const v=r.age_ticks||0,x=Math.max(1,Math.floor(v/12)),g=u!==c?.nation?Number(c?.tariffs||M?.tariffs||0):0,h=Math.round(r.asking_price*g/100),w=r.asking_price+h;let k=`<div onclick="smSelectListing(${s})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${l?d.color:"transparent"};background:${l?d.color+"06":"transparent"};">
                <div style="padding:8px 14px;">`;return k+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(r.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${d.color};background:${d.color}12;border:1px solid ${d.color}25;">${d.label}</span>
            </div>`,k+=`<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;">
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${f};background:${f}12;border:1px solid ${f}25;">${r.seller_type}</span>
                <span style="font-size:9px;color:var(--text-muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${b(r.seller_name||"—")}</span>
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;">${u.toUpperCase().slice(0,6)}</span>
                ${g>0?`<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">+${g}%</span>`:""}
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
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${x}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">PRICE</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--gold);margin-top:1px;">${_(r.asking_price)}</div>
                </div>
            </div>`,l&&(k+='<div style="margin-top:6px;">',k+=`<div style="padding:4px 8px;margin-bottom:5px;background:var(--bg-0);border:1px solid var(--border-0);">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0);">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CARRIES</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${d.color};">${(St[r.vessel_class]||{}).label||"?"} class cargo</span>
                    </div>
                    <div style="padding:3px 0;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:1px;">REASON FOR SALE</div>
                        <div style="font-size:9px;color:var(--text-muted);line-height:1.4;">${b(r.sale_reason||"—")}</div>
                    </div>
                </div>`,k+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                    <div style="width:40px;height:3px;background:var(--border-0);"><div style="width:${r.condition}%;height:100%;background:${p};"></div></div>
                    ${r.condition<60?'<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">May need dry dock</span>':""}
                </div>`,g>0&&(k+=`<div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:8px;margin-bottom:3px;">
                        <span style="color:var(--text-dim);">Import tariff (${g}%)</span>
                        <span style="color:#c84;">+${_(h)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;margin-bottom:5px;">
                        <span style="color:var(--text-bright);">TOTAL</span>
                        <span style="color:var(--gold);">${_(w)}</span>
                    </div>`),m?k+=`<div onclick="event.stopPropagation();smPurchase('${r.id}',${w})" style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${d.color};cursor:pointer;">${_(w)} — PURCHASE</div>`:k+=`<div style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:var(--text-dim);border:1px solid var(--border-0);opacity:0.4;">⊘ ${r.vessel_class} not available for ${c?.corp_subsector||"your subsector"}</div>`,k+="</div>"),k+="</div></div>",k}).join("");const a=n.filter(r=>r.seller_type==="CORP").length,i=n.filter(r=>r.seller_type==="LOCAL").length;t.innerHTML=`<div style="display:flex;gap:6px;">
        <div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:#5a8aaa;border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CORP</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${a}</span>
        </div>
        <div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:#8b9a6b;border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">LOCAL</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${i}</span>
        </div>
    </div>
    <div onclick="smOpenCommission()" style="padding:4px 14px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--gold);border:1px solid rgba(200,168,50,0.3);cursor:pointer;">COMMISSION VESSEL</div>`}let pt=!1;async function Sl(o,e){if(pt||!c||!I)return;const t=Number(c.corp_cash_reserves??0);if(t<e){alert("Insufficient cash. Need "+_(e)+".");return}if(!confirm("Purchase this vessel for "+_(e)+"?"))return;pt=!0;const n=Ln.find(f=>f.id===o);if(!n){pt=!1;return}const a=I.current_tick||0,i=go[n.vessel_class]||go.Coastal,{error:r}=await y.from("factions").update({corp_cash_reserves:t-e}).eq("id",c.id);if(r){alert("Failed: "+r.message),pt=!1;return}const{error:s}=await y.from("corp_vessels").insert({faction_id:c.id,nation_id:c.nation_id,vessel_name:n.vessel_name,vessel_class:n.vessel_class,condition:n.condition,fuel:n.fuel||50,status:"in_port",capacity_dwt:n.capacity_dwt||i.capacity_dwt,capacity_unit:n.capacity_unit||i.capacity_unit,base_maintenance:n.base_maintenance||i.base_maintenance,fuel_capacity:n.fuel_capacity||i.fuel_capacity,purchase_price:e,built_at_tick:a-(n.age_ticks||0),current_port_nation_id:c.nation_id});if(s){await y.from("factions").update({corp_cash_reserves:t}).eq("id",c.id),alert("Failed to create vessel: "+s.message),pt=!1;return}var{error:l}=await y.from("ship_market_listings").update({status:"sold",purchased_by:c.id,purchased_at_tick:a}).eq("id",o);if(l&&console.warn("Failed to mark listing as sold:",l.message),n.seller_faction_id){const{data:f}=await y.from("factions").select("corp_cash_reserves").eq("id",n.seller_faction_id).single();if(f){var{error:d}=await y.from("factions").update({corp_cash_reserves:Number(f.corp_cash_reserves||0)+n.asking_price}).eq("id",n.seller_faction_id);d&&console.warn("Failed to credit seller:",d.message)}}c.corp_cash_reserves=t-e,pt=!1,await Promise.all([$e(),_a()])}const jt=[{cls:"Coastal",baseCost:12e6,baseBuild:3,cargo:"Bulk, Containers (coastal)"},{cls:"Container",baseCost:65e6,baseBuild:5,cargo:"Manufactured, Tech, General"},{cls:"Bulk",baseCost:38e6,baseBuild:4,cargo:"Minerals, Aggregate, Military"},{cls:"Tanker",baseCost:52e6,baseBuild:5,cargo:"Fuel, Petroleum, Chemicals"},{cls:"Reefer",baseCost:45e6,baseBuild:4,cargo:"Food, Perishables, Agriculture"},{cls:"LNG",baseCost:78e6,baseBuild:6,cargo:"Liquefied Natural Gas only"}];let ce="Coastal",Jt=0,Xt="",tt=[];function zl(){ce=(ai[c?.corp_subsector]||["Coastal"])[0],Jt=0,Xt="",tt=[],document.getElementById("comm-overlay").style.display="flex",Nl()}async function Nl(){const{data:o}=await y.from("nations").select("id, name, manufacturing_output, physical_infrastructure, tariffs").order("name");tt=(o||[]).map(e=>{const t=Number(e.manufacturing_output??50),n=Math.round((.75+t/100*.5)*100)/100,a=Math.round((1.5-t/100*.65)*100)/100,i=e.id===c?.nation_id;return{id:e.id,name:e.name,mfg:t,costMod:n,buildMod:a,isHome:i,tariffs:Number(e.tariffs??0)}}),tt.sort((e,t)=>(t.isHome?1:0)-(e.isHome?1:0)),ri()}function $a(){document.getElementById("comm-overlay").style.display="none"}function Il(o){ce=o,ri()}function Ml(o){Jt=o,ri()}function Al(o){Xt=o}function ri(){const o=document.getElementById("comm-content");if(!o)return;const e=I?.current_tick||0,t=jt.find(v=>v.cls===ce)||jt[0],n=tt[Jt]||{name:"—",costMod:1,buildMod:1},a=St[ce]||{color:"#666"},i=Math.round(t.baseCost*n.costMod),r=Math.max(2,Math.round(t.baseBuild*n.buildMod)),s=Math.round(i*.5),l=i-s,d=e+r,f=ai[c?.corp_subsector]||[];let p="";p+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:#c8a832;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Commission Vessel</span>
            </div>
            <span onclick="smCloseCommission()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
    </div>`,p+='<div style="flex:1;overflow-y:auto;">',p+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Vessel Type</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">`;for(const v of jt){const x=St[v.cls]||{color:"#666",label:"?"},g=ce===v.cls,h=f.includes(v.cls);p+=`<div onclick="${h?"commSetClass('"+v.cls+"')":""}" style="padding:5px 4px;text-align:center;cursor:${h?"pointer":"not-allowed"};background:${g?x.color+"18":"transparent"};border:1px solid ${g?x.color+"44":"var(--panel-border)"};opacity:${h?1:.3};">
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${g?x.color:"#6a6660"};">${x.label}</div>
            <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;margin-top:2px;">${_(v.baseCost)} base</div>
        </div>`}p+="</div>",p+=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:${a.color};">${t.cargo}</div>`,p+="</div>",p+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Origin Shipyard</div>`;for(let v=0;v<tt.length;v++){const x=tt[v],g=Jt===v,h=x.costMod>1?"#c84":x.costMod<1?"#5c5":"#6a6660",w=x.buildMod>1?"#c84":x.buildMod<1?"#5c5":"#6a6660";p+=`<div onclick="commSetNation(${v})" style="display:flex;align-items:center;padding:5px 8px;margin-bottom:2px;cursor:pointer;background:${g?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${g?"#8b9a6b44":"var(--panel-border)"};border-left:2px solid ${g?"#8b9a6b":"transparent"};">
            <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:11px;font-weight:600;color:${g?"var(--panel-text)":"#9e9a92"};">${b(x.name)}</span>
                    ${x.isHome?'<span style="font-family:var(--font-mono);font-size:6px;padding:0 3px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2);line-height:11px;">HOME</span>':""}
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${x.isHome?"Home port — no tariff":"Foreign shipyard"}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">MFG</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#9e9a92;">${x.mfg}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">COST</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${h};">×${x.costMod.toFixed(2)}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">SPEED</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${w};">×${x.buildMod.toFixed(2)}</div></div>
            </div>
        </div>`}p+="</div>",p+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Vessel Name</div>
        <input id="comm-name-input" value="${b(Xt)}" oninput="commSetName(this.value)" placeholder="e.g., MV 'Sierra Nevada'" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:11px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;box-sizing:border-box;" />
    </div>`,p+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Build Summary</div>
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:6px 10px;">`;const u=[{label:"VESSEL CLASS",value:ce,color:a.color},{label:"SHIPYARD",value:n.name,color:"#9e9a92"},{label:"BASE COST",value:_(t.baseCost)+" × "+n.costMod.toFixed(2),color:"#9e9a92"},{label:"BUILD TIME",value:r+" ticks",color:r>t.baseBuild?"#c84":r<t.baseBuild?"#5c5":"#9e9a92"},{label:"COMPLETION",value:"~Tick "+d,color:"#9e9a92"}];for(const v of u)p+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${v.label}</span>
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${v.color};">${v.value}</span>
        </div>`;p+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">TOTAL COST</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c8a832;">${_(i)}</span>
    </div>`,p+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEPOSIT (50% NOW)</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">${_(s)}</span>
    </div>`,p+=`<div style="display:flex;justify-content:space-between;padding:3px 0;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">BALANCE ON COMPLETION</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${_(l)}</span>
    </div>`,p+="</div></div>",p+=`<div style="padding:6px 16px;">
        <div style="padding:5px 8px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#c8a832;margin-bottom:2px;">PAYMENT TERMS</div>
            <div style="font-size:9px;color:#6a6660;line-height:1.5;">50% deposit due immediately. Remaining 50% due on delivery at tick ${d}. Vessel delivered at 100% condition, fully fueled, to your nearest port. Cancellation forfeits deposit.</div>
        </div>
    </div>`,p+="</div>";const m=Xt.trim().length>=2;p+=`<div style="padding:10px 16px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">DEPOSIT DUE NOW</div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${_(s)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="smCloseCommission()" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="comm-order-btn" onclick="${m?"smPlaceOrder()":""}" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:${m?"#000":"#6a6660"};background:${m?"#c8a832":"transparent"};border:1px solid ${m?"#c8a832":"var(--panel-border)"};cursor:${m?"pointer":"default"};opacity:${m?1:.4};">PLACE ORDER</div>
        </div>
    </div>`,o.innerHTML=p}let At=!1;async function Rl(){if(At||!c||!I)return;const o=Xt.trim();if(o.length<2)return;const e=jt.find(x=>x.cls===ce)||jt[0],t=tt[Jt];if(!t)return;const n=Math.round(e.baseCost*t.costMod),a=Math.max(2,Math.round(e.baseBuild*t.buildMod)),i=Math.round(n*.5),r=n-i,s=I.current_tick||0,l=Number(c.corp_cash_reserves??0);if(l<i){alert("Insufficient cash for deposit. Need "+_(i)+".");return}if(!confirm("Commission "+ce+" from "+t.name+`?

Deposit: `+_(i)+` (non-refundable)
Balance: `+_(r)+" on delivery at tick "+(s+a)))return;At=!0;const d=document.getElementById("comm-order-btn");d&&(d.style.opacity="0.4",d.style.pointerEvents="none");const{error:f}=await y.from("factions").update({corp_cash_reserves:l-i}).eq("id",c.id);if(f){alert("Failed: "+f.message),At=!1;return}const{data:p}=await y.from("nations").select("budget_reserves").eq("id",t.id).single();if(p){var{error:u}=await y.from("nations").update({budget_reserves:Number(p.budget_reserves||0)+i}).eq("id",t.id);u&&console.warn("Failed to credit shipyard nation budget:",u.message)}const m=go[ce]||go.Coastal,{error:v}=await y.from("vessel_orders").insert({faction_id:c.id,vessel_name:o,vessel_class:ce,capacity_dwt:m.capacity_dwt,capacity_unit:m.capacity_unit,base_maintenance:m.base_maintenance,fuel_capacity:m.fuel_capacity,purchase_price:e.baseCost,shipyard_nation_id:t.id,shipyard_nation:t.name,cost_modifier:t.costMod,build_modifier:t.buildMod,total_cost:n,deposit_paid:i,balance_due:r,ordered_at_tick:s,delivery_tick:s+a,build_ticks:a,status:"building"});if(v){await y.from("factions").update({corp_cash_reserves:l}).eq("id",c.id),alert("Failed to place order: "+v.message),At=!1;return}c.corp_cash_reserves=l-i,At=!1,$a(),alert(o+` commissioned!

Class: `+ce+`
Shipyard: `+t.name+`
Deposit: `+_(i)+`
Delivery: Tick `+(s+a))}window.smSelectListing=Cl;window.smPurchase=Sl;window.smOpenCommission=zl;window.smCloseCommission=$a;window.commSetClass=Il;window.commSetNation=Ml;window.commSetName=Al;window.smPlaceOrder=Rl;window.flSelectVessel=yl;window.flRefurbish=gl;window.flRefuel=xl;window.flSell=bl;window.flRename=_l;window.openBidReview=cl;window.closeBidReview=Ho;window.reviewSelectBid=pl;window.acceptBid=fl;window.declineAllBids=ml;window.switchToActions=Ui;window.actSelectExec=vs;window.actExecute=es;window.confirmFireExec=Xr;window.actOpenStatement=Wi;window.actCloseStatement=Jn;window.actSubmitStatement=ts;window.actDeclareBankruptcy=Yi;window.actOpenRestructure=Xi;window.actCloseRestructure=Xn;window.actSubmitRestructure=cs;window.actOpenRebrand=Zi;window.actCloseRebrand=Zn;window.actSubmitRebrand=ps;window.actOpenDonation=ea;window.actCloseDonation=ei;window.actSubmitDonation=us;window.donateSelectParty=ms;window.lrOpen=Ki;window.lrClose=Ji;window.lrSubmit=ds;window.lrSetAmount=is;window.lrSetPurpose=as;window.lrSetTerm=rs;window.lrSetCollateral=ss;window.openExecSearch=ys;window.closeExecSearch=oa;window.esSelectCandidate=gs;window.esHireCandidate=xs;window.switchToExpansion=ji;window.switchToOperations=Fi;window.hfSetChange=bs;window.hfReset=_s;window.hfConfirm=hs;document.addEventListener("click",function(o){const e=o.target.closest(".corp-nav-tab[href]:not([data-tab-action])");if(!e)return;const t=e.getAttribute("href");if(!t)return;const n=new URL(t,window.location.href);n.pathname!==window.location.pathname||n.searchParams.get("tab")||e.classList.contains("active")||(o.preventDefault(),Fi(o))});Gr();
