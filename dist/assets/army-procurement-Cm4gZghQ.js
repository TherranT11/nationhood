import{_ as y}from"./supabase-client-BXEzLDpS.js";import{b as q}from"./army-page-Cib0CuJO.js";import{f as _}from"./create-unit-DaU66o6M.js";import"./preload-helper-BXl3LOEh.js";import"./factions-C2s734Ze.js";import"./military-topbar-my5rYLvp.js";import"./utils-CzgKGX6o.js";import"./military-units-B_oSYk7U.js";function l(s){return String(s??"").replace(/[&<>"']/g,a=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[a])}const b=[{key:"rifles",name:"Rifles",sub:"Infantry Small Arms",variants:[]}];function k(s){const a=s.variants.reduce((i,n)=>i+(n.qty||0),0),e=s.variants.filter(i=>i.qty>0).map(i=>i.quality).sort((i,n)=>i-n),t=e.length?e[Math.floor((e.length-1)/2)]:null;return{qty:a,median:t,variantCount:s.variants.length}}async function S(s){if(!s)return[];const{data:a,error:e}=await y.from("army_rifle_inventory").select("quantity, rifle_models(name, origin, quality, soldiers_per_rifle)").eq("faction_id",s).gt("quantity",0);return e?(console.warn("[army-procurement] rifle load failed:",e.message),[]):(a||[]).map(t=>{const i=t.rifle_models||{},n=Number(t.quantity)||0;return{name:i.name||"Unknown rifle",tag:i.origin||"—",qty:n,quality:Number(i.quality)||0,soldiers:n*(Number(i.soldiers_per_rifle)||0)}})}let v=[],w=null;async function C(s){if(w)return w;const a={};if(s.length){const{data:e,error:t}=await y.from("nations").select("name, flag_url, nation_profiles(flag_url)").in("name",s);if(t)return console.warn("[army-procurement] origin flags load failed:",t.message),a;for(const i of e||[]){const n=Array.isArray(i.nation_profiles)?i.nation_profiles[0]?.flag_url:i.nation_profiles?.flag_url;a[i.name]=n||i.flag_url||`assets/flags/${i.name}.png`}}return w=a,a}async function N(){const{data:s,error:a}=await y.from("rifle_models").select("id, name, origin, quality, cost_raw, world_stock").order("cost_raw",{ascending:!0});if(a)return console.warn("[army-procurement] market load failed:",a.message),[];const e=s||[],t=await C([...new Set(e.map(i=>i.origin).filter(Boolean))]);return e.map(i=>({...i,flagUrl:t[i.origin]||""}))}function x(){const s=b.map(e=>{const{qty:t,median:i,variantCount:n}=k(e),g=e.variants.length?e.variants.map(d=>`
          <div class="ap-variant">
            <div>
              <div class="ap-variant__name">${l(d.name)}</div>
              <div class="ap-variant__tag">${l(d.tag)} · Quality ${d.quality.toFixed(1)}/10</div>
            </div>
            <div class="ap-variant__qty">QTY ${d.qty.toLocaleString()}</div>
            <div>
              <div class="ap-qbar"><div class="ap-qbar__fill" style="width:${Math.max(0,Math.min(100,d.quality*10))}%"></div></div>
              <div class="ap-variant__cap">Equips ${d.soldiers.toLocaleString()} soldiers</div>
            </div>
          </div>`).join(""):`<div class="ap-empty">This army holds no ${l(e.name.toLowerCase())}. Procurement orders will populate this category.</div>`;return`
      <div class="ap-cat" data-cat="${l(e.key)}">
        <button class="ap-cat__row" data-cat-toggle="${l(e.key)}">
          <div>
            <div class="ap-cat__name">${l(e.name.toUpperCase())}</div>
            <div class="ap-cat__sub">${l(e.sub)}</div>
          </div>
          <div>
            <div class="ap-stat__label">Quantity</div>
            <div class="ap-stat__value${t?"":" is-dim"}">${t.toLocaleString()}</div>
          </div>
          <div>
            <div class="ap-stat__label">Median Quality</div>
            <div class="ap-stat__value${i==null?" is-dim":""}">${i==null?"—":i.toFixed(1)+"/10"}</div>
          </div>
          <div>
            <div class="ap-stat__label">Variants</div>
            <div class="ap-stat__value${n?"":" is-dim"}">${n}</div>
          </div>
          ${t?"":'<span class="ap-pill ap-pill--none">None</span>'}
        </button>
        <div class="ap-cat__body">${g}</div>
      </div>`}).join(""),a=b.length;return`
    <div class="ap-section">
      <div class="ap-section__head">
        <span class="ap-section__num">I.</span>
        <span class="ap-section__title">Current Inventory</span>
        <span class="ap-section__meta">${a} ${a===1?"Category":"Categories"} · Click to expand</span>
      </div>
      ${s}
    </div>`}function E(){const s=v.reduce((t,i)=>t+(Number(i.world_stock)||0),0),a=v.length?Math.min(...v.map(t=>Number(t.cost_raw)||0)):null,e=v.length?v.map(t=>{const i=Number(t.world_stock)||0,n=i<1;return`
          <div class="wm-offer">
            <div>
              <div class="wm-offer__name">${l(t.name)}</div>
              <div class="wm-offer__tag">${l(t.origin)} · Quality ${(Number(t.quality)||0).toFixed(1)}/10</div>
            </div>
            <div>
              <div class="wm-col__l">Origin</div>
              ${t.flagUrl?`<img class="wm-flag" src="${l(t.flagUrl)}" alt="${l(t.origin)}" title="${l(t.origin)}" onerror="this.outerHTML='<div class=&quot;wm-flag wm-flag--fallback&quot;></div>'">`:`<div class="wm-flag wm-flag--fallback" title="${l(t.origin)}"></div>`}
            </div>
            <div><div class="wm-col__l">Seller</div><div class="wm-col__v is-dim">—</div></div>
            <div><div class="wm-col__l">Price / Unit</div><div class="wm-col__v">${_(t.cost_raw)}</div></div>
            <div><div class="wm-col__l">World Stock</div><div class="wm-col__v${n?" is-dim":""}">${i.toLocaleString()}</div></div>
            <button class="wm-buy" data-buy="${l(t.id)}"${n?" disabled":""}>${n?"Sold Out":"Buy"}</button>
          </div>`}).join(""):'<div class="ap-empty">No rifles are offered on the world market.</div>';return`
    <div class="ap-section">
      <div class="ap-section__head">
        <span class="ap-section__num">II.</span>
        <span class="ap-section__title">World Market</span>
        <span class="ap-section__meta">Buy from global stock · Click to expand</span>
      </div>
      <div class="ap-cat" data-cat="market-rifles">
        <button class="ap-cat__row" data-cat-toggle="market-rifles">
          <div>
            <div class="ap-cat__name">RIFLES</div>
            <div class="ap-cat__sub">Infantry Small Arms</div>
          </div>
          <div>
            <div class="ap-stat__label">Offers</div>
            <div class="ap-stat__value${v.length?"":" is-dim"}">${v.length}</div>
          </div>
          <div>
            <div class="ap-stat__label">From</div>
            <div class="ap-stat__value${a==null?" is-dim":""}">${a==null?"—":_(a)}</div>
          </div>
          <div>
            <div class="ap-stat__label">World Stock</div>
            <div class="ap-stat__value${s?"":" is-dim"}">${s.toLocaleString()}</div>
          </div>
          <span class="ap-cat__chev">▸</span>
        </button>
        <div class="ap-cat__body">${e}</div>
      </div>
    </div>`}function I(){const s=document.getElementById("ap-root");if(!s)return;const a=u.__nation_name||"";s.innerHTML=`
    <div class="ap-head">
      <div class="ap-head__eyebrow">— Equipment —</div>
      <div class="ap-head__title">Procurement &amp; Inventory</div>
      <div class="ap-head__faction">${l(u.faction_name||"Army")}${a?" · "+l(a):""}</div>
    </div>
    ${x()}
    ${E()}
    <div class="ap-section">
      <div class="ap-section__head">
        <span class="ap-section__num">III.</span>
        <span class="ap-section__title">Active Orders</span>
      </div>
      <div class="ap-empty">No active procurement orders.</div>
    </div>
    <div class="ap-section">
      <div class="ap-section__head">
        <span class="ap-section__num">IV.</span>
        <span class="ap-section__title">RFPs</span>
      </div>
      <div class="ap-empty">No open requests for proposals.</div>
    </div>`,s.querySelectorAll("[data-cat-toggle]").forEach(e=>{e.addEventListener("click",()=>{const t=e.closest(".ap-cat");t&&t.classList.toggle("is-open")})}),s.querySelectorAll("[data-buy]").forEach(e=>{e.addEventListener("click",t=>{t.stopPropagation();const i=v.find(n=>n.id===e.getAttribute("data-buy"));i&&L(i)})})}let u=null,p=!1;function L(s){if(!s)return;let a=document.getElementById("wm-overlay");a||(a=document.createElement("div"),a.id="wm-overlay",a.className="wm-overlay",document.body.appendChild(a));const e=Number(s.world_stock)||0,t=Number(s.cost_raw)||0,i=Number(u.party_funds)||0;let n=1;const g=()=>{a.style.display="none",a.innerHTML="",a.onclick=null,a.oninput=null},d=()=>`Buy ${n.toLocaleString()} · ${_(t*n)}`;a.innerHTML=`
    <div class="wm-modal">
      <div class="wm-modal__head">
        <div>
          <div class="wm-modal__eyebrow">— Purchase —</div>
          <div class="wm-modal__title">${l(s.name)}</div>
          <div class="wm-modal__sub">${l(s.origin)} · ${_(t)} / unit · ${e.toLocaleString()} in stock</div>
        </div>
        <div class="wm-x" data-wm="close">×</div>
      </div>
      <div class="wm-modal__body">
        <label class="wm-qty">
          <span class="wm-qty__l">Quantity</span>
          <input type="number" id="wm-qty-input" min="1" max="${e}" step="1" value="1" />
        </label>
        <div class="wm-sum">
          <div><div class="wm-sum__l">Army Funds</div><div class="wm-sum__v">${_(i)}</div></div>
          <div><div class="wm-sum__l">Total Price</div><div class="wm-sum__v ${t<=i?"gold":"warn"}" id="wm-total">${_(t)}</div></div>
        </div>
        <div class="wm-err" id="wm-err" hidden></div>
      </div>
      <div class="wm-modal__foot">
        <button class="wm-btn ghost" data-wm="close">Cancel</button>
        <button class="wm-btn buy" id="wm-confirm"${t<=i&&e>=1?"":" disabled"}>${d()}</button>
      </div>
    </div>`,a.style.display="flex",a.oninput=m=>{if(m.target.id!=="wm-qty-input")return;let o=Math.floor(Number(m.target.value));(!Number.isFinite(o)||o<1)&&(o=1),o>e&&(o=e),n=o,String(o)!==m.target.value&&(m.target.value=String(o));const r=t*n,c=r<=i,f=document.getElementById("wm-total");f.textContent=_(r),f.className="wm-sum__v "+(c?"gold":"warn");const $=document.getElementById("wm-confirm");$.textContent=d(),$.disabled=!(c&&e>=1)},a.onclick=async m=>{if(m.target===a||m.target.closest('[data-wm="close"]')){p||g();return}const o=m.target.closest("#wm-confirm");if(!o||p)return;const r=document.getElementById("wm-err");p=!0,o.disabled=!0,o.textContent="Purchasing…",r&&(r.hidden=!0,r.textContent="");try{const{data:c,error:f}=await y.rpc("buy_rifles",{p_faction_id:u.id,p_rifle_model_id:s.id,p_quantity:n});f||c&&c.ok===!1?(r&&(r.textContent=c&&c.error||f?.message||"Purchase failed.",r.hidden=!1),p=!1,o.disabled=!1,o.textContent=d()):(p=!1,g(),await h())}catch(c){r&&(r.textContent=c?.message||"Purchase failed.",r.hidden=!1),p=!1,o.disabled=!1,o.textContent=d()}}}async function h(){b[0].variants=await S(u.id),v=await N();const{data:s,error:a}=await y.from("factions").select("party_funds").eq("id",u.id).maybeSingle();!a&&s&&(u.party_funds=Number(s.party_funds)||0),I()}async function M(){const s=await q({activeTab:"procurement"});s&&(u=s.faction,await h())}M().catch(s=>{console.error("army-procurement init failed:",s);const a=document.getElementById("ap-root");a&&(a.innerHTML='<div class="ap-loading">Failed to load procurement.</div>')});
