import{_ as d}from"./supabase-client-BXEzLDpS.js";import{d as S,h as T,A as z}from"./utils-CzgKGX6o.js";import{i as h,b as L,c as C,g as M}from"./factions-C2s734Ze.js";const P=[{id:"home",label:"HOME",href:"politician-home.html"},{id:"movements",label:"MOVEMENTS",href:"politician-movements.html"},{id:"nation",label:"NATION",href:"politician-nation.html"},{id:"career",label:"CAREER",href:"politician-career.html"},{id:"resources",label:"RESOURCES",href:"politician-resources.html"}],y=25,B=12,k="pol-topbar-styles";function N(){if(document.getElementById(k))return;const t=document.createElement("style");t.id=k,t.textContent=`
  body { background:#050505; color:#d4d4d4; font-family:-apple-system,system-ui,sans-serif; margin:0; min-height:100vh; }
  .pol-topbar { display:flex; align-items:center; gap:24px; padding:12px 28px;
    border-bottom:0.5px solid rgba(255,255,255,0.08); font-size:11px; letter-spacing:0.05em;
    position:relative; }
  .pol-topbar .brand { display:flex; align-items:center; gap:10px; }
  .pol-topbar .crest { width:24px; height:24px; background:rgba(90,175,165,0.08); border:0.5px solid rgba(90,175,165,0.5);
    border-radius:3px; display:flex; align-items:center; justify-content:center; color:#5aafa5;
    font-size:11px; font-weight:600; letter-spacing:0.05em; }
  .pol-topbar .player { color:#fff; font-weight:500; font-size:13px; }
  /* Absolute-centred so the version sits dead-centre regardless of how meta /
     right items pack on either side. */
  .pol-topbar__version { position:absolute; left:50%; top:50%; transform:translate(-50%, -50%);
    font-family:monospace; font-size:10px; color:#f0efe6; letter-spacing:0.5px; opacity:0.8;
    pointer-events:none; }
  .pol-topbar .meta { display:flex; gap:22px; color:#888; align-items:center; }
  .pol-topbar .meta .label { color:#555; font-size:9px; letter-spacing:0.13em; }
  .pol-topbar .meta .value { color:#d4d4d4; font-size:12px; margin-top:2px; display:flex; align-items:center; gap:6px; }
  .pol-topbar .meta .flag { width:18px; height:12px; object-fit:cover; border:0.5px solid rgba(255,255,255,0.1); }
  .pol-topbar .right { margin-left:auto; display:flex; align-items:center; gap:14px; position:relative; }
  .pol-topbar .cash-pill { border:0.5px solid rgba(90,175,165,0.5); padding:6px 12px; border-radius:3px; font-size:11px; }
  .pol-topbar .cash-pill .label { color:#888; }
  .pol-topbar .cash-pill .value { color:#5aafa5; font-weight:500; }
  .pol-switcher { position:relative; display:inline-block; }
  .pol-pill { border:0.5px solid rgba(255,255,255,0.15); padding:6px 12px; border-radius:3px;
    font-size:11px; color:#5aafa5; cursor:pointer; white-space:nowrap; }
  .pol-dd { position:absolute; right:0; top:calc(100% + 8px); background:#0f0f0f;
    border:0.5px solid rgba(255,255,255,0.15); border-radius:4px; min-width:240px; max-width:340px;
    display:none; z-index:100; overflow:hidden; }
  .pol-dd.open { display:block; }
  .pol-dd-item { display:flex; align-items:center; gap:10px; padding:10px 14px; font-size:11px;
    color:#d4d4d4; cursor:pointer; border-bottom:0.5px solid rgba(255,255,255,0.06); }
  .pol-dd-item:last-child { border-bottom:none; }
  .pol-dd-item:hover { background:#1a1a17; }
  .pol-dd-badge { font-size:9px; letter-spacing:0.06em; min-width:40px; }
  .pol-dd-name { flex:1; color:#fff; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .pol-dd-empty { padding:10px; color:#666; font-size:10px; }
  .pol-util { color:#666; font-size:11px; cursor:pointer; }
  .pol-util:hover { color:#d4d4d4; }
  .pol-nav { display:flex; gap:32px; padding:0 28px; border-bottom:0.5px solid rgba(255,255,255,0.08);
    font-size:11px; letter-spacing:0.08em; }
  .pol-nav a { padding:14px 0; color:#888; text-decoration:none; cursor:pointer; }
  .pol-nav a:not(.active):hover { color:#d4d4d4; }
  .pol-nav a.active { color:#5aafa5; border-bottom:1px solid #5aafa5; }

  @media (max-width:700px) {
    .pol-topbar { flex-wrap:wrap; row-gap:8px; gap:10px; padding:10px 12px; }
    .pol-topbar .brand { flex:1 1 auto; min-width:0; }
    .pol-topbar .player { font-size:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    /* Absolute-centred version doesn't make sense once the bar wraps; hide it. */
    .pol-topbar__version { display:none; }
    .pol-topbar .meta { order:99; width:100%; gap:14px; border-top:0.5px solid rgba(255,255,255,0.06); padding-top:8px; }
    .pol-topbar .meta .label { font-size:8px; }
    .pol-topbar .meta .value { font-size:11px; }
    .pol-topbar .right { margin-left:auto; gap:8px; flex-wrap:wrap; justify-content:flex-end; }
    .pol-topbar .cash-pill, .pol-pill { font-size:10px; padding:4px 8px; }
    .pol-util { font-size:10px; }
    .pol-dd { min-width:200px; max-width:calc(100vw - 24px); }
    .pol-nav { padding:0 12px; gap:18px; overflow-x:auto; -webkit-overflow-scrolling:touch; }
  }`,document.head.appendChild(t)}function s(t){const i=document.createElement("div");return i.textContent=t==null?"":String(t),i.innerHTML}function O(t){return String(t??"").replace(/"/g,"&quot;")}function R(t){return t?t.nation_profiles&&t.nation_profiles.flag_url||t.flag_url||`assets/flags/${t.name}.png`:""}function q(t,i){if(!t||t.founded_tick==null)return y;const o=Math.max(0,(i||0)-Number(t.founded_tick));return y+Math.floor(o/B)}let v=null;function H(t){const i=document.getElementById("pol-next-tick");if(!i||!t)return;const o=new Date(t).getTime(),a=()=>{const r=Math.max(0,o-Date.now());i.textContent=`${Math.floor(r/36e5)}h ${Math.floor(r%36e5/6e4)}m ${Math.floor(r%6e4/1e3)}s`};a(),v&&clearInterval(v),v=setInterval(a,1e3)}function U(t){const i=document.getElementById("pol-dd");if(i){if(!t.length){i.innerHTML='<div class="pol-dd-empty">No other factions.</div>';return}i.innerHTML=t.map(o=>{const{label:a,color:r}=C(o.faction_type);return`<div class="pol-dd-item" data-id="${s(o.id)}">
      <span class="pol-dd-badge" style="color:${r}">${s(a)}</span>
      <span class="pol-dd-name">${s(o.faction_name||"Unnamed")}</span>
    </div>`}).join(""),i.querySelectorAll(".pol-dd-item").forEach(o=>{o.addEventListener("click",()=>{const a=t.find(r=>r.id===o.dataset.id);a&&(sessionStorage.setItem("active_faction_id",a.id),window.location.href=M(a)||"faction-select.html")})})}}function F(t,{faction:i,shard:o,nation:a,allUserFactions:r,activeTab:u}){if(!t)return;N();const p=i||{},l=o||{},c=p.leader_first_name||"",f=p.leader_last_name||"",_=(p.nickname||"").trim(),g=((c[0]||"")+(f[0]||"")).toUpperCase()||"—",e=S(p)||"Politician",m=f?`${(c[0]||"").toUpperCase()}. ${f}`:c||"Politician",E=_?`${m} (${_})`:m,$=T(Number(p.political_capital)||0),I=String(q(p,l.current_tick||0)),A=a?`<img class="flag" src="${O(R(a))}" alt="" onerror="this.style.visibility='hidden'">${s(a.name)}`:"—";t.innerHTML=`
    <div class="pol-topbar">
      <div class="brand">
        <div class="crest">${s(g)}</div>
        <span class="player">${s(e)}</span>
      </div>
      <span class="pol-topbar__version">${s(z)}</span>
      <div class="meta">
        <div><div class="label">AGE</div><div class="value">${s(I)}</div></div>
        <div><div class="label">NATION</div><div class="value">${A}</div></div>
        <div><div class="label">GAME DATE</div><div class="value">${s(l.current_date||"—")}</div></div>
        <div><div class="label">TICK</div><div class="value">${l.current_tick!=null?s(l.current_tick):"—"}</div></div>
        <div><div class="label">NEXT TICK</div><div class="value" id="pol-next-tick">—</div></div>
      </div>
      <div class="right">
        <div class="cash-pill"><span class="label">POLITICAL CAPITAL: </span><span class="value">${s($)}</span></div>
        <div class="pol-switcher">
          <span class="pol-pill" id="pol-pill" title="Switch faction">${s(E)} &#x25BE;</span>
          <div class="pol-dd" id="pol-dd"></div>
        </div>
        <span class="pol-util" id="pol-logout">Logout</span>
      </div>
    </div>
    <nav class="pol-nav">
      ${P.map(n=>`<a class="${n.id===u?"active":""}" href="${n.href}">${s(n.label)}</a>`).join("")}
    </nav>`,U((r||[]).filter(n=>!h(n)&&!L(n))),H(l.next_tick_at);const x=document.getElementById("pol-pill"),b=document.getElementById("pol-dd");x&&b&&(x.addEventListener("click",n=>{n.stopPropagation(),b.classList.toggle("open")}),document.addEventListener("click",n=>{!n.target.closest("#pol-pill")&&!n.target.closest("#pol-dd")&&b.classList.remove("open")}));const w=document.getElementById("pol-logout");w&&w.addEventListener("click",async()=>{try{await d.auth.signOut()}catch(n){console.warn("[politician-topbar] signOut failed:",n?.message||n)}window.location.href="login.html"})}async function K(t){const{data:{user:i}}=await d.auth.getUser();if(!i)return window.location.href="login.html",null;const[o,a]=await Promise.all([d.from("factions").select("id, faction_type, faction_name, nation_id, branch, leader_first_name, leader_last_name, nickname, founded_tick, party_funds, abandoned_at, is_banned, politician_standing, politician_reputation, politician_credibility, political_capital, politician_suspicion, volunteers, politician_party_id, politician_office, politician_office_won_at_tick, politician_ministry, civil_service_exam_cooldown_until_tick, speech_cooldown_until_tick, door_knock_cooldown_until_tick, next_member_action_tick, next_party_motion_tick, next_mp_action_tick, next_local_action_tick").or(`id.eq.${i.id},linked_user_id.eq.${i.id}`),d.from("shard").select("current_tick, current_date, next_tick_at").eq("name","Alpha Shard").single()]);if(o.error)throw o.error;if(a.error)throw a.error;const r=o.data||[],u=a.data||{},p=sessionStorage.getItem("active_faction_id"),l=r.find(e=>e.id===p&&e.faction_type==="politician"&&!h(e))||r.find(e=>e.faction_type==="politician"&&!h(e))||null;if(!l)return window.location.href="character-select.html",null;let c=null;if(l.nation_id)try{const{data:e,error:m}=await d.from("nations").select(`
          id, name, flag_url, government_type, capital, total_seats,
          election_frequency, next_election_tick,
          head_of_state_title, head_of_state_first_name, head_of_state_last_name,
          population, dynasty_name,
          politician_gdp, politician_budget, politician_debt,
          politician_stability, politician_civil_freedoms, politician_gdp_growth,
          nation_profiles(flag_url, official_name, motto, overview, founded_year)
        `).eq("id",l.nation_id).maybeSingle();m||(c=e)}catch{}let f=null;if(l.politician_party_id)try{const{data:e,error:m}=await d.from("factions").select("id, faction_name, abbreviation").eq("id",l.politician_party_id).is("abandoned_at",null).maybeSingle();m||(f=e||null)}catch{}const _=r.filter(e=>e.id!==l.id),g=document.getElementById("pol-topbar-container");return g&&F(g,{faction:l,shard:u,nation:c,allUserFactions:_,activeTab:t}),d.rpc("resolve_due_general_elections").then(({error:e})=>{e&&console.warn("[politician-topbar] resolve_due_general_elections:",e.message)}).catch(e=>console.warn("[politician-topbar] resolve_due_general_elections threw:",e?.message||e)),d.rpc("resolve_due_bills").then(({error:e})=>{e&&console.warn("[politician-topbar] resolve_due_bills:",e.message)}).catch(e=>console.warn("[politician-topbar] resolve_due_bills threw:",e?.message||e)),{user:i,faction:l,shard:u,nation:c,allUserFactions:_,party:f}}export{K as b};
