const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-CPI0igZM.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as _}from"./supabase-client-qEAQbBjE.js";/* empty css                    *//* empty css                         */import{c as fe,i as ga,M as tt,Q as ri,a as li,b as Vt,d as ji,e as Ui}from"./corp-auto-services-BIIzQFak.js";import{_ as ba}from"./preload-helper-BXl3LOEh.js";import{escapeHtml as y,hfFmtBig as E}from"./utils-A98FEun4.js";import{initMessaging as xa}from"./messaging-hdfDukBE.js";import{c as ha,a as Wt,E as it,b as xt,d as Fi,e as $a,f as wa,h as Mi}from"./equipment-DsuDdEne.js";import{l as ka,a as Ea}from"./corp-shipping-data-DA_tOdLs.js";import{V as ft}from"./vessels-CjafVZ4G.js";import{SECTOR_OPS_PAGE as Hi}from"./corp-topbar-CPI0igZM.js";import"./loan-math-Q4nHfU_i.js";let Ee=[],p=null,L=null,M=null,Ie=[];const Yt={};let We={},W=[],Q={},Qt=-1;const Ta={em:"em_systems",glass:"glass_facades",heavy:"heavy_parts"},mt=e=>Ta[e]||e;let X="concrete",F="STD",pe=500,He=null,te=[],vt={},Kt=0,ci=[];async function Ca(){if(!p?.id)return;const{data:e}=await _.from("corp_properties").select("*").eq("faction_id",p.id).eq("is_active",!0).order("type",{ascending:!1}).order("purchased_at_tick",{ascending:!1});ci=e||[]}let le=[],at=null,Je={},ut={},di=[],yt=null,ne="trucks",ve=0,_e=1,Te=[],Re=null,Ye=[],Jt=null,dt=null;function Pe(){return He||L}let Xt="ALL",Zt="TIMELINE";function O(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function Ia(e){if(e>=12){const t=Math.floor(e/12),i=e%12;return i>0?t+"y "+i+"mo":t+"y"}return e+" ticks"}function Gi(e){return!e||e.length===0?"":e.map(t=>{const i=vt[t];if(!i)return"";const a=i.reputation_bonus>0?"var(--green)":i.reputation_bonus<0?"var(--red)":"var(--text-dim)",o=i.reputation_bonus>0?"+"+i.reputation_bonus:i.reputation_bonus<0?String(i.reputation_bonus):"";return`<span style="display:inline-flex;align-items:center;gap:3px;padding:2px 6px;background: var(--border-hair);border:1px solid var(--border-0);border-radius:3px;font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">${i.icon||"📍"} ${y(i.name)}${o?` <span style="color:${a};font-weight:700;">${o} REP</span>`:""}</span>`}).filter(Boolean).join(" ")}function se(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(1)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(0)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e}function pi(e){return e==="civil_engineering"?"CIVIL":e==="industrial"?"INDUSTRIAL":e==="mega_project"?"MEGA":e?.toUpperCase()||"—"}function Vi(e){return e==="civil_engineering"?"light":e==="industrial"?"heavy":e==="mega_project"?"mega":"light"}function qa(){dt&&clearInterval(dt),dt=setInterval(()=>{if(!Jt)return;const e=Jt-Date.now();if(e<=0){document.getElementById("tick-countdown").textContent="Tick due...",clearInterval(dt);return}const t=Math.floor(e/36e5),i=Math.floor(e%36e5/6e4),a=Math.floor(e%6e4/1e3);document.getElementById("tick-countdown").textContent=t+"h "+i+"m "+a+"s"},1e3)}function Na(e,t){e==="type"&&(Xt=t),e==="sort"&&(Zt=t),document.querySelectorAll(`.filter-pill[data-filter="${e}"]`).forEach(i=>{i.classList.toggle("active",i.dataset.value===t)}),Wi()}const Ri={"Civil Engineering":"civil_engineering","Industrial Construction":"industrial",Megaprojects:"mega_project"};function ei(e){if(!p)return!1;if(Ri[p.corp_subsector]===e.sector)return!0;const i=(ci||[]).filter(a=>a.type==="regional_hq"&&a.is_active&&a.nation_id===e.nation_id);for(const a of i)if(Ri[a.subsector]===e.sector)return!0;return!1}function Wi(){const e=document.getElementById("oc-list");let t=[...Ie];Xt==="GOVERNMENT"?t=t.filter(r=>r.issuer_type==="GOVERNMENT"):Xt==="PRIVATE"&&(t=t.filter(r=>r.issuer_type==="PRIVATE"));const i=new Set;p?.nation_id&&i.add(p.nation_id);for(const r of ci||[])r.type==="regional_hq"&&r.is_active&&r.nation_id&&i.add(r.nation_id);const a=r=>i.has(r.nation_id)&&ei(r),o=(r,c)=>Zt==="TIMELINE"?(r.timeline_ticks||0)-(c.timeline_ticks||0):Zt==="BUDGET"?(c.budget_ceiling||0)-(r.budget_ceiling||0):0;if(t.sort((r,c)=>{const d=a(r)?1:0,f=a(c)?1:0;return d!==f?f-d:o(r,c)}),document.getElementById("oc-count").textContent=t.length+" AVAILABLE",t.length===0){e.innerHTML=`
            <div class="oc-empty">
                <div class="oc-empty__text">No open contracts available.<br>Contracts appear when governments allocate<br>infrastructure budgets or corporations<br>request construction services.</div>
            </div>`;return}const n=M?.current_tick||0;let l="";for(const r of t){const c=r.issuer_type==="GOVERNMENT",d=c?"gov":"private",f=ei(r),s=f?"":" locked",m=Vi(r.sector),u=pi(r.sector),g=(r.timeline_ticks||0)>18?" warn":"",b=r.bidding_ends_tick?Math.max(0,r.bidding_ends_tick-n):"?",v=Yt[r.nation_id]||"—",x=i.has(r.nation_id);l+=`
            <div class="oc-item${s}" data-contract-id="${r.id}">
                <div class="oc-item__row1">
                    <span class="oc-item__name">${y(r.name)}</span>
                    <span class="oc-item__type-badge ${d}">${c?"GOV":"PRIVATE"}</span>
                </div>
                <div class="oc-item__row2">
                    <span class="oc-item__issuer ${d}">${y(r.issuer_name||"—")}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.7px;color:${x?"var(--teal)":"var(--text-dim)"};margin-left:8px;text-transform:uppercase;">${y(v)}${x?" · HQ":""}</span>
                    <span class="oc-item__id" style="margin-left:auto;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${b} tick${b!==1?"s":""} left</span>
                </div>
                <div class="oc-item__stats">
                    <div class="oc-stat">
                        <div class="oc-stat__label">BUDGET</div>
                        <div class="oc-stat__value">${se(r.budget_ceiling||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">TIMELINE</div>
                        <div class="oc-stat__value${g}">${Ia(r.timeline_ticks||0)}</div>
                    </div>
                    <div class="oc-stat">
                        <div class="oc-stat__label">SECTOR</div>
                        <div class="oc-stat__value ${m}">${u}</div>
                    </div>
                    <div class="oc-eligibility">
                        ${We[r.id]?`<span class="oc-eligible-badge yes" style="background:var(--green-faint);border-color:var(--green-border);color:var(--green);">BID: ${se(We[r.id].bid_price)}</span>`:`<span class="oc-eligible-badge ${f?"yes":"no"}">${f?"ELIGIBLE":"LOCKED"}</span>`}
                    </div>
                    ${f?`<button class="bid-btn bid-btn--submit" style="padding:3px 10px;font-size:8px;margin-left:auto;" onclick="event.stopPropagation();openContractDetail(contracts.find(x=>x.id==='${r.id}'))">VIEW</button>`:""}
                </div>
                ${r.description?`<div style="font-size:9px;color:var(--text-dim);padding:4px 0 0;font-style:italic;">${y(r.description)}</div>`:""}
                ${r.modifiers&&r.modifiers.length>0?`<div style="display:flex;flex-wrap:wrap;gap:3px;padding:4px 0 0;">${Gi(r.modifiers)}</div>`:""}
            </div>`}e.innerHTML=l,e.querySelectorAll(".oc-item:not(.locked)").forEach(r=>{r.addEventListener("click",()=>{const c=r.dataset.contractId,d=Ie.find(f=>f.id===c);d&&Yi(d)})})}let Le=null;function Yi(e){Le=e;const t=document.getElementById("cd-overlay"),i=e.issuer_type==="GOVERNMENT",a=i?"gov":"private",o=(L?.name||p.nation||"—").toUpperCase(),n=ei(e);document.getElementById("cd-header-left").innerHTML=`
        <span class="cd-header__nation">${y(o)}</span>
        <span class="cd-header__name">${y(e.name)}</span>
        <span class="cd-header__sep">&mdash;</span>
        <span class="cd-header__issuer ${a}">${y(e.issuer_name)}</span>
        <span class="cd-header__type-badge ${a}">${i?"GOV":"PRIVATE"}</span>
    `;const l=document.getElementById("cd-blueprint");e.blueprint_svg?(l.innerHTML=e.blueprint_svg,l.style.display=""):(l.innerHTML=Ka(e),l.style.display="");const r=e.permits_required||[],c=e.required_equipment||e.equipment_required||{},d=Array.isArray(c)?c.map(z=>({key:z,qty:1})):Object.entries(c).map(([z,T])=>({key:z,qty:T})),f=e.required_materials||e.materials_estimated||{},m={civil_engineering:"Civil Engineering",industrial:"Industrial Construction",mega_project:"Megaprojects"}[e.sector]||e.spec_category||e.sector||"—";let u="var(--teal)";e.sector==="industrial"&&(u="var(--orange)"),e.sector==="mega_project"&&(u="var(--red)");let g=O(e.budget_ceiling||e.budget||0),b=(e.timeline_ticks||e.timeline_months||0)+" Months",v="";v+=`
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
            <div style="display:flex;flex-direction:column;gap:6px;">`;for(const z of x){const T=vt[z];if(!T)continue;const D=T.reputation_bonus>0?"var(--green)":T.reputation_bonus<0?"var(--red)":"var(--text-dim)",B=T.cost_multiplier>1?"+"+Math.round((T.cost_multiplier-1)*100)+"% cost":T.cost_multiplier<1?Math.round((1-T.cost_multiplier)*100)+"% cheaper":"",j=T.reputation_bonus!==0?(T.reputation_bonus>0?"+":"")+T.reputation_bonus+" rep":"",J=T.required_permits||[];v+=`<div style="padding:6px 10px;background: var(--border-hair);border:1px solid var(--border-hair);border-radius:4px;">
                <div style="display:flex;align-items:center;justify-content:space-between;">
                    <span style="font-weight:600;font-size:0.78rem;color:var(--text-primary);">${T.icon||"📍"} ${y(T.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;">
                        ${B?`<span style="color:var(--amber);">${B}</span>`:""}
                        ${B&&j?" · ":""}
                        ${j?`<span style="color:${D};font-weight:700;">${j}</span>`:""}
                    </span>
                </div>
                <div style="font-size:0.65rem;color:var(--text-dim);margin-top:2px;">${y(T.description||"")}</div>
                ${J.length>0?`<div style="font-size:0.6rem;color:var(--amber);margin-top:3px;font-family:var(--font-mono);">Requires permits: ${J.map($e=>y($e.replace(/_/g," "))).join(", ")}</div>`:""}
            </div>`}v+="</div></div>"}v+='<div class="cd-details">',e.project_type&&(v+=ke("Type",e.project_type)),e.project_subtype&&(v+=ke("Sub-Type",e.project_subtype)),v+=ke("Specialization",m,u),v+=ke("Total Budget",g,"var(--green)"),v+=ke("Timeline",b),v+=ke("Nation",L?.name||p.nation||"—"),e.region&&(v+=ke("Region",e.region)),v+="</div>",r.length>0&&(v+=`
            <div class="cd-items">
                <div class="cd-section-label">Permits Required</div>
                <div class="cd-items__list">
                    ${r.map(z=>{const T=z.status==="approved"?"approved":"required",D=z.status==="approved"?"&#10003;":"&#9675;";return`<div class="cd-chip ${T}">
                            <span class="cd-chip__icon">${D}</span>
                            <span class="cd-chip__label">${y(z.name)}</span>
                        </div>`}).join("")}
                </div>
            </div>`),f.length>0&&(v+=`
            <div class="cd-materials">
                <div class="cd-section-label">Estimated Materials</div>
                ${f.map(z=>`
                    <div class="cd-mat-row">
                        <span class="cd-mat-row__name">${y(z.name)}</span>
                        <span class="cd-mat-row__qty">${y(String(z.quantity||"—"))}</span>
                    </div>`).join("")}
            </div>`),document.getElementById("cd-content").innerHTML=v;const $=r.filter(z=>z.status==="approved").length,h=r.length-$,I=d.length,C=[];for(const z of d){const T=ht[z.key]||z.key,D=te.find(B=>B.equipment_key===T||B.equipment_key===z.key);D&&D.owned>=z.qty||C.push(z)}const w=C.length,k=e.required_materials||{},S=typeof k=="object"&&!Array.isArray(k)?Object.entries(k):[],q=[];for(const[z,T]of S){const D=Q[z]||{},B=(D.LOW?.qty||0)+(D.STD?.qty||0)+(D.HIGH?.qty||0);B<T&&q.push({key:z,need:T,have:B})}const N=z=>z.replace(/_/g," ").replace(/\b\w/g,T=>T.toUpperCase());let P="";if(I>0)if(w===0)P+='<span class="cd-footer__badge ok">ALL EQUIPMENT MET</span>';else{const z=C.map(T=>N(T.key)).join(", ");P+=`<span class="cd-footer__badge bad" title="${y(z)}">${w} SHORT: ${y(z)}</span>`}if(S.length>0)if(q.length===0)P+='<span class="cd-footer__badge ok">ALL MATERIALS MET</span>';else{const z=q.map(T=>N(T.key)+" ("+T.have+"/"+T.need+")").join(", ");P+=`<span class="cd-footer__badge bad" title="${y(z)}">${q.length} MAT SHORT: ${y(z)}</span>`}r.length>0&&(h===0?P+='<span class="cd-footer__badge ok">ALL PERMITS APPROVED</span>':P+=`<span class="cd-footer__badge warn">${h} PERMITS PENDING</span>`);const G=n,Z=e.issuer_faction_id===p?.id,V=e.status==="bidding",ce=We[e.id];document.getElementById("cd-footer").innerHTML=`
        <div class="cd-footer__badges">${P}</div>
        <div class="cd-footer__actions">
            <button class="cd-btn secondary" onclick="closeContractDetail()">CLOSE</button>
            ${Z?`<button class="cd-btn primary" onclick="openBidReview()" style="background:#c8a832;border-color:#c8a832;"
                    ${V?"":"disabled"} title="${V?"Review submitted bids":"No bids received yet"}">REVIEW BIDS</button>`:ce?`<button class="cd-btn primary" onclick="retractBid('${e.id}')" style="background:#c55;border-color:#c55;"
                        title="Retract your bid ($1M penalty)">RETRACT BID</button>`:`<button class="cd-btn primary" onclick="openBidAssembly()" ${G?"":"disabled"}
                        title="${G?"Assemble and submit a bid":"Not qualified for this contract"}">BID</button>`}
        </div>
    `,t.classList.add("open"),document.body.style.overflow="hidden"}function lt(e){e&&e.target&&e.target!==document.getElementById("cd-overlay")||(document.getElementById("cd-overlay").classList.remove("open"),document.body.style.overflow="",Le=null)}const ht={work_trucks:"trucks",concrete_mixers:"mixers",tower_cranes:"cranes",heavy_haulers:"haulers",pile_drivers:"piledrivers",asphalt_plants:"asphalt"},qe=["Permits","Planning","Foundation","Structural","Systems","Finishing","Delivery"],Li={WEATHER:{color:"var(--blue)",bg:"var(--blue-faint)",border:"var(--blue-border)"},SUPPLY:{color:"var(--gold)",bg:"var(--gold-faint)",border:"var(--gold-border)"},LABOR:{color:"var(--orange)",bg:"var(--orange-faint)",border:"var(--orange-border)"},REGULATORY:{color:"var(--red)",bg:"var(--red-faint)",border:"var(--red-border)"},EQUIPMENT:{color:"var(--amber)",bg:"var(--amber-faint)",border:"var(--amber-border)"},POLITICAL:{color:"var(--teal)",bg:"var(--teal-faint)",border:"var(--teal-border)"}},zi={LOW:"var(--green)",MODERATE:"var(--amber)",HIGH:"var(--orange)",CRITICAL:"var(--red)"};let A=null;async function Aa(e,t,i){if(!_||!e||!t||!i)return[];try{const{data:a,error:o}=await _.rpc("get_project_permit_requirements",{p_contract_id:e,p_faction_id:t,p_nation_id:i});return o?(console.warn("[pm permits] failed to load permit requirements:",o.message),[]):Array.isArray(a)?a.filter(n=>n&&n.name).map(n=>({name:String(n.name),has_permit:n.has_permit===!0})):[]}catch(a){return console.warn("[pm permits] unexpected error loading permit requirements:",a),[]}}async function Be(e){const t=W.find(T=>T.id===e);if(!t)return;const i=Array.isArray(t.contract_bids)?t.contract_bids[0]:t.contract_bids,a=M?.current_tick||0,o=t.awarded_at_tick||a,n=t.timeline_ticks||8,l=Math.max(0,a-o),r=Math.min(100,l/n*100);let c=Math.min(qe.length-1,Math.floor(r/(100/qe.length)));const d=Math.round(r%(100/qe.length)/(100/qe.length)*100),f=t.required_materials||{},s=i?.material_grades||{};let m=[];try{const{data:T}=await _.from("project_material_allocations").select("material_key, quality_tier, quantity, consumed").eq("contract_id",t.id);m=T||[]}catch{}const u={};for(const T of m)u[T.material_key]||(u[T.material_key]={totalAllocated:0,totalConsumed:0,tiers:{}}),u[T.material_key].totalAllocated+=T.quantity,u[T.material_key].totalConsumed+=T.consumed,u[T.material_key].tiers[T.quality_tier]={qty:T.quantity,consumed:T.consumed};const g=Object.entries(f).map(([T,D])=>{const B=s[T]||"STD",j=u[T]||{totalAllocated:0,totalConsumed:0,tiers:{}};return{key:T,name:T.replace(/_/g," ").replace(/\b\w/g,J=>J.toUpperCase()),grade:B,required:Number(D),allocated:j.totalAllocated,consumed:j.totalConsumed,tiers:j.tiers,warehouseStock:Q[T]||{}}}),b=t.required_equipment||{},v=t.equipment_condition||{},$=(Array.isArray(b)?b.map(T=>[T,1]):Object.entries(b)).map(([T,D])=>{const B=ht[T]||T,j=te.find(oe=>oe.equipment_key===B||oe.equipment_key===T),$e=(j?.assigned_projects||[]).find(oe=>oe.contract_id===t.id),It=$e?$e.units:0;return{key:T,name:T.replace(/_/g," ").replace(/\b\w/g,oe=>oe.toUpperCase()),required:Number(D)||1,ownedTotal:j?.owned||0,deployed:j?.deployed||0,available:Math.max(0,(j?.owned||0)-(j?.deployed||0)),assignedToProject:It,condition:v[T]??(j?.condition||100)}}),h=t.budget_ceiling||0,I=i?.estimated_cost||0,C=Math.round(I*Math.min(1,l/n)),w=i?.estimated_quality||65,k=w>=75?"EXCELLENT":w>=50?"FAIR":w>=25?"POOR":"BAD",S=t.required_workforce||{},q=t.workers_assigned||{},N=(S.general||0)+(S.skilled||0)+(S.innovative||0),P=(q.general||0)+(q.skilled||0)+(q.innovative||0),G=i?.labor_count||N,Z=Number(p?.corp_general_workforce??0),V=Number(p?.corp_skilled_workforce??0),ce=Number(p?.corp_innovative_workforce??0),z=await Aa(t.id,p?.id,t.nation_id);A={project:t,bid:i,tab:"overview",expandedEvent:-1,selectedResponse:null,currentTick:a,awardedTick:o,totalTicks:n,ticksElapsed:l,phaseIdx:c,phaseProgress:d,materials:g,equipment:$,permitRequirements:z,budget:h,estCost:I,spent:C,quality:w,qualityLabel:k,laborCount:G,wfNeeded:N,wfAssigned:P,reqWf:S,assignedWf:q,corpGeneral:Z,corpSkilled:V,corpInnovative:ce,events:[]},document.getElementById("pm-overlay").classList.add("open"),document.body.style.overflow="hidden",Qi(t.id).then(()=>Oe()),Oe()}let H=!1;async function Sa(e,t,i){if(!(H||!A||!p)){H=!0;try{const{data:a,error:o}=await _.rpc("allocate_material_to_project",{p_contract_id:A.project.id,p_faction_id:p.id,p_material_key:e,p_quality_tier:t,p_quantity:i});if(o){alert("Allocation failed: "+o.message);return}if(a&&!a.success){alert(a.error||"Allocation failed");return}await mi(),await Be(A.project.id)}catch(a){alert("Allocation error: "+a.message)}finally{H=!1}}}async function Ma(e,t,i){if(!(H||!A||!p)){H=!0;try{const{data:a,error:o}=await _.rpc("deallocate_material_from_project",{p_contract_id:A.project.id,p_faction_id:p.id,p_material_key:e,p_quality_tier:t,p_quantity:i});if(o){alert("Return failed: "+o.message);return}if(a&&!a.success){alert(a.error||"Return failed");return}await mi(),await Be(A.project.id)}catch(a){alert("Return error: "+a.message)}finally{H=!1}}}async function Ra(e,t){if(!(H||!A||!p)){H=!0;try{const i=A.project,a=i.workers_assigned||{},o=Number(a[e]||0),n=Number((i.required_workforce||{})[e]||0),l=Number(p?.["corp_"+e+"_workforce"]??0);let r=0;for(const u of W||[])u.id!==i.id&&(r+=Number((u.workers_assigned||{})[e]||0));const c=Math.max(0,l-r-o),d=Math.min(t,n-o,c);if(d<=0){alert(c<=0?"No "+e+" workers available in pool":"Already fully staffed for "+e);return}const f={...a,[e]:o+d},{error:s}=await _.from("construction_contracts").update({workers_assigned:f}).eq("id",i.id);if(s){alert("Assign failed: "+s.message);return}const m=W.find(u=>u.id===i.id);m&&(m.workers_assigned=f),await Be(i.id)}catch(i){alert("Assign error: "+i.message)}finally{H=!1}}}async function La(e,t){if(!(H||!A||!p)){H=!0;try{const i=A.project,a=i.workers_assigned||{},o=Number(a[e]||0),n=Math.min(t,o);if(n<=0){alert("No "+e+" assigned");return}const l={...a,[e]:o-n},{error:r}=await _.from("construction_contracts").update({workers_assigned:l}).eq("id",i.id);if(r){alert("Unassign failed: "+r.message);return}const c=W.find(d=>d.id===i.id);c&&(c.workers_assigned=l),await Be(i.id)}catch(i){alert("Unassign error: "+i.message)}finally{H=!1}}}async function za(e,t){if(!(H||!A||!p)){H=!0;try{const i=ht[e]||e,a=te.find(d=>d.equipment_key===i||d.equipment_key===e);if(!a){alert("Equipment not found in inventory.");return}const o=Math.max(0,(a.owned||0)-(a.deployed||0));if(o<t){alert("Not enough available "+e+" ("+o+" available).");return}const n=(a.deployed||0)+t,l=[...a.assigned_projects||[]],r=l.find(d=>d.contract_id===A.project.id);r?r.units+=t:l.push({contract_id:A.project.id,contract_name:A.project.name,units:t});const{error:c}=await _.from("corp_equipment").update({deployed:n,assigned_projects:l}).eq("faction_id",p.id).eq("equipment_key",a.equipment_key);if(c){alert("Deploy failed: "+c.message);return}await ki(),await Be(A.project.id)}catch(i){alert("Deploy error: "+i.message)}finally{H=!1}}}async function Oa(e){if(!(H||!A||!p)){H=!0;try{const t=ht[e]||e,i=te.find(c=>c.equipment_key===t||c.equipment_key===e);if(!i){alert("Equipment not found.");return}const a=[...i.assigned_projects||[]],o=a.findIndex(c=>c.contract_id===A.project.id);if(o===-1){alert("Equipment not deployed to this project.");return}const n=a[o].units;a.splice(o,1);const l=Math.max(0,(i.deployed||0)-n),{error:r}=await _.from("corp_equipment").update({deployed:l,assigned_projects:a}).eq("faction_id",p.id).eq("equipment_key",i.equipment_key);if(r){alert("Undeploy failed: "+r.message);return}await ki(),await Be(A.project.id)}catch(t){alert("Undeploy error: "+t.message)}finally{H=!1}}}function Pa(e){e&&e.target!==document.getElementById("pm-overlay")||(document.getElementById("pm-overlay").classList.remove("open"),document.body.style.overflow="",A=null)}function Ba(e){A&&(A.tab=e,A.expandedEvent=-1,A.selectedResponse=null,Oe())}function Da(e){A&&(A.expandedEvent=A.expandedEvent===e?-1:e,A.selectedResponse=null,Oe())}function ja(e){A&&(A.selectedResponse=A.selectedResponse===e?null:e,Oe())}function Oe(){if(!A)return;const e=A,t=e.project,i=t.issuer_type==="GOVERNMENT",a=pi(t.sector),o=p?.nation||"Nation",n=e.awardedTick+e.totalTicks,l=Math.max(0,n-e.currentTick),r=e.currentTick>n,c=e.budget>0?Math.round(e.spent/e.budget*100):0,d=c>85?"var(--red)":c>60?"var(--amber)":"var(--teal)",f=e.budget-e.spent,s=e.events.filter(v=>v.status==="ACTIVE").length;document.getElementById("pm-header").innerHTML=`
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
    `;let m='<div class="pm-phase__bar">';for(let v=0;v<qe.length;v++){const x=v<e.phaseIdx,$=v===e.phaseIdx;m+=`<div class="pm-phase__seg">
            <div class="pm-phase__seg-fill pm-phase__seg-fill--${x?"done":$?"active":"future"}"></div>
            <span class="pm-phase__seg-label pm-phase__seg-label--${x?"done":$?"active":""}">${qe[v]}</span>
        </div>`}m+="</div>",m+=`<div class="pm-phase__info">
        <span class="pm-phase__status">${qe[e.phaseIdx]} — ${e.phaseProgress}% complete</span>
        <span class="pm-phase__tick" style="color:${r?"var(--red)":"var(--text-secondary)"}">Tick ${e.ticksElapsed} / ${e.totalTicks}${r?" — OVERDUE":""}</span>
    </div>`,document.getElementById("pm-phase").innerHTML=m;const u=[{id:"overview",label:"Overview"},{id:"events",label:"Events",badge:s},{id:"materials",label:"Materials"},{id:"equipment",label:"Equipment"}];document.getElementById("pm-tabs").innerHTML=u.map(v=>`<button class="pm-tab${e.tab===v.id?" active":""}" onclick="pmSetTab('${v.id}')">
            ${v.label}${v.badge>0?`<span class="pm-tab__badge">${v.badge}</span>`:""}
        </button>`).join("");let g="";e.tab==="overview"?g=Ua(e,t,d,c,f,l,r):e.tab==="events"?g=Fa(e):e.tab==="materials"?g=Ha(e):e.tab==="equipment"&&(g=Ga(e)),document.getElementById("pm-content").innerHTML=`<div style="padding:0">${g}</div>`;let b="";s>0&&(b+=`<span class="pm-ftr__badge" style="color:var(--red);background:var(--red-faint);border:1px solid var(--red-border)">${s} EVENT${s>1?"S":""} REQUIRES RESPONSE</span>`),b+=`<span class="pm-ftr__badge" style="color:${e.quality>=75?"var(--green)":e.quality>=50?"var(--amber)":e.quality>=25?"var(--orange)":"var(--red)"};background:var(--bg-0);border:1px solid var(--border-0)">QUALITY: ${e.quality}/100 — ${e.qualityLabel}</span>`,document.getElementById("pm-footer").innerHTML=`
        <div class="pm-ftr__left">${b}</div>
        <div style="display:flex;gap:8px;">
            ${e.effectiveProgress>=e.totalTicks?`<button data-deliver-id="${A.project.id}" style="padding:8px 20px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#000;background:var(--green);border:none;cursor:pointer;" onclick="closeProjectModal();deliverProject('${A.project.id}','${(A.project.name||"").replace(/'/g,"\\'")}',${A.bid?.bid_price||0},${A.bid?.estimated_cost||0},${A.bid?.estimated_quality||65})">DELIVER</button>`:""}
            <button class="pm-ftr__close" onclick="closeProjectModal()">CLOSE</button>
        </div>
    `}function Ua(e,t,i,a,o,n,l){const r=Ne(e.awardedTick+e.totalTicks);Ne(e.awardedTick+e.totalTicks);const c=Ne(e.awardedTick),d=[{label:"Budget",value:se(e.budget),sub:`${a}% spent`,color:i},{label:"Spent",value:se(e.spent),color:"var(--red)"},{label:"Remaining",value:se(o),color:"var(--green)"},{label:"Quality",value:`${e.quality}/100`,sub:e.qualityLabel,color:e.quality>=75?"var(--green)":e.quality>=50?"var(--amber)":e.quality>=25?"var(--orange)":"var(--red)"},{label:"Workforce",value:`${e.laborCount}/${e.wfNeeded}`,sub:`Bid: ${e.laborCount}`,color:e.laborCount<e.wfNeeded?"var(--orange)":"var(--text-bright)"},{label:"Remaining",value:`${n} ticks`,sub:l?"OVERDUE":`Deadline: ${r}`,color:l?"var(--red)":"var(--text-bright)"}];let f="";f+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Description</div>
        <div class="pm-desc">${y(t.description||t.name)}</div>
    </div></div>`,f+='<div class="pm-metrics">';for(const v of d)f+=`<div class="pm-metric">
            <div class="pm-metric__label">${v.label}</div>
            <div class="pm-metric__value" style="color:${v.color}">${v.value}</div>
            ${v.sub?`<div class="pm-metric__sub">${y(v.sub)}</div>`:""}
        </div>`;f+="</div>",f+=`<div style="padding:0 16px"><div class="pm-section">
        <div class="pm-section__title">Timeline</div>
        <div class="pm-manager">
            <span style="font-size:11px;color:var(--text-secondary)">Started: ${c}</span>
            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary)">Deadline: <span style="color:${l?"var(--red)":"var(--text-bright)"};font-weight:700">${r}</span></span>
        </div>
    </div></div>`;const s=t.modifiers||[];s.length>0&&(f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Building Modifiers</div>',f+='<div style="display:flex;flex-wrap:wrap;gap:4px;">',f+=Gi(s),f+="</div></div></div>");const m=Array.isArray(e.permitRequirements)?e.permitRequirements:[];if(m.length>0){f+=`<div style="padding:0 16px"><div class="pm-section">
            <div class="pm-section__title">Permits</div>`;for(const v of m){const x=v.has_permit===!0,$=x?"HAS PERMIT":"NEEDS TO GET";f+=`<div class="pm-permit">
                <div class="pm-permit__left">
                    <span class="pm-permit__check" style="color:${x?"var(--green)":"var(--amber)"}">${x?"✓":"!"}</span>
                    <span class="pm-permit__name">${y(v.name)}</span>
                </div>
                <span class="pm-permit__exp" style="color:${x?"var(--green)":"var(--amber)"}">${$}</span>
            </div>`}f+="</div></div>"}f+='<div style="padding:0 16px"><div class="pm-section">',f+='<div class="pm-section__title">Workforce Assignment</div>';const u=[{key:"general",label:"General Workers",corpAvail:e.corpGeneral,color:"var(--text-primary)"},{key:"skilled",label:"Skilled Workers",corpAvail:e.corpSkilled,color:"var(--blue)"},{key:"innovative",label:"Innovative Workers",corpAvail:e.corpInnovative,color:"var(--purple)"}];for(const v of u){const x=Number(e.reqWf[v.key]||0);if(x===0)continue;const $=Number(e.assignedWf[v.key]||0),I=$>=x?"var(--green)":$>0?"var(--amber)":"var(--red)",C=v.corpAvail>0&&$<x,w=Math.min(v.corpAvail,x-$),k=$>0;f+='<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid var(--border-hair);font-size:0.72rem;">',f+="<div>",f+=`<span style="color:${v.color};font-weight:600;">${v.label}</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Required: <strong>${x}</strong></span>`,f+=`<span style="color:${I};margin-left:8px;font-weight:700;">${$} assigned</span>`,f+=`<span style="color:var(--text-dim);margin-left:8px;">Pool: ${v.corpAvail}</span>`,f+="</div>",f+='<div style="display:flex;gap:4px;">',C&&(f+=`<button onclick="pmAssignWorkers('${v.key}',${w})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Assign ${w}</button>`),k&&(f+=`<button onclick="pmUnassignWorkers('${v.key}',${$})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Remove ${$}</button>`),f+="</div></div>"}const g=Number(e.reqWf.general||0)+Number(e.reqWf.skilled||0)+Number(e.reqWf.innovative||0),b=Number(e.assignedWf.general||0)+Number(e.assignedWf.skilled||0)+Number(e.assignedWf.innovative||0);return g>0&&b<g&&(f+='<div style="font-size:0.62rem;color:var(--red);margin-top:6px;font-family:var(--font-mono);">⚠ Project will STALL until workforce is fully assigned</div>'),f+="</div></div>",f}function Fa(e){if(e.events.length===0)return'<div class="pm-evt-empty">No events have occurred on this project yet.<br>Events will appear here as construction progresses.</div>';let t="";for(let i=0;i<e.events.length;i++){const a=e.events[i],o=e.expandedEvent===i,n=a.status==="ACTIVE",l=Li[a.type]||Li.WEATHER,r=zi[a.severity]||zi.LOW;if(t+=`<div class="pm-evt ${n?"pm-evt--active":"pm-evt--resolved"}" style="${n?`border-left-color:${l.color}`:""}">`,t+=`<div class="pm-evt__header" onclick="pmToggleEvent(${i})" style="${o?`background:${l.bg}`:""}">`,t+=`<div class="pm-evt__row1">
            <span class="pm-evt__type-badge" style="color:${l.color};background:${l.bg};border:1px solid ${l.border}">${a.type}</span>
            <span class="pm-evt__sev-badge" style="color:${r}">${a.severity}</span>
            <span class="pm-evt__status" style="color:${n?"var(--red)":"var(--text-dim)"};font-weight:${n?"700":"400"}">${n?"REQUIRES RESPONSE":"RESOLVED"}</span>
        </div>`,t+=`<div class="pm-evt__title">${y(a.title)}</div>`,t+=`<div class="pm-evt__meta">Tick ${a.tick} · ${y(a.id||"")}</div>`,o){if(t+='<div class="pm-evt__body">',t+=`<div class="pm-evt__desc">${y(a.desc)}</div>`,a.impact&&(t+=`<div class="pm-evt__impact">
                    <span class="pm-evt__impact-label">IMPACT: </span>
                    <span class="pm-evt__impact-text">${y(a.impact)}</span>
                </div>`),n&&a.responses&&a.responses.length>0){t+='<div class="pm-evt__resp-title">Response Options</div>';for(let c=0;c<a.responses.length;c++){const d=a.responses[c],f=e.selectedResponse===c,m={SAFE:"var(--green)",RISKY:"var(--orange)",DANGEROUS:"var(--red)"}[d.tag]||"var(--text-secondary)";t+=`<div class="pm-resp${f?" selected":""}" style="${f?`border-color:${m}`:""}" onclick="event.stopPropagation();pmSelectResponse(${c})">`,t+=`<div class="pm-resp__row1">
                        <div class="pm-resp__left">
                            <span class="pm-resp__label">${y(d.label)}</span>
                            <span class="pm-resp__tag" style="color:${m};background:${m}12;border:1px solid ${m}25">${d.tag}</span>
                        </div>
                        <span class="pm-resp__delay" style="color:${d.delay>0?"var(--orange)":"var(--green)"}">
                            ${d.delay>0?`+${d.delay} tick${d.delay>1?"s":""}`:"No delay"}
                        </span>
                    </div>`,t+=`<div class="pm-resp__detail">${y(d.detail)}</div>`,t+='<div class="pm-resp__costs">',d.cost&&(t+=`<span class="pm-resp__cost" style="color:var(--red)">Cost: ${se(d.cost)}</span>`),d.qualityImpact&&d.qualityImpact!==0&&(t+=`<span class="pm-resp__cost" style="color:${d.qualityImpact>0?"var(--green)":"var(--red)"}">Quality: ${d.qualityImpact>0?"+":""}${d.qualityImpact}</span>`),!d.cost&&(!d.qualityImpact||d.qualityImpact===0)&&(t+='<span class="pm-resp__cost" style="color:var(--green)">No additional cost</span>'),t+="</div>",f&&(t+=`<div class="pm-resp__confirm">
                            <button class="pm-resp__confirm-btn" style="background:${m}" onclick="event.stopPropagation();confirmEventResponse('${a.id}','${d.key}')">CONFIRM</button>
                        </div>`),t+="</div>"}}!n&&a.resolution&&(t+=`<div class="pm-evt__resolution">
                    <div class="pm-evt__resolution-label">RESOLUTION</div>
                    <div class="pm-evt__resolution-text">${y(a.resolution)}</div>
                </div>`),t+="</div>"}t+="</div></div>"}return t}function Ha(e){if(e.materials.length===0)return'<div class="pm-evt-empty">No materials required for this project.</div>';let t='<div class="pm-tab-header">Project Materials</div>';for(const i of e.materials){const a=i.required>0?Math.round(i.allocated/i.required*100):0;i.allocated>0&&Math.round(i.consumed/i.allocated*100);const o=i.allocated>=i.required,n=o?"var(--green)":i.allocated>0?"var(--amber)":"var(--red)",l=o?"FULLY ALLOCATED":i.allocated>0?"PARTIAL":"NONE ALLOCATED";t+='<div class="pm-mat" style="margin-bottom:14px;">',t+=`<div class="pm-mat__row1">
            <div class="pm-mat__left">
                <span class="pm-mat__name">${y(i.name)}</span>
            </div>
            <span style="font-family:var(--font-mono);font-size:0.65rem;font-weight:700;color:${n};">${i.allocated} / ${i.required} allocated · ${l}</span>
        </div>`,t+=`<div class="pm-mat__bar-row">
            <div class="pm-mat__bar"><div class="pm-mat__bar-fill" style="width:${a}%;background:${n};"></div></div>
            <span class="pm-mat__pct">${i.consumed} consumed</span>
        </div>`;const r=["STD","LOW","HIGH"],c=i.required-i.allocated;for(const d of r){const f=i.warehouseStock[d]||{qty:0},s=i.tiers[d]||{qty:0,consumed:0},m=s.qty-s.consumed;if(f.qty===0&&s.qty===0)continue;const u=d==="HIGH"?"var(--green)":d==="LOW"?"var(--orange)":"var(--text-muted)",g=d==="HIGH"?"HIGH":d==="LOW"?"LOW":"STD";if(t+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--border-hair);font-size:0.7rem;">',t+='<div style="display:flex;align-items:center;gap:6px;">',t+=`<span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${u};width:32px;">${g}</span>`,t+=`<span style="color:var(--text-dim);">Warehouse: <strong style="color:var(--text-primary);">${f.qty}</strong></span>`,s.qty>0&&(t+=`<span style="color:var(--text-dim);margin-left:8px;">Allocated: <strong style="color:var(--text-primary);">${s.qty}</strong></span>`),t+="</div>",t+='<div style="display:flex;gap:4px;">',f.qty>0&&c>0){const b=Math.min(f.qty,c);t+=`<button class="pm-alloc-btn" onclick="pmAllocateMaterial('${i.key}','${d}',${b})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Allocate ${b}</button>`}m>0&&(t+=`<button class="pm-alloc-btn" onclick="pmDeallocateMaterial('${i.key}','${d}',${m})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Return ${m}</button>`),t+="</div></div>"}t+="</div>"}return t}function Ga(e){if(e.equipment.length===0)return'<div class="pm-evt-empty">No equipment required for this project.</div>';let t='<div class="pm-tab-header">Project Equipment</div>';for(const i of e.equipment){const a=i.condition>=75?"var(--green)":i.condition>=50?"var(--amber)":i.condition>=25?"var(--orange)":"var(--red)",o=i.assignedToProject>=i.required,n=i.assignedToProject>0&&i.assignedToProject<i.required,l=o?"var(--green)":n||i.ownedTotal>0?"var(--amber)":"var(--red)",r=o?`${i.assignedToProject}/${i.required} DEPLOYED`:n?`${i.assignedToProject}/${i.required} PARTIAL`:i.ownedTotal>0?"NOT DEPLOYED":"NOT OWNED";t+=`<div class="pm-eq" style="margin-bottom:12px;">
            <div class="pm-eq__info">
                <div class="pm-eq__left">
                    <span class="pm-eq__name">${y(i.name)}</span>
                    <span style="font-family:var(--font-mono);font-size:0.6rem;font-weight:700;color:${l};margin-left:8px;">${r}</span>
                </div>
            </div>`,i.assignedToProject>0&&(t+=`<div class="pm-eq__cond">
                <div class="pm-eq__cond-bar"><div class="pm-eq__cond-fill" style="width:${i.condition}%;background:${a}"></div></div>
                <span class="pm-eq__cond-val" style="color:${a}">${i.condition}%</span>
            </div>`);const c=Math.min(i.available,i.required-i.assignedToProject);t+='<div style="display:flex;align-items:center;justify-content:space-between;padding:4px 0;font-size:0.7rem;">',t+=`<span style="color:var(--text-dim);">Required: <strong style="color:${o?"var(--green)":"var(--red)"}">${i.required}</strong>`,t+=` · Owned: <strong style="color:var(--text-primary);">${i.ownedTotal}</strong>`,t+=` · Available: <strong style="color:var(--text-primary);">${i.available}</strong></span>`,t+='<div style="display:flex;gap:4px;">',c>0&&(t+=`<button onclick="pmDeployEquipment('${i.key}',${c})" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--green);color:var(--green);background:rgba(92,184,92,0.08);border-radius:3px;cursor:pointer;">Deploy ${c}</button>`),i.assignedToProject>0&&(t+=`<button onclick="pmUndeployEquipment('${i.key}')" style="font-size:0.6rem;padding:2px 8px;border:1px solid var(--orange);color:var(--orange);background:rgba(232,114,74,0.08);border-radius:3px;cursor:pointer;">Undeploy</button>`),t+="</div></div>",t+="</div>"}return t}function Ne(e){return`${["January","February","March","April","May","June","July","August","September","October","November","December"][e%12]}, ${2e3+Math.floor(e/12)}`}async function Va(e,t){if(!p||!M)return;const i=prompt(`REQUEST CONSTRUCTION INSURANCE
`+"─".repeat(35)+`

Describe what this policy should cover:

e.g., "Full coverage for weather delays, material damage, and labor disputes during construction. Should cover cost overruns up to 20% of budget."

Insurance corps will see this in their Deal Flow.`);if(i===null)return;const a=i.trim()||"Construction Insurance",o=M.current_tick||0,{error:n}=await _.from("finance_loan_requests").insert({requesting_faction_id:p.id,nation_id:p.nation_id,request_type:"insurance",insured_contract_id:e,amount:t,term_months:0,purpose:a,status:"open",created_tick:o,expires_tick:o+12});if(n){n.message.includes("duplicate")||n.message.includes("unique")?alert("Insurance already requested for this project."):alert("Failed to request insurance: "+n.message);return}alert("Insurance request posted to Deal Flow. Insurance corporations can now offer coverage."),await ot()}window.requestInsurance=Va;let At=!1;const St=new Set;function Wa(e,t){const i=e?.template_key;if(!i)return null;if(i==="fuel_depot"||i==="dry_dock"){const a=e.project_subtype||"Basic",o=pt.find(n=>n.type===i&&n.name===e.name)||pt.find(n=>n.type===i&&n.style===a)||pt.find(n=>n.type===i);return{type:i,style:a,capacity:a==="Modern"?500:250,maintenance:o?.maint||Math.round(t*.001)}}return i==="custom_building"?{type:{"Insurance Office":"insurance_office","Claims Office":"claims_office","Branch Office":"branch_office","Trading Floor":"trading_floor"}[e.project_type]||"office",style:e.project_subtype||"Basic",capacity:500,maintenance:Math.round(t*.001)}:null}function Oi(e,t){document.querySelectorAll(`[data-deliver-id="${e}"]`).forEach(i=>{i.disabled=t,i.style.opacity=t?"0.55":"",i.style.cursor=t?"not-allowed":"pointer",t&&(i.textContent="DELIVERING…")})}async function Ya(e,t,i,a,o){if(!(At||!p||!M)&&!St.has(e)&&confirm('Deliver "'+t+`"?

An inspection will be conducted and payment issued based on quality.`)){At=!0,Oi(e,!0);try{const n=M.current_tick||0,l=o||65,r=Math.floor(Math.random()*21)-10,c=Math.max(10,Math.min(100,l+r)),d=c>=80?"DISTINCTION":c>=60?"PASS":c>=40?"CONDITIONAL":"FAIL",f=c>=80?Math.round(i*.1):0,s=d==="FAIL"?Math.round(i*.3):d==="CONDITIONAL"?Math.round(i*.1):0,m=Math.max(0,i+f-s),u=m-a,g=d==="DISTINCTION"?3:d==="PASS"?1:d==="CONDITIONAL"?-1:-3,{data:b}=await _.from("construction_contracts").select("awarded_at_tick, timeline_ticks, stalled_ticks, issuer_faction_id, nation_id, status, name, template_key, project_type, project_subtype, issuer_type, issuer_name").eq("id",e).single();if(!b){alert("Contract not found.");return}if(b.status==="completed"||b.status==="delivered"){St.add(e),alert("This project has already been delivered."),await ot();return}const v=b.timeline_ticks||8,x=Math.max(0,n-(b.awarded_at_tick||n)),$=x<=v,{error:h}=await _.from("construction_deliveries").insert({contract_id:e,faction_id:p.id,nation_id:b.nation_id,result:d,quality_score:c,rep_change:g,inspection:{base_quality:l,variance:r,final:c},contract_value:i,quality_bonus:f,penalties:s,payment_received:m,total_cost:a,net_profit:u,timeline_expected:v,timeline_actual:x,on_time:$,delivered_at_tick:n});if(h){alert("Delivery failed: "+h.message);return}const{error:I}=await _.from("construction_contracts").update({status:"completed",completed_at_tick:n}).eq("id",e);if(I){alert("Failed to mark project completed: "+I.message);return}if(m>0){const{data:N}=await _.from("factions").select("corp_cash_reserves").eq("id",p.id).single();N&&await _.from("factions").update({corp_cash_reserves:Number(N.corp_cash_reserves||0)+m}).eq("id",p.id)}if(g!==0){const{data:N}=await _.from("factions").select("corp_reputation").eq("id",p.id).single();N&&await _.from("factions").update({corp_reputation:Math.max(0,Math.min(100,Number(N.corp_reputation||50)+g))}).eq("id",p.id)}if(b.issuer_faction_id)try{const N=Wa(b,i);N&&await _.from("corp_properties").insert({faction_id:b.issuer_faction_id,nation_id:b.nation_id,name:b.name||t,type:N.type,role:N.type,style:N.style,capacity:N.capacity,purchase_price:i,monthly_maintenance:N.maintenance,condition:Math.max(25,Math.min(100,c)),purchased_at_tick:n,built_via_contract_id:e,is_active:!0})}catch(N){console.warn("[deliverProject] Failed to register property for issuer:",N?.message||N)}const C=b.issuer_name||"the client",{data:w}=await _.from("nations").select("name").eq("id",b.nation_id).single(),k=w?.name||"Unknown",S=p.faction_name+" has completed the "+t+" project for "+C+" in "+k+".",q=new Set([b.nation_id]);p.nation_id&&p.nation_id!==b.nation_id&&q.add(p.nation_id);try{await _.from("event_log").insert([...q].map(N=>({nation_id:N,event_name:t+" — Project Completed",category:"corporate",description_chosen:S,fired_at_tick:n})))}catch(N){console.warn("[Deliver] Event log failed:",N.message)}alert(`Project delivered!

Result: `+d+`
Quality: `+c+`/100
Payment: `+E(m)+(f>0?" (includes +"+E(f)+" quality bonus)":"")+(s>0?`
Penalties: -`+E(s):"")+`
Reputation: `+(g>0?"+":"")+g+`
Net Profit: `+(u>=0?"+":"")+E(u)),St.add(e),await ot(),await oa()}catch(n){alert("Delivery failed: "+(n.message||n)),Oi(e,!1)}finally{At=!1}}}window.deliverProject=Ya;window.openProjectModal=Be;window.closeProjectModal=Pa;window.pmSetTab=Ba;window.pmToggleEvent=Da;window.pmSelectResponse=ja;window.pmAllocateMaterial=Sa;window.pmDeallocateMaterial=Ma;window.pmDeployEquipment=za;window.pmUndeployEquipment=Oa;window.pmAssignWorkers=Ra;window.pmUnassignWorkers=La;async function Qi(e){if(!A)return;const{data:t,error:i}=await _.from("construction_events").select("*").eq("contract_id",e).order("fired_at_tick",{ascending:!1});i?(console.warn("Failed to load project events:",i.message),A.events=[]):A.events=(t||[]).map(a=>({id:a.id,type:a.type,severity:a.severity,tick:a.fired_at_tick,title:a.title,desc:a.description,impact:a.impact,status:a.status==="ACTIVE"?"ACTIVE":"RESOLVED",resolution:a.resolution,responses:a.responses||[]})),Oe()}let Mt=!1;async function Qa(e,t){if(!(Mt||!A)){Mt=!0;try{const{data:i,error:a}=await _.rpc("resolve_construction_event",{p_event_id:e,p_response_key:t});if(a){console.error("Failed to resolve event:",a.message),alert("Failed to submit response: "+a.message);return}const o=typeof i=="string"?JSON.parse(i):i;if(o?.error){alert("Error: "+o.error);return}await Qi(A.project.id),await ot(),o?.quality_applied&&o.quality_applied!==0&&(A.quality=Math.max(0,Math.min(100,A.quality+o.quality_applied)),A.qualityLabel=A.quality>=75?"EXCELLENT":A.quality>=50?"FAIR":A.quality>=25?"POOR":"BAD"),Oe()}finally{Mt=!1}}}window.confirmEventResponse=Qa;function ke(e,t,i){const a=i?` style="color:${i}"`:"";return`<div class="cd-detail-row">
        <span class="cd-detail-row__label">${y(e)}</span>
        <span class="cd-detail-row__value"${a}>${y(t)}</span>
    </div>`}function Ka(e){const t={bg:"#1a2a3a",line:"#3a6a8a",dim:"#2a4a5a",accent:"#5a9aba",text:"#4a8aaa"},i=e.drawing_number||e.contract_number+"-A1",a=M?.current_date||"",o=a?a.replace(/,\s*/," "):"",n=e.spec_category==="Heavy Infrastructure",l=e.spec_category==="Megaproject";let r=y(e.project_subtype||e.project_type||"STRUCTURE"),c=n?"80.0m":l?"200.0m":"60.0m",d=n?"40.0m":l?"100.0m":"20.0m";return`<svg viewBox="0 0 680 200" style="width:100%;display:block;background:${t.bg}">
        <!-- Grid -->
        ${Array.from({length:35},(f,s)=>`<line x1="${s*20}" y1="0" x2="${s*20}" y2="200" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}
        ${Array.from({length:11},(f,s)=>`<line x1="0" y1="${s*20}" x2="680" y2="${s*20}" stroke="${t.dim}" stroke-width="0.3"/>`).join("")}

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
        <text x="340" y="17" text-anchor="middle" font-size="5.5" fill="${t.dim}" font-family="var(--font-mono)">${c}</text>

        <!-- Dimension: right -->
        <line x1="630" y1="30" x2="630" y2="150" stroke="${t.dim}" stroke-width="0.5"/>
        <line x1="627" y1="30" x2="633" y2="30" stroke="${t.dim}" stroke-width="0.5"/>
        <line x1="627" y1="150" x2="633" y2="150" stroke="${t.dim}" stroke-width="0.5"/>
        <text x="645" y="93" text-anchor="middle" font-size="5.5" fill="${t.dim}" font-family="var(--font-mono)" transform="rotate(90,645,93)">${d}</text>

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
    </svg>`}async function xe(){if(!p||!p.nation_id)return;const{data:e,error:t}=await _.from("construction_contracts").select("*").in("status",["open","bidding"]).order("generated_at_tick",{ascending:!1});if(t)console.warn("Failed to load contracts:",t.message),Ie=[];else{const o=Number(p.corp_reputation??0);Ie=(e||[]).filter(n=>o>=(n.min_reputation||0))}const a=[...new Set(Ie.map(o=>o.nation_id).filter(Boolean))].filter(o=>!Yt[o]);if(a.length>0){const{data:o}=await _.from("nations").select("id, name").in("id",a);for(const n of o||[])Yt[n.id]=n.name}if(We={},p&&Ie.length>0){const o=Ie.map(l=>l.id),{data:n}=await _.from("contract_bids").select("contract_id, bid_price, estimated_quality, status").eq("faction_id",p.id).in("contract_id",o);for(const l of n||[])We[l.contract_id]=l}Wi()}function Ja(){const e=document.getElementById("ap-list"),t=document.getElementById("ap-footer");if(document.getElementById("ap-count").textContent=W.length+" ACTIVE",W.length===0){e.innerHTML=`<div class="ap-empty">
            <div class="ap-empty__text">No active projects.<br>Win a contract bid to start<br>your first construction project.</div>
        </div>`,t.style.display="none";return}const i=M?.current_tick||0;let a=0,o=0,n="";for(const l of W){const r=l.issuer_type==="GOVERNMENT",c=r?"gov":"private",d=Array.isArray(l.contract_bids)?l.contract_bids[0]:l.contract_bids,f=d?.bid_price||0,s=d?.estimated_cost||0,m=d?.estimated_quality||0,u=l.budget_ceiling||0,g=l.awarded_at_tick||i,b=l.stalled_ticks||0,v=Math.max(0,i-g),x=Math.max(0,v-b),$=l.timeline_ticks||8,h=Math.max(0,$-x),I=Math.min(100,Math.round(x/$*100)),C=x>$,w=b>0;let k="";if(w)if(l.status==="awarded"&&Array.isArray(l._missingPermits)&&l._missingPermits.length>0)k="Awaiting permits — apply via Permits → Apply: "+l._missingPermits.join(", ");else{const q=l.required_workforce||{},N=l.workers_assigned||{},P=[];(Number(N.general)||0)<(Number(q.general)||0)&&P.push("General: "+(Number(N.general)||0)+"/"+(Number(q.general)||0)),(Number(N.skilled)||0)<(Number(q.skilled)||0)&&P.push("Skilled: "+(Number(N.skilled)||0)+"/"+(Number(q.skilled)||0)),(Number(N.innovative)||0)<(Number(q.innovative)||0)&&P.push("Innovative: "+(Number(N.innovative)||0)+"/"+(Number(q.innovative)||0)),P.length>0?k="Workers needed — "+P.join(", "):k="Materials needed — allocate from warehouse"}Vi(l.sector);const S=pi(l.sector);a+=u,o+=f,n+=`<div class="ap-item" onclick="openProjectModal('${l.id}')">
            <div class="ap-item__row1">
                <div class="ap-item__info">
                    <div class="ap-item__name">${y(l.name)}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${y(l.issuer_name||"—")} · ${S}</div>
                </div>
                <span class="oc-item__type-badge ${c}">${r?"GOV":"PVT"}</span>
            </div>
            <div class="ap-budget">
                <div class="ap-budget__header">
                    <span class="ap-budget__label">PROGRESS${w?' <span style="color:var(--orange);font-weight:700;font-size:7px;">⚠ STALLED ('+b+" ticks) — "+y(k)+"</span>":""}</span>
                    <span class="ap-budget__values" style="color:${C?"var(--red)":w?"var(--orange)":"var(--teal)"}">
                        ${x}/${$} ticks ${C?'<span style="color:var(--red);font-weight:700;"> OVERDUE</span>':""}
                    </span>
                </div>
                <div class="ap-budget__bar">
                    <div class="ap-budget__fill" style="width:${I}%;background:${C?"var(--red)":w?"var(--orange)":"var(--teal)"}"></div>
                </div>
            </div>
            <div class="ap-details">
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">YOUR BID</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--gold)">${se(f)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">EST. COST</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:var(--red)">${se(s)}</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">QUALITY</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${m>=70?"var(--green)":m>=40?"var(--teal)":"var(--orange)"}">${m}/100</div>
                </div>
                <div class="ap-detail-cell" style="flex:1">
                    <div class="ap-detail-cell__label">REMAINING</div>
                    <div class="ap-detail-cell__value" style="font-size:10px;font-weight:700;color:${C?"var(--red)":"var(--text-bright)"}">${h} ticks</div>
                </div>
                <div class="ap-detail-cell" style="flex:0.7;text-align:center">
                    <div class="ap-detail-cell__label">INSURANCE</div>
                    ${l._hasInsurance?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--green);">INSURED</div>':l._insurancePending?'<div class="ap-detail-cell__value" style="font-size:8px;font-weight:700;color:var(--orange);">PENDING</div>':`<div class="ap-detail-cell__value" style="font-size:8px;cursor:pointer;color:#aa7a5a;font-weight:700;text-decoration:underline;" onclick="event.stopPropagation();requestInsurance('${l.id}',${u})">INSURE</div>`}
                </div>
            </div>
            ${x>=$?`<div style="padding:6px 10px;border-top:1px solid var(--border-0);">
                <button data-deliver-id="${l.id}" onclick="event.stopPropagation();deliverProject('${l.id}','${y(l.name).replace(/'/g,"\\'")}',${f},${s},${m})" style="width:100%;padding:8px;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1px;color:#000;background:var(--green);border:none;cursor:pointer;">DELIVER PROJECT</button>
            </div>`:""}
        </div>`}e.innerHTML=n,t.style.display=W.length>0?"":"none",W.length>0&&(document.getElementById("ap-total-crew").textContent=W.length,document.getElementById("ap-total-budget").textContent=se(a),document.getElementById("ap-total-spent").textContent=se(o))}async function ot(){if(!p)return;const{data:e,error:t}=await _.from("construction_contracts").select("*, contract_bids!inner(bid_price, material_grades, labor_count, estimated_cost, estimated_quality)").eq("awarded_to_faction",p.id).in("status",["awarded","in_progress"]).eq("contract_bids.faction_id",p.id).order("awarded_at_tick",{ascending:!0});if(t?(console.warn("Failed to load active projects:",t.message),W=[]):W=e||[],W.length>0){const a=W.map(c=>c.id),{data:o}=await _.from("finance_loan_requests").select("insured_contract_id, status").eq("request_type","insurance").in("insured_contract_id",a),{data:n}=await _.from("finance_active_loans").select("request_id, finance_loan_requests!inner(insured_contract_id)").in("status",["current"]).eq("finance_loan_requests.request_type","insurance"),l=new Set((n||[]).map(c=>c.finance_loan_requests?.insured_contract_id).filter(Boolean)),r=new Set((o||[]).filter(c=>c.status==="open").map(c=>c.insured_contract_id));for(const c of W)c._hasInsurance=l.has(c.id),c._insurancePending=r.has(c.id)}const i=W.filter(a=>a.status==="awarded"&&(a.stalled_ticks||0)>0);if(i.length>0){const a=await Promise.all(i.map(o=>_.rpc("get_project_permit_requirements",{p_contract_id:o.id,p_faction_id:p.id,p_nation_id:o.nation_id})));for(let o=0;o<i.length;o++){const n=Array.isArray(a[o].data)?a[o].data:[];i[o]._missingPermits=n.filter(l=>!l.has_permit).map(l=>l.permit_name||l.permit_key)}}Ja()}const $t=3e4;function wt(){let e=0,t=0;for(const i of tt)for(const a of ri){const o=Q[i.key]?.[a];o&&(e+=o.qty,t+=o.value)}return{totalUnits:e,totalValue:t}}function fi(){const e=document.getElementById("wh-list"),{totalUnits:t,totalValue:i}=wt();document.getElementById("wh-count").textContent=t.toLocaleString()+" UNITS",document.getElementById("wh-total-value").textContent=O(i);const a=Math.round(t/$t*100),o=document.getElementById("wh-capacity");o.textContent=a+"%",o.style.color=a>80?"var(--red)":a>50?"var(--orange)":"var(--green)";let n="";for(let l=0;l<tt.length;l++){const r=tt[l],c=Qt===l,d=Q[r.key]?.LOW||{qty:0,value:0},f=Q[r.key]?.STD||{qty:0,value:0},s=Q[r.key]?.HIGH||{qty:0,value:0},m=d.qty+f.qty+s.qty,u=d.value+f.value+s.value,g=m===0,b=fe(r.key,"LOW",L),v=fe(r.key,"STD",L),x=fe(r.key,"HIGH",L),$=d.qty>0?"wh-dot wh-dot--low":"wh-dot wh-dot--empty",h=f.qty>0?"wh-dot wh-dot--std":"wh-dot wh-dot--empty",I=x.available?s.qty>0?"wh-dot wh-dot--high":"wh-dot wh-dot--empty":"wh-dot wh-dot--locked";if(n+='<div class="wh-row">',n+=`<div class="wh-row__collapsed${c?" expanded":""}" onclick="toggleWhRow(${l})">
            <span class="wh-row__arrow">${c?"▾":"▸"}</span>
            <span class="wh-row__name${g?" empty":""}">${y(r.name)}</span>
            <div class="wh-row__dots">
                <div class="${$}"></div>
                <div class="${h}"></div>
                <div class="${I}"></div>
            </div>
            <span class="wh-row__qty${g?" empty":""}">${m>0?m.toLocaleString():"—"}</span>
            <span class="wh-row__val${g?" empty":""}">${u>0?O(u):"—"}</span>
        </div>`,c){n+='<div class="wh-expand">',n+=`<div class="wh-expand__hdr">
                <span class="wh-expand__hdr-label" style="flex:1">GRADE</span>
                <span class="wh-expand__hdr-label" style="width:50px;text-align:right">QTY</span>
                <span class="wh-expand__hdr-label" style="width:60px;text-align:right">VALUE</span>
                <span class="wh-expand__hdr-label" style="width:55px;text-align:right">$/UNIT</span>
            </div>`;const C=[{key:"LOW",label:"Low",data:d,avail:b,color:"var(--orange)",dotClass:"wh-dot--low"},{key:"STD",label:"Standard",data:f,avail:v,color:"var(--amber)",dotClass:"wh-dot--std"},{key:"HIGH",label:"High",data:s,avail:x,color:"var(--green)",dotClass:"wh-dot--high"}];for(const w of C){const k=!w.avail.available,S=w.data.qty>0,q=S?"$"+Math.round(w.data.value/w.data.qty):"—";n+=`<div class="wh-grade${k?" unavailable":""}">
                    <div class="wh-grade__label">
                        <div class="wh-dot ${w.dotClass}" style="width:5px;height:5px"></div>
                        <span class="wh-grade__name" style="color:${k?"var(--red)":w.color}">${w.label}</span>
                        ${k?'<span class="wh-grade__tag">UNAVAILABLE</span>':""}
                    </div>
                    <span class="wh-grade__qty" style="color:${S?"var(--text-bright)":"var(--text-dim)"}">${S?w.data.qty.toLocaleString():"—"}</span>
                    <span class="wh-grade__val" style="color:${w.data.value>0?"var(--text-muted)":"var(--text-dim)"}">${w.data.value>0?O(w.data.value):"—"}</span>
                    <span class="wh-grade__cpu">${q}</span>
                </div>`}for(const w of C)!w.avail.available&&w.avail.failedStat&&(n+=`<div class="wh-lock">
                        <span class="wh-lock__text">${w.label.toUpperCase()} GRADE LOCKED — ${y(w.avail.failedStat)} &lt; ${w.avail.failedMin}</span>
                    </div>`);n+="</div>"}n+="</div>"}e.innerHTML=n}function Xa(e){Qt=Qt===e?-1:e,fi()}async function mi(){if(!p)return;const{data:e,error:t}=await _.from("corp_warehouse").select("material_key, quality_tier, quantity, total_value").eq("faction_id",p.id);Q={};const i=[];if(t)console.warn("Failed to load warehouse:",t.message);else if(e){for(const a of e){const o=mt(a.material_key);Q[o]||(Q[o]={}),Q[o][a.quality_tier]={qty:a.quantity||0,value:Number(a.total_value)||0},o!==a.material_key&&i.push(a)}if(i.length>0){const a=i.map(o=>({faction_id:p.id,nation_id:p.nation_id,material_key:mt(o.material_key),quality_tier:o.quality_tier,quantity:o.quantity||0,total_value:Number(o.total_value)||0,updated_at:new Date().toISOString()}));await _.from("corp_warehouse").upsert(a,{onConflict:"faction_id,material_key,quality_tier"});for(const o of i)await _.from("corp_warehouse").delete().eq("faction_id",p.id).eq("material_key",o.material_key).eq("quality_tier",o.quality_tier)}}fi()}const Za={manufacturing_output:"base production",rare_minerals:"raw input",inflation:"price modifier",fuel_prices:"transport cost",urbanization:"demand pressure",arable_land:"base production",physical_infrastructure:"transport",digital_infrastructure:"component quality",energy_generation:"electrical supply",standard_of_living:"demand tier",oil_and_gas:"base input",higher_education:"engineering"};function vi(){const t=(Pe()?.name||L?.name||p?.nation||"—").toUpperCase(),i=!!(He&&L&&He.id!==L.id);document.getElementById("pr-nation-badge").textContent=(i?"IMPORT — ":"LOCAL — ")+t;const a=document.getElementById("pr-nation-select");if(a&&a.options.length===0){const c=L?.name||p?.nation||"—";let d=`<option value="">${y(c)} (HQ)</option>`;for(const f of Ye)f.id!==L?.id&&(d+=`<option value="${f.id}">${y(f.name)}</option>`);a.innerHTML=d}a&&(a.value=He?.id||"");const o=Number(p?.corp_cash_reserves)||0;document.getElementById("pr-cash").textContent=O(o);const{totalUnits:n}=wt(),l=Math.round(n/$t*100),r=document.getElementById("pr-wh-capacity");r.textContent=l+"%",r.style.color=l>80?"var(--red)":l>50?"var(--orange)":"var(--green)",Ki(),ui(),kt()}function Ki(){const e=Pe(),t=document.getElementById("pr-mat-grid");let i="";for(const a of tt){const o=X===a.key,n=ri.every(r=>!fe(a.key,r,e).available),l="pr-mat-btn"+(o?" active":"")+(n?" all-locked":"");i+=`<span class="${l}" onclick="setPrMat('${a.key}')">${y(a.name)}</span>`}t.innerHTML=i}function ui(){const e=Pe(),t=document.getElementById("pr-tier-bar");let i='<span class="pr-tier-label">GRADE</span>';for(const a of ri){const o=fe(X,a,e),n=F===a,l=o.available?li(X,a,e):null,r=Ui[a],c=!o.available,d="pr-tier-btn"+(n?" active":"")+(c?" locked":"");i+=`<div class="${d}" onclick="${c?"":`setPrTier('${a}')`}">
            <div class="pr-tier-btn__label">
                <div class="wh-dot" style="width:5px;height:5px;background:${r};border-radius:1px;"></div>
                <span class="pr-tier-btn__name" style="color:${n?"var(--text-bright)":"var(--text-dim)"}">${Vt[a]}</span>
            </div>
            ${l!==null?`<div class="pr-tier-btn__price" style="color:${n?"var(--text-bright)":"var(--text-muted)"}">$${l}<span style="font-size:7px;color:var(--text-dim)">/unit</span></div>`:'<div class="pr-tier-btn__locked-text">LOCKED</div>'}
        </div>`}t.innerHTML=i}function kt(){const e=Pe(),t=document.getElementById("pr-content"),i=fe(X,F,e),a=tt.find(w=>w.key===X);if(!a)return;if(!i.available){t.innerHTML=`<div class="pr-locked-panel">
            <div class="pr-locked-box">
                <div class="pr-locked-box__title">QUALITY TIER UNAVAILABLE</div>
                <div class="pr-locked-box__desc">
                    ${y(a.name)} — ${Vt[F]} grade
                    is not produced domestically in ${y(e?.name||"—")}.
                </div>
                <div class="pr-locked-box__reason">
                    ${y(i.failedStat||"unknown")} &lt; ${i.failedMin||"?"}
                </div>
                <div class="pr-locked-box__hint">
                    Import from a nation with sufficient capacity<br>or lobby for industrial development policy.
                </div>
            </div>
        </div>`;return}const o=li(X,F,e),n=ji(X,F,e),l=o*pe,r=n>3e3?"LOW":n>1e3?"MODERATE":"HIGH",c=r==="LOW"?"var(--green)":r==="MODERATE"?"var(--amber)":"var(--red)",d=Number(e?.inflation??50),f=d>55?"up":d<45?"down":"flat",s=f==="up"?"&#9650;":f==="down"?"&#9660;":"&#8212;",m=f==="up"?"var(--red)":f==="down"?"var(--green)":"var(--text-dim)";let u="";u+=`<div style="padding:8px 14px;border-bottom:1px solid var(--border-0);">
        <div class="pr-market-grid">
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">PRICE/UNIT</div>
                <div style="display:flex;align-items:baseline;gap:4px;margin-top:2px;">
                    <span class="pr-market-cell__value" style="font-size:16px;color:var(--text-bright)">$${o}</span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${m}">${s}</span>
                </div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">SUPPLY/TICK</div>
                <div class="pr-market-cell__value" style="font-size:14px;color:var(--text-bright);margin-top:2px;">${n.toLocaleString()}</div>
            </div>
            <div class="pr-market-cell">
                <div class="pr-market-cell__label">DEMAND</div>
                <div class="pr-market-cell__value" style="font-size:12px;color:${c};margin-top:2px;">${r}</div>
            </div>
        </div>
    </div>`,u+=`<div class="pr-drivers">
        <div class="pr-drivers__title">Price Drivers (${y(e?.name||"—")})</div>`;for(const w of a.priceDrivers){const k=Number(e?.[w]??50),S=k>=50?"var(--green)":k>=30?"var(--amber)":k>=15?"var(--orange)":"var(--red)",q=Za[w]||w;u+=`<div class="pr-driver-row">
            <span class="pr-driver-row__stat">${y(w)}</span>
            <div class="pr-driver-row__bar">
                <div class="pr-driver-row__fill" style="width:${k}%;background:${S}"></div>
            </div>
            <span class="pr-driver-row__val">${k}</span>
            <span class="pr-driver-row__effect">${y(q)}</span>
        </div>`}u+="</div>";const b=(Number(p?.corp_cash_reserves)||0)>=l,v=pe>n,{totalUnits:x}=wt(),$=$t-x,h=pe>$,I=$<=0,C=Ui[F];u+=`<div class="pr-order">
        <div class="pr-order__title">Purchase Order</div>
        <div class="pr-order__box">
            <div class="pr-order__header">
                <div style="display:flex;align-items:center;gap:6px;">
                    <span class="pr-order__mat-name">${y(a.name)}</span>
                    <div class="wh-dot" style="width:5px;height:5px;background:${C};border-radius:1px;"></div>
                    <span style="font-family:var(--font-mono);font-size:9px;color:${C}">${Vt[F]}</span>
                </div>
                <span class="pr-order__mat-price">$${o}/unit</span>
            </div>
            <div class="pr-qty-row">
                <span class="pr-qty-label">QTY</span>
                <div class="pr-qty-btns">
                    ${[100,250,500,1e3].map(w=>`<span class="pr-qty-btn${pe===w?" active":""}" onclick="setPrQty(${w})">${w>=1e3?w/1e3+"k":w}</span>`).join("")}
                </div>
            </div>
            ${v?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS AVAILABLE SUPPLY — max ${n.toLocaleString()} this tick</span>
            </div>`:""}
            ${I?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">WAREHOUSE FULL — no remaining capacity</span>
            </div>`:h?`<div class="pr-supply-warn">
                <span class="pr-supply-warn__text">EXCEEDS WAREHOUSE CAPACITY — ${$.toLocaleString()} units remaining</span>
            </div>`:""}
            <div class="pr-order__total">
                <div>
                    <div class="pr-order__total-label">TOTAL COST</div>
                    <div class="pr-order__total-value">${O(l)}</div>
                </div>
                <button class="pr-purchase-btn" onclick="purchaseMaterial()"
                    ${b&&!v&&!h&&!I?"":"disabled"}
                    title="${b?v?"Exceeds supply":I?"Warehouse full":h?"Exceeds warehouse capacity":"Purchase materials":"Insufficient cash"}"
                >PURCHASE</button>
            </div>
        </div>
    </div>`,t.innerHTML=u}function eo(e){const t=Pe();X=e,F="STD";for(const i of["STD","HIGH","LOW"])if(fe(e,i,t).available){F=i;break}Ki(),ui(),kt()}function to(e){F=e,ui(),kt()}function io(e){pe=e,kt()}let Rt=!1;async function ao(e){if(!e)He=null;else{let a=Ye.find(o=>o.id===e);if(!a)try{const{data:o}=await _.from("nations").select("*").eq("id",e).single();a=o}catch{}He=a||null}const t=Pe();if(!fe(X,F,t).available){F="STD";for(const a of["STD","HIGH","LOW"])if(fe(X,a,t).available){F=a;break}}const i=document.getElementById("pr-nation-select");i&&(i.value=e||""),vi()}async function oo(){if(Rt||!p||!L)return;const e=Pe(),t=li(X,F,e),i=ji(X,F,e),a=t*pe,o=Number(p.corp_cash_reserves)||0;if(a>o){alert("Insufficient cash reserves.");return}if(pe>i){alert("Exceeds available supply this tick.");return}const{totalUnits:n}=wt(),l=$t-n;if(l<=0){alert("Warehouse is full. Cannot purchase more materials.");return}if(pe>l){alert(`Warehouse can only hold ${l.toLocaleString()} more units. Reduce quantity.`);return}Rt=!0;const r=document.querySelector(".pr-purchase-btn");r&&(r.disabled=!0,r.textContent="...");try{const c=o-a,{error:d}=await _.from("factions").update({corp_cash_reserves:c}).eq("id",p.id);if(d)throw d;const f=mt(X),s=Q[f]?.[F],m=(s?.qty||0)+pe,u=(s?.value||0)+a,{error:g}=await _.from("corp_warehouse").upsert({faction_id:p.id,nation_id:p.nation_id,material_key:f,quality_tier:F,quantity:m,total_value:u,last_purchased_tick:M?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,material_key,quality_tier"});if(g){const{error:v}=await _.from("factions").update({corp_cash_reserves:o}).eq("id",p.id);throw v&&console.error("Cash refund failed after warehouse error:",v.message),g}p.corp_cash_reserves=c,Q[f]||(Q[f]={}),Q[f][F]={qty:m,value:u};const b=Math.floor(a/1e6);if(b>=1&&e?.id){const v=b*.01,{data:x,error:$}=await _.from("nations").select("gdp_growth").eq("id",e.id).single();if(!$&&x){const h=Math.min(100,Math.round((Number(x.gdp_growth??50)+v)*100)/100);await _.from("nations").update({gdp_growth:h}).eq("id",e.id),L?.id===e.id&&(L.gdp_growth=h)}}fi(),vi(),r&&(r.textContent="PURCHASED",setTimeout(()=>{r.isConnected&&(r.disabled=!1,r.textContent="PURCHASE")},1500))}catch(c){r&&(r.disabled=!1,r.textContent="PURCHASE"),alert("Purchase failed: "+(c.message||"Unknown error"))}finally{Rt=!1}}function Ji(e){const t=Re||L;if(!t)return[];const i=xt(e);if(!i)return[];const a=$a(e,t),o=[],n=Number(t?.inflation??50),l=Number(t?.fuel_prices??50);Number(t?.manufacturing_output??50);const r=Re&&L&&Re.id!==L.id;let c=null;if(r&&(c=wa(t,L)),a.newAvailable>0){const d=Mi(e,t),f=i.basePrice,s=Math.round(f*((n-50)/200)),m=Math.round(f*((l-50)/300));let u=d;const g=[{label:"Base price",value:O(f)},s!==0?{label:`Inflation (${n})`,mod:(s>=0?"+":"")+O(Math.abs(s))}:null,m!==0?{label:`Fuel transport (${l})`,mod:(m>=0?"+":"")+O(Math.abs(m))}:null].filter(Boolean),b=d-f-s-m;if(b!==0&&!r&&g.push({label:"Demand/scarcity",mod:(b>=0?"+":"")+O(Math.abs(b))}),r&&c){const v=Math.round(d*c.tariff),x=Math.round(d*c.transport);u=d+v+x,g.push({label:`Import tariff (${Math.round(c.tariff*100)}%)`,mod:"+"+O(v)}),g.push({label:`Transport (${c.deliveryTicks} tick${c.deliveryTicks>1?"s":""})`,mod:"+"+O(x)})}o.push({seller:r?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:r?c?.deliveryTicks||1:0,condition:100,price:Math.round(u),available:a.newAvailable,delivery:r?c.deliveryTicks+" tick"+(c.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:r?c.deliveryTicks:0,used:!1,priceFactors:g,sourceNationId:t.id})}if(a.usedAvailable>0){const d=a.usedCondition,f=Mi(e,t,{used:!0,condition:d});let s=f;const m=[{label:"Base price",value:O(i.basePrice)},{label:`Condition (${d}%)`,mod:"-"+O(Math.max(0,i.basePrice-f))}];if(r&&c){const u=Math.round(f*c.tariff),g=Math.round(f*c.transport);s=f+u+g,m.push({label:`Import tariff (${Math.round(c.tariff*100)}%)`,mod:"+"+O(u)}),m.push({label:`Transport (${c.deliveryTicks} tick${c.deliveryTicks>1?"s":""})`,mod:"+"+O(g)})}o.push({seller:r?`${t.name} Buyers`:"Local Buyers",sellerType:"LOCAL",nation:t.name||"—",distance:r?c?.deliveryTicks||1:0,condition:d,price:Math.round(s),available:a.usedAvailable,delivery:r?c.deliveryTicks+" tick"+(c.deliveryTicks>1?"s":""):"Immediate",deliveryTicks:r?c.deliveryTicks:0,used:!0,priceFactors:m,sourceNationId:t.id})}return o}function Et(){const e=Number(p?.corp_cash_reserves)||0;document.getElementById("em-cash").textContent=O(e);const t=xt(ne),i=it[t?.tier||1],a=document.getElementById("em-tier-badge");a&&(a.textContent=i.tag,a.style.color=i.color),a.style.background=i.color+"0a",a.style.border="1px solid "+i.color+"33";const o=document.getElementById("em-nation-select");if(o&&o.options.length===0){const r=L?.name||p?.nation||"—";let c=`<option value="">${y(r)} (HQ)</option>`;for(const d of Ye)d.id!==L?.id&&(c+=`<option value="${d.id}">${y(d.name)}</option>`);o.innerHTML=c}const n=document.getElementById("em-import-tag"),l=Re&&L&&Re.id!==L.id;n&&(n.style.display=l?"":"none"),no(),yi()}function no(){let e="";for(let t=1;t<=3;t++){const i=it[t],a=Wt(t),o=t===3?"em-selector__grid em-selector__grid--t3":"em-selector__grid em-selector__grid--t12";e+=`<div class="em-selector__row">
            <div class="em-selector__tier-label" style="color:${i.color}">${i.tag}</div>
            <div class="${o}">`;for(const n of a){const l=ne===n.key,r=Ji(n.key).length>0;e+=`<span class="em-selector__btn${l?" active":""}${r?"":" no-listings"}"
                style="${l?"background:"+i.color+";border-color:"+i.color:""}"
                onclick="setEmType('${n.key}')">${y(n.name)}</span>`}e+="</div></div>"}document.getElementById("em-selector").innerHTML=`<div class="em-selector">${e}</div>`}function yi(){const e=document.getElementById("em-content");if(Te=Ji(ne),Te.length===0){e.innerHTML=`<div class="em-no-listings"><div class="em-no-listings__box">
            <div class="em-no-listings__title">NO SELLERS AVAILABLE</div>
            <div class="em-no-listings__desc">No local buyers or corporations are currently selling this equipment. Check back next tick or expand search to other nations.</div>
        </div></div>`;return}ve>=Te.length&&(ve=0);let t="";for(let a=0;a<Te.length;a++){const o=Te[a],n=ve===a,l=o.sellerType==="LOCAL"?"var(--teal)":"#5a8aaa",r=Fi(o.condition);t+=`<div class="em-listing${n?" selected":""}" style="${n?"border-left-color:"+l:""}" onclick="setEmListing(${a})">`,t+=`<div class="em-listing__row1">
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
                ${o.priceFactors.map(c=>`<div class="em-breakdown__row">
                    <span class="em-breakdown__label">${y(c.label)}</span>
                    <span class="em-breakdown__mod" style="color:${c.mod?c.mod.startsWith("-")?"var(--green)":c.mod==="$0"?"var(--text-dim)":"var(--red)":"var(--text-bright)"}">${c.mod||c.value}</span>
                </div>`).join("")}
            </div>`),t+="</div>"}const i=Te[ve];if(i){const a=xt(ne),o=it[a?.tier||1],n=Math.min(i.available,4),l=i.price*_e,r=(Number(p?.corp_cash_reserves)||0)>=l;t+=`<div class="em-purchase"><div class="em-purchase__box">
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
                    ${Array.from({length:n},(c,d)=>d+1).map(c=>`<span class="em-qty-btn${_e===c?" active":""}" style="${_e===c?"background:"+o.color+";border-color:"+o.color:""}" onclick="setEmQty(${c})">${c}</span>`).join("")}
                </div>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:auto">max ${i.available}</span>
            </div>
            <div class="em-purchase__total">
                <div>
                    <div class="em-purchase__total-label">TOTAL COST</div>
                    <div class="em-purchase__total-value">${O(l)}</div>
                    ${i.delivery!=="Immediate"?`<div class="em-purchase__delivery-warn">Delivery: ${y(i.delivery)}</div>`:""}
                </div>
                <button class="em-purchase-btn" style="background:${o.color}" onclick="purchaseEquipment()"
                    ${r?"":"disabled"}
                    title="${r?"Purchase equipment":"Insufficient cash"}">PURCHASE</button>
            </div>
        </div></div>`}e.innerHTML=t}async function so(e){if(!e)Re=null;else{let i=Ye.find(a=>a.id===e);if(!i)try{const{data:a}=await _.from("nations").select("*").eq("id",e).single();i=a}catch{}Re=i||null}ve=0,_e=1;const t=document.getElementById("em-nation-select");t&&(t.value=e||""),Et()}function ro(e){ne=e,ve=0,_e=1,Et()}function lo(e){ve=e,_e=1,yi()}function co(e){_e=e,yi()}let Lt=!1;async function po(){if(Lt)return;const e=Te[ve];if(!e||!p)return;const t=xt(ne);if(!t)return;const i=_e,a=e.price*i,o=Number(p.corp_cash_reserves)||0;if(a>o){alert("Insufficient cash reserves.");return}if(i>e.available){alert("Not enough units available.");return}const n=document.querySelector(".em-purchase-btn");n&&(n.disabled=!0,n.textContent="..."),Lt=!0;try{const l=o-a,{error:r}=await _.from("factions").update({corp_cash_reserves:l}).eq("id",p.id);if(r)throw r;const c=!e.deliveryTicks||e.deliveryTicks===0;if(c){const f=te.find(h=>h.equipment_key===ne),s=(f?.owned||0)+i,m=f?.purchase_price_avg||0,u=f?.owned||0,g=u>0?Math.round((m*u+e.price*i)/s):e.price,b=t.maintenancePerUnit*s,v=f?.condition||100,x=Math.round((v*u+e.condition*i)/s),{error:$}=await _.from("corp_equipment").upsert({faction_id:p.id,nation_id:p.nation_id,equipment_key:ne,tier:t.tier,owned:s,deployed:f?.deployed||0,condition:x,maintenance_per_tick:b,purchase_price_avg:g,last_purchased_tick:M?.current_tick||null,updated_at:new Date().toISOString()},{onConflict:"faction_id,equipment_key"});if($){const{error:h}=await _.from("factions").update({corp_cash_reserves:o}).eq("id",p.id);throw h&&console.error("Cash refund failed:",h.message),$}f?(f.owned=s,f.condition=x,f.maintenance_per_tick=b):te.push({equipment_key:ne,tier:t.tier,owned:s,deployed:0,condition:x,maintenance_per_tick:b,assigned_projects:[]})}else{const f=(M?.current_tick||0)+e.deliveryTicks,{error:s}=await _.from("corp_equipment_deliveries").insert({faction_id:p.id,equipment_key:ne,quantity:i,condition:e.condition,delivery_tick:f,source_nation_id:e.sourceNationId||null,seller_name:e.seller,price_paid:a});if(s){const{error:m}=await _.from("factions").update({corp_cash_reserves:o}).eq("id",p.id);throw m&&console.error("Cash refund failed:",m.message),s}}p.corp_cash_reserves=l,wi(),Et();const d=document.getElementById("pr-cash");d&&(d.textContent=O(l)),n&&(n.textContent=c?"PURCHASED":"ORDERED",setTimeout(()=>{n.isConnected&&(n.disabled=!1,n.textContent="PURCHASE")},1500))}catch(l){n&&(n.disabled=!1,n.textContent="PURCHASE"),alert("Purchase failed: "+(l.message||"Unknown error"))}finally{Lt=!1}}let fo=-1,Ue=[],_t=[],ti=[];function zt(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function mo(e,t,i){if(i)return"var(--orange)";const a=e/(t||1)*100;return a>50?"var(--green)":a>25?"var(--amber)":"var(--red)"}function Pi(){const e=document.getElementById("pm-list"),t=Ue.length,i=_t.length,a=ti.length,o=Ue.filter(c=>c.expiring_soon).length;document.getElementById("pm-active-count").textContent=`(${t})`,document.getElementById("pm-pending-count").textContent=`(${i})`,document.getElementById("pm-apply-count").textContent=`(${a})`;const n=document.getElementById("pm-badges");let l="";o>0&&(l+=`<span class="pm-badge pm-badge--expiring">${o} EXPIRING</span>`),i>0&&(l+=`<span class="pm-badge pm-badge--pending">${i} PENDING</span>`),n.innerHTML=l;const r=Ue.reduce((c,d)=>c+(d.cost||0),0)+_t.reduce((c,d)=>c+(d.cost||0),0);document.getElementById("pm-total-cost").textContent=zt(r),document.getElementById("pm-footer-active").textContent=t,document.getElementById("pm-footer-pending").textContent=i;{if(t===0){e.innerHTML=`<div class="pm-empty">
                <div class="pm-empty__text">No active permits.<br>Permits are required by government<br>policy before starting certain projects.<br>Check the Apply tab for available permits.</div>
            </div>`;return}let c="";Ue.forEach((d,f)=>{const s=fo===f,m=mo(d.ticks_left,d.total_ticks,d.expiring_soon),u=Math.min(d.ticks_left/(d.total_ticks||1)*100,100);c+=`<div class="pm-item ${d.expiring_soon?"pm-item--expiring":""} ${s?"expanded":""}" onclick="togglePmExpand(${f})">
                <div class="pm-item__inner">
                    <div class="pm-item__row1">
                        <span class="pm-item__name">${y(d.name)}</span>
                        <span class="pm-item__status pm-item__status--active">ACTIVE</span>
                    </div>
                    <div class="pm-item__row2">
                        <span class="pm-nation-tag">${y((d.nation||"").toUpperCase())}</span>
                        <span class="pm-item__expiry" style="color:${m}">Expires: ${y(d.expires||"")}</span>
                        <span class="pm-item__ticks">(${d.ticks_left} ticks)</span>
                    </div>
                    <div class="pm-bar"><div class="pm-bar__fill" style="width:${u}%;background:${m}"></div></div>`,s&&(c+=`<div class="pm-detail">
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">SOURCE POLICY</span>
                        <span class="pm-detail__val">${y(d.policy||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">ISSUED</span>
                        <span class="pm-detail__val">${y(d.issued||"")}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">COST</span>
                        <span class="pm-detail__val">${zt(d.cost||0)}</span>
                    </div>
                    <div class="pm-detail__row">
                        <span class="pm-detail__key">RENEWABLE</span>
                        <span class="pm-detail__val ${d.renewable?"pm-detail__val--green":"pm-detail__val--red"}">${d.renewable?"YES":"NO"}</span>
                    </div>
                    <div class="pm-projects">
                        <div class="pm-projects__label">COVERS PROJECTS</div>
                        <div class="pm-projects__list">${(d.projects||[]).map(g=>`<span class="pm-project-chip">${y(g)}</span>`).join("")}</div>
                    </div>`,d.note&&(c+=`<div class="pm-note"><span class="pm-note__text">${y(d.note)}</span></div>`),d.expiring_soon&&d.renewable&&(c+=`<div class="pm-btn-row"><button class="pm-btn pm-btn--renew" onclick="event.stopPropagation(); pmApplyForPermit('${d.permit_key}');">RENEW — ${zt(d.cost||0)}</button></div>`),c+="</div>"),c+="</div></div>"}),e.innerHTML=c;return}}let Ot=!1;async function vo(e){if(!(Ot||!p||!L)){Ot=!0;try{const{data:t}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),i=t?.current_tick||0,{data:a,error:o}=await _.rpc("apply_for_permit",{p_faction_id:p.id,p_nation_id:L.id,p_permit_key:e,p_current_tick:i});if(o){alert("Application failed: "+o.message);return}if(a&&!a.success){alert(a.error||"Application failed");return}alert("Permit application submitted! Processing: "+(a.processing_ticks||0)+" ticks."),await Xi()}catch(t){alert("Error: "+t.message)}finally{Ot=!1}}}window.pmApplyForPermit=vo;async function Xi(){if(!p||!L){Ue=[],_t=[],ti=[],Pi();return}const{data:e}=await _.from("construction_permits").select("*"),t=e||[],i={};for(const s of t)i[s.permit_key]=s;const{data:a}=await _.from("corp_permits").select("*").eq("faction_id",p.id).eq("nation_id",L.id),o=a||[],{data:n}=await _.from("active_laws").select("policy_id, policies(permit_key, policy_name)").eq("nation_id",L.id).not("policies.permit_key","is",null),l=new Set,r={};for(const s of n||[])s.policies?.permit_key&&(l.add(s.policies.permit_key),r[s.policies.permit_key]=s.policies.policy_name);const{data:c}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),d=c?.current_tick||0;Ue=o.filter(s=>s.status==="active").map(s=>{const m=i[s.permit_key]||{},u=s.expires_at_tick?Math.max(0,s.expires_at_tick-d):999,g=m.duration_ticks||24;return{name:m.name||s.permit_key,permit_key:s.permit_key,nation:L.name,policy:r[s.permit_key]||"—",issued:s.granted_at_tick!=null?Ne(s.granted_at_tick):"—",expires:s.expires_at_tick?Ne(s.expires_at_tick):"Single-use",cost:s.cost_paid||0,ticks_left:u,total_ticks:g,expiring_soon:u<=3&&u>0,renewable:m.duration_ticks!=null,projects:[]}}),_t=o.filter(s=>s.status==="pending").map(s=>{const m=i[s.permit_key]||{},u=m.processing_ticks||2,g=d-s.applied_at_tick,b=Math.max(0,u-g);return{name:m.name||s.permit_key,permit_key:s.permit_key,nation:L.name,applied:Ne(s.applied_at_tick),status:"PROCESSING",processing_total:u,ticks_remaining:b,est_approval:Ne(s.applied_at_tick+u),cost:s.cost_paid||0,required_by:r[s.permit_key]||"—"}});const f=new Set(o.filter(s=>s.status==="active"||s.status==="pending").map(s=>s.permit_key));ti=[...l].filter(s=>!f.has(s)).map(s=>{const m=i[s]||{};return{name:m.name||s,permit_key:s,nation:L.name,description:m.description||"",policy:r[s]||"—",cost:m.cost_is_percentage?15e4:m.cost||0,processing_time:m.processing_ticks||2,duration:m.duration_ticks?m.duration_ticks+" ticks":"Single-use",category:m.category||"",difficulty:m.difficulty||"EASY"}}),Pi()}let Ae=[],ii=-1;function uo(e){ii=ii===e?-1:e,ai()}function me(e){return Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(2)+"M":Math.abs(e)>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+e.toLocaleString()}function Bi(e){return e>=85?"var(--gold)":e>=60?"var(--green)":e>=40?"var(--orange)":"var(--red)"}function yo(e){return"dl-result--"+e.toLowerCase()}function ai(){const e=document.getElementById("dl-list"),t=Ae.length;document.getElementById("dl-count").textContent=`${t} COMPLETED`;const i=Ae.reduce((r,c)=>{const d=c.financials||{};return r+((d.payment||0)+(d.bonus||0)-(d.penalty||0)-(d.total_cost||0))},0),a=document.getElementById("dl-lifetime-profit");a.textContent=(i>=0?"+":"")+me(i),a.style.color=i>=0?"var(--green)":"var(--red)";const o={};Ae.forEach(r=>{o[r.result]=(o[r.result]||0)+1});const n=document.getElementById("dl-footer-results");if(n.innerHTML=Object.entries(o).map(([r,c])=>`<div class="dl-footer__result-box">
            <div class="dl-footer__result-label" style="color:${{DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[r]||"var(--text-dim)"}">${y(r)}</div>
            <div class="dl-footer__result-count">${c}</div>
        </div>`).join(""),t===0){e.innerHTML=`<div class="dl-empty">
            <div class="dl-empty__text">No completed deliveries.<br>Finish a construction project to<br>receive an inspection report and<br>collect payment.</div>
        </div>`;return}let l="";Ae.forEach((r,c)=>{const d=ii===c,f=r.financials||{},s=(f.payment||0)+(f.bonus||0)-(f.penalty||0)-(f.total_cost||0),m=s>=0,u=yo(r.result),b={DISTINCTION:"var(--gold)",PASS:"var(--green)",CONDITIONAL:"var(--orange)",FAIL:"var(--red)"}[r.result]||"var(--text-dim)",v=r.type==="GOVERNMENT";if(l+=`<div class="dl-item ${d?"expanded":""}" onclick="toggleDlExpand(${c})">
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
                            <span class="dl-summary-value" style="color:${Bi(r.quality_score)}">${r.quality_score}</span>
                            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/100</span>
                        </div>
                    </div>
                    <div class="dl-summary-cell" style="flex:0.7;text-align:center;">
                        <div class="dl-summary-label">REP</div>
                        <div class="dl-summary-value" style="color:${r.rep_change>0?"var(--green)":r.rep_change<0?"var(--red)":"var(--text-dim)"};margin-top:2px;">${r.rep_change>0?"+":""}${r.rep_change||"±0"}</div>
                    </div>
                    <div class="dl-summary-cell" style="flex:1.3;">
                        <div class="dl-summary-label">${m?"PROFIT":"LOSS"}</div>
                        <div class="dl-summary-value" style="color:${m?"var(--green)":"var(--red)"};margin-top:2px;">${m?"+":""}${me(s)}</div>
                    </div>
                </div>`,d){const x=r.inspection||{};l+='<div style="margin-top:8px;">',l+='<div class="dl-section-label">Inspection Report</div>',["materials","structural","systems"].forEach(C=>{const w=x[C]||{score:0,issues:[]},k=Bi(w.score),S=Math.min(w.score/100*100,100);l+=`<div class="dl-inspect-row">
                    <div class="dl-inspect-row__header">
                        <span class="dl-inspect-row__label">${y(C.charAt(0).toUpperCase()+C.slice(1))}</span>
                        <div class="dl-inspect-row__score-area">
                            <div class="dl-inspect-bar"><div class="dl-inspect-bar__fill" style="width:${S}%;background:${k}"></div></div>
                            <span class="dl-inspect-row__score" style="color:${k}">${w.score}</span>
                        </div>
                    </div>
                    ${(w.issues||[]).map(q=>`<div class="dl-inspect-issue">${y(q)}</div>`).join("")}
                </div>`});const $=x.permits||{passed:!0,issues:[]};l+=`<div class="dl-permits-row ${$.passed?"dl-permits-row--pass":"dl-permits-row--fail"}">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Permits</span>
                    <span class="dl-permits-status" style="color:${$.passed?"var(--green)":"var(--red)"}">${$.passed?"✓ COMPLIANT":"✗ VIOLATION"}</span>
                </div>
                ${($.issues||[]).map(C=>`<div class="dl-inspect-issue dl-inspect-issue--red">${y(C)}</div>`).join("")}
            </div>`,l+='<div class="dl-section-label" style="margin-top:8px;">Material Quality Impact</div>',l+='<div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:8px;">',(r.materials_used||[]).forEach(C=>{const w=C.grade==="HIGH"?"var(--green)":C.grade==="STANDARD"?"var(--amber)":"var(--orange)",k=C.impact==="positive"?"▲":C.impact==="negative"?"▼":"–",S=C.impact==="positive"?"var(--green)":C.impact==="negative"?"var(--red)":"var(--text-dim)";l+=`<div class="dl-mat-tag">
                    <span class="dl-mat-tag__name">${y(C.name)}</span>
                    <div class="dl-mat-tag__dot" style="background:${w}"></div>
                    <span class="dl-mat-tag__grade" style="color:${w}">${y(C.grade)}</span>
                    <span class="dl-mat-tag__impact" style="color:${S}">${k}</span>
                </div>`}),l+="</div>",l+='<div class="dl-section-label">Financial Summary</div>',l+='<div class="dl-fin-panel">',l+=`<div class="dl-fin-row"><span class="dl-fin-key">CONTRACT VALUE</span><span class="dl-fin-val">${me(f.contract_value||0)}</span></div>`,(f.bonus||0)>0&&(l+=`<div class="dl-fin-row"><span class="dl-fin-key">QUALITY BONUS</span><span class="dl-fin-val" style="color:var(--green)">+${me(f.bonus)}</span></div>`),(f.penalty||0)>0&&(l+=`<div class="dl-fin-row"><span class="dl-fin-key">PENALTIES</span><span class="dl-fin-val" style="color:var(--red)">-${me(f.penalty)}</span></div>`);const h=(f.payment||0)+(f.bonus||0)-(f.penalty||0);l+=`<div class="dl-fin-row"><span class="dl-fin-key">PAYMENT RECEIVED</span><span class="dl-fin-val" style="color:var(--green)">${me(h)}</span></div>`,l+=`<div class="dl-fin-row"><span class="dl-fin-key">TOTAL COST</span><span class="dl-fin-val" style="color:var(--red)">-${me(f.total_cost||0)}</span></div>`,l+=`<div class="dl-fin-total">
                <span class="dl-fin-total__label">${m?"NET PROFIT":"NET LOSS"}</span>
                <span class="dl-fin-total__value" style="color:${m?"var(--green)":"var(--red)"}">${m?"+":""}${me(s)}</span>
            </div>`,l+="</div>";const I=r.timeline||{};l+=`<div class="dl-timeline">
                <span class="dl-timeline__label">TIMELINE</span>
                <span class="dl-timeline__ticks">${I.actual||0}/${I.expected||0} ticks</span>`,I.early?l+=`<span class="dl-timeline__badge dl-timeline__badge--early">${(I.expected||0)-(I.actual||0)} TICK${I.expected-I.actual!==1?"S":""} EARLY</span>`:!I.on_time&&I.actual>I.expected&&(l+=`<span class="dl-timeline__badge dl-timeline__badge--late">${(I.actual||0)-(I.expected||0)} TICK${I.actual-I.expected!==1?"S":""} LATE</span>`),l+="</div>",l+="</div>"}l+="</div></div>"}),e.innerHTML=l}let Ge=!1,Pt=!1;function Zi(e){return Math.abs(e)>=1e9?"$"+(e/1e9).toFixed(1)+"B":Math.abs(e)>=1e6?"$"+(e/1e6).toFixed(1)+"M":Math.abs(e)>=1e3?"$"+Math.round(e/1e3)+"k":"$"+Math.round(e)}async function _i(){var{data:e,error:t}=await _.from("factions").select("*").eq("id",p.id).single();if(t){console.warn("Faction refresh failed:",t.message);return}e&&(p=e);var i=document.getElementById("topbar-cash");i&&(i.textContent="CASH: "+Zi(Number(p.corp_cash_reserves??0)))}const oi={CRITICAL:"#c55",HIGH:"#5c5",MODERATE:"#ca5",LOW:"#6a6660"};let ue=[],gi=[],ea="ready",Xe=null,ye="ORGANIC",K=-1;const Di={COASTAL:{color:"#8b9a6b",label:"COASTAL"},INTERNATIONAL:{color:"#5a8aaa",label:"INTL"},GOVERNMENT:{color:"#c8a832",label:"GOV CONTRACT"}};function ta(e){const t=e==="COASTAL"?"ORGANIC":e==="INTERNATIONAL"?"AGREEMENT":e;ye=t,K=-1,document.querySelectorAll(".ar-pill").forEach(i=>{const a=i.getAttribute("data-ar-filter"),o=a==="COASTAL"?"ORGANIC":a==="INTERNATIONAL"?"AGREEMENT":a;i.className="ar-pill"+(o===t?" active-"+(t==="ORGANIC"?"coastal":t==="AGREEMENT"?"intl":t==="GOVERNMENT"?"gov":"all"):"")}),hi()}function bi(){return ye==="GOVERNMENT"?ue.filter(e=>e.scope==="GOVERNMENT"):ye==="AGREEMENT"?ue.filter(e=>e.scope!=="GOVERNMENT"&&!!e.trade_agreement_id):ye==="ORGANIC"?ue.filter(e=>e.scope!=="GOVERNMENT"&&!e.trade_agreement_id):ue}function _o(){const e=String(p?.shipping_route_focus||p?.shipping_focus||p?.corp_strategy||"").toLowerCase();return e.includes("agreement")?"AGREEMENT":e.includes("government")||e.includes("gov")?"GOVERNMENT":"ORGANIC"}async function xi(){if(!p||p.corp_sector!=="Shipping")return;const e=await Ea(_,p.id,p.corp_subsector);ue=e.routes,gi=e.applications,ea=e.state,Xe=e.error,Xe&&console.warn("Failed to load available routes:",Xe.message),ta(_o()),K=-1,hi()}var go={fuel_energy:[{stat:"industrialization",label:"Industrialization"},{stat:"urbanization",label:"Urbanization"}],minerals:[{stat:"industrialization",label:"Industrialization"},{stat:"manufacturing",label:"Manufacturing"}],grains_staples:[{stat:"population_growth",label:"Population Growth"},{stat:"food_security",label:"Food Security"}],livestock_dairy:[{stat:"standard_of_living",label:"Std of Living"},{stat:"food_security",label:"Food Security"}],cash_crops:[{stat:"trade_balance",label:"Trade Balance"},{stat:"foreign_investment",label:"Foreign Investment"}],manufactured_goods:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],technology:[{stat:"technology",label:"Technology"},{stat:"higher_education",label:"Higher Education"}],fruits_vegetables:[{stat:"standard_of_living",label:"Std of Living"},{stat:"urbanization",label:"Urbanization"}],arms:[{stat:"military_spending",label:"Military Spending"},{stat:"stability",label:"Stability"}]};function bo(e){return go[e]||[]}function xo(e){var t=Number(e.competition_count||0),i=e.demand_level||"",a=e.scope==="GOVERNMENT";return a?"Fixed payment. No demand risk. Vessel locked for contract duration.":t===0&&i==="CRITICAL"?"Unserved critical corridor. High volume, no competition — claim immediately.":t===0&&i==="HIGH"?"Virgin route with strong demand. First-mover advantage available.":t===0?"No competition on this route. Market share starts at 100%.":i==="CRITICAL"&&t<=2?"Underserved critical route. Demand exceeds current capacity.":i==="LOW"?"Thin route. Revenue may not justify vessel deployment.":t>=3?"Crowded route. Market share will be split "+(t+1)+" ways.":Number(e.tariff_rate||0)>15?"High tariff rate cuts into margins. Watch for trade policy changes.":null}function hi(){const e=bi();document.getElementById("ar-count").textContent=ue.length+" ROUTES";var t={ORGANIC:0,AGREEMENT:0,GOVERNMENT:0};ue.forEach(function(b){b.scope==="GOVERNMENT"?t.GOVERNMENT++:b.trade_agreement_id?t.AGREEMENT++:t.ORGANIC++}),document.getElementById("ar-footer-counts").innerHTML='<div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#8b9a6b"></div><span class="ar-footer__count-label">ORGANIC</span><span class="ar-footer__count-num">'+t.ORGANIC+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#5a8aaa"></div><span class="ar-footer__count-label">AGREEMENT</span><span class="ar-footer__count-num">'+t.AGREEMENT+'</span></div><div class="ar-footer__count"><div class="ar-footer__count-dot" style="background:#c8a832"></div><span class="ar-footer__count-label">GOV</span><span class="ar-footer__count-num">'+t.GOVERNMENT+"</span></div>";const i=document.getElementById("ar-claim-btn");i.className="ar-claim-btn"+(K>=0?" active":"");const a=document.getElementById("ar-list");if(ea==="error"){a.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+y(Xe&&Xe.message||"Shipping routes are temporarily unavailable.")+"</div></div>";return}var o=ye==="ORGANIC"?"organic":ye==="AGREEMENT"?"agreement-backed":ye==="GOVERNMENT"?"government":ye.toLowerCase();if(e.length===0){a.innerHTML='<div class="ar-empty"><div class="ar-empty__text">'+(ue.length===0?"No routes available.<br>Routes are generated from bilateral<br>trade each tick. Check back after<br>the next corp tick fires.":"No "+o+" routes available.")+"</div></div>";return}let n="";for(let b=0;b<e.length;b++){const v=e[b],x=K===b,$=Di[v.scope]||Di.INTERNATIONAL,h=v.scope==="GOVERNMENT",I=v.demand_level&&oi[v.demand_level]?{color:oi[v.demand_level],label:v.demand_level}:null,C=Number(v.competition_count||0),w=C===0?"#5c5":C<=2?"#ca5":"#c84";n+='<div style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid '+(x?$.color:"transparent")+";background:"+(x?$.color+"08":"transparent")+';" onclick="arSelectRoute('+b+')"><div style="padding:8px 14px;">',n+='<div style="display:flex;align-items:center;gap:0;margin-bottom:4px;"><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+y(v.origin_port||"?")+'</span><div style="flex:1;display:flex;align-items:center;margin:0 8px;"><div style="flex:1;height:1px;background:'+$.color+'44"></div><span style="font-family:var(--font-mono);font-size:7px;color:'+$.color+';padding:0 6px">⚓</span><div style="flex:1;height:1px;background:'+$.color+'44"></div></div><span style="font-size:12px;font-weight:700;color:var(--text-bright)">'+y(v.destination_port||"?")+"</span></div>",n+='<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;"><span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+$.color+";background:"+$.color+"12;border:1px solid "+$.color+'25">'+$.label+"</span>",I&&(n+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+I.color+";background:"+I.color+"12;border:1px solid "+I.color+'25">'+I.label+" DEMAND</span>"),h&&v.gov_issuer&&(n+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#c8a832;background:rgba(200,168,50,0.08);border:1px solid rgba(200,168,50,0.2)">'+y(v.gov_issuer)+"</span>"),C===0&&!h&&(n+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:#5c5;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15)">NO COMPETITION</span>');var l=gi.find(function(k){return k.route_id===v.id});if(l){var r=l.status==="approved"?"#5c5":"#c8a832",c=l.status==="approved"?"APPROVED":"APPLIED";n+='<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 5px;line-height:11px;color:'+r+";background:"+r+"12;border:1px solid "+r+'25">'+c+"</span>"}if(n+='<span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-left:auto">'+(v.transit_ticks||"?")+" tick"+((v.transit_ticks||0)!==1?"s":"")+" · "+y(v.vessel_class||"?")+"</span>",n+="</div>",n+='<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">',h?(n+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(v.gov_contract_duration||v.transit_ticks||"?")+" ticks</div></div>",n+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VESSEL</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+y(v.vessel_class||"?")+"</div></div>",n+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">CONTRACT VALUE</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#c8a832;margin-top:1px">'+O(Number(v.display_contract_value||v.gov_contract_value||v.estimated_revenue||0))+"</div></div>"):(n+='<div style="flex:1;padding:3px 8px;border-right:1px solid var(--border-0)"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">VOLUME</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);margin-top:1px">'+O(Number(v.trade_volume||0))+"</div></div>",n+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">COMP.</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:'+w+';margin-top:1px">'+C+"</div></div>",n+='<div style="flex:0.6;padding:3px 8px;border-right:1px solid var(--border-0);text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">TRANSIT</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px">'+(v.transit_ticks||"?")+" tick"+((v.transit_ticks||0)!==1?"s":"")+"</div></div>",n+='<div style="flex:1;padding:3px 8px;text-align:right"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px">EST. REV</div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#5c5;margin-top:1px">'+O(Number(v.estimated_revenue||0))+"</div></div>"),n+="</div>",x){if(n+='<div style="margin-top:6px;">',h&&v.goods_description&&(n+='<div style="font-size:10px;color:var(--text-muted);line-height:1.5;margin-bottom:6px">'+y(v.goods_description)+"</div>"),v.trade_agreement_name&&(n+='<div style="padding:4px 8px;margin-bottom:5px;background:rgba(90,138,170,0.05);border:1px solid rgba(90,138,170,0.12)"><div style="display:flex;justify-content:space-between;align-items:center"><div><div style="font-family:var(--font-mono);font-size:7px;color:#5a8aaa;letter-spacing:0.5px">TRADE AGREEMENT</div><div style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted);margin-top:1px">'+y(v.trade_agreement_name)+'</div></div><div style="text-align:right"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">TARIFF</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(Number(v.tariff_rate||0)>10?"#c84":"#5c5")+'">'+Number(v.tariff_rate||0).toFixed(1)+"%</div></div></div></div>"),n+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px">',n+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VESSEL CLASS</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+y(v.vessel_class||"?")+"</span></div>",v.vessel_note&&(n+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">REQUIREMENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+y(v.vessel_note)+"</span></div>"),n+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">PROXIMITY</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+(v.proximity!=null?v.proximity:"?")+" / 100</span></div>",n+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CARGO</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+y(v.goods_name||"Unknown")+"</span></div>",v.goods_description&&!h&&(n+='<div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0)"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">CONTENTS</span><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);text-align:right;max-width:200px">'+y(v.goods_description)+"</span></div>"),n+='<div style="display:flex;justify-content:space-between;padding:2px 0"><span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim)">VOLUME</span><span style="font-family:var(--font-mono);font-size:9px;color:var(--text-muted)">'+Number(v.volume_physical||0).toLocaleString()+" "+y(v.volume_unit||"tons")+"</span></div>",n+="</div>",L&&!h){var d=bo(v.trade_sector);if(d.length>0){n+='<div style="background:var(--bg-0);border:1px solid var(--border-0);padding:4px 8px;margin-bottom:5px"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.8px;margin-bottom:3px">DEMAND DRIVERS</div>';for(var f=0;f<d.length;f++){var s=d[f],m=Number(L[s.stat]??50),u=m>=50?"#5c5":m>=30?"#ca5":"#c84";n+='<div style="display:flex;align-items:center;gap:6px;padding:2px 0"><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-muted);width:100px">'+y(s.label)+'</span><div style="width:40px;height:2px;background:var(--border-0)"><div style="width:'+m+"%;height:100%;background:"+u+'"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-bright)">'+Math.round(m)+"</span></div>"}n+="</div>"}}var g=xo(v);g&&(n+='<div style="padding:4px 8px;background:'+$.color+"08;border:1px solid "+$.color+'15"><div style="font-size:9px;color:var(--text-muted);line-height:1.5">'+y(g)+"</div></div>"),n+="</div>"}n+="</div></div>"}a.innerHTML=n}function ho(e){K=K===e?-1:e,hi()}async function $o(){if(!(Ge||K<0||!p||!M)){var e=bi(),t=e[K];if(t){var i=gi.find(function(g){return g.route_id===t.id});if(i){alert("You have already applied for this route. Status: "+i.status);return}var a={"Bulk Cargo":"bulk_cargo","Container Freight":"container_freight","Specialized Transport":"specialized_transport"},o=a[p.corp_subsector]||"";if(t.shipping_subsector&&o!==t.shipping_subsector){var n=t.shipping_subsector.replace(/_/g," ").replace(/\b\w/g,function(g){return g.toUpperCase()});alert("Your fleet specializes in "+(p.corp_subsector||"?")+" but this route requires "+n+". You cannot service this route.");return}var l=5e4,{data:r}=await _.from("factions").select("corp_cash_reserves").eq("id",p.id).single(),c=Number(r?.corp_cash_reserves??0);if(c<l){alert("Not enough funds. Application fee: $50k. You have $"+Math.round(c/1e3)+"k.");return}Ge=!0;var d=document.getElementById("ar-claim-btn");d.textContent="APPLYING...";try{var f=c-l,{error:s}=await _.from("factions").update({corp_cash_reserves:f}).eq("id",p.id);if(s){alert("Failed to deduct fee.");return}var{data:m,error:u}=await _.from("shipping_applications").insert({route_id:t.id,faction_id:p.id,proposed_rate:Number(t.estimated_revenue||0),application_fee:l,status:"pending",applied_at_tick:M.current_tick}).select("*").single();if(u){await _.from("factions").update({corp_cash_reserves:c}).eq("id",p.id);const g=u.code==="23505"||/duplicate key|idx_shipping_applications_unique/i.test(u.message||"");alert(g?"You already have a pending or approved application on this route. Withdraw it from Route Applications before applying again.":"Application failed: "+u.message);return}try{await _.from("event_log").insert({nation_id:t.origin_nation_id,event_name:p.faction_name+" applied to service "+(t.origin_port||"?")+" → "+(t.destination_port||"?")+" route",category:"corporate",description_chosen:p.faction_name+" has submitted a shipping application for the "+(t.goods_name||"trade")+" route between "+(t.origin_port||"?")+" and "+(t.destination_port||"?")+". Awaiting government approval.",fired_at_tick:M.current_tick})}catch{}await _i(),K=-1,await xi(),alert("Application submitted! The government will review your application.")}catch(g){alert("Application failed: "+(g.message||"Network error"))}finally{Ge=!1,d.textContent="APPLY TO SERVICE — $50k",d.className="ar-claim-btn"+(K>=0?" active":"")}}}}async function wo(){if(!(Ge||K<0||!p||!M)){var e=bi(),t=e[K];if(t){var i=Number(p.shipping_fleet_capacity??0),a=Number(p.shipping_fleet_deployed??0);if(a>=i){alert("No available vessels. Fleet capacity: "+i+", deployed: "+a+".");return}Ge=!0;var o=document.getElementById("ar-claim-btn");o.textContent="CLAIMING...",o.className="ar-claim-btn";try{var{data:n,error:l}=await _.rpc("claim_shipping_route",{p_faction_id:p.id,p_route_id:t.id,p_current_tick:M.current_tick});if(l){alert("Claim failed: "+l.message);return}if(n&&!n.success){alert(n.error||"Claim failed.");return}if(n?.claim_id){var r=(le||[]).find(function(m){return m.status==="in_port"&&!m.active_claim_id&&m.fuel>=10});if(r){var{error:c}=await _.from("corp_vessels").update({status:"in_transit",active_claim_id:n.claim_id,current_port_nation_id:null}).eq("id",r.id);c&&console.warn("Failed to assign vessel to route:",c.message)}else console.warn("Route claimed but no available vessel with fuel >= 10% to assign.")}try{var d=t.origin_nation?.name||t.origin_nation_id||"Unknown",f=t.destination_nation?.name||t.destination_nation_id||"Unknown",s=t.goods_type||t.cargo_type||"goods";await _.from("event_log").insert({nation_id:p.nation_id,event_name:"Shipping Route Signed",category:"corporate",description_chosen:p.faction_name+" has just signed an agreement to ship "+s+" between "+d+" and "+f+".",fired_at_tick:M.current_tick||0})}catch{}await _i(),K=-1,await Promise.all([xi(),$i(),he()])}catch(m){alert("Claim failed: "+(m.message||"Network error"))}finally{Ge=!1,o.textContent="CLAIM ROUTE",o.className="ar-claim-btn"+(K>=0?" active":"")}}}}let Ce=[],ia="ready",Ze=null,gt=-1;async function $i(){if(!p||p.corp_sector!=="Shipping")return;const e=await ka(_,p.id);Ce=e.claims,ia=e.state,Ze=e.error,Ze&&console.warn("Failed to load active voyages:",Ze.message),aa()}function ko(e){gt=gt===e?-1:e,aa()}async function Eo(e){if(!(Pt||!p||!M)){Pt=!0;try{var{data:t,error:i}=await _.rpc("release_shipping_route",{p_faction_id:p.id,p_claim_id:e,p_current_tick:M.current_tick});if(i){alert("Release failed: "+i.message);return}if(t&&!t.success){alert(t.error||"Release failed.");return}var{error:a}=await _.from("corp_vessels").update({status:"in_port",active_claim_id:null}).eq("active_claim_id",e).eq("faction_id",p.id);a&&console.warn("Failed to free vessel on release:",a.message),gt=-1,await _i(),await Promise.all([xi(),$i(),he()])}catch(o){alert("Release failed: "+(o.message||"Network error"))}finally{Pt=!1}}}function aa(){const e=M?.current_tick||0,t=Number(p?.shipping_fleet_capacity??0),i=Number(p?.shipping_fleet_deployed??0),a=p?.corp_subsector||"--";document.getElementById("av-count").textContent=Ce.length+" ACTIVE";const o=Ce.reduce((f,s)=>f+Number(s.total_revenue||0),0),n=Ce.reduce((f,s)=>f+(s.transits_completed||0),0),l=n>0?Math.round(o/n):0;document.getElementById("av-summary").innerHTML=`
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
            <div class="av-summary__value" style="color:var(--green)">${O(l)}</div>
        </div>`,document.getElementById("av-total-revenue").textContent=O(o),document.getElementById("av-total-revenue").style.color=o>0?"var(--green)":"var(--text-dim)",document.getElementById("av-fleet-status").textContent=i+"/"+t,document.getElementById("av-subsector").textContent=a;const r=document.getElementById("av-list");if(ia==="error"){r.innerHTML='<div class="av-empty"><div class="av-empty__text">'+y(Ze&&Ze.message||"Active voyage data is temporarily unavailable.")+"</div></div>";return}if(Ce.length===0){r.innerHTML='<div class="av-empty"><div class="av-empty__text">No active voyages.<br>Claim a shipping route to<br>deploy your fleet.</div></div>';return}let c="";for(let f=0;f<Ce.length;f++){const s=Ce[f],m=s.shipping_routes||{},u=gt===f,b=(le||[]).find(q=>q.active_claim_id===s.id)?.status,v=b==="in_port"?"loading":b==="in_transit"?"in_transit":b==="anchored"?"stranded":"idle";let x=v.toUpperCase().replace("_"," "),$="av-status--idle",h="";if(v==="loading")$="av-status--loading",x="LOADING";else if(v==="in_transit"){$="av-status--transit";const q=s.transit_started_tick||e,P=(s.transit_arrives_tick||q+(m.transit_ticks||2))-q,G=Math.max(0,Math.min(e-q,P)),Z=P>0?Math.round(G/P*100):0;x="IN TRANSIT ("+G+"/"+P+")",h='<div class="av-transit-bar"><div class="av-transit-bar__fill" style="width:'+Z+'%"></div></div>'}const I=Number(s.revenue_per_transit||0),C=Number(s.market_share_pct||0),w=s.transits_completed||0,k=Number(s.total_revenue||0),S=oi[m.demand_level]||"#6a6660";if(c+='<div class="av-item" onclick="avToggle('+f+')"><div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:2px;"><div class="av-item__route">'+y(m.origin_port||"?")+" → "+y(m.destination_port||"?")+'</div><span class="av-status '+$+'">'+x+'</span></div><div class="av-item__cargo">'+y(m.goods_name||"Unknown")+" · "+y(m.vessel_class||"?")+"</div>"+h+'<div class="av-item__stats"><div class="av-stat"><div class="av-stat__label">REV/TRIP</div><div class="av-stat__value" style="color:var(--green)">'+O(I)+'</div></div><div class="av-stat"><div class="av-stat__label">SHARE</div><div class="av-stat__value">'+C.toFixed(1)+'%</div></div><div class="av-stat"><div class="av-stat__label">TRANSITS</div><div class="av-stat__value">'+w+'</div></div><div class="av-stat"><div class="av-stat__label">TOTAL REV</div><div class="av-stat__value" style="color:var(--green)">'+O(k)+"</div></div></div>",u){c+='<div class="av-item__detail"><div class="av-detail-row"><span class="av-detail-label">ORIGIN</span><span class="av-detail-value">'+y(m.origin_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">DESTINATION</span><span class="av-detail-value">'+y(m.destination_port||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE SECTOR</span><span class="av-detail-value">'+y((m.trade_sector||"").replace(/_/g," ").toUpperCase())+'</span></div><div class="av-detail-row"><span class="av-detail-label">SCOPE</span><span class="av-detail-value">'+y(m.scope||"?")+'</span></div><div class="av-detail-row"><span class="av-detail-label">TRANSIT TIME</span><span class="av-detail-value">'+(m.transit_ticks||"?")+' ticks</span></div><div class="av-detail-row"><span class="av-detail-label">TRADE VOLUME</span><span class="av-detail-value">'+O(Number(m.trade_volume||0))+'</span></div><div class="av-detail-row"><span class="av-detail-label">TARIFF</span><span class="av-detail-value">'+Number(m.tariff_rate||0).toFixed(1)+'%</span></div><div class="av-detail-row"><span class="av-detail-label">COMPETITION</span><span class="av-detail-value">'+(m.competition_count??0)+' corps</span></div><div class="av-detail-row"><span class="av-detail-label">DEMAND</span><span class="av-detail-value" style="color:'+S+'">'+(m.demand_level||"?")+"</span></div>"+(m.trade_agreement_name?'<div class="av-detail-row"><span class="av-detail-label">AGREEMENT</span><span class="av-detail-value" style="color:var(--teal)">'+y(m.trade_agreement_name)+"</span></div>":"")+'<div class="av-detail-row"><span class="av-detail-label">CLAIMED</span><span class="av-detail-value">Tick '+(s.claimed_at_tick||"?")+"</span></div>";var d=(le||[]).find(function(q){return q.active_claim_id===s.id});!d&&v==="loading"?c+=`<div style="padding:6px 8px;margin-top:4px;background:rgba(200,168,50,0.06);border:1px solid rgba(200,168,50,0.15);text-align:center;"><div style="font-family:var(--font-mono);font-size:9px;color:var(--orange);font-weight:700;margin-bottom:4px;">NO VESSEL ASSIGNED</div><button class="av-action-btn" style="background:var(--teal);color:#fff;border-color:var(--teal);width:100%;" onclick="event.stopPropagation();openAssignVesselModal('`+s.id+"','"+(m.vessel_class||"")+`')">ASSIGN VESSEL</button></div>`:d&&(c+='<div style="display:flex;justify-content:space-between;padding:4px 8px;margin-top:4px;background:var(--bg-card);border:1px solid var(--border-main);"><div><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">ASSIGNED VESSEL</div><div style="font-size:11px;font-weight:700;color:var(--text-bright);">'+y(d.vessel_name||"Unknown")+'</div></div><div style="display:flex;gap:10px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(d.fuel>50?"#5c5":d.fuel>20?"#ca5":"#c55")+'">'+(d.fuel||0)+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:'+(d.condition>50?"#5c5":d.condition>30?"#ca5":"#c55")+'">'+(d.condition||0)+"%</div></div></div></div>"),c+=`<button class="av-action-btn release" onclick="event.stopPropagation();avRelease('`+s.id+`')">RELEASE ROUTE</button></div>`}c+="</div>"}r.innerHTML=c}function To(e,t){const i=(le||[]).filter(function(n){return n.status==="in_port"&&!n.active_claim_id&&n.fuel>=15&&n.condition>=20});let a;i.length===0?a='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">No available vessels.<br>Ships must be in port with 15%+ fuel and 20%+ condition.</div>':a=i.map(function(n,l){var r=n.fuel>50?"#5c5":n.fuel>20?"#ca5":"#c55",c=n.condition>50?"#5c5":n.condition>30?"#ca5":"#c55";return`<div style="padding:10px 14px;border-bottom:1px solid var(--border-0);cursor:pointer;display:flex;justify-content:space-between;align-items:center;" onclick="assignVesselToRoute('`+e+"','"+n.id+`')"><div><div style="font-size:14px;font-weight:700;color:var(--text-bright);">`+y(n.vessel_name||"Unnamed")+'</div><div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+y(n.vessel_class||"?")+" · "+(n.capacity_dwt||0).toLocaleString()+' DWT</div></div><div style="display:flex;gap:14px;align-items:center;"><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">FUEL</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+r+'">'+n.fuel+'%</div></div><div style="text-align:center"><div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">COND</div><div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:'+c+'">'+n.condition+'%</div></div><div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--teal);padding:4px 12px;border:1px solid var(--teal);cursor:pointer;">ASSIGN</div></div></div>'}).join("");var o=document.createElement("div");o.style.cssText="position:fixed;inset:0;background:rgba(0,0,0,0.7);z-index:9999;display:flex;align-items:center;justify-content:center;",o.onclick=function(n){n.target===o&&o.remove()},o.innerHTML='<div style="width:560px;max-width:95vw;max-height:80vh;background:var(--bg-panel);border:1px solid var(--border-main);display:flex;flex-direction:column;"><div style="padding:12px 16px;border-bottom:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:space-between;align-items:center;"><span style="font-family:var(--font-mono);font-size:13px;font-weight:700;letter-spacing:1px;color:var(--teal);">ASSIGN VESSEL</span><span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">'+i.length+' available</span></div><div style="flex:1;overflow-y:auto;">'+a+`</div><div style="padding:10px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);text-align:right;"><button onclick="this.closest('div[style*=fixed]').remove()" style="padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);background:transparent;border:1px solid var(--border-main);cursor:pointer;">CANCEL</button></div></div>`,document.body.appendChild(o)}async function Co(e,t){try{var{error:i}=await _.from("corp_vessels").update({status:"in_port",active_claim_id:e}).eq("id",t).eq("faction_id",p.id);if(i){alert("Assignment failed: "+i.message);return}var a=document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]');a&&a.remove(),await Promise.all([$i(),he()])}catch(o){alert("Assignment failed: "+(o.message||"Network error"))}}window.openAssignVesselModal=To;window.assignVesselToRoute=Co;async function oa(){if(!p){Ae=[],ai();return}const{data:e,error:t}=await _.from("construction_deliveries").select("*, construction_contracts(name, sector, issuer_name, issuer_type, timeline_ticks)").eq("faction_id",p.id).order("delivered_at_tick",{ascending:!1}).limit(20);t?(console.warn("Failed to load deliveries:",t.message),Ae=[]):Ae=(e||[]).map(i=>{const a=i.construction_contracts||{};return{id:i.contract_id,name:a.name||"Project",type:a.issuer_type||"GOVERNMENT",issuer:a.issuer_name||"Government",delivered:"Tick "+(i.delivered_at_tick||0),result:i.result,quality_score:i.quality_score,rep_change:i.rep_change,financials:{contract_value:i.contract_value||0,bonus:i.quality_bonus||0,penalty:i.penalties||0,payment:i.payment_received||0,total_cost:i.total_cost||0},inspection:i.inspection||{},materials_used:i.materials_used||[],timeline:{expected:i.timeline_expected||0,actual:i.timeline_actual||0,on_time:i.on_time,early:i.timeline_actual<i.timeline_expected}}}),ai()}function wi(){const e=te.reduce((r,c)=>r+(c.owned||0),0),t=te.reduce((r,c)=>r+(c.deployed||0),0),i=ha(te),a=e-t;document.getElementById("eq-count").textContent=e+" UNITS",document.getElementById("eq-summary").innerHTML=`
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
        </div>`;const o={};for(const r of te)o[r.equipment_key]=r;let n="";for(let r=1;r<=3;r++){const c=it[r],d=Wt(r),f=Kt===r,s=d.reduce((u,g)=>u+(o[g.key]?.owned||0),0),m=d.reduce((u,g)=>u+(o[g.key]?.deployed||0),0);if(n+=`<div class="eq-tier-hdr" onclick="toggleEqTier(${r})">
            <div class="eq-tier-hdr__left">
                <span class="eq-tier-hdr__arrow">${f?"▾":"▸"}</span>
                <span class="eq-tier-hdr__name" style="color:${c.color}">${y(c.name)}</span>
                <span class="eq-tier-hdr__tag" style="color:${c.color};border:1px solid ${c.color}33;background:${c.color}0a">${c.tag}</span>
            </div>
            ${s>0?`<span class="eq-tier-hdr__count">${m}/${s}</span>`:'<span class="eq-tier-hdr__none">NONE OWNED</span>'}
        </div>`,f)for(const u of d){const g=o[u.key],b=g?.owned||0,v=g?.deployed||0,x=g?.condition||0,$=u.maintenancePerUnit*b,h=b-v,I=b>0&&h===0,C=b>0&&x<65,w=Fi(x),k=g?.assigned_projects||[],S=k.length>0?k.map(q=>q.contract_name||"Project").join(", ").slice(0,30):b>0&&v>0?v+" project"+(v>1?"s":""):"—";n+=`<div class="eq-row${b===0?" unowned":""}">`,n+=`<div class="eq-row__top">
                    <div class="eq-row__name-area">
                        <span class="eq-row__name${b===0?" dim":""}">${y(u.name)}</span>
                        ${C?'<span class="eq-row__wear">WEAR</span>':""}
                    </div>
                    ${b>0?`<div class="eq-row__right">
                            <div style="display:flex;gap:3px">
                                <span class="eq-row__free" style="color:${I?"var(--orange)":"var(--green)"}">${h}</span>
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
                            <div class="eq-detail__value" style="color:var(--red)">${O($)}<span style="font-size:7px;color:var(--text-dim)">/t</span></div>
                        </div>
                    </div>`:n+='<div class="eq-row__hint">Purchase from Equipment Market →</div>',n+="</div>"}}document.getElementById("eq-list").innerHTML=n;const l=[1,2,3].map(r=>{const c=it[r],d=Wt(r).reduce((f,s)=>f+(o[s.key]?.owned||0),0);return`<div class="eq-footer__tier-box" style="border-color:${d>0?c.color+"33":"var(--border-0)"};background:${d>0?c.color+"0a":"transparent"}">
            <div class="eq-footer__tier-tag" style="color:${c.color}">${c.tag}</div>
            <div class="eq-footer__tier-count" style="color:${d>0?"var(--text-bright)":"var(--text-dim)"}">${d}</div>
        </div>`}).join("");document.getElementById("eq-footer").innerHTML=`
        <div>
            <div class="eq-footer__maint-label">FLEET MAINTENANCE / TICK</div>
            <div class="eq-footer__maint-value">${O(i)}</div>
        </div>
        <div class="eq-footer__tiers">${l}</div>`}function Io(e){Kt=Kt===e?-1:e,wi()}async function ki(){if(!p)return;const{data:e,error:t}=await _.from("corp_equipment").select("equipment_key, tier, owned, deployed, condition, maintenance_per_tick, assigned_projects").eq("faction_id",p.id);t?(console.warn("Failed to load equipment:",t.message),te=[]):te=e||[],wi()}async function qo(){const{data:{user:e}}=await _.auth.getUser();if(!e){window.location.href="login.html";return}const t=new URLSearchParams(location.search).get("faction_id");if(!!t){const{data:s,error:m}=await _.from("factions").select("*").eq("id",t).single();m?console.warn("[Inspector] faction fetch failed:",m.message):s?.faction_type==="corporation"&&(p=s)}if(!p){const{data:s}=await _.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);Ee=(s||[]).filter(u=>u.nation_id);const m=sessionStorage.getItem("active_faction_id");if(p=Ee.find(u=>u.id===m)||Ee.find(u=>u.faction_type==="corporation")||Ee[0],!p){await _.auth.signOut(),window.location.href="login.html";return}if(p.faction_type!=="corporation"){window.location.href="dashboard.html";return}if(p.corp_sector!=="Construction"){const u=Hi[p.corp_sector];if(u){window.location.href=u;return}}}const[a,o]=await Promise.all([p.nation_id?_.from("nations").select("*").eq("id",p.nation_id).single():Promise.resolve({data:null}),_.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);a.error&&console.warn("Nation load failed:",a.error.message),a.data&&(L=a.data),o.error&&console.warn("Shard load failed:",o.error.message),M=o.data;let n=0;if(p?.id){const{data:s}=await _.from("construction_contracts").select("id, contract_bids!inner(id)").eq("issuer_faction_id",p.id).in("status",["open","bidding"]);if(s)for(const m of s)n+=(m.contract_bids||[]).length}const l=document.getElementById("corp-topbar-container");if(l){const{renderCorpTopBar:s}=await ba(async()=>{const{renderCorpTopBar:u}=await import("./corp-topbar-CPI0igZM.js");return{renderCorpTopBar:u}},__vite__mapDeps([0,1])),m={};n>0&&(m.home={color:"#c8a832",title:n+" pending bid"+(n!==1?"s":"")+" on your projects"}),s(l,{faction:p,shard:M,activeTab:"operations",allUserFactions:Ee,badges:m})}if(M){if(document.getElementById("game-date").textContent=M.current_date||"—",document.getElementById("tick-number").textContent=M.current_tick||"—",M.next_tick_at){const m=(Number(M.tick_interval_hours)||8)*36e5,u=new Date(M.next_tick_at).getTime(),b=u-m+m/2;Jt=new Date(b>Date.now()?b:u+m/2),qa()}const s=document.querySelector("#tick-countdown")?.closest(".tick-item")?.querySelector(".tick-label");s&&(s.textContent="Next Corp Tick")}const r=document.getElementById("topbar-cash");r&&(r.textContent="CASH: "+Zi(Number(p.corp_cash_reserves??0)));const c=document.getElementById("topbar-ap");c&&(c.style.display="none");const d=document.getElementById("nation-pill");d&&(d.textContent=(L?.name||p.nation||"—").toUpperCase());const f=document.getElementById("corp-faction-dropdown");if(f){let s="";for(const m of Ee){const u=m.id===p.id,g=m.faction_type==="corporation"?"CORP":"PARTY",b=m.faction_type==="corporation"?"var(--teal)":"var(--amber)";s+=`<div class="corp-dd-item${u?" active":""}" onclick="switchToFaction('${m.id}', '${m.faction_type}')">
                <span class="corp-dd-type" style="color:${b}">${g}</span>
                <span class="corp-dd-name">${y(m.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${y(m.abbreviation||"—")}]</span>
            </div>`}f.innerHTML=s}try{const{data:s}=await _.from("building_modifiers").select("*");vt={};for(const m of s||[])vt[m.modifier_key]=m}catch{}await Promise.all([xe(),ot(),mi(),ki(),Xi(),oa(),Ca()]);try{const{data:s}=await _.from("nations").select("*").order("name");Ye=s||[]}catch{Ye=[]}vi(),Et(),xa(p,L,M);try{await ga(_,{faction:p,nation:L,shard:M},"auto-services-container")}catch(s){console.error("[CorpOps] Auto-services init failed:",s)}document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block"}async function No(){await _.auth.signOut(),window.location.href="login.html"}function Ao(){const e=document.getElementById("corp-faction-dropdown");e&&e.classList.toggle("open")}function So(e,t){const i=document.getElementById("corp-faction-dropdown");if(i&&i.classList.remove("open"),sessionStorage.setItem("active_faction_id",e),t==="corporation"){const a=(Ee||[]).find(o=>o.id===e);window.location.href=Hi[a?.corp_sector]||"corp-operations.html"}else window.location.href="dashboard.html"}document.addEventListener("click",e=>{const t=document.getElementById("faction-switcher"),i=document.getElementById("corp-faction-dropdown");i&&t&&!t.contains(e.target)&&i.classList.remove("open")});document.addEventListener("keydown",e=>{e.key==="Escape"&&lt()});window.doLogout=No;window.toggleCorpDropdown=Ao;window.switchToFaction=So;window.setFilter=Na;window.arSetFilter=ta;window.arSelectRoute=ho;window.arClaimRoute=wo;window.arApplyToService=$o;window.avToggle=ko;window.avRelease=Eo;window.openContractDetail=Yi;window.closeContractDetail=lt;window.toggleWhRow=Xa;window.toggleEqTier=Io;window.switchEmNation=so;window.setEmType=ro;window.setEmListing=lo;window.setEmQty=co;window.purchaseEquipment=po;window.switchPrNation=ao;window.setPrMat=eo;window.setPrTier=to;window.setPrQty=io;window.purchaseMaterial=oo;let ie=null,ge={},Y=120,be=15,ni={},Fe=[],Se=[],Ve={};async function Mo(){if(!Le)return;if(We[Le.id]){alert("You already have a bid on this contract. Retract it first if you want to re-bid.");return}ie=Le,ni={};try{const{data:i}=await _.from("corp_material_inventory").select("material_key, quantity").eq("faction_id",p.id);for(const a of i||[])ni[mt(a.material_key)]=Number(a.quantity||0)}catch{}Fe=[];try{const{data:i}=await _.from("contract_bids").select("faction_id, bid_price, estimated_quality, status, factions(faction_name, corp_ticker)").eq("contract_id",ie.id).in("status",["pending","won"]);Fe=(i||[]).filter(a=>a.faction_id!==p?.id).map(a=>({name:a.factions?.faction_name||"Unknown",ticker:a.factions?.corp_ticker||"???",price:Number(a.bid_price||0),quality:Number(a.estimated_quality||0),status:a.status}))}catch{}Se=[],Ve={};try{const{data:i,error:a}=await _.rpc("get_project_permit_requirements",{p_contract_id:ie.id,p_faction_id:p.id,p_nation_id:ie.nation_id});if(a)throw a;Se=Array.isArray(i)?i:[];const o=Se.map(n=>n.permit_key).filter(Boolean);if(o.length>0){const{data:n,error:l}=await _.from("construction_permits").select("permit_key, cost, processing_ticks").in("permit_key",o);if(l)throw l;for(const r of n||[])Ve[r.permit_key]={cost:Number(r.cost||0),ticks:Number(r.processing_ticks||0)}}}catch(i){console.warn("Failed to load project permit requirements",i),Se=[],Ve={}}ge={};const e=ie.required_materials||{};for(const i of Object.keys(e))ge[i]="STD";const t=ie.required_workforce||{};Y=Number(t.general||0)+Number(t.skilled||0)||120,be=15,lt(),Tt()}function Ei(){document.getElementById("bid-assembly-overlay")?.remove(),ie=null,Se=[],Ve={}}function Ro(e,t){ge[e]=t,Tt()}function Lo(e){Y=e,Tt()}function zo(e){be=e,Tt()}function Tt(){if(document.getElementById("bid-assembly-overlay")?.remove(),!ie)return;const e="'JetBrains Mono', monospace",t={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",redDim:"#a44",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},i=ie,a=i.issuer_type==="GOVERNMENT",o=L?.name||p?.nation||"—",n=Number(i.budget_ceiling||0),l=Number(i.timeline_ticks||8),r=i.required_materials||{},c=Object.keys(r),d={LOW:.5,STD:1,HIGH:2},f={LOW:t.orange,STD:t.yellow,HIGH:t.greenBright},s={LOW:"Low",STD:"Standard",HIGH:"High"},m={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},u=ni||{};let g=0,b="";for(const R of c){const U=Number(r[R]||0),Ii=ge[R]||"STD",qi=m[R]||3e5,fa=d[Ii],ma=Math.round(qi*fa),Ni=U*ma;g+=Ni;const va=R.replace(/_/g," ").replace(/\b\w/g,we=>we.toUpperCase()),Ai=Number(u[R]||0),qt=Math.max(0,U-Ai),ua=qt===0?t.greenBright:qt<U?t.yellow:t.red,ya=qt===0?"✓ IN STOCK":`${Ai}/${U}`;b+=`
        <div style="display:flex;align-items:center;padding:5px 14px;border-bottom:1px solid ${t.border};">
            <div style="flex:1.2">
                <span style="font-size:11px;color:${t.text}">${va}</span>
                <div style="font-family:${e};font-size:7px;color:${ua};margin-top:1px">${ya}</div>
            </div>
            <div style="flex:0.5;text-align:center"><span style="font-family:${e};font-size:9px;color:${t.muted}">${U.toLocaleString()}</span></div>
            <div style="flex:1.2;display:flex;gap:2px;justify-content:center;">
                ${["LOW","STD","HIGH"].map(we=>{const Nt=Ii===we,Si=f[we],_a=E(Math.round(qi*d[we]));return`<span onclick="bidSetGrade('${R}','${we}')" style="padding:2px 6px;font-family:${e};font-size:7px;font-weight:700;cursor:pointer;color:${Nt?"#000":t.dim};background:${Nt?Si:"transparent"};border:1px solid ${Nt?Si:t.border}" title="${_a}/unit">${s[we]}</span>`}).join("")}
            </div>
            <div style="flex:0.8;text-align:right"><span style="font-family:${e};font-size:10px;color:${t.text}">${E(Ni)}</span></div>
        </div>`}const v=i.required_workforce||{},x=Number(v.general||0)+Number(v.skilled||0)||100,$=Math.max(40,Math.round(x*.5)),h=x*2,I=[$,Math.round(x*.75),x,Math.round(x*1.5),h],C=Math.max(0,Math.min(1,(Y-$)/(h-$||1))),w=l,k=Math.round(4.5-C*8),S=Math.max(Math.round(w*.6),w+k),q=k>0?`+${k}mo`:k<0?`${k}mo`:"On schedule",N=k>0?t.red:k<0?t.greenBright:t.yellow,P=15200,G=Y*P*S,Z=(Se||[]).map(R=>{const U=Ve[R.permit_key]||{};return{permit_key:R.permit_key,name:R.permit_name||R.permit_key,requiredByPolicy:R.required_by_policy||"—",hasPermit:!!R.has_permit,statusLabel:R.status_label||(R.has_permit?"HAS_PERMIT":"NEEDS_TO_GET"),cost:Number(U.cost||0),ticks:Number(U.ticks||0)}}),V=Z.filter(R=>!R.hasPermit).reduce((R,U)=>R+U.cost,0),ce=4e5,z=g+G+V+ce,T=Math.round(z*(be/100)),D=z+T,B=D>n,j=T,J=B?0:Math.max(0,Math.min(100,Math.round(100-D/n*100+30))),$e=J>70?t.greenBright:J>40?t.yellow:J>0?t.orange:t.red,It=B?"OVER CEILING":J>70?"STRONG":J>40?"COMPETITIVE":J>20?"WEAK":"UNLIKELY",oe=Object.values(ge),de=oe.length>0?Math.round(oe.reduce((R,U)=>R+(U==="HIGH"?85:U==="STD"?65:45),0)/oe.length):50,ct=de>=75?t.greenBright:de>=50?t.yellow:de>=25?t.orange:t.red,pa=de>=75?"EXCELLENT":de>=50?"FAIR":de>=25?"POOR":"BAD",De=document.createElement("div");De.id="bid-assembly-overlay",De.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",De.addEventListener("click",R=>{R.target===De&&Ei()}),De.innerHTML=`
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
                <span style="font-family:${e};font-size:9px;color:${t.muted}">Ceiling: <span style="color:${t.text};font-weight:700">${E(n)}</span></span>
                <span style="font-family:${e};font-size:9px;color:${t.dim}">·</span>
                <span style="font-family:${e};font-size:9px;color:${t.muted}">Timeline: <span style="color:${t.text};font-weight:700">${l} months</span></span>
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
                    <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${E(g)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:${t.card};">
                    <span style="font-family:${e};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${t.accentBright};text-transform:uppercase">Labor</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${t.border};">
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                        <span style="font-family:${e};font-size:8px;color:${t.dim};width:60px">WORKERS</span>
                        <div style="display:flex;gap:3px;">
                            ${I.map(R=>`<span onclick="bidSetWorkers(${R})" style="padding:2px 8px;font-family:${e};font-size:8px;font-weight:700;cursor:pointer;color:${Y===R?"#000":t.dim};background:${Y===R?t.accent:"transparent"};border:1px solid ${Y===R?t.accent:t.border}">${R}</span>`).join("")}
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${e};font-size:8px;color:${t.dim}">${Y} × $${P.toLocaleString()}/tick × ${S} ticks</span>
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${E(G)}</span>
                    </div>
                    <div style="margin-top:6px;padding-top:6px;border-top:1px solid ${t.border};">
                        <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                            <span style="font-family:${e};font-size:8px;color:${t.dim}">WORKFORCE REQUIRED</span>
                        </div>
                        <div style="display:flex;gap:12px;">
                            <span style="font-family:${e};font-size:7px;color:#8b9a6b">General: ${Math.ceil(Y*.8)}</span>
                            <span style="font-family:${e};font-size:7px;color:#c8a832">Skilled: ${Math.ceil(Y*.15)}</span>
                            <span style="font-family:${e};font-size:7px;color:#c84">Innovative: ${Math.ceil(Y*.05)}</span>
                        </div>
                    </div>
                    <div style="display:flex;justify-content:space-between;margin-top:6px;padding-top:6px;border-top:1px solid ${t.border};">
                        <span style="font-family:${e};font-size:8px;color:${t.dim}">COMPLETION TIMELINE</span>
                        <span style="font-family:${e};font-size:10px;font-weight:700;color:${N}">${S}mo <span style="font-size:8px;opacity:0.7">(${q})</span></span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:${t.card};">
                    <span style="font-family:${e};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${t.accentBright};text-transform:uppercase">Permits</span>
                </div>
                ${Z.length===0?`<div style="padding:8px 14px;border-bottom:1px solid ${t.border};font-family:${e};font-size:8px;color:${t.dim};">No active permit laws apply to this project.</div>`:""}
                ${Z.map(R=>{const U=R.hasPermit;return`<div style="display:flex;align-items:center;padding:4px 14px;border-bottom:1px solid ${t.border};">
                        <div style="flex:1;display:flex;align-items:center;gap:6px;">
                            <span style="font-family:${e};font-size:8px;font-weight:700;color:${U?t.greenBright:t.orange}">${U?"✓":"○"}</span>
                            <span style="font-size:10px;color:${U?t.muted:t.text}">${R.name}</span>
                        </div>
                        ${U?`<span style="font-family:${e};font-size:8px;color:${t.greenBright}">${R.statusLabel}</span>`:`<div style="text-align:right">
                                <span style="font-family:${e};font-size:9px;color:${t.redDim}">${E(R.cost)}</span>
                                <span style="font-family:${e};font-size:7px;color:${t.dim};margin-left:4px">${R.ticks}t</span>
                            </div>`}
                    </div><div style="padding:0 14px 4px 28px;border-bottom:1px solid ${t.border};font-family:${e};font-size:7px;color:${t.dim};">Required by: ${y(R.requiredByPolicy)}</div>`}).join("")}
                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${t.border};background:rgba(139,154,107,0.02);">
                    <span style="font-family:${e};font-size:9px;color:${t.muted}">PERMIT COSTS</span>
                    <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${E(V)}</span>
                </div>

                <div style="display:flex;justify-content:space-between;padding:5px 14px;border-bottom:1px solid ${t.border};">
                    <span style="font-family:${e};font-size:9px;color:${t.muted}">OVERHEAD & CONTINGENCY</span>
                    <span style="font-family:${e};font-size:11px;font-weight:700;color:${t.text}">${E(ce)}</span>
                </div>
            </div>

            <!-- RIGHT: Bid Summary -->
            <div style="width:280px;display:flex;flex-direction:column;overflow:auto;">
                <div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:${t.card};">
                    <span style="font-family:${e};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${t.accentBright};text-transform:uppercase">Cost Summary</span>
                </div>
                ${[{l:"Materials",v:g},{l:"Labor",v:G},{l:"Permits",v:V},{l:"Overhead",v:ce}].map(R=>`<div style="display:flex;justify-content:space-between;padding:4px 14px;border-bottom:1px solid ${t.border};">
                    <span style="font-size:10px;color:${t.muted}">${R.l}</span>
                    <span style="font-family:${e};font-size:10px;color:${t.redDim}">${E(R.v)}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${t.border};background:rgba(204,85,85,0.03);">
                    <span style="font-family:${e};font-size:10px;font-weight:700;color:${t.text}">TOTAL EST. COST</span>
                    <span style="font-family:${e};font-size:13px;font-weight:700;color:${t.red}">${E(z)}</span>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:${t.card};">
                    <span style="font-family:${e};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${t.gold};text-transform:uppercase">Set Markup</span>
                </div>
                <div style="padding:10px 14px;border-bottom:1px solid ${t.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                        <span style="font-family:${e};font-size:9px;color:${t.dim}">MARKUP %</span>
                        <span style="font-family:${e};font-size:16px;font-weight:700;color:${t.gold}">${be}%</span>
                    </div>
                    <input type="range" min="0" max="40" step="1" value="${be}" oninput="bidSetMarkup(+this.value)" style="width:100%;accent-color:${t.gold};height:6px;" />
                    <div style="display:flex;justify-content:space-between;font-family:${e};font-size:7px;color:${t.dim};margin-top:2px;">
                        <span>0% (at cost)</span><span>40% (maximum)</span>
                    </div>
                </div>

                <div style="padding:10px 14px;border-bottom:1px solid ${t.border};background:${B?"rgba(204,85,85,0.04)":"rgba(200,168,50,0.03)"};">
                    <div style="font-family:${e};font-size:8px;color:${t.dim};margin-bottom:4px">YOUR BID PRICE</div>
                    <div style="font-family:${e};font-size:22px;font-weight:700;color:${B?t.red:t.gold}">${E(D)}</div>
                    ${B?`<div style="font-family:${e};font-size:8px;font-weight:700;color:${t.red};margin-top:4px;padding:2px 6px;background:rgba(204,85,85,0.08);border:1px solid rgba(204,85,85,0.15);display:inline-block">EXCEEDS BUDGET CEILING (${E(n)})</div>`:""}
                </div>

                <div style="padding:8px 14px;border-bottom:1px solid ${t.border};">
                    <div style="display:flex;justify-content:space-between;">
                        <span style="font-family:${e};font-size:8px;color:${t.dim}">PROJECTED PROFIT</span>
                        <span style="font-family:${e};font-size:14px;font-weight:700;color:${j>0?t.greenBright:t.dim}">+${E(j)}</span>
                    </div>
                </div>

                <div style="padding:6px 14px;border-bottom:1px solid ${t.border};background:${t.card};">
                    <span style="font-family:${e};font-size:9px;font-weight:700;letter-spacing:1.5px;color:${t.accentBright};text-transform:uppercase">Bid Assessment</span>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${t.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${e};font-size:8px;color:${t.dim}">COMPETITIVENESS</span>
                        <span style="font-family:${e};font-size:11px;font-weight:700;color:${$e}">${It}</span>
                    </div>
                    <div style="width:100%;height:4px;background:${t.border}"><div style="width:${J}%;height:100%;background:${$e}"></div></div>
                </div>
                <div style="padding:8px 14px;border-bottom:1px solid ${t.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:4px;">
                        <span style="font-family:${e};font-size:8px;color:${t.dim}">QUALITY ESTIMATE</span>
                        <div style="display:flex;align-items:baseline;gap:4px;">
                            <span style="font-family:${e};font-size:11px;font-weight:700;color:${ct}">${de}</span>
                            <span style="font-family:${e};font-size:8px;color:${t.dim}">/100</span>
                            <span style="font-family:${e};font-size:8px;font-weight:700;color:${ct}">${pa}</span>
                        </div>
                    </div>
                    <div style="width:100%;height:4px;background:${t.border}"><div style="width:${de}%;height:100%;background:${ct}"></div></div>
                    <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:4px">Based on material grades. Workforce and events also affect final quality.</div>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
                    <div style="font-family:${e};font-size:8px;color:${t.dim};letter-spacing:0.8px;margin-bottom:3px">COMPETING BIDS</div>
                    ${Fe.length===0?`<div style="font-family:${e};font-size:8px;color:${t.dim};padding:4px 0;">No competing bids yet. First mover advantage.</div>`:`<div style="display:flex;gap:4px;flex-wrap:wrap;">
                            ${Fe.map(R=>`<span style="padding:2px 6px;font-family:${e};font-size:7px;color:${t.muted};background:${t.card};border:1px solid ${t.border};">${R.name} <span style="color:${t.dim}">Q:${R.quality}</span></span>`).join("")}
                        </div>
                        <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:3px">${Fe.length} competing bid${Fe.length!==1?"s":""}. Bid prices are sealed until resolution.</div>`}
                    <div style="font-family:${e};font-size:7px;color:${t.dim};margin-top:3px">Higher reputation bidders may win at higher prices.</div>
                </div>
                <div style="flex:1"></div>
            </div>
        </div>

        <!-- FOOTER -->
        <div style="padding:10px 16px;border-top:1px solid ${t.border};background:${t.card};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <div style="display:flex;gap:12px;">
                <div><div style="font-family:${e};font-size:7px;color:${t.dim}">YOUR BID</div><div style="font-family:${e};font-size:14px;font-weight:700;color:${B?t.red:t.gold}">${E(D)}</div></div>
                <div><div style="font-family:${e};font-size:7px;color:${t.dim}">EST. PROFIT</div><div style="font-family:${e};font-size:14px;font-weight:700;color:${t.greenBright}">+${E(j)}</div></div>
                <div><div style="font-family:${e};font-size:7px;color:${t.dim}">QUALITY</div><div style="font-family:${e};font-size:14px;font-weight:700;color:${ct}">${de}</div></div>
            </div>
            <div style="display:flex;gap:8px;">
                <div onclick="closeBidAssembly()" style="padding:6px 20px;font-family:${e};font-size:10px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">CANCEL</div>
                <div onclick="${B?"":"submitBidAssembly()"}" style="padding:6px 24px;font-family:${e};font-size:10px;font-weight:700;letter-spacing:1px;color:${B?t.dim:"#000"};background:${B?t.border:t.gold};cursor:${B?"not-allowed":"pointer"};opacity:${B?.5:1}">SUBMIT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(De)}let Bt=!1;async function Oo(){if(Bt||!ie)return;const e=ie,t=e.required_materials||{},i=Object.keys(t),a=Number(e.budget_ceiling||0),o=Number(e.timeline_ticks||8),n={concrete:36e4,steel:5e5,glass_facades:56e4,em_systems:64e4,lumber:24e4,heavy_parts:8e5,aggregate:16e4,asphalt:28e4},l={LOW:.5,STD:1,HIGH:2};let r=0;for(const S of i){const q=Number(t[S]||0),N=ge[S]||"STD",P=n[S]||3e5;r+=q*Math.round(P*l[N])}const c=15200,d=e.required_workforce||{},f=Number(d.general||0)+Number(d.skilled||0)||100,s=Math.max(40,Math.round(f*.5)),m=f*2,u=Math.max(0,Math.min(1,(Y-s)/(m-s||1))),g=Math.round(4.5-u*8),b=Math.max(Math.round(o*.6),o+g),v=Y*c*b,x=(Se||[]).filter(S=>!S.has_permit).reduce((S,q)=>S+Number(Ve[q.permit_key]?.cost||0),0),h=r+v+x+4e5,I=Math.round(h*(be/100)),C=h+I;if(C>a){alert("Bid exceeds budget ceiling. Reduce costs or markup.");return}const w=Object.values(ge),k=w.length>0?Math.round(w.reduce((S,q)=>S+(q==="HIGH"?85:q==="STD"?65:45),0)/w.length):50;if(confirm('Submit bid for "'+e.name+`"?

Bid Price: `+E(C)+`
Est. Cost: `+E(h)+`
Markup: `+be+"% ("+E(I)+`)
Quality: `+k+`/100
Workers: `+Y+`

Once submitted, your bid cannot be changed.`)){Bt=!0;try{const{data:S}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),q=S?.current_tick||0,N={};for(const G of i)N[G]=ge[G]||"STD";const{error:P}=await _.from("contract_bids").insert({contract_id:e.id,faction_id:p.id,bid_price:C,material_grades:N,labor_count:Y,markup_pct:be,estimated_cost:h,estimated_quality:k,status:"pending",submitted_at_tick:q});if(P)throw P;e.status==="open"&&await _.from("construction_contracts").update({status:"bidding"}).eq("id",e.id).eq("status","open"),Ei(),alert(`Bid submitted successfully!

Contract: `+e.name+`
Your Bid: `+E(C)+`
Quality: `+k+`/100

Bids will be resolved when the bidding window closes (`+(e.bidding_ends_tick?"tick "+e.bidding_ends_tick:"TBD")+`).
Lowest qualified bid wins.`),typeof xe=="function"&&await xe()}catch(S){alert("Bid submission failed: "+S.message)}finally{Bt=!1}}}window.openBidAssembly=Mo;window.closeBidAssembly=Ei;window.bidSetGrade=Ro;window.bidSetWorkers=Lo;window.bidSetMarkup=zo;window.submitBidAssembly=Oo;let Dt=!1;async function Po(e){if(Dt)return;const t=1e6,i=Number(p?.corp_cash_reserves??0);if(i<t){alert("Cannot retract — you need at least $1M in cash reserves to cover the retraction penalty.");return}if(confirm(`Retract your bid?

This will cost $1M as a retraction penalty.
This action cannot be undone.`)){Dt=!0;try{const a=i-t,{error:o}=await _.from("factions").update({corp_cash_reserves:a}).eq("id",p.id);if(o)throw o;const{error:n}=await _.from("contract_bids").delete().eq("contract_id",e).eq("faction_id",p.id);if(n)throw n;p.corp_cash_reserves=a,typeof subUpdateTopbarCash=="function"&&subUpdateTopbarCash(a),alert("Bid retracted. $1M penalty applied."),lt(),await xe()}catch(a){alert("Failed to retract bid: "+(a.message||"Unknown error"))}finally{Dt=!1}}}window.retractBid=Po;let nt=[],Me=0,re=null,jt=!1,Ut=!1,Ft=!1;async function Bo(){if(!Le||Ut)return;Ut=!0,re=Le,Me=0;const{data:e,error:t}=await _.from("contract_bids").select("*, factions(faction_name, corp_ticker, corp_subsector)").eq("contract_id",re.id).in("status",["pending","won"]).order("bid_price",{ascending:!0});if(Ut=!1,t){alert("Failed to load bids: "+t.message);return}nt=(e||[]).map(i=>({...i,corp:i.factions?.faction_name||"Unknown",abbr:i.factions?.corp_ticker||"???",subsector:i.factions?.corp_subsector||"—"})),lt(),na()}function Ct(){document.getElementById("bid-review-overlay")?.remove(),re=null}function Do(e){Me=e,na()}async function jo(){if(jt||nt.length===0)return;const e=nt[Me];if(!(!e?.id||!e.faction_id)&&confirm("Accept bid from "+e.corp+`?

Bid Price: `+E(e.bid_price)+`
Quality: `+e.estimated_quality+`/100
Workers: `+e.labor_count+`

This will award the contract. The project begins immediately.`)){jt=!0;try{const{data:t}=await _.from("shard").select("current_tick").eq("name","Alpha Shard").single(),i=t?.current_tick||0,{error:a}=await _.from("contract_bids").update({status:"won"}).eq("id",e.id);if(a)throw a;const{error:o}=await _.from("contract_bids").update({status:"lost"}).eq("contract_id",re.id).neq("id",e.id);if(o)throw o;const{error:n}=await _.from("construction_contracts").update({status:"awarded",awarded_to_faction:e.faction_id,awarded_at_tick:i}).eq("id",re.id);if(n)throw n;Ct(),alert("Contract awarded to "+e.corp+`!

Bid: `+E(e.bid_price)+`
Project begins immediately.`),typeof xe=="function"&&await xe()}catch(t){alert("Failed to accept bid: "+(t.message||t))}finally{jt=!1}}}async function Uo(){if(!(!re||Ft)&&confirm(`Decline all bids and cancel this project?

No bids will be accepted. The contract will be removed.`)){Ft=!0;try{const{error:e}=await _.from("contract_bids").update({status:"lost"}).eq("contract_id",re.id);if(e)throw e;const{error:t}=await _.from("construction_contracts").update({status:"expired"}).eq("id",re.id);if(t)throw t;Ct(),alert("All bids declined. Contract cancelled."),typeof xe=="function"&&await xe()}catch(e){alert("Failed: "+(e.message||e))}finally{Ft=!1}}}function na(){if(document.getElementById("bid-review-overlay")?.remove(),!re||nt.length===0)return;const e="'JetBrains Mono', monospace",t={surface:"var(--panel-main)",card:"var(--bg-panel)",border:"var(--panel-border)",accent:"#8b9a6b",accentBright:"#a3b07e",gold:"#c8a832",orange:"#c84",greenBright:"#5c5",red:"#c55",yellow:"#ca5",text:"var(--panel-text)",muted:"#9e9a92",dim:"#6a6660"},i=re,a=nt;Me>=a.length&&(Me=0);const o=a[Me],n=Number(i.budget_ceiling||0),l=Number(i.timeline_ticks||36),r=Math.min(...a.map(u=>u.bid_price)),c=Math.max(...a.map(u=>u.estimated_quality||0));let d="";for(let u=0;u<a.length;u++){const g=a[u],b=u===Me,v=g.bid_price===r,x=(g.estimated_quality||0)===c,$=g.bid_price>n;d+=`
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
                    <div style="font-family:${e};font-size:14px;font-weight:700;color:${$?t.red:t.text}">${E(g.bid_price)}</div>
                    ${$?`<div style="font-family:${e};font-size:7px;color:${t.red}">OVER BUDGET</div>`:""}
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
        </div>`}const f=o.bid_price>n,s=n>0?Math.round(o.bid_price/n*100):0,m=document.createElement("div");m.id="bid-review-overlay",m.style.cssText="position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);display:flex;align-items:center;justify-content:center;z-index:9999;",m.addEventListener("click",u=>{u.target===m&&Ct()}),m.innerHTML=`
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
                <span>Budget: <span style="color:${t.text};font-weight:700">${E(n)}</span></span>
                <span>·</span>
                <span>Timeline: <span style="color:${t.text};font-weight:700">${l}mo</span></span>
            </div>
        </div>
        <div style="padding:6px 16px;border-bottom:1px solid ${t.border};display:flex;justify-content:space-between;align-items:center;flex-shrink:0;">
            <span style="font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${t.gold}">${a.length} BID${a.length!==1?"S":""} RECEIVED</span>
            <div style="display:flex;gap:8px;font-family:${e};font-size:8px;color:${t.dim};">
                <span>Cheapest: <span style="color:${t.greenBright}">${E(r)}</span></span>
                <span>Best Quality: <span style="color:${t.accent}">${c}</span></span>
            </div>
        </div>
        <div style="flex:1;display:flex;overflow:hidden;">
            <div style="flex:1;border-right:1px solid ${t.border};overflow:auto;">
                ${d}
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
                    <span style="font-family:${e};font-size:10px;color:${t.muted}">${E(Math.round(u.v))}</span>
                </div>`).join("")}
                <div style="display:flex;justify-content:space-between;padding:6px 14px;border-bottom:1px solid ${t.border};background:${f?"rgba(204,85,85,0.03)":"rgba(200,168,50,0.03)"};">
                    <span style="font-family:${e};font-size:9px;font-weight:700;color:${t.text}">TOTAL BID</span>
                    <span style="font-family:${e};font-size:14px;font-weight:700;color:${f?t.red:t.gold}">${E(o.bid_price)}</span>
                </div>
                <div style="padding:6px 14px;border-bottom:1px solid ${t.border};">
                    <div style="display:flex;justify-content:space-between;margin-bottom:3px;">
                        <span style="font-family:${e};font-size:8px;color:${t.dim}">vs. YOUR BUDGET</span>
                        <span style="font-family:${e};font-size:9px;font-weight:700;color:${f?t.red:t.greenBright}">${f?"OVER":"WITHIN"} — ${s}%</span>
                    </div>
                    <div style="width:100%;height:3px;background:${t.border}"><div style="width:${Math.min(100,s)}%;height:100%;background:${f?t.red:t.accent}"></div></div>
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
                <div><div style="font-family:${e};font-size:7px;color:${t.dim}">SELECTED BID</div><div style="font-family:${e};font-size:12px;font-weight:700;color:${t.gold}">${E(o.bid_price)}</div></div>
                <div><div style="font-family:${e};font-size:7px;color:${t.dim}">CORPORATION</div><div style="font-family:${e};font-size:12px;font-weight:700;color:${t.text}">${o.corp}</div></div>
                <div><div style="font-family:${e};font-size:7px;color:${t.dim}">QUALITY</div><div style="font-family:${e};font-size:12px;font-weight:700;color:${(o.estimated_quality||0)>=75?t.greenBright:t.yellow}">${o.estimated_quality}</div></div>
            </div>
            <div style="display:flex;gap:6px;">
                <div onclick="declineAllBids()" style="padding:6px 16px;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:${t.dim};border:1px solid ${t.border};cursor:pointer">DECLINE ALL</div>
                <div onclick="acceptBid()" style="padding:6px 20px;font-family:${e};font-size:9px;font-weight:700;letter-spacing:1px;color:#000;background:${t.accent};cursor:pointer">ACCEPT BID</div>
            </div>
        </div>
    </div>`,document.body.appendChild(m)}const Qe={Coastal:{color:"#8b9a6b",label:"COASTAL"},Container:{color:"#5a7aaa",label:"CONTAINER"},Bulk:{color:"#c8a832",label:"BULK"},Tanker:{color:"#c86a4a",label:"TANKER"},Reefer:{color:"#6a9a5a",label:"REEFER"},LNG:{color:"#c55",label:"LNG"}},Fo={in_port:{color:"#8b9a6b",label:"IN PORT"},in_transit:{color:"#5a8aaa",label:"IN TRANSIT"},dry_dock:{color:"#c84",label:"DRY DOCK"},anchored:{color:"#ca5",label:"ANCHORED"},for_sale:{color:"#9e9a92",label:"FOR SALE"}};function sa(e){return e>=75?"#5c5":e>=50?"#ca5":e>=25?"#c84":"#c55"}function Ho(e){return e>=60?"#5c5":e>=30?"#ca5":e>=15?"#c84":"#c55"}async function he(){if(!p||p.corp_sector!=="Shipping")return;const{data:e,error:t}=await _.from("corp_vessels").select("*").eq("faction_id",p.id).order("vessel_class");t&&console.warn("Failed to load fleet:",t.message),le=e||[],at=null,Je={},ut={};try{const i=le.map(a=>a.id);if(i.length>0){const{data:a}=await _.from("finance_active_loans").select("insured_vessel_id").in("insured_vessel_id",i).in("status",["current"]);for(const n of a||[])n.insured_vessel_id&&(Je[n.insured_vessel_id]=!0);const{data:o}=await _.from("finance_loan_requests").select("insured_vessel_id").eq("requesting_faction_id",p.id).eq("request_type","insurance").eq("status","open").not("insured_vessel_id","is",null);for(const n of o||[])n.insured_vessel_id&&!Je[n.insured_vessel_id]&&(ut[n.insured_vessel_id]=!0)}}catch(i){console.warn("Failed to load vessel insurance status:",i.message)}ra()}function Go(e){at=at===e?null:e,ra()}function ra(){const e=document.getElementById("fl-count"),t=document.getElementById("fl-summary"),i=document.getElementById("fl-list"),a=document.getElementById("fl-footer");if(!e||!i)return;const o=le;e.textContent=o.length+" VESSEL"+(o.length!==1?"S":"");const n=o.filter(s=>s.status==="in_transit").length,l=o.filter(s=>s.status==="in_port"||s.status==="anchored").length,r=o.filter(s=>s.status==="dry_dock").length,c=o.reduce((s,m)=>s+(m.base_maintenance||0),0);t.innerHTML=[{label:"TRANSIT",value:n,color:"#5a8aaa"},{label:"IN PORT",value:l,color:"#8b9a6b"},{label:"DRY DOCK",value:r,color:"#c84"},{label:"MAINT/TICK",value:E(c),color:"#a44"}].map((s,m)=>`<div style="flex:1;padding:5px 8px;text-align:center;${m<3?"border-right:1px solid var(--border-0);":""}">
        <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">${s.label}</div>
        <div style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${s.color};margin-top:1px;">${s.value}</div>
    </div>`).join(""),o.length===0?i.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels in fleet.<br>Purchase ships to begin operations.</div>':i.innerHTML=o.map((s,m)=>{const u=at===m,g=Qe[s.vessel_class]||{color:"#666",label:"?"},b=Fo[s.status]||{color:"#666",label:"?"},v=sa(s.condition),x=Ho(s.fuel),$=s.condition<50||s.fuel<20,h=s.status==="in_transit",I=s.status==="dry_dock",C=M?.current_tick||0,w=Math.max(0,Math.floor((C-(s.built_at_tick||0))/12));let k=`<div onclick="flSelectVessel(${m})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${$?s.condition<50?v:x:"transparent"};background:${u?g.color+"06":"transparent"};">
                <div style="padding:7px 14px;">`;k+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${y(s.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${g.color};background:${g.color}12;border:1px solid ${g.color}25;">${g.label}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${b.color};background:${b.color}12;border:1px solid ${b.color}25;">${b.label}</span>
            </div>`;const S=s.current_port_nation_id?"In port":h?"At sea":"—";if(k+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:5px;">${y(S)}</div>`,k+=`<div style="display:flex;gap:8px;margin-bottom:4px;">
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
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#a44;margin-top:1px;">${E(s.base_maintenance)}</div>
                </div>
            </div>`,I&&s.drydock_until_tick){const q=Math.max(0,s.drydock_until_tick-C);k+=`<div style="margin-top:4px;padding:3px 8px;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:#c84;">DRY DOCK REPAIRS</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c84;">${q} tick${q!==1?"s":""} remaining</span>
                </div>`}if(u){k+=`<div style="margin-top:6px;">
                    <div style="padding:5px 8px;background:var(--bg-0);border:1px solid var(--border-0);margin-bottom:6px;">`;const q=[{label:"VESSEL CLASS",value:s.vessel_class},{label:"BUILT",value:"Tick "+(s.built_at_tick||0)},{label:"FUEL CAPACITY",value:(s.fuel_capacity||0).toLocaleString()+" tons"},{label:"LAST REFURBISH",value:s.last_refurbish_tick?"Tick "+s.last_refurbish_tick:"N/A"}];for(let V=0;V<q.length;V++)k+=`<div style="display:flex;justify-content:space-between;padding:2px 0;${V<3?"border-bottom:1px solid var(--border-0);":""}">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${q[V].label}</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);">${q[V].value}</span>
                    </div>`;k+="</div>";const N=h||I,P=Math.round((s.purchase_price||3e6)*.08*(1+(100-s.condition)/100)),G=Math.round((s.fuel_capacity||1e3)*50*(1-s.fuel/100)),Z=Math.round((s.purchase_price||3e6)*(s.condition/100)*.6);if(k+=`<div style="display:flex;gap:4px;">
                    <div onclick="${N?"":"flRefurbish('"+s.id+"',"+P+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${N?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${N?"var(--text-dim)":"#5c5"};border:1px solid ${N?"var(--border-0)":"#2a5a3a"};background:${N?"transparent":"rgba(74,170,136,0.06)"};opacity:${N?.35:1};">REFURBISH<br><span style="font-weight:400;font-size:6px;">${E(P)}</span></div>
                    <div onclick="${h?"":"flRefuel('"+s.id+"',"+G+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${h?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${h?"var(--text-dim)":"#c86a4a"};border:1px solid ${h?"var(--border-0)":"rgba(200,106,74,0.3)"};opacity:${h?.35:1};">REFUEL<br><span style="font-weight:400;font-size:6px;">from ${E(G)}</span></div>
                    <div onclick="${N?"":"flSell('"+s.id+"','"+y(s.vessel_name).replace(/'/g,"")+"',"+Z+")"}" style="flex:1;padding:5px 0;text-align:center;cursor:${N?"not-allowed":"pointer"};font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:${N?"var(--text-dim)":"#c84"};border:1px solid ${N?"var(--border-0)":"rgba(204,136,68,0.3)"};opacity:${N?.35:1};">LIST<br><span style="font-weight:400;font-size:6px;">${E(Z)}</span></div>
                </div>`,!h){const V=Je&&Je[s.id],ce=ut&&ut[s.id];k+='<div style="display:flex;gap:4px;margin-top:4px;">',V?k+=`<div style="flex:1;display:flex;gap:2px;">
                            <div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#5c5;border:1px solid rgba(92,204,92,0.2);background:rgba(92,204,92,0.04);">INSURED ✓</div>
                            <div onclick="event.stopPropagation();flFileClaim('${s.id}','${y(s.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#c55;border:1px solid rgba(204,85,85,0.2);background:rgba(204,85,85,0.04);">FILE CLAIM</div>
                        </div>`:ce&&(k+='<div style="flex:1;padding:4px 0;text-align:center;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:#ca5;border:1px solid rgba(202,165,50,0.2);background:rgba(202,165,50,0.04);">PENDING ⏳</div>'),k+=`<div onclick="flRename('${s.id}','${y(s.vessel_name).replace(/'/g,"")}')" style="flex:1;padding:4px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;color:var(--text-muted);border:1px solid var(--border-0);">RENAME</div>`,k+="</div>"}h&&(k+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel at sea — actions available on arrival</div>'),I&&(k+='<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">⊘ Vessel in dry dock — repairs in progress</div>'),k+="</div>"}return k+="</div></div>",k}).join("");const d={};for(const s of o)d[s.vessel_class]=(d[s.vessel_class]||0)+1;let f='<div style="display:flex;gap:6px;">';for(const[s,m]of Object.entries(Qe))d[s]&&(f+=`<div style="display:flex;align-items:center;gap:3px;">
            <div style="width:5px;height:5px;background:${m.color};border-radius:1px;"></div>
            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">${m.label}</span>
            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-muted);">${d[s]}</span>
        </div>`);f+="</div>",f+=`<span style="font-family:var(--font-mono);font-size:8px;color:#a44;">${E(c)}/tick</span>`,a.innerHTML=f}let ee=!1;async function Vo(e,t){if(ee||!p)return;const i=(le||[]).find(u=>u.id===e);if(!i)return;const a=i.current_port_nation_id||null;let o="state",n=3,l=3,r=null,c="State Dry Dock (3x cost, 3 ticks)";if(a){const{data:u}=await _.from("corp_properties").select("id").eq("faction_id",p.id).eq("nation_id",a).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();if(u)o="own",n=1,l=2,c="Your Dry Dock (base cost, 2 ticks)";else{const{data:g}=await _.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",p.id).eq("nation_id",a).eq("type","dry_dock").eq("is_active",!0).limit(1).maybeSingle();g&&(o="other",n=1.2,l=2,r=g.faction_id,c=(g.factions?.faction_name||"Another corp")+"'s Dry Dock (+20%, 2 ticks)")}}else c="State Dry Dock (3x cost, 3 ticks) — no private dock in port";const d=Math.round(t*n),{data:f}=await _.from("factions").select("corp_cash_reserves").eq("id",p.id).single(),s=Number(f?.corp_cash_reserves??0);if(s<d){alert("Insufficient cash. Need "+E(d)+", have "+E(s)+".");return}if(!confirm("Send "+(i.vessel_name||"vessel")+` to dry dock?

Dock: `+c+`
Cost: `+E(d)+`
Duration: `+l+` ticks
Condition restored to 85-100%.`))return;ee=!0;const m=M?.current_tick||0;try{const{error:u}=await _.from("factions").update({corp_cash_reserves:s-d}).eq("id",p.id);if(u){alert("Failed: "+u.message);return}if(o==="other"&&r){const b=d-t,{data:v}=await _.from("factions").select("corp_cash_reserves").eq("id",r).single();v&&await _.from("factions").update({corp_cash_reserves:Number(v.corp_cash_reserves||0)+b}).eq("id",r)}const{error:g}=await _.from("corp_vessels").update({status:"dry_dock",drydock_until_tick:m+l,active_claim_id:null}).eq("id",e);if(g){await _.from("factions").update({corp_cash_reserves:s}).eq("id",p.id),alert("Failed: "+g.message);return}p.corp_cash_reserves=s-d,await he()}catch(u){alert("Dry dock failed: "+(u.message||"Error"))}finally{ee=!1}}async function Wo(e,t){if(ee||!p)return;if(t<=0){alert("Fuel tanks are already full.");return}const i=(le||[]).find(s=>s.id===e);if(!i)return;const a=i.current_port_nation_id||p.nation_id;let o="state",n=3,l=null,r="State Fuel (3x cost) — no private depot in port";if(a){const{data:s}=await _.from("corp_properties").select("id").eq("faction_id",p.id).eq("nation_id",a).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();if(s)o="own",n=1,r="Your Fuel Depot (base cost)";else{const{data:m}=await _.from("corp_properties").select("id, faction_id, factions(faction_name)").neq("faction_id",p.id).eq("nation_id",a).eq("type","fuel_depot").eq("is_active",!0).limit(1).maybeSingle();m&&(o="other",n=1.15,l=m.faction_id,r=(m.factions?.faction_name||"Another corp")+"'s Fuel Depot (+15%)")}}const c=Math.round(t*n),{data:d}=await _.from("factions").select("corp_cash_reserves").eq("id",p.id).single(),f=Number(d?.corp_cash_reserves??0);if(f<c){alert("Insufficient cash. Need "+E(c)+", have "+E(f)+".");return}if(confirm("Refuel "+(i.vessel_name||"vessel")+`?

Source: `+r+`
Cost: `+E(c)+`
Fuel restored to 100%.`)){ee=!0;try{const{error:s}=await _.from("factions").update({corp_cash_reserves:f-c}).eq("id",p.id);if(s){alert("Failed: "+s.message);return}if(o==="other"&&l){const u=c-t,{data:g}=await _.from("factions").select("corp_cash_reserves").eq("id",l).single();g&&await _.from("factions").update({corp_cash_reserves:Number(g.corp_cash_reserves||0)+u}).eq("id",l)}const{error:m}=await _.from("corp_vessels").update({fuel:100}).eq("id",e);if(m){await _.from("factions").update({corp_cash_reserves:f}).eq("id",p.id),alert("Failed: "+m.message);return}p.corp_cash_reserves=f-c,await he()}catch(s){alert("Refuel failed: "+(s.message||"Error"))}finally{ee=!1}}}async function Yo(e,t,i){if(ee||!p||!M||!confirm("List "+t+" on the Ship Market for "+E(i)+`?

The vessel will be removed from your fleet and listed for sale. You will receive payment when another corporation purchases it.`))return;ee=!0;const a=M.current_tick||0,o=le.find(c=>c.id===e);if(!o){ee=!1;return}const n=Math.max(0,a-(o.built_at_tick||0)),{error:l}=await _.from("ship_market_listings").insert({nation_id:p.nation_id,vessel_name:o.vessel_name,vessel_class:o.vessel_class,capacity_dwt:o.capacity_dwt,capacity_unit:o.capacity_unit,condition:o.condition,fuel:o.fuel,age_ticks:n,fuel_capacity:o.fuel_capacity,base_maintenance:o.base_maintenance,asking_price:i,purchase_price_new:o.purchase_price||i,seller_type:"CORP",seller_name:p.faction_name,seller_faction_id:p.id,sale_reason:"Listed for sale by "+(p.faction_name||"corporation"),status:"available",listed_at_tick:a});if(l){alert("Failed to create listing: "+l.message),ee=!1;return}const{error:r}=await _.from("corp_vessels").delete().eq("id",e);if(r){await _.from("ship_market_listings").delete().eq("seller_faction_id",p.id).eq("vessel_name",o.vessel_name).eq("listed_at_tick",a),alert("Failed to remove vessel: "+r.message),ee=!1;return}ee=!1,at=null,await Promise.all([he(),la()])}async function Qo(e,t){const i=prompt("Rename vessel:",t);if(!i||i.trim()===t||i.trim().length<2)return;const{error:a}=await _.from("corp_vessels").update({vessel_name:i.trim().slice(0,40)}).eq("id",e);if(a){alert("Failed: "+a.message);return}await he()}let Ht=!1;async function Ko(e,t){if(Ht||!p||!M)return;const i=prompt(`Describe the claim reason:

e.g., "Storm damage during transit — hull breach repaired at sea" or "Engine failure requiring emergency dry dock"`);if(!i||i.trim().length<5)return;const a=M.current_tick||0,{data:o}=await _.from("finance_active_loans").select("id, lender_faction_id, principal, deductible_pct").eq("insured_vessel_id",e).eq("status","current").limit(1).maybeSingle();if(!o){alert("No active insurance policy found for this vessel.");return}const n=Number(o.principal||0),l=Number(o.deductible_pct||10),r=Math.round(n*l/100);if(!confirm("File insurance claim for "+t+`?

Coverage: `+E(n)+`
Deductible: `+l+"% ("+E(r)+`)

Reason: `+i.trim()+`

The insurer will review this claim and determine the payout.`))return;Ht=!0;const{error:c}=await _.from("event_log").insert({nation_id:p.nation_id,faction_id:p.id,event_name:(p.faction_name||"Corporation")+" — Insurance Claim Filed",description_used:(p.faction_name||"A shipping corporation")+" has filed an insurance claim for vessel "+t+". Reason: "+i.trim().replace(/[<>"]/g,""),category:"business",trigger_key:"vessel_insurance_claim",effects_applied:{vessel_id:e,vessel_name:t,policy_id:o.id,insurer_faction_id:o.lender_faction_id,coverage:n,deductible_pct:l,claim_reason:i.trim()},fired_at_tick:a});c&&console.warn("Failed to log insurance claim event:",c.message);const{error:d}=await _.from("finance_active_loans").update({claims_paid:(o.claims_paid||0)+1}).eq("id",o.id);d&&console.warn("Failed to update claims_paid:",d.message),Ht=!1,alert("Insurance claim filed for "+t+`.

The insurer (`+E(n)+" coverage) has been notified. Claim details are visible in the events feed.")}window.flFileClaim=Ko;const si={fuel_depot:{label:"FUEL DEPOT",color:"#c86a4a",icon:"⛽",desc:"Bunkering facility — refuel at base cost, earn revenue from visiting fleets."},dry_dock:{label:"DRY DOCK",color:"#c84",icon:"🔧",desc:"Repair & maintenance dock — dock at base cost, earn revenue from visiting fleets."}},pt=[{type:"fuel_depot",name:"Fuel Depot — Standard",cost:105e6,maint:85e3,style:"Basic",desc:"Bulk fuel storage and bunkering facility."},{type:"fuel_depot",name:"Fuel Depot — Advanced",cost:14e7,maint:11e4,style:"Modern",desc:"High-capacity fuel terminal with pipeline infrastructure."},{type:"dry_dock",name:"Dry Dock — Standard",cost:85e6,maint:15e4,style:"Basic",desc:"Ship repair and maintenance facility."},{type:"dry_dock",name:"Dry Dock — Advanced",cost:115e6,maint:2e5,style:"Modern",desc:"Full-service shipyard with drydock and crane facilities."}];let bt=[];async function Jo(){if(!p||p.corp_sector!=="Shipping")return;const{data:e}=await _.from("corp_properties").select("*, nations!nation_id(name)").eq("faction_id",p.id).in("type",["fuel_depot","dry_dock"]).eq("is_active",!0).order("created_at",{ascending:!1});bt=e||[],Xo()}function Xo(){const e=document.getElementById("pf-count"),t=document.getElementById("pf-list"),i=document.getElementById("pf-footer");if(!e||!t||!i)return;const a=bt;if(e.textContent=a.length+" FACILIT"+(a.length===1?"Y":"IES"),a.length===0)t.innerHTML=`<div style="padding:20px;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-bottom:6px;">No port facilities built.</div>
            <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Build a <span style="color:#c86a4a;font-weight:700;">Fuel Depot</span> to refuel your fleet at base cost<br>and earn revenue from other corps refueling here.<br>Build a <span style="color:#c84;font-weight:700;">Dry Dock</span> to repair vessels at base cost.</div>
        </div>`;else{let l=0;t.innerHTML=a.map(r=>{const c=si[r.type]||si.fuel_depot,d=r.condition>=75?"#5c5":r.condition>=50?"#ca5":"#c84";return l+=Number(r.monthly_maintenance||0),`<div style="padding:8px 12px;border-bottom:1px solid var(--border-0);">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${c.icon}</span>
                        <span style="font-size:11px;font-weight:600;color:var(--text-bright);">${y(r.name)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:1px 5px;color:${c.color};background:${c.color}12;border:1px solid ${c.color}25;">${c.label}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:4px;">${y(r.nations?.name||"Unknown Nation")} · ${y(r.city||"Port")} · ${(r.style||"Basic").toUpperCase()}</div>
                <div style="display:flex;gap:12px;margin-bottom:4px;">
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CONDITION</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${d};">${r.condition}%</span>
                        </div>
                        <div style="width:100%;height:3px;background:var(--border-0);"><div style="width:${r.condition}%;height:100%;background:${d};"></div></div>
                    </div>
                    <div style="flex:1;">
                        <div style="display:flex;justify-content:space-between;margin-bottom:2px;">
                            <span style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">MAINT / TICK</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:#a44;">${E(r.monthly_maintenance||0)}</span>
                        </div>
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">VALUE: ${E(r.purchase_price||0)}</div>
                    </div>
                </div>
            </div>`}).join("")}Number(p?.corp_cash_reserves??0);const o=a.some(l=>l.type==="fuel_depot"),n=a.some(l=>l.type==="dry_dock");i.innerHTML=`
        <div onclick="pfOpenBuild('fuel_depot')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c86a4a;border:1px solid rgba(200,106,74,0.3);background:rgba(200,106,74,0.04);">
            ${o?"+ FUEL DEPOT":"BUILD FUEL DEPOT"}
        </div>
        <div onclick="pfOpenBuild('dry_dock')" style="flex:1;padding:5px 0;text-align:center;cursor:pointer;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:#c84;border:1px solid rgba(204,136,68,0.3);background:rgba(204,136,68,0.04);">
            ${n?"+ DRY DOCK":"BUILD DRY DOCK"}
        </div>`}let Gt=!1;async function Zo(e){if(Gt||!p||!M)return;const t=pt.filter(v=>v.type===e);if(t.length===0)return;const i=si[e],a=p.nation_id,o=L?.name||p?.nation||"Home Nation",n=L?.capital||"Port City",l=[{id:a,name:o,capital:n,label:"National HQ"}],{data:r}=await _.from("corp_properties").select("nation_id, name, city, nations!nation_id(name, capital)").eq("faction_id",p.id).eq("type","regional_hq").eq("is_active",!0);for(const v of r||[])v.nation_id!==a&&l.push({id:v.nation_id,name:v.nations?.name||v.city||"Unknown",capital:v.nations?.capital||v.city||"Port City",label:v.name||"Subsidiary"});let c=l[0];if(l.length>1){let v=i.label+` — SELECT LOCATION
`+"─".repeat(30)+`
`;v+=`Build in which nation?

`;for(let h=0;h<l.length;h++){const I=l[h],C=bt.filter(w=>w.type===e&&w.nation_id===I.id).length;v+=h+1+". "+I.name+"  ("+I.label+")",C>0&&(v+="  ["+C+" existing]"),v+=`
`}v+=`
Enter number (or cancel):`;const x=prompt(v);if(!x)return;const $=parseInt(x,10)-1;if(isNaN($)||$<0||$>=l.length){alert("Invalid selection.");return}c=l[$]}const d=bt.filter(v=>v.type===e&&v.nation_id===c.id).length;let f=i.label+" CONSTRUCTION — "+c.name.toUpperCase()+`
`+"─".repeat(30)+`
`;d>0&&(f+="You already have "+d+" "+i.label.toLowerCase()+(d>1?"s":"")+` here.

`),f+=i.desc+`

`;for(let v=0;v<t.length;v++){const x=t[v];f+=v+1+". "+x.name+`
`,f+="   Cost: "+E(x.cost)+" · Maint: "+E(x.maint)+`/tick
`,f+="   "+x.desc+`

`}f+="Enter 1 or 2 to select (or cancel):";const s=prompt(f);if(!s)return;const m=parseInt(s,10)-1;if(isNaN(m)||m<0||m>=t.length){alert("Invalid selection.");return}const u=t[m];if(!confirm("Commission "+u.name+" in "+c.capital+", "+c.name+`?

Budget: `+E(u.cost)+`

This will create a construction contract that construction corporations can bid on. Payment occurs when the contract is awarded.`))return;Gt=!0;const g=M.current_tick||0,b=(M.current_date||"").match(/\d{4}/)?.[0]||"2015";try{const{count:v}=await _.from("construction_contracts").select("id",{count:"exact",head:!0}).eq("nation_id",c.id).eq("issuer_type","PRIVATE"),$=`PVT-P${(v||0)+1}-${b}`,h=u.style==="Modern",I={concrete:h?60:40,steel:h?50:30,heavy_parts:h?30:20,aggregate:h?30:20},C={trucks:5,mixers:5,excavators:5},w={general:h?240:160,skilled:h?100:60},k=h?6:4,{error:S}=await _.from("construction_contracts").insert({nation_id:c.id,template_key:e,sector:"industrial",name:u.name,project_type:i.label,project_subtype:u.style,description:`${u.name} at ${c.capital} Port — commissioned by ${p.faction_name}. ${u.desc}`,project_code:$,budget_ceiling:u.cost,timeline_ticks:k,required_materials:I,required_equipment:C,required_workforce:w,status:"open",generated_at_tick:g,bidding_ends_tick:g+3,issuer_type:"PRIVATE",issuer_name:p.faction_name,issuer_faction_id:p.id});if(S)throw S;await Jo(),alert(`Construction contract posted!

Project: `+u.name+`
Location: `+c.capital+", "+c.name+`
Code: `+$+`
Budget: `+E(u.cost)+`
Timeline: `+k+` ticks

Construction corporations in `+c.name+" can now bid on this project.")}catch(v){alert("Failed to post contract: "+(v.message||"Error"))}finally{Gt=!1}}window.pfOpenBuild=Zo;const Ti={"Bulk Cargo":["Reefer","Bulk","Coastal"],"Container Freight":["Coastal","Container"],"Specialized Transport":["Tanker","LNG","Bulk"]};async function la(){if(!p||p.corp_sector!=="Shipping")return;const{data:e,error:t}=await _.from("ship_market_listings").select("*, nation:nation_id(id, name)").eq("status","available").order("asking_price",{ascending:!0});t&&console.warn("Failed to load ship market:",t.message),di=e||[],yt=null,ca()}function en(e){yt=yt===e?null:e,ca()}function tn(e){return(Ti[p?.corp_subsector]||[]).includes(e)}function ca(){const e=document.getElementById("sm-count"),t=document.getElementById("sm-list"),i=document.getElementById("sm-footer");if(!e||!t)return;const a=di;e.textContent=a.length+" AVAILABLE",a.length===0?t.innerHTML='<div style="flex:1;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;line-height:1.8;">No vessels on the market.<br>Check back next cycle.</div>':t.innerHTML=a.map((l,r)=>{const c=yt===r,d=Qe[l.vessel_class]||{color:"#666",label:"?"},f=l.seller_type==="CORP"?"#5a8aaa":"#8b9a6b",s=sa(l.condition),m=l.nation?.name||"—",u=tn(l.vessel_class);M?.current_tick;const g=l.age_ticks||0,b=Math.max(1,Math.floor(g/12)),v=m!==p?.nation?Number(p?.tariffs||L?.tariffs||0):0,x=Math.round(l.asking_price*v/100),$=l.asking_price+x;let h=`<div onclick="smSelectListing(${r})" style="border-bottom:1px solid var(--border-0);cursor:pointer;border-left:2px solid ${c?d.color:"transparent"};background:${c?d.color+"06":"transparent"};">
                <div style="padding:8px 14px;">`;return h+=`<div style="display:flex;align-items:center;gap:5px;margin-bottom:3px;">
                <span style="font-size:11px;font-weight:600;color:var(--text-bright);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${y(l.vessel_name)}</span>
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${d.color};background:${d.color}12;border:1px solid ${d.color}25;">${d.label}</span>
            </div>`,h+=`<div style="display:flex;align-items:center;gap:4px;margin-bottom:5px;">
                <span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:0 4px;line-height:11px;color:${f};background:${f}12;border:1px solid ${f}25;">${l.seller_type}</span>
                <span style="font-size:9px;color:var(--text-muted);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${y(l.seller_name||"—")}</span>
                <span style="font-family:var(--font-mono);font-size:7px;padding:0 4px;color:#8b9a6b;background:rgba(139,154,107,0.08);border:1px solid rgba(139,154,107,0.15);line-height:12px;">${m.toUpperCase().slice(0,6)}</span>
                ${v>0?`<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">+${v}%</span>`:""}
            </div>`,h+=`<div style="display:flex;gap:0;background:var(--bg-3);border:1px solid var(--border-0);">
                <div style="flex:1;padding:3px 6px;border-right:1px solid var(--border-0);">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">CAPACITY</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);margin-top:1px;">${(l.capacity_dwt||0).toLocaleString()} ${l.capacity_unit||"DWT"}</div>
                </div>
                <div style="flex:0.6;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">COND</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${s};margin-top:1px;">${l.condition}%</div>
                </div>
                <div style="flex:0.5;padding:3px 6px;border-right:1px solid var(--border-0);text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">AGE</div>
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-muted);margin-top:1px;">${b}yr</div>
                </div>
                <div style="flex:1;padding:3px 6px;text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.5px;">PRICE</div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--gold);margin-top:1px;">${E(l.asking_price)}</div>
                </div>
            </div>`,c&&(h+='<div style="margin-top:6px;">',h+=`<div style="padding:4px 8px;margin-bottom:5px;background:var(--bg-0);border:1px solid var(--border-0);">
                    <div style="display:flex;justify-content:space-between;padding:2px 0;border-bottom:1px solid var(--border-0);">
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">CARRIES</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${d.color};">${(Qe[l.vessel_class]||{}).label||"?"} class cargo</span>
                    </div>
                    <div style="padding:3px 0;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-bottom:1px;">REASON FOR SALE</div>
                        <div style="font-size:9px;color:var(--text-muted);line-height:1.4;">${y(l.sale_reason||"—")}</div>
                    </div>
                </div>`,h+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;">
                    <div style="width:40px;height:3px;background:var(--border-0);"><div style="width:${l.condition}%;height:100%;background:${s};"></div></div>
                    ${l.condition<60?'<span style="font-family:var(--font-mono);font-size:7px;color:#c84;">May need dry dock</span>':""}
                </div>`,v>0&&(h+=`<div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:8px;margin-bottom:3px;">
                        <span style="color:var(--text-dim);">Import tariff (${v}%)</span>
                        <span style="color:#c84;">+${E(x)}</span>
                    </div>
                    <div style="display:flex;justify-content:space-between;padding:2px 0;font-family:var(--font-mono);font-size:9px;font-weight:700;margin-bottom:5px;">
                        <span style="color:var(--text-bright);">TOTAL</span>
                        <span style="color:var(--gold);">${E($)}</span>
                    </div>`),u?h+=`<div onclick="event.stopPropagation();smPurchase('${l.id}',${$})" style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:1px;color:#000;background:${d.color};cursor:pointer;">${E($)} — PURCHASE</div>`:h+=`<div style="padding:4px 14px;text-align:center;font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.5px;color:var(--text-dim);border:1px solid var(--border-0);opacity:0.4;">⊘ ${l.vessel_class} not available for ${p?.corp_subsector||"your subsector"}</div>`,h+="</div>"),h+="</div></div>",h}).join("");const o=a.filter(l=>l.seller_type==="CORP").length,n=a.filter(l=>l.seller_type==="LOCAL").length;i.innerHTML=`<div style="display:flex;gap:6px;">
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
    <div onclick="smOpenCommission()" style="padding:4px 14px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--gold);border:1px solid rgba(200,168,50,0.3);cursor:pointer;">COMMISSION VESSEL</div>`}let je=!1;async function an(e,t){if(je||!p||!M)return;const i=Number(p.corp_cash_reserves??0);if(i<t){alert("Insufficient cash. Need "+E(t)+".");return}if(!confirm("Purchase this vessel for "+E(t)+"?"))return;je=!0;const a=di.find(f=>f.id===e);if(!a){je=!1;return}const o=M.current_tick||0,n=ft[a.vessel_class]||ft.Coastal,{error:l}=await _.from("factions").update({corp_cash_reserves:i-t}).eq("id",p.id);if(l){alert("Failed: "+l.message),je=!1;return}const{error:r}=await _.from("corp_vessels").insert({faction_id:p.id,nation_id:p.nation_id,vessel_name:a.vessel_name,vessel_class:a.vessel_class,condition:a.condition,fuel:a.fuel||50,status:"in_port",capacity_dwt:a.capacity_dwt||n.capacity_dwt,capacity_unit:a.capacity_unit||n.capacity_unit,base_maintenance:a.base_maintenance||n.base_maintenance,fuel_capacity:a.fuel_capacity||n.fuel_capacity,purchase_price:t,built_at_tick:o-(a.age_ticks||0),current_port_nation_id:p.nation_id});if(r){await _.from("factions").update({corp_cash_reserves:i}).eq("id",p.id),alert("Failed to create vessel: "+r.message),je=!1;return}var{error:c}=await _.from("ship_market_listings").update({status:"sold",purchased_by:p.id,purchased_at_tick:o}).eq("id",e);if(c&&console.warn("Failed to mark listing as sold:",c.message),a.seller_faction_id){const{data:f}=await _.from("factions").select("corp_cash_reserves").eq("id",a.seller_faction_id).single();if(f){var{error:d}=await _.from("factions").update({corp_cash_reserves:Number(f.corp_cash_reserves||0)+a.asking_price}).eq("id",a.seller_faction_id);d&&console.warn("Failed to credit seller:",d.message)}}p.corp_cash_reserves=i-t,je=!1,await Promise.all([he(),la()])}const et=[{cls:"Coastal",baseCost:12e6,baseBuild:3,cargo:"Bulk, Containers (coastal)"},{cls:"Container",baseCost:65e6,baseBuild:5,cargo:"Manufactured, Tech, General"},{cls:"Bulk",baseCost:38e6,baseBuild:4,cargo:"Minerals, Aggregate, Military"},{cls:"Tanker",baseCost:52e6,baseBuild:5,cargo:"Fuel, Petroleum, Chemicals"},{cls:"Reefer",baseCost:45e6,baseBuild:4,cargo:"Food, Perishables, Agriculture"},{cls:"LNG",baseCost:78e6,baseBuild:6,cargo:"Liquefied Natural Gas only"}];let ae="Coastal",st=0,rt="",ze=[];function on(){ae=(Ti[p?.corp_subsector]||["Coastal"])[0],st=0,rt="",ze=[],document.getElementById("comm-overlay").style.display="flex",nn()}async function nn(){const{data:e}=await _.from("nations").select("id, name, manufacturing_output, physical_infrastructure, tariffs").order("name");ze=(e||[]).map(t=>{const i=Number(t.manufacturing_output??50),a=Math.round((.75+i/100*.5)*100)/100,o=Math.round((1.5-i/100*.65)*100)/100,n=t.id===p?.nation_id;return{id:t.id,name:t.name,mfg:i,costMod:a,buildMod:o,isHome:n,tariffs:Number(t.tariffs??0)}}),ze.sort((t,i)=>(i.isHome?1:0)-(t.isHome?1:0)),Ci()}function da(){document.getElementById("comm-overlay").style.display="none"}function sn(e){ae=e,Ci()}function rn(e){st=e,Ci()}function ln(e){rt=e}function Ci(){const e=document.getElementById("comm-content");if(!e)return;const t=M?.current_tick||0,i=et.find(g=>g.cls===ae)||et[0],a=ze[st]||{name:"—",costMod:1,buildMod:1},o=Qe[ae]||{color:"#666"},n=Math.round(i.baseCost*a.costMod),l=Math.max(2,Math.round(i.baseBuild*a.buildMod)),r=Math.round(n*.5),c=n-r,d=t+l,f=Ti[p?.corp_subsector]||[];let s="";s+=`<div style="padding:10px 16px;border-bottom:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;">
        <div style="display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;align-items:center;gap:6px;">
                <span style="font-size:8px;color:#c8a832;">&#9679;</span>
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:2px;color:#9e9a92;text-transform:uppercase;">Commission Vessel</span>
            </div>
            <span onclick="smCloseCommission()" style="font-family:var(--font-mono);font-size:14px;color:#6a6660;cursor:pointer;">&#215;</span>
        </div>
    </div>`,s+='<div style="flex:1;overflow-y:auto;">',s+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Vessel Type</div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:3px;">`;for(const g of et){const b=Qe[g.cls]||{color:"#666",label:"?"},v=ae===g.cls,x=f.includes(g.cls);s+=`<div onclick="${x?"commSetClass('"+g.cls+"')":""}" style="padding:5px 4px;text-align:center;cursor:${x?"pointer":"not-allowed"};background:${v?b.color+"18":"transparent"};border:1px solid ${v?b.color+"44":"var(--panel-border)"};opacity:${x?1:.3};">
            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:${v?b.color:"#6a6660"};">${b.label}</div>
            <div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;margin-top:2px;">${E(g.baseCost)} base</div>
        </div>`}s+="</div>",s+=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:${o.color};">${i.cargo}</div>`,s+="</div>",s+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Origin Shipyard</div>`;for(let g=0;g<ze.length;g++){const b=ze[g],v=st===g,x=b.costMod>1?"#c84":b.costMod<1?"#5c5":"#6a6660",$=b.buildMod>1?"#c84":b.buildMod<1?"#5c5":"#6a6660";s+=`<div onclick="commSetNation(${g})" style="display:flex;align-items:center;padding:5px 8px;margin-bottom:2px;cursor:pointer;background:${v?"rgba(139,154,107,0.04)":"transparent"};border:1px solid ${v?"#8b9a6b44":"var(--panel-border)"};border-left:2px solid ${v?"#8b9a6b":"transparent"};">
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
                <div style="text-align:center;"><div style="font-family:var(--font-mono);font-size:6px;color:#6a6660;">SPEED</div><div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${$};">×${b.buildMod.toFixed(2)}</div></div>
            </div>
        </div>`}s+="</div>",s+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:4px;">Vessel Name</div>
        <input id="comm-name-input" value="${y(rt)}" oninput="commSetName(this.value)" placeholder="e.g., MV 'Sierra Nevada'" style="width:100%;padding:6px 10px;font-family:var(--font-mono);font-size:11px;color:var(--panel-text);background:var(--bg-panel);border:1px solid var(--panel-border);outline:none;box-sizing:border-box;" />
    </div>`,s+=`<div style="padding:8px 16px;border-bottom:1px solid var(--panel-border);">
        <div style="font-family:var(--font-mono);font-size:8px;color:#6a6660;letter-spacing:1px;text-transform:uppercase;margin-bottom:6px;">Build Summary</div>
        <div style="background:var(--bg-panel);border:1px solid var(--panel-border);padding:6px 10px;">`;const m=[{label:"VESSEL CLASS",value:ae,color:o.color},{label:"SHIPYARD",value:a.name,color:"#9e9a92"},{label:"BASE COST",value:E(i.baseCost)+" × "+a.costMod.toFixed(2),color:"#9e9a92"},{label:"BUILD TIME",value:l+" ticks",color:l>i.baseBuild?"#c84":l<i.baseBuild?"#5c5":"#9e9a92"},{label:"COMPLETION",value:"~Tick "+d,color:"#9e9a92"}];for(const g of m)s+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
            <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">${g.label}</span>
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${g.color};">${g.value}</span>
        </div>`;s+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid var(--panel-border);">
        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--panel-text);">TOTAL COST</span>
        <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c8a832;">${E(n)}</span>
    </div>`,s+=`<div style="display:flex;justify-content:space-between;padding:3px 0;border-bottom:1px solid var(--panel-border);">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">DEPOSIT (50% NOW)</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c55;">${E(r)}</span>
    </div>`,s+=`<div style="display:flex;justify-content:space-between;padding:3px 0;">
        <span style="font-family:var(--font-mono);font-size:8px;color:#6a6660;">BALANCE ON COMPLETION</span>
        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:#c84;">${E(c)}</span>
    </div>`,s+="</div></div>",s+=`<div style="padding:6px 16px;">
        <div style="padding:5px 8px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);">
            <div style="font-family:var(--font-mono);font-size:8px;color:#c8a832;margin-bottom:2px;">PAYMENT TERMS</div>
            <div style="font-size:9px;color:#6a6660;line-height:1.5;">50% deposit due immediately. Remaining 50% due on delivery at tick ${d}. Vessel delivered at 100% condition, fully fueled, to your nearest port. Cancellation forfeits deposit.</div>
        </div>
    </div>`,s+="</div>";const u=rt.trim().length>=2;s+=`<div style="padding:10px 16px;border-top:1px solid var(--panel-border);background:var(--bg-panel);flex-shrink:0;display:flex;justify-content:space-between;align-items:center;">
        <div>
            <div style="font-family:var(--font-mono);font-size:7px;color:#6a6660;">DEPOSIT DUE NOW</div>
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:#c55;">${E(r)}</div>
        </div>
        <div style="display:flex;gap:6px;">
            <div onclick="smCloseCommission()" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:#6a6660;border:1px solid var(--panel-border);cursor:pointer;">CANCEL</div>
            <div id="comm-order-btn" onclick="${u?"smPlaceOrder()":""}" style="padding:5px 16px;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:${u?"#000":"#6a6660"};background:${u?"#c8a832":"transparent"};border:1px solid ${u?"#c8a832":"var(--panel-border)"};cursor:${u?"pointer":"default"};opacity:${u?1:.4};">PLACE ORDER</div>
        </div>
    </div>`,e.innerHTML=s}let Ke=!1;async function cn(){if(Ke||!p||!M)return;const e=rt.trim();if(e.length<2)return;const t=et.find(b=>b.cls===ae)||et[0],i=ze[st];if(!i)return;const a=Math.round(t.baseCost*i.costMod),o=Math.max(2,Math.round(t.baseBuild*i.buildMod)),n=Math.round(a*.5),l=a-n,r=M.current_tick||0,c=Number(p.corp_cash_reserves??0);if(c<n){alert("Insufficient cash for deposit. Need "+E(n)+".");return}if(!confirm("Commission "+ae+" from "+i.name+`?

Deposit: `+E(n)+` (non-refundable)
Balance: `+E(l)+" on delivery at tick "+(r+o)))return;Ke=!0;const d=document.getElementById("comm-order-btn");d&&(d.style.opacity="0.4",d.style.pointerEvents="none");const{error:f}=await _.from("factions").update({corp_cash_reserves:c-n}).eq("id",p.id);if(f){alert("Failed: "+f.message),Ke=!1;return}const{data:s}=await _.from("nations").select("budget_reserves").eq("id",i.id).single();if(s){var{error:m}=await _.from("nations").update({budget_reserves:Number(s.budget_reserves||0)+n}).eq("id",i.id);m&&console.warn("Failed to credit shipyard nation budget:",m.message)}const u=ft[ae]||ft.Coastal,{error:g}=await _.from("vessel_orders").insert({faction_id:p.id,vessel_name:e,vessel_class:ae,capacity_dwt:u.capacity_dwt,capacity_unit:u.capacity_unit,base_maintenance:u.base_maintenance,fuel_capacity:u.fuel_capacity,purchase_price:t.baseCost,shipyard_nation_id:i.id,shipyard_nation:i.name,cost_modifier:i.costMod,build_modifier:i.buildMod,total_cost:a,deposit_paid:n,balance_due:l,ordered_at_tick:r,delivery_tick:r+o,build_ticks:o,status:"building"});if(g){await _.from("factions").update({corp_cash_reserves:c}).eq("id",p.id),alert("Failed to place order: "+g.message),Ke=!1;return}p.corp_cash_reserves=c-n,Ke=!1,da(),alert(e+` commissioned!

Class: `+ae+`
Shipyard: `+i.name+`
Deposit: `+E(n)+`
Delivery: Tick `+(r+o))}window.smSelectListing=en;window.smPurchase=an;window.smOpenCommission=on;window.smCloseCommission=da;window.commSetClass=sn;window.commSetNation=rn;window.commSetName=ln;window.smPlaceOrder=cn;window.flSelectVessel=Go;window.flRefurbish=Vo;window.flRefuel=Wo;window.flSell=Yo;window.flRename=Qo;window.openBidReview=Bo;window.closeBidReview=Ct;window.reviewSelectBid=Do;window.acceptBid=jo;window.declineAllBids=Uo;window.toggleDlExpand=uo;qo();
