import{_ as P}from"./preload-helper-BXl3LOEh.js";const E="Alpha 2.1.5.4",T={Construction:"corp-operations.html",Shipping:"corp-operations-shipping.html",Finance:"corp-operations-finance.html"};function S(o){const a=T[o]||"corp-operations.html";return[{id:"home",label:"HOME",href:"corp-dashboard.html"},{id:"operations",label:"OPERATIONS",href:a},{id:"expansion",label:"EXPANSION",href:a+"?tab=expansion",samePageAction:"expansion"},{id:"actions",label:"ACTIONS",href:a+"?tab=actions",samePageAction:"actions"},{id:"innovation",label:"INNOVATION",disabled:!0},{id:"nations",label:"NATIONS",href:"corp-nations.html"},{id:"news",label:"NEWS",href:"news.html"},{id:"wiki",label:"WIKI",href:"wiki.html"}]}function d(o){if(!o)return"";const a=document.createElement("div");return a.textContent=o,a.innerHTML}function L(o,a={}){const{faction:i,shard:s,activeTab:f,allUserFactions:r,badges:l}=a,b=l||{},_=i?.corp_ticker||i?.abbreviation||"",e=Number(i?.corp_cash_reserves??0),m=e>=1e9?"$"+(e/1e9).toFixed(2)+"B":e>=1e6?"$"+(e/1e6).toFixed(2)+"M":e>=1e3?"$"+(e/1e3).toFixed(1)+"k":"$"+e,h=i?.custom_logo_url?`<img src="${d(i.custom_logo_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`:d(_.slice(0,2)||"—"),u=s?.current_date||"--",$=s?.current_tick??"--",v=window.location.pathname.split("/").pop().split("?")[0],w=i?.corp_sector||"Construction",k=T[w]||"corp-operations.html",A=v===k||v==="corp-operations.html"||v==="corp-operations-shipping.html"||v==="corp-operations-finance.html",x=S(w).map(t=>{const n=t.id===f;if(t.disabled)return`<span class="corp-nav-tab disabled">${t.label}</span>`;if(t.samePageAction&&A)return`<a href="#" class="corp-nav-tab${n?" active":""}" data-tab-action="${t.samePageAction}" style="text-decoration:none;">${t.label}</a>`;const c=b[t.id],p=c?`<span style="position:relative;top:-4px;margin-left:2px;display:inline-block;min-width:8px;height:8px;line-height:8px;border-radius:50%;font-size:0;background:${c.color||"#c8a832"};" title="${c.title||""}"></span>`:"";return`<a href="${t.href}" class="corp-nav-tab${n?" active":""}" style="text-decoration:none;">${t.label}${p}</a>`}).join("");let g="";r&&r.length>0&&(g=r.map(t=>{const n=i&&t.id===i.id,c=t.faction_type==="corporation"?"CORP":"PARTY",p=t.faction_type==="corporation"?"var(--teal)":"var(--amber)";return`<div class="corp-dd-item${n?" active":""}" data-faction-id="${t.id}" data-faction-type="${t.faction_type}">
                <span class="corp-dd-type" style="color:${p}">${c}</span>
                <span class="corp-dd-name">${d(t.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${d(t.abbreviation||"—")}]</span>
            </div>`}).join("")),(r||[]).some(t=>t.faction_type==="party")||(g+=`<div class="corp-dd-item" data-action="found-party" style="border-top:1px solid var(--border-0, rgba(255,255,255,0.06));cursor:pointer;">
            <span class="corp-dd-type" style="color:var(--amber)">+</span>
            <span class="corp-dd-name">Found a Political Party</span>
        </div>`),o.innerHTML=`
        <div class="corp-topbar">
            <div class="corp-topbar__left">
                <div class="corp-topbar__badge">
                    <div class="corp-topbar__logo" id="corp-logo">${h}</div>
                    <span class="corp-topbar__name" id="corp-name-bar">${d(i?.faction_name||"Loading...")}</span>
                </div>
                <div class="corp-topbar__sep"></div>
                <div class="corp-topbar__ticks">
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">GAME DATE</div>
                        <div class="corp-topbar__tick-value" id="game-date">${d(String(u))}</div>
                    </div>
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">TICK</div>
                        <div class="corp-topbar__tick-value" id="tick-number">${$}</div>
                    </div>
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">NEXT CORP TICK</div>
                        <div class="corp-topbar__tick-value" id="tick-countdown">--</div>
                    </div>
                </div>
            </div>
            <div class="corp-topbar__version">${E}</div>
            <div class="corp-topbar__right">
                <span class="corp-topbar__cash" id="topbar-cash">CASH: ${m}</span>
                <div class="corp-topbar__switcher" id="faction-switcher">
                    <span class="corp-topbar__badge-btn" id="corp-name-badge" onclick="window._corpTopbarToggleDropdown()">[${d(_.toUpperCase()||"--")}] ▾</span>
                    <div class="corp-topbar__dropdown" id="corp-faction-dropdown">${g}</div>
                </div>
                <button class="corp-topbar__btn" onclick="window._corpTopbarToggleTheme()" id="theme-toggle">Light</button>
                <button class="corp-topbar__btn corp-topbar__btn--logout" onclick="window._corpTopbarLogout()">Logout</button>
            </div>
        </div>
        <div class="corp-topbar__nav">${x}</div>
    `,o.querySelectorAll("[data-tab-action]").forEach(t=>{t.addEventListener("click",n=>{n.preventDefault();const c=t.dataset.tabAction;o.querySelectorAll(".corp-nav-tab").forEach(p=>p.classList.remove("active")),t.classList.add("active"),c==="expansion"&&typeof window.switchToExpansion=="function"?window.switchToExpansion(n):c==="actions"&&typeof window.switchToActions=="function"&&window.switchToActions(n)})});const y=o.querySelector("#corp-faction-dropdown");y&&y.addEventListener("click",t=>{const n=t.target.closest(".corp-dd-item");if(!n)return;if(n.dataset.action==="found-party"){sessionStorage.setItem("pending_faction_type","party"),window.location.href="select-nation.html";return}const c=n.dataset.factionId,p=n.dataset.factionType;sessionStorage.setItem("active_faction_id",c),p==="party"?window.location.href="dashboard.html":window.location.href="corp-dashboard.html"}),C(s)}function C(o){const a=document.getElementById("tick-countdown");if(!a||!o?.next_tick_at)return;const i=new Date(o.next_tick_at).getTime(),s=(Number(o.tick_interval_hours)||8)*36e5,r=i-s+s/2;function l(){const b=Date.now(),_=r>b?r:i+s/2,e=Math.max(0,_-b),m=Math.floor(e/36e5),h=Math.floor(e%36e5/6e4),u=Math.floor(e%6e4/1e3);a.textContent=`${m}h ${h}m ${u}s`}l(),setInterval(l,1e3)}window._corpTopbarToggleDropdown=function(){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.toggle("open")};window._corpTopbarToggleTheme=function(){document.body.classList.toggle("light-mode");const o=document.getElementById("theme-toggle");o&&(o.textContent=document.body.classList.contains("light-mode")?"Dark":"Light")};window._corpTopbarLogout=async function(){const{_supabase:o}=await P(async()=>{const{_supabase:a}=await import("./supabase-client-CiYoFhIh.js");return{_supabase:a}},[]);sessionStorage.clear(),await o.auth.signOut(),window.location.href="login.html"};export{L as renderCorpTopBar};
