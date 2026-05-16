import{_supabase as b}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{renderCorpTopBar as Ia}from"./corp-topbar-ClQJCe3f.js";import{m as La}from"./loan-pressing-issues-CcJntQcw.js";import"./preload-helper-BXl3LOEh.js";import"./factions-1eoRseVF.js";import"./utils-oN1e812_.js";function f(a){if(a==null)return"";const e=document.createElement("div");return e.textContent=String(a),e.innerHTML}function ua(a){return f(a).replace(/"/g,"&quot;")}function pa(a){const e=Number(a)||0;return e>=1e9?"$"+(e/1e9).toFixed(2)+"B":e>=1e6?"$"+(e/1e6).toFixed(1)+"M":e>=1e3?"$"+(e/1e3).toFixed(1)+"k":"$"+Math.round(e)}function ka(a){const e=Number(a)||0;return e>=7?"good":e>=4?"mid":"warn"}const Na=[{key:"capacity",column:"corp_production_capacity",eyebrow:"CAPACITY",name:"Production",emName:"Capacity",tooltip:"Your corporation's ability to produce aircraft. A high production capacity allows you to build more aircraft, faster.",blurb:{good:"<strong>Multiple lines running at full tempo.</strong> Output ahead of demand; cycle time tight.",mid:"<strong>Adequate output.</strong> Lines running at workable pace, room to scale before next backlog window.",warn:"<strong>Bottlenecked.</strong> Orders backing up; cycle time stretching as a single line absorbs everything."},impacts:{good:[{label:"Aircraft / Year",value:"6+",tone:"good"},{label:"Lead Time",value:"−20%",tone:"good"}],mid:[{label:"Aircraft / Year",value:"3"},{label:"Lead Time",value:"Average"}],warn:[{label:"Aircraft / Year",value:"1",tone:"warn"},{label:"Lead Time",value:"+30%",tone:"warn"}]}},{key:"quality",column:"corp_quality_control",eyebrow:"STANDING",name:"Quality",emName:"Control",tooltip:"Your standing with aviation safety regulators, airworthiness authorities, and international certification bodies (FAA / EASA / ICAO equivalents). High Quality Control means aircraft are trusted, approved for sale in major markets, and can fly anywhere. Low Quality Control means groundings, blocked sales, recalls, and the nightmare scenario every aviation manufacturer fears: a fatal crash traced back to a design flaw your firm signed off on.",blurb:{good:"<strong>Trusted by global cert bodies.</strong> Aircraft approved everywhere; recalls rare; major markets open.",mid:"<strong>Average regulator standing.</strong> Approval at standard pace; the occasional review but no scandals.",warn:"<strong>Groundings active.</strong> Recalls pending; major markets restricted; design flaws under investigation."},impacts:{good:[{label:"Cert Speed",value:"+25%",tone:"good"},{label:"Recall Risk",value:"Low",tone:"good"}],mid:[{label:"Cert Speed",value:"Average"},{label:"Recall Risk",value:"Standard"}],warn:[{label:"Cert Speed",value:"−30%",tone:"warn"},{label:"Recall Risk",value:"High",tone:"warn"}]}},{key:"innovation",column:"corp_innovation",eyebrow:"DESIGN",name:"Design",emName:"Throughput",tooltip:"Your firm's design throughput. Higher Innovation accelerates Research & Development, unlocks more advanced airframe blueprints, and lets you push the engineering envelope (longer-range, more efficient, novel-class aircraft). Low Innovation traps you in derivative designs that compete on price alone.",blurb:{good:"<strong>Cutting edge.</strong> R&D pipeline producing next-generation airframes; competitors chasing your tier.",mid:"<strong>Adequate design throughput.</strong> Working on improvements; occasionally novel; market-fit refinements landing.",warn:"<strong>Stagnating R&D.</strong> Competitors are pulling ahead; designs increasingly derivative."},impacts:{good:[{label:"R&D Speed",value:"+30%",tone:"good"},{label:"Tier Cap",value:"Advanced",tone:"good"}],mid:[{label:"R&D Speed",value:"Average"},{label:"Tier Cap",value:"Standard"}],warn:[{label:"R&D Speed",value:"−25%",tone:"warn"},{label:"Tier Cap",value:"Basic",tone:"warn"}]}}];let h=null;function Ta(){const a=document.getElementById("co-hero-stats");a&&(a.innerHTML=Na.map(Pa).join(""))}function Pa(a){const e=Number(h[a.column])||0,t=ka(e),s=Number.isInteger(e)?String(e):e.toFixed(1),n='<div class="co-hero-stat-trend">— Latest</div>',o=Ma(e,t),r=a.blurb[t]||"",d=(a.impacts[t]||[]).map(i=>`<div>
            <span class="label">${f(i.label)}</span>
            <span class="value ${i.tone||""}">${f(i.value)}</span>
        </div>`).join(""),m=a.tooltip?`<span class="co-hero-tip" data-tip="${ua(a.tooltip)}" aria-label="What is ${ua(a.name+" "+(a.emName||""))}?">?</span>`:"";return`<div class="co-hero-stat" data-stat="${a.key}">
        <div class="co-hero-stat-eyebrow">${f(a.eyebrow)}</div>
        <div class="co-hero-stat-name">${f(a.name)} <em>${f(a.emName)}</em>${m}</div>
        <div class="co-hero-stat-value-row">
            <div class="co-hero-stat-value">${f(s)}<span class="co-max">/10</span></div>
            ${n}
        </div>
        ${o}
        <div class="co-hero-stat-desc">${r}</div>
        <div class="co-hero-stat-impact">${d}</div>
    </div>`}function Ma(a,e){const t=Math.max(0,Math.min(10,Math.round(Number(a)||0))),s=e==="good"?"filled good":e==="warn"?"filled warn":"filled",n=[];for(let o=0;o<10;o++)n.push(`<div class="co-hero-meter-cell${o<t?" "+s:""}"></div>`);return`<div class="co-hero-meter">${n.join("")}</div>`}const Ra={light_assembly_plant:"Light Assembly Plant",engine_assembly_plant:"Engine Assembly Plant",aircraft_assembly_facility:"Aircraft Assembly Facility",heavy_manufacturing_plant:"Heavy Manufacturing Plant"};async function Da(a){const e=document.getElementById("co-facilities-list");if(!e)return;const{data:t,error:s}=await b.from("corp_properties").select("id, name, type, city, purchase_price, monthly_maintenance, condition, purchased_at_tick").eq("faction_id",a).eq("is_active",!0).neq("type","national_hq").order("purchased_at_tick",{ascending:!0});if(s){console.warn("[aviation-ops] facilities fetch failed:",s.message),e.innerHTML='<div class="co-contract-empty">Could not load facilities.</div>';return}if(!t||t.length===0){e.innerHTML='<div class="co-contract-empty">No industrial facilities yet. Build one from the Expansion tab.</div>';return}e.innerHTML=t.map(n=>{const o=Ra[n.type]||n.name||n.type,r=pa(n.purchase_price),u=pa(n.monthly_maintenance),d=Math.round(Number(n.condition)||0),m=n.city?f(n.city):"—";return`<div class="co-asset-row">
            <div>
                <div class="co-asset-name">${f(o)}</div>
                <div class="co-asset-meta">${m} · ${d}% condition · ${u}/mo maint</div>
            </div>
            <div class="co-asset-value">${r}</div>
        </div>`}).join("")}function Ba(a){const e=document.getElementById("co-layout");e.innerHTML=`
        <!-- PAGE HEADER -->
        <div class="co-page-header">
            <h1 class="co-page-title">Operations<em>.</em></h1>
            <div class="co-page-stats">
                <div>
                    <div class="co-page-stat-label">Active Orders</div>
                    <div class="co-page-stat-value">${a}</div>
                </div>
            </div>
        </div>

        <!-- I. STRATEGIC POSITION -->
        <div class="co-section">
            <div class="co-section-header">
                <h2><span class="num">I.</span>Strategic Position</h2>
                <span class="desc">Industry-Specific Indicators ◊ Scored 0—10</span>
            </div>
            <div class="co-hero-stats" id="co-hero-stats"></div>
        </div>

        <!-- II. PRESSING ISSUES -->
        <div class="co-section">
            <div class="co-section-header">
                <h2><span class="num">II.</span>Pressing Issues</h2>
                <span class="desc">Time-Sensitive ◊ Decide Before Tick Resolves</span>
            </div>
            <!-- Owned by js/loan-pressing-issues.js — renders one card per
                 open loan negotiation where this corp is the borrower.
                 Empty state ('No pressing issues right now') comes from the
                 module itself; no static fallback needed. -->
            <div id="co-loan-pressing"></div>
        </div>

        <!-- III. AIRCRAFT RFPs (open marketplace from airlines) -->
        <div class="co-section">
            <div class="co-section-header">
                <h2><span class="num">III.</span>Aircraft RFPs</h2>
                <span class="desc">Airline Purchase Requests</span>
            </div>
            <div class="co-contract-list" id="co-rfps-list">
                <div class="co-contract-empty">Loading…</div>
            </div>
        </div>

        <!-- IV + V — DESIGNS / R&D -->
        <div class="co-contracts-grid">
            <div>
                <div class="co-section-header">
                    <h2><span class="num">IV.</span>Current Designs</h2>
                    <span class="desc">Aircraft You Can Sell</span>
                </div>
                <div class="co-contract-list" id="co-designs-list">
                    <div class="co-contract-empty">No designs yet. Run R&amp;D to develop your first airframe.</div>
                </div>
                <div class="co-panel-actions">
                    <button type="button" class="co-panel-action-btn" data-am-action="design-engine">+ Design Engine</button>
                    <button type="button" class="co-panel-action-btn" data-am-action="design-aircraft">+ Design Aircraft</button>
                </div>
            </div>
            <div>
                <div class="co-section-header">
                    <h2><span class="num">V.</span>Research &amp; Development</h2>
                    <span class="desc">Active Design Programs</span>
                </div>
                <div class="co-contract-list" id="co-rnd-list">
                    <div class="co-contract-empty">No active R&amp;D. Allocate resources to begin developing a new design.</div>
                </div>
                <div class="co-panel-actions">
                    <button type="button" class="co-panel-action-btn" data-am-action="new-research">+ New Research</button>
                </div>
            </div>
        </div>

        <!-- VI. ORDERS -->
        <div class="co-section">
            <div class="co-section-header">
                <h2><span class="num">VI.</span>Orders</h2>
                <span class="desc">Aircraft Commissions From Airlines</span>
            </div>
            <div class="co-contract-empty">No orders yet. Once your designs are certified, airlines can commission aircraft from your firm.</div>
            <div class="co-panel-actions">
                <button type="button" class="co-panel-action-btn" data-am-action="fulfill-order">+ Fulfill Order</button>
                <button type="button" class="co-panel-action-btn" data-am-action="request-order">+ Request Order</button>
            </div>
        </div>

        <!-- VII. INDUSTRIAL FACILITIES -->
        <div class="co-section">
            <div class="co-section-header">
                <h2><span class="num">VII.</span>Industrial Facilities</h2>
                <span class="desc">Production Capacity Assets</span>
            </div>
            <div class="co-contract-list" id="co-facilities-list">
                <div class="co-contract-empty">Loading…</div>
            </div>
            <div class="co-panel-actions">
                <button type="button" class="co-panel-action-btn" data-am-action="production-queue">+ Production Queue</button>
            </div>
        </div>

        <!-- VIII. ACTIVE PRODUCTION -->
        <div class="co-section">
            <div class="co-section-header">
                <h2><span class="num">VIII.</span>Active Production</h2>
                <span class="desc">Runs In Progress</span>
            </div>
            <div class="co-contract-list" id="co-production-list">
                <div class="co-contract-empty">No active production runs. Click + Production Queue to start one.</div>
            </div>
        </div>

        <!-- FOOTER -->
        <div class="co-footer-strip">
            <div>Operations updated <em id="co-footer-date">—</em></div>
            <div><a href="corp-dashboard.html" style="color:inherit;text-decoration:none;border:1px solid var(--co-line-bright);padding:8px 14px;letter-spacing:0.08em;">← Dashboard</a></div>
        </div>
    `}const Fa={"new-research":"New research program","fulfill-order":"Order fulfillment","request-order":"New order request"},aa={combustion:{"single-stage":{name:"Single-Stage Compressor",thrust:2,weight:.5,eff:30,rel:0,cost:15e5},"twin-spool":{name:"Twin-Spool Configuration",thrust:3,weight:.8,eff:40,rel:0,cost:25e5},"high-pressure":{name:"High-Pressure Core",thrust:4,weight:1.2,eff:25,rel:-5,cost:4e6}},frame:{"steel-casting":{name:"Steel Casting",thrust:0,weight:1.5,eff:0,rel:20,cost:1e6},"aluminum-alloy":{name:"Aluminum Alloy Frame",thrust:0,weight:.8,eff:5,rel:15,cost:18e5},"magnesium-composite":{name:"Magnesium Composite",thrust:.5,weight:.4,eff:10,rel:10,cost:3e6}},control:{"mechanical-governor":{name:"Mechanical Governor",thrust:0,weight:.2,eff:10,rel:25,cost:8e5},"hydraulic-control":{name:"Hydraulic Control Unit",thrust:.5,weight:.4,eff:20,rel:30,cost:15e5},"early-electronic":{name:"Early Electronic Controls",thrust:1,weight:.3,eff:30,rel:35,cost:25e5}}},Ha=1e6;let qa=!1,wa=!1,I=null,v=null,Q=[],E=null;async function Ua(){if(E)return E;const{data:a,error:e}=await b.rpc("aircraft_design_specs");return e?(console.warn("[aviation-ops] aircraft_design_specs fetch failed:",e.message),E={airframes:{},mechanicals:{},offerings:{}},E):(E={airframes:a?.airframes||{},mechanicals:a?.mechanicals||{},offerings:a?.offerings||{}},E)}function y(a){const e=Number(a)||0;return e>=1e6?"$"+(e/1e6).toFixed(1).replace(/\.0$/,"")+"M":e>=1e3?"$"+(e/1e3).toFixed(0)+"k":"$"+Math.round(e)}function Oa(){document.querySelectorAll("[data-am-action]").forEach(a=>{a.addEventListener("click",()=>{const e=a.getAttribute("data-am-action");if(e==="design-engine"){if(!qa)return;Va();return}if(e==="design-aircraft"){if(!wa)return;Ga();return}if(e==="production-queue"){ie();return}const t=Fa[e]||"This action";alert(t+" will be available when Aviation Manufacturing Phase F mechanics ship.")})})}function va(a){qa=!!a;const e=document.querySelector('[data-am-action="design-engine"]');if(e){if(a){e.disabled=!1,e.classList.remove("disabled"),e.textContent="+ Design Engine";const t=document.getElementById("co-design-engine-gate");t&&t.remove()}else if(e.disabled=!0,e.classList.add("disabled"),e.textContent="+ Design Engine",!document.getElementById("co-design-engine-gate")){const t=document.createElement("div");t.id="co-design-engine-gate",t.className="am-modal-gate-note",t.style.flexBasis="100%",t.style.order="-1",t.textContent="Engine Assembly Plant Required for Engine Design",e.parentElement.insertBefore(t,e.parentElement.firstChild),e.parentElement.style.flexWrap="wrap"}}}function ja(a,e,t,s){const n=r=>r>0?"positive":r<0?"negative":"zero",o=r=>(r>0?"+":"")+(Number.isInteger(r)?r:r.toFixed(1));return`
        <div class="am-module-card${s?" selected":""}" data-module="${a}" data-id="${e}">
            <div class="am-module-card-header">
                <div class="am-module-name-block">
                    <div class="am-module-radio"></div>
                    <div class="am-module-name">${f(t.name)}</div>
                </div>
                <span class="am-module-tier-tag">TIER 1</span>
            </div>
            <div class="am-module-stats-row">
                <div class="am-module-stat"><div class="am-module-stat-label">Thrust</div><div class="am-module-stat-value ${n(t.thrust)}">${t.thrust===0?"0":o(t.thrust)}</div></div>
                <div class="am-module-stat"><div class="am-module-stat-label">Weight</div><div class="am-module-stat-value weight">+${t.weight}</div></div>
                <div class="am-module-stat"><div class="am-module-stat-label">Eff</div><div class="am-module-stat-value ${n(t.eff)}">${t.eff===0?"0":o(t.eff)}</div></div>
                <div class="am-module-stat"><div class="am-module-stat-label">Rel</div><div class="am-module-stat-value ${n(t.rel)}">${t.rel===0?"0":o(t.rel)}</div></div>
            </div>
            <div class="am-module-cost"><strong>${y(t.cost)}</strong> per unit</div>
        </div>`}function Va(){let a=document.getElementById("am-design-engine-modal");if(!a){const s=(h.abbreviation||h.faction_name||"AM").slice(0,6),n=Math.round(Number(h.corp_innovation)||0),o=(r,u,d,m,i)=>{const l=aa[m],$=Object.entries(l).map(([x,q])=>ja(m,x,q,x===i)).join("");return`
                <div class="am-form-section">
                    <div class="am-form-section-header">
                        <h3><span class="num">${r}.</span>${u}</h3>
                        <span class="meta">${d}</span>
                    </div>
                    <div class="am-module-grid">${$}</div>
                </div>`};a=document.createElement("div"),a.id="am-design-engine-modal",a.className="am-modal-overlay",a.innerHTML=`
            <div class="am-modal">
                <div class="am-modal-header">
                    <div>
                        <div class="am-modal-eyebrow">— Engine Assembly Plant ◊ New Engine Design —</div>
                        <h2 class="am-modal-title">Design <em>Engine</em></h2>
                        <div class="am-modal-subtitle">Designing for: <strong>${f(s)}</strong> ${f(h.faction_name||"")} ◊ Innovation: ${n}/10 ◊ Tier 1 Modules Available</div>
                    </div>
                    <button type="button" class="am-modal-close" aria-label="Close">×</button>
                </div>
                <div class="am-modal-body">
                    <div class="am-form-section">
                        <div class="am-form-section-header">
                            <h3><span class="num">I.</span>Identity</h3>
                            <span class="meta">Name Your Engine</span>
                        </div>
                        <div class="am-identity-block">
                            <div class="am-identity-label">Engine Name</div>
                            <input type="text" class="am-identity-input" id="am-engine-name" maxlength="60" placeholder="e.g., Hjalmar-1" />
                        </div>
                    </div>
                    ${o("II","Combustion Core","Choose 1 ◊ Primary Driver of Thrust","combustion","single-stage")}
                    ${o("III","Frame &amp; Materials","Choose 1 ◊ Determines Weight &amp; Durability","frame","steel-casting")}
                    ${o("IV","Control Systems","Choose 1 ◊ Drives Reliability &amp; Efficiency","control","mechanical-governor")}

                    <div class="am-form-section">
                        <div class="am-form-section-header">
                            <h3><span class="num">V.</span>Engine Summary</h3>
                            <span class="meta">Live Preview ◊ Final Stats &amp; Costs</span>
                        </div>
                        <div class="am-summary">
                            <div class="am-summary-header-line">— Final Engine Specifications —</div>
                            <div class="am-summary-name-row">
                                <div class="am-summary-name" id="am-summary-name">—</div>
                            </div>
                            <div class="am-summary-tier-line" id="am-summary-modules"></div>
                            <div class="am-summary-stats-grid">
                                <div class="am-summary-stat-card">
                                    <div class="am-summary-stat-card-label">Thrust</div>
                                    <div class="am-summary-stat-card-value"><span id="am-stat-thrust">—</span><span class="max">/10</span></div>
                                    <div class="am-summary-stat-card-bar"><div class="am-summary-stat-card-bar-fill" id="am-bar-thrust"></div></div>
                                </div>
                                <div class="am-summary-stat-card">
                                    <div class="am-summary-stat-card-label">Weight</div>
                                    <div class="am-summary-stat-card-value weight-stat"><span id="am-stat-weight">—</span><span class="max">/10</span></div>
                                    <div class="am-summary-stat-card-bar"><div class="am-summary-stat-card-bar-fill weight-bar" id="am-bar-weight"></div></div>
                                </div>
                                <div class="am-summary-stat-card">
                                    <div class="am-summary-stat-card-label">Efficiency</div>
                                    <div class="am-summary-stat-card-value"><span id="am-stat-eff">—</span><span class="max">/100</span></div>
                                    <div class="am-summary-stat-card-bar"><div class="am-summary-stat-card-bar-fill" id="am-bar-eff"></div></div>
                                </div>
                                <div class="am-summary-stat-card">
                                    <div class="am-summary-stat-card-label">Reliability</div>
                                    <div class="am-summary-stat-card-value"><span id="am-stat-rel">—</span><span class="max">/100</span></div>
                                    <div class="am-summary-stat-card-bar"><div class="am-summary-stat-card-bar-fill" id="am-bar-rel"></div></div>
                                </div>
                            </div>
                            <div class="am-quality-row">
                                <div class="am-quality-name">
                                    <em>Quality</em> <span style="color:var(--co-text-tertiary); font-style:normal;">— Average of 4 Stats</span>
                                    <span class="desc">Quality rewards balanced engineering. Min-maxing one stat lowers overall quality.</span>
                                </div>
                                <div class="am-quality-value">
                                    <span id="am-quality-value">—</span>
                                    <span class="max-num">/10</span>
                                </div>
                            </div>
                            <div class="am-summary-breakdown">
                                <div>
                                    <div class="am-breakdown-title">Cost Breakdown</div>
                                    <div class="am-breakdown-line"><span class="label">Combustion</span><span class="value" id="am-cost-combustion">—</span></div>
                                    <div class="am-breakdown-line"><span class="label">Frame</span><span class="value" id="am-cost-frame">—</span></div>
                                    <div class="am-breakdown-line"><span class="label">Control</span><span class="value" id="am-cost-control">—</span></div>
                                    <div class="am-breakdown-line"><span class="label">Base Assembly</span><span class="value">$1M</span></div>
                                    <div class="am-breakdown-line total"><span class="label">Cost per Engine Unit</span><span class="value" id="am-cost-total">—</span></div>
                                </div>
                                <div>
                                    <div class="am-breakdown-title">Research</div>
                                    <div class="am-breakdown-line"><span class="label">Research Time</span><span class="value">8—13 ticks</span></div>
                                    <div class="am-breakdown-line"><span class="label">Cost per Tick</span><span class="value">$1M</span></div>
                                    <div class="am-breakdown-line"><span class="label">Research Investment</span><span class="value">$8—$13M</span></div>
                                    <div class="am-breakdown-line total"><span class="label">Begin Research</span><span class="value">7 + 1d6 ticks</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="am-modal-error" id="am-modal-error"></div>
                <div class="am-modal-footer">
                    <div class="am-modal-footer-summary">
                        <div class="am-modal-footer-item">
                            <span class="am-modal-footer-label">Cost / Unit</span>
                            <span class="am-modal-footer-value" id="am-footer-cost">—</span>
                        </div>
                        <div class="am-modal-footer-item">
                            <span class="am-modal-footer-label">Quality</span>
                            <span class="am-modal-footer-value" id="am-footer-quality">—</span>
                        </div>
                    </div>
                    <div class="am-modal-footer-actions">
                        <button type="button" class="am-modal-btn" id="am-modal-cancel">Cancel</button>
                        <button type="button" class="am-modal-btn primary" id="am-modal-submit">Begin Research ▸</button>
                    </div>
                </div>
            </div>`,document.body.appendChild(a),a.querySelector(".am-modal-close").addEventListener("click",ea),a.querySelector("#am-modal-cancel").addEventListener("click",ea),a.addEventListener("click",r=>{r.target===a&&ea()}),a.querySelector("#am-engine-name").addEventListener("input",()=>{I.name=a.querySelector("#am-engine-name").value||"",oa()}),a.querySelectorAll(".am-module-card").forEach(r=>{r.addEventListener("click",()=>{const u=r.dataset.module,d=r.dataset.id;a.querySelectorAll(`.am-module-card[data-module="${u}"]`).forEach(m=>m.classList.remove("selected")),r.classList.add("selected"),I[u]=d,oa()})}),a.querySelector("#am-modal-submit").addEventListener("click",Qa)}const e=document.querySelectorAll("#co-designs-list .am-design-card, #co-rnd-list .am-design-card").length;I={name:`${(h.abbreviation||h.faction_name||"AM").slice(0,6)}-${e+1}`,combustion:"single-stage",frame:"steel-casting",control:"mechanical-governor"},a.querySelector("#am-engine-name").value=I.name,a.querySelectorAll(".am-module-card").forEach(s=>s.classList.remove("selected")),a.querySelector('.am-module-card[data-module="combustion"][data-id="single-stage"]').classList.add("selected"),a.querySelector('.am-module-card[data-module="frame"][data-id="steel-casting"]').classList.add("selected"),a.querySelector('.am-module-card[data-module="control"][data-id="mechanical-governor"]').classList.add("selected"),a.querySelector("#am-modal-error").classList.remove("show"),a.querySelector("#am-modal-submit").disabled=!1,a.querySelector("#am-modal-submit").textContent="Begin Research ▸",a.classList.add("open"),document.body.style.overflow="hidden",oa()}function ea(){const a=document.getElementById("am-design-engine-modal");a&&a.classList.remove("open"),document.body.style.overflow=""}function oa(){if(!I)return;const a=aa.combustion[I.combustion],e=aa.frame[I.frame],t=aa.control[I.control],s=+(a.thrust+e.thrust+t.thrust).toFixed(2),n=+(a.weight+e.weight+t.weight).toFixed(2),o=Math.min(100,Math.max(0,a.eff+e.eff+t.eff)),r=Math.min(100,Math.max(0,a.rel+e.rel+t.rel)),u=+((Math.min(100,s*10)+Math.max(0,(10-n)*10)+o+r)/4/10).toFixed(1),d=a.cost+e.cost+t.cost+Ha,m=i=>document.getElementById(i);m("am-summary-name").textContent=I.name||"Untitled Engine",m("am-summary-modules").textContent=`${a.name.toUpperCase()} ◊ ${e.name.toUpperCase()} ◊ ${t.name.toUpperCase()}`,m("am-stat-thrust").textContent=s.toFixed(1),m("am-stat-weight").textContent=n.toFixed(1),m("am-stat-eff").textContent=o,m("am-stat-rel").textContent=r,m("am-bar-thrust").style.width=Math.min(100,s*10)+"%",m("am-bar-weight").style.width=Math.min(100,n*10)+"%",m("am-bar-eff").style.width=o+"%",m("am-bar-rel").style.width=r+"%",m("am-quality-value").textContent=u.toFixed(1),m("am-cost-combustion").textContent=y(a.cost),m("am-cost-frame").textContent=y(e.cost),m("am-cost-control").textContent=y(t.cost),m("am-cost-total").textContent=y(d),m("am-footer-cost").textContent=y(d),m("am-footer-quality").textContent=u.toFixed(1)}async function Qa(){if(!I)return;const a=document.getElementById("am-design-engine-modal"),e=a.querySelector("#am-modal-submit"),t=a.querySelector("#am-modal-error"),s=(a.querySelector("#am-engine-name").value||"").trim();if(!s){t.textContent="Engine name required.",t.classList.add("show");return}e.disabled=!0,e.textContent="Submitting…",t.classList.remove("show");try{const{data:n,error:o}=await b.rpc("start_engine_design_research",{p_corp_id:h.id,p_name:s,p_combustion:I.combustion,p_frame:I.frame,p_control:I.control});if(o){t.textContent=o.message,t.classList.add("show"),e.disabled=!1,e.textContent="Begin Research ▸";return}if(!n?.success){t.textContent=n?.error||"Could not start research.",t.classList.add("show"),e.disabled=!1,e.textContent="Begin Research ▸";return}ea(),await W(h.id)}catch(n){t.textContent=n?.message||"Unknown error.",t.classList.add("show"),e.disabled=!1,e.textContent="Begin Research ▸"}}function fa(a){wa=!!a;const e=document.querySelector('[data-am-action="design-aircraft"]');if(e){if(a){e.disabled=!1,e.classList.remove("disabled"),e.textContent="+ Design Aircraft";const t=document.getElementById("co-design-aircraft-gate");t&&t.remove()}else if(e.disabled=!0,e.classList.add("disabled"),e.textContent="+ Design Aircraft",!document.getElementById("co-design-aircraft-gate")){const t=document.createElement("div");t.id="co-design-aircraft-gate",t.className="am-modal-gate-note",t.style.flexBasis="100%",t.style.order="-1",t.textContent="Light Assembly Plant, Aircraft Assembly Facility, or Heavy Manufacturing Plant Required for Aircraft Design",e.parentElement.insertBefore(t,e.parentElement.firstChild),e.parentElement.style.flexWrap="wrap"}}}async function Ca(){const{data:a,error:e}=await b.from("corp_aircraft_designs").select("id, name, thrust, weight, efficiency, reliability, quality, cost_per_unit, factions:corp_id(faction_name, abbreviation)").eq("design_type","engine").eq("status","available").eq("is_active",!0).order("quality",{ascending:!1});if(e){console.warn("[aviation-ops] engine catalog fetch failed:",e.message);return}Q=(a||[]).map(t=>({id:t.id,name:t.name,thrust:Number(t.thrust)||0,weight:Number(t.weight)||0,efficiency:Number(t.efficiency)||0,reliability:Number(t.reliability)||0,quality:Number(t.quality)||0,costPerUnit:Number(t.cost_per_unit)||0,corpAbbr:t.factions?.abbreviation||"",corpName:t.factions?.faction_name||""}))}function ga(){return Q.map(a=>`<option value="${a.id}">${f(a.name)}${a.corpAbbr?" · "+f(a.corpAbbr):""} ◊ Quality ${a.quality.toFixed(1)}</option>`).join("")}function ya(){const a=Q.length;return`${a} Engine Design${a===1?"":"s"} Available`}function Ya(a,e,t){const s=e.eng_min===e.eng_max?String(e.eng_min):`${e.eng_min} or ${e.eng_max}`;return`<div class="am-airframe-card${t?" selected":""}" data-airframe="${a}">
        <div class="am-airframe-head">
            <div class="am-airframe-radio"></div>
            <div class="am-airframe-name">${e.name}</div>
        </div>
        <div class="am-airframe-stats">
            <div class="am-airframe-stat-row"><span class="label">Weight</span><span class="value weight">${e.weight}</span></div>
            <div class="am-airframe-stat-row"><span class="label">Passengers</span><span class="value">${e.pax}</span></div>
            <div class="am-airframe-stat-row"><span class="label">Engines</span><span class="value">${s}</span></div>
            <div class="am-airframe-stat-row"><span class="label">Range @ 1:1</span><span class="value">${e.range}</span></div>
        </div>
        <div class="am-airframe-cost">${y(e.cost)}<span class="small">Base Cost ◊ ${e.time} Ticks</span></div>
    </div>`}function ba(a,e,t,s){const n=[];return t.safety&&n.push(`<span class="am-stat-chip safety">+${t.safety} Safety</span>`),t.demand&&t.demand>0&&n.push(`<span class="am-stat-chip demand">+${t.demand} Demand</span>`),t.demand&&t.demand<0&&n.push(`<span class="am-stat-chip demand-neg">${t.demand} Demand</span>`),t.pax&&n.push(`<span class="am-stat-chip passengers">+${t.pax} Pax</span>`),n.push(`<span class="am-stat-chip weight">+${t.weight} Weight</span>`),n.push(`<span class="am-stat-chip cost">${y(t.cost)}</span>`),`<div class="am-module-card" data-group="${a}" data-id="${e}">
        <div class="am-module-card-header">
            <div class="am-module-checkbox"></div>
            <div class="am-module-name">${f(t.name)}</div>
        </div>
        <div class="am-module-stats">${n.join("")}</div>
    </div>`}async function Ga(){if(await Promise.all([Ca(),Ua()]),!Q.length){alert("No engine designs are available yet. Design and complete at least one engine before designing an aircraft.");return}let a=document.getElementById("am-design-aircraft-modal");if(a){a.querySelector("#am-engine-select").innerHTML=ga();const s=a.querySelector("#am-ac-catalog-count");s&&(s.textContent=ya())}else{const s=(h.abbreviation||h.faction_name||"AM").slice(0,6),n=Math.round(Number(h.corp_innovation)||0),r=["business","regional","narrowbody","widebody"].filter(i=>E.airframes[i]).map(i=>Ya(i,E.airframes[i],i==="regional")).join(""),u=Object.entries(E.mechanicals).map(([i,l])=>ba("mechanical",i,l)).join(""),d=Object.entries(E.offerings).map(([i,l])=>ba("offering",i,l)).join(""),m=ga();a=document.createElement("div"),a.id="am-design-aircraft-modal",a.className="am-modal-overlay",a.innerHTML=`
            <div class="am-modal">
                <div class="am-modal-header">
                    <div>
                        <div class="am-modal-eyebrow">— Aircraft Assembly ◊ New Aircraft Design —</div>
                        <h2 class="am-modal-title">Design <em>Aircraft</em></h2>
                        <div class="am-modal-subtitle">Designing for: <strong>${f(s)}</strong> ${f(h.faction_name||"")} ◊ Innovation: ${n}/10 ◊ <span id="am-ac-catalog-count">${ya()}</span></div>
                    </div>
                    <button type="button" class="am-modal-close" aria-label="Close">×</button>
                </div>
                <div class="am-modal-body">
                    <div class="am-form-section">
                        <div class="am-form-section-header">
                            <h3><span class="num">I.</span>Identity</h3>
                            <span class="meta">Name Your Aircraft</span>
                        </div>
                        <div class="am-identity-block">
                            <div class="am-identity-label">Aircraft Name</div>
                            <input type="text" class="am-identity-input" id="am-aircraft-name" maxlength="60" placeholder="e.g., Phoenix CV-1" />
                        </div>
                    </div>
                    <div class="am-form-section">
                        <div class="am-form-section-header">
                            <h3><span class="num">II.</span>Airframe</h3>
                            <span class="meta">Choose 1 ◊ Determines Aircraft Class</span>
                        </div>
                        <div class="am-airframe-grid" id="am-airframe-grid">${r}</div>
                    </div>
                    <div class="am-form-section">
                        <div class="am-form-section-header">
                            <h3><span class="num">III.</span>Engine Selection</h3>
                            <span class="meta">Pick from the Global Engine Catalog</span>
                        </div>
                        <div class="am-engine-block">
                            <div class="am-engine-row">
                                <div class="am-engine-select-wrap">
                                    <div class="am-engine-select-label">Engine Model</div>
                                    <select class="am-engine-select" id="am-engine-select">${m}</select>
                                    <div class="am-engine-preview" id="am-engine-preview"></div>
                                </div>
                                <div class="am-engine-count-control">
                                    <div class="am-engine-select-label">Engine Count</div>
                                    <div class="am-count-buttons" id="am-engine-counts">
                                        <button type="button" class="am-count-btn" data-count="1">1</button>
                                        <button type="button" class="am-count-btn selected" data-count="2">2</button>
                                        <button type="button" class="am-count-btn" data-count="4">4</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div class="am-form-section">
                        <div class="am-form-section-header">
                            <h3><span class="num">IV.</span>Mechanical</h3>
                            <span class="meta">Multi-Select ◊ Boosts Safety</span>
                        </div>
                        <div class="am-module-grid" id="am-mechanical-grid">${u}</div>
                    </div>
                    <div class="am-form-section">
                        <div class="am-form-section-header">
                            <h3><span class="num">V.</span>Offering</h3>
                            <span class="meta">Multi-Select ◊ Boosts Demand &amp; Passengers</span>
                        </div>
                        <div class="am-module-grid" id="am-offering-grid">${d}</div>
                    </div>
                    <div class="am-form-section">
                        <div class="am-form-section-header">
                            <h3><span class="num">VI.</span>Aircraft Summary</h3>
                            <span class="meta">Live Preview ◊ Final Specifications</span>
                        </div>
                        <div class="am-summary">
                            <div class="am-summary-header-line">— Final Aircraft Specifications —</div>
                            <div class="am-summary-name-row">
                                <div class="am-summary-name" id="am-ac-summary-name">—</div>
                                <span class="am-physical-status viable" id="am-ac-physical-status">◊ Physically Viable</span>
                            </div>
                            <div class="am-summary-tier-line" id="am-ac-summary-tier"></div>
                            <div class="am-summary-stats-grid">
                                <div class="am-summary-stat-card">
                                    <div class="am-summary-stat-card-label">Range</div>
                                    <div class="am-summary-stat-card-value"><span id="am-ac-stat-range">—</span><span class="max">/10</span></div>
                                    <div class="am-summary-stat-card-bar"><div class="am-summary-stat-card-bar-fill" id="am-ac-bar-range"></div></div>
                                </div>
                                <div class="am-summary-stat-card">
                                    <div class="am-summary-stat-card-label">Passengers</div>
                                    <div class="am-summary-stat-card-value"><span id="am-ac-stat-pax">—</span></div>
                                    <div class="am-summary-stat-card-bar"><div class="am-summary-stat-card-bar-fill" id="am-ac-bar-pax"></div></div>
                                </div>
                                <div class="am-summary-stat-card">
                                    <div class="am-summary-stat-card-label">Demand</div>
                                    <div class="am-summary-stat-card-value"><span id="am-ac-stat-demand">—</span><span class="max">/10</span></div>
                                    <div class="am-summary-stat-card-bar"><div class="am-summary-stat-card-bar-fill" id="am-ac-bar-demand"></div></div>
                                </div>
                                <div class="am-summary-stat-card">
                                    <div class="am-summary-stat-card-label">Safety</div>
                                    <div class="am-summary-stat-card-value"><span id="am-ac-stat-safety">—</span><span class="max">/10</span></div>
                                    <div class="am-summary-stat-card-bar"><div class="am-summary-stat-card-bar-fill" id="am-ac-bar-safety"></div></div>
                                </div>
                            </div>
                            <div class="am-physics-block">
                                <div class="am-physics-info">
                                    <strong>Total Thrust vs Total Weight:</strong> Engines must produce more thrust than the aircraft weighs to be viable. Higher thrust:weight ratios extend range above the airframe's baseline.
                                </div>
                                <div class="am-physics-display green" id="am-ac-physics-display">
                                    <span id="am-ac-physics-value">—</span>
                                    <span class="label" id="am-ac-physics-label">Ratio —</span>
                                </div>
                            </div>
                            <div class="am-summary-breakdown">
                                <div>
                                    <div class="am-breakdown-title">Cost Breakdown</div>
                                    <div class="am-breakdown-line"><span class="label">Airframe (<span id="am-ac-cost-airframe-name">—</span>)</span><span class="value" id="am-ac-cost-airframe">—</span></div>
                                    <div class="am-breakdown-line"><span class="label">Engines (<span id="am-ac-cost-engine-count">—</span>× <span id="am-ac-cost-engine-name">—</span>)</span><span class="value" id="am-ac-cost-engines">—</span></div>
                                    <div class="am-breakdown-line"><span class="label">Mechanical (<span id="am-ac-cost-mech-count">0</span> selected)</span><span class="value" id="am-ac-cost-mechanical">$0</span></div>
                                    <div class="am-breakdown-line"><span class="label">Offerings (<span id="am-ac-cost-off-count">0</span> selected)</span><span class="value" id="am-ac-cost-offerings">$0</span></div>
                                    <div class="am-breakdown-line total"><span class="label">Cost per Aircraft Unit</span><span class="value" id="am-ac-cost-total">—</span></div>
                                </div>
                                <div>
                                    <div class="am-breakdown-title">Design</div>
                                    <div class="am-breakdown-line"><span class="label">Airframe Layout</span><span class="value" id="am-ac-time-airframe">—</span></div>
                                    <div class="am-breakdown-line"><span class="label">Engine Integration</span><span class="value" id="am-ac-time-engines">—</span></div>
                                    <div class="am-breakdown-line"><span class="label">Module Integration</span><span class="value" id="am-ac-time-modules">—</span></div>
                                    <div class="am-breakdown-line total"><span class="label">Total Design Time</span><span class="value" id="am-ac-time-total">—</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="am-modal-error" id="am-ac-modal-error"></div>
                <div class="am-modal-footer">
                    <div class="am-modal-footer-summary">
                        <div class="am-modal-footer-item">
                            <span class="am-modal-footer-label">Cost / Unit</span>
                            <span class="am-modal-footer-value" id="am-ac-footer-cost">—</span>
                        </div>
                        <div class="am-modal-footer-item">
                            <span class="am-modal-footer-label">Range</span>
                            <span class="am-modal-footer-value" id="am-ac-footer-range">—</span>
                        </div>
                        <div class="am-modal-footer-item">
                            <span class="am-modal-footer-label">Design Time</span>
                            <span class="am-modal-footer-value" id="am-ac-footer-time">—</span>
                        </div>
                    </div>
                    <div class="am-modal-footer-actions">
                        <button type="button" class="am-modal-btn" id="am-ac-modal-cancel">Cancel</button>
                        <button type="button" class="am-modal-btn primary" id="am-ac-modal-submit">Begin Design ▸</button>
                    </div>
                </div>
            </div>`,document.body.appendChild(a),a.querySelector(".am-modal-close").addEventListener("click",ta),a.querySelector("#am-ac-modal-cancel").addEventListener("click",ta),a.addEventListener("click",i=>{i.target===a&&ta()}),a.querySelector("#am-aircraft-name").addEventListener("input",()=>{v.name=a.querySelector("#am-aircraft-name").value||"",V()}),a.querySelectorAll(".am-airframe-card").forEach(i=>{i.addEventListener("click",()=>{a.querySelectorAll(".am-airframe-card").forEach($=>$.classList.remove("selected")),i.classList.add("selected"),v.airframe=i.dataset.airframe;const l=E.airframes[v.airframe];l&&(v.engineCount<l.eng_min||v.engineCount>l.eng_max)&&(v.engineCount=l.eng_min),V()})}),a.querySelector("#am-engine-select").addEventListener("change",i=>{v.engineId=i.target.value,V()}),a.querySelectorAll(".am-count-btn").forEach(i=>{i.addEventListener("click",()=>{i.disabled||(a.querySelectorAll(".am-count-btn").forEach(l=>l.classList.remove("selected")),i.classList.add("selected"),v.engineCount=parseInt(i.dataset.count,10),V())})}),a.querySelectorAll("#am-mechanical-grid .am-module-card, #am-offering-grid .am-module-card").forEach(i=>{i.addEventListener("click",()=>{const l=i.dataset.group,$=i.dataset.id,x=l==="mechanical"?v.mechanicals:v.offerings;x.has($)?(x.delete($),i.classList.remove("selected")):(x.add($),i.classList.add("selected")),V()})}),a.querySelector("#am-ac-modal-submit").addEventListener("click",Wa)}const e=(h.abbreviation||h.faction_name||"AC").slice(0,6),t=document.querySelectorAll('#co-designs-list [data-design-type="aircraft"], #co-rnd-list [data-design-type="aircraft"]').length;v={name:`${e}-AC${t+1}`,airframe:"regional",engineId:Q[0]?.id||null,engineCount:Number(E.airframes.regional?.eng_min)||2,mechanicals:new Set,offerings:new Set},a.querySelector("#am-aircraft-name").value=v.name,a.querySelectorAll(".am-airframe-card").forEach(s=>{s.classList.toggle("selected",s.dataset.airframe===v.airframe)}),a.querySelector("#am-engine-select").value=v.engineId||"",a.querySelectorAll(".am-count-btn").forEach(s=>{s.classList.toggle("selected",parseInt(s.dataset.count,10)===v.engineCount)}),a.querySelectorAll("#am-mechanical-grid .am-module-card, #am-offering-grid .am-module-card").forEach(s=>s.classList.remove("selected")),a.querySelector("#am-ac-modal-error").classList.remove("show"),a.querySelector("#am-ac-modal-submit").disabled=!1,a.querySelector("#am-ac-modal-submit").textContent="Begin Design ▸",a.classList.add("open"),document.body.style.overflow="hidden",V()}function ta(){const a=document.getElementById("am-design-aircraft-modal");a&&a.classList.remove("open"),document.body.style.overflow=""}function V(){if(!v)return;const a=document.getElementById("am-design-aircraft-modal");if(!a)return;const e=E.airframes[v.airframe],t=Q.find(g=>g.id===v.engineId);if(!e||!t)return;a.querySelectorAll(".am-count-btn").forEach(g=>{const C=parseInt(g.dataset.count,10),X=C>=e.eng_min&&C<=e.eng_max;g.disabled=!X,!X&&v.engineCount===C&&(v.engineCount=e.eng_min)}),a.querySelectorAll(".am-count-btn").forEach(g=>{g.classList.toggle("selected",parseInt(g.dataset.count,10)===v.engineCount)});const s=Array.from(v.mechanicals).map(g=>E.mechanicals[g]).filter(Boolean),n=Array.from(v.offerings).map(g=>E.offerings[g]).filter(Boolean),o=t.thrust*v.engineCount,r=t.weight*v.engineCount,u=s.reduce((g,C)=>g+C.weight,0)+n.reduce((g,C)=>g+C.weight,0),d=e.weight+r+u,m=d>0?o/d:0,i=m>=1,l=Math.min(10,Math.max(0,e.range*m)),$=e.pax+n.reduce((g,C)=>g+C.pax,0),x=t.reliability>=70?1:0,q=n.reduce((g,C)=>g+C.demand,0),N=Math.min(10,Math.max(0,5+q+x)),T=s.reduce((g,C)=>g+C.safety,0),z=Math.floor((t.reliability-50)/25),L=Math.min(10,Math.max(0,5+T+z)),F=t.costPerUnit*v.engineCount,H=s.reduce((g,C)=>g+C.cost,0),S=n.reduce((g,C)=>g+C.cost,0),D=e.cost+F+H+S,B=v.engineCount,P=s.length+n.length>=2?2:1,j=e.time+B+P,p=g=>a.querySelector("#"+g);p("am-ac-summary-name").textContent=v.name||"Untitled Aircraft",p("am-ac-summary-tier").textContent=`${e.name.toUpperCase()} ◊ ${v.engineCount}× ${t.name.toUpperCase()} ENGINES ◊ TIER 1 BUILD`,p("am-ac-stat-range").textContent=l.toFixed(1),p("am-ac-stat-pax").textContent=String($),p("am-ac-stat-demand").textContent=String(N),p("am-ac-stat-safety").textContent=String(L),p("am-ac-bar-range").style.width=l*10+"%",p("am-ac-bar-pax").style.width=Math.min(100,$/60*100)+"%",p("am-ac-bar-demand").style.width=N*10+"%",p("am-ac-bar-safety").style.width=L*10+"%";const U=p("am-ac-physics-display"),A=p("am-ac-physics-label"),c=p("am-ac-physical-status");p("am-ac-physics-value").textContent=`${o.toFixed(1)} / ${d.toFixed(1)}`,m>=1.5?(U.className="am-physics-display green",A.textContent=`Ratio ${m.toFixed(2)} ◊ Excellent`,c.className="am-physical-status viable",c.textContent="◊ Physically Viable"):m>=1?(U.className="am-physics-display green",A.textContent=`Ratio ${m.toFixed(2)} ◊ Viable`,c.className="am-physical-status viable",c.textContent="◊ Physically Viable"):m>=.85?(U.className="am-physics-display warn",A.textContent=`Ratio ${m.toFixed(2)} ◊ Underpowered`,c.className="am-physical-status invalid",c.textContent="⚠ Insufficient Thrust"):(U.className="am-physics-display bad",A.textContent=`Ratio ${m.toFixed(2)} ◊ Cannot Fly`,c.className="am-physical-status invalid",c.textContent="⚠ Cannot Fly"),p("am-ac-cost-airframe-name").textContent=e.name,p("am-ac-cost-airframe").textContent=y(e.cost),p("am-ac-cost-engine-count").textContent=String(v.engineCount),p("am-ac-cost-engine-name").textContent=t.name,p("am-ac-cost-engines").textContent=y(F),p("am-ac-cost-mech-count").textContent=String(s.length),p("am-ac-cost-mechanical").textContent=y(H),p("am-ac-cost-off-count").textContent=String(n.length),p("am-ac-cost-offerings").textContent=y(S),p("am-ac-cost-total").textContent=y(D),p("am-ac-time-airframe").textContent=`${e.time} ticks`,p("am-ac-time-engines").textContent=`${B} tick${B===1?"":"s"}`,p("am-ac-time-modules").textContent=`${P} tick${P===1?"":"s"}`,p("am-ac-time-total").textContent=`${j} ticks`;const w=p("am-ac-footer-cost");w.textContent=y(D),w.className="am-modal-footer-value"+(i?"":" bad"),p("am-ac-footer-range").textContent=l.toFixed(1),p("am-ac-footer-time").textContent=`${j} ticks`,p("am-engine-preview").innerHTML=`
        <span class="am-engine-pill thrust">Thrust ${t.thrust.toFixed(1)}</span>
        <span class="am-engine-pill weight">Weight ${t.weight.toFixed(1)}</span>
        <span class="am-engine-pill">Eff ${t.efficiency}</span>
        <span class="am-engine-pill">Rel ${t.reliability}</span>
        <span class="am-engine-pill">${y(t.costPerUnit)} ea.</span>
    `;const k=p("am-ac-modal-submit");k.disabled=!i,k.textContent=i?"Begin Design ▸":"Cannot Fly — Adjust Design"}async function Wa(){if(!v)return;const a=document.getElementById("am-design-aircraft-modal"),e=a.querySelector("#am-ac-modal-submit"),t=a.querySelector("#am-ac-modal-error"),s=(a.querySelector("#am-aircraft-name").value||"").trim();if(!s){t.textContent="Aircraft name required.",t.classList.add("show");return}if(!v.engineId){t.textContent="Pick an engine.",t.classList.add("show");return}e.disabled=!0,e.textContent="Submitting…",t.classList.remove("show");try{const{data:n,error:o}=await b.rpc("start_aircraft_design_research",{p_corp_id:h.id,p_name:s,p_airframe:v.airframe,p_engine_design_id:v.engineId,p_engine_count:v.engineCount,p_mechanicals:Array.from(v.mechanicals),p_offerings:Array.from(v.offerings)});if(o){t.textContent=o.message,t.classList.add("show"),e.disabled=!1,e.textContent="Begin Design ▸";return}if(!n?.success){t.textContent=n?.error||"Could not start design.",t.classList.add("show"),e.disabled=!1,e.textContent="Begin Design ▸";return}ta(),await W(h.id)}catch(n){t.textContent=n?.message||"Unknown error.",t.classList.add("show"),e.disabled=!1,e.textContent="Begin Design ▸"}}const za={light_assembly_plant:["business","regional"],aircraft_assembly_facility:["regional","narrowbody"],heavy_manufacturing_plant:["widebody"],engine_assembly_plant:["engine"]},$a={light_assembly_plant:1,aircraft_assembly_facility:1,heavy_manufacturing_plant:1,engine_assembly_plant:2},Xa={light_assembly_plant:"Light Assembly",aircraft_assembly_facility:"Aircraft Assembly",heavy_manufacturing_plant:"Heavy Manufacturing",engine_assembly_plant:"Engine Assembly"};let _=null,R=[],ca=[],ma={},M=null;async function Ka(){if(M)return M;const{data:a,error:e}=await b.rpc("volume_discount_tiers");return e?(console.warn("[aviation-ops] volume_discount_tiers fetch failed:",e.message),M=[{min_qty:1,mult:1}],M):(M=(a||[]).slice().sort((t,s)=>t.min_qty-s.min_qty),M)}function Ja(a){const e=M||[{min_qty:1,mult:1}];let t=1;for(const s of e)a>=s.min_qty&&(t=Number(s.mult));return t}function Za(a,e){if(!e)return`${a.min_qty}+ units`;const t=e.min_qty-1;return t===a.min_qty?`${a.min_qty} unit${a.min_qty===1?"":"s"}`:`${a.min_qty}-${t} units`}function ae(a){const e=M||[];let t=0;for(let s=0;s<e.length;s++)a>=e[s].min_qty&&(t=s);return t}let O=null;async function ee(){if(O)return O;const{data:a,error:e}=await b.rpc("time_per_unit_tiers");return e?(console.warn("[aviation-ops] time_per_unit_tiers fetch failed:",e.message),O={},O):(O=a||{},O)}function te(a,e){const t=O||{};return a==="engine"?Number(t.engine)||8:a==="aircraft"&&Number(t[e])||8}async function se(a){const[e,t,s]=await Promise.all([b.from("corp_aircraft_designs").select("id, name, design_type, airframe_class, cost_per_unit, inventory_on_hand, engine_count, engine_design_id, thrust, weight, quality, passengers, range_nm").eq("corp_id",a).eq("status","available").eq("is_active",!0).order("design_type",{ascending:!1}).order("name"),b.from("corp_properties").select("id, name, type, city, condition").eq("faction_id",a).eq("is_active",!0).in("type",["light_assembly_plant","aircraft_assembly_facility","heavy_manufacturing_plant","engine_assembly_plant"]),b.from("corp_production_run_plants").select("property_id, corp_production_runs!inner(status)")]);e.error&&console.warn("[aviation-ops] designs fetch failed:",e.error.message),t.error&&console.warn("[aviation-ops] plants fetch failed:",t.error.message),s.error&&console.warn("[aviation-ops] run-plants fetch failed:",s.error.message),R=e.data||[],ca=t.data||[];const n={};for(const o of s.data||[])o.corp_production_runs?.status==="active"&&(n[o.property_id]=(n[o.property_id]||0)+1);ma=n}function xa(a){const e=$a[a.type]||1;return(ma[a.id]||0)<e}function ne(a,e){if(!a||!e||!xa(a))return!1;const t=za[a.type]||[];return e.design_type==="engine"?t.includes("engine"):e.design_type==="aircraft"?t.includes(e.airframe_class):!1}async function ie(){if(await Promise.all([se(h.id),Ka(),ee()]),R.length===0){alert("No Available designs to produce. Complete an engine or aircraft design first.");return}let a=document.getElementById("am-production-queue-modal");a||(a=document.createElement("div"),a.id="am-production-queue-modal",a.className="am-modal-overlay",a.innerHTML=`
            <div class="am-modal">
                <div class="am-modal-header">
                    <div>
                        <div class="am-modal-eyebrow">— Aviation Manufacturing ◊ Production Queue —</div>
                        <h2 class="am-modal-title">Queue <em>Production</em></h2>
                        <div class="am-modal-subtitle" id="am-q-subtitle"></div>
                    </div>
                    <button type="button" class="am-modal-close" aria-label="Close">×</button>
                </div>
                <div class="am-modal-body">
                    <div class="am-form-section">
                        <div class="am-form-section-header">
                            <h3><span class="num">I.</span>Select Design</h3>
                            <span class="meta">Choose 1 ◊ From Your Catalog</span>
                        </div>
                        <div class="am-q-tabs">
                            <button type="button" class="am-q-tab active" data-q-tab="aircraft">Aircraft Designs</button>
                            <button type="button" class="am-q-tab" data-q-tab="engine">Engine Designs</button>
                        </div>
                        <div class="am-q-list" id="am-q-design-list"></div>
                    </div>

                    <div class="am-form-section">
                        <div class="am-form-section-header">
                            <h3><span class="num">II.</span>Allocate Plants</h3>
                            <span class="meta">Compatible Plants Only</span>
                        </div>
                        <div class="am-engine-block" id="am-q-plants-block"></div>
                    </div>

                    <div class="am-form-section">
                        <div class="am-form-section-header">
                            <h3><span class="num">III.</span>Production Quantity</h3>
                            <span class="meta">Volume Discount Applies</span>
                        </div>
                        <div class="am-engine-block am-q-quantity-block">
                            <div>
                                <div class="am-q-qty-display"><span id="am-q-qty">5</span><span class="unit">units</span></div>
                                <input type="range" min="1" max="20" step="1" value="5" class="am-q-slider" id="am-q-slider" />
                                <div style="display:flex; justify-content:space-between; font-family:var(--co-mono); font-size:9px; color:var(--co-text-tertiary); letter-spacing:0.14em;"><span>1 UNIT</span><span>20 UNITS</span></div>
                            </div>
                            <div>
                                <div style="font-family:var(--co-mono); font-size:9px; letter-spacing:0.16em; text-transform:uppercase; color:var(--co-text-tertiary); margin-bottom:8px;">Volume Discount Schedule</div>
                                <div id="am-q-tier-list"></div>
                            </div>
                        </div>
                    </div>

                    <div class="am-form-section" id="am-q-supply-section">
                        <div class="am-form-section-header">
                            <h3><span class="num">IV.</span>Engine Supply</h3>
                            <span class="meta">Aircraft Builds Consume Engines</span>
                        </div>
                        <div class="am-engine-block">
                            <div class="am-q-supply-grid">
                                <div class="am-q-supply-cell"><div class="am-q-supply-cell-label">Engines Needed</div><div class="am-q-supply-cell-value" id="am-q-engines-need">—</div></div>
                                <div class="am-q-supply-cell"><div class="am-q-supply-cell-label">In Inventory</div><div class="am-q-supply-cell-value green" id="am-q-engines-stock">—</div></div>
                                <div class="am-q-supply-cell"><div class="am-q-supply-cell-label">After This Run</div><div class="am-q-supply-cell-value" id="am-q-engines-net">—</div></div>
                            </div>
                        </div>
                    </div>

                    <div class="am-form-section">
                        <div class="am-form-section-header">
                            <h3><span class="num">V.</span>Production Schedule</h3>
                            <span class="meta">Per-Tick Cost &amp; Total Timeline</span>
                        </div>
                        <div class="am-summary">
                            <div class="am-summary-breakdown">
                                <div>
                                    <div class="am-breakdown-title">Cost Breakdown</div>
                                    <div class="am-breakdown-line"><span class="label">Per Unit (after discount)</span><span class="value" id="am-q-c-perunit">—</span></div>
                                    <div class="am-breakdown-line"><span class="label">Quantity</span><span class="value" id="am-q-c-qty">—</span></div>
                                    <div class="am-breakdown-line total"><span class="label">Total Cost</span><span class="value" id="am-q-c-total">—</span></div>
                                </div>
                                <div>
                                    <div class="am-breakdown-title">Timeline</div>
                                    <div class="am-breakdown-line"><span class="label">Plants Assigned</span><span class="value" id="am-q-c-plants">—</span></div>
                                    <div class="am-breakdown-line"><span class="label">Time / Unit</span><span class="value" id="am-q-c-tpu">—</span></div>
                                    <div class="am-breakdown-line"><span class="label">Cost / Tick</span><span class="value" id="am-q-c-cpt">—</span></div>
                                    <div class="am-breakdown-line total"><span class="label">Total Ticks</span><span class="value" id="am-q-c-total-ticks">—</span></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="am-modal-error" id="am-q-modal-error"></div>
                <div class="am-modal-footer">
                    <div class="am-modal-footer-summary">
                        <div class="am-modal-footer-item"><span class="am-modal-footer-label">Total Cost</span><span class="am-modal-footer-value" id="am-q-footer-cost">—</span></div>
                        <div class="am-modal-footer-item"><span class="am-modal-footer-label">Per Tick</span><span class="am-modal-footer-value" id="am-q-footer-cpt">—</span></div>
                        <div class="am-modal-footer-item"><span class="am-modal-footer-label">Total Ticks</span><span class="am-modal-footer-value" id="am-q-footer-ticks">—</span></div>
                    </div>
                    <div class="am-modal-footer-actions">
                        <button type="button" class="am-modal-btn" id="am-q-modal-cancel">Cancel</button>
                        <button type="button" class="am-modal-btn primary" id="am-q-modal-submit">Begin Production ▸</button>
                    </div>
                </div>
            </div>`,document.body.appendChild(a),a.querySelector(".am-modal-close").addEventListener("click",sa),a.querySelector("#am-q-modal-cancel").addEventListener("click",sa),a.addEventListener("click",o=>{o.target===a&&sa()}),a.querySelectorAll(".am-q-tab").forEach(o=>{o.addEventListener("click",()=>{a.querySelectorAll(".am-q-tab").forEach(r=>r.classList.remove("active")),o.classList.add("active"),_.tab=o.dataset.qTab,_.designId=null,_.assignedPlants=new Set,G()})}),a.querySelector("#am-q-slider").addEventListener("input",()=>{_.quantity=parseInt(a.querySelector("#am-q-slider").value,10)||1,G()}),a.querySelector("#am-q-modal-submit").addEventListener("click",oe));const e=R.filter(o=>o.design_type==="aircraft"),t=R.filter(o=>o.design_type==="engine"),s=e.length?"aircraft":"engine";_={tab:s,designId:(s==="aircraft"?e:t)[0]?.id||null,quantity:5,assignedPlants:new Set},a.querySelector("#am-q-slider").value="5",a.querySelectorAll(".am-q-tab").forEach(o=>o.classList.toggle("active",o.dataset.qTab===s)),a.querySelector("#am-q-modal-error").classList.remove("show"),a.querySelector("#am-q-modal-submit").disabled=!1,a.querySelector("#am-q-modal-submit").textContent="Begin Production ▸",a.classList.add("open"),document.body.style.overflow="hidden",G()}function sa(){const a=document.getElementById("am-production-queue-modal");a&&a.classList.remove("open"),document.body.style.overflow=""}function G(){const a=document.getElementById("am-production-queue-modal");if(!a||!_)return;const e=c=>a.querySelector("#"+c),t=(h.abbreviation||h.faction_name||"AM").slice(0,6),s=Math.round(Number(h.corp_cash_reserves)||0),n=R.filter(c=>c.design_type==="aircraft"),o=R.filter(c=>c.design_type==="engine");e("am-q-subtitle").innerHTML=`Filing as: <strong>${f(t)}</strong> ${f(h.faction_name||"")} ◊ Cash on hand: ${y(s)} ◊ Engine catalog: ${o.length} ◊ Aircraft catalog: ${n.length}`;const r=_.tab==="aircraft"?n:o,u=e("am-q-design-list");r.length===0?u.innerHTML=`<div class="am-q-empty">No ${_.tab} designs available. Run R&amp;D first.</div>`:(u.innerHTML=r.map(c=>{const w=c.design_type==="aircraft"?`${(c.airframe_class||"").toUpperCase()} ◊ ${c.engine_count||0} ENGINE${(c.engine_count||0)===1?"":"S"} ◊ ${c.passengers||0} PAX`:`QUALITY ${Number(c.quality||0).toFixed(1)} ◊ THRUST ${Number(c.thrust||0).toFixed(1)} ◊ WEIGHT ${Number(c.weight||0).toFixed(1)}`;return`<div class="am-q-row${c.id===_.designId?" selected":""}" data-design-id="${c.id}">
                <div class="am-q-radio"></div>
                <div class="am-q-row-info">
                    <div class="am-q-row-name">${f(c.name)}</div>
                    <div class="am-q-row-meta">${w}</div>
                </div>
                <div class="am-q-row-info" style="text-align:right;">
                    <div class="am-q-row-cost">${y(c.cost_per_unit)}</div>
                    <div class="am-q-row-meta" style="margin-top:2px;">INVENTORY: ${Number(c.inventory_on_hand)||0}</div>
                </div>
            </div>`}).join(""),u.querySelectorAll(".am-q-row").forEach(c=>{c.addEventListener("click",()=>{_.designId=c.dataset.designId,_.assignedPlants=new Set,G()})}));const d=R.find(c=>c.id===_.designId),m=e("am-q-plants-block");d?(m.innerHTML=ca.length===0?'<div class="am-q-empty">No industrial facilities owned. Build one from the Expansion tab.</div>':ca.map(c=>{const w=ne(c,d),k=$a[c.type]||1,g=ma[c.id]||0,C=k-g,X=!xa(c),K=_.assignedPlants.has(c.id);let J,Z;return X&&!K?(J="busy",Z=`Full (${g}/${k})`):w?(J="ok",Z=`Free slot (${C}/${k})`):(J="incompat",Z="Incompatible"),`<div class="am-q-plant-row" data-plant-id="${c.id}">
                    <div>
                        <div class="am-q-plant-name">${f(c.name)} <span style="font-family:var(--co-mono); font-size:9px; color:var(--co-text-tertiary); letter-spacing:0.1em; text-transform:uppercase; margin-left:6px;">${Xa[c.type]||c.type}</span></div>
                        <div class="am-q-plant-meta">${f(c.city||"")} ◊ ${Math.round(Number(c.condition||0))}% CONDITION</div>
                    </div>
                    <span class="am-q-plant-status ${J}">${Z}</span>
                    <button type="button" class="am-q-plant-toggle${K?" assigned":""}" data-plant-id="${c.id}" ${w||K?"":"disabled"}>${K?"Assigned":"Assign"}</button>
                </div>`}).join(""),m.querySelectorAll(".am-q-plant-toggle").forEach(c=>{c.addEventListener("click",()=>{if(c.disabled)return;const w=c.dataset.plantId;_.assignedPlants.has(w)?_.assignedPlants.delete(w):_.assignedPlants.add(w),G()})})):m.innerHTML='<div class="am-q-empty">Pick a design above to see compatible plants.</div>';const i=_.quantity;e("am-q-qty").textContent=String(i);const l=M||[{min_qty:1,mult:1}],$=ae(i);e("am-q-tier-list").innerHTML=l.map((c,w)=>{const k=l[w+1]||null,g=Math.round(Number(c.mult)*100);return`<div class="am-q-tier-row${w===$?" active":""}">
            <span class="qty">${Za(c,k)}</span>
            <span class="pct">${g}%</span>
        </div>`}).join("");const x=e("am-q-supply-section");let q=null,N=0,T=!0;if(d&&d.design_type==="aircraft"){x.style.display="",q=R.find(g=>g.id===d.engine_design_id),N=(Number(d.engine_count)||0)*i;const c=Number(q?.inventory_on_hand)||0,w=c-N;T=w>=0,e("am-q-engines-need").textContent=String(N),e("am-q-engines-stock").textContent=`${c}${q?" · "+f(q.name):""}`;const k=e("am-q-engines-net");k.textContent=T?`+${w}`:String(w),k.className="am-q-supply-cell-value"+(T?" green":" bad")}else x.style.display="none";const L=Array.from(_.assignedPlants).length,F=d?te(d.design_type,d.airframe_class):0,S=(L>0&&i>0?Math.ceil(i/L):0)*F;let D=0;if(d){const c=Number(d.cost_per_unit)||0;if(d.design_type==="aircraft"&&q){const w=(Number(d.engine_count)||0)*(Number(q.cost_per_unit)||0);D=Math.max(0,c-w)}else D=c}const B=Ja(i),P=Math.round(D*B),j=P*i,p=S>0?Math.round(j/S):0;e("am-q-c-perunit").textContent=d?`${y(P)} (${Math.round(B*100)}%)`:"—",e("am-q-c-qty").textContent=`${i} × ${y(P)}`,e("am-q-c-total").textContent=y(j),e("am-q-c-plants").textContent=L>0?`${L} (parallel: ${L}/cycle)`:"—",e("am-q-c-tpu").textContent=F>0?`${F} ticks`:"—",e("am-q-c-cpt").textContent=S>0?`${y(p)}/tick`:"—",e("am-q-c-total-ticks").textContent=S>0?`${S} ticks`:"—",e("am-q-footer-cost").textContent=y(j),e("am-q-footer-cpt").textContent=S>0?y(p):"—",e("am-q-footer-ticks").textContent=S>0?String(S):"—";const U=e("am-q-modal-submit");let A=null;d?L===0?A="Assign at least one plant":d.design_type==="aircraft"&&!d.engine_design_id?A="Aircraft design has no engine reference":d.design_type==="aircraft"&&!q?A="This aircraft was designed with another corp's engine. Cross-corp engine sourcing isn't supported yet — pick an aircraft built around one of your own engine designs.":d.design_type==="aircraft"&&!T?A=`Need ${N} engines (short ${N-(Number(q?.inventory_on_hand)||0)})`:s<p&&(A=`Need ${y(p)} cash to start (you have ${y(s)})`):A="Pick a design",U.disabled=!!A,U.textContent=A||"Begin Production ▸"}async function oe(){if(!_)return;const a=document.getElementById("am-production-queue-modal"),e=a.querySelector("#am-q-modal-submit"),t=a.querySelector("#am-q-modal-error");if(e.disabled)return;const s=R.find(n=>n.id===_.designId);if(s){e.disabled=!0,e.textContent="Submitting…",t.classList.remove("show");try{const{data:n,error:o}=await b.rpc("queue_production_run",{p_corp_id:h.id,p_design_id:_.designId,p_engine_design_id:s.design_type==="aircraft"?s.engine_design_id:null,p_quantity:_.quantity,p_plant_property_ids:Array.from(_.assignedPlants)});if(o){t.textContent=o.message,t.classList.add("show"),e.disabled=!1,e.textContent="Begin Production ▸";return}if(!n?.success){t.textContent=n?.error||"Could not queue production.",t.classList.add("show"),e.disabled=!1,e.textContent="Begin Production ▸";return}sa(),await Promise.all([W(h.id),Ea(h.id)])}catch(n){t.textContent=n?.message||"Unknown error.",t.classList.add("show"),e.disabled=!1,e.textContent="Begin Production ▸"}}}async function Ea(a){const e=document.getElementById("co-production-list");if(!e)return;const{data:t,error:s}=await b.from("corp_production_runs").select("id, design_id, design_type, quantity, completed_quantity, total_ticks, ticks_remaining, cost_per_tick, status").eq("corp_id",a).eq("status","active").order("created_at",{ascending:!1});if(s){console.warn("[aviation-ops] production runs fetch failed:",s.message),e.innerHTML='<div class="co-contract-empty">Could not load production runs.</div>';return}const n=t||[];if(n.length===0){e.innerHTML='<div class="co-contract-empty">No active production runs. Click + Production Queue to start one.</div>';return}const o=[...new Set(n.map(u=>u.design_id).filter(Boolean))];let r={};if(o.length>0){const{data:u,error:d}=await b.from("corp_aircraft_designs").select("id, name").in("id",o);d&&console.warn("[aviation-ops] design name lookup failed:",d.message);for(const m of u||[])r[m.id]=m.name}e.innerHTML=n.map(u=>re(u,r[u.design_id]||"—")).join("")}function re(a,e){const t=Number(a.total_ticks)||1,s=Number(a.ticks_remaining)||0,n=Math.max(0,Math.min(100,(t-s)/t*100)),o=`${a.design_type==="engine"?"Engine":"Aircraft"} ◊ ${a.completed_quantity||0} / ${a.quantity||0} delivered ◊ ${y(a.cost_per_tick)}/tick`;return`<div class="am-q-run-card">
        <div>
            <div class="am-q-run-name">${f(e)}</div>
            <div class="am-q-run-meta">${o}</div>
        </div>
        <div class="am-q-run-stats"><strong>${s}</strong> ticks left<br><span style="color:var(--co-text-tertiary);">${n.toFixed(0)}% complete</span></div>
        <div class="am-q-run-progress"><div class="am-q-run-progress-fill" style="width:${n.toFixed(0)}%"></div></div>
    </div>`}const da={regional:"Regional",narrowbody:"Narrowbody",widebody:"Widebody"},ha={range:"RANGE",price:"PRICE",quality:"QUALITY",offering:"OFFERING"};function Sa(a){if(!a||typeof a!="object")return"";const e=Object.entries(a).filter(([t,s])=>ha[t]&&Number.isFinite(Number(s))).sort((t,s)=>Number(t[1])-Number(s[1])).map(([t])=>ha[t]);return e.length===4?e.join(" &gt; "):""}let Y=null,na=[],ra=!1;async function Aa(a){const e=document.getElementById("co-rfps-list");if(!e)return;const{data:t}=await b.from("corp_aircraft_designs").select("id, name, airframe_class, inventory_on_hand, range_nm, passengers, demand_score, safety_score, quality, cost_per_unit, engine_count").eq("corp_id",a).eq("design_type","aircraft").eq("status","available").eq("is_active",!0),s={};for(const l of t||[])Number(l.inventory_on_hand)<=0||(s[l.airframe_class]||(s[l.airframe_class]=[]),s[l.airframe_class].push(l));const[n,o,r]=await Promise.all([b.from("shard").select("current_tick").eq("name","Alpha Shard").single(),b.from("aircraft_rfps").select("id, airline_corp_id, design_class, quantity, expires_at_tick, name, priorities, factions:airline_corp_id(faction_name, abbreviation)").eq("status","open").order("created_at",{ascending:!1}).limit(50),b.from("aircraft_rfp_bids").select("rfp_id, price_per_unit, source_design_id, status").eq("manufacturer_corp_id",a)]),u=Number(n.data?.current_tick)||0;if(o.error){console.warn("[aviation-ops] RFP fetch failed:",o.error.message),e.innerHTML='<div class="co-contract-empty">Could not load RFPs.</div>';return}const d=o.data||[],m=new Map((r.data||[]).map(l=>[l.rfp_id,l]));if(d.length===0){e.innerHTML=`<div class="co-contract-empty">No open RFPs right now. They'll surface here when airlines post purchase requests.</div>`;return}function i(l){return(s[l]||[]).reduce((x,q)=>Math.max(x,Number(q.inventory_on_hand)||0),0)}e.innerHTML=d.map(l=>{const $=Math.max(0,Number(l.expires_at_tick)-u),x=l.factions?.abbreviation||l.factions?.faction_name||"—",q=m.get(l.id),N=q?`Bid placed · ${y(q.price_per_unit)}/unit (${q.status})`:"No bid",T=`${l.quantity}× ${f(da[l.design_class]||l.design_class)}`,z=l.name?`${f(l.name)} — ${T}`:T,L=Sa(l.priorities),H=(s[l.design_class]||[]).some(P=>Number(P.inventory_on_hand)>=Number(l.quantity)),S=H?q&&q.status==="pending"?"Update Bid":"Submit Bid":"Cannot Fulfill",D=H?"":' disabled style="opacity:0.5;cursor:not-allowed;"',B=H?"":`<div class="am-q-run-meta" style="margin-top:2px;color:var(--co-accent-rust,#d97757);">NEED ${l.quantity} ${f(da[l.design_class]||l.design_class).toUpperCase()} IN INVENTORY ◊ YOU HAVE ${i(l.design_class)}</div>`;return`<div class="am-q-run-card" style="grid-template-columns:1fr auto;align-items:center;">
            <div>
                <div class="am-q-run-name">${z}</div>
                <div class="am-q-run-meta">FROM ${f(x)} ◊ ${$} TICK${$===1?"":"S"} LEFT ◊ ${f(N)}</div>
                ${L?`<div class="am-q-run-meta" style="margin-top:2px;">PRIORITIES: ${L}</div>`:""}
                ${B}
            </div>
            <button type="button" class="co-panel-action-btn co-rfp-bid-btn" data-rfp-id="${l.id}"${D}>${S}</button>
        </div>`}).join(""),e.querySelectorAll(".co-rfp-bid-btn:not([disabled])").forEach(l=>{l.addEventListener("click",()=>le(l.dataset.rfpId,s,d))})}function le(a,e,t){const s=t.find(i=>i.id===a);if(!s)return;Y=s,na=(e[s.design_class]||[]).filter(i=>Number(i.inventory_on_hand)>=Number(s.quantity));let n=document.getElementById("am-rfp-bid-modal");n||(n=document.createElement("div"),n.id="am-rfp-bid-modal",n.className="am-modal-overlay",n.innerHTML=`
            <div class="am-modal">
                <div class="am-modal-header">
                    <div>
                        <div class="am-modal-eyebrow">— Aircraft RFP ◊ Submit Bid —</div>
                        <h2 class="am-modal-title">Submit <em>Bid</em></h2>
                        <div class="am-modal-subtitle" id="am-rfp-bid-subtitle"></div>
                    </div>
                    <button type="button" class="am-modal-close" aria-label="Close">×</button>
                </div>
                <div class="am-modal-body">
                    <div class="am-form-section">
                        <div class="am-form-section-header">
                            <h3><span class="num">I.</span>Choose Design</h3>
                            <span class="meta">Eligible Aircraft With Sufficient Inventory</span>
                        </div>
                        <div id="am-rfp-bid-designs" class="am-q-list"></div>
                    </div>
                    <div class="am-form-section">
                        <div class="am-form-section-header">
                            <h3><span class="num">II.</span>Price Per Unit</h3>
                            <span class="meta">Total = Price × Quantity</span>
                        </div>
                        <div class="am-engine-block" style="display:flex;gap:14px;align-items:center;">
                            <input type="number" id="am-rfp-bid-price" min="0" step="100000" value="0" style="flex:1;padding:10px 14px;font-family:var(--co-serif);font-size:18px;background:var(--co-bg-secondary);border:1px solid var(--co-line-bright);color:var(--co-text-primary);" />
                            <div style="font-family:var(--co-mono);font-size:11px;color:var(--co-text-secondary);">Total: <span id="am-rfp-bid-total" style="color:var(--co-accent-gold);font-weight:600;">$0</span></div>
                        </div>
                    </div>
                </div>
                <div class="am-modal-error" id="am-rfp-bid-error"></div>
                <div class="am-modal-footer">
                    <div class="am-modal-footer-summary"></div>
                    <div class="am-modal-footer-actions">
                        <button type="button" class="am-modal-btn" id="am-rfp-bid-cancel">Cancel</button>
                        <button type="button" class="am-modal-btn primary" id="am-rfp-bid-submit">Submit Bid ▸</button>
                    </div>
                </div>
            </div>`,document.body.appendChild(n),n.querySelector(".am-modal-close").addEventListener("click",ia),n.querySelector("#am-rfp-bid-cancel").addEventListener("click",ia),n.addEventListener("click",i=>{i.target===n&&ia()}),n.querySelector("#am-rfp-bid-price").addEventListener("input",_a),n.querySelector("#am-rfp-bid-submit").addEventListener("click",ce));const o=`${s.quantity}× ${da[s.design_class]||s.design_class} for ${s.factions?.abbreviation||s.factions?.faction_name||"airline"}`,r=s.name?`${s.name} ◊ `:"",u=Sa(s.priorities),d=n.querySelector("#am-rfp-bid-subtitle");d.innerHTML=u?`${f(r)}${f(o)} <span style="color:var(--co-text-tertiary);">◊ Priorities: ${u}</span>`:`${f(r)}${f(o)}`,n.querySelector("#am-rfp-bid-designs").innerHTML=na.map((i,l)=>`
        <div class="am-q-row${l===0?" selected":""}" data-design-id="${i.id}">
            <div class="am-q-radio"></div>
            <div class="am-q-row-info">
                <div class="am-q-row-name">${f(i.name)}</div>
                <div class="am-q-row-meta">RANGE ${Number(i.range_nm||0).toFixed(1)} ◊ ${i.passengers||0} PAX ◊ QUALITY ${Number(i.quality||0).toFixed(1)} ◊ INVENTORY ${i.inventory_on_hand}</div>
            </div>
            <div class="am-q-row-info" style="text-align:right;">
                <div class="am-q-row-cost">${y(i.cost_per_unit)}</div>
                <div class="am-q-row-meta" style="margin-top:2px;">PRODUCTION COST</div>
            </div>
        </div>
    `).join("")||'<div class="am-q-empty">No eligible designs.</div>',n.querySelectorAll("#am-rfp-bid-designs .am-q-row").forEach(i=>{i.addEventListener("click",()=>{n.querySelectorAll("#am-rfp-bid-designs .am-q-row").forEach(l=>l.classList.remove("selected")),i.classList.add("selected")})});const m=na[0];m&&(n.querySelector("#am-rfp-bid-price").value=Math.round(Number(m.cost_per_unit)*1.2),_a()),n.querySelector("#am-rfp-bid-error").classList.remove("show"),n.querySelector("#am-rfp-bid-submit").disabled=!1,n.querySelector("#am-rfp-bid-submit").textContent="Submit Bid ▸",n.classList.add("open"),document.body.style.overflow="hidden"}function ia(){const a=document.getElementById("am-rfp-bid-modal");a&&a.classList.remove("open"),document.body.style.overflow="",Y=null,na=[]}function _a(){const a=document.getElementById("am-rfp-bid-modal");if(!a||!Y)return;const t=(parseInt(a.querySelector("#am-rfp-bid-price").value,10)||0)*Y.quantity;a.querySelector("#am-rfp-bid-total").textContent=y(t)}async function ce(){if(ra||!Y)return;const a=document.getElementById("am-rfp-bid-modal"),e=a.querySelector("#am-rfp-bid-error");e.classList.remove("show");const t=a.querySelector("#am-rfp-bid-designs .am-q-row.selected");if(!t){e.textContent="Pick a design.",e.classList.add("show");return}const s=t.dataset.designId,n=parseInt(a.querySelector("#am-rfp-bid-price").value,10);if(!Number.isInteger(n)||n<0){e.textContent="Price must be a non-negative whole number.",e.classList.add("show");return}ra=!0;const o=a.querySelector("#am-rfp-bid-submit");o.disabled=!0,o.textContent="Submitting…";try{const{data:r,error:u}=await b.rpc("bid_on_aircraft_rfp",{p_rfp_id:Y.id,p_source_design_id:s,p_price_per_unit:n});if(u||!r?.success){e.textContent=u?.message||r?.error||"Failed to submit bid.",e.classList.add("show");return}ia(),await Aa(h.id)}catch(r){e.textContent=r?.message||"Unknown error.",e.classList.add("show")}finally{ra=!1,o.disabled=!1,o.textContent="Submit Bid ▸"}}async function W(a){const e=document.getElementById("co-designs-list"),t=document.getElementById("co-rnd-list");if(!e||!t)return;const{data:s,error:n}=await b.from("corp_aircraft_designs").select("id, name, design_type, thrust, weight, efficiency, reliability, quality, cost_per_unit, inventory_on_hand, status, research_ticks_total, research_ticks_remaining, completed_at_tick, airframe_class, engine_count, passengers, range_nm, demand_score, safety_score").eq("corp_id",a).eq("is_active",!0).order("created_at",{ascending:!1});if(n){console.warn("[aviation-ops] designs fetch failed:",n.message),e.innerHTML='<div class="co-contract-empty">Could not load designs.</div>',t.innerHTML='<div class="co-contract-empty">Could not load R&amp;D.</div>';return}const o=s||[],r=o.filter(d=>d.status==="researching"),u=o.filter(d=>d.status==="available");t.innerHTML=r.length?r.map(me).join(""):'<div class="co-contract-empty">No active R&amp;D. Allocate resources to begin developing a new design.</div>',t.querySelectorAll(".am-design-cancel-btn").forEach(d=>{d.addEventListener("click",()=>de(d.dataset.designId,a))}),e.innerHTML=u.length?u.map(ue).join(""):'<div class="co-contract-empty">No designs yet. Run R&amp;D to develop your first airframe.</div>'}let la=!1;async function de(a,e){if(!la&&window.confirm("Cancel this design? Money spent so far on research is NOT refunded. This cannot be undone.")){la=!0;try{const{data:t,error:s}=await b.rpc("cancel_design_research",{p_design_id:a});if(s||!t?.success){window.alert(s?.message||t?.error||"Failed to cancel design.");return}await W(e)}catch(t){window.alert(t?.message||"Unknown error.")}finally{la=!1}}}function me(a){const e=Number(a.research_ticks_total)||1,t=Number(a.research_ticks_remaining)||0,s=Math.max(0,Math.min(100,(e-t)/e*100)),n=a.design_type==="aircraft",o=n?"Aircraft":"Engine",r=n?`<div><span class="label">Range</span><span class="value">${Number(a.range_nm??0).toFixed(1)}</span></div>
           <div><span class="label">Pax</span><span class="value">${Number(a.passengers??0)}</span></div>
           <div><span class="label">Demand</span><span class="value">${Number(a.demand_score??0)}</span></div>
           <div><span class="label">Safety</span><span class="value">${Number(a.safety_score??0)}</span></div>`:`<div><span class="label">Thrust</span><span class="value">${Number(a.thrust??0).toFixed(1)}</span></div>
           <div><span class="label">Weight</span><span class="value">${Number(a.weight??0).toFixed(1)}</span></div>
           <div><span class="label">Eff</span><span class="value">${Number(a.efficiency??0)}</span></div>
           <div><span class="label">Rel</span><span class="value">${Number(a.reliability??0)}</span></div>`;return`<div class="am-design-card" data-design-type="${a.design_type}">
        <div class="am-design-card-head">
            <div class="am-design-name">${f(a.name)}</div>
            <span class="am-design-meta">${o} · Tier 1</span>
        </div>
        <div class="am-design-stats">${r}</div>
        <div class="am-design-progress"><div class="am-design-progress-fill" style="width:${s.toFixed(0)}%"></div></div>
        <div class="am-design-countdown" style="display:flex;justify-content:space-between;align-items:center;gap:14px;">
            <span>${t} month${t===1?"":"s"} left · ${s.toFixed(0)}% complete</span>
            <button type="button" class="am-design-cancel-btn" data-design-id="${a.id}" style="background:transparent;border:1px solid rgba(217,83,79,0.4);color:var(--co-accent-rust,#d9534f);font-family:var(--co-mono);font-size:9px;letter-spacing:0.14em;text-transform:uppercase;padding:4px 10px;cursor:pointer;">Cancel Design</button>
        </div>
    </div>`}function ue(a){const e=a.design_type==="aircraft",t=e?"Aircraft":"Engine",s=y(a.cost_per_unit),n=e?`<div><span class="label">Range</span><span class="value">${Number(a.range_nm??0).toFixed(1)}</span></div>
           <div><span class="label">Pax</span><span class="value">${Number(a.passengers??0)}</span></div>
           <div><span class="label">Cost / Unit</span><span class="value">${s}</span></div>
           <div><span class="label">Inventory</span><span class="value">${Number(a.inventory_on_hand??0)}</span></div>`:`<div><span class="label">Thrust</span><span class="value">${Number(a.thrust??0).toFixed(1)}</span></div>
           <div><span class="label">Weight</span><span class="value">${Number(a.weight??0).toFixed(1)}</span></div>
           <div><span class="label">Cost / Unit</span><span class="value">${s}</span></div>
           <div><span class="label">Inventory</span><span class="value">${Number(a.inventory_on_hand??0)}</span></div>`;return`<div class="am-design-card" data-design-type="${a.design_type}">
        <div class="am-design-card-head">
            <div class="am-design-name">${f(a.name)}</div>
            <span class="am-design-meta">${t} · Quality ${Number(a.quality??0).toFixed(1)}/10</span>
        </div>
        <div class="am-design-stats">${n}</div>
    </div>`}async function pe(){const{data:{user:a}}=await b.auth.getUser();if(!a){window.location.href="login.html";return}const t=new URL(location.href).searchParams.get("faction_id"),s=t||sessionStorage.getItem("active_faction_id")||a.id,[n,o]=await Promise.all([b.from("factions").select("*").eq("id",s).maybeSingle(),b.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single()]);if(n.error){document.body.innerHTML='<div style="padding:40px;font-family:monospace;color:#c85a3a;">Could not load corporation.</div>';return}let r=n.data;if(!t&&(!r||r.faction_type!=="corporation"||r.corp_sector!=="Aviation Manufacturing")){const{data:i}=await b.from("factions").select("*").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`).eq("faction_type","corporation").eq("corp_sector","Aviation Manufacturing").is("abandoned_at",null).limit(1).maybeSingle();i&&(r=i,sessionStorage.setItem("active_faction_id",i.id))}const u=o.data;if(h=r,!r||r.faction_type!=="corporation"||r.corp_sector!=="Aviation Manufacturing"){const i=t?`?faction_id=${encodeURIComponent(t)}`:"";window.location.href="corp-dashboard.html"+i;return}const{data:d}=await b.from("factions").select("id, faction_name, abbreviation, faction_type, linked_user_id").or(`id.eq.${a.id},linked_user_id.eq.${a.id}`).is("abandoned_at",null);Ia(document.getElementById("corp-topbar"),{activeTab:"operations",faction:r,shard:u,allUserFactions:d||[]}),Ba(0),La({supabase:b,faction:r,host:document.getElementById("co-loan-pressing")}),Ta(),Oa();const m=document.getElementById("co-footer-date");m&&u?.current_date&&(m.textContent=String(u.current_date)),await Da(r.id);try{const{data:i}=await b.from("corp_properties").select("type").eq("faction_id",r.id).in("type",["engine_assembly_plant","light_assembly_plant","aircraft_assembly_facility","heavy_manufacturing_plant"]).eq("is_active",!0),l=new Set((i||[]).map($=>$.type));va(l.has("engine_assembly_plant")),fa(l.has("light_assembly_plant")||l.has("aircraft_assembly_facility")||l.has("heavy_manufacturing_plant"))}catch(i){console.warn("[aviation-ops] facility gate check failed:",i?.message||i),va(!1),fa(!1)}await Ca(),await Promise.all([W(r.id),Ea(r.id),Aa(r.id)])}pe().catch(a=>{console.error("[aviation-ops] init failed:",a),document.body.innerHTML='<div style="padding:40px;font-family:monospace;color:#c85a3a;">Could not load aviation operations. Reload to try again.</div>'});
