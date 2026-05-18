import{GAME_CONFIG as me,FORMATION_DEADLINE_TICKS as ce}from"./config-BdOpHGNJ.js";import{a as W,h as Q,b as ue,l as ve}from"./government-types-CNjNcIHN.js";import{b as ge}from"./stats-Nd7eW9dF.js";import{g as he}from"./political-actions-BCfwIhEF.js";import{f as ye}from"./government-structure-DVzKGcwP.js";import{t as be}from"./utils-oN1e812_.js";async function De(e,i){const{faction:a,nation:o,pmFactionId:r,pmLastName:n,isSemiPres:t,tick:s,mySeats:d}=i;if(!a?.id||!o?.id||!r)return{ok:!1,error:"Missing required arguments (faction, nation, or PM party id)."};const{data:p}=await e.from("nations").select("government_type, hos_election_method").eq("id",o.id).maybeSingle();if(W(p))return{ok:!1,error:"No-confidence motions cannot be filed under absolute monarchy. Only the Monarch can dismiss the Prime Minister."};const f=n?t?`Motion of No Confidence in PM ${n}`:`Motion of No Confidence in the ${n} Government`:"Motion of No Confidence in the Government",c=t?`This motion, filed by the ${a.faction_name}, calls for a vote of no confidence in the Prime Minister. If passed by simple majority, the PM will be removed and the President must nominate a replacement.`:`This motion, filed by the ${a.faction_name}, calls for a vote of no confidence in the current government. If passed by simple majority, the coalition will be immediately dissolved.`,{data:m,error:v}=await e.from("bills").insert({nation_id:o.id,proposed_by:a.id,proposed_tick:s,bill_name:f,bill_type:"no_confidence",status:"floor",floor_tick:s,voting_ends_tick:s+me.NO_CONFIDENCE_VOTING_TICKS,proposer_name:a.faction_name,proposer_color:a.party_color,preamble:c}).select("id").single();if(v)return{ok:!1,error:v.message};const{count:y}=await e.from("bills").select("id",{count:"exact",head:!0}).eq("nation_id",o.id).eq("bill_type","no_confidence").in("status",["committee","floor"]);if((y??0)>1)return await e.from("bills").delete().eq("id",m.id),{ok:!1,error:"Another motion of no confidence was just filed. Please refresh."};const{error:h}=await e.from("bill_support").upsert({bill_id:m.id,faction_id:a.id,stance:"yes",seat_count:Number(d)||0},{onConflict:"bill_id,faction_id"});h&&console.warn("[no_confidence] auto-vote upsert failed (non-fatal, motion still filed):",h.message);const{error:I}=await e.from("campaign_actions").insert({party_id:a.id,nation_id:o.id,target_id:r,action_type:"no_confidence_filed",ap_cost:0,money_cost:0,tick_performed:s,result:{bill_id:m.id,pm_last_name:n||null}});return I&&console.warn("[no_confidence] cooldown insert failed (motion still filed; next file may slip past cooldown):",I.message),{ok:!0,billId:m.id,motionName:f}}const _e=[{id:"economic_reform",name:"Economic Reform",icon:"📈",tagline:"Growth-first neoliberal agenda",desc:"Prioritize GDP, attract foreign capital, lower corporate taxes. The rising tide theory — grow the pie and worry about slicing it later.",improve:["gdp_growth","gdp","service_sector","industry","global_image"],worsen:["wages","standard_of_living","income_tax","corporate_tax"],tradeoff:"Income inequality tends to rise. Working class sees GDP numbers go up while their wages don't."},{id:"social_justice",name:"Social Justice",icon:"⚖️",tagline:"Redistribution and equity",desc:"Raise minimum wage, expand welfare, progressive taxation. Close the gap between rich and poor through direct intervention.",improve:["wages","standard_of_living","health","public_approval","corporate_tax"],worsen:["gdp_growth","global_image","budget"],tradeoff:"Capital flight risk. Foreign investors avoid high-tax environments. Growth may slow."},{id:"national_security",name:"National Security",icon:"🛡️",tagline:"Borders, military, order",desc:"Strengthen defense, tighten borders, expand police powers. Safety through strength.",improve:["state_apparatus","crime","unrest"],worsen:["immigration","public_approval","corruption"],tradeoff:"Freedom drops. Minority communities disproportionately affected. International criticism."},{id:"anti_corruption",name:"Anti-Corruption",icon:"🔍",tagline:"Clean government, institutional reform",desc:"Independent judiciary, transparent budgets, prosecute the connected. Popular with voters but powerful people fight back hard.",improve:["corruption","state_apparatus","public_approval"],worsen:["unrest","gdp_growth"],tradeoff:"Short-term chaos as exposing corruption shakes institutions. Your own party's skeletons may surface."},{id:"green_transition",name:"Green Transition",icon:"🌱",tagline:"Climate and environment",desc:"Renewable energy investment, carbon taxes, emissions targets. Save the planet — but the bill comes due now, not later.",improve:["energy","health","education"],worsen:["gdp_growth","industry","cost_of_living"],tradeoff:"Energy costs spike during transition. Rural and industrial voters feel abandoned."},{id:"industrialization",name:"Industrialization",icon:"🏭",tagline:"Factories, exports, production",desc:"Build manufacturing capacity, create blue-collar jobs, develop physical infrastructure. The backbone of a real economy.",improve:["industry","unskilled_workers","infrastructure","gdp","gdp_growth"],worsen:["health","farmland"],tradeoff:"Environment gets destroyed. Long-term health costs from industrial pollution."},{id:"digital_modernization",name:"Digital Modernization",icon:"💻",tagline:"Tech economy, connectivity",desc:"Fiber everywhere, tech sector incentives, digital government services. Leap into the future — but not everyone makes the jump.",improve:["infrastructure","service_sector","skilled_workers","education","state_apparatus"],worsen:["unskilled_workers","wages","cost_of_living"],tradeoff:"Automation displaces workers. Rural communities left behind. Tech wealth concentrates in cities."},{id:"welfare_state",name:"Welfare State",icon:"🏥",tagline:"Universal services, safety net",desc:"Free healthcare, free education, generous pensions, unemployment insurance. Cradle to grave — funded by steep taxes on everyone.",improve:["health","education","standard_of_living","public_approval","income_tax","corporate_tax"],worsen:["gdp_growth","debt","global_image"],tradeoff:"Massive fiscal cost. Tax burden on middle class, not just the rich. Sustainability questioned."},{id:"populist_nationalism",name:"Populist Nationalism",icon:"🇲",tagline:"The people vs. elites and outsiders",desc:"Restrict immigration, protect domestic industry, reject globalism. Our people first. Our jobs first. Our culture first.",improve:["industry","wages","unskilled_workers","public_approval"],worsen:["immigration","global_image","skilled_workers"],tradeoff:"International isolation. Brain drain as educated professionals emigrate. Deep social polarization."},{id:"free_market",name:"Free Market Liberalism",icon:"🏛️",tagline:"Deregulate everything",desc:"Cut taxes, cut red tape, let the market decide winners and losers. Government is the problem, not the solution.",improve:["gdp_growth","gdp","service_sector","global_image"],worsen:["wages","standard_of_living","income_tax","corporate_tax","health"],tradeoff:"Growth at the cost of the working class. Social safety net erodes. Boom-bust volatility."},{id:"law_and_order",name:"Law & Order",icon:"⚔️",tagline:"Tough on crime, strong institutions",desc:"More police, harsher sentences, zero tolerance. Restore order to the streets. Criminals fear the state.",improve:["crime","state_apparatus","unrest"],worsen:["public_approval","budget"],tradeoff:"Prison population explodes. Minority communities targeted. Policing costs balloon."},{id:"education_first",name:"Education First",icon:"🎓",tagline:"Human capital as the long game",desc:"Fund schools, universities, research institutions, teacher salaries. The 20-year bet that the next generation will be smarter and richer.",improve:["education","skilled_workers","public_approval","income_tax"],worsen:["budget","debt","gdp_growth"],tradeoff:"Voters don't see results before next election. Brain drain if jobs don't exist for graduates."},{id:"healthcare_reform",name:"Healthcare Reform",icon:"💊",tagline:"Fix the hospitals",desc:"More beds, more doctors, better drugs, universal coverage. Nobody dies because they can't afford treatment.",improve:["health","public_approval","standard_of_living","income_tax"],worsen:["budget","debt","cost_of_living"],tradeoff:"Pharmaceutical lobby fights back. Extremely expensive. Takes multiple cycles to show results."},{id:"housing_cost",name:"Housing & Cost of Living",icon:"🏠",tagline:"The kitchen-table platform",desc:"Rent controls, public housing, affordable food, price caps on essentials. People can't eat GDP growth.",improve:["cost_of_living","standard_of_living","infrastructure"],worsen:["gdp_growth","global_image","industry"],tradeoff:"Property owners and developers become your enemies. Market distortions create shortages."},{id:"energy_independence",name:"Energy Independence",icon:"⛽",tagline:"Control your own power supply",desc:"Exploit domestic oil, gas, and minerals. No more dependency on foreign energy. Cheap fuel, strong economy, sovereign power.",improve:["energy","minerals","industry","gdp_growth"],worsen:["health","farmland","global_image"],tradeoff:"Climate commitments broken. Green voters abandon you. Environmental debt for future generations."},{id:"open_society",name:"Open Society",icon:"🕊️",tagline:"Liberal democracy, civil liberties",desc:"Free press, open borders, multicultural embrace, strong civil rights. A beacon of freedom — and a target for those who fear it.",improve:["immigration","global_image","public_approval","education"],worsen:["unrest","state_apparatus","crime"],tradeoff:"Nationalist backlash. Rural-urban divide deepens. Security vulnerabilities from openness."}],Ue={gdp:"GDP",state_apparatus:"State Apparatus",public_approval:"Public Approval",unrest:"Unrest",crown_authority:"Crown Authority",budget:"Budget",debt:"Debt",energy:"Energy",health:"Health",education:"Education",global_image:"Global Image",infrastructure:"Infrastructure",industry:"Industry",farmland:"Farmland",standard_of_living:"Standard of Living",cost_of_living:"Cost of Living",gdp_growth:"GDP Growth",immigration:"Immigration",service_sector:"Service Sector",unskilled_workers:"Unskilled Workers",skilled_workers:"Skilled Workers",income_tax:"Income Tax",corporate_tax:"Corporate Tax",crime:"Crime",corruption:"Corruption",minerals:"Minerals",wages:"Wages"},we=new Set(["unrest","debt","cost_of_living","crime","corruption"]),$e=new Set(["income_tax","corporate_tax"]);function He(e,i){const a=we.has(e),o=$e.has(e);return i==="improve"?a?{arrow:"↓",color:"#5cc55c"}:o?{arrow:"↑",color:"#c84"}:{arrow:"↑",color:"#5cc55c"}:a?{arrow:"↑",color:"#c55"}:o?{arrow:"↓",color:"#5cc55c"}:{arrow:"↓",color:"#c55"}}const Ye={adoptTenths:3,failTenths:-5};let E=null,u=null,B=!1,H=null,b=[],M=[],C=0,ae={},Z=[],U=null,fe=null,x=0,se=null,Y=0,$=[],q=!1,D=null,V=null,P={},oe=!1;const xe=4;function le(e){const i=Number(e?.last_seen_tick)||0;if(!i)return"";const a=Y-i;return a<xe?"":`<span class="cf-inactive">[Inactive – ${a} tick${a!==1?"s":""}]</span>`}function g(e){if(!e)return"";const i=document.createElement("div");return i.textContent=e,i.innerHTML}async function Ve(e,i){E=e,u=i;const a=i.nation,o=i.faction;if(!a||!o)return{needed:!1};const[r,n,t,s,d,p,f]=await Promise.all([e.from("elections").select("id, election_type, election_tick, status").eq("nation_id",a.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),e.from("shard").select("current_tick").eq("name","Alpha Shard").single(),ye(e,a.id),e.from("factions").select("id, faction_name, abbreviation, party_color, seats, bloc_id, last_seen_tick").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),e.from("elections").select("election_tick, election_type").eq("nation_id",a.id).eq("status","scheduled").order("election_tick",{ascending:!0}),e.from("faction_platforms").select("faction_id, platform_key, slot").eq("nation_id",a.id).eq("status","active").order("slot",{ascending:!0}),e.from("head_of_government").select("id, faction_id, first_name, last_name, active").eq("nation_id",a.id).eq("active",!0).maybeSingle()]);Y=n.data?.current_tick??0,b=s.data||[],C=b.reduce((y,h)=>y+(h.seats||0),0),x=Math.ceil(C/2)+1,Z=d?.data||[],U=t||null,fe=f?.data||null,ae={},p?.error&&console.warn("[CoalitionFormation] faction_platforms query failed:",p.error.message);for(const y of p?.data||[])(ae[y.faction_id]||=[]).push(y.platform_key);const c=r.data,v=!!(t||null);if(Q(a))return B=!1,{needed:!1};if(c&&(H=c.id,se=c.election_tick),c&&!v)B=!0;else{const y=t?.formation_type==="emergency_minority"&&Array.isArray(t.party_ids)&&t.party_ids.includes(o.id);let h=!1;c&&(await pe(),h=(M||[]).some(I=>I.iAmInvited)),B=!v||y||h}return{needed:B}}function ke(){const e=u?.nation;if(!e||W(e))return"";const i=Q(e),a=Number(Y)||0,o=Z.find(h=>h.election_type==="parliamentary")||null,r=Z.find(h=>h.election_type==="presidential")||null;function n(h,I,A,O,ee){if(!I)return`<div class="cf-eh-stat-label">${h}</div>
                <div class="cf-eh-stat-value cf-eh-stat-value--accent">TBD</div>`;const l=I.election_tick,w=Math.max(0,l-a),F=`${w} Month${w===1?"":"s"}`,T=be(l),G=A&&A.election_tick===l?O:ee;return`<div class="cf-eh-stat-label">${h}</div>
            <div class="cf-eh-stat-value cf-eh-stat-value--accent">${g(T)}</div>
            <div class="cf-eh-stat-sub">${g(F)}</div>
            <div class="cf-eh-stat-sub">${g(G)}</div>`}let t;i?t=`<div class="cf-eh-stat">
            ${n("NEXT GENERAL ELECTION",o,r,"Parliament + Presidential","Parliament only (Midterm)")}
            <div style="margin-top:14px;border-top:1px solid var(--border-main);padding-top:12px;"></div>
            ${n("NEXT PRESIDENTIAL ELECTION",r,o,"Paired with general","Standalone")}
        </div>`:t=`<div class="cf-eh-stat">
            ${n("NEXT ELECTION",o,null,"Parliamentary","Parliamentary")}
        </div>`;const s=Number(e.total_seats)||0,d=Number(e.parliamentary_term_ticks)||Number(e.election_frequency)||24,p=`${d} Month${d===1?"":"s"}`,f=e.name||"Unknown",c=e.flag_url||`assets/flags/${f}.png`,m=U?.status||null,v=m?m.charAt(0).toUpperCase()+m.slice(1):null;return`<div class="cf-election-header">
        <div class="cf-eh-left">
            <div class="cf-eh-label">&bull; ELECTIONS</div>
            ${v?`<div class="cf-eh-gov-status">GOVERNMENT STATUS: <span class="cf-eh-gov-status-value">${g(v)}</span></div>`:""}
            <div class="cf-eh-title-row">
                <img class="cf-eh-flag" src="${g(c)}" alt="${g(f)} flag" onerror="this.style.display='none'">
                <h2 class="cf-eh-title">Elections of ${g(f)}</h2>
            </div>
        </div>
        <div class="cf-eh-stats">
            ${t}
            <div class="cf-eh-stat">
                <div class="cf-eh-stat-label">TOTAL SEATS</div>
                <div class="cf-eh-stat-value">${s}</div>
                <div class="cf-eh-stat-label" style="margin-top:10px;">ELECTORAL FREQUENCY</div>
                <div class="cf-eh-stat-value cf-eh-stat-value--sm">${g(p)}</div>
            </div>
        </div>
    </div>`}function Se(){const e=u?.nation;if(!e||W(e))return"";const i=Number(e.total_seats)||0;if(i<=0)return"";const a=b.filter(c=>(c.seats||0)>0).slice().sort((c,m)=>(m.seats||0)-(c.seats||0)),o=a.reduce((c,m)=>c+(m.seats||0),0),r=Math.max(0,i-o),n=Math.ceil(i/2)+1,t=n/i*100,s=a.map(c=>{const m=(c.seats||0)/i*100,v=c.party_color||"var(--text-dim)";return`<div class="cf-em-seg" style="width:${m}%;background:${g(v)};" title="${g(c.faction_name)}: ${c.seats} seats"></div>`}).join(""),d=r>0?`<div class="cf-em-seg cf-em-seg--stake" style="width:${r/i*100}%;">
               <span class="cf-em-stake-label">${r} SEATS AT STAKE</span>
           </div>`:"",p=a.map(c=>{const m=c.party_color||"var(--text-dim)";return`<div class="cf-em-chip">
            <span class="cf-em-swatch" style="background:${g(m)};"></span>
            <span class="cf-em-chip-name">${g(c.faction_name)}</span>
            <span class="cf-em-chip-count">${c.seats}</span>
            <span class="cf-em-chip-unit">seats</span>
        </div>`}).join(""),f=r>0?`<div class="cf-em-chip">
               <span class="cf-em-swatch cf-em-swatch--stake"></span>
               <span class="cf-em-chip-name">At Stake</span>
               <span class="cf-em-chip-count">${r}</span>
               <span class="cf-em-chip-unit">seats</span>
           </div>`:"";return`<div class="cf-electoral-makeup">
        <div class="cf-em-header">
            <div class="cf-em-title">&#9642; ELECTORAL MAKEUP</div>
            <div class="cf-em-meta">MAJORITY AT <span class="cf-em-majority">${n} SEATS</span> &middot; ${i} TOTAL</div>
        </div>
        <div class="cf-em-bar">
            ${s}
            ${d}
            <div class="cf-em-majority-tick" style="left:${t.toFixed(2)}%;"></div>
        </div>
        <div class="cf-em-legend">
            ${p}
            ${f}
        </div>
    </div>`}const Te={Avelia:["Valeranza"],Calveth:["Auplandet","Borastadt","Cousheim","Folenberg"]};function Pe(){const e=u?.nation?.name;if(!e)return"";const i=[{key:"whole",label:e,file:`${e} Whole.png`}].concat((Te[e]||[]).map(s=>({key:s.toLowerCase().replace(/[^a-z0-9]+/g,"-"),label:s,file:`${e} ${s}.png`}))),a=i.map(s=>`#cf-nm-${s.key}:checked ~ .cf-nm-boxes label[for="cf-nm-${s.key}"]`).join(`,
      `),o=i.map(s=>`#cf-nm-${s.key}:checked ~ .cf-nm-stage .cf-nm-img-${s.key} { display: block; }`).join(`
      `),r=i.map((s,d)=>`<input type="radio" name="cf-nm" id="cf-nm-${s.key}" class="cf-nm-r"${d===0?" checked":""}>`).join(`
      `),n=i.map(s=>`<label class="cf-nm-box" for="cf-nm-${s.key}">${g(s.label)}</label>`).join(`
        `),t=i.map(s=>`<img class="cf-nm-img-${s.key}" src="${encodeURI(`assets/${s.file}`)}" alt="${g(s.label)} map" onerror="this.style.display='none'">`).join(`
        `);return`
    <style>
      .cf-nm-wrap { margin: 14px 0 0; }
      .cf-nm-r { position: absolute; opacity: 0; pointer-events: none; }
      .cf-nm-boxes { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; margin-bottom: 10px; }
      .cf-nm-box { font-family: var(--font-mono, monospace); font-size: 12px;
        font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
        color: var(--text-secondary, #888); border: 1px solid var(--border-1, rgba(255,255,255,0.08));
        background: var(--bg-2, #1a1a17); padding: 9px 18px; cursor: pointer; user-select: none; }
      .cf-nm-box:hover { color: var(--text-bright, #f0efe6); }
      ${a} {
        color: var(--accent, #d4b87a); border-color: var(--accent, #d4b87a); }
      .cf-nm-stage { border: 1px solid var(--border-1, rgba(255,255,255,0.12));
        background: var(--bg-2, #1a1a17); padding: 10px; }
      .cf-nm-stage img { display: none; max-width: 100%; height: auto; margin: 0 auto; }
      ${o}
    </style>
    <div class="cf-nm-wrap">
      ${r}
      <div class="cf-nm-boxes">
        ${n}
      </div>
      <div class="cf-nm-stage">
        ${t}
      </div>
    </div>`}async function L(e){if(!e)return;if(W(u.nation)){e.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#128081;</div>
                <div class="cf-no-title">Absolute Monarchy</div>
                <div class="cf-no-desc">The Crown rules by decree. There are no elections.</div>
            </div>
        </div>`;return}const i=ke(),a=l=>l?`<div class="cf-makeup-row">
               <div class="cf-makeup-left"></div>
               <div class="cf-makeup-right">${l}</div>
           </div>`:"",o=a(Se())+a(Pe());if(Q(u.nation)){const l=ue(u.nation);e.innerHTML=`${i}${o}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#127979;</div>
                <div class="cf-no-title">${l?"Semi-Presidential System":"Presidential System"}</div>
                <div class="cf-no-desc">${l?"The President nominates a Prime Minister for parliamentary confirmation. The PM then appoints cabinet ministers. No coalition formation is required.":"The President governs directly and nominates cabinet ministers. No coalition formation is required."}</div>
            </div>
        </div>`;return}if(!B){if(U&&!fe&&!Q(u.nation)){const w=u.faction?.id,T=(Array.isArray(U.party_ids)?U.party_ids:[]).includes(w);e.innerHTML=`${i}${o}
            <div class="cf-page">
                <div class="cf-no-formation">
                    <div class="cf-no-icon" style="color:var(--accent);">!</div>
                    <div class="cf-no-title">Prime Minister Vacant</div>
                    <div class="cf-no-desc">A coalition exists, but no Prime Minister is seated. ${T?"Use <strong>Actions → Leadership Challenge</strong> to claim the Premiership for your party leader; it resolves on the next tick.":"Only coalition members can use <strong>Leadership Challenge</strong> to fill the vacancy."}</div>
                </div>
            </div>`;return}e.innerHTML=`${i}${o}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">✓</div>
                <div class="cf-no-title">Government Formed</div>
                <div class="cf-no-desc">A coalition government is currently active with a seated Prime Minister. No formation needed.</div>
            </div>
        </div>`;return}if(!H){const l=Z[0]?.election_tick,w=l!=null?Math.max(0,l-Y):"?";e.innerHTML=`${i}${o}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon" style="font-size:2rem;">&#9878;</div>
                <div class="cf-no-title">No Government</div>
                <div class="cf-no-desc">No election has been held yet. The first election is in <strong style="color:var(--accent);">${w}</strong> tick${w!==1?"s":""}.</div>
            </div>
        </div>`;return}await pe();const r=u.faction,n=se!==null?Math.max(0,Y-se):0,t=Math.max(0,ce-n),s=Math.min(100,n/ce*100),d=n*2;let p="safe";t<=1?p="critical":t<=2&&(p="warning");const f=p==="critical"?"⚠️":p==="warning"?"⏳":"🤝",c=p==="critical"?"No Government — Snap Election Imminent":p==="warning"?"Coalition Formation — Time Running Out":"Coalition Formation In Progress",m=p==="critical"?"Form a government immediately or face snap elections":p==="warning"?"Parties are negotiating — the deadline is approaching":"Parties are negotiating a coalition — propose or join one below",v=b.find(l=>l.id===r.id)?.seats||0,y=v>0,h=M.find(l=>l.proposed_by===r.id)||null,I=!!h,A=!!h&&V===h.id;let O="";if(!y)O='<div class="cf-note">Your party has <strong>0 seats</strong>. You cannot propose a coalition, but you may be invited to one.</div>';else if(I&&!A)O='<div class="cf-note">You have already submitted a proposal for this election. Use <strong>Edit Proposal</strong> on your card below to change the membership.</div>';else{const l=new Set($),w=_=>(_||[]).map(k=>k.replace(/_/g," ")).join(", "),F=b.map(_=>{const k=_.id===r.id,z=k||l.has(_.id),ie=_.seats||0,X=_.party_color||"#888",J=(ae[_.id]||[]).map(S=>_e.find(ne=>ne.id===S)).filter(Boolean).map(S=>`<div class="cf-platform">
                <span class="cf-platform-label"><span class="cf-platform-icon">${S.icon}</span> ${g(S.name)}</span>
                <span class="cf-platform-stats">
                    <span class="cf-stat-up">&uarr; ${w(S.improve)}</span>
                    <span class="cf-stat-down">&darr; ${w(S.worsen)}</span>
                </span>
            </div>`).join(""),R=J?`<div class="cf-check-platforms">${J}</div>`:'<div class="cf-check-platforms cf-check-platforms--empty">No adopted platforms.</div>',N=le(_);return`<div class="cf-party-check ${z?"checked":""} ${k?"disabled":""}" data-party-id="${_.id}" style="border-left:3px solid ${X};">
                <div class="cf-party-info">
                    <div class="cf-check-box">${z?"✓":""}</div>
                    <span class="cf-check-name">${g(_.faction_name)}</span>
                    ${N}
                    <span class="cf-check-seats">${ie} seats</span>
                </div>
                ${R}
            </div>`}).join(""),T=$.reduce((_,k)=>_+(b.find(z=>z.id===k)?.seats||0),0)||v,K=C?Math.round(T/C*100):0,G=A?"Edit Your Proposal":"Propose a Government",te=A?`Add or remove parties. Saving resets all support — every coalition member must re-vote, including you. You need ${x}+ seats for a majority.`:`Select which parties will form the coalition. You need ${x}+ seats for a majority.`,j=A?`<button class="cf-submit-btn" id="cf-save-edit-btn" data-formation-id="${h.id}">Save Changes</button>
               <button class="cf-submit-btn" id="cf-cancel-edit-btn" style="background:var(--bg-body);color:var(--text-dim);margin-left:8px;">Cancel</button>`:'<button class="cf-submit-btn" id="cf-propose-btn">Submit Proposal</button>';O=`
            <div class="cf-propose-section">
                <div class="cf-section-title">${G}</div>
                <div class="cf-section-desc">${te}</div>
                <div class="cf-party-grid" id="cf-party-grid">${F}</div>
                <div class="cf-seat-preview" id="cf-seat-preview">
                    Coalition seats: <span class="cf-preview-val" id="cf-preview-seats">${T}</span> / ${C}
                    (<span id="cf-preview-pct">${K}</span>%)
                    <span id="cf-preview-threshold" style="margin-left:8px;color:var(--text-dim);">— needs ${x} seats</span>
                </div>
                ${j}
            </div>`}const ee=M.length>0?`
        <div class="cf-section-title" style="margin-top:16px;">Active Proposals</div>
        <div class="cf-proposals-grid">${M.map(l=>{const w=b.find(R=>R.id===l.proposed_by),F=l.party_ids||[],T=F.reduce((R,N)=>R+(b.find(S=>S.id===N)?.seats||0),0),K=C?Math.round(T/C*100):0,G=T>=x,te=F.map(R=>{const N=b.find(ne=>ne.id===R),S=le(N);return`<span class="cf-party-chip" style="border-left:2px solid ${N?.party_color||"#888"};">${g(N?.faction_name||"?")} · ${N?.seats||0}${S?" "+S:""}</span>`}).join("");let j="";l.iAmSupporting?j='<span class="cf-status cf-status--supporting">✓ SUPPORTING</span>':l.iAmInvited?j='<span class="cf-status cf-status--invited">INVITED</span>':j='<span class="cf-status cf-status--locked">NOT INVITED</span>';const _=l.iAmInvited&&!l.iAmSupporting?`<button class="cf-support-btn" data-formation-id="${l.id}" data-action="support">Support This Coalition</button>`:l.iAmSupporting?`<button class="cf-withdraw-btn" data-formation-id="${l.id}" data-action="withdraw">Withdraw Support</button>`:"",k=l.supportCount>=l.coalitionSize,ie=l.proposed_by===r.id&&!k&&V!==l.id?`<button class="cf-edit-btn" data-formation-id="${l.id}" data-action="edit" style="margin-left:8px;background:var(--bg-body);color:var(--accent);border:1px solid var(--accent);padding:4px 10px;font-family:var(--font-mono);font-size:9px;cursor:pointer;">Edit</button>`:"",X=D===l.id,re=k&&l.iAmInvited&&!X,J=k&&X;return`<div class="cf-proposal-card ${l.iAmSupporting?"supporting":""} ${l.iAmInvited?"":"not-invited"}">
                <div class="cf-proposal-title">${g(w?.faction_name||"Unknown")} Coalition ${j}${ie}</div>
                <div class="cf-proposal-seats">Seats: <span style="color:${G?"var(--green)":"var(--red)"};">${T}</span> (${K}%) ${G?"✓":"— below threshold"}</div>
                <div class="cf-proposal-chips">${te}</div>
                <div class="cf-proposal-support">Support: ${l.supportCount} / ${l.coalitionSize} coalition members ${k?'<span style="color:var(--green);font-weight:700;"> — UNANIMOUS</span>':""}</div>
                ${_}
                ${re?`<button class="cf-support-btn" data-formation-id="${l.id}" data-action="configure" style="margin-top:6px;background:var(--green);color:#000;border-color:var(--green);">Configure Government &amp; Assign Ministries</button>`:""}
                ${J?Ie(l):""}
            </div>`}).join("")}</div>
    `:"";e.innerHTML=`${i}${o}
    <div class="cf-page">
        <!-- Formation Banner -->
        <div class="cf-banner cf-banner--${p}">
            <div class="cf-banner-header">
                <span class="cf-banner-icon">${f}</span>
                <div>
                    <div class="cf-banner-title">${c}</div>
                    <div class="cf-banner-subtitle">${m}</div>
                </div>
            </div>
            <div class="cf-countdown">
                <div class="cf-countdown-track"><div class="cf-countdown-fill cf-countdown-fill--${p}" style="width:${s}%;"></div></div>
                <div class="cf-countdown-text">${t>0?t+" tick"+(t!==1?"s":"")+" remaining":"⚡ SNAP ELECTION IMMINENT"}</div>
            </div>
            <div class="cf-penalties">
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--red);">-2%</div>
                    <div class="cf-penalty-label">Approval / Tick</div>
                </div>
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--orange);">${n}</div>
                    <div class="cf-penalty-label">Ticks Elapsed</div>
                </div>
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--red);">-${d}%</div>
                    <div class="cf-penalty-label">Total Lost</div>
                </div>
            </div>
        </div>

        ${O}
        ${ee}
    </div>`,A||($=[r.id]),Ae(e)}const Ee={prime_minister:"Prime Minister",interior:"Interior",foreign:"Foreign Affairs",defense:"Defense",finance:"Finance",education:"Education",healthcare:"Healthcare",labor:"Labor",justice:"Justice",trade:"Trade",energy:"Energy",transportation:"Transportation",sports:"Sports",security:"Security"};function Ie(e){const i=(e.party_ids||[]).map(f=>b.find(c=>c.id===f)).filter(Boolean),a=W(u.nation)?b:i,o=(e.party_ids||[]).includes(u.faction?.id);P={...e.ministry_assignments||{}};const n=u.faction?.id,t=P.prime_minister,s=t===n;let d=`<div style="padding:12px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--accent);margin-bottom:10px;">CONFIGURE GOVERNMENT</div>
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:12px;">All coalition members can assign ministries. The party selected as Prime Minister clicks Form Government.</div>`;for(const f of ve){const c=Ee[f]||f,m=f==="prime_minister",v=P[f];o&&(d+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="width:140px;font-family:var(--font-mono);font-size:10px;font-weight:${m?"700":"400"};color:${m?"var(--accent)":"var(--text-secondary)"};letter-spacing:0.5px;">${c}</span>
                <select data-ministry="${f}" class="cf-ministry-select" style="flex:1;padding:4px 8px;font-family:var(--font-mono);font-size:10px;color:var(--text-bright);background:var(--bg-body);border:1px solid var(--border-main);outline:none;">
                    <option value="">— Select Party —</option>
                    ${a.map(y=>`<option value="${y.id}" ${v===y.id?"selected":""}>${g(y.faction_name)} (${y.seats||0} seats)</option>`).join("")}
                </select>
            </div>`)}const p=!!P.prime_minister;if(p&&s)d+=`<div style="margin-top:14px;display:flex;justify-content:flex-end;">
            <button id="cf-form-gov-btn" style="padding:10px 28px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1.5px;color:#000;background:var(--green);border:1px solid var(--green);cursor:pointer;">FORM GOVERNMENT</button>
        </div>`;else if(p&&!s){const f=a.find(c=>c.id===t);d+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(92,204,92,0.04);border:1px solid rgba(92,204,92,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Waiting for <span style="color:var(--green);font-weight:700;">${g(f?.faction_name||"PM party")}</span> to click Form Government.
        </div>`}else d+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Select a Prime Minister to enable government formation.
        </div>`;return d+="</div>",d}async function Ce(e,i){if(oe)return;if(!P.prime_minister){alert("You must assign a Prime Minister first.");return}oe=!0;const o=document.getElementById("cf-form-gov-btn");o&&(o.disabled=!0,o.textContent="FORMING...");try{await Me({supabase:E,formationId:e.id,callerFactionId:u.faction.id,nation:u.nation,ministryAssignments:P}),B=!1,alert("Government formed successfully!"),await L(i)}catch(r){console.error("[Coalition] Form government failed:",r),alert("Failed to form government: "+(r.message||r))}finally{oe=!1,o&&(o.disabled=!1,o.textContent="FORM GOVERNMENT")}}async function Me({supabase:e,formationId:i,callerFactionId:a,nation:o,ministryAssignments:r,ministerNames:n=null}){if(!e||!i||!a||!o||!r)throw new Error("formGovernment: missing required arg");if(!n){const f=he(o?.name)||{},c=f.firstNames||["Alex","Maria","Carlos"],m=f.lastNames||["Garcia","Torres","Silva"];n={};for(const[v,y]of Object.entries(r))y&&(n[v]={first_name:c[Math.floor(Math.random()*c.length)],last_name:m[Math.floor(Math.random()*m.length)],age:35+Math.floor(Math.random()*25)})}const{error:t}=await e.from("government_formations").update({ministry_assignments:r,minister_names:n}).eq("id",i);if(t)throw new Error("Failed to save assignments: "+t.message);const s={};for(const[f,c]of Object.entries(r))c&&(s[f]=ge(f,o));const{data:d,error:p}=await e.rpc("finalize_government_formation",{p_formation_id:i,p_caller_faction_id:a,p_ministry_baselines:s});if(p)throw p;if(d?.error)throw new Error(d.error);return d}async function pe(){if(!H){M=[];return}const{data:e}=await E.from("government_formations").select("*").eq("election_id",H).eq("status","active").order("created_at",{ascending:!0}),i=[];for(const a of e||[]){const{data:o}=await E.from("government_formation_support").select("faction_id, supports").eq("formation_id",a.id),r=a.party_ids||[],t=(o||[]).filter(c=>r.includes(c.faction_id)).filter(c=>c.supports).length,s=r.length,p=(o||[]).find(c=>c.faction_id===u.faction?.id)?.supports===!0,f=r.includes(u.faction?.id);i.push({...a,supportCount:t,coalitionSize:s,iAmSupporting:p,iAmInvited:f})}M=i}let de=!1;function Ae(e){de||(de=!0,e.addEventListener("click",async i=>{const a=i.target.closest(".cf-party-check:not(.disabled)");if(a){const n=a.dataset.partyId,s=b.find(f=>f.id===n)?.bloc_id||null,d=!$.includes(n),p=s?b.filter(f=>f.bloc_id===s).map(f=>f.id):[n];for(const f of p){const c=$.indexOf(f);d&&c===-1&&$.push(f),!d&&c>-1&&$.splice(c,1);const m=e.querySelector(`.cf-party-check[data-party-id="${f}"]`);if(!m)continue;m.classList.toggle("checked",d);const v=m.querySelector(".cf-check-box");v&&(v.textContent=d?"✓":"")}Ne();return}if(i.target.closest("#cf-propose-btn")){await Fe(e);return}const o=i.target.closest(".cf-edit-btn");if(o&&o.dataset.action==="edit"){const n=o.dataset.formationId,t=M.find(s=>s.id===n);t&&t.proposed_by===u.faction?.id&&(V=n,$=[...t.party_ids||[]],await L(e));return}if(i.target.closest("#cf-save-edit-btn")){const n=i.target.closest("#cf-save-edit-btn").dataset.formationId;await Re(n,e);return}if(i.target.closest("#cf-cancel-edit-btn")){V=null,$=[u.faction?.id].filter(Boolean),await L(e);return}const r=i.target.closest(".cf-support-btn, .cf-withdraw-btn");if(r){const n=r.dataset.formationId,t=r.dataset.action;if(t==="configure"){D=n;const s=M.find(d=>d.id===n);s&&(P={...s.ministry_assignments||{}}),await L(e)}else await Le(n,t==="support",e);return}if(i.target.closest("#cf-form-gov-btn")){const n=M.find(t=>t.id===D);n&&await Ce(n,e);return}}),e.addEventListener("change",i=>{const a=i.target.closest(".cf-ministry-select");if(!a)return;const o=a.dataset.ministry,r=a.value||null;P[o]=r,D&&E.from("government_formations").update({ministry_assignments:P}).eq("id",D).then(({error:t})=>{t&&console.warn("[Coalition] Failed to save assignment:",t.message)});const n=document.getElementById("cf-form-gov-btn");if(n){const t=!!P.prime_minister;n.disabled=!t,n.style.color=t?"#000":"var(--text-dim)",n.style.background=t?"var(--green)":"var(--bg-body)",n.style.borderColor=t?"var(--green)":"var(--border-main)",n.style.cursor=t?"pointer":"not-allowed"}}))}function Ne(){const e=document.getElementById("cf-preview-seats"),i=document.getElementById("cf-preview-pct"),a=document.getElementById("cf-preview-threshold");if(!e)return;const o=$.reduce((t,s)=>t+(b.find(d=>d.id===s)?.seats||0),0),r=C?Math.round(o/C*100):0,n=o>=x;e.textContent=o,e.style.color=n?"var(--green)":"var(--text-bright)",i.textContent=r,a.textContent=n?`✓ Meets ${x}-seat threshold`:`— needs ${x} seats`,a.style.color=n?"var(--green)":"var(--text-dim)"}async function Fe(e){if(q)return;const i=u.faction;if((b.find(t=>t.id===i.id)?.seats||0)===0)return;const o=[...new Set($)],r=o.reduce((t,s)=>t+(b.find(d=>d.id===s)?.seats||0),0);if(r<x){alert(`Coalition needs ${x} seats. Currently: ${r}.`);return}q=!0;const n=document.getElementById("cf-propose-btn");n&&(n.disabled=!0,n.textContent="Submitting...");try{const{data:t}=await E.from("shard").select("current_date").eq("name","Alpha Shard").single(),{data:s,error:d}=await E.from("government_formations").insert({nation_id:u.nation.id,election_id:H,proposed_by:i.id,party_ids:o,status:"active",game_year:t?.current_date||""}).select().single();if(d){alert("Error: "+d.message);return}const{error:p}=await E.from("government_formation_support").upsert({formation_id:s.id,faction_id:i.id,supports:!0},{onConflict:"formation_id,faction_id"});p&&console.warn("[Coalition] Auto-support insert failed:",p.message),await L(e)}catch(t){console.error("[Coalition] Create proposal error:",t),alert("Failed to create proposal: "+(t.message||t))}finally{q=!1}}async function Re(e,i){if(q||!u.faction)return;const o=[...new Set($)],r=o.reduce((t,s)=>t+(b.find(d=>d.id===s)?.seats||0),0);if(r<x){alert(`Coalition needs ${x} seats. Currently: ${r}.`);return}q=!0;const n=document.getElementById("cf-save-edit-btn");n&&(n.disabled=!0,n.textContent="Saving...");try{const{data:t,error:s}=await E.rpc("update_coalition_proposal",{p_formation_id:e,p_party_ids:o});if(s){alert("Failed to save changes: "+s.message);return}if(t&&t.success===!1){alert("Failed to save changes: "+(t.error||"unknown"));return}V=null,await L(i)}catch(t){console.error("[Coalition] Update proposal error:",t),alert("Failed to save changes: "+(t.message||t))}finally{q=!1}}async function Le(e,i,a){try{const{error:o}=await E.from("government_formation_support").upsert({formation_id:e,faction_id:u.faction?.id,supports:i},{onConflict:"formation_id,faction_id"});o&&console.error("[Coalition] Toggle support error:",o.message),await L(a)}catch(o){console.error("[Coalition] Toggle support error:",o)}}export{we as B,_e as P,Ue as S,Me as a,Ye as b,De as f,Ve as i,L as r,He as s};
