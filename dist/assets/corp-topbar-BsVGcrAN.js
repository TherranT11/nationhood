import{_ as S}from"./preload-helper-BXl3LOEh.js";const C="Alpha 2.2.0.1",T="corpThemePref";function I(){try{const o=localStorage.getItem(T);document.body.classList.toggle("light-mode",o==="light")}catch{}}const $={Construction:"corp-operations.html",Shipping:"corp-operations-shipping.html",Finance:"corp-operations-finance.html"};function O(o){const a=$[o]||"corp-operations.html";return[{id:"home",label:"HOME",href:"corp-dashboard.html"},{id:"operations",label:"OPERATIONS",href:a},{id:"expansion",label:"EXPANSION",href:a+"?tab=expansion",samePageAction:"expansion"},{id:"actions",label:"ACTIONS",href:a+"?tab=actions",samePageAction:"actions"},{id:"innovation",label:"INNOVATION",disabled:!0},{id:"nations",label:"NATIONS",href:"corp-nations.html"},{id:"news",label:"NEWS",href:"news.html"},{id:"wiki",label:"WIKI",href:"wiki.html"}]}function d(o){if(!o)return"";const a=document.createElement("div");return a.textContent=o,a.innerHTML}function R(o,a={}){I();const{faction:e,shard:s,activeTab:f,allUserFactions:r,badges:b}=a,_=b||{},m=document.body.classList.contains("light-mode"),l=e?.corp_ticker||e?.abbreviation||"",c=Number(e?.corp_cash_reserves??0),v=c>=1e9?"$"+(c/1e9).toFixed(2)+"B":c>=1e6?"$"+(c/1e6).toFixed(2)+"M":c>=1e3?"$"+(c/1e3).toFixed(1)+"k":"$"+c,g=e?.custom_logo_url?`<img src="${d(e.custom_logo_url)}" alt="" style="width:100%;height:100%;object-fit:cover;border-radius:5px;">`:d(l.slice(0,2)||"—"),k=s?.current_date||"--",A=s?.current_tick??"--",h=window.location.pathname.split("/").pop().split("?")[0],w=e?.corp_sector||"Construction",x=$[w]||"corp-operations.html",E=h===x||h==="corp-operations.html"||h==="corp-operations-shipping.html"||h==="corp-operations-finance.html",P=O(w).map(t=>{const n=t.id===f;if(t.disabled)return`<span class="corp-nav-tab disabled">${t.label}</span>`;if(t.samePageAction&&E)return`<a href="#" class="corp-nav-tab${n?" active":""}" data-tab-action="${t.samePageAction}" style="text-decoration:none;">${t.label}</a>`;const i=_[t.id],p=i?`<span style="position:relative;top:-4px;margin-left:2px;display:inline-block;min-width:8px;height:8px;line-height:8px;border-radius:50%;font-size:0;background:${i.color||"#c8a832"};" title="${i.title||""}"></span>`:"";return`<a href="${t.href}" class="corp-nav-tab${n?" active":""}" style="text-decoration:none;">${t.label}${p}</a>`}).join("");let u="";r&&r.length>0&&(u=r.map(t=>{const n=e&&t.id===e.id,i=t.faction_type==="corporation"?"CORP":"PARTY",p=t.faction_type==="corporation"?"var(--teal)":"var(--amber)";return`<div class="corp-dd-item${n?" active":""}" data-faction-id="${t.id}" data-faction-type="${t.faction_type}">
                <span class="corp-dd-type" style="color:${p}">${i}</span>
                <span class="corp-dd-name">${d(t.faction_name||"Unnamed")}</span>
                <span class="corp-dd-abbr">[${d(t.abbreviation||"—")}]</span>
            </div>`}).join("")),(r||[]).some(t=>t.faction_type==="party")||(u+=`<div class="corp-dd-item" data-action="found-party" style="border-top:1px solid var(--border-0, rgba(255,255,255,0.06));cursor:pointer;">
            <span class="corp-dd-type" style="color:var(--amber)">+</span>
            <span class="corp-dd-name">Found a Political Party</span>
        </div>`),o.innerHTML=`
        <div class="corp-topbar">
            <div class="corp-topbar__left">
                <div class="corp-topbar__badge">
                    <div class="corp-topbar__logo" id="corp-logo">${g}</div>
                    <span class="corp-topbar__name" id="corp-name-bar">${d(e?.faction_name||"Loading...")}</span>
                </div>
                <div class="corp-topbar__sep"></div>
                <div class="corp-topbar__ticks">
                    <div class="corp-topbar__tick">
                        <div class="corp-topbar__tick-label">GAME DATE</div>
                        <div class="corp-topbar__tick-value" id="game-date">${d(String(k))}</div>
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
            <div class="corp-topbar__version">${C}</div>
            <div class="corp-topbar__right">
                <span class="corp-topbar__cash" id="topbar-cash">CASH: ${v}</span>
                <div class="corp-topbar__switcher" id="faction-switcher">
                    <span class="corp-topbar__badge-btn" id="corp-name-badge" onclick="window._corpTopbarToggleDropdown()">[${d(l.toUpperCase()||"--")}] ▾</span>
                    <div class="corp-topbar__dropdown" id="corp-faction-dropdown">${u}</div>
                </div>
                <button class="corp-topbar__btn" onclick="window._corpTopbarToggleTheme()" id="theme-toggle">${m?"Dark":"Light"}</button>
                <button class="corp-topbar__btn corp-topbar__btn--logout" onclick="window._corpTopbarLogout()">Logout</button>
            </div>
        </div>
        <div class="corp-topbar__nav">${P}</div>
    `,o.querySelectorAll("[data-tab-action]").forEach(t=>{t.addEventListener("click",n=>{n.preventDefault();const i=t.dataset.tabAction;o.querySelectorAll(".corp-nav-tab").forEach(p=>p.classList.remove("active")),t.classList.add("active"),i==="expansion"&&typeof window.switchToExpansion=="function"?window.switchToExpansion(n):i==="actions"&&typeof window.switchToActions=="function"&&window.switchToActions(n)})});const y=o.querySelector("#corp-faction-dropdown");y&&y.addEventListener("click",t=>{const n=t.target.closest(".corp-dd-item");if(!n)return;if(n.dataset.action==="found-party"){sessionStorage.setItem("pending_faction_type","party"),window.location.href="select-nation.html";return}const i=n.dataset.factionId,p=n.dataset.factionType;sessionStorage.setItem("active_faction_id",i),p==="party"?window.location.href="dashboard.html":window.location.href="corp-dashboard.html"}),L(s)}function L(o){const a=document.getElementById("tick-countdown");if(!a||!o?.next_tick_at)return;const e=new Date(o.next_tick_at).getTime(),s=(Number(o.tick_interval_hours)||8)*36e5,r=e-s+s/2;function b(){const _=Date.now(),m=r>_?r:e+s/2,l=Math.max(0,m-_),c=Math.floor(l/36e5),v=Math.floor(l%36e5/6e4),g=Math.floor(l%6e4/1e3);a.textContent=`${c}h ${v}m ${g}s`}b(),setInterval(b,1e3)}window._corpTopbarToggleDropdown=function(){const o=document.getElementById("corp-faction-dropdown");o&&o.classList.toggle("open")};window._corpTopbarToggleTheme=function(){const o=document.body.classList.toggle("light-mode");try{localStorage.setItem(T,o?"light":"dark")}catch{}const a=document.getElementById("theme-toggle");a&&(a.textContent=o?"Dark":"Light")};window._corpTopbarLogout=async function(){const{_supabase:o}=await S(async()=>{const{_supabase:a}=await import("./supabase-client-CiYoFhIh.js");return{_supabase:a}},[]);sessionStorage.clear(),await o.auth.signOut(),window.location.href="login.html"};export{R as renderCorpTopBar};
