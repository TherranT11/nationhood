import{_supabase as V}from"./supabase-client-CiYoFhIh.js";/* empty css                  */import{i as K}from"./news-CGjFihbK.js";import{i as pt}from"./common-DtfiRwOl.js";import"./preload-helper-BXl3LOEh.js";import"./utils-CY90Gazr.js";let y=null,g=null,h=[],R=null,$=[],_=[],W=null,N=new Set,M=null,Z=[],C=!1,S=[],L=null,T=[],B=null,w=[];const mt=[{id:"general",name:"General News",desc:"Broad coverage. Wide appeal. Moderate influence per broadcast.",locked:!1},{id:"opposition",name:"Opposition",desc:"Anti-government lean. High credibility with dissidents.",locked:!1},{id:"political",name:"Political",desc:"Ideology-aligned. Only parties with 20+ in the ideology can broadcast.",locked:!1},{id:"underground",name:"Underground / Pirate",desc:"Evades detection. Can be raided. High trust among radicals.",locked:!1},{id:"commercial",name:"Commercial / Pro-Business",desc:"Financed by advertisers. High reach. Biased toward corporate interests.",locked:!1},{id:"state",name:"State Station",desc:"Requires government ownership or a ruling party mandate.",locked:!0}],tt=[{tag:"LIBERTY",label:"Liberty",color:"#3b82f6"},{tag:"EQUALITY",label:"Equality",color:"#ef4444"},{tag:"TRADITION",label:"Tradition",color:"#a855f7"},{tag:"PROGRESS",label:"Progress",color:"#22c55e"},{tag:"SECURITY",label:"Security",color:"#f59e0b"},{tag:"FREEDOM",label:"Freedom",color:"#06b6d4"},{tag:"GLOBALISM",label:"Globalism",color:"#14b8a6"},{tag:"NATIONALISM",label:"Nationalism",color:"#f97316"},{tag:"INDIVIDUALISM",label:"Individualism",color:"#eab308"},{tag:"COLLECTIVISM",label:"Collectivism",color:"#ec4899"}],k={general:"var(--accent)",opposition:"var(--red)",political:"#8b7ec8",underground:"var(--orange)",commercial:"var(--blue)",state:"var(--amber)"};function d(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function et(e){return e?e.split(/\n\n+/).map(t=>{const i=d(t.trim());return i?`<p style="margin:0 0 12px 0;">${i.replace(/\n/g,"<br>")}</p>`:""}).filter(Boolean).join(""):""}function ft(e){return(e||"??").split(/\s+/).map(t=>t[0]).join("").toUpperCase().slice(0,2)}const vt={LIBERTY:{axis:"liberty_equality",dir:-1},EQUALITY:{axis:"liberty_equality",dir:1},TRADITION:{axis:"tradition_progress",dir:-1},PROGRESS:{axis:"tradition_progress",dir:1},SECURITY:{axis:"security_freedom",dir:-1},FREEDOM:{axis:"security_freedom",dir:1},GLOBALISM:{axis:"globalism_nationalism",dir:-1},NATIONALISM:{axis:"globalism_nationalism",dir:1},INDIVIDUALISM:{axis:"individualism_collectivism",dir:-1},COLLECTIVISM:{axis:"individualism_collectivism",dir:1}};function ut(e,t){if(!e||t&&t.creator_faction_id===g.faction?.id)return!0;if(!W)return!1;const i=vt[e];return i?Number(W[i.axis]||0)*i.dir>=20:!1}function gt(e){return _.filter(i=>i.faction_id===g.faction?.id&&i.station_id===e.id).length>=3?{allowed:!1,reason:"Maximum 3 personalities per party per station."}:e.station_type==="political"&&!ut(e.ideology,e)?{allowed:!1,reason:`Requires 20+ ${tt.find(n=>n.tag===e.ideology)?.label||e.ideology} ideology to join this station.`}:{allowed:!0,reason:null}}async function yt(e,t){y=e,g=t;const i=document.getElementById("broadcast-root");if(!i)return;const n=t.nation?.id;if(!n){i.innerHTML='<div class="radio-empty"><div class="radio-empty-icon">&#128225;</div><div class="radio-empty-title">No Nation</div><div class="radio-empty-desc">Your party is not assigned to a nation.</div></div>';return}const[o,p]=await Promise.all([y.from("radio_stations").select("*").eq("nation_id",n).order("created_at",{ascending:!0}),y.from("faction_ideology").select("*").eq("faction_id",t.faction?.id).maybeSingle()]);if(o.error){console.error("[Radio] Failed to load stations:",o.error.message),i.innerHTML='<div class="radio-empty"><div class="radio-empty-title">Error loading stations</div></div>';return}h=o.data||[],W=p.data||null,bt(i),q(i)}function bt(e){e.addEventListener("click",async t=>{if(t.target.closest("#radio-create-btn")){wt();return}if(t.target.closest("#radio-tunein-btn")){C=!C,C?St():q(e);return}const i=t.target.closest(".radio-station-tab");if(i){$t(i.dataset.stationId);return}const n=t.target.closest(".radio-tunein-nation");if(n){L=n.dataset.nationId,B=null,w=[],await st(),q(e);return}const o=t.target.closest(".radio-tunein-station");if(o){B=o.dataset.stationId,await dt(),q(e);return}const p=t.target.closest(".radio-type-card");if(p&&!p.classList.contains("locked")){b.stationType=p.dataset.type,p.dataset.type!=="political"&&(b.ideology=null);const l=document.getElementById("radio-create-modal");l&&(l.innerHTML=P());return}const a=t.target.closest(".radio-ideology-card");if(a){b.ideology=a.dataset.ideology;const l=document.getElementById("radio-create-modal");l&&(l.innerHTML=P());return}if(t.target.closest("#radio-modal-close")||t.target.closest("#radio-modal-cancel")){nt();return}if(t.target.closest("#radio-modal-submit")){Lt();return}if(t.target.classList.contains("radio-modal-overlay")){t.target.classList.remove("active");return}if(t.target.closest("#radio-create-pers-btn")){const l=h.find(f=>f.id===R);l&&Bt(l);return}const s=t.target.closest("[data-gl-btn]");if(s){t.stopPropagation(),It(s.dataset.glBtn);return}const c=t.target.closest("[data-bc-edit]");if(c){t.stopPropagation(),kt(c.dataset.bcEdit);return}const r=t.target.closest("[data-bc-toggle]");if(r){const l=r.dataset.bcToggle;M=M===l?null:l;const f=h.find(v=>v.id===R);A(f);return}}),e.addEventListener("input",t=>{if(t.target.id==="radio-freq-slider"){const i=(t.target.value/10).toFixed(1);b.frequency=i;const n=(t.target.value-875)/205*100,o=document.getElementById("radio-freq-cursor");o&&(o.style.left=n+"%");const p=document.getElementById("radio-freq-value");p&&(p.textContent=i+" FM");const s=h.map(r=>parseFloat(r.frequency)).filter(r=>!isNaN(r)).some(r=>Math.abs(r-parseFloat(i))<.2),c=document.getElementById("radio-freq-status");c&&(c.textContent=s?"OCCUPIED":"AVAILABLE",c.className="radio-freq-status "+(s?"radio-freq-status--occupied":"radio-freq-status--available"))}t.target.id==="radio-input-callsign"&&(b.callsign=t.target.value),t.target.id==="radio-input-name"&&(b.name=t.target.value),t.target.id==="radio-input-desc"&&(b.description=t.target.value)})}function q(e){const t=g.nation?.name||"Unknown",i=h.length;e.innerHTML=`
        <div class="radio-page">
            <!-- Header -->
            <div class="radio-header">
                <div class="radio-header-left">
                    <span class="radio-title">Radio</span>
                    <span class="radio-nation-badge">${d(t)}</span>
                    <span class="radio-station-count">${i} station${i!==1?"s":""}</span>
                </div>
                <div class="radio-header-actions">
                    <button class="radio-btn radio-btn--outline" id="radio-tunein-btn">${C?"&#9664; Back":"&#128225; Tune In"}</button>
                    <button class="radio-btn radio-btn--outline" id="radio-broadcast-btn" disabled title="Create a personality on a station first">Start Broadcast</button>
                    <button class="radio-btn radio-btn--primary" id="radio-create-btn">Create Station</button>
                </div>
            </div>

            <div class="radio-two-col">
                <div class="radio-col-left">
                    ${C?Ct():i===0?xt():ht()}
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
            ${P()}
        </div>

        <!-- Create Personality Modal -->
        <div class="radio-modal-overlay" id="radio-personality-modal"></div>

        <!-- Start Broadcast Modal -->
        <div class="radio-modal-overlay" id="radio-broadcast-modal"></div>
    `,!C&&i>0&&_t(),Tt()}function xt(){return`
        <div class="radio-empty">
            <div class="radio-empty-icon">&#128225;</div>
            <div class="radio-empty-title">No Stations in ${d(g.nation?.name||"this nation")}</div>
            <div class="radio-empty-desc">Be the first to launch a radio station and start broadcasting to your nation.</div>
        </div>
    `}function ht(){return`
        <!-- Station tabs -->
        <div class="radio-station-tabs" id="radio-station-tabs">${h.map(t=>{const i=k[t.station_type]||"var(--text-dim)";return`
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
    `}async function $t(e){R=e;const t=h.find(r=>r.id===e);if(!t)return;document.querySelectorAll(".radio-station-tab").forEach(r=>{r.classList.toggle("active",r.dataset.stationId===e);const l=k[h.find(f=>f.id===r.dataset.stationId)?.station_type]||"var(--text-dim)";r.dataset.stationId===e?(r.style.borderColor=l,r.style.borderBottomColor=l):(r.style.borderColor="",r.style.borderBottomColor="transparent")});const i=g.faction?.id,[n,o,p]=await Promise.all([y.from("radio_personalities").select("*").eq("station_id",e),y.from("radio_broadcasts").select("*").eq("station_id",e).order("created_at",{ascending:!1}).limit(50),i?y.from("broadcast_good_listens").select("broadcast_id").eq("faction_id",i):{data:[]}]);n.error&&console.error("[Radio] Failed to load personalities:",n.error.message),o.error&&console.error("[Radio] Failed to load broadcasts:",o.error.message),_=n.data||[],$=o.data||[],N=new Set((p.data||[]).map(r=>r.broadcast_id)),M=null;const a=_.filter(r=>r.faction_id===i),s=document.getElementById("radio-broadcast-btn");s&&(s.disabled=a.length===0,s.title=a.length>0?"Broadcast on this station":"Create a personality on a station first",s.onclick=a.length>0?()=>ot(t):null);const c=document.getElementById("radio-sidebar");c&&(c.style.display=""),at(t),A(t)}async function _t(){const e=g.faction?.id,[t,i,n,o]=await Promise.all([y.from("radio_broadcasts").select("*").order("created_at",{ascending:!1}).limit(100),y.from("radio_personalities").select("*"),e?y.from("broadcast_good_listens").select("broadcast_id").eq("faction_id",e):{data:[]},y.from("radio_stations").select("id, callsign, frequency, station_type, nation_id, nations!inner(name)").order("created_at")]);Z=o.data||[],_=i.data||[],$=t.data||[],N=new Set((n.data||[]).map(c=>c.broadcast_id)),M=null,R=null;const p=_.filter(c=>c.faction_id===e),a=document.getElementById("radio-broadcast-btn");if(a&&(a.disabled=p.length===0,a.title=p.length>0?"Start a broadcast":"Create a personality on a station first",p.length>0)){const c=h.find(r=>p.some(l=>l.station_id===r.id));a.onclick=c?()=>ot(c):null}document.querySelectorAll(".radio-station-tab").forEach(c=>{c.classList.remove("active"),c.style.borderColor="",c.style.borderBottomColor="transparent"});const s=document.getElementById("radio-sidebar");s&&(s.style.display="none"),A(null)}function at(e){const t=document.getElementById("radio-sidebar");if(!t)return;const i=k[e.station_type]||"var(--text-dim)",n=_.length>0?_.map(a=>`
            <div class="radio-personality-row">
                <div class="radio-personality-avatar" style="color:${i};">${ft(a.name)}</div>
                <div>
                    <div class="radio-personality-name">${d(a.name)}</div>
                    ${a.title?`<div class="radio-personality-title">${d(a.title)}</div>`:""}
                </div>
            </div>
        `).join(""):'<div style="font-size:8px;color:var(--text-dim);font-style:italic;">No personalities yet.</div>',o=e.station_type.charAt(0).toUpperCase()+e.station_type.slice(1),p=e.ideology?` (${e.ideology})`:"";t.innerHTML=`
        <div class="radio-sidebar-freq">
            <div class="radio-sidebar-dot" style="background:${i};box-shadow:0 0 6px ${i}44;"></div>
            <span class="radio-sidebar-freq-label" style="color:${i};">${d(e.frequency)}</span>
        </div>
        <div class="radio-sidebar-name">${d(e.callsign)} &mdash; ${d(e.name)}</div>
        ${e.description?`<div class="radio-sidebar-desc">${d(e.description)}</div>`:""}

        <div class="radio-sidebar-row">
            <span class="radio-sidebar-label">Type</span>
            <span class="radio-sidebar-value" style="color:${i};">${d(o)}${d(p)}</span>
        </div>
        <div class="radio-sidebar-row">
            <span class="radio-sidebar-label">Broadcasts</span>
            <span class="radio-sidebar-value">${$.length}</span>
        </div>
        <div class="radio-sidebar-row">
            <span class="radio-sidebar-label">Personalities</span>
            <span class="radio-sidebar-value">${_.length}</span>
        </div>

        <div class="radio-sidebar-section">
            <div class="radio-sidebar-section-title">Personalities</div>
            ${n}
            ${Et(e)}
        </div>
    `}function Et(e){const t=gt(e);return t.allowed?'<div class="radio-sidebar-cta" id="radio-create-pers-btn">Create Personality</div>':`<div style="margin-top:8px;padding:5px 8px;font-family:var(--font-mono);font-size:7px;color:var(--text-dim);border:1px solid var(--border-main);text-align:center;opacity:0.6;" title="${d(t.reason)}">${d(t.reason)}</div>`}function A(e){const t=document.getElementById("radio-feed-count"),i=document.getElementById("radio-feed-scroll");if(!t||!i)return;const n=!e;if(t.textContent=`${$.length} broadcast${$.length!==1?"s":""}${n?" (all stations)":""}`,$.length===0){i.innerHTML=`
            <div class="radio-feed-empty">
                <div class="radio-feed-empty-text">No broadcasts yet.</div>
                <div class="radio-feed-empty-sub">Be the first to go live on this station.</div>
            </div>
        `;return}i.innerHTML=$.map(o=>{const a=(o.tags||[]).map(I=>`<span style="padding:2px 7px;font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-dim);border:1px solid var(--border-mid);line-height:14px;">${d(I)}</span>`).join(""),c=_.find(I=>I.id===o.personality_id)?.name||"Unknown",r=Z.find(I=>I.id===o.station_id)||h.find(I=>I.id===o.station_id),l=r?.nations?.name||"",f=k[r?.station_type]||"var(--text-dim)",v=r?`${r.frequency} — ${r.callsign}${l?" · "+l:""}`:"",m=M===o.id,u=N.has(o.id),x=m?"font-family:var(--font-serif);font-size:14px;color:var(--text-secondary);line-height:1.7;margin-bottom:10px;":"font-family:var(--font-serif);font-size:14px;color:var(--text-secondary);line-height:1.6;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;",E=u?"padding:5px 14px;cursor:pointer;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.04em;color:var(--bg-body);background:var(--green);border:1px solid var(--green);":"padding:5px 14px;cursor:pointer;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.04em;color:var(--green);background:transparent;border:1px solid var(--green-border);";return`
            <div style="border-bottom:1px solid var(--border-main);">
                <div style="padding:14px 20px;cursor:pointer;" data-bc-toggle="${o.id}">
                    ${v?`<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;">
                        <span style="width:6px;height:6px;border-radius:50%;background:${f};flex-shrink:0;box-shadow:0 0 4px ${f}44;"></span>
                        <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${f};letter-spacing:0.04em;">${d(v)}</span>
                    </div>`:""}
                    <div style="font-family:var(--font-serif);font-size:18px;font-weight:600;color:var(--text-bright);line-height:1.3;margin-bottom:6px;">${d(o.subject)}</div>
                    <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">
                        <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-secondary);font-weight:600;">${d(c)}</span>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">&middot;</span>
                        <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">Tick ${o.published_tick||"?"}</span>
                    </div>
                    <div style="${x}">${m?et(o.body):d(o.body)}</div>
                    ${a?`<div style="display:flex;gap:4px;margin-top:8px;flex-wrap:wrap;">${a}</div>`:""}
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-top:10px;padding-top:8px;border-top:1px solid var(--border-main);">
                        <div style="display:flex;gap:12px;">
                            <div style="display:flex;align-items:center;gap:4px;">
                                <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">LISTENERS</span>
                                <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--green);" id="gl-count-${o.id}">${o.good_listen_count||0}</span>
                            </div>
                        </div>
                        <div style="display:flex;gap:6px;align-items:center;">
                            ${o.faction_id===g.faction?.id?`<div data-bc-edit="${o.id}" style="padding:5px 12px;cursor:pointer;font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:0.04em;color:var(--text-dim);background:transparent;border:1px solid var(--border-mid);">EDIT</div>`:""}
                            <div style="${E}" data-gl-btn="${o.id}" id="gl-btn-${o.id}">${u?"✓ LISTEN":"LISTEN"}</div>
                        </div>
                    </div>
                </div>
            </div>
        `}).join("")}let G=new Set;async function It(e){if(G.has(e))return;G.add(e);const t=document.getElementById("gl-btn-"+e),i=document.getElementById("gl-count-"+e);t&&(t.style.opacity="0.5");try{const n=g.shard?.current_tick||0,{data:o,error:p}=await y.rpc("toggle_broadcast_good_listen",{p_broadcast_id:e,p_faction_id:g.faction?.id,p_tick:n});if(p){console.error("[Radio] Good listen failed:",p.message);return}o.liked?N.add(e):N.delete(e);const a=$.find(s=>s.id===e);a&&(a.good_listen_count=o.good_listen_count),t&&(o.liked?(t.style.color="var(--bg-body)",t.style.background="var(--green)",t.style.borderColor="var(--green)",t.textContent="✓ LISTEN"):(t.style.color="var(--green)",t.style.background="transparent",t.style.borderColor="var(--green-border)",t.textContent="LISTEN")),i&&(i.textContent=o.good_listen_count)}catch(n){console.error("[Radio] Good listen error:",n)}finally{G.delete(e),t&&(t.style.opacity="1")}}const it=["POLITICS","ECONOMY","CONSTRUCTION","LABOR","CORRUPTION","BUSINESS","MILITARY","SOCIAL"];function ot(e){const t=document.getElementById("radio-broadcast-modal");if(!t)return;const i=k[e.station_type]||"var(--text-dim)",n=_.filter(l=>l.faction_id===g.faction?.id);if(n.length===0)return;const o=n.map((l,f)=>`<option value="${l.id}" ${f===0?"selected":""}>${d(l.name)}${l.title?" — "+d(l.title):""}</option>`).join(""),p=it.map(l=>`<span class="radio-bc-tag" data-tag="${l}" style="padding:3px 7px;font-family:var(--font-mono);font-size:7px;font-weight:700;cursor:pointer;color:var(--text-dim);background:transparent;border:1px solid var(--border-mid);letter-spacing:0.04em;user-select:none;">${l}</span>`).join("");t.innerHTML=`
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
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${i};">${d(e.callsign)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${d(e.frequency)}</span>
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
    `,t.classList.add("active");const a=new Set,s=()=>t.classList.remove("active");document.getElementById("radio-bc-close")?.addEventListener("click",s),document.getElementById("radio-bc-cancel")?.addEventListener("click",s),t.addEventListener("click",l=>{l.target===t&&s()}),document.getElementById("radio-bc-tags")?.addEventListener("click",l=>{const f=l.target.closest(".radio-bc-tag");if(!f)return;const v=f.dataset.tag;a.has(v)?(a.delete(v),f.style.color="var(--text-dim)",f.style.background="transparent",f.style.borderColor="var(--border-mid)"):(a.add(v),f.style.color="var(--accent)",f.style.background="var(--amber-faint)",f.style.borderColor="var(--amber-border)")});const c=()=>{const l=document.getElementById("radio-bc-subject")?.value?.trim(),f=document.getElementById("radio-bc-body")?.value?.trim(),v=document.getElementById("radio-bc-submit");v&&(v.disabled=!(l&&f));const m=document.getElementById("radio-bc-charcount");m&&(m.textContent=`${(f||"").length} characters`)};document.getElementById("radio-bc-subject")?.addEventListener("input",c),document.getElementById("radio-bc-body")?.addEventListener("input",c);let r=!1;document.getElementById("radio-bc-submit")?.addEventListener("click",async()=>{if(r)return;const l=document.getElementById("radio-bc-subject")?.value?.trim(),f=document.getElementById("radio-bc-body")?.value?.trim(),v=document.getElementById("radio-bc-personality")?.value;if(!l||!f||!v)return;r=!0;const m=document.getElementById("radio-bc-submit");m&&(m.disabled=!0,m.textContent="Broadcasting...");try{const{data:u,error:x}=await y.from("radio_broadcasts").insert({station_id:e.id,personality_id:v,faction_id:g.faction?.id,subject:l,body:f,tags:[...a],published_tick:g.shard?.current_tick||null}).select("*").single();if(x){console.error("[Radio] Broadcast failed:",x.message),alert("Failed to broadcast: "+x.message);return}$.unshift(u),s(),A(e)}catch(u){console.error("[Radio] Broadcast error:",u)}finally{r=!1,m&&(m.disabled=!1,m.textContent="Go Live")}})}function kt(e){const t=$.find(m=>m.id===e);if(!t||t.faction_id!==g.faction?.id)return;const i=Z.find(m=>m.id===t.station_id)||h.find(m=>m.id===t.station_id);if(!i)return;const n=document.getElementById("radio-broadcast-modal");if(!n)return;const o=k[i.station_type]||"var(--text-dim)",a=_.filter(m=>m.faction_id===g.faction?.id).map(m=>`<option value="${m.id}" ${m.id===t.personality_id?"selected":""}>${d(m.name)}${m.title?" — "+d(m.title):""}</option>`).join(""),s=new Set(t.tags||[]),c=it.map(m=>{const u=s.has(m);return`<span class="radio-bc-tag" data-tag="${m}" style="padding:4px 10px;cursor:pointer;font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.04em;border:1px solid ${u?"var(--amber-border)":"var(--border-mid)"};color:${u?"var(--accent)":"var(--text-dim)"};background:${u?"var(--amber-faint)":"transparent"};">${m}</span>`}).join("");n.innerHTML=`
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
                        ${a}
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
                    <div style="display:flex;gap:3px;flex-wrap:wrap;" id="radio-bc-tags">${c}</div>
                </div>
            </div>
            <div class="radio-modal-footer">
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-right:auto;">EDITING</span>
                <button class="radio-modal-btn radio-modal-btn--cancel" id="radio-bc-cancel">Cancel</button>
                <button class="radio-modal-btn radio-modal-btn--submit" id="radio-bc-submit" style="background:var(--accent);">Update</button>
            </div>
        </div>
    `,n.classList.add("active");const r=new Set(t.tags||[]),l=()=>n.classList.remove("active");document.getElementById("radio-bc-close")?.addEventListener("click",l),document.getElementById("radio-bc-cancel")?.addEventListener("click",l),n.addEventListener("click",m=>{m.target===n&&l()}),document.getElementById("radio-bc-tags")?.addEventListener("click",m=>{const u=m.target.closest(".radio-bc-tag");if(!u)return;const x=u.dataset.tag;r.has(x)?(r.delete(x),u.style.color="var(--text-dim)",u.style.background="transparent",u.style.borderColor="var(--border-mid)"):(r.add(x),u.style.color="var(--accent)",u.style.background="var(--amber-faint)",u.style.borderColor="var(--amber-border)")});const f=()=>{const m=document.getElementById("radio-bc-subject")?.value?.trim(),u=document.getElementById("radio-bc-body")?.value?.trim(),x=document.getElementById("radio-bc-submit");x&&(x.disabled=!(m&&u));const E=document.getElementById("radio-bc-charcount");E&&(E.textContent=`${(u||"").length} characters`)};document.getElementById("radio-bc-subject")?.addEventListener("input",f),document.getElementById("radio-bc-body")?.addEventListener("input",f);let v=!1;document.getElementById("radio-bc-submit")?.addEventListener("click",async()=>{if(v)return;const m=document.getElementById("radio-bc-subject")?.value?.trim(),u=document.getElementById("radio-bc-body")?.value?.trim(),x=document.getElementById("radio-bc-personality")?.value;if(!m||!u||!x)return;v=!0;const E=document.getElementById("radio-bc-submit");E&&(E.disabled=!0,E.textContent="Updating...");try{const{data:I,error:H}=await y.from("radio_broadcasts").update({personality_id:x,subject:m,body:u,tags:[...r]}).eq("id",e).eq("faction_id",g.faction?.id).select("*").single();if(H){console.error("[Radio] Edit failed:",H.message),alert("Failed to update: "+H.message);return}const U=$.findIndex(D=>D.id===e);U>=0&&($[U]={...$[U],...I}),l();const ct=h.find(D=>D.id===R);A(ct)}catch(I){console.error("[Radio] Edit error:",I)}finally{v=!1,E&&(E.disabled=!1,E.textContent="Update")}})}function Bt(e){const t=document.getElementById("radio-personality-modal");if(!t)return;const i=k[e.station_type]||"var(--text-dim)";t.innerHTML=`
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
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${i};">${d(e.callsign)} &mdash; ${d(e.name)}</span>
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
                        Radio personalities are cosmetic hosts for your broadcasts. You can have up to <strong style="color:var(--text-bright);">3</strong> per station. They will be affiliated with <strong style="color:var(--accent);">${d(g.faction?.name||"your party")}</strong>.
                    </div>
                </div>
            </div>
            <div class="radio-modal-footer">
                <button class="radio-modal-btn radio-modal-btn--cancel" id="radio-pers-cancel">Cancel</button>
                <button class="radio-modal-btn radio-modal-btn--submit" id="radio-pers-submit">Create</button>
            </div>
        </div>
    `,t.classList.add("active");const n=()=>t.classList.remove("active");document.getElementById("radio-pers-close")?.addEventListener("click",n),document.getElementById("radio-pers-cancel")?.addEventListener("click",n),t.addEventListener("click",p=>{p.target===t&&n()});let o=!1;document.getElementById("radio-pers-submit")?.addEventListener("click",async()=>{if(o)return;const p=document.getElementById("radio-pers-name")?.value?.trim(),a=document.getElementById("radio-pers-title")?.value?.trim();if(!p)return;o=!0;const s=document.getElementById("radio-pers-submit");s&&(s.disabled=!0,s.textContent="Creating...");try{const{data:c,error:r}=await y.from("radio_personalities").insert({station_id:e.id,faction_id:g.faction?.id,name:p,title:a||null}).select("*").single();if(r){console.error("[Radio] Create personality failed:",r.message),alert("Failed to create personality: "+r.message);return}_.push(c),n(),at(e)}catch(c){console.error("[Radio] Create personality error:",c)}finally{o=!1,s&&(s.disabled=!1,s.textContent="Create")}})}let b={stationType:"general",ideology:null,callsign:"",name:"",frequency:"92.0",description:""};function P(){const e=mt.map(a=>`
        <div class="radio-type-card ${a.id===b.stationType?"active":""} ${a.locked?"locked":""}"
             data-type="${a.id}" ${a.locked,""}>
            <div>
                <div class="radio-type-name" style="color:${a.id===b.stationType?k[a.id]:""};">${d(a.name)}</div>
                <div class="radio-type-desc">${d(a.desc)}</div>
            </div>
            ${a.locked?'<span style="font-size:8px;color:var(--red);font-family:var(--font-mono);font-weight:700;">LOCKED</span>':""}
        </div>
    `).join(""),t=tt.map(a=>`
        <div class="radio-ideology-card ${b.ideology===a.tag?"active":""}"
             data-ideology="${a.tag}" style="${b.ideology===a.tag?`color:${a.color};border-color:${a.color}44;background:${a.color}12;`:""}">
            ${a.label}
        </div>
    `).join(""),i=h.map(a=>{const s=parseFloat(a.frequency);return isNaN(s)?null:{freq:s,callsign:a.callsign,color:k[a.station_type]||"var(--text-dim)"}}).filter(Boolean),n=i.map(a=>`<div class="radio-freq-marker" style="background:${a.color};left:${(a.freq-87.5)/20.5*100}%;" title="${a.freq} ${a.callsign}"></div>`).join(""),o=i.map(a=>`<span class="radio-freq-legend-item"><span class="radio-freq-legend-dot" style="background:${a.color};"></span><span style="color:${a.color};">${a.freq} ${a.callsign}</span></span>`).join(""),p=(parseFloat(b.frequency)-87.5)/20.5*100;return`
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
                    <div class="radio-type-grid" id="radio-type-grid">${e}</div>
                    <div class="radio-ideology-grid ${b.stationType==="political"?"visible":""}" id="radio-ideology-grid">${t}</div>
                </div>

                <!-- Step 2: Frequency -->
                <div>
                    <div class="radio-modal-step-label">2 &mdash; Frequency Band</div>
                    <div class="radio-freq-band">
                        ${n}
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
    `}function wt(){b={stationType:"general",ideology:null,callsign:"",name:"",frequency:"92.0",description:""};const e=document.getElementById("radio-create-modal");e&&(e.innerHTML=P(),e.classList.add("active"))}function nt(){document.getElementById("radio-create-modal")?.classList.remove("active")}let j=!1;async function Lt(){if(j)return;const{callsign:e,name:t,frequency:i,stationType:n,ideology:o,description:p}=b;if(!e.trim()||!t.trim()||n==="political"&&!o)return;j=!0;const a=document.getElementById("radio-modal-submit");a&&(a.disabled=!0,a.textContent="Launching...");try{const s=parseFloat(i),{data:c}=await y.from("radio_stations").select("id, callsign, frequency").order("created_at"),r=(c||[]).find(v=>{const m=parseFloat(v.frequency);return!isNaN(m)&&Math.abs(m-s)<.05});if(r){alert(`Frequency ${i} FM is already taken by station ${r.callsign}. Choose a different frequency.`),j=!1,a&&(a.disabled=!1,a.textContent="Launch Station");return}const{data:l,error:f}=await y.from("radio_stations").insert({nation_id:g.nation?.id,creator_faction_id:g.faction?.id,callsign:e.trim().toUpperCase(),name:t.trim(),frequency:i+" FM",station_type:n,ideology:n==="political"?o:null,description:p.trim()||null,created_at_tick:g.shard?.current_tick||null}).select("*").single();if(f){console.error("[Radio] Create station failed:",f.message),alert("Failed to create station: "+f.message);return}h.push(l),R=l.id,nt(),q(document.getElementById("broadcast-root"))}catch(s){console.error("[Radio] Create station error:",s)}finally{j=!1,a&&(a.disabled=!1,a.textContent="Launch Station")}}async function St(){const e=document.getElementById("broadcast-root");if(!e)return;if(S.length===0){const{data:i}=await y.from("nations").select("id, name, government_type, flag_url").order("name");S=i||[]}const t=g.nation?.id;L||(L=S.find(n=>n.id!==t)?.id||S[0]?.id||null),await st(),q(e)}async function st(){if(!L){T=[],w=[];return}const{data:e}=await y.from("radio_stations").select("*").eq("nation_id",L).order("created_at",{ascending:!0});T=e||[],B=T[0]?.id||null,B?await dt():w=[]}async function dt(){if(!B){w=[];return}const[e,t]=await Promise.all([y.from("radio_broadcasts").select("*").eq("station_id",B).order("created_at",{ascending:!1}).limit(50),y.from("radio_personalities").select("id, name, title").eq("station_id",B)]);w=e.data||[];const i={};for(const n of t.data||[])i[n.id]=n;for(const n of w)n._personality=i[n.personality_id]||null}function Ct(){const e=g.nation?.id,t=S.map(a=>{const s=a.id===L,c=a.id===e;return`<div class="radio-tunein-nation ${s?"active":""}" data-nation-id="${a.id}">
            ${d(a.name)}${c?' <span style="color:var(--green);font-size:9px;">(YOU)</span>':""}
        </div>`}).join(""),i=S.find(a=>a.id===L),n=T.length>0?T.map(a=>{const s=k[a.station_type]||"var(--text-dim)";return`<div class="radio-tunein-station ${a.id===B?"active":""}" data-station-id="${a.id}" style="border-left-color:${s};">
                <div class="radio-tunein-station-name">${d(a.callsign)} &mdash; ${d(a.name)}</div>
                <div class="radio-tunein-station-meta">${d(a.frequency)} &middot; <span style="color:${s};">${d(a.station_type.toUpperCase())}</span></div>
            </div>`}).join(""):'<div class="radio-tunein-empty">No stations in this nation yet.</div>',o=T.find(a=>a.id===B);let p="";if(o&&w.length>0){const a=w.map(s=>{const c=s._personality?.name||"Unknown",r=(s.tags||[]).map(l=>`<span class="radio-tunein-bc-tag">${d(l)}</span>`).join("");return`<div class="radio-tunein-bc">
                <div class="radio-tunein-bc-subject">${d(s.subject)}</div>
                <div class="radio-tunein-bc-meta">
                    <span style="font-weight:600;color:var(--text-secondary);">${d(c)}</span>
                    <span>&middot;</span>
                    <span>Tick ${s.published_tick??"?"}</span>
                    <span>&middot;</span>
                    <span>${s.good_listen_count||0} &#128266;</span>
                </div>
                <div class="radio-tunein-bc-body">${et(s.body)}</div>
                ${r?`<div class="radio-tunein-bc-tags">${r}</div>`:""}
            </div>`}).join("");p=`<div class="radio-tunein-timeline">
            <div class="radio-tunein-timeline-header">Timeline &mdash; ${d(o.callsign)} ${d(o.frequency)}</div>
            <div style="max-height:500px;overflow-y:auto;">${a}</div>
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
                    ${n}
                </div>
                <div style="flex:1;min-width:0;">${p}</div>
            </div>
        </div>
    `}let rt=[],F="nation",Q="political",O=[];async function Tt(){const e=g.shard?.current_tick||0,t=Math.max(1,e-48),[i,n]=await Promise.all([y.from("event_log").select("id, nation_id, event_name, category, fired_at_tick, description_chosen").gte("fired_at_tick",t).order("fired_at_tick",{ascending:!1}).limit(100),O.length===0?y.from("nations").select("id, name, flag_url").order("name"):{data:O}]);rt=i.data||[],n.data&&(O=n.data),Y();const o=document.getElementById("radio-events-type-tabs");o&&!o._wired&&(o._wired=!0,o.addEventListener("click",a=>{const s=a.target.closest(".radio-events-tab");!s||!s.dataset.type||(Q=s.dataset.type,o.querySelectorAll(".radio-events-tab").forEach(c=>c.classList.toggle("active",c.dataset.type===Q)),Y())}));const p=document.getElementById("radio-events-scope-tabs");p&&!p._wired&&(p._wired=!0,p.addEventListener("click",a=>{const s=a.target.closest(".radio-events-tab");!s||!s.dataset.scope||(F=s.dataset.scope,p.querySelectorAll(".radio-events-tab").forEach(c=>c.classList.toggle("active",c.dataset.scope===F)),Y())}))}function Y(){const e=document.getElementById("radio-events-scroll");if(!e)return;const t=g.nation?.id,i=new Set(["government","political","crisis","diplomatic","military","trade","economic"]),n=new Set(["corporate","ipo","shipping","insurance","corp_action"]);let o=rt;if(Q==="corporate"?o=o.filter(a=>n.has(a.category)):o=o.filter(a=>i.has(a.category)||!n.has(a.category)),F==="nation"&&t&&(o=o.filter(a=>a.nation_id===t)),o.length===0){e.innerHTML='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);font-style:italic;">No recent events.</div>';return}const p={government:{color:"#8b9a6b",bg:"rgba(139,154,107,0.06)",border:"rgba(139,154,107,0.2)"},political:{color:"#c8a832",bg:"rgba(200,168,50,0.06)",border:"rgba(200,168,50,0.2)"},crisis:{color:"#d44a4a",bg:"rgba(212,74,74,0.06)",border:"rgba(212,74,74,0.2)"},trade:{color:"#5aaa8a",bg:"rgba(90,170,138,0.06)",border:"rgba(90,170,138,0.2)"},diplomatic:{color:"#5a8aaa",bg:"rgba(90,138,170,0.06)",border:"rgba(90,138,170,0.2)"},military:{color:"#c84",bg:"rgba(204,136,68,0.06)",border:"rgba(204,136,68,0.2)"},corporate:{color:"#5aaa8a",bg:"rgba(90,170,138,0.06)",border:"rgba(90,170,138,0.2)"},economic:{color:"#c8a832",bg:"rgba(200,168,50,0.06)",border:"rgba(200,168,50,0.2)"}};e.innerHTML=o.map(a=>{const s=a.category||"government",c=p[s]||p.government,l=a.description_chosen||a.event_name||"";let f="";if(F==="world"){const v=O.find(m=>m.id===a.nation_id);v&&(f=`<div style="display:flex;align-items:center;gap:4px;margin-top:3px;">
                    <img src="${v.flag_url||`assets/flags/${v.name}.png`}" style="width:16px;height:11px;object-fit:cover;border:1px solid var(--border-main);" onerror="this.style.display='none'" alt="">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${d(v.name)}</span>
                </div>`)}return`<div style="padding:8px 14px;border-bottom:1px solid var(--border-main);">
            <div style="display:flex;gap:8px;align-items:flex-start;">
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);flex-shrink:0;width:26px;">${a.fired_at_tick}</span>
                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:1px 5px;color:${c.color};background:${c.bg};border:1px solid ${c.border};flex-shrink:0;text-transform:uppercase;">${d(s)}</span>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:12px;color:var(--text-secondary);line-height:1.4;">${d(l)}</div>
                    ${f}
                </div>
            </div>
        </div>`}).join("")}let z=null,X=!1,J=!1;function lt(e){document.querySelectorAll(".home-subtab").forEach(t=>t.classList.toggle("active",t.dataset.panel===e)),document.querySelectorAll(".home-panel").forEach(t=>t.classList.toggle("active",t.id==="panel-"+e)),sessionStorage.setItem("home_subtab",e),e==="news"&&!X&&z&&(X=!0,K(V,z)),e==="broadcast"&&!J&&z&&(J=!0,yt(V,z))}document.getElementById("home-subtabs").addEventListener("click",e=>{const t=e.target.closest(".home-subtab");!t||t.classList.contains("active")||lt(t.dataset.panel)});pt("dashboard",async e=>{z=e,sessionStorage.getItem("home_subtab")==="broadcast"?lt("broadcast"):(X=!0,await K(V,e))});
