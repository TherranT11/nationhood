import{_ as I}from"./supabase-client-BXEzLDpS.js";import{a as u,b as L,c as B,B as E,g as M}from"./factions-C2s734Ze.js";import{a,A as z}from"./utils-CzgKGX6o.js";const h="milThemePref";function A(){if(!(typeof document>"u"))try{document.body.classList.toggle("light-mode",localStorage.getItem(h)==="light")}catch{}}const P=`
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
.mil-topbar__budget {
  display: flex; align-items: baseline; gap: 6px;
  font-family: var(--font-mono); padding: 4px 10px;
  border: 1px solid var(--border-1); background: var(--bg-3);
}
.mil-topbar__budget-label {
  font-size: 9.5px; font-weight: 600; letter-spacing: 0.8px;
  text-transform: uppercase; color: #7a7868;
}
.mil-topbar__budget-value {
  font-size: 12px; font-weight: 700; color: var(--text-bright);
}
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
}`;function D(){if(typeof document>"u"||document.getElementById("mil-topbar-styles"))return;const o=document.createElement("style");o.id="mil-topbar-styles",o.textContent=P,document.head.appendChild(o)}function q(o,n={}){D(),A();const{faction:e,nation:p,shard:l,allUserFactions:i,activeTab:m,flagUrl:c}=n,x=u(e?.branch||"army"),y=l?.current_date||"--",w=l?.current_tick??"--",k="$"+((Number(e?.party_funds)||0)/1e6).toFixed(1).replace(/\.0$/,""),T=typeof document<"u"&&document.body.classList.contains("light-mode");let s="";i&&i.length>0&&(s=i.filter(t=>!L(t)).map(t=>{const r=e&&t.id===e.id,{label:d,color:b}=B(t.faction_type),g=t.faction_type==="military"?u(t.branch):t.abbreviation||"—";return`<div class="mil-dd-item${r?" active":""}" data-faction-id="${a(t.id)}">
                <span class="mil-dd-type" style="color:${b}">${d}</span>
                <span class="mil-dd-name">${a(t.faction_name||"Unnamed")}</span>
                <span class="mil-dd-abbr">[${a(g)}]</span>
            </div>`}).join("")),(i||[]).some(t=>t.faction_type==="party")||(s+=`<div class="mil-dd-item mil-dd-item--create" data-action="found-party">
            <span class="mil-dd-type" style="color:var(--amber)">+</span>
            <span class="mil-dd-name">Found a Political Party</span>
        </div>`),(i||[]).some(t=>t.faction_type==="entrepreneur")||(s+=`<div class="mil-dd-item mil-dd-item--create" data-action="become-entrepreneur">
            <span class="mil-dd-type" style="color:var(--purple,#8b5cf6)">+</span>
            <span class="mil-dd-name">Become an Entrepreneur</span>
        </div>`),(i||[]).some(t=>t.faction_type==="politician")||(s+=`<div class="mil-dd-item mil-dd-item--create" data-action="join-neptune">
            <span class="mil-dd-type" style="color:var(--teal,#5aafa5)">+</span>
            <span class="mil-dd-name">Join Project Neptune</span>
        </div>`);const _=E[e?.branch]||"army-dashboard.html",$=[{id:"home",label:"Home",href:_},{id:"actions",label:"Actions",href:"army-actions.html"},{id:"procurement",label:"Procurement",href:"army-procurement.html"},{id:"operations",label:"Operations",href:"army-operations.html"}].map(t=>{const r=t.id===m;return`<a href="${t.href}" class="mil-nav-tab${r?" active":""}">${a(t.label)}</a>`}).join(""),S=c?`<img class="mil-topbar__flag" src="${a(c)}" alt="" onerror="this.outerHTML='<div class=&quot;mil-topbar__flag-fallback&quot;></div>'">`:'<div class="mil-topbar__flag-fallback"></div>';o.innerHTML=`
        <div class="mil-topbar">
            <div class="mil-topbar__left">
                <div class="mil-topbar__badge">
                    ${S}
                    <span class="mil-topbar__name">${a(e?.faction_name||"Loading...")}</span>
                </div>
                <div class="mil-topbar__sep"></div>
                <div class="mil-topbar__ticks">
                    <div class="mil-topbar__tick">
                        <div class="mil-topbar__tick-label">GAME DATE</div>
                        <div class="mil-topbar__tick-value">${a(String(y))}</div>
                    </div>
                    <div class="mil-topbar__tick">
                        <div class="mil-topbar__tick-label">TICK</div>
                        <div class="mil-topbar__tick-value">${a(String(w))}</div>
                    </div>
                    <div class="mil-topbar__tick">
                        <div class="mil-topbar__tick-label">NEXT TICK</div>
                        <div class="mil-topbar__tick-value" id="mil-tick-countdown">--</div>
                    </div>
                </div>
            </div>
            <div class="mil-topbar__version">${z}</div>
            <div class="mil-topbar__right">
                <div class="mil-topbar__budget">
                    <span class="mil-topbar__budget-label">Budget</span>
                    <span class="mil-topbar__budget-value">${a(k)}</span>
                </div>
                <div class="mil-topbar__switcher" id="mil-faction-switcher">
                    <span class="mil-topbar__badge-btn" onclick="window._milTopbarToggleDropdown()">[${a(x)}] ▾</span>
                    <div class="mil-topbar__dropdown" id="mil-faction-dropdown">${s}</div>
                </div>
                <button class="mil-topbar__btn" id="mil-theme-toggle" onclick="window._milTopbarToggleTheme()">${T?"Dark":"Light"}</button>
                <button class="mil-topbar__btn mil-topbar__btn--logout" onclick="window._milTopbarLogout()">Logout</button>
            </div>
        </div>
        <div class="mil-topbar__nav">${$}</div>
    `;const v=o.querySelector("#mil-faction-dropdown");v&&v.addEventListener("click",t=>{const r=t.target.closest(".mil-dd-item");if(!r)return;if(r.dataset.action==="found-party"){sessionStorage.setItem("pending_faction_type","party"),window.location.href="select-nation.html";return}if(r.dataset.action==="become-entrepreneur"){sessionStorage.setItem("pending_faction_type","entrepreneur"),window.location.href="faction-select.html";return}if(r.dataset.action==="join-neptune"){sessionStorage.setItem("neptune_return_url",window.location.pathname+window.location.search),window.location.href="character-select.html";return}const d=r.dataset.factionId;if(!d)return;sessionStorage.setItem("active_faction_id",d);const b=(i||[]).find(g=>g.id===d);window.location.href=M(b)||_}),H(l)}let f=null;function H(o){const n=document.getElementById("mil-tick-countdown");if(!n||!o?.next_tick_at)return;const e=new Date(o.next_tick_at).getTime();function p(){const l=Math.max(0,e-Date.now()),i=Math.floor(l/36e5),m=Math.floor(l%36e5/6e4),c=Math.floor(l%6e4/1e3);n.textContent=`${i}h ${m}m ${c}s`}p(),f&&clearInterval(f),f=setInterval(p,1e3)}window._milTopbarToggleDropdown=function(){const o=document.getElementById("mil-faction-dropdown");o&&o.classList.toggle("open")};document.addEventListener("click",o=>{o.target.closest("#mil-faction-switcher")||document.getElementById("mil-faction-dropdown")?.classList.remove("open")});window._milTopbarToggleTheme=function(){const o=document.body.classList.toggle("light-mode");try{localStorage.setItem(h,o?"light":"dark")}catch{}const n=document.getElementById("mil-theme-toggle");n&&(n.textContent=o?"Dark":"Light")};window._milTopbarLogout=async function(){sessionStorage.clear(),await I.auth.signOut(),window.location.href="login.html"};export{q as r};
