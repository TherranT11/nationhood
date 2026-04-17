import{_supabase as pt}from"./supabase-client-CiYoFhIh.js";/* empty css                  */import{i as Ce}from"./common-DzbV_OEs.js";import{j as Vt,E as pe,B as me}from"./elections-Cn1LYWzr.js";import{l as _t}from"./government-types-D9n0pQb0.js";import{a as Ie}from"./ideology-Ngkkb21f.js";import{d as Me,c as Se,s as Le,a as Ct}from"./stats-tIiBSaQA.js";import"./preload-helper-BXl3LOEh.js";import"./config-fKhFNVuq.js";const $t=[{id:"economic_reform",name:"Economic Reform",icon:"📈",tagline:"Growth-first neoliberal agenda",desc:"Prioritize GDP, attract foreign capital, lower corporate taxes. The rising tide theory — grow the pie and worry about slicing it later.",improve:["gdp_growth","foreign_investment","currency_strength","credit","service_output","manufacturing_output"],worsen:["income_inequality","poverty_rate","union_strength","income_tax"],tradeoff:"Income inequality tends to rise. Working class sees GDP numbers go up while their wages don't."},{id:"social_justice",name:"Social Justice",icon:"⚖️",tagline:"Redistribution and equity",desc:"Raise minimum wage, expand welfare, progressive taxation. Close the gap between rich and poor through direct intervention.",improve:["minimum_wage","poverty_rate","income_inequality","social_mobility","healthcare_accessibility","education_accessibility"],worsen:["foreign_investment","gdp_growth","corporate_tax"],tradeoff:"Capital flight risk. Foreign investors avoid high-tax environments. Growth may slow."},{id:"national_security",name:"National Security",icon:"🛡️",tagline:"Borders, military, order",desc:"Strengthen defense, tighten borders, expand police powers. Safety through strength.",improve:["stability","crime_rate","terrorism","political_violence","illegal_immigration"],worsen:["freedom_index","press_freedom","civil_unrest","polarization"],tradeoff:"Freedom index drops. Minority communities disproportionately affected. International criticism."},{id:"anti_corruption",name:"Anti-Corruption",icon:"🔍",tagline:"Clean government, institutional reform",desc:"Independent judiciary, transparent budgets, prosecute the connected. Popular with voters but powerful people fight back hard.",improve:["corruption","judicial_independence","press_freedom","legitimacy","efficiency"],worsen:["stability"],tradeoff:"Short-term chaos as exposing corruption shakes institutions. Your own party's skeletons may surface."},{id:"green_transition",name:"Green Transition",icon:"🌱",tagline:"Climate and environment",desc:"Renewable energy investment, carbon taxes, emissions targets. Save the planet — but the bill comes due now, not later.",improve:["renewable_energy_pct","pollution","carbon_emissions","energy_generation"],worsen:["fuel_prices","manufacturing_output","gdp_growth","cost_of_living"],tradeoff:"Energy costs spike during transition. Rural and industrial voters feel abandoned."},{id:"industrialization",name:"Industrialization",icon:"🏭",tagline:"Factories, exports, production",desc:"Build manufacturing capacity, create blue-collar jobs, develop physical infrastructure. The backbone of a real economy.",improve:["manufacturing_output","labor_force_participation","unemployment","physical_infrastructure","gdp_growth"],worsen:["pollution","carbon_emissions","arable_land","healthcare_quality"],tradeoff:"Environment gets destroyed. Long-term health costs from industrial pollution."},{id:"digital_modernization",name:"Digital Modernization",icon:"💻",tagline:"Tech economy, connectivity",desc:"Fiber everywhere, tech sector incentives, digital government services. Leap into the future — but not everyone makes the jump.",improve:["digital_infrastructure","service_output","higher_education","academic_immigration","efficiency"],worsen:["manufacturing_output","labor_force_participation","income_inequality","urbanization"],tradeoff:"Automation displaces workers. Rural communities left behind. Tech wealth concentrates in cities."},{id:"welfare_state",name:"Welfare State",icon:"🏥",tagline:"Universal services, safety net",desc:"Free healthcare, free education, generous pensions, unemployment insurance. Cradle to grave — funded by steep taxes on everyone.",improve:["healthcare_quality","healthcare_accessibility","education_accessibility","poverty_rate","standard_of_living","happiness"],worsen:["income_tax","corporate_tax","gdp_growth","foreign_investment"],tradeoff:"Massive fiscal cost. Tax burden on middle class, not just the rich. Sustainability questioned."},{id:"populist_nationalism",name:"Populist Nationalism",icon:"🇲",tagline:"The people vs. elites and outsiders",desc:"Restrict immigration, protect domestic industry, reject globalism. Our people first. Our jobs first. Our culture first.",improve:["immigration","illegal_immigration","manufacturing_output","minimum_wage","union_strength"],worsen:["foreign_investment","academic_immigration","freedom_index","press_freedom","polarization","ethnic_diversity"],tradeoff:"International isolation. Brain drain as educated professionals emigrate. Deep social polarization."},{id:"free_market",name:"Free Market Liberalism",icon:"🏛️",tagline:"Deregulate everything",desc:"Cut taxes, cut red tape, let the market decide winners and losers. Government is the problem, not the solution.",improve:["gdp_growth","foreign_investment","credit","service_output","currency_strength"],worsen:["union_strength","minimum_wage","healthcare_accessibility","income_inequality","poverty_rate"],tradeoff:"Growth at the cost of the working class. Social safety net erodes. Boom-bust volatility."},{id:"law_and_order",name:"Law & Order",icon:"⚔️",tagline:"Tough on crime, strong institutions",desc:"More police, harsher sentences, zero tolerance. Restore order to the streets. Criminals fear the state.",improve:["crime_rate","stability","political_violence","terrorism","drug_use"],worsen:["incarceration_rate","freedom_index","civil_unrest"],tradeoff:"Prison population explodes. Minority communities targeted. Policing costs balloon."},{id:"education_first",name:"Education First",icon:"🎓",tagline:"Human capital as the long game",desc:"Fund schools, universities, research institutions, teacher salaries. The 20-year bet that the next generation will be smarter and richer.",improve:["literacy","higher_education","education_accessibility","academic_immigration","social_mobility","labor_force_participation"],worsen:["income_tax","gdp_growth"],tradeoff:"Voters don't see results before next election. Brain drain if jobs don't exist for graduates."},{id:"healthcare_reform",name:"Healthcare Reform",icon:"💊",tagline:"Fix the hospitals",desc:"More beds, more doctors, better drugs, universal coverage. Nobody dies because they can't afford treatment.",improve:["healthcare_quality","healthcare_accessibility","beds_per_100k","lifespan","drug_use"],worsen:["income_tax","gdp_growth","cost_of_living"],tradeoff:"Pharmaceutical lobby fights back. Extremely expensive. Takes multiple cycles to show results."},{id:"housing_cost",name:"Housing & Cost of Living",icon:"🏠",tagline:"The kitchen-table platform",desc:"Rent controls, public housing, affordable food, price caps on essentials. People can't eat GDP growth.",improve:["housing_affordability","cost_of_living","standard_of_living","physical_infrastructure","urbanization"],worsen:["foreign_investment","gdp_growth"],tradeoff:"Property owners and developers become your enemies. Market distortions create shortages."},{id:"energy_independence",name:"Energy Independence",icon:"⛽",tagline:"Control your own power supply",desc:"Exploit domestic oil, gas, and minerals. No more dependency on foreign energy. Cheap fuel, strong economy, sovereign power.",improve:["energy_generation","oil_and_gas","rare_minerals","fuel_prices","manufacturing_output","gdp_growth"],worsen:["pollution","carbon_emissions","renewable_energy_pct","arable_land"],tradeoff:"Climate commitments broken. Green voters abandon you. Environmental debt for future generations."},{id:"open_society",name:"Open Society",icon:"🕊️",tagline:"Liberal democracy, civil liberties",desc:"Free press, open borders, multicultural embrace, strong civil rights. A beacon of freedom — and a target for those who fear it.",improve:["freedom_index","press_freedom","immigration","academic_immigration","ethnic_diversity","happiness","judicial_independence"],worsen:["stability","illegal_immigration","polarization","terrorism"],tradeoff:"Nationalist backlash. Rural-urban divide deepens. Security vulnerabilities from openness."}],Jt={gdp_growth:"GDP Growth",inflation:"Inflation",interest_rates:"Interest Rates",currency_strength:"Currency Strength",foreign_investment:"Foreign Investment",credit:"Credit",income_tax:"Income Tax",corporate_tax:"Corporate Tax",sales_tax:"Sales Tax",unemployment:"Unemployment",labor_force_participation:"Labor Force Participation",minimum_wage:"Minimum Wage",union_strength:"Union Strength",poverty_rate:"Poverty Rate",income_inequality:"Income Inequality",healthcare_quality:"Healthcare Quality",healthcare_accessibility:"Healthcare Accessibility",beds_per_100k:"Beds per 100k",lifespan:"Lifespan",drug_use:"Drug Use",literacy:"Literacy",higher_education:"Higher Education",education_accessibility:"Education Accessibility",academic_immigration:"Academic Immigration",physical_infrastructure:"Physical Infrastructure",digital_infrastructure:"Digital Infrastructure",urbanization:"Urbanization",energy_generation:"Energy Generation",renewable_energy_pct:"Renewable Energy %",arable_land:"Arable Land",rare_minerals:"Rare Minerals",oil_and_gas:"Oil & Gas",fuel_prices:"Fuel Prices",pollution:"Pollution",carbon_emissions:"Carbon Emissions",standard_of_living:"Standard of Living",happiness:"Happiness",social_mobility:"Social Mobility",crime_rate:"Crime Rate",incarceration_rate:"Incarceration Rate",religiosity:"Religiosity",stability:"Stability",legitimacy:"Legitimacy",efficiency:"Efficiency",corruption:"Corruption",press_freedom:"Press Freedom",judicial_independence:"Judicial Independence",freedom_index:"Freedom Index",polarization:"Polarization",civil_unrest:"Civil Unrest",terrorism:"Terrorism",political_violence:"Political Violence",immigration:"Immigration",illegal_immigration:"Illegal Immigration",emigration:"Emigration",ethnic_diversity:"Ethnic Diversity",cost_of_living:"Cost of Living",housing_affordability:"Housing Affordability",manufacturing_output:"Manufacturing Output",service_output:"Service Output"},Yt=new Set(["inflation","unemployment","poverty_rate","income_inequality","drug_use","pollution","carbon_emissions","crime_rate","incarceration_rate","corruption","polarization","civil_unrest","terrorism","political_violence","illegal_immigration","emigration","cost_of_living","fuel_prices"]),Ae=new Set(["income_tax","corporate_tax","sales_tax"]);function Xt(e,t){const a=Yt.has(e),i=Ae.has(e);return t==="improve"?a?{arrow:"↓",color:"#5cc55c"}:i?{arrow:"↑",color:"#c84"}:{arrow:"↑",color:"#5cc55c"}:a?{arrow:"↑",color:"#c55"}:i?{arrow:"↓",color:"#5cc55c"}:{arrow:"↓",color:"#c55"}}function Qt(e){switch(e){case 0:return{momentum:12,penalty:0,label:"+12",color:"#5cc55c",note:"Unclaimed — full momentum"};case 1:return{momentum:6,penalty:6,label:"+6",color:"#ca5",note:"Contested by 1 rival — reduced momentum"};case 2:return{momentum:4,penalty:4,label:"+4",color:"#c84",note:"Crowded (2 rivals) — minimal momentum"};default:return{momentum:2,penalty:2,label:"+2",color:"#c84",note:`Crowded (${e} rivals) — minimal momentum`}}}function ze(e,t){return e.map(a=>{const i=$t.find(o=>o.id===a.platform_key);if(!i)return{...a,stats:[]};const s=i.improve.map(o=>{const n=a.baseline_stats?.[o],m=a.target_stats?.[o],f=Number(t?.[o]??50),r=Yt.has(o);if(n==null||m==null)return{stat:o,baseline:f,target:f,current:f,progress:0,met:!1};const d=Math.abs(m-n),p=r?Math.max(0,n-f):Math.max(0,f-n),c=d>0?Math.min(1,p/d):1,v=r?f<=m:f>=m;return{stat:o,baseline:n,target:m,current:f,progress:c,met:v}});return{...a,stats:s,platformDef:i}})}const Te=["Former union organizer. Knows how to mobilize a crowd.","Disbarred attorney. Understands the legal system from the inside.","Investigative journalist. Uncovered three government scandals before going private.","Ex-military intelligence. Trained in information warfare.","Community activist. Built grassroots networks across two provinces.","Former government auditor. Knows where the money hides.","Political science professor. Publishes on institutional corruption.","NGO director. Ran anti-corruption campaigns across the continent.","Former prosecutor. Left the justice ministry over political interference.","Labor rights campaigner. Organized the dockworkers' strike of 2014.","Freelance political consultant. Has worked for opposition parties in three nations.","Student movement leader. Led the university protests. Young and fearless.","Retired diplomat. Leverages international connections for domestic pressure.","Whistleblower advocate. Runs a secure tip line used by civil servants.","Former police detective. Turned against the system after a cover-up."];function lt(e){return e>=75?{label:"Exceptional",color:"#5cc55c",desc:"Elite operative. Lawsuits are devastating, intelligence is razor-sharp."}:e>=60?{label:"Strong",color:"#a3b07e",desc:"Experienced and reliable. Can handle most opposition tasks effectively."}:e>=45?{label:"Competent",color:"#ca5",desc:"Gets the job done. Occasional missteps under pressure."}:e>=30?{label:"Developing",color:"#c84",desc:"Green but eager. Results are inconsistent. Cheap to hire."}:{label:"Weak",color:"#c55",desc:"Liability risk. May botch sensitive operations. Rock-bottom price for a reason."}}function Pe(e){var t=Math.max(0,e-20)/65,a=12e4+t*28e4;return Math.round(a/25e3)*25e3}function Tt(e,t){return e+Math.floor(Math.random()*(t-e+1))}function Zt(e){return e[Math.floor(Math.random()*e.length)]}function Ne(e,t){var a=[],i=new Set,s=Tt(5,7),o=Vt(t),n=o.firstNames||[],m=o.lastNames||[];if(n.length===0||m.length===0)return[];for(var f=Te.slice().sort(function(){return Math.random()-.5}),r=0;r<s;r++){var d,p,c,v=0;do d=Zt(n),p=Zt(m),c=d+" "+p,v++;while(i.has(c)&&v<20);i.add(c);var l=Tt(20,85),u=Tt(25,60),g=f[r%f.length],y=Pe(l);a.push({nation_id:e,first_name:d,last_name:p,age:u,skill:l,background:g,hire_cost:y,status:"available"})}return a.sort(function(_,x){return x.skill-_.skill}),a}async function fe(e,t,a){var{data:i,error:s}=await e.from("administrations").select("id, coalition_parties, stats_at_start, started_at_tick, pm_party_id").eq("nation_id",t).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle();if(s)return console.error("[Agitator] Failed to check opposition status:",s.message),{isOpposition:!1,administration:null};if(!i)return{isOpposition:!0,administration:null};var o=Array.isArray(i.coalition_parties)?i.coalition_parties:[],n=o.map(function(f){return f?typeof f=="string"?f:typeof f=="object"&&(f.party_id||f.id)||null:null}).filter(Boolean),m=n.includes(a)||i.pm_party_id===a;return{isOpposition:!m,administration:i}}async function ve(e,t){var{data:a,error:i}=await e.from("faction_agitators").select("*").eq("faction_id",t).eq("status","active").maybeSingle();return i?(console.error("[Agitator] Failed to fetch agitator:",i.message),null):a}async function Fe(e,t,a){var{data:i,error:s}=await e.from("agitator_pool").select("*").eq("nation_id",t).eq("status","available").order("skill",{ascending:!1});if(s)return console.error("[Agitator] Failed to fetch pool:",s.message),[];if(i&&i.length>0)return i;var o=Ne(t,a),{data:n,error:m}=await e.from("agitator_pool").insert(o).select("*");return m?(console.error("[Agitator] Failed to insert pool:",m.message),[]):(n||[]).sort(function(f,r){return r.skill-f.skill})}async function Re(e,t,a,i){var s=await ve(e,t);if(s)return{success:!1,agitator:null,error:"You already have an active agitator."};var{data:o,error:n}=await e.from("faction_agitators").insert({faction_id:t,first_name:a.first_name,last_name:a.last_name,age:a.age,skill:a.skill,background:a.background,status:"active",hired_at_tick:i}).select("*").single();if(n)return console.error("[Agitator] Failed to hire:",n.message),{success:!1,agitator:null,error:n.message};var{error:m}=await e.from("agitator_pool").update({status:"hired",hired_by_faction_id:t}).eq("id",a.id);return m&&console.error("[Agitator] Failed to mark pool candidate as hired:",m.message),{success:!0,agitator:o,error:null}}const It=[{key:"finance",label:"Finance",icon:"💰"},{key:"defense",label:"Defense",icon:"🛡️"},{key:"education",label:"Education",icon:"🎓"},{key:"healthcare",label:"Health",icon:"🏥"},{key:"interior",label:"Interior",icon:"🏛️"},{key:"foreign",label:"Foreign",icon:"🌐"},{key:"justice",label:"Justice",icon:"⚖️"},{key:"labor",label:"Labor",icon:"🔨"},{key:"trade",label:"Trade",icon:"📦"},{key:"energy",label:"Energy",icon:"⚡"},{key:"transportation",label:"Transport",icon:"🚂"},{key:"agriculture",label:"Agriculture",icon:"🌾"}],ue=[{key:"misuse_of_funds",label:"Misuse of Public Funds",desc:"Alleging budget went somewhere it shouldn't."},{key:"civil_rights",label:"Violation of Civil Rights",desc:"Alleging government overreach or suppression."},{key:"negligence",label:"Breach of Duty / Negligence",desc:"Alleging a ministry failed its mandate."},{key:"corruption",label:"Corruption / Self-Dealing",desc:"Alleging officials enriched themselves."}];function Kt(e){return e<=5?{tier:1,label:"Clean Government",color:"#c55"}:e<=10?{tier:2,label:"Minor Corruption",color:"#ca5"}:e<=20?{tier:3,label:"Significant Corruption",color:"#c84"}:{tier:4,label:"Systemic Corruption",color:"#5cc55c"}}const tt={1:{resolution:"FRIVOLOUS SUIT",filer:{momentum:-5,governance:-2},gov:{momentum:3,governance:1}},2:{resolution:"PARTIAL WIN",filer:{momentum:3,governance:0},gov:{momentum:-2,governance:-2}},3:{resolution:"MAJOR WIN",filer:{momentum:7,governance:2},gov:{momentum:-5,governance:-5}},4:{resolution:"DEVASTATING WIN",filer:{momentum:12,governance:5},gov:{momentum:-10,governance:-8}}},te={1:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"Lawsuit discovery phase produces routine documents. No irregularities found in {ministry}.",evidence:"Legal team reviews {ministry} records. Auditors confirm standard procedures.",pre_trial:"Judge signals skepticism toward {party}'s claims. Case appears thin.",resolution:"{ministry} lawsuit dismissed. Courts find no evidence of wrongdoing. {party} criticized for wasting court resources."},2:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit uncovers irregular procurement contracts in {ministry}.",evidence:"Documents reveal {ministry} awarded no-bid contracts to connected firms.",pre_trial:"Judge allows case to proceed. {ministry} officials ordered to testify.",resolution:"{ministry} lawsuit concludes with partial ruling. Irregular contracts confirmed but no criminal charges filed."},3:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit exposes hidden accounts linked to {ministry} officials.",evidence:"Leaked documents show systematic overbilling in {ministry}. Millions unaccounted for.",pre_trial:"Multiple {ministry} officials refuse to testify. Judge threatens contempt.",resolution:"{ministry} scandal confirmed. Court finds evidence of systematic corruption. {party} vindicated."},4:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit reveals {ministry} ran parallel budget invisible to parliament.",evidence:"Court-ordered audit exposes network of shell companies receiving {ministry} funds.",pre_trial:"Prosecutors request criminal referral. Multiple {ministry} officials implicated.",resolution:"Devastating verdict: {ministry} operated criminal enterprise. Officials face prosecution. Government in crisis."}};function yt(e,t){var a=e;for(var i in t)a=a.split("{"+i+"}").join(t[i]);return a}async function Oe(e,t){var{factionId:a,nationId:i,agitatorId:s,targetMinistry:o,basis:n,currentTick:m,partyName:f,administration:r}=t,d,p,c;if(n==="civil_rights"){var v=Number(r?.stats_at_start?.freedom_index??50),{data:l,error:u}=await e.from("nations").select("freedom_index").eq("id",i).single();if(u)return{success:!1,lawsuit:null,tier:0,error:"Failed to fetch freedom index data."};p=Number(l?.freedom_index??50),d=v,c=Math.max(0,d-p)}else{var g=Number(r?.stats_at_start?.corruption??50),{data:l,error:u}=await e.from("nations").select("corruption").eq("id",i).single();if(u)return{success:!1,lawsuit:null,tier:0,error:"Failed to fetch corruption data."};p=Number(l?.corruption??50),d=g,c=Math.max(0,p-d)}var g=d,y=p,_=Kt(c),x=tt[_.tier],E=m+8,$=It.find(function(A){return A.key===o}),w=$?"Ministry of "+$.label:o,C=ue.find(function(A){return A.key===n}),I=C?C.label:n,{data:L,error:R}=await e.from("lawsuits").insert({faction_id:a,nation_id:i,agitator_id:s,target_ministry:o,basis:n,filed_at_tick:m,resolves_at_tick:E,corruption_at_start:g,corruption_at_filing:y,corruption_growth:c,tier:_.tier,status:"active",resolution:null,momentum_effect:x.filer.momentum,governance_effect:x.filer.governance,gov_momentum_effect:x.gov.momentum,gov_governance_effect:x.gov.governance}).select("*").single();if(R)return{success:!1,lawsuit:null,tier:0,error:R.message};var M=te[_.tier]||te[1],F={party:f||"Opposition",ministry:w,basis:I},S=[{event_tick:m,event_type:"filing",headline:yt(M.filing,F)},{event_tick:m+2,event_type:"discovery",headline:yt(M.discovery,F)},{event_tick:m+5,event_type:"evidence",headline:yt(M.evidence,F)},{event_tick:m+7,event_type:"pre_trial",headline:yt(M.pre_trial,F)},{event_tick:E,event_type:"resolution",headline:yt(M.resolution,F)}],z=S.map(function(A){return{lawsuit_id:L.id,nation_id:i,event_tick:A.event_tick,event_type:A.event_type,headline:A.headline,is_fired:A.event_tick===m}}),{error:N}=await e.from("lawsuit_events").insert(z);return N&&console.error("[Lawsuits] Failed to insert milestone events:",N.message),{success:!0,lawsuit:L,tier:_.tier,error:null}}async function De(e,t){var{data:a,error:i}=await e.from("lawsuits").select("*").eq("faction_id",t).order("filed_at_tick",{ascending:!1}).limit(10);return i?(console.error("[Lawsuits] Failed to fetch lawsuits:",i.message),[]):a||[]}let k=null,b=null,Y="leader",X=[],Mt=[],D=null,O=null,vt=!1,dt=null,Dt=[],mt=!1;function h(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function K(e,t){return((e||"?")[0]+(t||"?")[0]).toUpperCase()}const ge=[{id:"leader",title:"LEADER",fullTitle:"Party Leader",color:"#c8a832"},{id:"deputy",title:"DEPUTY",fullTitle:"Deputy Party Leader",color:"#8b9a6b"},{id:"chief",title:"CHIEF OF STAFF",fullTitle:"Chief of Staff",color:"#5cc55c"},{id:"campaign",title:"CAMPAIGN MGR",fullTitle:"Campaign Manager",color:"#c84"},{id:"comms",title:"COMMS DIR",fullTitle:"Communications Director",color:"#5a8aaa"},{id:"agitator",title:"AGITATOR",fullTitle:"Opposition Coordinator",color:"#d44a4a",oppositionOnly:!0}],Pt=[{perSeat:5e3,momDivisor:10},{perSeat:4e3,momDivisor:8},{perSeat:3e3,momDivisor:6},{perSeat:2e3,momDivisor:5},{perSeat:1e3,momDivisor:5}];let st=0;async function Be(){if(!k||!b?.faction?.id||!b?.shard?.current_tick)return;const{count:e,error:t}=await k.from("campaign_actions").select("id",{count:"exact",head:!0}).eq("party_id",b.faction.id).eq("action_type","fundraise").eq("tick_performed",b.shard.current_tick);st=!t&&e!=null?e:0}function ye(e,t){const a=Pt[Math.min(t,Pt.length-1)],i=e*a.perSeat,s=Math.max(1,Math.floor(e/a.momDivisor));return{raised:i,momCost:s,perSeat:a.perSeat,tierIdx:Math.min(t,Pt.length-1)}}const xe=[{id:"fundraise",name:"Fundraise",desc:"Raise party funds proportional to your seat count. Each use yields less money and costs more momentum. Momentum cannot drop below 1.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"statement",name:"Issue Statement",desc:"Public declaration on an issue. Shifts party positioning and voter bloc reactions. Media covers it. Other parties may respond.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"platform",name:"Set Party Platform",desc:"Choose a political focus. Defines which stats you promise to change. Awards momentum based on how many rivals share the same platform.",cost:"$120k",costColor:"#c8a832",moneyCost:12e4,tags:["STRATEGIC"],locked:!1}],je=[{id:"fundraise",name:"Fundraise",desc:"Raise royal treasury funds proportional to your seat count. Each use yields less money and costs more momentum.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"grant_seats",name:"Grant Seats",desc:"Grant parliamentary seats to a noble house. Sharing power increases legitimacy (+0.5 per seat). Hoarding >70% of seats causes tyranny decay.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1},{id:"revoke_seats",name:"Revoke Seats",desc:"Revoke seats from a noble house. Costs $100k and -1 Legitimacy per seat revoked. Use sparingly — the people do not forget.",cost:"$100k/seat",costColor:"#d44a4a",moneyCost:1e5,tags:["ROYAL","OFFENSIVE"],locked:!1},{id:"statement",name:"Royal Decree",desc:"Issue a public declaration on an issue. Shifts positioning and voter bloc reactions. Media covers it.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"appoint_pm",name:"Appoint Prime Minister",desc:"Choose a party to lead the government as Prime Minister. The PM can then assign cabinet ministries. You may appoint your own party.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1}],At={PUBLIC:"#8b9a6b",NARRATIVE:"#5a8aaa",STRATEGIC:"#c8a832",INTERNAL:"#c84",COALITION:"#5aaa8a",RISKY:"#c55",PARLIAMENTARY:"#8b9a6b",FINANCIAL:"#5a8aaa",INTELLIGENCE:"#5a8aaa",DEFENSIVE:"#5cc55c",CAMPAIGN:"#c84",VOTER:"#c8a832",OFFENSIVE:"#c84",REACTIVE:"#ca5",STRUCTURAL:"#9e9a92",ROYAL:"#c8a832",LEGAL:"#5a8aaa"},ee=[{id:"economy",label:"Economy & Jobs",icon:"💰"},{id:"healthcare",label:"Healthcare",icon:"🏥"},{id:"education",label:"Education",icon:"🎓"},{id:"security",label:"National Security",icon:"🛡️"},{id:"environment",label:"Environment",icon:"🌱"},{id:"corruption",label:"Anti-Corruption",icon:"🔍"},{id:"infrastructure",label:"Infrastructure",icon:"🏗️"},{id:"immigration",label:"Immigration",icon:"🌐"},{id:"housing",label:"Housing & Cost of Living",icon:"🏠"},{id:"crime",label:"Crime & Justice",icon:"⚖️"},{id:"labor",label:"Labor & Workers",icon:"🔨"},{id:"foreign_policy",label:"Foreign Policy",icon:"🕊️"}],ae=["{party_name} Calls for Action on {topic}","{leader_name}: '{topic}' Must Be National Priority","{leader_name} Pledges Bold Agenda on {topic}","{party_name} Leader Addresses Nation on {topic}"];async function be(e,t){k=e,b=t;const a=document.getElementById("pa-actions-root");if(!a)return;const i=t.faction;if(!i){a.innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:300px;color:var(--text-dim);">No faction data.</div>';return}const[s,o,n,m,f]=await Promise.all([k.from("faction_platforms").select("*").eq("faction_id",i.id).order("slot"),k.from("faction_platforms").select("*").eq("nation_id",t.nation?.id),ve(k,i.id),fe(k,t.nation?.id,i.id),k.from("faction_electoral_standing").select("ideological_alignment, visibility, raw_appeal").eq("faction_id",i.id).eq("nation_id",t.nation?.id).maybeSingle()]);await Be(),s.error&&console.error("[PartyActions] Failed to load faction platforms:",s.error.message),o.error&&console.error("[PartyActions] Failed to load nation platforms:",o.error.message),X=s.data||[],Mt=o.data||[],D=n,vt=m.isOpposition,dt=m.administration,f.data;const{data:r}=await k.from("faction_deputies").select("*").eq("faction_id",i.id).eq("status","active").maybeSingle();O=r||null,D&&(Dt=await De(k,i.id)),U(a)}function U(e){const t=b.faction,a=b.nation,i=_t(a),s=i&&a?.monarch_faction_id===t?.id,o=t.color||"#c8a832",n=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown Leader",m=t.seats||0,f=a?.total_seats||120,r=f>0?Math.round(m/f*100):0;t.action_points,t.approval_rating;const d=t.momentum??50,p=t.party_funds??0,c=ze(X,a),v=[];for(let l=1;l<=3;l++){const u=X.find(g=>g.slot===l);if(u){const g=$t.find(E=>E.id===u.platform_key),y=c.find(E=>E.id===u.id),_=y?y.stats.filter(E=>E.met).length:0,x=y?y.stats.length:0;v.push({name:g?.name||u.platform_key,status:u.status,metCount:_,totalCount:x,slot:l})}else v.push(null)}e.innerHTML=`
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
                        <div class="pa-header-stat-value" style="color:${d>0?"var(--text-bright)":"var(--red)"};">${Number(d).toFixed(1)}</div>
                    </div>
                    <div class="pa-header-stat">
                        <div class="pa-header-stat-label">${i?"Legitimacy":"Governance"}</div>
                        <div class="pa-header-stat-value" style="color:var(--green);">${Math.round(Number(i?b.nation?.legitimacy??b.nation?.gov_approval??50:b.nation?.gov_approval??0))}</div>
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
                        ${v.map(l=>{if(!l)return'<span class="pa-platform-slot">No Platform</span>';const u=l.status==="fulfilled"?" ✓":l.status==="failed"?" ✗":l.status==="abated"?" —":"",g=l.status==="fulfilled"?"fulfilled":l.status==="failed"?"failed":l.status==="abated"?"abated":"filled",y=l.totalCount>0?`${l.metCount}/${l.totalCount}`:"";return`<span class="pa-platform-slot ${g}" title="${l.metCount} of ${l.totalCount} stats on target">${h(l.name)}${y?` (${y})`:""}${u}</span>`}).join("")}
                    </div>
                </div>
            </div>

            <!-- Main layout -->
            <div class="pa-main">
                <!-- Leader sidebar -->
                <div class="pa-leaders" id="pa-leaders">
                    ${Ge(n,o,t)}
                </div>

                <!-- Actions panel -->
                <div class="pa-actions-panel" id="pa-actions-panel">
                    ${qe(n,o,t)}
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
    `,document.getElementById("pa-leaders")?.addEventListener("click",l=>{const u=l.target.closest(".pa-leader-card");if(!u||u.classList.contains("vacant"))return;const g=u.dataset.role;g&&g!==Y&&(Y=g,U(e))}),document.getElementById("pa-actions-panel")?.addEventListener("click",l=>{const u=l.target.closest(".pa-action-item");if(!u||u.classList.contains("locked"))return;const g=u.dataset.actionId;g==="fundraise"?sa(e):g==="grant_seats"?oa(e):g==="revoke_seats"?na(e):g==="rally"?Ke(e):g==="statement"?ra(e):g==="platform"?la(e):g==="file_lawsuit"?aa(e):g==="appoint_pm"?ia(e):g==="modernize"?Je(e):g==="rebrand"&&Xe(e)}),document.getElementById("pa-hire-agitator-btn")?.addEventListener("click",()=>se(e)),document.getElementById("pa-hire-agitator-panel")?.addEventListener("click",l=>{l.target.closest("#pa-hire-agitator-btn")||se(e)}),document.getElementById("pa-hire-deputy-btn")?.addEventListener("click",()=>oe(e)),document.getElementById("pa-hire-deputy-panel")?.addEventListener("click",l=>{l.target.closest("#pa-hire-deputy-btn")||oe(e)})}function Ge(e,t,a){const i=_t(b.nation)&&b.nation?.monarch_faction_id===a?.id;return ge.map(s=>{const o=s.id==="leader",n=s.id==="agitator",m=Y===s.id;let f,r,d,p,c;if(o){f=!1,r=e,d=K(a.leader_first_name,a.leader_last_name),p=xe.length;const u=_t(b.nation);if(u&&b.nation?.monarch_faction_id===a.id)c={text:(b.nation?.monarch_title||"KING").toUpperCase(),color:"#c8a832"};else if(u)c={text:"NOBLE HOUSE",color:"#8b9a6b"};else{const y=dt?.pm_party_id===a.id,_=b.nation?.hos_election_method==="elected"&&dt?.president_party_id===a.id;y?c={text:"PRIME MINISTER",color:"#5cc55c"}:_?c={text:"PRESIDENT",color:"#5cc55c"}:vt?c={text:"OPPOSITION",color:"#c84"}:c={text:"GOVERNING",color:"#8b9a6b"}}}else n&&D?(f=!1,r=`${D.first_name} ${D.last_name}`,d=K(D.first_name,D.last_name),p=1):n&&!D?(f=!1,r="Not Hired",d="+",p=0):s.id==="deputy"&&O?(f=!1,r=`${O.first_name} ${O.last_name}`,d=K(O.first_name,O.last_name),p=1):s.id==="deputy"&&!O?(f=!1,r="Not Hired",d="+",p=0):s.id==="campaign"?(f=!1,r="Campaign Mgr",d="CM",p=he.length):(f=!0,r="Vacant",d="—",p=0);const v=s.oppositionOnly&&!vt;return`
            <div class="pa-leader-card ${m?"active":""} ${f?"vacant":""} ${v?"vacant":""}"
                 data-role="${s.id}"
                 style="${m?`border-left-color:${s.color};`:""}${v?"opacity:0.35;":""}">
                ${s.oppositionOnly?`<div style="position:absolute;top:0;right:0;font-family:var(--font-mono);font-size:5px;font-weight:700;letter-spacing:0.04em;padding:1px 4px;color:${v?"var(--text-dim)":"#d44a4a"};background:${v?"rgba(100,100,100,0.1)":"rgba(212,74,74,0.1)"};border:1px solid ${v?"rgba(100,100,100,0.2)":"rgba(212,74,74,0.2)"};border-top:none;border-right:none;">${v?"IN GOVERNMENT":"OPPOSITION ONLY"}</div>`:""}
                <div class="pa-leader-top">
                    <div class="pa-leader-avatar" style="color:${s.color};background:${s.color}15;border-color:${s.color}33;">${d}</div>
                    <div class="pa-leader-info">
                        <div class="pa-leader-role">
                            <span class="pa-leader-role-label" style="color:${s.color};">${o&&i?(b.nation?.monarch_title||"King").toUpperCase():s.title}</span>
                            ${p>0?`<span class="pa-leader-role-count">${p} actions</span>`:""}
                        </div>
                        <div class="pa-leader-name">${h(r)}</div>
                        ${c?`<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:${c.color};margin-top:2px;">${c.text}</div>`:""}
                        ${n&&D?`<div style="display:flex;align-items:center;gap:3px;margin-top:2px;"><div style="flex:1;height:2px;background:var(--border-mid);"><div style="height:100%;width:${D.skill}%;background:${lt(D.skill).color};"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);width:16px;text-align:right;">${D.skill}</span></div>`:""}
                        ${n&&!D?'<div style="font-family:var(--font-mono);font-size:7px;color:#d44a4a;margin-top:2px;">Click to recruit</div>':""}
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
    `}function qe(e,t,a){const i=_t(b.nation),s=i&&b.nation?.monarch_faction_id===a?.id,o=ge.find(x=>x.id===Y);if(!o)return"";const n=Y==="leader",m=Y==="agitator",f=Y==="campaign",r=Y==="deputy";if(!n&&!m&&!f&&!r)return`
            <div class="pa-vacant-msg">
                <div>
                    <div class="pa-vacant-title">${h(o.fullTitle)} — Vacant</div>
                    <div class="pa-vacant-sub">This position has not been filled. Recruitment coming in a future update.</div>
                </div>
            </div>
        `;if(m&&!vt)return`
            <div class="pa-vacant-msg" style="opacity:0.4;">
                <div style="text-align:center;">
                    <div style="font-size:2rem;margin-bottom:12px;opacity:0.3;">🚫</div>
                    <div class="pa-vacant-title">Agitator Unavailable</div>
                    <div class="pa-vacant-sub" style="max-width:400px;margin:8px auto;">
                        Your party is in government. The Agitator role is only available to opposition parties.
                    </div>
                </div>
            </div>
        `;if(m&&!D)return`
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
        `;if(m&&D)return ta(o);if(r&&!O)return`
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
        `;if(r&&O)return Ve(o);if(f)return We(o,a);const p=K(a.leader_first_name,a.leader_last_name),c=a.leader_age?`, Age ${a.leader_age}`:"",v=a.seats||0,l=a.momentum??0,_=(_t(b.nation)&&b.nation?.monarch_faction_id===a.id?je:xe).map(x=>{const E=x.tags.map(L=>`<span class="pa-action-tag" style="color:${At[L]||"var(--text-dim)"};">${L}</span>`).join("");let $="",w=x.cost,C=x.costColor,I=x.locked;if(x.id==="fundraise"){const L=ye(v,st);w=`-${L.momCost} MOM`,C="#c84",$=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);display:flex;gap:12px;">
                <span>Raises: <span style="color:var(--accent);font-weight:700;">$${(L.raised/1e3).toFixed(0)}k</span></span>
                <span>$${(L.perSeat/1e3).toFixed(0)}k/seat × ${v}</span>
                ${st>0?`<span style="color:var(--orange);">Use #${st+1}</span>`:""}
            </div>`,l-L.momCost<1&&(I=!0,$+=`<div style="margin-top:3px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Not enough momentum (need ${L.momCost}, have ${Number(l).toFixed(1)})</div>`)}return`
            <div class="pa-action-item ${I?"locked":""}" data-action-id="${x.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${h(x.name)}</span>
                        <div class="pa-action-tags">${E}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${C};">${w}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${h(x.desc)}</div>
                ${$}
                ${x.locked&&x.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${h(x.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${o.color};background:${o.color}15;border-color:${o.color}33;">${p}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${o.color};">${s?(b.nation?.monarch_title||"KING").toUpperCase():o.title}</span>
                        <span class="pa-detail-name">${h(e)}</span>
                        ${i&&b.nation?.dynasty_name?`<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);font-style:italic;">House ${h(b.nation.dynasty_name)}</span>`:""}
                    </div>
                    <div class="pa-detail-meta">${s?h((b.nation?.monarch_title||"King")+" of "+(b.nation?.name||"")):h(o.fullTitle)+" &middot; "+h(a.faction_name)}${c}${(()=>{if(s)return' <span style="color:#c8a832;font-weight:700;"> &middot; '+(b.nation?.monarch_title||"MONARCH").toUpperCase()+"</span>";if(i)return' <span style="color:#8b9a6b;font-weight:700;"> &middot; NOBLE HOUSE</span>';const x=dt?.pm_party_id===a.id,E=b.nation?.hos_election_method==="elected"&&dt?.president_party_id===a.id;return x?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRIME MINISTER</span>':E?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRESIDENT</span>':vt?' <span style="color:#c84;font-weight:700;"> &middot; OPPOSITION</span>':' <span style="color:#8b9a6b;font-weight:700;"> &middot; GOVERNING</span>'})()}</div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list">
            ${_}
        </div>
        <div class="pa-skill-footer">
            <span style="color:${o.color};font-weight:700;">${o.title}</span> actions are executed by the party leader. Effectiveness depends on party approval and momentum.
        </div>
    `}const He=[{id:"rally",name:"Hold a Rally",desc:"Invest party funds into a public rally. Higher investment improves your odds, but a bad roll can backfire. Roll 1d6 + rally bonus for momentum.",cost:"$50k-$200k",costColor:"#8b9a6b",tags:["CAMPAIGN","RISKY"],locked:!1}],ie=[{cost:5e4,bonus:1,label:"$50k (+1)"},{cost:8e4,bonus:2,label:"$80k (+2)"},{cost:12e4,bonus:3,label:"$120k (+3)"},{cost:15e4,bonus:4,label:"$150k (+4)"},{cost:2e5,bonus:5,label:"$200k (+5)"}];function Ue(e,t){const a=e+t;return a>=8?{momentum:3,label:"Rousing Success",color:"#5cc55c"}:a>=5?{momentum:2,label:"Solid Turnout",color:"#8b9a6b"}:a>=3?{momentum:0,label:"Flat Response",color:"#ca5"}:{momentum:-2,label:"Backfire",color:"#c55"}}function Ve(e){const t=He.map(i=>{const s=i.tags.map(o=>`<span class="pa-action-tag" style="color:${At[o]||"var(--text-dim)"};">${o}</span>`).join("");return`
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
        `}).join(""),a=lt(O.skill);return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${e.color};background:${e.color}15;border-color:${e.color}33;">${K(O.first_name,O.last_name)}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${e.color};">${e.title}</span>
                        <span class="pa-detail-name">${h(O.first_name)} ${h(O.last_name)}</span>
                    </div>
                    <div class="pa-detail-meta">${h(e.fullTitle)} &middot; Age ${O.age} &middot; Skill: <span style="color:${a.color};font-weight:700;">${O.skill}</span></div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list" id="pa-actions-panel">${t}</div>
    `}function Ye(e){const t=Vt(e),a=t.firstNames||[],i=t.lastNames||[];if(a.length===0||i.length===0)return[];const s=5+Math.floor(Math.random()*3),o=new Set,n=[];for(let m=0;m<s;m++){let f,r,d,p=0;do f=a[Math.floor(Math.random()*a.length)],r=i[Math.floor(Math.random()*i.length)],d=f+" "+r,p++;while(o.has(d)&&p<20);o.add(d);const c=20+Math.floor(Math.random()*66),v=28+Math.floor(Math.random()*30),l=Math.max(0,c-20)/65,u=Math.round((125e3+l*525e3)/25e3)*25e3;n.push({first_name:f,last_name:r,age:v,skill:c,hire_cost:u})}return n.sort((m,f)=>f.skill-m.skill)}async function oe(e){const t=document.getElementById("pa-deputy-modal");if(!t)return;const a=b.nation?.name,i=Ye(a);let s=null;function o(){const n=s!=null?i[s]:null,m=n?lt(n.skill):null,f=i.map((p,c)=>{const v=s===c,l=lt(p.skill);return`<div class="pa-hire-row ${v?"selected":""}" data-idx="${c}">
                <div style="width:32px;height:32px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#8b9a6b;flex-shrink:0;">${K(p.first_name,p.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${v?"var(--text-bright)":"var(--text-secondary)"};">${h(p.first_name)} ${h(p.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${p.skill}%;background:${l.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${l.color};">${p.skill}</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Age ${p.age}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);">$${Math.round(p.hire_cost/1e3)}k</div>
                </div>
            </div>`}).join("");let r;n?r=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#8b9a6b;">${K(n.first_name,n.last_name)}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-dep-hire-confirm" style="background:#8b9a6b;"${(b.faction?.party_funds||0)<n.hire_cost?' disabled title="Not enough funds"':""}>Hire ${h(n.first_name)}</button>
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
        `;const d=()=>t.classList.remove("active");document.getElementById("pa-dep-close")?.addEventListener("click",d),t.onclick=p=>{p.target===t&&d()},document.getElementById("pa-dep-list")?.addEventListener("click",p=>{const c=p.target.closest(".pa-hire-row");c&&(s=parseInt(c.dataset.idx,10),o())}),document.getElementById("pa-dep-hire-confirm")?.addEventListener("click",async()=>{if(s==null)return;const p=i[s],c=b.faction?.party_funds||0;if(c<p.hire_cost){alert("Not enough funds.");return}const v=document.getElementById("pa-dep-hire-confirm");v&&(v.disabled=!0,v.textContent="Hiring...");try{const l=c-p.hire_cost,u=b.shard?.current_tick||0,{data:g,error:y}=await k.from("faction_deputies").insert({faction_id:b.faction.id,first_name:p.first_name,last_name:p.last_name,age:p.age,skill:p.skill,status:"active",hired_at_tick:u}).select("*").single();if(y){alert("Failed: "+y.message);return}await k.from("factions").update({party_funds:l}).eq("id",b.faction.id),b.faction.party_funds=l,O=g,Y="deputy",d(),U(e)}catch(l){console.error("[Deputy] Hire error:",l)}finally{v&&(v.disabled=!1)}})}t.classList.add("active"),o()}function Ke(e){const t=document.getElementById("pa-rally-modal");if(!t||!O)return;const i=b.faction.party_funds||0;let s=null,o=null;function n(){const m=ie.map((d,p)=>{const c=i>=d.cost,v=s===p;return`<div class="pa-action-item ${v?"selected":""} ${c?"":"locked"}" data-tier="${p}" style="cursor:${c?"pointer":"not-allowed"};${v?"border-color:#8b9a6b;background:rgba(139,154,107,0.06);":""}">
                <div class="pa-action-top">
                    <span style="font-size:13px;font-weight:700;color:${v?"#8b9a6b":"var(--text-bright)"};">$${Math.round(d.cost/1e3)}k Investment</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#8b9a6b;">+${d.bonus} Rally Bonus</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">Roll 1d6 + ${d.bonus} = range ${1+d.bonus} to ${6+d.bonus}</div>
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
        `;const r=()=>{t.classList.remove("active"),o&&U(e)};document.getElementById("rally-close")?.addEventListener("click",r),document.getElementById("rally-cancel")?.addEventListener("click",r),t.onclick=d=>{d.target===t&&r()},document.getElementById("rally-tiers")?.addEventListener("click",d=>{const p=d.target.closest("[data-tier]");!p||p.classList.contains("locked")||(s=parseInt(p.dataset.tier,10),n())}),document.getElementById("rally-submit")?.addEventListener("click",async()=>{if(s==null||o)return;const d=ie[s],{data:p}=await k.from("factions").select("party_funds, momentum").eq("id",b.faction.id).single(),c=p?.party_funds||0;if(c<d.cost){alert("Not enough funds.");return}b.faction.party_funds=c,b.faction.momentum=p?.momentum??b.faction.momentum;const v=document.getElementById("rally-submit");v&&(v.disabled=!0,v.textContent="Rolling...");try{const l=1+Math.floor(Math.random()*6),u=Ue(l,d.bonus),g=c-d.cost,y=Math.max(1,(b.faction.momentum||0)+u.momentum);await k.from("factions").update({party_funds:g,momentum:y}).eq("id",b.faction.id);const _=b.shard?.current_tick||0;await k.from("campaign_actions").insert({party_id:b.faction.id,nation_id:b.nation?.id,action_type:"rally",ap_cost:0,money_cost:d.cost,tick_performed:_,result:{dieRoll:l,bonus:d.bonus,total:l+d.bonus,momentum:u.momentum,label:u.label}}),b.faction.party_funds=g,b.faction.momentum=y,sessionStorage.removeItem("nationhood_state"),o={...u,dieRoll:l,bonus:d.bonus,total:l+d.bonus},n()}catch(l){console.error("[Rally] Error:",l),alert("Rally failed.")}})}t.classList.add("active"),n()}const he=[{id:"modernize",name:"Modernize Image",desc:"Upload a custom logo to refresh your party's brand. Grants +1 Momentum/tick while a custom logo is active. Quick and affordable.",cost:"$50k",costColor:"#5a8aaa",moneyCost:5e4,tags:["CAMPAIGN","BRANDING"],locked:!1},{id:"rebrand",name:"Rebrand Party",desc:'Change your party name, abbreviation, color, logo, and description. Costly but grants a "Fresh Start" modifier. Nuclear option after scandal or major defeat.',cost:"$150k",costColor:"#c84",moneyCost:15e4,tags:["CAMPAIGN","STRUCTURAL"],locked:!1}],ne=[{id:"crimson",hex:"#c43a3a",name:"Crimson"},{id:"scarlet",hex:"#d45a2a",name:"Scarlet"},{id:"amber",hex:"#c8a832",name:"Amber"},{id:"gold",hex:"#d4a017",name:"Gold"},{id:"olive",hex:"#8a9a4a",name:"Olive"},{id:"emerald",hex:"#2a8a4a",name:"Emerald"},{id:"forest",hex:"#3a6a3a",name:"Forest"},{id:"teal_c",hex:"#2a8a7a",name:"Teal"},{id:"sky",hex:"#4a8aba",name:"Sky"},{id:"cobalt",hex:"#3a5a9a",name:"Cobalt"},{id:"navy",hex:"#2a3a6a",name:"Navy"},{id:"violet",hex:"#7a4a9a",name:"Violet"},{id:"plum",hex:"#8a3a7a",name:"Plum"},{id:"rose",hex:"#ba4a6a",name:"Rose"},{id:"slate",hex:"#5a6a7a",name:"Slate"},{id:"iron",hex:"#4a4a4a",name:"Iron"}],Bt=[{emoji:"🏛️",name:"Parliament"},{emoji:"⚖️",name:"Scales"},{emoji:"🗽",name:"Liberty"},{emoji:"🕊️",name:"Dove"},{emoji:"🦅",name:"Eagle"},{emoji:"🦁",name:"Lion"},{emoji:"🐻",name:"Bear"},{emoji:"🐉",name:"Dragon"},{emoji:"🐘",name:"Elephant"},{emoji:"🏔️",name:"Mountain"},{emoji:"🌊",name:"Wave"},{emoji:"🔥",name:"Flame"},{emoji:"⭐",name:"Star"},{emoji:"🌟",name:"Glow Star"},{emoji:"💎",name:"Diamond"},{emoji:"🛡️",name:"Shield"},{emoji:"⚔️",name:"Swords"},{emoji:"🏗️",name:"Builder"},{emoji:"🌿",name:"Leaf"},{emoji:"🌾",name:"Wheat"},{emoji:"🔨",name:"Hammer"},{emoji:"⚡",name:"Lightning"},{emoji:"🎯",name:"Target"},{emoji:"🏴",name:"Flag"},{emoji:"🚩",name:"Red Flag"},{emoji:"✊",name:"Fist"},{emoji:"🤝",name:"Handshake"},{emoji:"📜",name:"Scroll"},{emoji:"🗳️",name:"Ballot"},{emoji:"👑",name:"Crown"}];function We(e,t){const a=he.map(i=>{const s=i.tags.map(o=>`<span class="pa-action-tag" style="color:${At[o]||"var(--text-dim)"};">${o}</span>`).join("");return`
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
                <div class="pa-detail-avatar" style="color:${e.color};background:${e.color}15;border-color:${e.color}33;">CM</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${e.color};">${e.title}</span>
                    </div>
                    <div class="pa-detail-meta">${h(e.fullTitle)} &middot; ${h(t.faction_name)}</div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list" id="pa-actions-panel">${a}</div>
        <div style="padding:8px 14px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);line-height:1.6;">
            <strong style="color:var(--text-secondary);">CAMPAIGN MANAGER</strong> actions shape your party's public identity and electoral strategy.
        </div>
    `}function Je(e){const t=document.getElementById("pa-modernize-modal");if(!t)return;const a=b.faction;let i=null,s=a.custom_logo_url||null,o=!1;function n(){const m=!!s,r=Number(a.party_funds??0)>=5e4,d=!!i&&r&&!o;t.innerHTML=`
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
                        ${a.custom_logo_url&&!i?'<div style="font-family:var(--font-mono);font-size:8px;color:var(--green);margin-top:6px;">Current logo active — +1 Momentum/tick</div>':""}
                        ${i?'<div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);margin-top:6px;">New logo ready to upload</div>':""}
                    </div>
                    ${r?"":'<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">Insufficient funds. Need $50k.</div>'}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="mod-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="mod-submit" ${d?"":"disabled"} style="background:#5a8aaa;">Modernize — $50k</button>
                </div>
            </div>
        `,document.getElementById("mod-close")?.addEventListener("click",()=>t.classList.remove("active")),document.getElementById("mod-cancel")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=p=>{p.target===t&&t.classList.remove("active")},document.getElementById("mod-file-input")?.addEventListener("change",p=>{const c=p.target.files?.[0];if(c){if(c.size>2*1024*1024){alert("Logo must be under 2MB.");return}i=c,s=URL.createObjectURL(c),n()}}),document.getElementById("mod-submit")?.addEventListener("click",async()=>{if(o||!i)return;o=!0;const p=document.getElementById("mod-submit");p&&(p.disabled=!0,p.textContent="Uploading...");try{const c=i.name.split(".").pop()?.toLowerCase()||"png",v=`${a.id}/logo_${Date.now()}.${c}`,{error:l}=await k.storage.from("party-logos").upload(v,i,{cacheControl:"3600",upsert:!0,contentType:i.type});if(l)throw new Error("Upload failed: "+l.message);const{data:u}=k.storage.from("party-logos").getPublicUrl(v),g=u?.publicUrl;if(!g)throw new Error("Failed to get logo URL");const y=Math.max(0,Number(a.party_funds??0)-5e4),{error:_}=await k.from("factions").update({custom_logo_url:g,party_funds:y}).eq("id",a.id);if(_)throw _;a.custom_logo_url=g,a.party_funds=y,t.classList.remove("active"),alert("Logo updated! Your party now earns +1 Momentum/tick from the modernized image."),U(e)}catch(c){alert("Modernize failed: "+(c.message||"Error")),o=!1,p&&(p.disabled=!1,p.textContent="Modernize — $50k")}})}t.classList.add("active"),n()}function Xe(e){const t=document.getElementById("pa-rebrand-modal");if(!t)return;const a=b.faction;b.nation;const i=a.momentum??50;(b._allParties||[]).filter(c=>c.id!==a.id);const s={current:a.party_color||"#4a8aba"},o={current:0},n={current:a.custom_logo_url||null},m={current:null},f={current:!!a.custom_logo_url},r={current:!1};function d(){return s.current}function p(){const c=d(),v=ne.find(w=>w.hex===c)?.name||"Custom",l=Bt[o.current]?.emoji||"🏛️",u=f.current&&(n.current||m.current),g=n.current||(m.current?URL.createObjectURL(m.current):null),y=document.getElementById("rb-name")?.value??a.faction_name??"",_=document.getElementById("rb-abbr")?.value??a.abbreviation??"",x=document.getElementById("rb-desc")?.value??"",E=ne.map(w=>{const C=c===w.hex;return`<div class="rb-color-swatch ${C?"selected":""}" data-hex="${w.hex}" style="background:${w.hex};${C?`box-shadow:0 0 8px ${w.hex}44;border:2px solid var(--text-bright);`:""}">
                ${C?'<span style="font-size:10px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.5);">✓</span>':""}
            </div>`}).join(""),$=Bt.map((w,C)=>{const I=o.current===C;return`<div class="rb-logo-item ${I?"selected":""}" data-idx="${C}" style="${I?`background:${c}15;border:2px solid ${c};box-shadow:0 0 6px ${c}33;`:""}">
                ${w.emoji}
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
                            <input class="pa-modal-input" id="rb-name" value="${h(y)}" maxlength="60" style="font-size:13px;font-weight:600;">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${y.length}/60 · Min 3</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Abbreviation</div>
                            <input class="pa-modal-input" id="rb-abbr" value="${h(_)}" maxlength="4" style="width:100px;font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;color:${c};">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">2-4 uppercase letters</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Description</div>
                            <textarea class="pa-modal-input" id="rb-desc" rows="3" style="resize:vertical;font-family:var(--font-ui);font-size:11px;line-height:1.5;">${h(x)}</textarea>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${x.length}/200 · Visible to all</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Color — <span style="color:${c};">${h(v)}</span></div>
                            <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;" id="rb-colors">${E}</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Logo — ${u?'<span style="color:var(--teal);">Custom</span>':"Preset"}</div>
                            <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px;margin-bottom:8px;${u?"opacity:0.3;":""}" id="rb-logos">${$}</div>
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
                                    ${u&&g?`<img src="${g}" style="width:100%;height:100%;object-fit:contain;" alt="">`:l}
                                </div>
                                <div>
                                    <div style="font-size:12px;font-weight:700;color:var(--text-bright);line-height:1.2;">${h(y||"Party Name")}</div>
                                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${c};letter-spacing:1px;">${h(_||"???")}</div>
                                </div>
                            </div>
                            <div style="font-size:9px;color:var(--text-secondary);line-height:1.5;">${h(x||"No description...")}</div>
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
        `}t._rbCustomLogoFile=null,t._rbCustomLogoUrl=n.current,t._rbUseCustomLogo=f.current,p(),t.classList.add("active"),t.addEventListener("change",function(v){if(v.target.id==="rb-logo-file"){const l=v.target.files?.[0];if(!l)return;if(l.size>2*1024*1024){alert("Logo must be under 2MB. Selected file: "+(l.size/(1024*1024)).toFixed(1)+"MB"),v.target.value="";return}if(!["image/png","image/jpeg","image/svg+xml","image/webp"].includes(l.type)){alert("Unsupported file type. Use PNG, JPG, SVG, or WebP."),v.target.value="";return}m.current=l,n.current=null,f.current=!0,t._rbCustomLogoFile=l,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!0,p()}}),t.addEventListener("click",function c(v){if(v.target===t||v.target.closest("#rb-close")||v.target.closest("#rb-cancel")){t.classList.remove("active"),t.removeEventListener("click",c);return}const l=v.target.closest(".rb-color-swatch");if(l){s.current=l.dataset.hex,p();return}const u=v.target.closest(".rb-logo-item");if(u){o.current=parseInt(u.dataset.idx)||0,f.current=!1,t._rbUseCustomLogo=!1,p();return}if(v.target.closest("#rb-remove-logo")){n.current=null,m.current=null,f.current=!1,t._rbCustomLogoFile=null,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!1,p();return}if(v.target.closest("#rb-submit")){const g=document.getElementById("rb-name")?.value?.trim()||"",y=document.getElementById("rb-abbr")?.value?.trim()||"";if(g.length<3||y.length<2){alert("Name must be 3+ chars, abbreviation 2-4 chars.");return}r.current=!0,p();return}if(v.target.closest("#rb-back")){r.current=!1,p();return}if(v.target.closest("#rb-confirm")){Qe(t,e,c);return}})}async function Qe(e,t,a){const i=b.faction,s=document.getElementById("rb-name")?.value?.trim()||"",o=document.getElementById("rb-abbr")?.value?.trim()||"";document.getElementById("rb-desc")?.value?.trim();const n=document.querySelector(".rb-color-swatch.selected")?.dataset?.hex||i.party_color,m=document.querySelector(".rb-logo-item.selected")?.dataset?.idx,f=m!=null?Bt[parseInt(m)]?.emoji:null,r=e._rbCustomLogoFile,d=e._rbUseCustomLogo,p=e._rbCustomLogoUrl,c=document.getElementById("rb-confirm");c&&(c.disabled=!0,c.textContent="Rebranding...");try{const v=b.shard?.current_tick||0;let l=p;if(d&&r){const x=r.name.split(".").pop()?.toLowerCase()||"png",E=`${i.id}/logo_${Date.now()}.${x}`,{data:$,error:w}=await k.storage.from("party-logos").upload(E,r,{cacheControl:"3600",upsert:!0,contentType:r.type});if(w){console.error("[Rebrand] Logo upload failed:",w.message),alert("Logo upload failed: "+w.message);return}const{data:C}=k.storage.from("party-logos").getPublicUrl(E);l=C?.publicUrl||null}else d||(l=null);const u=15e4,g=i.party_funds||0;if(g<u){alert(`Not enough funds. You have $${Math.round(g/1e3)}k, need $150k.`);return}const y=g-u,_=Math.max(1,(i.momentum||0)-10);await k.from("factions").update({party_funds:y,momentum:_,faction_name:s,abbreviation:o.toUpperCase(),party_color:n,party_logo:d?null:f,custom_logo_url:l,rebrand_cooldown_until_tick:v+120}).eq("id",i.id),await k.from("campaign_actions").insert({party_id:i.id,nation_id:b.nation?.id,action_type:"rebrand",ap_cost:3,money_cost:0,tick_performed:v,result:{oldName:i.faction_name,newName:s,oldAbbr:i.abbreviation,newAbbr:o,oldColor:i.party_color,newColor:n}}),i.party_funds=y,i.momentum=_,i.faction_name=s,i.abbreviation=o.toUpperCase(),i.party_color=n,i.party_logo=d?null:f,i.custom_logo_url=l,e.classList.remove("active"),e.removeEventListener("click",a),U(t)}catch(v){console.error("[PartyActions] Rebrand error:",v),alert("Failed to rebrand: "+(v.message||v))}finally{c&&(c.disabled=!1,c.textContent="⚠ Confirm Rebrand")}}const Ze=[{id:"file_lawsuit",name:"File Lawsuit",desc:"Sue a government ministry alleging corruption or negligence. 8-tick timeline with milestone events. Outcome depends on actual corruption growth since government took office.",cost:"$250k",costColor:"#c8a832",moneyCost:25e4,tags:["LEGAL","OFFENSIVE"],locked:!1}];function ta(e){const t=D,a=K(t.first_name,t.last_name),i=lt(t.skill),s=vt?'<span style="color:#5cc55c;margin-left:6px;">✓ IN OPPOSITION</span>':'<span style="color:#c84;margin-left:6px;">⚠ IN GOVERNMENT (actions limited)</span>',o=Ze.map(n=>{const m=n.tags.map(f=>`<span class="pa-action-tag" style="color:${At[f]||"var(--text-dim)"};">${f}</span>`).join("");return`
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
                <div class="pa-detail-avatar" style="color:${e.color};background:${e.color}15;border-color:${e.color}33;">${a}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${e.color};">${e.title}</span>
                        <span class="pa-detail-name">${h(t.first_name)} ${h(t.last_name)}</span>
                    </div>
                    <div class="pa-detail-meta">${h(e.fullTitle)}, Age ${t.age}${s}</div>
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
        ${ea()}
        <div class="pa-skill-footer">
            <span style="color:${e.color};font-weight:700;">${e.title}</span> skill (${t.skill}/100) affects lawsuit discovery and legal action outcomes. <span style="color:${i.color};font-weight:700;">${i.label}</span>: ${i.desc}
        </div>
    `}function ea(){if(Dt.length===0)return"";const e=b.shard?.current_tick||0;return`
        <div class="pa-ls-section">
            <div class="pa-ls-section-title">Legal Actions</div>
            ${Dt.map(a=>{const i=It.find(y=>y.key===a.target_ministry),s=i?i.label:a.target_ministry,o=i?i.icon:"⚖️",n=Kt(a.corruption_growth||0),m=tt[a.tier]||tt[1],f=a.status==="active",r=Math.max(0,e-a.filed_at_tick),d=8,p=Math.min(1,r/d),c=Math.max(0,a.resolves_at_tick-e),v=[{tick:0,label:"Filed",type:"filing"},{tick:2,label:"Discovery",type:"discovery"},{tick:5,label:"Evidence",type:"evidence"},{tick:7,label:"Pre-trial",type:"pre_trial"},{tick:8,label:"Verdict",type:"resolution"}],l=v.map(y=>{const _=a.filed_at_tick+y.tick,x=e>=_,E=e>=_&&(y.tick===8||e<a.filed_at_tick+v[v.indexOf(y)+1]?.tick),$=y.tick/d*100;return`<div class="pa-ls-milestone ${x?"passed":""} ${E?"current":""}" style="left:${$}%;" title="${y.label} (Tick ${_})">
                <div class="pa-ls-milestone-dot"></div>
                <div class="pa-ls-milestone-label">${y.label}</div>
            </div>`}).join("");let u="";if(!f){const y=m===tt[1]?"FRIVOLOUS":m===tt[2]?"PARTIAL WIN":m===tt[3]?"MAJOR WIN":"DEVASTATING",_=a.tier===1?"var(--red)":a.tier===2?"#ca5":a.tier===3?"#c84":"var(--green)";u=`<span class="pa-ls-tier-badge" style="color:${_};border-color:${_}44;background:${_}0a;">${y}</span>`}const g=f?"":`
            <div style="display:flex;gap:12px;margin-top:6px;font-family:var(--font-mono);font-size:8px;">
                <span style="color:${a.momentum_effect>=0?"var(--green)":"var(--red)"};">You: ${a.momentum_effect>=0?"+":""}${a.momentum_effect} Mom</span>
                <span style="color:${a.governance_effect>=0?"var(--green)":"var(--red)"};">${a.governance_effect>=0?"+":""}${a.governance_effect} Gov</span>
                <span style="color:${a.gov_momentum_effect>=0?"var(--green)":"var(--red)"};">Govt: ${a.gov_momentum_effect>=0?"+":""}${a.gov_momentum_effect} Mom</span>
            </div>
        `;return`
            <div class="pa-ls-card ${f?"active":"resolved"}">
                <div class="pa-ls-header">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${o}</span>
                        <span style="font-size:11px;font-weight:700;color:var(--text-bright);">${h(s)}</span>
                        <span class="pa-ls-tier-badge" style="color:${n.color};border-color:${n.color}44;background:${n.color}0a;">TIER ${a.tier}</span>
                        ${u}
                    </div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">
                        ${f?`${c} ticks left`:`Resolved tick ${a.resolves_at_tick}`}
                    </div>
                </div>
                ${f?`
                    <div class="pa-ls-timeline">
                        <div class="pa-ls-timeline-track">
                            <div class="pa-ls-timeline-fill" style="width:${p*100}%;"></div>
                        </div>
                        ${l}
                    </div>
                `:""}
                <div style="font-size:9px;color:var(--text-dim);margin-top:4px;">
                    Corruption growth: <span style="color:${n.color};font-weight:700;">${(a.corruption_growth||0).toFixed(1)}</span>
                    &mdash; ${h(n.label)}
                </div>
                ${g}
            </div>
        `}).join("")}
        </div>
    `}let Nt=!1;async function se(e){const t=document.getElementById("pa-hire-modal");if(!t)return;const a=b.nation?.id,i=b.nation?.name;if(!a||!i)return;t.innerHTML='<div class="pa-modal"><div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Searching for candidates...</div></div>',t.classList.add("active");const s=await Fe(k,a,i);let o=null;function n(){const m=o!=null?s[o]:null,f=m?lt(m.skill):null,r=s.map((c,v)=>{const l=o===v,u=lt(c.skill);return`<div class="pa-hire-row ${l?"selected":""}" data-idx="${v}">
                <div style="width:32px;height:32px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#d44a4a;flex-shrink:0;">${K(c.first_name,c.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${l?"var(--text-bright)":"var(--text-secondary)"};">${h(c.first_name)} ${h(c.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${c.skill}%;background:${u.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${u.color};">${c.skill}</span>
                    </div>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;">Age ${c.age}</div>
            </div>`}).join("");let d;m?d=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#d44a4a;">${K(m.first_name,m.last_name)}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-hire-confirm" style="background:#d44a4a;"${(b.faction?.party_funds||0)<m.hire_cost?' disabled title="Not enough funds"':""}>Hire ${h(m.first_name)}</button>
                </div>
            `:d=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;"><div style="text-align:center;">
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
                        ${d}
                    </div>
                </div>
            </div>
        `;const p=()=>t.classList.remove("active");document.getElementById("pa-hire-close")?.addEventListener("click",p),t.onclick=c=>{c.target===t&&p()},document.getElementById("pa-hire-list")?.addEventListener("click",c=>{const v=c.target.closest(".pa-hire-row");v&&(o=parseInt(v.dataset.idx,10),n())}),document.getElementById("pa-hire-confirm")?.addEventListener("click",async()=>{if(Nt||o==null)return;Nt=!0;const c=document.getElementById("pa-hire-confirm");c&&(c.disabled=!0,c.textContent="Hiring...");try{const v=b.shard?.current_tick||0,l=s[o],u=l.hire_cost||0,g=b.faction?.party_funds||0;if(u>0&&g<u){alert(`Not enough funds. You have $${Math.round(g/1e3)}k, need $${Math.round(u/1e3)}k.`);return}if(u>0){const _=g-u,{error:x}=await k.from("factions").update({party_funds:_}).eq("id",b.faction.id);if(x){alert("Failed to deduct funds.");return}b.faction.party_funds=_}const y=await Re(k,b.faction?.id,l,v);if(!y.success){alert(y.error||"Failed to hire agitator.");return}D=y.agitator,Y="agitator",p(),U(e)}catch(v){console.error("[PartyActions] Hire agitator error:",v)}finally{Nt=!1,c&&(c.disabled=!1)}})}n()}let kt=!1;function aa(e){const t=document.getElementById("pa-lawsuit-modal");if(!t)return;if(!dt){alert("No active government to file against.");return}const a=b.faction,i=D;let s=null,o=null;function n(){const m=s&&o,f=It.map(p=>{const c=s===p.key;return`<div class="pa-lawsuit-target ${c?"selected":""}" data-target="${p.key}">
                <span style="font-size:18px;">${p.icon}</span>
                <span style="font-size:12px;font-weight:600;color:${c?"var(--text-bright)":"var(--text-secondary)"};">${h(p.label)}</span>
            </div>`}).join(""),r=ue.map(p=>{const c=o===p.key;return`<div class="pa-lawsuit-basis ${c?"selected":""}" data-basis="${p.key}">
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
        `;const d=()=>t.classList.remove("active");document.getElementById("pa-lawsuit-close")?.addEventListener("click",d),document.getElementById("pa-lawsuit-cancel")?.addEventListener("click",d),t.onclick=p=>{p.target===t&&d()},document.getElementById("pa-lawsuit-targets")?.addEventListener("click",p=>{const c=p.target.closest(".pa-lawsuit-target");c&&(s=c.dataset.target,n())}),document.getElementById("pa-lawsuit-bases")?.addEventListener("click",p=>{const c=p.target.closest(".pa-lawsuit-basis");c&&(o=c.dataset.basis,n())}),document.getElementById("pa-lawsuit-submit")?.addEventListener("click",async()=>{if(kt||!s||!o)return;kt=!0;const p=document.getElementById("pa-lawsuit-submit");p&&(p.disabled=!0,p.textContent="Filing...");try{const{data:v}=await k.from("factions").select("party_funds").eq("id",a.id).single(),l=v?.party_funds||0;if(l<25e4){alert(`Not enough funds. You have $${Math.round(l/1e3)}k, need $250k.`),kt=!1,p&&(p.disabled=!1,p.textContent="File Lawsuit");return}const u=l-25e4;await k.from("factions").update({party_funds:u}).eq("id",a.id),a.party_funds=u,sessionStorage.removeItem("nationhood_state");const g=b.shard?.current_tick||0,y=await Oe(k,{factionId:a?.id,nationId:b.nation?.id,agitatorId:i?.id,targetMinistry:s,basis:o,currentTick:g,partyName:a?.faction_name||"Opposition",administration:dt});if(!y.success){alert(y.error||"Failed to file lawsuit.");return}const _=Kt(y.lawsuit?.corruption_growth||0),x=tt[y.tier]||tt[1];d(),alert(`Lawsuit filed against ${It.find(E=>E.key===s)?.label||s}.
The case is now under investigation. Results will be determined when it resolves in 8 ticks.`),U(e)}catch(c){console.error("[PartyActions] File lawsuit error:",c),alert("An error occurred. Please try again.")}finally{kt=!1,p&&(p.disabled=!1,p.textContent="File Lawsuit")}})}t.classList.add("active"),n()}async function ia(e){const t=document.getElementById("pa-appoint-pm-modal");if(!t)return;const a=b.nation;b.faction;const{data:i}=await k.from("factions").select("id, faction_name, abbreviation, party_color, seats, leader_first_name, leader_last_name, leader_age").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),s=i||[];let o=null,n=!1;const{data:m}=await k.from("head_of_government").select("faction_id, first_name, last_name, factions(faction_name)").eq("nation_id",a.id).eq("active",!0).maybeSingle();function f(){const r=s.find(l=>l.id===o),d=m?`${m.first_name} ${m.last_name}`:null,p=m?.factions?.faction_name||null,c=m&&o===m.faction_id;t.innerHTML=`
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
                    ${d?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Current PM: <strong style="color:var(--text-bright);">${h(d)}</strong> (${h(p||"?")})</div>`:'<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--amber);">No Prime Minister appointed.</div>'}
                </div>
                <div class="pa-modal-body" style="max-height:300px;overflow-y:auto;">
                    <div class="pa-modal-step-label">Select a Party</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${s.map(l=>{const u=l.id===o,g=m&&l.id===m.faction_id,y=l.leader_first_name&&l.leader_last_name?`${l.leader_first_name} ${l.leader_last_name}`:"?";return`<div class="pa-action-item ${u?"selected":""}" data-party-id="${l.id}" style="cursor:pointer;${u?`border-color:${l.party_color||"#888"};background:${l.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${l.party_color||"#888"};"></div>
                                        <div>
                                            <div style="font-size:13px;font-weight:600;color:var(--text-bright);">${h(l.faction_name)}</div>
                                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${h(y)}, Age ${l.leader_age||"?"} · ${l.seats||0} seats</div>
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
        `;const v=()=>t.classList.remove("active");document.getElementById("apm-close")?.addEventListener("click",v),document.getElementById("apm-cancel")?.addEventListener("click",v),t.onclick=l=>{l.target===t&&v()},t.querySelector(".pa-modal-body")?.addEventListener("click",l=>{const u=l.target.closest("[data-party-id]");u&&(o=u.dataset.partyId,f())}),document.getElementById("apm-confirm")?.addEventListener("click",async()=>{if(!o||n)return;const l=s.find(g=>g.id===o);if(!l||!confirm(`Appoint ${l.leader_first_name} ${l.leader_last_name} of ${l.faction_name} as Prime Minister?`))return;n=!0;const u=document.getElementById("apm-confirm");u&&(u.disabled=!0,u.textContent="Appointing...");try{const g=b.shard?.current_tick||0;await k.from("head_of_government").update({active:!1}).eq("nation_id",a.id).eq("active",!0);const{error:y}=await k.from("head_of_government").insert({nation_id:a.id,faction_id:o,first_name:l.leader_first_name||"Unknown",last_name:l.leader_last_name||"Unknown",age:l.leader_age||50,ideology:"Centrist",active:!0,appointed_tick:g});if(y)throw y;try{await k.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} appoints Prime Minister`,category:"government",description_chosen:`${a.monarch_title||"The King"} has appointed ${l.leader_first_name} ${l.leader_last_name} of ${l.faction_name} as Prime Minister.`,fired_at_tick:g})}catch{}v(),alert(`${l.leader_first_name} ${l.leader_last_name} of ${l.faction_name} has been appointed Prime Minister.`),U(e)}catch(g){alert("Failed to appoint PM: "+(g.message||"Error")),n=!1,u&&(u.disabled=!1,u.textContent=`Appoint ${h(l.faction_name)}`)}})}t.classList.add("active"),f()}async function oa(e){const t=document.getElementById("pa-royal-modal");if(!t)return;const a=b.nation,i=b.faction,s=i.seats||0,o=a?.total_seats||100,{data:n}=await k.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),m=(n||[]).filter(c=>c.id!==i.id);let f=null;const r=Math.max(0,s-1);let d=Math.min(5,r||1);function p(){const c=m.find(l=>l.id===f);t.innerHTML=`
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
                        ${m.length>0?m.map(l=>{const u=l.id===f;return`<div class="pa-action-item ${u?"selected":""}" data-faction-id="${l.id}" style="cursor:pointer;${u?`border-color:${l.party_color||"#888"};background:${l.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${l.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${h(l.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${Math.max(0,l.seats||0)} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No other factions in this nation.</div>'}
                    </div>
                    ${c?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Grant</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${r}" value="${d}" id="grant-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--accent);width:40px;text-align:center;" id="grant-count">${d}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Legitimacy gain: <span style="color:#5cc55c;font-weight:700;">+${(d*.5).toFixed(1)}</span>
                                &middot; Your seats after: ${s-d} &middot; Their seats after: ${(c.seats||0)+d}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-grant" ${c?"":"disabled"} style="background:#c8a832;">Grant ${d} Seats</button>
                </div>
            </div>
        `;const v=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",v),document.getElementById("royal-cancel")?.addEventListener("click",v),t.onclick=l=>{l.target===t&&v()},t.querySelector(".pa-modal-body")?.addEventListener("click",l=>{const u=l.target.closest("[data-faction-id]");u&&(f=u.dataset.factionId,p())}),document.getElementById("grant-slider")?.addEventListener("input",l=>{d=parseInt(l.target.value)||1,document.getElementById("grant-count").textContent=d;const u=document.getElementById("royal-grant");u&&(u.textContent=`Grant ${d} Seats`)}),document.getElementById("royal-grant")?.addEventListener("click",async()=>{if(!f||mt)return;mt=!0;const l=document.getElementById("royal-grant");l&&(l.disabled=!0,l.textContent="Granting...");try{const{data:u}=await k.from("factions").select("id, faction_name, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null),g=(u||[]).find(S=>S.id===i.id),y=(u||[]).find(S=>S.id===f);if(!g||!y){alert("Faction not found.");return}const _=(u||[]).reduce((S,z)=>S+Math.max(0,z.seats||0),0),x=new Map;for(const S of u||[])x.set(S.id,Math.max(0,S.seats||0));let E=d;const $=Math.max(0,(x.get(i.id)||0)-1),w=Math.min(E,$);if(w>0&&(x.set(i.id,(x.get(i.id)||0)-w),E-=w),E>0){const S=(u||[]).filter(N=>N.id!==i.id&&N.id!==f&&(x.get(N.id)||0)>0);let z=S.reduce((N,A)=>N+(x.get(A.id)||0),0);for(const N of S){if(E<=0||z<=0)break;const A=Math.round(E*(x.get(N.id)||0)/z),B=Math.min(A,x.get(N.id)||0,E);B>0&&(x.set(N.id,(x.get(N.id)||0)-B),z-=B,E-=B)}if(E>0)for(const N of S){if(E<=0)break;const A=x.get(N.id)||0,B=Math.min(E,A);B>0&&(x.set(N.id,A-B),E-=B)}}const C=d-E;if(C<=0){alert("No seats available to grant.");return}x.set(f,(x.get(f)||0)+C);let I=0;for(const S of x.values())I+=S;if(I!==_){console.error("[GrantSeats] Conservation violated",{sumBefore:_,sumAfter:I,grantAmount:d,actualGrant:C}),alert("Internal error: seat totals would not balance. Aborting.");return}const L=[];for(const S of u||[]){const z=Math.max(0,S.seats||0),N=x.get(S.id)||0;z!==N&&L.push({id:S.id,seats:N})}for(const S of L){const{error:z}=await k.from("factions").update({seats:S.seats}).eq("id",S.id);if(z){alert("Failed to grant seats: "+z.message);return}}const R=C*.5,M=Math.min(100,(Number(a.legitimacy)||50)+R),{error:F}=await k.from("nations").update({legitimacy:M}).eq("id",a.id);if(F){alert("Failed to update legitimacy.");return}i.seats=x.get(i.id)||0,a.legitimacy=M;try{const S=m.find(z=>z.id===f);await k.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} grants ${C} seats to ${S?.faction_name||"unknown"}`,category:"government",description_chosen:`The ${a.monarch_title||"King"} has granted ${C} parliamentary seat${C!==1?"s":""} to ${S?.faction_name}. Legitimacy +${R.toFixed(1)}.`,fired_at_tick:b.shard?.current_tick||0})}catch{}v(),U(e)}catch(u){console.error("[GrantSeats] Error:",u),alert("Failed to grant seats.")}finally{mt=!1}})}t.classList.add("active"),p()}async function na(e){const t=document.getElementById("pa-royal-modal");if(!t)return;const a=b.nation,i=b.faction,{data:s}=await k.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),o=(s||[]).filter(r=>r.id!==i.id&&(r.seats||0)>0);let n=null,m=1;function f(){const r=o.find(u=>u.id===n),d=r&&r.seats||0,c=m*1e5,v=i.party_funds||0;t.innerHTML=`
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
                                <input type="range" min="1" max="${d}" value="${m}" id="revoke-slider" style="flex:1;">
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
        `;const l=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",l),document.getElementById("royal-cancel")?.addEventListener("click",l),t.onclick=u=>{u.target===t&&l()},t.querySelector(".pa-modal-body")?.addEventListener("click",u=>{const g=u.target.closest("[data-faction-id]");g&&(n=g.dataset.factionId,m=1,f())}),document.getElementById("revoke-slider")?.addEventListener("input",u=>{m=parseInt(u.target.value)||1,document.getElementById("revoke-count").textContent=m;const g=document.getElementById("royal-revoke");g&&(g.textContent=`Revoke ${m} Seats`)}),document.getElementById("royal-revoke")?.addEventListener("click",async()=>{if(!n||mt)return;mt=!0;const u=document.getElementById("royal-revoke");u&&(u.disabled=!0,u.textContent="Revoking...");try{const g=m*1e5,{data:y}=await k.from("factions").select("id, faction_name, seats, party_funds").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null),_=(y||[]).find(A=>A.id===i.id),x=(y||[]).find(A=>A.id===n);if(!_||!x){alert("Faction not found.");return}const E=_.party_funds||0;if(E<g){alert("Not enough funds.");return}const $=(y||[]).reduce((A,B)=>A+Math.max(0,B.seats||0),0),w=Math.min(m,x.seats||0);if(w<=0){alert("Target has no seats to revoke.");return}const C=E-g,I=(_.seats||0)+w,L=(x.seats||0)-w,R=w,M=Math.max(0,(Number(a.legitimacy)||50)-R),F=$-(_.seats||0)-(x.seats||0)+I+L;if(F!==$){console.error("[RevokeSeats] Conservation violated",{sumBefore:$,sumAfter:F,take:w}),alert("Internal error: seat totals would not balance. Aborting.");return}const{error:S}=await k.from("factions").update({seats:I,party_funds:C}).eq("id",i.id);if(S){alert("Failed to revoke seats: "+S.message);return}const{error:z}=await k.from("factions").update({seats:L}).eq("id",n);if(z){alert("Failed to revoke seats: "+z.message);return}const{error:N}=await k.from("nations").update({legitimacy:M}).eq("id",a.id);if(N){alert("Failed to update legitimacy.");return}i.seats=I,i.party_funds=C,a.legitimacy=M,sessionStorage.removeItem("nationhood_state");try{await k.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} revokes ${w} seats from ${x.faction_name||"unknown"}`,category:"political",description_chosen:`The ${a.monarch_title||"King"} has revoked ${w} seat${w!==1?"s":""} from ${x.faction_name}. Legitimacy -${R}.`,fired_at_tick:b.shard?.current_tick||0})}catch{}l(),U(e)}catch(g){console.error("[RevokeSeats] Error:",g),alert("Failed to revoke seats.")}finally{mt=!1}})}t.classList.add("active"),f()}let Ft=!1;async function sa(e){if(Ft)return;const t=b.faction,a=t.seats||0,i=Math.max(1,t.momentum??0);if(a<=0){alert("Your party has no seats — nothing to fundraise from.");return}const s=ye(a,st);if(i-s.momCost<1){alert(`Not enough momentum. You need ${s.momCost} momentum (current: ${Math.round(i)}, floor: 1). Try again next tick when momentum recovers.`);return}Ft=!0;try{const{data:o}=await k.from("factions").select("party_funds, momentum").eq("id",t.id).single();o&&(t.party_funds=o.party_funds??0,t.momentum=o.momentum??0);const n=Math.max(1,t.momentum??0),m=b.shard?.current_tick||0,f=Math.max(1,n-s.momCost),r=(t.party_funds||0)+s.raised,{error:d}=await k.from("factions").update({momentum:f,party_funds:r}).eq("id",t.id);if(d){alert("Fundraise failed: "+d.message);return}await k.from("campaign_actions").insert({party_id:t.id,nation_id:b.nation?.id,action_type:"fundraise",ap_cost:0,money_cost:0,tick_performed:m,result:{raised:s.raised,perSeat:s.perSeat,momCost:s.momCost,useNumber:st+1,seats:a}}),t.momentum=f,t.party_funds=r,sessionStorage.removeItem("nationhood_state"),st++,U(e)}catch(o){console.error("[PartyActions] Fundraise error:",o),alert("Fundraise failed.")}finally{Ft=!1}}function ra(e){const t=document.getElementById("pa-statement-modal");if(!t)return;const a=b.faction,i=a?.color||"#c8a832",s=a?.leader_first_name&&a?.leader_last_name?`${a.leader_first_name} ${a.leader_last_name}`:"Party Leader",o=ee.map(d=>`<div class="pa-topic-card" data-topic="${d.id}" style="padding:8px 10px;cursor:pointer;border:1px solid var(--border-mid);display:flex;align-items:center;gap:8px;transition:all 0.12s;">
            <span style="font-size:14px;">${d.icon}</span>
            <span style="font-size:10px;font-weight:600;color:var(--text-secondary);">${h(d.label)}</span>
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
    `,t.classList.add("active");let n=null,m=!1;const f=()=>t.classList.remove("active");document.getElementById("pa-stmt-close")?.addEventListener("click",f),document.getElementById("pa-stmt-cancel")?.addEventListener("click",f),t.addEventListener("click",d=>{d.target===t&&f()}),document.getElementById("pa-stmt-topics")?.addEventListener("click",d=>{const p=d.target.closest(".pa-topic-card");p&&(n=p.dataset.topic,document.querySelectorAll(".pa-topic-card").forEach(c=>{const v=c.dataset.topic===n;c.style.borderColor=v?i:"var(--border-mid)",c.style.background=v?i+"0a":"";const l=c.querySelector("span:last-child");l&&(l.style.color=v?"var(--text-bright)":"var(--text-secondary)")}),r())});const r=()=>{const d=document.getElementById("pa-stmt-body")?.value?.trim()||"",p=document.getElementById("pa-stmt-submit"),c=document.getElementById("pa-stmt-charcount");c&&(c.textContent=`${d.length} characters`),p&&(p.disabled=!(n&&d.length>=10))};document.getElementById("pa-stmt-body")?.addEventListener("input",r),document.getElementById("pa-stmt-submit")?.addEventListener("click",async()=>{if(m)return;const d=document.getElementById("pa-stmt-body")?.value?.trim();if(!n||!d||d.length<10)return;m=!0;const p=document.getElementById("pa-stmt-submit");p&&(p.disabled=!0,p.textContent="Issuing...");try{const c=b.shard?.current_tick||0,l=ee.find(R=>R.id===n)?.label||n,u=2e4,{data:g}=await k.from("factions").select("party_funds").eq("id",a.id).single(),y=g?.party_funds||0;if(y<u){alert(`Not enough funds. You have $${Math.round(y/1e3)}k, need $20k.`);return}const _=y-u,{error:x}=await k.from("factions").update({party_funds:_}).eq("id",a.id);if(x){alert("Failed to deduct funds: "+x.message);return}a.party_funds=_;const $=ae[Math.floor(Math.random()*ae.length)].replace("{party_name}",a.faction_name||"Unknown Party").replace("{leader_name}",s).replace("{topic}",l),{error:w}=await k.from("campaign_actions").insert({party_id:a.id,nation_id:b.nation?.id,action_type:"issue_statement",ap_cost:1,money_cost:0,tick_performed:c,result:{topic:n,topicLabel:l,headline:$,body:d,leaderName:s}});w&&console.error("[PartyActions] Statement log failed:",w.message);const{error:C}=await k.from("valdorian_articles").insert({nation_id:b.nation?.id,event_type:"issue_statement",tier:3,section:"politics",headline:$,subheadline:l,lede:d.substring(0,200)+(d.length>200?"...":""),body_paragraphs:JSON.stringify(d.split(/\n\n+/).filter(R=>R.trim())),quotes:JSON.stringify([{posture:"assertive",text:d.substring(0,150)}]),byline_reporter:"Political Desk",topic_tags:JSON.stringify([n]),source_event_id:"statement_"+Date.now(),tick:c});C&&console.error("[PartyActions] Article creation failed:",C.message);const{error:I}=await k.from("event_log").insert({nation_id:b.nation?.id,event_name:$,category:"political",description_chosen:`${a.faction_name} issues the following statement regarding ${l}: "${d}"`,fired_at_tick:c});I&&console.warn("[Statement] event_log insert failed:",I.message);const{error:L}=await k.from("admin_timeline_events").insert({nation_id:b.nation?.id,tick:c,type:"communications",title:"Statement Issued",description:`${s} issued a public statement on ${l}: "${d.substring(0,120)}${d.length>120?"...":""}"`});L&&console.warn("[Statement] timeline insert failed:",L.message),f(),U(e)}catch(c){console.error("[PartyActions] Statement error:",c),alert("Failed to issue statement. Please try again.")}finally{m=!1,p&&(p.disabled=!1,p.textContent="Issue Statement")}})}const St=20;function la(e){const t=document.getElementById("pa-platform-modal");if(!t)return;const a=b.faction;b.nation;const i=a?.color||"#c8a832";let s=null,o=!1;const n={};for(const r of Mt)r.faction_id!==a?.id&&(n[r.platform_key]=(n[r.platform_key]||0)+1);const m=new Set(X.map(r=>r.platform_key));function f(){const r=$t.find(v=>v.id===s),d=r?Qt(n[r.id]||0):null;r&&Mt.filter(v=>v.platform_key===r.id&&v.faction_id!==a?.id);const p=$t.map(v=>{const l=s===v.id,u=m.has(v.id),g=Qt(n[v.id]||0),y=n[v.id]||0;return`<div class="pa-plat-card ${l?"selected":""} ${u?"adopted":""}" data-plat="${v.id}">
                ${u?'<div class="pa-plat-active-badge">ACTIVE</div>':""}
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <span style="font-size:14px;">${v.icon}</span>
                    <span style="font-size:10px;font-weight:700;color:${u?i:l?"var(--text-bright)":"var(--text-secondary)"};line-height:1.2;">${h(v.name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.4;margin-bottom:6px;">${h(v.tagline)}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${g.color};">${g.label}</span>
                    ${y>0?`<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 3px;color:var(--text-dim);border:1px solid var(--border-mid);">${y} rival${y>1?"s":""}</span>`:""}
                </div>
            </div>`}).join("");let c;if(!r)c=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;">
                <div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:24px;color:var(--border-mid);margin-bottom:8px;">←</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Select a platform to review</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:4px;">16 platforms available</div>
                </div>
            </div>`;else{const v=r.improve.map(_=>{const x=Xt(_,"improve");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(92,204,92,0.05);border:1px solid rgba(92,204,92,0.15);color:${x.color};white-space:nowrap;">${x.arrow} ${Jt[_]||_}</span>`}).join(""),l=r.worsen.map(_=>{const x=Xt(_,"worsen");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(204,85,85,0.05);border:1px solid rgba(204,85,85,0.15);color:${x.color};white-space:nowrap;">${x.arrow} ${Jt[_]||_}</span>`}).join(""),u=m.has(r.id),g=X.length;let y;u?y=`<div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${i};display:flex;align-items:center;gap:6px;">✓ CURRENT PLATFORM</div>`:g>=3?y='<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">All 3 platform slots are full.</div>':o?y=`<div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:#ca5;font-weight:700;">⚠ Confirm: Adopt ${h(r.name)}?</span>
                    <div style="display:flex;gap:6px;">
                        <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-plat-conf-cancel">Cancel</button>
                        <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-conf-yes">Confirm</button>
                    </div>
                </div>`:y=`<div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
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
                                <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${d.color};">${d.label}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);">${h(d.note)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="flex:1;padding:12px 20px;overflow-y:auto;">
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.1em;color:var(--green);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--green);display:inline-block;"></span>
                            PROMISES TO IMPROVE <span style="font-weight:400;color:var(--text-dim);">(${r.improve.length} stats, +${St} target)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${v}</div>
                    </div>
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.1em;color:var(--red);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--red);display:inline-block;"></span>
                            LIKELY SIDE EFFECTS <span style="font-weight:400;color:var(--text-dim);">(${r.worsen.length} stats)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${l}</div>
                    </div>
                    <div style="padding:10px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.15);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#ca5;letter-spacing:0.06em;margin-bottom:4px;">⚠ TRADEOFF</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.5;">${h(r.tradeoff)}</div>
                    </div>
                    <div style="margin-top:12px;padding:8px 12px;background:var(--bg-card);border:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">PROMISE RULES</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">
                            Stats are locked at current values when adopted. If your party enters government, you have <strong style="color:var(--text-bright);">24 ticks</strong> to move each promised stat by <strong style="color:var(--text-bright);">+${St}</strong>. Failure: <strong style="color:var(--red);">-20 Momentum, -10 Governance</strong>. If you don't enter government, the promise abates.
                        </div>
                    </div>
                </div>
                <div style="padding:12px 20px;border-top:1px solid var(--border-main);background:var(--bg-card);display:flex;align-items:center;">
                    ${y}
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
        `,document.getElementById("pa-plat-close")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=v=>{v.target===t&&t.classList.remove("active")},document.getElementById("pa-plat-grid")?.addEventListener("click",v=>{const l=v.target.closest(".pa-plat-card");l&&(s=l.dataset.plat,o=!1,f())}),document.getElementById("pa-plat-adopt")?.addEventListener("click",()=>{o=!0,f()}),document.getElementById("pa-plat-conf-cancel")?.addEventListener("click",()=>{o=!1,f()}),document.getElementById("pa-plat-conf-yes")?.addEventListener("click",()=>da(e,s))}t.classList.add("active"),f()}let Et=!1;async function da(e,t){if(Et)return;Et=!0;const a=document.getElementById("pa-platform-modal"),i=b.faction,s=b.nation;if(!i||!s||!t){Et=!1;return}const o=$t.find(r=>r.id===t);if(!o)return;const n={},m={},f=r=>Yt.has(r);for(const r of o.improve){const d=Number(s[r]??50);n[r]=d,f(r)?m[r]=Math.max(0,d-St):m[r]=Math.min(100,d+St)}try{const r=b.shard?.current_tick||0,{data:d,error:p}=await k.rpc("adopt_platform",{p_faction_id:i.id,p_nation_id:s.id,p_platform_key:t,p_tick:r,p_baseline_stats:n,p_target_stats:m});if(p){console.error("[PartyActions] Platform adoption failed:",p.message),alert("Failed to adopt platform: "+p.message);return}if(d&&!d.success){alert(d.error||"Failed to adopt platform.");return}const c=d?.slot||X.length+1;X.push({faction_id:i.id,nation_id:s.id,platform_key:t,slot:c,adopted_at_tick:r,baseline_stats:n,target_stats:m,status:"active"}),Mt.push(X[X.length-1]),i&&d?.momentum_gained&&(i.momentum=(i.momentum||0)+d.momentum_gained),i&&(i.action_points=Math.max(0,(i.action_points||0)-2)),a?.classList.remove("active"),U(e)}catch(r){console.error("[PartyActions] Platform adoption error:",r),alert("An error occurred. Please try again.")}finally{Et=!1}}let ut=null,_e={isOpposition:!0,administration:null,governanceScore:0,governanceDeltas:[],governanceMultiplier:1,governanceDecayCycles:0,ticksInPower:0,myFaction:null,allParties:[],rivalParties:[],factionIdeology:{},electoralStandings:[],recentActivity:[],caucuses:[],nextElection:null,nextElectionTicks:null,ideologyAxes:[]};function H(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}const ca=[...Me,...Se];function pa(e,t,a,i){const s=i-(a||i);if(!t)return{score:0,deltas:[],decayCycles:0,multiplier:1,ticksInPower:s};let o=0,n=0;const m=[];for(const p of ca){const c=Le(p);if(c===0)continue;const v=Number(t[p]??0),l=Number(e[p]??0),u=l-v;if(u===0)continue;const g=u*c,y=g>0;m.push({key:p,start:v,now:l,delta:u,signed:g,dir:c,isGood:y}),o+=g,n++}let f=n>0?o/n:0;const r=Math.floor(s/24),d=f>0?Math.pow(.97,r):1;return f*=d,{score:Math.round(f*10)/10,deltas:m,decayCycles:r,multiplier:d,ticksInPower:s}}function ma(e,t,a){return Ie.map(i=>{const s=t[e],n=((s?Number(s[i.key]??0):0)+100)/200,m=a.map(f=>{const r=t[f.id],d=r?Number(r[i.key]??0):0;return{id:f.id,pos:(d+100)/200,color:f.party_color||"#666"}});return{key:i.key,name:`${i.leftLabel} / ${i.rightLabel}`,left:i.leftLabel.toUpperCase(),right:i.rightLabel.toUpperCase(),leftColor:i.leftColor,rightColor:i.rightColor,yourPos:n,parties:m}})}async function fa(e,t,a){ut=t;const i=document.getElementById(a);if(!i)return;const s=t.faction,o=t.nation,n=o?.id,m=s?.id;if(!s||!n){i.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">No faction data.</div>';return}i.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Loading party overview...</div>';try{const f=t.shard?.current_tick||0,[r,d,p,c,v,l,u]=await Promise.all([fe(e,n,m),e.from("factions").select("*").eq("nation_id",n).eq("faction_type","party"),e.from("faction_ideology").select("*"),e.from("faction_electoral_standing").select("*").eq("nation_id",n),e.from("campaign_actions").select("*").eq("party_id",m).order("tick_performed",{ascending:!1}).limit(20),e.from("caucus_factions").select("*").eq("party_id",m).eq("is_active",!0),e.from("elections").select("*").eq("nation_id",n).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(5)]);d.error&&console.error("[PartyOverview] Parties fetch error:",d.error.message),p.error&&console.error("[PartyOverview] Ideology fetch error:",p.error.message),c.error&&console.error("[PartyOverview] Standings fetch error:",c.error.message),v.error&&console.error("[PartyOverview] Activity fetch error:",v.error.message),l.error&&console.error("[PartyOverview] Caucus fetch error:",l.error.message),u.error&&console.error("[PartyOverview] Election fetch error:",u.error.message);const g=d.data||[],y=r.administration,_={};for(const L of p.data||[])_[L.faction_id]=L;let x={score:0,deltas:[],decayCycles:0,multiplier:1,ticksInPower:0};y&&y.stats_at_start&&(x=pa(o,y.stats_at_start,y.started_at_tick,f));const E=u.data||[],$=E[0]||null,w=$?Math.max(0,$.election_tick-f):null;let C=null;$&&o&&(o.government_type?.toLowerCase().includes("presidential")||o.hos_election_method==="direct_vote")&&(C=E.some(M=>M.election_type==="presidential"&&M.election_tick===$.election_tick)?"General":"Midterm");const I=ma(m,_,g);_e={isOpposition:r.isOpposition,administration:y,governanceScore:x.score,governanceDeltas:x.deltas.sort((L,R)=>Math.abs(R.signed)-Math.abs(L.signed)),governanceMultiplier:x.multiplier,governanceDecayCycles:x.decayCycles,ticksInPower:x.ticksInPower,myFaction:s,allParties:g,rivalParties:g.filter(L=>L.id!==m),factionIdeology:_,electoralStandings:c.data||[],recentActivity:v.data||[],caucuses:l.data||[],nextElection:$,nextElectionTicks:w,nextElectionLabel:C,ideologyAxes:I},$e(i)}catch(f){console.error("[PartyOverview] Init error:",f),i.innerHTML='<div style="padding:40px;text-align:center;color:var(--red);font-family:var(--font-mono);font-size:10px;">Failed to load party overview.</div>'}}let Z=[];function $e(e){const t=_e,a=t.myFaction,i=ut.nation,s=a?.party_color||a?.color||"#c8a832";ut.shard?.current_tick,Z.length===0&&(Z=[a?.id,...t.rivalParties.map(d=>d.id)]),t.administration?.admin_name||t.isOpposition;const o=t.isOpposition?"OPPOSITION":"GOVERNING",n=t.isOpposition?"var(--orange)":"var(--green)",m=a?.seats||0,f=i?.total_seats||100,r=a?.momentum??50;e.innerHTML=`<div class="po-page">
        ${va(t,s,m,f,r)}
        <div class="po-columns">
            <div class="po-col-left">
                ${ua(t,a,s,o,n)}
                ${ga(t)}
                ${ya(t,a,s)}
                ${xa(t)}
            </div>
            <div class="po-col-center" id="po-center-col">
                ${ba(t,r)}
                ${ha(t)}
            </div>
            <div class="po-col-right" id="po-right-col">
                ${_a(t,a)}
                ${$a(t)}
                ${wa()}
            </div>
        </div>
    </div>`,e.querySelectorAll(".po-legend-item").forEach(d=>{d.addEventListener("click",()=>{const p=d.dataset.partyId;p!==a?.id&&(Z.includes(p)?Z=Z.filter(c=>c!==p):Z.push(p),$e(e))})})}function va(e,t,a,i,s){const o=e.governanceScore,n=o>=0?"var(--green)":"var(--red)",m=e.isOpposition?"Opposition":e.administration?.admin_name||"Government",f=(ut.nation?.government_type||"").toLowerCase().includes("monarchy"),r=f?"No elections":e.nextElectionTicks!=null?e.nextElectionTicks:"—",d=f?"var(--text-dim)":typeof r=="number"&&r<=3?"var(--red)":"var(--text-bright)",p=f?"NEXT ELECTION":e.nextElectionLabel?"NEXT "+e.nextElectionLabel.toUpperCase():"NEXT ELECTION";return`<div class="po-summary">
        <div class="po-summary-cell" style="display:flex;flex-direction:row;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;background:${t};"></div>
            <div>
                <div style="font-size:11px;font-weight:700;color:var(--text-bright);">${H(m)}</div>
                <div class="po-summary-sub">${e.ticksInPower} ticks in power</div>
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
                <span class="po-summary-value" style="color:${t};">${a}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/ ${i}</span>
            </div>
        </div>
        <div class="po-summary-cell" style="text-align:center;">
            <div class="po-summary-label">${p}</div>
            <div class="po-summary-value" style="color:${d};">${r}${typeof r=="number"?" ticks":""}</div>
        </div>
    </div>`}function ua(e,t,a,i,s){const o=t?.leader_first_name&&t?.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown",n=((t?.leader_first_name||"?")[0]+(t?.leader_last_name||"?")[0]).toUpperCase();t?.leader_age&&`${t.leader_age}`;const m=t?.approval_rating??0;return`<div class="po-card po-identity" style="border-left-color:${a};">
        <div class="po-identity-inner">
            <div class="po-identity-logo" style="color:${a};background:${a}12;border-color:${a}33;">${n}</div>
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                    <span class="po-identity-name">${H(t?.faction_name)}</span>
                    <span class="po-identity-badge" style="color:${s};background:${s}0a;border-color:${s}44;">${i}</span>
                </div>
                <div class="po-identity-meta">${e.ticksInPower} ticks in power</div>
                <div class="po-leader-row">
                    <div class="po-leader-avatar" style="color:${a};background:${a}15;border-color:${a}33;">${n}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-size:10px;font-weight:600;color:var(--text-bright);">${H(o)}</span>
                            <span style="font-family:var(--font-mono);font-size:7px;color:${a};">PARTY LEADER</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">APPROVAL</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--amber);">${m}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`}function ga(e){const t=e.governanceDeltas.slice(0,12),a=e.governanceScore,i=a>=0?"var(--green)":"var(--red)",s=e.governanceDecayCycles>0&&a>0?`Decay: ${((1-e.governanceMultiplier)*100).toFixed(1)}% (${e.governanceDecayCycles} cycles)`:"",o=t.map((n,m)=>{const f=n.isGood?"var(--green)":"var(--red)",r=n.delta>0?"+":"",d=n.key.replace(/_/g," ").replace(/\b\w/g,p=>p.toUpperCase());return`<div class="po-gov-row" style="${m<t.length-1?"border-bottom:1px solid rgba(200,196,184,0.03);":""}">
            <span class="po-gov-stat">${H(d)}</span>
            <span class="po-gov-val">${n.start.toFixed(1)}</span>
            <span class="po-gov-val">${n.now.toFixed(1)}</span>
            <span class="po-gov-delta" style="color:${f};">${r}${n.delta.toFixed(1)}</span>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <div style="display:flex;align-items:center;gap:6px;">
                <span class="po-card-title">GOVERNANCE</span>
                <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${i};">${a}</span>
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
    </div>`}function ya(e,t,a){const s=[{id:t?.id,name:"You",color:a},...e.rivalParties.map(n=>({id:n.id,name:n.abbreviation||n.faction_name?.slice(0,3)||"?",color:n.party_color||"#666"}))].map(n=>{const m=Z.includes(n.id);return`<div class="po-legend-item ${m?"active":"inactive"}" data-party-id="${n.id}" style="${m?`background:${n.color}12;border-color:${n.color}44;`:""}">
            <div class="po-legend-dot" style="background:${m?n.color:"var(--text-dim)"};"></div>
            <span class="po-legend-name">${H(n.name)}</span>
        </div>`}).join(""),o=e.ideologyAxes.map(n=>{const m=n.parties.filter(r=>Z.includes(r.id)).map(r=>`<div class="po-axis-dot" style="left:${r.pos*100}%;background:${r.color};"></div>`).join(""),f=[20,40,60,80].map(r=>`<div class="po-axis-zone" style="left:${r}%;"></div>`).join("");return`<div class="po-axis">
            <div class="po-axis-labels">
                <span class="po-axis-label">${H(n.left)}</span>
                <span class="po-axis-name">${H(n.name)}</span>
                <span class="po-axis-label">${H(n.right)}</span>
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
    </div>`}function xa(e){const t=(e.caucuses||[]).filter(s=>s.name&&s.name!=="Unnamed");if(t.length===0)return`<div class="po-card">
            <div class="po-card-header">
                <span class="po-card-title">INTERNAL CAUCUSES</span>
                <span class="po-card-subtitle">None</span>
            </div>
        </div>`;const a=e.faction?.seats||0,i=t.map(s=>{const o=s.relationship_score??50,n=o>60?"var(--green)":o>40?"var(--amber)":"var(--red)",m=Math.round((s.seat_share||0)*a),f=(s.dominant_axis||"").replace(/_/g,"/"),r=s.wing_end==="left"?f.split("/")[0]:f.split("/")[1]||"";return`<div class="po-caucus-row">
            <div>
                <div class="po-caucus-name">${H(s.name)}</div>
                <div class="po-caucus-wing" style="color:var(--text-dim);">${H(r)}</div>
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
            <span class="po-card-subtitle">${t.length} active · ${a} seats</span>
        </div>
        ${i}
    </div>`}function ba(e,t){const i=Math.round(t*8/100*10)/10,s=Math.min(100,Math.max(0,t)),o=t>=60?"var(--green)":t>=30?"var(--orange)":"var(--red)";return`<div class="po-card">
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
    </div>`}function ha(e){const t=e.recentActivity||[],a=ut.shard?.current_tick||0;if(t.length===0)return`<div class="po-card" style="flex:1;">
            <div class="po-card-header">
                <span class="po-card-title">RECENT ACTIVITY</span>
            </div>
            <div style="padding:24px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No recent actions.</div>
        </div>`;const i={rally:"Rally",press_conference:"Press Conference",attack:"Attack Ad",issue_statement:"Statement",ideological_pivot:"Ideology Shift",take_stance:"Took Stance",poll_now:"Polled",endorse:"Endorsement",lobby:"Lobby"};return`<div class="po-card" style="flex:1;">
        <div class="po-card-header">
            <span class="po-card-title">RECENT ACTIVITY</span>
        </div>
        <div style="max-height:380px;overflow-y:auto;">${t.map(o=>{const n=a-(o.tick_performed||0),m=n===0?"0t":n+"t",f=o.result||{},r=f.momentumDelta||f.momentum_delta||(f.effects||[]).reduce((l,u)=>l+(u.stat==="Momentum"?u.value:0),0)||0,d=r>0?"+":"",p=r>0?"var(--green)":r<0?"var(--red)":"var(--text-dim)";let v=i[o.action_type]||o.action_type?.replace(/_/g," ")||"?";return o.action_type==="rally"?v="Rally: "+(f.outcomeName||"Unknown")+(r?" ("+d+r+")":""):o.action_type==="press_conference"?v="Press Conference ("+d+r+")":o.action_type==="attack"?v="Attack on "+(f.targetName||"rival"):o.action_type==="issue_statement"?v="Issued statement"+(r?" ("+d+r+")":""):o.action_type==="take_stance"?v="Took stance on "+(f.issueLabel||"issue"):o.action_type==="ideological_pivot"?v="Ideology shift: "+(f.targetAxis||""):o.action_type==="poll_now"&&(v="Polled (margin: "+(f.pollMargin||"?")+")"),`<div style="padding:5px 12px;border-bottom:1px solid rgba(200,196,184,0.03);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:9px;color:var(--text-secondary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:8px;">${H(v)}</span>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${p};">${r!==0?d+r:"—"}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);width:20px;text-align:right;">${m}</span>
            </div>
        </div>`}).join("")}</div>
    </div>`}function _a(e,t){const a=e.rivalParties,i=e.administration,s=new Set((Array.isArray(i?.coalition_parties)?i.coalition_parties:[]).map(d=>d?typeof d=="string"?d:typeof d=="object"&&(d.party_id||d.id)||null:null).filter(Boolean)),o=i?.pm_party_id,n=ut.nation?.total_seats||100,m=["SEC/FRE","TRA/PRO","IND/COL","LIB/EQL","GLB/NAT"],f=["security_freedom","tradition_progress","individualism_collectivism","liberty_equality","globalism_nationalism"],r=a.map(d=>{const p=d.party_color||"#666",c=d.abbreviation||d.faction_name?.slice(0,3)?.toUpperCase()||"?",v=d.leader_first_name&&d.leader_last_name?`${d.leader_first_name} ${d.leader_last_name}`:"Unknown",l=d.seats||0,u=d.id===o,g=s.has(d.id);let y,_;u?(y="GOVERNING — LEAD",_="var(--green)"):g?(y="GOVERNING — JUNIOR",_="var(--green)"):(y="OPPOSITION",_="var(--orange)");const x=l-(t?.seats||0),E=x>0?"var(--green)":x<0?"var(--red)":"var(--text-dim)",$=e.factionIdeology[d.id],w=f.map((C,I)=>{const R=(($?Number($[C]??0):0)+100)/200;return`<div style="display:flex;align-items:center;gap:6px;">
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);width:42px;text-align:right;">${m[I]}</span>
                <div style="flex:1;height:5px;background:var(--border-main);position:relative;">
                    <div style="position:absolute;top:50%;left:${R*100}%;transform:translate(-50%,-50%);width:8px;height:8px;border-radius:50%;background:${p};"></div>
                </div>
            </div>`}).join("");return`<div style="padding:12px 16px;border-bottom:1px solid var(--border-main);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:36px;height:36px;background:${p}15;border:1px solid ${p}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${p};">${H(c)}</div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:var(--text-bright);">${H(d.faction_name)}</div>
                        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${H(v)}</div>
                    </div>
                </div>
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 7px;color:${_};background:${_}0a;border:1px solid ${_}44;white-space:nowrap;">${y}</span>
            </div>
            <div style="display:flex;gap:10px;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">SEATS</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${l>0?"var(--text-bright)":"var(--text-dim)"};">${l}</span>
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">/ ${n}</span>
                </div>
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">VS YOU</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${E};">${x>0?"+":""}${x}</span>
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:3px;">${w}</div>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">RIVAL PARTIES</span>
            <span class="po-card-subtitle">${a.length} parties</span>
        </div>
        ${r||'<div style="padding:16px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No rival parties.</div>'}
    </div>`}function $a(e){return`<div class="po-card" style="padding:8px 12px;">
        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;letter-spacing:0.06em;color:var(--text-dim);margin-bottom:4px;">ELECTION FORMULA</div>
        <div style="display:flex;gap:6px;">
            <div style="flex:1;padding:6px 8px;text-align:center;background:var(--bg-card);border:1px solid var(--border-main);">
                <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${e.governanceScore>=0?"var(--green)":"var(--red)"};">40%</div>
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
    </div>`}function wa(){return`<div style="background:var(--bg-card);border:1px solid var(--border-main);padding:8px 12px;">
        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.6;">
            <span style="color:var(--amber);font-weight:700;">⚠ INCUMBENCY DECAY:</span> Positive governance scores erode 3% every 24 ticks. Long-serving governments must keep delivering results.
            <span style="color:var(--text-bright);font-weight:700;"> Momentum resets to 0</span> after every election. Rebuild each cycle.
        </div>
    </div>`}let T=null,P=null,nt=!1,gt=null,j=[],rt=[],J=0,Q=0,Lt=null,et=0,ft=[],Rt=!1,xt=null,G={},Ot=!1;function ht(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}const ka=6,Ea=4;async function we(e,t){T=e,P=t;const a=t.nation,i=t.faction;if(!a||!i)return{needed:!1};const[s,o,n,m,f]=await Promise.all([e.from("elections").select("id, election_type, election_tick, status").eq("nation_id",a.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),e.from("shard").select("current_tick").eq("name","Alpha Shard").single(),e.from("government_formations").select("id, status, election_id, formed_at, formed_tick, created_at, created_tick").eq("nation_id",a.id).in("status",["formed","active"]).order("formed_at",{ascending:!1,nullsFirst:!1}).limit(1).maybeSingle(),e.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),e.from("head_of_government").select("id").eq("nation_id",a.id).eq("active",!0).limit(1).maybeSingle()]);et=o.data?.current_tick??0,j=m.data||[],J=j.reduce((u,g)=>u+(g.seats||0),0),Q=Math.ceil(J/2)+1;const r=s.data,d=n.data||null,p=!!f.data,c=(()=>{if(!d)return!1;if(!r||d.election_id&&d.election_id===r.id)return!0;const u=[d.formed_tick,d.created_tick].map(g=>Number(g)).filter(g=>Number.isFinite(g));return u.length>0&&Number.isFinite(r.election_tick)?Math.max(...u)>=r.election_tick:!1})(),v=c||p;if((a.government_type||"").toLowerCase().includes("presidential")||a.hos_election_method==="direct_vote"){if(nt=!1,r&&!c)try{const u=o.data?.current_tick??0,{data:g}=await e.from("presidents").select("faction_id").eq("nation_id",a.id).eq("is_active",!0).maybeSingle(),y=g?.faction_id||j[0]?.id;if(y){const _=(a.government_type||"").toLowerCase().includes("semi");await e.from("government_formations").insert({nation_id:a.id,proposed_by:y,status:"formed",party_ids:[y],formation_type:"coalition",formed_at:new Date().toISOString()}),await e.from("ministries").delete().eq("nation_id",a.id).eq("is_active",!0);const x=[["interior","Minister of the Interior"],["foreign","Minister of Foreign Affairs"],["defense","Minister of Defense"],["finance","Minister of Finance"],["education","Minister of Education"],["healthcare","Minister of Health"],["labor","Minister of Labor"],["justice","Minister of Justice"],["trade","Minister of Trade"],["energy","Minister of Energy"],["transportation","Minister of Transportation"]];_&&x.unshift(["prime_minister","Prime Minister"]);const E=x.map(([$,w])=>({nation_id:a.id,ministry_key:$,ministry_name:w,party_id:_?null:y,is_active:!0}));await e.from("ministries").insert(E),_&&await e.from("head_of_government").delete().eq("nation_id",a.id)}}catch(u){console.warn("[Coalition] Presidential auto-gov failed:",u.message)}return{needed:!1}}return r&&!v?(nt=!0,gt=r.id,Lt=r.election_tick):(nt=!v,r&&(gt=r.id,Lt=r.election_tick)),{needed:nt}}async function ct(e){if(!e)return;const t=P.nation?.id,a=(P.nation?.government_type||"").toLowerCase().includes("semi");if(t&&!a){const{count:$}=await T.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",t).eq("is_active",!0).is("party_id",null);if($&&$>=5){const{data:w}=await T.from("government_formations").select("*").eq("nation_id",t).not("ministry_assignments","eq","{}").order("created_at",{ascending:!1}).limit(1).maybeSingle();if(w&&w.ministry_assignments&&Object.keys(w.ministry_assignments).length>=5){w.status!=="formed"&&(await T.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",w.id),await T.from("government_formations").update({status:"cancelled"}).eq("nation_id",t).eq("status","active").neq("id",w.id)),G=w.ministry_assignments,await Wt(t);const C=w.ministry_assignments.prime_minister;if(C)try{await pe(T,t,C,et,{skipCoalitionCheck:!0})}catch(I){console.warn("[Coalition] PM appointment during repair failed:",I.message)}nt=!1,e.innerHTML=`<div class="cf-page">
                    <div class="cf-no-formation">
                        <div class="cf-no-icon">✓</div>
                        <div class="cf-no-title">Government Formed — Cabinet Populated</div>
                        <div class="cf-no-desc">Ministry assignments have been applied. Refresh the Government page to see your cabinet.</div>
                    </div>
                </div>`;return}}}if((P.nation?.government_type||"").toLowerCase().includes("presidential")||P.nation?.hos_election_method==="direct_vote"){const $=(P.nation?.government_type||"").toLowerCase().includes("semi");e.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#127979;</div>
                <div class="cf-no-title">${$?"Semi-Presidential System":"Presidential System"}</div>
                <div class="cf-no-desc">${$?"The President nominates a Prime Minister for parliamentary confirmation. The PM then appoints cabinet ministers. No coalition formation is required.":"The President governs directly and nominates cabinet ministers. No coalition formation is required."}</div>
            </div>
        </div>`;return}const s=(P.nation?.government_type||"").toLowerCase();if(s.includes("absolute")&&s.includes("monarchy")){e.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#128081;</div>
                <div class="cf-no-title">Absolute Monarchy</div>
                <div class="cf-no-desc">The Crown rules by decree. There are no elections.</div>
            </div>
        </div>`;return}if(!nt){e.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">✓</div>
                <div class="cf-no-title">Government Formed</div>
                <div class="cf-no-desc">A coalition government is currently active. No formation needed.</div>
            </div>
        </div>`;return}if(!gt){const $=P.nation?.id;let w="?";if($){const{data:C}=await T.from("elections").select("election_tick").eq("nation_id",$).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(1).maybeSingle();C&&(w=Math.max(0,C.election_tick-et))}e.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon" style="font-size:2rem;">&#9878;</div>
                <div class="cf-no-title">No Government</div>
                <div class="cf-no-desc">No election has been held yet. The first election is in <strong style="color:var(--accent);">${w}</strong> tick${w!==1?"s":""}.</div>
            </div>
        </div>`;return}await za();const o=P.faction,m=(P.nation?.failed_formation_attempts||0)>=1?Ea:ka,f=Lt!==null?Math.max(0,et-Lt):0,r=Math.max(0,m-f),d=Math.min(100,f/m*100),p=f*2;let c="safe";r<=1?c="critical":r<=2&&(c="warning");const v=c==="critical"?"⚠️":c==="warning"?"⏳":"🤝",l=c==="critical"?"No Government — Snap Election Imminent":c==="warning"?"Coalition Formation — Time Running Out":"Coalition Formation In Progress",u=c==="critical"?"Form a government immediately or face snap elections":c==="warning"?"Parties are negotiating — the deadline is approaching":"Parties are negotiating a coalition — propose or join one below",g=j.find($=>$.id===o.id)?.seats||0,y=g>0,_=rt.some($=>$.proposed_by===o.id);let x="";if(!y)x='<div class="cf-note">Your party has <strong>0 seats</strong>. You cannot propose a coalition, but you may be invited to one.</div>';else if(_)x='<div class="cf-note">You have already submitted a proposal for this election.</div>';else{const $=j.map(w=>{const C=w.id===o.id,I=w.seats||0,L=w.party_color||"#888";return`<div class="cf-party-check ${C?"checked disabled":""}" data-party-id="${w.id}" style="border-left:3px solid ${L};">
                <div class="cf-check-box">${C?"✓":""}</div>
                <span class="cf-check-name">${ht(w.faction_name)}</span>
                <span class="cf-check-seats">${I} seats</span>
            </div>`}).join("");x=`
            <div class="cf-propose-section">
                <div class="cf-section-title">Propose a Government</div>
                <div class="cf-section-desc">Select which parties will form the coalition. You need ${Q}+ seats for a majority.</div>
                <div class="cf-party-grid" id="cf-party-grid">${$}</div>
                <div class="cf-seat-preview" id="cf-seat-preview">
                    Coalition seats: <span class="cf-preview-val" id="cf-preview-seats">${g}</span> / ${J}
                    (<span id="cf-preview-pct">${J?Math.round(g/J*100):0}</span>%)
                    <span id="cf-preview-threshold" style="margin-left:8px;color:var(--text-dim);">— needs ${Q} seats</span>
                </div>
                <button class="cf-submit-btn" id="cf-propose-btn">Submit Proposal</button>
            </div>`}const E=rt.length>0?`
        <div class="cf-section-title" style="margin-top:16px;">Active Proposals</div>
        <div class="cf-proposals-grid">${rt.map($=>{const w=j.find(at=>at.id===$.proposed_by),C=$.party_ids||[],I=C.reduce((at,it)=>at+(j.find(q=>q.id===it)?.seats||0),0),L=J?Math.round(I/J*100):0,R=I>=Q,M=C.map(at=>{const it=j.find(q=>q.id===at);return`<span class="cf-party-chip" style="border-left:2px solid ${it?.party_color||"#888"};">${ht(it?.faction_name||"?")} · ${it?.seats||0}</span>`}).join("");let F="";$.iAmSupporting?F='<span class="cf-status cf-status--supporting">✓ SUPPORTING</span>':$.iAmInvited?F='<span class="cf-status cf-status--invited">INVITED</span>':F='<span class="cf-status cf-status--locked">NOT INVITED</span>';const S=$.iAmInvited&&!$.iAmSupporting?`<button class="cf-support-btn" data-formation-id="${$.id}" data-action="support">Support This Coalition</button>`:$.iAmSupporting?`<button class="cf-withdraw-btn" data-formation-id="${$.id}" data-action="withdraw">Withdraw Support</button>`:"",z=$.supportCount>=$.coalitionSize,N=xt===$.id,A=z&&$.iAmInvited&&!N,B=z&&N;return`<div class="cf-proposal-card ${$.iAmSupporting?"supporting":""} ${$.iAmInvited?"":"not-invited"}">
                <div class="cf-proposal-title">${ht(w?.faction_name||"Unknown")} Coalition ${F}</div>
                <div class="cf-proposal-seats">Seats: <span style="color:${R?"var(--green)":"var(--red)"};">${I}</span> (${L}%) ${R?"✓":"— below threshold"}</div>
                <div class="cf-proposal-chips">${M}</div>
                <div class="cf-proposal-support">Support: ${$.supportCount} / ${$.coalitionSize} coalition members ${z?'<span style="color:var(--green);font-weight:700;"> — UNANIMOUS</span>':""}</div>
                ${S}
                ${A?`<button class="cf-support-btn" data-formation-id="${$.id}" data-action="configure" style="margin-top:6px;background:var(--green);color:#000;border-color:var(--green);">Configure Government &amp; Assign Ministries</button>`:""}
                ${B?Sa($):""}
            </div>`}).join("")}</div>
    `:"";e.innerHTML=`<div class="cf-page">
        <!-- Formation Banner -->
        <div class="cf-banner cf-banner--${c}">
            <div class="cf-banner-header">
                <span class="cf-banner-icon">${v}</span>
                <div>
                    <div class="cf-banner-title">${l}</div>
                    <div class="cf-banner-subtitle">${u}</div>
                </div>
            </div>
            <div class="cf-countdown">
                <div class="cf-countdown-track"><div class="cf-countdown-fill cf-countdown-fill--${c}" style="width:${d}%;"></div></div>
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

        ${x}
        ${E}
    </div>`,ft=[o.id],Ta(e)}const Ca={prime_minister:"Prime Minister",interior:"Interior",foreign:"Foreign Affairs",defense:"Defense",finance:"Finance",education:"Education",healthcare:"Healthcare",labor:"Labor",justice:"Justice",trade:"Trade",energy:"Energy",transportation:"Transportation",security:"Security"},Ia=["prime_minister","interior","foreign","defense","finance","education","healthcare","labor","justice","trade","energy","transportation"];function Ma(e){const t=(e?.government_type||"").toLowerCase(),a=t.includes("presidential")||e?.hos_election_method==="direct_vote",i=t.includes("semi"),s=["prime_minister","interior","foreign","defense","finance","education","healthcare","labor","justice","trade","energy","transportation"],o=["interior","foreign","defense","finance","education","healthcare","labor","justice","trade","energy","transportation"];return i?s:a?o:s}function Sa(e){const t=(e.party_ids||[]).map(r=>j.find(d=>d.id===r)).filter(Boolean),a=(e.party_ids||[]).includes(P.faction?.id);G={...e.ministry_assignments||{}};const s=P.faction?.id,o=G.prime_minister,n=o===s;let m=`<div style="padding:12px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--accent);margin-bottom:10px;">CONFIGURE GOVERNMENT</div>
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:12px;">All coalition members can assign ministries. The party selected as Prime Minister clicks Form Government.</div>`;for(const r of Ia){const d=Ca[r]||r,p=r==="prime_minister",c=G[r];a&&(m+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="width:140px;font-family:var(--font-mono);font-size:10px;font-weight:${p?"700":"400"};color:${p?"var(--accent)":"var(--text-secondary)"};letter-spacing:0.5px;">${d}</span>
                <select data-ministry="${r}" class="cf-ministry-select" style="flex:1;padding:4px 8px;font-family:var(--font-mono);font-size:10px;color:var(--text-bright);background:var(--bg-body);border:1px solid var(--border-main);outline:none;">
                    <option value="">— Select Party —</option>
                    ${t.map(v=>`<option value="${v.id}" ${c===v.id?"selected":""}>${ht(v.faction_name)} (${v.seats||0} seats)</option>`).join("")}
                </select>
            </div>`)}const f=!!G.prime_minister;if(f&&n)m+=`<div style="margin-top:14px;display:flex;justify-content:flex-end;">
            <button id="cf-form-gov-btn" style="padding:10px 28px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1.5px;color:#000;background:var(--green);border:1px solid var(--green);cursor:pointer;">FORM GOVERNMENT</button>
        </div>`;else if(f&&!n){const r=t.find(d=>d.id===o);m+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(92,204,92,0.04);border:1px solid rgba(92,204,92,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Waiting for <span style="color:var(--green);font-weight:700;">${ht(r?.faction_name||"PM party")}</span> to click Form Government.
        </div>`}else m+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Select a Prime Minister to enable government formation.
        </div>`;return m+="</div>",m}async function La(e,t){if(Ot)return;const a=G.prime_minister;if(!a){alert("You must assign a Prime Minister first.");return}console.log("[Coalition] handleFormGovernment called. Assignments:",JSON.stringify(G)),console.log("[Coalition] Formation:",e.id,"PM party:",a),Ot=!0;const i=document.getElementById("cf-form-gov-btn");i&&(i.disabled=!0,i.textContent="FORMING...");try{const s=P.nation,o=s.id,{error:n}=await T.from("government_formations").update({ministry_assignments:G}).eq("id",e.id);if(n)throw new Error("Failed to save assignments: "+n.message);let m=!1;try{const l=Ct?Ct(null,s):{},{error:u}=await T.rpc("finalize_government_formation",{p_formation_id:e.id,p_caller_faction_id:P.faction.id,p_ministry_baselines:l||{}});if(u)throw u;m=!0}catch(l){console.warn("[Coalition] RPC failed, using fallback:",l.message)}m||await Aa(e),await T.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",e.id);const r=Ma(s).length,{count:d}=await T.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",o).eq("is_active",!0),{count:p}=await T.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",o).eq("is_active",!0).is("party_id",null);(!d||d<r||p&&p>0)&&(console.warn(`[Coalition] Ministry invariant check failed (expected=${r}, active=${d||0}, vacant=${p||0}) — populating from assignments`),await Wt(o));const{data:c,error:v}=await T.from("administrations").select("id").eq("nation_id",o).is("ended_at_tick",null).limit(1).maybeSingle();if(v)console.warn("[Coalition] Failed to verify active administration:",v.message);else if(!c)try{const l={id:e.id,party_ids:e.party_ids||[],lead_party_id:G.prime_minister};await me(T,o,P.nation,"election",l,j,et,P.shard?.current_date||"",Number(P.nation?.gov_approval??50))}catch(l){console.warn("[Coalition] Post-finalization administration rollover failed (non-fatal):",l.message)}await pe(T,o,a,et,{skipCoalitionCheck:!0}),nt=!1,alert("Government formed successfully!"),await ct(t)}catch(s){console.error("[Coalition] Form government failed:",s),alert("Failed to form government: "+(s.message||s))}finally{Ot=!1,i&&(i.disabled=!1,i.textContent="FORM GOVERNMENT")}}async function Aa(e){const t=P.nation.id,{error:a}=await T.from("government_formations").update({status:"cancelled"}).eq("nation_id",t).eq("status","active").neq("id",e.id);a&&console.warn("[Coalition] Failed to cancel rival formations:",a.message);const{error:i}=await T.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",e.id);if(i)throw i;const{error:s}=await T.from("nations").update({failed_formation_attempts:0}).eq("id",t);s&&console.warn("[Coalition] Failed to reset formation attempts:",s.message),await Wt(t);try{const o={id:e.id,party_ids:e.party_ids||[],lead_party_id:G.prime_minister};await me(T,t,P.nation,"election",o,j,et,P.shard?.current_date||"",Number(P.nation?.gov_approval??50))}catch(o){console.warn("[Coalition] Administration rollover failed (non-fatal):",o.message)}try{const o=G.prime_minister,n=j.find(f=>f.id===o),m=(e.party_ids||[]).map(f=>{const r=j.find(d=>d.id===f);return r?`${r.faction_name} (${r.seats||0})`:null}).filter(Boolean).join(", ");await T.from("event_log").insert({nation_id:t,event_name:"Coalition Government Formed",category:"government",fired_at_tick:et,description_used:`${n?.faction_name||"PM party"} formed a coalition government with: ${m}`,description_chosen:`${n?.faction_name||"PM party"} formed a coalition government with: ${m}`})}catch(o){console.warn("[Coalition] event_log insert failed (non-fatal):",o.message)}}async function Wt(e){const t={prime_minister:"Prime Minister",interior:"Minister of the Interior",foreign:"Minister of Foreign Affairs",defense:"Minister of Defense",finance:"Minister of Finance",education:"Minister of Education",healthcare:"Minister of Health",labor:"Minister of Labor",justice:"Minister of Justice",trade:"Minister of Trade",energy:"Minister of Energy",transportation:"Minister of Transportation",security:"Minister of Security"};let a=0;for(const[i,s]of Object.entries(G)){if(!s)continue;const o=Vt(P.nation?.name)||{},n=o.firstNames||["Alex","Maria","Carlos"],m=o.lastNames||["Garcia","Torres","Silva"],f=n[Math.floor(Math.random()*n.length)],r=m[Math.floor(Math.random()*m.length)],d=35+Math.floor(Math.random()*25),p=Ct?Ct(i,P.nation):{},c=t[i]||i,{data:v,error:l}=await T.from("ministries").update({party_id:s,minister_first_name:f,minister_last_name:r,minister_age:d,minister_approval:50,stat_baselines:p,is_active:!0}).eq("nation_id",e).eq("ministry_key",i).select("id");if(l)console.error(`[Coalition] FAILED to update ministry ${i}:`,l.message);else if(!v||v.length===0){const{error:y}=await T.from("ministries").insert({nation_id:e,ministry_key:i,ministry_name:c,party_id:s,minister_first_name:f,minister_last_name:r,minister_age:d,minister_approval:50,stat_baselines:p,is_active:!0});y?console.error(`[Coalition] FAILED to insert ministry ${i}:`,y.message):a++}else a++;const u=c,{error:g}=await T.from("cabinet_members").update({party_id:s,person_name:f+" "+r}).eq("nation_id",e).eq("position",u).eq("is_active",!0);g&&console.warn(`[Coalition] cabinet_members update failed for ${u}:`,g.message)}console.log(`[Coalition] Updated ${a} ministries for nation ${e}`)}async function za(){if(!gt){rt=[];return}const{data:e}=await T.from("government_formations").select("*").eq("election_id",gt).eq("status","active").order("created_at",{ascending:!0}),t=[];for(const a of e||[]){const{data:i}=await T.from("government_formation_support").select("faction_id, supports").eq("formation_id",a.id),s=a.party_ids||[],n=(i||[]).filter(p=>s.includes(p.faction_id)).filter(p=>p.supports).length,m=s.length,r=(i||[]).find(p=>p.faction_id===P.faction?.id)?.supports===!0,d=s.includes(P.faction?.id);t.push({...a,supportCount:n,coalitionSize:m,iAmSupporting:r,iAmInvited:d})}rt=t}let re=!1;function Ta(e){re||(re=!0,e.addEventListener("click",async t=>{const a=t.target.closest(".cf-party-check:not(.disabled)");if(a){const s=a.dataset.partyId,o=ft.indexOf(s);o>-1?(ft.splice(o,1),a.classList.remove("checked"),a.querySelector(".cf-check-box").textContent=""):(ft.push(s),a.classList.add("checked"),a.querySelector(".cf-check-box").textContent="✓"),Pa();return}if(t.target.closest("#cf-propose-btn")){await Na(e);return}const i=t.target.closest(".cf-support-btn, .cf-withdraw-btn");if(i){const s=i.dataset.formationId,o=i.dataset.action;if(o==="configure"){xt=s;const n=rt.find(m=>m.id===s);n&&(G={...n.ministry_assignments||{}}),await ct(e)}else await Fa(s,o==="support",e);return}if(t.target.closest("#cf-form-gov-btn")){const s=rt.find(o=>o.id===xt);s&&await La(s,e);return}}),e.addEventListener("change",t=>{const a=t.target.closest(".cf-ministry-select");if(!a)return;const i=a.dataset.ministry,s=a.value||null;G[i]=s,xt&&T.from("government_formations").update({ministry_assignments:G}).eq("id",xt).then(({error:n})=>{n&&console.warn("[Coalition] Failed to save assignment:",n.message)});const o=document.getElementById("cf-form-gov-btn");if(o){const n=!!G.prime_minister;o.disabled=!n,o.style.color=n?"#000":"var(--text-dim)",o.style.background=n?"var(--green)":"var(--bg-body)",o.style.borderColor=n?"var(--green)":"var(--border-main)",o.style.cursor=n?"pointer":"not-allowed"}}))}function Pa(){const e=document.getElementById("cf-preview-seats"),t=document.getElementById("cf-preview-pct"),a=document.getElementById("cf-preview-threshold");if(!e)return;const i=ft.reduce((n,m)=>n+(j.find(f=>f.id===m)?.seats||0),0),s=J?Math.round(i/J*100):0,o=i>=Q;e.textContent=i,e.style.color=o?"var(--green)":"var(--text-bright)",t.textContent=s,a.textContent=o?`✓ Meets ${Q}-seat threshold`:`— needs ${Q} seats`,a.style.color=o?"var(--green)":"var(--text-dim)"}async function Na(e){if(Rt)return;const t=P.faction;if((j.find(n=>n.id===t.id)?.seats||0)===0)return;const i=[...new Set(ft)],s=i.reduce((n,m)=>n+(j.find(f=>f.id===m)?.seats||0),0);if(s<Q){alert(`Coalition needs ${Q} seats. Currently: ${s}.`);return}Rt=!0;const o=document.getElementById("cf-propose-btn");o&&(o.disabled=!0,o.textContent="Submitting...");try{const{data:n}=await T.from("shard").select("current_date").eq("name","Alpha Shard").single(),{data:m,error:f}=await T.from("government_formations").insert({nation_id:P.nation.id,election_id:gt,proposed_by:t.id,party_ids:i,status:"active",game_year:n?.current_date||""}).select().single();if(f){alert("Error: "+f.message);return}const{error:r}=await T.from("government_formation_support").upsert({formation_id:m.id,faction_id:t.id,supports:!0},{onConflict:"formation_id,faction_id"});r&&console.warn("[Coalition] Auto-support insert failed:",r.message),await ct(e)}catch(n){console.error("[Coalition] Create proposal error:",n),alert("Failed to create proposal: "+(n.message||n))}finally{Rt=!1}}async function Fa(e,t,a){try{const{error:i}=await T.from("government_formation_support").upsert({formation_id:e,faction_id:P.faction?.id,supports:t},{onConflict:"formation_id,faction_id"});i&&console.error("[Coalition] Toggle support error:",i.message),await ct(a)}catch(i){console.error("[Coalition] Toggle support error:",i)}}let bt=null,ot=[],jt=[],Gt=null;function V(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function le(e){return e>=1e6?(e/1e6).toFixed(2)+"M":e>=1e3?Math.round(e/1e3)+"k":String(e)}function Ra(e){return["January","February","March","April","May","June","July","August","September","October","November","December"][e%12]+", "+(2e3+Math.floor(e/12))}function Oa(e,t){if((e.election_type||"parliamentary")==="presidential")return{label:"Presidential Election",color:"#5a8aaa"};const i=t?.end_reason||"";return i.includes("no_confidence")||i.includes("vnc")?{label:"Vote of No Confidence",color:"#d44a4a"}:i.includes("snap")||i.includes("dissolved")||i.includes("early")?{label:"Early Elections Called",color:"#c84"}:{label:"General Election",color:"#8b9a6b"}}async function Da(e,t){bt=t;const a=document.getElementById("pa-past-elections-root");if(!a)return;a.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">Loading election history...</div>';const i=t.nation?.id;if(!i){a.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No nation data.</div>';return}const[s,o,n]=await Promise.all([e.from("elections").select("id, election_tick, election_type, status, results, created_at").eq("nation_id",i).eq("status","completed").order("election_tick",{ascending:!1}),e.from("administrations").select("*").eq("nation_id",i).order("started_at_tick",{ascending:!1}),e.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",i).eq("faction_type","party").is("abandoned_at",null)]);ot=s.data||[],jt=o.data||[];const m=n.data||[],f={};for(const r of m)f[r.id]=r;for(const r of ot){const d=r.results?.votes||[];for(const p of d){const c=f[p.party_id];c?(p.color=c.party_color||"#666",p.abbreviation=c.abbreviation||p.party_name?.slice(0,3)?.toUpperCase()||"?"):(p.color="#666",p.abbreviation=p.party_name?.slice(0,3)?.toUpperCase()||"?")}}Ba(a),ke(a)}function Ba(e){e.addEventListener("click",t=>{const a=t.target.closest("[data-election-id]");if(a){const i=a.dataset.electionId;Gt=Gt===i?null:i,ke(e)}})}function ke(e,t){if(ot.length===0){e.innerHTML=`<div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);margin-bottom:8px;">PAST ELECTIONS</div>
            <div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No completed elections on record.</div>
        </div>`;return}const a=bt.faction?.id,i=bt.nation?.total_seats||100,s=Math.ceil(i/2)+1,o=ot.map((n,m)=>{const f=Gt===n.id,r=(n.results?.votes||[]).sort((I,L)=>(L.seats||0)-(I.seats||0)),d=r.slice(0,3),p=n.results?.turnout_pct??0,c=n.results?.total_votes_cast??0,v=Ra(n.election_tick),l=jt.find(I=>I.started_at_tick>=n.election_tick&&I.started_at_tick<=n.election_tick+5),u=jt.find(I=>I.ended_at_tick!=null&&I.ended_at_tick>=n.election_tick-2&&I.ended_at_tick<=n.election_tick+2),g=Oa(n,u),y=(bt.nation?.government_type||"").toLowerCase().includes("presidential")||bt.nation?.hos_election_method==="direct_vote",_=y?"President":"PM",x=l?.prime_minister||"Unknown",E=l?.pm_party_id&&r.find(I=>I.party_id===l.pm_party_id)?.color||"#888",w=(m<ot.length-1?ot[m+1]:null)?.results?.votes||[];let C=`<div data-election-id="${n.id}" style="
            background:var(--bg-panel);border:1px solid var(--border-main);
            ${f?"border-bottom:none;":""}
        ">
            <div style="padding:12px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-secondary);width:130px;">${v}</div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 10px;color:${g.color};background:${g.color}0a;border:1px solid ${g.color}25;">${g.label.toUpperCase()}</span>
                    <div style="display:flex;gap:8px;margin-left:10px;">
                        ${d.map(I=>`<div style="display:flex;align-items:center;gap:4px;">
                            <div style="width:8px;height:8px;background:${I.color};"></div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${V(I.abbreviation)}</span>
                            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--text-bright);">${I.seats}</span>
                        </div>`).join("")}
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
                        ${_}: <span style="color:${E};font-weight:700;">${V(x)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">${f?"▲":"▼"}</span>
                </div>
            </div>
        </div>`;if(f){const I=r.map(M=>`<div style="width:${M.seats/i*100}%;background:${M.color};height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${M.seats>=8?9:6}px;font-weight:700;color:#000;">${M.seats>=5?M.seats:""}</div>`).join(""),L=r.map(M=>{const F=M.party_id===a,S=w.find(B=>B.party_id===M.party_id),z=S?M.seats-(S.seats||0):null,A=M.seats/i*100-(M.vote_percentage||0);return`<div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);${F?`background:${M.color}08;`:""}">
                    <div style="width:30px;height:30px;background:${M.color}15;border:1px solid ${M.color}33;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-right:8px;">${M.abbreviation?.slice(0,2)||"?"}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:5px;">
                            <span style="font-size:13px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${V(M.party_name)}</span>
                            ${F?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#5c5;padding:0 3px;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15);">YOU</span>':""}
                        </div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:${M.color};">${V(M.abbreviation)}</div>
                    </div>
                    <span style="width:60px;text-align:right;font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${M.seats}</span>
                    <span style="width:60px;text-align:right;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${z!=null?z>0?"#5c5":z<0?"#c55":"var(--text-dim)":"var(--text-dim)"};">${z!=null?z>0?"▲ "+z:z<0?"▼ "+Math.abs(z):"—":"NEW"}</span>
                    <span style="width:70px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-bright);">${le(M.votes||0)}</span>
                    <span style="width:55px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">${(M.vote_percentage||0).toFixed(1)}%</span>
                    <span style="width:80px;text-align:right;font-family:var(--font-mono);font-size:10px;font-weight:700;color:${Math.abs(A)<2?"var(--text-dim)":A>0?"#5c5":"#c84"};">${A>0?"+":""}${A.toFixed(1)}% <span style="font-size:8px;color:var(--text-dim);">${Math.abs(A)<2?"proportional":A>0?"overrep.":"underrep."}</span></span>
                </div>`}).join("");let R="";if(l){const M=l.coalition_parties||[],F=l.total_seats||M.reduce((q,wt)=>q+(wt.seats||0),0),S=F>=s,z=S?"Majority Coalition":"Minority Coalition",N=l.ended_at_tick?l.end_reason||"Ended":"Current Government",A=l.ended_at_tick?"var(--text-dim)":"#5c5",B=l.ended_at_tick?Math.abs(l.ended_at_tick-l.started_at_tick)+" ticks":"Ongoing",at=M.map(q=>{const wt=r.find(zt=>zt.party_id===q.party_id)?.color||"#666";return`<div style="width:${F>0?(q.seats||0)/F*100:0}%;background:${wt};height:100%;"></div>`}).join(""),it=M.map(q=>`<div style="display:flex;align-items:center;gap:4px;">
                        <div style="width:8px;height:8px;background:${r.find(zt=>zt.party_id===q.party_id)?.color||"#666"};"></div>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${V(q.party_name?.slice(0,3)?.toUpperCase()||"?")}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${q.seats||0}</span>
                    </div>`).join("");R=`<div style="margin:0 20px 16px;background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${E};">
                    <div style="padding:12px 16px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text-dim);">GOVERNMENT FORMED</span>
                                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 8px;color:${A};background:${A}0a;border:1px solid ${A}25;">${V(N.toUpperCase())}</span>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Lasted: ${B}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                            <div style="width:36px;height:36px;background:${E}15;border:1.5px solid ${E};display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;font-weight:700;color:${E};">${V(x.split(" ").map(q=>q[0]).join(""))}</div>
                            <div>
                                <div style="font-size:14px;font-weight:700;color:var(--text-bright);">${V(x)}</div>
                                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${y?"President":"Prime Minister"} &middot; ${V(l.pm_party_name||"")} &middot; ${z}</div>
                            </div>
                        </div>
                        <div style="display:flex;height:8px;gap:1px;margin-bottom:8px;">${at}</div>
                        <div style="display:flex;gap:10px;align-items:center;">
                            ${it}
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">&middot;</span>
                            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${S?"#5c5":"#c84"};">${F} seats ${S?"(majority +"+(F-s)+")":"(minority, "+(s-F)+" short)"}</span>
                        </div>
                    </div>
                </div>`}C+=`<div style="background:var(--bg-panel);border:1px solid var(--border-main);border-top:1px solid var(--border-main);">
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
                            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">${le(c)}</div>
                        </div>
                    </div>
                </div>

                <!-- Seat bar -->
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;height:18px;gap:1px;margin-bottom:6px;">${I}</div>
                    <div style="position:relative;height:0;">
                        <div style="position:absolute;bottom:0;left:${s/i*100}%;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);transform:translateX(-50%);">▲ ${s} majority</div>
                    </div>
                </div>

                <!-- Results table header -->
                <div style="padding:0 20px;">
                    <div style="display:flex;padding:8px 0;border-bottom:1px solid var(--border-main);font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">
                        <span style="width:30px;"></span>
                        <span style="flex:1;">PARTY</span>
                        <span style="width:60px;text-align:right;">SEATS</span>
                        <span style="width:60px;text-align:right;">CHANGE</span>
                        <span style="width:70px;text-align:right;">VOTES</span>
                        <span style="width:55px;text-align:right;">VOTE %</span>
                        <span style="width:80px;text-align:right;">SEAT vs VOTE</span>
                    </div>
                    ${L}
                </div>

                ${R}
            </div>`}return C}).join("");e.innerHTML=`<div style="padding:12px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);">PAST ELECTIONS</span>
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">${ot.length} elections on record</span>
            </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">${o}</div>
    </div>`}let W=null,qt=!1,de=!1,Ht=!1,ce=!1,Ut=!1;function Ee(e){document.querySelectorAll(".pa-subtab").forEach(t=>t.classList.toggle("active",t.dataset.panel===e)),document.querySelectorAll(".pa-panel").forEach(t=>t.classList.toggle("active",t.id==="panel-"+e)),sessionStorage.setItem("party_subtab",e),e==="actions"&&!qt&&W&&(qt=!0,be(pt,W)),e==="parties"&&!de&&W&&(de=!0,fa(pt,W,"pa-parties-root")),e==="election"&&!Ht&&W&&(Ht=!0,Ut?ct(document.getElementById("pa-election-root")):we(pt,W).then(()=>{Ut=!0,ct(document.getElementById("pa-election-root"))})),e==="past-elections"&&!ce&&W&&(ce=!0,Da(pt,W))}document.getElementById("pa-subtabs").addEventListener("click",e=>{const t=e.target.closest(".pa-subtab");!t||t.classList.contains("active")||Ee(t.dataset.panel)});Ce("politics",async e=>{W=e,we(pt,e).then(({needed:a})=>{if(Ut=!0,a){const i=document.querySelector('.pa-subtab[data-panel="election"]');i&&!i.querySelector(".pa-subtab-badge")&&(i.innerHTML+='<span class="pa-subtab-badge"></span>');const s=document.querySelector('.nav-tab[data-tab="politics"]');s&&!s.querySelector(".pa-subtab-badge")&&(s.innerHTML+='<span class="pa-subtab-badge"></span>')}Ht&&ct(document.getElementById("pa-election-root"))});const t=sessionStorage.getItem("party_subtab");t&&t!=="actions"?Ee(t):(qt=!0,await be(pt,e))});
