import{_ as c}from"./supabase-client-BXEzLDpS.js";import{e as u}from"./utils-C2W-HleY.js";import{d as A}from"./bills-DneMKVC7.js";import{g as E}from"./equipment-DsuDdEne.js";import"./config-BIsh65GI.js";import"./government-structure-Df0JI6nQ.js";import"./stats-D_P-mPhL.js";const L={Melizea:"assets/flags/Melizea.png",Avelia:"assets/flags/Avelia1.png",Sangreza:"assets/flags/sangreza.png",Montequilla:"assets/flags/Montequilla.png","San Estrella":"assets/flags/sanestrella.png",Palvera:"assets/flags/Palvera.png",Calveth:"assets/flags/Calveth.png",Flandis:"assets/flags/Flandis.png"},M={Melizea:"A nation inspired by Spanish culture and language.",Sangreza:"A nation inspired by Spanish culture and language.","San Estrella":"A nation inspired by Spanish culture and language.",Palvera:"A nation inspired by Spanish culture and language.",Montequilla:"A nation inspired by Spanish culture and language.",Avelia:"A nation inspired by a hybrid of Spanish and Italian culture and language.",Calveth:"A nation inspired by Danish culture and language.",Flandis:"A nation inspired by Dutch culture and language."};let w=null,a=null,S=[],l={},m=null,$="Crucera",p=null,o="",d="";async function P(){const{data:{user:t}}=await c.auth.getUser();if(!t){window.location.href="login.html";return}w=t;const n=sessionStorage.getItem("corp_setup");if(!n){window.location.href="corp-setup.html";return}if(a=JSON.parse(n),!a.sector||!a.subsector){window.location.href="corp-setup.html";return}B();const[e,s]=await Promise.all([c.from("nations").select("*, nation_profiles(flag_url)").order("name"),c.from("factions").select("id, nation_id, corp_subsector").eq("faction_type","corporation").eq("corp_subsector",a.subsector)]);S=e.data||[];const g=s.data||[];l={};for(const i of g)l[i.nation_id]||(l[i.nation_id]=[]),l[i.nation_id].push(i);I(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="flex"}function B(){const t=document.getElementById("corp-summary-tags"),n=[a.sector,a.subsector,a.companyType];a.corpName&&n.push(a.corpName),a.ticker&&n.push(a.ticker),t.innerHTML=n.map(e=>`<span class="corp-summary__tag">${u(e)}</span>`).join("")}function q(t){const n=(l[t]||[]).length;return n<=1?{label:"High Demand",cls:"demand-badge--high"}:n===2?{label:"Moderate",cls:"demand-badge--moderate"}:{label:"Low Demand",cls:"demand-badge--low"}}function F(t){return t.government_type==="Presidential"?"gov-presidential":"gov-democracy"}function z(t){return t.government_type==="Presidential"?"Presidential":t.hos_election_method==="hereditary"?"Constitutional Monarchy":"Parliamentary"}function I(){const t=document.getElementById("nations-grid"),n=S.filter(e=>(e.continent||"Crucera")===$);if(n.length===0){t.innerHTML='<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);text-align:center;padding:40px 0;grid-column:1/-1;">No nations in this continent yet.</div>';return}t.innerHTML=n.map(e=>{const s=e.nation_profiles,i=(Array.isArray(s)?s[0]?.flag_url:s?.flag_url)||e.flag_url||L[e.name]||"",f=F(e),k=z(e),h=q(e.id),y=(l[e.id]||[]).length,v=m===e.id,x=e.population?e.population.toLocaleString():"—",N=e.gdp?"$"+(e.gdp/1e9).toFixed(1)+"B":"—",_=e.stability!=null?Math.round(e.stability):"—";return`
            <div class="nation-card${v?" selected":""}" data-id="${e.id}" onclick="selectNation('${e.id}')">
                <div class="nation-card__header">
                    ${i?`<img class="nation-card__flag" src="${i}" alt="${u(e.name)}" onerror="this.style.display='none'">`:""}
                    <span class="nation-card__name">${u(e.name)}</span>
                    <span class="nation-card__gov ${f}">${k}</span>
                </div>
                <div class="nation-card__body">
                    ${M[e.name]?'<div class="nation-card__culture">'+u(M[e.name])+"</div>":""}
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
                        <span class="stat-row__value">${_}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">${u(a.subsector)}</span>
                        <span class="stat-row__value">
                            <span class="demand-badge ${h.cls}">${h.label}</span>
                            <span style="font-size:9px;color:var(--text-dim);margin-left:4px;">(${y} corp${y!==1?"s":""})</span>
                        </span>
                    </div>
                </div>
            </div>
        `}).join("")}function D(t){m=t,I(),U()}function U(){const t=document.getElementById("details-panel");t.classList.add("active"),t.innerHTML=`
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
                           maxlength="40" value="${o}" oninput="onCorpNameInput(this.value)">
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
    `,C()}function G(t){document.querySelectorAll("#details-panel .option-card").forEach(n=>n.classList.remove("selected")),t.classList.add("selected"),p=t.dataset.type,C()}function H(t){o=t.trim();const n=document.getElementById("corp-name-hint");o.length>0&&o.length<2?(n.textContent="Too short — minimum 2 characters",n.className="input-hint input-hint--error"):(n.textContent="2-40 characters",n.className="input-hint"),C()}function R(t){const n=t.replace(/[^a-zA-Z]/g,"").toUpperCase().slice(0,4),e=document.getElementById("ticker-input");e.value!==n&&(e.value=n),d=n;const s=document.getElementById("ticker-hint");n.length>0&&n.length<2?(s.textContent="Too short — minimum 2 letters",s.className="input-hint input-hint--error"):(s.textContent="2-4 uppercase letters",s.className="input-hint"),C()}function C(){const t=document.getElementById("btn-confirm"),n=m&&p&&o.length>=2&&d.length>=2;t.disabled=!n,t.classList.toggle("ready",!!n)}function O(t){$=t,document.querySelectorAll(".continent-tab").forEach(n=>{n.classList.toggle("active",n.dataset.continent===t)}),I()}async function j(){if(!m||!w||!p||o.length<2||d.length<2)return;const t=document.getElementById("btn-confirm"),n=document.getElementById("error-message");t.disabled=!0,t.textContent="Creating...",n.textContent="";try{const e=S.find(b=>b.id===m),{data:s}=await c.from("shard").select("current_tick").eq("name","Alpha Shard").single(),g=s?.current_tick||0,{firstNames:i,lastNames:f}=A(e.name),k=i[Math.floor(Math.random()*i.length)],h=f[Math.floor(Math.random()*f.length)],y=40+Math.floor(Math.random()*36),v=(Number(e.currency_strength)||50)/50,x=Math.round(2e7*v),N=Math.round(8e6*v),{error:_}=await c.from("factions").upsert({id:w.id,faction_type:"corporation",faction_name:o,nation_id:e.id,nation:e.name,abbreviation:d,seats:0,needs_rebuild:!1,party_color:"#5aafa5",party_logo:null,party_description:null,leader_first_name:k,leader_last_name:h,leader_age:y,founded_tick:g,action_points:5,corp_sector:a.sector,corp_subsector:a.subsector,corp_company_type:p,corp_ticker:d,corp_cash_reserves:x,corp_loans:N});if(_)throw _;if(a.sector==="Construction"){const b=E();if(b.length>0){const T=b.map(r=>({faction_id:w.id,nation_id:e.id,equipment_key:r.equipment_key,tier:r.tier,owned:r.owned,deployed:r.deployed,condition:r.condition,maintenance_per_tick:r.maintenance_per_tick}));await c.from("corp_equipment").insert(T)}}sessionStorage.removeItem("pending_faction_type"),sessionStorage.removeItem("corp_setup"),window.location.href="corp-dashboard.html"}catch(e){console.error("Corporation creation failed:",e),n.textContent=e.message||"Failed to create corporation. Please try again.",t.disabled=!1,t.textContent="Confirm ▶",t.classList.add("ready")}}function J(){window.location.href="corp-setup.html"}window.selectNation=D;window.switchContinent=O;window.confirmNation=j;window.goBack=J;window.selectCompanyType=G;window.onCorpNameInput=H;window.onTickerInput=R;P();
