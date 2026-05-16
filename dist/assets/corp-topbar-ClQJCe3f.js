const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/messaging-CDvHiz8o.js","assets/supabase-client-CiYoFhIh.js","assets/utils-oN1e812_.js","assets/government-structure-DVzKGcwP.js","assets/government-types-CNjNcIHN.js","assets/notifications-DPf3bSkH.js"])))=>i.map(i=>d[i]);
import{_ as w}from"./preload-helper-BXl3LOEh.js";import{a as I,b as x}from"./factions-1eoRseVF.js";const C="Alpha 2.6.0.0",k="corpThemePref";let T=!1;function L(){try{const t=localStorage.getItem(k);document.body.classList.toggle("light-mode",t==="light")}catch{}}const M={Construction:"corp-operations.html",Shipping:"corp-operations-shipping.html",Finance:"corp-operations-finance.html",Airline:"airline-operations.html","Aviation Manufacturing":"aviation-operations.html"},P=new Set(["a0f36506-f14e-4304-946c-ecb802e61adf"]);function N(t,e){const a=M[t]||"corp-operations.html",n=[{id:"home",label:"HOME",href:"corp-dashboard.html"}];return e&&P.has(e)&&n.push({id:"home2",label:"HOME2",href:"corp-dashboard-home2.html"}),n.push({id:"operations",label:"OPERATIONS",href:a},{id:"expansion",label:"EXPANSION",href:"expansion.html"},{id:"actions",label:"ACTIONS",href:"actions.html"},{id:"alliances",label:"STRATEGIC ALLIANCES",href:"alliances.html"},{id:"nations",label:"NATIONS",href:"corp-nations.html"},{id:"news",label:"NEWS",href:"news.html"},{id:"wiki",label:"WIKI",href:"wiki.html"}),n}function r(t){if(!t)return"";const e=document.createElement("div");return e.textContent=t,e.innerHTML}function j(t,e={}){L();const{faction:a,shard:n,activeTab:u,allUserFactions:s,badges:_}=e,b=_||{},h=document.body.classList.contains("light-mode"),l=a?.corp_ticker||a?.abbreviation||"",f=a?.custom_logo_url?`<img src="${r(a.custom_logo_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`:r(l.slice(0,2)||"—"),g=n?.current_date||"--",v=n?.current_tick??"--",p=Number(a?.corp_cash_reserves??0),E=Number.isFinite(p)?p>=1e6?"$"+(p/1e6).toFixed(1)+"M":p>=1e3?"$"+Math.round(p/1e3)+"k":"$"+p:"$0",A=a?.corp_sector||"Construction",$=N(A,a?.id).map(o=>{const i=o.id===u;if(o.disabled)return`<span class="corp-nav-tab disabled">${o.label}</span>`;const c=b[o.id],d=c?`<span style="position:relative;top:-4px;margin-left:2px;display:inline-block;min-width:8px;height:8px;line-height:8px;border-radius:50%;font-size:0;background:${c.color||"#c8a832"};" title="${c.title||""}"></span>`:"";return`<a href="${o.href}" class="corp-nav-tab${i?" active":""}" style="text-decoration:none;">${o.label}${d}</a>`}).join("");let m="";s&&s.length>0&&(m=s.map(o=>{const i=a&&o.id===a.id,{label:c,color:d}=I(o.faction_type);return`<div class="corp-dd-item${i?" active":""}" data-faction-id="${o.id}">
                <span class="corp-dd-type" style="color:${d}">${c}</span>
                <span class="corp-dd-name">${r(o.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${r(o.abbreviation||"—")}]</span>
            </div>`}).join("")),(s||[]).some(o=>o.faction_type==="party")||(m+=`<div class="corp-dd-item" data-action="found-party" style="border-top:1px solid var(--border-0, rgba(255,255,255,0.06));cursor:pointer;">
            <span class="corp-dd-type" style="color:var(--amber)">+</span>
            <span class="corp-dd-name">Found a Political Party</span>
        </div>`),(s||[]).some(o=>o.faction_type==="military")||(m+=`<div class="corp-dd-item" data-action="join-military" style="border-top:1px solid var(--border-0, rgba(255,255,255,0.06));cursor:pointer;">
            <span class="corp-dd-type" style="color:var(--red)">+</span>
            <span class="corp-dd-name">Join a Military Branch</span>
        </div>`),t.innerHTML=`
        <div class="corp-topbar">
            <div class="corp-topbar__left">
                <div class="corp-topbar__badge">
                    <div class="corp-topbar__logo" id="corp-logo">${f}</div>
                    <span class="corp-topbar__name" id="corp-name-bar">${r(a?.faction_name||"Loading...")}</span>
                </div>
                <div class="corp-topbar__sep"></div>
                <div class="corp-topbar__ticks">
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">GAME DATE</div>
                        <div class="corp-topbar__tick-value" id="game-date">${r(String(g))}</div>
                    </div>
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">TICK</div>
                        <div class="corp-topbar__tick-value" id="tick-number">${v}</div>
                    </div>
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">NEXT CORP TICK</div>
                        <div class="corp-topbar__tick-value" id="tick-countdown">--</div>
                    </div>
                </div>
            </div>
            <div class="corp-topbar__version">${C}</div>
            <div class="corp-topbar__right">
                <span class="corp-topbar__cash" id="corp-topbar-cash">
                    <span class="corp-topbar__cash-label">CASH:</span>
                    <span class="corp-topbar__cash-value" id="corp-topbar-cash-value">${r(E)}</span>
                </span>
                <div class="corp-topbar__switcher" id="faction-switcher">
                    <span class="corp-topbar__badge-btn" id="corp-name-badge" onclick="window._corpTopbarToggleDropdown()">[${r(l.toUpperCase()||"--")}] ▾</span>
                    <div class="corp-topbar__dropdown" id="corp-faction-dropdown">${m}</div>
                </div>
                <span class="notif-wrap" style="display:inline-flex;">
                    <button id="notif-bell" class="notif-bell" type="button" aria-label="Notifications" aria-haspopup="true" aria-expanded="false">
                        <span class="notif-bell__icon">&#9788;</span>
                        <span id="notif-dot" class="notif-bell__dot" hidden></span>
                    </button>
                    <div id="notif-dropdown" class="notif-dropdown" hidden role="dialog" aria-label="Notifications">
                        <div class="notif-dropdown__header">
                            <span class="notif-dropdown__title">Notifications</span>
                            <span class="notif-dropdown__count" id="notif-count">0</span>
                        </div>
                        <div class="notif-dropdown__list" id="notif-list"></div>
                    </div>
                </span>
                <button class="corp-topbar__btn" onclick="window._corpTopbarToggleTheme()" id="theme-toggle">${h?"Dark":"Light"}</button>
                ${u==="home2"?`<button class="corp-topbar__btn" onclick="window._corpHome2ToggleMode()" id="home2-mode-toggle" title="Home2 paper/dark mode">${document.documentElement.getAttribute("data-mode")==="paper"?"Dark":"Paper"}</button>`:""}
                <button class="corp-topbar__btn corp-topbar__btn--logout" onclick="window._corpTopbarLogout()">Logout</button>
            </div>
        </div>
        <div class="corp-topbar__nav">${$}</div>
    `,t.querySelectorAll("[data-tab-action]").forEach(o=>{o.addEventListener("click",i=>{i.preventDefault();const c=o.dataset.tabAction;t.querySelectorAll(".corp-nav-tab").forEach(d=>d.classList.remove("active")),o.classList.add("active"),c==="expansion"&&typeof window.switchToExpansion=="function"?window.switchToExpansion(i):c==="actions"&&typeof window.switchToActions=="function"&&window.switchToActions(i)})});const y=t.querySelector("#corp-faction-dropdown");y&&y.addEventListener("click",o=>{const i=o.target.closest(".corp-dd-item");if(!i)return;if(i.dataset.action==="found-party"){sessionStorage.setItem("pending_faction_type","party"),window.location.href="select-nation.html";return}if(i.dataset.action==="join-military"){sessionStorage.setItem("pending_faction_type","military"),window.location.href="faction-select.html";return}const c=i.dataset.factionId;sessionStorage.setItem("active_faction_id",c);const d=(s||[]).find(S=>S.id===c);window.location.href=x(d)||"corp-dashboard.html"}),O(n),a?.id&&!T&&(T=!0,(typeof requestIdleCallback=="function"?requestIdleCallback:setTimeout)(()=>{w(()=>import("./messaging-CDvHiz8o.js"),__vite__mapDeps([0,1,2,3,4])).then(i=>i.initMessaging(a,e.nation||null,n)).catch(i=>console.warn("[corp-topbar] messaging init failed:",i)),w(()=>import("./notifications-DPf3bSkH.js"),__vite__mapDeps([5,1,2])).then(i=>i.initNotifications({faction:a,nation:e.nation||null,shard:n})).catch(i=>console.warn("[corp-topbar] notifications init failed:",i))}))}function O(t){const e=document.getElementById("tick-countdown");if(!e||!t?.next_tick_at)return;const a=new Date(t.next_tick_at).getTime(),n=(Number(t.tick_interval_hours)||8)*36e5,s=a-n+n/2;function _(){const b=Date.now(),h=s>b?s:a+n/2,l=Math.max(0,h-b),f=Math.floor(l/36e5),g=Math.floor(l%36e5/6e4),v=Math.floor(l%6e4/1e3);e.textContent=`${f}h ${g}m ${v}s`}_(),setInterval(_,1e3)}window._corpTopbarToggleDropdown=function(){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.toggle("open")};document.addEventListener("click",t=>{t.target.closest("#faction-switcher")||document.getElementById("corp-faction-dropdown")?.classList.remove("open")});window._corpTopbarToggleTheme=function(){const t=document.body.classList.toggle("light-mode");try{localStorage.setItem(k,t?"light":"dark")}catch{}const e=document.getElementById("theme-toggle");e&&(e.textContent=t?"Dark":"Light")};window._corpHome2ToggleMode=function(){const e=(document.documentElement.getAttribute("data-mode")==="paper"?"paper":"dark")==="paper"?"dark":"paper";document.documentElement.setAttribute("data-mode",e);try{localStorage.setItem("corp_home2_mode",e)}catch{}const a=document.getElementById("home2-mode-toggle");a&&(a.textContent=e==="paper"?"Dark":"Paper")};window._corpTopbarLogout=async function(){const{_supabase:t}=await w(async()=>{const{_supabase:e}=await import("./supabase-client-CiYoFhIh.js");return{_supabase:e}},[]);sessionStorage.clear(),await t.auth.signOut(),window.location.href="login.html"};export{M as SECTOR_OPS_PAGE,j as renderCorpTopBar};
