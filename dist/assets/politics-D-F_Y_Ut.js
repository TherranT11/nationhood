import{_supabase as mt}from"./supabase-client-CiYoFhIh.js";/* empty css                  */import{i as Te}from"./common-DQXrqzWj.js";import{b as Zt,r as Ne,j as be}from"./political-actions-BF080n5r.js";import{l as wt,j as Tt,a as ze}from"./government-types-D9n0pQb0.js";import{GAME_CONFIG as nt,FORMATION_DEADLINE_TICKS as Fe}from"./config-CRvw5bg0.js";import{f as Re}from"./no-confidence-CDx5bTCk.js";import{a as Oe,b as xe}from"./elections-CVfLF5C8.js";import{a as De}from"./ideology-BqLjustE.js";import{d as Be,c as je,s as Ge,a as Mt}from"./stats-tIiBSaQA.js";import"./preload-helper-BXl3LOEh.js";import"./bills-C8moQHZX.js";import"./presidential-Cpbau2n-.js";const $t=[{id:"economic_reform",name:"Economic Reform",icon:"📈",tagline:"Growth-first neoliberal agenda",desc:"Prioritize GDP, attract foreign capital, lower corporate taxes. The rising tide theory — grow the pie and worry about slicing it later.",improve:["gdp_growth","foreign_investment","currency_strength","credit","service_output","manufacturing_output"],worsen:["income_inequality","poverty_rate","union_strength","income_tax"],tradeoff:"Income inequality tends to rise. Working class sees GDP numbers go up while their wages don't."},{id:"social_justice",name:"Social Justice",icon:"⚖️",tagline:"Redistribution and equity",desc:"Raise minimum wage, expand welfare, progressive taxation. Close the gap between rich and poor through direct intervention.",improve:["minimum_wage","poverty_rate","income_inequality","social_mobility","healthcare_accessibility","education_accessibility"],worsen:["foreign_investment","gdp_growth","corporate_tax"],tradeoff:"Capital flight risk. Foreign investors avoid high-tax environments. Growth may slow."},{id:"national_security",name:"National Security",icon:"🛡️",tagline:"Borders, military, order",desc:"Strengthen defense, tighten borders, expand police powers. Safety through strength.",improve:["stability","crime_rate","terrorism","political_violence","illegal_immigration"],worsen:["freedom_index","press_freedom","civil_unrest","polarization"],tradeoff:"Freedom index drops. Minority communities disproportionately affected. International criticism."},{id:"anti_corruption",name:"Anti-Corruption",icon:"🔍",tagline:"Clean government, institutional reform",desc:"Independent judiciary, transparent budgets, prosecute the connected. Popular with voters but powerful people fight back hard.",improve:["corruption","judicial_independence","press_freedom","legitimacy","efficiency"],worsen:["stability"],tradeoff:"Short-term chaos as exposing corruption shakes institutions. Your own party's skeletons may surface."},{id:"green_transition",name:"Green Transition",icon:"🌱",tagline:"Climate and environment",desc:"Renewable energy investment, carbon taxes, emissions targets. Save the planet — but the bill comes due now, not later.",improve:["renewable_energy_pct","pollution","carbon_emissions","energy_generation"],worsen:["fuel_prices","manufacturing_output","gdp_growth","cost_of_living"],tradeoff:"Energy costs spike during transition. Rural and industrial voters feel abandoned."},{id:"industrialization",name:"Industrialization",icon:"🏭",tagline:"Factories, exports, production",desc:"Build manufacturing capacity, create blue-collar jobs, develop physical infrastructure. The backbone of a real economy.",improve:["manufacturing_output","labor_force_participation","unemployment","physical_infrastructure","gdp_growth"],worsen:["pollution","carbon_emissions","arable_land","healthcare_quality"],tradeoff:"Environment gets destroyed. Long-term health costs from industrial pollution."},{id:"digital_modernization",name:"Digital Modernization",icon:"💻",tagline:"Tech economy, connectivity",desc:"Fiber everywhere, tech sector incentives, digital government services. Leap into the future — but not everyone makes the jump.",improve:["digital_infrastructure","service_output","higher_education","academic_immigration","efficiency"],worsen:["manufacturing_output","labor_force_participation","income_inequality","urbanization"],tradeoff:"Automation displaces workers. Rural communities left behind. Tech wealth concentrates in cities."},{id:"welfare_state",name:"Welfare State",icon:"🏥",tagline:"Universal services, safety net",desc:"Free healthcare, free education, generous pensions, unemployment insurance. Cradle to grave — funded by steep taxes on everyone.",improve:["healthcare_quality","healthcare_accessibility","education_accessibility","poverty_rate","standard_of_living","happiness"],worsen:["income_tax","corporate_tax","gdp_growth","foreign_investment"],tradeoff:"Massive fiscal cost. Tax burden on middle class, not just the rich. Sustainability questioned."},{id:"populist_nationalism",name:"Populist Nationalism",icon:"🇲",tagline:"The people vs. elites and outsiders",desc:"Restrict immigration, protect domestic industry, reject globalism. Our people first. Our jobs first. Our culture first.",improve:["immigration","illegal_immigration","manufacturing_output","minimum_wage","union_strength"],worsen:["foreign_investment","academic_immigration","freedom_index","press_freedom","polarization","ethnic_diversity"],tradeoff:"International isolation. Brain drain as educated professionals emigrate. Deep social polarization."},{id:"free_market",name:"Free Market Liberalism",icon:"🏛️",tagline:"Deregulate everything",desc:"Cut taxes, cut red tape, let the market decide winners and losers. Government is the problem, not the solution.",improve:["gdp_growth","foreign_investment","credit","service_output","currency_strength"],worsen:["union_strength","minimum_wage","healthcare_accessibility","income_inequality","poverty_rate"],tradeoff:"Growth at the cost of the working class. Social safety net erodes. Boom-bust volatility."},{id:"law_and_order",name:"Law & Order",icon:"⚔️",tagline:"Tough on crime, strong institutions",desc:"More police, harsher sentences, zero tolerance. Restore order to the streets. Criminals fear the state.",improve:["crime_rate","stability","political_violence","terrorism","drug_use"],worsen:["incarceration_rate","freedom_index","civil_unrest"],tradeoff:"Prison population explodes. Minority communities targeted. Policing costs balloon."},{id:"education_first",name:"Education First",icon:"🎓",tagline:"Human capital as the long game",desc:"Fund schools, universities, research institutions, teacher salaries. The 20-year bet that the next generation will be smarter and richer.",improve:["literacy","higher_education","education_accessibility","academic_immigration","social_mobility","labor_force_participation"],worsen:["income_tax","gdp_growth"],tradeoff:"Voters don't see results before next election. Brain drain if jobs don't exist for graduates."},{id:"healthcare_reform",name:"Healthcare Reform",icon:"💊",tagline:"Fix the hospitals",desc:"More beds, more doctors, better drugs, universal coverage. Nobody dies because they can't afford treatment.",improve:["healthcare_quality","healthcare_accessibility","beds_per_100k","lifespan","drug_use"],worsen:["income_tax","gdp_growth","cost_of_living"],tradeoff:"Pharmaceutical lobby fights back. Extremely expensive. Takes multiple cycles to show results."},{id:"housing_cost",name:"Housing & Cost of Living",icon:"🏠",tagline:"The kitchen-table platform",desc:"Rent controls, public housing, affordable food, price caps on essentials. People can't eat GDP growth.",improve:["housing_affordability","cost_of_living","standard_of_living","physical_infrastructure","urbanization"],worsen:["foreign_investment","gdp_growth"],tradeoff:"Property owners and developers become your enemies. Market distortions create shortages."},{id:"energy_independence",name:"Energy Independence",icon:"⛽",tagline:"Control your own power supply",desc:"Exploit domestic oil, gas, and minerals. No more dependency on foreign energy. Cheap fuel, strong economy, sovereign power.",improve:["energy_generation","oil_and_gas","rare_minerals","fuel_prices","manufacturing_output","gdp_growth"],worsen:["pollution","carbon_emissions","renewable_energy_pct","arable_land"],tradeoff:"Climate commitments broken. Green voters abandon you. Environmental debt for future generations."},{id:"open_society",name:"Open Society",icon:"🕊️",tagline:"Liberal democracy, civil liberties",desc:"Free press, open borders, multicultural embrace, strong civil rights. A beacon of freedom — and a target for those who fear it.",improve:["freedom_index","press_freedom","immigration","academic_immigration","ethnic_diversity","happiness","judicial_independence"],worsen:["stability","illegal_immigration","polarization","terrorism"],tradeoff:"Nationalist backlash. Rural-urban divide deepens. Security vulnerabilities from openness."}],ie={gdp_growth:"GDP Growth",inflation:"Inflation",interest_rates:"Interest Rates",currency_strength:"Currency Strength",foreign_investment:"Foreign Investment",credit:"Credit",income_tax:"Income Tax",corporate_tax:"Corporate Tax",sales_tax:"Sales Tax",unemployment:"Unemployment",labor_force_participation:"Labor Force Participation",minimum_wage:"Minimum Wage",union_strength:"Union Strength",poverty_rate:"Poverty Rate",income_inequality:"Income Inequality",healthcare_quality:"Healthcare Quality",healthcare_accessibility:"Healthcare Accessibility",beds_per_100k:"Beds per 100k",lifespan:"Lifespan",drug_use:"Drug Use",literacy:"Literacy",higher_education:"Higher Education",education_accessibility:"Education Accessibility",academic_immigration:"Academic Immigration",physical_infrastructure:"Physical Infrastructure",digital_infrastructure:"Digital Infrastructure",urbanization:"Urbanization",energy_generation:"Energy Generation",renewable_energy_pct:"Renewable Energy %",arable_land:"Arable Land",rare_minerals:"Rare Minerals",oil_and_gas:"Oil & Gas",fuel_prices:"Fuel Prices",pollution:"Pollution",carbon_emissions:"Carbon Emissions",standard_of_living:"Standard of Living",happiness:"Happiness",social_mobility:"Social Mobility",crime_rate:"Crime Rate",incarceration_rate:"Incarceration Rate",religiosity:"Religiosity",stability:"Stability",legitimacy:"Legitimacy",efficiency:"Efficiency",corruption:"Corruption",press_freedom:"Press Freedom",judicial_independence:"Judicial Independence",freedom_index:"Freedom Index",polarization:"Polarization",civil_unrest:"Civil Unrest",terrorism:"Terrorism",political_violence:"Political Violence",immigration:"Immigration",illegal_immigration:"Illegal Immigration",emigration:"Emigration",ethnic_diversity:"Ethnic Diversity",cost_of_living:"Cost of Living",housing_affordability:"Housing Affordability",manufacturing_output:"Manufacturing Output",service_output:"Service Output"},te=new Set(["inflation","unemployment","poverty_rate","income_inequality","drug_use","pollution","carbon_emissions","crime_rate","incarceration_rate","corruption","polarization","civil_unrest","terrorism","political_violence","illegal_immigration","emigration","cost_of_living","fuel_prices"]),qe=new Set(["income_tax","corporate_tax","sales_tax"]);function oe(a,t){const e=te.has(a),i=qe.has(a);return t==="improve"?e?{arrow:"↓",color:"#5cc55c"}:i?{arrow:"↑",color:"#c84"}:{arrow:"↑",color:"#5cc55c"}:e?{arrow:"↑",color:"#c55"}:i?{arrow:"↓",color:"#5cc55c"}:{arrow:"↓",color:"#c55"}}function ne(a){switch(a){case 0:return{momentum:12,penalty:0,label:"+12",color:"#5cc55c",note:"Unclaimed — full momentum"};case 1:return{momentum:6,penalty:6,label:"+6",color:"#ca5",note:"Contested by 1 rival — reduced momentum"};case 2:return{momentum:4,penalty:4,label:"+4",color:"#c84",note:"Crowded (2 rivals) — minimal momentum"};default:return{momentum:2,penalty:2,label:"+2",color:"#c84",note:`Crowded (${a} rivals) — minimal momentum`}}}function He(a,t){return a.map(e=>{const i=$t.find(o=>o.id===e.platform_key);if(!i)return{...e,stats:[]};const s=i.improve.map(o=>{const n=e.baseline_stats?.[o],m=e.target_stats?.[o],f=Number(t?.[o]??50),r=te.has(o);if(n==null||m==null)return{stat:o,baseline:f,target:f,current:f,progress:0,met:!1};const l=Math.abs(m-n),p=r?Math.max(0,n-f):Math.max(0,f-n),c=l>0?Math.min(1,p/l):1,v=r?f<=m:f>=m;return{stat:o,baseline:n,target:m,current:f,progress:c,met:v}});return{...e,stats:s,platformDef:i}})}const Ue=["Former union organizer. Knows how to mobilize a crowd.","Disbarred attorney. Understands the legal system from the inside.","Investigative journalist. Uncovered three government scandals before going private.","Ex-military intelligence. Trained in information warfare.","Community activist. Built grassroots networks across two provinces.","Former government auditor. Knows where the money hides.","Political science professor. Publishes on institutional corruption.","NGO director. Ran anti-corruption campaigns across the continent.","Former prosecutor. Left the justice ministry over political interference.","Labor rights campaigner. Organized the dockworkers' strike of 2014.","Freelance political consultant. Has worked for opposition parties in three nations.","Student movement leader. Led the university protests. Young and fearless.","Retired diplomat. Leverages international connections for domestic pressure.","Whistleblower advocate. Runs a secure tip line used by civil servants.","Former police detective. Turned against the system after a cover-up."];function ct(a){return a>=75?{label:"Exceptional",color:"#5cc55c",desc:"Elite operative. Lawsuits are devastating, intelligence is razor-sharp."}:a>=60?{label:"Strong",color:"#a3b07e",desc:"Experienced and reliable. Can handle most opposition tasks effectively."}:a>=45?{label:"Competent",color:"#ca5",desc:"Gets the job done. Occasional missteps under pressure."}:a>=30?{label:"Developing",color:"#c84",desc:"Green but eager. Results are inconsistent. Cheap to hire."}:{label:"Weak",color:"#c55",desc:"Liability risk. May botch sensitive operations. Rock-bottom price for a reason."}}function Ye(a){var t=Math.max(0,a-20)/65,e=12e4+t*28e4;return Math.round(e/25e3)*25e3}function Ft(a,t){return a+Math.floor(Math.random()*(t-a+1))}function se(a){return a[Math.floor(Math.random()*a.length)]}function Ve(a,t){var e=[],i=new Set,s=Ft(5,7),o=Zt(t),n=o.firstNames||[],m=o.lastNames||[];if(n.length===0||m.length===0)return[];for(var f=Ue.slice().sort(function(){return Math.random()-.5}),r=0;r<s;r++){var l,p,c,v=0;do l=se(n),p=se(m),c=l+" "+p,v++;while(i.has(c)&&v<20);i.add(c);var d=Ft(20,85),u=Ft(25,60),g=f[r%f.length],x=Ye(d);e.push({nation_id:a,first_name:l,last_name:p,age:u,skill:d,background:g,hire_cost:x,status:"available"})}return e.sort(function(_,b){return b.skill-_.skill}),e}async function he(a,t,e){var{data:i,error:s}=await a.from("administrations").select("id, coalition_parties, stats_at_start, started_at_tick, pm_party_id").eq("nation_id",t).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle();if(s)return console.error("[Agitator] Failed to check opposition status:",s.message),{isOpposition:!1,administration:null};if(!i)return{isOpposition:!0,administration:null};var o=Array.isArray(i.coalition_parties)?i.coalition_parties:[],n=o.map(function(f){return f?typeof f=="string"?f:typeof f=="object"&&(f.party_id||f.id)||null:null}).filter(Boolean),m=n.includes(e)||i.pm_party_id===e;return{isOpposition:!m,administration:i}}async function _e(a,t){var{data:e,error:i}=await a.from("faction_agitators").select("*").eq("faction_id",t).eq("status","active").maybeSingle();return i?(console.error("[Agitator] Failed to fetch agitator:",i.message),null):e}async function Ke(a,t,e){var{data:i,error:s}=await a.from("agitator_pool").select("*").eq("nation_id",t).eq("status","available").order("skill",{ascending:!1});if(s)return console.error("[Agitator] Failed to fetch pool:",s.message),[];if(i&&i.length>0)return i;var o=Ve(t,e),{data:n,error:m}=await a.from("agitator_pool").insert(o).select("*");return m?(console.error("[Agitator] Failed to insert pool:",m.message),[]):(n||[]).sort(function(f,r){return r.skill-f.skill})}async function We(a,t,e,i){var s=await _e(a,t);if(s)return{success:!1,agitator:null,error:"You already have an active agitator."};var{data:o,error:n}=await a.from("faction_agitators").insert({faction_id:t,first_name:e.first_name,last_name:e.last_name,age:e.age,skill:e.skill,background:e.background,status:"active",hired_at_tick:i}).select("*").single();if(n)return console.error("[Agitator] Failed to hire:",n.message),{success:!1,agitator:null,error:n.message};var{error:m}=await a.from("agitator_pool").update({status:"hired",hired_by_faction_id:t}).eq("id",e.id);return m&&console.error("[Agitator] Failed to mark pool candidate as hired:",m.message),{success:!0,agitator:o,error:null}}const It=[{key:"finance",label:"Finance",icon:"💰"},{key:"defense",label:"Defense",icon:"🛡️"},{key:"education",label:"Education",icon:"🎓"},{key:"healthcare",label:"Health",icon:"🏥"},{key:"interior",label:"Interior",icon:"🏛️"},{key:"foreign",label:"Foreign",icon:"🌐"},{key:"justice",label:"Justice",icon:"⚖️"},{key:"labor",label:"Labor",icon:"🔨"},{key:"trade",label:"Trade",icon:"📦"},{key:"energy",label:"Energy",icon:"⚡"},{key:"transportation",label:"Transport",icon:"🚂"},{key:"agriculture",label:"Agriculture",icon:"🌾"}],we=[{key:"misuse_of_funds",label:"Misuse of Public Funds",desc:"Alleging budget went somewhere it shouldn't."},{key:"civil_rights",label:"Violation of Civil Rights",desc:"Alleging government overreach or suppression."},{key:"negligence",label:"Breach of Duty / Negligence",desc:"Alleging a ministry failed its mandate."},{key:"corruption",label:"Corruption / Self-Dealing",desc:"Alleging officials enriched themselves."}];function ee(a){return a<=5?{tier:1,label:"Clean Government",color:"#c55"}:a<=10?{tier:2,label:"Minor Corruption",color:"#ca5"}:a<=20?{tier:3,label:"Significant Corruption",color:"#c84"}:{tier:4,label:"Systemic Corruption",color:"#5cc55c"}}const et={1:{resolution:"FRIVOLOUS SUIT",filer:{momentum:-5,governance:-2},gov:{momentum:3,governance:1}},2:{resolution:"PARTIAL WIN",filer:{momentum:3,governance:0},gov:{momentum:-2,governance:-2}},3:{resolution:"MAJOR WIN",filer:{momentum:7,governance:2},gov:{momentum:-5,governance:-5}},4:{resolution:"DEVASTATING WIN",filer:{momentum:12,governance:5},gov:{momentum:-10,governance:-8}}},re={1:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"Lawsuit discovery phase produces routine documents. No irregularities found in {ministry}.",evidence:"Legal team reviews {ministry} records. Auditors confirm standard procedures.",pre_trial:"Judge signals skepticism toward {party}'s claims. Case appears thin.",resolution:"{ministry} lawsuit dismissed. Courts find no evidence of wrongdoing. {party} criticized for wasting court resources."},2:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit uncovers irregular procurement contracts in {ministry}.",evidence:"Documents reveal {ministry} awarded no-bid contracts to connected firms.",pre_trial:"Judge allows case to proceed. {ministry} officials ordered to testify.",resolution:"{ministry} lawsuit concludes with partial ruling. Irregular contracts confirmed but no criminal charges filed."},3:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit exposes hidden accounts linked to {ministry} officials.",evidence:"Leaked documents show systematic overbilling in {ministry}. Millions unaccounted for.",pre_trial:"Multiple {ministry} officials refuse to testify. Judge threatens contempt.",resolution:"{ministry} scandal confirmed. Court finds evidence of systematic corruption. {party} vindicated."},4:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit reveals {ministry} ran parallel budget invisible to parliament.",evidence:"Court-ordered audit exposes network of shell companies receiving {ministry} funds.",pre_trial:"Prosecutors request criminal referral. Multiple {ministry} officials implicated.",resolution:"Devastating verdict: {ministry} operated criminal enterprise. Officials face prosecution. Government in crisis."}};function bt(a,t){var e=a;for(var i in t)e=e.split("{"+i+"}").join(t[i]);return e}async function Je(a,t){var{factionId:e,nationId:i,agitatorId:s,targetMinistry:o,basis:n,currentTick:m,partyName:f,administration:r}=t,l,p,c;if(n==="civil_rights"){var v=Number(r?.stats_at_start?.freedom_index??50),{data:d,error:u}=await a.from("nations").select("freedom_index").eq("id",i).single();if(u)return{success:!1,lawsuit:null,tier:0,error:"Failed to fetch freedom index data."};p=Number(d?.freedom_index??50),l=v,c=Math.max(0,l-p)}else{var g=Number(r?.stats_at_start?.corruption??50),{data:d,error:u}=await a.from("nations").select("corruption").eq("id",i).single();if(u)return{success:!1,lawsuit:null,tier:0,error:"Failed to fetch corruption data."};p=Number(d?.corruption??50),l=g,c=Math.max(0,p-l)}var g=l,x=p,_=ee(c),b=et[_.tier],C=m+8,w=It.find(function(A){return A.key===o}),k=w?"Ministry of "+w.label:o,M=we.find(function(A){return A.key===n}),E=M?M.label:n,{data:S,error:N}=await a.from("lawsuits").insert({faction_id:e,nation_id:i,agitator_id:s,target_ministry:o,basis:n,filed_at_tick:m,resolves_at_tick:C,corruption_at_start:g,corruption_at_filing:x,corruption_growth:c,tier:_.tier,status:"active",resolution:null,momentum_effect:b.filer.momentum,governance_effect:b.filer.governance,gov_momentum_effect:b.gov.momentum,gov_governance_effect:b.gov.governance}).select("*").single();if(N)return{success:!1,lawsuit:null,tier:0,error:N.message};var I=re[_.tier]||re[1],R={party:f||"Opposition",ministry:k,basis:E},L=[{event_tick:m,event_type:"filing",headline:bt(I.filing,R)},{event_tick:m+2,event_type:"discovery",headline:bt(I.discovery,R)},{event_tick:m+5,event_type:"evidence",headline:bt(I.evidence,R)},{event_tick:m+7,event_type:"pre_trial",headline:bt(I.pre_trial,R)},{event_tick:C,event_type:"resolution",headline:bt(I.resolution,R)}],P=L.map(function(A){return{lawsuit_id:S.id,nation_id:i,event_tick:A.event_tick,event_type:A.event_type,headline:A.headline,is_fired:A.event_tick===m}}),{error:F}=await a.from("lawsuit_events").insert(P);return F&&console.error("[Lawsuits] Failed to insert milestone events:",F.message),{success:!0,lawsuit:S,tier:_.tier,error:null}}async function Xe(a,t){var{data:e,error:i}=await a.from("lawsuits").select("*").eq("faction_id",t).order("filed_at_tick",{ascending:!1}).limit(10);return i?(console.error("[Lawsuits] Failed to fetch lawsuits:",i.message),[]):e||[]}let $=null,y=null,K="leader",Q=[],St=[],B=null,O=null,ut=!1,D=null,Ut=[],ft=!1;function h(a){if(!a)return"";const t=document.createElement("div");return t.textContent=a,t.innerHTML}function W(a,t){return((a||"?")[0]+(t||"?")[0]).toUpperCase()}const $e=[{id:"leader",title:"LEADER",fullTitle:"Party Leader",color:"#c8a832"},{id:"deputy",title:"DEPUTY",fullTitle:"Deputy Party Leader",color:"#8b9a6b"},{id:"chief",title:"CHIEF OF STAFF",fullTitle:"Chief of Staff",color:"#5cc55c"},{id:"campaign",title:"CAMPAIGN MGR",fullTitle:"Campaign Manager",color:"#c84"},{id:"comms",title:"COMMS DIR",fullTitle:"Communications Director",color:"#5a8aaa"},{id:"agitator",title:"AGITATOR",fullTitle:"Opposition Coordinator",color:"#d44a4a",oppositionOnly:!0}],Rt=[{perSeat:5e3,momDivisor:10},{perSeat:4e3,momDivisor:8},{perSeat:3e3,momDivisor:6},{perSeat:2e3,momDivisor:5},{perSeat:1e3,momDivisor:5}];let lt=0,Lt=0,Yt=!1;async function Qe(){if(!$||!y?.faction?.id||!y?.shard?.current_tick)return;const{count:a,error:t}=await $.from("campaign_actions").select("id",{count:"exact",head:!0}).eq("party_id",y.faction.id).eq("action_type","fundraise").eq("tick_performed",y.shard.current_tick);lt=!t&&a!=null?a:0}async function Ze(){if(Lt=0,Yt=!1,!$||!y?.nation?.id||!y?.shard?.current_tick)return;const a=y.shard.current_tick,t=D?.pm_party_id;try{const{data:e}=await $.from("bills").select("id").eq("nation_id",y.nation.id).eq("bill_type","no_confidence").in("status",["committee","floor"]).limit(1);if(Yt=!!(e&&e.length),t){const{data:i}=await $.from("campaign_actions").select("tick_performed").eq("nation_id",y.nation.id).eq("action_type","no_confidence_filed").eq("target_id",t).order("tick_performed",{ascending:!1}).limit(1).maybeSingle();if(i){const s=a-Number(i.tick_performed||0),o=typeof nt<"u"&&nt.NO_CONFIDENCE_COOLDOWN_TICKS||12;Lt=Math.max(0,o-s)}}}catch(e){console.warn("[PartyActions] loadNoConfidenceState failed:",e?.message||e)}}function ke(a,t){const e=Rt[Math.min(t,Rt.length-1)],i=a*e.perSeat,s=Math.max(1,Math.floor(a/e.momDivisor));return{raised:i,momCost:s,perSeat:e.perSeat,tierIdx:Math.min(t,Rt.length-1)}}const Ee=[{id:"fundraise",name:"Fundraise",desc:"Raise party funds proportional to your seat count. Each use yields less money and costs more momentum. Momentum cannot drop below 1.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"statement",name:"Issue Statement",desc:"Public declaration on an issue. Shifts party positioning and voter bloc reactions. Media covers it. Other parties may respond.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"platform",name:"Set Party Platform",desc:"Choose a political focus. Defines which stats you promise to change. Awards momentum based on how many rivals share the same platform.",cost:"$120k",costColor:"#c8a832",moneyCost:12e4,tags:["STRATEGIC"],locked:!1},{id:"call_early_elections",name:"Call Early Elections",desc:"Dissolve the legislature and call snap elections. PM-only. Government enters caretaker status; election fires after a short formation window. Momentum impact is tiered by Gov. Approval: >50 boosts PM party (+3), <35 boosts opposition (+5 each) and +3 stability, 35–50 is neutral.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["LEGISLATIVE","PM ONLY"],locked:!1},{id:"resign_as_pm",name:"Resign as Prime Minister",desc:"Step down from the Prime Minister seat. PM-only. Coalition enters caretaker status and has a 3-tick window to nominate a successor via the cabinet panel. If a new PM is installed the administration continues under new leadership; otherwise a snap election fires. Cost: −3 Momentum, −0.05 Credibility, −3 Stability, 12-tick bar from PM on your party.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["GOVERNMENT","PM ONLY"],locked:!1},{id:"no_confidence",name:"Vote of No Confidence",desc:"File a motion of no confidence against the Prime Minister. If a simple majority votes YES, the government falls and snap elections are triggered. PASS: +15 Momentum to you, -10 Momentum + -10 Governance to the PM’s party. FAIL: -10 Momentum to you. 12-tick cooldown on the targeted PM party.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["LEGISLATIVE","OPPOSITION"],locked:!1}],ta=[{id:"fundraise",name:"Fundraise",desc:"Raise royal treasury funds proportional to your seat count. Each use yields less money and costs more momentum.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"grant_seats",name:"Grant Seats",desc:"Grant parliamentary seats to a noble house. Sharing power increases legitimacy (+0.5 per seat). Hoarding >70% of seats causes tyranny decay.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1},{id:"revoke_seats",name:"Revoke Seats",desc:"Revoke seats from a noble house. Costs $100k and -1 Legitimacy per seat revoked. Use sparingly — the people do not forget.",cost:"$100k/seat",costColor:"#d44a4a",moneyCost:1e5,tags:["ROYAL","OFFENSIVE"],locked:!1},{id:"statement",name:"Royal Decree",desc:"Issue a public declaration on an issue. Shifts positioning and voter bloc reactions. Media covers it.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"appoint_pm",name:"Appoint Prime Minister",desc:"Choose a party to lead the government as Prime Minister. The PM can then assign cabinet ministries. You may appoint your own party.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1}],Nt={PUBLIC:"#8b9a6b",NARRATIVE:"#5a8aaa",STRATEGIC:"#c8a832",INTERNAL:"#c84",COALITION:"#5aaa8a",RISKY:"#c55",PARLIAMENTARY:"#8b9a6b",FINANCIAL:"#5a8aaa",INTELLIGENCE:"#5a8aaa",DEFENSIVE:"#5cc55c",CAMPAIGN:"#c84",VOTER:"#c8a832",OFFENSIVE:"#c84",REACTIVE:"#ca5",STRUCTURAL:"#9e9a92",ROYAL:"#c8a832",LEGAL:"#5a8aaa"},le=[{id:"economy",label:"Economy & Jobs",icon:"💰"},{id:"healthcare",label:"Healthcare",icon:"🏥"},{id:"education",label:"Education",icon:"🎓"},{id:"security",label:"National Security",icon:"🛡️"},{id:"environment",label:"Environment",icon:"🌱"},{id:"corruption",label:"Anti-Corruption",icon:"🔍"},{id:"infrastructure",label:"Infrastructure",icon:"🏗️"},{id:"immigration",label:"Immigration",icon:"🌐"},{id:"housing",label:"Housing & Cost of Living",icon:"🏠"},{id:"crime",label:"Crime & Justice",icon:"⚖️"},{id:"labor",label:"Labor & Workers",icon:"🔨"},{id:"foreign_policy",label:"Foreign Policy",icon:"🕊️"}],de=["{party_name} Calls for Action on {topic}","{leader_name}: '{topic}' Must Be National Priority","{leader_name} Pledges Bold Agenda on {topic}","{party_name} Leader Addresses Nation on {topic}"];async function Ce(a,t){$=a,y=t;const e=document.getElementById("pa-actions-root");if(!e)return;const i=t.faction;if(!i){e.innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:300px;color:var(--text-dim);">No faction data.</div>';return}try{const{data:l}=await $.from("factions").select("momentum, party_funds, seats, action_points").eq("id",i.id).single();l&&(i.momentum=l.momentum??i.momentum,i.party_funds=l.party_funds??i.party_funds,i.seats=l.seats??i.seats,i.action_points=l.action_points??i.action_points)}catch(l){console.warn("[PartyActions] faction refresh failed, using cached state:",l)}const[s,o,n,m,f]=await Promise.all([$.from("faction_platforms").select("*").eq("faction_id",i.id).order("slot"),$.from("faction_platforms").select("*").eq("nation_id",t.nation?.id),_e($,i.id),he($,t.nation?.id,i.id),$.from("faction_electoral_standing").select("ideological_alignment, visibility, raw_appeal").eq("faction_id",i.id).eq("nation_id",t.nation?.id).maybeSingle()]);s.error&&console.error("[PartyActions] Failed to load faction platforms:",s.error.message),o.error&&console.error("[PartyActions] Failed to load nation platforms:",o.error.message),Q=s.data||[],St=o.data||[],B=n,ut=m.isOpposition,D=m.administration,f.data,await Qe(),await Ze();const{data:r}=await $.from("faction_deputies").select("*").eq("faction_id",i.id).eq("status","active").maybeSingle();O=r||null,B&&(Ut=await Xe($,i.id)),Y(e)}function Y(a){const t=y.faction,e=y.nation,i=wt(e),s=i&&e?.monarch_faction_id===t?.id,o=t.color||"#c8a832",n=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown Leader",m=t.seats||0,f=e?.total_seats||120,r=f>0?Math.round(m/f*100):0;t.action_points,t.approval_rating;const l=t.momentum??50,p=t.party_funds??0,c=He(Q,e),v=[];for(let d=1;d<=3;d++){const u=Q.find(g=>g.slot===d);if(u){const g=$t.find(C=>C.id===u.platform_key),x=c.find(C=>C.id===u.id),_=x?x.stats.filter(C=>C.met).length:0,b=x?x.stats.length:0;v.push({name:g?.name||u.platform_key,status:u.status,metCount:_,totalCount:b,slot:d})}else v.push(null)}a.innerHTML=`
        <div class="pa-page">
            <!-- Header -->
            <div class="pa-header">
                <div class="pa-header-left">
                    <span class="pa-title" style="color:${o};">${s?"Royal Court":"Party Actions"}</span>
                    <div class="pa-party-badge">
                        <div class="pa-party-dot" style="background:${o};"></div>
                        <span class="pa-party-name">${h(t.faction_name)}</span>
                    </div>
                </div>
                <div class="pa-header-stats">
                    <div class="pa-header-stat">
                        <div class="pa-header-stat-label">Party Funds</div>
                        <div class="pa-header-stat-value" style="color:var(--accent);">$${p>=1e6?(p/1e6).toFixed(1)+"M":p>=1e3?Math.round(p/1e3)+"k":p}</div>
                    </div>
                    <div class="pa-header-stat">
                        <div class="pa-header-stat-label">Momentum</div>
                        <div class="pa-header-stat-value" style="color:${l>0?"var(--text-bright)":"var(--red)"};">${Number(l).toFixed(1)}</div>
                    </div>
                    <div class="pa-header-stat">
                        <!-- This is the NATION's gov_approval, not the party's
                             own governance-score (that lives on the Parties
                             page). Labelling it "Governance" caused reports of
                             inconsistency since it read 48 here while the per-
                             party score read 0 on Parties. Label explicitly
                             so both surfaces stay coherent. -->
                        <div class="pa-header-stat-label">${i?"Legitimacy":"Nat. Approval"}</div>
                        <div class="pa-header-stat-value" style="color:var(--green);">${Math.round(Number(i?y.nation?.legitimacy??y.nation?.gov_approval??50:y.nation?.gov_approval??0))}</div>
                    </div>
                </div>
            </div>

            <!-- Status bar -->
            <div class="pa-status-bar">
                <div class="pa-status-item">
                    <div class="pa-status-label">Seats</div>
                    <div class="pa-status-value">
                        <span class="pa-status-big" style="color:${o};">${m}</span>
                        <span class="pa-status-dim">/ ${f}</span>
                        <span class="pa-status-dim">(${r}%)</span>
                    </div>
                </div>
                <div class="pa-status-item">
                    <div class="pa-status-label">Platforms</div>
                    <div style="display:flex;gap:4px;margin-top:3px;">
                        ${v.map(d=>{if(!d)return'<span class="pa-platform-slot">No Platform</span>';const u=d.status==="fulfilled"?" ✓":d.status==="failed"?" ✗":d.status==="abated"?" —":"",g=d.status==="fulfilled"?"fulfilled":d.status==="failed"?"failed":d.status==="abated"?"abated":"filled",x=d.totalCount>0?`${d.metCount}/${d.totalCount}`:"";return`<span class="pa-platform-slot ${g}" title="${d.metCount} of ${d.totalCount} stats on target">${h(d.name)}${x?` (${x})`:""}${u}</span>`}).join("")}
                    </div>
                </div>
            </div>

            <!-- Main layout -->
            <div class="pa-main">
                <!-- Leader sidebar -->
                <div class="pa-leaders" id="pa-leaders">
                    ${ea(n,o,t)}
                </div>

                <!-- Actions panel -->
                <div class="pa-actions-panel" id="pa-actions-panel">
                    ${aa(n,o,t)}
                </div>
            </div>
        </div>

        <!-- Statement Modal -->
        <div class="pa-modal-overlay" id="pa-statement-modal"></div>
        <!-- Platform Modal -->
        <div class="pa-modal-overlay" id="pa-platform-modal"></div>
        <!-- Hire Agitator Modal -->
        <div class="pa-modal-overlay" id="pa-hire-modal"></div>
        <!-- File Lawsuit Modal -->
        <div class="pa-modal-overlay" id="pa-lawsuit-modal"></div>
        <!-- Appoint PM Modal -->
        <div class="pa-modal-overlay" id="pa-appoint-pm-modal"></div>
        <!-- Modernize Modal -->
        <div class="pa-modal-overlay" id="pa-modernize-modal"></div>
        <!-- Rebrand Modal -->
        <div class="pa-modal-overlay" id="pa-rebrand-modal"></div>
        <!-- Hire Deputy Modal -->
        <div class="pa-modal-overlay" id="pa-deputy-modal"></div>
        <!-- Rally Modal -->
        <div class="pa-modal-overlay" id="pa-rally-modal"></div>
        <!-- Grant/Revoke Seats Modal -->
        <div class="pa-modal-overlay" id="pa-royal-modal"></div>
    `,document.getElementById("pa-leaders")?.addEventListener("click",d=>{const u=d.target.closest(".pa-leader-card");if(!u||u.classList.contains("vacant"))return;const g=u.dataset.role;g&&g!==K&&(K=g,Y(a))}),document.getElementById("pa-actions-panel")?.addEventListener("click",d=>{const u=d.target.closest(".pa-action-item");if(!u||u.classList.contains("locked"))return;const g=u.dataset.actionId;g==="fundraise"?wa(a):g==="grant_seats"?ya(a):g==="revoke_seats"?ba(a):g==="rally"?ra(a):g==="statement"?$a(a):g==="platform"?ka(a):g==="file_lawsuit"?ua(a):g==="appoint_pm"?ga(a):g==="modernize"?da(a):g==="rebrand"?ca(a):g==="no_confidence"?_a():g==="call_early_elections"?xa():g==="resign_as_pm"&&ha()}),document.getElementById("pa-hire-agitator-btn")?.addEventListener("click",()=>fe(a)),document.getElementById("pa-hire-agitator-panel")?.addEventListener("click",d=>{d.target.closest("#pa-hire-agitator-btn")||fe(a)}),document.getElementById("pa-hire-deputy-btn")?.addEventListener("click",()=>pe(a)),document.getElementById("pa-hire-deputy-panel")?.addEventListener("click",d=>{d.target.closest("#pa-hire-deputy-btn")||pe(a)})}function ea(a,t,e){const i=wt(y.nation)&&y.nation?.monarch_faction_id===e?.id;return $e.map(s=>{const o=s.id==="leader",n=s.id==="agitator",m=K===s.id;let f,r,l,p,c;if(o){f=!1,r=a,l=W(e.leader_first_name,e.leader_last_name),p=Ee.length;const u=wt(y.nation);if(u&&y.nation?.monarch_faction_id===e.id)c={text:(y.nation?.monarch_title||"KING").toUpperCase(),color:"#c8a832"};else if(u)c={text:"NOBLE HOUSE",color:"#8b9a6b"};else{const x=D?.pm_party_id===e.id,_=y.nation?.hos_election_method==="elected"&&D?.president_party_id===e.id;x?c={text:"PRIME MINISTER",color:"#5cc55c"}:_?c={text:"PRESIDENT",color:"#5cc55c"}:ut?c={text:"OPPOSITION",color:"#c84"}:c={text:"GOVERNING",color:"#8b9a6b"}}}else n&&B?(f=!1,r=`${B.first_name} ${B.last_name}`,l=W(B.first_name,B.last_name),p=1):n&&!B?(f=!1,r="Not Hired",l="+",p=0):s.id==="deputy"&&O?(f=!1,r=`${O.first_name} ${O.last_name}`,l=W(O.first_name,O.last_name),p=1):s.id==="deputy"&&!O?(f=!1,r="Not Hired",l="+",p=0):s.id==="campaign"?(f=!1,r="Campaign Mgr",l="CM",p=Me.length):(f=!0,r="Vacant",l="—",p=0);const v=s.oppositionOnly&&!ut;return`
            <div class="pa-leader-card ${m?"active":""} ${f?"vacant":""} ${v?"vacant":""}"
                 data-role="${s.id}"
                 style="${m?`border-left-color:${s.color};`:""}${v?"opacity:0.35;":""}">
                ${s.oppositionOnly?`<div style="position:absolute;top:0;right:0;font-family:var(--font-mono);font-size:5px;font-weight:700;letter-spacing:0.04em;padding:1px 4px;color:${v?"var(--text-dim)":"#d44a4a"};background:${v?"rgba(100,100,100,0.1)":"rgba(212,74,74,0.1)"};border:1px solid ${v?"rgba(100,100,100,0.2)":"rgba(212,74,74,0.2)"};border-top:none;border-right:none;">${v?"IN GOVERNMENT":"OPPOSITION ONLY"}</div>`:""}
                <div class="pa-leader-top">
                    <div class="pa-leader-avatar" style="color:${s.color};background:${s.color}15;border-color:${s.color}33;">${l}</div>
                    <div class="pa-leader-info">
                        <div class="pa-leader-role">
                            <span class="pa-leader-role-label" style="color:${s.color};">${o&&i?(y.nation?.monarch_title||"King").toUpperCase():s.title}</span>
                            ${p>0?`<span class="pa-leader-role-count">${p} actions</span>`:""}
                        </div>
                        <div class="pa-leader-name">${h(r)}</div>
                        ${c?`<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:${c.color};margin-top:2px;">${c.text}</div>`:""}
                        ${n&&B?`<div style="display:flex;align-items:center;gap:3px;margin-top:2px;"><div style="flex:1;height:2px;background:var(--border-mid);"><div style="height:100%;width:${B.skill}%;background:${ct(B.skill).color};"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);width:16px;text-align:right;">${B.skill}</span></div>`:""}
                        ${n&&!B?'<div style="font-family:var(--font-mono);font-size:7px;color:#d44a4a;margin-top:2px;">Click to recruit</div>':""}
                    </div>
                </div>
            </div>
        `}).join("")+`
        <div class="pa-threats">
            <div class="pa-threats-title">Threats</div>
            <div class="pa-threats-row">
                <span class="pa-threats-label">Active scandals</span>
                <span class="pa-threats-value">0</span>
            </div>
            <div class="pa-threats-row">
                <span class="pa-threats-label">Media investigations</span>
                <span class="pa-threats-value">0</span>
            </div>
            <div class="pa-threats-row">
                <span class="pa-threats-label">Oppo research against us</span>
                <span class="pa-threats-value">?</span>
            </div>
        </div>
    `}function aa(a,t,e){const i=wt(y.nation),s=i&&y.nation?.monarch_faction_id===e?.id,o=$e.find(b=>b.id===K);if(!o)return"";const n=K==="leader",m=K==="agitator",f=K==="campaign",r=K==="deputy";if(!n&&!m&&!f&&!r)return`
            <div class="pa-vacant-msg">
                <div>
                    <div class="pa-vacant-title">${h(o.fullTitle)} — Vacant</div>
                    <div class="pa-vacant-sub">This position has not been filled. Recruitment coming in a future update.</div>
                </div>
            </div>
        `;if(m&&!ut)return`
            <div class="pa-vacant-msg" style="opacity:0.4;">
                <div style="text-align:center;">
                    <div style="font-size:2rem;margin-bottom:12px;opacity:0.3;">🚫</div>
                    <div class="pa-vacant-title">Agitator Unavailable</div>
                    <div class="pa-vacant-sub" style="max-width:400px;margin:8px auto;">
                        Your party is in government. The Agitator role is only available to opposition parties.
                    </div>
                </div>
            </div>
        `;if(m&&!B)return`
            <div class="pa-vacant-msg" style="cursor:pointer;" id="pa-hire-agitator-panel">
                <div style="text-align:center;">
                    <div style="font-size:2rem;margin-bottom:12px;opacity:0.4;">&#9760;</div>
                    <div class="pa-vacant-title">Hire an Opposition Coordinator</div>
                    <div class="pa-vacant-sub" style="max-width:400px;margin:8px auto 16px;">
                        The Agitator leads your opposition strategy — filing lawsuits, organizing protests, and applying legal and political pressure against the government.
                    </div>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-hire-agitator-btn" style="background:#d44a4a;">Search Candidates</button>
                </div>
            </div>
        `;if(m&&B)return fa(o);if(r&&!O)return`
            <div class="pa-vacant-msg" style="cursor:pointer;" id="pa-hire-deputy-panel">
                <div style="text-align:center;">
                    <div style="font-size:2rem;margin-bottom:12px;opacity:0.4;">🤝</div>
                    <div class="pa-vacant-title">Hire a Deputy Party Leader</div>
                    <div class="pa-vacant-sub" style="max-width:400px;margin:8px auto 16px;">
                        The Deputy supports your party leader — organizing rallies, boosting momentum, and energizing the base.
                    </div>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-hire-deputy-btn" style="background:#8b9a6b;">Search Candidates</button>
                </div>
            </div>
        `;if(r&&O)return na(o);if(f)return la(o,e);const p=W(e.leader_first_name,e.leader_last_name),c=e.leader_age?`, Age ${e.leader_age}`:"",v=e.seats||0,d=e.momentum??0,_=(wt(y.nation)&&y.nation?.monarch_faction_id===e.id?ta:Ee).map(b=>{const C=b.tags.map(S=>`<span class="pa-action-tag" style="color:${Nt[S]||"var(--text-dim)"};">${S}</span>`).join("");let w="",k=b.cost,M=b.costColor,E=b.locked;if(b.id==="no_confidence")if(!!D&&D.pm_party_id===e.id)E=!0,b.lockReason="Your party is the Prime Minister — file from another party.";else if(Yt)E=!0,b.lockReason="A motion of no confidence is already pending in Parliament.";else if(Lt>0){E=!0;const N=Lt;b.lockReason=`Cooldown: ${N} tick${N!==1?"s":""} remaining before another motion can be filed against this PM party.`}else!D||!D.pm_party_id?(E=!0,b.lockReason="No active Prime Minister to file against."):b.lockReason="";else if(b.id==="call_early_elections"||b.id==="resign_as_pm"){const S=y.nation,N=Tt(S),I=!!D&&D.pm_party_id===e.id;N?I?y.nation&&y.nation.__coalition_status==="caretaker"?(E=!0,b.lockReason="Government is already in caretaker mode."):b.lockReason="":(E=!0,b.lockReason="Prime Minister’s party only."):(E=!0,b.lockReason="Only parliamentary and semi-presidential systems have a PM seat.")}else if(b.id==="fundraise"){const S=ke(v,lt);k=`-${S.momCost} MOM`,M="#c84",w=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);display:flex;gap:12px;">
                <span>Raises: <span style="color:var(--accent);font-weight:700;">$${(S.raised/1e3).toFixed(0)}k</span></span>
                <span>$${(S.perSeat/1e3).toFixed(0)}k/seat × ${v}</span>
                ${lt>0?`<span style="color:var(--orange);">Use #${lt+1}</span>`:""}
            </div>`,d-S.momCost<1&&(E=!0,w+=`<div style="margin-top:3px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Not enough momentum (need ${S.momCost}, have ${Number(d).toFixed(1)})</div>`)}return`
            <div class="pa-action-item ${E?"locked":""}" data-action-id="${b.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${h(b.name)}</span>
                        <div class="pa-action-tags">${C}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${M};">${k}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${h(b.desc)}</div>
                ${w}
                ${b.locked&&b.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${h(b.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${o.color};background:${o.color}15;border-color:${o.color}33;">${p}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${o.color};">${s?(y.nation?.monarch_title||"KING").toUpperCase():o.title}</span>
                        <span class="pa-detail-name">${h(a)}</span>
                        ${i&&y.nation?.dynasty_name?`<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);font-style:italic;">House ${h(y.nation.dynasty_name)}</span>`:""}
                    </div>
                    <div class="pa-detail-meta">${s?h((y.nation?.monarch_title||"King")+" of "+(y.nation?.name||"")):h(o.fullTitle)+" &middot; "+h(e.faction_name)}${c}${(()=>{if(s)return' <span style="color:#c8a832;font-weight:700;"> &middot; '+(y.nation?.monarch_title||"MONARCH").toUpperCase()+"</span>";if(i)return' <span style="color:#8b9a6b;font-weight:700;"> &middot; NOBLE HOUSE</span>';const b=D?.pm_party_id===e.id,C=y.nation?.hos_election_method==="elected"&&D?.president_party_id===e.id;return b?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRIME MINISTER</span>':C?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRESIDENT</span>':ut?' <span style="color:#c84;font-weight:700;"> &middot; OPPOSITION</span>':' <span style="color:#8b9a6b;font-weight:700;"> &middot; GOVERNING</span>'})()}</div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list">
            ${_}
        </div>
        <div class="pa-skill-footer">
            <span style="color:${o.color};font-weight:700;">${o.title}</span> actions are executed by the party leader. Effectiveness depends on party approval and momentum.
        </div>
    `}const ia=[{id:"rally",name:"Hold a Rally",desc:"Invest party funds into a public rally. Higher investment improves your odds, but a bad roll can backfire. Roll 1d6 + rally bonus for momentum.",cost:"$50k-$200k",costColor:"#8b9a6b",tags:["CAMPAIGN","RISKY"],locked:!1}],ce=[{cost:5e4,bonus:1,label:"$50k (+1)"},{cost:8e4,bonus:2,label:"$80k (+2)"},{cost:12e4,bonus:3,label:"$120k (+3)"},{cost:15e4,bonus:4,label:"$150k (+4)"},{cost:2e5,bonus:5,label:"$200k (+5)"}];function oa(a,t){const e=a+t;return e>=8?{momentum:3,label:"Rousing Success",color:"#5cc55c"}:e>=5?{momentum:2,label:"Solid Turnout",color:"#8b9a6b"}:e>=3?{momentum:0,label:"Flat Response",color:"#ca5"}:{momentum:-2,label:"Backfire",color:"#c55"}}function na(a){const t=ia.map(i=>{const s=i.tags.map(o=>`<span class="pa-action-tag" style="color:${Nt[o]||"var(--text-dim)"};">${o}</span>`).join("");return`
            <div class="pa-action-item ${i.locked?"locked":""}" data-action-id="${i.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${h(i.name)}</span>
                        <div class="pa-action-tags">${s}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${i.costColor};">${i.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${h(i.desc)}</div>
            </div>
        `}).join(""),e=ct(O.skill);return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${a.color};background:${a.color}15;border-color:${a.color}33;">${W(O.first_name,O.last_name)}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${a.color};">${a.title}</span>
                        <span class="pa-detail-name">${h(O.first_name)} ${h(O.last_name)}</span>
                    </div>
                    <div class="pa-detail-meta">${h(a.fullTitle)} &middot; Age ${O.age} &middot; Skill: <span style="color:${e.color};font-weight:700;">${O.skill}</span></div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list" id="pa-actions-panel">${t}</div>
    `}function sa(a){const t=Zt(a),e=t.firstNames||[],i=t.lastNames||[];if(e.length===0||i.length===0)return[];const s=5+Math.floor(Math.random()*3),o=new Set,n=[];for(let m=0;m<s;m++){let f,r,l,p=0;do f=e[Math.floor(Math.random()*e.length)],r=i[Math.floor(Math.random()*i.length)],l=f+" "+r,p++;while(o.has(l)&&p<20);o.add(l);const c=20+Math.floor(Math.random()*66),v=28+Math.floor(Math.random()*30),d=Math.max(0,c-20)/65,u=Math.round((125e3+d*525e3)/25e3)*25e3;n.push({first_name:f,last_name:r,age:v,skill:c,hire_cost:u})}return n.sort((m,f)=>f.skill-m.skill)}async function pe(a){const t=document.getElementById("pa-deputy-modal");if(!t)return;const e=y.nation?.name,i=sa(e);let s=null;function o(){const n=s!=null?i[s]:null,m=n?ct(n.skill):null,f=i.map((p,c)=>{const v=s===c,d=ct(p.skill);return`<div class="pa-hire-row ${v?"selected":""}" data-idx="${c}">
                <div style="width:32px;height:32px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#8b9a6b;flex-shrink:0;">${W(p.first_name,p.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${v?"var(--text-bright)":"var(--text-secondary)"};">${h(p.first_name)} ${h(p.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${p.skill}%;background:${d.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${d.color};">${p.skill}</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Age ${p.age}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);">$${Math.round(p.hire_cost/1e3)}k</div>
                </div>
            </div>`}).join("");let r;n?r=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#8b9a6b;">${W(n.first_name,n.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${h(n.first_name)} ${h(n.last_name)}</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:1px;">Age ${n.age} &middot; Deputy Leader Candidate</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">SKILL</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${n.skill}%;background:${m.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${m.color};">${n.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${m.color};margin-top:3px;font-weight:700;">${m.label}</div>
                        </div>
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">HIRE COST</div>
                            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--accent);">$${Math.round(n.hire_cost/1e3)}k</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:3px;">From party funds</div>
                        </div>
                    </div>
                    <div style="padding:8px 10px;background:rgba(139,154,107,0.04);border:1px solid rgba(139,154,107,0.12);">
                        <div style="font-family:var(--font-mono);font-size:7px;color:#8b9a6b;letter-spacing:0.06em;margin-bottom:3px;">ROLE: DEPUTY PARTY LEADER</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Organizes rallies, boosts momentum, and energizes the party base. Higher skill improves rally outcomes.</div>
                    </div>
                </div>
                <div style="padding:10px 20px;border-top:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:flex-end;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-right:auto;">Cost: <span style="color:var(--accent);font-weight:700;">$${Math.round(n.hire_cost/1e3)}k</span></span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-dep-hire-confirm" style="background:#8b9a6b;"${(y.faction?.party_funds||0)<n.hire_cost?' disabled title="Not enough funds"':""}>Hire ${h(n.first_name)}</button>
                </div>
            `:r=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;"><div style="text-align:center;">
                <div style="font-family:var(--font-mono);font-size:24px;color:var(--border-mid);margin-bottom:8px;">←</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Select a candidate to review</div>
            </div></div>`,t.innerHTML=`
            <div style="width:100%;max-width:700px;background:var(--bg-panel);border:1px solid var(--border-mid);box-shadow:0 20px 60px rgba(0,0,0,0.5);display:flex;flex-direction:column;max-height:80vh;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#8b9a6b;"></div>
                        <span class="pa-modal-title">Hire Deputy Leader</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:8px;">${i.length} candidates</span>
                    </div>
                    <button class="pa-modal-close" id="pa-dep-close">&times;</button>
                </div>
                <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
                    <div style="width:240px;border-right:1px solid var(--border-main);overflow-y:auto;" id="pa-dep-list">${f}</div>
                    <div style="flex:1;overflow-y:auto;">${r}</div>
                </div>
            </div>
        `;const l=()=>t.classList.remove("active");document.getElementById("pa-dep-close")?.addEventListener("click",l),t.onclick=p=>{p.target===t&&l()},document.getElementById("pa-dep-list")?.addEventListener("click",p=>{const c=p.target.closest(".pa-hire-row");c&&(s=parseInt(c.dataset.idx,10),o())}),document.getElementById("pa-dep-hire-confirm")?.addEventListener("click",async()=>{if(s==null)return;const p=i[s],c=y.faction?.party_funds||0;if(c<p.hire_cost){alert("Not enough funds.");return}const v=document.getElementById("pa-dep-hire-confirm");v&&(v.disabled=!0,v.textContent="Hiring...");try{const d=c-p.hire_cost,u=y.shard?.current_tick||0,{data:g,error:x}=await $.from("faction_deputies").insert({faction_id:y.faction.id,first_name:p.first_name,last_name:p.last_name,age:p.age,skill:p.skill,status:"active",hired_at_tick:u}).select("*").single();if(x){alert("Failed: "+x.message);return}await $.from("factions").update({party_funds:d}).eq("id",y.faction.id),y.faction.party_funds=d,O=g,K="deputy",l(),Y(a)}catch(d){console.error("[Deputy] Hire error:",d)}finally{v&&(v.disabled=!1)}})}t.classList.add("active"),o()}function ra(a){const t=document.getElementById("pa-rally-modal");if(!t||!O)return;const i=y.faction.party_funds||0;let s=null,o=null;function n(){const m=ce.map((l,p)=>{const c=i>=l.cost,v=s===p;return`<div class="pa-action-item ${v?"selected":""} ${c?"":"locked"}" data-tier="${p}" style="cursor:${c?"pointer":"not-allowed"};${v?"border-color:#8b9a6b;background:rgba(139,154,107,0.06);":""}">
                <div class="pa-action-top">
                    <span style="font-size:13px;font-weight:700;color:${v?"#8b9a6b":"var(--text-bright)"};">$${Math.round(l.cost/1e3)}k Investment</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#8b9a6b;">+${l.bonus} Rally Bonus</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">Roll 1d6 + ${l.bonus} = range ${1+l.bonus} to ${6+l.bonus}</div>
            </div>`}).join("");let f="";o&&(f=`
                <div style="padding:16px;background:${o.color}08;border:1px solid ${o.color}22;margin-top:12px;">
                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${o.color};margin-bottom:4px;">${o.label}</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);margin-bottom:6px;">
                        Die roll: <strong>${o.dieRoll}</strong> + Rally bonus: <strong>${o.bonus}</strong> = <strong>${o.total}</strong>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${o.color};">
                        ${o.momentum>=0?"+":""}${o.momentum} Momentum
                    </div>
                </div>
            `),t.innerHTML=`
            <div class="pa-modal" style="width:520px;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#8b9a6b;"></div>
                        <span class="pa-modal-title">Hold a Rally</span>
                    </div>
                    <button class="pa-modal-close" id="rally-close">&times;</button>
                </div>
                <div style="padding:8px 16px;border-bottom:1px solid var(--border-main);display:flex;align-items:center;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Organized by:</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#8b9a6b;">${h(O.first_name)} ${h(O.last_name)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">&middot; Skill ${O.skill}</span>
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    <div class="pa-modal-step-label">Choose Investment Level</div>
                    <div id="rally-tiers">${m}</div>

                    <div style="margin-top:8px;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);font-family:var(--font-mono);font-size:9px;color:var(--text-dim);line-height:1.6;">
                        <strong>Outcome table:</strong> Roll 1d6 + bonus<br>
                        8-11 = <span style="color:#5cc55c;">+3 Momentum</span> &middot;
                        5-7 = <span style="color:#8b9a6b;">+2 Momentum</span> &middot;
                        3-4 = <span style="color:#ca5;">+0 Momentum</span> &middot;
                        1-2 = <span style="color:#c55;">-2 Momentum</span>
                    </div>

                    ${f}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="rally-cancel">${o?"Close":"Cancel"}</button>
                    ${o?"":`<button class="pa-modal-btn pa-modal-btn--submit" id="rally-submit" style="background:#8b9a6b;" ${s==null?"disabled":""}>Hold Rally</button>`}
                </div>
            </div>
        `;const r=()=>{t.classList.remove("active"),o&&Y(a)};document.getElementById("rally-close")?.addEventListener("click",r),document.getElementById("rally-cancel")?.addEventListener("click",r),t.onclick=l=>{l.target===t&&r()},document.getElementById("rally-tiers")?.addEventListener("click",l=>{const p=l.target.closest("[data-tier]");!p||p.classList.contains("locked")||(s=parseInt(p.dataset.tier,10),n())}),document.getElementById("rally-submit")?.addEventListener("click",async()=>{if(s==null||o)return;const l=ce[s],{data:p}=await $.from("factions").select("party_funds, momentum").eq("id",y.faction.id).single(),c=p?.party_funds||0;if(c<l.cost){alert("Not enough funds.");return}y.faction.party_funds=c,y.faction.momentum=p?.momentum??y.faction.momentum;const v=document.getElementById("rally-submit");v&&(v.disabled=!0,v.textContent="Rolling...");try{const d=1+Math.floor(Math.random()*6),u=oa(d,l.bonus),g=c-l.cost,x=Math.max(1,(y.faction.momentum||0)+u.momentum);await $.from("factions").update({party_funds:g,momentum:x}).eq("id",y.faction.id);const _=y.shard?.current_tick||0;await $.from("campaign_actions").insert({party_id:y.faction.id,nation_id:y.nation?.id,action_type:"rally",ap_cost:0,money_cost:l.cost,tick_performed:_,result:{dieRoll:d,bonus:l.bonus,total:d+l.bonus,momentum:u.momentum,label:u.label}}),y.faction.party_funds=g,y.faction.momentum=x,sessionStorage.removeItem("nationhood_state"),o={...u,dieRoll:d,bonus:l.bonus,total:d+l.bonus},n()}catch(d){console.error("[Rally] Error:",d),alert("Rally failed.")}})}t.classList.add("active"),n()}const Me=[{id:"modernize",name:"Modernize Image",desc:"Upload a custom logo to refresh your party's brand. Grants +1 Momentum/tick while a custom logo is active. Quick and affordable.",cost:"$50k",costColor:"#5a8aaa",moneyCost:5e4,tags:["CAMPAIGN","BRANDING"],locked:!1},{id:"rebrand",name:"Rebrand Party",desc:'Change your party name, abbreviation, color, logo, and description. Costly but grants a "Fresh Start" modifier. Nuclear option after scandal or major defeat.',cost:"$150k",costColor:"#c84",moneyCost:15e4,tags:["CAMPAIGN","STRUCTURAL"],locked:!1}],me=[{id:"crimson",hex:"#c43a3a",name:"Crimson"},{id:"scarlet",hex:"#d45a2a",name:"Scarlet"},{id:"amber",hex:"#c8a832",name:"Amber"},{id:"gold",hex:"#d4a017",name:"Gold"},{id:"olive",hex:"#8a9a4a",name:"Olive"},{id:"emerald",hex:"#2a8a4a",name:"Emerald"},{id:"forest",hex:"#3a6a3a",name:"Forest"},{id:"teal_c",hex:"#2a8a7a",name:"Teal"},{id:"sky",hex:"#4a8aba",name:"Sky"},{id:"cobalt",hex:"#3a5a9a",name:"Cobalt"},{id:"navy",hex:"#2a3a6a",name:"Navy"},{id:"violet",hex:"#7a4a9a",name:"Violet"},{id:"plum",hex:"#8a3a7a",name:"Plum"},{id:"rose",hex:"#ba4a6a",name:"Rose"},{id:"slate",hex:"#5a6a7a",name:"Slate"},{id:"iron",hex:"#4a4a4a",name:"Iron"}],Vt=[{emoji:"🏛️",name:"Parliament"},{emoji:"⚖️",name:"Scales"},{emoji:"🗽",name:"Liberty"},{emoji:"🕊️",name:"Dove"},{emoji:"🦅",name:"Eagle"},{emoji:"🦁",name:"Lion"},{emoji:"🐻",name:"Bear"},{emoji:"🐉",name:"Dragon"},{emoji:"🐘",name:"Elephant"},{emoji:"🏔️",name:"Mountain"},{emoji:"🌊",name:"Wave"},{emoji:"🔥",name:"Flame"},{emoji:"⭐",name:"Star"},{emoji:"🌟",name:"Glow Star"},{emoji:"💎",name:"Diamond"},{emoji:"🛡️",name:"Shield"},{emoji:"⚔️",name:"Swords"},{emoji:"🏗️",name:"Builder"},{emoji:"🌿",name:"Leaf"},{emoji:"🌾",name:"Wheat"},{emoji:"🔨",name:"Hammer"},{emoji:"⚡",name:"Lightning"},{emoji:"🎯",name:"Target"},{emoji:"🏴",name:"Flag"},{emoji:"🚩",name:"Red Flag"},{emoji:"✊",name:"Fist"},{emoji:"🤝",name:"Handshake"},{emoji:"📜",name:"Scroll"},{emoji:"🗳️",name:"Ballot"},{emoji:"👑",name:"Crown"}];function la(a,t){const e=Me.map(i=>{const s=i.tags.map(o=>`<span class="pa-action-tag" style="color:${Nt[o]||"var(--text-dim)"};">${o}</span>`).join("");return`
            <div class="pa-action-item ${i.locked?"locked":""}" data-action-id="${i.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${h(i.name)}</span>
                        <div class="pa-action-tags">${s}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${i.costColor};">${i.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${h(i.desc)}</div>
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${a.color};background:${a.color}15;border-color:${a.color}33;">CM</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${a.color};">${a.title}</span>
                    </div>
                    <div class="pa-detail-meta">${h(a.fullTitle)} &middot; ${h(t.faction_name)}</div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list" id="pa-actions-panel">${e}</div>
        <div style="padding:8px 14px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);line-height:1.6;">
            <strong style="color:var(--text-secondary);">CAMPAIGN MANAGER</strong> actions shape your party's public identity and electoral strategy.
        </div>
    `}function da(a){const t=document.getElementById("pa-modernize-modal");if(!t)return;const e=y.faction;let i=null,s=e.custom_logo_url||null,o=!1;function n(){const m=!!s,r=Number(e.party_funds??0)>=5e4,l=!!i&&r&&!o;t.innerHTML=`
            <div class="pa-modal" style="width:440px;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#5a8aaa;"></div>
                        <span class="pa-modal-title">Modernize Image</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:#5a8aaa;background:rgba(90,138,170,0.06);border:1px solid rgba(90,138,170,0.15);">$50k</span>
                    </div>
                    <button class="pa-modal-close" id="mod-close">&times;</button>
                </div>
                <div style="padding:12px 20px;border-bottom:1px solid var(--border-main);font-size:11px;color:var(--text-secondary);line-height:1.5;">
                    Upload a custom logo to modernize your party's image. Grants <span style="color:#5cc55c;font-weight:700;">+1 Momentum/tick</span> while active.
                </div>
                <div class="pa-modal-body" style="display:flex;flex-direction:column;align-items:center;gap:16px;padding:24px 20px;">
                    <div style="width:80px;height:80px;border:2px dashed ${m?"var(--accent)":"var(--border-mid)"};border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:var(--bg-card);">
                        ${s?`<img src="${h(s)}" style="width:100%;height:100%;object-fit:cover;">`:'<span style="font-size:24px;color:var(--text-dim);">+</span>'}
                    </div>
                    <div style="text-align:center;">
                        <label style="display:inline-block;padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright);background:var(--bg-card);border:1px solid var(--border-mid);cursor:pointer;letter-spacing:0.06em;">
                            ${m?"CHANGE LOGO":"UPLOAD LOGO"}
                            <input type="file" accept="image/*" id="mod-file-input" style="display:none;">
                        </label>
                        ${e.custom_logo_url&&!i?'<div style="font-family:var(--font-mono);font-size:8px;color:var(--green);margin-top:6px;">Current logo active — +1 Momentum/tick</div>':""}
                        ${i?'<div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);margin-top:6px;">New logo ready to upload</div>':""}
                    </div>
                    ${r?"":'<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">Insufficient funds. Need $50k.</div>'}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="mod-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="mod-submit" ${l?"":"disabled"} style="background:#5a8aaa;">Modernize — $50k</button>
                </div>
            </div>
        `,document.getElementById("mod-close")?.addEventListener("click",()=>t.classList.remove("active")),document.getElementById("mod-cancel")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=p=>{p.target===t&&t.classList.remove("active")},document.getElementById("mod-file-input")?.addEventListener("change",p=>{const c=p.target.files?.[0];if(c){if(c.size>2*1024*1024){alert("Logo must be under 2MB.");return}i=c,s=URL.createObjectURL(c),n()}}),document.getElementById("mod-submit")?.addEventListener("click",async()=>{if(o||!i)return;o=!0;const p=document.getElementById("mod-submit");p&&(p.disabled=!0,p.textContent="Uploading...");try{const c=i.name.split(".").pop()?.toLowerCase()||"png",v=`${e.id}/logo_${Date.now()}.${c}`,{error:d}=await $.storage.from("party-logos").upload(v,i,{cacheControl:"3600",upsert:!0,contentType:i.type});if(d)throw new Error("Upload failed: "+d.message);const{data:u}=$.storage.from("party-logos").getPublicUrl(v),g=u?.publicUrl;if(!g)throw new Error("Failed to get logo URL");const x=Math.max(0,Number(e.party_funds??0)-5e4),{error:_}=await $.from("factions").update({custom_logo_url:g,party_funds:x}).eq("id",e.id);if(_)throw _;e.custom_logo_url=g,e.party_funds=x,t.classList.remove("active"),alert("Logo updated! Your party now earns +1 Momentum/tick from the modernized image."),Y(a)}catch(c){alert("Modernize failed: "+(c.message||"Error")),o=!1,p&&(p.disabled=!1,p.textContent="Modernize — $50k")}})}t.classList.add("active"),n()}function ca(a){const t=document.getElementById("pa-rebrand-modal");if(!t)return;const e=y.faction;y.nation;const i=e.momentum??50;(y._allParties||[]).filter(c=>c.id!==e.id);const s={current:e.party_color||"#4a8aba"},o={current:0},n={current:e.custom_logo_url||null},m={current:null},f={current:!!e.custom_logo_url},r={current:!1};function l(){return s.current}function p(){const c=l(),v=me.find(k=>k.hex===c)?.name||"Custom",d=Vt[o.current]?.emoji||"🏛️",u=f.current&&(n.current||m.current),g=n.current||(m.current?URL.createObjectURL(m.current):null),x=document.getElementById("rb-name")?.value??e.faction_name??"",_=document.getElementById("rb-abbr")?.value??e.abbreviation??"",b=document.getElementById("rb-desc")?.value??"",C=me.map(k=>{const M=c===k.hex;return`<div class="rb-color-swatch ${M?"selected":""}" data-hex="${k.hex}" style="background:${k.hex};${M?`box-shadow:0 0 8px ${k.hex}44;border:2px solid var(--text-bright);`:""}">
                ${M?'<span style="font-size:10px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.5);">✓</span>':""}
            </div>`}).join(""),w=Vt.map((k,M)=>{const E=o.current===M;return`<div class="rb-logo-item ${E?"selected":""}" data-idx="${M}" style="${E?`background:${c}15;border:2px solid ${c};box-shadow:0 0 6px ${c}33;`:""}">
                ${k.emoji}
            </div>`}).join("");t.innerHTML=`
            <div class="pa-modal" style="width:780px;max-width:100%;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#c84;"></div>
                        <span class="pa-modal-title">Rebrand Party</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:#c84;background:rgba(204,136,68,0.06);border:1px solid rgba(204,136,68,0.15);">$150k</span>
                        <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:#c55;background:rgba(204,85,85,0.06);border:1px solid rgba(204,85,85,0.15);">-10 MOMENTUM</span>
                    </div>
                    <button class="pa-modal-close" id="rb-close">&times;</button>
                </div>

                <!-- Warning banner -->
                <div style="padding:8px 20px;background:rgba(212,74,74,0.04);border-bottom:1px solid var(--border-main);display:flex;align-items:center;gap:8px;">
                    <span style="font-size:12px;">⚠</span>
                    <div style="font-size:10px;color:var(--text-secondary);line-height:1.5;">
                        Rebranding costs <span style="color:#c55;font-weight:700;">10 Momentum</span> and resets approval <span style="color:#c55;font-weight:700;">-3 across all voter blocs</span> but grants a <span style="color:#5c5;font-weight:700;">"Fresh Start"</span> modifier. 120 tick cooldown.
                    </div>
                </div>

                <div style="display:flex;">
                    <!-- LEFT: Form -->
                    <div style="flex:1;padding:14px 20px;border-right:1px solid var(--border-main);">
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Name</div>
                            <input class="pa-modal-input" id="rb-name" value="${h(x)}" maxlength="60" style="font-size:13px;font-weight:600;">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${x.length}/60 · Min 3</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Abbreviation</div>
                            <input class="pa-modal-input" id="rb-abbr" value="${h(_)}" maxlength="4" style="width:100px;font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;color:${c};">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">2-4 uppercase letters</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Description</div>
                            <textarea class="pa-modal-input" id="rb-desc" rows="3" style="resize:vertical;font-family:var(--font-ui);font-size:11px;line-height:1.5;">${h(b)}</textarea>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${b.length}/200 · Visible to all</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Color — <span style="color:${c};">${h(v)}</span></div>
                            <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;" id="rb-colors">${C}</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Logo — ${u?'<span style="color:var(--teal);">Custom</span>':"Preset"}</div>
                            <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px;margin-bottom:8px;${u?"opacity:0.3;":""}" id="rb-logos">${w}</div>
                            <!-- Custom upload section -->
                            <div style="border:1px ${u?"solid var(--teal)":"dashed var(--border-mid)"};padding:10px 14px;background:${u?"rgba(90,170,138,0.04)":"var(--bg-card)"};">
                                ${u&&g?`
                                    <div style="display:flex;align-items:center;gap:12px;">
                                        <img src="${g}" style="width:48px;height:48px;object-fit:contain;border:1px solid var(--border-main);background:var(--bg-card);" alt="Custom logo">
                                        <div style="flex:1;">
                                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--teal);font-weight:700;">CUSTOM LOGO ACTIVE</div>
                                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${m.current?m.current.name:"Saved logo"}</div>
                                        </div>
                                        <div id="rb-remove-logo" style="font-family:var(--font-mono);font-size:8px;color:#c55;cursor:pointer;padding:4px 8px;border:1px solid rgba(204,85,85,0.2);">REMOVE</div>
                                    </div>
                                `:`
                                    <div style="display:flex;align-items:center;gap:10px;">
                                        <div style="font-size:18px;opacity:0.3;">🎨</div>
                                        <div style="flex:1;">
                                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);font-weight:600;">Or upload a custom logo</div>
                                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:1px;">PNG, JPG, SVG, or WebP · Max 2MB · Transparent background recommended</div>
                                        </div>
                                        <label id="rb-upload-label" style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--teal);padding:4px 12px;border:1px solid rgba(90,170,138,0.3);cursor:pointer;">
                                            UPLOAD
                                            <input type="file" id="rb-logo-file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style="display:none;">
                                        </label>
                                    </div>
                                `}
                            </div>
                        </div>
                    </div>

                    <!-- RIGHT: Preview -->
                    <div style="width:240px;padding:14px 16px;display:flex;flex-direction:column;gap:10px;flex-shrink:0;">
                        <div class="pa-modal-step-label">Live Preview</div>
                        <div style="background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${c};padding:10px;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                                <div style="width:40px;height:40px;background:${c}15;border:1.5px solid ${c};display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden;">
                                    ${u&&g?`<img src="${g}" style="width:100%;height:100%;object-fit:contain;" alt="">`:d}
                                </div>
                                <div>
                                    <div style="font-size:12px;font-weight:700;color:var(--text-bright);line-height:1.2;">${h(x||"Party Name")}</div>
                                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${c};letter-spacing:1px;">${h(_||"???")}</div>
                                </div>
                            </div>
                            <div style="font-size:9px;color:var(--text-secondary);line-height:1.5;">${h(b||"No description...")}</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);margin-bottom:3px;">BADGES</div>
                            <div style="display:flex;gap:3px;flex-wrap:wrap;">
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${c};background:${c}0a;border:1px solid ${c}25;">${h(_)}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${c};background:${c}0a;border:1px solid ${c}25;">MEMBER</span>
                            </div>
                        </div>
                        <div style="padding:6px 8px;background:${c}08;border:1px solid ${c}25;display:flex;align-items:center;gap:8px;">
                            <div style="width:20px;height:20px;background:${c};"></div>
                            <div>
                                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${c};">${h(v.toUpperCase())}</div>
                                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${c}</div>
                            </div>
                        </div>

                        <!-- Cost summary -->
                        <div style="padding:8px;background:rgba(204,85,85,0.04);border:1px solid rgba(204,85,85,0.12);margin-top:auto;">
                            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-dim);margin-bottom:4px;">COST SUMMARY</div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="font-size:9px;color:var(--text-secondary);">Party Funds</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c84;">$150k</span></div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="font-size:9px;color:var(--text-secondary);">Momentum</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c55;">-10 (${i} → ${Math.max(1,i-10)})</span></div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="font-size:9px;color:var(--text-secondary);">Approval</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c55;">-3 all blocs</span></div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="font-size:9px;color:var(--text-secondary);">Cooldown</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#d44a4a;">120 ticks</span></div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;border-top:1px solid var(--border-main);margin-top:3px;padding-top:3px;"><span style="font-size:9px;color:#5c5;">Gain</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#5c5;">"Fresh Start" modifier</span></div>
                        </div>
                    </div>
                </div>

                <div class="pa-modal-footer" style="justify-content:space-between;">
                    <div style="max-width:400px;font-size:9px;color:var(--text-secondary);line-height:1.5;" id="rb-footer-msg">
                        ${r.current?'<span style="color:#d44a4a;font-weight:700;">⚠ Final confirmation. This costs $150k, 10 Momentum, and -3 approval. Cannot rebrand again for 120 ticks.</span>':"This will change your party's identity across all UI, media, and diplomatic channels."}
                    </div>
                    <div style="display:flex;gap:6px;">
                        ${r.current?`
                            <button class="pa-modal-btn pa-modal-btn--cancel" id="rb-back">Go Back</button>
                            <button class="pa-modal-btn" id="rb-confirm" style="background:#d44a4a;color:#fff;">⚠ Confirm Rebrand</button>
                        `:`
                            <button class="pa-modal-btn pa-modal-btn--cancel" id="rb-cancel">Cancel</button>
                            <button class="pa-modal-btn pa-modal-btn--submit" id="rb-submit" style="background:#c84;">Rebrand</button>
                        `}
                    </div>
                </div>
            </div>
        `}t._rbCustomLogoFile=null,t._rbCustomLogoUrl=n.current,t._rbUseCustomLogo=f.current,p(),t.classList.add("active"),t.addEventListener("change",function(v){if(v.target.id==="rb-logo-file"){const d=v.target.files?.[0];if(!d)return;if(d.size>2*1024*1024){alert("Logo must be under 2MB. Selected file: "+(d.size/(1024*1024)).toFixed(1)+"MB"),v.target.value="";return}if(!["image/png","image/jpeg","image/svg+xml","image/webp"].includes(d.type)){alert("Unsupported file type. Use PNG, JPG, SVG, or WebP."),v.target.value="";return}m.current=d,n.current=null,f.current=!0,t._rbCustomLogoFile=d,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!0,p()}}),t.addEventListener("click",function c(v){if(v.target===t||v.target.closest("#rb-close")||v.target.closest("#rb-cancel")){t.classList.remove("active"),t.removeEventListener("click",c);return}const d=v.target.closest(".rb-color-swatch");if(d){s.current=d.dataset.hex,p();return}const u=v.target.closest(".rb-logo-item");if(u){o.current=parseInt(u.dataset.idx)||0,f.current=!1,t._rbUseCustomLogo=!1,p();return}if(v.target.closest("#rb-remove-logo")){n.current=null,m.current=null,f.current=!1,t._rbCustomLogoFile=null,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!1,p();return}if(v.target.closest("#rb-submit")){const g=document.getElementById("rb-name")?.value?.trim()||"",x=document.getElementById("rb-abbr")?.value?.trim()||"";if(g.length<3||x.length<2){alert("Name must be 3+ chars, abbreviation 2-4 chars.");return}r.current=!0,p();return}if(v.target.closest("#rb-back")){r.current=!1,p();return}if(v.target.closest("#rb-confirm")){pa(t,a,c);return}})}async function pa(a,t,e){const i=y.faction,s=document.getElementById("rb-name")?.value?.trim()||"",o=document.getElementById("rb-abbr")?.value?.trim()||"";document.getElementById("rb-desc")?.value?.trim();const n=document.querySelector(".rb-color-swatch.selected")?.dataset?.hex||i.party_color,m=document.querySelector(".rb-logo-item.selected")?.dataset?.idx,f=m!=null?Vt[parseInt(m)]?.emoji:null,r=a._rbCustomLogoFile,l=a._rbUseCustomLogo,p=a._rbCustomLogoUrl,c=document.getElementById("rb-confirm");c&&(c.disabled=!0,c.textContent="Rebranding...");try{const v=y.shard?.current_tick||0;let d=p;if(l&&r){const b=r.name.split(".").pop()?.toLowerCase()||"png",C=`${i.id}/logo_${Date.now()}.${b}`,{data:w,error:k}=await $.storage.from("party-logos").upload(C,r,{cacheControl:"3600",upsert:!0,contentType:r.type});if(k){console.error("[Rebrand] Logo upload failed:",k.message),alert("Logo upload failed: "+k.message);return}const{data:M}=$.storage.from("party-logos").getPublicUrl(C);d=M?.publicUrl||null}else l||(d=null);const u=15e4,g=i.party_funds||0;if(g<u){alert(`Not enough funds. You have $${Math.round(g/1e3)}k, need $150k.`);return}const x=g-u,_=Math.max(1,(i.momentum||0)-10);await $.from("factions").update({party_funds:x,momentum:_,faction_name:s,abbreviation:o.toUpperCase(),party_color:n,party_logo:l?null:f,custom_logo_url:d,rebrand_cooldown_until_tick:v+120}).eq("id",i.id),await $.from("campaign_actions").insert({party_id:i.id,nation_id:y.nation?.id,action_type:"rebrand",ap_cost:3,money_cost:0,tick_performed:v,result:{oldName:i.faction_name,newName:s,oldAbbr:i.abbreviation,newAbbr:o,oldColor:i.party_color,newColor:n}}),i.party_funds=x,i.momentum=_,i.faction_name=s,i.abbreviation=o.toUpperCase(),i.party_color=n,i.party_logo=l?null:f,i.custom_logo_url=d,a.classList.remove("active"),a.removeEventListener("click",e),Y(t)}catch(v){console.error("[PartyActions] Rebrand error:",v),alert("Failed to rebrand: "+(v.message||v))}finally{c&&(c.disabled=!1,c.textContent="⚠ Confirm Rebrand")}}const ma=[{id:"file_lawsuit",name:"File Lawsuit",desc:"Sue a government ministry alleging corruption or negligence. 8-tick timeline with milestone events. Outcome depends on actual corruption growth since government took office.",cost:"$250k",costColor:"#c8a832",moneyCost:25e4,tags:["LEGAL","OFFENSIVE"],locked:!1}];function fa(a){const t=B,e=W(t.first_name,t.last_name),i=ct(t.skill),s=ut?'<span style="color:#5cc55c;margin-left:6px;">✓ IN OPPOSITION</span>':'<span style="color:#c84;margin-left:6px;">⚠ IN GOVERNMENT (actions limited)</span>',o=ma.map(n=>{const m=n.tags.map(f=>`<span class="pa-action-tag" style="color:${Nt[f]||"var(--text-dim)"};">${f}</span>`).join("");return`
            <div class="pa-action-item ${n.locked?"locked":""}" data-action-id="${n.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${h(n.name)}</span>
                        <div class="pa-action-tags">${m}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${n.costColor};">${n.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${h(n.desc)}</div>
                ${n.locked&&n.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${h(n.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${a.color};background:${a.color}15;border-color:${a.color}33;">${e}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${a.color};">${a.title}</span>
                        <span class="pa-detail-name">${h(t.first_name)} ${h(t.last_name)}</span>
                    </div>
                    <div class="pa-detail-meta">${h(a.fullTitle)}, Age ${t.age}${s}</div>
                </div>
            </div>
            <div style="text-align:right;">
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;">SKILL</div>
                <div style="display:flex;align-items:center;gap:4px;margin-top:1px;">
                    <div style="width:40px;height:3px;background:var(--border-mid);"><div style="height:100%;width:${t.skill}%;background:${i.color};"></div></div>
                    <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${i.color};">${t.skill}</span>
                </div>
            </div>
        </div>
        ${t.background?`<div style="padding:6px 16px;border:1px solid var(--border-main);border-top:none;border-bottom:none;background:var(--bg-panel);font-size:9px;color:var(--text-dim);font-style:italic;">${h(t.background)}</div>`:""}
        <div class="pa-actions-list">
            ${o}
        </div>
        ${va()}
        <div class="pa-skill-footer">
            <span style="color:${a.color};font-weight:700;">${a.title}</span> skill (${t.skill}/100) affects lawsuit discovery and legal action outcomes. <span style="color:${i.color};font-weight:700;">${i.label}</span>: ${i.desc}
        </div>
    `}function va(){if(Ut.length===0)return"";const a=y.shard?.current_tick||0;return`
        <div class="pa-ls-section">
            <div class="pa-ls-section-title">Legal Actions</div>
            ${Ut.map(e=>{const i=It.find(x=>x.key===e.target_ministry),s=i?i.label:e.target_ministry,o=i?i.icon:"⚖️",n=ee(e.corruption_growth||0),m=et[e.tier]||et[1],f=e.status==="active",r=Math.max(0,a-e.filed_at_tick),l=8,p=Math.min(1,r/l),c=Math.max(0,e.resolves_at_tick-a),v=[{tick:0,label:"Filed",type:"filing"},{tick:2,label:"Discovery",type:"discovery"},{tick:5,label:"Evidence",type:"evidence"},{tick:7,label:"Pre-trial",type:"pre_trial"},{tick:8,label:"Verdict",type:"resolution"}],d=v.map(x=>{const _=e.filed_at_tick+x.tick,b=a>=_,C=a>=_&&(x.tick===8||a<e.filed_at_tick+v[v.indexOf(x)+1]?.tick),w=x.tick/l*100;return`<div class="pa-ls-milestone ${b?"passed":""} ${C?"current":""}" style="left:${w}%;" title="${x.label} (Tick ${_})">
                <div class="pa-ls-milestone-dot"></div>
                <div class="pa-ls-milestone-label">${x.label}</div>
            </div>`}).join("");let u="";if(!f){const x=m===et[1]?"FRIVOLOUS":m===et[2]?"PARTIAL WIN":m===et[3]?"MAJOR WIN":"DEVASTATING",_=e.tier===1?"var(--red)":e.tier===2?"#ca5":e.tier===3?"#c84":"var(--green)";u=`<span class="pa-ls-tier-badge" style="color:${_};border-color:${_}44;background:${_}0a;">${x}</span>`}const g=f?"":`
            <div style="display:flex;gap:12px;margin-top:6px;font-family:var(--font-mono);font-size:8px;">
                <span style="color:${e.momentum_effect>=0?"var(--green)":"var(--red)"};">You: ${e.momentum_effect>=0?"+":""}${e.momentum_effect} Mom</span>
                <span style="color:${e.governance_effect>=0?"var(--green)":"var(--red)"};">${e.governance_effect>=0?"+":""}${e.governance_effect} Gov</span>
                <span style="color:${e.gov_momentum_effect>=0?"var(--green)":"var(--red)"};">Govt: ${e.gov_momentum_effect>=0?"+":""}${e.gov_momentum_effect} Mom</span>
            </div>
        `;return`
            <div class="pa-ls-card ${f?"active":"resolved"}">
                <div class="pa-ls-header">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${o}</span>
                        <span style="font-size:11px;font-weight:700;color:var(--text-bright);">${h(s)}</span>
                        <span class="pa-ls-tier-badge" style="color:${n.color};border-color:${n.color}44;background:${n.color}0a;">TIER ${e.tier}</span>
                        ${u}
                    </div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">
                        ${f?`${c} ticks left`:`Resolved tick ${e.resolves_at_tick}`}
                    </div>
                </div>
                ${f?`
                    <div class="pa-ls-timeline">
                        <div class="pa-ls-timeline-track">
                            <div class="pa-ls-timeline-fill" style="width:${p*100}%;"></div>
                        </div>
                        ${d}
                    </div>
                `:""}
                <div style="font-size:9px;color:var(--text-dim);margin-top:4px;">
                    Corruption growth: <span style="color:${n.color};font-weight:700;">${(e.corruption_growth||0).toFixed(1)}</span>
                    &mdash; ${h(n.label)}
                </div>
                ${g}
            </div>
        `}).join("")}
        </div>
    `}let Ot=!1;async function fe(a){const t=document.getElementById("pa-hire-modal");if(!t)return;const e=y.nation?.id,i=y.nation?.name;if(!e||!i)return;t.innerHTML='<div class="pa-modal"><div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Searching for candidates...</div></div>',t.classList.add("active");const s=await Ke($,e,i);let o=null;function n(){const m=o!=null?s[o]:null,f=m?ct(m.skill):null,r=s.map((c,v)=>{const d=o===v,u=ct(c.skill);return`<div class="pa-hire-row ${d?"selected":""}" data-idx="${v}">
                <div style="width:32px;height:32px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#d44a4a;flex-shrink:0;">${W(c.first_name,c.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${d?"var(--text-bright)":"var(--text-secondary)"};">${h(c.first_name)} ${h(c.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${c.skill}%;background:${u.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${u.color};">${c.skill}</span>
                    </div>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;">Age ${c.age}</div>
            </div>`}).join("");let l;m?l=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#d44a4a;">${W(m.first_name,m.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${h(m.first_name)} ${h(m.last_name)}</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:1px;">Age ${m.age} &middot; Opposition Coordinator Candidate</div>
                        </div>
                    </div>

                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">SKILL</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${m.skill}%;background:${f.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${f.color};">${m.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${f.color};margin-top:3px;font-weight:700;">${f.label}</div>
                        </div>
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">HIRE COST</div>
                            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--accent);">$${(m.hire_cost/1e3).toFixed(0)}k</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:3px;">From party funds</div>
                        </div>
                    </div>

                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">BACKGROUND</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.6;font-style:italic;">${h(m.background)}</div>
                    </div>

                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">SKILL ASSESSMENT</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.5;">${f.desc}</div>
                    </div>

                    <div style="padding:8px 10px;background:rgba(212,74,74,0.04);border:1px solid rgba(212,74,74,0.12);">
                        <div style="font-family:var(--font-mono);font-size:7px;color:#d44a4a;letter-spacing:0.06em;margin-bottom:3px;">ROLE: OPPOSITION COORDINATOR</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Files lawsuits against the government, organizes protests, and leads legal challenges. Skill affects success rates of legal and direct actions. Available only when your party is in opposition.</div>
                    </div>
                </div>
                <div style="padding:10px 20px;border-top:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:flex-end;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-right:auto;">Cost: <span style="color:var(--accent);font-weight:700;">$${(m.hire_cost/1e3).toFixed(0)}k</span></span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-hire-confirm" style="background:#d44a4a;"${(y.faction?.party_funds||0)<m.hire_cost?' disabled title="Not enough funds"':""}>Hire ${h(m.first_name)}</button>
                </div>
            `:l=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;"><div style="text-align:center;">
                <div style="font-family:var(--font-mono);font-size:24px;color:var(--border-mid);margin-bottom:8px;">←</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Select a candidate to review</div>
            </div></div>`,t.innerHTML=`
            <div style="width:100%;max-width:700px;background:var(--bg-panel);border:1px solid var(--border-mid);box-shadow:0 20px 60px rgba(0,0,0,0.5);display:flex;flex-direction:column;max-height:80vh;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#d44a4a;"></div>
                        <span class="pa-modal-title">Hire Agitator</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:8px;">${s.length} candidates</span>
                    </div>
                    <button class="pa-modal-close" id="pa-hire-close">&times;</button>
                </div>
                <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
                    <div style="width:240px;border-right:1px solid var(--border-main);overflow-y:auto;" id="pa-hire-list">
                        ${r}
                    </div>
                    <div style="flex:1;overflow-y:auto;" id="pa-hire-detail">
                        ${l}
                    </div>
                </div>
            </div>
        `;const p=()=>t.classList.remove("active");document.getElementById("pa-hire-close")?.addEventListener("click",p),t.onclick=c=>{c.target===t&&p()},document.getElementById("pa-hire-list")?.addEventListener("click",c=>{const v=c.target.closest(".pa-hire-row");v&&(o=parseInt(v.dataset.idx,10),n())}),document.getElementById("pa-hire-confirm")?.addEventListener("click",async()=>{if(Ot||o==null)return;Ot=!0;const c=document.getElementById("pa-hire-confirm");c&&(c.disabled=!0,c.textContent="Hiring...");try{const v=y.shard?.current_tick||0,d=s[o],u=d.hire_cost||0,g=y.faction?.party_funds||0;if(u>0&&g<u){alert(`Not enough funds. You have $${Math.round(g/1e3)}k, need $${Math.round(u/1e3)}k.`);return}if(u>0){const _=g-u,{error:b}=await $.from("factions").update({party_funds:_}).eq("id",y.faction.id);if(b){alert("Failed to deduct funds.");return}y.faction.party_funds=_}const x=await We($,y.faction?.id,d,v);if(!x.success){alert(x.error||"Failed to hire agitator.");return}B=x.agitator,K="agitator",p(),Y(a)}catch(v){console.error("[PartyActions] Hire agitator error:",v)}finally{Ot=!1,c&&(c.disabled=!1)}})}n()}let Et=!1;function ua(a){const t=document.getElementById("pa-lawsuit-modal");if(!t)return;if(!D){alert("No active government to file against.");return}const e=y.faction,i=B;let s=null,o=null;function n(){const m=s&&o,f=It.map(p=>{const c=s===p.key;return`<div class="pa-lawsuit-target ${c?"selected":""}" data-target="${p.key}">
                <span style="font-size:18px;">${p.icon}</span>
                <span style="font-size:12px;font-weight:600;color:${c?"var(--text-bright)":"var(--text-secondary)"};">${h(p.label)}</span>
            </div>`}).join(""),r=we.map(p=>{const c=o===p.key;return`<div class="pa-lawsuit-basis ${c?"selected":""}" data-basis="${p.key}">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:16px;height:16px;border-radius:50%;border:2px solid ${c?"#d44a4a":"var(--border-mid)"};display:flex;align-items:center;justify-content:center;">
                        ${c?'<div style="width:8px;height:8px;border-radius:50%;background:#d44a4a;"></div>':""}
                    </div>
                    <div>
                        <div style="font-size:14px;font-weight:600;color:${c?"var(--text-bright)":"var(--text-secondary)"};">${h(p.label)}</div>
                        <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">${h(p.desc)}</div>
                    </div>
                </div>
            </div>`}).join("");t.innerHTML=`
            <div class="pa-modal" style="width:700px;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#d44a4a;"></div>
                        <span class="pa-modal-title">File Lawsuit</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 8px;color:#5a8aaa;background:rgba(90,138,170,0.08);border:1px solid rgba(90,138,170,0.2);margin-left:6px;">LEGAL</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 8px;color:#c84;background:rgba(200,132,0,0.08);border:1px solid rgba(200,132,0,0.2);">OFFENSIVE</span>
                    </div>
                    <button class="pa-modal-close" id="pa-lawsuit-close">&times;</button>
                </div>

                ${i?`<div style="padding:6px 16px;border-bottom:1px solid var(--border-main);background:rgba(212,74,74,0.04);display:flex;align-items:center;gap:8px;">
                    <span style="width:5px;height:5px;border-radius:50%;background:#d44a4a;display:inline-block;"></span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Filed by:</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#d44a4a;">${h(i.first_name)} ${h(i.last_name)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Skill ${i.skill}</span>
                </div>`:""}

                <div class="pa-modal-body" style="gap:16px;">
                    <div>
                        <div class="pa-modal-step-label">1 &mdash; Target Ministry</div>
                        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;" id="pa-lawsuit-targets">${f}</div>
                    </div>

                    <div>
                        <div class="pa-modal-step-label">2 &mdash; Legal Basis</div>
                        <div style="display:flex;flex-direction:column;gap:4px;" id="pa-lawsuit-bases">${r}</div>
                    </div>

                    <div style="padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">INTELLIGENCE</div>
                        <div style="font-size:9px;color:var(--text-dim);font-style:italic;">No intelligence gathered. File FOIA requests first to assess corruption levels.</div>
                    </div>

                    <div style="padding:8px 10px;background:rgba(212,74,74,0.04);border:1px solid rgba(212,74,74,0.12);">
                        <div style="font-family:var(--font-mono);font-size:7px;color:#d44a4a;letter-spacing:0.06em;margin-bottom:4px;">COST &amp; RISK</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.6;">
                            <strong style="color:var(--text-bright);">FREE</strong> &middot; Duration: <strong style="color:var(--text-bright);">8 ticks</strong><br>
                            If corruption growth is low (0-5):<br>
                            <span style="color:var(--red);">YOU: -5 Momentum, -2 Governance</span><br>
                            <span style="color:var(--green);">THEM: +3 Momentum, +1 Governance</span>
                        </div>
                    </div>
                </div>

                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-lawsuit-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-lawsuit-submit" ${m?"":"disabled"} style="background:#d44a4a;">File Lawsuit</button>
                </div>
            </div>
        `;const l=()=>t.classList.remove("active");document.getElementById("pa-lawsuit-close")?.addEventListener("click",l),document.getElementById("pa-lawsuit-cancel")?.addEventListener("click",l),t.onclick=p=>{p.target===t&&l()},document.getElementById("pa-lawsuit-targets")?.addEventListener("click",p=>{const c=p.target.closest(".pa-lawsuit-target");c&&(s=c.dataset.target,n())}),document.getElementById("pa-lawsuit-bases")?.addEventListener("click",p=>{const c=p.target.closest(".pa-lawsuit-basis");c&&(o=c.dataset.basis,n())}),document.getElementById("pa-lawsuit-submit")?.addEventListener("click",async()=>{if(Et||!s||!o)return;Et=!0;const p=document.getElementById("pa-lawsuit-submit");p&&(p.disabled=!0,p.textContent="Filing...");try{const{data:v}=await $.from("factions").select("party_funds").eq("id",e.id).single(),d=v?.party_funds||0;if(d<25e4){alert(`Not enough funds. You have $${Math.round(d/1e3)}k, need $250k.`),Et=!1,p&&(p.disabled=!1,p.textContent="File Lawsuit");return}const u=d-25e4;await $.from("factions").update({party_funds:u}).eq("id",e.id),e.party_funds=u,sessionStorage.removeItem("nationhood_state");const g=y.shard?.current_tick||0,x=await Je($,{factionId:e?.id,nationId:y.nation?.id,agitatorId:i?.id,targetMinistry:s,basis:o,currentTick:g,partyName:e?.faction_name||"Opposition",administration:D});if(!x.success){alert(x.error||"Failed to file lawsuit.");return}const _=ee(x.lawsuit?.corruption_growth||0),b=et[x.tier]||et[1];l(),alert(`Lawsuit filed against ${It.find(C=>C.key===s)?.label||s}.
The case is now under investigation. Results will be determined when it resolves in 8 ticks.`),Y(a)}catch(c){console.error("[PartyActions] File lawsuit error:",c),alert("An error occurred. Please try again.")}finally{Et=!1,p&&(p.disabled=!1,p.textContent="File Lawsuit")}})}t.classList.add("active"),n()}async function ga(a){const t=document.getElementById("pa-appoint-pm-modal");if(!t)return;const e=y.nation;y.faction;const{data:i}=await $.from("factions").select("id, faction_name, abbreviation, party_color, seats, leader_first_name, leader_last_name, leader_age").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),s=i||[];let o=null,n=!1;const{data:m}=await $.from("head_of_government").select("faction_id, first_name, last_name, factions(faction_name)").eq("nation_id",e.id).eq("active",!0).maybeSingle();function f(){const r=s.find(d=>d.id===o),l=m?`${m.first_name} ${m.last_name}`:null,p=m?.factions?.faction_name||null,c=m&&o===m.faction_id;t.innerHTML=`
            <div class="pa-modal" style="width:500px;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#c8a832;"></div>
                        <span class="pa-modal-title">Appoint Prime Minister</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 8px;color:#c8a832;background:rgba(200,168,50,0.06);border:1px solid rgba(200,168,50,0.15);">ROYAL</span>
                    </div>
                    <button class="pa-modal-close" id="apm-close">&times;</button>
                </div>
                <div style="padding:8px 20px;border-bottom:1px solid var(--border-main);font-size:12px;color:var(--text-secondary);line-height:1.5;">
                    Choose a party to lead the government. Their leader becomes Prime Minister and can assign cabinet ministries.
                    ${l?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Current PM: <strong style="color:var(--text-bright);">${h(l)}</strong> (${h(p||"?")})</div>`:'<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--amber);">No Prime Minister appointed.</div>'}
                </div>
                <div class="pa-modal-body" style="max-height:300px;overflow-y:auto;">
                    <div class="pa-modal-step-label">Select a Party</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${s.map(d=>{const u=d.id===o,g=m&&d.id===m.faction_id,x=d.leader_first_name&&d.leader_last_name?`${d.leader_first_name} ${d.leader_last_name}`:"?";return`<div class="pa-action-item ${u?"selected":""}" data-party-id="${d.id}" style="cursor:pointer;${u?`border-color:${d.party_color||"#888"};background:${d.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${d.party_color||"#888"};"></div>
                                        <div>
                                            <div style="font-size:13px;font-weight:600;color:var(--text-bright);">${h(d.faction_name)}</div>
                                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${h(x)}, Age ${d.leader_age||"?"} · ${d.seats||0} seats</div>
                                        </div>
                                    </div>
                                    ${g?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:2px 6px;color:var(--green);background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2);">CURRENT PM</span>':""}
                                </div>
                            </div>`}).join("")}
                    </div>
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="apm-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="apm-confirm" ${!r||n||c?"disabled":""} style="background:#c8a832;">${r?c?"Already PM":`Appoint ${h(r.faction_name)}`:"Select a party"}</button>
                </div>
            </div>
        `;const v=()=>t.classList.remove("active");document.getElementById("apm-close")?.addEventListener("click",v),document.getElementById("apm-cancel")?.addEventListener("click",v),t.onclick=d=>{d.target===t&&v()},t.querySelector(".pa-modal-body")?.addEventListener("click",d=>{const u=d.target.closest("[data-party-id]");u&&(o=u.dataset.partyId,f())}),document.getElementById("apm-confirm")?.addEventListener("click",async()=>{if(!o||n)return;const d=s.find(g=>g.id===o);if(!d||!confirm(`Appoint ${d.leader_first_name} ${d.leader_last_name} of ${d.faction_name} as Prime Minister?`))return;n=!0;const u=document.getElementById("apm-confirm");u&&(u.disabled=!0,u.textContent="Appointing...");try{const g=y.shard?.current_tick||0;await $.from("head_of_government").update({active:!1}).eq("nation_id",e.id).eq("active",!0);const{error:x}=await $.from("head_of_government").insert({nation_id:e.id,faction_id:o,first_name:d.leader_first_name||"Unknown",last_name:d.leader_last_name||"Unknown",age:d.leader_age||50,ideology:"Centrist",active:!0,appointed_tick:g});if(x)throw x;try{await $.from("event_log").insert({nation_id:e.id,event_name:`${e.monarch_title||"King"} appoints Prime Minister`,category:"government",description_chosen:`${e.monarch_title||"The King"} has appointed ${d.leader_first_name} ${d.leader_last_name} of ${d.faction_name} as Prime Minister.`,fired_at_tick:g})}catch{}v(),alert(`${d.leader_first_name} ${d.leader_last_name} of ${d.faction_name} has been appointed Prime Minister.`),Y(a)}catch(g){alert("Failed to appoint PM: "+(g.message||"Error")),n=!1,u&&(u.disabled=!1,u.textContent=`Appoint ${h(d.faction_name)}`)}})}t.classList.add("active"),f()}async function ya(a){const t=document.getElementById("pa-royal-modal");if(!t)return;const e=y.nation,i=y.faction,s=i.seats||0,o=e?.total_seats||100,{data:n}=await $.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),m=(n||[]).filter(c=>c.id!==i.id);let f=null;const r=Math.max(0,s-1);let l=Math.min(5,r||1);function p(){const c=m.find(d=>d.id===f);t.innerHTML=`
            <div class="pa-modal" style="width:560px;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#c8a832;"></div>
                        <span class="pa-modal-title">Grant Seats</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 8px;color:#c8a832;background:rgba(200,168,50,0.06);border:1px solid rgba(200,168,50,0.15);">ROYAL</span>
                    </div>
                    <button class="pa-modal-close" id="royal-close">&times;</button>
                </div>
                <div style="padding:8px 20px;border-bottom:1px solid var(--border-main);font-size:12px;color:var(--text-secondary);line-height:1.5;">
                    Grant parliamentary seats to a noble house. Each seat granted earns <span style="color:#5cc55c;font-weight:700;">+0.5 Legitimacy</span>.
                    You currently hold <strong>${s}</strong> of ${o} seats.
                    ${s/o>.7?'<div style="color:#d44a4a;font-weight:700;margin-top:4px;">⚠ You hold >70% of seats — tyranny legitimacy decay active!</div>':""}
                </div>
                <div class="pa-modal-body">
                    <div class="pa-modal-step-label">Select Noble House</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${m.length>0?m.map(d=>{const u=d.id===f;return`<div class="pa-action-item ${u?"selected":""}" data-faction-id="${d.id}" style="cursor:pointer;${u?`border-color:${d.party_color||"#888"};background:${d.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${d.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${h(d.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${Math.max(0,d.seats||0)} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No other factions in this nation.</div>'}
                    </div>
                    ${c?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Grant</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${r}" value="${l}" id="grant-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--accent);width:40px;text-align:center;" id="grant-count">${l}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Legitimacy gain: <span style="color:#5cc55c;font-weight:700;">+${(l*.5).toFixed(1)}</span>
                                &middot; Your seats after: ${s-l} &middot; Their seats after: ${(c.seats||0)+l}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-grant" ${c?"":"disabled"} style="background:#c8a832;">Grant ${l} Seats</button>
                </div>
            </div>
        `;const v=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",v),document.getElementById("royal-cancel")?.addEventListener("click",v),t.onclick=d=>{d.target===t&&v()},t.querySelector(".pa-modal-body")?.addEventListener("click",d=>{const u=d.target.closest("[data-faction-id]");u&&(f=u.dataset.factionId,p())}),document.getElementById("grant-slider")?.addEventListener("input",d=>{l=parseInt(d.target.value)||1,document.getElementById("grant-count").textContent=l;const u=document.getElementById("royal-grant");u&&(u.textContent=`Grant ${l} Seats`)}),document.getElementById("royal-grant")?.addEventListener("click",async()=>{if(!f||ft)return;ft=!0;const d=document.getElementById("royal-grant");d&&(d.disabled=!0,d.textContent="Granting...");try{const{data:u}=await $.from("factions").select("id, faction_name, seats").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null),g=(u||[]).find(L=>L.id===i.id),x=(u||[]).find(L=>L.id===f);if(!g||!x){alert("Faction not found.");return}const _=(u||[]).reduce((L,P)=>L+Math.max(0,P.seats||0),0),b=new Map;for(const L of u||[])b.set(L.id,Math.max(0,L.seats||0));let C=l;const w=Math.max(0,(b.get(i.id)||0)-1),k=Math.min(C,w);if(k>0&&(b.set(i.id,(b.get(i.id)||0)-k),C-=k),C>0){const L=(u||[]).filter(F=>F.id!==i.id&&F.id!==f&&(b.get(F.id)||0)>0);let P=L.reduce((F,A)=>F+(b.get(A.id)||0),0);for(const F of L){if(C<=0||P<=0)break;const A=Math.round(C*(b.get(F.id)||0)/P),j=Math.min(A,b.get(F.id)||0,C);j>0&&(b.set(F.id,(b.get(F.id)||0)-j),P-=j,C-=j)}if(C>0)for(const F of L){if(C<=0)break;const A=b.get(F.id)||0,j=Math.min(C,A);j>0&&(b.set(F.id,A-j),C-=j)}}const M=l-C;if(M<=0){alert("No seats available to grant.");return}b.set(f,(b.get(f)||0)+M);let E=0;for(const L of b.values())E+=L;if(E!==_){console.error("[GrantSeats] Conservation violated",{sumBefore:_,sumAfter:E,grantAmount:l,actualGrant:M}),alert("Internal error: seat totals would not balance. Aborting.");return}const S=[];for(const L of u||[]){const P=Math.max(0,L.seats||0),F=b.get(L.id)||0;P!==F&&S.push({id:L.id,seats:F})}for(const L of S){const{error:P}=await $.from("factions").update({seats:L.seats}).eq("id",L.id);if(P){alert("Failed to grant seats: "+P.message);return}}const N=M*.5,I=Math.min(100,(Number(e.legitimacy)||50)+N),{error:R}=await $.from("nations").update({legitimacy:I}).eq("id",e.id);if(R){alert("Failed to update legitimacy.");return}i.seats=b.get(i.id)||0,e.legitimacy=I;try{const L=m.find(P=>P.id===f);await $.from("event_log").insert({nation_id:e.id,event_name:`${e.monarch_title||"King"} grants ${M} seats to ${L?.faction_name||"unknown"}`,category:"government",description_chosen:`The ${e.monarch_title||"King"} has granted ${M} parliamentary seat${M!==1?"s":""} to ${L?.faction_name}. Legitimacy +${N.toFixed(1)}.`,fired_at_tick:y.shard?.current_tick||0})}catch{}v(),Y(a)}catch(u){console.error("[GrantSeats] Error:",u),alert("Failed to grant seats.")}finally{ft=!1}})}t.classList.add("active"),p()}async function ba(a){const t=document.getElementById("pa-royal-modal");if(!t)return;const e=y.nation,i=y.faction,{data:s}=await $.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),o=(s||[]).filter(r=>r.id!==i.id&&(r.seats||0)>0);let n=null,m=1;function f(){const r=o.find(u=>u.id===n),l=r&&r.seats||0,c=m*1e5,v=i.party_funds||0;t.innerHTML=`
            <div class="pa-modal" style="width:560px;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#d44a4a;"></div>
                        <span class="pa-modal-title">Revoke Seats</span>
                        <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 8px;color:#d44a4a;background:rgba(212,74,74,0.06);border:1px solid rgba(212,74,74,0.15);">ROYAL</span>
                    </div>
                    <button class="pa-modal-close" id="royal-close">&times;</button>
                </div>
                <div style="padding:8px 20px;border-bottom:1px solid var(--border-main);font-size:12px;color:var(--text-secondary);line-height:1.5;">
                    Revoke seats from a noble house. Costs <span style="color:#d44a4a;font-weight:700;">$100k per seat</span> and
                    <span style="color:#d44a4a;font-weight:700;">-1 Legitimacy per seat</span>. Revoked seats return to the crown.
                </div>
                <div class="pa-modal-body">
                    <div class="pa-modal-step-label">Select Noble House</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${o.length>0?o.map(u=>{const g=u.id===n;return`<div class="pa-action-item ${g?"selected":""}" data-faction-id="${u.id}" style="cursor:pointer;${g?"border-color:#d44a4a;background:rgba(212,74,74,0.04);":""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${u.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${h(u.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${u.seats} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No factions have seats to revoke.</div>'}
                    </div>
                    ${r?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Revoke</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${l}" value="${m}" id="revoke-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#d44a4a;width:40px;text-align:center;" id="revoke-count">${m}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Cost: <span style="color:#d44a4a;font-weight:700;">$${Math.round(c/1e3)}k</span>
                                &middot; Legitimacy: <span style="color:#d44a4a;font-weight:700;">-${m}</span>
                                ${v<c?'<span style="color:#d44a4a;margin-left:8px;">⚠ Not enough funds</span>':""}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-revoke" ${!r||v<c?"disabled":""} style="background:#d44a4a;">Revoke ${m} Seats</button>
                </div>
            </div>
        `;const d=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",d),document.getElementById("royal-cancel")?.addEventListener("click",d),t.onclick=u=>{u.target===t&&d()},t.querySelector(".pa-modal-body")?.addEventListener("click",u=>{const g=u.target.closest("[data-faction-id]");g&&(n=g.dataset.factionId,m=1,f())}),document.getElementById("revoke-slider")?.addEventListener("input",u=>{m=parseInt(u.target.value)||1,document.getElementById("revoke-count").textContent=m;const g=document.getElementById("royal-revoke");g&&(g.textContent=`Revoke ${m} Seats`)}),document.getElementById("royal-revoke")?.addEventListener("click",async()=>{if(!n||ft)return;ft=!0;const u=document.getElementById("royal-revoke");u&&(u.disabled=!0,u.textContent="Revoking...");try{const g=m*1e5,{data:x}=await $.from("factions").select("id, faction_name, seats, party_funds").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null),_=(x||[]).find(A=>A.id===i.id),b=(x||[]).find(A=>A.id===n);if(!_||!b){alert("Faction not found.");return}const C=_.party_funds||0;if(C<g){alert("Not enough funds.");return}const w=(x||[]).reduce((A,j)=>A+Math.max(0,j.seats||0),0),k=Math.min(m,b.seats||0);if(k<=0){alert("Target has no seats to revoke.");return}const M=C-g,E=(_.seats||0)+k,S=(b.seats||0)-k,N=k,I=Math.max(0,(Number(e.legitimacy)||50)-N),R=w-(_.seats||0)-(b.seats||0)+E+S;if(R!==w){console.error("[RevokeSeats] Conservation violated",{sumBefore:w,sumAfter:R,take:k}),alert("Internal error: seat totals would not balance. Aborting.");return}const{error:L}=await $.from("factions").update({seats:E,party_funds:M}).eq("id",i.id);if(L){alert("Failed to revoke seats: "+L.message);return}const{error:P}=await $.from("factions").update({seats:S}).eq("id",n);if(P){alert("Failed to revoke seats: "+P.message);return}const{error:F}=await $.from("nations").update({legitimacy:I}).eq("id",e.id);if(F){alert("Failed to update legitimacy.");return}i.seats=E,i.party_funds=M,e.legitimacy=I,sessionStorage.removeItem("nationhood_state");try{await $.from("event_log").insert({nation_id:e.id,event_name:`${e.monarch_title||"King"} revokes ${k} seats from ${b.faction_name||"unknown"}`,category:"political",description_chosen:`The ${e.monarch_title||"King"} has revoked ${k} seat${k!==1?"s":""} from ${b.faction_name}. Legitimacy -${N}.`,fired_at_tick:y.shard?.current_tick||0})}catch{}d(),Y(a)}catch(g){console.error("[RevokeSeats] Error:",g),alert("Failed to revoke seats.")}finally{ft=!1}})}t.classList.add("active"),f()}let Dt=!1;async function xa(){if(Dt||!y?.faction?.id||!y?.nation?.id)return;if(!Tt(y.nation)){alert("Early elections are only available in parliamentary and semi-presidential systems.");return}const a=D?.pm_party_id;if(!a||a!==y.faction.id){alert("Prime Minister’s party only.");return}if(confirm(`⚡ CALL EARLY ELECTIONS?

Dissolves the legislature and puts the government into caretaker status.
Election fires after a short formation window.

Momentum effect depends on Gov. Approval:
• >50  → PM party +3 Momentum (fresh mandate)
• 35–50 → neutral
• <35  → opposition +5 Momentum each, +3 Stability

Proceed?`)){Dt=!0;try{const t=Array.isArray(D?.party_ids)?D.party_ids:D?.pm_party_id?[D.pm_party_id]:[],e=await Oe($,y.nation.id,a,t);if(e&&e.success===!1){alert("Could not call early elections: "+(e.error||"unknown error"));return}alert("⚡ Early elections called. Government is now in caretaker status."),window.location.reload()}catch(t){console.error("[PartyActions] Call early elections failed:",t),alert("Failed to call early elections: "+(t?.message||"unknown error"))}finally{Dt=!1}}}let Bt=!1;async function ha(){if(Bt||!y?.faction?.id||!y?.nation?.id)return;if(!Tt(y.nation)){alert("Resignation is only available in parliamentary and semi-presidential systems.");return}const a=D?.pm_party_id;if(!a||a!==y.faction.id){alert("Prime Minister’s party only.");return}if(confirm(`⚠ RESIGN AS PRIME MINISTER?

The PM seat vacates immediately. Coalition enters caretaker status with
a ${Fe}-tick window to nominate a successor via the cabinet panel.
If a new PM is installed, the administration continues under new leadership.
If the window expires, a snap election is called.

Cost to your party:
• −3 Momentum
• −0.05 Credibility
• Nation: −3 Stability
• 12-tick bar from the PM seat on your party

Proceed?`)){Bt=!0;try{const{data:t}=await $.from("shard").select("current_tick").eq("name","Alpha Shard").single(),e=t?.current_tick||y.shard?.current_tick||0;(await Ne($,y.nation.id,y.faction.id,e))?.result==="election_called"?alert("You have resigned. Snap election scheduled as fallback if no successor is nominated."):alert("You have resigned. Coalition has a short window to nominate a successor before a snap election fires."),window.location.reload()}catch(t){console.error("[PartyActions] Resign PM failed:",t),alert("Failed to resign: "+(t?.message||"unknown error"))}finally{Bt=!1}}}let jt=!1;async function _a(){if(jt||!y?.faction?.id||!y?.nation?.id)return;const a=y.faction,t=y.nation,e=ze(t);if(!Tt(t)){alert("A vote of no confidence is only possible in a parliamentary or semi-presidential system.");return}const{data:i}=await $.from("head_of_government").select("faction_id, last_name").eq("nation_id",t.id).eq("active",!0).maybeSingle(),s=i?.faction_id||t.ruling_faction_id||null,o=i?.last_name||null;if(!s){alert("No active Prime Minister to file against.");return}if(s===a.id){alert("Your party is the Prime Minister — you cannot file a vote of no confidence against yourself.");return}const n=y.faction?.seats!=null?Number(y.faction.seats):0;if(n<1){alert("Your party needs at least 1 seat in the legislature to file a motion.");return}const{data:m}=await $.from("shard").select("current_tick").eq("name","Alpha Shard").single(),f=m?.current_tick||y.shard?.current_tick||0,{data:r}=await $.from("bills").select("id").eq("nation_id",t.id).eq("bill_type","no_confidence").in("status",["committee","floor"]).limit(1);if(r&&r.length>0){alert("A motion of no confidence is already pending.");return}const{data:l}=await $.from("campaign_actions").select("tick_performed").eq("nation_id",t.id).eq("action_type","no_confidence_filed").eq("target_id",s).order("tick_performed",{ascending:!1}).limit(1).maybeSingle();if(l){const v=f-Number(l.tick_performed||0);if(v<nt.NO_CONFIDENCE_COOLDOWN_TICKS){const d=nt.NO_CONFIDENCE_COOLDOWN_TICKS-v;alert(`Cooldown: ${d} tick${d!==1?"s":""} remaining before another motion can be filed against this PM party.`);return}}const p=o?e?`Motion of No Confidence in PM ${o}`:`Motion of No Confidence in the ${o} Government`:"Motion of No Confidence in the Government",c=e?`IF IT PASSES:
• PM removed — President must nominate a new PM
• Your party: +15 Momentum
• PM's party: -10 Momentum, -10 Governance`:`IF IT PASSES:
• Coalition dissolved, PM removed, all ministries vacated
• Snap elections scheduled
• Your party: +15 Momentum
• PM's party: -10 Momentum, -10 Governance`;if(confirm(`⚡ FILE VOTE OF NO CONFIDENCE?

"${p}"

Cost: $0 — free to file
Voting period: ${nt.NO_CONFIDENCE_VOTING_TICKS} ticks
Needs simple majority (YES > NO) to pass.

${c}

IF IT FAILS:
• Your party: -10 Momentum
• ${nt.NO_CONFIDENCE_COOLDOWN_TICKS}-tick cooldown on this PM party

Proceed?`)){jt=!0;try{const v=await Re($,{faction:a,nation:t,pmFactionId:s,pmLastName:o,isSemiPres:e,tick:f,mySeats:n});if(!v.ok){alert("Failed to file motion: "+v.error);return}alert(`⚡ "${v.motionName}" has been filed!

Voting is now open for ${nt.NO_CONFIDENCE_VOTING_TICKS} ticks.`),window.location.href=`bill.html?id=${v.billId}`}catch(v){console.error("[PartyActions] No confidence file failed:",v),alert("Failed to file motion: "+(v?.message||"unknown error"))}finally{jt=!1}}}let Gt=!1;async function wa(a){if(Gt)return;const t=y.faction,e=t.seats||0,i=Math.max(1,t.momentum??0);if(e<=0){alert("Your party has no seats — nothing to fundraise from.");return}const s=ke(e,lt);if(i-s.momCost<1){alert(`Not enough momentum. You need ${s.momCost} momentum (current: ${Math.round(i)}, floor: 1). Try again next tick when momentum recovers.`);return}Gt=!0;try{const{data:o}=await $.from("factions").select("party_funds, momentum").eq("id",t.id).single();o&&(t.party_funds=o.party_funds??0,t.momentum=o.momentum??0);const n=Math.max(1,t.momentum??0),m=y.shard?.current_tick||0,f=Math.max(1,n-s.momCost),r=(t.party_funds||0)+s.raised,{error:l}=await $.from("factions").update({momentum:f,party_funds:r}).eq("id",t.id);if(l){alert("Fundraise failed: "+l.message);return}await $.from("campaign_actions").insert({party_id:t.id,nation_id:y.nation?.id,action_type:"fundraise",ap_cost:0,money_cost:0,tick_performed:m,result:{raised:s.raised,perSeat:s.perSeat,momCost:s.momCost,useNumber:lt+1,seats:e}}),t.momentum=f,t.party_funds=r,sessionStorage.removeItem("nationhood_state"),lt++,Y(a)}catch(o){console.error("[PartyActions] Fundraise error:",o),alert("Fundraise failed.")}finally{Gt=!1}}function $a(a){const t=document.getElementById("pa-statement-modal");if(!t)return;const e=y.faction,i=e?.color||"#c8a832",s=e?.leader_first_name&&e?.leader_last_name?`${e.leader_first_name} ${e.leader_last_name}`:"Party Leader",o=le.map(l=>`<div class="pa-topic-card" data-topic="${l.id}" style="padding:8px 10px;cursor:pointer;border:1px solid var(--border-mid);display:flex;align-items:center;gap:8px;transition:all 0.12s;">
            <span style="font-size:14px;">${l.icon}</span>
            <span style="font-size:10px;font-weight:600;color:var(--text-secondary);">${h(l.label)}</span>
        </div>`).join("");t.innerHTML=`
        <div class="pa-modal" style="width:520px;">
            <div class="pa-modal-header">
                <div class="pa-modal-header-left">
                    <div class="pa-modal-dot" style="background:${i};"></div>
                    <span class="pa-modal-title">Issue Statement</span>
                </div>
                <button class="pa-modal-close" id="pa-stmt-close">&times;</button>
            </div>
            <div style="padding:8px 16px;border-bottom:1px solid var(--border-main);background:${i}08;display:flex;align-items:center;gap:8px;">
                <span style="width:5px;height:5px;border-radius:50%;background:${i};display:inline-block;"></span>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Speaking as:</span>
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${i};">${h(s)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">&middot; Party Leader</span>
            </div>
            <div class="pa-modal-body" style="gap:14px;">
                <div>
                    <div class="pa-modal-step-label">1 &mdash; Topic</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;" id="pa-stmt-topics">${o}</div>
                </div>
                <div>
                    <div class="pa-modal-step-label">2 &mdash; Statement</div>
                    <textarea class="pa-modal-input" id="pa-stmt-body" rows="5" placeholder="Write your public statement..." style="resize:none;font-family:var(--font-ui);font-size:11px;line-height:1.6;"></textarea>
                    <div style="display:flex;justify-content:space-between;margin-top:3px;">
                        <span id="pa-stmt-charcount" style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">0 characters</span>
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">Min 10 characters</span>
                    </div>
                </div>
                <div style="padding:6px 10px;background:var(--amber-faint);border:1px solid var(--amber-border);">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);margin-bottom:2px;">COST</div>
                    <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">
                        Issuing a statement costs <strong style="color:var(--accent);">$20k</strong>.
                        The statement will appear in the national news and may shift voter bloc reactions.
                    </div>
                </div>
            </div>
            <div class="pa-modal-footer">
                <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-stmt-cancel">Cancel</button>
                <button class="pa-modal-btn pa-modal-btn--submit" id="pa-stmt-submit" disabled>Issue Statement</button>
            </div>
        </div>
    `,t.classList.add("active");let n=null,m=!1;const f=()=>t.classList.remove("active");document.getElementById("pa-stmt-close")?.addEventListener("click",f),document.getElementById("pa-stmt-cancel")?.addEventListener("click",f),t.addEventListener("click",l=>{l.target===t&&f()}),document.getElementById("pa-stmt-topics")?.addEventListener("click",l=>{const p=l.target.closest(".pa-topic-card");p&&(n=p.dataset.topic,document.querySelectorAll(".pa-topic-card").forEach(c=>{const v=c.dataset.topic===n;c.style.borderColor=v?i:"var(--border-mid)",c.style.background=v?i+"0a":"";const d=c.querySelector("span:last-child");d&&(d.style.color=v?"var(--text-bright)":"var(--text-secondary)")}),r())});const r=()=>{const l=document.getElementById("pa-stmt-body")?.value?.trim()||"",p=document.getElementById("pa-stmt-submit"),c=document.getElementById("pa-stmt-charcount");c&&(c.textContent=`${l.length} characters`),p&&(p.disabled=!(n&&l.length>=10))};document.getElementById("pa-stmt-body")?.addEventListener("input",r),document.getElementById("pa-stmt-submit")?.addEventListener("click",async()=>{if(m)return;const l=document.getElementById("pa-stmt-body")?.value?.trim();if(!n||!l||l.length<10)return;m=!0;const p=document.getElementById("pa-stmt-submit");p&&(p.disabled=!0,p.textContent="Issuing...");try{const c=y.shard?.current_tick||0,d=le.find(N=>N.id===n)?.label||n,u=2e4,{data:g}=await $.from("factions").select("party_funds").eq("id",e.id).single(),x=g?.party_funds||0;if(x<u){alert(`Not enough funds. You have $${Math.round(x/1e3)}k, need $20k.`);return}const _=x-u,{error:b}=await $.from("factions").update({party_funds:_}).eq("id",e.id);if(b){alert("Failed to deduct funds: "+b.message);return}e.party_funds=_;const w=de[Math.floor(Math.random()*de.length)].replace("{party_name}",e.faction_name||"Unknown Party").replace("{leader_name}",s).replace("{topic}",d),{error:k}=await $.from("campaign_actions").insert({party_id:e.id,nation_id:y.nation?.id,action_type:"issue_statement",ap_cost:1,money_cost:0,tick_performed:c,result:{topic:n,topicLabel:d,headline:w,body:l,leaderName:s}});k&&console.error("[PartyActions] Statement log failed:",k.message);const{error:M}=await $.from("valdorian_articles").insert({nation_id:y.nation?.id,event_type:"issue_statement",tier:3,section:"politics",headline:w,subheadline:d,lede:l.substring(0,200)+(l.length>200?"...":""),body_paragraphs:JSON.stringify(l.split(/\n\n+/).filter(N=>N.trim())),quotes:JSON.stringify([{posture:"assertive",text:l.substring(0,150)}]),byline_reporter:"Political Desk",topic_tags:JSON.stringify([n]),source_event_id:"statement_"+Date.now(),tick:c});M&&console.error("[PartyActions] Article creation failed:",M.message);const{error:E}=await $.from("event_log").insert({nation_id:y.nation?.id,event_name:w,category:"political",description_chosen:`${e.faction_name} issues the following statement regarding ${d}: "${l}"`,fired_at_tick:c});E&&console.warn("[Statement] event_log insert failed:",E.message);const{error:S}=await $.from("admin_timeline_events").insert({nation_id:y.nation?.id,tick:c,type:"communications",title:"Statement Issued",description:`${s} issued a public statement on ${d}: "${l.substring(0,120)}${l.length>120?"...":""}"`});S&&console.warn("[Statement] timeline insert failed:",S.message),f(),Y(a)}catch(c){console.error("[PartyActions] Statement error:",c),alert("Failed to issue statement. Please try again.")}finally{m=!1,p&&(p.disabled=!1,p.textContent="Issue Statement")}})}const At=20;function ka(a){const t=document.getElementById("pa-platform-modal");if(!t)return;const e=y.faction;y.nation;const i=e?.color||"#c8a832";let s=null,o=!1;const n={};for(const r of St)r.faction_id!==e?.id&&(n[r.platform_key]=(n[r.platform_key]||0)+1);const m=new Set(Q.map(r=>r.platform_key));function f(){const r=$t.find(v=>v.id===s),l=r?ne(n[r.id]||0):null;r&&St.filter(v=>v.platform_key===r.id&&v.faction_id!==e?.id);const p=$t.map(v=>{const d=s===v.id,u=m.has(v.id),g=ne(n[v.id]||0),x=n[v.id]||0;return`<div class="pa-plat-card ${d?"selected":""} ${u?"adopted":""}" data-plat="${v.id}">
                ${u?'<div class="pa-plat-active-badge">ACTIVE</div>':""}
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <span style="font-size:14px;">${v.icon}</span>
                    <span style="font-size:10px;font-weight:700;color:${u?i:d?"var(--text-bright)":"var(--text-secondary)"};line-height:1.2;">${h(v.name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.4;margin-bottom:6px;">${h(v.tagline)}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${g.color};">${g.label}</span>
                    ${x>0?`<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 3px;color:var(--text-dim);border:1px solid var(--border-mid);">${x} rival${x>1?"s":""}</span>`:""}
                </div>
            </div>`}).join("");let c;if(!r)c=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;">
                <div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:24px;color:var(--border-mid);margin-bottom:8px;">←</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Select a platform to review</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:4px;">16 platforms available</div>
                </div>
            </div>`;else{const v=r.improve.map(_=>{const b=oe(_,"improve");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(92,204,92,0.05);border:1px solid rgba(92,204,92,0.15);color:${b.color};white-space:nowrap;">${b.arrow} ${ie[_]||_}</span>`}).join(""),d=r.worsen.map(_=>{const b=oe(_,"worsen");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(204,85,85,0.05);border:1px solid rgba(204,85,85,0.15);color:${b.color};white-space:nowrap;">${b.arrow} ${ie[_]||_}</span>`}).join(""),u=m.has(r.id),g=Q.length;let x;u?x=`<div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${i};display:flex;align-items:center;gap:6px;">✓ CURRENT PLATFORM</div>`:g>=3?x='<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">All 3 platform slots are full.</div>':o?x=`<div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:#ca5;font-weight:700;">⚠ Confirm: Adopt ${h(r.name)}?</span>
                    <div style="display:flex;gap:6px;">
                        <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-plat-conf-cancel">Cancel</button>
                        <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-conf-yes">Confirm</button>
                    </div>
                </div>`:x=`<div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Costs 2 AP. Stats locked at current values. 6-tick cooldown.</span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-adopt" style="background:${i};">Adopt Platform</button>
                </div>`,c=`
                <div style="padding:16px 20px 12px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                        <span style="font-size:22px;">${r.icon}</span>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${h(r.name)}</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.04em;margin-top:1px;">${h(r.tagline.toUpperCase())}</div>
                        </div>
                    </div>
                    <div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">${h(r.desc)}</div>
                </div>
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);background:var(--bg-card);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">MOMENTUM GAIN</div>
                            <div style="display:flex;align-items:baseline;gap:6px;">
                                <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${l.color};">${l.label}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);">${h(l.note)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="flex:1;padding:12px 20px;overflow-y:auto;">
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.1em;color:var(--green);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--green);display:inline-block;"></span>
                            PROMISES TO IMPROVE <span style="font-weight:400;color:var(--text-dim);">(${r.improve.length} stats, +${At} target)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${v}</div>
                    </div>
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.1em;color:var(--red);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--red);display:inline-block;"></span>
                            LIKELY SIDE EFFECTS <span style="font-weight:400;color:var(--text-dim);">(${r.worsen.length} stats)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${d}</div>
                    </div>
                    <div style="padding:10px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.15);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#ca5;letter-spacing:0.06em;margin-bottom:4px;">⚠ TRADEOFF</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.5;">${h(r.tradeoff)}</div>
                    </div>
                    <div style="margin-top:12px;padding:8px 12px;background:var(--bg-card);border:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">PROMISE RULES</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">
                            Stats are locked at current values when adopted. If your party enters government, you have <strong style="color:var(--text-bright);">24 ticks</strong> to move each promised stat by <strong style="color:var(--text-bright);">+${At}</strong>. Failure: <strong style="color:var(--red);">-20 Momentum, -10 Governance</strong>. If you don't enter government, the promise abates.
                        </div>
                    </div>
                </div>
                <div style="padding:12px 20px;border-top:1px solid var(--border-main);background:var(--bg-card);display:flex;align-items:center;">
                    ${x}
                </div>
            `}t.innerHTML=`
            <div style="width:100%;max-width:920px;background:var(--bg-panel);border:1px solid var(--border-mid);box-shadow:0 20px 60px rgba(0,0,0,0.5);display:flex;flex-direction:column;max-height:85vh;">
                <div style="padding:14px 20px;border-bottom:1px solid var(--border-main);display:flex;justify-content:space-between;align-items:center;">
                    <div>
                        <div style="display:flex;align-items:center;gap:8px;">
                            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:0.12em;color:${i};">SET PARTY PLATFORM</span>
                            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:2px 6px;color:var(--green);background:var(--green-faint);border:1px solid var(--green-border);">2 AP</span>
                            <span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:2px 6px;color:var(--text-secondary);background:var(--bg-card);border:1px solid var(--border-mid);">CD: 6 TICKS</span>
                        </div>
                        <div style="font-size:10px;color:var(--text-secondary);margin-top:3px;">Choose your party's focus. Defines which stats you promise to change.</div>
                    </div>
                    <button class="pa-modal-close" id="pa-plat-close">&times;</button>
                </div>
                <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
                    <div style="width:380px;border-right:1px solid var(--border-main);padding:8px;display:grid;grid-template-columns:1fr 1fr;gap:4px;align-content:start;overflow-y:auto;" id="pa-plat-grid">
                        ${p}
                    </div>
                    <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow-y:auto;" id="pa-plat-detail">
                        ${c}
                    </div>
                </div>
            </div>
        `,document.getElementById("pa-plat-close")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=v=>{v.target===t&&t.classList.remove("active")},document.getElementById("pa-plat-grid")?.addEventListener("click",v=>{const d=v.target.closest(".pa-plat-card");d&&(s=d.dataset.plat,o=!1,f())}),document.getElementById("pa-plat-adopt")?.addEventListener("click",()=>{o=!0,f()}),document.getElementById("pa-plat-conf-cancel")?.addEventListener("click",()=>{o=!1,f()}),document.getElementById("pa-plat-conf-yes")?.addEventListener("click",()=>Ea(a,s))}t.classList.add("active"),f()}let Ct=!1;async function Ea(a,t){if(Ct)return;Ct=!0;const e=document.getElementById("pa-platform-modal"),i=y.faction,s=y.nation;if(!i||!s||!t){Ct=!1;return}const o=$t.find(r=>r.id===t);if(!o)return;const n={},m={},f=r=>te.has(r);for(const r of o.improve){const l=Number(s[r]??50);n[r]=l,f(r)?m[r]=Math.max(0,l-At):m[r]=Math.min(100,l+At)}try{const r=y.shard?.current_tick||0,{data:l,error:p}=await $.rpc("adopt_platform",{p_faction_id:i.id,p_nation_id:s.id,p_platform_key:t,p_tick:r,p_baseline_stats:n,p_target_stats:m});if(p){console.error("[PartyActions] Platform adoption failed:",p.message),alert("Failed to adopt platform: "+p.message);return}if(l&&!l.success){alert(l.error||"Failed to adopt platform.");return}const c=l?.slot||Q.length+1;Q.push({faction_id:i.id,nation_id:s.id,platform_key:t,slot:c,adopted_at_tick:r,baseline_stats:n,target_stats:m,status:"active"}),St.push(Q[Q.length-1]),i&&l?.momentum_gained&&(i.momentum=(i.momentum||0)+l.momentum_gained),i&&(i.action_points=Math.max(0,(i.action_points||0)-2)),e?.classList.remove("active"),Y(a)}catch(r){console.error("[PartyActions] Platform adoption error:",r),alert("An error occurred. Please try again.")}finally{Ct=!1}}let gt=null,Ie={isOpposition:!0,administration:null,governanceScore:0,governanceDeltas:[],governanceMultiplier:1,governanceDecayCycles:0,ticksInPower:0,myFaction:null,allParties:[],rivalParties:[],factionIdeology:{},electoralStandings:[],recentActivity:[],caucuses:[],nextElection:null,nextElectionTicks:null,ideologyAxes:[]};function U(a){if(!a)return"";const t=document.createElement("div");return t.textContent=a,t.innerHTML}const Ca=[...Be,...je];function Ma(a,t,e,i){const s=i-(e||i);if(!t)return{score:0,deltas:[],decayCycles:0,multiplier:1,ticksInPower:s};let o=0,n=0;const m=[];for(const p of Ca){const c=Ge(p);if(c===0)continue;const v=Number(t[p]??0),d=Number(a[p]??0),u=d-v;if(u===0)continue;const g=u*c,x=g>0;m.push({key:p,start:v,now:d,delta:u,signed:g,dir:c,isGood:x}),o+=g,n++}let f=n>0?o/n:0;const r=Math.floor(s/24),l=f>0?Math.pow(.97,r):1;return f*=l,{score:Math.round(f*10)/10,deltas:m,decayCycles:r,multiplier:l,ticksInPower:s}}function Ia(a,t,e){return De.map(i=>{const s=t[a],n=((s?Number(s[i.key]??0):0)+100)/200,m=e.map(f=>{const r=t[f.id],l=r?Number(r[i.key]??0):0;return{id:f.id,pos:(l+100)/200,color:f.party_color||"#666"}});return{key:i.key,name:`${i.leftLabel} / ${i.rightLabel}`,left:i.leftLabel.toUpperCase(),right:i.rightLabel.toUpperCase(),leftColor:i.leftColor,rightColor:i.rightColor,yourPos:n,parties:m}})}async function Sa(a,t,e){gt=t;const i=document.getElementById(e);if(!i)return;const s=t.faction,o=t.nation,n=o?.id,m=s?.id;if(!s||!n){i.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">No faction data.</div>';return}i.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Loading party overview...</div>';try{const f=t.shard?.current_tick||0,[r,l,p,c,v,d,u]=await Promise.all([he(a,n,m),a.from("factions").select("*").eq("nation_id",n).eq("faction_type","party"),a.from("faction_ideology").select("*"),a.from("faction_electoral_standing").select("*").eq("nation_id",n),a.from("campaign_actions").select("*").eq("party_id",m).order("tick_performed",{ascending:!1}).limit(20),a.from("caucus_factions").select("*").eq("party_id",m).eq("is_active",!0),a.from("elections").select("*").eq("nation_id",n).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(5)]);l.error&&console.error("[PartyOverview] Parties fetch error:",l.error.message),p.error&&console.error("[PartyOverview] Ideology fetch error:",p.error.message),c.error&&console.error("[PartyOverview] Standings fetch error:",c.error.message),v.error&&console.error("[PartyOverview] Activity fetch error:",v.error.message),d.error&&console.error("[PartyOverview] Caucus fetch error:",d.error.message),u.error&&console.error("[PartyOverview] Election fetch error:",u.error.message);const g=l.data||[],x=r.administration,_={};for(const S of p.data||[])_[S.faction_id]=S;let b={score:0,deltas:[],decayCycles:0,multiplier:1,ticksInPower:0};x&&x.stats_at_start&&(b=Ma(o,x.stats_at_start,x.started_at_tick,f));const C=u.data||[],w=C[0]||null,k=w?Math.max(0,w.election_tick-f):null;let M=null;w&&o&&(o.government_type?.toLowerCase().includes("presidential")||o.hos_election_method==="direct_vote")&&(M=C.some(I=>I.election_type==="presidential"&&I.election_tick===w.election_tick)?"General":"Midterm");const E=Ia(m,_,g);Ie={isOpposition:r.isOpposition,administration:x,governanceScore:b.score,governanceDeltas:b.deltas.sort((S,N)=>Math.abs(N.signed)-Math.abs(S.signed)),governanceMultiplier:b.multiplier,governanceDecayCycles:b.decayCycles,ticksInPower:b.ticksInPower,myFaction:s,allParties:g,rivalParties:g.filter(S=>S.id!==m),factionIdeology:_,electoralStandings:c.data||[],recentActivity:v.data||[],caucuses:d.data||[],nextElection:w,nextElectionTicks:k,nextElectionLabel:M,ideologyAxes:E},Se(i)}catch(f){console.error("[PartyOverview] Init error:",f),i.innerHTML='<div style="padding:40px;text-align:center;color:var(--red);font-family:var(--font-mono);font-size:10px;">Failed to load party overview.</div>'}}let tt=[];function Se(a){const t=Ie,e=t.myFaction,i=gt.nation,s=e?.party_color||e?.color||"#c8a832";gt.shard?.current_tick,tt.length===0&&(tt=[e?.id,...t.rivalParties.map(l=>l.id)]),t.administration?.admin_name||t.isOpposition;const o=t.isOpposition?"OPPOSITION":"GOVERNING",n=t.isOpposition?"var(--orange)":"var(--green)",m=e?.seats||0,f=i?.total_seats||100,r=e?.momentum??50;a.innerHTML=`<div class="po-page">
        ${La(t,s,m,f,r)}
        <div class="po-columns">
            <div class="po-col-left">
                ${Aa(t,e,s,o,n)}
                ${Pa(t)}
                ${Ta(t,e,s)}
                ${Na(t)}
            </div>
            <div class="po-col-center" id="po-center-col">
                ${za(t,r)}
                ${Fa(t)}
            </div>
            <div class="po-col-right" id="po-right-col">
                ${Ra(t,e)}
                ${Oa(t)}
                ${Da()}
            </div>
        </div>
    </div>`,a.querySelectorAll(".po-legend-item").forEach(l=>{l.addEventListener("click",()=>{const p=l.dataset.partyId;p!==e?.id&&(tt.includes(p)?tt=tt.filter(c=>c!==p):tt.push(p),Se(a))})})}function La(a,t,e,i,s){const o=a.governanceScore,n=o>=0?"var(--green)":"var(--red)",m=a.isOpposition?"Opposition":a.administration?.admin_name||"Government",f=(gt.nation?.government_type||"").toLowerCase().includes("monarchy"),r=f?"No elections":a.nextElectionTicks!=null?a.nextElectionTicks:"—",l=f?"var(--text-dim)":typeof r=="number"&&r<=3?"var(--red)":"var(--text-bright)",p=f?"NEXT ELECTION":a.nextElectionLabel?"NEXT "+a.nextElectionLabel.toUpperCase():"NEXT ELECTION";return`<div class="po-summary">
        <div class="po-summary-cell" style="display:flex;flex-direction:row;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;background:${t};"></div>
            <div>
                <div style="font-size:11px;font-weight:700;color:var(--text-bright);">${U(m)}</div>
                <div class="po-summary-sub">${a.ticksInPower} ticks in power</div>
            </div>
        </div>
        <div class="po-summary-cell" style="text-align:center;">
            <div class="po-summary-label">GOV. SCORE</div>
            <div class="po-summary-value" style="color:${n};">${o}</div>
        </div>
        <div class="po-summary-cell" style="text-align:center;">
            <div class="po-summary-label">MOMENTUM</div>
            <div style="display:flex;align-items:baseline;justify-content:center;gap:3px;">
                <span class="po-summary-value" style="color:var(--orange);">${s}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/ 100</span>
            </div>
        </div>
        <div class="po-summary-cell" style="text-align:center;">
            <div class="po-summary-label">SEATS</div>
            <div style="display:flex;align-items:baseline;justify-content:center;gap:3px;">
                <span class="po-summary-value" style="color:${t};">${e}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/ ${i}</span>
            </div>
        </div>
        <div class="po-summary-cell" style="text-align:center;">
            <div class="po-summary-label">${p}</div>
            <div class="po-summary-value" style="color:${l};">${r}${typeof r=="number"?" ticks":""}</div>
        </div>
    </div>`}function Aa(a,t,e,i,s){const o=t?.leader_first_name&&t?.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown",n=((t?.leader_first_name||"?")[0]+(t?.leader_last_name||"?")[0]).toUpperCase();t?.leader_age&&`${t.leader_age}`;const m=t?.approval_rating??0;return`<div class="po-card po-identity" style="border-left-color:${e};">
        <div class="po-identity-inner">
            <div class="po-identity-logo" style="color:${e};background:${e}12;border-color:${e}33;">${n}</div>
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                    <span class="po-identity-name">${U(t?.faction_name)}</span>
                    <span class="po-identity-badge" style="color:${s};background:${s}0a;border-color:${s}44;">${i}</span>
                </div>
                <div class="po-identity-meta">${a.ticksInPower} ticks in power</div>
                <div class="po-leader-row">
                    <div class="po-leader-avatar" style="color:${e};background:${e}15;border-color:${e}33;">${n}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-size:10px;font-weight:600;color:var(--text-bright);">${U(o)}</span>
                            <span style="font-family:var(--font-mono);font-size:7px;color:${e};">PARTY LEADER</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">APPROVAL</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--amber);">${m}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`}function Pa(a){const t=a.governanceDeltas.slice(0,12),e=a.governanceScore,i=e>=0?"var(--green)":"var(--red)",s=a.governanceDecayCycles>0&&e>0?`Decay: ${((1-a.governanceMultiplier)*100).toFixed(1)}% (${a.governanceDecayCycles} cycles)`:"",o=t.map((n,m)=>{const f=n.isGood?"var(--green)":"var(--red)",r=n.delta>0?"+":"",l=n.key.replace(/_/g," ").replace(/\b\w/g,p=>p.toUpperCase());return`<div class="po-gov-row" style="${m<t.length-1?"border-bottom:1px solid rgba(200,196,184,0.03);":""}">
            <span class="po-gov-stat">${U(l)}</span>
            <span class="po-gov-val">${n.start.toFixed(1)}</span>
            <span class="po-gov-val">${n.now.toFixed(1)}</span>
            <span class="po-gov-delta" style="color:${f};">${r}${n.delta.toFixed(1)}</span>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <div style="display:flex;align-items:center;gap:6px;">
                <span class="po-card-title">GOVERNANCE</span>
                <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${i};">${e}</span>
            </div>
            <span class="po-card-subtitle">${s}</span>
        </div>
        <div style="display:flex;padding:4px 12px;border-bottom:1px solid var(--border-main);background:var(--bg-card);">
            <span style="flex:1;font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.04em;">STAT</span>
            <span style="width:40px;font-family:var(--font-mono);font-size:6px;color:var(--text-dim);text-align:right;">START</span>
            <span style="width:40px;font-family:var(--font-mono);font-size:6px;color:var(--text-dim);text-align:right;">NOW</span>
            <span style="width:44px;font-family:var(--font-mono);font-size:6px;color:var(--text-dim);text-align:right;">DELTA</span>
        </div>
        ${o||'<div style="padding:12px;text-align:center;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);font-style:italic;">No governance data yet.</div>'}
    </div>`}function Ta(a,t,e){const s=[{id:t?.id,name:"You",color:e},...a.rivalParties.map(n=>({id:n.id,name:n.abbreviation||n.faction_name?.slice(0,3)||"?",color:n.party_color||"#666"}))].map(n=>{const m=tt.includes(n.id);return`<div class="po-legend-item ${m?"active":"inactive"}" data-party-id="${n.id}" style="${m?`background:${n.color}12;border-color:${n.color}44;`:""}">
            <div class="po-legend-dot" style="background:${m?n.color:"var(--text-dim)"};"></div>
            <span class="po-legend-name">${U(n.name)}</span>
        </div>`}).join(""),o=a.ideologyAxes.map(n=>{const m=n.parties.filter(r=>tt.includes(r.id)).map(r=>`<div class="po-axis-dot" style="left:${r.pos*100}%;background:${r.color};"></div>`).join(""),f=[20,40,60,80].map(r=>`<div class="po-axis-zone" style="left:${r}%;"></div>`).join("");return`<div class="po-axis">
            <div class="po-axis-labels">
                <span class="po-axis-label">${U(n.left)}</span>
                <span class="po-axis-name">${U(n.name)}</span>
                <span class="po-axis-label">${U(n.right)}</span>
            </div>
            <div class="po-axis-track">${f}${m}</div>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">IDEOLOGY</span>
        </div>
        <div style="padding:8px 12px;">
            <div class="po-legend">${s}</div>
            ${o}
        </div>
    </div>`}function Na(a){const t=(a.caucuses||[]).filter(s=>s.name&&s.name!=="Unnamed");if(t.length===0)return`<div class="po-card">
            <div class="po-card-header">
                <span class="po-card-title">INTERNAL CAUCUSES</span>
                <span class="po-card-subtitle">None</span>
            </div>
        </div>`;const e=a.faction?.seats||0,i=t.map(s=>{const o=s.relationship_score??50,n=o>60?"var(--green)":o>40?"var(--amber)":"var(--red)",m=Math.round((s.seat_share||0)*e),f=(s.dominant_axis||"").replace(/_/g,"/"),r=s.wing_end==="left"?f.split("/")[0]:f.split("/")[1]||"";return`<div class="po-caucus-row">
            <div>
                <div class="po-caucus-name">${U(s.name)}</div>
                <div class="po-caucus-wing" style="color:var(--text-dim);">${U(r)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="po-caucus-seats">${m} seats</span>
                <div style="width:50px;">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;margin-bottom:1px;">LOYALTY</div>
                    <div style="width:100%;height:3px;background:var(--border-main);"><div style="height:100%;width:${o}%;background:${n};"></div></div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${n};text-align:right;margin-top:1px;">${o}</div>
                </div>
            </div>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">INTERNAL CAUCUSES</span>
            <span class="po-card-subtitle">${t.length} active · ${e} seats</span>
        </div>
        ${i}
    </div>`}function za(a,t){const i=Math.round(t*8/100*10)/10,s=Math.min(100,Math.max(0,t)),o=t>=60?"var(--green)":t>=30?"var(--orange)":"var(--red)";return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">MOMENTUM</span>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--red);">losing ${i}/tick</span>
        </div>
        <div style="padding:10px 12px;">
            <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:6px;">
                <span style="font-family:var(--font-mono);font-size:28px;font-weight:700;color:${o};">${t}</span>
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">/ 100</span>
            </div>
            <div style="width:100%;height:4px;background:var(--border-main);">
                <div style="height:100%;width:${s}%;background:${o};"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:4px;">
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">Decays 8%/tick</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">30% of election outcome</span>
            </div>
        </div>
    </div>`}function Fa(a){const t=a.recentActivity||[],e=gt.shard?.current_tick||0;if(t.length===0)return`<div class="po-card" style="flex:1;">
            <div class="po-card-header">
                <span class="po-card-title">RECENT ACTIVITY</span>
            </div>
            <div style="padding:24px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No recent actions.</div>
        </div>`;const i={rally:"Rally",press_conference:"Press Conference",attack:"Attack Ad",issue_statement:"Statement",ideological_pivot:"Ideology Shift",take_stance:"Took Stance",poll_now:"Polled",endorse:"Endorsement",lobby:"Lobby"};return`<div class="po-card" style="flex:1;">
        <div class="po-card-header">
            <span class="po-card-title">RECENT ACTIVITY</span>
        </div>
        <div style="max-height:380px;overflow-y:auto;">${t.map(o=>{const n=e-(o.tick_performed||0),m=n===0?"0t":n+"t",f=o.result||{},r=f.momentumDelta||f.momentum_delta||(f.effects||[]).reduce((d,u)=>d+(u.stat==="Momentum"?u.value:0),0)||0,l=r>0?"+":"",p=r>0?"var(--green)":r<0?"var(--red)":"var(--text-dim)";let v=i[o.action_type]||o.action_type?.replace(/_/g," ")||"?";return o.action_type==="rally"?v="Rally: "+(f.outcomeName||"Unknown")+(r?" ("+l+r+")":""):o.action_type==="press_conference"?v="Press Conference ("+l+r+")":o.action_type==="attack"?v="Attack on "+(f.targetName||"rival"):o.action_type==="issue_statement"?v="Issued statement"+(r?" ("+l+r+")":""):o.action_type==="take_stance"?v="Took stance on "+(f.issueLabel||"issue"):o.action_type==="ideological_pivot"?v="Ideology shift: "+(f.targetAxis||""):o.action_type==="poll_now"&&(v="Polled (margin: "+(f.pollMargin||"?")+")"),`<div style="padding:5px 12px;border-bottom:1px solid rgba(200,196,184,0.03);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:9px;color:var(--text-secondary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:8px;">${U(v)}</span>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${p};">${r!==0?l+r:"—"}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);width:20px;text-align:right;">${m}</span>
            </div>
        </div>`}).join("")}</div>
    </div>`}function Ra(a,t){const e=a.rivalParties,i=a.administration,s=new Set((Array.isArray(i?.coalition_parties)?i.coalition_parties:[]).map(l=>l?typeof l=="string"?l:typeof l=="object"&&(l.party_id||l.id)||null:null).filter(Boolean)),o=i?.pm_party_id,n=gt.nation?.total_seats||100,m=["SEC/FRE","TRA/PRO","IND/COL","LIB/EQL","GLB/NAT"],f=["security_freedom","tradition_progress","individualism_collectivism","liberty_equality","globalism_nationalism"],r=e.map(l=>{const p=l.party_color||"#666",c=l.abbreviation||l.faction_name?.slice(0,3)?.toUpperCase()||"?",v=l.leader_first_name&&l.leader_last_name?`${l.leader_first_name} ${l.leader_last_name}`:"Unknown",d=l.seats||0,u=l.id===o,g=s.has(l.id);let x,_;u?(x="GOVERNING — LEAD",_="var(--green)"):g?(x="GOVERNING — JUNIOR",_="var(--green)"):(x="OPPOSITION",_="var(--orange)");const b=d-(t?.seats||0),C=b>0?"var(--green)":b<0?"var(--red)":"var(--text-dim)",w=a.factionIdeology[l.id],k=f.map((M,E)=>{const N=((w?Number(w[M]??0):0)+100)/200;return`<div style="display:flex;align-items:center;gap:6px;">
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);width:42px;text-align:right;">${m[E]}</span>
                <div style="flex:1;height:5px;background:var(--border-main);position:relative;">
                    <div style="position:absolute;top:50%;left:${N*100}%;transform:translate(-50%,-50%);width:8px;height:8px;border-radius:50%;background:${p};"></div>
                </div>
            </div>`}).join("");return`<div style="padding:12px 16px;border-bottom:1px solid var(--border-main);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:36px;height:36px;background:${p}15;border:1px solid ${p}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${p};">${U(c)}</div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:var(--text-bright);">${U(l.faction_name)}</div>
                        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${U(v)}</div>
                    </div>
                </div>
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 7px;color:${_};background:${_}0a;border:1px solid ${_}44;white-space:nowrap;">${x}</span>
            </div>
            <div style="display:flex;gap:10px;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">SEATS</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${d>0?"var(--text-bright)":"var(--text-dim)"};">${d}</span>
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">/ ${n}</span>
                </div>
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">VS YOU</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${C};">${b>0?"+":""}${b}</span>
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:3px;">${k}</div>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">RIVAL PARTIES</span>
            <span class="po-card-subtitle">${e.length} parties</span>
        </div>
        ${r||'<div style="padding:16px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No rival parties.</div>'}
    </div>`}function Oa(a){return`<div class="po-card" style="padding:8px 12px;">
        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.06em;color:var(--text-dim);margin-bottom:4px;">ELECTION FORMULA</div>
        <div style="display:flex;gap:6px;">
            <div style="flex:1;padding:6px 8px;text-align:center;background:var(--bg-card);border:1px solid var(--border-main);">
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${a.governanceScore>=0?"var(--green)":"var(--red)"};">40%</div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);margin-top:2px;">Governance</div>
            </div>
            <div style="flex:1;padding:6px 8px;text-align:center;background:var(--bg-card);border:1px solid var(--border-main);">
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--orange);">30%</div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);margin-top:2px;">Momentum</div>
            </div>
            <div style="flex:1;padding:6px 8px;text-align:center;background:var(--bg-card);border:1px solid var(--border-main);">
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--accent);">30%</div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);margin-top:2px;">Ideology</div>
            </div>
        </div>
    </div>`}function Da(){return`<div style="background:var(--bg-card);border:1px solid var(--border-main);padding:8px 12px;">
        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.6;">
            <span style="color:var(--amber);font-weight:700;">⚠ INCUMBENCY DECAY:</span> Positive governance scores erode 3% every 24 ticks. Long-serving governments must keep delivering results.
            <span style="color:var(--text-bright);font-weight:700;"> Momentum resets to 0</span> after every election. Rebuild each cycle.
        </div>
    </div>`}let T=null,z=null,rt=!1,yt=null,G=[],dt=[],X=0,Z=0,Pt=null,at=0,vt=[],qt=!1,xt=null,q={},Ht=!1;function _t(a){if(!a)return"";const t=document.createElement("div");return t.textContent=a,t.innerHTML}const Ba=6,ja=4;async function Le(a,t){T=a,z=t;const e=t.nation,i=t.faction;if(!e||!i)return{needed:!1};const[s,o,n,m,f]=await Promise.all([a.from("elections").select("id, election_type, election_tick, status").eq("nation_id",e.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),a.from("shard").select("current_tick").eq("name","Alpha Shard").single(),a.from("government_formations").select("id, status, election_id, formed_at, formed_tick, created_at, created_tick").eq("nation_id",e.id).in("status",["formed","active"]).order("formed_at",{ascending:!1,nullsFirst:!1}).limit(1).maybeSingle(),a.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",e.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),a.from("head_of_government").select("id").eq("nation_id",e.id).eq("active",!0).limit(1).maybeSingle()]);at=o.data?.current_tick??0,G=m.data||[],X=G.reduce((u,g)=>u+(g.seats||0),0),Z=Math.ceil(X/2)+1;const r=s.data,l=n.data||null,p=!!f.data,c=(()=>{if(!l)return!1;if(!r||l.election_id&&l.election_id===r.id)return!0;const u=[l.formed_tick,l.created_tick].map(g=>Number(g)).filter(g=>Number.isFinite(g));return u.length>0&&Number.isFinite(r.election_tick)?Math.max(...u)>=r.election_tick:!1})(),v=c||p;if((e.government_type||"").toLowerCase().includes("presidential")||e.hos_election_method==="direct_vote"){if(rt=!1,r&&!c)try{const u=o.data?.current_tick??0,{data:g}=await a.from("presidents").select("faction_id").eq("nation_id",e.id).eq("is_active",!0).maybeSingle(),x=g?.faction_id||G[0]?.id;if(x){const _=(e.government_type||"").toLowerCase().includes("semi");await a.from("government_formations").insert({nation_id:e.id,proposed_by:x,status:"formed",party_ids:[x],formation_type:"coalition",formed_at:new Date().toISOString()}),await a.from("ministries").delete().eq("nation_id",e.id).eq("is_active",!0);const b=[["interior","Minister of the Interior"],["foreign","Minister of Foreign Affairs"],["defense","Minister of Defense"],["finance","Minister of Finance"],["education","Minister of Education"],["healthcare","Minister of Health"],["labor","Minister of Labor"],["justice","Minister of Justice"],["trade","Minister of Trade"],["energy","Minister of Energy"],["transportation","Minister of Transportation"]];_&&b.unshift(["prime_minister","Prime Minister"]);const C=b.map(([w,k])=>({nation_id:e.id,ministry_key:w,ministry_name:k,party_id:_?null:x,is_active:!0}));await a.from("ministries").insert(C),_&&await a.from("head_of_government").delete().eq("nation_id",e.id)}}catch(u){console.warn("[Coalition] Presidential auto-gov failed:",u.message)}return{needed:!1}}return r&&!v?(rt=!0,yt=r.id,Pt=r.election_tick):(rt=!v,r&&(yt=r.id,Pt=r.election_tick)),{needed:rt}}async function pt(a){if(!a)return;const t=z.nation?.id,e=(z.nation?.government_type||"").toLowerCase().includes("semi");if(t&&!e){const{count:w}=await T.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",t).eq("is_active",!0).is("party_id",null);if(w&&w>=5){const{data:k}=await T.from("government_formations").select("*").eq("nation_id",t).not("ministry_assignments","eq","{}").order("created_at",{ascending:!1}).limit(1).maybeSingle();if(k&&k.ministry_assignments&&Object.keys(k.ministry_assignments).length>=5){k.status!=="formed"&&(await T.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",k.id),await T.from("government_formations").update({status:"cancelled"}).eq("nation_id",t).eq("status","active").neq("id",k.id)),q=k.ministry_assignments,await ae(t);const M=k.ministry_assignments.prime_minister;if(M)try{await be(T,t,M,at,{skipCoalitionCheck:!0})}catch(E){console.warn("[Coalition] PM appointment during repair failed:",E.message)}rt=!1,a.innerHTML=`<div class="cf-page">
                    <div class="cf-no-formation">
                        <div class="cf-no-icon">✓</div>
                        <div class="cf-no-title">Government Formed — Cabinet Populated</div>
                        <div class="cf-no-desc">Ministry assignments have been applied. Refresh the Government page to see your cabinet.</div>
                    </div>
                </div>`;return}}}if((z.nation?.government_type||"").toLowerCase().includes("presidential")||z.nation?.hos_election_method==="direct_vote"){const w=(z.nation?.government_type||"").toLowerCase().includes("semi");a.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#127979;</div>
                <div class="cf-no-title">${w?"Semi-Presidential System":"Presidential System"}</div>
                <div class="cf-no-desc">${w?"The President nominates a Prime Minister for parliamentary confirmation. The PM then appoints cabinet ministers. No coalition formation is required.":"The President governs directly and nominates cabinet ministers. No coalition formation is required."}</div>
            </div>
        </div>`;return}const s=(z.nation?.government_type||"").toLowerCase();if(s.includes("absolute")&&s.includes("monarchy")){a.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#128081;</div>
                <div class="cf-no-title">Absolute Monarchy</div>
                <div class="cf-no-desc">The Crown rules by decree. There are no elections.</div>
            </div>
        </div>`;return}if(!rt){a.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">✓</div>
                <div class="cf-no-title">Government Formed</div>
                <div class="cf-no-desc">A coalition government is currently active. No formation needed.</div>
            </div>
        </div>`;return}if(!yt){const w=z.nation?.id;let k="?";if(w){const{data:M}=await T.from("elections").select("election_tick").eq("nation_id",w).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(1).maybeSingle();M&&(k=Math.max(0,M.election_tick-at))}a.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon" style="font-size:2rem;">&#9878;</div>
                <div class="cf-no-title">No Government</div>
                <div class="cf-no-desc">No election has been held yet. The first election is in <strong style="color:var(--accent);">${k}</strong> tick${k!==1?"s":""}.</div>
            </div>
        </div>`;return}await Ka();const o=z.faction,m=(z.nation?.failed_formation_attempts||0)>=1?ja:Ba,f=Pt!==null?Math.max(0,at-Pt):0,r=Math.max(0,m-f),l=Math.min(100,f/m*100),p=f*2;let c="safe";r<=1?c="critical":r<=2&&(c="warning");const v=c==="critical"?"⚠️":c==="warning"?"⏳":"🤝",d=c==="critical"?"No Government — Snap Election Imminent":c==="warning"?"Coalition Formation — Time Running Out":"Coalition Formation In Progress",u=c==="critical"?"Form a government immediately or face snap elections":c==="warning"?"Parties are negotiating — the deadline is approaching":"Parties are negotiating a coalition — propose or join one below",g=G.find(w=>w.id===o.id)?.seats||0,x=g>0,_=dt.some(w=>w.proposed_by===o.id);let b="";if(!x)b='<div class="cf-note">Your party has <strong>0 seats</strong>. You cannot propose a coalition, but you may be invited to one.</div>';else if(_)b='<div class="cf-note">You have already submitted a proposal for this election.</div>';else{const w=G.map(k=>{const M=k.id===o.id,E=k.seats||0,S=k.party_color||"#888";return`<div class="cf-party-check ${M?"checked disabled":""}" data-party-id="${k.id}" style="border-left:3px solid ${S};">
                <div class="cf-check-box">${M?"✓":""}</div>
                <span class="cf-check-name">${_t(k.faction_name)}</span>
                <span class="cf-check-seats">${E} seats</span>
            </div>`}).join("");b=`
            <div class="cf-propose-section">
                <div class="cf-section-title">Propose a Government</div>
                <div class="cf-section-desc">Select which parties will form the coalition. You need ${Z}+ seats for a majority.</div>
                <div class="cf-party-grid" id="cf-party-grid">${w}</div>
                <div class="cf-seat-preview" id="cf-seat-preview">
                    Coalition seats: <span class="cf-preview-val" id="cf-preview-seats">${g}</span> / ${X}
                    (<span id="cf-preview-pct">${X?Math.round(g/X*100):0}</span>%)
                    <span id="cf-preview-threshold" style="margin-left:8px;color:var(--text-dim);">— needs ${Z} seats</span>
                </div>
                <button class="cf-submit-btn" id="cf-propose-btn">Submit Proposal</button>
            </div>`}const C=dt.length>0?`
        <div class="cf-section-title" style="margin-top:16px;">Active Proposals</div>
        <div class="cf-proposals-grid">${dt.map(w=>{const k=G.find(it=>it.id===w.proposed_by),M=w.party_ids||[],E=M.reduce((it,ot)=>it+(G.find(H=>H.id===ot)?.seats||0),0),S=X?Math.round(E/X*100):0,N=E>=Z,I=M.map(it=>{const ot=G.find(H=>H.id===it);return`<span class="cf-party-chip" style="border-left:2px solid ${ot?.party_color||"#888"};">${_t(ot?.faction_name||"?")} · ${ot?.seats||0}</span>`}).join("");let R="";w.iAmSupporting?R='<span class="cf-status cf-status--supporting">✓ SUPPORTING</span>':w.iAmInvited?R='<span class="cf-status cf-status--invited">INVITED</span>':R='<span class="cf-status cf-status--locked">NOT INVITED</span>';const L=w.iAmInvited&&!w.iAmSupporting?`<button class="cf-support-btn" data-formation-id="${w.id}" data-action="support">Support This Coalition</button>`:w.iAmSupporting?`<button class="cf-withdraw-btn" data-formation-id="${w.id}" data-action="withdraw">Withdraw Support</button>`:"",P=w.supportCount>=w.coalitionSize,F=xt===w.id,A=P&&w.iAmInvited&&!F,j=P&&F;return`<div class="cf-proposal-card ${w.iAmSupporting?"supporting":""} ${w.iAmInvited?"":"not-invited"}">
                <div class="cf-proposal-title">${_t(k?.faction_name||"Unknown")} Coalition ${R}</div>
                <div class="cf-proposal-seats">Seats: <span style="color:${N?"var(--green)":"var(--red)"};">${E}</span> (${S}%) ${N?"✓":"— below threshold"}</div>
                <div class="cf-proposal-chips">${I}</div>
                <div class="cf-proposal-support">Support: ${w.supportCount} / ${w.coalitionSize} coalition members ${P?'<span style="color:var(--green);font-weight:700;"> — UNANIMOUS</span>':""}</div>
                ${L}
                ${A?`<button class="cf-support-btn" data-formation-id="${w.id}" data-action="configure" style="margin-top:6px;background:var(--green);color:#000;border-color:var(--green);">Configure Government &amp; Assign Ministries</button>`:""}
                ${j?Ua(w):""}
            </div>`}).join("")}</div>
    `:"";a.innerHTML=`<div class="cf-page">
        <!-- Formation Banner -->
        <div class="cf-banner cf-banner--${c}">
            <div class="cf-banner-header">
                <span class="cf-banner-icon">${v}</span>
                <div>
                    <div class="cf-banner-title">${d}</div>
                    <div class="cf-banner-subtitle">${u}</div>
                </div>
            </div>
            <div class="cf-countdown">
                <div class="cf-countdown-track"><div class="cf-countdown-fill cf-countdown-fill--${c}" style="width:${l}%;"></div></div>
                <div class="cf-countdown-text">${r>0?r+" tick"+(r!==1?"s":"")+" remaining":"⚡ SNAP ELECTION IMMINENT"}</div>
            </div>
            <div class="cf-penalties">
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--red);">-2%</div>
                    <div class="cf-penalty-label">Approval / Tick</div>
                </div>
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--orange);">${f}</div>
                    <div class="cf-penalty-label">Ticks Elapsed</div>
                </div>
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--red);">-${p}%</div>
                    <div class="cf-penalty-label">Total Lost</div>
                </div>
            </div>
        </div>

        ${b}
        ${C}
    </div>`,vt=[o.id],Wa(a)}const Ga={prime_minister:"Prime Minister",interior:"Interior",foreign:"Foreign Affairs",defense:"Defense",finance:"Finance",education:"Education",healthcare:"Healthcare",labor:"Labor",justice:"Justice",trade:"Trade",energy:"Energy",transportation:"Transportation",security:"Security"},qa=["prime_minister","interior","foreign","defense","finance","education","healthcare","labor","justice","trade","energy","transportation"];function Ha(a){const t=(a?.government_type||"").toLowerCase(),e=t.includes("presidential")||a?.hos_election_method==="direct_vote",i=t.includes("semi"),s=["prime_minister","interior","foreign","defense","finance","education","healthcare","labor","justice","trade","energy","transportation"],o=["interior","foreign","defense","finance","education","healthcare","labor","justice","trade","energy","transportation"];return i?s:e?o:s}function Ua(a){const t=(a.party_ids||[]).map(r=>G.find(l=>l.id===r)).filter(Boolean),e=(a.party_ids||[]).includes(z.faction?.id);q={...a.ministry_assignments||{}};const s=z.faction?.id,o=q.prime_minister,n=o===s;let m=`<div style="padding:12px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--accent);margin-bottom:10px;">CONFIGURE GOVERNMENT</div>
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:12px;">All coalition members can assign ministries. The party selected as Prime Minister clicks Form Government.</div>`;for(const r of qa){const l=Ga[r]||r,p=r==="prime_minister",c=q[r];e&&(m+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="width:140px;font-family:var(--font-mono);font-size:10px;font-weight:${p?"700":"400"};color:${p?"var(--accent)":"var(--text-secondary)"};letter-spacing:0.5px;">${l}</span>
                <select data-ministry="${r}" class="cf-ministry-select" style="flex:1;padding:4px 8px;font-family:var(--font-mono);font-size:10px;color:var(--text-bright);background:var(--bg-body);border:1px solid var(--border-main);outline:none;">
                    <option value="">— Select Party —</option>
                    ${t.map(v=>`<option value="${v.id}" ${c===v.id?"selected":""}>${_t(v.faction_name)} (${v.seats||0} seats)</option>`).join("")}
                </select>
            </div>`)}const f=!!q.prime_minister;if(f&&n)m+=`<div style="margin-top:14px;display:flex;justify-content:flex-end;">
            <button id="cf-form-gov-btn" style="padding:10px 28px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1.5px;color:#000;background:var(--green);border:1px solid var(--green);cursor:pointer;">FORM GOVERNMENT</button>
        </div>`;else if(f&&!n){const r=t.find(l=>l.id===o);m+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(92,204,92,0.04);border:1px solid rgba(92,204,92,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Waiting for <span style="color:var(--green);font-weight:700;">${_t(r?.faction_name||"PM party")}</span> to click Form Government.
        </div>`}else m+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Select a Prime Minister to enable government formation.
        </div>`;return m+="</div>",m}async function Ya(a,t){if(Ht)return;const e=q.prime_minister;if(!e){alert("You must assign a Prime Minister first.");return}console.log("[Coalition] handleFormGovernment called. Assignments:",JSON.stringify(q)),console.log("[Coalition] Formation:",a.id,"PM party:",e),Ht=!0;const i=document.getElementById("cf-form-gov-btn");i&&(i.disabled=!0,i.textContent="FORMING...");try{const s=z.nation,o=s.id,{error:n}=await T.from("government_formations").update({ministry_assignments:q}).eq("id",a.id);if(n)throw new Error("Failed to save assignments: "+n.message);let m=!1;try{const d=Mt?Mt(null,s):{},{error:u}=await T.rpc("finalize_government_formation",{p_formation_id:a.id,p_caller_faction_id:z.faction.id,p_ministry_baselines:d||{}});if(u)throw u;m=!0}catch(d){console.warn("[Coalition] RPC failed, using fallback:",d.message)}m||await Va(a),await T.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",a.id);const r=Ha(s).length,{count:l}=await T.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",o).eq("is_active",!0),{count:p}=await T.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",o).eq("is_active",!0).is("party_id",null);(!l||l<r||p&&p>0)&&(console.warn(`[Coalition] Ministry invariant check failed (expected=${r}, active=${l||0}, vacant=${p||0}) — populating from assignments`),await ae(o));const{data:c,error:v}=await T.from("administrations").select("id").eq("nation_id",o).is("ended_at_tick",null).limit(1).maybeSingle();if(v)console.warn("[Coalition] Failed to verify active administration:",v.message);else if(!c)try{const d={id:a.id,party_ids:a.party_ids||[],lead_party_id:q.prime_minister};await xe(T,o,z.nation,"election",d,G,at,z.shard?.current_date||"",Number(z.nation?.gov_approval??50))}catch(d){console.warn("[Coalition] Post-finalization administration rollover failed (non-fatal):",d.message)}await be(T,o,e,at,{skipCoalitionCheck:!0}),rt=!1,alert("Government formed successfully!"),await pt(t)}catch(s){console.error("[Coalition] Form government failed:",s),alert("Failed to form government: "+(s.message||s))}finally{Ht=!1,i&&(i.disabled=!1,i.textContent="FORM GOVERNMENT")}}async function Va(a){const t=z.nation.id,{error:e}=await T.from("government_formations").update({status:"cancelled"}).eq("nation_id",t).eq("status","active").neq("id",a.id);e&&console.warn("[Coalition] Failed to cancel rival formations:",e.message);const{error:i}=await T.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",a.id);if(i)throw i;const{error:s}=await T.from("nations").update({failed_formation_attempts:0}).eq("id",t);s&&console.warn("[Coalition] Failed to reset formation attempts:",s.message),await ae(t);try{const o={id:a.id,party_ids:a.party_ids||[],lead_party_id:q.prime_minister};await xe(T,t,z.nation,"election",o,G,at,z.shard?.current_date||"",Number(z.nation?.gov_approval??50))}catch(o){console.warn("[Coalition] Administration rollover failed (non-fatal):",o.message)}try{const o=q.prime_minister,n=G.find(f=>f.id===o),m=(a.party_ids||[]).map(f=>{const r=G.find(l=>l.id===f);return r?`${r.faction_name} (${r.seats||0})`:null}).filter(Boolean).join(", ");await T.from("event_log").insert({nation_id:t,event_name:"Coalition Government Formed",category:"government",fired_at_tick:at,description_used:`${n?.faction_name||"PM party"} formed a coalition government with: ${m}`,description_chosen:`${n?.faction_name||"PM party"} formed a coalition government with: ${m}`})}catch(o){console.warn("[Coalition] event_log insert failed (non-fatal):",o.message)}}async function ae(a){const t={prime_minister:"Prime Minister",interior:"Minister of the Interior",foreign:"Minister of Foreign Affairs",defense:"Minister of Defense",finance:"Minister of Finance",education:"Minister of Education",healthcare:"Minister of Health",labor:"Minister of Labor",justice:"Minister of Justice",trade:"Minister of Trade",energy:"Minister of Energy",transportation:"Minister of Transportation",security:"Minister of Security"};let e=0;for(const[i,s]of Object.entries(q)){if(!s)continue;const o=Zt(z.nation?.name)||{},n=o.firstNames||["Alex","Maria","Carlos"],m=o.lastNames||["Garcia","Torres","Silva"],f=n[Math.floor(Math.random()*n.length)],r=m[Math.floor(Math.random()*m.length)],l=35+Math.floor(Math.random()*25),p=Mt?Mt(i,z.nation):{},c=t[i]||i,{data:v,error:d}=await T.from("ministries").update({party_id:s,minister_first_name:f,minister_last_name:r,minister_age:l,minister_approval:50,stat_baselines:p,is_active:!0}).eq("nation_id",a).eq("ministry_key",i).select("id");if(d)console.error(`[Coalition] FAILED to update ministry ${i}:`,d.message);else if(!v||v.length===0){const{error:x}=await T.from("ministries").insert({nation_id:a,ministry_key:i,ministry_name:c,party_id:s,minister_first_name:f,minister_last_name:r,minister_age:l,minister_approval:50,stat_baselines:p,is_active:!0});x?console.error(`[Coalition] FAILED to insert ministry ${i}:`,x.message):e++}else e++;const u=c,{error:g}=await T.from("cabinet_members").update({party_id:s,person_name:f+" "+r}).eq("nation_id",a).eq("position",u).eq("is_active",!0);g&&console.warn(`[Coalition] cabinet_members update failed for ${u}:`,g.message)}console.log(`[Coalition] Updated ${e} ministries for nation ${a}`)}async function Ka(){if(!yt){dt=[];return}const{data:a}=await T.from("government_formations").select("*").eq("election_id",yt).eq("status","active").order("created_at",{ascending:!0}),t=[];for(const e of a||[]){const{data:i}=await T.from("government_formation_support").select("faction_id, supports").eq("formation_id",e.id),s=e.party_ids||[],n=(i||[]).filter(p=>s.includes(p.faction_id)).filter(p=>p.supports).length,m=s.length,r=(i||[]).find(p=>p.faction_id===z.faction?.id)?.supports===!0,l=s.includes(z.faction?.id);t.push({...e,supportCount:n,coalitionSize:m,iAmSupporting:r,iAmInvited:l})}dt=t}let ve=!1;function Wa(a){ve||(ve=!0,a.addEventListener("click",async t=>{const e=t.target.closest(".cf-party-check:not(.disabled)");if(e){const s=e.dataset.partyId,o=vt.indexOf(s);o>-1?(vt.splice(o,1),e.classList.remove("checked"),e.querySelector(".cf-check-box").textContent=""):(vt.push(s),e.classList.add("checked"),e.querySelector(".cf-check-box").textContent="✓"),Ja();return}if(t.target.closest("#cf-propose-btn")){await Xa(a);return}const i=t.target.closest(".cf-support-btn, .cf-withdraw-btn");if(i){const s=i.dataset.formationId,o=i.dataset.action;if(o==="configure"){xt=s;const n=dt.find(m=>m.id===s);n&&(q={...n.ministry_assignments||{}}),await pt(a)}else await Qa(s,o==="support",a);return}if(t.target.closest("#cf-form-gov-btn")){const s=dt.find(o=>o.id===xt);s&&await Ya(s,a);return}}),a.addEventListener("change",t=>{const e=t.target.closest(".cf-ministry-select");if(!e)return;const i=e.dataset.ministry,s=e.value||null;q[i]=s,xt&&T.from("government_formations").update({ministry_assignments:q}).eq("id",xt).then(({error:n})=>{n&&console.warn("[Coalition] Failed to save assignment:",n.message)});const o=document.getElementById("cf-form-gov-btn");if(o){const n=!!q.prime_minister;o.disabled=!n,o.style.color=n?"#000":"var(--text-dim)",o.style.background=n?"var(--green)":"var(--bg-body)",o.style.borderColor=n?"var(--green)":"var(--border-main)",o.style.cursor=n?"pointer":"not-allowed"}}))}function Ja(){const a=document.getElementById("cf-preview-seats"),t=document.getElementById("cf-preview-pct"),e=document.getElementById("cf-preview-threshold");if(!a)return;const i=vt.reduce((n,m)=>n+(G.find(f=>f.id===m)?.seats||0),0),s=X?Math.round(i/X*100):0,o=i>=Z;a.textContent=i,a.style.color=o?"var(--green)":"var(--text-bright)",t.textContent=s,e.textContent=o?`✓ Meets ${Z}-seat threshold`:`— needs ${Z} seats`,e.style.color=o?"var(--green)":"var(--text-dim)"}async function Xa(a){if(qt)return;const t=z.faction;if((G.find(n=>n.id===t.id)?.seats||0)===0)return;const i=[...new Set(vt)],s=i.reduce((n,m)=>n+(G.find(f=>f.id===m)?.seats||0),0);if(s<Z){alert(`Coalition needs ${Z} seats. Currently: ${s}.`);return}qt=!0;const o=document.getElementById("cf-propose-btn");o&&(o.disabled=!0,o.textContent="Submitting...");try{const{data:n}=await T.from("shard").select("current_date").eq("name","Alpha Shard").single(),{data:m,error:f}=await T.from("government_formations").insert({nation_id:z.nation.id,election_id:yt,proposed_by:t.id,party_ids:i,status:"active",game_year:n?.current_date||""}).select().single();if(f){alert("Error: "+f.message);return}const{error:r}=await T.from("government_formation_support").upsert({formation_id:m.id,faction_id:t.id,supports:!0},{onConflict:"formation_id,faction_id"});r&&console.warn("[Coalition] Auto-support insert failed:",r.message),await pt(a)}catch(n){console.error("[Coalition] Create proposal error:",n),alert("Failed to create proposal: "+(n.message||n))}finally{qt=!1}}async function Qa(a,t,e){try{const{error:i}=await T.from("government_formation_support").upsert({formation_id:a,faction_id:z.faction?.id,supports:t},{onConflict:"formation_id,faction_id"});i&&console.error("[Coalition] Toggle support error:",i.message),await pt(e)}catch(i){console.error("[Coalition] Toggle support error:",i)}}let ht=null,st=[],Kt=[],Wt=null;function V(a){if(!a)return"";const t=document.createElement("div");return t.textContent=a,t.innerHTML}function ue(a){return a>=1e6?(a/1e6).toFixed(2)+"M":a>=1e3?Math.round(a/1e3)+"k":String(a)}function Za(a){return["January","February","March","April","May","June","July","August","September","October","November","December"][a%12]+", "+(2e3+Math.floor(a/12))}function ti(a,t){if((a.election_type||"parliamentary")==="presidential")return{label:"Presidential Election",color:"#5a8aaa"};const i=t?.end_reason||"";return i.includes("no_confidence")||i.includes("vnc")?{label:"Vote of No Confidence",color:"#d44a4a"}:i.includes("snap")||i.includes("dissolved")||i.includes("early")?{label:"Early Elections Called",color:"#c84"}:{label:"General Election",color:"#8b9a6b"}}async function ei(a,t){ht=t;const e=document.getElementById("pa-past-elections-root");if(!e)return;e.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">Loading election history...</div>';const i=t.nation?.id;if(!i){e.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No nation data.</div>';return}const[s,o,n]=await Promise.all([a.from("elections").select("id, election_tick, election_type, status, results, created_at").eq("nation_id",i).eq("status","completed").order("election_tick",{ascending:!1}),a.from("administrations").select("*").eq("nation_id",i).order("started_at_tick",{ascending:!1}),a.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",i).eq("faction_type","party").is("abandoned_at",null)]);st=s.data||[],Kt=o.data||[];const m=n.data||[],f={};for(const r of m)f[r.id]=r;for(const r of st){const l=r.results?.votes||[];for(const p of l){const c=f[p.party_id];c?(p.color=c.party_color||"#666",p.abbreviation=c.abbreviation||p.party_name?.slice(0,3)?.toUpperCase()||"?"):(p.color="#666",p.abbreviation=p.party_name?.slice(0,3)?.toUpperCase()||"?")}}ai(e),Ae(e)}function ai(a){a.addEventListener("click",t=>{const e=t.target.closest("[data-election-id]");if(e){const i=e.dataset.electionId;Wt=Wt===i?null:i,Ae(a)}})}function Ae(a,t){if(st.length===0){a.innerHTML=`<div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);margin-bottom:8px;">PAST ELECTIONS</div>
            <div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No completed elections on record.</div>
        </div>`;return}const e=ht.faction?.id,i=ht.nation?.total_seats||100,s=Math.ceil(i/2)+1,o=st.map((n,m)=>{const f=Wt===n.id,r=(n.results?.votes||[]).sort((E,S)=>(S.seats||0)-(E.seats||0)),l=r.slice(0,3),p=n.results?.turnout_pct??0,c=n.results?.total_votes_cast??0,v=Za(n.election_tick),d=Kt.find(E=>E.started_at_tick>=n.election_tick&&E.started_at_tick<=n.election_tick+5),u=Kt.find(E=>E.ended_at_tick!=null&&E.ended_at_tick>=n.election_tick-2&&E.ended_at_tick<=n.election_tick+2),g=ti(n,u),x=(ht.nation?.government_type||"").toLowerCase().includes("presidential")||ht.nation?.hos_election_method==="direct_vote",_=x?"President":"PM",b=d?.prime_minister||"Unknown",C=d?.pm_party_id&&r.find(E=>E.party_id===d.pm_party_id)?.color||"#888",k=(m<st.length-1?st[m+1]:null)?.results?.votes||[];let M=`<div data-election-id="${n.id}" style="
            background:var(--bg-panel);border:1px solid var(--border-main);
            ${f?"border-bottom:none;":""}
        ">
            <div class="pe-row-head" style="padding:12px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <div class="pe-row-head-left" style="display:flex;align-items:center;gap:12px;min-width:0;flex-wrap:wrap;">
                    <div class="pe-date" style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-secondary);width:130px;">${v}</div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 10px;color:${g.color};background:${g.color}0a;border:1px solid ${g.color}25;">${g.label.toUpperCase()}</span>
                    <div class="pe-top-chips" style="display:flex;gap:8px;margin-left:10px;flex-wrap:wrap;">
                        ${l.map(E=>`<div style="display:flex;align-items:center;gap:4px;">
                            <div style="width:8px;height:8px;background:${E.color};"></div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${V(E.abbreviation)}</span>
                            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--text-bright);">${E.seats}</span>
                        </div>`).join("")}
                    </div>
                </div>
                <div class="pe-row-head-right" style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                    <div class="pe-leader-meta" style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
                        ${_}: <span style="color:${C};font-weight:700;">${V(b)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">${f?"▲":"▼"}</span>
                </div>
            </div>
        </div>`;if(f){const E=r.map(I=>`<div style="width:${I.seats/i*100}%;background:${I.color};height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${I.seats>=8?9:6}px;font-weight:700;color:#000;">${I.seats>=5?I.seats:""}</div>`).join(""),S=r.map(I=>{const R=I.party_id===e,L=k.find(j=>j.party_id===I.party_id),P=L?I.seats-(L.seats||0):null,A=I.seats/i*100-(I.vote_percentage||0);return`<div class="pe-tbl-row" style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);${R?`background:${I.color}08;`:""}">
                    <div class="pe-col-logo" style="width:30px;height:30px;background:${I.color}15;border:1px solid ${I.color}33;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-right:8px;">${I.abbreviation?.slice(0,2)||"?"}</div>
                    <div class="pe-col-party" style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:5px;">
                            <span style="font-size:13px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${V(I.party_name)}</span>
                            ${R?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#5c5;padding:0 3px;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15);">YOU</span>':""}
                        </div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:${I.color};">${V(I.abbreviation)}</div>
                    </div>
                    <span class="pe-col-seats" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${I.seats}</span>
                    <span class="pe-col-change" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${P!=null?P>0?"#5c5":P<0?"#c55":"var(--text-dim)":"var(--text-dim)"};">${P!=null?P>0?"▲ "+P:P<0?"▼ "+Math.abs(P):"—":"NEW"}</span>
                    <span class="pe-col-votes" style="width:70px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-bright);">${ue(I.votes||0)}</span>
                    <span class="pe-col-pct" style="width:55px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">${(I.vote_percentage||0).toFixed(1)}%</span>
                    <span class="pe-col-rep" style="width:80px;text-align:right;font-family:var(--font-mono);font-size:10px;font-weight:700;color:${Math.abs(A)<2?"var(--text-dim)":A>0?"#5c5":"#c84"};">${A>0?"+":""}${A.toFixed(1)}% <span style="font-size:8px;color:var(--text-dim);">${Math.abs(A)<2?"proportional":A>0?"overrep.":"underrep."}</span></span>
                </div>`}).join("");let N="";if(d){const I=d.coalition_parties||[],R=d.total_seats||I.reduce((H,kt)=>H+(kt.seats||0),0),L=R>=s,P=L?"Majority Coalition":"Minority Coalition",F=d.ended_at_tick?d.end_reason||"Ended":"Current Government",A=d.ended_at_tick?"var(--text-dim)":"#5c5",j=d.ended_at_tick?Math.abs(d.ended_at_tick-d.started_at_tick)+" ticks":"Ongoing",it=I.map(H=>{const kt=r.find(zt=>zt.party_id===H.party_id)?.color||"#666";return`<div style="width:${R>0?(H.seats||0)/R*100:0}%;background:${kt};height:100%;"></div>`}).join(""),ot=I.map(H=>`<div style="display:flex;align-items:center;gap:4px;">
                        <div style="width:8px;height:8px;background:${r.find(zt=>zt.party_id===H.party_id)?.color||"#666"};"></div>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${V(H.party_name?.slice(0,3)?.toUpperCase()||"?")}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${H.seats||0}</span>
                    </div>`).join("");N=`<div style="margin:0 20px 16px;background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${C};">
                    <div style="padding:12px 16px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text-dim);">GOVERNMENT FORMED</span>
                                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 8px;color:${A};background:${A}0a;border:1px solid ${A}25;">${V(F.toUpperCase())}</span>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Lasted: ${j}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                            <div style="width:36px;height:36px;background:${C}15;border:1.5px solid ${C};display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;font-weight:700;color:${C};">${V(b.split(" ").map(H=>H[0]).join(""))}</div>
                            <div>
                                <div style="font-size:14px;font-weight:700;color:var(--text-bright);">${V(b)}</div>
                                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${x?"President":"Prime Minister"} &middot; ${V(d.pm_party_name||"")} &middot; ${P}</div>
                            </div>
                        </div>
                        <div style="display:flex;height:8px;gap:1px;margin-bottom:8px;">${it}</div>
                        <div style="display:flex;gap:10px;align-items:center;">
                            ${ot}
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">&middot;</span>
                            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${L?"#5c5":"#c84"};">${R} seats ${L?"(majority +"+(R-s)+")":"(minority, "+(s-R)+" short)"}</span>
                        </div>
                    </div>
                </div>`}M+=`<div style="background:var(--bg-panel);border:1px solid var(--border-main);border-top:1px solid var(--border-main);">
                <!-- Context + Turnout -->
                <div style="display:flex;border-bottom:1px solid var(--border-main);">
                    <div style="flex:1;padding:12px 20px;border-right:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px;">CONTEXT</div>
                        <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${V(g.label)}</div>
                    </div>
                    <div style="width:260px;padding:12px 20px;display:flex;gap:16px;flex-shrink:0;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TURNOUT</div>
                            <div style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:${p>70?"#5c5":p>60?"#ca5":"#c84"};">${p.toFixed(1)}%</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TOTAL VOTES</div>
                            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">${ue(c)}</div>
                        </div>
                    </div>
                </div>

                <!-- Seat bar -->
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;height:18px;gap:1px;margin-bottom:6px;">${E}</div>
                    <div style="position:relative;height:0;">
                        <div style="position:absolute;bottom:0;left:${s/i*100}%;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);transform:translateX(-50%);">▲ ${s} majority</div>
                    </div>
                </div>

                <!-- Results table header -->
                <div style="padding:0 20px;">
                    <div class="pe-tbl-head" style="display:flex;padding:8px 0;border-bottom:1px solid var(--border-main);font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">
                        <span class="pe-col-logo" style="width:30px;"></span>
                        <span class="pe-col-party" style="flex:1;">PARTY</span>
                        <span class="pe-col-seats" style="width:60px;text-align:right;">SEATS</span>
                        <span class="pe-col-change" style="width:60px;text-align:right;">CHANGE</span>
                        <span class="pe-col-votes" style="width:70px;text-align:right;">VOTES</span>
                        <span class="pe-col-pct" style="width:55px;text-align:right;">VOTE %</span>
                        <span class="pe-col-rep" style="width:80px;text-align:right;">SEAT vs VOTE</span>
                    </div>
                    ${S}
                </div>

                ${N}
            </div>`}return M}).join("");a.innerHTML=`<div style="padding:12px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);">PAST ELECTIONS</span>
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">${st.length} elections on record</span>
            </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">${o}</div>
    </div>`}let J=null,Jt=!1,ge=!1,Xt=!1,ye=!1,Qt=!1;function Pe(a){document.querySelectorAll(".pa-subtab").forEach(t=>t.classList.toggle("active",t.dataset.panel===a)),document.querySelectorAll(".pa-panel").forEach(t=>t.classList.toggle("active",t.id==="panel-"+a)),sessionStorage.setItem("party_subtab",a),a==="actions"&&!Jt&&J&&(Jt=!0,Ce(mt,J)),a==="parties"&&!ge&&J&&(ge=!0,Sa(mt,J,"pa-parties-root")),a==="election"&&!Xt&&J&&(Xt=!0,Qt?pt(document.getElementById("pa-election-root")):Le(mt,J).then(()=>{Qt=!0,pt(document.getElementById("pa-election-root"))})),a==="past-elections"&&!ye&&J&&(ye=!0,ei(mt,J))}document.getElementById("pa-subtabs").addEventListener("click",a=>{const t=a.target.closest(".pa-subtab");!t||t.classList.contains("active")||Pe(t.dataset.panel)});Te("politics",async a=>{J=a,Le(mt,a).then(({needed:e})=>{if(Qt=!0,e){const i=document.querySelector('.pa-subtab[data-panel="election"]');i&&!i.querySelector(".pa-subtab-badge")&&(i.innerHTML+='<span class="pa-subtab-badge"></span>');const s=document.querySelector('.nav-tab[data-tab="politics"]');s&&!s.querySelector(".pa-subtab-badge")&&(s.innerHTML+='<span class="pa-subtab-badge"></span>')}Xt&&pt(document.getElementById("pa-election-root"))});const t=sessionStorage.getItem("party_subtab");t&&t!=="actions"?Pe(t):(Jt=!0,await Ce(mt,a))});
