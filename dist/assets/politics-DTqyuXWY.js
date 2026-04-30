import{_supabase as gt}from"./supabase-client-qEAQbBjE.js";/* empty css                  */import{r as ea}from"./role-actions-fros7AI4.js";import{l as aa,d as Ae,i as ia}from"./common-DmgH3uJx.js";import{g as Bt,U as oa,a9 as na,W as sa}from"./political-actions-C-tXkzaR.js";import{d as K,f as pe,h as rt,o as Et,c as me,s as ra,M as la}from"./government-structure-C17uG6rl.js";import{GAME_CONFIG as lt,FORMATION_DEADLINE_TICKS as te}from"./config-kqJZ0B2B.js";import{f as da}from"./no-confidence-23MfBp12.js";import{i as ca,e as pa,g as ma,j as Te}from"./elections-dnVOPcXT.js";import{d as fa,c as va,s as ua,a as Tt}from"./stats-tIiBSaQA.js";import{tickToDate as ga}from"./utils-A98FEun4.js";import"./preload-helper-BXl3LOEh.js";import"./corp-topbar-CYaKZ_BF.js";import"./bills-CFUvRw6S.js";import"./corp-valuation-C0hsb2EQ.js";import"./budget-Bm3vvm1R.js";import"./presidential-Cls0Zngs.js";const xt=[{id:"economic_reform",name:"Economic Reform",icon:"📈",tagline:"Growth-first neoliberal agenda",desc:"Prioritize GDP, attract foreign capital, lower corporate taxes. The rising tide theory — grow the pie and worry about slicing it later.",improve:["gdp_growth","foreign_investment","currency_strength","credit","service_output","manufacturing_output"],worsen:["income_inequality","poverty_rate","union_strength","income_tax"],tradeoff:"Income inequality tends to rise. Working class sees GDP numbers go up while their wages don't."},{id:"social_justice",name:"Social Justice",icon:"⚖️",tagline:"Redistribution and equity",desc:"Raise minimum wage, expand welfare, progressive taxation. Close the gap between rich and poor through direct intervention.",improve:["minimum_wage","poverty_rate","income_inequality","social_mobility","healthcare_accessibility","education_accessibility"],worsen:["foreign_investment","gdp_growth","corporate_tax"],tradeoff:"Capital flight risk. Foreign investors avoid high-tax environments. Growth may slow."},{id:"national_security",name:"National Security",icon:"🛡️",tagline:"Borders, military, order",desc:"Strengthen defense, tighten borders, expand police powers. Safety through strength.",improve:["stability","crime_rate","terrorism","political_violence","illegal_immigration"],worsen:["freedom_index","press_freedom","civil_unrest","polarization"],tradeoff:"Freedom index drops. Minority communities disproportionately affected. International criticism."},{id:"anti_corruption",name:"Anti-Corruption",icon:"🔍",tagline:"Clean government, institutional reform",desc:"Independent judiciary, transparent budgets, prosecute the connected. Popular with voters but powerful people fight back hard.",improve:["corruption","judicial_independence","press_freedom","legitimacy","efficiency"],worsen:["stability"],tradeoff:"Short-term chaos as exposing corruption shakes institutions. Your own party's skeletons may surface."},{id:"green_transition",name:"Green Transition",icon:"🌱",tagline:"Climate and environment",desc:"Renewable energy investment, carbon taxes, emissions targets. Save the planet — but the bill comes due now, not later.",improve:["renewable_energy_pct","pollution","carbon_emissions","energy_generation"],worsen:["fuel_prices","manufacturing_output","gdp_growth","cost_of_living"],tradeoff:"Energy costs spike during transition. Rural and industrial voters feel abandoned."},{id:"industrialization",name:"Industrialization",icon:"🏭",tagline:"Factories, exports, production",desc:"Build manufacturing capacity, create blue-collar jobs, develop physical infrastructure. The backbone of a real economy.",improve:["manufacturing_output","labor_force_participation","unemployment","physical_infrastructure","gdp_growth"],worsen:["pollution","carbon_emissions","arable_land","healthcare_quality"],tradeoff:"Environment gets destroyed. Long-term health costs from industrial pollution."},{id:"digital_modernization",name:"Digital Modernization",icon:"💻",tagline:"Tech economy, connectivity",desc:"Fiber everywhere, tech sector incentives, digital government services. Leap into the future — but not everyone makes the jump.",improve:["digital_infrastructure","service_output","higher_education","academic_immigration","efficiency"],worsen:["manufacturing_output","labor_force_participation","income_inequality","urbanization"],tradeoff:"Automation displaces workers. Rural communities left behind. Tech wealth concentrates in cities."},{id:"welfare_state",name:"Welfare State",icon:"🏥",tagline:"Universal services, safety net",desc:"Free healthcare, free education, generous pensions, unemployment insurance. Cradle to grave — funded by steep taxes on everyone.",improve:["healthcare_quality","healthcare_accessibility","education_accessibility","poverty_rate","standard_of_living","happiness"],worsen:["income_tax","corporate_tax","gdp_growth","foreign_investment"],tradeoff:"Massive fiscal cost. Tax burden on middle class, not just the rich. Sustainability questioned."},{id:"populist_nationalism",name:"Populist Nationalism",icon:"🇲",tagline:"The people vs. elites and outsiders",desc:"Restrict immigration, protect domestic industry, reject globalism. Our people first. Our jobs first. Our culture first.",improve:["immigration","illegal_immigration","manufacturing_output","minimum_wage","union_strength"],worsen:["foreign_investment","academic_immigration","freedom_index","press_freedom","polarization","ethnic_diversity"],tradeoff:"International isolation. Brain drain as educated professionals emigrate. Deep social polarization."},{id:"free_market",name:"Free Market Liberalism",icon:"🏛️",tagline:"Deregulate everything",desc:"Cut taxes, cut red tape, let the market decide winners and losers. Government is the problem, not the solution.",improve:["gdp_growth","foreign_investment","credit","service_output","currency_strength"],worsen:["union_strength","minimum_wage","healthcare_accessibility","income_inequality","poverty_rate"],tradeoff:"Growth at the cost of the working class. Social safety net erodes. Boom-bust volatility."},{id:"law_and_order",name:"Law & Order",icon:"⚔️",tagline:"Tough on crime, strong institutions",desc:"More police, harsher sentences, zero tolerance. Restore order to the streets. Criminals fear the state.",improve:["crime_rate","stability","political_violence","terrorism","drug_use"],worsen:["incarceration_rate","freedom_index","civil_unrest"],tradeoff:"Prison population explodes. Minority communities targeted. Policing costs balloon."},{id:"education_first",name:"Education First",icon:"🎓",tagline:"Human capital as the long game",desc:"Fund schools, universities, research institutions, teacher salaries. The 20-year bet that the next generation will be smarter and richer.",improve:["literacy","higher_education","education_accessibility","academic_immigration","social_mobility","labor_force_participation"],worsen:["income_tax","gdp_growth"],tradeoff:"Voters don't see results before next election. Brain drain if jobs don't exist for graduates."},{id:"healthcare_reform",name:"Healthcare Reform",icon:"💊",tagline:"Fix the hospitals",desc:"More beds, more doctors, better drugs, universal coverage. Nobody dies because they can't afford treatment.",improve:["healthcare_quality","healthcare_accessibility","beds_per_100k","lifespan","drug_use"],worsen:["income_tax","gdp_growth","cost_of_living"],tradeoff:"Pharmaceutical lobby fights back. Extremely expensive. Takes multiple cycles to show results."},{id:"housing_cost",name:"Housing & Cost of Living",icon:"🏠",tagline:"The kitchen-table platform",desc:"Rent controls, public housing, affordable food, price caps on essentials. People can't eat GDP growth.",improve:["housing_affordability","cost_of_living","standard_of_living","physical_infrastructure","urbanization"],worsen:["foreign_investment","gdp_growth"],tradeoff:"Property owners and developers become your enemies. Market distortions create shortages."},{id:"energy_independence",name:"Energy Independence",icon:"⛽",tagline:"Control your own power supply",desc:"Exploit domestic oil, gas, and minerals. No more dependency on foreign energy. Cheap fuel, strong economy, sovereign power.",improve:["energy_generation","oil_and_gas","rare_minerals","fuel_prices","manufacturing_output","gdp_growth"],worsen:["pollution","carbon_emissions","renewable_energy_pct","arable_land"],tradeoff:"Climate commitments broken. Green voters abandon you. Environmental debt for future generations."},{id:"open_society",name:"Open Society",icon:"🕊️",tagline:"Liberal democracy, civil liberties",desc:"Free press, open borders, multicultural embrace, strong civil rights. A beacon of freedom — and a target for those who fear it.",improve:["freedom_index","press_freedom","immigration","academic_immigration","ethnic_diversity","happiness","judicial_independence"],worsen:["stability","illegal_immigration","polarization","terrorism"],tradeoff:"Nationalist backlash. Rural-urban divide deepens. Security vulnerabilities from openness."}],ye={gdp_growth:"GDP Growth",inflation:"Inflation",interest_rates:"Interest Rates",currency_strength:"Currency Strength",foreign_investment:"Foreign Investment",credit:"Credit",income_tax:"Income Tax",corporate_tax:"Corporate Tax",sales_tax:"Sales Tax",unemployment:"Unemployment",labor_force_participation:"Labor Force Participation",minimum_wage:"Minimum Wage",union_strength:"Union Strength",poverty_rate:"Poverty Rate",income_inequality:"Income Inequality",healthcare_quality:"Healthcare Quality",healthcare_accessibility:"Healthcare Accessibility",beds_per_100k:"Beds per 100k",lifespan:"Lifespan",drug_use:"Drug Use",literacy:"Literacy",higher_education:"Higher Education",education_accessibility:"Education Accessibility",academic_immigration:"Academic Immigration",physical_infrastructure:"Physical Infrastructure",digital_infrastructure:"Digital Infrastructure",urbanization:"Urbanization",energy_generation:"Energy Generation",renewable_energy_pct:"Renewable Energy %",arable_land:"Arable Land",rare_minerals:"Rare Minerals",oil_and_gas:"Oil & Gas",fuel_prices:"Fuel Prices",pollution:"Pollution",carbon_emissions:"Carbon Emissions",standard_of_living:"Standard of Living",happiness:"Happiness",social_mobility:"Social Mobility",crime_rate:"Crime Rate",incarceration_rate:"Incarceration Rate",religiosity:"Religiosity",stability:"Stability",legitimacy:"Legitimacy",efficiency:"Efficiency",corruption:"Corruption",press_freedom:"Press Freedom",judicial_independence:"Judicial Independence",freedom_index:"Freedom Index",polarization:"Polarization",civil_unrest:"Civil Unrest",terrorism:"Terrorism",political_violence:"Political Violence",immigration:"Immigration",illegal_immigration:"Illegal Immigration",emigration:"Emigration",ethnic_diversity:"Ethnic Diversity",cost_of_living:"Cost of Living",housing_affordability:"Housing Affordability",manufacturing_output:"Manufacturing Output",service_output:"Service Output"},fe=new Set(["inflation","unemployment","poverty_rate","income_inequality","drug_use","pollution","carbon_emissions","crime_rate","incarceration_rate","corruption","polarization","civil_unrest","terrorism","political_violence","illegal_immigration","emigration","cost_of_living","fuel_prices"]),ya=new Set(["income_tax","corporate_tax","sales_tax"]);function be(e,t){const a=fe.has(e),i=ya.has(e);return t==="improve"?a?{arrow:"↓",color:"#5cc55c"}:i?{arrow:"↑",color:"#c84"}:{arrow:"↑",color:"#5cc55c"}:a?{arrow:"↑",color:"#c55"}:i?{arrow:"↓",color:"#5cc55c"}:{arrow:"↓",color:"#c55"}}function xe(e){switch(e){case 0:return{momentum:12,penalty:0,label:"+12",color:"#5cc55c",note:"Unclaimed — full momentum"};case 1:return{momentum:6,penalty:6,label:"+6",color:"#ca5",note:"Contested by 1 rival — reduced momentum"};case 2:return{momentum:4,penalty:4,label:"+4",color:"#c84",note:"Crowded (2 rivals) — minimal momentum"};default:return{momentum:2,penalty:2,label:"+2",color:"#c84",note:`Crowded (${e} rivals) — minimal momentum`}}}function ba(e,t){return e.map(a=>{const i=xt.find(s=>s.id===a.platform_key);if(!i)return{...a,stats:[]};const r=i.improve.map(s=>{const n=a.baseline_stats?.[s],p=a.target_stats?.[s],m=Number(t?.[s]??50),o=fe.has(s);if(n==null||p==null)return{stat:s,baseline:m,target:m,current:m,progress:0,met:!1};const c=Math.abs(p-n),l=o?Math.max(0,n-m):Math.max(0,m-n),d=c>0?Math.min(1,l/c):1,f=o?m<=p:m>=p;return{stat:s,baseline:n,target:p,current:m,progress:d,met:f}});return{...a,stats:r,platformDef:i}})}const xa=["Former union organizer. Knows how to mobilize a crowd.","Disbarred attorney. Understands the legal system from the inside.","Investigative journalist. Uncovered three government scandals before going private.","Ex-military intelligence. Trained in information warfare.","Community activist. Built grassroots networks across two provinces.","Former government auditor. Knows where the money hides.","Political science professor. Publishes on institutional corruption.","NGO director. Ran anti-corruption campaigns across the continent.","Former prosecutor. Left the justice ministry over political interference.","Labor rights campaigner. Organized the dockworkers' strike of 2014.","Freelance political consultant. Has worked for opposition parties in three nations.","Student movement leader. Led the university protests. Young and fearless.","Retired diplomat. Leverages international connections for domestic pressure.","Whistleblower advocate. Runs a secure tip line used by civil servants.","Former police detective. Turned against the system after a cover-up."];function vt(e){return e>=75?{label:"Exceptional",color:"#5cc55c",desc:"Elite operative. Lawsuits are devastating, intelligence is razor-sharp."}:e>=60?{label:"Strong",color:"#a3b07e",desc:"Experienced and reliable. Can handle most opposition tasks effectively."}:e>=45?{label:"Competent",color:"#ca5",desc:"Gets the job done. Occasional missteps under pressure."}:e>=30?{label:"Developing",color:"#c84",desc:"Green but eager. Results are inconsistent. Cheap to hire."}:{label:"Weak",color:"#c55",desc:"Liability risk. May botch sensitive operations. Rock-bottom price for a reason."}}function ha(e){var t=Math.max(0,e-20)/65,a=12e4+t*28e4;return Math.round(a/25e3)*25e3}function jt(e,t){return e+Math.floor(Math.random()*(t-e+1))}function he(e){return e[Math.floor(Math.random()*e.length)]}function _a(e,t){var a=[],i=new Set,r=jt(5,7),s=Bt(t),n=s.firstNames||[],p=s.lastNames||[];if(n.length===0||p.length===0)return[];for(var m=xa.slice().sort(function(){return Math.random()-.5}),o=0;o<r;o++){var c,l,d,f=0;do c=he(n),l=he(p),d=c+" "+l,f++;while(i.has(d)&&f<20);i.add(d);var u=jt(20,85),v=jt(25,60),h=m[o%m.length],x=ha(u);a.push({nation_id:e,first_name:c,last_name:l,age:v,skill:u,background:h,hire_cost:x,status:"available"})}return a.sort(function(b,g){return g.skill-b.skill}),a}async function Ne(e,t,a){var{data:i}=await e.from("nations").select("government_type").eq("id",t).maybeSingle();if(K(i)){var{data:r}=await e.from("factions").select("seats").eq("id",a).maybeSingle();return ee({partyId:a,partySeats:r?.seats,admin:null,ministryHolder:!1,nation:i})}var[s,n,p,m]=await Promise.all([pe(e,t).catch(function(b){return console.warn("[Agitator] fetchActiveCoalition failed:",b?.message||b),null}),e.from("administrations").select("id, coalition_parties, stats_at_start, started_at_tick").eq("nation_id",t).is("ended_at_tick",null).order("started_at_tick",{ascending:!1}).limit(1).maybeSingle(),e.from("head_of_government").select("faction_id").eq("nation_id",t).eq("active",!0).maybeSingle(),e.from("presidents").select("faction_id").eq("nation_id",t).eq("is_active",!0).maybeSingle()]);if(n.error)return console.error("[Agitator] Failed to check governing status:",n.error.message),{isGoverning:!1,isOpposition:!0,label:"OPPOSITION",administration:null};var o=n.data,c=s,l=rt(i),d=p?.data?.faction_id||null,f=m?.data?.faction_id||null,u=Array.isArray(c?.party_ids)?c.party_ids.map(function(b){return{party_id:b}}):[];if(o){o.pm_party_id=d,o.president_party_id=f;var v=Array.isArray(o.coalition_parties)?o.coalition_parties:[];v.length===0&&u.length>0&&(o.coalition_parties=u)}else(c||d||f)&&(o={pm_party_id:d,president_party_id:f,coalition_parties:u});var h=!1;if(l){var{count:x}=await e.from("ministries").select("*",{count:"exact",head:!0}).eq("nation_id",t).eq("party_id",a).eq("is_active",!0);h=(x||0)>0}return ee({partyId:a,partySeats:null,admin:o,ministryHolder:h,nation:i})}function $a(e,t,a,i){return ee({partyId:e?.id,partySeats:e?.seats,admin:t,ministryHolder:a?a.has(e?.id):!1,nation:i})}function ee({partyId:e,partySeats:t,admin:a,ministryHolder:i,nation:r}){if(K(r)){var s=Number(t||0)>=1;return{isGoverning:s,isOpposition:!s,label:s?"LOYAL":"DISSIDENT",administration:null}}if(!a)return{isGoverning:!1,isOpposition:!0,label:"OPPOSITION",administration:null};var n=Array.isArray(a.coalition_parties)?a.coalition_parties:[],p=n.some(function(l){return l?typeof l=="string"?l===e:typeof l=="object"?(l.party_id||l.id)===e:!1:!1}),m=a.pm_party_id===e,o=a.president_party_id===e,c=m||p||o||rt(r)&&!!i;return{isGoverning:c,isOpposition:!c,label:c?"GOVERNING":"OPPOSITION",administration:a}}async function ze(e,t){var{data:a,error:i}=await e.from("faction_agitators").select("*").eq("faction_id",t).eq("status","active").maybeSingle();return i?(console.error("[Agitator] Failed to fetch agitator:",i.message),null):a}async function wa(e,t,a){var{data:i,error:r}=await e.from("agitator_pool").select("*").eq("nation_id",t).eq("status","available").order("skill",{ascending:!1});if(r)return console.error("[Agitator] Failed to fetch pool:",r.message),[];if(i&&i.length>0)return i;var s=_a(t,a),{data:n,error:p}=await e.from("agitator_pool").insert(s).select("*");return p?(console.error("[Agitator] Failed to insert pool:",p.message),[]):(n||[]).sort(function(m,o){return o.skill-m.skill})}async function ka(e,t,a,i){var r=await ze(e,t);if(r)return{success:!1,agitator:null,error:"You already have an active agitator."};var{data:s,error:n}=await e.from("faction_agitators").insert({faction_id:t,first_name:a.first_name,last_name:a.last_name,age:a.age,skill:a.skill,background:a.background,status:"active",hired_at_tick:i}).select("*").single();if(n)return console.error("[Agitator] Failed to hire:",n.message),{success:!1,agitator:null,error:n.message};var{error:p}=await e.from("agitator_pool").update({status:"hired",hired_by_faction_id:t}).eq("id",a.id);return p&&console.error("[Agitator] Failed to mark pool candidate as hired:",p.message),{success:!0,agitator:s,error:null}}const Nt=[{key:"finance",label:"Finance",icon:"💰"},{key:"defense",label:"Defense",icon:"🛡️"},{key:"education",label:"Education",icon:"🎓"},{key:"healthcare",label:"Health",icon:"🏥"},{key:"interior",label:"Interior",icon:"🏛️"},{key:"foreign",label:"Foreign",icon:"🌐"},{key:"justice",label:"Justice",icon:"⚖️"},{key:"labor",label:"Labor",icon:"🔨"},{key:"trade",label:"Trade",icon:"📦"},{key:"energy",label:"Energy",icon:"⚡"},{key:"transportation",label:"Transport",icon:"🚂"},{key:"agriculture",label:"Agriculture",icon:"🌾"}],Re=[{key:"misuse_of_funds",label:"Misuse of Public Funds",desc:"Alleging budget went somewhere it shouldn't."},{key:"civil_rights",label:"Violation of Civil Rights",desc:"Alleging government overreach or suppression."},{key:"negligence",label:"Breach of Duty / Negligence",desc:"Alleging a ministry failed its mandate."},{key:"corruption",label:"Corruption / Self-Dealing",desc:"Alleging officials enriched themselves."}];function ve(e){return e<=5?{tier:1,label:"Clean Government",color:"#c55"}:e<=10?{tier:2,label:"Minor Corruption",color:"#ca5"}:e<=20?{tier:3,label:"Significant Corruption",color:"#c84"}:{tier:4,label:"Systemic Corruption",color:"#5cc55c"}}const nt={1:{resolution:"FRIVOLOUS SUIT",filer:{momentum:-5,governance:-2},gov:{momentum:3,governance:1}},2:{resolution:"PARTIAL WIN",filer:{momentum:3,governance:0},gov:{momentum:-2,governance:-2}},3:{resolution:"MAJOR WIN",filer:{momentum:7,governance:2},gov:{momentum:-5,governance:-5}},4:{resolution:"DEVASTATING WIN",filer:{momentum:12,governance:5},gov:{momentum:-10,governance:-8}}},_e={1:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"Lawsuit discovery phase produces routine documents. No irregularities found in {ministry}.",evidence:"Legal team reviews {ministry} records. Auditors confirm standard procedures.",pre_trial:"Judge signals skepticism toward {party}'s claims. Case appears thin.",resolution:"{ministry} lawsuit dismissed. Courts find no evidence of wrongdoing. {party} criticized for wasting court resources."},2:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit uncovers irregular procurement contracts in {ministry}.",evidence:"Documents reveal {ministry} awarded no-bid contracts to connected firms.",pre_trial:"Judge allows case to proceed. {ministry} officials ordered to testify.",resolution:"{ministry} lawsuit concludes with partial ruling. Irregular contracts confirmed but no criminal charges filed."},3:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit exposes hidden accounts linked to {ministry} officials.",evidence:"Leaked documents show systematic overbilling in {ministry}. Millions unaccounted for.",pre_trial:"Multiple {ministry} officials refuse to testify. Judge threatens contempt.",resolution:"{ministry} scandal confirmed. Court finds evidence of systematic corruption. {party} vindicated."},4:{filing:"{party} files lawsuit against {ministry} alleging {basis}.",discovery:"{party}'s lawsuit reveals {ministry} ran parallel budget invisible to parliament.",evidence:"Court-ordered audit exposes network of shell companies receiving {ministry} funds.",pre_trial:"Prosecutors request criminal referral. Multiple {ministry} officials implicated.",resolution:"Devastating verdict: {ministry} operated criminal enterprise. Officials face prosecution. Government in crisis."}};function $t(e,t){var a=e;for(var i in t)a=a.split("{"+i+"}").join(t[i]);return a}async function Ea(e,t){var{factionId:a,nationId:i,agitatorId:r,targetMinistry:s,basis:n,currentTick:p,partyName:m,administration:o}=t,c,l,d;if(n==="civil_rights"){var f=Number(o?.stats_at_start?.freedom_index??50),{data:u,error:v}=await e.from("nations").select("freedom_index").eq("id",i).single();if(v)return{success:!1,lawsuit:null,tier:0,error:"Failed to fetch freedom index data."};l=Number(u?.freedom_index??50),c=f,d=Math.max(0,c-l)}else{var h=Number(o?.stats_at_start?.corruption??50),{data:u,error:v}=await e.from("nations").select("corruption").eq("id",i).single();if(v)return{success:!1,lawsuit:null,tier:0,error:"Failed to fetch corruption data."};l=Number(u?.corruption??50),c=h,d=Math.max(0,l-c)}var h=c,x=l,b=ve(d),g=nt[b.tier],w=p+8,L=Nt.find(function(R){return R.key===s}),M=L?"Ministry of "+L.label:s,S=Re.find(function(R){return R.key===n}),k=S?S.label:n,{data:I,error:N}=await e.from("lawsuits").insert({faction_id:a,nation_id:i,agitator_id:r,target_ministry:s,basis:n,filed_at_tick:p,resolves_at_tick:w,corruption_at_start:h,corruption_at_filing:x,corruption_growth:d,tier:b.tier,status:"active",resolution:null,momentum_effect:g.filer.momentum,governance_effect:g.filer.governance,gov_momentum_effect:g.gov.momentum,gov_governance_effect:g.gov.governance}).select("*").single();if(N)return{success:!1,lawsuit:null,tier:0,error:N.message};var E=_e[b.tier]||_e[1],z={party:m||"Opposition",ministry:M,basis:k},C=[{event_tick:p,event_type:"filing",headline:$t(E.filing,z)},{event_tick:p+2,event_type:"discovery",headline:$t(E.discovery,z)},{event_tick:p+5,event_type:"evidence",headline:$t(E.evidence,z)},{event_tick:p+7,event_type:"pre_trial",headline:$t(E.pre_trial,z)},{event_tick:w,event_type:"resolution",headline:$t(E.resolution,z)}],P=C.map(function(R){return{lawsuit_id:I.id,nation_id:i,event_tick:R.event_tick,event_type:R.event_type,headline:R.headline,is_fired:R.event_tick===p}}),{error:T}=await e.from("lawsuit_events").insert(P);T&&console.error("[Lawsuits] Failed to insert milestone events:",T.message);var{error:A}=await e.from("event_log").insert({nation_id:i,event_name:"LAWSUIT FILED",event_type:"lawsuit",category:"political",description_chosen:C[0].headline,fired_at_tick:p,faction_id:a||null,effects_applied:{lawsuit_id:I.id,tier:b.tier,target_ministry:M,basis:k,milestone:"filing"}});return A&&console.warn("[Lawsuits] event_log insert (filing) failed:",A.message),{success:!0,lawsuit:I,tier:b.tier,error:null}}async function Ca(e,t){var{data:a,error:i}=await e.from("lawsuits").select("*").eq("faction_id",t).order("filed_at_tick",{ascending:!1}).limit(10);return i?(console.error("[Lawsuits] Failed to fetch lawsuits:",i.message),[]):a||[]}let $=null,y=null,X="leader",et=[],zt=[],j=null,D=null,pt=!1,F=null,ae=[],bt=!1,G=null,at=!1,kt=[],Mt=!1,qt=!1,Pt=new Set;function _(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function Q(e,t){return((e||"?")[0]+(t||"?")[0]).toUpperCase()}const Fe=[{id:"leader",title:"LEADER",fullTitle:"Party Leader",color:"#c8a832"},{id:"deputy",title:"DEPUTY",fullTitle:"Deputy Party Leader",color:"#8b9a6b"},{id:"chief",title:"CHIEF OF STAFF",fullTitle:"Chief of Staff",color:"#5cc55c"},{id:"campaign",title:"CAMPAIGN MGR",fullTitle:"Campaign Manager",color:"#c84"},{id:"comms",title:"COMMS DIR",fullTitle:"Communications Director",color:"#5a8aaa"},{id:"agitator",title:"AGITATOR",fullTitle:"Opposition Coordinator",color:"#d44a4a",oppositionOnly:!0}],Ht=[{perSeat:5e3,momDivisor:10},{perSeat:4e3,momDivisor:8},{perSeat:3e3,momDivisor:6},{perSeat:2e3,momDivisor:5},{perSeat:1e3,momDivisor:5}];let mt=0,Rt=0,ie=!1;async function Ia(){if(!$||!y?.faction?.id||!y?.shard?.current_tick)return;const{count:e,error:t}=await $.from("campaign_actions").select("id",{count:"exact",head:!0}).eq("party_id",y.faction.id).eq("action_type","fundraise").eq("tick_performed",y.shard.current_tick);mt=!t&&e!=null?e:0}async function Ma(){if(Rt=0,ie=!1,!$||!y?.nation?.id||!y?.shard?.current_tick)return;const e=y.shard.current_tick,t=F?.pm_party_id;try{const{data:a}=await $.from("bills").select("id").eq("nation_id",y.nation.id).eq("bill_type","no_confidence").in("status",["committee","floor"]).limit(1);if(ie=!!(a&&a.length),t){const{data:i}=await $.from("campaign_actions").select("tick_performed").eq("nation_id",y.nation.id).eq("action_type","no_confidence_filed").eq("target_id",t).order("tick_performed",{ascending:!1}).limit(1).maybeSingle();if(i){const r=e-Number(i.tick_performed||0),s=typeof lt<"u"&&lt.NO_CONFIDENCE_COOLDOWN_TICKS||12;Rt=Math.max(0,s-r)}}}catch(a){console.warn("[PartyActions] loadNoConfidenceState failed:",a?.message||a)}}function Oe(e,t){const a=Ht[Math.min(t,Ht.length-1)],i=e*a.perSeat,r=Math.max(1,Math.floor(e/a.momDivisor));return{raised:i,momCost:r,perSeat:a.perSeat,tierIdx:Math.min(t,Ht.length-1)}}const Be=[{id:"fundraise",name:"Fundraise",desc:"Raise party funds proportional to your seat count. Each use yields less money and costs more momentum. Momentum cannot drop below 1.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"statement",name:"Issue Statement",desc:"Public declaration on an issue. Shifts party positioning and voter bloc reactions. Media covers it. Other parties may respond.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"platform",name:"Set Party Platform",desc:"Choose a political focus. Defines which stats you promise to change. Awards momentum based on how many rivals share the same platform.",cost:"$120k",costColor:"#c8a832",moneyCost:12e4,tags:["STRATEGIC"],locked:!1},{id:"call_early_elections",name:"Call Early Elections",desc:"Dissolve the legislature and call snap elections. PM-only. Government enters caretaker status; election fires after a short formation window. Momentum impact is tiered by Gov. Approval: >50 boosts PM party (+3), <35 boosts opposition (+5 each) and +3 stability, 35–50 is neutral.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["LEGISLATIVE","PM ONLY"],locked:!1},{id:"resign_as_pm",name:"Resign as Prime Minister",desc:"Step down from the Prime Minister seat. PM-only. Coalition enters caretaker status and has a 3-tick window to nominate a successor via the cabinet panel. If a new PM is installed the administration continues under new leadership; otherwise a snap election fires. Cost: −3 Momentum, −0.05 Credibility, −3 Stability, 12-tick bar from PM on your party.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["GOVERNMENT","PM ONLY"],locked:!1},{id:"no_confidence",name:"Vote of No Confidence",desc:"File a motion of no confidence against the Prime Minister. If a simple majority votes YES, the government falls and snap elections are triggered. PASS: +15 Momentum to you, -10 Momentum + -10 Governance to the PM’s party. FAIL: -10 Momentum to you. 12-tick cooldown on the targeted PM party.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["LEGISLATIVE","OPPOSITION"],locked:!1},{id:"leave_coalition",name:"Leave Coalition",desc:"Walk out of the current governing coalition. Any ministries your party holds are vacated. You drop from governing to opposition. Coalition flips to minority if your exit drops it below the majority threshold. Cost: −3 Momentum to you, −5 Momentum to the PM’s party. 12-tick cooldown. PM’s party cannot use this — resign first.",cost:"−3 MOM",costColor:"#c84",moneyCost:0,tags:["GOVERNMENT","RISKY"],locked:!1},{id:"disband_party",name:"Disband Party",desc:"Voluntarily dissolve your party. Your seats are vacated and sit empty until the next election (no backfill or redistribution). All party funds and momentum are lost. You are removed from every nation chat. Cannot be undone. 24-tick cooldown per user. Cannot be used while Prime Minister, sitting President, or reigning Monarch — step down first.",cost:"IRREVERSIBLE",costColor:"#c55",moneyCost:0,tags:["IRREVERSIBLE"],locked:!1}],Sa=[{id:"fundraise",name:"Fundraise",desc:"Raise royal treasury funds proportional to your seat count. Each use yields less money and costs more momentum.",cost:"MOMENTUM",costColor:"#c84",moneyCost:0,tags:["FINANCIAL","CAMPAIGN"],locked:!1},{id:"grant_seats",name:"Grant Seats",desc:"Grant parliamentary seats to a noble house. Sharing power increases legitimacy (+0.5 per seat). Hoarding >70% of seats causes tyranny decay.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1},{id:"revoke_seats",name:"Revoke Seats",desc:"Revoke seats from a noble house. Costs $100k and -1 Legitimacy per seat revoked. Use sparingly — the people do not forget.",cost:"$100k/seat",costColor:"#d44a4a",moneyCost:1e5,tags:["ROYAL","OFFENSIVE"],locked:!1},{id:"statement",name:"Royal Decree",desc:"Issue a public declaration on an issue. Shifts positioning and voter bloc reactions. Media covers it.",cost:"$20k",costColor:"#c8a832",moneyCost:2e4,tags:["PUBLIC","NARRATIVE"],locked:!1},{id:"appoint_pm",name:"Appoint Prime Minister",desc:"Choose a party to lead the government as Prime Minister. The PM can then assign cabinet ministries. You may appoint your own party.",cost:"FREE",costColor:"#5cc55c",moneyCost:0,tags:["ROYAL","STRUCTURAL"],locked:!1}],Dt={PUBLIC:"#8b9a6b",NARRATIVE:"#5a8aaa",STRATEGIC:"#c8a832",INTERNAL:"#c84",COALITION:"#5aaa8a",RISKY:"#c55",PARLIAMENTARY:"#8b9a6b",FINANCIAL:"#5a8aaa",INTELLIGENCE:"#5a8aaa",DEFENSIVE:"#5cc55c",CAMPAIGN:"#c84",VOTER:"#c8a832",OFFENSIVE:"#c84",REACTIVE:"#ca5",STRUCTURAL:"#9e9a92",ROYAL:"#c8a832",LEGAL:"#5a8aaa"},$e=[{id:"economy",label:"Economy & Jobs",icon:"💰"},{id:"healthcare",label:"Healthcare",icon:"🏥"},{id:"education",label:"Education",icon:"🎓"},{id:"security",label:"National Security",icon:"🛡️"},{id:"environment",label:"Environment",icon:"🌱"},{id:"corruption",label:"Anti-Corruption",icon:"🔍"},{id:"infrastructure",label:"Infrastructure",icon:"🏗️"},{id:"immigration",label:"Immigration",icon:"🌐"},{id:"housing",label:"Housing & Cost of Living",icon:"🏠"},{id:"crime",label:"Crime & Justice",icon:"⚖️"},{id:"labor",label:"Labor & Workers",icon:"🔨"},{id:"foreign_policy",label:"Foreign Policy",icon:"🕊️"}],we=["{party_name} Calls for Action on {topic}","{leader_name}: '{topic}' Must Be National Priority","{leader_name} Pledges Bold Agenda on {topic}","{party_name} Leader Addresses Nation on {topic}"];async function De(e,t){$=e,y=t;const a=document.getElementById("pa-actions-root");if(!a)return;const i=t.faction;if(!i){a.innerHTML='<div style="display:flex;align-items:center;justify-content:center;min-height:300px;color:var(--text-dim);">No faction data.</div>';return}try{const{data:l}=await $.from("factions").select("momentum, party_funds, seats, action_points, bloc_id").eq("id",i.id).single();l&&(i.momentum=l.momentum??i.momentum,i.party_funds=l.party_funds??i.party_funds,i.seats=l.seats??i.seats,i.action_points=l.action_points??i.action_points,i.bloc_id=l.bloc_id??null)}catch(l){console.warn("[PartyActions] faction refresh failed, using cached state:",l)}const[r,s,n,p,m,o]=await Promise.all([$.from("faction_platforms").select("*").eq("faction_id",i.id).order("slot"),$.from("faction_platforms").select("*").eq("nation_id",t.nation?.id),ze($,i.id),Ne($,t.nation?.id,i.id),$.from("faction_electoral_standing").select("visibility, raw_appeal").eq("faction_id",i.id).eq("nation_id",t.nation?.id).maybeSingle(),pe($,t.nation?.id)]);t.nation&&(t.nation.__coalition_status=o?.status||null),r.error&&console.error("[PartyActions] Failed to load faction platforms:",r.error.message),s.error&&console.error("[PartyActions] Failed to load nation platforms:",s.error.message),et=r.data||[],zt=s.data||[],j=n,pt=p.isOpposition,F=p.administration,m.data,await Ia(),await Ma();const{data:c}=await $.from("faction_deputies").select("*").eq("faction_id",i.id).eq("status","active").maybeSingle();D=c||null,j&&(ae=await Ca($,i.id)),await Ct(i.id,t.nation?.id),H(a)}function Ge(e){return e?{isPM:!!F&&F.pm_party_id===e.id,isPresident:y?.nation?.hos_election_method==="elected"&&F?.president_party_id===e.id,isMonarchActing:K(y?.nation)&&y?.nation?.monarch_faction_id===e.id}:{isPM:!1,isPresident:!1,isMonarchActing:!1}}async function Ct(e,t){if(!e||!t){G=null,at=!1,kt=[];return}try{const{data:a,error:i}=await $.from("bloc_invitations").select("id, bloc_id, invited_by_faction_id, created_at_tick, status, bloc:bloc_id(id,name,leader_faction_id), inviter:invited_by_faction_id(id,faction_name,party_color)").eq("invited_faction_id",e).eq("status","pending").order("created_at_tick",{ascending:!1});if(i)throw i;kt=a||[];const r=y?.faction?.bloc_id||null;if(r){const{data:s,error:n}=await $.from("blocs").select("*").eq("id",r).is("dissolved_at_tick",null).maybeSingle();if(n)throw n;if(s){const{data:p}=await $.from("factions").select("id, faction_name, seats, party_color, leader_first_name, leader_last_name").eq("bloc_id",s.id).order("seats",{ascending:!1});G={...s,members:p||[]},at=s.leader_faction_id===e}else G=null,at=!1}else G=null,at=!1}catch(a){console.warn("[PartyActions] loadBlocState failed:",a?.message||a)}}function je(e){if(!G)return"";const t=at?`<span style="margin-left:6px;font-family:var(--font-mono);font-size:7px;color:${e};letter-spacing:0.08em;">LEADER</span>`:"";return`<span class="pa-bloc-tag" style="display:inline-flex;align-items:center;padding:2px 8px;background:${e}18;border:1px solid ${e}55;color:${e};font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;">
        BLOC &middot; ${_(G.name)}${t}
    </span>`}function qe(e){if(!G)return"";const t=G.members||[],a=t.reduce((r,s)=>r+(Number(s.seats)||0),0),i=t.map(r=>{const s=r.id===G.leader_faction_id,n=r.party_color||e;return`<span style="display:inline-flex;align-items:center;gap:6px;padding:3px 8px;border:1px solid ${n}44;border-left:3px solid ${n};background:var(--bg-card);font-family:var(--font-mono);font-size:9px;">
            <span style="color:var(--text-bright);font-weight:700;">${_(r.faction_name||"Unknown")}</span>
            <span style="color:var(--text-dim);">${r.seats||0} seats</span>
            ${s?`<span style="color:${n};font-weight:700;letter-spacing:0.08em;">LEADER</span>`:""}
        </span>`}).join("");return`<div style="margin:8px 0;padding:8px 12px;background:${e}0a;border:1px solid ${e}33;border-left:3px solid ${e};">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
            <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${e};letter-spacing:0.08em;">BLOC &middot; ${_(G.name)}</span>
            <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${t.length} member${t.length!==1?"s":""} &middot; ${a} combined seats</span>
        </div>
        <div style="display:flex;flex-wrap:wrap;gap:4px;">${i}</div>
    </div>`}function He(e){if(!kt||kt.length===0)return"";const t=i=>(Array.isArray(i)?i[0]:i)||null;return`<div style="margin:10px 0 4px;">${kt.map(i=>{const r=t(i.bloc),s=t(i.inviter),n=r?.name||"a bloc",p=s?.faction_name||"A party leader",m=s?.party_color||e,o=Pt.has(i.id);return`<div style="margin:6px 0;padding:8px 12px;border:1px solid ${m}55;border-left:3px solid ${m};background:${m}08;display:flex;align-items:center;justify-content:space-between;gap:10px;">
            <div style="flex:1;">
                <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${m};letter-spacing:0.08em;">BLOC INVITATION</div>
                <div style="font-size:11px;color:var(--text-bright);margin-top:2px;">
                    <strong>${_(p)}</strong> invites you to join <strong>${_(n)}</strong>.
                </div>
            </div>
            <div style="display:flex;gap:6px;">
                <button class="pa-bloc-invite-btn pa-modal-btn pa-modal-btn--submit" data-invite-id="${_(i.id)}" data-decision="accept"${o?" disabled":""}>Accept</button>
                <button class="pa-bloc-invite-btn pa-modal-btn pa-modal-btn--cancel" data-invite-id="${_(i.id)}" data-decision="decline"${o?" disabled":""}>Decline</button>
            </div>
        </div>`}).join("")}</div>`}async function ue(e){const{data:t}=await $.from("factions").select("bloc_id, momentum").eq("id",e).single();t&&(y.faction.bloc_id=t.bloc_id||null,t.momentum!=null&&(y.faction.momentum=t.momentum))}async function La(e,t,a){try{const i=y?.faction?.id;if(!i)throw new Error("No active faction");const r=t==="accept"?"accept_bloc_invite":"decline_bloc_invite",s=t==="accept"?"p_accepting_faction_id":"p_declining_faction_id",{data:n,error:p}=await $.rpc(r,{p_invitation_id:e,[s]:i});if(p)throw p;if(n&&n.success===!1)throw new Error(n.error||"Unknown error");await ue(i),await Ct(i,y.nation?.id),H(a)}catch(i){console.error("[PartyActions] respondToBlocInvite failed:",i),alert(t==="accept"?`Could not accept invitation: ${i.message||i}`:`Could not decline invitation: ${i.message||i}`)}}async function Pa(e){if(!G||qt)return;const t=G,a=at?`Leaving ${t.name} will DISSOLVE the entire bloc. All ${t.members?.length||0} members will be removed and pending invitations rescinded.

Proceed?`:`Leave the ${t.name} bloc?`;if(confirm(a)){qt=!0;try{const{data:i,error:r}=await $.rpc("leave_bloc",{p_faction_id:y.faction.id});if(r)throw r;if(i&&i.success===!1)throw new Error(i.error||"Unknown error");await ue(y.faction.id),await Ct(y.faction.id,y.nation?.id),H(e)}catch(i){console.error("[PartyActions] leave_bloc failed:",i),alert(`Could not leave bloc: ${i.message||i}`)}finally{qt=!1}}}async function Aa(e){const t=document.getElementById("pa-bloc-modal");if(!t||G)return;const a=y.faction,i=a?.color||"#c8a832";t.innerHTML=`
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
    `,t.classList.add("active");const r=new Set;let s=[];const n=()=>t.classList.remove("active");document.getElementById("pa-bloc-close")?.addEventListener("click",n),document.getElementById("pa-bloc-cancel")?.addEventListener("click",n),t.addEventListener("click",l=>{l.target===t&&n()});try{const l=y.nation?.id,{data:d}=await $.from("factions").select("id, faction_name, seats, party_color, leader_first_name, leader_last_name, leader_age, bloc_id").eq("nation_id",l).eq("faction_type","party").is("abandoned_at",null),f=(d||[]).filter(v=>v.id!==a.id);s=f;const u=document.getElementById("pa-bloc-party-list");if(!u)return;if(f.length===0){u.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">No other parties in this nation.</div>';return}u.innerHTML=f.map(v=>{const h=v.party_color||"#7a7a7a",x=v.leader_first_name&&v.leader_last_name?`${v.leader_first_name} ${v.leader_last_name}`:"Party Leader",b=v.bloc_id?"Already in a bloc":null;return`<label class="pa-bloc-party-row" data-party-id="${_(v.id)}" data-ineligible="${b?"1":"0"}"
                style="display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--border-mid);border-left:3px solid ${h};cursor:${b?"not-allowed":"pointer"};opacity:${b?"0.45":"1"};">
                <input type="checkbox" class="pa-bloc-party-check" ${b?"disabled":""} style="margin:0;">
                <div style="flex:1;display:flex;flex-direction:column;gap:2px;">
                    <div style="display:flex;align-items:baseline;gap:8px;">
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${_(v.faction_name)}</span>
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${v.seats||0} seats</span>
                    </div>
                    <div style="font-size:9px;color:var(--text-secondary);">${_(x)}</div>
                    ${b?`<div style="font-family:var(--font-mono);font-size:8px;color:var(--orange);margin-top:3px;">${b}</div>`:""}
                </div>
            </label>`}).join(""),u.addEventListener("change",v=>{const h=v.target.closest(".pa-bloc-party-row");if(!h)return;if(h.dataset.ineligible==="1"){v.target.checked=!1;return}const x=h.dataset.partyId;v.target.checked?r.add(x):r.delete(x),c()})}catch(l){console.error("[PartyActions] Create Bloc modal fetch failed:",l);const d=document.getElementById("pa-bloc-party-list");d&&(d.innerHTML=`<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Failed to load parties: ${_(l.message||String(l))}</div>`)}const p=document.getElementById("pa-bloc-name"),m=document.getElementById("pa-bloc-submit"),o=document.getElementById("pa-bloc-name-count"),c=()=>{const l=(p?.value||"").trim();o&&(o.textContent=`${l.length} / 40`),m&&(m.disabled=!(l.length>0&&r.size>0)||Mt)};p?.addEventListener("input",c),m?.addEventListener("click",async()=>{if(Mt)return;const l=(p?.value||"").trim();if(!(l.length===0||r.size===0)){Mt=!0,m.disabled=!0,m.textContent="Creating...";try{const{data:d,error:f}=await $.rpc("create_bloc",{p_leader_faction_id:a.id,p_name:l,p_invitee_faction_ids:Array.from(r)});if(f)throw f;if(d&&d.success===!1)throw new Error(d.error||"Unknown error");y.faction.party_funds=Math.max(0,(y.faction.party_funds||0)-1e5),await ue(a.id),n(),await Ct(a.id,y.nation?.id),H(e)}catch(d){console.error("[PartyActions] create_bloc failed:",d),alert(`Could not create bloc: ${d.message||d}`),m.disabled=!1,m.textContent="Create Bloc & Send Invites"}finally{Mt=!1}}})}async function Ta(e){if(!G||!at)return;const t=document.getElementById("pa-bloc-modal");if(!t)return;const a=y.faction?.color||"#c8a832";t.innerHTML=`
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
        </div>`,t.classList.add("active");const i=()=>t.classList.remove("active");document.getElementById("pa-blinv-close")?.addEventListener("click",i),document.getElementById("pa-blinv-cancel")?.addEventListener("click",i),t.addEventListener("click",n=>{n.target===t&&i()});const r=y.nation?.id,s=document.getElementById("pa-blinv-list");if(!(!s||!r))try{const{data:n,error:p}=await $.from("factions").select("id, faction_name, seats, party_color, bloc_id").eq("nation_id",r).eq("faction_type","party").is("abandoned_at",null).is("bloc_id",null);if(p){s.innerHTML=`<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Failed to load parties: ${_(p.message)}</div>`;return}const m=(n||[]).filter(o=>o.id!==y.faction.id);if(m.length===0){s.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">No eligible parties to invite.</div>';return}s.innerHTML=m.map(o=>{const c=o.party_color||"#888";return`<div class="pa-blinv-row" data-faction-id="${_(o.id)}" style="padding:8px 10px;border:1px solid ${c}33;border-left:3px solid ${c};display:flex;justify-content:space-between;align-items:center;cursor:pointer;background:var(--bg-card);">
                <div>
                    <div style="font-size:11px;color:var(--text-bright);font-weight:600;">${_(o.faction_name||"Unknown")}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${o.seats||0} seats</div>
                </div>
                <button class="pa-modal-btn pa-modal-btn--submit pa-blinv-send" data-faction-id="${_(o.id)}">Invite</button>
            </div>`}).join(""),s.addEventListener("click",async o=>{const c=o.target.closest(".pa-blinv-send");if(!c)return;const l=c.dataset.factionId;if(l){c.disabled=!0,c.textContent="Sending…";try{const{error:d}=await $.rpc("invite_to_bloc",{p_bloc_id:G.id,p_invitee_faction_id:l});if(d)throw d;c.textContent="Invited",await Ct(y.faction.id,y.nation?.id),H(e)}catch(d){console.warn("[PartyActions] invite_to_bloc failed:",d),alert(`Could not invite: ${d.message||d}`),c.disabled=!1,c.textContent="Invite"}}})}catch(n){console.warn("[PartyActions] openInviteToBlocModal threw:",n),s.innerHTML='<div style="padding:10px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Unexpected error.</div>'}}function H(e){const t=y.faction,a=y.nation,i=K(a),r=i&&a?.monarch_faction_id===t?.id,s=t.color||"#c8a832",n=t.leader_first_name&&t.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown Leader",p=t.seats||0,m=a?.total_seats||120,o=m>0?Math.round(p/m*100):0;t.action_points,t.approval_rating;const c=t.momentum??50,l=t.party_funds??0,d=ba(et,a),f=[];for(let x=1;x<=3;x++){const b=et.find(g=>g.slot===x);if(b){const g=xt.find(S=>S.id===b.platform_key),w=d.find(S=>S.id===b.id),L=w?w.stats.filter(S=>S.met).length:0,M=w?w.stats.length:0;f.push({name:g?.name||b.platform_key,status:b.status,metCount:L,totalCount:M,slot:x})}else f.push(null)}const u=f.map(x=>{if(!x)return{label:"No Platform"};const b=x.status==="fulfilled"?" ✓":x.status==="failed"?" ✗":x.status==="abated"?" —":"",g=x.status==="fulfilled"?"fulfilled":x.status==="failed"?"failed":x.status==="abated"?"abated":"filled",w=x.totalCount>0?` (${x.metCount}/${x.totalCount})`:"";return{label:x.name+w+b,statusClass:g,title:`${x.metCount} of ${x.totalCount} stats on target`}}),v="$"+(l>=1e6?(l/1e6).toFixed(1)+"M":l>=1e3?Math.round(l/1e3)+"k":l),h=Math.round(Number(i?y.nation?.legitimacy??y.nation?.gov_approval??50:y.nation?.gov_approval??0));ea(e,{title:r?"Royal Court":"Party Actions",entityName:t.faction_name,entityColor:s,stats:[{label:"Party Funds",value:v,color:"var(--accent)"},{label:"Momentum",value:Number(c).toFixed(1),color:c>0?"var(--text-bright)":"var(--red)"},{label:i?"Legitimacy":"Nat. Approval",value:String(h),color:"var(--green)"}],statusBarItems:[{type:"count",label:"Seats",big:String(p),bigColor:s,dim1:`/ ${m}`,dim2:`(${o}%)`},{type:"list",label:"Platforms",items:u}],rolesContainerId:"pa-leaders",panelContainerId:"pa-actions-panel",extraHtml:`
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
        `}),document.getElementById("pa-leaders").innerHTML=Na(n,s,t),document.getElementById("pa-actions-panel").innerHTML=za(n,s,t),document.getElementById("pa-leaders")?.addEventListener("click",x=>{const b=x.target.closest(".pa-leader-card");if(!b||b.classList.contains("vacant"))return;const g=b.dataset.role;g&&g!==X&&(X=g,H(e))}),document.getElementById("pa-actions-panel")?.addEventListener("click",x=>{const b=x.target.closest(".pa-action-item");if(!b||b.classList.contains("locked"))return;const g=b.dataset.actionId;g==="fundraise"?ii(e):g==="grant_seats"?Ja(e):g==="revoke_seats"?Xa(e):g==="rally"?Da(e):g==="statement"?oi(e):g==="platform"?ni(e):g==="file_lawsuit"?Ka(e):g==="appoint_pm"?Wa(e):g==="modernize"?ja(e):g==="rebrand"?qa(e):g==="no_confidence"?ai():g==="call_early_elections"?Qa():g==="resign_as_pm"?ti():g==="leave_coalition"?Za():g==="disband_party"?ei():g==="create_bloc"?Aa(e):g==="leave_bloc"?Pa(e):g==="invite_to_bloc"&&Ta(e)}),document.getElementById("pa-actions-panel")?.addEventListener("click",async x=>{const b=x.target.closest(".pa-bloc-invite-btn");if(!b)return;const g=b.dataset.inviteId,w=b.dataset.decision;if(!(!g||!w)&&!Pt.has(g)){Pt.add(g);try{await La(g,w,e)}finally{Pt.delete(g)}}}),document.getElementById("pa-hire-agitator-btn")?.addEventListener("click",()=>Ie(e)),document.getElementById("pa-hire-agitator-panel")?.addEventListener("click",x=>{x.target.closest("#pa-hire-agitator-btn")||Ie(e)}),document.getElementById("pa-hire-deputy-btn")?.addEventListener("click",()=>Ee(e)),document.getElementById("pa-hire-deputy-panel")?.addEventListener("click",x=>{x.target.closest("#pa-hire-deputy-btn")||Ee(e)})}function Na(e,t,a){const i=K(y.nation)&&y.nation?.monarch_faction_id===a?.id;return Fe.map(r=>{const s=r.id==="leader",n=r.id==="agitator",p=X===r.id;let m,o,c,l,d;if(s){m=!1,o=e,c=Q(a.leader_first_name,a.leader_last_name),l=Be.length;const v=K(y.nation);if(v&&y.nation?.monarch_faction_id===a.id)d={text:(y.nation?.monarch_title||"KING").toUpperCase(),color:"#c8a832"};else if(v)d={text:"NOBLE HOUSE",color:"#8b9a6b"};else{const x=F?.pm_party_id===a.id,b=y.nation?.hos_election_method==="elected"&&F?.president_party_id===a.id;x?d={text:"PRIME MINISTER",color:"#5cc55c"}:b?d={text:"PRESIDENT",color:"#5cc55c"}:pt?d={text:"OPPOSITION",color:"#c84"}:d={text:"GOVERNING",color:"#8b9a6b"}}}else n&&j?(m=!1,o=`${j.first_name} ${j.last_name}`,c=Q(j.first_name,j.last_name),l=1):n&&!j?(m=!1,o="Not Hired",c="+",l=0):r.id==="deputy"&&D?(m=!1,o=`${D.first_name} ${D.last_name}`,c=Q(D.first_name,D.last_name),l=1):r.id==="deputy"&&!D?(m=!1,o="Not Hired",c="+",l=0):r.id==="campaign"?(m=!1,o="Campaign Mgr",c="CM",l=Ue.length):(m=!0,o="Vacant",c="—",l=0);const f=r.oppositionOnly&&!pt;return`
            <div class="pa-leader-card ${p?"active":""} ${m?"vacant":""} ${f?"vacant":""}"
                 data-role="${r.id}"
                 style="${p?`border-left-color:${r.color};`:""}${f?"opacity:0.35;":""}">
                ${r.oppositionOnly?`<div style="position:absolute;top:0;right:0;font-family:var(--font-mono);font-size:5px;font-weight:700;letter-spacing:0.04em;padding:1px 4px;color:${f?"var(--text-dim)":"#d44a4a"};background:${f?"rgba(100,100,100,0.1)":"rgba(212,74,74,0.1)"};border:1px solid ${f?"rgba(100,100,100,0.2)":"rgba(212,74,74,0.2)"};border-top:none;border-right:none;">${f?"IN GOVERNMENT":"OPPOSITION ONLY"}</div>`:""}
                <div class="pa-leader-top">
                    <div class="pa-leader-avatar" style="color:${r.color};background:${r.color}15;border-color:${r.color}33;">${c}</div>
                    <div class="pa-leader-info">
                        <div class="pa-leader-role">
                            <span class="pa-leader-role-label" style="color:${r.color};">${s&&i?(y.nation?.monarch_title||"King").toUpperCase():r.title}</span>
                            ${l>0?`<span class="pa-leader-role-count">${l} actions</span>`:""}
                        </div>
                        <div class="pa-leader-name">${_(o)}</div>
                        ${d?`<div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:${d.color};margin-top:2px;">${d.text}</div>`:""}
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
    `}function za(e,t,a){const i=K(y.nation),r=i&&y.nation?.monarch_faction_id===a?.id,s=Fe.find(g=>g.id===X);if(!s)return"";const n=X==="leader",p=X==="agitator",m=X==="campaign",o=X==="deputy";if(!n&&!p&&!m&&!o)return`
            <div class="pa-vacant-msg">
                <div>
                    <div class="pa-vacant-title">${_(s.fullTitle)} — Vacant</div>
                    <div class="pa-vacant-sub">This position has not been filled. Recruitment coming in a future update.</div>
                </div>
            </div>
        `;if(p&&!pt)return`
            <div class="pa-vacant-msg" style="opacity:0.4;">
                <div style="text-align:center;">
                    <div style="font-size:2rem;margin-bottom:12px;opacity:0.3;">🚫</div>
                    <div class="pa-vacant-title">Agitator Unavailable</div>
                    <div class="pa-vacant-sub" style="max-width:400px;margin:8px auto;">
                        Your party is in government. The Agitator role is only available to opposition parties.
                    </div>
                </div>
            </div>
        `;if(p&&!j)return`
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
        `;if(p&&j)return Ya(s);if(o&&!D)return`
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
        `;if(o&&D)return Oa(s);if(m)return Ga(s,a);const l=Q(a.leader_first_name,a.leader_last_name),d=a.leader_age?`, Age ${a.leader_age}`:"",f=a.seats||0,u=a.momentum??0,b=(K(y.nation)&&y.nation?.monarch_faction_id===a.id?Sa:Be).map(g=>{const w=g.tags.map(I=>`<span class="pa-action-tag" style="color:${Dt[I]||"var(--text-dim)"};">${I}</span>`).join("");let L="",M=g.cost,S=g.costColor,k=g.locked;if(g.id==="no_confidence"){const I=K(y.nation),N=!!F&&F.pm_party_id===a.id;if(I)k=!0,g.lockReason="Parliament cannot remove the Monarch’s Prime Minister. Only the Monarch can dismiss the PM.";else if(N)k=!0,g.lockReason="Your party is the Prime Minister — file from another party.";else if(ie)k=!0,g.lockReason="A motion of no confidence is already pending in Parliament.";else if(Rt>0){k=!0;const E=Rt;g.lockReason=`Cooldown: ${E} tick${E!==1?"s":""} remaining before another motion can be filed against this PM party.`}else!F||!F.pm_party_id?(k=!0,g.lockReason="No active Prime Minister to file against."):g.lockReason=""}else if(g.id==="call_early_elections"||g.id==="resign_as_pm"){const I=y.nation,N=Et(I),E=K(I),z=!!F&&F.pm_party_id===a.id;E?(k=!0,g.lockReason=g.id==="call_early_elections"?"Elections are not held under absolute monarchy. The Monarch appoints the Prime Minister.":"Prime Ministers serve at the Monarch’s pleasure. The Monarch must replace the PM via the Appoint Prime Minister royal action."):N?z?y.nation&&y.nation.__coalition_status==="caretaker"?(k=!0,g.lockReason="Government is already in caretaker mode."):g.lockReason="":(k=!0,g.lockReason="Prime Minister’s party only."):(k=!0,g.lockReason="Only parliamentary and semi-presidential systems have a PM seat.")}else if(g.id==="leave_coalition"){const I=y.nation,N=Et(I),E=!!F&&F.pm_party_id===a.id;N?pt?(k=!0,g.lockReason="You are in opposition."):E?(k=!0,g.lockReason="Prime Minister’s party cannot leave — resign first."):g.lockReason="":(k=!0,g.lockReason="Only available in parliamentary systems.")}else if(g.id==="disband_party"){const I=Ge(a);I.isPM?(k=!0,g.lockReason="You are Prime Minister — resign before disbanding."):I.isPresident?(k=!0,g.lockReason="You are the sitting President — step down before disbanding."):I.isMonarchActing?(k=!0,g.lockReason="The reigning monarch cannot disband the royal house."):g.lockReason=""}else if(g.id==="fundraise"){const I=Oe(f,mt);M=`-${I.momCost} MOM`,S="#c84",L=`<div style="margin-top:4px;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);display:flex;gap:12px;">
                <span>Raises: <span style="color:var(--accent);font-weight:700;">$${(I.raised/1e3).toFixed(0)}k</span></span>
                <span>$${(I.perSeat/1e3).toFixed(0)}k/seat × ${f}</span>
                ${mt>0?`<span style="color:var(--orange);">Use #${mt+1}</span>`:""}
            </div>`,u-I.momCost<1&&(k=!0,L+=`<div style="margin-top:3px;font-family:var(--font-mono);font-size:9px;color:var(--red);">Not enough momentum (need ${I.momCost}, have ${Number(u).toFixed(1)})</div>`)}return`
            <div class="pa-action-item ${k?"locked":""}" data-action-id="${g.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${_(g.name)}</span>
                        <div class="pa-action-tags">${w}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${S};">${M}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${_(g.desc)}</div>
                ${L}
                ${g.locked&&g.lockReason?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${_(g.lockReason)}</span></div>`:""}
            </div>
        `}).join("");return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${s.color};background:${s.color}15;border-color:${s.color}33;">${l}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${s.color};">${r?(y.nation?.monarch_title||"KING").toUpperCase():s.title}</span>
                        <span class="pa-detail-name">${_(e)}</span>
                        ${i&&y.nation?.dynasty_name?`<span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);font-style:italic;">House ${_(y.nation.dynasty_name)}</span>`:""}
                        ${je(t)}
                    </div>
                    <div class="pa-detail-meta">${r?_((y.nation?.monarch_title||"King")+" of "+(y.nation?.name||"")):_(s.fullTitle)+" &middot; "+_(a.faction_name)}${d}${(()=>{if(r)return' <span style="color:#c8a832;font-weight:700;"> &middot; '+(y.nation?.monarch_title||"MONARCH").toUpperCase()+"</span>";if(i)return' <span style="color:#8b9a6b;font-weight:700;"> &middot; NOBLE HOUSE</span>';const g=F?.pm_party_id===a.id,w=y.nation?.hos_election_method==="elected"&&F?.president_party_id===a.id;return g?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRIME MINISTER</span>':w?' <span style="color:#5cc55c;font-weight:700;"> &middot; PRESIDENT</span>':pt?' <span style="color:#c84;font-weight:700;"> &middot; OPPOSITION</span>':' <span style="color:#8b9a6b;font-weight:700;"> &middot; GOVERNING</span>'})()}</div>
                </div>
            </div>
        </div>
        ${He(t)}
        ${qe(t)}
        <div class="pa-actions-list">
            ${b}
        </div>
        <div class="pa-skill-footer">
            <span style="color:${s.color};font-weight:700;">${s.title}</span> actions are executed by the party leader. Effectiveness depends on party approval and momentum.
        </div>
    `}const Ra=[{id:"rally",name:"Hold a Rally",desc:"Invest party funds into a public rally. Higher investment improves your odds, but a bad roll can backfire. Roll 1d6 + rally bonus for momentum.",cost:"$50k-$200k",costColor:"#8b9a6b",tags:["CAMPAIGN","RISKY"],locked:!1},{id:"create_bloc",name:"Create Bloc",desc:"Found a pre-coalition alliance with other parties. Pick a name and invite any parties in your nation that aren't already in a bloc. Phase 1 is formation only — shared momentum, vote discipline, and coalition binding arrive in later phases.",cost:"$100k",costColor:"#c8a832",moneyCost:1e5,tags:["STRATEGIC","ALLIANCE"],locked:!1},{id:"leave_bloc",name:"Leave Bloc",desc:"Exit your current bloc. If you are the bloc leader, leaving dissolves the whole bloc and all pending invitations are withdrawn. Greyed out when you are not in a bloc.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["ALLIANCE"],locked:!1},{id:"invite_to_bloc",name:"Invite Party to Bloc",desc:"Send a bloc invitation to an additional party. Leader-only. Eligible parties are in your nation, not already in a bloc, and not currently in government.",cost:"$0",costColor:"var(--text-dim)",moneyCost:0,tags:["ALLIANCE"],locked:!1}],ke=[{cost:5e4,bonus:1,label:"$50k (+1)"},{cost:8e4,bonus:2,label:"$80k (+2)"},{cost:12e4,bonus:3,label:"$120k (+3)"},{cost:15e4,bonus:4,label:"$150k (+4)"},{cost:2e5,bonus:5,label:"$200k (+5)"}];function Fa(e,t){const a=e+t;return a>=8?{momentum:3,label:"Rousing Success",color:"#5cc55c"}:a>=5?{momentum:2,label:"Solid Turnout",color:"#8b9a6b"}:a>=3?{momentum:0,label:"Flat Response",color:"#ca5"}:{momentum:-2,label:"Backfire",color:"#c55"}}function Oa(e){const t=y.faction,a=t?.color||e.color,i=Ra.map(s=>{const n=s.tags.map(o=>`<span class="pa-action-tag" style="color:${Dt[o]||"var(--text-dim)"};">${o}</span>`).join("");let p=s.locked,m="";if(s.id==="create_bloc"){const o=Ge(t);G?(p=!0,m=`Already in the ${G.name} bloc.`):o.isPM||o.isPresident||o.isMonarchActing?(p=!0,m="Head of Government cannot form blocs — you already lead the coalition."):(t.party_funds||0)<1e5&&(p=!0,m="Needs $100k party funds.")}else s.id==="leave_bloc"?G?at&&(m=`Leaving dissolves ${G.name} — all members will be removed.`):(p=!0,m="You are not in a bloc."):s.id==="invite_to_bloc"&&(G?at||(p=!0,m="Only the bloc leader can send invitations."):(p=!0,m="You are not in a bloc."));return`
            <div class="pa-action-item ${p?"locked":""}" data-action-id="${s.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${_(s.name)}</span>
                        <div class="pa-action-tags">${n}</div>
                    </div>
                    <div class="pa-action-right">
                        <span class="pa-action-cost" style="color:${s.costColor};">${s.cost}</span>
                    </div>
                </div>
                <div class="pa-action-desc">${_(s.desc)}</div>
                ${m?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:7px;color:var(--orange);display:flex;align-items:center;gap:4px;"><span>⊘</span><span>${_(m)}</span></div>`:""}
            </div>
        `}).join(""),r=vt(D.skill);return`
        <div class="pa-detail-header">
            <div class="pa-detail-left">
                <div class="pa-detail-avatar" style="color:${e.color};background:${e.color}15;border-color:${e.color}33;">${Q(D.first_name,D.last_name)}</div>
                <div>
                    <div style="display:flex;align-items:baseline;gap:6px;flex-wrap:wrap;">
                        <span style="font-family:var(--font-mono);font-size:20px;font-weight:700;color:${e.color};">${e.title}</span>
                        <span class="pa-detail-name">${_(D.first_name)} ${_(D.last_name)}</span>
                        ${je(a)}
                    </div>
                    <div class="pa-detail-meta">${_(e.fullTitle)} &middot; Age ${D.age} &middot; Skill: <span style="color:${r.color};font-weight:700;">${D.skill}</span></div>
                </div>
            </div>
        </div>
        ${He(a)}
        ${qe(a)}
        <div class="pa-actions-list" id="pa-actions-panel">${i}</div>
    `}function Ba(e){const t=Bt(e),a=t.firstNames||[],i=t.lastNames||[];if(a.length===0||i.length===0)return[];const r=5+Math.floor(Math.random()*3),s=new Set,n=[];for(let p=0;p<r;p++){let m,o,c,l=0;do m=a[Math.floor(Math.random()*a.length)],o=i[Math.floor(Math.random()*i.length)],c=m+" "+o,l++;while(s.has(c)&&l<20);s.add(c);const d=20+Math.floor(Math.random()*66),f=28+Math.floor(Math.random()*30),u=Math.max(0,d-20)/65,v=Math.round((125e3+u*525e3)/25e3)*25e3;n.push({first_name:m,last_name:o,age:f,skill:d,hire_cost:v})}return n.sort((p,m)=>m.skill-p.skill)}async function Ee(e){const t=document.getElementById("pa-deputy-modal");if(!t)return;const a=y.nation?.name,i=Ba(a);let r=null;function s(){const n=r!=null?i[r]:null,p=n?vt(n.skill):null,m=i.map((l,d)=>{const f=r===d,u=vt(l.skill);return`<div class="pa-hire-row ${f?"selected":""}" data-idx="${d}">
                <div style="width:32px;height:32px;border-radius:50%;background:#8b9a6b15;border:1px solid #8b9a6b33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#8b9a6b;flex-shrink:0;">${Q(l.first_name,l.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${f?"var(--text-bright)":"var(--text-secondary)"};">${_(l.first_name)} ${_(l.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${l.skill}%;background:${u.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${u.color};">${l.skill}</span>
                    </div>
                </div>
                <div style="text-align:right;">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Age ${l.age}</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);">$${Math.round(l.hire_cost/1e3)}k</div>
                </div>
            </div>`}).join("");let o;n?o=`
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
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${n.skill}%;background:${p.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${p.color};">${n.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${p.color};margin-top:3px;font-weight:700;">${p.label}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-dep-hire-confirm" style="background:#8b9a6b;"${(y.faction?.party_funds||0)<n.hire_cost?' disabled title="Not enough funds"':""}>Hire ${_(n.first_name)}</button>
                </div>
            `:o=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;"><div style="text-align:center;">
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
                    <div style="flex:1;overflow-y:auto;">${o}</div>
                </div>
            </div>
        `;const c=()=>t.classList.remove("active");document.getElementById("pa-dep-close")?.addEventListener("click",c),t.onclick=l=>{l.target===t&&c()},document.getElementById("pa-dep-list")?.addEventListener("click",l=>{const d=l.target.closest(".pa-hire-row");d&&(r=parseInt(d.dataset.idx,10),s())}),document.getElementById("pa-dep-hire-confirm")?.addEventListener("click",async()=>{if(r==null)return;const l=i[r],d=y.faction?.party_funds||0;if(d<l.hire_cost){alert("Not enough funds.");return}const f=document.getElementById("pa-dep-hire-confirm");f&&(f.disabled=!0,f.textContent="Hiring...");try{const u=d-l.hire_cost,v=y.shard?.current_tick||0,{data:h,error:x}=await $.from("faction_deputies").insert({faction_id:y.faction.id,first_name:l.first_name,last_name:l.last_name,age:l.age,skill:l.skill,status:"active",hired_at_tick:v}).select("*").single();if(x){alert("Failed: "+x.message);return}await $.from("factions").update({party_funds:u}).eq("id",y.faction.id),y.faction.party_funds=u,D=h,X="deputy",c(),H(e)}catch(u){console.error("[Deputy] Hire error:",u)}finally{f&&(f.disabled=!1)}})}t.classList.add("active"),s()}function Da(e){const t=document.getElementById("pa-rally-modal");if(!t||!D)return;const i=y.faction.party_funds||0;let r=null,s=null;function n(){const p=ke.map((c,l)=>{const d=i>=c.cost,f=r===l;return`<div class="pa-action-item ${f?"selected":""} ${d?"":"locked"}" data-tier="${l}" style="cursor:${d?"pointer":"not-allowed"};${f?"border-color:#8b9a6b;background:rgba(139,154,107,0.06);":""}">
                <div class="pa-action-top">
                    <span style="font-size:13px;font-weight:700;color:${f?"#8b9a6b":"var(--text-bright)"};">$${Math.round(c.cost/1e3)}k Investment</span>
                    <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:#8b9a6b;">+${c.bonus} Rally Bonus</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:2px;">Roll 1d6 + ${c.bonus} = range ${1+c.bonus} to ${6+c.bonus}</div>
            </div>`}).join("");let m="";s&&(m=`
                <div style="padding:16px;background:${s.color}08;border:1px solid ${s.color}22;margin-top:12px;">
                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${s.color};margin-bottom:4px;">${s.label}</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);margin-bottom:6px;">
                        Die roll: <strong>${s.dieRoll}</strong> + Rally bonus: <strong>${s.bonus}</strong> = <strong>${s.total}</strong>
                    </div>
                    <div style="font-family:var(--font-mono);font-size:16px;font-weight:700;color:${s.color};">
                        ${s.momentum>=0?"+":""}${s.momentum} Momentum
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
                    <div id="rally-tiers">${p}</div>

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
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="rally-cancel">${s?"Close":"Cancel"}</button>
                    ${s?"":`<button class="pa-modal-btn pa-modal-btn--submit" id="rally-submit" style="background:#8b9a6b;" ${r==null?"disabled":""}>Hold Rally</button>`}
                </div>
            </div>
        `;const o=()=>{t.classList.remove("active"),s&&H(e)};document.getElementById("rally-close")?.addEventListener("click",o),document.getElementById("rally-cancel")?.addEventListener("click",o),t.onclick=c=>{c.target===t&&o()},document.getElementById("rally-tiers")?.addEventListener("click",c=>{const l=c.target.closest("[data-tier]");!l||l.classList.contains("locked")||(r=parseInt(l.dataset.tier,10),n())}),document.getElementById("rally-submit")?.addEventListener("click",async()=>{if(r==null||s)return;const c=ke[r],{data:l}=await $.from("factions").select("party_funds, momentum").eq("id",y.faction.id).single(),d=l?.party_funds||0;if(d<c.cost){alert("Not enough funds.");return}y.faction.party_funds=d,y.faction.momentum=l?.momentum??y.faction.momentum;const f=document.getElementById("rally-submit");f&&(f.disabled=!0,f.textContent="Rolling...");try{const u=1+Math.floor(Math.random()*6),v=Fa(u,c.bonus),h=d-c.cost,x=Math.max(1,(y.faction.momentum||0)+v.momentum);await $.from("factions").update({party_funds:h,momentum:x}).eq("id",y.faction.id);const b=y.shard?.current_tick||0;await $.from("campaign_actions").insert({party_id:y.faction.id,nation_id:y.nation?.id,action_type:"rally",ap_cost:0,money_cost:c.cost,tick_performed:b,result:{dieRoll:u,bonus:c.bonus,total:u+c.bonus,momentum:v.momentum,momentumDelta:v.momentum,label:v.label,outcomeName:v.label}}),y.faction.party_funds=h,y.faction.momentum=x,sessionStorage.removeItem("nationhood_state"),s={...v,dieRoll:u,bonus:c.bonus,total:u+c.bonus},n()}catch(u){console.error("[Rally] Error:",u),alert("Rally failed.")}})}t.classList.add("active"),n()}const Ue=[{id:"modernize",name:"Modernize Image",desc:"Upload a custom logo to refresh your party's brand. Grants +1 Momentum/tick while a custom logo is active. Quick and affordable.",cost:"$50k",costColor:"#5a8aaa",moneyCost:5e4,tags:["CAMPAIGN","BRANDING"],locked:!1},{id:"rebrand",name:"Rebrand Party",desc:'Change your party name, abbreviation, color, logo, and description. Costly but grants a "Fresh Start" modifier. Nuclear option after scandal or major defeat.',cost:"$150k",costColor:"#c84",moneyCost:15e4,tags:["CAMPAIGN","STRUCTURAL"],locked:!1}],Ce=[{id:"crimson",hex:"#c43a3a",name:"Crimson"},{id:"scarlet",hex:"#d45a2a",name:"Scarlet"},{id:"amber",hex:"#c8a832",name:"Amber"},{id:"gold",hex:"#d4a017",name:"Gold"},{id:"olive",hex:"#8a9a4a",name:"Olive"},{id:"emerald",hex:"#2a8a4a",name:"Emerald"},{id:"forest",hex:"#3a6a3a",name:"Forest"},{id:"teal_c",hex:"#2a8a7a",name:"Teal"},{id:"sky",hex:"#4a8aba",name:"Sky"},{id:"cobalt",hex:"#3a5a9a",name:"Cobalt"},{id:"navy",hex:"#2a3a6a",name:"Navy"},{id:"violet",hex:"#7a4a9a",name:"Violet"},{id:"plum",hex:"#8a3a7a",name:"Plum"},{id:"rose",hex:"#ba4a6a",name:"Rose"},{id:"slate",hex:"#5a6a7a",name:"Slate"},{id:"iron",hex:"#4a4a4a",name:"Iron"}],oe=[{emoji:"🏛️",name:"Parliament"},{emoji:"⚖️",name:"Scales"},{emoji:"🗽",name:"Liberty"},{emoji:"🕊️",name:"Dove"},{emoji:"🦅",name:"Eagle"},{emoji:"🦁",name:"Lion"},{emoji:"🐻",name:"Bear"},{emoji:"🐉",name:"Dragon"},{emoji:"🐘",name:"Elephant"},{emoji:"🏔️",name:"Mountain"},{emoji:"🌊",name:"Wave"},{emoji:"🔥",name:"Flame"},{emoji:"⭐",name:"Star"},{emoji:"🌟",name:"Glow Star"},{emoji:"💎",name:"Diamond"},{emoji:"🛡️",name:"Shield"},{emoji:"⚔️",name:"Swords"},{emoji:"🏗️",name:"Builder"},{emoji:"🌿",name:"Leaf"},{emoji:"🌾",name:"Wheat"},{emoji:"🔨",name:"Hammer"},{emoji:"⚡",name:"Lightning"},{emoji:"🎯",name:"Target"},{emoji:"🏴",name:"Flag"},{emoji:"🚩",name:"Red Flag"},{emoji:"✊",name:"Fist"},{emoji:"🤝",name:"Handshake"},{emoji:"📜",name:"Scroll"},{emoji:"🗳️",name:"Ballot"},{emoji:"👑",name:"Crown"}];function Ga(e,t){const a=Ue.map(i=>{const r=i.tags.map(s=>`<span class="pa-action-tag" style="color:${Dt[s]||"var(--text-dim)"};">${s}</span>`).join("");return`
            <div class="pa-action-item ${i.locked?"locked":""}" data-action-id="${i.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${_(i.name)}</span>
                        <div class="pa-action-tags">${r}</div>
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
    `}function ja(e){const t=document.getElementById("pa-modernize-modal");if(!t)return;const a=y.faction;let i=null,r=a.custom_logo_url||null,s=!1;function n(){const p=!!r,o=Number(a.party_funds??0)>=5e4,c=!!i&&o&&!s;t.innerHTML=`
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
                    <div style="width:80px;height:80px;border:2px dashed ${p?"var(--accent)":"var(--border-mid)"};border-radius:8px;display:flex;align-items:center;justify-content:center;overflow:hidden;background:var(--bg-card);">
                        ${r?`<img src="${_(r)}" style="width:100%;height:100%;object-fit:cover;">`:'<span style="font-size:24px;color:var(--text-dim);">+</span>'}
                    </div>
                    <div style="text-align:center;">
                        <label style="display:inline-block;padding:6px 16px;font-family:var(--font-mono);font-size:10px;font-weight:700;color:var(--text-bright);background:var(--bg-card);border:1px solid var(--border-mid);cursor:pointer;letter-spacing:0.06em;">
                            ${p?"CHANGE LOGO":"UPLOAD LOGO"}
                            <input type="file" accept="image/*" id="mod-file-input" style="display:none;">
                        </label>
                        ${a.custom_logo_url&&!i?'<div style="font-family:var(--font-mono);font-size:8px;color:var(--green);margin-top:6px;">Current logo active — +1 Momentum/tick</div>':""}
                        ${i?'<div style="font-family:var(--font-mono);font-size:8px;color:var(--accent);margin-top:6px;">New logo ready to upload</div>':""}
                    </div>
                    ${o?"":'<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">Insufficient funds. Need $50k.</div>'}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="mod-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="mod-submit" ${c?"":"disabled"} style="background:#5a8aaa;">Modernize — $50k</button>
                </div>
            </div>
        `,document.getElementById("mod-close")?.addEventListener("click",()=>t.classList.remove("active")),document.getElementById("mod-cancel")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=l=>{l.target===t&&t.classList.remove("active")},document.getElementById("mod-file-input")?.addEventListener("change",l=>{const d=l.target.files?.[0];if(d){if(d.size>2*1024*1024){alert("Logo must be under 2MB.");return}i=d,r=URL.createObjectURL(d),n()}}),document.getElementById("mod-submit")?.addEventListener("click",async()=>{if(s||!i)return;s=!0;const l=document.getElementById("mod-submit");l&&(l.disabled=!0,l.textContent="Uploading...");try{const d=i.name.split(".").pop()?.toLowerCase()||"png",f=`${a.id}/logo_${Date.now()}.${d}`,{error:u}=await $.storage.from("party-logos").upload(f,i,{cacheControl:"3600",upsert:!0,contentType:i.type});if(u)throw new Error("Upload failed: "+u.message);const{data:v}=$.storage.from("party-logos").getPublicUrl(f),h=v?.publicUrl;if(!h)throw new Error("Failed to get logo URL");const x=Math.max(0,Number(a.party_funds??0)-5e4),{error:b}=await $.from("factions").update({custom_logo_url:h,party_funds:x}).eq("id",a.id);if(b)throw b;a.custom_logo_url=h,a.party_funds=x,t.classList.remove("active"),alert("Logo updated! Your party now earns +1 Momentum/tick from the modernized image."),H(e)}catch(d){alert("Modernize failed: "+(d.message||"Error")),s=!1,l&&(l.disabled=!1,l.textContent="Modernize — $50k")}})}t.classList.add("active"),n()}function qa(e){const t=document.getElementById("pa-rebrand-modal");if(!t)return;const a=y.faction;y.nation;const i=a.momentum??50;(y._allParties||[]).filter(d=>d.id!==a.id);const r={current:a.party_color||"#4a8aba"},s={current:0},n={current:a.custom_logo_url||null},p={current:null},m={current:!!a.custom_logo_url},o={current:!1};function c(){return r.current}function l(){const d=c(),f=Ce.find(M=>M.hex===d)?.name||"Custom",u=oe[s.current]?.emoji||"🏛️",v=m.current&&(n.current||p.current),h=n.current||(p.current?URL.createObjectURL(p.current):null),x=document.getElementById("rb-name")?.value??a.faction_name??"",b=document.getElementById("rb-abbr")?.value??a.abbreviation??"",g=document.getElementById("rb-desc")?.value??"",w=Ce.map(M=>{const S=d===M.hex;return`<div class="rb-color-swatch ${S?"selected":""}" data-hex="${M.hex}" style="background:${M.hex};${S?`box-shadow:0 0 8px ${M.hex}44;border:2px solid var(--text-bright);`:""}">
                ${S?'<span style="font-size:10px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,0.5);">✓</span>':""}
            </div>`}).join(""),L=oe.map((M,S)=>{const k=s.current===S;return`<div class="rb-logo-item ${k?"selected":""}" data-idx="${S}" style="${k?`background:${d}15;border:2px solid ${d};box-shadow:0 0 6px ${d}33;`:""}">
                ${M.emoji}
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
                            <input class="pa-modal-input" id="rb-abbr" value="${_(b)}" maxlength="4" style="width:100px;font-size:15px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;color:${d};">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">2-4 uppercase letters</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Description</div>
                            <textarea class="pa-modal-input" id="rb-desc" rows="3" style="resize:vertical;font-family:var(--font-ui);font-size:11px;line-height:1.5;">${_(g)}</textarea>
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${g.length}/200 · Visible to all</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Color — <span style="color:${d};">${_(f)}</span></div>
                            <div style="display:grid;grid-template-columns:repeat(8,1fr);gap:4px;" id="rb-colors">${w}</div>
                        </div>
                        <div style="margin-bottom:14px;">
                            <div class="pa-modal-step-label">Party Logo — ${v?'<span style="color:var(--teal);">Custom</span>':"Preset"}</div>
                            <div style="display:grid;grid-template-columns:repeat(10,1fr);gap:3px;margin-bottom:8px;${v?"opacity:0.3;":""}" id="rb-logos">${L}</div>
                            <!-- Custom upload section -->
                            <div style="border:1px ${v?"solid var(--teal)":"dashed var(--border-mid)"};padding:10px 14px;background:${v?"rgba(90,170,138,0.04)":"var(--bg-card)"};">
                                ${v&&h?`
                                    <div style="display:flex;align-items:center;gap:12px;">
                                        <img src="${h}" style="width:48px;height:48px;object-fit:contain;border:1px solid var(--border-main);background:var(--bg-card);" alt="Custom logo">
                                        <div style="flex:1;">
                                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--teal);font-weight:700;">CUSTOM LOGO ACTIVE</div>
                                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);margin-top:2px;">${p.current?p.current.name:"Saved logo"}</div>
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
                        <div style="background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${d};padding:10px;">
                            <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                                <div style="width:40px;height:40px;background:${d}15;border:1.5px solid ${d};display:flex;align-items:center;justify-content:center;font-size:22px;overflow:hidden;">
                                    ${v&&h?`<img src="${h}" style="width:100%;height:100%;object-fit:contain;" alt="">`:u}
                                </div>
                                <div>
                                    <div style="font-size:12px;font-weight:700;color:var(--text-bright);line-height:1.2;">${_(x||"Party Name")}</div>
                                    <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:${d};letter-spacing:1px;">${_(b||"???")}</div>
                                </div>
                            </div>
                            <div style="font-size:9px;color:var(--text-secondary);line-height:1.5;">${_(g||"No description...")}</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:var(--text-dim);margin-bottom:3px;">BADGES</div>
                            <div style="display:flex;gap:3px;flex-wrap:wrap;">
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${d};background:${d}0a;border:1px solid ${d}25;">${_(b)}</span>
                                <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;padding:2px 6px;color:${d};background:${d}0a;border:1px solid ${d}25;">MEMBER</span>
                            </div>
                        </div>
                        <div style="padding:6px 8px;background:${d}08;border:1px solid ${d}25;display:flex;align-items:center;gap:8px;">
                            <div style="width:20px;height:20px;background:${d};"></div>
                            <div>
                                <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${d};">${_(f.toUpperCase())}</div>
                                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${d}</div>
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
                        ${o.current?'<span style="color:#d44a4a;font-weight:700;">⚠ Final confirmation. This costs $150k, 10 Momentum, and -3 approval. Cannot rebrand again for 120 ticks.</span>':"This will change your party's identity across all UI, media, and diplomatic channels."}
                    </div>
                    <div style="display:flex;gap:6px;">
                        ${o.current?`
                            <button class="pa-modal-btn pa-modal-btn--cancel" id="rb-back">Go Back</button>
                            <button class="pa-modal-btn" id="rb-confirm" style="background:#d44a4a;color:#fff;">⚠ Confirm Rebrand</button>
                        `:`
                            <button class="pa-modal-btn pa-modal-btn--cancel" id="rb-cancel">Cancel</button>
                            <button class="pa-modal-btn pa-modal-btn--submit" id="rb-submit" style="background:#c84;">Rebrand</button>
                        `}
                    </div>
                </div>
            </div>
        `}t._rbCustomLogoFile=null,t._rbCustomLogoUrl=n.current,t._rbUseCustomLogo=m.current,l(),t.classList.add("active"),t.addEventListener("change",function(f){if(f.target.id==="rb-logo-file"){const u=f.target.files?.[0];if(!u)return;if(u.size>2*1024*1024){alert("Logo must be under 2MB. Selected file: "+(u.size/(1024*1024)).toFixed(1)+"MB"),f.target.value="";return}if(!["image/png","image/jpeg","image/svg+xml","image/webp"].includes(u.type)){alert("Unsupported file type. Use PNG, JPG, SVG, or WebP."),f.target.value="";return}p.current=u,n.current=null,m.current=!0,t._rbCustomLogoFile=u,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!0,l()}}),t.addEventListener("click",function d(f){if(f.target===t||f.target.closest("#rb-close")||f.target.closest("#rb-cancel")){t.classList.remove("active"),t.removeEventListener("click",d);return}const u=f.target.closest(".rb-color-swatch");if(u){r.current=u.dataset.hex,l();return}const v=f.target.closest(".rb-logo-item");if(v){s.current=parseInt(v.dataset.idx)||0,m.current=!1,t._rbUseCustomLogo=!1,l();return}if(f.target.closest("#rb-remove-logo")){n.current=null,p.current=null,m.current=!1,t._rbCustomLogoFile=null,t._rbCustomLogoUrl=null,t._rbUseCustomLogo=!1,l();return}if(f.target.closest("#rb-submit")){const h=document.getElementById("rb-name")?.value?.trim()||"",x=document.getElementById("rb-abbr")?.value?.trim()||"";if(h.length<3||x.length<2){alert("Name must be 3+ chars, abbreviation 2-4 chars.");return}o.current=!0,l();return}if(f.target.closest("#rb-back")){o.current=!1,l();return}if(f.target.closest("#rb-confirm")){Ha(t,e,d);return}})}async function Ha(e,t,a){const i=y.faction,r=document.getElementById("rb-name")?.value?.trim()||"",s=document.getElementById("rb-abbr")?.value?.trim()||"";document.getElementById("rb-desc")?.value?.trim();const n=document.querySelector(".rb-color-swatch.selected")?.dataset?.hex||i.party_color,p=document.querySelector(".rb-logo-item.selected")?.dataset?.idx,m=p!=null?oe[parseInt(p)]?.emoji:null,o=e._rbCustomLogoFile,c=e._rbUseCustomLogo,l=e._rbCustomLogoUrl,d=document.getElementById("rb-confirm");d&&(d.disabled=!0,d.textContent="Rebranding...");try{const f=y.shard?.current_tick||0;let u=l;if(c&&o){const g=o.name.split(".").pop()?.toLowerCase()||"png",w=`${i.id}/logo_${Date.now()}.${g}`,{data:L,error:M}=await $.storage.from("party-logos").upload(w,o,{cacheControl:"3600",upsert:!0,contentType:o.type});if(M){console.error("[Rebrand] Logo upload failed:",M.message),alert("Logo upload failed: "+M.message);return}const{data:S}=$.storage.from("party-logos").getPublicUrl(w);u=S?.publicUrl||null}else c||(u=null);const v=15e4,h=i.party_funds||0;if(h<v){alert(`Not enough funds. You have $${Math.round(h/1e3)}k, need $150k.`);return}const x=h-v,b=Math.max(1,(i.momentum||0)-10);await $.from("factions").update({party_funds:x,momentum:b,faction_name:r,abbreviation:s.toUpperCase(),party_color:n,party_logo:c?null:m,custom_logo_url:u,rebrand_cooldown_until_tick:f+120}).eq("id",i.id),await $.from("campaign_actions").insert({party_id:i.id,nation_id:y.nation?.id,action_type:"rebrand",ap_cost:3,money_cost:0,tick_performed:f,result:{oldName:i.faction_name,newName:r,oldAbbr:i.abbreviation,newAbbr:s,oldColor:i.party_color,newColor:n}}),i.party_funds=x,i.momentum=b,i.faction_name=r,i.abbreviation=s.toUpperCase(),i.party_color=n,i.party_logo=c?null:m,i.custom_logo_url=u,e.classList.remove("active"),e.removeEventListener("click",a),H(t)}catch(f){console.error("[PartyActions] Rebrand error:",f),alert("Failed to rebrand: "+(f.message||f))}finally{d&&(d.disabled=!1,d.textContent="⚠ Confirm Rebrand")}}const Ua=[{id:"file_lawsuit",name:"File Lawsuit",desc:"Sue a government ministry alleging corruption or negligence. 8-tick timeline with milestone events. Outcome depends on actual corruption growth since government took office.",cost:"$250k",costColor:"#c8a832",moneyCost:25e4,tags:["LEGAL","OFFENSIVE"],locked:!1}];function Ya(e){const t=j,a=Q(t.first_name,t.last_name),i=vt(t.skill),r=pt?'<span style="color:#5cc55c;margin-left:6px;">✓ IN OPPOSITION</span>':'<span style="color:#c84;margin-left:6px;">⚠ IN GOVERNMENT (actions limited)</span>',s=Ua.map(n=>{const p=n.tags.map(m=>`<span class="pa-action-tag" style="color:${Dt[m]||"var(--text-dim)"};">${m}</span>`).join("");return`
            <div class="pa-action-item ${n.locked?"locked":""}" data-action-id="${n.id}">
                <div class="pa-action-top">
                    <div style="display:flex;align-items:center;gap:8px;">
                        <span class="pa-action-name">${_(n.name)}</span>
                        <div class="pa-action-tags">${p}</div>
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
                    <div class="pa-detail-meta">${_(e.fullTitle)}, Age ${t.age}${r}</div>
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
            ${s}
        </div>
        ${Va()}
        <div class="pa-skill-footer">
            <span style="color:${e.color};font-weight:700;">${e.title}</span> skill (${t.skill}/100) affects lawsuit discovery and legal action outcomes. <span style="color:${i.color};font-weight:700;">${i.label}</span>: ${i.desc}
        </div>
    `}function Va(){if(ae.length===0)return"";const e=y.shard?.current_tick||0;return`
        <div class="pa-ls-section">
            <div class="pa-ls-section-title">Legal Actions</div>
            ${ae.map(a=>{const i=Nt.find(x=>x.key===a.target_ministry),r=i?i.label:a.target_ministry,s=i?i.icon:"⚖️",n=ve(a.corruption_growth||0),p=nt[a.tier]||nt[1],m=a.status==="active",o=Math.max(0,e-a.filed_at_tick),c=8,l=Math.min(1,o/c),d=Math.max(0,a.resolves_at_tick-e),f=[{tick:0,label:"Filed",type:"filing"},{tick:2,label:"Discovery",type:"discovery"},{tick:5,label:"Evidence",type:"evidence"},{tick:7,label:"Pre-trial",type:"pre_trial"},{tick:8,label:"Verdict",type:"resolution"}],u=f.map(x=>{const b=a.filed_at_tick+x.tick,g=e>=b,w=e>=b&&(x.tick===8||e<a.filed_at_tick+f[f.indexOf(x)+1]?.tick),L=x.tick/c*100;return`<div class="pa-ls-milestone ${g?"passed":""} ${w?"current":""}" style="left:${L}%;" title="${x.label} (Tick ${b})">
                <div class="pa-ls-milestone-dot"></div>
                <div class="pa-ls-milestone-label">${x.label}</div>
            </div>`}).join("");let v="";if(!m){const x=p===nt[1]?"FRIVOLOUS":p===nt[2]?"PARTIAL WIN":p===nt[3]?"MAJOR WIN":"DEVASTATING",b=a.tier===1?"var(--red)":a.tier===2?"#ca5":a.tier===3?"#c84":"var(--green)";v=`<span class="pa-ls-tier-badge" style="color:${b};border-color:${b}44;background:${b}0a;">${x}</span>`}const h=m?"":`
            <div style="display:flex;gap:12px;margin-top:6px;font-family:var(--font-mono);font-size:8px;">
                <span style="color:${a.momentum_effect>=0?"var(--green)":"var(--red)"};">You: ${a.momentum_effect>=0?"+":""}${a.momentum_effect} Mom</span>
                <span style="color:${a.governance_effect>=0?"var(--green)":"var(--red)"};">${a.governance_effect>=0?"+":""}${a.governance_effect} Gov</span>
                <span style="color:${a.gov_momentum_effect>=0?"var(--green)":"var(--red)"};">Govt: ${a.gov_momentum_effect>=0?"+":""}${a.gov_momentum_effect} Mom</span>
            </div>
        `;return`
            <div class="pa-ls-card ${m?"active":"resolved"}">
                <div class="pa-ls-header">
                    <div style="display:flex;align-items:center;gap:6px;">
                        <span style="font-size:12px;">${s}</span>
                        <span style="font-size:11px;font-weight:700;color:var(--text-bright);">${_(r)}</span>
                        <span class="pa-ls-tier-badge" style="color:${n.color};border-color:${n.color}44;background:${n.color}0a;">TIER ${a.tier}</span>
                        ${v}
                    </div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">
                        ${m?`${d} ticks left`:`Resolved tick ${a.resolves_at_tick}`}
                    </div>
                </div>
                ${m?`
                    <div class="pa-ls-timeline">
                        <div class="pa-ls-timeline-track">
                            <div class="pa-ls-timeline-fill" style="width:${l*100}%;"></div>
                        </div>
                        ${u}
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
    `}let Ut=!1;async function Ie(e){const t=document.getElementById("pa-hire-modal");if(!t)return;const a=y.nation?.id,i=y.nation?.name;if(!a||!i)return;t.innerHTML='<div class="pa-modal"><div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Searching for candidates...</div></div>',t.classList.add("active");const r=await wa($,a,i);let s=null;function n(){const p=s!=null?r[s]:null,m=p?vt(p.skill):null,o=r.map((d,f)=>{const u=s===f,v=vt(d.skill);return`<div class="pa-hire-row ${u?"selected":""}" data-idx="${f}">
                <div style="width:32px;height:32px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:10px;font-weight:700;color:#d44a4a;flex-shrink:0;">${Q(d.first_name,d.last_name)}</div>
                <div style="flex:1;min-width:0;">
                    <div style="font-size:11px;font-weight:600;color:${u?"var(--text-bright)":"var(--text-secondary)"};">${_(d.first_name)} ${_(d.last_name)}</div>
                    <div style="display:flex;align-items:center;gap:3px;margin-top:2px;">
                        <div style="flex:1;height:2px;background:var(--border-mid);max-width:60px;"><div style="height:100%;width:${d.skill}%;background:${v.color};"></div></div>
                        <span style="font-family:var(--font-mono);font-size:8px;color:${v.color};">${d.skill}</span>
                    </div>
                </div>
                <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;">Age ${d.age}</div>
            </div>`}).join("");let c;p?c=`
                <div style="padding:16px 20px;">
                    <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
                        <div style="width:48px;height:48px;border-radius:50%;background:#d44a4a15;border:1px solid #d44a4a33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:16px;font-weight:700;color:#d44a4a;">${Q(p.first_name,p.last_name)}</div>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${_(p.first_name)} ${_(p.last_name)}</div>
                            <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-top:1px;">Age ${p.age} &middot; Opposition Coordinator Candidate</div>
                        </div>
                    </div>

                    <div style="display:flex;gap:12px;margin-bottom:14px;">
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">SKILL</div>
                            <div style="display:flex;align-items:center;gap:6px;">
                                <div style="flex:1;height:3px;background:var(--border-mid);"><div style="height:100%;width:${p.skill}%;background:${m.color};"></div></div>
                                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:${m.color};">${p.skill}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:${m.color};margin-top:3px;font-weight:700;">${m.label}</div>
                        </div>
                        <div style="flex:1;padding:8px 10px;background:var(--bg-card);border:1px solid var(--border-main);">
                            <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:3px;">HIRE COST</div>
                            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;color:var(--accent);">$${(p.hire_cost/1e3).toFixed(0)}k</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:3px;">From party funds</div>
                        </div>
                    </div>

                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);letter-spacing:0.06em;margin-bottom:4px;">BACKGROUND</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.6;font-style:italic;">${_(p.background)}</div>
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
                    <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);margin-right:auto;">Cost: <span style="color:var(--accent);font-weight:700;">$${(p.hire_cost/1e3).toFixed(0)}k</span></span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-hire-confirm" style="background:#d44a4a;"${(y.faction?.party_funds||0)<p.hire_cost?' disabled title="Not enough funds"':""}>Hire ${_(p.first_name)}</button>
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
                        <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-left:8px;">${r.length} candidates</span>
                    </div>
                    <button class="pa-modal-close" id="pa-hire-close">&times;</button>
                </div>
                <div style="display:flex;flex:1;min-height:0;overflow:hidden;">
                    <div style="width:240px;border-right:1px solid var(--border-main);overflow-y:auto;" id="pa-hire-list">
                        ${o}
                    </div>
                    <div style="flex:1;overflow-y:auto;" id="pa-hire-detail">
                        ${c}
                    </div>
                </div>
            </div>
        `;const l=()=>t.classList.remove("active");document.getElementById("pa-hire-close")?.addEventListener("click",l),t.onclick=d=>{d.target===t&&l()},document.getElementById("pa-hire-list")?.addEventListener("click",d=>{const f=d.target.closest(".pa-hire-row");f&&(s=parseInt(f.dataset.idx,10),n())}),document.getElementById("pa-hire-confirm")?.addEventListener("click",async()=>{if(Ut||s==null)return;Ut=!0;const d=document.getElementById("pa-hire-confirm");d&&(d.disabled=!0,d.textContent="Hiring...");try{const f=y.shard?.current_tick||0,u=r[s],v=u.hire_cost||0,h=y.faction?.party_funds||0;if(v>0&&h<v){alert(`Not enough funds. You have $${Math.round(h/1e3)}k, need $${Math.round(v/1e3)}k.`);return}if(v>0){const b=h-v,{error:g}=await $.from("factions").update({party_funds:b}).eq("id",y.faction.id);if(g){alert("Failed to deduct funds.");return}y.faction.party_funds=b}const x=await ka($,y.faction?.id,u,f);if(!x.success){alert(x.error||"Failed to hire agitator.");return}j=x.agitator,X="agitator",l(),H(e)}catch(f){console.error("[PartyActions] Hire agitator error:",f)}finally{Ut=!1,d&&(d.disabled=!1)}})}n()}let St=!1;function Ka(e){const t=document.getElementById("pa-lawsuit-modal");if(!t)return;if(!F){alert("No active government to file against.");return}const a=y.faction,i=j;let r=null,s=null;function n(){const p=r&&s,m=Nt.map(l=>{const d=r===l.key;return`<div class="pa-lawsuit-target ${d?"selected":""}" data-target="${l.key}">
                <span style="font-size:18px;">${l.icon}</span>
                <span style="font-size:12px;font-weight:600;color:${d?"var(--text-bright)":"var(--text-secondary)"};">${_(l.label)}</span>
            </div>`}).join(""),o=Re.map(l=>{const d=s===l.key;return`<div class="pa-lawsuit-basis ${d?"selected":""}" data-basis="${l.key}">
                <div style="display:flex;align-items:center;gap:10px;">
                    <div style="width:16px;height:16px;border-radius:50%;border:2px solid ${d?"#d44a4a":"var(--border-mid)"};display:flex;align-items:center;justify-content:center;">
                        ${d?'<div style="width:8px;height:8px;border-radius:50%;background:#d44a4a;"></div>':""}
                    </div>
                    <div>
                        <div style="font-size:14px;font-weight:600;color:${d?"var(--text-bright)":"var(--text-secondary)"};">${_(l.label)}</div>
                        <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">${_(l.desc)}</div>
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
                        <div style="display:flex;flex-direction:column;gap:4px;" id="pa-lawsuit-bases">${o}</div>
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
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-lawsuit-submit" ${p?"":"disabled"} style="background:#d44a4a;">File Lawsuit</button>
                </div>
            </div>
        `;const c=()=>t.classList.remove("active");document.getElementById("pa-lawsuit-close")?.addEventListener("click",c),document.getElementById("pa-lawsuit-cancel")?.addEventListener("click",c),t.onclick=l=>{l.target===t&&c()},document.getElementById("pa-lawsuit-targets")?.addEventListener("click",l=>{const d=l.target.closest(".pa-lawsuit-target");d&&(r=d.dataset.target,n())}),document.getElementById("pa-lawsuit-bases")?.addEventListener("click",l=>{const d=l.target.closest(".pa-lawsuit-basis");d&&(s=d.dataset.basis,n())}),document.getElementById("pa-lawsuit-submit")?.addEventListener("click",async()=>{if(St||!r||!s)return;St=!0;const l=document.getElementById("pa-lawsuit-submit");l&&(l.disabled=!0,l.textContent="Filing...");try{const{data:f}=await $.from("factions").select("party_funds").eq("id",a.id).single(),u=f?.party_funds||0;if(u<25e4){alert(`Not enough funds. You have $${Math.round(u/1e3)}k, need $250k.`),St=!1,l&&(l.disabled=!1,l.textContent="File Lawsuit");return}const v=u-25e4;await $.from("factions").update({party_funds:v}).eq("id",a.id),a.party_funds=v,sessionStorage.removeItem("nationhood_state");const h=y.shard?.current_tick||0,x=await Ea($,{factionId:a?.id,nationId:y.nation?.id,agitatorId:i?.id,targetMinistry:r,basis:s,currentTick:h,partyName:a?.faction_name||"Opposition",administration:F});if(!x.success){alert(x.error||"Failed to file lawsuit.");return}const b=ve(x.lawsuit?.corruption_growth||0),g=nt[x.tier]||nt[1];c(),alert(`Lawsuit filed against ${Nt.find(w=>w.key===r)?.label||r}.
The case is now under investigation. Results will be determined when it resolves in 8 ticks.`),H(e)}catch(d){console.error("[PartyActions] File lawsuit error:",d),alert("An error occurred. Please try again.")}finally{St=!1,l&&(l.disabled=!1,l.textContent="File Lawsuit")}})}t.classList.add("active"),n()}async function Wa(e){const t=document.getElementById("pa-appoint-pm-modal");if(!t)return;const a=y.nation,i=y.faction,{data:r}=await $.from("factions").select("id, faction_name, abbreviation, party_color, seats, leader_first_name, leader_last_name, leader_age").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),s=r||[];let n=null,p=!1;const{data:m}=await $.from("head_of_government").select("faction_id, first_name, last_name, factions(faction_name)").eq("nation_id",a.id).eq("active",!0).maybeSingle();function o(){const c=s.find(v=>v.id===n),l=m?`${m.first_name} ${m.last_name}`:null,d=m?.factions?.faction_name||null,f=m&&n===m.faction_id;t.innerHTML=`
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
                    ${l?`<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Current PM: <strong style="color:var(--text-bright);">${_(l)}</strong> (${_(d||"?")})</div>`:'<div style="margin-top:4px;font-family:var(--font-mono);font-size:9px;color:var(--amber);">No Prime Minister appointed.</div>'}
                </div>
                <div class="pa-modal-body" style="max-height:300px;overflow-y:auto;">
                    <div class="pa-modal-step-label">Select a Party</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${s.map(v=>{const h=v.id===n,x=m&&v.id===m.faction_id,b=v.leader_first_name&&v.leader_last_name?`${v.leader_first_name} ${v.leader_last_name}`:"?";return`<div class="pa-action-item ${h?"selected":""}" data-party-id="${v.id}" style="cursor:pointer;${h?`border-color:${v.party_color||"#888"};background:${v.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${v.party_color||"#888"};"></div>
                                        <div>
                                            <div style="font-size:13px;font-weight:600;color:var(--text-bright);">${_(v.faction_name)}</div>
                                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">${_(b)}, Age ${v.leader_age||"?"} · ${v.seats||0} seats</div>
                                        </div>
                                    </div>
                                    ${x?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;padding:2px 6px;color:var(--green);background:rgba(92,204,92,0.08);border:1px solid rgba(92,204,92,0.2);">CURRENT PM</span>':""}
                                </div>
                            </div>`}).join("")}
                    </div>
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="apm-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="apm-confirm" ${!c||p||f?"disabled":""} style="background:#c8a832;">${c?f?"Already PM":`Appoint ${_(c.faction_name)}`:"Select a party"}</button>
                </div>
            </div>
        `;const u=()=>t.classList.remove("active");document.getElementById("apm-close")?.addEventListener("click",u),document.getElementById("apm-cancel")?.addEventListener("click",u),t.onclick=v=>{v.target===t&&u()},t.querySelector(".pa-modal-body")?.addEventListener("click",v=>{const h=v.target.closest("[data-party-id]");h&&(n=h.dataset.partyId,o())}),document.getElementById("apm-confirm")?.addEventListener("click",async()=>{if(!n||p)return;const v=s.find(x=>x.id===n);if(!v||!confirm(`Appoint ${v.leader_first_name} ${v.leader_last_name} of ${v.faction_name} as Prime Minister?`))return;p=!0;const h=document.getElementById("apm-confirm");h&&(h.disabled=!0,h.textContent="Appointing...");try{const x=y.shard?.current_tick||0;await na($,{nationId:a.id,factionId:n,firstName:v.leader_first_name||"Unknown",lastName:v.leader_last_name||"Unknown",age:v.leader_age||50,currentTick:x});try{await $.from("government_formations").update({status:"dissolved"}).eq("nation_id",a.id).in("status",["formed","caretaker","active"]);const{data:k}=await $.from("shard").select("current_date").eq("name","Alpha Shard").single();await $.from("government_formations").insert({nation_id:a.id,election_id:null,proposed_by:i.id,party_ids:[n],status:"formed",formation_type:"monarchy",formed_at:new Date().toISOString(),ministry_assignments:{prime_minister:n},game_year:k?.current_date||""})}catch(k){console.warn("[AppointPM] government_formations write failed (non-blocking — synthetic fallback still works):",k?.message||k)}let b=0;const g=a.monarch_faction_id,w=m?.faction_id||null,L=w&&w!==g&&w!==n,M=n!==g&&n!==w;if(L&&(b-=4),M&&(b+=3),b!==0){const k=Number(a.legitimacy??50),I=Math.max(0,Math.min(100,k+b));try{await $.from("nations").update({legitimacy:I}).eq("id",a.id),a.legitimacy=I}catch{}}try{await $.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} appoints Prime Minister`,category:"government",description_chosen:`${a.monarch_title||"The King"} has appointed ${v.leader_first_name} ${v.leader_last_name} of ${v.faction_name} as Prime Minister.`,fired_at_tick:x})}catch{}u();const S=b>0?`

Legitimacy +${b}.`:b<0?`

Legitimacy ${b}.`:"";alert(`${v.leader_first_name} ${v.leader_last_name} of ${v.faction_name} has been appointed Prime Minister.${S}`),H(e)}catch(x){alert("Failed to appoint PM: "+(x.message||"Error")),p=!1,h&&(h.disabled=!1,h.textContent=`Appoint ${_(v.faction_name)}`)}})}t.classList.add("active"),o()}async function Ja(e){const t=document.getElementById("pa-royal-modal");if(!t)return;const a=y.nation,i=y.faction,r=i.seats||0,s=a?.total_seats||100,{data:n}=await $.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),p=(n||[]).filter(d=>d.id!==i.id);let m=null;const o=Math.max(0,r-1);let c=Math.min(5,o||1);function l(){const d=p.find(u=>u.id===m);t.innerHTML=`
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
                    You currently hold <strong>${r}</strong> of ${s} seats.
                    ${r/s>.7?'<div style="color:#d44a4a;font-weight:700;margin-top:4px;">⚠ You hold >70% of seats — tyranny legitimacy decay active!</div>':""}
                </div>
                <div class="pa-modal-body">
                    <div class="pa-modal-step-label">Select Noble House</div>
                    <div style="display:flex;flex-direction:column;gap:4px;">
                        ${p.length>0?p.map(u=>{const v=u.id===m;return`<div class="pa-action-item ${v?"selected":""}" data-faction-id="${u.id}" style="cursor:pointer;${v?`border-color:${u.party_color||"#888"};background:${u.party_color||"#888"}08;`:""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${u.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${_(u.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${Math.max(0,u.seats||0)} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No other factions in this nation.</div>'}
                    </div>
                    ${d?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Grant</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${o}" value="${c}" id="grant-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:var(--accent);width:40px;text-align:center;" id="grant-count">${c}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Legitimacy gain: <span style="color:#5cc55c;font-weight:700;">+${(c*.5).toFixed(1)}</span>
                                &middot; Your seats after: ${r-c} &middot; Their seats after: ${(d.seats||0)+c}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-grant" ${d?"":"disabled"} style="background:#c8a832;">Grant ${c} Seats</button>
                </div>
            </div>
        `;const f=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",f),document.getElementById("royal-cancel")?.addEventListener("click",f),t.onclick=u=>{u.target===t&&f()},t.querySelector(".pa-modal-body")?.addEventListener("click",u=>{const v=u.target.closest("[data-faction-id]");v&&(m=v.dataset.factionId,l())}),document.getElementById("grant-slider")?.addEventListener("input",u=>{c=parseInt(u.target.value)||1,document.getElementById("grant-count").textContent=c;const v=document.getElementById("royal-grant");v&&(v.textContent=`Grant ${c} Seats`)}),document.getElementById("royal-grant")?.addEventListener("click",async()=>{if(!m||bt)return;bt=!0;const u=document.getElementById("royal-grant");u&&(u.disabled=!0,u.textContent="Granting...");try{const{data:v}=await $.from("factions").select("id, faction_name, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null),h=(v||[]).find(C=>C.id===i.id),x=(v||[]).find(C=>C.id===m);if(!h||!x){alert("Faction not found.");return}const b=(v||[]).reduce((C,P)=>C+Math.max(0,P.seats||0),0),g=new Map;for(const C of v||[])g.set(C.id,Math.max(0,C.seats||0));let w=c;const L=Math.max(0,(g.get(i.id)||0)-1),M=Math.min(w,L);if(M>0&&(g.set(i.id,(g.get(i.id)||0)-M),w-=M),w>0){const C=(v||[]).filter(T=>T.id!==i.id&&T.id!==m&&(g.get(T.id)||0)>0);let P=C.reduce((T,A)=>T+(g.get(A.id)||0),0);for(const T of C){if(w<=0||P<=0)break;const A=Math.round(w*(g.get(T.id)||0)/P),R=Math.min(A,g.get(T.id)||0,w);R>0&&(g.set(T.id,(g.get(T.id)||0)-R),P-=R,w-=R)}if(w>0)for(const T of C){if(w<=0)break;const A=g.get(T.id)||0,R=Math.min(w,A);R>0&&(g.set(T.id,A-R),w-=R)}}const S=c-w;if(S<=0){alert("No seats available to grant.");return}g.set(m,(g.get(m)||0)+S);let k=0;for(const C of g.values())k+=C;if(k!==b){console.error("[GrantSeats] Conservation violated",{sumBefore:b,sumAfter:k,grantAmount:c,actualGrant:S}),alert("Internal error: seat totals would not balance. Aborting.");return}const I=[];for(const C of v||[]){const P=Math.max(0,C.seats||0),T=g.get(C.id)||0;P!==T&&I.push({id:C.id,seats:T})}for(const C of I){const{error:P}=await $.from("factions").update({seats:C.seats}).eq("id",C.id);if(P){alert("Failed to grant seats: "+P.message);return}}const N=S*.5,E=Math.min(100,(Number(a.legitimacy)||50)+N),{error:z}=await $.from("nations").update({legitimacy:E}).eq("id",a.id);if(z){alert("Failed to update legitimacy.");return}i.seats=g.get(i.id)||0,a.legitimacy=E;try{const C=p.find(P=>P.id===m);await $.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} grants ${S} seats to ${C?.faction_name||"unknown"}`,category:"government",description_chosen:`The ${a.monarch_title||"King"} has granted ${S} parliamentary seat${S!==1?"s":""} to ${C?.faction_name}. Legitimacy +${N.toFixed(1)}.`,fired_at_tick:y.shard?.current_tick||0})}catch{}f(),H(e)}catch(v){console.error("[GrantSeats] Error:",v),alert("Failed to grant seats.")}finally{bt=!1}})}t.classList.add("active"),l()}async function Xa(e){const t=document.getElementById("pa-royal-modal");if(!t)return;const a=y.nation,i=y.faction,{data:r}=await $.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("faction_name"),s=(r||[]).filter(o=>o.id!==i.id&&(o.seats||0)>0);let n=null,p=1;function m(){const o=s.find(v=>v.id===n),c=o&&o.seats||0,d=p*1e5,f=i.party_funds||0;t.innerHTML=`
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
                        ${s.length>0?s.map(v=>{const h=v.id===n;return`<div class="pa-action-item ${h?"selected":""}" data-faction-id="${v.id}" style="cursor:pointer;${h?"border-color:#d44a4a;background:rgba(212,74,74,0.04);":""}">
                                <div style="display:flex;justify-content:space-between;align-items:center;">
                                    <div style="display:flex;align-items:center;gap:8px;">
                                        <div style="width:8px;height:8px;background:${v.party_color||"#888"};"></div>
                                        <span style="font-size:14px;font-weight:600;color:var(--text-bright);">${_(v.faction_name)}</span>
                                    </div>
                                    <span style="font-family:var(--font-mono);font-size:13px;color:var(--text-dim);">${v.seats} seats</span>
                                </div>
                            </div>`}).join(""):'<div style="font-size:12px;color:var(--text-dim);padding:20px;text-align:center;">No factions have seats to revoke.</div>'}
                    </div>
                    ${o?`
                        <div style="margin-top:14px;">
                            <div class="pa-modal-step-label">Seats to Revoke</div>
                            <div style="display:flex;align-items:center;gap:12px;">
                                <input type="range" min="1" max="${c}" value="${p}" id="revoke-slider" style="flex:1;">
                                <span style="font-family:var(--font-mono);font-size:18px;font-weight:700;color:#d44a4a;width:40px;text-align:center;" id="revoke-count">${p}</span>
                            </div>
                            <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);margin-top:4px;">
                                Cost: <span style="color:#d44a4a;font-weight:700;">$${Math.round(d/1e3)}k</span>
                                &middot; Legitimacy: <span style="color:#d44a4a;font-weight:700;">-${p}</span>
                                ${f<d?'<span style="color:#d44a4a;margin-left:8px;">⚠ Not enough funds</span>':""}
                            </div>
                        </div>
                    `:""}
                </div>
                <div class="pa-modal-footer">
                    <button class="pa-modal-btn pa-modal-btn--cancel" id="royal-cancel">Cancel</button>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="royal-revoke" ${!o||f<d?"disabled":""} style="background:#d44a4a;">Revoke ${p} Seats</button>
                </div>
            </div>
        `;const u=()=>t.classList.remove("active");document.getElementById("royal-close")?.addEventListener("click",u),document.getElementById("royal-cancel")?.addEventListener("click",u),t.onclick=v=>{v.target===t&&u()},t.querySelector(".pa-modal-body")?.addEventListener("click",v=>{const h=v.target.closest("[data-faction-id]");h&&(n=h.dataset.factionId,p=1,m())}),document.getElementById("revoke-slider")?.addEventListener("input",v=>{p=parseInt(v.target.value)||1,document.getElementById("revoke-count").textContent=p;const h=document.getElementById("royal-revoke");h&&(h.textContent=`Revoke ${p} Seats`)}),document.getElementById("royal-revoke")?.addEventListener("click",async()=>{if(!n||bt)return;bt=!0;const v=document.getElementById("royal-revoke");v&&(v.disabled=!0,v.textContent="Revoking...");try{const h=p*1e5,{data:x}=await $.from("factions").select("id, faction_name, seats, party_funds").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null),b=(x||[]).find(A=>A.id===i.id),g=(x||[]).find(A=>A.id===n);if(!b||!g){alert("Faction not found.");return}const w=b.party_funds||0;if(w<h){alert("Not enough funds.");return}const L=(x||[]).reduce((A,R)=>A+Math.max(0,R.seats||0),0),M=Math.min(p,g.seats||0);if(M<=0){alert("Target has no seats to revoke.");return}const S=w-h,k=(b.seats||0)+M,I=(g.seats||0)-M,N=M,E=Math.max(0,(Number(a.legitimacy)||50)-N),z=L-(b.seats||0)-(g.seats||0)+k+I;if(z!==L){console.error("[RevokeSeats] Conservation violated",{sumBefore:L,sumAfter:z,take:M}),alert("Internal error: seat totals would not balance. Aborting.");return}const{error:C}=await $.from("factions").update({seats:k,party_funds:S}).eq("id",i.id);if(C){alert("Failed to revoke seats: "+C.message);return}const{error:P}=await $.from("factions").update({seats:I}).eq("id",n);if(P){alert("Failed to revoke seats: "+P.message);return}const{error:T}=await $.from("nations").update({legitimacy:E}).eq("id",a.id);if(T){alert("Failed to update legitimacy.");return}i.seats=k,i.party_funds=S,a.legitimacy=E,sessionStorage.removeItem("nationhood_state");try{await $.from("event_log").insert({nation_id:a.id,event_name:`${a.monarch_title||"King"} revokes ${M} seats from ${g.faction_name||"unknown"}`,category:"political",description_chosen:`The ${a.monarch_title||"King"} has revoked ${M} seat${M!==1?"s":""} from ${g.faction_name}. Legitimacy -${N}.`,fired_at_tick:y.shard?.current_tick||0})}catch{}u(),H(e)}catch(h){console.error("[RevokeSeats] Error:",h),alert("Failed to revoke seats.")}finally{bt=!1}})}t.classList.add("active"),m()}let Yt=!1;async function Qa(){if(Yt||!y?.faction?.id||!y?.nation?.id)return;if(!Et(y.nation)){alert("Early elections are only available in parliamentary and semi-presidential systems.");return}if(K(y.nation)){alert("Elections are not held under absolute monarchy.");return}const e=F?.pm_party_id;if(!e||e!==y.faction.id){alert("Prime Minister’s party only.");return}if(confirm(`⚡ CALL EARLY ELECTIONS?

Dissolves the legislature and puts the government into caretaker status.
Election fires after a short formation window.

Momentum effect depends on Gov. Approval:
• >50  → PM party +3 Momentum (fresh mandate)
• 35–50 → neutral
• <35  → opposition +5 Momentum each, +3 Stability

Proceed?`)){Yt=!0;try{const t=Array.isArray(F?.party_ids)?F.party_ids:F?.pm_party_id?[F.pm_party_id]:[],a=await ca($,y.nation.id,e,t);if(a&&a.success===!1){alert("Could not call early elections: "+(a.error||"unknown error"));return}alert("⚡ Early elections called. Government is now in caretaker status."),window.location.reload()}catch(t){console.error("[PartyActions] Call early elections failed:",t),alert("Failed to call early elections: "+(t?.message||"unknown error"))}finally{Yt=!1}}}let Vt=!1;async function Za(){if(!Vt&&y?.faction?.id&&confirm(`LEAVE COALITION?

Consequences:
• −3 Momentum to your party
• −5 Momentum to the Prime Minister’s party
• Any ministries you hold will be vacated
• Your party moves from governing to opposition
• Coalition flips to minority if your exit drops it below majority
• 12-tick cooldown before you can leave another coalition

Proceed?`)){Vt=!0;try{const{data:e,error:t}=await $.rpc("leave_coalition",{p_faction_id:y.faction.id});if(t)throw t;if(e&&e.success===!1)throw new Error(e.error||"Unknown error");const a=e?.became_minority?`

The government is now a minority.`:"",i=(e?.ministries_vacated||0)>0?`

${e.ministries_vacated} ministr${e.ministries_vacated===1?"y":"ies"} vacated.`:"";alert("You have left the coalition."+a+i),window.location.reload()}catch(e){console.error("[PartyActions] Leave Coalition failed:",e),alert("Failed to leave coalition: "+(e?.message||e))}finally{Vt=!1}}}let Kt=!1;async function ti(){if(Kt||!y?.faction?.id||!y?.nation?.id)return;if(!Et(y.nation)){alert("Resignation is only available in parliamentary and semi-presidential systems.");return}if(K(y.nation)){alert("Prime Ministers serve at the Monarch’s pleasure. The Monarch must replace the PM via the Appoint Prime Minister royal action.");return}const e=F?.pm_party_id;if(!e||e!==y.faction.id){alert("Prime Minister’s party only.");return}if(confirm(`⚠ RESIGN AS PRIME MINISTER?

The PM seat vacates immediately. Coalition enters caretaker status with
a ${te}-tick window to nominate a successor via the cabinet panel.
If a new PM is installed, the administration continues under new leadership.
If the window expires, a snap election is called.

Cost to your party:
• −3 Momentum
• −0.05 Credibility
• Nation: −3 Stability
• 12-tick bar from the PM seat on your party

Proceed?`)){Kt=!0;try{const{data:t}=await $.from("shard").select("current_tick").eq("name","Alpha Shard").single(),a=t?.current_tick||y.shard?.current_tick||0;(await oa($,y.nation.id,y.faction.id,a))?.result==="election_called"?alert("You have resigned. Snap election scheduled as fallback if no successor is nominated."):alert("You have resigned. Coalition has a short window to nominate a successor before a snap election fires."),window.location.reload()}catch(t){console.error("[PartyActions] Resign PM failed:",t),alert("Failed to resign: "+(t?.message||"unknown error"))}finally{Kt=!1}}}let Wt=!1;async function ei(){if(Wt||!y?.faction?.id)return;const e=y.faction,t=e.faction_name||"this party",a=e.seats||0,i=Number(e.momentum||0).toFixed(1),r=Math.round(Number(e.party_funds||0)),s=r>=1e3?"$"+r.toLocaleString():"$"+r;if(!confirm("DISBAND "+t.toUpperCase()+`?

This will permanently:
• Dissolve the party
• Vacate `+a+" seat"+(a===1?"":"s")+` in parliament (empty until next election; no backfill)
• Forfeit `+s+` in party funds
• Forfeit `+i+` momentum
• Remove you from every nation chat
• Cascade-delete platforms, ideology, bloc membership,
  and any pending bloc invitations

You will need to found a new party.
There is a 24-tick cooldown on disbanding.

This action CANNOT be undone.`))return;if(prompt('Type "DISBAND" to confirm dissolution of '+t+":")!=="DISBAND"){alert("Disband cancelled.");return}Wt=!0;try{const{data:p,error:m}=await $.rpc("disband_party",{p_faction_id:e.id});if(m)throw m;if(p&&p.success===!1)throw new Error(p.error||"Unknown error");sessionStorage.removeItem("active_faction_id"),sessionStorage.removeItem("nationhood_state");const{data:{user:o}}=await $.auth.getUser();if(o){const{data:c}=await $.from("factions").select("id, faction_type").or(`id.eq.${o.id},linked_user_id.eq.${o.id}`),l=(c||[]).find(f=>f.faction_type==="party"),d=(c||[]).find(f=>f.faction_type==="corporation");if(l){sessionStorage.setItem("active_faction_id",l.id),alert(t+` has been disbanded.

Redirecting to your other party.`),window.location.href="dashboard.html";return}if(d){sessionStorage.setItem("active_faction_id",d.id),alert(t+` has been disbanded.

Redirecting to your corporation.`),window.location.href="corp-dashboard.html";return}}alert(t+` has been disbanded.

You have no remaining factions.`),window.location.href="faction-select.html"}catch(p){console.error("[PartyActions] Disband failed:",p),alert("Disband failed: "+(p?.message||p))}finally{Wt=!1}}let Jt=!1;async function ai(){if(Jt||!y?.faction?.id||!y?.nation?.id)return;const e=y.faction,t=y.nation,a=me(t);if(!Et(t)){alert("A vote of no confidence is only possible in a parliamentary or semi-presidential system.");return}const{data:i}=await $.from("head_of_government").select("faction_id, last_name").eq("nation_id",t.id).eq("active",!0).maybeSingle(),r=i?.faction_id||t.ruling_faction_id||null,s=i?.last_name||null;if(!r){alert("No active Prime Minister to file against.");return}if(r===e.id){alert("Your party is the Prime Minister — you cannot file a vote of no confidence against yourself.");return}const n=y.faction?.seats!=null?Number(y.faction.seats):0;if(n<1){alert("Your party needs at least 1 seat in the legislature to file a motion.");return}const{data:p}=await $.from("shard").select("current_tick").eq("name","Alpha Shard").single(),m=p?.current_tick||y.shard?.current_tick||0,{data:o}=await $.from("bills").select("id").eq("nation_id",t.id).eq("bill_type","no_confidence").in("status",["committee","floor"]).limit(1);if(o&&o.length>0){alert("A motion of no confidence is already pending.");return}const{data:c}=await $.from("campaign_actions").select("tick_performed").eq("nation_id",t.id).eq("action_type","no_confidence_filed").eq("target_id",r).order("tick_performed",{ascending:!1}).limit(1).maybeSingle();if(c){const f=m-Number(c.tick_performed||0);if(f<lt.NO_CONFIDENCE_COOLDOWN_TICKS){const u=lt.NO_CONFIDENCE_COOLDOWN_TICKS-f;alert(`Cooldown: ${u} tick${u!==1?"s":""} remaining before another motion can be filed against this PM party.`);return}}const l=s?a?`Motion of No Confidence in PM ${s}`:`Motion of No Confidence in the ${s} Government`:"Motion of No Confidence in the Government",d=a?`IF IT PASSES:
• PM removed — President must nominate a new PM
• Your party: +15 Momentum
• PM's party: -10 Momentum, -10 Governance`:`IF IT PASSES:
• Coalition dissolved, PM removed, all ministries vacated
• Snap elections scheduled
• Your party: +15 Momentum
• PM's party: -10 Momentum, -10 Governance`;if(confirm(`⚡ FILE VOTE OF NO CONFIDENCE?

"${l}"

Cost: $0 — free to file
Voting period: ${lt.NO_CONFIDENCE_VOTING_TICKS} ticks
Needs simple majority (YES > NO) to pass.

${d}

IF IT FAILS:
• Your party: -10 Momentum
• ${lt.NO_CONFIDENCE_COOLDOWN_TICKS}-tick cooldown on this PM party

Proceed?`)){Jt=!0;try{const f=await da($,{faction:e,nation:t,pmFactionId:r,pmLastName:s,isSemiPres:a,tick:m,mySeats:n});if(!f.ok){alert("Failed to file motion: "+f.error);return}alert(`⚡ "${f.motionName}" has been filed!

Voting is now open for ${lt.NO_CONFIDENCE_VOTING_TICKS} ticks.`),window.location.href=`bill.html?id=${f.billId}`}catch(f){console.error("[PartyActions] No confidence file failed:",f),alert("Failed to file motion: "+(f?.message||"unknown error"))}finally{Jt=!1}}}let Xt=!1;async function ii(e){if(Xt)return;const t=y.faction,a=t.seats||0,i=Math.max(1,t.momentum??0);if(a<=0){alert("Your party has no seats — nothing to fundraise from.");return}const r=Oe(a,mt);if(i-r.momCost<1){alert(`Not enough momentum. You need ${r.momCost} momentum (current: ${Math.round(i)}, floor: 1). Try again next tick when momentum recovers.`);return}Xt=!0;try{const{data:s}=await $.from("factions").select("party_funds, momentum").eq("id",t.id).single();s&&(t.party_funds=s.party_funds??0,t.momentum=s.momentum??0);const n=Math.max(1,t.momentum??0),p=y.shard?.current_tick||0,m=Math.max(1,n-r.momCost),o=(t.party_funds||0)+r.raised,{error:c}=await $.from("factions").update({momentum:m,party_funds:o}).eq("id",t.id);if(c){alert("Fundraise failed: "+c.message);return}await $.from("campaign_actions").insert({party_id:t.id,nation_id:y.nation?.id,action_type:"fundraise",ap_cost:0,money_cost:0,tick_performed:p,result:{momentumDelta:-r.momCost,raised:r.raised,perSeat:r.perSeat,momCost:r.momCost,useNumber:mt+1,seats:a}}),t.momentum=m,t.party_funds=o,sessionStorage.removeItem("nationhood_state"),mt++,H(e)}catch(s){console.error("[PartyActions] Fundraise error:",s),alert("Fundraise failed.")}finally{Xt=!1}}function oi(e){const t=document.getElementById("pa-statement-modal");if(!t)return;const a=y.faction,i=a?.color||"#c8a832",r=a?.leader_first_name&&a?.leader_last_name?`${a.leader_first_name} ${a.leader_last_name}`:"Party Leader",s=$e.map(c=>`<div class="pa-topic-card" data-topic="${c.id}" style="padding:8px 10px;cursor:pointer;border:1px solid var(--border-mid);display:flex;align-items:center;gap:8px;transition:all 0.12s;">
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
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${i};">${_(r)}</span>
                <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">&middot; Party Leader</span>
            </div>
            <div class="pa-modal-body" style="gap:14px;">
                <div>
                    <div class="pa-modal-step-label">1 &mdash; Topic</div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;" id="pa-stmt-topics">${s}</div>
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
    `,t.classList.add("active");let n=null,p=!1;const m=()=>t.classList.remove("active");document.getElementById("pa-stmt-close")?.addEventListener("click",m),document.getElementById("pa-stmt-cancel")?.addEventListener("click",m),t.addEventListener("click",c=>{c.target===t&&m()}),document.getElementById("pa-stmt-topics")?.addEventListener("click",c=>{const l=c.target.closest(".pa-topic-card");l&&(n=l.dataset.topic,document.querySelectorAll(".pa-topic-card").forEach(d=>{const f=d.dataset.topic===n;d.style.borderColor=f?i:"var(--border-mid)",d.style.background=f?i+"0a":"";const u=d.querySelector("span:last-child");u&&(u.style.color=f?"var(--text-bright)":"var(--text-secondary)")}),o())});const o=()=>{const c=document.getElementById("pa-stmt-body")?.value?.trim()||"",l=document.getElementById("pa-stmt-submit"),d=document.getElementById("pa-stmt-charcount");d&&(d.textContent=`${c.length} characters`),l&&(l.disabled=!(n&&c.length>=10))};document.getElementById("pa-stmt-body")?.addEventListener("input",o),document.getElementById("pa-stmt-submit")?.addEventListener("click",async()=>{if(p)return;const c=document.getElementById("pa-stmt-body")?.value?.trim();if(!n||!c||c.length<10)return;p=!0;const l=document.getElementById("pa-stmt-submit");l&&(l.disabled=!0,l.textContent="Issuing...");try{const d=y.shard?.current_tick||0,u=$e.find(N=>N.id===n)?.label||n,v=2e4,{data:h}=await $.from("factions").select("party_funds").eq("id",a.id).single(),x=h?.party_funds||0;if(x<v){alert(`Not enough funds. You have $${Math.round(x/1e3)}k, need $20k.`);return}const b=x-v,{error:g}=await $.from("factions").update({party_funds:b}).eq("id",a.id);if(g){alert("Failed to deduct funds: "+g.message);return}a.party_funds=b;const L=we[Math.floor(Math.random()*we.length)].replace("{party_name}",a.faction_name||"Unknown Party").replace("{leader_name}",r).replace("{topic}",u),{error:M}=await $.from("campaign_actions").insert({party_id:a.id,nation_id:y.nation?.id,action_type:"issue_statement",ap_cost:1,money_cost:0,tick_performed:d,result:{topic:n,topicLabel:u,headline:L,body:c,leaderName:r}});M&&console.error("[PartyActions] Statement log failed:",M.message);const{error:S}=await $.from("valdorian_articles").insert({nation_id:y.nation?.id,event_type:"issue_statement",tier:3,section:"politics",headline:L,subheadline:u,lede:c.substring(0,200)+(c.length>200?"...":""),body_paragraphs:JSON.stringify(c.split(/\n\n+/).filter(N=>N.trim())),quotes:JSON.stringify([{posture:"assertive",text:c.substring(0,150)}]),byline_reporter:"Political Desk",topic_tags:JSON.stringify([n]),source_event_id:"statement_"+Date.now(),tick:d});S&&console.error("[PartyActions] Article creation failed:",S.message);const{error:k}=await $.from("event_log").insert({nation_id:y.nation?.id,event_name:L,category:"political",description_chosen:`${a.faction_name} issues the following statement regarding ${u}: "${c}"`,fired_at_tick:d});k&&console.warn("[Statement] event_log insert failed:",k.message);const{error:I}=await $.from("admin_timeline_events").insert({nation_id:y.nation?.id,tick:d,type:"communications",title:"Statement Issued",description:`${r} issued a public statement on ${u}: "${c.substring(0,120)}${c.length>120?"...":""}"`});I&&console.warn("[Statement] timeline insert failed:",I.message),m(),H(e)}catch(d){console.error("[PartyActions] Statement error:",d),alert("Failed to issue statement. Please try again.")}finally{p=!1,l&&(l.disabled=!1,l.textContent="Issue Statement")}})}const Ft=20;function ni(e){const t=document.getElementById("pa-platform-modal");if(!t)return;const a=y.faction;y.nation;const i=a?.color||"#c8a832";let r=null,s=!1;const n={};for(const o of zt)o.faction_id!==a?.id&&(n[o.platform_key]=(n[o.platform_key]||0)+1);const p=new Set(et.map(o=>o.platform_key));function m(){const o=xt.find(f=>f.id===r),c=o?xe(n[o.id]||0):null;o&&zt.filter(f=>f.platform_key===o.id&&f.faction_id!==a?.id);const l=xt.map(f=>{const u=r===f.id,v=p.has(f.id),h=xe(n[f.id]||0),x=n[f.id]||0;return`<div class="pa-plat-card ${u?"selected":""} ${v?"adopted":""}" data-plat="${f.id}">
                ${v?'<div class="pa-plat-active-badge">ACTIVE</div>':""}
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                    <span style="font-size:14px;">${f.icon}</span>
                    <span style="font-size:10px;font-weight:700;color:${v?i:u?"var(--text-bright)":"var(--text-secondary)"};line-height:1.2;">${_(f.name)}</span>
                </div>
                <div style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);line-height:1.4;margin-bottom:6px;">${_(f.tagline)}</div>
                <div style="display:flex;justify-content:space-between;align-items:center;">
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${h.color};">${h.label}</span>
                    ${x>0?`<span style="font-family:var(--font-mono);font-size:6px;font-weight:700;padding:1px 3px;color:var(--text-dim);border:1px solid var(--border-mid);">${x} rival${x>1?"s":""}</span>`:""}
                </div>
            </div>`}).join("");let d;if(!o)d=`<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:40px;">
                <div style="text-align:center;">
                    <div style="font-family:var(--font-mono);font-size:24px;color:var(--border-mid);margin-bottom:8px;">←</div>
                    <div style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">Select a platform to review</div>
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);margin-top:4px;">16 platforms available</div>
                </div>
            </div>`;else{const f=o.improve.map(b=>{const g=be(b,"improve");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(92,204,92,0.05);border:1px solid rgba(92,204,92,0.15);color:${g.color};white-space:nowrap;">${g.arrow} ${ye[b]||b}</span>`}).join(""),u=o.worsen.map(b=>{const g=be(b,"worsen");return`<span style="display:inline-flex;align-items:center;gap:3px;font-family:var(--font-mono);font-size:8px;padding:2px 6px;background:rgba(204,85,85,0.05);border:1px solid rgba(204,85,85,0.15);color:${g.color};white-space:nowrap;">${g.arrow} ${ye[b]||b}</span>`}).join(""),v=p.has(o.id),h=et.length;let x;v?x=`<div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${i};display:flex;align-items:center;gap:6px;">✓ CURRENT PLATFORM</div>`:h>=3?x='<div style="font-family:var(--font-mono);font-size:9px;color:var(--red);">All 3 platform slots are full.</div>':s?x=`<div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-family:var(--font-mono);font-size:9px;color:#ca5;font-weight:700;">⚠ Confirm: Adopt ${_(o.name)}?</span>
                    <div style="display:flex;gap:6px;">
                        <button class="pa-modal-btn pa-modal-btn--cancel" id="pa-plat-conf-cancel">Cancel</button>
                        <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-conf-yes">Confirm</button>
                    </div>
                </div>`:x=`<div style="display:flex;align-items:center;justify-content:space-between;width:100%;">
                    <span style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);">Costs 2 AP. Stats locked at current values. 6-tick cooldown.</span>
                    <button class="pa-modal-btn pa-modal-btn--submit" id="pa-plat-adopt" style="background:${i};">Adopt Platform</button>
                </div>`,d=`
                <div style="padding:16px 20px 12px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">
                        <span style="font-size:22px;">${o.icon}</span>
                        <div>
                            <div style="font-size:16px;font-weight:700;color:var(--text-bright);">${_(o.name)}</div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.04em;margin-top:1px;">${_(o.tagline.toUpperCase())}</div>
                        </div>
                    </div>
                    <div style="font-size:11px;color:var(--text-secondary);line-height:1.6;">${_(o.desc)}</div>
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
                            PROMISES TO IMPROVE <span style="font-weight:400;color:var(--text-dim);">(${o.improve.length} stats, +${Ft} target)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${f}</div>
                    </div>
                    <div style="margin-bottom:14px;">
                        <div style="font-family:var(--font-mono);font-size:8px;font-weight:700;letter-spacing:0.1em;color:var(--red);margin-bottom:6px;display:flex;align-items:center;gap:6px;">
                            <span style="width:10px;height:1px;background:var(--red);display:inline-block;"></span>
                            LIKELY SIDE EFFECTS <span style="font-weight:400;color:var(--text-dim);">(${o.worsen.length} stats)</span>
                        </div>
                        <div style="display:flex;flex-wrap:wrap;gap:4px;">${u}</div>
                    </div>
                    <div style="padding:10px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.15);">
                        <div style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#ca5;letter-spacing:0.06em;margin-bottom:4px;">⚠ TRADEOFF</div>
                        <div style="font-size:10px;color:var(--text-secondary);line-height:1.5;">${_(o.tradeoff)}</div>
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
                        ${l}
                    </div>
                    <div style="flex:1;display:flex;flex-direction:column;min-width:0;overflow-y:auto;" id="pa-plat-detail">
                        ${d}
                    </div>
                </div>
            </div>
        `,document.getElementById("pa-plat-close")?.addEventListener("click",()=>t.classList.remove("active")),t.onclick=f=>{f.target===t&&t.classList.remove("active")},document.getElementById("pa-plat-grid")?.addEventListener("click",f=>{const u=f.target.closest(".pa-plat-card");u&&(r=u.dataset.plat,s=!1,m())}),document.getElementById("pa-plat-adopt")?.addEventListener("click",()=>{s=!0,m()}),document.getElementById("pa-plat-conf-cancel")?.addEventListener("click",()=>{s=!1,m()}),document.getElementById("pa-plat-conf-yes")?.addEventListener("click",()=>si(e,r))}t.classList.add("active"),m()}let Lt=!1;async function si(e,t){if(Lt)return;Lt=!0;const a=document.getElementById("pa-platform-modal"),i=y.faction,r=y.nation;if(!i||!r||!t){Lt=!1;return}const s=xt.find(o=>o.id===t);if(!s)return;const n={},p={},m=o=>fe.has(o);for(const o of s.improve){const c=Number(r[o]??50);n[o]=c,m(o)?p[o]=Math.max(0,c-Ft):p[o]=Math.min(100,c+Ft)}try{const o=y.shard?.current_tick||0,{data:c,error:l}=await $.rpc("adopt_platform",{p_faction_id:i.id,p_nation_id:r.id,p_platform_key:t,p_tick:o,p_baseline_stats:n,p_target_stats:p});if(l){console.error("[PartyActions] Platform adoption failed:",l.message),alert("Failed to adopt platform: "+l.message);return}if(c&&!c.success){alert(c.error||"Failed to adopt platform.");return}const d=c?.slot||et.length+1;et.push({faction_id:i.id,nation_id:r.id,platform_key:t,slot:d,adopted_at_tick:o,baseline_stats:n,target_stats:p,status:"active"}),zt.push(et[et.length-1]),i&&c?.momentum_gained&&(i.momentum=(i.momentum||0)+c.momentum_gained),i&&(i.action_points=Math.max(0,(i.action_points||0)-2)),a?.classList.remove("active"),H(e)}catch(o){console.error("[PartyActions] Platform adoption error:",o),alert("An error occurred. Please try again.")}finally{Lt=!1}}let ht=null,Ye={isGoverning:!1,statusLabel:"OPPOSITION",administration:null,governanceScore:0,governanceDeltas:[],governanceMultiplier:1,governanceDecayCycles:0,ticksInPower:0,myFaction:null,allParties:[],rivalParties:[],strongholdsByParty:{},recentActivity:[],caucuses:[],nextElection:null,nextElectionTicks:null};function V(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}const ri=[...fa,...va];function li(e,t,a,i){const r=i-(a||i);if(!t)return{score:0,deltas:[],decayCycles:0,multiplier:1,ticksInPower:r};let s=0,n=0;const p=[];for(const l of ri){const d=ua(l);if(d===0)continue;const f=Number(t[l]??0),u=Number(e[l]??0),v=u-f;if(v===0)continue;const h=v*d,x=h>0;p.push({key:l,start:f,now:u,delta:v,signed:h,dir:d,isGood:x}),s+=h,n++}let m=n>0?s/n:0;const o=Math.floor(r/24),c=m>0?Math.pow(.97,o):1;return m*=c,{score:Math.round(m*10)/10,deltas:p,decayCycles:o,multiplier:c,ticksInPower:r}}function di(e,t,a){const i={};for(const r of e)i[r.id]=ma(r.id,t,a,3);return i}async function ci(e,t,a){ht=t;const i=document.getElementById(a);if(!i)return;const r=t.faction,s=t.nation,n=s?.id,p=r?.id;if(!r||!n){i.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">No faction data.</div>';return}i.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:10px;">Loading party overview...</div>';try{const m=t.shard?.current_tick||0,[o,c,l,d,f,u,v,h]=await Promise.all([Ne(e,n,p),e.from("factions").select("*").eq("nation_id",n).eq("faction_type","party"),e.from("sectors").select("id, sector_key, name, weight, base_turnout, is_active").eq("nation_id",n).eq("is_active",!0).order("display_order"),e.from("campaign_actions").select("*").eq("party_id",p).order("tick_performed",{ascending:!1}).limit(20),Promise.resolve({data:[],error:null}),e.from("elections").select("*").eq("nation_id",n).eq("status","scheduled").order("election_tick",{ascending:!0}).limit(5),e.from("ministries").select("party_id").eq("nation_id",n).eq("is_active",!0),aa(n)]);c.error&&console.error("[PartyOverview] Parties fetch error:",c.error.message),l.error&&console.error("[PartyOverview] Sectors fetch error:",l.error.message),d.error&&console.error("[PartyOverview] Activity fetch error:",d.error.message),f.error&&console.error("[PartyOverview] Caucus fetch error:",f.error.message),u.error&&console.error("[PartyOverview] Election fetch error:",u.error.message);const x=c.data||[],b=l.data||[],g=o.administration,w=new Set((v.data||[]).map(C=>C.party_id).filter(Boolean));let L=[];if(x.length>0&&b.length>0){const C=x.map(A=>A.id),{data:P,error:T}=await e.from("faction_sector_popularity").select("faction_id, sector_id, popularity").in("faction_id",C);T&&console.error("[PartyOverview] Popularity fetch error:",T.message),L=P||[]}const M=di(x,b,L),S=pa(p,b,L).sort((C,P)=>(P.popularity||0)-(C.popularity||0));let k={score:0,deltas:[],decayCycles:0,multiplier:1,ticksInPower:0};g&&g.stats_at_start&&(k=li(s,g.stats_at_start,g.started_at_tick,m));const I=u.data||[],N=I[0]||null,E=N?Math.max(0,N.election_tick-m):null;let z=null;N&&s&&rt(s)&&(z=I.some(P=>P.election_type==="presidential"&&P.election_tick===N.election_tick)?"General":"Midterm"),Ye={isGoverning:o.isGoverning,statusLabel:o.label,administration:g,ministryPartyIds:w,governanceScore:k.score,governanceDeltas:k.deltas.sort((C,P)=>Math.abs(P.signed)-Math.abs(C.signed)),governanceMultiplier:k.multiplier,governanceDecayCycles:k.decayCycles,ticksInPower:k.ticksInPower,myFaction:r,allParties:x,rivalParties:x.filter(C=>C.id!==p),blocMap:h,strongholdsByParty:M,mySectorContributions:S,recentActivity:d.data||[],caucuses:f.data||[],nextElection:N,nextElectionTicks:E,nextElectionLabel:z},Ve(i)}catch(m){console.error("[PartyOverview] Init error:",m),i.innerHTML='<div style="padding:40px;text-align:center;color:var(--red);font-family:var(--font-mono);font-size:10px;">Failed to load party overview.</div>'}}let ot=[];function Ve(e){const t=Ye,a=t.myFaction,i=ht.nation,r=a?.party_color||a?.color||"#c8a832";ht.shard?.current_tick,ot.length===0&&(ot=[a?.id,...t.rivalParties.map(c=>c.id)]),t.administration?.admin_name||t.isGoverning;const s=t.statusLabel,n=t.isGoverning?"var(--green)":"var(--orange)",p=a?.seats||0,m=i?.total_seats||100,o=a?.momentum??50;e.innerHTML=`<div class="po-page">
        ${pi(t,r,p,m,o)}
        <div class="po-columns">
            <div class="po-col-left">
                ${mi(t,a,r,s,n)}
                ${fi(t)}
                ${vi(t,a,r)}
                ${ui(t)}
            </div>
            <div class="po-col-center" id="po-center-col">
                ${gi(t,o)}
                ${yi(t)}
            </div>
            <div class="po-col-right" id="po-right-col">
                ${bi(t,a)}
                ${xi(t)}
                ${hi()}
            </div>
        </div>
    </div>`,e.querySelectorAll(".po-legend-item").forEach(c=>{c.addEventListener("click",()=>{const l=c.dataset.partyId;l!==a?.id&&(ot.includes(l)?ot=ot.filter(d=>d!==l):ot.push(l),Ve(e))})})}function pi(e,t,a,i,r){const s=e.governanceScore,n=s>=0?"var(--green)":"var(--red)",p=e.isGoverning?e.administration?.admin_name||"Government":"Opposition",m=(ht.nation?.government_type||"").toLowerCase().includes("monarchy"),o=m?"No elections":e.nextElectionTicks!=null?e.nextElectionTicks:"—",c=m?"var(--text-dim)":typeof o=="number"&&o<=3?"var(--red)":"var(--text-bright)",l=m?"NEXT ELECTION":e.nextElectionLabel?"NEXT "+e.nextElectionLabel.toUpperCase():"NEXT ELECTION";return`<div class="po-summary">
        <div class="po-summary-cell" style="display:flex;flex-direction:row;align-items:center;gap:8px;">
            <div style="width:8px;height:8px;background:${t};"></div>
            <div>
                <div style="font-size:11px;font-weight:700;color:var(--text-bright);">${V(p)}</div>
                <div class="po-summary-sub">${e.ticksInPower} ticks in power</div>
            </div>
        </div>
        <div class="po-summary-cell" style="text-align:center;">
            <div class="po-summary-label">GOV. SCORE</div>
            <div class="po-summary-value" style="color:${n};">${s}</div>
        </div>
        <div class="po-summary-cell" style="text-align:center;">
            <div class="po-summary-label">MOMENTUM</div>
            <div style="display:flex;align-items:baseline;justify-content:center;gap:3px;">
                <span class="po-summary-value" style="color:var(--orange);">${r}</span>
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
            <div class="po-summary-label">${l}</div>
            <div class="po-summary-value" style="color:${c};">${o}${typeof o=="number"?" ticks":""}</div>
        </div>
    </div>`}function mi(e,t,a,i,r){const s=t?.leader_first_name&&t?.leader_last_name?`${t.leader_first_name} ${t.leader_last_name}`:"Unknown",n=((t?.leader_first_name||"?")[0]+(t?.leader_last_name||"?")[0]).toUpperCase();t?.leader_age&&`${t.leader_age}`;const p=t?.approval_rating??0;return`<div class="po-card po-identity" style="border-left-color:${a};">
        <div class="po-identity-inner">
            <div class="po-identity-logo" style="color:${a};background:${a}12;border-color:${a}33;">${n}</div>
            <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;flex-wrap:wrap;">
                    <span class="po-identity-name">${V(t?.faction_name)}</span>
                    <span class="po-identity-badge" style="color:${r};background:${r}0a;border-color:${r}44;">${i}</span>
                    ${Ae(t?.bloc_id,e.blocMap)}
                </div>
                <div class="po-identity-meta">${e.ticksInPower} ticks in power</div>
                <div class="po-leader-row">
                    <div class="po-leader-avatar" style="color:${a};background:${a}15;border-color:${a}33;">${n}</div>
                    <div style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:4px;">
                            <span style="font-size:10px;font-weight:600;color:var(--text-bright);">${V(s)}</span>
                            <span style="font-family:var(--font-mono);font-size:7px;color:${a};">PARTY LEADER</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:8px;margin-top:2px;">
                            <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);">APPROVAL</span>
                            <span style="font-family:var(--font-mono);font-size:8px;font-weight:700;color:var(--amber);">${p}%</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>`}function fi(e){const t=e.governanceDeltas,a=e.governanceScore,i=a>=0?"var(--green)":"var(--red)",s=(e.governanceDecayCycles>0&&a>0?`Decay: ${((1-e.governanceMultiplier)*100).toFixed(1)}% (${e.governanceDecayCycles} cycles)`:"")||(t.length>0?`${t.length} modifier${t.length===1?"":"s"}`:""),n=t.map((p,m)=>{const o=p.isGood?"var(--green)":"var(--red)",c=p.delta>0?"+":"",l=p.key.replace(/_/g," ").replace(/\b\w/g,d=>d.toUpperCase());return`<div class="po-gov-row" style="${m<t.length-1?"border-bottom:1px solid rgba(200,196,184,0.03);":""}">
            <span class="po-gov-stat">${V(l)}</span>
            <span class="po-gov-val">${p.start.toFixed(1)}</span>
            <span class="po-gov-val">${p.now.toFixed(1)}</span>
            <span class="po-gov-delta" style="color:${o};">${c}${p.delta.toFixed(1)}</span>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <div style="display:flex;align-items:center;gap:6px;">
                <span class="po-card-title">GOVERNANCE</span>
                <span style="font-family:var(--font-mono);font-size:12px;font-weight:700;color:${i};">${a}</span>
            </div>
            <span class="po-card-subtitle">${V(s)}</span>
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
    </div>`}function vi(e,t,a){const i=[{id:t?.id,name:"You",color:a},...e.rivalParties.map(o=>({id:o.id,name:o.abbreviation||o.faction_name?.slice(0,3)||"?",color:o.party_color||"#666"}))],r=i.map(o=>{const c=ot.includes(o.id);return`<div class="po-legend-item ${c?"active":"inactive"}" data-party-id="${o.id}" style="${c?`background:${o.color}12;border-color:${o.color}44;`:""}">
            <div class="po-legend-dot" style="background:${c?o.color:"var(--text-dim)"};"></div>
            <span class="po-legend-name">${V(o.name)}</span>
        </div>`}).join(""),s=new Set(ot);let n=0;for(const o of s){const c=e.strongholdsByParty[o]||[];for(const l of c)l.contribution>n&&(n=l.contribution)}n<=0&&(n=1);const p=t?.id,m=i.filter(o=>s.has(o.id)).map(o=>{const c=o.color||"#666";let l;if(o.id===p){const d=(e.mySectorContributions||[]).map(f=>{const u=Math.round(Number(f.popularity)||0),v=u>=50?"var(--green)":u>=25?"var(--amber)":u>0?"var(--text-secondary)":"var(--text-dim)";return`<div class="po-stronghold-cell" style="border-color:${c}44;background:${c}08;">
                        <span class="po-stronghold-cell-label">${V(f.name)}</span>
                        <span class="po-stronghold-cell-value" style="color:${v};">${u}</span>
                    </div>`}).join("");l=d.length>0?`<div class="po-stronghold-grid">${d}</div>`:'<div style="font-size:9px;color:var(--text-dim);font-family:var(--font-mono);padding:4px 0;">No active sectors in this nation.</div>'}else{const d=e.strongholdsByParty[o.id]||[];l=d.length>0?`<div class="po-stronghold-chips">${d.map(f=>{const u=Math.max(8,f.contribution/n*100);return`<div class="po-stronghold-chip" style="border-color:${c}44;background:${c}10;">
                            <div class="po-stronghold-chip-bar" style="width:${u}%;background:${c};"></div>
                            <span class="po-stronghold-chip-label">${V(f.name)}</span>
                        </div>`}).join("")}</div>`:'<div style="font-size:9px;color:var(--text-dim);font-family:var(--font-mono);padding:4px 0;">Unaligned (no sector popularity yet)</div>'}return`<div class="po-stronghold-row">
                <div class="po-stronghold-party">
                    <div class="po-legend-dot" style="background:${c};"></div>
                    <span class="po-stronghold-party-name">${V(o.name)}</span>
                </div>
                ${l}
            </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">SECTOR STRONGHOLDS</span>
            <span class="po-card-subtitle">your popularity per sector · rivals show top 3</span>
        </div>
        <div style="padding:8px 12px;">
            <div class="po-legend">${r}</div>
            ${m||'<div style="padding:8px 0;font-size:9px;color:var(--text-dim);font-family:var(--font-mono);">No parties to display.</div>'}
        </div>
    </div>`}function ui(e){const t=(e.caucuses||[]).filter(r=>r.name&&r.name!=="Unnamed");if(t.length===0)return`<div class="po-card">
            <div class="po-card-header">
                <span class="po-card-title">INTERNAL CAUCUSES</span>
                <span class="po-card-subtitle">None</span>
            </div>
        </div>`;const a=e.faction?.seats||0,i=t.map(r=>{const s=r.relationship_score??50,n=s>60?"var(--green)":s>40?"var(--amber)":"var(--red)",p=Math.round((r.seat_share||0)*a),m=(r.dominant_axis||"").replace(/_/g,"/"),o=r.wing_end==="left"?m.split("/")[0]:m.split("/")[1]||"";return`<div class="po-caucus-row">
            <div>
                <div class="po-caucus-name">${V(r.name)}</div>
                <div class="po-caucus-wing" style="color:var(--text-dim);">${V(o)}</div>
            </div>
            <div style="display:flex;align-items:center;gap:10px;">
                <span class="po-caucus-seats">${p} seats</span>
                <div style="width:50px;">
                    <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);text-align:right;margin-bottom:1px;">LOYALTY</div>
                    <div style="width:100%;height:3px;background:var(--border-main);"><div style="height:100%;width:${s}%;background:${n};"></div></div>
                    <div style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${n};text-align:right;margin-top:1px;">${s}</div>
                </div>
            </div>
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">INTERNAL CAUCUSES</span>
            <span class="po-card-subtitle">${t.length} active · ${a} seats</span>
        </div>
        ${i}
    </div>`}function gi(e,t){const i=Math.round(t*8/100*10)/10,r=Math.min(100,Math.max(0,t)),s=t>=60?"var(--green)":t>=30?"var(--orange)":"var(--red)";return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">MOMENTUM</span>
            <span style="font-family:var(--font-mono);font-size:7px;color:var(--red);">losing ${i}/tick</span>
        </div>
        <div style="padding:10px 12px;">
            <div style="display:flex;align-items:baseline;gap:4px;margin-bottom:6px;">
                <span style="font-family:var(--font-mono);font-size:28px;font-weight:700;color:${s};">${t}</span>
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">/ 100</span>
            </div>
            <div style="width:100%;height:4px;background:var(--border-main);">
                <div style="height:100%;width:${r}%;background:${s};"></div>
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
        <div style="max-height:380px;overflow-y:auto;">${t.map(s=>{const n=a-(s.tick_performed||0),p=n===0?"0t":n+"t",m=s.result||{},o=m.momentumDelta||m.momentum_delta||m.momentum||(m.momCost?-m.momCost:0)||(m.effects||[]).reduce((u,v)=>u+(v.stat==="Momentum"?v.value:0),0)||0,c=o>0?"+":"",l=o>0?"var(--green)":o<0?"var(--red)":"var(--text-dim)";let f=i[s.action_type]||s.action_type?.replace(/_/g," ")||"?";return s.action_type==="rally"?f="Rally: "+(m.outcomeName||m.label||"Unknown")+(o?" ("+c+o+")":""):s.action_type==="press_conference"?f="Press Conference ("+c+o+")":s.action_type==="attack"?f="Attack on "+(m.targetName||"rival"):s.action_type==="issue_statement"?f="Issued statement"+(o?" ("+c+o+")":""):s.action_type==="take_stance"?f="Took stance on "+(m.issueLabel||"issue"):s.action_type==="ideological_pivot"?f="Ideology shift: "+(m.targetAxis||""):s.action_type==="poll_now"&&(f="Polled (margin: "+(m.pollMargin||"?")+")"),`<div style="padding:5px 12px;border-bottom:1px solid rgba(200,196,184,0.03);display:flex;justify-content:space-between;align-items:center;">
            <span style="font-size:9px;color:var(--text-secondary);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-right:8px;">${V(f)}</span>
            <div style="display:flex;align-items:center;gap:8px;flex-shrink:0;">
                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;color:${l};">${o!==0?c+o:"—"}</span>
                <span style="font-family:var(--font-mono);font-size:7px;color:var(--text-dim);width:20px;text-align:right;">${p}</span>
            </div>
        </div>`}).join("")}</div>
    </div>`}function bi(e,t){const a=e.rivalParties,i=e.administration,r=ht.nation,s=i?.pm_party_id,n=r?.total_seats||100,p=a.map(m=>{const o=m.party_color||"#666",c=m.abbreviation||m.faction_name?.slice(0,3)?.toUpperCase()||"?",l=m.leader_first_name&&m.leader_last_name?`${m.leader_first_name} ${m.leader_last_name}`:"Unknown",d=m.seats||0,f=$a(m,i,e.ministryPartyIds,r);let u=f.label;const v=f.isGoverning?"var(--green)":"var(--orange)";f.isGoverning&&f.label==="GOVERNING"&&(m.id===s?u="GOVERNING — LEAD":u="GOVERNING — JUNIOR");const h=d-(t?.seats||0),x=h>0?"var(--green)":h<0?"var(--red)":"var(--text-dim)",b=e.strongholdsByParty?.[m.id]||[],g=b.length>0?`<div style="display:flex;flex-wrap:wrap;gap:4px;">${b.map(w=>`<span style="font-family:var(--font-mono);font-size:9px;padding:2px 6px;border:1px solid ${o}44;background:${o}10;color:var(--text-bright);white-space:nowrap;">${V(w.name)}</span>`).join("")}</div>`:'<div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Unaligned</div>';return`<div style="padding:12px 16px;border-bottom:1px solid var(--border-main);">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                <div style="display:flex;align-items:center;gap:8px;">
                    <div style="width:36px;height:36px;background:${o}15;border:1px solid ${o}33;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${o};">${V(c)}</div>
                    <div>
                        <div style="font-size:15px;font-weight:700;color:var(--text-bright);">${V(m.faction_name)}</div>
                        <div style="font-family:var(--font-mono);font-size:11px;color:var(--text-dim);">${V(l)}</div>
                    </div>
                </div>
                <div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;">
                    <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 7px;color:${v};background:${v}0a;border:1px solid ${v}44;white-space:nowrap;">${u}</span>
                    ${Ae(m.bloc_id,e.blocMap)}
                </div>
            </div>
            <div style="display:flex;gap:10px;margin-bottom:8px;">
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">SEATS</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${d>0?"var(--text-bright)":"var(--text-dim)"};">${d}</span>
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">/ ${n}</span>
                </div>
                <div style="display:flex;align-items:center;gap:5px;">
                    <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">VS YOU</span>
                    <span style="font-family:var(--font-mono);font-size:15px;font-weight:700;color:${x};">${h>0?"+":""}${h}</span>
                </div>
            </div>
            ${g}
        </div>`}).join("");return`<div class="po-card">
        <div class="po-card-header">
            <span class="po-card-title">RIVAL PARTIES</span>
            <span class="po-card-subtitle">${a.length} parties</span>
        </div>
        ${p||'<div style="padding:16px 12px;text-align:center;font-family:var(--font-mono);font-size:9px;color:var(--text-dim);font-style:italic;">No rival parties.</div>'}
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
    </div>`}let B=null,O=null,yt=!1,_t=null,q=[],ft=[],tt=0,ne={},ge=[],Ke=null,it=0,Ot=null,st=0,ct=[],Qt=!1,wt=null,Y={},Zt=!1;function U(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}async function We(e,t){B=e,O=t;const a=t.nation,i=t.faction;if(!a||!i)return{needed:!1};const[r,s,n,p,m,o]=await Promise.all([e.from("elections").select("id, election_type, election_tick, status").eq("nation_id",a.id).eq("status","completed").order("election_tick",{ascending:!1}).limit(1).maybeSingle(),e.from("shard").select("current_tick").eq("name","Alpha Shard").single(),pe(e,a.id),e.from("factions").select("id, faction_name, abbreviation, party_color, seats, bloc_id").eq("nation_id",a.id).eq("faction_type","party").is("abandoned_at",null).order("seats",{ascending:!1}),e.from("elections").select("election_tick, election_type").eq("nation_id",a.id).eq("status","scheduled").order("election_tick",{ascending:!0}),e.from("faction_platforms").select("faction_id, platform_key, slot").eq("nation_id",a.id).eq("status","active").order("slot",{ascending:!0})]);st=s.data?.current_tick??0,q=p.data||[],tt=q.reduce((f,u)=>f+(u.seats||0),0),it=Math.ceil(tt/2)+1,ge=m?.data||[],Ke=n||null,ne={},o?.error&&console.warn("[CoalitionFormation] faction_platforms query failed:",o.error.message);for(const f of o?.data||[])(ne[f.faction_id]||=[]).push(f.platform_key);const c=r.data,d=!!(n||null);return rt(a)?(yt=!1,{needed:!1}):(c&&!d?(yt=!0,_t=c.id,Ot=c.election_tick):(yt=!d,c&&(_t=c.id,Ot=c.election_tick)),{needed:yt})}function _i(){const e=O?.nation;if(!e||K(e))return"";const t=rt(e),a=ge[0]||null,i=a?.election_tick??null,r=a?.election_type||"parliamentary",s=t?r==="presidential"?"General":"Midterm":"Parliamentary",n=Number(st)||0,p=i!=null?Math.max(0,i-n):null,m=p==null?null:`${p} Month${p===1?"":"s"}`,o=i!=null?ga(i):"TBD",c=Number(e.total_seats)||0,l=Number(e.parliamentary_term_ticks)||Number(e.election_frequency)||24,d=`${l} Month${l===1?"":"s"}`,f=e.name||"Unknown",u=e.flag_url||`assets/flags/${f}.png`,v=[m,`Type: ${s}`].filter(Boolean).map(g=>`<div class="cf-eh-stat-sub">${U(g)}</div>`).join(""),h=Ke?.status||null,x=h?h.charAt(0).toUpperCase()+h.slice(1):null;return`<div class="cf-election-header">
        <div class="cf-eh-left">
            <div class="cf-eh-label">&bull; ELECTIONS</div>
            ${x?`<div class="cf-eh-gov-status">GOVERNMENT STATUS: <span class="cf-eh-gov-status-value">${U(x)}</span></div>`:""}
            <div class="cf-eh-title-row">
                <img class="cf-eh-flag" src="${U(u)}" alt="${U(f)} flag" onerror="this.style.display='none'">
                <h2 class="cf-eh-title">Elections of ${U(f)}</h2>
            </div>
        </div>
        <div class="cf-eh-stats">
            <div class="cf-eh-stat">
                <div class="cf-eh-stat-label">NEXT ELECTION</div>
                <div class="cf-eh-stat-value cf-eh-stat-value--accent">${U(o)}</div>
                ${v}
            </div>
            <div class="cf-eh-stat">
                <div class="cf-eh-stat-label">TOTAL SEATS</div>
                <div class="cf-eh-stat-value">${c}</div>
                <div class="cf-eh-stat-label" style="margin-top:10px;">ELECTORAL FREQUENCY</div>
                <div class="cf-eh-stat-value cf-eh-stat-value--sm">${U(d)}</div>
            </div>
        </div>
    </div>`}function $i(){const e=O?.nation;if(!e||K(e))return"";const t=Number(e.total_seats)||0;if(t<=0)return"";const a=q.filter(l=>(l.seats||0)>0).slice().sort((l,d)=>(d.seats||0)-(l.seats||0)),i=a.reduce((l,d)=>l+(d.seats||0),0),r=Math.max(0,t-i),s=Math.ceil(t/2)+1,n=s/t*100,p=a.map(l=>{const d=(l.seats||0)/t*100,f=l.party_color||"var(--text-dim)";return`<div class="cf-em-seg" style="width:${d}%;background:${U(f)};" title="${U(l.faction_name)}: ${l.seats} seats"></div>`}).join(""),m=r>0?`<div class="cf-em-seg cf-em-seg--stake" style="width:${r/t*100}%;">
               <span class="cf-em-stake-label">${r} SEATS AT STAKE</span>
           </div>`:"",o=a.map(l=>{const d=l.party_color||"var(--text-dim)";return`<div class="cf-em-chip">
            <span class="cf-em-swatch" style="background:${U(d)};"></span>
            <span class="cf-em-chip-name">${U(l.faction_name)}</span>
            <span class="cf-em-chip-count">${l.seats}</span>
            <span class="cf-em-chip-unit">seats</span>
        </div>`}).join(""),c=r>0?`<div class="cf-em-chip">
               <span class="cf-em-swatch cf-em-swatch--stake"></span>
               <span class="cf-em-chip-name">At Stake</span>
               <span class="cf-em-chip-count">${r}</span>
               <span class="cf-em-chip-unit">seats</span>
           </div>`:"";return`<div class="cf-electoral-makeup">
        <div class="cf-em-header">
            <div class="cf-em-title">&#9642; ELECTORAL MAKEUP</div>
            <div class="cf-em-meta">MAJORITY AT <span class="cf-em-majority">${s} SEATS</span> &middot; ${t} TOTAL</div>
        </div>
        <div class="cf-em-bar">
            ${p}
            ${m}
            <div class="cf-em-majority-tick" style="left:${n.toFixed(2)}%;"></div>
        </div>
        <div class="cf-em-legend">
            ${o}
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
           </div>`:"";if(rt(O.nation)){const b=me(O.nation);e.innerHTML=`${t}${i}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">&#127979;</div>
                <div class="cf-no-title">${b?"Semi-Presidential System":"Presidential System"}</div>
                <div class="cf-no-desc">${b?"The President nominates a Prime Minister for parliamentary confirmation. The PM then appoints cabinet ministers. No coalition formation is required.":"The President governs directly and nominates cabinet ministers. No coalition formation is required."}</div>
            </div>
        </div>`;return}if(!yt){e.innerHTML=`${t}${i}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon">✓</div>
                <div class="cf-no-title">Government Formed</div>
                <div class="cf-no-desc">A coalition government is currently active. No formation needed.</div>
            </div>
        </div>`;return}if(!_t){const b=ge[0]?.election_tick,g=b!=null?Math.max(0,b-st):"?";e.innerHTML=`${t}${i}
        <div class="cf-page">
            <div class="cf-no-formation">
                <div class="cf-no-icon" style="font-size:2rem;">&#9878;</div>
                <div class="cf-no-title">No Government</div>
                <div class="cf-no-desc">No election has been held yet. The first election is in <strong style="color:var(--accent);">${g}</strong> tick${g!==1?"s":""}.</div>
            </div>
        </div>`;return}await Mi();const r=O.faction,s=Ot!==null?Math.max(0,st-Ot):0,n=Math.max(0,te-s),p=Math.min(100,s/te*100),m=s*2;let o="safe";n<=1?o="critical":n<=2&&(o="warning");const c=o==="critical"?"⚠️":o==="warning"?"⏳":"🤝",l=o==="critical"?"No Government — Snap Election Imminent":o==="warning"?"Coalition Formation — Time Running Out":"Coalition Formation In Progress",d=o==="critical"?"Form a government immediately or face snap elections":o==="warning"?"Parties are negotiating — the deadline is approaching":"Parties are negotiating a coalition — propose or join one below",f=q.find(b=>b.id===r.id)?.seats||0,u=f>0,v=ft.some(b=>b.proposed_by===r.id);let h="";if(!u)h='<div class="cf-note">Your party has <strong>0 seats</strong>. You cannot propose a coalition, but you may be invited to one.</div>';else if(v)h='<div class="cf-note">You have already submitted a proposal for this election.</div>';else{const b=w=>(w||[]).map(L=>L.replace(/_/g," ")).join(", "),g=q.map(w=>{const L=w.id===r.id,M=w.seats||0,S=w.party_color||"#888",I=(ne[w.id]||[]).map(E=>xt.find(z=>z.id===E)).filter(Boolean).map(E=>`<div class="cf-platform">
                <span class="cf-platform-label"><span class="cf-platform-icon">${E.icon}</span> ${U(E.name)}</span>
                <span class="cf-platform-stats">
                    <span class="cf-stat-up">&uarr; ${b(E.improve)}</span>
                    <span class="cf-stat-down">&darr; ${b(E.worsen)}</span>
                </span>
            </div>`).join(""),N=I?`<div class="cf-check-platforms">${I}</div>`:'<div class="cf-check-platforms cf-check-platforms--empty">No adopted platforms.</div>';return`<div class="cf-party-check ${L?"checked disabled":""}" data-party-id="${w.id}" style="border-left:3px solid ${S};">
                <div class="cf-party-info">
                    <div class="cf-check-box">${L?"✓":""}</div>
                    <span class="cf-check-name">${U(w.faction_name)}</span>
                    <span class="cf-check-seats">${M} seats</span>
                </div>
                ${N}
            </div>`}).join("");h=`
            <div class="cf-propose-section">
                <div class="cf-section-title">Propose a Government</div>
                <div class="cf-section-desc">Select which parties will form the coalition. You need ${it}+ seats for a majority.</div>
                <div class="cf-party-grid" id="cf-party-grid">${g}</div>
                <div class="cf-seat-preview" id="cf-seat-preview">
                    Coalition seats: <span class="cf-preview-val" id="cf-preview-seats">${f}</span> / ${tt}
                    (<span id="cf-preview-pct">${tt?Math.round(f/tt*100):0}</span>%)
                    <span id="cf-preview-threshold" style="margin-left:8px;color:var(--text-dim);">— needs ${it} seats</span>
                </div>
                <button class="cf-submit-btn" id="cf-propose-btn">Submit Proposal</button>
            </div>`}const x=ft.length>0?`
        <div class="cf-section-title" style="margin-top:16px;">Active Proposals</div>
        <div class="cf-proposals-grid">${ft.map(b=>{const g=q.find(T=>T.id===b.proposed_by),w=b.party_ids||[],L=w.reduce((T,A)=>T+(q.find(R=>R.id===A)?.seats||0),0),M=tt?Math.round(L/tt*100):0,S=L>=it,k=w.map(T=>{const A=q.find(R=>R.id===T);return`<span class="cf-party-chip" style="border-left:2px solid ${A?.party_color||"#888"};">${U(A?.faction_name||"?")} · ${A?.seats||0}</span>`}).join("");let I="";b.iAmSupporting?I='<span class="cf-status cf-status--supporting">✓ SUPPORTING</span>':b.iAmInvited?I='<span class="cf-status cf-status--invited">INVITED</span>':I='<span class="cf-status cf-status--locked">NOT INVITED</span>';const N=b.iAmInvited&&!b.iAmSupporting?`<button class="cf-support-btn" data-formation-id="${b.id}" data-action="support">Support This Coalition</button>`:b.iAmSupporting?`<button class="cf-withdraw-btn" data-formation-id="${b.id}" data-action="withdraw">Withdraw Support</button>`:"",E=b.supportCount>=b.coalitionSize,z=wt===b.id,C=E&&b.iAmInvited&&!z,P=E&&z;return`<div class="cf-proposal-card ${b.iAmSupporting?"supporting":""} ${b.iAmInvited?"":"not-invited"}">
                <div class="cf-proposal-title">${U(g?.faction_name||"Unknown")} Coalition ${I}</div>
                <div class="cf-proposal-seats">Seats: <span style="color:${S?"var(--green)":"var(--red)"};">${L}</span> (${M}%) ${S?"✓":"— below threshold"}</div>
                <div class="cf-proposal-chips">${k}</div>
                <div class="cf-proposal-support">Support: ${b.supportCount} / ${b.coalitionSize} coalition members ${E?'<span style="color:var(--green);font-weight:700;"> — UNANIMOUS</span>':""}</div>
                ${N}
                ${C?`<button class="cf-support-btn" data-formation-id="${b.id}" data-action="configure" style="margin-top:6px;background:var(--green);color:#000;border-color:var(--green);">Configure Government &amp; Assign Ministries</button>`:""}
                ${P?Ei(b):""}
            </div>`}).join("")}</div>
    `:"";e.innerHTML=`${t}${i}
    <div class="cf-page">
        <!-- Formation Banner -->
        <div class="cf-banner cf-banner--${o}">
            <div class="cf-banner-header">
                <span class="cf-banner-icon">${c}</span>
                <div>
                    <div class="cf-banner-title">${l}</div>
                    <div class="cf-banner-subtitle">${d}</div>
                </div>
            </div>
            <div class="cf-countdown">
                <div class="cf-countdown-track"><div class="cf-countdown-fill cf-countdown-fill--${o}" style="width:${p}%;"></div></div>
                <div class="cf-countdown-text">${n>0?n+" tick"+(n!==1?"s":"")+" remaining":"⚡ SNAP ELECTION IMMINENT"}</div>
            </div>
            <div class="cf-penalties">
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--red);">-2%</div>
                    <div class="cf-penalty-label">Approval / Tick</div>
                </div>
                <div class="cf-penalty-card">
                    <div class="cf-penalty-val" style="color:var(--orange);">${s}</div>
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
    </div>`,ct=[r.id],Si(e)}const wi={prime_minister:"Prime Minister",interior:"Interior",foreign:"Foreign Affairs",defense:"Defense",finance:"Finance",education:"Education",healthcare:"Healthcare",labor:"Labor",justice:"Justice",trade:"Trade",energy:"Energy",transportation:"Transportation",security:"Security"};function ki(e){const t=["prime_minister","interior","foreign","defense","finance","education","healthcare","labor","justice","trade","energy","transportation"],a=["interior","foreign","defense","finance","education","healthcare","labor","justice","trade","energy","transportation"];return me(e)?t:rt(e)?a:t}function Ei(e){const t=(e.party_ids||[]).map(o=>q.find(c=>c.id===o)).filter(Boolean),a=(e.party_ids||[]).includes(O.faction?.id);Y={...e.ministry_assignments||{}};const r=O.faction?.id,s=Y.prime_minister,n=s===r;let p=`<div style="padding:12px 16px;border-top:1px solid var(--border-main);background:var(--bg-card);">
        <div style="font-family:var(--font-mono);font-size:11px;font-weight:700;letter-spacing:1.5px;color:var(--accent);margin-bottom:10px;">CONFIGURE GOVERNMENT</div>
        <div style="font-size:11px;color:var(--text-dim);margin-bottom:12px;">All coalition members can assign ministries. The party selected as Prime Minister clicks Form Government.</div>`;for(const o of ra){const c=wi[o]||o,l=o==="prime_minister",d=Y[o];a&&(p+=`<div style="display:flex;align-items:center;gap:8px;padding:6px 0;border-bottom:1px solid rgba(42,42,36,0.2);">
                <span style="width:140px;font-family:var(--font-mono);font-size:10px;font-weight:${l?"700":"400"};color:${l?"var(--accent)":"var(--text-secondary)"};letter-spacing:0.5px;">${c}</span>
                <select data-ministry="${o}" class="cf-ministry-select" style="flex:1;padding:4px 8px;font-family:var(--font-mono);font-size:10px;color:var(--text-bright);background:var(--bg-body);border:1px solid var(--border-main);outline:none;">
                    <option value="">— Select Party —</option>
                    ${t.map(f=>`<option value="${f.id}" ${d===f.id?"selected":""}>${U(f.faction_name)} (${f.seats||0} seats)</option>`).join("")}
                </select>
            </div>`)}const m=!!Y.prime_minister;if(m&&n)p+=`<div style="margin-top:14px;display:flex;justify-content:flex-end;">
            <button id="cf-form-gov-btn" style="padding:10px 28px;font-family:var(--font-mono);font-size:12px;font-weight:700;letter-spacing:1.5px;color:#000;background:var(--green);border:1px solid var(--green);cursor:pointer;">FORM GOVERNMENT</button>
        </div>`;else if(m&&!n){const o=t.find(c=>c.id===s);p+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(92,204,92,0.04);border:1px solid rgba(92,204,92,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Waiting for <span style="color:var(--green);font-weight:700;">${U(o?.faction_name||"PM party")}</span> to click Form Government.
        </div>`}else p+=`<div style="margin-top:14px;padding:8px 12px;background:rgba(200,168,50,0.04);border:1px solid rgba(200,168,50,0.12);font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">
            Select a Prime Minister to enable government formation.
        </div>`;return p+="</div>",p}async function Ci(e,t){if(Zt)return;const a=Y.prime_minister;if(!a){alert("You must assign a Prime Minister first.");return}console.log("[Coalition] handleFormGovernment called. Assignments:",JSON.stringify(Y)),console.log("[Coalition] Formation:",e.id,"PM party:",a),Zt=!0;const i=document.getElementById("cf-form-gov-btn");i&&(i.disabled=!0,i.textContent="FORMING...");try{const r=O.nation,s=r.id,n=Bt(r?.name)||{},p=n.firstNames||["Alex","Maria","Carlos"],m=n.lastNames||["Garcia","Torres","Silva"],o={};for(const[x,b]of Object.entries(Y||{}))b&&(o[x]={first_name:p[Math.floor(Math.random()*p.length)],last_name:m[Math.floor(Math.random()*m.length)],age:35+Math.floor(Math.random()*25)});const{error:c}=await B.from("government_formations").update({ministry_assignments:Y,minister_names:o}).eq("id",e.id);if(c)throw new Error("Failed to save assignments: "+c.message);let l=!1;try{const x=Tt?Tt(null,r):{},{error:b}=await B.rpc("finalize_government_formation",{p_formation_id:e.id,p_caller_faction_id:O.faction.id,p_ministry_baselines:x||{}});if(b)throw b;l=!0}catch(x){console.warn("[Coalition] RPC failed, using fallback:",x.message)}l||await Ii(e),await B.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",e.id),await B.from("government_formations").update({status:"dissolved"}).eq("nation_id",s).neq("id",e.id).in("status",["active","caretaker","formed"]);const f=ki(r).length,{count:u}=await B.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",s).eq("is_active",!0),{count:v}=await B.from("ministries").select("id",{count:"exact",head:!0}).eq("nation_id",s).eq("is_active",!0).is("party_id",null);(!u||u<f||v&&v>0)&&(console.warn(`[Coalition] Ministry invariant check failed (expected=${f}, active=${u||0}, vacant=${v||0}) — populating from assignments`),await Je(s));const h={id:e.id,party_ids:e.party_ids||[],lead_party_id:Y.prime_minister};await Te(B,s,O.nation,"election",h,q,st,O.shard?.current_date||"",Number(O.nation?.gov_approval??50)),await sa(B,s,a,st,{skipCoalitionCheck:!0}),yt=!1,alert("Government formed successfully!"),await ut(t)}catch(r){console.error("[Coalition] Form government failed:",r),alert("Failed to form government: "+(r.message||r))}finally{Zt=!1,i&&(i.disabled=!1,i.textContent="FORM GOVERNMENT")}}async function Ii(e){const t=O.nation.id,{error:a}=await B.from("government_formations").update({status:"cancelled"}).eq("nation_id",t).eq("status","active").neq("id",e.id);a&&console.warn("[Coalition] Failed to cancel rival formations:",a.message);const{error:i}=await B.from("government_formations").update({status:"formed",formed_at:new Date().toISOString()}).eq("id",e.id);if(i)throw i;const{error:r}=await B.from("nations").update({failed_formation_attempts:0}).eq("id",t);r&&console.warn("[Coalition] Failed to reset formation attempts:",r.message),await Je(t);const s={id:e.id,party_ids:e.party_ids||[],lead_party_id:Y.prime_minister};await Te(B,t,O.nation,"election",s,q,st,O.shard?.current_date||"",Number(O.nation?.gov_approval??50));try{const n=Y.prime_minister,p=q.find(o=>o.id===n),m=(e.party_ids||[]).map(o=>{const c=q.find(l=>l.id===o);return c?`${c.faction_name} (${c.seats||0})`:null}).filter(Boolean).join(", ");await B.from("event_log").insert({nation_id:t,event_name:"Coalition Government Formed",category:"government",fired_at_tick:st,description_used:`${p?.faction_name||"PM party"} formed a coalition government with: ${m}`,description_chosen:`${p?.faction_name||"PM party"} formed a coalition government with: ${m}`})}catch(n){console.warn("[Coalition] event_log insert failed (non-fatal):",n.message)}}async function Je(e){let t=0;for(const[a,i]of Object.entries(Y)){if(!i)continue;const r=Bt(O.nation?.name)||{},s=r.firstNames||["Alex","Maria","Carlos"],n=r.lastNames||["Garcia","Torres","Silva"],p=s[Math.floor(Math.random()*s.length)],m=n[Math.floor(Math.random()*n.length)],o=35+Math.floor(Math.random()*25),c=Tt?Tt(a,O.nation):{},{data:l,error:d}=await B.from("ministries").update({party_id:i,minister_first_name:p,minister_last_name:m,minister_age:o,minister_approval:50,stat_baselines:c,is_active:!0}).eq("nation_id",e).eq("ministry_key",a).select("id");if(d)console.error(`[Coalition] FAILED to update ministry ${a}:`,d.message);else if(!l||l.length===0){const{error:f}=await B.from("ministries").insert({nation_id:e,ministry_key:a,ministry_name:la[a]||a,party_id:i,minister_first_name:p,minister_last_name:m,minister_age:o,minister_approval:50,stat_baselines:c,is_active:!0});f?console.error(`[Coalition] FAILED to insert ministry ${a}:`,f.message):t++}else t++}console.log(`[Coalition] Updated ${t} ministries for nation ${e}`)}async function Mi(){if(!_t){ft=[];return}const{data:e}=await B.from("government_formations").select("*").eq("election_id",_t).eq("status","active").order("created_at",{ascending:!0}),t=[];for(const a of e||[]){const{data:i}=await B.from("government_formation_support").select("faction_id, supports").eq("formation_id",a.id),r=a.party_ids||[],n=(i||[]).filter(l=>r.includes(l.faction_id)).filter(l=>l.supports).length,p=r.length,o=(i||[]).find(l=>l.faction_id===O.faction?.id)?.supports===!0,c=r.includes(O.faction?.id);t.push({...a,supportCount:n,coalitionSize:p,iAmSupporting:o,iAmInvited:c})}ft=t}let Me=!1;function Si(e){Me||(Me=!0,e.addEventListener("click",async t=>{const a=t.target.closest(".cf-party-check:not(.disabled)");if(a){const r=a.dataset.partyId,n=q.find(o=>o.id===r)?.bloc_id||null,p=!ct.includes(r),m=n?q.filter(o=>o.bloc_id===n).map(o=>o.id):[r];for(const o of m){const c=ct.indexOf(o);p&&c===-1&&ct.push(o),!p&&c>-1&&ct.splice(c,1);const l=e.querySelector(`.cf-party-check[data-party-id="${o}"]`);if(!l)continue;l.classList.toggle("checked",p);const d=l.querySelector(".cf-check-box");d&&(d.textContent=p?"✓":"")}Li();return}if(t.target.closest("#cf-propose-btn")){await Pi(e);return}const i=t.target.closest(".cf-support-btn, .cf-withdraw-btn");if(i){const r=i.dataset.formationId,s=i.dataset.action;if(s==="configure"){wt=r;const n=ft.find(p=>p.id===r);n&&(Y={...n.ministry_assignments||{}}),await ut(e)}else await Ai(r,s==="support",e);return}if(t.target.closest("#cf-form-gov-btn")){const r=ft.find(s=>s.id===wt);r&&await Ci(r,e);return}}),e.addEventListener("change",t=>{const a=t.target.closest(".cf-ministry-select");if(!a)return;const i=a.dataset.ministry,r=a.value||null;Y[i]=r,wt&&B.from("government_formations").update({ministry_assignments:Y}).eq("id",wt).then(({error:n})=>{n&&console.warn("[Coalition] Failed to save assignment:",n.message)});const s=document.getElementById("cf-form-gov-btn");if(s){const n=!!Y.prime_minister;s.disabled=!n,s.style.color=n?"#000":"var(--text-dim)",s.style.background=n?"var(--green)":"var(--bg-body)",s.style.borderColor=n?"var(--green)":"var(--border-main)",s.style.cursor=n?"pointer":"not-allowed"}}))}function Li(){const e=document.getElementById("cf-preview-seats"),t=document.getElementById("cf-preview-pct"),a=document.getElementById("cf-preview-threshold");if(!e)return;const i=ct.reduce((n,p)=>n+(q.find(m=>m.id===p)?.seats||0),0),r=tt?Math.round(i/tt*100):0,s=i>=it;e.textContent=i,e.style.color=s?"var(--green)":"var(--text-bright)",t.textContent=r,a.textContent=s?`✓ Meets ${it}-seat threshold`:`— needs ${it} seats`,a.style.color=s?"var(--green)":"var(--text-dim)"}async function Pi(e){if(Qt)return;const t=O.faction;if((q.find(n=>n.id===t.id)?.seats||0)===0)return;const i=[...new Set(ct)],r=i.reduce((n,p)=>n+(q.find(m=>m.id===p)?.seats||0),0);if(r<it){alert(`Coalition needs ${it} seats. Currently: ${r}.`);return}Qt=!0;const s=document.getElementById("cf-propose-btn");s&&(s.disabled=!0,s.textContent="Submitting...");try{const{data:n}=await B.from("shard").select("current_date").eq("name","Alpha Shard").single(),{data:p,error:m}=await B.from("government_formations").insert({nation_id:O.nation.id,election_id:_t,proposed_by:t.id,party_ids:i,status:"active",game_year:n?.current_date||""}).select().single();if(m){alert("Error: "+m.message);return}const{error:o}=await B.from("government_formation_support").upsert({formation_id:p.id,faction_id:t.id,supports:!0},{onConflict:"formation_id,faction_id"});o&&console.warn("[Coalition] Auto-support insert failed:",o.message),await ut(e)}catch(n){console.error("[Coalition] Create proposal error:",n),alert("Failed to create proposal: "+(n.message||n))}finally{Qt=!1}}async function Ai(e,t,a){try{const{error:i}=await B.from("government_formation_support").upsert({formation_id:e,faction_id:O.faction?.id,supports:t},{onConflict:"formation_id,faction_id"});i&&console.error("[Coalition] Toggle support error:",i.message),await ut(a)}catch(i){console.error("[Coalition] Toggle support error:",i)}}let At=null,dt=[],se=[],re=null;function J(e){if(!e)return"";const t=document.createElement("div");return t.textContent=e,t.innerHTML}function Se(e){return e>=1e6?(e/1e6).toFixed(2)+"M":e>=1e3?Math.round(e/1e3)+"k":String(e)}function Ti(e){return["January","February","March","April","May","June","July","August","September","October","November","December"][e%12]+", "+(2e3+Math.floor(e/12))}function Ni(e,t){if((e.election_type||"parliamentary")==="presidential")return{label:"Presidential Election",color:"#5a8aaa"};const i=t?.end_reason||"";return i.includes("no_confidence")||i.includes("vnc")?{label:"Vote of No Confidence",color:"#d44a4a"}:i.includes("snap")||i.includes("dissolved")||i.includes("early")?{label:"Early Elections Called",color:"#c84"}:{label:"General Election",color:"#8b9a6b"}}async function zi(e,t){At=t;const a=document.getElementById("pa-past-elections-root");if(!a)return;a.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">Loading election history...</div>';const i=t.nation?.id;if(!i){a.innerHTML='<div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No nation data.</div>';return}const[r,s,n]=await Promise.all([e.from("elections").select("id, election_tick, election_type, status, results, created_at").eq("nation_id",i).eq("status","completed").order("election_tick",{ascending:!1}),e.from("administrations").select("*").eq("nation_id",i).order("started_at_tick",{ascending:!1}),e.from("factions").select("id, faction_name, abbreviation, party_color, seats").eq("nation_id",i).eq("faction_type","party").is("abandoned_at",null)]);dt=r.data||[],se=s.data||[];const p=n.data||[],m={};for(const o of p)m[o.id]=o;for(const o of dt){const c=o.results?.votes||[];for(const l of c){const d=m[l.party_id];d?(l.color=d.party_color||"#666",l.abbreviation=d.abbreviation||l.party_name?.slice(0,3)?.toUpperCase()||"?"):(l.color="#666",l.abbreviation=l.party_name?.slice(0,3)?.toUpperCase()||"?")}}Ri(a),Xe(a)}function Ri(e){e.addEventListener("click",t=>{const a=t.target.closest("[data-election-id]");if(a){const i=a.dataset.electionId;re=re===i?null:i,Xe(e)}})}function Xe(e,t){if(dt.length===0){e.innerHTML=`<div style="padding:12px 16px;">
            <div style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);margin-bottom:8px;">PAST ELECTIONS</div>
            <div style="padding:40px;text-align:center;color:var(--text-dim);font-family:var(--font-mono);font-size:12px;">No completed elections on record.</div>
        </div>`;return}const a=At.faction?.id,i=At.nation?.total_seats||100,r=Math.ceil(i/2)+1,s=dt.map((n,p)=>{const m=re===n.id,o=(n.results?.votes||[]).sort((k,I)=>(I.seats||0)-(k.seats||0)),c=o.slice(0,3),l=n.results?.turnout_pct??0,d=n.results?.total_votes_cast??0,f=Ti(n.election_tick),u=se.find(k=>k.started_at_tick>=n.election_tick&&k.started_at_tick<=n.election_tick+5),v=se.find(k=>k.ended_at_tick!=null&&k.ended_at_tick>=n.election_tick-2&&k.ended_at_tick<=n.election_tick+2),h=Ni(n,v),x=rt(At.nation),b=x?"President":"PM",g=u?.prime_minister||"Unknown",w=u?.pm_party_id&&o.find(k=>k.party_id===u.pm_party_id)?.color||"#888",M=(p<dt.length-1?dt[p+1]:null)?.results?.votes||[];let S=`<div data-election-id="${n.id}" style="
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
                        ${b}: <span style="color:${w};font-weight:700;">${J(g)}</span>
                    </div>
                    <span style="font-family:var(--font-mono);font-size:12px;color:var(--text-dim);">${m?"▲":"▼"}</span>
                </div>
            </div>
        </div>`;if(m){const k=o.map(E=>`<div style="width:${E.seats/i*100}%;background:${E.color};height:100%;display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:${E.seats>=8?9:6}px;font-weight:700;color:#000;">${E.seats>=5?E.seats:""}</div>`).join(""),I=o.map(E=>{const z=E.party_id===a,C=M.find(R=>R.party_id===E.party_id),P=C?E.seats-(C.seats||0):null,A=E.seats/i*100-(E.vote_percentage||0);return`<div class="pe-tbl-row" style="display:flex;align-items:center;padding:8px 0;border-bottom:1px solid rgba(200,196,184,0.03);${z?`background:${E.color}08;`:""}">
                    <div class="pe-col-logo" style="width:30px;height:30px;background:${E.color}15;border:1px solid ${E.color}33;display:flex;align-items:center;justify-content:center;font-size:14px;flex-shrink:0;margin-right:8px;">${E.abbreviation?.slice(0,2)||"?"}</div>
                    <div class="pe-col-party" style="flex:1;min-width:0;">
                        <div style="display:flex;align-items:center;gap:5px;">
                            <span style="font-size:13px;font-weight:700;color:var(--text-bright);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${J(E.party_name)}</span>
                            ${z?'<span style="font-family:var(--font-mono);font-size:7px;font-weight:700;color:#5c5;padding:0 3px;background:rgba(92,204,92,0.06);border:1px solid rgba(92,204,92,0.15);">YOU</span>':""}
                        </div>
                        <div style="font-family:var(--font-mono);font-size:9px;color:${E.color};">${J(E.abbreviation)}</div>
                    </div>
                    <span class="pe-col-seats" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:16px;font-weight:700;color:var(--text-bright);">${E.seats}</span>
                    <span class="pe-col-change" style="width:60px;text-align:right;font-family:var(--font-mono);font-size:12px;font-weight:700;color:${P!=null?P>0?"#5c5":P<0?"#c55":"var(--text-dim)":"var(--text-dim)"};">${P!=null?P>0?"▲ "+P:P<0?"▼ "+Math.abs(P):"—":"NEW"}</span>
                    <span class="pe-col-votes" style="width:70px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-bright);">${Se(E.votes||0)}</span>
                    <span class="pe-col-pct" style="width:55px;text-align:right;font-family:var(--font-mono);font-size:12px;color:var(--text-secondary);">${(E.vote_percentage||0).toFixed(1)}%</span>
                    <span class="pe-col-rep" style="width:80px;text-align:right;font-family:var(--font-mono);font-size:10px;font-weight:700;color:${Math.abs(A)<2?"var(--text-dim)":A>0?"#5c5":"#c84"};">${A>0?"+":""}${A.toFixed(1)}% <span style="font-size:8px;color:var(--text-dim);">${Math.abs(A)<2?"proportional":A>0?"overrep.":"underrep."}</span></span>
                </div>`}).join("");let N="";if(u){const E=u.coalition_parties||[],z=u.total_seats||E.reduce((W,It)=>W+(It.seats||0),0),C=z>=r,P=C?"Majority Coalition":"Minority Coalition",T=u.ended_at_tick?u.end_reason||"Ended":"Current Government",A=u.ended_at_tick?"var(--text-dim)":"#5c5",R=u.ended_at_tick?Math.abs(u.ended_at_tick-u.started_at_tick)+" ticks":"Ongoing",Ze=E.map(W=>{const It=o.find(Gt=>Gt.party_id===W.party_id)?.color||"#666";return`<div style="width:${z>0?(W.seats||0)/z*100:0}%;background:${It};height:100%;"></div>`}).join(""),ta=E.map(W=>`<div style="display:flex;align-items:center;gap:4px;">
                        <div style="width:8px;height:8px;background:${o.find(Gt=>Gt.party_id===W.party_id)?.color||"#666"};"></div>
                        <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-secondary);">${J(W.party_name?.slice(0,3)?.toUpperCase()||"?")}</span>
                        <span style="font-family:var(--font-mono);font-size:11px;font-weight:700;color:var(--text-bright);">${W.seats||0}</span>
                    </div>`).join("");N=`<div style="margin:0 20px 16px;background:var(--bg-card);border:1px solid var(--border-main);border-left:3px solid ${w};">
                    <div style="padding:12px 16px;">
                        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                            <div style="display:flex;align-items:center;gap:8px;">
                                <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;letter-spacing:1px;color:var(--text-dim);">GOVERNMENT FORMED</span>
                                <span style="font-family:var(--font-mono);font-size:9px;font-weight:700;padding:2px 8px;color:${A};background:${A}0a;border:1px solid ${A}25;">${J(T.toUpperCase())}</span>
                            </div>
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">Lasted: ${R}</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                            <div style="width:36px;height:36px;background:${w}15;border:1.5px solid ${w};display:flex;align-items:center;justify-content:center;font-family:var(--font-mono);font-size:11px;font-weight:700;color:${w};">${J(g.split(" ").map(W=>W[0]).join(""))}</div>
                            <div>
                                <div style="font-size:14px;font-weight:700;color:var(--text-bright);">${J(g)}</div>
                                <div style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">${x?"President":"Prime Minister"} &middot; ${J(u.pm_party_name||"")} &middot; ${P}</div>
                            </div>
                        </div>
                        <div style="display:flex;height:8px;gap:1px;margin-bottom:8px;">${Ze}</div>
                        <div style="display:flex;gap:10px;align-items:center;">
                            ${ta}
                            <span style="font-family:var(--font-mono);font-size:9px;color:var(--text-dim);">&middot;</span>
                            <span style="font-family:var(--font-mono);font-size:10px;font-weight:700;color:${C?"#5c5":"#c84"};">${z} seats ${C?"(majority +"+(z-r)+")":"(minority, "+(r-z)+" short)"}</span>
                        </div>
                    </div>
                </div>`}S+=`<div style="background:var(--bg-panel);border:1px solid var(--border-main);border-top:1px solid var(--border-main);">
                <!-- Context + Turnout -->
                <div style="display:flex;border-bottom:1px solid var(--border-main);">
                    <div style="flex:1;padding:12px 20px;border-right:1px solid var(--border-main);">
                        <div style="font-family:var(--font-mono);font-size:9px;font-weight:700;letter-spacing:1px;color:var(--text-dim);margin-bottom:4px;">CONTEXT</div>
                        <div style="font-size:13px;color:var(--text-secondary);line-height:1.5;">${J(h.label)}</div>
                    </div>
                    <div style="width:260px;padding:12px 20px;display:flex;gap:16px;flex-shrink:0;">
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TURNOUT</div>
                            <div style="font-family:var(--font-mono);font-size:24px;font-weight:700;color:${l>70?"#5c5":l>60?"#ca5":"#c84"};">${l.toFixed(1)}%</div>
                        </div>
                        <div>
                            <div style="font-family:var(--font-mono);font-size:8px;color:var(--text-dim);letter-spacing:0.5px;">TOTAL VOTES</div>
                            <div style="font-family:var(--font-mono);font-size:13px;font-weight:700;color:var(--text-bright);">${Se(d)}</div>
                        </div>
                    </div>
                </div>

                <!-- Seat bar -->
                <div style="padding:10px 20px;border-bottom:1px solid var(--border-main);">
                    <div style="display:flex;height:18px;gap:1px;margin-bottom:6px;">${k}</div>
                    <div style="position:relative;height:0;">
                        <div style="position:absolute;bottom:0;left:${r/i*100}%;font-family:var(--font-mono);font-size:8px;color:var(--text-dim);transform:translateX(-50%);">▲ ${r} majority</div>
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
                    ${I}
                </div>

                ${N}
            </div>`}return S}).join("");e.innerHTML=`<div style="padding:12px 16px;">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="display:flex;align-items:center;gap:10px;">
                <span style="font-family:var(--font-mono);font-size:14px;font-weight:700;letter-spacing:2px;color:var(--text-bright);">PAST ELECTIONS</span>
                <span style="font-family:var(--font-mono);font-size:10px;color:var(--text-dim);">${dt.length} elections on record</span>
            </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:4px;">${s}</div>
    </div>`}let Z=null,le=!1,Le=!1,de=!1,Pe=!1,ce=!1;function Qe(e){document.querySelectorAll(".pa-subtab").forEach(t=>t.classList.toggle("active",t.dataset.panel===e)),document.querySelectorAll(".pa-panel").forEach(t=>t.classList.toggle("active",t.id==="panel-"+e)),sessionStorage.setItem("party_subtab",e),e==="actions"&&!le&&Z&&(le=!0,De(gt,Z)),e==="parties"&&!Le&&Z&&(Le=!0,ci(gt,Z,"pa-parties-root")),e==="election"&&!de&&Z&&(de=!0,ce?ut(document.getElementById("pa-election-root")):We(gt,Z).then(()=>{ce=!0,ut(document.getElementById("pa-election-root"))})),e==="past-elections"&&!Pe&&Z&&(Pe=!0,zi(gt,Z))}document.getElementById("pa-subtabs").addEventListener("click",e=>{const t=e.target.closest(".pa-subtab");!t||t.classList.contains("active")||Qe(t.dataset.panel)});ia("politics",async e=>{Z=e,We(gt,e).then(({needed:a})=>{if(ce=!0,a){const i=document.querySelector('.pa-subtab[data-panel="election"]');i&&!i.querySelector(".pa-subtab-badge")&&(i.innerHTML+='<span class="pa-subtab-badge"></span>');const r=document.querySelector('.nav-tab[data-tab="politics"]');r&&!r.querySelector(".pa-subtab-badge")&&(r.innerHTML+='<span class="pa-subtab-badge"></span>')}de&&ut(document.getElementById("pa-election-root"))});const t=sessionStorage.getItem("party_subtab");t&&t!=="actions"?Qe(t):(le=!0,await De(gt,e))});
