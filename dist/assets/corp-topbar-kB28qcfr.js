import{_ as E}from"./preload-helper-BXl3LOEh.js";const C="Alpha 2.1.5.3",$={Construction:"corp-operations.html",Shipping:"corp-operations-shipping.html",Finance:"corp-operations-finance.html"};function O(o){const a=$[o]||"corp-operations.html";return[{id:"home",label:"HOME",href:"corp-dashboard.html"},{id:"operations",label:"OPERATIONS",href:a},{id:"expansion",label:"EXPANSION",href:a+"?tab=expansion",samePageAction:"expansion"},{id:"actions",label:"ACTIONS",href:a+"?tab=actions",samePageAction:"actions"},{id:"innovation",label:"INNOVATION",disabled:!0},{id:"nations",label:"NATIONS",href:"corp-nations.html"},{id:"news",label:"NEWS",href:"news.html"},{id:"wiki",label:"WIKI",href:"wiki.html"}]}function p(o){if(!o)return"";const a=document.createElement("div");return a.textContent=o,a.innerHTML}function N(o,a={}){const{faction:i,shard:s,activeTab:g,allUserFactions:d,badges:l}=a,b=l||{},_=i?.corp_ticker||i?.abbreviation||"",e=Number(i?.corp_cash_reserves??0),h=e>=1e9?"$"+(e/1e9).toFixed(2)+"B":e>=1e6?"$"+(e/1e6).toFixed(2)+"M":e>=1e3?"$"+(e/1e3).toFixed(1)+"k":"$"+e,m=i?.custom_logo_url?`<img src="${p(i.custom_logo_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`:p(_.slice(0,2)||"—"),u=s?.current_date||"--",k=s?.current_tick??"--",v=window.location.pathname.split("/").pop().split("?")[0],f=i?.corp_sector||"Construction",A=$[f]||"corp-operations.html",y=v===A||v==="corp-operations.html"||v==="corp-operations-shipping.html"||v==="corp-operations-finance.html",x=O(f).map(t=>{const n=t.id===g;if(t.disabled)return`<span class="corp-nav-tab disabled">${t.label}</span>`;if(t.samePageAction&&y)return`<a href="#" class="corp-nav-tab${n?" active":""}" data-tab-action="${t.samePageAction}" style="text-decoration:none;">${t.label}</a>`;const c=b[t.id],r=c?`<span style="position:relative;top:-4px;margin-left:2px;display:inline-block;min-width:8px;height:8px;line-height:8px;border-radius:50%;font-size:0;background:${c.color||"#c8a832"};" title="${c.title||""}"></span>`:"";return`<a href="${t.href}" class="corp-nav-tab${n?" active":""}" style="text-decoration:none;">${t.label}${r}</a>`}).join("");let w="";d&&d.length>0&&(w=d.map(t=>{const n=i&&t.id===i.id,c=t.faction_type==="corporation"?"CORP":"PARTY",r=t.faction_type==="corporation"?"var(--teal)":"var(--amber)";return`<div class="corp-dd-item${n?" active":""}" data-faction-id="${t.id}" data-faction-type="${t.faction_type}">
                <span class="corp-dd-type" style="color:${r}">${c}</span>
                <span class="corp-dd-name">${p(t.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${p(t.abbreviation||"—")}]</span>
            </div>`}).join("")),o.innerHTML=`
        <div class="corp-topbar">
            <div class="corp-topbar__left">
                <div class="corp-topbar__badge">
                    <div class="corp-topbar__logo" id="corp-logo">${m}</div>
                    <span class="corp-topbar__name" id="corp-name-bar">${p(i?.faction_name||"Loading...")}</span>
                </div>
                <div class="corp-topbar__sep"></div>
                <div class="corp-topbar__ticks">
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">GAME DATE</div>
                        <div class="corp-topbar__tick-value" id="game-date">${p(String(u))}</div>
                    </div>
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">TICK</div>
                        <div class="corp-topbar__tick-value" id="tick-number">${k}</div>
                    </div>
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">NEXT CORP TICK</div>
                        <div class="corp-topbar__tick-value" id="tick-countdown">--</div>
                    </div>
                </div>
            </div>
            <div class="corp-topbar__version">${C}</div>
            <div class="corp-topbar__right">
                <span class="corp-topbar__cash" id="topbar-cash">CASH: ${h}</span>
                <div class="corp-topbar__switcher" id="faction-switcher">
                    <span class="corp-topbar__badge-btn" id="corp-name-badge" onclick="window._corpTopbarToggleDropdown()">[${p(_.toUpperCase()||"--")}] ▾</span>
                    <div class="corp-topbar__dropdown" id="corp-faction-dropdown">${w}</div>
                </div>
                <button class="corp-topbar__btn" onclick="window._corpTopbarToggleTheme()" id="theme-toggle">Light</button>
                <button class="corp-topbar__btn corp-topbar__btn--logout" onclick="window._corpTopbarLogout()">Logout</button>
            </div>
        </div>
        <div class="corp-topbar__nav">${x}</div>
    `,o.querySelectorAll("[data-tab-action]").forEach(t=>{t.addEventListener("click",n=>{n.preventDefault();const c=t.dataset.tabAction;o.querySelectorAll(".corp-nav-tab").forEach(r=>r.classList.remove("active")),t.classList.add("active"),c==="expansion"&&typeof window.switchToExpansion=="function"?window.switchToExpansion(n):c==="actions"&&typeof window.switchToActions=="function"&&window.switchToActions(n)})});const T=o.querySelector("#corp-faction-dropdown");T&&T.addEventListener("click",t=>{const n=t.target.closest(".corp-dd-item");if(!n)return;const c=n.dataset.factionId,r=n.dataset.factionType;sessionStorage.setItem("active_faction_id",c),r==="party"?window.location.href="dashboard.html":window.location.href="corp-dashboard.html"}),P(s)}function P(o){const a=document.getElementById("tick-countdown");if(!a||!o?.next_tick_at)return;const i=new Date(o.next_tick_at).getTime(),s=(Number(o.tick_interval_hours)||8)*36e5,d=i-s+s/2;function l(){const b=Date.now(),_=d>b?d:i+s/2,e=Math.max(0,_-b),h=Math.floor(e/36e5),m=Math.floor(e%36e5/6e4),u=Math.floor(e%6e4/1e3);a.textContent=`${h}h ${m}m ${u}s`}l(),setInterval(l,1e3)}window._corpTopbarToggleDropdown=function(){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.toggle("open")};window._corpTopbarToggleTheme=function(){document.body.classList.toggle("light-mode");const o=document.getElementById("theme-toggle");o&&(o.textContent=document.body.classList.contains("light-mode")?"Dark":"Light")};window._corpTopbarLogout=async function(){const{_supabase:o}=await E(async()=>{const{_supabase:a}=await import("./supabase-client-CiYoFhIh.js");return{_supabase:a}},[]);sessionStorage.clear(),await o.auth.signOut(),window.location.href="login.html"};export{N as renderCorpTopBar};
