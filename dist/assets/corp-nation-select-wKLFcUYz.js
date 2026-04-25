import{_supabase as o}from"./supabase-client-qEAQbBjE.js";/* empty css                         */import{escapeHtml as b}from"./utils-A98FEun4.js";import{g as j}from"./political-actions-DGca11uY.js";import{g as Y}from"./equipment-DsuDdEne.js";import{h as O}from"./government-structure-DjsO9xG_.js";import{b as Z,g as J}from"./corp-executives-Arzga-9x.js";import{V as K}from"./vessels-CjafVZ4G.js";import"./config-CKNXR-qR.js";import"./stats-tIiBSaQA.js";const W={Melizea:"assets/flags/Melizea.png",Avelia:"assets/flags/Avelia.png",Sangreza:"assets/flags/sangreza.png",Montequilla:"assets/flags/Montequilla.png","San Estrella":"assets/flags/sanestrella.png",Palvera:"assets/flags/Palvera.png",Calveth:"assets/flags/Calveth.png",Flandis:"assets/flags/Flandis.png",Vostia:"assets/flags/Vostia.png",Sierramar:"assets/flags/Sierramar.png",Dravka:"assets/flags/Dravka.png",Danwei:"assets/flags/Danwei.png"},z={Melizea:"A nation inspired by Spanish culture and language.",Sangreza:"A nation inspired by Spanish culture and language.","San Estrella":"A nation inspired by Spanish culture and language.",Palvera:"A nation inspired by Spanish culture and language.",Montequilla:"A nation inspired by Spanish culture and language.",Avelia:"A nation inspired by a hybrid of Spanish and Italian culture and language.",Calveth:"A nation inspired by Danish culture and language.",Flandis:"A nation inspired by Dutch culture and language.",Vostia:"A nation inspired by Serbian/Montenegrin culture and language.",Sierramar:"A small Caribbean island democracy with a young, religious population and a service-driven economy. This nation is analogous to Puerto Rico with a Spanish theme.",Hajjara:"A vast desert monarchy rich in oil and gas, governed by an absolute king. Inspired by Arabic culture, with deep traditions and a young, growing population.",Dravka:"Dravka is analogous culturally to Albania.",Danwei:"A high-tech island republic on the new continent of Faresia, with a globalist, export-driven economy. Inspired by Taiwanese culture and language, Danweian society blends Zulindao folk tradition with cosmopolitan urbanism."};let r=null,n=null,B=[],f={},_=null,U="Crucera",M="Private",d="",l="";async function Q(){const{data:{user:e}}=await o.auth.getUser();if(!e){window.location.href="login.html";return}r=e;const a=sessionStorage.getItem("corp_setup");if(!a){window.location.href="corp-setup.html";return}if(n=JSON.parse(a),!n.sector||!n.subsector){window.location.href="corp-setup.html";return}X();const[t,s]=await Promise.all([o.from("nations").select("*, nation_profiles(flag_url)").order("name"),o.from("factions").select("id, nation_id, corp_subsector").eq("faction_type","corporation").eq("corp_subsector",n.subsector)]);B=t.data||[];const p=s.data||[];f={};for(const c of p)f[c.nation_id]||(f[c.nation_id]=[]),f[c.nation_id].push(c);D(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="flex"}function X(){const e=document.getElementById("corp-summary-tags"),a=[n.sector,n.subsector,n.companyType];n.corpName&&a.push(n.corpName),n.ticker&&a.push(n.ticker),e.innerHTML=a.map(t=>`<span class="corp-summary__tag">${b(t)}</span>`).join("")}function tt(e){const a=(f[e]||[]).length;return a<=1?{label:"High Demand",cls:"demand-badge--high"}:a===2?{label:"Moderate",cls:"demand-badge--moderate"}:{label:"Low Demand",cls:"demand-badge--low"}}function et(e){return O(e)?"gov-presidential":"gov-democracy"}function at(e){return O(e)?"Presidential":e.hos_election_method==="hereditary"?"Constitutional Monarchy":"Parliamentary"}const nt=["Montequilla","Vostia"];function D(){const e=document.getElementById("nations-grid"),a=B.filter(t=>(t.continent||"Crucera")===U);if(a.length===0){e.innerHTML='<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);text-align:center;padding:40px 0;grid-column:1/-1;">No nations in this continent yet.</div>';return}e.innerHTML=a.map(t=>{const s=t.nation_profiles,p=Array.isArray(s)?s[0]?.flag_url:s?.flag_url,c=W[t.name]||(p||"").trim()||(t.flag_url||"").trim()||"",m=et(t),w=at(t),h=tt(t.id),y=(f[t.id]||[]).length,C=_===t.id,k=nt.includes(t.name),g=n&&n.sector==="Shipping"&&k,T=t.population?t.population.toLocaleString():"—",$=t.gdp?"$"+(t.gdp/1e9).toFixed(1)+"B":"—",E=t.stability!=null?Math.round(t.stability):"—",A=t.corporate_tax!=null?Math.round(t.corporate_tax)+"%":"—";return`
            <div class="nation-card${C?" selected":""}${g?" disabled":""}" data-id="${t.id}" onclick="${g?"":"selectNation('"+t.id+"')"}">
                ${g?'<span class="option-card__badge option-card__badge--soon" style="background:#d9534f;">Landlocked</span>':""}
                <div class="nation-card__header">
                    ${c?`<img class="nation-card__flag" src="${c}" alt="${b(t.name)}" onerror="this.style.display='none'">`:""}
                    <span class="nation-card__name">${b(t.name)}</span>
                    <span class="nation-card__gov ${m}">${w}</span>
                </div>
                <div class="nation-card__body">
                    ${z[t.name]?'<div class="nation-card__culture">'+b(z[t.name])+"</div>":""}
                    <div class="stat-row">
                        <span class="stat-row__label">Population</span>
                        <span class="stat-row__value">${T}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">GDP</span>
                        <span class="stat-row__value">${$}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">Stability</span>
                        <span class="stat-row__value">${E}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">Corporate Tax</span>
                        <span class="stat-row__value">${A}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">${b(n.subsector)}</span>
                        <span class="stat-row__value">
                            <span class="demand-badge ${h.cls}">${h.label}</span>
                            <span style="font-size:9px;color:var(--text-dim);margin-left:4px;">(${y} corp${y!==1?"s":""})</span>
                        </span>
                    </div>
                </div>
            </div>
        `}).join("")}function it(e){_=e,D(),ot()}function ot(){const e=document.getElementById("details-panel");e.classList.add("active"),e.innerHTML=`
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
    `,I()}function st(e){document.querySelectorAll("#details-panel .option-card").forEach(a=>a.classList.remove("selected")),e.classList.add("selected"),M=e.dataset.type,I()}function rt(e){d=e.trim();const a=document.getElementById("corp-name-hint");d.length>0&&d.length<2?(a.textContent="Too short — minimum 2 characters",a.className="input-hint input-hint--error"):(a.textContent="2-40 characters",a.className="input-hint"),I()}function ct(e){const a=e.replace(/[^a-zA-Z]/g,"").toUpperCase().slice(0,4),t=document.getElementById("ticker-input");t.value!==a&&(t.value=a),l=a;const s=document.getElementById("ticker-hint");a.length>0&&a.length<2?(s.textContent="Too short — minimum 2 letters",s.className="input-hint input-hint--error"):(s.textContent="2-4 uppercase letters",s.className="input-hint"),I()}function I(){const e=document.getElementById("btn-confirm"),a=_&&M&&d.length>=2&&l.length>=2;e.disabled=!a,e.classList.toggle("ready",!!a)}function lt(e){U=e,document.querySelectorAll(".continent-tab").forEach(a=>{a.classList.toggle("active",a.dataset.continent===e)}),D()}async function dt(){if(!_||!r||!M||d.length<2||l.length<2)return;const e=document.getElementById("btn-confirm"),a=document.getElementById("error-message");e.disabled=!0,e.textContent="Creating...",a.textContent="";try{const t=B.find(i=>i.id===_),{data:s}=await o.from("factions").select("id, faction_name").eq("faction_type","corporation").eq("corp_ticker",l).is("abandoned_at",null).limit(1);if(s&&s.length>0){a.textContent=`Ticker "${l}" is already in use by ${s[0].faction_name}. Choose a different abbreviation.`,e.disabled=!1,e.textContent="Confirm ▶";return}const{data:p}=await o.from("factions").select("id, faction_type, faction_name").or(`id.eq.${r.id},linked_user_id.eq.${r.id}`).eq("nation_id",_).is("abandoned_at",null).maybeSingle();if(p){const i=p.faction_type==="party"?"political party":"corporation";a.textContent=`You already have a ${i} ("${p.faction_name}") in ${t.name}. One faction per nation.`,e.disabled=!1,e.textContent="Confirm ▶";return}const{data:c}=await o.from("shard").select("current_tick").eq("name","Alpha Shard").single(),m=c?.current_tick||0,{firstNames:w,lastNames:h}=j(t.name),y=w[Math.floor(Math.random()*w.length)],C=h[Math.floor(Math.random()*h.length)],k=40+Math.floor(Math.random()*36),g=(Number(t.currency_strength)||50)/50,T=n.sector==="Finance"?Math.max(.5,1-(Number(t.inflation)||0)/200):1,$=n.sector==="Finance"?225e6:n.sector==="Shipping"?8e7:36e6,E=Math.round($*g*T),A=Math.round(8e6*g),{data:P}=await o.from("factions").select("id, faction_type").eq("id",r.id).is("abandoned_at",null).maybeSingle(),x=P&&P.faction_type==="party",L=x?crypto.randomUUID():r.id,S={id:L,faction_type:"corporation",faction_name:d,nation_id:t.id,nation:t.name,abbreviation:l,seats:0,needs_rebuild:!1,party_color:"#5aafa5",party_logo:null,party_description:null,leader_first_name:y,leader_last_name:C,leader_age:k,founded_tick:m,action_points:0,corp_sector:n.sector,corp_subsector:n.subsector,corp_company_type:M,corp_ticker:l,corp_cash_reserves:E,corp_loans:A,corp_general_workforce:375,corp_skilled_workforce:100,corp_innovative_workforce:25,corp_reputation:n.subsector==="Megaprojects"?85:n.subsector==="Industrial Construction"?50:65,abandoned_at:null};if(x){S.linked_user_id=r.id;const{error:i}=await o.from("factions").insert(S);if(i)throw i}else{const{error:i}=await o.from("factions").upsert(S);if(i)throw i}if(n.sector==="Shipping"){const i=n.subsector==="Bulk Cargo"?3:2;await o.from("factions").update({shipping_fleet_capacity:i,shipping_fleet_deployed:0}).eq("id",x?r.id:S.id);const N={"Bulk Cargo":[{cls:"Coastal",idx:1},{cls:"Coastal",idx:2},{cls:"Reefer",idx:3}],"Container Freight":[{cls:"Coastal",idx:1},{cls:"Container",idx:2}],"Specialized Transport":[{cls:"Tanker",idx:1},{cls:"Bulk",idx:2}]},V=(N[n.subsector]||N["Bulk Cargo"]).map(q=>{const v=K[q.cls];return{faction_id:L,nation_id:t.id,vessel_name:l+"-"+d.split(" ")[0]+" "+q.idx,vessel_class:q.cls,condition:85+Math.floor(Math.random()*16),fuel:70+Math.floor(Math.random()*31),status:"in_port",capacity_dwt:v.capacity_dwt,capacity_unit:v.capacity_unit,base_maintenance:v.base_maintenance,fuel_capacity:v.fuel_capacity,purchase_price:v.purchase_price,built_at_tick:m,current_port_nation_id:t.id}}),{error:R}=await o.from("corp_vessels").insert(V);R&&console.warn("Failed to seed starting fleet:",R.message)}if(n.sector==="Construction"){const i=Y();if(i.length>0){const N=i.map(u=>({faction_id:r.id,nation_id:t.id,equipment_key:u.equipment_key,tier:u.tier,owned:u.owned,deployed:u.deployed,condition:u.condition,maintenance_per_tick:u.maintenance_per_tick}));await o.from("corp_equipment").insert(N)}await o.from("corp_properties").insert({faction_id:r.id,nation_id:t.id,name:"Starting Warehouse — "+t.name,type:"warehouse",role:"warehouse",style:"Basic",capacity:100,purchase_price:15e6,monthly_maintenance:75e3,condition:95,city:t.capital||t.name,purchased_at_tick:m,is_active:!0})}const G=x?L:r.id,H=Z(G,y,C,k,t.name,m);await o.from("corp_executives").insert(H);const{data:F}=await o.from("executive_pool").select("id").eq("nation_id",t.id).limit(1);if(!F||F.length===0){const i=J(t.id,t.name);await o.from("executive_pool").insert(i)}sessionStorage.removeItem("pending_faction_type"),sessionStorage.removeItem("corp_setup"),window.location.href="corp-dashboard.html"}catch(t){console.error("Corporation creation failed:",t),a.textContent=t.message||"Failed to create corporation. Please try again.",e.disabled=!1,e.textContent="Confirm ▶",e.classList.add("ready")}}function pt(){window.location.href="corp-setup.html"}window.selectNation=it;window.switchContinent=lt;window.confirmNation=dt;window.goBack=pt;window.selectCompanyType=st;window.onCorpNameInput=rt;window.onTickerInput=ct;Q();
