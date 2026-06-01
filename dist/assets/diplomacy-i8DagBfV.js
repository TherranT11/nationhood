import{_ as p}from"./supabase-client-BXEzLDpS.js";/* empty css                  *//* empty css                  */import{i as ta}from"./common-D2-5e1SV.js";import{a as b,t as Z,c as U}from"./utils-CzgKGX6o.js";import{i as oa}from"./government-types-BeJIFjWQ.js";import{f as aa}from"./government-structure-DBjJ7E-l.js";import"./config-BER7HlcX.js";import{c as ko,a as na,b as ia}from"./diplomacy-constants-DDYAx-fT.js";import{s as ra,a as xe}from"./political-actions-gAjzq9PT.js";import"./stats-C5reUrev.js";import"./preload-helper-BXl3LOEh.js";import"./factions-C2s734Ze.js";const sa=[{id:"world",label:"WORLD"},{id:"diplomacy",label:"DIPLOMACY"},{id:"trade",label:"TRADE"},{id:"ipo",label:"IPO"},{id:"sports",label:"SPORTS"}];let ne="world",_o=!1,Ge=!1,Ut=0;function Je(){const e=document.getElementById("diplo-subtabs");e&&(e.innerHTML=sa.map(t=>{let o="";return(t.id==="trade"||t.id==="world")&&Ge?o='<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--amber);margin-left:5px;vertical-align:middle;"></span>':t.id==="ipo"&&Ut>0&&(o=`<span class="badge badge--amber" style="margin-left:6px;">${Ut}</span>`),`<div class="diplo-subtab${ne===t.id?" active":""}" data-tab="${t.id}">${t.label}${o}</div>`}).join(""),e.onclick=t=>{const o=t.target.closest(".diplo-subtab");!o||o.dataset.tab===ne||(ne=o.dataset.tab,Je(),la())})}async function Io(){const e=F?.nation?.id,t=F?.faction?.id;if(!e||!t){Ge=!1;return}try{const{data:o}=await p.from("trade_negotiations").select("id, nation_a_id, nation_b_id, approved_by_a, approved_by_b").or(`nation_a_id.eq.${e},nation_b_id.eq.${e}`).in("status",["open","active"]);if(!o||o.length===0){Ge=!1;return}if(o.some(l=>{const s=l.nation_a_id===e,c=s?l.approved_by_a:l.approved_by_b;return(s?l.approved_by_b:l.approved_by_a)&&!c})){Ge=!0;return}const n=F?.shard?.current_tick||0,r=o.map(l=>l.id),{data:i}=await p.from("negotiation_messages").select("id, negotiation_id, sender_nation_id").in("negotiation_id",r).neq("sender_nation_id",e).eq("is_system",!1).gte("sent_at_tick",n-2).limit(1);Ge=i&&i.length>0}catch{Ge=!1}}function la(){const e=document.getElementById("subtab-world"),t=document.getElementById("subtab-diplomacy"),o=document.getElementById("subtab-trade"),a=document.getElementById("subtab-ipo"),n=document.getElementById("subtab-sports");if(!(!e||!t||!o||!a||!n))if(e.style.display=ne==="world"?"":"none",t.style.display=ne==="diplomacy"?"":"none",o.style.display=ne==="trade"?"":"none",a.style.display=ne==="ipo"?"":"none",n.style.display=ne==="sports"?"":"none",ne==="trade"&&!_o&&(_o=!0,ya()),ne==="sports"&&pa(),ne==="ipo")typeof re=="function"&&h&&re();else{if(typeof ke<"u"&&ke){try{p.removeChannel(ke)}catch{}ke=null}if(typeof Ie<"u"&&Ie){try{p.removeChannel(Ie)}catch{}Ie=null}}}const ca=.03,Yt=84,Gt=24,da=12;function dt(e){if(!e)return String(e);const t=["th","st","nd","rd"],o=e%100;return e+(t[(o-20)%10]||t[o]||t[0])}function Eo(e,t){return!t&&e<0?"UPCOMING":e<=2?`GROUP STAGE — ROUND ${e+1} IN PROGRESS`:e===3?"QUARTERFINALS IN PROGRESS":e===4?"SEMIFINALS IN PROGRESS":e===5?"FINAL IN PROGRESS":"COMPLETE"}function Ao(e,t,o){return!o&&t<0?"pending":e===0?"done":e===1?t<=2?"active":"done":e===2?t<=2?"pending":t<=4?"active":"done":e===3?t===5?"active":t>5?"done":"pending":"pending"}function So(e){const t=Number(e)||0;let o=-1;for(let n=0;n<1e3&&!(Yt+Gt*n>t);n++)o=n;const a=n=>{const r=Yt+Gt*n,i=r+5,l=t<r?-1:t-r,s=l>=0&&l<=5;return{cupNum:n+1,cupStart:r,cupEnd:i,isActive:s,stage:l,gs1:r,gs2:r+1,gs3:r+2,qf:r+3,sf:r+4,f:r+5}};return o>=0?a(o):a(0)}function pa(){const e=document.getElementById("sports-subtitle"),t=document.getElementById("sports-cards"),o=document.getElementById("vola-cup"),a=document.getElementById("vola-team");if(!e||!t)return;const n=F?.nation,r=F?.shard?.current_tick??0;if(!n){e.textContent="",t.innerHTML='<div class="sports-empty">No nation selected.</div>',o&&(o.innerHTML=""),a&&(a.innerHTML="");return}const i=Math.max(0,Math.min(100,Number(n.national_vola_culture)||0)),l=Math.round(i*ca*10)/10,s=(n.name||"").toUpperCase();e.textContent=`${s} NATIONAL VOLA AUTHORITY · TICK ${r}`;const c=Math.max(0,Number(n.vwc_ranking)||0),f=Math.max(0,Number(n.national_team_prowess)||0),u=Math.max(0,Number(n.vola_stadiums)||0);let v=null,m=null,d=null,g=null;for(let w=0;w<200&&(v===null||m===null);w++){const A=Yt+Gt*w,R=A-da;m===null&&R>=r&&(m=R,g=w+1),v===null&&A>=r&&(v=A,d=w+1)}const x=w=>{if(w==null)return"—";const A=Z(w),[R,N]=A.split(", ");return`${(R||"").slice(0,3)} ${N||""}`.trim()},I=x(v),$=x(m),E=v!=null?`${dt(d)} World Vola Cup · tick ${v}`:"no cup scheduled",T=m!=null?`${dt(g)} cup qualifiers · tick ${m}`:"no qualifiers scheduled";if(t.innerHTML=`
        <div class="sports-card">
            <div class="sports-card-header">
                <span class="sports-card-icon">&#x1F4CA;</span>
                <span class="sports-card-label">NATIONAL SPORTS CULTURE</span>
            </div>
            <div class="sports-card-value">${i}</div>
            <div class="sports-card-decay">&#x25BC; &minus;${l.toFixed(1)} next tick (3% decay)</div>
            <div class="sports-bar-track">
                <div class="sports-bar-fill" style="width:${i}%;"></div>
            </div>
            <div class="sports-bar-labels">
                <span>0</span>
                <span class="sports-bar-current">CURRENT ${i}</span>
                <span>100</span>
            </div>
        </div>
        <div class="sports-stat-grid">
            <div class="sports-stat-card sports-stat-card--clickable" id="vwc-ranking-card" role="button" tabindex="0" aria-expanded="false" aria-controls="vwc-ranking-panel">
                <div class="sports-stat-card-header">
                    <span class="sports-stat-card-icon">&#x1F3C6;</span>
                    <span class="sports-stat-card-label">VWC RANKING</span>
                    <span class="sports-stat-card-chevron" aria-hidden="true">&#x25BE;</span>
                </div>
                <div class="sports-stat-card-value">${c>0?dt(c):"—"}</div>
                <div class="sports-stat-card-sub">${c>0?"of 12 qualified":"unranked"}</div>
            </div>
            <div class="sports-stat-card">
                <div class="sports-stat-card-header">
                    <span class="sports-stat-card-icon">&#x26A1;</span>
                    <span class="sports-stat-card-label">TEAM PROWESS</span>
                </div>
                <div class="sports-stat-card-value">${f.toLocaleString()}</div>
                <div class="sports-stat-card-sub sports-stat-card-sub--accent">${f>0?"avg "+Math.round(f/3)+" per player":"no roster"}</div>
            </div>
            <div class="sports-stat-card">
                <div class="sports-stat-card-header">
                    <span class="sports-stat-card-icon">&#x1F3DF;</span>
                    <span class="sports-stat-card-label">STADIUMS BUILT</span>
                </div>
                <div class="sports-stat-card-value">${u}</div>
                <div class="sports-stat-card-sub">${u>0?"across the nation":"none yet"}</div>
            </div>
            <div class="sports-stat-card">
                <div class="sports-stat-card-header">
                    <span class="sports-stat-card-icon">&#x1F4C5;</span>
                    <span class="sports-stat-card-label">NEXT VOLA WORLD CUP QUALIFIERS</span>
                </div>
                <div class="sports-stat-card-value">${$}</div>
                <div class="sports-stat-card-sub">${T}</div>
            </div>
            <div class="sports-stat-card">
                <div class="sports-stat-card-header">
                    <span class="sports-stat-card-icon">&#x1F3C6;</span>
                    <span class="sports-stat-card-label">NEXT VOLA WORLD CUP</span>
                </div>
                <div class="sports-stat-card-value">${I}</div>
                <div class="sports-stat-card-sub">${E}</div>
            </div>
        </div>
        <div class="vwc-ranking-panel" id="vwc-ranking-panel" hidden>
            <div class="vwc-ranking-panel-header">
                <span class="vwc-ranking-panel-title">VWC RANKING &mdash; ALL NATIONS</span>
                <span class="vwc-ranking-panel-meta">Top 3 are <span class="vwc-ranking-panel-tag">[WORLD CLASS]</span></span>
            </div>
            <div class="vwc-ranking-panel-list" id="vwc-ranking-panel-list"></div>
        </div>
    `,ma(),o){o.innerHTML=ua(r);const w=So(r);w?.cupNum&&(va(w.cupNum).catch(A=>console.warn("[Sports] placement render failed:",A?.message||A)),ba(w.cupNum).catch(A=>console.warn("[Sports] group render failed:",A?.message||A)),fa(w.cupNum).catch(A=>console.warn("[Sports] host render failed:",A?.message||A)),_a(w.cupNum).catch(A=>console.warn("[Sports] knockout render failed:",A?.message||A)),ga(w.cupNum,r).catch(A=>console.warn("[Sports] schedule render failed:",A?.message||A)))}a&&(a.innerHTML=`
            <div class="vola-team-header">
                <span class="vola-team-title"><span class="vola-team-icon">&#x274C;</span> NATIONAL VOLA TEAM</span>
                <span class="vola-team-meta" id="vola-team-meta">&hellip;</span>
            </div>
            <div class="vola-team-grid" id="vola-team-grid">
                <div class="sports-empty">Loading roster&hellip;</div>
            </div>
            <div class="vola-team-footer" id="vola-team-footer"></div>
        `,No(r).catch(w=>console.warn("[Sports] team render failed:",w?.message||w)))}async function ma(){const e=document.getElementById("vwc-ranking-panel-list");if(!e)return;let t=Array.isArray(K)?K:[];if(t.length===0){e.innerHTML='<div class="sports-empty">Loading rankings&hellip;</div>';try{const{data:n}=await p.from("nations").select("id, name, flag_url, vwc_ranking").order("name");t=n||[],K=t}catch(n){e.innerHTML=`<div class="sports-empty">Failed to load: ${b(n?.message||"")}</div>`;return}}if(t.length===0){e.innerHTML='<div class="sports-empty">No nation data available.</div>';return}const o=t.slice().sort((n,r)=>{const i=Number(n?.vwc_ranking)||0,l=Number(r?.vwc_ranking)||0;return i===0&&l===0?(n.name||"").localeCompare(r.name||""):i===0?1:l===0?-1:i-l}),a=F?.nation?.id;e.innerHTML=o.map((n,r)=>{const i=Number(n.vwc_ranking)||0,l=Ke(n,"vwc-ranking-flag"),s=i>0?dt(i):"—",c=i>0&&i<=3?'<span class="vwc-ranking-tag">[WORLD CLASS]</span>':"";return`
            <div class="vwc-ranking-row${n.id&&a&&n.id===a?" vwc-ranking-row--me":""}">
                <span class="vwc-ranking-rank">${s}</span>
                ${l}
                <span class="vwc-ranking-name">${b(n.name||"Unknown")}</span>
                ${c}
            </div>
        `}).join("")}document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("#vwc-ranking-card");if(!t)return;const o=document.getElementById("vwc-ranking-panel");if(!o)return;const a=!o.hidden;o.hidden=a,t.setAttribute("aria-expanded",String(!a)),t.classList.toggle("sports-stat-card--open",!a)});document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const t=e.target&&e.target.id==="vwc-ranking-card"?e.target:null;t&&(e.preventDefault(),t.click())});function ua(e){const t=So(e);if(!t)return"";const a=t.stage<0?`Next World Cup &mdash; <span class="vola-cup-title-date">${Z(t.gs1)}</span>`:`${dt(t.cupNum)} World <span class="vola-cup-title-accent">Vola</span> Cup`,n=t.isActive?'<span class="vola-cup-live">&bullet; LIVE</span>':"",r=Eo(t.stage,t.isActive),i=u=>u==="done"?"&check;":u==="active"?"&times;":"&#9675;",l=(u,v)=>{const m=Ao(u,t.stage,t.isActive);return`<div class="vola-cup-tab vola-cup-tab--${m}">
            <span class="vola-cup-tab-icon">${i(m)}</span> ${v}
        </div>`},s=u=>`
        <div class="vola-cup-group-row">
            <span class="vola-cup-group-rank">${u}.</span>
            <span class="vola-cup-group-team vola-cup-group-team--blank">&mdash;</span>
            <span class="vola-cup-group-stat vola-cup-group-stat--blank">&mdash;</span>
            <span class="vola-cup-group-stat vola-cup-group-stat--blank">&mdash;</span>
            <span class="vola-cup-group-stat vola-cup-group-stat--blank">&mdash;</span>
        </div>
    `,c=u=>`
        <div class="vola-cup-group vola-cup-group--${u.toLowerCase()}" data-cup-num="${t.cupNum}" data-group-letter="${u}">
            <div class="vola-cup-group-header">GROUP <span class="vola-cup-group-letter">${u}</span></div>
            <div class="vola-cup-group-table">
                <div class="vola-cup-group-row vola-cup-group-row--head">
                    <span class="vola-cup-group-rank"></span>
                    <span class="vola-cup-group-team"></span>
                    <span class="vola-cup-group-stat-label">W-L</span>
                    <span class="vola-cup-group-stat-label">PTS</span>
                    <span class="vola-cup-group-stat-label">RANK</span>
                </div>
                <div class="vola-cup-group-rows">
                    ${[1,2,3,4].map(s).join("")}
                </div>
            </div>
        </div>
    `,f=(u,v,m="&mdash;",d="&mdash;")=>`
        <div class="vola-cup-match" data-cup-num="${t.cupNum}" data-round="${u}" data-match-num="${v}">
            <div class="vola-cup-match-team" data-side="a">${m}</div>
            <div class="vola-cup-match-team" data-side="b">${d}</div>
            <div class="vola-cup-match-status">PENDING</div>
        </div>
    `;return`
        <div class="vola-cup-header">
            <div class="vola-cup-header-left">
                <div class="vola-cup-title-row">
                    ${n}
                    <span class="vola-cup-title">${a}</span>
                </div>
                <div class="vola-cup-meta">
                    <span class="vola-cup-meta-icon">&#x1F4CD;</span>
                    HOSTED BY <span class="vola-cup-meta-host">[NO HOST]</span>
                    &middot; 12 TEAMS
                </div>
            </div>
            <div class="vola-cup-header-right">
                <div class="vola-cup-status" data-cup-sched="status">${r}</div>
                <div class="vola-cup-schedule">
                    <div data-cup-sched="qf">${Z(t.qf)} &mdash; Quarterfinals begin</div>
                    <div data-cup-sched="sf">${Z(t.sf)} &mdash; Semifinals</div>
                    <div data-cup-sched="f">${Z(t.f)} &mdash; Final</div>
                </div>
            </div>
        </div>

        <div class="vola-cup-tabs" data-cup-sched="tabs">
            ${l(0,"PLACEMENT MATCHES")}
            ${l(1,"GROUP STAGE")}
            ${l(2,"KNOCKOUT ROUND")}
            ${l(3,"FINAL")}
        </div>

        <div class="vola-cup-section-label">
            <span class="vola-cup-section-icon">&#x1F4CA;</span> GROUP STAGE FINAL STANDINGS
        </div>
        <div class="vola-cup-groups">
            ${c("A")}
            ${c("B")}
            ${c("C")}
        </div>

        <div class="vola-cup-section-label vola-cup-section-label--knockout">
            <span class="vola-cup-section-icon">&times;</span> KNOCKOUT ROUND
        </div>
        <div class="vola-cup-bracket" data-cup-num="${t.cupNum}">
            <div class="vola-cup-bracket-col">
                <div class="vola-cup-bracket-col-label" data-cup-sched="bracket-qf">QUARTERFINALS &middot; ${Z(t.qf)}</div>
                ${f("QF",1)}
                ${f("QF",2)}
                ${f("QF",3)}
                ${f("QF",4)}
            </div>
            <div class="vola-cup-bracket-col">
                <div class="vola-cup-bracket-col-label" data-cup-sched="bracket-sf">SEMIFINALS &middot; ${Z(t.sf)}</div>
                ${f("SF",1,"Winner QF1","Winner QF2")}
                ${f("SF",2,"Winner QF3","Winner QF4")}
            </div>
            <div class="vola-cup-bracket-col">
                <div class="vola-cup-bracket-col-label" data-cup-sched="bracket-f">FINAL &middot; ${Z(t.f)}</div>
                ${f("F",1,"Winner SF1","Winner SF2")}
                <div class="vola-cup-champion">
                    <div class="vola-cup-champion-icon">&#x1F3C6;</div>
                    <div class="vola-cup-champion-label">VWC CHAMPION</div>
                    <div class="vola-cup-champion-text">To Be Crowned</div>
                </div>
            </div>
        </div>

        <!-- Scheduled Qualifiers box: bottom-3 round-robin lined up at
             the qualifier tick. Populated async by loadVolaPlacement
             so the synchronous render stays cheap. -->
        <div class="vola-cup-placement" id="vola-cup-placement-${t.cupNum}">
            <div class="vola-cup-section-label">
                <span class="vola-cup-section-icon">&times;</span> SCHEDULED QUALIFIERS
            </div>
            <div class="vola-cup-placement-body" data-cup-num="${t.cupNum}">
                <div class="sports-empty">Loading placement matches&hellip;</div>
            </div>
        </div>
    `}const yo=["#d65a5a","#e07a3a","#e8b13a","#cdd055","#9ac84e","#5eb564","#4ab59c","#5aa9d6","#6e8ad6","#9070cf","#b46ac5","#d66aaa","#cc8866"];function ut(e){if(!e)return"var(--text-bright)";let t=0;for(let o=0;o<e.length;o++)t=t*31+e.charCodeAt(o)|0;return yo[Math.abs(t)%yo.length]}function Ke(e,t){if(!e)return"";const o=e.name||"",a=e.flag_url||Ma[o]||(o?`assets/flags/${o}.png`:"");return a?`<img class="${t}" src="${b(a)}" alt="" loading="lazy" onerror="this.style.display='none'">`:""}async function fa(e){const t=document.querySelector(".vola-cup-meta-host");if(!t)return;const{data:o,error:a}=await p.from("vola_cup_hosts").select("host_nation_id, nations:host_nation_id(name)").eq("cup_number",e).maybeSingle();if(a){console.warn("[Sports] host fetch failed:",a.message);return}const n=o?.nations?.name;n&&(t.textContent=n.toUpperCase())}async function ga(e,t){const{data:o,error:a}=await p.from("vola_cup_group_matches").select("scheduled_tick").eq("cup_number",e).eq("round_number",1).order("scheduled_tick",{ascending:!0}).limit(1);if(a){console.warn("[Sports] schedule fetch failed:",a.message||a);return}if(!o||o.length===0)return;const n=Number(o[0].scheduled_tick);if(!Number.isFinite(n))return;const r=n+3,i=n+4,l=n+5,s=(m,d)=>{const g=document.querySelector(`[data-cup-sched="${m}"]`);g&&(g.textContent=d)};s("qf",`${Z(r)} — Quarterfinals begin`),s("sf",`${Z(i)} — Semifinals`),s("f",`${Z(l)} — Final`),s("bracket-qf",`QUARTERFINALS · ${Z(r)}`),s("bracket-sf",`SEMIFINALS · ${Z(i)}`),s("bracket-f",`FINAL · ${Z(l)}`);const f=(Number(t)||0)-n,u=f>=0&&f<=5;s("status",Eo(f,u));const v=document.querySelector('[data-cup-sched="tabs"]');if(v){const m=d=>d==="done"?"✓":d==="active"?"×":"○";v.querySelectorAll(".vola-cup-tab").forEach((d,g)=>{const x=Ao(g,f,u);d.className=`vola-cup-tab vola-cup-tab--${x}`;const I=d.querySelector(".vola-cup-tab-icon");I&&(I.textContent=m(x))})}}async function va(e){const t=document.querySelector(`.vola-cup-placement-body[data-cup-num="${e}"]`);if(!t)return;const{data:o,error:a}=await p.from("vola_placement_matches").select("match_number, scheduled_tick, team_a_score, team_b_score, winner_nation_id, team_a:team_a_nation_id(id, name, flag_url), team_b:team_b_nation_id(id, name, flag_url)").eq("cup_number",e).order("match_number",{ascending:!0});if(a){t.innerHTML=`<div class="sports-empty">Failed to load placement matches: ${b(a.message||"")}</div>`;return}if(!o||o.length===0){t.innerHTML='<div class="sports-empty">Placement schedule not yet generated. The bottom 3 nations face a 3-tick round-robin starting at the qualifier tick.</div>';return}t.innerHTML=o.map(n=>{const r=n.team_a?.name||"TBD",i=n.team_b?.name||"TBD",l=Ke(n.team_a,"vola-flag"),s=Ke(n.team_b,"vola-flag"),c=ut(r),f=ut(i),u=n.team_a_score,v=n.team_b_score,m=u!=null&&v!=null,d=n.winner_nation_id,g=m&&d===n.team_a?.id,x=m&&d===n.team_b?.id,I=g?c:m?"var(--text-dim)":c,$=x?f:m?"var(--text-dim)":f,E=g?`text-shadow:0 0 8px ${c}55;`:"",T=x?`text-shadow:0 0 8px ${f}55;`:"";return`
            <div class="vola-placement-row ${m?"played":"pending"}">
                <div class="vola-placement-meta">
                    <span class="vola-placement-num">MATCH ${n.match_number}</span>
                    <span class="vola-placement-tick">${Z(n.scheduled_tick)} &middot; tick ${n.scheduled_tick}</span>
                </div>
                <div class="vola-placement-teams">
                    <span class="vola-placement-team ${g?"won":""}" style="color:${I};${E}">${l}${b(r)}</span>
                    <span class="vola-placement-score">${m?`<strong style="color:${c};">${u}</strong> &mdash; <strong style="color:${f};">${v}</strong>`:"vs"}</span>
                    <span class="vola-placement-team ${x?"won":""}" style="color:${$};${T}">${s}${b(i)}</span>
                </div>
            </div>
        `}).join("")}async function ba(e){const t=document.querySelectorAll(`.vola-cup-group[data-cup-num="${e}"]`);if(!t.length)return;const[o,a]=await Promise.all([p.from("vola_cup_groups").select("group_letter, seed_rank, qualified_via, nation:nation_id(id, name, flag_url, vwc_ranking)").eq("cup_number",e),p.from("vola_cup_group_matches").select("group_letter, team_a_nation_id, team_b_nation_id, team_a_score, team_b_score, winner_nation_id, resolved_at_tick").eq("cup_number",e)]);if(o.error){console.warn("[Sports] vola_cup_groups fetch failed:",o.error.message||o.error);return}a.error&&console.warn("[Sports] vola_cup_group_matches fetch failed:",a.error.message||a.error);const n=o.data||[];if(n.length===0)return;const r=new Map,i=s=>(r.has(s)||r.set(s,{wins:0,losses:0,points:0,played:0}),r.get(s));for(const s of a.data||[]){if(s.resolved_at_tick==null)continue;const c=s.team_a_nation_id,f=s.team_b_nation_id,u=Number(s.team_a_score)||0,v=Number(s.team_b_score)||0,m=i(c),d=i(f);m.points+=u,d.points+=v,m.played++,d.played++,s.winner_nation_id===c?(m.wins++,d.losses++):s.winner_nation_id===f&&(d.wins++,m.losses++)}const l={A:[],B:[],C:[]};for(const s of n){if(!l[s.group_letter])continue;const c=s.nation?.id,f=c&&r.get(c);l[s.group_letter].push({...s,wins:f?f.wins:0,losses:f?f.losses:0,points:f?f.points:0,played:f?f.played:0,ranking:Number(s.nation?.vwc_ranking)||0})}t.forEach(s=>{const c=s.getAttribute("data-group-letter"),f=s.querySelector(".vola-cup-group-rows");if(!f)return;const u=(l[c]||[]).slice();if(u.length===0)return;const v=m=>m>0?m:Number.POSITIVE_INFINITY;u.sort((m,d)=>{if(d.wins!==m.wins)return d.wins-m.wins;if(d.points!==m.points)return d.points-m.points;const g=v(m.ranking),x=v(d.ranking);if(g!==x)return g-x;const I=m.nation?.name||"",$=d.nation?.name||"";return I.localeCompare($)}),f.innerHTML=u.map((m,d)=>{const g=m.nation||{},x=g.name||"TBD",I=Ke(g,"vola-cup-group-flag"),$=ut(x),E=m.qualified_via==="placement"?'<span class="vola-cup-group-via" title="Qualified via placement round">P</span>':"",T=m.played>0?`${m.wins}-${m.losses}`:'<span class="vola-cup-group-stat--blank">&mdash;</span>',w=m.played>0?String(m.points):'<span class="vola-cup-group-stat--blank">&mdash;</span>',A=m.ranking>0?String(m.ranking):'<span class="vola-cup-group-stat--blank">&mdash;</span>';return`
                <div class="vola-cup-group-row">
                    <span class="vola-cup-group-rank">${d+1}.</span>
                    <span class="vola-cup-group-team" style="color:${$};">${I}${b(x)}${E}</span>
                    <span class="vola-cup-group-stat">${T}</span>
                    <span class="vola-cup-group-stat">${w}</span>
                    <span class="vola-cup-group-stat">${A}</span>
                </div>
            `}).join("")})}async function _a(e){const t=document.querySelector(`.vola-cup-bracket[data-cup-num="${e}"]`);if(!t)return;const{data:o,error:a}=await p.from("vola_cup_knockout").select("round, match_number, team_a_seed, team_b_seed, feeder_a_match, feeder_b_match, team_a_score, team_b_score, winner_nation_id, resolved_at_tick, team_a:team_a_nation_id(id, name, flag_url), team_b:team_b_nation_id(id, name, flag_url)").eq("cup_number",e);if(a){console.warn("[Sports] vola_cup_knockout fetch failed:",a.message||a);return}if(!o||o.length===0)return;const n=o.find(i=>i.round==="F"),r=t.querySelector(".vola-cup-champion-text");if(r)if(n?.winner_nation_id&&(n.team_a||n.team_b)){const i=n.winner_nation_id===n.team_a?.id?n.team_a:n.team_b;if(i?.name){const l=Ke(i,"vola-cup-champion-flag"),s=ut(i.name);r.innerHTML=`${l}<span style="color:${s};">${b(i.name)}</span>`,t.classList.add("vola-cup-bracket--crowned")}}else r.textContent="To Be Crowned",t.classList.remove("vola-cup-bracket--crowned");for(const i of o){const l=t.querySelector(`.vola-cup-match[data-round="${i.round}"][data-match-num="${i.match_number}"]`);if(!l)continue;const s=l.querySelector('[data-side="a"]'),c=l.querySelector('[data-side="b"]'),f=l.querySelector(".vola-cup-match-status");if(!s||!c)continue;const u=(v,m,d)=>{if(v?.id){const g=Ke(v,"vola-cup-match-flag");return`<span style="color:${ut(v.name)};">${g}${b(v.name||"TBD")}</span>`}return d!=null?`Winner ${i.round==="SF"?`QF${d}`:`SF${d}`}`:m};if(s.innerHTML=u(i.team_a,"&mdash;",i.feeder_a_match),c.innerHTML=u(i.team_b,"&mdash;",i.feeder_b_match),l.classList.remove("vola-cup-match--played","vola-cup-match--win-a","vola-cup-match--win-b"),f)if(i.resolved_at_tick!=null&&i.winner_nation_id){const v=Number(i.team_a_score)||0,m=Number(i.team_b_score)||0;f.textContent=`${v} – ${m}`,l.classList.add("vola-cup-match--played");const d=i.winner_nation_id===i.team_a?.id?"a":"b";l.classList.add(`vola-cup-match--win-${d}`)}else f.textContent="PENDING"}}async function No(e){const t=document.getElementById("vola-team-grid"),o=document.getElementById("vola-team-meta"),a=document.getElementById("vola-team-footer");if(!t)return;const n=F?.nation;if(!n?.id){t.innerHTML='<div class="sports-empty">No nation selected.</div>',o&&(o.textContent=""),a&&(a.innerHTML="");return}const{data:r,error:i}=await p.from("vola_team_players").select("id, position_number, position_name, first_name, last_name, age, rating, recruited_at_tick, recruited_at_culture, retires_at_tick, is_captain").eq("nation_id",n.id).order("position_number",{ascending:!0});if(i){t.innerHTML=`<div class="sports-empty">Failed to load roster: ${b(i.message||"")}</div>`,o&&(o.textContent=""),a&&(a.innerHTML="");return}if(!r||r.length===0){t.innerHTML='<div class="sports-empty">Roster pending — players generate next tick.</div>',o&&(o.textContent=""),a&&(a.innerHTML="");return}const l=r.reduce((s,c)=>s+(Number(c.rating)||0),0);if(o&&(o.textContent=`${r.length} PLAYERS · TOTAL PROWESS ${l}`),t.innerHTML=r.map(s=>{const c=Math.max(0,Number(s.retires_at_tick)-Number(e)),f=c===1,u=`${s.first_name||""} ${s.last_name||""}`.trim()||"Unnamed",v=Number(s.recruited_at_culture).toFixed(0),m=f?"vola-player-card vola-player-card--retiring":"vola-player-card",d=f?'<div class="vola-player-retire-warn"><span>&#9888;</span> RETIRES NEXT TICK</div>':`<div class="vola-player-remaining"><span>&#x29D6;</span> ${c} tick${c===1?"":"s"} remaining</div>`,g=f?`<button class="vola-player-recruit-btn" data-position="${s.position_number}">RECRUIT REPLACEMENT &rarr;</button>`:"",x=s.is_captain?`CAPTAIN &middot; POS ${s.position_number}`:`POSITION ${s.position_number}`;return`
            <div class="${m}">
                <div class="vola-player-pos">${x}</div>
                <div class="vola-player-name">${b(u)}</div>
                <div class="vola-player-meta">${b(s.position_name||"").toUpperCase()} &middot; AGE ${Number(s.age)||"?"}</div>
                <div class="vola-player-rating"><span class="vola-player-rating-num">${Number(s.rating)||0}</span> <span class="vola-player-rating-label">RATING</span></div>
                ${d}
                <div class="vola-player-recruit-line">recruited at Culture ${b(v)} &middot; tick ${Number(s.recruited_at_tick)||0}</div>
                ${g}
            </div>
        `}).join(""),a){const s=r.map(c=>Number(c.rating)||0).join(" + ");a.innerHTML=`
            <div class="vola-team-footer-left">
                <div class="vola-team-footer-label">TEAM PROWESS (sum)</div>
                <div class="vola-team-footer-formula">${s} = ${l}</div>
            </div>
            <div class="vola-team-footer-total">${l}</div>
        `}t.querySelectorAll("[data-position]").forEach(s=>{s.tagName==="BUTTON"&&s.addEventListener("click",async()=>{const c=Number(s.dataset.position);if(c&&confirm("Force-retire this player and recruit a replacement at current culture?")){s.disabled=!0,s.textContent="RECRUITING…";try{const{data:f,error:u}=await p.rpc("recruit_vola_player_replacement",{p_position_number:c});if(u)throw u;if(!f?.success)throw new Error(f?.reason||"Recruit failed")}catch(f){alert("Recruit failed: "+(f?.message||f)),s.disabled=!1,s.textContent="RECRUIT REPLACEMENT →";return}await No(e)}})})}const To={fuel_energy:"⛽",minerals:"⛏️",food_agriculture:"🌾",grains_staples:"🌾",livestock_dairy:"🥬",fruits_vegetables:"🍎",cash_crops:"🌿",manufactured_goods:"🏭",technology:"💻",arms:"⚔️",tourism:"✈️",services_finance:"🏦"},Tt={fuel_energy:"Fuel & Energy",minerals:"Minerals",food_agriculture:"Food & Agriculture",grains_staples:"Grains & Staples",livestock_dairy:"Livestock & Dairy",fruits_vegetables:"Fruits & Veg",cash_crops:"Cash Crops",manufactured_goods:"Manufactured",technology:"Technology",arms:"Arms",tourism:"Tourism",services_finance:"Services & Finance"};let ce={},Wt=null,xt=null,Xt=[];async function ya(){const e=document.getElementById("trade-left"),t=document.getElementById("trade-right");if(!(!e||!t)){e.innerHTML='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Loading trade data...</div>',t.innerHTML="";try{await xa()}catch(o){console.error("[Trade] Failed to load trade data:",o)}try{await Ea()}catch(o){console.error("[Trade] Failed to load partner flows:",o)}if(!je)try{const[o,a]=await Promise.all([p.from("diplomatic_relations").select("*"),p.from("trade_agreements").select("*").eq("status","active")]);je=o.data||[],to=a.data||[]}catch{}try{await Pt()}catch(o){console.error("[Trade] Failed to load agreements/shipping:",o)}ha(),so(),Ve(),Ae()}}function ha(){const e=document.getElementById("trade-header-stats");if(!e)return;const t=Oe.filter(o=>o.status==="active").length;e.innerHTML=`<div class="tr-header-stats">
        <div class="tr-header-stat">
            <div class="tr-header-stat-label">AGREEMENTS</div>
            <div class="tr-header-stat-value">${t} active</div>
        </div>
    </div>`}async function xa(){ce={},Xt=[]}function wa(e,t){const o=F?.nation?.id;if(!o||!e)return 0;let a=0;for(const n of Oe||[])if(n.nation_a_id===o&&n.nation_b_id===e||n.nation_b_id===o&&n.nation_a_id===e)for(const i of Ee[n.id]||[])ft(i)&&a++;return a}function Ct(e){const t=F?.nation?.id,o=(K||[]).find(r=>r.id===t),a=(K||[]).find(r=>r.id===e),n=(je||[]).find(r=>r.nation_a_id===t&&r.nation_b_id===e||r.nation_b_id===t&&r.nation_a_id===e);return ra(o,a,n?.border_types)||{needsShipping:!0,reason:null}}function ho(e,t){const o=Ct(e)||{needsShipping:!0,reason:null};if(!o.needsShipping)return{pct:100,ships:0,reason:o.reason};const a=wa(e);return{pct:Math.min(100,85+a*3),ships:a,reason:null}}function xo(e,t){const a=(Ee[e]||[]).filter(ft);if(a.length===0){const n=t?Ct(t):null;return n&&!n.needsShipping?{pct:100,ships:0,reason:n.reason}:{pct:85,ships:0,reason:null}}return{pct:Math.min(100,85+a.length*3),ships:a.length,reason:null}}function It(e){const{pct:t,ships:o,reason:a}=e,n=t>=100?"var(--green)":t>85?"var(--amber)":"var(--red)";let r;return a==="landlocked"?r="landlocked":a==="land_border"?r="land border":o===0?r="no active shipping":r=`+${o*3} for ${o} ship${o!==1?"s":""} on trade route`,`<span style="font-family:var(--font-mono);font-size:9px;color:${n};white-space:nowrap;">[${t}% — ${b(r)}]</span>`}function Et(e){if(!e)return[];const t=Number(e.energy)||0,o=Number(e.infrastructure)||0,a=Number(e.industry)||0,n=Number(e.standard_of_living)||0,r=(Number(e.population)||0)/1e6,i=Number(e.minerals)||0,l=Number(e.unskilled_workers)||0,s=Number(e.farmland)||0,c=Number(e.education)||0,f=Number(e.service_sector)||0;return[{key:"energy",name:"Energy",icon:"⚡",prod:t/3,potential:t/3,dem:(o+a)*n*Math.sqrt(r)/3500},{key:"minerals",name:"Minerals",icon:"⛏",prod:i/3*((l+a)/200),potential:i/3,dem:o/10+a/16},{key:"food",name:"Food",icon:"🌾",prod:s/2*(l/100),potential:s/2,dem:r/3},{key:"consumer_goods",name:"Consumer Goods",icon:"📦",prod:a/3*(l/100),potential:a/3,dem:n/100*r/2},{key:"luxury_goods",name:"Luxury Goods",icon:"💎",prod:n/6*(c*f/1e4),potential:n/6,dem:Math.pow(n/100,2)*r}]}function so(){const e=document.getElementById("trade-left");if(!e)return;const t=F?.nation||{},o=Oo(),a=Et(t).map(d=>{const g=Number(o[d.key])||0;return{key:d.key,icon:d.icon,name:d.name,production:d.prod,potential:d.potential,domesticDemand:d.dem,demand:0,trading:g,netFlow:d.prod-d.dem+g,selfSufficiencyBalance:null,statBased:!0}});for(const[d,g]of Object.entries(ce))d==="food_agriculture"&&(ce.grains_staples||ce.livestock_dairy)||a.push({key:d,icon:To[d]||"📦",name:Tt[d]||d,production:Number(g.domestic_production)||0,domesticDemand:Number(g.domestic_demand)||0,demand:Number(g.import_demand)||0,netFlow:Number(g.net_flow)||0,selfSufficiencyBalance:(Number(g.domestic_demand)||0)>0?(Number(g.domestic_production)||0)-(Number(g.domestic_demand)||0):null});a.sort((d,g)=>!!d.statBased!=!!g.statBased?d.statBased?-1:1:g.production+g.demand-(d.production+d.demand));const n=a.filter(d=>d.netFlow>0).sort((d,g)=>g.netFlow-d.netFlow),r=a.filter(d=>d.netFlow<0).sort((d,g)=>d.netFlow-g.netFlow);let i="";i+=`<div class="tr-econ-section">
        <div class="tr-econ-header">
            <h2><span class="tr-econ-num">I.</span>Your <em>Economy</em></h2>
            <span class="tr-econ-meta">${a.length} commodit${a.length===1?"y":"ies"}</span>
        </div>
        <div class="tr-econ-card">
            <div class="tr-econ-col-header">
                <span>Commodity</span>
                <span>Production/Potential Prod.</span>
                <span>Demand</span>
                <span>Trading</span>
                <span>Net</span>
            </div>`;const l=F?.nation?.id,s=(d,g)=>d.statBased?Number(g).toFixed(0):U(g),c={energy:"(Energy / 3)",minerals:"(Minerals / 3) × ((Unskilled + Industry) / 200)",food:"(Farmland / 2) × (Unskilled / 100)",consumer_goods:"(Industry / 3) × (Unskilled / 100)",luxury_goods:"(SoL / 6) × ((Education × Services) / 10000)"};for(const d of a){const g=(Number(d.domesticDemand)||0)+(Number(d.demand)||0),x=Number(d.trading)||0,I=(Number(d.production)||0)-g+x,$=I>0?"positive":I<0?"negative":"zero",E=x>0?"positive":x<0?"negative":"zero",T=xt===d.key,w=d.statBased?' data-statbased="1"':"",A=d.statBased?"cursor:default;":"",R=d.statBased?c[d.key]:null;if(i+=`<div class="tr-econ-row tr-commodity-row" data-sector="${d.key}"${w} style="${A}">
            <div class="tr-econ-name-cell">
                <span class="tr-econ-icon">${d.icon}</span>
                <div style="display:flex;flex-direction:column;gap:2px;min-width:0;">
                    <span class="tr-econ-name">${b(d.name)}</span>
                    ${R?`<span class="tr-econ-formula" title="Production formula: ${b(R)}">${b(R)}</span>`:""}
                </div>
            </div>
            <span class="tr-econ-value">${s(d,d.production)}${d.statBased&&d.key!=="energy"&&Number.isFinite(Number(d.potential))?` <span class="tr-econ-potential" title="Production if multiplier stats were maxed at 100">(${s(d,d.potential)})</span>`:""}</span>
            <span class="tr-econ-value${g>0?"":" tr-econ-muted"}">${g>0?s(d,g):"—"}</span>
            <span class="tr-econ-net ${E}">${x===0?"0":(x>0?"+":"−")+s(d,Math.abs(x))}</span>
            <span class="tr-econ-net ${$}">${I===0?"—":(I>0?"+":"−")+s(d,Math.abs(I))}</span>
        </div>`,T){const N=ce[d.key]||{},S=Number(N.domestic_production)||0,M=Number(N.domestic_demand)||0,z=Number(N.export_capacity)||0,q=Number(N.import_demand)||0,D=Number(N.export_volume)||0,j=Number(N.import_volume)||0,ee=M>0?S-M:null,L=D-j,Y=Math.max(0,q-z-j),H=xe(S,d.key),te=xe(M,d.key),oe=xe(q,d.key),se=xe(j,d.key),yt=xe(D,d.key),he=xe(Y,d.key),nt=Xt.filter(V=>V.importer_nation_id===l&&V.sector===d.key&&V.trade_volume>0).sort((V,it)=>it.trade_volume-V.trade_volume),ht=Xt.filter(V=>V.exporter_nation_id===l&&V.sector===d.key&&V.trade_volume>0).sort((V,it)=>it.trade_volume-V.trade_volume);i+='<div style="padding:10px 18px 14px;background:var(--bg-card);border-bottom:2px solid var(--border-main);">';const Ye={fuel_energy:{price:85,unit:"barrel"},minerals:{price:120,unit:"tonne"},grains_staples:{price:235,unit:"tonne"},livestock_dairy:{price:2800,unit:"tonne"},fruits_vegetables:{price:900,unit:"tonne"},cash_crops:{price:1400,unit:"tonne"},manufactured_goods:{price:2200,unit:"TEU"},arms:{price:45e3,unit:"unit"}}[d.key];if(Ye&&(i+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-dim);letter-spacing:0.5px;">GLOBAL PRICE</span>
                    <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--amber);">$${Ye.price.toLocaleString()} <span style="font-weight:400;color:var(--text-dim);font-size:10px;">per ${Ye.unit}</span></span>
                </div>`),i+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-dim);letter-spacing:0.5px;">DOMESTIC PRODUCTION</span>
                <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--teal);">${U(S)}${H?' <span style="font-weight:400;color:var(--text-dim);font-size:10px;">('+H+")</span>":""}</span>
            </div>`,M>0&&(i+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-dim);letter-spacing:0.5px;">DOMESTIC DEMAND</span>
                    <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--blue);">${U(M)}${te?' <span style="font-weight:400;color:var(--text-dim);font-size:10px;">('+te+")</span>":""}</span>
                </div>`),i+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-dim);letter-spacing:0.5px;">IMPORT DEMAND</span>
                <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--amber);">${U(q)}${oe?' <span style="font-weight:400;color:var(--text-dim);font-size:10px;">('+oe+")</span>":""}</span>
            </div>`,i+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-dim);letter-spacing:0.5px;">SELF-SUFFICIENCY BALANCE</span>
                <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${ee===null?"var(--text-dim)":ee>0?"var(--green)":ee<0?"var(--red)":"var(--text-dim)"};">${ee===null?"—":(ee>0?"+":"")+U(ee)}</span>
            </div>`,i+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-dim);letter-spacing:0.5px;">TRADE CASHFLOW</span>
                <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${L>0?"var(--green)":L<0?"var(--red)":"var(--text-dim)"};">${L===0?"—":(L>0?"+":"")+U(L)}</span>
            </div>`,i+=`<div style="margin-top:8px;">
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--red);letter-spacing:0.5px;margin-bottom:4px;">IMPORTING: ${U(j)}${se?" ("+se+")":""}</div>`,nt.length>0)for(const V of nt){const Ft=(K||[]).find(zt=>zt.id===V.exporter_nation_id)?.name||"Unknown",rt=xe(V.trade_volume,d.key),qt=ho(V.exporter_nation_id,d.key);i+=`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:2px 0 2px 12px;">
                        <span style="font-size:12px;color:var(--text-secondary);">• ${b(Ft)}</span>
                        <span style="display:flex;align-items:center;gap:8px;">
                            ${It(qt)}
                            <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${U(V.trade_volume)}${rt?' <span style="font-size:9px;">('+rt+")</span>":""}</span>
                        </span>
                    </div>`}else j>0?i+='<div style="font-size:11px;color:var(--text-dim);font-style:italic;padding-left:12px;">Distributed across multiple trading partners</div>':i+='<div style="font-size:11px;color:var(--text-dim);font-style:italic;padding-left:12px;">No imports</div>';if(i+="</div>",Y>0&&(i+=`<div style="display:flex;justify-content:space-between;padding:4px 0;margin-top:4px;border-top:1px solid rgba(42,42,36,0.2);">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--red);letter-spacing:0.5px;">UNMET DEMAND</span>
                    <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--red);">${U(Y)}${he?' <span style="font-weight:400;font-size:9px;">('+he+")</span>":""}</span>
                </div>`),i+=`<div style="margin-top:8px;">
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--green);letter-spacing:0.5px;margin-bottom:4px;">EXPORTING: ${U(D)}${yt?" ("+yt+")":""}</div>`,ht.length>0)for(const V of ht){const Ft=(K||[]).find(zt=>zt.id===V.importer_nation_id)?.name||"Unknown",rt=xe(V.trade_volume,d.key),qt=ho(V.importer_nation_id,d.key);i+=`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:2px 0 2px 12px;">
                        <span style="font-size:12px;color:var(--text-secondary);">• ${b(Ft)}</span>
                        <span style="display:flex;align-items:center;gap:8px;">
                            ${It(qt)}
                            <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${U(V.trade_volume)}${rt?' <span style="font-size:9px;">('+rt+")</span>":""}</span>
                        </span>
                    </div>`}else D>0?i+='<div style="font-size:11px;color:var(--text-dim);font-style:italic;padding-left:12px;">Distributed across multiple trading partners</div>':i+='<div style="font-size:11px;color:var(--text-dim);font-style:italic;padding-left:12px;">No exports</div>';i+="</div>",i+="</div>"}}a.length===0&&(i+='<div class="tr-econ-empty">No commodities · no production data yet</div>'),i+="</div></div>",i+='<div style="display:flex;gap:6px;">',i+=`<div class="tr-panel" style="flex:1;padding:12px 14px;">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--green);margin-bottom:8px;">SURPLUSES</div>`;for(const d of n.slice(0,5)){const g=d.statBased?Number(d.netFlow).toFixed(0):U(d.netFlow);i+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:13px;color:var(--text-dim);">${d.icon} ${b(d.name)}</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--green);">+${g}</span>
        </div>`}n.length===0&&(i+='<div style="font-size:13px;color:var(--text-dim);font-style:italic;">None</div>'),i+="</div>",i+=`<div class="tr-panel" style="flex:1;padding:12px 14px;">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--red);margin-bottom:8px;">DEFICITS</div>`;for(const d of r.slice(0,5)){const g=d.statBased?Number(d.netFlow).toFixed(0):U(d.netFlow);i+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:13px;color:var(--text-dim);">${d.icon} ${b(d.name)}</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--red);">${g}</span>
        </div>`}r.length===0&&(i+='<div style="font-size:13px;color:var(--text-dim);font-style:italic;">None</div>'),i+="</div>",i+="</div>";const f=[{key:"energy",icon:"⚡",name:"Energy",under:[{label:"Standard of Living",delta:-.1},{label:"Public Approval",delta:-.1},{label:"Industry",delta:-.1}],over:[{label:"Standard of Living",delta:.05},{label:"Cost of Living",delta:-.05},{label:"Public Approval",delta:.05},{label:"Service Sector",delta:.05}]},{key:"minerals",icon:"⛏",name:"Minerals",under:[{label:"Infrastructure",delta:-.1},{label:"Industry",delta:-.1},{label:"GDP Growth",delta:-.1}],over:[{label:"Standard of Living",delta:.05},{label:"Infrastructure",delta:.05},{label:"Industry",delta:.05},{label:"GDP Growth",delta:.05}]},{key:"food",icon:"🌾",name:"Food",under:[{label:"Health",delta:-.2},{label:"Public Approval",delta:-.2},{label:"Unrest",delta:.2},{label:"Crime",delta:.1},{label:"Unskilled Workers",delta:-.1}],over:[{label:"Health",delta:.1},{label:"Public Approval",delta:.1},{label:"Standard of Living",delta:.05},{label:"Cost of Living",delta:-.05}]}],u=new Set(["Cost of Living","Unrest","Crime"]),v=d=>(d>0?"+":"")+d.toFixed(2).replace(/\.?0+$/,g=>g.includes(".")?g.replace(/0+$/,""):""),m=(d,g)=>g===0?"var(--text-dim)":(u.has(d)?g<0:g>0)?"var(--green)":"var(--red)";i+=`<div class="tr-econ-effects-block">
        <div class="tr-econ-effects-header">DEMAND EFFECTS · PER TICK</div>`;for(const d of f)i+=`<div class="tr-econ-effects-good">
            <div class="tr-econ-effects-good-name">${d.icon} ${b(d.name)}</div>
            <div class="tr-econ-effects-cols">
                <div class="tr-econ-effects-col">
                    <div class="tr-econ-effects-col-head under">If demand not met</div>
                    ${d.under.map(g=>`<div class="tr-econ-effects-row">
                        <span class="label">${b(g.label)}</span>
                        <span class="value" style="color:${m(g.label,g.delta)};">${v(g.delta)}</span>
                    </div>`).join("")}
                </div>
                <div class="tr-econ-effects-col">
                    <div class="tr-econ-effects-col-head over">If supply ≥ 120%</div>
                    ${d.over.map(g=>`<div class="tr-econ-effects-row">
                        <span class="label">${b(g.label)}</span>
                        <span class="value" style="color:${m(g.label,g.delta)};">${v(g.delta)}</span>
                    </div>`).join("")}
                </div>
            </div>
        </div>`;i+='<div class="tr-econ-effects-placeholder">More commodity effects unlock as demand models land.</div>',i+="</div>",e.innerHTML=i,e.onclick=d=>{const g=d.target.closest(".tr-commodity-row");if(!g||g.dataset.statbased==="1")return;const x=g.dataset.sector;xt=xt===x?null:x,Wt=xt,so(),Ae()}}let Oe=[],pt=[],At={},Dt=null;async function Pt(){const e=F?.nation?.id;if(!e)return;const[t,o]=await Promise.all([p.from("trade_agreements").select("*").or(`nation_a_id.eq.${e},nation_b_id.eq.${e}`).order("enacted_at_tick",{ascending:!1}),p.from("trade_negotiations").select("id, nation_a_id, nation_b_id, status, agreement_type, opened_at_tick, approved_by_a, approved_by_b, last_seen_at_a, last_seen_at_b").or(`nation_a_id.eq.${e},nation_b_id.eq.${e}`).in("status",["open","active","ratification"]).order("opened_at_tick",{ascending:!1})]);Oe=t.data||[],pt=o.data||[];const a=pt.map(r=>r.id),n={};if(a.length>0){const{data:r,error:i}=await p.from("negotiation_messages").select("negotiation_id, sender_nation_id, created_at").in("negotiation_id",a).neq("sender_nation_id",e).eq("is_system",!1).order("created_at",{ascending:!1});i&&console.warn("[loadTradeAgreements] unread-state fetch failed:",i.message);const l={};for(const s of r||[])l[s.negotiation_id]||(l[s.negotiation_id]=s.created_at);for(const s of pt){const f=s.nation_a_id===e?s.last_seen_at_a:s.last_seen_at_b,u=l[s.id];u&&(!f||new Date(u)>new Date(f))&&(n[s.id]=!0)}}At=n,await $a(),await Co()}let Ee={};async function $a(){Ee={};const e=(Oe||[]).filter(a=>a.status==="active").map(a=>a.id);if(e.length===0)return;const{data:t,error:o}=await p.rpc("get_trade_agreement_shipping",{p_agreement_ids:e});if(o){console.warn("[diplomacy] agreement shipping RPC failed:",o.message);return}if(!t||!t.success){console.warn("[diplomacy] agreement shipping RPC returned no success:",t?.reason);return}for(const a of t.contracts||[]){if(!a.trade_agreement_id)continue;const n=Ee[a.trade_agreement_id]||[];n.push({id:a.id,status:a.status,volume_required:Number(a.volume_required)||0,delivery_priority:a.delivery_priority||null,expires_at_tick:Number(a.expires_at_tick)||null,commodity:a.commodity||null,winner_faction_id:a.winner_faction_id,winner_faction_name:a.winner_faction_name||null,revenue_per_tick:Number(a.revenue_per_tick)||0,consecutive_missed_payments:Number(a.consecutive_missed_payments)||0,winning_bids:Array.isArray(a.winning_bids)?a.winning_bids:[],total_units_won:Number(a.total_units_won)||0}),Ee[a.trade_agreement_id]=n}}let Qt={};async function Co(){Qt={};const e=F?.nation?.id;if(!e)return;const{data:t,error:o}=await p.rpc("get_route_bids_for_minister",{p_nation_id:e});if(o){console.warn("[diplomacy] minister bids RPC failed:",o.message);return}if(!(!t||!t.success))for(const a of t.routes||[])Qt[a.id]={ticks_until_window_close:Number(a.ticks_until_window_close)||0,bids:Array.isArray(a.bids)?a.bids:[]}}function ka(e){const t=Qt[e];if(!t||!t.bids.length)return"";const o=t.ticks_until_window_close,n=t.bids.some(i=>i.manually_accepted)?'<span style="font-family:var(--font-mono);font-size:7px;color:var(--green);letter-spacing:0.5px;text-transform:uppercase;padding:1px 5px;border:1px solid var(--green);">Minister override · allocator live</span>':o>0?`<span style="font-family:var(--font-mono);font-size:7px;color:var(--amber, #b8860b);letter-spacing:0.5px;text-transform:uppercase;padding:1px 5px;border:1px solid var(--amber, #b8860b);">Bidding · closes in ${o} tick${o===1?"":"s"}</span>`:'<span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.5px;text-transform:uppercase;">Window closed · allocator live</span>';let r="";for(const i of t.bids){const l=i.carrier||"Carrier",s=Number(i.rate)||0,c=Number(i.freighters)||0,f=Number(i.reputation)||0,u=!!i.vetoed,v=!!i.manually_accepted,m=s>0?`$${Math.round(s).toLocaleString()}/unit/tick`:"rate —",d=v?"ACCEPTED":u?"REJECTED":"PENDING",g=v?"var(--green)":u?"var(--red)":"var(--text-dim)",x=`<button data-action="accept-bid" data-bid-id="${i.bid_id}" ${v?"disabled":""}
            style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;color:${v?"var(--text-dim)":"var(--green)"};background:${v?"transparent":"rgba(92,197,92,0.08)"};border:1px solid ${v?"var(--border-main)":"var(--green)"};padding:3px 10px;cursor:${v?"default":"pointer"};text-transform:uppercase;">Accept</button>`,I=`<button data-action="reject-bid" data-bid-id="${i.bid_id}" ${u?"disabled":""}
            style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.5px;color:${u?"var(--text-dim)":"var(--red)"};background:${u?"transparent":"rgba(197,85,85,0.08)"};border:1px solid ${u?"var(--border-main)":"var(--red)"};padding:3px 10px;cursor:${u?"default":"pointer"};text-transform:uppercase;">Reject</button>`;r+=`<div style="display:grid;grid-template-columns:1fr auto;gap:6px;padding:4px 6px;margin-top:3px;background:var(--bg-card);border:1px solid var(--border-main);align-items:center;">
            <div>
                <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-bright);">
                    ${b(l)} <span style="color:var(--text-dim);font-weight:400;">· Rep ${f}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:1px;">
                    ${c} freighter${c===1?"":"s"} @ ${m} · <span style="color:${g};font-weight:700;">${d}</span>
                </div>
            </div>
            <div style="display:flex;gap:4px;">${x}${I}</div>
        </div>`}return`<div style="margin-top:6px;padding-top:6px;border-top:1px dashed var(--border-main);">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px;">
            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:1px;color:var(--text-dim);">PENDING BIDS · ${t.bids.length}</span>
            ${n}
        </div>
        ${r}
    </div>`}function ft(e){return Array.isArray(e?.winning_bids)&&e.winning_bids.length>0||e?.status==="awarded"&&!!e?.winner_faction_name}function Po(e){return Array.isArray(e?.winning_bids)&&e.winning_bids.length>0?Number(e.total_units_won)||0:e?.status==="awarded"&&e?.winner_faction_name&&Number(e.volume_required)||0}function Jt(e){const o=(Ee[e]||[]).filter(ft);if(o.length===0)return null;const a=[],n=new Set;for(const r of o)if(Array.isArray(r.winning_bids)&&r.winning_bids.length>0)for(const i of r.winning_bids){const l=i.corp_name||"Corp";n.has(l)||(n.add(l),a.push({name:l,color:"#5cc55c"}))}else if(r.winner_faction_name){if(n.has(r.winner_faction_name))continue;n.add(r.winner_faction_name),a.push({name:r.winner_faction_name,color:"#5cc55c"})}return{routeCount:o.length,corps:a,hasLogistics:a.length>0}}function Ve(){const e=document.getElementById("trade-agreements-row");if(!e)return;const t=F?.nation?.id,o=F?.shard?.current_tick||0,a=Oe,n=a.filter(s=>s.status==="active"),r=a.filter(s=>s.status!=="active");let i=`<div class="tr-panel">
        <div class="tr-panel-header">
            <span class="tr-panel-title">AGREEMENTS</span>
            <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${n.length} active${r.length>0?" · "+r.length+" expired":""}</span>
        </div>`;const l=pt||[];for(const s of l){const c=s.nation_a_id===t?s.nation_b_id:s.nation_a_id,f=(K||[]).find(N=>N.id===c),u=f?.name||"Unknown",v=F?.nation?.name||"Your Nation",m=F?.nation?.flag_url||`assets/flags/${v}.png`,d=f?.flag_url||`assets/flags/${u}.png`,g=s.status==="ratification",x=!g&&!!s.approved_by_a&&!!s.approved_by_b,I=!!At[s.id];let $,E,T,w,A;g?(E="RATIFICATION",$="var(--green)",T="rgba(92,204,92,0.08)",w="rgba(92,204,92,0.2)",A="var(--green)"):x?(E="READY TO RATIFY",$="var(--teal)",T="rgba(90,175,165,0.08)",w="rgba(90,175,165,0.25)",A="var(--teal)"):(E="ONGOING",$="var(--amber)",T="rgba(184,134,11,0.08)",w="rgba(184,134,11,0.2)",A="var(--amber)"),i+=`<div style="padding:12px 18px;border-bottom:1px solid var(--border-main);cursor:pointer;border-left:3px solid ${A};"
            onclick="openTradeNegModal('${c}')">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    ${I?'<span title="New message from the other nation" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--red);margin-right:4px;flex-shrink:0;"></span>':""}
                    <img src="${b(m)}" alt="" style="width:24px;height:16px;object-fit:cover;border:1px solid var(--border-main);" onerror="this.style.display='none'">
                    <span style="font-size:13px;font-weight:600;color:var(--text-bright);">${b(v)}</span>
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">${g?"Ratification":"Trade Discussions"}</span>
                    <span style="font-size:13px;font-weight:600;color:var(--text-bright);">${b(u)}</span>
                    <img src="${b(d)}" alt="" style="width:24px;height:16px;object-fit:cover;border:1px solid var(--border-main);" onerror="this.style.display='none'">
                </div>
                <span class="tr-badge" style="font-size:10px;padding:3px 10px;color:${$};background:${T};border-color:${w};">${E}</span>
            </div>
        </div>`}a.length===0&&l.length===0&&(i+='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:12px;color:var(--text-dim);font-style:italic;">No trade agreements.</div>');for(let s=0;s<a.length;s++){const c=a[s],f=c.status==="active",u=c.agreement_type==="retaliatory_tariff"||c.agreement_type==="impose_embargo",v=Dt===c.id,m=f?u?"var(--red)":"var(--green)":"var(--text-dim)",d=f?u?"HOSTILE":"ACTIVE":c.status?.toUpperCase()||"ENDED",g=c.nation_a_id===t?c.nation_b_id:c.nation_a_id,I=(K||[]).find(D=>D.id===g)?.name||"Unknown",$=St[c.agreement_type]||c.agreement_type,E=c.expires_at_tick?Math.max(0,c.expires_at_tick-o):null,T=c.duration_type==="indefinite"?"Ongoing":c.duration_ticks?c.duration_ticks+" ticks":"Unknown",w=Jt(c.id),A=c.agreement_type!=="retaliatory_tariff"&&c.agreement_type!=="impose_embargo",R=Ct(g)||{needsShipping:!0},N=A?w?.hasLogistics?`<span class="tr-badge" style="color:var(--green);background:rgba(92,204,92,0.06);border-color:rgba(92,204,92,0.15);font-size:5px;">🚢 ${b(w.corps[0]?.name||"Corp")}</span>`:R.needsShipping?'<span class="tr-badge" style="color:var(--orange);background:rgba(200,136,68,0.06);border-color:rgba(200,136,68,0.15);font-size:5px;">⚠ NO LOGISTICS</span>':'<span class="tr-badge" style="color:var(--green);background:rgba(92,204,92,0.06);border-color:rgba(92,204,92,0.15);font-size:5px;">LAND TRADE</span>':"",S=(c.articles||[]).some(D=>D.article_type==="trade_flow"&&D.data?.commodity==="energy"),M=Ee[c.id]||[],z=M.filter(ft);let q="";if(S){const D=z.reduce((ee,L)=>ee+Po(L),0);M.some(ee=>(Number(ee.consecutive_missed_payments)||0)>0)?q='<span class="tr-badge" style="color:var(--red);background:rgba(200,90,58,0.08);border-color:rgba(200,90,58,0.25);font-size:5px;">⚠ PAYMENT DELAYED</span>':D>0?q=`<span class="tr-badge" style="color:var(--gold,#c8a832);background:rgba(200,168,50,0.08);border-color:rgba(200,168,50,0.25);font-size:5px;">⚡ ${D}/TICK</span>`:q='<span class="tr-badge" style="color:var(--orange);background:rgba(200,136,68,0.06);border-color:rgba(200,136,68,0.15);font-size:5px;">⚡ AWAITING SHIPPING</span>'}if(i+=`<div class="tr-agreement-row" data-ag-id="${c.id}" style="border-left:3px solid ${m};">
            <div class="tr-agreement-header" style="background:${v?"var(--bg-card)":"transparent"};padding:14px 18px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${b(c.agreement_name||$)}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        ${q}
                        ${N}
                        <span class="tr-badge" style="font-size:11px;padding:3px 10px;color:${m};background:${m}0a;border-color:${m}25;">${d}</span>
                    </div>
                </div>
                <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">
                    ${b(I)} · ${b($)} · ${T}${E!==null?" · "+E+" ticks left":""}
                </div>
            </div>`,v){const D=c.articles||[];if(i+='<div style="padding:0 18px 14px;">',D.length>0){i+='<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-dim);letter-spacing:0.5px;margin:8px 0 6px;">ARTICLES</div>';const L=["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"];for(let Y=0;Y<D.length;Y++){const H=D[Y];if(H._struck)continue;const te=L[Y]||Y+1;let oe,se;H.article_type?(oe=H.article_type.replace(/_/g," ").toUpperCase(),se=Ko(H)):H.text?(oe="TEXT",se=H.text):(oe=na?.[H.type]?.label||H.type||"Article",se=renderTradeArticleSummary(H,t)),i+=`<div style="padding:3px 6px;margin-bottom:2px;background:var(--bg-card);border:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-secondary);">Art. ${te} — ${b(oe)}</div>
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${b(se||"")}</div>
                    </div>`}}i+=`<div style="display:flex;gap:6px;margin-top:6px;">
                <div style="padding:4px 6px;background:var(--bg-card);border:1px solid var(--border-main);">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">ENACTED</div>
                    <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-bright);">${Z(c.enacted_at_tick)}</div>
                </div>
                ${c.expires_at_tick?`<div style="padding:4px 6px;background:var(--bg-card);border:1px solid var(--border-main);">
                    <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">EXPIRES</div>
                    <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-bright);">${Z(c.expires_at_tick)}</div>
                </div>`:""}
                ${c.auto_renew?`<div style="padding:4px 6px;background:var(--bg-card);border:1px solid var(--border-main);">
                    <div style="font-family:var(--font-mono);font-size:7px;color:var(--green);">AUTO-RENEW</div>
                </div>`:""}
                <div style="padding:4px 8px;background:var(--bg-card);border:1px solid var(--border-main);display:flex;align-items:center;">
                    ${It(xo(c.id,g))}
                </div>
            </div>`;const j=Jt(c.id);if(c.agreement_type!=="retaliatory_tariff"&&c.agreement_type!=="impose_embargo"){if(i+=`<div style="margin-top:6px;background:var(--bg-card);border:1px solid var(--border-main);padding:8px 10px;">
                    <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px;">LOGISTICS & TRANSPORT</div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Route Efficiency</span>
                        ${It(xo(c.id,g))}
                    </div>`,j&&j.hasLogistics){for(const L of j.corps)i+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                            <div style="width:24px;height:24px;background:${L.color}15;border:1px solid ${L.color}33;display:flex;align-items:center;justify-content:center;font-size:12px;">🚢</div>
                            <div style="font-size:9px;font-weight:700;color:var(--text-bright);">${b(L.name)}</div>
                        </div>`;i+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">${j.routeCount} awarded contract${j.routeCount!==1?"s":""}</div>`}else i+='<div style="font-size:11px;color:var(--text-dim);">Awaiting bids — corporations have a 3-tick window to offer; the cheapest / fastest / safest bid wins per agreement preference.</div>';i+="</div>"}if(M.length>0){i+=`<div style="margin-top:6px;background:var(--bg-card);border:1px solid var(--border-main);padding:8px 10px;">
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--text-dim);margin-bottom:6px;">🚢 TRADE SHIPPING</div>`;for(const L of M){let Y,H;const te=Number(L.consecutive_missed_payments)||0,oe=(L.commodity||"units").replace(/_/g," "),se=Array.isArray(L.winning_bids)?L.winning_bids:[];if(se.length>0){const he=Number(L.total_units_won)||0,nt=Number(L.volume_required)||0,ht=se.map(Ye=>`${Ye.corp_name||"Corp"} ${Number(Ye.units_won)||0}u`).join(", "),bo=te>0?"⚠ ":"";Y=te>0?"var(--red)":he>=nt?"var(--green)":"var(--amber, #b8860b)",H=`${bo}${he}/${nt} ${oe}/tick · ${ht}`+(te>0?` · ${te} missed payment${te===1?"":"s"}`:"")}else if(L.status==="awarded"&&L.winner_faction_name)te>0?(Y="var(--red)",H=`⚠ ${L.volume_required} ${oe}/tick · ${L.winner_faction_name} · ${te} missed payment${te===1?"":"s"}`):(Y="var(--green)",H=`${L.volume_required} ${oe}/tick · ${L.winner_faction_name}`);else if(L.status==="open"){Y="var(--amber, #b8860b)";const he=L.expires_at_tick!=null?Math.max(0,L.expires_at_tick-o):0;H=`Awaiting offers · ${L.volume_required} ${oe}/tick · closes in ${he} tick${he===1?"":"s"}`}else L.status==="completed"?(Y="var(--text-dim)",H="Completed"):L.status==="cancelled"?(Y="var(--text-dim)",H="Cancelled"):(Y="var(--text-dim)",H=L.status);const yt=L.delivery_priority?`<span style="font-family:var(--font-mono);font-size:7px;letter-spacing:0.5px;text-transform:uppercase;color:var(--text-dim);padding:1px 5px;border:1px solid var(--border-main);">${b(L.delivery_priority)}</span>`:"";i+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;font-family:var(--font-mono);font-size:10px;">
                        <span style="color:${Y};">${b(H)}</span>
                        ${yt}
                    </div>`,i+=ka(L.id)}i+="</div>"}c.status==="active"&&t&&(c.nation_a_id===t||c.nation_b_id===t)&&(i+=`<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border-main);text-align:right;">
                    <button data-action="withdraw-ag" data-ag-id="${c.id}" style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:#c55;background:rgba(197,85,85,0.08);border:1px solid rgba(197,85,85,0.35);padding:6px 16px;cursor:pointer;text-transform:uppercase;">Withdraw</button>
                </div>`),i+="</div>"}i+="</div>"}i+="</div>",e.innerHTML=i,e.onclick=s=>{const c=s.target.closest('[data-action="withdraw-ag"]');if(c){s.stopPropagation(),Ia(c.dataset.agId);return}const f=s.target.closest('[data-action="accept-bid"]');if(f&&!f.disabled){s.stopPropagation(),wo(f.dataset.bidId,"accept");return}const u=s.target.closest('[data-action="reject-bid"]');if(u&&!u.disabled){s.stopPropagation(),wo(u.dataset.bidId,"reject");return}const v=s.target.closest(".tr-agreement-row");if(!v)return;const m=v.dataset.agId;Dt=Dt===m?null:m,Ve()}}let jt=!1;async function wo(e,t){if(!(jt||!e)){jt=!0;try{const o=t==="accept"?await p.rpc("accept_shipping_bid",{p_bid_id:e,p_accepted:!0}):await p.rpc("veto_shipping_bid",{p_bid_id:e,p_vetoed:!0});if(o.error)throw o.error;if(!o.data||!o.data.success){alert("Could not "+t+" bid: "+(o.data?.reason||"unknown"));return}await Co(),Ve()}catch(o){console.error("[diplomacy] minister bid action failed:",o),alert("Could not "+t+" bid: "+(o?.message||o))}finally{jt=!1}}}let Ht=!1;async function Ia(e){if(Ht)return;const t=(Oe||[]).find(n=>n.id===e);if(!t)return;const o=F?.nation?.id;if(t.status!=="active"){alert("This agreement is no longer active.");return}if(!o||t.nation_a_id!==o&&t.nation_b_id!==o){alert("Only a signatory nation can withdraw from this agreement.");return}const a=t.agreement_name||"this trade agreement";if(confirm(`Withdraw from "${a}"?

This ends the agreement immediately and stops trading these resources. Shipping contracts under it are cancelled. This cannot be undone.`)){Ht=!0;try{const{data:n,error:r}=await p.rpc("cancel_trade_agreement",{p_agreement_id:e,p_by_nation_id:o});if(r){alert("Failed to withdraw: "+r.message);return}n&&n.success===!1?alert(n.error||"Failed to withdraw from this agreement."):alert(`Withdrawn from "${a}".`),Pt().then(()=>{Ve(),Ae()}).catch(()=>{})}finally{Ht=!1}}}let Kt={};async function Ea(){Kt={}}function Aa(e,t){const o=Kt[e]||{},a=Kt[t]||{};let n=0,r=0;for(const l of Object.keys({...o,...a})){if(l==="food_agriculture"&&(o.grains_staples||a.grains_staples))continue;const s=Number(o[l]?.net_flow)||0,c=Number(a[l]?.net_flow)||0;r++,(s>0&&c<0||s<0&&c>0)&&(n+=Math.min(Math.abs(s),Math.abs(c)))}if(r===0)return 0;const i=Object.values(o).reduce((l,s)=>l+(s.export_capacity||0)+(s.import_demand||0),0)||1;return Math.min(99,Math.round(n/i*200))}function Oo(){const e={energy:0,minerals:0,food:0,consumer_goods:0,luxury_goods:0},t=F?.nation?.id;if(!t)return e;const o=(Oe||[]).filter(a=>a.status==="active");for(const a of o){const n=a.nation_a_id===t?a.nation_b_id:a.nation_a_id;if(!n)continue;const r=Ct(n)||{needsShipping:!0},i=!!Jt(a.id)?.hasLogistics,l=(Ee[a.id]||[]).filter(ft),s=l.length>0;if(!r.needsShipping||i||s)for(const f of a.articles||[]){if(f.article_type!=="trade_flow")continue;const u=f.data||{},v=u.commodity;if(!v||!(v in e))continue;const m=Number(u.volume)||0;if(m<=0)continue;let d=m;if(v==="energy"&&s&&(d=l.reduce(($,E)=>$+Po(E),0)),d<=0)continue;const g=f.author_nation_id?f.author_nation_id===t:a.nation_a_id===t,x=g?t:n;(u.direction==="a_buys_b"?x:g?n:t)===t?e[v]+=d:e[v]-=d}}return e}function Sa(e){const t=e||{},o=Number(t.energy)||0,a=Number(t.infrastructure)||0,n=Number(t.industry)||0,r=Number(t.standard_of_living)||0,i=(Number(t.population)||0)/1e6,l=o/3,s=(a+n)*r*Math.sqrt(i)/3500;return{production:l,demand:s,net:l-s}}function Na(e){const t=e||{},o=Number(t.minerals)||0,a=Number(t.unskilled_workers)||0,n=Number(t.industry)||0,r=Number(t.infrastructure)||0,i=o/3*((a+n)/200),l=r/10+n/16;return{production:i,demand:l,net:i-l}}function Ta(e){const t=e||{},o=Number(t.farmland)||0,a=Number(t.unskilled_workers)||0,n=(Number(t.population)||0)/1e6,r=o/2*(a/100),i=n/3;return{production:r,demand:i,net:r-i}}function Ca(e){const t=e||{},o=Number(t.industry)||0,a=Number(t.unskilled_workers)||0,n=Number(t.standard_of_living)||0,r=(Number(t.population)||0)/1e6,i=o/3*(a/100),l=n/100*r/2;return{production:i,demand:l,net:i-l}}function Pa(e){const t=e||{},o=Number(t.standard_of_living)||0,a=Number(t.education)||0,n=Number(t.service_sector)||0,r=(Number(t.population)||0)/1e6,i=o/6*(a*n/1e4),l=Math.pow(o/100,2)*r;return{production:i,demand:l,net:i-l}}function Oa(e){const t=(K||[]).find(r=>r.id===e),o=[],a=[],n=[{sector:"energy",icon:"⚡",name:"Energy",balance:Sa(t)},{sector:"minerals",icon:"⛏",name:"Minerals",balance:Na(t)},{sector:"food",icon:"🌾",name:"Food",balance:Ta(t)},{sector:"consumer_goods",icon:"📦",name:"Consumer Goods",balance:Ca(t)},{sector:"luxury_goods",icon:"💎",name:"Luxury Goods",balance:Pa(t)}];for(const r of n){const i=r.balance.net;if(i===0)continue;const l={sector:r.sector,icon:r.icon,name:r.name,amount:Math.abs(i),statBased:!0};i>0?o.push(l):a.push(l)}return{surpluses:o,deficits:a}}let Vt=null,wt="compatibility";function Ae(){const e=document.getElementById("trade-right");if(!e)return;const t=F?.nation?.id;if(!t){e.innerHTML="";return}const o=(K||[]).filter(s=>s.id!==t),a=je||[],n=o.map(s=>{const c=Aa(t,s.id),f=t<s.id?t:s.id,u=t<s.id?s.id:t,v=a.find(g=>g.nation_a_id===f&&g.nation_b_id===u),m=v?Number(v.relation_score??0):0;let d="Neutral";return m>=60?d="Friendly":m>=30?d="Warm":m>=-10?d="Neutral":m>=-40?d="Cold":d="Hostile",{...s,compat:c,relLabel:d,relScore:m}});wt==="compatibility"?n.sort((s,c)=>c.compat-s.compat):n.sort((s,c)=>s.name.localeCompare(c.name));const r={Friendly:"var(--green)",Warm:"var(--green)",Neutral:"var(--blue)",Cold:"var(--blue)",Hostile:"var(--red)"},i=Wt;let l=`<div class="tr-panel" style="padding:8px 14px;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;">
            <span class="tr-panel-title">TRADE PARTNERS</span>`;i&&(l+=`<div style="display:flex;align-items:center;gap:4px;padding:2px 8px;background:var(--bg-card);border:1px solid var(--border-main);">
            <span style="font-size:9px;">${To[i]||""}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-bright);">${b(Tt[i]||i)}</span>
            <span class="tr-filter-clear" style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);cursor:pointer;margin-left:4px;">✕</span>
        </div>`),l+=`</div>
        <div style="display:flex;gap:3px;">
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-right:4px;">SORT:</span>
            <div class="tr-sort-btn${wt==="compatibility"?" active":""}" data-sort="compatibility">COMPATIBILITY</div>
            <div class="tr-sort-btn${wt==="name"?" active":""}" data-sort="name">NAME</div>
        </div>
    </div>`;for(const s of n){const c=r[s.relLabel]||"var(--text-dim)",f=Vt===s.id,{surpluses:u,deficits:v}=Oa(s.id);let m=!0,d=null;if(i){const T=ce[i],w=Number(T?.net_flow)||0,A=v.find(N=>N.sector===i),R=u.find(N=>N.sector===i);w>0&&A?d="export":w<0&&R?d="import":m=!1}const g=s.compat>=75?"var(--green)":s.compat>=50?"var(--amber)":"var(--orange)",x=s.flag_url||`assets/flags/${s.name}.png`,I=s.name.slice(0,2).toUpperCase(),$=Number(s.population||0),E=$>=1e6?($/1e6).toFixed(1)+"M":$.toLocaleString();if(l+=`<div class="tr-partner-card${f?" expanded":""}" data-nation="${s.id}" style="opacity:${i&&!m?"0.3":"1"};border-color:${f?c+"44":""};">
            <div class="tr-partner-header">
                <div style="display:flex;align-items:center;gap:10px;">
                    <img src="${b(x)}" alt="" style="width:36px;height:24px;object-fit:cover;border:1px solid var(--border-main);" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                    <div style="width:36px;height:24px;background:${c}10;border:1px solid ${c}33;display:none;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;font-weight:700;color:${c};">${I}</div>
                    <div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-size:13px;font-weight:700;color:var(--text-bright);">${b(s.name)}</span>
                            <span class="tr-badge" style="color:${c};background:${c}0a;border-color:${c}25;">${s.relLabel.toUpperCase()}</span>
                            ${d?'<span class="tr-badge" style="color:var(--green);background:rgba(92,204,92,0.08);border-color:rgba(92,204,92,0.2);">MATCH</span>':""}
                        </div>
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:1px;">Pop: ${E} · State Apparatus: ${(s.state_apparatus??50).toFixed(1)}%</div>
                    </div>
                </div>
                <div style="display:flex;gap:12px;align-items:center;">
                    <div style="text-align:center;">
                        <div style="font-family:var(--font-mono);font-size:6px;color:var(--text-dim);">COMPAT.</div>
                        <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${g};">${s.compat}</div>
                    </div>
                </div>
            </div>`,f){const T=Object.entries(ce).filter(([,S])=>(S.import_demand||0)>(S.export_capacity||0)).map(([S])=>S),w=Object.entries(ce).filter(([,S])=>(S.export_capacity||0)>(S.import_demand||0)).map(([S])=>S);l+=`<div style="border-top:1px solid var(--border-main);">
                <div style="display:flex;">
                    <div style="flex:1;padding:14px 18px;border-right:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--teal);margin-bottom:6px;display:flex;align-items:center;gap:5px;"><span style="width:7px;height:7px;background:var(--teal);"></span>THEY CAN OFFER</div>`;for(const S of u.slice(0,6)){const M=T.includes(S.sector),z=S.statBased?Number(S.amount).toFixed(0):U(S.amount);l+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(42,42,36,0.15);">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:13px;">${S.icon}</span>
                        <span style="font-size:13px;color:var(--text-bright);font-weight:${M?"700":"400"};">${b(S.name)}</span>
                        ${M?'<span class="tr-badge" style="color:var(--green);background:rgba(92,204,92,0.06);border-color:rgba(92,204,92,0.15);font-size:8px;">MATCH</span>':""}
                    </div>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--teal);">${z}<span style="font-weight:400;color:var(--text-dim);font-size:10px;">/mo</span></span>
                </div>`}u.length===0&&(l+='<div style="font-size:12px;color:var(--text-dim);font-style:italic;">No surpluses</div>'),l+=`</div><div style="flex:1;padding:14px 18px;">
                        <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--green);margin-bottom:6px;display:flex;align-items:center;gap:5px;"><span style="width:7px;height:7px;background:var(--green);"></span>THEY NEED</div>`;for(const S of v.slice(0,6)){const M=w.includes(S.sector),z=S.statBased?Number(S.amount).toFixed(0):U(S.amount);l+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(42,42,36,0.15);">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:13px;">${S.icon}</span>
                        <span style="font-size:13px;color:var(--text-bright);font-weight:${M?"700":"400"};">${b(S.name)}</span>
                        ${M?'<span class="tr-badge" style="color:var(--green);background:rgba(92,204,92,0.06);border-color:rgba(92,204,92,0.15);font-size:8px;">MATCH</span>':""}
                    </div>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--green);">${z}<span style="font-weight:400;color:var(--text-dim);font-size:10px;">/mo</span></span>
                </div>`}v.length===0&&(l+='<div style="font-size:12px;color:var(--text-dim);font-style:italic;">No deficits</div>'),l+="</div></div>";const A=(Oe||[]).filter(S=>S.status==="active"&&(S.nation_a_id===s.id||S.nation_b_id===s.id));if(A.length>0){l+=`<div style="padding:10px 18px;border-top:1px solid var(--border-main);">
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--green);letter-spacing:1px;margin-bottom:6px;">ACTIVE TRADE AGREEMENTS</div>`;for(const S of A){const M=St[S.agreement_type]||S.agreement_type,z=S.duration_type==="permanent"?"Permanent":S.expires_at_tick?S.expires_at_tick-(F?.shard?.current_tick||0)+" ticks left":"";l+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(42,42,36,0.1);">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-size:11px;font-weight:600;color:var(--text-bright);">${b(S.agreement_name||M)}</span>
                            <span class="tr-badge" style="font-size:7px;color:var(--green);background:rgba(92,204,92,0.06);border-color:rgba(92,204,92,0.15);">ACTIVE</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${z}</span>
                    </div>`}l+="</div>"}const N=pt.some(S=>S.nation_a_id===s.id||S.nation_b_id===s.id)?`<div class="tr-action-btn tr-action-btn--primary" onclick="event.stopPropagation();openTradeNegModal('${s.id}');">TRADE DISCUSSIONS</div>`:`<div class="tr-action-btn tr-action-btn--primary" onclick="event.stopPropagation();openTradeNegModal('${s.id}');">DRAFT TRADE AGREEMENT</div>`;l+=`<div style="padding:10px 18px;border-top:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:flex-end;gap:6px;">
                <div class="tr-action-btn" onclick="event.stopPropagation();selectWorldNation('${s.id}');_diploActiveSubtab='world';renderDiploSubtabs();showDiploSubtab();">NATION INFO</div>
                ${N}
            </div>`,l+="</div>"}l+="</div>"}e.innerHTML=l,e.onclick=s=>{const c=s.target.closest(".tr-sort-btn");if(c){wt=c.dataset.sort,Ae();return}if(s.target.closest(".tr-filter-clear")){Wt=null,so(),Ae();return}const f=s.target.closest(".tr-partner-card");if(f&&!s.target.closest(".tr-action-btn")){const u=f.dataset.nation;Vt=Vt===u?null:u,Ae()}}}let h=null,$e=null,k=0,B=[],_=null,ke=null,Ie=null;const Zt=["#5cb85c","#c8a64e","#5aafa5","#d9534f","#8b7ec8","#5b9bd5","#e07b53","#7bc67e","#c7697a","#59c4d4","#b8a038","#9a8ec2"];async function Lo(e){const{data:t}=await p.from("ipo_members").select("chat_color").eq("org_id",e).eq("is_active",!0),o=(t||[]).map(a=>a.chat_color).filter(Boolean);return Zt.find(a=>!o.includes(a))||Zt[0]}const La=["◈","⬡","▲","◆","⬢","⊕"];function De(e,t,o){const a=t+(o?" "+o:"");return e.logo_image_url?`<img src="${b(e.logo_image_url)}" alt="" class="${a} ipo-logo-img" />`:`<span class="${a}">${b(e.logo_symbol)} ${b(e.logo_text)}</span>`}const Ma={Melizea:"assets/flags/Melizea.png",Avelia:"assets/flags/Avelia.png",Sangreza:"assets/flags/sangreza.png",Montequilla:"assets/flags/Montequilla.png","San Estrella":"assets/flags/sanestrella.png",Palvera:"assets/flags/Palvera.png",Calveth:"assets/flags/Calveth.png",Flandis:"assets/flags/Flandis.png",Vostia:"assets/flags/Vostia.png",Sierramar:"assets/flags/Sierramar.png",Hajjara:"assets/flags/Hajjara.png",Dravka:"assets/flags/Dravka.png",Danwei:"assets/flags/Danwei.png"};async function Ba(){const e=document.getElementById("world-map-panel");let t=document.getElementById("world-map-img");if(!e||!t)return;try{const m=t.getAttribute("src")||"";if(m){const d=await fetch(m);if(d.ok){const g=await d.text(),I=new DOMParser().parseFromString(g,"image/svg+xml").documentElement;if(I&&I.tagName.toLowerCase()==="svg"){const $=document.importNode(I,!0);$.id="world-map-img",$.removeAttribute("width"),$.removeAttribute("height"),$.style.cssText="display:block;transform-origin:0 0;width:100%;height:auto;pointer-events:none;",t.replaceWith($),t=$}}}}catch(m){console.warn("[WorldMap] inline-SVG upgrade failed, using <img> fallback:",m?.message||m)}let o=1,a=0,n=0,r=!1,i=0,l=0;const s=1,c=4;function f(){const m=e.clientWidth,d=e.clientHeight,g=t.getBoundingClientRect(),x=g.width,I=g.height;x<=m?a=0:a=Math.max(m-x,Math.min(0,a)),I<=d?n=0:n=Math.max(d-I,Math.min(0,n))}function u(){f(),t.style.transform=`translate(${a}px, ${n}px) scale(${o})`;const m=document.getElementById("map-zoom-label");m&&(m.textContent=Math.round(o*100)+"%")}e.addEventListener("wheel",m=>{m.preventDefault();const d=e.getBoundingClientRect(),g=m.clientX-d.left,x=m.clientY-d.top,I=o,$=m.deltaY>0?.9:1.1;o=Math.max(s,Math.min(c,o*$)),a=g-(g-a)*(o/I),n=x-(x-n)*(o/I),u()},{passive:!1}),e.addEventListener("mousedown",m=>{r=!0,i=m.clientX-a,l=m.clientY-n,e.style.cursor="grabbing"}),window.addEventListener("mousemove",m=>{r&&(a=m.clientX-i,n=m.clientY-l,u())}),window.addEventListener("mouseup",()=>{r=!1,e.style.cursor="grab"});let v=0;e.addEventListener("touchstart",m=>{m.touches.length===1?(r=!0,i=m.touches[0].clientX-a,l=m.touches[0].clientY-n):m.touches.length===2&&(v=Math.hypot(m.touches[0].clientX-m.touches[1].clientX,m.touches[0].clientY-m.touches[1].clientY))},{passive:!0}),e.addEventListener("touchmove",m=>{if(m.touches.length===1&&r)a=m.touches[0].clientX-i,n=m.touches[0].clientY-l,u();else if(m.touches.length===2){const d=Math.hypot(m.touches[0].clientX-m.touches[1].clientX,m.touches[0].clientY-m.touches[1].clientY);v>0&&(o=Math.max(s,Math.min(c,o*(d/v))),u()),v=d}},{passive:!0}),e.addEventListener("touchend",()=>{r=!1,v=0}),document.getElementById("map-zoom-in")?.addEventListener("click",()=>{o=Math.min(c,o*1.25),u()}),document.getElementById("map-zoom-out")?.addEventListener("click",()=>{o=Math.max(s,o*.8),u()}),document.getElementById("map-zoom-reset")?.addEventListener("click",()=>{o=1,a=0,n=0,u()}),u()}let eo=null;function Ra(e,t){if(!document.getElementById("world-highlight-body")||!e.length)return;const a=t.nation?.id;K=e,F=t;const n=e.find(r=>r.id===a);n?Mo(n.id):lo(e,a)}function lo(e,t,o){const a=document.getElementById("world-nations-grid");if(!a)return;const r=(o?e.filter(l=>l.name.toLowerCase().includes(o.toLowerCase())):e).map(l=>{const s=l.id===t,c=l.id===eo,f=["wn-grid-cell"];c&&f.push("is-selected"),s&&f.push("is-you");const u=l.flag_url||`assets/flags/${l.name}.png`;return`<div class="${f.join(" ")}" data-nation-id="${l.id}">
            <img class="wn-grid-flag" src="${u}" alt="" onerror="this.style.display='none'">
            <div class="wn-grid-info">
                <div class="wn-grid-name">${b(l.name)}${s?" (You)":""}${c?" ◀":""}</div>
                <div class="wn-grid-gov">${b(l.government_type||"")}</div>
            </div>
        </div>`}).join("");a.innerHTML=r||'<div class="wn-grid-empty">No nations match your search.</div>',a.dataset.clickBound||(a.addEventListener("click",l=>{const s=l.target.closest("[data-nation-id]");s&&Mo(s.dataset.nationId)}),a.dataset.clickBound="1");const i=document.getElementById("world-nation-search");i&&!i._wired&&(i._wired=!0,i.addEventListener("input",()=>{lo(e,t,i.value)}))}let K=[],F=null,je=null,to=null;async function Mo(e){const t=K.find(i=>i.id===e);if(!t)return;const o=F.nation?.id,a=t.id===o;if(eo=e,lo(K,o),!je){const[i,l]=await Promise.all([p.from("diplomatic_relations").select("*"),p.from("trade_agreements").select("*").eq("status","active")]);je=i.data||[],to=l.data||[]}const r={gov:await Fa(t.id),tradeData:null};Da(t,F,je,to,r),!a&&o&&qa(o,t.id).then(i=>{if(eo!==e)return;const l=document.getElementById("world-trade-section");l&&(l.innerHTML=Bo(i))}).catch(i=>{console.error("[World] Bilateral trade fetch failed:",i)})}async function Fa(e){try{const[t,o,a,n]=await Promise.all([p.from("head_of_government").select("first_name, last_name, faction_id").eq("nation_id",e).eq("active",!0).limit(1).maybeSingle(),p.from("presidents").select("first_name, last_name, faction_id").eq("nation_id",e).eq("is_active",!0).limit(1).maybeSingle(),p.from("government_formations").select("party_ids, ministry_assignments, proposed_by, status").eq("nation_id",e).in("status",["formed","caretaker"]).order("formed_at",{ascending:!1}).limit(1).maybeSingle(),p.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",e).order("seats",{ascending:!1})]),r=n.data||[],i={};for(const g of r)i[g.id]=g;const s=(K.find(g=>g.id===e)?.government_type||"").toLowerCase().includes("presidential"),c=o.data,f=t.data;let u=null,v=null;s&&c?(u={name:`${c.first_name} ${c.last_name}`,title:"President"},v=i[c.faction_id]||null):f?(u={name:`${f.first_name} ${f.last_name}`,title:"Prime Minister"},v=i[f.faction_id]||null):c&&(u={name:`${c.first_name} ${c.last_name}`,title:"President"},v=i[c.faction_id]||null);const m=a.data;let d=[];return m&&m.party_ids&&(d=m.party_ids.map(g=>i[g]).filter(Boolean)),{leader:u,leaderParty:v,coalitionParties:d}}catch(t){return console.error("[World] fetchNationGovernmentData failed:",t),{leader:null,leaderParty:null,coalitionParties:[]}}}async function qa(e,t){return{exportsToThem:{},importsFromThem:{},totalExports:0,totalImports:0,balance:0,tick:F.shard?.current_tick||0}}const St={fta:"Free Trade Agreement",free_trade:"Free Trade Agreement",pta:"Preferential Trade",preferential_trade:"Preferential Trade",goods_trade:"Goods & Services Trade Agreement",resource_supply:"Resource Supply Contract",export_subsidy:"Export Subsidy",economic_aid:"Economic Aid",stockpile_purchase:"Stockpile Purchase",retaliatory_tariff:"Retaliatory Tariff",impose_embargo:"Embargo"},za=new Set(["trade_flow","transfer","market_access","tariff_reduction","exit_terms"]);function Ot(e,t){const o=(e||[]).filter(n=>(n.article_type||n.type)!=="duration");return o.length===0?t||null:o.every(n=>za.has(n.article_type||n.type))&&(t==="fta"||t===null||t===void 0||t==="pending")?"goods_trade":t}function Bo(e){if(!e)return'<div class="world-trade-loading">Loading trade data…</div>';if(e.totalExports===0&&e.totalImports===0)return'<div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);font-style:italic;">No active trade routes.</div>';const t=new Set([...Object.keys(e.exportsToThem),...Object.keys(e.importsFromThem)]),o=[];for(const l of t){const s=e.exportsToThem[l]||0,c=e.importsFromThem[l]||0;o.push({sector:l,exp:s,imp:c,total:s+c})}o.sort((l,s)=>s.total-l.total);let a=`<table class="world-trade-table">
        <thead><tr><th>Sector</th><th>Exports</th><th>Imports</th><th>Net</th></tr></thead><tbody>`;for(const l of o){const s=l.exp-l.imp,c=s>0?"trade-positive":s<0?"trade-negative":"trade-zero",f=s>0?"+":"";a+=`<tr>
            <td>${b(Tt[l.sector]||l.sector)}</td>
            <td>${U(l.exp)}</td>
            <td>${U(l.imp)}</td>
            <td class="${c}">${f}${U(s)}</td>
        </tr>`}a+="</tbody></table>";const n=e.balance,r=n>0?"trade-positive":n<0?"trade-negative":"trade-zero",i=n>0?"+":"";return a+=`<div class="world-trade-balance">
        <span class="world-trade-balance-label">Trade Balance</span>
        <span class="world-trade-balance-value ${r}">${i}${U(n)}</span>
    </div>`,a+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">
        Total exports: ${U(e.totalExports)} &middot;
        Total imports: ${U(e.totalImports)}
    </div>`,a}function Da(e,t,o,a,n){const r=document.getElementById("world-highlight-body");if(!r)return;const i=t.nation?.id,l=e.id===i,s=n?.gov||{},c=n?.tradeData,f=Number(e.population||0),u=f>=1e6?(f/1e6).toFixed(1)+"M":f.toLocaleString(),v=e.flag_url||`assets/flags/${e.name}.png`;let m=`<div class="world-hl-header-row">
        <img class="world-hl-flag" src="${b(v)}" alt="" onerror="this.style.display='none'">
        <div>
            <div class="world-highlight-name">${b(e.name)}${l?' <span style="font-family:var(--font-mono);font-size:8px;color:var(--green);font-weight:700;">YOU</span>':""}</div>
            <div class="world-highlight-meta">${b(e.government_type||"Unknown")}</div>
        </div>
    </div>`;if(s.leader){const w=s.leaderParty?.abbreviation||s.leaderParty?.faction_name||"",A=s.leaderParty?.party_color||"var(--text-dim)";m+=`<div style="margin:6px 0 4px;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${A};">
            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px;">${b(s.leader.title)}</div>
            <div style="font-size:14px;font-weight:700;color:var(--text-bright);">${b(s.leader.name)} <span style="font-family:var(--font-mono);font-size:11px;color:${A};font-weight:700;">${w?"["+b(w)+"]":""}</span></div>
        </div>`}if(s.coalitionParties&&s.coalitionParties.length>0){m+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 4px;">';for(const w of s.coalitionParties){const A=w.party_color||"#888";m+=`<span style="font-family:var(--font-mono);font-size:7px;padding:2px 6px;border:1px solid ${A};color:${A};letter-spacing:0.03em;">${b(w.abbreviation||w.faction_name)}${w.seats?" · "+w.seats:""}</span>`}m+="</div>"}m+='<div class="world-highlight-section">KEY STATS</div>';const d=e.state_apparatus??0,g=d>=50?"var(--green)":d>=30?"var(--amber)":"var(--red)",x=[{label:"Population",value:u},{label:"State Apparatus",value:d.toFixed(1),color:g}];m+=x.map(w=>`<div class="world-highlight-stat-row">
        <span class="world-highlight-stat-label">${b(w.label)}</span>
        <span class="world-highlight-stat-value" style="${w.color?"color:"+w.color:""}">${w.value}</span>
    </div>`).join("");let I=null,$=null;if(!l&&i){const w=i<e.id?i:e.id,A=i<e.id?e.id:i,R=(o||[]).find(N=>N.nation_a_id===w&&N.nation_b_id===A);R&&(I=Number(R.relation_score??0),$=Number(R.proximity??0))}if(!l&&I!==null){let w="",A="var(--text-dim)";I>=60?(w="FRIENDLY",A="var(--green)"):I>=30?(w="WARM",A="var(--green)"):I>=-10?(w="NEUTRAL",A="var(--amber)"):I>=-40?(w="COOL",A="var(--orange)"):(w="HOSTILE",A="var(--red)"),m+='<div class="world-highlight-section">DIPLOMATIC RELATIONS</div>',m+=`<div class="world-highlight-stat-row">
            <span class="world-highlight-stat-label">Relation Score</span>
            <span class="world-highlight-stat-value" style="color:${A};">${I} — ${w}</span>
        </div>`,$!==null&&(m+=`<div class="world-highlight-stat-row">
                <span class="world-highlight-stat-label">Proximity</span>
                <span class="world-highlight-stat-value">${$}</span>
            </div>`)}const E=l?[]:(a||[]).filter(w=>w.nation_a_id===i&&w.nation_b_id===e.id||w.nation_a_id===e.id&&w.nation_b_id===i),T=l?(a||[]).filter(w=>w.nation_a_id===e.id||w.nation_b_id===e.id):[];if(!l&&E.length>0){m+=`<div class="world-highlight-section">ACTIVE AGREEMENTS (${E.length})</div>`;for(const w of E){const A=St[w.agreement_type]||w.agreement_type,R=w.agreement_type==="retaliatory_tariff"||w.agreement_type==="impose_embargo";m+=`<div style="padding:4px 0;border-bottom:1px solid var(--border-light);">
                <div style="font-size:9px;font-weight:600;color:${R?"var(--red)":"var(--text-bright)"};">${b(w.agreement_name||A)}</div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${b(A)}</div>
            </div>`}}else!l&&E.length===0&&(m+='<div class="world-highlight-section">AGREEMENTS</div>',m+='<div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);font-style:italic;">No active agreements.</div>');if(l&&T.length>0){m+=`<div class="world-highlight-section">YOUR AGREEMENTS (${T.length})</div>`;for(const w of T.slice(0,8)){const A=w.nation_a_id===e.id?w.nation_b_id:w.nation_a_id,R=K.find(S=>S.id===A),N=St[w.agreement_type]||w.agreement_type;m+=`<div style="padding:3px 0;border-bottom:1px solid var(--border-light);">
                <div style="font-size:9px;font-weight:600;color:var(--text-bright);">${b(w.agreement_name||N)}</div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">with ${b(R?.name||"Unknown")} · ${b(N)}</div>
            </div>`}T.length>8&&(m+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">+ ${T.length-8} more</div>`)}l||(m+='<div class="world-highlight-section">BILATERAL TRADE</div>',m+=`<div id="world-trade-section">${Bo(c)}</div>`),r.innerHTML=m}ta("diplomacy",async e=>{h=e.faction||null,$e=e.nation||null,Je();const t=(window._ipoPendingInviteCount||0)+(window._ipoPendingVoteCount||0);t>0&&Ro(t),Io().then(()=>Je()).catch(()=>{}),Ba();try{const{data:o}=await p.from("nations").select("*").order("name");Ra(o||[],e)}catch(o){console.error("[World] Failed to load nations:",o)}});function Ro(e){Ut=e||0,typeof Je=="function"&&Je(),window._ipoPendingInviteCount=e}async function Fo(e){const[t,o]=await Promise.all([p.from("international_orgs").select("*").eq("id",e).single(),p.from("ipo_members").select("id, faction_id, role, factions:faction_id ( id, faction_name, nation_id )").eq("org_id",e).eq("is_active",!0)]),a=t.data;if(!a)return null;const n=o.data||[],r=a.charter||{},i=a.description||r.description||"No description provided.",l=[...new Set(n.map(m=>m.factions?.nation_id).filter(Boolean))],s={};if(l.length>0){const{data:m}=await p.from("nations").select("id, name").in("id",l);(m||[]).forEach(d=>{s[d.id]=d.name})}const f=n.find(m=>m.faction_id===a.president_id)?.factions?.faction_name||"Unknown",u=n.map(m=>{const d=m.factions;if(!d)return"";const g=s[d.nation_id]||"",x=m.faction_id===a.president_id,I=x?"★ President":m.role==="observer"?"Observer":"Member",$=x?"ipo-preview-member-role ipo-preview-member-role--president":"ipo-preview-member-role";return'<div class="ipo-preview-member"><span class="ipo-preview-member-name">'+b(d.faction_name)+"</span>"+(g?'<span class="ipo-preview-member-nation"> · '+b(g)+"</span>":"")+'<span class="'+$+'">'+I+"</span></div>"}).join(""),v=`
        <div class="ipo-preview-header">
            ${De(a,"ipo-header-logo","")}
            <div class="ipo-preview-header-info">
                <div class="ipo-header-name">${b(a.name)}</div>
                <div class="ipo-header-meta">
                    <span>${n.length} member${n.length!==1?"s":""}</span>
                    <span>President: ${b(f)}</span>
                    <span>Est. Tick ${a.founded_at_tick}</span>
                </div>
            </div>
        </div>
        <div class="ipo-preview-desc">${b(i)}</div>
        <div class="ipo-preview-section-label">Members</div>
        <div class="ipo-preview-members">${u||'<div style="color:var(--text-dim);font-size:12px;">No members.</div>'}</div>`;return{org:a,members:n,headerHtml:v}}async function ja(e,t){const o=document.getElementById("ipo-main");if(o){o.innerHTML='<div class="ipo-main-placeholder"><span class="ipo-main-placeholder-text">Loading organisation details...</span></div>';try{const a=await Fo(e);if(!a){o.innerHTML='<div class="ipo-main-placeholder"><span class="ipo-main-placeholder-text">Organisation not found.</span></div>';return}o.innerHTML=`
            <div class="ipo-preview">
                ${a.headerHtml}
                <div class="ipo-preview-actions" style="margin-top:16px;display:flex;gap:8px;">
                    <button class="ipo-btn ipo-btn--accept" onclick="acceptIPOInvite('${t}')">Accept Invitation</button>
                    <button class="ipo-btn ipo-btn--decline" onclick="declineIPOInvite('${t}')">Decline</button>
                </div>
            </div>`}catch(a){console.error("[IPO] Preview invite org error:",a),o.innerHTML='<div class="ipo-main-placeholder"><span class="ipo-main-placeholder-text">Failed to load organisation.</span></div>'}}}async function qo(e){const t=document.getElementById("ipo-main");if(t){t.innerHTML='<div class="ipo-main-placeholder"><span class="ipo-main-placeholder-text">Loading organisation details...</span></div>',_=null,document.querySelectorAll(".ipo-sidebar-item.is-active").forEach(o=>o.classList.remove("is-active"));try{const o=await Fo(e);if(!o){t.innerHTML='<div class="ipo-main-placeholder"><span class="ipo-main-placeholder-text">Organisation not found.</span></div>';return}const{data:a}=await p.from("ipo_votes").select("id").eq("org_id",e).eq("vote_type","membership").eq("status","open").eq("proposed_by",h.id).limit(1).maybeSingle();let n="";a?n='<button class="ipo-btn" disabled style="opacity:0.5;">Request Pending...</button>':n=`<button class="ipo-btn ipo-btn--create-large" onclick="requestToJoinOrg('${e}')">Request to Join</button>`,t.innerHTML=`
            <div class="ipo-preview">
                ${o.headerHtml}
                <div class="ipo-preview-actions" style="margin-top:16px;display:flex;gap:8px;">
                    ${n}
                </div>
            </div>`}catch(o){console.error("[IPO] Preview existing org error:",o),t.innerHTML='<div class="ipo-main-placeholder"><span class="ipo-main-placeholder-text">Failed to load organisation.</span></div>'}}}async function Ha(e){if(!P){P=!0;try{const{data:t}=await p.from("international_orgs").select("id, name, charter, president_id").eq("id",e).single();if(!t){alert("Organisation not found.");return}const o=t.charter?.membership?.admission||"vote",{data:a}=await p.from("ipo_votes").select("id").eq("org_id",e).eq("vote_type","membership").eq("status","open").eq("proposed_by",h.id).limit(1).maybeSingle();if(a){alert("You already have a pending join request for this organisation.");return}const n=t.charter?.membership?.joinRequestRole||"member";if(!await vt(e)){alert(`This organisation already has ${ot} open votes. Please try again later.`);return}if(o==="vote"){const{error:r}=await p.from("ipo_votes").insert({org_id:e,title:`Admit ${h.faction_name} as ${n}`,vote_type:"membership",meta:{target_faction_id:h.id,target_faction_name:h.faction_name,requested_role:n,join_request:!0},status:"open",opened_at_tick:k,closes_at_tick:k+Ze,proposed_by:h.id});if(r){console.error("[IPO] Vote insert failed:",r.message),alert("Failed to create join request. You may not have permission.");return}const{error:i}=await p.from("ipo_chat").insert({org_id:e,faction_id:null,is_system:!0,message_text:`${h.faction_name} has requested to join as ${n}. A membership vote has been opened.`,tick_posted:k});i&&console.error("[IPO] Chat insert failed:",i.message),alert("Your request has been submitted. The organisation will vote on your membership.")}else{const{error:r}=await p.from("ipo_votes").insert({org_id:e,title:`Admit ${h.faction_name} as ${n}`,vote_type:"membership",meta:{target_faction_id:h.id,target_faction_name:h.faction_name,requested_role:n,join_request:!0,president_decides:!0},status:"open",opened_at_tick:k,closes_at_tick:k+Ze,proposed_by:h.id});if(r){console.error("[IPO] Vote insert failed:",r.message),alert("Failed to create join request. You may not have permission.");return}const{error:i}=await p.from("ipo_chat").insert({org_id:e,faction_id:null,is_system:!0,message_text:`${h.faction_name} has requested to join as ${n}. The President will decide on admission.`,tick_posted:k});i&&console.error("[IPO] Chat insert failed:",i.message),alert("Your request has been submitted. The President will decide on your admission.")}await qo(e)}catch(t){console.error("[IPO] Request to join error:",t),alert("Failed to submit join request.")}finally{P=!1}}}async function re(){const e=document.getElementById("ipo-view");if(!e||!h)return;try{const{data:u,error:v}=await p.from("ipo_members").select(`
                id, role, joined_at_tick, chat_color,
                org:international_orgs (
                    id, name, logo_symbol, logo_text, logo_image_url, description,
                    founded_at_tick, founding_party_id,
                    president_id, president_term_start_tick, emergency_power_used_tick,
                    headquarters_nation_id, solidarity_fund_balance,
                    charter, is_active,
                    symposium_cooldown_remaining, pending_symposium
                )
            `).eq("faction_id",h.id).eq("is_active",!0);v?(console.error("[IPO] Failed to load memberships:",v.message),B=[]):B=(u||[]).filter(m=>m.org&&m.org.is_active)}catch(u){console.error("[IPO] Membership fetch error:",u),B=[]}const t={},o=B.map(u=>u.org.id);if(o.length>0){const{data:u}=await p.from("ipo_members").select("org_id").in("org_id",o).eq("is_active",!0);(u||[]).forEach(v=>{t[v.org_id]=(t[v.org_id]||0)+1})}if(B.length>0){const u=B.some(v=>v.org.id===_);(!_||!u)&&(_=B[0].org.id)}else _=null;let a=[];try{const{data:u}=await p.from("ipo_invitations").select(`
                id, invited_role, invited_at_tick, status,
                org:international_orgs ( id, name, logo_symbol, logo_text, logo_image_url ),
                inviter:invited_by ( id, faction_name )
            `).eq("target_faction_id",h.id).in("status",["pending"]);a=u||[]}catch{}let n=[];try{const u=B.map(m=>m.org.id),{data:v}=await p.from("international_orgs").select("id, name, logo_symbol, logo_text, logo_image_url, description, president_id, charter").eq("is_active",!0).order("name");if(n=(v||[]).filter(m=>!u.includes(m.id)),n.length>0){const m=n.map(g=>g.id),{data:d}=await p.from("ipo_members").select("org_id").in("org_id",m).eq("is_active",!0);(d||[]).forEach(g=>{t[g.org_id]=(t[g.org_id]||0)+1})}}catch{}const r={};let i=0;if(o.length>0)try{const{data:u}=await p.from("ipo_votes").select("id, org_id").in("org_id",o).eq("status","open");if(u&&u.length>0){const v=u.map(x=>x.id),{data:m}=await p.from("ipo_ballots").select("vote_id").in("vote_id",v).eq("faction_id",h.id),d=new Set((m||[]).map(x=>x.vote_id)),g=new Set(B.filter(x=>x.role==="member").map(x=>x.org.id));for(const x of u)!d.has(x.id)&&g.has(x.org_id)&&(r[x.org_id]=(r[x.org_id]||0)+1,i++)}}catch{}const l=B.map(u=>{const v=u.org,m=v.id===_,d=t[v.id]||1,g=v.president_id===h.id?"President":u.role==="observer"?"Observer":"Member",x=r[v.id]||0,I=x>0?`<span class="badge badge--amber" style="margin-left:auto;flex-shrink:0;font-size:9px;min-width:16px;text-align:center;padding:1px 5px;">${x}</span>`:"";return`
            <div class="ipo-sidebar-item ${m?"is-active":""}"
                 onclick="selectIPOOrg('${v.id}')">
                ${De(v,"ipo-sidebar-logo",m?"is-active":"")}
                <div class="ipo-sidebar-info" style="flex:1;min-width:0;">
                    <span class="ipo-sidebar-name ${m?"is-active":""}">${b(v.name)}</span>
                    <span class="ipo-sidebar-meta">${d} member${d!==1?"s":""} · ${g}</span>
                </div>
                ${I}
            </div>`}).join(""),s=a.map(u=>{const v=u.org,m=u.inviter?.faction_name||"Unknown";return`
            <div class="ipo-sidebar-invite">
                <div class="ipo-sidebar-invite-header">
                    ${De(v,"ipo-sidebar-logo","")}
                    <span class="ipo-sidebar-name">${b(v.name)}</span>
                </div>
                <span class="ipo-sidebar-invite-from">Invited by ${b(m)} · ${u.invited_role}</span>
                <div class="ipo-sidebar-invite-actions">
                    <button class="ipo-btn ipo-btn--accept" onclick="acceptIPOInvite('${u.id}')">Accept</button>
                    <button class="ipo-btn ipo-btn--decline" onclick="declineIPOInvite('${u.id}')">Decline</button>
                    <button class="ipo-btn ipo-btn--view" onclick="previewIPOInviteOrg('${v.id}','${u.id}')">View</button>
                </div>
            </div>`}).join("");let c="";n.length>0&&(c=`
            <div class="ipo-sidebar-header" style="margin-top:8px;">
                <span class="ipo-sidebar-dot" style="background:var(--damber);"></span>
                <span class="ipo-sidebar-label">EXISTING ORGANISATIONS</span>
            </div>
            <div class="ipo-sidebar-list">${n.map(v=>{const m=t[v.id]||1;return`
                <div class="ipo-sidebar-item" onclick="previewExistingOrg('${v.id}')">
                    ${De(v,"ipo-sidebar-logo","")}
                    <div class="ipo-sidebar-info">
                        <span class="ipo-sidebar-name">${b(v.name)}</span>
                        <span class="ipo-sidebar-meta">${m} member${m!==1?"s":""}</span>
                    </div>
                </div>`}).join("")}</div>`);let f="";B.length===0?f=`
            <div class="ipo-empty-state">
                <div class="ipo-empty-icon">◈</div>
                <div class="ipo-empty-title">International Party Organisations</div>
                <div class="ipo-empty-desc">
                    Join or create an international organisation to coordinate with like-minded parties across nations.
                    Share resources, hold rallies, issue joint statements, and project soft power across borders.
                </div>
                <button class="ipo-btn ipo-btn--create-large" onclick="openIPOCreationModal()">
                    + Create Organisation — $200k
                </button>
            </div>`:f=await Va(t),e.innerHTML=`
        <div class="ipo-sidebar">
            <div class="ipo-sidebar-header">
                <span class="ipo-sidebar-dot"></span>
                <span class="ipo-sidebar-label">YOUR ORGANISATIONS</span>
            </div>
            <div class="ipo-sidebar-list">
                ${l}
                ${s}
            </div>
            ${c}
            <button class="ipo-btn ipo-btn--create" onclick="openIPOCreationModal()">
                + Create Organisation — $200k
            </button>
        </div>
        <div class="ipo-main" id="ipo-main">
            ${f}
        </div>`,Ro(a.length+i),_&&B.length>0&&(Ua(_),ae(_).then(()=>Te()))}async function Va(e){const t=B.find(q=>q.org.id===_);if(!t)return`<div class="ipo-main-placeholder">
            <span class="ipo-main-placeholder-text">Select an organisation from the sidebar.</span>
        </div>`;const o=t.org,a=o.charter||{},n=a.leadership||{};a.resources;const r=o.president_id===h.id,i=t.role==="observer",l=e[o.id]||1,[s,c,f,u]=await Promise.all([o.headquarters_nation_id?p.from("nations").select("name").eq("id",o.headquarters_nation_id).single():Promise.resolve({data:null}),p.from("factions").select("faction_name").eq("id",o.president_id).single(),p.from("ipo_members").select("id, faction_id, role, factions:faction_id ( id, faction_name, nation_id, seats )").eq("org_id",o.id).eq("is_active",!0),p.from("nations").select("id, name").order("name")]),v=s.data?.name||null,m=c.data?.faction_name||"Unknown",d=f.data||[],g=u.data||[],x=Object.fromEntries(g.map(q=>[q.id,q.name])),$={rotation:"Rotation",most_seats:"Most Seats",random:"Random"}[n.type]||"Rotation",E=n.termYears||2,T=`
        <div class="ipo-header">
            ${De(o,"ipo-header-logo","")}
            <div class="ipo-header-identity">
                <span class="ipo-header-name">${b(o.name)}</span>
                <div class="ipo-header-meta">
                    <span>Est. Tick ${o.founded_at_tick}</span>
                    <span>${l} member${l!==1?"s":""}</span>
                    <span>${$}</span>
                    <span>${E}-Year Term</span>
                </div>
            </div>
            <div class="ipo-header-right">
                <span class="ipo-header-fund">${v?"HQ: "+b(v):"HQ: VACANT"}</span>
                <span class="ipo-header-fund">${b("SOLIDARITY FUND")} · ${C(o.solidarity_fund_balance)}</span>
                <span class="ipo-header-fund">President: ${b(m)}</span>
                ${r?'<span class="ipo-header-president">YOU ARE PRESIDENT</span>':""}
            </div>
        </div>`,w=`
        <div class="ipo-chat-area" id="ipo-chat-area">
            <div class="ipo-chat-messages" id="ipo-chat-messages">
                <div class="ipo-main-placeholder">
                    <span class="ipo-main-placeholder-text">Chat loading...</span>
                </div>
            </div>
            <div class="ipo-chat-input-row">
                <input type="text" class="ipo-chat-input"
                    placeholder="${i?"Observers cannot send messages.":"Message the "+b(o.name)+"..."}"
                    ${i?"disabled":""}
                    id="ipo-chat-input"
                    onkeydown="if(event.key==='Enter')sendIPOChat()" />
                <button class="ipo-btn ipo-btn--send" onclick="sendIPOChat()" ${i?"disabled":""}>Send</button>
            </div>
        </div>`,R=`
        <div class="ipo-bottom-panels">
            <div class="ipo-panel ipo-panel--charter" id="ipo-panel-charter">
                <div class="ipo-panel-header">
                    <span class="ipo-panel-dot ipo-panel-dot--teal"></span>
                    <span class="ipo-panel-title">Charter</span>
                </div>
                <div class="ipo-panel-body">${an(a)}</div>
            </div>
            <div class="ipo-panel ipo-panel--votes" id="ipo-panel-votes">
                <div class="ipo-panel-header">
                    <span class="ipo-panel-dot ipo-panel-dot--amber"></span>
                    <span class="ipo-panel-title">Votes</span>
                    ${i?"":'<button class="ipo-panel-action-btn" onclick="openIPOVoteModal()">+ Propose</button>'}
                </div>
                <div class="ipo-panel-body" id="ipo-votes-body">
                    <span class="ipo-main-placeholder-text">Loading votes...</span>
                </div>
            </div>
            <div class="ipo-panel ipo-panel--actions" id="ipo-panel-actions">
                <div class="ipo-panel-header">
                    <span class="ipo-panel-dot ipo-panel-dot--purple"></span>
                    <span class="ipo-panel-title">Actions</span>
                </div>
                <div class="ipo-panel-body" id="ipo-actions-body">
                    <span class="ipo-main-placeholder-text">Loading actions...</span>
                </div>
            </div>
        </div>`,N=d.map(q=>{const D=q.factions?.faction_name||"Unknown",j=q.factions?.nation_id&&x[q.factions.nation_id]||"",ee=q.faction_id===h.id,L=q.faction_id===o.president_id,Y=q.role==="observer"?" (OBS)":"",H=L?" ★":"";return`<span class="ipo-footer-badge ${ee?"ipo-footer-badge--you":L?"ipo-footer-badge--president":"ipo-footer-badge--other"}">${H?'<span class="ipo-president-star">'+H+"</span>":""}${b(D)}${Y}${ee?" (YOU)":""}${j?" · "+b(j):""}</span>`}).join(""),M=!!a.membership?.expulsionClause&&(a.membership.expulsionClause==="president"?r:!i),z=`
        <div class="ipo-footer">
            <div class="ipo-footer-members">${N}</div>
            <div class="ipo-footer-actions">
                ${i?"":'<button class="ipo-btn ipo-btn--invite" onclick="openIPOInviteModal()">Invite</button>'}
                ${i?"":'<button class="ipo-btn ipo-btn--amend" onclick="openIPOAmendModal()">Amend Charter</button>'}
                ${M?'<button class="ipo-btn ipo-btn--expel" onclick="openIPOExpelModal()">Expel</button>':""}
                <button class="ipo-btn ipo-btn--leave" onclick="leaveIPOOrg()">Leave</button>
            </div>
        </div>`;return T+w+R+z}let me=[],oo={};async function Ua(e){if(!(!document.getElementById("ipo-chat-messages")||!e)){ke&&(p.removeChannel(ke),ke=null);try{const{data:o}=await p.from("ipo_members").select("faction_id, chat_color, factions:faction_id ( faction_name )").eq("org_id",e).eq("is_active",!0);oo={},(o||[]).forEach(a=>{oo[a.faction_id]={name:a.factions?.faction_name||"Unknown",color:a.chat_color||"#6b6a5e"}})}catch(o){console.warn("[IPO Chat] Member map error:",o)}try{const{data:o,error:a}=await p.from("ipo_chat").select("id, faction_id, is_system, message_text, tick_posted, created_at").eq("org_id",e).order("created_at",{ascending:!1}).limit(100);a?(console.error("[IPO Chat] Fetch error:",a.message),me=[]):me=(o||[]).reverse()}catch(o){console.error("[IPO Chat] Fetch exception:",o),me=[]}ao(),ke=p.channel("ipo_chat_"+e).on("postgres_changes",{event:"INSERT",schema:"public",table:"ipo_chat",filter:"org_id=eq."+e},o=>{const a=o.new;me.find(n=>n.id===a.id)||(me.push(a),ao())}).subscribe()}}function ao(){const e=document.getElementById("ipo-chat-messages");if(e){if(me.length===0){e.innerHTML='<div class="ipo-chat-system">— No messages yet —</div>';return}e.innerHTML=me.map(t=>{if(t.is_system)return`<div class="ipo-chat-system">— ${b(t.message_text)} —</div>`;const o=oo[t.faction_id],a=o?.name||"Unknown",n=o?.color||"#6b6a5e",r=Ya(t.created_at);return`<div class="ipo-chat-msg">
            <span class="ipo-chat-msg-party" style="color:${n};">${b(a)}</span>
            <span class="ipo-chat-msg-text">${b(t.message_text)}</span>
            <span class="ipo-chat-msg-time">${r}</span>
        </div>`}).join(""),e.scrollTop=e.scrollHeight}}function Ya(e){if(!e)return"";const t=new Date(e),a=(new Date-t)/1e3;return a<60?"now":a<3600?Math.floor(a/60)+"m":a<86400?Math.floor(a/3600)+"h":t.toLocaleDateString("en-GB",{day:"numeric",month:"short"})}async function Ga(){const e=document.getElementById("ipo-chat-input");if(!e||!h||!_)return;const t=e.value.trim();if(!t)return;const o=B.find(a=>a.org.id===_);if(!(!o||o.role==="observer")){e.value="",e.disabled=!0;try{const{data:a,error:n}=await p.from("ipo_chat").insert({org_id:_,faction_id:h.id,is_system:!1,message_text:t,tick_posted:k}).select();if(n)console.error("[IPO Chat] Send error:",n.message,n.code,n.details),e.value=t,alert("Message failed to send: "+n.message);else if(!a||a.length===0)console.error("[IPO Chat] Send returned no data — RLS may have blocked the insert"),e.value=t,alert("Message may not have been saved. Please try again.");else{const r=a?.[0];r&&!me.find(i=>i.id===r.id)&&(me.push(r),ao())}}catch(a){console.error("[IPO Chat] Send exception:",a),e.value=t}finally{e.disabled=!1,e.focus()}}}async function Wa(){if(!h||!_)return;const e=B.find($=>$.org.id===_);if(!e||e.role==="observer")return;const{data:t,error:o}=await p.from("ipo_members").select("faction_id").eq("org_id",_).eq("is_active",!0);o&&console.error("[IPO Invite] Members query error:",o.message);const a=new Set((t||[]).map($=>$.faction_id)),{data:n,error:r}=await p.from("ipo_invitations").select("target_faction_id, status, responded_at_tick").eq("org_id",_);r&&console.error("[IPO Invite] Invitations query error:",r.message);const i={};(n||[]).forEach($=>{(!i[$.target_faction_id]||$.status==="pending"||$.status==="vote_pending")&&(i[$.target_faction_id]=$)});const l=10,{data:s,error:c}=await p.from("factions").select("id, faction_name, nation_id").eq("faction_type","party").is("abandoned_at",null).order("faction_name");c&&console.error("[IPO Invite] Factions query error:",c.message);const f=s||[],u=[...new Set(f.map($=>$.nation_id).filter(Boolean))],v={};if(u.length>0){const{data:$}=await p.from("nations").select("id, name").in("id",u);($||[]).forEach(E=>{v[E.id]=E.name})}function m($){if(a.has($.id))return'<span class="ipo-invite-badge ipo-invite-badge--accepted">Accepted</span>';const E=i[$.id];if(!E)return"";if(E.status==="pending"||E.status==="vote_pending")return'<span class="ipo-invite-badge ipo-invite-badge--invited">Invited</span>';if(E.status==="declined"){const T=k-(E.responded_at_tick||0);if(T<l)return'<span class="ipo-invite-badge ipo-invite-badge--rejected">Rejected · '+(l-T)+" Tick Cooldown</span>"}return""}function d($){if(a.has($.id))return!0;const E=i[$.id];return E?E.status==="pending"||E.status==="vote_pending"||E.status==="declined"&&k-(E.responded_at_tick||0)<l:!1}const g=f.find($=>!d($)),x=f.map($=>{const E=v[$.nation_id]?' <span style="color:var(--text-dim);font-size:12px;">· '+b(v[$.nation_id])+"</span>":"",T=m($),w=d($),A=!w&&g&&$.id===g.id?" selected":"",R=w?" disabled":"";return'<div class="ipo-invite-item'+A+R+'" data-faction-id="'+$.id+'"'+(w?"":' onclick="selectIPOInviteTarget(this)"')+'><div style="display:flex;align-items:center;justify-content:space-between;gap:8px;"><span style="font-size:13px;">'+b($.faction_name)+E+"</span>"+T+"</div></div>"}).join(""),I=document.getElementById("ipo-create-modal-inner");document.getElementById("ipo-create-modal").classList.add("active"),I.innerHTML=`
        <div class="ipo-modal-header">
            <span class="ipo-modal-title">Invite to Organisation</span>
            <button class="modal-close" onclick="closeIPOActionModal()">&times;</button>
        </div>
        <div class="ipo-modal-body">
            <label class="ipo-vote-form-label">Party to Invite</label>
            <input type="hidden" id="ipo-invite-target" value="${g?.id||""}">
            <div id="ipo-invite-list" style="max-height:260px;overflow-y:auto;border:1px solid var(--border-color, rgba(255,255,255,0.12));border-radius:6px;background:var(--bg-darker, rgba(0,0,0,0.2));">${x}</div>
            <label class="ipo-vote-form-label">Role</label>
            <select id="ipo-invite-role" class="ipo-vote-form-select">
                <option value="member">Member — full voting and action rights</option>
                <option value="observer">Observer — read-only access, no voting</option>
            </select>
            <div class="ipo-vote-form-note">The invited party will see this invitation and can accept or decline.</div>
            <div class="wizard-nav" style="margin-top:16px;">
                <button class="wizard-back-btn" onclick="closeIPOActionModal()">Cancel</button>
                <button class="ipo-btn ipo-btn--create-large" onclick="submitIPOInvite()">Send Invitation</button>
            </div>
        </div>`}function Xa(e){e.classList.contains("disabled")||(document.querySelectorAll("#ipo-invite-list .ipo-invite-item.selected").forEach(t=>t.classList.remove("selected")),e.classList.add("selected"),document.getElementById("ipo-invite-target").value=e.dataset.factionId)}async function Qa(){if(P)return;const e=document.getElementById("ipo-invite-target")?.value,t=document.getElementById("ipo-invite-role")?.value||"member";if(!e){alert("Select a party to invite.");return}P=!0;try{const{error:o}=await p.from("ipo_invitations").insert({org_id:_,invited_by:h.id,target_faction_id:e,invited_role:t,status:"pending",invited_at_tick:k});if(o){o.code==="23505"?alert("This party already has a pending invitation."):alert("Failed to send invitation: "+o.message);return}const{data:a}=await p.from("factions").select("faction_name").eq("id",e).single(),n=a?.faction_name||"A party";await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`${h.faction_name} invited ${n} as ${t}.`,tick_posted:k}),Ce(),alert(`Invitation sent to ${n}.`)}catch(o){console.error("[IPO] Invite error:",o),alert("Failed to send invitation.")}finally{P=!1}}async function Ja(){if(!h||!_)return;const e=B.find(c=>c.org.id===_);if(!e)return;const t=e.org,a=(t?.charter||{}).membership?.expulsionClause,n=t.president_id===h.id;if(!a){alert("Expulsion is disabled in this organisation's charter.");return}if(a==="president"&&!n){alert("Only the president can expel members under this charter.");return}const r=_e.filter(c=>c.faction_id!==h.id);if(r.length===0){alert("No other members to expel.");return}const i=r.map(c=>{const f=c.role==="observer"?" (Observer)":"";return`<option value="${c.faction_id}">${b(c.factions?.faction_name||"Unknown")}${f}</option>`}).join(""),l=a==="president"?"As president, you can expel a member immediately.":`Expulsion requires a ${a} vote. This will create a vote proposal.`,s=document.getElementById("ipo-create-modal-inner");document.getElementById("ipo-create-modal").classList.add("active"),s.innerHTML=`
        <div class="ipo-modal-header">
            <span class="ipo-modal-title">Expel Member</span>
            <button class="modal-close" onclick="closeIPOActionModal()">&times;</button>
        </div>
        <div class="ipo-modal-body">
            <div class="ipo-vote-form-note">${l}</div>
            <label class="ipo-vote-form-label">Member to Expel</label>
            <select id="ipo-expel-target" class="ipo-vote-form-select">${i}</select>
            <div class="wizard-nav" style="margin-top:16px;">
                <button class="wizard-back-btn" onclick="closeIPOActionModal()">Cancel</button>
                <button class="ipo-btn ipo-btn--create-large" style="background:rgba(217,83,79,0.15);border-color:rgba(217,83,79,0.3);color:#d9534f;" onclick="submitIPOExpel()">
                    ${a==="president"?"Expel Now":"Propose Expulsion Vote"}
                </button>
            </div>
        </div>`}async function Ka(){if(P)return;const e=document.getElementById("ipo-expel-target")?.value;if(!e){alert("Select a member.");return}const a=B.find(i=>i.org.id===_)?.org?.charter?.membership?.expulsionClause,r=_e.find(i=>i.faction_id===e)?.factions?.faction_name||"Unknown";if(P=!0,a==="president"){if(!confirm(`Expel ${r} from the organisation? This is immediate and cannot be undone.`))return;try{await p.from("ipo_members").update({is_active:!1,left_at_tick:k}).eq("org_id",_).eq("faction_id",e).eq("is_active",!0),await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`${r} has been expelled by the president.`,tick_posted:k}),await p.from("ipo_action_log").insert({org_id:_,faction_id:h.id,target_faction_id:e,action_type:"expulsion",action_data:{type:"expulsion",target_name:r,by_president:!0},ap_cost:0,performed_at_tick:k}),Ce(),re()}catch(i){console.error("[IPO] Expulsion error:",i),alert("Failed to expel member.")}finally{P=!1}}else try{if(!await vt(_)){alert(`This organisation already has ${ot} open votes. Wait for some to close before proposing new ones.`),P=!1;return}await p.from("ipo_votes").insert({org_id:_,title:`Expel ${r}`,vote_type:"expulsion",meta:{target_faction_id:e,target_faction_name:r},status:"open",opened_at_tick:k,closes_at_tick:k+Ze,proposed_by:h.id}),await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`${h.faction_name} proposed to expel ${r}. A vote has been opened.`,tick_posted:k}),Ce(),await ae(_)}catch(i){console.error("[IPO] Expulsion vote error:",i),alert("Failed to propose expulsion vote.")}finally{P=!1}}async function Za(){if(!h||!_)return;const t=B.find(n=>n.org.id===_)?.org,o=t?.president_id===h.id;let a="Are you sure you want to leave this organisation? Your solidarity fund contributions will not be returned.";if(o&&(a+=`

You are the PRESIDENT. Leadership will pass to the next eligible member.`),!!confirm(a))try{const{error:n}=await p.from("ipo_members").update({is_active:!1,left_at_tick:k}).eq("org_id",_).eq("faction_id",h.id).eq("is_active",!0);if(n){alert("Failed to leave organisation: "+n.message);return}await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`${h.faction_name} has left the organisation.`,tick_posted:k});const{data:r}=await p.from("ipo_members").select("faction_id, role").eq("org_id",_).eq("is_active",!0),i=(r||[]).filter(l=>l.role==="member");if(!r||r.length===0)await p.from("international_orgs").update({is_active:!1,dissolved_at_tick:k}).eq("id",_),await p.from("ipo_invitations").update({status:"expired",responded_at_tick:k}).eq("org_id",_).in("status",["pending","vote_pending"]),await p.from("ipo_votes").update({status:"failed",resolved_at_tick:k,result:{yes:0,no:0,abstain:0,passed:!1,reason:"Organisation dissolved"}}).eq("org_id",_).eq("status","open"),await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:"Organisation dissolved — no members remaining.",tick_posted:k});else if(o&&i.length>0){const l=i[0].faction_id;await p.from("international_orgs").update({president_id:l,president_term_start_tick:k}).eq("id",_);const{data:s}=await p.from("factions").select("faction_name").eq("id",l).single();await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`${s?.faction_name||"A member"} is now president (previous president departed).`,tick_posted:k})}if(t?.headquarters_nation_id){const{data:l}=await p.from("ipo_members").select("faction_id, factions:faction_id ( nation_id )").eq("org_id",_).eq("is_active",!0);(l||[]).some(c=>c.factions?.nation_id===t.headquarters_nation_id)||(await p.from("international_orgs").update({headquarters_nation_id:null}).eq("id",_),await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:"Headquarters vacated — no member party remains in the HQ nation.",tick_posted:k}))}_=null,re()}catch(n){console.error("[IPO] Leave org error:",n),alert("Failed to leave organisation.")}}function en(e){e!==_&&(_=e,re())}async function tn(e){if(h)try{const{data:t,error:o}=await p.from("ipo_invitations").select("id, org_id, invited_role, status").eq("id",e).single();if(o||!t||t.status!=="pending"){alert("This invitation is no longer valid."),re();return}const{data:a}=await p.from("international_orgs").select("charter").eq("id",t.org_id).single();if((a?.charter?.membership?.admission||"vote")==="vote"&&t.invited_role==="member"){if(!await vt(t.org_id)){alert(`This organisation already has ${ot} open votes. Please try again later.`),P=!1;return}await p.from("ipo_invitations").update({status:"vote_pending",responded_at_tick:k}).eq("id",e),await p.from("ipo_votes").insert({org_id:t.org_id,title:`Admit ${h.faction_name}`,vote_type:"membership",meta:{invite_id:e,target_faction_id:h.id,target_faction_name:h.faction_name},status:"open",opened_at_tick:k,closes_at_tick:k+Ze,proposed_by:h.id}),await p.from("ipo_chat").insert({org_id:t.org_id,faction_id:null,is_system:!0,message_text:`${h.faction_name} has applied for membership. A vote has been opened.`,tick_posted:k}),alert("Your application has been submitted. The organisation will vote on your membership.")}else{let r=[{id:h.id,name:h.faction_name}];for(const l of r){const s=await Lo(t.org_id);await p.from("ipo_members").insert({org_id:t.org_id,faction_id:l.id,role:t.invited_role,joined_at_tick:k,chat_color:s})}await p.from("ipo_invitations").update({status:"accepted",responded_at_tick:k}).eq("id",e);const i=r.length>1?`${h.faction_name} and its ${r.length-1} faction(s) have joined the organisation.`:`${h.faction_name} has joined the organisation.`;await p.from("ipo_chat").insert({org_id:t.org_id,faction_id:null,is_system:!0,message_text:i,tick_posted:k})}re()}catch(t){console.error("[IPO] Accept invite error:",t),alert("Failed to accept invitation.")}}async function on(e){if(h)try{const{data:t}=await p.from("ipo_invitations").select("org_id").eq("id",e).single();await p.from("ipo_invitations").update({status:"declined",responded_at_tick:k}).eq("id",e),t?.org_id&&await p.from("ipo_chat").insert({org_id:t.org_id,faction_id:null,is_system:!0,message_text:`${h.faction_name} declined the invitation to join.`,tick_posted:k}),re()}catch(t){console.error("[IPO] Decline invite error:",t)}}function an(e,t){if(!e||Object.keys(e).length===0)return'<span class="ipo-main-placeholder-text">No charter defined.</span>';const o=[];if(e.mission!=null&&o.push(st("Article I — Mission Statement",`<div class="ipo-charter-text">${b(e.mission)}</div>`)),e.leadership){const a=e.leadership,n={vote:"Vote",rotation:"Rotation",most_seats:"Most Seats",random:"Random"},r={equal:"Equal (one vote per member)",seat_share:"By Seat Share"},i={majority:"Majority (>50%)",unanimous:"Unanimous"};o.push(st("Article II — Leadership",`
            ${G("Leadership Type",n[a.type]||a.type)}
            ${G("Succession Term",(a.termYears||2)+" Year"+((a.termYears||2)>1?"s":""))}
            ${G("Voting Weight",r[a.votingWeight]||a.votingWeight)}
            ${G("Vote Pass Threshold",i[a.votePass]||a.votePass)}
        `))}if(e.membership){const a=e.membership;let r=G("New Member Admission",{vote:"Vote Required",president:"President Decides"}[a.admission]||a.admission);if(a.ideologicalThreshold?.enabled&&a.ideologicalThreshold.directions?.length>0){const i=a.ideologicalThreshold.directions.map(l=>`<span class="ipo-charter-tag">${b(l.charAt(0).toUpperCase()+l.slice(1))}</span>`).join(" ");r+=G("Ideological Requirements",i)}else r+=G("Ideological Threshold","None");a.expulsionClause?r+=G("Expulsion Clause",{president:"President Only",majority:"Majority Vote",unanimous:"Unanimous Vote"}[a.expulsionClause]||a.expulsionClause):r+=G("Expulsion Clause","Disabled"),o.push(st("Article III — Membership",r))}if(e.governance){const a=e.governance,n={unilateral:"Unilateral — any member can execute actions",committee:"Committee — all actions require a vote (funded from solidarity fund)",presidential:"Presidential — only the president can execute actions",delegated:"Delegated — president + officers can act, others must vote",tiered:`Tiered — actions ≤${C(2*O)} are unilateral, higher cost requires a vote`},r={public:"Public Ballot",secret:"Secret Ballot"},i={founding:"Founding Party",president:"Current President",hq:"HQ Nation Party"};o.push(st("Article IV — Transparency & Governance",`
            ${G("Action Leadership",n[a.actionLeadership]||n.unilateral)}
            ${G("Vote Transparency",r[a.voteTransparency]||a.voteTransparency)}
            ${G("Observer Status",a.observerStatus?"Enabled":"Disabled")}
            ${G("Veto Right",a.vetoRight?i[a.vetoRight]||a.vetoRight:"None")}
            ${G("Emergency Powers",a.emergencyPowers?"Enabled — President can act once per term without a vote":"Disabled")}
        `))}if(e.resources){const a=e.resources,n={president:"President Alone",vote:"Majority Vote Required"};let r="";if(a.solidarityFund?.enabled){const i=(Number(a.solidarityFund.contributionPerQuarter)||1)*O;r+=G("Solidarity Fund",C(i)+" / Quarter")}else r+=G("Solidarity Fund","Disabled");a.resourceSharingCap!=null?r+=G("Resource Sharing Cap",a.resourceSharingCap+" per member per term"):r+=G("Resource Sharing Cap","No limit"),r+=G("Joint Statements",n[a.jointStatementClause]||a.jointStatementClause),r+=G("Headquarters",a.headquarters?"Active":"Not designated"),o.push(st("Article V — Resources & External Relations",r))}return o.join('<div class="ipo-charter-divider"></div>')}function st(e,t){return`
        <div class="ipo-charter-section">
            <div class="ipo-charter-article-label">${e}</div>
            ${t}
        </div>`}function G(e,t){return`<div class="ipo-charter-row">
        <span class="ipo-charter-row-label">${e}</span>
        <span class="ipo-charter-row-value">${t}</span>
    </div>`}let W=null,de=null,Xe=null,Qe=null;function nn(){if(!h||!_)return;const e=B.find(n=>n.org.id===_);if(!e)return;const t=e.org,o=t.charter||{};if(e.role==="observer"){alert("Observers cannot amend the charter.");return}W=[],o.mission!=null&&W.push({type:"mission",config:{text:o.mission}}),o.leadership&&W.push({type:"leadership",config:{...o.leadership}}),o.membership&&W.push({type:"membership",config:JSON.parse(JSON.stringify(o.membership))}),o.governance&&W.push({type:"governance",config:{...o.governance}}),o.resources&&W.push({type:"resources",config:JSON.parse(JSON.stringify(o.resources))}),W.find(n=>n.type==="mission")||W.unshift({type:"mission",config:{text:""}}),de={symbol:t.logo_symbol||"",text:t.logo_text||"",image_url:t.logo_image_url||null},Xe=null,Qe=t.logo_image_url||null,document.getElementById("ipo-create-modal").classList.add("active"),gt()}function gt(){const e=document.getElementById("ipo-create-modal-inner"),t=J;J=W;const o=W.map((c,f)=>Qo(c,f)).join(""),a=new Set(W.map(c=>c.type)),n=Lt.filter(c=>!a.has(c.key)),i=W.length<5&&n.length>0?`
        <div class="ipo-add-article-row">
            <select id="ipo-add-article-select" style="font-size:0.75rem;padding:4px 8px;background:var(--bg-1);color:var(--text-primary);border:1px solid var(--border-hair);border-radius:3px;">
                <option value="">Add article...</option>
                ${n.map(c=>`<option value="${c.key}">${c.label}</option>`).join("")}
            </select>
            <button class="wizard-next-btn" style="font-size:8px;padding:3px 10px;"
                onclick="ipoAmendAddArticle()">Add</button>
        </div>`:"",s=`
        <div style="background:var(--bg-2);border:1px solid var(--border-0);border-radius:4px;padding:12px;margin-bottom:12px;">
            <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:var(--text-dim);margin-bottom:8px;">Organisation Logo</div>
            <div style="display:flex;gap:12px;align-items:flex-start;">
                <div>${Qe?`<img src="${b(Qe)}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid var(--border-0);" />`:`<span style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:var(--bg-3);border:1px solid var(--border-0);border-radius:6px;font-family:var(--font-mono);font-size:14px;color:var(--text-dim);">${b((de?.symbol||"")+" "+(de?.text||""))}</span>`}</div>
                <div style="flex:1;">
                    <div style="display:flex;gap:6px;margin-bottom:6px;">
                        <div style="flex:1;">
                            <label style="display:block;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-transform:uppercase;margin-bottom:2px;">Symbol</label>
                            <input type="text" id="ipo-amend-logo-symbol" value="${b(de?.symbol||"")}" maxlength="2" placeholder="🌐"
                                style="width:100%;padding:4px 6px;background:var(--bg-4);border:1px solid var(--border-0);border-radius:3px;color:var(--text-bright);font-size:14px;text-align:center;"
                                oninput="ipoAmendLogo.symbol=this.value">
                        </div>
                        <div style="flex:2;">
                            <label style="display:block;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-transform:uppercase;margin-bottom:2px;">Text</label>
                            <input type="text" id="ipo-amend-logo-text" value="${b(de?.text||"")}" maxlength="6" placeholder="IPO"
                                style="width:100%;padding:4px 6px;background:var(--bg-4);border:1px solid var(--border-0);border-radius:3px;color:var(--text-bright);font-family:var(--font-mono);font-size:11px;"
                                oninput="ipoAmendLogo.text=this.value">
                        </div>
                    </div>
                    <div style="display:flex;gap:6px;align-items:center;">
                        <button onclick="document.getElementById('ipo-amend-logo-file').click()" style="font-family:var(--font-mono);font-size:8px;padding:3px 8px;background:var(--bg-3);border:1px solid var(--border-0);color:var(--text-muted);cursor:pointer;border-radius:2px;">Upload Image</button>
                        ${Qe?'<button onclick="ipoAmendRemoveLogo()" style="font-family:var(--font-mono);font-size:8px;padding:3px 8px;background:none;border:1px solid rgba(217,83,79,0.3);color:var(--red);cursor:pointer;border-radius:2px;">Remove</button>':""}
                        <input type="file" accept="image/png,image/jpeg,image/webp" id="ipo-amend-logo-file" style="display:none" onchange="ipoAmendHandleLogoFile(this)">
                    </div>
                </div>
            </div>
        </div>`;e.innerHTML=`
        <div class="ipo-modal-header">
            <span class="ipo-modal-title">Amend Charter</span>
            <button class="modal-close" onclick="closeIPOAmendModal()">&times;</button>
        </div>
        <div class="ipo-modal-body">
            <div class="ipo-charter-info">Edit the charter articles and logo below. Changes will be put to a vote (${C(O)}).</div>
            ${s}
            <div class="ipo-article-list">${o}</div>
            ${i}
            <div class="wizard-nav">
                <button class="wizard-back-btn" onclick="closeIPOAmendModal()">Cancel</button>
                <button class="ipo-btn ipo-btn--create-large" onclick="submitIPOAmend()">Propose Amendment</button>
            </div>
        </div>`,J=t}function rn(e){const t=e?.files?.[0];if(t){if(t.size>512*1024){alert("Logo must be under 512KB.");return}Xe=t,Qe=URL.createObjectURL(t),gt()}}function sn(){Xe=null,Qe=null,de&&(de.image_url=null),gt()}function ln(){const e=document.getElementById("ipo-add-article-select");if(!e||!e.value)return;const t=e.value,o={leadership:{type:"rotation",termYears:2,votingWeight:"equal",votePass:"majority"},membership:{admission:"vote",ideologicalThreshold:{enabled:!1,directions:[]},expulsionClause:null},governance:{actionLeadership:"unilateral",voteTransparency:"public",observerStatus:!1,vetoRight:null,emergencyPowers:!1},resources:{solidarityFund:{enabled:!1,contributionPerQuarter:1},resourceSharingCap:null,jointStatementClause:"vote",headquarters:null}};W.push({type:t,config:o[t]||{}});const a=J;J=W,gt(),J=a}function zo(){document.getElementById("ipo-create-modal").classList.remove("active"),W=null}async function cn(){if(!h||!_||!W||P)return;const e={};for(const a of W)switch(a.type){case"mission":e.mission=a.config.text||"";break;case"leadership":e.leadership={type:a.config.type,termYears:Number(a.config.termYears),votingWeight:a.config.votingWeight,votePass:a.config.votePass};break;case"membership":e.membership={admission:a.config.admission,ideologicalThreshold:a.config.ideologicalThreshold||{enabled:!1,directions:[]},expulsionClause:a.config.expulsionClause||null};break;case"governance":e.governance={actionLeadership:a.config.actionLeadership||"unilateral",voteTransparency:a.config.voteTransparency,observerStatus:!!a.config.observerStatus,vetoRight:a.config.vetoRight||null,emergencyPowers:!!a.config.emergencyPowers};break;case"resources":e.resources={solidarityFund:a.config.solidarityFund||{enabled:!1,contributionPerQuarter:1},resourceSharingCap:a.config.resourceSharingCap??null,jointStatementClause:a.config.jointStatementClause||"vote",headquarters:a.config.headquarters==="__self__"?$e.id:a.config.headquarters||null};break}e.leadership||(e.leadership={type:"rotation",termYears:2,votingWeight:"equal",votePass:"majority"}),e.membership||(e.membership={admission:"vote",ideologicalThreshold:{enabled:!1,directions:[]},expulsionClause:null}),e.governance||(e.governance={voteTransparency:"public",observerStatus:!1,vetoRight:null,emergencyPowers:!1}),e.resources||(e.resources={solidarityFund:{enabled:!1,contributionPerQuarter:1},resourceSharingCap:null,jointStatementClause:"vote",headquarters:null});const t=W.map(a=>a.type).join(", "),o="Amend charter articles: "+t;P=!0;try{const a=O,n=await Ue(h.id,a);if(!n.success){alert("Not enough cash. Charter amendments cost "+C(a)+".");return}if(h.party_funds=n.newFunds,!await vt(_)){alert(`This organisation already has ${ot} open votes. Wait for some to close.`);return}let r=de?.image_url||null;if(Xe){const m=Xe.name.split(".").pop().toLowerCase(),d=`ipo-logos/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${m}`,{error:g}=await p.storage.from("public-assets").upload(d,Xe,{upsert:!0});if(g){console.error("[IPO] Logo upload error:",g),alert("Failed to upload logo: "+g.message);return}const{data:x}=p.storage.from("public-assets").getPublicUrl(d);r=x?.publicUrl||null}const i={symbol:de?.symbol||"",text:de?.text||"",image_url:r},s=B.find(m=>m.org.id===_)?.org,c=s&&(i.symbol!==(s.logo_symbol||"")||i.text!==(s.logo_text||"")||i.image_url!==(s.logo_image_url||null)),f=[];t&&f.push(t),c&&f.push("logo");const u="Charter Amendment: "+(f.join(", ")||"no changes"),{error:v}=await p.from("ipo_votes").insert({org_id:_,title:u,vote_type:"charter_amendment",meta:{description:o,proposed_charter:e,proposed_logo:i},status:"open",opened_at_tick:k,closes_at_tick:k+Ze,proposed_by:h.id});if(v){console.error("[IPO] Amend charter vote error:",v),alert("Failed to propose charter amendment: "+v.message);return}await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`${h.faction_name} proposed a charter amendment (${t}). Members must vote to approve.`,tick_posted:k}),zo(),await ae(_),re()}catch(a){console.error("[IPO] Amend error:",a),alert("Failed to propose charter amendment.")}finally{P=!1}}let He=[],Fe={},ie=[],_e=[],P=!1;const Ze=8,ot=5;async function vt(e){const{count:t,error:o}=await p.from("ipo_votes").select("id",{count:"exact",head:!0}).eq("org_id",e).eq("status","open");return o?!0:(t||0)<ot}const co={membership:"Membership",expulsion:"Expulsion",joint_statement:"Joint Statement",fund_draw:"Fund Draw",charter_amendment:"Charter Amendment",change_headquarters:"Change Headquarters",symposium:"Symposium",leadership_election:"Leadership Election",change_logo:"Change Logo"},dn={membership:"Vote to admit a new member party.",expulsion:"Vote to expel a current member.",joint_statement:"Vote to issue a public statement on behalf of the organisation.",fund_draw:"Vote to withdraw cash from the solidarity fund.",charter_amendment:"Vote to amend the organisation charter.",change_headquarters:"Vote to relocate the organisation headquarters.",symposium:"Vote to hold a symposium influencing a nation's ideology.",leadership_election:"Elect a new president from the member parties.",change_logo:"Vote to change the organisation's logo (symbol, text, or image)."};async function ae(e){if(!(!document.getElementById("ipo-votes-body")||!e)){try{const{data:o,error:a}=await p.from("ipo_votes").select("*").eq("org_id",e).order("status",{ascending:!0}).order("opened_at_tick",{ascending:!1}).limit(20);if(a){console.error("[IPO Votes] Fetch error:",a.message);return}if(He=o||[],He.length>0){const r=He.map(l=>l.id),{data:i}=await p.from("ipo_ballots").select("*").in("vote_id",r);Fe={},(i||[]).forEach(l=>{Fe[l.vote_id]||(Fe[l.vote_id]=[]),Fe[l.vote_id].push(l)})}else Fe={};const{data:n}=await p.from("ipo_members").select("faction_id, role, is_active, factions:faction_id ( faction_name, nation_id )").eq("org_id",e).eq("is_active",!0);_e=n||[],ie=_e.filter(r=>r.role==="member")}catch(o){console.error("[IPO Votes] Load exception:",o)}pn(),Ie&&(p.removeChannel(Ie),Ie=null),Ie=p.channel("ipo_org_"+e).on("postgres_changes",{event:"*",schema:"public",table:"ipo_votes",filter:"org_id=eq."+e},()=>{ae(e).then(()=>Te())}).on("postgres_changes",{event:"INSERT",schema:"public",table:"ipo_ballots"},()=>{ae(e)}).on("postgres_changes",{event:"*",schema:"public",table:"ipo_members",filter:"org_id=eq."+e},()=>{ae(e).then(()=>Te())}).on("postgres_changes",{event:"UPDATE",schema:"public",table:"international_orgs",filter:"id=eq."+e},()=>{re()}).subscribe()}}function Do(e,t){const o={};let a=0;for(const i of e){if(i.ballot==="abstain"){a++;continue}o[i.ballot]=(o[i.ballot]||0)+1}let n=null,r=0;for(const[i,l]of Object.entries(o))(l>r||l===r&&i===t)&&(r=l,n=i);return n||(n=t),{voteTally:o,abstainCount:a,winnerId:n,maxVotes:r}}function pn(){const e=document.getElementById("ipo-votes-body");if(!e)return;if(He.length===0){e.innerHTML='<div class="ipo-votes-empty">No votes yet. Use <strong>+ Propose</strong> to start one.</div>';return}const t=B.find(s=>s.org.id===_),a=t?.org?.charter||{},n=a.governance||{};a.leadership;const r=n.voteTransparency==="secret",i=t?.role==="observer",l=[...He].sort((s,c)=>s.status==="open"&&c.status!=="open"?-1:s.status!=="open"&&c.status==="open"?1:c.opened_at_tick-s.opened_at_tick);e.innerHTML=l.map(s=>{const c=Fe[s.id]||[],f=c.find(N=>N.faction_id===h.id),u=s.status==="open",v=s.status==="passed",m=co[s.vote_type]||s.vote_type,d=s.vote_type==="leadership_election",g=s.meta&&s.meta.candidates||[],x=ie.length,I=c.length;let $="";if(d){const{voteTally:N,abstainCount:S}=Do(c,null);for(const z of g)N[z.faction_id]===void 0&&(N[z.faction_id]=0);$=`<div class="ipo-vote-tally ipo-election-tally">
                ${g.map(z=>{const q=N[z.faction_id]||0,D=I>0?q/I*100:0;return`<div class="ipo-election-candidate-row">
                    <span class="ipo-election-candidate-name">${b(z.faction_name)}</span>
                    <div class="ipo-election-candidate-bar"><div class="ipo-election-candidate-fill" style="width:${D}%"></div></div>
                    <span class="ipo-election-candidate-count">${q}</span>
                </div>`}).join("")}
                <div class="ipo-vote-tally-labels">
                    <span class="ipo-vote-tally-label--abstain">${S} Abstain</span>
                    <span class="ipo-vote-tally-label--total">${I}/${x}</span>
                </div>
            </div>`}else{const N=c.filter(j=>j.ballot==="yes").length,S=c.filter(j=>j.ballot==="no").length,M=c.filter(j=>j.ballot==="abstain").length,z=I>0?N/I*100:0,q=I>0?S/I*100:0,D=I>0?M/I*100:0;$=`<div class="ipo-vote-tally">
                <div class="ipo-vote-tally-bar">
                    <div class="ipo-vote-tally-seg ipo-vote-tally-seg--yes" style="width:${z}%"></div>
                    <div class="ipo-vote-tally-seg ipo-vote-tally-seg--no" style="width:${q}%"></div>
                    <div class="ipo-vote-tally-seg ipo-vote-tally-seg--abstain" style="width:${D}%"></div>
                </div>
                <div class="ipo-vote-tally-labels">
                    <span class="ipo-vote-tally-label--yes">${N} Yes</span>
                    <span class="ipo-vote-tally-label--no">${S} No</span>
                    <span class="ipo-vote-tally-label--abstain">${M} Abstain</span>
                    <span class="ipo-vote-tally-label--total">${I}/${x}</span>
                </div>
            </div>`}let E;if(u){const N=s.closes_at_tick-k;E=`<span class="ipo-vote-badge ipo-vote-badge--open">OPEN · ${N>0?N+" ticks left":"closing..."}</span>`}else v?E='<span class="ipo-vote-badge ipo-vote-badge--passed">PASSED</span>':E='<span class="ipo-vote-badge ipo-vote-badge--failed">FAILED</span>';const T=mn(s);let w="";if(u&&!i)if(f)if(d){const N=g.find(M=>M.faction_id===f.ballot),S=f.ballot==="abstain"?"ABSTAIN":N?.faction_name||f.ballot;w=`<div class="ipo-vote-my-ballot">Your vote: <strong>${b(S)}</strong></div>`}else w=`<div class="ipo-vote-my-ballot">Your vote: <strong>${f.ballot.toUpperCase()}</strong></div>`;else if(d){const N=g.map(S=>`<button class="ipo-vote-btn ipo-vote-btn--candidate" onclick="selectIPOBallot('${s.id}','${S.faction_id}')" data-candidate-name="${b(S.faction_name)}">${b(S.faction_name)}</button>`).join("");w=`
                    <div class="ipo-vote-ballot-row ipo-election-ballot-row" id="ipo-ballot-row-${s.id}">
                        ${N}
                        <button class="ipo-vote-btn ipo-vote-btn--abstain" onclick="selectIPOBallot('${s.id}','abstain')">Abstain</button>
                    </div>
                    <div class="ipo-vote-confirm-row" id="ipo-ballot-confirm-${s.id}" style="display:none">
                        <span class="ipo-vote-confirm-label">Vote for <strong id="ipo-ballot-choice-${s.id}"></strong>?</span>
                        <button class="ipo-vote-btn ipo-vote-btn--confirm" onclick="confirmIPOBallot('${s.id}')">Confirm</button>
                        <button class="ipo-vote-btn ipo-vote-btn--cancel" onclick="cancelIPOBallot('${s.id}')">Cancel</button>
                    </div>`}else w=`
                    <div class="ipo-vote-ballot-row" id="ipo-ballot-row-${s.id}">
                        <button class="ipo-vote-btn ipo-vote-btn--yes" onclick="selectIPOBallot('${s.id}','yes')">Yes</button>
                        <button class="ipo-vote-btn ipo-vote-btn--no" onclick="selectIPOBallot('${s.id}','no')">No</button>
                        <button class="ipo-vote-btn ipo-vote-btn--abstain" onclick="selectIPOBallot('${s.id}','abstain')">Abstain</button>
                    </div>
                    <div class="ipo-vote-confirm-row" id="ipo-ballot-confirm-${s.id}" style="display:none">
                        <span class="ipo-vote-confirm-label">Vote <strong id="ipo-ballot-choice-${s.id}"></strong>?</span>
                        <button class="ipo-vote-btn ipo-vote-btn--confirm" onclick="confirmIPOBallot('${s.id}')">Confirm</button>
                        <button class="ipo-vote-btn ipo-vote-btn--cancel" onclick="cancelIPOBallot('${s.id}')">Cancel</button>
                    </div>`;let A="";!r&&c.length>0&&(!u||f)&&(d?A='<div class="ipo-vote-voters">'+c.map(N=>{const M=ie.find(D=>D.faction_id===N.faction_id)?.factions?.faction_name||"Unknown";if(N.ballot==="abstain")return`<span class="ipo-vote-voter ipo-vote-voter--abstain">${b(M)}: Abstain</span>`;const q=g.find(D=>D.faction_id===N.ballot)?.faction_name||"Unknown";return`<span class="ipo-vote-voter ipo-vote-voter--yes">${b(M)} → ${b(q)}</span>`}).join("")+"</div>":A='<div class="ipo-vote-voters">'+c.map(N=>{const M=ie.find(z=>z.faction_id===N.faction_id)?.factions?.faction_name||"Unknown";return`<span class="ipo-vote-voter ipo-vote-voter--${N.ballot}">${b(M)}: ${N.ballot}</span>`}).join("")+"</div>");let R="";return u&&!i&&(I>=x||k>=s.closes_at_tick)&&(R=`<button class="ipo-vote-btn ipo-vote-btn--resolve" onclick="resolveIPOVote('${s.id}')">Resolve Vote</button>`),`
            <div class="ipo-vote-card ${u?"ipo-vote-card--open":""} ${v?"ipo-vote-card--passed":""} ${s.status==="failed"?"ipo-vote-card--failed":""}">
                <div class="ipo-vote-card-header">
                    <span class="ipo-vote-type-badge">${m}</span>
                    ${E}
                </div>
                <div class="ipo-vote-card-title">${b(s.title)}</div>
                ${T}
                ${$}
                ${A}
                ${w}
                ${R}
            </div>`}).join("")}function mn(e){const t=e.meta||{};let o="";switch(e.vote_type){case"membership":{const a=t.target_faction_name||"a party",n=t.requested_role==="observer"?"an observer":"a member";o=`Admit <strong>${b(a)}</strong> as ${n}.`;break}case"expulsion":{const a=t.target_faction_name||"a member";o=`Expel <strong>${b(a)}</strong> from the organisation.`;break}case"joint_statement":if(t.statement_text){const a=b(t.statement_text);t.statement_text.length>120?o=`<div class="ipo-statement-text">
                        <span class="ipo-statement-preview">"${b(t.statement_text.substring(0,120))}…"</span>
                        <span class="ipo-statement-full">"${a}"</span>
                        <button class="ipo-statement-toggle" onclick="this.parentElement.classList.toggle('expanded'); this.textContent = this.parentElement.classList.contains('expanded') ? 'Show less' : 'Read more'">Read more</button>
                    </div>`:o=`"${a}"`}break;case"fund_draw":o=`<strong>${b(t.proposer_name||"A member")}</strong> requests <strong>${C(t.amount_requested||0)}</strong> from the solidarity fund.`,t.purpose&&(o+=`<br><span style="color:var(--text-muted);font-size:0.8em;">Purpose: ${b(t.purpose)}</span>`);break;case"charter_amendment":o=`Amend <strong>${t.article_type||"charter"}</strong>: ${b((t.description||"").substring(0,100))}`;break;case"change_headquarters":o=`Relocate HQ to <strong>${b(t.proposed_nation_name||"a new nation")}</strong>.`;break;case"symposium":o=`Hold symposium in <strong>${b(t.target_nation_name||"a nation")}</strong> (${t.axis||"ideology"} ${t.direction||""}).`;break;case"leadership_election":{const a=(t.candidates||[]).length;o=`Elect the next president from <strong>${a}</strong> candidate${a!==1?"s":""}.`;break}case"change_logo":{const a=t.proposed_logo||{},r=B.find(s=>s.org.id===e.org_id||s.org.id===_)?.org,i={logo_symbol:r?.logo_symbol||"",logo_text:r?.logo_text||"",logo_image_url:r?.logo_image_url||null},l={logo_symbol:a.symbol||"",logo_text:a.text||"",logo_image_url:a.image_url||null};o=`<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span style="font-size:0.85em;color:var(--text-muted);">Change logo:</span>
                ${De(i,"ipo-vote-logo-preview","")}
                <span style="color:var(--text-muted);">→</span>
                ${De(l,"ipo-vote-logo-preview","")}
            </div>`;break}}return o?`<div class="ipo-vote-meta-summary">${o}</div>`:""}let ue=null,X=null,fe=null,Se=null;function un(){if(!h||!_)return;const e=B.find(o=>o.org.id===_);if(!e||e.role==="observer")return;ue=null,X=null,fe=null,Se=null,document.getElementById("ipo-create-modal").classList.add("active"),Ho()}function jo(){document.getElementById("ipo-create-modal").classList.remove("active"),ue=null,X=null,fe=null,Se=null}function fn(e){const t=e?.files?.[0];if(t){if(t.size>512*1024){alert("Logo must be under 512KB.");return}fe=t,Se=URL.createObjectURL(t),po()}}function gn(){fe=null,Se=null,X&&(X.image_url=null),po()}function Ho(){const e=document.getElementById("ipo-create-modal-inner"),o=B.find(i=>i.org.id===_)?.org,a=o?.charter||{},n=[];(a.membership?.admission||"vote")==="vote"&&n.push("membership"),(a.membership?.expulsionClause==="majority"||a.membership?.expulsionClause==="unanimous")&&n.push("expulsion"),(a.resources?.jointStatementClause||"vote")==="vote"&&n.push("joint_statement"),a.resources?.solidarityFund?.enabled&&n.push("fund_draw"),n.push("charter_amendment"),n.push("change_logo"),n.push("change_headquarters"),(o.symposium_cooldown_remaining||0)<=0&&!o.pending_symposium&&n.push("symposium");const r=n.map(i=>`
        <button class="ipo-vote-type-card" onclick="selectIPOVoteType('${i}')">
            <span class="ipo-vote-type-card-label">${co[i]}</span>
            <span class="ipo-vote-type-card-desc">${dn[i]}</span>
        </button>
    `).join("");e.innerHTML=`
        <div class="ipo-modal-header">
            <span class="ipo-modal-title">Propose a Vote</span>
            <button class="modal-close" onclick="closeIPOVoteModal()">&times;</button>
        </div>
        <div class="ipo-modal-body">
            <div class="ipo-vote-type-grid">${r}</div>
        </div>`}async function vn(e){if(ue=e,e==="change_logo"){const o=B.find(a=>a.org.id===_)?.org;X={symbol:o?.logo_symbol||"",text:o?.logo_text||"",image_url:o?.logo_image_url||null},fe=null,Se=o?.logo_image_url||null}await po()}async function po(){const e=document.getElementById("ipo-create-modal-inner"),o=B.find(i=>i.org.id===_)?.org,a=co[ue];let n="";switch(ue){case"membership":{const{data:i}=await p.from("ipo_invitations").select("id, target_faction_id, status, factions:target_faction_id ( faction_name )").eq("org_id",_).eq("status","vote_pending"),l=(i||[]).map(s=>`<option value="${s.id}" data-name="${b(s.factions?.faction_name||"Unknown")}" data-fid="${s.target_faction_id}">${b(s.factions?.faction_name||"Unknown")}</option>`).join("");l?n=`
                    <label class="ipo-vote-form-label">Applicant</label>
                    <select id="ipo-vote-meta-invite" class="ipo-vote-form-select">${l}</select>`:n='<div class="ipo-vote-form-note">No pending membership applications.</div>';break}case"expulsion":{n=`
                <label class="ipo-vote-form-label">Member to Expel</label>
                <select id="ipo-vote-meta-target" class="ipo-vote-form-select">${_e.filter(l=>l.faction_id!==h.id).map(l=>{const s=l.role==="observer"?" (Observer)":"";return`<option value="${l.faction_id}">${b(l.factions?.faction_name||"Unknown")}${s}</option>`}).join("")}</select>`;break}case"joint_statement":n=`
                <label class="ipo-vote-form-label">Statement Text</label>
                <textarea id="ipo-vote-meta-statement" class="ipo-vote-form-textarea" rows="4" maxlength="500" placeholder="Draft the statement text..."></textarea>
                <label class="ipo-vote-form-label">Visibility</label>
                <select id="ipo-vote-meta-visibility" class="ipo-vote-form-select">
                    <option value="public">Public — visible to all nations</option>
                    <option value="private">Private — organisation only</option>
                </select>`;break;case"fund_draw":{const i=Number(o?.solidarity_fund_balance)||0;n=`
                <label class="ipo-vote-form-label">Amount ($, in $50k increments) · Fund Balance: ${C(i)}</label>
                <input type="number" id="ipo-vote-meta-amount" class="ipo-vote-form-input" min="${O}" max="${i}" step="${O}" value="${O}" />
                <label class="ipo-vote-form-label">Purpose</label>
                <input type="text" id="ipo-vote-meta-purpose" class="ipo-vote-form-input" maxlength="200" placeholder="Describe the purpose..." />`;break}case"charter_amendment":n=`
                <label class="ipo-vote-form-label">Article to Amend</label>
                <select id="ipo-vote-meta-article" class="ipo-vote-form-select">
                    <option value="mission">Article I — Mission</option>
                    <option value="leadership">Article II — Leadership</option>
                    <option value="membership">Article III — Membership</option>
                    <option value="governance">Article IV — Governance</option>
                    <option value="resources">Article V — Resources</option>
                </select>
                <label class="ipo-vote-form-label">Description of Changes</label>
                <textarea id="ipo-vote-meta-desc" class="ipo-vote-form-textarea" rows="3" maxlength="500" placeholder="Describe the proposed changes..."></textarea>`;break;case"change_headquarters":{const{data:i}=await p.from("nations").select("id, name").order("name");n=`
                <label class="ipo-vote-form-label">New Headquarters Nation</label>
                <select id="ipo-vote-meta-nation" class="ipo-vote-form-select">${(i||[]).map(s=>`<option value="${s.id}">${b(s.name)}</option>`).join("")}</select>`;break}case"symposium":{const{data:i}=await p.from("nations").select("id, name").order("name");n=`
                <label class="ipo-vote-form-label">Target Nation</label>
                <select id="ipo-vote-meta-nation" class="ipo-vote-form-select">${(i||[]).map(s=>`<option value="${s.id}">${b(s.name)}</option>`).join("")}</select>
                <label class="ipo-vote-form-label">Ideology Axis</label>
                <select id="ipo-vote-meta-axis" class="ipo-vote-form-select">
                    <option value="economic">Economic</option>
                    <option value="social">Social</option>
                    <option value="foreign">Foreign Policy</option>
                </select>
                <label class="ipo-vote-form-label">Direction</label>
                <select id="ipo-vote-meta-direction" class="ipo-vote-form-select">
                    <option value="left">Left / Progressive / Dovish</option>
                    <option value="right">Right / Conservative / Hawkish</option>
                </select>`;break}case"change_logo":{const i=Se?`<img src="${b(Se)}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid var(--border-0);" />`:`<span style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:var(--bg-3);border:1px solid var(--border-0);border-radius:6px;font-family:var(--font-mono);font-size:14px;color:var(--text-dim);">${b((X?.symbol||"")+" "+(X?.text||""))}</span>`;n=`
                <div class="ipo-vote-form-note">Proposes a cosmetic logo change. Cost: ${C(O)} on submission. Same vote threshold as charter amendments.</div>
                <div style="display:flex;gap:12px;align-items:flex-start;margin-top:8px;">
                    <div>${i}</div>
                    <div style="flex:1;">
                        <div style="display:flex;gap:6px;margin-bottom:6px;">
                            <div style="flex:1;">
                                <label style="display:block;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-transform:uppercase;margin-bottom:2px;">Symbol</label>
                                <input type="text" id="ipo-vote-logo-symbol" value="${b(X?.symbol||"")}" maxlength="2" placeholder="🌐"
                                    style="width:100%;padding:4px 6px;background:var(--bg-4);border:1px solid var(--border-0);border-radius:3px;color:var(--text-bright);font-size:14px;text-align:center;"
                                    oninput="ipoVoteSetLogoSymbol(this.value)">
                            </div>
                            <div style="flex:2;">
                                <label style="display:block;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-transform:uppercase;margin-bottom:2px;">Text</label>
                                <input type="text" id="ipo-vote-logo-text" value="${b(X?.text||"")}" maxlength="6" placeholder="IPO"
                                    style="width:100%;padding:4px 6px;background:var(--bg-4);border:1px solid var(--border-0);border-radius:3px;color:var(--text-bright);font-family:var(--font-mono);font-size:11px;"
                                    oninput="ipoVoteSetLogoText(this.value)">
                            </div>
                        </div>
                        <div style="display:flex;gap:6px;align-items:center;">
                            <button onclick="document.getElementById('ipo-vote-logo-file').click()" style="font-family:var(--font-mono);font-size:8px;padding:3px 8px;background:var(--bg-3);border:1px solid var(--border-0);color:var(--text-muted);cursor:pointer;border-radius:2px;">Upload Image</button>
                            ${Se?'<button onclick="ipoVoteRemoveLogo()" style="font-family:var(--font-mono);font-size:8px;padding:3px 8px;background:none;border:1px solid rgba(217,83,79,0.3);color:var(--red);cursor:pointer;border-radius:2px;">Remove</button>':""}
                            <input type="file" accept="image/png,image/jpeg,image/webp" id="ipo-vote-logo-file" style="display:none" onchange="ipoVoteHandleLogoFile(this)">
                        </div>
                    </div>
                </div>`;break}}const r=`${a} Vote`;e.innerHTML=`
        <div class="ipo-modal-header">
            <span class="ipo-modal-title">Propose: ${a}</span>
            <button class="modal-close" onclick="closeIPOVoteModal()">&times;</button>
        </div>
        <div class="ipo-modal-body">
            <label class="ipo-vote-form-label">Vote Title</label>
            <input type="text" id="ipo-vote-title" class="ipo-vote-form-input" value="${r}" maxlength="120" />
            ${n}
            <div class="wizard-nav" style="margin-top:16px;">
                <button class="wizard-back-btn" onclick="renderIPOVoteModalTypeSelect()">Back</button>
                <button class="ipo-btn ipo-btn--create-large" onclick="submitIPOVote()">Propose Vote</button>
            </div>
        </div>`}async function bn(){if(P||!h||!_||!ue)return;const e=document.getElementById("ipo-vote-title")?.value?.trim();if(!e){alert("Please enter a vote title.");return}const o=B.find(n=>n.org.id===_)?.org,a={};switch(ue){case"membership":{const n=document.getElementById("ipo-vote-meta-invite");if(!n||!n.value){alert("No applicant selected.");return}a.invite_id=n.value,a.target_faction_id=n.selectedOptions[0]?.dataset.fid||null,a.target_faction_name=n.selectedOptions[0]?.dataset.name||"Unknown";break}case"expulsion":{const n=document.getElementById("ipo-vote-meta-target");if(!n||!n.value){alert("No member selected.");return}a.target_faction_id=n.value;const r=ie.find(i=>i.faction_id===n.value);a.target_faction_name=r?.factions?.faction_name||"Unknown";break}case"joint_statement":{const n=document.getElementById("ipo-vote-meta-statement")?.value?.trim();if(!n){alert("Please write the statement text.");return}a.statement_text=n,a.visibility=document.getElementById("ipo-vote-meta-visibility")?.value||"public";break}case"fund_draw":{const n=parseInt(document.getElementById("ipo-vote-meta-amount")?.value);if(!n||n<O){alert("Enter at least "+C(O)+".");return}const r=Number(o?.solidarity_fund_balance)||0;if(n>r){alert("Amount exceeds fund balance.");return}a.amount_requested=n,a.proposer_name=h.faction_name,a.purpose=document.getElementById("ipo-vote-meta-purpose")?.value?.trim()||"";break}case"charter_amendment":{if(a.article_type=document.getElementById("ipo-vote-meta-article")?.value||"mission",a.description=document.getElementById("ipo-vote-meta-desc")?.value?.trim()||"",!a.description){alert("Please describe the proposed changes.");return}break}case"change_headquarters":{const n=document.getElementById("ipo-vote-meta-nation");if(!n||!n.value){alert("Select a nation.");return}a.proposed_nation_id=n.value,a.proposed_nation_name=n.selectedOptions[0]?.textContent||"";break}case"symposium":{const n=document.getElementById("ipo-vote-meta-nation");if(!n||!n.value){alert("Select a target nation.");return}a.target_nation_id=n.value,a.target_nation_name=n.selectedOptions[0]?.textContent||"",a.axis=document.getElementById("ipo-vote-meta-axis")?.value||"economic",a.direction=document.getElementById("ipo-vote-meta-direction")?.value||"left";break}case"change_logo":{const n=(X?.symbol||"").trim(),r=(X?.text||"").trim(),i=(o?.logo_symbol||"").trim(),l=(o?.logo_text||"").trim(),s=o?.logo_image_url||null,c=!!fe,f=c?"__pending__":X?.image_url||null;if(!(n!==i)&&!(r!==l)&&!(c||f!==s)){alert("No changes to propose. Edit the symbol, text, or image first.");return}break}}P=!0;try{if(!await vt(_)){alert(`This organisation already has ${ot} open votes. Wait for some to close before proposing new ones.`);return}if(ue==="change_logo"){const r=await Ue(h.id,O);if(!r.success){alert("Not enough cash. Logo change votes cost "+C(O)+".");return}h.party_funds=r.newFunds;let i=X?.image_url||null;if(fe){const l=fe.name.split(".").pop().toLowerCase(),s=`ipo-logos/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${l}`,{error:c}=await p.storage.from("public-assets").upload(s,fe,{upsert:!0});if(c){console.error("[IPO] Logo upload error:",c),alert("Failed to upload logo: "+c.message);return}const{data:f}=p.storage.from("public-assets").getPublicUrl(s);i=f?.publicUrl||null}a.proposed_logo={symbol:X?.symbol||"",text:X?.text||"",image_url:i}}const{error:n}=await p.from("ipo_votes").insert({org_id:_,title:e,vote_type:ue,meta:a,status:"open",opened_at_tick:k,closes_at_tick:k+Ze,proposed_by:h.id});if(n){console.error("[IPO Vote] Insert error:",n),alert("Failed to propose vote: "+n.message);return}await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`${h.faction_name} proposed a vote: ${e}`,tick_posted:k}),jo(),await ae(_)}catch(n){console.error("[IPO Vote] Submit exception:",n),alert("Failed to propose vote.")}finally{P=!1}}let Nt={};function _n(e,t){Nt[e]=t;const o=document.getElementById(`ipo-ballot-row-${e}`),a=document.getElementById(`ipo-ballot-confirm-${e}`),n=document.getElementById(`ipo-ballot-choice-${e}`);if(o&&(o.style.display="none"),a&&(a.style.display="flex"),n){const i=o?.querySelector(`[onclick*="'${t}'"]`)?.getAttribute("data-candidate-name");n.textContent=i||t.toUpperCase(),n.className=i?"ipo-vote-choice--candidate":`ipo-vote-choice--${t}`}}function yn(e){delete Nt[e];const t=document.getElementById(`ipo-ballot-row-${e}`),o=document.getElementById(`ipo-ballot-confirm-${e}`);t&&(t.style.display="flex"),o&&(o.style.display="none")}async function hn(e){const t=Nt[e];t&&(delete Nt[e],await Vo(e,t))}async function Vo(e,t){if(P||!h||!_)return;const o=B.find(i=>i.org.id===_);if(!o||o.role==="observer")return;const a=o.org,r=(a?.charter||{}).governance?.voteTransparency==="secret";P=!0;try{const i={vote_id:e,ballot:t,cast_at_tick:k};i.faction_id=h.id;const{error:l}=await p.from("ipo_ballots").insert(i);if(l){console.error("[IPO Ballot] Insert error:",l),l.code==="23505"?alert("You have already voted on this measure."):alert("Failed to cast ballot: "+l.message);return}const s=He.find(v=>v.id===e),c=s?.title||"a vote";let f;s?.vote_type==="leadership_election"&&t!=="abstain"?f=`for ${(s.meta&&s.meta.candidates||[]).find(d=>d.faction_id===t)?.faction_name||"a candidate"}`:f=t==="yes"?"YES":t==="no"?"NO":"ABSTAIN",r?await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`A member cast a ballot on "${c}".`,tick_posted:k}):await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`${h.faction_name} voted ${f} on "${c}".`,tick_posted:k});const u=s;if(u&&u.meta?.president_decides&&a.president_id===h.id&&(t==="yes"||t==="no")){const v=t==="yes";try{await p.from("ipo_votes").update({status:v?"passed":"failed",result:{yes:v?1:0,no:v?0:1,abstain:0,passed:v,president_approved:v},resolved_at_tick:k}).eq("id",e).eq("status","open"),v&&await Uo(u,a),await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:v?`The President has approved the admission of ${u.meta.target_faction_name||"a faction"}.`:`The President has denied the admission of ${u.meta.target_faction_name||"a faction"}.`,tick_posted:k})}catch(m){console.error("[IPO] President auto-resolve failed:",m)}}await ae(_)}catch(i){console.error("[IPO Ballot] Cast exception:",i),alert("Failed to cast ballot.")}finally{P=!1}}async function xn(e){if(P||!h||!_)return;const t=He.find($=>$.id===e);if(!t||t.status!=="open"||!confirm(`Resolve vote "${t.title}"? This will tally ballots and determine the outcome.`))return;const a=B.find($=>$.org.id===_)?.org,n=a?.charter||{},r=n.leadership||{},i=n.governance||{},l=r.votePass||"majority",s=Fe[e]||[],c=ie.length,f=t.vote_type==="leadership_election";let u,v;if(f){const{voteTally:$,abstainCount:E,winnerId:T,maxVotes:w}=Do(s,a.president_id);u={tally:$,winner:T,abstain:E,total_ballots:s.length},v="passed",P=!0;try{const{error:A,data:R}=await p.from("ipo_votes").update({status:v,result:u,resolved_at_tick:k}).eq("id",e).eq("status","open").select();if(A){console.error("[IPO Vote] Resolve error:",A),alert("Failed to resolve vote: "+A.message);return}if(!R||R.length===0){alert("Could not resolve vote. It may have already been resolved, or you may lack permission."),await ae(_);return}const{error:N}=await p.from("international_orgs").update({president_id:T,president_term_start_tick:k}).eq("id",a.id);N&&console.error("[IPO Vote] President update error (may be RLS):",N);const z=(t.meta&&t.meta.candidates||[]).find(q=>q.faction_id===T)?.faction_name||"Unknown";await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`Leadership Election Result: ${z} elected president with ${w} vote${w!==1?"s":""} (${s.length} total ballots).`,tick_posted:k}),await ae(_)}catch(A){console.error("[IPO Vote] Resolve exception:",A),alert("Failed to resolve vote.")}finally{P=!1}return}const m=s.filter($=>$.ballot==="yes").length,d=s.filter($=>$.ballot==="no").length,g=s.filter($=>$.ballot==="abstain").length,x=m+d+g;let I=!1;if(x===0?I=!1:l==="unanimous"?I=m===x&&d===0:I=m/x>.5,I&&i.vetoRight){const $=wn(a,i.vetoRight);if($){const E=s.find(T=>T.faction_id===$);E&&E.ballot==="no"&&(I=!1)}}t.vote_type==="expulsion"&&c>0&&n.membership?.expulsionClause==="unanimous"&&(I=m===c&&d===0),u={yes:m,no:d,abstain:g,passed:I},v=I?"passed":"failed",P=!0;try{const{error:$,data:E}=await p.from("ipo_votes").update({status:v,result:u,resolved_at_tick:k}).eq("id",e).eq("status","open").select();if($){console.error("[IPO Vote] Resolve error:",$),alert("Failed to resolve vote: "+$.message);return}if(!E||E.length===0){alert("Could not resolve vote. It may have already been resolved, or you may lack permission. Please refresh the page and try again."),await ae(_);return}if(I)try{await Uo(t,a)}catch(w){console.error("[IPO Vote] Effect application error:",w)}!I&&t.vote_type==="membership"&&t.meta?.invite_id&&await p.from("ipo_invitations").update({status:"declined",responded_at_tick:k}).eq("id",t.meta.invite_id);const T=I?"PASSED":"FAILED";await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`Vote "${t.title}" has ${T} (${m}Y / ${d}N / ${g}A).`,tick_posted:k}),await ae(_)}catch($){console.error("[IPO Vote] Resolve exception:",$),alert("Failed to resolve vote.")}finally{P=!1}}function wn(e,t){switch(t){case"president":return e.president_id;case"founding":return e.founding_party_id;case"hq":return e.headquarters_nation_id&&ie.find(a=>a.factions?.nation_id===e.headquarters_nation_id)?.faction_id||null;default:return null}}async function Uo(e,t){const o=e.meta||{};switch(e.vote_type){case"membership":{if(!o.target_faction_id)break;o.invite_id&&await p.from("ipo_invitations").update({status:"accepted",responded_at_tick:k}).eq("id",o.invite_id);const a=o.requested_role||"member";let n=[{id:o.target_faction_id,name:o.target_faction_name}];const r=[];for(const l of n){const s=await Lo(_),{data:c,error:f}=await p.from("ipo_members").insert({org_id:_,faction_id:l.id,role:a,joined_at_tick:k,chat_color:s}).select("id");f?(console.error(`[IPO] Failed to admit ${l.name}:`,f),r.push({name:l.name,reason:f.message})):(!c||c.length===0)&&(console.error(`[IPO] Admit ${l.name} returned 0 rows — RLS silently rejected the insert.`),r.push({name:l.name,reason:"permission denied"}))}if(r.length>0){const l=r.map(s=>`${s.name}: ${s.reason}`).join(`
`);alert(`Failed to admit:

${l}

No membership row was created. Check console for details.`);break}const i=`${o.target_faction_name||"A new party"} has been admitted as ${a==="observer"?"an observer":"a member"}.`;await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:i,tick_posted:k});break}case"expulsion":{if(o.target_faction_id&&(await p.from("ipo_members").update({is_active:!1,left_at_tick:k}).eq("org_id",_).eq("faction_id",o.target_faction_id).eq("is_active",!0),await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`${o.target_faction_name||"A member"} has been expelled from the organisation.`,tick_posted:k}),t.president_id===o.target_faction_id)){const a=ie.filter(n=>n.faction_id!==o.target_faction_id);if(a.length>0){const n=a[0].faction_id;await p.from("international_orgs").update({president_id:n,president_term_start_tick:k}).eq("id",_);const r=a[0].factions?.faction_name||"A member";await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`${r} is now president (previous president expelled).`,tick_posted:k})}}break}case"fund_draw":{if(o.amount_requested&&o.amount_requested>0&&e.proposed_by){const a=Number(t.solidarity_fund_balance)||0,n=Math.min(o.amount_requested,a);if(n<=0)break;const{error:r}=await p.rpc("ipo_debit_solidarity_fund",{p_org_id:_,p_amount:n});if(r){console.error("[IPO] Fund-draw debit failed:",r),alert("Failed to draw from fund: "+r.message);break}const{error:i}=await p.rpc("ipo_credit_party_funds",{p_target_faction_id:e.proposed_by,p_amount:n,p_org_id:_});i&&(console.error("[IPO] Fund-draw credit failed:",i),alert("Fund debited but proposer credit FAILED — contact an admin to reconcile. Error: "+i.message)),await p.from("ipo_fund_transactions").insert({org_id:_,faction_id:e.proposed_by,transaction_type:"draw",amount:-n,description:o.purpose||"Fund draw",tick:k}),await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`Fund draw approved: ${C(n)} withdrawn and credited. ${o.purpose?"Purpose: "+o.purpose:""}`,tick_posted:k})}break}case"change_headquarters":{o.proposed_nation_id&&await p.from("international_orgs").update({headquarters_nation_id:o.proposed_nation_id}).eq("id",_);break}case"joint_statement":{if(o.statement_text){const a=o.visibility==="private"?" (private)":"";if(await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`JOINT STATEMENT${a}: "${o.statement_text}"`,tick_posted:k}),await p.from("ipo_action_log").insert({org_id:_,faction_id:h.id,action_type:"joint_statement",action_data:{statement_text:o.statement_text,visibility:o.visibility||"public"},ap_cost:0,performed_at_tick:k}),o.visibility!=="private")try{const{data:n}=await p.from("ipo_members").select("nation_id").eq("org_id",_),r=[...new Set((n||[]).map(i=>i.nation_id).filter(Boolean))];for(const i of r)await p.from("event_log").insert({nation_id:i,event_name:"Joint Statement",description_chosen:`${t.name||"International Organisation"}: "${o.statement_text}"`,category:"DIPLOMATIC",fired_at_tick:k})}catch(n){console.warn("[IPO] Joint statement event_log failed (non-blocking):",n)}}break}case"charter_amendment":{const a=o.proposed_charter;if(a){const{error:i}=await p.from("international_orgs").update({charter:a}).eq("id",t.id);i&&console.error("[IPO] Charter amendment apply error:",i)}const n=o.proposed_logo;if(n){const i={};if(n.symbol!==void 0&&(i.logo_symbol=n.symbol),n.text!==void 0&&(i.logo_text=n.text),n.image_url!==void 0&&(i.logo_image_url=n.image_url),Object.keys(i).length>0){const{error:l}=await p.from("international_orgs").update(i).eq("id",t.id);l&&console.error("[IPO] Logo amendment apply error:",l)}}const r=[];a&&r.push("charter"),n&&r.push("logo"),await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`Amendment approved and applied (${r.join(", ")}): "${(o.description||"").substring(0,200)}".`,tick_posted:k}),await p.from("ipo_action_log").insert({org_id:_,faction_id:h.id,action_type:"charter_amendment",action_data:{description:o.description,proposed_charter:a,proposed_logo:n},ap_cost:1,performed_at_tick:k});break}case"change_logo":{const a=o.proposed_logo;if(a){const n={};if(a.symbol!==void 0&&(n.logo_symbol=a.symbol),a.text!==void 0&&(n.logo_text=a.text),a.image_url!==void 0&&(n.logo_image_url=a.image_url),Object.keys(n).length>0){const{error:r}=await p.from("international_orgs").update(n).eq("id",t.id);r&&console.error("[IPO] Logo change apply error:",r)}}await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:"Logo change approved and applied.",tick_posted:k}),await p.from("ipo_action_log").insert({org_id:_,faction_id:h.id,action_type:"change_logo",action_data:{proposed_logo:a},ap_cost:1,performed_at_tick:k});break}case"symposium":{const i={targetNation:o.target_nation_id,axis:o.axis||"economic",direction:o.direction||"left",ideologyShift:3,firesOnTick:k+4};await p.from("international_orgs").update({pending_symposium:i,symposium_cooldown_remaining:20}).eq("id",_),await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`Symposium approved! Targeting ${o.target_nation_name||"a nation"} (${o.axis} ${o.direction}). Effect fires in 4 ticks.`,tick_posted:k}),await p.from("ipo_action_log").insert({org_id:_,faction_id:h.id,action_type:"symposium",action_data:i,ap_cost:0,performed_at_tick:k});break}}}const O=5e4,Q={hold_rally:4*O,rally_all:7*O,back_channel:2*O,joint_statement:1*O,fund_draw:0};function C(e){return e=Number(e)||0,e>=1e6?"$"+(e/1e6).toFixed(1)+"M":e>=1e3?"$"+Math.round(e/1e3)+"k":"$"+e}async function Ue(e,t){const{data:o,error:a}=await p.from("factions").select("party_funds").eq("id",e).single();if(a||!o)return{success:!1,error:"Could not read funds"};const n=Number(o.party_funds)||0;if(n<t)return{success:!1,error:"Insufficient cash",currentFunds:n};const r=n-t,{error:i}=await p.from("factions").update({party_funds:r}).eq("id",e);return i?{success:!1,error:i.message}:{success:!0,newFunds:r}}const mt=[{id:"rousing",name:"Rousing Success",effect:"+6 to +8 momentum",min:6,max:8,weight:15,color:"#5cb85c",icon:"★"},{id:"solid",name:"Solid Turnout",effect:"+3 to +5 momentum",min:3,max:5,weight:35,color:"#5aafa5",icon:"●"},{id:"low",name:"Low Turnout",effect:"+1 to +2 momentum",min:1,max:2,weight:25,color:"#c8a64e",icon:"○"},{id:"gaffe",name:"Gaffe",effect:"-3 to -2 momentum",min:-3,max:-2,weight:12,color:"#d97a35",icon:"✕"},{id:"divisive",name:"Divisive Speech",effect:"+5 own / -2 others",min:5,max:7,weight:8,color:"#8b7ec8",icon:"◆"},{id:"counter",name:"Counter-Protest",effect:"-1 all",min:-1,max:-1,weight:5,color:"#d9534f",icon:"⚡"}],$n=.25;function Te(){const e=document.getElementById("ipo-actions-body");if(!e)return;const t=B.find(E=>E.org.id===_);if(!t){e.innerHTML='<span class="ipo-main-placeholder-text">Select an organisation.</span>';return}const o=t.org,a=o?.charter||{},n=o.president_id===h.id;if(t.role==="observer"){e.innerHTML='<div class="ipo-actions-empty">Observers cannot perform actions.</div>';return}const i=[],l=Number(h?.party_funds)||0;i.push({key:"hold_rally",label:"Hold Rally",desc:`Spend ${C(Q.hold_rally)} to rally support for another member party.`,cost:Q.hold_rally,icon:"📢",available:_e.filter(E=>E.faction_id!==h.id&&E.is_active).length>0&&l>=Q.hold_rally}),i.push({key:"rally_all",label:"Rally All Members",desc:"Coordinate rallies across all member nations.",cost:Q.rally_all,icon:"📣",available:n&&l>=Q.rally_all});const s=a.resources?.solidarityFund?.enabled,c=O;i.push({key:"back_channel",label:"Back-Channel Resources",desc:`Transfer cash to another member. Personal: ${C(Q.back_channel)} overhead, no risk. Fund: drawn from solidarity fund, 25% exposure.`,cost:Q.back_channel,icon:"🤝",available:l>=Q.back_channel+c});const f=a.resources?.jointStatementClause||"vote";i.push({key:"joint_statement",label:"Issue Joint Statement",desc:f==="president"?"Issue a statement on behalf of the org (president only).":"Issue a statement (requires a vote — use Votes panel).",cost:Q.joint_statement,icon:"📜",available:f==="president"&&n&&l>=Q.joint_statement});const u=Number(o.solidarity_fund_balance)||0;i.push({key:"fund_draw",label:"Draw from Fund",desc:s&&u>0?`Withdraw cash from fund (${C(u)} available). Requires vote — use Votes panel.`:s?"Fund is empty.":"Solidarity fund is not enabled.",cost:0,icon:"💰",available:!1});const v=a.governance?.actionLeadership||"unilateral",m=!!a.governance?.emergencyPowers,d=o.emergency_power_used_tick||0,g=o.president_term_start_tick||0,x=m&&n&&(d===0||d<g),I=new Set(["hold_rally","rally_all","back_channel"]);for(const E of i){if(!E.available||E.key==="fund_draw")continue;let T=!1,w="";I.has(E.key)||(v==="committee"?(T=!0,w="Charter requires a vote — use Votes panel"):v==="presidential"&&!n?(T=!0,w="Only the president can execute actions"):v==="delegated"&&!n?(T=!0,w="Only the president or officers can execute actions"):v==="tiered"&&E.cost>2*O&&(T=!0,w=`Costs >${C(2*O)} — charter requires a vote`)),T&&(E.available=!1,E.desc=`${E.desc} (${w})`,x&&(E._emergencyEligible=!0))}const $=i.map(E=>{const T=E._emergencyEligible?`<button class="ipo-action-exec-btn" style="background:rgba(217,83,79,0.15);border-color:rgba(217,83,79,0.3);color:#d9534f;" onclick="executeIPOAction('${E.key}', true)">⚡ EMERGENCY</button>`:"";return`<div class="ipo-action-card ${E.available?"":"ipo-action-card--disabled"}">
            <div class="ipo-action-card-top">
                <span class="ipo-action-icon">${E.icon}</span>
                <div class="ipo-action-info">
                    <span class="ipo-action-label">${E.label}</span>
                    <span class="ipo-action-desc">${E.desc}</span>
                </div>
            </div>
            <div class="ipo-action-card-bottom">
                ${E.cost>0?`<span class="ipo-action-cost">${C(E.cost)}</span>`:'<span class="ipo-action-cost">Free</span>'}
                ${E.available?`<button class="ipo-action-exec-btn" onclick="executeIPOAction('${E.key}')">Execute</button>`:T||'<button class="ipo-action-exec-btn" disabled>Unavailable</button>'}
            </div>
        </div>`}).join("");e.innerHTML=`
        <div class="ipo-actions-split">
            <div class="ipo-actions-cards">${$}</div>
            <div id="ipo-event-log" class="ipo-event-log"></div>
        </div>`,In(_)}const kn={hold_rally:"📢",rally_all:"📣",back_channel:"🤝",joint_statement:"📜",fund_draw:"💰"};async function In(e){const t=document.getElementById("ipo-event-log");if(!(!t||!e))try{const{data:o}=await p.from("ipo_action_log").select("action_type, faction_id, target_faction_id, action_data, ap_cost, performed_at_tick, factions:faction_id ( faction_name )").eq("org_id",e).order("performed_at_tick",{ascending:!1}).limit(8);if(!o||o.length===0){t.innerHTML='<div class="ipo-event-log-empty">No recent activity.</div>';return}t.innerHTML=`
            <div class="ipo-event-log-header">Recent Activity</div>
            ${o.map(a=>{const n=kn[a.action_type]||"●",r=a.factions?.faction_name||"Unknown",i=a.action_data||{};let l="";switch(a.action_type){case"hold_rally":{const s=i.momentum_change??i.approval_change??0;l=i.type==="expulsion"?`expelled ${i.target_name||"a member"}`:`held a rally: ${i.outcome_name||"?"} (${s>=0?"+":""}${s})`;break}case"rally_all":l=`rallied all members (${(i.results||[]).length} parties)`;break;case"back_channel":l=i.exposed?`EXPOSED: transferred ${i.amount||"?"} AP to ${i.target_name||"?"}`:"transferred resources";break;case"joint_statement":if(i.statement_text&&i.statement_text.length>80){const s=b(i.statement_text.substring(0,80)),c=b(i.statement_text);l=`issued a joint statement: <span class="ipo-statement-text"><span class="ipo-statement-preview">"${s}…"</span><span class="ipo-statement-full" style="display:none">"${c}"</span><button class="ipo-statement-toggle" onclick="this.parentElement.classList.toggle('expanded'); this.textContent = this.parentElement.classList.contains('expanded') ? 'Less' : 'More'">More</button></span>`}else i.statement_text?l=`issued a joint statement: "${b(i.statement_text)}"`:l="issued a joint statement";break;case"fund_draw":l=`withdrew ${i.amount?C(i.amount):"?"} from fund`;break;default:l=a.action_type}return`<div class="ipo-event-log-row">
                    <span class="ipo-event-log-icon">${n}</span>
                    <span class="ipo-event-log-text"><strong>${b(r)}</strong> ${l}</span>
                    <span class="ipo-event-log-tick">T${a.performed_at_tick}</span>
                </div>`}).join("")}`}catch(o){console.error("[IPO] Event log error:",o)}}async function En(e,t=!1){if(!(!h||!_)){if(t){if(!confirm(`⚡ INVOKE EMERGENCY POWERS?

This bypasses the charter's action leadership rules.
You can only use this once per presidential term.

Proceed?`))return;try{await p.from("international_orgs").update({emergency_power_used_tick:k}).eq("id",_),await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`⚡ ${h.faction_name} has invoked EMERGENCY POWERS to execute: ${e.replace(/_/g," ")}.`,tick_posted:k});try{const a=B.find(i=>i.org.id===_)?.org?.name||"An organisation",{data:n}=await p.from("ipo_members").select("nation_id").eq("org_id",_),r=[...new Set((n||[]).map(i=>i.nation_id).filter(Boolean))];for(const i of r)await p.from("event_log").insert({nation_id:i,event_name:"Emergency Powers Invoked",description_chosen:`${a}: ${h.faction_name} invoked emergency powers to ${e.replace(/_/g," ")}.`,category:"DIPLOMATIC",fired_at_tick:k})}catch{}}catch(o){alert("Failed to invoke emergency powers: "+(o.message||"Unknown error"));return}}switch(e){case"hold_rally":await An();break;case"rally_all":await Nn();break;case"back_channel":Tn();break;case"joint_statement":Pn();break;case"fund_draw":Ln();break}}}async function An(){if(P)return;const e=Q.hold_rally,t=_e.filter(n=>n.faction_id!==h.id&&n.is_active);if(t.length===0){alert("No other members in this organisation to rally for.");return}const o=t.map(n=>`<option value="${n.faction_id}">${b(n.factions?.faction_name||"Unknown")}</option>`).join(""),a=document.getElementById("ipo-create-modal-inner");document.getElementById("ipo-create-modal").classList.add("active"),a.innerHTML=`
        <div class="ipo-modal-header">
            <span class="ipo-modal-title">Hold Rally</span>
            <button class="modal-close" onclick="closeIPOActionModal()">&times;</button>
        </div>
        <div class="ipo-modal-body">
            <p class="ipo-action-desc" style="margin-bottom:12px;">
                Spend ${C(e)} to rally support for another member party. A dice roll determines the outcome.
            </p>
            <label class="ipo-vote-form-label">Rally for which party?</label>
            <select id="ipo-rally-target" class="ipo-vote-form-select">${o}</select>
            <div class="wizard-nav" style="margin-top:16px;">
                <button class="wizard-back-btn" onclick="closeIPOActionModal()">Cancel</button>
                <button class="ipo-btn ipo-btn--create-large" onclick="confirmHoldRally()">Hold Rally — ${C(e)}</button>
            </div>
        </div>`}async function Sn(){if(P)return;const e=Q.hold_rally,t=document.getElementById("ipo-rally-target")?.value;if(!t){alert("Select a party to rally for.");return}const a=_e.find(n=>n.faction_id===t)?.factions?.faction_name||"Unknown";P=!0;try{const n=await Ue(h.id,e);if(!n.success){alert(`Insufficient cash. You need ${C(e)}. ${n.currentFunds!==void 0?"You have "+C(n.currentFunds)+".":""}`);return}h.party_funds=n.newFunds;const r=Yo(),i=Go(r.min,r.max);if(i!==0)try{await p.rpc("adjust_momentum",{p_faction_id:t,p_delta:i,p_label:`IPO rally by ${h.faction_name} (${r.name})`,p_tick:k||0})}catch(s){console.error("[IPO Action] adjust_momentum failed:",s)}const l={target_faction_id:t,target_faction_name:a,outcome_id:r.id,outcome_name:r.name,momentum_change:i};await p.from("ipo_action_log").insert({org_id:_,faction_id:h.id,action_type:"hold_rally",action_data:l,ap_cost:e,performed_at_tick:k}),await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`${h.faction_name} rallied support for ${a}: ${r.name} (${i>=0?"+":""}${i} momentum).`,tick_posted:k}),Ce(),Te(),Bn("Hold Rally for "+a,r,i)}catch(n){console.error("[IPO Action] Hold rally error:",n),alert("Failed to execute rally.")}finally{P=!1}}async function Nn(){if(P)return;const e=Q.rally_all,t=ie.length;if(confirm(`Rally all ${t} member parties? This costs ${C(e)}. Each member gets an independent dice roll.`)){P=!0;try{const o=await Ue(h.id,e);if(!o.success){alert(`Insufficient cash. You need ${C(e)}.`);return}h.party_funds=o.newFunds;const a=ie.map(r=>{const i=Yo(),l=Go(i.min,i.max);return{faction_id:r.faction_id,nation_id:r.factions?.nation_id,faction_name:r.factions?.faction_name||"Unknown",outcome_id:i.id,outcome_name:i.name,momentum_change:l}});for(const r of a)if(r.momentum_change!==0)try{await p.rpc("adjust_momentum",{p_faction_id:r.faction_id,p_delta:r.momentum_change,p_label:`IPO rally-all by ${h.faction_name} (${r.outcome_name})`,p_tick:k||0})}catch(i){console.error("[IPO Action] adjust_momentum failed:",i)}await p.from("ipo_action_log").insert({org_id:_,faction_id:h.id,action_type:"rally_all",action_data:{results:a},ap_cost:e,performed_at_tick:k});const n=a.map(r=>`${r.faction_name}: ${r.outcome_name} (${r.momentum_change>=0?"+":""}${r.momentum_change})`).join(", ");await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`${h.faction_name} rallied all members! ${n}`,tick_posted:k}),Te(),Rn("Rally All Members",a)}catch(o){console.error("[IPO Action] Rally all error:",o),alert("Failed to execute coordinated rally.")}finally{P=!1}}}let qe=null,mo=1;function Tn(){const t=B.find(u=>u.org.id===_)?.org,o=t?.charter||{},a=o.resources?.resourceSharingCap,n=o.resources?.solidarityFund?.enabled,r=Number(t?.solidarity_fund_balance)||0;qe=null,mo=O;const i=_e.filter(u=>u.faction_id!==h.id&&u.is_active);if(i.length===0){alert("No other members to transfer to.");return}const l=i.map(u=>`<option value="${u.faction_id}">${b(u.factions?.faction_name||"Unknown")}</option>`).join(""),s=a?`<div class="ipo-vote-form-note">Resource sharing cap: ${a} transfers per term.</div>`:"",c=n&&r>0?'<option value="fund">Solidarity Fund (drawn from fund · 25% exposure risk)</option>':"",f=document.getElementById("ipo-create-modal-inner");document.getElementById("ipo-create-modal").classList.add("active"),f.innerHTML=`
        <div class="ipo-modal-header">
            <span class="ipo-modal-title">Back-Channel Resources</span>
            <button class="modal-close" onclick="closeIPOActionModal()">&times;</button>
        </div>
        <div class="ipo-modal-body">
            <div class="ipo-vote-form-note">Secretly transfer cash to another member.</div>
            ${s}
            <label class="ipo-vote-form-label">Funding Source</label>
            <select id="ipo-bc-source" class="ipo-vote-form-select">
                <option value="personal">Personal Cash (${C(Q.back_channel)} overhead · no exposure risk)</option>
                ${c}
            </select>
            <label class="ipo-vote-form-label">Recipient</label>
            <select id="ipo-bc-target" class="ipo-vote-form-select" onchange="backChannelTargetId=this.value">${l}</select>
            <label class="ipo-vote-form-label">Amount to transfer ($, in $50k increments)</label>
            <input type="number" id="ipo-bc-amount" class="ipo-vote-form-input" min="${O}" max="${20*O}" step="${O}" value="${O}" onchange="backChannelAmount=Number(this.value)" />
            <div class="wizard-nav" style="margin-top:16px;">
                <button class="wizard-back-btn" onclick="closeIPOActionModal()">Cancel</button>
                <button class="ipo-btn ipo-btn--create-large" onclick="executeBackChannel()">Transfer</button>
            </div>
        </div>`,qe=i[0].faction_id}async function Cn(){if(P)return;if(!qe){alert("Select a recipient.");return}const e=Number(document.getElementById("ipo-bc-amount")?.value)||mo;if(e<O){alert("Enter at least "+C(O)+".");return}const t=document.getElementById("ipo-bc-source")?.value||"personal",a=B.find(i=>i.org.id===_)?.org,n=a?.charter||{},r=n.resources?.resourceSharingCap;if(r){const{data:i}=await p.from("ipo_action_log").select("id").eq("org_id",_).eq("faction_id",h.id).eq("action_type","back_channel").gte("performed_at_tick",k-(n.leadership?.termYears||2)*12);if(i&&i.length>=r){alert(`You have reached the resource sharing cap (${r} per term).`);return}}P=!0;try{const l=ie.find(u=>u.faction_id===qe)?.factions?.faction_name||"Unknown";let s=!1,c=0;if(t==="fund"){const{error:u}=await p.rpc("ipo_debit_solidarity_fund",{p_org_id:_,p_amount:e});if(u){alert("Failed to draw from fund: "+u.message);return}c=0,s=Math.random()<$n}else{const u=Q.back_channel+e,v=await Ue(h.id,u);if(!v.success){alert(`Insufficient cash. You need ${C(u)} (${C(Q.back_channel)} overhead + ${C(e)} transfer).`);return}h.party_funds=v.newFunds,c=u,s=!1}const{error:f}=await p.rpc("ipo_credit_party_funds",{p_target_faction_id:qe,p_amount:e,p_org_id:_});if(f&&(console.error("[IPO] Back-channel credit failed:",f),alert("Transfer initiated but the recipient credit FAILED — please contact an admin to reconcile. Error: "+f.message)),await p.from("ipo_action_log").insert({org_id:_,faction_id:h.id,target_faction_id:qe,action_type:"back_channel",action_data:{amount:e,exposed:s,target_name:l,source:t},ap_cost:c,performed_at_tick:k}),s){await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`EXPOSED: ${h.faction_name} used solidarity funds to secretly transfer ${C(e)} to ${l}!`,tick_posted:k});try{const{data:u}=await p.from("ipo_members").select("nation_id").eq("org_id",_),v=[...new Set((u||[]).map(m=>m.nation_id).filter(Boolean))];for(const m of v)await p.from("event_log").insert({nation_id:m,event_name:"Back-Channel Scandal",description_chosen:`${a.name||"An organisation"}: ${h.faction_name} was caught secretly funneling ${C(e)} to ${l} from the solidarity fund!`,category:"DIPLOMATIC",fired_at_tick:k})}catch{}}else await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:"Resources were transferred within the organisation.",tick_posted:k});Ce(),Te(),alert(`Transferred ${C(e)} to ${l}.${s?" WARNING: The transfer was EXPOSED publicly!":" Transfer completed secretly."}`)}catch(i){console.error("[IPO Action] Back-channel error:",i),alert("Failed to transfer resources.")}finally{P=!1}}function Pn(){const e=document.getElementById("ipo-create-modal-inner");document.getElementById("ipo-create-modal").classList.add("active"),e.innerHTML=`
        <div class="ipo-modal-header">
            <span class="ipo-modal-title">Issue Joint Statement</span>
            <button class="modal-close" onclick="closeIPOActionModal()">&times;</button>
        </div>
        <div class="ipo-modal-body">
            <div class="ipo-vote-form-note">As president, issue a statement on behalf of the organisation. Costs ${C(Q.joint_statement)}.</div>
            <label class="ipo-vote-form-label">Statement Text</label>
            <textarea id="ipo-direct-stmt" class="ipo-vote-form-textarea" rows="4" maxlength="500" placeholder="Draft the statement..."></textarea>
            <div class="wizard-nav" style="margin-top:16px;">
                <button class="wizard-back-btn" onclick="closeIPOActionModal()">Cancel</button>
                <button class="ipo-btn ipo-btn--create-large" onclick="executeDirectStatement()">Publish</button>
            </div>
        </div>`}async function On(){if(P)return;const e=document.getElementById("ipo-direct-stmt")?.value?.trim();if(!e){alert("Please write the statement.");return}const t=Q.joint_statement;P=!0;try{const o=await Ue(h.id,t);if(!o.success){alert(`Insufficient cash. You need ${C(t)}.`);return}h.party_funds=o.newFunds,await p.from("ipo_action_log").insert({org_id:_,faction_id:h.id,action_type:"joint_statement",action_data:{statement_text:e,by_president:!0},ap_cost:t,performed_at_tick:k}),await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`JOINT STATEMENT (by president): "${e}"`,tick_posted:k});const n=B.find(r=>r.org.id===_)?.org?.name||"International Organisation";try{const{data:r}=await p.from("ipo_members").select("nation_id").eq("org_id",_),i=[...new Set((r||[]).map(l=>l.nation_id).filter(Boolean))];for(const l of i)await p.from("event_log").insert({nation_id:l,event_name:"Joint Statement",description_chosen:`${n}: "${e}"`,category:"DIPLOMATIC",fired_at_tick:k})}catch(r){console.warn("[IPO] Joint statement event_log insert failed (non-blocking):",r)}Ce(),Te(),alert("Statement published.")}catch(o){console.error("[IPO Action] Statement error:",o),alert("Failed to publish statement.")}finally{P=!1}}function Ln(){const e=B.find(a=>a.org.id===_),t=Number(e?.org?.solidarity_fund_balance)||0,o=document.getElementById("ipo-create-modal-inner");document.getElementById("ipo-create-modal").classList.add("active"),o.innerHTML=`
        <div class="ipo-modal-header">
            <span class="ipo-modal-title">Draw from Solidarity Fund</span>
            <button class="modal-close" onclick="closeIPOActionModal()">&times;</button>
        </div>
        <div class="ipo-modal-body">
            <div class="ipo-vote-form-note">As president, withdraw cash from the fund. Balance: ${C(t)}.</div>
            <label class="ipo-vote-form-label">Amount ($, in $50k increments)</label>
            <input type="number" id="ipo-direct-draw-amount" class="ipo-vote-form-input" min="${O}" max="${t}" step="${O}" value="${O}" />
            <label class="ipo-vote-form-label">Purpose</label>
            <input type="text" id="ipo-direct-draw-purpose" class="ipo-vote-form-input" maxlength="200" placeholder="Describe the purpose..." />
            <div class="wizard-nav" style="margin-top:16px;">
                <button class="wizard-back-btn" onclick="closeIPOActionModal()">Cancel</button>
                <button class="ipo-btn ipo-btn--create-large" onclick="executeDirectFundDraw()">Withdraw</button>
            </div>
        </div>`}async function Mn(){if(P)return;const e=parseInt(document.getElementById("ipo-direct-draw-amount")?.value),t=document.getElementById("ipo-direct-draw-purpose")?.value?.trim()||"";if(!e||e<O){alert("Enter at least "+C(O)+".");return}const o=B.find(n=>n.org.id===_),a=Number(o?.org?.solidarity_fund_balance)||0;if(e>a){alert("Amount exceeds fund balance.");return}P=!0;try{const n=a-e;await p.from("international_orgs").update({solidarity_fund_balance:n}).eq("id",_);const{data:r}=await p.from("factions").select("party_funds").eq("id",h.id).single();r&&await p.from("factions").update({party_funds:(Number(r.party_funds)||0)+e}).eq("id",h.id),await p.from("ipo_fund_transactions").insert({org_id:_,faction_id:h.id,transaction_type:"draw",amount:-e,description:t||"Presidential fund draw",tick:k}),await p.from("ipo_action_log").insert({org_id:_,faction_id:h.id,action_type:"fund_draw",action_data:{amount:e,purpose:t},ap_cost:0,performed_at_tick:k}),await p.from("ipo_chat").insert({org_id:_,faction_id:null,is_system:!0,message_text:`President ${h.faction_name} withdrew ${C(e)} from the solidarity fund. ${t?"Purpose: "+t:""}`,tick_posted:k}),Ce(),Te(),alert(`Withdrew ${C(e)} from the solidarity fund.`)}catch(n){console.error("[IPO Action] Fund draw error:",n),alert("Failed to withdraw from fund.")}finally{P=!1}}function Yo(){const e=mt.reduce((o,a)=>o+a.weight,0);let t=Math.random()*e;for(const o of mt)if(t-=o.weight,t<=0)return o;return mt[1]}function Go(e,t){return Math.floor(Math.random()*(t-e+1))+e}function Bn(e,t,o){const a=document.getElementById("ipo-create-modal-inner");document.getElementById("ipo-create-modal").classList.add("active"),a.innerHTML=`
        <div class="ipo-modal-header">
            <span class="ipo-modal-title">${e} — Result</span>
            <button class="modal-close" onclick="closeIPOActionModal()">&times;</button>
        </div>
        <div class="ipo-modal-body" style="text-align:center; padding:30px;">
            <div class="ipo-action-result-icon" style="color:${t.color}">${t.icon}</div>
            <div class="ipo-action-result-name" style="color:${t.color}">${t.name}</div>
            <div class="ipo-action-result-effect">${o>=0?"+":""}${o} Momentum</div>
            <div class="ipo-action-result-desc">${t.effect}</div>
            <button class="ipo-btn ipo-btn--create-large" style="margin-top:20px;" onclick="closeIPOActionModal()">OK</button>
        </div>`}function Rn(e,t){const o=document.getElementById("ipo-create-modal-inner");document.getElementById("ipo-create-modal").classList.add("active");const a=t.map(n=>{const r=mt.find(i=>i.id===n.outcome_id)||mt[1];return`
            <div class="ipo-action-multi-row">
                <span class="ipo-action-multi-icon" style="color:${r.color}">${r.icon}</span>
                <span class="ipo-action-multi-name">${b(n.faction_name)}</span>
                <span class="ipo-action-multi-outcome" style="color:${r.color}">${n.outcome_name}</span>
                <span class="ipo-action-multi-change">${n.momentum_change>=0?"+":""}${n.momentum_change}</span>
            </div>`}).join("");o.innerHTML=`
        <div class="ipo-modal-header">
            <span class="ipo-modal-title">${e} — Results</span>
            <button class="modal-close" onclick="closeIPOActionModal()">&times;</button>
        </div>
        <div class="ipo-modal-body">
            <div class="ipo-action-multi-results">${a}</div>
            <button class="ipo-btn ipo-btn--create-large" style="margin-top:16px;" onclick="closeIPOActionModal()">OK</button>
        </div>`}function Ce(){document.getElementById("ipo-create-modal").classList.remove("active"),qe=null,mo=1}let We=1,ve="",et="",Pe="◈",pe="",ge=null,ye=null,J=[];const Lt=[{key:"mission",label:"I — Mission Statement",required:!0,maxOne:!0},{key:"leadership",label:"II — Leadership",required:!1,maxOne:!0},{key:"membership",label:"III — Membership",required:!1,maxOne:!0},{key:"governance",label:"IV — Transparency & Governance",required:!1,maxOne:!0},{key:"resources",label:"V — Resources & External Relations",required:!1,maxOne:!0}],Fn=[{axis:"Individualism / Collectivism",poles:["Individualism","Collectivism"]},{axis:"Tradition / Progress",poles:["Tradition","Progress"]},{axis:"Liberty / Equality",poles:["Liberty","Equality"]},{axis:"Freedom / Security",poles:["Freedom","Security"]},{axis:"Globalism / Nationalism",poles:["Globalism","Nationalism"]}];function qn(){We=1,ve="",et="",Pe="◈",pe="",ge=null,ye=null,J=[{type:"mission",config:{text:""}}],document.getElementById("ipo-create-modal").classList.add("active"),Mt()}function Wo(){document.getElementById("ipo-create-modal").classList.remove("active"),ge=null,ye=null}function Mt(){const e=document.getElementById("ipo-create-modal-inner"),t=[1,2,3].map(a=>`<div class="wizard-step ${a===We?"active":a<We?"completed":""}">
            <span class="wizard-step-num">${a}</span> ${["Identity","Charter","Confirm"][a-1]}
        </div>`).join("");let o="";We===1?o=zn():We===2?o=Hn():o=ti(),e.innerHTML=`
        <div class="ipo-modal-header">
            <span class="ipo-modal-title">Create Organisation</span>
            <button class="modal-close" onclick="closeIPOCreationModal()">&times;</button>
        </div>
        <div class="wizard-steps">${t}</div>
        <div class="ipo-modal-body">${o}</div>`}function zn(){const e=La.map(t=>`<button class="ipo-symbol-btn ${t===Pe?"selected":""}"
            onclick="ipoSelectSymbol('${t}')">${t}</button>`).join("");return`
        <div class="trade-field">
            <label>Organisation Name</label>
            <input type="text" maxlength="40" value="${b(ve)}"
                oninput="ipoSetCreateName(this.value)"
                id="ipo-create-name" placeholder="e.g. Progressive Socialist International" />
        </div>
        <div class="trade-field">
            <label>Description</label>
            <textarea maxlength="200" rows="2"
                oninput="ipoSetCreateDesc(this.value)"
                style="width:100%;padding:4px 8px;font-size:0.78rem;background:var(--bg-3);border:1px solid var(--border-subtle);color:var(--text-primary);font-family:var(--font-sans);border-radius:3px;resize:vertical;"
                placeholder="Brief description of the organisation's purpose...">${b(et)}</textarea>
        </div>
        <div class="trade-field">
            <label>Logo Symbol</label>
            <div class="ipo-symbol-row">${e}</div>
        </div>
        <div class="trade-field">
            <label>Logo Text (max 4 characters)</label>
            <input type="text" maxlength="4" value="${b(pe)}"
                oninput="ipoSetCreateLogoText(this.value)"
                id="ipo-create-logo-text" placeholder="e.g. PSI"
                style="width:80px;text-transform:uppercase;" />
            <div id="ipo-create-logo-preview" style="margin-top:6px;font-family:var(--font-mono);font-size:10px;color:var(--ipo-accent);">
                Preview: ${Pe} ${b(pe)||"..."}
            </div>
        </div>
        <div class="trade-field">
            <label>Custom Logo Image <span style="color:var(--text-tertiary);font-weight:400">(optional · max 2 MB)</span></label>
            <div class="ipo-logo-upload-zone" id="ipo-logo-upload-zone" onclick="document.getElementById('ipo-logo-file-input').click()">
                ${ye?`<img src="${ye}" class="ipo-logo-upload-preview" alt="preview" />
                       <div style="font-size:9px;color:var(--text-tertiary);margin-top:4px;">Click to replace</div>`:`<div style="font-size:18px;color:var(--text-tertiary);">⬆</div>
                       <div style="font-size:10px;color:var(--text-tertiary);">Click to upload</div>
                       <div style="font-size:8px;color:var(--text-quaternary);margin-top:2px;">PNG · JPG · WebP</div>`}
            </div>
            <input type="file" accept="image/png,image/jpeg,image/webp" id="ipo-logo-file-input" style="display:none" onchange="ipoHandleLogoUpload(this)" />
            ${ge?'<button class="ipo-logo-remove-btn" onclick="ipoRemoveLogoUpload()" style="margin-top:4px;font-size:9px;color:#d9534f;background:none;border:1px solid #d9534f33;padding:2px 8px;border-radius:3px;cursor:pointer;">Remove Image</button>':""}
            <div id="ipo-logo-upload-error" style="display:none;color:#d9534f;font-size:9px;margin-top:4px;"></div>
        </div>
        <div class="wizard-nav">
            <button class="wizard-back-btn" onclick="closeIPOCreationModal()">Cancel</button>
            <button class="wizard-next-btn" id="ipo-step1-next"
                ${!ve.trim()||!pe.trim()?"disabled":""}
                onclick="ipoSetCreateStep(2)">Next</button>
        </div>`}function Dn(e){Pe=e,document.querySelectorAll(".ipo-symbol-btn").forEach(o=>{o.classList.toggle("selected",o.textContent.trim()===e)});const t=document.getElementById("ipo-create-logo-preview");t&&(t.innerHTML=`Preview: ${Pe} ${b(pe)||"..."}`)}function jn(e){const t=e.files[0],o=document.getElementById("ipo-logo-upload-error");if(!t)return;if(!["image/png","image/jpeg","image/webp"].includes(t.type)){o&&(o.textContent="Only PNG, JPG, or WebP images allowed.",o.style.display=""),e.value="";return}if(t.size>2*1024*1024){o&&(o.textContent="Image must be under 2 MB.",o.style.display=""),e.value="";return}o&&(o.style.display="none"),ge=t;const a=new FileReader;a.onload=function(n){ye=n.target.result;const r=document.getElementById("ipo-logo-upload-zone");if(r&&(r.innerHTML=`<img src="${ye}" class="ipo-logo-upload-preview" alt="preview" />
                <div style="font-size:9px;color:var(--text-tertiary);margin-top:4px;">Click to replace</div>`),!r?.parentElement?.querySelector(".ipo-logo-remove-btn")&&r?.parentElement){const l=document.createElement("button");l.className="ipo-logo-remove-btn",l.style.cssText="margin-top:4px;font-size:9px;color:#d9534f;background:none;border:1px solid #d9534f33;padding:2px 8px;border-radius:3px;cursor:pointer;",l.textContent="Remove Image",l.onclick=function(){Xo()},r.parentElement.insertBefore(l,r.nextSibling)}},a.readAsDataURL(t)}function Xo(){ge=null,ye=null;const e=document.getElementById("ipo-logo-upload-zone");e&&(e.innerHTML=`<div style="font-size:18px;color:var(--text-tertiary);">⬆</div>
            <div style="font-size:10px;color:var(--text-tertiary);">Click to upload</div>
            <div style="font-size:8px;color:var(--text-quaternary);margin-top:2px;">PNG · JPG · WebP</div>`);const t=document.querySelector(".ipo-logo-remove-btn");t&&t.remove();const o=document.getElementById("ipo-logo-file-input");o&&(o.value="");const a=document.getElementById("ipo-logo-upload-error");a&&(a.style.display="none")}function Hn(){const e=J.map((i,l)=>Qo(i,l)).join(""),t=new Set(J.map(i=>i.type)),o=Lt.filter(i=>!t.has(i.key)),n=J.length<5&&o.length>0?`
        <div class="ipo-add-article-row">
            <select id="ipo-add-article-select" style="font-size:0.75rem;padding:4px 8px;background:var(--bg-1);color:var(--text-primary);border:1px solid var(--border-hair);border-radius:3px;">
                <option value="">Add article...</option>
                ${o.map(i=>`<option value="${i.key}">${i.label}</option>`).join("")}
            </select>
            <button class="wizard-next-btn" style="font-size:8px;padding:3px 10px;"
                onclick="ipoAddArticle()">Add</button>
        </div>`:"",r=(4+Math.max(0,J.length-1))*O;return`
        <div class="ipo-charter-info">
            Articles: ${J.length}/5 · Cost: ${C(r)}
            <span style="color:#4a4840;margin-left:8px;">(${C(4*O)} base + ${C(O)} per extra article)</span>
        </div>
        <div class="ipo-article-list">${e}</div>
        ${n}
        <div class="wizard-nav">
            <button class="wizard-back-btn" onclick="ipoSetCreateStep(1)">Back</button>
            <button class="wizard-next-btn" id="ipo-step2-next"
                ${Vn()?"":"disabled"}
                onclick="ipoSetCreateStep(3)">Next</button>
        </div>`}function Vn(){const e=J.find(t=>t.type==="mission");return e&&(e.config.text||"").trim().length>0}function Un(){const e=document.getElementById("ipo-add-article-select");if(!e||!e.value)return;const t=e.value,o={leadership:{type:"rotation",termYears:2,votingWeight:"equal",votePass:"majority"},membership:{admission:"vote",ideologicalThreshold:{enabled:!1,directions:[]},expulsionClause:null},governance:{actionLeadership:"unilateral",voteTransparency:"public",observerStatus:!1,vetoRight:null,emergencyPowers:!1},resources:{solidarityFund:{enabled:!1,contributionPerQuarter:1},resourceSharingCap:null,jointStatementClause:"vote",headquarters:null}};at().push({type:t,config:o[t]||{}}),bt()}function Yn(e){const t=at();t[e]?.type!=="mission"&&(t.splice(e,1),bt())}function Qo(e,t){const a=Lt.find(l=>l.key===e.type)?.label||e.type,r=e.type!=="mission"?`<button class="ipo-article-remove" onclick="ipoRemoveArticle(${t})">&times;</button>`:"";let i="";switch(e.type){case"mission":i=Gn(e,t);break;case"leadership":i=Wn(e,t);break;case"membership":i=Xn(e,t);break;case"governance":i=Qn(e,t);break;case"resources":i=Jn(e,t);break}return`
        <div class="ipo-article-card">
            <div class="ipo-article-card-header">
                <span class="ipo-article-label">${a}</span>
                ${r}
            </div>
            <div class="ipo-article-card-body">${i}</div>
        </div>`}function Gn(e,t){return`
        <textarea maxlength="300" rows="3" placeholder="Describe the organisation's mission and purpose..."
            oninput="ipoActiveArticles()[${t}].config.text=this.value;var nb=document.getElementById('ipo-step2-next');if(nb)nb.disabled=!ipoValidateCharter()"
            style="width:100%;padding:4px 8px;font-size:10px;background:#141410;border:1px solid rgba(255,255,255,0.07);color:#e2d9b4;font-family:var(--font-sans);border-radius:2px;resize:vertical;"
        >${b(e.config.text||"")}</textarea>
        <div style="font-family:var(--font-mono);font-size:7px;color:#4a4840;margin-top:2px;">${(e.config.text||"").length}/300</div>`}function Wn(e,t){const o=e.config;return`
        ${be("Leadership Type",t,"type",[{value:"vote",label:"Vote",hint:"Members elect the president"},{value:"rotation",label:"Rotation",hint:"Presidency rotates in fixed order"},{value:"most_seats",label:"Most Seats",hint:"Party with most seats leads"},{value:"random",label:"Random",hint:"Randomly assigned each term"}],o.type)}
        ${no("Succession Term",t,"termYears",[1,2,3,4,5,6,7].map(a=>({value:a,label:a+" Year"+(a>1?"s":"")})),o.termYears)}
        ${be("Voting Weight",t,"votingWeight",[{value:"equal",label:"Equal",hint:"One vote per member"},{value:"seat_share",label:"By Seat Share",hint:"Weighted by parliament seats"}],o.votingWeight)}
        ${be("Vote Pass Threshold",t,"votePass",[{value:"majority",label:"Majority",hint:">50% of votes cast"},{value:"unanimous",label:"Unanimous",hint:"All members must vote yes"}],o.votePass)}`}function Xn(e,t){const o=e.config,a=o.ideologicalThreshold||{enabled:!1,directions:[]},n=a.directions||[],r=Fn.map(i=>{const l=i.poles.map(s=>{const c=n.includes(s.toLowerCase()),f=i.poles.find(v=>v!==s),u=n.includes(f.toLowerCase());return`<label class="ipo-ideology-check ${u?"ipo-disabled":""}" style="margin-right:12px;">
                <input type="checkbox" ${c?"checked":""} ${u?"disabled":""}
                    onchange="ipoToggleIdeology(${t},'${s.toLowerCase()}',this.checked)" />
                ${s}
            </label>`}).join("");return`<div class="ipo-ideology-axis"><span class="ipo-ideology-axis-name">${i.axis}</span>${l}</div>`}).join("");return`
        ${be("New Member Admission",t,"admission",[{value:"vote",label:"Vote Required",hint:"Majority vote among members"},{value:"president",label:"President Decides",hint:"President admits unilaterally"}],o.admission)}
        ${Ne("Ideological Threshold",t,"ideologicalThreshold.enabled",a.enabled)}
        ${a.enabled?`<div class="ipo-ideology-grid">${r}</div>`:""}
        ${Ne("Expulsion Clause",t,"expulsionClauseEnabled",!!o.expulsionClause)}
        ${o.expulsionClause?be("Expulsion Method",t,"expulsionClause",[{value:"president",label:"President Only",hint:""},{value:"majority",label:"Majority Vote",hint:""},{value:"unanimous",label:"Unanimous Vote",hint:""}],o.expulsionClause):""}`}function Qn(e,t){const o=e.config;return`
        ${be("Action Leadership",t,"actionLeadership",[{value:"unilateral",label:"Unilateral",hint:"Any member can execute actions with their own cash"},{value:"committee",label:"Committee",hint:"All actions require a vote. Funded from solidarity fund"},{value:"presidential",label:"Presidential",hint:"Only the president can execute actions"},{value:"delegated",label:"Delegated",hint:"President + designated officers can act. Others vote"},{value:"tiered",label:"Tiered",hint:`Actions ≤${C(2*O)} are unilateral. Higher cost requires a vote`}],o.actionLeadership||"unilateral")}
        ${be("Vote Transparency",t,"voteTransparency",[{value:"public",label:"Public Ballot",hint:"All see how everyone voted"},{value:"secret",label:"Secret Ballot",hint:"Only outcome revealed"}],o.voteTransparency)}
        ${Ne("Observer Status",t,"observerStatus",o.observerStatus)}
        ${Ne("Veto Right",t,"vetoRightEnabled",!!o.vetoRight)}
        ${o.vetoRight?be("Veto Holder",t,"vetoRight",[{value:"founding",label:"Founding Party",hint:""},{value:"president",label:"Current President",hint:""},{value:"hq",label:"HQ Nation Party",hint:""}],o.vetoRight):""}
        ${Ne("Emergency Powers",t,"emergencyPowers",o.emergencyPowers)}`}function Jn(e,t){const o=e.config,a=o.solidarityFund||{enabled:!1,contributionPerQuarter:1};return`
        ${Ne("Solidarity Fund",t,"solidarityFund.enabled",a.enabled)}
        ${a.enabled?no("Contribution Rate",t,"solidarityFund.contributionPerQuarter",[1,2,3].map(n=>({value:n,label:C(n*O)+" / Quarter"})),a.contributionPerQuarter):""}
        ${Ne("Resource Sharing Cap",t,"resourceSharingCapEnabled",o.resourceSharingCap!=null)}
        ${o.resourceSharingCap!=null?no("Max Uses Per Term",t,"resourceSharingCap",[1,2,3].map(n=>({value:n,label:n+" time"+(n>1?"s":"")})),o.resourceSharingCap||1):""}
        ${be("Joint Statement Clause",t,"jointStatementClause",[{value:"president",label:"President Alone",hint:""},{value:"vote",label:"Majority Vote Required",hint:""}],o.jointStatementClause)}
        ${Ne("Headquarters",t,"headquartersEnabled",o.headquarters!=null)}
        ${o.headquarters!=null?`<div class="trade-field" style="margin-top:4px;">
            <label>HQ Nation</label>
            <div class="trade-info-box info" style="font-size:8px;">Headquarters will be set to your nation on creation. Can be changed later by vote.</div>
        </div>`:""}`}function be(e,t,o,a,n){const r=a.map(i=>`<label class="trade-radio-option ${i.value===n?"selected":""}"
            onclick="ipoSetArticleField(${t},'${o}','${i.value}')">
            <input type="radio" name="ipo_${t}_${o}" value="${i.value}" ${i.value===n?"checked":""} />
            <div>
                <div class="trade-radio-label">${i.label}</div>
                ${i.hint?`<div class="trade-radio-hint">${i.hint}</div>`:""}
            </div>
        </label>`).join("");return`
        <div class="trade-field">
            <label>${e}</label>
            <div class="trade-radio-group" style="flex-wrap:wrap;gap:6px;">${r}</div>
        </div>`}function no(e,t,o,a,n){const r=a.map(i=>`<option value="${i.value}" ${i.value==n?"selected":""}>${i.label}</option>`).join("");return`
        <div class="trade-field">
            <label>${e}</label>
            <select onchange="ipoSetArticleField(${t},'${o}',this.value)"
                style="width:auto;font-size:0.75rem;padding:4px 8px;background:var(--bg-1);color:var(--text-primary);border:1px solid var(--border-hair);border-radius:3px;">
                ${r}
            </select>
        </div>`}function Ne(e,t,o,a){return`
        <div class="trade-field" style="display:flex;align-items:center;gap:8px;">
            <label style="margin-bottom:0;flex:1;">${e}</label>
            <button class="ipo-toggle-btn ${a?"is-on":""}"
                onclick="ipoToggleArticleField(${t},'${o}')">
                ${a?"ON":"OFF"}
            </button>
        </div>`}function at(){return W||J}function bt(){W?gt():Mt()}function Kn(e,t,o){const a=at()[e];if(!a)return;const n=t.split(".");let r=a.config;for(let l=0;l<n.length-1;l++)r[n[l]]||(r[n[l]]={}),r=r[n[l]];const i=Number(o);r[n[n.length-1]]=isNaN(i)?o:i,bt()}function Zn(e,t){const o=at()[e];if(o){if(t==="ideologicalThreshold.enabled")o.config.ideologicalThreshold||(o.config.ideologicalThreshold={enabled:!1,directions:[]}),o.config.ideologicalThreshold.enabled=!o.config.ideologicalThreshold.enabled;else if(t==="expulsionClauseEnabled")o.config.expulsionClause=o.config.expulsionClause?null:"majority";else if(t==="vetoRightEnabled")o.config.vetoRight=o.config.vetoRight?null:"president";else if(t==="resourceSharingCapEnabled")o.config.resourceSharingCap=o.config.resourceSharingCap!=null?null:2;else if(t==="headquartersEnabled")o.config.headquarters=o.config.headquarters!=null?null:"__self__";else if(t==="solidarityFund.enabled")o.config.solidarityFund||(o.config.solidarityFund={enabled:!1,contributionPerQuarter:1}),o.config.solidarityFund.enabled=!o.config.solidarityFund.enabled;else{const a=t.split(".");let n=o.config;for(let r=0;r<a.length-1;r++)n[a[r]]||(n[a[r]]={}),n=n[a[r]];n[a[a.length-1]]=!n[a[a.length-1]]}bt()}}function ei(e,t,o){const a=at()[e];if(!a)return;const n=a.config.ideologicalThreshold;n&&(o?n.directions.includes(t)||n.directions.push(t):n.directions=n.directions.filter(r=>r!==t),bt())}function ti(){const e=4*O,t=Math.max(0,J.length-1),o=t*O,a=e+o,n=J.map(r=>`<div class="ipo-confirm-article">
            <span class="ipo-confirm-article-label">${Lt.find(l=>l.key===r.type)?.label||r.type}</span>
            <span class="ipo-confirm-article-detail">${oi(r)}</span>
        </div>`).join("");return`
        <div class="ipo-confirm-preview">
            <div class="ipo-confirm-identity">
                ${ye?`<img src="${ye}" class="ipo-header-logo ipo-logo-img" alt="" />`:`<span class="ipo-header-logo">${b(Pe)} ${b(pe)}</span>`}
                <div>
                    <div style="font-family:var(--font-sans);font-size:13px;font-weight:700;color:#e2d9b4;">${b(ve)}</div>
                    ${et?`<div style="font-family:var(--font-sans);font-size:10px;color:#6b6a5e;margin-top:2px;">${b(et)}</div>`:""}
                </div>
            </div>
            <div class="ipo-confirm-articles">${n}</div>
            <div class="ipo-confirm-cost">
                <div class="ipo-confirm-cost-row">
                    <span>Base cost</span><span>${C(e)}</span>
                </div>
                ${t>0?`<div class="ipo-confirm-cost-row">
                    <span>Extra articles (${t})</span><span>${C(o)}</span>
                </div>`:""}
                <div class="ipo-confirm-cost-row ipo-confirm-cost-total">
                    <span>Total</span><span>${C(a)}</span>
                </div>
            </div>
        </div>
        <div class="wizard-nav">
            <button class="wizard-back-btn" onclick="ipoSetCreateStep(2)">Back</button>
            <button class="ipo-btn ipo-btn--create-large" onclick="submitIPOCreation()">
                Create Organisation — ${C(a)}
            </button>
        </div>`}function oi(e){const t=e.config;switch(e.type){case"mission":return b((t.text||"").substring(0,80))+((t.text||"").length>80?"...":"");case"leadership":return`${{rotation:"Rotation",most_seats:"Most Seats",random:"Random"}[t.type]||t.type} · ${t.termYears}yr · ${t.votingWeight==="equal"?"Equal":"Seat Share"} · ${t.votePass==="unanimous"?"Unanimous":"Majority"}`;case"membership":{const o=[t.admission==="vote"?"Vote admission":"President admits"];return t.ideologicalThreshold?.enabled&&t.ideologicalThreshold.directions?.length&&o.push("Ideology: "+t.ideologicalThreshold.directions.join(", ")),t.expulsionClause&&o.push("Expulsion: "+t.expulsionClause),o.join(" · ")}case"governance":{const o=[t.voteTransparency==="public"?"Public ballot":"Secret ballot"];return t.observerStatus&&o.push("Observers"),t.vetoRight&&o.push("Veto: "+t.vetoRight),t.emergencyPowers&&o.push("Emergency powers"),o.join(" · ")}case"resources":{const o=[];return t.solidarityFund?.enabled&&o.push("Fund: "+C((Number(t.solidarityFund.contributionPerQuarter)||1)*O)+"/qtr"),t.resourceSharingCap!=null&&o.push("Cap: "+t.resourceSharingCap+"/term"),o.push("Statements: "+(t.jointStatementClause==="president"?"President":"Vote")),t.headquarters!=null&&o.push("HQ enabled"),o.join(" · ")}default:return""}}async function ai(){if(!h||!$e||P)return;P=!0;const e=(4+Math.max(0,J.length-1))*O,t={};for(const o of J)switch(o.type){case"mission":t.mission=o.config.text||"";break;case"leadership":t.leadership={type:o.config.type,termYears:Number(o.config.termYears),votingWeight:o.config.votingWeight,votePass:o.config.votePass};break;case"membership":t.membership={admission:o.config.admission,ideologicalThreshold:o.config.ideologicalThreshold||{enabled:!1,directions:[]},expulsionClause:o.config.expulsionClause||null};break;case"governance":t.governance={voteTransparency:o.config.voteTransparency,observerStatus:!!o.config.observerStatus,vetoRight:o.config.vetoRight||null,emergencyPowers:!!o.config.emergencyPowers};break;case"resources":t.resources={solidarityFund:o.config.solidarityFund||{enabled:!1,contributionPerQuarter:1},resourceSharingCap:o.config.resourceSharingCap??null,jointStatementClause:o.config.jointStatementClause||"vote",headquarters:o.config.headquarters==="__self__"?$e.id:o.config.headquarters||null};break}t.leadership||(t.leadership={type:"rotation",termYears:2,votingWeight:"equal",votePass:"majority"}),t.membership||(t.membership={admission:"vote",ideologicalThreshold:{enabled:!1,directions:[]},expulsionClause:null}),t.governance||(t.governance={voteTransparency:"public",observerStatus:!1,vetoRight:null,emergencyPowers:!1}),t.resources||(t.resources={solidarityFund:{enabled:!1,contributionPerQuarter:1},resourceSharingCap:null,jointStatementClause:"vote",headquarters:null});try{let o=null;if(ge){const d=ge.name.split(".").pop()||"png",g=`ipo-logos/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${d}`,{error:x}=await p.storage.from("public-assets").upload(g,ge,{contentType:ge.type,upsert:!0});if(x){console.error("[IPO] Logo upload failed:",x.message),alert("Logo upload failed: "+x.message);return}const{data:I}=p.storage.from("public-assets").getPublicUrl(g);o=I?.publicUrl||null}const a=await Ue(h.id,e);if(!a.success){alert("Insufficient cash. You need "+C(e)+" to create this organisation.");return}h.party_funds=a.newFunds;const{data:n,error:r}=await p.from("international_orgs").insert({name:ve.trim(),description:et.trim()||null,logo_symbol:Pe,logo_text:pe.trim().toUpperCase(),logo_image_url:o,founded_at_tick:k,founding_party_id:h.id,president_id:h.id,president_term_start_tick:k,headquarters_nation_id:t.resources.headquarters,solidarity_fund_balance:0,charter:t}).select("id").single();if(r){console.error("[IPO] Create org error:",r);const{data:d}=await p.from("factions").select("party_funds").eq("id",h.id).single(),g=(Number(d?.party_funds)||0)+e,{error:x}=await p.from("factions").update({party_funds:g}).eq("id",h.id);x&&console.error("[IPO] Refund failed (manual reconciliation may be needed):",x),h.party_funds=g,alert("Failed to create organisation: "+r.message);return}const i=Zt[0],{error:l}=await p.from("ipo_members").insert({org_id:n.id,faction_id:h.id,role:"member",joined_at_tick:k,chat_color:i});l&&console.error("[IPO] Failed to add founding member:",l.message),await p.from("ipo_chat").insert({org_id:n.id,faction_id:null,is_system:!0,message_text:`${b(ve.trim())} has been founded by ${h.faction_name}.`,tick_posted:k});const s=ve.trim(),c=$e.name||"their nation";let f=c;if(t.resources.headquarters&&t.resources.headquarters!==$e.id)try{const{data:d}=await p.from("nations").select("name").eq("id",t.resources.headquarters).maybeSingle();d?.name&&(f=d.name)}catch{}const u=`${h.faction_name} founds ${s}`,v=`The ${h.faction_name} of ${c} has created the ${s}, headquartered in ${f}.`,m={org_name:s,party:h.faction_name,founder_nation:c,hq_nation:f};await p.from("event_log").insert({nation_id:$e.id,event_name:u,description_chosen:v,trigger_key:"ipo_founded",category:"political",effects_applied:m,fired_at_tick:k}),t.resources.headquarters&&t.resources.headquarters!==$e.id&&await p.from("event_log").insert({nation_id:t.resources.headquarters,event_name:u,description_chosen:v,trigger_key:"ipo_founded",category:"political",effects_applied:m,fired_at_tick:k}),Wo(),_=n.id,re()}catch(o){console.error("[IPO] Creation error:",o),alert("Failed to create organisation.")}finally{P=!1}}window.selectIPOOrg=en;window.acceptIPOInvite=tn;window.declineIPOInvite=on;window.openIPOCreationModal=qn;window.closeIPOCreationModal=Wo;window.sendIPOChat=Ga;window.openIPOInviteModal=Wa;window.openIPOAmendModal=nn;window.leaveIPOOrg=Za;window.ipoSelectSymbol=Dn;window.ipoAddArticle=Un;window.ipoRemoveArticle=Yn;window.ipoSetArticleField=Kn;window.ipoToggleArticleField=Zn;window.ipoToggleIdeology=ei;window.ipoActiveArticles=at;window.submitIPOCreation=ai;window.renderIPOCreateStep=Mt;window.ipoHandleLogoUpload=jn;window.ipoRemoveLogoUpload=Xo;function Jo(){const e=document.getElementById("ipo-step1-next");if(!e)return;const t=ve.trim()&&pe.trim();e.disabled=!t;const o=document.getElementById("ipo-create-logo-preview");o&&(o.innerHTML=`Preview: ${Pe} ${b(pe)||"..."}`)}window.ipoSetCreateName=function(e){ve=e,Jo()};window.ipoSetCreateDesc=function(e){et=e};window.ipoSetCreateLogoText=function(e){pe=e.toUpperCase(),Jo()};window.ipoSetCreateStep=function(e){We=e,Mt()};window.closeIPOAmendModal=zo;window.ipoAmendAddArticle=ln;window.ipoAmendHandleLogoFile=rn;window.ipoAmendRemoveLogo=sn;window.ipoVoteHandleLogoFile=fn;window.ipoVoteRemoveLogo=gn;window.ipoVoteSetLogoSymbol=function(e){X&&(X.symbol=e)};window.ipoVoteSetLogoText=function(e){X&&(X.text=e)};window.submitIPOAmend=cn;window.openIPOVoteModal=un;window.closeIPOVoteModal=jo;window.renderIPOVoteModalTypeSelect=Ho;window.selectIPOVoteType=vn;window.submitIPOVote=bn;window.selectIPOBallot=_n;window.cancelIPOBallot=yn;window.confirmIPOBallot=hn;window.castIPOBallot=Vo;window.resolveIPOVote=xn;window.executeIPOAction=En;window.executeBackChannel=Cn;window.executeDirectStatement=On;window.executeDirectFundDraw=Mn;window.closeIPOActionModal=Ce;window.confirmHoldRally=Sn;window.selectIPOInviteTarget=Xa;window.submitIPOInvite=Qa;window.previewIPOInviteOrg=ja;window.previewExistingOrg=qo;window.requestToJoinOrg=Ha;window.openIPOExpelModal=Ja;window.submitIPOExpel=Ka;let y=null,ze=null;async function ni(e){const t=F?.faction,o=F?.nation;if(!t||!o)return{canChat:!1,role:null,displayName:null};const{data:a}=await p.from("ministries").select("minister_first_name, minister_last_name").eq("nation_id",o.id).eq("ministry_key","trade").eq("party_id",t.id).eq("is_active",!0).maybeSingle();if(a)return{canChat:!0,role:"trade_minister",displayName:(((a.minister_first_name||"")+" "+(a.minister_last_name||"")).trim()||"Minister")+" (Minister of Trade)"};const n=await aa(p,o.id);let r=!1;return oa(o)?r=n?.lead_party_id===t.id:r=(n?.ministry_allocations||{}).prime_minister===t.id,r?{canChat:!0,role:"prime_minister",displayName:(((o.head_of_state_first_name||"")+" "+(o.head_of_state_last_name||"")).trim()||"PM")+" (PM)"}:{canChat:!1,role:null,displayName:null}}let $t=!1;async function ii(e){if(!$t){y&&Rt(),$t=!0;try{const t=F?.nation;if(!t){alert("Nation data not loaded.");return}const o=(K||[]).find(g=>g.id===e);if(!o){alert("Partner nation not found.");return}const a=t.id<e?t.id:e,n=t.id<e?e:t.id;let{data:r,error:i}=await p.from("trade_negotiations").select("id, status, draft_articles, approved_by_a, approved_by_b, nation_a_id, nation_b_id, agreement_type, agreement_name").eq("nation_a_id",a).eq("nation_b_id",n).in("status",["open","active","ratification"]).order("created_at",{ascending:!1}).limit(1).maybeSingle();if(i){alert("Failed to load negotiations: "+i.message);return}if(!r){const{data:g}=await p.from("shard").select("current_tick").eq("name","Alpha Shard").single(),x=g?.current_tick||0,{data:I,error:$}=await p.from("trade_negotiations").insert({nation_a_id:a,nation_b_id:n,status:"open",agreement_type:"fta",agreement_name:t.name+"-"+o.name+" Trade Agreement",opened_at_tick:x,expires_at_tick:x+48}).select("id, status, draft_articles, approved_by_a, approved_by_b, nation_a_id, nation_b_id, agreement_type, agreement_name").single();if($){alert("Failed to start negotiation: "+$.message);return}r=I;const E="Trade Minister of "+t.name+" has begun trade negotiations with the nation of "+o.name+".";p.from("event_log").insert([t.id,e].map(T=>({nation_id:T,event_name:"Trade Negotiations Opened",trigger_key:"trade_negotiation_opened",category:"trade",description_chosen:E,fired_at_tick:x}))).then(()=>{})}const l=await ni(e),s=t.flag_url||`assets/flags/${t.name}.png`,c=o.flag_url||`assets/flags/${o.name}.png`,f=r.nation_a_id===t.id;At[r.id]&&delete At[r.id],p.rpc("mark_trade_negotiation_seen",{p_neg_id:r.id}).then(({error:g})=>{g&&console.warn("[trade-neg] mark_seen failed:",g.message)}),y={negotiationId:r.id,myNationId:t.id,partnerNationId:e,myNationName:t.name,partnerNationName:o.name,myFlag:s,partnerFlag:c,status:r.status,chatRole:l,articles:r.draft_articles||[],weAreA:f,agreementType:r.agreement_type,agreementName:r.agreement_name,approvedByA:r.approved_by_a,approvedByB:r.approved_by_b};const u=document.getElementById("trade-neg-header");u.innerHTML=`
        <div class="trade-neg-header__nations">
            <div class="trade-neg-header__nation">
                <img src="${b(s)}" alt="" class="trade-neg-header__flag" onerror="this.style.display='none'">
                <span class="trade-neg-header__name">${b(t.name)}</span>
            </div>
            <div class="trade-neg-header__title" id="trade-neg-title-text">${b(r.agreement_name||t.name+"-"+o.name+" Trade Agreement")}</div>
            <div class="trade-neg-header__nation">
                <span class="trade-neg-header__name">${b(o.name)}</span>
                <img src="${b(c)}" alt="" class="trade-neg-header__flag" onerror="this.style.display='none'">
            </div>
        </div>
        <span class="trade-neg-header__close" onclick="closeTradeNegModal()">&times;</span>
    `,document.getElementById("trade-neg-modal").classList.add("active");const v=document.getElementById("trade-neg-chat-input-bar"),m=document.getElementById("trade-neg-chat-messages");if(l.canChat){v.style.display="flex",v.innerHTML=`
            <input type="text" id="trade-neg-chat-input" placeholder="Chatting as ${b(l.displayName)}..." maxlength="2000">
            <button id="trade-neg-chat-send" disabled>Send</button>
        `;const g=document.getElementById("trade-neg-chat-input"),x=document.getElementById("trade-neg-chat-send");g.addEventListener("input",()=>{x.disabled=!g.value.trim()}),g.addEventListener("keydown",I=>{I.key==="Enter"&&!I.shiftKey&&g.value.trim()&&(I.preventDefault(),$o())}),x.addEventListener("click",()=>$o())}else v.style.display="none";_t(),li(),vo();const d=document.getElementById("trade-neg-name-btn");d&&y.agreementName&&y.agreementName.trim()&&(d.style.borderColor="var(--green)",d.style.color="var(--green)",d.textContent="Rename Agreement"),await ri(r.id),si(r.id)}catch(t){alert("Trade negotiation error: "+(t.message||t))}finally{$t=!1}}}function uo(e){const t=F?.faction?.id;if(e.is_system)return`<div class="trade-neg-msg trade-neg-msg--system">${b(e.message_text)}</div>`;const o=e.sender_faction_id===t,a=o?"trade-neg-msg trade-neg-msg--sent":"trade-neg-msg trade-neg-msg--received",n=o?"":`<div class="trade-neg-msg__sender">${b(e.sender_display_name)}</div>`,r=e.created_at?new Date(e.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"";return`<div class="${a}">
        ${n}
        <div>${b(e.message_text)}</div>
        <div class="trade-neg-msg__time">${r}</div>
    </div>`}async function ri(e){const t=document.getElementById("trade-neg-chat-messages");if(!t)return;const{data:o,error:a}=await p.from("negotiation_messages").select("*").eq("negotiation_id",e).order("created_at",{ascending:!0}).limit(200);if(a){t.innerHTML='<div style="padding:20px;text-align:center;color:#c55;font-family:var(--font-mono);font-size:10px;">Failed to load messages.</div>';return}if(!o||o.length===0){const n=y?.chatRole?.canChat;y?.partnerNationName,t.innerHTML=n?'<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">No messages yet. Start the conversation.</div>':`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px;padding:20px;">
                <div style="color:var(--text-dim);font-family:var(--font-mono);font-size:10px;text-align:center;">No messages yet.</div>
                <div style="color:var(--text-ghost);font-family:var(--font-mono);font-size:9px;text-align:center;line-height:1.5;max-width:220px;">
                    You need to hold the position of PM or Minister of Trade to participate in this chat.
                </div>
            </div>`;return}t.innerHTML=o.map(n=>uo(n)).join(""),t.scrollTop=t.scrollHeight}let kt=!1;async function $o(){if(kt||!y?.chatRole?.canChat)return;const e=document.getElementById("trade-neg-chat-input"),t=document.getElementById("trade-neg-chat-send");if(!e)return;const o=e.value.trim();if(!o)return;kt=!0,t&&(t.disabled=!0),e.value="";const{data:a}=await p.from("shard").select("current_tick").eq("name","Alpha Shard").single(),n=a?.current_tick||0,r={negotiation_id:y.negotiationId,sender_nation_id:y.myNationId,sender_faction_id:F.faction.id,sender_role:y.chatRole.role,sender_display_name:y.chatRole.displayName,message_text:o,is_system:!1,sent_at_tick:n},{error:i}=await p.from("negotiation_messages").insert(r);if(i)e.value=o,alert("Failed to send: "+i.message);else{const l=document.getElementById("trade-neg-chat-messages");if(l){const s=l.querySelector('[style*="justify-content:center"]');s&&!l.querySelector(".trade-neg-msg")&&s.remove(),l.insertAdjacentHTML("beforeend",uo({...r,created_at:new Date().toISOString()})),l.scrollTop=l.scrollHeight}}kt=!1,t&&(t.disabled=!e.value.trim()),e.focus()}function si(e){ze&&(p.removeChannel(ze),ze=null),ze=p.channel("neg-chat-"+e).on("postgres_changes",{event:"INSERT",schema:"public",table:"negotiation_messages",filter:`negotiation_id=eq.${e}`},t=>{const o=t.new;if(!o||o.sender_faction_id===F?.faction?.id)return;const a=document.getElementById("trade-neg-chat-messages");if(!a)return;const n=a.querySelector('[style*="justify-content:center"]');n&&!a.querySelector(".trade-neg-msg")&&n.remove(),a.insertAdjacentHTML("beforeend",uo(o)),a.scrollTop=a.scrollHeight,o.is_system&&o.message_text?.includes("withdrawn")&&(y&&(y.status="cancelled"),setTimeout(()=>{Rt(),alert("The other party has withdrawn from negotiations."),Pt().then(()=>{Ve(),Ae()}).catch(()=>{})},500))}).subscribe()}function li(){if(!y)return;const e=y.partnerNationId,t=document.getElementById("trade-neg-my-econ");t&&(t.innerHTML=ci());const o=document.getElementById("trade-neg-their-econ");o&&(o.innerHTML=di(e))}function ci(){const e=Oo(),t=Et(F?.nation).map(r=>({...r,tradingDelta:Number(e[r.key])||0})).sort((r,i)=>{const l=Math.abs(r.prod-r.dem+r.tradingDelta);return Math.abs(i.prod-i.dem+i.tradingDelta)-l}),o=r=>Math.round(Number(r)||0).toString(),a=r=>Math.abs(r)<.5?"—":(r>0?"+":"-")+Math.abs(Math.round(r));let n=`<div class="trade-neg-econ__head">
        <span class="trade-neg-econ__head-dot"></span>Your Economy
    </div>
    <div class="trade-neg-econ__cols">
        <span>Commodity</span><span>Prod</span><span>Dem</span><span>Bal</span>
    </div>
    <div class="trade-neg-econ__list">`;if(t.length===0)n+='<div class="trade-neg-econ__empty">No flow data yet.</div>';else for(const r of t){const i=r.prod-r.dem+r.tradingDelta,l=i>.5?"trade-neg-econ__bal--pos":i<-.5?"trade-neg-econ__bal--neg":"trade-neg-econ__bal--neu";n+=`<div class="trade-neg-econ__row">
                <div class="trade-neg-econ__name">
                    <span class="trade-neg-econ__glyph">${r.icon}</span>
                    <span>${b(r.name)}</span>
                </div>
                <span class="trade-neg-econ__num">${o(r.prod)}</span>
                <span class="trade-neg-econ__num">${o(r.dem)}</span>
                <span class="trade-neg-econ__bal ${l}">${a(i)}</span>
            </div>`}return n+="</div>",n}function di(e){const t=(K||[]).find(f=>f.id===e),o=Et(t),a=Et(F?.nation),n=new Set(a.filter(f=>f.dem-f.prod>.5).map(f=>f.key)),r=new Set(a.filter(f=>f.prod-f.dem>.5).map(f=>f.key)),i=[],l=[];for(const f of o){const u=f.prod-f.dem,v={key:f.key,name:f.name,icon:f.icon,amount:Math.abs(u)};u>.5?i.push(v):u<-.5&&l.push(v)}i.sort((f,u)=>u.amount-f.amount),l.sort((f,u)=>u.amount-f.amount);const s=f=>Math.round(Number(f)||0).toString(),c=(f,u,v,m)=>{let d=`<div class="trade-neg-econ__section">
            <div class="trade-neg-econ__head ${u}">
                <span class="trade-neg-econ__head-dot"></span>${f}
            </div>
            <div class="trade-neg-econ__list">`;if(v.length===0)d+='<div class="trade-neg-econ__empty">No data</div>';else for(const g of v){const x=m.has(g.key);d+=`<div class="trade-neg-econ__row--simple ${x?"trade-neg-econ__row--match":""}">
                    <div class="trade-neg-econ__name">
                        <span class="trade-neg-econ__glyph">${g.icon}</span>
                        <span>${b(g.name)}${x?'<span class="trade-neg-econ__match">match</span>':""}</span>
                    </div>
                    <span class="trade-neg-econ__val">${s(g.amount)}</span>
                </div>`}return d+="</div></div>",d};return c("They Can Offer","trade-neg-econ__head--offer",i,n)+c("They Need","trade-neg-econ__head--need",l,r)}function _t(){const e=document.getElementById("trade-neg-articles");if(!e||!y)return;const t=y.articles||[],o=y.myNationId,a=y.status==="ratification"||!!y.approvedByA&&!!y.approvedByB;if(t.length===0){e.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;min-height:200px;color:var(--text-dim);font-family:var(--font-mono);font-size:11px;">No articles yet. Click "Add Text Article" to begin drafting.</div>';return}const n=["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"];let r="";for(let i=0;i<t.length;i++){const l=t[i],s=n[i]||i+1,c=l.author_nation_id===o,f=!!l.strike_requested_by,u=l.strike_requested_by===o,v=l.article_type?Ko(l):b(l.text),m=l.article_type?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;padding:1px 5px;color:var(--accent);background:rgba(90,175,165,0.08);border:1px solid rgba(90,175,165,0.15);margin-left:6px;vertical-align:middle;">${b(l.article_type.replace("_"," ").toUpperCase())}</span>`:"";let d="";if(l.article_type==="trade_flow"&&l.data){const g=l.data,x=l.author_nation_id?l.author_nation_id===y.myNationId:!0,I=x?y.myNationId:y.partnerNationId,$=x?y.partnerNationId:y.myNationId,E=x?y.myNationName:y.partnerNationName,T=x?y.partnerNationName:y.myNationName,w=g.direction==="a_buys_b"?I:$,A=g.direction==="a_buys_b"?E:T;if(w===y.myNationId&&ce[g.commodity]){const N=ce[g.commodity],S=Number(N.import_demand||0),M=Number(N.import_volume||0),z=Math.max(0,S-M);d=`<div style="font-family:var(--font-mono);font-size:9px;color:${Number(g.volume||0)>z?"var(--amber)":"var(--green)"};margin-top:4px;">
                    ${b(A)}'s remaining demand: ${io(z)}/tick
                    ${z>0?"(after domestic production and existing trade)":"(fully supplied)"}
                </div>`}}if(r+=`<div class="trade-neg-article">
            <div class="trade-neg-article__num">Article ${s}.${m}</div>
            <div class="trade-neg-article__text">${v}</div>
            ${d}
            <div class="trade-neg-article__meta">
                <span>Added by ${b(l.author_nation_name||"Unknown")}</span>
                ${a?"":c?`<span class="trade-neg-article__action" onclick="negArticleDelete('${l.id}')">Delete</span>`:f&&u?'<span style="font-family:var(--font-mono);font-size:8px;color:var(--amber);opacity:0.7;">Strike Requested</span>':f?"":`<span class="trade-neg-article__action" style="color:var(--amber);border-color:rgba(184,134,11,0.2);background:rgba(184,134,11,0.04);" onclick="negArticleRequestStrike('${l.id}')">Request to Strike</span>`}
            </div>`,f&&!u){const g=l.strike_requested_by_name||"The other party";r+=`<div class="trade-neg-article__strike">${b(g)} is requesting this article be removed.</div>`}r+="</div>"}e.innerHTML=r}function fo(){const e=document.getElementById("trade-neg-add-article-form");e&&requestAnimationFrame(()=>{try{e.scrollIntoView({behavior:"smooth",block:"start"})}catch{}})}function pi(){if(y?.approvedByA&&y?.approvedByB)return;const e=document.getElementById("trade-neg-add-article-form");if(!e||!y)return;const t=y.agreementName||"";e.style.display="block",e.innerHTML=`<div class="trade-neg-add-form">
        <div class="trade-neg-add-form__label">Name This Agreement</div>
        <input id="neg-name-input" type="text" maxlength="120" value="${b(t)}" placeholder="e.g. Melizea-Hajjara Fuel & Dairy Accord" style="
            width:100%;padding:8px 10px;background:var(--bg-1);border:1px solid var(--border-main);
            color:var(--text-bright);font-family:var(--font-sans);font-size:13px;outline:none;box-sizing:border-box;
        ">
        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:3px;">120 characters max. Required before both parties can agree.</div>
        <div class="trade-neg-add-form__actions">
            <button onclick="negArticleCancelForm()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);border:1px solid var(--border-main);background:transparent;cursor:pointer;">Cancel</button>
            <button onclick="negNameAgreementSave()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#000;background:var(--amber,#b8860b);border:none;cursor:pointer;">Save Name</button>
        </div>
    </div>`,document.getElementById("neg-name-input")?.focus(),fo()}let lt=!1;async function mi(){if(lt||!y)return;const t=(document.getElementById("neg-name-input")?.value||"").trim();if(!t){alert("Enter a name for the agreement.");return}lt=!0;const{error:o}=await p.from("trade_negotiations").update({agreement_name:t}).eq("id",y.negotiationId);if(o){alert("Failed to save name: "+o.message),lt=!1;return}y.agreementName=t;const a=document.getElementById("trade-neg-title-text");a&&(a.textContent=t);const n=document.getElementById("trade-neg-name-btn");n&&(n.style.borderColor="var(--green)",n.style.color="var(--green)",n.textContent="Rename Agreement"),tt(),lt=!1}window.negNameAgreementOpen=pi;window.negNameAgreementSave=mi;function Ko(e){const t=e.data||{},o=e.author_nation_id?e.author_nation_id===y?.myNationId:!0,a=o?y?.myNationName||"Nation A":y?.partnerNationName||"Nation A",n=o?y?.partnerNationName||"Nation B":y?.myNationName||"Nation B",r=i=>ia[i]?.label||Tt[i]||i||"Unknown";switch(e.article_type){case"transfer":{const i=t.direction==="a_to_b"?a+" → "+n:n+" → "+a,l=t.transfer_type==="recurring"?"Recurring":"One-Time",s=t.transfer_type==="recurring"?" per tick":"";return`${l} Transfer: $${io(t.amount)} ${i}${s}`}case"trade_flow":{const i=t.direction==="a_buys_b"?a+" buys from "+n:n+" buys from "+a,l=t.duration===0?"Continuous":t.duration+" ticks",s=t.delivery_priority?` · Delivery: ${t.delivery_priority.charAt(0).toUpperCase()+t.delivery_priority.slice(1)}`:"",c=Math.round(Number(t.volume)||0).toLocaleString();return`${r(t.commodity)}: ${i}, ${c} units/tick. Duration: ${l}${s}`}case"tariff_reduction":{const i=r(t.sector),l=t.mode==="reciprocal"?"Reciprocal":"One-sided";return`${i} Tariff Reduction (${l}): ${a}→${n} ${t.a_tariff_from||"?"}% → ${t.a_tariff_to||"?"}%, ${n}→${a} ${t.b_tariff_from||"?"}% → ${t.b_tariff_to||"?"}%`}case"market_access":{const i=t.scope==="all_goods"?"All Goods":r(t.scope_sector),l={restricted:"Restricted",preferential:"Preferential (reduced tariffs)",free_trade:"Free Trade (0%)"},s=[];return t.volume_priority&&s.push("Volume priority"),t.price_priority&&s.push("Price priority"),`Market Access — ${i}: ${l[t.level]||t.level}${s.length?". "+s.join(", "):""}`}case"exit_terms":{const i=[];i.push("Min duration: "+(t.min_duration||0)+" ticks"),i.push("Exit notice: "+(t.exit_notice||0)+" ticks");const l={none:"No penalty",fixed:"Fixed $"+io(t.penalty_amount||0),percentage:(t.penalty_pct||0)+"% of remaining value"};return i.push(l[t.penalty_type]||"No penalty"),`Exit Terms: ${i.join(", ")}`}default:return e.text||"Unknown article type"}}function io(e){const t=Number(e)||0;return t>=1e9?(t/1e9).toFixed(1)+"B":t>=1e6?(t/1e6).toFixed(1)+"M":t>=1e3?(t/1e3).toFixed(0)+"k":t.toLocaleString()}const ui=[{key:"transfer",label:"TRANSFER",desc:"One-time or recurring financial transfer between nations."},{key:"trade_flow",label:"TRADE FLOW",desc:"Establish a commodity trade route with volume and price terms."},{key:"tariff_reduction",label:"TARIFF REDUCTION",desc:"Reduce tariffs on a specific sector for one or both nations."},{key:"market_access",label:"MARKET ACCESS",desc:"Grant preferential or free trade access to sectors or all goods."},{key:"exit_terms",label:"EXIT TERMS",desc:"Define minimum duration, exit notice period, and withdrawal penalties."}];let le=null;function fi(){if(y?.approvedByA&&y?.approvedByB)return;le=null;const e=document.getElementById("trade-neg-add-article-form");if(!e)return;e.style.display="block";let t='<div class="trade-neg-add-form">';t+='<div class="trade-neg-add-form__label">Select Article Type</div>';for(const o of ui)t+=`<div onclick="negStructuredArticleSelectType('${o.key}')" style="
            padding:10px 12px;margin-bottom:4px;cursor:pointer;
            border:1px solid var(--border-main);
            background:var(--bg-1);
            transition:all 0.1s;
        " onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='var(--border-main)'">
            <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--accent);letter-spacing:0.5px;">${o.label}</div>
            <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">${o.desc}</div>
        </div>`;t+='<div class="trade-neg-add-form__actions">',t+='<button onclick="negArticleCancelForm()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);border:1px solid var(--border-main);background:transparent;cursor:pointer;">Cancel</button>',t+="</div></div>",e.innerHTML=t,fo()}function gi(e){switch(le=e,e){case"transfer":return vi();case"trade_flow":return bi();case"tariff_reduction":return yi();case"market_access":return hi();case"exit_terms":return xi()}}function vi(){const e=document.getElementById("trade-neg-add-article-form");if(!e)return;const t=y?.myNationName||"Nation A",o=y?.partnerNationName||"Nation B";e.innerHTML=`<div class="trade-neg-add-form">
        <div class="trade-neg-add-form__label">Transfer</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">TYPE</div>
                <select id="neg-transfer-type" style="width:100%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;">
                    <option value="one_time">One-Time</option>
                    <option value="recurring">Recurring (Per Tick)</option>
                </select>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">AMOUNT ($)</div>
                <input id="neg-transfer-amount" type="number" min="1" placeholder="e.g. 20" style="width:100%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;box-sizing:border-box;">
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">DIRECTION</div>
                <select id="neg-transfer-direction" style="width:100%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;">
                    <option value="a_to_b">${b(t)} → ${b(o)}</option>
                    <option value="b_to_a">${b(o)} → ${b(t)}</option>
                </select>
            </div>
        </div>
        <div class="trade-neg-add-form__actions">
            <button onclick="negArticleCancelForm()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);border:1px solid var(--border-main);background:transparent;cursor:pointer;">Cancel</button>
            <button onclick="negStructuredArticleConfirm()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#000;background:var(--accent,#5aafa5);border:none;cursor:pointer;">Confirm</button>
        </div>
    </div>`}function bi(){const e=document.getElementById("trade-neg-add-article-form");if(!e)return;const t=y?.myNationName||"Nation A",o=y?.partnerNationName||"Nation B",a=[{value:"energy",label:"⚡ Energy"},{value:"minerals",label:"⛏ Minerals"},{value:"food",label:"🌾 Food"},{value:"consumer_goods",label:"📦 Consumer Goods"},{value:"luxury_goods",label:"💎 Luxury Goods"}].map(n=>`<option value="${n.value}">${n.label}</option>`).join("");e.innerHTML=`<div class="trade-neg-add-form">
        <div class="trade-neg-add-form__label">Trade Flow</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">COMMODITY</div>
                <select id="neg-flow-commodity" onchange="negFlowEvaluateWarnings()" style="width:100%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;">
                    ${a}
                </select>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">DIRECTION</div>
                <select id="neg-flow-direction" onchange="negFlowEvaluateWarnings();negFlowSyncPriorityLock()" style="width:100%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;">
                    <option value="a_buys_b">${b(t)} buys from ${b(o)}</option>
                    <option value="b_buys_a">${b(o)} buys from ${b(t)}</option>
                </select>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">VOLUME (UNITS PER TICK)</div>
                <input id="neg-flow-volume" type="number" min="1" placeholder="e.g. 20" oninput="negFlowEvaluateWarnings()" style="width:100%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;box-sizing:border-box;">
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">DURATION</div>
                <select id="neg-flow-duration" style="width:100%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;">
                    <option value="0">Continuous</option>
                    <option value="12">12 ticks</option>
                    <option value="24">24 ticks</option>
                    <option value="36">36 ticks</option>
                    <option value="48">48 ticks</option>
                </select>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">DELIVERY PREFERENCE <span style="color:var(--accent);">(BUYER)</span></div>
                <div id="neg-flow-delivery-picker" style="display:flex;gap:0;border:1px solid var(--border-main);">
                    <button type="button" data-priority="fastest"  onclick="negFlowSetPriority('fastest')"  style="flex:1;padding:8px 6px;background:transparent;border:none;border-right:1px solid var(--border-main);color:var(--text-dim);font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.4px;cursor:pointer;transition:all 0.1s;">⚡ FASTEST</button>
                    <button type="button" data-priority="safest"   onclick="negFlowSetPriority('safest')"   style="flex:1;padding:8px 6px;background:transparent;border:none;border-right:1px solid var(--border-main);color:var(--text-dim);font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.4px;cursor:pointer;transition:all 0.1s;">🛡 SAFEST</button>
                    <button type="button" data-priority="cheapest" onclick="negFlowSetPriority('cheapest')" style="flex:1;padding:8px 6px;background:transparent;border:none;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.4px;cursor:pointer;transition:all 0.1s;">💰 CHEAPEST</button>
                </div>
                <div id="neg-flow-priority-note" style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:3px;">After ratification, every shipping corp can offer a route. The system auto-awards based on this preference (cheapest is also the universal tiebreaker).</div>
            </div>
            <div style="font-family:var(--font-mono);font-size:9px;line-height:1.5;padding:6px 8px;background:rgba(90,175,165,0.06);border-left:2px solid var(--accent,#5aafa5);color:var(--text-secondary);">
                ◊ Resources will need a shipping agreement for resources to actually transfer.
            </div>
            <div id="neg-flow-warnings" style="display:none;font-family:var(--font-mono);font-size:9px;line-height:1.5;padding:6px 8px;background:rgba(200,150,50,0.08);border-left:2px solid var(--amber,#b8860b);color:var(--text-secondary);"></div>
        </div>
        <div class="trade-neg-add-form__actions">
            <button onclick="negArticleCancelForm()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);border:1px solid var(--border-main);background:transparent;cursor:pointer;">Cancel</button>
            <button onclick="negStructuredArticleConfirm()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#000;background:var(--accent,#5aafa5);border:none;cursor:pointer;">Confirm</button>
        </div>
    </div>`,setTimeout(()=>{go("cheapest"),Zo()},0),_i().then(()=>ea())}function Zo(){const e=document.getElementById("neg-flow-direction"),t=document.getElementById("neg-flow-delivery-picker"),o=document.getElementById("neg-flow-priority-note");if(!e||!t)return;const n=(e.value||"a_buys_b")==="a_buys_b";n||go("cheapest"),t.style.opacity=n?"1":"0.45",t.style.pointerEvents=n?"auto":"none",o&&(o.textContent=n?"After ratification, every shipping corp can offer a route. The system auto-awards based on this preference (cheapest is also the universal tiebreaker).":"Locked — only the buyer chooses delivery preference (they pay the freight). Defaults to cheapest.")}window.negFlowSyncPriorityLock=Zo;let ro="cheapest";function go(e){if(!["fastest","safest","cheapest"].includes(e))return;ro=e;const t=document.getElementById("neg-flow-delivery-picker");if(t)for(const o of t.querySelectorAll("button[data-priority]")){const a=o.dataset.priority===e;o.style.background=a?"var(--accent,#5aafa5)":"transparent",o.style.color=a?"#000":"var(--text-dim)"}}window.negFlowSetPriority=go;async function _i(){if(!y||y._capacityFlows)return;const e=y.myNationId,t=y.partnerNationId;!e||!t||(y._capacityFlows={[e]:{},[t]:{}})}function ea(){const e=document.getElementById("neg-flow-warnings");if(!e)return;const t=y?._capacityFlows;if(!t){e.style.display="none";return}const o=document.getElementById("neg-flow-commodity")?.value||"",a=document.getElementById("neg-flow-direction")?.value||"a_buys_b",n=Number(document.getElementById("neg-flow-volume")?.value)||0;if(!o||n<=0){e.style.display="none";return}const r=y.myNationId,i=y.partnerNationId,l=a==="a_buys_b"?r:i,s=a==="a_buys_b"?i:r,c=(l===r?y.myNationName:y.partnerNationName)||"Buyer",f=(s===r?y.myNationName:y.partnerNationName)||"Seller",u=t[l]?.[o],v=t[s]?.[o],m=g=>g>=1e9?"$"+(g/1e9).toFixed(1)+"B":g>=1e6?"$"+(g/1e6).toFixed(0)+"M":"$"+Math.round(g).toLocaleString(),d=[];if(v){const g=v.export_capacity;if(n>g){const x=n-g;d.push(`<strong>${b(f)}</strong> has ${m(g)}/tick organic export capacity for this commodity — short by ${m(x)}/tick. The contract will still fire (the engine treats the gap as off-the-books supply / re-export), but expect lower fulfillment if the seller's capacity drops further.`)}}if(u){const g=u.import_demand;g===0&&n>0?d.push(`<strong>${b(c)}</strong> has no organic demand for this commodity (already net-exporter or self-sufficient). The contract creates the demand — ${b(c)} will pay for ${m(n)}/tick they don't currently need.`):n>g*5&&g>0&&d.push(`<strong>${b(c)}</strong>'s organic demand for this commodity is only ${m(g)}/tick — your contract is ${(n/g).toFixed(1)}× that. The contract will fire but the buyer is committing to far more than their natural usage.`)}if(d.length===0){e.style.display="none";return}e.innerHTML=d.map(g=>"⚠ "+g).join("<br><br>"),e.style.display="block"}window.negFlowEvaluateWarnings=ea;function yi(){const e=document.getElementById("trade-neg-add-article-form");if(!e)return;const t=y?.myNationName||"Nation A",o=y?.partnerNationName||"Nation B",a=ko.map(n=>`<option value="${n.key}">${b(n.label)}</option>`).join("");e.innerHTML=`<div class="trade-neg-add-form">
        <div class="trade-neg-add-form__label">Tariff Reduction</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">SECTOR</div>
                <select id="neg-tariff-sector" style="width:100%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;">
                    ${a}
                </select>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">${b(t)} TARIFF → ${b(o)}</div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <input id="neg-tariff-a-from" type="number" min="0" max="100" placeholder="From %" style="width:48%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;box-sizing:border-box;">
                    <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">→</span>
                    <input id="neg-tariff-a-to" type="number" min="0" max="100" placeholder="To %" style="width:48%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;box-sizing:border-box;">
                </div>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">${b(o)} TARIFF → ${b(t)}</div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <input id="neg-tariff-b-from" type="number" min="0" max="100" placeholder="From %" style="width:48%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;box-sizing:border-box;">
                    <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">→</span>
                    <input id="neg-tariff-b-to" type="number" min="0" max="100" placeholder="To %" style="width:48%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;box-sizing:border-box;">
                </div>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">MODE</div>
                <select id="neg-tariff-mode" style="width:100%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;">
                    <option value="reciprocal">Reciprocal</option>
                    <option value="one_sided">One-sided</option>
                </select>
            </div>
        </div>
        <div class="trade-neg-add-form__actions">
            <button onclick="negArticleCancelForm()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);border:1px solid var(--border-main);background:transparent;cursor:pointer;">Cancel</button>
            <button onclick="negStructuredArticleConfirm()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#000;background:var(--accent,#5aafa5);border:none;cursor:pointer;">Confirm</button>
        </div>
    </div>`}function hi(){const e=document.getElementById("trade-neg-add-article-form");if(!e)return;const t=ko.map(o=>`<option value="${o.key}">${b(o.label)}</option>`).join("");e.innerHTML=`<div class="trade-neg-add-form">
        <div class="trade-neg-add-form__label">Market Access</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">SCOPE</div>
                <select id="neg-market-scope" onchange="document.getElementById('neg-market-sector-row').style.display=this.value==='sector'?'block':'none'" style="width:100%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;">
                    <option value="all_goods">All Goods</option>
                    <option value="sector">Specific Sector</option>
                </select>
            </div>
            <div id="neg-market-sector-row" style="display:none;">
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">SECTOR</div>
                <select id="neg-market-sector" style="width:100%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;">
                    ${t}
                </select>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">ACCESS LEVEL</div>
                <select id="neg-market-level" style="width:100%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;">
                    <option value="restricted">Restricted</option>
                    <option value="preferential">Preferential (Reduced Tariffs)</option>
                    <option value="free_trade">Free Trade (0%)</option>
                </select>
            </div>
            <div style="display:flex;gap:16px;">
                <label style="display:flex;align-items:center;gap:4px;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);cursor:pointer;">
                    <input type="checkbox" id="neg-market-volume-priority"> Volume Priority
                </label>
                <label style="display:flex;align-items:center;gap:4px;font-family:var(--font-mono);font-size:10px;color:var(--text-dim);cursor:pointer;">
                    <input type="checkbox" id="neg-market-price-priority"> Price Priority
                </label>
            </div>
        </div>
        <div class="trade-neg-add-form__actions">
            <button onclick="negArticleCancelForm()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);border:1px solid var(--border-main);background:transparent;cursor:pointer;">Cancel</button>
            <button onclick="negStructuredArticleConfirm()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#000;background:var(--accent,#5aafa5);border:none;cursor:pointer;">Confirm</button>
        </div>
    </div>`}function xi(){const e=document.getElementById("trade-neg-add-article-form");e&&(e.innerHTML=`<div class="trade-neg-add-form">
        <div class="trade-neg-add-form__label">Exit Terms</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">MINIMUM DURATION (TICKS)</div>
                <input id="neg-exit-min-duration" type="number" min="0" max="100" value="12" style="width:100%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;box-sizing:border-box;">
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">EXIT NOTICE (TICKS)</div>
                <input id="neg-exit-notice" type="number" min="0" max="24" value="3" style="width:100%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;box-sizing:border-box;">
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">PENALTY</div>
                <select id="neg-exit-penalty-type" onchange="
                    document.getElementById('neg-exit-penalty-fixed-row').style.display=this.value==='fixed'?'block':'none';
                    document.getElementById('neg-exit-penalty-pct-row').style.display=this.value==='percentage'?'block':'none';
                " style="width:100%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;">
                    <option value="none">None</option>
                    <option value="fixed">Fixed Amount ($)</option>
                    <option value="percentage">% of Remaining Value</option>
                </select>
            </div>
            <div id="neg-exit-penalty-fixed-row" style="display:none;">
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">PENALTY AMOUNT ($)</div>
                <input id="neg-exit-penalty-amount" type="number" min="0" placeholder="e.g. 10000000" style="width:100%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;box-sizing:border-box;">
            </div>
            <div id="neg-exit-penalty-pct-row" style="display:none;">
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">PENALTY (%)</div>
                <input id="neg-exit-penalty-pct" type="number" min="0" max="100" placeholder="e.g. 15" style="width:100%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;box-sizing:border-box;">
            </div>
        </div>
        <div class="trade-neg-add-form__actions">
            <button onclick="negArticleCancelForm()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);border:1px solid var(--border-main);background:transparent;cursor:pointer;">Cancel</button>
            <button onclick="negStructuredArticleConfirm()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#000;background:var(--accent,#5aafa5);border:none;cursor:pointer;">Confirm</button>
        </div>
    </div>`)}let Le=!1;async function wi(){if(Le||!y||!le)return;let e={};if(le==="transfer"){const c=Number(document.getElementById("neg-transfer-amount")?.value||0);if(c<=0){alert("Enter a valid amount.");return}e={transfer_type:document.getElementById("neg-transfer-type")?.value||"one_time",amount:c,direction:document.getElementById("neg-transfer-direction")?.value||"a_to_b"}}else if(le==="trade_flow"){const c=Number(document.getElementById("neg-flow-volume")?.value||0);if(c<=0){alert("Enter a valid volume.");return}const f=document.getElementById("neg-flow-direction")?.value||"a_buys_b",u=f==="a_buys_b",v=["fastest","safest","cheapest"].includes(ro)?ro:"cheapest",m=u?v:"cheapest";e={commodity:document.getElementById("neg-flow-commodity")?.value||"fuel_energy",direction:f,volume:c,duration:Number(document.getElementById("neg-flow-duration")?.value||0),delivery_priority:m}}else if(le==="tariff_reduction"){const c=Number(document.getElementById("neg-tariff-a-from")?.value),f=Number(document.getElementById("neg-tariff-a-to")?.value),u=Number(document.getElementById("neg-tariff-b-from")?.value),v=Number(document.getElementById("neg-tariff-b-to")?.value);if(isNaN(c)||isNaN(f)||isNaN(u)||isNaN(v)){alert("Fill in all tariff values.");return}e={sector:document.getElementById("neg-tariff-sector")?.value||"fuel_energy",a_tariff_from:c,a_tariff_to:f,b_tariff_from:u,b_tariff_to:v,mode:document.getElementById("neg-tariff-mode")?.value||"reciprocal"}}else if(le==="market_access"){const c=document.getElementById("neg-market-scope")?.value||"all_goods";e={scope:c,scope_sector:c==="sector"?document.getElementById("neg-market-sector")?.value||"fuel_energy":null,level:document.getElementById("neg-market-level")?.value||"preferential",volume_priority:document.getElementById("neg-market-volume-priority")?.checked||!1,price_priority:document.getElementById("neg-market-price-priority")?.checked||!1}}else if(le==="exit_terms"){const c=document.getElementById("neg-exit-penalty-type")?.value||"none";e={min_duration:Number(document.getElementById("neg-exit-min-duration")?.value||12),exit_notice:Number(document.getElementById("neg-exit-notice")?.value||3),penalty_type:c,penalty_amount:c==="fixed"?Number(document.getElementById("neg-exit-penalty-amount")?.value||0):0,penalty_pct:c==="percentage"?Number(document.getElementById("neg-exit-penalty-pct")?.value||0):0}}if(Le=!0,(await Bt(y.negotiationId)).locked){alert("This agreement is locked — both parties have approved and ratification is in motion. Articles cannot be added."),Le=!1,tt();return}const o={id:crypto.randomUUID(),article_type:le,data:e,author_nation_id:y.myNationId,author_nation_name:y.myNationName,added_at_tick:0,strike_requested_by:null,strike_requested_by_name:null},{data:a}=await p.from("shard").select("current_tick").eq("name","Alpha Shard").single();o.added_at_tick=a?.current_tick||0;const{data:n,error:r}=await p.from("trade_negotiations").select("draft_articles, agreement_type").eq("id",y.negotiationId).single();if(r||!n){alert("Failed to load articles."),Le=!1;return}const l=[...n.draft_articles||[],o],{error:s}=await p.from("trade_negotiations").update({draft_articles:l,agreement_type:Ot(l,n.agreement_type)}).eq("id",y.negotiationId);if(s){alert("Failed to add article: "+s.message),Le=!1;return}y.articles=l,tt(),_t(),Le=!1}window.negStructuredArticleOpen=fi;window.negStructuredArticleSelectType=gi;window.negStructuredArticleConfirm=wi;function $i(){if(y?.approvedByA&&y?.approvedByB)return;const e=document.getElementById("trade-neg-add-article-form");if(!e)return;e.style.display="block",e.innerHTML=`<div class="trade-neg-add-form">
        <div class="trade-neg-add-form__label">New Article</div>
        <textarea id="trade-neg-article-text" maxlength="300" rows="3" placeholder="Enter article text..."></textarea>
        <div class="trade-neg-add-form__counter"><span id="trade-neg-article-counter">0</span>/300</div>
        <div class="trade-neg-add-form__actions">
            <button onclick="negArticleCancelForm()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);border:1px solid var(--border-main);background:transparent;cursor:pointer;">Cancel</button>
            <button id="trade-neg-article-add-btn" onclick="negArticleAdd()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#000;background:var(--accent,#5aafa5);border:none;cursor:pointer;" disabled>Add Article</button>
        </div>
    </div>`;const t=document.getElementById("trade-neg-article-text"),o=document.getElementById("trade-neg-article-counter"),a=document.getElementById("trade-neg-article-add-btn");t.focus(),t.addEventListener("input",()=>{o.textContent=t.value.length,a.disabled=!t.value.trim()}),fo()}function tt(){const e=document.getElementById("trade-neg-add-article-form");e&&(e.style.display="none",e.innerHTML="")}async function Bt(e){const{data:t,error:o}=await p.from("trade_negotiations").select("status, approved_by_a, approved_by_b").eq("id",e).single();return o||!t?{locked:!1,fetchFailed:!0}:{locked:t.status==="ratification"||!!t.approved_by_a&&!!t.approved_by_b,fetchFailed:!1,status:t.status}}let Me=!1;async function ki(){if(Me||!y)return;const e=document.getElementById("trade-neg-article-text");if(!e)return;const t=e.value.trim();if(!t)return;if(Me=!0,(await Bt(y.negotiationId)).locked){alert("This agreement is locked — both parties have approved and ratification is in motion. To edit articles, the agreement would need to fail in parliament first."),Me=!1,tt();return}const a={id:crypto.randomUUID(),text:t,author_nation_id:y.myNationId,author_nation_name:y.myNationName,added_at_tick:0,strike_requested_by:null,strike_requested_by_name:null},{data:n}=await p.from("shard").select("current_tick").eq("name","Alpha Shard").single();a.added_at_tick=n?.current_tick||0;const{data:r,error:i}=await p.from("trade_negotiations").select("draft_articles, agreement_type").eq("id",y.negotiationId).single();if(i){alert("Failed to load articles: "+i.message),Me=!1;return}const s=[...r?.draft_articles||[],a],{error:c}=await p.from("trade_negotiations").update({draft_articles:s,agreement_type:Ot(s,r.agreement_type)}).eq("id",y.negotiationId);if(c){alert("Failed to add article: "+c.message),Me=!1;return}y.articles=s,tt(),_t(),Me=!1}let Be=!1;async function Ii(e){if(!y||Be||!confirm("Delete this article?"))return;if(Be=!0,(await Bt(y.negotiationId)).locked){alert("This agreement is locked — both parties have approved and ratification is in motion. Articles cannot be deleted."),Be=!1;return}const{data:o,error:a}=await p.from("trade_negotiations").select("draft_articles, agreement_type").eq("id",y.negotiationId).single();if(a||!o){alert("Failed to load articles."),Be=!1;return}const r=(o.draft_articles||[]).filter(l=>l.id!==e),{error:i}=await p.from("trade_negotiations").update({draft_articles:r,agreement_type:Ot(r,o.agreement_type)}).eq("id",y.negotiationId);if(i){alert("Failed to delete article: "+i.message),Be=!1;return}y.articles=r,_t(),Be=!1}let Re=!1;async function Ei(e){if(!y||Re)return;if(Re=!0,(await Bt(y.negotiationId)).locked){alert("This agreement is locked — both parties have approved and ratification is in motion. Articles cannot be struck."),Re=!1;return}const{data:o,error:a}=await p.from("trade_negotiations").select("draft_articles, agreement_type").eq("id",y.negotiationId).single();if(a||!o){alert("Failed to load articles."),Re=!1;return}const r=(o.draft_articles||[]).map(l=>l.id!==e?l:{...l,strike_requested_by:y.myNationId,strike_requested_by_name:y.myNationName}),{error:i}=await p.from("trade_negotiations").update({draft_articles:r,agreement_type:Ot(r,o.agreement_type)}).eq("id",y.negotiationId);if(i){alert("Failed to request strike: "+i.message),Re=!1;return}y.articles=r,_t(),Re=!1}function vo(){const e=document.getElementById("trade-neg-agreement-btn");if(!e||!y)return;const t=y.weAreA?y.approvedByA:y.approvedByB,o=y.weAreA?y.approvedByB:y.approvedByA,a=(t?1:0)+(o?1:0),n=document.getElementById("trade-neg-add-structured-btn"),r=document.getElementById("trade-neg-add-article-btn"),i=document.getElementById("trade-neg-name-btn");a===2?(n&&(n.disabled=!0,n.style.opacity="0.3"),r&&(r.disabled=!0,r.style.opacity="0.3"),i&&(i.disabled=!0,i.style.opacity="0.3")):(n&&(n.disabled=!1,n.style.opacity="1"),r&&(r.disabled=!1,r.style.opacity="1"),i&&(i.disabled=!1,i.style.opacity="1")),a===2?(e.textContent="Agreement [2/2]",e.style.color="#4ade80",e.style.borderColor="rgba(74,222,128,0.3)",e.disabled=!0):t?(e.textContent="Agreement ["+a+"/2]",e.style.color="#5aafa5",e.style.borderColor="rgba(90,175,165,0.3)",e.disabled=!1):(e.textContent="Not in Agreement ["+a+"/2]",e.style.color="var(--text-dim)",e.style.borderColor="var(--border-main)",e.disabled=!1);const l=document.getElementById("trade-neg-send-parliament-btn");if(l){const s=y.status==="ratification";l.style.display=a===2&&!s?"":"none"}}async function Ai(){if(!y||!y.negotiationId)return;if(!y.chatRole?.canChat){alert("You need a diplomatic role to send the agreement to parliament.");return}const e=document.getElementById("trade-neg-send-parliament-btn");e&&(e.disabled=!0,e.textContent="Sending…");try{await sendTradeToParliament(y.negotiationId),y.status="ratification",vo()}finally{e&&(e.disabled=!1,e.textContent="Send to Parliament")}}window.sendTradeToParliamentFromModal=Ai;let we=!1;async function Si(){if(we||!y)return;if(!y.chatRole?.canChat){alert("You need a diplomatic role to vote on the agreement.");return}if(y.status==="cancelled"||y.status==="ratification")return;if(!y.agreementName||!y.agreementName.trim()){alert('The agreement must be named before both parties can agree. Click "Name Agreement" first.');return}const e=y,t=e.weAreA?e.approvedByA:e.approvedByB,o=e.weAreA?"approved_by_a":"approved_by_b",a=e.weAreA?"approved_by_a_role":"approved_by_b_role",n=e.weAreA?"approved_at_a_tick":"approved_at_b_tick";we=!0;const{data:r}=await p.from("shard").select("current_tick").eq("name","Alpha Shard").single(),i=r?.current_tick||0;if(t){const l={[o]:null,[a]:null,[n]:null},{error:s}=await p.from("trade_negotiations").update(l).eq("id",e.negotiationId);if(s){alert("Failed to revoke agreement: "+s.message),we=!1;return}e.weAreA?e.approvedByA=null:e.approvedByB=null}else{const l=F?.faction?.id,s=e.chatRole?.role||"trade_minister",c={[o]:l,[a]:s,[n]:i},f=e.weAreA?e.approvedByB:e.approvedByA;if(f){c.status="ratification";const[{data:v},{data:m}]=await Promise.all([p.from("nations").select("name").eq("id",e.weAreA?e.myNationId:e.partnerNationId).single(),p.from("nations").select("name").eq("id",e.weAreA?e.partnerNationId:e.myNationId).single()]),d=v?.name||"Unknown",g=m?.name||"Unknown",x=e.agreementName||"Trade Agreement",I="Ratify: "+x,$='Ratification of the trade agreement "'+x+'" between '+d+" and "+g+". A YES vote enacts the agreement; a NO vote rejects it.",T={bill_type:"ratification",bill_name:I,preamble:$,trade_negotiation_id:e.negotiationId,status:"floor",proposed_tick:i,floor_tick:i,voting_ends_tick:i+3},w=e.weAreA?e.myNationId:e.partnerNationId,A=e.weAreA?e.partnerNationId:e.myNationId,R=e.weAreA?l:e.approvedByA,N=e.weAreA?e.approvedByB:l,S={...T,nation_id:w,proposed_by:R},M={...T,nation_id:A,proposed_by:N},[z,q]=await Promise.all([p.from("bills").insert(S).select("id").single(),p.from("bills").insert(M).select("id").single()]);if(z.error){alert("Error creating ratification bill: "+z.error.message),we=!1;return}if(q.error){alert("Error creating ratification bill: "+q.error.message),we=!1;return}c.bill_a_id=z.data?.id||null,c.bill_b_id=q.data?.id||null;const D="The "+x+" has been sent to both parliaments for ratification.";p.from("event_log").insert([w,A].map(j=>({nation_id:j,event_name:x+" — Ratification",category:"trade",description_chosen:D,fired_at_tick:i}))).then(()=>{})}const{error:u}=await p.from("trade_negotiations").update(c).eq("id",e.negotiationId);if(u){alert("Failed to approve: "+u.message),we=!1;return}e.weAreA?e.approvedByA=l:e.approvedByB=l,f&&(e.status="ratification",alert("Both sides have approved! Ratification bills have been submitted to both parliaments."))}vo(),we=!1}window.negArticleShowForm=$i;window.negArticleCancelForm=tt;window.negArticleAdd=ki;window.negArticleDelete=Ii;window.negArticleRequestStrike=Ei;window.negAgreementToggle=Si;function Rt(){document.getElementById("trade-neg-modal").classList.remove("active"),ze&&(p.removeChannel(ze),ze=null),y=null,kt=!1,ct=!1,$t=!1,Me=!1,Be=!1,Re=!1,we=!1,Le=!1,le=null,lt=!1,Ve(),Io().then(()=>Je()).catch(()=>{})}let ct=!1;async function Ni(){if(!y||ct)return;if(y.status==="cancelled"){alert("This negotiation has already been ended.");return}const e=y.chatRole;if(!e?.canChat){alert("You need a diplomatic role to withdraw from negotiations.");return}const t=y.partnerNationName||"Unknown";if(!confirm("Withdraw from trade negotiations with "+t+`?

This will end the negotiation and cannot be undone.`))return;ct=!0;const o=y.negotiationId,a=y.myNationId,n=y.partnerNationId,{data:r}=await p.from("shard").select("current_tick").eq("name","Alpha Shard").single(),i=r?.current_tick||0,{error:l}=await p.from("trade_negotiations").update({status:"cancelled",concluded_at_tick:i}).eq("id",o);if(l){alert("Failed to withdraw: "+l.message),ct=!1;return}await p.from("negotiation_messages").insert({negotiation_id:o,sender_nation_id:a,sender_faction_id:F.faction.id,sender_role:e.role,sender_display_name:"System",message_text:e.displayName+" has withdrawn from negotiations.",is_system:!0,sent_at_tick:i});const s=e.displayName.split(" (")[0],f=(e.role==="trade_minister"?"Minister of Trade ":"Prime Minister ")+s+" has decided to end trade negotiations with "+t+".";await p.from("event_log").insert([{nation_id:a,event_name:"Trade Negotiations Withdrawn",trigger_key:"trade_negotiation_withdrawn",category:"trade",description_chosen:f,fired_at_tick:i},{nation_id:n,event_name:"Trade Negotiations Withdrawn",trigger_key:"trade_negotiation_withdrawn",category:"trade",description_chosen:f,fired_at_tick:i}]),y.status="cancelled",ct=!1,Rt();try{await Pt()}catch{}Ve(),Ae()}window.openTradeNegModal=ii;window.closeTradeNegModal=Rt;window.withdrawFromNegotiations=Ni;
