import{_ as P}from"./preload-helper-BXl3LOEh.js";const O="Alpha 2.2.0.4",T="corpThemePref";function C(){try{const t=localStorage.getItem(T);document.body.classList.toggle("light-mode",t==="light")}catch{}}const k={Construction:"corp-operations.html",Shipping:"corp-operations-shipping.html",Finance:"corp-operations-finance.html"},I=new Set(["a0f36506-f14e-4304-946c-ecb802e61adf"]);function L(t,a){const e=k[t]||"corp-operations.html",c=[{id:"home",label:"HOME",href:"corp-dashboard.html"}];return a&&I.has(a)&&c.push({id:"home2",label:"HOME2",href:"corp-dashboard-home2.html"}),c.push({id:"operations",label:"OPERATIONS",href:e},{id:"expansion",label:"EXPANSION",href:e+"?tab=expansion",samePageAction:"expansion"},{id:"actions",label:"ACTIONS",href:e+"?tab=actions",samePageAction:"actions"},{id:"innovation",label:"INNOVATION",disabled:!0},{id:"nations",label:"NATIONS",href:"corp-nations.html"},{id:"news",label:"NEWS",href:"news.html"},{id:"wiki",label:"WIKI",href:"wiki.html"}),c}function p(t){if(!t)return"";const a=document.createElement("div");return a.textContent=t,a.innerHTML}function R(t,a={}){C();const{faction:e,shard:c,activeTab:h,allUserFactions:s,badges:b}=a,m=b||{},u=document.body.classList.contains("light-mode"),l=e?.corp_ticker||e?.abbreviation||"",r=Number(e?.corp_cash_reserves??0),g=r>=1e9?"$"+(r/1e9).toFixed(2)+"B":r>=1e6?"$"+(r/1e6).toFixed(2)+"M":r>=1e3?"$"+(r/1e3).toFixed(1)+"k":"$"+r,v=e?.custom_logo_url?`<img src="${p(e.custom_logo_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`:p(l.slice(0,2)||"—"),$=c?.current_date||"--",A=c?.current_tick??"--",_=window.location.pathname.split("/").pop().split("?")[0],w=e?.corp_sector||"Construction",E=k[w]||"corp-operations.html",S=_===E||_==="corp-operations.html"||_==="corp-operations-shipping.html"||_==="corp-operations-finance.html",x=L(w,e?.id).map(o=>{const n=o.id===h;if(o.disabled)return`<span class="corp-nav-tab disabled">${o.label}</span>`;if(o.samePageAction&&S)return`<a href="#" class="corp-nav-tab${n?" active":""}" data-tab-action="${o.samePageAction}" style="text-decoration:none;">${o.label}</a>`;const i=m[o.id],d=i?`<span style="position:relative;top:-4px;margin-left:2px;display:inline-block;min-width:8px;height:8px;line-height:8px;border-radius:50%;font-size:0;background:${i.color||"#c8a832"};" title="${i.title||""}"></span>`:"";return`<a href="${o.href}" class="corp-nav-tab${n?" active":""}" style="text-decoration:none;">${o.label}${d}</a>`}).join("");let f="";s&&s.length>0&&(f=s.map(o=>{const n=e&&o.id===e.id,i=o.faction_type==="corporation"?"CORP":"PARTY",d=o.faction_type==="corporation"?"var(--teal)":"var(--amber)";return`<div class="corp-dd-item${n?" active":""}" data-faction-id="${o.id}" data-faction-type="${o.faction_type}">
                <span class="corp-dd-type" style="color:${d}">${i}</span>
                <span class="corp-dd-name">${p(o.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${p(o.abbreviation||"—")}]</span>
            </div>`}).join("")),(s||[]).some(o=>o.faction_type==="party")||(f+=`<div class="corp-dd-item" data-action="found-party" style="border-top:1px solid var(--border-0, rgba(255,255,255,0.06));cursor:pointer;">
            <span class="corp-dd-type" style="color:var(--amber)">+</span>
            <span class="corp-dd-name">Found a Political Party</span>
        </div>`),t.innerHTML=`
        <div class="corp-topbar">
            <div class="corp-topbar__left">
                <div class="corp-topbar__badge">
                    <div class="corp-topbar__logo" id="corp-logo">${v}</div>
                    <span class="corp-topbar__name" id="corp-name-bar">${p(e?.faction_name||"Loading...")}</span>
                </div>
                <div class="corp-topbar__sep"></div>
                <div class="corp-topbar__ticks">
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">GAME DATE</div>
                        <div class="corp-topbar__tick-value" id="game-date">${p(String($))}</div>
                    </div>
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">TICK</div>
                        <div class="corp-topbar__tick-value" id="tick-number">${A}</div>
                    </div>
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">NEXT CORP TICK</div>
                        <div class="corp-topbar__tick-value" id="tick-countdown">--</div>
                    </div>
                </div>
            </div>
            <div class="corp-topbar__version">${O}</div>
            <div class="corp-topbar__right">
                <span class="corp-topbar__cash" id="topbar-cash">CASH: ${g}</span>
                <div class="corp-topbar__switcher" id="faction-switcher">
                    <span class="corp-topbar__badge-btn" id="corp-name-badge" onclick="window._corpTopbarToggleDropdown()">[${p(l.toUpperCase()||"--")}] ▾</span>
                    <div class="corp-topbar__dropdown" id="corp-faction-dropdown">${f}</div>
                </div>
                <button class="corp-topbar__btn" onclick="window._corpTopbarToggleTheme()" id="theme-toggle">${u?"Dark":"Light"}</button>
                ${h==="home2"?`<button class="corp-topbar__btn" onclick="window._corpHome2ToggleMode()" id="home2-mode-toggle" title="Home2 paper/dark mode">${document.documentElement.getAttribute("data-mode")==="paper"?"Dark":"Paper"}</button>`:""}
                <button class="corp-topbar__btn corp-topbar__btn--logout" onclick="window._corpTopbarLogout()">Logout</button>
            </div>
        </div>
        <div class="corp-topbar__nav">${x}</div>
    `,t.querySelectorAll("[data-tab-action]").forEach(o=>{o.addEventListener("click",n=>{n.preventDefault();const i=o.dataset.tabAction;t.querySelectorAll(".corp-nav-tab").forEach(d=>d.classList.remove("active")),o.classList.add("active"),i==="expansion"&&typeof window.switchToExpansion=="function"?window.switchToExpansion(n):i==="actions"&&typeof window.switchToActions=="function"&&window.switchToActions(n)})});const y=t.querySelector("#corp-faction-dropdown");y&&y.addEventListener("click",o=>{const n=o.target.closest(".corp-dd-item");if(!n)return;if(n.dataset.action==="found-party"){sessionStorage.setItem("pending_faction_type","party"),window.location.href="select-nation.html";return}const i=n.dataset.factionId,d=n.dataset.factionType;sessionStorage.setItem("active_faction_id",i),d==="party"?window.location.href="dashboard.html":window.location.href="corp-dashboard.html"}),N(c)}function N(t){const a=document.getElementById("tick-countdown");if(!a||!t?.next_tick_at)return;const e=new Date(t.next_tick_at).getTime(),c=(Number(t.tick_interval_hours)||8)*36e5,s=e-c+c/2;function b(){const m=Date.now(),u=s>m?s:e+c/2,l=Math.max(0,u-m),r=Math.floor(l/36e5),g=Math.floor(l%36e5/6e4),v=Math.floor(l%6e4/1e3);a.textContent=`${r}h ${g}m ${v}s`}b(),setInterval(b,1e3)}window._corpTopbarToggleDropdown=function(){const t=document.getElementById("corp-faction-dropdown");t&&t.classList.toggle("open")};window._corpTopbarToggleTheme=function(){const t=document.body.classList.toggle("light-mode");try{localStorage.setItem(T,t?"light":"dark")}catch{}const a=document.getElementById("theme-toggle");a&&(a.textContent=t?"Dark":"Light")};window._corpHome2ToggleMode=function(){const a=(document.documentElement.getAttribute("data-mode")==="paper"?"paper":"dark")==="paper"?"dark":"paper";document.documentElement.setAttribute("data-mode",a);try{localStorage.setItem("corp_home2_mode",a)}catch{}const e=document.getElementById("home2-mode-toggle");e&&(e.textContent=a==="paper"?"Dark":"Paper")};window._corpTopbarLogout=async function(){const{_supabase:t}=await P(async()=>{const{_supabase:a}=await import("./supabase-client-CiYoFhIh.js");return{_supabase:a}},[]);sessionStorage.clear(),await t.auth.signOut(),window.location.href="login.html"};export{R as renderCorpTopBar};
