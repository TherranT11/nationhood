import"./supabase-client-CiYoFhIh.js";import{b as v}from"./army-page-L2dCufP_.js";import"./preload-helper-BXl3LOEh.js";import"./factions-qe2qC_cj.js";import"./military-topbar-Dt58u9TP.js";import"./utils-oN1e812_.js";function n(a){return String(a??"").replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[i])}const c=[{key:"rifles",name:"Rifles",sub:"Infantry Small Arms",variants:[]}];function p(a){const i=a.variants.reduce((s,o)=>s+(o.qty||0),0),t=a.variants.filter(s=>s.qty>0).map(s=>s.quality).sort((s,o)=>s-o),e=t.length?t[Math.floor((t.length-1)/2)]:null;return{qty:i,median:e,variantCount:a.variants.length}}function _(){const a=c.map(t=>{const{qty:e,median:s,variantCount:o}=p(t),r=t.variants.length?t.variants.map(l=>`
          <div class="ap-variant">
            <div>
              <div class="ap-variant__name">${n(l.name)}</div>
              <div class="ap-variant__tag">${n(l.tag)}</div>
            </div>
            <div class="ap-variant__qty">QTY ${l.qty.toLocaleString()}</div>
            <div>
              <div class="ap-qbar"><div class="ap-qbar__fill" style="width:${Math.max(0,Math.min(100,l.quality))}%"></div></div>
            </div>
          </div>`).join(""):`<div class="ap-empty">This army holds no ${n(t.name.toLowerCase())}. Procurement orders will populate this category.</div>`;return`
      <div class="ap-cat" data-cat="${n(t.key)}">
        <button class="ap-cat__row" data-cat-toggle="${n(t.key)}">
          <div>
            <div class="ap-cat__name">${n(t.name.toUpperCase())}</div>
            <div class="ap-cat__sub">${n(t.sub)}</div>
          </div>
          <div>
            <div class="ap-stat__label">Quantity</div>
            <div class="ap-stat__value${e?"":" is-dim"}">${e.toLocaleString()}</div>
          </div>
          <div>
            <div class="ap-stat__label">Median Quality</div>
            <div class="ap-stat__value${s==null?" is-dim":""}">${s==null?"—":n(s)+"/100"}</div>
          </div>
          <div>
            <div class="ap-stat__label">Variants</div>
            <div class="ap-stat__value${o?"":" is-dim"}">${o}</div>
          </div>
          <span class="ap-pill ap-pill--none">None</span>
        </button>
        <div class="ap-cat__body">${r}</div>
      </div>`}).join(""),i=c.length;return`
    <div class="ap-section">
      <div class="ap-section__head">
        <span class="ap-section__num">I.</span>
        <span class="ap-section__title">Current Inventory</span>
        <span class="ap-section__meta">${i} ${i===1?"Category":"Categories"} · Click to expand</span>
      </div>
      ${a}
    </div>`}function m(){const a=document.getElementById("ap-root");if(!a)return;const i=d.__nation_name||"";a.innerHTML=`
    <div class="ap-head">
      <div class="ap-head__eyebrow">— Equipment —</div>
      <div class="ap-head__title">Procurement &amp; Inventory</div>
      <div class="ap-head__faction">${n(d.faction_name||"Army")}${i?" · "+n(i):""}</div>
    </div>
    ${_()}
    <div class="ap-section">
      <div class="ap-section__head">
        <span class="ap-section__num">II.</span>
        <span class="ap-section__title">Active Orders</span>
      </div>
      <div class="ap-empty">No active procurement orders.</div>
    </div>
    <div class="ap-section">
      <div class="ap-section__head">
        <span class="ap-section__num">III.</span>
        <span class="ap-section__title">RFPs</span>
      </div>
      <div class="ap-empty">No open requests for proposals.</div>
    </div>`,a.querySelectorAll("[data-cat-toggle]").forEach(t=>{t.addEventListener("click",()=>{const e=t.closest(".ap-cat");e&&e.classList.toggle("is-open")})})}let d=null;async function u(){const a=await v({activeTab:"procurement"});a&&(d=a.faction,m())}u().catch(a=>{console.error("army-procurement init failed:",a);const i=document.getElementById("ap-root");i&&(i.innerHTML='<div class="ap-loading">Failed to load procurement.</div>')});
