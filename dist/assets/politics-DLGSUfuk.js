const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/elections-B2jRdA_W.js","assets/config-fKhFNVuq.js","assets/government-types-CONVKpUN.js","assets/ideology-BIAflN4K.js","assets/stats-tIiBSaQA.js"])))=>i.map(i=>d[i]);
import{_supabase as rt}from"./supabase-client-CiYoFhIh.js";/* empty css                  */import{i as _e}from"./common-DqCYC8Fq.js";import{_ as $e}from"./preload-helper-BXl3LOEh.js";import{j as Ht,E as re,B as we}from"./elections-B2jRdA_W.js";import{l as pt}from"./government-types-CONVKpUN.js";import{a as ke}from"./ideology-BIAflN4K.js";import{d as Ee,c as Ce,s as Ie,a as $t}from"./stats-tIiBSaQA.js";import"./config-fKhFNVuq.js";const yt=[{id:"economic_reform",name:"Economic Reform",icon:"📈",tagline:"Growth-first neoliberal agenda",desc:"Prioritize GDP, attract foreign capital, lower corporate taxes. The rising tide theory — grow the pie and worry about slicing it later.",improve:["gdp_growth","foreign_investment","currency_strength","credit","service_output","manufacturing_output"],worsen:["income_inequality","poverty_rate","union_strength","income_tax"],tradeoff:"Income inequality tends to rise. Working class sees GDP numbers go up while their wages don't."},{id:"social_justice",name:"Social Justice",icon:"⚖️",tagline:"Redistribution and equity",desc:"Raise minimum wage, expand welfare, progressive taxation. Close the gap between rich and poor through direct intervention.",improve:["minimum_wage","poverty_rate","income_inequality","social_mobility","healthcare_accessibility","education_accessibility"],worsen:["foreign_investment","gdp_growth","corporate_tax"],tradeoff:"Capital flight risk. Foreign investors avoid high-tax environments. Growth may slow."},{id:"national_security",name:"National Security",icon:"🛡️",tagline:"Borders, military, order",desc:"Strengthen defense, tighten borders, expand police powers. Safety through strength.",improve:["stability","crime_rate","terrorism","political_violence","illegal_immigration"],worsen:["freedom_index","press_freedom","civil_unrest","polarization"],tradeoff:"Freedom index drops. Minority communities disproportionately affected. International criticism."},{id:"anti_corruption",name:"Anti-Corruption",icon:"🔍",tagline:"Clean government, institutional reform",desc:"Independent judiciary, transparent budgets, prosecute the connected. Popular with voters but powerful people fight back hard.",improve:["corruption","judicial_independence","press_freedom","legitimacy","efficiency"],worsen:["stability"],tradeoff:"Short-term chaos as exposing corruption shakes institutions. Your own party's skeletons may surface."},{id:"green_transition",name:"Green Transition",icon:"🌱",tagline:"Climate and environment",desc:"Renewable energy investment, carbon taxes, emissions targets. Save the planet — but the bill comes due now, not later.",improve:["renewable_energy_pct","pollution","carbon_emissions","energy_generation"],worsen:["fuel_prices","manufacturing_output","gdp_growth","cost_of_living"],tradeoff:"Energy costs spike during transition. Rural and industrial voters feel abandoned."},{id:"industrialization",name:"Industrialization",icon:"🏭",tagline:"Factories, exports, production",desc:"Build manufacturing capacity, create blue-collar jobs, develop physical infrastructure. The backbone of a real economy.",improve:["manufacturing_output","labor_force_participation","unemployment","physical_infrastructure","gdp_growth"],worsen:["pollution","carbon_emissions","arable_land","healthcare_quality"],tradeoff:"Environment gets destroyed. Long-term health costs from industrial pollution."},{id:"digital_modernization",name:"Digital Modernization",icon:"💻",tagline:"Tech economy, connectivity",desc:"Fiber everywhere, tech sector incentives, digital government services. Leap into the future — but not everyone makes the jump.",improve:["digital_infrastructure","service_output","higher_education","academic_immigration","efficiency"],worsen:["manufacturing_output","labor_force_participation","income_inequality","urbanization"],tradeoff:"Automation displaces workers. Rural communities left behind. Tech wealth concentrates in cities."},{id:"welfare_state",name:"Welfare State",icon:"🏥",tagline:"Universal services, safety net",desc:"Free healthcare, free education, generous pensions, unemployment insurance. Cradle to grave — funded by steep taxes on everyone.",improve:["healthcare_quality","healthcare_accessibility","education_accessibility","poverty_rate","standard_of_living","happiness"],worsen:["income_tax","corporate_tax","gdp_growth","foreign_investment"],tradeoff:"Massive fiscal cost. Tax burden on middle class, not just the rich. Sustainability questioned."},{id:"populist_nationalism",name:"Populist Nationalism",icon:"🇲",tagline:"The people vs. elites and outsiders",desc:"Restrict immigration, protect domestic industry, reject globalism. Our people first. Our jobs first. Our culture first.",improve:["immigration","illegal_immigration","manufacturing_output","minimum_wage","union_strength"],worsen:["foreign_investment","academic_immigration","freedom_index","press_freedom","polarization","ethnic_diversity"],tradeoff:"International isolation. Brain drain as educated professionals emigrate. Deep social polarization."},{id:"free_market",name:"Free Market Liberalism",icon:"🏛️",tagline:"Deregulate everything",desc:"Cut taxes, cut red tape, let the market decide winners and losers. Government is the problem, not the solution.",improve:["gdp_growth","foreign_investment","credit","service_output","currency_strength"],worsen:["union_strength","minimum_wage","healthcare_accessibility","income_inequality","poverty_rate"],tradeoff:"Growth at the cost of the working class. Social safety net erodes. Boom-bust volatility."},{id:"law_and_order",name:"Law & Order",icon:"⚔️",tagline:"Tough on crime, strong institutions",desc:"More police, harsher sentences, zero tolerance. Restore order to the streets. Criminals fear the state.",improve:["crime_rate","stability","political_violence","terrorism","drug_use"],worsen:["incarceration_rate","freedom_index","civil_unrest"],tradeoff:"Prison population explodes. Minority communities targeted. Policing costs balloon."},{id:"education_first",name:"Education First",icon:"🎓",tagline:"Human capital as the long game",desc:"Fund schools, universities, research institutions, teacher salaries. The 20-year bet that the next generation will be smarter and richer.",improve:["literacy","higher_education","education_accessibility","academic_immigration","social_mobility","labor_force_participation"],worsen:["income_tax","gdp_growth"],tradeoff:"Voters don't see results before next election. Brain drain if jobs don't exist for graduates."},{id:"healthcare_reform",name:"Healthcare Reform",icon:"💊",tagline:"Fix the hospitals",desc:"More beds, more doctors, better drugs, universal coverage. Nobody dies because they can't afford treatment.",improve:["healthcare_quality","healthcare_accessibility","beds_per_100k","lifespan","drug_use"],worsen:["income_tax","gdp_growth","cost_of_living"],tradeoff:"Pharmaceutical lobby fights back. Extremely expensive. Takes multiple cycles to show results."},{id:"housing_cost",name:"Housing & Cost of Living",icon:"🏠",tagline:"The kitchen-table platform",desc:"Rent controls, public housing, affordable food, price caps on essentials. People can't eat GDP growth.",improve:["housing_affordability","cost_of_living","standard_of_living","physical_infrastructure","urbanization"],worsen:["foreign_investment","gdp_growth"],tradeoff:"Property owners and developers become your enemies. Market distortions create shortages."},{id:"energy_independence",name:"Energy Independence",icon:"⛽",tagline:"Control your own power supply",desc:"Exploit domestic oil, gas, and minerals. No more dependency on foreign energy. Cheap fuel, strong economy, sovereign power.",improve:["energy_generation","oil_and_gas","rare_minerals","fuel_prices","manufacturing_output","gdp_growth"],worsen:["pollution","carbon_emissions","renewable_energy_pct","arable_land"],tradeoff:"Climate commitments broken. Green voters abandon you. Environmental debt for future generations."},{id:"open_society",name:"Open Society",icon:"🕊️",tagline:"Liberal democracy, civil liberties",desc:"Free press, open borders, multicultural embrace, strong civil rights. A beacon of freedom — and a target for those who fear it.",improve:["freedom_index","press_freedom","immigration","academic_immigration","ethnic_diversity","happiness","judicial_independence"],worsen:["stability","illegal_immigration","polarization","terrorism"],tradeoff:"Nationalist backlash. Rural-urban divide deepens. Security vulnerabilities from openness."}],Yt={gdp_growth:"GDP Growth",inflation:"Inflation",interest_rates:"Interest Rates",currency_strength:"Currency Strength",foreign_investment:"Foreign Investment",credit:"Credit",income_tax:"Income Tax",corporate_tax:"Corporate Tax",sales_tax:"Sales Tax",unemployment:"Unemployment",labor_force_participation:"Labor Force Participation",minimum_wage:"Minimum Wage",union_strength:"Union Strength",poverty_rate:"Poverty Rate",income_inequality:"Income Inequality",healthcare_quality:"Healthcare Quality",healthcare_accessibility:"Healthcare Accessibility",beds_per_100k:"Beds per 100k",lifespan:"Lifespan",drug_use:"Drug Use",literacy:"Literacy",higher_education:"Higher Education",education_accessibility:"Education Accessibility",academic_immigration:"Academic Immigration",physical_infrastructure:"Physical Infrastructure",digital_infrastructure:"Digital Infrastructure",urbanization:"Urbanization",energy_generation:"Energy Generation",renewable_energy_pct:"Renewable Energy %",arable_land:"Arable Land",rare_minerals:"Rare Minerals",oil_and_gas:"Oil & Gas",fuel_prices:"Fuel Prices",pollution:"Pollution",carbon_emissions:"Carbon Emissions",standard_of_living:"Standard of Living",happiness:"Happiness",social_mobility:"Social Mobility",crime_rate:"Crime Rate",incarceration_rate:"Incarceration Rate",religiosity:"Religiosity",stability:"Stability",legitimacy:"Legitimacy",efficiency:"Efficiency",corruption:"Corruption",press_freedom:"Press Freedom",judicial_independence:"Judicial Independence",freedom_index:"Freedom Index",polarization:"Polarization",civil_unrest:"Civil Unrest",terrorism:"Terrorism",political_violence:"Political Violence",immigration:"Immigration",illegal_immigration:"Illegal Immigration",emigration:"Emigration",ethnic_diversity:"Ethnic Diversity",cost_of_living:"Cost of Living",housing_affordability:"Housing Affordability",manufacturing_output:"Manufacturing Output",service_output:"Service Output"},qt=new Set(["inflation","unemployment","poverty_rate","income_inequality","drug_use","pollution","carbon_emissions","crime_rate","incarceration_rate","corruption","polarization","civil_unrest","terrorism","political_violence","illegal_immigration","emigration","cost_of_living","fuel_prices"]),Me=new Set(["income_tax","corporate_tax","sales_tax"]);function Wt(a,t){const i=qt.has(a),e=Me.has(a);return t==="improve"?i?{arrow:"↓",color:"#5cc55c"}:e?{arrow:"↑",color:"#c84"}:{arrow:"↑",color:"#5cc55c"}:i?{arrow:"↑",color:"#c55"}:e?{arrow:"↓",color:"#5cc55c"}:{arrow:"↓",color:"#c55"}}function Kt(a){switch(a){case 0:return{momentum:12,penalty:0,label:"+12",color:"#5cc55c",note:"Unclaimed — full momentum"};case 1:return{momentum:6,penalty:6,label:"+6",color:"#ca5",note:"Contested by 1 rival — reduced momentum"};case 2:return{momentum:4,penalty:4,label:"+4",color:"#c84",note:"Crowded (2 rivals) — minimal momentum"};default:return{momentum:2,penalty:2,label:"+2",color:"#c84",note:`Crowded (${a} rivals) — minimal momentum`}}}function Se(a,t){return a.map(i=>{const e=yt.find(n=>n.id===i.platform_key);if(!e)return{...i,stats:[]};const s=e.improve.map(n=>{const o=i.baseline_stats?.[n],l=i.target_stats?.[n],f=Number(t?.[n]??50),c=qt.has(n);if(o==null||l==null)return{stat:n,baseline:f,target:f,current:f,progress:0,met:!1};const r=Math.abs(l-o),p=c?Math.max(0,o-f):Math.max(0,f-o),m=r>0?Math.min(1,p/r):1,v=c?f<=l:f>=l;return{stat:n,baseline:o,target:l,current:f,progress:m,met:v}});return{...i,stats:s,platformDef:e}})}const Le=["Former union organizer. Knows how to mobilize a crowd.","Disbarred attorney. Understands the legal system from the inside.","Investigative journalist. Uncovered three government scandals before going private.","Ex-military intelligence. Trained in information warfare.","Community activist. Built grassroots networks across two provinces.","Former government auditor. Knows where the money hides.","Political science professor. Publishes on institutional corruption.","NGO director. Ran anti-corruption campaigns across the continent.","Former prosecutor. Left the justice ministry over political interference.","Labor rights campaigner. Organized the dockworkers' strike of 2014.","Freelance political consultant. Has worked for opposition parties in three nations.","Student movement leader. Led the university protests. Young and fearless.","Retired diplomat. Leverages international connections for domestic pressure.","Whistleblower advocate. Runs a secure tip line used by civil servants.","Former police detective. Turned against the system after a cover-up."];function ot(a){return a>=75?{label:"Exceptional",color:"#5cc55c",desc:"Elite operative. Lawsuits are devastating, intelligence is razor-sharp."}:a>=60?{label:"Strong",color:"#a3b07e",desc:"Experienced and reliable. Can handle most opposition tasks effectively."}:a>=45?{label:"Competent",color:"#ca5",desc:"Gets the job done. Occasional missteps under pressure."}:a>=30?{label:"Developing",color:"#c84",desc:"Green but eager. Results are inconsistent. Cheap to hire."}:{label:"Weak",color:"#c55",desc:"Liability risk. May botch sensitive operations. Rock-bottom price for a reason."}}function Ae(a){var t=Math.max(0,a-20)/65,i=12e4+t*28e4;return Math.round(i/25e3)*25e3}function St(a,t){return a+Math.floor(Math.random()*(t-a+1))}function Jt(a){return a[Math.floor(Math.random()*a.length)]}function ze(a,t){var i=[],e=new Set,s=St(5,7),n=Ht(t),o=n.firstNames||[],l=n.lastNames||[];if(o.length===0||l.length===0)return[];for(var f=Le.slice().sort(function(){return Math.random()-.5}),c=0;c<s;c++){var r,p,m,v=0;do r=Jt(o),p=Jt(l),m=r+" "+p,v++;while(e.has(m)&&v<20);e.add(m);var d=St(20,85),u=St(25,60),g=f[c%f.length],y=Ae(d);i.push({nation_id:a,first_name:r,last_name:p,age:u,skill:d,background:g,hire_cost:y,status:"available"})}return i.sort(function(_,x){return x.skill-_.skill}),i}async function le(a,t,i){var{data:e,error:s}=await a.from("administrations").select("id, coalition_parties, stats_at_start, started_at_tick, pm_party_id").eq("nation_id",t).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle();if(s)return console.error("[Agitator] Failed to check opposition status:",s.message),{isOpposition:!1,administration:null};if(!e)return{isOpposition:!0,administration:null};var n=Array.isArray(e.coalition_parties)?e.coalition_parties:[],o=n.map(function(f){return f?typeof f=="string"?f:typeof f=="object"&&(f.party_id||f.id)||null:null}).filter(Boolean),l=o.includes(i)||e.pm_party_id===i;return{isOpposition:!l,administration:e}}async function de(a,t){var{data:i,error:e}=await a.from("faction_agitators").select("*").eq("faction_id",t).eq("status","active").maybeSingle();return e?(console.error("[Agitator] Failed to fetch agitator:",e.message),null):i}async function Te(a,t,i){var{data:e,error:s}=await a.from("agitator_pool").select("*").eq("nation_id",t).eq("status","available").order("skill",{ascending:!1});if(s)return console.error("[Agitator] Failed to fetch pool:",s.message),[];if(e&&e.length>0)return e;var n=ze(t,i),{data:o,error:l}=await a.from("agitator_pool").insert(n).select("*");return l?(console.error("[Agitator] Failed to insert pool:",l.message),[]):(o||[]).sort(function(f,c){return c.skill-f.skill})}async function Pe(a,t,i,e){var s=await de(a,t);if(s)return{success:!1,agitator:null,error:"You already have an active agitator."};var{data:n,error:o}=await a.from("faction_agitators").insert({faction_id:t,first_name:i.first_name,last_name:i.last_name,age:i.age,skill:i.skill,background:i.background,status:"active",hired_at_tick:e}).select("*").single();if(o)return console.error("[Agitator] Failed to hire:",o.message),{success:!1,agitator:null,error:o.message};var{error:l}=await a.from("agitator_pool").update({status:"hired",hired_by_faction_id:t}).eq("id",i.id);return l&&console.error("[Agitator] Failed to mark pool candidate as hired:",l.message),{success:!0,agitator:n,error:null}}const wt=[{key:"finance",label:"Finance",icon:"💰"},{key:"defense",label:"Defense",icon:"🛡️"},{key:"education",label:"Education",icon:"🎓"},{key:"healthcare",label:"Health",icon:"🏥"},{key:"interior",label:"Interior",icon:"🏛️"},{key:"foreign",label:"Foreign",icon:"🌐"},{key:"justice",label:"Justice",icon:"⚖️"},{key:"labor",label:"Labor",icon:"🔨"},{key:"trade",label:"Trade",icon:"📦"},{key:"energy",label:"Energy",icon:"⚡"},{key:"transportation",label:"Transport",icon:"🚂"},{key:"agriculture",label:"Agriculture",icon:"🌾"}],ce=[{key:"misuse_of_funds",label:"Misuse of Public Funds",desc:"Alleging budget went somewhere it shouldn't."},{key:"civil_rights",label:"Violation of Civil Rights",desc:"Alleging government overreach or suppression."},{key:"negligence",label:"Breach of Duty / Negligence",desc:"Alleging a ministry failed its mandate."},{key:"corruption",label:"Corruption / Self-Dealing",desc:"Alleging officials enriched themselves."}];function Ut(a){return a<=5?{tier:1,label:"Clean Government",color:"#c55"}:a<=10?{tier:2,label:"Minor Corruption",color:"#ca5"}:a<=20?{tier:3,label:"Significant Corruption",color:"#c84"}:{tier:4,label:"Systemic Corruption",color:"#5cc55c"}}const tt={1:{resolution:"FRIVOLOUS SUIT",filer:{momentum:-5,governance:-2},gov:{momentum:3,governance:1}},2:{resolution:"PARTIAL WIN",filer:{momentum:3,governance:0},gov:{momentum:-2,governance:-2}},3:{resolution:"MAJOR WIN",filer:{momentum:7,governance:2},gov:{momentum:-5,governance:-5}},4:{resolution:"DEVASTATING WIN",filer:{momentum:12,governance:5},gov:{momentum:-10,governance:-8}}},Xt={1:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"Lawsuit discovery phase produces routine documents. No irregularities found in {ministry}.",evidence:"Legal team reviews {ministry} records. Auditors confirm standard procedures.",pre_trial:"Judge signals skepticism toward {party}'s claims. Case appears thin.",resolution:"{ministry} lawsuit dismissed. Courts find no evidence of wrongdoing. {party} criticized for wasting court resources."},2:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit uncovers irregular procurement contracts in {ministry}.",evidence:"Documents reveal {ministry} awarded no-bid contracts to connected firms.",pre_trial:"Judge allows case to proceed. {ministry} officials ordered to testify.",resolution:"{ministry} lawsuit concludes with partial ruling. Irregular contracts confirmed but no criminal charges filed."},3:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit exposes hidden accounts linked to {ministry} officials.",evidence:"Leaked documents show systematic overbilling in {ministry}. Millions unaccounted for.",pre_trial:"Multiple {ministry} officials refuse to testify. Judge threatens contempt.",resolution:"{ministry} scandal confirmed. Court finds evidence of systematic corruption. {party} vindicated."},4:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit reveals {ministry} ran parallel budget invisible to parliament.",evidence:"Court-ordered audit exposes network of shell companies receiving {ministry} funds.",pre_trial:"Prosecutors request criminal referral. Multiple {ministry} officials implicated.",resolution:"Devastating verdict: {ministry} operated criminal enterprise. Officials face prosecution. Government in crisis."}};function vt(a,t){var i=a;for(var e in t)i=i.split("{"+e+"}").join(t[e]);return i}async function Ne(a,t){var{factionId:i,nationId:e,agitatorId:s,targetMinistry:n,basis:o,currentTick:l,partyName:f,administration:c}=t,r,p,m;if(o==="civil_rights"){var v=Number(c?.stats_at_start?.freedom_index??50),{data:d,error:u}=await a.from("nations").select("freedom_index").eq("id",e).single();if(u)return{success:!1,lawsuit:null,tier:0,error:"Failed to fetch freedom index data."};p=Number(d?.freedom_index??50),r=v,m=Math.max(0,r-p)}else{var g=Number(c?.stats_at_start?.corruption??50),{data:d,error:u}=await a.from("nations").select("corruption").eq("id",e).single();if(u)return{success:!1,lawsuit:null,tier:0,error:"Failed to fetch corruption data."};p=Number(d?.corruption??50),r=g,m=Math.max(0,p-r)}var g=r,y=p,_=Ut(m),x=tt[_.tier],$=l+8,C=wt.find(function(R){return R.key===n}),k=C?"Ministry of "+C.label:n,I=ce.find(function(R){return R.key===o}),S=I?I.label:o,{data:E,error:M}=await a.from("lawsuits").insert({faction_id:i,nation_id:e,agitator_id:s,target_ministry:n,basis:o,filed_at_tick:l,resolves_at_tick:$,corruption_at_start:g,corruption_at_filing:y,corruption_growth:m,tier:_.tier,status:"active",resolution:null,momentum_effect:x.filer.momentum,governance_effect:x.filer.governance,gov_momentum_effect:x.gov.momentum,gov_governance_effect:x.gov.governance}).select("*").single();if(M)return{success:!1,lawsuit:null,tier:0,error:M.message};var F=Xt[_.tier]||Xt[1],A={party:f||"Opposition",ministry:k,basis:S},z=[{event_tick:l,event_type:"filing",headline:vt(F.filing,A)},{event_tick:l+2,event_type:"discovery",headline:vt(F.discovery,A)},{event_tick:l+5,event_type:"evidence",headline:vt(F.evidence,A)},{event_tick:l+7,event_type:"pre_trial",headline:vt(F.pre_trial,A)},{event_tick:$,event_type:"resolution",headline:vt(F.resolution,A)}],T=z.map(function(R){return{lawsuit_id:E.id,nation_id:e,event_tick:R.event_tick,event_type:R.event_type,headline:R.headline,is_fired:R.event_tick===l}}),{error:O}=await a.from("lawsuit_events").insert(T);return O&&console.error("[Lawsuits] Failed to insert milestone events:",O.message),{success:!0,lawsuit:E,tier:_.tier,error:null}}async function Re(a,t){var{data:i,error:e}=await a.from("lawsuits").select("*").eq("faction_id",t).order("filed_at_tick",{ascending:!1}).limit(10);return e?(console.error("[Lawsuits] Failed to fetch lawsuits:",e.message),[]):i||[]}let w=null,b=null,Y="leader",X=[],kt=[],D=null,P=null,mt=!1,nt=null,Nt=[];function h(a){if(!a)return"";const t=document.createElement("div");return t.textContent=a,t.innerHTML}function W(a,t){return((a||"?")[0]+(t||"?")[0]).toUpperCase()}const pe=[{id:"leader",title:"LEADER",fullTitle:"Party Leader",color:"#c8a832"},{id:"deputy",title:"DEPUTY",fullTitle:"Deputy Party Leader",color:"#8b9a6b"},{id:"chief",title:"CHIEF OF STAFF",fullTitle:"Chief of Staff",color:"#5cc55c"},{id:"campaign",title:"CAMPAIGN MGR",fullTitle:"Campaign Manager",color:"#c84"},{id:"comms",title:"COMMS DIR",fullTitle:"Communications Director",color:"#5a8aaa"},{id:"agitator",title:"AGITATOR",fullTitle:"Opposition Coordinator",color:"#d44a4a",oppositionOnly:!0}],Lt=[{perSeat:5e3,momDivisor:10},{perSeat:4e3,momDivisor:8},{perSeat:3e3,momDivisor:6},{perSeat:2e3,momDivisor:5},{perSeat:1e3,momDivisor:5}];let at=0;async function Fe(){if(!w||!b?.faction?.id||!b?.shard?.current_tick)return;const{count:a,error:t}=await w.from("campaign_actions").select("id",{count:"exact",head:!0}).eq("party_id",b.faction.id).eq("action_type","fundraise").eq("tick_performed",b.shard.current_tick);at=!t&&a!=null?a:0}function me(a,t){const i=Lt[Math.min(t,Lt.length-1)],e=a*i.perSeat,s=Math.max(1,Math.floor(a/i.momDivisor));return{raised:e,momCost:s,perSeat:i.perSeat,tierIdx:Math.min(t,Lt.length-1)}}const fe=[{id:"fundraise",name:"Fundraise",desc:"Raise party funds proportional to your seat count. Each use yields less money and costs more momentum. Momentum cannot drop below 1.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"statement",name:"Issue Statement",desc:"Public declaration on an issue. Shifts party positioning and voter bloc reactions. Media covers it. Other parties may respond.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"platform",name:"Set Party Platform",desc:"Choose a political focus. Defines which stats you promise to change. Awards momentum based on how many rivals share the same platform.",cost:"$120k",costColor:"#c8a832",moneyCost:12e4,tags:["STRATEGIC"],locked:!1}],Oe=[{id:"fundraise",name:"Fundraise",desc:"Raise royal treasury funds proportional to your seat count. Each use yields less money and costs more momentum.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"grant_seats",name:"Grant Seats",desc:"Grant parliamentary seats to a noble house. Sharing power increases legitimacy (+0.5 per seat). Hoarding >70% of seats causes tyranny decay.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1},{id:"revoke_seats",name:"Revoke Seats",desc:"Revoke seats from a noble house. Costs $100k and -1 Legitimacy per seat revoked. Use sparingly — the people do not forget.",cost:"$100k/seat",costColor:"#d44a4a",moneyCost:1e5,tags:["ROYAL","OFFENSIVE"],locked:!1},{id:"statement",name:"Royal Decree",desc:"Issue a public declaration on an issue. Shifts positioning and voter bloc reactions. Media covers it.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"appoint_pm",name:"Appoint Prime Minister",desc:"Choose a party to lead the government as Prime Minister. The PM can then assign cabinet ministries. You may appoint your own party.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1}],It={PUBLIC:"#8b9a6b",NARRATIVE:"#5a8aaa",STRATEGIC:"#c8a832",INTERNAL:"#c84",COALITION:"#5aaa8a",RISKY:"#c55",PARLIAMENTARY:"#8b9a6b",FINANCIAL:"#5a8aaa",INTELLIGENCE:"#5a8aaa",DEFENSIVE:"#5cc55c",CAMPAIGN:"#c84",VOTER:"#c8a832",OFFENSIVE:"#c84",REACTIVE:"#ca5",STRUCTURAL:"#9e9a92",ROYAL:"#c8a832",LEGAL:"#5a8aaa"},Qt=[{id:"economy",label:"Economy & Jobs",icon:"💰"},{id:"healthcare",label:"Healthcare",icon:"🏥"},{id:"education",label:"Education",icon:"🎓"},{id:"security",label:"National Security",icon:"🛡️"},{id:"environment",label:"Environment",icon:"🌱"},{id:"corruption",label:"Anti-Corruption",icon:"🔍"},{id:"infrastructure",label:"Infrastructure",icon:"🏗️"},{id:"immigration",label:"Immigration",icon:"🌐"},{id:"housing",label:"Housing & Cost of Living",icon:"🏠"},{id:"crime",label:"Crime & Justice",icon:"⚖️"},{id:"labor",label:"Labor & Workers",icon:"🔨"},{id:"foreign_policy",label:"Foreign Policy",icon:"🕊️"}],Zt=["{party_name} Calls for Action on {topic}","{leader_name}: '{topic}' Must Be National Priority","{leader_name} Pledges Bold Agenda on {topic}","{party_name} Leader Addresses Nation on {topic}"];async function ve(a,t){w=a,b=t;const i=document.getElementById("pa-actions-root");if(!i)return;const e=t.faction;if(!e){i.innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:300px;color:var(--text-dim);">No faction data.</div>';return}if(pt(t.nation)&&!t.nation.monarch_faction_id){const r=e.leader_first_name&&e.leader_last_name?e.leader_first_name+" "+e.leader_last_name:"The Monarch",p=e.leader_last_name||e.faction_name?.split(" ")[0]||"Royal",{getNationNames:m}=await $e(async()=>{const{getNationNames:g}=await import("./elections-B2jRdA_W.js").then(y=>y.W);return{getNationNames:g}},__vite__mapDeps([0,1,2,3,4])),v=m(t.nation.name),d=(v.firstNames||["Alexander"])[Math.floor(Math.random()*(v.firstNames||["Alexander"]).length)],{error:u}=await w.from("nations").update({monarch_faction_id:e.id,monarch_name:r,dynasty_name:p,heir_name:d+" "+p,heir_age:14+Math.floor(Math.random()*8),monarch_crowned_tick:t.shard?.current_tick||0}).eq("id",t.nation.id);u&&console.error("[Monarchy] Failed to assign monarch:",u.message),t.nation.monarch_faction_id=e.id,t.nation.monarch_name=r,t.nation.dynasty_name=p}const[s,n,o,l,f]=await Promise.all([w.from("faction_platforms").select("*").eq("faction_id",e.id).order("slot"),w.from("faction_platforms").select("*").eq("nation_id",t.nation?.id),de(w,e.id),le(w,t.nation?.id,e.id),w.from("faction_electoral_standing").select("ideological_alignment, visibility, raw_appeal").eq("faction_id",e.id).eq("nation_id",t.nation?.id).maybeSingle()]);await Fe(),s.error&&console.error("[PartyActions] Failed to load faction platforms:",s.error.message),n.error&&console.error("[PartyActions] Failed to load nation platforms:",n.error.message),X=s.data||[],kt=n.data||[],D=o,mt=l.isOpposition,nt=l.administration,f.data;const{data:c}=await w.from("faction_deputies").select("*").eq("faction_id",e.id).eq("status","active").maybeSingle();P=c||null,D&&(Nt=await Re(w,e.id)),H(i)}function H(a){const t=b.faction,i=b.nation,e=pt(i),s=e&&i?.monarch_faction_id===t?.id,n=t.color||"#c8a832",o=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown Leader",l=t.seats||0,f=i?.total_seats||120,c=f>0?Math.round(l/f*100):0;t.action_points,t.approval_rating;const r=t.momentum??50,p=t.party_funds??0,m=Se(X,i),v=[];for(let d=1;d<=3;d++){const u=X.find(g=>g.slot===d);if(u){const g=yt.find($=>$.id===u.platform_key),y=m.find($=>$.id===u.id),_=y?y.stats.filter($=>$.met).length:0,x=y?y.stats.length:0;v.push({name:g?.name||u.platform_key,status:u.status,metCount:_,totalCount:x,slot:d})}else v.push(null)}a.innerHTML=`
        <div class="pa-page">
            <!-- Header -->
            <div class="pa-header">
                <div class="pa-header-left">
                    <span class="pa-title" style="color:${n};">${s?"Royal Court":"Party Actions"}</span>
                    <div class="pa-party-badge">
                        <div class="pa-party-dot" style="background:${n};"></div>
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
                        <div class="pa-header-stat-value" style="color:${r>0?"var(--text-bright)":"var(--red)"};">${Number(r).toFixed(1)}</div>
                    </div>
                    <div class="pa-header-stat">
                        <div class="pa-header-stat-label">${e?"Legitimacy":"Governance"}</div>
                        <div class="pa-header-stat-value" style="color:var(--green);">${Math.round(Number(e?b.nation?.legitimacy??b.nation?.gov_approval??50:b.nation?.gov_approval??0))}</div>
                    </div>
                </div>
            </div>

            <!-- Status bar -->
            <div class="pa-status-bar">
                <div class="pa-status-item">
                    <div class="pa-status-label">Seats</div>
                    <div class="pa-status-value">
                        <span class="pa-status-big" style="color:${n};">${l}</span>
                        <span class="pa-status-dim">/ ${f}</span>
                        <span class="pa-status-dim">(${c}%)</span>
                    </div>
                </div>
                <div class="pa-status-item">
                    <div class="pa-status-label">Platforms</div>
                    <div style="display:flex;gap:4px;margin-top:3px;">
                        ${v.map(d=>{if(!d)return'<span class="pa-platform-slot">No Platform</span>';const u=d.status==="fulfilled"?" ✓":d.status==="failed"?" ✗":d.status==="abated"?" —":"",g=d.status==="fulfilled"?"fulfilled":d.status==="failed"?"failed":d.status==="abated"?"abated":"filled",y=d.totalCount>0?`${d.metCount}/${d.totalCount}`:"";return`<span class="pa-platform-slot ${g}" title="${d.metCount} of ${d.totalCount} stats on target">${h(d.name)}${y?` (${y})`:""}${u}</span>`}).join("")}
                    </div>
                </div>
            </div>

            <!-- Main layout -->
            <div class="pa-main">
                <!-- Leader sidebar -->
                <div class="pa-leaders" id="pa-leaders">
                    ${De(o,n,t)}
                </div>

                <!-- Actions panel -->
                <div class="pa-actions-panel" id="pa-actions-panel">
                    ${Be(o,n,t)}
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
    `,document.getElementById("pa-leaders")?.addEventListener("click",d=>{const u=d.target.closest(".pa-leader-card");if(!u||u.classList.contains("vacant"))return;const g=u.dataset.role;g&&g!==Y&&(Y=g,H(a))}),document.getElementById("pa-actions-panel")?.addEventListener("click",d=>{const u=d.target.closest(".pa-action-item");if(!u||u.classList.contains("locked"))return;const g=u.dataset.actionId;g==="fundraise"?ia(a):g==="grant_seats"?ea(a):g==="revoke_seats"?aa(a):g==="rally"?Ue(a):g==="statement"?oa(a):g==="platform"?na(a):g==="file_lawsuit"?Ze(a):g==="appoint_pm"?ta(a):g==="modernize"?Ye(a):g==="rebrand"&&We(a)}),document.getElementById("pa-hire-agitator-btn")?.addEventListener("click",()=>ie(a)),document.getElementById("pa-hire-agitator-panel")?.addEventListener("click",d=>{d.target.closest("#pa-hire-agitator-btn")||ie(a)}),document.getElementById("pa-hire-deputy-btn")?.addEventListener("click",()=>ee(a)),document.getElementById("pa-hire-deputy-panel")?.addEventListener("click",d=>{d.target.closest("#pa-hire-deputy-btn")||ee(a)})}function De(a,t,i){const e=pt(b.nation)&&b.nation?.monarch_faction_id===i?.id;return pe.map(s=>{const n=s.id==="leader",o=s.id==="agitator",l=Y===s.id;let f,c,r,p,m;if(n){f=!1,c=a,r=W(i.leader_first_name,i.leader_last_name),p=fe.length;const u=pt(b.nation);if(u&&b.nation?.monarch_faction_id===i.id)m={text:(b.nation?.monarch_title||"KING").toUpperCase(),color:"#c8a832"};else if(u)m={text:"NOBLE HOUSE",color:"#8b9a6b"};else{const y=nt?.pm_party_id===i.id,_=b.nation?.hos_election_method==="elected"&&nt?.president_party_id===i.id;y?m={text:"PRIME MINISTER",color:"#5cc55c"}:_?m={text:"PRESIDENT",color:"#5cc55c"}:mt?m={text:"OPPOSITION",color:"#c84"}:m={text:"GOVERNING",color:"#8b9a6b"}}}else o&&D?(f=!1,c=`${D.first_name} ${D.last_name}`,r=W(D.first_name,D.last_name),p=1):o&&!D?(f=!1,c="Not Hired",r="+",p=0):s.id==="deputy"&&P?(f=!1,c=`${P.first_name} ${P.last_name}`,r=W(P.first_name,P.last_name),p=1):s.id==="deputy"&&!P?(f=!1,c="Not Hired",r="+",p=0):s.id==="campaign"?(f=!1,c="Campaign Mgr",r="CM",p=ue.length):(f=!0,c="Vacant",r="—",p=0);const v=s.oppositionOnly&&!mt;return`
            <div class="pa-leader-card ${l?"active":""} ${f?"vacant":""} ${v?"vacant":""}"
                 data-role="${s.id}"
                 style="${l?`border-left-color:${s.color};`:""}${v?"opacity:0.35;":""}">
                ${s.oppositionOnly?`<div style="position:absolute;top:0;right:0;font-family:var(--font-mono);font-size:5px;font-weight:700;letter-spacing:0.04em;padding:1px 4px;color:${v?"var(--text-dim)":"#d44a4a"};background:${v?"rgba(100,100,100,0.1)":"rgba(212,74,74,0.1)"};border:1px solid ${v?"rgba(100,100,100,0.2)":"rgba(212,74,74,0.2)"};border-top:none;border-right:none;">${v?"IN GOVERNMENT":"OPPOSITION ONLY"}</div>`:""}
                <div class="pa-leader-top">
                    <div class="pa-leader-avatar" style="color:${s.color};background:${s.color}15;border-color:${s.color}33;">${r}</div>
                    <div class="pa-leader-info">
                        <div class="pa-leader-role">
                            <span class="pa-leader-role-label" style="color:${s.color};">${n&&e?(b.nation?.monarch_title||"King").toUpperCase():s.title}</span>
                            ${p>0?`<span class="pa-leader-role-count">${p} actions</span>`:""}
                        </div>
                        <div class="pa-leader-name">${h(c)}</div>
                        ${m?`<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:${m.color};margin-top:2px;">${m.text}</div>`:""}
                        ${o&&D?`<div style="display:flex;align-items:center;gap:3px;margin-top:2px;"><div style="flex:1;height:2px;background:var(--border-mid);"><div style="height:100%;width:${D.skill}%;background:${ot(D.skill).color};"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);width:16px;text-align:right;">${D.skill}</span></div>`:""}
                        ${o&&!D?'<div style="font-family:var(--font-mono);font-size:7px;color:#d44a4a;margin-top:2px;">Click to recruit</div>':""}
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
    `}function Be(a,t,i){const e=pt(b.nation),s=e&&b.nation?.monarch_faction_id===i?.id,n=pe.find(x=>x.id===Y);if(!n)return"";const o=Y==="leader",l=Y==="agitator",f=Y==="campaign",c=Y==="deputy";if(!o&&!l&&!f&&!c)return`
            <div class="pa-vacant-msg">
                <div>
                    <div class="pa-vacant-title">${h(n.fullTitle)} — Vacant</div>
                    <div class="pa-vacant-sub">This position has not been filled. Recruitment coming in a future update.</div>
                </div>
            </div>
        `;if(l&&!mt)return`
            <div class="pa-vacant-msg" style="opacity:0.4;">
                <div style="text-align:center;">
                    <div style="font-size:2rem;margin-bottom:12px;opacity:0.3;">🚫</div>
                    <div class="pa-vacant-title">Agitator Unavailable</div>
                    <div class="pa-vacant-sub" style="max-width:400px;margin:8px auto;">
                        Your party is in government. The Agitator role is only available to opposition parties.
                    </div>
                </div>
            </div>
        `;if(l&&!D)return`
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
        `;if(l&&D)return Xe(n);if(c&&!P)return`
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
        `;if(c&&P)return He(n);if(f)return Ve(n,i);const p=W(i.leader_first_name,i.leader_last_name),m=i.leader_age?`, Age ${i.leader_age}`:"",v=i.seats||0,d=i.momentum??0,_=(pt(b.nation)&&b.nation?.monarch_faction_id===i.id?Oe:fe).map(x=>{const $=x.tags.map(E=>`<span class="pa-action-tag" style="color:${It[E]||"var(--text-dim)"};">${E}</span>`).join("");let C="",k=x.cost,I=x.costColor,S=x.locked;if(x.id==="fundraise"){const E=me(v,at);k=`-${E.momCost} MOM`,I="#c84",C=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);display:flex;gap:12px;">
                <span>Raises: <span style="color:var(--accent);font-weight:700;">$${(E.raised/1e3).toFixed(0)}k</span></span>
                <span>$${(E.perSeat/1e3).toFixed(0)}k/seat × ${v}</span>
                ${at>0?`<span style="color:var(--orange);">Use #${at+1}</span>`:""}
            </div>`,d-E.momCost<1&&(S=!0,C+=`<div style="margin-top:3px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Not enough momentum (need ${E.momCost}, have ${Number(d).toFixed(1)})</div>`)}return`
            <div class="pa-action-item ${S?"locked":""}" data-action-id="${x.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${h(x.name)}</span>
                        <div class="pa-action-tags">${$}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${I};">${k}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${h(x.desc)}</div>
                ${C}
                ${x.locked&&x.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${h(x.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${n.color};background:${n.color}15;border-color:${n.color}33;">${p}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${n.color};">${s?(b.nation?.monarch_title||"KING").toUpperCase():n.title}</span>
                        <span class="pa-detail-name">${h(a)}</span>
                        ${e&&b.nation?.dynasty_name?`<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);font-style:italic;">House ${h(b.nation.dynasty_name)}</span>`:""}
                    </div>
                    <div class="pa-detail-meta">${s?h((b.nation?.monarch_title||"King")+" of "+(b.nation?.name||"")):h(n.fullTitle)+" &middot; "+h(i.faction_name)}${m}${(()=>{if(s)return' <span style="color:#c8a832;font-weight:700;"> &middot; '+(b.nation?.monarch_title||"MONARCH").toUpperCase()+"</span>";if(e)return' <span style="color:#8b9a6b;font-weight:700;"> &middot; NOBLE HOUSE</span>';const x=nt?.pm_party_id===i.id,$=b.nation?.hos_election_method==="elected"&&nt?.president_party_id===i.id;return x?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRIME MINISTER</span>':$?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRESIDENT</span>':mt?' <span style="color:#c84;font-weight:700;"> &middot; OPPOSITION</span>':' <span style="color:#8b9a6b;font-weight:700;"> &middot; GOVERNING</span>'})()}</div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list">
            ${_}
        </div>
        <div class="pa-skill-footer">
            <span style="color:${n.color};font-weight:700;">${n.title}</span> actions are executed by the party leader. Effectiveness depends on party approval and momentum.
        </div>
    `}const je=[{id:"rally",name:"Hold a Rally",desc:"Invest party funds into a public rally. Higher investment improves your odds, but a bad roll can backfire. Roll 1d6 + rally bonus for momentum.",cost:"$50k-$200k",costColor:"#8b9a6b",tags:["CAMPAIGN","RISKY"],locked:!1}],te=[{cost:5e4,bonus:1,label:"$50k (+1)"},{cost:8e4,bonus:2,label:"$80k (+2)"},{cost:12e4,bonus:3,label:"$120k (+3)"},{cost:15e4,bonus:4,label:"$150k (+4)"},{cost:2e5,bonus:5,label:"$200k (+5)"}];function Ge(a,t){const i=a+t;return i>=8?{momentum:3,label:"Rousing Success",color:"#5cc55c"}:i>=5?{momentum:2,label:"Solid Turnout",color:"#8b9a6b"}:i>=3?{momentum:0,label:"Flat Response",color:"#ca5"}:{momentum:-2,label:"Backfire",color:"#c55"}}function He(a){const t=je.map(e=>{const s=e.tags.map(n=>`<span class="pa-action-tag" style="color:${It[n]||"var(--text-dim)"};">${n}</span>`).join("");return`
            <div class="pa-action-item ${e.locked?"locked":""}" data-action-id="${e.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${h(e.name)}</span>
                        <div class="pa-action-tags">${s}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${e.costColor};">${e.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${h(e.desc)}</div>
            </div>
        `}).join(""),i=ot(P.skill);return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${a.color};background:${a.color}15;border-color:${a.color}33;">${W(P.first_name,P.last_name)}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${a.color};">${a.title}</span>
                        <span class="pa-detail-name">${h(P.first_name)} ${h(P.last_name)}</span>
                    </div>
                    <div class="pa-detail-meta">${h(a.fullTitle)} &middot; Age ${P.age} &middot; Skill: <span style="color:${i.color};font-weight:700;">${P.skill}</span></div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list" id="pa-actions-panel">${t}</div>
    `}function qe(a){const t=Ht(a),i=t.firstNames||[],e=t.lastNames||[];if(i.length===0||e.length===0)return[];const s=5+Math.floor(Math.random()*3),n=new Set,o=[];for(let l=0;l<s;l++){let f,c,r,p=0;do f=i[Math.floor(Math.random()*i.length)],c=e[Math.floor(Math.random()*e.length)],r=f+" "+c,p++;while(n.has(r)&&p<20);n.add(r);const m=20+Math.floor(Math.random()*66),v=28+Math.floor(Math.random()*30),d=Math.max(0,m-20)/65,u=Math.round((125e3+d*525e3)/25e3)*25e3;o.push({first_name:f,last_name:c,age:v,skill:m,hire_cost:u})}return o.sort((l,f)=>f.skill-l.skill)}async function ee(a){const t=document.getElementById("pa-deputy-modal");if(!t)return;const i=b.nation?.name,e=qe(i);let s=null;function n(){const o=s!=null?e[s]:null,l=o?ot(o.skill):null,f=e.map((p,m)=>{const v=s===m,d=ot(p.skill);return`<div class="pa-hire-row ${v?"selected":""}" data-idx="${m}">
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
            </div>`}).join("");let c;o?c=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#8b9a6b;">${W(o.first_name,o.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${h(o.first_name)} ${h(o.last_name)}</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:1px;">Age ${o.age} &middot; Deputy Leader Candidate</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">SKILL</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${o.skill}%;background:${l.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${l.color};">${o.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${l.color};margin-top:3px;font-weight:700;">${l.label}</div>
                        </div>
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">HIRE COST</div>
                            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--accent);">$${Math.round(o.hire_cost/1e3)}k</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:3px;">From party funds</div>
                        </div>
                    </div>
                    <div style="padding:8px 10px;background:rgba(139,154,107,0.04);border:1px solid rgba(139,154,107,0.12);">
                        <div style="font-family:var(--font-mono);font-size:7px;color:#8b9a6b;letter-spacing:0.06em;margin-bottom:3px;">ROLE: DEPUTY PARTY LEADER</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Organizes rallies, boosts momentum, and energizes the party base. Higher skill improves rally outcomes.</div>
                    </div>
                </div>
                <div style="padding:10px 20px;border-top:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:flex-end;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-right:auto;">Cost: <span style="color:var(--accent);font-weight:700;">$${Math.round(o.hire_cost/1e3)}k</span></span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-dep-hire-confirm" style="background:#8b9a6b;"${(b.faction?.party_funds||0)<o.hire_cost?' disabled title="Not enough funds"':""}>Hire ${h(o.first_name)}</button>
                </div>
            `:c=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;"><div style="text-align:center;">
                <div style="font-family:var(--font-mono);font-size:24px;color:var(--border-mid);margin-bottom:8px;">←</div>
                <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Select a candidate to review</div>
            </div></div>`,t.innerHTML=`
            <div style="width:100%;max-width:700px;background:var(--bg-panel);border:1px solid var(--border-mid);box-shadow:0 20px 60px rgba(0,0,0,0.5);display:flex;flex-direction:column;max-height:80vh;">
                <div class="pa-modal-header">
                    <div class="pa-modal-header-left">
                        <div class="pa-modal-dot" style="background:#8b9a6b;"></div>
                        <span class="pa-modal-title">Hire Deputy Leader</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:8px;">${e.length} candidates</span>
                    </div>
                    <button class="pa-modal-close" id="pa-dep-close">&times;</button>
                </div>
                <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
                    <div style="width:240px;border-right:1px solid var(--border-main);overflow-y:auto;" id="pa-dep-list">${f}</div>
                    <div style="flex:1;overflow-y:auto;">${c}</div>
                </div>
            </div>
        `;const r=()=>t.classList.remove("active");document.getElementById("pa-dep-close")?.addEventListener("click",r),t.onclick=p=>{p.target===t&&r()},document.getElementById("pa-dep-list")?.addEventListener("click",p=>{const m=p.target.closest(".pa-hire-row");m&&(s=parseInt(m.dataset.idx,10),n())}),document.getElementById("pa-dep-hire-confirm")?.addEventListener("click",async()=>{if(s==null)return;const p=e[s],m=b.faction?.party_funds||0;if(m<p.hire_cost){alert("Not enough funds.");return}const v=document.getElementById("pa-dep-hire-confirm");v&&(v.disabled=!0,v.textContent="Hiring...");try{const d=m-p.hire_cost,u=b.shard?.current_tick||0,{data:g,error:y}=await w.from("faction_deputies").insert({faction_id:b.faction.id,first_name:p.first_name,last_name:p.last_name,age:p.age,skill:p.skill,status:"active",hired_at_tick:u}).select("*").single();if(y){alert("Failed: "+y.message);return}await w.from("factions").update({party_funds:d}).eq("id",b.faction.id),b.faction.party_funds=d,P=g,Y="deputy",r(),H(a)}catch(d){console.error("[Deputy] Hire error:",d)}finally{v&&(v.disabled=!1)}})}t.classList.add("active"),n()}function Ue(a){const t=document.getElementById("pa-rally-modal");if(!t||!P)return;const e=b.faction.party_funds||0;let s=null,n=null;function o(){const l=te.map((r,p)=>{const m=e>=r.cost,v=s===p;return`<div class="pa-action-item ${v?"selected":""} ${m?"":"locked"}" data-tier="${p}" style="cursor:${m?"pointer":"not-allowed"};${v?"border-color:#8b9a6b;background:rgba(139,154,107,0.06);":""}">
                <div class="pa-action-top">
                    <span style="font-size:13px;font-weight:700;color:${v?"#8b9a6b":"var(--text-bright)"};">$${Math.round(r.cost/1e3)}k Investment</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#8b9a6b;">+${r.bonus} Rally Bonus</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">Roll 1d6 + ${r.bonus} = range ${1+r.bonus} to ${6+r.bonus}</div>
            </div>`}).join("");let f="";n&&(f=`
                <div style="padding:16px;background:${n.color}08;border:1px solid ${n.color}22;margin-top:12px;">
                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${n.color};margin-bottom:4px;">${n.label}</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);margin-bottom:6px;">
                        Die roll: <strong>${n.dieRoll}</strong> + Rally bonus: <strong>${n.bonus}</strong> = <strong>${n.total}</strong>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${n.color};">
                        ${n.momentum>=0?"+":""}${n.momentum} Momentum
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
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#8b9a6b;">${h(P.first_name)} ${h(P.last_name)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">&middot; Skill ${P.skill}</span>
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    <div class="pa-modal-step-label">Choose Investment Level</div>
                    <div id="rally-tiers">${l}</div>

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
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="rally-cancel">${n?"Close":"Cancel"}</button>
                    ${n?"":`<button class="pa-modal-btn pa-modal-btn--submit" id="rally-submit" style="background:#8b9a6b;" ${s==null?"disabled":""}>Hold Rally</button>`}
                </div>
            </div>
        `;const c=()=>{t.classList.remove("active"),n&&H(a)};document.getElementById("rally-close")?.addEventListener("click",c),document.getElementById("rally-cancel")?.addEventListener("click",c),t.onclick=r=>{r.target===t&&c()},document.getElementById("rally-tiers")?.addEventListener("click",r=>{const p=r.target.closest("[data-tier]");!p||p.classList.contains("locked")||(s=parseInt(p.dataset.tier,10),o())}),document.getElementById("rally-submit")?.addEventListener("click",async()=>{if(s==null||n)return;const r=te[s],{data:p}=await w.from("factions").select("party_funds, momentum").eq("id",b.faction.id).single(),m=p?.party_funds||0;if(m<r.cost){alert("Not enough funds.");return}b.faction.party_funds=m,b.faction.momentum=p?.momentum??b.faction.momentum;const v=document.getElementById("rally-submit");v&&(v.disabled=!0,v.textContent="Rolling...");try{const d=1+Math.floor(Math.random()*6),u=Ge(d,r.bonus),g=m-r.cost,y=Math.max(1,(b.faction.momentum||0)+u.momentum);await w.from("factions").update({party_funds:g,momentum:y}).eq("id",b.faction.id);const _=b.shard?.current_tick||0;await w.from("campaign_actions").insert({party_id:b.faction.id,nation_id:b.nation?.id,action_type:"rally",ap_cost:0,money_cost:r.cost,tick_performed:_,result:{dieRoll:d,bonus:r.bonus,total:d+r.bonus,momentum:u.momentum,label:u.label}}),b.faction.party_funds=g,b.faction.momentum=y,sessionStorage.removeItem("nationhood_state"),n={...u,dieRoll:d,bonus:r.bonus,total:d+r.bonus},o()}catch(d){console.error("[Rally] Error:",d),alert("Rally failed.")}})}t.classList.add("active"),o()}const ue=[{id:"modernize",name:"Modernize Image",desc:"Upload a custom logo to refresh your party's brand. Grants +1 Momentum/tick while a custom logo is active. Quick and affordable.",cost:"$50k",costColor:"#5a8aaa",moneyCost:5e4,tags:["CAMPAIGN","BRANDING"],locked:!1},{id:"rebrand",name:"Rebrand Party",desc:'Change your party name, abbreviation, color, logo, and description. Costly but grants a "Fresh Start" modifier. Nuclear option after scandal or major defeat.',cost:"$150k",costColor:"#c84",moneyCost:15e4,tags:["CAMPAIGN","STRUCTURAL"],locked:!1}],ae=[{id:"crimson",hex:"#c43a3a",name:"Crimson"},{id:"scarlet",hex:"#d45a2a",name:"Scarlet"},{id:"amber",hex:"#c8a832",name:"Amber"},{id:"gold",hex:"#d4a017",name:"Gold"},{id:"olive",hex:"#8a9a4a",name:"Olive"},{id:"emerald",hex:"#2a8a4a",name:"Emerald"},{id:"forest",hex:"#3a6a3a",name:"Forest"},{id:"teal_c",hex:"#2a8a7a",name:"Teal"},{id:"sky",hex:"#4a8aba",name:"Sky"},{id:"cobalt",hex:"#3a5a9a",name:"Cobalt"},{id:"navy",hex:"#2a3a6a",name:"Navy"},{id:"violet",hex:"#7a4a9a",name:"Violet"},{id:"plum",hex:"#8a3a7a",name:"Plum"},{id:"rose",hex:"#ba4a6a",name:"Rose"},{id:"slate",hex:"#5a6a7a",name:"Slate"},{id:"iron",hex:"#4a4a4a",name:"Iron"}],Rt=[{emoji:"🏛️",name:"Parliament"},{emoji:"⚖️",name:"Scales"},{emoji:"🗽",name:"Liberty"},{emoji:"🕊️",name:"Dove"},{emoji:"🦅",name:"Eagle"},{emoji:"🦁",name:"Lion"},{emoji:"🐻",name:"Bear"},{emoji:"🐉",name:"Dragon"},{emoji:"🐘",name:"Elephant"},{emoji:"🏔️",name:"Mountain"},{emoji:"🌊",name:"Wave"},{emoji:"🔥",name:"Flame"},{emoji:"⭐",name:"Star"},{emoji:"🌟",name:"Glow Star"},{emoji:"💎",name:"Diamond"},{emoji:"🛡️",name:"Shield"},{emoji:"⚔️",name:"Swords"},{emoji:"🏗️",name:"Builder"},{emoji:"🌿",name:"Leaf"},{emoji:"🌾",name:"Wheat"},{emoji:"🔨",name:"Hammer"},{emoji:"⚡",name:"Lightning"},{emoji:"🎯",name:"Target"},{emoji:"🏴",name:"Flag"},{emoji:"🚩",name:"Red Flag"},{emoji:"✊",name:"Fist"},{emoji:"🤝",name:"Handshake"},{emoji:"📜",name:"Scroll"},{emoji:"🗳️",name:"Ballot"},{emoji:"👑",name:"Crown"}];function Ve(a,t){const i=ue.map(e=>{const s=e.tags.map(n=>`<span class="pa-action-tag" style="color:${It[n]||"var(--text-dim)"};">${n}</span>`).join("");return`
            <div class="pa-action-item ${e.locked?"locked":""}" data-action-id="${e.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${h(e.name)}</span>
                        <div class="pa-action-tags">${s}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${e.costColor};">${e.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${h(e.desc)}</div>
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
        <div class="pa-actions-list" id="pa-actions-panel">${i}</div>
        <div style="padding:8px 14px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);line-height:1.6;">
            <strong style="color:var(--text-secondary);">CAMPAIGN MANAGER</strong> actions shape your party's public identity and electoral strategy.
        </div>
    `}function Ye(a){const t=document.getElementById("pa-modernize-modal");if(!t)return;const i=b.faction;let e=null,s=i.custom_logo_url||null,n=!1;function o(){const l=!!s,c=Number(i.party_funds??0)>=5e4,r=!!e&&c&&!n;t.innerHTML=`
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
                    <div style="width:80px;height:80px;border:2px dashed ${l?"var(--accent)":"var(--border-mid)"};border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:var(--bg-card);">
                        ${s?`<img src="${h(s)}" style="width:100%;height:100%;object-fit:cover;">`:'<span style="font-size:24px;color:var(--text-dim);">+</span>'}
                    </div>
                    <div style="text-align:center;">
                        <label style="display:inline-block;padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright);background:var(--bg-card);border:1px solid var(--border-mid);cursor:pointer;letter-spacing:0.06em;">
                            ${l?"CHANGE LOGO":"UPLOAD LOGO"}
                            <input type="file" accept="image/*" id="mod-file-input" style="display:none;">
                        </label>
                        ${i.custom_logo_url&&!e?'<div style="font-family:var(--font-mono);font-size:8px;color:var(--green);margin-top:6px;">Current logo active — +1 Momentum/tick</div>':""}
                        ${e?'<div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);margin-top:6px;">New logo ready to upload</div>':""}
                    </div>
                    ${c?"":'<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">Insufficient funds. Need $50k.</div>'}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="mod-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="mod-submit" ${r?"":"disabled"} style="background:#5a8aaa;">Modernize — $50k</button>
                </div>
            </div>
        `,document.getElementById("mod-close")?.addEventListener("click",()=>t.classList.remove("active")),document.getElementById("mod-cancel")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=p=>{p.target===t&&t.classList.remove("active")},document.getElementById("mod-file-input")?.addEventListener("change",p=>{const m=p.target.files?.[0];if(m){if(m.size>2*1024*1024){alert("Logo must be under 2MB.");return}e=m,s=URL.createObjectURL(m),o()}}),document.getElementById("mod-submit")?.addEventListener("click",async()=>{if(n||!e)return;n=!0;const p=document.getElementById("mod-submit");p&&(p.disabled=!0,p.textContent="Uploading...");try{const m=e.name.split(".").pop()?.toLowerCase()||"png",v=`${i.id}/logo_${Date.now()}.${m}`,{error:d}=await w.storage.from("party-logos").upload(v,e,{cacheControl:"3600",upsert:!0,contentType:e.type});if(d)throw new Error("Upload failed: "+d.message);const{data:u}=w.storage.from("party-logos").getPublicUrl(v),g=u?.publicUrl;if(!g)throw new Error("Failed to get logo URL");const y=Math.max(0,Number(i.party_funds??0)-5e4),{error:_}=await w.from("factions").update({custom_logo_url:g,party_funds:y}).eq("id",i.id);if(_)throw _;i.custom_logo_url=g,i.party_funds=y,t.classList.remove("active"),alert("Logo updated! Your party now earns +1 Momentum/tick from the modernized image."),H(a)}catch(m){alert("Modernize failed: "+(m.message||"Error")),n=!1,p&&(p.disabled=!1,p.textContent="Modernize — $50k")}})}t.classList.add("active"),o()}function We(a){const t=document.getElementById("pa-rebrand-modal");if(!t)return;const i=b.faction;b.nation;const e=i.momentum??50;(b._allParties||[]).filter(m=>m.id!==i.id);const s={current:i.party_color||"#4a8aba"},n={current:0},o={current:i.custom_logo_url||null},l={current:null},f={current:!!i.custom_logo_url},c={current:!1};function r(){return s.current}function p(){const m=r(),v=ae.find(k=>k.hex===m)?.name||"Custom",d=Rt[n.current]?.emoji||"🏛️",u=f.current&&(o.current||l.current),g=o.current||(l.current?URL.createObjectURL(l.current):null),y=document.getElementById("rb-name")?.value??i.faction_name??"",_=document.getElementById("rb-abbr")?.value??i.abbreviation??"",x=document.getElementById("rb-desc")?.value??"",$=ae.map(k=>{const I=m===k.hex;return`<div class="rb-color-swatch ${I?"selected":""}" data-hex="${k.hex}" style="background:${k.hex};${I?`box-shadow:0 0 8px ${k.hex}44;border:2px solid var(--text-bright);`:""}">
                ${I?'<span style="font-size:10px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.5);">✓</span>':""}
            </div>`}).join(""),C=Rt.map((k,I)=>{const S=n.current===I;return`<div class="rb-logo-item ${S?"selected":""}" data-idx="${I}" style="${S?`background:${m}15;border:2px solid ${m};box-shadow:0 0 6px ${m}33;`:""}">
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
                            <input class="pa-modal-input" id="rb-name" value="${h(y)}" maxlength="60" style="font-size:13px;font-weight:600;">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${y.length}/60 · Min 3</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Abbreviation</div>
                            <input class="pa-modal-input" id="rb-abbr" value="${h(_)}" maxlength="4" style="width:100px;font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;color:${m};">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">2-4 uppercase letters</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Description</div>
                            <textarea class="pa-modal-input" id="rb-desc" rows="3" style="resize:vertical;font-family:var(--font-ui);font-size:11px;line-height:1.5;">${h(x)}</textarea>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${x.length}/200 · Visible to all</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Color — <span style="color:${m};">${h(v)}</span></div>
                            <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;" id="rb-colors">${$}</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Logo — ${u?'<span style="color:var(--teal);">Custom</span>':"Preset"}</div>
                            <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px;margin-bottom:8px;${u?"opacity:0.3;":""}" id="rb-logos">${C}</div>
                            <!-- Custom upload section -->
                            <div style="border:1px ${u?"solid var(--teal)":"dashed var(--border-mid)"};padding:10px 14px;background:${u?"rgba(90,170,138,0.04)":"var(--bg-card)"};">
                                ${u&&g?`
                                    <div style="display:flex;align-items:center;gap:12px;">
                                        <img src="${g}" style="width:48px;height:48px;object-fit:contain;border:1px solid var(--border-main);background:var(--bg-card);" alt="Custom logo">
                                        <div style="flex:1;">
                                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--teal);font-weight:700;">CUSTOM LOGO ACTIVE</div>
                                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${l.current?l.current.name:"Saved logo"}</div>
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
                        <div style="background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${m};padding:10px;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                                <div style="width:40px;height:40px;background:${m}15;border:1.5px solid ${m};display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden;">
                                    ${u&&g?`<img src="${g}" style="width:100%;height:100%;object-fit:contain;" alt="">`:d}
                                </div>
                                <div>
                                    <div style="font-size:12px;font-weight:700;color:var(--text-bright);line-height:1.2;">${h(y||"Party Name")}</div>
                                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${m};letter-spacing:1px;">${h(_||"???")}</div>
                                </div>
                            </div>
                            <div style="font-size:9px;color:var(--text-secondary);line-height:1.5;">${h(x||"No description...")}</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);margin-bottom:3px;">BADGES</div>
                            <div style="display:flex;gap:3px;flex-wrap:wrap;">
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${m};background:${m}0a;border:1px solid ${m}25;">${h(_)}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${m};background:${m}0a;border:1px solid ${m}25;">MEMBER</span>
                            </div>
                        </div>
                        <div style="padding:6px 8px;background:${m}08;border:1px solid ${m}25;display:flex;align-items:center;gap:8px;">
                            <div style="width:20px;height:20px;background:${m};"></div>
                            <div>
                                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${m};">${h(v.toUpperCase())}</div>
                                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${m}</div>
                            </div>
                        </div>

                        <!-- Cost summary -->
                        <div style="padding:8px;background:rgba(204,85,85,0.04);border:1px solid rgba(204,85,85,0.12);margin-top:auto;">
                            <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--text-dim);margin-bottom:4px;">COST SUMMARY</div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="font-size:9px;color:var(--text-secondary);">Party Funds</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c84;">$150k</span></div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="font-size:9px;color:var(--text-secondary);">Momentum</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c55;">-10 (${e} → ${Math.max(1,e-10)})</span></div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="font-size:9px;color:var(--text-secondary);">Approval</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#c55;">-3 all blocs</span></div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;"><span style="font-size:9px;color:var(--text-secondary);">Cooldown</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#d44a4a;">120 ticks</span></div>
                            <div style="display:flex;justify-content:space-between;padding:1px 0;border-top:1px solid var(--border-main);margin-top:3px;padding-top:3px;"><span style="font-size:9px;color:#5c5;">Gain</span><span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#5c5;">"Fresh Start" modifier</span></div>
                        </div>
                    </div>
                </div>

                <div class="pa-modal-footer" style="justify-content:space-between;">
                    <div style="max-width:400px;font-size:9px;color:var(--text-secondary);line-height:1.5;" id="rb-footer-msg">
                        ${c.current?'<span style="color:#d44a4a;font-weight:700;">⚠ Final confirmation. This costs $150k, 10 Momentum, and -3 approval. Cannot rebrand again for 120 ticks.</span>':"This will change your party's identity across all UI, media, and diplomatic channels."}
                    </div>
                    <div style="display:flex;gap:6px;">
                        ${c.current?`
                            <button class="pa-modal-btn pa-modal-btn--cancel" id="rb-back">Go Back</button>
                            <button class="pa-modal-btn" id="rb-confirm" style="background:#d44a4a;color:#fff;">⚠ Confirm Rebrand</button>
                        `:`
                            <button class="pa-modal-btn pa-modal-btn--cancel" id="rb-cancel">Cancel</button>
                            <button class="pa-modal-btn pa-modal-btn--submit" id="rb-submit" style="background:#c84;">Rebrand</button>
                        `}
                    </div>
                </div>
            </div>
        `}t._rbCustomLogoFile=null,t._rbCustomLogoUrl=o.current,t._rbUseCustomLogo=f.current,p(),t.classList.add("active"),t.addEventListener("change",function(v){if(v.target.id==="rb-logo-file"){const d=v.target.files?.[0];if(!d)return;if(d.size>2*1024*1024){alert("Logo must be under 2MB. Selected file: "+(d.size/(1024*1024)).toFixed(1)+"MB"),v.target.value="";return}if(!["image/png","image/jpeg","image/svg+xml","image/webp"].includes(d.type)){alert("Unsupported file type. Use PNG, JPG, SVG, or WebP."),v.target.value="";return}l.current=d,o.current=null,f.current=!0,t._rbCustomLogoFile=d,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!0,p()}}),t.addEventListener("click",function m(v){if(v.target===t||v.target.closest("#rb-close")||v.target.closest("#rb-cancel")){t.classList.remove("active"),t.removeEventListener("click",m);return}const d=v.target.closest(".rb-color-swatch");if(d){s.current=d.dataset.hex,p();return}const u=v.target.closest(".rb-logo-item");if(u){n.current=parseInt(u.dataset.idx)||0,f.current=!1,t._rbUseCustomLogo=!1,p();return}if(v.target.closest("#rb-remove-logo")){o.current=null,l.current=null,f.current=!1,t._rbCustomLogoFile=null,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!1,p();return}if(v.target.closest("#rb-submit")){const g=document.getElementById("rb-name")?.value?.trim()||"",y=document.getElementById("rb-abbr")?.value?.trim()||"";if(g.length<3||y.length<2){alert("Name must be 3+ chars, abbreviation 2-4 chars.");return}c.current=!0,p();return}if(v.target.closest("#rb-back")){c.current=!1,p();return}if(v.target.closest("#rb-confirm")){Ke(t,a,m);return}})}async function Ke(a,t,i){const e=b.faction,s=document.getElementById("rb-name")?.value?.trim()||"",n=document.getElementById("rb-abbr")?.value?.trim()||"";document.getElementById("rb-desc")?.value?.trim();const o=document.querySelector(".rb-color-swatch.selected")?.dataset?.hex||e.party_color,l=document.querySelector(".rb-logo-item.selected")?.dataset?.idx,f=l!=null?Rt[parseInt(l)]?.emoji:null,c=a._rbCustomLogoFile,r=a._rbUseCustomLogo,p=a._rbCustomLogoUrl,m=document.getElementById("rb-confirm");m&&(m.disabled=!0,m.textContent="Rebranding...");try{const v=b.shard?.current_tick||0;let d=p;if(r&&c){const x=c.name.split(".").pop()?.toLowerCase()||"png",$=`${e.id}/logo_${Date.now()}.${x}`,{data:C,error:k}=await w.storage.from("party-logos").upload($,c,{cacheControl:"3600",upsert:!0,contentType:c.type});if(k){console.error("[Rebrand] Logo upload failed:",k.message),alert("Logo upload failed: "+k.message);return}const{data:I}=w.storage.from("party-logos").getPublicUrl($);d=I?.publicUrl||null}else r||(d=null);const u=15e4,g=e.party_funds||0;if(g<u){alert(`Not enough funds. You have $${Math.round(g/1e3)}k, need $150k.`);return}const y=g-u,_=Math.max(1,(e.momentum||0)-10);await w.from("factions").update({party_funds:y,momentum:_,faction_name:s,abbreviation:n.toUpperCase(),party_color:o,party_logo:r?null:f,custom_logo_url:d,rebrand_cooldown_until_tick:v+120}).eq("id",e.id),await w.from("campaign_actions").insert({party_id:e.id,nation_id:b.nation?.id,action_type:"rebrand",ap_cost:3,money_cost:0,tick_performed:v,result:{oldName:e.faction_name,newName:s,oldAbbr:e.abbreviation,newAbbr:n,oldColor:e.party_color,newColor:o}}),e.party_funds=y,e.momentum=_,e.faction_name=s,e.abbreviation=n.toUpperCase(),e.party_color=o,e.party_logo=r?null:f,e.custom_logo_url=d,a.classList.remove("active"),a.removeEventListener("click",i),H(t)}catch(v){console.error("[PartyActions] Rebrand error:",v),alert("Failed to rebrand: "+(v.message||v))}finally{m&&(m.disabled=!1,m.textContent="⚠ Confirm Rebrand")}}const Je=[{id:"file_lawsuit",name:"File Lawsuit",desc:"Sue a government ministry alleging corruption or negligence. 8-tick timeline with milestone events. Outcome depends on actual corruption growth since government took office.",cost:"$250k",costColor:"#c8a832",moneyCost:25e4,tags:["LEGAL","OFFENSIVE"],locked:!1}];function Xe(a){const t=D,i=W(t.first_name,t.last_name),e=ot(t.skill),s=mt?'<span style="color:#5cc55c;margin-left:6px;">✓ IN OPPOSITION</span>':'<span style="color:#c84;margin-left:6px;">⚠ IN GOVERNMENT (actions limited)</span>',n=Je.map(o=>{const l=o.tags.map(f=>`<span class="pa-action-tag" style="color:${It[f]||"var(--text-dim)"};">${f}</span>`).join("");return`
            <div class="pa-action-item ${o.locked?"locked":""}" data-action-id="${o.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${h(o.name)}</span>
                        <div class="pa-action-tags">${l}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${o.costColor};">${o.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${h(o.desc)}</div>
                ${o.locked&&o.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${h(o.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${a.color};background:${a.color}15;border-color:${a.color}33;">${i}</div>
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
                    <div style="width:40px;height:3px;background:var(--border-mid);"><div style="height:100%;width:${t.skill}%;background:${e.color};"></div></div>
                    <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${e.color};">${t.skill}</span>
                </div>
            </div>
        </div>
        ${t.background?`<div style="padding:6px 16px;border:1px solid var(--border-main);border-top:none;border-bottom:none;background:var(--bg-panel);font-size:9px;color:var(--text-dim);font-style:italic;">${h(t.background)}</div>`:""}
        <div class="pa-actions-list">
            ${n}
        </div>
        ${Qe()}
        <div class="pa-skill-footer">
            <span style="color:${a.color};font-weight:700;">${a.title}</span> skill (${t.skill}/100) affects lawsuit discovery and legal action outcomes. <span style="color:${e.color};font-weight:700;">${e.label}</span>: ${e.desc}
        </div>
    `}function Qe(){if(Nt.length===0)return"";const a=b.shard?.current_tick||0;return`
        <div class="pa-ls-section">
            <div class="pa-ls-section-title">Legal Actions</div>
            ${Nt.map(i=>{const e=wt.find(y=>y.key===i.target_ministry),s=e?e.label:i.target_ministry,n=e?e.icon:"⚖️",o=Ut(i.corruption_growth||0),l=tt[i.tier]||tt[1],f=i.status==="active",c=Math.max(0,a-i.filed_at_tick),r=8,p=Math.min(1,c/r),m=Math.max(0,i.resolves_at_tick-a),v=[{tick:0,label:"Filed",type:"filing"},{tick:2,label:"Discovery",type:"discovery"},{tick:5,label:"Evidence",type:"evidence"},{tick:7,label:"Pre-trial",type:"pre_trial"},{tick:8,label:"Verdict",type:"resolution"}],d=v.map(y=>{const _=i.filed_at_tick+y.tick,x=a>=_,$=a>=_&&(y.tick===8||a<i.filed_at_tick+v[v.indexOf(y)+1]?.tick),C=y.tick/r*100;return`<div class="pa-ls-milestone ${x?"passed":""} ${$?"current":""}" style="left:${C}%;" title="${y.label} (Tick ${_})">
                <div class="pa-ls-milestone-dot"></div>
                <div class="pa-ls-milestone-label">${y.label}</div>
            </div>`}).join("");let u="";if(!f){const y=l===tt[1]?"FRIVOLOUS":l===tt[2]?"PARTIAL WIN":l===tt[3]?"MAJOR WIN":"DEVASTATING",_=i.tier===1?"var(--red)":i.tier===2?"#ca5":i.tier===3?"#c84":"var(--green)";u=`<span class="pa-ls-tier-badge" style="color:${_};border-color:${_}44;background:${_}0a;">${y}</span>`}const g=f?"":`
            <div style="display:flex;gap:12px;margin-top:6px;font-family:var(--font-mono);font-size:8px;">
                <span style="color:${i.momentum_effect>=0?"var(--green)":"var(--red)"};">You: ${i.momentum_effect>=0?"+":""}${i.momentum_effect} Mom</span>
                <span style="color:${i.governance_effect>=0?"var(--green)":"var(--red)"};">${i.governance_effect>=0?"+":""}${i.governance_effect} Gov</span>
                <span style="color:${i.gov_momentum_effect>=0?"var(--green)":"var(--red)"};">Govt: ${i.gov_momentum_effect>=0?"+":""}${i.gov_momentum_effect} Mom</span>
            </div>
        `;return`
            <div class="pa-ls-card ${f?"active":"resolved"}">
                <div class="pa-ls-header">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${n}</span>
                        <span style="font-size:11px;font-weight:700;color:var(--text-bright);">${h(s)}</span>
                        <span class="pa-ls-tier-badge" style="color:${o.color};border-color:${o.color}44;background:${o.color}0a;">TIER ${i.tier}</span>
                        ${u}
                    </div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">
                        ${f?`${m} ticks left`:`Resolved tick ${i.resolves_at_tick}`}
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
                    Corruption growth: <span style="color:${o.color};font-weight:700;">${(i.corruption_growth||0).toFixed(1)}</span>
                    &mdash; ${h(o.label)}
                </div>
                ${g}
            </div>
        `}).join("")}
        </div>
    `}let At=!1;async function ie(a){const t=document.getElementById("pa-hire-modal");if(!t)return;const i=b.nation?.id,e=b.nation?.name;if(!i||!e)return;t.innerHTML='<div class="pa-modal"><div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Searching for candidates...</div></div>',t.classList.add("active");const s=await Te(w,i,e);let n=null;function o(){const l=n!=null?s[n]:null,f=l?ot(l.skill):null,c=s.map((m,v)=>{const d=n===v,u=ot(m.skill);return`<div class="pa-hire-row ${d?"selected":""}" data-idx="${v}">
                <div style="width:32px;height:32px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#d44a4a;flex-shrink:0;">${W(m.first_name,m.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${d?"var(--text-bright)":"var(--text-secondary)"};">${h(m.first_name)} ${h(m.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${m.skill}%;background:${u.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${u.color};">${m.skill}</span>
                    </div>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;">Age ${m.age}</div>
            </div>`}).join("");let r;l?r=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#d44a4a;">${W(l.first_name,l.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${h(l.first_name)} ${h(l.last_name)}</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:1px;">Age ${l.age} &middot; Opposition Coordinator Candidate</div>
                        </div>
                    </div>

                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">SKILL</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${l.skill}%;background:${f.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${f.color};">${l.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${f.color};margin-top:3px;font-weight:700;">${f.label}</div>
                        </div>
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">HIRE COST</div>
                            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--accent);">$${(l.hire_cost/1e3).toFixed(0)}k</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:3px;">From party funds</div>
                        </div>
                    </div>

                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">BACKGROUND</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.6;font-style:italic;">${h(l.background)}</div>
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
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-right:auto;">Cost: <span style="color:var(--accent);font-weight:700;">$${(l.hire_cost/1e3).toFixed(0)}k</span></span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-hire-confirm" style="background:#d44a4a;"${(b.faction?.party_funds||0)<l.hire_cost?' disabled title="Not enough funds"':""}>Hire ${h(l.first_name)}</button>
                </div>
            `:r=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;"><div style="text-align:center;">
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
                        ${c}
                    </div>
                    <div style="flex:1;overflow-y:auto;" id="pa-hire-detail">
                        ${r}
                    </div>
                </div>
            </div>
        `;const p=()=>t.classList.remove("active");document.getElementById("pa-hire-close")?.addEventListener("click",p),t.onclick=m=>{m.target===t&&p()},document.getElementById("pa-hire-list")?.addEventListener("click",m=>{const v=m.target.closest(".pa-hire-row");v&&(n=parseInt(v.dataset.idx,10),o())}),document.getElementById("pa-hire-confirm")?.addEventListener("click",async()=>{if(At||n==null)return;At=!0;const m=document.getElementById("pa-hire-confirm");m&&(m.disabled=!0,m.textContent="Hiring...");try{const v=b.shard?.current_tick||0,d=s[n],u=d.hire_cost||0,g=b.faction?.party_funds||0;if(u>0&&g<u){alert(`Not enough funds. You have $${Math.round(g/1e3)}k, need $${Math.round(u/1e3)}k.`);return}if(u>0){const _=g-u,{error:x}=await w.from("factions").update({party_funds:_}).eq("id",b.faction.id);if(x){alert("Failed to deduct funds.");return}b.faction.party_funds=_}const y=await Pe(w,b.faction?.id,d,v);if(!y.success){alert(y.error||"Failed to hire agitator.");return}D=y.agitator,Y="agitator",p(),H(a)}catch(v){console.error("[PartyActions] Hire agitator error:",v)}finally{At=!1,m&&(m.disabled=!1)}})}o()}let ht=!1;function Ze(a){const t=document.getElementById("pa-lawsuit-modal");if(!t)return;if(!nt){alert("No active government to file against.");return}const i=b.faction,e=D;let s=null,n=null;function o(){const l=s&&n,f=wt.map(p=>{const m=s===p.key;return`<div class="pa-lawsuit-target ${m?"selected":""}" data-target="${p.key}">
                <span style="font-size:18px;">${p.icon}</span>
                <span style="font-size:12px;font-weight:600;color:${m?"var(--text-bright)":"var(--text-secondary)"};">${h(p.label)}</span>
            </div>`}).join(""),c=ce.map(p=>{const m=n===p.key;return`<div class="pa-lawsuit-basis ${m?"selected":""}" data-basis="${p.key}">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:16px;height:16px;border-radius:50%;border:2px solid ${m?"#d44a4a":"var(--border-mid)"};display:flex;align-items:center;justify-content:center;">
                        ${m?'<div style="width:8px;height:8px;border-radius:50%;background:#d44a4a;"></div>':""}
                    </div>
                    <div>
                        <div style="font-size:14px;font-weight:600;color:${m?"var(--text-bright)":"var(--text-secondary)"};">${h(p.label)}</div>
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

                ${e?`<div style="padding:6px 16px;border-bottom:1px solid var(--border-main);background:rgba(212,74,74,0.04);display:flex;align-items:center;gap:8px;">
                    <span style="width:5px;height:5px;border-radius:50%;background:#d44a4a;display:inline-block;"></span>
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Filed by:</span>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#d44a4a;">${h(e.first_name)} ${h(e.last_name)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Skill ${e.skill}</span>
                </div>`:""}

                <div class="pa-modal-body" style="gap:16px;">
                    <div>
                        <div class="pa-modal-step-label">1 &mdash; Target Ministry</div>
                        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;" id="pa-lawsuit-targets">${f}</div>
                    </div>

                    <div>
                        <div class="pa-modal-step-label">2 &mdash; Legal Basis</div>
                        <div style="display:flex;flex-direction:column;gap:4px;" id="pa-lawsuit-bases">${c}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-lawsuit-submit" ${l?"":"disabled"} style="background:#d44a4a;">File Lawsuit</button>
                </div>
            </div>
        `;const r=()=>t.classList.remove("active");document.getElementById("pa-lawsuit-close")?.addEventListener("click",r),document.getElementById("pa-lawsuit-cancel")?.addEventListener("click",r),t.onclick=p=>{p.target===t&&r()},document.getElementById("pa-lawsuit-targets")?.addEventListener("click",p=>{const m=p.target.closest(".pa-lawsuit-target");m&&(s=m.dataset.target,o())}),document.getElementById("pa-lawsuit-bases")?.addEventListener("click",p=>{const m=p.target.closest(".pa-lawsuit-basis");m&&(n=m.dataset.basis,o())}),document.getElementById("pa-lawsuit-submit")?.addEventListener("click",async()=>{if(ht||!s||!n)return;ht=!0;const p=document.getElementById("pa-lawsuit-submit");p&&(p.disabled=!0,p.textContent="Filing...");try{const{data:v}=await w.from("factions").select("party_funds").eq("id",i.id).single(),d=v?.party_funds||0;if(d<25e4){alert(`Not enough funds. You have $${Math.round(d/1e3)}k, need $250k.`),ht=!1,p&&(p.disabled=!1,p.textContent="File Lawsuit");return}const u=d-25e4;await w.from("factions").update({party_funds:u}).eq("id",i.id),i.party_funds=u,sessionStorage.removeItem("nationhood_state");const g=b.shard?.current_tick||0,y=await Ne(w,{factionId:i?.id,nationId:b.nation?.id,agitatorId:e?.id,targetMinistry:s,basis:n,currentTick:g,partyName:i?.faction_name||"Opposition",administration:nt});if(!y.success){alert(y.error||"Failed to file lawsuit.");return}const _=Ut(y.lawsuit?.corruption_growth||0),x=tt[y.tier]||tt[1];r(),alert(`Lawsuit filed against ${wt.find($=>$.key===s)?.label||s}.
The case is now under investigation. Results will be determined when it resolves in 8 ticks.`),H(a)}catch(m){console.error("[PartyActions] File lawsuit error:",m),alert("An error occurred. Please try again.")}finally{ht=!1,p&&(p.disabled=!1,p.textContent="File Lawsuit")}})}t.classList.add("active"),o()}async function ta(a){const t=document.getElementById("pa-appoint-pm-modal");if(!t)return;const i=b.nation;b.faction;const{data:e}=await w.from("factions").select("id, faction_name, abbreviation, party_color, seats, leader_first_name, leader_last_name, leader_age").eq("nation_id",i.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),s=e||[];let n=null,o=!1;const{data:l}=await w.from("head_of_government").select("faction_id, first_name, last_name, factions(faction_name)").eq("nation_id",i.id).eq("active",!0).maybeSingle();function f(){const c=s.find(d=>d.id===n),r=l?`${l.first_name} ${l.last_name}`:null,p=l?.factions?.faction_name||null,m=l&&n===l.faction_id;t.innerHTML=`
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
                    ${r?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Current PM: <strong style="color:var(--text-bright);">${h(r)}</strong> (${h(p||"?")})</div>`:'<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--amber);">No Prime Minister appointed.</div>'}
                </div>
                <div class="pa-modal-body" style="max-height:300px;overflow-y:auto;">
                    <div class="pa-modal-step-label">Select a Party</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${s.map(d=>{const u=d.id===n,g=l&&d.id===l.faction_id,y=d.leader_first_name&&d.leader_last_name?`${d.leader_first_name} ${d.leader_last_name}`:"?";return`<div class="pa-action-item ${u?"selected":""}" data-party-id="${d.id}" style="cursor:pointer;${u?`border-color:${d.party_color||"#888"};background:${d.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${d.party_color||"#888"};"></div>
                                        <div>
                                            <div style="font-size:13px;font-weight:600;color:var(--text-bright);">${h(d.faction_name)}</div>
                                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${h(y)}, Age ${d.leader_age||"?"} · ${d.seats||0} seats</div>
                                        </div>
                                    </div>
                                    ${g?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:2px 6px;color:var(--green);background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2);">CURRENT PM</span>':""}
                                </div>
                            </div>`}).join("")}
                    </div>
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="apm-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="apm-confirm" ${!c||o||m?"disabled":""} style="background:#c8a832;">${c?m?"Already PM":`Appoint ${h(c.faction_name)}`:"Select a party"}</button>
                </div>
            </div>
        `;const v=()=>t.classList.remove("active");document.getElementById("apm-close")?.addEventListener("click",v),document.getElementById("apm-cancel")?.addEventListener("click",v),t.onclick=d=>{d.target===t&&v()},t.querySelector(".pa-modal-body")?.addEventListener("click",d=>{const u=d.target.closest("[data-party-id]");u&&(n=u.dataset.partyId,f())}),document.getElementById("apm-confirm")?.addEventListener("click",async()=>{if(!n||o)return;const d=s.find(g=>g.id===n);if(!d||!confirm(`Appoint ${d.leader_first_name} ${d.leader_last_name} of ${d.faction_name} as Prime Minister?`))return;o=!0;const u=document.getElementById("apm-confirm");u&&(u.disabled=!0,u.textContent="Appointing...");try{const g=b.shard?.current_tick||0;await w.from("head_of_government").update({active:!1}).eq("nation_id",i.id).eq("active",!0);const{error:y}=await w.from("head_of_government").insert({nation_id:i.id,faction_id:n,first_name:d.leader_first_name||"Unknown",last_name:d.leader_last_name||"Unknown",age:d.leader_age||50,ideology:"Centrist",active:!0,appointed_tick:g});if(y)throw y;try{await w.from("event_log").insert({nation_id:i.id,event_name:`${i.monarch_title||"King"} appoints Prime Minister`,category:"government",description_chosen:`${i.monarch_title||"The King"} has appointed ${d.leader_first_name} ${d.leader_last_name} of ${d.faction_name} as Prime Minister.`,fired_at_tick:g})}catch{}v(),alert(`${d.leader_first_name} ${d.leader_last_name} of ${d.faction_name} has been appointed Prime Minister.`),H(a)}catch(g){alert("Failed to appoint PM: "+(g.message||"Error")),o=!1,u&&(u.disabled=!1,u.textContent=`Appoint ${h(d.faction_name)}`)}})}t.classList.add("active"),f()}async function ea(a){const t=document.getElementById("pa-royal-modal");if(!t)return;const i=b.nation,e=b.faction,s=e.seats||0,n=i?.total_seats||100,{data:o}=await w.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",i.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),l=(o||[]).filter(m=>m.id!==e.id);let f=null;const c=Math.max(0,s-1);let r=Math.min(5,c||1);function p(){const m=l.find(d=>d.id===f);t.innerHTML=`
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
                    You currently hold <strong>${s}</strong> of ${n} seats.
                    ${s/n>.7?'<div style="color:#d44a4a;font-weight:700;margin-top:4px;">⚠ You hold >70% of seats — tyranny legitimacy decay active!</div>':""}
                </div>
                <div class="pa-modal-body">
                    <div class="pa-modal-step-label">Select Noble House</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${l.length>0?l.map(d=>{const u=d.id===f;return`<div class="pa-action-item ${u?"selected":""}" data-faction-id="${d.id}" style="cursor:pointer;${u?`border-color:${d.party_color||"#888"};background:${d.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${d.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${h(d.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${Math.max(0,d.seats||0)} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No other factions in this nation.</div>'}
                    </div>
                    ${m?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Grant</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${c}" value="${r}" id="grant-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--accent);width:40px;text-align:center;" id="grant-count">${r}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Legitimacy gain: <span style="color:#5cc55c;font-weight:700;">+${(r*.5).toFixed(1)}</span>
                                &middot; Your seats after: ${s-r} &middot; Their seats after: ${(m.seats||0)+r}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-grant" ${m?"":"disabled"} style="background:#c8a832;">Grant ${r} Seats</button>
                </div>
            </div>
        `;const v=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",v),document.getElementById("royal-cancel")?.addEventListener("click",v),t.onclick=d=>{d.target===t&&v()},t.querySelector(".pa-modal-body")?.addEventListener("click",d=>{const u=d.target.closest("[data-faction-id]");u&&(f=u.dataset.factionId,p())}),document.getElementById("grant-slider")?.addEventListener("input",d=>{r=parseInt(d.target.value)||1,document.getElementById("grant-count").textContent=r;const u=document.getElementById("royal-grant");u&&(u.textContent=`Grant ${r} Seats`)}),document.getElementById("royal-grant")?.addEventListener("click",async()=>{if(!f)return;const d=document.getElementById("royal-grant");d&&(d.disabled=!0,d.textContent="Granting...");try{const{data:u}=await w.from("factions").select("id, faction_name, seats").eq("nation_id",i.id).eq("faction_type","party").is("abandoned_at",null),g=(u||[]).find(z=>z.id===e.id),y=(u||[]).find(z=>z.id===f);if(!g||!y){alert("Faction not found.");return}const _=(u||[]).reduce((z,T)=>z+Math.max(0,T.seats||0),0),x=i?.total_seats||100,$=[];let C=r;const k=Math.min(C,Math.max(0,g.seats||0)-1);if(k>0&&(C-=k),C>0){const z=(u||[]).filter(O=>O.id!==e.id&&O.id!==f&&(O.seats||0)>0),T=z.reduce((O,R)=>O+(R.seats||0),0);if(T>0)for(const O of z){const R=Math.round(C*(O.seats||0)/T),U=Math.min(R,O.seats||0);U>0&&($.push({id:O.id,seats:(O.seats||0)-U}),C-=U)}}const I=r-C;if(I<=0){alert("No seats available to grant.");return}const S=Math.max(1,(g.seats||0)-Math.min(r-C,r)),E=(y.seats||0)+I,M=I*.5,F=Math.min(100,(Number(i.legitimacy)||50)+M);$.push({id:e.id,seats:S}),$.push({id:f,seats:E});for(const z of $){const{error:T}=await w.from("factions").update({seats:z.seats}).eq("id",z.id);if(T){alert("Failed to grant seats.");return}}const{error:A}=await w.from("nations").update({legitimacy:F}).eq("id",i.id);if(A){alert("Failed to update legitimacy.");return}e.seats=S,i.legitimacy=F;try{const z=l.find(T=>T.id===f);await w.from("event_log").insert({nation_id:i.id,event_name:`${i.monarch_title||"King"} grants ${I} seats to ${z?.faction_name||"unknown"}`,category:"government",description_chosen:`The ${i.monarch_title||"King"} has granted ${I} parliamentary seat${I!==1?"s":""} to ${z?.faction_name}. Legitimacy +${M.toFixed(1)}.`,fired_at_tick:b.shard?.current_tick||0})}catch{}v(),H(a)}catch(u){console.error("[GrantSeats] Error:",u),alert("Failed to grant seats.")}})}t.classList.add("active"),p()}async function aa(a){const t=document.getElementById("pa-royal-modal");if(!t)return;const i=b.nation,e=b.faction,{data:s}=await w.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",i.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),n=(s||[]).filter(c=>c.id!==e.id&&(c.seats||0)>0);let o=null,l=1;function f(){const c=n.find(u=>u.id===o),r=c&&c.seats||0,m=l*1e5,v=e.party_funds||0;t.innerHTML=`
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
                        ${n.length>0?n.map(u=>{const g=u.id===o;return`<div class="pa-action-item ${g?"selected":""}" data-faction-id="${u.id}" style="cursor:pointer;${g?"border-color:#d44a4a;background:rgba(212,74,74,0.04);":""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${u.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${h(u.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${u.seats} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No factions have seats to revoke.</div>'}
                    </div>
                    ${c?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Revoke</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${r}" value="${l}" id="revoke-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#d44a4a;width:40px;text-align:center;" id="revoke-count">${l}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Cost: <span style="color:#d44a4a;font-weight:700;">$${Math.round(m/1e3)}k</span>
                                &middot; Legitimacy: <span style="color:#d44a4a;font-weight:700;">-${l}</span>
                                ${v<m?'<span style="color:#d44a4a;margin-left:8px;">⚠ Not enough funds</span>':""}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-revoke" ${!c||v<m?"disabled":""} style="background:#d44a4a;">Revoke ${l} Seats</button>
                </div>
            </div>
        `;const d=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",d),document.getElementById("royal-cancel")?.addEventListener("click",d),t.onclick=u=>{u.target===t&&d()},t.querySelector(".pa-modal-body")?.addEventListener("click",u=>{const g=u.target.closest("[data-faction-id]");g&&(o=g.dataset.factionId,l=1,f())}),document.getElementById("revoke-slider")?.addEventListener("input",u=>{l=parseInt(u.target.value)||1,document.getElementById("revoke-count").textContent=l;const g=document.getElementById("royal-revoke");g&&(g.textContent=`Revoke ${l} Seats`)}),document.getElementById("royal-revoke")?.addEventListener("click",async()=>{if(!o)return;const u=document.getElementById("royal-revoke");u&&(u.disabled=!0,u.textContent="Revoking...");try{const g=n.find(A=>A.id===o),y=l*1e5,{data:_}=await w.from("factions").select("party_funds").eq("id",e.id).single(),x=_?.party_funds||0;if(x<y){alert("Not enough funds.");return}const $=x-y,C=(e.seats||0)+l,k=Math.max(0,(g?.seats||0)-l),I=l,S=Math.max(0,(Number(i.legitimacy)||50)-I),{error:E}=await w.from("factions").update({seats:C,party_funds:$}).eq("id",e.id),{error:M}=await w.from("factions").update({seats:k}).eq("id",o),{error:F}=await w.from("nations").update({legitimacy:S}).eq("id",i.id);if(E||M||F){alert("Failed to revoke seats.");return}e.seats=C,e.party_funds=$,i.legitimacy=S,sessionStorage.removeItem("nationhood_state");try{await w.from("event_log").insert({nation_id:i.id,event_name:`${i.monarch_title||"King"} revokes ${l} seats from ${g?.faction_name||"unknown"}`,category:"political",description_chosen:`The ${i.monarch_title||"King"} has revoked ${l} seat${l!==1?"s":""} from ${g?.faction_name}. Legitimacy -${I}.`,fired_at_tick:b.shard?.current_tick||0})}catch{}d(),H(a)}catch(g){console.error("[RevokeSeats] Error:",g),alert("Failed to revoke seats.")}})}t.classList.add("active"),f()}let zt=!1;async function ia(a){if(zt)return;const t=b.faction,i=t.seats||0,e=Math.max(1,t.momentum??0);if(i<=0){alert("Your party has no seats — nothing to fundraise from.");return}const s=me(i,at);if(e-s.momCost<1){alert(`Not enough momentum. You need ${s.momCost} momentum (current: ${Math.round(e)}, floor: 1). Try again next tick when momentum recovers.`);return}zt=!0;try{const{data:n}=await w.from("factions").select("party_funds, momentum").eq("id",t.id).single();n&&(t.party_funds=n.party_funds??0,t.momentum=n.momentum??0);const o=Math.max(1,t.momentum??0),l=b.shard?.current_tick||0,f=Math.max(1,o-s.momCost),c=(t.party_funds||0)+s.raised,{error:r}=await w.from("factions").update({momentum:f,party_funds:c}).eq("id",t.id);if(r){alert("Fundraise failed: "+r.message);return}await w.from("campaign_actions").insert({party_id:t.id,nation_id:b.nation?.id,action_type:"fundraise",ap_cost:0,money_cost:0,tick_performed:l,result:{raised:s.raised,perSeat:s.perSeat,momCost:s.momCost,useNumber:at+1,seats:i}}),t.momentum=f,t.party_funds=c,sessionStorage.removeItem("nationhood_state"),at++,H(a)}catch(n){console.error("[PartyActions] Fundraise error:",n),alert("Fundraise failed.")}finally{zt=!1}}function oa(a){const t=document.getElementById("pa-statement-modal");if(!t)return;const i=b.faction,e=i?.color||"#c8a832",s=i?.leader_first_name&&i?.leader_last_name?`${i.leader_first_name} ${i.leader_last_name}`:"Party Leader",n=Qt.map(r=>`<div class="pa-topic-card" data-topic="${r.id}" style="padding:8px 10px;cursor:pointer;border:1px solid var(--border-mid);display:flex;align-items:center;gap:8px;transition:all 0.12s;">
            <span style="font-size:14px;">${r.icon}</span>
            <span style="font-size:10px;font-weight:600;color:var(--text-secondary);">${h(r.label)}</span>
        </div>`).join("");t.innerHTML=`
        <div class="pa-modal" style="width:520px;">
            <div class="pa-modal-header">
                <div class="pa-modal-header-left">
                    <div class="pa-modal-dot" style="background:${e};"></div>
                    <span class="pa-modal-title">Issue Statement</span>
                </div>
                <button class="pa-modal-close" id="pa-stmt-close">&times;</button>
            </div>
            <div style="padding:8px 16px;border-bottom:1px solid var(--border-main);background:${e}08;display:flex;align-items:center;gap:8px;">
                <span style="width:5px;height:5px;border-radius:50%;background:${e};display:inline-block;"></span>
                <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-secondary);">Speaking as:</span>
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${e};">${h(s)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">&middot; Party Leader</span>
            </div>
            <div class="pa-modal-body" style="gap:14px;">
                <div>
                    <div class="pa-modal-step-label">1 &mdash; Topic</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;" id="pa-stmt-topics">${n}</div>
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
    `,t.classList.add("active");let o=null,l=!1;const f=()=>t.classList.remove("active");document.getElementById("pa-stmt-close")?.addEventListener("click",f),document.getElementById("pa-stmt-cancel")?.addEventListener("click",f),t.addEventListener("click",r=>{r.target===t&&f()}),document.getElementById("pa-stmt-topics")?.addEventListener("click",r=>{const p=r.target.closest(".pa-topic-card");p&&(o=p.dataset.topic,document.querySelectorAll(".pa-topic-card").forEach(m=>{const v=m.dataset.topic===o;m.style.borderColor=v?e:"var(--border-mid)",m.style.background=v?e+"0a":"";const d=m.querySelector("span:last-child");d&&(d.style.color=v?"var(--text-bright)":"var(--text-secondary)")}),c())});const c=()=>{const r=document.getElementById("pa-stmt-body")?.value?.trim()||"",p=document.getElementById("pa-stmt-submit"),m=document.getElementById("pa-stmt-charcount");m&&(m.textContent=`${r.length} characters`),p&&(p.disabled=!(o&&r.length>=10))};document.getElementById("pa-stmt-body")?.addEventListener("input",c),document.getElementById("pa-stmt-submit")?.addEventListener("click",async()=>{if(l)return;const r=document.getElementById("pa-stmt-body")?.value?.trim();if(!o||!r||r.length<10)return;l=!0;const p=document.getElementById("pa-stmt-submit");p&&(p.disabled=!0,p.textContent="Issuing...");try{const m=b.shard?.current_tick||0,d=Qt.find(M=>M.id===o)?.label||o,u=2e4,{data:g}=await w.from("factions").select("party_funds").eq("id",i.id).single(),y=g?.party_funds||0;if(y<u){alert(`Not enough funds. You have $${Math.round(y/1e3)}k, need $20k.`);return}const _=y-u,{error:x}=await w.from("factions").update({party_funds:_}).eq("id",i.id);if(x){alert("Failed to deduct funds: "+x.message);return}i.party_funds=_;const C=Zt[Math.floor(Math.random()*Zt.length)].replace("{party_name}",i.faction_name||"Unknown Party").replace("{leader_name}",s).replace("{topic}",d),{error:k}=await w.from("campaign_actions").insert({party_id:i.id,nation_id:b.nation?.id,action_type:"issue_statement",ap_cost:1,money_cost:0,tick_performed:m,result:{topic:o,topicLabel:d,headline:C,body:r,leaderName:s}});k&&console.error("[PartyActions] Statement log failed:",k.message);const{error:I}=await w.from("valdorian_articles").insert({nation_id:b.nation?.id,event_type:"issue_statement",tier:3,section:"politics",headline:C,subheadline:d,lede:r.substring(0,200)+(r.length>200?"...":""),body_paragraphs:JSON.stringify(r.split(/\n\n+/).filter(M=>M.trim())),quotes:JSON.stringify([{posture:"assertive",text:r.substring(0,150)}]),byline_reporter:"Political Desk",topic_tags:JSON.stringify([o]),source_event_id:"statement_"+Date.now(),tick:m});I&&console.error("[PartyActions] Article creation failed:",I.message);const{error:S}=await w.from("event_log").insert({nation_id:b.nation?.id,event_name:C,category:"political",description_chosen:`${i.faction_name} issues the following statement regarding ${d}: "${r}"`,fired_at_tick:m});S&&console.warn("[Statement] event_log insert failed:",S.message);const{error:E}=await w.from("admin_timeline_events").insert({nation_id:b.nation?.id,tick:m,type:"communications",title:"Statement Issued",description:`${s} issued a public statement on ${d}: "${r.substring(0,120)}${r.length>120?"...":""}"`});E&&console.warn("[Statement] timeline insert failed:",E.message),f(),H(a)}catch(m){console.error("[PartyActions] Statement error:",m),alert("Failed to issue statement. Please try again.")}finally{l=!1,p&&(p.disabled=!1,p.textContent="Issue Statement")}})}const Et=20;function na(a){const t=document.getElementById("pa-platform-modal");if(!t)return;const i=b.faction;b.nation;const e=i?.color||"#c8a832";let s=null,n=!1;const o={};for(const c of kt)c.faction_id!==i?.id&&(o[c.platform_key]=(o[c.platform_key]||0)+1);const l=new Set(X.map(c=>c.platform_key));function f(){const c=yt.find(v=>v.id===s),r=c?Kt(o[c.id]||0):null;c&&kt.filter(v=>v.platform_key===c.id&&v.faction_id!==i?.id);const p=yt.map(v=>{const d=s===v.id,u=l.has(v.id),g=Kt(o[v.id]||0),y=o[v.id]||0;return`<div class="pa-plat-card ${d?"selected":""} ${u?"adopted":""}" data-plat="${v.id}">
                ${u?'<div class="pa-plat-active-badge">ACTIVE</div>':""}
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <span style="font-size:14px;">${v.icon}</span>
                    <span style="font-size:10px;font-weight:700;color:${u?e:d?"var(--text-bright)":"var(--text-secondary)"};line-height:1.2;">${h(v.name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.4;margin-bottom:6px;">${h(v.tagline)}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${g.color};">${g.label}</span>
                    ${y>0?`<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 3px;color:var(--text-dim);border:1px solid var(--border-mid);">${y} rival${y>1?"s":""}</span>`:""}
                </div>
            </div>`}).join("");let m;if(!c)m=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;">
                <div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:24px;color:var(--border-mid);margin-bottom:8px;">←</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Select a platform to review</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:4px;">16 platforms available</div>
                </div>
            </div>`;else{const v=c.improve.map(_=>{const x=Wt(_,"improve");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(92,204,92,0.05);border:1px solid rgba(92,204,92,0.15);color:${x.color};white-space:nowrap;">${x.arrow} ${Yt[_]||_}</span>`}).join(""),d=c.worsen.map(_=>{const x=Wt(_,"worsen");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(204,85,85,0.05);border:1px solid rgba(204,85,85,0.15);color:${x.color};white-space:nowrap;">${x.arrow} ${Yt[_]||_}</span>`}).join(""),u=l.has(c.id),g=X.length;let y;u?y=`<div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${e};display:flex;align-items:center;gap:6px;">✓ CURRENT PLATFORM</div>`:g>=3?y='<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">All 3 platform slots are full.</div>':n?y=`<div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:#ca5;font-weight:700;">⚠ Confirm: Adopt ${h(c.name)}?</span>
                    <div style="display:flex;gap:6px;">
                        <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-plat-conf-cancel">Cancel</button>
                        <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-conf-yes">Confirm</button>
                    </div>
                </div>`:y=`<div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Costs 2 AP. Stats locked at current values. 6-tick cooldown.</span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-adopt" style="background:${e};">Adopt Platform</button>
                </div>`,m=`
                <div style="padding:16px 20px 12px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                        <span style="font-size:22px;">${c.icon}</span>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${h(c.name)}</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.04em;margin-top:1px;">${h(c.tagline.toUpperCase())}</div>
                        </div>
                    </div>
                    <div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">${h(c.desc)}</div>
                </div>
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);background:var(--bg-card);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">MOMENTUM GAIN</div>
                            <div style="display:flex;align-items:baseline;gap:6px;">
                                <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${r.color};">${r.label}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);">${h(r.note)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="flex:1;padding:12px 20px;overflow-y:auto;">
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.1em;color:var(--green);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--green);display:inline-block;"></span>
                            PROMISES TO IMPROVE <span style="font-weight:400;color:var(--text-dim);">(${c.improve.length} stats, +${Et} target)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${v}</div>
                    </div>
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.1em;color:var(--red);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--red);display:inline-block;"></span>
                            LIKELY SIDE EFFECTS <span style="font-weight:400;color:var(--text-dim);">(${c.worsen.length} stats)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${d}</div>
                    </div>
                    <div style="padding:10px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.15);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#ca5;letter-spacing:0.06em;margin-bottom:4px;">⚠ TRADEOFF</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.5;">${h(c.tradeoff)}</div>
                    </div>
                    <div style="margin-top:12px;padding:8px 12px;background:var(--bg-card);border:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">PROMISE RULES</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">
                            Stats are locked at current values when adopted. If your party enters government, you have <strong style="color:var(--text-bright);">24 ticks</strong> to move each promised stat by <strong style="color:var(--text-bright);">+${Et}</strong>. Failure: <strong style="color:var(--red);">-20 Momentum, -10 Governance</strong>. If you don't enter government, the promise abates.
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
                            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:0.12em;color:${e};">SET PARTY PLATFORM</span>
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
                        ${m}
                    </div>
                </div>
            </div>
        `,document.getElementById("pa-plat-close")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=v=>{v.target===t&&t.classList.remove("active")},document.getElementById("pa-plat-grid")?.addEventListener("click",v=>{const d=v.target.closest(".pa-plat-card");d&&(s=d.dataset.plat,n=!1,f())}),document.getElementById("pa-plat-adopt")?.addEventListener("click",()=>{n=!0,f()}),document.getElementById("pa-plat-conf-cancel")?.addEventListener("click",()=>{n=!1,f()}),document.getElementById("pa-plat-conf-yes")?.addEventListener("click",()=>sa(a,s))}t.classList.add("active"),f()}let _t=!1;async function sa(a,t){if(_t)return;_t=!0;const i=document.getElementById("pa-platform-modal"),e=b.faction,s=b.nation;if(!e||!s||!t){_t=!1;return}const n=yt.find(c=>c.id===t);if(!n)return;const o={},l={},f=c=>qt.has(c);for(const c of n.improve){const r=Number(s[c]??50);o[c]=r,f(c)?l[c]=Math.max(0,r-Et):l[c]=Math.min(100,r+Et)}try{const c=b.shard?.current_tick||0,{data:r,error:p}=await w.rpc("adopt_platform",{p_faction_id:e.id,p_nation_id:s.id,p_platform_key:t,p_tick:c,p_baseline_stats:o,p_target_stats:l});if(p){console.error("[PartyActions] Platform adoption failed:",p.message),alert("Failed to adopt platform: "+p.message);return}if(r&&!r.success){alert(r.error||"Failed to adopt platform.");return}const m=r?.slot||X.length+1;X.push({faction_id:e.id,nation_id:s.id,platform_key:t,slot:m,adopted_at_tick:c,baseline_stats:o,target_stats:l,status:"active"}),kt.push(X[X.length-1]),e&&r?.momentum_gained&&(e.momentum=(e.momentum||0)+r.momentum_gained),e&&(e.action_points=Math.max(0,(e.action_points||0)-2)),i?.classList.remove("active"),H(a)}catch(c){console.error("[PartyActions] Platform adoption error:",c),alert("An error occurred. Please try again.")}finally{_t=!1}}let xt=null,ge={isOpposition:!0,administration:null,governanceScore:0,governanceDeltas:[],governanceMultiplier:1,governanceDecayCycles:0,ticksInPower:0,myFaction:null,allParties:[],rivalParties:[],factionIdeology:{},electoralStandings:[],recentActivity:[],caucuses:[],nextElection:null,nextElectionTicks:null,ideologyAxes:[]};function j(a){if(!a)return"";const t=document.createElement("div");return t.textContent=a,t.innerHTML}const ra=[...Ee,...Ce];function la(a,t,i,e){const s=e-(i||e);if(!t)return{score:0,deltas:[],decayCycles:0,multiplier:1,ticksInPower:s};let n=0,o=0;const l=[];for(const p of ra){const m=Ie(p);if(m===0)continue;const v=Number(t[p]??0),d=Number(a[p]??0),u=d-v;if(u===0)continue;const g=u*m,y=g>0;l.push({key:p,start:v,now:d,delta:u,signed:g,dir:m,isGood:y}),n+=g,o++}let f=o>0?n/o:0;const c=Math.floor(s/24),r=f>0?Math.pow(.97,c):1;return f*=r,{score:Math.round(f*10)/10,deltas:l,decayCycles:c,multiplier:r,ticksInPower:s}}function da(a,t,i){return ke.map(e=>{const s=t[a],o=((s?Number(s[e.key]??0):0)+100)/200,l=i.map(f=>{const c=t[f.id],r=c?Number(c[e.key]??0):0;return{id:f.id,pos:(r+100)/200,color:f.party_color||"#666"}});return{key:e.key,name:`${e.leftLabel} / ${e.rightLabel}`,left:e.leftLabel.toUpperCase(),right:e.rightLabel.toUpperCase(),leftColor:e.leftColor,rightColor:e.rightColor,yourPos:o,parties:l}})}async function ca(a,t,i){xt=t;const e=document.getElementById(i);if(!e)return;const s=t.faction,n=t.nation,o=n?.id,l=s?.id;if(!s||!o){e.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">No faction data.</div>';return}e.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Loading party overview...</div>';try{const f=t.shard?.current_tick||0,[c,r,p,m,v,d,u]=await Promise.all([le(a,o,l),a.from("factions").select("*").eq("nation_id",o).eq("faction_type","party"),a.from("faction_ideology").select("*"),a.from("faction_electoral_standing").select("*").eq("nation_id",o),a.from("campaign_actions").select("*").eq("party_id",l).order("tick_performed",{ascending:!1}).limit(20),a.from("caucus_factions").select("*").eq("party_id",l).eq("is_active",!0),a.from("elections").select("*").eq("nation_id",o).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(1)]);r.error&&console.error("[PartyOverview] Parties fetch error:",r.error.message),p.error&&console.error("[PartyOverview] Ideology fetch error:",p.error.message),m.error&&console.error("[PartyOverview] Standings fetch error:",m.error.message),v.error&&console.error("[PartyOverview] Activity fetch error:",v.error.message),d.error&&console.error("[PartyOverview] Caucus fetch error:",d.error.message),u.error&&console.error("[PartyOverview] Election fetch error:",u.error.message);const g=r.data||[],y=c.administration,_={};for(const I of p.data||[])_[I.faction_id]=I;let x={score:0,deltas:[],decayCycles:0,multiplier:1,ticksInPower:0};y&&y.stats_at_start&&(x=la(n,y.stats_at_start,y.started_at_tick,f));const $=(u.data||[])[0]||null,C=$?Math.max(0,$.election_tick-f):null,k=da(l,_,g);ge={isOpposition:c.isOpposition,administration:y,governanceScore:x.score,governanceDeltas:x.deltas.sort((I,S)=>Math.abs(S.signed)-Math.abs(I.signed)),governanceMultiplier:x.multiplier,governanceDecayCycles:x.decayCycles,ticksInPower:x.ticksInPower,myFaction:s,allParties:g,rivalParties:g.filter(I=>I.id!==l),factionIdeology:_,electoralStandings:m.data||[],recentActivity:v.data||[],caucuses:d.data||[],nextElection:$,nextElectionTicks:C,ideologyAxes:k},ye(e)}catch(f){console.error("[PartyOverview] Init error:",f),e.innerHTML='<div style="padding:40px;text-align:center;color:var(--red);font-family:var(--font-mono);font-size:10px;">Failed to load party overview.</div>'}}let Z=[];function ye(a){const t=ge,i=t.myFaction,e=xt.nation,s=i?.party_color||i?.color||"#c8a832";xt.shard?.current_tick,Z.length===0&&(Z=[i?.id,...t.rivalParties.map(r=>r.id)]),t.administration?.admin_name||t.isOpposition;const n=t.isOpposition?"OPPOSITION":"GOVERNING",o=t.isOpposition?"var(--orange)":"var(--green)",l=i?.seats||0,f=e?.total_seats||100,c=i?.momentum??50;a.innerHTML=`<div class="po-page">
        ${pa(t,s,l,f,c)}
        <div class="po-columns">
            <div class="po-col-left">
                ${ma(t,i,s,n,o)}
                ${fa(t)}
                ${va(t,i,s)}
                ${ua(t)}
            </div>
            <div class="po-col-center" id="po-center-col">
                ${ga(t,c)}
                ${ya(t)}
            </div>
            <div class="po-col-right" id="po-right-col">
                ${xa(t,i)}
                ${ba(t)}
                ${ha()}
            </div>
        </div>
    </div>`,a.querySelectorAll(".po-legend-item").forEach(r=>{r.addEventListener("click",()=>{const p=r.dataset.partyId;p!==i?.id&&(Z.includes(p)?Z=Z.filter(m=>m!==p):Z.push(p),ye(a))})})}function pa(a,t,i,e,s){const n=a.governanceScore,o=n>=0?"var(--green)":"var(--red)",l=a.isOpposition?"Opposition":a.administration?.admin_name||"Government",f=a.nextElectionTicks!=null?a.nextElectionTicks:"—",c=typeof f=="number"&&f<=3?"var(--red)":"var(--text-bright)";return`<div class="po-summary">
        <div class="po-summary-cell" style="display:flex;flex-direction:row;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;background:${t};"></div>
            <div>
                <div style="font-size:11px;font-weight:700;color:var(--text-bright);">${j(l)}</div>
                <div class="po-summary-sub">${a.ticksInPower} ticks in power</div>
            </div>
        </div>
        <div class="po-summary-cell" style="text-align:center;">
            <div class="po-summary-label">GOV. SCORE</div>
            <div class="po-summary-value" style="color:${o};">${n}</div>
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
                <span class="po-summary-value" style="color:${t};">${i}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/ ${e}</span>
            </div>
        </div>
        <div class="po-summary-cell" style="text-align:center;">
            <div class="po-summary-label">NEXT ELECTION</div>
            <div class="po-summary-value" style="color:${c};">${f}${typeof f=="number"?" ticks":""}</div>
        </div>
    </div>`}function ma(a,t,i,e,s){const n=t?.leader_first_name&&t?.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown",o=((t?.leader_first_name||"?")[0]+(t?.leader_last_name||"?")[0]).toUpperCase();t?.leader_age&&`${t.leader_age}`;const l=t?.approval_rating??0;return`<div class="po-card po-identity" style="border-left-color:${i};">
        <div class="po-identity-inner">
            <div class="po-identity-logo" style="color:${i};background:${i}12;border-color:${i}33;">${o}</div>
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                    <span class="po-identity-name">${j(t?.faction_name)}</span>
                    <span class="po-identity-badge" style="color:${s};background:${s}0a;border-color:${s}44;">${e}</span>
                </div>
                <div class="po-identity-meta">${a.ticksInPower} ticks in power</div>
                <div class="po-leader-row">
                    <div class="po-leader-avatar" style="color:${i};background:${i}15;border-color:${i}33;">${o}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-size:10px;font-weight:600;color:var(--text-bright);">${j(n)}</span>
                            <span style="font-family:var(--font-mono);font-size:7px;color:${i};">PARTY LEADER</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">APPROVAL</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--amber);">${l}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`}function fa(a){const t=a.governanceDeltas.slice(0,12),i=a.governanceScore,e=i>=0?"var(--green)":"var(--red)",s=a.governanceDecayCycles>0&&i>0?`Decay: ${((1-a.governanceMultiplier)*100).toFixed(1)}% (${a.governanceDecayCycles} cycles)`:"",n=t.map((o,l)=>{const f=o.isGood?"var(--green)":"var(--red)",c=o.delta>0?"+":"",r=o.key.replace(/_/g," ").replace(/\b\w/g,p=>p.toUpperCase());return`<div class="po-gov-row" style="${l<t.length-1?"border-bottom:1px solid rgba(200,196,184,0.03);":""}">
            <span class="po-gov-stat">${j(r)}</span>
            <span class="po-gov-val">${o.start.toFixed(1)}</span>
            <span class="po-gov-val">${o.now.toFixed(1)}</span>
            <span class="po-gov-delta" style="color:${f};">${c}${o.delta.toFixed(1)}</span>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <div style="display:flex;align-items:center;gap:6px;">
                <span class="po-card-title">GOVERNANCE</span>
                <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${e};">${i}</span>
            </div>
            <span class="po-card-subtitle">${s}</span>
        </div>
        <div style="display:flex;padding:4px 12px;border-bottom:1px solid var(--border-main);background:var(--bg-card);">
            <span style="flex:1;font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.04em;">STAT</span>
            <span style="width:40px;font-family:var(--font-mono);font-size:6px;color:var(--text-dim);text-align:right;">START</span>
            <span style="width:40px;font-family:var(--font-mono);font-size:6px;color:var(--text-dim);text-align:right;">NOW</span>
            <span style="width:44px;font-family:var(--font-mono);font-size:6px;color:var(--text-dim);text-align:right;">DELTA</span>
        </div>
        ${n||'<div style="padding:12px;text-align:center;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);font-style:italic;">No governance data yet.</div>'}
    </div>`}function va(a,t,i){const s=[{id:t?.id,name:"You",color:i},...a.rivalParties.map(o=>({id:o.id,name:o.abbreviation||o.faction_name?.slice(0,3)||"?",color:o.party_color||"#666"}))].map(o=>{const l=Z.includes(o.id);return`<div class="po-legend-item ${l?"active":"inactive"}" data-party-id="${o.id}" style="${l?`background:${o.color}12;border-color:${o.color}44;`:""}">
            <div class="po-legend-dot" style="background:${l?o.color:"var(--text-dim)"};"></div>
            <span class="po-legend-name">${j(o.name)}</span>
        </div>`}).join(""),n=a.ideologyAxes.map(o=>{const l=o.parties.filter(c=>Z.includes(c.id)).map(c=>`<div class="po-axis-dot" style="left:${c.pos*100}%;background:${c.color};"></div>`).join(""),f=[20,40,60,80].map(c=>`<div class="po-axis-zone" style="left:${c}%;"></div>`).join("");return`<div class="po-axis">
            <div class="po-axis-labels">
                <span class="po-axis-label">${j(o.left)}</span>
                <span class="po-axis-name">${j(o.name)}</span>
                <span class="po-axis-label">${j(o.right)}</span>
            </div>
            <div class="po-axis-track">${f}${l}</div>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">IDEOLOGY</span>
        </div>
        <div style="padding:8px 12px;">
            <div class="po-legend">${s}</div>
            ${n}
        </div>
    </div>`}function ua(a){const t=(a.caucuses||[]).filter(s=>s.name&&s.name!=="Unnamed");if(t.length===0)return`<div class="po-card">
            <div class="po-card-header">
                <span class="po-card-title">INTERNAL CAUCUSES</span>
                <span class="po-card-subtitle">None</span>
            </div>
        </div>`;const i=a.faction?.seats||0,e=t.map(s=>{const n=s.relationship_score??50,o=n>60?"var(--green)":n>40?"var(--amber)":"var(--red)",l=Math.round((s.seat_share||0)*i),f=(s.dominant_axis||"").replace(/_/g,"/"),c=s.wing_end==="left"?f.split("/")[0]:f.split("/")[1]||"";return`<div class="po-caucus-row">
            <div>
                <div class="po-caucus-name">${j(s.name)}</div>
                <div class="po-caucus-wing" style="color:var(--text-dim);">${j(c)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="po-caucus-seats">${l} seats</span>
                <div style="width:50px;">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;margin-bottom:1px;">LOYALTY</div>
                    <div style="width:100%;height:3px;background:var(--border-main);"><div style="height:100%;width:${n}%;background:${o};"></div></div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${o};text-align:right;margin-top:1px;">${n}</div>
                </div>
            </div>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">INTERNAL CAUCUSES</span>
            <span class="po-card-subtitle">${t.length} active · ${i} seats</span>
        </div>
        ${e}
    </div>`}function ga(a,t){const e=Math.round(t*8/100*10)/10,s=Math.min(100,Math.max(0,t)),n=t>=60?"var(--green)":t>=30?"var(--orange)":"var(--red)";return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">MOMENTUM</span>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--red);">losing ${e}/tick</span>
        </div>
        <div style="padding:10px 12px;">
            <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:6px;">
                <span style="font-family:var(--font-mono);font-size:28px;font-weight:700;color:${n};">${t}</span>
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">/ 100</span>
            </div>
            <div style="width:100%;height:4px;background:var(--border-main);">
                <div style="height:100%;width:${s}%;background:${n};"></div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:4px;">
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">Decays 8%/tick</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-secondary);">30% of election outcome</span>
            </div>
        </div>
    </div>`}function ya(a){const t=a.recentActivity||[],i=xt.shard?.current_tick||0;if(t.length===0)return`<div class="po-card" style="flex:1;">
            <div class="po-card-header">
                <span class="po-card-title">RECENT ACTIVITY</span>
            </div>
            <div style="padding:24px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No recent actions.</div>
        </div>`;const e={rally:"Rally",press_conference:"Press Conference",attack:"Attack Ad",issue_statement:"Statement",ideological_pivot:"Ideology Shift",take_stance:"Took Stance",poll_now:"Polled",endorse:"Endorsement",lobby:"Lobby"};return`<div class="po-card" style="flex:1;">
        <div class="po-card-header">
            <span class="po-card-title">RECENT ACTIVITY</span>
        </div>
        <div style="max-height:380px;overflow-y:auto;">${t.map(n=>{const o=i-(n.tick_performed||0),l=o===0?"0t":o+"t",f=n.result||{},c=f.momentumDelta||f.momentum_delta||(f.effects||[]).reduce((d,u)=>d+(u.stat==="Momentum"?u.value:0),0)||0,r=c>0?"+":"",p=c>0?"var(--green)":c<0?"var(--red)":"var(--text-dim)";let v=e[n.action_type]||n.action_type?.replace(/_/g," ")||"?";return n.action_type==="rally"?v="Rally: "+(f.outcomeName||"Unknown")+(c?" ("+r+c+")":""):n.action_type==="press_conference"?v="Press Conference ("+r+c+")":n.action_type==="attack"?v="Attack on "+(f.targetName||"rival"):n.action_type==="issue_statement"?v="Issued statement"+(c?" ("+r+c+")":""):n.action_type==="take_stance"?v="Took stance on "+(f.issueLabel||"issue"):n.action_type==="ideological_pivot"?v="Ideology shift: "+(f.targetAxis||""):n.action_type==="poll_now"&&(v="Polled (margin: "+(f.pollMargin||"?")+")"),`<div style="padding:5px 12px;border-bottom:1px solid rgba(200,196,184,0.03);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:9px;color:var(--text-secondary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:8px;">${j(v)}</span>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${p};">${c!==0?r+c:"—"}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);width:20px;text-align:right;">${l}</span>
            </div>
        </div>`}).join("")}</div>
    </div>`}function xa(a,t){const i=a.rivalParties,e=a.administration,s=new Set((Array.isArray(e?.coalition_parties)?e.coalition_parties:[]).map(r=>r?typeof r=="string"?r:typeof r=="object"&&(r.party_id||r.id)||null:null).filter(Boolean)),n=e?.pm_party_id,o=xt.nation?.total_seats||100,l=["SEC/FRE","TRA/PRO","IND/COL","LIB/EQL","GLB/NAT"],f=["security_freedom","tradition_progress","individualism_collectivism","liberty_equality","globalism_nationalism"],c=i.map(r=>{const p=r.party_color||"#666",m=r.abbreviation||r.faction_name?.slice(0,3)?.toUpperCase()||"?",v=r.leader_first_name&&r.leader_last_name?`${r.leader_first_name} ${r.leader_last_name}`:"Unknown",d=r.seats||0,u=r.id===n,g=s.has(r.id);let y,_;u?(y="GOVERNING — LEAD",_="var(--green)"):g?(y="GOVERNING — JUNIOR",_="var(--green)"):(y="OPPOSITION",_="var(--orange)");const x=d-(t?.seats||0),$=x>0?"var(--green)":x<0?"var(--red)":"var(--text-dim)",C=a.factionIdeology[r.id],k=f.map((I,S)=>{const M=((C?Number(C[I]??0):0)+100)/200;return`<div style="display:flex;align-items:center;gap:6px;">
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);width:42px;text-align:right;">${l[S]}</span>
                <div style="flex:1;height:5px;background:var(--border-main);position:relative;">
                    <div style="position:absolute;top:50%;left:${M*100}%;transform:translate(-50%,-50%);width:8px;height:8px;border-radius:50%;background:${p};"></div>
                </div>
            </div>`}).join("");return`<div style="padding:12px 16px;border-bottom:1px solid var(--border-main);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:36px;height:36px;background:${p}15;border:1px solid ${p}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${p};">${j(m)}</div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:var(--text-bright);">${j(r.faction_name)}</div>
                        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${j(v)}</div>
                    </div>
                </div>
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 7px;color:${_};background:${_}0a;border:1px solid ${_}44;white-space:nowrap;">${y}</span>
            </div>
            <div style="display:flex;gap:10px;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">SEATS</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${d>0?"var(--text-bright)":"var(--text-dim)"};">${d}</span>
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">/ ${o}</span>
                </div>
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">VS YOU</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${$};">${x>0?"+":""}${x}</span>
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:3px;">${k}</div>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">RIVAL PARTIES</span>
            <span class="po-card-subtitle">${i.length} parties</span>
        </div>
        ${c||'<div style="padding:16px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No rival parties.</div>'}
    </div>`}function ba(a){return`<div class="po-card" style="padding:8px 12px;">
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
    </div>`}function ha(){return`<div style="background:var(--bg-card);border:1px solid var(--border-main);padding:8px 12px;">
        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.6;">
            <span style="color:var(--amber);font-weight:700;">⚠ INCUMBENCY DECAY:</span> Positive governance scores erode 3% every 24 ticks. Long-serving governments must keep delivering results.
            <span style="color:var(--text-bright);font-weight:700;"> Momentum resets to 0</span> after every election. Rebuild each cycle.
        </div>
    </div>`}let L=null,N=null,lt=!1,ft=null,q=[],it=[],J=0,Q=0,Ct=null,dt=0,ct=[],Tt=!1,ut=null,G={},Pt=!1;function gt(a){if(!a)return"";const t=document.createElement("div");return t.textContent=a,t.innerHTML}const _a=6,$a=4;async function xe(a,t){L=a,N=t;const i=t.nation,e=t.faction;if(!i||!e)return{needed:!1};const[s,n,o,l]=await Promise.all([a.from("elections").select("id, election_type, election_tick, status").eq("nation_id",i.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),a.from("shard").select("current_tick").eq("name","Alpha Shard").single(),a.from("government_formations").select("id").eq("nation_id",i.id).eq("status","formed").order("formed_at",{ascending:!1}).limit(1).maybeSingle(),a.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",i.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1})]);dt=n.data?.current_tick??0,q=l.data||[],J=q.reduce((r,p)=>r+(p.seats||0),0),Q=Math.ceil(J/2)+1;const f=s.data,c=!!o.data;return f&&!c?(lt=!0,ft=f.id,Ct=f.election_tick):(lt=!c,f&&(ft=f.id,Ct=f.election_tick)),{needed:lt}}async function st(a){if(!a)return;const t=N.nation?.id;if(t){const{count:x}=await L.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",t).eq("is_active",!0).is("party_id",null);if(x&&x>=5){const{data:$}=await L.from("government_formations").select("*").eq("nation_id",t).not("ministry_assignments","eq","{}").order("created_at",{ascending:!1}).limit(1).maybeSingle();if($&&$.ministry_assignments&&Object.keys($.ministry_assignments).length>=5){$.status!=="formed"&&(await L.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",$.id),await L.from("government_formations").update({status:"cancelled"}).eq("nation_id",t).eq("status","active").neq("id",$.id)),G=$.ministry_assignments,await Vt(t);const C=$.ministry_assignments.prime_minister;if(C)try{await re(L,t,C,dt,{skipCoalitionCheck:!0})}catch(k){console.warn("[Coalition] PM appointment during repair failed:",k.message)}lt=!1,a.innerHTML=`<div class="cf-page">
                    <div class="cf-no-formation">
                        <div class="cf-no-icon">✓</div>
                        <div class="cf-no-title">Government Formed — Cabinet Populated</div>
                        <div class="cf-no-desc">Ministry assignments have been applied. Refresh the Government page to see your cabinet.</div>
                    </div>
                </div>`;return}}}const i=(N.nation?.government_type||"").toLowerCase();if(i.includes("absolute")&&i.includes("monarchy")){a.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#128081;</div>
                <div class="cf-no-title">Absolute Monarchy</div>
                <div class="cf-no-desc">The Crown rules by decree. There are no elections.</div>
            </div>
        </div>`;return}if(!lt){a.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">✓</div>
                <div class="cf-no-title">Government Formed</div>
                <div class="cf-no-desc">A coalition government is currently active. No formation needed.</div>
            </div>
        </div>`;return}if(!ft){const x=N.nation?.id;let $="?";if(x){const{data:C}=await L.from("elections").select("election_tick").eq("nation_id",x).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(1).maybeSingle();C&&($=Math.max(0,C.election_tick-dt))}a.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon" style="font-size:2rem;">&#9878;</div>
                <div class="cf-no-title">No Government</div>
                <div class="cf-no-desc">No election has been held yet. The first election is in <strong style="color:var(--accent);">${$}</strong> tick${$!==1?"s":""}.</div>
            </div>
        </div>`;return}await Ma();const e=N.faction,n=(N.nation?.failed_formation_attempts||0)>=1?$a:_a,o=Ct!==null?Math.max(0,dt-Ct):0,l=Math.max(0,n-o),f=Math.min(100,o/n*100),c=o*2;let r="safe";l<=1?r="critical":l<=2&&(r="warning");const p=r==="critical"?"⚠️":r==="warning"?"⏳":"🤝",m=r==="critical"?"No Government — Snap Election Imminent":r==="warning"?"Coalition Formation — Time Running Out":"Coalition Formation In Progress",v=r==="critical"?"Form a government immediately or face snap elections":r==="warning"?"Parties are negotiating — the deadline is approaching":"Parties are negotiating a coalition — propose or join one below",d=q.find(x=>x.id===e.id)?.seats||0,u=d>0,g=it.some(x=>x.proposed_by===e.id);let y="";if(!u)y='<div class="cf-note">Your party has <strong>0 seats</strong>. You cannot propose a coalition, but you may be invited to one.</div>';else if(g)y='<div class="cf-note">You have already submitted a proposal for this election.</div>';else{const x=q.map($=>{const C=$.id===e.id,k=$.seats||0,I=$.party_color||"#888";return`<div class="cf-party-check ${C?"checked disabled":""}" data-party-id="${$.id}" style="border-left:3px solid ${I};">
                <div class="cf-check-box">${C?"✓":""}</div>
                <span class="cf-check-name">${gt($.faction_name)}</span>
                <span class="cf-check-seats">${k} seats</span>
            </div>`}).join("");y=`
            <div class="cf-propose-section">
                <div class="cf-section-title">Propose a Government</div>
                <div class="cf-section-desc">Select which parties will form the coalition. You need ${Q}+ seats for a majority.</div>
                <div class="cf-party-grid" id="cf-party-grid">${x}</div>
                <div class="cf-seat-preview" id="cf-seat-preview">
                    Coalition seats: <span class="cf-preview-val" id="cf-preview-seats">${d}</span> / ${J}
                    (<span id="cf-preview-pct">${J?Math.round(d/J*100):0}</span>%)
                    <span id="cf-preview-threshold" style="margin-left:8px;color:var(--text-dim);">— needs ${Q} seats</span>
                </div>
                <button class="cf-submit-btn" id="cf-propose-btn">Submit Proposal</button>
            </div>`}const _=it.length>0?`
        <div class="cf-section-title" style="margin-top:16px;">Active Proposals</div>
        <div class="cf-proposals-grid">${it.map(x=>{const $=q.find(R=>R.id===x.proposed_by),C=x.party_ids||[],k=C.reduce((R,U)=>R+(q.find(B=>B.id===U)?.seats||0),0),I=J?Math.round(k/J*100):0,S=k>=Q,E=C.map(R=>{const U=q.find(B=>B.id===R);return`<span class="cf-party-chip" style="border-left:2px solid ${U?.party_color||"#888"};">${gt(U?.faction_name||"?")} · ${U?.seats||0}</span>`}).join("");let M="";x.iAmSupporting?M='<span class="cf-status cf-status--supporting">✓ SUPPORTING</span>':x.iAmInvited?M='<span class="cf-status cf-status--invited">INVITED</span>':M='<span class="cf-status cf-status--locked">NOT INVITED</span>';const F=x.iAmInvited&&!x.iAmSupporting?`<button class="cf-support-btn" data-formation-id="${x.id}" data-action="support">Support This Coalition</button>`:x.iAmSupporting?`<button class="cf-withdraw-btn" data-formation-id="${x.id}" data-action="withdraw">Withdraw Support</button>`:"",A=x.supportCount>=x.coalitionSize,z=ut===x.id,T=A&&x.iAmInvited&&!z,O=A&&z;return`<div class="cf-proposal-card ${x.iAmSupporting?"supporting":""} ${x.iAmInvited?"":"not-invited"}">
                <div class="cf-proposal-title">${gt($?.faction_name||"Unknown")} Coalition ${M}</div>
                <div class="cf-proposal-seats">Seats: <span style="color:${S?"var(--green)":"var(--red)"};">${k}</span> (${I}%) ${S?"✓":"— below threshold"}</div>
                <div class="cf-proposal-chips">${E}</div>
                <div class="cf-proposal-support">Support: ${x.supportCount} / ${x.coalitionSize} coalition members ${A?'<span style="color:var(--green);font-weight:700;"> — UNANIMOUS</span>':""}</div>
                ${F}
                ${T?`<button class="cf-support-btn" data-formation-id="${x.id}" data-action="configure" style="margin-top:6px;background:var(--green);color:#000;border-color:var(--green);">Configure Government &amp; Assign Ministries</button>`:""}
                ${O?Ea(x):""}
            </div>`}).join("")}</div>
    `:"";a.innerHTML=`<div class="cf-page">
        <!-- Formation Banner -->
        <div class="cf-banner cf-banner--${r}">
            <div class="cf-banner-header">
                <span class="cf-banner-icon">${p}</span>
                <div>
                    <div class="cf-banner-title">${m}</div>
                    <div class="cf-banner-subtitle">${v}</div>
                </div>
            </div>
            <div class="cf-countdown">
                <div class="cf-countdown-track"><div class="cf-countdown-fill cf-countdown-fill--${r}" style="width:${f}%;"></div></div>
                <div class="cf-countdown-text">${l>0?l+" tick"+(l!==1?"s":"")+" remaining":"⚡ SNAP ELECTION IMMINENT"}</div>
            </div>
            <div class="cf-penalties">
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--red);">-2%</div>
                    <div class="cf-penalty-label">Approval / Tick</div>
                </div>
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--orange);">${o}</div>
                    <div class="cf-penalty-label">Ticks Elapsed</div>
                </div>
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--red);">-${c}%</div>
                    <div class="cf-penalty-label">Total Lost</div>
                </div>
            </div>
        </div>

        ${y}
        ${_}
    </div>`,ct=[e.id],Sa(a)}const wa={prime_minister:"Prime Minister",interior:"Interior",foreign:"Foreign Affairs",defense:"Defense",finance:"Finance",education:"Education",healthcare:"Healthcare",labor:"Labor",justice:"Justice",trade:"Trade",energy:"Energy",transportation:"Transportation",security:"Security"},ka=["prime_minister","interior","foreign","defense","finance","education","healthcare","labor","justice","trade","energy","transportation"];function Ea(a){const t=(a.party_ids||[]).map(c=>q.find(r=>r.id===c)).filter(Boolean),i=(a.party_ids||[]).includes(N.faction?.id);G={...a.ministry_assignments||{}};const s=N.faction?.id,n=G.prime_minister,o=n===s;let l=`<div style="padding:12px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--accent);margin-bottom:10px;">CONFIGURE GOVERNMENT</div>
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:12px;">All coalition members can assign ministries. The party selected as Prime Minister clicks Form Government.</div>`;for(const c of ka){const r=wa[c]||c,p=c==="prime_minister",m=G[c];i&&(l+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="width:140px;font-family:var(--font-mono);font-size:10px;font-weight:${p?"700":"400"};color:${p?"var(--accent)":"var(--text-secondary)"};letter-spacing:0.5px;">${r}</span>
                <select data-ministry="${c}" class="cf-ministry-select" style="flex:1;padding:4px 8px;font-family:var(--font-mono);font-size:10px;color:var(--text-bright);background:var(--bg-body);border:1px solid var(--border-main);outline:none;">
                    <option value="">— Select Party —</option>
                    ${t.map(v=>`<option value="${v.id}" ${m===v.id?"selected":""}>${gt(v.faction_name)} (${v.seats||0} seats)</option>`).join("")}
                </select>
            </div>`)}const f=!!G.prime_minister;if(f&&o)l+=`<div style="margin-top:14px;display:flex;justify-content:flex-end;">
            <button id="cf-form-gov-btn" style="padding:10px 28px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1.5px;color:#000;background:var(--green);border:1px solid var(--green);cursor:pointer;">FORM GOVERNMENT</button>
        </div>`;else if(f&&!o){const c=t.find(r=>r.id===n);l+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(92,204,92,0.04);border:1px solid rgba(92,204,92,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Waiting for <span style="color:var(--green);font-weight:700;">${gt(c?.faction_name||"PM party")}</span> to click Form Government.
        </div>`}else l+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Select a Prime Minister to enable government formation.
        </div>`;return l+="</div>",l}async function Ca(a,t){if(Pt)return;const i=G.prime_minister;if(!i){alert("You must assign a Prime Minister first.");return}console.log("[Coalition] handleFormGovernment called. Assignments:",JSON.stringify(G)),console.log("[Coalition] Formation:",a.id,"PM party:",i),Pt=!0;const e=document.getElementById("cf-form-gov-btn");e&&(e.disabled=!0,e.textContent="FORMING...");try{const s=N.nation,n=s.id,{error:o}=await L.from("government_formations").update({ministry_assignments:G}).eq("id",a.id);if(o)throw new Error("Failed to save assignments: "+o.message);let l=!1;try{const c=$t?$t(null,s):{},{error:r}=await L.rpc("finalize_government_formation",{p_formation_id:a.id,p_caller_faction_id:N.faction.id,p_ministry_baselines:c||{}});if(r)throw r;l=!0}catch(c){console.warn("[Coalition] RPC failed, using fallback:",c.message)}l||await Ia(a),await L.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",a.id);const{count:f}=await L.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",n).eq("is_active",!0).is("party_id",null);f&&f>=5&&(console.warn(`[Coalition] ${f} vacant ministries — populating from assignments`),await Vt(n)),await re(L,n,i,dt,{skipCoalitionCheck:!0}),lt=!1,alert("Government formed successfully!"),await st(t)}catch(s){console.error("[Coalition] Form government failed:",s),alert("Failed to form government: "+(s.message||s))}finally{Pt=!1,e&&(e.disabled=!1,e.textContent="FORM GOVERNMENT")}}async function Ia(a){const t=N.nation.id,{error:i}=await L.from("government_formations").update({status:"cancelled"}).eq("nation_id",t).eq("status","active").neq("id",a.id);i&&console.warn("[Coalition] Failed to cancel rival formations:",i.message);const{error:e}=await L.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",a.id);if(e)throw e;const{error:s}=await L.from("nations").update({failed_formation_attempts:0}).eq("id",t);s&&console.warn("[Coalition] Failed to reset formation attempts:",s.message),await Vt(t);try{const n={id:a.id,party_ids:a.party_ids||[],lead_party_id:G.prime_minister};await we(L,t,N.nation,"election",n,q,dt,N.shard?.current_date||"",Number(N.nation?.gov_approval??50))}catch(n){console.warn("[Coalition] Administration rollover failed (non-fatal):",n.message)}}async function Vt(a){const t={prime_minister:"Prime Minister",interior:"Minister of the Interior",foreign:"Minister of Foreign Affairs",defense:"Minister of Defense",finance:"Minister of Finance",education:"Minister of Education",healthcare:"Minister of Health",labor:"Minister of Labor",justice:"Minister of Justice",trade:"Minister of Trade",energy:"Minister of Energy",transportation:"Minister of Transportation",security:"Minister of Security"};let i=0;for(const[e,s]of Object.entries(G)){if(!s)continue;const n=Ht(N.nation?.name)||{},o=n.firstNames||["Alex","Maria","Carlos"],l=n.lastNames||["Garcia","Torres","Silva"],f=o[Math.floor(Math.random()*o.length)],c=l[Math.floor(Math.random()*l.length)],r=35+Math.floor(Math.random()*25),p=$t?$t(e,N.nation):{},m=t[e]||e,{data:v,error:d}=await L.from("ministries").update({party_id:s,minister_first_name:f,minister_last_name:c,minister_age:r,minister_approval:50,stat_baselines:p,is_active:!0}).eq("nation_id",a).eq("ministry_key",e).select("id");if(d)console.error(`[Coalition] FAILED to update ministry ${e}:`,d.message);else if(!v||v.length===0){const{error:g}=await L.from("ministries").insert({nation_id:a,ministry_key:e,ministry_name:m,party_id:s,minister_first_name:f,minister_last_name:c,minister_age:r,minister_approval:50,stat_baselines:p,is_active:!0});g?console.error(`[Coalition] FAILED to insert ministry ${e}:`,g.message):i++}else i++;const u=m;await L.from("cabinet_members").update({party_id:s,person_name:f+" "+c}).eq("nation_id",a).eq("position",u).eq("is_active",!0)}console.log(`[Coalition] Updated ${i} ministries for nation ${a}`)}async function Ma(){if(!ft){it=[];return}const{data:a}=await L.from("government_formations").select("*").eq("election_id",ft).eq("status","active").order("created_at",{ascending:!0}),t=[];for(const i of a||[]){const{data:e}=await L.from("government_formation_support").select("faction_id, supports").eq("formation_id",i.id),s=i.party_ids||[],o=(e||[]).filter(p=>s.includes(p.faction_id)).filter(p=>p.supports).length,l=s.length,c=(e||[]).find(p=>p.faction_id===N.faction?.id)?.supports===!0,r=s.includes(N.faction?.id);t.push({...i,supportCount:o,coalitionSize:l,iAmSupporting:c,iAmInvited:r})}it=t}function Sa(a){a.addEventListener("click",async t=>{const i=t.target.closest(".cf-party-check:not(.disabled)");if(i){const s=i.dataset.partyId,n=ct.indexOf(s);n>-1?(ct.splice(n,1),i.classList.remove("checked"),i.querySelector(".cf-check-box").textContent=""):(ct.push(s),i.classList.add("checked"),i.querySelector(".cf-check-box").textContent="✓"),La();return}if(t.target.closest("#cf-propose-btn")){await Aa(a);return}const e=t.target.closest(".cf-support-btn, .cf-withdraw-btn");if(e){const s=e.dataset.formationId,n=e.dataset.action;if(n==="configure"){ut=s;const o=it.find(l=>l.id===s);o&&(G={...o.ministry_assignments||{}}),await st(a)}else await za(s,n==="support",a);return}if(t.target.closest("#cf-form-gov-btn")){const s=it.find(n=>n.id===ut);s&&await Ca(s,a);return}}),a.addEventListener("change",t=>{const i=t.target.closest(".cf-ministry-select");if(!i)return;const e=i.dataset.ministry,s=i.value||null;G[e]=s,ut&&L.from("government_formations").update({ministry_assignments:G}).eq("id",ut).then(({error:o})=>{o&&console.warn("[Coalition] Failed to save assignment:",o.message)});const n=document.getElementById("cf-form-gov-btn");if(n){const o=!!G.prime_minister;n.disabled=!o,n.style.color=o?"#000":"var(--text-dim)",n.style.background=o?"var(--green)":"var(--bg-body)",n.style.borderColor=o?"var(--green)":"var(--border-main)",n.style.cursor=o?"pointer":"not-allowed"}})}function La(){const a=document.getElementById("cf-preview-seats"),t=document.getElementById("cf-preview-pct"),i=document.getElementById("cf-preview-threshold");if(!a)return;const e=ct.reduce((o,l)=>o+(q.find(f=>f.id===l)?.seats||0),0),s=J?Math.round(e/J*100):0,n=e>=Q;a.textContent=e,a.style.color=n?"var(--green)":"var(--text-bright)",t.textContent=s,i.textContent=n?`✓ Meets ${Q}-seat threshold`:`— needs ${Q} seats`,i.style.color=n?"var(--green)":"var(--text-dim)"}async function Aa(a){if(Tt)return;const t=N.faction;if((q.find(o=>o.id===t.id)?.seats||0)===0)return;const e=[...new Set(ct)],s=e.reduce((o,l)=>o+(q.find(f=>f.id===l)?.seats||0),0);if(s<Q){alert(`Coalition needs ${Q} seats. Currently: ${s}.`);return}Tt=!0;const n=document.getElementById("cf-propose-btn");n&&(n.disabled=!0,n.textContent="Submitting...");try{const{data:o}=await L.from("shard").select("current_date").eq("name","Alpha Shard").single(),{data:l,error:f}=await L.from("government_formations").insert({nation_id:N.nation.id,election_id:ft,proposed_by:t.id,party_ids:e,status:"active",game_year:o?.current_date||""}).select().single();if(f){alert("Error: "+f.message);return}const{error:c}=await L.from("government_formation_support").upsert({formation_id:l.id,faction_id:t.id,supports:!0},{onConflict:"formation_id,faction_id"});c&&console.warn("[Coalition] Auto-support insert failed:",c.message),await st(a)}catch(o){console.error("[Coalition] Create proposal error:",o),alert("Failed to create proposal: "+(o.message||o))}finally{Tt=!1}}async function za(a,t,i){try{const{error:e}=await L.from("government_formation_support").upsert({formation_id:a,faction_id:N.faction?.id,supports:t},{onConflict:"formation_id,faction_id"});e&&console.error("[Coalition] Toggle support error:",e.message),await st(i)}catch(e){console.error("[Coalition] Toggle support error:",e)}}let Ft=null,et=[],Ot=[],Dt=null;function V(a){if(!a)return"";const t=document.createElement("div");return t.textContent=a,t.innerHTML}function oe(a){return a>=1e6?(a/1e6).toFixed(2)+"M":a>=1e3?Math.round(a/1e3)+"k":String(a)}function Ta(a){return["January","February","March","April","May","June","July","August","September","October","November","December"][a%12]+", "+(2e3+Math.floor(a/12))}function Pa(a,t){if((a.election_type||"parliamentary")==="presidential")return{label:"Presidential Election",color:"#5a8aaa"};const e=t?.end_reason||"";return e.includes("no_confidence")||e.includes("vnc")?{label:"Vote of No Confidence",color:"#d44a4a"}:e.includes("snap")||e.includes("dissolved")||e.includes("early")?{label:"Early Elections Called",color:"#c84"}:{label:"General Election",color:"#8b9a6b"}}async function Na(a,t){Ft=t;const i=document.getElementById("pa-past-elections-root");if(!i)return;i.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">Loading election history...</div>';const e=t.nation?.id;if(!e){i.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No nation data.</div>';return}const[s,n,o]=await Promise.all([a.from("elections").select("id, election_tick, election_type, status, results, created_at").eq("nation_id",e).eq("status","completed").order("election_tick",{ascending:!1}),a.from("administrations").select("*").eq("nation_id",e).order("started_at_tick",{ascending:!1}),a.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",e).eq("faction_type","party").is("abandoned_at",null)]);et=s.data||[],Ot=n.data||[];const l=o.data||[],f={};for(const c of l)f[c.id]=c;for(const c of et){const r=c.results?.votes||[];for(const p of r){const m=f[p.party_id];m?(p.color=m.party_color||"#666",p.abbreviation=m.abbreviation||p.party_name?.slice(0,3)?.toUpperCase()||"?"):(p.color="#666",p.abbreviation=p.party_name?.slice(0,3)?.toUpperCase()||"?")}}Ra(i),be(i)}function Ra(a){a.addEventListener("click",t=>{const i=t.target.closest("[data-election-id]");if(i){const e=i.dataset.electionId;Dt=Dt===e?null:e,be(a)}})}function be(a,t){if(et.length===0){a.innerHTML=`<div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);margin-bottom:8px;">PAST ELECTIONS</div>
            <div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No completed elections on record.</div>
        </div>`;return}const i=Ft.faction?.id,e=Ft.nation?.total_seats||100,s=Math.ceil(e/2)+1,n=et.map((o,l)=>{const f=Dt===o.id,c=(o.results?.votes||[]).sort((k,I)=>(I.seats||0)-(k.seats||0)),r=c.slice(0,3),p=o.results?.turnout_pct??0,m=o.results?.total_votes_cast??0,v=Ta(o.election_tick),d=Ot.find(k=>k.started_at_tick>=o.election_tick&&k.started_at_tick<=o.election_tick+5),u=Ot.find(k=>k.ended_at_tick!=null&&k.ended_at_tick>=o.election_tick-2&&k.ended_at_tick<=o.election_tick+2),g=Pa(o,u),y=d?.prime_minister||"Unknown",_=d?.pm_party_id&&c.find(k=>k.party_id===d.pm_party_id)?.color||"#888",$=(l<et.length-1?et[l+1]:null)?.results?.votes||[];let C=`<div data-election-id="${o.id}" style="
            background:var(--bg-panel);border:1px solid var(--border-main);
            ${f?"border-bottom:none;":""}
        ">
            <div style="padding:12px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-secondary);width:130px;">${v}</div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 10px;color:${g.color};background:${g.color}0a;border:1px solid ${g.color}25;">${g.label.toUpperCase()}</span>
                    <div style="display:flex;gap:8px;margin-left:10px;">
                        ${r.map(k=>`<div style="display:flex;align-items:center;gap:4px;">
                            <div style="width:8px;height:8px;background:${k.color};"></div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${V(k.abbreviation)}</span>
                            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--text-bright);">${k.seats}</span>
                        </div>`).join("")}
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
                        PM: <span style="color:${_};font-weight:700;">${V(y)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">${f?"▲":"▼"}</span>
                </div>
            </div>
        </div>`;if(f){const k=c.map(E=>`<div style="width:${E.seats/e*100}%;background:${E.color};height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${E.seats>=8?9:6}px;font-weight:700;color:#000;">${E.seats>=5?E.seats:""}</div>`).join(""),I=c.map(E=>{const M=E.party_id===i,F=$.find(O=>O.party_id===E.party_id),A=F?E.seats-(F.seats||0):null,T=E.seats/e*100-(E.vote_percentage||0);return`<div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);${M?`background:${E.color}08;`:""}">
                    <div style="width:30px;height:30px;background:${E.color}15;border:1px solid ${E.color}33;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-right:8px;">${E.abbreviation?.slice(0,2)||"?"}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:5px;">
                            <span style="font-size:13px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${V(E.party_name)}</span>
                            ${M?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#5c5;padding:0 3px;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15);">YOU</span>':""}
                        </div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:${E.color};">${V(E.abbreviation)}</div>
                    </div>
                    <span style="width:60px;text-align:right;font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${E.seats}</span>
                    <span style="width:60px;text-align:right;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${A!=null?A>0?"#5c5":A<0?"#c55":"var(--text-dim)":"var(--text-dim)"};">${A!=null?A>0?"▲ "+A:A<0?"▼ "+Math.abs(A):"—":"NEW"}</span>
                    <span style="width:70px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-bright);">${oe(E.votes||0)}</span>
                    <span style="width:55px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">${(E.vote_percentage||0).toFixed(1)}%</span>
                    <span style="width:80px;text-align:right;font-family:var(--font-mono);font-size:10px;font-weight:700;color:${Math.abs(T)<2?"var(--text-dim)":T>0?"#5c5":"#c84"};">${T>0?"+":""}${T.toFixed(1)}% <span style="font-size:8px;color:var(--text-dim);">${Math.abs(T)<2?"proportional":T>0?"overrep.":"underrep."}</span></span>
                </div>`}).join("");let S="";if(d){const E=d.coalition_parties||[],M=d.total_seats||E.reduce((B,bt)=>B+(bt.seats||0),0),F=M>=s,A=F?"Majority Coalition":"Minority Coalition",z=d.ended_at_tick?d.end_reason||"Ended":"Current Government",T=d.ended_at_tick?"var(--text-dim)":"#5c5",O=d.ended_at_tick?Math.abs(d.ended_at_tick-d.started_at_tick)+" ticks":"Ongoing",R=E.map(B=>{const bt=c.find(Mt=>Mt.party_id===B.party_id)?.color||"#666";return`<div style="width:${M>0?(B.seats||0)/M*100:0}%;background:${bt};height:100%;"></div>`}).join(""),U=E.map(B=>`<div style="display:flex;align-items:center;gap:4px;">
                        <div style="width:8px;height:8px;background:${c.find(Mt=>Mt.party_id===B.party_id)?.color||"#666"};"></div>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${V(B.party_name?.slice(0,3)?.toUpperCase()||"?")}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${B.seats||0}</span>
                    </div>`).join("");S=`<div style="margin:0 20px 16px;background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${_};">
                    <div style="padding:12px 16px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text-dim);">GOVERNMENT FORMED</span>
                                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 8px;color:${T};background:${T}0a;border:1px solid ${T}25;">${V(z.toUpperCase())}</span>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Lasted: ${O}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                            <div style="width:36px;height:36px;background:${_}15;border:1.5px solid ${_};display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;font-weight:700;color:${_};">${V(y.split(" ").map(B=>B[0]).join(""))}</div>
                            <div>
                                <div style="font-size:14px;font-weight:700;color:var(--text-bright);">${V(y)}</div>
                                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Prime Minister &middot; ${V(d.pm_party_name||"")} &middot; ${A}</div>
                            </div>
                        </div>
                        <div style="display:flex;height:8px;gap:1px;margin-bottom:8px;">${R}</div>
                        <div style="display:flex;gap:10px;align-items:center;">
                            ${U}
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">&middot;</span>
                            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${F?"#5c5":"#c84"};">${M} seats ${F?"(majority +"+(M-s)+")":"(minority, "+(s-M)+" short)"}</span>
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
                            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">${oe(m)}</div>
                        </div>
                    </div>
                </div>

                <!-- Seat bar -->
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;height:18px;gap:1px;margin-bottom:6px;">${k}</div>
                    <div style="position:relative;height:0;">
                        <div style="position:absolute;bottom:0;left:${s/e*100}%;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);transform:translateX(-50%);">▲ ${s} majority</div>
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
                    ${I}
                </div>

                ${S}
            </div>`}return C}).join("");a.innerHTML=`<div style="padding:12px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);">PAST ELECTIONS</span>
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">${et.length} elections on record</span>
            </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">${n}</div>
    </div>`}let K=null,Bt=!1,ne=!1,jt=!1,se=!1,Gt=!1;function he(a){document.querySelectorAll(".pa-subtab").forEach(t=>t.classList.toggle("active",t.dataset.panel===a)),document.querySelectorAll(".pa-panel").forEach(t=>t.classList.toggle("active",t.id==="panel-"+a)),sessionStorage.setItem("party_subtab",a),a==="actions"&&!Bt&&K&&(Bt=!0,ve(rt,K)),a==="parties"&&!ne&&K&&(ne=!0,ca(rt,K,"pa-parties-root")),a==="election"&&!jt&&K&&(jt=!0,Gt?st(document.getElementById("pa-election-root")):xe(rt,K).then(()=>{Gt=!0,st(document.getElementById("pa-election-root"))})),a==="past-elections"&&!se&&K&&(se=!0,Na(rt,K))}document.getElementById("pa-subtabs").addEventListener("click",a=>{const t=a.target.closest(".pa-subtab");!t||t.classList.contains("active")||he(t.dataset.panel)});_e("politics",async a=>{K=a,xe(rt,a).then(({needed:i})=>{if(Gt=!0,i){const e=document.querySelector('.pa-subtab[data-panel="election"]');e&&!e.querySelector(".pa-subtab-badge")&&(e.innerHTML+='<span class="pa-subtab-badge"></span>');const s=document.querySelector('.nav-tab[data-tab="politics"]');s&&!s.querySelector(".pa-subtab-badge")&&(s.innerHTML+='<span class="pa-subtab-badge"></span>')}jt&&st(document.getElementById("pa-election-root"))});const t=sessionStorage.getItem("party_subtab");t&&t!=="actions"?he(t):(Bt=!0,await ve(rt,a))});
