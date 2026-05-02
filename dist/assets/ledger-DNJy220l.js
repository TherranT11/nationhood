import{_supabase as A}from"./supabase-client-qEAQbBjE.js";/* empty css                  */import{i as H}from"./common-DmwJUj0E.js";import{d as M,c as G}from"./stats-4gK98flh.js";import"./preload-helper-BXl3LOEh.js";import"./government-structure-C17uG6rl.js";import"./corp-topbar-BVNorCyj.js";import"./utils-A98FEun4.js";let L=null,u=[],C=null,k="fiscal",_="single",f=[],g="gdp_growth",$="fiscal",D="";function v(t){if(!t)return"";const i=document.createElement("div");return i.textContent=t,i.innerHTML}const B=new Set(["budget","debt"]),z=[{key:"fuel_energy",name:"Fuel & Energy",icon:"⛽"},{key:"minerals",name:"Minerals",icon:"⛏️"},{key:"manufactured_goods",name:"Manufactured",icon:"🏭"},{key:"technology",name:"Technology",icon:"💻"},{key:"arms",name:"Arms",icon:"⚔️"},{key:"grains_staples",name:"Grains & Staples",icon:"🌾"},{key:"livestock_dairy",name:"Livestock & Dairy",icon:"🥬"},{key:"fruits_vegetables",name:"Fruits & Veg",icon:"🍎"},{key:"cash_crops",name:"Cash Crops",icon:"🌿"},{key:"tourism",name:"Tourism",icon:"✈️"},{key:"services_finance",name:"Services & Finance",icon:"🏦"}];function E(t,i){if(t==null)return"—";if(typeof t=="string")return t;if(B.has(i)){const e=Math.abs(t);return e>=1e12?"$"+(t/1e12).toFixed(1)+"T":e>=1e9?"$"+(t/1e9).toFixed(1)+"B":e>=1e6?"$"+(t/1e6).toFixed(1)+"M":e>=1e3?"$"+Math.round(t/1e3)+"k":"$"+t}return t.toFixed(1)}const R=new Set(M),O=new Set(G);function T(t){return R.has(t)?!0:O.has(t)?!1:null}const w=[{id:"fiscal",name:"Fiscal",stats:[{id:"budget",name:"Budget"},{id:"debt",name:"Debt"},{id:"gdp_growth",name:"GDP Growth"},{id:"income_tax",name:"Income Tax"},{id:"corporate_tax",name:"Corporate Tax"},{id:"cost_of_living",name:"Cost of Living"}]},{id:"governance",name:"Governance",stats:[{id:"control",name:"Control"},{id:"public_approval",name:"Public Approval"},{id:"crown_authority",name:"Crown Authority"},{id:"corruption",name:"Corruption"}]},{id:"stability",name:"Stability",stats:[{id:"unrest",name:"Unrest"},{id:"crime",name:"Crime"}]},{id:"population",name:"Population",stats:[{id:"population",name:"Population"},{id:"immigration",name:"Immigration"}]},{id:"wellbeing",name:"Wellbeing",stats:[{id:"health",name:"Health"},{id:"education",name:"Education"},{id:"standard_of_living",name:"Standard of Living"}]},{id:"productive",name:"Production",stats:[{id:"infrastructure",name:"Infrastructure"},{id:"industry",name:"Industry"},{id:"farmland",name:"Farmland"},{id:"service_sector",name:"Service Sector"},{id:"workforce",name:"Workforce"},{id:"energy",name:"Energy"},{id:"minerals",name:"Minerals"}]},{id:"international",name:"International",stats:[{id:"power",name:"Power"}]},{id:"goods",name:"Goods",stats:[]}];function j(t,i){const e=T(i),c=u.map(o=>({id:o.id,val:Number(o[i]??0)}));return c.sort((o,m)=>e!==!1?m.val-o.val:o.val-m.val),c.findIndex(o=>o.id===t)+1}function P(t,i){return t<=3?"var(--accent)":t<=Math.ceil(i*.5)?"var(--green)":t<=Math.ceil(i*.75)?"var(--amber)":"var(--red)"}async function U(t,i){L=i;const e=document.getElementById("ledger-root");if(!e)return;e.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:17px;">Loading ledger...</div>';const{data:c,error:o}=await t.from("nations").select("*").order("name");if(o){console.error("[Ledger] Failed to load nations:",o.message),e.innerHTML='<div style="padding:40px;text-align:center;color:var(--red);font-size:17px;">Failed to load data.</div>';return}u=c||[],C=i.nation?.id||(u[0]?.id??null),f=[C].filter(Boolean),V(e),h(e)}function F(t){return t.flag_url||`assets/flags/${t.name}.png`}function V(t){t.addEventListener("click",i=>{const e=i.target.closest(".lg-mode-btn");if(e){_=e.dataset.mode,h(t);return}const c=i.target.closest(".lg-nation-row");if(c){C=c.dataset.nationId,h(t);return}const o=i.target.closest(".lg-cat-btn");if(o){k=o.dataset.cat,h(t);return}const m=i.target.closest(".lg-comp-nation");if(m){const s=m.dataset.nationId;f.includes(s)?f.length>1&&(f=f.filter(n=>n!==s)):f.length<4&&f.push(s),h(t);return}const x=i.target.closest(".lg-rank-cat");if(x){if($=x.dataset.cat,$==="goods")g=z[0].key;else{const s=w.find(n=>n.id===$);s&&s.stats.length>0&&(g=s.stats[0].id)}h(t);return}const r=i.target.closest(".lg-rank-stat");if(r){g=r.dataset.stat,h(t);return}}),t.addEventListener("input",i=>{i.target.matches(".lg-search input")&&(D=i.target.value,h(t))})}function h(t){const i=w.reduce((c,o)=>c+o.stats.length,0)+z.length;t.innerHTML=`<div class="lg-page">
        <div class="lg-header">
            <div style="display:flex;align-items:center;">
                <span class="lg-title">Ledger</span>
                <span class="lg-meta">${u.length} nations · ${i} stats</span>
            </div>
            <div class="lg-mode-bar" id="lg-mode-bar">
                <div class="lg-mode-btn ${_==="single"?"active":""}" data-mode="single">SINGLE NATION</div>
                <div class="lg-mode-btn ${_==="compare"?"active":""}" data-mode="compare">COMPARISON</div>
                <div class="lg-mode-btn ${_==="rankings"?"active":""}" data-mode="rankings">GLOBAL RANKINGS</div>
            </div>
        </div>
        <div id="lg-body">${_==="single"?Y():_==="compare"?W():K()}</div>
    </div>`;const e=t.querySelector(".lg-search input");e&&(e.value=D)}function Y(){const t=L.nation?.id,i=D?u.filter(n=>n.name.toLowerCase().includes(D.toLowerCase())):u,e=u.find(n=>n.id===C),c=w.find(n=>n.id===k),o=u.length,m=i.map(n=>{const b=n.id===C,a=n.id===t;return`<div class="lg-nation-row ${b?"active":""}" data-nation-id="${n.id}">
            <img class="lg-nation-flag" src="${F(n)}" alt="" onerror="this.style.display='none'">
            <div style="flex:1;min-width:0;">
                <div class="lg-nation-name">${v(n.name)}</div>
                <div class="lg-nation-continent">${v(n.government_type||"")}</div>
            </div>
            ${a?'<span class="lg-nation-you">YOU</span>':""}
        </div>`}).join(""),x=e?`<div class="lg-nation-header" style="border-left-color:var(--accent);">
        <div style="display:flex;align-items:center;gap:12px;">
            <img class="lg-header-flag" src="${F(e)}" alt="" onerror="this.style.display='none'">
            <div>
                <div class="lg-nation-title">${v(e.name)}</div>
                <div class="lg-nation-sub">${v(e.government_type||"")} · Pop: ${Number(e.population||0).toLocaleString()}</div>
            </div>
        </div>
        <div style="font-family:var(--font-mono);font-size:17px;color:var(--text-dim);">
            GDP Growth: <span style="color:var(--text-bright);font-weight:700;">${E(e.gdp_growth,"gdp_growth")}</span>
        </div>
    </div>`:"",r=w.map(n=>`<div class="lg-cat-btn ${n.id===k?"active":""}" data-cat="${n.id}">${v(n.name.toUpperCase())}</div>`).join("");let s="";return k==="goods"?s=`<div class="lg-stat-row" style="padding:32px 14px;justify-content:center;">
            <span style="color:var(--text-dim);font-style:italic;">Goods trade is being rebuilt — no data yet.</span>
        </div>`:s=(c?.stats||[]).map(n=>{if(!e)return"";const b=Number(e[n.id]??0);T(n.id);const a=j(e.id,n.id),d=o>1?(o-a)/(o-1)*100:50,y=d>75?"var(--green)":d>50?"var(--amber)":d>25?"var(--orange)":"var(--red)";return`<div class="lg-stat-row">
                <span class="lg-stat-name">${v(n.name)}</span>
                <span class="lg-stat-value">${E(b,n.id)}</span>
                <span class="lg-stat-rank" style="color:${P(a,o)};">#${a}</span>
                <div class="lg-stat-bar-wrap">
                    <div class="lg-stat-bar"><div class="lg-stat-bar-fill" style="width:${d}%;background:${y};"></div></div>
                    <span class="lg-stat-pct">${Math.round(d)}%</span>
                </div>
            </div>`}).join(""),`<div class="lg-main">
        <div class="lg-sidebar">
            <div class="lg-search"><input placeholder="Search nations..." /></div>
            <div class="lg-nation-list">${m}</div>
        </div>
        <div class="lg-content">
            ${x}
            <div class="lg-cat-bar">${r}</div>
            <div class="lg-table">
                <div class="lg-table-header">
                    <span style="flex:1;">STAT</span>
                    <span style="width:70px;text-align:right;">VALUE</span>
                    <span style="width:50px;text-align:right;">RANK</span>
                    <span style="width:120px;text-align:right;">GLOBAL POSITION</span>
                </div>
                ${s}
            </div>
        </div>
    </div>`}function W(){const t=w.find(r=>r.id===k),i=L.nation?.id,e=u.map(r=>{const s=f.includes(r.id);return`<div class="lg-comp-nation" data-nation-id="${r.id}" style="
            padding:3px 8px;display:inline-flex;align-items:center;gap:4px;cursor:pointer;
            font-family:var(--font-mono);font-size:16px;font-weight:${s?"700":"400"};
            color:${s?"var(--text-bright)":"var(--text-dim)"};
            background:${s?"var(--amber-faint)":"transparent"};
            border:1px solid ${s?"var(--amber-border)":"var(--border-main)"};
        ">${v(r.name)}${r.id===i?' <span style="color:var(--green);font-size:17px;">YOU</span>':""}</div>`}).join(""),c=w.map(r=>`<div class="lg-cat-btn ${r.id===k?"active":""}" data-cat="${r.id}">${v(r.name.toUpperCase())}</div>`).join(""),o=f.map(r=>{const s=u.find(n=>n.id===r);return s?`<div style="flex:1;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${v(s.name)}</div>
            <div style="font-family:var(--font-mono);font-size:17px;color:var(--text-dim);">${v(s.government_type||"")}</div>
        </div>`:""}).join("");if(k==="goods")return`<div>
            <div style="background:var(--bg-panel);border:1px solid var(--border-main);padding:8px 14px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;gap:4px;flex-wrap:wrap;">${e}</div>
                <span style="font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">${f.length}/4 selected</span>
            </div>
            <div class="lg-cat-bar">${c}</div>
            <div style="padding:32px;text-align:center;color:var(--text-dim);font-style:italic;">Goods trade is being rebuilt — no data yet.</div>
        </div>`;const m=t?.stats||[],x=m.map((r,s)=>{const n=f.map(l=>({id:l,val:Number(u.find(p=>p.id===l)?.[r.id]??0)})),b=T(r.id),a=n.filter(l=>!isNaN(l.val));let d=null;a.length>0&&b!==null&&(d=b?a.reduce((l,p)=>p.val>l.val?p:l).id:a.reduce((l,p)=>p.val<l.val?p:l).id);const y=f.map(l=>{const p=n.find(N=>N.id===l),I=p?p.val:0,S=l===d;return`<div style="flex:1;text-align:center;">
                <span style="font-family:var(--font-mono);font-size:17px;font-weight:700;color:${S?"var(--accent)":"var(--text-bright)"};">${E(I,r.id)}</span>
                ${S?'<span style="font-family:var(--font-mono);font-size:16px;color:var(--accent);margin-left:2px;">★</span>':""}
            </div>`}).join("");return`<div style="display:flex;padding:5px 14px;align-items:center;border-bottom:${s<m.length-1?"1px solid rgba(200,196,184,0.03)":"none"};">
            <span style="width:160px;font-size:16px;color:var(--text-secondary);">${v(r.name)}</span>
            ${y}
        </div>`}).join("");return`<div>
        <div style="background:var(--bg-panel);border:1px solid var(--border-main);padding:8px 14px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;gap:4px;flex-wrap:wrap;">${e}</div>
            <span style="font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">${f.length}/4 selected</span>
        </div>
        <div class="lg-cat-bar">${c}</div>
        <div class="lg-table">
            <div style="display:flex;padding:8px 14px;background:var(--bg-card);border-bottom:1px solid var(--border-main);">
                <span style="width:160px;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">STAT</span>
                ${o}
            </div>
            ${x}
        </div>
    </div>`}function K(){const t=L.nation?.id,i=w.find(a=>a.id===$),e=$==="goods",c=e?{name:"Goods"}:i?.stats.find(a=>a.id===g),o=e?null:T(g),m=e?[...u]:[...u].sort((a,d)=>{const y=Number(a[g]??0),l=Number(d[g]??0);return o!==!1?l-y:y-l}),x=e?1:m.length>0?Math.max(...m.map(a=>Math.abs(Number(a[g]??0))),1):1,r=w.map(a=>`<div class="lg-rank-cat" data-cat="${a.id}" style="
            padding:3px 8px;font-family:var(--font-mono);font-size:16px;font-weight:700;cursor:pointer;
            color:${$===a.id?"var(--text-bright)":"var(--text-dim)"};
            background:${$===a.id?"var(--bg-card)":"transparent"};
            border:1px solid ${$===a.id?"var(--border-main)":"transparent"};
        ">${v(a.name.toUpperCase())}</div>`).join("");if(e)return`<div>
            <div style="background:var(--bg-panel);border:1px solid var(--border-main);padding:8px 14px;margin-bottom:6px;">
                <div style="display:flex;gap:2px;margin-bottom:6px;flex-wrap:wrap;">${r}</div>
            </div>
            <div style="padding:32px;text-align:center;color:var(--text-dim);font-style:italic;">Goods trade is being rebuilt — no data yet.</div>
        </div>`;const n=(i?.stats||[]).map(a=>`<div class="lg-rank-stat" data-stat="${a.id}" style="
            padding:3px 10px;font-family:var(--font-mono);font-size:17px;cursor:pointer;
            font-weight:${g===a.id?"700":"400"};
            color:${g===a.id?"var(--accent)":"var(--text-secondary)"};
            background:${g===a.id?"var(--amber-faint)":"transparent"};
            border:1px solid ${g===a.id?"var(--amber-border)":"var(--border-main)"};
        ">${e?a.name:v(a.name)}</div>`).join(""),b=m.map((a,d)=>{const y=Number(a[g]??0),l=x>0?Math.abs(y)/x*100:0,p=a.id===t,I=d===0?"🥇":d===1?"🥈":d===2?"🥉":`#${d+1}`,S=d===0?"var(--accent)":d===1?"var(--text-secondary)":d===2?"var(--orange)":"var(--text-dim)",N=p||d===0?"var(--accent)":d<3?"var(--green)":d<Math.ceil(m.length*.5)?"var(--amber)":"var(--text-dim)";return`<div style="display:flex;padding:6px 14px;align-items:center;border-bottom:1px solid rgba(200,196,184,0.03);background:${p?"var(--amber-faint)":"transparent"};">
            <span style="width:40px;font-family:var(--font-mono);font-size:${d<3?"13":"10"}px;font-weight:700;color:${S};">${I}</span>
            <div style="flex:1;display:flex;align-items:center;gap:8px;">
                <div>
                    <span style="font-size:14px;font-weight:${p?"700":"500"};color:${p?"var(--accent)":"var(--text-bright)"};">${v(a.name)}</span>
                    ${p?'<span style="font-family:var(--font-mono);font-size:17px;color:var(--green);font-weight:700;margin-left:6px;">YOU</span>':""}
                    <div style="font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">${v(a.government_type||"")}</div>
                </div>
            </div>
            <span style="width:100px;font-family:var(--font-mono);font-size:16px;font-weight:700;color:${d===0?"var(--accent)":"var(--text-bright)"};text-align:right;">${E(y,g)}</span>
            <div style="width:160px;display:flex;align-items:center;gap:6px;justify-content:flex-end;flex-shrink:0;">
                <div style="width:130px;height:6px;background:var(--border-main);overflow:hidden;">
                    <div style="width:${Math.min(l,100)}%;height:100%;background:${N};"></div>
                </div>
            </div>
        </div>`}).join("");return`<div>
        <div style="background:var(--bg-panel);border:1px solid var(--border-main);padding:8px 14px;margin-bottom:6px;">
            <div style="display:flex;gap:2px;margin-bottom:6px;flex-wrap:wrap;">${r}</div>
            <div style="display:flex;gap:3px;flex-wrap:wrap;">${n}</div>
        </div>
        <div class="lg-table">
            <div style="display:flex;padding:6px 14px;background:var(--bg-card);border-bottom:1px solid var(--border-main);">
                <span style="width:40px;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">RANK</span>
                <span style="flex:1;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">NATION</span>
                <span style="width:100px;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);text-align:right;">${v(c?.name?.toUpperCase()||"VALUE")}</span>
                <span style="width:160px;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);text-align:right;">BAR</span>
            </div>
            ${b}
        </div>
    </div>`}H("ledger",async t=>{await U(A,t)});
