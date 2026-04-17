const __vite__mapDeps=(i,m=__vite__mapDeps,d=(m.f||(m.f=["assets/elections-B2jRdA_W.js","assets/config-fKhFNVuq.js","assets/government-types-CONVKpUN.js","assets/ideology-BIAflN4K.js","assets/stats-tIiBSaQA.js"])))=>i.map(i=>d[i]);
import{_supabase as dt}from"./supabase-client-CiYoFhIh.js";/* empty css                  */import{i as ke}from"./common-DzbV_OEs.js";import{_ as Ee}from"./preload-helper-BXl3LOEh.js";import{j as Ut,E as ce,B as Ce}from"./elections-B2jRdA_W.js";import{l as mt}from"./government-types-CONVKpUN.js";import{a as Ie}from"./ideology-BIAflN4K.js";import{d as Me,c as Se,s as Le,a as Et}from"./stats-tIiBSaQA.js";import"./config-fKhFNVuq.js";const _t=[{id:"economic_reform",name:"Economic Reform",icon:"📈",tagline:"Growth-first neoliberal agenda",desc:"Prioritize GDP, attract foreign capital, lower corporate taxes. The rising tide theory — grow the pie and worry about slicing it later.",improve:["gdp_growth","foreign_investment","currency_strength","credit","service_output","manufacturing_output"],worsen:["income_inequality","poverty_rate","union_strength","income_tax"],tradeoff:"Income inequality tends to rise. Working class sees GDP numbers go up while their wages don't."},{id:"social_justice",name:"Social Justice",icon:"⚖️",tagline:"Redistribution and equity",desc:"Raise minimum wage, expand welfare, progressive taxation. Close the gap between rich and poor through direct intervention.",improve:["minimum_wage","poverty_rate","income_inequality","social_mobility","healthcare_accessibility","education_accessibility"],worsen:["foreign_investment","gdp_growth","corporate_tax"],tradeoff:"Capital flight risk. Foreign investors avoid high-tax environments. Growth may slow."},{id:"national_security",name:"National Security",icon:"🛡️",tagline:"Borders, military, order",desc:"Strengthen defense, tighten borders, expand police powers. Safety through strength.",improve:["stability","crime_rate","terrorism","political_violence","illegal_immigration"],worsen:["freedom_index","press_freedom","civil_unrest","polarization"],tradeoff:"Freedom index drops. Minority communities disproportionately affected. International criticism."},{id:"anti_corruption",name:"Anti-Corruption",icon:"🔍",tagline:"Clean government, institutional reform",desc:"Independent judiciary, transparent budgets, prosecute the connected. Popular with voters but powerful people fight back hard.",improve:["corruption","judicial_independence","press_freedom","legitimacy","efficiency"],worsen:["stability"],tradeoff:"Short-term chaos as exposing corruption shakes institutions. Your own party's skeletons may surface."},{id:"green_transition",name:"Green Transition",icon:"🌱",tagline:"Climate and environment",desc:"Renewable energy investment, carbon taxes, emissions targets. Save the planet — but the bill comes due now, not later.",improve:["renewable_energy_pct","pollution","carbon_emissions","energy_generation"],worsen:["fuel_prices","manufacturing_output","gdp_growth","cost_of_living"],tradeoff:"Energy costs spike during transition. Rural and industrial voters feel abandoned."},{id:"industrialization",name:"Industrialization",icon:"🏭",tagline:"Factories, exports, production",desc:"Build manufacturing capacity, create blue-collar jobs, develop physical infrastructure. The backbone of a real economy.",improve:["manufacturing_output","labor_force_participation","unemployment","physical_infrastructure","gdp_growth"],worsen:["pollution","carbon_emissions","arable_land","healthcare_quality"],tradeoff:"Environment gets destroyed. Long-term health costs from industrial pollution."},{id:"digital_modernization",name:"Digital Modernization",icon:"💻",tagline:"Tech economy, connectivity",desc:"Fiber everywhere, tech sector incentives, digital government services. Leap into the future — but not everyone makes the jump.",improve:["digital_infrastructure","service_output","higher_education","academic_immigration","efficiency"],worsen:["manufacturing_output","labor_force_participation","income_inequality","urbanization"],tradeoff:"Automation displaces workers. Rural communities left behind. Tech wealth concentrates in cities."},{id:"welfare_state",name:"Welfare State",icon:"🏥",tagline:"Universal services, safety net",desc:"Free healthcare, free education, generous pensions, unemployment insurance. Cradle to grave — funded by steep taxes on everyone.",improve:["healthcare_quality","healthcare_accessibility","education_accessibility","poverty_rate","standard_of_living","happiness"],worsen:["income_tax","corporate_tax","gdp_growth","foreign_investment"],tradeoff:"Massive fiscal cost. Tax burden on middle class, not just the rich. Sustainability questioned."},{id:"populist_nationalism",name:"Populist Nationalism",icon:"🇲",tagline:"The people vs. elites and outsiders",desc:"Restrict immigration, protect domestic industry, reject globalism. Our people first. Our jobs first. Our culture first.",improve:["immigration","illegal_immigration","manufacturing_output","minimum_wage","union_strength"],worsen:["foreign_investment","academic_immigration","freedom_index","press_freedom","polarization","ethnic_diversity"],tradeoff:"International isolation. Brain drain as educated professionals emigrate. Deep social polarization."},{id:"free_market",name:"Free Market Liberalism",icon:"🏛️",tagline:"Deregulate everything",desc:"Cut taxes, cut red tape, let the market decide winners and losers. Government is the problem, not the solution.",improve:["gdp_growth","foreign_investment","credit","service_output","currency_strength"],worsen:["union_strength","minimum_wage","healthcare_accessibility","income_inequality","poverty_rate"],tradeoff:"Growth at the cost of the working class. Social safety net erodes. Boom-bust volatility."},{id:"law_and_order",name:"Law & Order",icon:"⚔️",tagline:"Tough on crime, strong institutions",desc:"More police, harsher sentences, zero tolerance. Restore order to the streets. Criminals fear the state.",improve:["crime_rate","stability","political_violence","terrorism","drug_use"],worsen:["incarceration_rate","freedom_index","civil_unrest"],tradeoff:"Prison population explodes. Minority communities targeted. Policing costs balloon."},{id:"education_first",name:"Education First",icon:"🎓",tagline:"Human capital as the long game",desc:"Fund schools, universities, research institutions, teacher salaries. The 20-year bet that the next generation will be smarter and richer.",improve:["literacy","higher_education","education_accessibility","academic_immigration","social_mobility","labor_force_participation"],worsen:["income_tax","gdp_growth"],tradeoff:"Voters don't see results before next election. Brain drain if jobs don't exist for graduates."},{id:"healthcare_reform",name:"Healthcare Reform",icon:"💊",tagline:"Fix the hospitals",desc:"More beds, more doctors, better drugs, universal coverage. Nobody dies because they can't afford treatment.",improve:["healthcare_quality","healthcare_accessibility","beds_per_100k","lifespan","drug_use"],worsen:["income_tax","gdp_growth","cost_of_living"],tradeoff:"Pharmaceutical lobby fights back. Extremely expensive. Takes multiple cycles to show results."},{id:"housing_cost",name:"Housing & Cost of Living",icon:"🏠",tagline:"The kitchen-table platform",desc:"Rent controls, public housing, affordable food, price caps on essentials. People can't eat GDP growth.",improve:["housing_affordability","cost_of_living","standard_of_living","physical_infrastructure","urbanization"],worsen:["foreign_investment","gdp_growth"],tradeoff:"Property owners and developers become your enemies. Market distortions create shortages."},{id:"energy_independence",name:"Energy Independence",icon:"⛽",tagline:"Control your own power supply",desc:"Exploit domestic oil, gas, and minerals. No more dependency on foreign energy. Cheap fuel, strong economy, sovereign power.",improve:["energy_generation","oil_and_gas","rare_minerals","fuel_prices","manufacturing_output","gdp_growth"],worsen:["pollution","carbon_emissions","renewable_energy_pct","arable_land"],tradeoff:"Climate commitments broken. Green voters abandon you. Environmental debt for future generations."},{id:"open_society",name:"Open Society",icon:"🕊️",tagline:"Liberal democracy, civil liberties",desc:"Free press, open borders, multicultural embrace, strong civil rights. A beacon of freedom — and a target for those who fear it.",improve:["freedom_index","press_freedom","immigration","academic_immigration","ethnic_diversity","happiness","judicial_independence"],worsen:["stability","illegal_immigration","polarization","terrorism"],tradeoff:"Nationalist backlash. Rural-urban divide deepens. Security vulnerabilities from openness."}],Kt={gdp_growth:"GDP Growth",inflation:"Inflation",interest_rates:"Interest Rates",currency_strength:"Currency Strength",foreign_investment:"Foreign Investment",credit:"Credit",income_tax:"Income Tax",corporate_tax:"Corporate Tax",sales_tax:"Sales Tax",unemployment:"Unemployment",labor_force_participation:"Labor Force Participation",minimum_wage:"Minimum Wage",union_strength:"Union Strength",poverty_rate:"Poverty Rate",income_inequality:"Income Inequality",healthcare_quality:"Healthcare Quality",healthcare_accessibility:"Healthcare Accessibility",beds_per_100k:"Beds per 100k",lifespan:"Lifespan",drug_use:"Drug Use",literacy:"Literacy",higher_education:"Higher Education",education_accessibility:"Education Accessibility",academic_immigration:"Academic Immigration",physical_infrastructure:"Physical Infrastructure",digital_infrastructure:"Digital Infrastructure",urbanization:"Urbanization",energy_generation:"Energy Generation",renewable_energy_pct:"Renewable Energy %",arable_land:"Arable Land",rare_minerals:"Rare Minerals",oil_and_gas:"Oil & Gas",fuel_prices:"Fuel Prices",pollution:"Pollution",carbon_emissions:"Carbon Emissions",standard_of_living:"Standard of Living",happiness:"Happiness",social_mobility:"Social Mobility",crime_rate:"Crime Rate",incarceration_rate:"Incarceration Rate",religiosity:"Religiosity",stability:"Stability",legitimacy:"Legitimacy",efficiency:"Efficiency",corruption:"Corruption",press_freedom:"Press Freedom",judicial_independence:"Judicial Independence",freedom_index:"Freedom Index",polarization:"Polarization",civil_unrest:"Civil Unrest",terrorism:"Terrorism",political_violence:"Political Violence",immigration:"Immigration",illegal_immigration:"Illegal Immigration",emigration:"Emigration",ethnic_diversity:"Ethnic Diversity",cost_of_living:"Cost of Living",housing_affordability:"Housing Affordability",manufacturing_output:"Manufacturing Output",service_output:"Service Output"},Vt=new Set(["inflation","unemployment","poverty_rate","income_inequality","drug_use","pollution","carbon_emissions","crime_rate","incarceration_rate","corruption","polarization","civil_unrest","terrorism","political_violence","illegal_immigration","emigration","cost_of_living","fuel_prices"]),Ae=new Set(["income_tax","corporate_tax","sales_tax"]);function Jt(e,t){const a=Vt.has(e),i=Ae.has(e);return t==="improve"?a?{arrow:"↓",color:"#5cc55c"}:i?{arrow:"↑",color:"#c84"}:{arrow:"↑",color:"#5cc55c"}:a?{arrow:"↑",color:"#c55"}:i?{arrow:"↓",color:"#5cc55c"}:{arrow:"↓",color:"#c55"}}function Xt(e){switch(e){case 0:return{momentum:12,penalty:0,label:"+12",color:"#5cc55c",note:"Unclaimed — full momentum"};case 1:return{momentum:6,penalty:6,label:"+6",color:"#ca5",note:"Contested by 1 rival — reduced momentum"};case 2:return{momentum:4,penalty:4,label:"+4",color:"#c84",note:"Crowded (2 rivals) — minimal momentum"};default:return{momentum:2,penalty:2,label:"+2",color:"#c84",note:`Crowded (${e} rivals) — minimal momentum`}}}function ze(e,t){return e.map(a=>{const i=_t.find(n=>n.id===a.platform_key);if(!i)return{...a,stats:[]};const s=i.improve.map(n=>{const o=a.baseline_stats?.[n],c=a.target_stats?.[n],f=Number(t?.[n]??50),l=Vt.has(n);if(o==null||c==null)return{stat:n,baseline:f,target:f,current:f,progress:0,met:!1};const d=Math.abs(c-o),r=l?Math.max(0,o-f):Math.max(0,f-o),m=d>0?Math.min(1,r/d):1,v=l?f<=c:f>=c;return{stat:n,baseline:o,target:c,current:f,progress:m,met:v}});return{...a,stats:s,platformDef:i}})}const Te=["Former union organizer. Knows how to mobilize a crowd.","Disbarred attorney. Understands the legal system from the inside.","Investigative journalist. Uncovered three government scandals before going private.","Ex-military intelligence. Trained in information warfare.","Community activist. Built grassroots networks across two provinces.","Former government auditor. Knows where the money hides.","Political science professor. Publishes on institutional corruption.","NGO director. Ran anti-corruption campaigns across the continent.","Former prosecutor. Left the justice ministry over political interference.","Labor rights campaigner. Organized the dockworkers' strike of 2014.","Freelance political consultant. Has worked for opposition parties in three nations.","Student movement leader. Led the university protests. Young and fearless.","Retired diplomat. Leverages international connections for domestic pressure.","Whistleblower advocate. Runs a secure tip line used by civil servants.","Former police detective. Turned against the system after a cover-up."];function st(e){return e>=75?{label:"Exceptional",color:"#5cc55c",desc:"Elite operative. Lawsuits are devastating, intelligence is razor-sharp."}:e>=60?{label:"Strong",color:"#a3b07e",desc:"Experienced and reliable. Can handle most opposition tasks effectively."}:e>=45?{label:"Competent",color:"#ca5",desc:"Gets the job done. Occasional missteps under pressure."}:e>=30?{label:"Developing",color:"#c84",desc:"Green but eager. Results are inconsistent. Cheap to hire."}:{label:"Weak",color:"#c55",desc:"Liability risk. May botch sensitive operations. Rock-bottom price for a reason."}}function Pe(e){var t=Math.max(0,e-20)/65,a=12e4+t*28e4;return Math.round(a/25e3)*25e3}function zt(e,t){return e+Math.floor(Math.random()*(t-e+1))}function Qt(e){return e[Math.floor(Math.random()*e.length)]}function Ne(e,t){var a=[],i=new Set,s=zt(5,7),n=Ut(t),o=n.firstNames||[],c=n.lastNames||[];if(o.length===0||c.length===0)return[];for(var f=Te.slice().sort(function(){return Math.random()-.5}),l=0;l<s;l++){var d,r,m,v=0;do d=Qt(o),r=Qt(c),m=d+" "+r,v++;while(i.has(m)&&v<20);i.add(m);var p=zt(20,85),u=zt(25,60),g=f[l%f.length],y=Pe(p);a.push({nation_id:e,first_name:d,last_name:r,age:u,skill:p,background:g,hire_cost:y,status:"available"})}return a.sort(function(_,$){return $.skill-_.skill}),a}async function pe(e,t,a){var{data:i,error:s}=await e.from("administrations").select("id, coalition_parties, stats_at_start, started_at_tick, pm_party_id").eq("nation_id",t).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle();if(s)return console.error("[Agitator] Failed to check opposition status:",s.message),{isOpposition:!1,administration:null};if(!i)return{isOpposition:!0,administration:null};var n=Array.isArray(i.coalition_parties)?i.coalition_parties:[],o=n.map(function(f){return f?typeof f=="string"?f:typeof f=="object"&&(f.party_id||f.id)||null:null}).filter(Boolean),c=o.includes(a)||i.pm_party_id===a;return{isOpposition:!c,administration:i}}async function me(e,t){var{data:a,error:i}=await e.from("faction_agitators").select("*").eq("faction_id",t).eq("status","active").maybeSingle();return i?(console.error("[Agitator] Failed to fetch agitator:",i.message),null):a}async function Re(e,t,a){var{data:i,error:s}=await e.from("agitator_pool").select("*").eq("nation_id",t).eq("status","available").order("skill",{ascending:!1});if(s)return console.error("[Agitator] Failed to fetch pool:",s.message),[];if(i&&i.length>0)return i;var n=Ne(t,a),{data:o,error:c}=await e.from("agitator_pool").insert(n).select("*");return c?(console.error("[Agitator] Failed to insert pool:",c.message),[]):(o||[]).sort(function(f,l){return l.skill-f.skill})}async function Fe(e,t,a,i){var s=await me(e,t);if(s)return{success:!1,agitator:null,error:"You already have an active agitator."};var{data:n,error:o}=await e.from("faction_agitators").insert({faction_id:t,first_name:a.first_name,last_name:a.last_name,age:a.age,skill:a.skill,background:a.background,status:"active",hired_at_tick:i}).select("*").single();if(o)return console.error("[Agitator] Failed to hire:",o.message),{success:!1,agitator:null,error:o.message};var{error:c}=await e.from("agitator_pool").update({status:"hired",hired_by_faction_id:t}).eq("id",a.id);return c&&console.error("[Agitator] Failed to mark pool candidate as hired:",c.message),{success:!0,agitator:n,error:null}}const Ct=[{key:"finance",label:"Finance",icon:"💰"},{key:"defense",label:"Defense",icon:"🛡️"},{key:"education",label:"Education",icon:"🎓"},{key:"healthcare",label:"Health",icon:"🏥"},{key:"interior",label:"Interior",icon:"🏛️"},{key:"foreign",label:"Foreign",icon:"🌐"},{key:"justice",label:"Justice",icon:"⚖️"},{key:"labor",label:"Labor",icon:"🔨"},{key:"trade",label:"Trade",icon:"📦"},{key:"energy",label:"Energy",icon:"⚡"},{key:"transportation",label:"Transport",icon:"🚂"},{key:"agriculture",label:"Agriculture",icon:"🌾"}],fe=[{key:"misuse_of_funds",label:"Misuse of Public Funds",desc:"Alleging budget went somewhere it shouldn't."},{key:"civil_rights",label:"Violation of Civil Rights",desc:"Alleging government overreach or suppression."},{key:"negligence",label:"Breach of Duty / Negligence",desc:"Alleging a ministry failed its mandate."},{key:"corruption",label:"Corruption / Self-Dealing",desc:"Alleging officials enriched themselves."}];function Yt(e){return e<=5?{tier:1,label:"Clean Government",color:"#c55"}:e<=10?{tier:2,label:"Minor Corruption",color:"#ca5"}:e<=20?{tier:3,label:"Significant Corruption",color:"#c84"}:{tier:4,label:"Systemic Corruption",color:"#5cc55c"}}const tt={1:{resolution:"FRIVOLOUS SUIT",filer:{momentum:-5,governance:-2},gov:{momentum:3,governance:1}},2:{resolution:"PARTIAL WIN",filer:{momentum:3,governance:0},gov:{momentum:-2,governance:-2}},3:{resolution:"MAJOR WIN",filer:{momentum:7,governance:2},gov:{momentum:-5,governance:-5}},4:{resolution:"DEVASTATING WIN",filer:{momentum:12,governance:5},gov:{momentum:-10,governance:-8}}},Zt={1:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"Lawsuit discovery phase produces routine documents. No irregularities found in {ministry}.",evidence:"Legal team reviews {ministry} records. Auditors confirm standard procedures.",pre_trial:"Judge signals skepticism toward {party}'s claims. Case appears thin.",resolution:"{ministry} lawsuit dismissed. Courts find no evidence of wrongdoing. {party} criticized for wasting court resources."},2:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit uncovers irregular procurement contracts in {ministry}.",evidence:"Documents reveal {ministry} awarded no-bid contracts to connected firms.",pre_trial:"Judge allows case to proceed. {ministry} officials ordered to testify.",resolution:"{ministry} lawsuit concludes with partial ruling. Irregular contracts confirmed but no criminal charges filed."},3:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit exposes hidden accounts linked to {ministry} officials.",evidence:"Leaked documents show systematic overbilling in {ministry}. Millions unaccounted for.",pre_trial:"Multiple {ministry} officials refuse to testify. Judge threatens contempt.",resolution:"{ministry} scandal confirmed. Court finds evidence of systematic corruption. {party} vindicated."},4:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit reveals {ministry} ran parallel budget invisible to parliament.",evidence:"Court-ordered audit exposes network of shell companies receiving {ministry} funds.",pre_trial:"Prosecutors request criminal referral. Multiple {ministry} officials implicated.",resolution:"Devastating verdict: {ministry} operated criminal enterprise. Officials face prosecution. Government in crisis."}};function yt(e,t){var a=e;for(var i in t)a=a.split("{"+i+"}").join(t[i]);return a}async function Oe(e,t){var{factionId:a,nationId:i,agitatorId:s,targetMinistry:n,basis:o,currentTick:c,partyName:f,administration:l}=t,d,r,m;if(o==="civil_rights"){var v=Number(l?.stats_at_start?.freedom_index??50),{data:p,error:u}=await e.from("nations").select("freedom_index").eq("id",i).single();if(u)return{success:!1,lawsuit:null,tier:0,error:"Failed to fetch freedom index data."};r=Number(p?.freedom_index??50),d=v,m=Math.max(0,d-r)}else{var g=Number(l?.stats_at_start?.corruption??50),{data:p,error:u}=await e.from("nations").select("corruption").eq("id",i).single();if(u)return{success:!1,lawsuit:null,tier:0,error:"Failed to fetch corruption data."};r=Number(p?.corruption??50),d=g,m=Math.max(0,r-d)}var g=d,y=r,_=Yt(m),$=tt[_.tier],h=c+8,w=Ct.find(function(z){return z.key===n}),C=w?"Ministry of "+w.label:n,I=fe.find(function(z){return z.key===o}),M=I?I.label:o,{data:S,error:R}=await e.from("lawsuits").insert({faction_id:a,nation_id:i,agitator_id:s,target_ministry:n,basis:o,filed_at_tick:c,resolves_at_tick:h,corruption_at_start:g,corruption_at_filing:y,corruption_growth:m,tier:_.tier,status:"active",resolution:null,momentum_effect:$.filer.momentum,governance_effect:$.filer.governance,gov_momentum_effect:$.gov.momentum,gov_governance_effect:$.gov.governance}).select("*").single();if(R)return{success:!1,lawsuit:null,tier:0,error:R.message};var E=Zt[_.tier]||Zt[1],N={party:f||"Opposition",ministry:C,basis:M},L=[{event_tick:c,event_type:"filing",headline:yt(E.filing,N)},{event_tick:c+2,event_type:"discovery",headline:yt(E.discovery,N)},{event_tick:c+5,event_type:"evidence",headline:yt(E.evidence,N)},{event_tick:c+7,event_type:"pre_trial",headline:yt(E.pre_trial,N)},{event_tick:h,event_type:"resolution",headline:yt(E.resolution,N)}],T=L.map(function(z){return{lawsuit_id:S.id,nation_id:i,event_tick:z.event_tick,event_type:z.event_type,headline:z.headline,is_fired:z.event_tick===c}}),{error:O}=await e.from("lawsuit_events").insert(T);return O&&console.error("[Lawsuits] Failed to insert milestone events:",O.message),{success:!0,lawsuit:S,tier:_.tier,error:null}}async function De(e,t){var{data:a,error:i}=await e.from("lawsuits").select("*").eq("faction_id",t).order("filed_at_tick",{ascending:!1}).limit(10);return i?(console.error("[Lawsuits] Failed to fetch lawsuits:",i.message),[]):a||[]}let k=null,x=null,Y="leader",X=[],It=[],D=null,F=null,ft=!1,rt=null,Ot=[];function b(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function W(e,t){return((e||"?")[0]+(t||"?")[0]).toUpperCase()}const ve=[{id:"leader",title:"LEADER",fullTitle:"Party Leader",color:"#c8a832"},{id:"deputy",title:"DEPUTY",fullTitle:"Deputy Party Leader",color:"#8b9a6b"},{id:"chief",title:"CHIEF OF STAFF",fullTitle:"Chief of Staff",color:"#5cc55c"},{id:"campaign",title:"CAMPAIGN MGR",fullTitle:"Campaign Manager",color:"#c84"},{id:"comms",title:"COMMS DIR",fullTitle:"Communications Director",color:"#5a8aaa"},{id:"agitator",title:"AGITATOR",fullTitle:"Opposition Coordinator",color:"#d44a4a",oppositionOnly:!0}],Tt=[{perSeat:5e3,momDivisor:10},{perSeat:4e3,momDivisor:8},{perSeat:3e3,momDivisor:6},{perSeat:2e3,momDivisor:5},{perSeat:1e3,momDivisor:5}];let ot=0;async function Be(){if(!k||!x?.faction?.id||!x?.shard?.current_tick)return;const{count:e,error:t}=await k.from("campaign_actions").select("id",{count:"exact",head:!0}).eq("party_id",x.faction.id).eq("action_type","fundraise").eq("tick_performed",x.shard.current_tick);ot=!t&&e!=null?e:0}function ue(e,t){const a=Tt[Math.min(t,Tt.length-1)],i=e*a.perSeat,s=Math.max(1,Math.floor(e/a.momDivisor));return{raised:i,momCost:s,perSeat:a.perSeat,tierIdx:Math.min(t,Tt.length-1)}}const ge=[{id:"fundraise",name:"Fundraise",desc:"Raise party funds proportional to your seat count. Each use yields less money and costs more momentum. Momentum cannot drop below 1.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"statement",name:"Issue Statement",desc:"Public declaration on an issue. Shifts party positioning and voter bloc reactions. Media covers it. Other parties may respond.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"platform",name:"Set Party Platform",desc:"Choose a political focus. Defines which stats you promise to change. Awards momentum based on how many rivals share the same platform.",cost:"$120k",costColor:"#c8a832",moneyCost:12e4,tags:["STRATEGIC"],locked:!1}],je=[{id:"fundraise",name:"Fundraise",desc:"Raise royal treasury funds proportional to your seat count. Each use yields less money and costs more momentum.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"grant_seats",name:"Grant Seats",desc:"Grant parliamentary seats to a noble house. Sharing power increases legitimacy (+0.5 per seat). Hoarding >70% of seats causes tyranny decay.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1},{id:"revoke_seats",name:"Revoke Seats",desc:"Revoke seats from a noble house. Costs $100k and -1 Legitimacy per seat revoked. Use sparingly — the people do not forget.",cost:"$100k/seat",costColor:"#d44a4a",moneyCost:1e5,tags:["ROYAL","OFFENSIVE"],locked:!1},{id:"statement",name:"Royal Decree",desc:"Issue a public declaration on an issue. Shifts positioning and voter bloc reactions. Media covers it.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"appoint_pm",name:"Appoint Prime Minister",desc:"Choose a party to lead the government as Prime Minister. The PM can then assign cabinet ministries. You may appoint your own party.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1}],Lt={PUBLIC:"#8b9a6b",NARRATIVE:"#5a8aaa",STRATEGIC:"#c8a832",INTERNAL:"#c84",COALITION:"#5aaa8a",RISKY:"#c55",PARLIAMENTARY:"#8b9a6b",FINANCIAL:"#5a8aaa",INTELLIGENCE:"#5a8aaa",DEFENSIVE:"#5cc55c",CAMPAIGN:"#c84",VOTER:"#c8a832",OFFENSIVE:"#c84",REACTIVE:"#ca5",STRUCTURAL:"#9e9a92",ROYAL:"#c8a832",LEGAL:"#5a8aaa"},te=[{id:"economy",label:"Economy & Jobs",icon:"💰"},{id:"healthcare",label:"Healthcare",icon:"🏥"},{id:"education",label:"Education",icon:"🎓"},{id:"security",label:"National Security",icon:"🛡️"},{id:"environment",label:"Environment",icon:"🌱"},{id:"corruption",label:"Anti-Corruption",icon:"🔍"},{id:"infrastructure",label:"Infrastructure",icon:"🏗️"},{id:"immigration",label:"Immigration",icon:"🌐"},{id:"housing",label:"Housing & Cost of Living",icon:"🏠"},{id:"crime",label:"Crime & Justice",icon:"⚖️"},{id:"labor",label:"Labor & Workers",icon:"🔨"},{id:"foreign_policy",label:"Foreign Policy",icon:"🕊️"}],ee=["{party_name} Calls for Action on {topic}","{leader_name}: '{topic}' Must Be National Priority","{leader_name} Pledges Bold Agenda on {topic}","{party_name} Leader Addresses Nation on {topic}"];async function ye(e,t){k=e,x=t;const a=document.getElementById("pa-actions-root");if(!a)return;const i=t.faction;if(!i){a.innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:300px;color:var(--text-dim);">No faction data.</div>';return}if(mt(t.nation)&&!t.nation.monarch_faction_id){const d=i.leader_first_name&&i.leader_last_name?i.leader_first_name+" "+i.leader_last_name:"The Monarch",r=i.leader_last_name||i.faction_name?.split(" ")[0]||"Royal",{getNationNames:m}=await Ee(async()=>{const{getNationNames:g}=await import("./elections-B2jRdA_W.js").then(y=>y.W);return{getNationNames:g}},__vite__mapDeps([0,1,2,3,4])),v=m(t.nation.name),p=(v.firstNames||["Alexander"])[Math.floor(Math.random()*(v.firstNames||["Alexander"]).length)],{error:u}=await k.from("nations").update({monarch_faction_id:i.id,monarch_name:d,dynasty_name:r,heir_name:p+" "+r,heir_age:14+Math.floor(Math.random()*8),monarch_crowned_tick:t.shard?.current_tick||0}).eq("id",t.nation.id);u&&console.error("[Monarchy] Failed to assign monarch:",u.message),t.nation.monarch_faction_id=i.id,t.nation.monarch_name=d,t.nation.dynasty_name=r}const[s,n,o,c,f]=await Promise.all([k.from("faction_platforms").select("*").eq("faction_id",i.id).order("slot"),k.from("faction_platforms").select("*").eq("nation_id",t.nation?.id),me(k,i.id),pe(k,t.nation?.id,i.id),k.from("faction_electoral_standing").select("ideological_alignment, visibility, raw_appeal").eq("faction_id",i.id).eq("nation_id",t.nation?.id).maybeSingle()]);await Be(),s.error&&console.error("[PartyActions] Failed to load faction platforms:",s.error.message),n.error&&console.error("[PartyActions] Failed to load nation platforms:",n.error.message),X=s.data||[],It=n.data||[],D=o,ft=c.isOpposition,rt=c.administration,f.data;const{data:l}=await k.from("faction_deputies").select("*").eq("faction_id",i.id).eq("status","active").maybeSingle();F=l||null,D&&(Ot=await De(k,i.id)),G(a)}function G(e){const t=x.faction,a=x.nation,i=mt(a),s=i&&a?.monarch_faction_id===t?.id,n=t.color||"#c8a832",o=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown Leader",c=t.seats||0,f=a?.total_seats||120,l=f>0?Math.round(c/f*100):0;t.action_points,t.approval_rating;const d=t.momentum??50,r=t.party_funds??0,m=ze(X,a),v=[];for(let p=1;p<=3;p++){const u=X.find(g=>g.slot===p);if(u){const g=_t.find(h=>h.id===u.platform_key),y=m.find(h=>h.id===u.id),_=y?y.stats.filter(h=>h.met).length:0,$=y?y.stats.length:0;v.push({name:g?.name||u.platform_key,status:u.status,metCount:_,totalCount:$,slot:p})}else v.push(null)}e.innerHTML=`
        <div class="pa-page">
            <!-- Header -->
            <div class="pa-header">
                <div class="pa-header-left">
                    <span class="pa-title" style="color:${n};">${s?"Royal Court":"Party Actions"}</span>
                    <div class="pa-party-badge">
                        <div class="pa-party-dot" style="background:${n};"></div>
                        <span class="pa-party-name">${b(t.faction_name)}</span>
                    </div>
                </div>
                <div class="pa-header-stats">
                    <div class="pa-header-stat">
                        <div class="pa-header-stat-label">Party Funds</div>
                        <div class="pa-header-stat-value" style="color:var(--accent);">$${r>=1e6?(r/1e6).toFixed(1)+"M":r>=1e3?Math.round(r/1e3)+"k":r}</div>
                    </div>
                    <div class="pa-header-stat">
                        <div class="pa-header-stat-label">Momentum</div>
                        <div class="pa-header-stat-value" style="color:${d>0?"var(--text-bright)":"var(--red)"};">${Number(d).toFixed(1)}</div>
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
                        <span class="pa-status-big" style="color:${n};">${c}</span>
                        <span class="pa-status-dim">/ ${f}</span>
                        <span class="pa-status-dim">(${l}%)</span>
                    </div>
                </div>
                <div class="pa-status-item">
                    <div class="pa-status-label">Platforms</div>
                    <div style="display:flex;gap:4px;margin-top:3px;">
                        ${v.map(p=>{if(!p)return'<span class="pa-platform-slot">No Platform</span>';const u=p.status==="fulfilled"?" ✓":p.status==="failed"?" ✗":p.status==="abated"?" —":"",g=p.status==="fulfilled"?"fulfilled":p.status==="failed"?"failed":p.status==="abated"?"abated":"filled",y=p.totalCount>0?`${p.metCount}/${p.totalCount}`:"";return`<span class="pa-platform-slot ${g}" title="${p.metCount} of ${p.totalCount} stats on target">${b(p.name)}${y?` (${y})`:""}${u}</span>`}).join("")}
                    </div>
                </div>
            </div>

            <!-- Main layout -->
            <div class="pa-main">
                <!-- Leader sidebar -->
                <div class="pa-leaders" id="pa-leaders">
                    ${Ge(o,n,t)}
                </div>

                <!-- Actions panel -->
                <div class="pa-actions-panel" id="pa-actions-panel">
                    ${He(o,n,t)}
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
    `,document.getElementById("pa-leaders")?.addEventListener("click",p=>{const u=p.target.closest(".pa-leader-card");if(!u||u.classList.contains("vacant"))return;const g=u.dataset.role;g&&g!==Y&&(Y=g,G(e))}),document.getElementById("pa-actions-panel")?.addEventListener("click",p=>{const u=p.target.closest(".pa-action-item");if(!u||u.classList.contains("locked"))return;const g=u.dataset.actionId;g==="fundraise"?sa(e):g==="grant_seats"?oa(e):g==="revoke_seats"?na(e):g==="rally"?We(e):g==="statement"?ra(e):g==="platform"?la(e):g==="file_lawsuit"?aa(e):g==="appoint_pm"?ia(e):g==="modernize"?Je(e):g==="rebrand"&&Xe(e)}),document.getElementById("pa-hire-agitator-btn")?.addEventListener("click",()=>ne(e)),document.getElementById("pa-hire-agitator-panel")?.addEventListener("click",p=>{p.target.closest("#pa-hire-agitator-btn")||ne(e)}),document.getElementById("pa-hire-deputy-btn")?.addEventListener("click",()=>ie(e)),document.getElementById("pa-hire-deputy-panel")?.addEventListener("click",p=>{p.target.closest("#pa-hire-deputy-btn")||ie(e)})}function Ge(e,t,a){const i=mt(x.nation)&&x.nation?.monarch_faction_id===a?.id;return ve.map(s=>{const n=s.id==="leader",o=s.id==="agitator",c=Y===s.id;let f,l,d,r,m;if(n){f=!1,l=e,d=W(a.leader_first_name,a.leader_last_name),r=ge.length;const u=mt(x.nation);if(u&&x.nation?.monarch_faction_id===a.id)m={text:(x.nation?.monarch_title||"KING").toUpperCase(),color:"#c8a832"};else if(u)m={text:"NOBLE HOUSE",color:"#8b9a6b"};else{const y=rt?.pm_party_id===a.id,_=x.nation?.hos_election_method==="elected"&&rt?.president_party_id===a.id;y?m={text:"PRIME MINISTER",color:"#5cc55c"}:_?m={text:"PRESIDENT",color:"#5cc55c"}:ft?m={text:"OPPOSITION",color:"#c84"}:m={text:"GOVERNING",color:"#8b9a6b"}}}else o&&D?(f=!1,l=`${D.first_name} ${D.last_name}`,d=W(D.first_name,D.last_name),r=1):o&&!D?(f=!1,l="Not Hired",d="+",r=0):s.id==="deputy"&&F?(f=!1,l=`${F.first_name} ${F.last_name}`,d=W(F.first_name,F.last_name),r=1):s.id==="deputy"&&!F?(f=!1,l="Not Hired",d="+",r=0):s.id==="campaign"?(f=!1,l="Campaign Mgr",d="CM",r=xe.length):(f=!0,l="Vacant",d="—",r=0);const v=s.oppositionOnly&&!ft;return`
            <div class="pa-leader-card ${c?"active":""} ${f?"vacant":""} ${v?"vacant":""}"
                 data-role="${s.id}"
                 style="${c?`border-left-color:${s.color};`:""}${v?"opacity:0.35;":""}">
                ${s.oppositionOnly?`<div style="position:absolute;top:0;right:0;font-family:var(--font-mono);font-size:5px;font-weight:700;letter-spacing:0.04em;padding:1px 4px;color:${v?"var(--text-dim)":"#d44a4a"};background:${v?"rgba(100,100,100,0.1)":"rgba(212,74,74,0.1)"};border:1px solid ${v?"rgba(100,100,100,0.2)":"rgba(212,74,74,0.2)"};border-top:none;border-right:none;">${v?"IN GOVERNMENT":"OPPOSITION ONLY"}</div>`:""}
                <div class="pa-leader-top">
                    <div class="pa-leader-avatar" style="color:${s.color};background:${s.color}15;border-color:${s.color}33;">${d}</div>
                    <div class="pa-leader-info">
                        <div class="pa-leader-role">
                            <span class="pa-leader-role-label" style="color:${s.color};">${n&&i?(x.nation?.monarch_title||"King").toUpperCase():s.title}</span>
                            ${r>0?`<span class="pa-leader-role-count">${r} actions</span>`:""}
                        </div>
                        <div class="pa-leader-name">${b(l)}</div>
                        ${m?`<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:${m.color};margin-top:2px;">${m.text}</div>`:""}
                        ${o&&D?`<div style="display:flex;align-items:center;gap:3px;margin-top:2px;"><div style="flex:1;height:2px;background:var(--border-mid);"><div style="height:100%;width:${D.skill}%;background:${st(D.skill).color};"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);width:16px;text-align:right;">${D.skill}</span></div>`:""}
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
    `}function He(e,t,a){const i=mt(x.nation),s=i&&x.nation?.monarch_faction_id===a?.id,n=ve.find($=>$.id===Y);if(!n)return"";const o=Y==="leader",c=Y==="agitator",f=Y==="campaign",l=Y==="deputy";if(!o&&!c&&!f&&!l)return`
            <div class="pa-vacant-msg">
                <div>
                    <div class="pa-vacant-title">${b(n.fullTitle)} — Vacant</div>
                    <div class="pa-vacant-sub">This position has not been filled. Recruitment coming in a future update.</div>
                </div>
            </div>
        `;if(c&&!ft)return`
            <div class="pa-vacant-msg" style="opacity:0.4;">
                <div style="text-align:center;">
                    <div style="font-size:2rem;margin-bottom:12px;opacity:0.3;">🚫</div>
                    <div class="pa-vacant-title">Agitator Unavailable</div>
                    <div class="pa-vacant-sub" style="max-width:400px;margin:8px auto;">
                        Your party is in government. The Agitator role is only available to opposition parties.
                    </div>
                </div>
            </div>
        `;if(c&&!D)return`
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
        `;if(c&&D)return ta(n);if(l&&!F)return`
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
        `;if(l&&F)return Ve(n);if(f)return Ke(n,a);const r=W(a.leader_first_name,a.leader_last_name),m=a.leader_age?`, Age ${a.leader_age}`:"",v=a.seats||0,p=a.momentum??0,_=(mt(x.nation)&&x.nation?.monarch_faction_id===a.id?je:ge).map($=>{const h=$.tags.map(S=>`<span class="pa-action-tag" style="color:${Lt[S]||"var(--text-dim)"};">${S}</span>`).join("");let w="",C=$.cost,I=$.costColor,M=$.locked;if($.id==="fundraise"){const S=ue(v,ot);C=`-${S.momCost} MOM`,I="#c84",w=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);display:flex;gap:12px;">
                <span>Raises: <span style="color:var(--accent);font-weight:700;">$${(S.raised/1e3).toFixed(0)}k</span></span>
                <span>$${(S.perSeat/1e3).toFixed(0)}k/seat × ${v}</span>
                ${ot>0?`<span style="color:var(--orange);">Use #${ot+1}</span>`:""}
            </div>`,p-S.momCost<1&&(M=!0,w+=`<div style="margin-top:3px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Not enough momentum (need ${S.momCost}, have ${Number(p).toFixed(1)})</div>`)}return`
            <div class="pa-action-item ${M?"locked":""}" data-action-id="${$.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${b($.name)}</span>
                        <div class="pa-action-tags">${h}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${I};">${C}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${b($.desc)}</div>
                ${w}
                ${$.locked&&$.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${b($.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${n.color};background:${n.color}15;border-color:${n.color}33;">${r}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${n.color};">${s?(x.nation?.monarch_title||"KING").toUpperCase():n.title}</span>
                        <span class="pa-detail-name">${b(e)}</span>
                        ${i&&x.nation?.dynasty_name?`<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);font-style:italic;">House ${b(x.nation.dynasty_name)}</span>`:""}
                    </div>
                    <div class="pa-detail-meta">${s?b((x.nation?.monarch_title||"King")+" of "+(x.nation?.name||"")):b(n.fullTitle)+" &middot; "+b(a.faction_name)}${m}${(()=>{if(s)return' <span style="color:#c8a832;font-weight:700;"> &middot; '+(x.nation?.monarch_title||"MONARCH").toUpperCase()+"</span>";if(i)return' <span style="color:#8b9a6b;font-weight:700;"> &middot; NOBLE HOUSE</span>';const $=rt?.pm_party_id===a.id,h=x.nation?.hos_election_method==="elected"&&rt?.president_party_id===a.id;return $?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRIME MINISTER</span>':h?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRESIDENT</span>':ft?' <span style="color:#c84;font-weight:700;"> &middot; OPPOSITION</span>':' <span style="color:#8b9a6b;font-weight:700;"> &middot; GOVERNING</span>'})()}</div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list">
            ${_}
        </div>
        <div class="pa-skill-footer">
            <span style="color:${n.color};font-weight:700;">${n.title}</span> actions are executed by the party leader. Effectiveness depends on party approval and momentum.
        </div>
    `}const qe=[{id:"rally",name:"Hold a Rally",desc:"Invest party funds into a public rally. Higher investment improves your odds, but a bad roll can backfire. Roll 1d6 + rally bonus for momentum.",cost:"$50k-$200k",costColor:"#8b9a6b",tags:["CAMPAIGN","RISKY"],locked:!1}],ae=[{cost:5e4,bonus:1,label:"$50k (+1)"},{cost:8e4,bonus:2,label:"$80k (+2)"},{cost:12e4,bonus:3,label:"$120k (+3)"},{cost:15e4,bonus:4,label:"$150k (+4)"},{cost:2e5,bonus:5,label:"$200k (+5)"}];function Ue(e,t){const a=e+t;return a>=8?{momentum:3,label:"Rousing Success",color:"#5cc55c"}:a>=5?{momentum:2,label:"Solid Turnout",color:"#8b9a6b"}:a>=3?{momentum:0,label:"Flat Response",color:"#ca5"}:{momentum:-2,label:"Backfire",color:"#c55"}}function Ve(e){const t=qe.map(i=>{const s=i.tags.map(n=>`<span class="pa-action-tag" style="color:${Lt[n]||"var(--text-dim)"};">${n}</span>`).join("");return`
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
        `}).join(""),a=st(F.skill);return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${e.color};background:${e.color}15;border-color:${e.color}33;">${W(F.first_name,F.last_name)}</div>
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
    `}function Ye(e){const t=Ut(e),a=t.firstNames||[],i=t.lastNames||[];if(a.length===0||i.length===0)return[];const s=5+Math.floor(Math.random()*3),n=new Set,o=[];for(let c=0;c<s;c++){let f,l,d,r=0;do f=a[Math.floor(Math.random()*a.length)],l=i[Math.floor(Math.random()*i.length)],d=f+" "+l,r++;while(n.has(d)&&r<20);n.add(d);const m=20+Math.floor(Math.random()*66),v=28+Math.floor(Math.random()*30),p=Math.max(0,m-20)/65,u=Math.round((125e3+p*525e3)/25e3)*25e3;o.push({first_name:f,last_name:l,age:v,skill:m,hire_cost:u})}return o.sort((c,f)=>f.skill-c.skill)}async function ie(e){const t=document.getElementById("pa-deputy-modal");if(!t)return;const a=x.nation?.name,i=Ye(a);let s=null;function n(){const o=s!=null?i[s]:null,c=o?st(o.skill):null,f=i.map((r,m)=>{const v=s===m,p=st(r.skill);return`<div class="pa-hire-row ${v?"selected":""}" data-idx="${m}">
                <div style="width:32px;height:32px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#8b9a6b;flex-shrink:0;">${W(r.first_name,r.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${v?"var(--text-bright)":"var(--text-secondary)"};">${b(r.first_name)} ${b(r.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${r.skill}%;background:${p.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${p.color};">${r.skill}</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Age ${r.age}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);">$${Math.round(r.hire_cost/1e3)}k</div>
                </div>
            </div>`}).join("");let l;o?l=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#8b9a6b;">${W(o.first_name,o.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${b(o.first_name)} ${b(o.last_name)}</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:1px;">Age ${o.age} &middot; Deputy Leader Candidate</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">SKILL</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${o.skill}%;background:${c.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${c.color};">${o.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${c.color};margin-top:3px;font-weight:700;">${c.label}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-dep-hire-confirm" style="background:#8b9a6b;"${(x.faction?.party_funds||0)<o.hire_cost?' disabled title="Not enough funds"':""}>Hire ${b(o.first_name)}</button>
                </div>
            `:l=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;"><div style="text-align:center;">
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
                    <div style="flex:1;overflow-y:auto;">${l}</div>
                </div>
            </div>
        `;const d=()=>t.classList.remove("active");document.getElementById("pa-dep-close")?.addEventListener("click",d),t.onclick=r=>{r.target===t&&d()},document.getElementById("pa-dep-list")?.addEventListener("click",r=>{const m=r.target.closest(".pa-hire-row");m&&(s=parseInt(m.dataset.idx,10),n())}),document.getElementById("pa-dep-hire-confirm")?.addEventListener("click",async()=>{if(s==null)return;const r=i[s],m=x.faction?.party_funds||0;if(m<r.hire_cost){alert("Not enough funds.");return}const v=document.getElementById("pa-dep-hire-confirm");v&&(v.disabled=!0,v.textContent="Hiring...");try{const p=m-r.hire_cost,u=x.shard?.current_tick||0,{data:g,error:y}=await k.from("faction_deputies").insert({faction_id:x.faction.id,first_name:r.first_name,last_name:r.last_name,age:r.age,skill:r.skill,status:"active",hired_at_tick:u}).select("*").single();if(y){alert("Failed: "+y.message);return}await k.from("factions").update({party_funds:p}).eq("id",x.faction.id),x.faction.party_funds=p,F=g,Y="deputy",d(),G(e)}catch(p){console.error("[Deputy] Hire error:",p)}finally{v&&(v.disabled=!1)}})}t.classList.add("active"),n()}function We(e){const t=document.getElementById("pa-rally-modal");if(!t||!F)return;const i=x.faction.party_funds||0;let s=null,n=null;function o(){const c=ae.map((d,r)=>{const m=i>=d.cost,v=s===r;return`<div class="pa-action-item ${v?"selected":""} ${m?"":"locked"}" data-tier="${r}" style="cursor:${m?"pointer":"not-allowed"};${v?"border-color:#8b9a6b;background:rgba(139,154,107,0.06);":""}">
                <div class="pa-action-top">
                    <span style="font-size:13px;font-weight:700;color:${v?"#8b9a6b":"var(--text-bright)"};">$${Math.round(d.cost/1e3)}k Investment</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#8b9a6b;">+${d.bonus} Rally Bonus</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">Roll 1d6 + ${d.bonus} = range ${1+d.bonus} to ${6+d.bonus}</div>
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
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#8b9a6b;">${b(F.first_name)} ${b(F.last_name)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">&middot; Skill ${F.skill}</span>
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    <div class="pa-modal-step-label">Choose Investment Level</div>
                    <div id="rally-tiers">${c}</div>

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
        `;const l=()=>{t.classList.remove("active"),n&&G(e)};document.getElementById("rally-close")?.addEventListener("click",l),document.getElementById("rally-cancel")?.addEventListener("click",l),t.onclick=d=>{d.target===t&&l()},document.getElementById("rally-tiers")?.addEventListener("click",d=>{const r=d.target.closest("[data-tier]");!r||r.classList.contains("locked")||(s=parseInt(r.dataset.tier,10),o())}),document.getElementById("rally-submit")?.addEventListener("click",async()=>{if(s==null||n)return;const d=ae[s],{data:r}=await k.from("factions").select("party_funds, momentum").eq("id",x.faction.id).single(),m=r?.party_funds||0;if(m<d.cost){alert("Not enough funds.");return}x.faction.party_funds=m,x.faction.momentum=r?.momentum??x.faction.momentum;const v=document.getElementById("rally-submit");v&&(v.disabled=!0,v.textContent="Rolling...");try{const p=1+Math.floor(Math.random()*6),u=Ue(p,d.bonus),g=m-d.cost,y=Math.max(1,(x.faction.momentum||0)+u.momentum);await k.from("factions").update({party_funds:g,momentum:y}).eq("id",x.faction.id);const _=x.shard?.current_tick||0;await k.from("campaign_actions").insert({party_id:x.faction.id,nation_id:x.nation?.id,action_type:"rally",ap_cost:0,money_cost:d.cost,tick_performed:_,result:{dieRoll:p,bonus:d.bonus,total:p+d.bonus,momentum:u.momentum,label:u.label}}),x.faction.party_funds=g,x.faction.momentum=y,sessionStorage.removeItem("nationhood_state"),n={...u,dieRoll:p,bonus:d.bonus,total:p+d.bonus},o()}catch(p){console.error("[Rally] Error:",p),alert("Rally failed.")}})}t.classList.add("active"),o()}const xe=[{id:"modernize",name:"Modernize Image",desc:"Upload a custom logo to refresh your party's brand. Grants +1 Momentum/tick while a custom logo is active. Quick and affordable.",cost:"$50k",costColor:"#5a8aaa",moneyCost:5e4,tags:["CAMPAIGN","BRANDING"],locked:!1},{id:"rebrand",name:"Rebrand Party",desc:'Change your party name, abbreviation, color, logo, and description. Costly but grants a "Fresh Start" modifier. Nuclear option after scandal or major defeat.',cost:"$150k",costColor:"#c84",moneyCost:15e4,tags:["CAMPAIGN","STRUCTURAL"],locked:!1}],oe=[{id:"crimson",hex:"#c43a3a",name:"Crimson"},{id:"scarlet",hex:"#d45a2a",name:"Scarlet"},{id:"amber",hex:"#c8a832",name:"Amber"},{id:"gold",hex:"#d4a017",name:"Gold"},{id:"olive",hex:"#8a9a4a",name:"Olive"},{id:"emerald",hex:"#2a8a4a",name:"Emerald"},{id:"forest",hex:"#3a6a3a",name:"Forest"},{id:"teal_c",hex:"#2a8a7a",name:"Teal"},{id:"sky",hex:"#4a8aba",name:"Sky"},{id:"cobalt",hex:"#3a5a9a",name:"Cobalt"},{id:"navy",hex:"#2a3a6a",name:"Navy"},{id:"violet",hex:"#7a4a9a",name:"Violet"},{id:"plum",hex:"#8a3a7a",name:"Plum"},{id:"rose",hex:"#ba4a6a",name:"Rose"},{id:"slate",hex:"#5a6a7a",name:"Slate"},{id:"iron",hex:"#4a4a4a",name:"Iron"}],Dt=[{emoji:"🏛️",name:"Parliament"},{emoji:"⚖️",name:"Scales"},{emoji:"🗽",name:"Liberty"},{emoji:"🕊️",name:"Dove"},{emoji:"🦅",name:"Eagle"},{emoji:"🦁",name:"Lion"},{emoji:"🐻",name:"Bear"},{emoji:"🐉",name:"Dragon"},{emoji:"🐘",name:"Elephant"},{emoji:"🏔️",name:"Mountain"},{emoji:"🌊",name:"Wave"},{emoji:"🔥",name:"Flame"},{emoji:"⭐",name:"Star"},{emoji:"🌟",name:"Glow Star"},{emoji:"💎",name:"Diamond"},{emoji:"🛡️",name:"Shield"},{emoji:"⚔️",name:"Swords"},{emoji:"🏗️",name:"Builder"},{emoji:"🌿",name:"Leaf"},{emoji:"🌾",name:"Wheat"},{emoji:"🔨",name:"Hammer"},{emoji:"⚡",name:"Lightning"},{emoji:"🎯",name:"Target"},{emoji:"🏴",name:"Flag"},{emoji:"🚩",name:"Red Flag"},{emoji:"✊",name:"Fist"},{emoji:"🤝",name:"Handshake"},{emoji:"📜",name:"Scroll"},{emoji:"🗳️",name:"Ballot"},{emoji:"👑",name:"Crown"}];function Ke(e,t){const a=xe.map(i=>{const s=i.tags.map(n=>`<span class="pa-action-tag" style="color:${Lt[n]||"var(--text-dim)"};">${n}</span>`).join("");return`
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
    `}function Je(e){const t=document.getElementById("pa-modernize-modal");if(!t)return;const a=x.faction;let i=null,s=a.custom_logo_url||null,n=!1;function o(){const c=!!s,l=Number(a.party_funds??0)>=5e4,d=!!i&&l&&!n;t.innerHTML=`
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
                    <div style="width:80px;height:80px;border:2px dashed ${c?"var(--accent)":"var(--border-mid)"};border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:var(--bg-card);">
                        ${s?`<img src="${b(s)}" style="width:100%;height:100%;object-fit:cover;">`:'<span style="font-size:24px;color:var(--text-dim);">+</span>'}
                    </div>
                    <div style="text-align:center;">
                        <label style="display:inline-block;padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright);background:var(--bg-card);border:1px solid var(--border-mid);cursor:pointer;letter-spacing:0.06em;">
                            ${c?"CHANGE LOGO":"UPLOAD LOGO"}
                            <input type="file" accept="image/*" id="mod-file-input" style="display:none;">
                        </label>
                        ${a.custom_logo_url&&!i?'<div style="font-family:var(--font-mono);font-size:8px;color:var(--green);margin-top:6px;">Current logo active — +1 Momentum/tick</div>':""}
                        ${i?'<div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);margin-top:6px;">New logo ready to upload</div>':""}
                    </div>
                    ${l?"":'<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">Insufficient funds. Need $50k.</div>'}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="mod-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="mod-submit" ${d?"":"disabled"} style="background:#5a8aaa;">Modernize — $50k</button>
                </div>
            </div>
        `,document.getElementById("mod-close")?.addEventListener("click",()=>t.classList.remove("active")),document.getElementById("mod-cancel")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=r=>{r.target===t&&t.classList.remove("active")},document.getElementById("mod-file-input")?.addEventListener("change",r=>{const m=r.target.files?.[0];if(m){if(m.size>2*1024*1024){alert("Logo must be under 2MB.");return}i=m,s=URL.createObjectURL(m),o()}}),document.getElementById("mod-submit")?.addEventListener("click",async()=>{if(n||!i)return;n=!0;const r=document.getElementById("mod-submit");r&&(r.disabled=!0,r.textContent="Uploading...");try{const m=i.name.split(".").pop()?.toLowerCase()||"png",v=`${a.id}/logo_${Date.now()}.${m}`,{error:p}=await k.storage.from("party-logos").upload(v,i,{cacheControl:"3600",upsert:!0,contentType:i.type});if(p)throw new Error("Upload failed: "+p.message);const{data:u}=k.storage.from("party-logos").getPublicUrl(v),g=u?.publicUrl;if(!g)throw new Error("Failed to get logo URL");const y=Math.max(0,Number(a.party_funds??0)-5e4),{error:_}=await k.from("factions").update({custom_logo_url:g,party_funds:y}).eq("id",a.id);if(_)throw _;a.custom_logo_url=g,a.party_funds=y,t.classList.remove("active"),alert("Logo updated! Your party now earns +1 Momentum/tick from the modernized image."),G(e)}catch(m){alert("Modernize failed: "+(m.message||"Error")),n=!1,r&&(r.disabled=!1,r.textContent="Modernize — $50k")}})}t.classList.add("active"),o()}function Xe(e){const t=document.getElementById("pa-rebrand-modal");if(!t)return;const a=x.faction;x.nation;const i=a.momentum??50;(x._allParties||[]).filter(m=>m.id!==a.id);const s={current:a.party_color||"#4a8aba"},n={current:0},o={current:a.custom_logo_url||null},c={current:null},f={current:!!a.custom_logo_url},l={current:!1};function d(){return s.current}function r(){const m=d(),v=oe.find(C=>C.hex===m)?.name||"Custom",p=Dt[n.current]?.emoji||"🏛️",u=f.current&&(o.current||c.current),g=o.current||(c.current?URL.createObjectURL(c.current):null),y=document.getElementById("rb-name")?.value??a.faction_name??"",_=document.getElementById("rb-abbr")?.value??a.abbreviation??"",$=document.getElementById("rb-desc")?.value??"",h=oe.map(C=>{const I=m===C.hex;return`<div class="rb-color-swatch ${I?"selected":""}" data-hex="${C.hex}" style="background:${C.hex};${I?`box-shadow:0 0 8px ${C.hex}44;border:2px solid var(--text-bright);`:""}">
                ${I?'<span style="font-size:10px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.5);">✓</span>':""}
            </div>`}).join(""),w=Dt.map((C,I)=>{const M=n.current===I;return`<div class="rb-logo-item ${M?"selected":""}" data-idx="${I}" style="${M?`background:${m}15;border:2px solid ${m};box-shadow:0 0 6px ${m}33;`:""}">
                ${C.emoji}
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
                            <input class="pa-modal-input" id="rb-abbr" value="${b(_)}" maxlength="4" style="width:100px;font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;color:${m};">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">2-4 uppercase letters</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Description</div>
                            <textarea class="pa-modal-input" id="rb-desc" rows="3" style="resize:vertical;font-family:var(--font-ui);font-size:11px;line-height:1.5;">${b($)}</textarea>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${$.length}/200 · Visible to all</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Color — <span style="color:${m};">${b(v)}</span></div>
                            <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;" id="rb-colors">${h}</div>
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
                                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${c.current?c.current.name:"Saved logo"}</div>
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
                                    ${u&&g?`<img src="${g}" style="width:100%;height:100%;object-fit:contain;" alt="">`:p}
                                </div>
                                <div>
                                    <div style="font-size:12px;font-weight:700;color:var(--text-bright);line-height:1.2;">${b(y||"Party Name")}</div>
                                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${m};letter-spacing:1px;">${b(_||"???")}</div>
                                </div>
                            </div>
                            <div style="font-size:9px;color:var(--text-secondary);line-height:1.5;">${b($||"No description...")}</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);margin-bottom:3px;">BADGES</div>
                            <div style="display:flex;gap:3px;flex-wrap:wrap;">
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${m};background:${m}0a;border:1px solid ${m}25;">${b(_)}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${m};background:${m}0a;border:1px solid ${m}25;">MEMBER</span>
                            </div>
                        </div>
                        <div style="padding:6px 8px;background:${m}08;border:1px solid ${m}25;display:flex;align-items:center;gap:8px;">
                            <div style="width:20px;height:20px;background:${m};"></div>
                            <div>
                                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${m};">${b(v.toUpperCase())}</div>
                                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${m}</div>
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
                        ${l.current?'<span style="color:#d44a4a;font-weight:700;">⚠ Final confirmation. This costs $150k, 10 Momentum, and -3 approval. Cannot rebrand again for 120 ticks.</span>':"This will change your party's identity across all UI, media, and diplomatic channels."}
                    </div>
                    <div style="display:flex;gap:6px;">
                        ${l.current?`
                            <button class="pa-modal-btn pa-modal-btn--cancel" id="rb-back">Go Back</button>
                            <button class="pa-modal-btn" id="rb-confirm" style="background:#d44a4a;color:#fff;">⚠ Confirm Rebrand</button>
                        `:`
                            <button class="pa-modal-btn pa-modal-btn--cancel" id="rb-cancel">Cancel</button>
                            <button class="pa-modal-btn pa-modal-btn--submit" id="rb-submit" style="background:#c84;">Rebrand</button>
                        `}
                    </div>
                </div>
            </div>
        `}t._rbCustomLogoFile=null,t._rbCustomLogoUrl=o.current,t._rbUseCustomLogo=f.current,r(),t.classList.add("active"),t.addEventListener("change",function(v){if(v.target.id==="rb-logo-file"){const p=v.target.files?.[0];if(!p)return;if(p.size>2*1024*1024){alert("Logo must be under 2MB. Selected file: "+(p.size/(1024*1024)).toFixed(1)+"MB"),v.target.value="";return}if(!["image/png","image/jpeg","image/svg+xml","image/webp"].includes(p.type)){alert("Unsupported file type. Use PNG, JPG, SVG, or WebP."),v.target.value="";return}c.current=p,o.current=null,f.current=!0,t._rbCustomLogoFile=p,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!0,r()}}),t.addEventListener("click",function m(v){if(v.target===t||v.target.closest("#rb-close")||v.target.closest("#rb-cancel")){t.classList.remove("active"),t.removeEventListener("click",m);return}const p=v.target.closest(".rb-color-swatch");if(p){s.current=p.dataset.hex,r();return}const u=v.target.closest(".rb-logo-item");if(u){n.current=parseInt(u.dataset.idx)||0,f.current=!1,t._rbUseCustomLogo=!1,r();return}if(v.target.closest("#rb-remove-logo")){o.current=null,c.current=null,f.current=!1,t._rbCustomLogoFile=null,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!1,r();return}if(v.target.closest("#rb-submit")){const g=document.getElementById("rb-name")?.value?.trim()||"",y=document.getElementById("rb-abbr")?.value?.trim()||"";if(g.length<3||y.length<2){alert("Name must be 3+ chars, abbreviation 2-4 chars.");return}l.current=!0,r();return}if(v.target.closest("#rb-back")){l.current=!1,r();return}if(v.target.closest("#rb-confirm")){Qe(t,e,m);return}})}async function Qe(e,t,a){const i=x.faction,s=document.getElementById("rb-name")?.value?.trim()||"",n=document.getElementById("rb-abbr")?.value?.trim()||"";document.getElementById("rb-desc")?.value?.trim();const o=document.querySelector(".rb-color-swatch.selected")?.dataset?.hex||i.party_color,c=document.querySelector(".rb-logo-item.selected")?.dataset?.idx,f=c!=null?Dt[parseInt(c)]?.emoji:null,l=e._rbCustomLogoFile,d=e._rbUseCustomLogo,r=e._rbCustomLogoUrl,m=document.getElementById("rb-confirm");m&&(m.disabled=!0,m.textContent="Rebranding...");try{const v=x.shard?.current_tick||0;let p=r;if(d&&l){const $=l.name.split(".").pop()?.toLowerCase()||"png",h=`${i.id}/logo_${Date.now()}.${$}`,{data:w,error:C}=await k.storage.from("party-logos").upload(h,l,{cacheControl:"3600",upsert:!0,contentType:l.type});if(C){console.error("[Rebrand] Logo upload failed:",C.message),alert("Logo upload failed: "+C.message);return}const{data:I}=k.storage.from("party-logos").getPublicUrl(h);p=I?.publicUrl||null}else d||(p=null);const u=15e4,g=i.party_funds||0;if(g<u){alert(`Not enough funds. You have $${Math.round(g/1e3)}k, need $150k.`);return}const y=g-u,_=Math.max(1,(i.momentum||0)-10);await k.from("factions").update({party_funds:y,momentum:_,faction_name:s,abbreviation:n.toUpperCase(),party_color:o,party_logo:d?null:f,custom_logo_url:p,rebrand_cooldown_until_tick:v+120}).eq("id",i.id),await k.from("campaign_actions").insert({party_id:i.id,nation_id:x.nation?.id,action_type:"rebrand",ap_cost:3,money_cost:0,tick_performed:v,result:{oldName:i.faction_name,newName:s,oldAbbr:i.abbreviation,newAbbr:n,oldColor:i.party_color,newColor:o}}),i.party_funds=y,i.momentum=_,i.faction_name=s,i.abbreviation=n.toUpperCase(),i.party_color=o,i.party_logo=d?null:f,i.custom_logo_url=p,e.classList.remove("active"),e.removeEventListener("click",a),G(t)}catch(v){console.error("[PartyActions] Rebrand error:",v),alert("Failed to rebrand: "+(v.message||v))}finally{m&&(m.disabled=!1,m.textContent="⚠ Confirm Rebrand")}}const Ze=[{id:"file_lawsuit",name:"File Lawsuit",desc:"Sue a government ministry alleging corruption or negligence. 8-tick timeline with milestone events. Outcome depends on actual corruption growth since government took office.",cost:"$250k",costColor:"#c8a832",moneyCost:25e4,tags:["LEGAL","OFFENSIVE"],locked:!1}];function ta(e){const t=D,a=W(t.first_name,t.last_name),i=st(t.skill),s=ft?'<span style="color:#5cc55c;margin-left:6px;">✓ IN OPPOSITION</span>':'<span style="color:#c84;margin-left:6px;">⚠ IN GOVERNMENT (actions limited)</span>',n=Ze.map(o=>{const c=o.tags.map(f=>`<span class="pa-action-tag" style="color:${Lt[f]||"var(--text-dim)"};">${f}</span>`).join("");return`
            <div class="pa-action-item ${o.locked?"locked":""}" data-action-id="${o.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${b(o.name)}</span>
                        <div class="pa-action-tags">${c}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${o.costColor};">${o.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${b(o.desc)}</div>
                ${o.locked&&o.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${b(o.lockReason)}</span></div>`:""}
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
            ${n}
        </div>
        ${ea()}
        <div class="pa-skill-footer">
            <span style="color:${e.color};font-weight:700;">${e.title}</span> skill (${t.skill}/100) affects lawsuit discovery and legal action outcomes. <span style="color:${i.color};font-weight:700;">${i.label}</span>: ${i.desc}
        </div>
    `}function ea(){if(Ot.length===0)return"";const e=x.shard?.current_tick||0;return`
        <div class="pa-ls-section">
            <div class="pa-ls-section-title">Legal Actions</div>
            ${Ot.map(a=>{const i=Ct.find(y=>y.key===a.target_ministry),s=i?i.label:a.target_ministry,n=i?i.icon:"⚖️",o=Yt(a.corruption_growth||0),c=tt[a.tier]||tt[1],f=a.status==="active",l=Math.max(0,e-a.filed_at_tick),d=8,r=Math.min(1,l/d),m=Math.max(0,a.resolves_at_tick-e),v=[{tick:0,label:"Filed",type:"filing"},{tick:2,label:"Discovery",type:"discovery"},{tick:5,label:"Evidence",type:"evidence"},{tick:7,label:"Pre-trial",type:"pre_trial"},{tick:8,label:"Verdict",type:"resolution"}],p=v.map(y=>{const _=a.filed_at_tick+y.tick,$=e>=_,h=e>=_&&(y.tick===8||e<a.filed_at_tick+v[v.indexOf(y)+1]?.tick),w=y.tick/d*100;return`<div class="pa-ls-milestone ${$?"passed":""} ${h?"current":""}" style="left:${w}%;" title="${y.label} (Tick ${_})">
                <div class="pa-ls-milestone-dot"></div>
                <div class="pa-ls-milestone-label">${y.label}</div>
            </div>`}).join("");let u="";if(!f){const y=c===tt[1]?"FRIVOLOUS":c===tt[2]?"PARTIAL WIN":c===tt[3]?"MAJOR WIN":"DEVASTATING",_=a.tier===1?"var(--red)":a.tier===2?"#ca5":a.tier===3?"#c84":"var(--green)";u=`<span class="pa-ls-tier-badge" style="color:${_};border-color:${_}44;background:${_}0a;">${y}</span>`}const g=f?"":`
            <div style="display:flex;gap:12px;margin-top:6px;font-family:var(--font-mono);font-size:8px;">
                <span style="color:${a.momentum_effect>=0?"var(--green)":"var(--red)"};">You: ${a.momentum_effect>=0?"+":""}${a.momentum_effect} Mom</span>
                <span style="color:${a.governance_effect>=0?"var(--green)":"var(--red)"};">${a.governance_effect>=0?"+":""}${a.governance_effect} Gov</span>
                <span style="color:${a.gov_momentum_effect>=0?"var(--green)":"var(--red)"};">Govt: ${a.gov_momentum_effect>=0?"+":""}${a.gov_momentum_effect} Mom</span>
            </div>
        `;return`
            <div class="pa-ls-card ${f?"active":"resolved"}">
                <div class="pa-ls-header">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${n}</span>
                        <span style="font-size:11px;font-weight:700;color:var(--text-bright);">${b(s)}</span>
                        <span class="pa-ls-tier-badge" style="color:${o.color};border-color:${o.color}44;background:${o.color}0a;">TIER ${a.tier}</span>
                        ${u}
                    </div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">
                        ${f?`${m} ticks left`:`Resolved tick ${a.resolves_at_tick}`}
                    </div>
                </div>
                ${f?`
                    <div class="pa-ls-timeline">
                        <div class="pa-ls-timeline-track">
                            <div class="pa-ls-timeline-fill" style="width:${r*100}%;"></div>
                        </div>
                        ${p}
                    </div>
                `:""}
                <div style="font-size:9px;color:var(--text-dim);margin-top:4px;">
                    Corruption growth: <span style="color:${o.color};font-weight:700;">${(a.corruption_growth||0).toFixed(1)}</span>
                    &mdash; ${b(o.label)}
                </div>
                ${g}
            </div>
        `}).join("")}
        </div>
    `}let Pt=!1;async function ne(e){const t=document.getElementById("pa-hire-modal");if(!t)return;const a=x.nation?.id,i=x.nation?.name;if(!a||!i)return;t.innerHTML='<div class="pa-modal"><div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Searching for candidates...</div></div>',t.classList.add("active");const s=await Re(k,a,i);let n=null;function o(){const c=n!=null?s[n]:null,f=c?st(c.skill):null,l=s.map((m,v)=>{const p=n===v,u=st(m.skill);return`<div class="pa-hire-row ${p?"selected":""}" data-idx="${v}">
                <div style="width:32px;height:32px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#d44a4a;flex-shrink:0;">${W(m.first_name,m.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${p?"var(--text-bright)":"var(--text-secondary)"};">${b(m.first_name)} ${b(m.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${m.skill}%;background:${u.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${u.color};">${m.skill}</span>
                    </div>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;">Age ${m.age}</div>
            </div>`}).join("");let d;c?d=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#d44a4a;">${W(c.first_name,c.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${b(c.first_name)} ${b(c.last_name)}</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:1px;">Age ${c.age} &middot; Opposition Coordinator Candidate</div>
                        </div>
                    </div>

                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">SKILL</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${c.skill}%;background:${f.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${f.color};">${c.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${f.color};margin-top:3px;font-weight:700;">${f.label}</div>
                        </div>
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">HIRE COST</div>
                            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--accent);">$${(c.hire_cost/1e3).toFixed(0)}k</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:3px;">From party funds</div>
                        </div>
                    </div>

                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">BACKGROUND</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.6;font-style:italic;">${b(c.background)}</div>
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
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-right:auto;">Cost: <span style="color:var(--accent);font-weight:700;">$${(c.hire_cost/1e3).toFixed(0)}k</span></span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-hire-confirm" style="background:#d44a4a;"${(x.faction?.party_funds||0)<c.hire_cost?' disabled title="Not enough funds"':""}>Hire ${b(c.first_name)}</button>
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
                        ${l}
                    </div>
                    <div style="flex:1;overflow-y:auto;" id="pa-hire-detail">
                        ${d}
                    </div>
                </div>
            </div>
        `;const r=()=>t.classList.remove("active");document.getElementById("pa-hire-close")?.addEventListener("click",r),t.onclick=m=>{m.target===t&&r()},document.getElementById("pa-hire-list")?.addEventListener("click",m=>{const v=m.target.closest(".pa-hire-row");v&&(n=parseInt(v.dataset.idx,10),o())}),document.getElementById("pa-hire-confirm")?.addEventListener("click",async()=>{if(Pt||n==null)return;Pt=!0;const m=document.getElementById("pa-hire-confirm");m&&(m.disabled=!0,m.textContent="Hiring...");try{const v=x.shard?.current_tick||0,p=s[n],u=p.hire_cost||0,g=x.faction?.party_funds||0;if(u>0&&g<u){alert(`Not enough funds. You have $${Math.round(g/1e3)}k, need $${Math.round(u/1e3)}k.`);return}if(u>0){const _=g-u,{error:$}=await k.from("factions").update({party_funds:_}).eq("id",x.faction.id);if($){alert("Failed to deduct funds.");return}x.faction.party_funds=_}const y=await Fe(k,x.faction?.id,p,v);if(!y.success){alert(y.error||"Failed to hire agitator.");return}D=y.agitator,Y="agitator",r(),G(e)}catch(v){console.error("[PartyActions] Hire agitator error:",v)}finally{Pt=!1,m&&(m.disabled=!1)}})}o()}let wt=!1;function aa(e){const t=document.getElementById("pa-lawsuit-modal");if(!t)return;if(!rt){alert("No active government to file against.");return}const a=x.faction,i=D;let s=null,n=null;function o(){const c=s&&n,f=Ct.map(r=>{const m=s===r.key;return`<div class="pa-lawsuit-target ${m?"selected":""}" data-target="${r.key}">
                <span style="font-size:18px;">${r.icon}</span>
                <span style="font-size:12px;font-weight:600;color:${m?"var(--text-bright)":"var(--text-secondary)"};">${b(r.label)}</span>
            </div>`}).join(""),l=fe.map(r=>{const m=n===r.key;return`<div class="pa-lawsuit-basis ${m?"selected":""}" data-basis="${r.key}">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:16px;height:16px;border-radius:50%;border:2px solid ${m?"#d44a4a":"var(--border-mid)"};display:flex;align-items:center;justify-content:center;">
                        ${m?'<div style="width:8px;height:8px;border-radius:50%;background:#d44a4a;"></div>':""}
                    </div>
                    <div>
                        <div style="font-size:14px;font-weight:600;color:${m?"var(--text-bright)":"var(--text-secondary)"};">${b(r.label)}</div>
                        <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">${b(r.desc)}</div>
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
                        <div style="display:flex;flex-direction:column;gap:4px;" id="pa-lawsuit-bases">${l}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-lawsuit-submit" ${c?"":"disabled"} style="background:#d44a4a;">File Lawsuit</button>
                </div>
            </div>
        `;const d=()=>t.classList.remove("active");document.getElementById("pa-lawsuit-close")?.addEventListener("click",d),document.getElementById("pa-lawsuit-cancel")?.addEventListener("click",d),t.onclick=r=>{r.target===t&&d()},document.getElementById("pa-lawsuit-targets")?.addEventListener("click",r=>{const m=r.target.closest(".pa-lawsuit-target");m&&(s=m.dataset.target,o())}),document.getElementById("pa-lawsuit-bases")?.addEventListener("click",r=>{const m=r.target.closest(".pa-lawsuit-basis");m&&(n=m.dataset.basis,o())}),document.getElementById("pa-lawsuit-submit")?.addEventListener("click",async()=>{if(wt||!s||!n)return;wt=!0;const r=document.getElementById("pa-lawsuit-submit");r&&(r.disabled=!0,r.textContent="Filing...");try{const{data:v}=await k.from("factions").select("party_funds").eq("id",a.id).single(),p=v?.party_funds||0;if(p<25e4){alert(`Not enough funds. You have $${Math.round(p/1e3)}k, need $250k.`),wt=!1,r&&(r.disabled=!1,r.textContent="File Lawsuit");return}const u=p-25e4;await k.from("factions").update({party_funds:u}).eq("id",a.id),a.party_funds=u,sessionStorage.removeItem("nationhood_state");const g=x.shard?.current_tick||0,y=await Oe(k,{factionId:a?.id,nationId:x.nation?.id,agitatorId:i?.id,targetMinistry:s,basis:n,currentTick:g,partyName:a?.faction_name||"Opposition",administration:rt});if(!y.success){alert(y.error||"Failed to file lawsuit.");return}const _=Yt(y.lawsuit?.corruption_growth||0),$=tt[y.tier]||tt[1];d(),alert(`Lawsuit filed against ${Ct.find(h=>h.key===s)?.label||s}.
The case is now under investigation. Results will be determined when it resolves in 8 ticks.`),G(e)}catch(m){console.error("[PartyActions] File lawsuit error:",m),alert("An error occurred. Please try again.")}finally{wt=!1,r&&(r.disabled=!1,r.textContent="File Lawsuit")}})}t.classList.add("active"),o()}async function ia(e){const t=document.getElementById("pa-appoint-pm-modal");if(!t)return;const a=x.nation;x.faction;const{data:i}=await k.from("factions").select("id, faction_name, abbreviation, party_color, seats, leader_first_name, leader_last_name, leader_age").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),s=i||[];let n=null,o=!1;const{data:c}=await k.from("head_of_government").select("faction_id, first_name, last_name, factions(faction_name)").eq("nation_id",a.id).eq("active",!0).maybeSingle();function f(){const l=s.find(p=>p.id===n),d=c?`${c.first_name} ${c.last_name}`:null,r=c?.factions?.faction_name||null,m=c&&n===c.faction_id;t.innerHTML=`
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
                    ${d?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Current PM: <strong style="color:var(--text-bright);">${b(d)}</strong> (${b(r||"?")})</div>`:'<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--amber);">No Prime Minister appointed.</div>'}
                </div>
                <div class="pa-modal-body" style="max-height:300px;overflow-y:auto;">
                    <div class="pa-modal-step-label">Select a Party</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${s.map(p=>{const u=p.id===n,g=c&&p.id===c.faction_id,y=p.leader_first_name&&p.leader_last_name?`${p.leader_first_name} ${p.leader_last_name}`:"?";return`<div class="pa-action-item ${u?"selected":""}" data-party-id="${p.id}" style="cursor:pointer;${u?`border-color:${p.party_color||"#888"};background:${p.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${p.party_color||"#888"};"></div>
                                        <div>
                                            <div style="font-size:13px;font-weight:600;color:var(--text-bright);">${b(p.faction_name)}</div>
                                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${b(y)}, Age ${p.leader_age||"?"} · ${p.seats||0} seats</div>
                                        </div>
                                    </div>
                                    ${g?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:2px 6px;color:var(--green);background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2);">CURRENT PM</span>':""}
                                </div>
                            </div>`}).join("")}
                    </div>
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="apm-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="apm-confirm" ${!l||o||m?"disabled":""} style="background:#c8a832;">${l?m?"Already PM":`Appoint ${b(l.faction_name)}`:"Select a party"}</button>
                </div>
            </div>
        `;const v=()=>t.classList.remove("active");document.getElementById("apm-close")?.addEventListener("click",v),document.getElementById("apm-cancel")?.addEventListener("click",v),t.onclick=p=>{p.target===t&&v()},t.querySelector(".pa-modal-body")?.addEventListener("click",p=>{const u=p.target.closest("[data-party-id]");u&&(n=u.dataset.partyId,f())}),document.getElementById("apm-confirm")?.addEventListener("click",async()=>{if(!n||o)return;const p=s.find(g=>g.id===n);if(!p||!confirm(`Appoint ${p.leader_first_name} ${p.leader_last_name} of ${p.faction_name} as Prime Minister?`))return;o=!0;const u=document.getElementById("apm-confirm");u&&(u.disabled=!0,u.textContent="Appointing...");try{const g=x.shard?.current_tick||0;await k.from("head_of_government").update({active:!1}).eq("nation_id",a.id).eq("active",!0);const{error:y}=await k.from("head_of_government").insert({nation_id:a.id,faction_id:n,first_name:p.leader_first_name||"Unknown",last_name:p.leader_last_name||"Unknown",age:p.leader_age||50,ideology:"Centrist",active:!0,appointed_tick:g});if(y)throw y;try{await k.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} appoints Prime Minister`,category:"government",description_chosen:`${a.monarch_title||"The King"} has appointed ${p.leader_first_name} ${p.leader_last_name} of ${p.faction_name} as Prime Minister.`,fired_at_tick:g})}catch{}v(),alert(`${p.leader_first_name} ${p.leader_last_name} of ${p.faction_name} has been appointed Prime Minister.`),G(e)}catch(g){alert("Failed to appoint PM: "+(g.message||"Error")),o=!1,u&&(u.disabled=!1,u.textContent=`Appoint ${b(p.faction_name)}`)}})}t.classList.add("active"),f()}async function oa(e){const t=document.getElementById("pa-royal-modal");if(!t)return;const a=x.nation,i=x.faction,s=i.seats||0,n=a?.total_seats||100,{data:o}=await k.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),c=(o||[]).filter(m=>m.id!==i.id);let f=null;const l=Math.max(0,s-1);let d=Math.min(5,l||1);function r(){const m=c.find(p=>p.id===f);t.innerHTML=`
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
                        ${c.length>0?c.map(p=>{const u=p.id===f;return`<div class="pa-action-item ${u?"selected":""}" data-faction-id="${p.id}" style="cursor:pointer;${u?`border-color:${p.party_color||"#888"};background:${p.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${p.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${b(p.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${Math.max(0,p.seats||0)} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No other factions in this nation.</div>'}
                    </div>
                    ${m?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Grant</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${l}" value="${d}" id="grant-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--accent);width:40px;text-align:center;" id="grant-count">${d}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Legitimacy gain: <span style="color:#5cc55c;font-weight:700;">+${(d*.5).toFixed(1)}</span>
                                &middot; Your seats after: ${s-d} &middot; Their seats after: ${(m.seats||0)+d}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-grant" ${m?"":"disabled"} style="background:#c8a832;">Grant ${d} Seats</button>
                </div>
            </div>
        `;const v=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",v),document.getElementById("royal-cancel")?.addEventListener("click",v),t.onclick=p=>{p.target===t&&v()},t.querySelector(".pa-modal-body")?.addEventListener("click",p=>{const u=p.target.closest("[data-faction-id]");u&&(f=u.dataset.factionId,r())}),document.getElementById("grant-slider")?.addEventListener("input",p=>{d=parseInt(p.target.value)||1,document.getElementById("grant-count").textContent=d;const u=document.getElementById("royal-grant");u&&(u.textContent=`Grant ${d} Seats`)}),document.getElementById("royal-grant")?.addEventListener("click",async()=>{if(!f)return;const p=document.getElementById("royal-grant");p&&(p.disabled=!0,p.textContent="Granting...");try{const{data:u}=await k.from("factions").select("id, faction_name, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null),g=(u||[]).find(L=>L.id===i.id),y=(u||[]).find(L=>L.id===f);if(!g||!y){alert("Faction not found.");return}const _=(u||[]).reduce((L,T)=>L+Math.max(0,T.seats||0),0),$=a?.total_seats||100,h=[];let w=d;const C=Math.min(w,Math.max(0,g.seats||0)-1);if(C>0&&(w-=C),w>0){const L=(u||[]).filter(O=>O.id!==i.id&&O.id!==f&&(O.seats||0)>0),T=L.reduce((O,z)=>O+(z.seats||0),0);if(T>0)for(const O of L){const z=Math.round(w*(O.seats||0)/T),H=Math.min(z,O.seats||0);H>0&&(h.push({id:O.id,seats:(O.seats||0)-H}),w-=H)}}const I=d-w;if(I<=0){alert("No seats available to grant.");return}const M=Math.max(1,(g.seats||0)-Math.min(d-w,d)),S=(y.seats||0)+I,R=I*.5,E=Math.min(100,(Number(a.legitimacy)||50)+R);h.push({id:i.id,seats:M}),h.push({id:f,seats:S});for(const L of h){const{error:T}=await k.from("factions").update({seats:L.seats}).eq("id",L.id);if(T){alert("Failed to grant seats.");return}}const{error:N}=await k.from("nations").update({legitimacy:E}).eq("id",a.id);if(N){alert("Failed to update legitimacy.");return}i.seats=M,a.legitimacy=E;try{const L=c.find(T=>T.id===f);await k.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} grants ${I} seats to ${L?.faction_name||"unknown"}`,category:"government",description_chosen:`The ${a.monarch_title||"King"} has granted ${I} parliamentary seat${I!==1?"s":""} to ${L?.faction_name}. Legitimacy +${R.toFixed(1)}.`,fired_at_tick:x.shard?.current_tick||0})}catch{}v(),G(e)}catch(u){console.error("[GrantSeats] Error:",u),alert("Failed to grant seats.")}})}t.classList.add("active"),r()}async function na(e){const t=document.getElementById("pa-royal-modal");if(!t)return;const a=x.nation,i=x.faction,{data:s}=await k.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),n=(s||[]).filter(l=>l.id!==i.id&&(l.seats||0)>0);let o=null,c=1;function f(){const l=n.find(u=>u.id===o),d=l&&l.seats||0,m=c*1e5,v=i.party_funds||0;t.innerHTML=`
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
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${b(u.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${u.seats} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No factions have seats to revoke.</div>'}
                    </div>
                    ${l?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Revoke</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${d}" value="${c}" id="revoke-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#d44a4a;width:40px;text-align:center;" id="revoke-count">${c}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Cost: <span style="color:#d44a4a;font-weight:700;">$${Math.round(m/1e3)}k</span>
                                &middot; Legitimacy: <span style="color:#d44a4a;font-weight:700;">-${c}</span>
                                ${v<m?'<span style="color:#d44a4a;margin-left:8px;">⚠ Not enough funds</span>':""}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-revoke" ${!l||v<m?"disabled":""} style="background:#d44a4a;">Revoke ${c} Seats</button>
                </div>
            </div>
        `;const p=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",p),document.getElementById("royal-cancel")?.addEventListener("click",p),t.onclick=u=>{u.target===t&&p()},t.querySelector(".pa-modal-body")?.addEventListener("click",u=>{const g=u.target.closest("[data-faction-id]");g&&(o=g.dataset.factionId,c=1,f())}),document.getElementById("revoke-slider")?.addEventListener("input",u=>{c=parseInt(u.target.value)||1,document.getElementById("revoke-count").textContent=c;const g=document.getElementById("royal-revoke");g&&(g.textContent=`Revoke ${c} Seats`)}),document.getElementById("royal-revoke")?.addEventListener("click",async()=>{if(!o)return;const u=document.getElementById("royal-revoke");u&&(u.disabled=!0,u.textContent="Revoking...");try{const g=n.find(N=>N.id===o),y=c*1e5,{data:_}=await k.from("factions").select("party_funds").eq("id",i.id).single(),$=_?.party_funds||0;if($<y){alert("Not enough funds.");return}const h=$-y,w=(i.seats||0)+c,C=Math.max(0,(g?.seats||0)-c),I=c,M=Math.max(0,(Number(a.legitimacy)||50)-I),{error:S}=await k.from("factions").update({seats:w,party_funds:h}).eq("id",i.id),{error:R}=await k.from("factions").update({seats:C}).eq("id",o),{error:E}=await k.from("nations").update({legitimacy:M}).eq("id",a.id);if(S||R||E){alert("Failed to revoke seats.");return}i.seats=w,i.party_funds=h,a.legitimacy=M,sessionStorage.removeItem("nationhood_state");try{await k.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} revokes ${c} seats from ${g?.faction_name||"unknown"}`,category:"political",description_chosen:`The ${a.monarch_title||"King"} has revoked ${c} seat${c!==1?"s":""} from ${g?.faction_name}. Legitimacy -${I}.`,fired_at_tick:x.shard?.current_tick||0})}catch{}p(),G(e)}catch(g){console.error("[RevokeSeats] Error:",g),alert("Failed to revoke seats.")}})}t.classList.add("active"),f()}let Nt=!1;async function sa(e){if(Nt)return;const t=x.faction,a=t.seats||0,i=Math.max(1,t.momentum??0);if(a<=0){alert("Your party has no seats — nothing to fundraise from.");return}const s=ue(a,ot);if(i-s.momCost<1){alert(`Not enough momentum. You need ${s.momCost} momentum (current: ${Math.round(i)}, floor: 1). Try again next tick when momentum recovers.`);return}Nt=!0;try{const{data:n}=await k.from("factions").select("party_funds, momentum").eq("id",t.id).single();n&&(t.party_funds=n.party_funds??0,t.momentum=n.momentum??0);const o=Math.max(1,t.momentum??0),c=x.shard?.current_tick||0,f=Math.max(1,o-s.momCost),l=(t.party_funds||0)+s.raised,{error:d}=await k.from("factions").update({momentum:f,party_funds:l}).eq("id",t.id);if(d){alert("Fundraise failed: "+d.message);return}await k.from("campaign_actions").insert({party_id:t.id,nation_id:x.nation?.id,action_type:"fundraise",ap_cost:0,money_cost:0,tick_performed:c,result:{raised:s.raised,perSeat:s.perSeat,momCost:s.momCost,useNumber:ot+1,seats:a}}),t.momentum=f,t.party_funds=l,sessionStorage.removeItem("nationhood_state"),ot++,G(e)}catch(n){console.error("[PartyActions] Fundraise error:",n),alert("Fundraise failed.")}finally{Nt=!1}}function ra(e){const t=document.getElementById("pa-statement-modal");if(!t)return;const a=x.faction,i=a?.color||"#c8a832",s=a?.leader_first_name&&a?.leader_last_name?`${a.leader_first_name} ${a.leader_last_name}`:"Party Leader",n=te.map(d=>`<div class="pa-topic-card" data-topic="${d.id}" style="padding:8px 10px;cursor:pointer;border:1px solid var(--border-mid);display:flex;align-items:center;gap:8px;transition:all 0.12s;">
            <span style="font-size:14px;">${d.icon}</span>
            <span style="font-size:10px;font-weight:600;color:var(--text-secondary);">${b(d.label)}</span>
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
    `,t.classList.add("active");let o=null,c=!1;const f=()=>t.classList.remove("active");document.getElementById("pa-stmt-close")?.addEventListener("click",f),document.getElementById("pa-stmt-cancel")?.addEventListener("click",f),t.addEventListener("click",d=>{d.target===t&&f()}),document.getElementById("pa-stmt-topics")?.addEventListener("click",d=>{const r=d.target.closest(".pa-topic-card");r&&(o=r.dataset.topic,document.querySelectorAll(".pa-topic-card").forEach(m=>{const v=m.dataset.topic===o;m.style.borderColor=v?i:"var(--border-mid)",m.style.background=v?i+"0a":"";const p=m.querySelector("span:last-child");p&&(p.style.color=v?"var(--text-bright)":"var(--text-secondary)")}),l())});const l=()=>{const d=document.getElementById("pa-stmt-body")?.value?.trim()||"",r=document.getElementById("pa-stmt-submit"),m=document.getElementById("pa-stmt-charcount");m&&(m.textContent=`${d.length} characters`),r&&(r.disabled=!(o&&d.length>=10))};document.getElementById("pa-stmt-body")?.addEventListener("input",l),document.getElementById("pa-stmt-submit")?.addEventListener("click",async()=>{if(c)return;const d=document.getElementById("pa-stmt-body")?.value?.trim();if(!o||!d||d.length<10)return;c=!0;const r=document.getElementById("pa-stmt-submit");r&&(r.disabled=!0,r.textContent="Issuing...");try{const m=x.shard?.current_tick||0,p=te.find(R=>R.id===o)?.label||o,u=2e4,{data:g}=await k.from("factions").select("party_funds").eq("id",a.id).single(),y=g?.party_funds||0;if(y<u){alert(`Not enough funds. You have $${Math.round(y/1e3)}k, need $20k.`);return}const _=y-u,{error:$}=await k.from("factions").update({party_funds:_}).eq("id",a.id);if($){alert("Failed to deduct funds: "+$.message);return}a.party_funds=_;const w=ee[Math.floor(Math.random()*ee.length)].replace("{party_name}",a.faction_name||"Unknown Party").replace("{leader_name}",s).replace("{topic}",p),{error:C}=await k.from("campaign_actions").insert({party_id:a.id,nation_id:x.nation?.id,action_type:"issue_statement",ap_cost:1,money_cost:0,tick_performed:m,result:{topic:o,topicLabel:p,headline:w,body:d,leaderName:s}});C&&console.error("[PartyActions] Statement log failed:",C.message);const{error:I}=await k.from("valdorian_articles").insert({nation_id:x.nation?.id,event_type:"issue_statement",tier:3,section:"politics",headline:w,subheadline:p,lede:d.substring(0,200)+(d.length>200?"...":""),body_paragraphs:JSON.stringify(d.split(/\n\n+/).filter(R=>R.trim())),quotes:JSON.stringify([{posture:"assertive",text:d.substring(0,150)}]),byline_reporter:"Political Desk",topic_tags:JSON.stringify([o]),source_event_id:"statement_"+Date.now(),tick:m});I&&console.error("[PartyActions] Article creation failed:",I.message);const{error:M}=await k.from("event_log").insert({nation_id:x.nation?.id,event_name:w,category:"political",description_chosen:`${a.faction_name} issues the following statement regarding ${p}: "${d}"`,fired_at_tick:m});M&&console.warn("[Statement] event_log insert failed:",M.message);const{error:S}=await k.from("admin_timeline_events").insert({nation_id:x.nation?.id,tick:m,type:"communications",title:"Statement Issued",description:`${s} issued a public statement on ${p}: "${d.substring(0,120)}${d.length>120?"...":""}"`});S&&console.warn("[Statement] timeline insert failed:",S.message),f(),G(e)}catch(m){console.error("[PartyActions] Statement error:",m),alert("Failed to issue statement. Please try again.")}finally{c=!1,r&&(r.disabled=!1,r.textContent="Issue Statement")}})}const Mt=20;function la(e){const t=document.getElementById("pa-platform-modal");if(!t)return;const a=x.faction;x.nation;const i=a?.color||"#c8a832";let s=null,n=!1;const o={};for(const l of It)l.faction_id!==a?.id&&(o[l.platform_key]=(o[l.platform_key]||0)+1);const c=new Set(X.map(l=>l.platform_key));function f(){const l=_t.find(v=>v.id===s),d=l?Xt(o[l.id]||0):null;l&&It.filter(v=>v.platform_key===l.id&&v.faction_id!==a?.id);const r=_t.map(v=>{const p=s===v.id,u=c.has(v.id),g=Xt(o[v.id]||0),y=o[v.id]||0;return`<div class="pa-plat-card ${p?"selected":""} ${u?"adopted":""}" data-plat="${v.id}">
                ${u?'<div class="pa-plat-active-badge">ACTIVE</div>':""}
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <span style="font-size:14px;">${v.icon}</span>
                    <span style="font-size:10px;font-weight:700;color:${u?i:p?"var(--text-bright)":"var(--text-secondary)"};line-height:1.2;">${b(v.name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.4;margin-bottom:6px;">${b(v.tagline)}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${g.color};">${g.label}</span>
                    ${y>0?`<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 3px;color:var(--text-dim);border:1px solid var(--border-mid);">${y} rival${y>1?"s":""}</span>`:""}
                </div>
            </div>`}).join("");let m;if(!l)m=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;">
                <div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:24px;color:var(--border-mid);margin-bottom:8px;">←</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Select a platform to review</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:4px;">16 platforms available</div>
                </div>
            </div>`;else{const v=l.improve.map(_=>{const $=Jt(_,"improve");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(92,204,92,0.05);border:1px solid rgba(92,204,92,0.15);color:${$.color};white-space:nowrap;">${$.arrow} ${Kt[_]||_}</span>`}).join(""),p=l.worsen.map(_=>{const $=Jt(_,"worsen");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(204,85,85,0.05);border:1px solid rgba(204,85,85,0.15);color:${$.color};white-space:nowrap;">${$.arrow} ${Kt[_]||_}</span>`}).join(""),u=c.has(l.id),g=X.length;let y;u?y=`<div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${i};display:flex;align-items:center;gap:6px;">✓ CURRENT PLATFORM</div>`:g>=3?y='<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">All 3 platform slots are full.</div>':n?y=`<div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:#ca5;font-weight:700;">⚠ Confirm: Adopt ${b(l.name)}?</span>
                    <div style="display:flex;gap:6px;">
                        <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-plat-conf-cancel">Cancel</button>
                        <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-conf-yes">Confirm</button>
                    </div>
                </div>`:y=`<div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Costs 2 AP. Stats locked at current values. 6-tick cooldown.</span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-adopt" style="background:${i};">Adopt Platform</button>
                </div>`,m=`
                <div style="padding:16px 20px 12px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                        <span style="font-size:22px;">${l.icon}</span>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${b(l.name)}</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.04em;margin-top:1px;">${b(l.tagline.toUpperCase())}</div>
                        </div>
                    </div>
                    <div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">${b(l.desc)}</div>
                </div>
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);background:var(--bg-card);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">MOMENTUM GAIN</div>
                            <div style="display:flex;align-items:baseline;gap:6px;">
                                <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${d.color};">${d.label}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);">${b(d.note)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="flex:1;padding:12px 20px;overflow-y:auto;">
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.1em;color:var(--green);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--green);display:inline-block;"></span>
                            PROMISES TO IMPROVE <span style="font-weight:400;color:var(--text-dim);">(${l.improve.length} stats, +${Mt} target)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${v}</div>
                    </div>
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.1em;color:var(--red);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--red);display:inline-block;"></span>
                            LIKELY SIDE EFFECTS <span style="font-weight:400;color:var(--text-dim);">(${l.worsen.length} stats)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${p}</div>
                    </div>
                    <div style="padding:10px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.15);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#ca5;letter-spacing:0.06em;margin-bottom:4px;">⚠ TRADEOFF</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.5;">${b(l.tradeoff)}</div>
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
                        ${r}
                    </div>
                    <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow-y:auto;" id="pa-plat-detail">
                        ${m}
                    </div>
                </div>
            </div>
        `,document.getElementById("pa-plat-close")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=v=>{v.target===t&&t.classList.remove("active")},document.getElementById("pa-plat-grid")?.addEventListener("click",v=>{const p=v.target.closest(".pa-plat-card");p&&(s=p.dataset.plat,n=!1,f())}),document.getElementById("pa-plat-adopt")?.addEventListener("click",()=>{n=!0,f()}),document.getElementById("pa-plat-conf-cancel")?.addEventListener("click",()=>{n=!1,f()}),document.getElementById("pa-plat-conf-yes")?.addEventListener("click",()=>da(e,s))}t.classList.add("active"),f()}let kt=!1;async function da(e,t){if(kt)return;kt=!0;const a=document.getElementById("pa-platform-modal"),i=x.faction,s=x.nation;if(!i||!s||!t){kt=!1;return}const n=_t.find(l=>l.id===t);if(!n)return;const o={},c={},f=l=>Vt.has(l);for(const l of n.improve){const d=Number(s[l]??50);o[l]=d,f(l)?c[l]=Math.max(0,d-Mt):c[l]=Math.min(100,d+Mt)}try{const l=x.shard?.current_tick||0,{data:d,error:r}=await k.rpc("adopt_platform",{p_faction_id:i.id,p_nation_id:s.id,p_platform_key:t,p_tick:l,p_baseline_stats:o,p_target_stats:c});if(r){console.error("[PartyActions] Platform adoption failed:",r.message),alert("Failed to adopt platform: "+r.message);return}if(d&&!d.success){alert(d.error||"Failed to adopt platform.");return}const m=d?.slot||X.length+1;X.push({faction_id:i.id,nation_id:s.id,platform_key:t,slot:m,adopted_at_tick:l,baseline_stats:o,target_stats:c,status:"active"}),It.push(X[X.length-1]),i&&d?.momentum_gained&&(i.momentum=(i.momentum||0)+d.momentum_gained),i&&(i.action_points=Math.max(0,(i.action_points||0)-2)),a?.classList.remove("active"),G(e)}catch(l){console.error("[PartyActions] Platform adoption error:",l),alert("An error occurred. Please try again.")}finally{kt=!1}}let vt=null,be={isOpposition:!0,administration:null,governanceScore:0,governanceDeltas:[],governanceMultiplier:1,governanceDecayCycles:0,ticksInPower:0,myFaction:null,allParties:[],rivalParties:[],factionIdeology:{},electoralStandings:[],recentActivity:[],caucuses:[],nextElection:null,nextElectionTicks:null,ideologyAxes:[]};function B(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}const ca=[...Me,...Se];function pa(e,t,a,i){const s=i-(a||i);if(!t)return{score:0,deltas:[],decayCycles:0,multiplier:1,ticksInPower:s};let n=0,o=0;const c=[];for(const r of ca){const m=Le(r);if(m===0)continue;const v=Number(t[r]??0),p=Number(e[r]??0),u=p-v;if(u===0)continue;const g=u*m,y=g>0;c.push({key:r,start:v,now:p,delta:u,signed:g,dir:m,isGood:y}),n+=g,o++}let f=o>0?n/o:0;const l=Math.floor(s/24),d=f>0?Math.pow(.97,l):1;return f*=d,{score:Math.round(f*10)/10,deltas:c,decayCycles:l,multiplier:d,ticksInPower:s}}function ma(e,t,a){return Ie.map(i=>{const s=t[e],o=((s?Number(s[i.key]??0):0)+100)/200,c=a.map(f=>{const l=t[f.id],d=l?Number(l[i.key]??0):0;return{id:f.id,pos:(d+100)/200,color:f.party_color||"#666"}});return{key:i.key,name:`${i.leftLabel} / ${i.rightLabel}`,left:i.leftLabel.toUpperCase(),right:i.rightLabel.toUpperCase(),leftColor:i.leftColor,rightColor:i.rightColor,yourPos:o,parties:c}})}async function fa(e,t,a){vt=t;const i=document.getElementById(a);if(!i)return;const s=t.faction,n=t.nation,o=n?.id,c=s?.id;if(!s||!o){i.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">No faction data.</div>';return}i.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Loading party overview...</div>';try{const f=t.shard?.current_tick||0,[l,d,r,m,v,p,u]=await Promise.all([pe(e,o,c),e.from("factions").select("*").eq("nation_id",o).eq("faction_type","party"),e.from("faction_ideology").select("*"),e.from("faction_electoral_standing").select("*").eq("nation_id",o),e.from("campaign_actions").select("*").eq("party_id",c).order("tick_performed",{ascending:!1}).limit(20),e.from("caucus_factions").select("*").eq("party_id",c).eq("is_active",!0),e.from("elections").select("*").eq("nation_id",o).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(5)]);d.error&&console.error("[PartyOverview] Parties fetch error:",d.error.message),r.error&&console.error("[PartyOverview] Ideology fetch error:",r.error.message),m.error&&console.error("[PartyOverview] Standings fetch error:",m.error.message),v.error&&console.error("[PartyOverview] Activity fetch error:",v.error.message),p.error&&console.error("[PartyOverview] Caucus fetch error:",p.error.message),u.error&&console.error("[PartyOverview] Election fetch error:",u.error.message);const g=d.data||[],y=l.administration,_={};for(const S of r.data||[])_[S.faction_id]=S;let $={score:0,deltas:[],decayCycles:0,multiplier:1,ticksInPower:0};y&&y.stats_at_start&&($=pa(n,y.stats_at_start,y.started_at_tick,f));const h=u.data||[],w=h[0]||null,C=w?Math.max(0,w.election_tick-f):null;let I=null;w&&n&&(n.government_type?.toLowerCase().includes("presidential")||n.hos_election_method==="direct_vote")&&(I=h.some(E=>E.election_type==="presidential"&&E.election_tick===w.election_tick)?"General":"Midterm");const M=ma(c,_,g);be={isOpposition:l.isOpposition,administration:y,governanceScore:$.score,governanceDeltas:$.deltas.sort((S,R)=>Math.abs(R.signed)-Math.abs(S.signed)),governanceMultiplier:$.multiplier,governanceDecayCycles:$.decayCycles,ticksInPower:$.ticksInPower,myFaction:s,allParties:g,rivalParties:g.filter(S=>S.id!==c),factionIdeology:_,electoralStandings:m.data||[],recentActivity:v.data||[],caucuses:p.data||[],nextElection:w,nextElectionTicks:C,nextElectionLabel:I,ideologyAxes:M},he(i)}catch(f){console.error("[PartyOverview] Init error:",f),i.innerHTML='<div style="padding:40px;text-align:center;color:var(--red);font-family:var(--font-mono);font-size:10px;">Failed to load party overview.</div>'}}let Z=[];function he(e){const t=be,a=t.myFaction,i=vt.nation,s=a?.party_color||a?.color||"#c8a832";vt.shard?.current_tick,Z.length===0&&(Z=[a?.id,...t.rivalParties.map(d=>d.id)]),t.administration?.admin_name||t.isOpposition;const n=t.isOpposition?"OPPOSITION":"GOVERNING",o=t.isOpposition?"var(--orange)":"var(--green)",c=a?.seats||0,f=i?.total_seats||100,l=a?.momentum??50;e.innerHTML=`<div class="po-page">
        ${va(t,s,c,f,l)}
        <div class="po-columns">
            <div class="po-col-left">
                ${ua(t,a,s,n,o)}
                ${ga(t)}
                ${ya(t,a,s)}
                ${xa(t)}
            </div>
            <div class="po-col-center" id="po-center-col">
                ${ba(t,l)}
                ${ha(t)}
            </div>
            <div class="po-col-right" id="po-right-col">
                ${_a(t,a)}
                ${$a(t)}
                ${wa()}
            </div>
        </div>
    </div>`,e.querySelectorAll(".po-legend-item").forEach(d=>{d.addEventListener("click",()=>{const r=d.dataset.partyId;r!==a?.id&&(Z.includes(r)?Z=Z.filter(m=>m!==r):Z.push(r),he(e))})})}function va(e,t,a,i,s){const n=e.governanceScore,o=n>=0?"var(--green)":"var(--red)",c=e.isOpposition?"Opposition":e.administration?.admin_name||"Government",f=(vt.nation?.government_type||"").toLowerCase().includes("monarchy"),l=f?"No elections":e.nextElectionTicks!=null?e.nextElectionTicks:"—",d=f?"var(--text-dim)":typeof l=="number"&&l<=3?"var(--red)":"var(--text-bright)",r=f?"NEXT ELECTION":e.nextElectionLabel?"NEXT "+e.nextElectionLabel.toUpperCase():"NEXT ELECTION";return`<div class="po-summary">
        <div class="po-summary-cell" style="display:flex;flex-direction:row;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;background:${t};"></div>
            <div>
                <div style="font-size:11px;font-weight:700;color:var(--text-bright);">${B(c)}</div>
                <div class="po-summary-sub">${e.ticksInPower} ticks in power</div>
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
                <span class="po-summary-value" style="color:${t};">${a}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">/ ${i}</span>
            </div>
        </div>
        <div class="po-summary-cell" style="text-align:center;">
            <div class="po-summary-label">${r}</div>
            <div class="po-summary-value" style="color:${d};">${l}${typeof l=="number"?" ticks":""}</div>
        </div>
    </div>`}function ua(e,t,a,i,s){const n=t?.leader_first_name&&t?.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown",o=((t?.leader_first_name||"?")[0]+(t?.leader_last_name||"?")[0]).toUpperCase();t?.leader_age&&`${t.leader_age}`;const c=t?.approval_rating??0;return`<div class="po-card po-identity" style="border-left-color:${a};">
        <div class="po-identity-inner">
            <div class="po-identity-logo" style="color:${a};background:${a}12;border-color:${a}33;">${o}</div>
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">
                    <span class="po-identity-name">${B(t?.faction_name)}</span>
                    <span class="po-identity-badge" style="color:${s};background:${s}0a;border-color:${s}44;">${i}</span>
                </div>
                <div class="po-identity-meta">${e.ticksInPower} ticks in power</div>
                <div class="po-leader-row">
                    <div class="po-leader-avatar" style="color:${a};background:${a}15;border-color:${a}33;">${o}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-size:10px;font-weight:600;color:var(--text-bright);">${B(n)}</span>
                            <span style="font-family:var(--font-mono);font-size:7px;color:${a};">PARTY LEADER</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">APPROVAL</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--amber);">${c}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`}function ga(e){const t=e.governanceDeltas.slice(0,12),a=e.governanceScore,i=a>=0?"var(--green)":"var(--red)",s=e.governanceDecayCycles>0&&a>0?`Decay: ${((1-e.governanceMultiplier)*100).toFixed(1)}% (${e.governanceDecayCycles} cycles)`:"",n=t.map((o,c)=>{const f=o.isGood?"var(--green)":"var(--red)",l=o.delta>0?"+":"",d=o.key.replace(/_/g," ").replace(/\b\w/g,r=>r.toUpperCase());return`<div class="po-gov-row" style="${c<t.length-1?"border-bottom:1px solid rgba(200,196,184,0.03);":""}">
            <span class="po-gov-stat">${B(d)}</span>
            <span class="po-gov-val">${o.start.toFixed(1)}</span>
            <span class="po-gov-val">${o.now.toFixed(1)}</span>
            <span class="po-gov-delta" style="color:${f};">${l}${o.delta.toFixed(1)}</span>
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
        ${n||'<div style="padding:12px;text-align:center;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);font-style:italic;">No governance data yet.</div>'}
    </div>`}function ya(e,t,a){const s=[{id:t?.id,name:"You",color:a},...e.rivalParties.map(o=>({id:o.id,name:o.abbreviation||o.faction_name?.slice(0,3)||"?",color:o.party_color||"#666"}))].map(o=>{const c=Z.includes(o.id);return`<div class="po-legend-item ${c?"active":"inactive"}" data-party-id="${o.id}" style="${c?`background:${o.color}12;border-color:${o.color}44;`:""}">
            <div class="po-legend-dot" style="background:${c?o.color:"var(--text-dim)"};"></div>
            <span class="po-legend-name">${B(o.name)}</span>
        </div>`}).join(""),n=e.ideologyAxes.map(o=>{const c=o.parties.filter(l=>Z.includes(l.id)).map(l=>`<div class="po-axis-dot" style="left:${l.pos*100}%;background:${l.color};"></div>`).join(""),f=[20,40,60,80].map(l=>`<div class="po-axis-zone" style="left:${l}%;"></div>`).join("");return`<div class="po-axis">
            <div class="po-axis-labels">
                <span class="po-axis-label">${B(o.left)}</span>
                <span class="po-axis-name">${B(o.name)}</span>
                <span class="po-axis-label">${B(o.right)}</span>
            </div>
            <div class="po-axis-track">${f}${c}</div>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">IDEOLOGY</span>
        </div>
        <div style="padding:8px 12px;">
            <div class="po-legend">${s}</div>
            ${n}
        </div>
    </div>`}function xa(e){const t=(e.caucuses||[]).filter(s=>s.name&&s.name!=="Unnamed");if(t.length===0)return`<div class="po-card">
            <div class="po-card-header">
                <span class="po-card-title">INTERNAL CAUCUSES</span>
                <span class="po-card-subtitle">None</span>
            </div>
        </div>`;const a=e.faction?.seats||0,i=t.map(s=>{const n=s.relationship_score??50,o=n>60?"var(--green)":n>40?"var(--amber)":"var(--red)",c=Math.round((s.seat_share||0)*a),f=(s.dominant_axis||"").replace(/_/g,"/"),l=s.wing_end==="left"?f.split("/")[0]:f.split("/")[1]||"";return`<div class="po-caucus-row">
            <div>
                <div class="po-caucus-name">${B(s.name)}</div>
                <div class="po-caucus-wing" style="color:var(--text-dim);">${B(l)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="po-caucus-seats">${c} seats</span>
                <div style="width:50px;">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;margin-bottom:1px;">LOYALTY</div>
                    <div style="width:100%;height:3px;background:var(--border-main);"><div style="height:100%;width:${n}%;background:${o};"></div></div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${o};text-align:right;margin-top:1px;">${n}</div>
                </div>
            </div>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">INTERNAL CAUCUSES</span>
            <span class="po-card-subtitle">${t.length} active · ${a} seats</span>
        </div>
        ${i}
    </div>`}function ba(e,t){const i=Math.round(t*8/100*10)/10,s=Math.min(100,Math.max(0,t)),n=t>=60?"var(--green)":t>=30?"var(--orange)":"var(--red)";return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">MOMENTUM</span>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--red);">losing ${i}/tick</span>
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
    </div>`}function ha(e){const t=e.recentActivity||[],a=vt.shard?.current_tick||0;if(t.length===0)return`<div class="po-card" style="flex:1;">
            <div class="po-card-header">
                <span class="po-card-title">RECENT ACTIVITY</span>
            </div>
            <div style="padding:24px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No recent actions.</div>
        </div>`;const i={rally:"Rally",press_conference:"Press Conference",attack:"Attack Ad",issue_statement:"Statement",ideological_pivot:"Ideology Shift",take_stance:"Took Stance",poll_now:"Polled",endorse:"Endorsement",lobby:"Lobby"};return`<div class="po-card" style="flex:1;">
        <div class="po-card-header">
            <span class="po-card-title">RECENT ACTIVITY</span>
        </div>
        <div style="max-height:380px;overflow-y:auto;">${t.map(n=>{const o=a-(n.tick_performed||0),c=o===0?"0t":o+"t",f=n.result||{},l=f.momentumDelta||f.momentum_delta||(f.effects||[]).reduce((p,u)=>p+(u.stat==="Momentum"?u.value:0),0)||0,d=l>0?"+":"",r=l>0?"var(--green)":l<0?"var(--red)":"var(--text-dim)";let v=i[n.action_type]||n.action_type?.replace(/_/g," ")||"?";return n.action_type==="rally"?v="Rally: "+(f.outcomeName||"Unknown")+(l?" ("+d+l+")":""):n.action_type==="press_conference"?v="Press Conference ("+d+l+")":n.action_type==="attack"?v="Attack on "+(f.targetName||"rival"):n.action_type==="issue_statement"?v="Issued statement"+(l?" ("+d+l+")":""):n.action_type==="take_stance"?v="Took stance on "+(f.issueLabel||"issue"):n.action_type==="ideological_pivot"?v="Ideology shift: "+(f.targetAxis||""):n.action_type==="poll_now"&&(v="Polled (margin: "+(f.pollMargin||"?")+")"),`<div style="padding:5px 12px;border-bottom:1px solid rgba(200,196,184,0.03);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:9px;color:var(--text-secondary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:8px;">${B(v)}</span>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${r};">${l!==0?d+l:"—"}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);width:20px;text-align:right;">${c}</span>
            </div>
        </div>`}).join("")}</div>
    </div>`}function _a(e,t){const a=e.rivalParties,i=e.administration,s=new Set((Array.isArray(i?.coalition_parties)?i.coalition_parties:[]).map(d=>d?typeof d=="string"?d:typeof d=="object"&&(d.party_id||d.id)||null:null).filter(Boolean)),n=i?.pm_party_id,o=vt.nation?.total_seats||100,c=["SEC/FRE","TRA/PRO","IND/COL","LIB/EQL","GLB/NAT"],f=["security_freedom","tradition_progress","individualism_collectivism","liberty_equality","globalism_nationalism"],l=a.map(d=>{const r=d.party_color||"#666",m=d.abbreviation||d.faction_name?.slice(0,3)?.toUpperCase()||"?",v=d.leader_first_name&&d.leader_last_name?`${d.leader_first_name} ${d.leader_last_name}`:"Unknown",p=d.seats||0,u=d.id===n,g=s.has(d.id);let y,_;u?(y="GOVERNING — LEAD",_="var(--green)"):g?(y="GOVERNING — JUNIOR",_="var(--green)"):(y="OPPOSITION",_="var(--orange)");const $=p-(t?.seats||0),h=$>0?"var(--green)":$<0?"var(--red)":"var(--text-dim)",w=e.factionIdeology[d.id],C=f.map((I,M)=>{const R=((w?Number(w[I]??0):0)+100)/200;return`<div style="display:flex;align-items:center;gap:6px;">
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);width:42px;text-align:right;">${c[M]}</span>
                <div style="flex:1;height:5px;background:var(--border-main);position:relative;">
                    <div style="position:absolute;top:50%;left:${R*100}%;transform:translate(-50%,-50%);width:8px;height:8px;border-radius:50%;background:${r};"></div>
                </div>
            </div>`}).join("");return`<div style="padding:12px 16px;border-bottom:1px solid var(--border-main);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:36px;height:36px;background:${r}15;border:1px solid ${r}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${r};">${B(m)}</div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:var(--text-bright);">${B(d.faction_name)}</div>
                        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${B(v)}</div>
                    </div>
                </div>
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 7px;color:${_};background:${_}0a;border:1px solid ${_}44;white-space:nowrap;">${y}</span>
            </div>
            <div style="display:flex;gap:10px;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">SEATS</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${p>0?"var(--text-bright)":"var(--text-dim)"};">${p}</span>
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">/ ${o}</span>
                </div>
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">VS YOU</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${h};">${$>0?"+":""}${$}</span>
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:3px;">${C}</div>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">RIVAL PARTIES</span>
            <span class="po-card-subtitle">${a.length} parties</span>
        </div>
        ${l||'<div style="padding:16px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No rival parties.</div>'}
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
    </div>`}let A=null,P=null,it=!1,ut=null,q=[],nt=[],J=0,Q=0,St=null,ct=0,pt=[],Rt=!1,xt=null,j={},Ft=!1;function ht(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}const ka=6,Ea=4;async function _e(e,t){A=e,P=t;const a=t.nation,i=t.faction;if(!a||!i)return{needed:!1};const[s,n,o,c]=await Promise.all([e.from("elections").select("id, election_type, election_tick, status").eq("nation_id",a.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),e.from("shard").select("current_tick").eq("name","Alpha Shard").single(),e.from("government_formations").select("id").eq("nation_id",a.id).eq("status","formed").order("formed_at",{ascending:!1}).limit(1).maybeSingle(),e.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1})]);ct=n.data?.current_tick??0,q=c.data||[],J=q.reduce((r,m)=>r+(m.seats||0),0),Q=Math.ceil(J/2)+1;const f=s.data,l=!!o.data;if((a.government_type||"").toLowerCase().includes("presidential")||a.hos_election_method==="direct_vote"){if(it=!1,f&&!l)try{const r=n.data?.current_tick??0,{data:m}=await e.from("presidents").select("faction_id").eq("nation_id",a.id).eq("is_active",!0).maybeSingle(),v=m?.faction_id||q[0]?.id;if(v){await e.from("government_formations").insert({nation_id:a.id,proposed_by:v,status:"formed",party_ids:[v],formation_type:"coalition",formed_at:new Date().toISOString()});const u=[["interior","Minister of the Interior"],["foreign","Minister of Foreign Affairs"],["defense","Minister of Defense"],["finance","Minister of Finance"],["education","Minister of Education"],["healthcare","Minister of Health"],["labor","Minister of Labor"],["justice","Minister of Justice"],["trade","Minister of Trade"],["energy","Minister of Energy"],["transportation","Minister of Transportation"]].map(([g,y])=>({nation_id:a.id,ministry_key:g,ministry_name:y,party_id:v,is_active:!0}));await e.from("ministries").delete().eq("nation_id",a.id).eq("is_active",!0),await e.from("ministries").insert(u)}}catch(r){console.warn("[Coalition] Presidential auto-gov failed:",r.message)}return{needed:!1}}return f&&!l?(it=!0,ut=f.id,St=f.election_tick):(it=!l,f&&(ut=f.id,St=f.election_tick)),{needed:it}}async function lt(e){if(!e)return;const t=P.nation?.id;if(t){const{count:h}=await A.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",t).eq("is_active",!0).is("party_id",null);if(h&&h>=5){const{data:w}=await A.from("government_formations").select("*").eq("nation_id",t).not("ministry_assignments","eq","{}").order("created_at",{ascending:!1}).limit(1).maybeSingle();if(w&&w.ministry_assignments&&Object.keys(w.ministry_assignments).length>=5){w.status!=="formed"&&(await A.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",w.id),await A.from("government_formations").update({status:"cancelled"}).eq("nation_id",t).eq("status","active").neq("id",w.id)),j=w.ministry_assignments,await Wt(t);const C=w.ministry_assignments.prime_minister;if(C)try{await ce(A,t,C,ct,{skipCoalitionCheck:!0})}catch(I){console.warn("[Coalition] PM appointment during repair failed:",I.message)}it=!1,e.innerHTML=`<div class="cf-page">
                    <div class="cf-no-formation">
                        <div class="cf-no-icon">✓</div>
                        <div class="cf-no-title">Government Formed — Cabinet Populated</div>
                        <div class="cf-no-desc">Ministry assignments have been applied. Refresh the Government page to see your cabinet.</div>
                    </div>
                </div>`;return}}}if((P.nation?.government_type||"").toLowerCase().includes("presidential")||P.nation?.hos_election_method==="direct_vote"){e.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#127979;</div>
                <div class="cf-no-title">Presidential System</div>
                <div class="cf-no-desc">The President governs directly and nominates cabinet ministers. No coalition formation is required.</div>
            </div>
        </div>`;return}const i=(P.nation?.government_type||"").toLowerCase();if(i.includes("absolute")&&i.includes("monarchy")){e.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#128081;</div>
                <div class="cf-no-title">Absolute Monarchy</div>
                <div class="cf-no-desc">The Crown rules by decree. There are no elections.</div>
            </div>
        </div>`;return}if(!it){e.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">✓</div>
                <div class="cf-no-title">Government Formed</div>
                <div class="cf-no-desc">A coalition government is currently active. No formation needed.</div>
            </div>
        </div>`;return}if(!ut){const h=P.nation?.id;let w="?";if(h){const{data:C}=await A.from("elections").select("election_tick").eq("nation_id",h).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(1).maybeSingle();C&&(w=Math.max(0,C.election_tick-ct))}e.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon" style="font-size:2rem;">&#9878;</div>
                <div class="cf-no-title">No Government</div>
                <div class="cf-no-desc">No election has been held yet. The first election is in <strong style="color:var(--accent);">${w}</strong> tick${w!==1?"s":""}.</div>
            </div>
        </div>`;return}await Aa();const s=P.faction,o=(P.nation?.failed_formation_attempts||0)>=1?Ea:ka,c=St!==null?Math.max(0,ct-St):0,f=Math.max(0,o-c),l=Math.min(100,c/o*100),d=c*2;let r="safe";f<=1?r="critical":f<=2&&(r="warning");const m=r==="critical"?"⚠️":r==="warning"?"⏳":"🤝",v=r==="critical"?"No Government — Snap Election Imminent":r==="warning"?"Coalition Formation — Time Running Out":"Coalition Formation In Progress",p=r==="critical"?"Form a government immediately or face snap elections":r==="warning"?"Parties are negotiating — the deadline is approaching":"Parties are negotiating a coalition — propose or join one below",u=q.find(h=>h.id===s.id)?.seats||0,g=u>0,y=nt.some(h=>h.proposed_by===s.id);let _="";if(!g)_='<div class="cf-note">Your party has <strong>0 seats</strong>. You cannot propose a coalition, but you may be invited to one.</div>';else if(y)_='<div class="cf-note">You have already submitted a proposal for this election.</div>';else{const h=q.map(w=>{const C=w.id===s.id,I=w.seats||0,M=w.party_color||"#888";return`<div class="cf-party-check ${C?"checked disabled":""}" data-party-id="${w.id}" style="border-left:3px solid ${M};">
                <div class="cf-check-box">${C?"✓":""}</div>
                <span class="cf-check-name">${ht(w.faction_name)}</span>
                <span class="cf-check-seats">${I} seats</span>
            </div>`}).join("");_=`
            <div class="cf-propose-section">
                <div class="cf-section-title">Propose a Government</div>
                <div class="cf-section-desc">Select which parties will form the coalition. You need ${Q}+ seats for a majority.</div>
                <div class="cf-party-grid" id="cf-party-grid">${h}</div>
                <div class="cf-seat-preview" id="cf-seat-preview">
                    Coalition seats: <span class="cf-preview-val" id="cf-preview-seats">${u}</span> / ${J}
                    (<span id="cf-preview-pct">${J?Math.round(u/J*100):0}</span>%)
                    <span id="cf-preview-threshold" style="margin-left:8px;color:var(--text-dim);">— needs ${Q} seats</span>
                </div>
                <button class="cf-submit-btn" id="cf-propose-btn">Submit Proposal</button>
            </div>`}const $=nt.length>0?`
        <div class="cf-section-title" style="margin-top:16px;">Active Proposals</div>
        <div class="cf-proposals-grid">${nt.map(h=>{const w=q.find(H=>H.id===h.proposed_by),C=h.party_ids||[],I=C.reduce((H,et)=>H+(q.find(gt=>gt.id===et)?.seats||0),0),M=J?Math.round(I/J*100):0,S=I>=Q,R=C.map(H=>{const et=q.find(gt=>gt.id===H);return`<span class="cf-party-chip" style="border-left:2px solid ${et?.party_color||"#888"};">${ht(et?.faction_name||"?")} · ${et?.seats||0}</span>`}).join("");let E="";h.iAmSupporting?E='<span class="cf-status cf-status--supporting">✓ SUPPORTING</span>':h.iAmInvited?E='<span class="cf-status cf-status--invited">INVITED</span>':E='<span class="cf-status cf-status--locked">NOT INVITED</span>';const N=h.iAmInvited&&!h.iAmSupporting?`<button class="cf-support-btn" data-formation-id="${h.id}" data-action="support">Support This Coalition</button>`:h.iAmSupporting?`<button class="cf-withdraw-btn" data-formation-id="${h.id}" data-action="withdraw">Withdraw Support</button>`:"",L=h.supportCount>=h.coalitionSize,T=xt===h.id,O=L&&h.iAmInvited&&!T,z=L&&T;return`<div class="cf-proposal-card ${h.iAmSupporting?"supporting":""} ${h.iAmInvited?"":"not-invited"}">
                <div class="cf-proposal-title">${ht(w?.faction_name||"Unknown")} Coalition ${E}</div>
                <div class="cf-proposal-seats">Seats: <span style="color:${S?"var(--green)":"var(--red)"};">${I}</span> (${M}%) ${S?"✓":"— below threshold"}</div>
                <div class="cf-proposal-chips">${R}</div>
                <div class="cf-proposal-support">Support: ${h.supportCount} / ${h.coalitionSize} coalition members ${L?'<span style="color:var(--green);font-weight:700;"> — UNANIMOUS</span>':""}</div>
                ${N}
                ${O?`<button class="cf-support-btn" data-formation-id="${h.id}" data-action="configure" style="margin-top:6px;background:var(--green);color:#000;border-color:var(--green);">Configure Government &amp; Assign Ministries</button>`:""}
                ${z?Ma(h):""}
            </div>`}).join("")}</div>
    `:"";e.innerHTML=`<div class="cf-page">
        <!-- Formation Banner -->
        <div class="cf-banner cf-banner--${r}">
            <div class="cf-banner-header">
                <span class="cf-banner-icon">${m}</span>
                <div>
                    <div class="cf-banner-title">${v}</div>
                    <div class="cf-banner-subtitle">${p}</div>
                </div>
            </div>
            <div class="cf-countdown">
                <div class="cf-countdown-track"><div class="cf-countdown-fill cf-countdown-fill--${r}" style="width:${l}%;"></div></div>
                <div class="cf-countdown-text">${f>0?f+" tick"+(f!==1?"s":"")+" remaining":"⚡ SNAP ELECTION IMMINENT"}</div>
            </div>
            <div class="cf-penalties">
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--red);">-2%</div>
                    <div class="cf-penalty-label">Approval / Tick</div>
                </div>
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--orange);">${c}</div>
                    <div class="cf-penalty-label">Ticks Elapsed</div>
                </div>
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--red);">-${d}%</div>
                    <div class="cf-penalty-label">Total Lost</div>
                </div>
            </div>
        </div>

        ${_}
        ${$}
    </div>`,pt=[s.id],za(e)}const Ca={prime_minister:"Prime Minister",interior:"Interior",foreign:"Foreign Affairs",defense:"Defense",finance:"Finance",education:"Education",healthcare:"Healthcare",labor:"Labor",justice:"Justice",trade:"Trade",energy:"Energy",transportation:"Transportation",security:"Security"},Ia=["prime_minister","interior","foreign","defense","finance","education","healthcare","labor","justice","trade","energy","transportation"];function Ma(e){const t=(e.party_ids||[]).map(l=>q.find(d=>d.id===l)).filter(Boolean),a=(e.party_ids||[]).includes(P.faction?.id);j={...e.ministry_assignments||{}};const s=P.faction?.id,n=j.prime_minister,o=n===s;let c=`<div style="padding:12px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--accent);margin-bottom:10px;">CONFIGURE GOVERNMENT</div>
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:12px;">All coalition members can assign ministries. The party selected as Prime Minister clicks Form Government.</div>`;for(const l of Ia){const d=Ca[l]||l,r=l==="prime_minister",m=j[l];a&&(c+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="width:140px;font-family:var(--font-mono);font-size:10px;font-weight:${r?"700":"400"};color:${r?"var(--accent)":"var(--text-secondary)"};letter-spacing:0.5px;">${d}</span>
                <select data-ministry="${l}" class="cf-ministry-select" style="flex:1;padding:4px 8px;font-family:var(--font-mono);font-size:10px;color:var(--text-bright);background:var(--bg-body);border:1px solid var(--border-main);outline:none;">
                    <option value="">— Select Party —</option>
                    ${t.map(v=>`<option value="${v.id}" ${m===v.id?"selected":""}>${ht(v.faction_name)} (${v.seats||0} seats)</option>`).join("")}
                </select>
            </div>`)}const f=!!j.prime_minister;if(f&&o)c+=`<div style="margin-top:14px;display:flex;justify-content:flex-end;">
            <button id="cf-form-gov-btn" style="padding:10px 28px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1.5px;color:#000;background:var(--green);border:1px solid var(--green);cursor:pointer;">FORM GOVERNMENT</button>
        </div>`;else if(f&&!o){const l=t.find(d=>d.id===n);c+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(92,204,92,0.04);border:1px solid rgba(92,204,92,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Waiting for <span style="color:var(--green);font-weight:700;">${ht(l?.faction_name||"PM party")}</span> to click Form Government.
        </div>`}else c+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Select a Prime Minister to enable government formation.
        </div>`;return c+="</div>",c}async function Sa(e,t){if(Ft)return;const a=j.prime_minister;if(!a){alert("You must assign a Prime Minister first.");return}console.log("[Coalition] handleFormGovernment called. Assignments:",JSON.stringify(j)),console.log("[Coalition] Formation:",e.id,"PM party:",a),Ft=!0;const i=document.getElementById("cf-form-gov-btn");i&&(i.disabled=!0,i.textContent="FORMING...");try{const s=P.nation,n=s.id,{error:o}=await A.from("government_formations").update({ministry_assignments:j}).eq("id",e.id);if(o)throw new Error("Failed to save assignments: "+o.message);let c=!1;try{const l=Et?Et(null,s):{},{error:d}=await A.rpc("finalize_government_formation",{p_formation_id:e.id,p_caller_faction_id:P.faction.id,p_ministry_baselines:l||{}});if(d)throw d;c=!0}catch(l){console.warn("[Coalition] RPC failed, using fallback:",l.message)}c||await La(e),await A.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",e.id);const{count:f}=await A.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",n).eq("is_active",!0).is("party_id",null);f&&f>=5&&(console.warn(`[Coalition] ${f} vacant ministries — populating from assignments`),await Wt(n)),await ce(A,n,a,ct,{skipCoalitionCheck:!0}),it=!1,alert("Government formed successfully!"),await lt(t)}catch(s){console.error("[Coalition] Form government failed:",s),alert("Failed to form government: "+(s.message||s))}finally{Ft=!1,i&&(i.disabled=!1,i.textContent="FORM GOVERNMENT")}}async function La(e){const t=P.nation.id,{error:a}=await A.from("government_formations").update({status:"cancelled"}).eq("nation_id",t).eq("status","active").neq("id",e.id);a&&console.warn("[Coalition] Failed to cancel rival formations:",a.message);const{error:i}=await A.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",e.id);if(i)throw i;const{error:s}=await A.from("nations").update({failed_formation_attempts:0}).eq("id",t);s&&console.warn("[Coalition] Failed to reset formation attempts:",s.message),await Wt(t);try{const n={id:e.id,party_ids:e.party_ids||[],lead_party_id:j.prime_minister};await Ce(A,t,P.nation,"election",n,q,ct,P.shard?.current_date||"",Number(P.nation?.gov_approval??50))}catch(n){console.warn("[Coalition] Administration rollover failed (non-fatal):",n.message)}}async function Wt(e){const t={prime_minister:"Prime Minister",interior:"Minister of the Interior",foreign:"Minister of Foreign Affairs",defense:"Minister of Defense",finance:"Minister of Finance",education:"Minister of Education",healthcare:"Minister of Health",labor:"Minister of Labor",justice:"Minister of Justice",trade:"Minister of Trade",energy:"Minister of Energy",transportation:"Minister of Transportation",security:"Minister of Security"};let a=0;for(const[i,s]of Object.entries(j)){if(!s)continue;const n=Ut(P.nation?.name)||{},o=n.firstNames||["Alex","Maria","Carlos"],c=n.lastNames||["Garcia","Torres","Silva"],f=o[Math.floor(Math.random()*o.length)],l=c[Math.floor(Math.random()*c.length)],d=35+Math.floor(Math.random()*25),r=Et?Et(i,P.nation):{},m=t[i]||i,{data:v,error:p}=await A.from("ministries").update({party_id:s,minister_first_name:f,minister_last_name:l,minister_age:d,minister_approval:50,stat_baselines:r,is_active:!0}).eq("nation_id",e).eq("ministry_key",i).select("id");if(p)console.error(`[Coalition] FAILED to update ministry ${i}:`,p.message);else if(!v||v.length===0){const{error:g}=await A.from("ministries").insert({nation_id:e,ministry_key:i,ministry_name:m,party_id:s,minister_first_name:f,minister_last_name:l,minister_age:d,minister_approval:50,stat_baselines:r,is_active:!0});g?console.error(`[Coalition] FAILED to insert ministry ${i}:`,g.message):a++}else a++;const u=m;await A.from("cabinet_members").update({party_id:s,person_name:f+" "+l}).eq("nation_id",e).eq("position",u).eq("is_active",!0)}console.log(`[Coalition] Updated ${a} ministries for nation ${e}`)}async function Aa(){if(!ut){nt=[];return}const{data:e}=await A.from("government_formations").select("*").eq("election_id",ut).eq("status","active").order("created_at",{ascending:!0}),t=[];for(const a of e||[]){const{data:i}=await A.from("government_formation_support").select("faction_id, supports").eq("formation_id",a.id),s=a.party_ids||[],o=(i||[]).filter(r=>s.includes(r.faction_id)).filter(r=>r.supports).length,c=s.length,l=(i||[]).find(r=>r.faction_id===P.faction?.id)?.supports===!0,d=s.includes(P.faction?.id);t.push({...a,supportCount:o,coalitionSize:c,iAmSupporting:l,iAmInvited:d})}nt=t}let se=!1;function za(e){se||(se=!0,e.addEventListener("click",async t=>{const a=t.target.closest(".cf-party-check:not(.disabled)");if(a){const s=a.dataset.partyId,n=pt.indexOf(s);n>-1?(pt.splice(n,1),a.classList.remove("checked"),a.querySelector(".cf-check-box").textContent=""):(pt.push(s),a.classList.add("checked"),a.querySelector(".cf-check-box").textContent="✓"),Ta();return}if(t.target.closest("#cf-propose-btn")){await Pa(e);return}const i=t.target.closest(".cf-support-btn, .cf-withdraw-btn");if(i){const s=i.dataset.formationId,n=i.dataset.action;if(n==="configure"){xt=s;const o=nt.find(c=>c.id===s);o&&(j={...o.ministry_assignments||{}}),await lt(e)}else await Na(s,n==="support",e);return}if(t.target.closest("#cf-form-gov-btn")){const s=nt.find(n=>n.id===xt);s&&await Sa(s,e);return}}),e.addEventListener("change",t=>{const a=t.target.closest(".cf-ministry-select");if(!a)return;const i=a.dataset.ministry,s=a.value||null;j[i]=s,xt&&A.from("government_formations").update({ministry_assignments:j}).eq("id",xt).then(({error:o})=>{o&&console.warn("[Coalition] Failed to save assignment:",o.message)});const n=document.getElementById("cf-form-gov-btn");if(n){const o=!!j.prime_minister;n.disabled=!o,n.style.color=o?"#000":"var(--text-dim)",n.style.background=o?"var(--green)":"var(--bg-body)",n.style.borderColor=o?"var(--green)":"var(--border-main)",n.style.cursor=o?"pointer":"not-allowed"}}))}function Ta(){const e=document.getElementById("cf-preview-seats"),t=document.getElementById("cf-preview-pct"),a=document.getElementById("cf-preview-threshold");if(!e)return;const i=pt.reduce((o,c)=>o+(q.find(f=>f.id===c)?.seats||0),0),s=J?Math.round(i/J*100):0,n=i>=Q;e.textContent=i,e.style.color=n?"var(--green)":"var(--text-bright)",t.textContent=s,a.textContent=n?`✓ Meets ${Q}-seat threshold`:`— needs ${Q} seats`,a.style.color=n?"var(--green)":"var(--text-dim)"}async function Pa(e){if(Rt)return;const t=P.faction;if((q.find(o=>o.id===t.id)?.seats||0)===0)return;const i=[...new Set(pt)],s=i.reduce((o,c)=>o+(q.find(f=>f.id===c)?.seats||0),0);if(s<Q){alert(`Coalition needs ${Q} seats. Currently: ${s}.`);return}Rt=!0;const n=document.getElementById("cf-propose-btn");n&&(n.disabled=!0,n.textContent="Submitting...");try{const{data:o}=await A.from("shard").select("current_date").eq("name","Alpha Shard").single(),{data:c,error:f}=await A.from("government_formations").insert({nation_id:P.nation.id,election_id:ut,proposed_by:t.id,party_ids:i,status:"active",game_year:o?.current_date||""}).select().single();if(f){alert("Error: "+f.message);return}const{error:l}=await A.from("government_formation_support").upsert({formation_id:c.id,faction_id:t.id,supports:!0},{onConflict:"formation_id,faction_id"});l&&console.warn("[Coalition] Auto-support insert failed:",l.message),await lt(e)}catch(o){console.error("[Coalition] Create proposal error:",o),alert("Failed to create proposal: "+(o.message||o))}finally{Rt=!1}}async function Na(e,t,a){try{const{error:i}=await A.from("government_formation_support").upsert({formation_id:e,faction_id:P.faction?.id,supports:t},{onConflict:"formation_id,faction_id"});i&&console.error("[Coalition] Toggle support error:",i.message),await lt(a)}catch(i){console.error("[Coalition] Toggle support error:",i)}}let bt=null,at=[],Bt=[],jt=null;function V(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function re(e){return e>=1e6?(e/1e6).toFixed(2)+"M":e>=1e3?Math.round(e/1e3)+"k":String(e)}function Ra(e){return["January","February","March","April","May","June","July","August","September","October","November","December"][e%12]+", "+(2e3+Math.floor(e/12))}function Fa(e,t){if((e.election_type||"parliamentary")==="presidential")return{label:"Presidential Election",color:"#5a8aaa"};const i=t?.end_reason||"";return i.includes("no_confidence")||i.includes("vnc")?{label:"Vote of No Confidence",color:"#d44a4a"}:i.includes("snap")||i.includes("dissolved")||i.includes("early")?{label:"Early Elections Called",color:"#c84"}:{label:"General Election",color:"#8b9a6b"}}async function Oa(e,t){bt=t;const a=document.getElementById("pa-past-elections-root");if(!a)return;a.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">Loading election history...</div>';const i=t.nation?.id;if(!i){a.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No nation data.</div>';return}const[s,n,o]=await Promise.all([e.from("elections").select("id, election_tick, election_type, status, results, created_at").eq("nation_id",i).eq("status","completed").order("election_tick",{ascending:!1}),e.from("administrations").select("*").eq("nation_id",i).order("started_at_tick",{ascending:!1}),e.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",i).eq("faction_type","party").is("abandoned_at",null)]);at=s.data||[],Bt=n.data||[];const c=o.data||[],f={};for(const l of c)f[l.id]=l;for(const l of at){const d=l.results?.votes||[];for(const r of d){const m=f[r.party_id];m?(r.color=m.party_color||"#666",r.abbreviation=m.abbreviation||r.party_name?.slice(0,3)?.toUpperCase()||"?"):(r.color="#666",r.abbreviation=r.party_name?.slice(0,3)?.toUpperCase()||"?")}}Da(a),$e(a)}function Da(e){e.addEventListener("click",t=>{const a=t.target.closest("[data-election-id]");if(a){const i=a.dataset.electionId;jt=jt===i?null:i,$e(e)}})}function $e(e,t){if(at.length===0){e.innerHTML=`<div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);margin-bottom:8px;">PAST ELECTIONS</div>
            <div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No completed elections on record.</div>
        </div>`;return}const a=bt.faction?.id,i=bt.nation?.total_seats||100,s=Math.ceil(i/2)+1,n=at.map((o,c)=>{const f=jt===o.id,l=(o.results?.votes||[]).sort((M,S)=>(S.seats||0)-(M.seats||0)),d=l.slice(0,3),r=o.results?.turnout_pct??0,m=o.results?.total_votes_cast??0,v=Ra(o.election_tick),p=Bt.find(M=>M.started_at_tick>=o.election_tick&&M.started_at_tick<=o.election_tick+5),u=Bt.find(M=>M.ended_at_tick!=null&&M.ended_at_tick>=o.election_tick-2&&M.ended_at_tick<=o.election_tick+2),g=Fa(o,u),y=(bt.nation?.government_type||"").toLowerCase().includes("presidential")||bt.nation?.hos_election_method==="direct_vote",_=y?"President":"PM",$=p?.prime_minister||"Unknown",h=p?.pm_party_id&&l.find(M=>M.party_id===p.pm_party_id)?.color||"#888",C=(c<at.length-1?at[c+1]:null)?.results?.votes||[];let I=`<div data-election-id="${o.id}" style="
            background:var(--bg-panel);border:1px solid var(--border-main);
            ${f?"border-bottom:none;":""}
        ">
            <div style="padding:12px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-secondary);width:130px;">${v}</div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 10px;color:${g.color};background:${g.color}0a;border:1px solid ${g.color}25;">${g.label.toUpperCase()}</span>
                    <div style="display:flex;gap:8px;margin-left:10px;">
                        ${d.map(M=>`<div style="display:flex;align-items:center;gap:4px;">
                            <div style="width:8px;height:8px;background:${M.color};"></div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${V(M.abbreviation)}</span>
                            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--text-bright);">${M.seats}</span>
                        </div>`).join("")}
                    </div>
                </div>
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
                        ${_}: <span style="color:${h};font-weight:700;">${V($)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">${f?"▲":"▼"}</span>
                </div>
            </div>
        </div>`;if(f){const M=l.map(E=>`<div style="width:${E.seats/i*100}%;background:${E.color};height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${E.seats>=8?9:6}px;font-weight:700;color:#000;">${E.seats>=5?E.seats:""}</div>`).join(""),S=l.map(E=>{const N=E.party_id===a,L=C.find(H=>H.party_id===E.party_id),T=L?E.seats-(L.seats||0):null,z=E.seats/i*100-(E.vote_percentage||0);return`<div style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);${N?`background:${E.color}08;`:""}">
                    <div style="width:30px;height:30px;background:${E.color}15;border:1px solid ${E.color}33;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-right:8px;">${E.abbreviation?.slice(0,2)||"?"}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:5px;">
                            <span style="font-size:13px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${V(E.party_name)}</span>
                            ${N?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#5c5;padding:0 3px;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15);">YOU</span>':""}
                        </div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:${E.color};">${V(E.abbreviation)}</div>
                    </div>
                    <span style="width:60px;text-align:right;font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${E.seats}</span>
                    <span style="width:60px;text-align:right;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${T!=null?T>0?"#5c5":T<0?"#c55":"var(--text-dim)":"var(--text-dim)"};">${T!=null?T>0?"▲ "+T:T<0?"▼ "+Math.abs(T):"—":"NEW"}</span>
                    <span style="width:70px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-bright);">${re(E.votes||0)}</span>
                    <span style="width:55px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">${(E.vote_percentage||0).toFixed(1)}%</span>
                    <span style="width:80px;text-align:right;font-family:var(--font-mono);font-size:10px;font-weight:700;color:${Math.abs(z)<2?"var(--text-dim)":z>0?"#5c5":"#c84"};">${z>0?"+":""}${z.toFixed(1)}% <span style="font-size:8px;color:var(--text-dim);">${Math.abs(z)<2?"proportional":z>0?"overrep.":"underrep."}</span></span>
                </div>`}).join("");let R="";if(p){const E=p.coalition_parties||[],N=p.total_seats||E.reduce((U,$t)=>U+($t.seats||0),0),L=N>=s,T=L?"Majority Coalition":"Minority Coalition",O=p.ended_at_tick?p.end_reason||"Ended":"Current Government",z=p.ended_at_tick?"var(--text-dim)":"#5c5",H=p.ended_at_tick?Math.abs(p.ended_at_tick-p.started_at_tick)+" ticks":"Ongoing",et=E.map(U=>{const $t=l.find(At=>At.party_id===U.party_id)?.color||"#666";return`<div style="width:${N>0?(U.seats||0)/N*100:0}%;background:${$t};height:100%;"></div>`}).join(""),gt=E.map(U=>`<div style="display:flex;align-items:center;gap:4px;">
                        <div style="width:8px;height:8px;background:${l.find(At=>At.party_id===U.party_id)?.color||"#666"};"></div>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${V(U.party_name?.slice(0,3)?.toUpperCase()||"?")}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${U.seats||0}</span>
                    </div>`).join("");R=`<div style="margin:0 20px 16px;background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${h};">
                    <div style="padding:12px 16px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text-dim);">GOVERNMENT FORMED</span>
                                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 8px;color:${z};background:${z}0a;border:1px solid ${z}25;">${V(O.toUpperCase())}</span>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Lasted: ${H}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                            <div style="width:36px;height:36px;background:${h}15;border:1.5px solid ${h};display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;font-weight:700;color:${h};">${V($.split(" ").map(U=>U[0]).join(""))}</div>
                            <div>
                                <div style="font-size:14px;font-weight:700;color:var(--text-bright);">${V($)}</div>
                                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${y?"President":"Prime Minister"} &middot; ${V(p.pm_party_name||"")} &middot; ${T}</div>
                            </div>
                        </div>
                        <div style="display:flex;height:8px;gap:1px;margin-bottom:8px;">${et}</div>
                        <div style="display:flex;gap:10px;align-items:center;">
                            ${gt}
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">&middot;</span>
                            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${L?"#5c5":"#c84"};">${N} seats ${L?"(majority +"+(N-s)+")":"(minority, "+(s-N)+" short)"}</span>
                        </div>
                    </div>
                </div>`}I+=`<div style="background:var(--bg-panel);border:1px solid var(--border-main);border-top:1px solid var(--border-main);">
                <!-- Context + Turnout -->
                <div style="display:flex;border-bottom:1px solid var(--border-main);">
                    <div style="flex:1;padding:12px 20px;border-right:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px;">CONTEXT</div>
                        <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${V(g.label)}</div>
                    </div>
                    <div style="width:260px;padding:12px 20px;display:flex;gap:16px;flex-shrink:0;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TURNOUT</div>
                            <div style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:${r>70?"#5c5":r>60?"#ca5":"#c84"};">${r.toFixed(1)}%</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TOTAL VOTES</div>
                            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">${re(m)}</div>
                        </div>
                    </div>
                </div>

                <!-- Seat bar -->
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;height:18px;gap:1px;margin-bottom:6px;">${M}</div>
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
            </div>`}return I}).join("");e.innerHTML=`<div style="padding:12px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);">PAST ELECTIONS</span>
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">${at.length} elections on record</span>
            </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">${n}</div>
    </div>`}let K=null,Gt=!1,le=!1,Ht=!1,de=!1,qt=!1;function we(e){document.querySelectorAll(".pa-subtab").forEach(t=>t.classList.toggle("active",t.dataset.panel===e)),document.querySelectorAll(".pa-panel").forEach(t=>t.classList.toggle("active",t.id==="panel-"+e)),sessionStorage.setItem("party_subtab",e),e==="actions"&&!Gt&&K&&(Gt=!0,ye(dt,K)),e==="parties"&&!le&&K&&(le=!0,fa(dt,K,"pa-parties-root")),e==="election"&&!Ht&&K&&(Ht=!0,qt?lt(document.getElementById("pa-election-root")):_e(dt,K).then(()=>{qt=!0,lt(document.getElementById("pa-election-root"))})),e==="past-elections"&&!de&&K&&(de=!0,Oa(dt,K))}document.getElementById("pa-subtabs").addEventListener("click",e=>{const t=e.target.closest(".pa-subtab");!t||t.classList.contains("active")||we(t.dataset.panel)});ke("politics",async e=>{K=e,_e(dt,e).then(({needed:a})=>{if(qt=!0,a){const i=document.querySelector('.pa-subtab[data-panel="election"]');i&&!i.querySelector(".pa-subtab-badge")&&(i.innerHTML+='<span class="pa-subtab-badge"></span>');const s=document.querySelector('.nav-tab[data-tab="politics"]');s&&!s.querySelector(".pa-subtab-badge")&&(s.innerHTML+='<span class="pa-subtab-badge"></span>')}Ht&&lt(document.getElementById("pa-election-root"))});const t=sessionStorage.getItem("party_subtab");t&&t!=="actions"?we(t):(Gt=!0,await ye(dt,e))});
