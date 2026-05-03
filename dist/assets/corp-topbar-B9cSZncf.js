import{_ as k}from"./preload-helper-BXl3LOEh.js";const E="Alpha 2.4.2.0",w="corpThemePref";function A(){try{const t=localStorage.getItem(w);document.body.classList.toggle("light-mode",t==="light")}catch{}}const $={Construction:"corp-operations.html",Shipping:"corp-operations-shipping.html",Finance:"corp-operations-finance.html",Airline:"airline-operations.html"},S=new Set(["a0f36506-f14e-4304-946c-ecb802e61adf"]);function I(t,e){const a=$[t]||"corp-operations.html",n=[{id:"home",label:"HOME",href:"corp-dashboard.html"}];return e&&S.has(e)&&n.push({id:"home2",label:"HOME2",href:"corp-dashboard-home2.html"}),n.push({id:"operations",label:"OPERATIONS",href:a},{id:"expansion",label:"EXPANSION",href:"expansion.html"},{id:"actions",label:"ACTIONS",href:"actions.html"},{id:"innovation",label:"INNOVATION",disabled:!0},{id:"nations",label:"NATIONS",href:"corp-nations.html"},{id:"news",label:"NEWS",href:"news.html"},{id:"wiki",label:"WIKI",href:"wiki.html"}),n}function d(t){if(!t)return"";const e=document.createElement("div");return e.textContent=t,e.innerHTML}function P(t,e={}){A();const{faction:a,shard:n,activeTab:b,allUserFactions:r,badges:l}=e,m=l||{},_=document.body.classList.contains("light-mode"),p=a?.corp_ticker||a?.abbreviation||"",h=a?.custom_logo_url?`<img src="${d(a.custom_logo_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`:d(p.slice(0,2)||"—"),u=n?.current_date||"--",g=n?.current_tick??"--",y=a?.corp_sector||"Construction",T=I(y,a?.id).map(o=>{const c=o.id===b;if(o.disabled)return`<span class="corp-nav-tab disabled">${o.label}</span>`;const i=m[o.id],s=i?`<span style="position:relative;top:-4px;margin-left:2px;display:inline-block;min-width:8px;height:8px;line-height:8px;border-radius:50%;font-size:0;background:${i.color||"#c8a832"};" title="${i.title||""}"></span>`:"";return`<a href="${o.href}" class="corp-nav-tab${c?" active":""}" style="text-decoration:none;">${o.label}${s}</a>`}).join("");let v="";r&&r.length>0&&(v=r.map(o=>{const c=a&&o.id===a.id,i=o.faction_type==="corporation"?"CORP":"PARTY",s=o.faction_type==="corporation"?"var(--teal)":"var(--amber)";return`<div class="corp-dd-item${c?" active":""}" data-faction-id="${o.id}" data-faction-type="${o.faction_type}">
                <span class="corp-dd-type" style="color:${s}">${i}</span>
                <span class="corp-dd-name">${d(o.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${d(o.abbreviation||"—")}]</span>
            </div>`}).join("")),(r||[]).some(o=>o.faction_type==="party")||(v+=`<div class="corp-dd-item" data-action="found-party" style="border-top:1px solid var(--border-0, rgba(255,255,255,0.06));cursor:pointer;">
            <span class="corp-dd-type" style="color:var(--amber)">+</span>
            <span class="corp-dd-name">Found a Political Party</span>
        </div>`),t.innerHTML=`
        <div class="corp-topbar">
            <div class="corp-topbar__left">
                <div class="corp-topbar__badge">
                    <div class="corp-topbar__logo" id="corp-logo">${h}</div>
                    <span class="corp-topbar__name" id="corp-name-bar">${d(a?.faction_name||"Loading...")}</span>
                </div>
                <div class="corp-topbar__sep"></div>
                <div class="corp-topbar__ticks">
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">GAME DATE</div>
                        <div class="corp-topbar__tick-value" id="game-date">${d(String(u))}</div>
                    </div>
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">TICK</div>
                        <div class="corp-topbar__tick-value" id="tick-number">${g}</div>
                    </div>
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">NEXT CORP TICK</div>
                        <div class="corp-topbar__tick-value" id="tick-countdown">--</div>
                    </div>
                </div>
            </div>
            <div class="corp-topbar__version">${E}</div>
            <div class="corp-topbar__right">
                <div class="corp-topbar__switcher" id="faction-switcher">
                    <span class="corp-topbar__badge-btn" id="corp-name-badge" onclick="window._corpTopbarToggleDropdown()">[${d(p.toUpperCase()||"--")}] ▾</span>
                    <div class="corp-topbar__dropdown" id="corp-faction-dropdown">${v}</div>
                </div>
                <button class="corp-topbar__btn" onclick="window._corpTopbarToggleTheme()" id="theme-toggle">${_?"Dark":"Light"}</button>
                ${b==="home2"?`<button class="corp-topbar__btn" onclick="window._corpHome2ToggleMode()" id="home2-mode-toggle" title="Home2 paper/dark mode">${document.documentElement.getAttribute("data-mode")==="paper"?"Dark":"Paper"}</button>`:""}
                <button class="corp-topbar__btn corp-topbar__btn--logout" onclick="window._corpTopbarLogout()">Logout</button>
            </div>
        </div>
        <div class="corp-topbar__nav">${T}</div>
    `,t.querySelectorAll("[data-tab-action]").forEach(o=>{o.addEventListener("click",c=>{c.preventDefault();const i=o.dataset.tabAction;t.querySelectorAll(".corp-nav-tab").forEach(s=>s.classList.remove("active")),o.classList.add("active"),i==="expansion"&&typeof window.switchToExpansion=="function"?window.switchToExpansion(c):i==="actions"&&typeof window.switchToActions=="function"&&window.switchToActions(c)})});const f=t.querySelector("#corp-faction-dropdown");f&&f.addEventListener("click",o=>{const c=o.target.closest(".corp-dd-item");if(!c)return;if(c.dataset.action==="found-party"){sessionStorage.setItem("pending_faction_type","party"),window.location.href="select-nation.html";return}const i=c.dataset.factionId,s=c.dataset.factionType;sessionStorage.setItem("active_faction_id",i),s==="party"?window.location.href="dashboard.html":window.location.href="corp-dashboard.html"}),x(n)}function x(t){const e=document.getElementById("tick-countdown");if(!e||!t?.next_tick_at)return;const a=new Date(t.next_tick_at).getTime(),n=(Number(t.tick_interval_hours)||8)*36e5,r=a-n+n/2;function l(){const m=Date.now(),_=r>m?r:a+n/2,p=Math.max(0,_-m),h=Math.floor(p/36e5),u=Math.floor(p%36e5/6e4),g=Math.floor(p%6e4/1e3);e.textContent=`${h}h ${u}m ${g}s`}l(),setInterval(l,1e3)}window._corpTopbarToggleDropdown=function(){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.toggle("open")};document.addEventListener("click",t=>{t.target.closest("#faction-switcher")||document.getElementById("corp-faction-dropdown")?.classList.remove("open")});window._corpTopbarToggleTheme=function(){const t=document.body.classList.toggle("light-mode");try{localStorage.setItem(w,t?"light":"dark")}catch{}const e=document.getElementById("theme-toggle");e&&(e.textContent=t?"Dark":"Light")};window._corpHome2ToggleMode=function(){const e=(document.documentElement.getAttribute("data-mode")==="paper"?"paper":"dark")==="paper"?"dark":"paper";document.documentElement.setAttribute("data-mode",e);try{localStorage.setItem("corp_home2_mode",e)}catch{}const a=document.getElementById("home2-mode-toggle");a&&(a.textContent=e==="paper"?"Dark":"Paper")};window._corpTopbarLogout=async function(){const{_supabase:t}=await k(async()=>{const{_supabase:e}=await import("./supabase-client-CiYoFhIh.js");return{_supabase:e}},[]);sessionStorage.clear(),await t.auth.signOut(),window.location.href="login.html"};export{$ as SECTOR_OPS_PAGE,P as renderCorpTopBar};
