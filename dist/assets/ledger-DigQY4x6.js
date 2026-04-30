import{_supabase as P}from"./supabase-client-qEAQbBjE.js";/* empty css                  */import{i as B}from"./common-DmgH3uJx.js";import{d as O,c as j}from"./stats-tIiBSaQA.js";import"./preload-helper-BXl3LOEh.js";import"./government-structure-C17uG6rl.js";import"./corp-topbar-CYaKZ_BF.js";import"./utils-A98FEun4.js";let M=null,f=[],L=null,C="economy",S="single",y=[],p="gdp_growth",w="economy",T="";function v(t){if(!t)return"";const i=document.createElement("div");return i.textContent=t,i.innerHTML}const U=new Set(["gdp","debt"]),D=[{key:"fuel_energy",name:"Fuel & Energy",icon:"⛽"},{key:"minerals",name:"Minerals",icon:"⛏️"},{key:"manufactured_goods",name:"Manufactured",icon:"🏭"},{key:"technology",name:"Technology",icon:"💻"},{key:"arms",name:"Arms",icon:"⚔️"},{key:"grains_staples",name:"Grains & Staples",icon:"🌾"},{key:"livestock_dairy",name:"Livestock & Dairy",icon:"🥬"},{key:"fruits_vegetables",name:"Fruits & Veg",icon:"🍎"},{key:"cash_crops",name:"Cash Crops",icon:"🌿"},{key:"tourism",name:"Tourism",icon:"✈️"},{key:"services_finance",name:"Services & Finance",icon:"🏦"}];let _={};function F(t,i){if(t==null)return"—";if(typeof t=="string")return t;if(U.has(i)){const a=Math.abs(t);return a>=1e12?"$"+(t/1e12).toFixed(1)+"T":a>=1e9?"$"+(t/1e9).toFixed(1)+"B":a>=1e6?"$"+(t/1e6).toFixed(1)+"M":a>=1e3?"$"+Math.round(t/1e3)+"k":"$"+t}return t.toFixed(1)}const V=new Set(O),q=new Set(j);function R(t){return V.has(t)?!0:q.has(t)?!1:null}const k=[{id:"economy",name:"Economy",stats:[{id:"gdp",name:"GDP"},{id:"gdp_growth",name:"GDP Growth"},{id:"debt",name:"Debt"},{id:"inflation",name:"Inflation"},{id:"interest_rates",name:"Interest Rates"},{id:"unemployment",name:"Unemployment"},{id:"foreign_investment",name:"Foreign Investment"},{id:"currency_strength",name:"Currency Strength"},{id:"credit",name:"Credit Rating"},{id:"manufacturing_output",name:"Manufacturing Output"},{id:"service_output",name:"Service Output"}]},{id:"demographics",name:"Demographics",stats:[{id:"population",name:"Population"},{id:"population_growth",name:"Population Growth"},{id:"median_age",name:"Median Age"},{id:"urbanization",name:"Urbanization"},{id:"eligible_voters",name:"Eligible Voters"},{id:"ethnic_diversity",name:"Ethnic Diversity"},{id:"immigration",name:"Immigration"},{id:"emigration",name:"Emigration"}]},{id:"society",name:"Society",stats:[{id:"happiness",name:"Happiness"},{id:"standard_of_living",name:"Standard of Living"},{id:"social_mobility",name:"Social Mobility"},{id:"poverty_rate",name:"Poverty Rate"},{id:"income_inequality",name:"Income Inequality"},{id:"crime_rate",name:"Crime Rate"},{id:"drug_use",name:"Drug Use"},{id:"cost_of_living",name:"Cost of Living"},{id:"housing_affordability",name:"Housing Affordability"}]},{id:"governance",name:"Governance",stats:[{id:"stability",name:"Stability"},{id:"legitimacy",name:"Legitimacy"},{id:"efficiency",name:"Government Efficiency"},{id:"corruption",name:"Corruption"},{id:"press_freedom",name:"Press Freedom"},{id:"judicial_independence",name:"Judicial Independence"},{id:"freedom_index",name:"Freedom Index"},{id:"polarization",name:"Polarization"}]},{id:"security",name:"Security",stats:[{id:"terrorism",name:"Terrorism"},{id:"political_violence",name:"Political Violence"},{id:"civil_unrest",name:"Civil Unrest"},{id:"incarceration_rate",name:"Incarceration Rate"}]},{id:"infrastructure",name:"Infrastructure",stats:[{id:"physical_infrastructure",name:"Physical Infrastructure"},{id:"digital_infrastructure",name:"Digital Infrastructure"},{id:"rail_network",name:"Rail Network"},{id:"energy_generation",name:"Energy Generation"},{id:"renewable_energy_percentage",name:"Renewable Energy %"},{id:"fuel_prices",name:"Fuel Prices"}]},{id:"health_edu",name:"Health & Education",stats:[{id:"healthcare_quality",name:"Healthcare Quality"},{id:"healthcare_accessibility",name:"Healthcare Accessibility"},{id:"beds_per_100k",name:"Beds per 100k"},{id:"lifespan",name:"Lifespan"},{id:"literacy",name:"Literacy"},{id:"higher_education",name:"Higher Education"},{id:"education_accessibility",name:"Education Accessibility"}]},{id:"resources",name:"Resources",stats:[{id:"arable_land",name:"Arable Land"},{id:"rare_minerals",name:"Rare Minerals"},{id:"oil_and_gas",name:"Oil & Gas"},{id:"carbon_emissions",name:"Carbon Emissions"},{id:"pollution",name:"Pollution"}]},{id:"goods",name:"Goods",stats:[]}];function Y(t,i){const a=R(i),m=f.map(n=>({id:n.id,val:Number(n[i]??0)}));return m.sort((n,g)=>a!==!1?g.val-n.val:n.val-g.val),m.findIndex(n=>n.id===t)+1}function H(t,i){return t<=3?"var(--accent)":t<=Math.ceil(i*.5)?"var(--green)":t<=Math.ceil(i*.75)?"var(--amber)":"var(--red)"}async function K(t,i){M=i;const a=document.getElementById("ledger-root");if(!a)return;a.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:17px;">Loading ledger...</div>';const{data:m,error:n}=await t.from("nations").select("*").order("name");if(n){console.error("[Ledger] Failed to load nations:",n.message),a.innerHTML='<div style="padding:40px;text-align:center;color:var(--red);font-size:17px;">Failed to load data.</div>';return}f=m||[],L=i.nation?.id||(f[0]?.id??null),y=[L].filter(Boolean),await W(t),Q(a),$(a)}async function W(t){_={};try{const{data:i}=await t.from("trade_summary").select("tick").order("tick",{ascending:!1}).limit(1),a=i?.[0]?.tick;if(!a)return;const{data:m}=await t.from("trade_flows").select("nation_id, sector, export_capacity, import_demand, export_volume, import_volume").eq("tick",a);if(!m)return;for(const n of m)_[n.nation_id]||(_[n.nation_id]={}),_[n.nation_id][n.sector]={export_capacity:Number(n.export_capacity)||0,import_demand:Number(n.import_demand)||0,export_volume:Number(n.export_volume)||0,import_volume:Number(n.import_volume)||0}}catch(i){console.warn("[Ledger] Failed to load trade flows:",i.message)}}function J(t,i,a){const m=f.map(n=>{const g=_[n.id]?.[i];return{id:n.id,val:g&&Number(g[a])||0}});return m.sort((n,g)=>g.val-n.val),m.findIndex(n=>n.id===t)+1}function N(t){if(t==null||t===0)return"$0";const i=Math.abs(t);return i>=1e12?"$"+(t/1e12).toFixed(1)+"T":i>=1e9?"$"+(t/1e9).toFixed(1)+"B":i>=1e6?"$"+(t/1e6).toFixed(0)+"M":i>=1e3?"$"+Math.round(t/1e3)+"k":"$"+Math.round(t)}function A(t){return t.flag_url||`assets/flags/${t.name}.png`}function Q(t){t.addEventListener("click",i=>{const a=i.target.closest(".lg-mode-btn");if(a){S=a.dataset.mode,$(t);return}const m=i.target.closest(".lg-nation-row");if(m){L=m.dataset.nationId,$(t);return}const n=i.target.closest(".lg-cat-btn");if(n){C=n.dataset.cat,$(t);return}const g=i.target.closest(".lg-comp-nation");if(g){const d=g.dataset.nationId;y.includes(d)?y.length>1&&(y=y.filter(r=>r!==d)):y.length<4&&y.push(d),$(t);return}const x=i.target.closest(".lg-rank-cat");if(x){if(w=x.dataset.cat,w==="goods")p=D[0].key;else{const d=k.find(r=>r.id===w);d&&d.stats.length>0&&(p=d.stats[0].id)}$(t);return}const o=i.target.closest(".lg-rank-stat");if(o){p=o.dataset.stat,$(t);return}}),t.addEventListener("input",i=>{i.target.matches(".lg-search input")&&(T=i.target.value,$(t))})}function $(t){const i=k.reduce((m,n)=>m+n.stats.length,0)+D.length;t.innerHTML=`<div class="lg-page">
        <div class="lg-header">
            <div style="display:flex;align-items:center;">
                <span class="lg-title">Ledger</span>
                <span class="lg-meta">${f.length} nations · ${i} stats</span>
            </div>
            <div class="lg-mode-bar" id="lg-mode-bar">
                <div class="lg-mode-btn ${S==="single"?"active":""}" data-mode="single">SINGLE NATION</div>
                <div class="lg-mode-btn ${S==="compare"?"active":""}" data-mode="compare">COMPARISON</div>
                <div class="lg-mode-btn ${S==="rankings"?"active":""}" data-mode="rankings">GLOBAL RANKINGS</div>
            </div>
        </div>
        <div id="lg-body">${S==="single"?X():S==="compare"?Z():tt()}</div>
    </div>`;const a=t.querySelector(".lg-search input");a&&(a.value=T)}function X(){const t=M.nation?.id,i=T?f.filter(r=>r.name.toLowerCase().includes(T.toLowerCase())):f,a=f.find(r=>r.id===L),m=k.find(r=>r.id===C),n=f.length,g=i.map(r=>{const b=r.id===L,u=r.id===t;return`<div class="lg-nation-row ${b?"active":""}" data-nation-id="${r.id}">
            <img class="lg-nation-flag" src="${A(r)}" alt="" onerror="this.style.display='none'">
            <div style="flex:1;min-width:0;">
                <div class="lg-nation-name">${v(r.name)}</div>
                <div class="lg-nation-continent">${v(r.government_type||"")}</div>
            </div>
            ${u?'<span class="lg-nation-you">YOU</span>':""}
        </div>`}).join(""),x=a?`<div class="lg-nation-header" style="border-left-color:var(--accent);">
        <div style="display:flex;align-items:center;gap:12px;">
            <img class="lg-header-flag" src="${A(a)}" alt="" onerror="this.style.display='none'">
            <div>
                <div class="lg-nation-title">${v(a.name)}</div>
                <div class="lg-nation-sub">${v(a.government_type||"")} · Pop: ${Number(a.population||0).toLocaleString()}</div>
            </div>
        </div>
        <div style="font-family:var(--font-mono);font-size:17px;color:var(--text-dim);">
            GDP Growth: <span style="color:var(--text-bright);font-weight:700;">${F(a.gdp_growth,"gdp_growth")}</span>
        </div>
    </div>`:"",o=k.map(r=>`<div class="lg-cat-btn ${r.id===C?"active":""}" data-cat="${r.id}">${v(r.name.toUpperCase())}</div>`).join("");let d="";if(C==="goods"&&a){const r=_[a.id]||{};let b=0;const u=D.map(e=>{const c=r[e.key],h=c?c.export_capacity:0;b+=h;const l=J(a.id,e.key,"export_capacity"),s=n>1?(n-l)/(n-1)*100:50,E=s>75?"var(--green)":s>50?"var(--amber)":s>25?"var(--orange)":"var(--red)";return`<div class="lg-stat-row">
                <span class="lg-stat-name"><span style="margin-right:4px;">${e.icon}</span>${v(e.name)}</span>
                <span class="lg-stat-value">${N(h)}</span>
                <span class="lg-stat-rank" style="color:${H(l,n)};">#${l}</span>
                <div class="lg-stat-bar-wrap">
                    <div class="lg-stat-bar"><div class="lg-stat-bar-fill" style="width:${s}%;background:${E};"></div></div>
                    <span class="lg-stat-pct">${Math.round(s)}%</span>
                </div>
            </div>`}).join("");d=`<div class="lg-stat-row" style="background:var(--bg-card);border-bottom:2px solid var(--border-main);">
            <span class="lg-stat-name" style="font-weight:700;color:var(--text-bright);">Total Production</span>
            <span class="lg-stat-value" style="font-weight:700;color:var(--accent);">${N(b)}</span>
            <span class="lg-stat-rank"></span>
            <div class="lg-stat-bar-wrap"></div>
        </div>`+u}else d=(m?.stats||[]).map(r=>{if(!a)return"";const b=Number(a[r.id]??0);R(r.id);const u=Y(a.id,r.id),e=n>1?(n-u)/(n-1)*100:50,c=e>75?"var(--green)":e>50?"var(--amber)":e>25?"var(--orange)":"var(--red)";return`<div class="lg-stat-row">
                <span class="lg-stat-name">${v(r.name)}</span>
                <span class="lg-stat-value">${F(b,r.id)}</span>
                <span class="lg-stat-rank" style="color:${H(u,n)};">#${u}</span>
                <div class="lg-stat-bar-wrap">
                    <div class="lg-stat-bar"><div class="lg-stat-bar-fill" style="width:${e}%;background:${c};"></div></div>
                    <span class="lg-stat-pct">${Math.round(e)}%</span>
                </div>
            </div>`}).join("");return`<div class="lg-main">
        <div class="lg-sidebar">
            <div class="lg-search"><input placeholder="Search nations..." /></div>
            <div class="lg-nation-list">${g}</div>
        </div>
        <div class="lg-content">
            ${x}
            <div class="lg-cat-bar">${o}</div>
            <div class="lg-table">
                <div class="lg-table-header">
                    <span style="flex:1;">STAT</span>
                    <span style="width:70px;text-align:right;">VALUE</span>
                    <span style="width:50px;text-align:right;">RANK</span>
                    <span style="width:120px;text-align:right;">GLOBAL POSITION</span>
                </div>
                ${d}
            </div>
        </div>
    </div>`}function Z(){const t=k.find(o=>o.id===C),i=M.nation?.id,a=f.map(o=>{const d=y.includes(o.id);return`<div class="lg-comp-nation" data-nation-id="${o.id}" style="
            padding:3px 8px;display:inline-flex;align-items:center;gap:4px;cursor:pointer;
            font-family:var(--font-mono);font-size:16px;font-weight:${d?"700":"400"};
            color:${d?"var(--text-bright)":"var(--text-dim)"};
            background:${d?"var(--amber-faint)":"transparent"};
            border:1px solid ${d?"var(--amber-border)":"var(--border-main)"};
        ">${v(o.name)}${o.id===i?' <span style="color:var(--green);font-size:17px;">YOU</span>':""}</div>`}).join(""),m=k.map(o=>`<div class="lg-cat-btn ${o.id===C?"active":""}" data-cat="${o.id}">${v(o.name.toUpperCase())}</div>`).join(""),n=y.map(o=>{const d=f.find(r=>r.id===o);return d?`<div style="flex:1;text-align:center;">
            <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${v(d.name)}</div>
            <div style="font-family:var(--font-mono);font-size:17px;color:var(--text-dim);">${v(d.government_type||"")}</div>
        </div>`:""}).join(""),g=C==="goods"?D.map(o=>({id:o.key,name:o.icon+" "+o.name,isGoods:!0})):t?.stats||[],x=g.map((o,d)=>{const r=o.isGoods,b=y.map(l=>{if(r){const s=_[l]?.[o.id];return{id:l,val:s?s.export_capacity:0}}return{id:l,val:Number(f.find(s=>s.id===l)?.[o.id]??0)}}),u=r?!0:R(o.id),e=b.filter(l=>!isNaN(l.val));let c=null;e.length>0&&u!==null&&(c=u?e.reduce((l,s)=>s.val>l.val?s:l).id:e.reduce((l,s)=>s.val<l.val?s:l).id);const h=y.map(l=>{const s=b.find(G=>G.id===l),E=s?s.val:0,I=l===c,z=r?N(E):F(E,o.id);return`<div style="flex:1;text-align:center;">
                <span style="font-family:var(--font-mono);font-size:17px;font-weight:700;color:${I?"var(--accent)":"var(--text-bright)"};">${z}</span>
                ${I?'<span style="font-family:var(--font-mono);font-size:16px;color:var(--accent);margin-left:2px;">★</span>':""}
            </div>`}).join("");return`<div style="display:flex;padding:5px 14px;align-items:center;border-bottom:${d<g.length-1?"1px solid rgba(200,196,184,0.03)":"none"};">
            <span style="width:160px;font-size:16px;color:var(--text-secondary);">${o.isGoods?o.name:v(o.name)}</span>
            ${h}
        </div>`}).join("");return`<div>
        <div style="background:var(--bg-panel);border:1px solid var(--border-main);padding:8px 14px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;">
            <div style="display:flex;gap:4px;flex-wrap:wrap;">${a}</div>
            <span style="font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">${y.length}/4 selected</span>
        </div>
        <div class="lg-cat-bar">${m}</div>
        <div class="lg-table">
            <div style="display:flex;padding:8px 14px;background:var(--bg-card);border-bottom:1px solid var(--border-main);">
                <span style="width:160px;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">STAT</span>
                ${n}
            </div>
            ${x}
        </div>
    </div>`}function tt(){const t=M.nation?.id,i=k.find(e=>e.id===w),a=w==="goods",m=a?D.find(e=>e.key===p):null,n=a?m?{name:m.name}:{name:"Production"}:i?.stats.find(e=>e.id===p),g=a?!0:R(p),x=[...f].sort((e,c)=>{if(a){const s=_[e.id]?.[p]?.export_capacity||0;return(_[c.id]?.[p]?.export_capacity||0)-s}const h=Number(e[p]??0),l=Number(c[p]??0);return g!==!1?l-h:h-l}),o=x.length>0?Math.max(...x.map(e=>a?_[e.id]?.[p]?.export_capacity||0:Math.abs(Number(e[p]??0))),1):1,d=k.map(e=>`<div class="lg-rank-cat" data-cat="${e.id}" style="
            padding:3px 8px;font-family:var(--font-mono);font-size:16px;font-weight:700;cursor:pointer;
            color:${w===e.id?"var(--text-bright)":"var(--text-dim)"};
            background:${w===e.id?"var(--bg-card)":"transparent"};
            border:1px solid ${w===e.id?"var(--border-main)":"transparent"};
        ">${v(e.name.toUpperCase())}</div>`).join(""),b=(a?D.map(e=>({id:e.key,name:e.icon+" "+e.name})):i?.stats||[]).map(e=>`<div class="lg-rank-stat" data-stat="${e.id}" style="
            padding:3px 10px;font-family:var(--font-mono);font-size:17px;cursor:pointer;
            font-weight:${p===e.id?"700":"400"};
            color:${p===e.id?"var(--accent)":"var(--text-secondary)"};
            background:${p===e.id?"var(--amber-faint)":"transparent"};
            border:1px solid ${p===e.id?"var(--amber-border)":"var(--border-main)"};
        ">${a?e.name:v(e.name)}</div>`).join(""),u=x.map((e,c)=>{const h=a?_[e.id]?.[p]?.export_capacity||0:Number(e[p]??0),l=o>0?Math.abs(h)/o*100:0,s=e.id===t,E=c===0?"🥇":c===1?"🥈":c===2?"🥉":`#${c+1}`,I=c===0?"var(--accent)":c===1?"var(--text-secondary)":c===2?"var(--orange)":"var(--text-dim)",z=s||c===0?"var(--accent)":c<3?"var(--green)":c<Math.ceil(x.length*.5)?"var(--amber)":"var(--text-dim)";return`<div style="display:flex;padding:6px 14px;align-items:center;border-bottom:1px solid rgba(200,196,184,0.03);background:${s?"var(--amber-faint)":"transparent"};">
            <span style="width:40px;font-family:var(--font-mono);font-size:${c<3?"13":"10"}px;font-weight:700;color:${I};">${E}</span>
            <div style="flex:1;display:flex;align-items:center;gap:8px;">
                <div>
                    <span style="font-size:14px;font-weight:${s?"700":"500"};color:${s?"var(--accent)":"var(--text-bright)"};">${v(e.name)}</span>
                    ${s?'<span style="font-family:var(--font-mono);font-size:17px;color:var(--green);font-weight:700;margin-left:6px;">YOU</span>':""}
                    <div style="font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">${v(e.government_type||"")}</div>
                </div>
            </div>
            <span style="width:100px;font-family:var(--font-mono);font-size:16px;font-weight:700;color:${c===0?"var(--accent)":"var(--text-bright)"};text-align:right;">${a?N(h):F(h,p)}</span>
            <div style="width:160px;display:flex;align-items:center;gap:6px;justify-content:flex-end;flex-shrink:0;">
                <div style="width:130px;height:6px;background:var(--border-main);overflow:hidden;">
                    <div style="width:${Math.min(l,100)}%;height:100%;background:${z};"></div>
                </div>
            </div>
        </div>`}).join("");return`<div>
        <div style="background:var(--bg-panel);border:1px solid var(--border-main);padding:8px 14px;margin-bottom:6px;">
            <div style="display:flex;gap:2px;margin-bottom:6px;flex-wrap:wrap;">${d}</div>
            <div style="display:flex;gap:3px;flex-wrap:wrap;">${b}</div>
        </div>
        <div class="lg-table">
            <div style="display:flex;padding:6px 14px;background:var(--bg-card);border-bottom:1px solid var(--border-main);">
                <span style="width:40px;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">RANK</span>
                <span style="flex:1;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);">NATION</span>
                <span style="width:100px;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);text-align:right;">${v(n?.name?.toUpperCase()||"VALUE")}</span>
                <span style="width:160px;font-family:var(--font-mono);font-size:16px;color:var(--text-dim);text-align:right;">BAR</span>
            </div>
            ${u}
        </div>
    </div>`}B("ledger",async t=>{await K(P,t)});
