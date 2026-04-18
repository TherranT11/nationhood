import{_supabase as i}from"./supabase-client-CiYoFhIh.js";/* empty css                         */import{e as b}from"./utils-CY90Gazr.js";import{b as j}from"./political-actions-BF080n5r.js";import{g as V}from"./equipment-DsuDdEne.js";import{h as U}from"./government-types-D9n0pQb0.js";import{c as Y,g as J}from"./corp-executives-BOrCkuAI.js";import"./config-CRvw5bg0.js";import"./ideology-BqLjustE.js";import"./stats-tIiBSaQA.js";const K={Melizea:"assets/flags/Melizea.png",Avelia:"assets/flags/Avelia.png",Sangreza:"assets/flags/sangreza.png",Montequilla:"assets/flags/Montequilla.png","San Estrella":"assets/flags/sanestrella.png",Palvera:"assets/flags/Palvera.png",Calveth:"assets/flags/Calveth.png",Flandis:"assets/flags/Flandis.png",Vostia:"assets/flags/Vostia.png",Sierramar:"assets/flags/Sierramar.png"},z={Melizea:"A nation inspired by Spanish culture and language.",Sangreza:"A nation inspired by Spanish culture and language.","San Estrella":"A nation inspired by Spanish culture and language.",Palvera:"A nation inspired by Spanish culture and language.",Montequilla:"A nation inspired by Spanish culture and language.",Avelia:"A nation inspired by a hybrid of Spanish and Italian culture and language.",Calveth:"A nation inspired by Danish culture and language.",Flandis:"A nation inspired by Dutch culture and language.",Vostia:"A nation inspired by Serbian/Montenegrin culture and language.",Sierramar:"A small Caribbean island democracy with a young, religious population and a service-driven economy. This nation is analogous to Puerto Rico with a Spanish theme.",Hajjara:"A vast desert monarchy rich in oil and gas, governed by an absolute king. Inspired by Arabic culture, with deep traditions and a young, growing population."};let r=null,n=null,q=[],g={},f=null,G="Crucera",N="Private",p="",d="";async function Z(){const{data:{user:e}}=await i.auth.getUser();if(!e){window.location.href="login.html";return}r=e;const a=sessionStorage.getItem("corp_setup");if(!a){window.location.href="corp-setup.html";return}if(n=JSON.parse(a),!n.sector||!n.subsector){window.location.href="corp-setup.html";return}Q();const[t,s]=await Promise.all([i.from("nations").select("*, nation_profiles(flag_url)").order("name"),i.from("factions").select("id, nation_id, corp_subsector").eq("faction_type","corporation").eq("corp_subsector",n.subsector)]);q=t.data||[];const u=s.data||[];g={};for(const c of u)g[c.nation_id]||(g[c.nation_id]=[]),g[c.nation_id].push(c);P(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="flex"}function Q(){const e=document.getElementById("corp-summary-tags"),a=[n.sector,n.subsector,n.companyType];n.corpName&&a.push(n.corpName),n.ticker&&a.push(n.ticker),e.innerHTML=a.map(t=>`<span class="corp-summary__tag">${b(t)}</span>`).join("")}function X(e){const a=(g[e]||[]).length;return a<=1?{label:"High Demand",cls:"demand-badge--high"}:a===2?{label:"Moderate",cls:"demand-badge--moderate"}:{label:"Low Demand",cls:"demand-badge--low"}}function tt(e){return U(e)?"gov-presidential":"gov-democracy"}function et(e){return U(e)?"Presidential":e.hos_election_method==="hereditary"?"Constitutional Monarchy":"Parliamentary"}const at=["Montequilla","Vostia"];function P(){const e=document.getElementById("nations-grid"),a=q.filter(t=>(t.continent||"Crucera")===G);if(a.length===0){e.innerHTML='<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);text-align:center;padding:40px 0;grid-column:1/-1;">No nations in this continent yet.</div>';return}e.innerHTML=a.map(t=>{const s=t.nation_profiles,u=Array.isArray(s)?s[0]?.flag_url:s?.flag_url,c=K[t.name]||(u||"").trim()||(t.flag_url||"").trim()||"",m=tt(t),w=et(t),y=X(t.id),h=(g[t.id]||[]).length,C=f===t.id,k=at.includes(t.name),_=n&&n.sector==="Shipping"&&k,M=t.population?t.population.toLocaleString():"—",I=t.gdp?"$"+(t.gdp/1e9).toFixed(1)+"B":"—",E=t.stability!=null?Math.round(t.stability):"—",$=t.corporate_tax!=null?Math.round(t.corporate_tax)+"%":"—";return`
            <div class="nation-card${C?" selected":""}${_?" disabled":""}" data-id="${t.id}" onclick="${_?"":"selectNation('"+t.id+"')"}">
                ${_?'<span class="option-card__badge option-card__badge--soon" style="background:#d9534f;">Landlocked</span>':""}
                <div class="nation-card__header">
                    ${c?`<img class="nation-card__flag" src="${c}" alt="${b(t.name)}" onerror="this.style.display='none'">`:""}
                    <span class="nation-card__name">${b(t.name)}</span>
                    <span class="nation-card__gov ${m}">${w}</span>
                </div>
                <div class="nation-card__body">
                    ${z[t.name]?'<div class="nation-card__culture">'+b(z[t.name])+"</div>":""}
                    <div class="stat-row">
                        <span class="stat-row__label">Population</span>
                        <span class="stat-row__value">${M}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">GDP</span>
                        <span class="stat-row__value">${I}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">Stability</span>
                        <span class="stat-row__value">${E}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">Corporate Tax</span>
                        <span class="stat-row__value">${$}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">${b(n.subsector)}</span>
                        <span class="stat-row__value">
                            <span class="demand-badge ${y.cls}">${y.label}</span>
                            <span style="font-size:9px;color:var(--text-dim);margin-left:4px;">(${h} corp${h!==1?"s":""})</span>
                        </span>
                    </div>
                </div>
            </div>
        `}).join("")}function nt(e){f=e,P(),it()}function it(){const e=document.getElementById("details-panel");e.classList.add("active"),e.innerHTML=`
        <div class="section-block">
            <div class="section-header">
                <div class="section-dot" style="background:var(--teal)"></div>
                <span class="section-label">Company Type</span>
            </div>
            <div class="section-body" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;align-items:stretch;">
                <div class="option-card" style="margin-bottom:0;display:flex;flex-direction:column;opacity:0.35;cursor:not-allowed;pointer-events:none;">
                    <div class="option-card__name">Public <span style="font-size:0.6rem;color:var(--text-dim);font-weight:400;">COMING SOON</span></div>
                    <div class="option-card__desc" style="flex:1;">Your stock is listed on the market. Shareholders influence decisions, but IPO capital fuels rapid growth. Transparent financials required.</div>
                </div>
                <div class="option-card selected"
                     data-type="Private" onclick="selectCompanyType(this)" style="margin-bottom:0;display:flex;flex-direction:column;">
                    <div class="option-card__name">Private</div>
                    <div class="option-card__desc" style="flex:1;">Full control, no shareholders. Slower growth but total autonomy over strategy. Financials stay behind closed doors.</div>
                </div>
            </div>
        </div>
        <div class="section-block">
            <div class="section-header">
                <div class="section-dot" style="background:var(--amber)"></div>
                <span class="section-label">Name Corporation</span>
            </div>
            <div class="section-body">
                <div class="input-group" style="margin-bottom:0;">
                    <input type="text" id="corp-name-input" placeholder="e.g. Meridian Construction Group"
                           maxlength="40" value="${p}" oninput="onCorpNameInput(this.value)">
                    <div class="input-hint" id="corp-name-hint">2-40 characters</div>
                </div>
            </div>
        </div>
        <div class="section-block">
            <div class="section-header">
                <div class="section-dot" style="background:var(--amber)"></div>
                <span class="section-label">Stock Ticker</span>
            </div>
            <div class="section-body">
                <div class="input-group" style="margin-bottom:0;">
                    <input type="text" id="ticker-input" placeholder="e.g. MCG"
                           maxlength="4" value="${d}" style="text-transform:uppercase;letter-spacing:0.15em;font-weight:600;"
                           oninput="onTickerInput(this.value)">
                    <div class="input-hint" id="ticker-hint">2-4 uppercase letters</div>
                </div>
            </div>
        </div>
    `,T()}function st(e){document.querySelectorAll("#details-panel .option-card").forEach(a=>a.classList.remove("selected")),e.classList.add("selected"),N=e.dataset.type,T()}function ot(e){p=e.trim();const a=document.getElementById("corp-name-hint");p.length>0&&p.length<2?(a.textContent="Too short — minimum 2 characters",a.className="input-hint input-hint--error"):(a.textContent="2-40 characters",a.className="input-hint"),T()}function rt(e){const a=e.replace(/[^a-zA-Z]/g,"").toUpperCase().slice(0,4),t=document.getElementById("ticker-input");t.value!==a&&(t.value=a),d=a;const s=document.getElementById("ticker-hint");a.length>0&&a.length<2?(s.textContent="Too short — minimum 2 letters",s.className="input-hint input-hint--error"):(s.textContent="2-4 uppercase letters",s.className="input-hint"),T()}function T(){const e=document.getElementById("btn-confirm"),a=f&&N&&p.length>=2&&d.length>=2;e.disabled=!a,e.classList.toggle("ready",!!a)}function ct(e){G=e,document.querySelectorAll(".continent-tab").forEach(a=>{a.classList.toggle("active",a.dataset.continent===e)}),P()}async function lt(){if(!f||!r||!N||p.length<2||d.length<2)return;const e=document.getElementById("btn-confirm"),a=document.getElementById("error-message");e.disabled=!0,e.textContent="Creating...",a.textContent="";try{const t=q.find(o=>o.id===f),{data:s}=await i.from("factions").select("id, faction_name").eq("faction_type","corporation").eq("corp_ticker",d).is("abandoned_at",null).limit(1);if(s&&s.length>0){a.textContent=`Ticker "${d}" is already in use by ${s[0].faction_name}. Choose a different abbreviation.`,e.disabled=!1,e.textContent="Confirm ▶";return}const{data:u}=await i.from("factions").select("id, faction_name").eq("id",r.id).eq("faction_type","party").eq("nation_id",f).is("abandoned_at",null).maybeSingle();if(u){a.textContent=`Your political party "${u.faction_name}" is in ${t.name}. Corporations cannot operate in the same nation as your party.`,e.disabled=!1,e.textContent="Confirm ▶";return}const{data:c}=await i.from("shard").select("current_tick").eq("name","Alpha Shard").single(),m=c?.current_tick||0,{firstNames:w,lastNames:y}=j(t.name),h=w[Math.floor(Math.random()*w.length)],C=y[Math.floor(Math.random()*y.length)],k=40+Math.floor(Math.random()*36),_=(Number(t.currency_strength)||50)/50,M=n.sector==="Finance"?Math.max(.5,1-(Number(t.inflation)||0)/200):1,I=n.sector==="Finance"?225e6:n.sector==="Shipping"?8e7:36e6,E=Math.round(I*_*M),$=Math.round(8e6*_),{data:F}=await i.from("factions").select("id, faction_type").eq("id",r.id).is("abandoned_at",null).maybeSingle(),x=F&&F.faction_type==="party",A=x?crypto.randomUUID():r.id,S={id:A,faction_type:"corporation",faction_name:p,nation_id:t.id,nation:t.name,abbreviation:d,seats:0,needs_rebuild:!1,party_color:"#5aafa5",party_logo:null,party_description:null,leader_first_name:h,leader_last_name:C,leader_age:k,founded_tick:m,action_points:0,corp_sector:n.sector,corp_subsector:n.subsector,corp_company_type:N,corp_ticker:d,corp_cash_reserves:E,corp_loans:$,corp_general_workforce:375,corp_skilled_workforce:100,corp_innovative_workforce:25,corp_reputation:n.subsector==="Megaprojects"?85:n.subsector==="Industrial Construction"?50:65,abandoned_at:null};if(x){S.linked_user_id=r.id;const{error:o}=await i.from("factions").insert(S);if(o)throw o}else{const{error:o}=await i.from("factions").upsert(S);if(o)throw o}if(n.sector==="Shipping"){const o=n.subsector==="Bulk Cargo"?3:2;await i.from("factions").update({shipping_fleet_capacity:o,shipping_fleet_deployed:0}).eq("id",x?r.id:S.id);const L={Coastal:{capacity_dwt:14e3,capacity_unit:"DWT",base_maintenance:9e4,fuel_capacity:800,purchase_price:3e6},Container:{capacity_dwt:4800,capacity_unit:"TEU",base_maintenance:145e3,fuel_capacity:2100,purchase_price:65e6},Bulk:{capacity_dwt:28e3,capacity_unit:"DWT",base_maintenance:175e3,fuel_capacity:1800,purchase_price:3e6},Tanker:{capacity_dwt:42e3,capacity_unit:"DWT",base_maintenance:19e4,fuel_capacity:2400,purchase_price:53e6},Reefer:{capacity_dwt:12e3,capacity_unit:"DWT",base_maintenance:14e4,fuel_capacity:1600,purchase_price:6e6},LNG:{capacity_dwt:18e3,capacity_unit:"DWT",base_maintenance:29e4,fuel_capacity:1400,purchase_price:78e6}},l={"Bulk Cargo":[{cls:"Coastal",idx:1},{cls:"Coastal",idx:2},{cls:"Reefer",idx:3}],"Container Freight":[{cls:"Coastal",idx:1},{cls:"Container",idx:2}],"Specialized Transport":[{cls:"Tanker",idx:1},{cls:"Bulk",idx:2}]},W=(l[n.subsector]||l["Bulk Cargo"]).map(B=>{const v=L[B.cls];return{faction_id:A,nation_id:t.id,vessel_name:d+"-"+p.split(" ")[0]+" "+B.idx,vessel_class:B.cls,condition:85+Math.floor(Math.random()*16),fuel:70+Math.floor(Math.random()*31),status:"in_port",capacity_dwt:v.capacity_dwt,capacity_unit:v.capacity_unit,base_maintenance:v.base_maintenance,fuel_capacity:v.fuel_capacity,purchase_price:v.purchase_price,built_at_tick:m,current_port_nation_id:t.id}}),{error:R}=await i.from("corp_vessels").insert(W);R&&console.warn("Failed to seed starting fleet:",R.message)}if(n.sector==="Construction"){const o=V();if(o.length>0){const L=o.map(l=>({faction_id:r.id,nation_id:t.id,equipment_key:l.equipment_key,tier:l.tier,owned:l.owned,deployed:l.deployed,condition:l.condition,maintenance_per_tick:l.maintenance_per_tick}));await i.from("corp_equipment").insert(L)}await i.from("corp_properties").insert({faction_id:r.id,nation_id:t.id,name:"Starting Warehouse — "+t.name,type:"warehouse",style:"Basic",capacity:100,purchase_price:15e6,monthly_maintenance:75e3,condition:95,city:t.capital||t.name,purchased_at_tick:m,is_active:!0})}const O=x?A:r.id,H=Y(O,h,C,k,t.name,m);await i.from("corp_executives").insert(H);const{data:D}=await i.from("executive_pool").select("id").eq("nation_id",t.id).limit(1);if(!D||D.length===0){const o=J(t.id,t.name);await i.from("executive_pool").insert(o)}sessionStorage.removeItem("pending_faction_type"),sessionStorage.removeItem("corp_setup"),window.location.href="corp-dashboard.html"}catch(t){console.error("Corporation creation failed:",t),a.textContent=t.message||"Failed to create corporation. Please try again.",e.disabled=!1,e.textContent="Confirm ▶",e.classList.add("ready")}}function dt(){window.location.href="corp-setup.html"}window.selectNation=nt;window.switchContinent=ct;window.confirmNation=lt;window.goBack=dt;window.selectCompanyType=st;window.onCorpNameInput=ot;window.onTickerInput=rt;Z();
