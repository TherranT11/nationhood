import{_supabase as s}from"./supabase-client-qEAQbBjE.js";/* empty css                         */import{escapeHtml as y}from"./utils-A98FEun4.js";import{g as O}from"./political-actions-CoM-LDWz.js";import{h as B}from"./government-structure-C17uG6rl.js";import{b as U,g as R}from"./corp-executives-Dy9E4H6_.js";import"./config-CHsHqv7d.js";import"./stats-4gK98flh.js";const H={Melizea:"assets/flags/Melizea.png",Avelia:"assets/flags/Avelia.png",Sangreza:"assets/flags/sangreza.png",Montequilla:"assets/flags/Montequilla.png","San Estrella":"assets/flags/sanestrella.png",Palvera:"assets/flags/Palvera.png",Calveth:"assets/flags/Calveth.png",Flandis:"assets/flags/Flandis.png",Vostia:"assets/flags/Vostia.png",Sierramar:"assets/flags/Sierramar.png",Dravka:"assets/flags/Dravka.png",Danwei:"assets/flags/Danwei.png"},D={Melizea:"A nation inspired by Spanish culture and language.",Sangreza:"A nation inspired by Spanish culture and language.","San Estrella":"A nation inspired by Spanish culture and language.",Palvera:"A nation inspired by Spanish culture and language.",Montequilla:"A nation inspired by Spanish culture and language.",Avelia:"A nation inspired by a hybrid of Spanish and Italian culture and language.",Calveth:"A nation inspired by Danish culture and language.",Flandis:"A nation inspired by Dutch culture and language.",Vostia:"A nation inspired by Serbian/Montenegrin culture and language.",Sierramar:"A small Caribbean island democracy with a young, religious population and a service-driven economy. This nation is analogous to Puerto Rico with a Spanish theme.",Hajjara:"A vast desert monarchy rich in oil and gas, governed by an absolute king. Inspired by Arabic culture, with deep traditions and a young, growing population.",Dravka:"Dravka is analogous culturally to Albania.",Danwei:"A high-tech island republic on the new continent of Faresia, with a globalist, export-driven economy. Inspired by Taiwanese culture and language, Danweian society blends Zulindao folk tradition with cosmopolitan urbanism."};let c=null,n=null,$=[],u={},m=null,q="Crucera",x="Private",p="",l="";async function G(){const{data:{user:e}}=await s.auth.getUser();if(!e){window.location.href="login.html";return}c=e;const a=sessionStorage.getItem("corp_setup");if(!a){window.location.href="corp-setup.html";return}if(n=JSON.parse(a),!n.sector){window.location.href="corp-setup.html";return}j();const[t,i]=await Promise.all([s.from("nations").select("*, nation_profiles(flag_url)").order("name"),s.from("factions").select("id, nation_id, corp_sector").eq("faction_type","corporation").eq("corp_sector",n.sector)]);$=t.data||[];const d=i.data||[];u={};for(const r of d)u[r.nation_id]||(u[r.nation_id]=[]),u[r.nation_id].push(r);A(),document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="flex"}function j(){const e=document.getElementById("corp-summary-tags"),a=[n.sector,n.companyType].filter(Boolean);n.corpName&&a.push(n.corpName),n.ticker&&a.push(n.ticker),e.innerHTML=a.map(t=>`<span class="corp-summary__tag">${y(t)}</span>`).join("")}function V(e){const a=(u[e]||[]).length;return a<=1?{label:"High Demand",cls:"demand-badge--high"}:a===2?{label:"Moderate",cls:"demand-badge--moderate"}:{label:"Low Demand",cls:"demand-badge--low"}}function Y(e){return B(e)?"gov-presidential":"gov-democracy"}function Z(e){return B(e)?"Presidential":e.hos_election_method==="hereditary"?"Constitutional Monarchy":"Parliamentary"}const J=["Montequilla","Vostia"];function A(){const e=document.getElementById("nations-grid"),a=$.filter(t=>(t.continent||"Crucera")===q);if(a.length===0){e.innerHTML='<div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);text-align:center;padding:40px 0;grid-column:1/-1;">No nations in this continent yet.</div>';return}e.innerHTML=a.map(t=>{const i=t.nation_profiles,d=Array.isArray(i)?i[0]?.flag_url:i?.flag_url,r=H[t.name]||(d||"").trim()||(t.flag_url||"").trim()||"",v=Y(t),b=Z(t),g=V(t.id),f=(u[t.id]||[]).length,w=m===t.id,C=J.includes(t.name),h=n&&n.sector==="Shipping"&&C,N=t.population?t.population.toLocaleString():"—",_=t.control!=null?Math.round(t.control):"—",k=t.corporate_tax!=null?Math.round(t.corporate_tax)+"%":"—";return`
            <div class="nation-card${w?" selected":""}${h?" disabled":""}" data-id="${t.id}" onclick="${h?"":"selectNation('"+t.id+"')"}">
                ${h?'<span class="option-card__badge option-card__badge--soon" style="background:#d9534f;">Landlocked</span>':""}
                <div class="nation-card__header">
                    ${r?`<img class="nation-card__flag" src="${r}" alt="${y(t.name)}" onerror="this.style.display='none'">`:""}
                    <span class="nation-card__name">${y(t.name)}</span>
                    <span class="nation-card__gov ${v}">${b}</span>
                </div>
                <div class="nation-card__body">
                    ${D[t.name]?'<div class="nation-card__culture">'+y(D[t.name])+"</div>":""}
                    <div class="stat-row">
                        <span class="stat-row__label">Population</span>
                        <span class="stat-row__value">${N}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">Control</span>
                        <span class="stat-row__value">${_}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">Corporate Tax</span>
                        <span class="stat-row__value">${k}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-row__label">${y(n.sector)} Demand</span>
                        <span class="stat-row__value">
                            <span class="demand-badge ${g.cls}">${g.label}</span>
                            <span style="font-size:9px;color:var(--text-dim);margin-left:4px;">(${f} corp${f!==1?"s":""})</span>
                        </span>
                    </div>
                </div>
            </div>
        `}).join("")}function K(e){m=e,A(),Q()}function Q(){const e=document.getElementById("details-panel");e.classList.add("active"),e.innerHTML=`
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
                           maxlength="4" value="${l}" style="text-transform:uppercase;letter-spacing:0.15em;font-weight:600;"
                           oninput="onTickerInput(this.value)">
                    <div class="input-hint" id="ticker-hint">2-4 uppercase letters</div>
                </div>
            </div>
        </div>
    `,S()}function W(e){document.querySelectorAll("#details-panel .option-card").forEach(a=>a.classList.remove("selected")),e.classList.add("selected"),x=e.dataset.type,S()}function X(e){p=e.trim();const a=document.getElementById("corp-name-hint");p.length>0&&p.length<2?(a.textContent="Too short — minimum 2 characters",a.className="input-hint input-hint--error"):(a.textContent="2-40 characters",a.className="input-hint"),S()}function tt(e){const a=e.replace(/[^a-zA-Z]/g,"").toUpperCase().slice(0,4),t=document.getElementById("ticker-input");t.value!==a&&(t.value=a),l=a;const i=document.getElementById("ticker-hint");a.length>0&&a.length<2?(i.textContent="Too short — minimum 2 letters",i.className="input-hint input-hint--error"):(i.textContent="2-4 uppercase letters",i.className="input-hint"),S()}function S(){const e=document.getElementById("btn-confirm"),a=m&&x&&p.length>=2&&l.length>=2;e.disabled=!a,e.classList.toggle("ready",!!a)}function et(e){q=e,document.querySelectorAll(".continent-tab").forEach(a=>{a.classList.toggle("active",a.dataset.continent===e)}),A()}async function at(){if(!m||!c||!x||p.length<2||l.length<2)return;const e=document.getElementById("btn-confirm"),a=document.getElementById("error-message");e.disabled=!0,e.textContent="Creating...",a.textContent="";try{const t=$.find(o=>o.id===m),{data:i}=await s.from("factions").select("id, faction_name").eq("faction_type","corporation").eq("corp_ticker",l).is("abandoned_at",null).limit(1);if(i&&i.length>0){a.textContent=`Ticker "${l}" is already in use by ${i[0].faction_name}. Choose a different abbreviation.`,e.disabled=!1,e.textContent="Confirm ▶";return}const{data:d}=await s.from("factions").select("id, faction_type, faction_name").or(`id.eq.${c.id},linked_user_id.eq.${c.id}`).eq("nation_id",m).is("abandoned_at",null).maybeSingle();if(d){const o=d.faction_type==="party"?"political party":"corporation";a.textContent=`You already have a ${o} ("${d.faction_name}") in ${t.name}. One faction per nation.`,e.disabled=!1,e.textContent="Confirm ▶";return}const{data:r}=await s.from("shard").select("current_tick").eq("name","Alpha Shard").single(),v=r?.current_tick||0,{firstNames:b,lastNames:g}=O(t.name),f=b[Math.floor(Math.random()*b.length)],w=g[Math.floor(Math.random()*g.length)],C=40+Math.floor(Math.random()*36),h=(Number(t.currency_strength)||50)/50,N=n.sector==="Finance"?Math.max(.5,1-(Number(t.inflation)||0)/200):1;let _,k=0;if(n.sector==="Construction"){const o=Number(t.standard_of_living??50);_=Math.round(5e7*(.5+o/100)),k=Math.round(1e7*(.5+o/100))}else{const o=n.sector==="Finance"?225e6:n.sector==="Shipping"?8e7:36e6;_=Math.round(o*h*N)}const P=n.sector==="Construction"?{corp_assets:2,corp_market_share:1,corp_innovation:5,corp_reputation:5,corp_productivity:5,corp_employee_wages:5,corp_work_crews:3,corp_regulatory_standing:3,corp_supply_chain:3}:{},{data:T}=await s.from("factions").select("id, faction_type").eq("id",c.id).is("abandoned_at",null).maybeSingle(),I=T&&T.faction_type==="party",E=I?crypto.randomUUID():c.id,M={id:E,faction_type:"corporation",faction_name:p,nation_id:t.id,nation:t.name,abbreviation:l,seats:0,needs_rebuild:!1,party_color:"#5aafa5",party_logo:null,party_description:null,leader_first_name:f,leader_last_name:w,leader_age:C,founded_tick:v,action_points:0,corp_sector:n.sector,corp_company_type:x,corp_ticker:l,corp_cash_reserves:_,corp_debt:k,abandoned_at:null,custom_logo_url:null,...P};if(I){M.linked_user_id=c.id;const{error:o}=await s.from("factions").insert(M);if(o)throw o}else{const{error:o}=await s.from("factions").upsert(M);if(o)throw o}const F=I?E:c.id,z=U(F,f,w,C,t.name,v);await s.from("corp_executives").insert(z);const{data:L}=await s.from("executive_pool").select("id").eq("nation_id",t.id).limit(1);if(!L||L.length===0){const o=R(t.id,t.name);await s.from("executive_pool").insert(o)}sessionStorage.removeItem("pending_faction_type"),sessionStorage.removeItem("corp_setup"),window.location.href="corp-dashboard.html"}catch(t){console.error("Corporation creation failed:",t),a.textContent=t.message||"Failed to create corporation. Please try again.",e.disabled=!1,e.textContent="Confirm ▶",e.classList.add("ready")}}function nt(){window.location.href="corp-setup.html"}window.selectNation=K;window.switchContinent=et;window.confirmNation=at;window.goBack=nt;window.selectCompanyType=W;window.onCorpNameInput=X;window.onTickerInput=tt;G();
