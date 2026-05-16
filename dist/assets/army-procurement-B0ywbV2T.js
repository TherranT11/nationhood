import{_supabase as d}from"./supabase-client-CiYoFhIh.js";import{i as p}from"./factions-1eoRseVF.js";import{r as u}from"./military-topbar-CguCpjoQ.js";import"./utils-oN1e812_.js";function o(a){return String(a??"").replace(/[&<>"']/g,i=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"})[i])}const v=[{key:"rifles",name:"Rifles",sub:"Infantry Small Arms",variants:[]}];function f(a){const i=a.variants.reduce((n,s)=>n+(s.qty||0),0),t=a.variants.filter(n=>n.qty>0).map(n=>n.quality).sort((n,s)=>n-s),e=t.length?t[Math.floor((t.length-1)/2)]:null;return{qty:i,median:e,variantCount:a.variants.length}}function y(){const a=v.map(t=>{const{qty:e,median:n,variantCount:s}=f(t),r=t.variants.length?t.variants.map(l=>`
          <div class="ap-variant">
            <div>
              <div class="ap-variant__name">${o(l.name)}</div>
              <div class="ap-variant__tag">${o(l.tag)}</div>
            </div>
            <div class="ap-variant__qty">QTY ${l.qty.toLocaleString()}</div>
            <div>
              <div class="ap-qbar"><div class="ap-qbar__fill" style="width:${Math.max(0,Math.min(100,l.quality))}%"></div></div>
            </div>
          </div>`).join(""):`<div class="ap-empty">This army holds no ${o(t.name.toLowerCase())}. Procurement orders will populate this category.</div>`;return`
      <div class="ap-cat" data-cat="${o(t.key)}">
        <button class="ap-cat__row" data-cat-toggle="${o(t.key)}">
          <div>
            <div class="ap-cat__name">${o(t.name.toUpperCase())}</div>
            <div class="ap-cat__sub">${o(t.sub)}</div>
          </div>
          <div>
            <div class="ap-stat__label">Quantity</div>
            <div class="ap-stat__value${e?"":" is-dim"}">${e.toLocaleString()}</div>
          </div>
          <div>
            <div class="ap-stat__label">Median Quality</div>
            <div class="ap-stat__value${n==null?" is-dim":""}">${n==null?"—":o(n)+"/100"}</div>
          </div>
          <div>
            <div class="ap-stat__label">Variants</div>
            <div class="ap-stat__value${s?"":" is-dim"}">${s}</div>
          </div>
          <span class="ap-pill ap-pill--none">None</span>
        </button>
        <div class="ap-cat__body">${r}</div>
      </div>`}).join(""),i=v.length;return`
    <div class="ap-section">
      <div class="ap-section__head">
        <span class="ap-section__num">I.</span>
        <span class="ap-section__title">Current Inventory</span>
        <span class="ap-section__meta">${i} ${i===1?"Category":"Categories"} · Click to expand</span>
      </div>
      ${a}
    </div>`}function g(){const a=document.getElementById("ap-root");if(!a)return;const i=c.__nation_name||"";a.innerHTML=`
    <div class="ap-head">
      <div class="ap-head__eyebrow">— Equipment —</div>
      <div class="ap-head__title">Procurement &amp; Inventory</div>
      <div class="ap-head__faction">${o(c.faction_name||"Army")}${i?" · "+o(i):""}</div>
    </div>
    ${y()}
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
    </div>`,a.querySelectorAll("[data-cat-toggle]").forEach(t=>{t.addEventListener("click",()=>{const e=t.closest(".ap-cat");e&&e.classList.toggle("is-open")})})}let c=null;async function h(){const{data:{user:a}}=await d.auth.getUser();if(!a){window.location.href="login.html";return}const{data:i,error:t}=await d.from("factions").select("id, faction_type, faction_name, nation_id, abandoned_at, is_banned, branch").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`).eq("faction_type","military").eq("branch","army").is("abandoned_at",null).maybeSingle();if(t){console.warn("Army faction lookup failed:",t.message),window.location.href="dashboard.html";return}if(!i||p(i)){window.location.href="dashboard.html";return}c=i;const[e,n,s]=await Promise.all([d.from("nations").select("name, capital, flag_url, nation_profiles(flag_url)").eq("id",i.nation_id).maybeSingle(),d.from("shard").select("current_date, current_tick").eq("name","Alpha Shard").maybeSingle(),d.from("factions").select("id, faction_type, faction_name, abbreviation, branch, abandoned_at, is_banned, nation_id, linked_user_id").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`)]);e.error&&console.warn("Nation lookup failed:",e.error.message),n.error&&console.warn("Shard lookup failed:",n.error.message),s.error&&console.warn("Factions lookup failed:",s.error.message);const r=e.data||null;c.__nation_name=r?.name||"";const l=r?.nation_profiles,_=(Array.isArray(l)?l[0]?.flag_url:l?.flag_url)||r?.flag_url||(r?.name?`assets/flags/${r.name}.png`:"");u(document.getElementById("mil-topbar-host"),{faction:i,nation:r,shard:n.data||null,allUserFactions:(s.data||[]).filter(m=>!p(m)),activeTab:"procurement",flagUrl:_}),g()}h().catch(a=>{console.error("army-procurement init failed:",a);const i=document.getElementById("ap-root");i&&(i.innerHTML='<div class="ap-loading">Failed to load procurement.</div>')});
