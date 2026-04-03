import{_ as y}from"./supabase-client-BXEzLDpS.js";/* empty css                  */import{i as ye}from"./common-CxfFcfZv.js";import"./guide-C4vj_XhJ.js";import{e as ie}from"./utils-C2W-HleY.js";import{initGameConfigForNation as ve,GAME_CONFIG as oe}from"./config-BIsh65GI.js";import{i as _e}from"./government-structure-Df0JI6nQ.js";import"./trade-constants-Dom427MH.js";import"./stats-D_P-mPhL.js";import"./bills-C4583fsP.js";import{c as W}from"./party-icons-CJ7uQoDE.js";import"./messaging-5qyQ6ziq.js";(function(){let g=null,z=null,R=!1,B=[],K=[],H=0;const se="parliamentary",Q=["#E91E63","#5b9bd5","#5cb85c","#d48a3c","#9C27B0","#00BCD4","#d9534f","#8BC34A","#FFC107","#673AB7"];function D(e,i){return B.find(a=>a.id===e)?.party_color||Q[i%Q.length]}function Y(e){return B.find(s=>s.id===e)?.party_logo||null}function J(e){return B.find(s=>s.id===e)?.custom_logo_url||null}async function X(){const{data:e}=await y.from("elections").select("*").eq("nation_id",g.id).eq("status","completed").eq("election_type",se).order("election_tick",{ascending:!1}).limit(1).maybeSingle();return e}ye("elections",async e=>{const{nation:i,faction:s}=e;if(g=i,ve(i),!i){document.getElementById("content-area").innerHTML=`
            <div class="placeholder-panel">
                <div class="ph-icon">🗳️</div>
                <h3>No Nation Selected</h3>
                <p>Your party is not assigned to a nation yet.</p>
            </div>`;return}R=_e(i),await ae()});async function ae(){const{data:e}=await y.from("factions").select("id, faction_name, seats, abbreviation, ideology_value_1, ideology_value_2, party_color, party_logo, custom_logo_url").eq("nation_id",g.id).eq("faction_type","party").order("seats",{ascending:!1});B=e||[];let i=null,s=null;if(R){i=await X();const{data:p}=await y.from("elections").select("*").eq("nation_id",g.id).eq("status","completed").eq("election_type","presidential").order("election_tick",{ascending:!1}).limit(1).maybeSingle();s=p}else i=await X();z=i?.id||null,K=i?.results?.votes||[],H=K.reduce((p,r)=>p+(r.seats||0),0),H===0&&(H=B.reduce((p,r)=>p+(r.seats||0),0));const a=`
        <div class="panel-padding">
            <!-- Presidential Candidate Results (Presidential systems only) -->
            ${R?`
            <div id="presidential-results-section" style="display: ${s?"block":"none"};">
                <div class="section-header">Presidential Election — <span id="presidential-election-year"></span></div>
                <div class="info-block" style="margin-bottom: 24px;">
                    <div id="presidential-results-list"></div>
                </div>
            </div>
            `:""}

            <!-- Parliamentary Election Results -->
            <div id="election-results-section" style="display: ${i?"block":"none"};">
                <div class="section-header">${R?"Parliamentary Election":"Election Results"} — <span id="election-year"></span></div>
                <div class="info-block" style="margin-bottom: 24px;">
                    <div id="election-results-list"></div>
                </div>
            </div>
            ${i?"":`
            <div class="info-block" style="margin-bottom: 24px; text-align: center; padding: 32px 16px;">
                <div style="font-size: 1.6rem; margin-bottom: 10px;">🗳️</div>
                <div style="font-size: 1rem; color: var(--text-secondary); font-weight: bold; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 6px;">No Election Held Yet</div>
                <div style="font-size: 0.85rem; color: #666;">The first election will be held once enough parties have joined the nation.</div>
            </div>
            `}

            <div class="section-header" style="margin-top: 30px;">Upcoming Elections</div>
            ${R?`
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
    `;document.getElementById("content-area").innerHTML=a,R&&s&&await ce(s),await re(i),le(i),await de()}async function re(e){if(!e||!e.results)return;const{data:i}=await y.from("shard").select("current_date, current_tick").eq("name","Alpha Shard").single();if(i){const a=["January","February","March","April","May","June","July","August","September","October","November","December"],p=i.current_date.split(", ")[0],r=parseInt(i.current_date.split(", ")[1]),I=a.indexOf(p),L=i.current_tick-e.election_tick;let t=I-L,_=r;for(;t<0;)t+=12,_-=1;const C=`${a[t%12]}, ${_}`;document.getElementById("election-year").textContent=C}const s=e.results.votes||[];document.getElementById("election-results-list").innerHTML=s.map((a,p)=>{const r=D(a.party_id,p),I=Y(a.party_id),L=J(a.party_id),t=I||L?`<span style="display:inline-flex;vertical-align:middle;margin-right:6px;">${W({customLogoUrl:L,iconKey:I,size:18,color:r})}</span>`:"";return`
        <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 12px; padding: 12px 0; border-bottom: 1px solid #222; align-items: center; border-left: 3px solid ${r}; padding-left: 10px;">
            <span style="font-size: 0.9rem; color: ${r}; font-weight: bold;">${t}${a.party_name}</span>
            <span style="font-size: 0.85rem; color: #aaa; text-align: right;">${(a.votes||0).toLocaleString()} Votes</span>
            <span style="font-size: 0.85rem; color: #aaa; text-align: right;">${a.vote_percentage||0}%</span>
            <span style="font-size: 0.85rem; font-weight: bold; color: #5cb85c; text-align: right;">${a.seats||0} Seats</span>
        </div>`}).join("")}async function le(e){const i=document.getElementById("election-breakdown-content");if(!i)return;const s=e?.id||null;if(!e){i.innerHTML='<div style="color:#888; padding:16px; font-size:0.85rem;">No completed parliamentary election is available yet.</div>';return}let a=e?.results?.bloc_details||[],p={};if(Array.isArray(a)||(a=[]),!(s&&z&&s!==z)){if(a.length===0){i.innerHTML='<div style="color:#666; padding:16px; font-size:0.85rem;">No historical bloc breakdown stored for this election.</div>';return}try{const{data:r}=await y.from("shard").select("current_date, current_tick").eq("name","Alpha Shard").single();if(r&&e.election_tick!=null){const t=["January","February","March","April","May","June","July","August","September","October","November","December"],_=r.current_date.split(", ")[0],C=parseInt(r.current_date.split(", ")[1]),u=t.indexOf(_),o=r.current_tick-e.election_tick;let c=u-o,b=C;for(;c<0;)c+=12,b-=1;const k=`${t[c%12]}, ${b}`,h=document.getElementById("election-breakdown-section"),E=h?.querySelector(".breakdown-date-label");E&&E.remove(),h&&h.querySelector(".section-header")?.insertAdjacentHTML("afterend",`<div class="breakdown-date-label" style="color:#888; font-size:0.78rem; margin-bottom:6px; padding:0 16px;">Last Election: ${k}</div>`)}if(!Object.keys(p).length)for(const t of e?.results?.votes||[])t?.party_id&&t?.party_name&&(p[t.party_id]=t.party_name);const I=[...a].sort((t,_)=>_.voter_count-t.voter_count),L={LIBERTY:"#9C27B0",EQUALITY:"#E91E63",FREEDOM:"#5b9bd5",SECURITY:"#d48a3c",INDIVIDUALISM:"#eab308",COLLECTIVISM:"#ec4899",TRADITION:"#795548",PROGRESS:"#00BCD4",NATIONALISM:"#FF5722",GLOBALISM:"#3F51B5"};if(s&&z&&s!==z)return;i.innerHTML=I.map((t,_)=>{const C="breakdown-bloc-"+_,u=(t.tags||[]).length>0?t.tags.map(n=>`<span class="ideology-tag tag-${n.toLowerCase()}">${n.toUpperCase()}</span>`).join(""):'<span style="font-size:0.78rem; color:#666; font-style:italic;">Unaligned</span>',c=(Array.isArray(t.party_votes)?t.party_votes.map(n=>({partyId:n?.party_id||null,name:n?.party_name||p[n?.party_id]||(n?.party_id?n.party_id.slice(0,8):"Unknown Party"),votes:Number(n?.votes)||0})):t?.blocVotes&&typeof t.blocVotes=="object"?Object.entries(t.blocVotes).map(([n,d])=>({partyId:n,name:p[n]||n.slice(0,8),votes:Number(d)||0})):[]).sort((n,d)=>d.votes-n.votes),b=c.length>0?c[0].votes:0,k=Number(t?.abstentions)||0,h=Number(t?.voter_count)||0,E=c.reduce((n,d)=>n+d.votes,0),A=Math.max(h-k,0),x=E>0?E:A,f=c.map((n,d)=>{const $=b>0?n.votes/b*100:0,S=n.votes===b,O=n.partyId?D(n.partyId,d):S?"#ffcc00":"#555",T=O,F=S?" top-party":"",j=x>0?(n.votes/x*100).toFixed(1):"0.0";return`<div class="bloc-vote-row">
                    <span class="bloc-vote-name${F}" style="color:${O}">${n.name}</span>
                    <div class="bloc-vote-bar-wrap">
                        <div class="bloc-vote-bar" style="width:${$}%; background:${T};"></div>
                    </div>
                    <span class="bloc-vote-count${F}">${n.votes.toLocaleString()} (${j}%)</span>
                </div>`}).join(""),w=k>0?`<div class="bloc-abstentions">Abstained: ${k.toLocaleString()} voters</div>`:"";return`<div class="bloc-row" id="${C}">
                <div class="bloc-row-header" onclick="document.getElementById('${C}').classList.toggle('expanded')">
                    <div class="bloc-row-left">
                        <span class="bloc-row-name">${t.bloc_name}</span>
                        <span class="bloc-row-count">${h.toLocaleString()} voters</span>
                    </div>
                    <div class="bloc-row-arrow">&#9654;</div>
                </div>
                <div class="bloc-row-content">
                    <div class="bloc-tags-row">${u}</div>
                    <div>${f}</div>
                    ${w}
                </div>
            </div>`}).join("")}catch(r){console.error("Election breakdown error:",r),i.innerHTML='<div style="color:#ff6666; padding:16px; font-size:0.85rem;">Could not load election breakdown.</div>'}}}async function ce(e){if(!e||!e.results)return;const i=e.results.was_runoff||!1,s=e.results.round_1_candidates||[],a=e.results.runoff_candidates||[],p=i?a:e.results.presidential_candidates||[];if(p.length===0&&s.length===0){const l=document.getElementById("presidential-results-list");l&&(l.innerHTML='<div style="color:#888;padding:12px 0;">No presidential election results yet.</div>');return}const{data:r}=await y.from("shard").select("current_date, current_tick").eq("name","Alpha Shard").single();if(r){const l=["January","February","March","April","May","June","July","August","September","October","November","December"],v=r.current_date.split(", ")[0],M=parseInt(r.current_date.split(", ")[1]),V=l.indexOf(v),q=r.current_tick-e.election_tick;let m=V-q,N=M;for(;m<0;)m+=12,N-=1;const G=`${l[m%12]}, ${N}`,U=document.getElementById("presidential-election-year");U&&(U.textContent=G)}const I={LIBERTY:"#9C27B0",EQUALITY:"#E91E63",FREEDOM:"#5b9bd5",SECURITY:"#d48a3c",INDIVIDUALISM:"#eab308",COLLECTIVISM:"#ec4899",TRADITION:"#795548",PROGRESS:"#00BCD4",NATIONALISM:"#FF5722",GLOBALISM:"#3F51B5"};function L(l,v){const M=[...l].sort((m,N)=>N.votes-m.votes),V=M[0];let q="";return q+=`
            <div style="font-size:0.78rem;color:#aaa;text-transform:uppercase;letter-spacing:1px;font-weight:bold;margin:12px 0 6px 0;">${v}</div>
            <div style="display:grid;grid-template-columns:2fr 1.5fr 1fr 0.8fr;gap:12px;padding:8px 0;border-bottom:2px solid #333;font-size:0.75rem;color:#888;text-transform:uppercase;letter-spacing:1px;">
                <span>Candidate</span>
                <span>Party</span>
                <span style="text-align:right;">Votes</span>
                <span style="text-align:right;">%</span>
            </div>`,q+=M.map((m,N)=>{const G=(m.ideology||"").toUpperCase(),U=I[G]||"#888",Z=m.winner||m.candidate_id===V.candidate_id,ee=D(m.party_id||m.faction_id,N),te=Y(m.party_id||m.faction_id),ne=J(m.party_id||m.faction_id),ge=te||ne?`<span style="display:inline-flex;vertical-align:middle;margin-right:5px;">${W({customLogoUrl:ne,iconKey:te,size:16,color:ee})}</span>`:"";return`
                <div style="display:grid;grid-template-columns:2fr 1.5fr 1fr 0.8fr;gap:12px;padding:12px 0;border-bottom:1px solid #222;align-items:center;border-left:3px solid ${ee};padding-left:10px;">
                    <span style="font-size:0.9rem;color:${Z?"#5cb85c":"#e0e0e0"};font-weight:bold;">
                        ${Z?"&#x2713; ":""}${m.candidate_name}
                        <span style="display:inline-block;padding:2px 6px;border-radius:3px;font-size:0.6rem;font-weight:bold;color:#fff;background:${U};margin-left:6px;vertical-align:middle;">${m.ideology}</span>
                    </span>
                    <span style="font-size:0.85rem;color:#aaa;">${ge}${m.party_name}</span>
                    <span style="font-size:0.85rem;color:#aaa;text-align:right;">${(m.votes||0).toLocaleString()}</span>
                    <span style="font-size:0.85rem;color:#aaa;text-align:right;">${m.vote_percentage||0}%</span>
                </div>`}).join(""),q}function t(...l){for(const v of l)if(v!=null&&v!=="")return v;return null}function _(l,v=""){if(l==null||l==="")return"—";const M=Number(l);return Number.isNaN(M)?`${l}${v}`:`${M>0?"+":""}${M}${v}`}const u=[...p.length>0?p:s].sort((l,v)=>v.votes-l.votes),o=u[0],c=(o.ideology||"").toUpperCase(),b=I[c]||"#888",k=D(o.party_id||o.faction_id,0),h=Y(o.party_id||o.faction_id),E=J(o.party_id||o.faction_id),A=h||E?`<span style="display:inline-flex;vertical-align:middle;margin-right:8px;">${W({customLogoUrl:E,iconKey:h,size:22,color:k})}</span>`:"";let x=`
        <div style="background:linear-gradient(135deg,#1a2a1a,#0a1a0a);border:2px solid #5cb85c;border-radius:8px;padding:16px;margin-bottom:16px;border-left:4px solid ${k};">
            <div style="font-size:0.75rem;color:#5cb85c;text-transform:uppercase;letter-spacing:1px;font-weight:bold;margin-bottom:6px;">Presidential Election Winner${i?" (Runoff)":""}</div>
            <div style="font-size:1.1rem;color:#fff;font-weight:bold;">${o.candidate_name}</div>
            <div style="font-size:0.85rem;color:#aaa;margin-top:4px;">
                ${A}${o.party_name}
                <span style="display:inline-block;padding:2px 8px;border-radius:3px;font-size:0.65rem;font-weight:bold;color:#fff;background:${b};margin-left:8px;vertical-align:middle;">${o.ideology}</span>
            </div>
            <div style="font-size:0.82rem;color:#aaa;margin-top:4px;">${(o.votes||0).toLocaleString()} votes (${o.vote_percentage||0}%)</div>
        </div>`;i?(x+=`
            <div style="background:linear-gradient(135deg,#2a1a0a,#1a0a00);border:1px solid #d48a3c;border-radius:6px;padding:10px 14px;margin-bottom:16px;">
                <span style="font-size:0.75rem;color:#d48a3c;font-weight:bold;text-transform:uppercase;letter-spacing:1px;">Runoff Election</span>
                <span style="font-size:0.78rem;color:#aaa;margin-left:8px;">No candidate won a majority in Round 1. The top two advanced to a runoff.</span>
            </div>`,a.length>0&&(x+=L(a,"Runoff Results")),s.length>0&&(x+=`
                <details style="margin-top:16px;">
                    <summary style="cursor:pointer;font-size:0.78rem;color:#888;text-transform:uppercase;letter-spacing:1px;font-weight:bold;padding:8px 0;">Round 1 Results (${s.length} candidates)</summary>
                    <div style="opacity:0.8;">${L(s,"Round 1")}</div>
                </details>`)):x+=L(p,"Results");const w=(s.find(l=>l.candidate_id===o.candidate_id)||null)?.votes||0,n=Math.max(0,(o.votes||0)-w),d=w>0?Math.round(n/w*1e4)/100:0,$=u[1]||null,S=$?(o.votes||0)-($.votes||0):0,O=$?((o.vote_percentage||0)-($.vote_percentage||0)).toFixed(2):"0.00",T=e.results?.runoff_meta||e.results?.runoff_details||e.results?.runoff_transfer||{},F=t(o.endorsed_party_name,o.endorsed_party,T.endorsed_party_name,T.endorsed_party,e.results?.endorsed_party_name,e.results?.endorsed_party),j=t(T.abstain_votes,T.abstentions,T.abstain_count,e.results?.runoff_abstentions),pe=t(T.protest_votes,T.protest_count,T.protests,e.results?.runoff_protest_votes);x+=`
        <div style="margin-top:16px;background:#151515;border:1px solid #2b2b2b;border-radius:6px;padding:12px 14px;">
            <div style="font-size:0.74rem;color:#aaa;text-transform:uppercase;letter-spacing:1px;font-weight:bold;margin-bottom:8px;">Runoff Transfer Snapshot</div>
            <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:8px 16px;font-size:0.82rem;color:#bbb;">
                <div><span style="color:#777;">Endorsed Party:</span> ${ie(F||"—")}</div>
                <div><span style="color:#777;">Round 1 Votes (${ie(o.candidate_name)}):</span> ${w.toLocaleString()}</div>
                <div><span style="color:#777;">Transferred Votes:</span> ${n.toLocaleString()} (${d}%)</div>
                <div><span style="color:#777;">Abstain / Protest Split:</span> ${(j??0).toLocaleString()} / ${(pe??0).toLocaleString()}</div>
                <div><span style="color:#777;">Margin vs Runner-up:</span> ${S.toLocaleString()} votes (${O} pp)</div>
            </div>
            <div style="margin-top:10px;font-size:0.76rem;color:#888;">Endorsement came from pre-election preference locked for this election.</div>
        </div>`;const P=e.results?.consequences||e.results?.runoff_consequences||e.results?.effects_applied||null;if(P){const l=t(P.approval,P.approval_change,P.approval_delta),v=t(P.polarization,P.polarization_change,P.polarization_delta);(l!==null||v!==null)&&(x+=`
                <div style="margin-top:12px;background:#111826;border:1px solid #2a3550;border-radius:6px;padding:12px 14px;">
                    <div style="font-size:0.74rem;color:#8ab4ff;text-transform:uppercase;letter-spacing:1px;font-weight:bold;margin-bottom:8px;">Post-Election Consequences</div>
                    <div style="display:flex;flex-wrap:wrap;gap:16px;font-size:0.82rem;color:#c0d4ff;">
                        ${l!==null?`<div><span style="color:#7f9ad3;">Approval:</span> ${_(l," pts")}</div>`:""}
                        ${v!==null?`<div><span style="color:#7f9ad3;">Polarization:</span> ${_(v," pts")}</div>`:""}
                    </div>
                </div>`)}const ue=e.results.turnout_pct||0,me=e.results.total_votes_cast||0,fe=e.results.total_abstentions||0;x+=`
        <div style="margin-top:12px;font-size:0.78rem;color:#666;">
            Turnout: ${ue}% &middot; ${me.toLocaleString()} votes cast &middot; ${fe.toLocaleString()} abstentions
        </div>`,document.getElementById("presidential-results-list").innerHTML=x}async function de(){if(!g)return;const{data:e}=await y.from("shard").select("current_tick, current_date").eq("name","Alpha Shard").single();if(!e)return;const i=["January","February","March","April","May","June","July","August","September","October","November","December"],s=e.current_date.split(", ")[0],a=parseInt(e.current_date.split(", ")[1]),p=i.indexOf(s);function r(u){let o=p+u,c=a;for(;o>=12;)o-=12,c+=1;return i[o]+", "+c}if(R){const{data:u}=await y.from("elections").select("*").eq("nation_id",g.id).eq("status","scheduled").lte("election_tick",e.current_tick).order("election_tick",{ascending:!0}).limit(1).maybeSingle();if(u){const f=document.getElementById("next-parliamentary-tick"),w=document.getElementById("ticks-until-parliamentary"),n=document.getElementById("next-presidential-tick"),d=document.getElementById("ticks-until-presidential");(u.election_type||"parliamentary")==="presidential"?(n&&(n.textContent="Overdue — pending"),d&&(d.textContent="Will process next tick")):(f&&(f.textContent="Overdue — pending"),w&&(w.textContent="Will process next tick"))}let{data:o,error:c}=await y.from("elections").select("*").eq("nation_id",g.id).eq("status","scheduled").eq("election_type","parliamentary").gt("election_tick",e.current_tick).order("election_tick",{ascending:!0}).limit(1).maybeSingle();c&&console.error("loadElectionInfo: parliamentary query error:",c);let{data:b,error:k}=await y.from("elections").select("*").eq("nation_id",g.id).eq("status","scheduled").eq("election_type","presidential").gt("election_tick",e.current_tick).order("election_tick",{ascending:!0}).limit(1).maybeSingle();if(k&&console.error("loadElectionInfo: presidential query error:",k),!o&&!c){const{data:f}=await y.from("elections").select("election_tick").eq("nation_id",g.id).eq("status","completed").eq("election_type","parliamentary").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),w=f?f.election_tick:e.current_tick,n=g?.parliamentary_term_ticks||oe?.PARLIAMENTARY_TERM_TICKS||24;let d=w+n;d<=e.current_tick&&(d=e.current_tick+n);const{data:$,error:S}=await y.from("elections").insert({nation_id:g.id,election_tick:d,election_type:"parliamentary",status:"scheduled"}).select().single();!S&&$?(o=$,console.log("Auto-scheduled presidential parliamentary election at tick",d)):console.warn("Failed to auto-schedule presidential parliamentary:",S)}if(!b&&!k){const{data:f}=await y.from("elections").select("election_tick").eq("nation_id",g.id).eq("status","completed").eq("election_type","presidential").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),w=f?f.election_tick:e.current_tick,n=g?.presidential_term_ticks||oe?.PRESIDENTIAL_TERM_TICKS||48;let d=w+n;d<=e.current_tick&&(d=e.current_tick+n);const{data:$,error:S}=await y.from("elections").insert({nation_id:g.id,election_tick:d,election_type:"presidential",status:"scheduled"}).select().single();!S&&$?(b=$,console.log("Auto-scheduled presidential election at tick",d)):console.warn("Failed to auto-schedule presidential:",S)}const h=document.getElementById("next-parliamentary-tick"),E=document.getElementById("ticks-until-parliamentary"),A=document.getElementById("next-presidential-tick"),x=document.getElementById("ticks-until-presidential");if(o){const f=o.election_tick-e.current_tick;h&&(h.textContent=r(f)),E&&(E.textContent=f+(f===1?" tick":" ticks"))}else h&&(h.textContent="Not scheduled"),E&&(E.textContent="—");if(b){const f=b.election_tick-e.current_tick;A&&(A.textContent=r(f)),x&&(x.textContent=f+(f===1?" tick":" ticks"))}else A&&(A.textContent="Not scheduled"),x&&(x.textContent="—");return}const I=48,{data:L}=await y.from("elections").select("*").eq("nation_id",g.id).eq("status","scheduled").lte("election_tick",e.current_tick).order("election_tick",{ascending:!0}).limit(1).maybeSingle();if(L){const u=document.getElementById("next-election-tick"),o=document.getElementById("ticks-until-election");u&&(u.textContent="Overdue — pending"),o&&(o.textContent="Will process next tick");return}let{data:t}=await y.from("elections").select("*").eq("nation_id",g.id).eq("status","scheduled").gt("election_tick",e.current_tick).order("election_tick",{ascending:!0}).limit(1).maybeSingle();if(!t){const{data:u}=await y.from("elections").select("election_tick").eq("nation_id",g.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle();let c=(u?u.election_tick:e.current_tick)+I;c<=e.current_tick&&(c=e.current_tick+I);const{data:b,error:k}=await y.from("elections").insert({nation_id:g.id,election_tick:c,status:"scheduled"}).select().single();!k&&b?(t=b,console.log("Auto-scheduled next election at tick",c)):console.warn("Failed to auto-schedule election:",k)}const _=document.getElementById("next-election-tick"),C=document.getElementById("ticks-until-election");if(t){const u=t.election_tick-e.current_tick;_&&(_.textContent=r(u)),C&&(C.textContent=u+(u===1?" tick":" ticks"))}else _&&(_.textContent="Not scheduled"),C&&(C.textContent="—")}})();
