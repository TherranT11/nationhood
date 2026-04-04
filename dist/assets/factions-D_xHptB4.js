import{_ as v}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as w}from"./common-DKfT-nlB.js";import{e as c}from"./utils-C2W-HleY.js";let n=null,p=null,m=0;w("factions",async s=>{const{nation:t,faction:o,shard:i}=s;if(n=t,p=o,m=i?.current_tick||0,!t){document.getElementById("content-area").innerHTML=`
            <div class="placeholder-panel">
                <div class="ph-icon">🏛️</div>
                <h3>No Nation Selected</h3>
                <p>Your party is not assigned to a nation yet.</p>
            </div>
        `;return}await T()});async function T(){const{data:s}=await v.from("faction_electoral_standing").select("party_approval").eq("faction_id",p.id).eq("nation_id",n.id).maybeSingle(),t=Math.round(s?.party_approval??0),e=`
        <div class="panel-padding">
            <div class="section-header">Factions & Demands — ${n.name}</div>
            
            <div class="stat-grid" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
                <div class="stat-card">
                    <div class="stat-label">Voter Blocs</div>
                    <div class="stat-value">0</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Active Demands</div>
                    <div class="stat-value">0</div>
                </div>
                <div class="stat-card">
                    <div class="stat-label">Your Approval</div>
                    <div class="stat-value">${t}%</div>
                </div>
            </div>
            
            <div class="sub-tabs">
                <button class="sub-tab active" onclick="showSubTab('demands')">Active Demands</button>
                <button class="sub-tab" onclick="showSubTab('blocs')">Voter Blocs</button>
                <button class="sub-tab" onclick="showSubTab('history')">History</button>
            </div>
            
            <div class="sub-content active" id="sub-demands">
                <div id="demands-list">
                    <div class="empty-state">
                        <div class="empty-state-icon">📭</div>
                        <h3>No Active Demands</h3>
                        <p>The voter blocs are quiet... for now.</p>
                    </div>
                </div>
            </div>
            
            <div class="sub-content" id="sub-blocs">
                <div id="blocs-list">
                    <div class="empty-state">
                        <div class="empty-state-icon">🏛️</div>
                        <h3>No Voter Blocs</h3>
                        <p>No organized voter blocs exist in this nation yet.</p>
                    </div>
                </div>
            </div>
            
            <div class="sub-content" id="sub-history">
                <div id="history-list">
                    <div class="empty-state">
                        <div class="empty-state-icon">📜</div>
                        <h3>No History Yet</h3>
                        <p>Past demands will appear here once they are met or expire.</p>
                    </div>
                </div>
            </div>
        </div>
    `;document.getElementById("content-area").innerHTML=e,await Promise.all([u(),b(),g()])}function E(s){document.querySelectorAll(".sub-tab").forEach(t=>t.classList.remove("active")),document.querySelectorAll(".sub-content").forEach(t=>t.classList.remove("active")),document.querySelector(`.sub-tab[onclick="showSubTab('${s}')"]`).classList.add("active"),document.getElementById(`sub-${s}`).classList.add("active")}async function u(){const s=document.getElementById("demands-list");try{const{data:t,error:o}=await v.from("voter_bloc_demands").select("*").eq("nation_id",n.id).eq("status","active").order("deadline_tick",{ascending:!0});if(o)throw o;if(!t||t.length===0){s.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3>No Active Demands</h3>
                    <p>The voter blocs are quiet... for now.</p>
                </div>
            `;return}const{data:i}=await v.from("nations").select("*").eq("id",n.id).single();s.innerHTML=t.map(e=>{const a=e.deadline_tick-m,l=a<=2?"urgent":a<=4?"warning":"normal",d=a<=2?"urgent":a<=4?"warning":"",r=i&&i[e.target_stat]||0,y=e.target_stat.replace(/_/g," ").replace(/\b\w/g,$=>$.toUpperCase()),h=e.desired_range==="high"?"target-high":e.desired_range==="low"?"target-low":"target-moderate",_=e.desired_range==="high"?"70-100":e.desired_range==="low"?"0-30":"31-69",f=e.desired_range==="high"&&r>e.current_value||e.desired_range==="low"&&r<e.current_value||e.desired_range==="moderate"&&Math.abs(r-50)<Math.abs(e.current_value-50);return`
                <div class="demand-card ${d}">
                    <div class="demand-header">
                        <div>
                            <div class="demand-bloc-name">${c(e.bloc_name)}</div>
                            <div class="demand-bloc-voters">${c(e.bloc_name)}</div>
                        </div>
                        <div class="demand-deadline">
                            <div class="demand-deadline-label">Deadline</div>
                            <div class="demand-deadline-value deadline-${l}">
                                ${a>0?a+" month"+(a!==1?"s":""):"OVERDUE"}
                            </div>
                        </div>
                    </div>
                    
                    <div class="demand-body">
                        "${c(e.demand_text)}"
                    </div>
                    
                    <div class="demand-requirement">
                        <div class="demand-stat-info">
                            <span class="demand-stat-name">${y}</span>
                            <span class="demand-stat-current" style="color:${f?"#5cb85c":"#d9534f"}">
                                ${r}
                            </span>
                            <span class="demand-stat-arrow">→</span>
                            <span class="demand-stat-target ${h}">${_}</span>
                        </div>
                        <div>
                            <span class="demand-penalty">⚠ -${e.approval_penalty}% approval on failure</span>
                        </div>
                    </div>
                </div>
            `}).join("")}catch(t){console.error("Error loading demands:",t),s.innerHTML='<div class="empty-state"><p style="color:#d9534f;">Error loading demands</p></div>'}}async function b(){const s=document.getElementById("blocs-list");try{const t=[];if(!t||t.length===0){s.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state-icon">🏛️</div>
                    <h3>No Voter Blocs</h3>
                    <p>No organized voter blocs exist in this nation yet.</p>
                </div>
            `;return}const{data:i}=await v.from("voter_bloc_demands").select("voter_bloc_id, status").eq("nation_id",n.id).eq("status","active"),e={};(i||[]).forEach(a=>{e[a.voter_bloc_id]=(e[a.voter_bloc_id]||0)+1}),s.innerHTML=t.map(a=>{const l=[a.ideology_1,a.ideology_2,a.ideology_3,a.ideology_4,a.ideology_5].filter(Boolean),d=e[a.id]||0;return`
                <div class="bloc-card">
                    <div class="bloc-card-left">
                        <div class="bloc-card-name">${c(a.bloc_name)}</div>
                        ${a.description?`<div class="bloc-card-desc">"${c(a.description)}"</div>`:""}
                        <div class="bloc-ideology-tags">
                            ${l.map(r=>`<span class="bloc-ideology-tag">${r}</span>`).join("")}
                        </div>
                    </div>
                    <div class="bloc-card-right">
                        <div class="bloc-voter-count">${(a.voter_count||0).toLocaleString()}</div>
                        <div class="bloc-voter-label">Voters</div>
                        <div class="bloc-demand-count" style="color:${d>0?"#ffcc00":"#666"};">
                            ${d>0?`${d} active demand${d>1?"s":""}`:"No active demands"}
                        </div>
                    </div>
                </div>
            `}).join("")}catch(t){console.error("Error loading blocs:",t),s.innerHTML='<div class="empty-state"><p style="color:#d9534f;">Error loading voter blocs</p></div>'}}async function g(){const s=document.getElementById("history-list");try{const{data:t,error:o}=await v.from("voter_bloc_demands").select("*").eq("nation_id",n.id).in("status",["met","failed"]).order("resolved_at_tick",{ascending:!1}).limit(30);if(o)throw o;if(!t||t.length===0){s.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state-icon">📜</div>
                    <h3>No History Yet</h3>
                    <p>Past demands will appear here once they are met or expire.</p>
                </div>
            `;return}s.innerHTML=t.map(i=>{const e=i.target_stat.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase()),a=i.status==="met";return`
                <div class="history-row">
                    <div>
                        <span class="history-bloc">${c(i.bloc_name)}</span>
                        <span class="history-stat"> — wanted ${e} to be ${i.desired_range}</span>
                    </div>
                    <div>
                        <span class="demand-status-badge ${a?"badge-met":"badge-failed"}">
                            ${a?"✓ MET":"✗ FAILED"}
                        </span>
                        <span style="color:#666; font-size:0.78rem; margin-left:10px;">
                            Tick ${i.resolved_at_tick||"?"}
                        </span>
                    </div>
                </div>
            `}).join("")}catch(t){console.error("Error loading history:",t),s.innerHTML='<div class="empty-state"><p style="color:#d9534f;">Error loading history</p></div>'}}setInterval(()=>{n&&Promise.all([u(),b(),g()])},6e4);window.showSubTab=E;
