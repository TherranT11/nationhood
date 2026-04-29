const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-CQCvri_9.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as _}from"./supabase-client-qEAQbBjE.js";/* empty css                    *//* empty css                         */import{c as fe,i as xa,M as at,Q as di,a as pi,b as Kt,d as Fi,e as Hi}from"./corp-auto-services-BIIzQFak.js";import{_ as ha}from"./preload-helper-BXl3LOEh.js";import{escapeHtml as y,hfFmtBig as T}from"./utils-A98FEun4.js";import{initMessaging as $a}from"./messaging-hdfDukBE.js";import{c as wa,a as Jt,E as ot,b as Et,d as Gi,e as ka,f as Ea,h as zi}from"./equipment-DsuDdEne.js";import{l as Ta,a as Ca}from"./corp-shipping-data-DA_tOdLs.js";import{V as yt}from"./vessels-CjafVZ4G.js";import{SECTOR_OPS_PAGE as Vi}from"./corp-topbar-CQCvri_9.js";import"./loan-math-Q4nHfU_i.js";let Ce=[],p=null,L=null,M=null,Ae=[];const Xt={};let Ye={},W=[],K={},Zt=-1;const Ia={em:"em_systems",glass:"glass_facades",heavy:"heavy_parts"},_t=e=>Ia[e]||e;let Z="concrete",G="STD",me=500,Ge=null,te=[],gt={},ei=0,mi=[];async function qa(){if(!p?.id)return;const{data:e}=await _.from("corp_properties").select("*").eq("faction_id",p.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});mi=e||[]}let de=[],nt=null,Xe={},bt={},fi=[],xt=null,se="trucks",ue=0,ge=1,Ie=[],Le=null,Qe=[],ti=null,ft=null;function Be(){return Ge||L}let ii="ALL",ai="TIMELINE";function O(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function Aa(e){if(e>=12){const t=Math.floor(e/12),i=e%12;return i>0?t+"y "+i+"mo":t+"y"}return e+" ticks"}function Wi(e){return!e||e.length===0?"":e.map(t=>{const i=gt[t];if(!i)return"";const a=i.reputation_bonus>0?"var(--green)":i.reputation_bonus<0?"var(--red)":"var(--text-dim)",o=i.reputation_bonus>0?"+"+i.reputation_bonus:i.reputation_bonus<0?String(i.reputation_bonus):"";return`<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background: var(--border-hair);border:1px solid var(--border-0);border-radius:3px;font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">${i.icon||"📍"} ${y(i.name)}${o?` <span style="color:${a};font-weight:700;">${o} REP</span>`:""}</span>`}).filter(Boolean).join(" ")}function re(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(1)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(0)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function vi(e){return e==="civil_engineering"?"CIVIL":e==="industrial"?"INDUSTRIAL":e==="mega_project"?"MEGA":e?.toUpperCase()||"—"}function Yi(e){return e==="civil_engineering"?"light":e==="industrial"?"heavy":e==="mega_project"?"mega":"light"}function Na(){ft&&clearInterval(ft),ft=setInterval(()=>{if(!ti)return;const e=ti-Date.now();if(e<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(ft);return}const t=Math.floor(e/36e5),i=Math.floor(e%36e5/6e4),a=Math.floor(e%6e4/1e3);document.getElementById("tick-countdown").textContent=t+"h "+i+"m "+a+"s"},1e3)}function Sa(e,t){e==="type"&&(ii=t),e==="sort"&&(ai=t),document.querySelectorAll(`.filter-pill[data-filter="${e}"]`).forEach(i=>{i.classList.toggle("active",i.dataset.value===t)}),Qi()}const Pi={"Civil Engineering":"civil_engineering","Industrial Construction":"industrial",Megaprojects:"mega_project"};function oi(e){if(!p)return!1;if(Pi[p.corp_subsector]===e.sector)return!0;const i=(mi||[]).filter(a=>a.type==="regional_hq"&&a.is_active&&a.nation_id===e.nation_id);for(const a of i)if(Pi[a.subsector]===e.sector)return!0;return!1}function Qi(){const e=document.getElementById("oc-list");let t=[...Ae];ii==="GOVERNMENT"?t=t.filter(r=>r.issuer_type==="GOVERNMENT"):ii==="PRIVATE"&&(t=t.filter(r=>r.issuer_type==="PRIVATE"));const i=new Set;p?.nation_id&&i.add(p.nation_id);for(const r of mi||[])r.type==="regional_hq"&&r.is_active&&r.nation_id&&i.add(r.nation_id);const a=r=>i.has(r.nation_id)&&oi(r),o=(r,l)=>ai==="TIMELINE"?(r.timeline_ticks||0)-(l.timeline_ticks||0):ai==="BUDGET"?(l.budget_ceiling||0)-(r.budget_ceiling||0):0;if(t.sort((r,l)=>{const c=a(r)?1:0,m=a(l)?1:0;return c!==m?m-c:o(r,l)}),document.getElementById("oc-count").textContent=t.length+" AVAILABLE",t.length===0){e.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const n=M?.current_tick||0;let d="";for(const r of t){const l=r.issuer_type==="GOVERNMENT",c=l?"gov":"private",m=oi(r),s=m?"":" locked",f=Yi(r.sector),u=vi(r.sector),g=(r.timeline_ticks||0)>18?" warn":"",b=r.bidding_ends_tick?Math.max(0,r.bidding_ends_tick-n):"?",v=Xt[r.nation_id]||"—",x=i.has(r.nation_id);d+=`
            <div class="oc-item${s}" data-contract-id="${r.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${y(r.name)}</span>
                    <span class="oc-item__type-badge ${c}">${l?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${c}">${y(r.issuer_name||"—")}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.7px;color:${x?"var(--teal)":"var(--text-dim)"};margin-left:8px;text-transform:uppercase;">${y(v)}${x?" · HQ":""}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${b} tick${b!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${re(r.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${g}">${Aa(r.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${f}">${u}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${Ye[r.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${re(Ye[r.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${m?"yes":"no"}">${m?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${m?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openContractDetail(contracts.find(x=>x.id==='${r.id}'))">VIEW</button>`:""}
                </div>
                ${r.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${y(r.description)}</div>`:""}
                ${r.modifiers&&r.modifiers.length>0?`<div style="display:flex;flex-wrap:wrap;gap:3px;padding:4px 0 0;">${Wi(r.modifiers)}</div>`:""}
            </div>`}e.innerHTML=d,e.querySelectorAll(".oc-item:not(.locked)").forEach(r=>{r.addEventListener("click",()=>{const l=r.dataset.contractId,c=Ae.find(m=>m.id===l);c&&Ki(c)})})}let ze=null;function Ki(e){ze=e;const t=document.getElementById("cd-overlay"),i=e.issuer_type==="GOVERNMENT",a=i?"gov":"private",o=(L?.name||p.nation||"—").toUpperCase(),n=oi(e);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${y(o)}</span>
        <span class="cd-header__name">${y(e.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${a}">${y(e.issuer_name)}</span>
        <span class="cd-header__type-badge ${a}">${i?"GOV":"PRIVATE"}</span>
    `;const d=document.getElementById("cd-blueprint");e.blueprint_svg?(d.innerHTML=e.blueprint_svg,d.style.display=""):(d.innerHTML=Xa(e),d.style.display="");const r=e.permits_required||[],l=e.required_equipment||e.equipment_required||{},c=Array.isArray(l)?l.map(z=>({key:z,qty:1})):Object.entries(l).map(([z,E])=>({key:z,qty:E})),m=e.required_materials||e.materials_estimated||{},f={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[e.sector]||e.spec_category||e.sector||"—";let u="var(--teal)";e.sector==="industrial"&&(u="var(--orange)"),e.sector==="mega_project"&&(u="var(--red)");let g=O(e.budget_ceiling||e.budget||0),b=(e.timeline_ticks||e.timeline_months||0)+" Months",v="";v+=`
        <div class="cd-issue">
            <div class="cd-issue__left">
                <span class="cd-issue__label">PROJECT ISSUE</span>
                <span class="cd-issue__number">${y(e.project_code||e.contract_number||"")}</span>
            </div>
            <div class="cd-issue__tags">
                ${e.project_type?`<span class="cd-tag teal">${y(e.project_type.toUpperCase())}</span>`:""}
                ${e.project_subtype?`<span class="cd-tag gold">${y(e.project_subtype.toUpperCase())}</span>`:""}
            </div>
        </div>`,e.description&&(v+=`
            <div class="cd-desc">
                <div class="cd-section-label">Brief Description</div>
                <div class="cd-desc__text">${y(e.description)}</div>
            </div>`);const x=e.modifiers||[];if(x.length>0){v+=`<div class="cd-items">
            <div class="cd-section-label">Building Modifiers</div>
            <div style="display:flex;flex-direction:column;gap:6px;">`;for(const z of x){const E=gt[z];if(!E)continue;const j=E.reputation_bonus>0?"var(--green)":E.reputation_bonus<0?"var(--red)":"var(--text-dim)",B=E.cost_multiplier>1?"+"+Math.round((E.cost_multiplier-1)*100)+"% cost":E.cost_multiplier<1?Math.round((1-E.cost_multiplier)*100)+"% cheaper":"",F=E.reputation_bonus!==0?(E.reputation_bonus>0?"+":"")+E.reputation_bonus+" rep":"",X=E.required_permits||[];v+=`<div style="padding:6px 10px;background: var(--border-hair);border:1px solid var(--border-hair);border-radius:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:600;font-size:0.78rem;color:var(--text-primary);">${E.icon||"📍"} ${y(E.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;">
                        ${B?`<span style="color:var(--amber);">${B}</span>`:""}
                        ${B&&F?" · ":""}
                        ${F?`<span style="color:${j};font-weight:700;">${F}</span>`:""}
                    </span>
                </div>
                <div style="font-size:0.65rem;color:var(--text-dim);margin-top:2px;">${y(E.description||"")}</div>
                ${X.length>0?`<div style="font-size:0.6rem;color:var(--amber);margin-top:3px;font-family:var(--font-mono);">Requires permits: ${X.map(we=>y(we.replace(/_/g," "))).join(", ")}</div>`:""}
            </div>`}v+="</div></div>"}v+='<div class="cd-details">',e.project_type&&(v+=Ee("Type",e.project_type)),e.project_subtype&&(v+=Ee("Sub-Type",e.project_subtype)),v+=Ee("Specialization",f,u),v+=Ee("Total Budget",g,"var(--green)"),v+=Ee("Timeline",b),v+=Ee("Nation",L?.name||p.nation||"—"),e.region&&(v+=Ee("Region",e.region)),v+="</div>",r.length>0&&(v+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${r.map(z=>{const E=z.status==="approved"?"approved":"required",j=z.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${E}">
                            <span class="cd-chip__icon">${j}</span>
                            <span class="cd-chip__label">${y(z.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),m.length>0&&(v+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${m.map(z=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${y(z.name)}</span>
                        <span class="cd-mat-row__qty">${y(String(z.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=v;const h=r.filter(z=>z.status==="approved").length,$=r.length-h,I=c.length,C=[];for(const z of c){const E=Tt[z.key]||z.key,j=te.find(B=>B.equipment_key===E||B.equipment_key===z.key);j&&j.owned>=z.qty||C.push(z)}const w=C.length,k=e.required_materials||{},S=typeof k=="object"&&!Array.isArray(k)?Object.entries(k):[],A=[];for(const[z,E]of S){const j=K[z]||{},B=(j.LOW?.qty||0)+(j.STD?.qty||0)+(j.HIGH?.qty||0);B<E&&A.push({key:z,need:E,have:B})}const q=z=>z.replace(/_/g," ").replace(/\b\w/g,E=>E.toUpperCase());let P="";if(I>0)if(w===0)P+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>';else{const z=C.map(E=>q(E.key)).join(", ");P+=`<span class="cd-footer__badge bad" title="${y(z)}">${w} SHORT: ${y(z)}</span>`}if(S.length>0)if(A.length===0)P+='<span class="cd-footer__badge ok">ALL MATERIALS MET</span>';else{const z=A.map(E=>q(E.key)+" ("+E.have+"/"+E.need+")").join(", ");P+=`<span class="cd-footer__badge bad" title="${y(z)}">${A.length} MAT SHORT: ${y(z)}</span>`}r.length>0&&($===0?P+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':P+=`<span class="cd-footer__badge warn">${$} PERMITS PENDING</span>`);const D=n,Y=e.issuer_faction_id===p?.id,U=e.status==="bidding",ie=Ye[e.id];document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${P}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${Y?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${U?"":"disabled"} title="${U?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:ie?`<button class="cd-btn primary" onclick="retractBid('${e.id}')" style="background:#c55;border-color:#c55;"
                        title="Retract your bid ($1M penalty)">RETRACT BID</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${D?"":"disabled"}
                        title="${D?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,t.classList.add("open"),document.body.style.overflow="hidden"}function pt(e){e&&e.target&&e.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",ze=null)}const Tt={work_trucks:"trucks",concrete_mixers:"mixers",tower_cranes:"cranes",heavy_haulers:"haulers",pile_drivers:"piledrivers",asphalt_plants:"asphalt"},le=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],Oi={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},Bi={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let N=null;async function Ma(e,t,i){if(!_||!e||!t||!i)return[];try{const{data:a,error:o}=await _.rpc("get_project_permit_requirements",{p_contract_id:e,p_faction_id:t,p_nation_id:i});return o?(console.warn("[pm permits] failed to load permit requirements:",o.message),[]):Array.isArray(a)?a.filter(n=>n&&n.name).map(n=>({name:String(n.name),has_permit:n.has_permit===!0})):[]}catch(a){return console.warn("[pm permits] unexpected error loading permit requirements:",a),[]}}async function De(e){const t=W.find(E=>E.id===e);if(!t)return;const i=Array.isArray(t.contract_bids)?t.contract_bids[0]:t.contract_bids,a=M?.current_tick||0,o=t.awarded_at_tick||a,n=t.timeline_ticks||8,d=Math.max(0,a-o),r=Math.min(100,d/n*100);let l=Math.min(le.length-1,Math.floor(r/(100/le.length)));const c=Math.round(r%(100/le.length)/(100/le.length)*100),m=t.required_materials||{},s=i?.material_grades||{};let f=[];try{const{data:E}=await _.from("project_material_allocations").select("material_key, quality_tier, quantity, consumed").eq("contract_id",t.id);f=E||[]}catch{}const u={};for(const E of f)u[E.material_key]||(u[E.material_key]={totalAllocated:0,totalConsumed:0,tiers:{}}),u[E.material_key].totalAllocated+=E.quantity,u[E.material_key].totalConsumed+=E.consumed,u[E.material_key].tiers[E.quality_tier]={qty:E.quantity,consumed:E.consumed};const g=Object.entries(m).map(([E,j])=>{const B=s[E]||"STD",F=u[E]||{totalAllocated:0,totalConsumed:0,tiers:{}};return{key:E,name:E.replace(/_/g," ").replace(/\b\w/g,X=>X.toUpperCase()),grade:B,required:Number(j),allocated:F.totalAllocated,consumed:F.totalConsumed,tiers:F.tiers,warehouseStock:K[E]||{}}}),b=t.required_equipment||{},v=t.equipment_condition||{},h=(Array.isArray(b)?b.map(E=>[E,1]):Object.entries(b)).map(([E,j])=>{const B=Tt[E]||E,F=te.find(ne=>ne.equipment_key===B||ne.equipment_key===E),we=(F?.assigned_projects||[]).find(ne=>ne.contract_id===t.id),Mt=we?we.units:0;return{key:E,name:E.replace(/_/g," ").replace(/\b\w/g,ne=>ne.toUpperCase()),required:Number(j)||1,ownedTotal:F?.owned||0,deployed:F?.deployed||0,available:Math.max(0,(F?.owned||0)-(F?.deployed||0)),assignedToProject:Mt,condition:v[E]??(F?.condition||100)}}),$=t.budget_ceiling||0,I=i?.estimated_cost||0,C=Math.round(I*Math.min(1,d/n)),w=i?.estimated_quality||65,k=w>=75?"EXCELLENT":w>=50?"FAIR":w>=25?"POOR":"BAD",S=t.required_workforce||{},A=t.workers_assigned||{},q=(S.general||0)+(S.skilled||0)+(S.innovative||0),P=(A.general||0)+(A.skilled||0)+(A.innovative||0),D=i?.labor_count||q,Y=Number(p?.corp_general_workforce??0),U=Number(p?.corp_skilled_workforce??0),ie=Number(p?.corp_innovative_workforce??0),z=await Ma(t.id,p?.id,t.nation_id);N={project:t,bid:i,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:a,awardedTick:o,totalTicks:n,ticksElapsed:d,phaseIdx:l,phaseProgress:c,materials:g,equipment:h,permitRequirements:z,budget:$,estCost:I,spent:C,quality:w,qualityLabel:k,laborCount:D,wfNeeded:q,wfAssigned:P,reqWf:S,assignedWf:A,corpGeneral:Y,corpSkilled:U,corpInnovative:ie,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",Ji(t.id).then(()=>Oe()),Oe()}let V=!1;async function Ra(e,t,i){if(!(V||!N||!p)){V=!0;try{const{data:a,error:o}=await _.rpc("allocate_material_to_project",{p_contract_id:N.project.id,p_faction_id:p.id,p_material_key:e,p_quality_tier:t,p_quantity:i});if(o){alert("Allocation failed: "+o.message);return}if(a&&!a.success){alert(a.error||"Allocation failed");return}await yi(),await De(N.project.id)}catch(a){alert("Allocation error: "+a.message)}finally{V=!1}}}async function La(e,t,i){if(!(V||!N||!p)){V=!0;try{const{data:a,error:o}=await _.rpc("deallocate_material_from_project",{p_contract_id:N.project.id,p_faction_id:p.id,p_material_key:e,p_quality_tier:t,p_quantity:i});if(o){alert("Return failed: "+o.message);return}if(a&&!a.success){alert(a.error||"Return failed");return}await yi(),await De(N.project.id)}catch(a){alert("Return error: "+a.message)}finally{V=!1}}}async function za(e,t){if(!(V||!N||!p)){V=!0;try{const i=N.project,a=i.workers_assigned||{},o=Number(a[e]||0),n=Number((i.required_workforce||{})[e]||0),d=Number(p?.["corp_"+e+"_workforce"]??0);let r=0;for(const u of W||[])u.id!==i.id&&(r+=Number((u.workers_assigned||{})[e]||0));const l=Math.max(0,d-r-o),c=Math.min(t,n-o,l);if(c<=0){alert(l<=0?"No "+e+" workers available in pool":"Already fully staffed for "+e);return}const m={...a,[e]:o+c},{error:s}=await _.from("construction_contracts").update({workers_assigned:m}).eq("id",i.id);if(s){alert("Assign failed: "+s.message);return}const f=W.find(u=>u.id===i.id);f&&(f.workers_assigned=m),await De(i.id)}catch(i){alert("Assign error: "+i.message)}finally{V=!1}}}async function Pa(e,t){if(!(V||!N||!p)){V=!0;try{const i=N.project,a=i.workers_assigned||{},o=Number(a[e]||0),n=Math.min(t,o);if(n<=0){alert("No "+e+" assigned");return}const d={...a,[e]:o-n},{error:r}=await _.from("construction_contracts").update({workers_assigned:d}).eq("id",i.id);if(r){alert("Unassign failed: "+r.message);return}const l=W.find(c=>c.id===i.id);l&&(l.workers_assigned=d),await De(i.id)}catch(i){alert("Unassign error: "+i.message)}finally{V=!1}}}async function Oa(e,t){if(!(V||!N||!p)){V=!0;try{const i=Tt[e]||e,a=te.find(c=>c.equipment_key===i||c.equipment_key===e);if(!a){alert("Equipment not found in inventory.");return}const o=Math.max(0,(a.owned||0)-(a.deployed||0));if(o<t){alert("Not enough available "+e+" ("+o+" available).");return}const n=(a.deployed||0)+t,d=[...a.assigned_projects||[]],r=d.find(c=>c.contract_id===N.project.id);r?r.units+=t:d.push({contract_id:N.project.id,contract_name:N.project.name,units:t});const{error:l}=await _.from("corp_equipment").update({deployed:n,assigned_projects:d}).eq("faction_id",p.id).eq("equipment_key",a.equipment_key);if(l){alert("Deploy failed: "+l.message);return}await Ci(),await De(N.project.id)}catch(i){alert("Deploy error: "+i.message)}finally{V=!1}}}async function Ba(e){if(!(V||!N||!p)){V=!0;try{const t=Tt[e]||e,i=te.find(l=>l.equipment_key===t||l.equipment_key===e);if(!i){alert("Equipment not found.");return}const a=[...i.assigned_projects||[]],o=a.findIndex(l=>l.contract_id===N.project.id);if(o===-1){alert("Equipment not deployed to this project.");return}const n=a[o].units;a.splice(o,1);const d=Math.max(0,(i.deployed||0)-n),{error:r}=await _.from("corp_equipment").update({deployed:d,assigned_projects:a}).eq("faction_id",p.id).eq("equipment_key",i.equipment_key);if(r){alert("Undeploy failed: "+r.message);return}await Ci(),await De(N.project.id)}catch(t){alert("Undeploy error: "+t.message)}finally{V=!1}}}function Da(e){e&&e.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",N=null)}function ja(e){N&&(N.tab=e,N.expandedEvent=-1,N.selectedResponse=null,Oe())}function Ua(e){N&&(N.expandedEvent=N.expandedEvent===e?-1:e,N.selectedResponse=null,Oe())}function Fa(e){N&&(N.selectedResponse=N.selectedResponse===e?null:e,Oe())}function Oe(){if(!N)return;const e=N,t=e.project,i=t.issuer_type==="GOVERNMENT",a=vi(t.sector),o=p?.nation||"Nation",n=e.awardedTick+e.totalTicks,d=Math.max(0,n-e.currentTick),r=e.currentTick>n,l=e.budget>0?Math.round(e.spent/e.budget*100):0,c=l>85?"var(--red)":l>60?"var(--amber)":"var(--teal)",m=e.budget-e.spent,s=e.events.filter(v=>v.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
        <div class="pm-hdr__row1">
            <div class="pm-hdr__left">
                <span class="pm-hdr__nation">${y(o.toUpperCase())}</span>
                <span class="pm-hdr__name">${y(t.name)}</span>
                <span style="color:var(--text-dim);font-size:12px">—</span>
                <span class="pm-hdr__issuer">${y(t.issuer_name||"—")}</span>
                <span class="pm-hdr__type">${i?"GOV":"PVT"}</span>
            </div>
            <button class="pm-hdr__close" onclick="closeProjectModal()">×</button>
        </div>
        <div class="pm-hdr__row2">
            <span class="pm-hdr__id">${y(t.template_key||t.id)}</span>
            <span class="pm-hdr__badge pm-hdr__badge--spec">${y(a.toUpperCase())}</span>
            <span class="pm-hdr__badge pm-hdr__badge--sub">${y((t.sector||"").replace(/_/g," ").toUpperCase())}</span>
        </div>
    `;let f='<div class="pm-phase__bar">';for(let v=0;v<le.length;v++){const x=v<e.phaseIdx,h=v===e.phaseIdx;f+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${x?"done":h?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${x?"done":h?"active":""}">${le[v]}</span>
        </div>`}f+="</div>",f+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${le[e.phaseIdx]} — ${e.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${r?"var(--red)":"var(--text-secondary)"}">Tick ${e.ticksElapsed} / ${e.totalTicks}${r?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=f;const u=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:s},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=u.map(v=>`<button class="pm-tab${e.tab===v.id?" active":""}" onclick="pmSetTab('${v.id}')">
            ${v.label}${v.badge>0?`<span class="pm-tab__badge">${v.badge}</span>`:""}
        </button>`).join("");let g="";e.tab==="overview"?g=Ha(e,t,c,l,m,d,r):e.tab==="events"?g=Ga(e):e.tab==="materials"?g=Va(e):e.tab==="equipment"&&(g=Wa(e)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${g}</div>`;let b="";s>0&&(b+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${s} EVENT${s>1?"S":""} REQUIRES RESPONSE</span>`),b+=`<span class="pm-ftr__badge" style="color:${e.quality>=75?"var(--green)":e.quality>=50?"var(--amber)":e.quality>=25?"var(--orange)":"var(--red)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${e.quality}/100 — ${e.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${b}</div>
        <div style="display:flex;gap:8px;">
            ${e.effectiveProgress>=e.totalTicks?`<button data-deliver-id="${N.project.id}" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#000;background:var(--green);border:none;cursor:pointer;" onclick="closeProjectModal();deliverProject('${N.project.id}','${(N.project.name||"").replace(/'/g,"\\'")}',${N.bid?.bid_price||0},${N.bid?.estimated_cost||0},${N.bid?.estimated_quality||65})">DELIVER</button>`:""}
            <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
        </div>
    `}function Ha(e,t,i,a,o,n,d){const r=Ne(e.awardedTick+e.totalTicks);Ne(e.awardedTick+e.totalTicks);const l=Ne(e.awardedTick),c=[{label:"Budget",value:re(e.budget),sub:`${a}% spent`,color:i},{label:"Spent",value:re(e.spent),color:"var(--red)"},{label:"Remaining",value:re(o),color:"var(--green)"},{label:"Quality",value:`${e.quality}/100`,sub:e.qualityLabel,color:e.quality>=75?"var(--green)":e.quality>=50?"var(--amber)":e.quality>=25?"var(--orange)":"var(--red)"},{label:"Workforce",value:`${e.laborCount}/${e.wfNeeded}`,sub:`Bid: ${e.laborCount}`,color:e.laborCount<e.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${n} ticks`,sub:d?"OVERDUE":`Deadline: ${r}`,color:d?"var(--red)":"var(--text-bright)"}];let m="";m+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${y(t.description||t.name)}</div>
    </div></div>`,m+='<div class="pm-metrics">';for(const v of c)m+=`<div class="pm-metric">
            <div class="pm-metric__label">${v.label}</div>
            <div class="pm-metric__value" style="color:${v.color}">${v.value}</div>
            ${v.sub?`<div class="pm-metric__sub">${y(v.sub)}</div>`:""}
        </div>`;m+="</div>",m+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${l}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${d?"var(--red)":"var(--text-bright)"};font-weight:700">${r}</span></span>
        </div>
    </div></div>`;const s=t.modifiers||[];s.length>0&&(m+='<div style="padding:0 16px"><div class="pm-section">',m+='<div class="pm-section__title">Building Modifiers</div>',m+='<div style="display:flex;flex-wrap:wrap;gap:4px;">',m+=Wi(s),m+="</div></div></div>");const f=Array.isArray(e.permitRequirements)?e.permitRequirements:[];if(f.length>0){m+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const v of f){const x=v.has_permit===!0,h=x?"HAS PERMIT":"NEEDS TO GET";m+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:${x?"var(--green)":"var(--amber)"}">${x?"✓":"!"}</span>
                    <span class="pm-permit__name">${y(v.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:${x?"var(--green)":"var(--amber)"}">${h}</span>
            </div>`}m+="</div></div>"}m+='<div style="padding:0 16px"><div class="pm-section">',m+='<div class="pm-section__title">Workforce Assignment</div>';const u=[{key:"general",label:"General Workers",corpAvail:e.corpGeneral,color:"var(--text-primary)"},{key:"skilled",label:"Skilled Workers",corpAvail:e.corpSkilled,color:"var(--blue)"},{key:"innovative",label:"Innovative Workers",corpAvail:e.corpInnovative,color:"var(--purple)"}];for(const v of u){const x=Number(e.reqWf[v.key]||0);if(x===0)continue;const h=Number(e.assignedWf[v.key]||0),I=h>=x?"var(--green)":h>0?"var(--amber)":"var(--red)",C=v.corpAvail>0&&h<x,w=Math.min(v.corpAvail,x-h),k=h>0;m+='<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-hair);font-size:0.72rem;">',m+="<div>",m+=`<span style="color:${v.color};font-weight:600;">${v.label}</span>`,m+=`<span style="color:var(--text-dim);margin-left:8px;">Required: <strong>${x}</strong></span>`,m+=`<span style="color:${I};margin-left:8px;font-weight:700;">${h} assigned</span>`,m+=`<span style="color:var(--text-dim);margin-left:8px;">Pool: ${v.corpAvail}</span>`,m+="</div>",m+='<div style="display:flex;gap:4px;">',C&&(m+=`<button onclick="pmAssignWorkers('${v.key}',${w})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Assign ${w}</button>`),k&&(m+=`<button onclick="pmUnassignWorkers('${v.key}',${h})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Remove ${h}</button>`),m+="</div></div>"}const g=Number(e.reqWf.general||0)+Number(e.reqWf.skilled||0)+Number(e.reqWf.innovative||0),b=Number(e.assignedWf.general||0)+Number(e.assignedWf.skilled||0)+Number(e.assignedWf.innovative||0);return g>0&&b<g&&(m+='<div style="font-size:0.62rem;color:var(--red);margin-top:6px;font-family:var(--font-mono);">⚠ Project will STALL until workforce is fully assigned</div>'),m+="</div></div>",m}function Ga(e){if(e.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let t="";for(let i=0;i<e.events.length;i++){const a=e.events[i],o=e.expandedEvent===i,n=a.status==="ACTIVE",d=Oi[a.type]||Oi.WEATHER,r=Bi[a.severity]||Bi.LOW;if(t+=`<div class="pm-evt ${n?"pm-evt--active":"pm-evt--resolved"}" style="${n?`border-left-color:${d.color}`:""}">`,t+=`<div class="pm-evt__header" onclick="pmToggleEvent(${i})" style="${o?`background:${d.bg}`:""}">`,t+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${d.color};background:${d.bg};border:1px solid ${d.border}">${a.type}</span>
            <span class="pm-evt__sev-badge" style="color:${r}">${a.severity}</span>
            <span class="pm-evt__status" style="color:${n?"var(--red)":"var(--text-dim)"};font-weight:${n?"700":"400"}">${n?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,t+=`<div class="pm-evt__title">${y(a.title)}</div>`,t+=`<div class="pm-evt__meta">Tick ${a.tick} · ${y(a.id||"")}</div>`,o){if(t+='<div class="pm-evt__body">',t+=`<div class="pm-evt__desc">${y(a.desc)}</div>`,a.impact&&(t+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${y(a.impact)}</span>
                </div>`),n&&a.responses&&a.responses.length>0){t+='<div class="pm-evt__resp-title">Response Options</div>';for(let l=0;l<a.responses.length;l++){const c=a.responses[l],m=e.selectedResponse===l,f={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[c.tag]||"var(--text-secondary)";t+=`<div class="pm-resp${m?" selected":""}" style="${m?`border-color:${f}`:""}" onclick="event.stopPropagation();pmSelectResponse(${l})">`,t+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${y(c.label)}</span>
                            <span class="pm-resp__tag" style="color:${f};background:${f}12;border:1px solid ${f}25">${c.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${c.delay>0?"var(--orange)":"var(--green)"}">
                            ${c.delay>0?`+${c.delay} tick${c.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,t+=`<div class="pm-resp__detail">${y(c.detail)}</div>`,t+='<div class="pm-resp__costs">',c.cost&&(t+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${re(c.cost)}</span>`),c.qualityImpact&&c.qualityImpact!==0&&(t+=`<span class="pm-resp__cost" style="color:${c.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${c.qualityImpact>0?"+":""}${c.qualityImpact}</span>`),!c.cost&&(!c.qualityImpact||c.qualityImpact===0)&&(t+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),t+="</div>",m&&(t+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${f}" onclick="event.stopPropagation();confirmEventResponse('${a.id}','${c.key}')">CONFIRM</button>
                        </div>`),t+="</div>"}}!n&&a.resolution&&(t+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${y(a.resolution)}</div>
                </div>`),t+="</div>"}t+="</div></div>"}return t}function Va(e){if(e.materials.length===0)return'<div class="pm-evt-empty">No materials required for this project.</div>';let t='<div class="pm-tab-header">Project Materials</div>';for(const i of e.materials){const a=i.required>0?Math.round(i.allocated/i.required*100):0;i.allocated>0&&Math.round(i.consumed/i.allocated*100);const o=i.allocated>=i.required,n=o?"var(--green)":i.allocated>0?"var(--amber)":"var(--red)",d=o?"FULLY ALLOCATED":i.allocated>0?"PARTIAL":"NONE ALLOCATED";t+='<div class="pm-mat" style="margin-bottom:14px;">',t+=`<div class="pm-mat__row1">
            <div class="pm-mat__left">
                <span class="pm-mat__name">${y(i.name)}</span>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:${n};">${i.allocated} / ${i.required} allocated · ${d}</span>
        </div>`,t+=`<div class="pm-mat__bar-row">
            <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${a}%;background:${n};"></div></div>
            <span class="pm-mat__pct">${i.consumed} consumed</span>
        </div>`;const r=["STD","LOW","HIGH"],l=i.required-i.allocated;for(const c of r){const m=i.warehouseStock[c]||{qty:0},s=i.tiers[c]||{qty:0,consumed:0},f=s.qty-s.consumed;if(m.qty===0&&s.qty===0)continue;const u=c==="HIGH"?"var(--green)":c==="LOW"?"var(--orange)":"var(--text-muted)",g=c==="HIGH"?"HIGH":c==="LOW"?"LOW":"STD";if(t+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border-hair);font-size:0.7rem;">',t+='<div style="display:flex;align-items:center;gap:6px;">',t+=`<span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${u};width:32px;">${g}</span>`,t+=`<span style="color:var(--text-dim);">Warehouse: <strong style="color:var(--text-primary);">${m.qty}</strong></span>`,s.qty>0&&(t+=`<span style="color:var(--text-dim);margin-left:8px;">Allocated: <strong style="color:var(--text-primary);">${s.qty}</strong></span>`),t+="</div>",t+='<div style="display:flex;gap:4px;">',m.qty>0&&l>0){const b=Math.min(m.qty,l);t+=`<button class="pm-alloc-btn" onclick="pmAllocateMaterial('${i.key}','${c}',${b})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Allocate ${b}</button>`}f>0&&(t+=`<button class="pm-alloc-btn" onclick="pmDeallocateMaterial('${i.key}','${c}',${f})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Return ${f}</button>`),t+="</div></div>"}t+="</div>"}return t}function Wa(e){if(e.equipment.length===0)return'<div class="pm-evt-empty">No equipment required for this project.</div>';let t='<div class="pm-tab-header">Project Equipment</div>';for(const i of e.equipment){const a=i.condition>=75?"var(--green)":i.condition>=50?"var(--amber)":i.condition>=25?"var(--orange)":"var(--red)",o=i.assignedToProject>=i.required,n=i.assignedToProject>0&&i.assignedToProject<i.required,d=o?"var(--green)":n||i.ownedTotal>0?"var(--amber)":"var(--red)",r=o?`${i.assignedToProject}/${i.required} DEPLOYED`:n?`${i.assignedToProject}/${i.required} PARTIAL`:i.ownedTotal>0?"NOT DEPLOYED":"NOT OWNED";t+=`<div class="pm-eq" style="margin-bottom:12px;">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${y(i.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${d};margin-left:8px;">${r}</span>
                </div>
            </div>`,i.assignedToProject>0&&(t+=`<div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${i.condition}%;background:${a}"></div></div>
                <span class="pm-eq__cond-val" style="color:${a}">${i.condition}%</span>
            </div>`);const l=Math.min(i.available,i.required-i.assignedToProject);t+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:0.7rem;">',t+=`<span style="color:var(--text-dim);">Required: <strong style="color:${o?"var(--green)":"var(--red)"}">${i.required}</strong>`,t+=` · Owned: <strong style="color:var(--text-primary);">${i.ownedTotal}</strong>`,t+=` · Available: <strong style="color:var(--text-primary);">${i.available}</strong></span>`,t+='<div style="display:flex;gap:4px;">',l>0&&(t+=`<button onclick="pmDeployEquipment('${i.key}',${l})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Deploy ${l}</button>`),i.assignedToProject>0&&(t+=`<button onclick="pmUndeployEquipment('${i.key}')" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Undeploy</button>`),t+="</div></div>",t+="</div>"}return t}function Ne(e){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][e%12]}, ${2e3+Math.floor(e/12)}`}async function Ya(e,t){if(!p||!M)return;const i=prompt(`REQUEST CONSTRUCTION INSURANCE
`+"─".repeat(35)+`

Describe what this policy should cover:

e.g., "Full coverage for weather delays, material damage, and labor disputes during construction. Should cover cost overruns up to 20% of budget."

Insurance corps will see this in their Deal Flow.`);if(i===null)return;const a=i.trim()||"Construction Insurance",o=M.current_tick||0,{error:n}=await _.from("finance_loan_requests").insert({requesting_faction_id:p.id,nation_id:p.nation_id,request_type:"insurance",insured_contract_id:e,amount:t,term_months:0,purpose:a,status:"open",created_tick:o,expires_tick:o+12});if(n){n.message.includes("duplicate")||n.message.includes("unique")?alert("Insurance already requested for this project."):alert("Failed to request insurance: "+n.message);return}alert("Insurance request posted to Deal Flow. Insurance corporations can now offer coverage."),await st()}window.requestInsurance=Ya;let zt=!1;const Pt=new Set;function Qa(e,t){const i=e?.template_key;if(!i)return null;if(i==="fuel_depot"||i==="dry_dock"){const a=e.project_subtype||"Basic",o=ut.find(n=>n.type===i&&n.name===e.name)||ut.find(n=>n.type===i&&n.style===a)||ut.find(n=>n.type===i);return{type:i,style:a,capacity:a==="Modern"?500:250,maintenance:o?.maint||Math.round(t*.001)}}return i==="custom_building"?{type:{"Insurance Office":"insurance_office","Claims Office":"claims_office","Branch Office":"branch_office","Trading Floor":"trading_floor"}[e.project_type]||"office",style:e.project_subtype||"Basic",capacity:500,maintenance:Math.round(t*.001)}:null}function Di(e,t){document.querySelectorAll(`[data-deliver-id="${e}"]`).forEach(i=>{i.disabled=t,i.style.opacity=t?"0.55":"",i.style.cursor=t?"not-allowed":"pointer",t&&(i.textContent="DELIVERING…")})}async function Ka(e,t,i,a,o){if(!(zt||!p||!M)&&!Pt.has(e)&&confirm('Deliver "'+t+`"?

An inspection will be conducted and payment issued based on quality.`)){zt=!0,Di(e,!0);try{const n=M.current_tick||0,d=o||65,r=Math.floor(Math.random()*21)-10,l=Math.max(10,Math.min(100,d+r)),c=l>=80?"DISTINCTION":l>=60?"PASS":l>=40?"CONDITIONAL":"FAIL",m=l>=80?Math.round(i*.1):0,s=c==="FAIL"?Math.round(i*.3):c==="CONDITIONAL"?Math.round(i*.1):0,f=Math.max(0,i+m-s),u=f-a,g=c==="DISTINCTION"?3:c==="PASS"?1:c==="CONDITIONAL"?-1:-3,{data:b}=await _.from("construction_contracts").select("awarded_at_tick, timeline_ticks, stalled_ticks, issuer_faction_id, nation_id, status, name, template_key, project_type, project_subtype, issuer_type, issuer_name").eq("id",e).single();if(!b){alert("Contract not found.");return}if(b.status==="completed"||b.status==="delivered"){Pt.add(e),alert("This project has already been delivered."),await st();return}const v=b.timeline_ticks||8,x=Math.max(0,n-(b.awarded_at_tick||n)),h=x<=v,{error:$}=await _.from("construction_deliveries").insert({contract_id:e,faction_id:p.id,nation_id:b.nation_id,result:c,quality_score:l,rep_change:g,inspection:{base_quality:d,variance:r,final:l},contract_value:i,quality_bonus:m,penalties:s,payment_received:f,total_cost:a,net_profit:u,timeline_expected:v,timeline_actual:x,on_time:h,delivered_at_tick:n});if($){alert("Delivery failed: "+$.message);return}const{error:I}=await _.from("construction_contracts").update({status:"completed",completed_at_tick:n}).eq("id",e);if(I){alert("Failed to mark project completed: "+I.message);return}try{const{data:q}=await _.from("corp_equipment").select("id, equipment_key, deployed, assigned_projects").eq("faction_id",p.id);for(const P of q||[]){const D=Array.isArray(P.assigned_projects)?P.assigned_projects:[],Y=D.find(E=>E?.contract_id===e);if(!Y)continue;const U=Number(Y.units)||0,ie=D.filter(E=>E?.contract_id!==e),z=Math.max(0,Number(P.deployed||0)-U);await _.from("corp_equipment").update({deployed:z,assigned_projects:ie}).eq("id",P.id)}}catch{}if(f>0){const{data:q}=await _.from("factions").select("corp_cash_reserves").eq("id",p.id).single();q&&await _.from("factions").update({corp_cash_reserves:Number(q.corp_cash_reserves||0)+f}).eq("id",p.id)}if(g!==0){const{data:q}=await _.from("factions").select("corp_reputation").eq("id",p.id).single();q&&await _.from("factions").update({corp_reputation:Math.max(0,Math.min(100,Number(q.corp_reputation||50)+g))}).eq("id",p.id)}if(b.issuer_faction_id)try{const q=Qa(b,i);q&&await _.from("corp_properties").insert({faction_id:b.issuer_faction_id,nation_id:b.nation_id,name:b.name||t,type:q.type,role:q.type,style:q.style,capacity:q.capacity,purchase_price:i,monthly_maintenance:q.maintenance,condition:Math.max(25,Math.min(100,l)),purchased_at_tick:n,built_via_contract_id:e,is_active:!0})}catch(q){console.warn("[deliverProject] Failed to register property for issuer:",q?.message||q)}const C=b.issuer_name||"the client",{data:w}=await _.from("nations").select("name").eq("id",b.nation_id).single(),k=w?.name||"Unknown",S=p.faction_name+" has completed the "+t+" project for "+C+" in "+k+".",A=new Set([b.nation_id]);p.nation_id&&p.nation_id!==b.nation_id&&A.add(p.nation_id);try{await _.from("event_log").insert([...A].map(q=>({nation_id:q,event_name:t+" — Project Completed",category:"corporate",description_chosen:S,fired_at_tick:n})))}catch(q){console.warn("[Deliver] Event log failed:",q.message)}alert(`Project delivered!

Result: `+c+`
Quality: `+l+`/100
Payment: `+T(f)+(m>0?" (includes +"+T(m)+" quality bonus)":"")+(s>0?`
Penalties: -`+T(s):"")+`
Reputation: `+(g>0?"+":"")+g+`
Net Profit: `+(u>=0?"+":"")+T(u)),Pt.add(e),await st(),await sa()}catch(n){alert("Delivery failed: "+(n.message||n)),Di(e,!1)}finally{zt=!1}}}window.deliverProject=Ka;window.openProjectModal=De;window.closeProjectModal=Da;window.pmSetTab=ja;window.pmToggleEvent=Ua;window.pmSelectResponse=Fa;window.pmAllocateMaterial=Ra;window.pmDeallocateMaterial=La;window.pmDeployEquipment=Oa;window.pmUndeployEquipment=Ba;window.pmAssignWorkers=za;window.pmUnassignWorkers=Pa;async function Ji(e){if(!N)return;const{data:t,error:i}=await _.from("construction_events").select("*").eq("contract_id",e).order("fired_at_tick",{ascending:!1});i?(console.warn("Failed to load project events:",i.message),N.events=[]):N.events=(t||[]).map(a=>({id:a.id,type:a.type,severity:a.severity,tick:a.fired_at_tick,title:a.title,desc:a.description,impact:a.impact,status:a.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:a.resolution,responses:a.responses||[]})),Oe()}let Ot=!1;async function Ja(e,t){if(!(Ot||!N)){Ot=!0;try{const{data:i,error:a}=await _.rpc("resolve_construction_event",{p_event_id:e,p_response_key:t});if(a){console.error("Failed to resolve event:",a.message),alert("Failed to submit response: "+a.message);return}const o=typeof i=="string"?JSON.parse(i):i;if(o?.error){alert("Error: "+o.error);return}await Ji(N.project.id),await st(),o?.quality_applied&&o.quality_applied!==0&&(N.quality=Math.max(0,Math.min(100,N.quality+o.quality_applied)),N.qualityLabel=N.quality>=75?"EXCELLENT":N.quality>=50?"FAIR":N.quality>=25?"POOR":"BAD"),Oe()}finally{Ot=!1}}}window.confirmEventResponse=Ja;function Ee(e,t,i){const a=i?` style="color:${i}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${y(e)}</span>
        <span class="cd-detail-row__value"${a}>${y(t)}</span>
    </div>`}function Xa(e){const t={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},i=e.drawing_number||e.contract_number+"-A1",a=M?.current_date||"",o=a?a.replace(/,\s*/," "):"",n=e.spec_category==="Heavy Infrastructure",d=e.spec_category==="Megaproject";let r=y(e.project_subtype||e.project_type||"STRUCTURE"),l=n?"80.0m":d?"200.0m":"60.0m",c=n?"40.0m":d?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${t.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(m,s)=>`<line x1="${s*20}" y1="0" x2="${s*20}" y2="200" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(m,s)=>`<line x1="0" y1="${s*20}" x2="680" y2="${s*20}" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}

        <!-- Main outline -->
        <rect x="60" y="30" width="560" height="120" fill="none" stroke="${t.line}" stroke-width="1.5"/>

        <!-- Center label -->
        <text x="340" y="85" text-anchor="middle" font-size="9" fill="${t.accent}" font-family="var(--font-mono)" font-weight="700">${r.toUpperCase()}</text>
        <text x="340" y="100" text-anchor="middle" font-size="6" fill="${t.text}" font-family="var(--font-mono)">${y(e.name)}</text>

        <!-- Internal divisions -->
        <line x1="200" y1="30" x2="200" y2="150" stroke="${t.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="340" y1="30" x2="340" y2="150" stroke="${t.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="480" y1="30" x2="480" y2="150" stroke="${t.line}" stroke-width="0.5" stroke-dasharray="4,2"/>
        <line x1="60" y1="90" x2="620" y2="90" stroke="${t.line}" stroke-width="0.4" stroke-dasharray="4,2"/>

        <!-- Dimension: top -->
        <line x1="60" y1="20" x2="620" y2="20" stroke="${t.dim}" stroke-width="0.5"/>
        <line x1="60" y1="17" x2="60" y2="23" stroke="${t.dim}" stroke-width="0.5"/>
        <line x1="620" y1="17" x2="620" y2="23" stroke="${t.dim}" stroke-width="0.5"/>
        <text x="340" y="17" text-anchor="middle" font-size="5.5" fill="${t.dim}" font-family="var(--font-mono)">${l}</text>

        <!-- Dimension: right -->
        <line x1="630" y1="30" x2="630" y2="150" stroke="${t.dim}" stroke-width="0.5"/>
        <line x1="627" y1="30" x2="633" y2="30" stroke="${t.dim}" stroke-width="0.5"/>
        <line x1="627" y1="150" x2="633" y2="150" stroke="${t.dim}" stroke-width="0.5"/>
        <text x="645" y="93" text-anchor="middle" font-size="5.5" fill="${t.dim}" font-family="var(--font-mono)" transform="rotate(90,645,93)">${c}</text>

        <!-- Scale bar -->
        <line x1="60" y1="175" x2="160" y2="175" stroke="${t.accent}" stroke-width="0.8"/>
        <line x1="60" y1="172" x2="60" y2="178" stroke="${t.accent}" stroke-width="0.8"/>
        <line x1="110" y1="173" x2="110" y2="177" stroke="${t.accent}" stroke-width="0.5"/>
        <line x1="160" y1="172" x2="160" y2="178" stroke="${t.accent}" stroke-width="0.8"/>
        <text x="60" y="186" font-size="5" fill="${t.text}" font-family="var(--font-mono)">0m</text>
        <text x="107" y="186" font-size="5" fill="${t.text}" font-family="var(--font-mono)">5m</text>
        <text x="154" y="186" font-size="5" fill="${t.text}" font-family="var(--font-mono)">10m</text>

        <!-- Title block -->
        <rect x="490" y="165" width="180" height="24" fill="${t.bg}" stroke="${t.line}" stroke-width="0.5"/>
        <text x="500" y="175" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">DWG NO.</text>
        <text x="540" y="175" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">${y(i)}</text>
        <text x="500" y="185" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">SCALE</text>
        <text x="540" y="185" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">1:200</text>
        <text x="610" y="175" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">REV</text>
        <text x="630" y="175" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">01</text>
        <text x="610" y="185" font-size="5" fill="${t.dim}" font-family="var(--font-mono)">DATE</text>
        <text x="630" y="185" font-size="5.5" fill="${t.accent}" font-family="var(--font-mono)">${y(o)}</text>

        <!-- North arrow -->
        <g transform="translate(470,172)">
            <line x1="0" y1="12" x2="0" y2="0" stroke="${t.accent}" stroke-width="0.8"/>
            <polygon points="-3,4 0,0 3,4" fill="${t.accent}"/>
            <text x="0" y="-3" text-anchor="middle" font-size="5" fill="${t.text}" font-family="var(--font-mono)">N</text>
        </g>
    </svg>`}async function he(){if(!p||!p.nation_id)return;const{data:e,error:t}=await _.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(t)console.warn("Failed to load contracts:",t.message),Ae=[];else{const o=Number(p.corp_reputation??0);Ae=(e||[]).filter(n=>o>=(n.min_reputation||0))}const a=[...new Set(Ae.map(o=>o.nation_id).filter(Boolean))].filter(o=>!Xt[o]);if(a.length>0){const{data:o}=await _.from("nations").select("id, name").in("id",a);for(const n of o||[])Xt[n.id]=n.name}if(Ye={},p&&Ae.length>0){const o=Ae.map(d=>d.id),{data:n}=await _.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",p.id).in("contract_id",o);for(const d of n||[])Ye[d.contract_id]=d}Qi()}function Za(){const e=document.getElementById("ap-list"),t=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=W.length+" ACTIVE",W.length===0){e.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,t.style.display="none";return}const i=M?.current_tick||0;let a=0,o=0,n="";for(const d of W){const r=d.issuer_type==="GOVERNMENT",l=r?"gov":"private",c=Array.isArray(d.contract_bids)?d.contract_bids[0]:d.contract_bids,m=c?.bid_price||0,s=c?.estimated_cost||0,f=c?.estimated_quality||0,u=d.budget_ceiling||0,g=d.awarded_at_tick||i,b=d.stalled_ticks||0,v=Math.max(0,i-g),x=Math.max(0,v-b),h=d.timeline_ticks||8,$=Math.max(0,h-x),I=Math.min(100,Math.round(x/h*100)),C=x>h,w=b>0;let k="";if(w)if(d.status==="awarded"&&Array.isArray(d._missingPermits)&&d._missingPermits.length>0)k="Awaiting permits — apply via Permits → Apply: "+d._missingPermits.join(", ");else{const A=d.required_workforce||{},q=d.workers_assigned||{},P=[];if((Number(q.general)||0)<(Number(A.general)||0)&&P.push("General: "+(Number(q.general)||0)+"/"+(Number(A.general)||0)),(Number(q.skilled)||0)<(Number(A.skilled)||0)&&P.push("Skilled: "+(Number(q.skilled)||0)+"/"+(Number(A.skilled)||0)),(Number(q.innovative)||0)<(Number(A.innovative)||0)&&P.push("Innovative: "+(Number(q.innovative)||0)+"/"+(Number(A.innovative)||0)),P.length>0)k="Workers needed — "+P.join(", ");else{const D=d.current_phase||le[Math.min(le.length-1,Math.floor(x/Math.max(1,h)*le.length))];D==="Permits"?k="Awaiting permit approval":D==="Planning"?k="Planning phase — no materials yet":k="Materials needed — allocate from warehouse"}}Yi(d.sector);const S=vi(d.sector);a+=u,o+=m,n+=`<div class="ap-item" onclick="openProjectModal('${d.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${y(d.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${y(d.issuer_name||"—")} · ${S}</div>
                </div>
                <span class="oc-item__type-badge ${l}">${r?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS${w?' <span style="color:var(--orange);font-weight:700;font-size:7px;">⚠ STALLED ('+b+" ticks) — "+y(k)+"</span>":""}</span>
                    <span class="ap-budget__values" style="color:${C?"var(--red)":w?"var(--orange)":"var(--teal)"}">
                        ${x}/${h} ticks ${C?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${I}%;background:${C?"var(--red)":w?"var(--orange)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${re(m)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${re(s)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${f>=70?"var(--green)":f>=40?"var(--teal)":"var(--orange)"}">${f}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${C?"var(--red)":"var(--text-bright)"}">${$} ticks</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">INSURANCE</div>
                    ${d._hasInsurance?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--green);">INSURED</div>':d._insurancePending?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--orange);">PENDING</div>':`<div class="ap-detail-cell__value" style="font-size:8px;cursor:pointer;color:#aa7a5a;font-weight:700;text-decoration:underline;" onclick="event.stopPropagation();requestInsurance('${d.id}',${u})">INSURE</div>`}
                </div>
            </div>
            ${x>=h?`<div style="padding:6px 10px;border-top:1px solid var(--border-0);">
                <button data-deliver-id="${d.id}" onclick="event.stopPropagation();deliverProject('${d.id}','${y(d.name).replace(/'/g,"\\'")}',${m},${s},${f})" style="width:100%;padding:8px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#000;background:var(--green);border:none;cursor:pointer;">DELIVER PROJECT</button>
            </div>`:""}
        </div>`}e.innerHTML=n,t.style.display=W.length>0?"":"none",W.length>0&&(document.getElementById("ap-total-crew").textContent=W.length,document.getElementById("ap-total-budget").textContent=re(a),document.getElementById("ap-total-spent").textContent=re(o))}async function st(){if(!p)return;const{data:e,error:t}=await _.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",p.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",p.id).order("awarded_at_tick",{ascending:!0});if(t?(console.warn("Failed to load active projects:",t.message),W=[]):W=e||[],W.length>0){const a=W.map(l=>l.id),{data:o}=await _.from("finance_loan_requests").select("insured_contract_id, status").eq("request_type","insurance").in("insured_contract_id",a),{data:n}=await _.from("finance_active_loans").select("request_id, finance_loan_requests!inner(insured_contract_id)").in("status",["current"]).eq("finance_loan_requests.request_type","insurance"),d=new Set((n||[]).map(l=>l.finance_loan_requests?.insured_contract_id).filter(Boolean)),r=new Set((o||[]).filter(l=>l.status==="open").map(l=>l.insured_contract_id));for(const l of W)l._hasInsurance=d.has(l.id),l._insurancePending=r.has(l.id)}const i=W.filter(a=>a.status==="awarded"&&(a.stalled_ticks||0)>0);if(i.length>0){const a=await Promise.all(i.map(async o=>{try{return await _.rpc("get_project_permit_requirements",{p_contract_id:o.id,p_faction_id:p.id,p_nation_id:o.nation_id})}catch(n){return{data:null,error:n}}}));for(let o=0;o<i.length;o++){const{data:n,error:d}=a[o]||{};if(d){console.warn("[ActiveProjects] permit-requirements RPC failed for",i[o].id,d.message||d),i[o]._missingPermits=[];continue}const r=Array.isArray(n)?n:[];i[o]._missingPermits=r.filter(l=>!l.has_permit).map(l=>l.permit_name||l.permit_key).filter(Boolean)}}Za()}const Ct=3e4;function It(){let e=0,t=0;for(const i of at)for(const a of di){const o=K[i.key]?.[a];o&&(e+=o.qty,t+=o.value)}return{totalUnits:e,totalValue:t}}function ui(){const e=document.getElementById("wh-list"),{totalUnits:t,totalValue:i}=It();document.getElementById("wh-count").textContent=t.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=O(i);const a=Math.round(t/Ct*100),o=document.getElementById("wh-capacity");o.textContent=a+"%",o.style.color=a>80?"var(--red)":a>50?"var(--orange)":"var(--green)";let n="";for(let d=0;d<at.length;d++){const r=at[d],l=Zt===d,c=K[r.key]?.LOW||{qty:0,value:0},m=K[r.key]?.STD||{qty:0,value:0},s=K[r.key]?.HIGH||{qty:0,value:0},f=c.qty+m.qty+s.qty,u=c.value+m.value+s.value,g=f===0,b=fe(r.key,"LOW",L),v=fe(r.key,"STD",L),x=fe(r.key,"HIGH",L),h=c.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",$=m.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",I=x.available?s.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(n+='<div class="wh-row">',n+=`<div class="wh-row__collapsed${l?" expanded":""}" onclick="toggleWhRow(${d})">
            <span class="wh-row__arrow">${l?"▾":"▸"}</span>
            <span class="wh-row__name${g?" empty":""}">${y(r.name)}</span>
            <div class="wh-row__dots">
                <div class="${h}"></div>
                <div class="${$}"></div>
                <div class="${I}"></div>
            </div>
            <span class="wh-row__qty${g?" empty":""}">${f>0?f.toLocaleString():"—"}</span>
            <span class="wh-row__val${g?" empty":""}">${u>0?O(u):"—"}</span>
        </div>`,l){n+='<div class="wh-expand">',n+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const C=[{key:"LOW",label:"Low",data:c,avail:b,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:m,avail:v,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:s,avail:x,color:"var(--green)",dotClass:"wh-dot--high"}];for(const w of C){const k=!w.avail.available,S=w.data.qty>0,A=S?"$"+Math.round(w.data.value/w.data.qty):"—";n+=`<div class="wh-grade${k?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${w.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${k?"var(--red)":w.color}">${w.label}</span>
                        ${k?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${S?"var(--text-bright)":"var(--text-dim)"}">${S?w.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${w.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${w.data.value>0?O(w.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${A}</span>
                </div>`}for(const w of C)!w.avail.available&&w.avail.failedStat&&(n+=`<div class="wh-lock">
                        <span class="wh-lock__text">${w.label.toUpperCase()} GRADE LOCKED — ${y(w.avail.failedStat)} &lt; ${w.avail.failedMin}</span>
                    </div>`);n+="</div>"}n+="</div>"}e.innerHTML=n}function eo(e){Zt=Zt===e?-1:e,ui()}async function yi(){if(!p)return;const{data:e,error:t}=await _.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",p.id);K={};const i=[];if(t)console.warn("Failed to load warehouse:",t.message);else if(e){for(const a of e){const o=_t(a.material_key);K[o]||(K[o]={}),K[o][a.quality_tier]={qty:a.quantity||0,value:Number(a.total_value)||0},o!==a.material_key&&i.push(a)}if(i.length>0){const a=i.map(o=>({faction_id:p.id,nation_id:p.nation_id,material_key:_t(o.material_key),quality_tier:o.quality_tier,quantity:o.quantity||0,total_value:Number(o.total_value)||0,updated_at:new Date().toISOString()}));await _.from("corp_warehouse").upsert(a,{onConflict:"faction_id,material_key,quality_tier"});for(const o of i)await _.from("corp_warehouse").delete().eq("faction_id",p.id).eq("material_key",o.material_key).eq("quality_tier",o.quality_tier)}}ui()}const to={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function _i(){const t=(Be()?.name||L?.name||p?.nation||"—").toUpperCase(),i=!!(Ge&&L&&Ge.id!==L.id);document.getElementById("pr-nation-badge").textContent=(i?"IMPORT — ":"LOCAL — ")+t;const a=document.getElementById("pr-nation-select");if(a&&a.options.length===0){const l=L?.name||p?.nation||"—";let c=`<option value="">${y(l)} (HQ)</option>`;for(const m of Qe)m.id!==L?.id&&(c+=`<option value="${m.id}">${y(m.name)}</option>`);a.innerHTML=c}a&&(a.value=Ge?.id||"");const o=Number(p?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=O(o);const{totalUnits:n}=It(),d=Math.round(n/Ct*100),r=document.getElementById("pr-wh-capacity");r.textContent=d+"%",r.style.color=d>80?"var(--red)":d>50?"var(--orange)":"var(--green)",Xi(),gi(),qt()}function Xi(){const e=Be(),t=document.getElementById("pr-mat-grid");let i="";for(const a of at){const o=Z===a.key,n=di.every(r=>!fe(a.key,r,e).available),d="pr-mat-btn"+(o?" active":"")+(n?" all-locked":"");i+=`<span class="${d}" onclick="setPrMat('${a.key}')">${y(a.name)}</span>`}t.innerHTML=i}function gi(){const e=Be(),t=document.getElementById("pr-tier-bar");let i='<span class="pr-tier-label">GRADE</span>';for(const a of di){const o=fe(Z,a,e),n=G===a,d=o.available?pi(Z,a,e):null,r=Hi[a],l=!o.available,c="pr-tier-btn"+(n?" active":"")+(l?" locked":"");i+=`<div class="${c}" onclick="${l?"":`setPrTier('${a}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${r};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${n?"var(--text-bright)":"var(--text-dim)"}">${Kt[a]}</span>
            </div>
            ${d!==null?`<div class="pr-tier-btn__price" style="color:${n?"var(--text-bright)":"var(--text-muted)"}">$${d}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}t.innerHTML=i}function qt(){const e=Be(),t=document.getElementById("pr-content"),i=fe(Z,G,e),a=at.find(w=>w.key===Z);if(!a)return;if(!i.available){t.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${y(a.name)} — ${Kt[G]} grade
                    is not produced domestically in ${y(e?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${y(i.failedStat||"unknown")} &lt; ${i.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const o=pi(Z,G,e),n=Fi(Z,G,e),d=o*me,r=n>3e3?"LOW":n>1e3?"MODERATE":"HIGH",l=r==="LOW"?"var(--green)":r==="MODERATE"?"var(--amber)":"var(--red)",c=Number(e?.inflation??50),m=c>55?"up":c<45?"down":"flat",s=m==="up"?"&#9650;":m==="down"?"&#9660;":"&#8212;",f=m==="up"?"var(--red)":m==="down"?"var(--green)":"var(--text-dim)";let u="";u+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${o}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${f}">${s}</span>
                </div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">SUPPLY/TICK</div>
                <div class="pr-market-cell__value" style="font-size:14px;color:var(--text-bright);margin-top:2px;">${n.toLocaleString()}</div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">DEMAND</div>
                <div class="pr-market-cell__value" style="font-size:12px;color:${l};margin-top:2px;">${r}</div>
            </div>
        </div>
    </div>`,u+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${y(e?.name||"—")})</div>`;for(const w of a.priceDrivers){const k=Number(e?.[w]??50),S=k>=50?"var(--green)":k>=30?"var(--amber)":k>=15?"var(--orange)":"var(--red)",A=to[w]||w;u+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${y(w)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${k}%;background:${S}"></div>
            </div>
            <span class="pr-driver-row__val">${k}</span>
            <span class="pr-driver-row__effect">${y(A)}</span>
        </div>`}u+="</div>";const b=(Number(p?.corp_cash_reserves)||0)>=d,v=me>n,{totalUnits:x}=It(),h=Ct-x,$=me>h,I=h<=0,C=Hi[G];u+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${y(a.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${C};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${C}">${Kt[G]}</span>
                </div>
                <span class="pr-order__mat-price">$${o}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(w=>`<span class="pr-qty-btn${me===w?" active":""}" onclick="setPrQty(${w})">${w>=1e3?w/1e3+"k":w}</span>`).join("")}
                </div>
            </div>
            ${v?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${n.toLocaleString()} this tick</span>
            </div>`:""}
            ${I?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">WAREHOUSE FULL — no remaining capacity</span>
            </div>`:$?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS WAREHOUSE CAPACITY — ${h.toLocaleString()} units remaining</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${O(d)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${b&&!v&&!$&&!I?"":"disabled"}
                    title="${b?v?"Exceeds supply":I?"Warehouse full":$?"Exceeds warehouse capacity":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,t.innerHTML=u}function io(e){const t=Be();Z=e,G="STD";for(const i of["STD","HIGH","LOW"])if(fe(e,i,t).available){G=i;break}Xi(),gi(),qt()}function ao(e){G=e,gi(),qt()}function oo(e){me=e,qt()}let Bt=!1;async function no(e){if(!e)Ge=null;else{let a=Qe.find(o=>o.id===e);if(!a)try{const{data:o}=await _.from("nations").select("*").eq("id",e).single();a=o}catch{}Ge=a||null}const t=Be();if(!fe(Z,G,t).available){G="STD";for(const a of["STD","HIGH","LOW"])if(fe(Z,a,t).available){G=a;break}}const i=document.getElementById("pr-nation-select");i&&(i.value=e||""),_i()}async function so(){if(Bt||!p||!L)return;const e=Be(),t=pi(Z,G,e),i=Fi(Z,G,e),a=t*me,o=Number(p.corp_cash_reserves)||0;if(a>o){alert("Insufficient cash reserves.");return}if(me>i){alert("Exceeds available supply this tick.");return}const{totalUnits:n}=It(),d=Ct-n;if(d<=0){alert("Warehouse is full. Cannot purchase more materials.");return}if(me>d){alert(`Warehouse can only hold ${d.toLocaleString()} more units. Reduce quantity.`);return}Bt=!0;const r=document.querySelector(".pr-purchase-btn");r&&(r.disabled=!0,r.textContent="...");try{const l=o-a,{error:c}=await _.from("factions").update({corp_cash_reserves:l}).eq("id",p.id);if(c)throw c;const m=_t(Z),s=K[m]?.[G],f=(s?.qty||0)+me,u=(s?.value||0)+a,{error:g}=await _.from("corp_warehouse").upsert({faction_id:p.id,nation_id:p.nation_id,material_key:m,quality_tier:G,quantity:f,total_value:u,last_purchased_tick:M?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(g){const{error:v}=await _.from("factions").update({corp_cash_reserves:o}).eq("id",p.id);throw v&&console.error("Cash refund failed after warehouse error:",v.message),g}p.corp_cash_reserves=l,K[m]||(K[m]={}),K[m][G]={qty:f,value:u};const b=Math.floor(a/1e6);if(b>=1&&e?.id){const v=b*.01,{data:x,error:h}=await _.from("nations").select("gdp_growth").eq("id",e.id).single();if(!h&&x){const $=Math.min(100,Math.round((Number(x.gdp_growth??50)+v)*100)/100);await _.from("nations").update({gdp_growth:$}).eq("id",e.id),L?.id===e.id&&(L.gdp_growth=$)}}ui(),_i(),r&&(r.textContent="PURCHASED",setTimeout(()=>{r.isConnected&&(r.disabled=!1,r.textContent="PURCHASE")},1500))}catch(l){r&&(r.disabled=!1,r.textContent="PURCHASE"),alert("Purchase failed: "+(l.message||"Unknown error"))}finally{Bt=!1}}function Zi(e){const t=Le||L;if(!t)return[];const i=Et(e);if(!i)return[];const a=ka(e,t),o=[],n=Number(t?.inflation??50),d=Number(t?.fuel_prices??50);Number(t?.manufacturing_output??50);const r=Le&&L&&Le.id!==L.id;let l=null;if(r&&(l=Ea(t,L)),a.newAvailable>0){const c=zi(e,t),m=i.basePrice,s=Math.round(m*((n-50)/200)),f=Math.round(m*((d-50)/300));let u=c;const g=[{label:"Base price",value:O(m)},s!==0?{label:`Inflation (${n})`,mod:(s>=0?"+":"")+O(Math.abs(s))}:null,f!==0?{label:`Fuel transport (${d})`,mod:(f>=0?"+":"")+O(Math.abs(f))}:null].filter(Boolean),b=c-m-s-f;if(b!==0&&!r&&g.push({label:"Demand/scarcity",mod:(b>=0?"+":"")+O(Math.abs(b))}),r&&l){const v=Math.round(c*l.tariff),x=Math.round(c*l.transport);u=c+v+x,g.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+O(v)}),g.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+O(x)})}o.push({seller:r?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:r?l?.deliveryTicks||1:0,condition:100,price:Math.round(u),available:a.newAvailable,delivery:r?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:r?l.deliveryTicks:0,used:!1,priceFactors:g,sourceNationId:t.id})}if(a.usedAvailable>0){const c=a.usedCondition,m=zi(e,t,{used:!0,condition:c});let s=m;const f=[{label:"Base price",value:O(i.basePrice)},{label:`Condition (${c}%)`,mod:"-"+O(Math.max(0,i.basePrice-m))}];if(r&&l){const u=Math.round(m*l.tariff),g=Math.round(m*l.transport);s=m+u+g,f.push({label:`Import tariff (${Math.round(l.tariff*100)}%)`,mod:"+"+O(u)}),f.push({label:`Transport (${l.deliveryTicks} tick${l.deliveryTicks>1?"s":""})`,mod:"+"+O(g)})}o.push({seller:r?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:r?l?.deliveryTicks||1:0,condition:c,price:Math.round(s),available:a.usedAvailable,delivery:r?l.deliveryTicks+" tick"+(l.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:r?l.deliveryTicks:0,used:!0,priceFactors:f,sourceNationId:t.id})}return o}function At(){const e=Number(p?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=O(e);const t=Et(se),i=ot[t?.tier||1],a=document.getElementById("em-tier-badge");a&&(a.textContent=i.tag,a.style.color=i.color),a.style.background=i.color+"0a",a.style.border="1px solid "+i.color+"33";const o=document.getElementById("em-nation-select");if(o&&o.options.length===0){const r=L?.name||p?.nation||"—";let l=`<option value="">${y(r)} (HQ)</option>`;for(const c of Qe)c.id!==L?.id&&(l+=`<option value="${c.id}">${y(c.name)}</option>`);o.innerHTML=l}const n=document.getElementById("em-import-tag"),d=Le&&L&&Le.id!==L.id;n&&(n.style.display=d?"":"none"),ro(),bi()}function ro(){let e="";for(let t=1;t<=3;t++){const i=ot[t],a=Jt(t),o=t===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";e+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${i.color}">${i.tag}</div>
            <div class="${o}">`;for(const n of a){const d=se===n.key,r=Zi(n.key).length>0;e+=`<span class="em-selector__btn${d?" active":""}${r?"":" no-listings"}"
                style="${d?"background:"+i.color+";border-color:"+i.color:""}"
                onclick="setEmType('${n.key}')">${y(n.name)}</span>`}e+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${e}</div>`}function bi(){const e=document.getElementById("em-content");if(Ie=Zi(se),Ie.length===0){e.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}ue>=Ie.length&&(ue=0);let t="";for(let a=0;a<Ie.length;a++){const o=Ie[a],n=ue===a,d=o.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",r=Gi(o.condition);t+=`<div class="em-listing${n?" selected":""}" style="${n?"border-left-color:"+d:""}" onclick="setEmListing(${a})">`,t+=`<div class="em-listing__row1">
            <div style="display:flex;align-items:center;gap:6px">
                <span class="em-listing__seller">${y(o.seller)}</span>
                <span class="em-badge em-badge--${o.sellerType.toLowerCase()}">${o.sellerType}</span>
                ${o.used?'<span class="em-badge em-badge--used">USED</span>':""}
            </div>
        </div>`,t+=`<div class="em-listing__row2">
            <span class="em-listing__nation">${y((o.nation||"").toUpperCase())}</span>
            ${o.distance>0?`<span class="em-listing__distance">${o.distance} nation${o.distance>1?"s":""} away</span>`:""}
            <span class="em-listing__delivery">Delivery: ${y(o.delivery)}</span>
        </div>`,t+=`<div class="em-listing__stats">
            <div class="em-stat-cell" style="flex:1">
                <div class="em-stat-cell__label">COND.</div>
                <div class="em-stat-cell__bar">
                    <div class="em-stat-cell__bar-track"><div class="em-stat-cell__bar-fill" style="width:${o.condition}%;background:${r}"></div></div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${r}">${o.condition}%</span>
                </div>
            </div>
            <div class="em-stat-cell" style="flex:0.8;text-align:center">
                <div class="em-stat-cell__label">AVAIL.</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${o.available}</div>
            </div>
            <div class="em-stat-cell" style="flex:1.2">
                <div class="em-stat-cell__label">PRICE/UNIT</div>
                <div class="em-stat-cell__value" style="font-size:11px;color:var(--text-bright);margin-top:2px">${O(o.price)}</div>
            </div>
        </div>`,n&&o.priceFactors&&(t+=`<div class="em-breakdown">
                <div class="em-breakdown__title">Price Breakdown</div>
                ${o.priceFactors.map(l=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${y(l.label)}</span>
                    <span class="em-breakdown__mod" style="color:${l.mod?l.mod.startsWith("-")?"var(--green)":l.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${l.mod||l.value}</span>
                </div>`).join("")}
            </div>`),t+="</div>"}const i=Ie[ue];if(i){const a=Et(se),o=ot[a?.tier||1],n=Math.min(i.available,4),d=i.price*ge,r=(Number(p?.corp_cash_reserves)||0)>=d;t+=`<div class="em-purchase"><div class="em-purchase__box">
            <div class="em-purchase__header">
                <div>
                    <span class="em-purchase__name">${y(a?.name||"")}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-left:6px">from ${y(i.seller)}</span>
                </div>
                <span class="em-purchase__price">${O(i.price)}/unit</span>
            </div>
            <div class="em-purchase__qty">
                <span class="em-purchase__qty-label">QTY</span>
                <div class="em-purchase__qty-btns">
                    ${Array.from({length:n},(l,c)=>c+1).map(l=>`<span class="em-qty-btn${ge===l?" active":""}" style="${ge===l?"background:"+o.color+";border-color:"+o.color:""}" onclick="setEmQty(${l})">${l}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${i.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${O(d)}</div>
                    ${i.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${y(i.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${o.color}" onclick="purchaseEquipment()"
                    ${r?"":"disabled"}
                    title="${r?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}e.innerHTML=t}async function lo(e){if(!e)Le=null;else{let i=Qe.find(a=>a.id===e);if(!i)try{const{data:a}=await _.from("nations").select("*").eq("id",e).single();i=a}catch{}Le=i||null}ue=0,ge=1;const t=document.getElementById("em-nation-select");t&&(t.value=e||""),At()}function co(e){se=e,ue=0,ge=1,At()}function po(e){ue=e,ge=1,bi()}function mo(e){ge=e,bi()}let Dt=!1;async function fo(){if(Dt)return;const e=Ie[ue];if(!e||!p)return;const t=Et(se);if(!t)return;const i=ge,a=e.price*i,o=Number(p.corp_cash_reserves)||0;if(a>o){alert("Insufficient cash reserves.");return}if(i>e.available){alert("Not enough units available.");return}const n=document.querySelector(".em-purchase-btn");n&&(n.disabled=!0,n.textContent="..."),Dt=!0;try{const d=o-a,{error:r}=await _.from("factions").update({corp_cash_reserves:d}).eq("id",p.id);if(r)throw r;const l=!e.deliveryTicks||e.deliveryTicks===0;if(l){const m=te.find($=>$.equipment_key===se),s=(m?.owned||0)+i,f=m?.purchase_price_avg||0,u=m?.owned||0,g=u>0?Math.round((f*u+e.price*i)/s):e.price,b=t.maintenancePerUnit*s,v=m?.condition||100,x=Math.round((v*u+e.condition*i)/s),{error:h}=await _.from("corp_equipment").upsert({faction_id:p.id,nation_id:p.nation_id,equipment_key:se,tier:t.tier,owned:s,deployed:m?.deployed||0,condition:x,maintenance_per_tick:b,purchase_price_avg:g,last_purchased_tick:M?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if(h){const{error:$}=await _.from("factions").update({corp_cash_reserves:o}).eq("id",p.id);throw $&&console.error("Cash refund failed:",$.message),h}m?(m.owned=s,m.condition=x,m.maintenance_per_tick=b):te.push({equipment_key:se,tier:t.tier,owned:s,deployed:0,condition:x,maintenance_per_tick:b,assigned_projects:[]})}else{const m=(M?.current_tick||0)+e.deliveryTicks,{error:s}=await _.from("corp_equipment_deliveries").insert({faction_id:p.id,equipment_key:se,quantity:i,condition:e.condition,delivery_tick:m,source_nation_id:e.sourceNationId||null,seller_name:e.seller,price_paid:a});if(s){const{error:f}=await _.from("factions").update({corp_cash_reserves:o}).eq("id",p.id);throw f&&console.error("Cash refund failed:",f.message),s}}p.corp_cash_reserves=d,Ti(),At();const c=document.getElementById("pr-cash");c&&(c.textContent=O(d)),n&&(n.textContent=l?"PURCHASED":"ORDERED",setTimeout(()=>{n.isConnected&&(n.disabled=!1,n.textContent="PURCHASE")},1500))}catch(d){n&&(n.disabled=!1,n.textContent="PURCHASE"),alert("Purchase failed: "+(d.message||"Unknown error"))}finally{Dt=!1}}let vt="active",rt=-1,Fe=[],Ze=[],ht=[];function vo(e){vt=e,rt=-1,document.querySelectorAll(".pm-tab").forEach(t=>t.classList.toggle("active",t.dataset.pmTab===e)),$t()}window.setPmTab=vo;function uo(e){rt=rt===e?-1:e,$t()}window.togglePmExpand=uo;function Te(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function yo(e,t,i){if(i)return"var(--orange)";const a=e/(t||1)*100;return a>50?"var(--green)":a>25?"var(--amber)":"var(--red)"}function $t(){const e=document.getElementById("pm-list"),t=Fe.length,i=Ze.length,a=ht.length,o=Fe.filter(l=>l.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${t})`,document.getElementById("pm-pending-count").textContent=`(${i})`,document.getElementById("pm-apply-count").textContent=`(${a})`;const n=document.getElementById("pm-badges");let d="";o>0&&(d+=`<span class="pm-badge pm-badge--expiring">${o} EXPIRING</span>`),i>0&&(d+=`<span class="pm-badge pm-badge--pending">${i} PENDING</span>`),n.innerHTML=d;const r=Fe.reduce((l,c)=>l+(c.cost||0),0)+Ze.reduce((l,c)=>l+(c.cost||0),0);if(document.getElementById("pm-total-cost").textContent=Te(r),document.getElementById("pm-footer-active").textContent=t,document.getElementById("pm-footer-pending").textContent=i,vt==="active"){if(t===0){e.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let l="";Fe.forEach((c,m)=>{const s=rt===m,f=yo(c.ticks_left,c.total_ticks,c.expiring_soon),u=Math.min(c.ticks_left/(c.total_ticks||1)*100,100);l+=`<div class="pm-item ${c.expiring_soon?"pm-item--expiring":""} ${s?"expanded":""}" onclick="togglePmExpand(${m})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${y(c.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${y((c.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${f}">Expires: ${y(c.expires||"")}</span>
                        <span class="pm-item__ticks">(${c.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${u}%;background:${f}"></div></div>`,s&&(l+=`<div class="pm-detail">
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
                        <span class="pm-detail__val">${Te(c.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${c.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${c.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(c.projects||[]).map(g=>`<span class="pm-project-chip">${y(g)}</span>`).join("")}</div>
                    </div>`,c.note&&(l+=`<div class="pm-note"><span class="pm-note__text">${y(c.note)}</span></div>`),c.expiring_soon&&c.renewable&&(l+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew" onclick="event.stopPropagation(); pmApplyForPermit('${c.permit_key}');">RENEW — ${Te(c.cost||0)}</button></div>`),l+="</div>"),l+="</div></div>"}),e.innerHTML=l;return}if(vt==="pending"){if(i===0){e.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No pending permits.<br>Apply for permits in the Apply tab<br>to begin the approval process.</div>
            </div>`;return}let l="";Ze.forEach((c,m)=>{const s=c.processing_total-c.ticks_remaining,f=Math.min(s/(c.processing_total||1)*100,100),u=c.status==="PROCESSING"?"pm-item__status--processing":"pm-item__status--review";l+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
                <div class="pm-item__row1">
                    <span class="pm-item__name">${y(c.name)}</span>
                    <span class="pm-item__status ${u}">${y(c.status||"PROCESSING")}</span>
                </div>
                <div class="pm-item__row2">
                    <span class="pm-nation-tag">${y((c.nation||"").toUpperCase())}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Applied: ${y(c.applied||"")}</span>
                </div>
                <div class="pm-processing-row">
                    <span class="pm-processing-label">PROCESSING</span>
                    <span class="pm-processing-ticks">${s}/${c.processing_total} ticks</span>
                </div>
                <div class="pm-bar"><div class="pm-bar__fill" style="width:${f}%;background:var(--gold)"></div></div>
                <div class="pm-pending-detail">
                    <div class="pm-pending-detail__cell">
                        <div class="pm-pending-detail__label">EST. APPROVAL</div>
                        <div class="pm-pending-detail__value" style="color:var(--text-bright);">${y(c.est_approval||"")}</div>
                    </div>
                    <div class="pm-pending-detail__cell">
                        <div class="pm-pending-detail__label">COST</div>
                        <div class="pm-pending-detail__value" style="color:var(--red);">${Te(c.cost||0)}</div>
                    </div>
                    <div class="pm-pending-detail__cell">
                        <div class="pm-pending-detail__label">REQUIRED BY</div>
                        <div class="pm-pending-detail__value" style="color:var(--text-secondary);">${y(c.required_by||"")}</div>
                    </div>
                </div>
            </div>`}),e.innerHTML=l;return}if(vt==="available"){if(a===0){e.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No permits available to apply for.<br>Permits appear when government<br>policies require them for<br>construction activities.</div>
            </div>`;return}let l="";ht.forEach((c,m)=>{const s=rt===m;l+=`<div style="border-bottom:1px solid var(--border-0);">
                <div onclick="togglePmExpand(${m})" style="padding:8px 14px;cursor:pointer;${s?"background:rgba(139,154,107,0.03);":""}">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${y(c.name)}</span>
                        <span class="pm-item__arrow">${s?"▾":"▸"}</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${y((c.nation||"").toUpperCase())}</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);">${Te(c.cost||0)}</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);">${c.processing_time} tick${c.processing_time>1?"s":""} processing</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);">${c.duration} tick duration</span>
                    </div>`,s&&(l+=`<div style="margin-top:8px;">
                    <div class="pm-desc">${y(c.description||"")}</div>
                    <div class="pm-detail" style="margin-top:0;margin-bottom:6px;">
                        <div class="pm-detail__row">
                            <span class="pm-detail__key">SOURCE POLICY</span>
                            <span class="pm-detail__val">${y(c.policy||"")}</span>
                        </div>
                        <div class="pm-detail__row">
                            <span class="pm-detail__key">APPLICATION COST</span>
                            <span class="pm-detail__val pm-detail__val--red">${Te(c.cost||0)}</span>
                        </div>
                        <div class="pm-detail__row">
                            <span class="pm-detail__key">PROCESSING TIME</span>
                            <span class="pm-detail__val pm-detail__val--gold">${c.processing_time} tick${c.processing_time>1?"s":""}</span>
                        </div>
                        <div class="pm-detail__row">
                            <span class="pm-detail__key">VALID FOR</span>
                            <span class="pm-detail__val">${c.duration} ticks from approval</span>
                        </div>
                    </div>
                    <div class="pm-btn-row"><button class="pm-btn pm-btn--apply" onclick="event.stopPropagation(); pmApplyForPermit('${c.permit_key}');">APPLY — ${Te(c.cost||0)}</button></div>
                </div>`),l+="</div></div>"}),e.innerHTML=l;return}}let jt=!1;async function _o(e){if(!(jt||!p||!L)){jt=!0;try{const{data:t}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),i=t?.current_tick||0,{data:a,error:o}=await _.rpc("apply_for_permit",{p_faction_id:p.id,p_nation_id:L.id,p_permit_key:e,p_current_tick:i});if(o){alert("Application failed: "+o.message);return}if(a&&!a.success){alert(a.error||"Application failed");return}alert("Permit application submitted! Processing: "+(a.processing_ticks||0)+" ticks."),await ea()}catch(t){alert("Error: "+t.message)}finally{jt=!1}}}window.pmApplyForPermit=_o;async function ea(){if(!p||!L){Fe=[],Ze=[],ht=[],$t();return}const{data:e}=await _.from("construction_permits").select("*"),t=e||[],i={};for(const s of t)i[s.permit_key]=s;const{data:a}=await _.from("corp_permits").select("*").eq("faction_id",p.id).eq("nation_id",L.id),o=a||[],{data:n}=await _.from("active_laws").select("policy_id, policies(permit_key, policy_name)").eq("nation_id",L.id).not("policies.permit_key","is",null),d=new Set,r={};for(const s of n||[])s.policies?.permit_key&&(d.add(s.policies.permit_key),r[s.policies.permit_key]=s.policies.policy_name);const{data:l}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),c=l?.current_tick||0;Fe=o.filter(s=>s.status==="active").map(s=>{const f=i[s.permit_key]||{},u=s.expires_at_tick?Math.max(0,s.expires_at_tick-c):999,g=f.duration_ticks||24;return{name:f.name||s.permit_key,permit_key:s.permit_key,nation:L.name,policy:r[s.permit_key]||"—",issued:s.granted_at_tick!=null?Ne(s.granted_at_tick):"—",expires:s.expires_at_tick?Ne(s.expires_at_tick):"Single-use",cost:s.cost_paid||0,ticks_left:u,total_ticks:g,expiring_soon:u<=3&&u>0,renewable:f.duration_ticks!=null,projects:[]}}),Ze=o.filter(s=>s.status==="pending").map(s=>{const f=i[s.permit_key]||{},u=f.processing_ticks||2,g=c-s.applied_at_tick,b=Math.max(0,u-g);return{name:f.name||s.permit_key,permit_key:s.permit_key,nation:L.name,applied:Ne(s.applied_at_tick),status:"PROCESSING",processing_total:u,ticks_remaining:b,est_approval:Ne(s.applied_at_tick+u),cost:s.cost_paid||0,required_by:r[s.permit_key]||"—"}});const m=new Set(o.filter(s=>s.status==="active"||s.status==="pending").map(s=>s.permit_key));ht=[...d].filter(s=>!m.has(s)).map(s=>{const f=i[s]||{};return{name:f.name||s,permit_key:s,nation:L.name,description:f.description||"",policy:r[s]||"—",cost:f.cost_is_percentage?15e4:f.cost||0,processing_time:f.processing_ticks||2,duration:f.duration_ticks?f.duration_ticks+" ticks":"Single-use",category:f.category||"",difficulty:f.difficulty||"EASY"}}),$t()}let Se=[],ni=-1;function go(e){ni=ni===e?-1:e,si()}function ve(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function ji(e){return e>=85?"var(--gold)":e>=60?"var(--green)":e>=40?"var(--orange)":"var(--red)"}function bo(e){return"dl-result--"+e.toLowerCase()}function si(){const e=document.getElementById("dl-list"),t=Se.length;document.getElementById("dl-count").textContent=`${t} COMPLETED`;const i=Se.reduce((r,l)=>{const c=l.financials||{};return r+((c.payment||0)+(c.bonus||0)-(c.penalty||0)-(c.total_cost||0))},0),a=document.getElementById("dl-lifetime-profit");a.textContent=(i>=0?"+":"")+ve(i),a.style.color=i>=0?"var(--green)":"var(--red)";const o={};Se.forEach(r=>{o[r.result]=(o[r.result]||0)+1});const n=document.getElementById("dl-footer-results");if(n.innerHTML=Object.entries(o).map(([r,l])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[r]||"var(--text-dim)"}">${y(r)}</div>
            <div class="dl-footer__result-count">${l}</div>
        </div>`).join(""),t===0){e.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let d="";Se.forEach((r,l)=>{const c=ni===l,m=r.financials||{},s=(m.payment||0)+(m.bonus||0)-(m.penalty||0)-(m.total_cost||0),f=s>=0,u=bo(r.result),b={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[r.result]||"var(--text-dim)",v=r.type==="GOVERNMENT";if(d+=`<div class="dl-item ${c?"expanded":""}" onclick="toggleDlExpand(${l})">
            <div class="dl-item__inner" style="border-left:2px solid ${b}">
                <div class="dl-item__row1">
                    <span class="dl-item__name">${y(r.name)}</span>
                    <span class="dl-result-badge ${u}">${y(r.result)}</span>
                </div>
                <div class="dl-item__row2">
                    <span class="dl-item__id">${y(r.id)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">·</span>
                    <span class="dl-item__issuer" style="color:${v?"var(--green)":"var(--gold)"}">${y(r.issuer)}</span>
                    <span class="dl-item__date">${y(r.delivered)}</span>
                </div>
                <div class="dl-summary-bar">
                    <div class="dl-summary-cell" style="flex:1;">
                        <div class="dl-summary-label">QUALITY</div>
                        <div style="display:flex;align-items:center;gap:4px;margin-top:2px;">
                            <span class="dl-summary-value" style="color:${ji(r.quality_score)}">${r.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${r.rep_change>0?"var(--green)":r.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${r.rep_change>0?"+":""}${r.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${f?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${f?"var(--green)":"var(--red)"};margin-top:2px;">${f?"+":""}${ve(s)}</div>
                    </div>
                </div>`,c){const x=r.inspection||{};d+='<div style="margin-top:8px;">',d+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(C=>{const w=x[C]||{score:0,issues:[]},k=ji(w.score),S=Math.min(w.score/100*100,100);d+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${y(C.charAt(0).toUpperCase()+C.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${S}%;background:${k}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${k}">${w.score}</span>
                        </div>
                    </div>
                    ${(w.issues||[]).map(A=>`<div class="dl-inspect-issue">${y(A)}</div>`).join("")}
                </div>`});const h=x.permits||{passed:!0,issues:[]};d+=`<div class="dl-permits-row ${h.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${h.passed?"var(--green)":"var(--red)"}">${h.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${(h.issues||[]).map(C=>`<div class="dl-inspect-issue dl-inspect-issue--red">${y(C)}</div>`).join("")}
            </div>`,d+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',d+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(r.materials_used||[]).forEach(C=>{const w=C.grade==="HIGH"?"var(--green)":C.grade==="STANDARD"?"var(--amber)":"var(--orange)",k=C.impact==="positive"?"▲":C.impact==="negative"?"▼":"–",S=C.impact==="positive"?"var(--green)":C.impact==="negative"?"var(--red)":"var(--text-dim)";d+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${y(C.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${w}"></div>
                    <span class="dl-mat-tag__grade" style="color:${w}">${y(C.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${S}">${k}</span>
                </div>`}),d+="</div>",d+='<div class="dl-section-label">Financial Summary</div>',d+='<div class="dl-fin-panel">',d+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${ve(m.contract_value||0)}</span></div>`,(m.bonus||0)>0&&(d+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${ve(m.bonus)}</span></div>`),(m.penalty||0)>0&&(d+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${ve(m.penalty)}</span></div>`);const $=(m.payment||0)+(m.bonus||0)-(m.penalty||0);d+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${ve($)}</span></div>`,d+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${ve(m.total_cost||0)}</span></div>`,d+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${f?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${f?"var(--green)":"var(--red)"}">${f?"+":""}${ve(s)}</span>
            </div>`,d+="</div>";const I=r.timeline||{};d+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${I.actual||0}/${I.expected||0} ticks</span>`,I.early?d+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(I.expected||0)-(I.actual||0)} TICK${I.expected-I.actual!==1?"S":""} EARLY</span>`:!I.on_time&&I.actual>I.expected&&(d+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(I.actual||0)-(I.expected||0)} TICK${I.actual-I.expected!==1?"S":""} LATE</span>`),d+="</div>",d+="</div>"}d+="</div></div>"}),e.innerHTML=d}let Ve=!1,Ut=!1;function ta(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(1)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+Math.round(e/1e3)+"k":"$"+Math.round(e)}async function xi(){var{data:e,error:t}=await _.from("factions").select("*").eq("id",p.id).single();if(t){console.warn("Faction refresh failed:",t.message);return}e&&(p=e);var i=document.getElementById("topbar-cash");i&&(i.textContent="CASH: "+ta(Number(p.corp_cash_reserves??0)))}const ri={CRITICAL:"#c55",HIGH:"#5c5",MODERATE:"#ca5",LOW:"#6a6660"};let ye=[],hi=[],ia="ready",et=null,_e="ORGANIC",J=-1;const Ui={COASTAL:{color:"#8b9a6b",label:"COASTAL"},INTERNATIONAL:{color:"#5a8aaa",label:"INTL"},GOVERNMENT:{color:"#c8a832",label:"GOV CONTRACT"}};function aa(e){const t=e==="COASTAL"?"ORGANIC":e==="INTERNATIONAL"?"AGREEMENT":e;_e=t,J=-1,document.querySelectorAll(".ar-pill").forEach(i=>{const a=i.getAttribute("data-ar-filter"),o=a==="COASTAL"?"ORGANIC":a==="INTERNATIONAL"?"AGREEMENT":a;i.className="ar-pill"+(o===t?" active-"+(t==="ORGANIC"?"coastal":t==="AGREEMENT"?"intl":t==="GOVERNMENT"?"gov":"all"):"")}),ki()}function $i(){return _e==="GOVERNMENT"?ye.filter(e=>e.scope==="GOVERNMENT"):_e==="AGREEMENT"?ye.filter(e=>e.scope!=="GOVERNMENT"&&!!e.trade_agreement_id):_e==="ORGANIC"?ye.filter(e=>e.scope!=="GOVERNMENT"&&!e.trade_agreement_id):ye}function xo(){const e=String(p?.shipping_route_focus||p?.shipping_focus||p?.corp_strategy||"").toLowerCase();return e.includes("agreement")?"AGREEMENT":e.includes("government")||e.includes("gov")?"GOVERNMENT":"ORGANIC"}async function wi(){if(!p||p.corp_sector!=="Shipping")return;const e=await Ca(_,p.id,p.corp_subsector);ye=e.routes,hi=e.applications,ia=e.state,et=e.error,et&&console.warn("Failed to load available routes:",et.message),aa(xo()),J=-1,ki()}var ho={fuel_energy:[{stat:"industrialization",label:"Industrialization"},{stat:"urbanization",label:"Urbanization"}],minerals:[{stat:"industrialization",label:"Industrialization"},{stat:"manufacturing",label:"Manufacturing"}],grains_staples:[{stat:"population_growth",label:"Population Growth"},{stat:"food_security",label:"Food Security"}],livestock_dairy:[{stat:"standard_of_living",label:"Std of Living"},{stat:"food_security",label:"Food Security"}],cash_crops:[{stat:"trade_balance",label:"Trade Balance"},{stat:"foreign_investment",label:"Foreign Investment"}],manufactured_goods:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],technology:[{stat:"technology",label:"Technology"},{stat:"higher_education",label:"Higher Education"}],fruits_vegetables:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],arms:[{stat:"military_spending",label:"Military Spending"},{stat:"stability",label:"Stability"}]};function $o(e){return ho[e]||[]}function wo(e){var t=Number(e.competition_count||0),i=e.demand_level||"",a=e.scope==="GOVERNMENT";return a?"Fixed payment. No demand risk. Vessel locked for contract duration.":t===0&&i==="CRITICAL"?"Unserved critical corridor. High volume, no competition — claim immediately.":t===0&&i==="HIGH"?"Virgin route with strong demand. First-mover advantage available.":t===0?"No competition on this route. Market share starts at 100%.":i==="CRITICAL"&&t<=2?"Underserved critical route. Demand exceeds current capacity.":i==="LOW"?"Thin route. Revenue may not justify vessel deployment.":t>=3?"Crowded route. Market share will be split "+(t+1)+" ways.":Number(e.tariff_rate||0)>15?"High tariff rate cuts into margins. Watch for trade policy changes.":null}function ki(){const e=$i();document.getElementById("ar-count").textContent=ye.length+" ROUTES";var t={ORGANIC:0,AGREEMENT:0,GOVERNMENT:0};ye.forEach(function(b){b.scope==="GOVERNMENT"?t.GOVERNMENT++:b.trade_agreement_id?t.AGREEMENT++:t.ORGANIC++}),document.getElementById("ar-footer-counts").innerHTML='<div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#8b9a6b"></div><span class="ar-footer__count-label">ORGANIC</span><span class="ar-footer__count-num">'+t.ORGANIC+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#5a8aaa"></div><span class="ar-footer__count-label">AGREEMENT</span><span class="ar-footer__count-num">'+t.AGREEMENT+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#c8a832"></div><span class="ar-footer__count-label">GOV</span><span class="ar-footer__count-num">'+t.GOVERNMENT+"</span></div>";const i=document.getElementById("ar-claim-btn");i.className="ar-claim-btn"+(J>=0?" active":"");const a=document.getElementById("ar-list");if(ia==="error"){a.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+y(et&&et.message||"Shipping routes are temporarily unavailable.")+"</div></div>";return}var o=_e==="ORGANIC"?"organic":_e==="AGREEMENT"?"agreement-backed":_e==="GOVERNMENT"?"government":_e.toLowerCase();if(e.length===0){a.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+(ye.length===0?"No routes available.<br>Routes are generated from bilateral<br>trade each tick. Check back after<br>the next corp tick fires.":"No "+o+" routes available.")+"</div></div>";return}let n="";for(let b=0;b<e.length;b++){const v=e[b],x=J===b,h=Ui[v.scope]||Ui.INTERNATIONAL,$=v.scope==="GOVERNMENT",I=v.demand_level&&ri[v.demand_level]?{color:ri[v.demand_level],label:v.demand_level}:null,C=Number(v.competition_count||0),w=C===0?"#5c5":C<=2?"#ca5":"#c84";n+='<div style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid '+(x?h.color:"transparent")+";background:"+(x?h.color+"08":"transparent")+';" onclick="arSelectRoute('+b+')"><div style="padding:8px 14px;">',n+='<div style="display:flex;align-items:center;gap:0;margin-bottom:4px;"><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+y(v.origin_port||"?")+'</span><div style="flex:1;display:flex;align-items:center;margin:0 8px;"><div style="flex:1;height:1px;background:'+h.color+'44"></div><span style="font-family:var(--font-mono);font-size:7px;color:'+h.color+';padding:0 6px">⚓</span><div style="flex:1;height:1px;background:'+h.color+'44"></div></div><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+y(v.destination_port||"?")+"</span></div>",n+='<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;"><span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+h.color+";background:"+h.color+"12;border:1px solid "+h.color+'25">'+h.label+"</span>",I&&(n+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+I.color+";background:"+I.color+"12;border:1px solid "+I.color+'25">'+I.label+" DEMAND</span>"),$&&v.gov_issuer&&(n+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">'+y(v.gov_issuer)+"</span>"),C===0&&!$&&(n+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15)">NO COMPETITION</span>');var d=hi.find(function(k){return k.route_id===v.id});if(d){var r=d.status==="approved"?"#5c5":"#c8a832",l=d.status==="approved"?"APPROVED":"APPLIED";n+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+r+";background:"+r+"12;border:1px solid "+r+'25">'+l+"</span>"}if(n+='<span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-left:auto">'+(v.transit_ticks||"?")+" tick"+((v.transit_ticks||0)!==1?"s":"")+" · "+y(v.vessel_class||"?")+"</span>",n+="</div>",n+='<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">',$?(n+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(v.gov_contract_duration||v.transit_ticks||"?")+" ticks</div></div>",n+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VESSEL</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+y(v.vessel_class||"?")+"</div></div>",n+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT VALUE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-top:1px">'+O(Number(v.display_contract_value||v.gov_contract_value||v.estimated_revenue||0))+"</div></div>"):(n+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VOLUME</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);margin-top:1px">'+O(Number(v.trade_volume||0))+"</div></div>",n+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">COMP.</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+w+';margin-top:1px">'+C+"</div></div>",n+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">TRANSIT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(v.transit_ticks||"?")+" tick"+((v.transit_ticks||0)!==1?"s":"")+"</div></div>",n+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">EST. REV</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;margin-top:1px">'+O(Number(v.estimated_revenue||0))+"</div></div>"),n+="</div>",x){if(n+='<div style="margin-top:6px;">',$&&v.goods_description&&(n+='<div style="font-size:10px;color:var(--text-muted);line-height:1.5;margin-bottom:6px">'+y(v.goods_description)+"</div>"),v.trade_agreement_name&&(n+='<div style="padding:4px 8px;margin-bottom:5px;background:rgba(90,138,170,0.05);border:1px solid rgba(90,138,170,0.12)"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:var(--font-mono);font-size:7px;color:#5a8aaa;letter-spacing:0.5px">TRADE AGREEMENT</div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:1px">'+y(v.trade_agreement_name)+'</div></div><div style="text-align:right"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">TARIFF</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(Number(v.tariff_rate||0)>10?"#c84":"#5c5")+'">'+Number(v.tariff_rate||0).toFixed(1)+"%</div></div></div></div>"),n+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px">',n+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VESSEL CLASS</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+y(v.vessel_class||"?")+"</span></div>",v.vessel_note&&(n+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">REQUIREMENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+y(v.vessel_note)+"</span></div>"),n+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">PROXIMITY</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+(v.proximity!=null?v.proximity:"?")+" / 100</span></div>",n+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CARGO</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+y(v.goods_name||"Unknown")+"</span></div>",v.goods_description&&!$&&(n+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CONTENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+y(v.goods_description)+"</span></div>"),n+='<div style="display:flex;justify-content:space-between;padding:2px 0"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VOLUME</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+Number(v.volume_physical||0).toLocaleString()+" "+y(v.volume_unit||"tons")+"</span></div>",n+="</div>",L&&!$){var c=$o(v.trade_sector);if(c.length>0){n+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.8px;margin-bottom:3px">DEMAND DRIVERS</div>';for(var m=0;m<c.length;m++){var s=c[m],f=Number(L[s.stat]??50),u=f>=50?"#5c5":f>=30?"#ca5":"#c84";n+='<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);width:100px">'+y(s.label)+'</span><div style="width:40px;height:2px;background:var(--border-0)"><div style="width:'+f+"%;height:100%;background:"+u+'"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-bright)">'+Math.round(f)+"</span></div>"}n+="</div>"}}var g=wo(v);g&&(n+='<div style="padding:4px 8px;background:'+h.color+"08;border:1px solid "+h.color+'15"><div style="font-size:9px;color:var(--text-muted);line-height:1.5">'+y(g)+"</div></div>"),n+="</div>"}n+="</div></div>"}a.innerHTML=n}function ko(e){J=J===e?-1:e,ki()}async function Eo(){if(!(Ve||J<0||!p||!M)){var e=$i(),t=e[J];if(t){var i=hi.find(function(g){return g.route_id===t.id});if(i){alert("You have already applied for this route. Status: "+i.status);return}var a={"Bulk Cargo":"bulk_cargo","Container Freight":"container_freight","Specialized Transport":"specialized_transport"},o=a[p.corp_subsector]||"";if(t.shipping_subsector&&o!==t.shipping_subsector){var n=t.shipping_subsector.replace(/_/g," ").replace(/\b\w/g,function(g){return g.toUpperCase()});alert("Your fleet specializes in "+(p.corp_subsector||"?")+" but this route requires "+n+". You cannot service this route.");return}var d=5e4,{data:r}=await _.from("factions").select("corp_cash_reserves").eq("id",p.id).single(),l=Number(r?.corp_cash_reserves??0);if(l<d){alert("Not enough funds. Application fee: $50k. You have $"+Math.round(l/1e3)+"k.");return}Ve=!0;var c=document.getElementById("ar-claim-btn");c.textContent="APPLYING...";try{var m=l-d,{error:s}=await _.from("factions").update({corp_cash_reserves:m}).eq("id",p.id);if(s){alert("Failed to deduct fee.");return}var{data:f,error:u}=await _.from("shipping_applications").insert({route_id:t.id,faction_id:p.id,proposed_rate:Number(t.estimated_revenue||0),application_fee:d,status:"pending",applied_at_tick:M.current_tick}).select("*").single();if(u){await _.from("factions").update({corp_cash_reserves:l}).eq("id",p.id);const g=u.code==="23505"||/duplicate key|idx_shipping_applications_unique/i.test(u.message||"");alert(g?"You already have a pending or approved application on this route. Withdraw it from Route Applications before applying again.":"Application failed: "+u.message);return}try{await _.from("event_log").insert({nation_id:t.origin_nation_id,event_name:p.faction_name+" applied to service "+(t.origin_port||"?")+" → "+(t.destination_port||"?")+" route",category:"corporate",description_chosen:p.faction_name+" has submitted a shipping application for the "+(t.goods_name||"trade")+" route between "+(t.origin_port||"?")+" and "+(t.destination_port||"?")+". Awaiting government approval.",fired_at_tick:M.current_tick})}catch{}await xi(),J=-1,await wi(),alert("Application submitted! The government will review your application.")}catch(g){alert("Application failed: "+(g.message||"Network error"))}finally{Ve=!1,c.textContent="APPLY TO SERVICE — $50k",c.className="ar-claim-btn"+(J>=0?" active":"")}}}}async function To(){if(!(Ve||J<0||!p||!M)){var e=$i(),t=e[J];if(t){var i=Number(p.shipping_fleet_capacity??0),a=Number(p.shipping_fleet_deployed??0);if(a>=i){alert("No available vessels. Fleet capacity: "+i+", deployed: "+a+".");return}Ve=!0;var o=document.getElementById("ar-claim-btn");o.textContent="CLAIMING...",o.className="ar-claim-btn";try{var{data:n,error:d}=await _.rpc("claim_shipping_route",{p_faction_id:p.id,p_route_id:t.id,p_current_tick:M.current_tick});if(d){alert("Claim failed: "+d.message);return}if(n&&!n.success){alert(n.error||"Claim failed.");return}if(n?.claim_id){var r=(de||[]).find(function(f){return f.status==="in_port"&&!f.active_claim_id&&f.fuel>=10});if(r){var{error:l}=await _.from("corp_vessels").update({status:"in_transit",active_claim_id:n.claim_id,current_port_nation_id:null}).eq("id",r.id);l&&console.warn("Failed to assign vessel to route:",l.message)}else console.warn("Route claimed but no available vessel with fuel >= 10% to assign.")}try{var c=t.origin_nation?.name||t.origin_nation_id||"Unknown",m=t.destination_nation?.name||t.destination_nation_id||"Unknown",s=t.goods_type||t.cargo_type||"goods";await _.from("event_log").insert({nation_id:p.nation_id,event_name:"Shipping Route Signed",category:"corporate",description_chosen:p.faction_name+" has just signed an agreement to ship "+s+" between "+c+" and "+m+".",fired_at_tick:M.current_tick||0})}catch{}await xi(),J=-1,await Promise.all([wi(),Ei(),$e()])}catch(f){alert("Claim failed: "+(f.message||"Network error"))}finally{Ve=!1,o.textContent="CLAIM ROUTE",o.className="ar-claim-btn"+(J>=0?" active":"")}}}}let qe=[],oa="ready",tt=null,wt=-1;async function Ei(){if(!p||p.corp_sector!=="Shipping")return;const e=await Ta(_,p.id);qe=e.claims,oa=e.state,tt=e.error,tt&&console.warn("Failed to load active voyages:",tt.message),na()}function Co(e){wt=wt===e?-1:e,na()}async function Io(e){if(!(Ut||!p||!M)){Ut=!0;try{var{data:t,error:i}=await _.rpc("release_shipping_route",{p_faction_id:p.id,p_claim_id:e,p_current_tick:M.current_tick});if(i){alert("Release failed: "+i.message);return}if(t&&!t.success){alert(t.error||"Release failed.");return}var{error:a}=await _.from("corp_vessels").update({status:"in_port",active_claim_id:null}).eq("active_claim_id",e).eq("faction_id",p.id);a&&console.warn("Failed to free vessel on release:",a.message),wt=-1,await xi(),await Promise.all([wi(),Ei(),$e()])}catch(o){alert("Release failed: "+(o.message||"Network error"))}finally{Ut=!1}}}function na(){const e=M?.current_tick||0,t=Number(p?.shipping_fleet_capacity??0),i=Number(p?.shipping_fleet_deployed??0),a=p?.corp_subsector||"--";document.getElementById("av-count").textContent=qe.length+" ACTIVE";const o=qe.reduce((m,s)=>m+Number(s.total_revenue||0),0),n=qe.reduce((m,s)=>m+(s.transits_completed||0),0),d=n>0?Math.round(o/n):0;document.getElementById("av-summary").innerHTML=`
        <div class="av-summary__cell">
            <div class="av-summary__label">FLEET</div>
            <div class="av-summary__value" style="color:${i>=t?"var(--orange)":"var(--text-bright)"}">
                ${i} <span style="font-size:9px;color:var(--text-dim)">/ ${t}</span>
            </div>
        </div>
        <div class="av-summary__cell">
            <div class="av-summary__label">TRANSITS</div>
            <div class="av-summary__value" style="color:var(--text-bright)">${n}</div>
        </div>
        <div class="av-summary__cell">
            <div class="av-summary__label">AVG REV/TRIP</div>
            <div class="av-summary__value" style="color:var(--green)">${O(d)}</div>
        </div>`,document.getElementById("av-total-revenue").textContent=O(o),document.getElementById("av-total-revenue").style.color=o>0?"var(--green)":"var(--text-dim)",document.getElementById("av-fleet-status").textContent=i+"/"+t,document.getElementById("av-subsector").textContent=a;const r=document.getElementById("av-list");if(oa==="error"){r.innerHTML='<div class="av-empty"><div class="av-empty__text">'+y(tt&&tt.message||"Active voyage data is temporarily unavailable.")+"</div></div>";return}if(qe.length===0){r.innerHTML='<div class="av-empty"><div class="av-empty__text">No active voyages.<br>Claim a shipping route to<br>deploy your fleet.</div></div>';return}let l="";for(let m=0;m<qe.length;m++){const s=qe[m],f=s.shipping_routes||{},u=wt===m,b=(de||[]).find(A=>A.active_claim_id===s.id)?.status,v=b==="in_port"?"loading":b==="in_transit"?"in_transit":b==="anchored"?"stranded":"idle";let x=v.toUpperCase().replace("_"," "),h="av-status--idle",$="";if(v==="loading")h="av-status--loading",x="LOADING";else if(v==="in_transit"){h="av-status--transit";const A=s.transit_started_tick||e,P=(s.transit_arrives_tick||A+(f.transit_ticks||2))-A,D=Math.max(0,Math.min(e-A,P)),Y=P>0?Math.round(D/P*100):0;x="IN TRANSIT ("+D+"/"+P+")",$='<div class="av-transit-bar"><div class="av-transit-bar__fill" style="width:'+Y+'%"></div></div>'}const I=Number(s.revenue_per_transit||0),C=Number(s.market_share_pct||0),w=s.transits_completed||0,k=Number(s.total_revenue||0),S=ri[f.demand_level]||"#6a6660";if(l+='<div class="av-item" onclick="avToggle('+m+')"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;"><div class="av-item__route">'+y(f.origin_port||"?")+" → "+y(f.destination_port||"?")+'</div><span class="av-status '+h+'">'+x+'</span></div><div class="av-item__cargo">'+y(f.goods_name||"Unknown")+" · "+y(f.vessel_class||"?")+"</div>"+$+'<div class="av-item__stats"><div class="av-stat"><div class="av-stat__label">REV/TRIP</div><div class="av-stat__value" style="color:var(--green)">'+O(I)+'</div></div><div class="av-stat"><div class="av-stat__label">SHARE</div><div class="av-stat__value">'+C.toFixed(1)+'%</div></div><div class="av-stat"><div class="av-stat__label">TRANSITS</div><div class="av-stat__value">'+w+'</div></div><div class="av-stat"><div class="av-stat__label">TOTAL REV</div><div class="av-stat__value" style="color:var(--green)">'+O(k)+"</div></div></div>",u){l+='<div class="av-item__detail"><div class="av-detail-row"><span class="av-detail-label">ORIGIN</span><span class="av-detail-value">'+y(f.origin_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">DESTINATION</span><span class="av-detail-value">'+y(f.destination_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE SECTOR</span><span class="av-detail-value">'+y((f.trade_sector||"").replace(/_/g," ").toUpperCase())+'</span></div><div class="av-detail-row"><span class="av-detail-label">SCOPE</span><span class="av-detail-value">'+y(f.scope||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRANSIT TIME</span><span class="av-detail-value">'+(f.transit_ticks||"?")+' ticks</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE VOLUME</span><span class="av-detail-value">'+O(Number(f.trade_volume||0))+'</span></div><div class="av-detail-row"><span class="av-detail-label">TARIFF</span><span class="av-detail-value">'+Number(f.tariff_rate||0).toFixed(1)+'%</span></div><div class="av-detail-row"><span class="av-detail-label">COMPETITION</span><span class="av-detail-value">'+(f.competition_count??0)+' corps</span></div><div class="av-detail-row"><span class="av-detail-label">DEMAND</span><span class="av-detail-value" style="color:'+S+'">'+(f.demand_level||"?")+"</span></div>"+(f.trade_agreement_name?'<div class="av-detail-row"><span class="av-detail-label">AGREEMENT</span><span class="av-detail-value" style="color:var(--teal)">'+y(f.trade_agreement_name)+"</span></div>":"")+'<div class="av-detail-row"><span class="av-detail-label">CLAIMED</span><span class="av-detail-value">Tick '+(s.claimed_at_tick||"?")+"</span></div>";var c=(de||[]).find(function(A){return A.active_claim_id===s.id});!c&&v==="loading"?l+=`<div style="padding:6px 8px;margin-top:4px;background:rgba(200,168,50,0.06);border:1px solid rgba(200,168,50,0.15);text-align:center;"><div style="font-family:var(--font-mono);font-size:9px;color:var(--orange);font-weight:700;margin-bottom:4px;">NO VESSEL ASSIGNED</div><button class="av-action-btn" style="background:var(--teal);color:#fff;border-color:var(--teal);width:100%;" onclick="event.stopPropagation();openAssignVesselModal('`+s.id+"','"+(f.vessel_class||"")+`')">ASSIGN VESSEL</button></div>`:c&&(l+='<div style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:var(--bg-card);border:1px solid var(--border-main);"><div><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">ASSIGNED VESSEL</div><div style="font-size:11px;font-weight:700;color:var(--text-bright);">'+y(c.vessel_name||"Unknown")+'</div></div><div style="display:flex;gap:10px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(c.fuel>50?"#5c5":c.fuel>20?"#ca5":"#c55")+'">'+(c.fuel||0)+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(c.condition>50?"#5c5":c.condition>30?"#ca5":"#c55")+'">'+(c.condition||0)+"%</div></div></div></div>"),l+=`<button class="av-action-btn release" onclick="event.stopPropagation();avRelease('`+s.id+`')">RELEASE ROUTE</button></div>`}l+="</div>"}r.innerHTML=l}function qo(e,t){const i=(de||[]).filter(function(n){return n.status==="in_port"&&!n.active_claim_id&&n.fuel>=15&&n.condition>=20});let a;i.length===0?a='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No available vessels.<br>Ships must be in port with 15%+ fuel and 20%+ condition.</div>':a=i.map(function(n,d){var r=n.fuel>50?"#5c5":n.fuel>20?"#ca5":"#c55",l=n.condition>50?"#5c5":n.condition>30?"#ca5":"#c55";return`<div style="padding:10px 14px;border-bottom:1px solid var(--border-0);cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="assignVesselToRoute('`+e+"','"+n.id+`')"><div><div style="font-size:14px;font-weight:700;color:var(--text-bright);">`+y(n.vessel_name||"Unnamed")+'</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+y(n.vessel_class||"?")+" · "+(n.capacity_dwt||0).toLocaleString()+' DWT</div></div><div style="display:flex;gap:14px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+r+'">'+n.fuel+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+l+'">'+n.condition+'%</div></div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--teal);padding:4px 12px;border:1px solid var(--teal);cursor:pointer;">ASSIGN</div></div></div>'}).join("");var o=document.createElement("div");o.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;",o.onclick=function(n){n.target===o&&o.remove()},o.innerHTML='<div style="width:560px;max-width:95vw;max-height:80vh;background:var(--bg-panel);border:1px solid var(--border-main);display:flex;flex-direction:column;"><div style="padding:12px 16px;border-bottom:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:space-between;align-items:center;"><span style="font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:var(--teal);">ASSIGN VESSEL</span><span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+i.length+' available</span></div><div style="flex:1;overflow-y:auto;">'+a+`</div><div style="padding:10px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);text-align:right;"><button onclick="this.closest('div[style*=fixed]').remove()" style="padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);background:transparent;border:1px solid var(--border-main);cursor:pointer;">CANCEL</button></div></div>`,document.body.appendChild(o)}async function Ao(e,t){try{var{error:i}=await _.from("corp_vessels").update({status:"in_port",active_claim_id:e}).eq("id",t).eq("faction_id",p.id);if(i){alert("Assignment failed: "+i.message);return}var a=document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]');a&&a.remove(),await Promise.all([Ei(),$e()])}catch(o){alert("Assignment failed: "+(o.message||"Network error"))}}window.openAssignVesselModal=qo;window.assignVesselToRoute=Ao;async function sa(){if(!p){Se=[],si();return}const{data:e,error:t}=await _.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",p.id).order("delivered_at_tick",{ascending:!1}).limit(20);t?(console.warn("Failed to load deliveries:",t.message),Se=[]):Se=(e||[]).map(i=>{const a=i.construction_contracts||{};return{id:i.contract_id,name:a.name||"Project",type:a.issuer_type||"GOVERNMENT",issuer:a.issuer_name||"Government",delivered:"Tick "+(i.delivered_at_tick||0),result:i.result,quality_score:i.quality_score,rep_change:i.rep_change,financials:{contract_value:i.contract_value||0,bonus:i.quality_bonus||0,penalty:i.penalties||0,payment:i.payment_received||0,total_cost:i.total_cost||0},inspection:i.inspection||{},materials_used:i.materials_used||[],timeline:{expected:i.timeline_expected||0,actual:i.timeline_actual||0,on_time:i.on_time,early:i.timeline_actual<i.timeline_expected}}}),si()}function Ti(){const e=te.reduce((r,l)=>r+(l.owned||0),0),t=te.reduce((r,l)=>r+(l.deployed||0),0),i=wa(te),a=e-t;document.getElementById("eq-count").textContent=e+" UNITS",document.getElementById("eq-summary").innerHTML=`
        <div class="eq-summary__cell">
            <div class="eq-summary__label">DEPLOYED</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--text-bright)">
                ${t} <span style="font-size:9px;color:var(--text-dim)">/ ${e}</span>
            </div>
        </div>
        <div class="eq-summary__cell">
            <div class="eq-summary__label">AVAILABLE</div>
            <div class="eq-summary__value" style="font-size:14px;color:${a===0?"var(--orange)":"var(--green)"}">
                ${a}
            </div>
        </div>
        <div class="eq-summary__cell">
            <div class="eq-summary__label">MAINT/TICK</div>
            <div class="eq-summary__value" style="font-size:14px;color:var(--red)">
                ${O(i)}
            </div>
        </div>`;const o={};for(const r of te)o[r.equipment_key]=r;let n="";for(let r=1;r<=3;r++){const l=ot[r],c=Jt(r),m=ei===r,s=c.reduce((u,g)=>u+(o[g.key]?.owned||0),0),f=c.reduce((u,g)=>u+(o[g.key]?.deployed||0),0);if(n+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${r})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${m?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${l.color}">${y(l.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${l.color};border:1px solid ${l.color}33;background:${l.color}0a">${l.tag}</span>
            </div>
            ${s>0?`<span class="eq-tier-hdr__count">${f}/${s}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,m)for(const u of c){const g=o[u.key],b=g?.owned||0,v=g?.deployed||0,x=g?.condition||0,h=u.maintenancePerUnit*b,$=b-v,I=b>0&&$===0,C=b>0&&x<65,w=Gi(x),k=g?.assigned_projects||[],S=k.length>0?k.map(A=>A.contract_name||"Project").join(", ").slice(0,30):b>0&&v>0?v+" project"+(v>1?"s":""):"—";n+=`<div class="eq-row${b===0?" unowned":""}">`,n+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${b===0?" dim":""}">${y(u.name)}</span>
                        ${C?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${b>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${I?"var(--orange)":"var(--green)"}">${$}</span>
                                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim)">free</span>
                            </div>
                            <span class="eq-row__ratio">${v}/${b}</span>
                        </div>`:'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim)">—</span>'}
                </div>`,b>0?n+=`<div class="eq-detail">
                        <div class="eq-detail__cell" style="flex:1.2">
                            <div class="eq-detail__label">CONDITION</div>
                            <div class="eq-detail__bar">
                                <div class="eq-detail__bar-track">
                                    <div class="eq-detail__bar-fill" style="width:${x}%;background:${w}"></div>
                                </div>
                                <span class="eq-detail__bar-pct" style="color:${w}">${x}%</span>
                            </div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.8">
                            <div class="eq-detail__label">ASSIGNED</div>
                            <div class="eq-detail__value" style="color:var(--text-muted)">${y(S)}</div>
                        </div>
                        <div class="eq-detail__cell" style="flex:0.7">
                            <div class="eq-detail__label">MAINT</div>
                            <div class="eq-detail__value" style="color:var(--red)">${O(h)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:n+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',n+="</div>"}}document.getElementById("eq-list").innerHTML=n;const d=[1,2,3].map(r=>{const l=ot[r],c=Jt(r).reduce((m,s)=>m+(o[s.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${c>0?l.color+"33":"var(--border-0)"};background:${c>0?l.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${l.color}">${l.tag}</div>
            <div class="eq-footer__tier-count" style="color:${c>0?"var(--text-bright)":"var(--text-dim)"}">${c}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${O(i)}</div>
        </div>
        <div class="eq-footer__tiers">${d}</div>`}function No(e){ei=ei===e?-1:e,Ti()}async function Ci(){if(!p)return;const{data:e,error:t}=await _.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",p.id);t?(console.warn("Failed to load equipment:",t.message),te=[]):te=e||[],Ti()}async function So(){const{data:{user:e}}=await _.auth.getUser();if(!e){window.location.href="login.html";return}const t=new URLSearchParams(location.search).get("faction_id");if(!!t){const{data:s,error:f}=await _.from("factions").select("*").eq("id",t).single();f?console.warn("[Inspector] faction fetch failed:",f.message):s?.faction_type==="corporation"&&(p=s)}if(!p){const{data:s}=await _.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);Ce=(s||[]).filter(u=>u.nation_id);const f=sessionStorage.getItem("active_faction_id");if(p=Ce.find(u=>u.id===f)||Ce.find(u=>u.faction_type==="corporation")||Ce[0],!p){await _.auth.signOut(),window.location.href="login.html";return}if(p.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(p.corp_sector!=="Construction"){const u=Vi[p.corp_sector];if(u){window.location.href=u;return}}}const[a,o]=await Promise.all([p.nation_id?_.from("nations").select("*").eq("id",p.nation_id).single():Promise.resolve({data:null}),_.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);a.error&&console.warn("Nation load failed:",a.error.message),a.data&&(L=a.data),o.error&&console.warn("Shard load failed:",o.error.message),M=o.data;let n=0;if(p?.id){const{data:s}=await _.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",p.id).in("status",["open","bidding"]);if(s)for(const f of s)n+=(f.contract_bids||[]).length}const d=document.getElementById("corp-topbar-container");if(d){const{renderCorpTopBar:s}=await ha(async()=>{const{renderCorpTopBar:u}=await import("./corp-topbar-CQCvri_9.js");return{renderCorpTopBar:u}},__vite__mapDeps([0,1])),f={};n>0&&(f.home={color:"#c8a832",title:n+" pending bid"+(n!==1?"s":"")+" on your projects"}),s(d,{faction:p,shard:M,activeTab:"operations",allUserFactions:Ce,badges:f})}if(M){if(document.getElementById("game-date").textContent=M.current_date||"—",document.getElementById("tick-number").textContent=M.current_tick||"—",M.next_tick_at){const f=(Number(M.tick_interval_hours)||8)*36e5,u=new Date(M.next_tick_at).getTime(),b=u-f+f/2;ti=new Date(b>Date.now()?b:u+f/2),Na()}const s=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");s&&(s.textContent="Next Corp Tick")}const r=document.getElementById("topbar-cash");r&&(r.textContent="CASH: "+ta(Number(p.corp_cash_reserves??0)));const l=document.getElementById("topbar-ap");l&&(l.style.display="none");const c=document.getElementById("nation-pill");c&&(c.textContent=(L?.name||p.nation||"—").toUpperCase());const m=document.getElementById("corp-faction-dropdown");if(m){let s="";for(const f of Ce){const u=f.id===p.id,g=f.faction_type==="corporation"?"CORP":"PARTY",b=f.faction_type==="corporation"?"var(--teal)":"var(--amber)";s+=`<div class="corp-dd-item${u?" active":""}" onclick="switchToFaction('${f.id}', '${f.faction_type}')">
                <span class="corp-dd-type" style="color:${b}">${g}</span>
                <span class="corp-dd-name">${y(f.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${y(f.abbreviation||"—")}]</span>
            </div>`}m.innerHTML=s}try{const{data:s}=await _.from("building_modifiers").select("*");gt={};for(const f of s||[])gt[f.modifier_key]=f}catch{}await Promise.all([he(),st(),yi(),Ci(),ea(),sa(),qa()]);try{const{data:s}=await _.from("nations").select("*").order("name");Qe=s||[]}catch{Qe=[]}_i(),At(),$a(p,L,M);try{await xa(_,{faction:p,nation:L,shard:M},"auto-services-container")}catch(s){console.error("[CorpOps] Auto-services init failed:",s)}document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}async function Mo(){await _.auth.signOut(),window.location.href="login.html"}function Ro(){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.toggle("open")}function Lo(e,t){const i=document.getElementById("corp-faction-dropdown");if(i&&i.classList.remove("open"),sessionStorage.setItem("active_faction_id",e),t==="corporation"){const a=(Ce||[]).find(o=>o.id===e);window.location.href=Vi[a?.corp_sector]||"corp-operations.html"}else window.location.href="dashboard.html"}document.addEventListener("click",e=>{const t=document.getElementById("faction-switcher"),i=document.getElementById("corp-faction-dropdown");i&&t&&!t.contains(e.target)&&i.classList.remove("open")});document.addEventListener("keydown",e=>{e.key==="Escape"&&pt()});window.doLogout=Mo;window.toggleCorpDropdown=Ro;window.switchToFaction=Lo;window.setFilter=Sa;window.arSetFilter=aa;window.arSelectRoute=ko;window.arClaimRoute=To;window.arApplyToService=Eo;window.avToggle=Co;window.avRelease=Io;window.openContractDetail=Ki;window.closeContractDetail=pt;window.toggleWhRow=eo;window.toggleEqTier=No;window.switchEmNation=lo;window.setEmType=co;window.setEmListing=po;window.setEmQty=mo;window.purchaseEquipment=fo;window.switchPrNation=no;window.setPrMat=io;window.setPrTier=ao;window.setPrQty=oo;window.purchaseMaterial=so;let ae=null,be={},Q=120,xe=15,li={},He=[],Me=[],We={};async function zo(){if(!ze)return;if(Ye[ze.id]){alert("You already have a bid on this contract. Retract it first if you want to re-bid.");return}ae=ze,li={};try{const{data:i}=await _.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",p.id);for(const a of i||[])li[_t(a.material_key)]=Number(a.quantity||0)}catch{}He=[];try{const{data:i}=await _.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",ae.id).in("status",["pending","won"]);He=(i||[]).filter(a=>a.faction_id!==p?.id).map(a=>({name:a.factions?.faction_name||"Unknown",ticker:a.factions?.corp_ticker||"???",price:Number(a.bid_price||0),quality:Number(a.estimated_quality||0),status:a.status}))}catch{}Me=[],We={};try{const{data:i,error:a}=await _.rpc("get_project_permit_requirements",{p_contract_id:ae.id,p_faction_id:p.id,p_nation_id:ae.nation_id});if(a)throw a;Me=Array.isArray(i)?i:[];const o=Me.map(n=>n.permit_key).filter(Boolean);if(o.length>0){const{data:n,error:d}=await _.from("construction_permits").select("permit_key, cost, processing_ticks").in("permit_key",o);if(d)throw d;for(const r of n||[])We[r.permit_key]={cost:Number(r.cost||0),ticks:Number(r.processing_ticks||0)}}}catch(i){console.warn("Failed to load project permit requirements",i),Me=[],We={}}be={};const e=ae.required_materials||{};for(const i of Object.keys(e))be[i]="STD";const t=ae.required_workforce||{};Q=Number(t.general||0)+Number(t.skilled||0)||120,xe=15,pt(),Nt()}function Ii(){document.getElementById("bid-assembly-overlay")?.remove(),ae=null,Me=[],We={}}function Po(e,t){be[e]=t,Nt()}function Oo(e){Q=e,Nt()}function Bo(e){xe=e,Nt()}function Nt(){if(document.getElementById("bid-assembly-overlay")?.remove(),!ae)return;const e="'JetBrains Mono', monospace",t={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},i=ae,a=i.issuer_type==="GOVERNMENT",o=L?.name||p?.nation||"—",n=Number(i.budget_ceiling||0),d=Number(i.timeline_ticks||8),r=i.required_materials||{},l=Object.keys(r),c={LOW:.5,STD:1,HIGH:2},m={LOW:t.orange,STD:t.yellow,HIGH:t.greenBright},s={LOW:"Low",STD:"Standard",HIGH:"High"},f={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},u=li||{};let g=0,b="";for(const R of l){const H=Number(r[R]||0),Ni=be[R]||"STD",Si=f[R]||3e5,va=c[Ni],ua=Math.round(Si*va),Mi=H*ua;g+=Mi;const ya=R.replace(/_/g," ").replace(/\b\w/g,ke=>ke.toUpperCase()),Ri=Number(u[R]||0),Rt=Math.max(0,H-Ri),_a=Rt===0?t.greenBright:Rt<H?t.yellow:t.red,ga=Rt===0?"✓ IN STOCK":`${Ri}/${H}`;b+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${t.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${t.text}">${ya}</span>
                <div style="font-family:${e};font-size:7px;color:${_a};margin-top:1px">${ga}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${e};font-size:9px;color:${t.muted}">${H.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(ke=>{const Lt=Ni===ke,Li=m[ke],ba=T(Math.round(Si*c[ke]));return`<span onclick="bidSetGrade('${R}','${ke}')" style="padding:2px 6px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${Lt?"#000":t.dim};background:${Lt?Li:"transparent"};border:1px solid ${Lt?Li:t.border}" title="${ba}/unit">${s[ke]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${e};font-size:10px;color:${t.text}">${T(Mi)}</span></div>
        </div>`}const v=i.required_workforce||{},x=Number(v.general||0)+Number(v.skilled||0)||100,h=Math.max(40,Math.round(x*.5)),$=x*2,I=[h,Math.round(x*.75),x,Math.round(x*1.5),$],C=Math.max(0,Math.min(1,(Q-h)/($-h||1))),w=d,k=Math.round(4.5-C*8),S=Math.max(Math.round(w*.6),w+k),A=k>0?`+${k}mo`:k<0?`${k}mo`:"On schedule",q=k>0?t.red:k<0?t.greenBright:t.yellow,P=15200,D=Q*P*S,Y=(Me||[]).map(R=>{const H=We[R.permit_key]||{};return{permit_key:R.permit_key,name:R.permit_name||R.permit_key,requiredByPolicy:R.required_by_policy||"—",hasPermit:!!R.has_permit,statusLabel:R.status_label||(R.has_permit?"HAS_PERMIT":"NEEDS_TO_GET"),cost:Number(H.cost||0),ticks:Number(H.ticks||0)}}),U=Y.filter(R=>!R.hasPermit).reduce((R,H)=>R+H.cost,0),ie=4e5,z=g+D+U+ie,E=Math.round(z*(xe/100)),j=z+E,B=j>n,F=E,X=B?0:Math.max(0,Math.min(100,Math.round(100-j/n*100+30))),we=X>70?t.greenBright:X>40?t.yellow:X>0?t.orange:t.red,Mt=B?"OVER CEILING":X>70?"STRONG":X>40?"COMPETITIVE":X>20?"WEAK":"UNLIKELY",ne=Object.values(be),pe=ne.length>0?Math.round(ne.reduce((R,H)=>R+(H==="HIGH"?85:H==="STD"?65:45),0)/ne.length):50,mt=pe>=75?t.greenBright:pe>=50?t.yellow:pe>=25?t.orange:t.red,fa=pe>=75?"EXCELLENT":pe>=50?"FAIR":pe>=25?"POOR":"BAD",je=document.createElement("div");je.id="bid-assembly-overlay",je.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",je.addEventListener("click",R=>{R.target===je&&Ii()}),je.innerHTML=`
    <div style="width:740px;max-height:94vh;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <!-- HEADER -->
        <div style="padding:10px 16px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:${e};font-size:8px;font-weight:700;padding:2px 8px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15)">${o.toUpperCase()}</span>
                    <span style="font-size:14px;font-weight:700;color:${t.text}">${i.name}</span>
                    <span style="font-family:${e};font-size:8px;font-weight:700;padding:2px 6px;color:${a?t.accentBright:t.gold};background:${a?"rgba(163,176,126,0.1)":"rgba(200,168,50,0.08)"};border:1px solid ${a?"rgba(163,176,126,0.2)":"rgba(200,168,50,0.2)"}">${a?"GOV":"PRIVATE"}</span>
                </div>
                <span onclick="closeBidAssembly()" style="font-family:${e};font-size:14px;color:${t.dim};cursor:pointer;padding:0 4px">×</span>
            </div>
            <div style="display:flex;align-items:center;gap:8px;margin-top:4px;">
                <span style="font-family:${e};font-size:9px;color:${t.dim}">${i.project_code||"—"}</span>
                <span style="font-family:${e};font-size:9px;color:${t.dim}">·</span>
                <span style="font-size:10px;color:${t.accent}">${i.issuer_name||"—"}</span>
                <span style="font-family:${e};font-size:9px;color:${t.dim}">·</span>
                <span style="font-family:${e};font-size:9px;color:${t.muted}">Ceiling: <span style="color:${t.text};font-weight:700">${T(n)}</span></span>
                <span style="font-family:${e};font-size:9px;color:${t.dim}">·</span>
                <span style="font-family:${e};font-size:9px;color:${t.muted}">Timeline: <span style="color:${t.text};font-weight:700">${d} months</span></span>
            </div>
        </div>

        <!-- CONTENT — two columns -->
        <div style="flex:1;display:flex;overflow:hidden;">

            <!-- LEFT: Cost Assembly -->
            <div style="flex:1;border-right:1px solid ${t.border};overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:${t.card};">
                    <span style="font-family:${e};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${t.accentBright};text-transform:uppercase">Materials</span>
                </div>
                <div style="display:flex;padding:4px 14px;border-bottom:1px solid ${t.border};">
                    <span style="flex:1.2;font-family:${e};font-size:7px;color:${t.dim}">MATERIAL</span>
                    <span style="flex:0.5;font-family:${e};font-size:7px;color:${t.dim};text-align:center">QTY</span>
                    <span style="flex:1.2;font-family:${e};font-size:7px;color:${t.dim};text-align:center">GRADE</span>
                    <span style="flex:0.8;font-family:${e};font-size:7px;color:${t.dim};text-align:right">COST</span>
                </div>
                ${b}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${t.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${e};font-size:9px;color:${t.muted}">MATERIALS TOTAL</span>
                    <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${T(g)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:${t.card};">
                    <span style="font-family:${e};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${t.accentBright};text-transform:uppercase">Labor</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${t.border};">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="font-family:${e};font-size:8px;color:${t.dim};width:60px">WORKERS</span>
                        <div style="display:flex;gap:3px;">
                            ${I.map(R=>`<span onclick="bidSetWorkers(${R})" style="padding:2px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${Q===R?"#000":t.dim};background:${Q===R?t.accent:"transparent"};border:1px solid ${Q===R?t.accent:t.border}">${R}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${e};font-size:8px;color:${t.dim}">${Q} × $${P.toLocaleString()}/tick × ${S} ticks</span>
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${T(D)}</span>
                    </div>
                    <div style="margin-top:6px;padding-top:6px;border-top:1px solid ${t.border};">
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <span style="font-family:${e};font-size:8px;color:${t.dim}">WORKFORCE REQUIRED</span>
                        </div>
                        <div style="display:flex;gap:12px;">
                            <span style="font-family:${e};font-size:7px;color:#8b9a6b">General: ${Math.ceil(Q*.8)}</span>
                            <span style="font-family:${e};font-size:7px;color:#c8a832">Skilled: ${Math.ceil(Q*.15)}</span>
                            <span style="font-family:${e};font-size:7px;color:#c84">Innovative: ${Math.ceil(Q*.05)}</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid ${t.border};">
                        <span style="font-family:${e};font-size:8px;color:${t.dim}">COMPLETION TIMELINE</span>
                        <span style="font-family:${e};font-size:10px;font-weight:700;color:${q}">${S}mo <span style="font-size:8px;opacity:0.7">(${A})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:${t.card};">
                    <span style="font-family:${e};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${t.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${Y.length===0?`<div style="padding:8px 14px;border-bottom:1px solid ${t.border};font-family:${e};font-size:8px;color:${t.dim};">No active permit laws apply to this project.</div>`:""}
                ${Y.map(R=>{const H=R.hasPermit;return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${t.border};">
                        <div style="flex:1;display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${e};font-size:8px;font-weight:700;color:${H?t.greenBright:t.orange}">${H?"✓":"○"}</span>
                            <span style="font-size:10px;color:${H?t.muted:t.text}">${R.name}</span>
                        </div>
                        ${H?`<span style="font-family:${e};font-size:8px;color:${t.greenBright}">${R.statusLabel}</span>`:`<div style="text-align:right">
                                <span style="font-family:${e};font-size:9px;color:${t.redDim}">${T(R.cost)}</span>
                                <span style="font-family:${e};font-size:7px;color:${t.dim};margin-left:4px">${R.ticks}t</span>
                            </div>`}
                    </div><div style="padding:0 14px 4px 28px;border-bottom:1px solid ${t.border};font-family:${e};font-size:7px;color:${t.dim};">Required by: ${y(R.requiredByPolicy)}</div>`}).join("")}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${t.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${e};font-size:9px;color:${t.muted}">PERMIT COSTS</span>
                    <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${T(U)}</span>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${t.border};">
                    <span style="font-family:${e};font-size:9px;color:${t.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${T(ie)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:${t.card};">
                    <span style="font-family:${e};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${t.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v:g},{l:"Labor",v:D},{l:"Permits",v:U},{l:"Overhead",v:ie}].map(R=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${t.border};">
                    <span style="font-size:10px;color:${t.muted}">${R.l}</span>
                    <span style="font-family:${e};font-size:10px;color:${t.redDim}">${T(R.v)}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${t.border};background:rgba(204,85,85,0.03);">
                    <span style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">TOTAL EST. COST</span>
                    <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${T(z)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:${t.card};">
                    <span style="font-family:${e};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${t.gold};text-transform:uppercase">Set Markup</span>
                </div>
                <div style="padding:10px 14px;border-bottom:1px solid ${t.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="font-family:${e};font-size:9px;color:${t.dim}">MARKUP %</span>
                        <span style="font-family:${e};font-size:16px;font-weight:700;color:${t.gold}">${xe}%</span>
                    </div>
                    <input type="range" min="0" max="40" step="1" value="${xe}" oninput="bidSetMarkup(+this.value)" style="width:100%;accent-color:${t.gold};height:6px;" />
                    <div style="display:flex;justify-content:space-between;font-family:${e};font-size:7px;color:${t.dim};margin-top:2px;">
                        <span>0% (at cost)</span><span>40% (maximum)</span>
                    </div>
                </div>

                <div style="padding:10px 14px;border-bottom:1px solid ${t.border};background:${B?"rgba(204,85,85,0.04)":"rgba(200,168,50,0.03)"};">
                    <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:4px">YOUR BID PRICE</div>
                    <div style="font-family:${e};font-size:22px;font-weight:700;color:${B?t.red:t.gold}">${T(j)}</div>
                    ${B?`<div style="font-family:${e};font-size:8px;font-weight:700;color:${t.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${T(n)})</div>`:""}
                </div>

                <div style="padding:8px 14px;border-bottom:1px solid ${t.border};">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${e};font-size:8px;color:${t.dim}">PROJECTED PROFIT</span>
                        <span style="font-family:${e};font-size:14px;font-weight:700;color:${F>0?t.greenBright:t.dim}">+${T(F)}</span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:${t.card};">
                    <span style="font-family:${e};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${t.accentBright};text-transform:uppercase">Bid Assessment</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${t.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${e};font-size:8px;color:${t.dim}">COMPETITIVENESS</span>
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${we}">${Mt}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${t.border}"><div style="width:${X}%;height:100%;background:${we}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${t.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${e};font-size:8px;color:${t.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${e};font-size:11px;font-weight:700;color:${mt}">${pe}</span>
                            <span style="font-family:${e};font-size:8px;color:${t.dim}">/100</span>
                            <span style="font-family:${e};font-size:8px;font-weight:700;color:${mt}">${fa}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${t.border}"><div style="width:${pe}%;height:100%;background:${mt}"></div></div>
                    <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
                    <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${He.length===0?`<div style="font-family:${e};font-size:8px;color:${t.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${He.map(R=>`<span style="padding:2px 6px;font-family:${e};font-size:7px;color:${t.muted};background:${t.card};border:1px solid ${t.border};">${R.name} <span style="color:${t.dim}">Q:${R.quality}</span></span>`).join("")}
                        </div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:3px">${He.length} competing bid${He.length!==1?"s":""}. Bid prices are sealed until resolution.</div>`}
                    <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:3px">Higher reputation bidders may win at higher prices.</div>
                </div>
                <div style="flex:1"></div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;border-top:1px solid ${t.border};background:${t.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${e};font-size:7px;color:${t.dim}">YOUR BID</div><div style="font-family:${e};font-size:14px;font-weight:700;color:${B?t.red:t.gold}">${T(j)}</div></div>
                <div><div style="font-family:${e};font-size:7px;color:${t.dim}">EST. PROFIT</div><div style="font-family:${e};font-size:14px;font-weight:700;color:${t.greenBright}">+${T(F)}</div></div>
                <div><div style="font-family:${e};font-size:7px;color:${t.dim}">QUALITY</div><div style="font-family:${e};font-size:14px;font-weight:700;color:${mt}">${pe}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${e};font-size:10px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">CANCEL</div>
                <div onclick="${B?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${e};font-size:10px;font-weight:700;letter-spacing:1px;color:${B?t.dim:"#000"};background:${B?t.border:t.gold};cursor:${B?"not-allowed":"pointer"};opacity:${B?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(je)}let Ft=!1;async function Do(){if(Ft||!ae)return;const e=ae,t=e.required_materials||{},i=Object.keys(t),a=Number(e.budget_ceiling||0),o=Number(e.timeline_ticks||8),n={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},d={LOW:.5,STD:1,HIGH:2};let r=0;for(const S of i){const A=Number(t[S]||0),q=be[S]||"STD",P=n[S]||3e5;r+=A*Math.round(P*d[q])}const l=15200,c=e.required_workforce||{},m=Number(c.general||0)+Number(c.skilled||0)||100,s=Math.max(40,Math.round(m*.5)),f=m*2,u=Math.max(0,Math.min(1,(Q-s)/(f-s||1))),g=Math.round(4.5-u*8),b=Math.max(Math.round(o*.6),o+g),v=Q*l*b,x=(Me||[]).filter(S=>!S.has_permit).reduce((S,A)=>S+Number(We[A.permit_key]?.cost||0),0),$=r+v+x+4e5,I=Math.round($*(xe/100)),C=$+I;if(C>a){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const w=Object.values(be),k=w.length>0?Math.round(w.reduce((S,A)=>S+(A==="HIGH"?85:A==="STD"?65:45),0)/w.length):50;if(confirm('Submit bid for "'+e.name+`"?

Bid Price: `+T(C)+`
Est. Cost: `+T($)+`
Markup: `+xe+"% ("+T(I)+`)
Quality: `+k+`/100
Workers: `+Q+`

Once submitted, your bid cannot be changed.`)){Ft=!0;try{const{data:S}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),A=S?.current_tick||0,q={};for(const D of i)q[D]=be[D]||"STD";const{error:P}=await _.from("contract_bids").insert({contract_id:e.id,faction_id:p.id,bid_price:C,material_grades:q,labor_count:Q,markup_pct:xe,estimated_cost:$,estimated_quality:k,status:"pending",submitted_at_tick:A});if(P)throw P;e.status==="open"&&await _.from("construction_contracts").update({status:"bidding"}).eq("id",e.id).eq("status","open"),Ii(),alert(`Bid submitted successfully!

Contract: `+e.name+`
Your Bid: `+T(C)+`
Quality: `+k+`/100

Bids will be resolved when the bidding window closes (`+(e.bidding_ends_tick?"tick "+e.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof he=="function"&&await he()}catch(S){alert("Bid submission failed: "+S.message)}finally{Ft=!1}}}window.openBidAssembly=zo;window.closeBidAssembly=Ii;window.bidSetGrade=Po;window.bidSetWorkers=Oo;window.bidSetMarkup=Bo;window.submitBidAssembly=Do;let Ht=!1;async function jo(e){if(Ht)return;const t=1e6,i=Number(p?.corp_cash_reserves??0);if(i<t){alert("Cannot retract — you need at least $1M in cash reserves to cover the retraction penalty.");return}if(confirm(`Retract your bid?

This will cost $1M as a retraction penalty.
This action cannot be undone.`)){Ht=!0;try{const a=i-t,{error:o}=await _.from("factions").update({corp_cash_reserves:a}).eq("id",p.id);if(o)throw o;const{error:n}=await _.from("contract_bids").delete().eq("contract_id",e).eq("faction_id",p.id);if(n)throw n;p.corp_cash_reserves=a,typeof subUpdateTopbarCash=="function"&&subUpdateTopbarCash(a),alert("Bid retracted. $1M penalty applied."),pt(),await he()}catch(a){alert("Failed to retract bid: "+(a.message||"Unknown error"))}finally{Ht=!1}}}window.retractBid=jo;let lt=[],Re=0,ce=null,Gt=!1,Vt=!1,Wt=!1;async function Uo(){if(!ze||Vt)return;Vt=!0,ce=ze,Re=0;const{data:e,error:t}=await _.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",ce.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(Vt=!1,t){alert("Failed to load bids: "+t.message);return}lt=(e||[]).map(i=>({...i,corp:i.factions?.faction_name||"Unknown",abbr:i.factions?.corp_ticker||"???",subsector:i.factions?.corp_subsector||"—"})),pt(),ra()}function St(){document.getElementById("bid-review-overlay")?.remove(),ce=null}function Fo(e){Re=e,ra()}async function Ho(){if(Gt||lt.length===0)return;const e=lt[Re];if(!(!e?.id||!e.faction_id)&&confirm("Accept bid from "+e.corp+`?

Bid Price: `+T(e.bid_price)+`
Quality: `+e.estimated_quality+`/100
Workers: `+e.labor_count+`

This will award the contract. The project begins immediately.`)){Gt=!0;try{const{data:t}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),i=t?.current_tick||0,{error:a}=await _.from("contract_bids").update({status:"won"}).eq("id",e.id);if(a)throw a;const{error:o}=await _.from("contract_bids").update({status:"lost"}).eq("contract_id",ce.id).neq("id",e.id);if(o)throw o;const{error:n}=await _.from("construction_contracts").update({status:"awarded",awarded_to_faction:e.faction_id,awarded_at_tick:i}).eq("id",ce.id);if(n)throw n;St(),alert("Contract awarded to "+e.corp+`!

Bid: `+T(e.bid_price)+`
Project begins immediately.`),typeof he=="function"&&await he()}catch(t){alert("Failed to accept bid: "+(t.message||t))}finally{Gt=!1}}}async function Go(){if(!(!ce||Wt)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){Wt=!0;try{const{error:e}=await _.from("contract_bids").update({status:"lost"}).eq("contract_id",ce.id);if(e)throw e;const{error:t}=await _.from("construction_contracts").update({status:"expired"}).eq("id",ce.id);if(t)throw t;St(),alert("All bids declined. Contract cancelled."),typeof he=="function"&&await he()}catch(e){alert("Failed: "+(e.message||e))}finally{Wt=!1}}}function ra(){if(document.getElementById("bid-review-overlay")?.remove(),!ce||lt.length===0)return;const e="'JetBrains Mono', monospace",t={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},i=ce,a=lt;Re>=a.length&&(Re=0);const o=a[Re],n=Number(i.budget_ceiling||0),d=Number(i.timeline_ticks||36),r=Math.min(...a.map(u=>u.bid_price)),l=Math.max(...a.map(u=>u.estimated_quality||0));let c="";for(let u=0;u<a.length;u++){const g=a[u],b=u===Re,v=g.bid_price===r,x=(g.estimated_quality||0)===l,h=g.bid_price>n;c+=`
        <div onclick="reviewSelectBid(${u})" style="padding:10px 16px;border-bottom:1px solid ${t.border};cursor:pointer;border-left:2px solid ${b?t.accent:"transparent"};background:${b?"rgba(139,154,107,0.03)":"transparent"};">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                <span style="font-family:${e};font-size:10px;font-weight:700;color:${t.gold}">${g.abbr}</span>
                <span style="font-size:12px;font-weight:700;color:${t.text}">${g.corp}</span>
                ${v?`<span style="font-family:${e};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${t.greenBright};background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2)">CHEAPEST</span>`:""}
                ${x?`<span style="font-family:${e};font-size:7px;font-weight:700;padding:0 5px;line-height:13px;color:${t.accent};background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.2)">BEST QUALITY</span>`:""}
            </div>
            <div style="display:flex;gap:0;background:${t.card};border:1px solid ${t.border};">
                <div style="flex:1.2;padding:5px 10px;border-right:1px solid ${t.border}">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">BID PRICE</div>
                    <div style="font-family:${e};font-size:14px;font-weight:700;color:${h?t.red:t.text}">${T(g.bid_price)}</div>
                    ${h?`<div style="font-family:${e};font-size:7px;color:${t.red}">OVER BUDGET</div>`:""}
                </div>
                <div style="flex:0.8;padding:5px 10px;border-right:1px solid ${t.border};text-align:center">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">QUALITY</div>
                    <div style="font-family:${e};font-size:14px;font-weight:700;color:${(g.estimated_quality||0)>=75?t.greenBright:(g.estimated_quality||0)>=55?t.yellow:t.orange}">${g.estimated_quality||0}</div>
                </div>
                <div style="flex:0.8;padding:5px 10px;text-align:center">
                    <div style="font-family:${e};font-size:7px;color:${t.dim}">WORKERS</div>
                    <div style="font-family:${e};font-size:14px;font-weight:700;color:${t.text}">${g.labor_count||0}</div>
                </div>
            </div>
        </div>`}const m=o.bid_price>n,s=n>0?Math.round(o.bid_price/n*100):0,f=document.createElement("div");f.id="bid-review-overlay",f.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",f.addEventListener("click",u=>{u.target===f&&St()}),f.innerHTML=`
    <div style="width:640px;max-height:92vh;background:${t.surface};border:1px solid ${t.border};display:flex;flex-direction:column;overflow:hidden;font-family:'IBM Plex Sans',sans-serif;">
        <div style="padding:10px 16px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:14px;font-weight:700;color:${t.text}">${i.name}</span>
                    <span style="font-family:${e};font-size:8px;font-weight:700;padding:2px 6px;color:${t.gold};background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">YOUR PROJECT</span>
                </div>
                <span onclick="closeBidReview()" style="font-family:${e};font-size:14px;color:${t.dim};cursor:pointer">×</span>
            </div>
            <div style="display:flex;gap:8px;margin-top:4px;font-family:${e};font-size:9px;color:${t.dim};">
                <span>${i.project_code||"—"}</span>
                <span>·</span>
                <span>Budget: <span style="color:${t.text};font-weight:700">${T(n)}</span></span>
                <span>·</span>
                <span>Timeline: <span style="color:${t.text};font-weight:700">${d}mo</span></span>
            </div>
        </div>
        <div style="padding:6px 16px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <span style="font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${t.gold}">${a.length} BID${a.length!==1?"S":""} RECEIVED</span>
            <div style="display:flex;gap:8px;font-family:${e};font-size:8px;color:${t.dim};">
                <span>Cheapest: <span style="color:${t.greenBright}">${T(r)}</span></span>
                <span>Best Quality: <span style="color:${t.accent}">${l}</span></span>
            </div>
        </div>
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${t.border};overflow:auto;">
                ${c}
            </div>
            <div style="width:250px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:8px 14px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.gold}">${o.abbr}</span>
                        <span style="font-size:12px;font-weight:700;color:${t.text}">${o.corp}</span>
                    </div>
                    <div style="font-family:${e};font-size:8px;color:${t.dim};margin-top:2px">${o.subsector}</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:${t.card};flex-shrink:0;">
                    <span style="font-family:${e};font-size:8px;font-weight:700;letter-spacing:1.5px;color:${t.accentBright};text-transform:uppercase">Cost Breakdown</span>
                </div>
                ${[{l:"Materials",v:Number(o.estimated_cost||0)*.45},{l:"Labor",v:Number(o.estimated_cost||0)*.45},{l:"Overhead",v:Number(o.estimated_cost||0)*.1}].map(u=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${t.border};">
                    <span style="font-family:${e};font-size:9px;color:${t.dim};text-transform:uppercase">${u.l}</span>
                    <span style="font-family:${e};font-size:10px;color:${t.muted}">${T(Math.round(u.v))}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${t.border};background:${m?"rgba(204,85,85,0.03)":"rgba(200,168,50,0.03)"};">
                    <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.text}">TOTAL BID</span>
                    <span style="font-family:${e};font-size:14px;font-weight:700;color:${m?t.red:t.gold}">${T(o.bid_price)}</span>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:${e};font-size:8px;color:${t.dim}">vs. YOUR BUDGET</span>
                        <span style="font-family:${e};font-size:9px;font-weight:700;color:${m?t.red:t.greenBright}">${m?"OVER":"WITHIN"} — ${s}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${t.border}"><div style="width:${Math.min(100,s)}%;height:100%;background:${m?t.red:t.accent}"></div></div>
                </div>
                ${[{l:"Quality",v:o.estimated_quality+"/100",c:(o.estimated_quality||0)>=75?t.greenBright:(o.estimated_quality||0)>=55?t.yellow:t.orange},{l:"Markup",v:o.markup_pct+"%",c:t.muted},{l:"Workers",v:o.labor_count+" workers",c:t.text}].map(u=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${t.border};">
                    <span style="font-family:${e};font-size:9px;color:${t.dim};text-transform:uppercase">${u.l}</span>
                    <span style="font-family:${e};font-size:10px;font-weight:700;color:${u.c}">${u.v}</span>
                </div>`).join("")}
                <div style="flex:1"></div>
            </div>
        </div>
        <div style="padding:10px 16px;border-top:1px solid ${t.border};background:${t.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${e};font-size:7px;color:${t.dim}">SELECTED BID</div><div style="font-family:${e};font-size:12px;font-weight:700;color:${t.gold}">${T(o.bid_price)}</div></div>
                <div><div style="font-family:${e};font-size:7px;color:${t.dim}">CORPORATION</div><div style="font-family:${e};font-size:12px;font-weight:700;color:${t.text}">${o.corp}</div></div>
                <div><div style="font-family:${e};font-size:7px;color:${t.dim}">QUALITY</div><div style="font-family:${e};font-size:12px;font-weight:700;color:${(o.estimated_quality||0)>=75?t.greenBright:t.yellow}">${o.estimated_quality}</div></div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="declineAllBids()" style="padding:6px 16px;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">DECLINE ALL</div>
                <div onclick="acceptBid()" style="padding:6px 20px;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${t.accent};cursor:pointer">ACCEPT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(f)}const Ke={Coastal:{color:"#8b9a6b",label:"COASTAL"},Container:{color:"#5a7aaa",label:"CONTAINER"},Bulk:{color:"#c8a832",label:"BULK"},Tanker:{color:"#c86a4a",label:"TANKER"},Reefer:{color:"#6a9a5a",label:"REEFER"},LNG:{color:"#c55",label:"LNG"}},Vo={in_port:{color:"#8b9a6b",label:"IN PORT"},in_transit:{color:"#5a8aaa",label:"IN TRANSIT"},dry_dock:{color:"#c84",label:"DRY DOCK"},anchored:{color:"#ca5",label:"ANCHORED"},for_sale:{color:"#9e9a92",label:"FOR SALE"}};function la(e){return e>=75?"#5c5":e>=50?"#ca5":e>=25?"#c84":"#c55"}function Wo(e){return e>=60?"#5c5":e>=30?"#ca5":e>=15?"#c84":"#c55"}async function $e(){if(!p||p.corp_sector!=="Shipping")return;const{data:e,error:t}=await _.from("corp_vessels").select("*").eq("faction_id",p.id).order("vessel_class");t&&console.warn("Failed to load fleet:",t.message),de=e||[],nt=null,Xe={},bt={};try{const i=de.map(a=>a.id);if(i.length>0){const{data:a}=await _.from("finance_active_loans").select("insured_vessel_id").in("insured_vessel_id",i).in("status",["current"]);for(const n of a||[])n.insured_vessel_id&&(Xe[n.insured_vessel_id]=!0);const{data:o}=await _.from("finance_loan_requests").select("insured_vessel_id").eq("requesting_faction_id",p.id).eq("request_type","insurance").eq("status","open").not("insured_vessel_id","is",null);for(const n of o||[])n.insured_vessel_id&&!Xe[n.insured_vessel_id]&&(bt[n.insured_vessel_id]=!0)}}catch(i){console.warn("Failed to load vessel insurance status:",i.message)}ca()}function Yo(e){nt=nt===e?null:e,ca()}function ca(){const e=document.getElementById("fl-count"),t=document.getElementById("fl-summary"),i=document.getElementById("fl-list"),a=document.getElementById("fl-footer");if(!e||!i)return;const o=de;e.textContent=o.length+" VESSEL"+(o.length!==1?"S":"");const n=o.filter(s=>s.status==="in_transit").length,d=o.filter(s=>s.status==="in_port"||s.status==="anchored").length,r=o.filter(s=>s.status==="dry_dock").length,l=o.reduce((s,f)=>s+(f.base_maintenance||0),0);t.innerHTML=[{label:"TRANSIT",value:n,color:"#5a8aaa"},{label:"IN PORT",value:d,color:"#8b9a6b"},{label:"DRY DOCK",value:r,color:"#c84"},{label:"MAINT/TICK",value:T(l),color:"#a44"}].map((s,f)=>`<div style="flex:1;padding:5px 8px;text-align:center;${f<3?"border-right:1px solid var(--border-0);":""}">
        <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">${s.label}</div>
        <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${s.color};margin-top:1px;">${s.value}</div>
    </div>`).join(""),o.length===0?i.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels in fleet.<br>Purchase ships to begin operations.</div>':i.innerHTML=o.map((s,f)=>{const u=nt===f,g=Ke[s.vessel_class]||{color:"#666",label:"?"},b=Vo[s.status]||{color:"#666",label:"?"},v=la(s.condition),x=Wo(s.fuel),h=s.condition<50||s.fuel<20,$=s.status==="in_transit",I=s.status==="dry_dock",C=M?.current_tick||0,w=Math.max(0,Math.floor((C-(s.built_at_tick||0))/12));let k=`<div onclick="flSelectVessel(${f})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${h?s.condition<50?v:x:"transparent"};background:${u?g.color+"06":"transparent"};">
                <div style="padding:7px 14px;">`;k+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${y(s.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${g.color};background:${g.color}12;border:1px solid ${g.color}25;">${g.label}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${b.color};background:${b.color}12;border:1px solid ${b.color}25;">${b.label}</span>
            </div>`;const S=s.current_port_nation_id?"In port":$?"At sea":"—";if(k+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:5px;">${y(S)}</div>`,k+=`<div style="display:flex;gap:8px;margin-bottom:4px;">
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${v};">${s.condition}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${s.condition}%;height:100%;background:${v};"></div></div>
                </div>
                <div style="flex:1;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                        <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">FUEL</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${x};">${s.fuel}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${s.fuel}%;height:100%;background:${x};"></div></div>
                </div>
            </div>`,k+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);margin-top:1px;">${(s.capacity_dwt||0).toLocaleString()} ${s.capacity_unit||"DWT"}</div>
                </div>
                <div style="flex:0.7;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">AGE</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${w}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#a44;margin-top:1px;">${T(s.base_maintenance)}</div>
                </div>
            </div>`,I&&s.drydock_until_tick){const A=Math.max(0,s.drydock_until_tick-C);k+=`<div style="margin-top:4px;padding:3px 8px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">DRY DOCK REPAIRS</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c84;">${A} tick${A!==1?"s":""} remaining</span>
                </div>`}if(u){k+=`<div style="margin-top:6px;">
                    <div style="padding:5px 8px;background:var(--bg-0);border:1px solid var(--border-0);margin-bottom:6px;">`;const A=[{label:"VESSEL CLASS",value:s.vessel_class},{label:"BUILT",value:"Tick "+(s.built_at_tick||0)},{label:"FUEL CAPACITY",value:(s.fuel_capacity||0).toLocaleString()+" tons"},{label:"LAST REFURBISH",value:s.last_refurbish_tick?"Tick "+s.last_refurbish_tick:"N/A"}];for(let U=0;U<A.length;U++)k+=`<div style="display:flex;justify-content:space-between;padding:2px 0;${U<3?"border-bottom:1px solid var(--border-0);":""}">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${A[U].label}</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);">${A[U].value}</span>
                    </div>`;k+="</div>";const q=$||I,P=Math.round((s.purchase_price||3e6)*.08*(1+(100-s.condition)/100)),D=Math.round((s.fuel_capacity||1e3)*50*(1-s.fuel/100)),Y=Math.round((s.purchase_price||3e6)*(s.condition/100)*.6);if(k+=`<div style="display:flex;gap:4px;">
                    <div onclick="${q?"":"flRefurbish('"+s.id+"',"+P+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${q?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${q?"var(--text-dim)":"#5c5"};border:1px solid ${q?"var(--border-0)":"#2a5a3a"};background:${q?"transparent":"rgba(74,170,136,0.06)"};opacity:${q?.35:1};">REFURBISH<br><span style="font-weight:400;font-size:6px;">${T(P)}</span></div>
                    <div onclick="${$?"":"flRefuel('"+s.id+"',"+D+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${$?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${$?"var(--text-dim)":"#c86a4a"};border:1px solid ${$?"var(--border-0)":"rgba(200,106,74,0.3)"};opacity:${$?.35:1};">REFUEL<br><span style="font-weight:400;font-size:6px;">from ${T(D)}</span></div>
                    <div onclick="${q?"":"flSell('"+s.id+"','"+y(s.vessel_name).replace(/'/g,"")+"',"+Y+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${q?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${q?"var(--text-dim)":"#c84"};border:1px solid ${q?"var(--border-0)":"rgba(204,136,68,0.3)"};opacity:${q?.35:1};">LIST<br><span style="font-weight:400;font-size:6px;">${T(Y)}</span></div>
                </div>`,!$){const U=Xe&&Xe[s.id],ie=bt&&bt[s.id];k+='<div style="display:flex;gap:4px;margin-top:4px;">',U?k+=`<div style="flex:1;display:flex;gap:2px;">
                            <div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#5c5;border:1px solid rgba(92,204,92,0.2);background:rgba(92,204,92,0.04);">INSURED ✓</div>
                            <div onclick="event.stopPropagation();flFileClaim('${s.id}','${y(s.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#c55;border:1px solid rgba(204,85,85,0.2);background:rgba(204,85,85,0.04);">FILE CLAIM</div>
                        </div>`:ie&&(k+='<div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#ca5;border:1px solid rgba(202,165,50,0.2);background:rgba(202,165,50,0.04);">PENDING ⏳</div>'),k+=`<div onclick="flRename('${s.id}','${y(s.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:var(--text-muted);border:1px solid var(--border-0);">RENAME</div>`,k+="</div>"}$&&(k+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel at sea — actions available on arrival</div>'),I&&(k+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel in dry dock — repairs in progress</div>'),k+="</div>"}return k+="</div></div>",k}).join("");const c={};for(const s of o)c[s.vessel_class]=(c[s.vessel_class]||0)+1;let m='<div style="display:flex;gap:6px;">';for(const[s,f]of Object.entries(Ke))c[s]&&(m+=`<div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:${f.color};border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">${f.label}</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${c[s]}</span>
        </div>`);m+="</div>",m+=`<span style="font-family:var(--font-mono);font-size:8px;color:#a44;">${T(l)}/tick</span>`,a.innerHTML=m}let ee=!1;async function Qo(e,t){if(ee||!p)return;const i=(de||[]).find(u=>u.id===e);if(!i)return;const a=i.current_port_nation_id||null;let o="state",n=3,d=3,r=null,l="State Dry Dock (3x cost, 3 ticks)";if(a){const{data:u}=await _.from("corp_properties").select("id").eq("faction_id",p.id).eq("nation_id",a).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();if(u)o="own",n=1,d=2,l="Your Dry Dock (base cost, 2 ticks)";else{const{data:g}=await _.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",p.id).eq("nation_id",a).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();g&&(o="other",n=1.2,d=2,r=g.faction_id,l=(g.factions?.faction_name||"Another corp")+"'s Dry Dock (+20%, 2 ticks)")}}else l="State Dry Dock (3x cost, 3 ticks) — no private dock in port";const c=Math.round(t*n),{data:m}=await _.from("factions").select("corp_cash_reserves").eq("id",p.id).single(),s=Number(m?.corp_cash_reserves??0);if(s<c){alert("Insufficient cash. Need "+T(c)+", have "+T(s)+".");return}if(!confirm("Send "+(i.vessel_name||"vessel")+` to dry dock?

Dock: `+l+`
Cost: `+T(c)+`
Duration: `+d+` ticks
Condition restored to 85-100%.`))return;ee=!0;const f=M?.current_tick||0;try{const{error:u}=await _.from("factions").update({corp_cash_reserves:s-c}).eq("id",p.id);if(u){alert("Failed: "+u.message);return}if(o==="other"&&r){const b=c-t,{data:v}=await _.from("factions").select("corp_cash_reserves").eq("id",r).single();v&&await _.from("factions").update({corp_cash_reserves:Number(v.corp_cash_reserves||0)+b}).eq("id",r)}const{error:g}=await _.from("corp_vessels").update({status:"dry_dock",drydock_until_tick:f+d,active_claim_id:null}).eq("id",e);if(g){await _.from("factions").update({corp_cash_reserves:s}).eq("id",p.id),alert("Failed: "+g.message);return}p.corp_cash_reserves=s-c,await $e()}catch(u){alert("Dry dock failed: "+(u.message||"Error"))}finally{ee=!1}}async function Ko(e,t){if(ee||!p)return;if(t<=0){alert("Fuel tanks are already full.");return}const i=(de||[]).find(s=>s.id===e);if(!i)return;const a=i.current_port_nation_id||p.nation_id;let o="state",n=3,d=null,r="State Fuel (3x cost) — no private depot in port";if(a){const{data:s}=await _.from("corp_properties").select("id").eq("faction_id",p.id).eq("nation_id",a).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(s)o="own",n=1,r="Your Fuel Depot (base cost)";else{const{data:f}=await _.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",p.id).eq("nation_id",a).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();f&&(o="other",n=1.15,d=f.faction_id,r=(f.factions?.faction_name||"Another corp")+"'s Fuel Depot (+15%)")}}const l=Math.round(t*n),{data:c}=await _.from("factions").select("corp_cash_reserves").eq("id",p.id).single(),m=Number(c?.corp_cash_reserves??0);if(m<l){alert("Insufficient cash. Need "+T(l)+", have "+T(m)+".");return}if(confirm("Refuel "+(i.vessel_name||"vessel")+`?

Source: `+r+`
Cost: `+T(l)+`
Fuel restored to 100%.`)){ee=!0;try{const{error:s}=await _.from("factions").update({corp_cash_reserves:m-l}).eq("id",p.id);if(s){alert("Failed: "+s.message);return}if(o==="other"&&d){const u=l-t,{data:g}=await _.from("factions").select("corp_cash_reserves").eq("id",d).single();g&&await _.from("factions").update({corp_cash_reserves:Number(g.corp_cash_reserves||0)+u}).eq("id",d)}const{error:f}=await _.from("corp_vessels").update({fuel:100}).eq("id",e);if(f){await _.from("factions").update({corp_cash_reserves:m}).eq("id",p.id),alert("Failed: "+f.message);return}p.corp_cash_reserves=m-l,await $e()}catch(s){alert("Refuel failed: "+(s.message||"Error"))}finally{ee=!1}}}async function Jo(e,t,i){if(ee||!p||!M||!confirm("List "+t+" on the Ship Market for "+T(i)+`?

The vessel will be removed from your fleet and listed for sale. You will receive payment when another corporation purchases it.`))return;ee=!0;const a=M.current_tick||0,o=de.find(l=>l.id===e);if(!o){ee=!1;return}const n=Math.max(0,a-(o.built_at_tick||0)),{error:d}=await _.from("ship_market_listings").insert({nation_id:p.nation_id,vessel_name:o.vessel_name,vessel_class:o.vessel_class,capacity_dwt:o.capacity_dwt,capacity_unit:o.capacity_unit,condition:o.condition,fuel:o.fuel,age_ticks:n,fuel_capacity:o.fuel_capacity,base_maintenance:o.base_maintenance,asking_price:i,purchase_price_new:o.purchase_price||i,seller_type:"CORP",seller_name:p.faction_name,seller_faction_id:p.id,sale_reason:"Listed for sale by "+(p.faction_name||"corporation"),status:"available",listed_at_tick:a});if(d){alert("Failed to create listing: "+d.message),ee=!1;return}const{error:r}=await _.from("corp_vessels").delete().eq("id",e);if(r){await _.from("ship_market_listings").delete().eq("seller_faction_id",p.id).eq("vessel_name",o.vessel_name).eq("listed_at_tick",a),alert("Failed to remove vessel: "+r.message),ee=!1;return}ee=!1,nt=null,await Promise.all([$e(),da()])}async function Xo(e,t){const i=prompt("Rename vessel:",t);if(!i||i.trim()===t||i.trim().length<2)return;const{error:a}=await _.from("corp_vessels").update({vessel_name:i.trim().slice(0,40)}).eq("id",e);if(a){alert("Failed: "+a.message);return}await $e()}let Yt=!1;async function Zo(e,t){if(Yt||!p||!M)return;const i=prompt(`Describe the claim reason:

e.g., "Storm damage during transit — hull breach repaired at sea" or "Engine failure requiring emergency dry dock"`);if(!i||i.trim().length<5)return;const a=M.current_tick||0,{data:o}=await _.from("finance_active_loans").select("id, lender_faction_id, principal, deductible_pct").eq("insured_vessel_id",e).eq("status","current").limit(1).maybeSingle();if(!o){alert("No active insurance policy found for this vessel.");return}const n=Number(o.principal||0),d=Number(o.deductible_pct||10),r=Math.round(n*d/100);if(!confirm("File insurance claim for "+t+`?

Coverage: `+T(n)+`
Deductible: `+d+"% ("+T(r)+`)

Reason: `+i.trim()+`

The insurer will review this claim and determine the payout.`))return;Yt=!0;const{error:l}=await _.from("event_log").insert({nation_id:p.nation_id,faction_id:p.id,event_name:(p.faction_name||"Corporation")+" — Insurance Claim Filed",description_used:(p.faction_name||"A shipping corporation")+" has filed an insurance claim for vessel "+t+". Reason: "+i.trim().replace(/[<>"]/g,""),category:"business",trigger_key:"vessel_insurance_claim",effects_applied:{vessel_id:e,vessel_name:t,policy_id:o.id,insurer_faction_id:o.lender_faction_id,coverage:n,deductible_pct:d,claim_reason:i.trim()},fired_at_tick:a});l&&console.warn("Failed to log insurance claim event:",l.message);const{error:c}=await _.from("finance_active_loans").update({claims_paid:(o.claims_paid||0)+1}).eq("id",o.id);c&&console.warn("Failed to update claims_paid:",c.message),Yt=!1,alert("Insurance claim filed for "+t+`.

The insurer (`+T(n)+" coverage) has been notified. Claim details are visible in the events feed.")}window.flFileClaim=Zo;const ci={fuel_depot:{label:"FUEL DEPOT",color:"#c86a4a",icon:"⛽",desc:"Bunkering facility — refuel at base cost, earn revenue from visiting fleets."},dry_dock:{label:"DRY DOCK",color:"#c84",icon:"🔧",desc:"Repair & maintenance dock — dock at base cost, earn revenue from visiting fleets."}},ut=[{type:"fuel_depot",name:"Fuel Depot — Standard",cost:105e6,maint:85e3,style:"Basic",desc:"Bulk fuel storage and bunkering facility."},{type:"fuel_depot",name:"Fuel Depot — Advanced",cost:14e7,maint:11e4,style:"Modern",desc:"High-capacity fuel terminal with pipeline infrastructure."},{type:"dry_dock",name:"Dry Dock — Standard",cost:85e6,maint:15e4,style:"Basic",desc:"Ship repair and maintenance facility."},{type:"dry_dock",name:"Dry Dock — Advanced",cost:115e6,maint:2e5,style:"Modern",desc:"Full-service shipyard with drydock and crane facilities."}];let kt=[];async function en(){if(!p||p.corp_sector!=="Shipping")return;const{data:e}=await _.from("corp_properties").select("*, nations!nation_id(name)").eq("faction_id",p.id).in("type",["fuel_depot","dry_dock"]).eq("is_active",!0).order("created_at",{ascending:!1});kt=e||[],tn()}function tn(){const e=document.getElementById("pf-count"),t=document.getElementById("pf-list"),i=document.getElementById("pf-footer");if(!e||!t||!i)return;const a=kt;if(e.textContent=a.length+" FACILIT"+(a.length===1?"Y":"IES"),a.length===0)t.innerHTML=`<div style="padding:20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-bottom:6px;">No port facilities built.</div>
            <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Build a <span style="color:#c86a4a;font-weight:700;">Fuel Depot</span> to refuel your fleet at base cost<br>and earn revenue from other corps refueling here.<br>Build a <span style="color:#c84;font-weight:700;">Dry Dock</span> to repair vessels at base cost.</div>
        </div>`;else{let d=0;t.innerHTML=a.map(r=>{const l=ci[r.type]||ci.fuel_depot,c=r.condition>=75?"#5c5":r.condition>=50?"#ca5":"#c84";return d+=Number(r.monthly_maintenance||0),`<div style="padding:8px 12px;border-bottom:1px solid var(--border-0);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${l.icon}</span>
                        <span style="font-size:11px;font-weight:600;color:var(--text-bright);">${y(r.name)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${l.color};background:${l.color}12;border:1px solid ${l.color}25;">${l.label}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:4px;">${y(r.nations?.name||"Unknown Nation")} · ${y(r.city||"Port")} · ${(r.style||"Basic").toUpperCase()}</div>
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
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#a44;">${T(r.monthly_maintenance||0)}</span>
                        </div>
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">VALUE: ${T(r.purchase_price||0)}</div>
                    </div>
                </div>
            </div>`}).join("")}Number(p?.corp_cash_reserves??0);const o=a.some(d=>d.type==="fuel_depot"),n=a.some(d=>d.type==="dry_dock");i.innerHTML=`
        <div onclick="pfOpenBuild('fuel_depot')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c86a4a;border:1px solid rgba(200,106,74,0.3);background:rgba(200,106,74,0.04);">
            ${o?"+ FUEL DEPOT":"BUILD FUEL DEPOT"}
        </div>
        <div onclick="pfOpenBuild('dry_dock')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c84;border:1px solid rgba(204,136,68,0.3);background:rgba(204,136,68,0.04);">
            ${n?"+ DRY DOCK":"BUILD DRY DOCK"}
        </div>`}let Qt=!1;async function an(e){if(Qt||!p||!M)return;const t=ut.filter(v=>v.type===e);if(t.length===0)return;const i=ci[e],a=p.nation_id,o=L?.name||p?.nation||"Home Nation",n=L?.capital||"Port City",d=[{id:a,name:o,capital:n,label:"National HQ"}],{data:r}=await _.from("corp_properties").select("nation_id, name, city, nations!nation_id(name, capital)").eq("faction_id",p.id).eq("type","regional_hq").eq("is_active",!0);for(const v of r||[])v.nation_id!==a&&d.push({id:v.nation_id,name:v.nations?.name||v.city||"Unknown",capital:v.nations?.capital||v.city||"Port City",label:v.name||"Subsidiary"});let l=d[0];if(d.length>1){let v=i.label+` — SELECT LOCATION
`+"─".repeat(30)+`
`;v+=`Build in which nation?

`;for(let $=0;$<d.length;$++){const I=d[$],C=kt.filter(w=>w.type===e&&w.nation_id===I.id).length;v+=$+1+". "+I.name+"  ("+I.label+")",C>0&&(v+="  ["+C+" existing]"),v+=`
`}v+=`
Enter number (or cancel):`;const x=prompt(v);if(!x)return;const h=parseInt(x,10)-1;if(isNaN(h)||h<0||h>=d.length){alert("Invalid selection.");return}l=d[h]}const c=kt.filter(v=>v.type===e&&v.nation_id===l.id).length;let m=i.label+" CONSTRUCTION — "+l.name.toUpperCase()+`
`+"─".repeat(30)+`
`;c>0&&(m+="You already have "+c+" "+i.label.toLowerCase()+(c>1?"s":"")+` here.

`),m+=i.desc+`

`;for(let v=0;v<t.length;v++){const x=t[v];m+=v+1+". "+x.name+`
`,m+="   Cost: "+T(x.cost)+" · Maint: "+T(x.maint)+`/tick
`,m+="   "+x.desc+`

`}m+="Enter 1 or 2 to select (or cancel):";const s=prompt(m);if(!s)return;const f=parseInt(s,10)-1;if(isNaN(f)||f<0||f>=t.length){alert("Invalid selection.");return}const u=t[f];if(!confirm("Commission "+u.name+" in "+l.capital+", "+l.name+`?

Budget: `+T(u.cost)+`

This will create a construction contract that construction corporations can bid on. Payment occurs when the contract is awarded.`))return;Qt=!0;const g=M.current_tick||0,b=(M.current_date||"").match(/\d{4}/)?.[0]||"2015";try{const{count:v}=await _.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",l.id).eq("issuer_type","PRIVATE"),h=`PVT-P${(v||0)+1}-${b}`,$=u.style==="Modern",I={concrete:$?60:40,steel:$?50:30,heavy_parts:$?30:20,aggregate:$?30:20},C={trucks:5,mixers:5,excavators:5},w={general:$?240:160,skilled:$?100:60},k=$?6:4,{error:S}=await _.from("construction_contracts").insert({nation_id:l.id,template_key:e,sector:"industrial",name:u.name,project_type:i.label,project_subtype:u.style,description:`${u.name} at ${l.capital} Port — commissioned by ${p.faction_name}. ${u.desc}`,project_code:h,budget_ceiling:u.cost,timeline_ticks:k,required_materials:I,required_equipment:C,required_workforce:w,status:"open",generated_at_tick:g,bidding_ends_tick:g+3,issuer_type:"PRIVATE",issuer_name:p.faction_name,issuer_faction_id:p.id});if(S)throw S;await en(),alert(`Construction contract posted!

Project: `+u.name+`
Location: `+l.capital+", "+l.name+`
Code: `+h+`
Budget: `+T(u.cost)+`
Timeline: `+k+` ticks

Construction corporations in `+l.name+" can now bid on this project.")}catch(v){alert("Failed to post contract: "+(v.message||"Error"))}finally{Qt=!1}}window.pfOpenBuild=an;const qi={"Bulk Cargo":["Reefer","Bulk","Coastal"],"Container Freight":["Coastal","Container"],"Specialized Transport":["Tanker","LNG","Bulk"]};async function da(){if(!p||p.corp_sector!=="Shipping")return;const{data:e,error:t}=await _.from("ship_market_listings").select("*, nation:nation_id(id, name)").eq("status","available").order("asking_price",{ascending:!0});t&&console.warn("Failed to load ship market:",t.message),fi=e||[],xt=null,pa()}function on(e){xt=xt===e?null:e,pa()}function nn(e){return(qi[p?.corp_subsector]||[]).includes(e)}function pa(){const e=document.getElementById("sm-count"),t=document.getElementById("sm-list"),i=document.getElementById("sm-footer");if(!e||!t)return;const a=fi;e.textContent=a.length+" AVAILABLE",a.length===0?t.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels on the market.<br>Check back next cycle.</div>':t.innerHTML=a.map((d,r)=>{const l=xt===r,c=Ke[d.vessel_class]||{color:"#666",label:"?"},m=d.seller_type==="CORP"?"#5a8aaa":"#8b9a6b",s=la(d.condition),f=d.nation?.name||"—",u=nn(d.vessel_class);M?.current_tick;const g=d.age_ticks||0,b=Math.max(1,Math.floor(g/12)),v=f!==p?.nation?Number(p?.tariffs||L?.tariffs||0):0,x=Math.round(d.asking_price*v/100),h=d.asking_price+x;let $=`<div onclick="smSelectListing(${r})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${l?c.color:"transparent"};background:${l?c.color+"06":"transparent"};">
                <div style="padding:8px 14px;">`;return $+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${y(d.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${c.color};background:${c.color}12;border:1px solid ${c.color}25;">${c.label}</span>
            </div>`,$+=`<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;">
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${m};background:${m}12;border:1px solid ${m}25;">${d.seller_type}</span>
                <span style="font-size:9px;color:var(--text-muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${y(d.seller_name||"—")}</span>
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;">${f.toUpperCase().slice(0,6)}</span>
                ${v>0?`<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">+${v}%</span>`:""}
            </div>`,$+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-0);">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);margin-top:1px;">${(d.capacity_dwt||0).toLocaleString()} ${d.capacity_unit||"DWT"}</div>
                </div>
                <div style="flex:0.6;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">COND</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${s};margin-top:1px;">${d.condition}%</div>
                </div>
                <div style="flex:0.5;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">AGE</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${b}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">PRICE</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--gold);margin-top:1px;">${T(d.asking_price)}</div>
                </div>
            </div>`,l&&($+='<div style="margin-top:6px;">',$+=`<div style="padding:4px 8px;margin-bottom:5px;background:var(--bg-0);border:1px solid var(--border-0);">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0);">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CARRIES</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${c.color};">${(Ke[d.vessel_class]||{}).label||"?"} class cargo</span>
                    </div>
                    <div style="padding:3px 0;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:1px;">REASON FOR SALE</div>
                        <div style="font-size:9px;color:var(--text-muted);line-height:1.4;">${y(d.sale_reason||"—")}</div>
                    </div>
                </div>`,$+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                    <div style="width:40px;height:3px;background:var(--border-0);"><div style="width:${d.condition}%;height:100%;background:${s};"></div></div>
                    ${d.condition<60?'<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">May need dry dock</span>':""}
                </div>`,v>0&&($+=`<div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:8px;margin-bottom:3px;">
                        <span style="color:var(--text-dim);">Import tariff (${v}%)</span>
                        <span style="color:#c84;">+${T(x)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;margin-bottom:5px;">
                        <span style="color:var(--text-bright);">TOTAL</span>
                        <span style="color:var(--gold);">${T(h)}</span>
                    </div>`),u?$+=`<div onclick="event.stopPropagation();smPurchase('${d.id}',${h})" style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${c.color};cursor:pointer;">${T(h)} — PURCHASE</div>`:$+=`<div style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:var(--text-dim);border:1px solid var(--border-0);opacity:0.4;">⊘ ${d.vessel_class} not available for ${p?.corp_subsector||"your subsector"}</div>`,$+="</div>"),$+="</div></div>",$}).join("");const o=a.filter(d=>d.seller_type==="CORP").length,n=a.filter(d=>d.seller_type==="LOCAL").length;i.innerHTML=`<div style="display:flex;gap:6px;">
        <div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:#5a8aaa;border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CORP</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${o}</span>
        </div>
        <div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:#8b9a6b;border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">LOCAL</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${n}</span>
        </div>
    </div>
    <div onclick="smOpenCommission()" style="padding:4px 14px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--gold);border:1px solid rgba(200,168,50,0.3);cursor:pointer;">COMMISSION VESSEL</div>`}let Ue=!1;async function sn(e,t){if(Ue||!p||!M)return;const i=Number(p.corp_cash_reserves??0);if(i<t){alert("Insufficient cash. Need "+T(t)+".");return}if(!confirm("Purchase this vessel for "+T(t)+"?"))return;Ue=!0;const a=fi.find(m=>m.id===e);if(!a){Ue=!1;return}const o=M.current_tick||0,n=yt[a.vessel_class]||yt.Coastal,{error:d}=await _.from("factions").update({corp_cash_reserves:i-t}).eq("id",p.id);if(d){alert("Failed: "+d.message),Ue=!1;return}const{error:r}=await _.from("corp_vessels").insert({faction_id:p.id,nation_id:p.nation_id,vessel_name:a.vessel_name,vessel_class:a.vessel_class,condition:a.condition,fuel:a.fuel||50,status:"in_port",capacity_dwt:a.capacity_dwt||n.capacity_dwt,capacity_unit:a.capacity_unit||n.capacity_unit,base_maintenance:a.base_maintenance||n.base_maintenance,fuel_capacity:a.fuel_capacity||n.fuel_capacity,purchase_price:t,built_at_tick:o-(a.age_ticks||0),current_port_nation_id:p.nation_id});if(r){await _.from("factions").update({corp_cash_reserves:i}).eq("id",p.id),alert("Failed to create vessel: "+r.message),Ue=!1;return}var{error:l}=await _.from("ship_market_listings").update({status:"sold",purchased_by:p.id,purchased_at_tick:o}).eq("id",e);if(l&&console.warn("Failed to mark listing as sold:",l.message),a.seller_faction_id){const{data:m}=await _.from("factions").select("corp_cash_reserves").eq("id",a.seller_faction_id).single();if(m){var{error:c}=await _.from("factions").update({corp_cash_reserves:Number(m.corp_cash_reserves||0)+a.asking_price}).eq("id",a.seller_faction_id);c&&console.warn("Failed to credit seller:",c.message)}}p.corp_cash_reserves=i-t,Ue=!1,await Promise.all([$e(),da()])}const it=[{cls:"Coastal",baseCost:12e6,baseBuild:3,cargo:"Bulk, Containers (coastal)"},{cls:"Container",baseCost:65e6,baseBuild:5,cargo:"Manufactured, Tech, General"},{cls:"Bulk",baseCost:38e6,baseBuild:4,cargo:"Minerals, Aggregate, Military"},{cls:"Tanker",baseCost:52e6,baseBuild:5,cargo:"Fuel, Petroleum, Chemicals"},{cls:"Reefer",baseCost:45e6,baseBuild:4,cargo:"Food, Perishables, Agriculture"},{cls:"LNG",baseCost:78e6,baseBuild:6,cargo:"Liquefied Natural Gas only"}];let oe="Coastal",ct=0,dt="",Pe=[];function rn(){oe=(qi[p?.corp_subsector]||["Coastal"])[0],ct=0,dt="",Pe=[],document.getElementById("comm-overlay").style.display="flex",ln()}async function ln(){const{data:e}=await _.from("nations").select("id, name, manufacturing_output, physical_infrastructure, tariffs").order("name");Pe=(e||[]).map(t=>{const i=Number(t.manufacturing_output??50),a=Math.round((.75+i/100*.5)*100)/100,o=Math.round((1.5-i/100*.65)*100)/100,n=t.id===p?.nation_id;return{id:t.id,name:t.name,mfg:i,costMod:a,buildMod:o,isHome:n,tariffs:Number(t.tariffs??0)}}),Pe.sort((t,i)=>(i.isHome?1:0)-(t.isHome?1:0)),Ai()}function ma(){document.getElementById("comm-overlay").style.display="none"}function cn(e){oe=e,Ai()}function dn(e){ct=e,Ai()}function pn(e){dt=e}function Ai(){const e=document.getElementById("comm-content");if(!e)return;const t=M?.current_tick||0,i=it.find(g=>g.cls===oe)||it[0],a=Pe[ct]||{name:"—",costMod:1,buildMod:1},o=Ke[oe]||{color:"#666"},n=Math.round(i.baseCost*a.costMod),d=Math.max(2,Math.round(i.baseBuild*a.buildMod)),r=Math.round(n*.5),l=n-r,c=t+d,m=qi[p?.corp_subsector]||[];let s="";s+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:#c8a832;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Commission Vessel</span>
            </div>
            <span onclick="smCloseCommission()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
    </div>`,s+='<div style="flex:1;overflow-y:auto;">',s+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Vessel Type</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">`;for(const g of it){const b=Ke[g.cls]||{color:"#666",label:"?"},v=oe===g.cls,x=m.includes(g.cls);s+=`<div onclick="${x?"commSetClass('"+g.cls+"')":""}" style="padding:5px 4px;text-align:center;cursor:${x?"pointer":"not-allowed"};background:${v?b.color+"18":"transparent"};border:1px solid ${v?b.color+"44":"var(--panel-border)"};opacity:${x?1:.3};">
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${v?b.color:"#6a6660"};">${b.label}</div>
            <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;margin-top:2px;">${T(g.baseCost)} base</div>
        </div>`}s+="</div>",s+=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:${o.color};">${i.cargo}</div>`,s+="</div>",s+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Origin Shipyard</div>`;for(let g=0;g<Pe.length;g++){const b=Pe[g],v=ct===g,x=b.costMod>1?"#c84":b.costMod<1?"#5c5":"#6a6660",h=b.buildMod>1?"#c84":b.buildMod<1?"#5c5":"#6a6660";s+=`<div onclick="commSetNation(${g})" style="display:flex;align-items:center;padding:5px 8px;margin-bottom:2px;cursor:pointer;background:${v?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${v?"#8b9a6b44":"var(--panel-border)"};border-left:2px solid ${v?"#8b9a6b":"transparent"};">
            <div style="flex:1;">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span style="font-size:11px;font-weight:600;color:${v?"var(--panel-text)":"#9e9a92"};">${y(b.name)}</span>
                    ${b.isHome?'<span style="font-family:var(--font-mono);font-size:6px;padding:0 3px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2);line-height:11px;">HOME</span>':""}
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;margin-top:2px;">${b.isHome?"Home port — no tariff":"Foreign shipyard"}</div>
            </div>
            <div style="display:flex;gap:8px;align-items:center;">
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">MFG</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#9e9a92;">${b.mfg}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">COST</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${x};">×${b.costMod.toFixed(2)}</div></div>
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">SPEED</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${h};">×${b.buildMod.toFixed(2)}</div></div>
            </div>
        </div>`}s+="</div>",s+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Vessel Name</div>
        <input id="comm-name-input" value="${y(dt)}" oninput="commSetName(this.value)" placeholder="e.g., MV 'Sierra Nevada'" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:11px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;box-sizing:border-box;" />
    </div>`,s+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Build Summary</div>
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:6px 10px;">`;const f=[{label:"VESSEL CLASS",value:oe,color:o.color},{label:"SHIPYARD",value:a.name,color:"#9e9a92"},{label:"BASE COST",value:T(i.baseCost)+" × "+a.costMod.toFixed(2),color:"#9e9a92"},{label:"BUILD TIME",value:d+" ticks",color:d>i.baseBuild?"#c84":d<i.baseBuild?"#5c5":"#9e9a92"},{label:"COMPLETION",value:"~Tick "+c,color:"#9e9a92"}];for(const g of f)s+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${g.label}</span>
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${g.color};">${g.value}</span>
        </div>`;s+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">TOTAL COST</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c8a832;">${T(n)}</span>
    </div>`,s+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEPOSIT (50% NOW)</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">${T(r)}</span>
    </div>`,s+=`<div style="display:flex;justify-content:space-between;padding:3px 0;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">BALANCE ON COMPLETION</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${T(l)}</span>
    </div>`,s+="</div></div>",s+=`<div style="padding:6px 16px;">
        <div style="padding:5px 8px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#c8a832;margin-bottom:2px;">PAYMENT TERMS</div>
            <div style="font-size:9px;color:#6a6660;line-height:1.5;">50% deposit due immediately. Remaining 50% due on delivery at tick ${c}. Vessel delivered at 100% condition, fully fueled, to your nearest port. Cancellation forfeits deposit.</div>
        </div>
    </div>`,s+="</div>";const u=dt.trim().length>=2;s+=`<div style="padding:10px 16px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">DEPOSIT DUE NOW</div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${T(r)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="smCloseCommission()" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="comm-order-btn" onclick="${u?"smPlaceOrder()":""}" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:${u?"#000":"#6a6660"};background:${u?"#c8a832":"transparent"};border:1px solid ${u?"#c8a832":"var(--panel-border)"};cursor:${u?"pointer":"default"};opacity:${u?1:.4};">PLACE ORDER</div>
        </div>
    </div>`,e.innerHTML=s}let Je=!1;async function mn(){if(Je||!p||!M)return;const e=dt.trim();if(e.length<2)return;const t=it.find(b=>b.cls===oe)||it[0],i=Pe[ct];if(!i)return;const a=Math.round(t.baseCost*i.costMod),o=Math.max(2,Math.round(t.baseBuild*i.buildMod)),n=Math.round(a*.5),d=a-n,r=M.current_tick||0,l=Number(p.corp_cash_reserves??0);if(l<n){alert("Insufficient cash for deposit. Need "+T(n)+".");return}if(!confirm("Commission "+oe+" from "+i.name+`?

Deposit: `+T(n)+` (non-refundable)
Balance: `+T(d)+" on delivery at tick "+(r+o)))return;Je=!0;const c=document.getElementById("comm-order-btn");c&&(c.style.opacity="0.4",c.style.pointerEvents="none");const{error:m}=await _.from("factions").update({corp_cash_reserves:l-n}).eq("id",p.id);if(m){alert("Failed: "+m.message),Je=!1;return}const{data:s}=await _.from("nations").select("budget_reserves").eq("id",i.id).single();if(s){var{error:f}=await _.from("nations").update({budget_reserves:Number(s.budget_reserves||0)+n}).eq("id",i.id);f&&console.warn("Failed to credit shipyard nation budget:",f.message)}const u=yt[oe]||yt.Coastal,{error:g}=await _.from("vessel_orders").insert({faction_id:p.id,vessel_name:e,vessel_class:oe,capacity_dwt:u.capacity_dwt,capacity_unit:u.capacity_unit,base_maintenance:u.base_maintenance,fuel_capacity:u.fuel_capacity,purchase_price:t.baseCost,shipyard_nation_id:i.id,shipyard_nation:i.name,cost_modifier:i.costMod,build_modifier:i.buildMod,total_cost:a,deposit_paid:n,balance_due:d,ordered_at_tick:r,delivery_tick:r+o,build_ticks:o,status:"building"});if(g){await _.from("factions").update({corp_cash_reserves:l}).eq("id",p.id),alert("Failed to place order: "+g.message),Je=!1;return}p.corp_cash_reserves=l-n,Je=!1,ma(),alert(e+` commissioned!

Class: `+oe+`
Shipyard: `+i.name+`
Deposit: `+T(n)+`
Delivery: Tick `+(r+o))}window.smSelectListing=on;window.smPurchase=sn;window.smOpenCommission=rn;window.smCloseCommission=ma;window.commSetClass=cn;window.commSetNation=dn;window.commSetName=pn;window.smPlaceOrder=mn;window.flSelectVessel=Yo;window.flRefurbish=Qo;window.flRefuel=Ko;window.flSell=Jo;window.flRename=Xo;window.openBidReview=Uo;window.closeBidReview=St;window.reviewSelectBid=Fo;window.acceptBid=Ho;window.declineAllBids=Go;window.toggleDlExpand=go;So();
