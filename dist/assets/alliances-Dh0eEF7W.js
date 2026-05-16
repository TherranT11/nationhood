const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/corp-topbar-ClQJCe3f.js","assets/preload-helper-BXl3LOEh.js","assets/factions-1eoRseVF.js"])))=>i.map(i=>d[i]);
import{_supabase as m}from"./supabase-client-CiYoFhIh.js";/* empty css                    *//* empty css                         */import{_ as st}from"./preload-helper-BXl3LOEh.js";import{a as Xe}from"./corp-valuation-DGlSNvB8.js";const qe=2e7,Ve=7e6,Oe=2,Ie=10,we={Finance:[["Lending",null],["Liquidity",null],["Credit",null]],Construction:[["Crews","corp_work_crews"],["Reg. Standing","corp_regulatory_standing"],["Supply Chain","corp_supply_chain"]],Shipping:[["Fleets",null],["Route Risk",null],["Fleet Health",null]],Airline:[["Fleet",null],["Op. Safety","corp_op_safety"],["Routes",null]]},Pe={Finance:["Consortium","Pact","Conglomerate","Bloc","League","Compact","Network","Coalition"],Construction:["Consortium","Bloc","Pact","Network","Compact","Guild","Federation","Coalition"],Shipping:["Compact","Pact","Coalition","League","Combine","Pool","Conference","Network"],Airline:["Alliance","Network","Pact","Coalition","League","Compact","Star","Sky"]},Y={Finance:"Banking",Construction:"Construction",Shipping:"Shipping",Airline:"Airlines"},We=["Finance","Construction","Shipping","Airline"],ot=["all",...We],rt={all:"ALL INDUSTRIES",Finance:"BANKING",Construction:"CONSTRUCTION",Shipping:"SHIPPING",Airline:"AIRLINES"},Ge={cooperative:"al-row__tag--cooperative",coordinating:"al-row__tag--coordinating",cartel:"al-row__tag--cartel"},Ye=6,lt=-1,ct={Construction:[{id:"buyer_first",name:"Buyer First Supply Chain",kind:"coordinating",body:"First refusal on member surplus at preferred prices. +1.5 Supply Chain when sourcing from members.",cartel:.1,chs:.5},{id:"joint_crews",name:"Joint Crews",kind:"cooperative",body:"Use partner crews on cross-border projects at ~30% lower cost. Bid on foreign projects.",cartel:0,chs:.4},{id:"safety",name:"Safety & Standards Firm",kind:"coordinating",body:"+1 Regulatory Standing in shared nations. Joint liability for safety failures.",cartel:.2,chs:.4},{id:"megaproject",name:"Megaproject Syndicate",kind:"coordinating",body:"Pool crews on megaprojects. Lock crews for project duration; failures hit all members.",cartel:0,chs:.6}],Airline:[{id:"codeshare",name:"Codeshare Compact",kind:"cooperative",body:"Members sell seats on each other’s flights as their own. +1 effective Routes per partner served. Revenue split (60/40 in favor of the operating carrier); no control over partner service quality.",cartel:0,chs:.5},{id:"hub_share",name:"Hub Sharing Accord",kind:"coordinating",body:"Members lease gates, ground crews, and lounge access at each other’s hubs. −20% hub maintenance when a partner is co-located. +0.1 Operational Safety from coordinated turnarounds. Lock-in to alliance hubs; joint reputation hit on hub-side incidents.",cartel:.1,chs:.5},{id:"fleet_proc",name:"Fleet Procurement Bloc",kind:"coordinating",body:"Pool aircraft orders for volume discounts. −15% on aircraft purchase price; standardized fleet types let members swap crews and parts in emergencies. Must order from the alliance-approved manufacturer list; a grounded type grounds everyone.",cartel:.1,chs:.4},{id:"tariff_floor",name:"Tariff Floor Pact",kind:"cartel",body:"Members agree minimum ticket prices on overlapping routes. Protected margins; no race to the bottom. High antitrust risk — +0.3 Cartel score per active member, member nations may launch investigations, loss-of-license risk if exposed.",cartel:.3,chs:.6},{id:"op_safety_pact",name:"Operational Safety Pact",kind:"cooperative",body:"When a member suffers a moderate or major aviation incident, every other member pays 15% of the incident cost toward recovery and absorbs part of the safety hit — the victim keeps 60% of the Operational Safety loss; the remaining 40% is split across the alliance. Shock-absorption for incidents; a member running cheap maintenance taxes everyone and the alliance shares reputation exposure.",cartel:0,chs:.5}],Finance:[{id:"aligned_interest",name:"Aligned Interest",kind:"cartel",body:"Members agree on a band of acceptable interest rates for commercial lending — a ceiling and a floor. Loans extended at rates outside the agreed band trigger −2 Cohesion for the alliance and −1 Reputation for the corporation that violated. Inside the band: protected margins and no race to the bottom on rates. Antitrust regulators in member nations notice if the band is set too tight.",cartel:.2,chs:.5},{id:"joint_equity",name:"Joint Equity Ventures",kind:"cooperative",body:"Any equity stake purchased by a member corp is automatically split across every alliance member for proportional ownership and lending capital. Member corps may resell their equity slices only to other alliance members. Builds collective book size without solo capital outlay; restricts your liquidity — no exits to non-member buyers.",cartel:.1,chs:.6},{id:"syndicated_portfolio",name:"Syndicated Lending Portfolio",kind:"coordinating",body:"If any member corp’s Overleverage hits 8+ (and has not yet hit 10), every other member corp automatically absorbs −0.5 Lending Capital and the over-leveraged member’s leverage drops back to 7. One-shot per member per alliance term — and if Overleverage already hit 10, no rescue. Distributes leverage shocks before they cascade into a full bankruptcy.",cartel:0,chs:.5},{id:"bad_debt_mutual",name:"Bad Debt Mutual Aid",kind:"cooperative",body:"Any single loan default ≥ $20M against a member corp: every other member absorbs 15% of the written-off principal as a one-time Lending Capital reduction. The defaulted-on bank gets first claim on any recovered collateral, ahead of secondary creditors. Spreads the impact of single-borrower wipeouts across the alliance; aggressive underwriting by one member taxes the others.",cartel:0,chs:.5}],Shipping:[{id:"cargo_pool",name:"Cargo Pooling Pact",kind:"cooperative",body:"Members fill each other’s empty hold capacity. +1 effective Fleets per allied partner (cap +3, never above your real fleet count). Empty-leg voyages auto-match to a partner’s open shipping contract on the same route and pay you 40% of that contract’s per-voyage value as a slot fee. While carrying partner cargo your vessel sails their priority routing — can’t reposition until the slot discharges; cargo claims fall on the carrying member if loss occurs.",cartel:0,chs:.5},{id:"convoy",name:"Convoy Doctrine",kind:"coordinating",body:"Members sail high-risk lanes in escorted convoys. −1 Route Risk on any lane with ≥2 alliance vessels active. Insurance premiums on alliance-flagged hulls −20%. Piracy or storm incidents on convoyed routes split damage 25/25/25/25 across the four nearest alliance vessels instead of falling 100% on the victim. Convoys depart on the alliance schedule, not yours — −1 voyage per cycle on convoyed routes; whole convoy moves at the slowest hull’s speed.",cartel:0,chs:.5},{id:"drydock",name:"Drydock Cooperative",kind:"coordinating",body:"Members share drydocks, maintenance crews, and standardized parts inventory. −25% per-tick vessel maintenance cost. Vessel depreciation slowed from 5%/yr → 3.5%/yr while in the cooperative. Refit cycles complete in 1 tick instead of 2. Vessels must conform to alliance-approved class types — exotic hulls are excluded; drydock queue is shared, so urgent repairs wait when a partner is mid-refit.",cartel:.1,chs:.4},{id:"tonnage_cartel",name:"Tonnage Cartel",kind:"cartel",body:"Members fix minimum freight rates on routes any two members operate. Freight rates on contested routes (≥2 alliance members on the same lane) lock at +20% over market base rate. +0.3 Cartel score per active member and +0.05 Cartel/tick per contested route. At alliance Antitrust Heat ≥ 7.0 / 10, every member rolls a 5%/tick chance to have their port-call licenses suspended in any participating nation — suspension grounds operations there until the alliance dissolves the article.",cartel:.3,chs:.6}]};function dt(e){return ct[e]||[]}function vt(e){const a=(we[e]||[])[0];return a?{label:a[0],col:a[1]}:{label:"—",col:null}}let g=null,de=null,le=[],F="list",S=null,j=null,T=[],xe=!1,be=!1,I={name:"",selectedInviteeIds:new Set,mission:""},W=[],G=[],Je=[],ce=[],ve="all",ye=new Set,Ee=null;function s(e){if(e==null)return"";const a=document.createElement("div");return a.textContent=String(e),a.innerHTML}function Q(e){if(e==null||!Number.isFinite(e))return"—";const a=Math.abs(e),t=e<0?"-":"";return a>=1e9?t+"$"+(a/1e9).toFixed(2)+"B":a>=1e6?t+"$"+(a/1e6).toFixed(1)+"M":a>=1e3?t+"$"+Math.round(a/1e3)+"k":t+"$"+a}function he(e){if(e==null)return"—";const a=Number(e);return Number.isFinite(a)?a.toFixed(a<10?1:0):"—"}function Z(e){return(e.corp_ticker||e.abbreviation||e.faction_name||"").toString().replace(/[^A-Z0-9]/gi,"").slice(0,3).toUpperCase()||"—"}async function pt(){const{data:{user:e}}=await m.auth.getUser();if(!e){window.location.href="login.html";return}const a=new URLSearchParams(location.search).get("faction_id");if(a){const{data:o}=await m.from("factions").select("*").eq("id",a).single();o?.faction_type==="corporation"&&(g=o)}if(!g){const{data:o}=await m.from("factions").select("*").or(`id.eq.${e.id},linked_user_id.eq.${e.id}`);le=(o||[]).filter(l=>l.nation_id);const c=sessionStorage.getItem("active_faction_id");if(g=le.find(l=>l.id===c)||le.find(l=>l.faction_type==="corporation")||le[0],!g){await m.auth.signOut(),window.location.href="login.html";return}if(g.faction_type!=="corporation"){window.location.href="dashboard.html";return}}const{data:t}=await m.from("shard").select("current_tick, current_date, next_tick_at, tick_interval_hours").eq("name","Alpha Shard").single();de=t;const i=document.getElementById("corp-topbar-container");if(i){const{renderCorpTopBar:o}=await st(async()=>{const{renderCorpTopBar:c}=await import("./corp-topbar-ClQJCe3f.js");return{renderCorpTopBar:c}},__vite__mapDeps([0,1,2]));o(i,{faction:g,shard:de,activeTab:"alliances",allUserFactions:le})}document.getElementById("loading").style.display="none",document.getElementById("page-content").style.display="block",C(),J().then(()=>C())}async function J(){if(!g?.id){G=[],T=[],ce=[];return}if(!xe){xe=!0;try{const{data:e,error:a}=await m.from("alliance_members").select("alliance_id, role, joined_at_tick, strategic_alliances(*)").eq("faction_id",g.id).is("left_at_tick",null);if(a){console.warn("[alliances] memberships fetch failed:",a.message),G=[],T=[],ce=[];return}const t=(e||[]).map(n=>n.strategic_alliances).filter(n=>n&&n.status!=="dissolved"),i=t.map(n=>n.id);let o=m.from("strategic_alliances").select("*").eq("status","active");i.length>0&&(o=o.not("id","in",`(${i.join(",")})`));const{data:c,error:l}=await o;l&&console.warn("[alliances] others fetch failed:",l.message);const p=c||[],_=[...t,...p];if(_.length===0){G=[],T=[],ce=[];return}const x=_.map(n=>n.id),[v,u,y,h]=await Promise.all([m.from("alliance_members").select("alliance_id, faction_id, role, joined_at_tick, left_at_tick").in("alliance_id",x).is("left_at_tick",null),i.length===0?Promise.resolve({data:[],error:null}):m.from("alliance_negotiation_votes").select("alliance_id, faction_id, article_id, voted_at_tick").in("alliance_id",i),i.length===0?Promise.resolve({data:[],error:null}):m.from("alliance_chat_messages").select("alliance_id, faction_id, body, sent_at_tick, created_at").in("alliance_id",i).order("created_at",{ascending:!0}),m.from("alliance_articles").select("alliance_id, article_id, article_name, article_kind, article_body, cartel_score, chs_bonus, ratified_at_tick").in("alliance_id",x).eq("status","active")]);v.error&&console.warn("[alliances] members:",v.error.message),u.error&&console.warn("[alliances] votes:",u.error.message),y.error&&console.warn("[alliances] chat:",y.error.message),h.error&&console.warn("[alliances] articles:",h.error.message);const d=v.data||[],b=u.data||[],L=y.data||[],B=h.data||[],M=Array.from(new Set([...d.map(n=>n.faction_id),...L.map(n=>n.faction_id)])),P=Object.values(we).flat().map(([,n])=>n).filter(Boolean),z=["id","faction_name","corp_ticker","abbreviation","corp_sector","corp_reputation","leader_first_name","leader_last_name","nation_id","corp_cash_reserves","corp_debt"],pe=Array.from(new Set([...z,...P])).join(", "),f=M.length===0?{data:[]}:await m.from("factions").select(pe).in("id",M);f.error&&console.warn("[alliances] factions:",f.error.message);const E=new Map((f.data||[]).map(n=>[n.id,n])),q=Array.from(new Set(d.map(n=>n.faction_id))),U=q.length===0?{data:[]}:await m.from("corp_properties").select("faction_id, purchase_price, condition, is_active").in("faction_id",q).eq("is_active",!0);U.error&&console.warn("[alliances] properties:",U.error.message);const V=new Map;for(const n of U.data||[])V.has(n.faction_id)||V.set(n.faction_id,[]),V.get(n.faction_id).push(n);const H=Array.from(new Set((f.data||[]).map(n=>n.nation_id).filter(Boolean))),X=H.length===0?{data:[]}:await m.from("nations").select("id, name").in("id",H);X.error&&console.warn("[alliances] nations:",X.error.message);const ie=new Map((X.data||[]).map(n=>[n.id,n.name])),ue=Number(de?.current_tick)||0,Ze=g.id,Ne=await m.auth.getUser().then(n=>n.data?.user?.id||null),et=n=>E.get(n)?n===Ze||Ne&&n===Ne:!1,me=new Map;for(const n of d)me.has(n.alliance_id)||me.set(n.alliance_id,[]),me.get(n.alliance_id).push(n);const _e=new Map;for(const n of b)_e.has(n.alliance_id)||_e.set(n.alliance_id,new Map),_e.get(n.alliance_id).set(n.faction_id,n.article_id);const fe=new Map;for(const n of L)fe.has(n.alliance_id)||fe.set(n.alliance_id,[]),fe.get(n.alliance_id).push(n);const ne=new Map;for(const n of B)ne.has(n.alliance_id)||ne.set(n.alliance_id,[]),ne.get(n.alliance_id).push(n);const Re=n=>{const O=vt(n.sector),k=_e.get(n.id)||new Map;return(me.get(n.id)||[]).map(A=>{const $=E.get(A.faction_id)||{},se=$.nation_id?ie.get($.nation_id):null;return{id:A.faction_id,faction_name:$.faction_name||"Unnamed Corp",corp_ticker:$.corp_ticker||$.abbreviation||"—",abbreviation:$.abbreviation||"",nation_name:se||"—",stat_label:O.label,stat_value:O.col?$[O.col]:null,vote:k.get(A.faction_id)||null,is_founder:A.role==="founder",is_you:et(A.faction_id),rapport:A.role==="founder"?"founder":"friendly"}})},tt=n=>(fe.get(n.id)||[]).map(k=>{const N=E.get(k.faction_id)||{},A=k.faction_id===n.founder_faction_id,$=Math.max(0,ue-(Number(k.sent_at_tick)||0));return{author:N.faction_name||"Unnamed",is_founder:A,ago:$===0?"just now":$+" tick"+($===1?"":"s")+" ago",body:k.body}}),Fe=[],Me=[];for(const n of t){const O=dt(n.sector),k=ne.get(n.id)||[],N=Re(n);if(n.status==="negotiating")Fe.push({id:n.id,name:n.name,sector:n.sector,founder_faction_id:n.founder_faction_id,ticks_remaining:Ye-(ue-(Number(n.proposed_at_tick)||0)),members:N,articles:O,chat:tt(n)});else if(n.status==="active"){const A=N.find(w=>w.is_founder),$=A?E.get(A.id):null,se=$?`${$.leader_first_name||""} ${$.leader_last_name||""}`.trim():"—",R=$&&$.nation_id?ie.get($.nation_id):null,oe=new Set(N.map(w=>E.get(w.id)?.nation_id).filter(Boolean)).size,K=k.reduce((w,$e)=>w+(Number($e.cartel_score)||0),0),re=k.some(w=>w.article_id==="aligned_interest"),ge=re?n.aligned_interest_floor_apr:null,Te=re?n.aligned_interest_ceiling_apr:null,at=k.some(w=>w.article_id==="bad_debt_mutual"),it=k.some(w=>w.article_id==="syndicated_portfolio"),nt=k.some(w=>w.article_id==="joint_equity");Me.push({id:n.id,name:n.name,sector:n.sector,tags:[Y[n.sector]||n.sector,"MEMBER"],dues:"—",rate_floor:ge!=null?`${Number(ge).toFixed(1)}%`:"—",aligned_interest_band:ge!=null&&Te!=null?`${Number(ge).toFixed(1)}% – ${Number(Te).toFixed(1)}%`:null,has_aligned_interest:re,bad_debt_aid_active:at,syndicated_lending_active:it,joint_equity_active:nt,member_count:N.length,nation_count:oe,founded_year:n.founded_at_tick??"—",cartel_score:Number(K.toFixed(1)),heat:Number((Number(n.antitrust_heat)||0).toFixed(1)),cohesion:Number((Number(n.cohesion)||0).toFixed(1)),founded_date:n.founded_at_tick!=null?`Tick ${n.founded_at_tick}`:"—",hq:R||"—",chair:se||"—",mission:n.mission||"",members:N,articles:k.map(w=>({name:w.article_name,kind:w.article_kind,body:w.article_body||""})),represented_nations:Array.from(new Set(N.map(w=>E.get(w.id)?.nation_id).filter(Boolean))).map(w=>({name:ie.get(w)||"—",count:N.filter($e=>E.get($e.id)?.nation_id===w).length})),last_amended:k.length>0?`Tick ${Math.max(...k.map(w=>Number(w.ratified_at_tick)||0))}`:null})}}const Be=[];for(const n of p){const O=ne.get(n.id)||[],k=Re(n),N=k.reduce((R,oe)=>{const K=E.get(oe.id);if(!K)return R;const re=Xe({cash:K.corp_cash_reserves,loans:K.corp_debt,properties:V.get(K.id)||[],vessels:[],financeReceivables:[],currentTick:ue});return R+re.valuation},0),A=k.find(R=>R.is_founder),$=A?E.get(A.id):null,se=$&&$.nation_id?ie.get($.nation_id):null;Be.push({id:n.id,name:n.name,sector:n.sector,member_count:k.length,members:k,total_valuation:N,articles:O.slice().sort((R,oe)=>(Number(R.ratified_at_tick)||0)-(Number(oe.ratified_at_tick)||0)).map(R=>({name:R.article_name,kind:R.article_kind,body:R.article_body||""})),founded_at_tick:n.founded_at_tick??null,hq:se||"—",mission:n.mission||""})}T=Fe,G=Me,ce=Be}catch(e){console.warn("[alliances] hydrate failed:",e?.message||e)}finally{xe=!1}}}function C(){const e=document.getElementById("alliances-shell");e&&(F==="negotiation"&&!(T||[]).some(a=>a.id===S)&&(F="list",S=null,j=null),F==="negotiation"?e.innerHTML=It():F==="found"?e.innerHTML=wt():e.innerHTML=ut(),St())}function Ke(e){(T||[]).find(t=>t.id===e)&&(F="negotiation",S=e,j=null,C())}function Ae(){F="list",S=null,j=null,C()}function ut(){const e=Y[g?.corp_sector]||g?.corp_sector||"—",a=ot.map(t=>`<button class="${`al-filter-pill${t===ve?" active":""}`}" data-filter="${s(t)}">${s(rt[t]||t.toUpperCase())}</button>`).join("");return`
        <div class="al-page-head">
            <div>
                <div class="al-page-eyebrow">Strategic Alliances</div>
                <div class="al-page-context">${s(g?.faction_name||"—")} · ${s(e)}</div>
            </div>
            <div class="al-page-stats">
                <div><div class="al-stat__label">Your Alliances</div><div class="al-stat__value">${G.length||0}</div></div>
                <div><div class="al-stat__label">Influence</div><div class="al-stat__value">—</div></div>
                <div><div class="al-stat__label">Antitrust Heat</div><div class="al-stat__value">—</div></div>
            </div>
        </div>
        <div class="al-rule"></div>
        <div class="al-controls">
            <div class="al-filter-row">
                <span class="al-filter-label">Filter</span>
                ${a}
            </div>
            <button class="al-found-btn" id="open-found-btn">+ FOUND NEW ALLIANCE</button>
        </div>
        ${_t()}
        ${mt()}
        ${ft()}
        ${gt()}
    `}function mt(){const e=T||[];return e.length===0?"":`
        <div class="al-section">
            <div class="al-section__title">Pending Negotiations &middot; ${e.length}</div>
            ${e.map(a=>{const t=Se(a);return`
                    <div class="al-row" data-pending-id="${s(a.id)}" style="border-left-color:var(--blue);cursor:pointer;">
                        <div class="al-row__head">
                            <span class="al-row__chevron">&rsaquo;</span>
                            <span class="al-row__name">${s(a.name)}</span>
                            <span class="al-row__tag" style="color:var(--blue);border-color:var(--blue-border);background:var(--blue-faint);">${s(Y[a.sector]||a.sector)}</span>
                            <span class="al-row__tag">FOUNDING</span>
                            <div class="al-row__metrics">
                                <div class="al-row__metric">
                                    <div class="al-row__metric-label">Votes</div>
                                    <div class="al-row__metric-value">${t.submitted} of ${t.total}</div>
                                </div>
                                <div class="al-row__metric">
                                    <div class="al-row__metric-label">Closes In</div>
                                    <div class="al-row__metric-value">${a.ticks_remaining??"—"} ticks</div>
                                </div>
                            </div>
                        </div>
                        <div class="al-row__sub">
                            ${a.members.length} invited · ${t.label}
                        </div>
                    </div>
                `}).join("")}
        </div>
    `}function Se(e){const a=e&&e.members||[],t=a.length,i=a.filter(p=>p.vote),o=i.length;if(t===0)return{submitted:0,total:0,reached:!1,article_id:null,label:"No members invited."};if(o<t){const p=t-o;return{submitted:o,total:t,reached:!1,article_id:null,label:`Awaiting ${p} more vote${p===1?"":"s"} before ratification.`}}const c=i[0].vote;if(i.every(p=>p.vote===c)){const p=(e.articles||[]).find(_=>_.id===c);return{submitted:o,total:t,reached:!0,article_id:c,label:`All members agreed on ${p?p.name:c}. Ready to ratify.`}}return{submitted:o,total:t,reached:!1,article_id:null,label:"Members are split — alliance can only be founded once all vote for the same article."}}function Le(e){return ve==="all"?e:(e||[]).filter(a=>a.sector===ve)}function _t(){const e=Le(G);return`
        <div class="al-section">
            <div class="al-section__title">Your Memberships</div>
            ${e.length===0?`<div class="al-empty">You're not in any.</div>`:e.map(a=>Qe(a,!0)).join("")}
        </div>
    `}function ft(){const e=Le(Je);return`
        <div class="al-section">
            <div class="al-section__title">Open to Join</div>
            ${e.length===0?'<div class="al-empty">No alliances open to join yet.</div>':e.map(a=>Qe(a,!1)).join("")}
        </div>
    `}function gt(){const e=Le(ce);return`
        <div class="al-section">
            <div class="al-section__title">All Strategic Alliances${e.length?" &middot; "+e.length:""}</div>
            ${e.length===0?'<div class="al-empty">No other active alliances yet.</div>':e.map(bt).join("")}
        </div>
    `}function bt(e){const a=["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","XIII","XIV","XV","XVI","XVII","XVIII","XIX","XX"],t=e.members||[],i=t.filter(u=>u.is_founder),o=t.filter(u=>!u.is_founder),c=(u,y={})=>{const h=s(u.corp_ticker||u.abbreviation||"—"),d=s(u.nation_name||"—");return`<span class="al-row__tag" style="${y.founder?"color:var(--amber);border-color:var(--amber-border);background:var(--amber-faint);":""}" title="${s(u.faction_name||"")}">${h} &middot; ${d}</span>`},l=i.map(u=>c(u,{founder:!0})).join(""),p=o.map(u=>c(u)).join(""),_=e.founded_at_tick!=null?2e3+Math.floor(Number(e.founded_at_tick)/12):null,x=(e.articles||[]).length===0?'<div class="al-empty" style="padding:10px 0;">No ratified articles.</div>':(e.articles||[]).map((u,y)=>`
            <div style="padding:10px 0;border-top:1px solid var(--al-line, rgba(255,255,255,0.06));">
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.18em;color:var(--text-dim);">ARTICLE ${a[y]||y+1}</div>
                <div style="font-weight:600;margin-top:3px;color:var(--text-bright);">${s(u.name||"—")}</div>
                ${u.body?`<div style="font-size:11px;color:var(--text-secondary);margin-top:3px;line-height:1.5;">${s(u.body)}</div>`:""}
            </div>
        `).join(""),v=[];return v.push(`<span><span style="color:var(--text-dim);">Members</span> <span style="color:var(--text-bright);">${e.member_count??0}</span></span>`),_&&v.push(`<span><span style="color:var(--text-dim);">Founded</span> <span style="color:var(--text-bright);">${_}</span></span>`),e.hq&&e.hq!=="—"&&v.push(`<span><span style="color:var(--text-dim);">HQ</span> <span style="color:var(--text-bright);">${s(e.hq)}</span></span>`),`
        <div class="al-row" style="opacity:0.95;">
            <div class="al-row__head">
                <span class="al-row__name">${s(e.name)}</span>
                <span class="al-row__tag">${s(Y[e.sector]||e.sector)}</span>
                <div class="al-row__metrics">
                    <div class="al-row__metric">
                        <div class="al-row__metric-label">Members</div>
                        <div class="al-row__metric-value">${e.member_count}</div>
                    </div>
                    <div class="al-row__metric">
                        <div class="al-row__metric-label">Total Valuation</div>
                        <div class="al-row__metric-value">${Q(e.total_valuation||0)}</div>
                    </div>
                </div>
            </div>
            <div class="al-row__sub" style="display:flex;flex-wrap:wrap;gap:14px;padding:6px 0 2px;font-family:var(--font-mono);font-size:10px;letter-spacing:0.04em;">
                ${v.join("")}
            </div>
            ${e.mission?`
                <div style="margin-top:10px;padding:10px 14px;border-left:2px solid var(--amber);font-style:italic;color:var(--text-secondary);font-size:12px;line-height:1.5;">
                    &ldquo;${s(e.mission)}&rdquo;
                </div>
            `:""}
            ${l?`
                <div style="margin-top:12px;">
                    <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.18em;color:var(--text-dim);margin-bottom:6px;">FOUNDERS</div>
                    <div style="display:flex;flex-wrap:wrap;gap:4px;">${l}</div>
                </div>
            `:""}
            ${p?`
                <div style="margin-top:10px;">
                    <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.18em;color:var(--text-dim);margin-bottom:6px;">MEMBERS</div>
                    <div style="display:flex;flex-wrap:wrap;gap:4px;">${p}</div>
                </div>
            `:""}
            ${!l&&!p?'<div style="margin-top:8px;color:var(--text-dim);font-style:italic;">No active members.</div>':""}
            <div style="margin-top:14px;">
                <div style="font-family:var(--font-mono);font-size:9px;letter-spacing:0.18em;color:var(--text-dim);">CHARTER${(e.articles||[]).length?" &middot; "+e.articles.length+" articles ratified":""}</div>
                ${x}
            </div>
        </div>
    `}function Qe(e,a){const t=ye.has(e.id),i=(e.tags||[]).map(o=>`<span class="al-row__tag ${Ge[String(o).toLowerCase()]||""}">${s(o)}</span>`).join("");return`
        <div class="al-row" data-alliance-id="${s(e.id)}">
            <div class="al-row__head" data-toggle-id="${s(e.id)}">
                <span class="al-row__chevron">${t?"▾":"▸"}</span>
                <span class="al-row__name">${s(e.name||"Unnamed Alliance")}</span>
                <div class="al-row__tags">${i}</div>
                <div class="al-row__metrics">
                    <div class="al-row__metric">
                        <div class="al-row__metric-label">${a?"Dues":"Est. Dues"}</div>
                        <div class="al-row__metric-value">${s(e.dues||"—")}</div>
                    </div>
                    <div class="al-row__metric">
                        <div class="al-row__metric-label">Rate Floor</div>
                        <div class="al-row__metric-value">${s(e.rate_floor||"—")}</div>
                    </div>
                </div>
            </div>
            <div class="al-row__sub">
                ${e.member_count??"—"} members · ${e.nation_count??"—"} nations · Founded ${e.founded_year??"—"} · Cartel score ${e.cartel_score??"—"}${e.heat!=null?` · Heat ${e.heat}`:""}
            </div>
            ${t?yt(e,a):""}
        </div>
    `}function yt(e,a){const t=we[e.sector]||[],i=(e.members||[]).map(l=>{const p=t.length>0?`${s(t[0][0])} <b>${he(l[t[0][1]])}</b>`:"",_=l.is_you?'<span class="al-row__tag" style="color:var(--amber);border-color:var(--amber);">YOU</span>':l.is_founder?'<span class="al-row__tag" style="color:var(--text-bright);border-color:var(--text-dim);">FOUNDER</span>':"";return`
            <div class="fnd-invitee">
                <div class="fnd-invitee__chip">${s(Z(l))}</div>
                <div class="fnd-invitee__body">
                    <div class="fnd-invitee__name">${s(l.faction_name||"")} ${_}</div>
                    <div class="fnd-invitee__meta">${s(l.nation_name||"—")} · ${p} · Joined ${s(String(l.joined_year||"—"))}</div>
                </div>
            </div>
        `}).join(""),o=(e.articles||[]).map((l,p)=>{const _=Ge[String(l.kind||"").toLowerCase()]||"";return`
            <div class="al-article">
                <div class="al-article__head">
                    <span class="al-article__num">Article ${ht(p+1)}</span>
                    <span class="al-article__name">${s(l.name||"")}</span>
                    <span class="al-row__tag ${_}">${s(l.kind||"")}</span>
                </div>
                <div class="al-article__body">${s(l.body||"")}</div>
            </div>
        `}).join(""),c=(e.represented_nations||[]).map(l=>`<span class="al-row__tag" style="color:var(--text-primary);">${s(l.name)} ${l.count!=null?l.count:""}</span>`).join(" ");return`
        <div class="al-row__expanded">
            <div class="al-stat-grid">
                <div><div class="al-stat__label">Founded</div><div style="margin-top:2px;color:var(--text-bright);">${s(e.founded_date||"—")}</div></div>
                <div><div class="al-stat__label">Headquarters</div><div style="margin-top:2px;color:var(--text-bright);">${s(e.hq||"—")}</div></div>
                <div><div class="al-stat__label">Presiding Chair</div><div style="margin-top:2px;color:var(--text-bright);">${s(e.chair||"—")}</div></div>
                <div><div class="al-stat__label">Cohesion</div><div style="margin-top:2px;color:var(--green);">${s((e.cohesion??"—")+" / 10.0")}</div></div>
                <div><div class="al-stat__label">Antitrust Heat</div><div style="margin-top:2px;color:${(e.heat||0)>=7?"var(--red)":"var(--amber)"};">${s((e.heat??"—")+" / 10.0")}</div></div>
            </div>
            ${e.has_aligned_interest?`
                <div style="margin-top:14px;padding:10px 14px;background:var(--amber-faint);border:1px solid var(--amber-border);font-family:var(--font-mono);font-size:11px;letter-spacing:0.04em;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
                    <span style="color:var(--text-dim);text-transform:uppercase;">Aligned Interest Band</span>
                    ${e.aligned_interest_band?`<span style="color:var(--amber);font-weight:700;">${s(e.aligned_interest_band)}</span>
                           <span style="color:var(--text-secondary);">Loans outside this band trigger −2 Cohesion alliance, −1 Reputation lender.</span>`:'<span style="color:var(--text-secondary);font-style:italic;">No band set — members must vote.</span>'}
                    <button class="al-aiv-open-btn" data-alliance-id="${s(e.id)}" style="margin-left:auto;font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:0.5px;padding:6px 12px;color:var(--amber);background:transparent;border:1px solid var(--amber);cursor:pointer;text-transform:uppercase;">Vote on Interest Rate</button>
                </div>
            `:""}
            ${e.bad_debt_aid_active?`
                <div style="margin-top:8px;padding:10px 14px;background:var(--blue-faint);border:1px solid var(--blue-border);font-family:var(--font-mono);font-size:11px;letter-spacing:0.04em;">
                    <span style="color:var(--text-dim);text-transform:uppercase;">Bad Debt Mutual Aid</span>
                    <span style="color:var(--blue);margin-left:10px;font-weight:700;">Active</span>
                    <span style="color:var(--text-secondary);margin-left:10px;">A loan default ≥ $20M against any member triggers 15% Lending Capital absorption (in LC units, $50M = 1 LC) from every other member.</span>
                </div>
            `:""}
            ${e.syndicated_lending_active?`
                <div style="margin-top:8px;padding:10px 14px;background:var(--green-faint);border:1px solid var(--green-border);font-family:var(--font-mono);font-size:11px;letter-spacing:0.04em;">
                    <span style="color:var(--text-dim);text-transform:uppercase;">Syndicated Lending Portfolio</span>
                    <span style="color:var(--green);margin-left:10px;font-weight:700;">Active</span>
                    <span style="color:var(--text-secondary);margin-left:10px;">Each tick, any member whose Overleverage hits 8 (and not yet 10) is auto-rescued: their leverage drops to 7, every other member loses 0.5 Lending Capital. One-shot per member per alliance term.</span>
                </div>
            `:""}
            ${e.joint_equity_active?`
                <div style="margin-top:8px;padding:10px 14px;background:var(--teal-faint);border:1px solid var(--teal-border);font-family:var(--font-mono);font-size:11px;letter-spacing:0.04em;">
                    <span style="color:var(--text-dim);text-transform:uppercase;">Joint Equity Ventures</span>
                    <span style="color:var(--teal);margin-left:10px;font-weight:700;">Active</span>
                    <span style="color:var(--text-secondary);margin-left:10px;">Equity stakes accepted by any member auto-split equally across every alliance member; each peer absorbs 0.5 Lending Capital. Future resales restricted to alliance members.</span>
                </div>
            `:""}
            ${e.mission?`<div style="margin-top:16px;padding:12px 14px;border-left:2px solid var(--amber);font-style:italic;color:var(--text-secondary);">"${s(e.mission)}"</div>`:""}
            <div style="margin-top:16px;">
                <div class="al-stat__label">Members · ${e.member_count??"—"} ${e.sector||""} corps across ${e.nation_count??"—"} nations</div>
                <div class="fnd-invitees-grid" style="margin-top:8px;">${i}</div>
            </div>
            ${c?`<div style="margin-top:16px;"><div class="al-stat__label">Represented Nations</div><div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">${c}</div></div>`:""}
            ${o?`<div style="margin-top:16px;"><div class="al-stat__label">Charter · ${(e.articles||[]).length} articles ratified${e.last_amended?` · Last amended ${s(e.last_amended)}`:""}</div><div style="margin-top:8px;">${o}</div></div>`:""}
            <div class="al-actions">
                ${a?`<button class="al-btn al-btn--primary" disabled title="Backend not yet implemented.">GOVERNANCE ↗</button>
                       <button class="al-btn" disabled title="Backend not yet implemented.">TREASURY</button>
                       <button class="al-btn" disabled title="Backend not yet implemented.">MESSAGE</button>
                       <span class="spacer"></span>
                       <button class="al-btn al-btn--leave" data-leave-id="${s(e.id)}">LEAVE ALLIANCE</button>`:`<button class="al-btn al-btn--primary" data-apply-id="${s(e.id)}">APPLY TO JOIN</button>`}
            </div>
        </div>
    `}function ht(e){return["","I","II","III","IV","V","VI","VII","VIII","IX","X"][e]||String(e)}function wt(){const e=g?.corp_sector||"Construction",a=Pe[e]||Pe.Construction,t=I.selectedInviteeIds.size,i=qe+Ve*t,o=We.map(y=>{const h=y===e,d=h?"fnd-pick selected":"fnd-pick locked",b=h?'<span class="fnd-pick__tag"><span class="fnd-pick__dot"></span>SELECTED</span>':'<span class="fnd-pick__tag">LOCKED</span>',L=h?"Your industry":"Wrong industry";return`
            <div class="${d}">
                ${b}
                <div class="fnd-pick__name">${s(Y[y]||y)}</div>
                <div class="fnd-pick__sub">${s(L)}</div>
            </div>
        `}).join(""),c=`Min ${Oe}, max ${Ie} invitees.`,l=`${t} selected`,p=Y[e]||e,_=W.length===0?`<div class="fnd-empty-roster">No other ${s(p)} corporations available to invite.</div>`:`<div class="fnd-invitees-grid">${W.map(kt).join("")}</div>`,x=I.name.trim().length>0,v=t>=Oe&&t<=Ie,u=x&&v&&!be;return`
        <div class="fnd-crumb">
            <a class="fnd-crumb__link" id="fnd-back">Strategic Alliances</a>
            <span class="fnd-crumb__sep">/</span>
            <span class="fnd-crumb__current">Found New Alliance</span>
        </div>

        <h1 class="fnd-h1">Charter a new strategic alliance</h1>
        <p class="fnd-lede">
            Found a coalition of like-minded institutions. New alliances begin with one
            ratified charter article. Additional articles unlock as the alliance gains
            <span class="fnd-lede__highlight">Cohesion</span> through cooperation, shared
            crises, and unanimous votes.
        </p>
        <div class="fnd-rule"></div>

        <div class="fnd-step">
            <div class="fnd-step__head">
                <span class="fnd-step__num">Step 1</span>
                <span class="fnd-step__title">Industry</span>
                <span class="fnd-step__sub">Locked to your own industry</span>
            </div>
            <div class="fnd-grid">${o}</div>
        </div>

        <div class="fnd-step">
            <div class="fnd-step__head">
                <span class="fnd-step__num">Step 2</span>
                <span class="fnd-step__title">Name</span>
                <span class="fnd-step__sub">Choose carefully — renaming costs Cohesion</span>
            </div>
            <input type="text" id="fnd-name" class="fnd-input" maxlength="80"
                   placeholder="Enter alliance name…"
                   value="${s(I.name)}" />
            <div class="fnd-naming-help">
                Recommended naming patterns: ${a.map(y=>`<b>${s(y)}</b>`).join(", ")}
            </div>
        </div>

        <div class="fnd-step">
            <div class="fnd-step__head">
                <span class="fnd-step__num">Step 3</span>
                <span class="fnd-step__title">Invitees</span>
                <span class="fnd-step__sub">Founding members must accept and agree on the first article. ${s(c)}</span>
                <span class="fnd-step__sub" style="color:${v?"var(--amber)":"var(--text-dim)"};margin-left:12px;">${s(l)}</span>
            </div>
            ${_}
            <div class="fnd-shared-rep">All corporations will share Reputation once in a Strategic Alliance.</div>
        </div>

        <div class="fnd-step">
            <div class="fnd-step__head">
                <span class="fnd-step__num">Step 5</span>
                <span class="fnd-step__title">Mission statement</span>
                <span class="fnd-step__sub">Optional. Shapes how the public perceives your alliance.</span>
            </div>
            <textarea id="fnd-mission" class="fnd-textarea" maxlength="500"
                      placeholder="Optional mission statement…">${s(I.mission)}</textarea>
        </div>

        <div class="fnd-cost">
            <div class="fnd-cost__block">
                <div class="fnd-cost__label">Total Cost</div>
                <div class="fnd-cost__value">${Q(i)}</div>
            </div>
            <div class="fnd-cost__formula">
                ${Q(qe)} base + ${Q(Ve)} per invitee × ${t}
                = ${Q(i)}. Paid on charter ratification, refunded if vote fails.
            </div>
        </div>
        <div class="fnd-actions">
            <button class="fnd-btn" id="fnd-cancel">Cancel</button>
            <button class="fnd-btn fnd-btn--primary" id="fnd-submit"
                    ${u?"":"disabled"}
                    title="${u?"":x?"Pick at least 2 invitees":"Name your alliance"}">
                Send Invitations &amp; Open Negotiation ↗
            </button>
        </div>
    `}const $t=6;function je(e){const a=e.custom_logo_url;return a?`<div class="fnd-invitee__chip" style="padding:0;overflow:hidden;background:var(--bg-1);border:1px solid var(--text-dim);">
            <img src="${s(a)}" alt="${s(Z(e))}" style="width:100%;height:100%;object-fit:cover;display:block;"
                 onerror="this.parentElement.innerHTML='${s(Z(e))}';this.parentElement.style.padding='';this.parentElement.style.background='';">
        </div>`:`<div class="fnd-invitee__chip">${s(Z(e))}</div>`}function xt(e,a){const t=Number(e.last_seen_tick);if(!Number.isFinite(t)||t<=0)return"";const i=Number(a)-t;return i<$t?"":`<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);letter-spacing:0.04em;text-transform:uppercase;margin-top:2px;">Inactive (${i} tick${i===1?"":"s"})</div>`}function kt(e){const a=e.corp_sector||"Construction",t=we[a]||[],i=I.selectedInviteeIds.has(e.id),o=e.__valuation,c=Number(de?.current_tick)||0,l=e.__currentAlliance,p=t.map(([_,x])=>{const v=x?e[x]:null;return`${s(_)} <b>${he(v)}</b>`}).join(" &middot; ");return l?`
            <div class="fnd-invitee fnd-invitee--locked" data-corp-id="${s(e.id)}"
                 style="opacity:0.45;cursor:not-allowed;"
                 title="Already in ${s(l.name)}">
                <div class="fnd-invitee__check" style="visibility:hidden;"></div>
                ${je(e)}
                <div class="fnd-invitee__body">
                    <div class="fnd-invitee__name">${s(e.faction_name||"Unnamed Corp")}</div>
                    <div style="font-family:var(--font-ui);font-size:11px;font-weight:700;color:var(--text-primary);margin-top:4px;">
                        ${s(e.faction_name||"This corp")} is already a member of ${s(l.name)}.
                    </div>
                </div>
            </div>
        `:`
        <div class="fnd-invitee ${i?"selected":""}" data-corp-id="${s(e.id)}">
            <div class="fnd-invitee__check">${i?"✓":""}</div>
            ${je(e)}
            <div class="fnd-invitee__body">
                <div class="fnd-invitee__name">${s(e.faction_name||"Unnamed Corp")}</div>
                ${xt(e,c)}
                <div class="fnd-invitee__meta">
                    ${e.__hq_nation?`<b style="color:var(--text-primary)">${s(e.__hq_nation)}</b> &middot; `:""}Valuation <b style="color:var(--text-primary)">${Q(o)}</b>
                    &middot; Reputation <b style="color:var(--text-primary)">${he(e.corp_reputation)}</b>
                </div>
                <div class="fnd-invitee__stats">${p||"&nbsp;"}</div>
            </div>
        </div>
    `}function It(){const e=(T||[]).find(v=>v.id===S);if(!e)return"";const a=Y[e.sector]||e.sector,t=Se(e),i=(e.members||[]).find(v=>v.is_you)||null,o=j||i?.vote||null,c=t.reached&&i&&i.id===e.founder_faction_id,l=new Map((e.articles||[]).map(v=>[v.id,0]));for(const v of e.members||[])v.vote&&l.has(v.vote)&&l.set(v.vote,l.get(v.vote)+1);const p=(e.members||[]).filter(v=>!v.vote).length,_=(e.members||[]).length,x=v=>_>0?Math.round(v/_*100):0;return`
        <div class="fnd-crumb">
            <a class="fnd-crumb__link" data-nav="list">Strategic Alliances</a>
            <span class="fnd-crumb__sep">/</span>
            <a class="fnd-crumb__link" data-nav="found">Found New Alliance</a>
            <span class="fnd-crumb__sep">/</span>
            <span class="fnd-crumb__current">Founding Negotiation</span>
        </div>

        <div class="ng-head">
            <div class="ng-head__title-block">
                <div class="ng-head__title">${s(e.name)}</div>
                <div class="ng-head__sub">
                    <span class="al-row__tag" style="color:var(--blue);border-color:var(--blue-border);background:var(--blue-faint);">${s(a)}</span>
                    Founding negotiation in progress &middot; Closes in ${e.ticks_remaining??"—"} ticks
                </div>
            </div>
            <div class="ng-head__metrics">
                <div class="ng-head__metric">
                    <div class="al-stat__label">Votes Submitted</div>
                    <div class="al-stat__value">${t.submitted} of ${t.total}</div>
                </div>
                <div class="ng-head__metric">
                    <div class="al-stat__label">Consensus</div>
                    <div class="al-stat__value" style="color:${t.reached?"var(--green)":"var(--text-dim)"};">
                        ${t.reached?"Reached":"Pending"}
                    </div>
                </div>
            </div>
        </div>
        <div class="al-rule"></div>

        <div class="ng-grid">
            <!-- LEFT: members + tally + actions -->
            <div class="ng-left">
                <div class="al-section__title">Founding Members</div>
                ${e.members.map(v=>Et(v,e.articles)).join("")}

                <div class="ng-tally">
                    <div class="al-section__title">Vote Tally &middot; Per Article</div>
                    ${(e.articles||[]).map(v=>{const u=l.get(v.id)||0,y=x(u);return`
                            <div class="ng-tally__row">
                                <div class="ng-tally__label">${s(v.name)}</div>
                                <div class="ng-tally__bar"><div class="ng-tally__fill" style="width:${y}%;background:${u>0?"var(--green)":"var(--text-ghost)"};"></div></div>
                                <div class="ng-tally__count">${u}</div>
                            </div>
                        `}).join("")}
                    <div class="ng-tally__row">
                        <div class="ng-tally__label" style="color:var(--text-dim);">— Pending —</div>
                        <div class="ng-tally__bar"><div class="ng-tally__fill" style="width:${x(p)}%;background:var(--text-ghost);"></div></div>
                        <div class="ng-tally__count">${p}</div>
                    </div>
                    <div class="ng-tally__footer">
                        Total members: ${_} &middot; All members must vote on the same article to ratify.
                    </div>
                </div>

                <button class="al-btn al-btn--primary" style="width:100%;margin-top:16px;" id="ng-ratify"
                        ${c?"":"disabled"} title="${s(t.label)}">FOUND ALLIANCE</button>
                <div style="margin-top:6px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);text-align:center;letter-spacing:0.06em;">
                    ${s(t.label)}
                </div>
                ${i&&i.id===e.founder_faction_id?'<button class="al-btn al-btn--leave" style="width:100%;margin-top:12px;" id="ng-withdraw">Withdraw Proposal</button>':""}
                <div style="margin-top:14px;font-family:var(--font-mono);font-size:9px;color:var(--red);text-align:center;letter-spacing:0.06em;">
                    If consensus is not reached within ${Ye} ticks, the alliance dissolves and every invited corporation suffers ${lt} Reputation.
                </div>
            </div>

            <!-- RIGHT: articles + your vote + chat -->
            <div class="ng-right">
                <div class="al-section__title">Proposed Founding Articles &middot; Select One</div>
                ${(e.articles||[]).length===0?'<div class="al-empty">No candidate articles defined for this sector yet.</div>':`<div class="ng-articles">
                        ${(e.articles||[]).map(v=>Ct(v,e,o,l.get(v.id)||0)).join("")}
                    </div>`}

                ${(()=>{const v=i?.vote||null,u=j,y=v?e.articles.find(M=>M.id===v)?.name||v:null,h=u?e.articles.find(M=>M.id===u)?.name||u:null,d=u&&u!==v,b=v!==null&&!d,L=d?"Submit Vote":b?"Unsubmit Vote":"Submit Vote",B=!d&&!b;return`
                        <div class="ng-your-vote">
                            <div>
                                <div class="al-stat__label">Your Vote</div>
                                <div class="ng-your-vote__value">
                                    ${v?s(y):'<span style="color:var(--text-dim);">Not yet submitted</span>'}
                                    ${d?`<span style="color:var(--text-dim);font-weight:400;font-size:11px;margin-left:8px;">→ pending: <b style="color:var(--amber);">${s(h)}</b></span>`:""}
                                </div>
                            </div>
                            <button class="al-btn al-btn--primary" id="ng-submit-vote" ${B?"disabled":""}>${L}</button>
                        </div>
                    `})()}

                <div class="ng-chat">
                    <div class="ng-chat__head">
                        <span class="al-section__title" style="margin:0;">Negotiation Room</span>
                        <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);letter-spacing:0.04em;">
                            ${(e.chat||[]).length} message${(e.chat||[]).length===1?"":"s"}
                        </span>
                    </div>
                    <div class="ng-chat__scroll">
                        ${(e.chat||[]).map(At).join("")}
                    </div>
                    <div class="ng-chat__compose">
                        <input type="text" class="fnd-input" id="ng-chat-input" maxlength="2000" placeholder="Reply to the negotiation room…" />
                        <button class="al-btn al-btn--primary" id="ng-chat-send">Send ↗</button>
                    </div>
                </div>
            </div>
        </div>
    `}function Et(e,a){const t=e.vote?a.find(l=>l.id===e.vote):null,i=e.is_you?"var(--amber)":e.rapport==="friendly"?"var(--green)":e.rapport==="hostile"?"var(--red)":"var(--border-1)",o=e.is_founder?'<span style="color:var(--amber);font-weight:700;">FOUNDER</span>'+(e.is_you?' &middot; <span style="color:var(--amber);">YOU</span>':""):(e.rapport||"").toUpperCase(),c=t?`<span style="color:var(--green);">&check; ${s(t.name)}</span>`:'<span style="color:var(--text-dim);">— PENDING</span>';return`
        <div class="ng-member" style="border-left-color:${i};">
            <div class="ng-member__top">
                <div class="fnd-invitee__chip">${s(Z(e))}</div>
                <div class="ng-member__body">
                    <div class="fnd-invitee__name">${s(e.faction_name)}</div>
                    <div class="fnd-invitee__meta">${s(e.nation_name)} &middot; ${s(e.stat_label)} ${he(e.stat_value)}</div>
                </div>
            </div>
            <div class="ng-member__footer">
                <span class="ng-member__status">${o}</span>
                <span class="ng-member__vote">${c}</span>
            </div>
        </div>
    `}function Ct(e,a,t,i){const o=t===e.id,c=a.members.filter(p=>p.vote===e.id),l=c.length===0?'<span style="color:var(--text-dim);">No votes yet</span>':c.map(p=>`<span class="fnd-invitee__chip" style="width:auto;height:20px;font-size:9px;padding:0 6px;">${s(Z(p))}</span>`).join(" ");return`
        <div class="ng-article ${o?"selected":""}" data-article-id="${s(e.id)}">
            <div class="ng-article__head">
                <span class="ng-article__radio">${o?"&#x25C9;":"&#x25CB;"}</span>
                <span class="ng-article__name">${s(e.name)}</span>
                <span class="ng-article__weight">${i} vote${i===1?"":"s"}</span>
            </div>
            <div class="ng-article__body">${s(e.body)}</div>
            <div class="ng-article__meta">
                <span>CARTEL <b>${e.cartel.toFixed(1)}</b></span>
                <span>CHS <b>+${e.chs.toFixed(1)}</b></span>
            </div>
            <div class="ng-article__voters">VOTED: ${l}</div>
        </div>
    `}function At(e){const a=e.is_founder?'<span class="al-row__tag" style="color:var(--amber);border-color:var(--amber);background:var(--amber-faint);margin-left:6px;">FOUNDER</span>':"";return`
        <div class="ng-chat__msg">
            <div class="ng-chat__msg-head">
                <span class="ng-chat__msg-author">${s(e.author||"—")}</span>
                ${a}
                <span class="ng-chat__msg-ago">${s(e.ago||"")}</span>
            </div>
            <div class="ng-chat__msg-body">${s(e.body||"")}</div>
        </div>
    `}function St(){if(F==="list"){document.getElementById("open-found-btn")?.addEventListener("click",qt),document.querySelectorAll(".al-filter-pill").forEach(t=>{t.addEventListener("click",()=>{const i=t.dataset.filter;!i||i===ve||(ve=i,C())})}),document.querySelectorAll("[data-toggle-id]").forEach(t=>{t.addEventListener("click",()=>{const i=t.dataset.toggleId;ye.has(i)?ye.delete(i):ye.add(i),C()})}),document.querySelectorAll("[data-apply-id]").forEach(t=>{t.addEventListener("click",i=>{i.stopPropagation();const o=t.dataset.applyId,c=(Je||[]).find(l=>l.id===o);c&&Ce({title:`Apply to join ${c.name}?`,body:"Submitting an application sends a request to the alliance's presiding chair. Acceptance is at the alliance's discretion.",confirmLabel:"Send Application",onConfirm:()=>{}})})}),document.querySelectorAll("[data-pending-id]").forEach(t=>{t.addEventListener("click",()=>Ke(t.dataset.pendingId))}),document.querySelectorAll(".al-aiv-open-btn").forEach(t=>{t.addEventListener("click",i=>{i.stopPropagation();const o=t.dataset.allianceId;o&&Ot(o)})}),document.querySelectorAll("[data-leave-id]").forEach(t=>{t.addEventListener("click",i=>{i.stopPropagation();const o=t.dataset.leaveId,c=(G||[]).find(l=>l.id===o);c&&Ce({title:`Leave ${c.name}?`,body:"You will lose access to alliance benefits and chat. If you are the last member, the alliance will dissolve.",confirmLabel:"Leave Alliance",onConfirm:()=>{Mt(o)}})})});return}if(F==="negotiation"){document.querySelectorAll(".fnd-crumb__link").forEach(i=>{i.addEventListener("click",o=>{o.preventDefault(),i.dataset.nav==="list"&&Ae(),i.dataset.nav==="found"&&(F="found",S=null,C())})}),document.querySelectorAll(".ng-article").forEach(i=>{i.addEventListener("click",()=>{j=i.dataset.articleId,C()})}),document.getElementById("ng-submit-vote")?.addEventListener("click",Nt),document.getElementById("ng-ratify")?.addEventListener("click",Rt),document.getElementById("ng-withdraw")?.addEventListener("click",Ft),document.getElementById("ng-chat-send")?.addEventListener("click",De);const t=document.getElementById("ng-chat-input");t&&t.addEventListener("keydown",i=>{i.key==="Enter"&&!i.shiftKey&&(i.preventDefault(),De())});return}document.getElementById("fnd-back")?.addEventListener("click",Ue),document.getElementById("fnd-cancel")?.addEventListener("click",Ue);const e=document.getElementById("fnd-name");e&&e.addEventListener("input",t=>{I.name=t.target.value});const a=document.getElementById("fnd-mission");a&&a.addEventListener("input",t=>{I.mission=t.target.value}),document.querySelectorAll(".fnd-invitee").forEach(t=>{t.addEventListener("click",()=>Tt(t.dataset.corpId))}),document.getElementById("fnd-submit")?.addEventListener("click",Lt)}async function ee(e){if(!be){be=!0;try{await e()}finally{be=!1}}}function te(e,a,t){const i=a&&a.message||t&&t.error||"Unknown error";alert(`${e}: ${i}`)}async function Lt(){await ee(async()=>{const e=Array.from(I.selectedInviteeIds),{data:a,error:t}=await m.rpc("propose_strategic_alliance",{p_founder_faction_id:g.id,p_name:I.name.trim(),p_mission:I.mission.trim()||null,p_invitee_ids:e});if(t||!a?.success){te("Failed to send invitations",t,a);return}I={name:"",selectedInviteeIds:new Set,mission:""},await J(),a.alliance_id?Ke(a.alliance_id):(F="list",C())})}async function Nt(){await ee(async()=>{const e=Bt();if(!e)return;const a=e.vote||null,t=j,i=t&&t!==a;if(!i&&!(a!==null&&!i))return;const c=i?"submit_alliance_vote":"unsubmit_alliance_vote",l=i?{p_voter_faction_id:g.id,p_alliance_id:S,p_article_id:t}:{p_voter_faction_id:g.id,p_alliance_id:S},{data:p,error:_}=await m.rpc(c,l);if(_||!p?.success){te("Vote failed",_,p);return}j=null,await J(),C()})}async function Rt(){await ee(async()=>{const e=(T||[]).find(c=>c.id===S);if(!e)return;const a=Se(e);if(!a.reached){alert(a.label);return}const t=(e.articles||[]).find(c=>c.id===a.article_id);if(!t){alert("Article catalog mismatch — refresh and retry.");return}const{data:i,error:o}=await m.rpc("ratify_strategic_alliance",{p_founder_faction_id:g.id,p_alliance_id:S,p_article_name:t.name,p_article_kind:t.kind,p_article_body:t.body,p_cartel_score:t.cartel,p_chs_bonus:t.chs});if(o||!i?.success){te("Ratification failed",o,i);return}await J(),Ae()})}function Ft(){const e=S;Ce({title:"Withdraw this proposal?",body:"The negotiation will be dissolved and the founding fee refunded to your corporation.",confirmLabel:"Withdraw Proposal",onConfirm:()=>{ee(async()=>{const{data:a,error:t}=await m.rpc("withdraw_strategic_alliance",{p_founder_faction_id:g.id,p_alliance_id:e});if(t||!a?.success){te("Withdraw failed",t,a);return}await J(),Ae()})}})}async function Mt(e){await ee(async()=>{const{data:a,error:t}=await m.rpc("leave_strategic_alliance",{p_faction_id:g.id,p_alliance_id:e});if(t||!a?.success){te("Leave failed",t,a);return}await J(),C()})}async function De(){const e=document.getElementById("ng-chat-input"),a=(e?.value||"").trim();a&&await ee(async()=>{const{data:t,error:i}=await m.rpc("send_alliance_message",{p_faction_id:g.id,p_alliance_id:S,p_body:a});if(i||!t?.success){te("Message failed",i,t);return}e&&(e.value=""),await J(),C()})}function Bt(){const e=(T||[]).find(a=>a.id===S);return e?(e.members||[]).find(a=>a.is_you):null}function Ce({title:e,body:a,confirmLabel:t,onConfirm:i}){Ee={onConfirm:i||(()=>{})};const o=document.getElementById("al-confirm-overlay"),c=document.getElementById("al-confirm");!o||!c||(c.innerHTML=`
        <div class="al-modal__title">${s(e||"Confirm")}</div>
        <div class="al-modal__body">${s(a||"")}</div>
        <div class="al-modal__actions">
            <button class="al-btn" id="al-confirm-cancel">Cancel</button>
            <button class="al-btn al-btn--primary" id="al-confirm-yes">${s(t||"Confirm")}</button>
        </div>
    `,o.classList.add("open"),o.setAttribute("aria-hidden","false"),document.getElementById("al-confirm-cancel")?.addEventListener("click",ze),document.getElementById("al-confirm-yes")?.addEventListener("click",()=>{try{Ee?.onConfirm?.()}finally{ze()}}))}function ze(){Ee=null;const e=document.getElementById("al-confirm-overlay");e&&(e.classList.remove("open"),e.setAttribute("aria-hidden","true"))}function Tt(e){if(!(!e||W.find(t=>t.id===e)?.__currentAlliance)){if(I.selectedInviteeIds.has(e))I.selectedInviteeIds.delete(e);else{if(I.selectedInviteeIds.size>=Ie)return;I.selectedInviteeIds.add(e)}C()}}async function qt(){F="found",C(),await Vt(),C()}function Ue(){F="list",I={name:"",selectedInviteeIds:new Set,mission:""},C()}async function Vt(){const e=g?.corp_sector;if(!e||!g?.id){W=[];return}const{data:a,error:t}=await m.from("factions").select("id, faction_name, abbreviation, corp_ticker, corp_sector, corp_cash_reserves, corp_reputation, corp_work_crews, corp_regulatory_standing, corp_supply_chain, corp_op_safety, last_seen_tick, custom_logo_url, nation_id").eq("faction_type","corporation").eq("corp_sector",e).is("abandoned_at",null).neq("id",g.id);if(t){console.warn("[alliances] candidate fetch failed:",t.message),W=[];return}const i=a||[],o=i.map(d=>d.id);if(o.length===0){W=[];return}const c=Array.from(new Set(i.map(d=>d.nation_id).filter(Boolean))),l=new Map;if(c.length>0){const{data:d}=await m.from("nations").select("id, name").in("id",c);for(const b of d||[])l.set(b.id,b.name)}for(const d of i)d.__hq_nation=l.get(d.nation_id)||null;const p=Number(de?.current_tick)||0,[_,x,v,u]=await Promise.all([m.from("corp_properties").select("faction_id, purchase_price, condition").in("faction_id",o).eq("is_active",!0),m.from("corp_vessels").select("faction_id, purchase_price, condition, status, built_at_tick").in("faction_id",o),m.from("finance_active_loans").select("borrower_faction_id, lender_faction_id, principal, remaining_principal, status, finance_loan_requests(request_type)").in("status",["current","late","delinquent"]).or(`borrower_faction_id.in.(${o.join(",")}),lender_faction_id.in.(${o.join(",")})`),m.from("alliance_members").select("faction_id, strategic_alliances!inner(id, name, status)").in("faction_id",o).is("left_at_tick",null).in("strategic_alliances.status",["negotiating","active"])]);_.error&&console.warn("[alliances] props fetch failed:",_.error.message),x.error&&console.warn("[alliances] vessels fetch failed:",x.error.message),v.error&&console.warn("[alliances] loans fetch failed:",v.error.message),u.error&&console.warn("[alliances] membership fetch failed:",u.error.message);const y={};for(const d of u.data||[]){const b=d.strategic_alliances;b&&!y[d.faction_id]&&(y[d.faction_id]={name:b.name,status:b.status})}for(const d of i)d.__currentAlliance=y[d.id]||null;if(I?.selectedInviteeIds?.size)for(const d of[...I.selectedInviteeIds])y[d]&&I.selectedInviteeIds.delete(d);const h=new Map;for(const d of o)h.set(d,{properties:[],vessels:[],debt:0,receivables:0});for(const d of _.data||[])h.get(d.faction_id)?.properties.push(d);for(const d of x.data||[])h.get(d.faction_id)?.vessels.push(d);for(const d of v.data||[]){const b=(d.finance_loan_requests?.request_type||"loan").toLowerCase(),L=Math.max(0,Number(d.principal||0)),B=Math.max(0,Number(d.remaining_principal||0)),M=h.get(d.borrower_faction_id);M&&(M.debt+=B);const P=h.get(d.lender_faction_id);P&&b!=="insurance"&&(P.receivables+=b==="bond"?B>0?B:L:B)}for(const d of i){const b=h.get(d.id),L=Xe({cash:d.corp_cash_reserves,loans:b?.debt||0,properties:b?.properties,vessels:b?.vessels,financeReceivables:b?.receivables||0,currentTick:p});d.__valuation=L.valuation}i.sort((d,b)=>(b.__valuation||0)-(d.__valuation||0)),W=i}let r=null;async function Ot(e){const a=document.getElementById("al-aiv-overlay");a&&(r={allianceId:e,vote:null,ballots:[],chat:[],members:[],myMembership:!1,draftFloor:null,draftCeiling:null,chatDraft:"",busy:!1,error:null},a.classList.add("open"),a.setAttribute("aria-hidden","false"),await ae())}function ke(){const e=document.getElementById("al-aiv-overlay");e?.classList.remove("open"),e?.setAttribute("aria-hidden","true"),r=null}async function ae(){if(!r)return;const{allianceId:e}=r;try{const[a,t,i,o]=await Promise.all([m.from("alliance_interest_votes").select("id, alliance_id, initiator_faction_id, status, opened_at_tick, expires_at_tick, pending_resolve_at_tick, pending_floor_apr, pending_ceiling_apr, resolved_at_tick, winning_floor_apr, winning_ceiling_apr").eq("alliance_id",e).order("opened_at_tick",{ascending:!1}).limit(1).maybeSingle(),m.from("alliance_interest_vote_chat").select("id, author_faction_id, is_observer, is_system, body, posted_at_tick, created_at, factions:author_faction_id(faction_name, abbreviation, party_color)").eq("alliance_id",e).order("created_at",{ascending:!0}).limit(200),m.from("alliance_members").select("faction_id, role, factions:faction_id(faction_name, abbreviation, party_color)").eq("alliance_id",e).is("left_at_tick",null),m.from("strategic_alliances").select("id, name, aligned_interest_floor_apr, aligned_interest_ceiling_apr").eq("id",e).maybeSingle()]);if(a.error&&console.warn("[aiv] vote fetch failed:",a.error.message),t.error&&console.warn("[aiv] chat fetch failed:",t.error.message),i.error&&console.warn("[aiv] members fetch failed:",i.error.message),o.error&&console.warn("[aiv] alliance fetch failed:",o.error.message),r.vote=a.data||null,r.chat=t.data||[],r.members=i.data||[],r.alliance=o.data||null,r.myMembership=(i.data||[]).some(c=>c.faction_id===g?.id),r.vote){const{data:c,error:l}=await m.from("alliance_interest_vote_ballots").select("voter_faction_id, floor_choice, ceiling_choice, cast_at_tick").eq("vote_id",r.vote.id);l&&console.warn("[aiv] ballots fetch failed:",l.message),r.ballots=c||[];const p=(c||[]).find(_=>_.voter_faction_id===g?.id);p&&(r.draftFloor=r.draftFloor??p.floor_choice,r.draftCeiling=r.draftCeiling??p.ceiling_choice)}else r.ballots=[]}catch(a){console.error("[aiv] refresh threw:",a),r.error=a?.message||String(a)}D()}function D(){const e=document.getElementById("al-aiv-overlay"),a=document.getElementById("al-aiv-modal");if(!e||!a||!r)return;const t=r,i=t.alliance,o=t.vote,c=t.myMembership,l=!!(o&&g?.id&&o.initiator_faction_id===g.id),p=!!(o&&o.status==="open"),_=(t.ballots||[]).find(f=>f.voter_faction_id===g?.id),x={1:0,2:0,3:0,4:0,5:0},v={6:0,7:0,8:0,9:0,10:0};for(const f of t.ballots||[])x[f.floor_choice]!==void 0&&x[f.floor_choice]++,v[f.ceiling_choice]!==void 0&&v[f.ceiling_choice]++;const u=(t.ballots||[]).length,y=i?.aligned_interest_floor_apr!=null&&i?.aligned_interest_ceiling_apr!=null?`Current band: <span style="color:var(--amber);font-weight:700;">${Number(i.aligned_interest_floor_apr).toFixed(1)}% – ${Number(i.aligned_interest_ceiling_apr).toFixed(1)}%</span>`:'<span style="font-style:italic;">No band set yet.</span>';let h="";!o||o.status!=="open"?o?.status==="resolved"?h=`<div class="al-aiv-status al-aiv-status--info">Last vote resolved: Floor ${Number(o.winning_floor_apr)}%, Ceiling ${Number(o.winning_ceiling_apr)}% (tick ${o.resolved_at_tick}).</div>`:o?.status==="withdrawn"?h=`<div class="al-aiv-status al-aiv-status--warn">Last vote withdrawn at tick ${o.resolved_at_tick}.</div>`:o?.status==="expired"&&(h=`<div class="al-aiv-status al-aiv-status--warn">Last vote expired without majority at tick ${o.resolved_at_tick}.</div>`):o.pending_resolve_at_tick!=null?h=`<div class="al-aiv-status al-aiv-status--info">Majority reached: Floor ${o.pending_floor_apr}%, Ceiling ${o.pending_ceiling_apr}%. Band updates next tick.</div>`:h=`<div class="al-aiv-status al-aiv-status--info">Vote open — closes at tick ${o.expires_at_tick} (30-tick window).</div>`;const d=(f,E,q,U,V)=>E.map(H=>{const X=U[H]||0;return`<button type="button" class="al-aiv-radio ${q===H?"selected":""} ${V?"disabled":""}"
            ${V?"disabled":""} data-axis="${f}" data-value="${H}">
            ${H}%${X>0?`<span style="display:block;font-size:8px;color:var(--text-dim);margin-top:2px;">${X} vote${X!==1?"s":""}</span>`:""}
        </button>`}).join(""),b=c&&p&&!t.busy&&t.draftFloor!=null&&t.draftCeiling!=null&&(_==null||_.floor_choice!==t.draftFloor||_.ceiling_choice!==t.draftCeiling),L=`
        <div class="al-aiv-vote-pane">
            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);line-height:1.5;">${y}</div>
            ${h}
            ${p?`
                <div class="al-aiv-section-label">Floor (your pick)</div>
                <div class="al-aiv-radios">${d("floor",[1,2,3,4,5],t.draftFloor,x,!c)}</div>
                <div class="al-aiv-section-label">Ceiling (your pick)</div>
                <div class="al-aiv-radios">${d("ceiling",[6,7,8,9,10],t.draftCeiling,v,!c)}</div>
                <div class="al-aiv-tally">
                    <div style="color:var(--text-dim);text-transform:uppercase;letter-spacing:0.1em;font-size:9px;margin-bottom:4px;">Tally · ${u} ballot${u!==1?"s":""} cast</div>
                    <div>Floor leader needs >${Math.floor(u/2)} of ${u}, Ceiling leader same. Both must independently cross 50% before the band updates next tick.</div>
                </div>
                <div class="al-aiv-actions">
                    ${l?`<button class="btn-withdraw" id="al-aiv-withdraw-btn" ${t.busy?"disabled":""}>Withdraw Vote</button>`:""}
                    ${c&&o.pending_resolve_at_tick!=null?`<button class="btn-submit" id="al-aiv-finalize-btn" ${t.busy?"disabled":""}>Finalize Now</button>`:""}
                    ${c?`<button class="btn-submit" id="al-aiv-submit-btn" ${b?"":"disabled"}>${_?"Update Vote":"Submit Vote"}</button>`:""}
                    <button class="btn-close" id="al-aiv-close-btn">Close</button>
                </div>
            `:`
                <div class="al-aiv-actions">
                    ${c?`<button class="btn-submit" id="al-aiv-start-btn" ${t.busy?"disabled":""}>Start New Vote</button>`:""}
                    <button class="btn-close" id="al-aiv-close-btn">Close</button>
                </div>
            `}
            ${t.error?`<div class="al-aiv-status al-aiv-status--error">${s(t.error)}</div>`:""}
        </div>
    `,B=(t.chat||[]).map(f=>{const E=f.factions||{},q=f.is_system?"—":E.faction_name||"Unknown",U=f.is_system?"al-aiv-chat-msg--system":f.is_observer?"al-aiv-chat-msg--observer":"",V=f.is_system?"":f.is_observer?'<span class="al-aiv-chat-tag">OBSERVER</span>':"";return`<div class="al-aiv-chat-msg ${U}">
            <div class="al-aiv-chat-msg__head">${f.is_system?"System":s(q)}${V} <span style="margin-left:6px;">tick ${f.posted_at_tick}</span></div>
            <div class="al-aiv-chat-msg__body">${s(f.body||"")}</div>
        </div>`}).join("")||'<div style="color:var(--text-dim);font-family:var(--font-mono);font-size:10px;text-align:center;padding:20px;">No messages yet.</div>',M=`
        <div class="al-aiv-chat-pane">
            <div class="al-aiv-chat-head">Discussion${c?"":" · OBSERVER"}</div>
            <div class="al-aiv-chat-list" id="al-aiv-chat-list">${B}</div>
            <div class="al-aiv-chat-input">
                <input id="al-aiv-chat-input" type="text" maxlength="1000" placeholder="Message…" value="${s(t.chatDraft||"")}">
                <button id="al-aiv-chat-send" ${t.busy||!t.chatDraft||!t.chatDraft.trim()?"disabled":""}>Send</button>
            </div>
        </div>
    `;a.innerHTML=`
        <div class="al-aiv-header">
            <div>
                <div class="al-aiv-title">${s(i?.name||"Alliance")}</div>
                <div class="al-aiv-subtitle">Aligned Interest · Vote on Rate Band</div>
            </div>
            <button class="btn-close" id="al-aiv-x" style="background:transparent;border:none;color:var(--text-dim);font-size:18px;cursor:pointer;">&times;</button>
        </div>
        <div class="al-aiv-body">
            ${L}
            ${M}
        </div>
    `;const P=document.getElementById("al-aiv-chat-list");P&&(P.scrollTop=P.scrollHeight),document.getElementById("al-aiv-x")?.addEventListener("click",ke),document.getElementById("al-aiv-close-btn")?.addEventListener("click",ke),e.onclick=f=>{f.target===e&&ke()},a.querySelectorAll("[data-axis]").forEach(f=>{f.addEventListener("click",()=>{if(f.disabled)return;const E=f.dataset.axis,q=Number(f.dataset.value);E==="floor"&&(r.draftFloor=q),E==="ceiling"&&(r.draftCeiling=q),D()})}),document.getElementById("al-aiv-submit-btn")?.addEventListener("click",jt),document.getElementById("al-aiv-withdraw-btn")?.addEventListener("click",Dt),document.getElementById("al-aiv-finalize-btn")?.addEventListener("click",zt),document.getElementById("al-aiv-start-btn")?.addEventListener("click",Pt);const z=document.getElementById("al-aiv-chat-input"),pe=document.getElementById("al-aiv-chat-send");z&&(z.addEventListener("input",()=>{r.chatDraft=z.value,pe.disabled=!z.value.trim()||t.busy}),z.addEventListener("keydown",f=>{f.key==="Enter"&&He()})),pe?.addEventListener("click",He)}async function Pt(){if(!(!r||r.busy)){r.busy=!0,r.error=null,D();try{const{data:e,error:a}=await m.rpc("start_alliance_interest_vote",{p_alliance_id:r.allianceId});a?r.error=a.message:e?.success||(r.error=`Could not start vote: ${e?.reason||"unknown"}`)}catch(e){r.error=e?.message||String(e)}finally{r.busy=!1,await ae()}}}async function jt(){if(!(!r||!r.vote||r.busy)&&!(r.draftFloor==null||r.draftCeiling==null)){r.busy=!0,r.error=null,D();try{const{data:e,error:a}=await m.rpc("cast_alliance_interest_vote",{p_vote_id:r.vote.id,p_floor:r.draftFloor,p_ceiling:r.draftCeiling});a?r.error=a.message:e?.success||(r.error=`Vote failed: ${e?.reason||"unknown"}`)}catch(e){r.error=e?.message||String(e)}finally{r.busy=!1,await ae()}}}async function Dt(){if(!(!r||!r.vote||r.busy)&&confirm("Withdraw the active Interest Rate vote? All cast ballots are discarded.")){r.busy=!0,r.error=null,D();try{const{data:e,error:a}=await m.rpc("withdraw_alliance_interest_vote",{p_vote_id:r.vote.id});a?r.error=a.message:e?.success||(r.error=`Withdraw failed: ${e?.reason||"unknown"}`)}catch(e){r.error=e?.message||String(e)}finally{r.busy=!1,await ae()}}}async function zt(){if(!(!r||!r.vote||r.busy)){if(r.vote.pending_resolve_at_tick==null){r.error="Majority not yet reached — cannot finalize.",D();return}if(confirm("Finalize the Interest Rate vote now? The band locks in immediately.")){r.busy=!0,r.error=null,D();try{const{data:e,error:a}=await m.rpc("finalize_alliance_interest_vote",{p_vote_id:r.vote.id});a?r.error=a.message:e?.success||(r.error=`Finalize failed: ${e?.reason||"unknown"}`)}catch(e){r.error=e?.message||String(e)}finally{r.busy=!1,await ae()}}}}async function He(){if(!r||r.busy)return;const e=(r.chatDraft||"").trim();if(e){r.busy=!0,D();try{const{data:a,error:t}=await m.rpc("post_alliance_interest_vote_message",{p_alliance_id:r.allianceId,p_body:e});t?r.error=t.message:a?.success?r.chatDraft="":r.error=`Post failed: ${a?.reason||"unknown"}`}catch(a){r.error=a?.message||String(a)}finally{r.busy=!1,await ae()}}}pt();
