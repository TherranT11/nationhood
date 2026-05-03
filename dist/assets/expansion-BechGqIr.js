const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-B9cSZncf.js","assets/preload-helper-BXl3LOEh.js"])))=>i.map(i=>d[i]);
import{_supabase as d}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{_ as G}from"./preload-helper-BXl3LOEh.js";import{h as m,e as l}from"./utils-DGqmZD5X.js";const j=3e8,F=500;function A(t){const e=Math.max(0,Math.min(100,Number(t)||0));return Math.max(.5,Math.min(2,e/50))}function O(t){return Math.round(j*A(t))}let r=null,x=null,w=null,N=[],_=[],y=[],h=null,$=[],E=[],k=new Set,q=new Set,M=new Set;function D(t){const e=document.getElementById("loading");e.textContent=t,e.style.color="var(--ex-accent-red)"}function v(t,e){document.querySelectorAll(".ex-toast").forEach(i=>i.remove());const a=document.createElement("div");a.className="ex-toast"+(e?" "+e:""),a.textContent=t,document.body.appendChild(a),setTimeout(()=>{a.classList.add("fade"),setTimeout(()=>a.remove(),280)},3e3)}function H(t){const e=Number(t)||0;return e<50?"bad":e<75?"warn":""}function Y(t){const e=String(t||"Basic").toLowerCase();return e==="modern"?"modern":e==="premium"||e==="innovative"?"premium":e==="heritage"||e==="sustainable"?"heritage":"basic"}async function T(){if(!r?.id){_=[],y=[],h=null;return}const{data:t,error:e}=await d.from("corp_properties").select("id, nation_id, name, type, role, style, catalog_id, condition, purchase_price, monthly_maintenance, city, capacity, nations:nation_id(name)").eq("faction_id",r.id).eq("is_active",!0).order("purchased_at_tick",{ascending:!1});if(e){console.warn("[Expansion] property fetch failed:",e.message),_=[],y=[],h=null;return}const a=t||[];h=a.find(i=>i.role==="national_hq")||null,_=a.filter(i=>i.type==="regional_hq"),y=a.filter(i=>i.type==="airline_terminal")}async function z(){const{data:t,error:e}=await d.from("nations").select("id, name, capital, standard_of_living, gdp_growth, control").order("name",{ascending:!0});if(e){console.warn("[Expansion] nations fetch failed:",e.message),$=[];return}$=t||[]}async function Q(){if(!r?.nation_id){E=[];return}const{data:t,error:e}=await d.from("available_properties").select("*").eq("nation_id",r.nation_id).eq("status","available").order("price",{ascending:!0});if(e){console.warn("[Expansion] marketplace fetch failed:",e.message),E=[];return}E=t||[]}function J(){document.getElementById("ex-page-eyebrow").textContent="— "+(r?.corp_sector||"Corporation")+" —";const t=!!h,e=new Set([..._,...y].map(p=>p.nation_id).filter(p=>p&&p!==r?.nation_id)),a=(t?1:0)+e.size,i=(t?1:0)+_.length+y.length,n=(p,f)=>({value:p.value+(Number(f.purchase_price)||0),maint:p.maint+(Number(f.monthly_maintenance)||0)}),s={value:t&&Number(h.purchase_price)||0,maint:t&&Number(h.monthly_maintenance)||0},o=[..._,...y].reduce(n,s),c=o.value,u=o.maint;document.getElementById("ex-stat-nations").textContent=String(a),document.getElementById("ex-stat-properties").textContent=String(i),document.getElementById("ex-stat-maint").innerHTML=m(u),document.getElementById("ex-assets-desc").textContent=`${i} ${i===1?"Property":"Properties"} ◊ ${m(c)} Total Value`}function L(){const t=document.getElementById("ex-assets-grid");if(!t)return;const e=[];if(h&&x){const a=Number(h.purchase_price)||0,i=Number(h.monthly_maintenance)||0,n=Math.round(Number(h.condition)||0);e.push(`<div class="ex-asset-card kind-hq">
            <div class="ex-asset-meta-row">
                <span class="ex-asset-tag kind-hq">National HQ</span>
            </div>
            <div class="ex-asset-name">${l(h.name||(r.faction_name||"Corporation")+" Headquarters")}</div>
            <div class="ex-asset-location"><span class="flag">◊</span> ${l((x.name||"").toUpperCase())}${x.capital?" ◊ "+l(String(x.capital).toUpperCase()):""}</div>
            <div class="ex-asset-stats">
                <div>
                    <div class="label">Quality</div>
                    <div class="value ${H(n)}">${n}<span class="unit">%</span></div>
                </div>
                <div>
                    <div class="label">Value</div>
                    <div class="value">${m(a)}</div>
                </div>
                <div>
                    <div class="label">Maint/Tick</div>
                    <div class="value">${m(i)}</div>
                </div>
            </div>
            <div class="ex-asset-note">Home Operation ◊ Cannot Be Sold</div>
        </div>`)}for(const a of _){const i=q.has(a.id),n=Math.round(Number(a.condition)||0),s=Number(a.purchase_price)||0,o=Number(a.monthly_maintenance)||0,c=a.nations?.name||"—",u=a.city||"";e.push(`<div class="ex-asset-card">
            <div class="ex-asset-meta-row">
                <span class="ex-asset-tag kind-regional">Regional HQ</span>
            </div>
            <div class="ex-asset-name">${l(a.name||"Regional HQ")}</div>
            <div class="ex-asset-location"><span class="flag">◊</span> ${l(c.toUpperCase())}${u?" ◊ "+l(String(u).toUpperCase()):""}</div>
            <div class="ex-asset-stats">
                <div>
                    <div class="label">Quality</div>
                    <div class="value ${H(n)}">${n}<span class="unit">%</span></div>
                </div>
                <div>
                    <div class="label">Value</div>
                    <div class="value">${m(s)}</div>
                </div>
                <div>
                    <div class="label">Maint/Tick</div>
                    <div class="value">${m(o)}</div>
                </div>
            </div>
            <div class="ex-asset-actions">
                <button class="ex-asset-btn danger" data-action="sell" data-id="${l(a.id)}" ${i?"disabled":""}>
                    ${i?"Selling…":"Sell"}
                </button>
            </div>
        </div>`)}for(const a of y){const i=Math.round(Number(a.condition)||0),n=Number(a.purchase_price)||0,s=Number(a.monthly_maintenance)||0,o=a.nations?.name||"—",c=a.city||"";e.push(`<div class="ex-asset-card">
            <div class="ex-asset-meta-row">
                <span class="ex-asset-tag kind-terminal">Terminal</span>
            </div>
            <div class="ex-asset-name">${l(a.name||"Terminal")}</div>
            <div class="ex-asset-location"><span class="flag">◊</span> ${l(o.toUpperCase())}${c?" ◊ "+l(String(c).toUpperCase()):""}</div>
            <div class="ex-asset-stats">
                <div>
                    <div class="label">Quality</div>
                    <div class="value ${H(i)}">${i}<span class="unit">%</span></div>
                </div>
                <div>
                    <div class="label">Value</div>
                    <div class="value">${m(n)}</div>
                </div>
                <div>
                    <div class="label">Maint/Tick</div>
                    <div class="value">${m(s)}</div>
                </div>
            </div>
            <div class="ex-asset-note">Hub Operation ◊ Cannot Be Sold</div>
        </div>`)}t.innerHTML=e.join("")}function I(){const t=document.getElementById("ex-build-table");if(!t)return;const e=new Set(_.map(s=>s.nation_id)),a=r?.nation_id,i=Number(r?.corp_cash_reserves||0),n=[];if(n.push(`<div class="ex-nation-table-head">
        <div>Nation</div>
        <div>SoL</div>
        <div class="ex-nation-cell gdp">GDP</div>
        <div class="ex-nation-cell mult">Multiplier</div>
        <div>Total Cost</div>
        <div></div>
    </div>`),$.length===0){n.push('<div class="ex-nation-row empty">No nations available.</div>'),t.innerHTML=n.join("");return}for(const s of $){const o=Number(s.standard_of_living??50),c=Number(s.gdp_growth??0),u=A(o),p=O(o),f=s.id===a,b=e.has(s.id),R=k.has(s.id);let g,S="ex-nation-row",C="ex-nation-cell cost";f?(g='<button class="ex-build-btn disabled" disabled>Home Nation</button>',S+=" owned",C+=" unset"):b?(g='<button class="ex-build-btn disabled" disabled>Owned</button>',S+=" owned",C+=" unset"):R?g='<button class="ex-build-btn disabled" disabled>Building…</button>':i<p?(g='<button class="ex-build-btn unaffordable" disabled>Insufficient</button>',C+=" expensive"):g=`<button class="ex-build-btn" data-action="build" data-id="${l(s.id)}">Build ▸</button>`;const U=f||b?"—":m(p),V=(c>=0?"+":"")+c.toFixed(1)+"%";n.push(`<div class="${S}">
            <div class="ex-nation-name"><span class="flag">◊</span> ${l(s.name||"—")}${f?' <span class="home-tag">[HOME]</span>':""}</div>
            <div class="ex-nation-cell">SoL ${Math.round(o)}</div>
            <div class="ex-nation-cell gdp">${l(V)}</div>
            <div class="ex-nation-cell mult">×${u.toFixed(2)}</div>
            <div class="${C}">${l(U)}</div>
            <div class="ex-nation-action">${g}</div>
        </div>`)}t.innerHTML=n.join("")}function P(){const t=document.getElementById("ex-buy-grid");if(!t)return;if(E.length===0){t.innerHTML='<div class="ex-property-grid-empty">No properties on the market right now in your home nation. Listings refresh per tick.</div>';return}const e=Number(r?.corp_cash_reserves||0);t.innerHTML=E.map(a=>{const i=M.has(a.id),n=Y(a.style),s=Number(a.price)||0,o=Number(a.monthly_maintenance)||0,c=Number(a.capacity)||0,u=Math.round(Number(a.condition)||0),p=u<60?"warn":u<40?"bad":"",f=e>=s,b=i?'<button class="ex-property-btn primary" disabled>Buying…</button>':f?`<button class="ex-property-btn primary" data-action="buy" data-id="${l(a.id)}">Purchase ▸</button>`:'<button class="ex-property-btn unaffordable" disabled>Insufficient</button>';return`<div class="ex-property-card">
            <div class="ex-property-meta-row">
                <span class="ex-property-tier ${n}">${l((a.style||"Basic").toUpperCase())}</span>
                <span class="ex-property-condition ${p}">CONDITION ${u}%</span>
            </div>
            <div class="ex-property-name">${l(a.name||"Property")}</div>
            <div class="ex-property-loc"><span class="flag">◊</span> ${l((x?.name||"—").toUpperCase())}${a.city?" ◊ "+l(String(a.city).toUpperCase()):""}</div>
            <div class="ex-property-stats">
                <div>
                    <div class="label">Capacity</div>
                    <div class="value">${c.toLocaleString()}</div>
                </div>
                <div>
                    <div class="label">Price</div>
                    <div class="value cost">${m(s)}</div>
                </div>
                <div>
                    <div class="label">Maint/Tick</div>
                    <div class="value maint">${m(o)}</div>
                </div>
            </div>
            <div class="ex-property-actions">
                ${b}
            </div>
        </div>`}).join("")}async function K(t){if(!t||k.has(t))return;const e=$.find(s=>s.id===t);if(!e||e.id===r?.nation_id)return;if(_.some(s=>s.nation_id===t)){v("You already own a Regional HQ here.","error");return}const a=Number(e.standard_of_living??50),i=O(a),n=Number(r?.corp_cash_reserves||0);if(n<i){v("Insufficient cash reserves for "+e.name+".","error");return}if(confirm("Build Regional HQ in "+e.name+`?

Cost: `+m(i)+" ($300M base × "+A(a).toFixed(2)+`x SoL)
Capacity: `+F+`

The HQ becomes a standard property asset. You can sell it later from your assets list (60% × condition resale).`)){k.add(t),I();try{const s=Number(w?.current_tick)||0,o=85+Math.floor(Math.random()*16),c=Math.round(i*.005),u=(r.faction_name||"Corp")+" — "+e.name+" HQ",p=Math.max(0,n-i),{error:f}=await d.from("factions").update({corp_cash_reserves:p}).eq("id",r.id);if(f){v("Failed to deduct cash: "+f.message,"error");return}r.corp_cash_reserves=p;const{error:b}=await d.from("corp_properties").insert({faction_id:r.id,nation_id:e.id,name:u,type:"regional_hq",role:"regional_hq",style:"Modern",capacity:F,purchase_price:i,monthly_maintenance:c,condition:o,city:e.capital||e.name,purchased_at_tick:s,is_active:!0});if(b){await d.from("factions").update({corp_cash_reserves:n}).eq("id",r.id),r.corp_cash_reserves=n,v("Failed to create property: "+b.message+" (cash refunded)","error");return}try{await d.from("event_log").insert({nation_id:e.id,event_name:"New Regional HQ Established",category:"corporate",description_chosen:`${r.faction_name} has invested ${m(i)} to build a Regional HQ in ${e.name}.`,fired_at_tick:s})}catch{}v("Regional HQ built in "+e.name+" ("+o+"% condition).","success"),await T(),B()}catch(s){console.error("[Expansion] build failed:",s),v("Build failed: "+(s?.message||"unknown"),"error")}finally{k.delete(t),I()}}}async function W(t){if(!t||q.has(t))return;const e=_.find(n=>n.id===t);if(!e)return;const a=Math.max(0,Math.min(1,(Number(e.condition)||50)/100)),i=Math.round((Number(e.purchase_price)||0)*.6*a);if(confirm('Sell "'+e.name+`"?

Sale value: `+m(i)+" (60% × "+Math.round(a*100)+`% condition)

The property goes back on the market for 6 ticks.
This cannot be undone.`)){q.add(t),L();try{const{error:n}=await d.from("corp_properties").update({is_active:!1}).eq("id",t);if(n){v("Sell failed: "+n.message,"error");return}const o=Number(r?.corp_cash_reserves||0)+i,{error:c}=await d.from("factions").update({corp_cash_reserves:o}).eq("id",r.id);c?console.warn("[Expansion] cash credit failed:",c.message):r.corp_cash_reserves=o;const u=Number(w?.current_tick)||0;try{await d.from("available_properties").insert({nation_id:e.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,price:i,monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,listed_at_tick:u,expires_at_tick:u+6,status:"available"})}catch{}v("Sold for "+m(i)+".","success"),await Promise.all([T(),Q()]),B()}catch(n){console.error("[Expansion] sell failed:",n),v("Sell failed: "+(n?.message||"unknown"),"error")}finally{q.delete(t),L()}}}async function X(t){if(!t||M.has(t))return;const e=E.find(n=>n.id===t);if(!e)return;const a=Number(e.price)||0,i=Number(r?.corp_cash_reserves||0);if(i<a){v("Insufficient cash reserves.","error");return}if(confirm('Buy "'+e.name+'" for '+m(a)+`?

Maintenance: `+m(e.monthly_maintenance||0)+` / tick
Condition: `+Math.round(Number(e.condition)||0)+"%")){M.add(t),P();try{const n=Number(w?.current_tick)||0,s=Math.max(0,i-a),{error:o}=await d.from("factions").update({corp_cash_reserves:s}).eq("id",r.id);if(o){v("Failed to deduct cash: "+o.message,"error");return}r.corp_cash_reserves=s;const{error:c}=await d.from("corp_properties").insert({faction_id:r.id,nation_id:r.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,role:e.type,style:e.style,capacity:e.capacity,purchase_price:a,monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,purchased_at_tick:n,is_active:!0});if(c){await d.from("factions").update({corp_cash_reserves:i}).eq("id",r.id),r.corp_cash_reserves=i,v("Purchase failed: "+c.message+" (cash refunded)","error");return}const{error:u}=await d.from("available_properties").update({status:"sold",purchased_by:r.id}).eq("id",e.id);u&&console.warn("[Expansion] listing flip failed:",u.message),v("Purchased "+e.name+".","success"),await Promise.all([T(),Q()]),B()}catch(n){console.error("[Expansion] buy failed:",n),v("Purchase failed: "+(n?.message||"unknown"),"error")}finally{M.delete(t),P()}}}function Z(){const t=document.getElementById("ex-assets-grid");t&&t.dataset.boundEx!=="1"&&(t.dataset.boundEx="1",t.addEventListener("click",i=>{const n=i.target.closest("[data-action]");if(!n||n.disabled)return;const s=n.getAttribute("data-action"),o=n.getAttribute("data-id");s==="sell"&&o&&W(o)}));const e=document.getElementById("ex-build-table");e&&e.dataset.boundEx!=="1"&&(e.dataset.boundEx="1",e.addEventListener("click",i=>{const n=i.target.closest("[data-action]");if(!n||n.disabled)return;const s=n.getAttribute("data-action"),o=n.getAttribute("data-id");s==="build"&&o&&K(o)}));const a=document.getElementById("ex-buy-grid");a&&a.dataset.boundEx!=="1"&&(a.dataset.boundEx="1",a.addEventListener("click",i=>{const n=i.target.closest("[data-action]");if(!n||n.disabled)return;const s=n.getAttribute("data-action"),o=n.getAttribute("data-id");s==="buy"&&o&&X(o)})),document.querySelectorAll(".ex-acquire-toggle button").forEach(i=>{i.addEventListener("click",()=>{document.querySelectorAll(".ex-acquire-toggle button").forEach(o=>o.classList.remove("active")),i.classList.add("active");const n=i.getAttribute("data-tab");document.querySelectorAll(".ex-acquire-tab").forEach(o=>o.classList.remove("active"));const s=document.getElementById("ex-tab-"+n);s&&s.classList.add("active")})})}function B(){J(),L(),I(),P()}async function ee(){const{data:{user:t}}=await d.auth.getUser();if(!t){window.location.href="login.html";return}const e=new URLSearchParams(location.search).get("faction_id");if(e){const{data:s,error:o}=await d.from("factions").select("*").eq("id",e).single();o?console.warn("[Inspector] faction fetch failed:",o.message):s?.faction_type==="corporation"&&(r=s)}if(!r){const{data:s}=await d.from("factions").select("*").or(`id.eq.${t.id},linked_user_id.eq.${t.id}`);N=(s||[]).filter(c=>c.nation_id);const o=sessionStorage.getItem("active_faction_id");if(r=N.find(c=>c.id===o)||N.find(c=>c.faction_type==="corporation")||N[0],!r){await d.auth.signOut(),window.location.href="login.html";return}if(r.faction_type!=="corporation"){window.location.href="dashboard.html";return}}const[a,i]=await Promise.all([r.nation_id?d.from("nations").select("*").eq("id",r.nation_id).single():Promise.resolve({data:null}),d.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);a?.data&&(x=a.data),i?.data&&(w=i.data);const n=document.getElementById("corp-topbar-container");if(n)try{const{renderCorpTopBar:s}=await G(async()=>{const{renderCorpTopBar:o}=await import("./corp-topbar-B9cSZncf.js");return{renderCorpTopBar:o}},__vite__mapDeps([0,1]));s(n,{faction:r,shard:w,activeTab:"expansion",allUserFactions:N})}catch(s){console.error("[Expansion] topbar render failed:",s)}document.getElementById("ex-footer-date").textContent=w?.current_date||"—",document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="",Z(),await Promise.all([T(),z(),Q()]),B()}ee().catch(t=>{console.error("[Expansion] init failed:",t),D("Failed to load: "+(t?.message||"unknown error"))});
