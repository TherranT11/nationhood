import{_supabase as gt}from"./supabase-client-qEAQbBjE.js";/* empty css                  */import{r as aa}from"./role-actions-fros7AI4.js";import{l as ia,d as Pe,i as oa}from"./common-CrPqfvZ8.js";import{g as Bt,r as na,m as sa,a as ra}from"./political-actions-DXd15gFm.js";import{af as K,n as pe,h as rt,ac as Et,a2 as me,d as Te,ag as la,a6 as da}from"./government-structure-DjsO9xG_.js";import{GAME_CONFIG as lt,FORMATION_DEADLINE_TICKS as te}from"./config-CKNXR-qR.js";import{f as ca}from"./no-confidence-C3okxeC-.js";import{a as pa,b as Ne}from"./elections-C5SRN34Z.js";import{d as ma,c as fa,s as va,a as Tt}from"./stats-UPtEq9eI.js";import{tickToDate as ua}from"./utils-A98FEun4.js";import"./preload-helper-BXl3LOEh.js";import"./corp-topbar-rMK78I65.js";import"./bills-DOxMu_QI.js";import"./corp-valuation-C0hsb2EQ.js";import"./budget-DEc-4gfb.js";import"./presidential-6hS8pJMI.js";const xt=[{id:"economic_reform",name:"Economic Reform",icon:"📈",tagline:"Growth-first neoliberal agenda",desc:"Prioritize GDP, attract foreign capital, lower corporate taxes. The rising tide theory — grow the pie and worry about slicing it later.",improve:["gdp_growth","foreign_investment","currency_strength","credit","service_output","manufacturing_output"],worsen:["income_inequality","poverty_rate","union_strength","income_tax"],tradeoff:"Income inequality tends to rise. Working class sees GDP numbers go up while their wages don't."},{id:"social_justice",name:"Social Justice",icon:"⚖️",tagline:"Redistribution and equity",desc:"Raise minimum wage, expand welfare, progressive taxation. Close the gap between rich and poor through direct intervention.",improve:["minimum_wage","poverty_rate","income_inequality","social_mobility","healthcare_accessibility","education_accessibility"],worsen:["foreign_investment","gdp_growth","corporate_tax"],tradeoff:"Capital flight risk. Foreign investors avoid high-tax environments. Growth may slow."},{id:"national_security",name:"National Security",icon:"🛡️",tagline:"Borders, military, order",desc:"Strengthen defense, tighten borders, expand police powers. Safety through strength.",improve:["stability","crime_rate","terrorism","political_violence","illegal_immigration"],worsen:["freedom_index","press_freedom","civil_unrest","polarization"],tradeoff:"Freedom index drops. Minority communities disproportionately affected. International criticism."},{id:"anti_corruption",name:"Anti-Corruption",icon:"🔍",tagline:"Clean government, institutional reform",desc:"Independent judiciary, transparent budgets, prosecute the connected. Popular with voters but powerful people fight back hard.",improve:["corruption","judicial_independence","press_freedom","legitimacy","efficiency"],worsen:["stability"],tradeoff:"Short-term chaos as exposing corruption shakes institutions. Your own party's skeletons may surface."},{id:"green_transition",name:"Green Transition",icon:"🌱",tagline:"Climate and environment",desc:"Renewable energy investment, carbon taxes, emissions targets. Save the planet — but the bill comes due now, not later.",improve:["renewable_energy_pct","pollution","carbon_emissions","energy_generation"],worsen:["fuel_prices","manufacturing_output","gdp_growth","cost_of_living"],tradeoff:"Energy costs spike during transition. Rural and industrial voters feel abandoned."},{id:"industrialization",name:"Industrialization",icon:"🏭",tagline:"Factories, exports, production",desc:"Build manufacturing capacity, create blue-collar jobs, develop physical infrastructure. The backbone of a real economy.",improve:["manufacturing_output","labor_force_participation","unemployment","physical_infrastructure","gdp_growth"],worsen:["pollution","carbon_emissions","arable_land","healthcare_quality"],tradeoff:"Environment gets destroyed. Long-term health costs from industrial pollution."},{id:"digital_modernization",name:"Digital Modernization",icon:"💻",tagline:"Tech economy, connectivity",desc:"Fiber everywhere, tech sector incentives, digital government services. Leap into the future — but not everyone makes the jump.",improve:["digital_infrastructure","service_output","higher_education","academic_immigration","efficiency"],worsen:["manufacturing_output","labor_force_participation","income_inequality","urbanization"],tradeoff:"Automation displaces workers. Rural communities left behind. Tech wealth concentrates in cities."},{id:"welfare_state",name:"Welfare State",icon:"🏥",tagline:"Universal services, safety net",desc:"Free healthcare, free education, generous pensions, unemployment insurance. Cradle to grave — funded by steep taxes on everyone.",improve:["healthcare_quality","healthcare_accessibility","education_accessibility","poverty_rate","standard_of_living","happiness"],worsen:["income_tax","corporate_tax","gdp_growth","foreign_investment"],tradeoff:"Massive fiscal cost. Tax burden on middle class, not just the rich. Sustainability questioned."},{id:"populist_nationalism",name:"Populist Nationalism",icon:"🇲",tagline:"The people vs. elites and outsiders",desc:"Restrict immigration, protect domestic industry, reject globalism. Our people first. Our jobs first. Our culture first.",improve:["immigration","illegal_immigration","manufacturing_output","minimum_wage","union_strength"],worsen:["foreign_investment","academic_immigration","freedom_index","press_freedom","polarization","ethnic_diversity"],tradeoff:"International isolation. Brain drain as educated professionals emigrate. Deep social polarization."},{id:"free_market",name:"Free Market Liberalism",icon:"🏛️",tagline:"Deregulate everything",desc:"Cut taxes, cut red tape, let the market decide winners and losers. Government is the problem, not the solution.",improve:["gdp_growth","foreign_investment","credit","service_output","currency_strength"],worsen:["union_strength","minimum_wage","healthcare_accessibility","income_inequality","poverty_rate"],tradeoff:"Growth at the cost of the working class. Social safety net erodes. Boom-bust volatility."},{id:"law_and_order",name:"Law & Order",icon:"⚔️",tagline:"Tough on crime, strong institutions",desc:"More police, harsher sentences, zero tolerance. Restore order to the streets. Criminals fear the state.",improve:["crime_rate","stability","political_violence","terrorism","drug_use"],worsen:["incarceration_rate","freedom_index","civil_unrest"],tradeoff:"Prison population explodes. Minority communities targeted. Policing costs balloon."},{id:"education_first",name:"Education First",icon:"🎓",tagline:"Human capital as the long game",desc:"Fund schools, universities, research institutions, teacher salaries. The 20-year bet that the next generation will be smarter and richer.",improve:["literacy","higher_education","education_accessibility","academic_immigration","social_mobility","labor_force_participation"],worsen:["income_tax","gdp_growth"],tradeoff:"Voters don't see results before next election. Brain drain if jobs don't exist for graduates."},{id:"healthcare_reform",name:"Healthcare Reform",icon:"💊",tagline:"Fix the hospitals",desc:"More beds, more doctors, better drugs, universal coverage. Nobody dies because they can't afford treatment.",improve:["healthcare_quality","healthcare_accessibility","beds_per_100k","lifespan","drug_use"],worsen:["income_tax","gdp_growth","cost_of_living"],tradeoff:"Pharmaceutical lobby fights back. Extremely expensive. Takes multiple cycles to show results."},{id:"housing_cost",name:"Housing & Cost of Living",icon:"🏠",tagline:"The kitchen-table platform",desc:"Rent controls, public housing, affordable food, price caps on essentials. People can't eat GDP growth.",improve:["housing_affordability","cost_of_living","standard_of_living","physical_infrastructure","urbanization"],worsen:["foreign_investment","gdp_growth"],tradeoff:"Property owners and developers become your enemies. Market distortions create shortages."},{id:"energy_independence",name:"Energy Independence",icon:"⛽",tagline:"Control your own power supply",desc:"Exploit domestic oil, gas, and minerals. No more dependency on foreign energy. Cheap fuel, strong economy, sovereign power.",improve:["energy_generation","oil_and_gas","rare_minerals","fuel_prices","manufacturing_output","gdp_growth"],worsen:["pollution","carbon_emissions","renewable_energy_pct","arable_land"],tradeoff:"Climate commitments broken. Green voters abandon you. Environmental debt for future generations."},{id:"open_society",name:"Open Society",icon:"🕊️",tagline:"Liberal democracy, civil liberties",desc:"Free press, open borders, multicultural embrace, strong civil rights. A beacon of freedom — and a target for those who fear it.",improve:["freedom_index","press_freedom","immigration","academic_immigration","ethnic_diversity","happiness","judicial_independence"],worsen:["stability","illegal_immigration","polarization","terrorism"],tradeoff:"Nationalist backlash. Rural-urban divide deepens. Security vulnerabilities from openness."}],ye={gdp_growth:"GDP Growth",inflation:"Inflation",interest_rates:"Interest Rates",currency_strength:"Currency Strength",foreign_investment:"Foreign Investment",credit:"Credit",income_tax:"Income Tax",corporate_tax:"Corporate Tax",sales_tax:"Sales Tax",unemployment:"Unemployment",labor_force_participation:"Labor Force Participation",minimum_wage:"Minimum Wage",union_strength:"Union Strength",poverty_rate:"Poverty Rate",income_inequality:"Income Inequality",healthcare_quality:"Healthcare Quality",healthcare_accessibility:"Healthcare Accessibility",beds_per_100k:"Beds per 100k",lifespan:"Lifespan",drug_use:"Drug Use",literacy:"Literacy",higher_education:"Higher Education",education_accessibility:"Education Accessibility",academic_immigration:"Academic Immigration",physical_infrastructure:"Physical Infrastructure",digital_infrastructure:"Digital Infrastructure",urbanization:"Urbanization",energy_generation:"Energy Generation",renewable_energy_pct:"Renewable Energy %",arable_land:"Arable Land",rare_minerals:"Rare Minerals",oil_and_gas:"Oil & Gas",fuel_prices:"Fuel Prices",pollution:"Pollution",carbon_emissions:"Carbon Emissions",standard_of_living:"Standard of Living",happiness:"Happiness",social_mobility:"Social Mobility",crime_rate:"Crime Rate",incarceration_rate:"Incarceration Rate",religiosity:"Religiosity",stability:"Stability",legitimacy:"Legitimacy",efficiency:"Efficiency",corruption:"Corruption",press_freedom:"Press Freedom",judicial_independence:"Judicial Independence",freedom_index:"Freedom Index",polarization:"Polarization",civil_unrest:"Civil Unrest",terrorism:"Terrorism",political_violence:"Political Violence",immigration:"Immigration",illegal_immigration:"Illegal Immigration",emigration:"Emigration",ethnic_diversity:"Ethnic Diversity",cost_of_living:"Cost of Living",housing_affordability:"Housing Affordability",manufacturing_output:"Manufacturing Output",service_output:"Service Output"},fe=new Set(["inflation","unemployment","poverty_rate","income_inequality","drug_use","pollution","carbon_emissions","crime_rate","incarceration_rate","corruption","polarization","civil_unrest","terrorism","political_violence","illegal_immigration","emigration","cost_of_living","fuel_prices"]),ga=new Set(["income_tax","corporate_tax","sales_tax"]);function be(e,t){const a=fe.has(e),i=ga.has(e);return t==="improve"?a?{arrow:"↓",color:"#5cc55c"}:i?{arrow:"↑",color:"#c84"}:{arrow:"↑",color:"#5cc55c"}:a?{arrow:"↑",color:"#c55"}:i?{arrow:"↓",color:"#5cc55c"}:{arrow:"↓",color:"#c55"}}function xe(e){switch(e){case 0:return{momentum:12,penalty:0,label:"+12",color:"#5cc55c",note:"Unclaimed — full momentum"};case 1:return{momentum:6,penalty:6,label:"+6",color:"#ca5",note:"Contested by 1 rival — reduced momentum"};case 2:return{momentum:4,penalty:4,label:"+4",color:"#c84",note:"Crowded (2 rivals) — minimal momentum"};default:return{momentum:2,penalty:2,label:"+2",color:"#c84",note:`Crowded (${e} rivals) — minimal momentum`}}}function ya(e,t){return e.map(a=>{const i=xt.find(o=>o.id===a.platform_key);if(!i)return{...a,stats:[]};const s=i.improve.map(o=>{const n=a.baseline_stats?.[o],d=a.target_stats?.[o],m=Number(t?.[o]??50),l=fe.has(o);if(n==null||d==null)return{stat:o,baseline:m,target:m,current:m,progress:0,met:!1};const c=Math.abs(d-n),r=l?Math.max(0,n-m):Math.max(0,m-n),p=c>0?Math.min(1,r/c):1,f=l?m<=d:m>=d;return{stat:o,baseline:n,target:d,current:m,progress:p,met:f}});return{...a,stats:s,platformDef:i}})}const ba=["Former union organizer. Knows how to mobilize a crowd.","Disbarred attorney. Understands the legal system from the inside.","Investigative journalist. Uncovered three government scandals before going private.","Ex-military intelligence. Trained in information warfare.","Community activist. Built grassroots networks across two provinces.","Former government auditor. Knows where the money hides.","Political science professor. Publishes on institutional corruption.","NGO director. Ran anti-corruption campaigns across the continent.","Former prosecutor. Left the justice ministry over political interference.","Labor rights campaigner. Organized the dockworkers' strike of 2014.","Freelance political consultant. Has worked for opposition parties in three nations.","Student movement leader. Led the university protests. Young and fearless.","Retired diplomat. Leverages international connections for domestic pressure.","Whistleblower advocate. Runs a secure tip line used by civil servants.","Former police detective. Turned against the system after a cover-up."];function vt(e){return e>=75?{label:"Exceptional",color:"#5cc55c",desc:"Elite operative. Lawsuits are devastating, intelligence is razor-sharp."}:e>=60?{label:"Strong",color:"#a3b07e",desc:"Experienced and reliable. Can handle most opposition tasks effectively."}:e>=45?{label:"Competent",color:"#ca5",desc:"Gets the job done. Occasional missteps under pressure."}:e>=30?{label:"Developing",color:"#c84",desc:"Green but eager. Results are inconsistent. Cheap to hire."}:{label:"Weak",color:"#c55",desc:"Liability risk. May botch sensitive operations. Rock-bottom price for a reason."}}function xa(e){var t=Math.max(0,e-20)/65,a=12e4+t*28e4;return Math.round(a/25e3)*25e3}function jt(e,t){return e+Math.floor(Math.random()*(t-e+1))}function he(e){return e[Math.floor(Math.random()*e.length)]}function ha(e,t){var a=[],i=new Set,s=jt(5,7),o=Bt(t),n=o.firstNames||[],d=o.lastNames||[];if(n.length===0||d.length===0)return[];for(var m=ba.slice().sort(function(){return Math.random()-.5}),l=0;l<s;l++){var c,r,p,f=0;do c=he(n),r=he(d),p=c+" "+r,f++;while(i.has(p)&&f<20);i.add(p);var v=jt(20,85),g=jt(25,60),h=m[l%m.length],x=xa(v);a.push({nation_id:e,first_name:c,last_name:r,age:g,skill:v,background:h,hire_cost:x,status:"available"})}return a.sort(function(y,u){return u.skill-y.skill}),a}async function ze(e,t,a){var{data:i}=await e.from("nations").select("government_type").eq("id",t).maybeSingle();if(K(i)){var{data:s}=await e.from("factions").select("seats").eq("id",a).maybeSingle();return ee({partyId:a,partySeats:s?.seats,admin:null,ministryHolder:!1,nation:i})}var[o,n]=await Promise.all([pe(e,t).catch(function(g){return console.warn("[Agitator] fetchActiveCoalition failed:",g?.message||g),null}),e.from("administrations").select("id, coalition_parties, stats_at_start, started_at_tick, pm_party_id, pm_party_name, president_party_id").eq("nation_id",t).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle()]);if(n.error)return console.error("[Agitator] Failed to check governing status:",n.error.message),{isGoverning:!1,isOpposition:!0,label:"OPPOSITION",administration:null};var d=n.data,m=o,l=rt(i),c=l?"president_party_id":"pm_party_id",r=Array.isArray(m?.party_ids)?m.party_ids.map(function(g){return{party_id:g}}):[];if(d&&m){!d[c]&&m.lead_party_id&&(d[c]=m.lead_party_id);var p=Array.isArray(d.coalition_parties)?d.coalition_parties:[];p.length===0&&r.length>0&&(d.coalition_parties=r)}else!d&&m&&(d={pm_party_id:null,president_party_id:null,coalition_parties:r},d[c]=m.lead_party_id||null);var f=!1;if(l){var{count:v}=await e.from("ministries").select("*",{count:"exact",head:!0}).eq("nation_id",t).eq("party_id",a).eq("is_active",!0);f=(v||0)>0}return ee({partyId:a,partySeats:null,admin:d,ministryHolder:f,nation:i})}function _a(e,t,a,i){return ee({partyId:e?.id,partySeats:e?.seats,admin:t,ministryHolder:a?a.has(e?.id):!1,nation:i})}function ee({partyId:e,partySeats:t,admin:a,ministryHolder:i,nation:s}){if(K(s)){var o=Number(t||0)>=1;return{isGoverning:o,isOpposition:!o,label:o?"LOYAL":"DISSIDENT",administration:null}}if(!a)return{isGoverning:!1,isOpposition:!0,label:"OPPOSITION",administration:null};var n=Array.isArray(a.coalition_parties)?a.coalition_parties:[],d=n.some(function(r){return r?typeof r=="string"?r===e:typeof r=="object"?(r.party_id||r.id)===e:!1:!1}),m=a.pm_party_id===e,l=a.president_party_id===e,c=m||d||l||rt(s)&&!!i;return{isGoverning:c,isOpposition:!c,label:c?"GOVERNING":"OPPOSITION",administration:a}}async function Re(e,t){var{data:a,error:i}=await e.from("faction_agitators").select("*").eq("faction_id",t).eq("status","active").maybeSingle();return i?(console.error("[Agitator] Failed to fetch agitator:",i.message),null):a}async function $a(e,t,a){var{data:i,error:s}=await e.from("agitator_pool").select("*").eq("nation_id",t).eq("status","available").order("skill",{ascending:!1});if(s)return console.error("[Agitator] Failed to fetch pool:",s.message),[];if(i&&i.length>0)return i;var o=ha(t,a),{data:n,error:d}=await e.from("agitator_pool").insert(o).select("*");return d?(console.error("[Agitator] Failed to insert pool:",d.message),[]):(n||[]).sort(function(m,l){return l.skill-m.skill})}async function wa(e,t,a,i){var s=await Re(e,t);if(s)return{success:!1,agitator:null,error:"You already have an active agitator."};var{data:o,error:n}=await e.from("faction_agitators").insert({faction_id:t,first_name:a.first_name,last_name:a.last_name,age:a.age,skill:a.skill,background:a.background,status:"active",hired_at_tick:i}).select("*").single();if(n)return console.error("[Agitator] Failed to hire:",n.message),{success:!1,agitator:null,error:n.message};var{error:d}=await e.from("agitator_pool").update({status:"hired",hired_by_faction_id:t}).eq("id",a.id);return d&&console.error("[Agitator] Failed to mark pool candidate as hired:",d.message),{success:!0,agitator:o,error:null}}const Nt=[{key:"finance",label:"Finance",icon:"💰"},{key:"defense",label:"Defense",icon:"🛡️"},{key:"education",label:"Education",icon:"🎓"},{key:"healthcare",label:"Health",icon:"🏥"},{key:"interior",label:"Interior",icon:"🏛️"},{key:"foreign",label:"Foreign",icon:"🌐"},{key:"justice",label:"Justice",icon:"⚖️"},{key:"labor",label:"Labor",icon:"🔨"},{key:"trade",label:"Trade",icon:"📦"},{key:"energy",label:"Energy",icon:"⚡"},{key:"transportation",label:"Transport",icon:"🚂"},{key:"agriculture",label:"Agriculture",icon:"🌾"}],Fe=[{key:"misuse_of_funds",label:"Misuse of Public Funds",desc:"Alleging budget went somewhere it shouldn't."},{key:"civil_rights",label:"Violation of Civil Rights",desc:"Alleging government overreach or suppression."},{key:"negligence",label:"Breach of Duty / Negligence",desc:"Alleging a ministry failed its mandate."},{key:"corruption",label:"Corruption / Self-Dealing",desc:"Alleging officials enriched themselves."}];function ve(e){return e<=5?{tier:1,label:"Clean Government",color:"#c55"}:e<=10?{tier:2,label:"Minor Corruption",color:"#ca5"}:e<=20?{tier:3,label:"Significant Corruption",color:"#c84"}:{tier:4,label:"Systemic Corruption",color:"#5cc55c"}}const nt={1:{resolution:"FRIVOLOUS SUIT",filer:{momentum:-5,governance:-2},gov:{momentum:3,governance:1}},2:{resolution:"PARTIAL WIN",filer:{momentum:3,governance:0},gov:{momentum:-2,governance:-2}},3:{resolution:"MAJOR WIN",filer:{momentum:7,governance:2},gov:{momentum:-5,governance:-5}},4:{resolution:"DEVASTATING WIN",filer:{momentum:12,governance:5},gov:{momentum:-10,governance:-8}}},_e={1:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"Lawsuit discovery phase produces routine documents. No irregularities found in {ministry}.",evidence:"Legal team reviews {ministry} records. Auditors confirm standard procedures.",pre_trial:"Judge signals skepticism toward {party}'s claims. Case appears thin.",resolution:"{ministry} lawsuit dismissed. Courts find no evidence of wrongdoing. {party} criticized for wasting court resources."},2:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit uncovers irregular procurement contracts in {ministry}.",evidence:"Documents reveal {ministry} awarded no-bid contracts to connected firms.",pre_trial:"Judge allows case to proceed. {ministry} officials ordered to testify.",resolution:"{ministry} lawsuit concludes with partial ruling. Irregular contracts confirmed but no criminal charges filed."},3:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit exposes hidden accounts linked to {ministry} officials.",evidence:"Leaked documents show systematic overbilling in {ministry}. Millions unaccounted for.",pre_trial:"Multiple {ministry} officials refuse to testify. Judge threatens contempt.",resolution:"{ministry} scandal confirmed. Court finds evidence of systematic corruption. {party} vindicated."},4:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit reveals {ministry} ran parallel budget invisible to parliament.",evidence:"Court-ordered audit exposes network of shell companies receiving {ministry} funds.",pre_trial:"Prosecutors request criminal referral. Multiple {ministry} officials implicated.",resolution:"Devastating verdict: {ministry} operated criminal enterprise. Officials face prosecution. Government in crisis."}};function $t(e,t){var a=e;for(var i in t)a=a.split("{"+i+"}").join(t[i]);return a}async function ka(e,t){var{factionId:a,nationId:i,agitatorId:s,targetMinistry:o,basis:n,currentTick:d,partyName:m,administration:l}=t,c,r,p;if(n==="civil_rights"){var f=Number(l?.stats_at_start?.freedom_index??50),{data:v,error:g}=await e.from("nations").select("freedom_index").eq("id",i).single();if(g)return{success:!1,lawsuit:null,tier:0,error:"Failed to fetch freedom index data."};r=Number(v?.freedom_index??50),c=f,p=Math.max(0,c-r)}else{var h=Number(l?.stats_at_start?.corruption??50),{data:v,error:g}=await e.from("nations").select("corruption").eq("id",i).single();if(g)return{success:!1,lawsuit:null,tier:0,error:"Failed to fetch corruption data."};r=Number(v?.corruption??50),c=h,p=Math.max(0,r-c)}var h=c,x=r,y=ve(p),u=nt[y.tier],w=d+8,L=Nt.find(function(R){return R.key===o}),E=L?"Ministry of "+L.label:o,I=Fe.find(function(R){return R.key===n}),k=I?I.label:n,{data:M,error:z}=await e.from("lawsuits").insert({faction_id:a,nation_id:i,agitator_id:s,target_ministry:o,basis:n,filed_at_tick:d,resolves_at_tick:w,corruption_at_start:h,corruption_at_filing:x,corruption_growth:p,tier:y.tier,status:"active",resolution:null,momentum_effect:u.filer.momentum,governance_effect:u.filer.governance,gov_momentum_effect:u.gov.momentum,gov_governance_effect:u.gov.governance}).select("*").single();if(z)return{success:!1,lawsuit:null,tier:0,error:z.message};var C=_e[y.tier]||_e[1],A={party:m||"Opposition",ministry:E,basis:k},S=[{event_tick:d,event_type:"filing",headline:$t(C.filing,A)},{event_tick:d+2,event_type:"discovery",headline:$t(C.discovery,A)},{event_tick:d+5,event_type:"evidence",headline:$t(C.evidence,A)},{event_tick:d+7,event_type:"pre_trial",headline:$t(C.pre_trial,A)},{event_tick:w,event_type:"resolution",headline:$t(C.resolution,A)}],T=S.map(function(R){return{lawsuit_id:M.id,nation_id:i,event_tick:R.event_tick,event_type:R.event_type,headline:R.headline,is_fired:R.event_tick===d}}),{error:N}=await e.from("lawsuit_events").insert(T);N&&console.error("[Lawsuits] Failed to insert milestone events:",N.message);var{error:P}=await e.from("event_log").insert({nation_id:i,event_name:"LAWSUIT FILED",event_type:"lawsuit",category:"political",description_chosen:S[0].headline,fired_at_tick:d,faction_id:a||null,effects_applied:{lawsuit_id:M.id,tier:y.tier,target_ministry:E,basis:k,milestone:"filing"}});return P&&console.warn("[Lawsuits] event_log insert (filing) failed:",P.message),{success:!0,lawsuit:M,tier:y.tier,error:null}}async function Ea(e,t){var{data:a,error:i}=await e.from("lawsuits").select("*").eq("faction_id",t).order("filed_at_tick",{ascending:!1}).limit(10);return i?(console.error("[Lawsuits] Failed to fetch lawsuits:",i.message),[]):a||[]}let $=null,b=null,X="leader",et=[],zt=[],j=null,D=null,pt=!1,F=null,ae=[],bt=!1,G=null,at=!1,kt=[],Mt=!1,qt=!1,At=new Set;function _(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function Q(e,t){return((e||"?")[0]+(t||"?")[0]).toUpperCase()}const Oe=[{id:"leader",title:"LEADER",fullTitle:"Party Leader",color:"#c8a832"},{id:"deputy",title:"DEPUTY",fullTitle:"Deputy Party Leader",color:"#8b9a6b"},{id:"chief",title:"CHIEF OF STAFF",fullTitle:"Chief of Staff",color:"#5cc55c"},{id:"campaign",title:"CAMPAIGN MGR",fullTitle:"Campaign Manager",color:"#c84"},{id:"comms",title:"COMMS DIR",fullTitle:"Communications Director",color:"#5a8aaa"},{id:"agitator",title:"AGITATOR",fullTitle:"Opposition Coordinator",color:"#d44a4a",oppositionOnly:!0}],Ht=[{perSeat:5e3,momDivisor:10},{perSeat:4e3,momDivisor:8},{perSeat:3e3,momDivisor:6},{perSeat:2e3,momDivisor:5},{perSeat:1e3,momDivisor:5}];let mt=0,Rt=0,ie=!1;async function Ca(){if(!$||!b?.faction?.id||!b?.shard?.current_tick)return;const{count:e,error:t}=await $.from("campaign_actions").select("id",{count:"exact",head:!0}).eq("party_id",b.faction.id).eq("action_type","fundraise").eq("tick_performed",b.shard.current_tick);mt=!t&&e!=null?e:0}async function Ia(){if(Rt=0,ie=!1,!$||!b?.nation?.id||!b?.shard?.current_tick)return;const e=b.shard.current_tick,t=F?.pm_party_id;try{const{data:a}=await $.from("bills").select("id").eq("nation_id",b.nation.id).eq("bill_type","no_confidence").in("status",["committee","floor"]).limit(1);if(ie=!!(a&&a.length),t){const{data:i}=await $.from("campaign_actions").select("tick_performed").eq("nation_id",b.nation.id).eq("action_type","no_confidence_filed").eq("target_id",t).order("tick_performed",{ascending:!1}).limit(1).maybeSingle();if(i){const s=e-Number(i.tick_performed||0),o=typeof lt<"u"&&lt.NO_CONFIDENCE_COOLDOWN_TICKS||12;Rt=Math.max(0,o-s)}}}catch(a){console.warn("[PartyActions] loadNoConfidenceState failed:",a?.message||a)}}function Be(e,t){const a=Ht[Math.min(t,Ht.length-1)],i=e*a.perSeat,s=Math.max(1,Math.floor(e/a.momDivisor));return{raised:i,momCost:s,perSeat:a.perSeat,tierIdx:Math.min(t,Ht.length-1)}}const De=[{id:"fundraise",name:"Fundraise",desc:"Raise party funds proportional to your seat count. Each use yields less money and costs more momentum. Momentum cannot drop below 1.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"statement",name:"Issue Statement",desc:"Public declaration on an issue. Shifts party positioning and voter bloc reactions. Media covers it. Other parties may respond.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"platform",name:"Set Party Platform",desc:"Choose a political focus. Defines which stats you promise to change. Awards momentum based on how many rivals share the same platform.",cost:"$120k",costColor:"#c8a832",moneyCost:12e4,tags:["STRATEGIC"],locked:!1},{id:"call_early_elections",name:"Call Early Elections",desc:"Dissolve the legislature and call snap elections. PM-only. Government enters caretaker status; election fires after a short formation window. Momentum impact is tiered by Gov. Approval: >50 boosts PM party (+3), <35 boosts opposition (+5 each) and +3 stability, 35–50 is neutral.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["LEGISLATIVE","PM ONLY"],locked:!1},{id:"resign_as_pm",name:"Resign as Prime Minister",desc:"Step down from the Prime Minister seat. PM-only. Coalition enters caretaker status and has a 3-tick window to nominate a successor via the cabinet panel. If a new PM is installed the administration continues under new leadership; otherwise a snap election fires. Cost: −3 Momentum, −0.05 Credibility, −3 Stability, 12-tick bar from PM on your party.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["GOVERNMENT","PM ONLY"],locked:!1},{id:"no_confidence",name:"Vote of No Confidence",desc:"File a motion of no confidence against the Prime Minister. If a simple majority votes YES, the government falls and snap elections are triggered. PASS: +15 Momentum to you, -10 Momentum + -10 Governance to the PM’s party. FAIL: -10 Momentum to you. 12-tick cooldown on the targeted PM party.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["LEGISLATIVE","OPPOSITION"],locked:!1},{id:"leave_coalition",name:"Leave Coalition",desc:"Walk out of the current governing coalition. Any ministries your party holds are vacated. You drop from governing to opposition. Coalition flips to minority if your exit drops it below the majority threshold. Cost: −3 Momentum to you, −5 Momentum to the PM’s party. 12-tick cooldown. PM’s party cannot use this — resign first.",cost:"−3 MOM",costColor:"#c84",moneyCost:0,tags:["GOVERNMENT","RISKY"],locked:!1},{id:"disband_party",name:"Disband Party",desc:"Voluntarily dissolve your party. Your seats are vacated and sit empty until the next election (no backfill or redistribution). All party funds and momentum are lost. You are removed from every nation chat. Cannot be undone. 24-tick cooldown per user. Cannot be used while Prime Minister, sitting President, or reigning Monarch — step down first.",cost:"IRREVERSIBLE",costColor:"#c55",moneyCost:0,tags:["IRREVERSIBLE"],locked:!1}],Ma=[{id:"fundraise",name:"Fundraise",desc:"Raise royal treasury funds proportional to your seat count. Each use yields less money and costs more momentum.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"grant_seats",name:"Grant Seats",desc:"Grant parliamentary seats to a noble house. Sharing power increases legitimacy (+0.5 per seat). Hoarding >70% of seats causes tyranny decay.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1},{id:"revoke_seats",name:"Revoke Seats",desc:"Revoke seats from a noble house. Costs $100k and -1 Legitimacy per seat revoked. Use sparingly — the people do not forget.",cost:"$100k/seat",costColor:"#d44a4a",moneyCost:1e5,tags:["ROYAL","OFFENSIVE"],locked:!1},{id:"statement",name:"Royal Decree",desc:"Issue a public declaration on an issue. Shifts positioning and voter bloc reactions. Media covers it.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"appoint_pm",name:"Appoint Prime Minister",desc:"Choose a party to lead the government as Prime Minister. The PM can then assign cabinet ministries. You may appoint your own party.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1}],Dt={PUBLIC:"#8b9a6b",NARRATIVE:"#5a8aaa",STRATEGIC:"#c8a832",INTERNAL:"#c84",COALITION:"#5aaa8a",RISKY:"#c55",PARLIAMENTARY:"#8b9a6b",FINANCIAL:"#5a8aaa",INTELLIGENCE:"#5a8aaa",DEFENSIVE:"#5cc55c",CAMPAIGN:"#c84",VOTER:"#c8a832",OFFENSIVE:"#c84",REACTIVE:"#ca5",STRUCTURAL:"#9e9a92",ROYAL:"#c8a832",LEGAL:"#5a8aaa"},$e=[{id:"economy",label:"Economy & Jobs",icon:"💰"},{id:"healthcare",label:"Healthcare",icon:"🏥"},{id:"education",label:"Education",icon:"🎓"},{id:"security",label:"National Security",icon:"🛡️"},{id:"environment",label:"Environment",icon:"🌱"},{id:"corruption",label:"Anti-Corruption",icon:"🔍"},{id:"infrastructure",label:"Infrastructure",icon:"🏗️"},{id:"immigration",label:"Immigration",icon:"🌐"},{id:"housing",label:"Housing & Cost of Living",icon:"🏠"},{id:"crime",label:"Crime & Justice",icon:"⚖️"},{id:"labor",label:"Labor & Workers",icon:"🔨"},{id:"foreign_policy",label:"Foreign Policy",icon:"🕊️"}],we=["{party_name} Calls for Action on {topic}","{leader_name}: '{topic}' Must Be National Priority","{leader_name} Pledges Bold Agenda on {topic}","{party_name} Leader Addresses Nation on {topic}"];async function Ge(e,t){$=e,b=t;const a=document.getElementById("pa-actions-root");if(!a)return;const i=t.faction;if(!i){a.innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:300px;color:var(--text-dim);">No faction data.</div>';return}try{const{data:r}=await $.from("factions").select("momentum, party_funds, seats, action_points, bloc_id").eq("id",i.id).single();r&&(i.momentum=r.momentum??i.momentum,i.party_funds=r.party_funds??i.party_funds,i.seats=r.seats??i.seats,i.action_points=r.action_points??i.action_points,i.bloc_id=r.bloc_id??null)}catch(r){console.warn("[PartyActions] faction refresh failed, using cached state:",r)}const[s,o,n,d,m,l]=await Promise.all([$.from("faction_platforms").select("*").eq("faction_id",i.id).order("slot"),$.from("faction_platforms").select("*").eq("nation_id",t.nation?.id),Re($,i.id),ze($,t.nation?.id,i.id),$.from("faction_electoral_standing").select("ideological_alignment, visibility, raw_appeal").eq("faction_id",i.id).eq("nation_id",t.nation?.id).maybeSingle(),pe($,t.nation?.id)]);t.nation&&(t.nation.__coalition_status=l?.status||null),s.error&&console.error("[PartyActions] Failed to load faction platforms:",s.error.message),o.error&&console.error("[PartyActions] Failed to load nation platforms:",o.error.message),et=s.data||[],zt=o.data||[],j=n,pt=d.isOpposition,F=d.administration,m.data,await Ca(),await Ia();const{data:c}=await $.from("faction_deputies").select("*").eq("faction_id",i.id).eq("status","active").maybeSingle();D=c||null,j&&(ae=await Ea($,i.id)),await Ct(i.id,t.nation?.id),H(a)}function je(e){return e?{isPM:!!F&&F.pm_party_id===e.id,isPresident:b?.nation?.hos_election_method==="elected"&&F?.president_party_id===e.id,isMonarchActing:K(b?.nation)&&b?.nation?.monarch_faction_id===e.id}:{isPM:!1,isPresident:!1,isMonarchActing:!1}}async function Ct(e,t){if(!e||!t){G=null,at=!1,kt=[];return}try{const{data:a,error:i}=await $.from("bloc_invitations").select("id, bloc_id, invited_by_faction_id, created_at_tick, status, bloc:bloc_id(id,name,leader_faction_id), inviter:invited_by_faction_id(id,faction_name,party_color)").eq("invited_faction_id",e).eq("status","pending").order("created_at_tick",{ascending:!1});if(i)throw i;kt=a||[];const s=b?.faction?.bloc_id||null;if(s){const{data:o,error:n}=await $.from("blocs").select("*").eq("id",s).is("dissolved_at_tick",null).maybeSingle();if(n)throw n;if(o){const{data:d}=await $.from("factions").select("id, faction_name, seats, party_color, leader_first_name, leader_last_name").eq("bloc_id",o.id).order("seats",{ascending:!1});G={...o,members:d||[]},at=o.leader_faction_id===e}else G=null,at=!1}else G=null,at=!1}catch(a){console.warn("[PartyActions] loadBlocState failed:",a?.message||a)}}function qe(e){if(!G)return"";const t=at?`<span style="margin-left:6px;font-family:var(--font-mono);font-size:7px;color:${e};letter-spacing:0.08em;">LEADER</span>`:"";return`<span class="pa-bloc-tag" style="display:inline-flex;align-items:center;padding:2px 8px;background:${e}18;border:1px solid ${e}55;color:${e};font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
        BLOC &middot; ${_(G.name)}${t}
    </span>`}function He(e){if(!G)return"";const t=G.members||[],a=t.reduce((s,o)=>s+(Number(o.seats)||0),0),i=t.map(s=>{const o=s.id===G.leader_faction_id,n=s.party_color||e;return`<span style="display:inline-flex;align-items:center;gap:6px;padding:3px 8px;border:1px solid ${n}44;border-left:3px solid ${n};background:var(--bg-card);font-family:var(--font-mono);font-size:9px;">
            <span style="color:var(--text-bright);font-weight:700;">${_(s.faction_name||"Unknown")}</span>
            <span style="color:var(--text-dim);">${s.seats||0} seats</span>
            ${o?`<span style="color:${n};font-weight:700;letter-spacing:0.08em;">LEADER</span>`:""}
        </span>`}).join("");return`<div style="margin:8px 0;padding:8px 12px;background:${e}0a;border:1px solid ${e}33;border-left:3px solid ${e};">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${e};letter-spacing:0.08em;">BLOC &middot; ${_(G.name)}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${t.length} member${t.length!==1?"s":""} &middot; ${a} combined seats</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${i}</div>
    </div>`}function Ue(e){if(!kt||kt.length===0)return"";const t=i=>(Array.isArray(i)?i[0]:i)||null;return`<div style="margin:10px 0 4px;">${kt.map(i=>{const s=t(i.bloc),o=t(i.inviter),n=s?.name||"a bloc",d=o?.faction_name||"A party leader",m=o?.party_color||e,l=At.has(i.id);return`<div style="margin:6px 0;padding:8px 12px;border:1px solid ${m}55;border-left:3px solid ${m};background:${m}08;display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <div style="flex:1;">
                <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${m};letter-spacing:0.08em;">BLOC INVITATION</div>
                <div style="font-size:11px;color:var(--text-bright);margin-top:2px;">
                    <strong>${_(d)}</strong> invites you to join <strong>${_(n)}</strong>.
                </div>
            </div>
            <div style="display:flex;gap:6px;">
                <button class="pa-bloc-invite-btn pa-modal-btn pa-modal-btn--submit" data-invite-id="${_(i.id)}" data-decision="accept"${l?" disabled":""}>Accept</button>
                <button class="pa-bloc-invite-btn pa-modal-btn pa-modal-btn--cancel" data-invite-id="${_(i.id)}" data-decision="decline"${l?" disabled":""}>Decline</button>
            </div>
        </div>`}).join("")}</div>`}async function ue(e){const{data:t}=await $.from("factions").select("bloc_id, momentum").eq("id",e).single();t&&(b.faction.bloc_id=t.bloc_id||null,t.momentum!=null&&(b.faction.momentum=t.momentum))}async function Sa(e,t,a){try{const i=b?.faction?.id;if(!i)throw new Error("No active faction");const s=t==="accept"?"accept_bloc_invite":"decline_bloc_invite",o=t==="accept"?"p_accepting_faction_id":"p_declining_faction_id",{data:n,error:d}=await $.rpc(s,{p_invitation_id:e,[o]:i});if(d)throw d;if(n&&n.success===!1)throw new Error(n.error||"Unknown error");await ue(i),await Ct(i,b.nation?.id),H(a)}catch(i){console.error("[PartyActions] respondToBlocInvite failed:",i),alert(t==="accept"?`Could not accept invitation: ${i.message||i}`:`Could not decline invitation: ${i.message||i}`)}}async function La(e){if(!G||qt)return;const t=G,a=at?`Leaving ${t.name} will DISSOLVE the entire bloc. All ${t.members?.length||0} members will be removed and pending invitations rescinded.

Proceed?`:`Leave the ${t.name} bloc?`;if(confirm(a)){qt=!0;try{const{data:i,error:s}=await $.rpc("leave_bloc",{p_faction_id:b.faction.id});if(s)throw s;if(i&&i.success===!1)throw new Error(i.error||"Unknown error");await ue(b.faction.id),await Ct(b.faction.id,b.nation?.id),H(e)}catch(i){console.error("[PartyActions] leave_bloc failed:",i),alert(`Could not leave bloc: ${i.message||i}`)}finally{qt=!1}}}function Aa(e){if(!e)return[];const t=Te.map(a=>{const i=Number(e[a.key]||0);return{label:i<0?a.leftLabel:a.rightLabel,magnitude:Math.abs(i)}});return t.sort((a,i)=>i.magnitude-a.magnitude),t.slice(0,2).filter(a=>a.magnitude>0)}async function Pa(e){const t=document.getElementById("pa-bloc-modal");if(!t||G)return;const a=b.faction,i=a?.color||"#c8a832";t.innerHTML=`
        <div class="pa-modal" style="width:640px;max-height:85vh;overflow:hidden;display:flex;flex-direction:column;">
            <div class="pa-modal-header">
                <div class="pa-modal-header-left">
                    <div class="pa-modal-dot" style="background:${i};"></div>
                    <span class="pa-modal-title">Create Bloc</span>
                </div>
                <button class="pa-modal-close" id="pa-bloc-close">&times;</button>
            </div>
            <div class="pa-modal-body" style="gap:14px;overflow-y:auto;">
                <div>
                    <div class="pa-modal-step-label">1 &mdash; Bloc Name</div>
                    <input class="pa-modal-input" id="pa-bloc-name" type="text" maxlength="40" placeholder="e.g. Popular Front, United Left, Patriots' Union" style="font-family:var(--font-ui);font-size:12px;">
                    <div style="display:flex;justify-content:space-between;margin-top:3px;">
                        <span id="pa-bloc-name-count" style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">0 / 40</span>
                        <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">Required &middot; up to 40 characters</span>
                    </div>
                </div>
                <div>
                    <div class="pa-modal-step-label">2 &mdash; Invite Parties</div>
                    <div id="pa-bloc-party-list" style="display:flex;flex-direction:column;gap:4px;">
                        <div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Loading parties...</div>
                    </div>
                </div>
                <div style="padding:6px 10px;background:var(--amber-faint);border:1px solid var(--amber-border);">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);margin-bottom:2px;">COST</div>
                    <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">
                        Founding a bloc costs <strong style="color:var(--accent);">$100k</strong>. You become the bloc leader and the listed parties receive invitations they can accept or decline. Any party in your nation that isn't already in a bloc can be invited.
                    </div>
                </div>
            </div>
            <div class="pa-modal-footer">
                <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-bloc-cancel">Cancel</button>
                <button class="pa-modal-btn pa-modal-btn--submit" id="pa-bloc-submit" disabled>Create Bloc &amp; Send Invites</button>
            </div>
        </div>
    `,t.classList.add("active");const s=new Set;let o=[];const n=()=>t.classList.remove("active");document.getElementById("pa-bloc-close")?.addEventListener("click",n),document.getElementById("pa-bloc-cancel")?.addEventListener("click",n),t.addEventListener("click",r=>{r.target===t&&n()});try{const r=b.nation?.id,{data:p}=await $.from("factions").select("id, faction_name, seats, party_color, leader_first_name, leader_last_name, leader_age, bloc_id").eq("nation_id",r).eq("faction_type","party").is("abandoned_at",null),f=(p||[]).filter(y=>y.id!==a.id),v=f.map(y=>y.id),{data:g}=v.length>0?await $.from("faction_ideology").select("*").in("faction_id",v):{data:[]},h=new Map((g||[]).map(y=>[y.faction_id,y]));o=f;const x=document.getElementById("pa-bloc-party-list");if(!x)return;if(f.length===0){x.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">No other parties in this nation.</div>';return}x.innerHTML=f.map(y=>{const u=h.get(y.id),w=Aa(u),L=w.length>0?w.map(M=>`<span style="padding:1px 6px;background:var(--bg-card);border:1px solid var(--border-mid);font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);">${_(M.label)}</span>`).join(" "):'<span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);font-style:italic;">No ideology data</span>',E=y.party_color||"#7a7a7a",I=y.leader_first_name&&y.leader_last_name?`${y.leader_first_name} ${y.leader_last_name}`:"Party Leader",k=y.bloc_id?"Already in a bloc":null;return`<label class="pa-bloc-party-row" data-party-id="${_(y.id)}" data-ineligible="${k?"1":"0"}"
                style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--border-mid);border-left:3px solid ${E};cursor:${k?"not-allowed":"pointer"};opacity:${k?"0.45":"1"};">
                <input type="checkbox" class="pa-bloc-party-check" ${k?"disabled":""} style="margin:0;">
                <div style="flex:1;display:flex;flex-direction:column;gap:2px;">
                    <div style="display:flex;align-items:baseline;gap:8px;">
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${_(y.faction_name)}</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${y.seats||0} seats</span>
                    </div>
                    <div style="font-size:9px;color:var(--text-secondary);">${_(I)}</div>
                    <div style="display:flex;gap:4px;align-items:center;margin-top:2px;">${L}</div>
                    ${k?`<div style="font-family:var(--font-mono);font-size:8px;color:var(--orange);margin-top:3px;">${k}</div>`:""}
                </div>
            </label>`}).join(""),x.addEventListener("change",y=>{const u=y.target.closest(".pa-bloc-party-row");if(!u)return;if(u.dataset.ineligible==="1"){y.target.checked=!1;return}const w=u.dataset.partyId;y.target.checked?s.add(w):s.delete(w),c()})}catch(r){console.error("[PartyActions] Create Bloc modal fetch failed:",r);const p=document.getElementById("pa-bloc-party-list");p&&(p.innerHTML=`<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Failed to load parties: ${_(r.message||String(r))}</div>`)}const d=document.getElementById("pa-bloc-name"),m=document.getElementById("pa-bloc-submit"),l=document.getElementById("pa-bloc-name-count"),c=()=>{const r=(d?.value||"").trim();l&&(l.textContent=`${r.length} / 40`),m&&(m.disabled=!(r.length>0&&s.size>0)||Mt)};d?.addEventListener("input",c),m?.addEventListener("click",async()=>{if(Mt)return;const r=(d?.value||"").trim();if(!(r.length===0||s.size===0)){Mt=!0,m.disabled=!0,m.textContent="Creating...";try{const{data:p,error:f}=await $.rpc("create_bloc",{p_leader_faction_id:a.id,p_name:r,p_invitee_faction_ids:Array.from(s)});if(f)throw f;if(p&&p.success===!1)throw new Error(p.error||"Unknown error");b.faction.party_funds=Math.max(0,(b.faction.party_funds||0)-1e5),await ue(a.id),n(),await Ct(a.id,b.nation?.id),H(e)}catch(p){console.error("[PartyActions] create_bloc failed:",p),alert(`Could not create bloc: ${p.message||p}`),m.disabled=!1,m.textContent="Create Bloc & Send Invites"}finally{Mt=!1}}})}async function Ta(e){if(!G||!at)return;const t=document.getElementById("pa-bloc-modal");if(!t)return;const a=b.faction?.color||"#c8a832";t.innerHTML=`
        <div class="pa-modal" style="width:520px;max-height:75vh;overflow:hidden;display:flex;flex-direction:column;">
            <div class="pa-modal-header">
                <div class="pa-modal-header-left">
                    <div class="pa-modal-dot" style="background:${a};"></div>
                    <span class="pa-modal-title">Invite to ${_(G.name)}</span>
                </div>
                <button class="pa-modal-close" id="pa-blinv-close">&times;</button>
            </div>
            <div class="pa-modal-body" style="gap:10px;overflow-y:auto;">
                <div style="font-size:10px;color:var(--text-dim);line-height:1.5;">
                    Pick a party to invite. Parties already in a bloc, currently in government, or pending an invitation are filtered out.
                </div>
                <div id="pa-blinv-list" style="display:flex;flex-direction:column;gap:4px;">
                    <div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Loading parties…</div>
                </div>
            </div>
            <div class="pa-modal-footer">
                <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-blinv-cancel">Close</button>
            </div>
        </div>`,t.classList.add("active");const i=()=>t.classList.remove("active");document.getElementById("pa-blinv-close")?.addEventListener("click",i),document.getElementById("pa-blinv-cancel")?.addEventListener("click",i),t.addEventListener("click",n=>{n.target===t&&i()});const s=b.nation?.id,o=document.getElementById("pa-blinv-list");if(!(!o||!s))try{const{data:n,error:d}=await $.from("factions").select("id, faction_name, seats, party_color, bloc_id").eq("nation_id",s).eq("faction_type","party").is("abandoned_at",null).is("bloc_id",null);if(d){o.innerHTML=`<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Failed to load parties: ${_(d.message)}</div>`;return}const m=(n||[]).filter(l=>l.id!==b.faction.id);if(m.length===0){o.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">No eligible parties to invite.</div>';return}o.innerHTML=m.map(l=>{const c=l.party_color||"#888";return`<div class="pa-blinv-row" data-faction-id="${_(l.id)}" style="padding:8px 10px;border:1px solid ${c}33;border-left:3px solid ${c};display:flex;justify-content:space-between;align-items:center;cursor:pointer;background:var(--bg-card);">
                <div>
                    <div style="font-size:11px;color:var(--text-bright);font-weight:600;">${_(l.faction_name||"Unknown")}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${l.seats||0} seats</div>
                </div>
                <button class="pa-modal-btn pa-modal-btn--submit pa-blinv-send" data-faction-id="${_(l.id)}">Invite</button>
            </div>`}).join(""),o.addEventListener("click",async l=>{const c=l.target.closest(".pa-blinv-send");if(!c)return;const r=c.dataset.factionId;if(r){c.disabled=!0,c.textContent="Sending…";try{const{error:p}=await $.rpc("invite_to_bloc",{p_bloc_id:G.id,p_invitee_faction_id:r});if(p)throw p;c.textContent="Invited",await Ct(b.faction.id,b.nation?.id),H(e)}catch(p){console.warn("[PartyActions] invite_to_bloc failed:",p),alert(`Could not invite: ${p.message||p}`),c.disabled=!1,c.textContent="Invite"}}})}catch(n){console.warn("[PartyActions] openInviteToBlocModal threw:",n),o.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Unexpected error.</div>'}}function H(e){const t=b.faction,a=b.nation,i=K(a),s=i&&a?.monarch_faction_id===t?.id,o=t.color||"#c8a832",n=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown Leader",d=t.seats||0,m=a?.total_seats||120,l=m>0?Math.round(d/m*100):0;t.action_points,t.approval_rating;const c=t.momentum??50,r=t.party_funds??0,p=ya(et,a),f=[];for(let x=1;x<=3;x++){const y=et.find(u=>u.slot===x);if(y){const u=xt.find(I=>I.id===y.platform_key),w=p.find(I=>I.id===y.id),L=w?w.stats.filter(I=>I.met).length:0,E=w?w.stats.length:0;f.push({name:u?.name||y.platform_key,status:y.status,metCount:L,totalCount:E,slot:x})}else f.push(null)}const v=f.map(x=>{if(!x)return{label:"No Platform"};const y=x.status==="fulfilled"?" ✓":x.status==="failed"?" ✗":x.status==="abated"?" —":"",u=x.status==="fulfilled"?"fulfilled":x.status==="failed"?"failed":x.status==="abated"?"abated":"filled",w=x.totalCount>0?` (${x.metCount}/${x.totalCount})`:"";return{label:x.name+w+y,statusClass:u,title:`${x.metCount} of ${x.totalCount} stats on target`}}),g="$"+(r>=1e6?(r/1e6).toFixed(1)+"M":r>=1e3?Math.round(r/1e3)+"k":r),h=Math.round(Number(i?b.nation?.legitimacy??b.nation?.gov_approval??50:b.nation?.gov_approval??0));aa(e,{title:s?"Royal Court":"Party Actions",entityName:t.faction_name,entityColor:o,stats:[{label:"Party Funds",value:g,color:"var(--accent)"},{label:"Momentum",value:Number(c).toFixed(1),color:c>0?"var(--text-bright)":"var(--red)"},{label:i?"Legitimacy":"Nat. Approval",value:String(h),color:"var(--green)"}],statusBarItems:[{type:"count",label:"Seats",big:String(d),bigColor:o,dim1:`/ ${m}`,dim2:`(${l}%)`},{type:"list",label:"Platforms",items:v}],rolesContainerId:"pa-leaders",panelContainerId:"pa-actions-panel",extraHtml:`
            <div class="pa-modal-overlay" id="pa-statement-modal"></div>
            <div class="pa-modal-overlay" id="pa-platform-modal"></div>
            <div class="pa-modal-overlay" id="pa-hire-modal"></div>
            <div class="pa-modal-overlay" id="pa-lawsuit-modal"></div>
            <div class="pa-modal-overlay" id="pa-appoint-pm-modal"></div>
            <div class="pa-modal-overlay" id="pa-modernize-modal"></div>
            <div class="pa-modal-overlay" id="pa-rebrand-modal"></div>
            <div class="pa-modal-overlay" id="pa-deputy-modal"></div>
            <div class="pa-modal-overlay" id="pa-rally-modal"></div>
            <div class="pa-modal-overlay" id="pa-royal-modal"></div>
            <div class="pa-modal-overlay" id="pa-bloc-modal"></div>
        `}),document.getElementById("pa-leaders").innerHTML=Na(n,o,t),document.getElementById("pa-actions-panel").innerHTML=za(n,o,t),document.getElementById("pa-leaders")?.addEventListener("click",x=>{const y=x.target.closest(".pa-leader-card");if(!y||y.classList.contains("vacant"))return;const u=y.dataset.role;u&&u!==X&&(X=u,H(e))}),document.getElementById("pa-actions-panel")?.addEventListener("click",x=>{const y=x.target.closest(".pa-action-item");if(!y||y.classList.contains("locked"))return;const u=y.dataset.actionId;u==="fundraise"?ii(e):u==="grant_seats"?Ja(e):u==="revoke_seats"?Xa(e):u==="rally"?Da(e):u==="statement"?oi(e):u==="platform"?ni(e):u==="file_lawsuit"?Ka(e):u==="appoint_pm"?Wa(e):u==="modernize"?ja(e):u==="rebrand"?qa(e):u==="no_confidence"?ai():u==="call_early_elections"?Qa():u==="resign_as_pm"?ti():u==="leave_coalition"?Za():u==="disband_party"?ei():u==="create_bloc"?Pa(e):u==="leave_bloc"?La(e):u==="invite_to_bloc"&&Ta(e)}),document.getElementById("pa-actions-panel")?.addEventListener("click",async x=>{const y=x.target.closest(".pa-bloc-invite-btn");if(!y)return;const u=y.dataset.inviteId,w=y.dataset.decision;if(!(!u||!w)&&!At.has(u)){At.add(u);try{await Sa(u,w,e)}finally{At.delete(u)}}}),document.getElementById("pa-hire-agitator-btn")?.addEventListener("click",()=>Ie(e)),document.getElementById("pa-hire-agitator-panel")?.addEventListener("click",x=>{x.target.closest("#pa-hire-agitator-btn")||Ie(e)}),document.getElementById("pa-hire-deputy-btn")?.addEventListener("click",()=>Ee(e)),document.getElementById("pa-hire-deputy-panel")?.addEventListener("click",x=>{x.target.closest("#pa-hire-deputy-btn")||Ee(e)})}function Na(e,t,a){const i=K(b.nation)&&b.nation?.monarch_faction_id===a?.id;return Oe.map(s=>{const o=s.id==="leader",n=s.id==="agitator",d=X===s.id;let m,l,c,r,p;if(o){m=!1,l=e,c=Q(a.leader_first_name,a.leader_last_name),r=De.length;const g=K(b.nation);if(g&&b.nation?.monarch_faction_id===a.id)p={text:(b.nation?.monarch_title||"KING").toUpperCase(),color:"#c8a832"};else if(g)p={text:"NOBLE HOUSE",color:"#8b9a6b"};else{const x=F?.pm_party_id===a.id,y=b.nation?.hos_election_method==="elected"&&F?.president_party_id===a.id;x?p={text:"PRIME MINISTER",color:"#5cc55c"}:y?p={text:"PRESIDENT",color:"#5cc55c"}:pt?p={text:"OPPOSITION",color:"#c84"}:p={text:"GOVERNING",color:"#8b9a6b"}}}else n&&j?(m=!1,l=`${j.first_name} ${j.last_name}`,c=Q(j.first_name,j.last_name),r=1):n&&!j?(m=!1,l="Not Hired",c="+",r=0):s.id==="deputy"&&D?(m=!1,l=`${D.first_name} ${D.last_name}`,c=Q(D.first_name,D.last_name),r=1):s.id==="deputy"&&!D?(m=!1,l="Not Hired",c="+",r=0):s.id==="campaign"?(m=!1,l="Campaign Mgr",c="CM",r=Ye.length):(m=!0,l="Vacant",c="—",r=0);const f=s.oppositionOnly&&!pt;return`
            <div class="pa-leader-card ${d?"active":""} ${m?"vacant":""} ${f?"vacant":""}"
                 data-role="${s.id}"
                 style="${d?`border-left-color:${s.color};`:""}${f?"opacity:0.35;":""}">
                ${s.oppositionOnly?`<div style="position:absolute;top:0;right:0;font-family:var(--font-mono);font-size:5px;font-weight:700;letter-spacing:0.04em;padding:1px 4px;color:${f?"var(--text-dim)":"#d44a4a"};background:${f?"rgba(100,100,100,0.1)":"rgba(212,74,74,0.1)"};border:1px solid ${f?"rgba(100,100,100,0.2)":"rgba(212,74,74,0.2)"};border-top:none;border-right:none;">${f?"IN GOVERNMENT":"OPPOSITION ONLY"}</div>`:""}
                <div class="pa-leader-top">
                    <div class="pa-leader-avatar" style="color:${s.color};background:${s.color}15;border-color:${s.color}33;">${c}</div>
                    <div class="pa-leader-info">
                        <div class="pa-leader-role">
                            <span class="pa-leader-role-label" style="color:${s.color};">${o&&i?(b.nation?.monarch_title||"King").toUpperCase():s.title}</span>
                            ${r>0?`<span class="pa-leader-role-count">${r} actions</span>`:""}
                        </div>
                        <div class="pa-leader-name">${_(l)}</div>
                        ${p?`<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:${p.color};margin-top:2px;">${p.text}</div>`:""}
                        ${n&&j?`<div style="display:flex;align-items:center;gap:3px;margin-top:2px;"><div style="flex:1;height:2px;background:var(--border-mid);"><div style="height:100%;width:${j.skill}%;background:${vt(j.skill).color};"></div></div><span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);width:16px;text-align:right;">${j.skill}</span></div>`:""}
                        ${n&&!j?'<div style="font-family:var(--font-mono);font-size:7px;color:#d44a4a;margin-top:2px;">Click to recruit</div>':""}
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
    `}function za(e,t,a){const i=K(b.nation),s=i&&b.nation?.monarch_faction_id===a?.id,o=Oe.find(u=>u.id===X);if(!o)return"";const n=X==="leader",d=X==="agitator",m=X==="campaign",l=X==="deputy";if(!n&&!d&&!m&&!l)return`
            <div class="pa-vacant-msg">
                <div>
                    <div class="pa-vacant-title">${_(o.fullTitle)} — Vacant</div>
                    <div class="pa-vacant-sub">This position has not been filled. Recruitment coming in a future update.</div>
                </div>
            </div>
        `;if(d&&!pt)return`
            <div class="pa-vacant-msg" style="opacity:0.4;">
                <div style="text-align:center;">
                    <div style="font-size:2rem;margin-bottom:12px;opacity:0.3;">🚫</div>
                    <div class="pa-vacant-title">Agitator Unavailable</div>
                    <div class="pa-vacant-sub" style="max-width:400px;margin:8px auto;">
                        Your party is in government. The Agitator role is only available to opposition parties.
                    </div>
                </div>
            </div>
        `;if(d&&!j)return`
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
        `;if(d&&j)return Ya(o);if(l&&!D)return`
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
        `;if(l&&D)return Oa(o);if(m)return Ga(o,a);const r=Q(a.leader_first_name,a.leader_last_name),p=a.leader_age?`, Age ${a.leader_age}`:"",f=a.seats||0,v=a.momentum??0,y=(K(b.nation)&&b.nation?.monarch_faction_id===a.id?Ma:De).map(u=>{const w=u.tags.map(M=>`<span class="pa-action-tag" style="color:${Dt[M]||"var(--text-dim)"};">${M}</span>`).join("");let L="",E=u.cost,I=u.costColor,k=u.locked;if(u.id==="no_confidence")if(!!F&&F.pm_party_id===a.id)k=!0,u.lockReason="Your party is the Prime Minister — file from another party.";else if(ie)k=!0,u.lockReason="A motion of no confidence is already pending in Parliament.";else if(Rt>0){k=!0;const z=Rt;u.lockReason=`Cooldown: ${z} tick${z!==1?"s":""} remaining before another motion can be filed against this PM party.`}else!F||!F.pm_party_id?(k=!0,u.lockReason="No active Prime Minister to file against."):u.lockReason="";else if(u.id==="call_early_elections"||u.id==="resign_as_pm"){const M=b.nation,z=Et(M),C=!!F&&F.pm_party_id===a.id;z?C?b.nation&&b.nation.__coalition_status==="caretaker"?(k=!0,u.lockReason="Government is already in caretaker mode."):u.lockReason="":(k=!0,u.lockReason="Prime Minister’s party only."):(k=!0,u.lockReason="Only parliamentary and semi-presidential systems have a PM seat.")}else if(u.id==="leave_coalition"){const M=b.nation,z=Et(M),C=!!F&&F.pm_party_id===a.id;z?pt?(k=!0,u.lockReason="You are in opposition."):C?(k=!0,u.lockReason="Prime Minister’s party cannot leave — resign first."):u.lockReason="":(k=!0,u.lockReason="Only available in parliamentary systems.")}else if(u.id==="disband_party"){const M=je(a);M.isPM?(k=!0,u.lockReason="You are Prime Minister — resign before disbanding."):M.isPresident?(k=!0,u.lockReason="You are the sitting President — step down before disbanding."):M.isMonarchActing?(k=!0,u.lockReason="The reigning monarch cannot disband the royal house."):u.lockReason=""}else if(u.id==="fundraise"){const M=Be(f,mt);E=`-${M.momCost} MOM`,I="#c84",L=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);display:flex;gap:12px;">
                <span>Raises: <span style="color:var(--accent);font-weight:700;">$${(M.raised/1e3).toFixed(0)}k</span></span>
                <span>$${(M.perSeat/1e3).toFixed(0)}k/seat × ${f}</span>
                ${mt>0?`<span style="color:var(--orange);">Use #${mt+1}</span>`:""}
            </div>`,v-M.momCost<1&&(k=!0,L+=`<div style="margin-top:3px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Not enough momentum (need ${M.momCost}, have ${Number(v).toFixed(1)})</div>`)}return`
            <div class="pa-action-item ${k?"locked":""}" data-action-id="${u.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${_(u.name)}</span>
                        <div class="pa-action-tags">${w}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${I};">${E}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${_(u.desc)}</div>
                ${L}
                ${u.locked&&u.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${_(u.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${o.color};background:${o.color}15;border-color:${o.color}33;">${r}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${o.color};">${s?(b.nation?.monarch_title||"KING").toUpperCase():o.title}</span>
                        <span class="pa-detail-name">${_(e)}</span>
                        ${i&&b.nation?.dynasty_name?`<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);font-style:italic;">House ${_(b.nation.dynasty_name)}</span>`:""}
                        ${qe(t)}
                    </div>
                    <div class="pa-detail-meta">${s?_((b.nation?.monarch_title||"King")+" of "+(b.nation?.name||"")):_(o.fullTitle)+" &middot; "+_(a.faction_name)}${p}${(()=>{if(s)return' <span style="color:#c8a832;font-weight:700;"> &middot; '+(b.nation?.monarch_title||"MONARCH").toUpperCase()+"</span>";if(i)return' <span style="color:#8b9a6b;font-weight:700;"> &middot; NOBLE HOUSE</span>';const u=F?.pm_party_id===a.id,w=b.nation?.hos_election_method==="elected"&&F?.president_party_id===a.id;return u?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRIME MINISTER</span>':w?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRESIDENT</span>':pt?' <span style="color:#c84;font-weight:700;"> &middot; OPPOSITION</span>':' <span style="color:#8b9a6b;font-weight:700;"> &middot; GOVERNING</span>'})()}</div>
                </div>
            </div>
        </div>
        ${Ue(t)}
        ${He(t)}
        <div class="pa-actions-list">
            ${y}
        </div>
        <div class="pa-skill-footer">
            <span style="color:${o.color};font-weight:700;">${o.title}</span> actions are executed by the party leader. Effectiveness depends on party approval and momentum.
        </div>
    `}const Ra=[{id:"rally",name:"Hold a Rally",desc:"Invest party funds into a public rally. Higher investment improves your odds, but a bad roll can backfire. Roll 1d6 + rally bonus for momentum.",cost:"$50k-$200k",costColor:"#8b9a6b",tags:["CAMPAIGN","RISKY"],locked:!1},{id:"create_bloc",name:"Create Bloc",desc:"Found a pre-coalition alliance with other parties. Pick a name and invite any parties in your nation that aren't already in a bloc. Phase 1 is formation only — shared momentum, vote discipline, and coalition binding arrive in later phases.",cost:"$100k",costColor:"#c8a832",moneyCost:1e5,tags:["STRATEGIC","ALLIANCE"],locked:!1},{id:"leave_bloc",name:"Leave Bloc",desc:"Exit your current bloc. If you are the bloc leader, leaving dissolves the whole bloc and all pending invitations are withdrawn. Greyed out when you are not in a bloc.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["ALLIANCE"],locked:!1},{id:"invite_to_bloc",name:"Invite Party to Bloc",desc:"Send a bloc invitation to an additional party. Leader-only. Eligible parties are in your nation, not already in a bloc, and not currently in government.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["ALLIANCE"],locked:!1}],ke=[{cost:5e4,bonus:1,label:"$50k (+1)"},{cost:8e4,bonus:2,label:"$80k (+2)"},{cost:12e4,bonus:3,label:"$120k (+3)"},{cost:15e4,bonus:4,label:"$150k (+4)"},{cost:2e5,bonus:5,label:"$200k (+5)"}];function Fa(e,t){const a=e+t;return a>=8?{momentum:3,label:"Rousing Success",color:"#5cc55c"}:a>=5?{momentum:2,label:"Solid Turnout",color:"#8b9a6b"}:a>=3?{momentum:0,label:"Flat Response",color:"#ca5"}:{momentum:-2,label:"Backfire",color:"#c55"}}function Oa(e){const t=b.faction,a=t?.color||e.color,i=Ra.map(o=>{const n=o.tags.map(l=>`<span class="pa-action-tag" style="color:${Dt[l]||"var(--text-dim)"};">${l}</span>`).join("");let d=o.locked,m="";if(o.id==="create_bloc"){const l=je(t);G?(d=!0,m=`Already in the ${G.name} bloc.`):l.isPM||l.isPresident||l.isMonarchActing?(d=!0,m="Head of Government cannot form blocs — you already lead the coalition."):(t.party_funds||0)<1e5&&(d=!0,m="Needs $100k party funds.")}else o.id==="leave_bloc"?G?at&&(m=`Leaving dissolves ${G.name} — all members will be removed.`):(d=!0,m="You are not in a bloc."):o.id==="invite_to_bloc"&&(G?at||(d=!0,m="Only the bloc leader can send invitations."):(d=!0,m="You are not in a bloc."));return`
            <div class="pa-action-item ${d?"locked":""}" data-action-id="${o.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${_(o.name)}</span>
                        <div class="pa-action-tags">${n}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${o.costColor};">${o.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${_(o.desc)}</div>
                ${m?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${_(m)}</span></div>`:""}
            </div>
        `}).join(""),s=vt(D.skill);return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${e.color};background:${e.color}15;border-color:${e.color}33;">${Q(D.first_name,D.last_name)}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${e.color};">${e.title}</span>
                        <span class="pa-detail-name">${_(D.first_name)} ${_(D.last_name)}</span>
                        ${qe(a)}
                    </div>
                    <div class="pa-detail-meta">${_(e.fullTitle)} &middot; Age ${D.age} &middot; Skill: <span style="color:${s.color};font-weight:700;">${D.skill}</span></div>
                </div>
            </div>
        </div>
        ${Ue(a)}
        ${He(a)}
        <div class="pa-actions-list" id="pa-actions-panel">${i}</div>
    `}function Ba(e){const t=Bt(e),a=t.firstNames||[],i=t.lastNames||[];if(a.length===0||i.length===0)return[];const s=5+Math.floor(Math.random()*3),o=new Set,n=[];for(let d=0;d<s;d++){let m,l,c,r=0;do m=a[Math.floor(Math.random()*a.length)],l=i[Math.floor(Math.random()*i.length)],c=m+" "+l,r++;while(o.has(c)&&r<20);o.add(c);const p=20+Math.floor(Math.random()*66),f=28+Math.floor(Math.random()*30),v=Math.max(0,p-20)/65,g=Math.round((125e3+v*525e3)/25e3)*25e3;n.push({first_name:m,last_name:l,age:f,skill:p,hire_cost:g})}return n.sort((d,m)=>m.skill-d.skill)}async function Ee(e){const t=document.getElementById("pa-deputy-modal");if(!t)return;const a=b.nation?.name,i=Ba(a);let s=null;function o(){const n=s!=null?i[s]:null,d=n?vt(n.skill):null,m=i.map((r,p)=>{const f=s===p,v=vt(r.skill);return`<div class="pa-hire-row ${f?"selected":""}" data-idx="${p}">
                <div style="width:32px;height:32px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#8b9a6b;flex-shrink:0;">${Q(r.first_name,r.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${f?"var(--text-bright)":"var(--text-secondary)"};">${_(r.first_name)} ${_(r.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${r.skill}%;background:${v.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${v.color};">${r.skill}</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Age ${r.age}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);">$${Math.round(r.hire_cost/1e3)}k</div>
                </div>
            </div>`}).join("");let l;n?l=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#8b9a6b;">${Q(n.first_name,n.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${_(n.first_name)} ${_(n.last_name)}</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:1px;">Age ${n.age} &middot; Deputy Leader Candidate</div>
                        </div>
                    </div>
                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">SKILL</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${n.skill}%;background:${d.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${d.color};">${n.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${d.color};margin-top:3px;font-weight:700;">${d.label}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-dep-hire-confirm" style="background:#8b9a6b;"${(b.faction?.party_funds||0)<n.hire_cost?' disabled title="Not enough funds"':""}>Hire ${_(n.first_name)}</button>
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
                    <div style="width:240px;border-right:1px solid var(--border-main);overflow-y:auto;" id="pa-dep-list">${m}</div>
                    <div style="flex:1;overflow-y:auto;">${l}</div>
                </div>
            </div>
        `;const c=()=>t.classList.remove("active");document.getElementById("pa-dep-close")?.addEventListener("click",c),t.onclick=r=>{r.target===t&&c()},document.getElementById("pa-dep-list")?.addEventListener("click",r=>{const p=r.target.closest(".pa-hire-row");p&&(s=parseInt(p.dataset.idx,10),o())}),document.getElementById("pa-dep-hire-confirm")?.addEventListener("click",async()=>{if(s==null)return;const r=i[s],p=b.faction?.party_funds||0;if(p<r.hire_cost){alert("Not enough funds.");return}const f=document.getElementById("pa-dep-hire-confirm");f&&(f.disabled=!0,f.textContent="Hiring...");try{const v=p-r.hire_cost,g=b.shard?.current_tick||0,{data:h,error:x}=await $.from("faction_deputies").insert({faction_id:b.faction.id,first_name:r.first_name,last_name:r.last_name,age:r.age,skill:r.skill,status:"active",hired_at_tick:g}).select("*").single();if(x){alert("Failed: "+x.message);return}await $.from("factions").update({party_funds:v}).eq("id",b.faction.id),b.faction.party_funds=v,D=h,X="deputy",c(),H(e)}catch(v){console.error("[Deputy] Hire error:",v)}finally{f&&(f.disabled=!1)}})}t.classList.add("active"),o()}function Da(e){const t=document.getElementById("pa-rally-modal");if(!t||!D)return;const i=b.faction.party_funds||0;let s=null,o=null;function n(){const d=ke.map((c,r)=>{const p=i>=c.cost,f=s===r;return`<div class="pa-action-item ${f?"selected":""} ${p?"":"locked"}" data-tier="${r}" style="cursor:${p?"pointer":"not-allowed"};${f?"border-color:#8b9a6b;background:rgba(139,154,107,0.06);":""}">
                <div class="pa-action-top">
                    <span style="font-size:13px;font-weight:700;color:${f?"#8b9a6b":"var(--text-bright)"};">$${Math.round(c.cost/1e3)}k Investment</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#8b9a6b;">+${c.bonus} Rally Bonus</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">Roll 1d6 + ${c.bonus} = range ${1+c.bonus} to ${6+c.bonus}</div>
            </div>`}).join("");let m="";o&&(m=`
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
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#8b9a6b;">${_(D.first_name)} ${_(D.last_name)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">&middot; Skill ${D.skill}</span>
                </div>
                <div class="pa-modal-body" style="gap:6px;">
                    <div class="pa-modal-step-label">Choose Investment Level</div>
                    <div id="rally-tiers">${d}</div>

                    <div style="margin-top:8px;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);font-family:var(--font-mono);font-size:9px;color:var(--text-dim);line-height:1.6;">
                        <strong>Outcome table:</strong> Roll 1d6 + bonus<br>
                        8-11 = <span style="color:#5cc55c;">+3 Momentum</span> &middot;
                        5-7 = <span style="color:#8b9a6b;">+2 Momentum</span> &middot;
                        3-4 = <span style="color:#ca5;">+0 Momentum</span> &middot;
                        1-2 = <span style="color:#c55;">-2 Momentum</span>
                    </div>

                    ${m}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="rally-cancel">${o?"Close":"Cancel"}</button>
                    ${o?"":`<button class="pa-modal-btn pa-modal-btn--submit" id="rally-submit" style="background:#8b9a6b;" ${s==null?"disabled":""}>Hold Rally</button>`}
                </div>
            </div>
        `;const l=()=>{t.classList.remove("active"),o&&H(e)};document.getElementById("rally-close")?.addEventListener("click",l),document.getElementById("rally-cancel")?.addEventListener("click",l),t.onclick=c=>{c.target===t&&l()},document.getElementById("rally-tiers")?.addEventListener("click",c=>{const r=c.target.closest("[data-tier]");!r||r.classList.contains("locked")||(s=parseInt(r.dataset.tier,10),n())}),document.getElementById("rally-submit")?.addEventListener("click",async()=>{if(s==null||o)return;const c=ke[s],{data:r}=await $.from("factions").select("party_funds, momentum").eq("id",b.faction.id).single(),p=r?.party_funds||0;if(p<c.cost){alert("Not enough funds.");return}b.faction.party_funds=p,b.faction.momentum=r?.momentum??b.faction.momentum;const f=document.getElementById("rally-submit");f&&(f.disabled=!0,f.textContent="Rolling...");try{const v=1+Math.floor(Math.random()*6),g=Fa(v,c.bonus),h=p-c.cost,x=Math.max(1,(b.faction.momentum||0)+g.momentum);await $.from("factions").update({party_funds:h,momentum:x}).eq("id",b.faction.id);const y=b.shard?.current_tick||0;await $.from("campaign_actions").insert({party_id:b.faction.id,nation_id:b.nation?.id,action_type:"rally",ap_cost:0,money_cost:c.cost,tick_performed:y,result:{dieRoll:v,bonus:c.bonus,total:v+c.bonus,momentum:g.momentum,momentumDelta:g.momentum,label:g.label,outcomeName:g.label}}),b.faction.party_funds=h,b.faction.momentum=x,sessionStorage.removeItem("nationhood_state"),o={...g,dieRoll:v,bonus:c.bonus,total:v+c.bonus},n()}catch(v){console.error("[Rally] Error:",v),alert("Rally failed.")}})}t.classList.add("active"),n()}const Ye=[{id:"modernize",name:"Modernize Image",desc:"Upload a custom logo to refresh your party's brand. Grants +1 Momentum/tick while a custom logo is active. Quick and affordable.",cost:"$50k",costColor:"#5a8aaa",moneyCost:5e4,tags:["CAMPAIGN","BRANDING"],locked:!1},{id:"rebrand",name:"Rebrand Party",desc:'Change your party name, abbreviation, color, logo, and description. Costly but grants a "Fresh Start" modifier. Nuclear option after scandal or major defeat.',cost:"$150k",costColor:"#c84",moneyCost:15e4,tags:["CAMPAIGN","STRUCTURAL"],locked:!1}],Ce=[{id:"crimson",hex:"#c43a3a",name:"Crimson"},{id:"scarlet",hex:"#d45a2a",name:"Scarlet"},{id:"amber",hex:"#c8a832",name:"Amber"},{id:"gold",hex:"#d4a017",name:"Gold"},{id:"olive",hex:"#8a9a4a",name:"Olive"},{id:"emerald",hex:"#2a8a4a",name:"Emerald"},{id:"forest",hex:"#3a6a3a",name:"Forest"},{id:"teal_c",hex:"#2a8a7a",name:"Teal"},{id:"sky",hex:"#4a8aba",name:"Sky"},{id:"cobalt",hex:"#3a5a9a",name:"Cobalt"},{id:"navy",hex:"#2a3a6a",name:"Navy"},{id:"violet",hex:"#7a4a9a",name:"Violet"},{id:"plum",hex:"#8a3a7a",name:"Plum"},{id:"rose",hex:"#ba4a6a",name:"Rose"},{id:"slate",hex:"#5a6a7a",name:"Slate"},{id:"iron",hex:"#4a4a4a",name:"Iron"}],oe=[{emoji:"🏛️",name:"Parliament"},{emoji:"⚖️",name:"Scales"},{emoji:"🗽",name:"Liberty"},{emoji:"🕊️",name:"Dove"},{emoji:"🦅",name:"Eagle"},{emoji:"🦁",name:"Lion"},{emoji:"🐻",name:"Bear"},{emoji:"🐉",name:"Dragon"},{emoji:"🐘",name:"Elephant"},{emoji:"🏔️",name:"Mountain"},{emoji:"🌊",name:"Wave"},{emoji:"🔥",name:"Flame"},{emoji:"⭐",name:"Star"},{emoji:"🌟",name:"Glow Star"},{emoji:"💎",name:"Diamond"},{emoji:"🛡️",name:"Shield"},{emoji:"⚔️",name:"Swords"},{emoji:"🏗️",name:"Builder"},{emoji:"🌿",name:"Leaf"},{emoji:"🌾",name:"Wheat"},{emoji:"🔨",name:"Hammer"},{emoji:"⚡",name:"Lightning"},{emoji:"🎯",name:"Target"},{emoji:"🏴",name:"Flag"},{emoji:"🚩",name:"Red Flag"},{emoji:"✊",name:"Fist"},{emoji:"🤝",name:"Handshake"},{emoji:"📜",name:"Scroll"},{emoji:"🗳️",name:"Ballot"},{emoji:"👑",name:"Crown"}];function Ga(e,t){const a=Ye.map(i=>{const s=i.tags.map(o=>`<span class="pa-action-tag" style="color:${Dt[o]||"var(--text-dim)"};">${o}</span>`).join("");return`
            <div class="pa-action-item ${i.locked?"locked":""}" data-action-id="${i.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${_(i.name)}</span>
                        <div class="pa-action-tags">${s}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${i.costColor};">${i.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${_(i.desc)}</div>
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${e.color};background:${e.color}15;border-color:${e.color}33;">CM</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${e.color};">${e.title}</span>
                    </div>
                    <div class="pa-detail-meta">${_(e.fullTitle)} &middot; ${_(t.faction_name)}</div>
                </div>
            </div>
        </div>
        <div class="pa-actions-list" id="pa-actions-panel">${a}</div>
        <div style="padding:8px 14px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);line-height:1.6;">
            <strong style="color:var(--text-secondary);">CAMPAIGN MANAGER</strong> actions shape your party's public identity and electoral strategy.
        </div>
    `}function ja(e){const t=document.getElementById("pa-modernize-modal");if(!t)return;const a=b.faction;let i=null,s=a.custom_logo_url||null,o=!1;function n(){const d=!!s,l=Number(a.party_funds??0)>=5e4,c=!!i&&l&&!o;t.innerHTML=`
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
                    <div style="width:80px;height:80px;border:2px dashed ${d?"var(--accent)":"var(--border-mid)"};border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:var(--bg-card);">
                        ${s?`<img src="${_(s)}" style="width:100%;height:100%;object-fit:cover;">`:'<span style="font-size:24px;color:var(--text-dim);">+</span>'}
                    </div>
                    <div style="text-align:center;">
                        <label style="display:inline-block;padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright);background:var(--bg-card);border:1px solid var(--border-mid);cursor:pointer;letter-spacing:0.06em;">
                            ${d?"CHANGE LOGO":"UPLOAD LOGO"}
                            <input type="file" accept="image/*" id="mod-file-input" style="display:none;">
                        </label>
                        ${a.custom_logo_url&&!i?'<div style="font-family:var(--font-mono);font-size:8px;color:var(--green);margin-top:6px;">Current logo active — +1 Momentum/tick</div>':""}
                        ${i?'<div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);margin-top:6px;">New logo ready to upload</div>':""}
                    </div>
                    ${l?"":'<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">Insufficient funds. Need $50k.</div>'}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="mod-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="mod-submit" ${c?"":"disabled"} style="background:#5a8aaa;">Modernize — $50k</button>
                </div>
            </div>
        `,document.getElementById("mod-close")?.addEventListener("click",()=>t.classList.remove("active")),document.getElementById("mod-cancel")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=r=>{r.target===t&&t.classList.remove("active")},document.getElementById("mod-file-input")?.addEventListener("change",r=>{const p=r.target.files?.[0];if(p){if(p.size>2*1024*1024){alert("Logo must be under 2MB.");return}i=p,s=URL.createObjectURL(p),n()}}),document.getElementById("mod-submit")?.addEventListener("click",async()=>{if(o||!i)return;o=!0;const r=document.getElementById("mod-submit");r&&(r.disabled=!0,r.textContent="Uploading...");try{const p=i.name.split(".").pop()?.toLowerCase()||"png",f=`${a.id}/logo_${Date.now()}.${p}`,{error:v}=await $.storage.from("party-logos").upload(f,i,{cacheControl:"3600",upsert:!0,contentType:i.type});if(v)throw new Error("Upload failed: "+v.message);const{data:g}=$.storage.from("party-logos").getPublicUrl(f),h=g?.publicUrl;if(!h)throw new Error("Failed to get logo URL");const x=Math.max(0,Number(a.party_funds??0)-5e4),{error:y}=await $.from("factions").update({custom_logo_url:h,party_funds:x}).eq("id",a.id);if(y)throw y;a.custom_logo_url=h,a.party_funds=x,t.classList.remove("active"),alert("Logo updated! Your party now earns +1 Momentum/tick from the modernized image."),H(e)}catch(p){alert("Modernize failed: "+(p.message||"Error")),o=!1,r&&(r.disabled=!1,r.textContent="Modernize — $50k")}})}t.classList.add("active"),n()}function qa(e){const t=document.getElementById("pa-rebrand-modal");if(!t)return;const a=b.faction;b.nation;const i=a.momentum??50;(b._allParties||[]).filter(p=>p.id!==a.id);const s={current:a.party_color||"#4a8aba"},o={current:0},n={current:a.custom_logo_url||null},d={current:null},m={current:!!a.custom_logo_url},l={current:!1};function c(){return s.current}function r(){const p=c(),f=Ce.find(E=>E.hex===p)?.name||"Custom",v=oe[o.current]?.emoji||"🏛️",g=m.current&&(n.current||d.current),h=n.current||(d.current?URL.createObjectURL(d.current):null),x=document.getElementById("rb-name")?.value??a.faction_name??"",y=document.getElementById("rb-abbr")?.value??a.abbreviation??"",u=document.getElementById("rb-desc")?.value??"",w=Ce.map(E=>{const I=p===E.hex;return`<div class="rb-color-swatch ${I?"selected":""}" data-hex="${E.hex}" style="background:${E.hex};${I?`box-shadow:0 0 8px ${E.hex}44;border:2px solid var(--text-bright);`:""}">
                ${I?'<span style="font-size:10px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.5);">✓</span>':""}
            </div>`}).join(""),L=oe.map((E,I)=>{const k=o.current===I;return`<div class="rb-logo-item ${k?"selected":""}" data-idx="${I}" style="${k?`background:${p}15;border:2px solid ${p};box-shadow:0 0 6px ${p}33;`:""}">
                ${E.emoji}
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
                            <input class="pa-modal-input" id="rb-name" value="${_(x)}" maxlength="60" style="font-size:13px;font-weight:600;">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${x.length}/60 · Min 3</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Abbreviation</div>
                            <input class="pa-modal-input" id="rb-abbr" value="${_(y)}" maxlength="4" style="width:100px;font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;color:${p};">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">2-4 uppercase letters</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Description</div>
                            <textarea class="pa-modal-input" id="rb-desc" rows="3" style="resize:vertical;font-family:var(--font-ui);font-size:11px;line-height:1.5;">${_(u)}</textarea>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${u.length}/200 · Visible to all</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Color — <span style="color:${p};">${_(f)}</span></div>
                            <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;" id="rb-colors">${w}</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Logo — ${g?'<span style="color:var(--teal);">Custom</span>':"Preset"}</div>
                            <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px;margin-bottom:8px;${g?"opacity:0.3;":""}" id="rb-logos">${L}</div>
                            <!-- Custom upload section -->
                            <div style="border:1px ${g?"solid var(--teal)":"dashed var(--border-mid)"};padding:10px 14px;background:${g?"rgba(90,170,138,0.04)":"var(--bg-card)"};">
                                ${g&&h?`
                                    <div style="display:flex;align-items:center;gap:12px;">
                                        <img src="${h}" style="width:48px;height:48px;object-fit:contain;border:1px solid var(--border-main);background:var(--bg-card);" alt="Custom logo">
                                        <div style="flex:1;">
                                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--teal);font-weight:700;">CUSTOM LOGO ACTIVE</div>
                                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${d.current?d.current.name:"Saved logo"}</div>
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
                                    ${g&&h?`<img src="${h}" style="width:100%;height:100%;object-fit:contain;" alt="">`:v}
                                </div>
                                <div>
                                    <div style="font-size:12px;font-weight:700;color:var(--text-bright);line-height:1.2;">${_(x||"Party Name")}</div>
                                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${p};letter-spacing:1px;">${_(y||"???")}</div>
                                </div>
                            </div>
                            <div style="font-size:9px;color:var(--text-secondary);line-height:1.5;">${_(u||"No description...")}</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);margin-bottom:3px;">BADGES</div>
                            <div style="display:flex;gap:3px;flex-wrap:wrap;">
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${p};background:${p}0a;border:1px solid ${p}25;">${_(y)}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${p};background:${p}0a;border:1px solid ${p}25;">MEMBER</span>
                            </div>
                        </div>
                        <div style="padding:6px 8px;background:${p}08;border:1px solid ${p}25;display:flex;align-items:center;gap:8px;">
                            <div style="width:20px;height:20px;background:${p};"></div>
                            <div>
                                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${p};">${_(f.toUpperCase())}</div>
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
        `}t._rbCustomLogoFile=null,t._rbCustomLogoUrl=n.current,t._rbUseCustomLogo=m.current,r(),t.classList.add("active"),t.addEventListener("change",function(f){if(f.target.id==="rb-logo-file"){const v=f.target.files?.[0];if(!v)return;if(v.size>2*1024*1024){alert("Logo must be under 2MB. Selected file: "+(v.size/(1024*1024)).toFixed(1)+"MB"),f.target.value="";return}if(!["image/png","image/jpeg","image/svg+xml","image/webp"].includes(v.type)){alert("Unsupported file type. Use PNG, JPG, SVG, or WebP."),f.target.value="";return}d.current=v,n.current=null,m.current=!0,t._rbCustomLogoFile=v,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!0,r()}}),t.addEventListener("click",function p(f){if(f.target===t||f.target.closest("#rb-close")||f.target.closest("#rb-cancel")){t.classList.remove("active"),t.removeEventListener("click",p);return}const v=f.target.closest(".rb-color-swatch");if(v){s.current=v.dataset.hex,r();return}const g=f.target.closest(".rb-logo-item");if(g){o.current=parseInt(g.dataset.idx)||0,m.current=!1,t._rbUseCustomLogo=!1,r();return}if(f.target.closest("#rb-remove-logo")){n.current=null,d.current=null,m.current=!1,t._rbCustomLogoFile=null,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!1,r();return}if(f.target.closest("#rb-submit")){const h=document.getElementById("rb-name")?.value?.trim()||"",x=document.getElementById("rb-abbr")?.value?.trim()||"";if(h.length<3||x.length<2){alert("Name must be 3+ chars, abbreviation 2-4 chars.");return}l.current=!0,r();return}if(f.target.closest("#rb-back")){l.current=!1,r();return}if(f.target.closest("#rb-confirm")){Ha(t,e,p);return}})}async function Ha(e,t,a){const i=b.faction,s=document.getElementById("rb-name")?.value?.trim()||"",o=document.getElementById("rb-abbr")?.value?.trim()||"";document.getElementById("rb-desc")?.value?.trim();const n=document.querySelector(".rb-color-swatch.selected")?.dataset?.hex||i.party_color,d=document.querySelector(".rb-logo-item.selected")?.dataset?.idx,m=d!=null?oe[parseInt(d)]?.emoji:null,l=e._rbCustomLogoFile,c=e._rbUseCustomLogo,r=e._rbCustomLogoUrl,p=document.getElementById("rb-confirm");p&&(p.disabled=!0,p.textContent="Rebranding...");try{const f=b.shard?.current_tick||0;let v=r;if(c&&l){const u=l.name.split(".").pop()?.toLowerCase()||"png",w=`${i.id}/logo_${Date.now()}.${u}`,{data:L,error:E}=await $.storage.from("party-logos").upload(w,l,{cacheControl:"3600",upsert:!0,contentType:l.type});if(E){console.error("[Rebrand] Logo upload failed:",E.message),alert("Logo upload failed: "+E.message);return}const{data:I}=$.storage.from("party-logos").getPublicUrl(w);v=I?.publicUrl||null}else c||(v=null);const g=15e4,h=i.party_funds||0;if(h<g){alert(`Not enough funds. You have $${Math.round(h/1e3)}k, need $150k.`);return}const x=h-g,y=Math.max(1,(i.momentum||0)-10);await $.from("factions").update({party_funds:x,momentum:y,faction_name:s,abbreviation:o.toUpperCase(),party_color:n,party_logo:c?null:m,custom_logo_url:v,rebrand_cooldown_until_tick:f+120}).eq("id",i.id),await $.from("campaign_actions").insert({party_id:i.id,nation_id:b.nation?.id,action_type:"rebrand",ap_cost:3,money_cost:0,tick_performed:f,result:{oldName:i.faction_name,newName:s,oldAbbr:i.abbreviation,newAbbr:o,oldColor:i.party_color,newColor:n}}),i.party_funds=x,i.momentum=y,i.faction_name=s,i.abbreviation=o.toUpperCase(),i.party_color=n,i.party_logo=c?null:m,i.custom_logo_url=v,e.classList.remove("active"),e.removeEventListener("click",a),H(t)}catch(f){console.error("[PartyActions] Rebrand error:",f),alert("Failed to rebrand: "+(f.message||f))}finally{p&&(p.disabled=!1,p.textContent="⚠ Confirm Rebrand")}}const Ua=[{id:"file_lawsuit",name:"File Lawsuit",desc:"Sue a government ministry alleging corruption or negligence. 8-tick timeline with milestone events. Outcome depends on actual corruption growth since government took office.",cost:"$250k",costColor:"#c8a832",moneyCost:25e4,tags:["LEGAL","OFFENSIVE"],locked:!1}];function Ya(e){const t=j,a=Q(t.first_name,t.last_name),i=vt(t.skill),s=pt?'<span style="color:#5cc55c;margin-left:6px;">✓ IN OPPOSITION</span>':'<span style="color:#c84;margin-left:6px;">⚠ IN GOVERNMENT (actions limited)</span>',o=Ua.map(n=>{const d=n.tags.map(m=>`<span class="pa-action-tag" style="color:${Dt[m]||"var(--text-dim)"};">${m}</span>`).join("");return`
            <div class="pa-action-item ${n.locked?"locked":""}" data-action-id="${n.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${_(n.name)}</span>
                        <div class="pa-action-tags">${d}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${n.costColor};">${n.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${_(n.desc)}</div>
                ${n.locked&&n.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${_(n.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${e.color};background:${e.color}15;border-color:${e.color}33;">${a}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${e.color};">${e.title}</span>
                        <span class="pa-detail-name">${_(t.first_name)} ${_(t.last_name)}</span>
                    </div>
                    <div class="pa-detail-meta">${_(e.fullTitle)}, Age ${t.age}${s}</div>
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
        ${t.background?`<div style="padding:6px 16px;border:1px solid var(--border-main);border-top:none;border-bottom:none;background:var(--bg-panel);font-size:9px;color:var(--text-dim);font-style:italic;">${_(t.background)}</div>`:""}
        <div class="pa-actions-list">
            ${o}
        </div>
        ${Va()}
        <div class="pa-skill-footer">
            <span style="color:${e.color};font-weight:700;">${e.title}</span> skill (${t.skill}/100) affects lawsuit discovery and legal action outcomes. <span style="color:${i.color};font-weight:700;">${i.label}</span>: ${i.desc}
        </div>
    `}function Va(){if(ae.length===0)return"";const e=b.shard?.current_tick||0;return`
        <div class="pa-ls-section">
            <div class="pa-ls-section-title">Legal Actions</div>
            ${ae.map(a=>{const i=Nt.find(x=>x.key===a.target_ministry),s=i?i.label:a.target_ministry,o=i?i.icon:"⚖️",n=ve(a.corruption_growth||0),d=nt[a.tier]||nt[1],m=a.status==="active",l=Math.max(0,e-a.filed_at_tick),c=8,r=Math.min(1,l/c),p=Math.max(0,a.resolves_at_tick-e),f=[{tick:0,label:"Filed",type:"filing"},{tick:2,label:"Discovery",type:"discovery"},{tick:5,label:"Evidence",type:"evidence"},{tick:7,label:"Pre-trial",type:"pre_trial"},{tick:8,label:"Verdict",type:"resolution"}],v=f.map(x=>{const y=a.filed_at_tick+x.tick,u=e>=y,w=e>=y&&(x.tick===8||e<a.filed_at_tick+f[f.indexOf(x)+1]?.tick),L=x.tick/c*100;return`<div class="pa-ls-milestone ${u?"passed":""} ${w?"current":""}" style="left:${L}%;" title="${x.label} (Tick ${y})">
                <div class="pa-ls-milestone-dot"></div>
                <div class="pa-ls-milestone-label">${x.label}</div>
            </div>`}).join("");let g="";if(!m){const x=d===nt[1]?"FRIVOLOUS":d===nt[2]?"PARTIAL WIN":d===nt[3]?"MAJOR WIN":"DEVASTATING",y=a.tier===1?"var(--red)":a.tier===2?"#ca5":a.tier===3?"#c84":"var(--green)";g=`<span class="pa-ls-tier-badge" style="color:${y};border-color:${y}44;background:${y}0a;">${x}</span>`}const h=m?"":`
            <div style="display:flex;gap:12px;margin-top:6px;font-family:var(--font-mono);font-size:8px;">
                <span style="color:${a.momentum_effect>=0?"var(--green)":"var(--red)"};">You: ${a.momentum_effect>=0?"+":""}${a.momentum_effect} Mom</span>
                <span style="color:${a.governance_effect>=0?"var(--green)":"var(--red)"};">${a.governance_effect>=0?"+":""}${a.governance_effect} Gov</span>
                <span style="color:${a.gov_momentum_effect>=0?"var(--green)":"var(--red)"};">Govt: ${a.gov_momentum_effect>=0?"+":""}${a.gov_momentum_effect} Mom</span>
            </div>
        `;return`
            <div class="pa-ls-card ${m?"active":"resolved"}">
                <div class="pa-ls-header">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${o}</span>
                        <span style="font-size:11px;font-weight:700;color:var(--text-bright);">${_(s)}</span>
                        <span class="pa-ls-tier-badge" style="color:${n.color};border-color:${n.color}44;background:${n.color}0a;">TIER ${a.tier}</span>
                        ${g}
                    </div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">
                        ${m?`${p} ticks left`:`Resolved tick ${a.resolves_at_tick}`}
                    </div>
                </div>
                ${m?`
                    <div class="pa-ls-timeline">
                        <div class="pa-ls-timeline-track">
                            <div class="pa-ls-timeline-fill" style="width:${r*100}%;"></div>
                        </div>
                        ${v}
                    </div>
                `:""}
                <div style="font-size:9px;color:var(--text-dim);margin-top:4px;">
                    Corruption growth: <span style="color:${n.color};font-weight:700;">${(a.corruption_growth||0).toFixed(1)}</span>
                    &mdash; ${_(n.label)}
                </div>
                ${h}
            </div>
        `}).join("")}
        </div>
    `}let Ut=!1;async function Ie(e){const t=document.getElementById("pa-hire-modal");if(!t)return;const a=b.nation?.id,i=b.nation?.name;if(!a||!i)return;t.innerHTML='<div class="pa-modal"><div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Searching for candidates...</div></div>',t.classList.add("active");const s=await $a($,a,i);let o=null;function n(){const d=o!=null?s[o]:null,m=d?vt(d.skill):null,l=s.map((p,f)=>{const v=o===f,g=vt(p.skill);return`<div class="pa-hire-row ${v?"selected":""}" data-idx="${f}">
                <div style="width:32px;height:32px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#d44a4a;flex-shrink:0;">${Q(p.first_name,p.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${v?"var(--text-bright)":"var(--text-secondary)"};">${_(p.first_name)} ${_(p.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${p.skill}%;background:${g.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${g.color};">${p.skill}</span>
                    </div>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;">Age ${p.age}</div>
            </div>`}).join("");let c;d?c=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#d44a4a;">${Q(d.first_name,d.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${_(d.first_name)} ${_(d.last_name)}</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:1px;">Age ${d.age} &middot; Opposition Coordinator Candidate</div>
                        </div>
                    </div>

                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">SKILL</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${d.skill}%;background:${m.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${m.color};">${d.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${m.color};margin-top:3px;font-weight:700;">${m.label}</div>
                        </div>
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">HIRE COST</div>
                            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--accent);">$${(d.hire_cost/1e3).toFixed(0)}k</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:3px;">From party funds</div>
                        </div>
                    </div>

                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">BACKGROUND</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.6;font-style:italic;">${_(d.background)}</div>
                    </div>

                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">SKILL ASSESSMENT</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.5;">${m.desc}</div>
                    </div>

                    <div style="padding:8px 10px;background:rgba(212,74,74,0.04);border:1px solid rgba(212,74,74,0.12);">
                        <div style="font-family:var(--font-mono);font-size:7px;color:#d44a4a;letter-spacing:0.06em;margin-bottom:3px;">ROLE: OPPOSITION COORDINATOR</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">Files lawsuits against the government, organizes protests, and leads legal challenges. Skill affects success rates of legal and direct actions. Available only when your party is in opposition.</div>
                    </div>
                </div>
                <div style="padding:10px 20px;border-top:1px solid var(--border-main);background:var(--bg-card);display:flex;justify-content:flex-end;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-right:auto;">Cost: <span style="color:var(--accent);font-weight:700;">$${(d.hire_cost/1e3).toFixed(0)}k</span></span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-hire-confirm" style="background:#d44a4a;"${(b.faction?.party_funds||0)<d.hire_cost?' disabled title="Not enough funds"':""}>Hire ${_(d.first_name)}</button>
                </div>
            `:c=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;"><div style="text-align:center;">
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
                        ${c}
                    </div>
                </div>
            </div>
        `;const r=()=>t.classList.remove("active");document.getElementById("pa-hire-close")?.addEventListener("click",r),t.onclick=p=>{p.target===t&&r()},document.getElementById("pa-hire-list")?.addEventListener("click",p=>{const f=p.target.closest(".pa-hire-row");f&&(o=parseInt(f.dataset.idx,10),n())}),document.getElementById("pa-hire-confirm")?.addEventListener("click",async()=>{if(Ut||o==null)return;Ut=!0;const p=document.getElementById("pa-hire-confirm");p&&(p.disabled=!0,p.textContent="Hiring...");try{const f=b.shard?.current_tick||0,v=s[o],g=v.hire_cost||0,h=b.faction?.party_funds||0;if(g>0&&h<g){alert(`Not enough funds. You have $${Math.round(h/1e3)}k, need $${Math.round(g/1e3)}k.`);return}if(g>0){const y=h-g,{error:u}=await $.from("factions").update({party_funds:y}).eq("id",b.faction.id);if(u){alert("Failed to deduct funds.");return}b.faction.party_funds=y}const x=await wa($,b.faction?.id,v,f);if(!x.success){alert(x.error||"Failed to hire agitator.");return}j=x.agitator,X="agitator",r(),H(e)}catch(f){console.error("[PartyActions] Hire agitator error:",f)}finally{Ut=!1,p&&(p.disabled=!1)}})}n()}let St=!1;function Ka(e){const t=document.getElementById("pa-lawsuit-modal");if(!t)return;if(!F){alert("No active government to file against.");return}const a=b.faction,i=j;let s=null,o=null;function n(){const d=s&&o,m=Nt.map(r=>{const p=s===r.key;return`<div class="pa-lawsuit-target ${p?"selected":""}" data-target="${r.key}">
                <span style="font-size:18px;">${r.icon}</span>
                <span style="font-size:12px;font-weight:600;color:${p?"var(--text-bright)":"var(--text-secondary)"};">${_(r.label)}</span>
            </div>`}).join(""),l=Fe.map(r=>{const p=o===r.key;return`<div class="pa-lawsuit-basis ${p?"selected":""}" data-basis="${r.key}">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:16px;height:16px;border-radius:50%;border:2px solid ${p?"#d44a4a":"var(--border-mid)"};display:flex;align-items:center;justify-content:center;">
                        ${p?'<div style="width:8px;height:8px;border-radius:50%;background:#d44a4a;"></div>':""}
                    </div>
                    <div>
                        <div style="font-size:14px;font-weight:600;color:${p?"var(--text-bright)":"var(--text-secondary)"};">${_(r.label)}</div>
                        <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">${_(r.desc)}</div>
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
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:#d44a4a;">${_(i.first_name)} ${_(i.last_name)}</span>
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Skill ${i.skill}</span>
                </div>`:""}

                <div class="pa-modal-body" style="gap:16px;">
                    <div>
                        <div class="pa-modal-step-label">1 &mdash; Target Ministry</div>
                        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:4px;" id="pa-lawsuit-targets">${m}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-lawsuit-submit" ${d?"":"disabled"} style="background:#d44a4a;">File Lawsuit</button>
                </div>
            </div>
        `;const c=()=>t.classList.remove("active");document.getElementById("pa-lawsuit-close")?.addEventListener("click",c),document.getElementById("pa-lawsuit-cancel")?.addEventListener("click",c),t.onclick=r=>{r.target===t&&c()},document.getElementById("pa-lawsuit-targets")?.addEventListener("click",r=>{const p=r.target.closest(".pa-lawsuit-target");p&&(s=p.dataset.target,n())}),document.getElementById("pa-lawsuit-bases")?.addEventListener("click",r=>{const p=r.target.closest(".pa-lawsuit-basis");p&&(o=p.dataset.basis,n())}),document.getElementById("pa-lawsuit-submit")?.addEventListener("click",async()=>{if(St||!s||!o)return;St=!0;const r=document.getElementById("pa-lawsuit-submit");r&&(r.disabled=!0,r.textContent="Filing...");try{const{data:f}=await $.from("factions").select("party_funds").eq("id",a.id).single(),v=f?.party_funds||0;if(v<25e4){alert(`Not enough funds. You have $${Math.round(v/1e3)}k, need $250k.`),St=!1,r&&(r.disabled=!1,r.textContent="File Lawsuit");return}const g=v-25e4;await $.from("factions").update({party_funds:g}).eq("id",a.id),a.party_funds=g,sessionStorage.removeItem("nationhood_state");const h=b.shard?.current_tick||0,x=await ka($,{factionId:a?.id,nationId:b.nation?.id,agitatorId:i?.id,targetMinistry:s,basis:o,currentTick:h,partyName:a?.faction_name||"Opposition",administration:F});if(!x.success){alert(x.error||"Failed to file lawsuit.");return}const y=ve(x.lawsuit?.corruption_growth||0),u=nt[x.tier]||nt[1];c(),alert(`Lawsuit filed against ${Nt.find(w=>w.key===s)?.label||s}.
The case is now under investigation. Results will be determined when it resolves in 8 ticks.`),H(e)}catch(p){console.error("[PartyActions] File lawsuit error:",p),alert("An error occurred. Please try again.")}finally{St=!1,r&&(r.disabled=!1,r.textContent="File Lawsuit")}})}t.classList.add("active"),n()}async function Wa(e){const t=document.getElementById("pa-appoint-pm-modal");if(!t)return;const a=b.nation;b.faction;const{data:i}=await $.from("factions").select("id, faction_name, abbreviation, party_color, seats, leader_first_name, leader_last_name, leader_age").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),s=i||[];let o=null,n=!1;const{data:d}=await $.from("head_of_government").select("faction_id, first_name, last_name, factions(faction_name)").eq("nation_id",a.id).eq("active",!0).maybeSingle();function m(){const l=s.find(v=>v.id===o),c=d?`${d.first_name} ${d.last_name}`:null,r=d?.factions?.faction_name||null,p=d&&o===d.faction_id;t.innerHTML=`
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
                    ${c?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Current PM: <strong style="color:var(--text-bright);">${_(c)}</strong> (${_(r||"?")})</div>`:'<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--amber);">No Prime Minister appointed.</div>'}
                </div>
                <div class="pa-modal-body" style="max-height:300px;overflow-y:auto;">
                    <div class="pa-modal-step-label">Select a Party</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${s.map(v=>{const g=v.id===o,h=d&&v.id===d.faction_id,x=v.leader_first_name&&v.leader_last_name?`${v.leader_first_name} ${v.leader_last_name}`:"?";return`<div class="pa-action-item ${g?"selected":""}" data-party-id="${v.id}" style="cursor:pointer;${g?`border-color:${v.party_color||"#888"};background:${v.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${v.party_color||"#888"};"></div>
                                        <div>
                                            <div style="font-size:13px;font-weight:600;color:var(--text-bright);">${_(v.faction_name)}</div>
                                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${_(x)}, Age ${v.leader_age||"?"} · ${v.seats||0} seats</div>
                                        </div>
                                    </div>
                                    ${h?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:2px 6px;color:var(--green);background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2);">CURRENT PM</span>':""}
                                </div>
                            </div>`}).join("")}
                    </div>
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="apm-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="apm-confirm" ${!l||n||p?"disabled":""} style="background:#c8a832;">${l?p?"Already PM":`Appoint ${_(l.faction_name)}`:"Select a party"}</button>
                </div>
            </div>
        `;const f=()=>t.classList.remove("active");document.getElementById("apm-close")?.addEventListener("click",f),document.getElementById("apm-cancel")?.addEventListener("click",f),t.onclick=v=>{v.target===t&&f()},t.querySelector(".pa-modal-body")?.addEventListener("click",v=>{const g=v.target.closest("[data-party-id]");g&&(o=g.dataset.partyId,m())}),document.getElementById("apm-confirm")?.addEventListener("click",async()=>{if(!o||n)return;const v=s.find(h=>h.id===o);if(!v||!confirm(`Appoint ${v.leader_first_name} ${v.leader_last_name} of ${v.faction_name} as Prime Minister?`))return;n=!0;const g=document.getElementById("apm-confirm");g&&(g.disabled=!0,g.textContent="Appointing...");try{const h=b.shard?.current_tick||0;await sa($,{nationId:a.id,factionId:o,firstName:v.leader_first_name||"Unknown",lastName:v.leader_last_name||"Unknown",age:v.leader_age||50,currentTick:h});let x=0;const y=a.monarch_faction_id,u=d?.faction_id||null,w=u&&u!==y&&u!==o,L=o!==y&&o!==u;if(w&&(x-=4),L&&(x+=3),x!==0){const I=Number(a.legitimacy??50),k=Math.max(0,Math.min(100,I+x));try{await $.from("nations").update({legitimacy:k}).eq("id",a.id),a.legitimacy=k}catch{}}try{await $.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} appoints Prime Minister`,category:"government",description_chosen:`${a.monarch_title||"The King"} has appointed ${v.leader_first_name} ${v.leader_last_name} of ${v.faction_name} as Prime Minister.`,fired_at_tick:h})}catch{}f();const E=x>0?`

Legitimacy +${x}.`:x<0?`

Legitimacy ${x}.`:"";alert(`${v.leader_first_name} ${v.leader_last_name} of ${v.faction_name} has been appointed Prime Minister.${E}`),H(e)}catch(h){alert("Failed to appoint PM: "+(h.message||"Error")),n=!1,g&&(g.disabled=!1,g.textContent=`Appoint ${_(v.faction_name)}`)}})}t.classList.add("active"),m()}async function Ja(e){const t=document.getElementById("pa-royal-modal");if(!t)return;const a=b.nation,i=b.faction,s=i.seats||0,o=a?.total_seats||100,{data:n}=await $.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),d=(n||[]).filter(p=>p.id!==i.id);let m=null;const l=Math.max(0,s-1);let c=Math.min(5,l||1);function r(){const p=d.find(v=>v.id===m);t.innerHTML=`
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
                        ${d.length>0?d.map(v=>{const g=v.id===m;return`<div class="pa-action-item ${g?"selected":""}" data-faction-id="${v.id}" style="cursor:pointer;${g?`border-color:${v.party_color||"#888"};background:${v.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${v.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${_(v.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${Math.max(0,v.seats||0)} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No other factions in this nation.</div>'}
                    </div>
                    ${p?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Grant</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${l}" value="${c}" id="grant-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--accent);width:40px;text-align:center;" id="grant-count">${c}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Legitimacy gain: <span style="color:#5cc55c;font-weight:700;">+${(c*.5).toFixed(1)}</span>
                                &middot; Your seats after: ${s-c} &middot; Their seats after: ${(p.seats||0)+c}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-grant" ${p?"":"disabled"} style="background:#c8a832;">Grant ${c} Seats</button>
                </div>
            </div>
        `;const f=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",f),document.getElementById("royal-cancel")?.addEventListener("click",f),t.onclick=v=>{v.target===t&&f()},t.querySelector(".pa-modal-body")?.addEventListener("click",v=>{const g=v.target.closest("[data-faction-id]");g&&(m=g.dataset.factionId,r())}),document.getElementById("grant-slider")?.addEventListener("input",v=>{c=parseInt(v.target.value)||1,document.getElementById("grant-count").textContent=c;const g=document.getElementById("royal-grant");g&&(g.textContent=`Grant ${c} Seats`)}),document.getElementById("royal-grant")?.addEventListener("click",async()=>{if(!m||bt)return;bt=!0;const v=document.getElementById("royal-grant");v&&(v.disabled=!0,v.textContent="Granting...");try{const{data:g}=await $.from("factions").select("id, faction_name, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null),h=(g||[]).find(S=>S.id===i.id),x=(g||[]).find(S=>S.id===m);if(!h||!x){alert("Faction not found.");return}const y=(g||[]).reduce((S,T)=>S+Math.max(0,T.seats||0),0),u=new Map;for(const S of g||[])u.set(S.id,Math.max(0,S.seats||0));let w=c;const L=Math.max(0,(u.get(i.id)||0)-1),E=Math.min(w,L);if(E>0&&(u.set(i.id,(u.get(i.id)||0)-E),w-=E),w>0){const S=(g||[]).filter(N=>N.id!==i.id&&N.id!==m&&(u.get(N.id)||0)>0);let T=S.reduce((N,P)=>N+(u.get(P.id)||0),0);for(const N of S){if(w<=0||T<=0)break;const P=Math.round(w*(u.get(N.id)||0)/T),R=Math.min(P,u.get(N.id)||0,w);R>0&&(u.set(N.id,(u.get(N.id)||0)-R),T-=R,w-=R)}if(w>0)for(const N of S){if(w<=0)break;const P=u.get(N.id)||0,R=Math.min(w,P);R>0&&(u.set(N.id,P-R),w-=R)}}const I=c-w;if(I<=0){alert("No seats available to grant.");return}u.set(m,(u.get(m)||0)+I);let k=0;for(const S of u.values())k+=S;if(k!==y){console.error("[GrantSeats] Conservation violated",{sumBefore:y,sumAfter:k,grantAmount:c,actualGrant:I}),alert("Internal error: seat totals would not balance. Aborting.");return}const M=[];for(const S of g||[]){const T=Math.max(0,S.seats||0),N=u.get(S.id)||0;T!==N&&M.push({id:S.id,seats:N})}for(const S of M){const{error:T}=await $.from("factions").update({seats:S.seats}).eq("id",S.id);if(T){alert("Failed to grant seats: "+T.message);return}}const z=I*.5,C=Math.min(100,(Number(a.legitimacy)||50)+z),{error:A}=await $.from("nations").update({legitimacy:C}).eq("id",a.id);if(A){alert("Failed to update legitimacy.");return}i.seats=u.get(i.id)||0,a.legitimacy=C;try{const S=d.find(T=>T.id===m);await $.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} grants ${I} seats to ${S?.faction_name||"unknown"}`,category:"government",description_chosen:`The ${a.monarch_title||"King"} has granted ${I} parliamentary seat${I!==1?"s":""} to ${S?.faction_name}. Legitimacy +${z.toFixed(1)}.`,fired_at_tick:b.shard?.current_tick||0})}catch{}f(),H(e)}catch(g){console.error("[GrantSeats] Error:",g),alert("Failed to grant seats.")}finally{bt=!1}})}t.classList.add("active"),r()}async function Xa(e){const t=document.getElementById("pa-royal-modal");if(!t)return;const a=b.nation,i=b.faction,{data:s}=await $.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),o=(s||[]).filter(l=>l.id!==i.id&&(l.seats||0)>0);let n=null,d=1;function m(){const l=o.find(g=>g.id===n),c=l&&l.seats||0,p=d*1e5,f=i.party_funds||0;t.innerHTML=`
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
                        ${o.length>0?o.map(g=>{const h=g.id===n;return`<div class="pa-action-item ${h?"selected":""}" data-faction-id="${g.id}" style="cursor:pointer;${h?"border-color:#d44a4a;background:rgba(212,74,74,0.04);":""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${g.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${_(g.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${g.seats} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No factions have seats to revoke.</div>'}
                    </div>
                    ${l?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Revoke</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${c}" value="${d}" id="revoke-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#d44a4a;width:40px;text-align:center;" id="revoke-count">${d}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Cost: <span style="color:#d44a4a;font-weight:700;">$${Math.round(p/1e3)}k</span>
                                &middot; Legitimacy: <span style="color:#d44a4a;font-weight:700;">-${d}</span>
                                ${f<p?'<span style="color:#d44a4a;margin-left:8px;">⚠ Not enough funds</span>':""}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-revoke" ${!l||f<p?"disabled":""} style="background:#d44a4a;">Revoke ${d} Seats</button>
                </div>
            </div>
        `;const v=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",v),document.getElementById("royal-cancel")?.addEventListener("click",v),t.onclick=g=>{g.target===t&&v()},t.querySelector(".pa-modal-body")?.addEventListener("click",g=>{const h=g.target.closest("[data-faction-id]");h&&(n=h.dataset.factionId,d=1,m())}),document.getElementById("revoke-slider")?.addEventListener("input",g=>{d=parseInt(g.target.value)||1,document.getElementById("revoke-count").textContent=d;const h=document.getElementById("royal-revoke");h&&(h.textContent=`Revoke ${d} Seats`)}),document.getElementById("royal-revoke")?.addEventListener("click",async()=>{if(!n||bt)return;bt=!0;const g=document.getElementById("royal-revoke");g&&(g.disabled=!0,g.textContent="Revoking...");try{const h=d*1e5,{data:x}=await $.from("factions").select("id, faction_name, seats, party_funds").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null),y=(x||[]).find(P=>P.id===i.id),u=(x||[]).find(P=>P.id===n);if(!y||!u){alert("Faction not found.");return}const w=y.party_funds||0;if(w<h){alert("Not enough funds.");return}const L=(x||[]).reduce((P,R)=>P+Math.max(0,R.seats||0),0),E=Math.min(d,u.seats||0);if(E<=0){alert("Target has no seats to revoke.");return}const I=w-h,k=(y.seats||0)+E,M=(u.seats||0)-E,z=E,C=Math.max(0,(Number(a.legitimacy)||50)-z),A=L-(y.seats||0)-(u.seats||0)+k+M;if(A!==L){console.error("[RevokeSeats] Conservation violated",{sumBefore:L,sumAfter:A,take:E}),alert("Internal error: seat totals would not balance. Aborting.");return}const{error:S}=await $.from("factions").update({seats:k,party_funds:I}).eq("id",i.id);if(S){alert("Failed to revoke seats: "+S.message);return}const{error:T}=await $.from("factions").update({seats:M}).eq("id",n);if(T){alert("Failed to revoke seats: "+T.message);return}const{error:N}=await $.from("nations").update({legitimacy:C}).eq("id",a.id);if(N){alert("Failed to update legitimacy.");return}i.seats=k,i.party_funds=I,a.legitimacy=C,sessionStorage.removeItem("nationhood_state");try{await $.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} revokes ${E} seats from ${u.faction_name||"unknown"}`,category:"political",description_chosen:`The ${a.monarch_title||"King"} has revoked ${E} seat${E!==1?"s":""} from ${u.faction_name}. Legitimacy -${z}.`,fired_at_tick:b.shard?.current_tick||0})}catch{}v(),H(e)}catch(h){console.error("[RevokeSeats] Error:",h),alert("Failed to revoke seats.")}finally{bt=!1}})}t.classList.add("active"),m()}let Yt=!1;async function Qa(){if(Yt||!b?.faction?.id||!b?.nation?.id)return;if(!Et(b.nation)){alert("Early elections are only available in parliamentary and semi-presidential systems.");return}const e=F?.pm_party_id;if(!e||e!==b.faction.id){alert("Prime Minister’s party only.");return}if(confirm(`⚡ CALL EARLY ELECTIONS?

Dissolves the legislature and puts the government into caretaker status.
Election fires after a short formation window.

Momentum effect depends on Gov. Approval:
• >50  → PM party +3 Momentum (fresh mandate)
• 35–50 → neutral
• <35  → opposition +5 Momentum each, +3 Stability

Proceed?`)){Yt=!0;try{const t=Array.isArray(F?.party_ids)?F.party_ids:F?.pm_party_id?[F.pm_party_id]:[],a=await pa($,b.nation.id,e,t);if(a&&a.success===!1){alert("Could not call early elections: "+(a.error||"unknown error"));return}alert("⚡ Early elections called. Government is now in caretaker status."),window.location.reload()}catch(t){console.error("[PartyActions] Call early elections failed:",t),alert("Failed to call early elections: "+(t?.message||"unknown error"))}finally{Yt=!1}}}let Vt=!1;async function Za(){if(!Vt&&b?.faction?.id&&confirm(`LEAVE COALITION?

Consequences:
• −3 Momentum to your party
• −5 Momentum to the Prime Minister’s party
• Any ministries you hold will be vacated
• Your party moves from governing to opposition
• Coalition flips to minority if your exit drops it below majority
• 12-tick cooldown before you can leave another coalition

Proceed?`)){Vt=!0;try{const{data:e,error:t}=await $.rpc("leave_coalition",{p_faction_id:b.faction.id});if(t)throw t;if(e&&e.success===!1)throw new Error(e.error||"Unknown error");const a=e?.became_minority?`

The government is now a minority.`:"",i=(e?.ministries_vacated||0)>0?`

${e.ministries_vacated} ministr${e.ministries_vacated===1?"y":"ies"} vacated.`:"";alert("You have left the coalition."+a+i),window.location.reload()}catch(e){console.error("[PartyActions] Leave Coalition failed:",e),alert("Failed to leave coalition: "+(e?.message||e))}finally{Vt=!1}}}let Kt=!1;async function ti(){if(Kt||!b?.faction?.id||!b?.nation?.id)return;if(!Et(b.nation)){alert("Resignation is only available in parliamentary and semi-presidential systems.");return}const e=F?.pm_party_id;if(!e||e!==b.faction.id){alert("Prime Minister’s party only.");return}if(confirm(`⚠ RESIGN AS PRIME MINISTER?

The PM seat vacates immediately. Coalition enters caretaker status with
a ${te}-tick window to nominate a successor via the cabinet panel.
If a new PM is installed, the administration continues under new leadership.
If the window expires, a snap election is called.

Cost to your party:
• −3 Momentum
• −0.05 Credibility
• Nation: −3 Stability
• 12-tick bar from the PM seat on your party

Proceed?`)){Kt=!0;try{const{data:t}=await $.from("shard").select("current_tick").eq("name","Alpha Shard").single(),a=t?.current_tick||b.shard?.current_tick||0;(await na($,b.nation.id,b.faction.id,a))?.result==="election_called"?alert("You have resigned. Snap election scheduled as fallback if no successor is nominated."):alert("You have resigned. Coalition has a short window to nominate a successor before a snap election fires."),window.location.reload()}catch(t){console.error("[PartyActions] Resign PM failed:",t),alert("Failed to resign: "+(t?.message||"unknown error"))}finally{Kt=!1}}}let Wt=!1;async function ei(){if(Wt||!b?.faction?.id)return;const e=b.faction,t=e.faction_name||"this party",a=e.seats||0,i=Number(e.momentum||0).toFixed(1),s=Math.round(Number(e.party_funds||0)),o=s>=1e3?"$"+s.toLocaleString():"$"+s;if(!confirm("DISBAND "+t.toUpperCase()+`?

This will permanently:
• Dissolve the party
• Vacate `+a+" seat"+(a===1?"":"s")+` in parliament (empty until next election; no backfill)
• Forfeit `+o+` in party funds
• Forfeit `+i+` momentum
• Remove you from every nation chat
• Cascade-delete platforms, ideology, bloc membership,
  and any pending bloc invitations

You will need to found a new party.
There is a 24-tick cooldown on disbanding.

This action CANNOT be undone.`))return;if(prompt('Type "DISBAND" to confirm dissolution of '+t+":")!=="DISBAND"){alert("Disband cancelled.");return}Wt=!0;try{const{data:d,error:m}=await $.rpc("disband_party",{p_faction_id:e.id});if(m)throw m;if(d&&d.success===!1)throw new Error(d.error||"Unknown error");sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:{user:l}}=await $.auth.getUser();if(l){const{data:c}=await $.from("factions").select("id, faction_type").or(`id.eq.${l.id},linked_user_id.eq.${l.id}`),r=(c||[]).find(f=>f.faction_type==="party"),p=(c||[]).find(f=>f.faction_type==="corporation");if(r){sessionStorage.setItem("active_faction_id",r.id),alert(t+` has been disbanded.

Redirecting to your other party.`),window.location.href="dashboard.html";return}if(p){sessionStorage.setItem("active_faction_id",p.id),alert(t+` has been disbanded.

Redirecting to your corporation.`),window.location.href="corp-dashboard.html";return}}alert(t+` has been disbanded.

You have no remaining factions.`),window.location.href="faction-select.html"}catch(d){console.error("[PartyActions] Disband failed:",d),alert("Disband failed: "+(d?.message||d))}finally{Wt=!1}}let Jt=!1;async function ai(){if(Jt||!b?.faction?.id||!b?.nation?.id)return;const e=b.faction,t=b.nation,a=me(t);if(!Et(t)){alert("A vote of no confidence is only possible in a parliamentary or semi-presidential system.");return}const{data:i}=await $.from("head_of_government").select("faction_id, last_name").eq("nation_id",t.id).eq("active",!0).maybeSingle(),s=i?.faction_id||t.ruling_faction_id||null,o=i?.last_name||null;if(!s){alert("No active Prime Minister to file against.");return}if(s===e.id){alert("Your party is the Prime Minister — you cannot file a vote of no confidence against yourself.");return}const n=b.faction?.seats!=null?Number(b.faction.seats):0;if(n<1){alert("Your party needs at least 1 seat in the legislature to file a motion.");return}const{data:d}=await $.from("shard").select("current_tick").eq("name","Alpha Shard").single(),m=d?.current_tick||b.shard?.current_tick||0,{data:l}=await $.from("bills").select("id").eq("nation_id",t.id).eq("bill_type","no_confidence").in("status",["committee","floor"]).limit(1);if(l&&l.length>0){alert("A motion of no confidence is already pending.");return}const{data:c}=await $.from("campaign_actions").select("tick_performed").eq("nation_id",t.id).eq("action_type","no_confidence_filed").eq("target_id",s).order("tick_performed",{ascending:!1}).limit(1).maybeSingle();if(c){const f=m-Number(c.tick_performed||0);if(f<lt.NO_CONFIDENCE_COOLDOWN_TICKS){const v=lt.NO_CONFIDENCE_COOLDOWN_TICKS-f;alert(`Cooldown: ${v} tick${v!==1?"s":""} remaining before another motion can be filed against this PM party.`);return}}const r=o?a?`Motion of No Confidence in PM ${o}`:`Motion of No Confidence in the ${o} Government`:"Motion of No Confidence in the Government",p=a?`IF IT PASSES:
• PM removed — President must nominate a new PM
• Your party: +15 Momentum
• PM's party: -10 Momentum, -10 Governance`:`IF IT PASSES:
• Coalition dissolved, PM removed, all ministries vacated
• Snap elections scheduled
• Your party: +15 Momentum
• PM's party: -10 Momentum, -10 Governance`;if(confirm(`⚡ FILE VOTE OF NO CONFIDENCE?

"${r}"

Cost: $0 — free to file
Voting period: ${lt.NO_CONFIDENCE_VOTING_TICKS} ticks
Needs simple majority (YES > NO) to pass.

${p}

IF IT FAILS:
• Your party: -10 Momentum
• ${lt.NO_CONFIDENCE_COOLDOWN_TICKS}-tick cooldown on this PM party

Proceed?`)){Jt=!0;try{const f=await ca($,{faction:e,nation:t,pmFactionId:s,pmLastName:o,isSemiPres:a,tick:m,mySeats:n});if(!f.ok){alert("Failed to file motion: "+f.error);return}alert(`⚡ "${f.motionName}" has been filed!

Voting is now open for ${lt.NO_CONFIDENCE_VOTING_TICKS} ticks.`),window.location.href=`bill.html?id=${f.billId}`}catch(f){console.error("[PartyActions] No confidence file failed:",f),alert("Failed to file motion: "+(f?.message||"unknown error"))}finally{Jt=!1}}}let Xt=!1;async function ii(e){if(Xt)return;const t=b.faction,a=t.seats||0,i=Math.max(1,t.momentum??0);if(a<=0){alert("Your party has no seats — nothing to fundraise from.");return}const s=Be(a,mt);if(i-s.momCost<1){alert(`Not enough momentum. You need ${s.momCost} momentum (current: ${Math.round(i)}, floor: 1). Try again next tick when momentum recovers.`);return}Xt=!0;try{const{data:o}=await $.from("factions").select("party_funds, momentum").eq("id",t.id).single();o&&(t.party_funds=o.party_funds??0,t.momentum=o.momentum??0);const n=Math.max(1,t.momentum??0),d=b.shard?.current_tick||0,m=Math.max(1,n-s.momCost),l=(t.party_funds||0)+s.raised,{error:c}=await $.from("factions").update({momentum:m,party_funds:l}).eq("id",t.id);if(c){alert("Fundraise failed: "+c.message);return}await $.from("campaign_actions").insert({party_id:t.id,nation_id:b.nation?.id,action_type:"fundraise",ap_cost:0,money_cost:0,tick_performed:d,result:{momentumDelta:-s.momCost,raised:s.raised,perSeat:s.perSeat,momCost:s.momCost,useNumber:mt+1,seats:a}}),t.momentum=m,t.party_funds=l,sessionStorage.removeItem("nationhood_state"),mt++,H(e)}catch(o){console.error("[PartyActions] Fundraise error:",o),alert("Fundraise failed.")}finally{Xt=!1}}function oi(e){const t=document.getElementById("pa-statement-modal");if(!t)return;const a=b.faction,i=a?.color||"#c8a832",s=a?.leader_first_name&&a?.leader_last_name?`${a.leader_first_name} ${a.leader_last_name}`:"Party Leader",o=$e.map(c=>`<div class="pa-topic-card" data-topic="${c.id}" style="padding:8px 10px;cursor:pointer;border:1px solid var(--border-mid);display:flex;align-items:center;gap:8px;transition:all 0.12s;">
            <span style="font-size:14px;">${c.icon}</span>
            <span style="font-size:10px;font-weight:600;color:var(--text-secondary);">${_(c.label)}</span>
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
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${i};">${_(s)}</span>
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
    `,t.classList.add("active");let n=null,d=!1;const m=()=>t.classList.remove("active");document.getElementById("pa-stmt-close")?.addEventListener("click",m),document.getElementById("pa-stmt-cancel")?.addEventListener("click",m),t.addEventListener("click",c=>{c.target===t&&m()}),document.getElementById("pa-stmt-topics")?.addEventListener("click",c=>{const r=c.target.closest(".pa-topic-card");r&&(n=r.dataset.topic,document.querySelectorAll(".pa-topic-card").forEach(p=>{const f=p.dataset.topic===n;p.style.borderColor=f?i:"var(--border-mid)",p.style.background=f?i+"0a":"";const v=p.querySelector("span:last-child");v&&(v.style.color=f?"var(--text-bright)":"var(--text-secondary)")}),l())});const l=()=>{const c=document.getElementById("pa-stmt-body")?.value?.trim()||"",r=document.getElementById("pa-stmt-submit"),p=document.getElementById("pa-stmt-charcount");p&&(p.textContent=`${c.length} characters`),r&&(r.disabled=!(n&&c.length>=10))};document.getElementById("pa-stmt-body")?.addEventListener("input",l),document.getElementById("pa-stmt-submit")?.addEventListener("click",async()=>{if(d)return;const c=document.getElementById("pa-stmt-body")?.value?.trim();if(!n||!c||c.length<10)return;d=!0;const r=document.getElementById("pa-stmt-submit");r&&(r.disabled=!0,r.textContent="Issuing...");try{const p=b.shard?.current_tick||0,v=$e.find(z=>z.id===n)?.label||n,g=2e4,{data:h}=await $.from("factions").select("party_funds").eq("id",a.id).single(),x=h?.party_funds||0;if(x<g){alert(`Not enough funds. You have $${Math.round(x/1e3)}k, need $20k.`);return}const y=x-g,{error:u}=await $.from("factions").update({party_funds:y}).eq("id",a.id);if(u){alert("Failed to deduct funds: "+u.message);return}a.party_funds=y;const L=we[Math.floor(Math.random()*we.length)].replace("{party_name}",a.faction_name||"Unknown Party").replace("{leader_name}",s).replace("{topic}",v),{error:E}=await $.from("campaign_actions").insert({party_id:a.id,nation_id:b.nation?.id,action_type:"issue_statement",ap_cost:1,money_cost:0,tick_performed:p,result:{topic:n,topicLabel:v,headline:L,body:c,leaderName:s}});E&&console.error("[PartyActions] Statement log failed:",E.message);const{error:I}=await $.from("valdorian_articles").insert({nation_id:b.nation?.id,event_type:"issue_statement",tier:3,section:"politics",headline:L,subheadline:v,lede:c.substring(0,200)+(c.length>200?"...":""),body_paragraphs:JSON.stringify(c.split(/\n\n+/).filter(z=>z.trim())),quotes:JSON.stringify([{posture:"assertive",text:c.substring(0,150)}]),byline_reporter:"Political Desk",topic_tags:JSON.stringify([n]),source_event_id:"statement_"+Date.now(),tick:p});I&&console.error("[PartyActions] Article creation failed:",I.message);const{error:k}=await $.from("event_log").insert({nation_id:b.nation?.id,event_name:L,category:"political",description_chosen:`${a.faction_name} issues the following statement regarding ${v}: "${c}"`,fired_at_tick:p});k&&console.warn("[Statement] event_log insert failed:",k.message);const{error:M}=await $.from("admin_timeline_events").insert({nation_id:b.nation?.id,tick:p,type:"communications",title:"Statement Issued",description:`${s} issued a public statement on ${v}: "${c.substring(0,120)}${c.length>120?"...":""}"`});M&&console.warn("[Statement] timeline insert failed:",M.message),m(),H(e)}catch(p){console.error("[PartyActions] Statement error:",p),alert("Failed to issue statement. Please try again.")}finally{d=!1,r&&(r.disabled=!1,r.textContent="Issue Statement")}})}const Ft=20;function ni(e){const t=document.getElementById("pa-platform-modal");if(!t)return;const a=b.faction;b.nation;const i=a?.color||"#c8a832";let s=null,o=!1;const n={};for(const l of zt)l.faction_id!==a?.id&&(n[l.platform_key]=(n[l.platform_key]||0)+1);const d=new Set(et.map(l=>l.platform_key));function m(){const l=xt.find(f=>f.id===s),c=l?xe(n[l.id]||0):null;l&&zt.filter(f=>f.platform_key===l.id&&f.faction_id!==a?.id);const r=xt.map(f=>{const v=s===f.id,g=d.has(f.id),h=xe(n[f.id]||0),x=n[f.id]||0;return`<div class="pa-plat-card ${v?"selected":""} ${g?"adopted":""}" data-plat="${f.id}">
                ${g?'<div class="pa-plat-active-badge">ACTIVE</div>':""}
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <span style="font-size:14px;">${f.icon}</span>
                    <span style="font-size:10px;font-weight:700;color:${g?i:v?"var(--text-bright)":"var(--text-secondary)"};line-height:1.2;">${_(f.name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.4;margin-bottom:6px;">${_(f.tagline)}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${h.color};">${h.label}</span>
                    ${x>0?`<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 3px;color:var(--text-dim);border:1px solid var(--border-mid);">${x} rival${x>1?"s":""}</span>`:""}
                </div>
            </div>`}).join("");let p;if(!l)p=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;">
                <div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:24px;color:var(--border-mid);margin-bottom:8px;">←</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Select a platform to review</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:4px;">16 platforms available</div>
                </div>
            </div>`;else{const f=l.improve.map(y=>{const u=be(y,"improve");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(92,204,92,0.05);border:1px solid rgba(92,204,92,0.15);color:${u.color};white-space:nowrap;">${u.arrow} ${ye[y]||y}</span>`}).join(""),v=l.worsen.map(y=>{const u=be(y,"worsen");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(204,85,85,0.05);border:1px solid rgba(204,85,85,0.15);color:${u.color};white-space:nowrap;">${u.arrow} ${ye[y]||y}</span>`}).join(""),g=d.has(l.id),h=et.length;let x;g?x=`<div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${i};display:flex;align-items:center;gap:6px;">✓ CURRENT PLATFORM</div>`:h>=3?x='<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">All 3 platform slots are full.</div>':o?x=`<div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:#ca5;font-weight:700;">⚠ Confirm: Adopt ${_(l.name)}?</span>
                    <div style="display:flex;gap:6px;">
                        <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-plat-conf-cancel">Cancel</button>
                        <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-conf-yes">Confirm</button>
                    </div>
                </div>`:x=`<div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Costs 2 AP. Stats locked at current values. 6-tick cooldown.</span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-adopt" style="background:${i};">Adopt Platform</button>
                </div>`,p=`
                <div style="padding:16px 20px 12px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                        <span style="font-size:22px;">${l.icon}</span>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${_(l.name)}</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.04em;margin-top:1px;">${_(l.tagline.toUpperCase())}</div>
                        </div>
                    </div>
                    <div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">${_(l.desc)}</div>
                </div>
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);background:var(--bg-card);">
                    <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">MOMENTUM GAIN</div>
                            <div style="display:flex;align-items:baseline;gap:6px;">
                                <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${c.color};">${c.label}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-secondary);">${_(c.note)}</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div style="flex:1;padding:12px 20px;overflow-y:auto;">
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.1em;color:var(--green);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--green);display:inline-block;"></span>
                            PROMISES TO IMPROVE <span style="font-weight:400;color:var(--text-dim);">(${l.improve.length} stats, +${Ft} target)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${f}</div>
                    </div>
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.1em;color:var(--red);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--red);display:inline-block;"></span>
                            LIKELY SIDE EFFECTS <span style="font-weight:400;color:var(--text-dim);">(${l.worsen.length} stats)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${v}</div>
                    </div>
                    <div style="padding:10px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.15);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#ca5;letter-spacing:0.06em;margin-bottom:4px;">⚠ TRADEOFF</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.5;">${_(l.tradeoff)}</div>
                    </div>
                    <div style="margin-top:12px;padding:8px 12px;background:var(--bg-card);border:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">PROMISE RULES</div>
                        <div style="font-size:9px;color:var(--text-dim);line-height:1.5;">
                            Stats are locked at current values when adopted. If your party enters government, you have <strong style="color:var(--text-bright);">24 ticks</strong> to move each promised stat by <strong style="color:var(--text-bright);">+${Ft}</strong>. Failure: <strong style="color:var(--red);">-20 Momentum, -10 Governance</strong>. If you don't enter government, the promise abates.
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
                        ${r}
                    </div>
                    <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow-y:auto;" id="pa-plat-detail">
                        ${p}
                    </div>
                </div>
            </div>
        `,document.getElementById("pa-plat-close")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=f=>{f.target===t&&t.classList.remove("active")},document.getElementById("pa-plat-grid")?.addEventListener("click",f=>{const v=f.target.closest(".pa-plat-card");v&&(s=v.dataset.plat,o=!1,m())}),document.getElementById("pa-plat-adopt")?.addEventListener("click",()=>{o=!0,m()}),document.getElementById("pa-plat-conf-cancel")?.addEventListener("click",()=>{o=!1,m()}),document.getElementById("pa-plat-conf-yes")?.addEventListener("click",()=>si(e,s))}t.classList.add("active"),m()}let Lt=!1;async function si(e,t){if(Lt)return;Lt=!0;const a=document.getElementById("pa-platform-modal"),i=b.faction,s=b.nation;if(!i||!s||!t){Lt=!1;return}const o=xt.find(l=>l.id===t);if(!o)return;const n={},d={},m=l=>fe.has(l);for(const l of o.improve){const c=Number(s[l]??50);n[l]=c,m(l)?d[l]=Math.max(0,c-Ft):d[l]=Math.min(100,c+Ft)}try{const l=b.shard?.current_tick||0,{data:c,error:r}=await $.rpc("adopt_platform",{p_faction_id:i.id,p_nation_id:s.id,p_platform_key:t,p_tick:l,p_baseline_stats:n,p_target_stats:d});if(r){console.error("[PartyActions] Platform adoption failed:",r.message),alert("Failed to adopt platform: "+r.message);return}if(c&&!c.success){alert(c.error||"Failed to adopt platform.");return}const p=c?.slot||et.length+1;et.push({faction_id:i.id,nation_id:s.id,platform_key:t,slot:p,adopted_at_tick:l,baseline_stats:n,target_stats:d,status:"active"}),zt.push(et[et.length-1]),i&&c?.momentum_gained&&(i.momentum=(i.momentum||0)+c.momentum_gained),i&&(i.action_points=Math.max(0,(i.action_points||0)-2)),a?.classList.remove("active"),H(e)}catch(l){console.error("[PartyActions] Platform adoption error:",l),alert("An error occurred. Please try again.")}finally{Lt=!1}}let ht=null,Ve={isGoverning:!1,statusLabel:"OPPOSITION",administration:null,governanceScore:0,governanceDeltas:[],governanceMultiplier:1,governanceDecayCycles:0,ticksInPower:0,myFaction:null,allParties:[],rivalParties:[],factionIdeology:{},electoralStandings:[],recentActivity:[],caucuses:[],nextElection:null,nextElectionTicks:null,ideologyAxes:[]};function V(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}const ri=[...ma,...fa];function li(e,t,a,i){const s=i-(a||i);if(!t)return{score:0,deltas:[],decayCycles:0,multiplier:1,ticksInPower:s};let o=0,n=0;const d=[];for(const r of ri){const p=va(r);if(p===0)continue;const f=Number(t[r]??0),v=Number(e[r]??0),g=v-f;if(g===0)continue;const h=g*p,x=h>0;d.push({key:r,start:f,now:v,delta:g,signed:h,dir:p,isGood:x}),o+=h,n++}let m=n>0?o/n:0;const l=Math.floor(s/24),c=m>0?Math.pow(.97,l):1;return m*=c,{score:Math.round(m*10)/10,deltas:d,decayCycles:l,multiplier:c,ticksInPower:s}}function di(e,t,a){return Te.map(i=>{const s=t[e],n=((s?Number(s[i.key]??0):0)+100)/200,d=a.map(m=>{const l=t[m.id],c=l?Number(l[i.key]??0):0;return{id:m.id,pos:(c+100)/200,color:m.party_color||"#666"}});return{key:i.key,name:`${i.leftLabel} / ${i.rightLabel}`,left:i.leftLabel.toUpperCase(),right:i.rightLabel.toUpperCase(),leftColor:i.leftColor,rightColor:i.rightColor,yourPos:n,parties:d}})}async function ci(e,t,a){ht=t;const i=document.getElementById(a);if(!i)return;const s=t.faction,o=t.nation,n=o?.id,d=s?.id;if(!s||!n){i.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">No faction data.</div>';return}i.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Loading party overview...</div>';try{const m=t.shard?.current_tick||0,[l,c,r,p,f,v,g,h,x]=await Promise.all([ze(e,n,d),e.from("factions").select("*").eq("nation_id",n).eq("faction_type","party"),e.from("faction_ideology").select("*"),e.from("faction_electoral_standing").select("*").eq("nation_id",n),e.from("campaign_actions").select("*").eq("party_id",d).order("tick_performed",{ascending:!1}).limit(20),e.from("caucus_factions").select("*").eq("party_id",d).eq("is_active",!0),e.from("elections").select("*").eq("nation_id",n).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(5),e.from("ministries").select("party_id").eq("nation_id",n).eq("is_active",!0),ia(n)]);c.error&&console.error("[PartyOverview] Parties fetch error:",c.error.message),r.error&&console.error("[PartyOverview] Ideology fetch error:",r.error.message),p.error&&console.error("[PartyOverview] Standings fetch error:",p.error.message),f.error&&console.error("[PartyOverview] Activity fetch error:",f.error.message),v.error&&console.error("[PartyOverview] Caucus fetch error:",v.error.message),g.error&&console.error("[PartyOverview] Election fetch error:",g.error.message);const y=c.data||[],u=l.administration,w=new Set((h.data||[]).map(A=>A.party_id).filter(Boolean)),L={};for(const A of r.data||[])L[A.faction_id]=A;let E={score:0,deltas:[],decayCycles:0,multiplier:1,ticksInPower:0};u&&u.stats_at_start&&(E=li(o,u.stats_at_start,u.started_at_tick,m));const I=g.data||[],k=I[0]||null,M=k?Math.max(0,k.election_tick-m):null;let z=null;k&&o&&rt(o)&&(z=I.some(S=>S.election_type==="presidential"&&S.election_tick===k.election_tick)?"General":"Midterm");const C=di(d,L,y);Ve={isGoverning:l.isGoverning,statusLabel:l.label,administration:u,ministryPartyIds:w,governanceScore:E.score,governanceDeltas:E.deltas.sort((A,S)=>Math.abs(S.signed)-Math.abs(A.signed)),governanceMultiplier:E.multiplier,governanceDecayCycles:E.decayCycles,ticksInPower:E.ticksInPower,myFaction:s,allParties:y,rivalParties:y.filter(A=>A.id!==d),blocMap:x,factionIdeology:L,electoralStandings:p.data||[],recentActivity:f.data||[],caucuses:v.data||[],nextElection:k,nextElectionTicks:M,nextElectionLabel:z,ideologyAxes:C},Ke(i)}catch(m){console.error("[PartyOverview] Init error:",m),i.innerHTML='<div style="padding:40px;text-align:center;color:var(--red);font-family:var(--font-mono);font-size:10px;">Failed to load party overview.</div>'}}let ot=[];function Ke(e){const t=Ve,a=t.myFaction,i=ht.nation,s=a?.party_color||a?.color||"#c8a832";ht.shard?.current_tick,ot.length===0&&(ot=[a?.id,...t.rivalParties.map(c=>c.id)]),t.administration?.admin_name||t.isGoverning;const o=t.statusLabel,n=t.isGoverning?"var(--green)":"var(--orange)",d=a?.seats||0,m=i?.total_seats||100,l=a?.momentum??50;e.innerHTML=`<div class="po-page">
        ${pi(t,s,d,m,l)}
        <div class="po-columns">
            <div class="po-col-left">
                ${mi(t,a,s,o,n)}
                ${fi(t)}
                ${vi(t,a,s)}
                ${ui(t)}
            </div>
            <div class="po-col-center" id="po-center-col">
                ${gi(t,l)}
                ${yi(t)}
            </div>
            <div class="po-col-right" id="po-right-col">
                ${bi(t,a)}
                ${xi(t)}
                ${hi()}
            </div>
        </div>
    </div>`,e.querySelectorAll(".po-legend-item").forEach(c=>{c.addEventListener("click",()=>{const r=c.dataset.partyId;r!==a?.id&&(ot.includes(r)?ot=ot.filter(p=>p!==r):ot.push(r),Ke(e))})})}function pi(e,t,a,i,s){const o=e.governanceScore,n=o>=0?"var(--green)":"var(--red)",d=e.isGoverning?e.administration?.admin_name||"Government":"Opposition",m=(ht.nation?.government_type||"").toLowerCase().includes("monarchy"),l=m?"No elections":e.nextElectionTicks!=null?e.nextElectionTicks:"—",c=m?"var(--text-dim)":typeof l=="number"&&l<=3?"var(--red)":"var(--text-bright)",r=m?"NEXT ELECTION":e.nextElectionLabel?"NEXT "+e.nextElectionLabel.toUpperCase():"NEXT ELECTION";return`<div class="po-summary">
        <div class="po-summary-cell" style="display:flex;flex-direction:row;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;background:${t};"></div>
            <div>
                <div style="font-size:11px;font-weight:700;color:var(--text-bright);">${V(d)}</div>
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
            <div class="po-summary-label">${r}</div>
            <div class="po-summary-value" style="color:${c};">${l}${typeof l=="number"?" ticks":""}</div>
        </div>
    </div>`}function mi(e,t,a,i,s){const o=t?.leader_first_name&&t?.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown",n=((t?.leader_first_name||"?")[0]+(t?.leader_last_name||"?")[0]).toUpperCase();t?.leader_age&&`${t.leader_age}`;const d=t?.approval_rating??0;return`<div class="po-card po-identity" style="border-left-color:${a};">
        <div class="po-identity-inner">
            <div class="po-identity-logo" style="color:${a};background:${a}12;border-color:${a}33;">${n}</div>
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;flex-wrap:wrap;">
                    <span class="po-identity-name">${V(t?.faction_name)}</span>
                    <span class="po-identity-badge" style="color:${s};background:${s}0a;border-color:${s}44;">${i}</span>
                    ${Pe(t?.bloc_id,e.blocMap)}
                </div>
                <div class="po-identity-meta">${e.ticksInPower} ticks in power</div>
                <div class="po-leader-row">
                    <div class="po-leader-avatar" style="color:${a};background:${a}15;border-color:${a}33;">${n}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-size:10px;font-weight:600;color:var(--text-bright);">${V(o)}</span>
                            <span style="font-family:var(--font-mono);font-size:7px;color:${a};">PARTY LEADER</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">APPROVAL</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--amber);">${d}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`}function fi(e){const t=e.governanceDeltas,a=e.governanceScore,i=a>=0?"var(--green)":"var(--red)",o=(e.governanceDecayCycles>0&&a>0?`Decay: ${((1-e.governanceMultiplier)*100).toFixed(1)}% (${e.governanceDecayCycles} cycles)`:"")||(t.length>0?`${t.length} modifier${t.length===1?"":"s"}`:""),n=t.map((d,m)=>{const l=d.isGood?"var(--green)":"var(--red)",c=d.delta>0?"+":"",r=d.key.replace(/_/g," ").replace(/\b\w/g,p=>p.toUpperCase());return`<div class="po-gov-row" style="${m<t.length-1?"border-bottom:1px solid rgba(200,196,184,0.03);":""}">
            <span class="po-gov-stat">${V(r)}</span>
            <span class="po-gov-val">${d.start.toFixed(1)}</span>
            <span class="po-gov-val">${d.now.toFixed(1)}</span>
            <span class="po-gov-delta" style="color:${l};">${c}${d.delta.toFixed(1)}</span>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <div style="display:flex;align-items:center;gap:6px;">
                <span class="po-card-title">GOVERNANCE</span>
                <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${i};">${a}</span>
            </div>
            <span class="po-card-subtitle">${V(o)}</span>
        </div>
        <div style="display:flex;padding:4px 12px;border-bottom:1px solid var(--border-main);background:var(--bg-card);">
            <span style="flex:1;font-family:var(--font-mono);font-size:6px;color:var(--text-dim);letter-spacing:0.04em;">STAT</span>
            <span style="width:40px;font-family:var(--font-mono);font-size:6px;color:var(--text-dim);text-align:right;">START</span>
            <span style="width:40px;font-family:var(--font-mono);font-size:6px;color:var(--text-dim);text-align:right;">NOW</span>
            <span style="width:44px;font-family:var(--font-mono);font-size:6px;color:var(--text-dim);text-align:right;">DELTA</span>
        </div>
        <div class="po-gov-scroll">
            ${n||'<div style="padding:12px;text-align:center;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);font-style:italic;">No governance data yet.</div>'}
        </div>
    </div>`}function vi(e,t,a){const s=[{id:t?.id,name:"You",color:a},...e.rivalParties.map(n=>({id:n.id,name:n.abbreviation||n.faction_name?.slice(0,3)||"?",color:n.party_color||"#666"}))].map(n=>{const d=ot.includes(n.id);return`<div class="po-legend-item ${d?"active":"inactive"}" data-party-id="${n.id}" style="${d?`background:${n.color}12;border-color:${n.color}44;`:""}">
            <div class="po-legend-dot" style="background:${d?n.color:"var(--text-dim)"};"></div>
            <span class="po-legend-name">${V(n.name)}</span>
        </div>`}).join(""),o=e.ideologyAxes.map(n=>{const d=n.parties.filter(l=>ot.includes(l.id)).map(l=>`<div class="po-axis-dot" style="left:${l.pos*100}%;background:${l.color};"></div>`).join(""),m=[20,40,60,80].map(l=>`<div class="po-axis-zone" style="left:${l}%;"></div>`).join("");return`<div class="po-axis">
            <div class="po-axis-labels">
                <span class="po-axis-label">${V(n.left)}</span>
                <span class="po-axis-name">${V(n.name)}</span>
                <span class="po-axis-label">${V(n.right)}</span>
            </div>
            <div class="po-axis-track">${m}${d}</div>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">IDEOLOGY</span>
        </div>
        <div style="padding:8px 12px;">
            <div class="po-legend">${s}</div>
            ${o}
        </div>
    </div>`}function ui(e){const t=(e.caucuses||[]).filter(s=>s.name&&s.name!=="Unnamed");if(t.length===0)return`<div class="po-card">
            <div class="po-card-header">
                <span class="po-card-title">INTERNAL CAUCUSES</span>
                <span class="po-card-subtitle">None</span>
            </div>
        </div>`;const a=e.faction?.seats||0,i=t.map(s=>{const o=s.relationship_score??50,n=o>60?"var(--green)":o>40?"var(--amber)":"var(--red)",d=Math.round((s.seat_share||0)*a),m=(s.dominant_axis||"").replace(/_/g,"/"),l=s.wing_end==="left"?m.split("/")[0]:m.split("/")[1]||"";return`<div class="po-caucus-row">
            <div>
                <div class="po-caucus-name">${V(s.name)}</div>
                <div class="po-caucus-wing" style="color:var(--text-dim);">${V(l)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="po-caucus-seats">${d} seats</span>
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
    </div>`}function gi(e,t){const i=Math.round(t*8/100*10)/10,s=Math.min(100,Math.max(0,t)),o=t>=60?"var(--green)":t>=30?"var(--orange)":"var(--red)";return`<div class="po-card">
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
    </div>`}function yi(e){const t=e.recentActivity||[],a=ht.shard?.current_tick||0;if(t.length===0)return`<div class="po-card" style="flex:1;">
            <div class="po-card-header">
                <span class="po-card-title">RECENT ACTIVITY</span>
            </div>
            <div style="padding:24px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No recent actions.</div>
        </div>`;const i={rally:"Rally",press_conference:"Press Conference",attack:"Attack Ad",issue_statement:"Statement",ideological_pivot:"Ideology Shift",take_stance:"Took Stance",poll_now:"Polled",endorse:"Endorsement",lobby:"Lobby"};return`<div class="po-card" style="flex:1;">
        <div class="po-card-header">
            <span class="po-card-title">RECENT ACTIVITY</span>
        </div>
        <div style="max-height:380px;overflow-y:auto;">${t.map(o=>{const n=a-(o.tick_performed||0),d=n===0?"0t":n+"t",m=o.result||{},l=m.momentumDelta||m.momentum_delta||m.momentum||(m.momCost?-m.momCost:0)||(m.effects||[]).reduce((v,g)=>v+(g.stat==="Momentum"?g.value:0),0)||0,c=l>0?"+":"",r=l>0?"var(--green)":l<0?"var(--red)":"var(--text-dim)";let f=i[o.action_type]||o.action_type?.replace(/_/g," ")||"?";return o.action_type==="rally"?f="Rally: "+(m.outcomeName||m.label||"Unknown")+(l?" ("+c+l+")":""):o.action_type==="press_conference"?f="Press Conference ("+c+l+")":o.action_type==="attack"?f="Attack on "+(m.targetName||"rival"):o.action_type==="issue_statement"?f="Issued statement"+(l?" ("+c+l+")":""):o.action_type==="take_stance"?f="Took stance on "+(m.issueLabel||"issue"):o.action_type==="ideological_pivot"?f="Ideology shift: "+(m.targetAxis||""):o.action_type==="poll_now"&&(f="Polled (margin: "+(m.pollMargin||"?")+")"),`<div style="padding:5px 12px;border-bottom:1px solid rgba(200,196,184,0.03);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:9px;color:var(--text-secondary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:8px;">${V(f)}</span>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${r};">${l!==0?c+l:"—"}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);width:20px;text-align:right;">${d}</span>
            </div>
        </div>`}).join("")}</div>
    </div>`}function bi(e,t){const a=e.rivalParties,i=e.administration,s=ht.nation,o=i?.pm_party_id,n=s?.total_seats||100,d=["SEC/FRE","TRA/PRO","IND/COL","LIB/EQL","GLB/NAT"],m=["security_freedom","tradition_progress","individualism_collectivism","liberty_equality","globalism_nationalism"],l=a.map(c=>{const r=c.party_color||"#666",p=c.abbreviation||c.faction_name?.slice(0,3)?.toUpperCase()||"?",f=c.leader_first_name&&c.leader_last_name?`${c.leader_first_name} ${c.leader_last_name}`:"Unknown",v=c.seats||0,g=_a(c,i,e.ministryPartyIds,s);let h=g.label;const x=g.isGoverning?"var(--green)":"var(--orange)";g.isGoverning&&g.label==="GOVERNING"&&(c.id===o?h="GOVERNING — LEAD":h="GOVERNING — JUNIOR");const y=v-(t?.seats||0),u=y>0?"var(--green)":y<0?"var(--red)":"var(--text-dim)",w=e.factionIdeology[c.id],L=m.map((E,I)=>{const M=((w?Number(w[E]??0):0)+100)/200;return`<div style="display:flex;align-items:center;gap:6px;">
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);width:42px;text-align:right;">${d[I]}</span>
                <div style="flex:1;height:5px;background:var(--border-main);position:relative;">
                    <div style="position:absolute;top:50%;left:${M*100}%;transform:translate(-50%,-50%);width:8px;height:8px;border-radius:50%;background:${r};"></div>
                </div>
            </div>`}).join("");return`<div style="padding:12px 16px;border-bottom:1px solid var(--border-main);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:36px;height:36px;background:${r}15;border:1px solid ${r}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${r};">${V(p)}</div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:var(--text-bright);">${V(c.faction_name)}</div>
                        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${V(f)}</div>
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 7px;color:${x};background:${x}0a;border:1px solid ${x}44;white-space:nowrap;">${h}</span>
                    ${Pe(c.bloc_id,e.blocMap)}
                </div>
            </div>
            <div style="display:flex;gap:10px;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">SEATS</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${v>0?"var(--text-bright)":"var(--text-dim)"};">${v}</span>
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">/ ${n}</span>
                </div>
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">VS YOU</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${u};">${y>0?"+":""}${y}</span>
                </div>
            </div>
            <div style="display:flex;flex-direction:column;gap:3px;">${L}</div>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">RIVAL PARTIES</span>
            <span class="po-card-subtitle">${a.length} parties</span>
        </div>
        ${l||'<div style="padding:16px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No rival parties.</div>'}
    </div>`}function xi(e){return`<div class="po-card" style="padding:8px 12px;">
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
    </div>`}function hi(){return`<div style="background:var(--bg-card);border:1px solid var(--border-main);padding:8px 12px;">
        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.6;">
            <span style="color:var(--amber);font-weight:700;">⚠ INCUMBENCY DECAY:</span> Positive governance scores erode 3% every 24 ticks. Long-serving governments must keep delivering results.
            <span style="color:var(--text-bright);font-weight:700;"> Momentum resets to 0</span> after every election. Rebuild each cycle.
        </div>
    </div>`}let B=null,O=null,yt=!1,_t=null,q=[],ft=[],tt=0,ne={},ge=[],We=null,it=0,Ot=null,st=0,ct=[],Qt=!1,wt=null,Y={},Zt=!1;function U(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}async function Je(e,t){B=e,O=t;const a=t.nation,i=t.faction;if(!a||!i)return{needed:!1};const[s,o,n,d,m,l,c]=await Promise.all([e.from("elections").select("id, election_type, election_tick, status").eq("nation_id",a.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),e.from("shard").select("current_tick").eq("name","Alpha Shard").single(),pe(e,a.id),e.from("factions").select("id, faction_name, abbreviation, party_color, seats, bloc_id").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),e.from("head_of_government").select("id").eq("nation_id",a.id).eq("active",!0).limit(1).maybeSingle(),e.from("elections").select("election_tick, election_type").eq("nation_id",a.id).eq("status","scheduled").order("election_tick",{ascending:!0}),e.from("faction_platforms").select("faction_id, platform_key, slot").eq("nation_id",a.id).eq("status","active").order("slot",{ascending:!0})]);st=o.data?.current_tick??0,q=d.data||[],tt=q.reduce((g,h)=>g+(h.seats||0),0),it=Math.ceil(tt/2)+1,ge=l?.data||[],We=n||null,ne={},c?.error&&console.warn("[CoalitionFormation] faction_platforms query failed:",c.error.message);for(const g of c?.data||[])(ne[g.faction_id]||=[]).push(g.platform_key);const r=s.data,p=n||null,f=!!m.data,v=!!p||f;return rt(a)?(yt=!1,{needed:!1}):(r&&!v?(yt=!0,_t=r.id,Ot=r.election_tick):(yt=!v,r&&(_t=r.id,Ot=r.election_tick)),{needed:yt})}function _i(){const e=O?.nation;if(!e||K(e))return"";const t=rt(e),a=ge[0]||null,i=a?.election_tick??null,s=a?.election_type||"parliamentary",o=t?s==="presidential"?"General":"Midterm":"Parliamentary",n=Number(st)||0,d=i!=null?Math.max(0,i-n):null,m=d==null?null:`${d} Month${d===1?"":"s"}`,l=i!=null?ua(i):"TBD",c=Number(e.total_seats)||0,r=Number(e.parliamentary_term_ticks)||Number(e.election_frequency)||24,p=`${r} Month${r===1?"":"s"}`,f=e.name||"Unknown",v=e.flag_url||`assets/flags/${f}.png`,g=[m,`Type: ${o}`].filter(Boolean).map(u=>`<div class="cf-eh-stat-sub">${U(u)}</div>`).join(""),h=We?.status||null,x=h?h.charAt(0).toUpperCase()+h.slice(1):null;return`<div class="cf-election-header">
        <div class="cf-eh-left">
            <div class="cf-eh-label">&bull; ELECTIONS</div>
            ${x?`<div class="cf-eh-gov-status">GOVERNMENT STATUS: <span class="cf-eh-gov-status-value">${U(x)}</span></div>`:""}
            <div class="cf-eh-title-row">
                <img class="cf-eh-flag" src="${U(v)}" alt="${U(f)} flag" onerror="this.style.display='none'">
                <h2 class="cf-eh-title">Elections of ${U(f)}</h2>
            </div>
        </div>
        <div class="cf-eh-stats">
            <div class="cf-eh-stat">
                <div class="cf-eh-stat-label">NEXT ELECTION</div>
                <div class="cf-eh-stat-value cf-eh-stat-value--accent">${U(l)}</div>
                ${g}
            </div>
            <div class="cf-eh-stat">
                <div class="cf-eh-stat-label">TOTAL SEATS</div>
                <div class="cf-eh-stat-value">${c}</div>
                <div class="cf-eh-stat-label" style="margin-top:10px;">ELECTORAL FREQUENCY</div>
                <div class="cf-eh-stat-value cf-eh-stat-value--sm">${U(p)}</div>
            </div>
        </div>
    </div>`}function $i(){const e=O?.nation;if(!e||K(e))return"";const t=Number(e.total_seats)||0;if(t<=0)return"";const a=q.filter(r=>(r.seats||0)>0).slice().sort((r,p)=>(p.seats||0)-(r.seats||0)),i=a.reduce((r,p)=>r+(p.seats||0),0),s=Math.max(0,t-i),o=Math.ceil(t/2)+1,n=o/t*100,d=a.map(r=>{const p=(r.seats||0)/t*100,f=r.party_color||"var(--text-dim)";return`<div class="cf-em-seg" style="width:${p}%;background:${U(f)};" title="${U(r.faction_name)}: ${r.seats} seats"></div>`}).join(""),m=s>0?`<div class="cf-em-seg cf-em-seg--stake" style="width:${s/t*100}%;">
               <span class="cf-em-stake-label">${s} SEATS AT STAKE</span>
           </div>`:"",l=a.map(r=>{const p=r.party_color||"var(--text-dim)";return`<div class="cf-em-chip">
            <span class="cf-em-swatch" style="background:${U(p)};"></span>
            <span class="cf-em-chip-name">${U(r.faction_name)}</span>
            <span class="cf-em-chip-count">${r.seats}</span>
            <span class="cf-em-chip-unit">seats</span>
        </div>`}).join(""),c=s>0?`<div class="cf-em-chip">
               <span class="cf-em-swatch cf-em-swatch--stake"></span>
               <span class="cf-em-chip-name">At Stake</span>
               <span class="cf-em-chip-count">${s}</span>
               <span class="cf-em-chip-unit">seats</span>
           </div>`:"";return`<div class="cf-electoral-makeup">
        <div class="cf-em-header">
            <div class="cf-em-title">&#9642; ELECTORAL MAKEUP</div>
            <div class="cf-em-meta">MAJORITY AT <span class="cf-em-majority">${o} SEATS</span> &middot; ${t} TOTAL</div>
        </div>
        <div class="cf-em-bar">
            ${d}
            ${m}
            <div class="cf-em-majority-tick" style="left:${n.toFixed(2)}%;"></div>
        </div>
        <div class="cf-em-legend">
            ${l}
            ${c}
        </div>
    </div>`}async function ut(e){if(!e)return;if(K(O.nation)){e.innerHTML=`<div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#128081;</div>
                <div class="cf-no-title">Absolute Monarchy</div>
                <div class="cf-no-desc">The Crown rules by decree. There are no elections.</div>
            </div>
        </div>`;return}const t=_i(),a=$i(),i=a?`<div class="cf-makeup-row">
               <div class="cf-makeup-left"></div>
               <div class="cf-makeup-right">${a}</div>
           </div>`:"";if(rt(O.nation)){const y=me(O.nation);e.innerHTML=`${t}${i}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#127979;</div>
                <div class="cf-no-title">${y?"Semi-Presidential System":"Presidential System"}</div>
                <div class="cf-no-desc">${y?"The President nominates a Prime Minister for parliamentary confirmation. The PM then appoints cabinet ministers. No coalition formation is required.":"The President governs directly and nominates cabinet ministers. No coalition formation is required."}</div>
            </div>
        </div>`;return}if(!yt){e.innerHTML=`${t}${i}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">✓</div>
                <div class="cf-no-title">Government Formed</div>
                <div class="cf-no-desc">A coalition government is currently active. No formation needed.</div>
            </div>
        </div>`;return}if(!_t){const y=ge[0]?.election_tick,u=y!=null?Math.max(0,y-st):"?";e.innerHTML=`${t}${i}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon" style="font-size:2rem;">&#9878;</div>
                <div class="cf-no-title">No Government</div>
                <div class="cf-no-desc">No election has been held yet. The first election is in <strong style="color:var(--accent);">${u}</strong> tick${u!==1?"s":""}.</div>
            </div>
        </div>`;return}await Mi();const s=O.faction,o=Ot!==null?Math.max(0,st-Ot):0,n=Math.max(0,te-o),d=Math.min(100,o/te*100),m=o*2;let l="safe";n<=1?l="critical":n<=2&&(l="warning");const c=l==="critical"?"⚠️":l==="warning"?"⏳":"🤝",r=l==="critical"?"No Government — Snap Election Imminent":l==="warning"?"Coalition Formation — Time Running Out":"Coalition Formation In Progress",p=l==="critical"?"Form a government immediately or face snap elections":l==="warning"?"Parties are negotiating — the deadline is approaching":"Parties are negotiating a coalition — propose or join one below",f=q.find(y=>y.id===s.id)?.seats||0,v=f>0,g=ft.some(y=>y.proposed_by===s.id);let h="";if(!v)h='<div class="cf-note">Your party has <strong>0 seats</strong>. You cannot propose a coalition, but you may be invited to one.</div>';else if(g)h='<div class="cf-note">You have already submitted a proposal for this election.</div>';else{const y=w=>(w||[]).map(L=>L.replace(/_/g," ")).join(", "),u=q.map(w=>{const L=w.id===s.id,E=w.seats||0,I=w.party_color||"#888",M=(ne[w.id]||[]).map(C=>xt.find(A=>A.id===C)).filter(Boolean).map(C=>`<div class="cf-platform">
                <span class="cf-platform-label"><span class="cf-platform-icon">${C.icon}</span> ${U(C.name)}</span>
                <span class="cf-platform-stats">
                    <span class="cf-stat-up">&uarr; ${y(C.improve)}</span>
                    <span class="cf-stat-down">&darr; ${y(C.worsen)}</span>
                </span>
            </div>`).join(""),z=M?`<div class="cf-check-platforms">${M}</div>`:'<div class="cf-check-platforms cf-check-platforms--empty">No adopted platforms.</div>';return`<div class="cf-party-check ${L?"checked disabled":""}" data-party-id="${w.id}" style="border-left:3px solid ${I};">
                <div class="cf-party-info">
                    <div class="cf-check-box">${L?"✓":""}</div>
                    <span class="cf-check-name">${U(w.faction_name)}</span>
                    <span class="cf-check-seats">${E} seats</span>
                </div>
                ${z}
            </div>`}).join("");h=`
            <div class="cf-propose-section">
                <div class="cf-section-title">Propose a Government</div>
                <div class="cf-section-desc">Select which parties will form the coalition. You need ${it}+ seats for a majority.</div>
                <div class="cf-party-grid" id="cf-party-grid">${u}</div>
                <div class="cf-seat-preview" id="cf-seat-preview">
                    Coalition seats: <span class="cf-preview-val" id="cf-preview-seats">${f}</span> / ${tt}
                    (<span id="cf-preview-pct">${tt?Math.round(f/tt*100):0}</span>%)
                    <span id="cf-preview-threshold" style="margin-left:8px;color:var(--text-dim);">— needs ${it} seats</span>
                </div>
                <button class="cf-submit-btn" id="cf-propose-btn">Submit Proposal</button>
            </div>`}const x=ft.length>0?`
        <div class="cf-section-title" style="margin-top:16px;">Active Proposals</div>
        <div class="cf-proposals-grid">${ft.map(y=>{const u=q.find(N=>N.id===y.proposed_by),w=y.party_ids||[],L=w.reduce((N,P)=>N+(q.find(R=>R.id===P)?.seats||0),0),E=tt?Math.round(L/tt*100):0,I=L>=it,k=w.map(N=>{const P=q.find(R=>R.id===N);return`<span class="cf-party-chip" style="border-left:2px solid ${P?.party_color||"#888"};">${U(P?.faction_name||"?")} · ${P?.seats||0}</span>`}).join("");let M="";y.iAmSupporting?M='<span class="cf-status cf-status--supporting">✓ SUPPORTING</span>':y.iAmInvited?M='<span class="cf-status cf-status--invited">INVITED</span>':M='<span class="cf-status cf-status--locked">NOT INVITED</span>';const z=y.iAmInvited&&!y.iAmSupporting?`<button class="cf-support-btn" data-formation-id="${y.id}" data-action="support">Support This Coalition</button>`:y.iAmSupporting?`<button class="cf-withdraw-btn" data-formation-id="${y.id}" data-action="withdraw">Withdraw Support</button>`:"",C=y.supportCount>=y.coalitionSize,A=wt===y.id,S=C&&y.iAmInvited&&!A,T=C&&A;return`<div class="cf-proposal-card ${y.iAmSupporting?"supporting":""} ${y.iAmInvited?"":"not-invited"}">
                <div class="cf-proposal-title">${U(u?.faction_name||"Unknown")} Coalition ${M}</div>
                <div class="cf-proposal-seats">Seats: <span style="color:${I?"var(--green)":"var(--red)"};">${L}</span> (${E}%) ${I?"✓":"— below threshold"}</div>
                <div class="cf-proposal-chips">${k}</div>
                <div class="cf-proposal-support">Support: ${y.supportCount} / ${y.coalitionSize} coalition members ${C?'<span style="color:var(--green);font-weight:700;"> — UNANIMOUS</span>':""}</div>
                ${z}
                ${S?`<button class="cf-support-btn" data-formation-id="${y.id}" data-action="configure" style="margin-top:6px;background:var(--green);color:#000;border-color:var(--green);">Configure Government &amp; Assign Ministries</button>`:""}
                ${T?Ei(y):""}
            </div>`}).join("")}</div>
    `:"";e.innerHTML=`${t}${i}
    <div class="cf-page">
        <!-- Formation Banner -->
        <div class="cf-banner cf-banner--${l}">
            <div class="cf-banner-header">
                <span class="cf-banner-icon">${c}</span>
                <div>
                    <div class="cf-banner-title">${r}</div>
                    <div class="cf-banner-subtitle">${p}</div>
                </div>
            </div>
            <div class="cf-countdown">
                <div class="cf-countdown-track"><div class="cf-countdown-fill cf-countdown-fill--${l}" style="width:${d}%;"></div></div>
                <div class="cf-countdown-text">${n>0?n+" tick"+(n!==1?"s":"")+" remaining":"⚡ SNAP ELECTION IMMINENT"}</div>
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
                    <div class="cf-penalty-val" style="color:var(--red);">-${m}%</div>
                    <div class="cf-penalty-label">Total Lost</div>
                </div>
            </div>
        </div>

        ${h}
        ${x}
    </div>`,ct=[s.id],Si(e)}const wi={prime_minister:"Prime Minister",interior:"Interior",foreign:"Foreign Affairs",defense:"Defense",finance:"Finance",education:"Education",healthcare:"Healthcare",labor:"Labor",justice:"Justice",trade:"Trade",energy:"Energy",transportation:"Transportation",security:"Security"};function ki(e){const t=["prime_minister","interior","foreign","defense","finance","education","healthcare","labor","justice","trade","energy","transportation"],a=["interior","foreign","defense","finance","education","healthcare","labor","justice","trade","energy","transportation"];return me(e)?t:rt(e)?a:t}function Ei(e){const t=(e.party_ids||[]).map(l=>q.find(c=>c.id===l)).filter(Boolean),a=(e.party_ids||[]).includes(O.faction?.id);Y={...e.ministry_assignments||{}};const s=O.faction?.id,o=Y.prime_minister,n=o===s;let d=`<div style="padding:12px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--accent);margin-bottom:10px;">CONFIGURE GOVERNMENT</div>
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:12px;">All coalition members can assign ministries. The party selected as Prime Minister clicks Form Government.</div>`;for(const l of la){const c=wi[l]||l,r=l==="prime_minister",p=Y[l];a&&(d+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="width:140px;font-family:var(--font-mono);font-size:10px;font-weight:${r?"700":"400"};color:${r?"var(--accent)":"var(--text-secondary)"};letter-spacing:0.5px;">${c}</span>
                <select data-ministry="${l}" class="cf-ministry-select" style="flex:1;padding:4px 8px;font-family:var(--font-mono);font-size:10px;color:var(--text-bright);background:var(--bg-body);border:1px solid var(--border-main);outline:none;">
                    <option value="">— Select Party —</option>
                    ${t.map(f=>`<option value="${f.id}" ${p===f.id?"selected":""}>${U(f.faction_name)} (${f.seats||0} seats)</option>`).join("")}
                </select>
            </div>`)}const m=!!Y.prime_minister;if(m&&n)d+=`<div style="margin-top:14px;display:flex;justify-content:flex-end;">
            <button id="cf-form-gov-btn" style="padding:10px 28px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1.5px;color:#000;background:var(--green);border:1px solid var(--green);cursor:pointer;">FORM GOVERNMENT</button>
        </div>`;else if(m&&!n){const l=t.find(c=>c.id===o);d+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(92,204,92,0.04);border:1px solid rgba(92,204,92,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Waiting for <span style="color:var(--green);font-weight:700;">${U(l?.faction_name||"PM party")}</span> to click Form Government.
        </div>`}else d+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Select a Prime Minister to enable government formation.
        </div>`;return d+="</div>",d}async function Ci(e,t){if(Zt)return;const a=Y.prime_minister;if(!a){alert("You must assign a Prime Minister first.");return}console.log("[Coalition] handleFormGovernment called. Assignments:",JSON.stringify(Y)),console.log("[Coalition] Formation:",e.id,"PM party:",a),Zt=!0;const i=document.getElementById("cf-form-gov-btn");i&&(i.disabled=!0,i.textContent="FORMING...");try{const s=O.nation,o=s.id,n=Bt(s?.name)||{},d=n.firstNames||["Alex","Maria","Carlos"],m=n.lastNames||["Garcia","Torres","Silva"],l={};for(const[h,x]of Object.entries(Y||{}))x&&(l[h]={first_name:d[Math.floor(Math.random()*d.length)],last_name:m[Math.floor(Math.random()*m.length)],age:35+Math.floor(Math.random()*25)});const{error:c}=await B.from("government_formations").update({ministry_assignments:Y,minister_names:l}).eq("id",e.id);if(c)throw new Error("Failed to save assignments: "+c.message);let r=!1;try{const h=Tt?Tt(null,s):{},{error:x}=await B.rpc("finalize_government_formation",{p_formation_id:e.id,p_caller_faction_id:O.faction.id,p_ministry_baselines:h||{}});if(x)throw x;r=!0}catch(h){console.warn("[Coalition] RPC failed, using fallback:",h.message)}r||await Ii(e),await B.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",e.id);const f=ki(s).length,{count:v}=await B.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",o).eq("is_active",!0),{count:g}=await B.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",o).eq("is_active",!0).is("party_id",null);(!v||v<f||g&&g>0)&&(console.warn(`[Coalition] Ministry invariant check failed (expected=${f}, active=${v||0}, vacant=${g||0}) — populating from assignments`),await Xe(o));try{const h={id:e.id,party_ids:e.party_ids||[],lead_party_id:Y.prime_minister};await Ne(B,o,O.nation,"election",h,q,st,O.shard?.current_date||"",Number(O.nation?.gov_approval??50))}catch(h){console.warn("[Coalition] Post-finalization administration rollover failed (non-fatal):",h.message)}await ra(B,o,a,st,{skipCoalitionCheck:!0}),yt=!1,alert("Government formed successfully!"),await ut(t)}catch(s){console.error("[Coalition] Form government failed:",s),alert("Failed to form government: "+(s.message||s))}finally{Zt=!1,i&&(i.disabled=!1,i.textContent="FORM GOVERNMENT")}}async function Ii(e){const t=O.nation.id,{error:a}=await B.from("government_formations").update({status:"cancelled"}).eq("nation_id",t).eq("status","active").neq("id",e.id);a&&console.warn("[Coalition] Failed to cancel rival formations:",a.message);const{error:i}=await B.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",e.id);if(i)throw i;const{error:s}=await B.from("nations").update({failed_formation_attempts:0}).eq("id",t);s&&console.warn("[Coalition] Failed to reset formation attempts:",s.message),await Xe(t);try{const o={id:e.id,party_ids:e.party_ids||[],lead_party_id:Y.prime_minister};await Ne(B,t,O.nation,"election",o,q,st,O.shard?.current_date||"",Number(O.nation?.gov_approval??50))}catch(o){console.warn("[Coalition] Administration rollover failed (non-fatal):",o.message)}try{const o=Y.prime_minister,n=q.find(m=>m.id===o),d=(e.party_ids||[]).map(m=>{const l=q.find(c=>c.id===m);return l?`${l.faction_name} (${l.seats||0})`:null}).filter(Boolean).join(", ");await B.from("event_log").insert({nation_id:t,event_name:"Coalition Government Formed",category:"government",fired_at_tick:st,description_used:`${n?.faction_name||"PM party"} formed a coalition government with: ${d}`,description_chosen:`${n?.faction_name||"PM party"} formed a coalition government with: ${d}`})}catch(o){console.warn("[Coalition] event_log insert failed (non-fatal):",o.message)}}async function Xe(e){let t=0;for(const[a,i]of Object.entries(Y)){if(!i)continue;const s=Bt(O.nation?.name)||{},o=s.firstNames||["Alex","Maria","Carlos"],n=s.lastNames||["Garcia","Torres","Silva"],d=o[Math.floor(Math.random()*o.length)],m=n[Math.floor(Math.random()*n.length)],l=35+Math.floor(Math.random()*25),c=Tt?Tt(a,O.nation):{},{data:r,error:p}=await B.from("ministries").update({party_id:i,minister_first_name:d,minister_last_name:m,minister_age:l,minister_approval:50,stat_baselines:c,is_active:!0}).eq("nation_id",e).eq("ministry_key",a).select("id");if(p)console.error(`[Coalition] FAILED to update ministry ${a}:`,p.message);else if(!r||r.length===0){const{error:f}=await B.from("ministries").insert({nation_id:e,ministry_key:a,ministry_name:da[a]||a,party_id:i,minister_first_name:d,minister_last_name:m,minister_age:l,minister_approval:50,stat_baselines:c,is_active:!0});f?console.error(`[Coalition] FAILED to insert ministry ${a}:`,f.message):t++}else t++}console.log(`[Coalition] Updated ${t} ministries for nation ${e}`)}async function Mi(){if(!_t){ft=[];return}const{data:e}=await B.from("government_formations").select("*").eq("election_id",_t).eq("status","active").order("created_at",{ascending:!0}),t=[];for(const a of e||[]){const{data:i}=await B.from("government_formation_support").select("faction_id, supports").eq("formation_id",a.id),s=a.party_ids||[],n=(i||[]).filter(r=>s.includes(r.faction_id)).filter(r=>r.supports).length,d=s.length,l=(i||[]).find(r=>r.faction_id===O.faction?.id)?.supports===!0,c=s.includes(O.faction?.id);t.push({...a,supportCount:n,coalitionSize:d,iAmSupporting:l,iAmInvited:c})}ft=t}let Me=!1;function Si(e){Me||(Me=!0,e.addEventListener("click",async t=>{const a=t.target.closest(".cf-party-check:not(.disabled)");if(a){const s=a.dataset.partyId,n=q.find(l=>l.id===s)?.bloc_id||null,d=!ct.includes(s),m=n?q.filter(l=>l.bloc_id===n).map(l=>l.id):[s];for(const l of m){const c=ct.indexOf(l);d&&c===-1&&ct.push(l),!d&&c>-1&&ct.splice(c,1);const r=e.querySelector(`.cf-party-check[data-party-id="${l}"]`);if(!r)continue;r.classList.toggle("checked",d);const p=r.querySelector(".cf-check-box");p&&(p.textContent=d?"✓":"")}Li();return}if(t.target.closest("#cf-propose-btn")){await Ai(e);return}const i=t.target.closest(".cf-support-btn, .cf-withdraw-btn");if(i){const s=i.dataset.formationId,o=i.dataset.action;if(o==="configure"){wt=s;const n=ft.find(d=>d.id===s);n&&(Y={...n.ministry_assignments||{}}),await ut(e)}else await Pi(s,o==="support",e);return}if(t.target.closest("#cf-form-gov-btn")){const s=ft.find(o=>o.id===wt);s&&await Ci(s,e);return}}),e.addEventListener("change",t=>{const a=t.target.closest(".cf-ministry-select");if(!a)return;const i=a.dataset.ministry,s=a.value||null;Y[i]=s,wt&&B.from("government_formations").update({ministry_assignments:Y}).eq("id",wt).then(({error:n})=>{n&&console.warn("[Coalition] Failed to save assignment:",n.message)});const o=document.getElementById("cf-form-gov-btn");if(o){const n=!!Y.prime_minister;o.disabled=!n,o.style.color=n?"#000":"var(--text-dim)",o.style.background=n?"var(--green)":"var(--bg-body)",o.style.borderColor=n?"var(--green)":"var(--border-main)",o.style.cursor=n?"pointer":"not-allowed"}}))}function Li(){const e=document.getElementById("cf-preview-seats"),t=document.getElementById("cf-preview-pct"),a=document.getElementById("cf-preview-threshold");if(!e)return;const i=ct.reduce((n,d)=>n+(q.find(m=>m.id===d)?.seats||0),0),s=tt?Math.round(i/tt*100):0,o=i>=it;e.textContent=i,e.style.color=o?"var(--green)":"var(--text-bright)",t.textContent=s,a.textContent=o?`✓ Meets ${it}-seat threshold`:`— needs ${it} seats`,a.style.color=o?"var(--green)":"var(--text-dim)"}async function Ai(e){if(Qt)return;const t=O.faction;if((q.find(n=>n.id===t.id)?.seats||0)===0)return;const i=[...new Set(ct)],s=i.reduce((n,d)=>n+(q.find(m=>m.id===d)?.seats||0),0);if(s<it){alert(`Coalition needs ${it} seats. Currently: ${s}.`);return}Qt=!0;const o=document.getElementById("cf-propose-btn");o&&(o.disabled=!0,o.textContent="Submitting...");try{const{data:n}=await B.from("shard").select("current_date").eq("name","Alpha Shard").single(),{data:d,error:m}=await B.from("government_formations").insert({nation_id:O.nation.id,election_id:_t,proposed_by:t.id,party_ids:i,status:"active",game_year:n?.current_date||""}).select().single();if(m){alert("Error: "+m.message);return}const{error:l}=await B.from("government_formation_support").upsert({formation_id:d.id,faction_id:t.id,supports:!0},{onConflict:"formation_id,faction_id"});l&&console.warn("[Coalition] Auto-support insert failed:",l.message),await ut(e)}catch(n){console.error("[Coalition] Create proposal error:",n),alert("Failed to create proposal: "+(n.message||n))}finally{Qt=!1}}async function Pi(e,t,a){try{const{error:i}=await B.from("government_formation_support").upsert({formation_id:e,faction_id:O.faction?.id,supports:t},{onConflict:"formation_id,faction_id"});i&&console.error("[Coalition] Toggle support error:",i.message),await ut(a)}catch(i){console.error("[Coalition] Toggle support error:",i)}}let Pt=null,dt=[],se=[],re=null;function J(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function Se(e){return e>=1e6?(e/1e6).toFixed(2)+"M":e>=1e3?Math.round(e/1e3)+"k":String(e)}function Ti(e){return["January","February","March","April","May","June","July","August","September","October","November","December"][e%12]+", "+(2e3+Math.floor(e/12))}function Ni(e,t){if((e.election_type||"parliamentary")==="presidential")return{label:"Presidential Election",color:"#5a8aaa"};const i=t?.end_reason||"";return i.includes("no_confidence")||i.includes("vnc")?{label:"Vote of No Confidence",color:"#d44a4a"}:i.includes("snap")||i.includes("dissolved")||i.includes("early")?{label:"Early Elections Called",color:"#c84"}:{label:"General Election",color:"#8b9a6b"}}async function zi(e,t){Pt=t;const a=document.getElementById("pa-past-elections-root");if(!a)return;a.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">Loading election history...</div>';const i=t.nation?.id;if(!i){a.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No nation data.</div>';return}const[s,o,n]=await Promise.all([e.from("elections").select("id, election_tick, election_type, status, results, created_at").eq("nation_id",i).eq("status","completed").order("election_tick",{ascending:!1}),e.from("administrations").select("*").eq("nation_id",i).order("started_at_tick",{ascending:!1}),e.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",i).eq("faction_type","party").is("abandoned_at",null)]);dt=s.data||[],se=o.data||[];const d=n.data||[],m={};for(const l of d)m[l.id]=l;for(const l of dt){const c=l.results?.votes||[];for(const r of c){const p=m[r.party_id];p?(r.color=p.party_color||"#666",r.abbreviation=p.abbreviation||r.party_name?.slice(0,3)?.toUpperCase()||"?"):(r.color="#666",r.abbreviation=r.party_name?.slice(0,3)?.toUpperCase()||"?")}}Ri(a),Qe(a)}function Ri(e){e.addEventListener("click",t=>{const a=t.target.closest("[data-election-id]");if(a){const i=a.dataset.electionId;re=re===i?null:i,Qe(e)}})}function Qe(e,t){if(dt.length===0){e.innerHTML=`<div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);margin-bottom:8px;">PAST ELECTIONS</div>
            <div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No completed elections on record.</div>
        </div>`;return}const a=Pt.faction?.id,i=Pt.nation?.total_seats||100,s=Math.ceil(i/2)+1,o=dt.map((n,d)=>{const m=re===n.id,l=(n.results?.votes||[]).sort((k,M)=>(M.seats||0)-(k.seats||0)),c=l.slice(0,3),r=n.results?.turnout_pct??0,p=n.results?.total_votes_cast??0,f=Ti(n.election_tick),v=se.find(k=>k.started_at_tick>=n.election_tick&&k.started_at_tick<=n.election_tick+5),g=se.find(k=>k.ended_at_tick!=null&&k.ended_at_tick>=n.election_tick-2&&k.ended_at_tick<=n.election_tick+2),h=Ni(n,g),x=rt(Pt.nation),y=x?"President":"PM",u=v?.prime_minister||"Unknown",w=v?.pm_party_id&&l.find(k=>k.party_id===v.pm_party_id)?.color||"#888",E=(d<dt.length-1?dt[d+1]:null)?.results?.votes||[];let I=`<div data-election-id="${n.id}" style="
            background:var(--bg-panel);border:1px solid var(--border-main);
            ${m?"border-bottom:none;":""}
        ">
            <div class="pe-row-head" style="padding:12px 20px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:10px;">
                <div class="pe-row-head-left" style="display:flex;align-items:center;gap:12px;min-width:0;flex-wrap:wrap;">
                    <div class="pe-date" style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-secondary);width:130px;">${f}</div>
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:3px 10px;color:${h.color};background:${h.color}0a;border:1px solid ${h.color}25;">${h.label.toUpperCase()}</span>
                    <div class="pe-top-chips" style="display:flex;gap:8px;margin-left:10px;flex-wrap:wrap;">
                        ${c.map(k=>`<div style="display:flex;align-items:center;gap:4px;">
                            <div style="width:8px;height:8px;background:${k.color};"></div>
                            <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${J(k.abbreviation)}</span>
                            <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:var(--text-bright);">${k.seats}</span>
                        </div>`).join("")}
                    </div>
                </div>
                <div class="pe-row-head-right" style="display:flex;align-items:center;gap:10px;flex-shrink:0;">
                    <div class="pe-leader-meta" style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
                        ${y}: <span style="color:${w};font-weight:700;">${J(u)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">${m?"▲":"▼"}</span>
                </div>
            </div>
        </div>`;if(m){const k=l.map(C=>`<div style="width:${C.seats/i*100}%;background:${C.color};height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${C.seats>=8?9:6}px;font-weight:700;color:#000;">${C.seats>=5?C.seats:""}</div>`).join(""),M=l.map(C=>{const A=C.party_id===a,S=E.find(R=>R.party_id===C.party_id),T=S?C.seats-(S.seats||0):null,P=C.seats/i*100-(C.vote_percentage||0);return`<div class="pe-tbl-row" style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);${A?`background:${C.color}08;`:""}">
                    <div class="pe-col-logo" style="width:30px;height:30px;background:${C.color}15;border:1px solid ${C.color}33;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-right:8px;">${C.abbreviation?.slice(0,2)||"?"}</div>
                    <div class="pe-col-party" style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:5px;">
                            <span style="font-size:13px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${J(C.party_name)}</span>
                            ${A?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#5c5;padding:0 3px;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15);">YOU</span>':""}
                        </div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:${C.color};">${J(C.abbreviation)}</div>
                    </div>
                    <span class="pe-col-seats" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${C.seats}</span>
                    <span class="pe-col-change" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${T!=null?T>0?"#5c5":T<0?"#c55":"var(--text-dim)":"var(--text-dim)"};">${T!=null?T>0?"▲ "+T:T<0?"▼ "+Math.abs(T):"—":"NEW"}</span>
                    <span class="pe-col-votes" style="width:70px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-bright);">${Se(C.votes||0)}</span>
                    <span class="pe-col-pct" style="width:55px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">${(C.vote_percentage||0).toFixed(1)}%</span>
                    <span class="pe-col-rep" style="width:80px;text-align:right;font-family:var(--font-mono);font-size:10px;font-weight:700;color:${Math.abs(P)<2?"var(--text-dim)":P>0?"#5c5":"#c84"};">${P>0?"+":""}${P.toFixed(1)}% <span style="font-size:8px;color:var(--text-dim);">${Math.abs(P)<2?"proportional":P>0?"overrep.":"underrep."}</span></span>
                </div>`}).join("");let z="";if(v){const C=v.coalition_parties||[],A=v.total_seats||C.reduce((W,It)=>W+(It.seats||0),0),S=A>=s,T=S?"Majority Coalition":"Minority Coalition",N=v.ended_at_tick?v.end_reason||"Ended":"Current Government",P=v.ended_at_tick?"var(--text-dim)":"#5c5",R=v.ended_at_tick?Math.abs(v.ended_at_tick-v.started_at_tick)+" ticks":"Ongoing",ta=C.map(W=>{const It=l.find(Gt=>Gt.party_id===W.party_id)?.color||"#666";return`<div style="width:${A>0?(W.seats||0)/A*100:0}%;background:${It};height:100%;"></div>`}).join(""),ea=C.map(W=>`<div style="display:flex;align-items:center;gap:4px;">
                        <div style="width:8px;height:8px;background:${l.find(Gt=>Gt.party_id===W.party_id)?.color||"#666"};"></div>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${J(W.party_name?.slice(0,3)?.toUpperCase()||"?")}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${W.seats||0}</span>
                    </div>`).join("");z=`<div style="margin:0 20px 16px;background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${w};">
                    <div style="padding:12px 16px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text-dim);">GOVERNMENT FORMED</span>
                                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 8px;color:${P};background:${P}0a;border:1px solid ${P}25;">${J(N.toUpperCase())}</span>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Lasted: ${R}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                            <div style="width:36px;height:36px;background:${w}15;border:1.5px solid ${w};display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;font-weight:700;color:${w};">${J(u.split(" ").map(W=>W[0]).join(""))}</div>
                            <div>
                                <div style="font-size:14px;font-weight:700;color:var(--text-bright);">${J(u)}</div>
                                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${x?"President":"Prime Minister"} &middot; ${J(v.pm_party_name||"")} &middot; ${T}</div>
                            </div>
                        </div>
                        <div style="display:flex;height:8px;gap:1px;margin-bottom:8px;">${ta}</div>
                        <div style="display:flex;gap:10px;align-items:center;">
                            ${ea}
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">&middot;</span>
                            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${S?"#5c5":"#c84"};">${A} seats ${S?"(majority +"+(A-s)+")":"(minority, "+(s-A)+" short)"}</span>
                        </div>
                    </div>
                </div>`}I+=`<div style="background:var(--bg-panel);border:1px solid var(--border-main);border-top:1px solid var(--border-main);">
                <!-- Context + Turnout -->
                <div style="display:flex;border-bottom:1px solid var(--border-main);">
                    <div style="flex:1;padding:12px 20px;border-right:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px;">CONTEXT</div>
                        <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${J(h.label)}</div>
                    </div>
                    <div style="width:260px;padding:12px 20px;display:flex;gap:16px;flex-shrink:0;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TURNOUT</div>
                            <div style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:${r>70?"#5c5":r>60?"#ca5":"#c84"};">${r.toFixed(1)}%</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TOTAL VOTES</div>
                            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">${Se(p)}</div>
                        </div>
                    </div>
                </div>

                <!-- Seat bar -->
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;height:18px;gap:1px;margin-bottom:6px;">${k}</div>
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
                    ${M}
                </div>

                ${z}
            </div>`}return I}).join("");e.innerHTML=`<div style="padding:12px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);">PAST ELECTIONS</span>
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">${dt.length} elections on record</span>
            </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">${o}</div>
    </div>`}let Z=null,le=!1,Le=!1,de=!1,Ae=!1,ce=!1;function Ze(e){document.querySelectorAll(".pa-subtab").forEach(t=>t.classList.toggle("active",t.dataset.panel===e)),document.querySelectorAll(".pa-panel").forEach(t=>t.classList.toggle("active",t.id==="panel-"+e)),sessionStorage.setItem("party_subtab",e),e==="actions"&&!le&&Z&&(le=!0,Ge(gt,Z)),e==="parties"&&!Le&&Z&&(Le=!0,ci(gt,Z,"pa-parties-root")),e==="election"&&!de&&Z&&(de=!0,ce?ut(document.getElementById("pa-election-root")):Je(gt,Z).then(()=>{ce=!0,ut(document.getElementById("pa-election-root"))})),e==="past-elections"&&!Ae&&Z&&(Ae=!0,zi(gt,Z))}document.getElementById("pa-subtabs").addEventListener("click",e=>{const t=e.target.closest(".pa-subtab");!t||t.classList.contains("active")||Ze(t.dataset.panel)});oa("politics",async e=>{Z=e,Je(gt,e).then(({needed:a})=>{if(ce=!0,a){const i=document.querySelector('.pa-subtab[data-panel="election"]');i&&!i.querySelector(".pa-subtab-badge")&&(i.innerHTML+='<span class="pa-subtab-badge"></span>');const s=document.querySelector('.nav-tab[data-tab="politics"]');s&&!s.querySelector(".pa-subtab-badge")&&(s.innerHTML+='<span class="pa-subtab-badge"></span>')}de&&ut(document.getElementById("pa-election-root"))});const t=sessionStorage.getItem("party_subtab");t&&t!=="actions"?Ze(t):(le=!0,await Ge(gt,e))});
