import{_ as m}from"./supabase-client-BXEzLDpS.js";import{x as y,A as _}from"./utils-CzgKGX6o.js";import{i as E,b as k,c as I,g as z}from"./factions-C2s734Ze.js";const S=[{id:"home",label:"HOME",href:"entrepreneur-dashboard.html"},{id:"corporations",label:"CORPORATIONS",href:"entrepreneur-corporations.html"},{id:"markets",label:"MARKETS",href:"entrepreneur-markets.html"},{id:"assets",label:"CHARACTER",href:"entrepreneur-assets.html"},{id:"lobbying",label:"LOBBYING",href:"entrepreneur-lobbying.html"}],g="ent-topbar-styles";function C(){if(document.getElementById(g))return;const e=document.createElement("style");e.id=g,e.textContent=`
  body { background:#050505; color:#d4d4d4; font-family:-apple-system,system-ui,sans-serif; margin:0; min-height:100vh; }
  .ent-topbar { display:flex; align-items:center; gap:24px; padding:12px 28px;
    border-bottom:0.5px solid rgba(255,255,255,0.08); font-size:11px; letter-spacing:0.05em; }
  .ent-topbar .brand { display:flex; align-items:center; gap:10px; }
  .ent-topbar .crest { width:24px; height:24px; background:#1a1f1a; border:0.5px solid #4a6a4a;
    border-radius:3px; display:flex; align-items:center; justify-content:center; color:#8aaa6a;
    font-size:11px; font-weight:600; letter-spacing:0.05em; }
  .ent-topbar .player { color:#fff; font-weight:500; font-size:13px; }
  .ent-topbar__version { font-family:var(--font-mono,monospace); font-size:10px; color:#f0efe6; letter-spacing:0.5px; opacity:0.8; }
  .ent-topbar .meta { display:flex; gap:22px; color:#888; }
  .ent-topbar .meta .label { color:#555; font-size:9px; letter-spacing:0.13em; }
  .ent-topbar .meta .value { color:#d4d4d4; font-size:12px; margin-top:2px; }
  .ent-topbar .right { margin-left:auto; display:flex; align-items:center; gap:14px; }
  .ent-topbar .cash-pill { border:0.5px solid #4a6a4a; padding:6px 12px; border-radius:3px; font-size:11px; }
  .ent-topbar .cash-pill .label { color:#888; }
  .ent-topbar .cash-pill .value { color:#8aaa6a; font-weight:500; }
  .ent-switcher { position:relative; display:inline-block; }
  .ent-pill { border:0.5px solid rgba(255,255,255,0.15); padding:6px 12px; border-radius:3px;
    font-size:11px; color:#8aaa6a; cursor:pointer; white-space:nowrap; }
  .ent-dd { position:absolute; right:0; top:calc(100% + 8px); background:#0f0f0f;
    border:0.5px solid rgba(255,255,255,0.15); border-radius:4px; min-width:240px; max-width:340px;
    display:none; z-index:100; overflow:hidden; }
  .ent-dd.open { display:block; }
  .ent-dd-item { display:flex; align-items:center; gap:10px; padding:10px 14px; font-size:11px;
    color:#d4d4d4; cursor:pointer; border-bottom:0.5px solid rgba(255,255,255,0.06); }
  .ent-dd-item:last-child { border-bottom:none; }
  .ent-dd-item:hover { background:#1a1a17; }
  .ent-dd-badge { font-size:9px; letter-spacing:0.06em; min-width:40px; }
  .ent-dd-name { flex:1; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .ent-dd-item.create, .ent-dd-item.create .ent-dd-name { color:#888; }
  .ent-util { color:#666; font-size:11px; cursor:pointer; }
  .ent-util:hover { color:#d4d4d4; }
  .ent-nav { display:flex; gap:32px; padding:0 28px; border-bottom:0.5px solid rgba(255,255,255,0.08);
    font-size:11px; letter-spacing:0.08em; }
  .ent-nav a { padding:14px 0; color:#888; text-decoration:none; cursor:pointer; }
  .ent-nav a:not(.active):hover { color:#d4d4d4; }
  .ent-nav a.active { color:#8aaa6a; border-bottom:1px solid #8aaa6a; }
  .ent-content { padding:28px; }

  /* ── Mobile (≤700px): wrap the topbar onto two visual rows
     (brand+right on top, meta below) and let the nav scroll
     horizontally if it overflows. */
  @media (max-width:700px) {
    .ent-topbar { flex-wrap:wrap; row-gap:8px; gap:10px; padding:10px 12px; }
    .ent-topbar .brand { flex:1 1 auto; min-width:0; }
    .ent-topbar .player { font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .ent-topbar .meta {
      order:99;            /* drop meta to the bottom of the wrap */
      width:100%;
      gap:14px;
      border-top:0.5px solid rgba(255,255,255,0.06);
      padding-top:8px;
    }
    .ent-topbar .meta .label { font-size:8px; }
    .ent-topbar .meta .value { font-size:11px; }
    .ent-topbar .right { margin-left:auto; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
    .ent-topbar .cash-pill { font-size:10px; padding:4px 8px; }
    .ent-pill { font-size:10px; padding:4px 8px; }
    .ent-util { font-size:10px; }
    .ent-dd { min-width:200px; max-width:calc(100vw - 24px); }
    .ent-nav {
      padding:0 12px;
      gap:18px;
      overflow-x:auto;
      -webkit-overflow-scrolling:touch;
      scrollbar-width:none;          /* Firefox */
    }
    .ent-nav::-webkit-scrollbar { display:none; }   /* WebKit */
    .ent-nav a { padding:12px 0; white-space:nowrap; }
    .ent-content { padding:18px 12px; }
  }

  /* Mobile refresh — phone-class viewport (~375px primary, 360px safe).
     Topbar wraps already at 700px; this tightens container padding so
     content gets every pixel of width at the narrow end. Used by every
     entrepreneur page that wraps content in .ent-content. */
  @media (max-width:360px) {
    .ent-topbar { padding:8px 10px; gap:8px; }
    .ent-nav { padding:0 10px; }
    .ent-content { padding:14px 10px; }
  }
  `,document.head.appendChild(e)}function c(e){const n=document.createElement("div");return n.textContent=e==null?"":String(e),n.innerHTML}let x=null;function T(e){const n=document.getElementById("ent-next-tick");if(!n||!e)return;const a=new Date(e).getTime(),o=()=>{const i=Math.max(0,a-Date.now());n.textContent=`${Math.floor(i/36e5)}h ${Math.floor(i%36e5/6e4)}m ${Math.floor(i%6e4/1e3)}s`};o(),x&&clearInterval(x),x=setInterval(o,1e3)}function L(e){const n=document.getElementById("ent-pill"),a=document.getElementById("ent-dd");if(!n||!a)return;a.replaceChildren();const o=(t,r,s,l,b)=>{const p=document.createElement("div");p.className="ent-dd-item"+(t?" "+t:"");const f=document.createElement("span");f.className="ent-dd-badge",s&&(f.style.color=s),f.textContent=r;const u=document.createElement("span");u.className="ent-dd-name",u.textContent=l,p.append(f,u),p.addEventListener("click",b),a.appendChild(p)};for(const t of e){const{label:r,color:s}=I(t.faction_type);o("",r,s,t.faction_name||"Unnamed",()=>{sessionStorage.setItem("active_faction_id",t.id),window.location.href=z(t)||"faction-select.html"})}const i=[{has:"party",name:"Found a Political Party",type:"party",url:"select-nation.html"},{has:"military",name:"Join a Military Faction",type:"military",url:"faction-select.html"}];for(const t of i)e.some(r=>r.faction_type===t.has)||o("create","+",null,t.name,()=>{sessionStorage.setItem("pending_faction_type",t.type),window.location.href=t.url});e.some(t=>t.faction_type==="politician")||o("create","+",null,"Join Project Neptune",()=>{sessionStorage.setItem("neptune_return_url",window.location.pathname+window.location.search),window.location.href="character-select.html"}),n.addEventListener("click",t=>{t.stopPropagation(),a.classList.toggle("open")}),document.addEventListener("click",t=>{!t.target.closest("#ent-pill")&&!t.target.closest("#ent-dd")&&a.classList.remove("open")})}const h="ent-arrest-styles";function $(){if(document.getElementById(h))return;const e=document.createElement("style");e.id=h,e.textContent=`
  .ent-banner { display:flex; align-items:center; gap:12px; padding:12px 28px;
    background:repeating-linear-gradient(45deg,#2a0d0d,#2a0d0d 12px,#241010 12px,#241010 24px);
    border-bottom:1px solid #7a2a2a; color:#ffb3b3; font-size:12px; letter-spacing:0.02em; line-height:1.5; }
  .ent-banner .lock { font-size:18px; line-height:1; }
  .ent-banner .title { color:#ff6b6b; font-weight:700; letter-spacing:0.08em; text-transform:uppercase; }
  .ent-banner .desc { color:#cf8c8c; }
  @media (max-width:700px){ .ent-banner{ padding:10px 12px; } }
  body.ent-arrested button,
  body.ent-arrested input,
  body.ent-arrested select,
  body.ent-arrested textarea,
  body.ent-arrested [role="button"] {
    pointer-events:none !important; opacity:0.4 !important; cursor:not-allowed !important; filter:grayscale(0.5); }
  body.ent-arrested #ent-banner,
  body.ent-arrested .ent-arrested-allow,
  body.ent-arrested .ent-arrested-allow * {
    pointer-events:auto !important; opacity:1 !important; cursor:auto !important; filter:none !important; }
  .ent-arrest-toast { position:fixed; left:50%; bottom:28px; transform:translateX(-50%);
    background:#2a0d0d; border:1px solid #7a2a2a; color:#ffb3b3; padding:10px 16px; border-radius:6px;
    font-size:12px; z-index:9999; box-shadow:0 6px 24px rgba(0,0,0,0.55); }
  `,document.head.appendChild(e)}let v=!1;function A(){const e=document.createElement("div");e.className="ent-arrest-toast",e.textContent="You are under arrest — this action is blocked.",document.body.appendChild(e),setTimeout(()=>e.remove(),3500)}function N(e){if(!(!!e&&String(e.status||"").toLowerCase()==="arrested"))return document.body.classList.remove("ent-arrested"),!1;$(),document.body.classList.add("ent-arrested");const a=document.getElementById("ent-topbar");return a&&!document.getElementById("ent-banner")&&a.insertAdjacentHTML("beforeend",`<div class="ent-banner" id="ent-banner">
         <span class="lock">🔒</span>
         <span><span class="title">Under Arrest</span> — your assets are frozen. You cannot found or close
         corporations, buy or sell shares, trade, invest, bid, or borrow. Existing businesses keep operating.
         <span class="desc">Contact an administrator to appeal.</span></span>
       </div>`),v||(v=!0,document.addEventListener("submit",o=>{document.body.classList.contains("ent-arrested")&&!o.target.closest("#ent-banner, .ent-arrested-allow, .ent-topbar, .ent-nav")&&(o.preventDefault(),o.stopImmediatePropagation(),A())},!0)),!0}function B(e,{faction:n,shard:a,allUserFactions:o,activeTab:i}){if(!e)return;C();const t=n||{},r=a||{},s=t.leader_first_name||(t.faction_name||"").split(/\s+/)[0]||"",l=t.leader_last_name||(t.faction_name||"").split(/\s+/).slice(1).join(" ")||"",b=((s[0]||"")+(l[0]||"")).toUpperCase()||"—",p=l?`${(s[0]||"").toUpperCase()}. ${l}`:s||"Entrepreneur",f=y(Number(t.party_funds)||0);e.innerHTML=`
    <div class="ent-topbar">
      <div class="brand"><div class="crest">${c(b)}</div><span class="player">${c(t.faction_name||p)}</span><span class="ent-topbar__version">${c(_)}</span></div>
      <div class="meta">
        <div><div class="label">GAME DATE</div><div class="value">${c(r.current_date||"—")}</div></div>
        <div><div class="label">TICK</div><div class="value">${r.current_tick!=null?c(r.current_tick):"—"}</div></div>
        <div><div class="label">NEXT TICK</div><div class="value" id="ent-next-tick">—</div></div>
      </div>
      <div class="right">
        <div class="cash-pill"><span class="label">CASH ON HAND: </span><span class="value">${c(f)}</span></div>
        <div class="ent-switcher">
          <span class="ent-pill" id="ent-pill" title="Switch faction">${c(p)} ▾</span>
          <div class="ent-dd" id="ent-dd"></div>
        </div>
        <span class="ent-util" id="ent-logout">Logout</span>
      </div>
    </div>
    <nav class="ent-nav">
      ${S.map(d=>`<a class="${d.id===i?"active":""}" href="${d.href}">${d.label}</a>`).join("")}
    </nav>`,L((o||[]).filter(d=>!E(d)&&!k(d))),T(r.next_tick_at);const u=document.getElementById("ent-logout");u&&u.addEventListener("click",async()=>{try{await m.auth.signOut()}catch(d){console.warn("[entrepreneur-topbar] signOut failed:",d?.message||d)}window.location.href="login.html"})}async function M(){try{const n=new URLSearchParams(window.location.search).get("faction_id"),a=n||sessionStorage.getItem("_admin_faction");if(!a)return null;n&&sessionStorage.setItem("_admin_faction",n);const{data:o}=await m.rpc("verify_admin_access");return!o||!o.authorized?null:a}catch(e){return console.warn("[entrepreneur-topbar] admin override check failed:",e?.message||e),null}}const w="id, faction_name, leader_first_name, leader_last_name, leader_age, nation, entrepreneur_archetype, ent_ambition, ent_cunning, ent_reputation, ent_vision, party_funds, status";async function P(e){const{data:{user:n}}=await m.auth.getUser();if(!n)return window.location.href="login.html",null;const a=await M(),[o,i,t]=await Promise.all([a?m.from("factions").select(w).eq("id",a).maybeSingle():m.from("factions").select(w).or(`id.eq.${n.id},linked_user_id.eq.${n.id}`).eq("faction_type","entrepreneur").is("abandoned_at",null).limit(1).maybeSingle(),m.from("shard").select("current_date, current_tick, next_tick_at").eq("name","Alpha Shard").maybeSingle(),m.from("factions").select("id, faction_type, faction_name, abbreviation, branch, nation_id, abandoned_at, is_banned, linked_user_id").or(`id.eq.${n.id},linked_user_id.eq.${n.id}`)]);if(o.error)throw o.error;const r=o.data;if(!r&&!a)return window.location.href="faction-select.html",null;r||console.warn("[entrepreneur-topbar] inspector faction not found:",a),i.error&&console.warn("[entrepreneur-topbar] shard load failed:",i.error.message),t.error&&console.warn("[entrepreneur-topbar] factions load failed:",t.error.message);const s=i.data||{},l=a?r?[r]:[]:t.data||[];return B(document.getElementById("ent-topbar"),{faction:r,shard:s,allUserFactions:l,activeTab:e}),N(r),{user:n,faction:r,shard:s,allUserFactions:l}}export{P as b};
