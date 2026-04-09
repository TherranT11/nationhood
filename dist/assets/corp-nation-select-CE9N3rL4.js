import{_ as o}from"./supabase-client-BXEzLDpS.js";import{e as f}from"./utils-C2W-HleY.js";import{d as L}from"./elections-CyO2onts.js";import{g as P}from"./equipment-DsuDdEne.js";import{h as T}from"./government-types-BwzErBjP.js";import"./config-fKhFNVuq.js";import"./ideology-5B3UuuGK.js";import"./stats-DqgGwtpW.js";import"./government-structure-3HZRNYFO.js";const F={Melizea:"assets/flags/Melizea.png",Avelia:"assets/flags/Avelia.png",Sangreza:"assets/flags/sangreza.png",Montequilla:"assets/flags/Montequilla.png","San Estrella":"assets/flags/sanestrella.png",Palvera:"assets/flags/Palvera.png",Calveth:"assets/flags/Calveth.png",Flandis:"assets/flags/Flandis.png",Vostia:"assets/flags/Vostia.png"},M={Melizea:"A nation inspired by Spanish culture and language.",Sangreza:"A nation inspired by Spanish culture and language.","San Estrella":"A nation inspired by Spanish culture and language.",Palvera:"A nation inspired by Spanish culture and language.",Montequilla:"A nation inspired by Spanish culture and language.",Avelia:"A nation inspired by a hybrid of Spanish and Italian culture and language.",Calveth:"A nation inspired by Danish culture and language.",Flandis:"A nation inspired by Dutch culture and language."};let d=null,a=null,S=[],p={},u=null,E="Crucera",w="Private",c="",r="";async function z(){const{data:{user:e}}=await o.auth.getUser();if(!e){window.location.href="login.html";return}d=e;const n=sessionStorage.getItem("corp_setup");if(!n){window.location.href="corp-setup.html";return}if(a=JSON.parse(n),!a.sector||!a.subsector){window.location.href="corp-setup.html";return}D();const[t,s]=await Promise.all([o.from("nations").select("*, nation_profiles(flag_url)").order("name"),o.from("factions").select("id, nation_id, corp_subsector").eq("faction_type","corporation").eq("corp_subsector",a.subsector)]);S=t.data||[];const m=s.data||[];p={};for(const i of m)p[i.nation_id]||(p[i.nation_id]=[]),p[i.nation_id].push(i);I(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="flex"}function D(){const e=document.getElementById("corp-summary-tags"),n=[a.sector,a.subsector,a.companyType];a.corpName&&n.push(a.corpName),a.ticker&&n.push(a.ticker),e.innerHTML=n.map(t=>`<span class="corp-summary__tag">${f(t)}</span>`).join("")}function G(e){const n=(p[e]||[]).length;return n<=1?{label:"High Demand",cls:"demand-badge--high"}:n===2?{label:"Moderate",cls:"demand-badge--moderate"}:{label:"Low Demand",cls:"demand-badge--low"}}function U(e){return T(e)?"gov-presidential":"gov-democracy"}function H(e){return T(e)?"Presidential":e.hos_election_method==="hereditary"?"Constitutional Monarchy":"Parliamentary"}function I(){const e=document.getElementById("nations-grid"),n=S.filter(t=>(t.continent||"Crucera")===E);if(n.length===0){e.innerHTML='<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);text-align:center;padding:40px 0;grid-column:1/-1;">No nations in this continent yet.</div>';return}e.innerHTML=n.map(t=>{const s=t.nation_profiles,i=(Array.isArray(s)?s[0]?.flag_url:s?.flag_url)||t.flag_url||F[t.name]||"",_=U(t),h=H(t),g=G(t.id),y=(p[t.id]||[]).length,k=u===t.id,x=t.population?t.population.toLocaleString():"—",v=t.gdp?"$"+(t.gdp/1e9).toFixed(1)+"B":"—",N=t.stability!=null?Math.round(t.stability):"—";return`
            <div class="nation-card${k?" selected":""}" data-id="${t.id}" onclick="selectNation('${t.id}')">
                <div class="nation-card__header">
                    ${i?`<img class="nation-card__flag" src="${i}" alt="${f(t.name)}" onerror="this.style.display='none'">`:""}
                    <span class="nation-card__name">${f(t.name)}</span>
                    <span class="nation-card__gov ${_}">${h}</span>
                </div>
                <div class="nation-card__body">
                    ${M[t.name]?'<div class="nation-card__culture">'+f(M[t.name])+"</div>":""}
                    <div class="stat-row">
                        <span class="stat-row__label">Population</span>
                        <span class="stat-row__value">${x}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">GDP</span>
                        <span class="stat-row__value">${v}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">Stability</span>
                        <span class="stat-row__value">${N}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">${f(a.subsector)}</span>
                        <span class="stat-row__value">
                            <span class="demand-badge ${g.cls}">${g.label}</span>
                            <span style="font-size:9px;color:var(--text-dim);margin-left:4px;">(${y} corp${y!==1?"s":""})</span>
                        </span>
                    </div>
                </div>
            </div>
        `}).join("")}function O(e){u=e,I(),R()}function R(){const e=document.getElementById("details-panel");e.classList.add("active"),e.innerHTML=`
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
                           maxlength="40" value="${c}" oninput="onCorpNameInput(this.value)">
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
                           maxlength="4" value="${r}" style="text-transform:uppercase;letter-spacing:0.15em;font-weight:600;"
                           oninput="onTickerInput(this.value)">
                    <div class="input-hint" id="ticker-hint">2-4 uppercase letters</div>
                </div>
            </div>
        </div>
    `,C()}function j(e){document.querySelectorAll("#details-panel .option-card").forEach(n=>n.classList.remove("selected")),e.classList.add("selected"),w=e.dataset.type,C()}function V(e){c=e.trim();const n=document.getElementById("corp-name-hint");c.length>0&&c.length<2?(n.textContent="Too short — minimum 2 characters",n.className="input-hint input-hint--error"):(n.textContent="2-40 characters",n.className="input-hint"),C()}function Y(e){const n=e.replace(/[^a-zA-Z]/g,"").toUpperCase().slice(0,4),t=document.getElementById("ticker-input");t.value!==n&&(t.value=n),r=n;const s=document.getElementById("ticker-hint");n.length>0&&n.length<2?(s.textContent="Too short — minimum 2 letters",s.className="input-hint input-hint--error"):(s.textContent="2-4 uppercase letters",s.className="input-hint"),C()}function C(){const e=document.getElementById("btn-confirm"),n=u&&w&&c.length>=2&&r.length>=2;e.disabled=!n,e.classList.toggle("ready",!!n)}function J(e){E=e,document.querySelectorAll(".continent-tab").forEach(n=>{n.classList.toggle("active",n.dataset.continent===e)}),I()}async function W(){if(!u||!d||!w||c.length<2||r.length<2)return;const e=document.getElementById("btn-confirm"),n=document.getElementById("error-message");e.disabled=!0,e.textContent="Creating...",n.textContent="";try{const t=S.find(b=>b.id===u),{data:s}=await o.from("factions").select("id, faction_name").eq("faction_type","corporation").eq("corp_ticker",r).is("abandoned_at",null).limit(1);if(s&&s.length>0){n.textContent=`Ticker "${r}" is already in use by ${s[0].faction_name}. Choose a different abbreviation.`,e.disabled=!1,e.textContent="Confirm ▶";return}const{data:m}=await o.from("factions").select("id, faction_name").eq("id",d.id).eq("faction_type","party").eq("nation_id",u).is("abandoned_at",null).maybeSingle();if(m){n.textContent=`Your political party "${m.faction_name}" is in ${t.name}. Corporations cannot operate in the same nation as your party.`,e.disabled=!1,e.textContent="Confirm ▶";return}const{data:i}=await o.from("shard").select("current_tick").eq("name","Alpha Shard").single(),_=i?.current_tick||0,{firstNames:h,lastNames:g}=L(t.name),y=h[Math.floor(Math.random()*h.length)],k=g[Math.floor(Math.random()*g.length)],x=40+Math.floor(Math.random()*36),v=(Number(t.currency_strength)||50)/50,N=a.sector==="Finance"?32e6:36e6,q=Math.round(N*v),A=Math.round(8e6*v),{error:$}=await o.from("factions").upsert({id:d.id,faction_type:"corporation",faction_name:c,nation_id:t.id,nation:t.name,abbreviation:r,seats:0,needs_rebuild:!1,party_color:"#5aafa5",party_logo:null,party_description:null,leader_first_name:y,leader_last_name:k,leader_age:x,founded_tick:_,action_points:0,corp_sector:a.sector,corp_subsector:a.subsector,corp_company_type:w,corp_ticker:r,corp_cash_reserves:q,corp_loans:A,corp_general_workforce:375,corp_skilled_workforce:100,corp_innovative_workforce:25,abandoned_at:null});if($)throw $;if(a.sector==="Construction"){const b=P();if(b.length>0){const B=b.map(l=>({faction_id:d.id,nation_id:t.id,equipment_key:l.equipment_key,tier:l.tier,owned:l.owned,deployed:l.deployed,condition:l.condition,maintenance_per_tick:l.maintenance_per_tick}));await o.from("corp_equipment").insert(B)}await o.from("corp_properties").insert({faction_id:d.id,nation_id:t.id,name:"Starting Warehouse — "+t.name,type:"warehouse",style:"Basic",capacity:100,purchase_price:15e6,monthly_maintenance:75e3,condition:95,city:t.capital||t.name,purchased_at_tick:_,is_active:!0})}sessionStorage.removeItem("pending_faction_type"),sessionStorage.removeItem("corp_setup"),window.location.href="corp-dashboard.html"}catch(t){console.error("Corporation creation failed:",t),n.textContent=t.message||"Failed to create corporation. Please try again.",e.disabled=!1,e.textContent="Confirm ▶",e.classList.add("ready")}}function Z(){window.location.href="corp-setup.html"}window.selectNation=O;window.switchContinent=J;window.confirmNation=W;window.goBack=Z;window.selectCompanyType=j;window.onCorpNameInput=V;window.onTickerInput=Y;z();
