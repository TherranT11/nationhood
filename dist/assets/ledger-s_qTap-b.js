import{_ as A}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as M}from"./common-D2-5e1SV.js";import{c as H,a as B}from"./stats-C5reUrev.js";import"./preload-helper-BXl3LOEh.js";import"./government-structure-DBjJ7E-l.js";import"./government-types-BeJIFjWQ.js";import"./factions-C2s734Ze.js";import"./utils-CzgKGX6o.js";let L=null,u=[],C=null,k="fiscal",_="single",f=[],g="gdp_growth",$="fiscal",D="";function v(t){if(!t)return"";const n=document.createElement("div");return n.textContent=t,n.innerHTML}const G=new Set(["budget","debt"]),z=[{key:"fuel_energy",name:"Fuel & Energy",icon:"⛽"},{key:"minerals",name:"Minerals",icon:"⛏️"},{key:"manufactured_goods",name:"Manufactured",icon:"🏭"},{key:"technology",name:"Technology",icon:"💻"},{key:"arms",name:"Arms",icon:"⚔️"},{key:"grains_staples",name:"Grains & Staples",icon:"🌾"},{key:"livestock_dairy",name:"Livestock & Dairy",icon:"🥬"},{key:"fruits_vegetables",name:"Fruits & Veg",icon:"🍎"},{key:"cash_crops",name:"Cash Crops",icon:"🌿"},{key:"tourism",name:"Tourism",icon:"✈️"},{key:"services_finance",name:"Services & Finance",icon:"🏦"}];function E(t,n){if(t==null)return"—";if(typeof t=="string")return t;if(G.has(n)){const a=Math.abs(t),l=n==="budget";return a>=1e12?"$"+(t/1e12).toFixed(l?0:1)+"T":a>=1e9?"$"+(t/1e9).toFixed(l?0:1)+"B":a>=1e6?"$"+(t/1e6).toFixed(l?0:1)+"M":a>=1e3?"$"+Math.round(t/1e3)+"k":"$"+(l?Math.round(t):t)}return t.toFixed(1)}const R=new Set(H),O=new Set(B);function T(t){return R.has(t)?!0:O.has(t)?!1:null}const w=[{id:"fiscal",name:"Fiscal",stats:[{id:"budget",name:"Budget"},{id:"debt",name:"Debt"},{id:"gdp_growth",name:"GDP Growth"},{id:"income_tax",name:"Income Tax"},{id:"corporate_tax",name:"Corporate Tax"},{id:"cost_of_living",name:"Cost of Living"}]},{id:"governance",name:"Governance",stats:[{id:"state_apparatus",name:"State Apparatus"},{id:"public_approval",name:"Public Approval"},{id:"crown_authority",name:"Crown Authority"},{id:"corruption",name:"Corruption"}]},{id:"stability",name:"Stability",stats:[{id:"unrest",name:"Unrest"},{id:"crime",name:"Crime"}]},{id:"population",name:"Population",stats:[{id:"population",name:"Population"},{id:"immigration",name:"Immigration"}]},{id:"wellbeing",name:"Wellbeing",stats:[{id:"health",name:"Health"},{id:"education",name:"Education"},{id:"standard_of_living",name:"Standard of Living"}]},{id:"productive",name:"Production",stats:[{id:"infrastructure",name:"Infrastructure"},{id:"industry",name:"Industry"},{id:"farmland",name:"Farmland"},{id:"service_sector",name:"Service Sector"},{id:"workforce",name:"Workforce"},{id:"energy",name:"Energy"},{id:"minerals",name:"Minerals"}]},{id:"international",name:"International",stats:[{id:"power",name:"Power"}]},{id:"goods",name:"Goods",stats:[]}];function j(t,n){const a=T(n),l=u.map(o=>({id:o.id,val:Number(o[n]??0)}));return l.sort((o,m)=>a!==!1?m.val-o.val:o.val-m.val),l.findIndex(o=>o.id===t)+1}function P(t,n){return t<=3?"var(--accent)":t<=Math.ceil(n*.5)?"var(--green)":t<=Math.ceil(n*.75)?"var(--amber)":"var(--red)"}async function U(t,n){L=n;const a=document.getElementById("ledger-root");if(!a)return;a.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:17px;">Loading ledger...</div>';const{data:l,error:o}=await t.from("nations").select("*").order("name");if(o){console.error("[Ledger] Failed to load nations:",o.message),a.innerHTML='<div style="padding:40px;text-align:center;color:var(--red);font-size:17px;">Failed to load data.</div>';return}u=l||[],C=n.nation?.id||(u[0]?.id??null),f=[C].filter(Boolean),V(a),h(a)}function F(t){return t.flag_url||`assets/flags/${t.name}.png`}function V(t){t.addEventListener("click",n=>{const a=n.target.closest(".lg-mode-btn");if(a){_=a.dataset.mode,h(t);return}const l=n.target.closest(".lg-nation-row");if(l){C=l.dataset.nationId,h(t);return}const o=n.target.closest(".lg-cat-btn");if(o){k=o.dataset.cat,h(t);return}const m=n.target.closest(".lg-comp-nation");if(m){const s=m.dataset.nationId;f.includes(s)?f.length>1&&(f=f.filter(i=>i!==s)):f.length<4&&f.push(s),h(t);return}const x=n.target.closest(".lg-rank-cat");if(x){if($=x.dataset.cat,$==="goods")g=z[0].key;else{const s=w.find(i=>i.id===$);s&&s.stats.length>0&&(g=s.stats[0].id)}h(t);return}const r=n.target.closest(".lg-rank-stat");if(r){g=r.dataset.stat,h(t);return}}),t.addEventListener("input",n=>{n.target.matches(".lg-search input")&&(D=n.target.value,h(t))})}function h(t){const n=w.reduce((l,o)=>l+o.stats.length,0)+z.length;t.innerHTML=`<div class="lg-page">
        <div class="lg-header">
            <div style="display:flex;align-items:center;">
                <span class="lg-title">Ledger</span>
                <span class="lg-meta">${u.length} nations · ${n} stats</span>
            </div>
            <div class="lg-mode-bar" id="lg-mode-bar">
                <div class="lg-mode-btn ${_==="single"?"active":""}" data-mode="single">SINGLE NATION</div>
                <div class="lg-mode-btn ${_==="compare"?"active":""}" data-mode="compare">COMPARISON</div>
                <div class="lg-mode-btn ${_==="rankings"?"active":""}" data-mode="rankings">GLOBAL RANKINGS</div>
            </div>
        </div>
        <div id="lg-body">${_==="single"?Y():_==="compare"?W():K()}</div>
    </div>`;const a=t.querySelector(".lg-search input");a&&(a.value=D)}function Y(){const t=L.nation?.id,n=D?u.filter(i=>i.name.toLowerCase().includes(D.toLowerCase())):u,a=u.find(i=>i.id===C),l=w.find(i=>i.id===k),o=u.length,m=n.map(i=>{const b=i.id===C,e=i.id===t;return`<div class="lg-nation-row ${b?"active":""}" data-nation-id="${i.id}">
            <img class="lg-nation-flag" src="${F(i)}" alt="" onerror="this.style.display='none'">
            <div style="flex:1;min-width:0;">
                <div class="lg-nation-name">${v(i.name)}</div>
                <div class="lg-nation-continent">${v(i.government_type||"")}</div>
            </div>
            ${e?'<span class="lg-nation-you">YOU</span>':""}
        </div>`}).join(""),x=a?`<div class="lg-nation-header" style="border-left-color:var(--accent);">
        <div style="display:flex;align-items:center;gap:12px;">
            <img class="lg-header-flag" src="${F(a)}" alt="" onerror="this.style.display='none'">
            <div>
                <div class="lg-nation-title">${v(a.name)}</div>
                <div class="lg-nation-sub">${v(a.government_type||"")} · Pop: ${Number(a.population||0).toLocaleString()}</div>
            </div>
        </div>
        <div style="font-family:var(--font-mono);font-size:17px;color:var(--text-dim);">
            GDP Growth: <span style="color:var(--text-bright);font-weight:700;">${E(a.gdp_growth,"gdp_growth")}</span>
        </div>
    </div>`:"",r=w.map(i=>`<div class="lg-cat-btn ${i.id===k?"active":""}" data-cat="${i.id}">${v(i.name.toUpperCase())}</div>`).join("");let s="";return k==="goods"?s=`<div class="lg-stat-row" style="padding:32px 14px;justify-content:center;">
            <span style="color:var(--text-dim);font-style:italic;">Goods trade is being rebuilt — no data yet.</span>
        </div>`:s=(l?.stats||[]).map(i=>{if(!a)return"";const b=Number(a[i.id]??0);T(i.id);const e=j(a.id,i.id),d=o>1?(o-e)/(o-1)*100:50,y=d>75?"var(--green)":d>50?"var(--amber)":d>25?"var(--orange)":"var(--red)";return`<div class="lg-stat-row">
                <span class="lg-stat-name">${v(i.name)}</span>
                <span class="lg-stat-value">${E(b,i.id)}</span>
                <span class="lg-stat-rank" style="color:${P(e,o)};">#${e}</span>
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
    </div>`}function W(){const t=w.find(r=>r.id===k),n=L.nation?.id,a=u.map(r=>{const s=f.includes(r.id);return`<div class="lg-comp-nation" data-nation-id="${r.id}" style="
            padding:3px 8px;display:inline-flex;align-items:center;gap:4px;cursor:pointer;
            font-family:var(--font-mono);font-size:16px;font-weight:${s?"700":"400"};
            color:${s?"var(--text-bright)":"var(--text-dim)"};
            background:${s?"var(--amber-faint)":"transparent"};
            border:1px solid ${s?"var(--amber-border)":"var(--border-main)"};
        ">${v(r.name)}${r.id===n?' <span style="color:var(--green);font-size:17px;">YOU</span>':""}</div>`}).join(""),l=w.map(r=>`<div class="lg-cat-btn ${r.id===k?"active":""}" data-cat="${r.id}">${v(r.name.toUpperCase())}</div>`).join(""),o=f.map(r=>{const s=u.find(i=>i.id===r);return s?`<div style="flex:1;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${v(s.name)}</div>
            <div style="font-family:var(--font-mono);font-size:17px;color:var(--text-dim);">${v(s.government_type||"")}</div>
        </div>`:""}).join("");if(k==="goods")return`<div>
            <div style="background:var(--bg-panel);border:1px solid var(--border-main);padding:8px 14px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;gap:4px;flex-wrap:wrap;">${a}</div>
                <span style="font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">${f.length}/4 selected</span>
            </div>
            <div class="lg-cat-bar">${l}</div>
            <div style="padding:32px;text-align:center;color:var(--text-dim);font-style:italic;">Goods trade is being rebuilt — no data yet.</div>
        </div>`;const m=t?.stats||[],x=m.map((r,s)=>{const i=f.map(c=>({id:c,val:Number(u.find(p=>p.id===c)?.[r.id]??0)})),b=T(r.id),e=i.filter(c=>!isNaN(c.val));let d=null;e.length>0&&b!==null&&(d=b?e.reduce((c,p)=>p.val>c.val?p:c).id:e.reduce((c,p)=>p.val<c.val?p:c).id);const y=f.map(c=>{const p=i.find(I=>I.id===c),N=p?p.val:0,S=c===d;return`<div style="flex:1;text-align:center;">
                <span style="font-family:var(--font-mono);font-size:17px;font-weight:700;color:${S?"var(--accent)":"var(--text-bright)"};">${E(N,r.id)}</span>
                ${S?'<span style="font-family:var(--font-mono);font-size:16px;color:var(--accent);margin-left:2px;">★</span>':""}
            </div>`}).join("");return`<div style="display:flex;padding:5px 14px;align-items:center;border-bottom:${s<m.length-1?"1px solid rgba(200,196,184,0.03)":"none"};">
            <span style="width:160px;font-size:16px;color:var(--text-secondary);">${v(r.name)}</span>
            ${y}
        </div>`}).join("");return`<div>
        <div style="background:var(--bg-panel);border:1px solid var(--border-main);padding:8px 14px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;gap:4px;flex-wrap:wrap;">${a}</div>
            <span style="font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">${f.length}/4 selected</span>
        </div>
        <div class="lg-cat-bar">${l}</div>
        <div class="lg-table">
            <div style="display:flex;padding:8px 14px;background:var(--bg-card);border-bottom:1px solid var(--border-main);">
                <span style="width:160px;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">STAT</span>
                ${o}
            </div>
            ${x}
        </div>
    </div>`}function K(){const t=L.nation?.id,n=w.find(e=>e.id===$),a=$==="goods",l=a?{name:"Goods"}:n?.stats.find(e=>e.id===g),o=a?null:T(g),m=a?[...u]:[...u].sort((e,d)=>{const y=Number(e[g]??0),c=Number(d[g]??0);return o!==!1?c-y:y-c}),x=a?1:m.length>0?Math.max(...m.map(e=>Math.abs(Number(e[g]??0))),1):1,r=w.map(e=>`<div class="lg-rank-cat" data-cat="${e.id}" style="
            padding:3px 8px;font-family:var(--font-mono);font-size:16px;font-weight:700;cursor:pointer;
            color:${$===e.id?"var(--text-bright)":"var(--text-dim)"};
            background:${$===e.id?"var(--bg-card)":"transparent"};
            border:1px solid ${$===e.id?"var(--border-main)":"transparent"};
        ">${v(e.name.toUpperCase())}</div>`).join("");if(a)return`<div>
            <div style="background:var(--bg-panel);border:1px solid var(--border-main);padding:8px 14px;margin-bottom:6px;">
                <div style="display:flex;gap:2px;margin-bottom:6px;flex-wrap:wrap;">${r}</div>
            </div>
            <div style="padding:32px;text-align:center;color:var(--text-dim);font-style:italic;">Goods trade is being rebuilt — no data yet.</div>
        </div>`;const i=(n?.stats||[]).map(e=>`<div class="lg-rank-stat" data-stat="${e.id}" style="
            padding:3px 10px;font-family:var(--font-mono);font-size:17px;cursor:pointer;
            font-weight:${g===e.id?"700":"400"};
            color:${g===e.id?"var(--accent)":"var(--text-secondary)"};
            background:${g===e.id?"var(--amber-faint)":"transparent"};
            border:1px solid ${g===e.id?"var(--amber-border)":"var(--border-main)"};
        ">${a?e.name:v(e.name)}</div>`).join(""),b=m.map((e,d)=>{const y=Number(e[g]??0),c=x>0?Math.abs(y)/x*100:0,p=e.id===t,N=d===0?"🥇":d===1?"🥈":d===2?"🥉":`#${d+1}`,S=d===0?"var(--accent)":d===1?"var(--text-secondary)":d===2?"var(--orange)":"var(--text-dim)",I=p||d===0?"var(--accent)":d<3?"var(--green)":d<Math.ceil(m.length*.5)?"var(--amber)":"var(--text-dim)";return`<div style="display:flex;padding:6px 14px;align-items:center;border-bottom:1px solid rgba(200,196,184,0.03);background:${p?"var(--amber-faint)":"transparent"};">
            <span style="width:40px;font-family:var(--font-mono);font-size:${d<3?"13":"10"}px;font-weight:700;color:${S};">${N}</span>
            <div style="flex:1;display:flex;align-items:center;gap:8px;">
                <div>
                    <span style="font-size:14px;font-weight:${p?"700":"500"};color:${p?"var(--accent)":"var(--text-bright)"};">${v(e.name)}</span>
                    ${p?'<span style="font-family:var(--font-mono);font-size:17px;color:var(--green);font-weight:700;margin-left:6px;">YOU</span>':""}
                    <div style="font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">${v(e.government_type||"")}</div>
                </div>
            </div>
            <span style="width:100px;font-family:var(--font-mono);font-size:16px;font-weight:700;color:${d===0?"var(--accent)":"var(--text-bright)"};text-align:right;">${E(y,g)}</span>
            <div style="width:160px;display:flex;align-items:center;gap:6px;justify-content:flex-end;flex-shrink:0;">
                <div style="width:130px;height:6px;background:var(--border-main);overflow:hidden;">
                    <div style="width:${Math.min(c,100)}%;height:100%;background:${I};"></div>
                </div>
            </div>
        </div>`}).join("");return`<div>
        <div style="background:var(--bg-panel);border:1px solid var(--border-main);padding:8px 14px;margin-bottom:6px;">
            <div style="display:flex;gap:2px;margin-bottom:6px;flex-wrap:wrap;">${r}</div>
            <div style="display:flex;gap:3px;flex-wrap:wrap;">${i}</div>
        </div>
        <div class="lg-table">
            <div style="display:flex;padding:6px 14px;background:var(--bg-card);border-bottom:1px solid var(--border-main);">
                <span style="width:40px;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">RANK</span>
                <span style="flex:1;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">NATION</span>
                <span style="width:100px;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);text-align:right;">${v(l?.name?.toUpperCase()||"VALUE")}</span>
                <span style="width:160px;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);text-align:right;">BAR</span>
            </div>
            ${b}
        </div>
    </div>`}M("ledger",async t=>{await U(A,t)});
