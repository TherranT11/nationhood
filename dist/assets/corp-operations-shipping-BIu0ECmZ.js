const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-5lTmaM1a.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as g}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{c as Ve,i as Aa,a as Ra,l as La,M as Bt,Q as zn,b as In,d as mn,e as gi,f as xi,g as qa,h as Oa}from"./corp-shipping-data-CSOoWV-H.js";import{_ as Ba}from"./preload-helper-BXl3LOEh.js";import{e as x}from"./utils-CY90Gazr.js";import{initMessaging as Pa}from"./messaging-BUrQna7p.js";import{d as Da,e as Nn,a as bi}from"./corp-valuation-CgQIQIJ1.js";import{c as ja,a as un,E as Pt,b as Eo,d as _i,e as Fa,f as Ua,h as ci}from"./equipment-DsuDdEne.js";import{a as Ha,E as lo,b as co,g as Va,V as po}from"./vessels-hRwLZomr.js";import{r as vn,c as hi,M as $i,a as Ga}from"./shipping-CQiz46tZ.js";import"./political-actions-F3n029Um.js";import"./config-CTuAIx_5.js";import"./government-types-CPvqgHog.js";import"./ideology-BqLjustE.js";import"./stats-tIiBSaQA.js";let we=[],c=null,M=null,N=null,dt=[],wt={},X=[],ee={},yn=-1;const Wa={em:"em_systems",glass:"glass_facades",heavy:"heavy_parts"},fo=t=>Wa[t]||t;let pe="concrete",Z="STD",he=500,se=[],wi={},gn=0,Dt=[],jt=[],vt=0,ke=null,Ce=-1,fe=[],ki=[],Ft=null,It={},mo={},Mn=[],uo=null,ue="trucks",Ee=0,Te=1,qe=[],Ge=null,Ei=[],xn=null,to=null,bn="ALL",_n="TIMELINE";function P(t){return Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(1)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(0)+"k":"$"+t}function Ya(t){if(t>=12){const e=Math.floor(t/12),o=t%12;return o>0?e+"y "+o+"mo":e+"y"}return t+" ticks"}function Ci(t){return!t||t.length===0?"":t.map(e=>{const o=wi[e];if(!o)return"";const n=o.reputation_bonus>0?"var(--green)":o.reputation_bonus<0?"var(--red)":"var(--text-dim)",i=o.reputation_bonus>0?"+"+o.reputation_bonus:o.reputation_bonus<0?String(o.reputation_bonus):"";return`<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background: var(--border-hair);border:1px solid var(--border-0);border-radius:3px;font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">${o.icon||"📍"} ${x(o.name)}${i?` <span style="color:${n};font-weight:700;">${i} REP</span>`:""}</span>`}).filter(Boolean).join(" ")}function ve(t){return Math.abs(t)>=1e9?"$"+(t/1e9).toFixed(1)+"B":Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(0)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(0)+"k":"$"+t}function An(t){return t==="civil_engineering"?"CIVIL":t==="industrial"?"INDUSTRIAL":t==="mega_project"?"MEGA":t?.toUpperCase()||"—"}function Ti(t){return t==="civil_engineering"?"light":t==="industrial"?"heavy":t==="mega_project"?"mega":"light"}function Qa(){to&&clearInterval(to),to=setInterval(()=>{if(!xn)return;const t=xn-Date.now();if(t<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(to);return}const e=Math.floor(t/36e5),o=Math.floor(t%36e5/6e4),n=Math.floor(t%6e4/1e3);document.getElementById("tick-countdown").textContent=e+"h "+o+"m "+n+"s"},1e3)}function Ka(t,e){t==="type"&&(bn=e),t==="sort"&&(_n=e),document.querySelectorAll(`.filter-pill[data-filter="${t}"]`).forEach(o=>{o.classList.toggle("active",o.dataset.value===e)}),zi()}const pi={"Civil Engineering":"civil_engineering","Industrial Construction":"industrial",Megaprojects:"mega_project"};function Si(t){if(!c)return!1;if(pi[c.corp_subsector]===t.sector)return!0;const o=(Q||[]).filter(n=>n.type==="regional_hq"&&n.is_active&&n.nation_id===t.nation_id);for(const n of o)if(pi[n.subsector]===t.sector)return!0;return!1}function zi(){const t=document.getElementById("oc-list");let e=[...dt];if(bn==="GOVERNMENT"?e=e.filter(i=>i.issuer_type==="GOVERNMENT"):bn==="PRIVATE"&&(e=e.filter(i=>i.issuer_type==="PRIVATE")),_n==="TIMELINE"&&e.sort((i,a)=>(i.timeline_ticks||0)-(a.timeline_ticks||0)),_n==="BUDGET"&&e.sort((i,a)=>(a.budget_ceiling||0)-(i.budget_ceiling||0)),document.getElementById("oc-count").textContent=e.length+" AVAILABLE",e.length===0){t.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const o=N?.current_tick||0;let n="";for(const i of e){const a=i.issuer_type==="GOVERNMENT",r=a?"gov":"private",s=Si(i),l=s?"":" locked",d=Ti(i.sector),f=An(i.sector),p=(i.timeline_ticks||0)>18?" warn":"",u=i.bidding_ends_tick?Math.max(0,i.bidding_ends_tick-o):"?";n+=`
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
                        <div class="oc-stat__value">${ve(i.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${p}">${Ya(i.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${d}">${f}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${wt[i.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${ve(wt[i.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${s?"yes":"no"}">${s?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${s?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openContractDetail(contracts.find(x=>x.id==='${i.id}'))">VIEW</button>`:""}
                </div>
                ${i.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${x(i.description)}</div>`:""}
                ${i.modifiers&&i.modifiers.length>0?`<div style="display:flex;flex-wrap:wrap;gap:3px;padding:4px 0 0;">${Ci(i.modifiers)}</div>`:""}
            </div>`}t.innerHTML=n,t.querySelectorAll(".oc-item:not(.locked)").forEach(i=>{i.addEventListener("click",()=>{const a=i.dataset.contractId,r=dt.find(s=>s.id===a);r&&Ii(r)})})}let We=null;function Ii(t){We=t;const e=document.getElementById("cd-overlay"),o=t.issuer_type==="GOVERNMENT",n=o?"gov":"private",i=(M?.name||c.nation||"—").toUpperCase(),a=Si(t);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${x(i)}</span>
        <span class="cd-header__name">${x(t.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${n}">${x(t.issuer_name)}</span>
        <span class="cd-header__type-badge ${n}">${o?"GOV":"PRIVATE"}</span>
    `;const r=document.getElementById("cd-blueprint");t.blueprint_svg?(r.innerHTML=t.blueprint_svg,r.style.display=""):(r.innerHTML=mr(t),r.style.display="");const s=t.permits_required||[],l=t.required_equipment||t.equipment_required||{},d=Array.isArray(l)?l.map(C=>({key:C,qty:1})):Object.entries(l).map(([C,T])=>({key:C,qty:T})),f=t.required_materials||t.materials_estimated||{},u={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[t.sector]||t.spec_category||t.sector||"—";let m="var(--teal)";t.sector==="industrial"&&(m="var(--orange)"),t.sector==="mega_project"&&(m="var(--red)");let v=P(t.budget_ceiling||t.budget||0),b=(t.timeline_ticks||t.timeline_months||0)+" Months",y="";y+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${x(t.project_code||t.contract_number||"")}</span>
            </div>
            <div class="cd-issue__tags">
                ${t.project_type?`<span class="cd-tag teal">${x(t.project_type.toUpperCase())}</span>`:""}
                ${t.project_subtype?`<span class="cd-tag gold">${x(t.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,t.description&&(y+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${x(t.description)}</div>
            </div>`);const $=t.modifiers||[];if($.length>0){y+=`<div class="cd-items">
            <div class="cd-section-label">Building Modifiers</div>
            <div style="display:flex;flex-direction:column;gap:6px;">`;for(const C of $){const T=wi[C];if(!T)continue;const j=T.reputation_bonus>0?"var(--green)":T.reputation_bonus<0?"var(--red)":"var(--text-dim)",H=T.cost_multiplier>1?"+"+Math.round((T.cost_multiplier-1)*100)+"% cost":T.cost_multiplier<1?Math.round((1-T.cost_multiplier)*100)+"% cheaper":"",G=T.reputation_bonus!==0?(T.reputation_bonus>0?"+":"")+T.reputation_bonus+" rep":"",oe=T.required_permits||[];y+=`<div style="padding:6px 10px;background: var(--border-hair);border:1px solid var(--border-hair);border-radius:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:600;font-size:0.78rem;color:var(--text-primary);">${T.icon||"📍"} ${x(T.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;">
                        ${H?`<span style="color:var(--amber);">${H}</span>`:""}
                        ${H&&G?" · ":""}
                        ${G?`<span style="color:${j};font-weight:700;">${G}</span>`:""}
                    </span>
                </div>
                <div style="font-size:0.65rem;color:var(--text-dim);margin-top:2px;">${x(T.description||"")}</div>
                ${oe.length>0?`<div style="font-size:0.6rem;color:var(--amber);margin-top:3px;font-family:var(--font-mono);">Requires permits: ${oe.map(W=>x(W.replace(/_/g," "))).join(", ")}</div>`:""}
            </div>`}y+="</div></div>"}y+='<div class="cd-details">',t.project_type&&(y+=Le("Type",t.project_type)),t.project_subtype&&(y+=Le("Sub-Type",t.project_subtype)),y+=Le("Specialization",u,m),y+=Le("Total Budget",v,"var(--green)"),y+=Le("Timeline",b),y+=Le("Nation",M?.name||c.nation||"—"),t.region&&(y+=Le("Region",t.region)),y+="</div>",s.length>0&&(y+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${s.map(C=>{const T=C.status==="approved"?"approved":"required",j=C.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${T}">
                            <span class="cd-chip__icon">${j}</span>
                            <span class="cd-chip__label">${x(C.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),f.length>0&&(y+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${f.map(C=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${x(C.name)}</span>
                        <span class="cd-mat-row__qty">${x(String(C.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=y;const h=s.filter(C=>C.status==="approved").length,E=s.length-h,S=d.length,z=[];for(const C of d){const T=se.find(j=>j.equipment_key===C.key);T&&T.owned>=C.qty||z.push(C)}const w=z.length,I=t.required_materials||{},A=typeof I=="object"&&!Array.isArray(I)?Object.entries(I):[],k=[];for(const[C,T]of A){const j=ee[C]||{},H=(j.LOW?.qty||0)+(j.STD?.qty||0)+(j.HIGH?.qty||0);H<T&&k.push({key:C,need:T,have:H})}const q=C=>C.replace(/_/g," ").replace(/\b\w/g,T=>T.toUpperCase());let R="";if(S>0)if(w===0)R+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>';else{const C=z.map(T=>q(T.key)).join(", ");R+=`<span class="cd-footer__badge bad" title="${x(C)}">${w} SHORT: ${x(C)}</span>`}if(A.length>0)if(k.length===0)R+='<span class="cd-footer__badge ok">ALL MATERIALS MET</span>';else{const C=k.map(T=>q(T.key)+" ("+T.have+"/"+T.need+")").join(", ");R+=`<span class="cd-footer__badge bad" title="${x(C)}">${k.length} MAT SHORT: ${x(C)}</span>`}s.length>0&&(E===0?R+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':R+=`<span class="cd-footer__badge warn">${E} PERMITS PENDING</span>`);const O=a,B=t.issuer_faction_id===c?.id,F=t.status==="bidding",V=wt[t.id];document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${R}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${B?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${F?"":"disabled"} title="${F?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:V?`<button class="cd-btn primary" onclick="retractBid('${t.id}')" style="background:#c55;border-color:#c55;"
                        title="Retract your bid ($1M penalty)">RETRACT BID</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${O?"":"disabled"}
                        title="${O?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,e.classList.add("open"),document.body.style.overflow="hidden"}function Yt(t){t&&t.target&&t.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",We=null)}const De=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],fi={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},mi={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let D=null;async function it(t){const e=X.find(C=>C.id===t);if(!e)return;const o=Array.isArray(e.contract_bids)?e.contract_bids[0]:e.contract_bids,n=N?.current_tick||0,i=e.awarded_at_tick||n,a=e.timeline_ticks||8,r=Math.max(0,n-i),s=Math.min(100,r/a*100);let l=Math.min(De.length-1,Math.floor(s/(100/De.length)));const d=Math.round(s%(100/De.length)/(100/De.length)*100),f=e.required_materials||{},p=o?.material_grades||{};let u=[];try{const{data:C}=await g.from("project_material_allocations").select("material_key, quality_tier, quantity, consumed").eq("contract_id",e.id);u=C||[]}catch{}const m={};for(const C of u)m[C.material_key]||(m[C.material_key]={totalAllocated:0,totalConsumed:0,tiers:{}}),m[C.material_key].totalAllocated+=C.quantity,m[C.material_key].totalConsumed+=C.consumed,m[C.material_key].tiers[C.quality_tier]={qty:C.quantity,consumed:C.consumed};const v=Object.entries(f).map(([C,T])=>{const j=p[C]||"STD",H=m[C]||{totalAllocated:0,totalConsumed:0,tiers:{}};return{key:C,name:C.replace(/_/g," ").replace(/\b\w/g,G=>G.toUpperCase()),grade:j,required:Number(T),allocated:H.totalAllocated,consumed:H.totalConsumed,tiers:H.tiers,warehouseStock:ee[C]||{}}}),b=e.required_equipment||{},y=e.equipment_condition||{},h=(Array.isArray(b)?b.map(C=>[C,1]):Object.entries(b)).map(([C,T])=>{const j=se.find(W=>W.equipment_key===C),G=(j?.assigned_projects||[]).find(W=>W.contract_id===e.id),oe=G?G.units:0;return{key:C,name:C.replace(/_/g," ").replace(/\b\w/g,W=>W.toUpperCase()),required:Number(T)||1,ownedTotal:j?.owned||0,deployed:j?.deployed||0,available:Math.max(0,(j?.owned||0)-(j?.deployed||0)),assignedToProject:oe,condition:y[C]??(j?.condition||100)}}),E=e.budget_ceiling||0,S=o?.estimated_cost||0,z=Math.round(S*Math.min(1,r/a)),w=o?.estimated_quality||65,I=w>=75?"EXCELLENT":w>=50?"FAIR":w>=25?"POOR":"BAD",A=e.required_workforce||{},k=e.workers_assigned||{},q=(A.general||0)+(A.skilled||0)+(A.innovative||0),R=(k.general||0)+(k.skilled||0)+(k.innovative||0),O=o?.labor_count||q,B=Number(c?.corp_general_workforce??0),F=Number(c?.corp_skilled_workforce??0),V=Number(c?.corp_innovative_workforce??0);D={project:e,bid:o,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:n,awardedTick:i,totalTicks:a,ticksElapsed:r,phaseIdx:l,phaseProgress:d,materials:v,equipment:h,budget:E,estCost:S,spent:z,quality:w,qualityLabel:I,laborCount:O,wfNeeded:q,wfAssigned:R,reqWf:A,assignedWf:k,corpGeneral:B,corpSkilled:F,corpInnovative:V,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",Ni(e.id).then(()=>Xe()),Xe()}let Y=!1;async function Ja(t,e,o){if(!(Y||!D||!c)){Y=!0;try{const{data:n,error:i}=await g.rpc("allocate_material_to_project",{p_contract_id:D.project.id,p_faction_id:c.id,p_material_key:t,p_quality_tier:e,p_quantity:o});if(i){alert("Allocation failed: "+i.message);return}if(n&&!n.success){alert(n.error||"Allocation failed");return}await Ai(),await it(D.project.id)}catch(n){alert("Allocation error: "+n.message)}finally{Y=!1}}}async function Xa(t,e,o){if(!(Y||!D||!c)){Y=!0;try{const{data:n,error:i}=await g.rpc("deallocate_material_from_project",{p_contract_id:D.project.id,p_faction_id:c.id,p_material_key:t,p_quality_tier:e,p_quantity:o});if(i){alert("Return failed: "+i.message);return}if(n&&!n.success){alert(n.error||"Return failed");return}await Ai(),await it(D.project.id)}catch(n){alert("Return error: "+n.message)}finally{Y=!1}}}async function Za(t,e){if(!(Y||!D||!c)){Y=!0;try{const o=D.project,n=o.workers_assigned||{},i=Number(n[t]||0),a=Number((o.required_workforce||{})[t]||0),r=Number(c?.["corp_"+t+"_workforce"]??0);let s=0;for(const m of X||[])m.id!==o.id&&(s+=Number((m.workers_assigned||{})[t]||0));const l=Math.max(0,r-s-i),d=Math.min(e,a-i,l);if(d<=0){alert(l<=0?"No "+t+" workers available in pool":"Already fully staffed for "+t);return}const f={...n,[t]:i+d},{error:p}=await g.from("construction_contracts").update({workers_assigned:f}).eq("id",o.id);if(p){alert("Assign failed: "+p.message);return}const u=X.find(m=>m.id===o.id);u&&(u.workers_assigned=f),await it(o.id)}catch(o){alert("Assign error: "+o.message)}finally{Y=!1}}}async function er(t,e){if(!(Y||!D||!c)){Y=!0;try{const o=D.project,n=o.workers_assigned||{},i=Number(n[t]||0),a=Math.min(e,i);if(a<=0){alert("No "+t+" assigned");return}const r={...n,[t]:i-a},{error:s}=await g.from("construction_contracts").update({workers_assigned:r}).eq("id",o.id);if(s){alert("Unassign failed: "+s.message);return}const l=X.find(d=>d.id===o.id);l&&(l.workers_assigned=r),await it(o.id)}catch(o){alert("Unassign error: "+o.message)}finally{Y=!1}}}async function tr(t,e){if(!(Y||!D||!c)){Y=!0;try{const o=se.find(l=>l.equipment_key===t);if(!o){alert("Equipment not found in inventory.");return}const n=Math.max(0,(o.owned||0)-(o.deployed||0));if(n<e){alert("Not enough available "+t+" ("+n+" available).");return}const i=(o.deployed||0)+e,a=[...o.assigned_projects||[]],r=a.find(l=>l.contract_id===D.project.id);r?r.units+=e:a.push({contract_id:D.project.id,contract_name:D.project.name,units:e});const{error:s}=await g.from("corp_equipment").update({deployed:i,assigned_projects:a}).eq("faction_id",c.id).eq("equipment_key",o.equipment_key);if(s){alert("Deploy failed: "+s.message);return}await ji(),await it(D.project.id)}catch(o){alert("Deploy error: "+o.message)}finally{Y=!1}}}async function or(t){if(!(Y||!D||!c)){Y=!0;try{const e=se.find(s=>s.equipment_key===t);if(!e){alert("Equipment not found.");return}const o=[...e.assigned_projects||[]],n=o.findIndex(s=>s.contract_id===D.project.id);if(n===-1){alert("Equipment not deployed to this project.");return}const i=o[n].units;o.splice(n,1);const a=Math.max(0,(e.deployed||0)-i),{error:r}=await g.from("corp_equipment").update({deployed:a,assigned_projects:o}).eq("faction_id",c.id).eq("equipment_key",e.equipment_key);if(r){alert("Undeploy failed: "+r.message);return}await ji(),await it(D.project.id)}catch(e){alert("Undeploy error: "+e.message)}finally{Y=!1}}}function nr(t){t&&t.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",D=null)}function ir(t){D&&(D.tab=t,D.expandedEvent=-1,D.selectedResponse=null,Xe())}function ar(t){D&&(D.expandedEvent=D.expandedEvent===t?-1:t,D.selectedResponse=null,Xe())}function rr(t){D&&(D.selectedResponse=D.selectedResponse===t?null:t,Xe())}function Xe(){if(!D)return;const t=D,e=t.project,o=e.issuer_type==="GOVERNMENT",n=An(e.sector),i=c?.nation||"Nation",a=t.awardedTick+t.totalTicks,r=Math.max(0,a-t.currentTick),s=t.currentTick>a,l=t.budget>0?Math.round(t.spent/t.budget*100):0,d=l>85?"var(--red)":l>60?"var(--amber)":"var(--teal)",f=t.budget-t.spent,p=t.events.filter(y=>y.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${x(i.toUpperCase())}</span>
                <span class="pm-hdr__name">${x(e.name)}</span>
                <span style="color:var(--text-dim);font-size:12px">—</span>
                <span class="pm-hdr__issuer">${x(e.issuer_name||"—")}</span>
                <span class="pm-hdr__type">${o?"GOV":"PVT"}</span>
            </div>
            <button class="pm-hdr__close" onclick="closeProjectModal()">×</button>
        </div>
        <div class="pm-hdr__row2">
            <span class="pm-hdr__id">${x(e.template_key||e.id)}</span>
            <span class="pm-hdr__badge pm-hdr__badge--spec">${x(n.toUpperCase())}</span>
            <span class="pm-hdr__badge pm-hdr__badge--sub">${x((e.sector||"").replace(/_/g," ").toUpperCase())}</span>
        </div>
    `;let u='<div class="pm-phase__bar">';for(let y=0;y<De.length;y++){const $=y<t.phaseIdx,h=y===t.phaseIdx;u+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${$?"done":h?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${$?"done":h?"active":""}">${De[y]}</span>
        </div>`}u+="</div>",u+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${De[t.phaseIdx]} — ${t.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${s?"var(--red)":"var(--text-secondary)"}">Tick ${t.ticksElapsed} / ${t.totalTicks}${s?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=u;const m=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:p},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=m.map(y=>`<button class="pm-tab${t.tab===y.id?" active":""}" onclick="pmSetTab('${y.id}')">
            ${y.label}${y.badge>0?`<span class="pm-tab__badge">${y.badge}</span>`:""}
        </button>`).join("");let v="";t.tab==="overview"?v=sr(t,e,d,l,f,r,s):t.tab==="events"?v=lr(t):t.tab==="materials"?v=dr(t):t.tab==="equipment"&&(v=cr(t)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${v}</div>`;let b="";p>0&&(b+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${p} EVENT${p>1?"S":""} REQUIRES RESPONSE</span>`),b+=`<span class="pm-ftr__badge" style="color:${t.quality>=75?"var(--green)":t.quality>=50?"var(--amber)":t.quality>=25?"var(--orange)":"var(--red)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${t.quality}/100 — ${t.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${b}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function sr(t,e,o,n,i,a,r){const s=je(t.awardedTick+t.totalTicks);je(t.awardedTick+t.totalTicks);const l=je(t.awardedTick),d=[{label:"Budget",value:ve(t.budget),sub:`${n}% spent`,color:o},{label:"Spent",value:ve(t.spent),color:"var(--red)"},{label:"Remaining",value:ve(i),color:"var(--green)"},{label:"Quality",value:`${t.quality}/100`,sub:t.qualityLabel,color:t.quality>=75?"var(--green)":t.quality>=50?"var(--amber)":t.quality>=25?"var(--orange)":"var(--red)"},{label:"Workforce",value:`${t.laborCount}/${t.wfNeeded}`,sub:`Bid: ${t.laborCount}`,color:t.laborCount<t.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${a} ticks`,sub:r?"OVERDUE":`Deadline: ${s}`,color:r?"var(--red)":"var(--text-bright)"}];let f="";f+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${x(e.description||e.name)}</div>
    </div></div>`,f+='<div class="pm-metrics">';for(const y of d)f+=`<div class="pm-metric">
            <div class="pm-metric__label">${y.label}</div>
            <div class="pm-metric__value" style="color:${y.color}">${y.value}</div>
            ${y.sub?`<div class="pm-metric__sub">${x(y.sub)}</div>`:""}
        </div>`;f+="</div>",f+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${l}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${r?"var(--red)":"var(--text-bright)"};font-weight:700">${s}</span></span>
        </div>
    </div></div>`;const p=e.modifiers||[];p.length>0&&(f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Building Modifiers</div>',f+='<div style="display:flex;flex-wrap:wrap;gap:4px;">',f+=Ci(p),f+="</div></div></div>");const u=[];if((e.sector==="civil_engineering"||e.sector==="industrial"||e.sector==="mega_project")&&(u.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),u.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),e.sector!=="civil_engineering"&&u.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),u.length>0){f+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const y of u)f+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${x(y.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;f+="</div></div>"}f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Workforce Assignment</div>';const m=[{key:"general",label:"General Workers",corpAvail:t.corpGeneral,color:"var(--text-primary)"},{key:"skilled",label:"Skilled Workers",corpAvail:t.corpSkilled,color:"var(--blue)"},{key:"innovative",label:"Innovative Workers",corpAvail:t.corpInnovative,color:"var(--purple)"}];for(const y of m){const $=Number(t.reqWf[y.key]||0);if($===0)continue;const h=Number(t.assignedWf[y.key]||0),S=h>=$?"var(--green)":h>0?"var(--amber)":"var(--red)",z=y.corpAvail>0&&h<$,w=Math.min(y.corpAvail,$-h),I=h>0;f+='<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-hair);font-size:0.72rem;">',f+="<div>",f+=`<span style="color:${y.color};font-weight:600;">${y.label}</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Required: <strong>${$}</strong></span>`,f+=`<span style="color:${S};margin-left:8px;font-weight:700;">${h} assigned</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Pool: ${y.corpAvail}</span>`,f+="</div>",f+='<div style="display:flex;gap:4px;">',z&&(f+=`<button onclick="pmAssignWorkers('${y.key}',${w})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Assign ${w}</button>`),I&&(f+=`<button onclick="pmUnassignWorkers('${y.key}',${h})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Remove ${h}</button>`),f+="</div></div>"}const v=Number(t.reqWf.general||0)+Number(t.reqWf.skilled||0)+Number(t.reqWf.innovative||0),b=Number(t.assignedWf.general||0)+Number(t.assignedWf.skilled||0)+Number(t.assignedWf.innovative||0);return v>0&&b<v&&(f+='<div style="font-size:0.62rem;color:var(--red);margin-top:6px;font-family:var(--font-mono);">⚠ Project will STALL until workforce is fully assigned</div>'),f+="</div></div>",f}function lr(t){if(t.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let e="";for(let o=0;o<t.events.length;o++){const n=t.events[o],i=t.expandedEvent===o,a=n.status==="ACTIVE",r=fi[n.type]||fi.WEATHER,s=mi[n.severity]||mi.LOW;if(e+=`<div class="pm-evt ${a?"pm-evt--active":"pm-evt--resolved"}" style="${a?`border-left-color:${r.color}`:""}">`,e+=`<div class="pm-evt__header" onclick="pmToggleEvent(${o})" style="${i?`background:${r.bg}`:""}">`,e+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${r.color};background:${r.bg};border:1px solid ${r.border}">${n.type}</span>
            <span class="pm-evt__sev-badge" style="color:${s}">${n.severity}</span>
            <span class="pm-evt__status" style="color:${a?"var(--red)":"var(--text-dim)"};font-weight:${a?"700":"400"}">${a?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,e+=`<div class="pm-evt__title">${x(n.title)}</div>`,e+=`<div class="pm-evt__meta">Tick ${n.tick} · ${x(n.id||"")}</div>`,i){if(e+='<div class="pm-evt__body">',e+=`<div class="pm-evt__desc">${x(n.desc)}</div>`,n.impact&&(e+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${x(n.impact)}</span>
                </div>`),a&&n.responses&&n.responses.length>0){e+='<div class="pm-evt__resp-title">Response Options</div>';for(let l=0;l<n.responses.length;l++){const d=n.responses[l],f=t.selectedResponse===l,u={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[d.tag]||"var(--text-secondary)";e+=`<div class="pm-resp${f?" selected":""}" style="${f?`border-color:${u}`:""}" onclick="event.stopPropagation();pmSelectResponse(${l})">`,e+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${x(d.label)}</span>
                            <span class="pm-resp__tag" style="color:${u};background:${u}12;border:1px solid ${u}25">${d.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${d.delay>0?"var(--orange)":"var(--green)"}">
                            ${d.delay>0?`+${d.delay} tick${d.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,e+=`<div class="pm-resp__detail">${x(d.detail)}</div>`,e+='<div class="pm-resp__costs">',d.cost&&(e+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${ve(d.cost)}</span>`),d.qualityImpact&&d.qualityImpact!==0&&(e+=`<span class="pm-resp__cost" style="color:${d.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${d.qualityImpact>0?"+":""}${d.qualityImpact}</span>`),!d.cost&&(!d.qualityImpact||d.qualityImpact===0)&&(e+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),e+="</div>",f&&(e+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${u}" onclick="event.stopPropagation();confirmEventResponse('${n.id}','${d.key}')">CONFIRM</button>
                        </div>`),e+="</div>"}}!a&&n.resolution&&(e+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${x(n.resolution)}</div>
                </div>`),e+="</div>"}e+="</div></div>"}return e}function dr(t){if(t.materials.length===0)return'<div class="pm-evt-empty">No materials required for this project.</div>';let e='<div class="pm-tab-header">Project Materials</div>';for(const o of t.materials){const n=o.required>0?Math.round(o.allocated/o.required*100):0;o.allocated>0&&Math.round(o.consumed/o.allocated*100);const i=o.allocated>=o.required,a=i?"var(--green)":o.allocated>0?"var(--amber)":"var(--red)",r=i?"FULLY ALLOCATED":o.allocated>0?"PARTIAL":"NONE ALLOCATED";e+='<div class="pm-mat" style="margin-bottom:14px;">',e+=`<div class="pm-mat__row1">
            <div class="pm-mat__left">
                <span class="pm-mat__name">${x(o.name)}</span>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:${a};">${o.allocated} / ${o.required} allocated · ${r}</span>
        </div>`,e+=`<div class="pm-mat__bar-row">
            <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${n}%;background:${a};"></div></div>
            <span class="pm-mat__pct">${o.consumed} consumed</span>
        </div>`;const s=["STD","LOW","HIGH"],l=o.required-o.allocated;for(const d of s){const f=o.warehouseStock[d]||{qty:0},p=o.tiers[d]||{qty:0,consumed:0},u=p.qty-p.consumed;if(f.qty===0&&p.qty===0)continue;const m=d==="HIGH"?"var(--green)":d==="LOW"?"var(--orange)":"var(--text-muted)",v=d==="HIGH"?"HIGH":d==="LOW"?"LOW":"STD";if(e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border-hair);font-size:0.7rem;">',e+='<div style="display:flex;align-items:center;gap:6px;">',e+=`<span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${m};width:32px;">${v}</span>`,e+=`<span style="color:var(--text-dim);">Warehouse: <strong style="color:var(--text-primary);">${f.qty}</strong></span>`,p.qty>0&&(e+=`<span style="color:var(--text-dim);margin-left:8px;">Allocated: <strong style="color:var(--text-primary);">${p.qty}</strong></span>`),e+="</div>",e+='<div style="display:flex;gap:4px;">',f.qty>0&&l>0){const b=Math.min(f.qty,l);e+=`<button class="pm-alloc-btn" onclick="pmAllocateMaterial('${o.key}','${d}',${b})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Allocate ${b}</button>`}u>0&&(e+=`<button class="pm-alloc-btn" onclick="pmDeallocateMaterial('${o.key}','${d}',${u})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Return ${u}</button>`),e+="</div></div>"}e+="</div>"}return e}function cr(t){if(t.equipment.length===0)return'<div class="pm-evt-empty">No equipment required for this project.</div>';let e='<div class="pm-tab-header">Project Equipment</div>';for(const o of t.equipment){const n=o.condition>=75?"var(--green)":o.condition>=50?"var(--amber)":o.condition>=25?"var(--orange)":"var(--red)",i=o.assignedToProject>=o.required,a=o.assignedToProject>0&&o.assignedToProject<o.required,r=i?"var(--green)":a||o.ownedTotal>0?"var(--amber)":"var(--red)",s=i?`${o.assignedToProject}/${o.required} DEPLOYED`:a?`${o.assignedToProject}/${o.required} PARTIAL`:o.ownedTotal>0?"NOT DEPLOYED":"NOT OWNED";e+=`<div class="pm-eq" style="margin-bottom:12px;">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${x(o.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${r};margin-left:8px;">${s}</span>
                </div>
            </div>`,o.assignedToProject>0&&(e+=`<div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${o.condition}%;background:${n}"></div></div>
                <span class="pm-eq__cond-val" style="color:${n}">${o.condition}%</span>
            </div>`);const l=Math.min(o.available,o.required-o.assignedToProject);e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:0.7rem;">',e+=`<span style="color:var(--text-dim);">Required: <strong style="color:${i?"var(--green)":"var(--red)"}">${o.required}</strong>`,e+=` · Owned: <strong style="color:var(--text-primary);">${o.ownedTotal}</strong>`,e+=` · Available: <strong style="color:var(--text-primary);">${o.available}</strong></span>`,e+='<div style="display:flex;gap:4px;">',l>0&&(e+=`<button onclick="pmDeployEquipment('${o.key}',${l})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Deploy ${l}</button>`),o.assignedToProject>0&&(e+=`<button onclick="pmUndeployEquipment('${o.key}')" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Undeploy</button>`),e+="</div></div>",e+="</div>"}return e}function je(t){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][t%12]}, ${2e3+Math.floor(t/12)}`}async function pr(t,e){if(!c||!N)return;const o=prompt(`REQUEST CONSTRUCTION INSURANCE
`+"─".repeat(35)+`

Describe what this policy should cover:

e.g., "Full coverage for weather delays, material damage, and labor disputes during construction. Should cover cost overruns up to 20% of budget."

Insurance corps will see this in their Deal Flow.`);if(o===null)return;const n=o.trim()||"Construction Insurance",i=N.current_tick||0,{error:a}=await g.from("finance_loan_requests").insert({requesting_faction_id:c.id,nation_id:c.nation_id,request_type:"insurance",insured_contract_id:t,amount:e,term_months:0,purpose:n,status:"open",created_tick:i,expires_tick:i+12});if(a){a.message.includes("duplicate")||a.message.includes("unique")?alert("Insurance already requested for this project."):alert("Failed to request insurance: "+a.message);return}alert("Insurance request posted to Deal Flow. Insurance corporations can now offer coverage."),await Mi()}window.requestInsurance=pr;window.openProjectModal=it;window.closeProjectModal=nr;window.pmSetTab=ir;window.pmToggleEvent=ar;window.pmSelectResponse=rr;window.pmAllocateMaterial=Ja;window.pmDeallocateMaterial=Xa;window.pmDeployEquipment=tr;window.pmUndeployEquipment=or;window.pmAssignWorkers=Za;window.pmUnassignWorkers=er;async function Ni(t){if(!D)return;const{data:e,error:o}=await g.from("construction_events").select("*").eq("contract_id",t).order("fired_at_tick",{ascending:!1});o?(console.warn("Failed to load project events:",o.message),D.events=[]):D.events=(e||[]).map(n=>({id:n.id,type:n.type,severity:n.severity,tick:n.fired_at_tick,title:n.title,desc:n.description,impact:n.impact,status:n.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:n.resolution,responses:n.responses||[]})),Xe()}let Vo=!1;async function fr(t,e){if(!(Vo||!D)){Vo=!0;try{const{data:o,error:n}=await g.rpc("resolve_construction_event",{p_event_id:t,p_response_key:e});if(n){console.error("Failed to resolve event:",n.message),alert("Failed to submit response: "+n.message);return}const i=typeof o=="string"?JSON.parse(o):o;if(i?.error){alert("Error: "+i.error);return}await Ni(D.project.id),await Mi(),i?.quality_applied&&i.quality_applied!==0&&(D.quality=Math.max(0,Math.min(100,D.quality+i.quality_applied)),D.qualityLabel=D.quality>=75?"EXCELLENT":D.quality>=50?"FAIR":D.quality>=25?"POOR":"BAD"),Xe()}finally{Vo=!1}}}window.confirmEventResponse=fr;function Le(t,e,o){const n=o?` style="color:${o}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${x(t)}</span>
        <span class="cd-detail-row__value"${n}>${x(e)}</span>
    </div>`}function mr(t){const e={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},o=t.drawing_number||t.contract_number+"-A1",n=N?.current_date||"",i=n?n.replace(/,\s*/," "):"",a=t.spec_category==="Heavy Infrastructure",r=t.spec_category==="Megaproject";let s=x(t.project_subtype||t.project_type||"STRUCTURE"),l=a?"80.0m":r?"200.0m":"60.0m",d=a?"40.0m":r?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${e.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(f,p)=>`<line x1="${p*20}" y1="0" x2="${p*20}" y2="200" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(f,p)=>`<line x1="0" y1="${p*20}" x2="680" y2="${p*20}" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${e.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${e.accent}" font-family="var(--font-mono)" font-weight="700">${s.toUpperCase()}</text>
        <text x="340" y="100" text-anchor="middle" font-size="6" fill="${e.text}" font-family="var(--font-mono)">${x(t.name)}</text>

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
        <text x="540" y="175" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${x(o)}</text>
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
    </svg>`}async function Ze(){if(!c||!c.nation_id)return;const{data:t,error:e}=await g.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(e)console.warn("Failed to load contracts:",e.message),dt=[];else{const o=Number(c.corp_reputation??0);dt=(t||[]).filter(n=>o>=(n.min_reputation||0))}if(wt={},c&&dt.length>0){const o=dt.map(i=>i.id),{data:n}=await g.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",c.id).in("contract_id",o);for(const i of n||[])wt[i.contract_id]=i}zi()}function ur(){const t=document.getElementById("ap-list"),e=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=X.length+" ACTIVE",X.length===0){t.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,e.style.display="none";return}const o=N?.current_tick||0;let n=0,i=0,a="";for(const r of X){const s=r.issuer_type==="GOVERNMENT",l=s?"gov":"private",d=Array.isArray(r.contract_bids)?r.contract_bids[0]:r.contract_bids,f=d?.bid_price||0,p=d?.estimated_cost||0,u=d?.estimated_quality||0,m=r.budget_ceiling||0,v=r.awarded_at_tick||o,b=r.stalled_ticks||0,y=Math.max(0,o-v),$=Math.max(0,y-b),h=r.timeline_ticks||8,E=Math.max(0,h-$),S=Math.min(100,Math.round($/h*100)),z=$>h,w=b>0;let I="";if(w){const k=r.required_workforce||{},q=r.workers_assigned||{},R=[];(Number(q.general)||0)<(Number(k.general)||0)&&R.push("General: "+(Number(q.general)||0)+"/"+(Number(k.general)||0)),(Number(q.skilled)||0)<(Number(k.skilled)||0)&&R.push("Skilled: "+(Number(q.skilled)||0)+"/"+(Number(k.skilled)||0)),(Number(q.innovative)||0)<(Number(k.innovative)||0)&&R.push("Innovative: "+(Number(q.innovative)||0)+"/"+(Number(k.innovative)||0)),R.length>0?I="Workers needed — "+R.join(", "):I="Materials needed — allocate from warehouse"}Ti(r.sector);const A=An(r.sector);n+=m,i+=f,a+=`<div class="ap-item" onclick="openProjectModal('${r.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${x(r.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${x(r.issuer_name||"—")} · ${A}</div>
                </div>
                <span class="oc-item__type-badge ${l}">${s?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS${w?' <span style="color:var(--orange);font-weight:700;font-size:7px;">⚠ STALLED ('+b+" ticks) — "+x(I)+"</span>":""}</span>
                    <span class="ap-budget__values" style="color:${z?"var(--red)":w?"var(--orange)":"var(--teal)"}">
                        ${$}/${h} ticks ${z?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${S}%;background:${z?"var(--red)":w?"var(--orange)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${ve(f)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${ve(p)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${u>=70?"var(--green)":u>=40?"var(--teal)":"var(--orange)"}">${u}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${z?"var(--red)":"var(--text-bright)"}">${E} ticks</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">INSURANCE</div>
                    ${r._hasInsurance?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--green);">INSURED</div>':r._insurancePending?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--orange);">PENDING</div>':`<div class="ap-detail-cell__value" style="font-size:8px;cursor:pointer;color:#aa7a5a;font-weight:700;text-decoration:underline;" onclick="event.stopPropagation();requestInsurance('${r.id}',${m})">INSURE</div>`}
                </div>
            </div>
        </div>`}t.innerHTML=a,e.style.display=X.length>0?"":"none",X.length>0&&(document.getElementById("ap-total-crew").textContent=X.length,document.getElementById("ap-total-budget").textContent=ve(n),document.getElementById("ap-total-spent").textContent=ve(i))}async function Mi(){if(!c)return;const{data:t,error:e}=await g.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",c.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",c.id).order("awarded_at_tick",{ascending:!0});if(e?(console.warn("Failed to load active projects:",e.message),X=[]):X=t||[],X.length>0){const o=X.map(s=>s.id),{data:n}=await g.from("finance_loan_requests").select("insured_contract_id, status").eq("request_type","insurance").in("insured_contract_id",o),{data:i}=await g.from("finance_active_loans").select("request_id, finance_loan_requests!inner(insured_contract_id)").in("status",["current"]).eq("finance_loan_requests.request_type","insurance"),a=new Set((i||[]).map(s=>s.finance_loan_requests?.insured_contract_id).filter(Boolean)),r=new Set((n||[]).filter(s=>s.status==="open").map(s=>s.insured_contract_id));for(const s of X)s._hasInsurance=a.has(s.id),s._insurancePending=r.has(s.id)}ur()}const Co=3e4;function To(){let t=0,e=0;for(const o of Bt)for(const n of zn){const i=ee[o.key]?.[n];i&&(t+=i.qty,e+=i.value)}return{totalUnits:t,totalValue:e}}function Rn(){const t=document.getElementById("wh-list"),{totalUnits:e,totalValue:o}=To();document.getElementById("wh-count").textContent=e.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=P(o);const n=Math.round(e/Co*100),i=document.getElementById("wh-capacity");i.textContent=n+"%",i.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)";let a="";for(let r=0;r<Bt.length;r++){const s=Bt[r],l=yn===r,d=ee[s.key]?.LOW||{qty:0,value:0},f=ee[s.key]?.STD||{qty:0,value:0},p=ee[s.key]?.HIGH||{qty:0,value:0},u=d.qty+f.qty+p.qty,m=d.value+f.value+p.value,v=u===0,b=Ve(s.key,"LOW",M),y=Ve(s.key,"STD",M),$=Ve(s.key,"HIGH",M),h=d.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",E=f.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",S=$.available?p.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(a+='<div class="wh-row">',a+=`<div class="wh-row__collapsed${l?" expanded":""}" onclick="toggleWhRow(${r})">
            <span class="wh-row__arrow">${l?"▾":"▸"}</span>
            <span class="wh-row__name${v?" empty":""}">${x(s.name)}</span>
            <div class="wh-row__dots">
                <div class="${h}"></div>
                <div class="${E}"></div>
                <div class="${S}"></div>
            </div>
            <span class="wh-row__qty${v?" empty":""}">${u>0?u.toLocaleString():"—"}</span>
            <span class="wh-row__val${v?" empty":""}">${m>0?P(m):"—"}</span>
        </div>`,l){a+='<div class="wh-expand">',a+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const z=[{key:"LOW",label:"Low",data:d,avail:b,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:f,avail:y,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:p,avail:$,color:"var(--green)",dotClass:"wh-dot--high"}];for(const w of z){const I=!w.avail.available,A=w.data.qty>0,k=A?"$"+Math.round(w.data.value/w.data.qty):"—";a+=`<div class="wh-grade${I?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${w.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${I?"var(--red)":w.color}">${w.label}</span>
                        ${I?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${A?"var(--text-bright)":"var(--text-dim)"}">${A?w.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${w.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${w.data.value>0?P(w.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${k}</span>
                </div>`}for(const w of z)!w.avail.available&&w.avail.failedStat&&(a+=`<div class="wh-lock">
                        <span class="wh-lock__text">${w.label.toUpperCase()} GRADE LOCKED — ${x(w.avail.failedStat)} &lt; ${w.avail.failedMin}</span>
                    </div>`);a+="</div>"}a+="</div>"}t.innerHTML=a}function vr(t){yn=yn===t?-1:t,Rn()}async function Ai(){if(!c)return;const{data:t,error:e}=await g.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",c.id);ee={};const o=[];if(e)console.warn("Failed to load warehouse:",e.message);else if(t){for(const n of t){const i=fo(n.material_key);ee[i]||(ee[i]={}),ee[i][n.quality_tier]={qty:n.quantity||0,value:Number(n.total_value)||0},i!==n.material_key&&o.push(n)}if(o.length>0){const n=o.map(i=>({faction_id:c.id,nation_id:c.nation_id,material_key:fo(i.material_key),quality_tier:i.quality_tier,quantity:i.quantity||0,total_value:Number(i.total_value)||0,updated_at:new Date().toISOString()}));await g.from("corp_warehouse").upsert(n,{onConflict:"faction_id,material_key,quality_tier"});for(const i of o)await g.from("corp_warehouse").delete().eq("faction_id",c.id).eq("material_key",i.material_key).eq("quality_tier",i.quality_tier)}}Rn()}const yr={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function gr(){const t=(M?.name||c?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+t;const e=Number(c?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=P(e);const{totalUnits:o}=To(),n=Math.round(o/Co*100),i=document.getElementById("pr-wh-capacity");i.textContent=n+"%",i.style.color=n>80?"var(--red)":n>50?"var(--orange)":"var(--green)",Ri(),Ln(),So()}function Ri(){const t=document.getElementById("pr-mat-grid");let e="";for(const o of Bt){const n=pe===o.key,i=zn.every(r=>!Ve(o.key,r,M).available),a="pr-mat-btn"+(n?" active":"")+(i?" all-locked":"");e+=`<span class="${a}" onclick="setPrMat('${o.key}')">${x(o.name)}</span>`}t.innerHTML=e}function Ln(){const t=document.getElementById("pr-tier-bar");let e='<span class="pr-tier-label">GRADE</span>';for(const o of zn){const n=Ve(pe,o,M),i=Z===o,a=n.available?In(pe,o,M):null,r=xi[o],s=!n.available,l="pr-tier-btn"+(i?" active":"")+(s?" locked":"");e+=`<div class="${l}" onclick="${s?"":`setPrTier('${o}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${r};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${i?"var(--text-bright)":"var(--text-dim)"}">${mn[o]}</span>
            </div>
            ${a!==null?`<div class="pr-tier-btn__price" style="color:${i?"var(--text-bright)":"var(--text-muted)"}">$${a}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}t.innerHTML=e}function So(){const t=document.getElementById("pr-content"),e=Ve(pe,Z,M),o=Bt.find(z=>z.key===pe);if(!o)return;if(!e.available){t.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${x(o.name)} — ${mn[Z]} grade
                    is not produced domestically in ${x(M?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${x(e.failedStat||"unknown")} &lt; ${e.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const n=In(pe,Z,M),i=gi(pe,Z,M),a=n*he,r=i>3e3?"LOW":i>1e3?"MODERATE":"HIGH",s=r==="LOW"?"var(--green)":r==="MODERATE"?"var(--amber)":"var(--red)",l=Number(M?.inflation??50),d=l>55?"up":l<45?"down":"flat",f=d==="up"?"&#9650;":d==="down"?"&#9660;":"&#8212;",p=d==="up"?"var(--red)":d==="down"?"var(--green)":"var(--text-dim)";let u="";u+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
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
        <div class="pr-drivers__title">Price Drivers (${x(M?.name||"—")})</div>`;for(const z of o.priceDrivers){const w=Number(M?.[z]??50),I=w>=50?"var(--green)":w>=30?"var(--amber)":w>=15?"var(--orange)":"var(--red)",A=yr[z]||z;u+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${x(z)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${w}%;background:${I}"></div>
            </div>
            <span class="pr-driver-row__val">${w}</span>
            <span class="pr-driver-row__effect">${x(A)}</span>
        </div>`}u+="</div>";const v=(Number(c?.corp_cash_reserves)||0)>=a,b=he>i,{totalUnits:y}=To(),$=Co-y,h=he>$,E=$<=0,S=xi[Z];u+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${x(o.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${S};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${S}">${mn[Z]}</span>
                </div>
                <span class="pr-order__mat-price">$${n}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(z=>`<span class="pr-qty-btn${he===z?" active":""}" onclick="setPrQty(${z})">${z>=1e3?z/1e3+"k":z}</span>`).join("")}
                </div>
            </div>
            ${b?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${i.toLocaleString()} this tick</span>
            </div>`:""}
            ${E?`<div class="pr-supply-warn">
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
                    ${v&&!b&&!h&&!E?"":"disabled"}
                    title="${v?b?"Exceeds supply":E?"Warehouse full":h?"Exceeds warehouse capacity":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,t.innerHTML=u}function xr(t){pe=t,Z="STD";for(const e of["STD","HIGH","LOW"])if(Ve(t,e,M).available){Z=e;break}Ri(),Ln(),So()}function br(t){Z=t,Ln(),So()}function _r(t){he=t,So()}let Go=!1;async function hr(){if(Go||!c||!M)return;const t=In(pe,Z,M),e=gi(pe,Z,M),o=t*he,n=Number(c.corp_cash_reserves)||0;if(o>n){alert("Insufficient cash reserves.");return}if(he>e){alert("Exceeds available supply this tick.");return}const{totalUnits:i}=To(),a=Co-i;if(a<=0){alert("Warehouse is full. Cannot purchase more materials.");return}if(he>a){alert(`Warehouse can only hold ${a.toLocaleString()} more units. Reduce quantity.`);return}Go=!0;const r=document.querySelector(".pr-purchase-btn");r&&(r.disabled=!0,r.textContent="...");try{const s=n-o,{error:l}=await g.from("factions").update({corp_cash_reserves:s}).eq("id",c.id);if(l)throw l;const d=fo(pe),f=ee[d]?.[Z],p=(f?.qty||0)+he,u=(f?.value||0)+o,{error:m}=await g.from("corp_warehouse").upsert({faction_id:c.id,nation_id:c.nation_id,material_key:d,quality_tier:Z,quantity:p,total_value:u,last_purchased_tick:N?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(m){const{error:v}=await g.from("factions").update({corp_cash_reserves:n}).eq("id",c.id);throw v&&console.error("Cash refund failed after warehouse error:",v.message),m}c.corp_cash_reserves=s,ee[d]||(ee[d]={}),ee[d][Z]={qty:p,value:u},Rn(),gr(),r&&(r.textContent="PURCHASED",setTimeout(()=>{r.isConnected&&(r.disabled=!1,r.textContent="PURCHASE")},1500))}catch(s){r&&(r.disabled=!1,r.textContent="PURCHASE"),alert("Purchase failed: "+(s.message||"Unknown error"))}finally{Go=!1}}function Li(t){const e=Ge||M;if(!e)return[];const o=Eo(t);if(!o)return[];const n=Fa(t,e),i=[],a=Number(e?.inflation??50),r=Number(e?.fuel_prices??50);Number(e?.manufacturing_output??50);const s=Ge&&M&&Ge.id!==M.id;let l=null;if(s&&(l=Ua(e,M)),n.newAvailable>0){const d=ci(t,e),f=o.basePrice,p=Math.round(f*((a-50)/200)),u=Math.round(f*((r-50)/300));let m=d;const v=[{label:"Base price",value:P(f)},p!==0?{label:`Inflation (${a})`,mod:(p>=0?"+":"")+P(Math.abs(p))}:null,u!==0?{label:`Fuel transport (${r})`,mod:(u>=0?"+":"")+P(Math.abs(u))}:null].filter(Boolean),b=d-f-p-u;if(b!==0&&!s&&v.push({label:"Demand/scarcity",mod:(b>=0?"+":"")+P(Math.abs(b))}),s&&l){const y=Math.round(d*l.tariff),$=Math.round(d*l.transport);m=d+y+$,v.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+P(y)}),v.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+P($)})}i.push({seller:s?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:s?l?.deliveryTicks||1:0,condition:100,price:Math.round(m),available:n.newAvailable,delivery:s?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:s?l.deliveryTicks:0,used:!1,priceFactors:v,sourceNationId:e.id})}if(n.usedAvailable>0){const d=n.usedCondition,f=ci(t,e,{used:!0,condition:d});let p=f;const u=[{label:"Base price",value:P(o.basePrice)},{label:`Condition (${d}%)`,mod:"-"+P(Math.max(0,o.basePrice-f))}];if(s&&l){const m=Math.round(f*l.tariff),v=Math.round(f*l.transport);p=f+m+v,u.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+P(m)}),u.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+P(v)})}i.push({seller:s?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:s?l?.deliveryTicks||1:0,condition:d,price:Math.round(p),available:n.usedAvailable,delivery:s?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:s?l.deliveryTicks:0,used:!0,priceFactors:u,sourceNationId:e.id})}return i}function qn(){const t=Number(c?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=P(t);const e=Eo(ue),o=Pt[e?.tier||1],n=document.getElementById("em-tier-badge");n&&(n.textContent=o.tag,n.style.color=o.color),n.style.background=o.color+"0a",n.style.border="1px solid "+o.color+"33";const i=document.getElementById("em-nation-select");if(i&&i.options.length===0){const s=M?.name||c?.nation||"—";let l=`<option value="">${x(s)} (HQ)</option>`;for(const d of Ei)d.id!==M?.id&&(l+=`<option value="${d.id}">${x(d.name)}</option>`);i.innerHTML=l}const a=document.getElementById("em-import-tag"),r=Ge&&M&&Ge.id!==M.id;a&&(a.style.display=r?"":"none"),$r(),On()}function $r(){let t="";for(let e=1;e<=3;e++){const o=Pt[e],n=un(e),i=e===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";t+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${o.color}">${o.tag}</div>
            <div class="${i}">`;for(const a of n){const r=ue===a.key,s=Li(a.key).length>0;t+=`<span class="em-selector__btn${r?" active":""}${s?"":" no-listings"}"
                style="${r?"background:"+o.color+";border-color:"+o.color:""}"
                onclick="setEmType('${a.key}')">${x(a.name)}</span>`}t+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${t}</div>`}function On(){const t=document.getElementById("em-content");if(qe=Li(ue),qe.length===0){t.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}Ee>=qe.length&&(Ee=0);let e="";for(let n=0;n<qe.length;n++){const i=qe[n],a=Ee===n,r=i.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",s=_i(i.condition);e+=`<div class="em-listing${a?" selected":""}" style="${a?"border-left-color:"+r:""}" onclick="setEmListing(${n})">`,e+=`<div class="em-listing__row1">
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
            </div>`),e+="</div>"}const o=qe[Ee];if(o){const n=Eo(ue),i=Pt[n?.tier||1],a=Math.min(o.available,4),r=o.price*Te,s=(Number(c?.corp_cash_reserves)||0)>=r;e+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${x(n?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${x(o.seller)}</span>
                </div>
                <span class="em-purchase__price">${P(o.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:a},(l,d)=>d+1).map(l=>`<span class="em-qty-btn${Te===l?" active":""}" style="${Te===l?"background:"+i.color+";border-color:"+i.color:""}" onclick="setEmQty(${l})">${l}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${o.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${P(r)}</div>
                    ${o.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${x(o.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${i.color}" onclick="purchaseEquipment()"
                    ${s?"":"disabled"}
                    title="${s?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}t.innerHTML=e}async function wr(t){if(!t)Ge=null;else{let o=Ei.find(n=>n.id===t);if(!o)try{const{data:n}=await g.from("nations").select("*").eq("id",t).single();o=n}catch{}Ge=o||null}Ee=0,Te=1;const e=document.getElementById("em-nation-select");e&&(e.value=t||""),qn()}function kr(t){ue=t,Ee=0,Te=1,qn()}function Er(t){Ee=t,Te=1,On()}function Cr(t){Te=t,On()}let Wo=!1;async function Tr(){if(Wo)return;const t=qe[Ee];if(!t||!c)return;const e=Eo(ue);if(!e)return;const o=Te,n=t.price*o,i=Number(c.corp_cash_reserves)||0;if(n>i){alert("Insufficient cash reserves.");return}if(o>t.available){alert("Not enough units available.");return}const a=document.querySelector(".em-purchase-btn");a&&(a.disabled=!0,a.textContent="..."),Wo=!0;try{const r=i-n,{error:s}=await g.from("factions").update({corp_cash_reserves:r}).eq("id",c.id);if(s)throw s;const l=!t.deliveryTicks||t.deliveryTicks===0;if(l){const f=se.find(E=>E.equipment_key===ue),p=(f?.owned||0)+o,u=f?.purchase_price_avg||0,m=f?.owned||0,v=m>0?Math.round((u*m+t.price*o)/p):t.price,b=e.maintenancePerUnit*p,y=f?.condition||100,$=Math.round((y*m+t.condition*o)/p),{error:h}=await g.from("corp_equipment").upsert({faction_id:c.id,nation_id:c.nation_id,equipment_key:ue,tier:e.tier,owned:p,deployed:f?.deployed||0,condition:$,maintenance_per_tick:b,purchase_price_avg:v,last_purchased_tick:N?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(h){const{error:E}=await g.from("factions").update({corp_cash_reserves:i}).eq("id",c.id);throw E&&console.error("Cash refund failed:",E.message),h}f?(f.owned=p,f.condition=$,f.maintenance_per_tick=b):se.push({equipment_key:ue,tier:e.tier,owned:p,deployed:0,condition:$,maintenance_per_tick:b,assigned_projects:[]})}else{const f=(N?.current_tick||0)+t.deliveryTicks,{error:p}=await g.from("corp_equipment_deliveries").insert({faction_id:c.id,equipment_key:ue,quantity:o,condition:t.condition,delivery_tick:f,source_nation_id:t.sourceNationId||null,seller_name:t.seller,price_paid:n});if(p){const{error:u}=await g.from("factions").update({corp_cash_reserves:i}).eq("id",c.id);throw u&&console.error("Cash refund failed:",u.message),p}}c.corp_cash_reserves=r,Gn(),qn();const d=document.getElementById("pr-cash");d&&(d.textContent=P(r)),a&&(a.textContent=l?"PURCHASED":"ORDERED",setTimeout(()=>{a.isConnected&&(a.disabled=!1,a.textContent="PURCHASE")},1500))}catch(r){a&&(a.disabled=!1,a.textContent="PURCHASE"),alert("Purchase failed: "+(r.message||"Unknown error"))}finally{Wo=!1}}let Sr=-1,ct=[],vo=[],hn=[];function Yo(t){return Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(1)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(0)+"k":"$"+t.toLocaleString()}function zr(t,e,o){if(o)return"var(--orange)";const n=t/(e||1)*100;return n>50?"var(--green)":n>25?"var(--amber)":"var(--red)"}function ui(){const t=document.getElementById("pm-list"),e=ct.length,o=vo.length,n=hn.length,i=ct.filter(l=>l.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${e})`,document.getElementById("pm-pending-count").textContent=`(${o})`,document.getElementById("pm-apply-count").textContent=`(${n})`;const a=document.getElementById("pm-badges");let r="";i>0&&(r+=`<span class="pm-badge pm-badge--expiring">${i} EXPIRING</span>`),o>0&&(r+=`<span class="pm-badge pm-badge--pending">${o} PENDING</span>`),a.innerHTML=r;const s=ct.reduce((l,d)=>l+(d.cost||0),0)+vo.reduce((l,d)=>l+(d.cost||0),0);document.getElementById("pm-total-cost").textContent=Yo(s),document.getElementById("pm-footer-active").textContent=e,document.getElementById("pm-footer-pending").textContent=o;{if(e===0){t.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let l="";ct.forEach((d,f)=>{const p=Sr===f,u=zr(d.ticks_left,d.total_ticks,d.expiring_soon),m=Math.min(d.ticks_left/(d.total_ticks||1)*100,100);l+=`<div class="pm-item ${d.expiring_soon?"pm-item--expiring":""} ${p?"expanded":""}" onclick="togglePmExpand(${f})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${x(d.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${x((d.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${u}">Expires: ${x(d.expires||"")}</span>
                        <span class="pm-item__ticks">(${d.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${m}%;background:${u}"></div></div>`,p&&(l+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${x(d.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${x(d.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${Yo(d.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${d.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${d.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(d.projects||[]).map(v=>`<span class="pm-project-chip">${x(v)}</span>`).join("")}</div>
                    </div>`,d.note&&(l+=`<div class="pm-note"><span class="pm-note__text">${x(d.note)}</span></div>`),d.expiring_soon&&d.renewable&&(l+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew" onclick="event.stopPropagation(); pmApplyForPermit('${d.permit_key}');">RENEW — ${Yo(d.cost||0)}</button></div>`),l+="</div>"),l+="</div></div>"}),t.innerHTML=l;return}}let Qo=!1;async function Ir(t){if(!(Qo||!c||!M)){Qo=!0;try{const{data:e}=await g.from("shard").select("current_tick").eq("name","Alpha Shard").single(),o=e?.current_tick||0,{data:n,error:i}=await g.rpc("apply_for_permit",{p_faction_id:c.id,p_nation_id:M.id,p_permit_key:t,p_current_tick:o});if(i){alert("Application failed: "+i.message);return}if(n&&!n.success){alert(n.error||"Application failed");return}alert("Permit application submitted! Processing: "+(n.processing_ticks||0)+" ticks."),await Nr()}catch(e){alert("Error: "+e.message)}finally{Qo=!1}}}window.pmApplyForPermit=Ir;async function Nr(){if(!c||!M){ct=[],vo=[],hn=[],ui();return}const{data:t}=await g.from("construction_permits").select("*"),e=t||[],o={};for(const p of e)o[p.permit_key]=p;const{data:n}=await g.from("corp_permits").select("*").eq("faction_id",c.id).eq("nation_id",M.id),i=n||[],{data:a}=await g.from("active_laws").select("policy_id, policies(permit_key, policy_name)").eq("nation_id",M.id).not("policies.permit_key","is",null),r=new Set,s={};for(const p of a||[])p.policies?.permit_key&&(r.add(p.policies.permit_key),s[p.policies.permit_key]=p.policies.policy_name);const{data:l}=await g.from("shard").select("current_tick").eq("name","Alpha Shard").single(),d=l?.current_tick||0;ct=i.filter(p=>p.status==="active").map(p=>{const u=o[p.permit_key]||{},m=p.expires_at_tick?Math.max(0,p.expires_at_tick-d):999,v=u.duration_ticks||24;return{name:u.name||p.permit_key,permit_key:p.permit_key,nation:M.name,policy:s[p.permit_key]||"—",issued:p.granted_at_tick!=null?je(p.granted_at_tick):"—",expires:p.expires_at_tick?je(p.expires_at_tick):"Single-use",cost:p.cost_paid||0,ticks_left:m,total_ticks:v,expiring_soon:m<=3&&m>0,renewable:u.duration_ticks!=null,projects:[]}}),vo=i.filter(p=>p.status==="pending").map(p=>{const u=o[p.permit_key]||{},m=u.processing_ticks||2,v=d-p.applied_at_tick,b=Math.max(0,m-v);return{name:u.name||p.permit_key,permit_key:p.permit_key,nation:M.name,applied:je(p.applied_at_tick),status:"PROCESSING",processing_total:m,ticks_remaining:b,est_approval:je(p.applied_at_tick+m),cost:p.cost_paid||0,required_by:s[p.permit_key]||"—"}});const f=new Set(i.filter(p=>p.status==="active"||p.status==="pending").map(p=>p.permit_key));hn=[...r].filter(p=>!f.has(p)).map(p=>{const u=o[p]||{};return{name:u.name||p,permit_key:p,nation:M.name,description:u.description||"",policy:s[p]||"—",cost:u.cost_is_percentage?15e4:u.cost||0,processing_time:u.processing_ticks||2,duration:u.duration_ticks?u.duration_ticks+" ticks":"Single-use",category:u.category||"",difficulty:u.difficulty||"EASY"}}),ui()}let Ko=!1,Jo=!1;function qi(t){return Math.abs(t)>=1e9?"$"+(t/1e9).toFixed(1)+"B":Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(1)+"M":Math.abs(t)>=1e3?"$"+Math.round(t/1e3)+"k":"$"+Math.round(t)}async function Bn(){var{data:t,error:e}=await g.from("factions").select("*").eq("id",c.id).single();if(e){console.warn("Faction refresh failed:",e.message);return}t&&(c=t);var o=document.getElementById("topbar-cash");o&&(o.textContent="CASH: "+qi(Number(c.corp_cash_reserves??0)))}const $n={CRITICAL:"#c55",HIGH:"#5c5",MODERATE:"#ca5",LOW:"#6a6660"};let yt=[],Pn=[],Oi="ready",Nt=null,yo="ALL",te=-1;const go={COASTAL:{color:"#8b9a6b",label:"COASTAL"},INTERNATIONAL:{color:"#5a8aaa",label:"INTL"},GOVERNMENT:{color:"#c8a832",label:"GOV CONTRACT"}};function Mr(t){yo=t,te=-1,document.querySelectorAll(".ar-pill").forEach(e=>{const o=e.getAttribute("data-ar-filter");e.className="ar-pill"+(o===t?" active-"+(t==="ALL"?"all":t==="COASTAL"?"coastal":t==="INTERNATIONAL"?"intl":"gov"):"")}),jn()}function Bi(t){return Math.round(Number(t?.estimated_revenue||0)*vn(t))}function Dn(){return(yo==="ALL"?yt:yt.filter(e=>e.scope===yo)).slice().sort((e,o)=>{const n=e.trade_agreement_id?0:1,i=o.trade_agreement_id?0:1;return n-i})}async function zo(){if(!c||c.corp_sector!=="Shipping")return;const t=await Oa(g,c.id,c.corp_subsector);yt=t.routes,Pn=t.applications,Oi=t.state,Nt=t.error,Nt&&console.warn("Failed to load available routes:",Nt.message),te=-1,jn()}var Ar={fuel_energy:[{stat:"industrialization",label:"Industrialization"},{stat:"urbanization",label:"Urbanization"}],minerals:[{stat:"industrialization",label:"Industrialization"},{stat:"manufacturing",label:"Manufacturing"}],grains_staples:[{stat:"population_growth",label:"Population Growth"},{stat:"food_security",label:"Food Security"}],livestock_dairy:[{stat:"standard_of_living",label:"Std of Living"},{stat:"food_security",label:"Food Security"}],cash_crops:[{stat:"trade_balance",label:"Trade Balance"},{stat:"foreign_investment",label:"Foreign Investment"}],manufactured_goods:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],technology:[{stat:"technology",label:"Technology"},{stat:"higher_education",label:"Higher Education"}],fruits_vegetables:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],arms:[{stat:"military_spending",label:"Military Spending"},{stat:"stability",label:"Stability"}]};function Rr(t){return Ar[t]||[]}function Lr(t){var e=Number(t.competition_count||0),o=t.demand_level||"",n=t.scope==="GOVERNMENT";return n?"Fixed payment. No demand risk. Vessel locked for contract duration.":e===0&&o==="CRITICAL"?"Unserved critical corridor. High volume, no competition — claim immediately.":e===0&&o==="HIGH"?"Virgin route with strong demand. First-mover advantage available.":e===0?"No competition on this route. Market share starts at 100%.":o==="CRITICAL"&&e<=2?"Underserved critical route. Demand exceeds current capacity.":o==="LOW"?"Thin route. Revenue may not justify vessel deployment.":e>=3?"Crowded route. Market share will be split "+(e+1)+" ways.":Number(t.tariff_rate||0)>15?"High tariff rate cuts into margins. Watch for trade policy changes.":null}function jn(){const t=Dn();document.getElementById("ar-count").textContent=yt.length+" ROUTES";var e={COASTAL:0,INTERNATIONAL:0,GOVERNMENT:0};yt.forEach(function($){e[$.scope]!==void 0&&e[$.scope]++});var o=e.COASTAL,n=e.INTERNATIONAL,i=e.GOVERNMENT;document.getElementById("ar-footer-counts").innerHTML='<div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#8b9a6b"></div><span class="ar-footer__count-label">COASTAL</span><span class="ar-footer__count-num">'+o+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#5a8aaa"></div><span class="ar-footer__count-label">INTL</span><span class="ar-footer__count-num">'+n+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#c8a832"></div><span class="ar-footer__count-label">GOV</span><span class="ar-footer__count-num">'+i+"</span></div>";const a=document.getElementById("ar-claim-btn");a.className="ar-claim-btn"+(te>=0?" active":"");const r=document.getElementById("ar-list");if(Oi==="error"){r.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+x(Nt&&Nt.message||"Shipping routes are temporarily unavailable.")+"</div></div>";return}if(t.length===0){r.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+(yt.length===0?"No routes available.<br>Routes are generated from bilateral<br>trade each tick. Check back after<br>the next corp tick fires.":"No "+yo.toLowerCase()+" routes available.")+"</div></div>";return}let s="";for(let $=0;$<t.length;$++){const h=t[$],E=te===$,S=go[h.scope]||go.INTERNATIONAL,z=h.scope==="GOVERNMENT",w=h.demand_level&&$n[h.demand_level]?{color:$n[h.demand_level],label:h.demand_level}:null,I=Number(h.competition_count||0),A=I===0?"#5c5":I<=2?"#ca5":"#c84";if(s+='<div style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid '+(E?S.color:"transparent")+";background:"+(E?S.color+"08":"transparent")+';" onclick="arSelectRoute('+$+')"><div style="padding:8px 14px;">',s+='<div style="display:flex;align-items:center;gap:0;margin-bottom:4px;"><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+x(h.origin_port||"?")+'</span><div style="flex:1;display:flex;align-items:center;margin:0 8px;"><div style="flex:1;height:1px;background:'+S.color+'44"></div><span style="font-family:var(--font-mono);font-size:7px;color:'+S.color+';padding:0 6px">⚓</span><div style="flex:1;height:1px;background:'+S.color+'44"></div></div><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+x(h.destination_port||"?")+"</span></div>",s+='<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;"><span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+S.color+";background:"+S.color+"12;border:1px solid "+S.color+'25">'+S.label+"</span>",w&&(s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+w.color+";background:"+w.color+"12;border:1px solid "+w.color+'25">'+w.label+" DEMAND</span>"),z&&h.gov_issuer&&(s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">'+x(h.gov_issuer)+"</span>"),I===0&&!z&&(s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15)">NO COMPETITION</span>'),h.trade_agreement_id&&!z){const k=h.trade_agreement_name?" · "+x(String(h.trade_agreement_name).slice(0,28)):"";s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.1);border:1px solid rgba(92,204,92,0.3)">ACTIVE AGREEMENT ×1.2'+k+"</span>"}else!h.trade_agreement_id&&!z&&(s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#9e9a92;background:rgba(158,154,146,0.06);border:1px solid rgba(158,154,146,0.15)">OPEN MARKET ×1.0</span>');var l=Pn.find(function(k){return k.route_id===h.id});if(l){var d=l.status==="approved"?"#5c5":"#c8a832",f=l.status==="approved"?"APPROVED":"APPLIED";s+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+d+";background:"+d+"12;border:1px solid "+d+'25">'+f+"</span>"}if(s+='<span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-left:auto">'+(h.transit_ticks||"?")+" tick"+((h.transit_ticks||0)!==1?"s":"")+" · "+x(h.vessel_class||"?")+"</span>",s+="</div>",s+='<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">',z)s+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(h.gov_contract_duration||h.transit_ticks||"?")+" ticks</div></div>",s+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VESSEL</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+x(h.vessel_class||"?")+"</div></div>",s+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT VALUE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-top:1px">'+P(Number(h.gov_contract_value||h.estimated_revenue||0))+"</div></div>",s+="</div>";else{const k=jr(h),q=k.net>0?"#5c5":k.net<0?"#c84":"#9e9a92";s+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VOLUME</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);margin-top:1px">'+P(Number(h.trade_volume||0))+"</div></div>",s+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">COMP.</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+A+';margin-top:1px">'+I+"</div></div>",s+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">TRANSIT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(h.transit_ticks||"?")+" tick"+((h.transit_ticks||0)!==1?"s":"")+"</div></div>",s+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">EST. REV</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+(h.trade_agreement_id?"#5c5":"#b0aa9a")+';margin-top:1px">'+P(Bi(h))+"</div></div>",s+="</div>",s+='<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 8px;background:var(--bg-0);border:1px solid var(--border-0);border-top:none;"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.5px;">EST. MONTHLY MARGIN (state fuel + maint + incident reserve)</span><span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+q+';">'+(k.net>=0?"+":"")+P(k.net)+"</span></div>"}if(E){if(s+='<div style="margin-top:6px;">',z&&h.goods_description&&(s+='<div style="font-size:10px;color:var(--text-muted);line-height:1.5;margin-bottom:6px">'+x(h.goods_description)+"</div>"),h.trade_agreement_name&&(s+='<div style="padding:4px 8px;margin-bottom:5px;background:rgba(90,138,170,0.05);border:1px solid rgba(90,138,170,0.12)"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:var(--font-mono);font-size:7px;color:#5a8aaa;letter-spacing:0.5px">TRADE AGREEMENT</div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:1px">'+x(h.trade_agreement_name)+'</div></div><div style="text-align:right"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">TARIFF</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(Number(h.tariff_rate||0)>10?"#c84":"#5c5")+'">'+Number(h.tariff_rate||0).toFixed(1)+"%</div></div></div></div>"),s+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px">',s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VESSEL CLASS</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+x(h.vessel_class||"?")+"</span></div>",h.vessel_note&&(s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">REQUIREMENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+x(h.vessel_note)+"</span></div>"),s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">PROXIMITY</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+(h.proximity!=null?h.proximity:"?")+" / 100</span></div>",s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CARGO</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+x(h.goods_name||"Unknown")+"</span></div>",h.goods_description&&!z&&(s+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CONTENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+x(h.goods_description)+"</span></div>"),s+='<div style="display:flex;justify-content:space-between;padding:2px 0"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VOLUME</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+Number(h.volume_physical||0).toLocaleString()+" "+x(h.volume_unit||"tons")+"</span></div>",s+="</div>",M&&!z){var p=Rr(h.trade_sector);if(p.length>0){s+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.8px;margin-bottom:3px">DEMAND DRIVERS</div>';for(var u=0;u<p.length;u++){var m=p[u],v=Number(M[m.stat]??50),b=v>=50?"#5c5":v>=30?"#ca5":"#c84";s+='<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);width:100px">'+x(m.label)+'</span><div style="width:40px;height:2px;background:var(--border-0)"><div style="width:'+v+"%;height:100%;background:"+b+'"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-bright)">'+Math.round(v)+"</span></div>"}s+="</div>"}}var y=Lr(h);y&&(s+='<div style="padding:4px 8px;background:'+S.color+"08;border:1px solid "+S.color+'15"><div style="font-size:9px;color:var(--text-muted);line-height:1.5">'+x(y)+"</div></div>"),s+="</div>"}s+="</div></div>"}r.innerHTML=s}function qr(t){te=te===t?-1:t,jn()}let et=null,Ye=null,ne=0,oo=!1;async function Or(t){const o=Math.round(57499.99999999999),n=5e4;if(!t)return{tier:"state",cost:15e4,ownerFactionId:null,ownerName:null};try{const{data:i}=await g.from("corp_properties").select("id, faction_id").eq("nation_id",t).eq("faction_id",c.id).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(i)return{tier:"own",cost:n,ownerFactionId:c.id,ownerName:c.faction_name};const{data:a}=await g.from("corp_properties").select("id, faction_id, factions!faction_id(faction_name)").eq("nation_id",t).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(a)return{tier:"other",cost:o,ownerFactionId:a.faction_id,ownerName:a.factions?.faction_name||"another corporation"}}catch(i){console.warn("[Depot lookup] failed:",i?.message||i)}return{tier:"state",cost:15e4,ownerFactionId:null,ownerName:null}}const wn=.06,Br={loading:.85},Pr={Coastal:.82,Container:1.18,Bulk:1,Tanker:1.28,Reefer:1.12,LNG:1.34},Dr={Coastal:9e4,Container:145e3,Bulk:175e3,Tanker:19e4,Reefer:14e4,LNG:29e4};function Fn(t,e,o){const i=Math.max(0,Math.min(100,Number(t?.proximity)||50)),a=String(t?.scope||"").toUpperCase(),r=Pr[e]||1,s=.75+i/100*.9,l=a==="COASTAL"?.92:a==="GOVERNMENT"?1.05:1,d=Math.round(5e4*r*s*l);return o==="own"?d:Math.round(o==="other"?d*1.15:d*1.65)}function jr(t){const e=Math.max(1,Number(t?.transit_ticks)||2),o=Math.max(1,12/(e*2)),n=Math.round(Bi(t)*o),i=Math.round(Fn(t,t?.vessel_class,"state")*o),a=Math.round((Dr[t?.vessel_class]||12e4)*Br.loading),r=Math.round(n*wn),s=n-i-a-r;return{gross:n,fuel:i,maintenance:a,reserve:r,net:s}}function Fr({route:t,proposedRate:e,tierMult:o,depotTier:n}){const i=Number(e)||0,a=Math.round(i*(Number(o)||1)),r=Fn(t,t?.vessel_class,n),s=a-r;return{bid:i,revenue:a,fuelPerTrip:r,netPerTrip:s}}async function Ur(){if(te<0||!c||!N)return;var t=Dn(),e=t[te];if(!e)return;var o=Pn.find(function(l){return l.route_id===e.id});if(o){alert("You have already applied for this route. Status: "+o.status);return}var n={"Bulk Cargo":"bulk_cargo","Container Freight":"container_freight","Specialized Transport":"specialized_transport"},i=n[c.corp_subsector]||"";if(e.shipping_subsector&&i!==e.shipping_subsector){var a=e.shipping_subsector.replace(/_/g," ").replace(/\b\w/g,function(l){return l.toUpperCase()});alert("Your fleet specializes in "+(c.corp_subsector||"?")+" but this route requires "+a+".");return}et=e,et.destDepot=await Or(e.destination_nation_id);const r=hi(e.trade_volume,e.shipping_subsector),s=Math.round(($i+r)/2);ne=Ga(Number(e.estimated_revenue)||s,r),Ye=null,Hn()}function Un(){et=null,document.getElementById("ra-modal-overlay")?.remove()}function Hr(t){Ye=t,Hn()}function Vr(t){ne=Number(t),Hn()}function Hn(){if(document.getElementById("ra-modal-overlay")?.remove(),!et)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#5a8aaa",green:"#5c5",gold:"#c8a832",orange:"#c84",red:"#c55",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},o=et,n=go[o.scope]||go.INTERNATIONAL,i=vn(o),a=o.destDepot?.tier||"state",r=fe.filter(B=>B.status==="in_port"&&!B.active_claim_id&&B.condition>=20),s=r.find(B=>B.id===Ye),l=!!s&&ne>0,d=Fr({route:o,proposedRate:ne,tierMult:i,depotTier:a}),f=d.netPerTrip>0?e.green:d.netPerTrip<0?e.red:e.dim,p=Number(s?.base_maintenance)||0,u=Number(o.transit_ticks)||0,m=p*u,v=d.netPerTrip>=m;let b=`
    <div style="width:520px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;max-height:90vh;">
        <div style="padding:12px 20px;border-bottom:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:10px;color:${n.color}">●</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;letter-spacing:2px;color:${e.muted};">ROUTE APPLICATION</span>
            </div>
            <span onclick="raClose()" style="font-family:${t};font-size:18px;color:${e.dim};cursor:pointer">×</span>
        </div>
        <div style="padding:14px 20px;overflow:auto;flex:1;">

            <div style="display:flex;align-items:center;gap:0;margin-bottom:12px;">
                <span style="font-size:14px;font-weight:700;color:${e.text}">${x(o.origin_port||"?")}</span>
                <div style="flex:1;display:flex;align-items:center;margin:0 10px;">
                    <div style="flex:1;height:1px;background:${n.color}44"></div>
                    <span style="font-family:${t};font-size:8px;color:${n.color};padding:0 8px">⚓ ${o.transit_ticks||"?"} tick${(o.transit_ticks||0)!==1?"s":""}</span>
                    <div style="flex:1;height:1px;background:${n.color}44"></div>
                </div>
                <span style="font-size:14px;font-weight:700;color:${e.text}">${x(o.destination_port||"?")}</span>
            </div>

            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};margin-bottom:14px;">
                <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border};">
                    <div style="font-family:${t};font-size:6px;color:${e.dim};letter-spacing:0.5px;">CARGO</div>
                    <div style="font-family:${t};font-size:9px;font-weight:700;color:${e.text};margin-top:1px;">${x(o.goods_name||"?")}</div>
                </div>
                <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border};">
                    <div style="font-family:${t};font-size:6px;color:${e.dim};letter-spacing:0.5px;">VESSEL REQ.</div>
                    <div style="font-family:${t};font-size:9px;font-weight:700;color:${e.text};margin-top:1px;">${x(o.vessel_class||"?")}</div>
                </div>
                <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border};">
                    <div style="font-family:${t};font-size:6px;color:${e.dim};letter-spacing:0.5px;">VOLUME</div>
                    <div style="font-family:${t};font-size:9px;font-weight:700;color:${e.text};margin-top:1px;">${P(Number(o.trade_volume||0))}</div>
                </div>
                <div style="flex:1;padding:4px 8px;">
                    <div style="font-family:${t};font-size:6px;color:${e.dim};letter-spacing:0.5px;">COMPETITION</div>
                    <div style="font-family:${t};font-size:9px;font-weight:700;color:${Number(o.competition_count||0)===0?e.green:e.orange};margin-top:1px;">${o.competition_count||0}</div>
                </div>
            </div>

            ${(()=>{const B=o.destDepot;if(!B)return"";const F=o.destination_port||"this port",V=Fn(o,o.vessel_class,B.tier),C="$"+Math.round(V).toLocaleString()+" / refuel";let T,j;return B.tier==="own"?(T=`${F} has your Fuel Depot (${x(B.ownerName||c.faction_name||"your corp")}) — ${C}.`,j=e.green):B.tier==="other"?(T=`${F} has a Fuel Depot (${x(B.ownerName||"another corp")}) — ${C}.`,j=e.gold):(T=`${F} has no fuel depot — paying ${C} to the government-owned depot.`,j=e.orange),`<div style="padding:7px 10px;margin-bottom:14px;background:${e.card};border:1px solid ${e.border};border-left:2px solid ${j};font-family:${t};font-size:9px;color:${e.text};line-height:1.5;">
                    <span style="color:${e.dim};font-size:7px;font-weight:700;letter-spacing:0.5px;">FUEL AT DESTINATION</span><br>
                    ${T}
                </div>`})()}

            ${(()=>{const B=!!o.trade_agreement_id,F=vn(o),V=B?e.green:e.dim,C=B?`ACTIVE TRADE AGREEMENT${o.trade_agreement_name?" · "+x(o.trade_agreement_name):""}`:"OPEN-MARKET ROUTE",T=B?`Revenue = your bid × ${F.toFixed(2)} (agreement bonus).`:`Revenue = your bid × ${F.toFixed(2)} (organic route penalty). Agreement-backed lanes pay more.`;return`<div style="padding:7px 10px;margin-bottom:14px;background:${e.card};border:1px solid ${e.border};border-left:2px solid ${V};font-family:${t};font-size:9px;color:${e.text};line-height:1.5;">
                    <span style="color:${e.dim};font-size:7px;font-weight:700;letter-spacing:0.5px;">${C}</span><br>
                    ${T}
                </div>`})()}

            <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">SELECT VESSEL</div>`;if(r.length===0)b+=`<div style="padding:14px;text-align:center;background:${e.card};border:1px solid ${e.border};margin-bottom:14px;">
            <div style="font-family:${t};font-size:10px;color:${e.red};">No available vessels</div>
            <div style="font-family:${t};font-size:8px;color:${e.dim};margin-top:4px;">You need a vessel in port, not assigned to another route, with condition ≥ 20%.</div>
        </div>`;else{b+='<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:14px;">';for(const B of r){const F=Ye===B.id,V=B.condition>=75?e.green:B.condition>=50?e.gold:e.orange,C=B.fuel>=60?e.green:B.fuel>=30?e.gold:e.red;b+=`<div onclick="raSelectVessel('${B.id}')" style="padding:8px 10px;background:${F?e.accent+"12":e.card};border:1px solid ${F?e.accent+"44":e.border};cursor:pointer;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-size:11px;font-weight:600;color:${e.text};">${x(B.vessel_name)}</span>
                    <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${n.color};background:${n.color}12;border:1px solid ${n.color}25;">${B.vessel_class.toUpperCase()}</span>
                </div>
                <div style="display:flex;gap:12px;font-family:${t};font-size:8px;">
                    <span style="color:${e.dim};">Condition: <span style="color:${V};font-weight:700;">${B.condition}%</span></span>
                    <span style="color:${e.dim};">Fuel: <span style="color:${C};font-weight:700;">${B.fuel}%</span></span>
                    <span style="color:${e.dim};">Capacity: <span style="color:${e.text};font-weight:700;">${(B.capacity_dwt||0).toLocaleString()} ${B.capacity_unit||"DWT"}</span></span>
                </div>
            </div>`}b+="</div>"}const y=$i,$=hi(o.trade_volume,o.shipping_subsector),h=Math.round((y+$)/2);(ne>$||ne<y)&&(ne=Math.min($,Math.max(y,ne))),b+=`
            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <span style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;">PROPOSED SERVICE RATE</span>
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${e.gold};">${P(ne)}/trip</span>
                </div>
                <input type="range" min="${y}" max="${$}" step="5000" value="${ne}"
                    oninput="raSetRate(this.value)"
                    style="width:100%;accent-color:${e.gold};height:5px;" />
                <div style="display:flex;justify-content:space-between;font-family:${t};font-size:8px;color:${e.dim};margin-top:3px;">
                    <span>Floor (${P(y)})</span>
                    <span style="color:${e.muted};">Mid (${P(h)})</span>
                    <span>Ceiling (${P($)})</span>
                </div>
            </div>`;const E=o.destDepot?.tier==="own"?"own depot":o.destDepot?.tier==="other"?"other corp's depot +15%":"state depot (+65%)",S=Math.max(1,12/(Math.max(1,u)*2)),z=Math.round(d.revenue*S),w=Math.round(d.fuelPerTrip*S),I=s?s.status==="in_transit"?1.25:s.status==="in_port"?.55:.85:.85,A=Math.round(p*I),k=Math.round(z*wn),q=z-w-A-k,R=q>0?e.green:q<0?e.red:e.dim;b+=`
            <div style="margin-bottom:14px;">
                <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">ESTIMATED ECONOMICS (PER TRIP)</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:8px 10px;">
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Bid</span>
                        <span style="font-family:${t};font-size:10px;color:${e.text};">${P(d.bid)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Revenue ×${i} (${o.trade_agreement_id?"agreement":"organic"})</span>
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.green};">${P(d.revenue)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Fuel at destination (${E})</span>
                        <span style="font-family:${t};font-size:10px;color:${e.red};">-${P(d.fuelPerTrip)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:5px 0;">
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.text};">NET PER TRIP</span>
                        <span style="font-family:${t};font-size:14px;font-weight:700;color:${f};">${d.netPerTrip>=0?"+":""}${P(d.netPerTrip)}</span>
                    </div>
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">FLEET OVERHEAD (ONGOING)</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:8px 10px;">
                    ${s?`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                              <span style="font-family:${t};font-size:9px;color:${e.dim};">Vessel maintenance · ${x(s.vessel_class||"?")}</span>
                              <span style="font-family:${t};font-size:10px;color:${e.text};">${P(p)} / tick</span>
                           </div>
                           <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                              <span style="font-family:${t};font-size:9px;color:${e.dim};">Accrues during ${u}-tick transit</span>
                              <span style="font-family:${t};font-size:10px;color:${e.text};">${P(m)}</span>
                           </div>
                           <div style="display:flex;justify-content:space-between;padding:5px 0;">
                              <span style="font-family:${t};font-size:9px;color:${e.dim};">Net per trip vs. maint accrued</span>
                              <span style="font-family:${t};font-size:10px;font-weight:700;color:${v?e.green:e.red};">${v?"covers":"short by "+P(Math.max(0,m-d.netPerTrip))}</span>
                           </div>`:`<div style="font-family:${t};font-size:9px;color:${e.dim};line-height:1.5;">Select a vessel to see its per-tick maintenance cost. Maintenance is charged on every corp tick to every vessel regardless of activity, so higher-class ships need higher-paying routes to break even.</div>`}
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">PROFITABILITY CHECKPOINT (MONTHLY / ACTIVE SHIP)</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:8px 10px;">
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Expected monthly gross revenue</span>
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.green};">${P(z)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Expected monthly fuel</span>
                        <span style="font-family:${t};font-size:10px;color:${e.red};">-${P(w)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Maintenance allocation (${Math.round(I*100)}% state factor)</span>
                        <span style="font-family:${t};font-size:10px;color:${e.red};">-${P(A)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Incident reserve (${Math.round(wn*100)}%)</span>
                        <span style="font-family:${t};font-size:10px;color:${e.red};">-${P(k)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:5px 0;">
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.text};">EST. MONTHLY NET</span>
                        <span style="font-family:${t};font-size:13px;font-weight:700;color:${R};">${q>=0?"+":""}${P(q)}</span>
                    </div>
                </div>
            </div>

            <div style="padding:6px 10px;background:rgba(90,138,170,0.04);border:1px solid rgba(90,138,170,0.12);font-family:${t};font-size:8px;color:${e.dim};line-height:1.5;">
                Application fee: <span style="color:${e.gold};">$50k</span> (non-refundable). The government reviews applications and may approve or reject based on your rate, fleet readiness, and competition.
            </div>

        </div>
        <div style="padding:12px 20px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${t};font-size:8px;color:${e.dim};">APPLICATION FEE</div>
                <div style="font-family:${t};font-size:14px;font-weight:700;color:${e.gold};">$50k</div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="raClose()" style="padding:7px 16px;font-family:${t};font-size:11px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer;">CANCEL</div>
                <div onclick="${l?"raSubmitApplication()":""}" style="padding:7px 16px;font-family:${t};font-size:11px;font-weight:700;letter-spacing:1px;color:${l?"#000":e.dim};background:${l?e.accent:"transparent"};border:1px solid ${l?e.accent:e.border};cursor:${l?"pointer":"not-allowed"};opacity:${l?1:.4};">SUBMIT APPLICATION</div>
            </div>
        </div>
    </div>`;const O=document.createElement("div");O.id="ra-modal-overlay",O.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",O.innerHTML=b,O.addEventListener("click",B=>{B.target===O&&Un()}),document.body.appendChild(O)}async function Gr(){if(oo||!et||!Ye||!c||!N)return;oo=!0;const t=et,e=5e4,{data:o}=await g.from("factions").select("corp_cash_reserves").eq("id",c.id).single(),n=Number(o?.corp_cash_reserves??0);if(n<e){alert("Not enough funds. Application fee: $50k. You have $"+Math.round(n/1e3)+"k."),oo=!1;return}try{const i=n-e,{error:a}=await g.from("factions").update({corp_cash_reserves:i}).eq("id",c.id);if(a){alert("Failed to deduct fee.");return}const r={route_id:t.id,faction_id:c.id,vessel_id:Ye,proposed_rate:ne,application_fee:e,status:"pending",applied_at_tick:N.current_tick};let{error:s}=await g.from("shipping_applications").insert(r);if(s&&/vessel_id/i.test(s.message||"")){const{vessel_id:l,...d}=r;s=(await g.from("shipping_applications").insert(d)).error}if(s){await g.from("factions").update({corp_cash_reserves:n}).eq("id",c.id);const l=s.code==="23505"||/duplicate key|idx_shipping_applications_unique/i.test(s.message||"");alert(l?"You already have a pending or approved application on this route. Withdraw it from Route Applications before applying again.":"Application failed: "+s.message);return}try{await g.from("event_log").insert({nation_id:t.origin_nation_id,event_name:c.faction_name+" applied to service "+(t.origin_port||"?")+" → "+(t.destination_port||"?"),category:"corporate",description_chosen:c.faction_name+" submitted a shipping application for the "+(t.goods_name||"trade")+" route at a proposed rate of "+P(ne)+"/trip. Vessel: "+(fe.find(l=>l.id===Ye)?.vessel_name||"Unknown"),fired_at_tick:N.current_tick})}catch(l){console.warn("[Shipping] Event log failed:",l?.message||l)}Un(),await Bn(),te=-1,await zo(),alert("Application submitted! The government will review your application.")}catch(i){alert("Application failed: "+(i.message||"Network error"))}finally{oo=!1}}async function Wr(){if(!(Ko||te<0||!c||!N)){var t=Dn(),e=t[te];if(e){var o=Number(c.shipping_fleet_capacity??0),n=Number(c.shipping_fleet_deployed??0);if(n>=o){alert("No available vessels. Fleet capacity: "+o+", deployed: "+n+".");return}Ko=!0;var i=document.getElementById("ar-claim-btn");i.textContent="CLAIMING...",i.className="ar-claim-btn";try{var{data:a,error:r}=await g.rpc("claim_shipping_route",{p_faction_id:c.id,p_route_id:e.id,p_current_tick:N.current_tick});if(r){alert("Claim failed: "+r.message);return}if(a&&!a.success){alert(a.error||"Claim failed.");return}if(a?.claim_id){var s=(fe||[]).find(function(u){return u.status==="in_port"&&!u.active_claim_id&&u.fuel>=10});if(s){var{error:l}=await g.from("corp_vessels").update({status:"in_transit",active_claim_id:a.claim_id,current_port_nation_id:null}).eq("id",s.id);l&&console.warn("Failed to assign vessel to route:",l.message)}else console.warn("Route claimed but no available vessel with fuel >= 10% to assign.")}try{var d=e.origin_nation?.name||e.origin_nation_id||"Unknown",f=e.destination_nation?.name||e.destination_nation_id||"Unknown",p=e.goods_type||e.cargo_type||"goods";await g.from("event_log").insert({nation_id:c.nation_id,event_name:"Shipping Route Signed",category:"corporate",description_chosen:c.faction_name+" has just signed an agreement to ship "+p+" between "+d+" and "+f+".",fired_at_tick:N.current_tick||0})}catch{}await Bn(),te=-1,await Promise.all([zo(),Io(),xe()])}catch(u){alert("Claim failed: "+(u.message||"Network error"))}finally{Ko=!1,i.textContent="CLAIM ROUTE",i.className="ar-claim-btn"+(te>=0?" active":"")}}}}let Oe=[],Pi="ready",Mt=null,xo=-1;async function Io(){if(!c)return;const t=await La(g,c.id);Oe=t.claims,Pi=t.state,Mt=t.error,Mt&&console.warn("Failed to load active voyages:",Mt.message),Di()}function Yr(t){xo=xo===t?-1:t,Di()}async function Qr(t){if(!(Jo||!c||!N)){Jo=!0;try{var{data:e,error:o}=await g.rpc("release_shipping_route",{p_faction_id:c.id,p_claim_id:t,p_current_tick:N.current_tick});if(o){alert("Release failed: "+o.message);return}if(e&&!e.success){alert(e.error||"Release failed.");return}var{error:n}=await g.from("corp_vessels").update({status:"in_port",active_claim_id:null}).eq("active_claim_id",t).eq("faction_id",c.id);n&&console.warn("Failed to free vessel on release:",n.message),xo=-1,await Bn(),await Promise.all([zo(),Io(),xe()])}catch(i){alert("Release failed: "+(i.message||"Network error"))}finally{Jo=!1}}}function Di(){const t=N?.current_tick||0,e=Number(c?.shipping_fleet_capacity??0),o=Number(c?.shipping_fleet_deployed??0),n=c?.corp_subsector||"--";document.getElementById("av-count").textContent=Oe.length+" ACTIVE";const i=Oe.reduce((f,p)=>f+Number(p.total_revenue||0),0),a=Oe.reduce((f,p)=>f+(p.transits_completed||0),0),r=a>0?Math.round(i/a):0;document.getElementById("av-summary").innerHTML=`
        <div class="av-summary__cell">
            <div class="av-summary__label">FLEET</div>
            <div class="av-summary__value" style="color:${o>=e?"var(--orange)":"var(--text-bright)"}">
                ${o} <span style="font-size:9px;color:var(--text-dim)">/ ${e}</span>
            </div>
        </div>
        <div class="av-summary__cell">
            <div class="av-summary__label">TRANSITS</div>
            <div class="av-summary__value" style="color:var(--text-bright)">${a}</div>
        </div>
        <div class="av-summary__cell">
            <div class="av-summary__label">AVG REV/TRIP</div>
            <div class="av-summary__value" style="color:var(--green)">${P(r)}</div>
        </div>`,document.getElementById("av-total-revenue").textContent=P(i),document.getElementById("av-total-revenue").style.color=i>0?"var(--green)":"var(--text-dim)",document.getElementById("av-fleet-status").textContent=o+"/"+e,document.getElementById("av-subsector").textContent=n;const s=document.getElementById("av-list");if(Pi==="error"){s.innerHTML='<div class="av-empty"><div class="av-empty__text">'+x(Mt&&Mt.message||"Active voyage data is temporarily unavailable.")+"</div></div>";return}if(Oe.length===0){s.innerHTML='<div class="av-empty"><div class="av-empty__text">No active voyages.<br>Claim a shipping route to<br>deploy your fleet.</div></div>';return}let l="";for(let f=0;f<Oe.length;f++){const p=Oe[f],u=p.shipping_routes||{},m=xo===f,v=p.vessel_status||"idle";let b=v.toUpperCase().replace("_"," "),y="av-status--idle",$="";if(v==="loading")y="av-status--loading",b="LOADING";else if(v==="in_transit"){y="av-status--transit";const I=p.transit_started_tick||t,k=(p.transit_arrives_tick||I+(u.transit_ticks||2))-I,q=Math.max(0,Math.min(t-I,k)),R=k>0?Math.round(q/k*100):0;b="IN TRANSIT ("+q+"/"+k+")",$='<div class="av-transit-bar"><div class="av-transit-bar__fill" style="width:'+R+'%"></div></div>'}const h=Number(p.revenue_per_transit||0),E=Number(p.market_share_pct||0),S=p.transits_completed||0,z=Number(p.total_revenue||0),w=$n[u.demand_level]||"#6a6660";if(l+='<div class="av-item" onclick="avToggle('+f+')"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;"><div class="av-item__route">'+x(u.origin_port||"?")+" → "+x(u.destination_port||"?")+'</div><span class="av-status '+y+'">'+b+'</span></div><div class="av-item__cargo">'+x(u.goods_name||"Unknown")+" · "+x(u.vessel_class||"?")+"</div>"+$+'<div class="av-item__stats"><div class="av-stat"><div class="av-stat__label">REV/TRIP</div><div class="av-stat__value" style="color:var(--green)">'+P(h)+'</div></div><div class="av-stat"><div class="av-stat__label">SHARE</div><div class="av-stat__value">'+E.toFixed(1)+'%</div></div><div class="av-stat"><div class="av-stat__label">TRANSITS</div><div class="av-stat__value">'+S+'</div></div><div class="av-stat"><div class="av-stat__label">TOTAL REV</div><div class="av-stat__value" style="color:var(--green)">'+P(z)+"</div></div></div>",m){l+='<div class="av-item__detail"><div class="av-detail-row"><span class="av-detail-label">ORIGIN</span><span class="av-detail-value">'+x(u.origin_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">DESTINATION</span><span class="av-detail-value">'+x(u.destination_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE SECTOR</span><span class="av-detail-value">'+x((u.trade_sector||"").replace(/_/g," ").toUpperCase())+'</span></div><div class="av-detail-row"><span class="av-detail-label">SCOPE</span><span class="av-detail-value">'+x(u.scope||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRANSIT TIME</span><span class="av-detail-value">'+(u.transit_ticks||"?")+' ticks</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE VOLUME</span><span class="av-detail-value">'+P(Number(u.trade_volume||0))+'</span></div><div class="av-detail-row"><span class="av-detail-label">TARIFF</span><span class="av-detail-value">'+Number(u.tariff_rate||0).toFixed(1)+'%</span></div><div class="av-detail-row"><span class="av-detail-label">COMPETITION</span><span class="av-detail-value">'+(u.competition_count??0)+' corps</span></div><div class="av-detail-row"><span class="av-detail-label">DEMAND</span><span class="av-detail-value" style="color:'+w+'">'+(u.demand_level||"?")+"</span></div>"+(u.trade_agreement_name?'<div class="av-detail-row"><span class="av-detail-label">AGREEMENT</span><span class="av-detail-value" style="color:var(--teal)">'+x(u.trade_agreement_name)+"</span></div>":"")+'<div class="av-detail-row"><span class="av-detail-label">CLAIMED</span><span class="av-detail-value">Tick '+(p.claimed_at_tick||"?")+"</span></div>";var d=(fe||[]).find(function(I){return I.active_claim_id===p.id});!d&&v==="loading"?l+=`<div style="padding:6px 8px;margin-top:4px;background:rgba(200,168,50,0.06);border:1px solid rgba(200,168,50,0.15);text-align:center;"><div style="font-family:var(--font-mono);font-size:9px;color:var(--orange);font-weight:700;margin-bottom:4px;">NO VESSEL ASSIGNED</div><button class="av-action-btn" style="background:var(--teal);color:#fff;border-color:var(--teal);width:100%;" onclick="event.stopPropagation();openAssignVesselModal('`+p.id+"','"+(u.vessel_class||"")+`')">ASSIGN VESSEL</button></div>`:d&&(l+='<div style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:var(--bg-card);border:1px solid var(--border-main);"><div><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">ASSIGNED VESSEL</div><div style="font-size:11px;font-weight:700;color:var(--text-bright);">'+x(d.vessel_name||"Unknown")+'</div></div><div style="display:flex;gap:10px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(d.fuel>50?"#5c5":d.fuel>20?"#ca5":"#c55")+'">'+(d.fuel||0)+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(d.condition>50?"#5c5":d.condition>30?"#ca5":"#c55")+'">'+(d.condition||0)+"%</div></div></div></div>"),l+=`<button class="av-action-btn release" onclick="event.stopPropagation();avRelease('`+p.id+`')">RELEASE ROUTE</button></div>`}l+="</div>"}s.innerHTML=l}let At=[];const Kr={stranded:{label:"STRANDED"},mechanical_failure:{label:"MECHANICAL"},collision:{label:"COLLISION"},fire:{label:"FIRE"},piracy:{label:"PIRACY"},storm_damage:{label:"STORM"}};async function Vn(){if(!c){At=[],vi();return}const{data:t,error:e}=await g.from("vessel_incidents").select("id, vessel_id, nation_id, incident_type, incident_tick, description, severity, status, corp_vessels!vessel_id(id, vessel_name, vessel_class)").eq("faction_id",c.id).eq("status","pending").order("incident_tick",{ascending:!1});e?(console.warn("[VesselIncidents] load failed:",e.message),At=[]):At=t||[],vi()}function vi(){const t=document.getElementById("vi-count"),e=document.getElementById("vi-list");if(!t||!e)return;const o=At||[];if(t.textContent=o.length+" PENDING",o.length===0){e.innerHTML=`<div class="vi-empty">
            <div class="vi-empty__text">No pending incidents.<br>Claim-eligible events on your fleet appear here.</div>
        </div>`;return}e.innerHTML=o.map(n=>{const i=Kr[n.incident_type]||{label:(n.incident_type||"INCIDENT").toUpperCase()},a=n.corp_vessels?.vessel_name||"Unknown Vessel",r=n.severity==="total",s=n.severity?`<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;margin-left:4px;color:${r?"#000":"var(--amber)"};background:${r?"var(--red)":"var(--amber-faint)"};border:1px solid ${r?"var(--red)":"var(--amber-border)"};">${r?"TOTAL LOSS":"PARTIAL"}</span>`:"";return`<div class="vi-item" data-incident-id="${n.id}">
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
        </div>`}).join("")}let gt=!1;async function Jr(t){if(gt)return;const e=At.find(o=>o.id===t);if(e){gt=!0;try{const{data:o}=await g.from("subsidiary_auto_policies").select("id, principal, deductible_pct, lender_faction_id, policy_terms").eq("insured_vessel_id",e.vessel_id).eq("status","active").limit(1).maybeSingle(),{data:n}=o?{data:null}:await g.from("finance_active_loans").select("id, principal, deductible_pct, lender_faction_id").eq("insured_vessel_id",e.vessel_id).eq("status","current").limit(1).maybeSingle(),i=o||n;if(!i){alert("No active insurance policy covers this vessel. Consider purchasing coverage before the next incident.");return}const a=e.corp_vessels?.vessel_name||"vessel",r=Number(i.principal)||0,s=e.severity==="total"||e.incident_type==="stranded"||!e.severity,l=Math.round(s?r:r*.35),d=`File claim on ${a}?

Severity:    ${s?"Total loss":"Partial loss"}
Claim:       $${l.toLocaleString()}
Deductible:  ${i.deductible_pct||10}%`;if(!confirm(d))return;const f=o?"auto":"deal",p=N?.current_tick||0,{data:u,error:m}=await g.from("insurance_claims").insert({policy_id:i.id,policy_source:f,claimant_faction_id:c.id,insurer_faction_id:i.lender_faction_id,insured_vessel_id:e.vessel_id,claim_amount:l,claim_reason:e.description||`${a} — incident ${e.incident_type}`,policy_terms:i.policy_terms||null,deductible_pct:Number(i.deductible_pct)||10,status:"filed",filed_at_tick:p}).select("id").single();if(m){alert("Failed to file claim: "+m.message);return}const{error:v}=await g.from("vessel_incidents").update({status:"filed",filed_at_tick:p,filed_claim_id:u?.id||null}).eq("id",e.id);v&&console.warn("[VesselIncidents] incident update after file failed:",v.message);try{await g.from("event_log").insert({nation_id:e.nation_id||c.nation_id,faction_id:c.id,event_name:`${c.faction_name||"A corporation"} filed an insurance claim`,category:"corporate",description_chosen:`${c.faction_name||"Corporation"} filed a claim on ${a} for $${Math.round(l).toLocaleString()}.`,fired_at_tick:p})}catch{}await Vn()}catch(o){console.error("[VesselIncidents] fileClaim error:",o),alert("File claim failed: "+(o?.message||"unknown error"))}finally{gt=!1}}}window.viFileClaim=Jr;async function Xr(t){if(!gt&&confirm("Dismiss this incident without filing a claim? The vessel remains in whatever state the tick processor left it.")){gt=!0;try{const{error:e}=await g.from("vessel_incidents").update({status:"dismissed",filed_at_tick:N?.current_tick||0}).eq("id",t);if(e){alert("Dismiss failed: "+e.message);return}await Vn()}finally{gt=!1}}}window.viDismissIncident=Xr;function Zr(t,e){const o=(fe||[]).filter(function(a){return a.status==="in_port"&&!a.active_claim_id&&a.fuel>=15&&a.condition>=20});let n;o.length===0?n='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No available vessels.<br>Ships must be in port with 15%+ fuel and 20%+ condition.</div>':n=o.map(function(a,r){var s=a.fuel>50?"#5c5":a.fuel>20?"#ca5":"#c55",l=a.condition>50?"#5c5":a.condition>30?"#ca5":"#c55";return`<div style="padding:10px 14px;border-bottom:1px solid var(--border-0);cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="assignVesselToRoute('`+t+"','"+a.id+`')"><div><div style="font-size:14px;font-weight:700;color:var(--text-bright);">`+x(a.vessel_name||"Unnamed")+'</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+x(a.vessel_class||"?")+" · "+(a.capacity_dwt||0).toLocaleString()+' DWT</div></div><div style="display:flex;gap:14px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+s+'">'+a.fuel+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+l+'">'+a.condition+'%</div></div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--teal);padding:4px 12px;border:1px solid var(--teal);cursor:pointer;">ASSIGN</div></div></div>'}).join("");var i=document.createElement("div");i.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;",i.onclick=function(a){a.target===i&&i.remove()},i.innerHTML='<div style="width:560px;max-width:95vw;max-height:80vh;background:var(--bg-panel);border:1px solid var(--border-main);display:flex;flex-direction:column;"><div style="padding:12px 16px;border-bottom:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:space-between;align-items:center;"><span style="font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:var(--teal);">ASSIGN VESSEL</span><span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+o.length+' available</span></div><div style="flex:1;overflow-y:auto;">'+n+`</div><div style="padding:10px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);text-align:right;"><button onclick="this.closest('div[style*=fixed]').remove()" style="padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);background:transparent;border:1px solid var(--border-main);cursor:pointer;">CANCEL</button></div></div>`,document.body.appendChild(i)}async function es(t,e){try{var{error:o}=await g.from("corp_vessels").update({status:"in_port",active_claim_id:t}).eq("id",e).eq("faction_id",c.id);if(o){alert("Assignment failed: "+o.message);return}var n=document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]');n&&n.remove(),await Promise.all([Io(),xe()])}catch(i){alert("Assignment failed: "+(i.message||"Network error"))}}window.openAssignVesselModal=Zr;window.assignVesselToRoute=es;function Gn(){const t=se.reduce((s,l)=>s+(l.owned||0),0),e=se.reduce((s,l)=>s+(l.deployed||0),0),o=ja(se),n=t-e;document.getElementById("eq-count").textContent=t+" UNITS",document.getElementById("eq-summary").innerHTML=`
        <div class="eq-summary__cell">
            <div class="eq-summary__label">DEPLOYED</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--text-bright)">
                ${e} <span style="font-size:9px;color:var(--text-dim)">/ ${t}</span>
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
                ${P(o)}
            </div>
        </div>`;const i={};for(const s of se)i[s.equipment_key]=s;let a="";for(let s=1;s<=3;s++){const l=Pt[s],d=un(s),f=gn===s,p=d.reduce((m,v)=>m+(i[v.key]?.owned||0),0),u=d.reduce((m,v)=>m+(i[v.key]?.deployed||0),0);if(a+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${s})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${f?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${l.color}">${x(l.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${l.color};border:1px solid ${l.color}33;background:${l.color}0a">${l.tag}</span>
            </div>
            ${p>0?`<span class="eq-tier-hdr__count">${u}/${p}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,f)for(const m of d){const v=i[m.key],b=v?.owned||0,y=v?.deployed||0,$=v?.condition||0,h=m.maintenancePerUnit*b,E=b-y,S=b>0&&E===0,z=b>0&&$<65,w=_i($),I=v?.assigned_projects||[],A=I.length>0?I.map(k=>k.contract_name||"Project").join(", ").slice(0,30):b>0&&y>0?y+" project"+(y>1?"s":""):"—";a+=`<div class="eq-row${b===0?" unowned":""}">`,a+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${b===0?" dim":""}">${x(m.name)}</span>
                        ${z?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${b>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${S?"var(--orange)":"var(--green)"}">${E}</span>
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
                            <div class="eq-detail__value" style="color:var(--text-muted)">${x(A)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${P(h)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:a+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',a+="</div>"}}document.getElementById("eq-list").innerHTML=a;const r=[1,2,3].map(s=>{const l=Pt[s],d=un(s).reduce((f,p)=>f+(i[p.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${d>0?l.color+"33":"var(--border-0)"};background:${d>0?l.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${l.color}">${l.tag}</div>
            <div class="eq-footer__tier-count" style="color:${d>0?"var(--text-bright)":"var(--text-dim)"}">${d}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${P(o)}</div>
        </div>
        <div class="eq-footer__tiers">${r}</div>`}function ts(t){gn=gn===t?-1:t,Gn()}async function ji(){if(!c)return;const{data:t,error:e}=await g.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",c.id);e?(console.warn("Failed to load equipment:",e.message),se=[]):se=t||[],Gn()}async function os(){const{data:{user:t}}=await g.auth.getUser();if(!t){window.location.href="login.html";return}const{data:e}=await g.from("factions").select("*").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`);we=(e||[]).filter(m=>m.nation_id);const o=sessionStorage.getItem("active_faction_id");if(c=we.find(m=>m.id===o)||we.find(m=>m.faction_type==="corporation")||we[0],!c){await g.auth.signOut(),window.location.href="login.html";return}if(c.faction_type!=="corporation"){window.location.href="dashboard.html";return}const n=new URLSearchParams(window.location.search).get("tab"),i=n==="expansion"||n==="actions";if(c.corp_sector!=="Shipping"&&!i){const v={Finance:"corp-operations-finance.html",Construction:"corp-operations.html"}[c.corp_sector];if(v){window.location.href=v;return}}const[a,r]=await Promise.all([c.nation_id?g.from("nations").select("*").eq("id",c.nation_id).single():Promise.resolve({data:null}),g.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);a.error&&console.warn("Nation load failed:",a.error.message),a.data&&(M=a.data),r.error&&console.warn("Shard load failed:",r.error.message),N=r.data;let s=0;if(c?.id){const{data:m}=await g.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",c.id).in("status",["open","bidding"]);if(m)for(const v of m)s+=(v.contract_bids||[]).length}const l=document.getElementById("corp-topbar-container");if(l){const{renderCorpTopBar:m}=await Ba(async()=>{const{renderCorpTopBar:y}=await import("./corp-topbar-5lTmaM1a.js");return{renderCorpTopBar:y}},__vite__mapDeps([0,1])),v=new URLSearchParams(window.location.search).get("tab")||"operations",b={};s>0&&(b.home={color:"#c8a832",title:s+" pending bid"+(s!==1?"s":"")+" on your projects"}),m(l,{faction:c,shard:N,activeTab:v,allUserFactions:we,badges:b})}if(N){if(document.getElementById("game-date").textContent=N.current_date||"—",document.getElementById("tick-number").textContent=N.current_tick||"—",N.next_tick_at){const v=(Number(N.tick_interval_hours)||8)*36e5,b=new Date(N.next_tick_at).getTime(),$=b-v+v/2;xn=new Date($>Date.now()?$:b+v/2),Qa()}const m=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");m&&(m.textContent="Next Corp Tick")}const d=document.getElementById("topbar-cash");d&&(d.textContent="CASH: "+qi(Number(c.corp_cash_reserves??0)));const f=document.getElementById("topbar-ap");f&&(f.style.display="none");const p=document.getElementById("nation-pill");p&&(p.textContent=(M?.name||c.nation||"—").toUpperCase());const u=document.getElementById("corp-faction-dropdown");if(u){let m="";for(const v of we){const b=v.id===c.id,y=v.faction_type==="corporation"?"CORP":"PARTY",$=v.faction_type==="corporation"?"var(--teal)":"var(--amber)";m+=`<div class="corp-dd-item${b?" active":""}" onclick="switchToFaction('${v.id}', '${v.faction_type}')">
                <span class="corp-dd-type" style="color:${$}">${y}</span>
                <span class="corp-dd-name">${x(v.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${x(v.abbreviation||"—")}]</span>
            </div>`}u.innerHTML=m}await Promise.all([zo(),Io(),xe(),oi(),$a(),Vn()]),Pa(c,M,N);try{await Ra(g,{faction:c,nation:M,shard:N},"auto-services-container")}catch(m){console.error("[CorpOps] Auto-services init failed:",m)}if(document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",n==="expansion"){const m=document.querySelector('[data-tab-action="expansion"]');m&&Ui({preventDefault:()=>{},target:m})}else if(n==="actions"){const m=document.querySelector('[data-tab-action="actions"]');m&&Vi({preventDefault:()=>{},target:m})}}async function ns(){await g.auth.signOut(),window.location.href="login.html"}function is(){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.toggle("open")}function as(t,e){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.remove("open"),sessionStorage.setItem("active_faction_id",t),e==="corporation"?window.location.href="corp-operations.html":window.location.href="dashboard.html"}document.addEventListener("click",t=>{const e=document.getElementById("faction-switcher"),o=document.getElementById("corp-faction-dropdown");o&&e&&!e.contains(t.target)&&o.classList.remove("open")});document.addEventListener("keydown",t=>{t.key==="Escape"&&Yt()});window.doLogout=ns;window.toggleCorpDropdown=is;window.switchToFaction=as;window.setFilter=Ka;window.arSetFilter=Mr;window.arSelectRoute=qr;window.arClaimRoute=Wr;window.arApplyToService=Ur;window.raClose=Un;window.raSelectVessel=Hr;window.raSetRate=Vr;window.raSubmitApplication=Gr;window.avToggle=Yr;window.avRelease=Qr;window.openContractDetail=Ii;window.closeContractDetail=Yt;window.toggleWhRow=vr;window.toggleEqTier=ts;window.switchEmNation=wr;window.setEmType=kr;window.setEmListing=Er;window.setEmQty=Cr;window.purchaseEquipment=Tr;window.setPrMat=xr;window.setPrTier=br;window.setPrQty=_r;window.purchaseMaterial=hr;let re={general:0,skilled:0,innovative:0},Xo=!1;const Qe=[{id:"general",label:"General Workforce",multiplier:2,color:"#8b9a6b",factionKey:"corp_general_workforce"},{id:"skilled",label:"Skilled Workforce",multiplier:3,color:"#c8a832",factionKey:"corp_skilled_workforce"},{id:"innovative",label:"Innovative Workforce",multiplier:6,color:"#c84",factionKey:"corp_innovative_workforce"}];function Fi(t){const e=Number(M?.minimum_wage??50),o=Number(M?.inflation??50),n=Number(M?.standard_of_living??50),i=e/100*48e3,a=1+(o-50)/100*.5,r=1+(n-50)/100*.5;return Math.round(i*t*a*r)}function _(t){const e=Math.abs(t),o=t<0?"-":"";return e>=1e9?o+"$"+(e/1e9).toFixed(2)+"B":e>=1e6?o+"$"+(e/1e6).toFixed(2)+"M":e>=1e3?o+"$"+(e/1e3).toFixed(1)+"k":o+"$"+e.toLocaleString()}async function Ui(t){t.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("actions-content").style.display="none";const e=document.getElementById("expansion-content");e.style.display="flex",e.style.justifyContent="center",e.style.gap="12px",e.style.alignItems="flex-start",e.style.flexWrap="wrap",document.querySelectorAll(".corp-nav-tab").forEach(o=>o.classList.remove("active")),t.target.classList.add("active"),await Ao(),Mo(),As(),await Jn(),Lo(),await tl(),await Us(),Xt(),Jt(),await cl(),Zt(),await Oo(),Bo()}function Hi(t){t&&t.preventDefault(),document.getElementById("operations-content").style.display="flex",document.getElementById("expansion-content").style.display="none",document.getElementById("actions-content").style.display="none",document.querySelectorAll(".corp-nav-tab").forEach(e=>e.classList.remove("active")),rs()?.classList.add("active")}async function Vi(t){t.preventDefault(),document.getElementById("operations-content").style.display="none",document.getElementById("expansion-content").style.display="none",document.getElementById("actions-content").style.display="block",document.querySelectorAll(".corp-nav-tab").forEach(e=>e.classList.remove("active")),(t.target||document.querySelector('[data-tab-action="actions"]'))?.classList.add("active"),await Gi(),kt()}function rs(){return Array.from(document.querySelectorAll(".corp-nav-tab[href]:not([data-tab-action])")).find(t=>{const e=t.getAttribute("href");if(!e)return!1;const o=new URL(e,window.location.href);return o.pathname===window.location.pathname&&!o.searchParams.get("tab")})||null}async function Gi(){if(!c)return;const[t,e]=await Promise.all([g.from("corp_executives").select("*").eq("faction_id",c.id).eq("status","active"),g.from("executive_pool").select("*").eq("nation_id",c.nation_id).eq("status","available").order("skill",{ascending:!1})]);t.error&&console.warn("Failed to load executives:",t.error.message),e.error&&console.warn("Failed to load executive pool:",e.error.message),Dt=t.data||[],jt=e.data||[];const o=await Ha({supabase:g,faction:c,currentTick:N?.current_tick||0,poolCandidates:jt});o?.error&&console.warn("Failed to seed initial executive roster:",o.error.message||o.error),o?.executives&&(Dt=o.executives)}function pt(t){return t>=1e6?"$"+(t/1e6).toFixed(1)+"M":t>=1e3?"$"+(t/1e3).toFixed(0)+"k":"$"+t}function Me(t){return Dt.find(e=>e.role===t)||null}function bo(t,e){return(t||"?")[0]+(e||"?")[0]}function xt(t){return t>=70?"#5cb85c":t>=50?"#ca5":"#c84"}function kt(){const t=document.getElementById("actions-container");if(!t)return;const e=c?.faction_name||"Corporation",o=(c?.abbreviation||c?.corp_ticker||"??").toUpperCase();let n="";n+=`<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;padding:0 2px;">
        <div style="display:flex;align-items:center;gap:12px;">
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:2px;color:#8b9a6b;text-transform:uppercase;">Actions</span>
            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${x(e)} &middot; ${x(o)}</span>
        </div>
    </div>`,n+='<div style="display:flex;gap:8px;">',n+='<div style="width:262px;display:flex;flex-direction:column;gap:5px;flex-shrink:0;">';for(let i=0;i<lo.length;i++){const a=lo[i],r=co[a],s=Me(a),l=vt===i,d=r.color,f=!s;if(n+=`<div onclick="actSelectExec(${i})" style="
            padding:10px 12px;
            background:${l?d+"0a":"var(--bg-2,#1a1a17)"};
            border:1px solid ${l?d+"44":"var(--border-0,rgba(255,255,255,0.06))"};
            border-left:3px solid ${l?d:"var(--border-0,rgba(255,255,255,0.06))"};
            cursor:pointer;
        ">`,f&&a!=="CEO")n+=`<div style="display:flex;align-items:center;gap:10px;">
                <div style="width:45px;height:45px;background: var(--border-hair);border:1px dashed var(--border-1);display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);flex-shrink:0;">?</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:4px;">
                        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${d};">${x(a)}</span>
                    </div>
                    <div style="font-size:13px;font-weight:600;color:var(--text-dim);margin-top:2px;">VACANT</div>
                    <div style="margin-top:4px;">
                        <span onclick="event.stopPropagation();openExecSearch('${a}')" style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;padding:3px 8px;color:#5a8aaa;border:1px solid rgba(90,138,170,0.25);background:rgba(90,138,170,0.06);cursor:pointer;">EXECUTIVE SEARCH</span>
                    </div>
                </div>
            </div>`;else{const p=s?`${s.first_name} ${s.last_name}`:"—",u=s?s.age:0,m=s?s.skill:0,v=s?s.salary_per_year:0,b=s?bo(s.first_name,s.last_name):"—";n+=`<div style="display:flex;align-items:center;gap:10px;">
                <div style="width:45px;height:45px;background:${d}15;border:1px solid ${d}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:14px;font-weight:700;color:${d};flex-shrink:0;">${x(b)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:4px;">
                        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${d};">${x(a)}</span>
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
    </div>`,n+="</div>",t.innerHTML=n,ls()}const Wi={CEO:[{id:"statement",name:"Issue Statement",desc:"Issue a press release to the public events feed. Other players and media corps see it. Cost scales with CEO skill.",cost:"~$20k",costColor:"#5cb85c",tags:["REPUTATION"],cooldown:"once/tick"},{id:"ipo",name:"IPO",desc:"Take the corporation public. Sell ~30% of shares for a massive cash injection. Permanent loss of full control.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["STRUCTURAL"],locked:!0,lockReason:"Coming soon"},{id:"bankruptcy",name:"Declare Bankruptcy",desc:"The CEO officially files for bankruptcy, ceasing all operations. Outstanding loans will be repaid up to 50% of the corporation's market valuation.",descRed:"This will dissolve your corporation. Loans will be paid back, and you will need to found a new corporation. There is a 24 tick cooldown on declaring bankruptcy.",cost:"IRREVERSIBLE",costColor:"#c55",tags:["IRREVERSIBLE"]}],CFO:[{id:"loan",name:"Request Loan",desc:"Submit a loan application to all finance corporations. Set amount, purpose, term, and collateral. Receive competing offers.",cost:"FREE",costColor:"#5cb85c",tags:["FINANCIAL"]}],COO:[{id:"restructure",name:"Restructure Operations",desc:"Lay off 10-20% of workforce, cut ~7% of debt. Reputation hit scales with COO skill — high skill minimizes damage.",cost:"FREE",costColor:"#5cb85c",tags:["OPERATIONAL"],cooldown:"once/tick"}],CTO:[{id:"research",name:"Begin Research",desc:"Start researching a tech tree node. Opens the tech tree interface.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["INNOVATION"],locked:!0,lockReason:"Coming soon"}],CMO:[{id:"rebrand",name:"Rebrand Corporation",desc:"Change name and abbreviation. Cost and reputation hit scale with CMO skill — high skill reduces both.",cost:"~$20M",costColor:"#ca5",tags:["STRUCTURAL"],cooldown:"once/tick"}],CLO:[{id:"sue_corp",name:"Sue Corporation",desc:"File a lawsuit against another corporation for patent infringement, contract breach, or predatory practices.",cost:"COMING SOON",costColor:"var(--text-dim)",tags:["LEGAL"],locked:!0,lockReason:"Coming soon"}],Lobbyist:[{id:"donate",name:"Political Donation",desc:"Donate $1M to a political party in the nation where your National HQ is located. The target party receives $100k in party funds. You cannot donate to your own party.",cost:"$1M",costColor:"#ca5",tags:["POLITICAL"],cooldown:"once/tick"}]};function Qt(t){return 1.5-t/100}let Yi={};function ss(t){const e=N?.current_tick||0;return Yi[t]===e}function bt(t){const e=N?.current_tick||0;Yi[t]=e}function ls(){const t=document.getElementById("actions-right-panel");if(!t)return;const e=lo[vt],o=co[e],n=Me(e),i=Wi[e]||[];if(!n){t.innerHTML=`<div style="padding:48px;text-align:center;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));">
            <div style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:${o.color};margin-bottom:6px;">${x(e)}</div>
            <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-bottom:14px;">${x(o.fullTitle)}</div>
            <div style="font-size:16px;color:var(--text-muted);margin-bottom:20px;">This position is vacant. Hire an executive to unlock actions.</div>
            <div onclick="openExecSearch('${e}')" style="display:inline-block;padding:8px 24px;font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">EXECUTIVE SEARCH</div>
        </div>`;return}let a="";a+=`<div style="padding:14px 20px;background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-bottom:none;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:12px;">
            <div style="width:56px;height:56px;background:${o.color}15;border:1px solid ${o.color}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:18px;font-weight:700;color:${o.color};">${x(bo(n.first_name,n.last_name))}</div>
            <div>
                <div style="display:flex;align-items:baseline;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:22px;font-weight:700;color:${o.color};">${x(e)}</span>
                    <span style="font-size:19px;font-weight:700;color:var(--text-bright,#f0efe6);">${x(n.first_name)} ${x(n.last_name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);margin-top:2px;">${x(o.fullTitle)}</div>
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
    </div>`,a+='<div style="background:var(--bg-2,#1a1a17);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:1px solid var(--border-0,rgba(255,255,255,0.06));flex:1;">';for(let r=0;r<i.length;r++){const s=i[r],l=!!s.locked;a+=`<div onmouseenter="this.dataset.hover='1';this.style.background='${l?"transparent":o.color+"06"}'" onmouseleave="this.dataset.hover='';this.style.background='transparent';var eb=this.querySelector('.act-exec-btn');if(eb)eb.style.display='none'" style="
            padding:16px 20px;
            ${r<i.length-1?"border-bottom:1px solid var(--border-0,rgba(255,255,255,0.06));":""}
            opacity:${l?"0.4":"1"};
            cursor:${l?"not-allowed":"pointer"};
        ">`,a+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:18px;font-weight:700;color:${l?"var(--text-dim)":"var(--text-bright,#f0efe6)"};">${x(s.name)}</span>`;for(const d of s.tags)a+=`<span style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.3px;padding:2px 6px;line-height:14px;color:${d==="IRREVERSIBLE"?"#c55":d==="OFFENSIVE"?"#c84":d==="STRUCTURAL"?"#ca5":d==="POLITICAL"?"#8a6aaa":"var(--text-dim)"};background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));">${x(d)}</span>`;a+=`</div>
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${s.costColor};">${x(s.cost)}</span>
            </div>
        </div>`,a+=`<div style="font-size:14px;color:${l?"var(--text-dim)":"var(--text-muted,#666)"};line-height:1.6;">${x(s.desc)}</div>`,s.descRed&&(a+=`<div style="font-size:13px;color:#c55;line-height:1.6;margin-top:4px;">${x(s.descRed)}</div>`),l&&s.lockReason&&(a+=`<div style="margin-top:6px;font-family:var(--font-mono);font-size:11px;color:#c84;display:flex;align-items:center;gap:4px;">
                <span>&#8856;</span><span>${x(s.lockReason)}</span>
            </div>`),l||(a+=`<div class="act-exec-btn" style="display:none;margin-top:10px;text-align:right;">
                <span onclick="event.stopPropagation();actExecute('${s.id}','${e}')" style="display:inline-block;padding:6px 24px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${o.color};cursor:pointer;">EXECUTE</span>
            </div>`),a+="</div>"}a+="</div>",a+=`<div style="padding:8px 20px;background:var(--bg-3,#252525);border:1px solid var(--border-0,rgba(255,255,255,0.06));border-top:none;">
        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">
            <span style="color:${o.color};font-weight:700;">${x(e)}</span> skill (${n.skill}/100) affects action outcomes.
            ${n.skill>=70?" High skill increases success probability and reduces costs.":n.skill>=50?" Moderate skill — outcomes are average. Consider recruiting a stronger executive.":" Low skill — actions are less effective and more expensive. Replacement recommended."}
        </div>
    </div>`,t.innerHTML=a,t.querySelectorAll("[onmouseenter]").forEach(r=>{r.addEventListener("mouseenter",function(){const s=this.querySelector(".act-exec-btn");s&&(s.style.display="block")}),r.addEventListener("mouseleave",function(){const s=this.querySelector(".act-exec-btn");s&&(s.style.display="none")})})}function ds(t,e,o,n,i){const a=N?.current_tick||0,r=Math.max(0,i-a),s=Math.round(n*(r/12)),l=`FIRE ${e}: ${o}

Contract remaining: ${r} ticks
Payout (prorated): $${(s/1e6).toFixed(2)}M

This amount will be deducted from your cash reserves immediately.

Are you sure?`;confirm(l)&&cs(t,e,s)}async function cs(t,e,o){try{const n=Number(c?.corp_cash_reserves??0);if(n<o){alert(`Insufficient funds. You need $${(o/1e6).toFixed(2)}M but only have $${(n/1e6).toFixed(2)}M.`);return}const i=n-o,{error:a}=await g.from("factions").update({corp_cash_reserves:i}).eq("id",c.id);if(a){alert("Failed to process payout: "+a.message);return}const{error:r}=await g.from("corp_executives").update({status:"fired",updated_at:new Date().toISOString()}).eq("id",t);if(r){await g.from("factions").update({corp_cash_reserves:n}).eq("id",c.id),alert("Failed to fire executive: "+r.message);return}c.corp_cash_reserves=i,Dt=Dt.filter(s=>s.id!==t),kt()}catch(n){console.error("[CorpOps] Fire executive error:",n),alert("An error occurred.")}}function ps(t,e){if((Wi[e]||[]).find(n=>n.id===t)?.cooldown==="once/tick"&&ss(t)){alert("This action can only be used once per tick. Wait for the next tick.");return}switch(t){case"statement":return Qi();case"loan":return Xi();case"restructure":return ea();case"rebrand":return ta();case"donate":return oa();case"bankruptcy":return Ki()}}let kn=!1;function Qi(){if(kn)return;kn=!0;const t=document.createElement("div");t.id="stmt-overlay",t.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",t.onclick=function(l){l.target===t&&Wn()};const e=c?.faction_name||"Corporation",o=(c?.abbreviation||c?.corp_ticker||"??").toUpperCase(),n=Number(c?.corp_cash_reserves??0),i=Me("CEO"),a=i?`${i.first_name} ${i.last_name}`:"CEO";t.innerHTML=`<div onclick="event.stopPropagation()" style="width:480px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c8a832;">${x(o)}</span>
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
    </div>`,document.body.appendChild(t);const r=document.getElementById("stmt-text"),s=document.getElementById("stmt-chars");r&&s&&(r.addEventListener("input",function(){s.textContent=this.value.length+"/500"}),r.focus())}function Wn(){const t=document.getElementById("stmt-overlay");t&&t.remove(),kn=!1}let Tt=!1;async function fs(){if(!c||!N||Tt)return;const t=document.getElementById("stmt-text"),e=document.getElementById("stmt-error"),o=(t?.value||"").trim();if(!o){e&&(e.textContent="Statement cannot be empty.",e.style.display="block");return}if(o.length>500){e&&(e.textContent="Statement too long (max 500 chars).",e.style.display="block");return}const n=Me("CEO"),i=n?n.skill:50,a=Math.round(2e4*Qt(i)),r=Number(c.corp_cash_reserves??0);if(r<a){e&&(e.textContent="Insufficient cash. Need "+_(a)+".",e.style.display="block");return}Tt=!0;const s=document.getElementById("stmt-submit-btn");s&&(s.style.opacity="0.4",s.style.pointerEvents="none");const l=c.faction_name||"Corporation",d=n?`${n.first_name} ${n.last_name}`:"CEO",f=N.current_tick||0,{error:p}=await g.from("factions").update({corp_cash_reserves:r-a}).eq("id",c.id);if(p){Tt=!1,e&&(e.textContent="Failed to deduct cost: "+p.message,e.style.display="block"),s&&(s.style.opacity="1",s.style.pointerEvents="auto");return}const{error:u}=await g.from("event_log").insert({nation_id:c.nation_id,faction_id:c.id,event_name:l+" — Press Release",description_used:d+", CEO of "+l+': "'+o.replace(/[<>"]/g,"")+'"',category:"business",trigger_key:"ceo_statement",effects_applied:{cost:a,ceo:d,skill:i},fired_at_tick:f});if(u){await g.from("factions").update({corp_cash_reserves:r}).eq("id",c.id),Tt=!1,e&&(e.textContent="Failed to publish: "+u.message,e.style.display="block"),s&&(s.style.opacity="1",s.style.pointerEvents="auto");return}c.corp_cash_reserves=r-a,Tt=!1,bt("statement"),Wn()}const yi=24,ms=.5;async function us(t,e){const o=e-yi,{data:n}=await g.from("event_log").select("fired_at_tick, effects_applied").eq("trigger_key","corp_bankruptcy").gte("fired_at_tick",o).order("fired_at_tick",{ascending:!1}).limit(20),i=(n||[]).find(r=>r.effects_applied?.user_id===t),a=i?Math.max(0,i.fired_at_tick+yi-e):0;return{onCooldown:a>0,ticksLeft:a}}let Zo=!1;async function Ki(){if(Zo)return;const{data:{user:t}}=await g.auth.getUser();if(!t){alert("Not logged in.");return}const e=c?.id||sessionStorage.getItem("active_faction_id");if(!e){alert("No active faction selected.");return}const{data:o,error:n}=await g.from("factions").select("*").eq("id",e).eq("faction_type","corporation").is("abandoned_at",null).single();if(n||!o){alert("No active corporation found. It may have already been dissolved.");return}const i=o,a=i.faction_name||"this corporation",{data:r,error:s}=await g.from("shard").select("current_tick").eq("name","Alpha Shard").single();if(s||!r){alert("Failed to read game tick. Please try again.");return}const l=r.current_tick||0,{onCooldown:d,ticksLeft:f}=await us(t.id,l);if(d){alert("Bankruptcy is on cooldown. You must wait "+f+" more tick"+(f!==1?"s":"")+" before declaring bankruptcy again.");return}if(!confirm("DECLARE BANKRUPTCY — "+a.toUpperCase()+`?

This will permanently:
• Dissolve the corporation
• Delete all properties, equipment, and inventory
• Pay back outstanding loans (up to 50% of market valuation)
• Remove all remaining cash reserves

You will need to found a new corporation.
There is a 24 tick cooldown on declaring bankruptcy.

This action CANNOT be undone.`))return;if(prompt('Type "BANKRUPT" to confirm bankruptcy of '+a+":")!=="BANKRUPT"){alert("Bankruptcy cancelled.");return}Zo=!0;try{async function u(T){const{error:j}=await T;if(j)throw j}const m=Number(i.corp_cash_reserves)||0,{data:v}=await g.from("corp_properties").select("purchase_price, condition, nation_id, type").eq("faction_id",e),b=Da(v),{data:y}=await g.from("corp_vessels").select("purchase_price, condition, built_at_tick, status").eq("faction_id",e),{data:$}=await g.from("shard").select("current_tick").eq("name","Alpha Shard").single(),h=$?.current_tick||0,E=Number(i.corp_loans)||0,S=Nn({cash:m,propertyValue:b,loans:E,vessels:y,currentTick:h}),z=Math.max(0,Math.round(S*ms)),{data:w}=await g.from("finance_active_loans").select("*").eq("borrower_faction_id",e).in("status",["current","late","delinquent"]).order("started_tick",{ascending:!0});let I=0;for(const T of w||[]){const j=T.principal-T.total_paid;if(j<=0)continue;const H=Math.min(j,z-I);if(H<=0)break;const{data:G}=await g.from("factions").select("corp_cash_reserves").eq("id",T.lender_faction_id).single();G&&await u(g.from("factions").update({corp_cash_reserves:(Number(G.corp_cash_reserves)||0)+H}).eq("id",T.lender_faction_id)),await u(g.from("finance_active_loans").update({status:"repaid",total_paid:T.total_paid+H,completed_tick:l}).eq("id",T.id)),I+=H}const A=i.nation_id||null,k=[...new Set((v||[]).filter(T=>T.type==="regional_hq").map(T=>T.nation_id).filter(T=>T&&T!==A))],q=[];async function R(T,j){const{data:H}=await g.from("nations").select("gdp_growth").eq("id",T).single();if(!H)return;const G=Number(H.gdp_growth??50),oe=Math.round(Math.max(0,Math.min(100,G+j))*10)/10;await u(g.from("nations").update({gdp_growth:oe}).eq("id",T)),q.push({nation_id:T,delta:j,before:G,after:oe})}A&&await R(A,-.2);for(const T of k)await R(T,-.1);await u(g.from("contract_bids").delete().eq("faction_id",e)),await u(g.from("construction_contracts").update({status:"expired"}).eq("issuer_faction_id",e).in("status",["open","bidding"])),await u(g.from("corp_equipment_deliveries").delete().eq("faction_id",e)),await u(g.from("corp_equipment").delete().eq("faction_id",e)),await u(g.from("corp_properties").delete().eq("faction_id",e)),await g.from("corp_material_inventory").delete().eq("faction_id",e),await g.from("corp_warehouse").delete().eq("faction_id",e),await g.from("corp_executives").delete().eq("faction_id",e),await g.from("faction_agitators").delete().eq("faction_id",e),await u(g.from("factions").delete().eq("id",e));const O=I>0?" $"+I.toLocaleString()+" was repaid to creditors.":"";await u(g.from("event_log").insert({nation_id:i.nation_id,faction_id:e,event_name:a+" — Bankruptcy",description_used:a+" has officially filed for bankruptcy. It has laid off its executive staff and ceased operations."+O,category:"business",trigger_key:"corp_bankruptcy",effects_applied:{corp_name:a,sector:i.corp_sector,user_id:t.id,loan_payback:I,valuation:S,gdp_penalties:q},fired_at_tick:l})),sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:B}=await g.from("factions").select("id, faction_type").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`),F=(B||[]).find(T=>T.faction_type==="party"),V=(B||[]).find(T=>T.faction_type==="corporation"),C=I>0?`
$`+I.toLocaleString()+" repaid to creditors.":"";F?(sessionStorage.setItem("active_faction_id",F.id),alert(a+" has declared bankruptcy."+C+`

Redirecting to your political party.`),window.location.href="dashboard.html"):V?(sessionStorage.setItem("active_faction_id",V.id),alert(a+" has declared bankruptcy."+C+`

Redirecting to your other corporation.`),window.location.href="corp-dashboard.html"):(alert(a+" has declared bankruptcy."+C+`

You have no remaining factions.`),window.location.href="faction-select.html")}catch(u){alert("Bankruptcy failed: "+(u.message||u)+`

Please try again or contact support.`)}finally{Zo=!1}}const Ji=[{id:"equipment",label:"Equipment Acquisition",desc:"Purchase vehicles, cranes, or heavy machinery",icon:"&#9881;"},{id:"working",label:"Working Capital",desc:"Bridge financing for active project costs",icon:"$"},{id:"property",label:"Property Purchase",desc:"Acquire office, warehouse, or HQ building",icon:"&#9632;"},{id:"subsidiary",label:"Subsidiary Expansion",desc:"Fund new subsidiary establishment",icon:"&#9672;"},{id:"materials",label:"Material Procurement",desc:"Bulk material purchase for upcoming projects",icon:"&#9638;"}],en=[{id:"none",label:"None",desc:"Unsecured — lenders may charge higher rates",risk:"HIGH",riskColor:"#c84"},{id:"equipment",label:"Equipment",desc:"Financed equipment serves as collateral",risk:"MODERATE",riskColor:"#ca5"},{id:"property",label:"Property",desc:"Corporate property lien",risk:"LOW",riskColor:"#8b9a6b"},{id:"full",label:"Full Assets",desc:"All corporate assets — maximum lender security",risk:"MINIMAL",riskColor:"#5c5"}];let ie=25e7,Ut="equipment",_t=48,me="equipment",_o="",zt=[];function Xi(){ie=25e7,Ut="equipment",_t=48,me="equipment",_o="",document.getElementById("lr-overlay").style.display="flex",bs(),Et()}function Zi(){document.getElementById("lr-overlay").style.display="none"}function vs(t){ie=Math.max(1e6,Math.min(5e9,Number(t)||0)),Et()}function ys(t){Ut=t,Et()}function gs(t){_t=t,Et()}function xs(t){me=t,Et()}async function bs(){if(!c)return;const{data:t}=await g.from("factions").select("id, faction_name, abbreviation, corp_ticker, corp_company_type").eq("faction_type","corporation").eq("corp_sector","Finance").is("abandoned_at",null).neq("id",c.id);zt=t||[],Et()}function Et(){const t=document.getElementById("lr-modal-content");if(!t)return;const e=Number(c?.corp_cash_reserves??0),o=Number(c?.corp_loans??0),n=Number(c?.corp_reputation??50),i=c?.faction_name||"Corporation",a=(c?.abbreviation||c?.corp_ticker||"??").toUpperCase(),r=o+ie,s=r>e*3?"#c55":r>e*1.5?"#c84":r>e?"#ca5":"#5c5",l=r>e*3?"DANGEROUS":r>e*1.5?"HEAVY":r>e?"MODERATE":"HEALTHY",d=me==="none"?"10-16%":me==="equipment"?"7-12%":me==="property"?"5-9%":"4-7%",p=Math.round(ie*(me==="none"?.13:me==="equipment"?.095:me==="property"?.07:.055)/12+ie/_t),u=en.find(v=>v.id===me)||en[0];let m="";m+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
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
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#c84;margin-top:1px;">${_(o)}</div>
        </div>
        <div style="flex:1;padding:6px 10px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.5px;">REPUTATION</div>
            <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#8b9a6b;margin-top:1px;">${n}</div>
        </div>
    </div>`,m+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">LOAN AMOUNT</span>
            <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#5a8aaa;">${_(ie)}</span>
        </div>
        <input type="range" min="1000000" max="5000000000" step="10000000" value="${ie}" oninput="lrSetAmount(this.value)" style="width:100%;height:4px;accent-color:#5a8aaa;" />
        <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;"><span>$1M</span><span>$5B</span></div>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">PURPOSE</div>
        <div style="display:flex;flex-direction:column;gap:3px;">`;for(const v of Ji){const b=Ut===v.id;m+=`<div onclick="lrSetPurpose('${v.id}')" style="display:flex;align-items:center;gap:8px;padding:5px 10px;cursor:pointer;background:${b?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${b?"#5a8aaa44":"var(--panel-border)"};border-left:2px solid ${b?"#5a8aaa":"transparent"};">
            <span style="font-family:var(--font-mono);font-size:10px;color:${b?"#5a8aaa":"#6a6660"};width:14px;text-align:center;">${v.icon}</span>
            <div><div style="font-size:11px;font-weight:600;color:${b?"var(--panel-text)":"#9e9a92"};">${v.label}</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">${v.desc}</div></div>
        </div>`}m+="</div></div>",m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">PREFERRED TERM</span>
            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--panel-text);">${_t} months</span>
        </div>
        <div style="display:flex;gap:3px;">`;for(const v of[12,24,36,48,60,84,120]){const b=_t===v;m+=`<span onclick="lrSetTerm(${v})" style="flex:1;text-align:center;padding:4px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;cursor:pointer;color:${b?"#000":"#6a6660"};background:${b?"#5a8aaa":"transparent"};border:1px solid ${b?"#5a8aaa":"var(--panel-border)"};">${v}</span>`}m+='</div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Lenders may offer different terms. This is your preference, not a guarantee.</div></div>',m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:6px;">COLLATERAL OFFERED</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:3px;">`;for(const v of en){const b=me===v.id;m+=`<div onclick="lrSetCollateral('${v.id}')" style="padding:6px 8px;cursor:pointer;background:${b?"rgba(90,138,170,0.06)":"transparent"};border:1px solid ${b?"#5a8aaa44":"var(--panel-border)"};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${b?"#5a8aaa":"#6a6660"};">${v.label}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:${v.riskColor};">${v.risk} RISK</span>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${v.desc}</div>
        </div>`}if(m+="</div></div>",m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;margin-bottom:4px;">NOTE TO LENDERS (OPTIONAL)</div>
        <textarea id="lr-note" rows="2" maxlength="300" onchange="lrNote=this.value"
            placeholder="e.g., Expanding into Heavy Infrastructure. Equipment purchase will generate $12M+ in annual contract revenue."
            style="width:100%;padding:6px 8px;font-family:var(--font-ui);font-size:10px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;resize:none;box-sizing:border-box;line-height:1.5;">${x(_o)}</textarea>
    </div>`,m+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;margin-bottom:6px;">Debt Impact Preview</div>
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:6px 10px;">
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">CURRENT DEBT</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#9e9a92;">${_(o)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
                <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">+ THIS LOAN</span>
                <span style="font-family:var(--font-mono);font-size:9px;color:#5a8aaa;">+${_(ie)}</span>
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
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. RATE RANGE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--panel-text);">${d}</div></div>
                <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">EST. MONTHLY PAYMENT</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--panel-text);">~${_(p)}</div></div>
            </div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:4px;">Estimates based on collateral offer and current market rates. Actual terms set by each lender.</div>
        </div>
    </div>`,m+="</div>",m+=`<div style="padding:10px 16px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:12px;">
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">REQUESTING</div><div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#5a8aaa;">${_(ie)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">COLLATERAL</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--panel-text);">${u.label}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;letter-spacing:0.8px;">SENT TO</div><div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:#9e9a92;">${zt.length} lender${zt.length!==1?"s":""}</div></div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="lrClose()" style="padding:6px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="lr-submit-btn" onclick="lrSubmit()" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#5a8aaa;cursor:pointer;">SUBMIT REQUEST</div>
        </div>
    </div>`,m+='<div id="lr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>',t.innerHTML=m}let no=!1;async function _s(){if(!c||!N||no)return;const t=document.getElementById("lr-error");if(ie<1e6){t.textContent="Minimum loan amount is $1M.",t.style.display="block";return}if(ie>5e9){t.textContent="Maximum loan amount is $5B.",t.style.display="block";return}const o=((Ji.find(r=>r.id===Ut)||{}).label||Ut)+(_o?" — "+_o:""),n=document.getElementById("lr-submit-btn");no=!0,n.style.opacity="0.5",n.style.pointerEvents="none";const i=N.current_tick||0,{error:a}=await g.from("finance_loan_requests").insert({requesting_faction_id:c.id,nation_id:c.nation_id,amount:ie,term_months:_t,purpose:o,created_tick:i,expires_tick:i+5});if(n.style.opacity="1",n.style.pointerEvents="auto",a){no=!1,t.textContent="Failed to submit: "+a.message,t.style.display="block",n.style.opacity="1",n.style.pointerEvents="auto";return}no=!1,Zi()}function ea(){if(!c)return;const t=Number(c.corp_loans??0),e=Number(c.corp_reputation??50),o=Number(c.corp_general_workforce??0),n=Number(c.corp_skilled_workforce??0),i=Number(c.corp_innovative_workforce??0),a=o+n+i;if(a===0){alert("Cannot restructure — no employees to lay off.");return}const r=Me("COO"),s=r?r.skill:50,l=Qt(s),d=10+Math.floor(Math.random()*11),f=Math.round(a*d/100),p=Math.round(t*.07),u=Math.round(p*(2-l)),m=3+Math.floor(Math.random()*10),v=Math.max(1,Math.round(m*l)),b=Math.round(o/a*f),y=Math.round(n/a*f),$=Math.max(0,Math.min(i,f-b-y)),h=document.createElement("div");h.id="restr-overlay",h.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",h.onclick=function(E){E.target===h&&Yn()},h.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
                    <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">General: ${o} &rarr; ${o-b}</span>
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
            <div id="restr-btn" onclick="actSubmitRestructure(${d},${u},${v},${b},${y},${$})" style="padding:6px 20px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:#8b9a6b;cursor:pointer;">RESTRUCTURE</div>
        </div>
        <div id="restr-error" style="padding:4px 16px;font-family:var(--font-mono);font-size:8px;color:#c55;display:none;"></div>
    </div>`,document.body.appendChild(h)}function Yn(){const t=document.getElementById("restr-overlay");t&&t.remove()}let io=!1;async function hs(t,e,o,n,i,a){if(!c||!N||io)return;io=!0;const r=document.getElementById("restr-btn");r&&(r.style.opacity="0.4",r.style.pointerEvents="none");const s=Number(c.corp_general_workforce??0),l=Number(c.corp_skilled_workforce??0),d=Number(c.corp_innovative_workforce??0),f=Number(c.corp_loans??0),p=Number(c.corp_reputation??50),u={corp_general_workforce:Math.max(0,s-n),corp_skilled_workforce:Math.max(0,l-i),corp_innovative_workforce:Math.max(0,d-a),corp_loans:Math.max(0,f-e),corp_reputation:Math.max(0,p-o)},{error:m}=await g.from("factions").update(u).eq("id",c.id);if(m){io=!1;const y=document.getElementById("restr-error");y&&(y.textContent="Failed: "+m.message,y.style.display="block"),r&&(r.style.opacity="1",r.style.pointerEvents="auto");return}Object.assign(c,u);const v=N.current_tick||0,{error:b}=await g.from("event_log").insert({nation_id:c.nation_id,faction_id:c.id,event_name:(c.faction_name||"Corporation")+" — Restructuring",description_used:(c.faction_name||"A corporation")+" has announced a restructuring, laying off "+t+"% of its workforce.",category:"business",trigger_key:"corp_restructure",effects_applied:{layoff_pct:t,debt_cut:e,rep_loss:o},fired_at_tick:v});b&&console.warn("Failed to log restructure event:",b.message),io=!1,bt("restructure"),Yn(),kt()}function ta(){const t=Me("CMO"),e=t?t.skill:50,o=Qt(e),n=Math.round(2e7*o),i=Math.max(1,Math.round(5*o)),a=Number(c?.corp_cash_reserves??0),r=Number(c?.corp_reputation??50),s=c?.faction_name||"",l=c?.abbreviation||c?.corp_ticker||"",d=document.createElement("div");d.id="rebrand-overlay",d.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",d.onclick=function(f){f.target===d&&Qn()},d.innerHTML=`<div onclick="event.stopPropagation()" style="width:440px;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">
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
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${o<=1?"#5cb85c":"#c84"};">&times;${o.toFixed(2)}</span>
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
    </div>`,document.body.appendChild(d)}function Qn(){const t=document.getElementById("rebrand-overlay");t&&t.remove()}let ao=!1;async function $s(t,e){if(!c||!N||ao)return;const o=t||2e7,n=e||5,i=document.getElementById("rebrand-error"),a=(document.getElementById("rebrand-name")?.value||"").trim().replace(/[<>"]/g,""),r=(document.getElementById("rebrand-abbr")?.value||"").trim().toUpperCase().replace(/[<>"]/g,"");if(!a||a.length<2){i&&(i.textContent="Name must be at least 2 characters.",i.style.display="block");return}if(!r||r.length<2||r.length>5){i&&(i.textContent="Abbreviation must be 2-5 characters.",i.style.display="block");return}const s=Number(c.corp_cash_reserves??0);if(s<o){i&&(i.textContent="Insufficient cash. Need "+_(o)+".",i.style.display="block");return}ao=!0;const l=document.getElementById("rebrand-btn");l&&(l.style.opacity="0.4",l.style.pointerEvents="none");const d=Number(c.corp_reputation??50),f=c.faction_name||"Corporation",{error:p}=await g.from("factions").update({faction_name:a,abbreviation:r,corp_ticker:r,corp_cash_reserves:s-o,corp_reputation:Math.max(0,d-n)}).eq("id",c.id);if(p){ao=!1,i&&(i.textContent="Failed: "+p.message,i.style.display="block"),l&&(l.style.opacity="1",l.style.pointerEvents="auto");return}c.faction_name=a,c.abbreviation=r,c.corp_ticker=r,c.corp_cash_reserves=s-o,c.corp_reputation=Math.max(0,d-n);const u=N.current_tick||0,{error:m}=await g.from("event_log").insert({nation_id:c.nation_id,faction_id:c.id,event_name:"Corporation Rebranded",description_used:f+" has rebranded to "+a+" ("+r+"). The rebrand costs $20M and reputation takes a temporary hit.",category:"corporate",trigger_key:"corp_rebrand",effects_applied:{old_name:f,new_name:a,new_abbr:r,rep_loss:n,cost:o},fired_at_tick:u});m&&console.warn("Failed to log rebrand event:",m.message),ao=!1,bt("rebrand"),Qn(),kt(),document.getElementById("corp-name-bar").textContent=a;const v=document.getElementById("corp-logo");v&&(v.textContent=r.slice(0,2))}const ws={liberty:"#9C27B0",equality:"#E91E63",freedom:"#5b9bd5",security:"#d48a3c",individualism:"#eab308",collectivism:"#ec4899",tradition:"#795548",progress:"#00BCD4",nationalism:"#FF5722",globalism:"#3F51B5"};function rt(t){return ws[(t||"").toLowerCase()]||"#9C27B0"}let Fe=[],Se=-1;async function oa(){Number(c?.corp_cash_reserves??0);const t=[c.nation_id],e=new Set(we.map(i=>i.id)),{data:o}=await g.from("factions").select("id, faction_name, abbreviation, party_color, party_funds, seats, momentum, nation, nation_id, leader_ideology, linked_user_id, ideology_value_1, ideology_value_2").eq("faction_type","party").in("nation_id",t).is("abandoned_at",null).order("seats",{ascending:!1});Fe=(o||[]).filter(i=>!e.has(i.id)).map(i=>({...i})),Se=-1;const n=document.createElement("div");n.id="donate-overlay",n.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:600;display:flex;align-items:center;justify-content:center;",n.onclick=function(i){i.target===n&&Kn()},document.body.appendChild(n),na()}function Kn(){const t=document.getElementById("donate-overlay");t&&t.remove(),Fe=[],Se=-1}function ks(t){Se=t,na()}function na(){const t=document.getElementById("donate-overlay");if(!t)return;const e=Me("Lobbyist"),o=e?e.skill:50,n=Math.round(1e6*Qt(o)),i=1e5,a=Number(c?.corp_cash_reserves??0),r=Se>=0?Fe[Se]:null,s=a>=n;let l='<div onclick="event.stopPropagation()" style="width:540px;max-height:80vh;background:var(--panel-main);border:1px solid var(--panel-border);display:flex;flex-direction:column;overflow:hidden;">';l+=`<div style="padding:14px 20px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
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
    </div>`,l+='<div style="flex:1;overflow-y:auto;padding:10px 0;">',l+='<div style="padding:0 20px 8px;font-family:var(--font-mono);font-size:10px;letter-spacing:1.5px;color:#6a6660;text-transform:uppercase;">Select a Party</div>',Fe.length===0&&(l+='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:12px;color:#6a6660;">No eligible parties found.</div>');for(let d=0;d<Fe.length;d++){const f=Fe[d],p=Se===d,u=f.party_color||"#8a6aaa",m=(f.momentum||0)>0?"var(--panel-text)":"#c55";l+=`<div onclick="donateSelectParty(${d})" style="
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
    </div>`,l+='<div id="donate-error" style="padding:6px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',l+="</div>",t.innerHTML=l}let st=!1;async function Es(){if(!c||!N||Se<0||st)return;const t=Fe[Se];if(!t)return;const e=Number(N?.current_tick||0);if(new Set(we.map(w=>w.id)).has(t.id)){const w=document.getElementById("donate-error");w&&(w.textContent="You cannot donate to your own party.",w.style.display="block");return}const n=Me("Lobbyist"),i=n?n.skill:50,a=Math.round(1e6*Qt(i)),r=1e5,s=2,{data:l,error:d}=await g.from("factions").select("corp_cash_reserves, last_donation_tick").eq("id",c.id).single();if(d||!l){const w=document.getElementById("donate-error");w&&(w.textContent="Failed to verify cooldown: "+(d?.message||"unknown"),w.style.display="block");return}const f=Number(l.last_donation_tick??0);if(f===e){const w=document.getElementById("donate-error");w&&(w.textContent="Political Donation is on cooldown until next tick.",w.style.display="block"),bt("donate");return}const p=Number(l.corp_cash_reserves??0);if(p<a){const w=document.getElementById("donate-error");w&&(w.textContent="Insufficient cash. Need "+_(a)+", have "+_(p)+".",w.style.display="block");return}st=!0;const u=document.getElementById("donate-btn");u&&(u.style.opacity="0.4",u.style.pointerEvents="none");const m=Number(c.corp_reputation??50),v=Math.max(0,m-s),{data:b,error:y}=await g.from("factions").update({corp_cash_reserves:p-a,corp_reputation:v,last_donation_tick:e}).eq("id",c.id).eq("last_donation_tick",f).select("id");if(y){const w=document.getElementById("donate-error");st=!1,w&&(w.textContent="Failed: "+y.message,w.style.display="block"),u&&(u.style.opacity="1",u.style.pointerEvents="auto");return}if(!b||b.length===0){const w=document.getElementById("donate-error");st=!1,w&&(w.textContent="Political Donation is on cooldown until next tick.",w.style.display="block"),u&&(u.style.opacity="1",u.style.pointerEvents="auto"),bt("donate");return}const{data:$}=await g.from("factions").select("party_funds").eq("id",t.id).single(),h=Number($?.party_funds??0),{error:E}=await g.from("factions").update({party_funds:h+r}).eq("id",t.id);if(E){await g.from("factions").update({corp_cash_reserves:p}).eq("id",c.id);const w=document.getElementById("donate-error");st=!1,w&&(w.textContent="Failed to transfer funds: "+E.message,w.style.display="block"),u&&(u.style.opacity="1",u.style.pointerEvents="auto");return}c.corp_cash_reserves=p-a,c.corp_reputation=v;const S=c.faction_name||"Corporation",{error:z}=await g.from("event_log").insert({nation_id:t.nation_id||c.nation_id,faction_id:c.id,event_name:S+" — Political Donation",description_chosen:S+" has donated "+_(a)+" to "+(t.faction_name||"a political party")+". The party receives "+_(r)+" in campaign funds. Corporate reputation decreases by "+s+".",category:"business",trigger_key:"corp_donation",effects_applied:{cost:a,recipient_faction_id:t.id,recipient_name:t.faction_name,funds_granted:r,reputation_loss:s,skill:i},fired_at_tick:e});z&&console.warn("Failed to log donation event:",z.message),st=!1,bt("donate"),Kn()}function Cs(t){vt=t,kt()}async function Ts(t){if(ke=t,Ce=-1,document.getElementById("exec-search-overlay").style.display="flex",jt.length===0&&c?.nation_id){const{data:e}=await g.from("executive_pool").select("id").eq("nation_id",c.nation_id).limit(1);if(!e||e.length===0){const n=c.nation||"",i=Va(c.nation_id,n),{error:a}=await g.from("executive_pool").insert(i);a&&console.warn("Failed to generate executive pool:",a.message)}const{data:o}=await g.from("executive_pool").select("*").eq("nation_id",c.nation_id).eq("status","available").order("skill",{ascending:!1});jt=o||[]}ra()}function ia(){document.getElementById("exec-search-overlay").style.display="none",ke=null,Ce=-1}function aa(t){return jt.filter(e=>e.status==="available"&&Array.isArray(e.specializations)&&e.specializations.includes(t)).sort((e,o)=>o.skill-e.skill)}function Ss(t){Ce=t,ra()}let ro=!1;async function zs(){if(!c||!N||!ke||Ce<0||ro)return;const e=aa(ke)[Ce];if(!e)return;ro=!0;const o=N.current_tick||0,n=document.getElementById("es-hire-btn");n&&(n.style.opacity="0.4",n.style.pointerEvents="none");const{error:i}=await g.from("corp_executives").insert({faction_id:c.id,role:ke,first_name:e.first_name,last_name:e.last_name,age:e.age,origin_nation:e.origin_nation,skill:e.skill,salary_per_year:e.required_salary,contract_years:e.required_years,contract_start_tick:o,contract_end_tick:o+e.required_years*12,status:"active"});if(i){ro=!1;const r=document.getElementById("es-error");r&&(r.textContent="Failed: "+i.message,r.style.display="block"),n&&(n.style.opacity="1",n.style.pointerEvents="auto");return}const{error:a}=await g.from("executive_pool").update({status:"hired",hired_by_faction_id:c.id}).eq("id",e.id);a&&console.warn("Failed to mark pool candidate as hired:",a.message),ro=!1,ia(),await Gi(),vt=lo.indexOf(ke),vt<0&&(vt=0),kt()}function ra(){const t=document.getElementById("exec-search-content");if(!t||!ke)return;const e=ke,o=co[e],n=aa(e),i=Ce>=0?n[Ce]:null;let a="";a+=`<div style="padding:12px 20px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-size:10px;color:${o.color};">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Executive Search</span>
            </div>
            <span onclick="closeExecSearch()" style="font-family:var(--font-mono);font-size:18px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
        <div style="display:flex;align-items:center;gap:10px;margin-top:5px;">
            <span style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Hiring:</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:${o.color};">${x(e)}</span>
            <span style="font-size:13px;color:var(--text-bright,#f0efe6);">${x(o.fullTitle)}</span>
        </div>
    </div>`,a+='<div style="display:flex;flex:1;min-height:0;overflow:hidden;">',a+='<div style="width:300px;border-right:1px solid var(--panel-border);overflow-y:auto;flex-shrink:0;">',n.length===0&&(a+=`<div style="padding:30px 20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No candidates available for this role in your nation.</div>
        </div>`);for(let r=0;r<n.length;r++){const s=n[r],l=Ce===r,d=xt(s.skill);a+=`<div onclick="esSelectCandidate(${r})" style="
            padding:10px 14px;
            border-bottom:1px solid var(--panel-border);
            border-left:3px solid ${l?o.color:"transparent"};
            background:${l?o.color+"08":"transparent"};
            cursor:pointer;
        ">
            <div style="display:flex;align-items:center;gap:10px;">
                <div style="width:40px;height:40px;background:${o.color}10;border:1px solid ${o.color}22;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${o.color};flex-shrink:0;">${x(bo(s.first_name,s.last_name))}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:13px;font-weight:600;color:${l?"var(--text-bright,#f0efe6)":"#9e9a92"};overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x(s.first_name)} ${x(s.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-top:3px;">
                        <div style="display:flex;align-items:center;gap:4px;flex:1;">
                            <div style="flex:1;height:3px;background:var(--panel-border);">
                                <div style="width:${s.skill}%;height:100%;background:${d};"></div>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:${d};width:18px;text-align:right;">${s.skill}</span>
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
                <div style="width:64px;height:64px;background:${o.color}12;border:1px solid ${o.color}28;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:20px;font-weight:700;color:${o.color};">${x(bo(i.first_name,i.last_name))}</div>
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
        </div>`;const l=i.skill>=80?"EXCEPTIONAL":i.skill>=65?"STRONG":i.skill>=50?"COMPETENT":i.skill>=35?"DEVELOPING":"WEAK",d=i.skill>=80?"Elite talent. Actions have high success rate and reduced costs.":i.skill>=65?"Strong performer. Reliable outcomes across most actions.":i.skill>=50?"Adequate for the role. Outcomes are average.":i.skill>=35?"Below average. Actions may fail or cost more. Consider alternatives.":"Poor fit. High failure rates. Replacement recommended.";a+=`<div style="padding:12px 20px;">
            <div style="padding:8px 12px;background:${s}08;border:1px solid ${s}18;">
                <div style="font-family:var(--font-mono);font-size:10px;color:${s};letter-spacing:0.8px;margin-bottom:3px;">${l}</div>
                <div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;">${d}</div>
            </div>
        </div>`}a+="</div>",a+="</div>",a+=`<div style="padding:12px 20px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;gap:14px;">`,i?a+=`<div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">CANDIDATE</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:var(--text-bright,#f0efe6);">${x(i.first_name)} ${x(i.last_name)}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SKILL</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${xt(i.skill)};">${i.skill}</div></div>
            <div><div style="font-family:var(--font-mono);font-size:9px;color:#6a6660;letter-spacing:0.8px;">SALARY</div><div style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:#c84;">${pt(i.required_salary)}/yr</div></div>`:a+='<div style="font-family:var(--font-mono);font-size:11px;color:#6a6660;">Select a candidate to hire</div>',a+=`</div>
        <div style="display:flex;gap:8px;">
            <div onclick="closeExecSearch()" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="es-hire-btn" onclick="esHireCandidate()" style="padding:8px 24px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:${i?"#000":"#6a6660"};background:${i?o.color:"var(--panel-border)"};cursor:${i?"pointer":"not-allowed"};${i?"":"opacity:0.4;pointer-events:none;"}">HIRE</div>
        </div>
    </div>`,a+='<div id="es-error" style="padding:5px 20px;font-family:var(--font-mono);font-size:10px;color:#c55;display:none;"></div>',t.innerHTML=a}function No(){return Q.reduce((e,o)=>{const n=Number(o.capacity||0),i=Number(o.condition||0)/100;return e+Math.floor(n*i)},0)+500}function Is(t,e){const o=Qe.find(a=>a.id===t),n=Number(c?.[o.factionKey]??0),i=re[t]+e;if(!(n+i<0)){if(e>0){const a=Qe.reduce((s,l)=>{const d=Number(c?.[l.factionKey]??0),f=l.id===t?i:re[l.id];return s+d+f},0),r=No();if(a>r)return}re[t]=i,Mo()}}function Ns(t){t?re[t]=0:re={general:0,skilled:0,innovative:0},Mo()}async function Ms(){if(Xo||!Object.values(re).some(r=>r!==0))return;let e=0;for(const r of Qe){const s=re[r.id];s>0&&(e+=s*Fi(r.multiplier)*.1)}const o=Number(c?.corp_cash_reserves??0);if(e>o){alert("Insufficient cash reserves. Hiring cost: "+_(e)+", available: "+_(o));return}const n=Qe.reduce((r,s)=>r+Number(c?.[s.factionKey]??0)+re[s.id],0),i=No();if(n>i){alert("Cannot hire beyond property capacity ("+i.toLocaleString()+"). You need more workplaces.");return}const a=e>0?`Confirm workforce changes?

Hiring fee: `+_(e)+" (deducted from cash reserves)":`Confirm workforce changes?

Firing workers — no cost.`;if(confirm(a)){Xo=!0;try{const r={};for(const d of Qe){const f=Number(c?.[d.factionKey]??0);r[d.factionKey]=Math.max(0,f+re[d.id])}e>0&&(r.corp_cash_reserves=Math.max(0,o-Math.round(e)));const{error:s}=await g.from("factions").update(r).eq("id",c.id);if(s)throw s;Object.assign(c,r),re={general:0,skilled:0,innovative:0};const l=document.getElementById("topbar-cash");if(l){const d=Number(c.corp_cash_reserves??0);l.textContent="CASH: "+(d>=1e6?"$"+(d/1e6).toFixed(1)+"M":"$"+Math.round(d/1e3)+"k")}Mo()}catch(r){alert("Error: "+r.message)}finally{Xo=!1}}}function Mo(){const t=document.getElementById("hf-card-container");if(!t)return;const e="'JetBrains Mono', monospace",o={bg:"var(--bg-card)",surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},n=Number(M?.minimum_wage??50),i=Number(M?.inflation??50),a=Number(M?.standard_of_living??50),r=n/100*48e3,s=(1+(i-50)/100*.5).toFixed(2),l=(1+(a-50)/100*.5).toFixed(2),d=M?.name||c?.nation||"Nation",f=Object.values(re).some(h=>h!==0),p=No();let u=0,m=0,v=0,b=0,y="";for(const h of Qe){const E=Number(c?.[h.factionKey]??0),S=re[h.id],z=E+S,w=Fi(h.multiplier),I=S>0,A=E*w,k=z*w,q=k-A;u+=E,m+=z,v+=A,b+=k;const R=S!==0?I?"rgba(92,204,92,0.02)":"rgba(204,85,85,0.02)":"transparent";y+=`
        <div style="padding:10px 14px;border-bottom:1px solid ${o.border};background:${R};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <div style="width:4px;height:14px;background:${h.color}"></div>
                    <span style="font-size:12px;font-weight:700;color:${o.text}">${h.label}</span>
                </div>
                <div style="display:flex;align-items:baseline;gap:4px;">
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${o.text}">${E.toLocaleString()}</span>
                    ${S!==0?`<span style="font-family:${e};font-size:10px;color:${o.dim}">→</span>
                    <span style="font-family:${e};font-size:16px;font-weight:700;color:${I?o.greenBright:o.red}">${z.toLocaleString()}</span>`:""}
                </div>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <span style="font-family:${e};font-size:8px;color:${o.dim}">WAGE (MIN × ${h.multiplier}.0 × ${s} × ${l})</span>
                <span style="font-family:${e};font-size:10px;color:${h.color}">${_(w)}/yr</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <div onclick="hfSetChange('${h.id}',-50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${o.red};border:1px solid ${o.border};cursor:pointer;background:${o.card}">-50</div>
                <div onclick="hfSetChange('${h.id}',-10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${o.redDim};border:1px solid ${o.border};cursor:pointer;background:${o.card}">-10</div>
                <div style="flex:1;text-align:center;padding:2px 0;background:${S!==0?o.card:"transparent"};border:1px solid ${S!==0?o.border:"transparent"}">
                    ${S!==0?`<div style="display:flex;align-items:center;justify-content:center;gap:6px;">
                        <span style="font-family:${e};font-size:12px;font-weight:700;color:${I?o.greenBright:o.red}">${I?"+":""}${S}</span>
                        <span onclick="hfReset('${h.id}')" style="font-family:${e};font-size:8px;color:${o.dim};cursor:pointer;padding:0 4px">✕</span>
                    </div>`:`<span style="font-family:${e};font-size:9px;color:${o.dim}">—</span>`}
                </div>
                <div onclick="hfSetChange('${h.id}',10)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${o.greenBright};border:1px solid ${o.border};cursor:pointer;background:${o.card}">+10</div>
                <div onclick="hfSetChange('${h.id}',50)" style="width:28px;height:24px;display:flex;align-items:center;justify-content:center;font-family:${e};font-size:8px;font-weight:700;color:${o.greenBright};border:1px solid ${o.border};cursor:pointer;background:${o.card}">+50</div>
            </div>
            ${S!==0?`<div style="margin-top:6px;padding:4px 8px;background:${o.bg};border:1px solid ${o.border};display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${o.dim}">ANNUAL COST IMPACT</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${q>0?o.red:o.greenBright}">${q>0?"+":""}${_(q)}/yr</span>
            </div>`:""}
        </div>`}const $=b-v;t.innerHTML=`
    <div style="width:380px;height:450px;background:${o.surface};border:1px solid ${o.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${o.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${o.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${o.muted};text-transform:uppercase">Hire / Fire</span>
            </div>
            <span style="font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;color:${o.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${d.toUpperCase()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            <div style="padding:6px 14px;border-bottom:1px solid ${o.border};background:${o.card};">
                <div style="font-family:${e};font-size:8px;letter-spacing:1.5px;color:${o.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;gap:0;">
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${o.border}">
                        <div style="font-family:${e};font-size:7px;color:${o.dim};letter-spacing:0.5px">MIN WAGE</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${o.text}">${n}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${o.dim}">${_(r)}/yr</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;border-right:1px solid ${o.border}">
                        <div style="font-family:${e};font-size:7px;color:${o.dim};letter-spacing:0.5px">INFLATION</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${o.text}">${i}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${o.dim}">×${s}</div>
                    </div>
                    <div style="flex:1;padding:2px 6px;">
                        <div style="font-family:${e};font-size:7px;color:${o.dim};letter-spacing:0.5px">STD OF LIVING</div>
                        <div style="font-family:${e};font-size:10px;font-weight:700;color:${o.text}">${a}/100</div>
                        <div style="font-family:${e};font-size:7px;color:${o.dim}">×${l}</div>
                    </div>
                </div>
            </div>
            ${y}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${o.border};background:${o.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;${f?"margin-bottom:6px;":""}">
                <div>
                    <div style="font-family:${e};font-size:7px;color:${o.dim};letter-spacing:0.8px">WORKFORCE / CAPACITY</div>
                    <div style="display:flex;align-items:baseline;gap:4px;">
                        <span style="font-family:${e};font-size:13px;font-weight:700;color:${u>=p?o.red:o.text}">${f?m.toLocaleString():u.toLocaleString()}</span>
                        <span style="font-family:${e};font-size:9px;color:${o.dim}">/ ${p.toLocaleString()}</span>
                    </div>
                    ${u>=p&&!f?`<div style="font-family:${e};font-size:7px;color:${o.red};margin-top:2px;">Need workplaces to hire new employees.</div>`:""}
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:7px;color:${o.dim};letter-spacing:0.8px">ANNUAL WAGES</div>
                    <div style="display:flex;align-items:baseline;gap:4px;justify-content:flex-end;">
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${o.text}">${_(v)}</span>
                        ${f?`<span style="font-family:${e};font-size:9px;color:${o.dim}">→</span>
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${$>0?o.red:o.greenBright}">${_(b)}</span>`:""}
                    </div>
                </div>
            </div>
            ${f?`<div style="display:flex;justify-content:space-between;align-items:center;padding-top:6px;border-top:1px solid ${o.border};">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-family:${e};font-size:8px;color:${o.dim}">NET CHANGE</span>
                    <span style="font-family:${e};font-size:11px;font-weight:700;color:${$>0?o.red:o.greenBright}">${$>0?"+":""}${_($)}/yr</span>
                    <span style="font-family:${e};font-size:8px;color:${o.dim}">(${$>0?"+":""}${_(Math.round($/12))}/tick)</span>
                </div>
                <div style="display:flex;gap:6px;">
                    <div onclick="hfReset()" style="padding:4px 12px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:${o.dim};border:1px solid ${o.border};cursor:pointer">RESET</div>
                    <div onclick="hfConfirm()" style="padding:4px 14px;font-family:${e};font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${o.accent};cursor:pointer">CONFIRM</div>
                </div>
            </div>`:""}
        </div>
    </div>`}function As(){const t=document.getElementById("wf-summary-container");if(!t)return;const e="'JetBrains Mono', monospace",o={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",blue:"#5a9abf",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660",red:"#c55"},n=(M?.name||c?.nation||"Nation").toUpperCase(),i=Number(M?.minimum_wage??50),a=Number(M?.inflation??50),r=Number(M?.standard_of_living??50),s=i/100*48e3,l=1+(a-50)/100*.5,d=1+(r-50)/100*.5,f=[{label:"General Workforce",mult:2,color:o.accent,key:"corp_general_workforce",countColor:o.text},{label:"Skilled Workforce",mult:3,color:o.gold,key:"corp_skilled_workforce",countColor:o.blue},{label:"Innovative Workforce",mult:6,color:o.orange,key:"corp_innovative_workforce",countColor:o.gold}];let p=0,u=0,m="";for(const v of f){const b=Number(c?.[v.key]??0),y=Math.round(s*v.mult*l*d),$=b*y;p+=b,u+=$,m+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${o.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:12px;font-weight:700;color:${o.text}">${v.label}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;margin-left:4px;color:${o.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${n}</span>
                </div>
                <span style="font-family:${e};font-size:16px;font-weight:700;color:${v.countColor}">${b.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:2px;">
                <span style="font-family:${e};font-size:8px;color:${o.dim}">WAGE (MIN × ${v.mult}.0 × ${l.toFixed(2)} × ${d.toFixed(2)})</span>
                <span style="font-family:${e};font-size:10px;color:${o.muted}">${_(y)}/yr</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:1px;">
                <span style="font-family:${e};font-size:8px;color:${o.dim}">TOTAL ANNUAL COST</span>
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${o.text}">${_($)}</span>
            </div>
        </div>`}t.innerHTML=`
    <div style="width:380px;height:450px;background:${o.surface};border:1px solid ${o.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${o.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${o.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${o.muted};text-transform:uppercase">Workforce</span>
            </div>
            <span style="font-family:${e};font-size:12px;font-weight:700;color:${o.text}">${p.toLocaleString()}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${m}
            <div style="padding:8px 12px;background:${o.card};border-bottom:1px solid ${o.border};">
                <div style="font-family:${e};font-size:8px;letter-spacing:1px;color:${o.dim};text-transform:uppercase;margin-bottom:4px">Wage Inputs</div>
                <div style="display:flex;justify-content:space-between;">
                    <span style="font-family:${e};font-size:8px;color:${o.dim}">MINIMUM WAGE (${n})</span>
                    <span style="font-family:${e};font-size:9px;color:${o.text}">${i}/100 → ${_(s)}/yr</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${e};font-size:8px;color:${o.dim}">INFLATION MODIFIER</span>
                    <span style="font-family:${e};font-size:9px;color:${o.text}">×${l.toFixed(2)}</span>
                </div>
                <div style="display:flex;justify-content:space-between;margin-top:2px;">
                    <span style="font-family:${e};font-size:8px;color:${o.dim}">STD OF LIVING MODIFIER</span>
                    <span style="font-family:${e};font-size:9px;color:${o.text}">×${d.toFixed(2)}</span>
                </div>
            </div>
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${o.border};background:${o.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${e};font-size:8px;color:${o.dim};letter-spacing:0.8px">TOTAL WORKFORCE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${o.text}">${p.toLocaleString()}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                <span style="font-family:${e};font-size:8px;color:${o.dim};letter-spacing:0.8px">TOTAL ANNUAL WAGES</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${o.red}">${_(u)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:8px;color:${o.dim};letter-spacing:0.8px">PER TICK (÷12)</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${o.red}">${_(Math.round(u/12))}</span>
            </div>
        </div>
    </div>`}let Q=[];async function Ao(){if(!c?.id)return;const{data:t}=await g.from("corp_properties").select("*").eq("faction_id",c.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});Q=t||[]}function Ro(){const t=document.getElementById("property-card-container");if(!t)return;const e="'JetBrains Mono', monospace",o={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",green:"#4a8",red:"#c55",gold:"#c8a832",orange:"#c84",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},n=(M?.name||c?.nation||"Nation").toUpperCase(),i=1+(Number(M?.inflation??50)-50)/100*.3;let a="",r=0,s=0;const l=M?.name||c?.nation||"Home Nation",d=5e7,f=1+(Number(M?.inflation??50)-50)/100*.3,p=.8+Number(M?.stability??50)/100*.4,u=Math.round(d*f*p),m=Math.round(u*.005);r+=u,s+=m,a+=`
    <div style="padding:8px 12px;border-bottom:1px solid ${o.border};">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
            <span style="font-size:11px;font-weight:600;color:${o.text}">National Headquarters</span>
            <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:#5c5;background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">HQ</span>
        </div>
        <div style="font-family:${e};font-size:8px;color:${o.dim};margin-bottom:4px;">${l} · Headquarters</div>
        <div style="display:flex;gap:0;background:${o.card};border:1px solid ${o.border}">
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${o.border}">
                <div style="font-family:${e};font-size:7px;color:${o.dim}">CAPACITY</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${o.text}">500</div>
            </div>
            <div style="flex:1;padding:3px 6px;border-right:1px solid ${o.border}">
                <div style="font-family:${e};font-size:7px;color:${o.dim}">VALUE</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${o.gold}">${_(u)}</div>
            </div>
            <div style="flex:1;padding:3px 6px">
                <div style="font-family:${e};font-size:7px;color:${o.dim}">MAINT/MO</div>
                <div style="font-family:${e};font-size:10px;font-weight:700;color:${o.red}">${_(m)}</div>
            </div>
        </div>
    </div>`;for(const v of Q){const b=ho[v.style]||ho.Basic;r+=Number(v.purchase_price||0),s+=Number(v.monthly_maintenance||0),a+=`
        <div style="padding:8px 12px;border-bottom:1px solid ${o.border};">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:${o.text}">${v.name}</span>
                <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${o.green};background:rgba(68,170,136,0.08);border:1px solid rgba(68,170,136,0.15)">OWNED</span>
            </div>
            <div style="font-family:${e};font-size:8px;color:${o.dim};margin-bottom:4px;">${v.city||n} · ${(v.type||"").replace(/_/g," ")} · <span style="color:${b.color}">${(v.style||"Basic").toUpperCase()}</span></div>
            <div style="display:flex;gap:0;background:${o.card};border:1px solid ${o.border}">
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${o.border}">
                    <div style="font-family:${e};font-size:7px;color:${o.dim}">CAPACITY</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${o.text}">${(v.capacity||0).toLocaleString()}</div>
                </div>
                <div style="flex:1;padding:3px 6px;border-right:1px solid ${o.border}">
                    <div style="font-family:${e};font-size:7px;color:${o.dim}">PAID</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${o.gold}">${_(v.purchase_price||0)}</div>
                </div>
                <div style="flex:1;padding:3px 6px">
                    <div style="font-family:${e};font-size:7px;color:${o.dim}">MAINT/MO</div>
                    <div style="font-family:${e};font-size:10px;font-weight:700;color:${o.red}">${_(v.monthly_maintenance||0)}</div>
                </div>
            </div>
            <div style="margin-top:4px;display:flex;justify-content:space-between;">
                <span style="font-family:${e};font-size:7px;color:${o.dim}">CONDITION</span>
                <span style="font-family:${e};font-size:9px;color:${v.condition>=75?"#5c5":v.condition>=50?"#ca5":o.orange}">${v.condition}%</span>
            </div>
            <div style="width:100%;height:3px;background:${o.border};margin-top:2px;"><div style="width:${v.condition}%;height:100%;background:${v.condition>=75?"#5c5":v.condition>=50?"#ca5":o.orange}"></div></div>
            <div style="display:flex;gap:4px;margin-top:6px;">
                <div onclick="propRefurbish('${v.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${o.accent};border:1px solid ${o.accent}33;cursor:pointer;">REFURBISH (${_(Math.round((v.purchase_price||0)*.1*i))})</div>
                <div onclick="propSell('${v.id}')" style="flex:1;padding:3px 0;text-align:center;font-family:${e};font-size:7px;font-weight:700;letter-spacing:0.8px;color:${o.red};border:1px solid ${o.red}33;cursor:pointer;">SELL</div>
            </div>
        </div>`}t.innerHTML=`
    <div style="width:380px;height:450px;background:${o.surface};border:1px solid ${o.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${o.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${o.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${o.muted};text-transform:uppercase">Property</span>
            </div>
            <span style="font-family:${e};font-size:10px;color:${o.muted}">${Q.length+1} ASSET${Q.length+1!==1?"S":""}</span>
        </div>
        <div style="flex:1;overflow:auto;">
            ${a}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${o.border};background:${o.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
                <span style="font-family:${e};font-size:8px;color:${o.dim};letter-spacing:0.8px">TOTAL VALUE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${o.green}">${_(r)}</span>
            </div>
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${o.dim};letter-spacing:0.8px">TOTAL MAINTENANCE</span>
                <span style="font-family:${e};font-size:13px;font-weight:700;color:${o.red}">${_(s)}/mo</span>
            </div>
        </div>
    </div>`}let ft=[],de=null;const ho={Basic:{color:"#6a6660",label:"BASIC"},Modern:{color:"#8b9a6b",label:"MODERN"},Sustainable:{color:"#5c5",label:"SUSTAINABLE"},Innovative:{color:"#c8a832",label:"INNOVATIVE"},Heritage:{color:"#c84",label:"HERITAGE"},Premium:{color:"#ca5",label:"PREMIUM"}};async function Jn(){if(!c?.nation_id)return;const{data:t,error:e}=await g.from("available_properties").select("*").eq("nation_id",c.nation_id).eq("status","available").order("price",{ascending:!0});if(e){console.warn("[Property] Failed to load marketplace:",e.message);return}const o=c?.corp_sector==="Construction";ft=(t||[]).filter(n=>o||n.type!=="warehouse").map(n=>({...n,adjusted_cost:n.price,adjusted_maintenance:n.monthly_maintenance}))}function Lo(){const t=document.getElementById("new-property-container");if(!t)return;const e="'JetBrains Mono', monospace",o={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"};(M?.name||c?.nation||"Nation").toUpperCase();const n=Number(M?.standard_of_living??50),i=Number(M?.gdp_growth??50),a=Number(M?.inflation??50),r=M?.capital||"Capital",s={capital:r,port:r+" Port",industrial:r+" Industrial Zone",suburban:r+" Suburbs",coastal:r+" Coast"};let l="";if(ft.length===0)l=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${o.dim}">No properties available in this market.<br>Improve GDP Growth and Standard of Living to unlock more.</div>`;else for(let d=0;d<ft.length;d++){const f=ft[d],p=de===d,u=ho[f.style]||ho.Basic,m=s[f.city_template]||r;l+=`
            <div onclick="npSelect(${d})" style="padding:8px 14px;border-bottom:1px solid ${o.border};cursor:pointer;border-left:2px solid ${p?o.accent:"transparent"};background:${p?"rgba(139,154,107,0.03)":"transparent"};">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <span style="font-size:11px;font-weight:600;color:${o.text}">${f.name}</span>
                    <span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${u.color};background:${u.color}12;border:1px solid ${u.color}25">${u.label}</span>
                </div>
                <div style="font-family:${e};font-size:8px;color:${o.dim};margin-bottom:5px;">${m} · ${f.type.replace(/_/g," ")}</div>
                <div style="display:flex;gap:0;background:${o.card};border:1px solid ${o.border}">
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${o.border}">
                        <div style="font-family:${e};font-size:7px;color:${o.dim};letter-spacing:0.5px">CAPACITY</div>
                        <div style="font-family:${e};font-size:11px;font-weight:700;color:${o.text};margin-top:1px">${f.capacity.toLocaleString()}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px;border-right:1px solid ${o.border}">
                        <div style="font-family:${e};font-size:7px;color:${o.dim};letter-spacing:0.5px">PRICE</div>
                        <div style="font-family:${e};font-size:11px;font-weight:700;color:${o.gold};margin-top:1px">${_(f.adjusted_cost)}</div>
                    </div>
                    <div style="flex:1;padding:4px 8px">
                        <div style="font-family:${e};font-size:7px;color:${o.dim};letter-spacing:0.5px">MAINT/MO</div>
                        <div style="font-family:${e};font-size:11px;font-weight:700;color:${o.redDim};margin-top:1px">${_(f.adjusted_maintenance)}</div>
                    </div>
                </div>
                ${p?`<div style="margin-top:5px;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:${e};font-size:7px;color:${o.dim}">CONDITION</span>
                        <span style="font-family:${e};font-size:9px;color:${f.condition>=75?o.greenBright:f.condition>=50?o.yellow:o.orange}">${f.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${o.border}"><div style="width:${f.condition}%;height:100%;background:${f.condition>=75?o.greenBright:f.condition>=50?o.yellow:o.orange}"></div></div>
                </div>`:""}
            </div>`}t.innerHTML=`
    <div style="width:380px;height:450px;background:${o.surface};border:1px solid ${o.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${o.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${o.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${o.muted};text-transform:uppercase">New Property</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${o.dim}">${ft.length} AVAILABLE</span>
        </div>
        <div style="padding:4px 14px;border-bottom:1px solid ${o.border};display:flex;gap:12px;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${e};font-size:7px;color:${o.dim}">STD OF LIVING</span>
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${n>=50?o.greenBright:o.yellow}">${Math.round(n)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${e};font-size:7px;color:${o.dim}">GDP GROWTH</span>
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${i>=50?o.greenBright:o.yellow}">${Math.round(i)}</span>
            </div>
            <div style="display:flex;align-items:center;gap:4px;">
                <span style="font-family:${e};font-size:7px;color:${o.dim}">INFLATION</span>
                <span style="font-family:${e};font-size:9px;font-weight:700;color:${a<=50?o.greenBright:o.red}">${Math.round(a)}</span>
            </div>
        </div>
        <div style="flex:1;overflow:auto;">
            ${l}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${o.border};background:${o.card};flex-shrink:0;">
            <div style="display:flex;gap:6px;justify-content:space-between;">
                <div onclick="npOpenConstructionModal()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${o.gold};border:1px solid ${o.gold}44;cursor:pointer">CONSTRUCTION PROJECT</div>
                <div onclick="npBuyProperty()" style="flex:1;padding:6px 0;text-align:center;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${de!==null?"#000":o.dim};background:${de!==null?o.accent:"transparent"};border:1px solid ${de!==null?o.accent:o.border};cursor:${de!==null?"pointer":"default"};opacity:${de!==null?1:.4}">BUY PROPERTY</div>
            </div>
        </div>
    </div>`}function Rs(t){de=de===t?null:t,Lo()}let tn=!1;async function Ls(){if(de===null||tn)return;const t=ft[de];if(!t)return;const e=Number(c?.corp_cash_reserves??0);if(t.adjusted_cost>e){alert(`Insufficient cash reserves.
Property: `+_(t.adjusted_cost)+`
Cash: `+_(e));return}if(confirm('Buy "'+t.name+'" for '+_(t.adjusted_cost)+`?

Monthly maintenance: `+_(t.adjusted_maintenance)+`/mo
Condition: `+t.condition+`%

This will be deducted from your cash reserves.`)){tn=!0;try{const{error:o}=await g.from("corp_properties").insert({faction_id:c.id,nation_id:c.nation_id,catalog_id:t.catalog_id||null,name:t.name,type:t.type,style:t.style,capacity:t.capacity,purchase_price:t.adjusted_cost,monthly_maintenance:t.adjusted_maintenance,condition:t.condition,city:t.city,purchased_at_tick:Number(document.getElementById("tick-number")?.textContent||0),is_active:!0});if(o)throw o;const n=Math.max(0,e-t.adjusted_cost),{error:i}=await g.from("factions").update({corp_cash_reserves:n}).eq("id",c.id);if(i)throw i;c.corp_cash_reserves=n,t.id&&await g.from("available_properties").update({status:"sold",purchased_by:c.id}).eq("id",t.id);const a=document.getElementById("topbar-cash");a&&(a.textContent="CASH: "+(n>=1e6?"$"+(n/1e6).toFixed(1)+"M":"$"+Math.round(n/1e3)+"k")),de=null,await Jn(),Lo(),Ro(),alert("Property purchased: "+t.name+`

Deducted: `+_(t.adjusted_cost))}catch(o){alert("Purchase failed: "+o.message)}finally{tn=!1}}}const ht={Basic:{costMod:1,maintMod:1,repGain:1,color:"#6a6660",desc:"Functional. No frills."},Modern:{costMod:1.4,maintMod:1.2,repGain:2,color:"#8b9a6b",desc:"Contemporary design. Good retention."},Sustainable:{costMod:1.6,maintMod:.8,repGain:3,color:"#5c5",desc:"Green building. Lower upkeep."},Innovative:{costMod:2,maintMod:1.5,repGain:4,color:"#c8a832",desc:"Cutting edge. Attracts top talent."},Heritage:{costMod:1.3,maintMod:1.4,repGain:2,color:"#c84",desc:"Restored historic. High character."},Premium:{costMod:2.5,maintMod:1.8,repGain:5,color:"#ca5",desc:"Flagship prestige. Maximum reputation."}};let Xn=!1,L={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0,nationId:null,nationName:null},on=!1,En=[];function sa(){const e=1+(Number(M?.inflation??50)-50)/100*.3,o=ht[L.style]?.costMod||1,n=L.type==="Warehouse"?.75:1,i=Math.round(L.size*1e5*e*o*n),a=Math.round(i*(1+L.budgetMod/100)),r=Math.round(a*.007*(ht[L.style]?.maintMod||1));return{baseBudget:i,adjusted:a,maint:r,inflMod:e,styleMod:o}}async function qs(){Xn=!0,L={name:"",type:"Office Building",size:2e3,style:"Modern",timeline:36,budgetMod:0,nationId:null,nationName:null};try{const{data:t}=await g.from("nations").select("id, name").order("name");En=(t||[]).filter(e=>e.id!==c?.nation_id)}catch{En=[]}la()}function Zn(){Xn=!1,document.getElementById("cp-modal-overlay")?.remove()}function Os(t,e){L[t]=e,la()}async function Bs(){if(!(on||!L.name.trim())){if(L.type==="Regional HQ"&&!L.nationId){alert("Select a target nation for the Regional HQ.");return}on=!0;try{const t=sa(),e=L.type==="Regional HQ"?L.nationId:c.nation_id,o=L.type==="Regional HQ"?L.nationName||"Unknown":M?.name||c?.nation||"Unknown",n=ht[L.style]?.repGain||1,i=await g.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single(),a=i.data?.current_tick||0,r=(i.data?.current_date||"").match(/\d{4}/)?.[0]||"2015",{count:s}=await g.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",e).eq("issuer_type","PRIVATE"),d=`PVT-C${(s||0)+1}-${r}`,{error:f}=await g.from("construction_contracts").insert({nation_id:e,template_key:"custom_building",sector:"civil_engineering",name:L.name.trim(),project_type:L.type,project_subtype:L.style,description:`${L.type} (${L.style}) — ${L.size.toLocaleString()} employees, commissioned by ${c.faction_name}`,project_code:d,budget_ceiling:t.adjusted,timeline_ticks:L.timeline,required_materials:(()=>{const p=L.size/1e3,u=L.style,m={Basic:{concrete:1,steel:1,glass:.5,em:1,lumber:1.5,heavy:1,agg:1},Modern:{concrete:1.1,steel:1.1,glass:1.4,em:1.4,lumber:.5,heavy:1.1,agg:1.1},Sustainable:{concrete:.9,steel:.9,glass:.9,em:.9,lumber:1.5,heavy:.9,agg:.9},Innovative:{concrete:1.2,steel:1.2,glass:2,em:2,lumber:.5,heavy:2,agg:1.2},Heritage:{concrete:1.3,steel:1.3,glass:1.3,em:1.3,lumber:2,heavy:1.3,agg:1.3},Premium:{concrete:1.5,steel:1.5,glass:2.5,em:1.5,lumber:1,heavy:1.5,agg:1.5}}[u]||{concrete:1,steel:1,glass:1,em:1,lumber:1,heavy:1,agg:1},v=(b,y)=>Math.max(1,Math.ceil(p*b*y));return{concrete:v(8,m.concrete),steel:v(6,m.steel),glass_facades:v(3,m.glass),em_systems:v(4,m.em),lumber:v(1,m.lumber),heavy_parts:v(2,m.heavy),aggregate:v(3,m.agg)}})(),required_equipment:(()=>{const p=L.size,u={trucks:Math.ceil(p/2e3)+1,mixers:Math.ceil(p/3e3)+1};return p>1e3&&(u.excavators=Math.ceil(p/3e3)+1,u.cranes=Math.ceil(p/4e3)+1),p>3e3&&(u.bulldozers=Math.ceil(p/4e3)+1,u.haulers=Math.ceil(p/5e3)+1),p>8e3&&(u.piledrivers=Math.ceil(p/6e3)+1),u})(),required_workforce:{general:Math.ceil(L.size*.08),skilled:Math.ceil(L.size*.03)},status:"open",generated_at_tick:a,bidding_ends_tick:a+3,issuer_type:"PRIVATE",issuer_name:c.faction_name,issuer_faction_id:c.id});if(f)throw f;Zn(),alert(`Construction project submitted!

Project: `+L.name.trim()+`
Code: `+d+`
Budget: `+_(t.adjusted)+`
Expected Reputation: +`+Math.ceil(t.adjusted/1e8*3)+` (+3 per $100M)

All construction corporations in `+o+" can now bid on this project.")}catch(t){alert("Failed to submit project: "+t.message)}finally{on=!1}}}function la(){if(document.getElementById("cp-modal-overlay")?.remove(),!Xn)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},o=sa(),n=M?.name||c?.nation||"Nation",i=Math.ceil(o.adjusted/1e8*3),a=i>=4?e.gold:i>=3?e.greenBright:i>=2?e.accent:e.dim,r=Object.entries(ht).map(([d,f])=>{const p=L.style===d;return`<div onclick="cpSetField('style','${d}')" style="padding:5px 6px;cursor:pointer;text-align:center;background:${p?f.color+"18":"transparent"};border:1px solid ${p?f.color+"44":e.border};">
            <div style="font-family:${t};font-size:9px;font-weight:700;color:${p?f.color:e.dim}">${d}</div>
            <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:1px">×${f.costMod.toFixed(1)} cost</div>
        </div>`}).join(""),s=document.createElement("div");s.id="cp-modal-overlay",s.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",s.innerHTML=`
    <div style="width:570px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;max-height:90vh;">
        <div style="padding:12px 20px;border-bottom:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:10px;color:${e.gold}">●</span>
                <span style="font-family:${t};font-size:14px;font-weight:700;letter-spacing:2px;color:${e.muted};text-transform:uppercase">Construction Project</span>
            </div>
            <span onclick="cpClose()" style="font-family:${t};font-size:18px;color:${e.dim};cursor:pointer">×</span>
        </div>
        <div style="padding:14px 20px;overflow:auto;flex:1;">

            <div style="margin-bottom:14px;">
                <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Building Name</div>
                <input id="cp-name-input" value="${L.name.replace(/"/g,"&quot;")}" placeholder="e.g., McKenna Tower"
                    style="width:100%;padding:8px 12px;font-family:${t};font-size:14px;color:${e.text};background:${e.card};border:1px solid ${e.border};outline:none;box-sizing:border-box;" />
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Type</div>
                <div style="display:flex;gap:4px;flex-wrap:wrap;">
                    ${["Regional HQ","Office Building",...c?.corp_sector==="Construction"?["Warehouse"]:[],...c?.corp_subsector?.toLowerCase()==="banking"?["Branch Office"]:[],...c?.corp_subsector?.toLowerCase()==="investment"?["Trading Floor"]:[],...c?.corp_subsector?.toLowerCase()==="insurance"?["Claims Office"]:[]].map(d=>{const f=["Branch Office","Trading Floor","Claims Office"].includes(d),u=d==="Warehouse"?e.orange:f?"#8a6aaa":e.accent;return`<span onclick="cpSetField('type','${d}')" style="flex:1;min-width:100px;text-align:center;padding:6px 0;font-family:${t};font-size:12px;font-weight:700;cursor:pointer;color:${L.type===d?"#000":e.dim};background:${L.type===d?u:"transparent"};border:1px solid ${L.type===d?u:e.border}">${d}</span>`}).join("")}
                </div>
                ${L.type==="Regional HQ"?`<div style="margin-top:8px;">
                    <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Target Nation</div>
                    <select id="cp-nation-select" onchange="cpSetField('nationId', this.value); cpSetField('nationName', this.options[this.selectedIndex].text)"
                        style="width:100%;padding:8px 12px;font-family:${t};font-size:12px;color:${e.text};background:${e.card};border:1px solid ${e.border};outline:none;">
                        <option value="">-- Select a nation --</option>
                        ${En.map(d=>`<option value="${d.id}" ${L.nationId===d.id?"selected":""}>${d.name}</option>`).join("")}
                    </select>
                    <div style="font-family:${t};font-size:9px;color:${e.accent};margin-top:5px;">Regional HQ: Establishes corporate presence in another nation. Construction corps in that nation will bid on building it.</div>
                </div>`:""}
                ${L.type==="Warehouse"?`<div style="font-family:${t};font-size:9px;color:${e.orange};margin-top:5px;">Warehouse: 75% construction cost, stores up to $20M in materials</div>`:""}
                ${L.type==="Branch Office"?`<div style="font-family:${t};font-size:9px;color:#8a6aaa;margin-top:5px;">Branch Office: Increases lending capacity. +1 reputation per 200 employees. Enables cross-nation lending.</div>`:""}
                ${L.type==="Trading Floor"?`<div style="font-family:${t};font-size:9px;color:#8a6aaa;margin-top:5px;">Trading Floor: Enables secondary bond market. +1 reputation per 200 employees. Portfolio management bonuses.</div>`:""}
                ${L.type==="Claims Office"?`<div style="font-family:${t};font-size:9px;color:#8a6aaa;margin-top:5px;">Claims Office: Faster claim processing. +1 reputation per 200 employees. Local presence reduces premiums.</div>`:""}
            </div>

            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <span style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase">Size (Employees)</span>
                    <span style="font-family:${t};font-size:18px;font-weight:700;color:${e.text}">${L.size.toLocaleString()}</span>
                </div>
                <input type="range" min="500" max="18000" step="500" value="${L.size}" oninput="cpSetField('size',+this.value)"
                    style="width:100%;accent-color:${e.accent};height:5px;" />
                <div style="display:flex;justify-content:space-between;font-family:${t};font-size:9px;color:${e.dim};margin-top:3px">
                    <span>500 min</span><span>18,000 max</span>
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:5px">Style</div>
                <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:4px;">${r}</div>
                <div style="margin-top:5px;font-family:${t};font-size:10px;color:${ht[L.style].color}">${ht[L.style].desc}</div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <span style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase">Timeline</span>
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${e.text}">${L.timeline} months</span>
                </div>
                <input type="range" min="24" max="60" step="6" value="${L.timeline}" oninput="cpSetField('timeline',+this.value)"
                    style="width:100%;accent-color:${e.gold};height:5px;" />
                <div style="display:flex;justify-content:space-between;font-family:${t};font-size:9px;color:${e.dim};margin-top:3px">
                    <span>24 months</span><span>60 months</span>
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:8px">Budget</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:10px 12px;">
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border}">
                        <span style="font-family:${t};font-size:10px;color:${e.dim}">BASE (${L.size.toLocaleString()} × $100k × ${o.inflMod.toFixed(2)} × ${o.styleMod.toFixed(1)})</span>
                        <span style="font-family:${t};font-size:12px;color:${e.muted}">${_(o.baseBudget)}</span>
                    </div>
                    <div style="padding:8px 0">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
                            <span style="font-family:${t};font-size:10px;color:${e.dim}">ADJUSTMENT</span>
                            <span style="font-family:${t};font-size:13px;font-weight:700;color:${L.budgetMod>0?e.greenBright:L.budgetMod<0?e.red:e.dim}">${L.budgetMod>0?"+":""}${L.budgetMod}%</span>
                        </div>
                        <input type="range" min="-15" max="15" step="1" value="${L.budgetMod}" oninput="cpSetField('budgetMod',+this.value)"
                            style="width:100%;accent-color:${e.accent};height:5px;" />
                        <div style="display:flex;justify-content:space-between;font-family:${t};font-size:9px;color:${e.dim};margin-top:3px">
                            <span>-15% (budget cut)</span><span>+15% (quality invest)</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:5px 0;border-top:1px solid ${e.border}">
                        <span style="font-family:${t};font-size:12px;font-weight:700;color:${e.text}">TOTAL BUDGET</span>
                        <span style="font-family:${t};font-size:18px;font-weight:700;color:${e.gold}">${_(o.adjusted)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0">
                        <span style="font-family:${t};font-size:10px;color:${e.dim}">EST. MONTHLY MAINTENANCE</span>
                        <span style="font-family:${t};font-size:12px;color:${e.redDim}">${_(o.maint)}/mo</span>
                    </div>
                </div>
            </div>

            <div style="padding:8px 10px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);margin-bottom:10px;">
                <div style="font-family:${t};font-size:10px;color:${e.gold};margin-bottom:3px">WHAT HAPPENS NEXT</div>
                <div style="font-size:12px;color:${e.dim};line-height:1.5">
                    This project will appear as a Civil Engineering bid in the Open Contracts pool for all construction corporations with an HQ or Regional HQ in ${n}. The lowest qualified bidder wins the contract and begins construction.
                </div>
            </div>

            <div style="padding:8px 10px;background:rgba(139,154,107,0.04);border:1px solid rgba(139,154,107,0.12);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:${t};font-size:12px;color:${e.accent}">EXPECTED REPUTATION GAIN</span>
                    <span style="font-family:${t};font-size:20px;font-weight:700;color:${a}">+${i}</span>
                </div>
                <div style="font-family:${t};font-size:9px;color:${e.dim};margin-top:3px">${L.style} style · ${i===5?"Maximum prestige":i>=4?"Impressive presence":i>=3?"Strong statement":i>=2?"Solid investment":"Functional addition"}</div>
            </div>

        </div>
        <div style="padding:12px 20px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div>
                <div style="font-family:${t};font-size:9px;color:${e.dim}">TOTAL PROJECT</div>
                <div style="font-family:${t};font-size:18px;font-weight:700;color:${e.gold}">${_(o.adjusted)}</div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="cpClose()" style="padding:7px 20px;font-family:${t};font-size:12px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="cpSubmitFromModal()" style="padding:7px 20px;font-family:${t};font-size:12px;font-weight:700;letter-spacing:1px;color:#000;background:${e.gold};cursor:pointer;opacity:${L.name.trim().length>0?1:.4}">SUBMIT PROJECT</div>
            </div>
        </div>
    </div>`,document.body.appendChild(s);const l=document.getElementById("cp-name-input");l&&l.addEventListener("input",d=>{L.name=d.target.value}),s.addEventListener("click",d=>{d.target===s&&Zn()})}function Ps(){const t=document.getElementById("cp-name-input");if(t&&(L.name=t.value),!L.name.trim()){alert("Please enter a building name.");return}Bs()}window.cpClose=Zn;window.cpSetField=Os;window.cpSubmitFromModal=Ps;window.npSelect=Rs;window.npBuyProperty=Ls;window.npOpenConstructionModal=qs;let $t=!1;async function Ds(t){if($t)return;const e=Q.find(s=>s.id===t);if(!e)return;const o=1+(Number(M?.inflation??50)-50)/100*.3,n=Math.round((e.purchase_price||0)*.1*o),i=Number(c?.corp_cash_reserves??0);if(n>i){alert("Insufficient cash. Refurbishment costs "+_(n)+" (inflation-adjusted), you have "+_(i));return}if(e.condition>=95){alert("Property is already in excellent condition ("+e.condition+"%).");return}const a=5+Math.floor(Math.random()*21),r=Math.min(100,e.condition+a);if(confirm('Refurbish "'+e.name+`"?

Cost: `+_(n)+`
Expected improvement: +`+a+"% condition ("+e.condition+"% → "+r+"%)")){$t=!0;try{await g.from("corp_properties").update({condition:r}).eq("id",t);const s=Math.max(0,i-n);await g.from("factions").update({corp_cash_reserves:s}).eq("id",c.id),c.corp_cash_reserves=s;const l=document.getElementById("topbar-cash");l&&(l.textContent="CASH: "+(s>=1e6?"$"+(s/1e6).toFixed(1)+"M":"$"+Math.round(s/1e3)+"k")),await Ao(),Ro(),alert("Refurbished! Condition: "+e.condition+"% → "+r+"%")}catch(s){alert("Refurbishment failed: "+s.message)}finally{$t=!1}}}async function js(t){if($t)return;const e=Q.find(a=>a.id===t);if(!e)return;const o=1+(Number(M?.inflation??50)-50)/100*.3,n=(e.condition||50)/100,i=Math.round((e.purchase_price||0)*.6*n*o);if(confirm('Sell "'+e.name+`"?

Sale value: `+_(i)+" (60% × "+e.condition+`% condition × inflation)

The property will go back on the market for 6 ticks.
This cannot be undone.`)){$t=!0;try{await g.from("corp_properties").update({is_active:!1}).eq("id",t);const r=Number(c?.corp_cash_reserves??0)+i;await g.from("factions").update({corp_cash_reserves:r}).eq("id",c.id),c.corp_cash_reserves=r;const l=(await g.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0;await g.from("available_properties").insert({nation_id:c.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,price:Math.round(i*1.1),monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,generated_at_tick:l,expires_at_tick:l+6,status:"available"});const d=document.getElementById("topbar-cash");d&&(d.textContent="CASH: "+(r>=1e6?"$"+(r/1e6).toFixed(1)+"M":"$"+Math.round(r/1e3)+"k")),await Ao(),Ro(),await Jn(),Lo(),alert('Sold "'+e.name+'" for '+_(i))}catch(a){alert("Sale failed: "+a.message)}finally{$t=!1}}}window.propRefurbish=Ds;window.propSell=js;const Pe={SALE:.8,DISSOLVE:.6,REVENUE_BASE:.02,GDP_NEUTRAL:30,DEFAULT_REPUTATION:25};function Fs(t){if(!t)return 0;const e=t.trim().replace(/[$,]/g,""),o=e.match(/^([\d.]+)\s*[Mm]$/),n=e.match(/^([\d.]+)\s*[Kk]$/);return Math.round(o?parseFloat(o[1])*1e6:n?parseFloat(n[1])*1e3:parseFloat(e))}function tt(t){const e=document.getElementById("topbar-cash");e&&(e.textContent="CASH: "+(t>=1e6?"$"+(t/1e6).toFixed(1)+"M":"$"+Math.round(t/1e3)+"k"))}function da(t){return Ct.find(e=>e.id===t)?.name||"—"}function qo(t){return Q.filter(e=>e.nation_id===t)}async function Kt(){mt=0,await Ao(),Ro(),Jt(),Xt()}let le=!1,mt=0,so={};async function Us(){if(c?.id)try{const{data:t}=await g.from("construction_contracts").select("nation_id").eq("awarded_to_faction",c.id).in("status",["in_progress","awarded"]);so={};for(const e of t||[])e.nation_id&&(so[e.nation_id]=(so[e.nation_id]||0)+1)}catch{}}function ca(t){const e=qo(t.nation_id),o=e.reduce((v,b)=>v+Number(b.purchase_price||0),0),n=e.reduce((v,b)=>v+Number(b.capacity||0),0),i=so[t.nation_id]||0,a=Ct.find(v=>v.id===t.nation_id),r=(t.name||"").trim().split(/\s+/),s=r.length>=2?r.map(v=>v[0]).join("").toUpperCase().slice(0,4):(t.name||"SUB").slice(0,4).toUpperCase(),l=Number(t.sub_cash||0),d=Number(a?.gdp_growth??50),f=l*Pe.REVENUE_BASE,p=(d-Pe.GDP_NEUTRAL)/100,u=Pe.DEFAULT_REPUTATION/100,m=l>0?Math.round(f*(1+p)*u):0;return{id:t.id,name:t.name,abbr:s,nation:a?.name||t.city||"—",nationId:t.nation_id,sector:c?.corp_sector||"General",subsector:t.subsector||c?.corp_subsector||"—",revenue:m,debt:0,cash:l,reputation:Pe.DEFAULT_REPUTATION,valuation:o,workforce:n,projects:i,established:t.created_at?new Date(t.created_at).getFullYear().toString():"—",trend:d>=40&&l>0?"up":d>=Pe.GDP_NEUTRAL&&l>0?"flat":"down",profitable:m>0,hqProp:t}}function Jt(){const t=document.getElementById("manage-subsidiaries-container");if(!t)return;const e="'JetBrains Mono', monospace",o={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",greenDark:"#2a5a3a",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},i=Q.filter(f=>f.type==="regional_hq").map(ca);mt>=i.length&&(mt=0);const a=i[mt]||null;let r="";i.length===0&&(r=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${o.dim}">No subsidiaries established.<br>Use Create Subsidiary to expand.</div>`);let s=0,l=0;for(let f=0;f<i.length;f++){const p=i[f],u=f===mt;s+=p.revenue,l+=p.valuation;const m=p.trend==="up"?o.greenBright:p.trend==="down"?o.red:o.dim,v=p.trend==="up"?"▲":p.trend==="down"?"▼":"–";r+=`
        <div onclick="selectSubsidiary(${f})" style="display:flex;align-items:center;padding:7px 14px;border-bottom:1px solid ${o.border};cursor:pointer;border-left:2px solid ${u?o.accent:"transparent"};background:${u?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:40px;font-family:${e};font-size:10px;font-weight:700;color:${o.gold}">${p.abbr}</span>
            <div style="flex:1.5;">
                <div style="font-size:11px;font-weight:600;color:${o.text};line-height:1.2">${p.name}</div>
                <div style="font-family:${e};font-size:7px;color:${o.dim};margin-top:1px">${p.subsector}</div>
            </div>
            <span style="width:65px"><span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${o.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${p.nation.toUpperCase().slice(0,8)}</span></span>
            <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${p.profitable?o.greenBright:o.redDim};text-align:right">${_(p.revenue)}</span>
            <span style="width:40px;font-family:${e};font-size:9px;font-weight:700;color:${p.reputation>=40?o.accent:p.reputation>=25?o.yellow:o.orange};text-align:right">${p.reputation}</span>
            <span style="width:55px;font-family:${e};font-size:9px;color:${o.muted};text-align:right">${_(p.valuation)}</span>
            <span style="width:12px;font-family:${e};font-size:8px;color:${m};text-align:right">${v}</span>
        </div>`}let d="";if(a){const f=a.trend==="up"?o.greenBright:a.trend==="down"?o.red:o.dim,p=a.trend==="up"?"▲":a.trend==="down"?"▼":"–",u=a.trend==="up"?"Growing":a.trend==="down"?"Declining":"Stable",m=a.reputation>=40?o.accent:a.reputation>=25?o.yellow:o.orange,v=[{label:"Revenue",value:_(a.revenue),color:a.profitable?o.greenBright:o.redDim},{label:"Cash",value:_(a.cash),color:o.text},{label:"Debt",value:a.debt>0?_(a.debt):"$0",color:a.debt>0?o.orange:o.dim},{label:"Reputation",value:a.reputation+"/100",color:m},{label:"Market Valuation",value:_(a.valuation),color:o.gold},{label:"Workforce",value:a.workforce.toLocaleString(),color:o.text},{label:"Active Projects",value:a.projects.toString(),color:a.projects>0?o.text:o.dim}],b=a.projects===0,y=a.hqProp?.logo_url?`<img src="${x(a.hqProp.logo_url)}" alt="" style="width:32px;height:32px;object-fit:cover;border-radius:4px;">`:`<label style="width:32px;height:32px;display:flex;align-items:center;justify-content:center;background:${o.card};border:1px dashed ${o.border};border-radius:4px;cursor:pointer;font-size:14px;color:${o.dim};" title="Upload subsidiary logo">+<input type="file" accept="image/*" id="sub-logo-upload" data-prop-id="${a.hqProp?.id||""}" style="display:none;"></label>`;d=`
            <div style="padding:8px 14px;border-bottom:1px solid ${o.border};background:${o.card};flex-shrink:0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
                    ${y}
                    <div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${e};font-size:12px;font-weight:700;color:${o.gold}">${a.abbr}</span>
                            <span style="font-size:12px;font-weight:700;color:${o.text}">${a.name}</span>
                        </div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <span style="font-family:${e};font-size:7px;letter-spacing:0.5px;padding:1px 5px;color:${o.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${a.nation.toUpperCase()}</span>
                    <span style="font-family:${e};font-size:8px;color:${o.dim}">Est. ${a.established}</span>
                    <span style="font-family:${e};font-size:8px;color:${f}">${p} ${u}</span>
                </div>
                    </div>
                </div>
            </div>
            ${v.map($=>`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 14px;border-bottom:1px solid ${o.border};">
                <span style="font-family:${e};font-size:9px;color:${o.dim};letter-spacing:0.5px;text-transform:uppercase">${$.label}</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;color:${$.color}">${$.value}</span>
            </div>`).join("")}
            <div style="padding:6px 14px;border-bottom:1px solid ${o.border};flex-shrink:0;">
                <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                    <span style="font-family:${e};font-size:7px;color:${o.dim};letter-spacing:0.8px">REPUTATION</span>
                    <span style="font-family:${e};font-size:8px;color:${o.muted}">75% sub / 25% parent</span>
                </div>
                <div style="width:100%;height:4px;background:${o.border}"><div style="width:${a.reputation}%;height:100%;background:${m}"></div></div>
            </div>
            ${a.subsector==="Insurance"||a.subsector==="Banking"?`<div id="sub-dashboard-${a.id}" style="flex:1;overflow-y:auto;"></div>`:'<div style="flex:1"></div>'}
            <div style="padding:6px 14px;border-top:1px solid ${o.border};background:${o.card};flex-shrink:0;">
                <div style="font-family:${e};font-size:8px;letter-spacing:1.5px;color:${o.dim};text-transform:uppercase;margin-bottom:6px">Actions</div>
                <div style="display:flex;gap:4px;margin-bottom:4px;">
                    <div onclick="subInjectCapital('${a.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${o.greenBright};border:1px solid ${o.greenDark};background:rgba(74,170,136,0.06)">INJECT CAPITAL</div>
                    <div onclick="subWithdraw('${a.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${a.cash>0?o.gold:o.dim};border:1px solid ${a.cash>0?o.gold+"44":o.border};opacity:${a.cash>0?1:.4}">WITHDRAW</div>
                </div>
                <div style="display:flex;gap:4px;">
                    <div onclick="subMerge('${a.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${o.accent};border:1px solid ${o.accent}">MERGE</div>
                    <div onclick="subPutForSale('${a.id}')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${o.orange};border:1px solid ${o.orange}">PUT UP FOR SALE</div>
                    <div onclick="${b?"subDissolve('"+a.id+"')":""}" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;letter-spacing:0.5px;color:${b?o.red:o.dim};border:1px solid ${b?o.red:o.border};opacity:${b?1:.3}">DISSOLVE</div>
                </div>
                ${a.projects>0?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${o.dim}">Cannot dissolve with active projects.</div>`:""}
            </div>`}else d=`<div style="padding:30px 14px;text-align:center;font-family:${e};font-size:10px;color:${o.dim}">Select a subsidiary to manage.</div>`;if(t.innerHTML=`
    <div style="width:760px;height:450px;background:${o.surface};border:1px solid ${o.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${o.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${o.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${o.muted};text-transform:uppercase">Manage Subsidiaries</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${o.dim}">${i.length} ACTIVE</span>
        </div>
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${o.border};display:flex;flex-direction:column;">
                <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${o.border};background:${o.card};flex-shrink:0;">
                    <span style="width:40px;font-family:${e};font-size:7px;color:${o.dim};letter-spacing:0.5px">ABBR</span>
                    <span style="flex:1.5;font-family:${e};font-size:7px;color:${o.dim};letter-spacing:0.5px">NAME</span>
                    <span style="width:65px;font-family:${e};font-size:7px;color:${o.dim};letter-spacing:0.5px">NATION</span>
                    <span style="width:55px;font-family:${e};font-size:7px;color:${o.dim};letter-spacing:0.5px;text-align:right">REVENUE</span>
                    <span style="width:40px;font-family:${e};font-size:7px;color:${o.dim};letter-spacing:0.5px;text-align:right">REP</span>
                    <span style="width:55px;font-family:${e};font-size:7px;color:${o.dim};letter-spacing:0.5px;text-align:right">VALUE</span>
                    <span style="width:12px"></span>
                </div>
                <div style="flex:1;overflow:auto;">${r}</div>
                <div style="padding:6px 14px;border-top:1px solid ${o.border};background:${o.card};flex-shrink:0;display:flex;align-items:center;">
                    <span style="width:40px"></span>
                    <span style="flex:1.5;font-family:${e};font-size:8px;color:${o.dim}">COMBINED</span>
                    <span style="width:65px"></span>
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${o.text};text-align:right">${_(s)}</span>
                    <span style="width:40px"></span>
                    <span style="width:55px;font-family:${e};font-size:9px;font-weight:700;color:${o.text};text-align:right">${_(l)}</span>
                    <span style="width:12px"></span>
                </div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${d}
            </div>
        </div>
    </div>`,document.getElementById("sub-logo-upload")?.addEventListener("change",async f=>{const p=f.target.files?.[0],u=f.target.dataset.propId;if(!(!p||!u)){if(p.size>2*1024*1024){alert("Logo must be under 2MB.");return}try{const m=p.name.split(".").pop()?.toLowerCase()||"png",v=`party-logos/${c.id}/sub_${u}_${Date.now()}.${m}`,{error:b}=await g.storage.from("public-assets").upload(v,p,{contentType:p.type,upsert:!0});if(b)throw b;const{data:y}=g.storage.from("public-assets").getPublicUrl(v),$=y?.publicUrl;if($){await g.from("corp_properties").update({logo_url:$}).eq("id",u);const h=Q.find(E=>E.id===u);h&&(h.logo_url=$),Jt()}}catch(m){alert("Upload failed: "+(m.message||"Error"))}}}),a&&(a.subsector==="Insurance"||a.subsector==="Banking")){const f="sub-dashboard-"+a.id;setTimeout(()=>{document.getElementById(f)&&Aa(g,{faction:c,nation:M,shard:N},f,a.id).catch(p=>console.error("[SubDash] Init failed:",p))},50)}}async function pa(t,e){if(le)return;const o=Q.find(m=>m.id===t);if(!o)return;const n=e==="sell",i=n?Pe.SALE:Pe.DISSOLVE,a=n?"SELL":"DISSOLVE",r=n?"sold":"dissolved",s=n?"80%":"60%",l=da(o.nation_id),d=qo(o.nation_id),f=d.reduce((m,v)=>m+Math.round((v.purchase_price||0)*i*(v.condition||50)/100),0),p=Number(o.sub_cash||0),u=f+p;if(confirm(a+' subsidiary "'+o.name+`"?

`+d.length+" properties at "+s+` × condition:
  Property value: `+_(f)+`
  Subsidiary cash: `+_(p)+`
  ─────────────────
  Total return: `+_(u)+`

All operations in `+l+` cease.
This cannot be undone.`)){le=!0;try{const m=d.map(b=>b.id);if(m.length===1){const{error:b}=await g.from("corp_properties").update({is_active:!1}).eq("id",m[0]);if(b)throw b}else if(m.length>1){const{error:b}=await g.from("corp_properties").update({is_active:!1}).in("id",m);if(b)throw b}await g.from("corp_properties").update({sub_cash:0}).eq("id",t).then(()=>{}).catch(()=>{});const v=Number(c?.corp_cash_reserves??0)+u;await g.from("factions").update({corp_cash_reserves:v}).eq("id",c.id),c.corp_cash_reserves=v,tt(v),await Kt(),alert("Subsidiary "+r+". "+d.length+` properties liquidated.
Total received: `+_(u))}catch(m){alert("Failed: "+m.message)}finally{le=!1}}}function Hs(t){pa(t,"sell")}async function Vs(t){if(le)return;const e=Q.find(s=>s.id===t);if(!e)return;const o=da(e.nation_id),i=qo(e.nation_id).reduce((s,l)=>s+Math.round((l.purchase_price||0)*.8*(l.condition||50)/100),0),a=Number(e.sub_cash||0),r=Math.round(a*.05);if(confirm('PUT UP FOR SALE: "'+e.name+`"

Nation: `+o+`
Estimated Valuation: `+_(i)+`
Subsidiary Cash: `+_(a)+`
Subsector: `+(e.subsector||"General")+`

This will list your subsidiary on the marketplace.
Other corporations can place bids (minimum $1M).
You review and accept bids.

Continue?`)){le=!0;try{const s=N?.current_tick||0,{data:l,error:d}=await g.from("subsidiary_sales").insert({subsidiary_id:t,seller_faction_id:c.id,nation_id:e.nation_id,subsidiary_name:e.name,subsector:e.subsector||null,valuation:i,monthly_revenue:r,sub_cash_at_listing:a,employee_count:e.capacity||0,status:"listed",listed_at_tick:s}).select("*").single();if(d){alert("Failed to list: "+d.message);return}alert('"'+e.name+`" is now listed for sale.

Other corporations will see it on the Expansion tab and can place bids.`),await Kt()}catch(s){alert("Failed: "+s.message)}finally{le=!1}}}let $o=[],fa="ready",Rt=null;async function Oo(){const t=await qa(g);$o=t.listings,fa=t.state,Rt=t.error,Rt&&console.error("[SubMarket] Load failed:",Rt.message)}function Bo(){let t=document.getElementById("sub-marketplace-card");t||(t=document.createElement("div"),t.id="sub-marketplace-card",document.getElementById("expansion-content")?.appendChild(t));const e=$o.filter(l=>l.seller_faction_id!==c?.id),o=$o.filter(l=>l.seller_faction_id===c?.id),n="'JetBrains Mono',monospace",i=getComputedStyle(document.body),a=(l,d)=>i.getPropertyValue(l).trim()||d,r={surface:a("--bg-2","var(--bg-card)"),card:a("--bg-3","#f0efeb"),border:a("--border-0","rgba(0,0,0,0.08)"),dim:a("--text-dim","#aaa"),muted:a("--text-muted","#888"),text:a("--text-primary","#333"),bright:a("--text-bright","#1a1a17"),orange:a("--orange","#d35400"),green:a("--green","#2d8a2d"),blue:a("--blue","#2874a6"),red:a("--red","#c0392b"),gold:a("--gold","#a88520")};let s=`<div style="width:760px;background:${r.surface};border:1px solid ${r.border};font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:10px 14px;border-bottom:1px solid ${r.border};display:flex;align-items:center;gap:8px;">
            <span style="width:6px;height:6px;border-radius:50%;background:${r.orange};display:inline-block;"></span>
            <span style="font-family:${n};font-size:11px;font-weight:700;letter-spacing:1.5px;color:${r.orange};text-transform:uppercase;">Subsidiary Marketplace</span>
            <span style="font-family:${n};font-size:9px;color:${r.dim};">${e.length} available</span>
        </div>`;if(o.length>0){s+=`<div style="padding:8px 14px;border-bottom:1px solid ${r.border};background:${r.card};">
            <div style="font-family:${n};font-size:8px;letter-spacing:1px;color:${r.gold};text-transform:uppercase;margin-bottom:6px;">YOUR LISTINGS</div>`;for(const l of o){const f=(l.subsidiary_bids||[]).filter(p=>p.status==="pending");s+=`<div style="padding:6px 0;border-bottom:1px solid var(--border-hair);display:flex;justify-content:space-between;align-items:center;">
                <div>
                    <span style="font-size:11px;font-weight:700;color:${r.bright};">${x(l.subsidiary_name)}</span>
                    <span style="font-family:${n};font-size:8px;color:${r.dim};margin-left:6px;">${x(l.subsector||"")}</span>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${n};font-size:9px;color:${f.length>0?r.green:r.dim};">${f.length} bid${f.length!==1?"s":""}</span>
                    ${f.length>0?`<span onclick="subViewBids('${l.id}')" style="font-family:${n};font-size:8px;font-weight:700;padding:3px 8px;color:${r.green};border:1px solid ${r.green}44;cursor:pointer;">VIEW BIDS</span>`:""}
                    <span onclick="subCancelSale('${l.id}')" style="font-family:${n};font-size:8px;font-weight:700;padding:3px 8px;color:${r.red};border:1px solid ${r.red}44;cursor:pointer;">CANCEL</span>
                </div>
            </div>`}s+="</div>"}if(fa==="error")s+=`<div style="padding:24px 14px;text-align:center;font-family:${n};font-size:10px;color:${r.red};font-style:italic;">${x(Rt&&Rt.message||"Subsidiary marketplace is temporarily unavailable.")}</div>`;else if(e.length===0)s+=`<div style="padding:24px 14px;text-align:center;font-family:${n};font-size:10px;color:${r.dim};font-style:italic;">No subsidiaries for sale right now.</div>`;else for(const l of e){const d=(l.subsidiary_bids||[]).find(u=>u.bidder_faction_id===c?.id&&u.status==="pending"),p=(_allNations||[]).find(u=>u.id===l.nation_id)?.name||"Unknown";s+=`<div style="padding:10px 14px;border-bottom:1px solid ${r.border};">
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
                    ${d?`<span style="font-family:${n};font-size:8px;font-weight:700;color:${r.green};">✓ BID PLACED: ${_(d.bid_amount)}</span>`:`<span onclick="subPlaceBid('${l.id}','${x(l.subsidiary_name)}',${l.valuation})" style="font-family:${n};font-size:8px;font-weight:700;padding:4px 14px;color:#000;background:${r.orange};cursor:pointer;">PLACE BID</span>`}
                </div>
            </div>`}s+="</div>",t.innerHTML=s}async function Gs(t,e,o){const n=prompt('Place bid for "'+e+`"

Valuation: `+_(o)+`
Minimum bid: $1M

Enter bid amount ($):`);if(!n)return;const i=Math.round(Number(n));if(isNaN(i)||i<1e6){alert("Minimum bid is $1,000,000.");return}const a=Number(c?.corp_cash_reserves??0);if(i>a){alert("Insufficient funds. You have "+_(a)+".");return}const{error:r}=await g.from("subsidiary_bids").insert({sale_id:t,bidder_faction_id:c.id,bid_amount:i,status:"pending",placed_at_tick:N?.current_tick||0});if(r){r.message.includes("duplicate")||r.message.includes("unique")?alert("You already have a bid on this subsidiary."):alert("Failed to place bid: "+r.message);return}alert("Bid of "+_(i)+' placed on "'+e+`".
The seller will review your bid.`),await Oo(),Bo()}async function Ws(t){const e=$o.find(u=>u.id===t);if(!e)return;const o=(e.subsidiary_bids||[]).filter(u=>u.status==="pending");if(o.length===0){alert("No pending bids.");return}const n=o.map(u=>u.bidder_faction_id),{data:i}=await g.from("factions").select("id, faction_name").in("id",n),a={};(i||[]).forEach(u=>{a[u.id]=u.faction_name});let r='Bids for "'+e.subsidiary_name+`":

`;const s=o.sort((u,m)=>m.bid_amount-u.bid_amount);for(let u=0;u<s.length;u++){const m=s[u];r+=u+1+". "+(a[m.bidder_faction_id]||"Unknown")+": "+_(m.bid_amount)+`
`}r+=`
Enter the number of the bid to accept (or cancel):`;const l=prompt(r);if(!l)return;const d=parseInt(l,10)-1;if(isNaN(d)||d<0||d>=s.length){alert("Invalid selection.");return}const f=s[d],p=a[f.bidder_faction_id]||"Unknown";confirm("Accept bid of "+_(f.bid_amount)+" from "+p+`?

This will transfer ownership of "`+e.subsidiary_name+`" to them.
You will receive `+_(f.bid_amount)+` in cash.

This cannot be undone.`)&&await Ys(e,f)}let nn=!1;async function Ys(t,e){if(!nn){nn=!0;try{const i=N?.current_tick||0,{data:a}=await g.from("factions").select("corp_cash_reserves").eq("id",e.bidder_faction_id).single(),r=Number(a?.corp_cash_reserves??0);if(r<e.bid_amount){alert("Buyer has insufficient funds. Bid cannot be completed."),await g.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:i}).eq("id",e.id);return}var{error:o}=await g.from("factions").update({corp_cash_reserves:r-e.bid_amount}).eq("id",e.bidder_faction_id);if(o){alert("Failed to deduct from buyer: "+o.message);return}const s=Number(c?.corp_cash_reserves??0);var{error:n}=await g.from("factions").update({corp_cash_reserves:s+e.bid_amount}).eq("id",c.id);if(n){await g.from("factions").update({corp_cash_reserves:r}).eq("id",e.bidder_faction_id),alert("Failed to credit seller: "+n.message);return}c.corp_cash_reserves=s+e.bid_amount,await g.from("corp_properties").update({faction_id:e.bidder_faction_id}).eq("id",t.subsidiary_id);const l=Q.filter(d=>d.nation_id===t.nation_id&&d.faction_id===c.id);for(const d of l)await g.from("corp_properties").update({faction_id:e.bidder_faction_id}).eq("id",d.id);await g.from("subsidiary_sales").update({status:"completed",completed_at_tick:i,accepted_bid_id:e.id}).eq("id",t.id),await g.from("subsidiary_bids").update({status:"accepted",resolved_at_tick:i}).eq("id",e.id),await g.from("subsidiary_bids").update({status:"rejected",resolved_at_tick:i}).eq("sale_id",t.id).neq("id",e.id),tt(c.corp_cash_reserves),alert("Sale complete! Received "+_(e.bid_amount)+`.

"`+t.subsidiary_name+'" has been transferred to the buyer.'),await Kt(),await Oo(),Bo()}catch(i){console.error("[SubMarket] Accept bid error:",i),alert("Transfer failed: "+i.message)}finally{nn=!1}}}async function Qs(t){if(!confirm("Cancel this listing? The subsidiary will no longer be for sale."))return;const{error:e}=await g.from("subsidiary_sales").update({status:"cancelled"}).eq("id",t);if(e){alert("Failed: "+e.message);return}await Oo(),Bo()}function Ks(t){pa(t,"dissolve")}async function ma(t,e){if(le)return;const o=Q.find(p=>p.id===t);if(!o)return;const n=Number(c?.corp_cash_reserves??0),i=Number(o.sub_cash||0),a=e?"WITHDRAW":"INJECT CAPITAL";if(e&&i<=0){alert("This subsidiary has no cash to withdraw.");return}const r=e?i:n,s=prompt(a+(e?" from ":" into ")+o.name+`

Parent cash: `+_(n)+`
Subsidiary cash: `+_(i)+`

Enter amount (e.g., 5000000 or 5M):`);if(!s)return;const l=Fs(s);if(!l||l<=0||isNaN(l)){alert("Invalid amount.");return}if(l>r){alert("Insufficient "+(e?"subsidiary":"parent")+" cash. Available: "+_(r));return}const d=e?n+l:n-l,f=e?i-l:i+l;if(confirm(a+" "+_(l)+(e?" from ":" into ")+o.name+`?

Parent: `+_(n)+" → "+_(d)+`
Subsidiary: `+_(i)+" → "+_(f))){le=!0;try{await Promise.all([g.from("factions").update({corp_cash_reserves:d}).eq("id",c.id),g.from("corp_properties").update({sub_cash:f}).eq("id",t)]),c.corp_cash_reserves=d,o.sub_cash=f,tt(d),Jt(),alert((e?"Withdrew ":"Injected ")+_(l)+(e?" from ":" into ")+o.name+".")}catch(p){alert("Failed: "+p.message)}finally{le=!1}}}function Js(t){ma(t,!1)}function Xs(t){ma(t,!0)}async function Zs(t){if(le)return;const e=Q.find(b=>b.id===t);if(!e)return;const o=ca(e);o.nation;const n=qo(e.nation_id),i=o.valuation,a=o.cash,r=o.reputation,s=o.subsector,l=Math.round(i*2.25),d=Math.round(r*.1),f=Math.round(r*.2),p=No(),u=Qe.reduce((b,y)=>b+Number(c?.[y.factionKey]??0),0),m=Math.max(0,p-u),v=Number(c?.corp_cash_reserves??0);if(l>v){alert(`Insufficient cash to acquire subsidiary.

Acquisition cost (2.25× valuation): `+_(l)+`
Available cash: `+_(v));return}if(o.projects>0){alert("Cannot merge — subsidiary has "+o.projects+" active project(s). Complete or abandon them first.");return}if(confirm('MERGE "'+e.name+`" INTO YOUR CORPORATION

Acquisition cost (2.25× valuation): `+_(l)+`
Subsidiary cash absorbed: `+_(a)+`
Net cost: `+_(l-a)+`

• `+n.length+` properties transferred to parent
• Subsidiary subsector "`+s+`" added to portfolio
• Workers hired to max capacity (+`+m.toLocaleString()+`)
• Reputation: +`+d+" or -"+f+" (from sub rep "+r+`)

This cannot be undone.`)){le=!0;try{const b=c.nation_id;if(n.length>0){const I=n.filter(k=>k.id!==e.id).map(k=>k.id);if(I.length===1){const{error:k}=await g.from("corp_properties").update({nation_id:b,type:"office"}).eq("id",I[0]);if(k)throw k}else if(I.length>1){const{error:k}=await g.from("corp_properties").update({nation_id:b,type:"office"}).in("id",I);if(k)throw k}const{error:A}=await g.from("corp_properties").update({nation_id:b,type:"office",sub_cash:0,subsector:null}).eq("id",e.id);if(A)throw A}const y=v-l+a,h=Number(c?.corp_general_workforce??0)+m,E=Math.random()>=.5?d:-f,S=Number(c?.standing??50),z=Math.max(0,Math.min(100,S+E)),{error:w}=await g.from("factions").update({corp_cash_reserves:y,corp_general_workforce:h,standing:z}).eq("id",c.id);if(w)throw w;c.corp_cash_reserves=y,c.corp_general_workforce=h,c.standing=z,tt(y),await Kt(),alert(`Merger complete!

"`+e.name+`" absorbed into your corporation.
Cost: `+_(l)+" | Cash absorbed: "+_(a)+`
Reputation `+(E>=0?"+":"")+E+" (now "+z+`)
Workers hired: +`+m.toLocaleString()+` general workforce
Properties: `+n.length+" transferred to parent")}catch(b){alert("Merge failed: "+b.message)}finally{le=!1}}}window.subDissolve=Ks;window.subInjectCapital=Js;window.subWithdraw=Xs;window.subMerge=Zs;window.subSell=Hs;window.subPutForSale=Vs;window.subPlaceBid=Gs;window.subViewBids=Ws;window.subCancelSale=Qs;window.selectSubsidiary=function(t){mt=t,Jt()};let Ct=[],Lt={},ye=null,an=!1,ot="",Ht="",nt="",Ne="";const ua={Construction:4,Finance:5,Shipping:4},el=["Construction","Shipping","Finance"],va={Construction:[{id:"civil",name:"Civil Engineering",mod:0},{id:"industrial",name:"Industrial Construction",mod:.25},{id:"mega",name:"Megaprojects",mod:.4}],Shipping:[{id:"bulk_cargo",name:"Bulk Cargo",mod:0},{id:"container_freight",name:"Container Freight",mod:.2},{id:"specialized_transport",name:"Specialized Transport",mod:.35}],Finance:[{id:"banking",name:"Banking",mod:0},{id:"insurance",name:"Insurance",mod:.15},{id:"investment",name:"Investment Management",mod:.3}],Technology:[{id:"software",name:"Software Development",mod:0},{id:"hardware",name:"Hardware Manufacturing",mod:.2},{id:"telecom",name:"Telecommunications",mod:.35}],Energy:[{id:"oil_gas",name:"Oil & Gas",mod:0},{id:"renewables",name:"Renewables",mod:.2},{id:"mining",name:"Mining",mod:.3}],Healthcare:[{id:"pharma",name:"Pharmaceuticals",mod:0},{id:"hospitals",name:"Hospital Systems",mod:.2},{id:"biotech",name:"Biotechnology",mod:.35}]};async function tl(){const{data:t,error:e}=await g.from("nations").select("*").order("name");e&&console.warn("[Subsidiary] Failed to load nations:",e.message),Ct=(t||[]).filter(n=>n.id!==c?.nation_id);const{data:o}=await g.from("factions").select("nation_id").eq("faction_type","corporation").is("abandoned_at",null);Lt={};for(const n of o||[])n.nation_id&&(Lt[n.nation_id]=(Lt[n.nation_id]||0)+1);nt=c?.corp_sector||"",Ne=c?.corp_subsector||""}function ya(){const t=nt||c?.corp_sector||"";return va[t]||[{id:"general",name:t||"General",mod:0}]}function ol(t){nt=t;const e=va[t];Ne=e?e[0].name:"",Xt()}function ga(){const t=c?.corp_sector||"";return nt===t?1:ua[nt]||4}function nl(){const e=ya().find(o=>o.name===Ne);return e?e.mod:0}function Cn(t){const e=Number(t.standard_of_living??50);return Math.max(.5,Math.round(e/50*100)/100)}function xa(t){const o=ga(),n=1+nl(),i=Cn(t);return Math.round(Math.max(1e7,5e7*o*n*i))}function il(t){const e=Lt[t]||0;return e<=1?{label:"HIGH",color:"#5c5"}:e<=3?{label:"MODERATE",color:"#ca5"}:{label:"LOW",color:"#c55"}}function al(t){if(ye=ye===t?null:t,ye){const e=Ct.find(o=>o.id===ye);ot=(c?.faction_name||"Subsidiary")+" "+(e?.name||"")}else ot="";Xt()}function rl(t){Ne=t,Xt()}function sl(t){ot=t}function ll(t){Ht=t.toUpperCase().slice(0,4)}async function dl(){if(an||!ye)return;const t=Ct.find(r=>r.id===ye);if(!t)return;const e=(ot||"").trim(),o=(Ht||"").trim();if(!e){alert("Please enter a corporation name for the subsidiary.");return}if(o.length<2){alert("Please enter an abbreviation (2-4 chars).");return}if(Q.find(r=>r.nation_id===t.id&&r.type==="regional_hq")){alert("You already have a subsidiary in "+t.name);return}const i=xa(t),a=Number(c?.corp_cash_reserves??0);if(i>a){alert("Insufficient cash. Entry cost: "+_(i)+", available: "+_(a));return}if(confirm("Establish subsidiary in "+t.name+`?

Name: `+e+" ("+o+`)
Subsector: `+(Ne||"General")+`
Entry cost: `+_(i)+`
Creates a Regional HQ (500 capacity)
Unlocks `+t.name+` for operations

Deducted from cash reserves.`)){an=!0;try{const s=(await g.from("shard").select("current_tick").eq("name","Alpha Shard").single()).data?.current_tick||0,l=85+Math.floor(Math.random()*16),d=Math.round(i*.005),{error:f}=await g.from("corp_properties").insert({faction_id:c.id,nation_id:t.id,name:e,type:"regional_hq",style:"Modern",capacity:500,purchase_price:i,monthly_maintenance:d,condition:l,city:t.capital||t.name,purchased_at_tick:s,is_active:!0,subsector:Ne||c?.corp_subsector||null});if(f)throw f;const p=Math.max(0,a-i);await g.from("factions").update({corp_cash_reserves:p}).eq("id",c.id),c.corp_cash_reserves=p,tt(p);const u=nt||c?.corp_sector||"Unknown";try{await g.from("event_log").insert({nation_id:t.id,event_name:"New Subsidiary Established",category:"corporate",description_chosen:`${c.faction_name} has invested ${_(i)} to establish ${e}, a new ${u} corporation in ${t.name}.`,fired_at_tick:N?.current_tick||0})}catch{}try{const{data:m}=await g.from("nations").select("gdp_growth").eq("id",t.id).single();m&&await g.from("nations").update({gdp_growth:Math.min(100,Number(m.gdp_growth||50)+.2)}).eq("id",t.id)}catch{}ye=null,ot="",Ht="",await Kt(),alert('Subsidiary "'+e+'" established in '+t.name+`!

Cost: `+_(i)+`
Regional HQ created with `+l+"% condition.")}catch(r){alert("Failed: "+r.message)}finally{an=!1}}}function Xt(){const t=document.getElementById("create-subsidiary-container");if(!t)return;const e="'JetBrains Mono', monospace",o={bg:"var(--bg-card)",surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},n=c?.corp_sector||"General",i=c?.corp_subsector||"",a=ya(),r=a.find(k=>k.name===Ne)||a[0],s=new Set(Q.filter(k=>k.type==="regional_hq").map(k=>k.nation_id)),l=Ct.filter(k=>!s.has(k.id)),d=ye?l.find(k=>k.id===ye):null,f=ot.trim().length>0&&Ht.trim().length>=2&&d!==null,p=nt||n,u=ga();let m=`
    <div style="padding:6px 14px;border-bottom:1px solid ${o.border};">
        <div style="font-family:${e};font-size:8px;color:${o.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Sector</div>
        <div style="display:flex;gap:3px;">
            ${el.map(k=>{const q=k===p,R=k===n,O=R?1:ua[k]||4,B=R?o.greenBright:o.orange;return`<div onclick="subSetSector('${k}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${q?o.accent+"18":"transparent"};border:1px solid ${q?o.accent+"44":o.border};">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${q?o.accentBright:o.dim}">${k}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${B}">${R?"PARENT · ×1":"×"+O+" COST"}</div>
                </div>`}).join("")}
        </div>
        ${u>1?`<div style="font-family:${e};font-size:7px;color:${o.orange};margin-top:4px;padding:3px 6px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);">Cross-sector subsidiary: base cost ×${u}</div>`:""}
    </div>`,v=`
    <div style="padding:6px 14px;border-bottom:1px solid ${o.border};">
        <div style="font-family:${e};font-size:8px;color:${o.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsector</div>
        <div style="display:flex;gap:3px;">
            ${a.map(k=>{const q=k.name===Ne,R=k.name===i;return`<div onclick="subSetSubsector('${k.name.replace(/'/g,"\\'")}')" style="flex:1;padding:5px 4px;text-align:center;cursor:pointer;background:${q?o.accent+"18":"transparent"};border:1px solid ${q?o.accent+"44":o.border};">
                    <div style="font-family:${e};font-size:8px;font-weight:700;color:${q?o.accentBright:o.dim}">${k.name}</div>
                    <div style="font-family:${e};font-size:7px;margin-top:2px;color:${R?o.greenBright:k.mod>0?o.orange:o.dim}">${R?"SAME — ±0%":k.mod>0?"+"+Math.round(k.mod*100)+"%":"±0%"}</div>
                </div>`}).join("")}
        </div>
    </div>`,b="";if(l.length===0)b=`<div style="padding:20px;text-align:center;font-family:${e};font-size:10px;color:${o.dim}">Subsidiaries in all available nations.</div>`;else for(const k of l){const q=k.id===ye,R=il(k.id),O=Lt[k.id]||0,B=Math.round(Number(k.standard_of_living??50)),F=Cn(k);b+=`
            <div onclick="subSelectNation('${k.id}')" style="display:flex;align-items:center;padding:4px 8px;margin-bottom:2px;cursor:pointer;background:${q?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${q?o.accent+"44":o.border};border-left:${q?"2px solid "+o.accent:"2px solid transparent"};">
                <div style="flex:1;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:11px;font-weight:600;color:${q?o.text:o.muted}">${k.name}</span>
                        <span style="font-family:${e};font-size:7px;font-weight:700;padding:0 4px;color:${R.color};background:${R.color}12;border:1px solid ${R.color}25;line-height:12px">${R.label}</span>
                    </div>
                    <div style="display:flex;gap:8px;margin-top:2px;">
                        <span style="font-family:${e};font-size:7px;color:${o.dim}">STD/LIVING: <span style="color:${o.muted}">${B}</span></span>
                        <span style="font-family:${e};font-size:7px;color:${o.dim}">CORPS: <span style="color:${O>=4?o.red:O>=2?o.yellow:o.greenBright}">${O}</span></span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:${e};font-size:9px;font-weight:700;color:${F>1?o.orange:o.greenBright}">×${F.toFixed(2)}</div>
                </div>
            </div>`}let y=`
    <div style="padding:6px 14px;border-bottom:1px solid ${o.border};">
        <div style="margin-bottom:6px;">
            <div style="font-family:${e};font-size:8px;color:${o.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Corporation Name</div>
            <input type="text" value="${(ot||"").replace(/"/g,"&quot;")}" oninput="subSetName(this.value)" placeholder="e.g., ${(c?.faction_name||"Corp")+" "+(d?.name||"International")}" style="width:100%;padding:5px 8px;font-family:${e};font-size:10px;color:${o.text};background:${o.card};border:1px solid ${o.border};outline:none;box-sizing:border-box;" />
        </div>
        <div>
            <div style="font-family:${e};font-size:8px;color:${o.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:3px">Abbreviation (2-4 chars)</div>
            <input type="text" value="${(Ht||"").replace(/"/g,"&quot;")}" oninput="subSetAbbr(this.value)" placeholder="${(c?.faction_name||"CORP").slice(0,2).toUpperCase()+(d?.name||"XX").slice(0,2).toUpperCase()}" maxlength="4" style="width:80px;padding:5px 8px;font-family:${e};font-size:12px;font-weight:700;color:${o.gold};background:${o.card};border:1px solid ${o.border};outline:none;text-align:center;letter-spacing:2px;" />
        </div>
    </div>`;const $=[{rule:"Bid on projects in that nation",icon:"✓",color:o.greenBright},{rule:"Hires local workers at nation rates",icon:"✓",color:o.greenBright},{rule:"Must use parent's materials & vehicles",icon:"!",color:o.orange},{rule:"Reputation gain: 75% sub / 25% parent",icon:"◐",color:o.gold},{rule:"Market revenue at 50% parent rate",icon:"◐",color:o.gold},{rule:"Counts as domestic corporation",icon:"✓",color:o.greenBright},{rule:"Starting reputation: 25",icon:"●",color:o.muted}];let h=`
    <div style="padding:6px 14px;border-bottom:1px solid ${o.border};">
        <div style="font-family:${e};font-size:8px;color:${o.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Subsidiary Rules</div>
        <div style="background:${o.card};border:1px solid ${o.border};padding:6px 8px;">
            ${$.map((k,q)=>`<div style="display:flex;align-items:center;gap:6px;padding:2px 0;${q<$.length-1?"border-bottom:1px solid "+o.border:""}">
                <span style="font-family:${e};font-size:9px;color:${k.color};width:12px;text-align:center">${k.icon}</span>
                <span style="font-size:9px;color:${o.muted}">${k.rule}</span>
            </div>`).join("")}
        </div>
    </div>`;const E=5e7,S=r.mod,z=d?Cn(d):null,w=d?xa(d):null,I=Math.round(E*u*(1+S));let A=`
    <div style="background:${o.bg};border:1px solid ${o.border};padding:6px 8px;margin-bottom:6px;">
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${o.border};">
            <span style="font-family:${e};font-size:8px;color:${o.dim}">BASE</span>
            <span style="font-family:${e};font-size:9px;color:${o.muted}">${_(E)}</span>
        </div>
        ${u>1?`<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${o.border};">
            <span style="font-family:${e};font-size:8px;color:${o.dim}">SECTOR (${p})</span>
            <span style="font-family:${e};font-size:9px;font-weight:700;color:${o.orange}">×${u}</span>
        </div>`:""}
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${o.border};">
            <span style="font-family:${e};font-size:8px;color:${o.dim}">SUBSECTOR (${r.name})</span>
            <span style="font-family:${e};font-size:9px;color:${S===0?o.greenBright:o.orange}">${S===0?"±0%":"+"+Math.round(S*100)+"%"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid ${o.border};">
            <span style="font-family:${e};font-size:8px;color:${o.dim}">NATION (${d?d.name:"select below"})</span>
            <span style="font-family:${e};font-size:9px;color:${d?z>1?o.orange:o.greenBright:o.dim}">${d?"×"+z.toFixed(2):"—"}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:3px 0;">
            <span style="font-family:${e};font-size:9px;font-weight:700;color:${o.text}">TOTAL COST</span>
            <span style="font-family:${e};font-size:14px;font-weight:700;color:${o.gold}">${d?_(w):"~"+_(I)}</span>
        </div>
    </div>`;t.innerHTML=`
    <div style="width:380px;height:450px;background:${o.surface};border:1px solid ${o.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${o.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${o.gold}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${o.muted};text-transform:uppercase">Create Subsidiary</span>
            </div>
        </div>
        <div style="flex:1;overflow:auto;">
            ${m}
            ${v}
            <div style="padding:6px 14px;border-bottom:1px solid ${o.border};">
                <div style="font-family:${e};font-size:8px;color:${o.dim};letter-spacing:1px;text-transform:uppercase;margin-bottom:4px">Nation</div>
                ${b}
            </div>
            ${y}
            ${h}
        </div>
        <div style="padding:8px 14px;border-top:1px solid ${o.border};background:${o.card};flex-shrink:0;">
            ${A}
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <span style="font-family:${e};font-size:8px;color:${o.dim}">IMMEDIATE PAYMENT</span>
                <div onclick="subCreate()"
                    onmouseover="this.style.filter='brightness(1.2)';this.style.transform='scale(1.02)'"
                    onmouseout="this.style.filter='';this.style.transform=''"
                    onmousedown="this.style.transform='scale(0.97)'"
                    onmouseup="this.style.transform='scale(1.02)'"
                    style="padding:6px 22px;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${f?"#000":"#c8a832"};background:${f?o.gold:"rgba(200,168,50,0.08)"};border:1px solid ${f?o.gold:"rgba(200,168,50,0.3)"};cursor:pointer;opacity:${f?1:.7};transition:all 0.1s ease;user-select:none">CREATE SUBSIDIARY</div>
            </div>
        </div>
    </div>`}window.subSelectNation=al;window.subCreate=dl;window.subSetName=sl;window.subSetAbbr=ll;window.subSetSector=ol;window.subSetSubsector=rl;let qt=[],Ue=0,wo=JSON.parse(localStorage.getItem("nationhood_investigated_corps")||"{}"),_e="ALL",Be="REPUTATION";async function cl(){const[t,e]=await Promise.all([g.from("factions").select("id, faction_name, abbreviation, corp_sector, corp_subsector, corp_company_type, corp_ticker, corp_cash_reserves, corp_loans, corp_reputation, nation_id, nation, linked_user_id").eq("faction_type","corporation").is("abandoned_at",null).order("faction_name"),g.from("corp_properties").select("id, faction_id, name, nation_id, subsector, type, factions(faction_name, corp_sector, corp_ticker, abbreviation, corp_reputation, corp_company_type, linked_user_id)").eq("type","regional_hq").eq("is_active",!0)]),o={};for(const l of t.data||[])o[l.id]=l;const n=(t.data||[]).map(l=>l.id).filter(Boolean),i={};if(n.length){const{data:l}=await g.from("finance_active_loans").select("lender_faction_id, principal, remaining_principal, finance_loan_requests!inner(request_type)").in("lender_faction_id",n).in("status",["current","late","delinquent"]);for(const d of l||[]){const f=d.lender_faction_id;i[f]||(i[f]=[]),i[f].push(d)}}const a=(t.data||[]).map(l=>{const d=(l.corp_company_type||"Private").toUpperCase(),f=Number(l.corp_cash_reserves||0),p=Number(l.corp_loans||0),u=bi(i[l.id]||[]).total;return{...l,abbr:l.corp_ticker||l.abbreviation||l.faction_name?.slice(0,4).toUpperCase()||"???",status:d,isPlayer:!!l.linked_user_id,reputation:Math.round(Number(l.corp_reputation??50)),revenue:Math.round(f*.1),valuation:Nn({cash:f,loans:p,financeReceivables:u}),_isSub:!1}}),{data:r}=await g.from("nations").select("id, name"),s={};(r||[]).forEach(l=>{s[l.id]=l.name});for(const l of e.data||[]){const d=o[l.faction_id];if(!d)continue;const f=(d.corp_company_type||"Private").toUpperCase();a.push({id:l.id,faction_name:l.name||"Subsidiary",abbreviation:d.abbreviation,corp_sector:d.corp_sector,corp_subsector:l.subsector||d.corp_subsector,corp_ticker:d.corp_ticker,nation_id:l.nation_id,nation:s[l.nation_id]||"?",abbr:(d.corp_ticker||d.abbreviation||"??").slice(0,4),status:f,isPlayer:!!d.linked_user_id,reputation:Math.round(Number(d.corp_reputation??50)),revenue:0,valuation:0,_isSub:!0,_parentName:d.faction_name})}qt=a}function pl(t){Ue=t,Zt()}function fl(t){_e=t,Ue=0,Zt()}function ml(t){Be=t,Ue=0,Zt()}async function ul(t){if(!c||!N)return;const e=Number(c.corp_cash_reserves??0);if(e<5e5){alert("Insufficient cash. Need $500k.");return}const{error:o}=await g.from("factions").update({corp_cash_reserves:e-5e5}).eq("id",c.id);if(o){alert("Failed: "+o.message);return}c.corp_cash_reserves=e-5e5,wo[t]=!0,localStorage.setItem("nationhood_investigated_corps",JSON.stringify(wo));const{data:n}=await g.from("factions").select("corp_cash_reserves, corp_loans, corp_reputation, corp_general_workforce, corp_skilled_workforce, corp_innovative_workforce").eq("id",t).single();if(n){const i=qt.find(a=>a.id===t);if(i){Object.assign(i,n);const a=Number(n.corp_cash_reserves||0),r=Number(n.corp_loans||0);let s=0;try{const{data:l}=await g.from("finance_active_loans").select("principal, remaining_principal, finance_loan_requests!inner(request_type)").eq("lender_faction_id",t).in("status",["current","late","delinquent"]);s=bi(l||[]).total}catch(l){console.warn("[corpInvestigate] receivable lookup failed:",l)}i.reputation=Math.round(Number(n.corp_reputation??50)),i.revenue=Math.round(a*.1),i.valuation=Nn({cash:a,loans:r,financeReceivables:s})}}Zt()}function Zt(){const t=document.getElementById("corporations-container");if(!t)return;const e="'JetBrains Mono', monospace",o={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",blue:"#5a8aaa",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},n={PUBLIC:{color:o.greenBright,bg:"rgba(92,204,92,0.06)",border:"rgba(92,204,92,0.15)"},PRIVATE:{color:o.gold,bg:"rgba(200,168,50,0.08)",border:"rgba(200,168,50,0.2)"},STATE:{color:o.orange,bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.15)"}},i=[...new Set(qt.map(m=>m.nation).filter(Boolean))];let a=[...qt];_e!=="ALL"&&(a=a.filter(m=>m.nation===_e)),Be==="REPUTATION"?a.sort((m,v)=>(v.reputation||0)-(m.reputation||0)):Be==="REVENUE"?a.sort((m,v)=>(v.revenue||0)-(m.revenue||0)):Be==="VALUATION"&&a.sort((m,v)=>(v.valuation||0)-(m.valuation||0)),Ue>=a.length&&(Ue=0);const r=a[Ue]||null;N?.current_tick;const s=r&&!!wo[r.id],l=r&&r.status==="PRIVATE"&&!s,d=r&&r.status==="STATE";let f="";a.length===0&&(f=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${o.dim}">No corporations found.</div>`);for(let m=0;m<a.length;m++){const v=a[m],b=m===Ue,y=n[v.status]||n.PRIVATE,$=v.status==="PRIVATE"&&!wo[v.id];f+=`
        <div onclick="corpSelect(${m})" style="display:flex;align-items:center;padding:7px 16px;border-bottom:1px solid ${o.border};cursor:pointer;border-left:2px solid ${b?o.accent:"transparent"};background:${b?"rgba(139,154,107,0.03)":"transparent"};">
            <span style="width:42px;font-family:${e};font-size:10px;font-weight:700;color:${o.gold}">${v.abbr}</span>
            <div style="flex:1.3;">
                <div style="font-size:11px;font-weight:600;color:${o.text};line-height:1.2">${v.faction_name}</div>
                <div style="font-family:${e};font-size:7px;color:${o.dim};margin-top:1px">${v._isSub?'<span style="color:#8a6aaa;">SUB</span> · ':""}${v.corp_subsector||v.corp_sector||"—"}</div>
            </div>
            <span style="width:62px"><span style="font-family:${e};font-size:8px;padding:1px 5px;color:${o.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(v.nation||"—").toUpperCase().slice(0,6)}</span></span>
            <span style="width:56px;font-family:${e};font-size:9px;font-weight:700;color:${$?o.dim:o.muted};text-align:right">${$?"—":_(v.revenue)}</span>
            <span style="width:34px;font-family:${e};font-size:10px;font-weight:700;color:${v.reputation>=70?o.greenBright:v.reputation>=40?o.accent:o.yellow};text-align:right">${v.reputation}</span>
            <span style="width:56px;font-family:${e};font-size:9px;color:${$?o.dim:o.muted};text-align:right">${$?"—":_(v.valuation)}</span>
            <span style="width:48px;text-align:center"><span style="font-family:${e};font-size:7px;font-weight:700;padding:1px 5px;color:${y.color};background:${y.bg};border:1px solid ${y.border}">${v.status}</span></span>
        </div>`}let p="";if(r){const m=n[r.status]||n.PRIVATE,v=[...r._isSub?[{label:"Parent",value:r._parentName||"—",color:"#8a6aaa"}]:[],{label:"Sector",value:r.corp_sector||"—",color:o.text},{label:"Subsector",value:r.corp_subsector||"—",color:o.accent},{label:"Reputation",value:r.reputation+"/100",color:r.reputation>=70?o.greenBright:r.reputation>=40?o.accent:o.yellow},{label:"Revenue",value:l?"UNDISCLOSED":_(r.revenue),color:l?o.dim:o.greenBright},{label:"Cash Reserves",value:l?"UNDISCLOSED":_(r.corp_cash_reserves||0),color:l?o.dim:o.text},{label:"Market Valuation",value:l?"UNDISCLOSED":_(r.valuation),color:l?o.dim:o.gold}];p=`
        <div style="padding:10px 16px;border-bottom:1px solid ${o.border};background:${o.card};flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                <span style="font-family:${e};font-size:14px;font-weight:700;color:${o.gold}">${r.abbr}</span>
                <span style="font-size:14px;font-weight:700;color:${o.text}">${r.faction_name}</span>
            </div>
            <div style="display:flex;gap:6px;align-items:center;">
                <span style="font-family:${e};font-size:8px;padding:2px 6px;color:${o.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${(r.nation||"—").toUpperCase()}</span>
                <span style="font-family:${e};font-size:8px;font-weight:700;padding:2px 6px;color:${m.color};background:${m.bg};border:1px solid ${m.border}">${r.status}</span>
                ${r._isSub?`<span style="font-family:${e};font-size:8px;font-weight:700;padding:2px 6px;color:#8a6aaa;background:rgba(138,106,170,0.08);border:1px solid rgba(138,106,170,0.2)">SUBSIDIARY</span>`:""}
                ${r.isPlayer?`<span style="font-family:${e};font-size:8px;font-weight:700;padding:2px 6px;color:${o.blue};background:rgba(90,138,170,0.08);border:1px solid rgba(90,138,170,0.2)">PLAYER</span>`:`<span style="font-family:${e};font-size:8px;color:${o.dim}">NPC</span>`}
            </div>
        </div>
        ${v.map(b=>`<div style="display:flex;justify-content:space-between;padding:5px 16px;border-bottom:1px solid ${o.border};">
            <span style="font-family:${e};font-size:10px;color:${o.dim};text-transform:uppercase">${b.label}</span>
            <span style="font-family:${e};font-size:11px;font-weight:700;color:${b.value==="UNDISCLOSED"?o.dim:b.color};${b.value==="UNDISCLOSED"?"font-style:italic;":""}">${b.value}</span>
        </div>`).join("")}
        <div style="padding:6px 14px;border-bottom:1px solid ${o.border};flex-shrink:0;">
            <div style="width:100%;height:4px;background:${o.border}"><div style="width:${r.reputation}%;height:100%;background:${r.reputation>=70?o.greenBright:r.reputation>=40?o.accent:o.yellow}"></div></div>
        </div>
        ${l?`<div style="padding:6px 14px;border-bottom:1px solid ${o.border};background:rgba(200,168,50,0.03);">
            <div style="font-family:${e};font-size:8px;color:${o.gold};margin-bottom:2px">PRIVATE — FINANCIALS UNDISCLOSED</div>
            <div style="font-size:9px;color:${o.dim};line-height:1.4">Use INVESTIGATE to reveal financial data for 12 ticks.</div>
        </div>`:""}
        ${d?`<div style="padding:6px 14px;border-bottom:1px solid ${o.border};background:rgba(204,136,68,0.03);">
            <div style="font-family:${e};font-size:8px;color:${o.orange};margin-bottom:2px">STATE-OWNED ENTERPRISE</div>
            <div style="font-size:9px;color:${o.dim};line-height:1.4">Government-controlled. Cannot be acquired directly. May be privatized by parliamentary vote.</div>
        </div>`:""}
        <div style="flex:1"></div>
        <div style="padding:6px 14px;border-top:1px solid ${o.border};background:${o.card};flex-shrink:0;">
            <div style="font-family:${e};font-size:8px;letter-spacing:1.5px;color:${o.dim};text-transform:uppercase;margin-bottom:6px">Actions</div>
            <div style="display:flex;gap:4px;margin-bottom:4px;">
                <div onclick="${l?`corpInvestigate('${r.id}')`:""}" style="flex:1;padding:5px 0;text-align:center;cursor:${l?"pointer":"default"};font-family:${e};font-size:8px;font-weight:700;color:${l?o.blue:s?o.greenBright:o.dim};border:1px solid ${l?o.blue+"44":s?o.greenBright+"44":o.border};opacity:${l?1:.3}">${s?"INVESTIGATED ✓":"INVESTIGATE — $500k"}</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:${e};font-size:8px;font-weight:700;color:${o.accent};border:1px solid ${o.accent}44">PARTNER</div>
            </div>
            <div style="display:flex;gap:4px;">
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${d?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${d?o.dim:o.gold};border:1px solid ${d?o.border:o.gold+"44"};opacity:${d?.3:1}">ACQUIRE</div>
                <div style="flex:1;padding:5px 0;text-align:center;cursor:${d?"not-allowed":"pointer"};font-family:${e};font-size:8px;font-weight:700;color:${d?o.dim:o.orange};border:1px solid ${d?o.border:o.orange+"44"};opacity:${d?.3:1}">MERGER</div>
            </div>
            ${d?`<div style="margin-top:4px;font-family:${e};font-size:7px;color:${o.dim}">State-owned corps cannot be acquired or merged.</div>`:""}
        </div>`}else p=`<div style="padding:30px;text-align:center;font-family:${e};font-size:10px;color:${o.dim}">Select a corporation to view details.</div>`;const u=`
    <div style="padding:6px 16px;border-bottom:1px solid ${o.border};background:${o.card};display:flex;gap:12px;align-items:center;flex-shrink:0;">
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:8px;color:${o.dim};letter-spacing:0.8px;width:40px">NATION</span>
            <span onclick="corpFilterNation('ALL')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${_e==="ALL"?"#000":o.dim};background:${_e==="ALL"?o.accent:"transparent"};border:1px solid ${_e==="ALL"?o.accent:o.border}">ALL</span>
            ${i.map(m=>`<span onclick="corpFilterNation('${m}')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${_e===m?"#000":o.dim};background:${_e===m?o.accent:"transparent"};border:1px solid ${_e===m?o.accent:o.border}">${m}</span>`).join("")}
        </div>
        <div style="flex:1"></div>
        <div style="display:flex;gap:3px;align-items:center;">
            <span style="font-family:${e};font-size:8px;color:${o.dim};letter-spacing:0.8px">SORT</span>
            ${["REPUTATION","REVENUE","VALUATION"].map(m=>`<span onclick="corpSort('${m}')" style="padding:3px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${Be===m?"#000":o.dim};background:${Be===m?o.accent:"transparent"};border:1px solid ${Be===m?o.accent:o.border}">${m}</span>`).join("")}
        </div>
    </div>`;t.innerHTML=`
    <div style="width:760px;height:450px;background:${o.surface};border:1px solid ${o.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:8px 14px;border-bottom:1px solid ${o.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:${o.accent}">●</span>
                <span style="font-family:${e};font-size:11px;font-weight:700;letter-spacing:2px;color:${o.muted};text-transform:uppercase">Corporations</span>
            </div>
            <span style="font-family:${e};font-size:9px;color:${o.dim}">${qt.length} IN DATABASE</span>
        </div>
        ${u}
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${o.border};display:flex;flex-direction:column;">
                <div style="display:flex;padding:5px 16px;border-bottom:1px solid ${o.border};background:${o.card};flex-shrink:0;">
                    <span style="width:42px;font-family:${e};font-size:8px;color:${o.dim}">ABBR</span>
                    <span style="flex:1.3;font-family:${e};font-size:8px;color:${o.dim}">CORPORATION</span>
                    <span style="width:62px;font-family:${e};font-size:8px;color:${o.dim}">NATION</span>
                    <span style="width:56px;font-family:${e};font-size:8px;color:${o.dim};text-align:right">REV</span>
                    <span style="width:34px;font-family:${e};font-size:8px;color:${o.dim};text-align:right">REP</span>
                    <span style="width:56px;font-family:${e};font-size:8px;color:${o.dim};text-align:right">VALUE</span>
                    <span style="width:48px;font-family:${e};font-size:8px;color:${o.dim};text-align:center">STATUS</span>
                </div>
                <div style="flex:1;overflow:auto;">${f}</div>
            </div>
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                ${p}
            </div>
        </div>
    </div>`}window.corpSelect=pl;window.corpInvestigate=ul;window.corpFilterNation=fl;window.corpSort=ml;let $e=null,ze={},J=120,Ie=15,Tn={},ut=[];async function vl(){if(!We)return;if(wt[We.id]){alert("You already have a bid on this contract. Retract it first if you want to re-bid.");return}$e=We,Tn={};try{const{data:o}=await g.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",c.id);for(const n of o||[])Tn[fo(n.material_key)]=Number(n.quantity||0)}catch{}ut=[];try{const{data:o}=await g.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",$e.id).in("status",["pending","won"]);ut=(o||[]).filter(n=>n.faction_id!==c?.id).map(n=>({name:n.factions?.faction_name||"Unknown",ticker:n.factions?.corp_ticker||"???",price:Number(n.bid_price||0),quality:Number(n.estimated_quality||0),status:n.status}))}catch{}ze={};const t=$e.required_materials||{};for(const o of Object.keys(t))ze[o]="STD";const e=$e.required_workforce||{};J=Number(e.general||0)+Number(e.skilled||0)||120,Ie=15,Yt(),Po()}function ei(){document.getElementById("bid-assembly-overlay")?.remove(),$e=null}function yl(t,e){ze[t]=e,Po()}function gl(t){J=t,Po()}function xl(t){Ie=t,Po()}function Po(){if(document.getElementById("bid-assembly-overlay")?.remove(),!$e)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},o=$e,n=o.issuer_type==="GOVERNMENT",i=M?.name||c?.nation||"—",a=Number(o.budget_ceiling||0),r=Number(o.timeline_ticks||8),s=o.required_materials||{},l=Object.keys(s),d={LOW:.5,STD:1,HIGH:2},f={LOW:e.orange,STD:e.yellow,HIGH:e.greenBright},p={LOW:"Low",STD:"Standard",HIGH:"High"},u={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},m=Tn||{};let v=0,b="";for(const U of l){const K=Number(s[U]||0),ai=ze[U]||"STD",ri=u[U]||3e5,Ta=d[ai],Sa=Math.round(ri*Ta),si=K*Sa;v+=si;const za=U.replace(/_/g," ").replace(/\b\w/g,Re=>Re.toUpperCase()),li=Number(m[U]||0),Uo=Math.max(0,K-li),Ia=Uo===0?e.greenBright:Uo<K?e.yellow:e.red,Na=Uo===0?"✓ IN STOCK":`${li}/${K}`;b+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${e.text}">${za}</span>
                <div style="font-family:${t};font-size:7px;color:${Ia};margin-top:1px">${Na}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${t};font-size:9px;color:${e.muted}">${K.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(Re=>{const Ho=ai===Re,di=f[Re],Ma=_(Math.round(ri*d[Re]));return`<span onclick="bidSetGrade('${U}','${Re}')" style="padding:2px 6px;font-family:${t};font-size:7px;font-weight:700;cursor:pointer;color:${Ho?"#000":e.dim};background:${Ho?di:"transparent"};border:1px solid ${Ho?di:e.border}" title="${Ma}/unit">${p[Re]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${t};font-size:10px;color:${e.text}">${_(si)}</span></div>
        </div>`}const y=o.required_workforce||{},$=Number(y.general||0)+Number(y.skilled||0)||100,h=Math.max(40,Math.round($*.5)),E=$*2,S=[h,Math.round($*.75),$,Math.round($*1.5),E],z=Math.max(0,Math.min(1,(J-h)/(E-h||1))),w=r,I=Math.round(4.5-z*8),A=Math.max(Math.round(w*.6),w+I),k=I>0?`+${I}mo`:I<0?`${I}mo`:"On schedule",q=I>0?e.red:I<0?e.greenBright:e.yellow,R=15200,O=J*R*A,B=a,V=[{name:"Municipal Zoning Approval",cost:18e4,ticks:2,required:!0},{name:"Structural Engineering Cert.",cost:24e4,ticks:3,required:!0},{name:"Environmental Impact Assessment",cost:34e4,ticks:8,required:B>2e7},{name:"Seismic Resilience Compliance",cost:21e4,ticks:4,required:B>5e7},{name:"Heritage Conservation Review",cost:16e4,ticks:6,required:!1},{name:"Fire Safety Certification",cost:12e4,ticks:2,required:B>1e7}].filter(U=>U.required),C=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),T=V.filter(U=>!C.has(U.name)).reduce((U,K)=>U+K.cost,0),j=4e5,H=v+O+T+j,G=Math.round(H*(Ie/100)),oe=H+G,W=oe>a,jo=G,Ae=W?0:Math.max(0,Math.min(100,Math.round(100-oe/a*100+30))),ii=Ae>70?e.greenBright:Ae>40?e.yellow:Ae>0?e.orange:e.red,Ea=W?"OVER CEILING":Ae>70?"STRONG":Ae>40?"COMPETITIVE":Ae>20?"WEAK":"UNLIKELY",Fo=Object.values(ze),be=Fo.length>0?Math.round(Fo.reduce((U,K)=>U+(K==="HIGH"?85:K==="STD"?65:45),0)/Fo.length):50,eo=be>=75?e.greenBright:be>=50?e.yellow:be>=25?e.orange:e.red,Ca=be>=75?"EXCELLENT":be>=50?"FAIR":be>=25?"POOR":"BAD",at=document.createElement("div");at.id="bid-assembly-overlay",at.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",at.addEventListener("click",U=>{U.target===at&&ei()}),at.innerHTML=`
    <div style="width:740px;max-height:94vh;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <!-- HEADER -->
        <div style="padding:10px 16px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 8px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${i.toUpperCase()}</span>
                    <span style="font-size:14px;font-weight:700;color:${e.text}">${o.name}</span>
                    <span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 6px;color:${n?e.accentBright:e.gold};background:${n?"rgba(163,176,126,0.1)":"rgba(200,168,50,0.08)"};border:1px solid ${n?"rgba(163,176,126,0.2)":"rgba(200,168,50,0.2)"}">${n?"GOV":"PRIVATE"}</span>
                </div>
                <span onclick="closeBidAssembly()" style="font-family:${t};font-size:14px;color:${e.dim};cursor:pointer;padding:0 4px">×</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                <span style="font-family:${t};font-size:9px;color:${e.dim}">${o.project_code||"—"}</span>
                <span style="font-family:${t};font-size:9px;color:${e.dim}">·</span>
                <span style="font-size:10px;color:${e.accent}">${o.issuer_name||"—"}</span>
                <span style="font-family:${t};font-size:9px;color:${e.dim}">·</span>
                <span style="font-family:${t};font-size:9px;color:${e.muted}">Ceiling: <span style="color:${e.text};font-weight:700">${_(a)}</span></span>
                <span style="font-family:${t};font-size:9px;color:${e.dim}">·</span>
                <span style="font-family:${t};font-size:9px;color:${e.muted}">Timeline: <span style="color:${e.text};font-weight:700">${r} months</span></span>
            </div>
        </div>

        <!-- CONTENT — two columns -->
        <div style="flex:1;display:flex;overflow:hidden;">

            <!-- LEFT: Cost Assembly -->
            <div style="flex:1;border-right:1px solid ${e.border};overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Materials</span>
                </div>
                <div style="display:flex;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="flex:1.2;font-family:${t};font-size:7px;color:${e.dim}">MATERIAL</span>
                    <span style="flex:0.5;font-family:${t};font-size:7px;color:${e.dim};text-align:center">QTY</span>
                    <span style="flex:1.2;font-family:${t};font-size:7px;color:${e.dim};text-align:center">GRADE</span>
                    <span style="flex:0.8;font-family:${t};font-size:7px;color:${e.dim};text-align:right">COST</span>
                </div>
                ${b}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${t};font-size:9px;color:${e.muted}">MATERIALS TOTAL</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${_(v)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Labor</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim};width:60px">WORKERS</span>
                        <div style="display:flex;gap:3px;">
                            ${S.map(U=>`<span onclick="bidSetWorkers(${U})" style="padding:2px 8px;font-family:${t};font-size:8px;font-weight:700;cursor:pointer;color:${J===U?"#000":e.dim};background:${J===U?e.accent:"transparent"};border:1px solid ${J===U?e.accent:e.border}">${U}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">${J} × $${R.toLocaleString()}/tick × ${A} ticks</span>
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${_(O)}</span>
                    </div>
                    <div style="margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <span style="font-family:${t};font-size:8px;color:${e.dim}">WORKFORCE REQUIRED</span>
                        </div>
                        <div style="display:flex;gap:12px;">
                            <span style="font-family:${t};font-size:7px;color:#8b9a6b">General: ${Math.ceil(J*.8)}</span>
                            <span style="font-family:${t};font-size:7px;color:#c8a832">Skilled: ${Math.ceil(J*.15)}</span>
                            <span style="font-family:${t};font-size:7px;color:#c84">Innovative: ${Math.ceil(J*.05)}</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">COMPLETION TIMELINE</span>
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${q}">${A}mo <span style="font-size:8px;opacity:0.7">(${k})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${V.map(U=>{const K=C.has(U.name);return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
                        <div style="flex:1;display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${t};font-size:8px;font-weight:700;color:${K?e.greenBright:e.orange}">${K?"✓":"○"}</span>
                            <span style="font-size:10px;color:${K?e.muted:e.text}">${U.name}</span>
                        </div>
                        ${K?`<span style="font-family:${t};font-size:8px;color:${e.greenBright}">HELD</span>`:`<div style="text-align:right">
                                <span style="font-family:${t};font-size:9px;color:${e.redDim}">${_(U.cost)}</span>
                                <span style="font-family:${t};font-size:7px;color:${e.dim};margin-left:4px">${U.ticks}t</span>
                            </div>`}
                    </div>`}).join("")}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${t};font-size:9px;color:${e.muted}">PERMIT COSTS</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${_(T)}</span>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${t};font-size:9px;color:${e.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${_(j)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v},{l:"Labor",v:O},{l:"Permits",v:T},{l:"Overhead",v:j}].map(U=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-size:10px;color:${e.muted}">${U.l}</span>
                    <span style="font-family:${t};font-size:10px;color:${e.redDim}">${_(U.v)}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:rgba(204,85,85,0.03);">
                    <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">TOTAL EST. COST</span>
                    <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.red}">${_(H)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.gold};text-transform:uppercase">Set Markup</span>
                </div>
                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="font-family:${t};font-size:9px;color:${e.dim}">MARKUP %</span>
                        <span style="font-family:${t};font-size:16px;font-weight:700;color:${e.gold}">${Ie}%</span>
                    </div>
                    <input type="range" min="0" max="40" step="1" value="${Ie}" oninput="bidSetMarkup(+this.value)" style="width:100%;accent-color:${e.gold};height:6px;" />
                    <div style="display:flex;justify-content:space-between;font-family:${t};font-size:7px;color:${e.dim};margin-top:2px;">
                        <span>0% (at cost)</span><span>40% (maximum)</span>
                    </div>
                </div>

                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${W?"rgba(204,85,85,0.04)":"rgba(200,168,50,0.03)"};">
                    <div style="font-family:${t};font-size:8px;color:${e.dim};margin-bottom:4px">YOUR BID PRICE</div>
                    <div style="font-family:${t};font-size:22px;font-weight:700;color:${W?e.red:e.gold}">${_(oe)}</div>
                    ${W?`<div style="font-family:${t};font-size:8px;font-weight:700;color:${e.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${_(a)})</div>`:""}
                </div>

                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">PROJECTED PROFIT</span>
                        <span style="font-family:${t};font-size:14px;font-weight:700;color:${jo>0?e.greenBright:e.dim}">+${_(jo)}</span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Bid Assessment</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">COMPETITIVENESS</span>
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${ii}">${Ea}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${Ae}%;height:100%;background:${ii}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${t};font-size:11px;font-weight:700;color:${eo}">${be}</span>
                            <span style="font-family:${t};font-size:8px;color:${e.dim}">/100</span>
                            <span style="font-family:${t};font-size:8px;font-weight:700;color:${eo}">${Ca}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${be}%;height:100%;background:${eo}"></div></div>
                    <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${ut.length===0?`<div style="font-family:${t};font-size:8px;color:${e.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${ut.map(U=>`<span style="padding:2px 6px;font-family:${t};font-size:7px;color:${e.muted};background:${e.card};border:1px solid ${e.border};">${U.name} <span style="color:${e.dim}">Q:${U.quality}</span></span>`).join("")}
                        </div>
                        <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:3px">${ut.length} competing bid${ut.length!==1?"s":""}. Bid prices are sealed until resolution.</div>`}
                    <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:3px">Higher reputation bidders may win at higher prices.</div>
                </div>
                <div style="flex:1"></div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">YOUR BID</div><div style="font-family:${t};font-size:14px;font-weight:700;color:${W?e.red:e.gold}">${_(oe)}</div></div>
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">EST. PROFIT</div><div style="font-family:${t};font-size:14px;font-weight:700;color:${e.greenBright}">+${_(jo)}</div></div>
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${t};font-size:14px;font-weight:700;color:${eo}">${be}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${t};font-size:10px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="${W?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${t};font-size:10px;font-weight:700;letter-spacing:1px;color:${W?e.dim:"#000"};background:${W?e.border:e.gold};cursor:${W?"not-allowed":"pointer"};opacity:${W?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(at)}let rn=!1;async function bl(){if(rn||!$e)return;const t=$e,e=t.required_materials||{},o=Object.keys(e),n=Number(t.budget_ceiling||0),i=Number(t.timeline_ticks||8),a={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},r={LOW:.5,STD:1,HIGH:2};let s=0;for(const R of o){const O=Number(e[R]||0),B=ze[R]||"STD",F=a[R]||3e5;s+=O*Math.round(F*r[B])}const l=15200,d=t.required_workforce||{},f=Number(d.general||0)+Number(d.skilled||0)||100,p=Math.max(40,Math.round(f*.5)),u=f*2,m=Math.max(0,Math.min(1,(J-p)/(u-p||1))),v=Math.round(4.5-m*8),b=Math.max(Math.round(i*.6),i+v),y=J*l*b,$=n,h=[{name:"Municipal Zoning Approval",cost:18e4,required:!0},{name:"Structural Engineering Cert.",cost:24e4,required:!0},{name:"Environmental Impact Assessment",cost:34e4,required:$>2e7},{name:"Seismic Resilience Compliance",cost:21e4,required:$>5e7},{name:"Fire Safety Certification",cost:12e4,required:$>1e7}],E=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),S=h.filter(R=>R.required&&!E.has(R.name)).reduce((R,O)=>R+O.cost,0),w=s+y+S+4e5,I=Math.round(w*(Ie/100)),A=w+I;if(A>n){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const k=Object.values(ze),q=k.length>0?Math.round(k.reduce((R,O)=>R+(O==="HIGH"?85:O==="STD"?65:45),0)/k.length):50;if(confirm('Submit bid for "'+t.name+`"?

Bid Price: `+_(A)+`
Est. Cost: `+_(w)+`
Markup: `+Ie+"% ("+_(I)+`)
Quality: `+q+`/100
Workers: `+J+`

Once submitted, your bid cannot be changed.`)){rn=!0;try{const{data:R}=await g.from("shard").select("current_tick").eq("name","Alpha Shard").single(),O=R?.current_tick||0,B={};for(const V of o)B[V]=ze[V]||"STD";const{error:F}=await g.from("contract_bids").insert({contract_id:t.id,faction_id:c.id,bid_price:A,material_grades:B,labor_count:J,markup_pct:Ie,estimated_cost:w,estimated_quality:q,status:"pending",submitted_at_tick:O});if(F)throw F;t.status==="open"&&await g.from("construction_contracts").update({status:"bidding"}).eq("id",t.id).eq("status","open"),ei(),alert(`Bid submitted successfully!

Contract: `+t.name+`
Your Bid: `+_(A)+`
Quality: `+q+`/100

Bids will be resolved when the bidding window closes (`+(t.bidding_ends_tick?"tick "+t.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof Ze=="function"&&await Ze()}catch(R){alert("Bid submission failed: "+R.message)}finally{rn=!1}}}window.openBidAssembly=vl;window.closeBidAssembly=ei;window.bidSetGrade=yl;window.bidSetWorkers=gl;window.bidSetMarkup=xl;window.submitBidAssembly=bl;let sn=!1;async function _l(t){if(sn)return;const e=1e6,o=Number(c?.corp_cash_reserves??0);if(o<e){alert("Cannot retract — you need at least $1M in cash reserves to cover the retraction penalty.");return}if(confirm(`Retract your bid?

This will cost $1M as a retraction penalty.
This action cannot be undone.`)){sn=!0;try{const n=o-e,{error:i}=await g.from("factions").update({corp_cash_reserves:n}).eq("id",c.id);if(i)throw i;const{error:a}=await g.from("contract_bids").delete().eq("contract_id",t).eq("faction_id",c.id);if(a)throw a;c.corp_cash_reserves=n,typeof tt=="function"&&tt(n),alert("Bid retracted. $1M penalty applied."),Yt(),await Ze()}catch(n){alert("Failed to retract bid: "+(n.message||"Unknown error"))}finally{sn=!1}}}window.retractBid=_l;let Vt=[],He=0,ge=null,ln=!1,dn=!1,cn=!1;async function hl(){if(!We||dn)return;dn=!0,ge=We,He=0;const{data:t,error:e}=await g.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",ge.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(dn=!1,e){alert("Failed to load bids: "+e.message);return}Vt=(t||[]).map(o=>({...o,corp:o.factions?.faction_name||"Unknown",abbr:o.factions?.corp_ticker||"???",subsector:o.factions?.corp_subsector||"—"})),Yt(),ba()}function Do(){document.getElementById("bid-review-overlay")?.remove(),ge=null}function $l(t){He=t,ba()}async function wl(){if(ln||Vt.length===0)return;const t=Vt[He];if(!(!t?.id||!t.faction_id)&&confirm("Accept bid from "+t.corp+`?

Bid Price: `+_(t.bid_price)+`
Quality: `+t.estimated_quality+`/100
Workers: `+t.labor_count+`

This will award the contract. The project begins immediately.`)){ln=!0;try{const{data:e}=await g.from("shard").select("current_tick").eq("name","Alpha Shard").single(),o=e?.current_tick||0,{error:n}=await g.from("contract_bids").update({status:"won"}).eq("id",t.id);if(n)throw n;const{error:i}=await g.from("contract_bids").update({status:"lost"}).eq("contract_id",ge.id).neq("id",t.id);if(i)throw i;const{error:a}=await g.from("construction_contracts").update({status:"awarded",awarded_to_faction:t.faction_id,awarded_at_tick:o}).eq("id",ge.id);if(a)throw a;Do(),alert("Contract awarded to "+t.corp+`!

Bid: `+_(t.bid_price)+`
Project begins immediately.`),typeof Ze=="function"&&await Ze()}catch(e){alert("Failed to accept bid: "+(e.message||e))}finally{ln=!1}}}async function kl(){if(!(!ge||cn)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){cn=!0;try{const{error:t}=await g.from("contract_bids").update({status:"lost"}).eq("contract_id",ge.id);if(t)throw t;const{error:e}=await g.from("construction_contracts").update({status:"expired"}).eq("id",ge.id);if(e)throw e;Do(),alert("All bids declined. Contract cancelled."),typeof Ze=="function"&&await Ze()}catch(t){alert("Failed: "+(t.message||t))}finally{cn=!1}}}function ba(){if(document.getElementById("bid-review-overlay")?.remove(),!ge||Vt.length===0)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},o=ge,n=Vt;He>=n.length&&(He=0);const i=n[He],a=Number(o.budget_ceiling||0),r=Number(o.timeline_ticks||36),s=Math.min(...n.map(m=>m.bid_price)),l=Math.max(...n.map(m=>m.estimated_quality||0));let d="";for(let m=0;m<n.length;m++){const v=n[m],b=m===He,y=v.bid_price===s,$=(v.estimated_quality||0)===l,h=v.bid_price>a;d+=`
        <div onclick="reviewSelectBid(${m})" style="padding:10px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${b?e.accent:"transparent"};background:${b?"rgba(139,154,107,0.03)":"transparent"};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.gold}">${v.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${e.text}">${v.corp}</span>
                ${y?`<span style="font-family:${t};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.greenBright};background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2)">CHEAPEST</span>`:""}
                ${$?`<span style="font-family:${t};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.2)">BEST QUALITY</span>`:""}
            </div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};">
                <div style="flex:1.2;padding:5px 10px;border-right:1px solid ${e.border}">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">BID PRICE</div>
                    <div style="font-family:${t};font-size:14px;font-weight:700;color:${h?e.red:e.text}">${_(v.bid_price)}</div>
                    ${h?`<div style="font-family:${t};font-size:7px;color:${e.red}">OVER BUDGET</div>`:""}
                </div>
                <div style="flex:0.8;padding:5px 10px;border-right:1px solid ${e.border};text-align:center">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">QUALITY</div>
                    <div style="font-family:${t};font-size:14px;font-weight:700;color:${(v.estimated_quality||0)>=75?e.greenBright:(v.estimated_quality||0)>=55?e.yellow:e.orange}">${v.estimated_quality||0}</div>
                </div>
                <div style="flex:0.8;padding:5px 10px;text-align:center">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">WORKERS</div>
                    <div style="font-family:${t};font-size:14px;font-weight:700;color:${e.text}">${v.labor_count||0}</div>
                </div>
            </div>
        </div>`}const f=i.bid_price>a,p=a>0?Math.round(i.bid_price/a*100):0,u=document.createElement("div");u.id="bid-review-overlay",u.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",u.addEventListener("click",m=>{m.target===u&&Do()}),u.innerHTML=`
    <div style="width:640px;max-height:92vh;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:10px 16px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:14px;font-weight:700;color:${e.text}">${o.name}</span>
                    <span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 6px;color:${e.gold};background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">YOUR PROJECT</span>
                </div>
                <span onclick="closeBidReview()" style="font-family:${t};font-size:14px;color:${e.dim};cursor:pointer">×</span>
            </div>
            <div style="display:flex;gap:8px;margin-top:4px;font-family:${t};font-size:9px;color:${e.dim};">
                <span>${o.project_code||"—"}</span>
                <span>·</span>
                <span>Budget: <span style="color:${e.text};font-weight:700">${_(a)}</span></span>
                <span>·</span>
                <span>Timeline: <span style="color:${e.text};font-weight:700">${r}mo</span></span>
            </div>
        </div>
        <div style="padding:6px 16px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.gold}">${n.length} BID${n.length!==1?"S":""} RECEIVED</span>
            <div style="display:flex;gap:8px;font-family:${t};font-size:8px;color:${e.dim};">
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
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.gold}">${i.abbr}</span>
                        <span style="font-size:12px;font-weight:700;color:${e.text}">${i.corp}</span>
                    </div>
                    <div style="font-family:${t};font-size:8px;color:${e.dim};margin-top:2px">${i.subsector}</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <span style="font-family:${t};font-size:8px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Breakdown</span>
                </div>
                ${[{l:"Materials",v:Number(i.estimated_cost||0)*.45},{l:"Labor",v:Number(i.estimated_cost||0)*.45},{l:"Overhead",v:Number(i.estimated_cost||0)*.1}].map(m=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${t};font-size:9px;color:${e.dim};text-transform:uppercase">${m.l}</span>
                    <span style="font-family:${t};font-size:10px;color:${e.muted}">${_(Math.round(m.v))}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:${f?"rgba(204,85,85,0.03)":"rgba(200,168,50,0.03)"};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;color:${e.text}">TOTAL BID</span>
                    <span style="font-family:${t};font-size:14px;font-weight:700;color:${f?e.red:e.gold}">${_(i.bid_price)}</span>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">vs. YOUR BUDGET</span>
                        <span style="font-family:${t};font-size:9px;font-weight:700;color:${f?e.red:e.greenBright}">${f?"OVER":"WITHIN"} — ${p}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${e.border}"><div style="width:${Math.min(100,p)}%;height:100%;background:${f?e.red:e.accent}"></div></div>
                </div>
                ${[{l:"Quality",v:i.estimated_quality+"/100",c:(i.estimated_quality||0)>=75?e.greenBright:(i.estimated_quality||0)>=55?e.yellow:e.orange},{l:"Markup",v:i.markup_pct+"%",c:e.muted},{l:"Workers",v:i.labor_count+" workers",c:e.text}].map(m=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${t};font-size:9px;color:${e.dim};text-transform:uppercase">${m.l}</span>
                    <span style="font-family:${t};font-size:10px;font-weight:700;color:${m.c}">${m.v}</span>
                </div>`).join("")}
                <div style="flex:1"></div>
            </div>
        </div>
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">SELECTED BID</div><div style="font-family:${t};font-size:12px;font-weight:700;color:${e.gold}">${_(i.bid_price)}</div></div>
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">CORPORATION</div><div style="font-family:${t};font-size:12px;font-weight:700;color:${e.text}">${i.corp}</div></div>
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${t};font-size:12px;font-weight:700;color:${(i.estimated_quality||0)>=75?e.greenBright:e.yellow}">${i.estimated_quality}</div></div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="declineAllBids()" style="padding:6px 16px;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">DECLINE ALL</div>
                <div onclick="acceptBid()" style="padding:6px 20px;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${e.accent};cursor:pointer">ACCEPT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(u)}const Ke={Coastal:{color:"#8b9a6b",label:"COASTAL"},Container:{color:"#5a7aaa",label:"CONTAINER"},Bulk:{color:"#c8a832",label:"BULK"},Tanker:{color:"#c86a4a",label:"TANKER"},Reefer:{color:"#6a9a5a",label:"REEFER"},LNG:{color:"#c55",label:"LNG"}},El={in_port:{color:"#8b9a6b",label:"IN PORT"},in_transit:{color:"#5a8aaa",label:"IN TRANSIT"},dry_dock:{color:"#c84",label:"DRY DOCK"},anchored:{color:"#ca5",label:"ANCHORED"},for_sale:{color:"#9e9a92",label:"FOR SALE"}};function _a(t){return t>=75?"#5c5":t>=50?"#ca5":t>=25?"#c84":"#c55"}function Cl(t){return t>=60?"#5c5":t>=30?"#ca5":t>=15?"#c84":"#c55"}async function xe(){if(!c)return;const{data:t,error:e}=await g.from("corp_vessels").select("*").eq("faction_id",c.id).order("vessel_class");e&&console.warn("Failed to load fleet:",e.message),fe=t||[],Ft=null;const{data:o,error:n}=await g.from("vessel_orders").select("id, vessel_name, vessel_class, shipyard_nation, ordered_at_tick, delivery_tick, build_ticks, balance_due").eq("faction_id",c.id).eq("status","building").order("delivery_tick",{ascending:!0});n&&console.warn("Failed to load vessel orders:",n.message),ki=o||[],It={},mo={};try{const i=fe.map(a=>a.id);if(i.length>0){const{data:a}=await g.from("finance_active_loans").select("insured_vessel_id").in("insured_vessel_id",i).in("status",["current"]);for(const s of a||[])s.insured_vessel_id&&(It[s.insured_vessel_id]=!0);const{data:r}=await g.from("finance_loan_requests").select("insured_vessel_id").eq("requesting_faction_id",c.id).eq("request_type","insurance").eq("status","open").not("insured_vessel_id","is",null);for(const s of r||[])s.insured_vessel_id&&!It[s.insured_vessel_id]&&(mo[s.insured_vessel_id]=!0)}}catch(i){console.warn("Failed to load vessel insurance status:",i.message)}ha()}function Tl(t){Ft=Ft===t?null:t,ha()}function ha(){const t=document.getElementById("fl-count"),e=document.getElementById("fl-summary"),o=document.getElementById("fl-list"),n=document.getElementById("fl-footer");if(!t||!o)return;const i=fe,a=ki||[],r=a.length;t.textContent=i.length+" VESSEL"+(i.length!==1?"S":"")+(r>0?" · "+r+" BUILDING":"");const s=i.filter(y=>y.status==="in_transit").length,l=i.filter(y=>y.status==="in_port"||y.status==="anchored").length,d=i.filter(y=>y.status==="dry_dock").length,f=i.reduce((y,$)=>y+($.base_maintenance||0),0),p=r>0?[{label:"TRANSIT",value:s,color:"#5a8aaa"},{label:"IN PORT",value:l,color:"#8b9a6b"},{label:"BUILDING",value:r,color:"var(--amber)"},{label:"DRY DOCK",value:d,color:"#c84"},{label:"MAINT/TICK",value:_(f),color:"#a44"}]:[{label:"TRANSIT",value:s,color:"#5a8aaa"},{label:"IN PORT",value:l,color:"#8b9a6b"},{label:"DRY DOCK",value:d,color:"#c84"},{label:"MAINT/TICK",value:_(f),color:"#a44"}];e.innerHTML=p.map((y,$)=>`<div style="flex:1;padding:5px 8px;text-align:center;${$<p.length-1?"border-right:1px solid var(--border-0);":""}">
        <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">${y.label}</div>
        <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${y.color};margin-top:1px;">${y.value}</div>
    </div>`).join("");const u=N?.current_tick||0;let m="";for(const y of a){const $=Math.max(1,Number(y.build_ticks)||1),h=Number(y.delivery_tick)||0,E=Number(y.ordered_at_tick)||0,S=Math.max(0,h-u),z=Math.max(0,Math.min($,u-E)),w=Math.max(0,Math.min(100,Math.round(z/$*100))),I=Ke[y.vessel_class]||{color:"#9e9a92",label:(y.vessel_class||"?").toUpperCase()},A=S===0?"Delivering this tick":`Delivery in ${S} tick${S!==1?"s":""}`;m+=`<div style="border-bottom:1px solid var(--border-0);border-left:2px solid var(--amber);">
            <div style="padding:7px 14px;">
                <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                    <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x(y.vessel_name||"Unnamed Vessel")}</span>
                    <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${I.color};background:${I.color}12;border:1px solid ${I.color}25;">${I.label}</span>
                    <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:var(--amber);background:var(--amber-faint);border:1px solid var(--amber-border);">BUILDING</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:5px;">
                    Shipyard: ${x(y.shipyard_nation||"—")} · ${x(A)} · Balance $${Math.round(Number(y.balance_due)||0).toLocaleString()} due on delivery
                </div>
                <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:2px;">
                    <span>BUILD PROGRESS</span>
                    <span style="color:var(--amber);font-weight:700;">${w}%</span>
                </div>
                <div style="height:5px;background:var(--bg-3);border:1px solid var(--border-0);">
                    <div style="width:${w}%;height:100%;background:var(--amber);transition:width 0.3s;"></div>
                </div>
            </div>
        </div>`}i.length===0&&a.length===0?o.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels in fleet.<br>Purchase ships to begin operations.</div>':i.length===0?o.innerHTML=m:o.innerHTML=m+i.map((y,$)=>{const h=Ft===$,E=Ke[y.vessel_class]||{color:"#666",label:"?"},S=El[y.status]||{color:"#666",label:"?"},z=_a(y.condition),w=Cl(y.fuel),I=y.condition<50||y.fuel<20,A=y.status==="in_transit",k=y.status==="dry_dock",q=N?.current_tick||0,R=Math.max(0,Math.floor((q-(y.built_at_tick||0))/12));let O=`<div onclick="flSelectVessel(${$})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${I?y.condition<50?z:w:"transparent"};background:${h?E.color+"06":"transparent"};">
                <div style="padding:7px 14px;">`;O+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x(y.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${E.color};background:${E.color}12;border:1px solid ${E.color}25;">${E.label}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${S.color};background:${S.color}12;border:1px solid ${S.color}25;">${S.label}</span>
            </div>`;const B=y.current_port_nation_id?"In port":A?"At sea":"—";if(O+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:5px;">${x(B)}</div>`,O+=`<div style="display:flex;gap:8px;margin-bottom:4px;">
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${z};">${y.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${y.condition}%;height:100%;background:${z};"></div></div>
                </div>
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">FUEL</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${w};">${y.fuel}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${y.fuel}%;height:100%;background:${w};"></div></div>
                </div>
            </div>`,O+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);margin-top:1px;">${(y.capacity_dwt||0).toLocaleString()} ${y.capacity_unit||"DWT"}</div>
                </div>
                <div style="flex:0.7;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">AGE</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${R}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#a44;margin-top:1px;">${_(y.base_maintenance)}</div>
                </div>
            </div>`,k&&y.drydock_until_tick){const F=Math.max(0,y.drydock_until_tick-q);O+=`<div style="margin-top:4px;padding:3px 8px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">DRY DOCK REPAIRS</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c84;">${F} tick${F!==1?"s":""} remaining</span>
                </div>`}if(h){O+=`<div style="margin-top:6px;">
                    <div style="padding:5px 8px;background:var(--bg-0);border:1px solid var(--border-0);margin-bottom:6px;">`;const F=[{label:"VESSEL CLASS",value:y.vessel_class},{label:"BUILT",value:"Tick "+(y.built_at_tick||0)},{label:"FUEL CAPACITY",value:(y.fuel_capacity||0).toLocaleString()+" tons"},{label:"LAST REFURBISH",value:y.last_refurbish_tick?"Tick "+y.last_refurbish_tick:"N/A"}];for(let H=0;H<F.length;H++)O+=`<div style="display:flex;justify-content:space-between;padding:2px 0;${H<3?"border-bottom:1px solid var(--border-0);":""}">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${F[H].label}</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);">${F[H].value}</span>
                    </div>`;O+="</div>";const V=A||k,C=Math.round((y.purchase_price||3e6)*.08*(1+(100-y.condition)/100)),T=Math.round((y.fuel_capacity||1e3)*50*(1-y.fuel/100)),j=Math.round((y.purchase_price||3e6)*(y.condition/100)*.6);if(O+=`<div style="display:flex;gap:4px;">
                    <div onclick="${V?"":"flRefurbish('"+y.id+"',"+C+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${V?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${V?"var(--text-dim)":"#5c5"};border:1px solid ${V?"var(--border-0)":"#2a5a3a"};background:${V?"transparent":"rgba(74,170,136,0.06)"};opacity:${V?.35:1};">REFURBISH<br><span style="font-weight:400;font-size:6px;">${_(C)}</span></div>
                    <div onclick="${A?"":"flRefuel('"+y.id+"',"+T+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${A?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${A?"var(--text-dim)":"#c86a4a"};border:1px solid ${A?"var(--border-0)":"rgba(200,106,74,0.3)"};opacity:${A?.35:1};">REFUEL<br><span style="font-weight:400;font-size:6px;">from ${_(T)}</span></div>
                    <div onclick="${V?"":"flSell('"+y.id+"','"+x(y.vessel_name).replace(/'/g,"")+"',"+j+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${V?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${V?"var(--text-dim)":"#c84"};border:1px solid ${V?"var(--border-0)":"rgba(204,136,68,0.3)"};opacity:${V?.35:1};">LIST<br><span style="font-weight:400;font-size:6px;">${_(j)}</span></div>
                </div>`,!A){const H=It&&It[y.id],G=mo&&mo[y.id];O+='<div style="display:flex;gap:4px;margin-top:4px;">',H?O+=`<div style="flex:1;display:flex;gap:2px;">
                            <div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#5c5;border:1px solid rgba(92,204,92,0.2);background:rgba(92,204,92,0.04);">INSURED ✓</div>
                            <div onclick="event.stopPropagation();flFileClaim('${y.id}','${x(y.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#c55;border:1px solid rgba(204,85,85,0.2);background:rgba(204,85,85,0.04);">FILE CLAIM</div>
                        </div>`:G?O+='<div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#ca5;border:1px solid rgba(202,165,50,0.2);background:rgba(202,165,50,0.04);">PENDING ⏳</div>':O+=`<div onclick="event.stopPropagation();flRequestInsurance('${y.id}','${x(y.vessel_name).replace(/'/g,"")}',${y.purchase_price||0})" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#aa7a5a;border:1px solid rgba(170,122,90,0.3);background:rgba(170,122,90,0.04);">INSURE</div>`,O+=`<div onclick="flRename('${y.id}','${x(y.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:var(--text-muted);border:1px solid var(--border-0);">RENAME</div>`,O+="</div>"}A&&(O+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel at sea — actions available on arrival</div>'),k&&(O+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel in dry dock — repairs in progress</div>'),O+="</div>"}return O+="</div></div>",O}).join("");const v={};for(const y of i)v[y.vessel_class]=(v[y.vessel_class]||0)+1;let b='<div style="display:flex;gap:6px;">';for(const[y,$]of Object.entries(Ke))v[y]&&(b+=`<div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:${$.color};border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">${$.label}</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${v[y]}</span>
        </div>`);b+="</div>",b+=`<span style="font-family:var(--font-mono);font-size:8px;color:#a44;">${_(f)}/tick</span>`,n.innerHTML=b}let ae=!1;async function Sl(t,e){if(ae||!c)return;const o=(fe||[]).find(m=>m.id===t);if(!o)return;const n=o.current_port_nation_id||null;let i="state",a=3,r=3,s=null,l="State Dry Dock (3x cost, 3 ticks)";if(n){const{data:m}=await g.from("corp_properties").select("id").eq("faction_id",c.id).eq("nation_id",n).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();if(m)i="own",a=1,r=2,l="Your Dry Dock (base cost, 2 ticks)";else{const{data:v}=await g.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",c.id).eq("nation_id",n).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();v&&(i="other",a=1.2,r=2,s=v.faction_id,l=(v.factions?.faction_name||"Another corp")+"'s Dry Dock (+20%, 2 ticks)")}}else l="State Dry Dock (3x cost, 3 ticks) — no private dock in port";const d=Math.round(e*a),{data:f}=await g.from("factions").select("corp_cash_reserves").eq("id",c.id).single(),p=Number(f?.corp_cash_reserves??0);if(p<d){alert("Insufficient cash. Need "+_(d)+", have "+_(p)+".");return}if(!confirm("Send "+(o.vessel_name||"vessel")+` to dry dock?

Dock: `+l+`
Cost: `+_(d)+`
Duration: `+r+` ticks
Condition restored to 85-100%.`))return;ae=!0;const u=N?.current_tick||0;try{const{error:m}=await g.from("factions").update({corp_cash_reserves:p-d}).eq("id",c.id);if(m){alert("Failed: "+m.message);return}if(i==="other"&&s){const b=d-e,{data:y}=await g.from("factions").select("corp_cash_reserves").eq("id",s).single();y&&await g.from("factions").update({corp_cash_reserves:Number(y.corp_cash_reserves||0)+b}).eq("id",s)}const{error:v}=await g.from("corp_vessels").update({status:"dry_dock",drydock_until_tick:u+r,active_claim_id:null}).eq("id",t);if(v){await g.from("factions").update({corp_cash_reserves:p}).eq("id",c.id),alert("Failed: "+v.message);return}c.corp_cash_reserves=p-d,await xe()}catch(m){alert("Dry dock failed: "+(m.message||"Error"))}finally{ae=!1}}async function zl(t,e){if(ae||!c)return;if(e<=0){alert("Fuel tanks are already full.");return}const o=(fe||[]).find(p=>p.id===t);if(!o)return;const n=o.current_port_nation_id||c.nation_id;let i="state",a=3,r=null,s="State Fuel (3x cost) — no private depot in port";if(n){const{data:p}=await g.from("corp_properties").select("id").eq("faction_id",c.id).eq("nation_id",n).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(p)i="own",a=1,s="Your Fuel Depot (base cost)";else{const{data:u}=await g.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",c.id).eq("nation_id",n).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();u&&(i="other",a=1.15,r=u.faction_id,s=(u.factions?.faction_name||"Another corp")+"'s Fuel Depot (+15%)")}}const l=Math.round(e*a),{data:d}=await g.from("factions").select("corp_cash_reserves").eq("id",c.id).single(),f=Number(d?.corp_cash_reserves??0);if(f<l){alert("Insufficient cash. Need "+_(l)+", have "+_(f)+".");return}if(confirm("Refuel "+(o.vessel_name||"vessel")+`?

Source: `+s+`
Cost: `+_(l)+`
Fuel restored to 100%.`)){ae=!0;try{const{error:p}=await g.from("factions").update({corp_cash_reserves:f-l}).eq("id",c.id);if(p){alert("Failed: "+p.message);return}if(i==="other"&&r){const m=l-e,{data:v}=await g.from("factions").select("corp_cash_reserves").eq("id",r).single();v&&await g.from("factions").update({corp_cash_reserves:Number(v.corp_cash_reserves||0)+m}).eq("id",r)}const{error:u}=await g.from("corp_vessels").update({fuel:100}).eq("id",t);if(u){await g.from("factions").update({corp_cash_reserves:f}).eq("id",c.id),alert("Failed: "+u.message);return}c.corp_cash_reserves=f-l,await xe()}catch(p){alert("Refuel failed: "+(p.message||"Error"))}finally{ae=!1}}}async function Il(t,e,o){if(ae||!c||!N||!confirm("List "+e+" on the Ship Market for "+_(o)+`?

The vessel will be removed from your fleet and listed for sale. You will receive payment when another corporation purchases it.`))return;ae=!0;const n=N.current_tick||0,i=fe.find(l=>l.id===t);if(!i){ae=!1;return}const a=Math.max(0,n-(i.built_at_tick||0)),{error:r}=await g.from("ship_market_listings").insert({nation_id:c.nation_id,vessel_name:i.vessel_name,vessel_class:i.vessel_class,capacity_dwt:i.capacity_dwt,capacity_unit:i.capacity_unit,condition:i.condition,fuel:i.fuel,age_ticks:a,fuel_capacity:i.fuel_capacity,base_maintenance:i.base_maintenance,asking_price:o,purchase_price_new:i.purchase_price||o,seller_type:"CORP",seller_name:c.faction_name,seller_faction_id:c.id,sale_reason:"Listed for sale by "+(c.faction_name||"corporation"),status:"available",listed_at_tick:n});if(r){alert("Failed to create listing: "+r.message),ae=!1;return}const{error:s}=await g.from("corp_vessels").delete().eq("id",t);if(s){await g.from("ship_market_listings").delete().eq("seller_faction_id",c.id).eq("vessel_name",i.vessel_name).eq("listed_at_tick",n),alert("Failed to remove vessel: "+s.message),ae=!1;return}ae=!1,Ft=null,await Promise.all([xe(),oi()])}async function Nl(t,e){const o=prompt("Rename vessel:",e);if(!o||o.trim()===e||o.trim().length<2)return;const{error:n}=await g.from("corp_vessels").update({vessel_name:o.trim().slice(0,40)}).eq("id",t);if(n){alert("Failed: "+n.message);return}await xe()}async function Ml(t,e,o){if(!c||!N||!confirm("Request insurance for "+e+`?

Insurance corporations will see this in their Deal Flow and can offer coverage terms.

Vessel value: `+_(o)))return;const n=N.current_tick||0,{error:i}=await g.from("finance_loan_requests").insert({requesting_faction_id:c.id,nation_id:c.nation_id,request_type:"insurance",insured_vessel_id:t,amount:o,term_months:0,purpose:"Vessel Insurance — "+e,status:"open",created_tick:n,expires_tick:n+12});if(i){i.message.includes("duplicate")||i.message.includes("unique")?alert("Insurance already requested for this vessel."):alert("Failed to request insurance: "+i.message);return}alert(`Insurance request posted to Deal Flow.

Insurance corporations can now offer coverage for `+e+"."),await xe()}let pn=!1;async function Al(t,e){if(pn||!c||!N)return;const o=prompt(`Describe the claim reason:

e.g., "Storm damage during transit — hull breach repaired at sea" or "Engine failure requiring emergency dry dock"`);if(!o||o.trim().length<5)return;const n=N.current_tick||0,{data:i}=await g.from("finance_active_loans").select("id, lender_faction_id, principal, deductible_pct").eq("insured_vessel_id",t).eq("status","current").limit(1).maybeSingle();if(!i){alert("No active insurance policy found for this vessel.");return}const a=Number(i.principal||0),r=Number(i.deductible_pct||10),s=Math.round(a*r/100);if(!confirm("File insurance claim for "+e+`?

Coverage: `+_(a)+`
Deductible: `+r+"% ("+_(s)+`)

Reason: `+o.trim()+`

The insurer will review this claim and determine the payout.`))return;pn=!0;const{error:l}=await g.from("event_log").insert({nation_id:c.nation_id,faction_id:c.id,event_name:(c.faction_name||"Corporation")+" — Insurance Claim Filed",description_used:(c.faction_name||"A shipping corporation")+" has filed an insurance claim for vessel "+e+". Reason: "+o.trim().replace(/[<>"]/g,""),category:"business",trigger_key:"vessel_insurance_claim",effects_applied:{vessel_id:t,vessel_name:e,policy_id:i.id,insurer_faction_id:i.lender_faction_id,coverage:a,deductible_pct:r,claim_reason:o.trim()},fired_at_tick:n});l&&console.warn("Failed to log insurance claim event:",l.message);const{error:d}=await g.from("finance_active_loans").update({claims_paid:(i.claims_paid||0)+1}).eq("id",i.id);d&&console.warn("Failed to update claims_paid:",d.message),pn=!1,alert("Insurance claim filed for "+e+`.

The insurer (`+_(a)+" coverage) has been notified. Claim details are visible in the events feed.")}window.flRequestInsurance=Ml;window.flFileClaim=Al;const Sn={fuel_depot:{label:"FUEL DEPOT",color:"#c86a4a",icon:"⛽",desc:"Bunkering facility — refuel at base cost, earn revenue from visiting fleets."},dry_dock:{label:"DRY DOCK",color:"#c84",icon:"🔧",desc:"Repair & maintenance dock — dock at base cost, earn revenue from visiting fleets."}},Rl=[{type:"fuel_depot",name:"Fuel Depot — Standard",cost:105e6,maint:85e3,style:"Basic",desc:"Bulk fuel storage and bunkering facility."},{type:"fuel_depot",name:"Fuel Depot — Advanced",cost:14e7,maint:11e4,style:"Modern",desc:"High-capacity fuel terminal with pipeline infrastructure."},{type:"dry_dock",name:"Dry Dock — Standard",cost:85e6,maint:15e4,style:"Basic",desc:"Ship repair and maintenance facility."},{type:"dry_dock",name:"Dry Dock — Advanced",cost:115e6,maint:2e5,style:"Modern",desc:"Full-service shipyard with drydock and crane facilities."}];let ko=[];async function $a(){if(!c)return;const{data:t}=await g.from("corp_properties").select("*, nations!nation_id(name)").eq("faction_id",c.id).in("type",["fuel_depot","dry_dock"]).eq("is_active",!0).order("created_at",{ascending:!1});ko=t||[],Ll()}function Ll(){const t=document.getElementById("pf-count"),e=document.getElementById("pf-list"),o=document.getElementById("pf-footer");if(!t||!e||!o)return;const n=ko;if(t.textContent=n.length+" FACILIT"+(n.length===1?"Y":"IES"),n.length===0)e.innerHTML=`<div style="padding:20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-bottom:6px;">No port facilities built.</div>
            <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Build a <span style="color:#c86a4a;font-weight:700;">Fuel Depot</span> to refuel your fleet at base cost<br>and earn revenue from other corps refueling here.<br>Build a <span style="color:#c84;font-weight:700;">Dry Dock</span> to repair vessels at base cost.</div>
        </div>`;else{let r=0;e.innerHTML=n.map(s=>{const l=Sn[s.type]||Sn.fuel_depot,d=s.condition>=75?"#5c5":s.condition>=50?"#ca5":"#c84";return r+=Number(s.monthly_maintenance||0),`<div style="padding:8px 12px;border-bottom:1px solid var(--border-0);">
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
            </div>`}).join("")}Number(c?.corp_cash_reserves??0);const i=n.some(r=>r.type==="fuel_depot"),a=n.some(r=>r.type==="dry_dock");o.innerHTML=`
        <div onclick="pfOpenBuild('fuel_depot')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c86a4a;border:1px solid rgba(200,106,74,0.3);background:rgba(200,106,74,0.04);">
            ${i?"+ FUEL DEPOT":"BUILD FUEL DEPOT"}
        </div>
        <div onclick="pfOpenBuild('dry_dock')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c84;border:1px solid rgba(204,136,68,0.3);background:rgba(204,136,68,0.04);">
            ${a?"+ DRY DOCK":"BUILD DRY DOCK"}
        </div>`}let fn=!1;async function ql(t){if(fn||!c||!N)return;const e=Rl.filter(y=>y.type===t);if(e.length===0)return;const o=Sn[t],n=c.nation_id,i=M?.name||c?.nation||"Home Nation",a=M?.capital||"Port City",r=[{id:n,name:i,capital:a,label:"National HQ"}],{data:s}=await g.from("corp_properties").select("nation_id, name, city, nations!nation_id(name, capital)").eq("faction_id",c.id).eq("type","regional_hq").eq("is_active",!0);for(const y of s||[])y.nation_id!==n&&r.push({id:y.nation_id,name:y.nations?.name||y.city||"Unknown",capital:y.nations?.capital||y.city||"Port City",label:y.name||"Subsidiary"});let l=r[0];if(r.length>1){let y=o.label+` — SELECT LOCATION
`+"─".repeat(30)+`
`;y+=`Build in which nation?

`;for(let E=0;E<r.length;E++){const S=r[E],z=ko.filter(w=>w.type===t&&w.nation_id===S.id).length;y+=E+1+". "+S.name+"  ("+S.label+")",z>0&&(y+="  ["+z+" existing]"),y+=`
`}y+=`
Enter number (or cancel):`;const $=prompt(y);if(!$)return;const h=parseInt($,10)-1;if(isNaN(h)||h<0||h>=r.length){alert("Invalid selection.");return}l=r[h]}const d=ko.filter(y=>y.type===t&&y.nation_id===l.id).length;let f=o.label+" CONSTRUCTION — "+l.name.toUpperCase()+`
`+"─".repeat(30)+`
`;d>0&&(f+="You already have "+d+" "+o.label.toLowerCase()+(d>1?"s":"")+` here.

`),f+=o.desc+`

`;for(let y=0;y<e.length;y++){const $=e[y];f+=y+1+". "+$.name+`
`,f+="   Cost: "+_($.cost)+" · Maint: "+_($.maint)+`/tick
`,f+="   "+$.desc+`

`}f+="Enter 1 or 2 to select (or cancel):";const p=prompt(f);if(!p)return;const u=parseInt(p,10)-1;if(isNaN(u)||u<0||u>=e.length){alert("Invalid selection.");return}const m=e[u];if(!confirm("Commission "+m.name+" in "+l.capital+", "+l.name+`?

Budget: `+_(m.cost)+`

This will create a construction contract that construction corporations can bid on. Payment occurs when the contract is awarded.`))return;fn=!0;const v=N.current_tick||0,b=(N.current_date||"").match(/\d{4}/)?.[0]||"2015";try{const{count:y}=await g.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",l.id).eq("issuer_type","PRIVATE"),h=`PVT-P${(y||0)+1}-${b}`,E=m.style==="Modern",S={concrete:E?60:40,steel:E?50:30,heavy_parts:E?30:20,aggregate:E?30:20},z={trucks:5,mixers:5,excavators:5},w={general:E?240:160,skilled:E?100:60},I=E?6:4,{error:A}=await g.from("construction_contracts").insert({nation_id:l.id,template_key:t,sector:"industrial",name:m.name,project_type:o.label,project_subtype:m.style,description:`${m.name} at ${l.capital} Port — commissioned by ${c.faction_name}. ${m.desc}`,project_code:h,budget_ceiling:m.cost,timeline_ticks:I,required_materials:S,required_equipment:z,required_workforce:w,status:"open",generated_at_tick:v,bidding_ends_tick:v+3,issuer_type:"PRIVATE",issuer_name:c.faction_name,issuer_faction_id:c.id});if(A)throw A;await $a(),alert(`Construction contract posted!

Project: `+m.name+`
Location: `+l.capital+", "+l.name+`
Code: `+h+`
Budget: `+_(m.cost)+`
Timeline: `+I+` ticks

Construction corporations in `+l.name+" can now bid on this project.")}catch(y){alert("Failed to post contract: "+(y.message||"Error"))}finally{fn=!1}}window.pfOpenBuild=ql;const ti={"Bulk Cargo":["Reefer","Bulk","Coastal"],"Container Freight":["Coastal","Container"],"Specialized Transport":["Tanker","LNG","Bulk"]};async function oi(){if(!c)return;const{data:t,error:e}=await g.from("ship_market_listings").select("*, nation:nation_id(id, name)").eq("status","available").order("asking_price",{ascending:!0});e&&console.warn("Failed to load ship market:",e.message),Mn=t||[],uo=null,wa()}function Ol(t){uo=uo===t?null:t,wa()}function Bl(t){return(ti[c?.corp_subsector]||[]).includes(t)}function wa(){const t=document.getElementById("sm-count"),e=document.getElementById("sm-list"),o=document.getElementById("sm-footer");if(!t||!e)return;const n=Mn;t.textContent=n.length+" AVAILABLE",n.length===0?e.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels on the market.<br>Check back next cycle.</div>':e.innerHTML=n.map((r,s)=>{const l=uo===s,d=Ke[r.vessel_class]||{color:"#666",label:"?"},f=r.seller_type==="CORP"?"#5a8aaa":"#8b9a6b",p=_a(r.condition),u=r.nation?.name||"—",m=Bl(r.vessel_class);N?.current_tick;const v=r.age_ticks||0,b=Math.max(1,Math.floor(v/12)),y=u!==c?.nation?Number(c?.tariffs||M?.tariffs||0):0,$=Math.round(r.asking_price*y/100),h=r.asking_price+$;let E=`<div onclick="smSelectListing(${s})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${l?d.color:"transparent"};background:${l?d.color+"06":"transparent"};">
                <div style="padding:8px 14px;">`;return E+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x(r.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${d.color};background:${d.color}12;border:1px solid ${d.color}25;">${d.label}</span>
            </div>`,E+=`<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;">
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${f};background:${f}12;border:1px solid ${f}25;">${r.seller_type}</span>
                <span style="font-size:9px;color:var(--text-muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${x(r.seller_name||"—")}</span>
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;">${u.toUpperCase().slice(0,6)}</span>
                ${y>0?`<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">+${y}%</span>`:""}
            </div>`,E+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
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
            </div>`,l&&(E+='<div style="margin-top:6px;">',E+=`<div style="padding:4px 8px;margin-bottom:5px;background:var(--bg-0);border:1px solid var(--border-0);">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0);">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CARRIES</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${d.color};">${(Ke[r.vessel_class]||{}).label||"?"} class cargo</span>
                    </div>
                    <div style="padding:3px 0;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:1px;">REASON FOR SALE</div>
                        <div style="font-size:9px;color:var(--text-muted);line-height:1.4;">${x(r.sale_reason||"—")}</div>
                    </div>
                </div>`,E+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                    <div style="width:40px;height:3px;background:var(--border-0);"><div style="width:${r.condition}%;height:100%;background:${p};"></div></div>
                    ${r.condition<60?'<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">May need dry dock</span>':""}
                </div>`,y>0&&(E+=`<div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:8px;margin-bottom:3px;">
                        <span style="color:var(--text-dim);">Import tariff (${y}%)</span>
                        <span style="color:#c84;">+${_($)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;margin-bottom:5px;">
                        <span style="color:var(--text-bright);">TOTAL</span>
                        <span style="color:var(--gold);">${_(h)}</span>
                    </div>`),m?E+=`<div onclick="event.stopPropagation();smPurchase('${r.id}',${h})" style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${d.color};cursor:pointer;">${_(h)} — PURCHASE</div>`:E+=`<div style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:var(--text-dim);border:1px solid var(--border-0);opacity:0.4;">⊘ ${r.vessel_class} not available for ${c?.corp_subsector||"your subsector"}</div>`,E+="</div>"),E+="</div></div>",E}).join("");const i=n.filter(r=>r.seller_type==="CORP").length,a=n.filter(r=>r.seller_type==="LOCAL").length;o.innerHTML=`<div style="display:flex;gap:6px;">
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
    <div onclick="smOpenCommission()" style="padding:4px 14px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--gold);border:1px solid rgba(200,168,50,0.3);cursor:pointer;">COMMISSION VESSEL</div>`}let lt=!1;async function Pl(t,e){if(lt||!c||!N)return;const o=Number(c.corp_cash_reserves??0);if(o<e){alert("Insufficient cash. Need "+_(e)+".");return}if(!confirm("Purchase this vessel for "+_(e)+"?"))return;lt=!0;const n=Mn.find(f=>f.id===t);if(!n){lt=!1;return}const i=N.current_tick||0,a=po[n.vessel_class]||po.Coastal,{error:r}=await g.from("factions").update({corp_cash_reserves:o-e}).eq("id",c.id);if(r){alert("Failed: "+r.message),lt=!1;return}const{error:s}=await g.from("corp_vessels").insert({faction_id:c.id,nation_id:c.nation_id,vessel_name:n.vessel_name,vessel_class:n.vessel_class,condition:n.condition,fuel:n.fuel||50,status:"in_port",capacity_dwt:n.capacity_dwt||a.capacity_dwt,capacity_unit:n.capacity_unit||a.capacity_unit,base_maintenance:n.base_maintenance||a.base_maintenance,fuel_capacity:n.fuel_capacity||a.fuel_capacity,purchase_price:e,built_at_tick:i-(n.age_ticks||0),current_port_nation_id:c.nation_id});if(s){await g.from("factions").update({corp_cash_reserves:o}).eq("id",c.id),alert("Failed to create vessel: "+s.message),lt=!1;return}var{error:l}=await g.from("ship_market_listings").update({status:"sold",purchased_by:c.id,purchased_at_tick:i}).eq("id",t);if(l&&console.warn("Failed to mark listing as sold:",l.message),n.seller_faction_id){const{data:f}=await g.from("factions").select("corp_cash_reserves").eq("id",n.seller_faction_id).single();if(f){var{error:d}=await g.from("factions").update({corp_cash_reserves:Number(f.corp_cash_reserves||0)+n.asking_price}).eq("id",n.seller_faction_id);d&&console.warn("Failed to credit seller:",d.message)}}c.corp_cash_reserves=o-e,lt=!1,await Promise.all([xe(),oi()])}const Ot=[{cls:"Coastal",baseCost:12e6,baseBuild:3,cargo:"Bulk, Containers (coastal)"},{cls:"Container",baseCost:65e6,baseBuild:5,cargo:"Manufactured, Tech, General"},{cls:"Bulk",baseCost:38e6,baseBuild:4,cargo:"Minerals, Aggregate, Military"},{cls:"Tanker",baseCost:52e6,baseBuild:5,cargo:"Fuel, Petroleum, Chemicals"},{cls:"Reefer",baseCost:45e6,baseBuild:4,cargo:"Food, Perishables, Agriculture"},{cls:"LNG",baseCost:78e6,baseBuild:6,cargo:"Liquefied Natural Gas only"}];let ce="Coastal",Gt=0,Wt="",Je=[];function Dl(){ce=(ti[c?.corp_subsector]||["Coastal"])[0],Gt=0,Wt="",Je=[],document.getElementById("comm-overlay").style.display="flex",jl()}async function jl(){const{data:t}=await g.from("nations").select("id, name, manufacturing_output, physical_infrastructure, tariffs").order("name");Je=(t||[]).map(e=>{const o=Number(e.manufacturing_output??50),n=Math.round((.75+o/100*.5)*100)/100,i=Math.round((1.5-o/100*.65)*100)/100,a=e.id===c?.nation_id;return{id:e.id,name:e.name,mfg:o,costMod:n,buildMod:i,isHome:a,tariffs:Number(e.tariffs??0)}}),Je.sort((e,o)=>(o.isHome?1:0)-(e.isHome?1:0)),ni()}function ka(){document.getElementById("comm-overlay").style.display="none"}function Fl(t){ce=t,ni()}function Ul(t){Gt=t,ni()}function Hl(t){Wt=t}function ni(){const t=document.getElementById("comm-content");if(!t)return;const e=N?.current_tick||0,o=Ot.find(v=>v.cls===ce)||Ot[0],n=Je[Gt]||{name:"—",costMod:1,buildMod:1},i=Ke[ce]||{color:"#666"},a=Math.round(o.baseCost*n.costMod),r=Math.max(2,Math.round(o.baseBuild*n.buildMod)),s=Math.round(a*.5),l=a-s,d=e+r,f=ti[c?.corp_subsector]||[];let p="";p+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:#c8a832;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Commission Vessel</span>
            </div>
            <span onclick="smCloseCommission()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
    </div>`,p+='<div style="flex:1;overflow-y:auto;">',p+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Vessel Type</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">`;for(const v of Ot){const b=Ke[v.cls]||{color:"#666",label:"?"},y=ce===v.cls,$=f.includes(v.cls);p+=`<div onclick="${$?"commSetClass('"+v.cls+"')":""}" style="padding:5px 4px;text-align:center;cursor:${$?"pointer":"not-allowed"};background:${y?b.color+"18":"transparent"};border:1px solid ${y?b.color+"44":"var(--panel-border)"};opacity:${$?1:.3};">
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${y?b.color:"#6a6660"};">${b.label}</div>
            <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;margin-top:2px;">${_(v.baseCost)} base</div>
        </div>`}p+="</div>",p+=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:${i.color};">${o.cargo}</div>`,p+="</div>",p+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Origin Shipyard</div>`;for(let v=0;v<Je.length;v++){const b=Je[v],y=Gt===v,$=b.costMod>1?"#c84":b.costMod<1?"#5c5":"#6a6660",h=b.buildMod>1?"#c84":b.buildMod<1?"#5c5":"#6a6660";p+=`<div onclick="commSetNation(${v})" style="display:flex;align-items:center;padding:5px 8px;margin-bottom:2px;cursor:pointer;background:${y?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${y?"#8b9a6b44":"var(--panel-border)"};border-left:2px solid ${y?"#8b9a6b":"transparent"};">
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
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:6px 10px;">`;const u=[{label:"VESSEL CLASS",value:ce,color:i.color},{label:"SHIPYARD",value:n.name,color:"#9e9a92"},{label:"BASE COST",value:_(o.baseCost)+" × "+n.costMod.toFixed(2),color:"#9e9a92"},{label:"BUILD TIME",value:r+" ticks",color:r>o.baseBuild?"#c84":r<o.baseBuild?"#5c5":"#9e9a92"},{label:"COMPLETION",value:"~Tick "+d,color:"#9e9a92"}];for(const v of u)p+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
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
            <div style="font-size:9px;color:#6a6660;line-height:1.5;">50% deposit due immediately. Remaining 50% due on delivery at tick ${d}. Vessel delivered at 100% condition, fully fueled, to your nearest port. Cancellation forfeits deposit.</div>
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
    </div>`,t.innerHTML=p}let St=!1;async function Vl(){if(St||!c||!N)return;const t=Wt.trim();if(t.length<2)return;const e=Ot.find(b=>b.cls===ce)||Ot[0],o=Je[Gt];if(!o)return;const n=Math.round(e.baseCost*o.costMod),i=Math.max(2,Math.round(e.baseBuild*o.buildMod)),a=Math.round(n*.5),r=n-a,s=N.current_tick||0,l=Number(c.corp_cash_reserves??0);if(l<a){alert("Insufficient cash for deposit. Need "+_(a)+".");return}if(!confirm("Commission "+ce+" from "+o.name+`?

Deposit: `+_(a)+` (non-refundable)
Balance: `+_(r)+" on delivery at tick "+(s+i)))return;St=!0;const d=document.getElementById("comm-order-btn");d&&(d.style.opacity="0.4",d.style.pointerEvents="none");const{error:f}=await g.from("factions").update({corp_cash_reserves:l-a}).eq("id",c.id);if(f){alert("Failed: "+f.message),St=!1;return}const{data:p}=await g.from("nations").select("budget_reserves").eq("id",o.id).single();if(p){var{error:u}=await g.from("nations").update({budget_reserves:Number(p.budget_reserves||0)+a}).eq("id",o.id);u&&console.warn("Failed to credit shipyard nation budget:",u.message)}const m=po[ce]||po.Coastal,{error:v}=await g.from("vessel_orders").insert({faction_id:c.id,vessel_name:t,vessel_class:ce,capacity_dwt:m.capacity_dwt,capacity_unit:m.capacity_unit,base_maintenance:m.base_maintenance,fuel_capacity:m.fuel_capacity,purchase_price:e.baseCost,shipyard_nation_id:o.id,shipyard_nation:o.name,cost_modifier:o.costMod,build_modifier:o.buildMod,total_cost:n,deposit_paid:a,balance_due:r,ordered_at_tick:s,delivery_tick:s+i,build_ticks:i,status:"building"});if(v){await g.from("factions").update({corp_cash_reserves:l}).eq("id",c.id),alert("Failed to place order: "+v.message),St=!1;return}c.corp_cash_reserves=l-a,St=!1,ka(),alert(t+` commissioned!

Class: `+ce+`
Shipyard: `+o.name+`
Deposit: `+_(a)+`
Delivery: Tick `+(s+i))}window.smSelectListing=Ol;window.smPurchase=Pl;window.smOpenCommission=Dl;window.smCloseCommission=ka;window.commSetClass=Fl;window.commSetNation=Ul;window.commSetName=Hl;window.smPlaceOrder=Vl;window.flSelectVessel=Tl;window.flRefurbish=Sl;window.flRefuel=zl;window.flSell=Il;window.flRename=Nl;window.openBidReview=hl;window.closeBidReview=Do;window.reviewSelectBid=$l;window.acceptBid=wl;window.declineAllBids=kl;window.switchToActions=Vi;window.actSelectExec=Cs;window.actExecute=ps;window.confirmFireExec=ds;window.actOpenStatement=Qi;window.actCloseStatement=Wn;window.actSubmitStatement=fs;window.actDeclareBankruptcy=Ki;window.actOpenRestructure=ea;window.actCloseRestructure=Yn;window.actSubmitRestructure=hs;window.actOpenRebrand=ta;window.actCloseRebrand=Qn;window.actSubmitRebrand=$s;window.actOpenDonation=oa;window.actCloseDonation=Kn;window.actSubmitDonation=Es;window.donateSelectParty=ks;window.lrOpen=Xi;window.lrClose=Zi;window.lrSubmit=_s;window.lrSetAmount=vs;window.lrSetPurpose=ys;window.lrSetTerm=gs;window.lrSetCollateral=xs;window.openExecSearch=Ts;window.closeExecSearch=ia;window.esSelectCandidate=Ss;window.esHireCandidate=zs;window.switchToExpansion=Ui;window.switchToOperations=Hi;window.hfSetChange=Is;window.hfReset=Ns;window.hfConfirm=Ms;document.addEventListener("click",function(t){const e=t.target.closest(".corp-nav-tab[href]:not([data-tab-action])");if(!e)return;const o=e.getAttribute("href");if(!o)return;const n=new URL(o,window.location.href);n.pathname!==window.location.pathname||n.searchParams.get("tab")||e.classList.contains("active")||(t.preventDefault(),Hi(t))});os();
