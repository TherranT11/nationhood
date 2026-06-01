import{GAME_CONFIG as ge,FORMATION_DEADLINE_TICKS as fe}from"./config-BER7HlcX.js";import{a as Z,h as ie,b as he,n as ye}from"./government-types-BeJIFjWQ.js";import{b as be}from"./stats-C5reUrev.js";import{g as _e}from"./political-actions-gAjzq9PT.js";import{f as we}from"./government-structure-DBjJ7E-l.js";import{t as xe}from"./utils-CzgKGX6o.js";async function He(e,o){const{faction:a,nation:n,pmFactionId:c,pmLastName:i,isSemiPres:t,tick:d,mySeats:p}=o;if(!a?.id||!n?.id||!c)return{ok:!1,error:"Missing required arguments (faction, nation, or PM party id)."};const{data:u}=await e.from("nations").select("government_type, hos_election_method").eq("id",n.id).maybeSingle();if(Z(u))return{ok:!1,error:"No-confidence motions cannot be filed under absolute monarchy. Only the Monarch can dismiss the Prime Minister."};const m=i?t?`Motion of No Confidence in PM ${i}`:`Motion of No Confidence in the ${i} Government`:"Motion of No Confidence in the Government",l=t?`This motion, filed by the ${a.faction_name}, calls for a vote of no confidence in the Prime Minister. If passed by simple majority, the PM will be removed and the President must nominate a replacement.`:`This motion, filed by the ${a.faction_name}, calls for a vote of no confidence in the current government. If passed by simple majority, the coalition will be immediately dissolved.`,{data:f,error:h}=await e.from("bills").insert({nation_id:n.id,proposed_by:a.id,proposed_tick:d,bill_name:m,bill_type:"no_confidence",status:"floor",floor_tick:d,voting_ends_tick:d+ge.NO_CONFIDENCE_VOTING_TICKS,proposer_name:a.faction_name,proposer_color:a.party_color,preamble:l}).select("id").single();if(h)return{ok:!1,error:h.message};const{count:y}=await e.from("bills").select("id",{count:"exact",head:!0}).eq("nation_id",n.id).eq("bill_type","no_confidence").in("status",["committee","floor"]);if((y??0)>1)return await e.from("bills").delete().eq("id",f.id),{ok:!1,error:"Another motion of no confidence was just filed. Please refresh."};const{error:_}=await e.from("bill_support").upsert({bill_id:f.id,faction_id:a.id,stance:"yes",seat_count:Number(p)||0},{onConflict:"bill_id,faction_id"});_&&console.warn("[no_confidence] auto-vote upsert failed (non-fatal, motion still filed):",_.message);const{error:T}=await e.from("campaign_actions").insert({party_id:a.id,nation_id:n.id,target_id:c,action_type:"no_confidence_filed",ap_cost:0,money_cost:0,tick_performed:d,result:{bill_id:f.id,pm_last_name:i||null}});return T&&console.warn("[no_confidence] cooldown insert failed (motion still filed; next file may slip past cooldown):",T.message),{ok:!0,billId:f.id,motionName:m}}const $e=[{id:"economic_reform",name:"Economic Reform",icon:"📈",tagline:"Growth-first neoliberal agenda",desc:"Prioritize GDP, attract foreign capital, lower corporate taxes. The rising tide theory — grow the pie and worry about slicing it later.",improve:["gdp_growth","gdp","service_sector","industry","global_image"],worsen:["wages","standard_of_living","income_tax","corporate_tax"],tradeoff:"Income inequality tends to rise. Working class sees GDP numbers go up while their wages don't."},{id:"social_justice",name:"Social Justice",icon:"⚖️",tagline:"Redistribution and equity",desc:"Raise minimum wage, expand welfare, progressive taxation. Close the gap between rich and poor through direct intervention.",improve:["wages","standard_of_living","health","public_approval","corporate_tax"],worsen:["gdp_growth","global_image","budget"],tradeoff:"Capital flight risk. Foreign investors avoid high-tax environments. Growth may slow."},{id:"national_security",name:"National Security",icon:"🛡️",tagline:"Borders, military, order",desc:"Strengthen defense, tighten borders, expand police powers. Safety through strength.",improve:["state_apparatus","crime","unrest"],worsen:["immigration","public_approval","corruption"],tradeoff:"Freedom drops. Minority communities disproportionately affected. International criticism."},{id:"anti_corruption",name:"Anti-Corruption",icon:"🔍",tagline:"Clean government, institutional reform",desc:"Independent judiciary, transparent budgets, prosecute the connected. Popular with voters but powerful people fight back hard.",improve:["corruption","state_apparatus","public_approval"],worsen:["unrest","gdp_growth"],tradeoff:"Short-term chaos as exposing corruption shakes institutions. Your own party's skeletons may surface."},{id:"green_transition",name:"Green Transition",icon:"🌱",tagline:"Climate and environment",desc:"Renewable energy investment, carbon taxes, emissions targets. Save the planet — but the bill comes due now, not later.",improve:["energy","health","education"],worsen:["gdp_growth","industry","cost_of_living"],tradeoff:"Energy costs spike during transition. Rural and industrial voters feel abandoned."},{id:"industrialization",name:"Industrialization",icon:"🏭",tagline:"Factories, exports, production",desc:"Build manufacturing capacity, create blue-collar jobs, develop physical infrastructure. The backbone of a real economy.",improve:["industry","unskilled_workers","infrastructure","gdp","gdp_growth"],worsen:["health","farmland"],tradeoff:"Environment gets destroyed. Long-term health costs from industrial pollution."},{id:"digital_modernization",name:"Digital Modernization",icon:"💻",tagline:"Tech economy, connectivity",desc:"Fiber everywhere, tech sector incentives, digital government services. Leap into the future — but not everyone makes the jump.",improve:["infrastructure","service_sector","skilled_workers","education","state_apparatus"],worsen:["unskilled_workers","wages","cost_of_living"],tradeoff:"Automation displaces workers. Rural communities left behind. Tech wealth concentrates in cities."},{id:"welfare_state",name:"Welfare State",icon:"🏥",tagline:"Universal services, safety net",desc:"Free healthcare, free education, generous pensions, unemployment insurance. Cradle to grave — funded by steep taxes on everyone.",improve:["health","education","standard_of_living","public_approval","income_tax","corporate_tax"],worsen:["gdp_growth","debt","global_image"],tradeoff:"Massive fiscal cost. Tax burden on middle class, not just the rich. Sustainability questioned."},{id:"populist_nationalism",name:"Populist Nationalism",icon:"🇲",tagline:"The people vs. elites and outsiders",desc:"Restrict immigration, protect domestic industry, reject globalism. Our people first. Our jobs first. Our culture first.",improve:["industry","wages","unskilled_workers","public_approval"],worsen:["immigration","global_image","skilled_workers"],tradeoff:"International isolation. Brain drain as educated professionals emigrate. Deep social polarization."},{id:"free_market",name:"Free Market Liberalism",icon:"🏛️",tagline:"Deregulate everything",desc:"Cut taxes, cut red tape, let the market decide winners and losers. Government is the problem, not the solution.",improve:["gdp_growth","gdp","service_sector","global_image"],worsen:["wages","standard_of_living","income_tax","corporate_tax","health"],tradeoff:"Growth at the cost of the working class. Social safety net erodes. Boom-bust volatility."},{id:"law_and_order",name:"Law & Order",icon:"⚔️",tagline:"Tough on crime, strong institutions",desc:"More police, harsher sentences, zero tolerance. Restore order to the streets. Criminals fear the state.",improve:["crime","state_apparatus","unrest"],worsen:["public_approval","budget"],tradeoff:"Prison population explodes. Minority communities targeted. Policing costs balloon."},{id:"education_first",name:"Education First",icon:"🎓",tagline:"Human capital as the long game",desc:"Fund schools, universities, research institutions, teacher salaries. The 20-year bet that the next generation will be smarter and richer.",improve:["education","skilled_workers","public_approval","income_tax"],worsen:["budget","debt","gdp_growth"],tradeoff:"Voters don't see results before next election. Brain drain if jobs don't exist for graduates."},{id:"healthcare_reform",name:"Healthcare Reform",icon:"💊",tagline:"Fix the hospitals",desc:"More beds, more doctors, better drugs, universal coverage. Nobody dies because they can't afford treatment.",improve:["health","public_approval","standard_of_living","income_tax"],worsen:["budget","debt","cost_of_living"],tradeoff:"Pharmaceutical lobby fights back. Extremely expensive. Takes multiple cycles to show results."},{id:"housing_cost",name:"Housing & Cost of Living",icon:"🏠",tagline:"The kitchen-table platform",desc:"Rent controls, public housing, affordable food, price caps on essentials. People can't eat GDP growth.",improve:["cost_of_living","standard_of_living","infrastructure"],worsen:["gdp_growth","global_image","industry"],tradeoff:"Property owners and developers become your enemies. Market distortions create shortages."},{id:"energy_independence",name:"Energy Independence",icon:"⛽",tagline:"Control your own power supply",desc:"Exploit domestic oil, gas, and minerals. No more dependency on foreign energy. Cheap fuel, strong economy, sovereign power.",improve:["energy","minerals","industry","gdp_growth"],worsen:["health","farmland","global_image"],tradeoff:"Climate commitments broken. Green voters abandon you. Environmental debt for future generations."},{id:"open_society",name:"Open Society",icon:"🕊️",tagline:"Liberal democracy, civil liberties",desc:"Free press, open borders, multicultural embrace, strong civil rights. A beacon of freedom — and a target for those who fear it.",improve:["immigration","global_image","public_approval","education"],worsen:["unrest","state_apparatus","crime"],tradeoff:"Nationalist backlash. Rural-urban divide deepens. Security vulnerabilities from openness."}],Ye={gdp:"GDP",state_apparatus:"State Apparatus",public_approval:"Public Approval",unrest:"Unrest",crown_authority:"Crown Authority",budget:"Budget",debt:"Debt",energy:"Energy",health:"Health",education:"Education",global_image:"Global Image",infrastructure:"Infrastructure",industry:"Industry",farmland:"Farmland",standard_of_living:"Standard of Living",cost_of_living:"Cost of Living",gdp_growth:"GDP Growth",immigration:"Immigration",service_sector:"Service Sector",unskilled_workers:"Unskilled Workers",skilled_workers:"Skilled Workers",income_tax:"Income Tax",corporate_tax:"Corporate Tax",crime:"Crime",corruption:"Corruption",minerals:"Minerals",wages:"Wages"},ke=new Set(["unrest","debt","cost_of_living","crime","corruption"]),Se=new Set(["income_tax","corporate_tax"]);function Ve(e,o){const a=ke.has(e),n=Se.has(e);return o==="improve"?a?{arrow:"↓",color:"#5cc55c"}:n?{arrow:"↑",color:"#c84"}:{arrow:"↑",color:"#5cc55c"}:a?{arrow:"↑",color:"#c55"}:n?{arrow:"↓",color:"#5cc55c"}:{arrow:"↓",color:"#c55"}}const We={adoptTenths:3,failTenths:-5};let S=null,v=null,U=!1,X=null,x=[],L=[],R=0,ce={},oe=[],K=null,ue=null,E=0,le=null,J=0,P=[],H=!1,W=null,Q=null,F={},re=!1;const Te=4;function pe(e){const o=Number(e?.last_seen_tick)||0;if(!o)return"";const a=J-o;return a<Te?"":`<span class="cf-inactive">[Inactive – ${a} tick${a!==1?"s":""}]</span>`}function g(e){if(!e)return"";const o=document.createElement("div");return o.textContent=e,o.innerHTML}async function Ke(e,o){S=e,v=o;const a=o.nation,n=o.faction;if(!a||!n)return{needed:!1};const[c,i,t,d,p,u,m]=await Promise.all([e.from("elections").select("id, election_type, election_tick, status").eq("nation_id",a.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),e.from("shard").select("current_tick").eq("name","Alpha Shard").single(),we(e,a.id),e.from("factions").select("id, faction_name, abbreviation, party_color, seats, bloc_id, last_seen_tick").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),e.from("elections").select("election_tick, election_type").eq("nation_id",a.id).eq("status","scheduled").order("election_tick",{ascending:!0}),e.from("faction_platforms").select("faction_id, platform_key, slot").eq("nation_id",a.id).eq("status","active").order("slot",{ascending:!0}),e.from("head_of_government").select("id, faction_id, first_name, last_name, active").eq("nation_id",a.id).eq("active",!0).maybeSingle()]);J=i.data?.current_tick??0,x=d.data||[],R=x.reduce((y,_)=>y+(_.seats||0),0),E=Math.ceil(R/2)+1,oe=p?.data||[],K=t||null,ue=m?.data||null,ce={},u?.error&&console.warn("[CoalitionFormation] faction_platforms query failed:",u.error.message);for(const y of u?.data||[])(ce[y.faction_id]||=[]).push(y.platform_key);const l=c.data,h=!!(t||null);if(ie(a))return U=!1,{needed:!1};if(l&&(X=l.id,le=l.election_tick),l&&!h)U=!0;else{const y=t?.formation_type==="emergency_minority"&&Array.isArray(t.party_ids)&&t.party_ids.includes(n.id);let _=!1;l&&(await ve(),_=(L||[]).some(T=>T.iAmInvited)),U=!h||y||_}return{needed:U}}function Pe(){const e=v?.nation;if(!e||Z(e))return"";const o=ie(e),a=Number(J)||0,n=oe.find(_=>_.election_type==="parliamentary")||null,c=oe.find(_=>_.election_type==="presidential")||null;function i(_,T,B,G,Y){if(!T)return`<div class="cf-eh-stat-label">${_}</div>
                <div class="cf-eh-stat-value cf-eh-stat-value--accent">TBD</div>`;const r=T.election_tick,b=Math.max(0,r-a),w=`${b} Month${b===1?"":"s"}`,s=xe(r),I=B&&B.election_tick===r?G:Y;return`<div class="cf-eh-stat-label">${_}</div>
            <div class="cf-eh-stat-value cf-eh-stat-value--accent">${g(s)}</div>
            <div class="cf-eh-stat-sub">${g(w)}</div>
            <div class="cf-eh-stat-sub">${g(I)}</div>`}let t;o?t=`<div class="cf-eh-stat">
            ${i("NEXT GENERAL ELECTION",n,c,"Parliament + Presidential","Parliament only (Midterm)")}
            <div style="margin-top:14px;border-top:1px solid var(--border-main);padding-top:12px;"></div>
            ${i("NEXT PRESIDENTIAL ELECTION",c,n,"Paired with general","Standalone")}
        </div>`:t=`<div class="cf-eh-stat">
            ${i("NEXT ELECTION",n,null,"Parliamentary","Parliamentary")}
        </div>`;const d=Number(e.total_seats)||0,p=Number(e.parliamentary_term_ticks)||Number(e.election_frequency)||24,u=`${p} Month${p===1?"":"s"}`,m=e.name||"Unknown",l=e.flag_url||`assets/flags/${m}.png`,f=K?.status||null,h=f?f.charAt(0).toUpperCase()+f.slice(1):null;return`<div class="cf-election-header">
        <div class="cf-eh-left">
            <div class="cf-eh-label">&bull; ELECTIONS</div>
            ${h?`<div class="cf-eh-gov-status">GOVERNMENT STATUS: <span class="cf-eh-gov-status-value">${g(h)}</span></div>`:""}
            <div class="cf-eh-title-row">
                <img class="cf-eh-flag" src="${g(l)}" alt="${g(m)} flag" onerror="this.style.display='none'">
                <h2 class="cf-eh-title">Elections of ${g(m)}</h2>
            </div>
        </div>
        <div class="cf-eh-stats">
            ${t}
            <div class="cf-eh-stat">
                <div class="cf-eh-stat-label">TOTAL SEATS</div>
                <div class="cf-eh-stat-value">${d}</div>
                <div class="cf-eh-stat-label" style="margin-top:10px;">ELECTORAL FREQUENCY</div>
                <div class="cf-eh-stat-value cf-eh-stat-value--sm">${g(u)}</div>
            </div>
        </div>
    </div>`}function Ee(){const e=v?.nation;if(!e||Z(e))return"";const o=Number(e.total_seats)||0;if(o<=0)return"";const a=x.filter(l=>(l.seats||0)>0).slice().sort((l,f)=>(f.seats||0)-(l.seats||0)),n=a.reduce((l,f)=>l+(f.seats||0),0),c=Math.max(0,o-n),i=Math.ceil(o/2)+1,t=i/o*100,d=a.map(l=>{const f=(l.seats||0)/o*100,h=l.party_color||"var(--text-dim)";return`<div class="cf-em-seg" style="width:${f}%;background:${g(h)};" title="${g(l.faction_name)}: ${l.seats} seats"></div>`}).join(""),p=c>0?`<div class="cf-em-seg cf-em-seg--stake" style="width:${c/o*100}%;">
               <span class="cf-em-stake-label">${c} SEATS AT STAKE</span>
           </div>`:"",u=a.map(l=>{const f=l.party_color||"var(--text-dim)";return`<div class="cf-em-chip">
            <span class="cf-em-swatch" style="background:${g(f)};"></span>
            <span class="cf-em-chip-name">${g(l.faction_name)}</span>
            <span class="cf-em-chip-count">${l.seats}</span>
            <span class="cf-em-chip-unit">seats</span>
        </div>`}).join(""),m=c>0?`<div class="cf-em-chip">
               <span class="cf-em-swatch cf-em-swatch--stake"></span>
               <span class="cf-em-chip-name">At Stake</span>
               <span class="cf-em-chip-count">${c}</span>
               <span class="cf-em-chip-unit">seats</span>
           </div>`:"";return`<div class="cf-electoral-makeup">
        <div class="cf-em-header">
            <div class="cf-em-title">&#9642; ELECTORAL MAKEUP</div>
            <div class="cf-em-meta">MAJORITY AT <span class="cf-em-majority">${i} SEATS</span> &middot; ${o} TOTAL</div>
        </div>
        <div class="cf-em-bar">
            ${d}
            ${p}
            <div class="cf-em-majority-tick" style="left:${t.toFixed(2)}%;"></div>
        </div>
        <div class="cf-em-legend">
            ${u}
            ${m}
        </div>
    </div>`}function Ie(e=[],o=[],a={}){const n=v?.nation?.name;if(!n)return"";const c=new Set(["whole"]),i=[{key:"whole",label:n,file:`${n} Whole.png`,whole:!0}].concat((o||[]).map(r=>{let b=(r.name||"").toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"")||"prov",w=b,s=2;for(;c.has(w);)w=`${b}-${s++}`;return c.add(w),{key:w,label:r.name,file:`${n} ${r.name}.png`,whole:!1,id:r.id}})),t=i.map(r=>`#cf-nm-${r.key}:checked ~ .cf-makeup-right .cf-nm-box[for="cf-nm-${r.key}"]`).join(`,
      `),d=i.map(r=>`#cf-nm-${r.key}:checked ~ .cf-makeup-right .cf-nm-img-${r.key} { display: block; }`).join(`
      `),p=i.map(r=>`#cf-nm-${r.key}:checked ~ .cf-makeup-left .cf-sec-${r.key} { display: block; }`).join(`
      `),u=i.map((r,b)=>`<input type="radio" name="cf-nm" id="cf-nm-${r.key}" class="cf-nm-r"${b===0?" checked":""}>`).join(`
      `),m=i.map(r=>`<label class="cf-nm-box" for="cf-nm-${r.key}">${g(r.label)}</label>`).join(`
        `),l=i.map(r=>`<img class="cf-nm-img-${r.key}" src="${encodeURI(`assets/${r.file}`)}" alt="${g(r.label)} map" onerror="this.style.display='none'">`).join(`
        `),f=e||[],h=o||[],y=(r,b)=>{const w=a?.[`${r}|${b}`];return Number.isFinite(w)?w:0},_=f.reduce((r,b)=>r+(Number(b.weight)||0),0),T=h.length>0&&f.some(r=>h.reduce((b,w)=>b+y(w.id,r.id),0)!==(Number(r.weight)||0)),B=f.length?f.map(r=>`<div class="cf-sec-row"><span class="cf-sec-nm">${g(r.name)}</span><span class="cf-sec-wt">${Number(r.weight)||0}</span></div>`).join("")+`<div class="cf-sec-row cf-sec-total"><span class="cf-sec-nm">Total Weight</span><span class="cf-sec-wt">${_}</span></div>`+(T?`<div class="cf-sec-row cf-sec-warn"><span class="cf-sec-nm">&#9888; Provinces don't sum to nation weight</span><span class="cf-sec-wt">rebalance</span></div>`:""):'<div class="cf-sec-empty">No sectors configured for this nation.</div>',G=r=>{if(!f.length)return'<div class="cf-sec-empty">No sectors configured for this nation.</div>';const b=f.reduce((w,s)=>w+y(r.id,s.id),0);return f.map(w=>`<div class="cf-sec-row"><span class="cf-sec-nm">${g(w.name)}</span><span class="cf-sec-wt">${y(r.id,w.id)}</span></div>`).join("")+`<div class="cf-sec-row cf-sec-total"><span class="cf-sec-nm">Province Total</span><span class="cf-sec-wt">${b}</span></div>`},Y=i.map(r=>`<div class="cf-sec cf-sec-${r.key}">
           <div class="cf-sec-head">Sectors — ${g(r.label)}</div>
           ${r.whole?B:G(r)}
         </div>`).join("");return`
    <style>
      .cf-nm-r { position: absolute; opacity: 0; pointer-events: none; }
      .cf-nm-wrap { margin: 14px 0 0; }
      .cf-nm-boxes { display: flex; flex-wrap: wrap; justify-content: flex-end; gap: 10px; margin-bottom: 10px; }
      .cf-nm-box { font-family: var(--font-mono, monospace); font-size: 12px;
        font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase;
        color: var(--text-secondary, #888); border: 1px solid var(--border-1, rgba(255,255,255,0.08));
        background: var(--bg-2, #1a1a17); padding: 9px 18px; cursor: pointer; user-select: none; }
      .cf-nm-box:hover { color: var(--text-bright, #f0efe6); }
      ${t} {
        color: var(--accent, #d4b87a); border-color: var(--accent, #d4b87a); }
      .cf-nm-stage { border: 1px solid var(--border-1, rgba(255,255,255,0.12));
        background: var(--bg-2, #1a1a17); padding: 10px; }
      .cf-nm-stage img { display: none; max-width: 100%; height: auto; margin: 0 auto; }
      ${d}
      .cf-sec { display: none; margin: 14px 0 0;
        border: 1px solid var(--border-1, rgba(255,255,255,0.12));
        background: var(--bg-2, #1a1a17); }
      .cf-sec-head { font-family: var(--font-mono, monospace); font-size: 11px;
        font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase;
        color: var(--accent, #d4b87a); padding: 10px 12px;
        border-bottom: 1px solid var(--border-1, rgba(255,255,255,0.1)); }
      .cf-sec-row { display: flex; justify-content: space-between; gap: 10px;
        padding: 7px 12px; font-family: var(--font-mono, monospace); font-size: 12px;
        color: var(--text-secondary, #888); border-bottom: 1px solid var(--border-0, rgba(255,255,255,0.05)); }
      .cf-sec-nm { color: var(--text-bright, #f0efe6); }
      .cf-sec-wt { color: var(--text-secondary, #888); font-weight: 700; }
      .cf-sec-total { border-top: 1px solid var(--border-1, rgba(255,255,255,0.12)); border-bottom: none; }
      .cf-sec-total .cf-sec-nm, .cf-sec-total .cf-sec-wt {
        color: var(--accent, #d4b87a); font-weight: 700; text-transform: uppercase;
        font-size: 11px; letter-spacing: 0.06em; }
      .cf-sec-empty { padding: 14px 12px; font-family: var(--font-mono, monospace);
        font-size: 11px; color: var(--text-dim, #4a4940); line-height: 1.5; }
      .cf-sec-warn { border-top: none; }
      .cf-sec-warn .cf-sec-nm, .cf-sec-warn .cf-sec-wt {
        color: var(--amber, #d4a83c); font-weight: 700; font-size: 10px;
        text-transform: uppercase; letter-spacing: 0.05em; }
      ${p}
    </style>
    <div class="cf-makeup-row cf-nm-row">
      ${u}
      <div class="cf-makeup-left">${Y}</div>
      <div class="cf-makeup-right">
        <div class="cf-nm-wrap">
          <div class="cf-nm-boxes">
            ${m}
          </div>
          <div class="cf-nm-stage">
            ${l}
          </div>
        </div>
      </div>
    </div>`}async function q(e){if(!e)return;if(Z(v.nation)){e.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#128081;</div>
                <div class="cf-no-title">Absolute Monarchy</div>
                <div class="cf-no-desc">The Crown rules by decree. There are no elections.</div>
            </div>
        </div>`;return}const o=Pe(),a=s=>s?`<div class="cf-makeup-row">
               <div class="cf-makeup-left"></div>
               <div class="cf-makeup-right">${s}</div>
           </div>`:"";let n=[],c=[];const i={};try{const s=v?.nation?.id;if(s){const[$,I]=await Promise.all([S.from("sectors").select("id, name, weight, is_active, display_order").eq("nation_id",s).order("display_order",{ascending:!0}),S.from("provinces").select("id, name, display_order").eq("nation_id",s).order("display_order",{ascending:!0})]);if($.error?console.warn("[coalition-formation] sectors load failed:",$.error.message):n=$.data||[],I.error?console.warn("[coalition-formation] provinces load failed:",I.error.message):c=I.data||[],c.length){const{data:N,error:z}=await S.from("province_sector_weights").select("province_id, sector_id, weight").in("province_id",c.map(A=>A.id));z?console.warn("[coalition-formation] province weights load failed:",z.message):(N||[]).forEach(A=>{i[`${A.province_id}|${A.sector_id}`]=A.weight})}}}catch(s){console.warn("[coalition-formation] sectors/provinces load threw:",s?.message||s)}const t=a(Ee())+Ie(n,c,i);if(ie(v.nation)){const s=he(v.nation);e.innerHTML=`${o}${t}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#127979;</div>
                <div class="cf-no-title">${s?"Semi-Presidential System":"Presidential System"}</div>
                <div class="cf-no-desc">${s?"The President nominates a Prime Minister for parliamentary confirmation. The PM then appoints cabinet ministers. No coalition formation is required.":"The President governs directly and nominates cabinet ministers. No coalition formation is required."}</div>
            </div>
        </div>`;return}if(!U){if(K&&!ue&&!ie(v.nation)){const $=v.faction?.id,N=(Array.isArray(K.party_ids)?K.party_ids:[]).includes($);e.innerHTML=`${o}${t}
            <div class="cf-page">
                <div class="cf-no-formation">
                    <div class="cf-no-icon" style="color:var(--accent);">!</div>
                    <div class="cf-no-title">Prime Minister Vacant</div>
                    <div class="cf-no-desc">A coalition exists, but no Prime Minister is seated. ${N?"Use <strong>Actions → Leadership Challenge</strong> to claim the Premiership for your party leader; it resolves on the next tick.":"Only coalition members can use <strong>Leadership Challenge</strong> to fill the vacancy."}</div>
                </div>
            </div>`;return}e.innerHTML=`${o}${t}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">✓</div>
                <div class="cf-no-title">Government Formed</div>
                <div class="cf-no-desc">A coalition government is currently active with a seated Prime Minister. No formation needed.</div>
            </div>
        </div>`;return}if(!X){const s=oe[0]?.election_tick,$=s!=null?Math.max(0,s-J):"?";e.innerHTML=`${o}${t}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon" style="font-size:2rem;">&#9878;</div>
                <div class="cf-no-title">No Government</div>
                <div class="cf-no-desc">No election has been held yet. The first election is in <strong style="color:var(--accent);">${$}</strong> tick${$!==1?"s":""}.</div>
            </div>
        </div>`;return}await ve();const d=v.faction,p=le!==null?Math.max(0,J-le):0,u=Math.max(0,fe-p),m=Math.min(100,p/fe*100),l=p*2;let f="safe";u<=1?f="critical":u<=2&&(f="warning");const h=f==="critical"?"⚠️":f==="warning"?"⏳":"🤝",y=f==="critical"?"No Government — Snap Election Imminent":f==="warning"?"Coalition Formation — Time Running Out":"Coalition Formation In Progress",_=f==="critical"?"Form a government immediately or face snap elections":f==="warning"?"Parties are negotiating — the deadline is approaching":"Parties are negotiating a coalition — propose or join one below",T=x.find(s=>s.id===d.id)?.seats||0,B=T>0,G=L.find(s=>s.proposed_by===d.id)||null,Y=!!G,r=!!G&&Q===G.id;let b="";if(!B)b='<div class="cf-note">Your party has <strong>0 seats</strong>. You cannot propose a coalition, but you may be invited to one.</div>';else if(Y&&!r)b='<div class="cf-note">You have already submitted a proposal for this election. Use <strong>Edit Proposal</strong> on your card below to change the membership.</div>';else{const s=new Set(P),$=k=>(k||[]).map(C=>C.replace(/_/g," ")).join(", "),I=x.map(k=>{const C=k.id===d.id,V=C||s.has(k.id),ae=k.seats||0,ee=k.party_color||"#888",te=(ce[k.id]||[]).map(M=>$e.find(se=>se.id===M)).filter(Boolean).map(M=>`<div class="cf-platform">
                <span class="cf-platform-label"><span class="cf-platform-icon">${M.icon}</span> ${g(M.name)}</span>
                <span class="cf-platform-stats">
                    <span class="cf-stat-up">&uarr; ${$(M.improve)}</span>
                    <span class="cf-stat-down">&darr; ${$(M.worsen)}</span>
                </span>
            </div>`).join(""),O=te?`<div class="cf-check-platforms">${te}</div>`:'<div class="cf-check-platforms cf-check-platforms--empty">No adopted platforms.</div>',j=pe(k);return`<div class="cf-party-check ${V?"checked":""} ${C?"disabled":""}" data-party-id="${k.id}" style="border-left:3px solid ${ee};">
                <div class="cf-party-info">
                    <div class="cf-check-box">${V?"✓":""}</div>
                    <span class="cf-check-name">${g(k.faction_name)}</span>
                    ${j}
                    <span class="cf-check-seats">${ae} seats</span>
                </div>
                ${O}
            </div>`}).join(""),N=P.reduce((k,C)=>k+(x.find(V=>V.id===C)?.seats||0),0)||T,z=R?Math.round(N/R*100):0,A=r?"Edit Your Proposal":"Propose a Government",ne=r?`Add or remove parties. Saving resets all support — every coalition member must re-vote, including you. You need ${E}+ seats for a majority.`:`Select which parties will form the coalition. You need ${E}+ seats for a majority.`,D=r?`<button class="cf-submit-btn" id="cf-save-edit-btn" data-formation-id="${G.id}">Save Changes</button>
               <button class="cf-submit-btn" id="cf-cancel-edit-btn" style="background:var(--bg-body);color:var(--text-dim);margin-left:8px;">Cancel</button>`:'<button class="cf-submit-btn" id="cf-propose-btn">Submit Proposal</button>';b=`
            <div class="cf-propose-section">
                <div class="cf-section-title">${A}</div>
                <div class="cf-section-desc">${ne}</div>
                <div class="cf-party-grid" id="cf-party-grid">${I}</div>
                <div class="cf-seat-preview" id="cf-seat-preview">
                    Coalition seats: <span class="cf-preview-val" id="cf-preview-seats">${N}</span> / ${R}
                    (<span id="cf-preview-pct">${z}</span>%)
                    <span id="cf-preview-threshold" style="margin-left:8px;color:var(--text-dim);">— needs ${E} seats</span>
                </div>
                ${D}
            </div>`}const w=L.length>0?`
        <div class="cf-section-title" style="margin-top:16px;">Active Proposals</div>
        <div class="cf-proposals-grid">${L.map(s=>{const $=x.find(O=>O.id===s.proposed_by),I=s.party_ids||[],N=I.reduce((O,j)=>O+(x.find(M=>M.id===j)?.seats||0),0),z=R?Math.round(N/R*100):0,A=N>=E,ne=I.map(O=>{const j=x.find(se=>se.id===O),M=pe(j);return`<span class="cf-party-chip" style="border-left:2px solid ${j?.party_color||"#888"};">${g(j?.faction_name||"?")} · ${j?.seats||0}${M?" "+M:""}</span>`}).join("");let D="";s.iAmSupporting?D='<span class="cf-status cf-status--supporting">✓ SUPPORTING</span>':s.iAmInvited?D='<span class="cf-status cf-status--invited">INVITED</span>':D='<span class="cf-status cf-status--locked">NOT INVITED</span>';const k=s.iAmInvited&&!s.iAmSupporting?`<button class="cf-support-btn" data-formation-id="${s.id}" data-action="support">Support This Coalition</button>`:s.iAmSupporting?`<button class="cf-withdraw-btn" data-formation-id="${s.id}" data-action="withdraw">Withdraw Support</button>`:"",C=s.supportCount>=s.coalitionSize,ae=s.proposed_by===d.id&&!C&&Q!==s.id?`<button class="cf-edit-btn" data-formation-id="${s.id}" data-action="edit" style="margin-left:8px;background:var(--bg-body);color:var(--accent);border:1px solid var(--accent);padding:4px 10px;font-family:var(--font-mono);font-size:9px;cursor:pointer;">Edit</button>`:"",ee=W===s.id,de=C&&s.iAmInvited&&!ee,te=C&&ee;return`<div class="cf-proposal-card ${s.iAmSupporting?"supporting":""} ${s.iAmInvited?"":"not-invited"}">
                <div class="cf-proposal-title">${g($?.faction_name||"Unknown")} Coalition ${D}${ae}</div>
                <div class="cf-proposal-seats">Seats: <span style="color:${A?"var(--green)":"var(--red)"};">${N}</span> (${z}%) ${A?"✓":"— below threshold"}</div>
                <div class="cf-proposal-chips">${ne}</div>
                <div class="cf-proposal-support">Support: ${s.supportCount} / ${s.coalitionSize} coalition members ${C?'<span style="color:var(--green);font-weight:700;"> — UNANIMOUS</span>':""}</div>
                ${k}
                ${de?`<button class="cf-support-btn" data-formation-id="${s.id}" data-action="configure" style="margin-top:6px;background:var(--green);color:#000;border-color:var(--green);">Configure Government &amp; Assign Ministries</button>`:""}
                ${te?Me(s):""}
            </div>`}).join("")}</div>
    `:"";e.innerHTML=`${o}${t}
    <div class="cf-page">
        <!-- Formation Banner -->
        <div class="cf-banner cf-banner--${f}">
            <div class="cf-banner-header">
                <span class="cf-banner-icon">${h}</span>
                <div>
                    <div class="cf-banner-title">${y}</div>
                    <div class="cf-banner-subtitle">${_}</div>
                </div>
            </div>
            <div class="cf-countdown">
                <div class="cf-countdown-track"><div class="cf-countdown-fill cf-countdown-fill--${f}" style="width:${m}%;"></div></div>
                <div class="cf-countdown-text">${u>0?u+" tick"+(u!==1?"s":"")+" remaining":"⚡ SNAP ELECTION IMMINENT"}</div>
            </div>
            <div class="cf-penalties">
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--red);">-2%</div>
                    <div class="cf-penalty-label">Approval / Tick</div>
                </div>
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--orange);">${p}</div>
                    <div class="cf-penalty-label">Ticks Elapsed</div>
                </div>
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--red);">-${l}%</div>
                    <div class="cf-penalty-label">Total Lost</div>
                </div>
            </div>
        </div>

        ${b}
        ${w}
    </div>`,r||(P=[d.id]),Fe(e)}const Ce={prime_minister:"Prime Minister",interior:"Interior",foreign:"Foreign Affairs",defense:"Defense",finance:"Finance",education:"Education",healthcare:"Healthcare",labor:"Labor",justice:"Justice",trade:"Trade",energy:"Energy",transportation:"Transportation",sports:"Sports",security:"Security"};function Me(e){const o=(e.party_ids||[]).map(m=>x.find(l=>l.id===m)).filter(Boolean),a=Z(v.nation)?x:o,n=(e.party_ids||[]).includes(v.faction?.id);F={...e.ministry_assignments||{}};const i=v.faction?.id,t=F.prime_minister,d=t===i;let p=`<div style="padding:12px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--accent);margin-bottom:10px;">CONFIGURE GOVERNMENT</div>
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:12px;">All coalition members can assign ministries. The party selected as Prime Minister clicks Form Government.</div>`;for(const m of ye){const l=Ce[m]||m,f=m==="prime_minister",h=F[m];n&&(p+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="width:140px;font-family:var(--font-mono);font-size:10px;font-weight:${f?"700":"400"};color:${f?"var(--accent)":"var(--text-secondary)"};letter-spacing:0.5px;">${l}</span>
                <select data-ministry="${m}" class="cf-ministry-select" style="flex:1;padding:4px 8px;font-family:var(--font-mono);font-size:10px;color:var(--text-bright);background:var(--bg-body);border:1px solid var(--border-main);outline:none;">
                    <option value="">— Select Party —</option>
                    ${a.map(y=>`<option value="${y.id}" ${h===y.id?"selected":""}>${g(y.faction_name)} (${y.seats||0} seats)</option>`).join("")}
                </select>
            </div>`)}const u=!!F.prime_minister;if(u&&d)p+=`<div style="margin-top:14px;display:flex;justify-content:flex-end;">
            <button id="cf-form-gov-btn" style="padding:10px 28px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1.5px;color:#000;background:var(--green);border:1px solid var(--green);cursor:pointer;">FORM GOVERNMENT</button>
        </div>`;else if(u&&!d){const m=a.find(l=>l.id===t);p+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(92,204,92,0.04);border:1px solid rgba(92,204,92,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Waiting for <span style="color:var(--green);font-weight:700;">${g(m?.faction_name||"PM party")}</span> to click Form Government.
        </div>`}else p+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Select a Prime Minister to enable government formation.
        </div>`;return p+="</div>",p}async function Ne(e,o){if(re)return;if(!F.prime_minister){alert("You must assign a Prime Minister first.");return}re=!0;const n=document.getElementById("cf-form-gov-btn");n&&(n.disabled=!0,n.textContent="FORMING...");try{await Ae({supabase:S,formationId:e.id,callerFactionId:v.faction.id,nation:v.nation,ministryAssignments:F}),U=!1,alert("Government formed successfully!"),await q(o)}catch(c){console.error("[Coalition] Form government failed:",c),alert("Failed to form government: "+(c.message||c))}finally{re=!1,n&&(n.disabled=!1,n.textContent="FORM GOVERNMENT")}}async function Ae({supabase:e,formationId:o,callerFactionId:a,nation:n,ministryAssignments:c,ministerNames:i=null}){if(!e||!o||!a||!n||!c)throw new Error("formGovernment: missing required arg");if(!i){const m=_e(n?.name)||{},l=m.firstNames||["Alex","Maria","Carlos"],f=m.lastNames||["Garcia","Torres","Silva"];i={};for(const[h,y]of Object.entries(c))y&&(i[h]={first_name:l[Math.floor(Math.random()*l.length)],last_name:f[Math.floor(Math.random()*f.length)],age:35+Math.floor(Math.random()*25)})}const{error:t}=await e.from("government_formations").update({ministry_assignments:c,minister_names:i}).eq("id",o);if(t)throw new Error("Failed to save assignments: "+t.message);const d={};for(const[m,l]of Object.entries(c))l&&(d[m]=be(m,n));const{data:p,error:u}=await e.rpc("finalize_government_formation",{p_formation_id:o,p_caller_faction_id:a,p_ministry_baselines:d});if(u)throw u;if(p?.error)throw new Error(p.error);return p}async function ve(){if(!X){L=[];return}const{data:e}=await S.from("government_formations").select("*").eq("election_id",X).eq("status","active").order("created_at",{ascending:!0}),o=[];for(const a of e||[]){const{data:n}=await S.from("government_formation_support").select("faction_id, supports").eq("formation_id",a.id),c=a.party_ids||[],t=(n||[]).filter(l=>c.includes(l.faction_id)).filter(l=>l.supports).length,d=c.length,u=(n||[]).find(l=>l.faction_id===v.faction?.id)?.supports===!0,m=c.includes(v.faction?.id);o.push({...a,supportCount:t,coalitionSize:d,iAmSupporting:u,iAmInvited:m})}L=o}let me=!1;function Fe(e){me||(me=!0,e.addEventListener("click",async o=>{const a=o.target.closest(".cf-party-check:not(.disabled)");if(a){const i=a.dataset.partyId,d=x.find(m=>m.id===i)?.bloc_id||null,p=!P.includes(i),u=d?x.filter(m=>m.bloc_id===d).map(m=>m.id):[i];for(const m of u){const l=P.indexOf(m);p&&l===-1&&P.push(m),!p&&l>-1&&P.splice(l,1);const f=e.querySelector(`.cf-party-check[data-party-id="${m}"]`);if(!f)continue;f.classList.toggle("checked",p);const h=f.querySelector(".cf-check-box");h&&(h.textContent=p?"✓":"")}Re();return}if(o.target.closest("#cf-propose-btn")){await Le(e);return}const n=o.target.closest(".cf-edit-btn");if(n&&n.dataset.action==="edit"){const i=n.dataset.formationId,t=L.find(d=>d.id===i);t&&t.proposed_by===v.faction?.id&&(Q=i,P=(t.party_ids||[]).filter(d=>x.some(p=>p.id===d)),await q(e));return}if(o.target.closest("#cf-save-edit-btn")){const i=o.target.closest("#cf-save-edit-btn").dataset.formationId;await Ge(i,e);return}if(o.target.closest("#cf-cancel-edit-btn")){Q=null,P=[v.faction?.id].filter(Boolean),await q(e);return}const c=o.target.closest(".cf-support-btn, .cf-withdraw-btn");if(c){const i=c.dataset.formationId,t=c.dataset.action;if(t==="configure"){W=i;const d=L.find(p=>p.id===i);d&&(F={...d.ministry_assignments||{}}),await q(e)}else await je(i,t==="support",e);return}if(o.target.closest("#cf-form-gov-btn")){const i=L.find(t=>t.id===W);i&&await Ne(i,e);return}}),e.addEventListener("change",o=>{const a=o.target.closest(".cf-ministry-select");if(!a)return;const n=a.dataset.ministry,c=a.value||null;F[n]=c,W&&S.from("government_formations").update({ministry_assignments:F}).eq("id",W).then(({error:t})=>{t&&console.warn("[Coalition] Failed to save assignment:",t.message)});const i=document.getElementById("cf-form-gov-btn");if(i){const t=!!F.prime_minister;i.disabled=!t,i.style.color=t?"#000":"var(--text-dim)",i.style.background=t?"var(--green)":"var(--bg-body)",i.style.borderColor=t?"var(--green)":"var(--border-main)",i.style.cursor=t?"pointer":"not-allowed"}}))}function Re(){const e=document.getElementById("cf-preview-seats"),o=document.getElementById("cf-preview-pct"),a=document.getElementById("cf-preview-threshold");if(!e)return;const n=P.reduce((t,d)=>t+(x.find(p=>p.id===d)?.seats||0),0),c=R?Math.round(n/R*100):0,i=n>=E;e.textContent=n,e.style.color=i?"var(--green)":"var(--text-bright)",o.textContent=c,a.textContent=i?`✓ Meets ${E}-seat threshold`:`— needs ${E} seats`,a.style.color=i?"var(--green)":"var(--text-dim)"}async function Le(e){if(H)return;const o=v.faction;if((x.find(t=>t.id===o.id)?.seats||0)===0)return;const n=[...new Set(P)],c=n.reduce((t,d)=>t+(x.find(p=>p.id===d)?.seats||0),0);if(c<E){alert(`Coalition needs ${E} seats. Currently: ${c}.`);return}H=!0;const i=document.getElementById("cf-propose-btn");i&&(i.disabled=!0,i.textContent="Submitting...");try{const{data:t}=await S.from("shard").select("current_date").eq("name","Alpha Shard").single(),{data:d,error:p}=await S.from("government_formations").insert({nation_id:v.nation.id,election_id:X,proposed_by:o.id,party_ids:n,status:"active",game_year:t?.current_date||""}).select().single();if(p){alert("Error: "+p.message);return}const{error:u}=await S.from("government_formation_support").upsert({formation_id:d.id,faction_id:o.id,supports:!0},{onConflict:"formation_id,faction_id"});u&&console.warn("[Coalition] Auto-support insert failed:",u.message),await q(e)}catch(t){console.error("[Coalition] Create proposal error:",t),alert("Failed to create proposal: "+(t.message||t))}finally{H=!1}}async function Ge(e,o){if(H||!v.faction)return;const n=[...new Set(P)],c=n.reduce((t,d)=>t+(x.find(p=>p.id===d)?.seats||0),0);if(c<E){alert(`Coalition needs ${E} seats. Currently: ${c}.`);return}H=!0;const i=document.getElementById("cf-save-edit-btn");i&&(i.disabled=!0,i.textContent="Saving...");try{const{data:t,error:d}=await S.rpc("update_coalition_proposal",{p_formation_id:e,p_party_ids:n});if(d){alert("Failed to save changes: "+d.message);return}if(t&&t.success===!1){alert("Failed to save changes: "+(t.error||"unknown"));return}Q=null,await q(o)}catch(t){console.error("[Coalition] Update proposal error:",t),alert("Failed to save changes: "+(t.message||t))}finally{H=!1,i&&(i.disabled=!1,i.textContent="Save Changes")}}async function je(e,o,a){try{const{error:n}=await S.from("government_formation_support").upsert({formation_id:e,faction_id:v.faction?.id,supports:o},{onConflict:"formation_id,faction_id"});n&&console.error("[Coalition] Toggle support error:",n.message),await q(a)}catch(n){console.error("[Coalition] Toggle support error:",n)}}export{ke as B,$e as P,Ye as S,Ae as a,We as b,He as f,Ke as i,q as r,Ve as s};
