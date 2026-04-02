import{_ as u}from"./supabase-client-BXEzLDpS.js";let a=1;const m=2,s={sector:null,subsector:null},p={1:{label:"Step 1 of 2",title:"Select Your Sector",subtitle:"Choose the industry your corporation will operate in. This determines your contracts, revenue, and growth path."},2:{label:"Step 2 of 2",title:"Select Your Subsector",subtitle:"Pick a specialization within your sector. This sets your starting contracts and equipment."}},d=[{key:"construction",name:"Construction",desc:"Build the infrastructure that powers nations. From roads and schools to megaprojects — construction corporations bid on government contracts and shape the physical landscape.",available:!0},{key:"energy",name:"Energy",desc:"Power the nation through oil, gas, renewables, and nuclear. Control the energy grid and fuel economic growth.",available:!1},{key:"finance",name:"Finance",desc:"Banks, investment firms, and insurance. Control the flow of capital and shape monetary policy.",available:!1},{key:"defense",name:"Defense",desc:"Arms manufacturing, military technology, and security contracting. Profit from national defense.",available:!1}];function f(){const t=document.getElementById("step-1");t.innerHTML=`
        <div class="section-block">
            <div class="section-header">
                <div class="section-dot" style="background:var(--teal)"></div>
                <span class="section-label">Select a Sector</span>
            </div>
            <div class="section-body">
                ${d.map(e=>`
                    <div class="option-card${e.available?"":" disabled"}${s.sector===e.name?" selected":""}"
                         data-sector="${e.key}" data-name="${e.name}"
                         onclick="${e.available?"selectSector(this)":""}">
                        ${e.available?"":'<span class="option-card__badge option-card__badge--soon">Coming Soon</span>'}
                        <div class="option-card__name">${e.name}</div>
                        <div class="option-card__desc">${e.desc}</div>
                    </div>
                `).join("")}
            </div>
        </div>
    `}function g(t){const e=s.sector;document.querySelectorAll("#step-1 .option-card").forEach(o=>o.classList.remove("selected")),t.classList.add("selected"),s.sector=t.dataset.name,e!==s.sector&&(s.subsector=null),c(),i()}const y={construction:[{key:"civil_construction",name:"Civil Construction",desc:"Civil engineering covers the design, construction, and maintenance of the physical and naturally built environment, including public works such as roads, bridges, canals, dams, tunnels, airports, water and sewerage systems, pipelines, and railways."},{key:"industrial_construction",name:"Industrial Construction",desc:"Industrial construction includes offshore construction (mainly of energy installations: oil and gas platforms, wind power), mining and quarrying, refineries, food processing plants, breweries and distilleries, power stations, steel mills, warehouses and factories."},{key:"megaprojects",name:"Megaprojects",desc:"Nation-defining projects: international airports, hydroelectric dams, national rail networks. Very long timelines (20-40+ ticks), enormous capital requirements, massive payoff on success and devastating loss on failure."}]};function v(){const t=d.find(n=>n.name===s.sector)?.key,e=y[t]||[],o=document.getElementById("step-2");o.innerHTML=`
        <div class="section-block">
            <div class="section-header">
                <div class="section-dot" style="background:var(--teal)"></div>
                <span class="section-label">Select a Subsector</span>
            </div>
            <div class="section-body">
                ${e.map(n=>`
                    <div class="option-card${s.subsector===n.name?" selected":""}"
                         data-subsector="${n.key}" data-name="${n.name}"
                         onclick="selectSubsector(this)">
                        <div class="option-card__name">${n.name}</div>
                        <div class="option-card__desc">${n.desc}</div>
                    </div>
                `).join("")}
            </div>
        </div>
    `}function b(t){const e=document.querySelectorAll("#step-2 .option-card"),o=t.dataset.name;t.classList.contains("selected")?(t.classList.remove("selected"),s.subsector=null,e.forEach(n=>n.classList.remove("disabled"))):(e.forEach(n=>{n.classList.remove("selected","disabled")}),t.classList.add("selected"),s.subsector=o,e.forEach(n=>{n!==t&&n.classList.add("disabled")})),c(),i()}async function h(){const{data:{user:t}}=await u.auth.getUser();if(!t){window.location.href="login.html";return}if(sessionStorage.getItem("pending_faction_type")!=="corp"){window.location.href="select-nation.html";return}document.getElementById("loading").style.display="none";const o=document.getElementById("page-content");o.style.display="flex",l(1)}function l(t){a=t;const e=p[t];document.getElementById("step-label").textContent=e.label,document.getElementById("step-title").textContent=e.title,document.getElementById("step-subtitle").textContent=e.subtitle,document.querySelectorAll(".step-pip").forEach(n=>{const r=parseInt(n.dataset.step);n.className="step-pip",r<t?n.classList.add("done"):r===t&&n.classList.add("active")}),document.querySelectorAll(".step-section").forEach(n=>n.classList.remove("active"));const o=document.getElementById("step-"+t);o&&o.classList.add("active"),t===1?f():t===2&&v(),c(),i(),document.getElementById("error-message").textContent=""}function c(){const t=document.getElementById("sel-tags"),e=[];s.sector&&e.push(s.sector),s.subsector&&e.push(s.subsector),e.length===0?t.innerHTML='<span class="sel-placeholder">Choose a sector to begin</span>':t.innerHTML=e.map(o=>`<span class="sel-tag">${o}</span>`).join("")}function i(){const t=document.getElementById("btn-next");let e=!1;a===1?e=!!s.sector:a===2&&(e=!!s.subsector),t.disabled=!e,t.classList.toggle("ready",e),t.textContent="Next ▶"}function w(){a<m?l(a+1):(sessionStorage.setItem("corp_setup",JSON.stringify(s)),window.location.href="corp-nation-select.html")}function S(){a>1?l(a-1):window.location.href="select-nation.html"}window.goNext=w;window.goBack=S;window.selectSector=g;window.selectSubsector=b;window.corpState=s;window.updateButtons=i;window.updateSelectionBar=c;h();
