import{_ as v}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as ye}from"./common-D2-5e1SV.js";import{a as ie}from"./utils-CzgKGX6o.js";import{initGameConfigForNation as ve,GAME_CONFIG as oe}from"./config-BER7HlcX.js";import{i as _e,a as be}from"./government-types-BeJIFjWQ.js";import{c as W}from"./party-icons-CJ7uQoDE.js";import"./preload-helper-BXl3LOEh.js";import"./government-structure-DBjJ7E-l.js";import"./factions-C2s734Ze.js";(function(){let g=null,B=null,N=!1,P=[],K=[],H=0;const se="parliamentary",Q=["#E91E63","#5b9bd5","#5cb85c","#d48a3c","#9C27B0","#00BCD4","#d9534f","#8BC34A","#FFC107","#673AB7"];function z(e,o){return P.find(r=>r.id===e)?.party_color||Q[o%Q.length]}function Y(e){return P.find(s=>s.id===e)?.party_logo||null}function J(e){return P.find(s=>s.id===e)?.custom_logo_url||null}async function X(){const{data:e}=await v.from("elections").select("*").eq("nation_id",g.id).eq("status","completed").eq("election_type",se).order("election_tick",{ascending:!1}).limit(1).maybeSingle();return e}ye("elections",async e=>{const{nation:o,faction:s}=e;if(g=o,ve(o),!o){document.getElementById("content-area").innerHTML=`
            <div class="placeholder-panel">
                <div class="ph-icon">🗳️</div>
                <h3>No Nation Selected</h3>
                <p>Your party is not assigned to a nation yet.</p>
            </div>`;return}N=_e(o),await ae()});async function ae(){const{data:e}=await v.from("factions").select("id, faction_name, seats, abbreviation, party_color, party_logo, custom_logo_url").eq("nation_id",g.id).eq("faction_type","party").order("seats",{ascending:!1});P=e||[];let o=null,s=null;if(N){o=await X();const{data:m}=await v.from("elections").select("*").eq("nation_id",g.id).eq("status","completed").eq("election_type","presidential").order("election_tick",{ascending:!1}).limit(1).maybeSingle();s=m}else o=await X();B=o?.id||null,K=o?.results?.votes||[],H=K.reduce((m,l)=>m+(l.seats||0),0),H===0&&(H=P.reduce((m,l)=>m+(l.seats||0),0));const r=`
        <div class="panel-padding">
            <!-- Presidential Candidate Results (Presidential systems only) -->
            ${N?`
            <div id="presidential-results-section" style="display: ${s?"block":"none"};">
                <div class="section-header">Presidential Election — <span id="presidential-election-year"></span></div>
                <div class="info-block" style="margin-bottom: 24px;">
                    <div id="presidential-results-list"></div>
                </div>
            </div>
            `:""}

            <!-- Parliamentary Election Results -->
            <div id="election-results-section" style="display: ${o?"block":"none"};">
                <div class="section-header">${N?"Parliamentary Election":"Election Results"} — <span id="election-year"></span></div>
                <div class="info-block" style="margin-bottom: 24px;">
                    <div id="election-results-list"></div>
                </div>
            </div>
            ${o?"":`
            <div class="info-block" style="margin-bottom: 24px; text-align: center; padding: 32px 16px;">
                <div style="font-size: 1.6rem; margin-bottom: 10px;">🗳️</div>
                <div style="font-size: 1rem; color: var(--text-secondary); font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">No Election Held Yet</div>
                <div style="font-size: 0.85rem; color: #666;">The first election will be held once enough parties have joined the nation.</div>
            </div>
            `}

            <div class="section-header" style="margin-top: 30px;">Upcoming Elections</div>
            ${N?`
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
    `;document.getElementById("content-area").innerHTML=r,N&&s&&await ce(s),await re(o),le(o),await de()}async function re(e){if(!e||!e.results)return;const{data:o}=await v.from("shard").select("current_date, current_tick").eq("name","Alpha Shard").single();if(o){const r=["January","February","March","April","May","June","July","August","September","October","November","December"],m=o.current_date.split(", ")[0],l=parseInt(o.current_date.split(", ")[1]),$=r.indexOf(m),L=o.current_tick-e.election_tick;let i=$-L,b=l;for(;i<0;)i+=12,b-=1;const C=`${r[i%12]}, ${b}`;document.getElementById("election-year").textContent=C}const s=e.results.votes||[];document.getElementById("election-results-list").innerHTML=s.map((r,m)=>{const l=z(r.party_id,m),$=Y(r.party_id),L=J(r.party_id),i=$||L?`<span style="display:inline-flex;vertical-align:middle;margin-right:6px;">${W({customLogoUrl:L,iconKey:$,size:18,color:l})}</span>`:"";return`
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 12px; padding: 12px 0; border-bottom: 1px solid #222; align-items: center; border-left: 3px solid ${l}; padding-left: 10px;">
            <span style="font-size: 0.9rem; color: ${l}; font-weight: bold;">${i}${r.party_name}</span>
            <span style="font-size: 0.85rem; color: #aaa; text-align: right;">${(r.votes||0).toLocaleString()} Votes</span>
            <span style="font-size: 0.85rem; color: #aaa; text-align: right;">${r.vote_percentage||0}%</span>
            <span style="font-size: 0.85rem; font-weight: bold; color: #5cb85c; text-align: right;">${r.seats||0} Seats</span>
        </div>`}).join("")}async function le(e){const o=document.getElementById("election-breakdown-content");if(!o)return;const s=e?.id||null;if(!e){o.innerHTML='<div style="color:#888; padding:16px; font-size:0.85rem;">No completed parliamentary election is available yet.</div>';return}let r=e?.results?.bloc_details||[],m={};if(Array.isArray(r)||(r=[]),!(s&&B&&s!==B)){if(r.length===0){o.innerHTML='<div style="color:#666; padding:16px; font-size:0.85rem;">No historical bloc breakdown stored for this election.</div>';return}try{const{data:l}=await v.from("shard").select("current_date, current_tick").eq("name","Alpha Shard").single();if(l&&e.election_tick!=null){const i=["January","February","March","April","May","June","July","August","September","October","November","December"],b=l.current_date.split(", ")[0],C=parseInt(l.current_date.split(", ")[1]),c=i.indexOf(b),t=l.current_tick-e.election_tick;let a=c-t,d=C;for(;a<0;)a+=12,d-=1;const x=`${i[a%12]}, ${d}`,k=document.getElementById("election-breakdown-section"),h=k?.querySelector(".breakdown-date-label");h&&h.remove(),k&&k.querySelector(".section-header")?.insertAdjacentHTML("afterend",`<div class="breakdown-date-label" style="color:#888; font-size:0.78rem; margin-bottom:6px; padding:0 16px;">Last Election: ${x}</div>`)}if(!Object.keys(m).length)for(const i of e?.results?.votes||[])i?.party_id&&i?.party_name&&(m[i.party_id]=i.party_name);const $=[...r].sort((i,b)=>b.voter_count-i.voter_count),L={LIBERTY:"#9C27B0",EQUALITY:"#E91E63",FREEDOM:"#5b9bd5",SECURITY:"#d48a3c",INDIVIDUALISM:"#eab308",COLLECTIVISM:"#ec4899",TRADITION:"#795548",PROGRESS:"#00BCD4",NATIONALISM:"#FF5722",GLOBALISM:"#3F51B5"};if(s&&B&&s!==B)return;o.innerHTML=$.map((i,b)=>{const C="breakdown-bloc-"+b,c=(i.tags||[]).length>0?i.tags.map(n=>`<span class="ideology-tag tag-${n.toLowerCase()}">${n.toUpperCase()}</span>`).join(""):'<span style="font-size:0.78rem; color:#666; font-style:italic;">Unaligned</span>',a=(Array.isArray(i.party_votes)?i.party_votes.map(n=>({partyId:n?.party_id||null,name:n?.party_name||m[n?.party_id]||(n?.party_id?n.party_id.slice(0,8):"Unknown Party"),votes:Number(n?.votes)||0})):i?.blocVotes&&typeof i.blocVotes=="object"?Object.entries(i.blocVotes).map(([n,p])=>({partyId:n,name:m[n]||n.slice(0,8),votes:Number(p)||0})):[]).sort((n,p)=>p.votes-n.votes),d=a.length>0?a[0].votes:0,x=Number(i?.abstentions)||0,k=Number(i?.voter_count)||0,h=a.reduce((n,p)=>n+p.votes,0),A=Math.max(k-x,0),_=h>0?h:A,y=a.map((n,p)=>{const w=d>0?n.votes/d*100:0,S=n.votes===d,D=n.partyId?z(n.partyId,p):S?"#ffcc00":"#555",T=D,O=S?" top-party":"",j=_>0?(n.votes/_*100).toFixed(1):"0.0";return`<div class="bloc-vote-row">
                    <span class="bloc-vote-name${O}" style="color:${D}">${n.name}</span>
                    <div class="bloc-vote-bar-wrap">
                        <div class="bloc-vote-bar" style="width:${w}%; background:${T};"></div>
                    </div>
                    <span class="bloc-vote-count${O}">${n.votes.toLocaleString()} (${j}%)</span>
                </div>`}).join(""),E=x>0?`<div class="bloc-abstentions">Abstained: ${x.toLocaleString()} voters</div>`:"";return`<div class="bloc-row" id="${C}">
                <div class="bloc-row-header" onclick="document.getElementById('${C}').classList.toggle('expanded')">
                    <div class="bloc-row-left">
                        <span class="bloc-row-name">${i.bloc_name}</span>
                        <span class="bloc-row-count">${k.toLocaleString()} voters</span>
                    </div>
                    <div class="bloc-row-arrow">&#9654;</div>
                </div>
                <div class="bloc-row-content">
                    <div class="bloc-tags-row">${c}</div>
                    <div>${y}</div>
                    ${E}
                </div>
            </div>`}).join("")}catch(l){console.error("Election breakdown error:",l),o.innerHTML='<div style="color:#ff6666; padding:16px; font-size:0.85rem;">Could not load election breakdown.</div>'}}}async function ce(e){if(!e||!e.results)return;const o=e.results.was_runoff||!1,s=e.results.round_1_candidates||[],r=e.results.runoff_candidates||[],m=o?r:e.results.presidential_candidates||[];if(m.length===0&&s.length===0){const u=document.getElementById("presidential-results-list");u&&(u.innerHTML='<div style="color:#888;padding:12px 0;">No presidential election results yet.</div>');return}const{data:l}=await v.from("shard").select("current_date, current_tick").eq("name","Alpha Shard").single();if(l){const u=["January","February","March","April","May","June","July","August","September","October","November","December"],I=l.current_date.split(", ")[0],M=parseInt(l.current_date.split(", ")[1]),V=u.indexOf(I),q=l.current_tick-e.election_tick;let f=V-q,R=M;for(;f<0;)f+=12,R-=1;const G=`${u[f%12]}, ${R}`,U=document.getElementById("presidential-election-year");U&&(U.textContent=G)}const $={LIBERTY:"#9C27B0",EQUALITY:"#E91E63",FREEDOM:"#5b9bd5",SECURITY:"#d48a3c",INDIVIDUALISM:"#eab308",COLLECTIVISM:"#ec4899",TRADITION:"#795548",PROGRESS:"#00BCD4",NATIONALISM:"#FF5722",GLOBALISM:"#3F51B5"};function L(u,I){const M=[...u].sort((f,R)=>R.votes-f.votes),V=M[0];let q="";return q+=`
            <div style="font-size:0.78rem;color:#aaa;text-transform:uppercase;letter-spacing:1px;font-weight:bold;margin:12px 0 6px 0;">${I}</div>
            <div style="display:grid;grid-template-columns:2fr 1.5fr 1fr 0.8fr;gap:12px;padding:8px 0;border-bottom:2px solid #333;font-size:0.75rem;color:#888;text-transform:uppercase;letter-spacing:1px;">
                <span>Candidate</span>
                <span>Party</span>
                <span style="text-align:right;">Votes</span>
                <span style="text-align:right;">%</span>
            </div>`,q+=M.map((f,R)=>{const G=(f.ideology||"").toUpperCase(),U=$[G]||"#888",Z=f.winner||f.candidate_id===V.candidate_id,ee=z(f.party_id||f.faction_id,R),te=Y(f.party_id||f.faction_id),ne=J(f.party_id||f.faction_id),ge=te||ne?`<span style="display:inline-flex;vertical-align:middle;margin-right:5px;">${W({customLogoUrl:ne,iconKey:te,size:16,color:ee})}</span>`:"";return`
                <div style="display:grid;grid-template-columns:2fr 1.5fr 1fr 0.8fr;gap:12px;padding:12px 0;border-bottom:1px solid #222;align-items:center;border-left:3px solid ${ee};padding-left:10px;">
                    <span style="font-size:0.9rem;color:${Z?"#5cb85c":"#e0e0e0"};font-weight:bold;">
                        ${Z?"&#x2713; ":""}${f.candidate_name}
                        <span style="display:inline-block;padding:2px 6px;border-radius:3px;font-size:0.6rem;font-weight:bold;color:#fff;background:${U};margin-left:6px;vertical-align:middle;">${f.ideology}</span>
                    </span>
                    <span style="font-size:0.85rem;color:#aaa;">${ge}${f.party_name}</span>
                    <span style="font-size:0.85rem;color:#aaa;text-align:right;">${(f.votes||0).toLocaleString()}</span>
                    <span style="font-size:0.85rem;color:#aaa;text-align:right;">${f.vote_percentage||0}%</span>
                </div>`}).join(""),q}function i(...u){for(const I of u)if(I!=null&&I!=="")return I;return null}function b(u,I=""){if(u==null||u==="")return"—";const M=Number(u);return Number.isNaN(M)?`${u}${I}`:`${M>0?"+":""}${M}${I}`}const c=[...m.length>0?m:s].sort((u,I)=>I.votes-u.votes),t=c[0],a=(t.ideology||"").toUpperCase(),d=$[a]||"#888",x=z(t.party_id||t.faction_id,0),k=Y(t.party_id||t.faction_id),h=J(t.party_id||t.faction_id),A=k||h?`<span style="display:inline-flex;vertical-align:middle;margin-right:8px;">${W({customLogoUrl:h,iconKey:k,size:22,color:x})}</span>`:"";let _=`
        <div style="background:linear-gradient(135deg,#1a2a1a,#0a1a0a);border:2px solid #5cb85c;border-radius:8px;padding:16px;margin-bottom:16px;border-left:4px solid ${x};">
            <div style="font-size:0.75rem;color:#5cb85c;text-transform:uppercase;letter-spacing:1px;font-weight:bold;margin-bottom:6px;">Presidential Election Winner${o?" (Runoff)":""}</div>
            <div style="font-size:1.1rem;color:#fff;font-weight:bold;">${t.candidate_name}</div>
            <div style="font-size:0.85rem;color:#aaa;margin-top:4px;">
                ${A}${t.party_name}
                <span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:0.65rem;font-weight:bold;color:#fff;background:${d};margin-left:8px;vertical-align:middle;">${t.ideology}</span>
            </div>
            <div style="font-size:0.82rem;color:#aaa;margin-top:4px;">${(t.votes||0).toLocaleString()} votes (${t.vote_percentage||0}%)</div>
        </div>`;o?(_+=`
            <div style="background:linear-gradient(135deg,#2a1a0a,#1a0a00);border:1px solid #d48a3c;border-radius:6px;padding:10px 14px;margin-bottom:16px;">
                <span style="font-size:0.75rem;color:#d48a3c;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Runoff Election</span>
                <span style="font-size:0.78rem;color:#aaa;margin-left:8px;">No candidate won a majority in Round 1. The top two advanced to a runoff.</span>
            </div>`,r.length>0&&(_+=L(r,"Runoff Results")),s.length>0&&(_+=`
                <details style="margin-top:16px;">
                    <summary style="cursor:pointer;font-size:0.78rem;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:bold;padding:8px 0;">Round 1 Results (${s.length} candidates)</summary>
                    <div style="opacity:0.8;">${L(s,"Round 1")}</div>
                </details>`)):_+=L(m,"Results");const E=(s.find(u=>u.candidate_id===t.candidate_id)||null)?.votes||0,n=Math.max(0,(t.votes||0)-E),p=E>0?Math.round(n/E*1e4)/100:0,w=c[1]||null,S=w?(t.votes||0)-(w.votes||0):0,D=w?((t.vote_percentage||0)-(w.vote_percentage||0)).toFixed(2):"0.00",T=e.results?.runoff_meta||e.results?.runoff_details||e.results?.runoff_transfer||{},O=i(t.endorsed_party_name,t.endorsed_party,T.endorsed_party_name,T.endorsed_party,e.results?.endorsed_party_name,e.results?.endorsed_party),j=i(T.abstain_votes,T.abstentions,T.abstain_count,e.results?.runoff_abstentions),pe=i(T.protest_votes,T.protest_count,T.protests,e.results?.runoff_protest_votes);_+=`
        <div style="margin-top:16px;background:#151515;border:1px solid #2b2b2b;border-radius:6px;padding:12px 14px;">
            <div style="font-size:0.74rem;color:#aaa;text-transform:uppercase;letter-spacing:1px;font-weight:bold;margin-bottom:8px;">Runoff Transfer Snapshot</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px 16px;font-size:0.82rem;color:#bbb;">
                <div><span style="color:#777;">Endorsed Party:</span> ${ie(O||"—")}</div>
                <div><span style="color:#777;">Round 1 Votes (${ie(t.candidate_name)}):</span> ${E.toLocaleString()}</div>
                <div><span style="color:#777;">Transferred Votes:</span> ${n.toLocaleString()} (${p}%)</div>
                <div><span style="color:#777;">Abstain / Protest Split:</span> ${(j??0).toLocaleString()} / ${(pe??0).toLocaleString()}</div>
                <div><span style="color:#777;">Margin vs Runner-up:</span> ${S.toLocaleString()} votes (${D} pp)</div>
            </div>
            <div style="margin-top:10px;font-size:0.76rem;color:#888;">Endorsement came from pre-election preference locked for this election.</div>
        </div>`;const F=e.results?.consequences||e.results?.runoff_consequences||e.results?.effects_applied||null;if(F){const u=i(F.approval,F.approval_change,F.approval_delta);u!==null&&(_+=`
                <div style="margin-top:12px;background:#111826;border:1px solid #2a3550;border-radius:6px;padding:12px 14px;">
                    <div style="font-size:0.74rem;color:#8ab4ff;text-transform:uppercase;letter-spacing:1px;font-weight:bold;margin-bottom:8px;">Post-Election Consequences</div>
                    <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:0.82rem;color:#c0d4ff;">
                        <div><span style="color:#7f9ad3;">Approval:</span> ${b(u," pts")}</div>
                    </div>
                </div>`)}const ue=e.results.turnout_pct||0,me=e.results.total_votes_cast||0,fe=e.results.total_abstentions||0;_+=`
        <div style="margin-top:12px;font-size:0.78rem;color:#666;">
            Turnout: ${ue}% &middot; ${me.toLocaleString()} votes cast &middot; ${fe.toLocaleString()} abstentions
        </div>`,document.getElementById("presidential-results-list").innerHTML=_}async function de(){if(!g)return;if(be(g)){const c=a=>{const d=document.getElementById(a);d&&(d.textContent="Never")},t=a=>{const d=document.getElementById(a);d&&(d.textContent="—")};c("next-election-tick"),t("ticks-until-election"),c("next-parliamentary-tick"),t("ticks-until-parliamentary"),c("next-presidential-tick"),t("ticks-until-presidential");return}const{data:e}=await v.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single();if(!e)return;const o=["January","February","March","April","May","June","July","August","September","October","November","December"],s=e.current_date.split(", ")[0],r=parseInt(e.current_date.split(", ")[1]),m=o.indexOf(s);function l(c){let t=m+c,a=r;for(;t>=12;)t-=12,a+=1;return o[t]+", "+a}if(N){const{data:c}=await v.from("elections").select("*").eq("nation_id",g.id).eq("status","scheduled").lte("election_tick",e.current_tick).order("election_tick",{ascending:!0}).limit(1).maybeSingle();if(c){const y=document.getElementById("next-parliamentary-tick"),E=document.getElementById("ticks-until-parliamentary"),n=document.getElementById("next-presidential-tick"),p=document.getElementById("ticks-until-presidential");(c.election_type||"parliamentary")==="presidential"?(n&&(n.textContent="Overdue — pending"),p&&(p.textContent="Will process next tick")):(y&&(y.textContent="Overdue — pending"),E&&(E.textContent="Will process next tick"))}let{data:t,error:a}=await v.from("elections").select("*").eq("nation_id",g.id).eq("status","scheduled").eq("election_type","parliamentary").gt("election_tick",e.current_tick).order("election_tick",{ascending:!0}).limit(1).maybeSingle();a&&console.error("loadElectionInfo: parliamentary query error:",a);let{data:d,error:x}=await v.from("elections").select("*").eq("nation_id",g.id).eq("status","scheduled").eq("election_type","presidential").gt("election_tick",e.current_tick).order("election_tick",{ascending:!0}).limit(1).maybeSingle();if(x&&console.error("loadElectionInfo: presidential query error:",x),!t&&!a){const{data:y}=await v.from("elections").select("election_tick").eq("nation_id",g.id).eq("status","completed").eq("election_type","parliamentary").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),E=y?y.election_tick:e.current_tick,n=g?.parliamentary_term_ticks||oe?.PARLIAMENTARY_TERM_TICKS||24;let p=E+n;p<=e.current_tick&&(p=e.current_tick+n);const{data:w,error:S}=await v.from("elections").insert({nation_id:g.id,election_tick:p,election_type:"parliamentary",status:"scheduled"}).select().single();!S&&w?(t=w,console.log("Auto-scheduled presidential parliamentary election at tick",p)):console.warn("Failed to auto-schedule presidential parliamentary:",S)}if(!d&&!x){const{data:y}=await v.from("elections").select("election_tick").eq("nation_id",g.id).eq("status","completed").eq("election_type","presidential").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),E=y?y.election_tick:e.current_tick,n=g?.presidential_term_ticks||oe?.PRESIDENTIAL_TERM_TICKS||48;let p=E+n;p<=e.current_tick&&(p=e.current_tick+n);const{data:w,error:S}=await v.from("elections").insert({nation_id:g.id,election_tick:p,election_type:"presidential",status:"scheduled"}).select().single();!S&&w?(d=w,console.log("Auto-scheduled presidential election at tick",p)):console.warn("Failed to auto-schedule presidential:",S)}const k=document.getElementById("next-parliamentary-tick"),h=document.getElementById("ticks-until-parliamentary"),A=document.getElementById("next-presidential-tick"),_=document.getElementById("ticks-until-presidential");if(t){const y=t.election_tick-e.current_tick;k&&(k.textContent=l(y)),h&&(h.textContent=y+(y===1?" tick":" ticks"))}else k&&(k.textContent="Not scheduled"),h&&(h.textContent="—");if(d){const y=d.election_tick-e.current_tick;A&&(A.textContent=l(y)),_&&(_.textContent=y+(y===1?" tick":" ticks"))}else A&&(A.textContent="Not scheduled"),_&&(_.textContent="—");return}const $=48,{data:L}=await v.from("elections").select("*").eq("nation_id",g.id).eq("status","scheduled").lte("election_tick",e.current_tick).order("election_tick",{ascending:!0}).limit(1).maybeSingle();if(L){const c=document.getElementById("next-election-tick"),t=document.getElementById("ticks-until-election");c&&(c.textContent="Overdue — pending"),t&&(t.textContent="Will process next tick");return}let{data:i}=await v.from("elections").select("*").eq("nation_id",g.id).eq("status","scheduled").gt("election_tick",e.current_tick).order("election_tick",{ascending:!0}).limit(1).maybeSingle();if(!i){const{data:c}=await v.from("elections").select("election_tick").eq("nation_id",g.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle();let a=(c?c.election_tick:e.current_tick)+$;a<=e.current_tick&&(a=e.current_tick+$);const{data:d,error:x}=await v.from("elections").insert({nation_id:g.id,election_tick:a,status:"scheduled"}).select().single();!x&&d?(i=d,console.log("Auto-scheduled next election at tick",a)):console.warn("Failed to auto-schedule election:",x)}const b=document.getElementById("next-election-tick"),C=document.getElementById("ticks-until-election");if(i){const c=i.election_tick-e.current_tick;b&&(b.textContent=l(c)),C&&(C.textContent=c+(c===1?" tick":" ticks"))}else b&&(b.textContent="Not scheduled"),C&&(C.textContent="—")}})();
