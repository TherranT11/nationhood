const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/elections-5GLDcxFI.js","assets/config-fKhFNVuq.js","assets/government-types-D9n0pQb0.js","assets/ideology-BIAflN4K.js","assets/stats-tIiBSaQA.js"])))=>i.map(i=>d[i]);
import{_supabase as pt}from"./supabase-client-CiYoFhIh.js";/* empty css                  */import{i as ke}from"./common-DzbV_OEs.js";import{_ as Ee}from"./preload-helper-BXl3LOEh.js";import{j as Ut,E as ce,B as Ce}from"./elections-5GLDcxFI.js";import{l as ft}from"./government-types-D9n0pQb0.js";import{a as Ie}from"./ideology-BIAflN4K.js";import{d as Me,c as Se,s as Le,a as Et}from"./stats-tIiBSaQA.js";import"./config-fKhFNVuq.js";const _t=[{id:"economic_reform",name:"Economic Reform",icon:"📈",tagline:"Growth-first neoliberal agenda",desc:"Prioritize GDP, attract foreign capital, lower corporate taxes. The rising tide theory — grow the pie and worry about slicing it later.",improve:["gdp_growth","foreign_investment","currency_strength","credit","service_output","manufacturing_output"],worsen:["income_inequality","poverty_rate","union_strength","income_tax"],tradeoff:"Income inequality tends to rise. Working class sees GDP numbers go up while their wages don't."},{id:"social_justice",name:"Social Justice",icon:"⚖️",tagline:"Redistribution and equity",desc:"Raise minimum wage, expand welfare, progressive taxation. Close the gap between rich and poor through direct intervention.",improve:["minimum_wage","poverty_rate","income_inequality","social_mobility","healthcare_accessibility","education_accessibility"],worsen:["foreign_investment","gdp_growth","corporate_tax"],tradeoff:"Capital flight risk. Foreign investors avoid high-tax environments. Growth may slow."},{id:"national_security",name:"National Security",icon:"🛡️",tagline:"Borders, military, order",desc:"Strengthen defense, tighten borders, expand police powers. Safety through strength.",improve:["stability","crime_rate","terrorism","political_violence","illegal_immigration"],worsen:["freedom_index","press_freedom","civil_unrest","polarization"],tradeoff:"Freedom index drops. Minority communities disproportionately affected. International criticism."},{id:"anti_corruption",name:"Anti-Corruption",icon:"🔍",tagline:"Clean government, institutional reform",desc:"Independent judiciary, transparent budgets, prosecute the connected. Popular with voters but powerful people fight back hard.",improve:["corruption","judicial_independence","press_freedom","legitimacy","efficiency"],worsen:["stability"],tradeoff:"Short-term chaos as exposing corruption shakes institutions. Your own party's skeletons may surface."},{id:"green_transition",name:"Green Transition",icon:"🌱",tagline:"Climate and environment",desc:"Renewable energy investment, carbon taxes, emissions targets. Save the planet — but the bill comes due now, not later.",improve:["renewable_energy_pct","pollution","carbon_emissions","energy_generation"],worsen:["fuel_prices","manufacturing_output","gdp_growth","cost_of_living"],tradeoff:"Energy costs spike during transition. Rural and industrial voters feel abandoned."},{id:"industrialization",name:"Industrialization",icon:"🏭",tagline:"Factories, exports, production",desc:"Build manufacturing capacity, create blue-collar jobs, develop physical infrastructure. The backbone of a real economy.",improve:["manufacturing_output","labor_force_participation","unemployment","physical_infrastructure","gdp_growth"],worsen:["pollution","carbon_emissions","arable_land","healthcare_quality"],tradeoff:"Environment gets destroyed. Long-term health costs from industrial pollution."},{id:"digital_modernization",name:"Digital Modernization",icon:"💻",tagline:"Tech economy, connectivity",desc:"Fiber everywhere, tech sector incentives, digital government services. Leap into the future — but not everyone makes the jump.",improve:["digital_infrastructure","service_output","higher_education","academic_immigration","efficiency"],worsen:["manufacturing_output","labor_force_participation","income_inequality","urbanization"],tradeoff:"Automation displaces workers. Rural communities left behind. Tech wealth concentrates in cities."},{id:"welfare_state",name:"Welfare State",icon:"🏥",tagline:"Universal services, safety net",desc:"Free healthcare, free education, generous pensions, unemployment insurance. Cradle to grave — funded by steep taxes on everyone.",improve:["healthcare_quality","healthcare_accessibility","education_accessibility","poverty_rate","standard_of_living","happiness"],worsen:["income_tax","corporate_tax","gdp_growth","foreign_investment"],tradeoff:"Massive fiscal cost. Tax burden on middle class, not just the rich. Sustainability questioned."},{id:"populist_nationalism",name:"Populist Nationalism",icon:"🇲",tagline:"The people vs. elites and outsiders",desc:"Restrict immigration, protect domestic industry, reject globalism. Our people first. Our jobs first. Our culture first.",improve:["immigration","illegal_immigration","manufacturing_output","minimum_wage","union_strength"],worsen:["foreign_investment","academic_immigration","freedom_index","press_freedom","polarization","ethnic_diversity"],tradeoff:"International isolation. Brain drain as educated professionals emigrate. Deep social polarization."},{id:"free_market",name:"Free Market Liberalism",icon:"🏛️",tagline:"Deregulate everything",desc:"Cut taxes, cut red tape, let the market decide winners and losers. Government is the problem, not the solution.",improve:["gdp_growth","foreign_investment","credit","service_output","currency_strength"],worsen:["union_strength","minimum_wage","healthcare_accessibility","income_inequality","poverty_rate"],tradeoff:"Growth at the cost of the working class. Social safety net erodes. Boom-bust volatility."},{id:"law_and_order",name:"Law & Order",icon:"⚔️",tagline:"Tough on crime, strong institutions",desc:"More police, harsher sentences, zero tolerance. Restore order to the streets. Criminals fear the state.",improve:["crime_rate","stability","political_violence","terrorism","drug_use"],worsen:["incarceration_rate","freedom_index","civil_unrest"],tradeoff:"Prison population explodes. Minority communities targeted. Policing costs balloon."},{id:"education_first",name:"Education First",icon:"🎓",tagline:"Human capital as the long game",desc:"Fund schools, universities, research institutions, teacher salaries. The 20-year bet that the next generation will be smarter and richer.",improve:["literacy","higher_education","education_accessibility","academic_immigration","social_mobility","labor_force_participation"],worsen:["income_tax","gdp_growth"],tradeoff:"Voters don't see results before next election. Brain drain if jobs don't exist for graduates."},{id:"healthcare_reform",name:"Healthcare Reform",icon:"💊",tagline:"Fix the hospitals",desc:"More beds, more doctors, better drugs, universal coverage. Nobody dies because they can't afford treatment.",improve:["healthcare_quality","healthcare_accessibility","beds_per_100k","lifespan","drug_use"],worsen:["income_tax","gdp_growth","cost_of_living"],tradeoff:"Pharmaceutical lobby fights back. Extremely expensive. Takes multiple cycles to show results."},{id:"housing_cost",name:"Housing & Cost of Living",icon:"🏠",tagline:"The kitchen-table platform",desc:"Rent controls, public housing, affordable food, price caps on essentials. People can't eat GDP growth.",improve:["housing_affordability","cost_of_living","standard_of_living","physical_infrastructure","urbanization"],worsen:["foreign_investment","gdp_growth"],tradeoff:"Property owners and developers become your enemies. Market distortions create shortages."},{id:"energy_independence",name:"Energy Independence",icon:"⛽",tagline:"Control your own power supply",desc:"Exploit domestic oil, gas, and minerals. No more dependency on foreign energy. Cheap fuel, strong economy, sovereign power.",improve:["energy_generation","oil_and_gas","rare_minerals","fuel_prices","manufacturing_output","gdp_growth"],worsen:["pollution","carbon_emissions","renewable_energy_pct","arable_land"],tradeoff:"Climate commitments broken. Green voters abandon you. Environmental debt for future generations."},{id:"open_society",name:"Open Society",icon:"🕊️",tagline:"Liberal democracy, civil liberties",desc:"Free press, open borders, multicultural embrace, strong civil rights. A beacon of freedom — and a target for those who fear it.",improve:["freedom_index","press_freedom","immigration","academic_immigration","ethnic_diversity","happiness","judicial_independence"],worsen:["stability","illegal_immigration","polarization","terrorism"],tradeoff:"Nationalist backlash. Rural-urban divide deepens. Security vulnerabilities from openness."}],Kt={gdp_growth:"GDP Growth",inflation:"Inflation",interest_rates:"Interest Rates",currency_strength:"Currency Strength",foreign_investment:"Foreign Investment",credit:"Credit",income_tax:"Income Tax",corporate_tax:"Corporate Tax",sales_tax:"Sales Tax",unemployment:"Unemployment",labor_force_participation:"Labor Force Participation",minimum_wage:"Minimum Wage",union_strength:"Union Strength",poverty_rate:"Poverty Rate",income_inequality:"Income Inequality",healthcare_quality:"Healthcare Quality",healthcare_accessibility:"Healthcare Accessibility",beds_per_100k:"Beds per 100k",lifespan:"Lifespan",drug_use:"Drug Use",literacy:"Literacy",higher_education:"Higher Education",education_accessibility:"Education Accessibility",academic_immigration:"Academic Immigration",physical_infrastructure:"Physical Infrastructure",digital_infrastructure:"Digital Infrastructure",urbanization:"Urbanization",energy_generation:"Energy Generation",renewable_energy_pct:"Renewable Energy %",arable_land:"Arable Land",rare_minerals:"Rare Minerals",oil_and_gas:"Oil & Gas",fuel_prices:"Fuel Prices",pollution:"Pollution",carbon_emissions:"Carbon Emissions",standard_of_living:"Standard of Living",happiness:"Happiness",social_mobility:"Social Mobility",crime_rate:"Crime Rate",incarceration_rate:"Incarceration Rate",religiosity:"Religiosity",stability:"Stability",legitimacy:"Legitimacy",efficiency:"Efficiency",corruption:"Corruption",press_freedom:"Press Freedom",judicial_independence:"Judicial Independence",freedom_index:"Freedom Index",polarization:"Polarization",civil_unrest:"Civil Unrest",terrorism:"Terrorism",political_violence:"Political Violence",immigration:"Immigration",illegal_immigration:"Illegal Immigration",emigration:"Emigration",ethnic_diversity:"Ethnic Diversity",cost_of_living:"Cost of Living",housing_affordability:"Housing Affordability",manufacturing_output:"Manufacturing Output",service_output:"Service Output"},Vt=new Set(["inflation","unemployment","poverty_rate","income_inequality","drug_use","pollution","carbon_emissions","crime_rate","incarceration_rate","corruption","polarization","civil_unrest","terrorism","political_violence","illegal_immigration","emigration","cost_of_living","fuel_prices"]),Ae=new Set(["income_tax","corporate_tax","sales_tax"]);function Jt(e,t){const a=Vt.has(e),i=Ae.has(e);return t==="improve"?a?{arrow:"↓",color:"#5cc55c"}:i?{arrow:"↑",color:"#c84"}:{arrow:"↑",color:"#5cc55c"}:a?{arrow:"↑",color:"#c55"}:i?{arrow:"↓",color:"#5cc55c"}:{arrow:"↓",color:"#c55"}}function Xt(e){switch(e){case 0:return{momentum:12,penalty:0,label:"+12",color:"#5cc55c",note:"Unclaimed — full momentum"};case 1:return{momentum:6,penalty:6,label:"+6",color:"#ca5",note:"Contested by 1 rival — reduced momentum"};case 2:return{momentum:4,penalty:4,label:"+4",color:"#c84",note:"Crowded (2 rivals) — minimal momentum"};default:return{momentum:2,penalty:2,label:"+2",color:"#c84",note:`Crowded (${e} rivals) — minimal momentum`}}}function ze(e,t){return e.map(a=>{const i=_t.find(o=>o.id===a.platform_key);if(!i)return{...a,stats:[]};const s=i.improve.map(o=>{const n=a.baseline_stats?.[o],m=a.target_stats?.[o],f=Number(t?.[o]??50),r=Vt.has(o);if(n==null||m==null)return{stat:o,baseline:f,target:f,current:f,progress:0,met:!1};const l=Math.abs(m-n),c=r?Math.max(0,n-f):Math.max(0,f-n),p=l>0?Math.min(1,c/l):1,v=r?f<=m:f>=m;return{stat:o,baseline:n,target:m,current:f,progress:p,met:v}});return{...a,stats:s,platformDef:i}})}const Te=["Former union organizer. Knows how to mobilize a crowd.","Disbarred attorney. Understands the legal system from the inside.","Investigative journalist. Uncovered three government scandals before going private.","Ex-military intelligence. Trained in information warfare.","Community activist. Built grassroots networks across two provinces.","Former government auditor. Knows where the money hides.","Political science professor. Publishes on institutional corruption.","NGO director. Ran anti-corruption campaigns across the continent.","Former prosecutor. Left the justice ministry over political interference.","Labor rights campaigner. Organized the dockworkers' strike of 2014.","Freelance political consultant. Has worked for opposition parties in three nations.","Student movement leader. Led the university protests. Young and fearless.","Retired diplomat. Leverages international connections for domestic pressure.","Whistleblower advocate. Runs a secure tip line used by civil servants.","Former police detective. Turned against the system after a cover-up."];function lt(e){return e>=75?{label:"Exceptional",color:"#5cc55c",desc:"Elite operative. Lawsuits are devastating, intelligence is razor-sharp."}:e>=60?{label:"Strong",color:"#a3b07e",desc:"Experienced and reliable. Can handle most opposition tasks effectively."}:e>=45?{label:"Competent",color:"#ca5",desc:"Gets the job done. Occasional missteps under pressure."}:e>=30?{label:"Developing",color:"#c84",desc:"Green but eager. Results are inconsistent. Cheap to hire."}:{label:"Weak",color:"#c55",desc:"Liability risk. May botch sensitive operations. Rock-bottom price for a reason."}}function Pe(e){var t=Math.max(0,e-20)/65,a=12e4+t*28e4;return Math.round(a/25e3)*25e3}function zt(e,t){return e+Math.floor(Math.random()*(t-e+1))}function Qt(e){return e[Math.floor(Math.random()*e.length)]}function Ne(e,t){var a=[],i=new Set,s=zt(5,7),o=Ut(t),n=o.firstNames||[],m=o.lastNames||[];if(n.length===0||m.length===0)return[];for(var f=Te.slice().sort(function(){return Math.random()-.5}),r=0;r<s;r++){var l,c,p,v=0;do l=Qt(n),c=Qt(m),p=l+" "+c,v++;while(i.has(p)&&v<20);i.add(p);var d=zt(20,85),u=zt(25,60),g=f[r%f.length],y=Pe(d);a.push({nation_id:e,first_name:l,last_name:c,age:u,skill:d,background:g,hire_cost:y,status:"available"})}return a.sort(function($,_){return _.skill-$.skill}),a}async function pe(e,t,a){var{data:i,error:s}=await e.from("administrations").select("id, coalition_parties, stats_at_start, started_at_tick, pm_party_id").eq("nation_id",t).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle();if(s)return console.error("[Agitator] Failed to check opposition status:",s.message),{isOpposition:!1,administration:null};if(!i)return{isOpposition:!0,administration:null};var o=Array.isArray(i.coalition_parties)?i.coalition_parties:[],n=o.map(function(f){return f?typeof f=="string"?f:typeof f=="object"&&(f.party_id||f.id)||null:null}).filter(Boolean),m=n.includes(a)||i.pm_party_id===a;return{isOpposition:!m,administration:i}}async function me(e,t){var{data:a,error:i}=await e.from("faction_agitators").select("*").eq("faction_id",t).eq("status","active").maybeSingle();return i?(console.error("[Agitator] Failed to fetch agitator:",i.message),null):a}async function Re(e,t,a){var{data:i,error:s}=await e.from("agitator_pool").select("*").eq("nation_id",t).eq("status","available").order("skill",{ascending:!1});if(s)return console.error("[Agitator] Failed to fetch pool:",s.message),[];if(i&&i.length>0)return i;var o=Ne(t,a),{data:n,error:m}=await e.from("agitator_pool").insert(o).select("*");return m?(console.error("[Agitator] Failed to insert pool:",m.message),[]):(n||[]).sort(function(f,r){return r.skill-f.skill})}async function Fe(e,t,a,i){var s=await me(e,t);if(s)return{success:!1,agitator:null,error:"You already have an active agitator."};var{data:o,error:n}=await e.from("faction_agitators").insert({faction_id:t,first_name:a.first_name,last_name:a.last_name,age:a.age,skill:a.skill,background:a.background,status:"active",hired_at_tick:i}).select("*").single();if(n)return console.error("[Agitator] Failed to hire:",n.message),{success:!1,agitator:null,error:n.message};var{error:m}=await e.from("agitator_pool").update({status:"hired",hired_by_faction_id:t}).eq("id",a.id);return m&&console.error("[Agitator] Failed to mark pool candidate as hired:",m.message),{success:!0,agitator:o,error:null}}const Ct=[{key:"finance",label:"Finance",icon:"💰"},{key:"defense",label:"Defense",icon:"🛡️"},{key:"education",label:"Education",icon:"🎓"},{key:"healthcare",label:"Health",icon:"🏥"},{key:"interior",label:"Interior",icon:"🏛️"},{key:"foreign",label:"Foreign",icon:"🌐"},{key:"justice",label:"Justice",icon:"⚖️"},{key:"labor",label:"Labor",icon:"🔨"},{key:"trade",label:"Trade",icon:"📦"},{key:"energy",label:"Energy",icon:"⚡"},{key:"transportation",label:"Transport",icon:"🚂"},{key:"agriculture",label:"Agriculture",icon:"🌾"}],fe=[{key:"misuse_of_funds",label:"Misuse of Public Funds",desc:"Alleging budget went somewhere it shouldn't."},{key:"civil_rights",label:"Violation of Civil Rights",desc:"Alleging government overreach or suppression."},{key:"negligence",label:"Breach of Duty / Negligence",desc:"Alleging a ministry failed its mandate."},{key:"corruption",label:"Corruption / Self-Dealing",desc:"Alleging officials enriched themselves."}];function Yt(e){return e<=5?{tier:1,label:"Clean Government",color:"#c55"}:e<=10?{tier:2,label:"Minor Corruption",color:"#ca5"}:e<=20?{tier:3,label:"Significant Corruption",color:"#c84"}:{tier:4,label:"Systemic Corruption",color:"#5cc55c"}}const tt={1:{resolution:"FRIVOLOUS SUIT",filer:{momentum:-5,governance:-2},gov:{momentum:3,governance:1}},2:{resolution:"PARTIAL WIN",filer:{momentum:3,governance:0},gov:{momentum:-2,governance:-2}},3:{resolution:"MAJOR WIN",filer:{momentum:7,governance:2},gov:{momentum:-5,governance:-5}},4:{resolution:"DEVASTATING WIN",filer:{momentum:12,governance:5},gov:{momentum:-10,governance:-8}}},Zt={1:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"Lawsuit discovery phase produces routine documents. No irregularities found in {ministry}.",evidence:"Legal team reviews {ministry} records. Auditors confirm standard procedures.",pre_trial:"Judge signals skepticism toward {party}'s claims. Case appears thin.",resolution:"{ministry} lawsuit dismissed. Courts find no evidence of wrongdoing. {party} criticized for wasting court resources."},2:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit uncovers irregular procurement contracts in {ministry}.",evidence:"Documents reveal {ministry} awarded no-bid contracts to connected firms.",pre_trial:"Judge allows case to proceed. {ministry} officials ordered to testify.",resolution:"{ministry} lawsuit concludes with partial ruling. Irregular contracts confirmed but no criminal charges filed."},3:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit exposes hidden accounts linked to {ministry} officials.",evidence:"Leaked documents show systematic overbilling in {ministry}. Millions unaccounted for.",pre_trial:"Multiple {ministry} officials refuse to testify. Judge threatens contempt.",resolution:"{ministry} scandal confirmed. Court finds evidence of systematic corruption. {party} vindicated."},4:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit reveals {ministry} ran parallel budget invisible to parliament.",evidence:"Court-ordered audit exposes network of shell companies receiving {ministry} funds.",pre_trial:"Prosecutors request criminal referral. Multiple {ministry} officials implicated.",resolution:"Devastating verdict: {ministry} operated criminal enterprise. Officials face prosecution. Government in crisis."}};function yt(e,t){var a=e;for(var i in t)a=a.split("{"+i+"}").join(t[i]);return a}async function Oe(e,t){var{factionId:a,nationId:i,agitatorId:s,targetMinistry:o,basis:n,currentTick:m,partyName:f,administration:r}=t,l,c,p;if(n==="civil_rights"){var v=Number(r?.stats_at_start?.freedom_index??50),{data:d,error:u}=await e.from("nations").select("freedom_index").eq("id",i).single();if(u)return{success:!1,lawsuit:null,tier:0,error:"Failed to fetch freedom index data."};c=Number(d?.freedom_index??50),l=v,p=Math.max(0,l-c)}else{var g=Number(r?.stats_at_start?.corruption??50),{data:d,error:u}=await e.from("nations").select("corruption").eq("id",i).single();if(u)return{success:!1,lawsuit:null,tier:0,error:"Failed to fetch corruption data."};c=Number(d?.corruption??50),l=g,p=Math.max(0,c-l)}var g=l,y=c,$=Yt(p),_=tt[$.tier],I=m+8,h=Ct.find(function(P){return P.key===o}),k=h?"Ministry of "+h.label:o,E=fe.find(function(P){return P.key===n}),C=E?E.label:n,{data:S,error:R}=await e.from("lawsuits").insert({faction_id:a,nation_id:i,agitator_id:s,target_ministry:o,basis:n,filed_at_tick:m,resolves_at_tick:I,corruption_at_start:g,corruption_at_filing:y,corruption_growth:p,tier:$.tier,status:"active",resolution:null,momentum_effect:_.filer.momentum,governance_effect:_.filer.governance,gov_momentum_effect:_.gov.momentum,gov_governance_effect:_.gov.governance}).select("*").single();if(R)return{success:!1,lawsuit:null,tier:0,error:R.message};var M=Zt[$.tier]||Zt[1],z={party:f||"Opposition",ministry:k,basis:C},A=[{event_tick:m,event_type:"filing",headline:yt(M.filing,z)},{event_tick:m+2,event_type:"discovery",headline:yt(M.discovery,z)},{event_tick:m+5,event_type:"evidence",headline:yt(M.evidence,z)},{event_tick:m+7,event_type:"pre_trial",headline:yt(M.pre_trial,z)},{event_tick:I,event_type:"resolution",headline:yt(M.resolution,z)}],T=A.map(function(P){return{lawsuit_id:S.id,nation_id:i,event_tick:P.event_tick,event_type:P.event_type,headline:P.headline,is_fired:P.event_tick===m}}),{error:O}=await e.from("lawsuit_events").insert(T);return O&&console.error("[Lawsuits] Failed to insert milestone events:",O.message),{success:!0,lawsuit:S,tier:$.tier,error:null}}async function De(e,t){var{data:a,error:i}=await e.from("lawsuits").select("*").eq("faction_id",t).order("filed_at_tick",{ascending:!1}).limit(10);return i?(console.error("[Lawsuits] Failed to fetch lawsuits:",i.message),[]):a||[]}let w=null,x=null,V="leader",X=[],It=[],D=null,F=null,vt=!1,dt=null,Ot=[];function b(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function Y(e,t){return((e||"?")[0]+(t||"?")[0]).toUpperCase()}const ve=[{id:"leader",title:"LEADER",fullTitle:"Party Leader",color:"#c8a832"},{id:"deputy",title:"DEPUTY",fullTitle:"Deputy Party Leader",color:"#8b9a6b"},{id:"chief",title:"CHIEF OF STAFF",fullTitle:"Chief of Staff",color:"#5cc55c"},{id:"campaign",title:"CAMPAIGN MGR",fullTitle:"Campaign Manager",color:"#c84"},{id:"comms",title:"COMMS DIR",fullTitle:"Communications Director",color:"#5a8aaa"},{id:"agitator",title:"AGITATOR",fullTitle:"Opposition Coordinator",color:"#d44a4a",oppositionOnly:!0}],Tt=[{perSeat:5e3,momDivisor:10},{perSeat:4e3,momDivisor:8},{perSeat:3e3,momDivisor:6},{perSeat:2e3,momDivisor:5},{perSeat:1e3,momDivisor:5}];let nt=0;async function Be(){if(!w||!x?.faction?.id||!x?.shard?.current_tick)return;const{count:e,error:t}=await w.from("campaign_actions").select("id",{count:"exact",head:!0}).eq("party_id",x.faction.id).eq("action_type","fundraise").eq("tick_performed",x.shard.current_tick);nt=!t&&e!=null?e:0}function ue(e,t){const a=Tt[Math.min(t,Tt.length-1)],i=e*a.perSeat,s=Math.max(1,Math.floor(e/a.momDivisor));return{raised:i,momCost:s,perSeat:a.perSeat,tierIdx:Math.min(t,Tt.length-1)}}const ge=[{id:"fundraise",name:"Fundraise",desc:"Raise party funds proportional to your seat count. Each use yields less money and costs more momentum. Momentum cannot drop below 1.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"statement",name:"Issue Statement",desc:"Public declaration on an issue. Shifts party positioning and voter bloc reactions. Media covers it. Other parties may respond.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"platform",name:"Set Party Platform",desc:"Choose a political focus. Defines which stats you promise to change. Awards momentum based on how many rivals share the same platform.",cost:"$120k",costColor:"#c8a832",moneyCost:12e4,tags:["STRATEGIC"],locked:!1}],je=[{id:"fundraise",name:"Fundraise",desc:"Raise royal treasury funds proportional to your seat count. Each use yields less money and costs more momentum.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"grant_seats",name:"Grant Seats",desc:"Grant parliamentary seats to a noble house. Sharing power increases legitimacy (+0.5 per seat). Hoarding >70% of seats causes tyranny decay.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1},{id:"revoke_seats",name:"Revoke Seats",desc:"Revoke seats from a noble house. Costs $100k and -1 Legitimacy per seat revoked. Use sparingly — the people do not forget.",cost:"$100k/seat",costColor:"#d44a4a",moneyCost:1e5,tags:["ROYAL","OFFENSIVE"],locked:!1},{id:"statement",name:"Royal Decree",desc:"Issue a public declaration on an issue. Shifts positioning and voter bloc reactions. Media covers it.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"appoint_pm",name:"Appoint Prime Minister",desc:"Choose a party to lead the government as Prime Minister. The PM can then assign cabinet ministries. You may appoint your own party.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1}],Lt={PUBLIC:"#8b9a6b",NARRATIVE:"#5a8aaa",STRATEGIC:"#c8a832",INTERNAL:"#c84",COALITION:"#5aaa8a",RISKY:"#c55",PARLIAMENTARY:"#8b9a6b",FINANCIAL:"#5a8aaa",INTELLIGENCE:"#5a8aaa",DEFENSIVE:"#5cc55c",CAMPAIGN:"#c84",VOTER:"#c8a832",OFFENSIVE:"#c84",REACTIVE:"#ca5",STRUCTURAL:"#9e9a92",ROYAL:"#c8a832",LEGAL:"#5a8aaa"},te=[{id:"economy",label:"Economy & Jobs",icon:"💰"},{id:"healthcare",label:"Healthcare",icon:"🏥"},{id:"education",label:"Education",icon:"🎓"},{id:"security",label:"National Security",icon:"🛡️"},{id:"environment",label:"Environment",icon:"🌱"},{id:"corruption",label:"Anti-Corruption",icon:"🔍"},{id:"infrastructure",label:"Infrastructure",icon:"🏗️"},{id:"immigration",label:"Immigration",icon:"🌐"},{id:"housing",label:"Housing & Cost of Living",icon:"🏠"},{id:"crime",label:"Crime & Justice",icon:"⚖️"},{id:"labor",label:"Labor & Workers",icon:"🔨"},{id:"foreign_policy",label:"Foreign Policy",icon:"🕊️"}],ee=["{party_name} Calls for Action on {topic}","{leader_name}: '{topic}' Must Be National Priority","{leader_name} Pledges Bold Agenda on {topic}","{party_name} Leader Addresses Nation on {topic}"];async function ye(e,t){w=e,x=t;const a=document.getElementById("pa-actions-root");if(!a)return;const i=t.faction;if(!i){a.innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:300px;color:var(--text-dim);">No faction data.</div>';return}if(ft(t.nation)&&!t.nation.monarch_faction_id){const l=i.leader_first_name&&i.leader_last_name?i.leader_first_name+" "+i.leader_last_name:"The Monarch",c=i.leader_last_name||i.faction_name?.split(" ")[0]||"Royal",{getNationNames:p}=await Ee(async()=>{const{getNationNames:g}=await import("./elections-5GLDcxFI.js").then(y=>y.W);return{getNationNames:g}},__vite__mapDeps([0,1,2,3,4])),v=p(t.nation.name),d=(v.firstNames||["Alexander"])[Math.floor(Math.random()*(v.firstNames||["Alexander"]).length)],{error:u}=await w.from("nations").update({monarch_faction_id:i.id,monarch_name:l,dynasty_name:c,heir_name:d+" "+c,heir_age:14+Math.floor(Math.random()*8),monarch_crowned_tick:t.shard?.current_tick||0}).eq("id",t.nation.id);u&&console.error("[Monarchy] Failed to assign monarch:",u.message),t.nation.monarch_faction_id=i.id,t.nation.monarch_name=l,t.nation.dynasty_name=c}const[s,o,n,m,f]=await Promise.all([w.from("faction_platforms").select("*").eq("faction_id",i.id).order("slot"),w.from("faction_platforms").select("*").eq("nation_id",t.nation?.id),me(w,i.id),pe(w,t.nation?.id,i.id),w.from("faction_electoral_standing").select("ideological_alignment, visibility, raw_appeal").eq("faction_id",i.id).eq("nation_id",t.nation?.id).maybeSingle()]);await Be(),s.error&&console.error("[PartyActions] Failed to load faction platforms:",s.error.message),o.error&&console.error("[PartyActions] Failed to load nation platforms:",o.error.message),X=s.data||[],It=o.data||[],D=n,vt=m.isOpposition,dt=m.administration,f.data;const{data:r}=await w.from("faction_deputies").select("*").eq("faction_id",i.id).eq("status","active").maybeSingle();F=r||null,D&&(Ot=await De(w,i.id)),H(a)}function H(e){const t=x.faction,a=x.nation,i=ft(a),s=i&&a?.monarch_faction_id===t?.id,o=t.color||"#c8a832",n=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown Leader",m=t.seats||0,f=a?.total_seats||120,r=f>0?Math.round(m/f*100):0;t.action_points,t.approval_rating;const l=t.momentum??50,c=t.party_funds??0,p=ze(X,a),v=[];for(let d=1;d<=3;d++){const u=X.find(g=>g.slot===d);if(u){const g=_t.find(I=>I.id===u.platform_key),y=p.find(I=>I.id===u.id),$=y?y.stats.filter(I=>I.met).length:0,_=y?y.stats.length:0;v.push({name:g?.name||u.platform_key,status:u.status,metCount:$,totalCount:_,slot:d})}else v.push(null)}e.innerHTML=`
        <div class="pa-page">
            <!-- Header -->
            <div class="pa-header">
                <div class="pa-header-left">
                    <span class="pa-title" style="color:${o};">${s?"Royal Court":"Party Actions"}</span>
                    <div class="pa-party-badge">
                        <div class="pa-party-dot" style="background:${o};"></div>
                        <span class="pa-party-name">${b(t.faction_name)}</span>
                    </div>
                </div>
                <div class="pa-header-stats">
                    <div class="pa-header-stat">
                        <div class="pa-header-stat-label">Party Funds</div>
                        <div class="pa-header-stat-value" style="color:var(--accent);">$${c>=1e6?(c/1e6).toFixed(1)+"M":c>=1e3?Math.round(c/1e3)+"k":c}</div>
                    </div>
                    <div class="pa-header-stat">
                        <div class="pa-header-stat-label">Momentum</div>
                        <div class="pa-header-stat-value" style="color:${l>0?"var(--text-bright)":"var(--red)"};">${Number(l).toFixed(1)}</div>
                    </div>
                    <div class="pa-header-stat">
                        <div class="pa-header-stat-label">${i?"Legitimacy":"Governance"}</div>
                        <div class="pa-header-stat-value" style="color:var(--green);">${Math.round(Number(i?x.nation?.legitimacy??x.nation?.gov_approval??50:x.nation?.gov_approval??0))}</div>
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
                        ${v.map(d=>{if(!d)return'<span class="pa-platform-slot">No Platform</span>';const u=d.status==="fulfilled"?" ✓":d.status==="failed"?" ✗":d.status==="abated"?" —":"",g=d.status==="fulfilled"?"fulfilled":d.status==="failed"?"failed":d.status==="abated"?"abated":"filled",y=d.totalCount>0?`${d.metCount}/${d.totalCount}`:"";return`<span class="pa-platform-slot ${g}" title="${d.metCount} of ${d.totalCount} stats on target">${b(d.name)}${y?` (${y})`:""}${u}</span>`}).join("")}
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
    `,document.getElementById("pa-leaders")?.addEventListener("click",d=>{const u=d.target.closest(".pa-leader-card");if(!u||u.classList.contains("vacant"))return;const g=u.dataset.role;g&&g!==V&&(V=g,H(e))}),document.getElementById("pa-actions-panel")?.addEventListener("click",d=>{const u=d.target.closest(".pa-action-item");if(!u||u.classList.contains("locked"))return;const g=u.dataset.actionId;g==="fundraise"?sa(e):g==="grant_seats"?oa(e):g==="revoke_seats"?na(e):g==="rally"?We(e):g==="statement"?ra(e):g==="platform"?la(e):g==="file_lawsuit"?aa(e):g==="appoint_pm"?ia(e):g==="modernize"?Je(e):g==="rebrand"&&Xe(e)}),document.getElementById("pa-hire-agitator-btn")?.addEventListener("click",()=>ne(e)),document.getElementById("pa-hire-agitator-panel")?.addEventListener("click",d=>{d.target.closest("#pa-hire-agitator-btn")||ne(e)}),document.getElementById("pa-hire-deputy-btn")?.addEventListener("click",()=>ie(e)),document.getElementById("pa-hire-deputy-panel")?.addEventListener("click",d=>{d.target.closest("#pa-hire-deputy-btn")||ie(e)})}function Ge(e,t,a){const i=ft(x.nation)&&x.nation?.monarch_faction_id===a?.id;return ve.map(s=>{const o=s.id==="leader",n=s.id==="agitator",m=V===s.id;let f,r,l,c,p;if(o){f=!1,r=e,l=Y(a.leader_first_name,a.leader_last_name),c=ge.length;const u=ft(x.nation);if(u&&x.nation?.monarch_faction_id===a.id)p={text:(x.nation?.monarch_title||"KING").toUpperCase(),color:"#c8a832"};else if(u)p={text:"NOBLE HOUSE",color:"#8b9a6b"};else{const y=dt?.pm_party_id===a.id,$=x.nation?.hos_election_method==="elected"&&dt?.president_party_id===a.id;y?p={text:"PRIME MINISTER",color:"#5cc55c"}:$?p={text:"PRESIDENT",color:"#5cc55c"}:vt?p={text:"OPPOSITION",color:"#c84"}:p={text:"GOVERNING",color:"#8b9a6b"}}}else n&&D?(f=!1,r=`${D.first_name} ${D.last_name}`,l=Y(D.first_name,D.last_name),c=1):n&&!D?(f=!1,r="Not Hired",l="+",c=0):s.id==="deputy"&&F?(f=!1,r=`${F.first_name} ${F.last_name}`,l=Y(F.first_name,F.last_name),c=1):s.id==="deputy"&&!F?(f=!1,r="Not Hired",l="+",c=0):s.id==="campaign"?(f=!1,r="Campaign Mgr",l="CM",c=xe.length):(f=!0,r="Vacant",l="—",c=0);const v=s.oppositionOnly&&!vt;return`
            <div class="pa-leader-card ${m?"active":""} ${f?"vacant":""} ${v?"vacant":""}"
                 data-role="${s.id}"
                 style="${m?`border-left-color:${s.color};`:""}${v?"opacity:0.35;":""}">
                ${s.oppositionOnly?`<div style="position:absolute;top:0;right:0;font-family:var(--font-mono);font-size:5px;font-weight:700;letter-spacing:0.04em;padding:1px 4px;color:${v?"var(--text-dim)":"#d44a4a"};background:${v?"rgba(100,100,100,0.1)":"rgba(212,74,74,0.1)"};border:1px solid ${v?"rgba(100,100,100,0.2)":"rgba(212,74,74,0.2)"};border-top:none;border-right:none;">${v?"IN GOVERNMENT":"OPPOSITION ONLY"}</div>`:""}
                <div class="pa-leader-top">
                    <div class="pa-leader-avatar" style="color:${s.color};background:${s.color}15;border-color:${s.color}33;">${l}</div>
                    <div class="pa-leader-info">
                        <div class="pa-leader-role">
                            <span class="pa-leader-role-label" style="color:${s.color};">${o&&i?(x.nation?.monarch_title||"King").toUpperCase():s.title}</span>
                            ${c>0?`<span class="pa-leader-role-count">${c} actions</span>`:""}
                        </div>
                        <div class="pa-leader-name">${b(r)}</div>
                        ${p?`<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:${p.color};margin-top:2px;">${p.text}</div>`:""}
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
    `}function qe(e,t,a){const i=ft(x.nation),s=i&&x.nation?.monarch_faction_id===a?.id,o=ve.find(_=>_.id===V);if(!o)return"";const n=V==="leader",m=V==="agitator",f=V==="campaign",r=V==="deputy";if(!n&&!m&&!f&&!r)return`
            <div class="pa-vacant-msg">
                <div>
                    <div class="pa-vacant-title">${b(o.fullTitle)} — Vacant</div>
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
        `;if(m&&D)return ta(o);if(r&&!F)return`
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
        `;if(r&&F)return Ve(o);if(f)return Ke(o,a);const c=Y(a.leader_first_name,a.leader_last_name),p=a.leader_age?`, Age ${a.leader_age}`:"",v=a.seats||0,d=a.momentum??0,$=(ft(x.nation)&&x.nation?.monarch_faction_id===a.id?je:ge).map(_=>{const I=_.tags.map(S=>`<span class="pa-action-tag" style="color:${Lt[S]||"var(--text-dim)"};">${S}</span>`).join("");let h="",k=_.cost,E=_.costColor,C=_.locked;if(_.id==="fundraise"){const S=ue(v,nt);k=`-${S.momCost} MOM`,E="#c84",h=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);display:flex;gap:12px;">
                <span>Raises: <span style="color:var(--accent);font-weight:700;">$${(S.raised/1e3).toFixed(0)}k</span></span>
                <span>$${(S.perSeat/1e3).toFixed(0)}k/seat × ${v}</span>
                ${nt>0?`<span style="color:var(--orange);">Use #${nt+1}</span>`:""}
            </div>`,d-S.momCost<1&&(C=!0,h+=`<div style="margin-top:3px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Not enough momentum (need ${S.momCost}, have ${Number(d).toFixed(1)})</div>`)}return`
            <div class="pa-action-item ${C?"locked":""}" data-action-id="${_.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${b(_.name)}</span>
                        <div class="pa-action-tags">${I}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${E};">${k}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${b(_.desc)}</div>
                ${h}
                ${_.locked&&_.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${b(_.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${o.color};background:${o.color}15;border-color:${o.color}33;">${c}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${o.color};">${s?(x.nation?.monarch_title||"KING").toUpperCase():o.title}</span>
                        <span class="pa-detail-name">${b(e)}</span>
                        ${i&&x.nation?.dynasty_name?`<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);font-style:italic;">House ${b(x.nation.dynasty_name)}</span>`:""}
                    </div>
                    <div class="pa-detail-meta">${s?b((x.nation?.monarch_title||"King")+" of "+(x.nation?.name||"")):b(o.fullTitle)+" &middot; "+b(a.faction_name)}${p}${(()=>{if(s)return' <span style="color:#c8a832;font-weight:700;"> &middot; '+(x.nation?.monarch_title||"MONARCH").toUpperCase()+"</span>";if(i)return' <span style="color:#8b9a6b;font-weight:700;"> &middot; NOBLE HOUSE</span>';const _=dt?.pm_party_id===a.id,I=x.nation?.hos_election_method==="elected"&&dt?.president_party_id===a.id;return _?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRIME MINISTER</span>':I?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRESIDENT</span>':vt?' <span style="color:#c84;font-weight:700;"> &middot; OPPOSITION</span>':' <span style="color:#8b9a6b;font-weight:700;"> &middot; GOVERNING</span>'})()}</div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list">
            ${$}
        </div>
        <div class="pa-skill-footer">
            <span style="color:${o.color};font-weight:700;">${o.title}</span> actions are executed by the party leader. Effectiveness depends on party approval and momentum.
        </div>
    `}const He=[{id:"rally",name:"Hold a Rally",desc:"Invest party funds into a public rally. Higher investment improves your odds, but a bad roll can backfire. Roll 1d6 + rally bonus for momentum.",cost:"$50k-$200k",costColor:"#8b9a6b",tags:["CAMPAIGN","RISKY"],locked:!1}],ae=[{cost:5e4,bonus:1,label:"$50k (+1)"},{cost:8e4,bonus:2,label:"$80k (+2)"},{cost:12e4,bonus:3,label:"$120k (+3)"},{cost:15e4,bonus:4,label:"$150k (+4)"},{cost:2e5,bonus:5,label:"$200k (+5)"}];function Ue(e,t){const a=e+t;return a>=8?{momentum:3,label:"Rousing Success",color:"#5cc55c"}:a>=5?{momentum:2,label:"Solid Turnout",color:"#8b9a6b"}:a>=3?{momentum:0,label:"Flat Response",color:"#ca5"}:{momentum:-2,label:"Backfire",color:"#c55"}}function Ve(e){const t=He.map(i=>{const s=i.tags.map(o=>`<span class="pa-action-tag" style="color:${Lt[o]||"var(--text-dim)"};">${o}</span>`).join("");return`
            <div class="pa-action-item ${i.locked?"locked":""}" data-action-id="${i.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${b(i.name)}</span>
                        <div class="pa-action-tags">${s}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${i.costColor};">${i.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${b(i.desc)}</div>
            </div>
        `}).join(""),a=lt(F.skill);return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${e.color};background:${e.color}15;border-color:${e.color}33;">${Y(F.first_name,F.last_name)}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${e.color};">${e.title}</span>
                        <span class="pa-detail-name">${b(F.first_name)} ${b(F.last_name)}</span>
                    </div>
                    <div class="pa-detail-meta">${b(e.fullTitle)} &middot; Age ${F.age} &middot; Skill: <span style="color:${a.color};font-weight:700;">${F.skill}</span></div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list" id="pa-actions-panel">${t}</div>
    `}function Ye(e){const t=Ut(e),a=t.firstNames||[],i=t.lastNames||[];if(a.length===0||i.length===0)return[];const s=5+Math.floor(Math.random()*3),o=new Set,n=[];for(let m=0;m<s;m++){let f,r,l,c=0;do f=a[Math.floor(Math.random()*a.length)],r=i[Math.floor(Math.random()*i.length)],l=f+" "+r,c++;while(o.has(l)&&c<20);o.add(l);const p=20+Math.floor(Math.random()*66),v=28+Math.floor(Math.random()*30),d=Math.max(0,p-20)/65,u=Math.round((125e3+d*525e3)/25e3)*25e3;n.push({first_name:f,last_name:r,age:v,skill:p,hire_cost:u})}return n.sort((m,f)=>f.skill-m.skill)}async function ie(e){const t=document.getElementById("pa-deputy-modal");if(!t)return;const a=x.nation?.name,i=Ye(a);let s=null;function o(){const n=s!=null?i[s]:null,m=n?lt(n.skill):null,f=i.map((c,p)=>{const v=s===p,d=lt(c.skill);return`<div class="pa-hire-row ${v?"selected":""}" data-idx="${p}">
                <div style="width:32px;height:32px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#8b9a6b;flex-shrink:0;">${Y(c.first_name,c.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${v?"var(--text-bright)":"var(--text-secondary)"};">${b(c.first_name)} ${b(c.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${c.skill}%;background:${d.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${d.color};">${c.skill}</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Age ${c.age}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);">$${Math.round(c.hire_cost/1e3)}k</div>
                </div>
            </div>`}).join("");let r;n?r=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#8b9a6b;">${Y(n.first_name,n.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${b(n.first_name)} ${b(n.last_name)}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-dep-hire-confirm" style="background:#8b9a6b;"${(x.faction?.party_funds||0)<n.hire_cost?' disabled title="Not enough funds"':""}>Hire ${b(n.first_name)}</button>
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
        `;const l=()=>t.classList.remove("active");document.getElementById("pa-dep-close")?.addEventListener("click",l),t.onclick=c=>{c.target===t&&l()},document.getElementById("pa-dep-list")?.addEventListener("click",c=>{const p=c.target.closest(".pa-hire-row");p&&(s=parseInt(p.dataset.idx,10),o())}),document.getElementById("pa-dep-hire-confirm")?.addEventListener("click",async()=>{if(s==null)return;const c=i[s],p=x.faction?.party_funds||0;if(p<c.hire_cost){alert("Not enough funds.");return}const v=document.getElementById("pa-dep-hire-confirm");v&&(v.disabled=!0,v.textContent="Hiring...");try{const d=p-c.hire_cost,u=x.shard?.current_tick||0,{data:g,error:y}=await w.from("faction_deputies").insert({faction_id:x.faction.id,first_name:c.first_name,last_name:c.last_name,age:c.age,skill:c.skill,status:"active",hired_at_tick:u}).select("*").single();if(y){alert("Failed: "+y.message);return}await w.from("factions").update({party_funds:d}).eq("id",x.faction.id),x.faction.party_funds=d,F=g,V="deputy",l(),H(e)}catch(d){console.error("[Deputy] Hire error:",d)}finally{v&&(v.disabled=!1)}})}t.classList.add("active"),o()}function We(e){const t=document.getElementById("pa-rally-modal");if(!t||!F)return;const i=x.faction.party_funds||0;let s=null,o=null;function n(){const m=ae.map((l,c)=>{const p=i>=l.cost,v=s===c;return`<div class="pa-action-item ${v?"selected":""} ${p?"":"locked"}" data-tier="${c}" style="cursor:${p?"pointer":"not-allowed"};${v?"border-color:#8b9a6b;background:rgba(139,154,107,0.06);":""}">
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
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#8b9a6b;">${b(F.first_name)} ${b(F.last_name)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">&middot; Skill ${F.skill}</span>
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
        `;const r=()=>{t.classList.remove("active"),o&&H(e)};document.getElementById("rally-close")?.addEventListener("click",r),document.getElementById("rally-cancel")?.addEventListener("click",r),t.onclick=l=>{l.target===t&&r()},document.getElementById("rally-tiers")?.addEventListener("click",l=>{const c=l.target.closest("[data-tier]");!c||c.classList.contains("locked")||(s=parseInt(c.dataset.tier,10),n())}),document.getElementById("rally-submit")?.addEventListener("click",async()=>{if(s==null||o)return;const l=ae[s],{data:c}=await w.from("factions").select("party_funds, momentum").eq("id",x.faction.id).single(),p=c?.party_funds||0;if(p<l.cost){alert("Not enough funds.");return}x.faction.party_funds=p,x.faction.momentum=c?.momentum??x.faction.momentum;const v=document.getElementById("rally-submit");v&&(v.disabled=!0,v.textContent="Rolling...");try{const d=1+Math.floor(Math.random()*6),u=Ue(d,l.bonus),g=p-l.cost,y=Math.max(1,(x.faction.momentum||0)+u.momentum);await w.from("factions").update({party_funds:g,momentum:y}).eq("id",x.faction.id);const $=x.shard?.current_tick||0;await w.from("campaign_actions").insert({party_id:x.faction.id,nation_id:x.nation?.id,action_type:"rally",ap_cost:0,money_cost:l.cost,tick_performed:$,result:{dieRoll:d,bonus:l.bonus,total:d+l.bonus,momentum:u.momentum,label:u.label}}),x.faction.party_funds=g,x.faction.momentum=y,sessionStorage.removeItem("nationhood_state"),o={...u,dieRoll:d,bonus:l.bonus,total:d+l.bonus},n()}catch(d){console.error("[Rally] Error:",d),alert("Rally failed.")}})}t.classList.add("active"),n()}const xe=[{id:"modernize",name:"Modernize Image",desc:"Upload a custom logo to refresh your party's brand. Grants +1 Momentum/tick while a custom logo is active. Quick and affordable.",cost:"$50k",costColor:"#5a8aaa",moneyCost:5e4,tags:["CAMPAIGN","BRANDING"],locked:!1},{id:"rebrand",name:"Rebrand Party",desc:'Change your party name, abbreviation, color, logo, and description. Costly but grants a "Fresh Start" modifier. Nuclear option after scandal or major defeat.',cost:"$150k",costColor:"#c84",moneyCost:15e4,tags:["CAMPAIGN","STRUCTURAL"],locked:!1}],oe=[{id:"crimson",hex:"#c43a3a",name:"Crimson"},{id:"scarlet",hex:"#d45a2a",name:"Scarlet"},{id:"amber",hex:"#c8a832",name:"Amber"},{id:"gold",hex:"#d4a017",name:"Gold"},{id:"olive",hex:"#8a9a4a",name:"Olive"},{id:"emerald",hex:"#2a8a4a",name:"Emerald"},{id:"forest",hex:"#3a6a3a",name:"Forest"},{id:"teal_c",hex:"#2a8a7a",name:"Teal"},{id:"sky",hex:"#4a8aba",name:"Sky"},{id:"cobalt",hex:"#3a5a9a",name:"Cobalt"},{id:"navy",hex:"#2a3a6a",name:"Navy"},{id:"violet",hex:"#7a4a9a",name:"Violet"},{id:"plum",hex:"#8a3a7a",name:"Plum"},{id:"rose",hex:"#ba4a6a",name:"Rose"},{id:"slate",hex:"#5a6a7a",name:"Slate"},{id:"iron",hex:"#4a4a4a",name:"Iron"}],Dt=[{emoji:"🏛️",name:"Parliament"},{emoji:"⚖️",name:"Scales"},{emoji:"🗽",name:"Liberty"},{emoji:"🕊️",name:"Dove"},{emoji:"🦅",name:"Eagle"},{emoji:"🦁",name:"Lion"},{emoji:"🐻",name:"Bear"},{emoji:"🐉",name:"Dragon"},{emoji:"🐘",name:"Elephant"},{emoji:"🏔️",name:"Mountain"},{emoji:"🌊",name:"Wave"},{emoji:"🔥",name:"Flame"},{emoji:"⭐",name:"Star"},{emoji:"🌟",name:"Glow Star"},{emoji:"💎",name:"Diamond"},{emoji:"🛡️",name:"Shield"},{emoji:"⚔️",name:"Swords"},{emoji:"🏗️",name:"Builder"},{emoji:"🌿",name:"Leaf"},{emoji:"🌾",name:"Wheat"},{emoji:"🔨",name:"Hammer"},{emoji:"⚡",name:"Lightning"},{emoji:"🎯",name:"Target"},{emoji:"🏴",name:"Flag"},{emoji:"🚩",name:"Red Flag"},{emoji:"✊",name:"Fist"},{emoji:"🤝",name:"Handshake"},{emoji:"📜",name:"Scroll"},{emoji:"🗳️",name:"Ballot"},{emoji:"👑",name:"Crown"}];function Ke(e,t){const a=xe.map(i=>{const s=i.tags.map(o=>`<span class="pa-action-tag" style="color:${Lt[o]||"var(--text-dim)"};">${o}</span>`).join("");return`
            <div class="pa-action-item ${i.locked?"locked":""}" data-action-id="${i.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${b(i.name)}</span>
                        <div class="pa-action-tags">${s}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${i.costColor};">${i.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${b(i.desc)}</div>
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${e.color};background:${e.color}15;border-color:${e.color}33;">CM</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${e.color};">${e.title}</span>
                    </div>
                    <div class="pa-detail-meta">${b(e.fullTitle)} &middot; ${b(t.faction_name)}</div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list" id="pa-actions-panel">${a}</div>
        <div style="padding:8px 14px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);line-height:1.6;">
            <strong style="color:var(--text-secondary);">CAMPAIGN MANAGER</strong> actions shape your party's public identity and electoral strategy.
        </div>
    `}function Je(e){const t=document.getElementById("pa-modernize-modal");if(!t)return;const a=x.faction;let i=null,s=a.custom_logo_url||null,o=!1;function n(){const m=!!s,r=Number(a.party_funds??0)>=5e4,l=!!i&&r&&!o;t.innerHTML=`
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
                        ${s?`<img src="${b(s)}" style="width:100%;height:100%;object-fit:cover;">`:'<span style="font-size:24px;color:var(--text-dim);">+</span>'}
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="mod-submit" ${l?"":"disabled"} style="background:#5a8aaa;">Modernize — $50k</button>
                </div>
            </div>
        `,document.getElementById("mod-close")?.addEventListener("click",()=>t.classList.remove("active")),document.getElementById("mod-cancel")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=c=>{c.target===t&&t.classList.remove("active")},document.getElementById("mod-file-input")?.addEventListener("change",c=>{const p=c.target.files?.[0];if(p){if(p.size>2*1024*1024){alert("Logo must be under 2MB.");return}i=p,s=URL.createObjectURL(p),n()}}),document.getElementById("mod-submit")?.addEventListener("click",async()=>{if(o||!i)return;o=!0;const c=document.getElementById("mod-submit");c&&(c.disabled=!0,c.textContent="Uploading...");try{const p=i.name.split(".").pop()?.toLowerCase()||"png",v=`${a.id}/logo_${Date.now()}.${p}`,{error:d}=await w.storage.from("party-logos").upload(v,i,{cacheControl:"3600",upsert:!0,contentType:i.type});if(d)throw new Error("Upload failed: "+d.message);const{data:u}=w.storage.from("party-logos").getPublicUrl(v),g=u?.publicUrl;if(!g)throw new Error("Failed to get logo URL");const y=Math.max(0,Number(a.party_funds??0)-5e4),{error:$}=await w.from("factions").update({custom_logo_url:g,party_funds:y}).eq("id",a.id);if($)throw $;a.custom_logo_url=g,a.party_funds=y,t.classList.remove("active"),alert("Logo updated! Your party now earns +1 Momentum/tick from the modernized image."),H(e)}catch(p){alert("Modernize failed: "+(p.message||"Error")),o=!1,c&&(c.disabled=!1,c.textContent="Modernize — $50k")}})}t.classList.add("active"),n()}function Xe(e){const t=document.getElementById("pa-rebrand-modal");if(!t)return;const a=x.faction;x.nation;const i=a.momentum??50;(x._allParties||[]).filter(p=>p.id!==a.id);const s={current:a.party_color||"#4a8aba"},o={current:0},n={current:a.custom_logo_url||null},m={current:null},f={current:!!a.custom_logo_url},r={current:!1};function l(){return s.current}function c(){const p=l(),v=oe.find(k=>k.hex===p)?.name||"Custom",d=Dt[o.current]?.emoji||"🏛️",u=f.current&&(n.current||m.current),g=n.current||(m.current?URL.createObjectURL(m.current):null),y=document.getElementById("rb-name")?.value??a.faction_name??"",$=document.getElementById("rb-abbr")?.value??a.abbreviation??"",_=document.getElementById("rb-desc")?.value??"",I=oe.map(k=>{const E=p===k.hex;return`<div class="rb-color-swatch ${E?"selected":""}" data-hex="${k.hex}" style="background:${k.hex};${E?`box-shadow:0 0 8px ${k.hex}44;border:2px solid var(--text-bright);`:""}">
                ${E?'<span style="font-size:10px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.5);">✓</span>':""}
            </div>`}).join(""),h=Dt.map((k,E)=>{const C=o.current===E;return`<div class="rb-logo-item ${C?"selected":""}" data-idx="${E}" style="${C?`background:${p}15;border:2px solid ${p};box-shadow:0 0 6px ${p}33;`:""}">
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
                            <input class="pa-modal-input" id="rb-name" value="${b(y)}" maxlength="60" style="font-size:13px;font-weight:600;">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${y.length}/60 · Min 3</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Abbreviation</div>
                            <input class="pa-modal-input" id="rb-abbr" value="${b($)}" maxlength="4" style="width:100px;font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;color:${p};">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">2-4 uppercase letters</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Description</div>
                            <textarea class="pa-modal-input" id="rb-desc" rows="3" style="resize:vertical;font-family:var(--font-ui);font-size:11px;line-height:1.5;">${b(_)}</textarea>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${_.length}/200 · Visible to all</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Color — <span style="color:${p};">${b(v)}</span></div>
                            <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;" id="rb-colors">${I}</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Logo — ${u?'<span style="color:var(--teal);">Custom</span>':"Preset"}</div>
                            <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px;margin-bottom:8px;${u?"opacity:0.3;":""}" id="rb-logos">${h}</div>
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
                        <div style="background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${p};padding:10px;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                                <div style="width:40px;height:40px;background:${p}15;border:1.5px solid ${p};display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden;">
                                    ${u&&g?`<img src="${g}" style="width:100%;height:100%;object-fit:contain;" alt="">`:d}
                                </div>
                                <div>
                                    <div style="font-size:12px;font-weight:700;color:var(--text-bright);line-height:1.2;">${b(y||"Party Name")}</div>
                                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${p};letter-spacing:1px;">${b($||"???")}</div>
                                </div>
                            </div>
                            <div style="font-size:9px;color:var(--text-secondary);line-height:1.5;">${b(_||"No description...")}</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);margin-bottom:3px;">BADGES</div>
                            <div style="display:flex;gap:3px;flex-wrap:wrap;">
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${p};background:${p}0a;border:1px solid ${p}25;">${b($)}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${p};background:${p}0a;border:1px solid ${p}25;">MEMBER</span>
                            </div>
                        </div>
                        <div style="padding:6px 8px;background:${p}08;border:1px solid ${p}25;display:flex;align-items:center;gap:8px;">
                            <div style="width:20px;height:20px;background:${p};"></div>
                            <div>
                                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${p};">${b(v.toUpperCase())}</div>
                                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${p}</div>
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
        `}t._rbCustomLogoFile=null,t._rbCustomLogoUrl=n.current,t._rbUseCustomLogo=f.current,c(),t.classList.add("active"),t.addEventListener("change",function(v){if(v.target.id==="rb-logo-file"){const d=v.target.files?.[0];if(!d)return;if(d.size>2*1024*1024){alert("Logo must be under 2MB. Selected file: "+(d.size/(1024*1024)).toFixed(1)+"MB"),v.target.value="";return}if(!["image/png","image/jpeg","image/svg+xml","image/webp"].includes(d.type)){alert("Unsupported file type. Use PNG, JPG, SVG, or WebP."),v.target.value="";return}m.current=d,n.current=null,f.current=!0,t._rbCustomLogoFile=d,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!0,c()}}),t.addEventListener("click",function p(v){if(v.target===t||v.target.closest("#rb-close")||v.target.closest("#rb-cancel")){t.classList.remove("active"),t.removeEventListener("click",p);return}const d=v.target.closest(".rb-color-swatch");if(d){s.current=d.dataset.hex,c();return}const u=v.target.closest(".rb-logo-item");if(u){o.current=parseInt(u.dataset.idx)||0,f.current=!1,t._rbUseCustomLogo=!1,c();return}if(v.target.closest("#rb-remove-logo")){n.current=null,m.current=null,f.current=!1,t._rbCustomLogoFile=null,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!1,c();return}if(v.target.closest("#rb-submit")){const g=document.getElementById("rb-name")?.value?.trim()||"",y=document.getElementById("rb-abbr")?.value?.trim()||"";if(g.length<3||y.length<2){alert("Name must be 3+ chars, abbreviation 2-4 chars.");return}r.current=!0,c();return}if(v.target.closest("#rb-back")){r.current=!1,c();return}if(v.target.closest("#rb-confirm")){Qe(t,e,p);return}})}async function Qe(e,t,a){const i=x.faction,s=document.getElementById("rb-name")?.value?.trim()||"",o=document.getElementById("rb-abbr")?.value?.trim()||"";document.getElementById("rb-desc")?.value?.trim();const n=document.querySelector(".rb-color-swatch.selected")?.dataset?.hex||i.party_color,m=document.querySelector(".rb-logo-item.selected")?.dataset?.idx,f=m!=null?Dt[parseInt(m)]?.emoji:null,r=e._rbCustomLogoFile,l=e._rbUseCustomLogo,c=e._rbCustomLogoUrl,p=document.getElementById("rb-confirm");p&&(p.disabled=!0,p.textContent="Rebranding...");try{const v=x.shard?.current_tick||0;let d=c;if(l&&r){const _=r.name.split(".").pop()?.toLowerCase()||"png",I=`${i.id}/logo_${Date.now()}.${_}`,{data:h,error:k}=await w.storage.from("party-logos").upload(I,r,{cacheControl:"3600",upsert:!0,contentType:r.type});if(k){console.error("[Rebrand] Logo upload failed:",k.message),alert("Logo upload failed: "+k.message);return}const{data:E}=w.storage.from("party-logos").getPublicUrl(I);d=E?.publicUrl||null}else l||(d=null);const u=15e4,g=i.party_funds||0;if(g<u){alert(`Not enough funds. You have $${Math.round(g/1e3)}k, need $150k.`);return}const y=g-u,$=Math.max(1,(i.momentum||0)-10);await w.from("factions").update({party_funds:y,momentum:$,faction_name:s,abbreviation:o.toUpperCase(),party_color:n,party_logo:l?null:f,custom_logo_url:d,rebrand_cooldown_until_tick:v+120}).eq("id",i.id),await w.from("campaign_actions").insert({party_id:i.id,nation_id:x.nation?.id,action_type:"rebrand",ap_cost:3,money_cost:0,tick_performed:v,result:{oldName:i.faction_name,newName:s,oldAbbr:i.abbreviation,newAbbr:o,oldColor:i.party_color,newColor:n}}),i.party_funds=y,i.momentum=$,i.faction_name=s,i.abbreviation=o.toUpperCase(),i.party_color=n,i.party_logo=l?null:f,i.custom_logo_url=d,e.classList.remove("active"),e.removeEventListener("click",a),H(t)}catch(v){console.error("[PartyActions] Rebrand error:",v),alert("Failed to rebrand: "+(v.message||v))}finally{p&&(p.disabled=!1,p.textContent="⚠ Confirm Rebrand")}}const Ze=[{id:"file_lawsuit",name:"File Lawsuit",desc:"Sue a government ministry alleging corruption or negligence. 8-tick timeline with milestone events. Outcome depends on actual corruption growth since government took office.",cost:"$250k",costColor:"#c8a832",moneyCost:25e4,tags:["LEGAL","OFFENSIVE"],locked:!1}];function ta(e){const t=D,a=Y(t.first_name,t.last_name),i=lt(t.skill),s=vt?'<span style="color:#5cc55c;margin-left:6px;">✓ IN OPPOSITION</span>':'<span style="color:#c84;margin-left:6px;">⚠ IN GOVERNMENT (actions limited)</span>',o=Ze.map(n=>{const m=n.tags.map(f=>`<span class="pa-action-tag" style="color:${Lt[f]||"var(--text-dim)"};">${f}</span>`).join("");return`
            <div class="pa-action-item ${n.locked?"locked":""}" data-action-id="${n.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${b(n.name)}</span>
                        <div class="pa-action-tags">${m}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${n.costColor};">${n.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${b(n.desc)}</div>
                ${n.locked&&n.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${b(n.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${e.color};background:${e.color}15;border-color:${e.color}33;">${a}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${e.color};">${e.title}</span>
                        <span class="pa-detail-name">${b(t.first_name)} ${b(t.last_name)}</span>
                    </div>
                    <div class="pa-detail-meta">${b(e.fullTitle)}, Age ${t.age}${s}</div>
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
        ${t.background?`<div style="padding:6px 16px;border:1px solid var(--border-main);border-top:none;border-bottom:none;background:var(--bg-panel);font-size:9px;color:var(--text-dim);font-style:italic;">${b(t.background)}</div>`:""}
        <div class="pa-actions-list">
            ${o}
        </div>
        ${ea()}
        <div class="pa-skill-footer">
            <span style="color:${e.color};font-weight:700;">${e.title}</span> skill (${t.skill}/100) affects lawsuit discovery and legal action outcomes. <span style="color:${i.color};font-weight:700;">${i.label}</span>: ${i.desc}
        </div>
    `}function ea(){if(Ot.length===0)return"";const e=x.shard?.current_tick||0;return`
        <div class="pa-ls-section">
            <div class="pa-ls-section-title">Legal Actions</div>
            ${Ot.map(a=>{const i=Ct.find(y=>y.key===a.target_ministry),s=i?i.label:a.target_ministry,o=i?i.icon:"⚖️",n=Yt(a.corruption_growth||0),m=tt[a.tier]||tt[1],f=a.status==="active",r=Math.max(0,e-a.filed_at_tick),l=8,c=Math.min(1,r/l),p=Math.max(0,a.resolves_at_tick-e),v=[{tick:0,label:"Filed",type:"filing"},{tick:2,label:"Discovery",type:"discovery"},{tick:5,label:"Evidence",type:"evidence"},{tick:7,label:"Pre-trial",type:"pre_trial"},{tick:8,label:"Verdict",type:"resolution"}],d=v.map(y=>{const $=a.filed_at_tick+y.tick,_=e>=$,I=e>=$&&(y.tick===8||e<a.filed_at_tick+v[v.indexOf(y)+1]?.tick),h=y.tick/l*100;return`<div class="pa-ls-milestone ${_?"passed":""} ${I?"current":""}" style="left:${h}%;" title="${y.label} (Tick ${$})">
                <div class="pa-ls-milestone-dot"></div>
                <div class="pa-ls-milestone-label">${y.label}</div>
            </div>`}).join("");let u="";if(!f){const y=m===tt[1]?"FRIVOLOUS":m===tt[2]?"PARTIAL WIN":m===tt[3]?"MAJOR WIN":"DEVASTATING",$=a.tier===1?"var(--red)":a.tier===2?"#ca5":a.tier===3?"#c84":"var(--green)";u=`<span class="pa-ls-tier-badge" style="color:${$};border-color:${$}44;background:${$}0a;">${y}</span>`}const g=f?"":`
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
                        <span style="font-size:11px;font-weight:700;color:var(--text-bright);">${b(s)}</span>
                        <span class="pa-ls-tier-badge" style="color:${n.color};border-color:${n.color}44;background:${n.color}0a;">TIER ${a.tier}</span>
                        ${u}
                    </div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">
                        ${f?`${p} ticks left`:`Resolved tick ${a.resolves_at_tick}`}
                    </div>
                </div>
                ${f?`
                    <div class="pa-ls-timeline">
                        <div class="pa-ls-timeline-track">
                            <div class="pa-ls-timeline-fill" style="width:${c*100}%;"></div>
                        </div>
                        ${d}
                    </div>
                `:""}
                <div style="font-size:9px;color:var(--text-dim);margin-top:4px;">
                    Corruption growth: <span style="color:${n.color};font-weight:700;">${(a.corruption_growth||0).toFixed(1)}</span>
                    &mdash; ${b(n.label)}
                </div>
                ${g}
            </div>
        `}).join("")}
        </div>
    `}let Pt=!1;async function ne(e){const t=document.getElementById("pa-hire-modal");if(!t)return;const a=x.nation?.id,i=x.nation?.name;if(!a||!i)return;t.innerHTML='<div class="pa-modal"><div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Searching for candidates...</div></div>',t.classList.add("active");const s=await Re(w,a,i);let o=null;function n(){const m=o!=null?s[o]:null,f=m?lt(m.skill):null,r=s.map((p,v)=>{const d=o===v,u=lt(p.skill);return`<div class="pa-hire-row ${d?"selected":""}" data-idx="${v}">
                <div style="width:32px;height:32px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#d44a4a;flex-shrink:0;">${Y(p.first_name,p.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${d?"var(--text-bright)":"var(--text-secondary)"};">${b(p.first_name)} ${b(p.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${p.skill}%;background:${u.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${u.color};">${p.skill}</span>
                    </div>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;">Age ${p.age}</div>
            </div>`}).join("");let l;m?l=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#d44a4a;">${Y(m.first_name,m.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${b(m.first_name)} ${b(m.last_name)}</div>
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
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.6;font-style:italic;">${b(m.background)}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-hire-confirm" style="background:#d44a4a;"${(x.faction?.party_funds||0)<m.hire_cost?' disabled title="Not enough funds"':""}>Hire ${b(m.first_name)}</button>
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
        `;const c=()=>t.classList.remove("active");document.getElementById("pa-hire-close")?.addEventListener("click",c),t.onclick=p=>{p.target===t&&c()},document.getElementById("pa-hire-list")?.addEventListener("click",p=>{const v=p.target.closest(".pa-hire-row");v&&(o=parseInt(v.dataset.idx,10),n())}),document.getElementById("pa-hire-confirm")?.addEventListener("click",async()=>{if(Pt||o==null)return;Pt=!0;const p=document.getElementById("pa-hire-confirm");p&&(p.disabled=!0,p.textContent="Hiring...");try{const v=x.shard?.current_tick||0,d=s[o],u=d.hire_cost||0,g=x.faction?.party_funds||0;if(u>0&&g<u){alert(`Not enough funds. You have $${Math.round(g/1e3)}k, need $${Math.round(u/1e3)}k.`);return}if(u>0){const $=g-u,{error:_}=await w.from("factions").update({party_funds:$}).eq("id",x.faction.id);if(_){alert("Failed to deduct funds.");return}x.faction.party_funds=$}const y=await Fe(w,x.faction?.id,d,v);if(!y.success){alert(y.error||"Failed to hire agitator.");return}D=y.agitator,V="agitator",c(),H(e)}catch(v){console.error("[PartyActions] Hire agitator error:",v)}finally{Pt=!1,p&&(p.disabled=!1)}})}n()}let wt=!1;function aa(e){const t=document.getElementById("pa-lawsuit-modal");if(!t)return;if(!dt){alert("No active government to file against.");return}const a=x.faction,i=D;let s=null,o=null;function n(){const m=s&&o,f=Ct.map(c=>{const p=s===c.key;return`<div class="pa-lawsuit-target ${p?"selected":""}" data-target="${c.key}">
                <span style="font-size:18px;">${c.icon}</span>
                <span style="font-size:12px;font-weight:600;color:${p?"var(--text-bright)":"var(--text-secondary)"};">${b(c.label)}</span>
            </div>`}).join(""),r=fe.map(c=>{const p=o===c.key;return`<div class="pa-lawsuit-basis ${p?"selected":""}" data-basis="${c.key}">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:16px;height:16px;border-radius:50%;border:2px solid ${p?"#d44a4a":"var(--border-mid)"};display:flex;align-items:center;justify-content:center;">
                        ${p?'<div style="width:8px;height:8px;border-radius:50%;background:#d44a4a;"></div>':""}
                    </div>
                    <div>
                        <div style="font-size:14px;font-weight:600;color:${p?"var(--text-bright)":"var(--text-secondary)"};">${b(c.label)}</div>
                        <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">${b(c.desc)}</div>
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
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#d44a4a;">${b(i.first_name)} ${b(i.last_name)}</span>
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
        `;const l=()=>t.classList.remove("active");document.getElementById("pa-lawsuit-close")?.addEventListener("click",l),document.getElementById("pa-lawsuit-cancel")?.addEventListener("click",l),t.onclick=c=>{c.target===t&&l()},document.getElementById("pa-lawsuit-targets")?.addEventListener("click",c=>{const p=c.target.closest(".pa-lawsuit-target");p&&(s=p.dataset.target,n())}),document.getElementById("pa-lawsuit-bases")?.addEventListener("click",c=>{const p=c.target.closest(".pa-lawsuit-basis");p&&(o=p.dataset.basis,n())}),document.getElementById("pa-lawsuit-submit")?.addEventListener("click",async()=>{if(wt||!s||!o)return;wt=!0;const c=document.getElementById("pa-lawsuit-submit");c&&(c.disabled=!0,c.textContent="Filing...");try{const{data:v}=await w.from("factions").select("party_funds").eq("id",a.id).single(),d=v?.party_funds||0;if(d<25e4){alert(`Not enough funds. You have $${Math.round(d/1e3)}k, need $250k.`),wt=!1,c&&(c.disabled=!1,c.textContent="File Lawsuit");return}const u=d-25e4;await w.from("factions").update({party_funds:u}).eq("id",a.id),a.party_funds=u,sessionStorage.removeItem("nationhood_state");const g=x.shard?.current_tick||0,y=await Oe(w,{factionId:a?.id,nationId:x.nation?.id,agitatorId:i?.id,targetMinistry:s,basis:o,currentTick:g,partyName:a?.faction_name||"Opposition",administration:dt});if(!y.success){alert(y.error||"Failed to file lawsuit.");return}const $=Yt(y.lawsuit?.corruption_growth||0),_=tt[y.tier]||tt[1];l(),alert(`Lawsuit filed against ${Ct.find(I=>I.key===s)?.label||s}.
The case is now under investigation. Results will be determined when it resolves in 8 ticks.`),H(e)}catch(p){console.error("[PartyActions] File lawsuit error:",p),alert("An error occurred. Please try again.")}finally{wt=!1,c&&(c.disabled=!1,c.textContent="File Lawsuit")}})}t.classList.add("active"),n()}async function ia(e){const t=document.getElementById("pa-appoint-pm-modal");if(!t)return;const a=x.nation;x.faction;const{data:i}=await w.from("factions").select("id, faction_name, abbreviation, party_color, seats, leader_first_name, leader_last_name, leader_age").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),s=i||[];let o=null,n=!1;const{data:m}=await w.from("head_of_government").select("faction_id, first_name, last_name, factions(faction_name)").eq("nation_id",a.id).eq("active",!0).maybeSingle();function f(){const r=s.find(d=>d.id===o),l=m?`${m.first_name} ${m.last_name}`:null,c=m?.factions?.faction_name||null,p=m&&o===m.faction_id;t.innerHTML=`
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
                    ${l?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Current PM: <strong style="color:var(--text-bright);">${b(l)}</strong> (${b(c||"?")})</div>`:'<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--amber);">No Prime Minister appointed.</div>'}
                </div>
                <div class="pa-modal-body" style="max-height:300px;overflow-y:auto;">
                    <div class="pa-modal-step-label">Select a Party</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${s.map(d=>{const u=d.id===o,g=m&&d.id===m.faction_id,y=d.leader_first_name&&d.leader_last_name?`${d.leader_first_name} ${d.leader_last_name}`:"?";return`<div class="pa-action-item ${u?"selected":""}" data-party-id="${d.id}" style="cursor:pointer;${u?`border-color:${d.party_color||"#888"};background:${d.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${d.party_color||"#888"};"></div>
                                        <div>
                                            <div style="font-size:13px;font-weight:600;color:var(--text-bright);">${b(d.faction_name)}</div>
                                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${b(y)}, Age ${d.leader_age||"?"} · ${d.seats||0} seats</div>
                                        </div>
                                    </div>
                                    ${g?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:2px 6px;color:var(--green);background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2);">CURRENT PM</span>':""}
                                </div>
                            </div>`}).join("")}
                    </div>
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="apm-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="apm-confirm" ${!r||n||p?"disabled":""} style="background:#c8a832;">${r?p?"Already PM":`Appoint ${b(r.faction_name)}`:"Select a party"}</button>
                </div>
            </div>
        `;const v=()=>t.classList.remove("active");document.getElementById("apm-close")?.addEventListener("click",v),document.getElementById("apm-cancel")?.addEventListener("click",v),t.onclick=d=>{d.target===t&&v()},t.querySelector(".pa-modal-body")?.addEventListener("click",d=>{const u=d.target.closest("[data-party-id]");u&&(o=u.dataset.partyId,f())}),document.getElementById("apm-confirm")?.addEventListener("click",async()=>{if(!o||n)return;const d=s.find(g=>g.id===o);if(!d||!confirm(`Appoint ${d.leader_first_name} ${d.leader_last_name} of ${d.faction_name} as Prime Minister?`))return;n=!0;const u=document.getElementById("apm-confirm");u&&(u.disabled=!0,u.textContent="Appointing...");try{const g=x.shard?.current_tick||0;await w.from("head_of_government").update({active:!1}).eq("nation_id",a.id).eq("active",!0);const{error:y}=await w.from("head_of_government").insert({nation_id:a.id,faction_id:o,first_name:d.leader_first_name||"Unknown",last_name:d.leader_last_name||"Unknown",age:d.leader_age||50,ideology:"Centrist",active:!0,appointed_tick:g});if(y)throw y;try{await w.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} appoints Prime Minister`,category:"government",description_chosen:`${a.monarch_title||"The King"} has appointed ${d.leader_first_name} ${d.leader_last_name} of ${d.faction_name} as Prime Minister.`,fired_at_tick:g})}catch{}v(),alert(`${d.leader_first_name} ${d.leader_last_name} of ${d.faction_name} has been appointed Prime Minister.`),H(e)}catch(g){alert("Failed to appoint PM: "+(g.message||"Error")),n=!1,u&&(u.disabled=!1,u.textContent=`Appoint ${b(d.faction_name)}`)}})}t.classList.add("active"),f()}async function oa(e){const t=document.getElementById("pa-royal-modal");if(!t)return;const a=x.nation,i=x.faction,s=i.seats||0,o=a?.total_seats||100,{data:n}=await w.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),m=(n||[]).filter(p=>p.id!==i.id);let f=null;const r=Math.max(0,s-1);let l=Math.min(5,r||1);function c(){const p=m.find(d=>d.id===f);t.innerHTML=`
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
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${b(d.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${Math.max(0,d.seats||0)} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No other factions in this nation.</div>'}
                    </div>
                    ${p?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Grant</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${r}" value="${l}" id="grant-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--accent);width:40px;text-align:center;" id="grant-count">${l}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Legitimacy gain: <span style="color:#5cc55c;font-weight:700;">+${(l*.5).toFixed(1)}</span>
                                &middot; Your seats after: ${s-l} &middot; Their seats after: ${(p.seats||0)+l}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-grant" ${p?"":"disabled"} style="background:#c8a832;">Grant ${l} Seats</button>
                </div>
            </div>
        `;const v=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",v),document.getElementById("royal-cancel")?.addEventListener("click",v),t.onclick=d=>{d.target===t&&v()},t.querySelector(".pa-modal-body")?.addEventListener("click",d=>{const u=d.target.closest("[data-faction-id]");u&&(f=u.dataset.factionId,c())}),document.getElementById("grant-slider")?.addEventListener("input",d=>{l=parseInt(d.target.value)||1,document.getElementById("grant-count").textContent=l;const u=document.getElementById("royal-grant");u&&(u.textContent=`Grant ${l} Seats`)}),document.getElementById("royal-grant")?.addEventListener("click",async()=>{if(!f)return;const d=document.getElementById("royal-grant");d&&(d.disabled=!0,d.textContent="Granting...");try{const{data:u}=await w.from("factions").select("id, faction_name, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null),g=(u||[]).find(A=>A.id===i.id),y=(u||[]).find(A=>A.id===f);if(!g||!y){alert("Faction not found.");return}const $=(u||[]).reduce((A,T)=>A+Math.max(0,T.seats||0),0),_=a?.total_seats||100,I=[];let h=l;const k=Math.min(h,Math.max(0,g.seats||0)-1);if(k>0&&(h-=k),h>0){const A=(u||[]).filter(O=>O.id!==i.id&&O.id!==f&&(O.seats||0)>0),T=A.reduce((O,P)=>O+(P.seats||0),0);if(T>0)for(const O of A){const P=Math.round(h*(O.seats||0)/T),W=Math.min(P,O.seats||0);W>0&&(I.push({id:O.id,seats:(O.seats||0)-W}),h-=W)}}const E=l-h;if(E<=0){alert("No seats available to grant.");return}const C=Math.max(1,(g.seats||0)-Math.min(l-h,l)),S=(y.seats||0)+E,R=E*.5,M=Math.min(100,(Number(a.legitimacy)||50)+R);I.push({id:i.id,seats:C}),I.push({id:f,seats:S});for(const A of I){const{error:T}=await w.from("factions").update({seats:A.seats}).eq("id",A.id);if(T){alert("Failed to grant seats.");return}}const{error:z}=await w.from("nations").update({legitimacy:M}).eq("id",a.id);if(z){alert("Failed to update legitimacy.");return}i.seats=C,a.legitimacy=M;try{const A=m.find(T=>T.id===f);await w.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} grants ${E} seats to ${A?.faction_name||"unknown"}`,category:"government",description_chosen:`The ${a.monarch_title||"King"} has granted ${E} parliamentary seat${E!==1?"s":""} to ${A?.faction_name}. Legitimacy +${R.toFixed(1)}.`,fired_at_tick:x.shard?.current_tick||0})}catch{}v(),H(e)}catch(u){console.error("[GrantSeats] Error:",u),alert("Failed to grant seats.")}})}t.classList.add("active"),c()}async function na(e){const t=document.getElementById("pa-royal-modal");if(!t)return;const a=x.nation,i=x.faction,{data:s}=await w.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),o=(s||[]).filter(r=>r.id!==i.id&&(r.seats||0)>0);let n=null,m=1;function f(){const r=o.find(u=>u.id===n),l=r&&r.seats||0,p=m*1e5,v=i.party_funds||0;t.innerHTML=`
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
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${b(u.faction_name)}</span>
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
                                Cost: <span style="color:#d44a4a;font-weight:700;">$${Math.round(p/1e3)}k</span>
                                &middot; Legitimacy: <span style="color:#d44a4a;font-weight:700;">-${m}</span>
                                ${v<p?'<span style="color:#d44a4a;margin-left:8px;">⚠ Not enough funds</span>':""}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-revoke" ${!r||v<p?"disabled":""} style="background:#d44a4a;">Revoke ${m} Seats</button>
                </div>
            </div>
        `;const d=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",d),document.getElementById("royal-cancel")?.addEventListener("click",d),t.onclick=u=>{u.target===t&&d()},t.querySelector(".pa-modal-body")?.addEventListener("click",u=>{const g=u.target.closest("[data-faction-id]");g&&(n=g.dataset.factionId,m=1,f())}),document.getElementById("revoke-slider")?.addEventListener("input",u=>{m=parseInt(u.target.value)||1,document.getElementById("revoke-count").textContent=m;const g=document.getElementById("royal-revoke");g&&(g.textContent=`Revoke ${m} Seats`)}),document.getElementById("royal-revoke")?.addEventListener("click",async()=>{if(!n)return;const u=document.getElementById("royal-revoke");u&&(u.disabled=!0,u.textContent="Revoking...");try{const g=o.find(z=>z.id===n),y=m*1e5,{data:$}=await w.from("factions").select("party_funds").eq("id",i.id).single(),_=$?.party_funds||0;if(_<y){alert("Not enough funds.");return}const I=_-y,h=(i.seats||0)+m,k=Math.max(0,(g?.seats||0)-m),E=m,C=Math.max(0,(Number(a.legitimacy)||50)-E),{error:S}=await w.from("factions").update({seats:h,party_funds:I}).eq("id",i.id),{error:R}=await w.from("factions").update({seats:k}).eq("id",n),{error:M}=await w.from("nations").update({legitimacy:C}).eq("id",a.id);if(S||R||M){alert("Failed to revoke seats.");return}i.seats=h,i.party_funds=I,a.legitimacy=C,sessionStorage.removeItem("nationhood_state");try{await w.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} revokes ${m} seats from ${g?.faction_name||"unknown"}`,category:"political",description_chosen:`The ${a.monarch_title||"King"} has revoked ${m} seat${m!==1?"s":""} from ${g?.faction_name}. Legitimacy -${E}.`,fired_at_tick:x.shard?.current_tick||0})}catch{}d(),H(e)}catch(g){console.error("[RevokeSeats] Error:",g),alert("Failed to revoke seats.")}})}t.classList.add("active"),f()}let Nt=!1;async function sa(e){if(Nt)return;const t=x.faction,a=t.seats||0,i=Math.max(1,t.momentum??0);if(a<=0){alert("Your party has no seats — nothing to fundraise from.");return}const s=ue(a,nt);if(i-s.momCost<1){alert(`Not enough momentum. You need ${s.momCost} momentum (current: ${Math.round(i)}, floor: 1). Try again next tick when momentum recovers.`);return}Nt=!0;try{const{data:o}=await w.from("factions").select("party_funds, momentum").eq("id",t.id).single();o&&(t.party_funds=o.party_funds??0,t.momentum=o.momentum??0);const n=Math.max(1,t.momentum??0),m=x.shard?.current_tick||0,f=Math.max(1,n-s.momCost),r=(t.party_funds||0)+s.raised,{error:l}=await w.from("factions").update({momentum:f,party_funds:r}).eq("id",t.id);if(l){alert("Fundraise failed: "+l.message);return}await w.from("campaign_actions").insert({party_id:t.id,nation_id:x.nation?.id,action_type:"fundraise",ap_cost:0,money_cost:0,tick_performed:m,result:{raised:s.raised,perSeat:s.perSeat,momCost:s.momCost,useNumber:nt+1,seats:a}}),t.momentum=f,t.party_funds=r,sessionStorage.removeItem("nationhood_state"),nt++,H(e)}catch(o){console.error("[PartyActions] Fundraise error:",o),alert("Fundraise failed.")}finally{Nt=!1}}function ra(e){const t=document.getElementById("pa-statement-modal");if(!t)return;const a=x.faction,i=a?.color||"#c8a832",s=a?.leader_first_name&&a?.leader_last_name?`${a.leader_first_name} ${a.leader_last_name}`:"Party Leader",o=te.map(l=>`<div class="pa-topic-card" data-topic="${l.id}" style="padding:8px 10px;cursor:pointer;border:1px solid var(--border-mid);display:flex;align-items:center;gap:8px;transition:all 0.12s;">
            <span style="font-size:14px;">${l.icon}</span>
            <span style="font-size:10px;font-weight:600;color:var(--text-secondary);">${b(l.label)}</span>
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
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${i};">${b(s)}</span>
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
    `,t.classList.add("active");let n=null,m=!1;const f=()=>t.classList.remove("active");document.getElementById("pa-stmt-close")?.addEventListener("click",f),document.getElementById("pa-stmt-cancel")?.addEventListener("click",f),t.addEventListener("click",l=>{l.target===t&&f()}),document.getElementById("pa-stmt-topics")?.addEventListener("click",l=>{const c=l.target.closest(".pa-topic-card");c&&(n=c.dataset.topic,document.querySelectorAll(".pa-topic-card").forEach(p=>{const v=p.dataset.topic===n;p.style.borderColor=v?i:"var(--border-mid)",p.style.background=v?i+"0a":"";const d=p.querySelector("span:last-child");d&&(d.style.color=v?"var(--text-bright)":"var(--text-secondary)")}),r())});const r=()=>{const l=document.getElementById("pa-stmt-body")?.value?.trim()||"",c=document.getElementById("pa-stmt-submit"),p=document.getElementById("pa-stmt-charcount");p&&(p.textContent=`${l.length} characters`),c&&(c.disabled=!(n&&l.length>=10))};document.getElementById("pa-stmt-body")?.addEventListener("input",r),document.getElementById("pa-stmt-submit")?.addEventListener("click",async()=>{if(m)return;const l=document.getElementById("pa-stmt-body")?.value?.trim();if(!n||!l||l.length<10)return;m=!0;const c=document.getElementById("pa-stmt-submit");c&&(c.disabled=!0,c.textContent="Issuing...");try{const p=x.shard?.current_tick||0,d=te.find(R=>R.id===n)?.label||n,u=2e4,{data:g}=await w.from("factions").select("party_funds").eq("id",a.id).single(),y=g?.party_funds||0;if(y<u){alert(`Not enough funds. You have $${Math.round(y/1e3)}k, need $20k.`);return}const $=y-u,{error:_}=await w.from("factions").update({party_funds:$}).eq("id",a.id);if(_){alert("Failed to deduct funds: "+_.message);return}a.party_funds=$;const h=ee[Math.floor(Math.random()*ee.length)].replace("{party_name}",a.faction_name||"Unknown Party").replace("{leader_name}",s).replace("{topic}",d),{error:k}=await w.from("campaign_actions").insert({party_id:a.id,nation_id:x.nation?.id,action_type:"issue_statement",ap_cost:1,money_cost:0,tick_performed:p,result:{topic:n,topicLabel:d,headline:h,body:l,leaderName:s}});k&&console.error("[PartyActions] Statement log failed:",k.message);const{error:E}=await w.from("valdorian_articles").insert({nation_id:x.nation?.id,event_type:"issue_statement",tier:3,section:"politics",headline:h,subheadline:d,lede:l.substring(0,200)+(l.length>200?"...":""),body_paragraphs:JSON.stringify(l.split(/\n\n+/).filter(R=>R.trim())),quotes:JSON.stringify([{posture:"assertive",text:l.substring(0,150)}]),byline_reporter:"Political Desk",topic_tags:JSON.stringify([n]),source_event_id:"statement_"+Date.now(),tick:p});E&&console.error("[PartyActions] Article creation failed:",E.message);const{error:C}=await w.from("event_log").insert({nation_id:x.nation?.id,event_name:h,category:"political",description_chosen:`${a.faction_name} issues the following statement regarding ${d}: "${l}"`,fired_at_tick:p});C&&console.warn("[Statement] event_log insert failed:",C.message);const{error:S}=await w.from("admin_timeline_events").insert({nation_id:x.nation?.id,tick:p,type:"communications",title:"Statement Issued",description:`${s} issued a public statement on ${d}: "${l.substring(0,120)}${l.length>120?"...":""}"`});S&&console.warn("[Statement] timeline insert failed:",S.message),f(),H(e)}catch(p){console.error("[PartyActions] Statement error:",p),alert("Failed to issue statement. Please try again.")}finally{m=!1,c&&(c.disabled=!1,c.textContent="Issue Statement")}})}const Mt=20;function la(e){const t=document.getElementById("pa-platform-modal");if(!t)return;const a=x.faction;x.nation;const i=a?.color||"#c8a832";let s=null,o=!1;const n={};for(const r of It)r.faction_id!==a?.id&&(n[r.platform_key]=(n[r.platform_key]||0)+1);const m=new Set(X.map(r=>r.platform_key));function f(){const r=_t.find(v=>v.id===s),l=r?Xt(n[r.id]||0):null;r&&It.filter(v=>v.platform_key===r.id&&v.faction_id!==a?.id);const c=_t.map(v=>{const d=s===v.id,u=m.has(v.id),g=Xt(n[v.id]||0),y=n[v.id]||0;return`<div class="pa-plat-card ${d?"selected":""} ${u?"adopted":""}" data-plat="${v.id}">
                ${u?'<div class="pa-plat-active-badge">ACTIVE</div>':""}
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <span style="font-size:14px;">${v.icon}</span>
                    <span style="font-size:10px;font-weight:700;color:${u?i:d?"var(--text-bright)":"var(--text-secondary)"};line-height:1.2;">${b(v.name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.4;margin-bottom:6px;">${b(v.tagline)}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${g.color};">${g.label}</span>
                    ${y>0?`<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 3px;color:var(--text-dim);border:1px solid var(--border-mid);">${y} rival${y>1?"s":""}</span>`:""}
                </div>
            </div>`}).join("");let p;if(!r)p=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;">
                <div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:24px;color:var(--border-mid);margin-bottom:8px;">←</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Select a platform to review</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:4px;">16 platforms available</div>
                </div>
            </div>`;else{const v=r.improve.map($=>{const _=Jt($,"improve");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(92,204,92,0.05);border:1px solid rgba(92,204,92,0.15);color:${_.color};white-space:nowrap;">${_.arrow} ${Kt[$]||$}</span>`}).join(""),d=r.worsen.map($=>{const _=Jt($,"worsen");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(204,85,85,0.05);border:1px solid rgba(204,85,85,0.15);color:${_.color};white-space:nowrap;">${_.arrow} ${Kt[$]||$}</span>`}).join(""),u=m.has(r.id),g=X.length;let y;u?y=`<div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${i};display:flex;align-items:center;gap:6px;">✓ CURRENT PLATFORM</div>`:g>=3?y='<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">All 3 platform slots are full.</div>':o?y=`<div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:#ca5;font-weight:700;">⚠ Confirm: Adopt ${b(r.name)}?</span>
                    <div style="display:flex;gap:6px;">
                        <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-plat-conf-cancel">Cancel</button>
                        <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-conf-yes">Confirm</button>
                    </div>
                </div>`:y=`<div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Costs 2 AP. Stats locked at current values. 6-tick cooldown.</span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-adopt" style="background:${i};">Adopt Platform</button>
                </div>`,p=`
                <div style="padding:16px 20px 12px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                        <span style="font-size:22px;">${r.icon}</span>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${b(r.name)}</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.04em;margin-top:1px;">${b(r.tagline.toUpperCase())}</div>
                        </div>
                    </div>
                    <div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">${b(r.desc)}</div>
                </div>
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);background:var(--bg-card);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">MOMENTUM GAIN</div>
                            <div style="display:flex;align-items:baseline;gap:6px;">
                                <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${l.color};">${l.label}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);">${b(l.note)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="flex:1;padding:12px 20px;overflow-y:auto;">
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.1em;color:var(--green);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--green);display:inline-block;"></span>
                            PROMISES TO IMPROVE <span style="font-weight:400;color:var(--text-dim);">(${r.improve.length} stats, +${Mt} target)</span>
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
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.5;">${b(r.tradeoff)}</div>
                    </div>
                    <div style="margin-top:12px;padding:8px 12px;background:var(--bg-card);border:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">PROMISE RULES</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">
                            Stats are locked at current values when adopted. If your party enters government, you have <strong style="color:var(--text-bright);">24 ticks</strong> to move each promised stat by <strong style="color:var(--text-bright);">+${Mt}</strong>. Failure: <strong style="color:var(--red);">-20 Momentum, -10 Governance</strong>. If you don't enter government, the promise abates.
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
                        ${c}
                    </div>
                    <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow-y:auto;" id="pa-plat-detail">
                        ${p}
                    </div>
                </div>
            </div>
        `,document.getElementById("pa-plat-close")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=v=>{v.target===t&&t.classList.remove("active")},document.getElementById("pa-plat-grid")?.addEventListener("click",v=>{const d=v.target.closest(".pa-plat-card");d&&(s=d.dataset.plat,o=!1,f())}),document.getElementById("pa-plat-adopt")?.addEventListener("click",()=>{o=!0,f()}),document.getElementById("pa-plat-conf-cancel")?.addEventListener("click",()=>{o=!1,f()}),document.getElementById("pa-plat-conf-yes")?.addEventListener("click",()=>da(e,s))}t.classList.add("active"),f()}let kt=!1;async function da(e,t){if(kt)return;kt=!0;const a=document.getElementById("pa-platform-modal"),i=x.faction,s=x.nation;if(!i||!s||!t){kt=!1;return}const o=_t.find(r=>r.id===t);if(!o)return;const n={},m={},f=r=>Vt.has(r);for(const r of o.improve){const l=Number(s[r]??50);n[r]=l,f(r)?m[r]=Math.max(0,l-Mt):m[r]=Math.min(100,l+Mt)}try{const r=x.shard?.current_tick||0,{data:l,error:c}=await w.rpc("adopt_platform",{p_faction_id:i.id,p_nation_id:s.id,p_platform_key:t,p_tick:r,p_baseline_stats:n,p_target_stats:m});if(c){console.error("[PartyActions] Platform adoption failed:",c.message),alert("Failed to adopt platform: "+c.message);return}if(l&&!l.success){alert(l.error||"Failed to adopt platform.");return}const p=l?.slot||X.length+1;X.push({faction_id:i.id,nation_id:s.id,platform_key:t,slot:p,adopted_at_tick:r,baseline_stats:n,target_stats:m,status:"active"}),It.push(X[X.length-1]),i&&l?.momentum_gained&&(i.momentum=(i.momentum||0)+l.momentum_gained),i&&(i.action_points=Math.max(0,(i.action_points||0)-2)),a?.classList.remove("active"),H(e)}catch(r){console.error("[PartyActions] Platform adoption error:",r),alert("An error occurred. Please try again.")}finally{kt=!1}}let ut=null,be={isOpposition:!0,administration:null,governanceScore:0,governanceDeltas:[],governanceMultiplier:1,governanceDecayCycles:0,ticksInPower:0,myFaction:null,allParties:[],rivalParties:[],factionIdeology:{},electoralStandings:[],recentActivity:[],caucuses:[],nextElection:null,nextElectionTicks:null,ideologyAxes:[]};function q(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}const ca=[...Me,...Se];function pa(e,t,a,i){const s=i-(a||i);if(!t)return{score:0,deltas:[],decayCycles:0,multiplier:1,ticksInPower:s};let o=0,n=0;const m=[];for(const c of ca){const p=Le(c);if(p===0)continue;const v=Number(t[c]??0),d=Number(e[c]??0),u=d-v;if(u===0)continue;const g=u*p,y=g>0;m.push({key:c,start:v,now:d,delta:u,signed:g,dir:p,isGood:y}),o+=g,n++}let f=n>0?o/n:0;const r=Math.floor(s/24),l=f>0?Math.pow(.97,r):1;return f*=l,{score:Math.round(f*10)/10,deltas:m,decayCycles:r,multiplier:l,ticksInPower:s}}function ma(e,t,a){return Ie.map(i=>{const s=t[e],n=((s?Number(s[i.key]??0):0)+100)/200,m=a.map(f=>{const r=t[f.id],l=r?Number(r[i.key]??0):0;return{id:f.id,pos:(l+100)/200,color:f.party_color||"#666"}});return{key:i.key,name:`${i.leftLabel} / ${i.rightLabel}`,left:i.leftLabel.toUpperCase(),right:i.rightLabel.toUpperCase(),leftColor:i.leftColor,rightColor:i.rightColor,yourPos:n,parties:m}})}async function fa(e,t,a){ut=t;const i=document.getElementById(a);if(!i)return;const s=t.faction,o=t.nation,n=o?.id,m=s?.id;if(!s||!n){i.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">No faction data.</div>';return}i.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Loading party overview...</div>';try{const f=t.shard?.current_tick||0,[r,l,c,p,v,d,u]=await Promise.all([pe(e,n,m),e.from("factions").select("*").eq("nation_id",n).eq("faction_type","party"),e.from("faction_ideology").select("*"),e.from("faction_electoral_standing").select("*").eq("nation_id",n),e.from("campaign_actions").select("*").eq("party_id",m).order("tick_performed",{ascending:!1}).limit(20),e.from("caucus_factions").select("*").eq("party_id",m).eq("is_active",!0),e.from("elections").select("*").eq("nation_id",n).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(5)]);l.error&&console.error("[PartyOverview] Parties fetch error:",l.error.message),c.error&&console.error("[PartyOverview] Ideology fetch error:",c.error.message),p.error&&console.error("[PartyOverview] Standings fetch error:",p.error.message),v.error&&console.error("[PartyOverview] Activity fetch error:",v.error.message),d.error&&console.error("[PartyOverview] Caucus fetch error:",d.error.message),u.error&&console.error("[PartyOverview] Election fetch error:",u.error.message);const g=l.data||[],y=r.administration,$={};for(const S of c.data||[])$[S.faction_id]=S;let _={score:0,deltas:[],decayCycles:0,multiplier:1,ticksInPower:0};y&&y.stats_at_start&&(_=pa(o,y.stats_at_start,y.started_at_tick,f));const I=u.data||[],h=I[0]||null,k=h?Math.max(0,h.election_tick-f):null;let E=null;h&&o&&(o.government_type?.toLowerCase().includes("presidential")||o.hos_election_method==="direct_vote")&&(E=I.some(M=>M.election_type==="presidential"&&M.election_tick===h.election_tick)?"General":"Midterm");const C=ma(m,$,g);be={isOpposition:r.isOpposition,administration:y,governanceScore:_.score,governanceDeltas:_.deltas.sort((S,R)=>Math.abs(R.signed)-Math.abs(S.signed)),governanceMultiplier:_.multiplier,governanceDecayCycles:_.decayCycles,ticksInPower:_.ticksInPower,myFaction:s,allParties:g,rivalParties:g.filter(S=>S.id!==m),factionIdeology:$,electoralStandings:p.data||[],recentActivity:v.data||[],caucuses:d.data||[],nextElection:h,nextElectionTicks:k,nextElectionLabel:E,ideologyAxes:C},he(i)}catch(f){console.error("[PartyOverview] Init error:",f),i.innerHTML='<div style="padding:40px;text-align:center;color:var(--red);font-family:var(--font-mono);font-size:10px;">Failed to load party overview.</div>'}}let Z=[];function he(e){const t=be,a=t.myFaction,i=ut.nation,s=a?.party_color||a?.color||"#c8a832";ut.shard?.current_tick,Z.length===0&&(Z=[a?.id,...t.rivalParties.map(l=>l.id)]),t.administration?.admin_name||t.isOpposition;const o=t.isOpposition?"OPPOSITION":"GOVERNING",n=t.isOpposition?"var(--orange)":"var(--green)",m=a?.seats||0,f=i?.total_seats||100,r=a?.momentum??50;e.innerHTML=`<div class="po-page">
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
    </div>`,e.querySelectorAll(".po-legend-item").forEach(l=>{l.addEventListener("click",()=>{const c=l.dataset.partyId;c!==a?.id&&(Z.includes(c)?Z=Z.filter(p=>p!==c):Z.push(c),he(e))})})}function va(e,t,a,i,s){const o=e.governanceScore,n=o>=0?"var(--green)":"var(--red)",m=e.isOpposition?"Opposition":e.administration?.admin_name||"Government",f=(ut.nation?.government_type||"").toLowerCase().includes("monarchy"),r=f?"No elections":e.nextElectionTicks!=null?e.nextElectionTicks:"—",l=f?"var(--text-dim)":typeof r=="number"&&r<=3?"var(--red)":"var(--text-bright)",c=f?"NEXT ELECTION":e.nextElectionLabel?"NEXT "+e.nextElectionLabel.toUpperCase():"NEXT ELECTION";return`<div class="po-summary">
        <div class="po-summary-cell" style="display:flex;flex-direction:row;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;background:${t};"></div>
            <div>
                <div style="font-size:11px;font-weight:700;color:var(--text-bright);">${q(m)}</div>
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
            <div class="po-summary-label">${c}</div>
            <div class="po-summary-value" style="color:${l};">${r}${typeof r=="number"?" ticks":""}</div>
        </div>
    </div>`}function ua(e,t,a,i,s){const o=t?.leader_first_name&&t?.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown",n=((t?.leader_first_name||"?")[0]+(t?.leader_last_name||"?")[0]).toUpperCase();t?.leader_age&&`${t.leader_age}`;const m=t?.approval_rating??0;return`<div class="po-card po-identity" style="border-left-color:${a};">
        <div class="po-identity-inner">
            <div class="po-identity-logo" style="color:${a};background:${a}12;border-color:${a}33;">${n}</div>
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                    <span class="po-identity-name">${q(t?.faction_name)}</span>
                    <span class="po-identity-badge" style="color:${s};background:${s}0a;border-color:${s}44;">${i}</span>
                </div>
                <div class="po-identity-meta">${e.ticksInPower} ticks in power</div>
                <div class="po-leader-row">
                    <div class="po-leader-avatar" style="color:${a};background:${a}15;border-color:${a}33;">${n}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-size:10px;font-weight:600;color:var(--text-bright);">${q(o)}</span>
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
    </div>`}function ga(e){const t=e.governanceDeltas.slice(0,12),a=e.governanceScore,i=a>=0?"var(--green)":"var(--red)",s=e.governanceDecayCycles>0&&a>0?`Decay: ${((1-e.governanceMultiplier)*100).toFixed(1)}% (${e.governanceDecayCycles} cycles)`:"",o=t.map((n,m)=>{const f=n.isGood?"var(--green)":"var(--red)",r=n.delta>0?"+":"",l=n.key.replace(/_/g," ").replace(/\b\w/g,c=>c.toUpperCase());return`<div class="po-gov-row" style="${m<t.length-1?"border-bottom:1px solid rgba(200,196,184,0.03);":""}">
            <span class="po-gov-stat">${q(l)}</span>
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
            <span class="po-legend-name">${q(n.name)}</span>
        </div>`}).join(""),o=e.ideologyAxes.map(n=>{const m=n.parties.filter(r=>Z.includes(r.id)).map(r=>`<div class="po-axis-dot" style="left:${r.pos*100}%;background:${r.color};"></div>`).join(""),f=[20,40,60,80].map(r=>`<div class="po-axis-zone" style="left:${r}%;"></div>`).join("");return`<div class="po-axis">
            <div class="po-axis-labels">
                <span class="po-axis-label">${q(n.left)}</span>
                <span class="po-axis-name">${q(n.name)}</span>
                <span class="po-axis-label">${q(n.right)}</span>
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
                <div class="po-caucus-name">${q(s.name)}</div>
                <div class="po-caucus-wing" style="color:var(--text-dim);">${q(r)}</div>
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
        <div style="max-height:380px;overflow-y:auto;">${t.map(o=>{const n=a-(o.tick_performed||0),m=n===0?"0t":n+"t",f=o.result||{},r=f.momentumDelta||f.momentum_delta||(f.effects||[]).reduce((d,u)=>d+(u.stat==="Momentum"?u.value:0),0)||0,l=r>0?"+":"",c=r>0?"var(--green)":r<0?"var(--red)":"var(--text-dim)";let v=i[o.action_type]||o.action_type?.replace(/_/g," ")||"?";return o.action_type==="rally"?v="Rally: "+(f.outcomeName||"Unknown")+(r?" ("+l+r+")":""):o.action_type==="press_conference"?v="Press Conference ("+l+r+")":o.action_type==="attack"?v="Attack on "+(f.targetName||"rival"):o.action_type==="issue_statement"?v="Issued statement"+(r?" ("+l+r+")":""):o.action_type==="take_stance"?v="Took stance on "+(f.issueLabel||"issue"):o.action_type==="ideological_pivot"?v="Ideology shift: "+(f.targetAxis||""):o.action_type==="poll_now"&&(v="Polled (margin: "+(f.pollMargin||"?")+")"),`<div style="padding:5px 12px;border-bottom:1px solid rgba(200,196,184,0.03);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:9px;color:var(--text-secondary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:8px;">${q(v)}</span>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${c};">${r!==0?l+r:"—"}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);width:20px;text-align:right;">${m}</span>
            </div>
        </div>`}).join("")}</div>
    </div>`}function _a(e,t){const a=e.rivalParties,i=e.administration,s=new Set((Array.isArray(i?.coalition_parties)?i.coalition_parties:[]).map(l=>l?typeof l=="string"?l:typeof l=="object"&&(l.party_id||l.id)||null:null).filter(Boolean)),o=i?.pm_party_id,n=ut.nation?.total_seats||100,m=["SEC/FRE","TRA/PRO","IND/COL","LIB/EQL","GLB/NAT"],f=["security_freedom","tradition_progress","individualism_collectivism","liberty_equality","globalism_nationalism"],r=a.map(l=>{const c=l.party_color||"#666",p=l.abbreviation||l.faction_name?.slice(0,3)?.toUpperCase()||"?",v=l.leader_first_name&&l.leader_last_name?`${l.leader_first_name} ${l.leader_last_name}`:"Unknown",d=l.seats||0,u=l.id===o,g=s.has(l.id);let y,$;u?(y="GOVERNING — LEAD",$="var(--green)"):g?(y="GOVERNING — JUNIOR",$="var(--green)"):(y="OPPOSITION",$="var(--orange)");const _=d-(t?.seats||0),I=_>0?"var(--green)":_<0?"var(--red)":"var(--text-dim)",h=e.factionIdeology[l.id],k=f.map((E,C)=>{const R=((h?Number(h[E]??0):0)+100)/200;return`<div style="display:flex;align-items:center;gap:6px;">
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);width:42px;text-align:right;">${m[C]}</span>
                <div style="flex:1;height:5px;background:var(--border-main);position:relative;">
                    <div style="position:absolute;top:50%;left:${R*100}%;transform:translate(-50%,-50%);width:8px;height:8px;border-radius:50%;background:${c};"></div>
                </div>
            </div>`}).join("");return`<div style="padding:12px 16px;border-bottom:1px solid var(--border-main);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:36px;height:36px;background:${c}15;border:1px solid ${c}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${c};">${q(p)}</div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:var(--text-bright);">${q(l.faction_name)}</div>
                        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${q(v)}</div>
                    </div>
                </div>
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 7px;color:${$};background:${$}0a;border:1px solid ${$}44;white-space:nowrap;">${y}</span>
            </div>
            <div style="display:flex;gap:10px;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">SEATS</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${d>0?"var(--text-bright)":"var(--text-dim)"};">${d}</span>
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">/ ${n}</span>
                </div>
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">VS YOU</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${I};">${_>0?"+":""}${_}</span>
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:3px;">${k}</div>
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
    </div>`}let L=null,N=null,ot=!1,gt=null,B=[],st=[],J=0,Q=0,St=null,rt=0,mt=[],Rt=!1,xt=null,j={},Ft=!1;function ht(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}const ka=6,Ea=4;async function _e(e,t){L=e,N=t;const a=t.nation,i=t.faction;if(!a||!i)return{needed:!1};const[s,o,n,m]=await Promise.all([e.from("elections").select("id, election_type, election_tick, status").eq("nation_id",a.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),e.from("shard").select("current_tick").eq("name","Alpha Shard").single(),e.from("government_formations").select("id").eq("nation_id",a.id).eq("status","formed").order("formed_at",{ascending:!1}).limit(1).maybeSingle(),e.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1})]);rt=o.data?.current_tick??0,B=m.data||[],J=B.reduce((c,p)=>c+(p.seats||0),0),Q=Math.ceil(J/2)+1;const f=s.data,r=!!n.data;if((a.government_type||"").toLowerCase().includes("presidential")||a.hos_election_method==="direct_vote"){if(ot=!1,f&&!r)try{const c=o.data?.current_tick??0,{data:p}=await e.from("presidents").select("faction_id").eq("nation_id",a.id).eq("is_active",!0).maybeSingle(),v=p?.faction_id||B[0]?.id;if(v){const d=(a.government_type||"").toLowerCase().includes("semi");await e.from("government_formations").insert({nation_id:a.id,proposed_by:v,status:"formed",party_ids:[v],formation_type:"coalition",formed_at:new Date().toISOString()}),await e.from("ministries").delete().eq("nation_id",a.id).eq("is_active",!0);const u=[["interior","Minister of the Interior"],["foreign","Minister of Foreign Affairs"],["defense","Minister of Defense"],["finance","Minister of Finance"],["education","Minister of Education"],["healthcare","Minister of Health"],["labor","Minister of Labor"],["justice","Minister of Justice"],["trade","Minister of Trade"],["energy","Minister of Energy"],["transportation","Minister of Transportation"]];d&&u.unshift(["prime_minister","Prime Minister"]);const g=u.map(([y,$])=>({nation_id:a.id,ministry_key:y,ministry_name:$,party_id:d?null:v,is_active:!0}));await e.from("ministries").insert(g),d&&await e.from("head_of_government").delete().eq("nation_id",a.id)}}catch(c){console.warn("[Coalition] Presidential auto-gov failed:",c.message)}return{needed:!1}}return f&&!r?(ot=!0,gt=f.id,St=f.election_tick):(ot=!r,f&&(gt=f.id,St=f.election_tick)),{needed:ot}}async function ct(e){if(!e)return;const t=N.nation?.id,a=(N.nation?.government_type||"").toLowerCase().includes("semi");if(t&&!a){const{count:h}=await L.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",t).eq("is_active",!0).is("party_id",null);if(h&&h>=5){const{data:k}=await L.from("government_formations").select("*").eq("nation_id",t).not("ministry_assignments","eq","{}").order("created_at",{ascending:!1}).limit(1).maybeSingle();if(k&&k.ministry_assignments&&Object.keys(k.ministry_assignments).length>=5){k.status!=="formed"&&(await L.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",k.id),await L.from("government_formations").update({status:"cancelled"}).eq("nation_id",t).eq("status","active").neq("id",k.id)),j=k.ministry_assignments,await Wt(t);const E=k.ministry_assignments.prime_minister;if(E)try{await ce(L,t,E,rt,{skipCoalitionCheck:!0})}catch(C){console.warn("[Coalition] PM appointment during repair failed:",C.message)}ot=!1,e.innerHTML=`<div class="cf-page">
                    <div class="cf-no-formation">
                        <div class="cf-no-icon">✓</div>
                        <div class="cf-no-title">Government Formed — Cabinet Populated</div>
                        <div class="cf-no-desc">Ministry assignments have been applied. Refresh the Government page to see your cabinet.</div>
                    </div>
                </div>`;return}}}if((N.nation?.government_type||"").toLowerCase().includes("presidential")||N.nation?.hos_election_method==="direct_vote"){const h=(N.nation?.government_type||"").toLowerCase().includes("semi");e.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#127979;</div>
                <div class="cf-no-title">${h?"Semi-Presidential System":"Presidential System"}</div>
                <div class="cf-no-desc">${h?"The President nominates a Prime Minister for parliamentary confirmation. The PM then appoints cabinet ministers. No coalition formation is required.":"The President governs directly and nominates cabinet ministers. No coalition formation is required."}</div>
            </div>
        </div>`;return}const s=(N.nation?.government_type||"").toLowerCase();if(s.includes("absolute")&&s.includes("monarchy")){e.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#128081;</div>
                <div class="cf-no-title">Absolute Monarchy</div>
                <div class="cf-no-desc">The Crown rules by decree. There are no elections.</div>
            </div>
        </div>`;return}if(!ot){e.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">✓</div>
                <div class="cf-no-title">Government Formed</div>
                <div class="cf-no-desc">A coalition government is currently active. No formation needed.</div>
            </div>
        </div>`;return}if(!gt){const h=N.nation?.id;let k="?";if(h){const{data:E}=await L.from("elections").select("election_tick").eq("nation_id",h).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(1).maybeSingle();E&&(k=Math.max(0,E.election_tick-rt))}e.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon" style="font-size:2rem;">&#9878;</div>
                <div class="cf-no-title">No Government</div>
                <div class="cf-no-desc">No election has been held yet. The first election is in <strong style="color:var(--accent);">${k}</strong> tick${k!==1?"s":""}.</div>
            </div>
        </div>`;return}await Aa();const o=N.faction,m=(N.nation?.failed_formation_attempts||0)>=1?Ea:ka,f=St!==null?Math.max(0,rt-St):0,r=Math.max(0,m-f),l=Math.min(100,f/m*100),c=f*2;let p="safe";r<=1?p="critical":r<=2&&(p="warning");const v=p==="critical"?"⚠️":p==="warning"?"⏳":"🤝",d=p==="critical"?"No Government — Snap Election Imminent":p==="warning"?"Coalition Formation — Time Running Out":"Coalition Formation In Progress",u=p==="critical"?"Form a government immediately or face snap elections":p==="warning"?"Parties are negotiating — the deadline is approaching":"Parties are negotiating a coalition — propose or join one below",g=B.find(h=>h.id===o.id)?.seats||0,y=g>0,$=st.some(h=>h.proposed_by===o.id);let _="";if(!y)_='<div class="cf-note">Your party has <strong>0 seats</strong>. You cannot propose a coalition, but you may be invited to one.</div>';else if($)_='<div class="cf-note">You have already submitted a proposal for this election.</div>';else{const h=B.map(k=>{const E=k.id===o.id,C=k.seats||0,S=k.party_color||"#888";return`<div class="cf-party-check ${E?"checked disabled":""}" data-party-id="${k.id}" style="border-left:3px solid ${S};">
                <div class="cf-check-box">${E?"✓":""}</div>
                <span class="cf-check-name">${ht(k.faction_name)}</span>
                <span class="cf-check-seats">${C} seats</span>
            </div>`}).join("");_=`
            <div class="cf-propose-section">
                <div class="cf-section-title">Propose a Government</div>
                <div class="cf-section-desc">Select which parties will form the coalition. You need ${Q}+ seats for a majority.</div>
                <div class="cf-party-grid" id="cf-party-grid">${h}</div>
                <div class="cf-seat-preview" id="cf-seat-preview">
                    Coalition seats: <span class="cf-preview-val" id="cf-preview-seats">${g}</span> / ${J}
                    (<span id="cf-preview-pct">${J?Math.round(g/J*100):0}</span>%)
                    <span id="cf-preview-threshold" style="margin-left:8px;color:var(--text-dim);">— needs ${Q} seats</span>
                </div>
                <button class="cf-submit-btn" id="cf-propose-btn">Submit Proposal</button>
            </div>`}const I=st.length>0?`
        <div class="cf-section-title" style="margin-top:16px;">Active Proposals</div>
        <div class="cf-proposals-grid">${st.map(h=>{const k=B.find(et=>et.id===h.proposed_by),E=h.party_ids||[],C=E.reduce((et,at)=>et+(B.find(G=>G.id===at)?.seats||0),0),S=J?Math.round(C/J*100):0,R=C>=Q,M=E.map(et=>{const at=B.find(G=>G.id===et);return`<span class="cf-party-chip" style="border-left:2px solid ${at?.party_color||"#888"};">${ht(at?.faction_name||"?")} · ${at?.seats||0}</span>`}).join("");let z="";h.iAmSupporting?z='<span class="cf-status cf-status--supporting">✓ SUPPORTING</span>':h.iAmInvited?z='<span class="cf-status cf-status--invited">INVITED</span>':z='<span class="cf-status cf-status--locked">NOT INVITED</span>';const A=h.iAmInvited&&!h.iAmSupporting?`<button class="cf-support-btn" data-formation-id="${h.id}" data-action="support">Support This Coalition</button>`:h.iAmSupporting?`<button class="cf-withdraw-btn" data-formation-id="${h.id}" data-action="withdraw">Withdraw Support</button>`:"",T=h.supportCount>=h.coalitionSize,O=xt===h.id,P=T&&h.iAmInvited&&!O,W=T&&O;return`<div class="cf-proposal-card ${h.iAmSupporting?"supporting":""} ${h.iAmInvited?"":"not-invited"}">
                <div class="cf-proposal-title">${ht(k?.faction_name||"Unknown")} Coalition ${z}</div>
                <div class="cf-proposal-seats">Seats: <span style="color:${R?"var(--green)":"var(--red)"};">${C}</span> (${S}%) ${R?"✓":"— below threshold"}</div>
                <div class="cf-proposal-chips">${M}</div>
                <div class="cf-proposal-support">Support: ${h.supportCount} / ${h.coalitionSize} coalition members ${T?'<span style="color:var(--green);font-weight:700;"> — UNANIMOUS</span>':""}</div>
                ${A}
                ${P?`<button class="cf-support-btn" data-formation-id="${h.id}" data-action="configure" style="margin-top:6px;background:var(--green);color:#000;border-color:var(--green);">Configure Government &amp; Assign Ministries</button>`:""}
                ${W?Ma(h):""}
            </div>`}).join("")}</div>
    `:"";e.innerHTML=`<div class="cf-page">
        <!-- Formation Banner -->
        <div class="cf-banner cf-banner--${p}">
            <div class="cf-banner-header">
                <span class="cf-banner-icon">${v}</span>
                <div>
                    <div class="cf-banner-title">${d}</div>
                    <div class="cf-banner-subtitle">${u}</div>
                </div>
            </div>
            <div class="cf-countdown">
                <div class="cf-countdown-track"><div class="cf-countdown-fill cf-countdown-fill--${p}" style="width:${l}%;"></div></div>
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
                    <div class="cf-penalty-val" style="color:var(--red);">-${c}%</div>
                    <div class="cf-penalty-label">Total Lost</div>
                </div>
            </div>
        </div>

        ${_}
        ${I}
    </div>`,mt=[o.id],za(e)}const Ca={prime_minister:"Prime Minister",interior:"Interior",foreign:"Foreign Affairs",defense:"Defense",finance:"Finance",education:"Education",healthcare:"Healthcare",labor:"Labor",justice:"Justice",trade:"Trade",energy:"Energy",transportation:"Transportation",security:"Security"},Ia=["prime_minister","interior","foreign","defense","finance","education","healthcare","labor","justice","trade","energy","transportation"];function Ma(e){const t=(e.party_ids||[]).map(r=>B.find(l=>l.id===r)).filter(Boolean),a=(e.party_ids||[]).includes(N.faction?.id);j={...e.ministry_assignments||{}};const s=N.faction?.id,o=j.prime_minister,n=o===s;let m=`<div style="padding:12px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--accent);margin-bottom:10px;">CONFIGURE GOVERNMENT</div>
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:12px;">All coalition members can assign ministries. The party selected as Prime Minister clicks Form Government.</div>`;for(const r of Ia){const l=Ca[r]||r,c=r==="prime_minister",p=j[r];a&&(m+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="width:140px;font-family:var(--font-mono);font-size:10px;font-weight:${c?"700":"400"};color:${c?"var(--accent)":"var(--text-secondary)"};letter-spacing:0.5px;">${l}</span>
                <select data-ministry="${r}" class="cf-ministry-select" style="flex:1;padding:4px 8px;font-family:var(--font-mono);font-size:10px;color:var(--text-bright);background:var(--bg-body);border:1px solid var(--border-main);outline:none;">
                    <option value="">— Select Party —</option>
                    ${t.map(v=>`<option value="${v.id}" ${p===v.id?"selected":""}>${ht(v.faction_name)} (${v.seats||0} seats)</option>`).join("")}
                </select>
            </div>`)}const f=!!j.prime_minister;if(f&&n)m+=`<div style="margin-top:14px;display:flex;justify-content:flex-end;">
            <button id="cf-form-gov-btn" style="padding:10px 28px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1.5px;color:#000;background:var(--green);border:1px solid var(--green);cursor:pointer;">FORM GOVERNMENT</button>
        </div>`;else if(f&&!n){const r=t.find(l=>l.id===o);m+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(92,204,92,0.04);border:1px solid rgba(92,204,92,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Waiting for <span style="color:var(--green);font-weight:700;">${ht(r?.faction_name||"PM party")}</span> to click Form Government.
        </div>`}else m+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Select a Prime Minister to enable government formation.
        </div>`;return m+="</div>",m}async function Sa(e,t){if(Ft)return;const a=j.prime_minister;if(!a){alert("You must assign a Prime Minister first.");return}console.log("[Coalition] handleFormGovernment called. Assignments:",JSON.stringify(j)),console.log("[Coalition] Formation:",e.id,"PM party:",a),Ft=!0;const i=document.getElementById("cf-form-gov-btn");i&&(i.disabled=!0,i.textContent="FORMING...");try{const s=N.nation,o=s.id,{error:n}=await L.from("government_formations").update({ministry_assignments:j}).eq("id",e.id);if(n)throw new Error("Failed to save assignments: "+n.message);let m=!1;try{const r=Et?Et(null,s):{},{error:l}=await L.rpc("finalize_government_formation",{p_formation_id:e.id,p_caller_faction_id:N.faction.id,p_ministry_baselines:r||{}});if(l)throw l;m=!0}catch(r){console.warn("[Coalition] RPC failed, using fallback:",r.message)}m||await La(e),await L.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",e.id);const{count:f}=await L.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",o).eq("is_active",!0).is("party_id",null);f&&f>=5&&(console.warn(`[Coalition] ${f} vacant ministries — populating from assignments`),await Wt(o)),await ce(L,o,a,rt,{skipCoalitionCheck:!0}),ot=!1,alert("Government formed successfully!"),await ct(t)}catch(s){console.error("[Coalition] Form government failed:",s),alert("Failed to form government: "+(s.message||s))}finally{Ft=!1,i&&(i.disabled=!1,i.textContent="FORM GOVERNMENT")}}async function La(e){const t=N.nation.id,{error:a}=await L.from("government_formations").update({status:"cancelled"}).eq("nation_id",t).eq("status","active").neq("id",e.id);a&&console.warn("[Coalition] Failed to cancel rival formations:",a.message);const{error:i}=await L.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",e.id);if(i)throw i;const{error:s}=await L.from("nations").update({failed_formation_attempts:0}).eq("id",t);s&&console.warn("[Coalition] Failed to reset formation attempts:",s.message),await Wt(t);try{const o={id:e.id,party_ids:e.party_ids||[],lead_party_id:j.prime_minister};await Ce(L,t,N.nation,"election",o,B,rt,N.shard?.current_date||"",Number(N.nation?.gov_approval??50))}catch(o){console.warn("[Coalition] Administration rollover failed (non-fatal):",o.message)}try{const o=j.prime_minister,n=B.find(f=>f.id===o),m=(e.party_ids||[]).map(f=>{const r=B.find(l=>l.id===f);return r?`${r.faction_name} (${r.seats||0})`:null}).filter(Boolean).join(", ");await L.from("event_log").insert({nation_id:t,event_name:"Coalition Government Formed",category:"government",fired_at_tick:rt,description_used:`${n?.faction_name||"PM party"} formed a coalition government with: ${m}`,description_chosen:`${n?.faction_name||"PM party"} formed a coalition government with: ${m}`})}catch(o){console.warn("[Coalition] event_log insert failed (non-fatal):",o.message)}}async function Wt(e){const t={prime_minister:"Prime Minister",interior:"Minister of the Interior",foreign:"Minister of Foreign Affairs",defense:"Minister of Defense",finance:"Minister of Finance",education:"Minister of Education",healthcare:"Minister of Health",labor:"Minister of Labor",justice:"Minister of Justice",trade:"Minister of Trade",energy:"Minister of Energy",transportation:"Minister of Transportation",security:"Minister of Security"};let a=0;for(const[i,s]of Object.entries(j)){if(!s)continue;const o=Ut(N.nation?.name)||{},n=o.firstNames||["Alex","Maria","Carlos"],m=o.lastNames||["Garcia","Torres","Silva"],f=n[Math.floor(Math.random()*n.length)],r=m[Math.floor(Math.random()*m.length)],l=35+Math.floor(Math.random()*25),c=Et?Et(i,N.nation):{},p=t[i]||i,{data:v,error:d}=await L.from("ministries").update({party_id:s,minister_first_name:f,minister_last_name:r,minister_age:l,minister_approval:50,stat_baselines:c,is_active:!0}).eq("nation_id",e).eq("ministry_key",i).select("id");if(d)console.error(`[Coalition] FAILED to update ministry ${i}:`,d.message);else if(!v||v.length===0){const{error:y}=await L.from("ministries").insert({nation_id:e,ministry_key:i,ministry_name:p,party_id:s,minister_first_name:f,minister_last_name:r,minister_age:l,minister_approval:50,stat_baselines:c,is_active:!0});y?console.error(`[Coalition] FAILED to insert ministry ${i}:`,y.message):a++}else a++;const u=p,{error:g}=await L.from("cabinet_members").update({party_id:s,person_name:f+" "+r}).eq("nation_id",e).eq("position",u).eq("is_active",!0);g&&console.warn(`[Coalition] cabinet_members update failed for ${u}:`,g.message)}console.log(`[Coalition] Updated ${a} ministries for nation ${e}`)}async function Aa(){if(!gt){st=[];return}const{data:e}=await L.from("government_formations").select("*").eq("election_id",gt).eq("status","active").order("created_at",{ascending:!0}),t=[];for(const a of e||[]){const{data:i}=await L.from("government_formation_support").select("faction_id, supports").eq("formation_id",a.id),s=a.party_ids||[],n=(i||[]).filter(c=>s.includes(c.faction_id)).filter(c=>c.supports).length,m=s.length,r=(i||[]).find(c=>c.faction_id===N.faction?.id)?.supports===!0,l=s.includes(N.faction?.id);t.push({...a,supportCount:n,coalitionSize:m,iAmSupporting:r,iAmInvited:l})}st=t}let se=!1;function za(e){se||(se=!0,e.addEventListener("click",async t=>{const a=t.target.closest(".cf-party-check:not(.disabled)");if(a){const s=a.dataset.partyId,o=mt.indexOf(s);o>-1?(mt.splice(o,1),a.classList.remove("checked"),a.querySelector(".cf-check-box").textContent=""):(mt.push(s),a.classList.add("checked"),a.querySelector(".cf-check-box").textContent="✓"),Ta();return}if(t.target.closest("#cf-propose-btn")){await Pa(e);return}const i=t.target.closest(".cf-support-btn, .cf-withdraw-btn");if(i){const s=i.dataset.formationId,o=i.dataset.action;if(o==="configure"){xt=s;const n=st.find(m=>m.id===s);n&&(j={...n.ministry_assignments||{}}),await ct(e)}else await Na(s,o==="support",e);return}if(t.target.closest("#cf-form-gov-btn")){const s=st.find(o=>o.id===xt);s&&await Sa(s,e);return}}),e.addEventListener("change",t=>{const a=t.target.closest(".cf-ministry-select");if(!a)return;const i=a.dataset.ministry,s=a.value||null;j[i]=s,xt&&L.from("government_formations").update({ministry_assignments:j}).eq("id",xt).then(({error:n})=>{n&&console.warn("[Coalition] Failed to save assignment:",n.message)});const o=document.getElementById("cf-form-gov-btn");if(o){const n=!!j.prime_minister;o.disabled=!n,o.style.color=n?"#000":"var(--text-dim)",o.style.background=n?"var(--green)":"var(--bg-body)",o.style.borderColor=n?"var(--green)":"var(--border-main)",o.style.cursor=n?"pointer":"not-allowed"}}))}function Ta(){const e=document.getElementById("cf-preview-seats"),t=document.getElementById("cf-preview-pct"),a=document.getElementById("cf-preview-threshold");if(!e)return;const i=mt.reduce((n,m)=>n+(B.find(f=>f.id===m)?.seats||0),0),s=J?Math.round(i/J*100):0,o=i>=Q;e.textContent=i,e.style.color=o?"var(--green)":"var(--text-bright)",t.textContent=s,a.textContent=o?`✓ Meets ${Q}-seat threshold`:`— needs ${Q} seats`,a.style.color=o?"var(--green)":"var(--text-dim)"}async function Pa(e){if(Rt)return;const t=N.faction;if((B.find(n=>n.id===t.id)?.seats||0)===0)return;const i=[...new Set(mt)],s=i.reduce((n,m)=>n+(B.find(f=>f.id===m)?.seats||0),0);if(s<Q){alert(`Coalition needs ${Q} seats. Currently: ${s}.`);return}Rt=!0;const o=document.getElementById("cf-propose-btn");o&&(o.disabled=!0,o.textContent="Submitting...");try{const{data:n}=await L.from("shard").select("current_date").eq("name","Alpha Shard").single(),{data:m,error:f}=await L.from("government_formations").insert({nation_id:N.nation.id,election_id:gt,proposed_by:t.id,party_ids:i,status:"active",game_year:n?.current_date||""}).select().single();if(f){alert("Error: "+f.message);return}const{error:r}=await L.from("government_formation_support").upsert({formation_id:m.id,faction_id:t.id,supports:!0},{onConflict:"formation_id,faction_id"});r&&console.warn("[Coalition] Auto-support insert failed:",r.message),await ct(e)}catch(n){console.error("[Coalition] Create proposal error:",n),alert("Failed to create proposal: "+(n.message||n))}finally{Rt=!1}}async function Na(e,t,a){try{const{error:i}=await L.from("government_formation_support").upsert({formation_id:e,faction_id:N.faction?.id,supports:t},{onConflict:"formation_id,faction_id"});i&&console.error("[Coalition] Toggle support error:",i.message),await ct(a)}catch(i){console.error("[Coalition] Toggle support error:",i)}}let bt=null,it=[],Bt=[],jt=null;function U(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function re(e){return e>=1e6?(e/1e6).toFixed(2)+"M":e>=1e3?Math.round(e/1e3)+"k":String(e)}function Ra(e){return["January","February","March","April","May","June","July","August","September","October","November","December"][e%12]+", "+(2e3+Math.floor(e/12))}function Fa(e,t){if((e.election_type||"parliamentary")==="presidential")return{label:"Presidential Election",color:"#5a8aaa"};const i=t?.end_reason||"";return i.includes("no_confidence")||i.includes("vnc")?{label:"Vote of No Confidence",color:"#d44a4a"}:i.includes("snap")||i.includes("dissolved")||i.includes("early")?{label:"Early Elections Called",color:"#c84"}:{label:"General Election",color:"#8b9a6b"}}async function Oa(e,t){bt=t;const a=document.getElementById("pa-past-elections-root");if(!a)return;a.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">Loading election history...</div>';const i=t.nation?.id;if(!i){a.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No nation data.</div>';return}const[s,o,n]=await Promise.all([e.from("elections").select("id, election_tick, election_type, status, results, created_at").eq("nation_id",i).eq("status","completed").order("election_tick",{ascending:!1}),e.from("administrations").select("*").eq("nation_id",i).order("started_at_tick",{ascending:!1}),e.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",i).eq("faction_type","party").is("abandoned_at",null)]);it=s.data||[],Bt=o.data||[];const m=n.data||[],f={};for(const r of m)f[r.id]=r;for(const r of it){const l=r.results?.votes||[];for(const c of l){const p=f[c.party_id];p?(c.color=p.party_color||"#666",c.abbreviation=p.abbreviation||c.party_name?.slice(0,3)?.toUpperCase()||"?"):(c.color="#666",c.abbreviation=c.party_name?.slice(0,3)?.toUpperCase()||"?")}}Da(a),$e(a)}function Da(e){e.addEventListener("click",t=>{const a=t.target.closest("[data-election-id]");if(a){const i=a.dataset.electionId;jt=jt===i?null:i,$e(e)}})}function $e(e,t){if(it.length===0){e.innerHTML=`<div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);margin-bottom:8px;">PAST ELECTIONS</div>
            <div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No completed elections on record.</div>
        </div>`;return}const a=bt.faction?.id,i=bt.nation?.total_seats||100,s=Math.ceil(i/2)+1,o=it.map((n,m)=>{const f=jt===n.id,r=(n.results?.votes||[]).sort((C,S)=>(S.seats||0)-(C.seats||0)),l=r.slice(0,3),c=n.results?.turnout_pct??0,p=n.results?.total_votes_cast??0,v=Ra(n.election_tick),d=Bt.find(C=>C.started_at_tick>=n.election_tick&&C.started_at_tick<=n.election_tick+5),u=Bt.find(C=>C.ended_at_tick!=null&&C.ended_at_tick>=n.election_tick-2&&C.ended_at_tick<=n.election_tick+2),g=Fa(n,u),y=(bt.nation?.government_type||"").toLowerCase().includes("presidential")||bt.nation?.hos_election_method==="direct_vote",$=y?"President":"PM",_=d?.prime_minister||"Unknown",I=d?.pm_party_id&&r.find(C=>C.party_id===d.pm_party_id)?.color||"#888",k=(m<it.length-1?it[m+1]:null)?.results?.votes||[];let E=`<div data-election-id="${n.id}" style="
            background:var(--bg-panel);border:1px solid var(--border-main);
            ${f?"border-bottom:none;":""}
        ">
            <div style="padding:12px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-secondary);width:130px;">${v}</div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 10px;color:${g.color};background:${g.color}0a;border:1px solid ${g.color}25;">${g.label.toUpperCase()}</span>
                    <div style="display:flex;gap:8px;margin-left:10px;">
                        ${l.map(C=>`<div style="display:flex;align-items:center;gap:4px;">
                            <div style="width:8px;height:8px;background:${C.color};"></div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${U(C.abbreviation)}</span>
                            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--text-bright);">${C.seats}</span>
                        </div>`).join("")}
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
                        ${$}: <span style="color:${I};font-weight:700;">${U(_)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">${f?"▲":"▼"}</span>
                </div>
            </div>
        </div>`;if(f){const C=r.map(M=>`<div style="width:${M.seats/i*100}%;background:${M.color};height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${M.seats>=8?9:6}px;font-weight:700;color:#000;">${M.seats>=5?M.seats:""}</div>`).join(""),S=r.map(M=>{const z=M.party_id===a,A=k.find(W=>W.party_id===M.party_id),T=A?M.seats-(A.seats||0):null,P=M.seats/i*100-(M.vote_percentage||0);return`<div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);${z?`background:${M.color}08;`:""}">
                    <div style="width:30px;height:30px;background:${M.color}15;border:1px solid ${M.color}33;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-right:8px;">${M.abbreviation?.slice(0,2)||"?"}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:5px;">
                            <span style="font-size:13px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${U(M.party_name)}</span>
                            ${z?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#5c5;padding:0 3px;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15);">YOU</span>':""}
                        </div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:${M.color};">${U(M.abbreviation)}</div>
                    </div>
                    <span style="width:60px;text-align:right;font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${M.seats}</span>
                    <span style="width:60px;text-align:right;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${T!=null?T>0?"#5c5":T<0?"#c55":"var(--text-dim)":"var(--text-dim)"};">${T!=null?T>0?"▲ "+T:T<0?"▼ "+Math.abs(T):"—":"NEW"}</span>
                    <span style="width:70px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-bright);">${re(M.votes||0)}</span>
                    <span style="width:55px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">${(M.vote_percentage||0).toFixed(1)}%</span>
                    <span style="width:80px;text-align:right;font-family:var(--font-mono);font-size:10px;font-weight:700;color:${Math.abs(P)<2?"var(--text-dim)":P>0?"#5c5":"#c84"};">${P>0?"+":""}${P.toFixed(1)}% <span style="font-size:8px;color:var(--text-dim);">${Math.abs(P)<2?"proportional":P>0?"overrep.":"underrep."}</span></span>
                </div>`}).join("");let R="";if(d){const M=d.coalition_parties||[],z=d.total_seats||M.reduce((G,$t)=>G+($t.seats||0),0),A=z>=s,T=A?"Majority Coalition":"Minority Coalition",O=d.ended_at_tick?d.end_reason||"Ended":"Current Government",P=d.ended_at_tick?"var(--text-dim)":"#5c5",W=d.ended_at_tick?Math.abs(d.ended_at_tick-d.started_at_tick)+" ticks":"Ongoing",et=M.map(G=>{const $t=r.find(At=>At.party_id===G.party_id)?.color||"#666";return`<div style="width:${z>0?(G.seats||0)/z*100:0}%;background:${$t};height:100%;"></div>`}).join(""),at=M.map(G=>`<div style="display:flex;align-items:center;gap:4px;">
                        <div style="width:8px;height:8px;background:${r.find(At=>At.party_id===G.party_id)?.color||"#666"};"></div>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${U(G.party_name?.slice(0,3)?.toUpperCase()||"?")}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${G.seats||0}</span>
                    </div>`).join("");R=`<div style="margin:0 20px 16px;background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${I};">
                    <div style="padding:12px 16px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text-dim);">GOVERNMENT FORMED</span>
                                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 8px;color:${P};background:${P}0a;border:1px solid ${P}25;">${U(O.toUpperCase())}</span>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Lasted: ${W}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                            <div style="width:36px;height:36px;background:${I}15;border:1.5px solid ${I};display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;font-weight:700;color:${I};">${U(_.split(" ").map(G=>G[0]).join(""))}</div>
                            <div>
                                <div style="font-size:14px;font-weight:700;color:var(--text-bright);">${U(_)}</div>
                                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${y?"President":"Prime Minister"} &middot; ${U(d.pm_party_name||"")} &middot; ${T}</div>
                            </div>
                        </div>
                        <div style="display:flex;height:8px;gap:1px;margin-bottom:8px;">${et}</div>
                        <div style="display:flex;gap:10px;align-items:center;">
                            ${at}
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">&middot;</span>
                            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${A?"#5c5":"#c84"};">${z} seats ${A?"(majority +"+(z-s)+")":"(minority, "+(s-z)+" short)"}</span>
                        </div>
                    </div>
                </div>`}E+=`<div style="background:var(--bg-panel);border:1px solid var(--border-main);border-top:1px solid var(--border-main);">
                <!-- Context + Turnout -->
                <div style="display:flex;border-bottom:1px solid var(--border-main);">
                    <div style="flex:1;padding:12px 20px;border-right:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px;">CONTEXT</div>
                        <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${U(g.label)}</div>
                    </div>
                    <div style="width:260px;padding:12px 20px;display:flex;gap:16px;flex-shrink:0;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TURNOUT</div>
                            <div style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:${c>70?"#5c5":c>60?"#ca5":"#c84"};">${c.toFixed(1)}%</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TOTAL VOTES</div>
                            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">${re(p)}</div>
                        </div>
                    </div>
                </div>

                <!-- Seat bar -->
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;height:18px;gap:1px;margin-bottom:6px;">${C}</div>
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
                    ${S}
                </div>

                ${R}
            </div>`}return E}).join("");e.innerHTML=`<div style="padding:12px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);">PAST ELECTIONS</span>
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">${it.length} elections on record</span>
            </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">${o}</div>
    </div>`}let K=null,Gt=!1,le=!1,qt=!1,de=!1,Ht=!1;function we(e){document.querySelectorAll(".pa-subtab").forEach(t=>t.classList.toggle("active",t.dataset.panel===e)),document.querySelectorAll(".pa-panel").forEach(t=>t.classList.toggle("active",t.id==="panel-"+e)),sessionStorage.setItem("party_subtab",e),e==="actions"&&!Gt&&K&&(Gt=!0,ye(pt,K)),e==="parties"&&!le&&K&&(le=!0,fa(pt,K,"pa-parties-root")),e==="election"&&!qt&&K&&(qt=!0,Ht?ct(document.getElementById("pa-election-root")):_e(pt,K).then(()=>{Ht=!0,ct(document.getElementById("pa-election-root"))})),e==="past-elections"&&!de&&K&&(de=!0,Oa(pt,K))}document.getElementById("pa-subtabs").addEventListener("click",e=>{const t=e.target.closest(".pa-subtab");!t||t.classList.contains("active")||we(t.dataset.panel)});ke("politics",async e=>{K=e,_e(pt,e).then(({needed:a})=>{if(Ht=!0,a){const i=document.querySelector('.pa-subtab[data-panel="election"]');i&&!i.querySelector(".pa-subtab-badge")&&(i.innerHTML+='<span class="pa-subtab-badge"></span>');const s=document.querySelector('.nav-tab[data-tab="politics"]');s&&!s.querySelector(".pa-subtab-badge")&&(s.innerHTML+='<span class="pa-subtab-badge"></span>')}qt&&ct(document.getElementById("pa-election-root"))});const t=sessionStorage.getItem("party_subtab");t&&t!=="actions"?we(t):(Gt=!0,await ye(pt,e))});
