import{_ as o}from"./supabase-client-BXEzLDpS.js";import{e as m}from"./utils-C2W-HleY.js";import{d as A}from"./elections-RxJttMgh.js";import{g as E}from"./equipment-DsuDdEne.js";import"./config-BIsh65GI.js";import"./government-types-BgK4qZvD.js";import"./ideology-DgnKVc_l.js";import"./stats-Cb8eW3Os.js";import"./government-structure-BXgURUp5.js";const L={Melizea:"assets/flags/Melizea.png",Avelia:"assets/flags/Avelia1.png",Sangreza:"assets/flags/sangreza.png",Montequilla:"assets/flags/Montequilla.png","San Estrella":"assets/flags/sanestrella.png",Palvera:"assets/flags/Palvera.png",Calveth:"assets/flags/Calveth.png",Flandis:"assets/flags/Flandis.png"},M={Melizea:"A nation inspired by Spanish culture and language.",Sangreza:"A nation inspired by Spanish culture and language.","San Estrella":"A nation inspired by Spanish culture and language.",Palvera:"A nation inspired by Spanish culture and language.",Montequilla:"A nation inspired by Spanish culture and language.",Avelia:"A nation inspired by a hybrid of Spanish and Italian culture and language.",Calveth:"A nation inspired by Danish culture and language.",Flandis:"A nation inspired by Dutch culture and language."};let g=null,a=null,S=[],l={},f=null,$="Crucera",p=null,r="",d="";async function B(){const{data:{user:e}}=await o.auth.getUser();if(!e){window.location.href="login.html";return}g=e;const n=sessionStorage.getItem("corp_setup");if(!n){window.location.href="corp-setup.html";return}if(a=JSON.parse(n),!a.sector||!a.subsector){window.location.href="corp-setup.html";return}P();const[t,s]=await Promise.all([o.from("nations").select("*, nation_profiles(flag_url)").order("name"),o.from("factions").select("id, nation_id, corp_subsector").eq("faction_type","corporation").eq("corp_subsector",a.subsector)]);S=t.data||[];const u=s.data||[];l={};for(const i of u)l[i.nation_id]||(l[i.nation_id]=[]),l[i.nation_id].push(i);I(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="flex"}function P(){const e=document.getElementById("corp-summary-tags"),n=[a.sector,a.subsector,a.companyType];a.corpName&&n.push(a.corpName),a.ticker&&n.push(a.ticker),e.innerHTML=n.map(t=>`<span class="corp-summary__tag">${m(t)}</span>`).join("")}function q(e){const n=(l[e]||[]).length;return n<=1?{label:"High Demand",cls:"demand-badge--high"}:n===2?{label:"Moderate",cls:"demand-badge--moderate"}:{label:"Low Demand",cls:"demand-badge--low"}}function F(e){return e.government_type==="Presidential"?"gov-presidential":"gov-democracy"}function z(e){return e.government_type==="Presidential"?"Presidential":e.hos_election_method==="hereditary"?"Constitutional Monarchy":"Parliamentary"}function I(){const e=document.getElementById("nations-grid"),n=S.filter(t=>(t.continent||"Crucera")===$);if(n.length===0){e.innerHTML='<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);text-align:center;padding:40px 0;grid-column:1/-1;">No nations in this continent yet.</div>';return}e.innerHTML=n.map(t=>{const s=t.nation_profiles,i=(Array.isArray(s)?s[0]?.flag_url:s?.flag_url)||t.flag_url||L[t.name]||"",h=F(t),k=z(t),_=q(t.id),y=(l[t.id]||[]).length,v=f===t.id,x=t.population?t.population.toLocaleString():"—",N=t.gdp?"$"+(t.gdp/1e9).toFixed(1)+"B":"—",b=t.stability!=null?Math.round(t.stability):"—";return`
            <div class="nation-card${v?" selected":""}" data-id="${t.id}" onclick="selectNation('${t.id}')">
                <div class="nation-card__header">
                    ${i?`<img class="nation-card__flag" src="${i}" alt="${m(t.name)}" onerror="this.style.display='none'">`:""}
                    <span class="nation-card__name">${m(t.name)}</span>
                    <span class="nation-card__gov ${h}">${k}</span>
                </div>
                <div class="nation-card__body">
                    ${M[t.name]?'<div class="nation-card__culture">'+m(M[t.name])+"</div>":""}
                    <div class="stat-row">
                        <span class="stat-row__label">Population</span>
                        <span class="stat-row__value">${x}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">GDP</span>
                        <span class="stat-row__value">${N}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">Stability</span>
                        <span class="stat-row__value">${b}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">${m(a.subsector)}</span>
                        <span class="stat-row__value">
                            <span class="demand-badge ${_.cls}">${_.label}</span>
                            <span style="font-size:9px;color:var(--text-dim);margin-left:4px;">(${y} corp${y!==1?"s":""})</span>
                        </span>
                    </div>
                </div>
            </div>
        `}).join("")}function D(e){f=e,I(),U()}function U(){const e=document.getElementById("details-panel");e.classList.add("active"),e.innerHTML=`
        <div class="section-block">
            <div class="section-header">
                <div class="section-dot" style="background:var(--teal)"></div>
                <span class="section-label">Company Type</span>
            </div>
            <div class="section-body" style="display:grid;grid-template-columns:1fr 1fr;gap:6px;align-items:stretch;">
                <div class="option-card${p==="Public"?" selected":""}"
                     data-type="Public" onclick="selectCompanyType(this)" style="margin-bottom:0;display:flex;flex-direction:column;">
                    <div class="option-card__name">Public</div>
                    <div class="option-card__desc" style="flex:1;">Your stock is listed on the market. Shareholders influence decisions, but IPO capital fuels rapid growth. Transparent financials required.</div>
                </div>
                <div class="option-card${p==="Private"?" selected":""}"
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
                           maxlength="40" value="${r}" oninput="onCorpNameInput(this.value)">
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
    `,C()}function G(e){document.querySelectorAll("#details-panel .option-card").forEach(n=>n.classList.remove("selected")),e.classList.add("selected"),p=e.dataset.type,C()}function H(e){r=e.trim();const n=document.getElementById("corp-name-hint");r.length>0&&r.length<2?(n.textContent="Too short — minimum 2 characters",n.className="input-hint input-hint--error"):(n.textContent="2-40 characters",n.className="input-hint"),C()}function R(e){const n=e.replace(/[^a-zA-Z]/g,"").toUpperCase().slice(0,4),t=document.getElementById("ticker-input");t.value!==n&&(t.value=n),d=n;const s=document.getElementById("ticker-hint");n.length>0&&n.length<2?(s.textContent="Too short — minimum 2 letters",s.className="input-hint input-hint--error"):(s.textContent="2-4 uppercase letters",s.className="input-hint"),C()}function C(){const e=document.getElementById("btn-confirm"),n=f&&p&&r.length>=2&&d.length>=2;e.disabled=!n,e.classList.toggle("ready",!!n)}function O(e){$=e,document.querySelectorAll(".continent-tab").forEach(n=>{n.classList.toggle("active",n.dataset.continent===e)}),I()}async function j(){if(!f||!g||!p||r.length<2||d.length<2)return;const e=document.getElementById("btn-confirm"),n=document.getElementById("error-message");e.disabled=!0,e.textContent="Creating...",n.textContent="";try{const t=S.find(w=>w.id===f),{data:s}=await o.from("shard").select("current_tick").eq("name","Alpha Shard").single(),u=s?.current_tick||0,{firstNames:i,lastNames:h}=A(t.name),k=i[Math.floor(Math.random()*i.length)],_=h[Math.floor(Math.random()*h.length)],y=40+Math.floor(Math.random()*36),v=(Number(t.currency_strength)||50)/50,x=Math.round(36e6*v),N=Math.round(8e6*v),{error:b}=await o.from("factions").upsert({id:g.id,faction_type:"corporation",faction_name:r,nation_id:t.id,nation:t.name,abbreviation:d,seats:0,needs_rebuild:!1,party_color:"#5aafa5",party_logo:null,party_description:null,leader_first_name:k,leader_last_name:_,leader_age:y,founded_tick:u,action_points:5,corp_sector:a.sector,corp_subsector:a.subsector,corp_company_type:p,corp_ticker:d,corp_cash_reserves:x,corp_loans:N,corp_general_workforce:375,corp_skilled_workforce:100,corp_innovative_workforce:25,abandoned_at:null});if(b)throw b;if(a.sector==="Construction"){const w=E();if(w.length>0){const T=w.map(c=>({faction_id:g.id,nation_id:t.id,equipment_key:c.equipment_key,tier:c.tier,owned:c.owned,deployed:c.deployed,condition:c.condition,maintenance_per_tick:c.maintenance_per_tick}));await o.from("corp_equipment").insert(T)}await o.from("corp_properties").insert({faction_id:g.id,nation_id:t.id,name:"Starting Warehouse — "+t.name,type:"warehouse",style:"Basic",capacity:100,purchase_price:15e6,monthly_maintenance:75e3,condition:95,city:t.capital||t.name,purchased_at_tick:u,is_active:!0})}sessionStorage.removeItem("pending_faction_type"),sessionStorage.removeItem("corp_setup"),window.location.href="corp-dashboard.html"}catch(t){console.error("Corporation creation failed:",t),n.textContent=t.message||"Failed to create corporation. Please try again.",e.disabled=!1,e.textContent="Confirm ▶",e.classList.add("ready")}}function J(){window.location.href="corp-setup.html"}window.selectNation=D;window.switchContinent=O;window.confirmNation=j;window.goBack=J;window.selectCompanyType=G;window.onCorpNameInput=H;window.onTickerInput=R;B();
