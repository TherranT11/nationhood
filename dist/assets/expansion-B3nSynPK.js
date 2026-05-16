const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-ClQJCe3f.js","assets/preload-helper-BXl3LOEh.js","assets/factions-1eoRseVF.js"])))=>i.map(i=>d[i]);
import{_supabase as p}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{_ as ne}from"./preload-helper-BXl3LOEh.js";import{h as v,e as m}from"./utils-oN1e812_.js";import{e as S,h as Y,f as D,g as K,l as z}from"./corp-valuation-DGlSNvB8.js";const ie=3e8,G=500;function J(a){return Math.round(ie*S(a))}let c=null,k=null,C=null,q=[],y=[],M=[],E=[],h=null,T=[],A=[],N=new Set,B=new Set,Q=new Set;function se(a){const e=document.getElementById("loading");e.textContent=a,e.style.color="var(--ex-accent-red)"}function f(a,e){document.querySelectorAll(".ex-toast").forEach(n=>n.remove());const t=document.createElement("div");t.className="ex-toast"+(e?" "+e:""),t.textContent=a,document.body.appendChild(t),setTimeout(()=>{t.classList.add("fade"),setTimeout(()=>t.remove(),280)},3e3)}function I(a){const e=Number(a)||0;return e<50?"bad":e<75?"warn":""}function oe(a){const e=String(a||"Basic").toLowerCase();return e==="modern"?"modern":e==="premium"||e==="innovative"?"premium":e==="heritage"||e==="sustainable"?"heritage":"basic"}async function H(){if(!c?.id){y=[],M=[],E=[],h=null;return}const{data:a,error:e}=await p.from("corp_properties").select("id, nation_id, name, type, role, style, catalog_id, condition, purchase_price, monthly_maintenance, city, capacity, nations:nation_id(name)").eq("faction_id",c.id).eq("is_active",!0).order("purchased_at_tick",{ascending:!1});if(e){console.warn("[Expansion] property fetch failed:",e.message),y=[],M=[],E=[],h=null;return}const t=a||[];h=t.find(n=>n.role==="national_hq")||null,y=t.filter(n=>n.type==="regional_hq"),M=t.filter(n=>n.type==="airline_terminal"),E=t.filter(n=>n.role!=="national_hq"&&n.type!=="regional_hq"&&n.type!=="airline_terminal")}async function re(){const{data:a,error:e}=await p.from("nations").select("id, name, capital, standard_of_living, cost_of_living, gdp_growth").order("name",{ascending:!0});if(e){console.warn("[Expansion] nations fetch failed:",e.message),T=[];return}T=a||[]}async function j(){if(!c?.nation_id){A=[];return}const{data:a,error:e}=await p.from("available_properties").select("*").eq("nation_id",c.nation_id).eq("status","available").order("price",{ascending:!0});if(e){console.warn("[Expansion] marketplace fetch failed:",e.message),A=[];return}A=a||[]}function ce(){document.getElementById("ex-page-eyebrow").textContent="— "+(c?.corp_sector||"Corporation")+" —";const a=!!h,e=new Set([...y,...M,...E].map(d=>d.nation_id).filter(d=>d&&d!==c?.nation_id)),t=(a?1:0)+e.size,n=(a?1:0)+y.length+M.length+E.length,o=(d,l)=>({value:d.value+(Number(l.purchase_price)||0),maint:d.maint+(Number(l.monthly_maintenance)||0)}),s={value:a&&Number(h.purchase_price)||0,maint:a&&Number(h.monthly_maintenance)||0},u=[...y,...M,...E].reduce(o,s),r=u.value,i=u.maint;document.getElementById("ex-stat-nations").textContent=String(t),document.getElementById("ex-stat-properties").textContent=String(n),document.getElementById("ex-stat-maint").innerHTML=v(i),document.getElementById("ex-assets-desc").textContent=`${n} ${n===1?"Property":"Properties"} ◊ ${v(r)} Total Value`}function O(){const a=document.getElementById("ex-assets-grid");if(!a)return;const e=[];if(h&&k){const t=Number(h.purchase_price)||0,n=Number(h.monthly_maintenance)||0,o=Math.round(Number(h.condition)||0);e.push(`<div class="ex-asset-card kind-hq">
            <div class="ex-asset-meta-row">
                <span class="ex-asset-tag kind-hq">National HQ</span>
            </div>
            <div class="ex-asset-name">${m(h.name||(c.faction_name||"Corporation")+" Headquarters")}</div>
            <div class="ex-asset-location"><span class="flag">◊</span> ${m((k.name||"").toUpperCase())}${k.capital?" ◊ "+m(String(k.capital).toUpperCase()):""}</div>
            <div class="ex-asset-stats">
                <div>
                    <div class="label">Quality</div>
                    <div class="value ${I(o)}">${o}<span class="unit">%</span></div>
                </div>
                <div>
                    <div class="label">Value</div>
                    <div class="value">${v(t)}</div>
                </div>
                <div>
                    <div class="label">Maint/Tick</div>
                    <div class="value">${v(n)}</div>
                </div>
            </div>
            <div class="ex-asset-note">Home Operation ◊ Cannot Be Sold</div>
        </div>`)}for(const t of y){const n=B.has(t.id),o=Math.round(Number(t.condition)||0),s=Number(t.purchase_price)||0,u=Number(t.monthly_maintenance)||0,r=t.nations?.name||"—",i=t.city||"";e.push(`<div class="ex-asset-card">
            <div class="ex-asset-meta-row">
                <span class="ex-asset-tag kind-regional">Regional HQ</span>
            </div>
            <div class="ex-asset-name">${m(t.name||"Regional HQ")}</div>
            <div class="ex-asset-location"><span class="flag">◊</span> ${m(r.toUpperCase())}${i?" ◊ "+m(String(i).toUpperCase()):""}</div>
            <div class="ex-asset-stats">
                <div>
                    <div class="label">Quality</div>
                    <div class="value ${I(o)}">${o}<span class="unit">%</span></div>
                </div>
                <div>
                    <div class="label">Value</div>
                    <div class="value">${v(s)}</div>
                </div>
                <div>
                    <div class="label">Maint/Tick</div>
                    <div class="value">${v(u)}</div>
                </div>
            </div>
            <div class="ex-asset-actions">
                <button class="ex-asset-btn danger" data-action="sell" data-id="${m(t.id)}" ${n?"disabled":""}>
                    ${n?"Selling…":"Sell"}
                </button>
            </div>
        </div>`)}for(const t of M){const n=Math.round(Number(t.condition)||0),o=Number(t.purchase_price)||0,s=Number(t.monthly_maintenance)||0,u=t.nations?.name||"—",r=t.city||"";e.push(`<div class="ex-asset-card">
            <div class="ex-asset-meta-row">
                <span class="ex-asset-tag kind-terminal">Terminal</span>
            </div>
            <div class="ex-asset-name">${m(t.name||"Terminal")}</div>
            <div class="ex-asset-location"><span class="flag">◊</span> ${m(u.toUpperCase())}${r?" ◊ "+m(String(r).toUpperCase()):""}</div>
            <div class="ex-asset-stats">
                <div>
                    <div class="label">Quality</div>
                    <div class="value ${I(n)}">${n}<span class="unit">%</span></div>
                </div>
                <div>
                    <div class="label">Value</div>
                    <div class="value">${v(o)}</div>
                </div>
                <div>
                    <div class="label">Maint/Tick</div>
                    <div class="value">${v(s)}</div>
                </div>
            </div>
            <div class="ex-asset-note">Hub Operation ◊ Cannot Be Sold</div>
        </div>`)}for(const t of E){const n=B.has(t.id),o=Math.round(Number(t.condition)||0),s=Number(t.purchase_price)||0,u=Number(t.monthly_maintenance)||0,r=t.nations?.name||"—",i=t.city||"",l=String(t.role||t.type||"property").toLowerCase().replace(/_/g," ").replace(/\b\w/g,b=>b.toUpperCase());e.push(`<div class="ex-asset-card">
            <div class="ex-asset-meta-row">
                <span class="ex-asset-tag">${m(l)}</span>
            </div>
            <div class="ex-asset-name">${m(t.name||l)}</div>
            <div class="ex-asset-location"><span class="flag">◊</span> ${m(r.toUpperCase())}${i?" ◊ "+m(String(i).toUpperCase()):""}</div>
            <div class="ex-asset-stats">
                <div>
                    <div class="label">Quality</div>
                    <div class="value ${I(o)}">${o}<span class="unit">%</span></div>
                </div>
                <div>
                    <div class="label">Value</div>
                    <div class="value">${v(s)}</div>
                </div>
                <div>
                    <div class="label">Maint/Tick</div>
                    <div class="value">${v(u)}</div>
                </div>
            </div>
            <div class="ex-asset-actions">
                <button class="ex-asset-btn danger" data-action="sell" data-id="${m(t.id)}" ${n?"disabled":""}>
                    ${n?"Selling…":"Sell"}
                </button>
            </div>
        </div>`)}a.innerHTML=e.join("")}function U(){const a=document.getElementById("ex-build-table");if(!a)return;const e=new Set(y.map(s=>s.nation_id)),t=c?.nation_id,n=Number(c?.corp_cash_reserves||0),o=[];if(o.push(`<div class="ex-nation-table-head">
        <div>Nation</div>
        <div>SoL</div>
        <div class="ex-nation-cell gdp">GDP</div>
        <div class="ex-nation-cell mult">Multiplier</div>
        <div>Total Cost</div>
        <div></div>
    </div>`),T.length===0){o.push('<div class="ex-nation-row empty">No nations available.</div>'),a.innerHTML=o.join("");return}for(const s of T){const u=Number(s.standard_of_living??50),r=Number(s.gdp_growth??0),i=S(u),d=J(u),l=s.id===t,b=e.has(s.id),w=N.has(s.id);let _,g="ex-nation-row",x="ex-nation-cell cost";l?(_='<button class="ex-build-btn disabled" disabled>Home Nation</button>',g+=" owned",x+=" unset"):b?(_='<button class="ex-build-btn disabled" disabled>Owned</button>',g+=" owned",x+=" unset"):w?_='<button class="ex-build-btn disabled" disabled>Building…</button>':n<d?(_='<button class="ex-build-btn unaffordable" disabled>Insufficient</button>',x+=" expensive"):_=`<button class="ex-build-btn" data-action="build" data-id="${m(s.id)}">Build ▸</button>`;const $=l||b?"—":v(d),P=(r>=0?"+":"")+r.toFixed(1)+"%";o.push(`<div class="${g}">
            <div class="ex-nation-name"><span class="flag">◊</span> ${m(s.name||"—")}${l?' <span class="home-tag">[HOME]</span>':""}</div>
            <div class="ex-nation-cell">SoL ${Math.round(u)}</div>
            <div class="ex-nation-cell gdp">${m(P)}</div>
            <div class="ex-nation-cell mult">×${i.toFixed(2)}</div>
            <div class="${x}">${m($)}</div>
            <div class="ex-nation-action">${_}</div>
        </div>`)}a.innerHTML=o.join("")}function W(){const a=new Set(y.map(e=>e.nation_id));return c?.nation_id&&a.add(c.nation_id),a}function R(a,e,t,n,o){const s=document.getElementById(e);if(!s)return;const u=W(),r=Number(c?.corp_cash_reserves||0),i=[];i.push(`<div class="ex-nation-table-head">
        <div>Nation</div>
        <div>CoL</div>
        <div class="ex-nation-cell gdp">GDP</div>
        <div class="ex-nation-cell mult">Multiplier</div>
        <div>Total Cost</div>
        <div></div>
    </div>`);const d=T.filter(l=>u.has(l.id));if(d.length===0){i.push('<div class="ex-nation-row empty">No eligible nations — assembly plants require presence (your home nation or a Regional HQ).</div>'),s.innerHTML=i.join("");return}for(const l of d){const b=Number(l.cost_of_living??50),w=Number(l.gdp_growth??0),_=S(b),g=t(b),x=N.has(`${a}:${l.id}`);let $,P="ex-nation-cell cost";x?$='<button class="ex-build-btn disabled" disabled>Building…</button>':r<g?($='<button class="ex-build-btn unaffordable" disabled>Insufficient</button>',P+=" expensive"):$=`<button class="ex-build-btn" data-action="${o}" data-id="${m(l.id)}">Build ▸</button>`;const ae=(w>=0?"+":"")+w.toFixed(1)+"%";i.push(`<div class="ex-nation-row">
            <div class="ex-nation-name"><span class="flag">◊</span> ${m(l.name||"—")}</div>
            <div class="ex-nation-cell">CoL ${Math.round(b)}</div>
            <div class="ex-nation-cell gdp">${m(ae)}</div>
            <div class="ex-nation-cell mult">×${_.toFixed(2)}</div>
            <div class="${P}">${m(v(g))}</div>
            <div class="ex-nation-action">${$}</div>
        </div>`)}s.innerHTML=i.join("")}function X(){R("light_assembly","ex-build-table-light-assembly",z,175,"build-light-assembly")}function Z(){R("engine_assembly","ex-build-table-engine-assembly",K,225,"build-engine-assembly")}function ee(){R("aircraft_assembly","ex-build-table-aircraft-assembly",D,225,"build-aircraft-assembly")}function te(){R("heavy_manufacturing","ex-build-table-heavy-manufacturing",Y,375,"build-heavy-manufacturing")}function V(){const a=document.getElementById("ex-buy-grid");if(!a)return;if(A.length===0){a.innerHTML='<div class="ex-property-grid-empty">No properties on the market right now in your home nation. Listings refresh per tick.</div>';return}const e=Number(c?.corp_cash_reserves||0);a.innerHTML=A.map(t=>{const n=Q.has(t.id),o=oe(t.style),s=Number(t.price)||0,u=Number(t.monthly_maintenance)||0,r=Number(t.capacity)||0,i=Math.round(Number(t.condition)||0),d=i<60?"warn":i<40?"bad":"",l=e>=s,b=n?'<button class="ex-property-btn primary" disabled>Buying…</button>':l?`<button class="ex-property-btn primary" data-action="buy" data-id="${m(t.id)}">Purchase ▸</button>`:'<button class="ex-property-btn unaffordable" disabled>Insufficient</button>';return`<div class="ex-property-card">
            <div class="ex-property-meta-row">
                <span class="ex-property-tier ${o}">${m((t.style||"Basic").toUpperCase())}</span>
                <span class="ex-property-condition ${d}">CONDITION ${i}%</span>
            </div>
            <div class="ex-property-name">${m(t.name||"Property")}</div>
            <div class="ex-property-loc"><span class="flag">◊</span> ${m((k?.name||"—").toUpperCase())}${t.city?" ◊ "+m(String(t.city).toUpperCase()):""}</div>
            <div class="ex-property-stats">
                <div>
                    <div class="label">Capacity</div>
                    <div class="value">${r.toLocaleString()}</div>
                </div>
                <div>
                    <div class="label">Price</div>
                    <div class="value cost">${v(s)}</div>
                </div>
                <div>
                    <div class="label">Maint/Tick</div>
                    <div class="value maint">${v(u)}</div>
                </div>
            </div>
            <div class="ex-property-actions">
                ${b}
            </div>
        </div>`}).join("")}async function le(a){if(!a||N.has(a))return;const e=T.find(s=>s.id===a);if(!e||e.id===c?.nation_id)return;if(y.some(s=>s.nation_id===a)){f("You already own a Regional HQ here.","error");return}const t=Number(e.standard_of_living??50),n=J(t),o=Number(c?.corp_cash_reserves||0);if(o<n){f("Insufficient cash reserves for "+e.name+".","error");return}if(confirm("Build Regional HQ in "+e.name+`?

Cost: `+v(n)+" ($300M base × "+S(t).toFixed(2)+`x SoL)
Capacity: `+G+`

The HQ becomes a standard property asset. You can sell it later from your assets list (purchase price × current condition %).`)){N.add(a),U();try{const s=Number(C?.current_tick)||0,u=85+Math.floor(Math.random()*16),r=Math.round(n*.005),i=(c.faction_name||"Corp")+" — "+e.name+" HQ",d=Math.max(0,o-n),{error:l}=await p.from("factions").update({corp_cash_reserves:d}).eq("id",c.id);if(l){f("Failed to deduct cash: "+l.message,"error");return}c.corp_cash_reserves=d;const{error:b}=await p.from("corp_properties").insert({faction_id:c.id,nation_id:e.id,name:i,type:"regional_hq",role:"regional_hq",style:"Modern",capacity:G,purchase_price:n,monthly_maintenance:r,condition:u,city:e.capital||e.name,purchased_at_tick:s,is_active:!0});if(b){await p.from("factions").update({corp_cash_reserves:o}).eq("id",c.id),c.corp_cash_reserves=o,f("Failed to create property: "+b.message+" (cash refunded)","error");return}try{await p.rpc("award_construction_gdp_bonus",{p_nation_id:e.id})}catch{}try{await p.from("event_log").insert({nation_id:e.id,event_name:`${c.faction_name} — New Regional HQ Established`,category:"corporate",description_chosen:`${c.faction_name} has invested ${v(n)} to build a Regional HQ in ${e.name}.`,fired_at_tick:s})}catch{}f("Regional HQ built in "+e.name+" ("+u+"% condition).","success"),await H(),L()}catch(s){console.error("[Expansion] build failed:",s),f("Build failed: "+(s?.message||"unknown"),"error")}finally{N.delete(a),U()}}}const de={light_assembly:{type:"light_assembly_plant",label:"Light Assembly Plant",base:"$175M",costFn:z,rerender:X},engine_assembly:{type:"engine_assembly_plant",label:"Engine Assembly Plant",base:"$225M",costFn:K,rerender:Z},aircraft_assembly:{type:"aircraft_assembly_facility",label:"Aircraft Assembly Facility",base:"$225M",costFn:D,rerender:ee},heavy_manufacturing:{type:"heavy_manufacturing_plant",label:"Heavy Manufacturing Plant",base:"$375M",costFn:Y,rerender:te}};async function F(a,e){if(!e)return;if(!W().has(e)){f("You need presence in that nation (home or a Regional HQ) to build an assembly plant.","error");return}const n=T.find(d=>d.id===e);if(!n)return;const o=`${a}:${e}`;if(N.has(o))return;const s=de[a];if(!s)return;const u=Number(n.cost_of_living??50),r=s.costFn(u),i=Number(c?.corp_cash_reserves||0);if(i<r){f("Insufficient cash reserves for "+n.name+".","error");return}if(confirm("Build "+s.label+" in "+n.name+`?

Cost: `+v(r)+" ("+s.base+" base × "+S(u).toFixed(2)+`x CoL)
0.5%/mo maintenance · 85-100% starting condition

The plant becomes a standard property asset. You can sell it later from your assets list (purchase price × current condition %).`)){N.add(o),s.rerender();try{const d=Number(C?.current_tick)||0,l=85+Math.floor(Math.random()*16),b=Math.round(r*.005),w=(c.faction_name||"Corp")+" — "+n.name+" "+s.label,_=Math.max(0,i-r),{error:g}=await p.from("factions").update({corp_cash_reserves:_}).eq("id",c.id);if(g){f("Failed to deduct cash: "+g.message,"error");return}c.corp_cash_reserves=_;const{error:x}=await p.from("corp_properties").insert({faction_id:c.id,nation_id:n.id,name:w,type:s.type,role:s.type,style:"Industrial",capacity:0,purchase_price:r,monthly_maintenance:b,condition:l,city:n.capital||n.name,purchased_at_tick:d,is_active:!0});if(x){await p.from("factions").update({corp_cash_reserves:i}).eq("id",c.id),c.corp_cash_reserves=i,f("Failed to create property: "+x.message+" (cash refunded)","error");return}try{await p.rpc("award_construction_gdp_bonus",{p_nation_id:n.id})}catch{}try{await p.from("event_log").insert({nation_id:n.id,event_name:`${c.faction_name} — ${s.label} Opened`,category:"corporate",description_chosen:`${c.faction_name} has invested ${v(r)} to open a ${s.label} in ${n.name}.`,fired_at_tick:d})}catch{}f(s.label+" built in "+n.name+" ("+l+"% condition).","success"),await H(),L()}catch(d){console.error("[Expansion] assembly-plant build failed:",d),f("Build failed: "+(d?.message||"unknown"),"error")}finally{N.delete(o),s.rerender()}}}async function ue(a){if(!a||B.has(a))return;const e=y.find(o=>o.id===a)||E.find(o=>o.id===a);if(!e)return;const t=Math.max(0,Math.min(1,(Number(e.condition)||50)/100)),n=Math.round((Number(e.purchase_price)||0)*t);if(confirm('Sell "'+e.name+`"?

Sale value: `+v(n)+" ("+Math.round(t*100)+`% condition)

The property goes back on the market for 6 ticks.
This cannot be undone.`)){B.add(a),O();try{const{error:o}=await p.from("corp_properties").update({is_active:!1}).eq("id",a);if(o){f("Sell failed: "+o.message,"error");return}const u=Number(c?.corp_cash_reserves||0)+n,{error:r}=await p.from("factions").update({corp_cash_reserves:u}).eq("id",c.id);r?console.warn("[Expansion] cash credit failed:",r.message):c.corp_cash_reserves=u;const i=Number(C?.current_tick)||0;try{await p.from("available_properties").insert({nation_id:e.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,style:e.style,capacity:e.capacity,price:n,monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,listed_at_tick:i,expires_at_tick:i+6,status:"available"})}catch{}f("Sold for "+v(n)+".","success"),await Promise.all([H(),j()]),L()}catch(o){console.error("[Expansion] sell failed:",o),f("Sell failed: "+(o?.message||"unknown"),"error")}finally{B.delete(a),O()}}}async function me(a){if(!a||Q.has(a))return;const e=A.find(o=>o.id===a);if(!e)return;const t=Number(e.price)||0,n=Number(c?.corp_cash_reserves||0);if(n<t){f("Insufficient cash reserves.","error");return}if(confirm('Buy "'+e.name+'" for '+v(t)+`?

Maintenance: `+v(e.monthly_maintenance||0)+` / tick
Condition: `+Math.round(Number(e.condition)||0)+"%")){Q.add(a),V();try{const o=Number(C?.current_tick)||0,s=Math.max(0,n-t),{error:u}=await p.from("factions").update({corp_cash_reserves:s}).eq("id",c.id);if(u){f("Failed to deduct cash: "+u.message,"error");return}c.corp_cash_reserves=s;const{error:r}=await p.from("corp_properties").insert({faction_id:c.id,nation_id:c.nation_id,catalog_id:e.catalog_id||null,name:e.name,type:e.type,role:e.type,style:e.style,capacity:e.capacity,purchase_price:t,monthly_maintenance:e.monthly_maintenance,condition:e.condition,city:e.city,purchased_at_tick:o,is_active:!0});if(r){await p.from("factions").update({corp_cash_reserves:n}).eq("id",c.id),c.corp_cash_reserves=n,f("Purchase failed: "+r.message+" (cash refunded)","error");return}const{error:i}=await p.from("available_properties").update({status:"sold",purchased_by:c.id}).eq("id",e.id);i&&console.warn("[Expansion] listing flip failed:",i.message),f("Purchased "+e.name+".","success"),await Promise.all([H(),j()]),L()}catch(o){console.error("[Expansion] buy failed:",o),f("Purchase failed: "+(o?.message||"unknown"),"error")}finally{Q.delete(a),V()}}}function pe(){const a=document.getElementById("ex-assets-grid");a&&a.dataset.boundEx!=="1"&&(a.dataset.boundEx="1",a.addEventListener("click",r=>{const i=r.target.closest("[data-action]");if(!i||i.disabled)return;const d=i.getAttribute("data-action"),l=i.getAttribute("data-id");d==="sell"&&l&&ue(l)}));const e=document.getElementById("ex-build-table");e&&e.dataset.boundEx!=="1"&&(e.dataset.boundEx="1",e.addEventListener("click",r=>{const i=r.target.closest("[data-action]");if(!i||i.disabled)return;const d=i.getAttribute("data-action"),l=i.getAttribute("data-id");d==="build"&&l&&le(l)}));const t=document.getElementById("ex-build-table-light-assembly");t&&t.dataset.boundEx!=="1"&&(t.dataset.boundEx="1",t.addEventListener("click",r=>{const i=r.target.closest("[data-action]");if(!i||i.disabled)return;const d=i.getAttribute("data-action"),l=i.getAttribute("data-id");d==="build-light-assembly"&&l&&F("light_assembly",l)}));const n=document.getElementById("ex-build-table-engine-assembly");n&&n.dataset.boundEx!=="1"&&(n.dataset.boundEx="1",n.addEventListener("click",r=>{const i=r.target.closest("[data-action]");if(!i||i.disabled)return;const d=i.getAttribute("data-action"),l=i.getAttribute("data-id");d==="build-engine-assembly"&&l&&F("engine_assembly",l)}));const o=document.getElementById("ex-build-table-aircraft-assembly");o&&o.dataset.boundEx!=="1"&&(o.dataset.boundEx="1",o.addEventListener("click",r=>{const i=r.target.closest("[data-action]");if(!i||i.disabled)return;const d=i.getAttribute("data-action"),l=i.getAttribute("data-id");d==="build-aircraft-assembly"&&l&&F("aircraft_assembly",l)}));const s=document.getElementById("ex-build-table-heavy-manufacturing");s&&s.dataset.boundEx!=="1"&&(s.dataset.boundEx="1",s.addEventListener("click",r=>{const i=r.target.closest("[data-action]");if(!i||i.disabled)return;const d=i.getAttribute("data-action"),l=i.getAttribute("data-id");d==="build-heavy-manufacturing"&&l&&F("heavy_manufacturing",l)}));const u=document.getElementById("ex-buy-grid");u&&u.dataset.boundEx!=="1"&&(u.dataset.boundEx="1",u.addEventListener("click",r=>{const i=r.target.closest("[data-action]");if(!i||i.disabled)return;const d=i.getAttribute("data-action"),l=i.getAttribute("data-id");d==="buy"&&l&&me(l)})),document.querySelectorAll(".ex-acquire-toggle button").forEach(r=>{r.addEventListener("click",()=>{document.querySelectorAll(".ex-acquire-toggle button").forEach(l=>l.classList.remove("active")),r.classList.add("active");const i=r.getAttribute("data-tab");document.querySelectorAll(".ex-acquire-tab").forEach(l=>l.classList.remove("active"));const d=document.getElementById("ex-tab-"+i);d&&d.classList.add("active")})})}function L(){ce(),O(),U(),V();const a=c?.corp_sector==="Aviation Manufacturing";document.querySelectorAll(".ex-aviation-only").forEach(e=>{e.style.display=a?"":"none"}),a&&(X(),Z(),ee(),te())}async function ve(){const{data:{user:a}}=await p.auth.getUser();if(!a){window.location.href="login.html";return}const e=new URLSearchParams(location.search).get("faction_id");if(e){const{data:s,error:u}=await p.from("factions").select("*").eq("id",e).single();u?console.warn("[Inspector] faction fetch failed:",u.message):s?.faction_type==="corporation"&&(c=s)}if(!c){const{data:s}=await p.from("factions").select("*").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`);q=(s||[]).filter(r=>r.nation_id);const u=sessionStorage.getItem("active_faction_id");if(c=q.find(r=>r.id===u)||q.find(r=>r.faction_type==="corporation")||q[0],!c){await p.auth.signOut(),window.location.href="login.html";return}if(c.faction_type!=="corporation"){window.location.href="dashboard.html";return}}const[t,n]=await Promise.all([c.nation_id?p.from("nations").select("*").eq("id",c.nation_id).single():Promise.resolve({data:null}),p.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);t?.data&&(k=t.data),n?.data&&(C=n.data);const o=document.getElementById("corp-topbar-container");if(o)try{const{renderCorpTopBar:s}=await ne(async()=>{const{renderCorpTopBar:u}=await import("./corp-topbar-ClQJCe3f.js");return{renderCorpTopBar:u}},__vite__mapDeps([0,1,2]));s(o,{faction:c,shard:C,activeTab:"expansion",allUserFactions:q})}catch(s){console.error("[Expansion] topbar render failed:",s)}document.getElementById("ex-footer-date").textContent=C?.current_date||"—",document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="",pe(),await Promise.all([H(),re(),j()]),L()}ve().catch(a=>{console.error("[Expansion] init failed:",a),se("Failed to load: "+(a?.message||"unknown error"))});
