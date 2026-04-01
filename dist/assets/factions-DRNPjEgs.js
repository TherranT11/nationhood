import{_ as v}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as w}from"./common-BedtaFOo.js";import{e as c}from"./utils-C2W-HleY.js";let d=null,p=null,m=0;w("factions",async a=>{const{nation:t,faction:o,shard:i}=a;if(d=t,p=o,m=i?.current_tick||0,!t){document.getElementById("content-area").innerHTML=`
            <div class="placeholder-panel">
                <div class="ph-icon">🏛️</div>
                <h3>No Nation Selected</h3>
                <p>Your party is not assigned to a nation yet.</p>
            </div>
        `;return}await T()});async function T(){const o=`
        <div class="panel-padding">
            <div class="section-header">Factions & Demands — ${d.name}</div>
            
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
                    <div class="stat-value">${p.approval_rating||0}%</div>
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
    `;document.getElementById("content-area").innerHTML=o,await Promise.all([u(),b(),g()])}function E(a){document.querySelectorAll(".sub-tab").forEach(t=>t.classList.remove("active")),document.querySelectorAll(".sub-content").forEach(t=>t.classList.remove("active")),document.querySelector(`.sub-tab[onclick="showSubTab('${a}')"]`).classList.add("active"),document.getElementById(`sub-${a}`).classList.add("active")}async function u(){const a=document.getElementById("demands-list");try{const{data:t,error:o}=await v.from("voter_bloc_demands").select("*").eq("nation_id",d.id).eq("status","active").order("deadline_tick",{ascending:!0});if(o)throw o;if(!t||t.length===0){a.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state-icon">📭</div>
                    <h3>No Active Demands</h3>
                    <p>The voter blocs are quiet... for now.</p>
                </div>
            `;return}const{data:i}=await v.from("nations").select("*").eq("id",d.id).single();a.innerHTML=t.map(s=>{const e=s.deadline_tick-m,l=e<=2?"urgent":e<=4?"warning":"normal",n=e<=2?"urgent":e<=4?"warning":"",r=i&&i[s.target_stat]||0,y=s.target_stat.replace(/_/g," ").replace(/\b\w/g,$=>$.toUpperCase()),h=s.desired_range==="high"?"target-high":s.desired_range==="low"?"target-low":"target-moderate",_=s.desired_range==="high"?"70-100":s.desired_range==="low"?"0-30":"31-69",f=s.desired_range==="high"&&r>s.current_value||s.desired_range==="low"&&r<s.current_value||s.desired_range==="moderate"&&Math.abs(r-50)<Math.abs(s.current_value-50);return`
                <div class="demand-card ${n}">
                    <div class="demand-header">
                        <div>
                            <div class="demand-bloc-name">${c(s.bloc_name)}</div>
                            <div class="demand-bloc-voters">${c(s.bloc_name)}</div>
                        </div>
                        <div class="demand-deadline">
                            <div class="demand-deadline-label">Deadline</div>
                            <div class="demand-deadline-value deadline-${l}">
                                ${e>0?e+" month"+(e!==1?"s":""):"OVERDUE"}
                            </div>
                        </div>
                    </div>
                    
                    <div class="demand-body">
                        "${c(s.demand_text)}"
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
                            <span class="demand-penalty">⚠ -${s.approval_penalty}% approval on failure</span>
                        </div>
                    </div>
                </div>
            `}).join("")}catch(t){console.error("Error loading demands:",t),a.innerHTML='<div class="empty-state"><p style="color:#d9534f;">Error loading demands</p></div>'}}async function b(){const a=document.getElementById("blocs-list");try{const t=[];if(!t||t.length===0){a.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state-icon">🏛️</div>
                    <h3>No Voter Blocs</h3>
                    <p>No organized voter blocs exist in this nation yet.</p>
                </div>
            `;return}const{data:i}=await v.from("voter_bloc_demands").select("voter_bloc_id, status").eq("nation_id",d.id).eq("status","active"),s={};(i||[]).forEach(e=>{s[e.voter_bloc_id]=(s[e.voter_bloc_id]||0)+1}),a.innerHTML=t.map(e=>{const l=[e.ideology_1,e.ideology_2,e.ideology_3,e.ideology_4,e.ideology_5].filter(Boolean),n=s[e.id]||0;return`
                <div class="bloc-card">
                    <div class="bloc-card-left">
                        <div class="bloc-card-name">${c(e.bloc_name)}</div>
                        ${e.description?`<div class="bloc-card-desc">"${c(e.description)}"</div>`:""}
                        <div class="bloc-ideology-tags">
                            ${l.map(r=>`<span class="bloc-ideology-tag">${r}</span>`).join("")}
                        </div>
                    </div>
                    <div class="bloc-card-right">
                        <div class="bloc-voter-count">${(e.voter_count||0).toLocaleString()}</div>
                        <div class="bloc-voter-label">Voters</div>
                        <div class="bloc-demand-count" style="color:${n>0?"#ffcc00":"#666"};">
                            ${n>0?`${n} active demand${n>1?"s":""}`:"No active demands"}
                        </div>
                    </div>
                </div>
            `}).join("")}catch(t){console.error("Error loading blocs:",t),a.innerHTML='<div class="empty-state"><p style="color:#d9534f;">Error loading voter blocs</p></div>'}}async function g(){const a=document.getElementById("history-list");try{const{data:t,error:o}=await v.from("voter_bloc_demands").select("*").eq("nation_id",d.id).in("status",["met","failed"]).order("resolved_at_tick",{ascending:!1}).limit(30);if(o)throw o;if(!t||t.length===0){a.innerHTML=`
                <div class="empty-state">
                    <div class="empty-state-icon">📜</div>
                    <h3>No History Yet</h3>
                    <p>Past demands will appear here once they are met or expire.</p>
                </div>
            `;return}a.innerHTML=t.map(i=>{const s=i.target_stat.replace(/_/g," ").replace(/\b\w/g,l=>l.toUpperCase()),e=i.status==="met";return`
                <div class="history-row">
                    <div>
                        <span class="history-bloc">${c(i.bloc_name)}</span>
                        <span class="history-stat"> — wanted ${s} to be ${i.desired_range}</span>
                    </div>
                    <div>
                        <span class="demand-status-badge ${e?"badge-met":"badge-failed"}">
                            ${e?"✓ MET":"✗ FAILED"}
                        </span>
                        <span style="color:#666; font-size:0.78rem; margin-left:10px;">
                            Tick ${i.resolved_at_tick||"?"}
                        </span>
                    </div>
                </div>
            `}).join("")}catch(t){console.error("Error loading history:",t),a.innerHTML='<div class="empty-state"><p style="color:#d9534f;">Error loading history</p></div>'}}setInterval(()=>{d&&Promise.all([u(),b(),g()])},6e4);window.showSubTab=E;
