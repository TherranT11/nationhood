import{_ as o}from"./supabase-client-BXEzLDpS.js";import{e as h}from"./utils-C2W-HleY.js";import{d as F}from"./elections-CkHot4u1.js";import{g as z}from"./equipment-DsuDdEne.js";import{h as E}from"./government-types-BwzErBjP.js";import"./config-fKhFNVuq.js";import"./ideology-Dqw3ro_Z.js";import"./stats-DqgGwtpW.js";import"./government-structure-ZDj3uFqp.js";const D={Melizea:"assets/flags/Melizea.png",Avelia:"assets/flags/Avelia.png",Sangreza:"assets/flags/sangreza.png",Montequilla:"assets/flags/Montequilla.png","San Estrella":"assets/flags/sanestrella.png",Palvera:"assets/flags/Palvera.png",Calveth:"assets/flags/Calveth.png",Flandis:"assets/flags/Flandis.png",Vostia:"assets/flags/Vostia.png",Sierramar:"assets/flags/Sierramar.png"},A={Melizea:"A nation inspired by Spanish culture and language.",Sangreza:"A nation inspired by Spanish culture and language.","San Estrella":"A nation inspired by Spanish culture and language.",Palvera:"A nation inspired by Spanish culture and language.",Montequilla:"A nation inspired by Spanish culture and language.",Avelia:"A nation inspired by a hybrid of Spanish and Italian culture and language.",Calveth:"A nation inspired by Danish culture and language.",Flandis:"A nation inspired by Dutch culture and language.",Vostia:"A nation inspired by Serbian/Montenegrin culture and language.",Sierramar:"A small Caribbean island democracy with a young, religious population and a service-driven economy. This nation is analogous to Puerto Rico with a Spanish theme."};let c=null,a=null,I=[],u={},m=null,q="Crucera",w="Private",d="",l="";async function U(){const{data:{user:e}}=await o.auth.getUser();if(!e){window.location.href="login.html";return}c=e;const n=sessionStorage.getItem("corp_setup");if(!n){window.location.href="corp-setup.html";return}if(a=JSON.parse(n),!a.sector||!a.subsector){window.location.href="corp-setup.html";return}G();const[t,i]=await Promise.all([o.from("nations").select("*, nation_profiles(flag_url)").order("name"),o.from("factions").select("id, nation_id, corp_subsector").eq("faction_type","corporation").eq("corp_subsector",a.subsector)]);I=t.data||[];const g=i.data||[];u={};for(const r of g)u[r.nation_id]||(u[r.nation_id]=[]),u[r.nation_id].push(r);M(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="flex"}function G(){const e=document.getElementById("corp-summary-tags"),n=[a.sector,a.subsector,a.companyType];a.corpName&&n.push(a.corpName),a.ticker&&n.push(a.ticker),e.innerHTML=n.map(t=>`<span class="corp-summary__tag">${h(t)}</span>`).join("")}function R(e){const n=(u[e]||[]).length;return n<=1?{label:"High Demand",cls:"demand-badge--high"}:n===2?{label:"Moderate",cls:"demand-badge--moderate"}:{label:"Low Demand",cls:"demand-badge--low"}}function H(e){return E(e)?"gov-presidential":"gov-democracy"}function O(e){return E(e)?"Presidential":e.hos_election_method==="hereditary"?"Constitutional Monarchy":"Parliamentary"}function M(){const e=document.getElementById("nations-grid"),n=I.filter(t=>(t.continent||"Crucera")===q);if(n.length===0){e.innerHTML='<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);text-align:center;padding:40px 0;grid-column:1/-1;">No nations in this continent yet.</div>';return}e.innerHTML=n.map(t=>{const i=t.nation_profiles,r=(Array.isArray(i)?i[0]?.flag_url:i?.flag_url)||t.flag_url||D[t.name]||"",_=H(t),y=O(t),f=R(t.id),v=(u[t.id]||[]).length,k=m===t.id,S=t.population?t.population.toLocaleString():"—",b=t.gdp?"$"+(t.gdp/1e9).toFixed(1)+"B":"—",x=t.stability!=null?Math.round(t.stability):"—";return`
            <div class="nation-card${k?" selected":""}" data-id="${t.id}" onclick="selectNation('${t.id}')">
                <div class="nation-card__header">
                    ${r?`<img class="nation-card__flag" src="${r}" alt="${h(t.name)}" onerror="this.style.display='none'">`:""}
                    <span class="nation-card__name">${h(t.name)}</span>
                    <span class="nation-card__gov ${_}">${y}</span>
                </div>
                <div class="nation-card__body">
                    ${A[t.name]?'<div class="nation-card__culture">'+h(A[t.name])+"</div>":""}
                    <div class="stat-row">
                        <span class="stat-row__label">Population</span>
                        <span class="stat-row__value">${S}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">GDP</span>
                        <span class="stat-row__value">${b}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">Stability</span>
                        <span class="stat-row__value">${x}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">${h(a.subsector)}</span>
                        <span class="stat-row__value">
                            <span class="demand-badge ${f.cls}">${f.label}</span>
                            <span style="font-size:9px;color:var(--text-dim);margin-left:4px;">(${v} corp${v!==1?"s":""})</span>
                        </span>
                    </div>
                </div>
            </div>
        `}).join("")}function V(e){m=e,M(),j()}function j(){const e=document.getElementById("details-panel");e.classList.add("active"),e.innerHTML=`
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
                           maxlength="40" value="${d}" oninput="onCorpNameInput(this.value)">
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
                           maxlength="4" value="${l}" style="text-transform:uppercase;letter-spacing:0.15em;font-weight:600;"
                           oninput="onTickerInput(this.value)">
                    <div class="input-hint" id="ticker-hint">2-4 uppercase letters</div>
                </div>
            </div>
        </div>
    `,C()}function Y(e){document.querySelectorAll("#details-panel .option-card").forEach(n=>n.classList.remove("selected")),e.classList.add("selected"),w=e.dataset.type,C()}function J(e){d=e.trim();const n=document.getElementById("corp-name-hint");d.length>0&&d.length<2?(n.textContent="Too short — minimum 2 characters",n.className="input-hint input-hint--error"):(n.textContent="2-40 characters",n.className="input-hint"),C()}function W(e){const n=e.replace(/[^a-zA-Z]/g,"").toUpperCase().slice(0,4),t=document.getElementById("ticker-input");t.value!==n&&(t.value=n),l=n;const i=document.getElementById("ticker-hint");n.length>0&&n.length<2?(i.textContent="Too short — minimum 2 letters",i.className="input-hint input-hint--error"):(i.textContent="2-4 uppercase letters",i.className="input-hint"),C()}function C(){const e=document.getElementById("btn-confirm"),n=m&&w&&d.length>=2&&l.length>=2;e.disabled=!n,e.classList.toggle("ready",!!n)}function Z(e){q=e,document.querySelectorAll(".continent-tab").forEach(n=>{n.classList.toggle("active",n.dataset.continent===e)}),M()}async function K(){if(!m||!c||!w||d.length<2||l.length<2)return;const e=document.getElementById("btn-confirm"),n=document.getElementById("error-message");e.disabled=!0,e.textContent="Creating...",n.textContent="";try{const t=I.find(s=>s.id===m),{data:i}=await o.from("factions").select("id, faction_name").eq("faction_type","corporation").eq("corp_ticker",l).is("abandoned_at",null).limit(1);if(i&&i.length>0){n.textContent=`Ticker "${l}" is already in use by ${i[0].faction_name}. Choose a different abbreviation.`,e.disabled=!1,e.textContent="Confirm ▶";return}const{data:g}=await o.from("factions").select("id, faction_name").eq("id",c.id).eq("faction_type","party").eq("nation_id",m).is("abandoned_at",null).maybeSingle();if(g){n.textContent=`Your political party "${g.faction_name}" is in ${t.name}. Corporations cannot operate in the same nation as your party.`,e.disabled=!1,e.textContent="Confirm ▶";return}const{data:r}=await o.from("shard").select("current_tick").eq("name","Alpha Shard").single(),_=r?.current_tick||0,{firstNames:y,lastNames:f}=F(t.name),v=y[Math.floor(Math.random()*y.length)],k=f[Math.floor(Math.random()*f.length)],S=40+Math.floor(Math.random()*36),b=(Number(t.currency_strength)||50)/50,x=a.sector==="Finance"?32e6:36e6,L=Math.round(x*b),B=Math.round(8e6*b),{data:$}=await o.from("factions").select("id, faction_type").eq("id",c.id).is("abandoned_at",null).maybeSingle(),T=$&&$.faction_type==="party",N={id:T?crypto.randomUUID():c.id,faction_type:"corporation",faction_name:d,nation_id:t.id,nation:t.name,abbreviation:l,seats:0,needs_rebuild:!1,party_color:"#5aafa5",party_logo:null,party_description:null,leader_first_name:v,leader_last_name:k,leader_age:S,founded_tick:_,action_points:0,corp_sector:a.sector,corp_subsector:a.subsector,corp_company_type:w,corp_ticker:l,corp_cash_reserves:L,corp_loans:B,corp_general_workforce:375,corp_skilled_workforce:100,corp_innovative_workforce:25,abandoned_at:null};if(T){N.linked_user_id=c.id;const{error:s}=await o.from("factions").insert(N);if(s)throw s}else{const{error:s}=await o.from("factions").upsert(N);if(s)throw s}if(a.sector==="Construction"){const s=z();if(s.length>0){const P=s.map(p=>({faction_id:c.id,nation_id:t.id,equipment_key:p.equipment_key,tier:p.tier,owned:p.owned,deployed:p.deployed,condition:p.condition,maintenance_per_tick:p.maintenance_per_tick}));await o.from("corp_equipment").insert(P)}await o.from("corp_properties").insert({faction_id:c.id,nation_id:t.id,name:"Starting Warehouse — "+t.name,type:"warehouse",style:"Basic",capacity:100,purchase_price:15e6,monthly_maintenance:75e3,condition:95,city:t.capital||t.name,purchased_at_tick:_,is_active:!0})}sessionStorage.removeItem("pending_faction_type"),sessionStorage.removeItem("corp_setup"),window.location.href="corp-dashboard.html"}catch(t){console.error("Corporation creation failed:",t),n.textContent=t.message||"Failed to create corporation. Please try again.",e.disabled=!1,e.textContent="Confirm ▶",e.classList.add("ready")}}function Q(){window.location.href="corp-setup.html"}window.selectNation=V;window.switchContinent=Z;window.confirmNation=K;window.goBack=Q;window.selectCompanyType=Y;window.onCorpNameInput=J;window.onTickerInput=W;U();
