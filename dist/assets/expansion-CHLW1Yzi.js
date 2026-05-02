const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-BOR6jYkY.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as l}from"./supabase-client-qEAQbBjE.js";/* empty css                    *//* empty css                         */import{_ as G}from"./preload-helper-BXl3LOEh.js";import{hfFmtBig as m,escapeHtml as u}from"./utils-A98FEun4.js";const j=3e8,P=500;function R(t){const e=Math.max(0,Math.min(100,Number(t)||0));return Math.round(5e7+25e6*(e/100))}function F(t){return Math.round(Number(t)*.005)}function D(t){const e=Math.max(0,Math.min(100,Number(t)||50));return Math.round(70+e*.3)}function L(t){const e=Math.max(0,Math.min(100,Number(t)||0));return Math.max(.5,Math.min(2,e/50))}function O(t){return Math.round(j*L(t))}let r=null,v=null,y=null,w=[],f=[],E=[],x=[],$=new Set,M=new Set,q=new Set;function Y(t){const e=document.getElementById("loading");e.textContent=t,e.style.color="var(--ex-accent-red)"}function p(t,e){document.querySelectorAll(".ex-toast").forEach(s=>s.remove());const n=document.createElement("div");n.className="ex-toast"+(e?" "+e:""),n.textContent=t,document.body.appendChild(n),setTimeout(()=>{n.classList.add("fade"),setTimeout(()=>n.remove(),280)},3e3)}function Q(t){const e=Number(t)||0;return e<50?"bad":e<75?"warn":""}function z(t){const e=String(t||"Basic").toLowerCase();return e==="modern"?"modern":e==="premium"||e==="innovative"?"premium":e==="heritage"||e==="sustainable"?"heritage":"basic"}async function C(){if(!r?.id){f=[];return}const{data:t,error:e}=await l.from("corp_properties").select("id, nation_id, name, type, style, catalog_id, condition, purchase_price, monthly_maintenance, city, capacity, nations:nation_id(name)").eq("faction_id",r.id).eq("is_active",!0).eq("type","regional_hq").order("purchased_at_tick",{ascending:!1});if(e){console.warn("[Expansion] regional HQ fetch failed:",e.message),f=[];return}f=t||[]}async function J(){const{data:t,error:e}=await l.from("nations").select("id, name, capital, standard_of_living, gdp_growth, control").order("name",{ascending:!0});if(e){console.warn("[Expansion] nations fetch failed:",e.message),E=[];return}E=t||[]}async function A(){if(!r?.nation_id){x=[];return}const{data:t,error:e}=await l.from("available_properties").select("*").eq("nation_id",r.nation_id).eq("status","available").order("price",{ascending:!0});if(e){console.warn("[Expansion] marketplace fetch failed:",e.message),x=[];return}x=t||[]}function K(){document.getElementById("ex-page-eyebrow").textContent="— "+(r?.corp_sector||"Corporation")+" —";const t=1+new Set(f.map(c=>c.nation_id).filter(c=>c&&c!==r?.nation_id)).size,e=1+f.length,n=Number(v?.standard_of_living??50),s=R(n),i=F(s)+f.reduce((c,d)=>c+(Number(d.monthly_maintenance)||0),0),o=s+f.reduce((c,d)=>c+(Number(d.purchase_price)||0),0);document.getElementById("ex-stat-nations").textContent=String(t),document.getElementById("ex-stat-properties").textContent=String(e),document.getElementById("ex-stat-maint").innerHTML=m(i),document.getElementById("ex-assets-desc").textContent=`${e} ${e===1?"Property":"Properties"} ◊ ${m(o)} Total Value`}function B(){const t=document.getElementById("ex-assets-grid");if(!t)return;const e=[];if(v){const n=Number(v.standard_of_living??50),s=R(n),a=F(s),i=D(v.control);e.push(`<div class="ex-asset-card kind-hq">
            <div class="ex-asset-meta-row">
                <span class="ex-asset-tag kind-hq">National HQ</span>
            </div>
            <div class="ex-asset-name">${u((r.faction_name||"Corporation")+" Headquarters")}</div>
            <div class="ex-asset-location"><span class="flag">◊</span> ${u((v.name||"").toUpperCase())}${v.capital?" ◊ "+u(String(v.capital).toUpperCase()):""}</div>
            <div class="ex-asset-stats">
                <div>
                    <div class="label">Quality</div>
                    <div class="value ${Q(i)}">${i}<span class="unit">%</span></div>
                </div>
                <div>
                    <div class="label">Value</div>
                    <div class="value">${m(s)}</div>
                </div>
                <div>
                    <div class="label">Maint/Tick</div>
                    <div class="value">${m(a)}</div>
                </div>
            </div>
            <div class="ex-asset-note">Home Operation ◊ Cannot Be Sold</div>
        </div>`)}for(const n of f){const s=M.has(n.id),a=Math.round(Number(n.condition)||0),i=Number(n.purchase_price)||0,o=Number(n.monthly_maintenance)||0,c=n.nations?.name||"—",d=n.city||"";e.push(`<div class="ex-asset-card">
            <div class="ex-asset-meta-row">
                <span class="ex-asset-tag kind-regional">Regional HQ</span>
            </div>
            <div class="ex-asset-name">${u(n.name||"Regional HQ")}</div>
            <div class="ex-asset-location"><span class="flag">◊</span> ${u(c.toUpperCase())}${d?" ◊ "+u(String(d).toUpperCase()):""}</div>
            <div class="ex-asset-stats">
                <div>
                    <div class="label">Quality</div>
                    <div class="value ${Q(a)}">${a}<span class="unit">%</span></div>
                </div>
                <div>
                    <div class="label">Value</div>
                    <div class="value">${m(i)}</div>
                </div>
                <div>
                    <div class="label">Maint/Tick</div>
                    <div class="value">${m(o)}</div>
                </div>
            </div>
            <div class="ex-asset-actions">
                <button class="ex-asset-btn danger" data-action="sell" data-id="${u(n.id)}" ${s?"disabled":""}>
                    ${s?"Selling…":"Sell"}
                </button>
            </div>
        </div>`)}t.innerHTML=e.join("")}function S(){const t=document.getElementById("ex-build-table");if(!t)return;const e=new Set(f.map(i=>i.nation_id)),n=r?.nation_id,s=Number(r?.corp_cash_reserves||0),a=[];if(a.push(`<div class="ex-nation-table-head">
        <div>Nation</div>
        <div>SoL</div>
        <div class="ex-nation-cell gdp">GDP</div>
        <div class="ex-nation-cell mult">Multiplier</div>
        <div>Total Cost</div>
        <div></div>
    </div>`),E.length===0){a.push('<div class="ex-nation-row empty">No nations available.</div>'),t.innerHTML=a.join("");return}for(const i of E){const o=Number(i.standard_of_living??50),c=Number(i.gdp_growth??0),d=L(o),h=O(o),_=i.id===n,b=e.has(i.id),I=$.has(i.id);let g,H="ex-nation-row",N="ex-nation-cell cost";_?(g='<button class="ex-build-btn disabled" disabled>Home Nation</button>',H+=" owned",N+=" unset"):b?(g='<button class="ex-build-btn disabled" disabled>Owned</button>',H+=" owned",N+=" unset"):I?g='<button class="ex-build-btn disabled" disabled>Building…</button>':s<h?(g='<button class="ex-build-btn unaffordable" disabled>Insufficient</button>',N+=" expensive"):g=`<button class="ex-build-btn" data-action="build" data-id="${u(i.id)}">Build ▸</button>`;const U=_||b?"—":m(h),V=(c>=0?"+":"")+c.toFixed(1)+"%";a.push(`<div class="${H}">
            <div class="ex-nation-name"><span class="flag">◊</span> ${u(i.name||"—")}${_?' <span class="home-tag">[HOME]</span>':""}</div>
            <div class="ex-nation-cell">SoL ${Math.round(o)}</div>
            <div class="ex-nation-cell gdp">${u(V)}</div>
            <div class="ex-nation-cell mult">×${d.toFixed(2)}</div>
            <div class="${N}">${u(U)}</div>
            <div class="ex-nation-action">${g}</div>
        </div>`)}t.innerHTML=a.join("")}function T(){const t=document.getElementById("ex-buy-grid");if(!t)return;if(x.length===0){t.innerHTML='<div class="ex-property-grid-empty">No properties on the market right now in your home nation. Listings refresh per tick.</div>';return}const e=Number(r?.corp_cash_reserves||0);t.innerHTML=x.map(n=>{const s=q.has(n.id),a=z(n.style),i=Number(n.price)||0,o=Number(n.monthly_maintenance)||0,c=Number(n.capacity)||0,d=Math.round(Number(n.condition)||0),h=d<60?"warn":d<40?"bad":"",_=e>=i,b=s?'<button class="ex-property-btn primary" disabled>Buying…</button>':_?`<button class="ex-property-btn primary" data-action="buy" data-id="${u(n.id)}">Purchase ▸</button>`:'<button class="ex-property-btn unaffordable" disabled>Insufficient</button>';return`<div class="ex-property-card">
            <div class="ex-property-meta-row">
                <span class="ex-property-tier ${a}">${u((n.style||"Basic").toUpperCase())}</span>
                <span class="ex-property-condition ${h}">CONDITION ${d}%</span>
            </div>
            <div class="ex-property-name">${u(n.name||"Property")}</div>
            <div class="ex-property-loc"><span class="flag">◊</span> ${u((v?.name||"—").toUpperCase())}${n.city?" ◊ "+u(String(n.city).toUpperCase()):""}</div>
            <div class="ex-property-stats">
                <div>
                    <div class="label">Capacity</div>
                    <div class="value">${c.toLocaleString()}</div>
                </div>
                <div>
                    <div class="label">Price</div>
                    <div class="value cost">${m(i)}</div>
                </div>
                <div>
                    <div class="label">Maint/Tick</div>
                    <div class="value maint">${m(o)}</div>
                </div>
            </div>
            <div class="ex-property-actions">
                ${b}
            </div>
        </div>`}).join("")}async function W(t){if(!t||$.has(t))return;const e=E.find(i=>i.id===t);if(!e||e.id===r?.nation_id)return;if(f.some(i=>i.nation_id===t)){p("You already own a Regional HQ here.","error");return}const n=Number(e.standard_of_living??50),s=O(n),a=Number(r?.corp_cash_reserves||0);if(a<s){p("Insufficient cash reserves for "+e.name+".","error");return}if(confirm("Build Regional HQ in "+e.name+`?

Cost: `+m(s)+" ($300M base × "+L(n).toFixed(2)+`x SoL)
Capacity: `+P+`

The HQ becomes a standard property asset. You can sell it later from your assets list (60% × condition resale).`)){$.add(t),S();try{const i=Number(y?.current_tick)||0,o=85+Math.floor(Math.random()*16),c=Math.round(s*.005),d=(r.faction_name||"Corp")+" — "+e.name+" HQ",h=Math.max(0,a-s),{error:_}=await l.from("factions").update({corp_cash_reserves:h}).eq("id",r.id);if(_){p("Failed to deduct cash: "+_.message,"error");return}r.corp_cash_reserves=h;const{error:b}=await l.from("corp_properties").insert({faction_id:r.id,nation_id:e.id,name:d,type:"regional_hq",role:"regional_hq",style:"Modern",capacity:P,purchase_price:s,monthly_maintenance:c,condition:o,city:e.capital||e.name,purchased_at_tick:i,is_active:!0});if(b){await l.from("factions").update({corp_cash_reserves:a}).eq("id",r.id),r.corp_cash_reserves=a,p("Failed to create property: "+b.message+" (cash refunded)","error");return}try{await l.from("event_log").insert({nation_id:e.id,event_name:"New Regional HQ Established",category:"corporate",description_chosen:`${r.faction_name} has invested ${m(s)} to build a Regional HQ in ${e.name}.`,fired_at_tick:i})}catch{}p("Regional HQ built in "+e.name+" ("+o+"% condition).","success"),await C(),k()}catch(i){console.error("[Expansion] build failed:",i),p("Build failed: "+(i?.message||"unknown"),"error")}finally{$.delete(t),S()}}}async function X(t){if(!t||M.has(t))return;const e=f.find(a=>a.id===t);if(!e)return;const n=Math.max(0,Math.min(1,(Number(e.condition)||50)/100)),s=Math.round((Number(e.purchase_price)||0)*.6*n);if(confirm('Sell "'+e.name+`"?

Sale value: `+m(s)+" (60% × "+Math.round(n*100)+`% condition)

The property goes back on the market for 6 ticks.
This cannot be undone.`)){M.add(t),B();try{const{error:a}=await l.from("corp_properties").update({is_active:!1}).eq("id",t);if(a){p("Sell failed: "+a.message,"error");return}const o=Number(r?.corp_cash_reserves||0)+s,{error:c}=await l.from("factions").update({corp_cash_reserves:o}).eq("id",r.id);c?console.warn("[Expansion] cash credit failed:",c.message):r.corp_cash_reserves=o;const d=Number(y?.current_tick)||0;try{await l.from("available_properties").insert({nation_id:e.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,price:s,monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,listed_at_tick:d,expires_at_tick:d+6,status:"available"})}catch{}p("Sold for "+m(s)+".","success"),await Promise.all([C(),A()]),k()}catch(a){console.error("[Expansion] sell failed:",a),p("Sell failed: "+(a?.message||"unknown"),"error")}finally{M.delete(t),B()}}}async function Z(t){if(!t||q.has(t))return;const e=x.find(a=>a.id===t);if(!e)return;const n=Number(e.price)||0,s=Number(r?.corp_cash_reserves||0);if(s<n){p("Insufficient cash reserves.","error");return}if(confirm('Buy "'+e.name+'" for '+m(n)+`?

Maintenance: `+m(e.monthly_maintenance||0)+` / tick
Condition: `+Math.round(Number(e.condition)||0)+"%")){q.add(t),T();try{const a=Number(y?.current_tick)||0,i=Math.max(0,s-n),{error:o}=await l.from("factions").update({corp_cash_reserves:i}).eq("id",r.id);if(o){p("Failed to deduct cash: "+o.message,"error");return}r.corp_cash_reserves=i;const{error:c}=await l.from("corp_properties").insert({faction_id:r.id,nation_id:r.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,role:e.type,style:e.style,capacity:e.capacity,purchase_price:n,monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,purchased_at_tick:a,is_active:!0});if(c){await l.from("factions").update({corp_cash_reserves:s}).eq("id",r.id),r.corp_cash_reserves=s,p("Purchase failed: "+c.message+" (cash refunded)","error");return}const{error:d}=await l.from("available_properties").update({status:"sold",purchased_by:r.id}).eq("id",e.id);d&&console.warn("[Expansion] listing flip failed:",d.message),p("Purchased "+e.name+".","success"),await Promise.all([C(),A()]),k()}catch(a){console.error("[Expansion] buy failed:",a),p("Purchase failed: "+(a?.message||"unknown"),"error")}finally{q.delete(t),T()}}}function ee(){const t=document.getElementById("ex-assets-grid");t&&t.dataset.boundEx!=="1"&&(t.dataset.boundEx="1",t.addEventListener("click",s=>{const a=s.target.closest("[data-action]");if(!a||a.disabled)return;const i=a.getAttribute("data-action"),o=a.getAttribute("data-id");i==="sell"&&o&&X(o)}));const e=document.getElementById("ex-build-table");e&&e.dataset.boundEx!=="1"&&(e.dataset.boundEx="1",e.addEventListener("click",s=>{const a=s.target.closest("[data-action]");if(!a||a.disabled)return;const i=a.getAttribute("data-action"),o=a.getAttribute("data-id");i==="build"&&o&&W(o)}));const n=document.getElementById("ex-buy-grid");n&&n.dataset.boundEx!=="1"&&(n.dataset.boundEx="1",n.addEventListener("click",s=>{const a=s.target.closest("[data-action]");if(!a||a.disabled)return;const i=a.getAttribute("data-action"),o=a.getAttribute("data-id");i==="buy"&&o&&Z(o)})),document.querySelectorAll(".ex-acquire-toggle button").forEach(s=>{s.addEventListener("click",()=>{document.querySelectorAll(".ex-acquire-toggle button").forEach(o=>o.classList.remove("active")),s.classList.add("active");const a=s.getAttribute("data-tab");document.querySelectorAll(".ex-acquire-tab").forEach(o=>o.classList.remove("active"));const i=document.getElementById("ex-tab-"+a);i&&i.classList.add("active")})})}function k(){K(),B(),S(),T()}async function te(){const{data:{user:t}}=await l.auth.getUser();if(!t){window.location.href="login.html";return}const e=new URLSearchParams(location.search).get("faction_id");if(e){const{data:i,error:o}=await l.from("factions").select("*").eq("id",e).single();o?console.warn("[Inspector] faction fetch failed:",o.message):i?.faction_type==="corporation"&&(r=i)}if(!r){const{data:i}=await l.from("factions").select("*").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`);w=(i||[]).filter(c=>c.nation_id);const o=sessionStorage.getItem("active_faction_id");if(r=w.find(c=>c.id===o)||w.find(c=>c.faction_type==="corporation")||w[0],!r){await l.auth.signOut(),window.location.href="login.html";return}if(r.faction_type!=="corporation"){window.location.href="dashboard.html";return}}const[n,s]=await Promise.all([r.nation_id?l.from("nations").select("*").eq("id",r.nation_id).single():Promise.resolve({data:null}),l.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);n?.data&&(v=n.data),s?.data&&(y=s.data);const a=document.getElementById("corp-topbar-container");if(a)try{const{renderCorpTopBar:i}=await G(async()=>{const{renderCorpTopBar:o}=await import("./corp-topbar-BOR6jYkY.js");return{renderCorpTopBar:o}},__vite__mapDeps([0,1]));i(a,{faction:r,shard:y,activeTab:"expansion",allUserFactions:w})}catch(i){console.error("[Expansion] topbar render failed:",i)}document.getElementById("ex-footer-date").textContent=y?.current_date||"—",document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="",ee(),await Promise.all([C(),J(),A()]),k()}te().catch(t=>{console.error("[Expansion] init failed:",t),Y("Failed to load: "+(t?.message||"unknown error"))});
