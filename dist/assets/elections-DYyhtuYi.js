import{_ as f}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as ke}from"./common-BedtaFOo.js";import"./guide-RrxJIDYT.js";import{e as re}from"./utils-C2W-HleY.js";import{a as we,G as Y}from"./autocracy-silent-coup-vxZQTTX4.js";import{a as $e,i as Ee}from"./government-structure-DKbbGMPO.js";import"./stats-Cp9T3CP_.js";import{c as X}from"./party-icons-CJ7uQoDE.js";(function(){let P=null,c=null,q=null,Z=!1,z=!1,B=[],ee=[],j=0;const le="parliamentary",te=["#E91E63","#5b9bd5","#5cb85c","#d48a3c","#9C27B0","#00BCD4","#d9534f","#8BC34A","#FFC107","#673AB7"];function O(e,t){return B.find(a=>a.id===e)?.party_color||te[t%te.length]}function G(e){return B.find(i=>i.id===e)?.party_logo||null}function J(e){return B.find(i=>i.id===e)?.custom_logo_url||null}async function ne(){const{data:e}=await f.from("elections").select("*").eq("nation_id",c.id).eq("status","completed").eq("election_type",le).order("election_tick",{ascending:!1}).limit(1).maybeSingle();return e}ke("elections",async e=>{const{nation:t,faction:i}=e;if(P=i,c=t,we(t),!t){document.getElementById("content-area").innerHTML=`
            <div class="placeholder-panel">
                <div class="ph-icon">🗳️</div>
                <h3>No Nation Selected</h3>
                <p>Your party is not assigned to a nation yet.</p>
            </div>`;return}Z=$e(t),z=Ee(t),Z?(document.title="Internal Affairs | Nationhood Alpha",await K()):await ce()});async function ce(){const{data:e}=await f.from("factions").select("id, faction_name, seats, approval_rating, abbreviation, ideology_value_1, ideology_value_2, party_color, party_logo, custom_logo_url").eq("nation_id",c.id).eq("faction_type","party").order("seats",{ascending:!1});B=e||[];let t=null,i=null;if(z){t=await ne();const{data:r}=await f.from("elections").select("*").eq("nation_id",c.id).eq("status","completed").eq("election_type","presidential").order("election_tick",{ascending:!1}).limit(1).maybeSingle();i=r}else t=await ne();q=t?.id||null,ee=t?.results?.votes||[],j=ee.reduce((r,l)=>r+(l.seats||0),0),j===0&&(j=B.reduce((r,l)=>r+(l.seats||0),0));const a=`
        <div class="panel-padding">
            <!-- Presidential Candidate Results (Presidential systems only) -->
            ${z?`
            <div id="presidential-results-section" style="display: ${i?"block":"none"};">
                <div class="section-header">Presidential Election — <span id="presidential-election-year"></span></div>
                <div class="info-block" style="margin-bottom: 24px;">
                    <div id="presidential-results-list"></div>
                </div>
            </div>
            `:""}

            <!-- Parliamentary Election Results -->
            <div id="election-results-section" style="display: ${t?"block":"none"};">
                <div class="section-header">${z?"Parliamentary Election":"Election Results"} — <span id="election-year"></span></div>
                <div class="info-block" style="margin-bottom: 24px;">
                    <div id="election-results-list"></div>
                </div>
            </div>
            ${t?"":`
            <div class="info-block" style="margin-bottom: 24px; text-align: center; padding: 32px 16px;">
                <div style="font-size: 1.6rem; margin-bottom: 10px;">🗳️</div>
                <div style="font-size: 1rem; color: var(--text-secondary); font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">No Election Held Yet</div>
                <div style="font-size: 0.85rem; color: #666;">The first election will be held once enough parties have joined the nation.</div>
            </div>
            `}

            <div class="section-header" style="margin-top: 30px;">Upcoming Elections</div>
            ${z?`
            <div id="election-info" class="info-block">
                <div class="info-row">
                    <span class="info-label">Next Parliamentary Election</span>
                    <span class="info-value" id="next-parliamentary-tick">—</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ticks Remaining</span>
                    <span class="info-value gold" id="ticks-until-parliamentary">—</span>
                </div>
                <div class="info-row" style="border-top: 1px solid #333; margin-top: 8px; padding-top: 8px;">
                    <span class="info-label">Next Presidential Election</span>
                    <span class="info-value" id="next-presidential-tick">—</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ticks Remaining</span>
                    <span class="info-value gold" id="ticks-until-presidential">—</span>
                </div>
            </div>
            `:`
            <div id="election-info" class="info-block">
                <div class="info-row">
                    <span class="info-label">Next Election</span>
                    <span class="info-value" id="next-election-tick">—</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Ticks Remaining</span>
                    <span class="info-value gold" id="ticks-until-election">—</span>
                </div>
            </div>
            `}

            <!-- Election Breakdown (per-bloc voting detail) -->
            <div id="election-breakdown-section" style="display: block; margin-top: 30px;">
                <div class="section-header">Election Breakdown</div>
                <div id="election-breakdown-content">
                    <div class="breakdown-loading">Loading election breakdown...</div>
                </div>
            </div>
        </div>
    `;document.getElementById("content-area").innerHTML=a,z&&i&&await ue(i),await de(t),pe(t),await ve()}async function de(e){if(!e||!e.results)return;const{data:t}=await f.from("shard").select("current_date, current_tick").eq("name","Alpha Shard").single();if(t){const a=["January","February","March","April","May","June","July","August","September","October","November","December"],r=t.current_date.split(", ")[0],l=parseInt(t.current_date.split(", ")[1]),m=a.indexOf(r),x=t.current_tick-e.election_tick;let o=m-x,g=l;for(;o<0;)o+=12,g-=1;const $=`${a[o%12]}, ${g}`;document.getElementById("election-year").textContent=$}const i=e.results.votes||[];document.getElementById("election-results-list").innerHTML=i.map((a,r)=>{const l=O(a.party_id,r),m=G(a.party_id),x=J(a.party_id),o=m||x?`<span style="display:inline-flex;vertical-align:middle;margin-right:6px;">${X({customLogoUrl:x,iconKey:m,size:18,color:l})}</span>`:"";return`
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 12px; padding: 12px 0; border-bottom: 1px solid #222; align-items: center; border-left: 3px solid ${l}; padding-left: 10px;">
            <span style="font-size: 0.9rem; color: ${l}; font-weight: bold;">${o}${a.party_name}</span>
            <span style="font-size: 0.85rem; color: #aaa; text-align: right;">${(a.votes||0).toLocaleString()} Votes</span>
            <span style="font-size: 0.85rem; color: #aaa; text-align: right;">${a.vote_percentage||0}%</span>
            <span style="font-size: 0.85rem; font-weight: bold; color: #5cb85c; text-align: right;">${a.seats||0} Seats</span>
        </div>`}).join("")}async function pe(e){const t=document.getElementById("election-breakdown-content");if(!t)return;const i=e?.id||null;if(!e){t.innerHTML='<div style="color:#888; padding:16px; font-size:0.85rem;">No completed parliamentary election is available yet.</div>';return}let a=e?.results?.bloc_details||[],r={};if(Array.isArray(a)||(a=[]),!(i&&q&&i!==q)){if(a.length===0){t.innerHTML='<div style="color:#666; padding:16px; font-size:0.85rem;">No historical bloc breakdown stored for this election.</div>';return}try{const{data:l}=await f.from("shard").select("current_date, current_tick").eq("name","Alpha Shard").single();if(l&&e.election_tick!=null){const o=["January","February","March","April","May","June","July","August","September","October","November","December"],g=l.current_date.split(", ")[0],$=parseInt(l.current_date.split(", ")[1]),p=o.indexOf(g),n=l.current_tick-e.election_tick;let d=p-n,v=$;for(;d<0;)d+=12,v-=1;const w=`${o[d%12]}, ${v}`,E=document.getElementById("election-breakdown-section"),S=E?.querySelector(".breakdown-date-label");S&&S.remove(),E&&E.querySelector(".section-header")?.insertAdjacentHTML("afterend",`<div class="breakdown-date-label" style="color:#888; font-size:0.78rem; margin-bottom:6px; padding:0 16px;">Last Election: ${w}</div>`)}if(!Object.keys(r).length)for(const o of e?.results?.votes||[])o?.party_id&&o?.party_name&&(r[o.party_id]=o.party_name);const m=[...a].sort((o,g)=>g.voter_count-o.voter_count),x={LIBERTY:"#9C27B0",EQUALITY:"#E91E63",FREEDOM:"#5b9bd5",SECURITY:"#d48a3c",INDIVIDUALISM:"#eab308",COLLECTIVISM:"#ec4899",TRADITION:"#795548",PROGRESS:"#00BCD4",NATIONALISM:"#FF5722",GLOBALISM:"#3F51B5"};if(i&&q&&i!==q)return;t.innerHTML=m.map((o,g)=>{const $="breakdown-bloc-"+g,p=(o.tags||[]).length>0?o.tags.map(s=>`<span class="ideology-tag tag-${s.toLowerCase()}">${s.toUpperCase()}</span>`).join(""):'<span style="font-size:0.78rem; color:#666; font-style:italic;">Unaligned</span>',d=(Array.isArray(o.party_votes)?o.party_votes.map(s=>({partyId:s?.party_id||null,name:s?.party_name||r[s?.party_id]||(s?.party_id?s.party_id.slice(0,8):"Unknown Party"),votes:Number(s?.votes)||0})):o?.blocVotes&&typeof o.blocVotes=="object"?Object.entries(o.blocVotes).map(([s,y])=>({partyId:s,name:r[s]||s.slice(0,8),votes:Number(y)||0})):[]).sort((s,y)=>y.votes-s.votes),v=d.length>0?d[0].votes:0,w=Number(o?.abstentions)||0,E=Number(o?.voter_count)||0,S=d.reduce((s,y)=>s+y.votes,0),T=Math.max(E-w,0),k=S>0?S:T,b=d.map((s,y)=>{const I=v>0?s.votes/v*100:0,M=s.votes===v,F=s.partyId?O(s.partyId,y):M?"#ffcc00":"#555",C=F,D=M?" top-party":"",W=k>0?(s.votes/k*100).toFixed(1):"0.0";return`<div class="bloc-vote-row">
                    <span class="bloc-vote-name${D}" style="color:${F}">${s.name}</span>
                    <div class="bloc-vote-bar-wrap">
                        <div class="bloc-vote-bar" style="width:${I}%; background:${C};"></div>
                    </div>
                    <span class="bloc-vote-count${D}">${s.votes.toLocaleString()} (${W}%)</span>
                </div>`}).join(""),L=w>0?`<div class="bloc-abstentions">Abstained: ${w.toLocaleString()} voters</div>`:"";return`<div class="bloc-row" id="${$}">
                <div class="bloc-row-header" onclick="document.getElementById('${$}').classList.toggle('expanded')">
                    <div class="bloc-row-left">
                        <span class="bloc-row-name">${o.bloc_name}</span>
                        <span class="bloc-row-count">${E.toLocaleString()} voters</span>
                    </div>
                    <div class="bloc-row-arrow">&#9654;</div>
                </div>
                <div class="bloc-row-content">
                    <div class="bloc-tags-row">${p}</div>
                    <div>${b}</div>
                    ${L}
                </div>
            </div>`}).join("")}catch(l){console.error("Election breakdown error:",l),t.innerHTML='<div style="color:#ff6666; padding:16px; font-size:0.85rem;">Could not load election breakdown.</div>'}}}async function ue(e){if(!e||!e.results)return;const t=e.results.was_runoff||!1,i=e.results.round_1_candidates||[],a=e.results.runoff_candidates||[],r=t?a:e.results.presidential_candidates||[];if(r.length===0&&i.length===0){const u=document.getElementById("presidential-results-list");u&&(u.innerHTML='<div style="color:#888;padding:12px 0;">No presidential election results yet.</div>');return}const{data:l}=await f.from("shard").select("current_date, current_tick").eq("name","Alpha Shard").single();if(l){const u=["January","February","March","April","May","June","July","August","September","October","November","December"],h=l.current_date.split(", ")[0],A=parseInt(l.current_date.split(", ")[1]),U=u.indexOf(h),V=l.current_tick-e.election_tick;let _=U-V,N=A;for(;_<0;)_+=12,N-=1;const Q=`${u[_%12]}, ${N}`,H=document.getElementById("presidential-election-year");H&&(H.textContent=Q)}const m={LIBERTY:"#9C27B0",EQUALITY:"#E91E63",FREEDOM:"#5b9bd5",SECURITY:"#d48a3c",INDIVIDUALISM:"#eab308",COLLECTIVISM:"#ec4899",TRADITION:"#795548",PROGRESS:"#00BCD4",NATIONALISM:"#FF5722",GLOBALISM:"#3F51B5"};function x(u,h){const A=[...u].sort((_,N)=>N.votes-_.votes),U=A[0];let V="";return V+=`
            <div style="font-size:0.78rem;color:#aaa;text-transform:uppercase;letter-spacing:1px;font-weight:bold;margin:12px 0 6px 0;">${h}</div>
            <div style="display:grid;grid-template-columns:2fr 1.5fr 1fr 0.8fr;gap:12px;padding:8px 0;border-bottom:2px solid #333;font-size:0.75rem;color:#888;text-transform:uppercase;letter-spacing:1px;">
                <span>Candidate</span>
                <span>Party</span>
                <span style="text-align:right;">Votes</span>
                <span style="text-align:right;">%</span>
            </div>`,V+=A.map((_,N)=>{const Q=(_.ideology||"").toUpperCase(),H=m[Q]||"#888",ie=_.winner||_.candidate_id===U.candidate_id,oe=O(_.party_id||_.faction_id,N),se=G(_.party_id||_.faction_id),ae=J(_.party_id||_.faction_id),xe=se||ae?`<span style="display:inline-flex;vertical-align:middle;margin-right:5px;">${X({customLogoUrl:ae,iconKey:se,size:16,color:oe})}</span>`:"";return`
                <div style="display:grid;grid-template-columns:2fr 1.5fr 1fr 0.8fr;gap:12px;padding:12px 0;border-bottom:1px solid #222;align-items:center;border-left:3px solid ${oe};padding-left:10px;">
                    <span style="font-size:0.9rem;color:${ie?"#5cb85c":"#e0e0e0"};font-weight:bold;">
                        ${ie?"&#x2713; ":""}${_.candidate_name}
                        <span style="display:inline-block;padding:2px 6px;border-radius:3px;font-size:0.6rem;font-weight:bold;color:#fff;background:${H};margin-left:6px;vertical-align:middle;">${_.ideology}</span>
                    </span>
                    <span style="font-size:0.85rem;color:#aaa;">${xe}${_.party_name}</span>
                    <span style="font-size:0.85rem;color:#aaa;text-align:right;">${(_.votes||0).toLocaleString()}</span>
                    <span style="font-size:0.85rem;color:#aaa;text-align:right;">${_.vote_percentage||0}%</span>
                </div>`}).join(""),V}function o(...u){for(const h of u)if(h!=null&&h!=="")return h;return null}function g(u,h=""){if(u==null||u==="")return"—";const A=Number(u);return Number.isNaN(A)?`${u}${h}`:`${A>0?"+":""}${A}${h}`}const p=[...r.length>0?r:i].sort((u,h)=>h.votes-u.votes),n=p[0],d=(n.ideology||"").toUpperCase(),v=m[d]||"#888",w=O(n.party_id||n.faction_id,0),E=G(n.party_id||n.faction_id),S=J(n.party_id||n.faction_id),T=E||S?`<span style="display:inline-flex;vertical-align:middle;margin-right:8px;">${X({customLogoUrl:S,iconKey:E,size:22,color:w})}</span>`:"";let k=`
        <div style="background:linear-gradient(135deg,#1a2a1a,#0a1a0a);border:2px solid #5cb85c;border-radius:8px;padding:16px;margin-bottom:16px;border-left:4px solid ${w};">
            <div style="font-size:0.75rem;color:#5cb85c;text-transform:uppercase;letter-spacing:1px;font-weight:bold;margin-bottom:6px;">Presidential Election Winner${t?" (Runoff)":""}</div>
            <div style="font-size:1.1rem;color:#fff;font-weight:bold;">${n.candidate_name}</div>
            <div style="font-size:0.85rem;color:#aaa;margin-top:4px;">
                ${T}${n.party_name}
                <span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:0.65rem;font-weight:bold;color:#fff;background:${v};margin-left:8px;vertical-align:middle;">${n.ideology}</span>
            </div>
            <div style="font-size:0.82rem;color:#aaa;margin-top:4px;">${(n.votes||0).toLocaleString()} votes (${n.vote_percentage||0}%)</div>
        </div>`;t?(k+=`
            <div style="background:linear-gradient(135deg,#2a1a0a,#1a0a00);border:1px solid #d48a3c;border-radius:6px;padding:10px 14px;margin-bottom:16px;">
                <span style="font-size:0.75rem;color:#d48a3c;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Runoff Election</span>
                <span style="font-size:0.78rem;color:#aaa;margin-left:8px;">No candidate won a majority in Round 1. The top two advanced to a runoff.</span>
            </div>`,a.length>0&&(k+=x(a,"Runoff Results")),i.length>0&&(k+=`
                <details style="margin-top:16px;">
                    <summary style="cursor:pointer;font-size:0.78rem;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:bold;padding:8px 0;">Round 1 Results (${i.length} candidates)</summary>
                    <div style="opacity:0.8;">${x(i,"Round 1")}</div>
                </details>`)):k+=x(r,"Results");const L=(i.find(u=>u.candidate_id===n.candidate_id)||null)?.votes||0,s=Math.max(0,(n.votes||0)-L),y=L>0?Math.round(s/L*1e4)/100:0,I=p[1]||null,M=I?(n.votes||0)-(I.votes||0):0,F=I?((n.vote_percentage||0)-(I.vote_percentage||0)).toFixed(2):"0.00",C=e.results?.runoff_meta||e.results?.runoff_details||e.results?.runoff_transfer||{},D=o(n.endorsed_party_name,n.endorsed_party,C.endorsed_party_name,C.endorsed_party,e.results?.endorsed_party_name,e.results?.endorsed_party),W=o(C.abstain_votes,C.abstentions,C.abstain_count,e.results?.runoff_abstentions),ye=o(C.protest_votes,C.protest_count,C.protests,e.results?.runoff_protest_votes);k+=`
        <div style="margin-top:16px;background:#151515;border:1px solid #2b2b2b;border-radius:6px;padding:12px 14px;">
            <div style="font-size:0.74rem;color:#aaa;text-transform:uppercase;letter-spacing:1px;font-weight:bold;margin-bottom:8px;">Runoff Transfer Snapshot</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px 16px;font-size:0.82rem;color:#bbb;">
                <div><span style="color:#777;">Endorsed Party:</span> ${re(D||"—")}</div>
                <div><span style="color:#777;">Round 1 Votes (${re(n.candidate_name)}):</span> ${L.toLocaleString()}</div>
                <div><span style="color:#777;">Transferred Votes:</span> ${s.toLocaleString()} (${y}%)</div>
                <div><span style="color:#777;">Abstain / Protest Split:</span> ${(W??0).toLocaleString()} / ${(ye??0).toLocaleString()}</div>
                <div><span style="color:#777;">Margin vs Runner-up:</span> ${M.toLocaleString()} votes (${F} pp)</div>
            </div>
            <div style="margin-top:10px;font-size:0.76rem;color:#888;">Endorsement came from pre-election preference locked for this election.</div>
        </div>`;const R=e.results?.consequences||e.results?.runoff_consequences||e.results?.effects_applied||null;if(R){const u=o(R.approval,R.approval_change,R.approval_delta),h=o(R.polarization,R.polarization_change,R.polarization_delta);(u!==null||h!==null)&&(k+=`
                <div style="margin-top:12px;background:#111826;border:1px solid #2a3550;border-radius:6px;padding:12px 14px;">
                    <div style="font-size:0.74rem;color:#8ab4ff;text-transform:uppercase;letter-spacing:1px;font-weight:bold;margin-bottom:8px;">Post-Election Consequences</div>
                    <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:0.82rem;color:#c0d4ff;">
                        ${u!==null?`<div><span style="color:#7f9ad3;">Approval:</span> ${g(u," pts")}</div>`:""}
                        ${h!==null?`<div><span style="color:#7f9ad3;">Polarization:</span> ${g(h," pts")}</div>`:""}
                    </div>
                </div>`)}const _e=e.results.turnout_pct||0,be=e.results.total_votes_cast||0,he=e.results.total_abstentions||0;k+=`
        <div style="margin-top:12px;font-size:0.78rem;color:#666;">
            Turnout: ${_e}% &middot; ${be.toLocaleString()} votes cast &middot; ${he.toLocaleString()} abstentions
        </div>`,document.getElementById("presidential-results-list").innerHTML=k}async function K(){const{data:e}=await f.from("factions").select("id, faction_name, seats, approval_rating").eq("nation_id",c.id).eq("faction_type","party").order("seats",{ascending:!1}),{data:t}=await f.from("shakeups").select("*").eq("nation_id",c.id).eq("status","voting").limit(1).maybeSingle(),i=(e||[]).map((r,l)=>{const m=r.id===P.id,x=Math.max(2,r.seats/Y.TOTAL_SEATS*100);return`
            <div style="display: flex; align-items: center; gap: 12px; padding: 12px; background: ${m?"#2a2a1a":"#1a1a1a"}; border-radius: 4px; margin-bottom: 8px; ${m?"border-left: 3px solid #ffcc00;":""}">
                <div style="width: 24px; text-align: center; font-size: 1.2rem;">${r.id===c.ruling_faction_id?"👑":""}</div>
                <div style="flex: 1;">
                    <div style="font-weight: bold; color: ${m?"#ffcc00":"#e0e0e0"}; font-size: 0.9rem;">
                        ${r.faction_name} ${m?"(You)":""}
                        ${r.id===c.ruling_faction_id?'<span style="color: #d9534f; font-size: 0.75rem; margin-left: 8px;">RULING</span>':""}
                    </div>
                    <div style="margin-top: 6px; background: #333; height: 6px; border-radius: 3px; overflow: hidden;">
                        <div style="width: ${x}%; height: 100%; background: ${m?"#ffcc00":"#666"}; border-radius: 3px;"></div>
                    </div>
                </div>
                <div style="text-align: right; min-width: 80px;">
                    <div style="font-size: 1.1rem; font-weight: bold; color: #ffcc00;">${r.seats}</div>
                    <div style="font-size: 0.7rem; color: #888;">seats</div>
                </div>
                <div style="text-align: right; min-width: 60px;">
                    <div style="font-size: 0.9rem; color: #5cb85c;">${r.approval_rating||0}%</div>
                    <div style="font-size: 0.7rem; color: #888;">approval</div>
                </div>
            </div>`}).join(""),a=`
        <div class="panel-padding">
            <div class="strongman-banner">
                <div class="strongman-icon">🏛️</div>
                <div class="strongman-details">
                    <div class="strongman-label">Strongman Leader of ${c.name}</div>
                    <div class="strongman-name-display">${c.head_of_state_first_name||"Unknown"} ${c.head_of_state_last_name||"Leader"}</div>
                    <div class="strongman-meta">
                        Age ${c.head_of_state_age||"??"} · Rules until dead or deposed ·
                        Stability: <span style="color: ${c.stability<20?"#d9534f":c.stability<50?"#d48a3c":"#5cb85c"};">${c.stability}%</span>
                    </div>
                </div>
            </div>

            <div id="shakeup-section" style="display: ${t?"block":"none"};">
                ${t?fe(t,e):""}
            </div>

            <div class="section-header">Faction Standings</div>
            <div style="margin-bottom: 24px;">
                ${i||'<div style="color: #666; text-align: center; padding: 20px;">No factions yet</div>'}
            </div>
        </div>
    `;document.getElementById("content-area").innerHTML=a}function fe(e,t){const i=e.votes||[],a=i.find(n=>n.faction_id===P.id),r=t?.find(n=>n.id===e.ruling_faction_id),l=t?.find(n=>n.id===e.initiated_by),m=i.filter(n=>n.side==="ruling").map(n=>{const d=t?.find(v=>v.id===n.faction_id);return d?d.faction_name:"Unknown"}),x=i.filter(n=>n.side==="seizing").map(n=>{const d=t?.find(v=>v.id===n.faction_id);return d?d.faction_name:"Unknown"}),o=t?.length||0,g=i.length,$=g>=o,p=o-g;return`
        <div class="shakeup-banner">
            <div class="shakeup-title">⚔️ SHAKEUP IN PROGRESS ⚔️</div>
            <div class="shakeup-desc">
                A faction is attempting to seize power!
                <br>All factions must choose a side. <strong style="color:#d48a3c;">Non-voters will be counted as abstaining at next tick.</strong>
            </div>
            <div class="shakeup-sides">
                <div class="shakeup-side ruling">
                    <div class="shakeup-side-label">Ruling Faction</div>
                    <div class="shakeup-side-name">${r?.faction_name||"Unknown"}</div>
                    <div class="shakeup-side-seats">${r?.seats||0} seats</div>
                    <div style="margin-top: 8px; font-size: 0.8rem; color: #aaa;">Supporters: ${m.length>0?m.join(", "):"None yet"}</div>
                </div>
                <div class="shakeup-vs">VS</div>
                <div class="shakeup-side seizing">
                    <div class="shakeup-side-label">Challenging Faction</div>
                    <div class="shakeup-side-name">${l?.faction_name||"Unknown"}</div>
                    <div class="shakeup-side-seats">${l?.seats||0} seats</div>
                    <div style="margin-top: 8px; font-size: 0.8rem; color: #aaa;">Supporters: ${x.length>0?x.join(", "):"None yet"}</div>
                </div>
            </div>
            ${a?`
                <div class="shakeup-voted">✓ You sided with the ${a.side} faction</div>
            `:`
                <div class="shakeup-vote-buttons">
                    <button class="shakeup-vote-btn ruling-btn" onclick="voteShakeup('${e.id}', 'ruling')">Side with Ruling</button>
                    <button class="shakeup-vote-btn seizing-btn" onclick="voteShakeup('${e.id}', 'seizing')">Side with Challenger</button>
                </div>
            `}
            <div style="margin-top: 16px; font-size: 0.85rem; color: #888;">
                Votes cast: ${g} / ${o}
                ${p>0&&!$?`<br><span style="color: #d48a3c;">${p} faction${p>1?"s":""} haven't voted — they will abstain at next tick</span>`:""}
                ${g>=Math.ceil(o/2)&&P.id===e.initiated_by?`<br><button class="action-btn" style="margin-top: 12px;" onclick="resolveActiveShakeup('`+e.id+`')">⚔️ Resolve Shakeup Now</button>`:""}
            </div>
        </div>
    `}async function me(e,t){if(confirm(`Side with the ${t} faction? This cannot be changed.`))try{const{data:i,error:a}=await f.rpc("vote_on_shakeup",{p_shakeup_id:e,p_faction_id:P.id,p_side:t});if(a)throw a;i.success?(alert("✅ "+i.message),await K()):alert("❌ "+i.message)}catch(i){alert("❌ Error: "+i.message)}}async function ge(e){if(confirm("Resolve this shakeup? The losing side will lose seats and approval."))try{const{data:t,error:i}=await f.rpc("resolve_shakeup",{p_shakeup_id:e});if(i)throw i;t.success?(alert("⚔️ "+t.message),await K()):alert("❌ "+t.message)}catch(t){alert("❌ Error: "+t.message)}}async function ve(){if(!c)return;const{data:e}=await f.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single();if(!e)return;const t=["January","February","March","April","May","June","July","August","September","October","November","December"],i=e.current_date.split(", ")[0],a=parseInt(e.current_date.split(", ")[1]),r=t.indexOf(i);function l(p){let n=r+p,d=a;for(;n>=12;)n-=12,d+=1;return t[n]+", "+d}if(z){const{data:p}=await f.from("elections").select("*").eq("nation_id",c.id).eq("status","scheduled").lte("election_tick",e.current_tick).order("election_tick",{ascending:!0}).limit(1).maybeSingle();if(p){const b=document.getElementById("next-parliamentary-tick"),L=document.getElementById("ticks-until-parliamentary"),s=document.getElementById("next-presidential-tick"),y=document.getElementById("ticks-until-presidential");(p.election_type||"parliamentary")==="presidential"?(s&&(s.textContent="Overdue — pending"),y&&(y.textContent="Will process next tick")):(b&&(b.textContent="Overdue — pending"),L&&(L.textContent="Will process next tick"))}let{data:n,error:d}=await f.from("elections").select("*").eq("nation_id",c.id).eq("status","scheduled").eq("election_type","parliamentary").gt("election_tick",e.current_tick).order("election_tick",{ascending:!0}).limit(1).maybeSingle();d&&console.error("loadElectionInfo: parliamentary query error:",d);let{data:v,error:w}=await f.from("elections").select("*").eq("nation_id",c.id).eq("status","scheduled").eq("election_type","presidential").gt("election_tick",e.current_tick).order("election_tick",{ascending:!0}).limit(1).maybeSingle();if(w&&console.error("loadElectionInfo: presidential query error:",w),!n&&!d){const{data:b}=await f.from("elections").select("election_tick").eq("nation_id",c.id).eq("status","completed").eq("election_type","parliamentary").order("election_tick",{ascending:!1}).limit(1).maybeSingle();let s=(b?b.election_tick:e.current_tick)+Y?.PARLIAMENTARY_TERM_TICKS;s<=e.current_tick&&(s=e.current_tick+Y?.PARLIAMENTARY_TERM_TICKS);const{data:y,error:I}=await f.from("elections").insert({nation_id:c.id,election_tick:s,election_type:"parliamentary",status:"scheduled"}).select().single();!I&&y?(n=y,console.log("Auto-scheduled presidential parliamentary election at tick",s)):console.warn("Failed to auto-schedule presidential parliamentary:",I)}if(!v&&!w){const{data:b}=await f.from("elections").select("election_tick").eq("nation_id",c.id).eq("status","completed").eq("election_type","presidential").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),L=b?b.election_tick:e.current_tick,s=c?.presidential_term_ticks||Y?.PRESIDENTIAL_TERM_TICKS;let y=L+s;y<=e.current_tick&&(y=e.current_tick+s);const{data:I,error:M}=await f.from("elections").insert({nation_id:c.id,election_tick:y,election_type:"presidential",status:"scheduled"}).select().single();!M&&I?(v=I,console.log("Auto-scheduled presidential election at tick",y)):console.warn("Failed to auto-schedule presidential:",M)}const E=document.getElementById("next-parliamentary-tick"),S=document.getElementById("ticks-until-parliamentary"),T=document.getElementById("next-presidential-tick"),k=document.getElementById("ticks-until-presidential");if(n){const b=n.election_tick-e.current_tick;E&&(E.textContent=l(b)),S&&(S.textContent=b+(b===1?" tick":" ticks"))}else E&&(E.textContent="Not scheduled"),S&&(S.textContent="—");if(v){const b=v.election_tick-e.current_tick;T&&(T.textContent=l(b)),k&&(k.textContent=b+(b===1?" tick":" ticks"))}else T&&(T.textContent="Not scheduled"),k&&(k.textContent="—");return}const m=48,{data:x}=await f.from("elections").select("*").eq("nation_id",c.id).eq("status","scheduled").lte("election_tick",e.current_tick).order("election_tick",{ascending:!0}).limit(1).maybeSingle();if(x){const p=document.getElementById("next-election-tick"),n=document.getElementById("ticks-until-election");p&&(p.textContent="Overdue — pending"),n&&(n.textContent="Will process next tick");return}let{data:o}=await f.from("elections").select("*").eq("nation_id",c.id).eq("status","scheduled").gt("election_tick",e.current_tick).order("election_tick",{ascending:!0}).limit(1).maybeSingle();if(!o){const{data:p}=await f.from("elections").select("election_tick").eq("nation_id",c.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle();let d=(p?p.election_tick:e.current_tick)+m;d<=e.current_tick&&(d=e.current_tick+m);const{data:v,error:w}=await f.from("elections").insert({nation_id:c.id,election_tick:d,status:"scheduled"}).select().single();!w&&v?(o=v,console.log("Auto-scheduled next election at tick",d)):console.warn("Failed to auto-schedule election:",w)}const g=document.getElementById("next-election-tick"),$=document.getElementById("ticks-until-election");if(o){const p=o.election_tick-e.current_tick;g&&(g.textContent=l(p)),$&&($.textContent=p+(p===1?" tick":" ticks"))}else g&&(g.textContent="Not scheduled"),$&&($.textContent="—")}window.voteShakeup=me,window.resolveActiveShakeup=ge})();
