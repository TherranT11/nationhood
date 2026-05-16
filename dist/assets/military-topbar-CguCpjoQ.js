import{_supabase as y}from"./supabase-client-CiYoFhIh.js";import{g as b,a as w,B as k,b as $}from"./factions-1eoRseVF.js";import{e as i}from"./utils-oN1e812_.js";const T="Alpha 2.6.0.0",B=`
.mil-topbar, .mil-topbar__nav {
  --bg-2: #1a1a17; --bg-3: #252525;
  --border-0: rgba(255,255,255,0.06); --border-1: rgba(255,255,255,0.08);
  --text-bright: #f0efe6; --text-dim: #4a4940;
  --red: #d9534f; --red-faint: rgba(217,83,79,0.08); --red-border: rgba(217,83,79,0.18);
  --font-mono: 'JetBrains Mono', monospace;
  --font-ui: 'IBM Plex Sans', -apple-system, sans-serif;
}
.mil-topbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 9px 22px; height: 53px;
  background: var(--bg-2); border-bottom: 1px solid var(--border-0);
}
.mil-topbar__left { display: flex; align-items: center; gap: 0; }
.mil-topbar__sep {
  width: 1px; height: 31px; background: var(--border-1);
  margin: 0 16px; flex-shrink: 0;
}
.mil-topbar__badge { display: flex; align-items: center; gap: 10px; }
.mil-topbar__flag {
  width: 36px; height: 24px; object-fit: cover;
  border: 1px solid var(--border-1);
}
.mil-topbar__flag-fallback {
  width: 36px; height: 24px;
  background: var(--bg-3); border: 1px solid var(--border-1);
}
.mil-topbar__name {
  font-family: var(--font-ui); font-size: 14px; font-weight: 700;
  color: var(--text-bright);
}
.mil-topbar__ticks { display: flex; gap: 20px; }
.mil-topbar__tick { display: flex; flex-direction: column; gap: 1px; }
.mil-topbar__tick-label {
  font-family: var(--font-mono); font-size: 9.5px; font-weight: 600;
  letter-spacing: 0.8px; text-transform: uppercase; color: #7a7868;
}
.mil-topbar__tick-value {
  font-family: var(--font-mono); font-size: 13px; font-weight: 500;
  color: var(--text-bright);
}
.mil-topbar__version {
  font-family: var(--font-mono); font-size: 10px;
  color: #f0efe6; letter-spacing: 0.5px; opacity: 0.8;
}
.mil-topbar__right { display: flex; align-items: center; gap: 10px; }
.mil-topbar__switcher { position: relative; }
.mil-topbar__badge-btn {
  font-family: var(--font-mono); font-size: 12px; font-weight: 700;
  color: var(--red); padding: 4px 10px; cursor: pointer;
  background: var(--red-faint);
  border: 1px solid var(--red-border);
}
.mil-topbar__dropdown {
  display: none; position: absolute; top: 100%; right: 0;
  min-width: 260px; max-height: 60vh; overflow-y: auto;
  background: var(--bg-2); border: 1px solid var(--border-0);
  box-shadow: 0 8px 24px rgba(0,0,0,0.5); z-index: 100; margin-top: 4px;
}
.mil-topbar__dropdown.open { display: block; }
.mil-dd-item {
  display: flex; align-items: center; gap: 8px; padding: 8px 14px;
  cursor: pointer; border-bottom: 1px solid var(--border-0);
  font-family: var(--font-mono); font-size: 11px;
}
.mil-dd-item:hover { background: rgba(255,255,255,0.04); }
.mil-dd-item.active { background: rgba(217,83,79,0.06); }
.mil-dd-item--create { border-top: 1px solid var(--border-0); }
.mil-dd-type { font-size: 8px; font-weight: 700; letter-spacing: 0.5px; min-width: 32px; }
.mil-dd-name { color: var(--text-bright); flex: 1; }
.mil-dd-abbr { color: var(--text-dim); font-size: 9px; }
.mil-topbar__btn {
  font-family: var(--font-mono); font-size: 10px; font-weight: 600;
  letter-spacing: 0.5px; padding: 5px 14px; cursor: pointer;
  background: transparent; border: 1px solid var(--border-0);
  color: var(--text-dim); transition: all 0.15s;
}
.mil-topbar__btn:hover { color: var(--text-bright); border-color: var(--text-dim); }
.mil-topbar__btn--logout:hover { color: var(--red); border-color: var(--red); }

.mil-topbar__nav {
  display: flex; gap: 0; padding: 0 22px;
  background: var(--bg-2); border-bottom: 1px solid var(--border-0);
}
.mil-nav-tab {
  font-family: var(--font-mono); font-size: 10px; font-weight: 700;
  letter-spacing: 1px; padding: 8px 16px; color: var(--text-dim);
  border-bottom: 2px solid transparent; transition: all 0.15s;
  text-transform: uppercase; text-decoration: none;
}
.mil-nav-tab:hover { color: var(--text-bright); }
.mil-nav-tab.active {
  color: var(--text-bright);
  border-bottom-color: var(--red);
}`;function S(){if(typeof document>"u"||document.getElementById("mil-topbar-styles"))return;const o=document.createElement("style");o.id="mil-topbar-styles",o.textContent=B,document.head.appendChild(o)}function M(o,f={}){S();const{faction:e,nation:A,shard:g,allUserFactions:r,activeTab:v,flagUrl:p}=f,_=b(e?.branch||"army"),x=g?.current_date||"--";let l="";r&&r.length>0&&(l=r.map(t=>{const a=e&&t.id===e.id,{label:n,color:d}=w(t.faction_type),s=t.faction_type==="military"?b(t.branch):t.abbreviation||"—";return`<div class="mil-dd-item${a?" active":""}" data-faction-id="${i(t.id)}">
                <span class="mil-dd-type" style="color:${d}">${n}</span>
                <span class="mil-dd-name">${i(t.faction_name||"Unnamed")}</span>
                <span class="mil-dd-abbr">[${i(s)}]</span>
            </div>`}).join("")),(r||[]).some(t=>t.faction_type==="party")||(l+=`<div class="mil-dd-item mil-dd-item--create" data-action="found-party">
            <span class="mil-dd-type" style="color:var(--amber)">+</span>
            <span class="mil-dd-name">Found a Political Party</span>
        </div>`),(r||[]).some(t=>t.faction_type==="corporation")||(l+=`<div class="mil-dd-item mil-dd-item--create" data-action="found-corp">
            <span class="mil-dd-type" style="color:var(--teal)">+</span>
            <span class="mil-dd-name">Found a Corporation</span>
        </div>`);const c=k[e?.branch]||"army-dashboard.html",h=[{id:"home",label:"Home",href:c},{id:"actions",label:"Actions",href:"army-actions.html"},{id:"procurement",label:"Procurement",href:"army-procurement.html"}].map(t=>{const a=t.id===v;return`<a href="${t.href}" class="mil-nav-tab${a?" active":""}">${i(t.label)}</a>`}).join(""),u=p?`<img class="mil-topbar__flag" src="${i(p)}" alt="" onerror="this.outerHTML='<div class=&quot;mil-topbar__flag-fallback&quot;></div>'">`:'<div class="mil-topbar__flag-fallback"></div>';o.innerHTML=`
        <div class="mil-topbar">
            <div class="mil-topbar__left">
                <div class="mil-topbar__badge">
                    ${u}
                    <span class="mil-topbar__name">${i(e?.faction_name||"Loading...")}</span>
                </div>
                <div class="mil-topbar__sep"></div>
                <div class="mil-topbar__ticks">
                    <div class="mil-topbar__tick">
                        <div class="mil-topbar__tick-label">GAME DATE</div>
                        <div class="mil-topbar__tick-value">${i(String(x))}</div>
                    </div>
                </div>
            </div>
            <div class="mil-topbar__version">${T}</div>
            <div class="mil-topbar__right">
                <div class="mil-topbar__switcher" id="mil-faction-switcher">
                    <span class="mil-topbar__badge-btn" onclick="window._milTopbarToggleDropdown()">[${i(_)}] ▾</span>
                    <div class="mil-topbar__dropdown" id="mil-faction-dropdown">${l}</div>
                </div>
                <button class="mil-topbar__btn mil-topbar__btn--logout" onclick="window._milTopbarLogout()">Logout</button>
            </div>
        </div>
        <div class="mil-topbar__nav">${h}</div>
    `;const m=o.querySelector("#mil-faction-dropdown");m&&m.addEventListener("click",t=>{const a=t.target.closest(".mil-dd-item");if(!a)return;if(a.dataset.action==="found-party"){sessionStorage.setItem("pending_faction_type","party"),window.location.href="select-nation.html";return}if(a.dataset.action==="found-corp"){sessionStorage.setItem("pending_faction_type","corp"),window.location.href="corp-setup.html";return}const n=a.dataset.factionId;if(!n)return;sessionStorage.setItem("active_faction_id",n);const d=(r||[]).find(s=>s.id===n);window.location.href=$(d)||c})}window._milTopbarToggleDropdown=function(){const o=document.getElementById("mil-faction-dropdown");o&&o.classList.toggle("open")};document.addEventListener("click",o=>{o.target.closest("#mil-faction-switcher")||document.getElementById("mil-faction-dropdown")?.classList.remove("open")});window._milTopbarLogout=async function(){sessionStorage.clear(),await y.auth.signOut(),window.location.href="login.html"};export{M as r};
