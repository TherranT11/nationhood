const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-CPI0igZM.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as g}from"./supabase-client-qEAQbBjE.js";/* empty css                    *//* empty css                         */import{c as Ce,i as ho,M as Je,Q as ti,a as ii,b as Ft,d as Li,e as zi}from"./corp-auto-services-BIIzQFak.js";import{_ as $o}from"./preload-helper-BXl3LOEh.js";import{escapeHtml as y,hfFmtBig as E}from"./utils-A98FEun4.js";import{initMessaging as wo}from"./messaging-hdfDukBE.js";import{c as ko,a as Ut,E as Xe,b as yt,d as Ri,e as Eo,f as To,h as Ii}from"./equipment-DsuDdEne.js";import{l as Co,a as Io}from"./corp-shipping-data-DA_tOdLs.js";import{V as rt}from"./vessels-CjafVZ4G.js";import{SECTOR_OPS_PAGE as Oi}from"./corp-topbar-CPI0igZM.js";import{r as Ht,c as Pi,M as Di,a as So}from"./shipping-CQiz46tZ.js";import"./loan-math-Q4nHfU_i.js";let he=[],f=null,R=null,M=null,De=[],He={},Q=[],J={},Vt=-1;const qo={em:"em_systems",glass:"glass_facades",heavy:"heavy_parts"},lt=t=>qo[t]||t;let ne="concrete",K="STD",fe=500,ie=[],Bi={},Gt=0,ji=[];async function Ao(){if(!f?.id)return;const{data:t}=await g.from("corp_properties").select("*").eq("faction_id",f.id).eq("is_active",!0);ji=t||[]}let oe=[],Fi=[],Ze=null,Ge={},dt={},oi=[],ct=null,se="trucks",ve=0,ue=1,$e=[],Ie=null,Ui=[],Wt=null,nt=null,Yt="ALL",Qt="TIMELINE";function S(t){return Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(1)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(0)+"k":"$"+t}function Mo(t){if(t>=12){const e=Math.floor(t/12),i=t%12;return i>0?e+"y "+i+"mo":e+"y"}return t+" ticks"}function Hi(t){return!t||t.length===0?"":t.map(e=>{const i=Bi[e];if(!i)return"";const o=i.reputation_bonus>0?"var(--green)":i.reputation_bonus<0?"var(--red)":"var(--text-dim)",a=i.reputation_bonus>0?"+"+i.reputation_bonus:i.reputation_bonus<0?String(i.reputation_bonus):"";return`<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background: var(--border-hair);border:1px solid var(--border-0);border-radius:3px;font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">${i.icon||"📍"} ${y(i.name)}${a?` <span style="color:${o};font-weight:700;">${a} REP</span>`:""}</span>`}).filter(Boolean).join(" ")}function re(t){return Math.abs(t)>=1e9?"$"+(t/1e9).toFixed(1)+"B":Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(0)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(0)+"k":"$"+t}function ai(t){return t==="civil_engineering"?"CIVIL":t==="industrial"?"INDUSTRIAL":t==="mega_project"?"MEGA":t?.toUpperCase()||"—"}function Vi(t){return t==="civil_engineering"?"light":t==="industrial"?"heavy":t==="mega_project"?"mega":"light"}function No(){nt&&clearInterval(nt),nt=setInterval(()=>{if(!Wt)return;const t=Wt-Date.now();if(t<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(nt);return}const e=Math.floor(t/36e5),i=Math.floor(t%36e5/6e4),o=Math.floor(t%6e4/1e3);document.getElementById("tick-countdown").textContent=e+"h "+i+"m "+o+"s"},1e3)}function Lo(t,e){t==="type"&&(Yt=e),t==="sort"&&(Qt=e),document.querySelectorAll(`.filter-pill[data-filter="${t}"]`).forEach(i=>{i.classList.toggle("active",i.dataset.value===e)}),Wi()}const Si={"Civil Engineering":"civil_engineering","Industrial Construction":"industrial",Megaprojects:"mega_project"};function Gi(t){if(!f)return!1;if(Si[f.corp_subsector]===t.sector)return!0;const i=(ji||[]).filter(o=>o.type==="regional_hq"&&o.is_active&&o.nation_id===t.nation_id);for(const o of i)if(Si[o.subsector]===t.sector)return!0;return!1}function Wi(){const t=document.getElementById("oc-list");let e=[...De];if(Yt==="GOVERNMENT"?e=e.filter(a=>a.issuer_type==="GOVERNMENT"):Yt==="PRIVATE"&&(e=e.filter(a=>a.issuer_type==="PRIVATE")),Qt==="TIMELINE"&&e.sort((a,s)=>(a.timeline_ticks||0)-(s.timeline_ticks||0)),Qt==="BUDGET"&&e.sort((a,s)=>(s.budget_ceiling||0)-(a.budget_ceiling||0)),document.getElementById("oc-count").textContent=e.length+" AVAILABLE",e.length===0){t.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const i=M?.current_tick||0;let o="";for(const a of e){const s=a.issuer_type==="GOVERNMENT",r=s?"gov":"private",n=Gi(a),l=n?"":" locked",c=Vi(a.sector),v=ai(a.sector),d=(a.timeline_ticks||0)>18?" warn":"",m=a.bidding_ends_tick?Math.max(0,a.bidding_ends_tick-i):"?";o+=`
            <div class="oc-item${l}" data-contract-id="${a.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${y(a.name)}</span>
                    <span class="oc-item__type-badge ${r}">${s?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${r}">${y(a.issuer_name||"—")}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${m} tick${m!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${re(a.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${d}">${Mo(a.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${c}">${v}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${He[a.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${re(He[a.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${n?"yes":"no"}">${n?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${n?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openContractDetail(contracts.find(x=>x.id==='${a.id}'))">VIEW</button>`:""}
                </div>
                ${a.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${y(a.description)}</div>`:""}
                ${a.modifiers&&a.modifiers.length>0?`<div style="display:flex;flex-wrap:wrap;gap:3px;padding:4px 0 0;">${Hi(a.modifiers)}</div>`:""}
            </div>`}t.innerHTML=o,t.querySelectorAll(".oc-item:not(.locked)").forEach(a=>{a.addEventListener("click",()=>{const s=a.dataset.contractId,r=De.find(n=>n.id===s);r&&Yi(r)})})}let Se=null;function Yi(t){Se=t;const e=document.getElementById("cd-overlay"),i=t.issuer_type==="GOVERNMENT",o=i?"gov":"private",a=(R?.name||f.nation||"—").toUpperCase(),s=Gi(t);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${y(a)}</span>
        <span class="cd-header__name">${y(t.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${o}">${y(t.issuer_name)}</span>
        <span class="cd-header__type-badge ${o}">${i?"GOV":"PRIVATE"}</span>
    `;const r=document.getElementById("cd-blueprint");t.blueprint_svg?(r.innerHTML=t.blueprint_svg,r.style.display=""):(r.innerHTML=Jo(t),r.style.display="");const n=t.permits_required||[],l=t.required_equipment||t.equipment_required||{},c=Array.isArray(l)?l.map(w=>({key:w,qty:1})):Object.entries(l).map(([w,A])=>({key:w,qty:A})),v=t.required_materials||t.materials_estimated||{},m={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[t.sector]||t.spec_category||t.sector||"—";let u="var(--teal)";t.sector==="industrial"&&(u="var(--orange)"),t.sector==="mega_project"&&(u="var(--red)");let _=S(t.budget_ceiling||t.budget||0),b=(t.timeline_ticks||t.timeline_months||0)+" Months",p="";p+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${y(t.project_code||t.contract_number||"")}</span>
            </div>
            <div class="cd-issue__tags">
                ${t.project_type?`<span class="cd-tag teal">${y(t.project_type.toUpperCase())}</span>`:""}
                ${t.project_subtype?`<span class="cd-tag gold">${y(t.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,t.description&&(p+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${y(t.description)}</div>
            </div>`);const h=t.modifiers||[];if(h.length>0){p+=`<div class="cd-items">
            <div class="cd-section-label">Building Modifiers</div>
            <div style="display:flex;flex-direction:column;gap:6px;">`;for(const w of h){const A=Bi[w];if(!A)continue;const B=A.reputation_bonus>0?"var(--green)":A.reputation_bonus<0?"var(--red)":"var(--text-dim)",H=A.cost_multiplier>1?"+"+Math.round((A.cost_multiplier-1)*100)+"% cost":A.cost_multiplier<1?Math.round((1-A.cost_multiplier)*100)+"% cheaper":"",X=A.reputation_bonus!==0?(A.reputation_bonus>0?"+":"")+A.reputation_bonus+" rep":"",ce=A.required_permits||[];p+=`<div style="padding:6px 10px;background: var(--border-hair);border:1px solid var(--border-hair);border-radius:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:600;font-size:0.78rem;color:var(--text-primary);">${A.icon||"📍"} ${y(A.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;">
                        ${H?`<span style="color:var(--amber);">${H}</span>`:""}
                        ${H&&X?" · ":""}
                        ${X?`<span style="color:${B};font-weight:700;">${X}</span>`:""}
                    </span>
                </div>
                <div style="font-size:0.65rem;color:var(--text-dim);margin-top:2px;">${y(A.description||"")}</div>
                ${ce.length>0?`<div style="font-size:0.6rem;color:var(--amber);margin-top:3px;font-family:var(--font-mono);">Requires permits: ${ce.map(V=>y(V.replace(/_/g," "))).join(", ")}</div>`:""}
            </div>`}p+="</div></div>"}p+='<div class="cd-details">',t.project_type&&(p+=be("Type",t.project_type)),t.project_subtype&&(p+=be("Sub-Type",t.project_subtype)),p+=be("Specialization",m,u),p+=be("Total Budget",_,"var(--green)"),p+=be("Timeline",b),p+=be("Nation",R?.name||f.nation||"—"),t.region&&(p+=be("Region",t.region)),p+="</div>",n.length>0&&(p+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${n.map(w=>{const A=w.status==="approved"?"approved":"required",B=w.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${A}">
                            <span class="cd-chip__icon">${B}</span>
                            <span class="cd-chip__label">${y(w.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),v.length>0&&(p+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${v.map(w=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${y(w.name)}</span>
                        <span class="cd-mat-row__qty">${y(String(w.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=p;const x=n.filter(w=>w.status==="approved").length,k=n.length-x,C=c.length,T=[];for(const w of c){const A=ie.find(B=>B.equipment_key===w.key);A&&A.owned>=w.qty||T.push(w)}const $=T.length,I=t.required_materials||{},N=typeof I=="object"&&!Array.isArray(I)?Object.entries(I):[],q=[];for(const[w,A]of N){const B=J[w]||{},H=(B.LOW?.qty||0)+(B.STD?.qty||0)+(B.HIGH?.qty||0);H<A&&q.push({key:w,need:A,have:H})}const j=w=>w.replace(/_/g," ").replace(/\b\w/g,A=>A.toUpperCase());let P="";if(C>0)if($===0)P+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>';else{const w=T.map(A=>j(A.key)).join(", ");P+=`<span class="cd-footer__badge bad" title="${y(w)}">${$} SHORT: ${y(w)}</span>`}if(N.length>0)if(q.length===0)P+='<span class="cd-footer__badge ok">ALL MATERIALS MET</span>';else{const w=q.map(A=>j(A.key)+" ("+A.have+"/"+A.need+")").join(", ");P+=`<span class="cd-footer__badge bad" title="${y(w)}">${q.length} MAT SHORT: ${y(w)}</span>`}n.length>0&&(k===0?P+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':P+=`<span class="cd-footer__badge warn">${k} PERMITS PENDING</span>`);const L=s,z=t.issuer_faction_id===f?.id,F=t.status==="bidding",U=He[t.id];document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${P}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${z?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${F?"":"disabled"} title="${F?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:U?`<button class="cd-btn primary" onclick="retractBid('${t.id}')" style="background:#c55;border-color:#c55;"
                        title="Retract your bid ($1M penalty)">RETRACT BID</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${L?"":"disabled"}
                        title="${L?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,e.classList.add("open"),document.body.style.overflow="hidden"}function ot(t){t&&t.target&&t.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",Se=null)}const ke=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],qi={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},Ai={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let O=null;async function Re(t){const e=Q.find(w=>w.id===t);if(!e)return;const i=Array.isArray(e.contract_bids)?e.contract_bids[0]:e.contract_bids,o=M?.current_tick||0,a=e.awarded_at_tick||o,s=e.timeline_ticks||8,r=Math.max(0,o-a),n=Math.min(100,r/s*100);let l=Math.min(ke.length-1,Math.floor(n/(100/ke.length)));const c=Math.round(n%(100/ke.length)/(100/ke.length)*100),v=e.required_materials||{},d=i?.material_grades||{};let m=[];try{const{data:w}=await g.from("project_material_allocations").select("material_key, quality_tier, quantity, consumed").eq("contract_id",e.id);m=w||[]}catch{}const u={};for(const w of m)u[w.material_key]||(u[w.material_key]={totalAllocated:0,totalConsumed:0,tiers:{}}),u[w.material_key].totalAllocated+=w.quantity,u[w.material_key].totalConsumed+=w.consumed,u[w.material_key].tiers[w.quality_tier]={qty:w.quantity,consumed:w.consumed};const _=Object.entries(v).map(([w,A])=>{const B=d[w]||"STD",H=u[w]||{totalAllocated:0,totalConsumed:0,tiers:{}};return{key:w,name:w.replace(/_/g," ").replace(/\b\w/g,X=>X.toUpperCase()),grade:B,required:Number(A),allocated:H.totalAllocated,consumed:H.totalConsumed,tiers:H.tiers,warehouseStock:J[w]||{}}}),b=e.required_equipment||{},p=e.equipment_condition||{},x=(Array.isArray(b)?b.map(w=>[w,1]):Object.entries(b)).map(([w,A])=>{const B=ie.find(V=>V.equipment_key===w),X=(B?.assigned_projects||[]).find(V=>V.contract_id===e.id),ce=X?X.units:0;return{key:w,name:w.replace(/_/g," ").replace(/\b\w/g,V=>V.toUpperCase()),required:Number(A)||1,ownedTotal:B?.owned||0,deployed:B?.deployed||0,available:Math.max(0,(B?.owned||0)-(B?.deployed||0)),assignedToProject:ce,condition:p[w]??(B?.condition||100)}}),k=e.budget_ceiling||0,C=i?.estimated_cost||0,T=Math.round(C*Math.min(1,r/s)),$=i?.estimated_quality||65,I=$>=75?"EXCELLENT":$>=50?"FAIR":$>=25?"POOR":"BAD",N=e.required_workforce||{},q=e.workers_assigned||{},j=(N.general||0)+(N.skilled||0)+(N.innovative||0),P=(q.general||0)+(q.skilled||0)+(q.innovative||0),L=i?.labor_count||j,z=Number(f?.corp_general_workforce??0),F=Number(f?.corp_skilled_workforce??0),U=Number(f?.corp_innovative_workforce??0);O={project:e,bid:i,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:o,awardedTick:a,totalTicks:s,ticksElapsed:r,phaseIdx:l,phaseProgress:c,materials:_,equipment:x,budget:k,estCost:C,spent:T,quality:$,qualityLabel:I,laborCount:L,wfNeeded:j,wfAssigned:P,reqWf:N,assignedWf:q,corpGeneral:z,corpSkilled:F,corpInnovative:U,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",Qi(e.id).then(()=>Ne()),Ne()}let G=!1;async function zo(t,e,i){if(!(G||!O||!f)){G=!0;try{const{data:o,error:a}=await g.rpc("allocate_material_to_project",{p_contract_id:O.project.id,p_faction_id:f.id,p_material_key:t,p_quality_tier:e,p_quantity:i});if(a){alert("Allocation failed: "+a.message);return}if(o&&!o.success){alert(o.error||"Allocation failed");return}await Ji(),await Re(O.project.id)}catch(o){alert("Allocation error: "+o.message)}finally{G=!1}}}async function Ro(t,e,i){if(!(G||!O||!f)){G=!0;try{const{data:o,error:a}=await g.rpc("deallocate_material_from_project",{p_contract_id:O.project.id,p_faction_id:f.id,p_material_key:t,p_quality_tier:e,p_quantity:i});if(a){alert("Return failed: "+a.message);return}if(o&&!o.success){alert(o.error||"Return failed");return}await Ji(),await Re(O.project.id)}catch(o){alert("Return error: "+o.message)}finally{G=!1}}}async function Oo(t,e){if(!(G||!O||!f)){G=!0;try{const i=O.project,o=i.workers_assigned||{},a=Number(o[t]||0),s=Number((i.required_workforce||{})[t]||0),r=Number(f?.["corp_"+t+"_workforce"]??0);let n=0;for(const u of Q||[])u.id!==i.id&&(n+=Number((u.workers_assigned||{})[t]||0));const l=Math.max(0,r-n-a),c=Math.min(e,s-a,l);if(c<=0){alert(l<=0?"No "+t+" workers available in pool":"Already fully staffed for "+t);return}const v={...o,[t]:a+c},{error:d}=await g.from("construction_contracts").update({workers_assigned:v}).eq("id",i.id);if(d){alert("Assign failed: "+d.message);return}const m=Q.find(u=>u.id===i.id);m&&(m.workers_assigned=v),await Re(i.id)}catch(i){alert("Assign error: "+i.message)}finally{G=!1}}}async function Po(t,e){if(!(G||!O||!f)){G=!0;try{const i=O.project,o=i.workers_assigned||{},a=Number(o[t]||0),s=Math.min(e,a);if(s<=0){alert("No "+t+" assigned");return}const r={...o,[t]:a-s},{error:n}=await g.from("construction_contracts").update({workers_assigned:r}).eq("id",i.id);if(n){alert("Unassign failed: "+n.message);return}const l=Q.find(c=>c.id===i.id);l&&(l.workers_assigned=r),await Re(i.id)}catch(i){alert("Unassign error: "+i.message)}finally{G=!1}}}async function Do(t,e){if(!(G||!O||!f)){G=!0;try{const i=ie.find(l=>l.equipment_key===t);if(!i){alert("Equipment not found in inventory.");return}const o=Math.max(0,(i.owned||0)-(i.deployed||0));if(o<e){alert("Not enough available "+t+" ("+o+" available).");return}const a=(i.deployed||0)+e,s=[...i.assigned_projects||[]],r=s.find(l=>l.contract_id===O.project.id);r?r.units+=e:s.push({contract_id:O.project.id,contract_name:O.project.name,units:e});const{error:n}=await g.from("corp_equipment").update({deployed:a,assigned_projects:s}).eq("faction_id",f.id).eq("equipment_key",i.equipment_key);if(n){alert("Deploy failed: "+n.message);return}await no(),await Re(O.project.id)}catch(i){alert("Deploy error: "+i.message)}finally{G=!1}}}async function Bo(t){if(!(G||!O||!f)){G=!0;try{const e=ie.find(n=>n.equipment_key===t);if(!e){alert("Equipment not found.");return}const i=[...e.assigned_projects||[]],o=i.findIndex(n=>n.contract_id===O.project.id);if(o===-1){alert("Equipment not deployed to this project.");return}const a=i[o].units;i.splice(o,1);const s=Math.max(0,(e.deployed||0)-a),{error:r}=await g.from("corp_equipment").update({deployed:s,assigned_projects:i}).eq("faction_id",f.id).eq("equipment_key",e.equipment_key);if(r){alert("Undeploy failed: "+r.message);return}await no(),await Re(O.project.id)}catch(e){alert("Undeploy error: "+e.message)}finally{G=!1}}}function jo(t){t&&t.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",O=null)}function Fo(t){O&&(O.tab=t,O.expandedEvent=-1,O.selectedResponse=null,Ne())}function Uo(t){O&&(O.expandedEvent=O.expandedEvent===t?-1:t,O.selectedResponse=null,Ne())}function Ho(t){O&&(O.selectedResponse=O.selectedResponse===t?null:t,Ne())}function Ne(){if(!O)return;const t=O,e=t.project,i=e.issuer_type==="GOVERNMENT",o=ai(e.sector),a=f?.nation||"Nation",s=t.awardedTick+t.totalTicks,r=Math.max(0,s-t.currentTick),n=t.currentTick>s,l=t.budget>0?Math.round(t.spent/t.budget*100):0,c=l>85?"var(--red)":l>60?"var(--amber)":"var(--teal)",v=t.budget-t.spent,d=t.events.filter(p=>p.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${y(a.toUpperCase())}</span>
                <span class="pm-hdr__name">${y(e.name)}</span>
                <span style="color:var(--text-dim);font-size:12px">—</span>
                <span class="pm-hdr__issuer">${y(e.issuer_name||"—")}</span>
                <span class="pm-hdr__type">${i?"GOV":"PVT"}</span>
            </div>
            <button class="pm-hdr__close" onclick="closeProjectModal()">×</button>
        </div>
        <div class="pm-hdr__row2">
            <span class="pm-hdr__id">${y(e.template_key||e.id)}</span>
            <span class="pm-hdr__badge pm-hdr__badge--spec">${y(o.toUpperCase())}</span>
            <span class="pm-hdr__badge pm-hdr__badge--sub">${y((e.sector||"").replace(/_/g," ").toUpperCase())}</span>
        </div>
    `;let m='<div class="pm-phase__bar">';for(let p=0;p<ke.length;p++){const h=p<t.phaseIdx,x=p===t.phaseIdx;m+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${h?"done":x?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${h?"done":x?"active":""}">${ke[p]}</span>
        </div>`}m+="</div>",m+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${ke[t.phaseIdx]} — ${t.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${n?"var(--red)":"var(--text-secondary)"}">Tick ${t.ticksElapsed} / ${t.totalTicks}${n?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=m;const u=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:d},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=u.map(p=>`<button class="pm-tab${t.tab===p.id?" active":""}" onclick="pmSetTab('${p.id}')">
            ${p.label}${p.badge>0?`<span class="pm-tab__badge">${p.badge}</span>`:""}
        </button>`).join("");let _="";t.tab==="overview"?_=Vo(t,e,c,l,v,r,n):t.tab==="events"?_=Go(t):t.tab==="materials"?_=Wo(t):t.tab==="equipment"&&(_=Yo(t)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${_}</div>`;let b="";d>0&&(b+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${d} EVENT${d>1?"S":""} REQUIRES RESPONSE</span>`),b+=`<span class="pm-ftr__badge" style="color:${t.quality>=75?"var(--green)":t.quality>=50?"var(--amber)":t.quality>=25?"var(--orange)":"var(--red)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${t.quality}/100 — ${t.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${b}</div>
        <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
    `}function Vo(t,e,i,o,a,s,r){const n=Ee(t.awardedTick+t.totalTicks);Ee(t.awardedTick+t.totalTicks);const l=Ee(t.awardedTick),c=[{label:"Budget",value:re(t.budget),sub:`${o}% spent`,color:i},{label:"Spent",value:re(t.spent),color:"var(--red)"},{label:"Remaining",value:re(a),color:"var(--green)"},{label:"Quality",value:`${t.quality}/100`,sub:t.qualityLabel,color:t.quality>=75?"var(--green)":t.quality>=50?"var(--amber)":t.quality>=25?"var(--orange)":"var(--red)"},{label:"Workforce",value:`${t.laborCount}/${t.wfNeeded}`,sub:`Bid: ${t.laborCount}`,color:t.laborCount<t.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${s} ticks`,sub:r?"OVERDUE":`Deadline: ${n}`,color:r?"var(--red)":"var(--text-bright)"}];let v="";v+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${y(e.description||e.name)}</div>
    </div></div>`,v+='<div class="pm-metrics">';for(const p of c)v+=`<div class="pm-metric">
            <div class="pm-metric__label">${p.label}</div>
            <div class="pm-metric__value" style="color:${p.color}">${p.value}</div>
            ${p.sub?`<div class="pm-metric__sub">${y(p.sub)}</div>`:""}
        </div>`;v+="</div>",v+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${l}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${r?"var(--red)":"var(--text-bright)"};font-weight:700">${n}</span></span>
        </div>
    </div></div>`;const d=e.modifiers||[];d.length>0&&(v+='<div style="padding:0 16px"><div class="pm-section">',v+='<div class="pm-section__title">Building Modifiers</div>',v+='<div style="display:flex;flex-wrap:wrap;gap:4px;">',v+=Hi(d),v+="</div></div></div>");const m=[];if((e.sector==="civil_engineering"||e.sector==="industrial"||e.sector==="mega_project")&&(m.push({name:"Municipal Zoning Approval",status:"ACTIVE"}),m.push({name:"Structural Engineering Cert.",status:"ACTIVE"}),e.sector!=="civil_engineering"&&m.push({name:"Environmental Impact Assessment",status:"ACTIVE"})),m.length>0){v+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const p of m)v+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:var(--green)">✓</span>
                    <span class="pm-permit__name">${y(p.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:var(--green)">ACTIVE</span>
            </div>`;v+="</div></div>"}v+='<div style="padding:0 16px"><div class="pm-section">',v+='<div class="pm-section__title">Workforce Assignment</div>';const u=[{key:"general",label:"General Workers",corpAvail:t.corpGeneral,color:"var(--text-primary)"},{key:"skilled",label:"Skilled Workers",corpAvail:t.corpSkilled,color:"var(--blue)"},{key:"innovative",label:"Innovative Workers",corpAvail:t.corpInnovative,color:"var(--purple)"}];for(const p of u){const h=Number(t.reqWf[p.key]||0);if(h===0)continue;const x=Number(t.assignedWf[p.key]||0),C=x>=h?"var(--green)":x>0?"var(--amber)":"var(--red)",T=p.corpAvail>0&&x<h,$=Math.min(p.corpAvail,h-x),I=x>0;v+='<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-hair);font-size:0.72rem;">',v+="<div>",v+=`<span style="color:${p.color};font-weight:600;">${p.label}</span>`,v+=`<span style="color:var(--text-dim);margin-left:8px;">Required: <strong>${h}</strong></span>`,v+=`<span style="color:${C};margin-left:8px;font-weight:700;">${x} assigned</span>`,v+=`<span style="color:var(--text-dim);margin-left:8px;">Pool: ${p.corpAvail}</span>`,v+="</div>",v+='<div style="display:flex;gap:4px;">',T&&(v+=`<button onclick="pmAssignWorkers('${p.key}',${$})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Assign ${$}</button>`),I&&(v+=`<button onclick="pmUnassignWorkers('${p.key}',${x})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Remove ${x}</button>`),v+="</div></div>"}const _=Number(t.reqWf.general||0)+Number(t.reqWf.skilled||0)+Number(t.reqWf.innovative||0),b=Number(t.assignedWf.general||0)+Number(t.assignedWf.skilled||0)+Number(t.assignedWf.innovative||0);return _>0&&b<_&&(v+='<div style="font-size:0.62rem;color:var(--red);margin-top:6px;font-family:var(--font-mono);">⚠ Project will STALL until workforce is fully assigned</div>'),v+="</div></div>",v}function Go(t){if(t.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let e="";for(let i=0;i<t.events.length;i++){const o=t.events[i],a=t.expandedEvent===i,s=o.status==="ACTIVE",r=qi[o.type]||qi.WEATHER,n=Ai[o.severity]||Ai.LOW;if(e+=`<div class="pm-evt ${s?"pm-evt--active":"pm-evt--resolved"}" style="${s?`border-left-color:${r.color}`:""}">`,e+=`<div class="pm-evt__header" onclick="pmToggleEvent(${i})" style="${a?`background:${r.bg}`:""}">`,e+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${r.color};background:${r.bg};border:1px solid ${r.border}">${o.type}</span>
            <span class="pm-evt__sev-badge" style="color:${n}">${o.severity}</span>
            <span class="pm-evt__status" style="color:${s?"var(--red)":"var(--text-dim)"};font-weight:${s?"700":"400"}">${s?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,e+=`<div class="pm-evt__title">${y(o.title)}</div>`,e+=`<div class="pm-evt__meta">Tick ${o.tick} · ${y(o.id||"")}</div>`,a){if(e+='<div class="pm-evt__body">',e+=`<div class="pm-evt__desc">${y(o.desc)}</div>`,o.impact&&(e+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${y(o.impact)}</span>
                </div>`),s&&o.responses&&o.responses.length>0){e+='<div class="pm-evt__resp-title">Response Options</div>';for(let l=0;l<o.responses.length;l++){const c=o.responses[l],v=t.selectedResponse===l,m={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[c.tag]||"var(--text-secondary)";e+=`<div class="pm-resp${v?" selected":""}" style="${v?`border-color:${m}`:""}" onclick="event.stopPropagation();pmSelectResponse(${l})">`,e+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${y(c.label)}</span>
                            <span class="pm-resp__tag" style="color:${m};background:${m}12;border:1px solid ${m}25">${c.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${c.delay>0?"var(--orange)":"var(--green)"}">
                            ${c.delay>0?`+${c.delay} tick${c.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,e+=`<div class="pm-resp__detail">${y(c.detail)}</div>`,e+='<div class="pm-resp__costs">',c.cost&&(e+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${re(c.cost)}</span>`),c.qualityImpact&&c.qualityImpact!==0&&(e+=`<span class="pm-resp__cost" style="color:${c.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${c.qualityImpact>0?"+":""}${c.qualityImpact}</span>`),!c.cost&&(!c.qualityImpact||c.qualityImpact===0)&&(e+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),e+="</div>",v&&(e+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${m}" onclick="event.stopPropagation();confirmEventResponse('${o.id}','${c.key}')">CONFIRM</button>
                        </div>`),e+="</div>"}}!s&&o.resolution&&(e+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${y(o.resolution)}</div>
                </div>`),e+="</div>"}e+="</div></div>"}return e}function Wo(t){if(t.materials.length===0)return'<div class="pm-evt-empty">No materials required for this project.</div>';let e='<div class="pm-tab-header">Project Materials</div>';for(const i of t.materials){const o=i.required>0?Math.round(i.allocated/i.required*100):0;i.allocated>0&&Math.round(i.consumed/i.allocated*100);const a=i.allocated>=i.required,s=a?"var(--green)":i.allocated>0?"var(--amber)":"var(--red)",r=a?"FULLY ALLOCATED":i.allocated>0?"PARTIAL":"NONE ALLOCATED";e+='<div class="pm-mat" style="margin-bottom:14px;">',e+=`<div class="pm-mat__row1">
            <div class="pm-mat__left">
                <span class="pm-mat__name">${y(i.name)}</span>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:${s};">${i.allocated} / ${i.required} allocated · ${r}</span>
        </div>`,e+=`<div class="pm-mat__bar-row">
            <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${o}%;background:${s};"></div></div>
            <span class="pm-mat__pct">${i.consumed} consumed</span>
        </div>`;const n=["STD","LOW","HIGH"],l=i.required-i.allocated;for(const c of n){const v=i.warehouseStock[c]||{qty:0},d=i.tiers[c]||{qty:0,consumed:0},m=d.qty-d.consumed;if(v.qty===0&&d.qty===0)continue;const u=c==="HIGH"?"var(--green)":c==="LOW"?"var(--orange)":"var(--text-muted)",_=c==="HIGH"?"HIGH":c==="LOW"?"LOW":"STD";if(e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border-hair);font-size:0.7rem;">',e+='<div style="display:flex;align-items:center;gap:6px;">',e+=`<span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${u};width:32px;">${_}</span>`,e+=`<span style="color:var(--text-dim);">Warehouse: <strong style="color:var(--text-primary);">${v.qty}</strong></span>`,d.qty>0&&(e+=`<span style="color:var(--text-dim);margin-left:8px;">Allocated: <strong style="color:var(--text-primary);">${d.qty}</strong></span>`),e+="</div>",e+='<div style="display:flex;gap:4px;">',v.qty>0&&l>0){const b=Math.min(v.qty,l);e+=`<button class="pm-alloc-btn" onclick="pmAllocateMaterial('${i.key}','${c}',${b})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Allocate ${b}</button>`}m>0&&(e+=`<button class="pm-alloc-btn" onclick="pmDeallocateMaterial('${i.key}','${c}',${m})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Return ${m}</button>`),e+="</div></div>"}e+="</div>"}return e}function Yo(t){if(t.equipment.length===0)return'<div class="pm-evt-empty">No equipment required for this project.</div>';let e='<div class="pm-tab-header">Project Equipment</div>';for(const i of t.equipment){const o=i.condition>=75?"var(--green)":i.condition>=50?"var(--amber)":i.condition>=25?"var(--orange)":"var(--red)",a=i.assignedToProject>=i.required,s=i.assignedToProject>0&&i.assignedToProject<i.required,r=a?"var(--green)":s||i.ownedTotal>0?"var(--amber)":"var(--red)",n=a?`${i.assignedToProject}/${i.required} DEPLOYED`:s?`${i.assignedToProject}/${i.required} PARTIAL`:i.ownedTotal>0?"NOT DEPLOYED":"NOT OWNED";e+=`<div class="pm-eq" style="margin-bottom:12px;">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${y(i.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${r};margin-left:8px;">${n}</span>
                </div>
            </div>`,i.assignedToProject>0&&(e+=`<div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${i.condition}%;background:${o}"></div></div>
                <span class="pm-eq__cond-val" style="color:${o}">${i.condition}%</span>
            </div>`);const l=Math.min(i.available,i.required-i.assignedToProject);e+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:0.7rem;">',e+=`<span style="color:var(--text-dim);">Required: <strong style="color:${a?"var(--green)":"var(--red)"}">${i.required}</strong>`,e+=` · Owned: <strong style="color:var(--text-primary);">${i.ownedTotal}</strong>`,e+=` · Available: <strong style="color:var(--text-primary);">${i.available}</strong></span>`,e+='<div style="display:flex;gap:4px;">',l>0&&(e+=`<button onclick="pmDeployEquipment('${i.key}',${l})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Deploy ${l}</button>`),i.assignedToProject>0&&(e+=`<button onclick="pmUndeployEquipment('${i.key}')" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Undeploy</button>`),e+="</div></div>",e+="</div>"}return e}function Ee(t){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][t%12]}, ${2e3+Math.floor(t/12)}`}async function Qo(t,e){if(!f||!M)return;const i=prompt(`REQUEST CONSTRUCTION INSURANCE
`+"─".repeat(35)+`

Describe what this policy should cover:

e.g., "Full coverage for weather delays, material damage, and labor disputes during construction. Should cover cost overruns up to 20% of budget."

Insurance corps will see this in their Deal Flow.`);if(i===null)return;const o=i.trim()||"Construction Insurance",a=M.current_tick||0,{error:s}=await g.from("finance_loan_requests").insert({requesting_faction_id:f.id,nation_id:f.nation_id,request_type:"insurance",insured_contract_id:t,amount:e,term_months:0,purpose:o,status:"open",created_tick:a,expires_tick:a+12});if(s){s.message.includes("duplicate")||s.message.includes("unique")?alert("Insurance already requested for this project."):alert("Failed to request insurance: "+s.message);return}alert("Insurance request posted to Deal Flow. Insurance corporations can now offer coverage."),await Ki()}window.requestInsurance=Qo;window.openProjectModal=Re;window.closeProjectModal=jo;window.pmSetTab=Fo;window.pmToggleEvent=Uo;window.pmSelectResponse=Ho;window.pmAllocateMaterial=zo;window.pmDeallocateMaterial=Ro;window.pmDeployEquipment=Do;window.pmUndeployEquipment=Bo;window.pmAssignWorkers=Oo;window.pmUnassignWorkers=Po;async function Qi(t){if(!O)return;const{data:e,error:i}=await g.from("construction_events").select("*").eq("contract_id",t).order("fired_at_tick",{ascending:!1});i?(console.warn("Failed to load project events:",i.message),O.events=[]):O.events=(e||[]).map(o=>({id:o.id,type:o.type,severity:o.severity,tick:o.fired_at_tick,title:o.title,desc:o.description,impact:o.impact,status:o.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:o.resolution,responses:o.responses||[]})),Ne()}let It=!1;async function Ko(t,e){if(!(It||!O)){It=!0;try{const{data:i,error:o}=await g.rpc("resolve_construction_event",{p_event_id:t,p_response_key:e});if(o){console.error("Failed to resolve event:",o.message),alert("Failed to submit response: "+o.message);return}const a=typeof i=="string"?JSON.parse(i):i;if(a?.error){alert("Error: "+a.error);return}await Qi(O.project.id),await Ki(),a?.quality_applied&&a.quality_applied!==0&&(O.quality=Math.max(0,Math.min(100,O.quality+a.quality_applied)),O.qualityLabel=O.quality>=75?"EXCELLENT":O.quality>=50?"FAIR":O.quality>=25?"POOR":"BAD"),Ne()}finally{It=!1}}}window.confirmEventResponse=Ko;function be(t,e,i){const o=i?` style="color:${i}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${y(t)}</span>
        <span class="cd-detail-row__value"${o}>${y(e)}</span>
    </div>`}function Jo(t){const e={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},i=t.drawing_number||t.contract_number+"-A1",o=M?.current_date||"",a=o?o.replace(/,\s*/," "):"",s=t.spec_category==="Heavy Infrastructure",r=t.spec_category==="Megaproject";let n=y(t.project_subtype||t.project_type||"STRUCTURE"),l=s?"80.0m":r?"200.0m":"60.0m",c=s?"40.0m":r?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${e.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(v,d)=>`<line x1="${d*20}" y1="0" x2="${d*20}" y2="200" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(v,d)=>`<line x1="0" y1="${d*20}" x2="680" y2="${d*20}" stroke="${e.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${e.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${e.accent}" font-family="var(--font-mono)" font-weight="700">${n.toUpperCase()}</text>
        <text x="340" y="100" text-anchor="middle" font-size="6" fill="${e.text}" font-family="var(--font-mono)">${y(t.name)}</text>

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
        <text x="540" y="175" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${y(i)}</text>
        <text x="500" y="185" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">SCALE</text>
        <text x="540" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">1:200</text>
        <text x="610" y="175" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">REV</text>
        <text x="630" y="175" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">01</text>
        <text x="610" y="185" font-size="5" fill="${e.dim}" font-family="var(--font-mono)">DATE</text>
        <text x="630" y="185" font-size="5.5" fill="${e.accent}" font-family="var(--font-mono)">${y(a)}</text>

        <!-- North arrow -->
        <g transform="translate(470,172)">
            <line x1="0" y1="12" x2="0" y2="0" stroke="${e.accent}" stroke-width="0.8"/>
            <polygon points="-3,4 0,0 3,4" fill="${e.accent}"/>
            <text x="0" y="-3" text-anchor="middle" font-size="5" fill="${e.text}" font-family="var(--font-mono)">N</text>
        </g>
    </svg>`}async function Le(){if(!f||!f.nation_id)return;const{data:t,error:e}=await g.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(e)console.warn("Failed to load contracts:",e.message),De=[];else{const i=Number(f.corp_reputation??0);De=(t||[]).filter(o=>i>=(o.min_reputation||0))}if(He={},f&&De.length>0){const i=De.map(a=>a.id),{data:o}=await g.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",f.id).in("contract_id",i);for(const a of o||[])He[a.contract_id]=a}Wi()}function Xo(){const t=document.getElementById("ap-list"),e=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=Q.length+" ACTIVE",Q.length===0){t.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,e.style.display="none";return}const i=M?.current_tick||0;let o=0,a=0,s="";for(const r of Q){const n=r.issuer_type==="GOVERNMENT",l=n?"gov":"private",c=Array.isArray(r.contract_bids)?r.contract_bids[0]:r.contract_bids,v=c?.bid_price||0,d=c?.estimated_cost||0,m=c?.estimated_quality||0,u=r.budget_ceiling||0,_=r.awarded_at_tick||i,b=r.stalled_ticks||0,p=Math.max(0,i-_),h=Math.max(0,p-b),x=r.timeline_ticks||8,k=Math.max(0,x-h),C=Math.min(100,Math.round(h/x*100)),T=h>x,$=b>0;let I="";if($){const q=r.required_workforce||{},j=r.workers_assigned||{},P=[];(Number(j.general)||0)<(Number(q.general)||0)&&P.push("General: "+(Number(j.general)||0)+"/"+(Number(q.general)||0)),(Number(j.skilled)||0)<(Number(q.skilled)||0)&&P.push("Skilled: "+(Number(j.skilled)||0)+"/"+(Number(q.skilled)||0)),(Number(j.innovative)||0)<(Number(q.innovative)||0)&&P.push("Innovative: "+(Number(j.innovative)||0)+"/"+(Number(q.innovative)||0)),P.length>0?I="Workers needed — "+P.join(", "):I="Materials needed — allocate from warehouse"}Vi(r.sector);const N=ai(r.sector);o+=u,a+=v,s+=`<div class="ap-item" onclick="openProjectModal('${r.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${y(r.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${y(r.issuer_name||"—")} · ${N}</div>
                </div>
                <span class="oc-item__type-badge ${l}">${n?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS${$?' <span style="color:var(--orange);font-weight:700;font-size:7px;">⚠ STALLED ('+b+" ticks) — "+y(I)+"</span>":""}</span>
                    <span class="ap-budget__values" style="color:${T?"var(--red)":$?"var(--orange)":"var(--teal)"}">
                        ${h}/${x} ticks ${T?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${C}%;background:${T?"var(--red)":$?"var(--orange)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${re(v)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${re(d)}</div>
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
                    ${r._hasInsurance?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--green);">INSURED</div>':r._insurancePending?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--orange);">PENDING</div>':`<div class="ap-detail-cell__value" style="font-size:8px;cursor:pointer;color:#aa7a5a;font-weight:700;text-decoration:underline;" onclick="event.stopPropagation();requestInsurance('${r.id}',${u})">INSURE</div>`}
                </div>
            </div>
        </div>`}t.innerHTML=s,e.style.display=Q.length>0?"":"none",Q.length>0&&(document.getElementById("ap-total-crew").textContent=Q.length,document.getElementById("ap-total-budget").textContent=re(o),document.getElementById("ap-total-spent").textContent=re(a))}async function Ki(){if(!f)return;const{data:t,error:e}=await g.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",f.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",f.id).order("awarded_at_tick",{ascending:!0});if(e?(console.warn("Failed to load active projects:",e.message),Q=[]):Q=t||[],Q.length>0){const i=Q.map(n=>n.id),{data:o}=await g.from("finance_loan_requests").select("insured_contract_id, status").eq("request_type","insurance").in("insured_contract_id",i),{data:a}=await g.from("finance_active_loans").select("request_id, finance_loan_requests!inner(insured_contract_id)").in("status",["current"]).eq("finance_loan_requests.request_type","insurance"),s=new Set((a||[]).map(n=>n.finance_loan_requests?.insured_contract_id).filter(Boolean)),r=new Set((o||[]).filter(n=>n.status==="open").map(n=>n.insured_contract_id));for(const n of Q)n._hasInsurance=s.has(n.id),n._insurancePending=r.has(n.id)}Xo()}const gt=3e4;function _t(){let t=0,e=0;for(const i of Je)for(const o of ti){const a=J[i.key]?.[o];a&&(t+=a.qty,e+=a.value)}return{totalUnits:t,totalValue:e}}function ni(){const t=document.getElementById("wh-list"),{totalUnits:e,totalValue:i}=_t();document.getElementById("wh-count").textContent=e.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=S(i);const o=Math.round(e/gt*100),a=document.getElementById("wh-capacity");a.textContent=o+"%",a.style.color=o>80?"var(--red)":o>50?"var(--orange)":"var(--green)";let s="";for(let r=0;r<Je.length;r++){const n=Je[r],l=Vt===r,c=J[n.key]?.LOW||{qty:0,value:0},v=J[n.key]?.STD||{qty:0,value:0},d=J[n.key]?.HIGH||{qty:0,value:0},m=c.qty+v.qty+d.qty,u=c.value+v.value+d.value,_=m===0,b=Ce(n.key,"LOW",R),p=Ce(n.key,"STD",R),h=Ce(n.key,"HIGH",R),x=c.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",k=v.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",C=h.available?d.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(s+='<div class="wh-row">',s+=`<div class="wh-row__collapsed${l?" expanded":""}" onclick="toggleWhRow(${r})">
            <span class="wh-row__arrow">${l?"▾":"▸"}</span>
            <span class="wh-row__name${_?" empty":""}">${y(n.name)}</span>
            <div class="wh-row__dots">
                <div class="${x}"></div>
                <div class="${k}"></div>
                <div class="${C}"></div>
            </div>
            <span class="wh-row__qty${_?" empty":""}">${m>0?m.toLocaleString():"—"}</span>
            <span class="wh-row__val${_?" empty":""}">${u>0?S(u):"—"}</span>
        </div>`,l){s+='<div class="wh-expand">',s+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const T=[{key:"LOW",label:"Low",data:c,avail:b,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:v,avail:p,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:d,avail:h,color:"var(--green)",dotClass:"wh-dot--high"}];for(const $ of T){const I=!$.avail.available,N=$.data.qty>0,q=N?"$"+Math.round($.data.value/$.data.qty):"—";s+=`<div class="wh-grade${I?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${$.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${I?"var(--red)":$.color}">${$.label}</span>
                        ${I?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${N?"var(--text-bright)":"var(--text-dim)"}">${N?$.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${$.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${$.data.value>0?S($.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${q}</span>
                </div>`}for(const $ of T)!$.avail.available&&$.avail.failedStat&&(s+=`<div class="wh-lock">
                        <span class="wh-lock__text">${$.label.toUpperCase()} GRADE LOCKED — ${y($.avail.failedStat)} &lt; ${$.avail.failedMin}</span>
                    </div>`);s+="</div>"}s+="</div>"}t.innerHTML=s}function Zo(t){Vt=Vt===t?-1:t,ni()}async function Ji(){if(!f)return;const{data:t,error:e}=await g.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",f.id);J={};const i=[];if(e)console.warn("Failed to load warehouse:",e.message);else if(t){for(const o of t){const a=lt(o.material_key);J[a]||(J[a]={}),J[a][o.quality_tier]={qty:o.quantity||0,value:Number(o.total_value)||0},a!==o.material_key&&i.push(o)}if(i.length>0){const o=i.map(a=>({faction_id:f.id,nation_id:f.nation_id,material_key:lt(a.material_key),quality_tier:a.quality_tier,quantity:a.quantity||0,total_value:Number(a.total_value)||0,updated_at:new Date().toISOString()}));await g.from("corp_warehouse").upsert(o,{onConflict:"faction_id,material_key,quality_tier"});for(const a of i)await g.from("corp_warehouse").delete().eq("faction_id",f.id).eq("material_key",a.material_key).eq("quality_tier",a.quality_tier)}}ni()}const ea={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function ta(){const t=(R?.name||f?.nation||"—").toUpperCase();document.getElementById("pr-nation-badge").textContent="LOCAL — "+t;const e=Number(f?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=S(e);const{totalUnits:i}=_t(),o=Math.round(i/gt*100),a=document.getElementById("pr-wh-capacity");a.textContent=o+"%",a.style.color=o>80?"var(--red)":o>50?"var(--orange)":"var(--green)",Xi(),si(),xt()}function Xi(){const t=document.getElementById("pr-mat-grid");let e="";for(const i of Je){const o=ne===i.key,a=ti.every(r=>!Ce(i.key,r,R).available),s="pr-mat-btn"+(o?" active":"")+(a?" all-locked":"");e+=`<span class="${s}" onclick="setPrMat('${i.key}')">${y(i.name)}</span>`}t.innerHTML=e}function si(){const t=document.getElementById("pr-tier-bar");let e='<span class="pr-tier-label">GRADE</span>';for(const i of ti){const o=Ce(ne,i,R),a=K===i,s=o.available?ii(ne,i,R):null,r=zi[i],n=!o.available,l="pr-tier-btn"+(a?" active":"")+(n?" locked":"");e+=`<div class="${l}" onclick="${n?"":`setPrTier('${i}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${r};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${a?"var(--text-bright)":"var(--text-dim)"}">${Ft[i]}</span>
            </div>
            ${s!==null?`<div class="pr-tier-btn__price" style="color:${a?"var(--text-bright)":"var(--text-muted)"}">$${s}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}t.innerHTML=e}function xt(){const t=document.getElementById("pr-content"),e=Ce(ne,K,R),i=Je.find(T=>T.key===ne);if(!i)return;if(!e.available){t.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${y(i.name)} — ${Ft[K]} grade
                    is not produced domestically in ${y(R?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${y(e.failedStat||"unknown")} &lt; ${e.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const o=ii(ne,K,R),a=Li(ne,K,R),s=o*fe,r=a>3e3?"LOW":a>1e3?"MODERATE":"HIGH",n=r==="LOW"?"var(--green)":r==="MODERATE"?"var(--amber)":"var(--red)",l=Number(R?.inflation??50),c=l>55?"up":l<45?"down":"flat",v=c==="up"?"&#9650;":c==="down"?"&#9660;":"&#8212;",d=c==="up"?"var(--red)":c==="down"?"var(--green)":"var(--text-dim)";let m="";m+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${o}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${d}">${v}</span>
                </div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">SUPPLY/TICK</div>
                <div class="pr-market-cell__value" style="font-size:14px;color:var(--text-bright);margin-top:2px;">${a.toLocaleString()}</div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">DEMAND</div>
                <div class="pr-market-cell__value" style="font-size:12px;color:${n};margin-top:2px;">${r}</div>
            </div>
        </div>
    </div>`,m+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${y(R?.name||"—")})</div>`;for(const T of i.priceDrivers){const $=Number(R?.[T]??50),I=$>=50?"var(--green)":$>=30?"var(--amber)":$>=15?"var(--orange)":"var(--red)",N=ea[T]||T;m+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${y(T)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${$}%;background:${I}"></div>
            </div>
            <span class="pr-driver-row__val">${$}</span>
            <span class="pr-driver-row__effect">${y(N)}</span>
        </div>`}m+="</div>";const _=(Number(f?.corp_cash_reserves)||0)>=s,b=fe>a,{totalUnits:p}=_t(),h=gt-p,x=fe>h,k=h<=0,C=zi[K];m+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${y(i.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${C};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${C}">${Ft[K]}</span>
                </div>
                <span class="pr-order__mat-price">$${o}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(T=>`<span class="pr-qty-btn${fe===T?" active":""}" onclick="setPrQty(${T})">${T>=1e3?T/1e3+"k":T}</span>`).join("")}
                </div>
            </div>
            ${b?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${a.toLocaleString()} this tick</span>
            </div>`:""}
            ${k?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">WAREHOUSE FULL — no remaining capacity</span>
            </div>`:x?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS WAREHOUSE CAPACITY — ${h.toLocaleString()} units remaining</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${S(s)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${_&&!b&&!x&&!k?"":"disabled"}
                    title="${_?b?"Exceeds supply":k?"Warehouse full":x?"Exceeds warehouse capacity":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,t.innerHTML=m}function ia(t){ne=t,K="STD";for(const e of["STD","HIGH","LOW"])if(Ce(t,e,R).available){K=e;break}Xi(),si(),xt()}function oa(t){K=t,si(),xt()}function aa(t){fe=t,xt()}let St=!1;async function na(){if(St||!f||!R)return;const t=ii(ne,K,R),e=Li(ne,K,R),i=t*fe,o=Number(f.corp_cash_reserves)||0;if(i>o){alert("Insufficient cash reserves.");return}if(fe>e){alert("Exceeds available supply this tick.");return}const{totalUnits:a}=_t(),s=gt-a;if(s<=0){alert("Warehouse is full. Cannot purchase more materials.");return}if(fe>s){alert(`Warehouse can only hold ${s.toLocaleString()} more units. Reduce quantity.`);return}St=!0;const r=document.querySelector(".pr-purchase-btn");r&&(r.disabled=!0,r.textContent="...");try{const n=o-i,{error:l}=await g.from("factions").update({corp_cash_reserves:n}).eq("id",f.id);if(l)throw l;const c=lt(ne),v=J[c]?.[K],d=(v?.qty||0)+fe,m=(v?.value||0)+i,{error:u}=await g.from("corp_warehouse").upsert({faction_id:f.id,nation_id:f.nation_id,material_key:c,quality_tier:K,quantity:d,total_value:m,last_purchased_tick:M?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(u){const{error:_}=await g.from("factions").update({corp_cash_reserves:o}).eq("id",f.id);throw _&&console.error("Cash refund failed after warehouse error:",_.message),u}f.corp_cash_reserves=n,J[c]||(J[c]={}),J[c][K]={qty:d,value:m},ni(),ta(),r&&(r.textContent="PURCHASED",setTimeout(()=>{r.isConnected&&(r.disabled=!1,r.textContent="PURCHASE")},1500))}catch(n){r&&(r.disabled=!1,r.textContent="PURCHASE"),alert("Purchase failed: "+(n.message||"Unknown error"))}finally{St=!1}}function Zi(t){const e=Ie||R;if(!e)return[];const i=yt(t);if(!i)return[];const o=Eo(t,e),a=[],s=Number(e?.inflation??50),r=Number(e?.fuel_prices??50);Number(e?.manufacturing_output??50);const n=Ie&&R&&Ie.id!==R.id;let l=null;if(n&&(l=To(e,R)),o.newAvailable>0){const c=Ii(t,e),v=i.basePrice,d=Math.round(v*((s-50)/200)),m=Math.round(v*((r-50)/300));let u=c;const _=[{label:"Base price",value:S(v)},d!==0?{label:`Inflation (${s})`,mod:(d>=0?"+":"")+S(Math.abs(d))}:null,m!==0?{label:`Fuel transport (${r})`,mod:(m>=0?"+":"")+S(Math.abs(m))}:null].filter(Boolean),b=c-v-d-m;if(b!==0&&!n&&_.push({label:"Demand/scarcity",mod:(b>=0?"+":"")+S(Math.abs(b))}),n&&l){const p=Math.round(c*l.tariff),h=Math.round(c*l.transport);u=c+p+h,_.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+S(p)}),_.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+S(h)})}a.push({seller:n?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:n?l?.deliveryTicks||1:0,condition:100,price:Math.round(u),available:o.newAvailable,delivery:n?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:n?l.deliveryTicks:0,used:!1,priceFactors:_,sourceNationId:e.id})}if(o.usedAvailable>0){const c=o.usedCondition,v=Ii(t,e,{used:!0,condition:c});let d=v;const m=[{label:"Base price",value:S(i.basePrice)},{label:`Condition (${c}%)`,mod:"-"+S(Math.max(0,i.basePrice-v))}];if(n&&l){const u=Math.round(v*l.tariff),_=Math.round(v*l.transport);d=v+u+_,m.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+S(u)}),m.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+S(_)})}a.push({seller:n?`${e.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:e.name||"—",distance:n?l?.deliveryTicks||1:0,condition:c,price:Math.round(d),available:o.usedAvailable,delivery:n?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:n?l.deliveryTicks:0,used:!0,priceFactors:m,sourceNationId:e.id})}return a}function ri(){const t=Number(f?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=S(t);const e=yt(se),i=Xe[e?.tier||1],o=document.getElementById("em-tier-badge");o&&(o.textContent=i.tag,o.style.color=i.color),o.style.background=i.color+"0a",o.style.border="1px solid "+i.color+"33";const a=document.getElementById("em-nation-select");if(a&&a.options.length===0){const n=R?.name||f?.nation||"—";let l=`<option value="">${y(n)} (HQ)</option>`;for(const c of Ui)c.id!==R?.id&&(l+=`<option value="${c.id}">${y(c.name)}</option>`);a.innerHTML=l}const s=document.getElementById("em-import-tag"),r=Ie&&R&&Ie.id!==R.id;s&&(s.style.display=r?"":"none"),sa(),li()}function sa(){let t="";for(let e=1;e<=3;e++){const i=Xe[e],o=Ut(e),a=e===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";t+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${i.color}">${i.tag}</div>
            <div class="${a}">`;for(const s of o){const r=se===s.key,n=Zi(s.key).length>0;t+=`<span class="em-selector__btn${r?" active":""}${n?"":" no-listings"}"
                style="${r?"background:"+i.color+";border-color:"+i.color:""}"
                onclick="setEmType('${s.key}')">${y(s.name)}</span>`}t+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${t}</div>`}function li(){const t=document.getElementById("em-content");if($e=Zi(se),$e.length===0){t.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}ve>=$e.length&&(ve=0);let e="";for(let o=0;o<$e.length;o++){const a=$e[o],s=ve===o,r=a.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",n=Ri(a.condition);e+=`<div class="em-listing${s?" selected":""}" style="${s?"border-left-color:"+r:""}" onclick="setEmListing(${o})">`,e+=`<div class="em-listing__row1">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="em-listing__seller">${y(a.seller)}</span>
                <span class="em-badge em-badge--${a.sellerType.toLowerCase()}">${a.sellerType}</span>
                ${a.used?'<span class="em-badge em-badge--used">USED</span>':""}
            </div>
        </div>`,e+=`<div class="em-listing__row2">
            <span class="em-listing__nation">${y((a.nation||"").toUpperCase())}</span>
            ${a.distance>0?`<span class="em-listing__distance">${a.distance} nation${a.distance>1?"s":""} away</span>`:""}
            <span class="em-listing__delivery">Delivery: ${y(a.delivery)}</span>
        </div>`,e+=`<div class="em-listing__stats">
            <div class="em-stat-cell" style="flex:1">
                <div class="em-stat-cell__label">COND.</div>
                <div class="em-stat-cell__bar">
                    <div class="em-stat-cell__bar-track"><div class="em-stat-cell__bar-fill" style="width:${a.condition}%;background:${n}"></div></div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${n}">${a.condition}%</span>
                </div>
            </div>
            <div class="em-stat-cell" style="flex:0.8;text-align:center">
                <div class="em-stat-cell__label">AVAIL.</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${a.available}</div>
            </div>
            <div class="em-stat-cell" style="flex:1.2">
                <div class="em-stat-cell__label">PRICE/UNIT</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${S(a.price)}</div>
            </div>
        </div>`,s&&a.priceFactors&&(e+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${a.priceFactors.map(l=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${y(l.label)}</span>
                    <span class="em-breakdown__mod" style="color:${l.mod?l.mod.startsWith("-")?"var(--green)":l.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${l.mod||l.value}</span>
                </div>`).join("")}
            </div>`),e+="</div>"}const i=$e[ve];if(i){const o=yt(se),a=Xe[o?.tier||1],s=Math.min(i.available,4),r=i.price*ue,n=(Number(f?.corp_cash_reserves)||0)>=r;e+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${y(o?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${y(i.seller)}</span>
                </div>
                <span class="em-purchase__price">${S(i.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:s},(l,c)=>c+1).map(l=>`<span class="em-qty-btn${ue===l?" active":""}" style="${ue===l?"background:"+a.color+";border-color:"+a.color:""}" onclick="setEmQty(${l})">${l}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${i.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${S(r)}</div>
                    ${i.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${y(i.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${a.color}" onclick="purchaseEquipment()"
                    ${n?"":"disabled"}
                    title="${n?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}t.innerHTML=e}async function ra(t){if(!t)Ie=null;else{let i=Ui.find(o=>o.id===t);if(!i)try{const{data:o}=await g.from("nations").select("*").eq("id",t).single();i=o}catch{}Ie=i||null}ve=0,ue=1;const e=document.getElementById("em-nation-select");e&&(e.value=t||""),ri()}function la(t){se=t,ve=0,ue=1,ri()}function da(t){ve=t,ue=1,li()}function ca(t){ue=t,li()}let qt=!1;async function pa(){if(qt)return;const t=$e[ve];if(!t||!f)return;const e=yt(se);if(!e)return;const i=ue,o=t.price*i,a=Number(f.corp_cash_reserves)||0;if(o>a){alert("Insufficient cash reserves.");return}if(i>t.available){alert("Not enough units available.");return}const s=document.querySelector(".em-purchase-btn");s&&(s.disabled=!0,s.textContent="..."),qt=!0;try{const r=a-o,{error:n}=await g.from("factions").update({corp_cash_reserves:r}).eq("id",f.id);if(n)throw n;const l=!t.deliveryTicks||t.deliveryTicks===0;if(l){const v=ie.find(k=>k.equipment_key===se),d=(v?.owned||0)+i,m=v?.purchase_price_avg||0,u=v?.owned||0,_=u>0?Math.round((m*u+t.price*i)/d):t.price,b=e.maintenancePerUnit*d,p=v?.condition||100,h=Math.round((p*u+t.condition*i)/d),{error:x}=await g.from("corp_equipment").upsert({faction_id:f.id,nation_id:f.nation_id,equipment_key:se,tier:e.tier,owned:d,deployed:v?.deployed||0,condition:h,maintenance_per_tick:b,purchase_price_avg:_,last_purchased_tick:M?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(x){const{error:k}=await g.from("factions").update({corp_cash_reserves:a}).eq("id",f.id);throw k&&console.error("Cash refund failed:",k.message),x}v?(v.owned=d,v.condition=h,v.maintenance_per_tick=b):ie.push({equipment_key:se,tier:e.tier,owned:d,deployed:0,condition:h,maintenance_per_tick:b,assigned_projects:[]})}else{const v=(M?.current_tick||0)+t.deliveryTicks,{error:d}=await g.from("corp_equipment_deliveries").insert({faction_id:f.id,equipment_key:se,quantity:i,condition:t.condition,delivery_tick:v,source_nation_id:t.sourceNationId||null,seller_name:t.seller,price_paid:o});if(d){const{error:m}=await g.from("factions").update({corp_cash_reserves:a}).eq("id",f.id);throw m&&console.error("Cash refund failed:",m.message),d}}f.corp_cash_reserves=r,gi(),ri();const c=document.getElementById("pr-cash");c&&(c.textContent=S(r)),s&&(s.textContent=l?"PURCHASED":"ORDERED",setTimeout(()=>{s.isConnected&&(s.disabled=!1,s.textContent="PURCHASE")},1500))}catch(r){s&&(s.disabled=!1,s.textContent="PURCHASE"),alert("Purchase failed: "+(r.message||"Unknown error"))}finally{qt=!1}}let fa=-1,Be=[],pt=[],Kt=[];function At(t){return Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(1)+"M":Math.abs(t)>=1e3?"$"+(t/1e3).toFixed(0)+"k":"$"+t.toLocaleString()}function ma(t,e,i){if(i)return"var(--orange)";const o=t/(e||1)*100;return o>50?"var(--green)":o>25?"var(--amber)":"var(--red)"}function Mi(){const t=document.getElementById("pm-list"),e=Be.length,i=pt.length,o=Kt.length,a=Be.filter(l=>l.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${e})`,document.getElementById("pm-pending-count").textContent=`(${i})`,document.getElementById("pm-apply-count").textContent=`(${o})`;const s=document.getElementById("pm-badges");let r="";a>0&&(r+=`<span class="pm-badge pm-badge--expiring">${a} EXPIRING</span>`),i>0&&(r+=`<span class="pm-badge pm-badge--pending">${i} PENDING</span>`),s.innerHTML=r;const n=Be.reduce((l,c)=>l+(c.cost||0),0)+pt.reduce((l,c)=>l+(c.cost||0),0);document.getElementById("pm-total-cost").textContent=At(n),document.getElementById("pm-footer-active").textContent=e,document.getElementById("pm-footer-pending").textContent=i;{if(e===0){t.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let l="";Be.forEach((c,v)=>{const d=fa===v,m=ma(c.ticks_left,c.total_ticks,c.expiring_soon),u=Math.min(c.ticks_left/(c.total_ticks||1)*100,100);l+=`<div class="pm-item ${c.expiring_soon?"pm-item--expiring":""} ${d?"expanded":""}" onclick="togglePmExpand(${v})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${y(c.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${y((c.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${m}">Expires: ${y(c.expires||"")}</span>
                        <span class="pm-item__ticks">(${c.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${u}%;background:${m}"></div></div>`,d&&(l+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${y(c.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${y(c.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${At(c.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${c.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${c.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(c.projects||[]).map(_=>`<span class="pm-project-chip">${y(_)}</span>`).join("")}</div>
                    </div>`,c.note&&(l+=`<div class="pm-note"><span class="pm-note__text">${y(c.note)}</span></div>`),c.expiring_soon&&c.renewable&&(l+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew" onclick="event.stopPropagation(); pmApplyForPermit('${c.permit_key}');">RENEW — ${At(c.cost||0)}</button></div>`),l+="</div>"),l+="</div></div>"}),t.innerHTML=l;return}}let Mt=!1;async function va(t){if(!(Mt||!f||!R)){Mt=!0;try{const{data:e}=await g.from("shard").select("current_tick").eq("name","Alpha Shard").single(),i=e?.current_tick||0,{data:o,error:a}=await g.rpc("apply_for_permit",{p_faction_id:f.id,p_nation_id:R.id,p_permit_key:t,p_current_tick:i});if(a){alert("Application failed: "+a.message);return}if(o&&!o.success){alert(o.error||"Application failed");return}alert("Permit application submitted! Processing: "+(o.processing_ticks||0)+" ticks."),await ua()}catch(e){alert("Error: "+e.message)}finally{Mt=!1}}}window.pmApplyForPermit=va;async function ua(){if(!f||!R){Be=[],pt=[],Kt=[],Mi();return}const{data:t}=await g.from("construction_permits").select("*"),e=t||[],i={};for(const d of e)i[d.permit_key]=d;const{data:o}=await g.from("corp_permits").select("*").eq("faction_id",f.id).eq("nation_id",R.id),a=o||[],{data:s}=await g.from("active_laws").select("policy_id, policies(permit_key, policy_name)").eq("nation_id",R.id).not("policies.permit_key","is",null),r=new Set,n={};for(const d of s||[])d.policies?.permit_key&&(r.add(d.policies.permit_key),n[d.policies.permit_key]=d.policies.policy_name);const{data:l}=await g.from("shard").select("current_tick").eq("name","Alpha Shard").single(),c=l?.current_tick||0;Be=a.filter(d=>d.status==="active").map(d=>{const m=i[d.permit_key]||{},u=d.expires_at_tick?Math.max(0,d.expires_at_tick-c):999,_=m.duration_ticks||24;return{name:m.name||d.permit_key,permit_key:d.permit_key,nation:R.name,policy:n[d.permit_key]||"—",issued:d.granted_at_tick!=null?Ee(d.granted_at_tick):"—",expires:d.expires_at_tick?Ee(d.expires_at_tick):"Single-use",cost:d.cost_paid||0,ticks_left:u,total_ticks:_,expiring_soon:u<=3&&u>0,renewable:m.duration_ticks!=null,projects:[]}}),pt=a.filter(d=>d.status==="pending").map(d=>{const m=i[d.permit_key]||{},u=m.processing_ticks||2,_=c-d.applied_at_tick,b=Math.max(0,u-_);return{name:m.name||d.permit_key,permit_key:d.permit_key,nation:R.name,applied:Ee(d.applied_at_tick),status:"PROCESSING",processing_total:u,ticks_remaining:b,est_approval:Ee(d.applied_at_tick+u),cost:d.cost_paid||0,required_by:n[d.permit_key]||"—"}});const v=new Set(a.filter(d=>d.status==="active"||d.status==="pending").map(d=>d.permit_key));Kt=[...r].filter(d=>!v.has(d)).map(d=>{const m=i[d]||{};return{name:m.name||d,permit_key:d,nation:R.name,description:m.description||"",policy:n[d]||"—",cost:m.cost_is_percentage?15e4:m.cost||0,processing_time:m.processing_ticks||2,duration:m.duration_ticks?m.duration_ticks+" ticks":"Single-use",category:m.category||"",difficulty:m.difficulty||"EASY"}}),Mi()}let Nt=!1,Lt=!1;function eo(t){return Math.abs(t)>=1e9?"$"+(t/1e9).toFixed(1)+"B":Math.abs(t)>=1e6?"$"+(t/1e6).toFixed(1)+"M":Math.abs(t)>=1e3?"$"+Math.round(t/1e3)+"k":"$"+Math.round(t)}async function di(){var{data:t,error:e}=await g.from("factions").select("*").eq("id",f.id).single();if(e){console.warn("Faction refresh failed:",e.message);return}t&&(f=t);var i=document.getElementById("topbar-cash");i&&(i.textContent="CASH: "+eo(Number(f.corp_cash_reserves??0)))}const Jt={CRITICAL:"#c55",HIGH:"#5c5",MODERATE:"#ca5",LOW:"#6a6660"};let Fe=[],ci=[],to="ready",We=null,ft="ALL",Z=-1;const mt={COASTAL:{color:"#8b9a6b",label:"COASTAL"},INTERNATIONAL:{color:"#5a8aaa",label:"INTL"},GOVERNMENT:{color:"#c8a832",label:"GOV CONTRACT"}};function ya(t){ft=t,Z=-1,document.querySelectorAll(".ar-pill").forEach(e=>{const i=e.getAttribute("data-ar-filter");e.className="ar-pill"+(i===t?" active-"+(t==="ALL"?"all":t==="COASTAL"?"coastal":t==="INTERNATIONAL"?"intl":"gov"):"")}),fi()}function io(t){return Math.round(Number(t?.estimated_revenue||0)*Ht(t))}function pi(){return(ft==="ALL"?Fe:Fe.filter(e=>e.scope===ft)).slice().sort((e,i)=>{const o=e.trade_agreement_id?0:1,a=i.trade_agreement_id?0:1;return o-a})}async function bt(){if(!f||f.corp_sector!=="Shipping")return;const t=await Io(g,f.id,f.corp_subsector);Fe=t.routes,ci=t.applications,to=t.state,We=t.error,We&&console.warn("Failed to load available routes:",We.message),Z=-1,fi()}var ga={fuel_energy:[{stat:"industrialization",label:"Industrialization"},{stat:"urbanization",label:"Urbanization"}],minerals:[{stat:"industrialization",label:"Industrialization"},{stat:"manufacturing",label:"Manufacturing"}],grains_staples:[{stat:"population_growth",label:"Population Growth"},{stat:"food_security",label:"Food Security"}],livestock_dairy:[{stat:"standard_of_living",label:"Std of Living"},{stat:"food_security",label:"Food Security"}],cash_crops:[{stat:"trade_balance",label:"Trade Balance"},{stat:"foreign_investment",label:"Foreign Investment"}],manufactured_goods:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],technology:[{stat:"technology",label:"Technology"},{stat:"higher_education",label:"Higher Education"}],fruits_vegetables:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],arms:[{stat:"military_spending",label:"Military Spending"},{stat:"stability",label:"Stability"}]};function _a(t){return ga[t]||[]}function xa(t){var e=Number(t.competition_count||0),i=t.demand_level||"",o=t.scope==="GOVERNMENT";return o?"Fixed payment. No demand risk. Vessel locked for contract duration.":e===0&&i==="CRITICAL"?"Unserved critical corridor. High volume, no competition — claim immediately.":e===0&&i==="HIGH"?"Virgin route with strong demand. First-mover advantage available.":e===0?"No competition on this route. Market share starts at 100%.":i==="CRITICAL"&&e<=2?"Underserved critical route. Demand exceeds current capacity.":i==="LOW"?"Thin route. Revenue may not justify vessel deployment.":e>=3?"Crowded route. Market share will be split "+(e+1)+" ways.":Number(t.tariff_rate||0)>15?"High tariff rate cuts into margins. Watch for trade policy changes.":null}function fi(){const t=pi();document.getElementById("ar-count").textContent=Fe.length+" ROUTES";var e={COASTAL:0,INTERNATIONAL:0,GOVERNMENT:0};Fe.forEach(function(h){e[h.scope]!==void 0&&e[h.scope]++});var i=e.COASTAL,o=e.INTERNATIONAL,a=e.GOVERNMENT;document.getElementById("ar-footer-counts").innerHTML='<div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#8b9a6b"></div><span class="ar-footer__count-label">COASTAL</span><span class="ar-footer__count-num">'+i+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#5a8aaa"></div><span class="ar-footer__count-label">INTL</span><span class="ar-footer__count-num">'+o+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#c8a832"></div><span class="ar-footer__count-label">GOV</span><span class="ar-footer__count-num">'+a+"</span></div>";const s=document.getElementById("ar-claim-btn");s.className="ar-claim-btn"+(Z>=0?" active":"");const r=document.getElementById("ar-list");if(to==="error"){r.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+y(We&&We.message||"Shipping routes are temporarily unavailable.")+"</div></div>";return}if(t.length===0){r.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+(Fe.length===0?"No routes available.<br>Routes are generated from bilateral<br>trade each tick. Check back after<br>the next corp tick fires.":"No "+ft.toLowerCase()+" routes available.")+"</div></div>";return}let n="";for(let h=0;h<t.length;h++){const x=t[h],k=Z===h,C=mt[x.scope]||mt.INTERNATIONAL,T=x.scope==="GOVERNMENT",$=x.demand_level&&Jt[x.demand_level]?{color:Jt[x.demand_level],label:x.demand_level}:null,I=Number(x.competition_count||0),N=I===0?"#5c5":I<=2?"#ca5":"#c84";if(n+='<div style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid '+(k?C.color:"transparent")+";background:"+(k?C.color+"08":"transparent")+';" onclick="arSelectRoute('+h+')"><div style="padding:8px 14px;">',n+='<div style="display:flex;align-items:center;gap:0;margin-bottom:4px;"><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+y(x.origin_port||"?")+'</span><div style="flex:1;display:flex;align-items:center;margin:0 8px;"><div style="flex:1;height:1px;background:'+C.color+'44"></div><span style="font-family:var(--font-mono);font-size:7px;color:'+C.color+';padding:0 6px">⚓</span><div style="flex:1;height:1px;background:'+C.color+'44"></div></div><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+y(x.destination_port||"?")+"</span></div>",n+='<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;"><span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+C.color+";background:"+C.color+"12;border:1px solid "+C.color+'25">'+C.label+"</span>",$&&(n+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+$.color+";background:"+$.color+"12;border:1px solid "+$.color+'25">'+$.label+" DEMAND</span>"),T&&x.gov_issuer&&(n+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">'+y(x.gov_issuer)+"</span>"),I===0&&!T&&(n+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15)">NO COMPETITION</span>'),x.trade_agreement_id&&!T){const q=x.trade_agreement_name?" · "+y(String(x.trade_agreement_name).slice(0,28)):"";n+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.1);border:1px solid rgba(92,204,92,0.3)">ACTIVE AGREEMENT ×1.2'+q+"</span>"}else!x.trade_agreement_id&&!T&&(n+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#9e9a92;background:rgba(158,154,146,0.06);border:1px solid rgba(158,154,146,0.15)">OPEN MARKET ×1.0</span>');var l=ci.find(function(q){return q.route_id===x.id});if(l){var c=l.status==="approved"?"#5c5":"#c8a832",v=l.status==="approved"?"APPROVED":"APPLIED";n+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+c+";background:"+c+"12;border:1px solid "+c+'25">'+v+"</span>"}if(n+='<span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-left:auto">'+(x.transit_ticks||"?")+" tick"+((x.transit_ticks||0)!==1?"s":"")+" · "+y(x.vessel_class||"?")+"</span>",n+="</div>",n+='<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">',T)n+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(x.gov_contract_duration||x.transit_ticks||"?")+" ticks</div></div>",n+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VESSEL</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+y(x.vessel_class||"?")+"</div></div>",n+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT VALUE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-top:1px">'+S(Number(x.gov_contract_value||x.estimated_revenue||0))+"</div></div>",n+="</div>";else{const q=Ea(x),j=q.net>0?"#5c5":q.net<0?"#c84":"#9e9a92";n+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VOLUME</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);margin-top:1px">'+S(Number(x.trade_volume||0))+"</div></div>",n+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">COMP.</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+N+';margin-top:1px">'+I+"</div></div>",n+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">TRANSIT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(x.transit_ticks||"?")+" tick"+((x.transit_ticks||0)!==1?"s":"")+"</div></div>",n+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">EST. REV</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+(x.trade_agreement_id?"#5c5":"#b0aa9a")+';margin-top:1px">'+S(io(x))+"</div></div>",n+="</div>",n+='<div style="display:flex;justify-content:space-between;align-items:center;padding:3px 8px;background:var(--bg-0);border:1px solid var(--border-0);border-top:none;"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.5px;">EST. MONTHLY MARGIN (state fuel + maint + incident reserve)</span><span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+j+';">'+(q.net>=0?"+":"")+S(q.net)+"</span></div>"}if(k){if(n+='<div style="margin-top:6px;">',T&&x.goods_description&&(n+='<div style="font-size:10px;color:var(--text-muted);line-height:1.5;margin-bottom:6px">'+y(x.goods_description)+"</div>"),x.trade_agreement_name&&(n+='<div style="padding:4px 8px;margin-bottom:5px;background:rgba(90,138,170,0.05);border:1px solid rgba(90,138,170,0.12)"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:var(--font-mono);font-size:7px;color:#5a8aaa;letter-spacing:0.5px">TRADE AGREEMENT</div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:1px">'+y(x.trade_agreement_name)+'</div></div><div style="text-align:right"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">TARIFF</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(Number(x.tariff_rate||0)>10?"#c84":"#5c5")+'">'+Number(x.tariff_rate||0).toFixed(1)+"%</div></div></div></div>"),n+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px">',n+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VESSEL CLASS</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+y(x.vessel_class||"?")+"</span></div>",x.vessel_note&&(n+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">REQUIREMENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+y(x.vessel_note)+"</span></div>"),n+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">PROXIMITY</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+(x.proximity!=null?x.proximity:"?")+" / 100</span></div>",n+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CARGO</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+y(x.goods_name||"Unknown")+"</span></div>",x.goods_description&&!T&&(n+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CONTENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+y(x.goods_description)+"</span></div>"),n+='<div style="display:flex;justify-content:space-between;padding:2px 0"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VOLUME</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+Number(x.volume_physical||0).toLocaleString()+" "+y(x.volume_unit||"tons")+"</span></div>",n+="</div>",R&&!T){var d=_a(x.trade_sector);if(d.length>0){n+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.8px;margin-bottom:3px">DEMAND DRIVERS</div>';for(var m=0;m<d.length;m++){var u=d[m],_=Number(R[u.stat]??50),b=_>=50?"#5c5":_>=30?"#ca5":"#c84";n+='<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);width:100px">'+y(u.label)+'</span><div style="width:40px;height:2px;background:var(--border-0)"><div style="width:'+_+"%;height:100%;background:"+b+'"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-bright)">'+Math.round(_)+"</span></div>"}n+="</div>"}}var p=xa(x);p&&(n+='<div style="padding:4px 8px;background:'+C.color+"08;border:1px solid "+C.color+'15"><div style="font-size:9px;color:var(--text-muted);line-height:1.5">'+y(p)+"</div></div>"),n+="</div>"}n+="</div></div>"}r.innerHTML=n}function ba(t){Z=Z===t?-1:t,fi()}let ze=null,qe=null,ee=0,st=!1;async function ha(t){const i=Math.round(57499.99999999999),o=5e4;if(!t)return{tier:"state",cost:15e4,ownerFactionId:null,ownerName:null};try{const{data:a}=await g.from("corp_properties").select("id, faction_id").eq("nation_id",t).eq("faction_id",f.id).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(a)return{tier:"own",cost:o,ownerFactionId:f.id,ownerName:f.faction_name};const{data:s}=await g.from("corp_properties").select("id, faction_id, factions!faction_id(faction_name)").eq("nation_id",t).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(s)return{tier:"other",cost:i,ownerFactionId:s.faction_id,ownerName:s.factions?.faction_name||"another corporation"}}catch(a){console.warn("[Depot lookup] failed:",a?.message||a)}return{tier:"state",cost:15e4,ownerFactionId:null,ownerName:null}}const Xt=.06,$a={loading:.85},wa={Coastal:.82,Container:1.18,Bulk:1,Tanker:1.28,Reefer:1.12,LNG:1.34},ka={Coastal:9e4,Container:145e3,Bulk:175e3,Tanker:19e4,Reefer:14e4,LNG:29e4};function mi(t,e,i){const a=Math.max(0,Math.min(100,Number(t?.proximity)||50)),s=String(t?.scope||"").toUpperCase(),r=wa[e]||1,n=.75+a/100*.9,l=s==="COASTAL"?.92:s==="GOVERNMENT"?1.05:1,c=Math.round(5e4*r*n*l);return i==="own"?c:Math.round(i==="other"?c*1.15:c*1.65)}function Ea(t){const e=Math.max(1,Number(t?.transit_ticks)||2),i=Math.max(1,12/(e*2)),o=Math.round(io(t)*i),a=Math.round(mi(t,t?.vessel_class,"state")*i),s=Math.round((ka[t?.vessel_class]||12e4)*$a.loading),r=Math.round(o*Xt),n=o-a-s-r;return{gross:o,fuel:a,maintenance:s,reserve:r,net:n}}function Ta({route:t,proposedRate:e,tierMult:i,depotTier:o}){const a=Number(e)||0,s=Math.round(a*(Number(i)||1)),r=mi(t,t?.vessel_class,o),n=s-r;return{bid:a,revenue:s,fuelPerTrip:r,netPerTrip:n}}async function Ca(){if(Z<0||!f||!M)return;var t=pi(),e=t[Z];if(!e)return;var i=ci.find(function(l){return l.route_id===e.id});if(i){alert("You have already applied for this route. Status: "+i.status);return}var o={"Bulk Cargo":"bulk_cargo","Container Freight":"container_freight","Specialized Transport":"specialized_transport"},a=o[f.corp_subsector]||"";if(e.shipping_subsector&&a!==e.shipping_subsector){var s=e.shipping_subsector.replace(/_/g," ").replace(/\b\w/g,function(l){return l.toUpperCase()});alert("Your fleet specializes in "+(f.corp_subsector||"?")+" but this route requires "+s+".");return}ze=e,ze.destDepot=await ha(e.destination_nation_id);const r=Pi(e.trade_volume,e.shipping_subsector),n=Math.round((Di+r)/2);ee=So(Number(e.estimated_revenue)||n,r),qe=null,ui()}function vi(){ze=null,document.getElementById("ra-modal-overlay")?.remove()}function Ia(t){qe=t,ui()}function Sa(t){ee=Number(t),ui()}function ui(){if(document.getElementById("ra-modal-overlay")?.remove(),!ze)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#5a8aaa",green:"#5c5",gold:"#c8a832",orange:"#c84",red:"#c55",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},i=ze,o=mt[i.scope]||mt.INTERNATIONAL,a=Ht(i),s=i.destDepot?.tier||"state",r=oe.filter(z=>z.status==="in_port"&&!z.active_claim_id&&z.condition>=20),n=r.find(z=>z.id===qe),l=!!n&&ee>0,c=Ta({route:i,proposedRate:ee,tierMult:a,depotTier:s}),v=c.netPerTrip>0?e.green:c.netPerTrip<0?e.red:e.dim,d=Number(n?.base_maintenance)||0,m=Number(i.transit_ticks)||0,u=d*m,_=c.netPerTrip>=u;let b=`
    <div style="width:520px;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;max-height:90vh;">
        <div style="padding:12px 20px;border-bottom:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;align-items:center;gap:8px;">
                <span style="font-size:10px;color:${o.color}">●</span>
                <span style="font-family:${t};font-size:13px;font-weight:700;letter-spacing:2px;color:${e.muted};">ROUTE APPLICATION</span>
            </div>
            <span onclick="raClose()" style="font-family:${t};font-size:18px;color:${e.dim};cursor:pointer">×</span>
        </div>
        <div style="padding:14px 20px;overflow:auto;flex:1;">

            <div style="display:flex;align-items:center;gap:0;margin-bottom:12px;">
                <span style="font-size:14px;font-weight:700;color:${e.text}">${y(i.origin_port||"?")}</span>
                <div style="flex:1;display:flex;align-items:center;margin:0 10px;">
                    <div style="flex:1;height:1px;background:${o.color}44"></div>
                    <span style="font-family:${t};font-size:8px;color:${o.color};padding:0 8px">⚓ ${i.transit_ticks||"?"} tick${(i.transit_ticks||0)!==1?"s":""}</span>
                    <div style="flex:1;height:1px;background:${o.color}44"></div>
                </div>
                <span style="font-size:14px;font-weight:700;color:${e.text}">${y(i.destination_port||"?")}</span>
            </div>

            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};margin-bottom:14px;">
                <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border};">
                    <div style="font-family:${t};font-size:6px;color:${e.dim};letter-spacing:0.5px;">CARGO</div>
                    <div style="font-family:${t};font-size:9px;font-weight:700;color:${e.text};margin-top:1px;">${y(i.goods_name||"?")}</div>
                </div>
                <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border};">
                    <div style="font-family:${t};font-size:6px;color:${e.dim};letter-spacing:0.5px;">VESSEL REQ.</div>
                    <div style="font-family:${t};font-size:9px;font-weight:700;color:${e.text};margin-top:1px;">${y(i.vessel_class||"?")}</div>
                </div>
                <div style="flex:1;padding:4px 8px;border-right:1px solid ${e.border};">
                    <div style="font-family:${t};font-size:6px;color:${e.dim};letter-spacing:0.5px;">VOLUME</div>
                    <div style="font-family:${t};font-size:9px;font-weight:700;color:${e.text};margin-top:1px;">${S(Number(i.trade_volume||0))}</div>
                </div>
                <div style="flex:1;padding:4px 8px;">
                    <div style="font-family:${t};font-size:6px;color:${e.dim};letter-spacing:0.5px;">COMPETITION</div>
                    <div style="font-family:${t};font-size:9px;font-weight:700;color:${Number(i.competition_count||0)===0?e.green:e.orange};margin-top:1px;">${i.competition_count||0}</div>
                </div>
            </div>

            ${(()=>{const z=i.destDepot;if(!z)return"";const F=i.destination_port||"this port",U=mi(i,i.vessel_class,z.tier),w="$"+Math.round(U).toLocaleString()+" / refuel";let A,B;return z.tier==="own"?(A=`${F} has your Fuel Depot (${y(z.ownerName||f.faction_name||"your corp")}) — ${w}.`,B=e.green):z.tier==="other"?(A=`${F} has a Fuel Depot (${y(z.ownerName||"another corp")}) — ${w}.`,B=e.gold):(A=`${F} has no fuel depot — paying ${w} to the government-owned depot.`,B=e.orange),`<div style="padding:7px 10px;margin-bottom:14px;background:${e.card};border:1px solid ${e.border};border-left:2px solid ${B};font-family:${t};font-size:9px;color:${e.text};line-height:1.5;">
                    <span style="color:${e.dim};font-size:7px;font-weight:700;letter-spacing:0.5px;">FUEL AT DESTINATION</span><br>
                    ${A}
                </div>`})()}

            ${(()=>{const z=!!i.trade_agreement_id,F=Ht(i),U=z?e.green:e.dim,w=z?`ACTIVE TRADE AGREEMENT${i.trade_agreement_name?" · "+y(i.trade_agreement_name):""}`:"OPEN-MARKET ROUTE",A=z?`Revenue = your bid × ${F.toFixed(2)} (agreement bonus).`:`Revenue = your bid × ${F.toFixed(2)} (organic route penalty). Agreement-backed lanes pay more.`;return`<div style="padding:7px 10px;margin-bottom:14px;background:${e.card};border:1px solid ${e.border};border-left:2px solid ${U};font-family:${t};font-size:9px;color:${e.text};line-height:1.5;">
                    <span style="color:${e.dim};font-size:7px;font-weight:700;letter-spacing:0.5px;">${w}</span><br>
                    ${A}
                </div>`})()}

            <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">SELECT VESSEL</div>`;if(r.length===0)b+=`<div style="padding:14px;text-align:center;background:${e.card};border:1px solid ${e.border};margin-bottom:14px;">
            <div style="font-family:${t};font-size:10px;color:${e.red};">No available vessels</div>
            <div style="font-family:${t};font-size:8px;color:${e.dim};margin-top:4px;">You need a vessel in port, not assigned to another route, with condition ≥ 20%.</div>
        </div>`;else{b+='<div style="display:flex;flex-direction:column;gap:4px;margin-bottom:14px;">';for(const z of r){const F=qe===z.id,U=z.condition>=75?e.green:z.condition>=50?e.gold:e.orange,w=z.fuel>=60?e.green:z.fuel>=30?e.gold:e.red;b+=`<div onclick="raSelectVessel('${z.id}')" style="padding:8px 10px;background:${F?e.accent+"12":e.card};border:1px solid ${F?e.accent+"44":e.border};cursor:pointer;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <span style="font-size:11px;font-weight:600;color:${e.text};">${y(z.vessel_name)}</span>
                    <span style="font-family:${t};font-size:7px;font-weight:700;padding:1px 5px;color:${o.color};background:${o.color}12;border:1px solid ${o.color}25;">${z.vessel_class.toUpperCase()}</span>
                </div>
                <div style="display:flex;gap:12px;font-family:${t};font-size:8px;">
                    <span style="color:${e.dim};">Condition: <span style="color:${U};font-weight:700;">${z.condition}%</span></span>
                    <span style="color:${e.dim};">Fuel: <span style="color:${w};font-weight:700;">${z.fuel}%</span></span>
                    <span style="color:${e.dim};">Capacity: <span style="color:${e.text};font-weight:700;">${(z.capacity_dwt||0).toLocaleString()} ${z.capacity_unit||"DWT"}</span></span>
                </div>
            </div>`}b+="</div>"}const p=Di,h=Pi(i.trade_volume,i.shipping_subsector),x=Math.round((p+h)/2);(ee>h||ee<p)&&(ee=Math.min(h,Math.max(p,ee))),b+=`
            <div style="margin-bottom:14px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
                    <span style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;">PROPOSED SERVICE RATE</span>
                    <span style="font-family:${t};font-size:16px;font-weight:700;color:${e.gold};">${S(ee)}/trip</span>
                </div>
                <input type="range" min="${p}" max="${h}" step="5000" value="${ee}"
                    oninput="raSetRate(this.value)"
                    style="width:100%;accent-color:${e.gold};height:5px;" />
                <div style="display:flex;justify-content:space-between;font-family:${t};font-size:8px;color:${e.dim};margin-top:3px;">
                    <span>Floor (${S(p)})</span>
                    <span style="color:${e.muted};">Mid (${S(x)})</span>
                    <span>Ceiling (${S(h)})</span>
                </div>
            </div>`;const k=i.destDepot?.tier==="own"?"own depot":i.destDepot?.tier==="other"?"other corp's depot +15%":"state depot (+65%)",C=Math.max(1,12/(Math.max(1,m)*2)),T=Math.round(c.revenue*C),$=Math.round(c.fuelPerTrip*C),I=n?n.status==="in_transit"?1.25:n.status==="in_port"?.55:.85:.85,N=Math.round(d*I),q=Math.round(T*Xt),j=T-$-N-q,P=j>0?e.green:j<0?e.red:e.dim;b+=`
            <div style="margin-bottom:14px;">
                <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">ESTIMATED ECONOMICS (PER TRIP)</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:8px 10px;">
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Bid</span>
                        <span style="font-family:${t};font-size:10px;color:${e.text};">${S(c.bid)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Revenue ×${a} (${i.trade_agreement_id?"agreement":"organic"})</span>
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.green};">${S(c.revenue)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Fuel at destination (${k})</span>
                        <span style="font-family:${t};font-size:10px;color:${e.red};">-${S(c.fuelPerTrip)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:5px 0;">
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.text};">NET PER TRIP</span>
                        <span style="font-family:${t};font-size:14px;font-weight:700;color:${v};">${c.netPerTrip>=0?"+":""}${S(c.netPerTrip)}</span>
                    </div>
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">FLEET OVERHEAD (ONGOING)</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:8px 10px;">
                    ${n?`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                              <span style="font-family:${t};font-size:9px;color:${e.dim};">Vessel maintenance · ${y(n.vessel_class||"?")}</span>
                              <span style="font-family:${t};font-size:10px;color:${e.text};">${S(d)} / tick</span>
                           </div>
                           <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                              <span style="font-family:${t};font-size:9px;color:${e.dim};">Accrues during ${m}-tick transit</span>
                              <span style="font-family:${t};font-size:10px;color:${e.text};">${S(u)}</span>
                           </div>
                           <div style="display:flex;justify-content:space-between;padding:5px 0;">
                              <span style="font-family:${t};font-size:9px;color:${e.dim};">Net per trip vs. maint accrued</span>
                              <span style="font-family:${t};font-size:10px;font-weight:700;color:${_?e.green:e.red};">${_?"covers":"short by "+S(Math.max(0,u-c.netPerTrip))}</span>
                           </div>`:`<div style="font-family:${t};font-size:9px;color:${e.dim};line-height:1.5;">Select a vessel to see its per-tick maintenance cost. Maintenance is charged on every corp tick to every vessel regardless of activity, so higher-class ships need higher-paying routes to break even.</div>`}
                </div>
            </div>

            <div style="margin-bottom:14px;">
                <div style="font-family:${t};font-size:10px;color:${e.dim};letter-spacing:1px;margin-bottom:6px;">PROFITABILITY CHECKPOINT (MONTHLY / ACTIVE SHIP)</div>
                <div style="background:${e.card};border:1px solid ${e.border};padding:8px 10px;">
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Expected monthly gross revenue</span>
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.green};">${S(T)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Expected monthly fuel</span>
                        <span style="font-family:${t};font-size:10px;color:${e.red};">-${S($)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Maintenance allocation (${Math.round(I*100)}% state factor)</span>
                        <span style="font-family:${t};font-size:10px;color:${e.red};">-${S(N)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:9px;color:${e.dim};">Incident reserve (${Math.round(Xt*100)}%)</span>
                        <span style="font-family:${t};font-size:10px;color:${e.red};">-${S(q)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:5px 0;">
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.text};">EST. MONTHLY NET</span>
                        <span style="font-family:${t};font-size:13px;font-weight:700;color:${P};">${j>=0?"+":""}${S(j)}</span>
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
    </div>`;const L=document.createElement("div");L.id="ra-modal-overlay",L.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",L.innerHTML=b,L.addEventListener("click",z=>{z.target===L&&vi()}),document.body.appendChild(L)}async function qa(){if(st||!ze||!qe||!f||!M)return;st=!0;const t=ze,e=5e4,{data:i}=await g.from("factions").select("corp_cash_reserves").eq("id",f.id).single(),o=Number(i?.corp_cash_reserves??0);if(o<e){alert("Not enough funds. Application fee: $50k. You have $"+Math.round(o/1e3)+"k."),st=!1;return}try{const a=o-e,{error:s}=await g.from("factions").update({corp_cash_reserves:a}).eq("id",f.id);if(s){alert("Failed to deduct fee.");return}const r={route_id:t.id,faction_id:f.id,vessel_id:qe,proposed_rate:ee,application_fee:e,status:"pending",applied_at_tick:M.current_tick};let{error:n}=await g.from("shipping_applications").insert(r);if(n&&/vessel_id/i.test(n.message||"")){const{vessel_id:l,...c}=r;n=(await g.from("shipping_applications").insert(c)).error}if(n){await g.from("factions").update({corp_cash_reserves:o}).eq("id",f.id);const l=n.code==="23505"||/duplicate key|idx_shipping_applications_unique/i.test(n.message||"");alert(l?"You already have a pending or approved application on this route. Withdraw it from Route Applications before applying again.":"Application failed: "+n.message);return}try{await g.from("event_log").insert({nation_id:t.origin_nation_id,event_name:f.faction_name+" applied to service "+(t.origin_port||"?")+" → "+(t.destination_port||"?"),category:"corporate",description_chosen:f.faction_name+" submitted a shipping application for the "+(t.goods_name||"trade")+" route at a proposed rate of "+S(ee)+"/trip. Vessel: "+(oe.find(l=>l.id===qe)?.vessel_name||"Unknown"),fired_at_tick:M.current_tick})}catch(l){console.warn("[Shipping] Event log failed:",l?.message||l)}vi(),await di(),Z=-1,await bt(),alert("Application submitted! The government will review your application.")}catch(a){alert("Application failed: "+(a.message||"Network error"))}finally{st=!1}}async function Aa(){if(!(Nt||Z<0||!f||!M)){var t=pi(),e=t[Z];if(e){var i=Number(f.shipping_fleet_capacity??0),o=Number(f.shipping_fleet_deployed??0);if(o>=i){alert("No available vessels. Fleet capacity: "+i+", deployed: "+o+".");return}Nt=!0;var a=document.getElementById("ar-claim-btn");a.textContent="CLAIMING...",a.className="ar-claim-btn";try{var{data:s,error:r}=await g.rpc("claim_shipping_route",{p_faction_id:f.id,p_route_id:e.id,p_current_tick:M.current_tick});if(r){alert("Claim failed: "+r.message);return}if(s&&!s.success){alert(s.error||"Claim failed.");return}if(s?.claim_id){var n=(oe||[]).find(function(m){return m.status==="in_port"&&!m.active_claim_id&&m.fuel>=10});if(n){var{error:l}=await g.from("corp_vessels").update({status:"in_transit",active_claim_id:s.claim_id,current_port_nation_id:null}).eq("id",n.id);l&&console.warn("Failed to assign vessel to route:",l.message)}else console.warn("Route claimed but no available vessel with fuel >= 10% to assign.")}try{var c=e.origin_nation?.name||e.origin_nation_id||"Unknown",v=e.destination_nation?.name||e.destination_nation_id||"Unknown",d=e.goods_type||e.cargo_type||"goods";await g.from("event_log").insert({nation_id:f.nation_id,event_name:"Shipping Route Signed",category:"corporate",description_chosen:f.faction_name+" has just signed an agreement to ship "+d+" between "+c+" and "+v+".",fired_at_tick:M.current_tick||0})}catch{}await di(),Z=-1,await Promise.all([bt(),ht(),de()])}catch(m){alert("Claim failed: "+(m.message||"Network error"))}finally{Nt=!1,a.textContent="CLAIM ROUTE",a.className="ar-claim-btn"+(Z>=0?" active":"")}}}}let we=[],oo="ready",Ye=null,vt=-1;async function ht(){if(!f)return;const t=await Co(g,f.id);we=t.claims,oo=t.state,Ye=t.error,Ye&&console.warn("Failed to load active voyages:",Ye.message),ao()}function Ma(t){vt=vt===t?-1:t,ao()}async function Na(t){if(!(Lt||!f||!M)){Lt=!0;try{var{data:e,error:i}=await g.rpc("release_shipping_route",{p_faction_id:f.id,p_claim_id:t,p_current_tick:M.current_tick});if(i){alert("Release failed: "+i.message);return}if(e&&!e.success){alert(e.error||"Release failed.");return}var{error:o}=await g.from("corp_vessels").update({status:"in_port",active_claim_id:null}).eq("active_claim_id",t).eq("faction_id",f.id);o&&console.warn("Failed to free vessel on release:",o.message),vt=-1,await di(),await Promise.all([bt(),ht(),de()])}catch(a){alert("Release failed: "+(a.message||"Network error"))}finally{Lt=!1}}}function ao(){const t=M?.current_tick||0,e=Number(f?.shipping_fleet_capacity??0),i=Number(f?.shipping_fleet_deployed??0),o=f?.corp_subsector||"--";document.getElementById("av-count").textContent=we.length+" ACTIVE";const a=we.reduce((v,d)=>v+Number(d.total_revenue||0),0),s=we.reduce((v,d)=>v+(d.transits_completed||0),0),r=s>0?Math.round(a/s):0;document.getElementById("av-summary").innerHTML=`
        <div class="av-summary__cell">
            <div class="av-summary__label">FLEET</div>
            <div class="av-summary__value" style="color:${i>=e?"var(--orange)":"var(--text-bright)"}">
                ${i} <span style="font-size:9px;color:var(--text-dim)">/ ${e}</span>
            </div>
        </div>
        <div class="av-summary__cell">
            <div class="av-summary__label">TRANSITS</div>
            <div class="av-summary__value" style="color:var(--text-bright)">${s}</div>
        </div>
        <div class="av-summary__cell">
            <div class="av-summary__label">AVG REV/TRIP</div>
            <div class="av-summary__value" style="color:var(--green)">${S(r)}</div>
        </div>`,document.getElementById("av-total-revenue").textContent=S(a),document.getElementById("av-total-revenue").style.color=a>0?"var(--green)":"var(--text-dim)",document.getElementById("av-fleet-status").textContent=i+"/"+e,document.getElementById("av-subsector").textContent=o;const n=document.getElementById("av-list");if(oo==="error"){n.innerHTML='<div class="av-empty"><div class="av-empty__text">'+y(Ye&&Ye.message||"Active voyage data is temporarily unavailable.")+"</div></div>";return}if(we.length===0){n.innerHTML='<div class="av-empty"><div class="av-empty__text">No active voyages.<br>Claim a shipping route to<br>deploy your fleet.</div></div>';return}let l="";for(let v=0;v<we.length;v++){const d=we[v],m=d.shipping_routes||{},u=vt===v,b=(oe||[]).find(q=>q.active_claim_id===d.id)?.status,p=b==="in_port"?"loading":b==="in_transit"?"in_transit":b==="anchored"?"stranded":"idle";let h=p.toUpperCase().replace("_"," "),x="av-status--idle",k="";if(p==="loading")x="av-status--loading",h="LOADING";else if(p==="in_transit"){x="av-status--transit";const q=d.transit_started_tick||t,P=(d.transit_arrives_tick||q+(m.transit_ticks||2))-q,L=Math.max(0,Math.min(t-q,P)),z=P>0?Math.round(L/P*100):0;h="IN TRANSIT ("+L+"/"+P+")",k='<div class="av-transit-bar"><div class="av-transit-bar__fill" style="width:'+z+'%"></div></div>'}const C=Number(d.revenue_per_transit||0),T=Number(d.market_share_pct||0),$=d.transits_completed||0,I=Number(d.total_revenue||0),N=Jt[m.demand_level]||"#6a6660";if(l+='<div class="av-item" onclick="avToggle('+v+')"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;"><div class="av-item__route">'+y(m.origin_port||"?")+" → "+y(m.destination_port||"?")+'</div><span class="av-status '+x+'">'+h+'</span></div><div class="av-item__cargo">'+y(m.goods_name||"Unknown")+" · "+y(m.vessel_class||"?")+"</div>"+k+'<div class="av-item__stats"><div class="av-stat"><div class="av-stat__label">REV/TRIP</div><div class="av-stat__value" style="color:var(--green)">'+S(C)+'</div></div><div class="av-stat"><div class="av-stat__label">SHARE</div><div class="av-stat__value">'+T.toFixed(1)+'%</div></div><div class="av-stat"><div class="av-stat__label">TRANSITS</div><div class="av-stat__value">'+$+'</div></div><div class="av-stat"><div class="av-stat__label">TOTAL REV</div><div class="av-stat__value" style="color:var(--green)">'+S(I)+"</div></div></div>",u){l+='<div class="av-item__detail"><div class="av-detail-row"><span class="av-detail-label">ORIGIN</span><span class="av-detail-value">'+y(m.origin_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">DESTINATION</span><span class="av-detail-value">'+y(m.destination_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE SECTOR</span><span class="av-detail-value">'+y((m.trade_sector||"").replace(/_/g," ").toUpperCase())+'</span></div><div class="av-detail-row"><span class="av-detail-label">SCOPE</span><span class="av-detail-value">'+y(m.scope||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRANSIT TIME</span><span class="av-detail-value">'+(m.transit_ticks||"?")+' ticks</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE VOLUME</span><span class="av-detail-value">'+S(Number(m.trade_volume||0))+'</span></div><div class="av-detail-row"><span class="av-detail-label">TARIFF</span><span class="av-detail-value">'+Number(m.tariff_rate||0).toFixed(1)+'%</span></div><div class="av-detail-row"><span class="av-detail-label">COMPETITION</span><span class="av-detail-value">'+(m.competition_count??0)+' corps</span></div><div class="av-detail-row"><span class="av-detail-label">DEMAND</span><span class="av-detail-value" style="color:'+N+'">'+(m.demand_level||"?")+"</span></div>"+(m.trade_agreement_name?'<div class="av-detail-row"><span class="av-detail-label">AGREEMENT</span><span class="av-detail-value" style="color:var(--teal)">'+y(m.trade_agreement_name)+"</span></div>":"")+'<div class="av-detail-row"><span class="av-detail-label">CLAIMED</span><span class="av-detail-value">Tick '+(d.claimed_at_tick||"?")+"</span></div>";var c=(oe||[]).find(function(q){return q.active_claim_id===d.id});!c&&p==="loading"?l+=`<div style="padding:6px 8px;margin-top:4px;background:rgba(200,168,50,0.06);border:1px solid rgba(200,168,50,0.15);text-align:center;"><div style="font-family:var(--font-mono);font-size:9px;color:var(--orange);font-weight:700;margin-bottom:4px;">NO VESSEL ASSIGNED</div><button class="av-action-btn" style="background:var(--teal);color:#fff;border-color:var(--teal);width:100%;" onclick="event.stopPropagation();openAssignVesselModal('`+d.id+"','"+(m.vessel_class||"")+`')">ASSIGN VESSEL</button></div>`:c&&(l+='<div style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:var(--bg-card);border:1px solid var(--border-main);"><div><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">ASSIGNED VESSEL</div><div style="font-size:11px;font-weight:700;color:var(--text-bright);">'+y(c.vessel_name||"Unknown")+'</div></div><div style="display:flex;gap:10px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(c.fuel>50?"#5c5":c.fuel>20?"#ca5":"#c55")+'">'+(c.fuel||0)+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(c.condition>50?"#5c5":c.condition>30?"#ca5":"#c55")+'">'+(c.condition||0)+"%</div></div></div></div>"),l+=`<button class="av-action-btn release" onclick="event.stopPropagation();avRelease('`+d.id+`')">RELEASE ROUTE</button></div>`}l+="</div>"}n.innerHTML=l}let Qe=[];const La={stranded:{label:"STRANDED"},mechanical_failure:{label:"MECHANICAL"},collision:{label:"COLLISION"},fire:{label:"FIRE"},piracy:{label:"PIRACY"},storm_damage:{label:"STORM"}};async function yi(){if(!f){Qe=[],Ni();return}const{data:t,error:e}=await g.from("vessel_incidents").select("id, vessel_id, nation_id, incident_type, incident_tick, description, severity, status, corp_vessels!vessel_id(id, vessel_name, vessel_class)").eq("faction_id",f.id).eq("status","pending").order("incident_tick",{ascending:!1});e?(console.warn("[VesselIncidents] load failed:",e.message),Qe=[]):Qe=t||[],Ni()}function Ni(){const t=document.getElementById("vi-count"),e=document.getElementById("vi-list");if(!t||!e)return;const i=Qe||[];if(t.textContent=i.length+" PENDING",i.length===0){e.innerHTML=`<div class="vi-empty">
            <div class="vi-empty__text">No pending incidents.<br>Claim-eligible events on your fleet appear here.</div>
        </div>`;return}e.innerHTML=i.map(o=>{const a=La[o.incident_type]||{label:(o.incident_type||"INCIDENT").toUpperCase()},s=o.corp_vessels?.vessel_name||"Unknown Vessel",r=o.severity==="total",n=o.severity?`<span style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.8px;padding:1px 6px;margin-left:4px;color:${r?"#000":"var(--amber)"};background:${r?"var(--red)":"var(--amber-faint)"};border:1px solid ${r?"var(--red)":"var(--amber-border)"};">${r?"TOTAL LOSS":"PARTIAL"}</span>`:"";return`<div class="vi-item" data-incident-id="${o.id}">
            <div class="vi-item__head">
                <span class="vi-item__vessel">${y(s)}</span>
                <span class="vi-item__tick">Tick ${o.incident_tick}</span>
            </div>
            <div style="display:flex;align-items:center;gap:0;margin-bottom:6px;flex-wrap:wrap;">
                <span class="vi-item__type" style="margin-bottom:0;">${y(a.label)}</span>
                ${n}
            </div>
            <div class="vi-item__desc">${y(o.description||"")}</div>
            <div class="vi-item__actions">
                <button class="vi-action-btn vi-action-btn--dismiss" onclick="viDismissIncident('${o.id}')">DISMISS</button>
                <button class="vi-action-btn vi-action-btn--file" onclick="viFileClaim('${o.id}')">FILE CLAIM</button>
            </div>
        </div>`}).join("")}let Ue=!1;async function za(t){if(Ue)return;const e=Qe.find(i=>i.id===t);if(e){Ue=!0;try{const{data:i}=await g.from("subsidiary_auto_policies").select("id, principal, deductible_pct, lender_faction_id, policy_terms").eq("insured_vessel_id",e.vessel_id).eq("status","active").limit(1).maybeSingle(),{data:o}=i?{data:null}:await g.from("finance_active_loans").select("id, principal, deductible_pct, lender_faction_id").eq("insured_vessel_id",e.vessel_id).eq("status","current").limit(1).maybeSingle(),a=i||o;if(!a){alert("No active insurance policy covers this vessel. Consider purchasing coverage before the next incident.");return}const s=e.corp_vessels?.vessel_name||"vessel",r=Number(a.principal)||0,n=e.severity==="total"||e.incident_type==="stranded"||!e.severity,l=Math.round(n?r:r*.35),c=`File claim on ${s}?

Severity:    ${n?"Total loss":"Partial loss"}
Claim:       $${l.toLocaleString()}
Deductible:  ${a.deductible_pct||10}%`;if(!confirm(c))return;const v=i?"auto":"deal",d=M?.current_tick||0,{data:m,error:u}=await g.from("insurance_claims").insert({policy_id:a.id,policy_source:v,claimant_faction_id:f.id,insurer_faction_id:a.lender_faction_id,insured_vessel_id:e.vessel_id,claim_amount:l,claim_reason:e.description||`${s} — incident ${e.incident_type}`,policy_terms:a.policy_terms||null,deductible_pct:Number(a.deductible_pct)||10,status:"filed",filed_at_tick:d}).select("id").single();if(u){alert("Failed to file claim: "+u.message);return}const{error:_}=await g.from("vessel_incidents").update({status:"filed",filed_at_tick:d,filed_claim_id:m?.id||null}).eq("id",e.id);_&&console.warn("[VesselIncidents] incident update after file failed:",_.message);try{await g.from("event_log").insert({nation_id:e.nation_id||f.nation_id,faction_id:f.id,event_name:`${f.faction_name||"A corporation"} filed an insurance claim`,category:"corporate",description_chosen:`${f.faction_name||"Corporation"} filed a claim on ${s} for $${Math.round(l).toLocaleString()}.`,fired_at_tick:d})}catch{}await yi()}catch(i){console.error("[VesselIncidents] fileClaim error:",i),alert("File claim failed: "+(i?.message||"unknown error"))}finally{Ue=!1}}}window.viFileClaim=za;async function Ra(t){if(!Ue&&confirm("Dismiss this incident without filing a claim? The vessel remains in whatever state the tick processor left it.")){Ue=!0;try{const{error:e}=await g.from("vessel_incidents").update({status:"dismissed",filed_at_tick:M?.current_tick||0}).eq("id",t);if(e){alert("Dismiss failed: "+e.message);return}await yi()}finally{Ue=!1}}}window.viDismissIncident=Ra;function Oa(t,e){const i=(oe||[]).filter(function(s){return s.status==="in_port"&&!s.active_claim_id&&s.fuel>=15&&s.condition>=20});let o;i.length===0?o='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No available vessels.<br>Ships must be in port with 15%+ fuel and 20%+ condition.</div>':o=i.map(function(s,r){var n=s.fuel>50?"#5c5":s.fuel>20?"#ca5":"#c55",l=s.condition>50?"#5c5":s.condition>30?"#ca5":"#c55";return`<div style="padding:10px 14px;border-bottom:1px solid var(--border-0);cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="assignVesselToRoute('`+t+"','"+s.id+`')"><div><div style="font-size:14px;font-weight:700;color:var(--text-bright);">`+y(s.vessel_name||"Unnamed")+'</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+y(s.vessel_class||"?")+" · "+(s.capacity_dwt||0).toLocaleString()+' DWT</div></div><div style="display:flex;gap:14px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+n+'">'+s.fuel+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+l+'">'+s.condition+'%</div></div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--teal);padding:4px 12px;border:1px solid var(--teal);cursor:pointer;">ASSIGN</div></div></div>'}).join("");var a=document.createElement("div");a.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;",a.onclick=function(s){s.target===a&&a.remove()},a.innerHTML='<div style="width:560px;max-width:95vw;max-height:80vh;background:var(--bg-panel);border:1px solid var(--border-main);display:flex;flex-direction:column;"><div style="padding:12px 16px;border-bottom:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:space-between;align-items:center;"><span style="font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:var(--teal);">ASSIGN VESSEL</span><span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+i.length+' available</span></div><div style="flex:1;overflow-y:auto;">'+o+`</div><div style="padding:10px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);text-align:right;"><button onclick="this.closest('div[style*=fixed]').remove()" style="padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);background:transparent;border:1px solid var(--border-main);cursor:pointer;">CANCEL</button></div></div>`,document.body.appendChild(a)}async function Pa(t,e){try{var{error:i}=await g.from("corp_vessels").update({status:"in_port",active_claim_id:t}).eq("id",e).eq("faction_id",f.id);if(i){alert("Assignment failed: "+i.message);return}var o=document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]');o&&o.remove(),await Promise.all([ht(),de()])}catch(a){alert("Assignment failed: "+(a.message||"Network error"))}}window.openAssignVesselModal=Oa;window.assignVesselToRoute=Pa;function gi(){const t=ie.reduce((n,l)=>n+(l.owned||0),0),e=ie.reduce((n,l)=>n+(l.deployed||0),0),i=ko(ie),o=t-e;document.getElementById("eq-count").textContent=t+" UNITS",document.getElementById("eq-summary").innerHTML=`
        <div class="eq-summary__cell">
            <div class="eq-summary__label">DEPLOYED</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--text-bright)">
                ${e} <span style="font-size:9px;color:var(--text-dim)">/ ${t}</span>
            </div>
        </div>
        <div class="eq-summary__cell">
            <div class="eq-summary__label">AVAILABLE</div>
            <div class="eq-summary__value" style="font-size:14px;color:${o===0?"var(--orange)":"var(--green)"}">
                ${o}
            </div>
        </div>
        <div class="eq-summary__cell">
            <div class="eq-summary__label">MAINT/TICK</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--red)">
                ${S(i)}
            </div>
        </div>`;const a={};for(const n of ie)a[n.equipment_key]=n;let s="";for(let n=1;n<=3;n++){const l=Xe[n],c=Ut(n),v=Gt===n,d=c.reduce((u,_)=>u+(a[_.key]?.owned||0),0),m=c.reduce((u,_)=>u+(a[_.key]?.deployed||0),0);if(s+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${n})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${v?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${l.color}">${y(l.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${l.color};border:1px solid ${l.color}33;background:${l.color}0a">${l.tag}</span>
            </div>
            ${d>0?`<span class="eq-tier-hdr__count">${m}/${d}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,v)for(const u of c){const _=a[u.key],b=_?.owned||0,p=_?.deployed||0,h=_?.condition||0,x=u.maintenancePerUnit*b,k=b-p,C=b>0&&k===0,T=b>0&&h<65,$=Ri(h),I=_?.assigned_projects||[],N=I.length>0?I.map(q=>q.contract_name||"Project").join(", ").slice(0,30):b>0&&p>0?p+" project"+(p>1?"s":""):"—";s+=`<div class="eq-row${b===0?" unowned":""}">`,s+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${b===0?" dim":""}">${y(u.name)}</span>
                        ${T?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${b>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${C?"var(--orange)":"var(--green)"}">${k}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${p}/${b}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,b>0?s+=`<div class="eq-detail">
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
                            <div class="eq-detail__value" style="color:var(--text-muted)">${y(N)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${S(x)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:s+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',s+="</div>"}}document.getElementById("eq-list").innerHTML=s;const r=[1,2,3].map(n=>{const l=Xe[n],c=Ut(n).reduce((v,d)=>v+(a[d.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${c>0?l.color+"33":"var(--border-0)"};background:${c>0?l.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${l.color}">${l.tag}</div>
            <div class="eq-footer__tier-count" style="color:${c>0?"var(--text-bright)":"var(--text-dim)"}">${c}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${S(i)}</div>
        </div>
        <div class="eq-footer__tiers">${r}</div>`}function Da(t){Gt=Gt===t?-1:t,gi()}async function no(){if(!f)return;const{data:t,error:e}=await g.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",f.id);e?(console.warn("Failed to load equipment:",e.message),ie=[]):ie=t||[],gi()}async function Ba(){const{data:{user:t}}=await g.auth.getUser();if(!t){window.location.href="login.html";return}const e=new URLSearchParams(location.search).get("faction_id");if(!!e){const{data:d,error:m}=await g.from("factions").select("*").eq("id",e).single();m?console.warn("[Inspector] faction fetch failed:",m.message):d?.faction_type==="corporation"&&(f=d)}if(!f){const{data:d}=await g.from("factions").select("*").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`);he=(d||[]).filter(u=>u.nation_id);const m=sessionStorage.getItem("active_faction_id");if(f=he.find(u=>u.id===m)||he.find(u=>u.faction_type==="corporation")||he[0],!f){await g.auth.signOut(),window.location.href="login.html";return}if(f.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(f.corp_sector!=="Shipping"){const u=Oi[f.corp_sector];if(u){window.location.href=u;return}}}const[o,a]=await Promise.all([f.nation_id?g.from("nations").select("*").eq("id",f.nation_id).single():Promise.resolve({data:null}),g.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);o.error&&console.warn("Nation load failed:",o.error.message),o.data&&(R=o.data),a.error&&console.warn("Shard load failed:",a.error.message),M=a.data;let s=0;if(f?.id){const{data:d}=await g.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",f.id).in("status",["open","bidding"]);if(d)for(const m of d)s+=(m.contract_bids||[]).length}const r=document.getElementById("corp-topbar-container");if(r){const{renderCorpTopBar:d}=await $o(async()=>{const{renderCorpTopBar:u}=await import("./corp-topbar-CPI0igZM.js");return{renderCorpTopBar:u}},__vite__mapDeps([0,1])),m={};s>0&&(m.home={color:"#c8a832",title:s+" pending bid"+(s!==1?"s":"")+" on your projects"}),d(r,{faction:f,shard:M,activeTab:"operations",allUserFactions:he,badges:m})}if(M){if(document.getElementById("game-date").textContent=M.current_date||"—",document.getElementById("tick-number").textContent=M.current_tick||"—",M.next_tick_at){const m=(Number(M.tick_interval_hours)||8)*36e5,u=new Date(M.next_tick_at).getTime(),b=u-m+m/2;Wt=new Date(b>Date.now()?b:u+m/2),No()}const d=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");d&&(d.textContent="Next Corp Tick")}const n=document.getElementById("topbar-cash");n&&(n.textContent="CASH: "+eo(Number(f.corp_cash_reserves??0)));const l=document.getElementById("topbar-ap");l&&(l.style.display="none");const c=document.getElementById("nation-pill");c&&(c.textContent=(R?.name||f.nation||"—").toUpperCase());const v=document.getElementById("corp-faction-dropdown");if(v){let d="";for(const m of he){const u=m.id===f.id,_=m.faction_type==="corporation"?"CORP":"PARTY",b=m.faction_type==="corporation"?"var(--teal)":"var(--amber)";d+=`<div class="corp-dd-item${u?" active":""}" onclick="switchToFaction('${m.id}', '${m.faction_type}')">
                <span class="corp-dd-type" style="color:${b}">${_}</span>
                <span class="corp-dd-name">${y(m.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${y(m.abbreviation||"—")}]</span>
            </div>`}v.innerHTML=d}await Promise.all([bt(),ht(),de(),bi(),co(),yi(),Ao()]),wo(f,R,M);try{await ho(g,{faction:f,nation:R,shard:M},"auto-services-container")}catch(d){console.error("[CorpOps] Auto-services init failed:",d)}document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}async function ja(){await g.auth.signOut(),window.location.href="login.html"}function Fa(){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.toggle("open")}function Ua(t,e){const i=document.getElementById("corp-faction-dropdown");if(i&&i.classList.remove("open"),sessionStorage.setItem("active_faction_id",t),e==="corporation"){const o=(he||[]).find(a=>a.id===t);window.location.href=Oi[o?.corp_sector]||"corp-operations.html"}else window.location.href="dashboard.html"}document.addEventListener("click",t=>{const e=document.getElementById("faction-switcher"),i=document.getElementById("corp-faction-dropdown");i&&e&&!e.contains(t.target)&&i.classList.remove("open")});document.addEventListener("keydown",t=>{t.key==="Escape"&&ot()});window.doLogout=ja;window.toggleCorpDropdown=Fa;window.switchToFaction=Ua;window.setFilter=Lo;window.arSetFilter=ya;window.arSelectRoute=ba;window.arClaimRoute=Aa;window.arApplyToService=Ca;window.raClose=vi;window.raSelectVessel=Ia;window.raSetRate=Sa;window.raSubmitApplication=qa;window.avToggle=Ma;window.avRelease=Na;window.openContractDetail=Yi;window.closeContractDetail=ot;window.toggleWhRow=Zo;window.toggleEqTier=Da;window.switchEmNation=ra;window.setEmType=la;window.setEmListing=da;window.setEmQty=ca;window.purchaseEquipment=pa;window.setPrMat=ia;window.setPrTier=oa;window.setPrQty=aa;window.purchaseMaterial=na;let me=null,ye={},Y=120,ge=15,Zt={},je=[];async function Ha(){if(!Se)return;if(He[Se.id]){alert("You already have a bid on this contract. Retract it first if you want to re-bid.");return}me=Se,Zt={};try{const{data:i}=await g.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",f.id);for(const o of i||[])Zt[lt(o.material_key)]=Number(o.quantity||0)}catch{}je=[];try{const{data:i}=await g.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",me.id).in("status",["pending","won"]);je=(i||[]).filter(o=>o.faction_id!==f?.id).map(o=>({name:o.factions?.faction_name||"Unknown",ticker:o.factions?.corp_ticker||"???",price:Number(o.bid_price||0),quality:Number(o.estimated_quality||0),status:o.status}))}catch{}ye={};const t=me.required_materials||{};for(const i of Object.keys(t))ye[i]="STD";const e=me.required_workforce||{};Y=Number(e.general||0)+Number(e.skilled||0)||120,ge=15,ot(),$t()}function _i(){document.getElementById("bid-assembly-overlay")?.remove(),me=null}function Va(t,e){ye[t]=e,$t()}function Ga(t){Y=t,$t()}function Wa(t){ge=t,$t()}function $t(){if(document.getElementById("bid-assembly-overlay")?.remove(),!me)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},i=me,o=i.issuer_type==="GOVERNMENT",a=R?.name||f?.nation||"—",s=Number(i.budget_ceiling||0),r=Number(i.timeline_ticks||8),n=i.required_materials||{},l=Object.keys(n),c={LOW:.5,STD:1,HIGH:2},v={LOW:e.orange,STD:e.yellow,HIGH:e.greenBright},d={LOW:"Low",STD:"Standard",HIGH:"High"},m={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},u=Zt||{};let _=0,b="";for(const D of l){const W=Number(n[D]||0),wi=ye[D]||"STD",ki=m[D]||3e5,uo=c[wi],yo=Math.round(ki*uo),Ei=W*yo;_+=Ei;const go=D.replace(/_/g," ").replace(/\b\w/g,xe=>xe.toUpperCase()),Ti=Number(u[D]||0),Tt=Math.max(0,W-Ti),_o=Tt===0?e.greenBright:Tt<W?e.yellow:e.red,xo=Tt===0?"✓ IN STOCK":`${Ti}/${W}`;b+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${e.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${e.text}">${go}</span>
                <div style="font-family:${t};font-size:7px;color:${_o};margin-top:1px">${xo}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${t};font-size:9px;color:${e.muted}">${W.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(xe=>{const Ct=wi===xe,Ci=v[xe],bo=E(Math.round(ki*c[xe]));return`<span onclick="bidSetGrade('${D}','${xe}')" style="padding:2px 6px;font-family:${t};font-size:7px;font-weight:700;cursor:pointer;color:${Ct?"#000":e.dim};background:${Ct?Ci:"transparent"};border:1px solid ${Ct?Ci:e.border}" title="${bo}/unit">${d[xe]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${t};font-size:10px;color:${e.text}">${E(Ei)}</span></div>
        </div>`}const p=i.required_workforce||{},h=Number(p.general||0)+Number(p.skilled||0)||100,x=Math.max(40,Math.round(h*.5)),k=h*2,C=[x,Math.round(h*.75),h,Math.round(h*1.5),k],T=Math.max(0,Math.min(1,(Y-x)/(k-x||1))),$=r,I=Math.round(4.5-T*8),N=Math.max(Math.round($*.6),$+I),q=I>0?`+${I}mo`:I<0?`${I}mo`:"On schedule",j=I>0?e.red:I<0?e.greenBright:e.yellow,P=15200,L=Y*P*N,z=s,U=[{name:"Municipal Zoning Approval",cost:18e4,ticks:2,required:!0},{name:"Structural Engineering Cert.",cost:24e4,ticks:3,required:!0},{name:"Environmental Impact Assessment",cost:34e4,ticks:8,required:z>2e7},{name:"Seismic Resilience Compliance",cost:21e4,ticks:4,required:z>5e7},{name:"Heritage Conservation Review",cost:16e4,ticks:6,required:!1},{name:"Fire Safety Certification",cost:12e4,ticks:2,required:z>1e7}].filter(D=>D.required),w=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),A=U.filter(D=>!w.has(D.name)).reduce((D,W)=>D+W.cost,0),B=4e5,H=_+L+A+B,X=Math.round(H*(ge/100)),ce=H+X,V=ce>s,kt=X,_e=V?0:Math.max(0,Math.min(100,Math.round(100-ce/s*100+30))),$i=_e>70?e.greenBright:_e>40?e.yellow:_e>0?e.orange:e.red,mo=V?"OVER CEILING":_e>70?"STRONG":_e>40?"COMPETITIVE":_e>20?"WEAK":"UNLIKELY",Et=Object.values(ye),pe=Et.length>0?Math.round(Et.reduce((D,W)=>D+(W==="HIGH"?85:W==="STD"?65:45),0)/Et.length):50,at=pe>=75?e.greenBright:pe>=50?e.yellow:pe>=25?e.orange:e.red,vo=pe>=75?"EXCELLENT":pe>=50?"FAIR":pe>=25?"POOR":"BAD",Oe=document.createElement("div");Oe.id="bid-assembly-overlay",Oe.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",Oe.addEventListener("click",D=>{D.target===Oe&&_i()}),Oe.innerHTML=`
    <div style="width:740px;max-height:94vh;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <!-- HEADER -->
        <div style="padding:10px 16px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 8px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${a.toUpperCase()}</span>
                    <span style="font-size:14px;font-weight:700;color:${e.text}">${i.name}</span>
                    <span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 6px;color:${o?e.accentBright:e.gold};background:${o?"rgba(163,176,126,0.1)":"rgba(200,168,50,0.08)"};border:1px solid ${o?"rgba(163,176,126,0.2)":"rgba(200,168,50,0.2)"}">${o?"GOV":"PRIVATE"}</span>
                </div>
                <span onclick="closeBidAssembly()" style="font-family:${t};font-size:14px;color:${e.dim};cursor:pointer;padding:0 4px">×</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                <span style="font-family:${t};font-size:9px;color:${e.dim}">${i.project_code||"—"}</span>
                <span style="font-family:${t};font-size:9px;color:${e.dim}">·</span>
                <span style="font-size:10px;color:${e.accent}">${i.issuer_name||"—"}</span>
                <span style="font-family:${t};font-size:9px;color:${e.dim}">·</span>
                <span style="font-family:${t};font-size:9px;color:${e.muted}">Ceiling: <span style="color:${e.text};font-weight:700">${E(s)}</span></span>
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
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${E(_)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Labor</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim};width:60px">WORKERS</span>
                        <div style="display:flex;gap:3px;">
                            ${C.map(D=>`<span onclick="bidSetWorkers(${D})" style="padding:2px 8px;font-family:${t};font-size:8px;font-weight:700;cursor:pointer;color:${Y===D?"#000":e.dim};background:${Y===D?e.accent:"transparent"};border:1px solid ${Y===D?e.accent:e.border}">${D}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">${Y} × $${P.toLocaleString()}/tick × ${N} ticks</span>
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${E(L)}</span>
                    </div>
                    <div style="margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <span style="font-family:${t};font-size:8px;color:${e.dim}">WORKFORCE REQUIRED</span>
                        </div>
                        <div style="display:flex;gap:12px;">
                            <span style="font-family:${t};font-size:7px;color:#8b9a6b">General: ${Math.ceil(Y*.8)}</span>
                            <span style="font-family:${t};font-size:7px;color:#c8a832">Skilled: ${Math.ceil(Y*.15)}</span>
                            <span style="font-family:${t};font-size:7px;color:#c84">Innovative: ${Math.ceil(Y*.05)}</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid ${e.border};">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">COMPLETION TIMELINE</span>
                        <span style="font-family:${t};font-size:10px;font-weight:700;color:${j}">${N}mo <span style="font-size:8px;opacity:0.7">(${q})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${U.map(D=>{const W=w.has(D.name);return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${e.border};">
                        <div style="flex:1;display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${t};font-size:8px;font-weight:700;color:${W?e.greenBright:e.orange}">${W?"✓":"○"}</span>
                            <span style="font-size:10px;color:${W?e.muted:e.text}">${D.name}</span>
                        </div>
                        ${W?`<span style="font-family:${t};font-size:8px;color:${e.greenBright}">HELD</span>`:`<div style="text-align:right">
                                <span style="font-family:${t};font-size:9px;color:${e.redDim}">${E(D.cost)}</span>
                                <span style="font-family:${t};font-size:7px;color:${e.dim};margin-left:4px">${D.ticks}t</span>
                            </div>`}
                    </div>`}).join("")}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${t};font-size:9px;color:${e.muted}">PERMIT COSTS</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${E(A)}</span>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${t};font-size:9px;color:${e.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.text}">${E(B)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v:_},{l:"Labor",v:L},{l:"Permits",v:A},{l:"Overhead",v:B}].map(D=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-size:10px;color:${e.muted}">${D.l}</span>
                    <span style="font-family:${t};font-size:10px;color:${e.redDim}">${E(D.v)}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:rgba(204,85,85,0.03);">
                    <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.text}">TOTAL EST. COST</span>
                    <span style="font-family:${t};font-size:13px;font-weight:700;color:${e.red}">${E(H)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.gold};text-transform:uppercase">Set Markup</span>
                </div>
                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="font-family:${t};font-size:9px;color:${e.dim}">MARKUP %</span>
                        <span style="font-family:${t};font-size:16px;font-weight:700;color:${e.gold}">${ge}%</span>
                    </div>
                    <input type="range" min="0" max="40" step="1" value="${ge}" oninput="bidSetMarkup(+this.value)" style="width:100%;accent-color:${e.gold};height:6px;" />
                    <div style="display:flex;justify-content:space-between;font-family:${t};font-size:7px;color:${e.dim};margin-top:2px;">
                        <span>0% (at cost)</span><span>40% (maximum)</span>
                    </div>
                </div>

                <div style="padding:10px 14px;border-bottom:1px solid ${e.border};background:${V?"rgba(204,85,85,0.04)":"rgba(200,168,50,0.03)"};">
                    <div style="font-family:${t};font-size:8px;color:${e.dim};margin-bottom:4px">YOUR BID PRICE</div>
                    <div style="font-family:${t};font-size:22px;font-weight:700;color:${V?e.red:e.gold}">${E(ce)}</div>
                    ${V?`<div style="font-family:${t};font-size:8px;font-weight:700;color:${e.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${E(s)})</div>`:""}
                </div>

                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">PROJECTED PROFIT</span>
                        <span style="font-family:${t};font-size:14px;font-weight:700;color:${kt>0?e.greenBright:e.dim}">+${E(kt)}</span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Bid Assessment</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">COMPETITIVENESS</span>
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${$i}">${mo}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${_e}%;height:100%;background:${$i}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${t};font-size:11px;font-weight:700;color:${at}">${pe}</span>
                            <span style="font-family:${t};font-size:8px;color:${e.dim}">/100</span>
                            <span style="font-family:${t};font-size:8px;font-weight:700;color:${at}">${vo}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${e.border}"><div style="width:${pe}%;height:100%;background:${at}"></div></div>
                    <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="font-family:${t};font-size:8px;color:${e.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${je.length===0?`<div style="font-family:${t};font-size:8px;color:${e.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${je.map(D=>`<span style="padding:2px 6px;font-family:${t};font-size:7px;color:${e.muted};background:${e.card};border:1px solid ${e.border};">${D.name} <span style="color:${e.dim}">Q:${D.quality}</span></span>`).join("")}
                        </div>
                        <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:3px">${je.length} competing bid${je.length!==1?"s":""}. Bid prices are sealed until resolution.</div>`}
                    <div style="font-family:${t};font-size:7px;color:${e.dim};margin-top:3px">Higher reputation bidders may win at higher prices.</div>
                </div>
                <div style="flex:1"></div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">YOUR BID</div><div style="font-family:${t};font-size:14px;font-weight:700;color:${V?e.red:e.gold}">${E(ce)}</div></div>
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">EST. PROFIT</div><div style="font-family:${t};font-size:14px;font-weight:700;color:${e.greenBright}">+${E(kt)}</div></div>
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${t};font-size:14px;font-weight:700;color:${at}">${pe}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${t};font-size:10px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">CANCEL</div>
                <div onclick="${V?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${t};font-size:10px;font-weight:700;letter-spacing:1px;color:${V?e.dim:"#000"};background:${V?e.border:e.gold};cursor:${V?"not-allowed":"pointer"};opacity:${V?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(Oe)}let zt=!1;async function Ya(){if(zt||!me)return;const t=me,e=t.required_materials||{},i=Object.keys(e),o=Number(t.budget_ceiling||0),a=Number(t.timeline_ticks||8),s={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},r={LOW:.5,STD:1,HIGH:2};let n=0;for(const P of i){const L=Number(e[P]||0),z=ye[P]||"STD",F=s[P]||3e5;n+=L*Math.round(F*r[z])}const l=15200,c=t.required_workforce||{},v=Number(c.general||0)+Number(c.skilled||0)||100,d=Math.max(40,Math.round(v*.5)),m=v*2,u=Math.max(0,Math.min(1,(Y-d)/(m-d||1))),_=Math.round(4.5-u*8),b=Math.max(Math.round(a*.6),a+_),p=Y*l*b,h=o,x=[{name:"Municipal Zoning Approval",cost:18e4,required:!0},{name:"Structural Engineering Cert.",cost:24e4,required:!0},{name:"Environmental Impact Assessment",cost:34e4,required:h>2e7},{name:"Seismic Resilience Compliance",cost:21e4,required:h>5e7},{name:"Fire Safety Certification",cost:12e4,required:h>1e7}],k=new Set(["Municipal Zoning Approval","Structural Engineering Cert."]),C=x.filter(P=>P.required&&!k.has(P.name)).reduce((P,L)=>P+L.cost,0),$=n+p+C+4e5,I=Math.round($*(ge/100)),N=$+I;if(N>o){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const q=Object.values(ye),j=q.length>0?Math.round(q.reduce((P,L)=>P+(L==="HIGH"?85:L==="STD"?65:45),0)/q.length):50;if(confirm('Submit bid for "'+t.name+`"?

Bid Price: `+E(N)+`
Est. Cost: `+E($)+`
Markup: `+ge+"% ("+E(I)+`)
Quality: `+j+`/100
Workers: `+Y+`

Once submitted, your bid cannot be changed.`)){zt=!0;try{const{data:P}=await g.from("shard").select("current_tick").eq("name","Alpha Shard").single(),L=P?.current_tick||0,z={};for(const U of i)z[U]=ye[U]||"STD";const{error:F}=await g.from("contract_bids").insert({contract_id:t.id,faction_id:f.id,bid_price:N,material_grades:z,labor_count:Y,markup_pct:ge,estimated_cost:$,estimated_quality:j,status:"pending",submitted_at_tick:L});if(F)throw F;t.status==="open"&&await g.from("construction_contracts").update({status:"bidding"}).eq("id",t.id).eq("status","open"),_i(),alert(`Bid submitted successfully!

Contract: `+t.name+`
Your Bid: `+E(N)+`
Quality: `+j+`/100

Bids will be resolved when the bidding window closes (`+(t.bidding_ends_tick?"tick "+t.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof Le=="function"&&await Le()}catch(P){alert("Bid submission failed: "+P.message)}finally{zt=!1}}}window.openBidAssembly=Ha;window.closeBidAssembly=_i;window.bidSetGrade=Va;window.bidSetWorkers=Ga;window.bidSetMarkup=Wa;window.submitBidAssembly=Ya;let Rt=!1;async function Qa(t){if(Rt)return;const e=1e6,i=Number(f?.corp_cash_reserves??0);if(i<e){alert("Cannot retract — you need at least $1M in cash reserves to cover the retraction penalty.");return}if(confirm(`Retract your bid?

This will cost $1M as a retraction penalty.
This action cannot be undone.`)){Rt=!0;try{const o=i-e,{error:a}=await g.from("factions").update({corp_cash_reserves:o}).eq("id",f.id);if(a)throw a;const{error:s}=await g.from("contract_bids").delete().eq("contract_id",t).eq("faction_id",f.id);if(s)throw s;f.corp_cash_reserves=o,typeof subUpdateTopbarCash=="function"&&subUpdateTopbarCash(o),alert("Bid retracted. $1M penalty applied."),ot(),await Le()}catch(o){alert("Failed to retract bid: "+(o.message||"Unknown error"))}finally{Rt=!1}}}window.retractBid=Qa;let et=[],Te=0,le=null,Ot=!1,Pt=!1,Dt=!1;async function Ka(){if(!Se||Pt)return;Pt=!0,le=Se,Te=0;const{data:t,error:e}=await g.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",le.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(Pt=!1,e){alert("Failed to load bids: "+e.message);return}et=(t||[]).map(i=>({...i,corp:i.factions?.faction_name||"Unknown",abbr:i.factions?.corp_ticker||"???",subsector:i.factions?.corp_subsector||"—"})),ot(),so()}function wt(){document.getElementById("bid-review-overlay")?.remove(),le=null}function Ja(t){Te=t,so()}async function Xa(){if(Ot||et.length===0)return;const t=et[Te];if(!(!t?.id||!t.faction_id)&&confirm("Accept bid from "+t.corp+`?

Bid Price: `+E(t.bid_price)+`
Quality: `+t.estimated_quality+`/100
Workers: `+t.labor_count+`

This will award the contract. The project begins immediately.`)){Ot=!0;try{const{data:e}=await g.from("shard").select("current_tick").eq("name","Alpha Shard").single(),i=e?.current_tick||0,{error:o}=await g.from("contract_bids").update({status:"won"}).eq("id",t.id);if(o)throw o;const{error:a}=await g.from("contract_bids").update({status:"lost"}).eq("contract_id",le.id).neq("id",t.id);if(a)throw a;const{error:s}=await g.from("construction_contracts").update({status:"awarded",awarded_to_faction:t.faction_id,awarded_at_tick:i}).eq("id",le.id);if(s)throw s;wt(),alert("Contract awarded to "+t.corp+`!

Bid: `+E(t.bid_price)+`
Project begins immediately.`),typeof Le=="function"&&await Le()}catch(e){alert("Failed to accept bid: "+(e.message||e))}finally{Ot=!1}}}async function Za(){if(!(!le||Dt)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){Dt=!0;try{const{error:t}=await g.from("contract_bids").update({status:"lost"}).eq("contract_id",le.id);if(t)throw t;const{error:e}=await g.from("construction_contracts").update({status:"expired"}).eq("id",le.id);if(e)throw e;wt(),alert("All bids declined. Contract cancelled."),typeof Le=="function"&&await Le()}catch(t){alert("Failed: "+(t.message||t))}finally{Dt=!1}}}function so(){if(document.getElementById("bid-review-overlay")?.remove(),!le||et.length===0)return;const t="'JetBrains Mono', monospace",e={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},i=le,o=et;Te>=o.length&&(Te=0);const a=o[Te],s=Number(i.budget_ceiling||0),r=Number(i.timeline_ticks||36),n=Math.min(...o.map(u=>u.bid_price)),l=Math.max(...o.map(u=>u.estimated_quality||0));let c="";for(let u=0;u<o.length;u++){const _=o[u],b=u===Te,p=_.bid_price===n,h=(_.estimated_quality||0)===l,x=_.bid_price>s;c+=`
        <div onclick="reviewSelectBid(${u})" style="padding:10px 16px;border-bottom:1px solid ${e.border};cursor:pointer;border-left:2px solid ${b?e.accent:"transparent"};background:${b?"rgba(139,154,107,0.03)":"transparent"};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-family:${t};font-size:10px;font-weight:700;color:${e.gold}">${_.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${e.text}">${_.corp}</span>
                ${p?`<span style="font-family:${t};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.greenBright};background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2)">CHEAPEST</span>`:""}
                ${h?`<span style="font-family:${t};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${e.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.2)">BEST QUALITY</span>`:""}
            </div>
            <div style="display:flex;gap:0;background:${e.card};border:1px solid ${e.border};">
                <div style="flex:1.2;padding:5px 10px;border-right:1px solid ${e.border}">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">BID PRICE</div>
                    <div style="font-family:${t};font-size:14px;font-weight:700;color:${x?e.red:e.text}">${E(_.bid_price)}</div>
                    ${x?`<div style="font-family:${t};font-size:7px;color:${e.red}">OVER BUDGET</div>`:""}
                </div>
                <div style="flex:0.8;padding:5px 10px;border-right:1px solid ${e.border};text-align:center">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">QUALITY</div>
                    <div style="font-family:${t};font-size:14px;font-weight:700;color:${(_.estimated_quality||0)>=75?e.greenBright:(_.estimated_quality||0)>=55?e.yellow:e.orange}">${_.estimated_quality||0}</div>
                </div>
                <div style="flex:0.8;padding:5px 10px;text-align:center">
                    <div style="font-family:${t};font-size:7px;color:${e.dim}">WORKERS</div>
                    <div style="font-family:${t};font-size:14px;font-weight:700;color:${e.text}">${_.labor_count||0}</div>
                </div>
            </div>
        </div>`}const v=a.bid_price>s,d=s>0?Math.round(a.bid_price/s*100):0,m=document.createElement("div");m.id="bid-review-overlay",m.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",m.addEventListener("click",u=>{u.target===m&&wt()}),m.innerHTML=`
    <div style="width:640px;max-height:92vh;background:${e.surface};border:1px solid ${e.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:10px 16px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:14px;font-weight:700;color:${e.text}">${i.name}</span>
                    <span style="font-family:${t};font-size:8px;font-weight:700;padding:2px 6px;color:${e.gold};background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">YOUR PROJECT</span>
                </div>
                <span onclick="closeBidReview()" style="font-family:${t};font-size:14px;color:${e.dim};cursor:pointer">×</span>
            </div>
            <div style="display:flex;gap:8px;margin-top:4px;font-family:${t};font-size:9px;color:${e.dim};">
                <span>${i.project_code||"—"}</span>
                <span>·</span>
                <span>Budget: <span style="color:${e.text};font-weight:700">${E(s)}</span></span>
                <span>·</span>
                <span>Timeline: <span style="color:${e.text};font-weight:700">${r}mo</span></span>
            </div>
        </div>
        <div style="padding:6px 16px;border-bottom:1px solid ${e.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <span style="font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.gold}">${o.length} BID${o.length!==1?"S":""} RECEIVED</span>
            <div style="display:flex;gap:8px;font-family:${t};font-size:8px;color:${e.dim};">
                <span>Cheapest: <span style="color:${e.greenBright}">${E(n)}</span></span>
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
                        <span style="font-family:${t};font-size:11px;font-weight:700;color:${e.gold}">${a.abbr}</span>
                        <span style="font-size:12px;font-weight:700;color:${e.text}">${a.corp}</span>
                    </div>
                    <div style="font-family:${t};font-size:8px;color:${e.dim};margin-top:2px">${a.subsector}</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};background:${e.card};flex-shrink:0;">
                    <span style="font-family:${t};font-size:8px;font-weight:700;letter-spacing:1.5px;color:${e.accentBright};text-transform:uppercase">Cost Breakdown</span>
                </div>
                ${[{l:"Materials",v:Number(a.estimated_cost||0)*.45},{l:"Labor",v:Number(a.estimated_cost||0)*.45},{l:"Overhead",v:Number(a.estimated_cost||0)*.1}].map(u=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${t};font-size:9px;color:${e.dim};text-transform:uppercase">${u.l}</span>
                    <span style="font-family:${t};font-size:10px;color:${e.muted}">${E(Math.round(u.v))}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${e.border};background:${v?"rgba(204,85,85,0.03)":"rgba(200,168,50,0.03)"};">
                    <span style="font-family:${t};font-size:9px;font-weight:700;color:${e.text}">TOTAL BID</span>
                    <span style="font-family:${t};font-size:14px;font-weight:700;color:${v?e.red:e.gold}">${E(a.bid_price)}</span>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${e.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:${t};font-size:8px;color:${e.dim}">vs. YOUR BUDGET</span>
                        <span style="font-family:${t};font-size:9px;font-weight:700;color:${v?e.red:e.greenBright}">${v?"OVER":"WITHIN"} — ${d}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${e.border}"><div style="width:${Math.min(100,d)}%;height:100%;background:${v?e.red:e.accent}"></div></div>
                </div>
                ${[{l:"Quality",v:a.estimated_quality+"/100",c:(a.estimated_quality||0)>=75?e.greenBright:(a.estimated_quality||0)>=55?e.yellow:e.orange},{l:"Markup",v:a.markup_pct+"%",c:e.muted},{l:"Workers",v:a.labor_count+" workers",c:e.text}].map(u=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${e.border};">
                    <span style="font-family:${t};font-size:9px;color:${e.dim};text-transform:uppercase">${u.l}</span>
                    <span style="font-family:${t};font-size:10px;font-weight:700;color:${u.c}">${u.v}</span>
                </div>`).join("")}
                <div style="flex:1"></div>
            </div>
        </div>
        <div style="padding:10px 16px;border-top:1px solid ${e.border};background:${e.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">SELECTED BID</div><div style="font-family:${t};font-size:12px;font-weight:700;color:${e.gold}">${E(a.bid_price)}</div></div>
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">CORPORATION</div><div style="font-family:${t};font-size:12px;font-weight:700;color:${e.text}">${a.corp}</div></div>
                <div><div style="font-family:${t};font-size:7px;color:${e.dim}">QUALITY</div><div style="font-family:${t};font-size:12px;font-weight:700;color:${(a.estimated_quality||0)>=75?e.greenBright:e.yellow}">${a.estimated_quality}</div></div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="declineAllBids()" style="padding:6px 16px;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:${e.dim};border:1px solid ${e.border};cursor:pointer">DECLINE ALL</div>
                <div onclick="acceptBid()" style="padding:6px 20px;font-family:${t};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${e.accent};cursor:pointer">ACCEPT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(m)}const Ae={Coastal:{color:"#8b9a6b",label:"COASTAL"},Container:{color:"#5a7aaa",label:"CONTAINER"},Bulk:{color:"#c8a832",label:"BULK"},Tanker:{color:"#c86a4a",label:"TANKER"},Reefer:{color:"#6a9a5a",label:"REEFER"},LNG:{color:"#c55",label:"LNG"}},en={in_port:{color:"#8b9a6b",label:"IN PORT"},in_transit:{color:"#5a8aaa",label:"IN TRANSIT"},dry_dock:{color:"#c84",label:"DRY DOCK"},anchored:{color:"#ca5",label:"ANCHORED"},for_sale:{color:"#9e9a92",label:"FOR SALE"}};function ro(t){return t>=75?"#5c5":t>=50?"#ca5":t>=25?"#c84":"#c55"}function tn(t){return t>=60?"#5c5":t>=30?"#ca5":t>=15?"#c84":"#c55"}async function de(){if(!f)return;const{data:t,error:e}=await g.from("corp_vessels").select("*").eq("faction_id",f.id).order("vessel_class");e&&console.warn("Failed to load fleet:",e.message),oe=t||[],Ze=null;const{data:i,error:o}=await g.from("vessel_orders").select("id, vessel_name, vessel_class, shipyard_nation, ordered_at_tick, delivery_tick, build_ticks, balance_due").eq("faction_id",f.id).eq("status","building").order("delivery_tick",{ascending:!0});o&&console.warn("Failed to load vessel orders:",o.message),Fi=i||[],Ge={},dt={};try{const a=oe.map(s=>s.id);if(a.length>0){const{data:s}=await g.from("finance_active_loans").select("insured_vessel_id").in("insured_vessel_id",a).in("status",["current"]);for(const n of s||[])n.insured_vessel_id&&(Ge[n.insured_vessel_id]=!0);const{data:r}=await g.from("finance_loan_requests").select("insured_vessel_id").eq("requesting_faction_id",f.id).eq("request_type","insurance").eq("status","open").not("insured_vessel_id","is",null);for(const n of r||[])n.insured_vessel_id&&!Ge[n.insured_vessel_id]&&(dt[n.insured_vessel_id]=!0)}}catch(a){console.warn("Failed to load vessel insurance status:",a.message)}lo()}function on(t){Ze=Ze===t?null:t,lo()}function lo(){const t=document.getElementById("fl-count"),e=document.getElementById("fl-summary"),i=document.getElementById("fl-list"),o=document.getElementById("fl-footer");if(!t||!i)return;const a=oe,s=Fi||[],r=s.length;t.textContent=a.length+" VESSEL"+(a.length!==1?"S":"")+(r>0?" · "+r+" BUILDING":"");const n=a.filter(p=>p.status==="in_transit").length,l=a.filter(p=>p.status==="in_port"||p.status==="anchored").length,c=a.filter(p=>p.status==="dry_dock").length,v=a.reduce((p,h)=>p+(h.base_maintenance||0),0),d=r>0?[{label:"TRANSIT",value:n,color:"#5a8aaa"},{label:"IN PORT",value:l,color:"#8b9a6b"},{label:"BUILDING",value:r,color:"var(--amber)"},{label:"DRY DOCK",value:c,color:"#c84"},{label:"MAINT/TICK",value:E(v),color:"#a44"}]:[{label:"TRANSIT",value:n,color:"#5a8aaa"},{label:"IN PORT",value:l,color:"#8b9a6b"},{label:"DRY DOCK",value:c,color:"#c84"},{label:"MAINT/TICK",value:E(v),color:"#a44"}];e.innerHTML=d.map((p,h)=>`<div style="flex:1;padding:5px 8px;text-align:center;${h<d.length-1?"border-right:1px solid var(--border-0);":""}">
        <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">${p.label}</div>
        <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${p.color};margin-top:1px;">${p.value}</div>
    </div>`).join("");const m=M?.current_tick||0;let u="";for(const p of s){const h=Math.max(1,Number(p.build_ticks)||1),x=Number(p.delivery_tick)||0,k=Number(p.ordered_at_tick)||0,C=Math.max(0,x-m),T=Math.max(0,Math.min(h,m-k)),$=Math.max(0,Math.min(100,Math.round(T/h*100))),I=Ae[p.vessel_class]||{color:"#9e9a92",label:(p.vessel_class||"?").toUpperCase()},N=C===0?"Delivering this tick":`Delivery in ${C} tick${C!==1?"s":""}`;u+=`<div style="border-bottom:1px solid var(--border-0);border-left:2px solid var(--amber);">
            <div style="padding:7px 14px;">
                <div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                    <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${y(p.vessel_name||"Unnamed Vessel")}</span>
                    <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${I.color};background:${I.color}12;border:1px solid ${I.color}25;">${I.label}</span>
                    <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:var(--amber);background:var(--amber-faint);border:1px solid var(--amber-border);">BUILDING</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:5px;">
                    Shipyard: ${y(p.shipyard_nation||"—")} · ${y(N)} · Balance $${Math.round(Number(p.balance_due)||0).toLocaleString()} due on delivery
                </div>
                <div style="display:flex;justify-content:space-between;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:2px;">
                    <span>BUILD PROGRESS</span>
                    <span style="color:var(--amber);font-weight:700;">${$}%</span>
                </div>
                <div style="height:5px;background:var(--bg-3);border:1px solid var(--border-0);">
                    <div style="width:${$}%;height:100%;background:var(--amber);transition:width 0.3s;"></div>
                </div>
            </div>
        </div>`}a.length===0&&s.length===0?i.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels in fleet.<br>Purchase ships to begin operations.</div>':a.length===0?i.innerHTML=u:i.innerHTML=u+a.map((p,h)=>{const x=Ze===h,k=Ae[p.vessel_class]||{color:"#666",label:"?"},C=en[p.status]||{color:"#666",label:"?"},T=ro(p.condition),$=tn(p.fuel),I=p.condition<50||p.fuel<20,N=p.status==="in_transit",q=p.status==="dry_dock",j=M?.current_tick||0,P=Math.max(0,Math.floor((j-(p.built_at_tick||0))/12));let L=`<div onclick="flSelectVessel(${h})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${I?p.condition<50?T:$:"transparent"};background:${x?k.color+"06":"transparent"};">
                <div style="padding:7px 14px;">`;L+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${y(p.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${k.color};background:${k.color}12;border:1px solid ${k.color}25;">${k.label}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${C.color};background:${C.color}12;border:1px solid ${C.color}25;">${C.label}</span>
            </div>`;const z=p.current_port_nation_id?"In port":N?"At sea":"—";if(L+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:5px;">${y(z)}</div>`,L+=`<div style="display:flex;gap:8px;margin-bottom:4px;">
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${T};">${p.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${p.condition}%;height:100%;background:${T};"></div></div>
                </div>
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">FUEL</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${$};">${p.fuel}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${p.fuel}%;height:100%;background:${$};"></div></div>
                </div>
            </div>`,L+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);margin-top:1px;">${(p.capacity_dwt||0).toLocaleString()} ${p.capacity_unit||"DWT"}</div>
                </div>
                <div style="flex:0.7;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">AGE</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${P}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#a44;margin-top:1px;">${E(p.base_maintenance)}</div>
                </div>
            </div>`,q&&p.drydock_until_tick){const F=Math.max(0,p.drydock_until_tick-j);L+=`<div style="margin-top:4px;padding:3px 8px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">DRY DOCK REPAIRS</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c84;">${F} tick${F!==1?"s":""} remaining</span>
                </div>`}if(x){L+=`<div style="margin-top:6px;">
                    <div style="padding:5px 8px;background:var(--bg-0);border:1px solid var(--border-0);margin-bottom:6px;">`;const F=[{label:"VESSEL CLASS",value:p.vessel_class},{label:"BUILT",value:"Tick "+(p.built_at_tick||0)},{label:"FUEL CAPACITY",value:(p.fuel_capacity||0).toLocaleString()+" tons"},{label:"LAST REFURBISH",value:p.last_refurbish_tick?"Tick "+p.last_refurbish_tick:"N/A"}];for(let H=0;H<F.length;H++)L+=`<div style="display:flex;justify-content:space-between;padding:2px 0;${H<3?"border-bottom:1px solid var(--border-0);":""}">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${F[H].label}</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);">${F[H].value}</span>
                    </div>`;L+="</div>";const U=N||q,w=Math.round((p.purchase_price||3e6)*.08*(1+(100-p.condition)/100)),A=Math.round((p.fuel_capacity||1e3)*50*(1-p.fuel/100)),B=Math.round((p.purchase_price||3e6)*(p.condition/100)*.6);if(L+=`<div style="display:flex;gap:4px;">
                    <div onclick="${U?"":"flRefurbish('"+p.id+"',"+w+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${U?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${U?"var(--text-dim)":"#5c5"};border:1px solid ${U?"var(--border-0)":"#2a5a3a"};background:${U?"transparent":"rgba(74,170,136,0.06)"};opacity:${U?.35:1};">REFURBISH<br><span style="font-weight:400;font-size:6px;">${E(w)}</span></div>
                    <div onclick="${N?"":"flRefuel('"+p.id+"',"+A+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${N?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${N?"var(--text-dim)":"#c86a4a"};border:1px solid ${N?"var(--border-0)":"rgba(200,106,74,0.3)"};opacity:${N?.35:1};">REFUEL<br><span style="font-weight:400;font-size:6px;">from ${E(A)}</span></div>
                    <div onclick="${U?"":"flSell('"+p.id+"','"+y(p.vessel_name).replace(/'/g,"")+"',"+B+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${U?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${U?"var(--text-dim)":"#c84"};border:1px solid ${U?"var(--border-0)":"rgba(204,136,68,0.3)"};opacity:${U?.35:1};">LIST<br><span style="font-weight:400;font-size:6px;">${E(B)}</span></div>
                </div>`,!N){const H=Ge&&Ge[p.id],X=dt&&dt[p.id];L+='<div style="display:flex;gap:4px;margin-top:4px;">',H?L+=`<div style="flex:1;display:flex;gap:2px;">
                            <div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#5c5;border:1px solid rgba(92,204,92,0.2);background:rgba(92,204,92,0.04);">INSURED ✓</div>
                            <div onclick="event.stopPropagation();flFileClaim('${p.id}','${y(p.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#c55;border:1px solid rgba(204,85,85,0.2);background:rgba(204,85,85,0.04);">FILE CLAIM</div>
                        </div>`:X?L+='<div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#ca5;border:1px solid rgba(202,165,50,0.2);background:rgba(202,165,50,0.04);">PENDING ⏳</div>':L+=`<div onclick="event.stopPropagation();flRequestInsurance('${p.id}','${y(p.vessel_name).replace(/'/g,"")}',${p.purchase_price||0})" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#aa7a5a;border:1px solid rgba(170,122,90,0.3);background:rgba(170,122,90,0.04);">INSURE</div>`,L+=`<div onclick="flRename('${p.id}','${y(p.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:var(--text-muted);border:1px solid var(--border-0);">RENAME</div>`,L+="</div>"}N&&(L+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel at sea — actions available on arrival</div>'),q&&(L+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel in dry dock — repairs in progress</div>'),L+="</div>"}return L+="</div></div>",L}).join("");const _={};for(const p of a)_[p.vessel_class]=(_[p.vessel_class]||0)+1;let b='<div style="display:flex;gap:6px;">';for(const[p,h]of Object.entries(Ae))_[p]&&(b+=`<div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:${h.color};border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">${h.label}</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${_[p]}</span>
        </div>`);b+="</div>",b+=`<span style="font-family:var(--font-mono);font-size:8px;color:#a44;">${E(v)}/tick</span>`,o.innerHTML=b}let te=!1;async function an(t,e){if(te||!f)return;const i=(oe||[]).find(u=>u.id===t);if(!i)return;const o=i.current_port_nation_id||null;let a="state",s=3,r=3,n=null,l="State Dry Dock (3x cost, 3 ticks)";if(o){const{data:u}=await g.from("corp_properties").select("id").eq("faction_id",f.id).eq("nation_id",o).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();if(u)a="own",s=1,r=2,l="Your Dry Dock (base cost, 2 ticks)";else{const{data:_}=await g.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",f.id).eq("nation_id",o).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();_&&(a="other",s=1.2,r=2,n=_.faction_id,l=(_.factions?.faction_name||"Another corp")+"'s Dry Dock (+20%, 2 ticks)")}}else l="State Dry Dock (3x cost, 3 ticks) — no private dock in port";const c=Math.round(e*s),{data:v}=await g.from("factions").select("corp_cash_reserves").eq("id",f.id).single(),d=Number(v?.corp_cash_reserves??0);if(d<c){alert("Insufficient cash. Need "+E(c)+", have "+E(d)+".");return}if(!confirm("Send "+(i.vessel_name||"vessel")+` to dry dock?

Dock: `+l+`
Cost: `+E(c)+`
Duration: `+r+` ticks
Condition restored to 85-100%.`))return;te=!0;const m=M?.current_tick||0;try{const{error:u}=await g.from("factions").update({corp_cash_reserves:d-c}).eq("id",f.id);if(u){alert("Failed: "+u.message);return}if(a==="other"&&n){const b=c-e,{data:p}=await g.from("factions").select("corp_cash_reserves").eq("id",n).single();p&&await g.from("factions").update({corp_cash_reserves:Number(p.corp_cash_reserves||0)+b}).eq("id",n)}const{error:_}=await g.from("corp_vessels").update({status:"dry_dock",drydock_until_tick:m+r,active_claim_id:null}).eq("id",t);if(_){await g.from("factions").update({corp_cash_reserves:d}).eq("id",f.id),alert("Failed: "+_.message);return}f.corp_cash_reserves=d-c,await de()}catch(u){alert("Dry dock failed: "+(u.message||"Error"))}finally{te=!1}}async function nn(t,e){if(te||!f)return;if(e<=0){alert("Fuel tanks are already full.");return}const i=(oe||[]).find(d=>d.id===t);if(!i)return;const o=i.current_port_nation_id||f.nation_id;let a="state",s=3,r=null,n="State Fuel (3x cost) — no private depot in port";if(o){const{data:d}=await g.from("corp_properties").select("id").eq("faction_id",f.id).eq("nation_id",o).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(d)a="own",s=1,n="Your Fuel Depot (base cost)";else{const{data:m}=await g.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",f.id).eq("nation_id",o).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();m&&(a="other",s=1.15,r=m.faction_id,n=(m.factions?.faction_name||"Another corp")+"'s Fuel Depot (+15%)")}}const l=Math.round(e*s),{data:c}=await g.from("factions").select("corp_cash_reserves").eq("id",f.id).single(),v=Number(c?.corp_cash_reserves??0);if(v<l){alert("Insufficient cash. Need "+E(l)+", have "+E(v)+".");return}if(confirm("Refuel "+(i.vessel_name||"vessel")+`?

Source: `+n+`
Cost: `+E(l)+`
Fuel restored to 100%.`)){te=!0;try{const{error:d}=await g.from("factions").update({corp_cash_reserves:v-l}).eq("id",f.id);if(d){alert("Failed: "+d.message);return}if(a==="other"&&r){const u=l-e,{data:_}=await g.from("factions").select("corp_cash_reserves").eq("id",r).single();_&&await g.from("factions").update({corp_cash_reserves:Number(_.corp_cash_reserves||0)+u}).eq("id",r)}const{error:m}=await g.from("corp_vessels").update({fuel:100}).eq("id",t);if(m){await g.from("factions").update({corp_cash_reserves:v}).eq("id",f.id),alert("Failed: "+m.message);return}f.corp_cash_reserves=v-l,await de()}catch(d){alert("Refuel failed: "+(d.message||"Error"))}finally{te=!1}}}async function sn(t,e,i){if(te||!f||!M||!confirm("List "+e+" on the Ship Market for "+E(i)+`?

The vessel will be removed from your fleet and listed for sale. You will receive payment when another corporation purchases it.`))return;te=!0;const o=M.current_tick||0,a=oe.find(l=>l.id===t);if(!a){te=!1;return}const s=Math.max(0,o-(a.built_at_tick||0)),{error:r}=await g.from("ship_market_listings").insert({nation_id:f.nation_id,vessel_name:a.vessel_name,vessel_class:a.vessel_class,capacity_dwt:a.capacity_dwt,capacity_unit:a.capacity_unit,condition:a.condition,fuel:a.fuel,age_ticks:s,fuel_capacity:a.fuel_capacity,base_maintenance:a.base_maintenance,asking_price:i,purchase_price_new:a.purchase_price||i,seller_type:"CORP",seller_name:f.faction_name,seller_faction_id:f.id,sale_reason:"Listed for sale by "+(f.faction_name||"corporation"),status:"available",listed_at_tick:o});if(r){alert("Failed to create listing: "+r.message),te=!1;return}const{error:n}=await g.from("corp_vessels").delete().eq("id",t);if(n){await g.from("ship_market_listings").delete().eq("seller_faction_id",f.id).eq("vessel_name",a.vessel_name).eq("listed_at_tick",o),alert("Failed to remove vessel: "+n.message),te=!1;return}te=!1,Ze=null,await Promise.all([de(),bi()])}async function rn(t,e){const i=prompt("Rename vessel:",e);if(!i||i.trim()===e||i.trim().length<2)return;const{error:o}=await g.from("corp_vessels").update({vessel_name:i.trim().slice(0,40)}).eq("id",t);if(o){alert("Failed: "+o.message);return}await de()}async function ln(t,e,i){if(!f||!M||!confirm("Request insurance for "+e+`?

Insurance corporations will see this in their Deal Flow and can offer coverage terms.

Vessel value: `+E(i)))return;const o=M.current_tick||0,{error:a}=await g.from("finance_loan_requests").insert({requesting_faction_id:f.id,nation_id:f.nation_id,request_type:"insurance",insured_vessel_id:t,amount:i,term_months:0,purpose:"Vessel Insurance — "+e,status:"open",created_tick:o,expires_tick:o+12});if(a){a.message.includes("duplicate")||a.message.includes("unique")?alert("Insurance already requested for this vessel."):alert("Failed to request insurance: "+a.message);return}alert(`Insurance request posted to Deal Flow.

Insurance corporations can now offer coverage for `+e+"."),await de()}let Bt=!1;async function dn(t,e){if(Bt||!f||!M)return;const i=prompt(`Describe the claim reason:

e.g., "Storm damage during transit — hull breach repaired at sea" or "Engine failure requiring emergency dry dock"`);if(!i||i.trim().length<5)return;const o=M.current_tick||0,{data:a}=await g.from("finance_active_loans").select("id, lender_faction_id, principal, deductible_pct").eq("insured_vessel_id",t).eq("status","current").limit(1).maybeSingle();if(!a){alert("No active insurance policy found for this vessel.");return}const s=Number(a.principal||0),r=Number(a.deductible_pct||10),n=Math.round(s*r/100);if(!confirm("File insurance claim for "+e+`?

Coverage: `+E(s)+`
Deductible: `+r+"% ("+E(n)+`)

Reason: `+i.trim()+`

The insurer will review this claim and determine the payout.`))return;Bt=!0;const{error:l}=await g.from("event_log").insert({nation_id:f.nation_id,faction_id:f.id,event_name:(f.faction_name||"Corporation")+" — Insurance Claim Filed",description_used:(f.faction_name||"A shipping corporation")+" has filed an insurance claim for vessel "+e+". Reason: "+i.trim().replace(/[<>"]/g,""),category:"business",trigger_key:"vessel_insurance_claim",effects_applied:{vessel_id:t,vessel_name:e,policy_id:a.id,insurer_faction_id:a.lender_faction_id,coverage:s,deductible_pct:r,claim_reason:i.trim()},fired_at_tick:o});l&&console.warn("Failed to log insurance claim event:",l.message);const{error:c}=await g.from("finance_active_loans").update({claims_paid:(a.claims_paid||0)+1}).eq("id",a.id);c&&console.warn("Failed to update claims_paid:",c.message),Bt=!1,alert("Insurance claim filed for "+e+`.

The insurer (`+E(s)+" coverage) has been notified. Claim details are visible in the events feed.")}window.flRequestInsurance=ln;window.flFileClaim=dn;const ei={fuel_depot:{label:"FUEL DEPOT",color:"#c86a4a",icon:"⛽",desc:"Bunkering facility — refuel at base cost, earn revenue from visiting fleets."},dry_dock:{label:"DRY DOCK",color:"#c84",icon:"🔧",desc:"Repair & maintenance dock — dock at base cost, earn revenue from visiting fleets."}},cn=[{type:"fuel_depot",name:"Fuel Depot — Standard",cost:105e6,maint:85e3,style:"Basic",desc:"Bulk fuel storage and bunkering facility."},{type:"fuel_depot",name:"Fuel Depot — Advanced",cost:14e7,maint:11e4,style:"Modern",desc:"High-capacity fuel terminal with pipeline infrastructure."},{type:"dry_dock",name:"Dry Dock — Standard",cost:85e6,maint:15e4,style:"Basic",desc:"Ship repair and maintenance facility."},{type:"dry_dock",name:"Dry Dock — Advanced",cost:115e6,maint:2e5,style:"Modern",desc:"Full-service shipyard with drydock and crane facilities."}];let ut=[];async function co(){if(!f)return;const{data:t}=await g.from("corp_properties").select("*, nations!nation_id(name)").eq("faction_id",f.id).in("type",["fuel_depot","dry_dock"]).eq("is_active",!0).order("created_at",{ascending:!1});ut=t||[],pn()}function pn(){const t=document.getElementById("pf-count"),e=document.getElementById("pf-list"),i=document.getElementById("pf-footer");if(!t||!e||!i)return;const o=ut;if(t.textContent=o.length+" FACILIT"+(o.length===1?"Y":"IES"),o.length===0)e.innerHTML=`<div style="padding:20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-bottom:6px;">No port facilities built.</div>
            <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Build a <span style="color:#c86a4a;font-weight:700;">Fuel Depot</span> to refuel your fleet at base cost<br>and earn revenue from other corps refueling here.<br>Build a <span style="color:#c84;font-weight:700;">Dry Dock</span> to repair vessels at base cost.</div>
        </div>`;else{let r=0;e.innerHTML=o.map(n=>{const l=ei[n.type]||ei.fuel_depot,c=n.condition>=75?"#5c5":n.condition>=50?"#ca5":"#c84";return r+=Number(n.monthly_maintenance||0),`<div style="padding:8px 12px;border-bottom:1px solid var(--border-0);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${l.icon}</span>
                        <span style="font-size:11px;font-weight:600;color:var(--text-bright);">${y(n.name)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${l.color};background:${l.color}12;border:1px solid ${l.color}25;">${l.label}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:4px;">${y(n.nations?.name||"Unknown Nation")} · ${y(n.city||"Port")} · ${(n.style||"Basic").toUpperCase()}</div>
                <div style="display:flex;gap:12px;margin-bottom:4px;">
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${c};">${n.condition}%</span>
                        </div>
                        <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${n.condition}%;height:100%;background:${c};"></div></div>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#a44;">${E(n.monthly_maintenance||0)}</span>
                        </div>
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">VALUE: ${E(n.purchase_price||0)}</div>
                    </div>
                </div>
            </div>`}).join("")}Number(f?.corp_cash_reserves??0);const a=o.some(r=>r.type==="fuel_depot"),s=o.some(r=>r.type==="dry_dock");i.innerHTML=`
        <div onclick="pfOpenBuild('fuel_depot')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c86a4a;border:1px solid rgba(200,106,74,0.3);background:rgba(200,106,74,0.04);">
            ${a?"+ FUEL DEPOT":"BUILD FUEL DEPOT"}
        </div>
        <div onclick="pfOpenBuild('dry_dock')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c84;border:1px solid rgba(204,136,68,0.3);background:rgba(204,136,68,0.04);">
            ${s?"+ DRY DOCK":"BUILD DRY DOCK"}
        </div>`}let jt=!1;async function fn(t){if(jt||!f||!M)return;const e=cn.filter(p=>p.type===t);if(e.length===0)return;const i=ei[t],o=f.nation_id,a=R?.name||f?.nation||"Home Nation",s=R?.capital||"Port City",r=[{id:o,name:a,capital:s,label:"National HQ"}],{data:n}=await g.from("corp_properties").select("nation_id, name, city, nations!nation_id(name, capital)").eq("faction_id",f.id).eq("type","regional_hq").eq("is_active",!0);for(const p of n||[])p.nation_id!==o&&r.push({id:p.nation_id,name:p.nations?.name||p.city||"Unknown",capital:p.nations?.capital||p.city||"Port City",label:p.name||"Subsidiary"});let l=r[0];if(r.length>1){let p=i.label+` — SELECT LOCATION
`+"─".repeat(30)+`
`;p+=`Build in which nation?

`;for(let k=0;k<r.length;k++){const C=r[k],T=ut.filter($=>$.type===t&&$.nation_id===C.id).length;p+=k+1+". "+C.name+"  ("+C.label+")",T>0&&(p+="  ["+T+" existing]"),p+=`
`}p+=`
Enter number (or cancel):`;const h=prompt(p);if(!h)return;const x=parseInt(h,10)-1;if(isNaN(x)||x<0||x>=r.length){alert("Invalid selection.");return}l=r[x]}const c=ut.filter(p=>p.type===t&&p.nation_id===l.id).length;let v=i.label+" CONSTRUCTION — "+l.name.toUpperCase()+`
`+"─".repeat(30)+`
`;c>0&&(v+="You already have "+c+" "+i.label.toLowerCase()+(c>1?"s":"")+` here.

`),v+=i.desc+`

`;for(let p=0;p<e.length;p++){const h=e[p];v+=p+1+". "+h.name+`
`,v+="   Cost: "+E(h.cost)+" · Maint: "+E(h.maint)+`/tick
`,v+="   "+h.desc+`

`}v+="Enter 1 or 2 to select (or cancel):";const d=prompt(v);if(!d)return;const m=parseInt(d,10)-1;if(isNaN(m)||m<0||m>=e.length){alert("Invalid selection.");return}const u=e[m];if(!confirm("Commission "+u.name+" in "+l.capital+", "+l.name+`?

Budget: `+E(u.cost)+`

This will create a construction contract that construction corporations can bid on. Payment occurs when the contract is awarded.`))return;jt=!0;const _=M.current_tick||0,b=(M.current_date||"").match(/\d{4}/)?.[0]||"2015";try{const{count:p}=await g.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",l.id).eq("issuer_type","PRIVATE"),x=`PVT-P${(p||0)+1}-${b}`,k=u.style==="Modern",C={concrete:k?60:40,steel:k?50:30,heavy_parts:k?30:20,aggregate:k?30:20},T={trucks:5,mixers:5,excavators:5},$={general:k?240:160,skilled:k?100:60},I=k?6:4,{error:N}=await g.from("construction_contracts").insert({nation_id:l.id,template_key:t,sector:"industrial",name:u.name,project_type:i.label,project_subtype:u.style,description:`${u.name} at ${l.capital} Port — commissioned by ${f.faction_name}. ${u.desc}`,project_code:x,budget_ceiling:u.cost,timeline_ticks:I,required_materials:C,required_equipment:T,required_workforce:$,status:"open",generated_at_tick:_,bidding_ends_tick:_+3,issuer_type:"PRIVATE",issuer_name:f.faction_name,issuer_faction_id:f.id});if(N)throw N;await co(),alert(`Construction contract posted!

Project: `+u.name+`
Location: `+l.capital+", "+l.name+`
Code: `+x+`
Budget: `+E(u.cost)+`
Timeline: `+I+` ticks

Construction corporations in `+l.name+" can now bid on this project.")}catch(p){alert("Failed to post contract: "+(p.message||"Error"))}finally{jt=!1}}window.pfOpenBuild=fn;const xi={"Bulk Cargo":["Reefer","Bulk","Coastal"],"Container Freight":["Coastal","Container"],"Specialized Transport":["Tanker","LNG","Bulk"]};async function bi(){if(!f)return;const{data:t,error:e}=await g.from("ship_market_listings").select("*, nation:nation_id(id, name)").eq("status","available").order("asking_price",{ascending:!0});e&&console.warn("Failed to load ship market:",e.message),oi=t||[],ct=null,po()}function mn(t){ct=ct===t?null:t,po()}function vn(t){return(xi[f?.corp_subsector]||[]).includes(t)}function po(){const t=document.getElementById("sm-count"),e=document.getElementById("sm-list"),i=document.getElementById("sm-footer");if(!t||!e)return;const o=oi;t.textContent=o.length+" AVAILABLE",o.length===0?e.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels on the market.<br>Check back next cycle.</div>':e.innerHTML=o.map((r,n)=>{const l=ct===n,c=Ae[r.vessel_class]||{color:"#666",label:"?"},v=r.seller_type==="CORP"?"#5a8aaa":"#8b9a6b",d=ro(r.condition),m=r.nation?.name||"—",u=vn(r.vessel_class);M?.current_tick;const _=r.age_ticks||0,b=Math.max(1,Math.floor(_/12)),p=m!==f?.nation?Number(f?.tariffs||R?.tariffs||0):0,h=Math.round(r.asking_price*p/100),x=r.asking_price+h;let k=`<div onclick="smSelectListing(${n})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${l?c.color:"transparent"};background:${l?c.color+"06":"transparent"};">
                <div style="padding:8px 14px;">`;return k+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${y(r.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${c.color};background:${c.color}12;border:1px solid ${c.color}25;">${c.label}</span>
            </div>`,k+=`<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;">
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${v};background:${v}12;border:1px solid ${v}25;">${r.seller_type}</span>
                <span style="font-size:9px;color:var(--text-muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${y(r.seller_name||"—")}</span>
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;">${m.toUpperCase().slice(0,6)}</span>
                ${p>0?`<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">+${p}%</span>`:""}
            </div>`,k+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
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
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${b}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">PRICE</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--gold);margin-top:1px;">${E(r.asking_price)}</div>
                </div>
            </div>`,l&&(k+='<div style="margin-top:6px;">',k+=`<div style="padding:4px 8px;margin-bottom:5px;background:var(--bg-0);border:1px solid var(--border-0);">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0);">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CARRIES</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${c.color};">${(Ae[r.vessel_class]||{}).label||"?"} class cargo</span>
                    </div>
                    <div style="padding:3px 0;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:1px;">REASON FOR SALE</div>
                        <div style="font-size:9px;color:var(--text-muted);line-height:1.4;">${y(r.sale_reason||"—")}</div>
                    </div>
                </div>`,k+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                    <div style="width:40px;height:3px;background:var(--border-0);"><div style="width:${r.condition}%;height:100%;background:${d};"></div></div>
                    ${r.condition<60?'<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">May need dry dock</span>':""}
                </div>`,p>0&&(k+=`<div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:8px;margin-bottom:3px;">
                        <span style="color:var(--text-dim);">Import tariff (${p}%)</span>
                        <span style="color:#c84;">+${E(h)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;margin-bottom:5px;">
                        <span style="color:var(--text-bright);">TOTAL</span>
                        <span style="color:var(--gold);">${E(x)}</span>
                    </div>`),u?k+=`<div onclick="event.stopPropagation();smPurchase('${r.id}',${x})" style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${c.color};cursor:pointer;">${E(x)} — PURCHASE</div>`:k+=`<div style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:var(--text-dim);border:1px solid var(--border-0);opacity:0.4;">⊘ ${r.vessel_class} not available for ${f?.corp_subsector||"your subsector"}</div>`,k+="</div>"),k+="</div></div>",k}).join("");const a=o.filter(r=>r.seller_type==="CORP").length,s=o.filter(r=>r.seller_type==="LOCAL").length;i.innerHTML=`<div style="display:flex;gap:6px;">
        <div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:#5a8aaa;border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CORP</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${a}</span>
        </div>
        <div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:#8b9a6b;border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">LOCAL</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${s}</span>
        </div>
    </div>
    <div onclick="smOpenCommission()" style="padding:4px 14px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--gold);border:1px solid rgba(200,168,50,0.3);cursor:pointer;">COMMISSION VESSEL</div>`}let Pe=!1;async function un(t,e){if(Pe||!f||!M)return;const i=Number(f.corp_cash_reserves??0);if(i<e){alert("Insufficient cash. Need "+E(e)+".");return}if(!confirm("Purchase this vessel for "+E(e)+"?"))return;Pe=!0;const o=oi.find(v=>v.id===t);if(!o){Pe=!1;return}const a=M.current_tick||0,s=rt[o.vessel_class]||rt.Coastal,{error:r}=await g.from("factions").update({corp_cash_reserves:i-e}).eq("id",f.id);if(r){alert("Failed: "+r.message),Pe=!1;return}const{error:n}=await g.from("corp_vessels").insert({faction_id:f.id,nation_id:f.nation_id,vessel_name:o.vessel_name,vessel_class:o.vessel_class,condition:o.condition,fuel:o.fuel||50,status:"in_port",capacity_dwt:o.capacity_dwt||s.capacity_dwt,capacity_unit:o.capacity_unit||s.capacity_unit,base_maintenance:o.base_maintenance||s.base_maintenance,fuel_capacity:o.fuel_capacity||s.fuel_capacity,purchase_price:e,built_at_tick:a-(o.age_ticks||0),current_port_nation_id:f.nation_id});if(n){await g.from("factions").update({corp_cash_reserves:i}).eq("id",f.id),alert("Failed to create vessel: "+n.message),Pe=!1;return}var{error:l}=await g.from("ship_market_listings").update({status:"sold",purchased_by:f.id,purchased_at_tick:a}).eq("id",t);if(l&&console.warn("Failed to mark listing as sold:",l.message),o.seller_faction_id){const{data:v}=await g.from("factions").select("corp_cash_reserves").eq("id",o.seller_faction_id).single();if(v){var{error:c}=await g.from("factions").update({corp_cash_reserves:Number(v.corp_cash_reserves||0)+o.asking_price}).eq("id",o.seller_faction_id);c&&console.warn("Failed to credit seller:",c.message)}}f.corp_cash_reserves=i-e,Pe=!1,await Promise.all([de(),bi()])}const Ke=[{cls:"Coastal",baseCost:12e6,baseBuild:3,cargo:"Bulk, Containers (coastal)"},{cls:"Container",baseCost:65e6,baseBuild:5,cargo:"Manufactured, Tech, General"},{cls:"Bulk",baseCost:38e6,baseBuild:4,cargo:"Minerals, Aggregate, Military"},{cls:"Tanker",baseCost:52e6,baseBuild:5,cargo:"Fuel, Petroleum, Chemicals"},{cls:"Reefer",baseCost:45e6,baseBuild:4,cargo:"Food, Perishables, Agriculture"},{cls:"LNG",baseCost:78e6,baseBuild:6,cargo:"Liquefied Natural Gas only"}];let ae="Coastal",tt=0,it="",Me=[];function yn(){ae=(xi[f?.corp_subsector]||["Coastal"])[0],tt=0,it="",Me=[],document.getElementById("comm-overlay").style.display="flex",gn()}async function gn(){const{data:t}=await g.from("nations").select("id, name, manufacturing_output, physical_infrastructure, tariffs").order("name");Me=(t||[]).map(e=>{const i=Number(e.manufacturing_output??50),o=Math.round((.75+i/100*.5)*100)/100,a=Math.round((1.5-i/100*.65)*100)/100,s=e.id===f?.nation_id;return{id:e.id,name:e.name,mfg:i,costMod:o,buildMod:a,isHome:s,tariffs:Number(e.tariffs??0)}}),Me.sort((e,i)=>(i.isHome?1:0)-(e.isHome?1:0)),hi()}function fo(){document.getElementById("comm-overlay").style.display="none"}function _n(t){ae=t,hi()}function xn(t){tt=t,hi()}function bn(t){it=t}function hi(){const t=document.getElementById("comm-content");if(!t)return;const e=M?.current_tick||0,i=Ke.find(_=>_.cls===ae)||Ke[0],o=Me[tt]||{name:"—",costMod:1,buildMod:1},a=Ae[ae]||{color:"#666"},s=Math.round(i.baseCost*o.costMod),r=Math.max(2,Math.round(i.baseBuild*o.buildMod)),n=Math.round(s*.5),l=s-n,c=e+r,v=xi[f?.corp_subsector]||[];let d="";d+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:#c8a832;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Commission Vessel</span>
            </div>
            <span onclick="smCloseCommission()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
    </div>`,d+='<div style="flex:1;overflow-y:auto;">',d+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Vessel Type</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">`;for(const _ of Ke){const b=Ae[_.cls]||{color:"#666",label:"?"},p=ae===_.cls,h=v.includes(_.cls);d+=`<div onclick="${h?"commSetClass('"+_.cls+"')":""}" style="padding:5px 4px;text-align:center;cursor:${h?"pointer":"not-allowed"};background:${p?b.color+"18":"transparent"};border:1px solid ${p?b.color+"44":"var(--panel-border)"};opacity:${h?1:.3};">
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${p?b.color:"#6a6660"};">${b.label}</div>
            <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;margin-top:2px;">${E(_.baseCost)} base</div>
        </div>`}d+="</div>",d+=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:${a.color};">${i.cargo}</div>`,d+="</div>",d+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Origin Shipyard</div>`;for(let _=0;_<Me.length;_++){const b=Me[_],p=tt===_,h=b.costMod>1?"#c84":b.costMod<1?"#5c5":"#6a6660",x=b.buildMod>1?"#c84":b.buildMod<1?"#5c5":"#6a6660";d+=`<div onclick="commSetNation(${_})" style="display:flex;align-items:center;padding:5px 8px;margin-bottom:2px;cursor:pointer;background:${p?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${p?"#8b9a6b44":"var(--panel-border)"};border-left:2px solid ${p?"#8b9a6b":"transparent"};">
            <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:11px;font-weight:600;color:${p?"var(--panel-text)":"#9e9a92"};">${y(b.name)}</span>
                    ${b.isHome?'<span style="font-family:var(--font-mono);font-size:6px;padding:0 3px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2);line-height:11px;">HOME</span>':""}
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${b.isHome?"Home port — no tariff":"Foreign shipyard"}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">MFG</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#9e9a92;">${b.mfg}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">COST</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${h};">×${b.costMod.toFixed(2)}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">SPEED</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${x};">×${b.buildMod.toFixed(2)}</div></div>
            </div>
        </div>`}d+="</div>",d+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Vessel Name</div>
        <input id="comm-name-input" value="${y(it)}" oninput="commSetName(this.value)" placeholder="e.g., MV 'Sierra Nevada'" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:11px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;box-sizing:border-box;" />
    </div>`,d+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Build Summary</div>
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:6px 10px;">`;const m=[{label:"VESSEL CLASS",value:ae,color:a.color},{label:"SHIPYARD",value:o.name,color:"#9e9a92"},{label:"BASE COST",value:E(i.baseCost)+" × "+o.costMod.toFixed(2),color:"#9e9a92"},{label:"BUILD TIME",value:r+" ticks",color:r>i.baseBuild?"#c84":r<i.baseBuild?"#5c5":"#9e9a92"},{label:"COMPLETION",value:"~Tick "+c,color:"#9e9a92"}];for(const _ of m)d+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${_.label}</span>
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${_.color};">${_.value}</span>
        </div>`;d+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">TOTAL COST</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c8a832;">${E(s)}</span>
    </div>`,d+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEPOSIT (50% NOW)</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">${E(n)}</span>
    </div>`,d+=`<div style="display:flex;justify-content:space-between;padding:3px 0;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">BALANCE ON COMPLETION</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${E(l)}</span>
    </div>`,d+="</div></div>",d+=`<div style="padding:6px 16px;">
        <div style="padding:5px 8px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#c8a832;margin-bottom:2px;">PAYMENT TERMS</div>
            <div style="font-size:9px;color:#6a6660;line-height:1.5;">50% deposit due immediately. Remaining 50% due on delivery at tick ${c}. Vessel delivered at 100% condition, fully fueled, to your nearest port. Cancellation forfeits deposit.</div>
        </div>
    </div>`,d+="</div>";const u=it.trim().length>=2;d+=`<div style="padding:10px 16px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">DEPOSIT DUE NOW</div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${E(n)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="smCloseCommission()" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="comm-order-btn" onclick="${u?"smPlaceOrder()":""}" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:${u?"#000":"#6a6660"};background:${u?"#c8a832":"transparent"};border:1px solid ${u?"#c8a832":"var(--panel-border)"};cursor:${u?"pointer":"default"};opacity:${u?1:.4};">PLACE ORDER</div>
        </div>
    </div>`,t.innerHTML=d}let Ve=!1;async function hn(){if(Ve||!f||!M)return;const t=it.trim();if(t.length<2)return;const e=Ke.find(b=>b.cls===ae)||Ke[0],i=Me[tt];if(!i)return;const o=Math.round(e.baseCost*i.costMod),a=Math.max(2,Math.round(e.baseBuild*i.buildMod)),s=Math.round(o*.5),r=o-s,n=M.current_tick||0,l=Number(f.corp_cash_reserves??0);if(l<s){alert("Insufficient cash for deposit. Need "+E(s)+".");return}if(!confirm("Commission "+ae+" from "+i.name+`?

Deposit: `+E(s)+` (non-refundable)
Balance: `+E(r)+" on delivery at tick "+(n+a)))return;Ve=!0;const c=document.getElementById("comm-order-btn");c&&(c.style.opacity="0.4",c.style.pointerEvents="none");const{error:v}=await g.from("factions").update({corp_cash_reserves:l-s}).eq("id",f.id);if(v){alert("Failed: "+v.message),Ve=!1;return}const{data:d}=await g.from("nations").select("budget_reserves").eq("id",i.id).single();if(d){var{error:m}=await g.from("nations").update({budget_reserves:Number(d.budget_reserves||0)+s}).eq("id",i.id);m&&console.warn("Failed to credit shipyard nation budget:",m.message)}const u=rt[ae]||rt.Coastal,{error:_}=await g.from("vessel_orders").insert({faction_id:f.id,vessel_name:t,vessel_class:ae,capacity_dwt:u.capacity_dwt,capacity_unit:u.capacity_unit,base_maintenance:u.base_maintenance,fuel_capacity:u.fuel_capacity,purchase_price:e.baseCost,shipyard_nation_id:i.id,shipyard_nation:i.name,cost_modifier:i.costMod,build_modifier:i.buildMod,total_cost:o,deposit_paid:s,balance_due:r,ordered_at_tick:n,delivery_tick:n+a,build_ticks:a,status:"building"});if(_){await g.from("factions").update({corp_cash_reserves:l}).eq("id",f.id),alert("Failed to place order: "+_.message),Ve=!1;return}f.corp_cash_reserves=l-s,Ve=!1,fo(),alert(t+` commissioned!

Class: `+ae+`
Shipyard: `+i.name+`
Deposit: `+E(s)+`
Delivery: Tick `+(n+a))}window.smSelectListing=mn;window.smPurchase=un;window.smOpenCommission=yn;window.smCloseCommission=fo;window.commSetClass=_n;window.commSetNation=xn;window.commSetName=bn;window.smPlaceOrder=hn;window.flSelectVessel=on;window.flRefurbish=an;window.flRefuel=nn;window.flSell=sn;window.flRename=rn;window.openBidReview=Ka;window.closeBidReview=wt;window.reviewSelectBid=Ja;window.acceptBid=Xa;window.declineAllBids=Za;Ba();
