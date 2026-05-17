import{_supabase as p}from"./supabase-client-CiYoFhIh.js";/* empty css                  *//* empty css                  */import{i as Wo}from"./common-DXe9XlVq.js";import{e as v,t as Z,b as U}from"./utils-oN1e812_.js";import{i as Xo}from"./government-types-CNjNcIHN.js";import{f as Qo}from"./government-structure-DVzKGcwP.js";import{c as yo,a as Jo,s as Ko,d as he,b as Zo}from"./political-actions-CLyoQfsu.js";import"./stats-Nd7eW9dF.js";import"./preload-helper-BXl3LOEh.js";import"./factions-1eoRseVF.js";import"./corp-topbar-ClQJCe3f.js";import"./config-BdOpHGNJ.js";const ea=[{id:"world",label:"WORLD"},{id:"diplomacy",label:"DIPLOMACY"},{id:"trade",label:"TRADE"},{id:"ipo",label:"IPO"},{id:"sports",label:"SPORTS"}];let ae="world",fo=!1,Ve=!1,zt=0;function We(){const e=document.getElementById("diplo-subtabs");e&&(e.innerHTML=ea.map(t=>{let o="";return(t.id==="trade"||t.id==="world")&&Ve?o='<span style="display:inline-block;width:6px;height:6px;border-radius:50%;background:var(--amber);margin-left:5px;vertical-align:middle;"></span>':t.id==="ipo"&&zt>0&&(o=`<span class="badge badge--amber" style="margin-left:6px;">${zt}</span>`),`<div class="diplo-subtab${ae===t.id?" active":""}" data-tab="${t.id}">${t.label}${o}</div>`}).join(""),e.onclick=t=>{const o=t.target.closest(".diplo-subtab");!o||o.dataset.tab===ae||(ae=o.dataset.tab,We(),ta())})}async function ho(){const e=q?.nation?.id,t=q?.faction?.id;if(!e||!t){Ve=!1;return}try{const{data:o}=await p.from("trade_negotiations").select("id, nation_a_id, nation_b_id, approved_by_a, approved_by_b").or(`nation_a_id.eq.${e},nation_b_id.eq.${e}`).in("status",["open","active"]);if(!o||o.length===0){Ve=!1;return}if(o.some(l=>{const s=l.nation_a_id===e,c=s?l.approved_by_a:l.approved_by_b;return(s?l.approved_by_b:l.approved_by_a)&&!c})){Ve=!0;return}const n=q?.shard?.current_tick||0,r=o.map(l=>l.id),{data:i}=await p.from("negotiation_messages").select("id, negotiation_id, sender_nation_id").in("negotiation_id",r).neq("sender_nation_id",e).eq("is_system",!1).gte("sent_at_tick",n-2).limit(1);Ve=i&&i.length>0}catch{Ve=!1}}function ta(){const e=document.getElementById("subtab-world"),t=document.getElementById("subtab-diplomacy"),o=document.getElementById("subtab-trade"),a=document.getElementById("subtab-ipo"),n=document.getElementById("subtab-sports");if(!(!e||!t||!o||!a||!n))if(e.style.display=ae==="world"?"":"none",t.style.display=ae==="diplomacy"?"":"none",o.style.display=ae==="trade"?"":"none",a.style.display=ae==="ipo"?"":"none",n.style.display=ae==="sports"?"":"none",ae==="trade"&&!fo&&(fo=!0,ma()),ae==="sports"&&na(),ae==="ipo")typeof ie=="function"&&h&&ie();else{if(typeof $e<"u"&&$e){try{p.removeChannel($e)}catch{}$e=null}if(typeof ke<"u"&&ke){try{p.removeChannel(ke)}catch{}ke=null}}}const oa=.03,Dt=84,jt=24,aa=12;function lt(e){if(!e)return String(e);const t=["th","st","nd","rd"],o=e%100;return e+(t[(o-20)%10]||t[o]||t[0])}function xo(e,t){return!t&&e<0?"UPCOMING":e<=2?`GROUP STAGE — ROUND ${e+1} IN PROGRESS`:e===3?"QUARTERFINALS IN PROGRESS":e===4?"SEMIFINALS IN PROGRESS":e===5?"FINAL IN PROGRESS":"COMPLETE"}function wo(e,t,o){return!o&&t<0?"pending":e===0?"done":e===1?t<=2?"active":"done":e===2?t<=2?"pending":t<=4?"active":"done":e===3?t===5?"active":t>5?"done":"pending":"pending"}function $o(e){const t=Number(e)||0;let o=-1;for(let n=0;n<1e3&&!(Dt+jt*n>t);n++)o=n;const a=n=>{const r=Dt+jt*n,i=r+5,l=t<r?-1:t-r,s=l>=0&&l<=5;return{cupNum:n+1,cupStart:r,cupEnd:i,isActive:s,stage:l,gs1:r,gs2:r+1,gs3:r+2,qf:r+3,sf:r+4,f:r+5}};return o>=0?a(o):a(0)}function na(){const e=document.getElementById("sports-subtitle"),t=document.getElementById("sports-cards"),o=document.getElementById("vola-cup"),a=document.getElementById("vola-team");if(!e||!t)return;const n=q?.nation,r=q?.shard?.current_tick??0;if(!n){e.textContent="",t.innerHTML='<div class="sports-empty">No nation selected.</div>',o&&(o.innerHTML=""),a&&(a.innerHTML="");return}const i=Math.max(0,Math.min(100,Number(n.national_vola_culture)||0)),l=Math.round(i*oa*10)/10,s=(n.name||"").toUpperCase();e.textContent=`${s} NATIONAL VOLA AUTHORITY · TICK ${r}`;const c=Math.max(0,Number(n.vwc_ranking)||0),u=Math.max(0,Number(n.national_team_prowess)||0),f=Math.max(0,Number(n.vola_stadiums)||0);let _=null,m=null,d=null,g=null;for(let w=0;w<200&&(_===null||m===null);w++){const S=Dt+jt*w,M=S-aa;m===null&&M>=r&&(m=M,g=w+1),_===null&&S>=r&&(_=S,d=w+1)}const x=w=>{if(w==null)return"—";const S=Z(w),[M,N]=S.split(", ");return`${(M||"").slice(0,3)} ${N||""}`.trim()},I=x(_),$=x(m),E=_!=null?`${lt(d)} World Vola Cup · tick ${_}`:"no cup scheduled",T=m!=null?`${lt(g)} cup qualifiers · tick ${m}`:"no qualifiers scheduled";if(t.innerHTML=`
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
                <div class="sports-stat-card-value">${c>0?lt(c):"—"}</div>
                <div class="sports-stat-card-sub">${c>0?"of 12 qualified":"unranked"}</div>
            </div>
            <div class="sports-stat-card">
                <div class="sports-stat-card-header">
                    <span class="sports-stat-card-icon">&#x26A1;</span>
                    <span class="sports-stat-card-label">TEAM PROWESS</span>
                </div>
                <div class="sports-stat-card-value">${u.toLocaleString()}</div>
                <div class="sports-stat-card-sub sports-stat-card-sub--accent">${u>0?"avg "+Math.round(u/3)+" per player":"no roster"}</div>
            </div>
            <div class="sports-stat-card">
                <div class="sports-stat-card-header">
                    <span class="sports-stat-card-icon">&#x1F3DF;</span>
                    <span class="sports-stat-card-label">STADIUMS BUILT</span>
                </div>
                <div class="sports-stat-card-value">${f}</div>
                <div class="sports-stat-card-sub">${f>0?"across the nation":"none yet"}</div>
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
    `,ia(),o){o.innerHTML=ra(r);const w=$o(r);w?.cupNum&&(ca(w.cupNum).catch(S=>console.warn("[Sports] placement render failed:",S?.message||S)),da(w.cupNum).catch(S=>console.warn("[Sports] group render failed:",S?.message||S)),sa(w.cupNum).catch(S=>console.warn("[Sports] host render failed:",S?.message||S)),pa(w.cupNum).catch(S=>console.warn("[Sports] knockout render failed:",S?.message||S)),la(w.cupNum,r).catch(S=>console.warn("[Sports] schedule render failed:",S?.message||S)))}a&&(a.innerHTML=`
            <div class="vola-team-header">
                <span class="vola-team-title"><span class="vola-team-icon">&#x274C;</span> NATIONAL VOLA TEAM</span>
                <span class="vola-team-meta" id="vola-team-meta">&hellip;</span>
            </div>
            <div class="vola-team-grid" id="vola-team-grid">
                <div class="sports-empty">Loading roster&hellip;</div>
            </div>
            <div class="vola-team-footer" id="vola-team-footer"></div>
        `,ko(r).catch(w=>console.warn("[Sports] team render failed:",w?.message||w)))}async function ia(){const e=document.getElementById("vwc-ranking-panel-list");if(!e)return;let t=Array.isArray(K)?K:[];if(t.length===0){e.innerHTML='<div class="sports-empty">Loading rankings&hellip;</div>';try{const{data:n}=await p.from("nations").select("id, name, flag_url, vwc_ranking").order("name");t=n||[],K=t}catch(n){e.innerHTML=`<div class="sports-empty">Failed to load: ${v(n?.message||"")}</div>`;return}}if(t.length===0){e.innerHTML='<div class="sports-empty">No nation data available.</div>';return}const o=t.slice().sort((n,r)=>{const i=Number(n?.vwc_ranking)||0,l=Number(r?.vwc_ranking)||0;return i===0&&l===0?(n.name||"").localeCompare(r.name||""):i===0?1:l===0?-1:i-l}),a=q?.nation?.id;e.innerHTML=o.map((n,r)=>{const i=Number(n.vwc_ranking)||0,l=Xe(n,"vwc-ranking-flag"),s=i>0?lt(i):"—",c=i>0&&i<=3?'<span class="vwc-ranking-tag">[WORLD CLASS]</span>':"";return`
            <div class="vwc-ranking-row${n.id&&a&&n.id===a?" vwc-ranking-row--me":""}">
                <span class="vwc-ranking-rank">${s}</span>
                ${l}
                <span class="vwc-ranking-name">${v(n.name||"Unknown")}</span>
                ${c}
            </div>
        `}).join("")}document.addEventListener("click",e=>{const t=e.target.closest&&e.target.closest("#vwc-ranking-card");if(!t)return;const o=document.getElementById("vwc-ranking-panel");if(!o)return;const a=!o.hidden;o.hidden=a,t.setAttribute("aria-expanded",String(!a)),t.classList.toggle("sports-stat-card--open",!a)});document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const t=e.target&&e.target.id==="vwc-ranking-card"?e.target:null;t&&(e.preventDefault(),t.click())});function ra(e){const t=$o(e);if(!t)return"";const a=t.stage<0?`Next World Cup &mdash; <span class="vola-cup-title-date">${Z(t.gs1)}</span>`:`${lt(t.cupNum)} World <span class="vola-cup-title-accent">Vola</span> Cup`,n=t.isActive?'<span class="vola-cup-live">&bullet; LIVE</span>':"",r=xo(t.stage,t.isActive),i=f=>f==="done"?"&check;":f==="active"?"&times;":"&#9675;",l=(f,_)=>{const m=wo(f,t.stage,t.isActive);return`<div class="vola-cup-tab vola-cup-tab--${m}">
            <span class="vola-cup-tab-icon">${i(m)}</span> ${_}
        </div>`},s=f=>`
        <div class="vola-cup-group-row">
            <span class="vola-cup-group-rank">${f}.</span>
            <span class="vola-cup-group-team vola-cup-group-team--blank">&mdash;</span>
            <span class="vola-cup-group-stat vola-cup-group-stat--blank">&mdash;</span>
            <span class="vola-cup-group-stat vola-cup-group-stat--blank">&mdash;</span>
            <span class="vola-cup-group-stat vola-cup-group-stat--blank">&mdash;</span>
        </div>
    `,c=f=>`
        <div class="vola-cup-group vola-cup-group--${f.toLowerCase()}" data-cup-num="${t.cupNum}" data-group-letter="${f}">
            <div class="vola-cup-group-header">GROUP <span class="vola-cup-group-letter">${f}</span></div>
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
    `,u=(f,_,m="&mdash;",d="&mdash;")=>`
        <div class="vola-cup-match" data-cup-num="${t.cupNum}" data-round="${f}" data-match-num="${_}">
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
                ${u("QF",1)}
                ${u("QF",2)}
                ${u("QF",3)}
                ${u("QF",4)}
            </div>
            <div class="vola-cup-bracket-col">
                <div class="vola-cup-bracket-col-label" data-cup-sched="bracket-sf">SEMIFINALS &middot; ${Z(t.sf)}</div>
                ${u("SF",1,"Winner QF1","Winner QF2")}
                ${u("SF",2,"Winner QF3","Winner QF4")}
            </div>
            <div class="vola-cup-bracket-col">
                <div class="vola-cup-bracket-col-label" data-cup-sched="bracket-f">FINAL &middot; ${Z(t.f)}</div>
                ${u("F",1,"Winner SF1","Winner SF2")}
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
    `}const go=["#d65a5a","#e07a3a","#e8b13a","#cdd055","#9ac84e","#5eb564","#4ab59c","#5aa9d6","#6e8ad6","#9070cf","#b46ac5","#d66aaa","#cc8866"];function pt(e){if(!e)return"var(--text-bright)";let t=0;for(let o=0;o<e.length;o++)t=t*31+e.charCodeAt(o)|0;return go[Math.abs(t)%go.length]}function Xe(e,t){if(!e)return"";const o=e.name||"",a=e.flag_url||Sa[o]||(o?`assets/flags/${o}.png`:"");return a?`<img class="${t}" src="${v(a)}" alt="" loading="lazy" onerror="this.style.display='none'">`:""}async function sa(e){const t=document.querySelector(".vola-cup-meta-host");if(!t)return;const{data:o,error:a}=await p.from("vola_cup_hosts").select("host_nation_id, nations:host_nation_id(name)").eq("cup_number",e).maybeSingle();if(a){console.warn("[Sports] host fetch failed:",a.message);return}const n=o?.nations?.name;n&&(t.textContent=n.toUpperCase())}async function la(e,t){const{data:o,error:a}=await p.from("vola_cup_group_matches").select("scheduled_tick").eq("cup_number",e).eq("round_number",1).order("scheduled_tick",{ascending:!0}).limit(1);if(a){console.warn("[Sports] schedule fetch failed:",a.message||a);return}if(!o||o.length===0)return;const n=Number(o[0].scheduled_tick);if(!Number.isFinite(n))return;const r=n+3,i=n+4,l=n+5,s=(m,d)=>{const g=document.querySelector(`[data-cup-sched="${m}"]`);g&&(g.textContent=d)};s("qf",`${Z(r)} — Quarterfinals begin`),s("sf",`${Z(i)} — Semifinals`),s("f",`${Z(l)} — Final`),s("bracket-qf",`QUARTERFINALS · ${Z(r)}`),s("bracket-sf",`SEMIFINALS · ${Z(i)}`),s("bracket-f",`FINAL · ${Z(l)}`);const u=(Number(t)||0)-n,f=u>=0&&u<=5;s("status",xo(u,f));const _=document.querySelector('[data-cup-sched="tabs"]');if(_){const m=d=>d==="done"?"✓":d==="active"?"×":"○";_.querySelectorAll(".vola-cup-tab").forEach((d,g)=>{const x=wo(g,u,f);d.className=`vola-cup-tab vola-cup-tab--${x}`;const I=d.querySelector(".vola-cup-tab-icon");I&&(I.textContent=m(x))})}}async function ca(e){const t=document.querySelector(`.vola-cup-placement-body[data-cup-num="${e}"]`);if(!t)return;const{data:o,error:a}=await p.from("vola_placement_matches").select("match_number, scheduled_tick, team_a_score, team_b_score, winner_nation_id, team_a:team_a_nation_id(id, name, flag_url), team_b:team_b_nation_id(id, name, flag_url)").eq("cup_number",e).order("match_number",{ascending:!0});if(a){t.innerHTML=`<div class="sports-empty">Failed to load placement matches: ${v(a.message||"")}</div>`;return}if(!o||o.length===0){t.innerHTML='<div class="sports-empty">Placement schedule not yet generated. The bottom 3 nations face a 3-tick round-robin starting at the qualifier tick.</div>';return}t.innerHTML=o.map(n=>{const r=n.team_a?.name||"TBD",i=n.team_b?.name||"TBD",l=Xe(n.team_a,"vola-flag"),s=Xe(n.team_b,"vola-flag"),c=pt(r),u=pt(i),f=n.team_a_score,_=n.team_b_score,m=f!=null&&_!=null,d=n.winner_nation_id,g=m&&d===n.team_a?.id,x=m&&d===n.team_b?.id,I=g?c:m?"var(--text-dim)":c,$=x?u:m?"var(--text-dim)":u,E=g?`text-shadow:0 0 8px ${c}55;`:"",T=x?`text-shadow:0 0 8px ${u}55;`:"";return`
            <div class="vola-placement-row ${m?"played":"pending"}">
                <div class="vola-placement-meta">
                    <span class="vola-placement-num">MATCH ${n.match_number}</span>
                    <span class="vola-placement-tick">${Z(n.scheduled_tick)} &middot; tick ${n.scheduled_tick}</span>
                </div>
                <div class="vola-placement-teams">
                    <span class="vola-placement-team ${g?"won":""}" style="color:${I};${E}">${l}${v(r)}</span>
                    <span class="vola-placement-score">${m?`<strong style="color:${c};">${f}</strong> &mdash; <strong style="color:${u};">${_}</strong>`:"vs"}</span>
                    <span class="vola-placement-team ${x?"won":""}" style="color:${$};${T}">${s}${v(i)}</span>
                </div>
            </div>
        `}).join("")}async function da(e){const t=document.querySelectorAll(`.vola-cup-group[data-cup-num="${e}"]`);if(!t.length)return;const[o,a]=await Promise.all([p.from("vola_cup_groups").select("group_letter, seed_rank, qualified_via, nation:nation_id(id, name, flag_url, vwc_ranking)").eq("cup_number",e),p.from("vola_cup_group_matches").select("group_letter, team_a_nation_id, team_b_nation_id, team_a_score, team_b_score, winner_nation_id, resolved_at_tick").eq("cup_number",e)]);if(o.error){console.warn("[Sports] vola_cup_groups fetch failed:",o.error.message||o.error);return}a.error&&console.warn("[Sports] vola_cup_group_matches fetch failed:",a.error.message||a.error);const n=o.data||[];if(n.length===0)return;const r=new Map,i=s=>(r.has(s)||r.set(s,{wins:0,losses:0,points:0,played:0}),r.get(s));for(const s of a.data||[]){if(s.resolved_at_tick==null)continue;const c=s.team_a_nation_id,u=s.team_b_nation_id,f=Number(s.team_a_score)||0,_=Number(s.team_b_score)||0,m=i(c),d=i(u);m.points+=f,d.points+=_,m.played++,d.played++,s.winner_nation_id===c?(m.wins++,d.losses++):s.winner_nation_id===u&&(d.wins++,m.losses++)}const l={A:[],B:[],C:[]};for(const s of n){if(!l[s.group_letter])continue;const c=s.nation?.id,u=c&&r.get(c);l[s.group_letter].push({...s,wins:u?u.wins:0,losses:u?u.losses:0,points:u?u.points:0,played:u?u.played:0,ranking:Number(s.nation?.vwc_ranking)||0})}t.forEach(s=>{const c=s.getAttribute("data-group-letter"),u=s.querySelector(".vola-cup-group-rows");if(!u)return;const f=(l[c]||[]).slice();if(f.length===0)return;const _=m=>m>0?m:Number.POSITIVE_INFINITY;f.sort((m,d)=>{if(d.wins!==m.wins)return d.wins-m.wins;if(d.points!==m.points)return d.points-m.points;const g=_(m.ranking),x=_(d.ranking);if(g!==x)return g-x;const I=m.nation?.name||"",$=d.nation?.name||"";return I.localeCompare($)}),u.innerHTML=f.map((m,d)=>{const g=m.nation||{},x=g.name||"TBD",I=Xe(g,"vola-cup-group-flag"),$=pt(x),E=m.qualified_via==="placement"?'<span class="vola-cup-group-via" title="Qualified via placement round">P</span>':"",T=m.played>0?`${m.wins}-${m.losses}`:'<span class="vola-cup-group-stat--blank">&mdash;</span>',w=m.played>0?String(m.points):'<span class="vola-cup-group-stat--blank">&mdash;</span>',S=m.ranking>0?String(m.ranking):'<span class="vola-cup-group-stat--blank">&mdash;</span>';return`
                <div class="vola-cup-group-row">
                    <span class="vola-cup-group-rank">${d+1}.</span>
                    <span class="vola-cup-group-team" style="color:${$};">${I}${v(x)}${E}</span>
                    <span class="vola-cup-group-stat">${T}</span>
                    <span class="vola-cup-group-stat">${w}</span>
                    <span class="vola-cup-group-stat">${S}</span>
                </div>
            `}).join("")})}async function pa(e){const t=document.querySelector(`.vola-cup-bracket[data-cup-num="${e}"]`);if(!t)return;const{data:o,error:a}=await p.from("vola_cup_knockout").select("round, match_number, team_a_seed, team_b_seed, feeder_a_match, feeder_b_match, team_a_score, team_b_score, winner_nation_id, resolved_at_tick, team_a:team_a_nation_id(id, name, flag_url), team_b:team_b_nation_id(id, name, flag_url)").eq("cup_number",e);if(a){console.warn("[Sports] vola_cup_knockout fetch failed:",a.message||a);return}if(!o||o.length===0)return;const n=o.find(i=>i.round==="F"),r=t.querySelector(".vola-cup-champion-text");if(r)if(n?.winner_nation_id&&(n.team_a||n.team_b)){const i=n.winner_nation_id===n.team_a?.id?n.team_a:n.team_b;if(i?.name){const l=Xe(i,"vola-cup-champion-flag"),s=pt(i.name);r.innerHTML=`${l}<span style="color:${s};">${v(i.name)}</span>`,t.classList.add("vola-cup-bracket--crowned")}}else r.textContent="To Be Crowned",t.classList.remove("vola-cup-bracket--crowned");for(const i of o){const l=t.querySelector(`.vola-cup-match[data-round="${i.round}"][data-match-num="${i.match_number}"]`);if(!l)continue;const s=l.querySelector('[data-side="a"]'),c=l.querySelector('[data-side="b"]'),u=l.querySelector(".vola-cup-match-status");if(!s||!c)continue;const f=(_,m,d)=>{if(_?.id){const g=Xe(_,"vola-cup-match-flag");return`<span style="color:${pt(_.name)};">${g}${v(_.name||"TBD")}</span>`}return d!=null?`Winner ${i.round==="SF"?`QF${d}`:`SF${d}`}`:m};if(s.innerHTML=f(i.team_a,"&mdash;",i.feeder_a_match),c.innerHTML=f(i.team_b,"&mdash;",i.feeder_b_match),l.classList.remove("vola-cup-match--played","vola-cup-match--win-a","vola-cup-match--win-b"),u)if(i.resolved_at_tick!=null&&i.winner_nation_id){const _=Number(i.team_a_score)||0,m=Number(i.team_b_score)||0;u.textContent=`${_} – ${m}`,l.classList.add("vola-cup-match--played");const d=i.winner_nation_id===i.team_a?.id?"a":"b";l.classList.add(`vola-cup-match--win-${d}`)}else u.textContent="PENDING"}}async function ko(e){const t=document.getElementById("vola-team-grid"),o=document.getElementById("vola-team-meta"),a=document.getElementById("vola-team-footer");if(!t)return;const n=q?.nation;if(!n?.id){t.innerHTML='<div class="sports-empty">No nation selected.</div>',o&&(o.textContent=""),a&&(a.innerHTML="");return}const{data:r,error:i}=await p.from("vola_team_players").select("id, position_number, position_name, first_name, last_name, age, rating, recruited_at_tick, recruited_at_culture, retires_at_tick, is_captain").eq("nation_id",n.id).order("position_number",{ascending:!0});if(i){t.innerHTML=`<div class="sports-empty">Failed to load roster: ${v(i.message||"")}</div>`,o&&(o.textContent=""),a&&(a.innerHTML="");return}if(!r||r.length===0){t.innerHTML='<div class="sports-empty">Roster pending — players generate next tick.</div>',o&&(o.textContent=""),a&&(a.innerHTML="");return}const l=r.reduce((s,c)=>s+(Number(c.rating)||0),0);if(o&&(o.textContent=`${r.length} PLAYERS · TOTAL PROWESS ${l}`),t.innerHTML=r.map(s=>{const c=Math.max(0,Number(s.retires_at_tick)-Number(e)),u=c===1,f=`${s.first_name||""} ${s.last_name||""}`.trim()||"Unnamed",_=Number(s.recruited_at_culture).toFixed(0),m=u?"vola-player-card vola-player-card--retiring":"vola-player-card",d=u?'<div class="vola-player-retire-warn"><span>&#9888;</span> RETIRES NEXT TICK</div>':`<div class="vola-player-remaining"><span>&#x29D6;</span> ${c} tick${c===1?"":"s"} remaining</div>`,g=u?`<button class="vola-player-recruit-btn" data-position="${s.position_number}">RECRUIT REPLACEMENT &rarr;</button>`:"",x=s.is_captain?`CAPTAIN &middot; POS ${s.position_number}`:`POSITION ${s.position_number}`;return`
            <div class="${m}">
                <div class="vola-player-pos">${x}</div>
                <div class="vola-player-name">${v(f)}</div>
                <div class="vola-player-meta">${v(s.position_name||"").toUpperCase()} &middot; AGE ${Number(s.age)||"?"}</div>
                <div class="vola-player-rating"><span class="vola-player-rating-num">${Number(s.rating)||0}</span> <span class="vola-player-rating-label">RATING</span></div>
                ${d}
                <div class="vola-player-recruit-line">recruited at Culture ${v(_)} &middot; tick ${Number(s.recruited_at_tick)||0}</div>
                ${g}
            </div>
        `}).join(""),a){const s=r.map(c=>Number(c.rating)||0).join(" + ");a.innerHTML=`
            <div class="vola-team-footer-left">
                <div class="vola-team-footer-label">TEAM PROWESS (sum)</div>
                <div class="vola-team-footer-formula">${s} = ${l}</div>
            </div>
            <div class="vola-team-footer-total">${l}</div>
        `}t.querySelectorAll("[data-position]").forEach(s=>{s.tagName==="BUTTON"&&s.addEventListener("click",async()=>{const c=Number(s.dataset.position);if(c&&confirm("Force-retire this player and recruit a replacement at current culture?")){s.disabled=!0,s.textContent="RECRUITING…";try{const{data:u,error:f}=await p.rpc("recruit_vola_player_replacement",{p_position_number:c});if(f)throw f;if(!u?.success)throw new Error(u?.reason||"Recruit failed")}catch(u){alert("Recruit failed: "+(u?.message||u)),s.disabled=!1,s.textContent="RECRUIT REPLACEMENT →";return}await ko(e)}})})}const Io={fuel_energy:"⛽",minerals:"⛏️",food_agriculture:"🌾",grains_staples:"🌾",livestock_dairy:"🥬",fruits_vegetables:"🍎",cash_crops:"🌿",manufactured_goods:"🏭",technology:"💻",arms:"⚔️",tourism:"✈️",services_finance:"🏦"},It={fuel_energy:"Fuel & Energy",minerals:"Minerals",food_agriculture:"Food & Agriculture",grains_staples:"Grains & Staples",livestock_dairy:"Livestock & Dairy",fruits_vegetables:"Fruits & Veg",cash_crops:"Cash Crops",manufactured_goods:"Manufactured",technology:"Technology",arms:"Arms",tourism:"Tourism",services_finance:"Services & Finance"};let se={},Ht=null,vt=null,Vt=[];async function ma(){const e=document.getElementById("trade-left"),t=document.getElementById("trade-right");if(!(!e||!t)){e.innerHTML='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Loading trade data...</div>',t.innerHTML="";try{await fa()}catch(o){console.error("[Trade] Failed to load trade data:",o)}try{await ba()}catch(o){console.error("[Trade] Failed to load partner flows:",o)}if(!De)try{const[o,a]=await Promise.all([p.from("diplomatic_relations").select("*"),p.from("trade_agreements").select("*").eq("status","active")]);De=o.data||[],Xt=a.data||[]}catch{}try{await St()}catch(o){console.error("[Trade] Failed to load agreements/shipping:",o)}ua(),to(),Ze(),Ee()}}function ua(){const e=document.getElementById("trade-header-stats");if(!e)return;const t=Pe.filter(o=>o.status==="active").length;e.innerHTML=`<div class="tr-header-stats">
        <div class="tr-header-stat">
            <div class="tr-header-stat-label">AGREEMENTS</div>
            <div class="tr-header-stat-value">${t} active</div>
        </div>
    </div>`}async function fa(){se={},Vt=[]}function ga(e,t){const o=q?.nation?.id;if(!o||!e)return 0;let a=0;for(const n of Pe||[])if(n.nation_a_id===o&&n.nation_b_id===e||n.nation_b_id===o&&n.nation_a_id===e)for(const i of Ie[n.id]||[])i.status==="awarded"&&a++;return a}function Et(e){const t=q?.nation?.id,o=(K||[]).find(r=>r.id===t),a=(K||[]).find(r=>r.id===e),n=(De||[]).find(r=>r.nation_a_id===t&&r.nation_b_id===e||r.nation_b_id===t&&r.nation_a_id===e);return Ko(o,a,n?.border_types)||{needsShipping:!0,reason:null}}function vo(e,t){const o=Et(e)||{needsShipping:!0,reason:null};if(!o.needsShipping)return{pct:100,ships:0,reason:o.reason};const a=ga(e);return{pct:Math.min(100,85+a*3),ships:a,reason:null}}function _o(e,t){const a=(Ie[e]||[]).filter(n=>n.status==="awarded");if(a.length===0){const n=t?Et(t):null;return n&&!n.needsShipping?{pct:100,ships:0,reason:n.reason}:{pct:85,ships:0,reason:null}}return{pct:Math.min(100,85+a.length*3),ships:a.length,reason:null}}function ht(e){const{pct:t,ships:o,reason:a}=e,n=t>=100?"var(--green)":t>85?"var(--amber)":"var(--red)";let r;return a==="landlocked"?r="landlocked":a==="land_border"?r="land border":o===0?r="no active shipping":r=`+${o*3} for ${o} ship${o!==1?"s":""} on trade route`,`<span style="font-family:var(--font-mono);font-size:9px;color:${n};white-space:nowrap;">[${t}% — ${v(r)}]</span>`}function xt(e){if(!e)return[];const t=Number(e.energy)||0,o=Number(e.infrastructure)||0,a=Number(e.industry)||0,n=Number(e.standard_of_living)||0,r=(Number(e.population)||0)/1e6,i=Number(e.minerals)||0,l=Number(e.unskilled_workers)||0,s=Number(e.farmland)||0,c=Number(e.education)||0,u=Number(e.service_sector)||0;return[{key:"energy",name:"Energy",icon:"⚡",prod:t/3,potential:t/3,dem:(o+a)*n*Math.sqrt(r)/3500},{key:"minerals",name:"Minerals",icon:"⛏",prod:i/3*((l+a)/200),potential:i/3,dem:o/10+a/16},{key:"food",name:"Food",icon:"🌾",prod:s/2*(l/100),potential:s/2,dem:r/3},{key:"consumer_goods",name:"Consumer Goods",icon:"📦",prod:a/3*(l/100),potential:a/3,dem:n/100*r/2},{key:"luxury_goods",name:"Luxury Goods",icon:"💎",prod:n/6*(c*u/1e4),potential:n/6,dem:Math.pow(n/100,2)*r}]}function to(){const e=document.getElementById("trade-left");if(!e)return;const t=q?.nation||{},o=Eo(),a=xt(t).map(d=>{const g=Number(o[d.key])||0;return{key:d.key,icon:d.icon,name:d.name,production:d.prod,potential:d.potential,domesticDemand:d.dem,demand:0,trading:g,netFlow:d.prod-d.dem+g,selfSufficiencyBalance:null,statBased:!0}});for(const[d,g]of Object.entries(se))d==="food_agriculture"&&(se.grains_staples||se.livestock_dairy)||a.push({key:d,icon:Io[d]||"📦",name:It[d]||d,production:Number(g.domestic_production)||0,domesticDemand:Number(g.domestic_demand)||0,demand:Number(g.import_demand)||0,netFlow:Number(g.net_flow)||0,selfSufficiencyBalance:(Number(g.domestic_demand)||0)>0?(Number(g.domestic_production)||0)-(Number(g.domestic_demand)||0):null});a.sort((d,g)=>!!d.statBased!=!!g.statBased?d.statBased?-1:1:g.production+g.demand-(d.production+d.demand));const n=a.filter(d=>d.netFlow>0).sort((d,g)=>g.netFlow-d.netFlow),r=a.filter(d=>d.netFlow<0).sort((d,g)=>d.netFlow-g.netFlow);let i="";i+=`<div class="tr-econ-section">
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
            </div>`;const l=q?.nation?.id,s=(d,g)=>d.statBased?Number(g).toFixed(0):U(g),c={energy:"(Energy / 3)",minerals:"(Minerals / 3) × ((Unskilled + Industry) / 200)",food:"(Farmland / 2) × (Unskilled / 100)",consumer_goods:"(Industry / 3) × (Unskilled / 100)",luxury_goods:"(SoL / 6) × ((Education × Services) / 10000)"};for(const d of a){const g=(Number(d.domesticDemand)||0)+(Number(d.demand)||0),x=Number(d.trading)||0,I=(Number(d.production)||0)-g+x,$=I>0?"positive":I<0?"negative":"zero",E=x>0?"positive":x<0?"negative":"zero",T=vt===d.key,w=d.statBased?' data-statbased="1"':"",S=d.statBased?"cursor:default;":"",M=d.statBased?c[d.key]:null;if(i+=`<div class="tr-econ-row tr-commodity-row" data-sector="${d.key}"${w} style="${S}">
            <div class="tr-econ-name-cell">
                <span class="tr-econ-icon">${d.icon}</span>
                <div style="display:flex;flex-direction:column;gap:2px;min-width:0;">
                    <span class="tr-econ-name">${v(d.name)}</span>
                    ${M?`<span class="tr-econ-formula" title="Production formula: ${v(M)}">${v(M)}</span>`:""}
                </div>
            </div>
            <span class="tr-econ-value">${s(d,d.production)}${d.statBased&&d.key!=="energy"&&Number.isFinite(Number(d.potential))?` <span class="tr-econ-potential" title="Production if multiplier stats were maxed at 100">(${s(d,d.potential)})</span>`:""}</span>
            <span class="tr-econ-value${g>0?"":" tr-econ-muted"}">${g>0?s(d,g):"—"}</span>
            <span class="tr-econ-net ${E}">${x===0?"0":(x>0?"+":"−")+s(d,Math.abs(x))}</span>
            <span class="tr-econ-net ${$}">${I===0?"—":(I>0?"+":"−")+s(d,Math.abs(I))}</span>
        </div>`,T){const N=se[d.key]||{},A=Number(N.domestic_production)||0,B=Number(N.domestic_demand)||0,z=Number(N.export_capacity)||0,R=Number(N.import_demand)||0,D=Number(N.export_volume)||0,j=Number(N.import_volume)||0,ee=B>0?A-B:null,F=D-j,W=Math.max(0,R-z-j),H=he(A,d.key),de=he(B,d.key),oe=he(R,d.key),pe=he(j,d.key),ot=he(D,d.key),po=he(W,d.key),mo=Vt.filter(V=>V.importer_nation_id===l&&V.sector===d.key&&V.trade_volume>0).sort((V,at)=>at.trade_volume-V.trade_volume),uo=Vt.filter(V=>V.exporter_nation_id===l&&V.sector===d.key&&V.trade_volume>0).sort((V,at)=>at.trade_volume-V.trade_volume);i+='<div style="padding:10px 18px 14px;background:var(--bg-card);border-bottom:2px solid var(--border-main);">';const Ot={fuel_energy:{price:85,unit:"barrel"},minerals:{price:120,unit:"tonne"},grains_staples:{price:235,unit:"tonne"},livestock_dairy:{price:2800,unit:"tonne"},fruits_vegetables:{price:900,unit:"tonne"},cash_crops:{price:1400,unit:"tonne"},manufactured_goods:{price:2200,unit:"TEU"},arms:{price:45e3,unit:"unit"}}[d.key];if(Ot&&(i+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-dim);letter-spacing:0.5px;">GLOBAL PRICE</span>
                    <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--amber);">$${Ot.price.toLocaleString()} <span style="font-weight:400;color:var(--text-dim);font-size:10px;">per ${Ot.unit}</span></span>
                </div>`),i+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-dim);letter-spacing:0.5px;">DOMESTIC PRODUCTION</span>
                <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--teal);">${U(A)}${H?' <span style="font-weight:400;color:var(--text-dim);font-size:10px;">('+H+")</span>":""}</span>
            </div>`,B>0&&(i+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-dim);letter-spacing:0.5px;">DOMESTIC DEMAND</span>
                    <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--blue);">${U(B)}${de?' <span style="font-weight:400;color:var(--text-dim);font-size:10px;">('+de+")</span>":""}</span>
                </div>`),i+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-dim);letter-spacing:0.5px;">IMPORT DEMAND</span>
                <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--amber);">${U(R)}${oe?' <span style="font-weight:400;color:var(--text-dim);font-size:10px;">('+oe+")</span>":""}</span>
            </div>`,i+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-dim);letter-spacing:0.5px;">SELF-SUFFICIENCY BALANCE</span>
                <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${ee===null?"var(--text-dim)":ee>0?"var(--green)":ee<0?"var(--red)":"var(--text-dim)"};">${ee===null?"—":(ee>0?"+":"")+U(ee)}</span>
            </div>`,i+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-dim);letter-spacing:0.5px;">TRADE CASHFLOW</span>
                <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${F>0?"var(--green)":F<0?"var(--red)":"var(--text-dim)"};">${F===0?"—":(F>0?"+":"")+U(F)}</span>
            </div>`,i+=`<div style="margin-top:8px;">
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--red);letter-spacing:0.5px;margin-bottom:4px;">IMPORTING: ${U(j)}${pe?" ("+pe+")":""}</div>`,mo.length>0)for(const V of mo){const Lt=(K||[]).find(Bt=>Bt.id===V.exporter_nation_id)?.name||"Unknown",nt=he(V.trade_volume,d.key),Mt=vo(V.exporter_nation_id,d.key);i+=`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:2px 0 2px 12px;">
                        <span style="font-size:12px;color:var(--text-secondary);">• ${v(Lt)}</span>
                        <span style="display:flex;align-items:center;gap:8px;">
                            ${ht(Mt)}
                            <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${U(V.trade_volume)}${nt?' <span style="font-size:9px;">('+nt+")</span>":""}</span>
                        </span>
                    </div>`}else j>0?i+='<div style="font-size:11px;color:var(--text-dim);font-style:italic;padding-left:12px;">Distributed across multiple trading partners</div>':i+='<div style="font-size:11px;color:var(--text-dim);font-style:italic;padding-left:12px;">No imports</div>';if(i+="</div>",W>0&&(i+=`<div style="display:flex;justify-content:space-between;padding:4px 0;margin-top:4px;border-top:1px solid rgba(42,42,36,0.2);">
                    <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--red);letter-spacing:0.5px;">UNMET DEMAND</span>
                    <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--red);">${U(W)}${po?' <span style="font-weight:400;font-size:9px;">('+po+")</span>":""}</span>
                </div>`),i+=`<div style="margin-top:8px;">
                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--green);letter-spacing:0.5px;margin-bottom:4px;">EXPORTING: ${U(D)}${ot?" ("+ot+")":""}</div>`,uo.length>0)for(const V of uo){const Lt=(K||[]).find(Bt=>Bt.id===V.importer_nation_id)?.name||"Unknown",nt=he(V.trade_volume,d.key),Mt=vo(V.importer_nation_id,d.key);i+=`<div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:2px 0 2px 12px;">
                        <span style="font-size:12px;color:var(--text-secondary);">• ${v(Lt)}</span>
                        <span style="display:flex;align-items:center;gap:8px;">
                            ${ht(Mt)}
                            <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${U(V.trade_volume)}${nt?' <span style="font-size:9px;">('+nt+")</span>":""}</span>
                        </span>
                    </div>`}else D>0?i+='<div style="font-size:11px;color:var(--text-dim);font-style:italic;padding-left:12px;">Distributed across multiple trading partners</div>':i+='<div style="font-size:11px;color:var(--text-dim);font-style:italic;padding-left:12px;">No exports</div>';i+="</div>",i+="</div>"}}a.length===0&&(i+='<div class="tr-econ-empty">No commodities · no production data yet</div>'),i+="</div></div>",i+='<div style="display:flex;gap:6px;">',i+=`<div class="tr-panel" style="flex:1;padding:12px 14px;">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--green);margin-bottom:8px;">SURPLUSES</div>`;for(const d of n.slice(0,5)){const g=d.statBased?Number(d.netFlow).toFixed(0):U(d.netFlow);i+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:13px;color:var(--text-dim);">${d.icon} ${v(d.name)}</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--green);">+${g}</span>
        </div>`}n.length===0&&(i+='<div style="font-size:13px;color:var(--text-dim);font-style:italic;">None</div>'),i+="</div>",i+=`<div class="tr-panel" style="flex:1;padding:12px 14px;">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--red);margin-bottom:8px;">DEFICITS</div>`;for(const d of r.slice(0,5)){const g=d.statBased?Number(d.netFlow).toFixed(0):U(d.netFlow);i+=`<div style="display:flex;justify-content:space-between;margin-bottom:4px;">
            <span style="font-size:13px;color:var(--text-dim);">${d.icon} ${v(d.name)}</span>
            <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--red);">${g}</span>
        </div>`}r.length===0&&(i+='<div style="font-size:13px;color:var(--text-dim);font-style:italic;">None</div>'),i+="</div>",i+="</div>";const u=[{key:"energy",icon:"⚡",name:"Energy",under:[{label:"Standard of Living",delta:-.1},{label:"Public Approval",delta:-.1},{label:"Industry",delta:-.1}],over:[{label:"Standard of Living",delta:.05},{label:"Cost of Living",delta:-.05},{label:"Public Approval",delta:.05},{label:"Service Sector",delta:.05}]},{key:"minerals",icon:"⛏",name:"Minerals",under:[{label:"Infrastructure",delta:-.1},{label:"Industry",delta:-.1},{label:"GDP Growth",delta:-.1}],over:[{label:"Standard of Living",delta:.05},{label:"Infrastructure",delta:.05},{label:"Industry",delta:.05},{label:"GDP Growth",delta:.05}]},{key:"food",icon:"🌾",name:"Food",under:[{label:"Health",delta:-.2},{label:"Public Approval",delta:-.2},{label:"Unrest",delta:.2},{label:"Crime",delta:.1},{label:"Unskilled Workers",delta:-.1}],over:[{label:"Health",delta:.1},{label:"Public Approval",delta:.1},{label:"Standard of Living",delta:.05},{label:"Cost of Living",delta:-.05}]}],f=new Set(["Cost of Living","Unrest","Crime"]),_=d=>(d>0?"+":"")+d.toFixed(2).replace(/\.?0+$/,g=>g.includes(".")?g.replace(/0+$/,""):""),m=(d,g)=>g===0?"var(--text-dim)":(f.has(d)?g<0:g>0)?"var(--green)":"var(--red)";i+=`<div class="tr-econ-effects-block">
        <div class="tr-econ-effects-header">DEMAND EFFECTS · PER TICK</div>`;for(const d of u)i+=`<div class="tr-econ-effects-good">
            <div class="tr-econ-effects-good-name">${d.icon} ${v(d.name)}</div>
            <div class="tr-econ-effects-cols">
                <div class="tr-econ-effects-col">
                    <div class="tr-econ-effects-col-head under">If demand not met</div>
                    ${d.under.map(g=>`<div class="tr-econ-effects-row">
                        <span class="label">${v(g.label)}</span>
                        <span class="value" style="color:${m(g.label,g.delta)};">${_(g.delta)}</span>
                    </div>`).join("")}
                </div>
                <div class="tr-econ-effects-col">
                    <div class="tr-econ-effects-col-head over">If supply ≥ 120%</div>
                    ${d.over.map(g=>`<div class="tr-econ-effects-row">
                        <span class="label">${v(g.label)}</span>
                        <span class="value" style="color:${m(g.label,g.delta)};">${_(g.delta)}</span>
                    </div>`).join("")}
                </div>
            </div>
        </div>`;i+='<div class="tr-econ-effects-placeholder">More commodity effects unlock as demand models land.</div>',i+="</div>",e.innerHTML=i,e.onclick=d=>{const g=d.target.closest(".tr-commodity-row");if(!g||g.dataset.statbased==="1")return;const x=g.dataset.sector;vt=vt===x?null:x,Ht=vt,to(),Ee()}}let Pe=[],ct=[],wt={},Rt=null;async function St(){const e=q?.nation?.id;if(!e)return;const[t,o]=await Promise.all([p.from("trade_agreements").select("*").or(`nation_a_id.eq.${e},nation_b_id.eq.${e}`).order("enacted_at_tick",{ascending:!1}),p.from("trade_negotiations").select("id, nation_a_id, nation_b_id, status, agreement_type, opened_at_tick, approved_by_a, approved_by_b, last_seen_at_a, last_seen_at_b").or(`nation_a_id.eq.${e},nation_b_id.eq.${e}`).in("status",["open","active","ratification"]).order("opened_at_tick",{ascending:!1})]);Pe=t.data||[],ct=o.data||[];const a=ct.map(r=>r.id),n={};if(a.length>0){const{data:r,error:i}=await p.from("negotiation_messages").select("negotiation_id, sender_nation_id, created_at").in("negotiation_id",a).neq("sender_nation_id",e).eq("is_system",!1).order("created_at",{ascending:!1});i&&console.warn("[loadTradeAgreements] unread-state fetch failed:",i.message);const l={};for(const s of r||[])l[s.negotiation_id]||(l[s.negotiation_id]=s.created_at);for(const s of ct){const u=s.nation_a_id===e?s.last_seen_at_a:s.last_seen_at_b,f=l[s.id];f&&(!u||new Date(f)>new Date(u))&&(n[s.id]=!0)}}wt=n,await va()}let Ie={};async function va(){Ie={};const e=(Pe||[]).filter(a=>a.status==="active").map(a=>a.id);if(e.length===0)return;const{data:t,error:o}=await p.from("shipping_contracts").select(`
            id, trade_agreement_id, status, winner_faction_id, revenue_per_tick,
            volume_required, delivery_priority, expires_at_tick, commodity,
            consecutive_missed_payments,
            winner:factions!winner_faction_id(faction_name, abbreviation),
            shipping_contract_bids!contract_id(energy_per_tick, route_risk_delta, status)
        `).in("trade_agreement_id",e);if(o){console.warn("[diplomacy] agreement shipping contracts fetch failed:",o.message);return}for(const a of t||[]){if(!a.trade_agreement_id)continue;const n=(a.shipping_contract_bids||[]).find(l=>l.status==="accepted"),r=Number(n?.energy_per_tick)||0,i=Ie[a.trade_agreement_id]||[];i.push({id:a.id,status:a.status,energy_per_tick:r,volume_required:Number(a.volume_required)||0,delivery_priority:a.delivery_priority||null,expires_at_tick:Number(a.expires_at_tick)||null,commodity:a.commodity||null,winner_faction_id:a.winner_faction_id,winner_faction_name:a.winner?.faction_name||null,revenue_per_tick:Number(a.revenue_per_tick)||0,consecutive_missed_payments:Number(a.consecutive_missed_payments)||0}),Ie[a.trade_agreement_id]=i}}function Ut(e){const o=(Ie[e]||[]).filter(r=>r.status==="awarded");if(o.length===0)return null;const a=[],n=new Set;for(const r of o)!r.winner_faction_id||n.has(r.winner_faction_id)||(n.add(r.winner_faction_id),a.push({name:r.winner_faction_name||"Corp",color:"#5cc55c"}));return{routeCount:o.length,corps:a,hasLogistics:a.length>0}}function Ze(){const e=document.getElementById("trade-agreements-row");if(!e)return;const t=q?.nation?.id,o=q?.shard?.current_tick||0,a=Pe,n=a.filter(s=>s.status==="active"),r=a.filter(s=>s.status!=="active");let i=`<div class="tr-panel">
        <div class="tr-panel-header">
            <span class="tr-panel-title">AGREEMENTS</span>
            <span style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${n.length} active${r.length>0?" · "+r.length+" expired":""}</span>
        </div>`;const l=ct||[];for(const s of l){const c=s.nation_a_id===t?s.nation_b_id:s.nation_a_id,u=(K||[]).find(N=>N.id===c),f=u?.name||"Unknown",_=q?.nation?.name||"Your Nation",m=q?.nation?.flag_url||`assets/flags/${_}.png`,d=u?.flag_url||`assets/flags/${f}.png`,g=s.status==="ratification",x=!g&&!!s.approved_by_a&&!!s.approved_by_b,I=!!wt[s.id];let $,E,T,w,S;g?(E="RATIFICATION",$="var(--green)",T="rgba(92,204,92,0.08)",w="rgba(92,204,92,0.2)",S="var(--green)"):x?(E="READY TO RATIFY",$="var(--teal)",T="rgba(90,175,165,0.08)",w="rgba(90,175,165,0.25)",S="var(--teal)"):(E="ONGOING",$="var(--amber)",T="rgba(184,134,11,0.08)",w="rgba(184,134,11,0.2)",S="var(--amber)"),i+=`<div style="padding:12px 18px;border-bottom:1px solid var(--border-main);cursor:pointer;border-left:3px solid ${S};"
            onclick="openTradeNegModal('${c}')">
            <div style="display:flex;justify-content:space-between;align-items:center;">
                <div style="display:flex;align-items:center;gap:8px;">
                    ${I?'<span title="New message from the other nation" style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--red);margin-right:4px;flex-shrink:0;"></span>':""}
                    <img src="${v(m)}" alt="" style="width:24px;height:16px;object-fit:cover;border:1px solid var(--border-main);" onerror="this.style.display='none'">
                    <span style="font-size:13px;font-weight:600;color:var(--text-bright);">${v(_)}</span>
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">${g?"Ratification":"Trade Discussions"}</span>
                    <span style="font-size:13px;font-weight:600;color:var(--text-bright);">${v(f)}</span>
                    <img src="${v(d)}" alt="" style="width:24px;height:16px;object-fit:cover;border:1px solid var(--border-main);" onerror="this.style.display='none'">
                </div>
                <span class="tr-badge" style="font-size:10px;padding:3px 10px;color:${$};background:${T};border-color:${w};">${E}</span>
            </div>
        </div>`}a.length===0&&l.length===0&&(i+='<div style="padding:20px;text-align:center;font-family:var(--font-mono);font-size:12px;color:var(--text-dim);font-style:italic;">No trade agreements.</div>');for(let s=0;s<a.length;s++){const c=a[s],u=c.status==="active",f=c.agreement_type==="retaliatory_tariff"||c.agreement_type==="impose_embargo",_=Rt===c.id,m=u?f?"var(--red)":"var(--green)":"var(--text-dim)",d=u?f?"HOSTILE":"ACTIVE":c.status?.toUpperCase()||"ENDED",g=c.nation_a_id===t?c.nation_b_id:c.nation_a_id,I=(K||[]).find(D=>D.id===g)?.name||"Unknown",$=$t[c.agreement_type]||c.agreement_type,E=c.expires_at_tick?Math.max(0,c.expires_at_tick-o):null,T=c.duration_type==="indefinite"?"Ongoing":c.duration_ticks?c.duration_ticks+" ticks":"Unknown",w=Ut(c.id),S=c.agreement_type!=="retaliatory_tariff"&&c.agreement_type!=="impose_embargo",M=Et(g)||{needsShipping:!0},N=S?w?.hasLogistics?`<span class="tr-badge" style="color:var(--green);background:rgba(92,204,92,0.06);border-color:rgba(92,204,92,0.15);font-size:5px;">🚢 ${v(w.corps[0]?.name||"Corp")}</span>`:M.needsShipping?'<span class="tr-badge" style="color:var(--orange);background:rgba(200,136,68,0.06);border-color:rgba(200,136,68,0.15);font-size:5px;">⚠ NO LOGISTICS</span>':'<span class="tr-badge" style="color:var(--green);background:rgba(92,204,92,0.06);border-color:rgba(92,204,92,0.15);font-size:5px;">LAND TRADE</span>':"",A=(c.articles||[]).some(D=>D.article_type==="trade_flow"&&D.data?.commodity==="energy"),B=Ie[c.id]||[],z=B.filter(D=>D.status==="awarded");let R="";if(A){const D=z.reduce((ee,F)=>ee+(Number(F.energy_per_tick)||0),0);z.some(ee=>(Number(ee.consecutive_missed_payments)||0)>0)?R='<span class="tr-badge" style="color:var(--red);background:rgba(200,90,58,0.08);border-color:rgba(200,90,58,0.25);font-size:5px;">⚠ PAYMENT DELAYED</span>':D>0?R=`<span class="tr-badge" style="color:var(--gold,#c8a832);background:rgba(200,168,50,0.08);border-color:rgba(200,168,50,0.25);font-size:5px;">⚡ ${D}/TICK</span>`:R='<span class="tr-badge" style="color:var(--orange);background:rgba(200,136,68,0.06);border-color:rgba(200,136,68,0.15);font-size:5px;">⚡ AWAITING SHIPPING</span>'}if(i+=`<div class="tr-agreement-row" data-ag-id="${c.id}" style="border-left:3px solid ${m};">
            <div class="tr-agreement-header" style="background:${_?"var(--bg-card)":"transparent"};padding:14px 18px;">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${v(c.agreement_name||$)}</span>
                    </div>
                    <div style="display:flex;align-items:center;gap:6px;">
                        ${R}
                        ${N}
                        <span class="tr-badge" style="font-size:11px;padding:3px 10px;color:${m};background:${m}0a;border-color:${m}25;">${d}</span>
                    </div>
                </div>
                <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">
                    ${v(I)} · ${v($)} · ${T}${E!==null?" · "+E+" ticks left":""}
                </div>
            </div>`,_){const D=c.articles||[];if(i+='<div style="padding:0 18px 14px;">',D.length>0){i+='<div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--text-dim);letter-spacing:0.5px;margin:8px 0 6px;">ARTICLES</div>';const F=["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"];for(let W=0;W<D.length;W++){const H=D[W];if(H._struck)continue;const de=F[W]||W+1;let oe,pe;H.article_type?(oe=H.article_type.replace(/_/g," ").toUpperCase(),pe=Uo(H)):H.text?(oe="TEXT",pe=H.text):(oe=Jo?.[H.type]?.label||H.type||"Article",pe=renderTradeArticleSummary(H,t)),i+=`<div style="padding:3px 6px;margin-bottom:2px;background:var(--bg-card);border:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-secondary);">Art. ${de} — ${v(oe)}</div>
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${v(pe||"")}</div>
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
                    ${ht(_o(c.id,g))}
                </div>
            </div>`;const j=Ut(c.id);if(c.agreement_type!=="retaliatory_tariff"&&c.agreement_type!=="impose_embargo"){if(i+=`<div style="margin-top:6px;background:var(--bg-card);border:1px solid var(--border-main);padding:8px 10px;">
                    <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px;">LOGISTICS & TRANSPORT</div>
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Route Efficiency</span>
                        ${ht(_o(c.id,g))}
                    </div>`,j&&j.hasLogistics){for(const F of j.corps)i+=`<div style="display:flex;align-items:center;gap:6px;margin-bottom:3px;">
                            <div style="width:24px;height:24px;background:${F.color}15;border:1px solid ${F.color}33;display:flex;align-items:center;justify-content:center;font-size:12px;">🚢</div>
                            <div style="font-size:9px;font-weight:700;color:var(--text-bright);">${v(F.name)}</div>
                        </div>`;i+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">${j.routeCount} awarded contract${j.routeCount!==1?"s":""}</div>`}else i+='<div style="font-size:11px;color:var(--text-dim);">Awaiting bids — corporations have a 3-tick window to offer; the cheapest / fastest / safest bid wins per agreement preference.</div>';i+="</div>"}if(B.length>0){i+=`<div style="margin-top:6px;background:var(--bg-card);border:1px solid var(--border-main);padding:8px 10px;">
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--text-dim);margin-bottom:6px;">🚢 TRADE SHIPPING</div>`;for(const F of B){let W,H;const de=Number(F.consecutive_missed_payments)||0,oe=(F.commodity||"units").replace(/_/g," ");if(F.status==="awarded"&&F.winner_faction_name)de>0?(W="var(--red)",H=`⚠ ${F.energy_per_tick} ${oe}/tick · ${F.winner_faction_name} · ${de} missed payment${de===1?"":"s"}`):(W="var(--green)",H=`${F.energy_per_tick} ${oe}/tick · ${F.winner_faction_name}`);else if(F.status==="open"){W="var(--amber, #b8860b)";const ot=F.expires_at_tick!=null?Math.max(0,F.expires_at_tick-o):0;H=`Awaiting offers · ${F.volume_required} ${oe}/tick · closes in ${ot} tick${ot===1?"":"s"}`}else F.status==="completed"?(W="var(--text-dim)",H="Completed"):F.status==="cancelled"?(W="var(--text-dim)",H="Cancelled"):(W="var(--text-dim)",H=F.status);const pe=F.delivery_priority?`<span style="font-family:var(--font-mono);font-size:7px;letter-spacing:0.5px;text-transform:uppercase;color:var(--text-dim);padding:1px 5px;border:1px solid var(--border-main);">${v(F.delivery_priority)}</span>`:"";i+=`<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:3px;font-family:var(--font-mono);font-size:10px;">
                        <span style="color:${W};">${v(H)}</span>
                        ${pe}
                    </div>`}i+="</div>"}c.status==="active"&&t&&(c.nation_a_id===t||c.nation_b_id===t)&&(i+=`<div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--border-main);text-align:right;">
                    <button data-action="withdraw-ag" data-ag-id="${c.id}" style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:#c55;background:rgba(197,85,85,0.08);border:1px solid rgba(197,85,85,0.35);padding:6px 16px;cursor:pointer;text-transform:uppercase;">Withdraw</button>
                </div>`),i+="</div>"}i+="</div>"}i+="</div>",e.innerHTML=i,e.onclick=s=>{const c=s.target.closest('[data-action="withdraw-ag"]');if(c){s.stopPropagation(),_a(c.dataset.agId);return}const u=s.target.closest(".tr-agreement-row");if(!u)return;const f=u.dataset.agId;Rt=Rt===f?null:f,Ze()}}let Ft=!1;async function _a(e){if(Ft)return;const t=(Pe||[]).find(n=>n.id===e);if(!t)return;const o=q?.nation?.id;if(t.status!=="active"){alert("This agreement is no longer active.");return}if(!o||t.nation_a_id!==o&&t.nation_b_id!==o){alert("Only a signatory nation can withdraw from this agreement.");return}const a=t.agreement_name||"this trade agreement";if(confirm(`Withdraw from "${a}"?

This ends the agreement immediately and stops trading these resources. Shipping contracts under it are cancelled. This cannot be undone.`)){Ft=!0;try{const{data:n,error:r}=await p.rpc("cancel_trade_agreement",{p_agreement_id:e,p_by_nation_id:o});if(r){alert("Failed to withdraw: "+r.message);return}n&&n.success===!1?alert(n.error||"Failed to withdraw from this agreement."):alert(`Withdrawn from "${a}".`),St().then(()=>{Ze(),Ee()}).catch(()=>{})}finally{Ft=!1}}}let Yt={};async function ba(){Yt={}}function ya(e,t){const o=Yt[e]||{},a=Yt[t]||{};let n=0,r=0;for(const l of Object.keys({...o,...a})){if(l==="food_agriculture"&&(o.grains_staples||a.grains_staples))continue;const s=Number(o[l]?.net_flow)||0,c=Number(a[l]?.net_flow)||0;r++,(s>0&&c<0||s<0&&c>0)&&(n+=Math.min(Math.abs(s),Math.abs(c)))}if(r===0)return 0;const i=Object.values(o).reduce((l,s)=>l+(s.export_capacity||0)+(s.import_demand||0),0)||1;return Math.min(99,Math.round(n/i*200))}function Eo(){const e={energy:0,minerals:0,food:0,consumer_goods:0,luxury_goods:0},t=q?.nation?.id;if(!t)return e;const o=(Pe||[]).filter(a=>a.status==="active");for(const a of o){const n=a.nation_a_id===t?a.nation_b_id:a.nation_a_id;if(!n)continue;const r=Et(n)||{needsShipping:!0},i=!!Ut(a.id)?.hasLogistics,l=(Ie[a.id]||[]).filter(u=>u.status==="awarded"),s=l.length>0;if(!r.needsShipping||i||s)for(const u of a.articles||[]){if(u.article_type!=="trade_flow")continue;const f=u.data||{},_=f.commodity;if(!_||!(_ in e))continue;const m=Number(f.volume)||0;if(m<=0)continue;let d=m;if(_==="energy"&&s&&(d=l.reduce(($,E)=>$+(Number(E.energy_per_tick)||0),0)),d<=0)continue;const g=u.author_nation_id?u.author_nation_id===t:a.nation_a_id===t,x=g?t:n;(f.direction==="a_buys_b"?x:g?n:t)===t?e[_]+=d:e[_]-=d}}return e}function ha(e){const t=e||{},o=Number(t.energy)||0,a=Number(t.infrastructure)||0,n=Number(t.industry)||0,r=Number(t.standard_of_living)||0,i=(Number(t.population)||0)/1e6,l=o/3,s=(a+n)*r*Math.sqrt(i)/3500;return{production:l,demand:s,net:l-s}}function xa(e){const t=e||{},o=Number(t.minerals)||0,a=Number(t.unskilled_workers)||0,n=Number(t.industry)||0,r=Number(t.infrastructure)||0,i=o/3*((a+n)/200),l=r/10+n/16;return{production:i,demand:l,net:i-l}}function wa(e){const t=e||{},o=Number(t.farmland)||0,a=Number(t.unskilled_workers)||0,n=(Number(t.population)||0)/1e6,r=o/2*(a/100),i=n/3;return{production:r,demand:i,net:r-i}}function $a(e){const t=e||{},o=Number(t.industry)||0,a=Number(t.unskilled_workers)||0,n=Number(t.standard_of_living)||0,r=(Number(t.population)||0)/1e6,i=o/3*(a/100),l=n/100*r/2;return{production:i,demand:l,net:i-l}}function ka(e){const t=e||{},o=Number(t.standard_of_living)||0,a=Number(t.education)||0,n=Number(t.service_sector)||0,r=(Number(t.population)||0)/1e6,i=o/6*(a*n/1e4),l=Math.pow(o/100,2)*r;return{production:i,demand:l,net:i-l}}function Ia(e){const t=(K||[]).find(r=>r.id===e),o=[],a=[],n=[{sector:"energy",icon:"⚡",name:"Energy",balance:ha(t)},{sector:"minerals",icon:"⛏",name:"Minerals",balance:xa(t)},{sector:"food",icon:"🌾",name:"Food",balance:wa(t)},{sector:"consumer_goods",icon:"📦",name:"Consumer Goods",balance:$a(t)},{sector:"luxury_goods",icon:"💎",name:"Luxury Goods",balance:ka(t)}];for(const r of n){const i=r.balance.net;if(i===0)continue;const l={sector:r.sector,icon:r.icon,name:r.name,amount:Math.abs(i),statBased:!0};i>0?o.push(l):a.push(l)}return{surpluses:o,deficits:a}}let qt=null,_t="compatibility";function Ee(){const e=document.getElementById("trade-right");if(!e)return;const t=q?.nation?.id;if(!t){e.innerHTML="";return}const o=(K||[]).filter(s=>s.id!==t),a=De||[],n=o.map(s=>{const c=ya(t,s.id),u=t<s.id?t:s.id,f=t<s.id?s.id:t,_=a.find(g=>g.nation_a_id===u&&g.nation_b_id===f),m=_?Number(_.relation_score??0):0;let d="Neutral";return m>=60?d="Friendly":m>=30?d="Warm":m>=-10?d="Neutral":m>=-40?d="Cold":d="Hostile",{...s,compat:c,relLabel:d,relScore:m}});_t==="compatibility"?n.sort((s,c)=>c.compat-s.compat):n.sort((s,c)=>s.name.localeCompare(c.name));const r={Friendly:"var(--green)",Warm:"var(--green)",Neutral:"var(--blue)",Cold:"var(--blue)",Hostile:"var(--red)"},i=Ht;let l=`<div class="tr-panel" style="padding:8px 14px;display:flex;justify-content:space-between;align-items:center;">
        <div style="display:flex;align-items:center;gap:8px;">
            <span class="tr-panel-title">TRADE PARTNERS</span>`;i&&(l+=`<div style="display:flex;align-items:center;gap:4px;padding:2px 8px;background:var(--bg-card);border:1px solid var(--border-main);">
            <span style="font-size:9px;">${Io[i]||""}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-bright);">${v(It[i]||i)}</span>
            <span class="tr-filter-clear" style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);cursor:pointer;margin-left:4px;">✕</span>
        </div>`),l+=`</div>
        <div style="display:flex;gap:3px;">
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-right:4px;">SORT:</span>
            <div class="tr-sort-btn${_t==="compatibility"?" active":""}" data-sort="compatibility">COMPATIBILITY</div>
            <div class="tr-sort-btn${_t==="name"?" active":""}" data-sort="name">NAME</div>
        </div>
    </div>`;for(const s of n){const c=r[s.relLabel]||"var(--text-dim)",u=qt===s.id,{surpluses:f,deficits:_}=Ia(s.id);let m=!0,d=null;if(i){const T=se[i],w=Number(T?.net_flow)||0,S=_.find(N=>N.sector===i),M=f.find(N=>N.sector===i);w>0&&S?d="export":w<0&&M?d="import":m=!1}const g=s.compat>=75?"var(--green)":s.compat>=50?"var(--amber)":"var(--orange)",x=s.flag_url||`assets/flags/${s.name}.png`,I=s.name.slice(0,2).toUpperCase(),$=Number(s.population||0),E=$>=1e6?($/1e6).toFixed(1)+"M":$.toLocaleString();if(l+=`<div class="tr-partner-card${u?" expanded":""}" data-nation="${s.id}" style="opacity:${i&&!m?"0.3":"1"};border-color:${u?c+"44":""};">
            <div class="tr-partner-header">
                <div style="display:flex;align-items:center;gap:10px;">
                    <img src="${v(x)}" alt="" style="width:36px;height:24px;object-fit:cover;border:1px solid var(--border-main);" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
                    <div style="width:36px;height:24px;background:${c}10;border:1px solid ${c}33;display:none;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:9px;font-weight:700;color:${c};">${I}</div>
                    <div>
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-size:13px;font-weight:700;color:var(--text-bright);">${v(s.name)}</span>
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
            </div>`,u){const T=Object.entries(se).filter(([,A])=>(A.import_demand||0)>(A.export_capacity||0)).map(([A])=>A),w=Object.entries(se).filter(([,A])=>(A.export_capacity||0)>(A.import_demand||0)).map(([A])=>A);l+=`<div style="border-top:1px solid var(--border-main);">
                <div style="display:flex;">
                    <div style="flex:1;padding:14px 18px;border-right:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--teal);margin-bottom:6px;display:flex;align-items:center;gap:5px;"><span style="width:7px;height:7px;background:var(--teal);"></span>THEY CAN OFFER</div>`;for(const A of f.slice(0,6)){const B=T.includes(A.sector),z=A.statBased?Number(A.amount).toFixed(0):U(A.amount);l+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(42,42,36,0.15);">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:13px;">${A.icon}</span>
                        <span style="font-size:13px;color:var(--text-bright);font-weight:${B?"700":"400"};">${v(A.name)}</span>
                        ${B?'<span class="tr-badge" style="color:var(--green);background:rgba(92,204,92,0.06);border-color:rgba(92,204,92,0.15);font-size:8px;">MATCH</span>':""}
                    </div>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--teal);">${z}<span style="font-weight:400;color:var(--text-dim);font-size:10px;">/mo</span></span>
                </div>`}f.length===0&&(l+='<div style="font-size:12px;color:var(--text-dim);font-style:italic;">No surpluses</div>'),l+=`</div><div style="flex:1;padding:14px 18px;">
                        <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--green);margin-bottom:6px;display:flex;align-items:center;gap:5px;"><span style="width:7px;height:7px;background:var(--green);"></span>THEY NEED</div>`;for(const A of _.slice(0,6)){const B=w.includes(A.sector),z=A.statBased?Number(A.amount).toFixed(0):U(A.amount);l+=`<div style="display:flex;justify-content:space-between;padding:4px 0;border-bottom:1px solid rgba(42,42,36,0.15);">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:13px;">${A.icon}</span>
                        <span style="font-size:13px;color:var(--text-bright);font-weight:${B?"700":"400"};">${v(A.name)}</span>
                        ${B?'<span class="tr-badge" style="color:var(--green);background:rgba(92,204,92,0.06);border-color:rgba(92,204,92,0.15);font-size:8px;">MATCH</span>':""}
                    </div>
                    <span style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--green);">${z}<span style="font-weight:400;color:var(--text-dim);font-size:10px;">/mo</span></span>
                </div>`}_.length===0&&(l+='<div style="font-size:12px;color:var(--text-dim);font-style:italic;">No deficits</div>'),l+="</div></div>";const S=(Pe||[]).filter(A=>A.status==="active"&&(A.nation_a_id===s.id||A.nation_b_id===s.id));if(S.length>0){l+=`<div style="padding:10px 18px;border-top:1px solid var(--border-main);">
                    <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:var(--green);letter-spacing:1px;margin-bottom:6px;">ACTIVE TRADE AGREEMENTS</div>`;for(const A of S){const B=$t[A.agreement_type]||A.agreement_type,z=A.duration_type==="permanent"?"Permanent":A.expires_at_tick?A.expires_at_tick-(q?.shard?.current_tick||0)+" ticks left":"";l+=`<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(42,42,36,0.1);">
                        <div style="display:flex;align-items:center;gap:6px;">
                            <span style="font-size:11px;font-weight:600;color:var(--text-bright);">${v(A.agreement_name||B)}</span>
                            <span class="tr-badge" style="font-size:7px;color:var(--green);background:rgba(92,204,92,0.06);border-color:rgba(92,204,92,0.15);">ACTIVE</span>
                        </div>
                        <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${z}</span>
                    </div>`}l+="</div>"}const N=ct.some(A=>A.nation_a_id===s.id||A.nation_b_id===s.id)?`<div class="tr-action-btn tr-action-btn--primary" onclick="event.stopPropagation();openTradeNegModal('${s.id}');">TRADE DISCUSSIONS</div>`:`<div class="tr-action-btn tr-action-btn--primary" onclick="event.stopPropagation();openTradeNegModal('${s.id}');">DRAFT TRADE AGREEMENT</div>`;l+=`<div style="padding:10px 18px;border-top:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:flex-end;gap:6px;">
                <div class="tr-action-btn" onclick="event.stopPropagation();selectWorldNation('${s.id}');_diploActiveSubtab='world';renderDiploSubtabs();showDiploSubtab();">NATION INFO</div>
                ${N}
            </div>`,l+="</div>"}l+="</div>"}e.innerHTML=l,e.onclick=s=>{const c=s.target.closest(".tr-sort-btn");if(c){_t=c.dataset.sort,Ee();return}if(s.target.closest(".tr-filter-clear")){Ht=null,to(),Ee();return}const u=s.target.closest(".tr-partner-card");if(u&&!s.target.closest(".tr-action-btn")){const f=u.dataset.nation;qt=qt===f?null:f,Ee()}}}let h=null,we=null,k=0,L=[],b=null,$e=null,ke=null;const Gt=["#5cb85c","#c8a64e","#5aafa5","#d9534f","#8b7ec8","#5b9bd5","#e07b53","#7bc67e","#c7697a","#59c4d4","#b8a038","#9a8ec2"];async function So(e){const{data:t}=await p.from("ipo_members").select("chat_color").eq("org_id",e).eq("is_active",!0),o=(t||[]).map(a=>a.chat_color).filter(Boolean);return Gt.find(a=>!o.includes(a))||Gt[0]}const Ea=["◈","⬡","▲","◆","⬢","⊕"];function ze(e,t,o){const a=t+(o?" "+o:"");return e.logo_image_url?`<img src="${v(e.logo_image_url)}" alt="" class="${a} ipo-logo-img" />`:`<span class="${a}">${v(e.logo_symbol)} ${v(e.logo_text)}</span>`}const Sa={Melizea:"assets/flags/Melizea.png",Avelia:"assets/flags/Avelia.png",Sangreza:"assets/flags/sangreza.png",Montequilla:"assets/flags/Montequilla.png","San Estrella":"assets/flags/sanestrella.png",Palvera:"assets/flags/Palvera.png",Calveth:"assets/flags/Calveth.png",Flandis:"assets/flags/Flandis.png",Vostia:"assets/flags/Vostia.png",Sierramar:"assets/flags/Sierramar.png",Hajjara:"assets/flags/Hajjara.png",Dravka:"assets/flags/Dravka.png",Danwei:"assets/flags/Danwei.png"};async function Aa(){const e=document.getElementById("world-map-panel");let t=document.getElementById("world-map-img");if(!e||!t)return;try{const m=t.getAttribute("src")||"";if(m){const d=await fetch(m);if(d.ok){const g=await d.text(),I=new DOMParser().parseFromString(g,"image/svg+xml").documentElement;if(I&&I.tagName.toLowerCase()==="svg"){const $=document.importNode(I,!0);$.id="world-map-img",$.removeAttribute("width"),$.removeAttribute("height"),$.style.cssText="display:block;transform-origin:0 0;width:100%;height:auto;pointer-events:none;",t.replaceWith($),t=$}}}}catch(m){console.warn("[WorldMap] inline-SVG upgrade failed, using <img> fallback:",m?.message||m)}let o=1,a=0,n=0,r=!1,i=0,l=0;const s=1,c=4;function u(){const m=e.clientWidth,d=e.clientHeight,g=t.getBoundingClientRect(),x=g.width,I=g.height;x<=m?a=0:a=Math.max(m-x,Math.min(0,a)),I<=d?n=0:n=Math.max(d-I,Math.min(0,n))}function f(){u(),t.style.transform=`translate(${a}px, ${n}px) scale(${o})`;const m=document.getElementById("map-zoom-label");m&&(m.textContent=Math.round(o*100)+"%")}e.addEventListener("wheel",m=>{m.preventDefault();const d=e.getBoundingClientRect(),g=m.clientX-d.left,x=m.clientY-d.top,I=o,$=m.deltaY>0?.9:1.1;o=Math.max(s,Math.min(c,o*$)),a=g-(g-a)*(o/I),n=x-(x-n)*(o/I),f()},{passive:!1}),e.addEventListener("mousedown",m=>{r=!0,i=m.clientX-a,l=m.clientY-n,e.style.cursor="grabbing"}),window.addEventListener("mousemove",m=>{r&&(a=m.clientX-i,n=m.clientY-l,f())}),window.addEventListener("mouseup",()=>{r=!1,e.style.cursor="grab"});let _=0;e.addEventListener("touchstart",m=>{m.touches.length===1?(r=!0,i=m.touches[0].clientX-a,l=m.touches[0].clientY-n):m.touches.length===2&&(_=Math.hypot(m.touches[0].clientX-m.touches[1].clientX,m.touches[0].clientY-m.touches[1].clientY))},{passive:!0}),e.addEventListener("touchmove",m=>{if(m.touches.length===1&&r)a=m.touches[0].clientX-i,n=m.touches[0].clientY-l,f();else if(m.touches.length===2){const d=Math.hypot(m.touches[0].clientX-m.touches[1].clientX,m.touches[0].clientY-m.touches[1].clientY);_>0&&(o=Math.max(s,Math.min(c,o*(d/_))),f()),_=d}},{passive:!0}),e.addEventListener("touchend",()=>{r=!1,_=0}),document.getElementById("map-zoom-in")?.addEventListener("click",()=>{o=Math.min(c,o*1.25),f()}),document.getElementById("map-zoom-out")?.addEventListener("click",()=>{o=Math.max(s,o*.8),f()}),document.getElementById("map-zoom-reset")?.addEventListener("click",()=>{o=1,a=0,n=0,f()}),f()}let Wt=null;function Na(e,t){if(!document.getElementById("world-highlight-body")||!e.length)return;const a=t.nation?.id;K=e,q=t;const n=e.find(r=>r.id===a);n?Ao(n.id):oo(e,a)}function oo(e,t,o){const a=document.getElementById("world-nations-grid");if(!a)return;const r=(o?e.filter(l=>l.name.toLowerCase().includes(o.toLowerCase())):e).map(l=>{const s=l.id===t,c=l.id===Wt,u=["wn-grid-cell"];c&&u.push("is-selected"),s&&u.push("is-you");const f=l.flag_url||`assets/flags/${l.name}.png`;return`<div class="${u.join(" ")}" data-nation-id="${l.id}">
            <img class="wn-grid-flag" src="${f}" alt="" onerror="this.style.display='none'">
            <div class="wn-grid-info">
                <div class="wn-grid-name">${v(l.name)}${s?" (You)":""}${c?" ◀":""}</div>
                <div class="wn-grid-gov">${v(l.government_type||"")}</div>
            </div>
        </div>`}).join("");a.innerHTML=r||'<div class="wn-grid-empty">No nations match your search.</div>',a.dataset.clickBound||(a.addEventListener("click",l=>{const s=l.target.closest("[data-nation-id]");s&&Ao(s.dataset.nationId)}),a.dataset.clickBound="1");const i=document.getElementById("world-nation-search");i&&!i._wired&&(i._wired=!0,i.addEventListener("input",()=>{oo(e,t,i.value)}))}let K=[],q=null,De=null,Xt=null;async function Ao(e){const t=K.find(i=>i.id===e);if(!t)return;const o=q.nation?.id,a=t.id===o;if(Wt=e,oo(K,o),!De){const[i,l]=await Promise.all([p.from("diplomatic_relations").select("*"),p.from("trade_agreements").select("*").eq("status","active")]);De=i.data||[],Xt=l.data||[]}const r={gov:await Ta(t.id),tradeData:null};Oa(t,q,De,Xt,r),!a&&o&&Ca(o,t.id).then(i=>{if(Wt!==e)return;const l=document.getElementById("world-trade-section");l&&(l.innerHTML=No(i))}).catch(i=>{console.error("[World] Bilateral trade fetch failed:",i)})}async function Ta(e){try{const[t,o,a,n,r]=await Promise.all([p.from("head_of_government").select("first_name, last_name, faction_id").eq("nation_id",e).eq("active",!0).limit(1).maybeSingle(),p.from("presidents").select("first_name, last_name, faction_id").eq("nation_id",e).eq("is_active",!0).limit(1).maybeSingle(),p.from("government_formations").select("party_ids, ministry_assignments, proposed_by, status").eq("nation_id",e).in("status",["formed","caretaker"]).order("formed_at",{ascending:!1}).limit(1).maybeSingle(),p.from("active_crises").select("crisis_id, crisis_templates(name)").eq("nation_id",e),p.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",e).order("seats",{ascending:!1})]),i=r.data||[],l={};for(const I of i)l[I.id]=I;const c=(K.find(I=>I.id===e)?.government_type||"").toLowerCase().includes("presidential"),u=o.data,f=t.data;let _=null,m=null;c&&u?(_={name:`${u.first_name} ${u.last_name}`,title:"President"},m=l[u.faction_id]||null):f?(_={name:`${f.first_name} ${f.last_name}`,title:"Prime Minister"},m=l[f.faction_id]||null):u&&(_={name:`${u.first_name} ${u.last_name}`,title:"President"},m=l[u.faction_id]||null);const d=a.data;let g=[];d&&d.party_ids&&(g=d.party_ids.map(I=>l[I]).filter(Boolean));const x=(n.data||[]).map(I=>I.crisis_templates?.name||"Unknown Crisis").filter(Boolean);return{leader:_,leaderParty:m,coalitionParties:g,crises:x}}catch(t){return console.error("[World] fetchNationGovernmentData failed:",t),{leader:null,leaderParty:null,coalitionParties:[],crises:[]}}}async function Ca(e,t){return{exportsToThem:{},importsFromThem:{},totalExports:0,totalImports:0,balance:0,tick:q.shard?.current_tick||0}}const $t={fta:"Free Trade Agreement",free_trade:"Free Trade Agreement",pta:"Preferential Trade",preferential_trade:"Preferential Trade",goods_trade:"Goods & Services Trade Agreement",resource_supply:"Resource Supply Contract",export_subsidy:"Export Subsidy",economic_aid:"Economic Aid",stockpile_purchase:"Stockpile Purchase",retaliatory_tariff:"Retaliatory Tariff",impose_embargo:"Embargo"},Pa=new Set(["trade_flow","transfer","market_access","tariff_reduction","exit_terms"]);function At(e,t){const o=(e||[]).filter(n=>(n.article_type||n.type)!=="duration");return o.length===0?t||null:o.every(n=>Pa.has(n.article_type||n.type))&&(t==="fta"||t===null||t===void 0||t==="pending")?"goods_trade":t}function No(e){if(!e)return'<div class="world-trade-loading">Loading trade data…</div>';if(e.totalExports===0&&e.totalImports===0)return'<div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);font-style:italic;">No active trade routes.</div>';const t=new Set([...Object.keys(e.exportsToThem),...Object.keys(e.importsFromThem)]),o=[];for(const l of t){const s=e.exportsToThem[l]||0,c=e.importsFromThem[l]||0;o.push({sector:l,exp:s,imp:c,total:s+c})}o.sort((l,s)=>s.total-l.total);let a=`<table class="world-trade-table">
        <thead><tr><th>Sector</th><th>Exports</th><th>Imports</th><th>Net</th></tr></thead><tbody>`;for(const l of o){const s=l.exp-l.imp,c=s>0?"trade-positive":s<0?"trade-negative":"trade-zero",u=s>0?"+":"";a+=`<tr>
            <td>${v(It[l.sector]||l.sector)}</td>
            <td>${U(l.exp)}</td>
            <td>${U(l.imp)}</td>
            <td class="${c}">${u}${U(s)}</td>
        </tr>`}a+="</tbody></table>";const n=e.balance,r=n>0?"trade-positive":n<0?"trade-negative":"trade-zero",i=n>0?"+":"";return a+=`<div class="world-trade-balance">
        <span class="world-trade-balance-label">Trade Balance</span>
        <span class="world-trade-balance-value ${r}">${i}${U(n)}</span>
    </div>`,a+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">
        Total exports: ${U(e.totalExports)} &middot;
        Total imports: ${U(e.totalImports)}
    </div>`,a}function Oa(e,t,o,a,n){const r=document.getElementById("world-highlight-body");if(!r)return;const i=t.nation?.id,l=e.id===i,s=n?.gov||{},c=n?.tradeData,u=Number(e.population||0),f=u>=1e6?(u/1e6).toFixed(1)+"M":u.toLocaleString(),_=e.flag_url||`assets/flags/${e.name}.png`;let m=`<div class="world-hl-header-row">
        <img class="world-hl-flag" src="${v(_)}" alt="" onerror="this.style.display='none'">
        <div>
            <div class="world-highlight-name">${v(e.name)}${l?' <span style="font-family:var(--font-mono);font-size:8px;color:var(--green);font-weight:700;">YOU</span>':""}</div>
            <div class="world-highlight-meta">${v(e.government_type||"Unknown")}</div>
        </div>
    </div>`;if(s.leader){const w=s.leaderParty?.abbreviation||s.leaderParty?.faction_name||"",S=s.leaderParty?.party_color||"var(--text-dim)";m+=`<div style="margin:6px 0 4px;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${S};">
            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-transform:uppercase;letter-spacing:0.06em;margin-bottom:3px;">${v(s.leader.title)}</div>
            <div style="font-size:14px;font-weight:700;color:var(--text-bright);">${v(s.leader.name)} <span style="font-family:var(--font-mono);font-size:11px;color:${S};font-weight:700;">${w?"["+v(w)+"]":""}</span></div>
        </div>`}if(s.coalitionParties&&s.coalitionParties.length>0){m+='<div style="display:flex;flex-wrap:wrap;gap:4px;margin:6px 0 4px;">';for(const w of s.coalitionParties){const S=w.party_color||"#888";m+=`<span style="font-family:var(--font-mono);font-size:7px;padding:2px 6px;border:1px solid ${S};color:${S};letter-spacing:0.03em;">${v(w.abbreviation||w.faction_name)}${w.seats?" · "+w.seats:""}</span>`}m+="</div>"}m+='<div class="world-highlight-section">KEY STATS</div>';const d=e.state_apparatus??0,g=d>=50?"var(--green)":d>=30?"var(--amber)":"var(--red)",x=[{label:"Population",value:f},{label:"State Apparatus",value:d.toFixed(1),color:g}];if(m+=x.map(w=>`<div class="world-highlight-stat-row">
        <span class="world-highlight-stat-label">${v(w.label)}</span>
        <span class="world-highlight-stat-value" style="${w.color?"color:"+w.color:""}">${w.value}</span>
    </div>`).join(""),s.crises&&s.crises.length>0){m+=`<div class="world-highlight-stat-row">
            <span class="world-highlight-stat-label">Active Crises</span>
            <span class="world-highlight-stat-value" style="color:var(--red);">${s.crises.length}</span>
        </div>`;for(const w of s.crises)m+=`<div style="font-family:var(--font-mono);font-size:8px;color:var(--red);padding:1px 0 1px 8px;">⚠ ${v(w)}</div>`}else m+=`<div class="world-highlight-stat-row">
            <span class="world-highlight-stat-label">Active Crises</span>
            <span class="world-highlight-stat-value" style="color:var(--green);">None</span>
        </div>`;let I=null,$=null;if(!l&&i){const w=i<e.id?i:e.id,S=i<e.id?e.id:i,M=(o||[]).find(N=>N.nation_a_id===w&&N.nation_b_id===S);M&&(I=Number(M.relation_score??0),$=Number(M.proximity??0))}if(!l&&I!==null){let w="",S="var(--text-dim)";I>=60?(w="FRIENDLY",S="var(--green)"):I>=30?(w="WARM",S="var(--green)"):I>=-10?(w="NEUTRAL",S="var(--amber)"):I>=-40?(w="COOL",S="var(--orange)"):(w="HOSTILE",S="var(--red)"),m+='<div class="world-highlight-section">DIPLOMATIC RELATIONS</div>',m+=`<div class="world-highlight-stat-row">
            <span class="world-highlight-stat-label">Relation Score</span>
            <span class="world-highlight-stat-value" style="color:${S};">${I} — ${w}</span>
        </div>`,$!==null&&(m+=`<div class="world-highlight-stat-row">
                <span class="world-highlight-stat-label">Proximity</span>
                <span class="world-highlight-stat-value">${$}</span>
            </div>`)}const E=l?[]:(a||[]).filter(w=>w.nation_a_id===i&&w.nation_b_id===e.id||w.nation_a_id===e.id&&w.nation_b_id===i),T=l?(a||[]).filter(w=>w.nation_a_id===e.id||w.nation_b_id===e.id):[];if(!l&&E.length>0){m+=`<div class="world-highlight-section">ACTIVE AGREEMENTS (${E.length})</div>`;for(const w of E){const S=$t[w.agreement_type]||w.agreement_type,M=w.agreement_type==="retaliatory_tariff"||w.agreement_type==="impose_embargo";m+=`<div style="padding:4px 0;border-bottom:1px solid var(--border-light);">
                <div style="font-size:9px;font-weight:600;color:${M?"var(--red)":"var(--text-bright)"};">${v(w.agreement_name||S)}</div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">${v(S)}</div>
            </div>`}}else!l&&E.length===0&&(m+='<div class="world-highlight-section">AGREEMENTS</div>',m+='<div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);font-style:italic;">No active agreements.</div>');if(l&&T.length>0){m+=`<div class="world-highlight-section">YOUR AGREEMENTS (${T.length})</div>`;for(const w of T.slice(0,8)){const S=w.nation_a_id===e.id?w.nation_b_id:w.nation_a_id,M=K.find(A=>A.id===S),N=$t[w.agreement_type]||w.agreement_type;m+=`<div style="padding:3px 0;border-bottom:1px solid var(--border-light);">
                <div style="font-size:9px;font-weight:600;color:var(--text-bright);">${v(w.agreement_name||N)}</div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">with ${v(M?.name||"Unknown")} · ${v(N)}</div>
            </div>`}T.length>8&&(m+=`<div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:4px;">+ ${T.length-8} more</div>`)}l||(m+='<div class="world-highlight-section">BILATERAL TRADE</div>',m+=`<div id="world-trade-section">${No(c)}</div>`),r.innerHTML=m}Wo("diplomacy",async e=>{h=e.faction||null,we=e.nation||null,We();const t=(window._ipoPendingInviteCount||0)+(window._ipoPendingVoteCount||0);t>0&&To(t),ho().then(()=>We()).catch(()=>{}),Aa();try{const{data:o}=await p.from("nations").select("*").order("name");Na(o||[],e)}catch(o){console.error("[World] Failed to load nations:",o)}});function To(e){zt=e||0,typeof We=="function"&&We(),window._ipoPendingInviteCount=e}async function Co(e){const[t,o]=await Promise.all([p.from("international_orgs").select("*").eq("id",e).single(),p.from("ipo_members").select("id, faction_id, role, factions:faction_id ( id, faction_name, nation_id )").eq("org_id",e).eq("is_active",!0)]),a=t.data;if(!a)return null;const n=o.data||[],r=a.charter||{},i=a.description||r.description||"No description provided.",l=[...new Set(n.map(m=>m.factions?.nation_id).filter(Boolean))],s={};if(l.length>0){const{data:m}=await p.from("nations").select("id, name").in("id",l);(m||[]).forEach(d=>{s[d.id]=d.name})}const u=n.find(m=>m.faction_id===a.president_id)?.factions?.faction_name||"Unknown",f=n.map(m=>{const d=m.factions;if(!d)return"";const g=s[d.nation_id]||"",x=m.faction_id===a.president_id,I=x?"★ President":m.role==="observer"?"Observer":"Member",$=x?"ipo-preview-member-role ipo-preview-member-role--president":"ipo-preview-member-role";return'<div class="ipo-preview-member"><span class="ipo-preview-member-name">'+v(d.faction_name)+"</span>"+(g?'<span class="ipo-preview-member-nation"> · '+v(g)+"</span>":"")+'<span class="'+$+'">'+I+"</span></div>"}).join(""),_=`
        <div class="ipo-preview-header">
            ${ze(a,"ipo-header-logo","")}
            <div class="ipo-preview-header-info">
                <div class="ipo-header-name">${v(a.name)}</div>
                <div class="ipo-header-meta">
                    <span>${n.length} member${n.length!==1?"s":""}</span>
                    <span>President: ${v(u)}</span>
                    <span>Est. Tick ${a.founded_at_tick}</span>
                </div>
            </div>
        </div>
        <div class="ipo-preview-desc">${v(i)}</div>
        <div class="ipo-preview-section-label">Members</div>
        <div class="ipo-preview-members">${f||'<div style="color:var(--text-dim);font-size:12px;">No members.</div>'}</div>`;return{org:a,members:n,headerHtml:_}}async function La(e,t){const o=document.getElementById("ipo-main");if(o){o.innerHTML='<div class="ipo-main-placeholder"><span class="ipo-main-placeholder-text">Loading organisation details...</span></div>';try{const a=await Co(e);if(!a){o.innerHTML='<div class="ipo-main-placeholder"><span class="ipo-main-placeholder-text">Organisation not found.</span></div>';return}o.innerHTML=`
            <div class="ipo-preview">
                ${a.headerHtml}
                <div class="ipo-preview-actions" style="margin-top:16px;display:flex;gap:8px;">
                    <button class="ipo-btn ipo-btn--accept" onclick="acceptIPOInvite('${t}')">Accept Invitation</button>
                    <button class="ipo-btn ipo-btn--decline" onclick="declineIPOInvite('${t}')">Decline</button>
                </div>
            </div>`}catch(a){console.error("[IPO] Preview invite org error:",a),o.innerHTML='<div class="ipo-main-placeholder"><span class="ipo-main-placeholder-text">Failed to load organisation.</span></div>'}}}async function Po(e){const t=document.getElementById("ipo-main");if(t){t.innerHTML='<div class="ipo-main-placeholder"><span class="ipo-main-placeholder-text">Loading organisation details...</span></div>',b=null,document.querySelectorAll(".ipo-sidebar-item.is-active").forEach(o=>o.classList.remove("is-active"));try{const o=await Co(e);if(!o){t.innerHTML='<div class="ipo-main-placeholder"><span class="ipo-main-placeholder-text">Organisation not found.</span></div>';return}const{data:a}=await p.from("ipo_votes").select("id").eq("org_id",e).eq("vote_type","membership").eq("status","open").eq("proposed_by",h.id).limit(1).maybeSingle();let n="";a?n='<button class="ipo-btn" disabled style="opacity:0.5;">Request Pending...</button>':n=`<button class="ipo-btn ipo-btn--create-large" onclick="requestToJoinOrg('${e}')">Request to Join</button>`,t.innerHTML=`
            <div class="ipo-preview">
                ${o.headerHtml}
                <div class="ipo-preview-actions" style="margin-top:16px;display:flex;gap:8px;">
                    ${n}
                </div>
            </div>`}catch(o){console.error("[IPO] Preview existing org error:",o),t.innerHTML='<div class="ipo-main-placeholder"><span class="ipo-main-placeholder-text">Failed to load organisation.</span></div>'}}}async function Ma(e){if(!P){P=!0;try{const{data:t}=await p.from("international_orgs").select("id, name, charter, president_id").eq("id",e).single();if(!t){alert("Organisation not found.");return}const o=t.charter?.membership?.admission||"vote",{data:a}=await p.from("ipo_votes").select("id").eq("org_id",e).eq("vote_type","membership").eq("status","open").eq("proposed_by",h.id).limit(1).maybeSingle();if(a){alert("You already have a pending join request for this organisation.");return}const n=t.charter?.membership?.joinRequestRole||"member";if(!await ut(e)){alert(`This organisation already has ${et} open votes. Please try again later.`);return}if(o==="vote"){const{error:r}=await p.from("ipo_votes").insert({org_id:e,title:`Admit ${h.faction_name} as ${n}`,vote_type:"membership",meta:{target_faction_id:h.id,target_faction_name:h.faction_name,requested_role:n,join_request:!0},status:"open",opened_at_tick:k,closes_at_tick:k+Qe,proposed_by:h.id});if(r){console.error("[IPO] Vote insert failed:",r.message),alert("Failed to create join request. You may not have permission.");return}const{error:i}=await p.from("ipo_chat").insert({org_id:e,faction_id:null,is_system:!0,message_text:`${h.faction_name} has requested to join as ${n}. A membership vote has been opened.`,tick_posted:k});i&&console.error("[IPO] Chat insert failed:",i.message),alert("Your request has been submitted. The organisation will vote on your membership.")}else{const{error:r}=await p.from("ipo_votes").insert({org_id:e,title:`Admit ${h.faction_name} as ${n}`,vote_type:"membership",meta:{target_faction_id:h.id,target_faction_name:h.faction_name,requested_role:n,join_request:!0,president_decides:!0},status:"open",opened_at_tick:k,closes_at_tick:k+Qe,proposed_by:h.id});if(r){console.error("[IPO] Vote insert failed:",r.message),alert("Failed to create join request. You may not have permission.");return}const{error:i}=await p.from("ipo_chat").insert({org_id:e,faction_id:null,is_system:!0,message_text:`${h.faction_name} has requested to join as ${n}. The President will decide on admission.`,tick_posted:k});i&&console.error("[IPO] Chat insert failed:",i.message),alert("Your request has been submitted. The President will decide on your admission.")}await Po(e)}catch(t){console.error("[IPO] Request to join error:",t),alert("Failed to submit join request.")}finally{P=!1}}}async function ie(){const e=document.getElementById("ipo-view");if(!e||!h)return;try{const{data:f,error:_}=await p.from("ipo_members").select(`
                id, role, joined_at_tick, chat_color,
                org:international_orgs (
                    id, name, logo_symbol, logo_text, logo_image_url, description,
                    founded_at_tick, founding_party_id,
                    president_id, president_term_start_tick, emergency_power_used_tick,
                    headquarters_nation_id, solidarity_fund_balance,
                    charter, is_active,
                    symposium_cooldown_remaining, pending_symposium
                )
            `).eq("faction_id",h.id).eq("is_active",!0);_?(console.error("[IPO] Failed to load memberships:",_.message),L=[]):L=(f||[]).filter(m=>m.org&&m.org.is_active)}catch(f){console.error("[IPO] Membership fetch error:",f),L=[]}const t={},o=L.map(f=>f.org.id);if(o.length>0){const{data:f}=await p.from("ipo_members").select("org_id").in("org_id",o).eq("is_active",!0);(f||[]).forEach(_=>{t[_.org_id]=(t[_.org_id]||0)+1})}if(L.length>0){const f=L.some(_=>_.org.id===b);(!b||!f)&&(b=L[0].org.id)}else b=null;let a=[];try{const{data:f}=await p.from("ipo_invitations").select(`
                id, invited_role, invited_at_tick, status,
                org:international_orgs ( id, name, logo_symbol, logo_text, logo_image_url ),
                inviter:invited_by ( id, faction_name )
            `).eq("target_faction_id",h.id).in("status",["pending"]);a=f||[]}catch{}let n=[];try{const f=L.map(m=>m.org.id),{data:_}=await p.from("international_orgs").select("id, name, logo_symbol, logo_text, logo_image_url, description, president_id, charter").eq("is_active",!0).order("name");if(n=(_||[]).filter(m=>!f.includes(m.id)),n.length>0){const m=n.map(g=>g.id),{data:d}=await p.from("ipo_members").select("org_id").in("org_id",m).eq("is_active",!0);(d||[]).forEach(g=>{t[g.org_id]=(t[g.org_id]||0)+1})}}catch{}const r={};let i=0;if(o.length>0)try{const{data:f}=await p.from("ipo_votes").select("id, org_id").in("org_id",o).eq("status","open");if(f&&f.length>0){const _=f.map(x=>x.id),{data:m}=await p.from("ipo_ballots").select("vote_id").in("vote_id",_).eq("faction_id",h.id),d=new Set((m||[]).map(x=>x.vote_id)),g=new Set(L.filter(x=>x.role==="member").map(x=>x.org.id));for(const x of f)!d.has(x.id)&&g.has(x.org_id)&&(r[x.org_id]=(r[x.org_id]||0)+1,i++)}}catch{}const l=L.map(f=>{const _=f.org,m=_.id===b,d=t[_.id]||1,g=_.president_id===h.id?"President":f.role==="observer"?"Observer":"Member",x=r[_.id]||0,I=x>0?`<span class="badge badge--amber" style="margin-left:auto;flex-shrink:0;font-size:9px;min-width:16px;text-align:center;padding:1px 5px;">${x}</span>`:"";return`
            <div class="ipo-sidebar-item ${m?"is-active":""}"
                 onclick="selectIPOOrg('${_.id}')">
                ${ze(_,"ipo-sidebar-logo",m?"is-active":"")}
                <div class="ipo-sidebar-info" style="flex:1;min-width:0;">
                    <span class="ipo-sidebar-name ${m?"is-active":""}">${v(_.name)}</span>
                    <span class="ipo-sidebar-meta">${d} member${d!==1?"s":""} · ${g}</span>
                </div>
                ${I}
            </div>`}).join(""),s=a.map(f=>{const _=f.org,m=f.inviter?.faction_name||"Unknown";return`
            <div class="ipo-sidebar-invite">
                <div class="ipo-sidebar-invite-header">
                    ${ze(_,"ipo-sidebar-logo","")}
                    <span class="ipo-sidebar-name">${v(_.name)}</span>
                </div>
                <span class="ipo-sidebar-invite-from">Invited by ${v(m)} · ${f.invited_role}</span>
                <div class="ipo-sidebar-invite-actions">
                    <button class="ipo-btn ipo-btn--accept" onclick="acceptIPOInvite('${f.id}')">Accept</button>
                    <button class="ipo-btn ipo-btn--decline" onclick="declineIPOInvite('${f.id}')">Decline</button>
                    <button class="ipo-btn ipo-btn--view" onclick="previewIPOInviteOrg('${_.id}','${f.id}')">View</button>
                </div>
            </div>`}).join("");let c="";n.length>0&&(c=`
            <div class="ipo-sidebar-header" style="margin-top:8px;">
                <span class="ipo-sidebar-dot" style="background:var(--damber);"></span>
                <span class="ipo-sidebar-label">EXISTING ORGANISATIONS</span>
            </div>
            <div class="ipo-sidebar-list">${n.map(_=>{const m=t[_.id]||1;return`
                <div class="ipo-sidebar-item" onclick="previewExistingOrg('${_.id}')">
                    ${ze(_,"ipo-sidebar-logo","")}
                    <div class="ipo-sidebar-info">
                        <span class="ipo-sidebar-name">${v(_.name)}</span>
                        <span class="ipo-sidebar-meta">${m} member${m!==1?"s":""}</span>
                    </div>
                </div>`}).join("")}</div>`);let u="";L.length===0?u=`
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
            </div>`:u=await Ba(t),e.innerHTML=`
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
            ${u}
        </div>`,To(a.length+i),b&&L.length>0&&(Ra(b),te(b).then(()=>Ne()))}async function Ba(e){const t=L.find(R=>R.org.id===b);if(!t)return`<div class="ipo-main-placeholder">
            <span class="ipo-main-placeholder-text">Select an organisation from the sidebar.</span>
        </div>`;const o=t.org,a=o.charter||{},n=a.leadership||{};a.resources;const r=o.president_id===h.id,i=t.role==="observer",l=e[o.id]||1,[s,c,u,f]=await Promise.all([o.headquarters_nation_id?p.from("nations").select("name").eq("id",o.headquarters_nation_id).single():Promise.resolve({data:null}),p.from("factions").select("faction_name").eq("id",o.president_id).single(),p.from("ipo_members").select("id, faction_id, role, factions:faction_id ( id, faction_name, nation_id, seats )").eq("org_id",o.id).eq("is_active",!0),p.from("nations").select("id, name").order("name")]),_=s.data?.name||null,m=c.data?.faction_name||"Unknown",d=u.data||[],g=f.data||[],x=Object.fromEntries(g.map(R=>[R.id,R.name])),$={rotation:"Rotation",most_seats:"Most Seats",random:"Random"}[n.type]||"Rotation",E=n.termYears||2,T=`
        <div class="ipo-header">
            ${ze(o,"ipo-header-logo","")}
            <div class="ipo-header-identity">
                <span class="ipo-header-name">${v(o.name)}</span>
                <div class="ipo-header-meta">
                    <span>Est. Tick ${o.founded_at_tick}</span>
                    <span>${l} member${l!==1?"s":""}</span>
                    <span>${$}</span>
                    <span>${E}-Year Term</span>
                </div>
            </div>
            <div class="ipo-header-right">
                <span class="ipo-header-fund">${_?"HQ: "+v(_):"HQ: VACANT"}</span>
                <span class="ipo-header-fund">${v("SOLIDARITY FUND")} · ${C(o.solidarity_fund_balance)}</span>
                <span class="ipo-header-fund">President: ${v(m)}</span>
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
                    placeholder="${i?"Observers cannot send messages.":"Message the "+v(o.name)+"..."}"
                    ${i?"disabled":""}
                    id="ipo-chat-input"
                    onkeydown="if(event.key==='Enter')sendIPOChat()" />
                <button class="ipo-btn ipo-btn--send" onclick="sendIPOChat()" ${i?"disabled":""}>Send</button>
            </div>
        </div>`,M=`
        <div class="ipo-bottom-panels">
            <div class="ipo-panel ipo-panel--charter" id="ipo-panel-charter">
                <div class="ipo-panel-header">
                    <span class="ipo-panel-dot ipo-panel-dot--teal"></span>
                    <span class="ipo-panel-title">Charter</span>
                </div>
                <div class="ipo-panel-body">${Xa(a)}</div>
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
        </div>`,N=d.map(R=>{const D=R.factions?.faction_name||"Unknown",j=R.factions?.nation_id&&x[R.factions.nation_id]||"",ee=R.faction_id===h.id,F=R.faction_id===o.president_id,W=R.role==="observer"?" (OBS)":"",H=F?" ★":"";return`<span class="ipo-footer-badge ${ee?"ipo-footer-badge--you":F?"ipo-footer-badge--president":"ipo-footer-badge--other"}">${H?'<span class="ipo-president-star">'+H+"</span>":""}${v(D)}${W}${ee?" (YOU)":""}${j?" · "+v(j):""}</span>`}).join(""),B=!!a.membership?.expulsionClause&&(a.membership.expulsionClause==="president"?r:!i),z=`
        <div class="ipo-footer">
            <div class="ipo-footer-members">${N}</div>
            <div class="ipo-footer-actions">
                ${i?"":'<button class="ipo-btn ipo-btn--invite" onclick="openIPOInviteModal()">Invite</button>'}
                ${i?"":'<button class="ipo-btn ipo-btn--amend" onclick="openIPOAmendModal()">Amend Charter</button>'}
                ${B?'<button class="ipo-btn ipo-btn--expel" onclick="openIPOExpelModal()">Expel</button>':""}
                <button class="ipo-btn ipo-btn--leave" onclick="leaveIPOOrg()">Leave</button>
            </div>
        </div>`;return T+w+M+z}let me=[],Qt={};async function Ra(e){if(!(!document.getElementById("ipo-chat-messages")||!e)){$e&&(p.removeChannel($e),$e=null);try{const{data:o}=await p.from("ipo_members").select("faction_id, chat_color, factions:faction_id ( faction_name )").eq("org_id",e).eq("is_active",!0);Qt={},(o||[]).forEach(a=>{Qt[a.faction_id]={name:a.factions?.faction_name||"Unknown",color:a.chat_color||"#6b6a5e"}})}catch(o){console.warn("[IPO Chat] Member map error:",o)}try{const{data:o,error:a}=await p.from("ipo_chat").select("id, faction_id, is_system, message_text, tick_posted, created_at").eq("org_id",e).order("created_at",{ascending:!1}).limit(100);a?(console.error("[IPO Chat] Fetch error:",a.message),me=[]):me=(o||[]).reverse()}catch(o){console.error("[IPO Chat] Fetch exception:",o),me=[]}Jt(),$e=p.channel("ipo_chat_"+e).on("postgres_changes",{event:"INSERT",schema:"public",table:"ipo_chat",filter:"org_id=eq."+e},o=>{const a=o.new;me.find(n=>n.id===a.id)||(me.push(a),Jt())}).subscribe()}}function Jt(){const e=document.getElementById("ipo-chat-messages");if(e){if(me.length===0){e.innerHTML='<div class="ipo-chat-system">— No messages yet —</div>';return}e.innerHTML=me.map(t=>{if(t.is_system)return`<div class="ipo-chat-system">— ${v(t.message_text)} —</div>`;const o=Qt[t.faction_id],a=o?.name||"Unknown",n=o?.color||"#6b6a5e",r=Fa(t.created_at);return`<div class="ipo-chat-msg">
            <span class="ipo-chat-msg-party" style="color:${n};">${v(a)}</span>
            <span class="ipo-chat-msg-text">${v(t.message_text)}</span>
            <span class="ipo-chat-msg-time">${r}</span>
        </div>`}).join(""),e.scrollTop=e.scrollHeight}}function Fa(e){if(!e)return"";const t=new Date(e),a=(new Date-t)/1e3;return a<60?"now":a<3600?Math.floor(a/60)+"m":a<86400?Math.floor(a/3600)+"h":t.toLocaleDateString("en-GB",{day:"numeric",month:"short"})}async function qa(){const e=document.getElementById("ipo-chat-input");if(!e||!h||!b)return;const t=e.value.trim();if(!t)return;const o=L.find(a=>a.org.id===b);if(!(!o||o.role==="observer")){e.value="",e.disabled=!0;try{const{data:a,error:n}=await p.from("ipo_chat").insert({org_id:b,faction_id:h.id,is_system:!1,message_text:t,tick_posted:k}).select();if(n)console.error("[IPO Chat] Send error:",n.message,n.code,n.details),e.value=t,alert("Message failed to send: "+n.message);else if(!a||a.length===0)console.error("[IPO Chat] Send returned no data — RLS may have blocked the insert"),e.value=t,alert("Message may not have been saved. Please try again.");else{const r=a?.[0];r&&!me.find(i=>i.id===r.id)&&(me.push(r),Jt())}}catch(a){console.error("[IPO Chat] Send exception:",a),e.value=t}finally{e.disabled=!1,e.focus()}}}async function za(){if(!h||!b)return;const e=L.find($=>$.org.id===b);if(!e||e.role==="observer")return;const{data:t,error:o}=await p.from("ipo_members").select("faction_id").eq("org_id",b).eq("is_active",!0);o&&console.error("[IPO Invite] Members query error:",o.message);const a=new Set((t||[]).map($=>$.faction_id)),{data:n,error:r}=await p.from("ipo_invitations").select("target_faction_id, status, responded_at_tick").eq("org_id",b);r&&console.error("[IPO Invite] Invitations query error:",r.message);const i={};(n||[]).forEach($=>{(!i[$.target_faction_id]||$.status==="pending"||$.status==="vote_pending")&&(i[$.target_faction_id]=$)});const l=10,{data:s,error:c}=await p.from("factions").select("id, faction_name, nation_id").eq("faction_type","party").is("abandoned_at",null).order("faction_name");c&&console.error("[IPO Invite] Factions query error:",c.message);const u=s||[],f=[...new Set(u.map($=>$.nation_id).filter(Boolean))],_={};if(f.length>0){const{data:$}=await p.from("nations").select("id, name").in("id",f);($||[]).forEach(E=>{_[E.id]=E.name})}function m($){if(a.has($.id))return'<span class="ipo-invite-badge ipo-invite-badge--accepted">Accepted</span>';const E=i[$.id];if(!E)return"";if(E.status==="pending"||E.status==="vote_pending")return'<span class="ipo-invite-badge ipo-invite-badge--invited">Invited</span>';if(E.status==="declined"){const T=k-(E.responded_at_tick||0);if(T<l)return'<span class="ipo-invite-badge ipo-invite-badge--rejected">Rejected · '+(l-T)+" Tick Cooldown</span>"}return""}function d($){if(a.has($.id))return!0;const E=i[$.id];return E?E.status==="pending"||E.status==="vote_pending"||E.status==="declined"&&k-(E.responded_at_tick||0)<l:!1}const g=u.find($=>!d($)),x=u.map($=>{const E=_[$.nation_id]?' <span style="color:var(--text-dim);font-size:12px;">· '+v(_[$.nation_id])+"</span>":"",T=m($),w=d($),S=!w&&g&&$.id===g.id?" selected":"",M=w?" disabled":"";return'<div class="ipo-invite-item'+S+M+'" data-faction-id="'+$.id+'"'+(w?"":' onclick="selectIPOInviteTarget(this)"')+'><div style="display:flex;align-items:center;justify-content:space-between;gap:8px;"><span style="font-size:13px;">'+v($.faction_name)+E+"</span>"+T+"</div></div>"}).join(""),I=document.getElementById("ipo-create-modal-inner");document.getElementById("ipo-create-modal").classList.add("active"),I.innerHTML=`
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
        </div>`}function Da(e){e.classList.contains("disabled")||(document.querySelectorAll("#ipo-invite-list .ipo-invite-item.selected").forEach(t=>t.classList.remove("selected")),e.classList.add("selected"),document.getElementById("ipo-invite-target").value=e.dataset.factionId)}async function ja(){if(P)return;const e=document.getElementById("ipo-invite-target")?.value,t=document.getElementById("ipo-invite-role")?.value||"member";if(!e){alert("Select a party to invite.");return}P=!0;try{const{error:o}=await p.from("ipo_invitations").insert({org_id:b,invited_by:h.id,target_faction_id:e,invited_role:t,status:"pending",invited_at_tick:k});if(o){o.code==="23505"?alert("This party already has a pending invitation."):alert("Failed to send invitation: "+o.message);return}const{data:a}=await p.from("factions").select("faction_name").eq("id",e).single(),n=a?.faction_name||"A party";await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`${h.faction_name} invited ${n} as ${t}.`,tick_posted:k}),Te(),alert(`Invitation sent to ${n}.`)}catch(o){console.error("[IPO] Invite error:",o),alert("Failed to send invitation.")}finally{P=!1}}async function Ha(){if(!h||!b)return;const e=L.find(c=>c.org.id===b);if(!e)return;const t=e.org,a=(t?.charter||{}).membership?.expulsionClause,n=t.president_id===h.id;if(!a){alert("Expulsion is disabled in this organisation's charter.");return}if(a==="president"&&!n){alert("Only the president can expel members under this charter.");return}const r=be.filter(c=>c.faction_id!==h.id);if(r.length===0){alert("No other members to expel.");return}const i=r.map(c=>{const u=c.role==="observer"?" (Observer)":"";return`<option value="${c.faction_id}">${v(c.factions?.faction_name||"Unknown")}${u}</option>`}).join(""),l=a==="president"?"As president, you can expel a member immediately.":`Expulsion requires a ${a} vote. This will create a vote proposal.`,s=document.getElementById("ipo-create-modal-inner");document.getElementById("ipo-create-modal").classList.add("active"),s.innerHTML=`
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
        </div>`}async function Va(){if(P)return;const e=document.getElementById("ipo-expel-target")?.value;if(!e){alert("Select a member.");return}const a=L.find(i=>i.org.id===b)?.org?.charter?.membership?.expulsionClause,r=be.find(i=>i.faction_id===e)?.factions?.faction_name||"Unknown";if(P=!0,a==="president"){if(!confirm(`Expel ${r} from the organisation? This is immediate and cannot be undone.`))return;try{await p.from("ipo_members").update({is_active:!1,left_at_tick:k}).eq("org_id",b).eq("faction_id",e).eq("is_active",!0),await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`${r} has been expelled by the president.`,tick_posted:k}),await p.from("ipo_action_log").insert({org_id:b,faction_id:h.id,target_faction_id:e,action_type:"expulsion",action_data:{type:"expulsion",target_name:r,by_president:!0},ap_cost:0,performed_at_tick:k}),Te(),ie()}catch(i){console.error("[IPO] Expulsion error:",i),alert("Failed to expel member.")}finally{P=!1}}else try{if(!await ut(b)){alert(`This organisation already has ${et} open votes. Wait for some to close before proposing new ones.`),P=!1;return}await p.from("ipo_votes").insert({org_id:b,title:`Expel ${r}`,vote_type:"expulsion",meta:{target_faction_id:e,target_faction_name:r},status:"open",opened_at_tick:k,closes_at_tick:k+Qe,proposed_by:h.id}),await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`${h.faction_name} proposed to expel ${r}. A vote has been opened.`,tick_posted:k}),Te(),await te(b)}catch(i){console.error("[IPO] Expulsion vote error:",i),alert("Failed to propose expulsion vote.")}finally{P=!1}}async function Ua(){if(!h||!b)return;const t=L.find(n=>n.org.id===b)?.org,o=t?.president_id===h.id;let a="Are you sure you want to leave this organisation? Your solidarity fund contributions will not be returned.";if(o&&(a+=`

You are the PRESIDENT. Leadership will pass to the next eligible member.`),!!confirm(a))try{const{error:n}=await p.from("ipo_members").update({is_active:!1,left_at_tick:k}).eq("org_id",b).eq("faction_id",h.id).eq("is_active",!0);if(n){alert("Failed to leave organisation: "+n.message);return}await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`${h.faction_name} has left the organisation.`,tick_posted:k});const{data:r}=await p.from("ipo_members").select("faction_id, role").eq("org_id",b).eq("is_active",!0),i=(r||[]).filter(l=>l.role==="member");if(!r||r.length===0)await p.from("international_orgs").update({is_active:!1,dissolved_at_tick:k}).eq("id",b),await p.from("ipo_invitations").update({status:"expired",responded_at_tick:k}).eq("org_id",b).in("status",["pending","vote_pending"]),await p.from("ipo_votes").update({status:"failed",resolved_at_tick:k,result:{yes:0,no:0,abstain:0,passed:!1,reason:"Organisation dissolved"}}).eq("org_id",b).eq("status","open"),await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:"Organisation dissolved — no members remaining.",tick_posted:k});else if(o&&i.length>0){const l=i[0].faction_id;await p.from("international_orgs").update({president_id:l,president_term_start_tick:k}).eq("id",b);const{data:s}=await p.from("factions").select("faction_name").eq("id",l).single();await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`${s?.faction_name||"A member"} is now president (previous president departed).`,tick_posted:k})}if(t?.headquarters_nation_id){const{data:l}=await p.from("ipo_members").select("faction_id, factions:faction_id ( nation_id )").eq("org_id",b).eq("is_active",!0);(l||[]).some(c=>c.factions?.nation_id===t.headquarters_nation_id)||(await p.from("international_orgs").update({headquarters_nation_id:null}).eq("id",b),await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:"Headquarters vacated — no member party remains in the HQ nation.",tick_posted:k}))}b=null,ie()}catch(n){console.error("[IPO] Leave org error:",n),alert("Failed to leave organisation.")}}function Ya(e){e!==b&&(b=e,ie())}async function Ga(e){if(h)try{const{data:t,error:o}=await p.from("ipo_invitations").select("id, org_id, invited_role, status").eq("id",e).single();if(o||!t||t.status!=="pending"){alert("This invitation is no longer valid."),ie();return}const{data:a}=await p.from("international_orgs").select("charter").eq("id",t.org_id).single();if((a?.charter?.membership?.admission||"vote")==="vote"&&t.invited_role==="member"){if(!await ut(t.org_id)){alert(`This organisation already has ${et} open votes. Please try again later.`),P=!1;return}await p.from("ipo_invitations").update({status:"vote_pending",responded_at_tick:k}).eq("id",e),await p.from("ipo_votes").insert({org_id:t.org_id,title:`Admit ${h.faction_name}`,vote_type:"membership",meta:{invite_id:e,target_faction_id:h.id,target_faction_name:h.faction_name},status:"open",opened_at_tick:k,closes_at_tick:k+Qe,proposed_by:h.id}),await p.from("ipo_chat").insert({org_id:t.org_id,faction_id:null,is_system:!0,message_text:`${h.faction_name} has applied for membership. A vote has been opened.`,tick_posted:k}),alert("Your application has been submitted. The organisation will vote on your membership.")}else{let r=[{id:h.id,name:h.faction_name}];for(const l of r){const s=await So(t.org_id);await p.from("ipo_members").insert({org_id:t.org_id,faction_id:l.id,role:t.invited_role,joined_at_tick:k,chat_color:s})}await p.from("ipo_invitations").update({status:"accepted",responded_at_tick:k}).eq("id",e);const i=r.length>1?`${h.faction_name} and its ${r.length-1} faction(s) have joined the organisation.`:`${h.faction_name} has joined the organisation.`;await p.from("ipo_chat").insert({org_id:t.org_id,faction_id:null,is_system:!0,message_text:i,tick_posted:k})}ie()}catch(t){console.error("[IPO] Accept invite error:",t),alert("Failed to accept invitation.")}}async function Wa(e){if(h)try{const{data:t}=await p.from("ipo_invitations").select("org_id").eq("id",e).single();await p.from("ipo_invitations").update({status:"declined",responded_at_tick:k}).eq("id",e),t?.org_id&&await p.from("ipo_chat").insert({org_id:t.org_id,faction_id:null,is_system:!0,message_text:`${h.faction_name} declined the invitation to join.`,tick_posted:k}),ie()}catch(t){console.error("[IPO] Decline invite error:",t)}}function Xa(e,t){if(!e||Object.keys(e).length===0)return'<span class="ipo-main-placeholder-text">No charter defined.</span>';const o=[];if(e.mission!=null&&o.push(it("Article I — Mission Statement",`<div class="ipo-charter-text">${v(e.mission)}</div>`)),e.leadership){const a=e.leadership,n={vote:"Vote",rotation:"Rotation",most_seats:"Most Seats",random:"Random"},r={equal:"Equal (one vote per member)",seat_share:"By Seat Share"},i={majority:"Majority (>50%)",unanimous:"Unanimous"};o.push(it("Article II — Leadership",`
            ${Y("Leadership Type",n[a.type]||a.type)}
            ${Y("Succession Term",(a.termYears||2)+" Year"+((a.termYears||2)>1?"s":""))}
            ${Y("Voting Weight",r[a.votingWeight]||a.votingWeight)}
            ${Y("Vote Pass Threshold",i[a.votePass]||a.votePass)}
        `))}if(e.membership){const a=e.membership;let r=Y("New Member Admission",{vote:"Vote Required",president:"President Decides"}[a.admission]||a.admission);if(a.ideologicalThreshold?.enabled&&a.ideologicalThreshold.directions?.length>0){const i=a.ideologicalThreshold.directions.map(l=>`<span class="ipo-charter-tag">${v(l.charAt(0).toUpperCase()+l.slice(1))}</span>`).join(" ");r+=Y("Ideological Requirements",i)}else r+=Y("Ideological Threshold","None");a.expulsionClause?r+=Y("Expulsion Clause",{president:"President Only",majority:"Majority Vote",unanimous:"Unanimous Vote"}[a.expulsionClause]||a.expulsionClause):r+=Y("Expulsion Clause","Disabled"),o.push(it("Article III — Membership",r))}if(e.governance){const a=e.governance,n={unilateral:"Unilateral — any member can execute actions",committee:"Committee — all actions require a vote (funded from solidarity fund)",presidential:"Presidential — only the president can execute actions",delegated:"Delegated — president + officers can act, others must vote",tiered:`Tiered — actions ≤${C(2*O)} are unilateral, higher cost requires a vote`},r={public:"Public Ballot",secret:"Secret Ballot"},i={founding:"Founding Party",president:"Current President",hq:"HQ Nation Party"};o.push(it("Article IV — Transparency & Governance",`
            ${Y("Action Leadership",n[a.actionLeadership]||n.unilateral)}
            ${Y("Vote Transparency",r[a.voteTransparency]||a.voteTransparency)}
            ${Y("Observer Status",a.observerStatus?"Enabled":"Disabled")}
            ${Y("Veto Right",a.vetoRight?i[a.vetoRight]||a.vetoRight:"None")}
            ${Y("Emergency Powers",a.emergencyPowers?"Enabled — President can act once per term without a vote":"Disabled")}
        `))}if(e.resources){const a=e.resources,n={president:"President Alone",vote:"Majority Vote Required"};let r="";if(a.solidarityFund?.enabled){const i=(Number(a.solidarityFund.contributionPerQuarter)||1)*O;r+=Y("Solidarity Fund",C(i)+" / Quarter")}else r+=Y("Solidarity Fund","Disabled");a.resourceSharingCap!=null?r+=Y("Resource Sharing Cap",a.resourceSharingCap+" per member per term"):r+=Y("Resource Sharing Cap","No limit"),r+=Y("Joint Statements",n[a.jointStatementClause]||a.jointStatementClause),r+=Y("Headquarters",a.headquarters?"Active":"Not designated"),o.push(it("Article V — Resources & External Relations",r))}return o.join('<div class="ipo-charter-divider"></div>')}function it(e,t){return`
        <div class="ipo-charter-section">
            <div class="ipo-charter-article-label">${e}</div>
            ${t}
        </div>`}function Y(e,t){return`<div class="ipo-charter-row">
        <span class="ipo-charter-row-label">${e}</span>
        <span class="ipo-charter-row-value">${t}</span>
    </div>`}let G=null,le=null,Ye=null,Ge=null;function Qa(){if(!h||!b)return;const e=L.find(n=>n.org.id===b);if(!e)return;const t=e.org,o=t.charter||{};if(e.role==="observer"){alert("Observers cannot amend the charter.");return}G=[],o.mission!=null&&G.push({type:"mission",config:{text:o.mission}}),o.leadership&&G.push({type:"leadership",config:{...o.leadership}}),o.membership&&G.push({type:"membership",config:JSON.parse(JSON.stringify(o.membership))}),o.governance&&G.push({type:"governance",config:{...o.governance}}),o.resources&&G.push({type:"resources",config:JSON.parse(JSON.stringify(o.resources))}),G.find(n=>n.type==="mission")||G.unshift({type:"mission",config:{text:""}}),le={symbol:t.logo_symbol||"",text:t.logo_text||"",image_url:t.logo_image_url||null},Ye=null,Ge=t.logo_image_url||null,document.getElementById("ipo-create-modal").classList.add("active"),mt()}function mt(){const e=document.getElementById("ipo-create-modal-inner"),t=J;J=G;const o=G.map((c,u)=>Ho(c,u)).join(""),a=new Set(G.map(c=>c.type)),n=Nt.filter(c=>!a.has(c.key)),i=G.length<5&&n.length>0?`
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
                <div>${Ge?`<img src="${v(Ge)}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid var(--border-0);" />`:`<span style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:var(--bg-3);border:1px solid var(--border-0);border-radius:6px;font-family:var(--font-mono);font-size:14px;color:var(--text-dim);">${v((le?.symbol||"")+" "+(le?.text||""))}</span>`}</div>
                <div style="flex:1;">
                    <div style="display:flex;gap:6px;margin-bottom:6px;">
                        <div style="flex:1;">
                            <label style="display:block;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-transform:uppercase;margin-bottom:2px;">Symbol</label>
                            <input type="text" id="ipo-amend-logo-symbol" value="${v(le?.symbol||"")}" maxlength="2" placeholder="🌐"
                                style="width:100%;padding:4px 6px;background:var(--bg-4);border:1px solid var(--border-0);border-radius:3px;color:var(--text-bright);font-size:14px;text-align:center;"
                                oninput="ipoAmendLogo.symbol=this.value">
                        </div>
                        <div style="flex:2;">
                            <label style="display:block;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-transform:uppercase;margin-bottom:2px;">Text</label>
                            <input type="text" id="ipo-amend-logo-text" value="${v(le?.text||"")}" maxlength="6" placeholder="IPO"
                                style="width:100%;padding:4px 6px;background:var(--bg-4);border:1px solid var(--border-0);border-radius:3px;color:var(--text-bright);font-family:var(--font-mono);font-size:11px;"
                                oninput="ipoAmendLogo.text=this.value">
                        </div>
                    </div>
                    <div style="display:flex;gap:6px;align-items:center;">
                        <button onclick="document.getElementById('ipo-amend-logo-file').click()" style="font-family:var(--font-mono);font-size:8px;padding:3px 8px;background:var(--bg-3);border:1px solid var(--border-0);color:var(--text-muted);cursor:pointer;border-radius:2px;">Upload Image</button>
                        ${Ge?'<button onclick="ipoAmendRemoveLogo()" style="font-family:var(--font-mono);font-size:8px;padding:3px 8px;background:none;border:1px solid rgba(217,83,79,0.3);color:var(--red);cursor:pointer;border-radius:2px;">Remove</button>':""}
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
        </div>`,J=t}function Ja(e){const t=e?.files?.[0];if(t){if(t.size>512*1024){alert("Logo must be under 512KB.");return}Ye=t,Ge=URL.createObjectURL(t),mt()}}function Ka(){Ye=null,Ge=null,le&&(le.image_url=null),mt()}function Za(){const e=document.getElementById("ipo-add-article-select");if(!e||!e.value)return;const t=e.value,o={leadership:{type:"rotation",termYears:2,votingWeight:"equal",votePass:"majority"},membership:{admission:"vote",ideologicalThreshold:{enabled:!1,directions:[]},expulsionClause:null},governance:{actionLeadership:"unilateral",voteTransparency:"public",observerStatus:!1,vetoRight:null,emergencyPowers:!1},resources:{solidarityFund:{enabled:!1,contributionPerQuarter:1},resourceSharingCap:null,jointStatementClause:"vote",headquarters:null}};G.push({type:t,config:o[t]||{}});const a=J;J=G,mt(),J=a}function Oo(){document.getElementById("ipo-create-modal").classList.remove("active"),G=null}async function en(){if(!h||!b||!G||P)return;const e={};for(const a of G)switch(a.type){case"mission":e.mission=a.config.text||"";break;case"leadership":e.leadership={type:a.config.type,termYears:Number(a.config.termYears),votingWeight:a.config.votingWeight,votePass:a.config.votePass};break;case"membership":e.membership={admission:a.config.admission,ideologicalThreshold:a.config.ideologicalThreshold||{enabled:!1,directions:[]},expulsionClause:a.config.expulsionClause||null};break;case"governance":e.governance={actionLeadership:a.config.actionLeadership||"unilateral",voteTransparency:a.config.voteTransparency,observerStatus:!!a.config.observerStatus,vetoRight:a.config.vetoRight||null,emergencyPowers:!!a.config.emergencyPowers};break;case"resources":e.resources={solidarityFund:a.config.solidarityFund||{enabled:!1,contributionPerQuarter:1},resourceSharingCap:a.config.resourceSharingCap??null,jointStatementClause:a.config.jointStatementClause||"vote",headquarters:a.config.headquarters==="__self__"?we.id:a.config.headquarters||null};break}e.leadership||(e.leadership={type:"rotation",termYears:2,votingWeight:"equal",votePass:"majority"}),e.membership||(e.membership={admission:"vote",ideologicalThreshold:{enabled:!1,directions:[]},expulsionClause:null}),e.governance||(e.governance={voteTransparency:"public",observerStatus:!1,vetoRight:null,emergencyPowers:!1}),e.resources||(e.resources={solidarityFund:{enabled:!1,contributionPerQuarter:1},resourceSharingCap:null,jointStatementClause:"vote",headquarters:null});const t=G.map(a=>a.type).join(", "),o="Amend charter articles: "+t;P=!0;try{const a=O,n=await He(h.id,a);if(!n.success){alert("Not enough cash. Charter amendments cost "+C(a)+".");return}if(h.party_funds=n.newFunds,!await ut(b)){alert(`This organisation already has ${et} open votes. Wait for some to close.`);return}let r=le?.image_url||null;if(Ye){const m=Ye.name.split(".").pop().toLowerCase(),d=`ipo-logos/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${m}`,{error:g}=await p.storage.from("public-assets").upload(d,Ye,{upsert:!0});if(g){console.error("[IPO] Logo upload error:",g),alert("Failed to upload logo: "+g.message);return}const{data:x}=p.storage.from("public-assets").getPublicUrl(d);r=x?.publicUrl||null}const i={symbol:le?.symbol||"",text:le?.text||"",image_url:r},s=L.find(m=>m.org.id===b)?.org,c=s&&(i.symbol!==(s.logo_symbol||"")||i.text!==(s.logo_text||"")||i.image_url!==(s.logo_image_url||null)),u=[];t&&u.push(t),c&&u.push("logo");const f="Charter Amendment: "+(u.join(", ")||"no changes"),{error:_}=await p.from("ipo_votes").insert({org_id:b,title:f,vote_type:"charter_amendment",meta:{description:o,proposed_charter:e,proposed_logo:i},status:"open",opened_at_tick:k,closes_at_tick:k+Qe,proposed_by:h.id});if(_){console.error("[IPO] Amend charter vote error:",_),alert("Failed to propose charter amendment: "+_.message);return}await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`${h.faction_name} proposed a charter amendment (${t}). Members must vote to approve.`,tick_posted:k}),Oo(),await te(b),ie()}catch(a){console.error("[IPO] Amend error:",a),alert("Failed to propose charter amendment.")}finally{P=!1}}let je=[],Re={},ne=[],be=[],P=!1;const Qe=8,et=5;async function ut(e){const{count:t,error:o}=await p.from("ipo_votes").select("id",{count:"exact",head:!0}).eq("org_id",e).eq("status","open");return o?!0:(t||0)<et}const ao={membership:"Membership",expulsion:"Expulsion",joint_statement:"Joint Statement",fund_draw:"Fund Draw",charter_amendment:"Charter Amendment",change_headquarters:"Change Headquarters",symposium:"Symposium",leadership_election:"Leadership Election",change_logo:"Change Logo"},tn={membership:"Vote to admit a new member party.",expulsion:"Vote to expel a current member.",joint_statement:"Vote to issue a public statement on behalf of the organisation.",fund_draw:"Vote to withdraw cash from the solidarity fund.",charter_amendment:"Vote to amend the organisation charter.",change_headquarters:"Vote to relocate the organisation headquarters.",symposium:"Vote to hold a symposium influencing a nation's ideology.",leadership_election:"Elect a new president from the member parties.",change_logo:"Vote to change the organisation's logo (symbol, text, or image)."};async function te(e){if(!(!document.getElementById("ipo-votes-body")||!e)){try{const{data:o,error:a}=await p.from("ipo_votes").select("*").eq("org_id",e).order("status",{ascending:!0}).order("opened_at_tick",{ascending:!1}).limit(20);if(a){console.error("[IPO Votes] Fetch error:",a.message);return}if(je=o||[],je.length>0){const r=je.map(l=>l.id),{data:i}=await p.from("ipo_ballots").select("*").in("vote_id",r);Re={},(i||[]).forEach(l=>{Re[l.vote_id]||(Re[l.vote_id]=[]),Re[l.vote_id].push(l)})}else Re={};const{data:n}=await p.from("ipo_members").select("faction_id, role, is_active, factions:faction_id ( faction_name, nation_id )").eq("org_id",e).eq("is_active",!0);be=n||[],ne=be.filter(r=>r.role==="member")}catch(o){console.error("[IPO Votes] Load exception:",o)}on(),ke&&(p.removeChannel(ke),ke=null),ke=p.channel("ipo_org_"+e).on("postgres_changes",{event:"*",schema:"public",table:"ipo_votes",filter:"org_id=eq."+e},()=>{te(e).then(()=>Ne())}).on("postgres_changes",{event:"INSERT",schema:"public",table:"ipo_ballots"},()=>{te(e)}).on("postgres_changes",{event:"*",schema:"public",table:"ipo_members",filter:"org_id=eq."+e},()=>{te(e).then(()=>Ne())}).on("postgres_changes",{event:"UPDATE",schema:"public",table:"international_orgs",filter:"id=eq."+e},()=>{ie()}).subscribe()}}function Lo(e,t){const o={};let a=0;for(const i of e){if(i.ballot==="abstain"){a++;continue}o[i.ballot]=(o[i.ballot]||0)+1}let n=null,r=0;for(const[i,l]of Object.entries(o))(l>r||l===r&&i===t)&&(r=l,n=i);return n||(n=t),{voteTally:o,abstainCount:a,winnerId:n,maxVotes:r}}function on(){const e=document.getElementById("ipo-votes-body");if(!e)return;if(je.length===0){e.innerHTML='<div class="ipo-votes-empty">No votes yet. Use <strong>+ Propose</strong> to start one.</div>';return}const t=L.find(s=>s.org.id===b),a=t?.org?.charter||{},n=a.governance||{};a.leadership;const r=n.voteTransparency==="secret",i=t?.role==="observer",l=[...je].sort((s,c)=>s.status==="open"&&c.status!=="open"?-1:s.status!=="open"&&c.status==="open"?1:c.opened_at_tick-s.opened_at_tick);e.innerHTML=l.map(s=>{const c=Re[s.id]||[],u=c.find(N=>N.faction_id===h.id),f=s.status==="open",_=s.status==="passed",m=ao[s.vote_type]||s.vote_type,d=s.vote_type==="leadership_election",g=s.meta&&s.meta.candidates||[],x=ne.length,I=c.length;let $="";if(d){const{voteTally:N,abstainCount:A}=Lo(c,null);for(const z of g)N[z.faction_id]===void 0&&(N[z.faction_id]=0);$=`<div class="ipo-vote-tally ipo-election-tally">
                ${g.map(z=>{const R=N[z.faction_id]||0,D=I>0?R/I*100:0;return`<div class="ipo-election-candidate-row">
                    <span class="ipo-election-candidate-name">${v(z.faction_name)}</span>
                    <div class="ipo-election-candidate-bar"><div class="ipo-election-candidate-fill" style="width:${D}%"></div></div>
                    <span class="ipo-election-candidate-count">${R}</span>
                </div>`}).join("")}
                <div class="ipo-vote-tally-labels">
                    <span class="ipo-vote-tally-label--abstain">${A} Abstain</span>
                    <span class="ipo-vote-tally-label--total">${I}/${x}</span>
                </div>
            </div>`}else{const N=c.filter(j=>j.ballot==="yes").length,A=c.filter(j=>j.ballot==="no").length,B=c.filter(j=>j.ballot==="abstain").length,z=I>0?N/I*100:0,R=I>0?A/I*100:0,D=I>0?B/I*100:0;$=`<div class="ipo-vote-tally">
                <div class="ipo-vote-tally-bar">
                    <div class="ipo-vote-tally-seg ipo-vote-tally-seg--yes" style="width:${z}%"></div>
                    <div class="ipo-vote-tally-seg ipo-vote-tally-seg--no" style="width:${R}%"></div>
                    <div class="ipo-vote-tally-seg ipo-vote-tally-seg--abstain" style="width:${D}%"></div>
                </div>
                <div class="ipo-vote-tally-labels">
                    <span class="ipo-vote-tally-label--yes">${N} Yes</span>
                    <span class="ipo-vote-tally-label--no">${A} No</span>
                    <span class="ipo-vote-tally-label--abstain">${B} Abstain</span>
                    <span class="ipo-vote-tally-label--total">${I}/${x}</span>
                </div>
            </div>`}let E;if(f){const N=s.closes_at_tick-k;E=`<span class="ipo-vote-badge ipo-vote-badge--open">OPEN · ${N>0?N+" ticks left":"closing..."}</span>`}else _?E='<span class="ipo-vote-badge ipo-vote-badge--passed">PASSED</span>':E='<span class="ipo-vote-badge ipo-vote-badge--failed">FAILED</span>';const T=an(s);let w="";if(f&&!i)if(u)if(d){const N=g.find(B=>B.faction_id===u.ballot),A=u.ballot==="abstain"?"ABSTAIN":N?.faction_name||u.ballot;w=`<div class="ipo-vote-my-ballot">Your vote: <strong>${v(A)}</strong></div>`}else w=`<div class="ipo-vote-my-ballot">Your vote: <strong>${u.ballot.toUpperCase()}</strong></div>`;else if(d){const N=g.map(A=>`<button class="ipo-vote-btn ipo-vote-btn--candidate" onclick="selectIPOBallot('${s.id}','${A.faction_id}')" data-candidate-name="${v(A.faction_name)}">${v(A.faction_name)}</button>`).join("");w=`
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
                    </div>`;let S="";!r&&c.length>0&&(!f||u)&&(d?S='<div class="ipo-vote-voters">'+c.map(N=>{const B=ne.find(D=>D.faction_id===N.faction_id)?.factions?.faction_name||"Unknown";if(N.ballot==="abstain")return`<span class="ipo-vote-voter ipo-vote-voter--abstain">${v(B)}: Abstain</span>`;const R=g.find(D=>D.faction_id===N.ballot)?.faction_name||"Unknown";return`<span class="ipo-vote-voter ipo-vote-voter--yes">${v(B)} → ${v(R)}</span>`}).join("")+"</div>":S='<div class="ipo-vote-voters">'+c.map(N=>{const B=ne.find(z=>z.faction_id===N.faction_id)?.factions?.faction_name||"Unknown";return`<span class="ipo-vote-voter ipo-vote-voter--${N.ballot}">${v(B)}: ${N.ballot}</span>`}).join("")+"</div>");let M="";return f&&!i&&(I>=x||k>=s.closes_at_tick)&&(M=`<button class="ipo-vote-btn ipo-vote-btn--resolve" onclick="resolveIPOVote('${s.id}')">Resolve Vote</button>`),`
            <div class="ipo-vote-card ${f?"ipo-vote-card--open":""} ${_?"ipo-vote-card--passed":""} ${s.status==="failed"?"ipo-vote-card--failed":""}">
                <div class="ipo-vote-card-header">
                    <span class="ipo-vote-type-badge">${m}</span>
                    ${E}
                </div>
                <div class="ipo-vote-card-title">${v(s.title)}</div>
                ${T}
                ${$}
                ${S}
                ${w}
                ${M}
            </div>`}).join("")}function an(e){const t=e.meta||{};let o="";switch(e.vote_type){case"membership":{const a=t.target_faction_name||"a party",n=t.requested_role==="observer"?"an observer":"a member";o=`Admit <strong>${v(a)}</strong> as ${n}.`;break}case"expulsion":{const a=t.target_faction_name||"a member";o=`Expel <strong>${v(a)}</strong> from the organisation.`;break}case"joint_statement":if(t.statement_text){const a=v(t.statement_text);t.statement_text.length>120?o=`<div class="ipo-statement-text">
                        <span class="ipo-statement-preview">"${v(t.statement_text.substring(0,120))}…"</span>
                        <span class="ipo-statement-full">"${a}"</span>
                        <button class="ipo-statement-toggle" onclick="this.parentElement.classList.toggle('expanded'); this.textContent = this.parentElement.classList.contains('expanded') ? 'Show less' : 'Read more'">Read more</button>
                    </div>`:o=`"${a}"`}break;case"fund_draw":o=`<strong>${v(t.proposer_name||"A member")}</strong> requests <strong>${C(t.amount_requested||0)}</strong> from the solidarity fund.`,t.purpose&&(o+=`<br><span style="color:var(--text-muted);font-size:0.8em;">Purpose: ${v(t.purpose)}</span>`);break;case"charter_amendment":o=`Amend <strong>${t.article_type||"charter"}</strong>: ${v((t.description||"").substring(0,100))}`;break;case"change_headquarters":o=`Relocate HQ to <strong>${v(t.proposed_nation_name||"a new nation")}</strong>.`;break;case"symposium":o=`Hold symposium in <strong>${v(t.target_nation_name||"a nation")}</strong> (${t.axis||"ideology"} ${t.direction||""}).`;break;case"leadership_election":{const a=(t.candidates||[]).length;o=`Elect the next president from <strong>${a}</strong> candidate${a!==1?"s":""}.`;break}case"change_logo":{const a=t.proposed_logo||{},r=L.find(s=>s.org.id===e.org_id||s.org.id===b)?.org,i={logo_symbol:r?.logo_symbol||"",logo_text:r?.logo_text||"",logo_image_url:r?.logo_image_url||null},l={logo_symbol:a.symbol||"",logo_text:a.text||"",logo_image_url:a.image_url||null};o=`<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                <span style="font-size:0.85em;color:var(--text-muted);">Change logo:</span>
                ${ze(i,"ipo-vote-logo-preview","")}
                <span style="color:var(--text-muted);">→</span>
                ${ze(l,"ipo-vote-logo-preview","")}
            </div>`;break}}return o?`<div class="ipo-vote-meta-summary">${o}</div>`:""}let ue=null,X=null,fe=null,Se=null;function nn(){if(!h||!b)return;const e=L.find(o=>o.org.id===b);if(!e||e.role==="observer")return;ue=null,X=null,fe=null,Se=null,document.getElementById("ipo-create-modal").classList.add("active"),Bo()}function Mo(){document.getElementById("ipo-create-modal").classList.remove("active"),ue=null,X=null,fe=null,Se=null}function rn(e){const t=e?.files?.[0];if(t){if(t.size>512*1024){alert("Logo must be under 512KB.");return}fe=t,Se=URL.createObjectURL(t),no()}}function sn(){fe=null,Se=null,X&&(X.image_url=null),no()}function Bo(){const e=document.getElementById("ipo-create-modal-inner"),o=L.find(i=>i.org.id===b)?.org,a=o?.charter||{},n=[];(a.membership?.admission||"vote")==="vote"&&n.push("membership"),(a.membership?.expulsionClause==="majority"||a.membership?.expulsionClause==="unanimous")&&n.push("expulsion"),(a.resources?.jointStatementClause||"vote")==="vote"&&n.push("joint_statement"),a.resources?.solidarityFund?.enabled&&n.push("fund_draw"),n.push("charter_amendment"),n.push("change_logo"),n.push("change_headquarters"),(o.symposium_cooldown_remaining||0)<=0&&!o.pending_symposium&&n.push("symposium");const r=n.map(i=>`
        <button class="ipo-vote-type-card" onclick="selectIPOVoteType('${i}')">
            <span class="ipo-vote-type-card-label">${ao[i]}</span>
            <span class="ipo-vote-type-card-desc">${tn[i]}</span>
        </button>
    `).join("");e.innerHTML=`
        <div class="ipo-modal-header">
            <span class="ipo-modal-title">Propose a Vote</span>
            <button class="modal-close" onclick="closeIPOVoteModal()">&times;</button>
        </div>
        <div class="ipo-modal-body">
            <div class="ipo-vote-type-grid">${r}</div>
        </div>`}async function ln(e){if(ue=e,e==="change_logo"){const o=L.find(a=>a.org.id===b)?.org;X={symbol:o?.logo_symbol||"",text:o?.logo_text||"",image_url:o?.logo_image_url||null},fe=null,Se=o?.logo_image_url||null}await no()}async function no(){const e=document.getElementById("ipo-create-modal-inner"),o=L.find(i=>i.org.id===b)?.org,a=ao[ue];let n="";switch(ue){case"membership":{const{data:i}=await p.from("ipo_invitations").select("id, target_faction_id, status, factions:target_faction_id ( faction_name )").eq("org_id",b).eq("status","vote_pending"),l=(i||[]).map(s=>`<option value="${s.id}" data-name="${v(s.factions?.faction_name||"Unknown")}" data-fid="${s.target_faction_id}">${v(s.factions?.faction_name||"Unknown")}</option>`).join("");l?n=`
                    <label class="ipo-vote-form-label">Applicant</label>
                    <select id="ipo-vote-meta-invite" class="ipo-vote-form-select">${l}</select>`:n='<div class="ipo-vote-form-note">No pending membership applications.</div>';break}case"expulsion":{n=`
                <label class="ipo-vote-form-label">Member to Expel</label>
                <select id="ipo-vote-meta-target" class="ipo-vote-form-select">${be.filter(l=>l.faction_id!==h.id).map(l=>{const s=l.role==="observer"?" (Observer)":"";return`<option value="${l.faction_id}">${v(l.factions?.faction_name||"Unknown")}${s}</option>`}).join("")}</select>`;break}case"joint_statement":n=`
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
                <select id="ipo-vote-meta-nation" class="ipo-vote-form-select">${(i||[]).map(s=>`<option value="${s.id}">${v(s.name)}</option>`).join("")}</select>`;break}case"symposium":{const{data:i}=await p.from("nations").select("id, name").order("name");n=`
                <label class="ipo-vote-form-label">Target Nation</label>
                <select id="ipo-vote-meta-nation" class="ipo-vote-form-select">${(i||[]).map(s=>`<option value="${s.id}">${v(s.name)}</option>`).join("")}</select>
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
                </select>`;break}case"change_logo":{const i=Se?`<img src="${v(Se)}" style="width:48px;height:48px;object-fit:cover;border-radius:6px;border:1px solid var(--border-0);" />`:`<span style="display:inline-flex;align-items:center;justify-content:center;width:48px;height:48px;background:var(--bg-3);border:1px solid var(--border-0);border-radius:6px;font-family:var(--font-mono);font-size:14px;color:var(--text-dim);">${v((X?.symbol||"")+" "+(X?.text||""))}</span>`;n=`
                <div class="ipo-vote-form-note">Proposes a cosmetic logo change. Cost: ${C(O)} on submission. Same vote threshold as charter amendments.</div>
                <div style="display:flex;gap:12px;align-items:flex-start;margin-top:8px;">
                    <div>${i}</div>
                    <div style="flex:1;">
                        <div style="display:flex;gap:6px;margin-bottom:6px;">
                            <div style="flex:1;">
                                <label style="display:block;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-transform:uppercase;margin-bottom:2px;">Symbol</label>
                                <input type="text" id="ipo-vote-logo-symbol" value="${v(X?.symbol||"")}" maxlength="2" placeholder="🌐"
                                    style="width:100%;padding:4px 6px;background:var(--bg-4);border:1px solid var(--border-0);border-radius:3px;color:var(--text-bright);font-size:14px;text-align:center;"
                                    oninput="ipoVoteSetLogoSymbol(this.value)">
                            </div>
                            <div style="flex:2;">
                                <label style="display:block;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-transform:uppercase;margin-bottom:2px;">Text</label>
                                <input type="text" id="ipo-vote-logo-text" value="${v(X?.text||"")}" maxlength="6" placeholder="IPO"
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
        </div>`}async function cn(){if(P||!h||!b||!ue)return;const e=document.getElementById("ipo-vote-title")?.value?.trim();if(!e){alert("Please enter a vote title.");return}const o=L.find(n=>n.org.id===b)?.org,a={};switch(ue){case"membership":{const n=document.getElementById("ipo-vote-meta-invite");if(!n||!n.value){alert("No applicant selected.");return}a.invite_id=n.value,a.target_faction_id=n.selectedOptions[0]?.dataset.fid||null,a.target_faction_name=n.selectedOptions[0]?.dataset.name||"Unknown";break}case"expulsion":{const n=document.getElementById("ipo-vote-meta-target");if(!n||!n.value){alert("No member selected.");return}a.target_faction_id=n.value;const r=ne.find(i=>i.faction_id===n.value);a.target_faction_name=r?.factions?.faction_name||"Unknown";break}case"joint_statement":{const n=document.getElementById("ipo-vote-meta-statement")?.value?.trim();if(!n){alert("Please write the statement text.");return}a.statement_text=n,a.visibility=document.getElementById("ipo-vote-meta-visibility")?.value||"public";break}case"fund_draw":{const n=parseInt(document.getElementById("ipo-vote-meta-amount")?.value);if(!n||n<O){alert("Enter at least "+C(O)+".");return}const r=Number(o?.solidarity_fund_balance)||0;if(n>r){alert("Amount exceeds fund balance.");return}a.amount_requested=n,a.proposer_name=h.faction_name,a.purpose=document.getElementById("ipo-vote-meta-purpose")?.value?.trim()||"";break}case"charter_amendment":{if(a.article_type=document.getElementById("ipo-vote-meta-article")?.value||"mission",a.description=document.getElementById("ipo-vote-meta-desc")?.value?.trim()||"",!a.description){alert("Please describe the proposed changes.");return}break}case"change_headquarters":{const n=document.getElementById("ipo-vote-meta-nation");if(!n||!n.value){alert("Select a nation.");return}a.proposed_nation_id=n.value,a.proposed_nation_name=n.selectedOptions[0]?.textContent||"";break}case"symposium":{const n=document.getElementById("ipo-vote-meta-nation");if(!n||!n.value){alert("Select a target nation.");return}a.target_nation_id=n.value,a.target_nation_name=n.selectedOptions[0]?.textContent||"",a.axis=document.getElementById("ipo-vote-meta-axis")?.value||"economic",a.direction=document.getElementById("ipo-vote-meta-direction")?.value||"left";break}case"change_logo":{const n=(X?.symbol||"").trim(),r=(X?.text||"").trim(),i=(o?.logo_symbol||"").trim(),l=(o?.logo_text||"").trim(),s=o?.logo_image_url||null,c=!!fe,u=c?"__pending__":X?.image_url||null;if(!(n!==i)&&!(r!==l)&&!(c||u!==s)){alert("No changes to propose. Edit the symbol, text, or image first.");return}break}}P=!0;try{if(!await ut(b)){alert(`This organisation already has ${et} open votes. Wait for some to close before proposing new ones.`);return}if(ue==="change_logo"){const r=await He(h.id,O);if(!r.success){alert("Not enough cash. Logo change votes cost "+C(O)+".");return}h.party_funds=r.newFunds;let i=X?.image_url||null;if(fe){const l=fe.name.split(".").pop().toLowerCase(),s=`ipo-logos/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${l}`,{error:c}=await p.storage.from("public-assets").upload(s,fe,{upsert:!0});if(c){console.error("[IPO] Logo upload error:",c),alert("Failed to upload logo: "+c.message);return}const{data:u}=p.storage.from("public-assets").getPublicUrl(s);i=u?.publicUrl||null}a.proposed_logo={symbol:X?.symbol||"",text:X?.text||"",image_url:i}}const{error:n}=await p.from("ipo_votes").insert({org_id:b,title:e,vote_type:ue,meta:a,status:"open",opened_at_tick:k,closes_at_tick:k+Qe,proposed_by:h.id});if(n){console.error("[IPO Vote] Insert error:",n),alert("Failed to propose vote: "+n.message);return}await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`${h.faction_name} proposed a vote: ${e}`,tick_posted:k}),Mo(),await te(b)}catch(n){console.error("[IPO Vote] Submit exception:",n),alert("Failed to propose vote.")}finally{P=!1}}let kt={};function dn(e,t){kt[e]=t;const o=document.getElementById(`ipo-ballot-row-${e}`),a=document.getElementById(`ipo-ballot-confirm-${e}`),n=document.getElementById(`ipo-ballot-choice-${e}`);if(o&&(o.style.display="none"),a&&(a.style.display="flex"),n){const i=o?.querySelector(`[onclick*="'${t}'"]`)?.getAttribute("data-candidate-name");n.textContent=i||t.toUpperCase(),n.className=i?"ipo-vote-choice--candidate":`ipo-vote-choice--${t}`}}function pn(e){delete kt[e];const t=document.getElementById(`ipo-ballot-row-${e}`),o=document.getElementById(`ipo-ballot-confirm-${e}`);t&&(t.style.display="flex"),o&&(o.style.display="none")}async function mn(e){const t=kt[e];t&&(delete kt[e],await Ro(e,t))}async function Ro(e,t){if(P||!h||!b)return;const o=L.find(i=>i.org.id===b);if(!o||o.role==="observer")return;const a=o.org,r=(a?.charter||{}).governance?.voteTransparency==="secret";P=!0;try{const i={vote_id:e,ballot:t,cast_at_tick:k};i.faction_id=h.id;const{error:l}=await p.from("ipo_ballots").insert(i);if(l){console.error("[IPO Ballot] Insert error:",l),l.code==="23505"?alert("You have already voted on this measure."):alert("Failed to cast ballot: "+l.message);return}const s=je.find(_=>_.id===e),c=s?.title||"a vote";let u;s?.vote_type==="leadership_election"&&t!=="abstain"?u=`for ${(s.meta&&s.meta.candidates||[]).find(d=>d.faction_id===t)?.faction_name||"a candidate"}`:u=t==="yes"?"YES":t==="no"?"NO":"ABSTAIN",r?await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`A member cast a ballot on "${c}".`,tick_posted:k}):await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`${h.faction_name} voted ${u} on "${c}".`,tick_posted:k});const f=s;if(f&&f.meta?.president_decides&&a.president_id===h.id&&(t==="yes"||t==="no")){const _=t==="yes";try{await p.from("ipo_votes").update({status:_?"passed":"failed",result:{yes:_?1:0,no:_?0:1,abstain:0,passed:_,president_approved:_},resolved_at_tick:k}).eq("id",e).eq("status","open"),_&&await Fo(f,a),await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:_?`The President has approved the admission of ${f.meta.target_faction_name||"a faction"}.`:`The President has denied the admission of ${f.meta.target_faction_name||"a faction"}.`,tick_posted:k})}catch(m){console.error("[IPO] President auto-resolve failed:",m)}}await te(b)}catch(i){console.error("[IPO Ballot] Cast exception:",i),alert("Failed to cast ballot.")}finally{P=!1}}async function un(e){if(P||!h||!b)return;const t=je.find($=>$.id===e);if(!t||t.status!=="open"||!confirm(`Resolve vote "${t.title}"? This will tally ballots and determine the outcome.`))return;const a=L.find($=>$.org.id===b)?.org,n=a?.charter||{},r=n.leadership||{},i=n.governance||{},l=r.votePass||"majority",s=Re[e]||[],c=ne.length,u=t.vote_type==="leadership_election";let f,_;if(u){const{voteTally:$,abstainCount:E,winnerId:T,maxVotes:w}=Lo(s,a.president_id);f={tally:$,winner:T,abstain:E,total_ballots:s.length},_="passed",P=!0;try{const{error:S,data:M}=await p.from("ipo_votes").update({status:_,result:f,resolved_at_tick:k}).eq("id",e).eq("status","open").select();if(S){console.error("[IPO Vote] Resolve error:",S),alert("Failed to resolve vote: "+S.message);return}if(!M||M.length===0){alert("Could not resolve vote. It may have already been resolved, or you may lack permission."),await te(b);return}const{error:N}=await p.from("international_orgs").update({president_id:T,president_term_start_tick:k}).eq("id",a.id);N&&console.error("[IPO Vote] President update error (may be RLS):",N);const z=(t.meta&&t.meta.candidates||[]).find(R=>R.faction_id===T)?.faction_name||"Unknown";await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`Leadership Election Result: ${z} elected president with ${w} vote${w!==1?"s":""} (${s.length} total ballots).`,tick_posted:k}),await te(b)}catch(S){console.error("[IPO Vote] Resolve exception:",S),alert("Failed to resolve vote.")}finally{P=!1}return}const m=s.filter($=>$.ballot==="yes").length,d=s.filter($=>$.ballot==="no").length,g=s.filter($=>$.ballot==="abstain").length,x=m+d+g;let I=!1;if(x===0?I=!1:l==="unanimous"?I=m===x&&d===0:I=m/x>.5,I&&i.vetoRight){const $=fn(a,i.vetoRight);if($){const E=s.find(T=>T.faction_id===$);E&&E.ballot==="no"&&(I=!1)}}t.vote_type==="expulsion"&&c>0&&n.membership?.expulsionClause==="unanimous"&&(I=m===c&&d===0),f={yes:m,no:d,abstain:g,passed:I},_=I?"passed":"failed",P=!0;try{const{error:$,data:E}=await p.from("ipo_votes").update({status:_,result:f,resolved_at_tick:k}).eq("id",e).eq("status","open").select();if($){console.error("[IPO Vote] Resolve error:",$),alert("Failed to resolve vote: "+$.message);return}if(!E||E.length===0){alert("Could not resolve vote. It may have already been resolved, or you may lack permission. Please refresh the page and try again."),await te(b);return}if(I)try{await Fo(t,a)}catch(w){console.error("[IPO Vote] Effect application error:",w)}!I&&t.vote_type==="membership"&&t.meta?.invite_id&&await p.from("ipo_invitations").update({status:"declined",responded_at_tick:k}).eq("id",t.meta.invite_id);const T=I?"PASSED":"FAILED";await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`Vote "${t.title}" has ${T} (${m}Y / ${d}N / ${g}A).`,tick_posted:k}),await te(b)}catch($){console.error("[IPO Vote] Resolve exception:",$),alert("Failed to resolve vote.")}finally{P=!1}}function fn(e,t){switch(t){case"president":return e.president_id;case"founding":return e.founding_party_id;case"hq":return e.headquarters_nation_id&&ne.find(a=>a.factions?.nation_id===e.headquarters_nation_id)?.faction_id||null;default:return null}}async function Fo(e,t){const o=e.meta||{};switch(e.vote_type){case"membership":{if(!o.target_faction_id)break;o.invite_id&&await p.from("ipo_invitations").update({status:"accepted",responded_at_tick:k}).eq("id",o.invite_id);const a=o.requested_role||"member";let n=[{id:o.target_faction_id,name:o.target_faction_name}];const r=[];for(const l of n){const s=await So(b),{data:c,error:u}=await p.from("ipo_members").insert({org_id:b,faction_id:l.id,role:a,joined_at_tick:k,chat_color:s}).select("id");u?(console.error(`[IPO] Failed to admit ${l.name}:`,u),r.push({name:l.name,reason:u.message})):(!c||c.length===0)&&(console.error(`[IPO] Admit ${l.name} returned 0 rows — RLS silently rejected the insert.`),r.push({name:l.name,reason:"permission denied"}))}if(r.length>0){const l=r.map(s=>`${s.name}: ${s.reason}`).join(`
`);alert(`Failed to admit:

${l}

No membership row was created. Check console for details.`);break}const i=`${o.target_faction_name||"A new party"} has been admitted as ${a==="observer"?"an observer":"a member"}.`;await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:i,tick_posted:k});break}case"expulsion":{if(o.target_faction_id&&(await p.from("ipo_members").update({is_active:!1,left_at_tick:k}).eq("org_id",b).eq("faction_id",o.target_faction_id).eq("is_active",!0),await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`${o.target_faction_name||"A member"} has been expelled from the organisation.`,tick_posted:k}),t.president_id===o.target_faction_id)){const a=ne.filter(n=>n.faction_id!==o.target_faction_id);if(a.length>0){const n=a[0].faction_id;await p.from("international_orgs").update({president_id:n,president_term_start_tick:k}).eq("id",b);const r=a[0].factions?.faction_name||"A member";await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`${r} is now president (previous president expelled).`,tick_posted:k})}}break}case"fund_draw":{if(o.amount_requested&&o.amount_requested>0&&e.proposed_by){const a=Number(t.solidarity_fund_balance)||0,n=Math.min(o.amount_requested,a);if(n<=0)break;const{error:r}=await p.rpc("ipo_debit_solidarity_fund",{p_org_id:b,p_amount:n});if(r){console.error("[IPO] Fund-draw debit failed:",r),alert("Failed to draw from fund: "+r.message);break}const{error:i}=await p.rpc("ipo_credit_party_funds",{p_target_faction_id:e.proposed_by,p_amount:n,p_org_id:b});i&&(console.error("[IPO] Fund-draw credit failed:",i),alert("Fund debited but proposer credit FAILED — contact an admin to reconcile. Error: "+i.message)),await p.from("ipo_fund_transactions").insert({org_id:b,faction_id:e.proposed_by,transaction_type:"draw",amount:-n,description:o.purpose||"Fund draw",tick:k}),await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`Fund draw approved: ${C(n)} withdrawn and credited. ${o.purpose?"Purpose: "+o.purpose:""}`,tick_posted:k})}break}case"change_headquarters":{o.proposed_nation_id&&await p.from("international_orgs").update({headquarters_nation_id:o.proposed_nation_id}).eq("id",b);break}case"joint_statement":{if(o.statement_text){const a=o.visibility==="private"?" (private)":"";if(await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`JOINT STATEMENT${a}: "${o.statement_text}"`,tick_posted:k}),await p.from("ipo_action_log").insert({org_id:b,faction_id:h.id,action_type:"joint_statement",action_data:{statement_text:o.statement_text,visibility:o.visibility||"public"},ap_cost:0,performed_at_tick:k}),o.visibility!=="private")try{const{data:n}=await p.from("ipo_members").select("nation_id").eq("org_id",b),r=[...new Set((n||[]).map(i=>i.nation_id).filter(Boolean))];for(const i of r)await p.from("event_log").insert({nation_id:i,event_name:"Joint Statement",description_chosen:`${t.name||"International Organisation"}: "${o.statement_text}"`,category:"DIPLOMATIC",fired_at_tick:k})}catch(n){console.warn("[IPO] Joint statement event_log failed (non-blocking):",n)}}break}case"charter_amendment":{const a=o.proposed_charter;if(a){const{error:i}=await p.from("international_orgs").update({charter:a}).eq("id",t.id);i&&console.error("[IPO] Charter amendment apply error:",i)}const n=o.proposed_logo;if(n){const i={};if(n.symbol!==void 0&&(i.logo_symbol=n.symbol),n.text!==void 0&&(i.logo_text=n.text),n.image_url!==void 0&&(i.logo_image_url=n.image_url),Object.keys(i).length>0){const{error:l}=await p.from("international_orgs").update(i).eq("id",t.id);l&&console.error("[IPO] Logo amendment apply error:",l)}}const r=[];a&&r.push("charter"),n&&r.push("logo"),await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`Amendment approved and applied (${r.join(", ")}): "${(o.description||"").substring(0,200)}".`,tick_posted:k}),await p.from("ipo_action_log").insert({org_id:b,faction_id:h.id,action_type:"charter_amendment",action_data:{description:o.description,proposed_charter:a,proposed_logo:n},ap_cost:1,performed_at_tick:k});break}case"change_logo":{const a=o.proposed_logo;if(a){const n={};if(a.symbol!==void 0&&(n.logo_symbol=a.symbol),a.text!==void 0&&(n.logo_text=a.text),a.image_url!==void 0&&(n.logo_image_url=a.image_url),Object.keys(n).length>0){const{error:r}=await p.from("international_orgs").update(n).eq("id",t.id);r&&console.error("[IPO] Logo change apply error:",r)}}await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:"Logo change approved and applied.",tick_posted:k}),await p.from("ipo_action_log").insert({org_id:b,faction_id:h.id,action_type:"change_logo",action_data:{proposed_logo:a},ap_cost:1,performed_at_tick:k});break}case"symposium":{const i={targetNation:o.target_nation_id,axis:o.axis||"economic",direction:o.direction||"left",ideologyShift:3,firesOnTick:k+4};await p.from("international_orgs").update({pending_symposium:i,symposium_cooldown_remaining:20}).eq("id",b),await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`Symposium approved! Targeting ${o.target_nation_name||"a nation"} (${o.axis} ${o.direction}). Effect fires in 4 ticks.`,tick_posted:k}),await p.from("ipo_action_log").insert({org_id:b,faction_id:h.id,action_type:"symposium",action_data:i,ap_cost:0,performed_at_tick:k});break}}}const O=5e4,Q={hold_rally:4*O,rally_all:7*O,back_channel:2*O,joint_statement:1*O,fund_draw:0};function C(e){return e=Number(e)||0,e>=1e6?"$"+(e/1e6).toFixed(1)+"M":e>=1e3?"$"+Math.round(e/1e3)+"k":"$"+e}async function He(e,t){const{data:o,error:a}=await p.from("factions").select("party_funds").eq("id",e).single();if(a||!o)return{success:!1,error:"Could not read funds"};const n=Number(o.party_funds)||0;if(n<t)return{success:!1,error:"Insufficient cash",currentFunds:n};const r=n-t,{error:i}=await p.from("factions").update({party_funds:r}).eq("id",e);return i?{success:!1,error:i.message}:{success:!0,newFunds:r}}const dt=[{id:"rousing",name:"Rousing Success",effect:"+6 to +8 momentum",min:6,max:8,weight:15,color:"#5cb85c",icon:"★"},{id:"solid",name:"Solid Turnout",effect:"+3 to +5 momentum",min:3,max:5,weight:35,color:"#5aafa5",icon:"●"},{id:"low",name:"Low Turnout",effect:"+1 to +2 momentum",min:1,max:2,weight:25,color:"#c8a64e",icon:"○"},{id:"gaffe",name:"Gaffe",effect:"-3 to -2 momentum",min:-3,max:-2,weight:12,color:"#d97a35",icon:"✕"},{id:"divisive",name:"Divisive Speech",effect:"+5 own / -2 others",min:5,max:7,weight:8,color:"#8b7ec8",icon:"◆"},{id:"counter",name:"Counter-Protest",effect:"-1 all",min:-1,max:-1,weight:5,color:"#d9534f",icon:"⚡"}],gn=.25;function Ne(){const e=document.getElementById("ipo-actions-body");if(!e)return;const t=L.find(E=>E.org.id===b);if(!t){e.innerHTML='<span class="ipo-main-placeholder-text">Select an organisation.</span>';return}const o=t.org,a=o?.charter||{},n=o.president_id===h.id;if(t.role==="observer"){e.innerHTML='<div class="ipo-actions-empty">Observers cannot perform actions.</div>';return}const i=[],l=Number(h?.party_funds)||0;i.push({key:"hold_rally",label:"Hold Rally",desc:`Spend ${C(Q.hold_rally)} to rally support for another member party.`,cost:Q.hold_rally,icon:"📢",available:be.filter(E=>E.faction_id!==h.id&&E.is_active).length>0&&l>=Q.hold_rally}),i.push({key:"rally_all",label:"Rally All Members",desc:"Coordinate rallies across all member nations.",cost:Q.rally_all,icon:"📣",available:n&&l>=Q.rally_all});const s=a.resources?.solidarityFund?.enabled,c=O;i.push({key:"back_channel",label:"Back-Channel Resources",desc:`Transfer cash to another member. Personal: ${C(Q.back_channel)} overhead, no risk. Fund: drawn from solidarity fund, 25% exposure.`,cost:Q.back_channel,icon:"🤝",available:l>=Q.back_channel+c});const u=a.resources?.jointStatementClause||"vote";i.push({key:"joint_statement",label:"Issue Joint Statement",desc:u==="president"?"Issue a statement on behalf of the org (president only).":"Issue a statement (requires a vote — use Votes panel).",cost:Q.joint_statement,icon:"📜",available:u==="president"&&n&&l>=Q.joint_statement});const f=Number(o.solidarity_fund_balance)||0;i.push({key:"fund_draw",label:"Draw from Fund",desc:s&&f>0?`Withdraw cash from fund (${C(f)} available). Requires vote — use Votes panel.`:s?"Fund is empty.":"Solidarity fund is not enabled.",cost:0,icon:"💰",available:!1});const _=a.governance?.actionLeadership||"unilateral",m=!!a.governance?.emergencyPowers,d=o.emergency_power_used_tick||0,g=o.president_term_start_tick||0,x=m&&n&&(d===0||d<g),I=new Set(["hold_rally","rally_all","back_channel"]);for(const E of i){if(!E.available||E.key==="fund_draw")continue;let T=!1,w="";I.has(E.key)||(_==="committee"?(T=!0,w="Charter requires a vote — use Votes panel"):_==="presidential"&&!n?(T=!0,w="Only the president can execute actions"):_==="delegated"&&!n?(T=!0,w="Only the president or officers can execute actions"):_==="tiered"&&E.cost>2*O&&(T=!0,w=`Costs >${C(2*O)} — charter requires a vote`)),T&&(E.available=!1,E.desc=`${E.desc} (${w})`,x&&(E._emergencyEligible=!0))}const $=i.map(E=>{const T=E._emergencyEligible?`<button class="ipo-action-exec-btn" style="background:rgba(217,83,79,0.15);border-color:rgba(217,83,79,0.3);color:#d9534f;" onclick="executeIPOAction('${E.key}', true)">⚡ EMERGENCY</button>`:"";return`<div class="ipo-action-card ${E.available?"":"ipo-action-card--disabled"}">
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
        </div>`,_n(b)}const vn={hold_rally:"📢",rally_all:"📣",back_channel:"🤝",joint_statement:"📜",fund_draw:"💰"};async function _n(e){const t=document.getElementById("ipo-event-log");if(!(!t||!e))try{const{data:o}=await p.from("ipo_action_log").select("action_type, faction_id, target_faction_id, action_data, ap_cost, performed_at_tick, factions:faction_id ( faction_name )").eq("org_id",e).order("performed_at_tick",{ascending:!1}).limit(8);if(!o||o.length===0){t.innerHTML='<div class="ipo-event-log-empty">No recent activity.</div>';return}t.innerHTML=`
            <div class="ipo-event-log-header">Recent Activity</div>
            ${o.map(a=>{const n=vn[a.action_type]||"●",r=a.factions?.faction_name||"Unknown",i=a.action_data||{};let l="";switch(a.action_type){case"hold_rally":{const s=i.momentum_change??i.approval_change??0;l=i.type==="expulsion"?`expelled ${i.target_name||"a member"}`:`held a rally: ${i.outcome_name||"?"} (${s>=0?"+":""}${s})`;break}case"rally_all":l=`rallied all members (${(i.results||[]).length} parties)`;break;case"back_channel":l=i.exposed?`EXPOSED: transferred ${i.amount||"?"} AP to ${i.target_name||"?"}`:"transferred resources";break;case"joint_statement":if(i.statement_text&&i.statement_text.length>80){const s=v(i.statement_text.substring(0,80)),c=v(i.statement_text);l=`issued a joint statement: <span class="ipo-statement-text"><span class="ipo-statement-preview">"${s}…"</span><span class="ipo-statement-full" style="display:none">"${c}"</span><button class="ipo-statement-toggle" onclick="this.parentElement.classList.toggle('expanded'); this.textContent = this.parentElement.classList.contains('expanded') ? 'Less' : 'More'">More</button></span>`}else i.statement_text?l=`issued a joint statement: "${v(i.statement_text)}"`:l="issued a joint statement";break;case"fund_draw":l=`withdrew ${i.amount?C(i.amount):"?"} from fund`;break;default:l=a.action_type}return`<div class="ipo-event-log-row">
                    <span class="ipo-event-log-icon">${n}</span>
                    <span class="ipo-event-log-text"><strong>${v(r)}</strong> ${l}</span>
                    <span class="ipo-event-log-tick">T${a.performed_at_tick}</span>
                </div>`}).join("")}`}catch(o){console.error("[IPO] Event log error:",o)}}async function bn(e,t=!1){if(!(!h||!b)){if(t){if(!confirm(`⚡ INVOKE EMERGENCY POWERS?

This bypasses the charter's action leadership rules.
You can only use this once per presidential term.

Proceed?`))return;try{await p.from("international_orgs").update({emergency_power_used_tick:k}).eq("id",b),await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`⚡ ${h.faction_name} has invoked EMERGENCY POWERS to execute: ${e.replace(/_/g," ")}.`,tick_posted:k});try{const a=L.find(i=>i.org.id===b)?.org?.name||"An organisation",{data:n}=await p.from("ipo_members").select("nation_id").eq("org_id",b),r=[...new Set((n||[]).map(i=>i.nation_id).filter(Boolean))];for(const i of r)await p.from("event_log").insert({nation_id:i,event_name:"Emergency Powers Invoked",description_chosen:`${a}: ${h.faction_name} invoked emergency powers to ${e.replace(/_/g," ")}.`,category:"DIPLOMATIC",fired_at_tick:k})}catch{}}catch(o){alert("Failed to invoke emergency powers: "+(o.message||"Unknown error"));return}}switch(e){case"hold_rally":await yn();break;case"rally_all":await xn();break;case"back_channel":wn();break;case"joint_statement":kn();break;case"fund_draw":En();break}}}async function yn(){if(P)return;const e=Q.hold_rally,t=be.filter(n=>n.faction_id!==h.id&&n.is_active);if(t.length===0){alert("No other members in this organisation to rally for.");return}const o=t.map(n=>`<option value="${n.faction_id}">${v(n.factions?.faction_name||"Unknown")}</option>`).join(""),a=document.getElementById("ipo-create-modal-inner");document.getElementById("ipo-create-modal").classList.add("active"),a.innerHTML=`
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
        </div>`}async function hn(){if(P)return;const e=Q.hold_rally,t=document.getElementById("ipo-rally-target")?.value;if(!t){alert("Select a party to rally for.");return}const a=be.find(n=>n.faction_id===t)?.factions?.faction_name||"Unknown";P=!0;try{const n=await He(h.id,e);if(!n.success){alert(`Insufficient cash. You need ${C(e)}. ${n.currentFunds!==void 0?"You have "+C(n.currentFunds)+".":""}`);return}h.party_funds=n.newFunds;const r=qo(),i=zo(r.min,r.max);if(i!==0)try{await p.rpc("adjust_momentum",{p_faction_id:t,p_delta:i,p_label:`IPO rally by ${h.faction_name} (${r.name})`,p_tick:k||0})}catch(s){console.error("[IPO Action] adjust_momentum failed:",s)}const l={target_faction_id:t,target_faction_name:a,outcome_id:r.id,outcome_name:r.name,momentum_change:i};await p.from("ipo_action_log").insert({org_id:b,faction_id:h.id,action_type:"hold_rally",action_data:l,ap_cost:e,performed_at_tick:k}),await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`${h.faction_name} rallied support for ${a}: ${r.name} (${i>=0?"+":""}${i} momentum).`,tick_posted:k}),Te(),Ne(),An("Hold Rally for "+a,r,i)}catch(n){console.error("[IPO Action] Hold rally error:",n),alert("Failed to execute rally.")}finally{P=!1}}async function xn(){if(P)return;const e=Q.rally_all,t=ne.length;if(confirm(`Rally all ${t} member parties? This costs ${C(e)}. Each member gets an independent dice roll.`)){P=!0;try{const o=await He(h.id,e);if(!o.success){alert(`Insufficient cash. You need ${C(e)}.`);return}h.party_funds=o.newFunds;const a=ne.map(r=>{const i=qo(),l=zo(i.min,i.max);return{faction_id:r.faction_id,nation_id:r.factions?.nation_id,faction_name:r.factions?.faction_name||"Unknown",outcome_id:i.id,outcome_name:i.name,momentum_change:l}});for(const r of a)if(r.momentum_change!==0)try{await p.rpc("adjust_momentum",{p_faction_id:r.faction_id,p_delta:r.momentum_change,p_label:`IPO rally-all by ${h.faction_name} (${r.outcome_name})`,p_tick:k||0})}catch(i){console.error("[IPO Action] adjust_momentum failed:",i)}await p.from("ipo_action_log").insert({org_id:b,faction_id:h.id,action_type:"rally_all",action_data:{results:a},ap_cost:e,performed_at_tick:k});const n=a.map(r=>`${r.faction_name}: ${r.outcome_name} (${r.momentum_change>=0?"+":""}${r.momentum_change})`).join(", ");await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`${h.faction_name} rallied all members! ${n}`,tick_posted:k}),Ne(),Nn("Rally All Members",a)}catch(o){console.error("[IPO Action] Rally all error:",o),alert("Failed to execute coordinated rally.")}finally{P=!1}}}let Fe=null,io=1;function wn(){const t=L.find(f=>f.org.id===b)?.org,o=t?.charter||{},a=o.resources?.resourceSharingCap,n=o.resources?.solidarityFund?.enabled,r=Number(t?.solidarity_fund_balance)||0;Fe=null,io=O;const i=be.filter(f=>f.faction_id!==h.id&&f.is_active);if(i.length===0){alert("No other members to transfer to.");return}const l=i.map(f=>`<option value="${f.faction_id}">${v(f.factions?.faction_name||"Unknown")}</option>`).join(""),s=a?`<div class="ipo-vote-form-note">Resource sharing cap: ${a} transfers per term.</div>`:"",c=n&&r>0?'<option value="fund">Solidarity Fund (drawn from fund · 25% exposure risk)</option>':"",u=document.getElementById("ipo-create-modal-inner");document.getElementById("ipo-create-modal").classList.add("active"),u.innerHTML=`
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
        </div>`,Fe=i[0].faction_id}async function $n(){if(P)return;if(!Fe){alert("Select a recipient.");return}const e=Number(document.getElementById("ipo-bc-amount")?.value)||io;if(e<O){alert("Enter at least "+C(O)+".");return}const t=document.getElementById("ipo-bc-source")?.value||"personal",a=L.find(i=>i.org.id===b)?.org,n=a?.charter||{},r=n.resources?.resourceSharingCap;if(r){const{data:i}=await p.from("ipo_action_log").select("id").eq("org_id",b).eq("faction_id",h.id).eq("action_type","back_channel").gte("performed_at_tick",k-(n.leadership?.termYears||2)*12);if(i&&i.length>=r){alert(`You have reached the resource sharing cap (${r} per term).`);return}}P=!0;try{const l=ne.find(f=>f.faction_id===Fe)?.factions?.faction_name||"Unknown";let s=!1,c=0;if(t==="fund"){const{error:f}=await p.rpc("ipo_debit_solidarity_fund",{p_org_id:b,p_amount:e});if(f){alert("Failed to draw from fund: "+f.message);return}c=0,s=Math.random()<gn}else{const f=Q.back_channel+e,_=await He(h.id,f);if(!_.success){alert(`Insufficient cash. You need ${C(f)} (${C(Q.back_channel)} overhead + ${C(e)} transfer).`);return}h.party_funds=_.newFunds,c=f,s=!1}const{error:u}=await p.rpc("ipo_credit_party_funds",{p_target_faction_id:Fe,p_amount:e,p_org_id:b});if(u&&(console.error("[IPO] Back-channel credit failed:",u),alert("Transfer initiated but the recipient credit FAILED — please contact an admin to reconcile. Error: "+u.message)),await p.from("ipo_action_log").insert({org_id:b,faction_id:h.id,target_faction_id:Fe,action_type:"back_channel",action_data:{amount:e,exposed:s,target_name:l,source:t},ap_cost:c,performed_at_tick:k}),s){await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`EXPOSED: ${h.faction_name} used solidarity funds to secretly transfer ${C(e)} to ${l}!`,tick_posted:k});try{const{data:f}=await p.from("ipo_members").select("nation_id").eq("org_id",b),_=[...new Set((f||[]).map(m=>m.nation_id).filter(Boolean))];for(const m of _)await p.from("event_log").insert({nation_id:m,event_name:"Back-Channel Scandal",description_chosen:`${a.name||"An organisation"}: ${h.faction_name} was caught secretly funneling ${C(e)} to ${l} from the solidarity fund!`,category:"DIPLOMATIC",fired_at_tick:k})}catch{}}else await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:"Resources were transferred within the organisation.",tick_posted:k});Te(),Ne(),alert(`Transferred ${C(e)} to ${l}.${s?" WARNING: The transfer was EXPOSED publicly!":" Transfer completed secretly."}`)}catch(i){console.error("[IPO Action] Back-channel error:",i),alert("Failed to transfer resources.")}finally{P=!1}}function kn(){const e=document.getElementById("ipo-create-modal-inner");document.getElementById("ipo-create-modal").classList.add("active"),e.innerHTML=`
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
        </div>`}async function In(){if(P)return;const e=document.getElementById("ipo-direct-stmt")?.value?.trim();if(!e){alert("Please write the statement.");return}const t=Q.joint_statement;P=!0;try{const o=await He(h.id,t);if(!o.success){alert(`Insufficient cash. You need ${C(t)}.`);return}h.party_funds=o.newFunds,await p.from("ipo_action_log").insert({org_id:b,faction_id:h.id,action_type:"joint_statement",action_data:{statement_text:e,by_president:!0},ap_cost:t,performed_at_tick:k}),await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`JOINT STATEMENT (by president): "${e}"`,tick_posted:k});const n=L.find(r=>r.org.id===b)?.org?.name||"International Organisation";try{const{data:r}=await p.from("ipo_members").select("nation_id").eq("org_id",b),i=[...new Set((r||[]).map(l=>l.nation_id).filter(Boolean))];for(const l of i)await p.from("event_log").insert({nation_id:l,event_name:"Joint Statement",description_chosen:`${n}: "${e}"`,category:"DIPLOMATIC",fired_at_tick:k})}catch(r){console.warn("[IPO] Joint statement event_log insert failed (non-blocking):",r)}Te(),Ne(),alert("Statement published.")}catch(o){console.error("[IPO Action] Statement error:",o),alert("Failed to publish statement.")}finally{P=!1}}function En(){const e=L.find(a=>a.org.id===b),t=Number(e?.org?.solidarity_fund_balance)||0,o=document.getElementById("ipo-create-modal-inner");document.getElementById("ipo-create-modal").classList.add("active"),o.innerHTML=`
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
        </div>`}async function Sn(){if(P)return;const e=parseInt(document.getElementById("ipo-direct-draw-amount")?.value),t=document.getElementById("ipo-direct-draw-purpose")?.value?.trim()||"";if(!e||e<O){alert("Enter at least "+C(O)+".");return}const o=L.find(n=>n.org.id===b),a=Number(o?.org?.solidarity_fund_balance)||0;if(e>a){alert("Amount exceeds fund balance.");return}P=!0;try{const n=a-e;await p.from("international_orgs").update({solidarity_fund_balance:n}).eq("id",b);const{data:r}=await p.from("factions").select("party_funds").eq("id",h.id).single();r&&await p.from("factions").update({party_funds:(Number(r.party_funds)||0)+e}).eq("id",h.id),await p.from("ipo_fund_transactions").insert({org_id:b,faction_id:h.id,transaction_type:"draw",amount:-e,description:t||"Presidential fund draw",tick:k}),await p.from("ipo_action_log").insert({org_id:b,faction_id:h.id,action_type:"fund_draw",action_data:{amount:e,purpose:t},ap_cost:0,performed_at_tick:k}),await p.from("ipo_chat").insert({org_id:b,faction_id:null,is_system:!0,message_text:`President ${h.faction_name} withdrew ${C(e)} from the solidarity fund. ${t?"Purpose: "+t:""}`,tick_posted:k}),Te(),Ne(),alert(`Withdrew ${C(e)} from the solidarity fund.`)}catch(n){console.error("[IPO Action] Fund draw error:",n),alert("Failed to withdraw from fund.")}finally{P=!1}}function qo(){const e=dt.reduce((o,a)=>o+a.weight,0);let t=Math.random()*e;for(const o of dt)if(t-=o.weight,t<=0)return o;return dt[1]}function zo(e,t){return Math.floor(Math.random()*(t-e+1))+e}function An(e,t,o){const a=document.getElementById("ipo-create-modal-inner");document.getElementById("ipo-create-modal").classList.add("active"),a.innerHTML=`
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
        </div>`}function Nn(e,t){const o=document.getElementById("ipo-create-modal-inner");document.getElementById("ipo-create-modal").classList.add("active");const a=t.map(n=>{const r=dt.find(i=>i.id===n.outcome_id)||dt[1];return`
            <div class="ipo-action-multi-row">
                <span class="ipo-action-multi-icon" style="color:${r.color}">${r.icon}</span>
                <span class="ipo-action-multi-name">${v(n.faction_name)}</span>
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
        </div>`}function Te(){document.getElementById("ipo-create-modal").classList.remove("active"),Fe=null,io=1}let Ue=1,ve="",Je="",Ce="◈",ce="",ge=null,ye=null,J=[];const Nt=[{key:"mission",label:"I — Mission Statement",required:!0,maxOne:!0},{key:"leadership",label:"II — Leadership",required:!1,maxOne:!0},{key:"membership",label:"III — Membership",required:!1,maxOne:!0},{key:"governance",label:"IV — Transparency & Governance",required:!1,maxOne:!0},{key:"resources",label:"V — Resources & External Relations",required:!1,maxOne:!0}],Tn=[{axis:"Individualism / Collectivism",poles:["Individualism","Collectivism"]},{axis:"Tradition / Progress",poles:["Tradition","Progress"]},{axis:"Liberty / Equality",poles:["Liberty","Equality"]},{axis:"Freedom / Security",poles:["Freedom","Security"]},{axis:"Globalism / Nationalism",poles:["Globalism","Nationalism"]}];function Cn(){Ue=1,ve="",Je="",Ce="◈",ce="",ge=null,ye=null,J=[{type:"mission",config:{text:""}}],document.getElementById("ipo-create-modal").classList.add("active"),Tt()}function Do(){document.getElementById("ipo-create-modal").classList.remove("active"),ge=null,ye=null}function Tt(){const e=document.getElementById("ipo-create-modal-inner"),t=[1,2,3].map(a=>`<div class="wizard-step ${a===Ue?"active":a<Ue?"completed":""}">
            <span class="wizard-step-num">${a}</span> ${["Identity","Charter","Confirm"][a-1]}
        </div>`).join("");let o="";Ue===1?o=Pn():Ue===2?o=Mn():o=Gn(),e.innerHTML=`
        <div class="ipo-modal-header">
            <span class="ipo-modal-title">Create Organisation</span>
            <button class="modal-close" onclick="closeIPOCreationModal()">&times;</button>
        </div>
        <div class="wizard-steps">${t}</div>
        <div class="ipo-modal-body">${o}</div>`}function Pn(){const e=Ea.map(t=>`<button class="ipo-symbol-btn ${t===Ce?"selected":""}"
            onclick="ipoSelectSymbol('${t}')">${t}</button>`).join("");return`
        <div class="trade-field">
            <label>Organisation Name</label>
            <input type="text" maxlength="40" value="${v(ve)}"
                oninput="ipoSetCreateName(this.value)"
                id="ipo-create-name" placeholder="e.g. Progressive Socialist International" />
        </div>
        <div class="trade-field">
            <label>Description</label>
            <textarea maxlength="200" rows="2"
                oninput="ipoSetCreateDesc(this.value)"
                style="width:100%;padding:4px 8px;font-size:0.78rem;background:var(--bg-3);border:1px solid var(--border-subtle);color:var(--text-primary);font-family:var(--font-sans);border-radius:3px;resize:vertical;"
                placeholder="Brief description of the organisation's purpose...">${v(Je)}</textarea>
        </div>
        <div class="trade-field">
            <label>Logo Symbol</label>
            <div class="ipo-symbol-row">${e}</div>
        </div>
        <div class="trade-field">
            <label>Logo Text (max 4 characters)</label>
            <input type="text" maxlength="4" value="${v(ce)}"
                oninput="ipoSetCreateLogoText(this.value)"
                id="ipo-create-logo-text" placeholder="e.g. PSI"
                style="width:80px;text-transform:uppercase;" />
            <div id="ipo-create-logo-preview" style="margin-top:6px;font-family:var(--font-mono);font-size:10px;color:var(--ipo-accent);">
                Preview: ${Ce} ${v(ce)||"..."}
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
                ${!ve.trim()||!ce.trim()?"disabled":""}
                onclick="ipoSetCreateStep(2)">Next</button>
        </div>`}function On(e){Ce=e,document.querySelectorAll(".ipo-symbol-btn").forEach(o=>{o.classList.toggle("selected",o.textContent.trim()===e)});const t=document.getElementById("ipo-create-logo-preview");t&&(t.innerHTML=`Preview: ${Ce} ${v(ce)||"..."}`)}function Ln(e){const t=e.files[0],o=document.getElementById("ipo-logo-upload-error");if(!t)return;if(!["image/png","image/jpeg","image/webp"].includes(t.type)){o&&(o.textContent="Only PNG, JPG, or WebP images allowed.",o.style.display=""),e.value="";return}if(t.size>2*1024*1024){o&&(o.textContent="Image must be under 2 MB.",o.style.display=""),e.value="";return}o&&(o.style.display="none"),ge=t;const a=new FileReader;a.onload=function(n){ye=n.target.result;const r=document.getElementById("ipo-logo-upload-zone");if(r&&(r.innerHTML=`<img src="${ye}" class="ipo-logo-upload-preview" alt="preview" />
                <div style="font-size:9px;color:var(--text-tertiary);margin-top:4px;">Click to replace</div>`),!r?.parentElement?.querySelector(".ipo-logo-remove-btn")&&r?.parentElement){const l=document.createElement("button");l.className="ipo-logo-remove-btn",l.style.cssText="margin-top:4px;font-size:9px;color:#d9534f;background:none;border:1px solid #d9534f33;padding:2px 8px;border-radius:3px;cursor:pointer;",l.textContent="Remove Image",l.onclick=function(){jo()},r.parentElement.insertBefore(l,r.nextSibling)}},a.readAsDataURL(t)}function jo(){ge=null,ye=null;const e=document.getElementById("ipo-logo-upload-zone");e&&(e.innerHTML=`<div style="font-size:18px;color:var(--text-tertiary);">⬆</div>
            <div style="font-size:10px;color:var(--text-tertiary);">Click to upload</div>
            <div style="font-size:8px;color:var(--text-quaternary);margin-top:2px;">PNG · JPG · WebP</div>`);const t=document.querySelector(".ipo-logo-remove-btn");t&&t.remove();const o=document.getElementById("ipo-logo-file-input");o&&(o.value="");const a=document.getElementById("ipo-logo-upload-error");a&&(a.style.display="none")}function Mn(){const e=J.map((i,l)=>Ho(i,l)).join(""),t=new Set(J.map(i=>i.type)),o=Nt.filter(i=>!t.has(i.key)),n=J.length<5&&o.length>0?`
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
                ${Bn()?"":"disabled"}
                onclick="ipoSetCreateStep(3)">Next</button>
        </div>`}function Bn(){const e=J.find(t=>t.type==="mission");return e&&(e.config.text||"").trim().length>0}function Rn(){const e=document.getElementById("ipo-add-article-select");if(!e||!e.value)return;const t=e.value,o={leadership:{type:"rotation",termYears:2,votingWeight:"equal",votePass:"majority"},membership:{admission:"vote",ideologicalThreshold:{enabled:!1,directions:[]},expulsionClause:null},governance:{actionLeadership:"unilateral",voteTransparency:"public",observerStatus:!1,vetoRight:null,emergencyPowers:!1},resources:{solidarityFund:{enabled:!1,contributionPerQuarter:1},resourceSharingCap:null,jointStatementClause:"vote",headquarters:null}};tt().push({type:t,config:o[t]||{}}),ft()}function Fn(e){const t=tt();t[e]?.type!=="mission"&&(t.splice(e,1),ft())}function Ho(e,t){const a=Nt.find(l=>l.key===e.type)?.label||e.type,r=e.type!=="mission"?`<button class="ipo-article-remove" onclick="ipoRemoveArticle(${t})">&times;</button>`:"";let i="";switch(e.type){case"mission":i=qn(e,t);break;case"leadership":i=zn(e,t);break;case"membership":i=Dn(e,t);break;case"governance":i=jn(e,t);break;case"resources":i=Hn(e,t);break}return`
        <div class="ipo-article-card">
            <div class="ipo-article-card-header">
                <span class="ipo-article-label">${a}</span>
                ${r}
            </div>
            <div class="ipo-article-card-body">${i}</div>
        </div>`}function qn(e,t){return`
        <textarea maxlength="300" rows="3" placeholder="Describe the organisation's mission and purpose..."
            oninput="ipoActiveArticles()[${t}].config.text=this.value;var nb=document.getElementById('ipo-step2-next');if(nb)nb.disabled=!ipoValidateCharter()"
            style="width:100%;padding:4px 8px;font-size:10px;background:#141410;border:1px solid rgba(255,255,255,0.07);color:#e2d9b4;font-family:var(--font-sans);border-radius:2px;resize:vertical;"
        >${v(e.config.text||"")}</textarea>
        <div style="font-family:var(--font-mono);font-size:7px;color:#4a4840;margin-top:2px;">${(e.config.text||"").length}/300</div>`}function zn(e,t){const o=e.config;return`
        ${_e("Leadership Type",t,"type",[{value:"vote",label:"Vote",hint:"Members elect the president"},{value:"rotation",label:"Rotation",hint:"Presidency rotates in fixed order"},{value:"most_seats",label:"Most Seats",hint:"Party with most seats leads"},{value:"random",label:"Random",hint:"Randomly assigned each term"}],o.type)}
        ${Kt("Succession Term",t,"termYears",[1,2,3,4,5,6,7].map(a=>({value:a,label:a+" Year"+(a>1?"s":"")})),o.termYears)}
        ${_e("Voting Weight",t,"votingWeight",[{value:"equal",label:"Equal",hint:"One vote per member"},{value:"seat_share",label:"By Seat Share",hint:"Weighted by parliament seats"}],o.votingWeight)}
        ${_e("Vote Pass Threshold",t,"votePass",[{value:"majority",label:"Majority",hint:">50% of votes cast"},{value:"unanimous",label:"Unanimous",hint:"All members must vote yes"}],o.votePass)}`}function Dn(e,t){const o=e.config,a=o.ideologicalThreshold||{enabled:!1,directions:[]},n=a.directions||[],r=Tn.map(i=>{const l=i.poles.map(s=>{const c=n.includes(s.toLowerCase()),u=i.poles.find(_=>_!==s),f=n.includes(u.toLowerCase());return`<label class="ipo-ideology-check ${f?"ipo-disabled":""}" style="margin-right:12px;">
                <input type="checkbox" ${c?"checked":""} ${f?"disabled":""}
                    onchange="ipoToggleIdeology(${t},'${s.toLowerCase()}',this.checked)" />
                ${s}
            </label>`}).join("");return`<div class="ipo-ideology-axis"><span class="ipo-ideology-axis-name">${i.axis}</span>${l}</div>`}).join("");return`
        ${_e("New Member Admission",t,"admission",[{value:"vote",label:"Vote Required",hint:"Majority vote among members"},{value:"president",label:"President Decides",hint:"President admits unilaterally"}],o.admission)}
        ${Ae("Ideological Threshold",t,"ideologicalThreshold.enabled",a.enabled)}
        ${a.enabled?`<div class="ipo-ideology-grid">${r}</div>`:""}
        ${Ae("Expulsion Clause",t,"expulsionClauseEnabled",!!o.expulsionClause)}
        ${o.expulsionClause?_e("Expulsion Method",t,"expulsionClause",[{value:"president",label:"President Only",hint:""},{value:"majority",label:"Majority Vote",hint:""},{value:"unanimous",label:"Unanimous Vote",hint:""}],o.expulsionClause):""}`}function jn(e,t){const o=e.config;return`
        ${_e("Action Leadership",t,"actionLeadership",[{value:"unilateral",label:"Unilateral",hint:"Any member can execute actions with their own cash"},{value:"committee",label:"Committee",hint:"All actions require a vote. Funded from solidarity fund"},{value:"presidential",label:"Presidential",hint:"Only the president can execute actions"},{value:"delegated",label:"Delegated",hint:"President + designated officers can act. Others vote"},{value:"tiered",label:"Tiered",hint:`Actions ≤${C(2*O)} are unilateral. Higher cost requires a vote`}],o.actionLeadership||"unilateral")}
        ${_e("Vote Transparency",t,"voteTransparency",[{value:"public",label:"Public Ballot",hint:"All see how everyone voted"},{value:"secret",label:"Secret Ballot",hint:"Only outcome revealed"}],o.voteTransparency)}
        ${Ae("Observer Status",t,"observerStatus",o.observerStatus)}
        ${Ae("Veto Right",t,"vetoRightEnabled",!!o.vetoRight)}
        ${o.vetoRight?_e("Veto Holder",t,"vetoRight",[{value:"founding",label:"Founding Party",hint:""},{value:"president",label:"Current President",hint:""},{value:"hq",label:"HQ Nation Party",hint:""}],o.vetoRight):""}
        ${Ae("Emergency Powers",t,"emergencyPowers",o.emergencyPowers)}`}function Hn(e,t){const o=e.config,a=o.solidarityFund||{enabled:!1,contributionPerQuarter:1};return`
        ${Ae("Solidarity Fund",t,"solidarityFund.enabled",a.enabled)}
        ${a.enabled?Kt("Contribution Rate",t,"solidarityFund.contributionPerQuarter",[1,2,3].map(n=>({value:n,label:C(n*O)+" / Quarter"})),a.contributionPerQuarter):""}
        ${Ae("Resource Sharing Cap",t,"resourceSharingCapEnabled",o.resourceSharingCap!=null)}
        ${o.resourceSharingCap!=null?Kt("Max Uses Per Term",t,"resourceSharingCap",[1,2,3].map(n=>({value:n,label:n+" time"+(n>1?"s":"")})),o.resourceSharingCap||1):""}
        ${_e("Joint Statement Clause",t,"jointStatementClause",[{value:"president",label:"President Alone",hint:""},{value:"vote",label:"Majority Vote Required",hint:""}],o.jointStatementClause)}
        ${Ae("Headquarters",t,"headquartersEnabled",o.headquarters!=null)}
        ${o.headquarters!=null?`<div class="trade-field" style="margin-top:4px;">
            <label>HQ Nation</label>
            <div class="trade-info-box info" style="font-size:8px;">Headquarters will be set to your nation on creation. Can be changed later by vote.</div>
        </div>`:""}`}function _e(e,t,o,a,n){const r=a.map(i=>`<label class="trade-radio-option ${i.value===n?"selected":""}"
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
        </div>`}function Kt(e,t,o,a,n){const r=a.map(i=>`<option value="${i.value}" ${i.value==n?"selected":""}>${i.label}</option>`).join("");return`
        <div class="trade-field">
            <label>${e}</label>
            <select onchange="ipoSetArticleField(${t},'${o}',this.value)"
                style="width:auto;font-size:0.75rem;padding:4px 8px;background:var(--bg-1);color:var(--text-primary);border:1px solid var(--border-hair);border-radius:3px;">
                ${r}
            </select>
        </div>`}function Ae(e,t,o,a){return`
        <div class="trade-field" style="display:flex;align-items:center;gap:8px;">
            <label style="margin-bottom:0;flex:1;">${e}</label>
            <button class="ipo-toggle-btn ${a?"is-on":""}"
                onclick="ipoToggleArticleField(${t},'${o}')">
                ${a?"ON":"OFF"}
            </button>
        </div>`}function tt(){return G||J}function ft(){G?mt():Tt()}function Vn(e,t,o){const a=tt()[e];if(!a)return;const n=t.split(".");let r=a.config;for(let l=0;l<n.length-1;l++)r[n[l]]||(r[n[l]]={}),r=r[n[l]];const i=Number(o);r[n[n.length-1]]=isNaN(i)?o:i,ft()}function Un(e,t){const o=tt()[e];if(o){if(t==="ideologicalThreshold.enabled")o.config.ideologicalThreshold||(o.config.ideologicalThreshold={enabled:!1,directions:[]}),o.config.ideologicalThreshold.enabled=!o.config.ideologicalThreshold.enabled;else if(t==="expulsionClauseEnabled")o.config.expulsionClause=o.config.expulsionClause?null:"majority";else if(t==="vetoRightEnabled")o.config.vetoRight=o.config.vetoRight?null:"president";else if(t==="resourceSharingCapEnabled")o.config.resourceSharingCap=o.config.resourceSharingCap!=null?null:2;else if(t==="headquartersEnabled")o.config.headquarters=o.config.headquarters!=null?null:"__self__";else if(t==="solidarityFund.enabled")o.config.solidarityFund||(o.config.solidarityFund={enabled:!1,contributionPerQuarter:1}),o.config.solidarityFund.enabled=!o.config.solidarityFund.enabled;else{const a=t.split(".");let n=o.config;for(let r=0;r<a.length-1;r++)n[a[r]]||(n[a[r]]={}),n=n[a[r]];n[a[a.length-1]]=!n[a[a.length-1]]}ft()}}function Yn(e,t,o){const a=tt()[e];if(!a)return;const n=a.config.ideologicalThreshold;n&&(o?n.directions.includes(t)||n.directions.push(t):n.directions=n.directions.filter(r=>r!==t),ft())}function Gn(){const e=4*O,t=Math.max(0,J.length-1),o=t*O,a=e+o,n=J.map(r=>`<div class="ipo-confirm-article">
            <span class="ipo-confirm-article-label">${Nt.find(l=>l.key===r.type)?.label||r.type}</span>
            <span class="ipo-confirm-article-detail">${Wn(r)}</span>
        </div>`).join("");return`
        <div class="ipo-confirm-preview">
            <div class="ipo-confirm-identity">
                ${ye?`<img src="${ye}" class="ipo-header-logo ipo-logo-img" alt="" />`:`<span class="ipo-header-logo">${v(Ce)} ${v(ce)}</span>`}
                <div>
                    <div style="font-family:var(--font-sans);font-size:13px;font-weight:700;color:#e2d9b4;">${v(ve)}</div>
                    ${Je?`<div style="font-family:var(--font-sans);font-size:10px;color:#6b6a5e;margin-top:2px;">${v(Je)}</div>`:""}
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
        </div>`}function Wn(e){const t=e.config;switch(e.type){case"mission":return v((t.text||"").substring(0,80))+((t.text||"").length>80?"...":"");case"leadership":return`${{rotation:"Rotation",most_seats:"Most Seats",random:"Random"}[t.type]||t.type} · ${t.termYears}yr · ${t.votingWeight==="equal"?"Equal":"Seat Share"} · ${t.votePass==="unanimous"?"Unanimous":"Majority"}`;case"membership":{const o=[t.admission==="vote"?"Vote admission":"President admits"];return t.ideologicalThreshold?.enabled&&t.ideologicalThreshold.directions?.length&&o.push("Ideology: "+t.ideologicalThreshold.directions.join(", ")),t.expulsionClause&&o.push("Expulsion: "+t.expulsionClause),o.join(" · ")}case"governance":{const o=[t.voteTransparency==="public"?"Public ballot":"Secret ballot"];return t.observerStatus&&o.push("Observers"),t.vetoRight&&o.push("Veto: "+t.vetoRight),t.emergencyPowers&&o.push("Emergency powers"),o.join(" · ")}case"resources":{const o=[];return t.solidarityFund?.enabled&&o.push("Fund: "+C((Number(t.solidarityFund.contributionPerQuarter)||1)*O)+"/qtr"),t.resourceSharingCap!=null&&o.push("Cap: "+t.resourceSharingCap+"/term"),o.push("Statements: "+(t.jointStatementClause==="president"?"President":"Vote")),t.headquarters!=null&&o.push("HQ enabled"),o.join(" · ")}default:return""}}async function Xn(){if(!h||!we||P)return;P=!0;const e=(4+Math.max(0,J.length-1))*O,t={};for(const o of J)switch(o.type){case"mission":t.mission=o.config.text||"";break;case"leadership":t.leadership={type:o.config.type,termYears:Number(o.config.termYears),votingWeight:o.config.votingWeight,votePass:o.config.votePass};break;case"membership":t.membership={admission:o.config.admission,ideologicalThreshold:o.config.ideologicalThreshold||{enabled:!1,directions:[]},expulsionClause:o.config.expulsionClause||null};break;case"governance":t.governance={voteTransparency:o.config.voteTransparency,observerStatus:!!o.config.observerStatus,vetoRight:o.config.vetoRight||null,emergencyPowers:!!o.config.emergencyPowers};break;case"resources":t.resources={solidarityFund:o.config.solidarityFund||{enabled:!1,contributionPerQuarter:1},resourceSharingCap:o.config.resourceSharingCap??null,jointStatementClause:o.config.jointStatementClause||"vote",headquarters:o.config.headquarters==="__self__"?we.id:o.config.headquarters||null};break}t.leadership||(t.leadership={type:"rotation",termYears:2,votingWeight:"equal",votePass:"majority"}),t.membership||(t.membership={admission:"vote",ideologicalThreshold:{enabled:!1,directions:[]},expulsionClause:null}),t.governance||(t.governance={voteTransparency:"public",observerStatus:!1,vetoRight:null,emergencyPowers:!1}),t.resources||(t.resources={solidarityFund:{enabled:!1,contributionPerQuarter:1},resourceSharingCap:null,jointStatementClause:"vote",headquarters:null});try{let o=null;if(ge){const d=ge.name.split(".").pop()||"png",g=`ipo-logos/${Date.now()}-${Math.random().toString(36).slice(2,8)}.${d}`,{error:x}=await p.storage.from("public-assets").upload(g,ge,{contentType:ge.type,upsert:!0});if(x){console.error("[IPO] Logo upload failed:",x.message),alert("Logo upload failed: "+x.message);return}const{data:I}=p.storage.from("public-assets").getPublicUrl(g);o=I?.publicUrl||null}const a=await He(h.id,e);if(!a.success){alert("Insufficient cash. You need "+C(e)+" to create this organisation.");return}h.party_funds=a.newFunds;const{data:n,error:r}=await p.from("international_orgs").insert({name:ve.trim(),description:Je.trim()||null,logo_symbol:Ce,logo_text:ce.trim().toUpperCase(),logo_image_url:o,founded_at_tick:k,founding_party_id:h.id,president_id:h.id,president_term_start_tick:k,headquarters_nation_id:t.resources.headquarters,solidarity_fund_balance:0,charter:t}).select("id").single();if(r){console.error("[IPO] Create org error:",r);const{data:d}=await p.from("factions").select("party_funds").eq("id",h.id).single(),g=(Number(d?.party_funds)||0)+e,{error:x}=await p.from("factions").update({party_funds:g}).eq("id",h.id);x&&console.error("[IPO] Refund failed (manual reconciliation may be needed):",x),h.party_funds=g,alert("Failed to create organisation: "+r.message);return}const i=Gt[0],{error:l}=await p.from("ipo_members").insert({org_id:n.id,faction_id:h.id,role:"member",joined_at_tick:k,chat_color:i});l&&console.error("[IPO] Failed to add founding member:",l.message),await p.from("ipo_chat").insert({org_id:n.id,faction_id:null,is_system:!0,message_text:`${v(ve.trim())} has been founded by ${h.faction_name}.`,tick_posted:k});const s=ve.trim(),c=we.name||"their nation";let u=c;if(t.resources.headquarters&&t.resources.headquarters!==we.id)try{const{data:d}=await p.from("nations").select("name").eq("id",t.resources.headquarters).maybeSingle();d?.name&&(u=d.name)}catch{}const f=`${h.faction_name} founds ${s}`,_=`The ${h.faction_name} of ${c} has created the ${s}, headquartered in ${u}.`,m={org_name:s,party:h.faction_name,founder_nation:c,hq_nation:u};await p.from("event_log").insert({nation_id:we.id,event_name:f,description_chosen:_,trigger_key:"ipo_founded",category:"political",effects_applied:m,fired_at_tick:k}),t.resources.headquarters&&t.resources.headquarters!==we.id&&await p.from("event_log").insert({nation_id:t.resources.headquarters,event_name:f,description_chosen:_,trigger_key:"ipo_founded",category:"political",effects_applied:m,fired_at_tick:k}),Do(),b=n.id,ie()}catch(o){console.error("[IPO] Creation error:",o),alert("Failed to create organisation.")}finally{P=!1}}window.selectIPOOrg=Ya;window.acceptIPOInvite=Ga;window.declineIPOInvite=Wa;window.openIPOCreationModal=Cn;window.closeIPOCreationModal=Do;window.sendIPOChat=qa;window.openIPOInviteModal=za;window.openIPOAmendModal=Qa;window.leaveIPOOrg=Ua;window.ipoSelectSymbol=On;window.ipoAddArticle=Rn;window.ipoRemoveArticle=Fn;window.ipoSetArticleField=Vn;window.ipoToggleArticleField=Un;window.ipoToggleIdeology=Yn;window.ipoActiveArticles=tt;window.submitIPOCreation=Xn;window.renderIPOCreateStep=Tt;window.ipoHandleLogoUpload=Ln;window.ipoRemoveLogoUpload=jo;function Vo(){const e=document.getElementById("ipo-step1-next");if(!e)return;const t=ve.trim()&&ce.trim();e.disabled=!t;const o=document.getElementById("ipo-create-logo-preview");o&&(o.innerHTML=`Preview: ${Ce} ${v(ce)||"..."}`)}window.ipoSetCreateName=function(e){ve=e,Vo()};window.ipoSetCreateDesc=function(e){Je=e};window.ipoSetCreateLogoText=function(e){ce=e.toUpperCase(),Vo()};window.ipoSetCreateStep=function(e){Ue=e,Tt()};window.closeIPOAmendModal=Oo;window.ipoAmendAddArticle=Za;window.ipoAmendHandleLogoFile=Ja;window.ipoAmendRemoveLogo=Ka;window.ipoVoteHandleLogoFile=rn;window.ipoVoteRemoveLogo=sn;window.ipoVoteSetLogoSymbol=function(e){X&&(X.symbol=e)};window.ipoVoteSetLogoText=function(e){X&&(X.text=e)};window.submitIPOAmend=en;window.openIPOVoteModal=nn;window.closeIPOVoteModal=Mo;window.renderIPOVoteModalTypeSelect=Bo;window.selectIPOVoteType=ln;window.submitIPOVote=cn;window.selectIPOBallot=dn;window.cancelIPOBallot=pn;window.confirmIPOBallot=mn;window.castIPOBallot=Ro;window.resolveIPOVote=un;window.executeIPOAction=bn;window.executeBackChannel=$n;window.executeDirectStatement=In;window.executeDirectFundDraw=Sn;window.closeIPOActionModal=Te;window.confirmHoldRally=hn;window.selectIPOInviteTarget=Da;window.submitIPOInvite=ja;window.previewIPOInviteOrg=La;window.previewExistingOrg=Po;window.requestToJoinOrg=Ma;window.openIPOExpelModal=Ha;window.submitIPOExpel=Va;let y=null,qe=null;async function Qn(e){const t=q?.faction,o=q?.nation;if(!t||!o)return{canChat:!1,role:null,displayName:null};const{data:a}=await p.from("ministries").select("minister_first_name, minister_last_name").eq("nation_id",o.id).eq("ministry_key","trade").eq("party_id",t.id).eq("is_active",!0).maybeSingle();if(a)return{canChat:!0,role:"trade_minister",displayName:(((a.minister_first_name||"")+" "+(a.minister_last_name||"")).trim()||"Minister")+" (Minister of Trade)"};const n=await Qo(p,o.id);let r=!1;return Xo(o)?r=n?.lead_party_id===t.id:r=(n?.ministry_allocations||{}).prime_minister===t.id,r?{canChat:!0,role:"prime_minister",displayName:(((o.head_of_state_first_name||"")+" "+(o.head_of_state_last_name||"")).trim()||"PM")+" (PM)"}:{canChat:!1,role:null,displayName:null}}let bt=!1;async function Jn(e){if(!bt){y&&Pt(),bt=!0;try{const t=q?.nation;if(!t){alert("Nation data not loaded.");return}const o=(K||[]).find(g=>g.id===e);if(!o){alert("Partner nation not found.");return}const a=t.id<e?t.id:e,n=t.id<e?e:t.id;let{data:r,error:i}=await p.from("trade_negotiations").select("id, status, draft_articles, approved_by_a, approved_by_b, nation_a_id, nation_b_id, agreement_type, agreement_name").eq("nation_a_id",a).eq("nation_b_id",n).in("status",["open","active","ratification"]).order("created_at",{ascending:!1}).limit(1).maybeSingle();if(i){alert("Failed to load negotiations: "+i.message);return}if(!r){const{data:g}=await p.from("shard").select("current_tick").eq("name","Alpha Shard").single(),x=g?.current_tick||0,{data:I,error:$}=await p.from("trade_negotiations").insert({nation_a_id:a,nation_b_id:n,status:"open",agreement_type:"fta",agreement_name:t.name+"-"+o.name+" Trade Agreement",opened_at_tick:x,expires_at_tick:x+48}).select("id, status, draft_articles, approved_by_a, approved_by_b, nation_a_id, nation_b_id, agreement_type, agreement_name").single();if($){alert("Failed to start negotiation: "+$.message);return}r=I;const E="Trade Minister of "+t.name+" has begun trade negotiations with the nation of "+o.name+".";p.from("event_log").insert([t.id,e].map(T=>({nation_id:T,event_name:"Trade Negotiations Opened",trigger_key:"trade_negotiation_opened",category:"trade",description_chosen:E,fired_at_tick:x}))).then(()=>{})}const l=await Qn(e),s=t.flag_url||`assets/flags/${t.name}.png`,c=o.flag_url||`assets/flags/${o.name}.png`,u=r.nation_a_id===t.id;wt[r.id]&&delete wt[r.id],p.rpc("mark_trade_negotiation_seen",{p_neg_id:r.id}).then(({error:g})=>{g&&console.warn("[trade-neg] mark_seen failed:",g.message)}),y={negotiationId:r.id,myNationId:t.id,partnerNationId:e,myNationName:t.name,partnerNationName:o.name,myFlag:s,partnerFlag:c,status:r.status,chatRole:l,articles:r.draft_articles||[],weAreA:u,agreementType:r.agreement_type,agreementName:r.agreement_name,approvedByA:r.approved_by_a,approvedByB:r.approved_by_b};const f=document.getElementById("trade-neg-header");f.innerHTML=`
        <div class="trade-neg-header__nations">
            <div class="trade-neg-header__nation">
                <img src="${v(s)}" alt="" class="trade-neg-header__flag" onerror="this.style.display='none'">
                <span class="trade-neg-header__name">${v(t.name)}</span>
            </div>
            <div class="trade-neg-header__title" id="trade-neg-title-text">${v(r.agreement_name||t.name+"-"+o.name+" Trade Agreement")}</div>
            <div class="trade-neg-header__nation">
                <span class="trade-neg-header__name">${v(o.name)}</span>
                <img src="${v(c)}" alt="" class="trade-neg-header__flag" onerror="this.style.display='none'">
            </div>
        </div>
        <span class="trade-neg-header__close" onclick="closeTradeNegModal()">&times;</span>
    `,document.getElementById("trade-neg-modal").classList.add("active");const _=document.getElementById("trade-neg-chat-input-bar"),m=document.getElementById("trade-neg-chat-messages");if(l.canChat){_.style.display="flex",_.innerHTML=`
            <input type="text" id="trade-neg-chat-input" placeholder="Chatting as ${v(l.displayName)}..." maxlength="2000">
            <button id="trade-neg-chat-send" disabled>Send</button>
        `;const g=document.getElementById("trade-neg-chat-input"),x=document.getElementById("trade-neg-chat-send");g.addEventListener("input",()=>{x.disabled=!g.value.trim()}),g.addEventListener("keydown",I=>{I.key==="Enter"&&!I.shiftKey&&g.value.trim()&&(I.preventDefault(),bo())}),x.addEventListener("click",()=>bo())}else _.style.display="none";gt(),ei(),co();const d=document.getElementById("trade-neg-name-btn");d&&y.agreementName&&y.agreementName.trim()&&(d.style.borderColor="var(--green)",d.style.color="var(--green)",d.textContent="Rename Agreement"),await Kn(r.id),Zn(r.id)}catch(t){alert("Trade negotiation error: "+(t.message||t))}finally{bt=!1}}}function ro(e){const t=q?.faction?.id;if(e.is_system)return`<div class="trade-neg-msg trade-neg-msg--system">${v(e.message_text)}</div>`;const o=e.sender_faction_id===t,a=o?"trade-neg-msg trade-neg-msg--sent":"trade-neg-msg trade-neg-msg--received",n=o?"":`<div class="trade-neg-msg__sender">${v(e.sender_display_name)}</div>`,r=e.created_at?new Date(e.created_at).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}):"";return`<div class="${a}">
        ${n}
        <div>${v(e.message_text)}</div>
        <div class="trade-neg-msg__time">${r}</div>
    </div>`}async function Kn(e){const t=document.getElementById("trade-neg-chat-messages");if(!t)return;const{data:o,error:a}=await p.from("negotiation_messages").select("*").eq("negotiation_id",e).order("created_at",{ascending:!0}).limit(200);if(a){t.innerHTML='<div style="padding:20px;text-align:center;color:#c55;font-family:var(--font-mono);font-size:10px;">Failed to load messages.</div>';return}if(!o||o.length===0){const n=y?.chatRole?.canChat;y?.partnerNationName,t.innerHTML=n?'<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">No messages yet. Start the conversation.</div>':`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;gap:8px;padding:20px;">
                <div style="color:var(--text-dim);font-family:var(--font-mono);font-size:10px;text-align:center;">No messages yet.</div>
                <div style="color:var(--text-ghost);font-family:var(--font-mono);font-size:9px;text-align:center;line-height:1.5;max-width:220px;">
                    You need to hold the position of PM or Minister of Trade to participate in this chat.
                </div>
            </div>`;return}t.innerHTML=o.map(n=>ro(n)).join(""),t.scrollTop=t.scrollHeight}let yt=!1;async function bo(){if(yt||!y?.chatRole?.canChat)return;const e=document.getElementById("trade-neg-chat-input"),t=document.getElementById("trade-neg-chat-send");if(!e)return;const o=e.value.trim();if(!o)return;yt=!0,t&&(t.disabled=!0),e.value="";const{data:a}=await p.from("shard").select("current_tick").eq("name","Alpha Shard").single(),n=a?.current_tick||0,r={negotiation_id:y.negotiationId,sender_nation_id:y.myNationId,sender_faction_id:q.faction.id,sender_role:y.chatRole.role,sender_display_name:y.chatRole.displayName,message_text:o,is_system:!1,sent_at_tick:n},{error:i}=await p.from("negotiation_messages").insert(r);if(i)e.value=o,alert("Failed to send: "+i.message);else{const l=document.getElementById("trade-neg-chat-messages");if(l){const s=l.querySelector('[style*="justify-content:center"]');s&&!l.querySelector(".trade-neg-msg")&&s.remove(),l.insertAdjacentHTML("beforeend",ro({...r,created_at:new Date().toISOString()})),l.scrollTop=l.scrollHeight}}yt=!1,t&&(t.disabled=!e.value.trim()),e.focus()}function Zn(e){qe&&(p.removeChannel(qe),qe=null),qe=p.channel("neg-chat-"+e).on("postgres_changes",{event:"INSERT",schema:"public",table:"negotiation_messages",filter:`negotiation_id=eq.${e}`},t=>{const o=t.new;if(!o||o.sender_faction_id===q?.faction?.id)return;const a=document.getElementById("trade-neg-chat-messages");if(!a)return;const n=a.querySelector('[style*="justify-content:center"]');n&&!a.querySelector(".trade-neg-msg")&&n.remove(),a.insertAdjacentHTML("beforeend",ro(o)),a.scrollTop=a.scrollHeight,o.is_system&&o.message_text?.includes("withdrawn")&&(y&&(y.status="cancelled"),setTimeout(()=>{Pt(),alert("The other party has withdrawn from negotiations."),St().then(()=>{Ze(),Ee()}).catch(()=>{})},500))}).subscribe()}function ei(){if(!y)return;const e=y.partnerNationId,t=document.getElementById("trade-neg-my-econ");t&&(t.innerHTML=ti());const o=document.getElementById("trade-neg-their-econ");o&&(o.innerHTML=oi(e))}function ti(){const e=Eo(),t=xt(q?.nation).map(r=>({...r,tradingDelta:Number(e[r.key])||0})).sort((r,i)=>{const l=Math.abs(r.prod-r.dem+r.tradingDelta);return Math.abs(i.prod-i.dem+i.tradingDelta)-l}),o=r=>Math.round(Number(r)||0).toString(),a=r=>Math.abs(r)<.5?"—":(r>0?"+":"-")+Math.abs(Math.round(r));let n=`<div class="trade-neg-econ__head">
        <span class="trade-neg-econ__head-dot"></span>Your Economy
    </div>
    <div class="trade-neg-econ__cols">
        <span>Commodity</span><span>Prod</span><span>Dem</span><span>Bal</span>
    </div>
    <div class="trade-neg-econ__list">`;if(t.length===0)n+='<div class="trade-neg-econ__empty">No flow data yet.</div>';else for(const r of t){const i=r.prod-r.dem+r.tradingDelta,l=i>.5?"trade-neg-econ__bal--pos":i<-.5?"trade-neg-econ__bal--neg":"trade-neg-econ__bal--neu";n+=`<div class="trade-neg-econ__row">
                <div class="trade-neg-econ__name">
                    <span class="trade-neg-econ__glyph">${r.icon}</span>
                    <span>${v(r.name)}</span>
                </div>
                <span class="trade-neg-econ__num">${o(r.prod)}</span>
                <span class="trade-neg-econ__num">${o(r.dem)}</span>
                <span class="trade-neg-econ__bal ${l}">${a(i)}</span>
            </div>`}return n+="</div>",n}function oi(e){const t=(K||[]).find(u=>u.id===e),o=xt(t),a=xt(q?.nation),n=new Set(a.filter(u=>u.dem-u.prod>.5).map(u=>u.key)),r=new Set(a.filter(u=>u.prod-u.dem>.5).map(u=>u.key)),i=[],l=[];for(const u of o){const f=u.prod-u.dem,_={key:u.key,name:u.name,icon:u.icon,amount:Math.abs(f)};f>.5?i.push(_):f<-.5&&l.push(_)}i.sort((u,f)=>f.amount-u.amount),l.sort((u,f)=>f.amount-u.amount);const s=u=>Math.round(Number(u)||0).toString(),c=(u,f,_,m)=>{let d=`<div class="trade-neg-econ__section">
            <div class="trade-neg-econ__head ${f}">
                <span class="trade-neg-econ__head-dot"></span>${u}
            </div>
            <div class="trade-neg-econ__list">`;if(_.length===0)d+='<div class="trade-neg-econ__empty">No data</div>';else for(const g of _){const x=m.has(g.key);d+=`<div class="trade-neg-econ__row--simple ${x?"trade-neg-econ__row--match":""}">
                    <div class="trade-neg-econ__name">
                        <span class="trade-neg-econ__glyph">${g.icon}</span>
                        <span>${v(g.name)}${x?'<span class="trade-neg-econ__match">match</span>':""}</span>
                    </div>
                    <span class="trade-neg-econ__val">${s(g.amount)}</span>
                </div>`}return d+="</div></div>",d};return c("They Can Offer","trade-neg-econ__head--offer",i,n)+c("They Need","trade-neg-econ__head--need",l,r)}function gt(){const e=document.getElementById("trade-neg-articles");if(!e||!y)return;const t=y.articles||[],o=y.myNationId,a=y.status==="ratification"||!!y.approvedByA&&!!y.approvedByB;if(t.length===0){e.innerHTML='<div style="display:flex;align-items:center;justify-content:center;height:100%;min-height:200px;color:var(--text-dim);font-family:var(--font-mono);font-size:11px;">No articles yet. Click "Add Text Article" to begin drafting.</div>';return}const n=["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"];let r="";for(let i=0;i<t.length;i++){const l=t[i],s=n[i]||i+1,c=l.author_nation_id===o,u=!!l.strike_requested_by,f=l.strike_requested_by===o,_=l.article_type?Uo(l):v(l.text),m=l.article_type?`<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.5px;padding:1px 5px;color:var(--accent);background:rgba(90,175,165,0.08);border:1px solid rgba(90,175,165,0.15);margin-left:6px;vertical-align:middle;">${v(l.article_type.replace("_"," ").toUpperCase())}</span>`:"";let d="";if(l.article_type==="trade_flow"&&l.data){const g=l.data,x=l.author_nation_id?l.author_nation_id===y.myNationId:!0,I=x?y.myNationId:y.partnerNationId,$=x?y.partnerNationId:y.myNationId,E=x?y.myNationName:y.partnerNationName,T=x?y.partnerNationName:y.myNationName,w=g.direction==="a_buys_b"?I:$,S=g.direction==="a_buys_b"?E:T;if(w===y.myNationId&&se[g.commodity]){const N=se[g.commodity],A=Number(N.import_demand||0),B=Number(N.import_volume||0),z=Math.max(0,A-B);d=`<div style="font-family:var(--font-mono);font-size:9px;color:${Number(g.volume||0)>z?"var(--amber)":"var(--green)"};margin-top:4px;">
                    ${v(S)}'s remaining demand: ${Zt(z)}/tick
                    ${z>0?"(after domestic production and existing trade)":"(fully supplied)"}
                </div>`}}if(r+=`<div class="trade-neg-article">
            <div class="trade-neg-article__num">Article ${s}.${m}</div>
            <div class="trade-neg-article__text">${_}</div>
            ${d}
            <div class="trade-neg-article__meta">
                <span>Added by ${v(l.author_nation_name||"Unknown")}</span>
                ${a?"":c?`<span class="trade-neg-article__action" onclick="negArticleDelete('${l.id}')">Delete</span>`:u&&f?'<span style="font-family:var(--font-mono);font-size:8px;color:var(--amber);opacity:0.7;">Strike Requested</span>':u?"":`<span class="trade-neg-article__action" style="color:var(--amber);border-color:rgba(184,134,11,0.2);background:rgba(184,134,11,0.04);" onclick="negArticleRequestStrike('${l.id}')">Request to Strike</span>`}
            </div>`,u&&!f){const g=l.strike_requested_by_name||"The other party";r+=`<div class="trade-neg-article__strike">${v(g)} is requesting this article be removed.</div>`}r+="</div>"}e.innerHTML=r}function so(){const e=document.getElementById("trade-neg-add-article-form");e&&requestAnimationFrame(()=>{try{e.scrollIntoView({behavior:"smooth",block:"start"})}catch{}})}function ai(){if(y?.approvedByA&&y?.approvedByB)return;const e=document.getElementById("trade-neg-add-article-form");if(!e||!y)return;const t=y.agreementName||"";e.style.display="block",e.innerHTML=`<div class="trade-neg-add-form">
        <div class="trade-neg-add-form__label">Name This Agreement</div>
        <input id="neg-name-input" type="text" maxlength="120" value="${v(t)}" placeholder="e.g. Melizea-Hajjara Fuel & Dairy Accord" style="
            width:100%;padding:8px 10px;background:var(--bg-1);border:1px solid var(--border-main);
            color:var(--text-bright);font-family:var(--font-sans);font-size:13px;outline:none;box-sizing:border-box;
        ">
        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:3px;">120 characters max. Required before both parties can agree.</div>
        <div class="trade-neg-add-form__actions">
            <button onclick="negArticleCancelForm()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);border:1px solid var(--border-main);background:transparent;cursor:pointer;">Cancel</button>
            <button onclick="negNameAgreementSave()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#000;background:var(--amber,#b8860b);border:none;cursor:pointer;">Save Name</button>
        </div>
    </div>`,document.getElementById("neg-name-input")?.focus(),so()}let rt=!1;async function ni(){if(rt||!y)return;const t=(document.getElementById("neg-name-input")?.value||"").trim();if(!t){alert("Enter a name for the agreement.");return}rt=!0;const{error:o}=await p.from("trade_negotiations").update({agreement_name:t}).eq("id",y.negotiationId);if(o){alert("Failed to save name: "+o.message),rt=!1;return}y.agreementName=t;const a=document.getElementById("trade-neg-title-text");a&&(a.textContent=t);const n=document.getElementById("trade-neg-name-btn");n&&(n.style.borderColor="var(--green)",n.style.color="var(--green)",n.textContent="Rename Agreement"),Ke(),rt=!1}window.negNameAgreementOpen=ai;window.negNameAgreementSave=ni;function Uo(e){const t=e.data||{},o=e.author_nation_id?e.author_nation_id===y?.myNationId:!0,a=o?y?.myNationName||"Nation A":y?.partnerNationName||"Nation A",n=o?y?.partnerNationName||"Nation B":y?.myNationName||"Nation B",r=i=>Zo[i]?.label||It[i]||i||"Unknown";switch(e.article_type){case"transfer":{const i=t.direction==="a_to_b"?a+" → "+n:n+" → "+a,l=t.transfer_type==="recurring"?"Recurring":"One-Time",s=t.transfer_type==="recurring"?" per tick":"";return`${l} Transfer: $${Zt(t.amount)} ${i}${s}`}case"trade_flow":{const i=t.direction==="a_buys_b"?a+" buys from "+n:n+" buys from "+a,l=t.duration===0?"Continuous":t.duration+" ticks",s=t.delivery_priority?` · Delivery: ${t.delivery_priority.charAt(0).toUpperCase()+t.delivery_priority.slice(1)}`:"",c=Math.round(Number(t.volume)||0).toLocaleString();return`${r(t.commodity)}: ${i}, ${c} units/tick. Duration: ${l}${s}`}case"tariff_reduction":{const i=r(t.sector),l=t.mode==="reciprocal"?"Reciprocal":"One-sided";return`${i} Tariff Reduction (${l}): ${a}→${n} ${t.a_tariff_from||"?"}% → ${t.a_tariff_to||"?"}%, ${n}→${a} ${t.b_tariff_from||"?"}% → ${t.b_tariff_to||"?"}%`}case"market_access":{const i=t.scope==="all_goods"?"All Goods":r(t.scope_sector),l={restricted:"Restricted",preferential:"Preferential (reduced tariffs)",free_trade:"Free Trade (0%)"},s=[];return t.volume_priority&&s.push("Volume priority"),t.price_priority&&s.push("Price priority"),`Market Access — ${i}: ${l[t.level]||t.level}${s.length?". "+s.join(", "):""}`}case"exit_terms":{const i=[];i.push("Min duration: "+(t.min_duration||0)+" ticks"),i.push("Exit notice: "+(t.exit_notice||0)+" ticks");const l={none:"No penalty",fixed:"Fixed $"+Zt(t.penalty_amount||0),percentage:(t.penalty_pct||0)+"% of remaining value"};return i.push(l[t.penalty_type]||"No penalty"),`Exit Terms: ${i.join(", ")}`}default:return e.text||"Unknown article type"}}function Zt(e){const t=Number(e)||0;return t>=1e9?(t/1e9).toFixed(1)+"B":t>=1e6?(t/1e6).toFixed(1)+"M":t>=1e3?(t/1e3).toFixed(0)+"k":t.toLocaleString()}const ii=[{key:"transfer",label:"TRANSFER",desc:"One-time or recurring financial transfer between nations."},{key:"trade_flow",label:"TRADE FLOW",desc:"Establish a commodity trade route with volume and price terms."},{key:"tariff_reduction",label:"TARIFF REDUCTION",desc:"Reduce tariffs on a specific sector for one or both nations."},{key:"market_access",label:"MARKET ACCESS",desc:"Grant preferential or free trade access to sectors or all goods."},{key:"exit_terms",label:"EXIT TERMS",desc:"Define minimum duration, exit notice period, and withdrawal penalties."}];let re=null;function ri(){if(y?.approvedByA&&y?.approvedByB)return;re=null;const e=document.getElementById("trade-neg-add-article-form");if(!e)return;e.style.display="block";let t='<div class="trade-neg-add-form">';t+='<div class="trade-neg-add-form__label">Select Article Type</div>';for(const o of ii)t+=`<div onclick="negStructuredArticleSelectType('${o.key}')" style="
            padding:10px 12px;margin-bottom:4px;cursor:pointer;
            border:1px solid var(--border-main);
            background:var(--bg-1);
            transition:all 0.1s;
        " onmouseenter="this.style.borderColor='var(--accent)'" onmouseleave="this.style.borderColor='var(--border-main)'">
            <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--accent);letter-spacing:0.5px;">${o.label}</div>
            <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">${o.desc}</div>
        </div>`;t+='<div class="trade-neg-add-form__actions">',t+='<button onclick="negArticleCancelForm()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);border:1px solid var(--border-main);background:transparent;cursor:pointer;">Cancel</button>',t+="</div></div>",e.innerHTML=t,so()}function si(e){switch(re=e,e){case"transfer":return li();case"trade_flow":return ci();case"tariff_reduction":return pi();case"market_access":return mi();case"exit_terms":return ui()}}function li(){const e=document.getElementById("trade-neg-add-article-form");if(!e)return;const t=y?.myNationName||"Nation A",o=y?.partnerNationName||"Nation B";e.innerHTML=`<div class="trade-neg-add-form">
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
                    <option value="a_to_b">${v(t)} → ${v(o)}</option>
                    <option value="b_to_a">${v(o)} → ${v(t)}</option>
                </select>
            </div>
        </div>
        <div class="trade-neg-add-form__actions">
            <button onclick="negArticleCancelForm()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);border:1px solid var(--border-main);background:transparent;cursor:pointer;">Cancel</button>
            <button onclick="negStructuredArticleConfirm()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#000;background:var(--accent,#5aafa5);border:none;cursor:pointer;">Confirm</button>
        </div>
    </div>`}function ci(){const e=document.getElementById("trade-neg-add-article-form");if(!e)return;const t=y?.myNationName||"Nation A",o=y?.partnerNationName||"Nation B",a=[{value:"energy",label:"⚡ Energy"},{value:"minerals",label:"⛏ Minerals"},{value:"food",label:"🌾 Food"},{value:"consumer_goods",label:"📦 Consumer Goods"},{value:"luxury_goods",label:"💎 Luxury Goods"}].map(n=>`<option value="${n.value}">${n.label}</option>`).join("");e.innerHTML=`<div class="trade-neg-add-form">
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
                    <option value="a_buys_b">${v(t)} buys from ${v(o)}</option>
                    <option value="b_buys_a">${v(o)} buys from ${v(t)}</option>
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
    </div>`,setTimeout(()=>{lo("cheapest"),Yo()},0),di().then(()=>Go())}function Yo(){const e=document.getElementById("neg-flow-direction"),t=document.getElementById("neg-flow-delivery-picker"),o=document.getElementById("neg-flow-priority-note");if(!e||!t)return;const n=(e.value||"a_buys_b")==="a_buys_b";n||lo("cheapest"),t.style.opacity=n?"1":"0.45",t.style.pointerEvents=n?"auto":"none",o&&(o.textContent=n?"After ratification, every shipping corp can offer a route. The system auto-awards based on this preference (cheapest is also the universal tiebreaker).":"Locked — only the buyer chooses delivery preference (they pay the freight). Defaults to cheapest.")}window.negFlowSyncPriorityLock=Yo;let eo="cheapest";function lo(e){if(!["fastest","safest","cheapest"].includes(e))return;eo=e;const t=document.getElementById("neg-flow-delivery-picker");if(t)for(const o of t.querySelectorAll("button[data-priority]")){const a=o.dataset.priority===e;o.style.background=a?"var(--accent,#5aafa5)":"transparent",o.style.color=a?"#000":"var(--text-dim)"}}window.negFlowSetPriority=lo;async function di(){if(!y||y._capacityFlows)return;const e=y.myNationId,t=y.partnerNationId;!e||!t||(y._capacityFlows={[e]:{},[t]:{}})}function Go(){const e=document.getElementById("neg-flow-warnings");if(!e)return;const t=y?._capacityFlows;if(!t){e.style.display="none";return}const o=document.getElementById("neg-flow-commodity")?.value||"",a=document.getElementById("neg-flow-direction")?.value||"a_buys_b",n=Number(document.getElementById("neg-flow-volume")?.value)||0;if(!o||n<=0){e.style.display="none";return}const r=y.myNationId,i=y.partnerNationId,l=a==="a_buys_b"?r:i,s=a==="a_buys_b"?i:r,c=(l===r?y.myNationName:y.partnerNationName)||"Buyer",u=(s===r?y.myNationName:y.partnerNationName)||"Seller",f=t[l]?.[o],_=t[s]?.[o],m=g=>g>=1e9?"$"+(g/1e9).toFixed(1)+"B":g>=1e6?"$"+(g/1e6).toFixed(0)+"M":"$"+Math.round(g).toLocaleString(),d=[];if(_){const g=_.export_capacity;if(n>g){const x=n-g;d.push(`<strong>${v(u)}</strong> has ${m(g)}/tick organic export capacity for this commodity — short by ${m(x)}/tick. The contract will still fire (the engine treats the gap as off-the-books supply / re-export), but expect lower fulfillment if the seller's capacity drops further.`)}}if(f){const g=f.import_demand;g===0&&n>0?d.push(`<strong>${v(c)}</strong> has no organic demand for this commodity (already net-exporter or self-sufficient). The contract creates the demand — ${v(c)} will pay for ${m(n)}/tick they don't currently need.`):n>g*5&&g>0&&d.push(`<strong>${v(c)}</strong>'s organic demand for this commodity is only ${m(g)}/tick — your contract is ${(n/g).toFixed(1)}× that. The contract will fire but the buyer is committing to far more than their natural usage.`)}if(d.length===0){e.style.display="none";return}e.innerHTML=d.map(g=>"⚠ "+g).join("<br><br>"),e.style.display="block"}window.negFlowEvaluateWarnings=Go;function pi(){const e=document.getElementById("trade-neg-add-article-form");if(!e)return;const t=y?.myNationName||"Nation A",o=y?.partnerNationName||"Nation B",a=yo.map(n=>`<option value="${n.key}">${v(n.label)}</option>`).join("");e.innerHTML=`<div class="trade-neg-add-form">
        <div class="trade-neg-add-form__label">Tariff Reduction</div>
        <div style="display:flex;flex-direction:column;gap:8px;">
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">SECTOR</div>
                <select id="neg-tariff-sector" style="width:100%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;">
                    ${a}
                </select>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">${v(t)} TARIFF → ${v(o)}</div>
                <div style="display:flex;gap:6px;align-items:center;">
                    <input id="neg-tariff-a-from" type="number" min="0" max="100" placeholder="From %" style="width:48%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;box-sizing:border-box;">
                    <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">→</span>
                    <input id="neg-tariff-a-to" type="number" min="0" max="100" placeholder="To %" style="width:48%;padding:6px 8px;background:var(--bg-1);border:1px solid var(--border-main);color:var(--text-bright);font-family:var(--font-mono);font-size:11px;box-sizing:border-box;">
                </div>
            </div>
            <div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-bottom:3px;">${v(o)} TARIFF → ${v(t)}</div>
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
    </div>`}function mi(){const e=document.getElementById("trade-neg-add-article-form");if(!e)return;const t=yo.map(o=>`<option value="${o.key}">${v(o.label)}</option>`).join("");e.innerHTML=`<div class="trade-neg-add-form">
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
    </div>`}function ui(){const e=document.getElementById("trade-neg-add-article-form");e&&(e.innerHTML=`<div class="trade-neg-add-form">
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
    </div>`)}let Oe=!1;async function fi(){if(Oe||!y||!re)return;let e={};if(re==="transfer"){const c=Number(document.getElementById("neg-transfer-amount")?.value||0);if(c<=0){alert("Enter a valid amount.");return}e={transfer_type:document.getElementById("neg-transfer-type")?.value||"one_time",amount:c,direction:document.getElementById("neg-transfer-direction")?.value||"a_to_b"}}else if(re==="trade_flow"){const c=Number(document.getElementById("neg-flow-volume")?.value||0);if(c<=0){alert("Enter a valid volume.");return}const u=document.getElementById("neg-flow-direction")?.value||"a_buys_b",f=u==="a_buys_b",_=["fastest","safest","cheapest"].includes(eo)?eo:"cheapest",m=f?_:"cheapest";e={commodity:document.getElementById("neg-flow-commodity")?.value||"fuel_energy",direction:u,volume:c,duration:Number(document.getElementById("neg-flow-duration")?.value||0),delivery_priority:m}}else if(re==="tariff_reduction"){const c=Number(document.getElementById("neg-tariff-a-from")?.value),u=Number(document.getElementById("neg-tariff-a-to")?.value),f=Number(document.getElementById("neg-tariff-b-from")?.value),_=Number(document.getElementById("neg-tariff-b-to")?.value);if(isNaN(c)||isNaN(u)||isNaN(f)||isNaN(_)){alert("Fill in all tariff values.");return}e={sector:document.getElementById("neg-tariff-sector")?.value||"fuel_energy",a_tariff_from:c,a_tariff_to:u,b_tariff_from:f,b_tariff_to:_,mode:document.getElementById("neg-tariff-mode")?.value||"reciprocal"}}else if(re==="market_access"){const c=document.getElementById("neg-market-scope")?.value||"all_goods";e={scope:c,scope_sector:c==="sector"?document.getElementById("neg-market-sector")?.value||"fuel_energy":null,level:document.getElementById("neg-market-level")?.value||"preferential",volume_priority:document.getElementById("neg-market-volume-priority")?.checked||!1,price_priority:document.getElementById("neg-market-price-priority")?.checked||!1}}else if(re==="exit_terms"){const c=document.getElementById("neg-exit-penalty-type")?.value||"none";e={min_duration:Number(document.getElementById("neg-exit-min-duration")?.value||12),exit_notice:Number(document.getElementById("neg-exit-notice")?.value||3),penalty_type:c,penalty_amount:c==="fixed"?Number(document.getElementById("neg-exit-penalty-amount")?.value||0):0,penalty_pct:c==="percentage"?Number(document.getElementById("neg-exit-penalty-pct")?.value||0):0}}if(Oe=!0,(await Ct(y.negotiationId)).locked){alert("This agreement is locked — both parties have approved and ratification is in motion. Articles cannot be added."),Oe=!1,Ke();return}const o={id:crypto.randomUUID(),article_type:re,data:e,author_nation_id:y.myNationId,author_nation_name:y.myNationName,added_at_tick:0,strike_requested_by:null,strike_requested_by_name:null},{data:a}=await p.from("shard").select("current_tick").eq("name","Alpha Shard").single();o.added_at_tick=a?.current_tick||0;const{data:n,error:r}=await p.from("trade_negotiations").select("draft_articles, agreement_type").eq("id",y.negotiationId).single();if(r||!n){alert("Failed to load articles."),Oe=!1;return}const l=[...n.draft_articles||[],o],{error:s}=await p.from("trade_negotiations").update({draft_articles:l,agreement_type:At(l,n.agreement_type)}).eq("id",y.negotiationId);if(s){alert("Failed to add article: "+s.message),Oe=!1;return}y.articles=l,Ke(),gt(),Oe=!1}window.negStructuredArticleOpen=ri;window.negStructuredArticleSelectType=si;window.negStructuredArticleConfirm=fi;function gi(){if(y?.approvedByA&&y?.approvedByB)return;const e=document.getElementById("trade-neg-add-article-form");if(!e)return;e.style.display="block",e.innerHTML=`<div class="trade-neg-add-form">
        <div class="trade-neg-add-form__label">New Article</div>
        <textarea id="trade-neg-article-text" maxlength="300" rows="3" placeholder="Enter article text..."></textarea>
        <div class="trade-neg-add-form__counter"><span id="trade-neg-article-counter">0</span>/300</div>
        <div class="trade-neg-add-form__actions">
            <button onclick="negArticleCancelForm()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-dim);border:1px solid var(--border-main);background:transparent;cursor:pointer;">Cancel</button>
            <button id="trade-neg-article-add-btn" onclick="negArticleAdd()" style="padding:6px 14px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#000;background:var(--accent,#5aafa5);border:none;cursor:pointer;" disabled>Add Article</button>
        </div>
    </div>`;const t=document.getElementById("trade-neg-article-text"),o=document.getElementById("trade-neg-article-counter"),a=document.getElementById("trade-neg-article-add-btn");t.focus(),t.addEventListener("input",()=>{o.textContent=t.value.length,a.disabled=!t.value.trim()}),so()}function Ke(){const e=document.getElementById("trade-neg-add-article-form");e&&(e.style.display="none",e.innerHTML="")}async function Ct(e){const{data:t,error:o}=await p.from("trade_negotiations").select("status, approved_by_a, approved_by_b").eq("id",e).single();return o||!t?{locked:!1,fetchFailed:!0}:{locked:t.status==="ratification"||!!t.approved_by_a&&!!t.approved_by_b,fetchFailed:!1,status:t.status}}let Le=!1;async function vi(){if(Le||!y)return;const e=document.getElementById("trade-neg-article-text");if(!e)return;const t=e.value.trim();if(!t)return;if(Le=!0,(await Ct(y.negotiationId)).locked){alert("This agreement is locked — both parties have approved and ratification is in motion. To edit articles, the agreement would need to fail in parliament first."),Le=!1,Ke();return}const a={id:crypto.randomUUID(),text:t,author_nation_id:y.myNationId,author_nation_name:y.myNationName,added_at_tick:0,strike_requested_by:null,strike_requested_by_name:null},{data:n}=await p.from("shard").select("current_tick").eq("name","Alpha Shard").single();a.added_at_tick=n?.current_tick||0;const{data:r,error:i}=await p.from("trade_negotiations").select("draft_articles, agreement_type").eq("id",y.negotiationId).single();if(i){alert("Failed to load articles: "+i.message),Le=!1;return}const s=[...r?.draft_articles||[],a],{error:c}=await p.from("trade_negotiations").update({draft_articles:s,agreement_type:At(s,r.agreement_type)}).eq("id",y.negotiationId);if(c){alert("Failed to add article: "+c.message),Le=!1;return}y.articles=s,Ke(),gt(),Le=!1}let Me=!1;async function _i(e){if(!y||Me||!confirm("Delete this article?"))return;if(Me=!0,(await Ct(y.negotiationId)).locked){alert("This agreement is locked — both parties have approved and ratification is in motion. Articles cannot be deleted."),Me=!1;return}const{data:o,error:a}=await p.from("trade_negotiations").select("draft_articles, agreement_type").eq("id",y.negotiationId).single();if(a||!o){alert("Failed to load articles."),Me=!1;return}const r=(o.draft_articles||[]).filter(l=>l.id!==e),{error:i}=await p.from("trade_negotiations").update({draft_articles:r,agreement_type:At(r,o.agreement_type)}).eq("id",y.negotiationId);if(i){alert("Failed to delete article: "+i.message),Me=!1;return}y.articles=r,gt(),Me=!1}let Be=!1;async function bi(e){if(!y||Be)return;if(Be=!0,(await Ct(y.negotiationId)).locked){alert("This agreement is locked — both parties have approved and ratification is in motion. Articles cannot be struck."),Be=!1;return}const{data:o,error:a}=await p.from("trade_negotiations").select("draft_articles, agreement_type").eq("id",y.negotiationId).single();if(a||!o){alert("Failed to load articles."),Be=!1;return}const r=(o.draft_articles||[]).map(l=>l.id!==e?l:{...l,strike_requested_by:y.myNationId,strike_requested_by_name:y.myNationName}),{error:i}=await p.from("trade_negotiations").update({draft_articles:r,agreement_type:At(r,o.agreement_type)}).eq("id",y.negotiationId);if(i){alert("Failed to request strike: "+i.message),Be=!1;return}y.articles=r,gt(),Be=!1}function co(){const e=document.getElementById("trade-neg-agreement-btn");if(!e||!y)return;const t=y.weAreA?y.approvedByA:y.approvedByB,o=y.weAreA?y.approvedByB:y.approvedByA,a=(t?1:0)+(o?1:0),n=document.getElementById("trade-neg-add-structured-btn"),r=document.getElementById("trade-neg-add-article-btn"),i=document.getElementById("trade-neg-name-btn");a===2?(n&&(n.disabled=!0,n.style.opacity="0.3"),r&&(r.disabled=!0,r.style.opacity="0.3"),i&&(i.disabled=!0,i.style.opacity="0.3")):(n&&(n.disabled=!1,n.style.opacity="1"),r&&(r.disabled=!1,r.style.opacity="1"),i&&(i.disabled=!1,i.style.opacity="1")),a===2?(e.textContent="Agreement [2/2]",e.style.color="#4ade80",e.style.borderColor="rgba(74,222,128,0.3)",e.disabled=!0):t?(e.textContent="Agreement ["+a+"/2]",e.style.color="#5aafa5",e.style.borderColor="rgba(90,175,165,0.3)",e.disabled=!1):(e.textContent="Not in Agreement ["+a+"/2]",e.style.color="var(--text-dim)",e.style.borderColor="var(--border-main)",e.disabled=!1);const l=document.getElementById("trade-neg-send-parliament-btn");if(l){const s=y.status==="ratification";l.style.display=a===2&&!s?"":"none"}}async function yi(){if(!y||!y.negotiationId)return;if(!y.chatRole?.canChat){alert("You need a diplomatic role to send the agreement to parliament.");return}const e=document.getElementById("trade-neg-send-parliament-btn");e&&(e.disabled=!0,e.textContent="Sending…");try{await sendTradeToParliament(y.negotiationId),y.status="ratification",co()}finally{e&&(e.disabled=!1,e.textContent="Send to Parliament")}}window.sendTradeToParliamentFromModal=yi;let xe=!1;async function hi(){if(xe||!y)return;if(!y.chatRole?.canChat){alert("You need a diplomatic role to vote on the agreement.");return}if(y.status==="cancelled"||y.status==="ratification")return;if(!y.agreementName||!y.agreementName.trim()){alert('The agreement must be named before both parties can agree. Click "Name Agreement" first.');return}const e=y,t=e.weAreA?e.approvedByA:e.approvedByB,o=e.weAreA?"approved_by_a":"approved_by_b",a=e.weAreA?"approved_by_a_role":"approved_by_b_role",n=e.weAreA?"approved_at_a_tick":"approved_at_b_tick";xe=!0;const{data:r}=await p.from("shard").select("current_tick").eq("name","Alpha Shard").single(),i=r?.current_tick||0;if(t){const l={[o]:null,[a]:null,[n]:null},{error:s}=await p.from("trade_negotiations").update(l).eq("id",e.negotiationId);if(s){alert("Failed to revoke agreement: "+s.message),xe=!1;return}e.weAreA?e.approvedByA=null:e.approvedByB=null}else{const l=q?.faction?.id,s=e.chatRole?.role||"trade_minister",c={[o]:l,[a]:s,[n]:i},u=e.weAreA?e.approvedByB:e.approvedByA;if(u){c.status="ratification";const[{data:_},{data:m}]=await Promise.all([p.from("nations").select("name").eq("id",e.weAreA?e.myNationId:e.partnerNationId).single(),p.from("nations").select("name").eq("id",e.weAreA?e.partnerNationId:e.myNationId).single()]),d=_?.name||"Unknown",g=m?.name||"Unknown",x=e.agreementName||"Trade Agreement",I="Ratify: "+x,$='Ratification of the trade agreement "'+x+'" between '+d+" and "+g+". A YES vote enacts the agreement; a NO vote rejects it.",T={bill_type:"ratification",bill_name:I,preamble:$,trade_negotiation_id:e.negotiationId,status:"floor",proposed_tick:i,floor_tick:i,voting_ends_tick:i+3},w=e.weAreA?e.myNationId:e.partnerNationId,S=e.weAreA?e.partnerNationId:e.myNationId,M=e.weAreA?l:e.approvedByA,N=e.weAreA?e.approvedByB:l,A={...T,nation_id:w,proposed_by:M},B={...T,nation_id:S,proposed_by:N},[z,R]=await Promise.all([p.from("bills").insert(A).select("id").single(),p.from("bills").insert(B).select("id").single()]);if(z.error){alert("Error creating ratification bill: "+z.error.message),xe=!1;return}if(R.error){alert("Error creating ratification bill: "+R.error.message),xe=!1;return}c.bill_a_id=z.data?.id||null,c.bill_b_id=R.data?.id||null;const D="The "+x+" has been sent to both parliaments for ratification.";p.from("event_log").insert([w,S].map(j=>({nation_id:j,event_name:x+" — Ratification",category:"trade",description_chosen:D,fired_at_tick:i}))).then(()=>{})}const{error:f}=await p.from("trade_negotiations").update(c).eq("id",e.negotiationId);if(f){alert("Failed to approve: "+f.message),xe=!1;return}e.weAreA?e.approvedByA=l:e.approvedByB=l,u&&(e.status="ratification",alert("Both sides have approved! Ratification bills have been submitted to both parliaments."))}co(),xe=!1}window.negArticleShowForm=gi;window.negArticleCancelForm=Ke;window.negArticleAdd=vi;window.negArticleDelete=_i;window.negArticleRequestStrike=bi;window.negAgreementToggle=hi;function Pt(){document.getElementById("trade-neg-modal").classList.remove("active"),qe&&(p.removeChannel(qe),qe=null),y=null,yt=!1,st=!1,bt=!1,Le=!1,Me=!1,Be=!1,xe=!1,Oe=!1,re=null,rt=!1,Ze(),ho().then(()=>We()).catch(()=>{})}let st=!1;async function xi(){if(!y||st)return;if(y.status==="cancelled"){alert("This negotiation has already been ended.");return}const e=y.chatRole;if(!e?.canChat){alert("You need a diplomatic role to withdraw from negotiations.");return}const t=y.partnerNationName||"Unknown";if(!confirm("Withdraw from trade negotiations with "+t+`?

This will end the negotiation and cannot be undone.`))return;st=!0;const o=y.negotiationId,a=y.myNationId,n=y.partnerNationId,{data:r}=await p.from("shard").select("current_tick").eq("name","Alpha Shard").single(),i=r?.current_tick||0,{error:l}=await p.from("trade_negotiations").update({status:"cancelled",concluded_at_tick:i}).eq("id",o);if(l){alert("Failed to withdraw: "+l.message),st=!1;return}await p.from("negotiation_messages").insert({negotiation_id:o,sender_nation_id:a,sender_faction_id:q.faction.id,sender_role:e.role,sender_display_name:"System",message_text:e.displayName+" has withdrawn from negotiations.",is_system:!0,sent_at_tick:i});const s=e.displayName.split(" (")[0],u=(e.role==="trade_minister"?"Minister of Trade ":"Prime Minister ")+s+" has decided to end trade negotiations with "+t+".";await p.from("event_log").insert([{nation_id:a,event_name:"Trade Negotiations Withdrawn",trigger_key:"trade_negotiation_withdrawn",category:"trade",description_chosen:u,fired_at_tick:i},{nation_id:n,event_name:"Trade Negotiations Withdrawn",trigger_key:"trade_negotiation_withdrawn",category:"trade",description_chosen:u,fired_at_tick:i}]),y.status="cancelled",st=!1,Pt();try{await St()}catch{}Ze(),Ee()}window.openTradeNegModal=Jn;window.closeTradeNegModal=Pt;window.withdrawFromNegotiations=xi;
