import{_supabase as V}from"./supabase-client-qEAQbBjE.js";/* empty css                  */import{i as K}from"./news-BbeQXpbr.js";import{i as ct}from"./common-BO6546B4.js";import"./preload-helper-BXl3LOEh.js";import"./utils-A98FEun4.js";import"./government-structure-C17uG6rl.js";import"./corp-topbar-BOR6jYkY.js";let g=null,y=null,$=[],z=null,h=[],_=[],N=new Set,M=null,J=[],S=!1,C=[],L=null,q=[],B=null,w=[];const pt=[{id:"general",name:"General News",desc:"Broad coverage. Wide appeal. Moderate influence per broadcast.",locked:!1},{id:"opposition",name:"Opposition",desc:"Anti-government lean. High credibility with dissidents.",locked:!1},{id:"political",name:"Political",desc:"Ideology-aligned. Only parties with 20+ in the ideology can broadcast.",locked:!1},{id:"underground",name:"Underground / Pirate",desc:"Evades detection. Can be raided. High trust among radicals.",locked:!1},{id:"commercial",name:"Commercial / Pro-Business",desc:"Financed by advertisers. High reach. Biased toward corporate interests.",locked:!1},{id:"state",name:"State Station",desc:"Requires government ownership or a ruling party mandate.",locked:!0}],mt=[{tag:"LIBERTY",label:"Liberty",color:"#3b82f6"},{tag:"EQUALITY",label:"Equality",color:"#ef4444"},{tag:"TRADITION",label:"Tradition",color:"#a855f7"},{tag:"PROGRESS",label:"Progress",color:"#22c55e"},{tag:"SECURITY",label:"Security",color:"#f59e0b"},{tag:"FREEDOM",label:"Freedom",color:"#06b6d4"},{tag:"GLOBALISM",label:"Globalism",color:"#14b8a6"},{tag:"NATIONALISM",label:"Nationalism",color:"#f97316"},{tag:"INDIVIDUALISM",label:"Individualism",color:"#eab308"},{tag:"COLLECTIVISM",label:"Collectivism",color:"#ec4899"}],k={general:"var(--accent)",opposition:"var(--red)",political:"#8b7ec8",underground:"var(--orange)",commercial:"var(--blue)",state:"var(--amber)"};function d(a){if(!a)return"";const t=document.createElement("div");return t.textContent=a,t.innerHTML}function tt(a){return a?a.split(/\n\n+/).map(t=>{const i=d(t.trim());return i?`<p style="margin:0 0 12px 0;">${i.replace(/\n/g,"<br>")}</p>`:""}).filter(Boolean).join(""):""}function ft(a){return(a||"??").split(/\s+/).map(t=>t[0]).join("").toUpperCase().slice(0,2)}function vt(a){return _.filter(i=>i.faction_id===y.faction?.id&&i.station_id===a.id).length>=3?{allowed:!1,reason:"Maximum 3 personalities per party per station."}:{allowed:!0,reason:null}}async function ut(a,t){g=a,y=t;const i=document.getElementById("broadcast-root");if(!i)return;const s=t.nation?.id;if(!s){i.innerHTML='<div class="radio-empty"><div class="radio-empty-icon">&#128225;</div><div class="radio-empty-title">No Nation</div><div class="radio-empty-desc">Your party is not assigned to a nation.</div></div>';return}const[o]=await Promise.all([g.from("radio_stations").select("*").eq("nation_id",s).order("created_at",{ascending:!0})]);if(o.error){console.error("[Radio] Failed to load stations:",o.error.message),i.innerHTML='<div class="radio-empty"><div class="radio-empty-title">Error loading stations</div></div>';return}$=o.data||[],yt(i),T(i)}function yt(a){a.addEventListener("click",async t=>{if(t.target.closest("#radio-create-btn")){kt();return}if(t.target.closest("#radio-tunein-btn")){S=!S,S?wt():T(a);return}const i=t.target.closest(".radio-station-tab");if(i){xt(i.dataset.stationId);return}const s=t.target.closest(".radio-tunein-nation");if(s){L=s.dataset.nationId,B=null,w=[],await nt(),T(a);return}const o=t.target.closest(".radio-tunein-station");if(o){B=o.dataset.stationId,await st(),T(a);return}const p=t.target.closest(".radio-type-card");if(p&&!p.classList.contains("locked")){b.stationType=p.dataset.type,p.dataset.type!=="political"&&(b.ideology=null);const r=document.getElementById("radio-create-modal");r&&(r.innerHTML=O());return}const e=t.target.closest(".radio-ideology-card");if(e){b.ideology=e.dataset.ideology;const r=document.getElementById("radio-create-modal");r&&(r.innerHTML=O());return}if(t.target.closest("#radio-modal-close")||t.target.closest("#radio-modal-cancel")){ot();return}if(t.target.closest("#radio-modal-submit")){Bt();return}if(t.target.classList.contains("radio-modal-overlay")){t.target.classList.remove("active");return}if(t.target.closest("#radio-create-pers-btn")){const r=$.find(f=>f.id===z);r&&It(r);return}const n=t.target.closest("[data-gl-btn]");if(n){t.stopPropagation(),_t(n.dataset.glBtn);return}const l=t.target.closest("[data-bc-edit]");if(l){t.stopPropagation(),Et(l.dataset.bcEdit);return}const c=t.target.closest("[data-bc-toggle]");if(c){const r=c.dataset.bcToggle;M=M===r?null:r;const f=$.find(v=>v.id===z);j(f);return}}),a.addEventListener("input",t=>{if(t.target.id==="radio-freq-slider"){const i=(t.target.value/10).toFixed(1);b.frequency=i;const s=(t.target.value-875)/205*100,o=document.getElementById("radio-freq-cursor");o&&(o.style.left=s+"%");const p=document.getElementById("radio-freq-value");p&&(p.textContent=i+" FM");const e=parseFloat(i),n=W.find(function(c){return Math.abs(c.freq-e)<.2}),l=document.getElementById("radio-freq-status");l&&(l.textContent=n?"OCCUPIED ("+n.callsign+")":"AVAILABLE",l.className="radio-freq-status "+(n?"radio-freq-status--occupied":"radio-freq-status--available"))}t.target.id==="radio-input-callsign"&&(b.callsign=t.target.value),t.target.id==="radio-input-name"&&(b.name=t.target.value),t.target.id==="radio-input-desc"&&(b.description=t.target.value)})}function T(a){const t=y.nation?.name||"Unknown",i=$.length;a.innerHTML=`
        <div class="radio-page">
            <!-- Header -->
            <div class="radio-header">
                <div class="radio-header-left">
                    <span class="radio-title">Radio</span>
                    <span class="radio-nation-badge">${d(t)}</span>
                    <span class="radio-station-count">${i} station${i!==1?"s":""}</span>
                </div>
                <div class="radio-header-actions">
                    <button class="radio-btn radio-btn--outline" id="radio-tunein-btn">${S?"&#9664; Back":"&#128225; Tune In"}</button>
                    <button class="radio-btn radio-btn--outline" id="radio-broadcast-btn" disabled title="Create a personality on a station first">Start Broadcast</button>
                    <button class="radio-btn radio-btn--primary" id="radio-create-btn">Create Station</button>
                </div>
            </div>

            <div class="radio-two-col">
                <div class="radio-col-left">
                    ${S?Lt():i===0?gt():bt()}
                </div>
                <div class="radio-col-right">
                    <div class="radio-events-panel" id="radio-events-panel">
                        <div class="radio-events-header">
                            <span class="radio-events-title">Events</span>
                            <div style="display:flex;gap:8px;align-items:center;">
                                <div class="radio-events-tabs" id="radio-events-type-tabs">
                                    <span class="radio-events-tab active" data-type="political">Politics</span>
                                    <span class="radio-events-tab" data-type="corporate">Corporate</span>
                                </div>
                                <div style="width:1px;height:14px;background:var(--border-main);"></div>
                                <div class="radio-events-tabs" id="radio-events-scope-tabs">
                                    <span class="radio-events-tab active" data-scope="nation">Nation</span>
                                    <span class="radio-events-tab" data-scope="world">World</span>
                                </div>
                            </div>
                        </div>
                        <div class="radio-events-scroll" id="radio-events-scroll">
                            <div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Loading events...</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Create Station Modal -->
        <div class="radio-modal-overlay" id="radio-create-modal">
            ${O()}
        </div>

        <!-- Create Personality Modal -->
        <div class="radio-modal-overlay" id="radio-personality-modal"></div>

        <!-- Start Broadcast Modal -->
        <div class="radio-modal-overlay" id="radio-broadcast-modal"></div>
    `,!S&&i>0&&ht(),Ct()}function gt(){return`
        <div class="radio-empty">
            <div class="radio-empty-icon">&#128225;</div>
            <div class="radio-empty-title">No Stations in ${d(y.nation?.name||"this nation")}</div>
            <div class="radio-empty-desc">Be the first to launch a radio station and start broadcasting to your nation.</div>
        </div>
    `}function bt(){return`
        <!-- Station tabs -->
        <div class="radio-station-tabs" id="radio-station-tabs">${$.map(t=>{const i=k[t.station_type]||"var(--text-dim)";return`
            <div class="radio-station-tab" data-station-id="${t.id}">
                <div class="radio-station-tab-top">
                    <div class="radio-station-dot" style="background:${i};color:${i};"></div>
                    <span class="radio-station-tab-call">${d(t.callsign)}</span>
                </div>
                <div class="radio-station-tab-freq">${d(t.frequency)}</div>
                <div class="radio-station-tab-bottom">
                    <span class="radio-station-tab-type" style="color:${i};">${d(t.station_type.toUpperCase())}</span>
                </div>
            </div>
        `}).join("")}</div>

        <!-- Main: sidebar + feed -->
        <div class="radio-main">
            <div class="radio-sidebar" id="radio-sidebar"></div>
            <div class="radio-feed" id="radio-feed">
                <div class="radio-feed-header">
                    <span class="radio-feed-title">Broadcasts</span>
                    <span class="radio-feed-count" id="radio-feed-count"></span>
                </div>
                <div class="radio-feed-scroll" id="radio-feed-scroll"></div>
            </div>
        </div>
    `}async function xt(a){z=a;const t=$.find(c=>c.id===a);if(!t)return;document.querySelectorAll(".radio-station-tab").forEach(c=>{c.classList.toggle("active",c.dataset.stationId===a);const r=k[$.find(f=>f.id===c.dataset.stationId)?.station_type]||"var(--text-dim)";c.dataset.stationId===a?(c.style.borderColor=r,c.style.borderBottomColor=r):(c.style.borderColor="",c.style.borderBottomColor="transparent")});const i=y.faction?.id,[s,o,p]=await Promise.all([g.from("radio_personalities").select("*").eq("station_id",a),g.from("radio_broadcasts").select("*").eq("station_id",a).order("created_at",{ascending:!1}).limit(50),i?g.from("broadcast_good_listens").select("broadcast_id").eq("faction_id",i):{data:[]}]);s.error&&console.error("[Radio] Failed to load personalities:",s.error.message),o.error&&console.error("[Radio] Failed to load broadcasts:",o.error.message),_=s.data||[],h=o.data||[],N=new Set((p.data||[]).map(c=>c.broadcast_id)),M=null;const e=_.filter(c=>c.faction_id===i),n=document.getElementById("radio-broadcast-btn");n&&(n.disabled=e.length===0,n.title=e.length>0?"Broadcast on this station":"Create a personality on a station first",n.onclick=e.length>0?()=>it(t):null);const l=document.getElementById("radio-sidebar");l&&(l.style.display=""),et(t),j(t)}async function ht(){const a=y.faction?.id,[t,i,s,o]=await Promise.all([g.from("radio_broadcasts").select("*").order("created_at",{ascending:!1}).limit(100),g.from("radio_personalities").select("*"),a?g.from("broadcast_good_listens").select("broadcast_id").eq("faction_id",a):{data:[]},g.from("radio_stations").select("id, callsign, frequency, station_type, nation_id, nations!inner(name)").order("created_at")]);J=o.data||[],_=i.data||[],h=t.data||[],N=new Set((s.data||[]).map(l=>l.broadcast_id)),M=null,z=null;const p=_.filter(l=>l.faction_id===a),e=document.getElementById("radio-broadcast-btn");if(e&&(e.disabled=p.length===0,e.title=p.length>0?"Start a broadcast":"Create a personality on a station first",p.length>0)){const l=$.find(c=>p.some(r=>r.station_id===c.id));e.onclick=l?()=>it(l):null}document.querySelectorAll(".radio-station-tab").forEach(l=>{l.classList.remove("active"),l.style.borderColor="",l.style.borderBottomColor="transparent"});const n=document.getElementById("radio-sidebar");n&&(n.style.display="none"),j(null)}function et(a){const t=document.getElementById("radio-sidebar");if(!t)return;const i=k[a.station_type]||"var(--text-dim)",s=_.length>0?_.map(e=>`
            <div class="radio-personality-row">
                <div class="radio-personality-avatar" style="color:${i};">${ft(e.name)}</div>
                <div>
                    <div class="radio-personality-name">${d(e.name)}</div>
                    ${e.title?`<div class="radio-personality-title">${d(e.title)}</div>`:""}
                </div>
            </div>
        `).join(""):'<div style="font-size:8px;color:var(--text-dim);font-style:italic;">No personalities yet.</div>',o=a.station_type.charAt(0).toUpperCase()+a.station_type.slice(1),p=a.ideology?` (${a.ideology})`:"";t.innerHTML=`
        <div class="radio-sidebar-freq">
            <div class="radio-sidebar-dot" style="background:${i};box-shadow:0 0 6px ${i}44;"></div>
            <span class="radio-sidebar-freq-label" style="color:${i};">${d(a.frequency)}</span>
        </div>
        <div class="radio-sidebar-name">${d(a.callsign)} &mdash; ${d(a.name)}</div>
        ${a.description?`<div class="radio-sidebar-desc">${d(a.description)}</div>`:""}

        <div class="radio-sidebar-row">
            <span class="radio-sidebar-label">Type</span>
            <span class="radio-sidebar-value" style="color:${i};">${d(o)}${d(p)}</span>
        </div>
        <div class="radio-sidebar-row">
            <span class="radio-sidebar-label">Broadcasts</span>
            <span class="radio-sidebar-value">${h.length}</span>
        </div>
        <div class="radio-sidebar-row">
            <span class="radio-sidebar-label">Personalities</span>
            <span class="radio-sidebar-value">${_.length}</span>
        </div>

        <div class="radio-sidebar-section">
            <div class="radio-sidebar-section-title">Personalities</div>
            ${s}
            ${$t(a)}
        </div>
    `}function $t(a){const t=vt(a);return t.allowed?'<div class="radio-sidebar-cta" id="radio-create-pers-btn">Create Personality</div>':`<div style="margin-top:8px;padding:5px 8px;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);border:1px solid var(--border-main);text-align:center;opacity:0.6;" title="${d(t.reason)}">${d(t.reason)}</div>`}function j(a){const t=document.getElementById("radio-feed-count"),i=document.getElementById("radio-feed-scroll");if(!t||!i)return;const s=!a;if(t.textContent=`${h.length} broadcast${h.length!==1?"s":""}${s?" (all stations)":""}`,h.length===0){i.innerHTML=`
            <div class="radio-feed-empty">
                <div class="radio-feed-empty-text">No broadcasts yet.</div>
                <div class="radio-feed-empty-sub">Be the first to go live on this station.</div>
            </div>
        `;return}i.innerHTML=h.map(o=>{const e=(o.tags||[]).map(I=>`<span style="padding:2px 7px;font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-dim);border:1px solid var(--border-mid);line-height:14px;">${d(I)}</span>`).join(""),l=_.find(I=>I.id===o.personality_id)?.name||"Unknown",c=J.find(I=>I.id===o.station_id)||$.find(I=>I.id===o.station_id),r=c?.nations?.name||"",f=k[c?.station_type]||"var(--text-dim)",v=c?`${c.frequency} — ${c.callsign}${r?" · "+r:""}`:"",m=M===o.id,u=N.has(o.id),x=m?"font-family:var(--font-serif);font-size:14px;color:var(--text-secondary);line-height:1.7;margin-bottom:10px;":"font-family:var(--font-serif);font-size:14px;color:var(--text-secondary);line-height:1.6;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;",E=u?"padding:5px 14px;cursor:pointer;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.04em;color:var(--bg-body);background:var(--green);border:1px solid var(--green);":"padding:5px 14px;cursor:pointer;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.04em;color:var(--green);background:transparent;border:1px solid var(--green-border);";return`
            <div style="border-bottom:1px solid var(--border-main);">
                <div style="padding:14px 20px;cursor:pointer;" data-bc-toggle="${o.id}">
                    ${v?`<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                        <span style="width:6px;height:6px;border-radius:50%;background:${f};flex-shrink:0;box-shadow:0 0 4px ${f}44;"></span>
                        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${f};letter-spacing:0.04em;">${d(v)}</span>
                    </div>`:""}
                    <div style="font-family:var(--font-serif);font-size:18px;font-weight:600;color:var(--text-bright);line-height:1.3;margin-bottom:6px;">${d(o.subject)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                        <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);font-weight:600;">${d(l)}</span>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">&middot;</span>
                        <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">Tick ${o.published_tick||"?"}</span>
                    </div>
                    <div style="${x}">${m?tt(o.body):d(o.body)}</div>
                    ${e?`<div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap;">${e}</div>`:""}
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:8px;border-top:1px solid var(--border-main);">
                        <div style="display:flex;gap:12px;">
                            <div style="display:flex;align-items:center;gap:4px;">
                                <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">LISTENERS</span>
                                <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--green);" id="gl-count-${o.id}">${o.good_listen_count||0}</span>
                            </div>
                        </div>
                        <div style="display:flex;gap:6px;align-items:center;">
                            ${o.faction_id===y.faction?.id?`<div data-bc-edit="${o.id}" style="padding:5px 12px;cursor:pointer;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.04em;color:var(--text-dim);background:transparent;border:1px solid var(--border-mid);">EDIT</div>`:""}
                            <div style="${E}" data-gl-btn="${o.id}" id="gl-btn-${o.id}">${u?"✓ LISTEN":"LISTEN"}</div>
                        </div>
                    </div>
                </div>
            </div>
        `}).join("")}let D=new Set;async function _t(a){if(D.has(a))return;D.add(a);const t=document.getElementById("gl-btn-"+a),i=document.getElementById("gl-count-"+a);t&&(t.style.opacity="0.5");try{const s=y.shard?.current_tick||0,{data:o,error:p}=await g.rpc("toggle_broadcast_good_listen",{p_broadcast_id:a,p_faction_id:y.faction?.id,p_tick:s});if(p){console.error("[Radio] Good listen failed:",p.message);return}o.liked?N.add(a):N.delete(a);const e=h.find(n=>n.id===a);e&&(e.good_listen_count=o.good_listen_count),t&&(o.liked?(t.style.color="var(--bg-body)",t.style.background="var(--green)",t.style.borderColor="var(--green)",t.textContent="✓ LISTEN"):(t.style.color="var(--green)",t.style.background="transparent",t.style.borderColor="var(--green-border)",t.textContent="LISTEN")),i&&(i.textContent=o.good_listen_count)}catch(s){console.error("[Radio] Good listen error:",s)}finally{D.delete(a),t&&(t.style.opacity="1")}}const at=["POLITICS","ECONOMY","CONSTRUCTION","LABOR","CORRUPTION","BUSINESS","MILITARY","SOCIAL"];function it(a){const t=document.getElementById("radio-broadcast-modal");if(!t)return;const i=k[a.station_type]||"var(--text-dim)",s=_.filter(r=>r.faction_id===y.faction?.id);if(s.length===0)return;const o=s.map((r,f)=>`<option value="${r.id}" ${f===0?"selected":""}>${d(r.name)}${r.title?" — "+d(r.title):""}</option>`).join(""),p=at.map(r=>`<span class="radio-bc-tag" data-tag="${r}" style="padding:3px 7px;font-family:var(--font-mono);font-size:7px;font-weight:700;cursor:pointer;color:var(--text-dim);background:transparent;border:1px solid var(--border-mid);letter-spacing:0.04em;user-select:none;">${r}</span>`).join("");t.innerHTML=`
        <div class="radio-modal" style="width:500px;">
            <div class="radio-modal-header">
                <div class="radio-modal-header-left">
                    <div class="radio-modal-dot" style="background:${i};"></div>
                    <span class="radio-modal-title">Start Broadcast</span>
                </div>
                <button class="radio-modal-close" id="radio-bc-close">&times;</button>
            </div>
            <div style="padding:8px 16px;border-bottom:1px solid var(--border-main);background:${i}08;display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="width:5px;height:5px;border-radius:50%;background:${i};display:inline-block;"></span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Broadcasting on:</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${i};">${d(a.callsign)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${d(a.frequency)}</span>
                </div>
            </div>
            <div class="radio-modal-body" style="gap:14px;">
                <div>
                    <div class="radio-modal-step-label">1 &mdash; Personality</div>
                    <select class="radio-modal-input" id="radio-bc-personality" style="font-family:var(--font-ui);font-size:11px;">
                        ${o}
                    </select>
                </div>
                <div>
                    <div class="radio-modal-step-label">2 &mdash; Subject</div>
                    <input class="radio-modal-input" id="radio-bc-subject" placeholder="e.g., Breaking: Port Workers Announce Strike" style="font-family:var(--font-serif);font-size:13px;">
                </div>
                <div>
                    <div class="radio-modal-step-label">3 &mdash; Broadcast Content</div>
                    <textarea class="radio-modal-input" id="radio-bc-body" rows="10" placeholder="Write your broadcast script...&#10;&#10;Use blank lines for paragraph breaks." style="resize:vertical;font-family:var(--font-serif);font-size:11px;line-height:1.65;"></textarea>
                    <div style="display:flex;justify-content:space-between;margin-top:3px;">
                        <span id="radio-bc-charcount" style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">0 characters</span>
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">Use blank lines for paragraph breaks</span>
                    </div>
                </div>
                <div>
                    <div class="radio-modal-step-label">4 &mdash; Tags</div>
                    <div style="display:flex;gap:3px;flex-wrap:wrap;" id="radio-bc-tags">${p}</div>
                </div>
            </div>
            <div class="radio-modal-footer">
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-right:auto;">FREE</span>
                <button class="radio-modal-btn radio-modal-btn--cancel" id="radio-bc-cancel">Cancel</button>
                <button class="radio-modal-btn radio-modal-btn--submit" id="radio-bc-submit" disabled style="background:var(--accent);">Go Live</button>
            </div>
        </div>
    `,t.classList.add("active");const e=new Set,n=()=>t.classList.remove("active");document.getElementById("radio-bc-close")?.addEventListener("click",n),document.getElementById("radio-bc-cancel")?.addEventListener("click",n),t.addEventListener("click",r=>{r.target===t&&n()}),document.getElementById("radio-bc-tags")?.addEventListener("click",r=>{const f=r.target.closest(".radio-bc-tag");if(!f)return;const v=f.dataset.tag;e.has(v)?(e.delete(v),f.style.color="var(--text-dim)",f.style.background="transparent",f.style.borderColor="var(--border-mid)"):(e.add(v),f.style.color="var(--accent)",f.style.background="var(--amber-faint)",f.style.borderColor="var(--amber-border)")});const l=()=>{const r=document.getElementById("radio-bc-subject")?.value?.trim(),f=document.getElementById("radio-bc-body")?.value?.trim(),v=document.getElementById("radio-bc-submit");v&&(v.disabled=!(r&&f));const m=document.getElementById("radio-bc-charcount");m&&(m.textContent=`${(f||"").length} characters`)};document.getElementById("radio-bc-subject")?.addEventListener("input",l),document.getElementById("radio-bc-body")?.addEventListener("input",l);let c=!1;document.getElementById("radio-bc-submit")?.addEventListener("click",async()=>{if(c)return;const r=document.getElementById("radio-bc-subject")?.value?.trim(),f=document.getElementById("radio-bc-body")?.value?.trim(),v=document.getElementById("radio-bc-personality")?.value;if(!r||!f||!v)return;c=!0;const m=document.getElementById("radio-bc-submit");m&&(m.disabled=!0,m.textContent="Broadcasting...");try{const{data:u,error:x}=await g.from("radio_broadcasts").insert({station_id:a.id,personality_id:v,faction_id:y.faction?.id,subject:r,body:f,tags:[...e],published_tick:y.shard?.current_tick||null}).select("*").single();if(x){console.error("[Radio] Broadcast failed:",x.message),alert("Failed to broadcast: "+x.message);return}h.unshift(u),n(),j(a)}catch(u){console.error("[Radio] Broadcast error:",u)}finally{c=!1,m&&(m.disabled=!1,m.textContent="Go Live")}})}function Et(a){const t=h.find(m=>m.id===a);if(!t||t.faction_id!==y.faction?.id)return;const i=J.find(m=>m.id===t.station_id)||$.find(m=>m.id===t.station_id);if(!i)return;const s=document.getElementById("radio-broadcast-modal");if(!s)return;const o=k[i.station_type]||"var(--text-dim)",e=_.filter(m=>m.faction_id===y.faction?.id).map(m=>`<option value="${m.id}" ${m.id===t.personality_id?"selected":""}>${d(m.name)}${m.title?" — "+d(m.title):""}</option>`).join(""),n=new Set(t.tags||[]),l=at.map(m=>{const u=n.has(m);return`<span class="radio-bc-tag" data-tag="${m}" style="padding:4px 10px;cursor:pointer;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.04em;border:1px solid ${u?"var(--amber-border)":"var(--border-mid)"};color:${u?"var(--accent)":"var(--text-dim)"};background:${u?"var(--amber-faint)":"transparent"};">${m}</span>`}).join("");s.innerHTML=`
        <div class="radio-modal" style="width:500px;">
            <div class="radio-modal-header">
                <div class="radio-modal-header-left">
                    <div class="radio-modal-dot" style="background:${o};"></div>
                    <span class="radio-modal-title">Edit Broadcast</span>
                </div>
                <button class="radio-modal-close" id="radio-bc-close">&times;</button>
            </div>
            <div style="padding:8px 16px;border-bottom:1px solid var(--border-main);background:${o}08;display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="width:5px;height:5px;border-radius:50%;background:${o};display:inline-block;"></span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Editing on:</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${o};">${d(i.callsign)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${d(i.frequency)}</span>
                </div>
            </div>
            <div class="radio-modal-body" style="gap:14px;">
                <div>
                    <div class="radio-modal-step-label">1 — Personality</div>
                    <select class="radio-modal-input" id="radio-bc-personality" style="font-family:var(--font-ui);font-size:11px;">
                        ${e}
                    </select>
                </div>
                <div>
                    <div class="radio-modal-step-label">2 — Subject</div>
                    <input class="radio-modal-input" id="radio-bc-subject" value="${d(t.subject)}" style="font-family:var(--font-serif);font-size:13px;">
                </div>
                <div>
                    <div class="radio-modal-step-label">3 — Broadcast Content</div>
                    <textarea class="radio-modal-input" id="radio-bc-body" rows="10" style="resize:vertical;font-family:var(--font-serif);font-size:11px;line-height:1.65;">${d(t.body)}</textarea>
                    <div style="display:flex;justify-content:space-between;margin-top:3px;">
                        <span id="radio-bc-charcount" style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${(t.body||"").length} characters</span>
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">Use blank lines for paragraph breaks</span>
                    </div>
                </div>
                <div>
                    <div class="radio-modal-step-label">4 — Tags</div>
                    <div style="display:flex;gap:3px;flex-wrap:wrap;" id="radio-bc-tags">${l}</div>
                </div>
            </div>
            <div class="radio-modal-footer">
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-right:auto;">EDITING</span>
                <button class="radio-modal-btn radio-modal-btn--cancel" id="radio-bc-cancel">Cancel</button>
                <button class="radio-modal-btn radio-modal-btn--submit" id="radio-bc-submit" style="background:var(--accent);">Update</button>
            </div>
        </div>
    `,s.classList.add("active");const c=new Set(t.tags||[]),r=()=>s.classList.remove("active");document.getElementById("radio-bc-close")?.addEventListener("click",r),document.getElementById("radio-bc-cancel")?.addEventListener("click",r),s.addEventListener("click",m=>{m.target===s&&r()}),document.getElementById("radio-bc-tags")?.addEventListener("click",m=>{const u=m.target.closest(".radio-bc-tag");if(!u)return;const x=u.dataset.tag;c.has(x)?(c.delete(x),u.style.color="var(--text-dim)",u.style.background="transparent",u.style.borderColor="var(--border-mid)"):(c.add(x),u.style.color="var(--accent)",u.style.background="var(--amber-faint)",u.style.borderColor="var(--amber-border)")});const f=()=>{const m=document.getElementById("radio-bc-subject")?.value?.trim(),u=document.getElementById("radio-bc-body")?.value?.trim(),x=document.getElementById("radio-bc-submit");x&&(x.disabled=!(m&&u));const E=document.getElementById("radio-bc-charcount");E&&(E.textContent=`${(u||"").length} characters`)};document.getElementById("radio-bc-subject")?.addEventListener("input",f),document.getElementById("radio-bc-body")?.addEventListener("input",f);let v=!1;document.getElementById("radio-bc-submit")?.addEventListener("click",async()=>{if(v)return;const m=document.getElementById("radio-bc-subject")?.value?.trim(),u=document.getElementById("radio-bc-body")?.value?.trim(),x=document.getElementById("radio-bc-personality")?.value;if(!m||!u||!x)return;v=!0;const E=document.getElementById("radio-bc-submit");E&&(E.disabled=!0,E.textContent="Updating...");try{const{data:I,error:F}=await g.from("radio_broadcasts").update({personality_id:x,subject:m,body:u,tags:[...c]}).eq("id",a).eq("faction_id",y.faction?.id).select("*").single();if(F){console.error("[Radio] Edit failed:",F.message),alert("Failed to update: "+F.message);return}const U=h.findIndex(G=>G.id===a);U>=0&&(h[U]={...h[U],...I}),r();const lt=$.find(G=>G.id===z);j(lt)}catch(I){console.error("[Radio] Edit error:",I)}finally{v=!1,E&&(E.disabled=!1,E.textContent="Update")}})}function It(a){const t=document.getElementById("radio-personality-modal");if(!t)return;const i=k[a.station_type]||"var(--text-dim)";t.innerHTML=`
        <div class="radio-modal">
            <div class="radio-modal-header">
                <div class="radio-modal-header-left">
                    <div class="radio-modal-dot" style="background:${i};"></div>
                    <span class="radio-modal-title">Create Personality</span>
                </div>
                <button class="radio-modal-close" id="radio-pers-close">&times;</button>
            </div>
            <div style="padding:8px 16px;border-bottom:1px solid var(--border-main);background:${i}08;display:flex;align-items:center;gap:8px;">
                <span style="width:5px;height:5px;border-radius:50%;background:${i};display:inline-block;"></span>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Station:</span>
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${i};">${d(a.callsign)} &mdash; ${d(a.name)}</span>
            </div>
            <div class="radio-modal-body">
                <div>
                    <div class="radio-modal-step-label">Personality Name</div>
                    <input class="radio-modal-input" id="radio-pers-name" placeholder="e.g., Daniela V&aacute;squez" style="font-family:var(--font-ui);font-size:13px;">
                </div>
                <div>
                    <div class="radio-modal-step-label">Title / Role (optional)</div>
                    <input class="radio-modal-input" id="radio-pers-title" placeholder="e.g., Opposition Voice, Economics Desk" style="font-family:var(--font-ui);font-size:11px;">
                </div>
                <div style="padding:6px 10px;background:var(--amber-faint);border:1px solid var(--amber-border);">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);margin-bottom:2px;">INFO</div>
                    <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">
                        Radio personalities are cosmetic hosts for your broadcasts. You can have up to <strong style="color:var(--text-bright);">3</strong> per station. They will be affiliated with <strong style="color:var(--accent);">${d(y.faction?.name||"your party")}</strong>.
                    </div>
                </div>
            </div>
            <div class="radio-modal-footer">
                <button class="radio-modal-btn radio-modal-btn--cancel" id="radio-pers-cancel">Cancel</button>
                <button class="radio-modal-btn radio-modal-btn--submit" id="radio-pers-submit">Create</button>
            </div>
        </div>
    `,t.classList.add("active");const s=()=>t.classList.remove("active");document.getElementById("radio-pers-close")?.addEventListener("click",s),document.getElementById("radio-pers-cancel")?.addEventListener("click",s),t.addEventListener("click",p=>{p.target===t&&s()});let o=!1;document.getElementById("radio-pers-submit")?.addEventListener("click",async()=>{if(o)return;const p=document.getElementById("radio-pers-name")?.value?.trim(),e=document.getElementById("radio-pers-title")?.value?.trim();if(!p)return;o=!0;const n=document.getElementById("radio-pers-submit");n&&(n.disabled=!0,n.textContent="Creating...");try{const{data:l,error:c}=await g.from("radio_personalities").insert({station_id:a.id,faction_id:y.faction?.id,name:p,title:e||null}).select("*").single();if(c){console.error("[Radio] Create personality failed:",c.message),alert("Failed to create personality: "+c.message);return}_.push(l),s(),et(a)}catch(l){console.error("[Radio] Create personality error:",l)}finally{o=!1,n&&(n.disabled=!1,n.textContent="Create")}})}let b={stationType:"general",ideology:null,callsign:"",name:"",frequency:"92.0",description:""};function O(){const a=pt.map(e=>`
        <div class="radio-type-card ${e.id===b.stationType?"active":""} ${e.locked?"locked":""}"
             data-type="${e.id}" ${e.locked,""}>
            <div>
                <div class="radio-type-name" style="color:${e.id===b.stationType?k[e.id]:""};">${d(e.name)}</div>
                <div class="radio-type-desc">${d(e.desc)}</div>
            </div>
            ${e.locked?'<span style="font-size:8px;color:var(--red);font-family:var(--font-mono);font-weight:700;">LOCKED</span>':""}
        </div>
    `).join(""),t=mt.map(e=>`
        <div class="radio-ideology-card ${b.ideology===e.tag?"active":""}"
             data-ideology="${e.tag}" style="${b.ideology===e.tag?`color:${e.color};border-color:${e.color}44;background:${e.color}12;`:""}">
            ${e.label}
        </div>
    `).join(""),i=$.map(e=>{const n=parseFloat(e.frequency);return isNaN(n)?null:{freq:n,callsign:e.callsign,color:k[e.station_type]||"var(--text-dim)"}}).filter(Boolean),s=i.map(e=>`<div class="radio-freq-marker" style="background:${e.color};left:${(e.freq-87.5)/20.5*100}%;" title="${e.freq} ${e.callsign}"></div>`).join(""),o=i.map(e=>`<span class="radio-freq-legend-item"><span class="radio-freq-legend-dot" style="background:${e.color};"></span><span style="color:${e.color};">${e.freq} ${e.callsign}</span></span>`).join(""),p=(parseFloat(b.frequency)-87.5)/20.5*100;return`
        <div class="radio-modal">
            <div class="radio-modal-header">
                <div class="radio-modal-header-left">
                    <div class="radio-modal-dot"></div>
                    <span class="radio-modal-title">Start a Station</span>
                </div>
                <button class="radio-modal-close" id="radio-modal-close">&times;</button>
            </div>
            <div class="radio-modal-body">

                <!-- Step 1: Station Type -->
                <div>
                    <div class="radio-modal-step-label">1 &mdash; Station Type</div>
                    <div class="radio-type-grid" id="radio-type-grid">${a}</div>
                    <div class="radio-ideology-grid ${b.stationType==="political"?"visible":""}" id="radio-ideology-grid">${t}</div>
                </div>

                <!-- Step 2: Frequency -->
                <div>
                    <div class="radio-modal-step-label">2 &mdash; Frequency Band</div>
                    <div class="radio-freq-band">
                        ${s}
                        <div class="radio-freq-cursor" id="radio-freq-cursor" style="left:${p}%;"></div>
                        <input type="range" class="radio-freq-range" id="radio-freq-slider" min="875" max="1080" value="${Math.round(parseFloat(b.frequency)*10)}" step="1">
                    </div>
                    <div class="radio-freq-labels"><span>87.5</span><span>108.0</span></div>
                    ${o?`<div class="radio-freq-legend">${o}</div>`:""}
                    <div class="radio-freq-display">
                        <span class="radio-freq-value" id="radio-freq-value">${b.frequency} FM</span>
                        <span class="radio-freq-status radio-freq-status--available" id="radio-freq-status">AVAILABLE</span>
                    </div>
                </div>

                <!-- Step 3: Name -->
                <div>
                    <div class="radio-modal-step-label">3 &mdash; Callsign &amp; Name</div>
                    <div class="radio-modal-row">
                        <input class="radio-modal-input radio-modal-input--callsign" id="radio-input-callsign" maxlength="5" placeholder="MHZ" value="${d(b.callsign)}">
                        <input class="radio-modal-input" id="radio-input-name" placeholder="Full station name (e.g. Melizean Free Radio)" value="${d(b.name)}" style="flex:1;">
                    </div>
                </div>

                <!-- Step 4: Description -->
                <div>
                    <div class="radio-modal-step-label">4 &mdash; Description (optional)</div>
                    <textarea class="radio-modal-input" id="radio-input-desc" rows="2" placeholder="What does this station cover?" style="resize:none;font-family:var(--font-ui);font-size:13px;line-height:1.5;">${d(b.description)}</textarea>
                </div>

            </div>
            <div class="radio-modal-footer">
                <button class="radio-modal-btn radio-modal-btn--cancel" id="radio-modal-cancel">Cancel</button>
                <button class="radio-modal-btn radio-modal-btn--submit" id="radio-modal-submit">Launch Station</button>
            </div>
        </div>
    `}var W=[];async function kt(){b={stationType:"general",ideology:null,callsign:"",name:"",frequency:"92.0",description:""};try{var{data:a}=await g.from("radio_stations").select("frequency, callsign");W=(a||[]).map(function(i){return{freq:parseFloat(i.frequency),callsign:i.callsign}}).filter(function(i){return!isNaN(i.freq)})}catch{W=[]}const t=document.getElementById("radio-create-modal");t&&(t.innerHTML=O(),t.classList.add("active"))}function ot(){document.getElementById("radio-create-modal")?.classList.remove("active")}let P=!1;async function Bt(){if(P)return;const{callsign:a,name:t,frequency:i,stationType:s,ideology:o,description:p}=b;if(!a.trim()||!t.trim()||s==="political"&&!o)return;P=!0;const e=document.getElementById("radio-modal-submit");e&&(e.disabled=!0,e.textContent="Launching...");try{const n=parseFloat(i),{data:l}=await g.from("radio_stations").select("id, callsign, frequency").order("created_at"),c=(l||[]).find(v=>{const m=parseFloat(v.frequency);return!isNaN(m)&&Math.abs(m-n)<.05});if(c){alert(`Frequency ${i} FM is already taken by station ${c.callsign}. Choose a different frequency.`),P=!1,e&&(e.disabled=!1,e.textContent="Launch Station");return}const{data:r,error:f}=await g.from("radio_stations").insert({nation_id:y.nation?.id,creator_faction_id:y.faction?.id,callsign:a.trim().toUpperCase(),name:t.trim(),frequency:i+" FM",station_type:s,ideology:s==="political"?o:null,description:p.trim()||null,created_at_tick:y.shard?.current_tick||null}).select("*").single();if(f){console.error("[Radio] Create station failed:",f.message),alert("Failed to create station: "+f.message);return}$.push(r),z=r.id,ot(),T(document.getElementById("broadcast-root"))}catch(n){console.error("[Radio] Create station error:",n)}finally{P=!1,e&&(e.disabled=!1,e.textContent="Launch Station")}}async function wt(){const a=document.getElementById("broadcast-root");if(!a)return;if(C.length===0){const{data:i}=await g.from("nations").select("id, name, government_type, flag_url").order("name");C=i||[]}const t=y.nation?.id;L||(L=C.find(s=>s.id!==t)?.id||C[0]?.id||null),await nt(),T(a)}async function nt(){if(!L){q=[],w=[];return}const{data:a}=await g.from("radio_stations").select("*").eq("nation_id",L).order("created_at",{ascending:!0});q=a||[],B=q[0]?.id||null,B?await st():w=[]}async function st(){if(!B){w=[];return}const[a,t]=await Promise.all([g.from("radio_broadcasts").select("*").eq("station_id",B).order("created_at",{ascending:!1}).limit(50),g.from("radio_personalities").select("id, name, title").eq("station_id",B)]);w=a.data||[];const i={};for(const s of t.data||[])i[s.id]=s;for(const s of w)s._personality=i[s.personality_id]||null}function Lt(){const a=y.nation?.id,t=C.map(e=>{const n=e.id===L,l=e.id===a;return`<div class="radio-tunein-nation ${n?"active":""}" data-nation-id="${e.id}">
            ${d(e.name)}${l?' <span style="color:var(--green);font-size:9px;">(YOU)</span>':""}
        </div>`}).join(""),i=C.find(e=>e.id===L),s=q.length>0?q.map(e=>{const n=k[e.station_type]||"var(--text-dim)";return`<div class="radio-tunein-station ${e.id===B?"active":""}" data-station-id="${e.id}" style="border-left-color:${n};">
                <div class="radio-tunein-station-name">${d(e.callsign)} &mdash; ${d(e.name)}</div>
                <div class="radio-tunein-station-meta">${d(e.frequency)} &middot; <span style="color:${n};">${d(e.station_type.toUpperCase())}</span></div>
            </div>`}).join(""):'<div class="radio-tunein-empty">No stations in this nation yet.</div>',o=q.find(e=>e.id===B);let p="";if(o&&w.length>0){const e=w.map(n=>{const l=n._personality?.name||"Unknown",c=(n.tags||[]).map(r=>`<span class="radio-tunein-bc-tag">${d(r)}</span>`).join("");return`<div class="radio-tunein-bc">
                <div class="radio-tunein-bc-subject">${d(n.subject)}</div>
                <div class="radio-tunein-bc-meta">
                    <span style="font-weight:600;color:var(--text-secondary);">${d(l)}</span>
                    <span>&middot;</span>
                    <span>Tick ${n.published_tick??"?"}</span>
                    <span>&middot;</span>
                    <span>${n.good_listen_count||0} &#128266;</span>
                </div>
                <div class="radio-tunein-bc-body">${tt(n.body)}</div>
                ${c?`<div class="radio-tunein-bc-tags">${c}</div>`:""}
            </div>`}).join("");p=`<div class="radio-tunein-timeline">
            <div class="radio-tunein-timeline-header">Timeline &mdash; ${d(o.callsign)} ${d(o.frequency)}</div>
            <div style="max-height:500px;overflow-y:auto;">${e}</div>
        </div>`}else o&&(p=`<div class="radio-tunein-timeline">
            <div class="radio-tunein-timeline-header">Timeline &mdash; ${d(o.callsign)} ${d(o.frequency)}</div>
            <div class="radio-tunein-empty">No broadcasts on this station yet.</div>
        </div>`);return`
        <div style="margin-top:8px;">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:8px;">Select a Nation</div>
            <div class="radio-tunein-nations" id="radio-tunein-nations">${t}</div>

            <div style="display:flex;gap:10px;align-items:flex-start;">
                <div style="width:260px;flex-shrink:0;">
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);letter-spacing:0.1em;text-transform:uppercase;margin-bottom:6px;">Stations${i?" in "+d(i.name):""}</div>
                    ${s}
                </div>
                <div style="flex:1;min-width:0;">${p}</div>
            </div>
        </div>
    `}let dt=[],H="nation",Q="political",A=[];async function Ct(){const a=y.shard?.current_tick||0,t=Math.max(1,a-48),[i,s]=await Promise.all([g.from("event_log").select("id, nation_id, event_name, category, fired_at_tick, description_chosen").gte("fired_at_tick",t).order("fired_at_tick",{ascending:!1}).limit(100),A.length===0?g.from("nations").select("id, name, flag_url").order("name"):{data:A}]);dt=i.data||[],s.data&&(A=s.data),Y();const o=document.getElementById("radio-events-type-tabs");o&&!o._wired&&(o._wired=!0,o.addEventListener("click",e=>{const n=e.target.closest(".radio-events-tab");!n||!n.dataset.type||(Q=n.dataset.type,o.querySelectorAll(".radio-events-tab").forEach(l=>l.classList.toggle("active",l.dataset.type===Q)),Y())}));const p=document.getElementById("radio-events-scope-tabs");p&&!p._wired&&(p._wired=!0,p.addEventListener("click",e=>{const n=e.target.closest(".radio-events-tab");!n||!n.dataset.scope||(H=n.dataset.scope,p.querySelectorAll(".radio-events-tab").forEach(l=>l.classList.toggle("active",l.dataset.scope===H)),Y())}))}function Y(){const a=document.getElementById("radio-events-scroll");if(!a)return;const t=y.nation?.id,i=new Set(["government","political","crisis","diplomatic","military","trade","economic"]),s=new Set(["corporate","ipo","shipping","insurance","corp_action"]);let o=dt;if(Q==="corporate"?o=o.filter(e=>s.has(e.category)):o=o.filter(e=>i.has(e.category)||!s.has(e.category)),H==="nation"&&t&&(o=o.filter(e=>e.nation_id===t)),o.length===0){a.innerHTML='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);font-style:italic;">No recent events.</div>';return}const p={government:{color:"#8b9a6b",bg:"rgba(139,154,107,0.06)",border:"rgba(139,154,107,0.2)"},political:{color:"#c8a832",bg:"rgba(200,168,50,0.06)",border:"rgba(200,168,50,0.2)"},crisis:{color:"#d44a4a",bg:"rgba(212,74,74,0.06)",border:"rgba(212,74,74,0.2)"},trade:{color:"#5aaa8a",bg:"rgba(90,170,138,0.06)",border:"rgba(90,170,138,0.2)"},diplomatic:{color:"#5a8aaa",bg:"rgba(90,138,170,0.06)",border:"rgba(90,138,170,0.2)"},military:{color:"#c84",bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.2)"},corporate:{color:"#5aaa8a",bg:"rgba(90,170,138,0.06)",border:"rgba(90,170,138,0.2)"},economic:{color:"#c8a832",bg:"rgba(200,168,50,0.06)",border:"rgba(200,168,50,0.2)"}};a.innerHTML=o.map(e=>{const n=e.category||"government",l=p[n]||p.government,r=e.description_chosen||e.event_name||"";let f="";if(H==="world"){const v=A.find(m=>m.id===e.nation_id);v&&(f=`<div style="display:flex;align-items:center;gap:4px;margin-top:3px;">
                    <img src="${v.flag_url||`assets/flags/${v.name}.png`}" style="width:16px;height:11px;object-fit:cover;border:1px solid var(--border-main);" onerror="this.style.display='none'" alt="">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${d(v.name)}</span>
                </div>`)}return`<div style="padding:8px 14px;border-bottom:1px solid var(--border-main);">
            <div style="display:flex;gap:8px;align-items:flex-start;">
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);flex-shrink:0;width:26px;">${e.fired_at_tick}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 5px;color:${l.color};background:${l.bg};border:1px solid ${l.border};flex-shrink:0;text-transform:uppercase;">${d(n)}</span>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:12px;color:var(--text-secondary);line-height:1.4;">${d(r)}</div>
                    ${f}
                </div>
            </div>
        </div>`}).join("")}let R=null,Z=!1,X=!1;function rt(a){document.querySelectorAll(".home-subtab").forEach(t=>t.classList.toggle("active",t.dataset.panel===a)),document.querySelectorAll(".home-panel").forEach(t=>t.classList.toggle("active",t.id==="panel-"+a)),sessionStorage.setItem("home_subtab",a),a==="news"&&!Z&&R&&(Z=!0,K(V,R)),a==="broadcast"&&!X&&R&&(X=!0,ut(V,R))}document.getElementById("home-subtabs").addEventListener("click",a=>{const t=a.target.closest(".home-subtab");!t||t.classList.contains("active")||rt(t.dataset.panel)});ct("dashboard",async a=>{R=a,sessionStorage.getItem("home_subtab")==="broadcast"?rt("broadcast"):(Z=!0,await K(V,a))});
